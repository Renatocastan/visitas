import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { RefreshCw, Bell, Plus, Users, CalendarDays, ListChecks, BarChart3, Home, Save, X, Trash2, MapPin, Upload, Image as ImageIcon, Navigation, ClipboardCheck } from "lucide-react";

const APP_VERSION = "Castan Realtime v2.5.4-responsavel-cancelamento";

const COLORS = ["#B91C1C", "#1E5A8A", "#15803D", "#C05621", "#7E22CE", "#0F766E", "#BE123C", "#2563EB"];

const ROLES = {
  admin: "ADM",
  gestor: "Gestor",
  pre_atendimento: "Pré atendimento",
  captador: "Captador",
  mostrador: "Mostrador",
  fechamento: "Fechamento",
  contratos: "Equipe contratos"
};


const PERMISSOES = [
  ["ver_todas_visitas", "Visualizar todas as visitas"],
  ["criar_visita", "Criar visita"],
  ["editar_todas_visitas", "Editar todas as visitas"],
  ["editar_proprias_visitas", "Editar apenas visitas próprias/envolvidas"],
  ["excluir_visita", "Excluir visita"],
  ["gerenciar_usuarios", "Gerenciar usuários"],
  ["ver_relatorios", "Ver relatórios"],
  ["status_avancou_fechamento", "Usar status Avançou para fechamento"],
  ["status_pos_ok", "Usar status Pós OK"],
  ["status_contrato", "Usar status Virou contrato"],
  ["receber_notificacoes", "Receber notificações"]
];

const DEFAULT_PERMISSOES = {
  admin: {
    ver_todas_visitas:true,
    criar_visita:true,
    editar_todas_visitas:true,
    editar_proprias_visitas:true,
    excluir_visita:true,
    gerenciar_usuarios:true,
    ver_relatorios:true,
    status_avancou_fechamento:true,
    status_pos_ok:true,
    status_contrato:true,
    receber_notificacoes:false
  },
  gestor: {
    ver_todas_visitas:true,
    criar_visita:true,
    editar_todas_visitas:true,
    editar_proprias_visitas:true,
    excluir_visita:false,
    gerenciar_usuarios:false,
    ver_relatorios:true,
    status_avancou_fechamento:false,
    status_pos_ok:false,
    status_contrato:false,
    receber_notificacoes:true
  },
  pre_atendimento: {
    ver_todas_visitas:true,
    criar_visita:true,
    editar_todas_visitas:true,
    editar_proprias_visitas:true,
    excluir_visita:false,
    gerenciar_usuarios:false,
    ver_relatorios:true,
    status_avancou_fechamento:false,
    status_pos_ok:false,
    status_contrato:false,
    receber_notificacoes:true
  },
  captador: {
    ver_todas_visitas:true,
    criar_visita:true,
    editar_todas_visitas:false,
    editar_proprias_visitas:true,
    excluir_visita:false,
    gerenciar_usuarios:false,
    ver_relatorios:false,
    status_avancou_fechamento:false,
    status_pos_ok:false,
    status_contrato:false,
    receber_notificacoes:true
  },
  mostrador: {
    ver_todas_visitas:false,
    criar_visita:false,
    editar_todas_visitas:false,
    editar_proprias_visitas:true,
    excluir_visita:false,
    gerenciar_usuarios:false,
    ver_relatorios:false,
    status_avancou_fechamento:false,
    status_pos_ok:false,
    status_contrato:false,
    receber_notificacoes:true
  },
  fechamento: {
    ver_todas_visitas:true,
    criar_visita:false,
    editar_todas_visitas:true,
    editar_proprias_visitas:true,
    excluir_visita:false,
    gerenciar_usuarios:false,
    ver_relatorios:true,
    status_avancou_fechamento:true,
    status_pos_ok:true,
    status_contrato:false,
    receber_notificacoes:true
  },
  contratos: {
    ver_todas_visitas:false,
    criar_visita:false,
    editar_todas_visitas:true,
    editar_proprias_visitas:true,
    excluir_visita:false,
    gerenciar_usuarios:false,
    ver_relatorios:true,
    status_avancou_fechamento:false,
    status_pos_ok:false,
    status_contrato:true,
    receber_notificacoes:true
  }
};

const STATUS = [
  ["agendada","Agendada"],
  ["confirmada","Confirmada"],
  ["concluida","Concluída"],
  ["nao_apareceu","Não apareceu"],
  ["cancelada","Cancelada"],
  ["remarcada","Remarcada"],
  ["avancou_fechamento","Avançou p/ fechamento"],
  ["pos_ok","Pós OK"],
  ["contrato","Virou contrato"]
];

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const MOTIVOS_CANCELAMENTO = [
  "imprevisto",
  "não responde",
  "outro compromisso",
  "perdeu a hora",
  "esqueceu",
  "proprietário não pode acompanhar",
  "sem chave",
  "cancelada no fechamento",
  "outros"
];

const HORARIOS_VISITA = Array.from({length:61},(_,i)=>{
  const total=8*60+i*10;
  const h=Math.floor(total/60);
  const m=total%60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
});

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const dateStr = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

const getStartOfWeek = (base = new Date()) => {
  const d = new Date(base);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() - d.getDay());
  return d;
};

const getEndOfWeek = (base = new Date()) => {
  const d = getStartOfWeek(base);
  d.setDate(d.getDate()+6);
  return d;
};

const getStartOfMonth = (base = new Date()) => {
  const d = new Date(base.getFullYear(), base.getMonth(), 1);
  d.setHours(0,0,0,0);
  return d;
};

const getEndOfMonth = (base = new Date()) => {
  const d = new Date(base.getFullYear(), base.getMonth()+1, 0);
  d.setHours(0,0,0,0);
  return d;
};

const brMoney = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const brDateTime = v => v ? new Date(v).toLocaleString("pt-BR") : "";
const statusLabel = v => STATUS.find(s => s[0] === v)?.[1] || v || "";
const statusClass = v => `status ${v || "agendada"}`;
const normalizeMoney = v => (v === "" || v === null || v === undefined) ? null : Number(String(v).replace(".", "").replace(",", "."));
const mapLink = (lat,lng) => lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : "";
const wazeAddressLink = address => address ? `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes` : "";
const wazeLink = (lat, lng) => lat && lng ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes` : "";

function exportCsv(filename, rows){
  const csv=rows.map(r=>r.map(c=>`"${String(c??"").replaceAll('"','""')}"`).join(";")).join("\n");
  const b=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(b);
  a.download=filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function emptyVisit(user, preUsers, mostradores){
  return {
    id:null,
    codigo_imovel:"",
    endereco_imovel:"",
    proprietario_nome:"",
    proprietario_contato:"",
    cliente_nome:"",
    cliente_contato:"",
    local_chave:"",
    pre_atendimento_id:user?.id||"",
    mostrador_id:mostradores[0]?.id||"",
    data_visita:todayISO(),
    horario_visita:"09:00",
    status:"agendada",
    observacao:"",
    checklist:false,
    valor_proposta:"",
    contrato_fechado:false,
    latitude:null,
    longitude:null,
    geolocalizacao_data:null,
    atualizar_fotos:false,
    checklist_ok:false,
    motivo_cancelamento:"",
    motivo_cancelamento_outros:""
  };
}

