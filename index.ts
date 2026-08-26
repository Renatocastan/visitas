import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:ti@castan.com.br";

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, x-client-info, apikey, content-type"
    }
  });
}

async function sendToUsers(
  userIds: string[],
  payload: Record<string, unknown>
) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return { sent: 0, failed: 0 };

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id,usuario_id,endpoint,p256dh,auth")
    .in("usuario_id", ids)
    .eq("ativo", true);

  if (error) throw error;

  let sent = 0;
  let failed = 0;

  for (const sub of subs || []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        },
        JSON.stringify(payload),
        {
          TTL: 3600,
          urgency: "high"
        }
      );
      sent++;
    } catch (err: any) {
      failed++;
      const statusCode = Number(err?.statusCode || 0);

      if (statusCode === 404 || statusCode === 410) {
        await supabase
          .from("push_subscriptions")
          .update({ ativo: false, updated_at: new Date().toISOString() })
          .eq("id", sub.id);
      }

      console.error("push failed", sub.id, statusCode, err?.message);
    }
  }

  return { sent, failed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });

  try {
    const body = await req.json().catch(() => ({}));
    const baseUrl = String(body?.url || "");

    // 1) Espelha notificações internas já criadas no Castan.
    if (Array.isArray(body?.notification_ids) && body.notification_ids.length) {
      const { data: notifications, error } = await supabase
        .from("notificacoes")
        .select("id,usuario_id,titulo,mensagem")
        .in("id", body.notification_ids);

      if (error) throw error;

      let sent = 0;
      let failed = 0;

      for (const n of notifications || []) {
        const result = await sendToUsers(
          [n.usuario_id],
          {
            title: n.titulo || "Castan Visitas",
            body: n.mensagem || "Nova atualização.",
            tag: `castan-notificacao-${n.id}`,
            url: baseUrl || "/",
            requireInteraction: true
          }
        );
        sent += result.sent;
        failed += result.failed;
      }

      return json({ ok: true, sent, failed });
    }

    // 2) Confirmação/cancelamento feito pelo cliente.
    if (body?.confirmacao_token) {
      const token = String(body.confirmacao_token);

      const { data: visita, error: visitaError } = await supabase
        .from("visitas")
        .select("id,codigo_imovel,cliente_nome,horario_visita,status,pre_atendimento_id,mostrador_id")
        .eq("confirmacao_token", token)
        .maybeSingle();

      if (visitaError) throw visitaError;
      if (!visita) return json({ ok: false, error: "visita_not_found" }, 404);

      const { data: admins, error: adminError } = await supabase
        .from("usuarios")
        .select("id")
        .eq("tipo", "admin")
        .eq("ativo", true);

      if (adminError) throw adminError;

      const recipients = [
        visita.pre_atendimento_id,
        visita.mostrador_id,
        ...(admins || []).map((u: any) => u.id)
      ].filter(Boolean);

      const cancelled = visita.status === "cancelada";
      const title = cancelled
        ? "⚠️ Cliente cancelou a visita"
        : "✅ Cliente confirmou a visita";

      const msg = cancelled
        ? `${visita.codigo_imovel || ""} - ${visita.cliente_nome || "Cliente"} cancelou a visita das ${String(visita.horario_visita || "").slice(0,5)}.`
        : `${visita.codigo_imovel || ""} - ${visita.cliente_nome || "Cliente"} confirmou a visita das ${String(visita.horario_visita || "").slice(0,5)}.`;

      const result = await sendToUsers(recipients, {
        title,
        body: msg,
        tag: `castan-visita-${visita.id}-${visita.status}`,
        url: baseUrl || "/",
        visita_id: visita.id,
        requireInteraction: true
      });

      return json({ ok: true, ...result });
    }

    return json({ ok: false, error: "invalid_payload" }, 400);
  } catch (err: any) {
    console.error(err);
    return json({ ok: false, error: err?.message || String(err) }, 500);
  }
});