export default function App(){
  const [usuarios,setUsuarios]=useState([]);
  const [visitas,setVisitas]=useState([]);
  const [notificacoes,setNotificacoes]=useState([]);
  const [acoes,setAcoes]=useState([]);
  const [fotos,setFotos]=useState([]);

  const [currentUserId,setCurrentUserId]=useState(localStorage.getItem("castan_logged_user")||"");
  const [loginUserId,setLoginUserId]=useState("");
  const [loginPassword,setLoginPassword]=useState("");

  const [view,setView]=useState("inicio");
  const [loading,setLoading]=useState(true);
  const [lastSync,setLastSync]=useState("");
  const [modalVisit,setModalVisit]=useState(null);
  const [modalUser,setModalUser]=useState(null);
  const [agendaBloqueios,setAgendaBloqueios]=useState([]);
  const [bloqueioForm,setBloqueioForm]=useState({
    data_bloqueio:todayISO(),
    horario_inicio:"09:00",
    horario_fim:"10:00",
    justificativa:""
  });
  const [newPassword,setNewPassword]=useState("");

  const savedFilters = (()=>{ try{return JSON.parse(localStorage.getItem("castan_saved_filters")||"{}")}catch{return {}} })();
  const [reportDate,setReportDate]=useState(todayISO());
  const [reportStart,setReportStart]=useState(todayISO());
  const [reportEnd,setReportEnd]=useState(todayISO());

  const [dashboardPeriod,setDashboardPeriod]=useState("month");
  const [dashboardStart,setDashboardStart]=useState(todayISO());
  const [dashboardEnd,setDashboardEnd]=useState(todayISO());
  const [dashboardPre,setDashboardPre]=useState("all");
  const [dashboardMostrador,setDashboardMostrador]=useState("all");
  const [dashboardCaptador,setDashboardCaptador]=useState("all");
  const [dashboardStatus,setDashboardStatus]=useState("all");

  const [canceladasBusca,setCanceladasBusca]=useState("");
  const [canceladasPre,setCanceladasPre]=useState("all");
  const [canceladasMostrador,setCanceladasMostrador]=useState("all");
  const [canceladasMotivo,setCanceladasMotivo]=useState("all");
  const [canceladasStart,setCanceladasStart]=useState("");
  const [canceladasEnd,setCanceladasEnd]=useState("");
  const [filterPre,setFilterPre]=useState(savedFilters.filterPre||"all");
  const [filterMostrador,setFilterMostrador]=useState(savedFilters.filterMostrador||"all");
  const [filterStatus,setFilterStatus]=useState(savedFilters.filterStatus||"all");
  const [searchTerm,setSearchTerm]=useState(savedFilters.searchTerm||"");

  const [month,setMonth]=useState(new Date().getMonth());
  const [year,setYear]=useState(new Date().getFullYear());
  const [calendarMode,setCalendarMode]=useState(localStorage.getItem("castan_calendar_mode") || "month");
  const [weekStart,setWeekStart]=useState(getStartOfWeek());
  const [currentDay,setCurrentDay]=useState(todayISO());

  const [toast,setToast]=useState([]);
  const [showNotifications,setShowNotifications]=useState(false);
  const seenNotificationsRef = useRef(new Set());
  const touchStart=useRef(0);
  const agendaConflictConfirmedRef=useRef(new Set());

  const user=usuarios.find(u=>u.id===currentUserId);
  const isAdmin=user?.tipo==="admin";
  const isGestor=user?.tipo==="gestor";
  const isPre=user?.tipo==="pre_atendimento";
  const isCaptador=user?.tipo==="captador";
  const isMostrador=user?.tipo==="mostrador";
  const isFechamento=user?.tipo==="fechamento";
  const isContratos=user?.tipo==="contratos";

  function hasPerm(chave, fallback=false){
    if(!user) return false;
    const defaults = DEFAULT_PERMISSOES[user.tipo] || {};
    const explicit = user.permissoes || {};
    if(Object.prototype.hasOwnProperty.call(explicit, chave)) return Boolean(explicit[chave]);
    if(Object.prototype.hasOwnProperty.call(defaults, chave)) return Boolean(defaults[chave]);
    return fallback;
  }

  const canSeeAllVisits = hasPerm("ver_todas_visitas", isAdmin||isGestor||isPre||isCaptador||isFechamento);
  const canCreateVisit = hasPerm("criar_visita", isAdmin||isGestor||isPre);
  const canManageUsers = isAdmin || hasPerm("gerenciar_usuarios", false);
  const canDeleteVisits = isPre || hasPerm("excluir_visita", false);
  const canViewReports = hasPerm("ver_relatorios", isAdmin||isGestor||isPre||isFechamento||isContratos);
  const canStatusAvancouFechamento = hasPerm("status_avancou_fechamento", isFechamento);
  const canStatusPosOk = hasPerm("status_pos_ok", isFechamento);
  const canStatusContrato = hasPerm("status_contrato", isContratos);

  const isContratoVisibleVisit = v => Boolean(v?.checklist) || ["avancou_fechamento","pos_ok","contrato"].includes(v?.status);

  const preUsers=usuarios.filter(u=>u.tipo==="pre_atendimento"&&u.ativo!==false);
  const mostradores=usuarios.filter(u=>u.tipo==="mostrador"&&u.ativo!==false);
  const captadores=usuarios.filter(u=>u.tipo==="captador"&&u.ativo!==false);
  const fechamentoUsers=usuarios.filter(u=>u.tipo==="fechamento"&&u.ativo!==false);
  const contratosUsers=usuarios.filter(u=>u.tipo==="contratos"&&u.ativo!==false);


  const loadAll=useCallback(async()=>{
    try{
      const [u,v,n,a,ft,bq]=await Promise.all([
        supabase.from("usuarios").select("*").order("created_at",{ascending:true}),
        supabase.from("visitas").select("*").order("data_visita",{ascending:true}).order("horario_visita",{ascending:true}),
        supabase.from("notificacoes").select("*").order("created_at",{ascending:false}).limit(300),
        supabase.from("acoes_visita").select("*").order("created_at",{ascending:false}).limit(800),
        supabase.from("fotos_visita").select("*").order("created_at",{ascending:false}).limit(800),
        supabase.from("agenda_bloqueios").select("*").order("data_bloqueio",{ascending:true}).order("horario_inicio",{ascending:true})
      ]);

      if(!u.error)setUsuarios(u.data||[]);
      if(!v.error)setVisitas(v.data||[]);
      if(!a.error)setAcoes(a.data||[]);
      if(!ft.error)setFotos(ft.data||[]);
      if(!bq.error)setAgendaBloqueios(bq.data||[]);

      if(!n.error){
        const newNotifications=n.data||[];
        setNotificacoes(newNotifications);

        if(currentUserId && "Notification" in window && Notification.permission==="default"){
          Notification.requestPermission().catch(()=>{});
        }

        if(currentUserId){
          const myUnread = newNotifications
            .filter(item=>item.usuario_id===currentUserId)
            .filter(item=>!seenNotificationsRef.current.has(item.id))
            .slice(0,5);

          if(myUnread.length){
            setToast(myUnread);
            myUnread.forEach(item=>{
              seenNotificationsRef.current.add(item.id);
              if("Notification" in window && Notification.permission==="granted"){
                try{
                  new Notification(item.titulo||"Castan Visitas", {
                    body:item.mensagem||"Nova notificação na agenda.",
                    tag:item.id
                  });
                }catch{}
              }
            });
            setTimeout(()=>setToast([]),7000);
          }
        }
      }

      setLastSync(new Date().toLocaleTimeString("pt-BR"));
    } finally{
      setLoading(false);
    }
  },[currentUserId]);

  useEffect(()=>{loadAll()},[loadAll]);

  useEffect(()=>{
    if(currentUserId)localStorage.setItem("castan_logged_user",currentUserId);
    else localStorage.removeItem("castan_logged_user");
  },[currentUserId]);

  useEffect(()=>{
    localStorage.setItem("castan_saved_filters",JSON.stringify({filterPre,filterMostrador,filterStatus,searchTerm}));
  },[filterPre,filterMostrador,filterStatus,searchTerm]);

  useEffect(()=>{
    localStorage.setItem("castan_calendar_mode",calendarMode);
  },[calendarMode]);

  useEffect(()=>{
    const hoje = new Date();

    if(dashboardPeriod==="today"){
      setDashboardStart(todayISO());
      setDashboardEnd(todayISO());
    }

    if(dashboardPeriod==="week"){
      setDashboardStart(dateStr(getStartOfWeek(hoje)));
      setDashboardEnd(dateStr(getEndOfWeek(hoje)));
    }

    if(dashboardPeriod==="month"){
      setDashboardStart(dateStr(getStartOfMonth(hoje)));
      setDashboardEnd(dateStr(getEndOfMonth(hoje)));
    }
  },[dashboardPeriod]);

  useEffect(()=>{
    const ch=supabase.channel("castan-realtime-global")
      .on("postgres_changes",{event:"*",schema:"public",table:"usuarios"},loadAll)
      .on("postgres_changes",{event:"*",schema:"public",table:"visitas"},loadAll)
      .on("postgres_changes",{event:"*",schema:"public",table:"notificacoes"},loadAll)
      .on("postgres_changes",{event:"*",schema:"public",table:"acoes_visita"},loadAll)
      .on("postgres_changes",{event:"*",schema:"public",table:"fotos_visita"},loadAll)
      .on("postgres_changes",{event:"*",schema:"public",table:"agenda_bloqueios"},loadAll)
      .subscribe();

    const interval=setInterval(loadAll,3000);
    const visibility=()=>{if(!document.hidden)loadAll()};
    window.addEventListener("focus",loadAll);
    document.addEventListener("visibilitychange",visibility);

    return()=>{
      supabase.removeChannel(ch);
      clearInterval(interval);
      window.removeEventListener("focus",loadAll);
      document.removeEventListener("visibilitychange",visibility);
    };
  },[loadAll]);

  function getUser(id){return usuarios.find(u=>u.id===id)}
  function colorForUser(id){const idx=Math.max(0,usuarios.findIndex(u=>u.id===id)); return COLORS[idx%COLORS.length]}

  function canEditVisit(v){
    if(!user) return false;

    if(isAdmin || isGestor || isPre || isFechamento || isContratos){
      return true;
    }

    if(isMostrador && v.mostrador_id === user.id){
      return true;
    }

    if(isCaptador){
      return v.created_by === user.id || v.pre_atendimento_id === user.id || v.mostrador_id === user.id;
    }

    if(hasPerm("editar_todas_visitas", false)){
      return true;
    }

    if(hasPerm("editar_proprias_visitas", false)){
      return (
        v.created_by === user.id ||
        v.pre_atendimento_id === user.id ||
        v.mostrador_id === user.id
      );
    }

    return false;
  }

  async function notifyMany(ids,titulo,mensagem){
    const unique=[...new Set((ids||[]).filter(Boolean))];

    const filtered = unique.filter(id=>{
      const u = usuarios.find(x=>x.id===id);
      return u && u.tipo !== "admin" && u.ativo !== false && ((u.permissoes&&Object.prototype.hasOwnProperty.call(u.permissoes,"receber_notificacoes")) ? u.permissoes.receber_notificacoes : (DEFAULT_PERMISSOES[u.tipo]?.receber_notificacoes!==false));
    });

    if(filtered.length){
      await supabase.from("notificacoes").insert(filtered.map(usuario_id=>({usuario_id,titulo,mensagem,lida:false})));
    }
  }

  async function marcarNotificacoesComoLidas(){
    if(!user?.id) return;
    await supabase
      .from("notificacoes")
      .update({lida:true})
      .eq("usuario_id", user.id)
      .eq("lida", false);
    await loadAll();
  }

  function getEnvolvidosVisita(v){
    return [v?.pre_atendimento_id, v?.mostrador_id].filter(Boolean);
  }

  function agendaBloqueadaPara(mostradorId,dataVisita,horarioVisita){
    const hora=String(horarioVisita||"").slice(0,5);
    return agendaBloqueios.find(b=>
      b.ativo!==false &&
      b.usuario_id===mostradorId &&
      b.data_bloqueio===dataVisita &&
      hora>=String(b.horario_inicio||"00:00").slice(0,5) &&
      hora<String(b.horario_fim||"23:59").slice(0,5)
    );
  }

  async function salvarBloqueioAgenda(){
    if(!isMostrador)return alert("Somente mostradores podem bloquear a própria agenda.");

    if(!bloqueioForm.data_bloqueio || !bloqueioForm.horario_inicio || !bloqueioForm.horario_fim){
      return alert("Informe o dia, horário inicial e horário final do bloqueio.");
    }

    if(String(bloqueioForm.horario_fim).slice(0,5)<=String(bloqueioForm.horario_inicio).slice(0,5)){
      return alert("O horário final deve ser maior que o horário inicial.");
    }

    if(!String(bloqueioForm.justificativa||"").trim()){
      return alert("A justificativa do bloqueio é obrigatória.");
    }

    const {error}=await supabase.from("agenda_bloqueios").insert({
      usuario_id:user.id,
      data_bloqueio:bloqueioForm.data_bloqueio,
      horario_inicio:String(bloqueioForm.horario_inicio).slice(0,5),
      horario_fim:String(bloqueioForm.horario_fim).slice(0,5),
      justificativa:bloqueioForm.justificativa.trim(),
      ativo:true
    });

    if(error)return alert(error.message);

    setBloqueioForm({
      data_bloqueio:todayISO(),
      horario_inicio:"09:00",
      horario_fim:"10:00",
      justificativa:""
    });

    await loadAll();
    alert("Agenda bloqueada com sucesso.");
  }

  async function removerBloqueioAgenda(id){
    const ok=window.confirm("Deseja remover este bloqueio da agenda?");
    if(!ok)return;

    const {error}=await supabase.from("agenda_bloqueios").update({ativo:false}).eq("id",id);
    if(error)return alert(error.message);
    await loadAll();
  }

  function doLogin(){
    const selected=usuarios.find(u=>u.id===loginUserId);
    if(!selected)return alert("Selecione seu usuário.");
    if(String(selected.senha||"")!==String(loginPassword||""))return alert("Senha incorreta.");
    setCurrentUserId(selected.id);
    setLoginPassword("");
  }

  function doLogout(){
    setCurrentUserId("");
    setLoginUserId("");
    setLoginPassword("");
    setView("inicio");
  }

  async function saveVisit(){
    const f={...modalVisit};

    if(
      !f.codigo_imovel ||
      !f.endereco_imovel ||
      !f.proprietario_nome ||
      !f.proprietario_contato ||
      !f.cliente_nome ||
      !f.cliente_contato ||
      !String(f.local_chave||"").trim() ||
      !user?.id ||
      !f.mostrador_id ||
      !f.data_visita ||
      !f.horario_visita ||
      !f.status
    ){
      return alert("Todos os campos são obrigatórios, exceto observações.");
    }

    if(f.status==="avancou_fechamento" && !canStatusAvancouFechamento){
      return alert("Somente a equipe de fechamento pode alterar o status para Avançou para fechamento.");
    }

    if(f.status==="pos_ok" && !canStatusPosOk){
      return alert("Somente a equipe de fechamento pode alterar o status para Pós OK.");
    }

    if(f.status==="contrato" && !canStatusContrato){
      return alert("Somente a equipe contratos pode alterar o status para Virou contrato.");
    }

    if(!f.id){
      const agora = new Date();
      const dataHoraVisita = new Date(`${f.data_visita}T${String(f.horario_visita||"00:00").slice(0,5)}:00`);
      if(dataHoraVisita < agora){
        return alert("Não é permitido criar visitas retroativas ao dia e horário atual.");
      }
    }

    if(isFechamento && f.status==="avancou_fechamento" && !normalizeMoney(f.valor_proposta)){
      return alert("Para avançar para fechamento, informe o valor da proposta.");
    }

    if(isContratos && f.status==="contrato"){
      if(!f.contrato_fechado){
        return alert('Para salvar como Virou contrato, ative o campo "Virou contrato".');
      }

      if(!normalizeMoney(f.valor_proposta)){
        return alert("Atualize o valor da proposta antes de salvar o contrato.");
      }

      const confirmaValorContrato = window.confirm("O VALOR DO CONTRATO ESTA CORRETO?");
      if(!confirmaValorContrato){
        return;
      }
    }

    if(isFechamento && f.status==="avancou_fechamento" && !f.checklist_ok){
      return alert("Para avançar para fechamento, marque o Check list OK / enviar para contratos.");
    }

    if(f.status==="cancelada" && !f.motivo_cancelamento){
      return alert("Selecione o motivo do cancelamento.");
    }

    if(f.status==="cancelada" && f.motivo_cancelamento==="outros" && !String(f.motivo_cancelamento_outros||"").trim()){
      return alert('Descreva o motivo em "outros".');
    }

    const bloqueioAgenda = agendaBloqueadaPara(f.mostrador_id,f.data_visita,f.horario_visita);
    if(bloqueioAgenda){
      return alert("AGENDA BLOQUEADA, INCLUIR OUTRO MOSTRADOR");
    }

    const old=f.id?visitas.find(v=>v.id===f.id):null;

    const chaveConflito = `${f.mostrador_id}|${f.data_visita}|${String(f.horario_visita || "").slice(0,5)}|${f.id||"novo"}`;
    const conflitoAgenda = visitas.find(v =>
      v.id !== f.id &&
      v.status !== "cancelada" &&
      v.mostrador_id === f.mostrador_id &&
      v.data_visita === f.data_visita &&
      String(v.horario_visita || "").slice(0,5) === String(f.horario_visita || "").slice(0,5)
    );

    if(conflitoAgenda && !agendaConflictConfirmedRef.current.has(chaveConflito)){
      const continuar = window.confirm("USUARIO COM AGENDA OCUPADA, DESEJA CONTINUAR?");
      if(!continuar) return;
      agendaConflictConfirmedRef.current.add(chaveConflito);
    }

    if(
      isMostrador &&
      f.status!==old?.status &&
      ["concluida","nao_apareceu","cancelada","remarcada"].includes(f.status) &&
      !String(f.observacao||"").trim()
    ){
      return alert("Para alterar para este status, o mostrador precisa preencher uma observação.");
    }

    if(
      isMostrador &&
      f.status === "concluida" &&
      f.atualizar_fotos
    ){
      const fotosOk = window.confirm("AS FOTOS FORAM ATUALIZADAS?");
      if(!fotosOk) return;
    }

    if(isFechamento&&f.checklist&&!normalizeMoney(f.valor_proposta)){
      return alert("Para marcar Check List, o fechamento precisa informar o valor da proposta.");
    }

    f.pre_atendimento_id=user?.id;

    const payload={
      codigo_imovel:f.codigo_imovel,
      endereco_imovel:f.endereco_imovel,
      proprietario_nome:f.proprietario_nome,
      proprietario_contato:f.proprietario_contato,
      cliente_nome:f.cliente_nome,
      cliente_contato:f.cliente_contato,
      local_chave:f.local_chave||null,
      pre_atendimento_id:f.pre_atendimento_id,
      mostrador_id:f.mostrador_id,
      data_visita:f.data_visita,
      horario_visita:f.horario_visita,
      status:f.status||"agendada",
      observacao:f.observacao||null,
      checklist:Boolean(f.checklist),
      valor_proposta:normalizeMoney(f.valor_proposta),
      contrato_fechado:Boolean(f.contrato_fechado),
      latitude:f.latitude||null,
      longitude:f.longitude||null,
      geolocalizacao_data:f.geolocalizacao_data||null,
      atualizar_fotos:Boolean(f.atualizar_fotos),
      checklist_ok:Boolean(f.checklist_ok),
      motivo_cancelamento:f.status==="cancelada"?(f.motivo_cancelamento||null):null,
      motivo_cancelamento_outros:f.status==="cancelada"&&f.motivo_cancelamento==="outros"?(f.motivo_cancelamento_outros||null):null,
      created_by:f.created_by||user?.id||null
    };

    if(f.id){
      const {error}=await supabase.from("visitas").update(payload).eq("id",f.id);
      if(error)return alert(error.message);

      if(old?.status!==payload.status){
        await supabase.from("acoes_visita").insert({
          visita_id:f.id,
          usuario_id:user?.id,
          tipo_acao:isPre?"alteracao_pre_atendimento":"alteracao_status",
          status_anterior:old?.status||null,
          status_novo:payload.status,
          observacao:payload.observacao,
          valor_proposta:payload.valor_proposta
        });

        await notifyMany(
          getEnvolvidosVisita(payload),
          "Atualização da visita",
          `${payload.codigo_imovel} - ${payload.cliente_nome}: ${statusLabel(payload.status)}.`
        );

        if(["concluida","avancou_fechamento"].includes(payload.status)){
          await notifyMany(
            fechamentoUsers.map(u=>u.id),
            "Visita pronta para fechamento",
            `${payload.codigo_imovel} - ${payload.cliente_nome} foi atualizada para ${statusLabel(payload.status)}.`
          );
        }

        if(payload.status==="pos_ok"){
          await notifyMany(
            contratosUsers.map(u=>u.id),
            "Pós OK liberado",
            `${payload.codigo_imovel} - ${payload.cliente_nome} recebeu Pós OK e pode seguir para contratos.`
          );
        }

        if(payload.status==="contrato"){
          await notifyMany(
            getEnvolvidosVisita(payload),
            "Visita virou contrato",
            `${payload.codigo_imovel} - ${payload.cliente_nome} virou contrato.`
          );
        }
      }

      if(!old?.atualizar_fotos && payload.atualizar_fotos){
        await supabase.from("acoes_visita").insert({
          visita_id:f.id,
          usuario_id:user?.id,
          tipo_acao:"solicitacao_atualizar_fotos",
          status_anterior:old?.status||null,
          status_novo:payload.status,
          observacao:"Solicitada atualização de fotos da visita."
        });

        await notifyMany(
          [payload.mostrador_id],
          "Atualizar fotos da visita",
          `${payload.codigo_imovel} - ${payload.cliente_nome}: atualizar fotos da visita.`
        );
      }

      if(!old?.checklist&&payload.checklist){
        await supabase.from("acoes_visita").insert({
          visita_id:f.id,
          usuario_id:user?.id,
          tipo_acao:"checklist",
          status_anterior:old?.status||null,
          status_novo:payload.status,
          observacao:payload.observacao,
          valor_proposta:payload.valor_proposta
        });

        await notifyMany(
          [...fechamentoUsers.map(u=>u.id), ...getEnvolvidosVisita(payload)],
          "Check List acionado",
          `${payload.codigo_imovel} - ${payload.cliente_nome} entrou em check list.`
        );
      }

    } else {
      const {data,error}=await supabase.from("visitas").insert(payload).select("*").single();
      if(error)return alert(error.message);

      await supabase.from("acoes_visita").insert({
        visita_id:data.id,
        usuario_id:user?.id,
        tipo_acao:"criacao_visita",
        status_novo:payload.status,
        observacao:payload.observacao
      });

      await notifyMany(
        [payload.mostrador_id,payload.pre_atendimento_id],
        "Nova visita agendada",
        `${payload.codigo_imovel} - ${payload.cliente_nome} em ${payload.data_visita} às ${String(payload.horario_visita).slice(0,5)}.`
      );

      if(payload.atualizar_fotos){
        await supabase.from("acoes_visita").insert({
          visita_id:data.id,
          usuario_id:user?.id,
          tipo_acao:"solicitacao_atualizar_fotos",
          status_novo:payload.status,
          observacao:"Solicitada atualização de fotos da visita."
        });

        await notifyMany(
          [payload.mostrador_id],
          "Atualizar fotos da visita",
          `${payload.codigo_imovel} - ${payload.cliente_nome}: atualizar fotos da visita.`
        );
      }
    }

    setModalVisit(null);
    await loadAll();
  }

  async function deleteVisit(id){
    if(!isAdmin&&!isGestor)return alert("Somente ADM/Gestor pode excluir visitas.");
    if(!confirm("TEM CERTEZA QUE DESEJA ESXCLUIR?"))return;
    await supabase.from("visitas").delete().eq("id",id);
    setModalVisit(null);
    await loadAll();
  }

  async function alterarMinhaSenha(){
    if(!newPassword || String(newPassword).length < 4){
      return alert("Informe uma senha com pelo menos 4 caracteres.");
    }

    await supabase
      .from("usuarios")
      .update({senha:newPassword})
      .eq("id", user.id);

    setNewPassword("");
    alert("Senha alterada com sucesso.");
    await loadAll();
  }

  async function saveUser(){
    const u=modalUser;
    if(!u.nome||!u.tipo)return alert("Informe nome e perfil.");
    if(!u.id&&!u.senha)return alert("Informe uma senha inicial para o usuário.");

    if(u.id){
      await supabase.from("usuarios").update({
        nome:u.nome,
        email:u.email||null,
        tipo:u.tipo,
        ...(isAdmin ? {senha:u.senha||"123456"} : {}),
        ativo:u.ativo!==false,
        ...(isAdmin ? {permissoes:u.permissoes||{}} : {})
      }).eq("id",u.id);
    } else {
      await supabase.from("usuarios").insert({
        nome:u.nome,
        email:u.email||null,
        tipo:u.tipo,
        ...(isAdmin ? {senha:u.senha||"123456"} : {}),
        ativo:true,
        permissoes:u.permissoes||{}
      });
    }

    setModalUser(null);
    await loadAll();
  }

  async function deleteUser(id){
    if(!isAdmin&&!isGestor)return;
    if(!confirm("Desativar usuário?"))return;
    await supabase.from("usuarios").update({ativo:false}).eq("id",id);
    await loadAll();
  }

  function captureLocationForModal(){
    if(!navigator.geolocation) return alert("Geolocalização não disponível neste aparelho.");
    navigator.geolocation.getCurrentPosition(pos=>{
      setModalVisit(f=>({...f,latitude:pos.coords.latitude,longitude:pos.coords.longitude,geolocalizacao_data:new Date().toISOString()}));
      alert("Localização capturada com sucesso.");
    },()=>alert("Não foi possível capturar a localização. Verifique a permissão do navegador."),{enableHighAccuracy:true,timeout:12000});
  }

  async function uploadVisitFiles(files){
    if(!modalVisit?.id) return alert("Salve a visita antes de anexar fotos/checklist.");

    const list=Array.from(files||[]);
    if(!list.length)return;

    for(const file of list){
      const safeName=file.name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9._-]/g,"-");
      const path=`visitas/${modalVisit.id}/${Date.now()}-${safeName}`;
      const up=await supabase.storage.from("visita-fotos").upload(path,file,{upsert:false});

      if(up.error){
        alert(up.error.message);
        continue;
      }

      const pub=supabase.storage.from("visita-fotos").getPublicUrl(path);

      const { error: insertError } = await supabase.from("fotos_visita").insert({
        visita_id: modalVisit.id,
        usuario_id: user?.id,
        nome_arquivo: file.name,
        tipo_arquivo: file.type,
        url_arquivo: pub.data.publicUrl,
        caminho_arquivo: path
      });

      if(insertError){
        alert(insertError.message);
        continue;
      }

      await supabase.from("acoes_visita").insert({
        visita_id:modalVisit.id,
        usuario_id:user?.id,
        tipo_acao:"upload_foto_checklist",
        observacao:`Arquivo anexado: ${file.name}`
      });
    }

    await loadAll();
    alert("Arquivo(s) anexado(s) com sucesso.");
  }

  const visibleVisits=useMemo(()=>{
    const q=String(searchTerm||"").toLowerCase().trim();
    return visitas.filter(v=>{
      if(!canSeeAllVisits && !(v.created_by===user?.id || v.pre_atendimento_id===user?.id || v.mostrador_id===user?.id)) return false;
      if(isContratos && !isContratoVisibleVisit(v)) return false;
      const byPre=filterPre==="all"||v.pre_atendimento_id===filterPre;
      const byMostrador=filterMostrador==="all"||v.mostrador_id===filterMostrador;
      const byStatus=filterStatus==="all"||v.status===filterStatus;
      const haystack=[
        v.codigo_imovel,
        v.endereco_imovel,
        v.cliente_nome,
        v.cliente_contato,
        v.proprietario_nome,
        v.proprietario_contato,
        statusLabel(v.status),
        getUser(v.pre_atendimento_id)?.nome,
        getUser(v.mostrador_id)?.nome
      ].join(" ").toLowerCase();

      const bySearch=!q||haystack.includes(q);
      return byPre&&byMostrador&&byStatus&&bySearch;
    });
  },[visitas,filterPre,filterMostrador,filterStatus,searchTerm,usuarios,isContratos,user?.id,canSeeAllVisits]);

  const todayVisits=visibleVisits
    .filter(v=>v.data_visita===todayISO()&&v.status!=="cancelada")
    .sort((a,b)=>String(a.horario_visita).localeCompare(String(b.horario_visita)));

  const reportVisits=visitas.filter(v=>v.data_visita>=reportStart && v.data_visita<=reportEnd);

  const buildReport=arr=>({
    visitas:arr.length,
    concluidas:arr.filter(v=>["concluida","avancou_fechamento","pos_ok","contrato"].includes(v.status)).length,
    desmarcadas:arr.filter(v=>["cancelada","nao_apareceu"].includes(v.status)).length,
    fechamento:arr.filter(v=>v.checklist||v.status==="avancou_fechamento"||v.status==="pos_ok"||v.status==="contrato").length,
    contratos:arr.filter(v=>v.contrato_fechado||v.status==="contrato").length,
    valor:arr.reduce((s,v)=>s+Number(v.valor_proposta||0),0)
  });

  const reportByPre=preUsers.map(p=>({nome:p.nome,...buildReport(reportVisits.filter(v=>v.pre_atendimento_id===p.id))}));
  const reportByMostrador=mostradores.map(m=>({nome:m.nome,...buildReport(reportVisits.filter(v=>v.mostrador_id===m.id))}));

  const dashboardVisits=visitas.filter(v=>{
    const byDate = v.data_visita>=dashboardStart && v.data_visita<=dashboardEnd;
    const byPre = dashboardPre==="all" || v.pre_atendimento_id===dashboardPre;
    const byMostrador = dashboardMostrador==="all" || v.mostrador_id===dashboardMostrador;
    const byCaptador = dashboardCaptador==="all" || v.created_by===dashboardCaptador;
    const byStatus = dashboardStatus==="all" || v.status===dashboardStatus;
    return byDate && byPre && byMostrador && byCaptador && byStatus;
  });

  const statusResumo=STATUS.map(([id,label])=>({
    id,
    label,
    total:dashboardVisits.filter(v=>v.status===id).length
  })).filter(x=>x.total>0);

  const rankingPre=preUsers.map(p=>({
    nome:p.nome,
    total:dashboardVisits.filter(v=>v.pre_atendimento_id===p.id).length
  })).sort((a,b)=>b.total-a.total);

  const rankingMostradores=mostradores.map(m=>({
    nome:m.nome,
    total:dashboardVisits.filter(v=>v.mostrador_id===m.id).length
  })).sort((a,b)=>b.total-a.total);

  const rankingCaptadores=captadores.map(c=>({
    nome:c.nome,
    total:dashboardVisits.filter(v=>v.created_by===c.id).length
  })).sort((a,b)=>b.total-a.total);

  const totalDashboard = dashboardVisits.length;
  const concluidasDashboard = dashboardVisits.filter(v=>["concluida","avancou_fechamento","pos_ok","contrato"].includes(v.status)).length;
  const canceladasDashboard = dashboardVisits.filter(v=>v.status==="cancelada").length;
  const contratosDashboard = dashboardVisits.filter(v=>v.status==="contrato" || v.contrato_fechado).length;

  const conversaoDashboard = totalDashboard ? Math.round((contratosDashboard/totalDashboard)*100) : 0;
  const cancelamentoDashboard = totalDashboard ? Math.round((canceladasDashboard/totalDashboard)*100) : 0;
  const conclusaoDashboard = totalDashboard ? Math.round((concluidasDashboard/totalDashboard)*100) : 0;

  const visitasContrato=dashboardVisits
    .filter(v=>v.status==="contrato" || v.contrato_fechado)
    .sort((a,b)=>String(b.data_visita||"").localeCompare(String(a.data_visita||"")))
    .slice(0,20);

  const visitasCanceladas=visitas
    .filter(v=>v.status==="cancelada")
    .sort((a,b)=>(String(b.data_visita||"")+String(b.horario_visita||"")).localeCompare(String(a.data_visita||"")+String(a.horario_visita||"")));
const visitasCanceladasBase=visitas
    .filter(v=>v.status==="cancelada")
    .sort((a,b)=>(String(b.data_visita||"")+String(b.horario_visita||"")).localeCompare(String(a.data_visita||"")+String(a.horario_visita||"")));

  const visitasCanceladasFiltradas=visitasCanceladasBase.filter(v=>{
    const q=String(canceladasBusca||"").toLowerCase().trim();

    const texto=[
      v.codigo_imovel,
      v.cliente_nome,
      v.endereco_imovel,
      v.proprietario_nome,
      v.cliente_contato,
      v.proprietario_contato,
      v.motivo_cancelamento,
      v.motivo_cancelamento_outros,
      getUser(v.pre_atendimento_id)?.nome,
      getUser(v.mostrador_id)?.nome
    ].join(" ").toLowerCase();

    const bySearch=!q || texto.includes(q);
    const byPre=canceladasPre==="all" || v.pre_atendimento_id===canceladasPre;
    const byMostrador=canceladasMostrador==="all" || v.mostrador_id===canceladasMostrador;
    const byMotivo=canceladasMotivo==="all" || v.motivo_cancelamento===canceladasMotivo;
    const byStart=!canceladasStart || v.data_visita>=canceladasStart;
    const byEnd=!canceladasEnd || v.data_visita<=canceladasEnd;

    return bySearch && byPre && byMostrador && byMotivo && byStart && byEnd;
  });

  const minhaAgendaVisits=visitas
    .filter(v=>{
      if(isFechamento){
        return v.status==="concluida";
      }

      if(isContratos){
        return v.status==="avancou_fechamento" && Boolean(v.checklist_ok);
      }

      return ["agendada","confirmada"].includes(v.status);
    })
    .filter(v=>{
      if(isFechamento) return true;
      if(isAdmin||isGestor) return true;
      if(isContratos) return isContratoVisibleVisit(v);
      return v.pre_atendimento_id===user?.id || v.mostrador_id===user?.id || v.created_by===user?.id;
    })
    .sort((a,b)=>(a.data_visita+String(a.horario_visita)).localeCompare(b.data_visita+String(b.horario_visita)));

  const visitasFechamentoConsulta=visitas
    .filter(v=>v.status==="avancou_fechamento" && Boolean(v.checklist_ok))
    .sort((a,b)=>(String(b.data_visita||"")+String(b.horario_visita||"")).localeCompare(String(a.data_visita||"")+String(a.horario_visita||"")));

  function exportReport(){
    const rows=[["Tipo","Nome","Visitas","Concluídas","Desmarcadas/Não apareceu","Avançaram fechamento","Contratos","Valor propostas"]];
    reportByPre.forEach(r=>rows.push(["Pré atendimento",r.nome,r.visitas,r.concluidas,r.desmarcadas,r.fechamento,r.contratos,brMoney(r.valor)]));
    reportByMostrador.forEach(r=>rows.push(["Mostrador",r.nome,r.visitas,r.concluidas,r.desmarcadas,r.fechamento,r.contratos,brMoney(r.valor)]));

    rows.push([],["Ações do mostrador/fechamento"],["Horário","Usuário","Ação","Imóvel","Cliente","Status anterior","Status novo","Valor proposta","Observação"]);

    acoes.filter(a=>visitas.find(x=>x.id===a.visita_id)?.data_visita===reportDate).forEach(a=>{
      const v=visitas.find(x=>x.id===a.visita_id);
      rows.push([brDateTime(a.created_at),getUser(a.usuario_id)?.nome||"",a.tipo_acao,v?.codigo_imovel||"",v?.cliente_nome||"",statusLabel(a.status_anterior),statusLabel(a.status_novo),brMoney(a.valor_proposta),a.observacao||""]);
    });

    exportCsv(`castan-relatorio-${reportStart}-a-${reportEnd}.csv`,rows);
  }

  function startNewVisit(day=null){
    if(!canCreateVisit)return alert("Seu perfil não pode criar visitas.");
    setModalVisit({...emptyVisit(user,preUsers,mostradores),data_visita:day||todayISO()});
  }

  function openVisit(v){
    const somenteLeitura = !canEditVisit(v);
    setModalVisit({...v,valor_proposta:v.valor_proposta||"",somenteLeitura});
  }

  const unread=notificacoes.filter(n=>n.usuario_id===user?.id&&!n.lida).length;

  function goToday(){
    const hoje=new Date();
    hoje.setHours(0,0,0,0);
    setWeekStart(getStartOfWeek(hoje));
    setMonth(hoje.getMonth());
    setYear(hoje.getFullYear());
    setCurrentDay(todayISO());
    setCalendarMode("day");
  }

  if(loading)return <div className="loading">Carregando Castan Visitas...</div>;

  return <div className="app" onTouchStart={e=>{touchStart.current=e.touches[0].clientY}} onTouchEnd={e=>{const end=e.changedTouches[0].clientY;if(window.scrollY===0&&end-touchStart.current>80)loadAll()}}>

    <Toast notifications={toast} onClose={()=>setToast([])} />
    {showNotifications&&<NotificationsPanel notificacoes={notificacoes.filter(n=>n.usuario_id===user?.id)} onClose={()=>setShowNotifications(false)} onMarkRead={marcarNotificacoesComoLidas}/>} 

    <header className="header">
      <div>
        <h1>Castan Visitas</h1>
        <p>Agenda operacional realtime — {APP_VERSION}</p>
      </div>

      <div className="header-logo-wrap">
        <img src="/logo-castan-agenda.jpeg" alt="Castan Agenda de Visitas" className="header-logo" onError={e=>{e.currentTarget.style.display="none"}}/>
      </div>

      <div className="header-actions">
        {user&&<div className="notif">{user.nome} — {ROLES[user.tipo]}</div>}
        <button onClick={loadAll} className="btn ghost"><RefreshCw size={16}/> Atualizar</button>
        {user&&<button className="notif notif-button" onClick={()=>setShowNotifications(v=>!v)}><Bell size={16}/> {unread}</button>}
        {canCreateVisit&&<button className="btn primary" onClick={()=>startNewVisit()}><Plus size={16}/> Nova Visita</button>}
        {user&&<button className="btn ghost" onClick={doLogout}>Sair</button>}
      </div>
    </header>

    {!user ? (
      <main className="select-user">
        <h2>Entrar no Castan Visitas</h2>
        <p>Selecione seu usuário e informe sua senha.</p>
        <div className="loginbox">
          <select value={loginUserId} onChange={e=>setLoginUserId(e.target.value)}>
            <option value="">Selecione o usuário</option>
            {usuarios.filter(u=>u.ativo!==false).map(u=><option key={u.id} value={u.id}>{u.nome} — {ROLES[u.tipo]||u.tipo}</option>)}
          </select>
          <input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} placeholder="Senha" onKeyDown={e=>{if(e.key==="Enter")doLogin()}}/>
          <button className="btn primary" onClick={doLogin}>Entrar</button>
        </div>
        <p className="hint">Senha inicial padrão: 123456. Após entrar, o próprio usuário pode alterar sua senha na aba Equipe. Somente o administrador poderá redefinir posteriormente.</p>
      </main>
    ) : (
      <>
        <nav className="tabs">
          {[
            ["inicio",Home,"Inicial"],
            ["calendario",CalendarDays,"Calendário"],
            ["minha_agenda",CalendarDays,"Minha agenda"],
            ["bloquear_agenda",CalendarDays,"Bloquear agenda"],
            ["canceladas",ListChecks,"Canceladas"],
            ["fechamento",ClipboardCheck,"Fechamento"],
            ["lista",ListChecks,"Lista"],
            ["relatorios",BarChart3,"Relatórios"],
            ["equipe",Users,"Equipe"]
          ].map(([id,Icon,label])=><button key={id} onClick={()=>setView(id)} className={view===id?"active":""}><Icon size={16}/> {label}</button>)}
        </nav>

        <main className="content">
          <div className="sync">Última sincronização: {lastSync}</div>

          {view==="inicio"&&<>
            <section className="metrics">
              <Metric title="Visitas do dia" value={todayVisits.length}/>
              <Metric title="Agendadas" value={todayVisits.filter(v=>["agendada","confirmada"].includes(v.status)).length}/>
              <Metric title="Canceladas" value={visitasCanceladasBase.length} onClick={()=>setView("canceladas")}/>
              <Metric title="Remarcadas" value={todayVisits.filter(v=>v.status==="remarcada").length}/>
              <Metric title="Equipe" value={usuarios.filter(u=>u.ativo!==false).length}/>
            </section>

            <DashboardFilters
              dashboardPeriod={dashboardPeriod}
              setDashboardPeriod={setDashboardPeriod}
              dashboardStart={dashboardStart}
              setDashboardStart={setDashboardStart}
              dashboardEnd={dashboardEnd}
              setDashboardEnd={setDashboardEnd}
              dashboardPre={dashboardPre}
              setDashboardPre={setDashboardPre}
              dashboardMostrador={dashboardMostrador}
              setDashboardMostrador={setDashboardMostrador}
              dashboardCaptador={dashboardCaptador}
              setDashboardCaptador={setDashboardCaptador}
              dashboardStatus={dashboardStatus}
              setDashboardStatus={setDashboardStatus}
              preUsers={preUsers}
              mostradores={mostradores}
              captadores={captadores}
            />

            <section className="dashboard-kpis">
              <Metric title="Total no período" value={totalDashboard}/>
              <Metric title="Conclusão" value={`${conclusaoDashboard}%`}/>
              <Metric title="Conversão" value={`${conversaoDashboard}%`}/>
              <Metric title="Cancelamento" value={`${cancelamentoDashboard}%`}/>
            </section>

            <section className="home-layout">
              <div>
                <Card title="Visitas de hoje">
                  {todayVisits.map(v=><VisitCard key={v.id} v={v} getUser={getUser} colorForUser={colorForUser} onClick={()=>openVisit(v)}/>)}
                  {!todayVisits.length&&<Empty text="Nenhuma visita para hoje."/>}
                </Card>
              </div>

              <aside className="home-sidebar">
                <Card title="Ranking Pré-atendimento">
                  <SimpleBars rows={rankingPre}/>
                </Card>

                <Card title="Dashboard por status">
                  <SimpleBars rows={statusResumo}/>
                </Card>

                <Card title="Ranking Mostradores">
                  <SimpleBars rows={rankingMostradores}/>
                </Card>

                <Card title="Viraram contrato">
                  <ContratoList rows={visitasContrato} getUser={getUser}/>
                </Card>
              </aside>
            </section>
          </>}

          {view==="calendario"&&<>
            <Filters preUsers={preUsers} mostradores={mostradores} filterPre={filterPre} setFilterPre={setFilterPre} filterMostrador={filterMostrador} setFilterMostrador={setFilterMostrador} filterStatus={filterStatus} setFilterStatus={setFilterStatus} searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
            <Card>
              <div className="monthbar">
                <button onClick={()=>{
                  if(calendarMode==="month"){
                    const m=month-1;
                    if(m<0){setMonth(11);setYear(year-1)}else setMonth(m);
                  } else if(calendarMode==="week") {
                    setWeekStart(prev=>{const d=new Date(prev);d.setDate(d.getDate()-7);return d});
                  } else {
                    const d=new Date(currentDay+"T00:00:00");
                    d.setDate(d.getDate()-1);
                    setCurrentDay(dateStr(d));
                  }
                }}>‹</button>

                <strong>{calendarMode==="month"?`${MONTHS[month]} ${year}`:calendarMode==="day"?`Hoje — ${new Date(currentDay+"T00:00:00").toLocaleDateString("pt-BR")}`:`Semana de ${weekStart.toLocaleDateString("pt-BR")}`}</strong>

                <button onClick={()=>{
                  if(calendarMode==="month"){
                    const m=month+1;
                    if(m>11){setMonth(0);setYear(year+1)}else setMonth(m);
                  } else if(calendarMode==="week") {
                    setWeekStart(prev=>{const d=new Date(prev);d.setDate(d.getDate()+7);return d});
                  } else {
                    const d=new Date(currentDay+"T00:00:00");
                    d.setDate(d.getDate()+1);
                    setCurrentDay(dateStr(d));
                  }
                }}>›</button>
              </div>

              <div className="calendar-mode-bar">
                <button className={calendarMode==="month"?"btn primary":"btn ghost"} onClick={()=>setCalendarMode("month")}>Mensal</button>
                <button className={calendarMode==="week"?"btn primary":"btn ghost"} onClick={()=>setCalendarMode("week")}>Semanal</button>
                <button className={calendarMode==="day"?"btn primary":"btn ghost"} onClick={goToday}>Hoje</button>
              </div>

              {calendarMode==="month"
                ? <Calendar year={year} month={month} visitas={visibleVisits.filter(v=>v.status!=="cancelada")} colorForUser={colorForUser} getUser={getUser} onNew={startNewVisit} onEdit={openVisit}/>
                : calendarMode==="week"
                  ? <WeeklyCalendar weekStart={weekStart} visitas={visibleVisits.filter(v=>v.status!=="cancelada")} colorForUser={colorForUser} getUser={getUser} onNew={startNewVisit} onEdit={openVisit}/>
                  : <DailyCalendar currentDay={currentDay} visitas={visibleVisits.filter(v=>v.status!=="cancelada")} colorForUser={colorForUser} getUser={getUser} onNew={startNewVisit} onEdit={openVisit}/>
              }
            </Card>
          </>}

          {view==="minha_agenda"&&
            <Card title="Minha agenda">
              {minhaAgendaVisits.map(v=><VisitCard key={v.id} v={v} getUser={getUser} colorForUser={colorForUser} onClick={()=>openVisit(v)}/>)}
              {!minhaAgendaVisits.length&&<Empty text="Nenhuma visita encontrada para esta agenda."/>}
            </Card>
          }
          {view==="bloquear_agenda"&&
            <Card title="Bloqueios de agenda">
              <p className="hint">Consulte os bloqueios de agenda dos mostradores. Somente mostradores podem criar ou remover seus próprios bloqueios.</p>

              {isMostrador&&<>
              <div className="bloqueio-form">
                <label>
                  <span>Dia do bloqueio *</span>
                  <input type="date" value={bloqueioForm.data_bloqueio} onChange={e=>setBloqueioForm({...bloqueioForm,data_bloqueio:e.target.value})}/>
                </label>

                <label>
                  <span>Horário inicial *</span>
                  <input type="time" value={bloqueioForm.horario_inicio} step="600" onChange={e=>setBloqueioForm({...bloqueioForm,horario_inicio:e.target.value})}/>
                </label>

                <label>
                  <span>Horário final *</span>
                  <input type="time" value={bloqueioForm.horario_fim} step="600" onChange={e=>setBloqueioForm({...bloqueioForm,horario_fim:e.target.value})}/>
                </label>

                <label className="full">
                  <span>Justificativa obrigatória *</span>
                  <textarea value={bloqueioForm.justificativa} onChange={e=>setBloqueioForm({...bloqueioForm,justificativa:e.target.value})} placeholder="Ex.: reunião externa, horário indisponível, compromisso particular..."/>
                </label>

                <button className="btn primary" onClick={salvarBloqueioAgenda}>Bloquear agenda</button>
              </div>
            </>}

              <h3>Bloqueios ativos dos mostradores</h3>
              {!isMostrador&&<div className="info-box">Você está em modo consulta. Apenas mostradores podem bloquear ou remover horários.</div>}
              <div className="bloqueio-lista">
                {agendaBloqueios
                  .filter(b=>b.ativo!==false)
                  .sort((a,b)=>(String(a.data_bloqueio||"")+String(a.horario_inicio||"")).localeCompare(String(b.data_bloqueio||"")+String(b.horario_inicio||"")))
                  .map(b=>
                    <div key={b.id} className="bloqueio-card">
                      <strong>{getUser(b.usuario_id)?.nome||"Mostrador"} • {String(b.data_bloqueio||"").split("-").reverse().join("/")} • {String(b.horario_inicio||"").slice(0,5)} às {String(b.horario_fim||"").slice(0,5)}</strong>
                      <p><b>Motivo:</b> {b.justificativa}</p>
                      {isMostrador&&b.usuario_id===user?.id&&
                        <button className="btn ghost" onClick={()=>removerBloqueioAgenda(b.id)}>Remover bloqueio</button>
                      }
                    </div>
                  )
                }
                {!agendaBloqueios.filter(b=>b.ativo!==false).length&&<Empty text="Nenhum bloqueio ativo."/>}
              </div>
            </Card>
          }

          {view==="canceladas"&&
            <Card title="Visitas canceladas">
              <div className="canceladas-header">
                <div>
                  <h3>Total canceladas: {visitasCanceladasBase.length}</h3>
                  <p className="hint">Clique em uma visita para abrir e visualizar os detalhes.</p>
                </div>
              </div>

              <div className="canceladas-filtros">
                <input
                  placeholder="Buscar imóvel, cliente, endereço, proprietário ou motivo"
                  value={canceladasBusca}
                  onChange={e=>setCanceladasBusca(e.target.value)}
                />

                <select value={canceladasPre} onChange={e=>setCanceladasPre(e.target.value)}>
                  <option value="all">Todos responsáveis</option>
                  {preUsers.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>

                <select value={canceladasMostrador} onChange={e=>setCanceladasMostrador(e.target.value)}>
                  <option value="all">Todos mostradores</option>
                  {mostradores.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>

                <select value={canceladasMotivo} onChange={e=>setCanceladasMotivo(e.target.value)}>
                  <option value="all">Todos motivos</option>
                  {MOTIVOS_CANCELAMENTO.map(m=><option key={m} value={m}>{m}</option>)}
                </select>

                <label>
                  <span>De</span>
                  <input type="date" value={canceladasStart} onChange={e=>setCanceladasStart(e.target.value)}/>
                </label>

                <label>
                  <span>Até</span>
                  <input type="date" value={canceladasEnd} onChange={e=>setCanceladasEnd(e.target.value)}/>
                </label>

                <button className="btn ghost" onClick={()=>{
                  setCanceladasBusca("");
                  setCanceladasPre("all");
                  setCanceladasMostrador("all");
                  setCanceladasMotivo("all");
                  setCanceladasStart("");
                  setCanceladasEnd("");
                }}>Limpar filtros</button>
              </div>

              <div className="canceladas-lista">
                {visitasCanceladasFiltradas.map(v=>
                  <VisitCard key={v.id} v={v} getUser={getUser} colorForUser={colorForUser} onClick={()=>openVisit(v)}/>
                )}
              </div>

              {!visitasCanceladasFiltradas.length&&<Empty text="Nenhuma visita cancelada encontrada."/>}
            </Card>
          }

          {view==="fechamento"&&
            <Card title="Visitas enviadas para fechamento">
              <p className="hint">Consulta das visitas que foram marcadas como Check list OK pela equipe de fechamento.</p>
              {visitasFechamentoConsulta.map(v=>
                <VisitCard key={v.id} v={{...v,somenteLeitura:true}} getUser={getUser} colorForUser={colorForUser} onClick={()=>setModalVisit({...v,valor_proposta:v.valor_proposta||"",somenteLeitura:true})}/>
              )}
              {!visitasFechamentoConsulta.length&&<Empty text="Nenhuma visita enviada para fechamento."/>}
            </Card>
          }

          {view==="lista"&&<>
            <Filters preUsers={preUsers} mostradores={mostradores} filterPre={filterPre} setFilterPre={setFilterPre} filterMostrador={filterMostrador} setFilterMostrador={setFilterMostrador} filterStatus={filterStatus} setFilterStatus={setFilterStatus} searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
            <Card title="Lista de visitas">
              {visibleVisits.map(v=><VisitCard key={v.id} v={v} getUser={getUser} colorForUser={colorForUser} onClick={()=>openVisit(v)}/>)}
            </Card>
          </>}

          {view==="relatorios"&&canViewReports&&
            <Card title="Relatórios">
              <div className="reportbar">
                <label><span>De</span><input type="date" value={reportStart} onChange={e=>setReportStart(e.target.value)}/></label>
                <label><span>Até</span><input type="date" value={reportEnd} onChange={e=>setReportEnd(e.target.value)}/></label>
                <button className="btn primary" onClick={exportReport}>Exportar CSV/Excel</button>
              </div>
              <h3>Por pré-atendimento</h3>
              <ReportTable rows={reportByPre}/>
              <h3>Por mostrador</h3>
              <ReportTable rows={reportByMostrador}/>
              <h3>Horário das ações</h3>
              <ActionTable acoes={acoes} visitas={visitas} getUser={getUser} reportStart={reportStart} reportEnd={reportEnd}/>
            </Card>
          }

          {view==="equipe"&&
            <Card title="Equipe">

              <div className="password-box">
                <h3>Alterar minha senha</h3>
                <div className="password-row">
                  <input
                    type="password"
                    placeholder="Nova senha"
                    value={newPassword}
                    onChange={e=>setNewPassword(e.target.value)}
                  />
                  <button className="btn primary" onClick={alterarMinhaSenha}>Salvar senha</button>
                </div>
              </div>

              {isAdmin&&<div className="admin-help">
                <strong>Painel do administrador</strong>
                <p>Para configurar permissões, clique em <b>Editar</b> no usuário desejado e use os botões ON/OFF.</p>
              </div>}

              {canManageUsers&&<button className="btn primary" onClick={()=>setModalUser({nome:"",email:"",tipo:"pre_atendimento",senha:"123456",ativo:true})}><Plus size={16}/> Novo usuário</button>}
              <div className="teamgrid">
                {usuarios.filter(u=>u.ativo!==false).map(u=>
                  <div className="teamcard" key={u.id}>
                    <strong>{u.nome}</strong>
                    <span>{ROLES[u.tipo]||u.tipo}</span>
                    {canManageUsers&&<div>
                      <button onClick={()=>setModalUser(u)} className="btn ghost">Editar</button>
                      <button onClick={()=>deleteUser(u.id)} className="btn danger">Desativar</button>
                    </div>}
                  </div>
                )}
              </div>
            </Card>
          }
        </main>
      </>
    )}

    {modalVisit&&
      <VisitModal
        f={modalVisit}
        setF={setModalVisit}
        onClose={()=>setModalVisit(null)}
        onSave={saveVisit}
        onDelete={deleteVisit}
        onCancelVisit={cancelVisitFromModal}
        isAdmin={isAdmin}
        isGestor={isGestor}
        isMostrador={isMostrador}
        isFechamento={isFechamento}
        isContratos={isContratos}
        canDeleteVisits={canDeleteVisits}
        canStatusAvancouFechamento={canStatusAvancouFechamento}
        canStatusPosOk={canStatusPosOk}
        canStatusContrato={canStatusContrato}
        preUsers={preUsers}
        mostradores={mostradores}
        editing={!!modalVisit.id}
        acoes={acoes}
        fotos={fotos}
        getUser={getUser}
        onCaptureLocation={captureLocationForModal}
        onUploadFiles={uploadVisitFiles}
      />
    }

    {modalUser&&<UserModal u={modalUser} setU={setModalUser} onClose={()=>setModalUser(null)} onSave={saveUser}/>}
  </div>;
}

function Toast({notifications,onClose}){
  if(!notifications?.length)return null;
  return <div className="toast-stack">
    {notifications.map(n=>
      <div className="toast-card" key={n.id}>
        <button className="toast-close" onClick={onClose}>×</button>
        <strong>{n.titulo}</strong>
        <p>{n.mensagem}</p>
      </div>
    )}
  </div>;
}


function NotificationsPanel({notificacoes,onClose,onMarkRead}){
  return <div className="notifications-panel">
    <div className="notifications-head">
      <strong>Notificações</strong>
      <button onClick={onClose}>×</button>
    </div>

    <div className="notifications-actions">
      <button className="btn ghost" onClick={onMarkRead}>Marcar todas como lidas</button>
    </div>

    <div className="notifications-list">
      {notificacoes.length?notificacoes.slice(0,30).map(n=>
        <div className={`notification-item ${n.lida?"read":"unread"}`} key={n.id}>
          <strong>{n.titulo}</strong>
          <p>{n.mensagem}</p>
          <small>{brDateTime(n.created_at)}</small>
        </div>
      ):<Empty text="Nenhuma notificação."/>}
    </div>
  </div>;
}

function ContratoList({rows,getUser}){
  if(!rows.length) return <Empty text="Nenhuma visita virou contrato ainda."/>;
  return <div className="contrato-list">
    {rows.map(v=>
      <div className="contrato-item" key={v.id}>
        <strong>{v.codigo_imovel}</strong>
        <span>Pré: {getUser(v.pre_atendimento_id)?.nome || "-"}</span>
      </div>
    )}
  </div>;
}




function DashboardFilters({
  dashboardPeriod,setDashboardPeriod,
  dashboardStart,setDashboardStart,
  dashboardEnd,setDashboardEnd,
  dashboardPre,setDashboardPre,
  dashboardMostrador,setDashboardMostrador,
  dashboardCaptador,setDashboardCaptador,
  dashboardStatus,setDashboardStatus,
  preUsers,mostradores,captadores
}){
  function limpar(){
    setDashboardPeriod("month");
    setDashboardPre("all");
    setDashboardMostrador("all");
    setDashboardCaptador("all");
    setDashboardStatus("all");
  }

  return <Card title="Filtros do painel">
    <div className="dashboard-filters">
      <button className={dashboardPeriod==="today"?"btn primary":"btn ghost"} onClick={()=>setDashboardPeriod("today")}>Hoje</button>
      <button className={dashboardPeriod==="week"?"btn primary":"btn ghost"} onClick={()=>setDashboardPeriod("week")}>Semana</button>
      <button className={dashboardPeriod==="month"?"btn primary":"btn ghost"} onClick={()=>setDashboardPeriod("month")}>Mês</button>
      <button className={dashboardPeriod==="custom"?"btn primary":"btn ghost"} onClick={()=>setDashboardPeriod("custom")}>Personalizado</button>

      {dashboardPeriod==="custom"&&<>
        <label><span>De</span><input type="date" value={dashboardStart} onChange={e=>setDashboardStart(e.target.value)}/></label>
        <label><span>Até</span><input type="date" value={dashboardEnd} onChange={e=>setDashboardEnd(e.target.value)}/></label>
      </>}

      <select value={dashboardPre} onChange={e=>setDashboardPre(e.target.value)}>
        <option value="all">Todos responsáveis</option>
        {preUsers.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}
      </select>

      <select value={dashboardMostrador} onChange={e=>setDashboardMostrador(e.target.value)}>
        <option value="all">Todos mostradores</option>
        {mostradores.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}
      </select>

      <select value={dashboardCaptador} onChange={e=>setDashboardCaptador(e.target.value)}>
        <option value="all">Todos captadores</option>
        {captadores.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}
      </select>

      <select value={dashboardStatus} onChange={e=>setDashboardStatus(e.target.value)}>
        <option value="all">Todos status</option>
        {STATUS.map(([id,label])=><option key={id} value={id}>{label}</option>)}
      </select>

      <button className="btn ghost" onClick={limpar}>Limpar filtros</button>
    </div>
  </Card>;
}

function SimpleBars({rows}){
  const max=Math.max(1,...rows.map(r=>r.total||0));
  return <div>
    {rows.length?rows.map(r=>
      <div key={r.id||r.nome} style={{marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:800}}>
          <span>{r.label||r.nome}</span>
          <span>{r.total}</span>
        </div>
        <div style={{height:10,background:"#E2E8F0",borderRadius:999,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${Math.max(5,(r.total/max)*100)}%`,background:"#123B63"}}/>
        </div>
      </div>
    ):<Empty text="Sem dados para exibir."/>}
  </div>;
}

function Metric({title,value,onClick}){return <div className={`metric ${onClick?"metric-clickable":""}`} onClick={onClick}><strong>{value}</strong><span>{title}</span></div>}
function Card({title,children}){return <section className="card">{title&&<h2>{title}</h2>}{children}</section>}
function Empty({text}){return <div className="empty">{text}</div>}

function Filters({preUsers,mostradores,filterPre,setFilterPre,filterMostrador,setFilterMostrador,filterStatus,setFilterStatus,searchTerm,setSearchTerm}){
  return <div className="filters">
    <input placeholder="Buscar imóvel, cliente, proprietário ou contato" value={searchTerm||""} onChange={e=>setSearchTerm(e.target.value)} style={{minWidth:260}}/>
    <select value={filterPre} onChange={e=>setFilterPre(e.target.value)}>
      <option value="all">Todos responsáveis</option>
      {preUsers.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}
    </select>
    <select value={filterMostrador} onChange={e=>setFilterMostrador(e.target.value)}>
      <option value="all">Todos mostradores</option>
      {mostradores.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}
    </select>
    <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
      <option value="all">Todos status</option>
      {STATUS.map(s=><option key={s[0]} value={s[0]}>{s[1]}</option>)}
    </select>
  </div>;
}

function VisitCard({v,getUser,colorForUser,onClick}){
  return <div className="visitcard" style={{borderLeftColor:colorForUser(v.mostrador_id)}} onClick={onClick}>
    <div>
      <strong>{v.data_visita?`${v.data_visita.split("-").reverse().join("/")} • `:""}{String(v.horario_visita||"").slice(0,5)} • {v.codigo_imovel} — {v.cliente_nome}</strong>
      <p>Endereço: {v.endereco_imovel||"-"}</p>
      <p>Pré: {getUser(v.pre_atendimento_id)?.nome||"-"} | Mostrador: {getUser(v.mostrador_id)?.nome||"-"}</p>
      <p>Cliente: {v.cliente_contato||"-"} | PP: {v.proprietario_nome||"-"}</p>
      {v.status==="cancelada"&&v.motivo_cancelamento&&<p>Motivo: {v.motivo_cancelamento}{v.motivo_cancelamento==="outros"&&v.motivo_cancelamento_outros?` — ${v.motivo_cancelamento_outros}`:""}</p>}
      {v.observacao&&<p>Obs.: {v.observacao}</p>}

      {v.endereco_imovel && (
        <p>
          <a
            href={wazeAddressLink(v.endereco_imovel)}
            target="_blank"
            rel="noreferrer"
            onClick={e=>e.stopPropagation()}
            className="waze-link"
          >
            Abrir no Waze
          </a>
        </p>
      )}
    </div>

    <div className="badges">
      <span className={statusClass(v.status)}>{statusLabel(v.status)}</span>
      {v.checklist&&<span className="status checklist">Check list</span>}
      {v.valor_proposta?<span className="status valor">{brMoney(v.valor_proposta)}</span>:null}
    </div>
  </div>;
}


function visitTooltip(v,getUser){
  return [
    `Imóvel: ${v.codigo_imovel||"-"}`,
    `Cliente: ${v.cliente_nome||"-"}`,
    `Endereço: ${v.endereco_imovel||"-"}`,
    `Pré: ${getUser?.(v.pre_atendimento_id)?.nome||"-"}`,
    `Mostrador: ${getUser?.(v.mostrador_id)?.nome||"-"}`,
    `Status: ${statusLabel(v.status)}`,
    v.atualizar_fotos ? "ATUALIZAR FOTOS" : ""
  ].filter(Boolean).join("\\n");
}

function Calendar({year,month,visitas,colorForUser,getUser,onNew,onEdit}){
  const first=new Date(year,month,1).getDay();
  const days=new Date(year,month+1,0).getDate();

  return <>
    <div className="weekdays">{WEEKDAYS.map(d=><div key={d}>{d}</div>)}</div>
    <div className="calendar">
      {Array.from({length:first}).map((_,i)=><div className="day emptyday" key={`e${i}`}/>)}
      {Array.from({length:days}).map((_,i)=>{
        const day=i+1;
        const date=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
        const arr=visitas.filter(v=>v.data_visita===date);
        return <div className="day" key={day} onClick={()=>onNew(date)}>
          <b>{day}</b>
          {arr.map(v=>
            <div className={`chip ${v.atualizar_fotos?"foto-destaque":""}`} title={visitTooltip(v,getUser)} key={v.id} style={{background:colorForUser(v.mostrador_id)}} onClick={e=>{e.stopPropagation();onEdit(v)}}>
              {String(v.horario_visita).slice(0,5)} {v.codigo_imovel}
            </div>
          )}
        </div>;
      })}
    </div>
  </>;
}

function WeeklyCalendar({weekStart,visitas,colorForUser,getUser,onNew,onEdit}){
  const days=Array.from({length:7}).map((_,i)=>{
    const d=new Date(weekStart);
    d.setDate(weekStart.getDate()+i);
    return d;
  });

  return <div className="weekly-calendar">
    {days.map(d=>{
      const date=dateStr(d);
      const arr=visitas
        .filter(v=>v.data_visita===date)
        .sort((a,b)=>String(a.horario_visita).localeCompare(String(b.horario_visita)));
      const isToday=date===todayISO();

      return <div className={`weekly-day ${isToday?"today":""}`} key={date} onClick={()=>onNew(date)}>
        <div className="weekly-day-head">
          <strong>{WEEKDAYS[d.getDay()]}</strong>
          <span>{d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}</span>
        </div>

        {arr.length?arr.map(v=>
          <div className={`weekly-visit ${v.atualizar_fotos?"foto-destaque-card":""}`} title={visitTooltip(v,getUser)} key={v.id} style={{borderLeftColor:colorForUser(v.mostrador_id)}} onClick={e=>{e.stopPropagation();onEdit(v)}}>
            <strong>{String(v.horario_visita).slice(0,5)} • {v.codigo_imovel}</strong>
            <span>{v.cliente_nome}</span>
          </div>
        ):<small>Nenhuma visita</small>}
      </div>;
    })}
  </div>;
}


function DailyCalendar({currentDay,visitas,colorForUser,getUser,onNew,onEdit}){
  const d = new Date(currentDay+"T00:00:00");
  const arr=visitas
    .filter(v=>v.data_visita===currentDay)
    .sort((a,b)=>String(a.horario_visita).localeCompare(String(b.horario_visita)));

  return <div className="daily-calendar">
    <div className="daily-day" onClick={()=>onNew(currentDay)}>
      <div className="weekly-day-head">
        <strong>{WEEKDAYS[d.getDay()]}</strong>
        <span>{d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"})}</span>
      </div>

      {arr.length?arr.map(v=>
        <div className={`weekly-visit daily-visit ${v.atualizar_fotos?"foto-destaque-card":""}`} title={visitTooltip(v,getUser)} key={v.id} style={{borderLeftColor:colorForUser(v.mostrador_id)}} onClick={e=>{e.stopPropagation();onEdit(v)}}>
          <strong>{String(v.horario_visita).slice(0,5)} • {v.codigo_imovel}</strong>
          <span>{v.cliente_nome}</span>
          <small>{v.endereco_imovel}</small>
        </div>
      ):<Empty text="Nenhuma visita para hoje."/>}
    </div>
  </div>;
}

function ReportTable({rows}){
  return <div className="tablewrap">
    <table>
      <thead><tr><th>Nome</th><th>Visitas</th><th>Concluídas</th><th>Desmarcadas</th><th>Fechamento</th><th>Contratos</th><th>Valor</th></tr></thead>
      <tbody>{rows.map(r=><tr key={r.nome}><td>{r.nome}</td><td>{r.visitas}</td><td>{r.concluidas}</td><td>{r.desmarcadas}</td><td>{r.fechamento}</td><td>{r.contratos}</td><td>{brMoney(r.valor)}</td></tr>)}</tbody>
    </table>
  </div>;
}

function ActionTable({acoes,visitas,getUser,reportStart,reportEnd}){
  const rows=acoes.filter(a=>{const d=visitas.find(v=>v.id===a.visita_id)?.data_visita; return d>=reportStart && d<=reportEnd;});
  return <div className="tablewrap">
    <table>
      <thead><tr><th>Horário</th><th>Usuário</th><th>Ação</th><th>Imóvel</th><th>Status</th><th>Valor</th><th>Obs.</th></tr></thead>
      <tbody>{rows.map(a=>{
        const v=visitas.find(x=>x.id===a.visita_id);
        return <tr key={a.id}><td>{brDateTime(a.created_at)}</td><td>{getUser(a.usuario_id)?.nome||"-"}</td><td>{a.tipo_acao}</td><td>{v?.codigo_imovel}</td><td>{statusLabel(a.status_anterior)} → {statusLabel(a.status_novo)}</td><td>{brMoney(a.valor_proposta)}</td><td>{a.observacao}</td></tr>;
      })}</tbody>
    </table>
  </div>;
}

function VisitModal({f,setF,onClose,onSave,onDelete,onCancelVisit,isAdmin,isGestor,isMostrador,isFechamento,isContratos,canDeleteVisits,canStatusAvancouFechamento,canStatusPosOk,canStatusContrato,preUsers,mostradores,editing,acoes=[],fotos=[],getUser,onCaptureLocation,onUploadFiles}){
  const readOnly = Boolean(f.somenteLeitura);
  const limited=readOnly;
  const historico=(acoes||[]).filter(a=>a.visita_id===f.id);
  const visitFotos=(fotos||[]).filter(x=>x.visita_id===f.id);

  const statusOptions = STATUS.filter(([id])=>{
    if(isFechamento) return ["pos_ok","avancou_fechamento","cancelada"].includes(id);
    if(isContratos) return ["cancelada","contrato"].includes(id);
    if(id==="avancou_fechamento") return canStatusAvancouFechamento;
    if(id==="pos_ok") return canStatusPosOk;
    if(id==="contrato") return canStatusContrato;
    return true;
  });

  return <div className="overlay">
    <div className="modal">
      <div className="modalhead">
        <h2>{readOnly?"Visualizar visita":(editing?"Editar visita":"Nova visita")}</h2>
        <button onClick={onClose}><X/></button>
      </div>

      <div className="form">
        <Field label="Código do imóvel *" value={f.codigo_imovel} disabled={limited} onChange={v=>setF({...f,codigo_imovel:v})}/>
        <Field label="Endereço do imóvel *" value={f.endereco_imovel} disabled={limited} onChange={v=>setF({...f,endereco_imovel:v})}/>
        <Field label="Nome do proprietário *" value={f.proprietario_nome} disabled={limited} onChange={v=>setF({...f,proprietario_nome:v})}/>
        <Field label="Contato do proprietário *" value={f.proprietario_contato} disabled={limited} onChange={v=>setF({...f,proprietario_contato:v})}/>
        <Field label="Nome do cliente *" value={f.cliente_nome} disabled={limited} onChange={v=>setF({...f,cliente_nome:v})}/>
        <Field label="Contato do cliente *" value={f.cliente_contato} disabled={limited} onChange={v=>setF({...f,cliente_contato:v})}/>
        <Field label="Local da chave *" value={f.local_chave||""} disabled={limited} onChange={v=>setF({...f,local_chave:v})}/>
        
        <Select label="Mostrador *" value={f.mostrador_id} disabled={limited} onChange={v=>setF({...f,mostrador_id:v})} options={mostradores.map(u=>[u.id,u.nome])}/>
        <Field label="Data *" type="date" value={f.data_visita} disabled={limited} onChange={v=>setF({...f,data_visita:v})}/>
        <Select label="Horário *" value={String(f.horario_visita||"").slice(0,5)} disabled={limited} onChange={v=>setF({...f,horario_visita:v})} options={HORARIOS_VISITA.map(h=>[h,h])}/>
        <Select label="Status *" value={f.status} disabled={limited} onChange={v=>setF({...f,status:v,motivo_cancelamento:v==="cancelada"?f.motivo_cancelamento:"",
    motivo_cancelamento_outros:""})} options={statusOptions}/>

        {isFechamento&&f.status==="avancou_fechamento"&&
          <label className="checkline">
            <input
              type="checkbox"
              checked={Boolean(f.checklist_ok)}
              disabled={limited}
              onChange={e=>setF({...f,checklist_ok:e.target.checked})}
            />
            <span>Check list OK / enviar para contratos</span>
          </label>
        }

        {f.status==="cancelada"&&<>
          <Select
            label="Motivo do cancelamento *"
            value={f.motivo_cancelamento||""}
            disabled={limited}
            onChange={v=>setF({
              ...f,
              motivo_cancelamento:v,
              motivo_cancelamento_outros:v==="outros"?f.motivo_cancelamento_outros:""
            })}
            options={MOTIVOS_CANCELAMENTO.map(m=>[m,m])}
          />

          {f.motivo_cancelamento==="outros"&&
            <Field
              label="Descreva o motivo do cancelamento *"
              value={f.motivo_cancelamento_outros||""}
              disabled={limited}
              onChange={v=>setF({...f,motivo_cancelamento_outros:v})}
            />
          }
        </>}

        <label className="check">
          <input
            type="checkbox"
            checked={!!f.atualizar_fotos}
            disabled={limited}
            onChange={e=>{
              const marcado=e.target.checked;
              setF({...f,atualizar_fotos:marcado});
              if(marcado) alert("Ao salvar, o mostrador será notificado para atualizar as fotos.");
            }}
          /> ATUALIZAR FOTOS
        </label>
        {f.atualizar_fotos&&<div className="alerta-fotos">Ao salvar, o mostrador receberá alerta para atualizar as fotos.</div>}

        
        {(isFechamento||isContratos)&&<Field label="Valor da proposta *" type="number" value={f.valor_proposta||""} onChange={v=>setF({...f,valor_proposta:v})}/>}
        {isContratos&&<label className="check"><input type="checkbox" checked={!!f.contrato_fechado} onChange={e=>setF({...f,contrato_fechado:e.target.checked,status:e.target.checked?"contrato":f.status})}/> Virou contrato</label>}

        <label className="full">
          <span>Observação {isMostrador?"(obrigatória para concluir/cancelar/remarcar/não apareceu)":""}</span>
          <textarea value={f.observacao||""} onChange={e=>setF({...f,observacao:e.target.value})}/>
        </label>
      </div>

      {editing&&<div style={{marginTop:16}}>
        <h3><MapPin size={17}/> Geolocalização da visita</h3>
        <div className="notification">
          <p>{f.latitude&&f.longitude?`Localização capturada em ${f.geolocalizacao_data?brDateTime(f.geolocalizacao_data):"data não registrada"}`:"Nenhuma localização capturada."}</p>
          {f.latitude&&f.longitude&&<p><a href={mapLink(f.latitude,f.longitude)} target="_blank" rel="noreferrer">Abrir no Google Maps</a></p>}
          {f.endereco_imovel&&<p><a href={wazeAddressLink(f.endereco_imovel)} target="_blank" rel="noreferrer" className="waze-link">Abrir no Waze</a></p>}
          {!readOnly&&<button className="btn ghost" onClick={onCaptureLocation}><Navigation size={16}/> Capturar localização atual</button>}
        </div>
      </div>}

      {editing&&<div style={{marginTop:16}}>
        <h3><ImageIcon size={17}/> Fotos e checklist</h3>
        <div className="notification">
          {!readOnly&&<label className="btn ghost" style={{display:"inline-flex",cursor:"pointer"}}>
            <Upload size={16}/> Anexar fotos/checklist
            <input type="file" accept="image/*,.pdf" multiple style={{display:"none"}} onChange={e=>onUploadFiles(e.target.files)}/>
          </label>}
          <p style={{fontSize:12,color:"#64748B"}}>Use para fotos da visita, comprovantes e checklist em PDF/imagem.</p>
        </div>

        {visitFotos.length?visitFotos.map(img=>
          <div key={img.id} className="notification">
            <strong>{img.nome_arquivo}</strong>
            <p>{brDateTime(img.created_at)} — {getUser?.(img.usuario_id)?.nome||"Usuário"}</p>
            {String(img.tipo_arquivo||"").startsWith("image/")
              ? <a href={img.url_arquivo} target="_blank" rel="noreferrer"><img src={img.url_arquivo} alt={img.nome_arquivo} style={{maxWidth:"180px",borderRadius:10,border:"1px solid #E2E8F0"}}/></a>
              : <a href={img.url_arquivo} target="_blank" rel="noreferrer">Abrir arquivo</a>
            }
          </div>
        ):<Empty text="Nenhum arquivo anexado."/>}
      </div>}

      {editing&&<div style={{marginTop:16}}>
        <h3>Histórico da visita</h3>
        {historico.length?historico.map(a=>
          <div key={a.id} className="notification">
            <strong>{brDateTime(a.created_at)} — {getUser?.(a.usuario_id)?.nome||"Usuário"}</strong>
            <p>{a.tipo_acao}: {statusLabel(a.status_anterior)} → {statusLabel(a.status_novo)}</p>
            {a.observacao&&<p>Obs.: {a.observacao}</p>}
            {a.valor_proposta&&<small>Valor: {brMoney(a.valor_proposta)}</small>}
          </div>
        ):<Empty text="Nenhum histórico registrado."/>}
      </div>}

      <div className="modalactions">
        {editing&&!readOnly&&f.status!=="cancelada"&&
          <button className="btn warn" onClick={onCancelVisit}>Cancelar visita</button>
        }
        {editing&&canDeleteVisits&&!readOnly&&<button className="btn danger" onClick={()=>onDelete(f.id)}><Trash2 size={16}/> Excluir</button>}
        <button className="btn ghost" onClick={onClose}>Fechar</button>
        {!readOnly&&<button className="btn primary" onClick={onSave}><Save size={16}/> Salvar</button>}
      </div>
    </div>
  </div>;
}

function UserModal({u,setU,onClose,onSave,isAdmin,currentUser}){
  const adminAtual = isAdmin || currentUser?.tipo === "admin";
  const permissoes = u.permissoes || {};
  const defaults = DEFAULT_PERMISSOES[u.tipo] || {};

  const getPerm = chave => {
    if(Object.prototype.hasOwnProperty.call(permissoes, chave)) return Boolean(permissoes[chave]);
    return Boolean(defaults[chave]);
  };

  const setPerm = (chave, valor) => {
    setU({...u, permissoes:{...(u.permissoes||{}), [chave]:valor}});
  };

  return <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="modal smallmodal">
      <div className="modalhead">
        <h2>{u.id?"Editar usuário":"Novo usuário"}</h2>
        <button onClick={onClose}><X/></button>
      </div>

      <Field label="Nome *" value={u.nome} onChange={v=>setU({...u,nome:v})}/>
      <Field label="E-mail" value={u.email} onChange={v=>setU({...u,email:v})}/>

      {(!u.id || adminAtual)
        ? <Field label="Senha *" type="password" value={u.senha||""} onChange={v=>setU({...u,senha:v})}/>
        : <p className="hint">Somente o administrador pode redefinir senhas posteriormente.</p>
      }

      <Select label="Perfil *" value={u.tipo} onChange={v=>setU({...u,tipo:v,permissoes:u.permissoes||{}})} options={Object.entries(ROLES).map(([k,v])=>[k,v])}/>

      {adminAtual&&<div className="permissions-box">
        <h3>Painel de permissões</h3>
        <p className="hint">Defina individualmente o que este usuário pode fazer.</p>

        {PERMISSOES.map(([key,label])=>
          <label className="perm-row" key={key}>
            <span>{label}</span>
            <button
              type="button"
              className={getPerm(key)?"toggle on":"toggle off"}
              onClick={()=>setPerm(key,!getPerm(key))}
            >
              {getPerm(key)?"ON":"OFF"}
            </button>
          </label>
        )}
      </div>}

      <div className="modalactions">
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={onSave}>Salvar</button>
      </div>
    </div>
  </div>;
}

function Field({label,value,onChange,type="text",disabled=false}){
  return <label><span>{label}</span><input type={type} value={value||""} disabled={disabled} onChange={e=>onChange(e.target.value)}/></label>;
}

function Select({label,value,onChange,options,disabled=false}){
  return <label>
    <span>{label}</span>
    <select value={value||""} disabled={disabled} onChange={e=>onChange(e.target.value)}>
      <option value="">Selecione...</option>
      {options.map(o=><option key={o[0]} value={o[0]}>{o[1]}</option>)}
    </select>
  </label>;
}
