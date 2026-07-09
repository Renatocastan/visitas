import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { RefreshCw, Bell, Plus, Users, CalendarDays, ListChecks, BarChart3, Home, Save, X, Trash2, MapPin, Upload, Image as ImageIcon, Navigation, ClipboardCheck } from "lucide-react";

const APP_VERSION = "Castan Realtime v3.2.8-canceladas-no-calendario";

const COLORS = ["#B91C1C","#1E5A8A","#15803D","#C05621","#7E22CE","#0F766E","#BE123C","#2563EB","#D97706","#047857","#9333EA","#0284C7","#DC2626","#4F46E5","#65A30D","#DB2777"];
const USER_COLOR_MAP = {
  "enzo":"#2563EB",
  "denise":"#86EFAC",
  "maury":"#F97316",
  "wellington":"#DC2626",
  "well cap":"#6B7280",
  "vinicius":"#7C2D12",
  "vinícius":"#7C2D12",
  "lukas":"#166534",
  "lucas":"#166534",
  "thayane":"#7E22CE",
  "duda":"#FACC15"
};


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
    excluir_visita:true,
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
  ["avancou_fechamento","Avançou p/ fechamento"],
  ["cancelada","Cancelada"],
  ["confirmada","Confirmada"],
  ["concluida","Concluída"],
  ["nao_apareceu","Não apareceu"],
  ["pos_ok","Pós OK"],
  ["remarcada","Remarcada"],
  ["reserva","Reserva de agenda"],
  ["reserva_cancelada","Reserva CANCELADA"],
  ["contrato","Virou contrato"]
];

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const MOTIVOS_CANCELAMENTO = [
  "Achou pequeno",
  "Cancelada no fechamento",
  "Cliente cancelou",
  "Esqueceu",
  "Imprevisto",
  "Já alugou",
  "Não deu retorno",
  "Não gostou da localização",
  "Não responde",
  "Outro compromisso",
  "Outros",
  "Perdeu a hora",
  "Proprietário não pode acompanhar",
  "Sem chave",
  "Valor não faz sentido"
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
const BR_TIMEZONE = "America/Sao_Paulo";
const pad2 = v => String(v).padStart(2,"0");
const localDateObj = v => v ? new Date(v) : new Date();

const brDateTime = v => {
  if(!v) return "";
  const d = localDateObj(v);
  return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

const nowISO = () => new Date().toISOString();
const horarioBrasil = () => brDateTime(new Date());

const parseHorarioBrasilDate = value => {
  const txt=String(value||"");
  const m=txt.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};

const actionTimeDisplay = a => a?.horario_brasil || brDateTime(a?.created_at);
const actionDateBR = v => {
  if(!v) return "";
  const d=localDateObj(v);
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
};
const statusLabel = v => STATUS.find(s => s[0] === v)?.[1] || v || "";
const statusClass = v => `status ${v || "agendada"}`;
const normalizeMoney = v => (v === "" || v === null || v === undefined) ? null : Number(String(v).replace(".", "").replace(",", "."));
const pct = (a,b) => b ? `${Math.round((Number(a||0)/Number(b||0))*100)}%` : "0%";
const mapLink = (lat,lng) => lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : "";
const wazeAddressLink = address => address ? `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes` : "";
const wazeLink = (lat, lng) => lat && lng ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes` : "";
const onlyDigits=v=>String(v||"").replace(/\D/g,"");
const whatsappClienteLink=v=>{
 let p=onlyDigits(v?.cliente_contato); if(!p)return "";
 if(!p.startsWith("55")) p="55"+p;
 const msg=`Olá, sou da Castan Imóveis. Estou entrando em contato sobre a visita agendada para o imóvel ${v?.endereco_imovel||""}.`;
 return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
};

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
    horario_fim_visita:"10:00",
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
    data_fim:todayISO(),
    horario_inicio:"09:00",
    horario_fim:"10:00",
    justificativa:"",
    almoco_fixo:false
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
  const [mobileMenuOpen,setMobileMenuOpen]=useState(false);
  const [tvMode,setTvMode]=useState(false);

  const [toast,setToast]=useState([]);
  const [showNotifications,setShowNotifications]=useState(false);
  const [updateAvailable,setUpdateAvailable]=useState(false);
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
  const canDeleteVisits = isAdmin || isGestor || hasPerm("excluir_visita", false);
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
              notificarDispositivo(item.titulo||"Castan Visitas", item.mensagem||"Nova notificação na agenda.", item.id);
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
    if(!user?.id || !isMostrador)return;

    const interval=setInterval(()=>{
      const agora=new Date();

      visitas
        .filter(v=>v.mostrador_id===user.id)
        .filter(v=>["agendada","confirmada","reserva"].includes(v.status))
        .forEach(v=>{
          const dt=visitaDateTime(v);
          if(!dt)return;

          const diffMin=Math.round((dt.getTime()-agora.getTime())/60000);

          const alertas=[
            {tipo:"30min",min:30,titulo:"Sua visita começa em 30 minutos",prefixo:"Sua visita começa em 30 minutos"},
            {tipo:"agora",min:0,titulo:"Sua visita começa agora",prefixo:"Sua visita começa agora"}
          ];

          alertas.forEach(a=>{
            if(Math.abs(diffMin-a.min)<=1){
              const key=`castan-visita-alerta-${a.tipo}-${v.id}`;
              if(localStorage.getItem(key))return;

              localStorage.setItem(key,"1");
              const mensagem=notificacaoVisitaMensagem(v,a.prefixo);
              setToast([{id:key,titulo:a.titulo,mensagem}]);
              notificarDispositivo("Castan Visitas",mensagem,key);
              setTimeout(()=>setToast([]),9000);
            }
          });
        });
    },30000);

    return()=>clearInterval(interval);
  },[user?.id,isMostrador,visitas]);

  useEffect(()=>{
    // Sincronização automática orientada a eventos.
    // Antes havia polling global a cada 3s e, na Central, a cada 15s.
    // Isso recarregava seis tabelas inteiras repetidamente e elevava o Egress.
    let syncTimer=null;
    let lastFocusSync=0;

    const scheduleSync=()=>{
      // Agrupa rajadas de INSERT/UPDATE/DELETE em uma única leitura.
      window.clearTimeout(syncTimer);
      syncTimer=window.setTimeout(()=>loadAll(),500);
    };

    const ch=supabase.channel("castan-realtime-global")
      .on("postgres_changes",{event:"*",schema:"public",table:"usuarios"},scheduleSync)
      .on("postgres_changes",{event:"*",schema:"public",table:"visitas"},scheduleSync)
      .on("postgres_changes",{event:"*",schema:"public",table:"notificacoes"},scheduleSync)
      .on("postgres_changes",{event:"*",schema:"public",table:"acoes_visita"},scheduleSync)
      .on("postgres_changes",{event:"*",schema:"public",table:"fotos_visita"},scheduleSync)
      .on("postgres_changes",{event:"*",schema:"public",table:"agenda_bloqueios"},scheduleSync)
      .subscribe();

    const syncOnReturn=()=>{
      if(document.hidden)return;
      const now=Date.now();
      // Fallback ao retornar ao app, no máximo uma vez a cada 60s.
      if(now-lastFocusSync<60000)return;
      lastFocusSync=now;
      loadAll();
    };

    window.addEventListener("focus",syncOnReturn);
    document.addEventListener("visibilitychange",syncOnReturn);

    return()=>{
      supabase.removeChannel(ch);
      window.clearTimeout(syncTimer);
      window.removeEventListener("focus",syncOnReturn);
      document.removeEventListener("visibilitychange",syncOnReturn);
    };

  useEffect(()=>{
    const currentScripts = () =>
      [...document.querySelectorAll('script[src]')]
        .map(s=>s.getAttribute("src"))
        .filter(Boolean)
        .sort()
        .join("|");

    let current = currentScripts();

    async function checkAppVersion(){
      try{
        const res = await fetch(`${window.location.origin}/?vcheck=${Date.now()}`, {
          cache:"no-store",
          headers:{"Cache-Control":"no-cache"}
        });

        const html = await res.text();
        const doc = new DOMParser().parseFromString(html,"text/html");

        const latest = [...doc.querySelectorAll('script[src]')]
          .map(s=>s.getAttribute("src"))
          .filter(Boolean)
          .sort()
          .join("|");

        if(latest && current && latest!==current){
          setUpdateAvailable(true);

          if(!modalVisit && !modalUser){
            setTimeout(()=>window.location.reload(),1500);
          }
        }
      }catch(e){
        // Falha silenciosa para não atrapalhar a operação.
      }
    }

    const interval=setInterval(checkAppVersion,60000);
    window.addEventListener("focus",checkAppVersion);
    checkAppVersion();

    return()=>{
      clearInterval(interval);
      window.removeEventListener("focus",checkAppVersion);
    };
  },[modalVisit,modalUser]);

  useEffect(()=>{
    if(updateAvailable && !modalVisit && !modalUser){
      const t=setTimeout(()=>window.location.reload(),1500);
      return()=>clearTimeout(t);
    }
  },[updateAvailable,modalVisit,modalUser]);

  },[loadAll]);

  function getUser(id){return usuarios.find(u=>u.id===id)}
  function colorForUser(id){
    const u=usuarios.find(x=>x.id===id);
    const nome=String(u?.nome||"").trim().toLowerCase();
    if(USER_COLOR_MAP[nome]) return USER_COLOR_MAP[nome];

    const key=String(id||nome||"");
    let hash=0;
    for(let i=0;i<key.length;i++) hash=(hash*31+key.charCodeAt(i))>>>0;
    return COLORS[hash%COLORS.length];
  }

  function colorForVisit(v){
    return colorForUser(v?.pre_atendimento_id || v?.created_by || v?.mostrador_id);
  }

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

  async function garantirNotificacoes(){
    if(!("Notification" in window)){
      alert("Este navegador não suporta notificações.");
      return false;
    }

    if(Notification.permission==="default"){
      try{ await Notification.requestPermission(); }catch{}
    }

    if(Notification.permission!=="granted"){
      alert("As notificações não foram permitidas neste aparelho.");
      return false;
    }

    if("serviceWorker" in navigator){
      try{ await navigator.serviceWorker.register("/sw.js"); }catch{}
    }

    alert("Notificações ativadas neste aparelho.");
    return true;
  }

  async function notificarDispositivo(titulo,mensagem,tag){
    if(!("Notification" in window) || Notification.permission!=="granted")return;

    const options={
      body:mensagem||"Nova atualização no Castan Visitas.",
      tag:tag||`castan-${Date.now()}`,
      icon:"/logo-castan-agenda.jpeg",
      badge:"/logo-castan-agenda.jpeg",
      requireInteraction:true,
      renotify:true
    };

    try{
      if("serviceWorker" in navigator){
        const reg=await navigator.serviceWorker.ready;
        if(reg?.showNotification){
          await reg.showNotification(titulo||"Castan Visitas",options);
          return;
        }
      }
    }catch{}

    try{ new Notification(titulo||"Castan Visitas",options); }catch{}
  }

  function saudacaoDoDia(){
    const h=new Date().getHours();
    if(h<12)return "Bom dia";
    if(h<18)return "Boa tarde";
    return "Boa noite";
  }

  function visitaDateTime(v){
    if(!v?.data_visita || !v?.horario_visita)return null;
    return new Date(`${v.data_visita}T${String(v.horario_visita).slice(0,5)}:00`);
  }

  function notificacaoVisitaMensagem(v, prefixo){
    return [
      prefixo,
      `${v.codigo_imovel||"Imóvel"}`,
      `Cliente: ${v.cliente_nome||"-"}`,
      `Horário: ${String(v.horario_visita||"").slice(0,5)} às ${String(v.horario_fim_visita||v.horario_visita||"").slice(0,5)}`,
      `Local da chave: ${v.local_chave||"-"}`
    ].join("\n");
  }

  function horariosSobrepostos(inicioA,fimA,inicioB,fimB){
    const a1=String(inicioA||"00:00").slice(0,5);
    const a2=String(fimA||inicioA||"23:59").slice(0,5);
    const b1=String(inicioB||"00:00").slice(0,5);
    const b2=String(fimB||inicioB||"23:59").slice(0,5);
    return a1 < b2 && a2 > b1;
  }

  function agendaBloqueadaPara(mostradorId,dataVisita,horarioInicio,horarioFim=null){
    return agendaBloqueios.find(b=>
      b.ativo!==false &&
      b.usuario_id===mostradorId &&
      b.data_bloqueio===dataVisita &&
      horariosSobrepostos(horarioInicio, horarioFim||horarioInicio, b.horario_inicio, b.horario_fim)
    );
  }

  function datasEntre(inicio,fim){
    const out=[];
    const d=new Date(`${inicio}T00:00:00`);
    const end=new Date(`${fim||inicio}T00:00:00`);
    while(d<=end){
      out.push(dateStr(d));
      d.setDate(d.getDate()+1);
    }
    return out;
  }

  async function salvarBloqueioAgenda(){
    if(!isMostrador)return alert("Somente mostradores podem bloquear a própria agenda.");

    if(!bloqueioForm.data_bloqueio || !bloqueioForm.data_fim || !bloqueioForm.horario_inicio || !bloqueioForm.horario_fim){
      return alert("Informe período inicial/final e horário inicial/final do bloqueio.");
    }

    if(bloqueioForm.data_fim < bloqueioForm.data_bloqueio){
      return alert("A data final deve ser maior ou igual à data inicial.");
    }

    if(String(bloqueioForm.horario_fim).slice(0,5)<=String(bloqueioForm.horario_inicio).slice(0,5)){
      return alert("O horário final deve ser maior que o horário inicial.");
    }

    if(!bloqueioForm.almoco_fixo && !String(bloqueioForm.justificativa||"").trim()){
      return alert("A justificativa do bloqueio é obrigatória.");
    }

    const dias=datasEntre(bloqueioForm.data_bloqueio,bloqueioForm.data_fim);
    const registros=dias.map(data_bloqueio=>({
      usuario_id:user.id,
      data_bloqueio,
      horario_inicio:String(bloqueioForm.horario_inicio).slice(0,5),
      horario_fim:String(bloqueioForm.horario_fim).slice(0,5),
      justificativa:bloqueioForm.almoco_fixo ? `Almoço fixo - ${String(bloqueioForm.justificativa||"").trim()||"bloqueio de almoço"}` : bloqueioForm.justificativa.trim(),
      ativo:true
    }));

    const {error}=await supabase.from("agenda_bloqueios").insert(registros);

    if(error)return alert(error.message);

    setBloqueioForm({
      data_bloqueio:todayISO(),
      data_fim:todayISO(),
      horario_inicio:"09:00",
      horario_fim:"10:00",
      justificativa:"",
      almoco_fixo:false
    });

    await loadAll();
    alert(`Agenda bloqueada com sucesso em ${registros.length} dia(s).`);
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

    const isReservaAgenda = f.status==="reserva" || f.status==="reserva_cancelada";

    if(isReservaAgenda){
      if(!user?.id || !f.mostrador_id || !f.data_visita || !f.horario_visita || !f.horario_fim_visita || !f.status){
        return alert("Para Reserva de agenda, preencha somente mostrador, data, hora e status.");
      }
    }else if(
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
      !f.horario_fim_visita ||
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

    if(String(f.horario_fim_visita||"").slice(0,5) <= String(f.horario_visita||"").slice(0,5)){
      return alert("O horário final da visita deve ser maior que o horário inicial.");
    }

    if(!f.id){
      const agora = new Date();
      const dataHoraVisita = new Date(`${f.data_visita}T${String(f.horario_visita||"00:00").slice(0,5)}:00`);
      if(dataHoraVisita < agora){
        return alert("Não é permitido criar visitas retroativas ao dia e horário atual.");
      }
    }

    if(isMostrador && f.status==="concluida"){
      const okObs=window.confirm("CAMPO OBS FOI PREENCHIDO?");
      if(!okObs)return;
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

    if(["cancelada","reserva_cancelada"].includes(f.status) && !f.motivo_cancelamento){
      return alert("Selecione o motivo do cancelamento.");
    }

    if(["cancelada","reserva_cancelada"].includes(f.status) && String(f.motivo_cancelamento||"").toLowerCase()==="outros" && !String(f.motivo_cancelamento_outros||"").trim()){
      return alert('Descreva o motivo em "outros".');
    }

    const bloqueioAgenda = agendaBloqueadaPara(f.mostrador_id,f.data_visita,f.horario_visita,f.horario_fim_visita);
    if(bloqueioAgenda){
      return alert("AGENDA BLOQUEADA, INCLUIR OUTRO MOSTRADOR");
    }

    const old=f.id?visitas.find(v=>v.id===f.id):null;

    const chaveConflito = `${f.mostrador_id}|${f.data_visita}|${String(f.horario_visita || "").slice(0,5)}|${String(f.horario_fim_visita || "").slice(0,5)}|${f.id||"novo"}`;
    const conflitoAgenda = visitas.find(v =>
      v.id !== f.id &&
      !["cancelada","reserva_cancelada"].includes(v.status) &&
      v.mostrador_id === f.mostrador_id &&
      v.data_visita === f.data_visita &&
      horariosSobrepostos(f.horario_visita,f.horario_fim_visita,v.horario_visita,v.horario_fim_visita||v.horario_visita)
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

    const payload={
      codigo_imovel:isReservaAgenda?(f.codigo_imovel||"RESERVA"):f.codigo_imovel,
      endereco_imovel:isReservaAgenda?(f.endereco_imovel||"Reserva de agenda"):f.endereco_imovel,
      proprietario_nome:isReservaAgenda?(f.proprietario_nome||"Reserva"):f.proprietario_nome,
      proprietario_contato:isReservaAgenda?(f.proprietario_contato||"Reserva"):f.proprietario_contato,
      cliente_nome:isReservaAgenda?(f.cliente_nome||"Reserva de agenda"):f.cliente_nome,
      cliente_contato:isReservaAgenda?(f.cliente_contato||"Reserva"):f.cliente_contato,
      local_chave:isReservaAgenda?(f.local_chave||"Reserva de agenda"):(f.local_chave||null),
      pre_atendimento_id:f.id?(old?.pre_atendimento_id||f.pre_atendimento_id):(user?.id||f.pre_atendimento_id),
      mostrador_id:f.mostrador_id,
      data_visita:f.data_visita,
      horario_visita:f.horario_visita,
      horario_fim_visita:f.horario_fim_visita||null,
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
          created_at:nowISO(),
          horario_brasil:horarioBrasil(),
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
          created_at:nowISO(),
          horario_brasil:horarioBrasil(),
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
          created_at:nowISO(),
          horario_brasil:horarioBrasil(),
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
          created_at:nowISO(),
          horario_brasil:horarioBrasil(),
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
          created_at:nowISO(),
          horario_brasil:horarioBrasil(),
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

  async function cancelVisitFromModal(){
    if(!modalVisit?.id)return;

    const obs=window.prompt("Informe a observação/motivo do cancelamento da visita:");
    if(!obs || !String(obs).trim()){
      return alert("A observação do cancelamento é obrigatória.");
    }

    const old=visitas.find(v=>v.id===modalVisit.id);

    const {error}=await supabase
      .from("visitas")
      .update({
        status:"cancelada",
        motivo_cancelamento:"outros",
        motivo_cancelamento_outros:String(obs).trim(),
        observacao:String(obs).trim()
      })
      .eq("id",modalVisit.id);

    if(error)return alert(error.message);

    await supabase.from("acoes_visita").insert({
          created_at:nowISO(),
          horario_brasil:horarioBrasil(),
      visita_id:modalVisit.id,
      usuario_id:user?.id,
      tipo_acao:"cancelamento_visita",
      status_anterior:old?.status||null,
      status_novo:"cancelada",
      observacao:String(obs).trim(),
      valor_proposta:old?.valor_proposta||null
    });

    await notifyMany(
      getEnvolvidosVisita(old),
      "Visita cancelada",
      `${old?.codigo_imovel||""} - ${old?.cliente_nome||""}: visita cancelada.`
    );

    setModalVisit(null);
    setView("canceladas");
    await loadAll();
  }

async function deleteVisit(id){
    if(!isAdmin&&!isGestor)return alert("Somente ADM/Gestor pode excluir visitas.");
    if(!confirm("TEM CERTEZA QUE DESEJA EXCLUIR?"))return;
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
          created_at:nowISO(),
          horario_brasil:horarioBrasil(),
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
    .filter(v=>v.data_visita===todayISO()&&!["cancelada","reserva_cancelada"].includes(v.status))
    .sort((a,b)=>String(a.horario_visita).localeCompare(String(b.horario_visita)));

  const centralHoje=visitas.filter(v=>v.data_visita===todayISO());
  const centralAtivas=centralHoje.filter(v=>!["cancelada","reserva_cancelada"].includes(v.status));
  const centralConcluidas=centralHoje.filter(v=>v.status==="concluida").length;
  const centralCanceladas=centralHoje.filter(v=>v.status==="cancelada").length;
  const centralReservas=centralHoje.filter(v=>v.status==="reserva").length;
  const centralFotos=centralHoje.filter(v=>v.atualizar_fotos).length;
  const agoraCentral=new Date();
  const centralProximas=centralAtivas
    .filter(v=>visitaDateTime(v)&&visitaDateTime(v)>=agoraCentral)
    .sort((a,b)=>visitaDateTime(a)-visitaDateTime(b));
  const centralProxima=centralProximas[0]||null;
  const centralEmAndamento=centralAtivas
    .filter(v=>{
      const ini=visitaDateTime(v);
      if(!ini)return false;
      const fim=new Date(`${v.data_visita}T${String(v.horario_fim_visita||v.horario_visita).slice(0,5)}:00`);
      return ini<=agoraCentral && fim>=agoraCentral;
    })
    .sort((a,b)=>String(a.horario_visita).localeCompare(String(b.horario_visita)));

  const centralCancelamentosRecentes=centralHoje
    .filter(v=>v.status==="cancelada")
    .sort((a,b)=>String(b.updated_at||b.created_at||"").localeCompare(String(a.updated_at||a.created_at||"")))
    .slice(0,5);

  const reportVisits=visitas.filter(v=>v.data_visita>=reportStart && v.data_visita<=reportEnd);

  const statusCount = id => reportVisits.filter(v=>v.status===id).length;
  const totalRelatorio = reportVisits.length;
  const agendadasRel = statusCount("agendada");
  const confirmadasRel = statusCount("confirmada");
  const concluidasRel = statusCount("concluida");
  const canceladasRel = statusCount("cancelada");
  const posOkRel = statusCount("pos_ok");
  const fechamentoRel = statusCount("avancou_fechamento");
  const contratosRel = reportVisits.filter(v=>v.status==="contrato" || v.contrato_fechado).length;

  const statusReportRows = STATUS.map(([id,label])=>({
    id,
    label,
    total: id==="contrato" ? contratosRel : statusCount(id)
  }));

  function normalizarTextoRelatorio(texto){
    const t=String(texto||"").trim().replace(/\s+/g," ");
    if(!t)return "Sem descrição";
    return t.charAt(0).toUpperCase()+t.slice(1);
  }

  const cancelamentosDetalhados = reportVisits
    .filter(v=>v.status==="cancelada")
    .map(v=>{
      const motivoBase=normalizarTextoRelatorio(v.motivo_cancelamento||"Sem motivo");
      const isOutros=String(v.motivo_cancelamento||"").toLowerCase()==="outros";
      const detalhe=normalizarTextoRelatorio(v.motivo_cancelamento_outros||"Sem descrição");
      return {
        motivo:isOutros ? "Outros" : motivoBase,
        detalhe:isOutros ? detalhe : "",
        isOutros
      };
    });

  const outrosCancelamentoDetalhes = Object.values(
    cancelamentosDetalhados
      .filter(x=>x.isOutros)
      .reduce((acc,x)=>{
        const detalhe=x.detalhe||"Sem descrição";
        if(!acc[detalhe])acc[detalhe]={motivo:detalhe,total:0};
        acc[detalhe].total+=1;
        return acc;
      },{})
  ).sort((a,b)=>b.total-a.total || a.motivo.localeCompare(b.motivo));

  const motivoCancelamentoRows = Object.values(
    cancelamentosDetalhados
      .reduce((acc,x)=>{
        const motivo=x.isOutros ? "Outros" : x.motivo;
        if(!acc[motivo])acc[motivo]={motivo,total:0,isOutros:x.isOutros};
        acc[motivo].total+=1;
        return acc;
      },{})
  )
  .sort((a,b)=>{
    if(a.motivo==="Outros")return 1;
    if(b.motivo==="Outros")return -1;
    return b.total-a.total || a.motivo.localeCompare(b.motivo);
  })
  .map(r=>({
    ...r,
    percentual:pct(r.total,canceladasRel)
  }));

  const reservasCanceladasRel = statusCount("reserva_cancelada");
  const reservasCanceladasDetalhadas = reportVisits
    .filter(v=>v.status==="reserva_cancelada")
    .map(v=>{
      const motivoBase=normalizarTextoRelatorio(v.motivo_cancelamento||"Sem motivo");
      const isOutros=String(v.motivo_cancelamento||"").toLowerCase()==="outros";
      const detalhe=normalizarTextoRelatorio(v.motivo_cancelamento_outros||"Sem descrição");
      return {
        motivo:isOutros ? "Outros" : motivoBase,
        detalhe:isOutros ? detalhe : "",
        isOutros
      };
    });

  const outrosReservaCanceladaDetalhes = Object.values(
    reservasCanceladasDetalhadas
      .filter(x=>x.isOutros)
      .reduce((acc,x)=>{
        const detalhe=x.detalhe||"Sem descrição";
        if(!acc[detalhe])acc[detalhe]={motivo:detalhe,total:0};
        acc[detalhe].total+=1;
        return acc;
      },{})
  ).sort((a,b)=>b.total-a.total || a.motivo.localeCompare(b.motivo));

  const motivoReservaCanceladaRows = Object.values(
    reservasCanceladasDetalhadas
      .reduce((acc,x)=>{
        const motivo=x.isOutros ? "Outros" : x.motivo;
        if(!acc[motivo])acc[motivo]={motivo,total:0,isOutros:x.isOutros};
        acc[motivo].total+=1;
        return acc;
      },{})
  )
  .sort((a,b)=>{
    if(a.motivo==="Outros")return 1;
    if(b.motivo==="Outros")return -1;
    return b.total-a.total || a.motivo.localeCompare(b.motivo);
  })
  .map(r=>({
    ...r,
    percentual:pct(r.total,reservasCanceladasRel)
  }));

  const funilRows=[
    {etapa:"Agendada",total:agendadasRel},
    {etapa:"Confirmada",total:confirmadasRel},
    {etapa:"Concluída",total:concluidasRel},
    {etapa:"Pós OK",total:posOkRel},
    {etapa:"Fechamento",total:fechamentoRel},
    {etapa:"Contrato",total:contratosRel},
    {etapa:"Cancelada",total:canceladasRel},
    {etapa:"Reserva cancelada",total:statusCount("reserva_cancelada")}
  ];

  const funilConversoes=[
    {etapa:"Agendada → Concluída",taxa:pct(concluidasRel,agendadasRel),base:`${concluidasRel}/${agendadasRel}`},
    {etapa:"Agendada → Cancelada",taxa:pct(canceladasRel,agendadasRel),base:`${canceladasRel}/${agendadasRel}`},
    {etapa:"Concluída → Fechamento",taxa:pct(fechamentoRel,concluidasRel),base:`${fechamentoRel}/${concluidasRel}`},
    {etapa:"Concluída → Cancelada",taxa:pct(canceladasRel,concluidasRel),base:`${canceladasRel}/${concluidasRel}`},
    {etapa:"Fechamento → Contrato",taxa:pct(contratosRel,fechamentoRel),base:`${contratosRel}/${fechamentoRel}`}
  ];

  const buildReport=arr=>{
    const visitasTotal=arr.length;
    const concluidas=arr.filter(v=>["concluida","avancou_fechamento","pos_ok","contrato"].includes(v.status)).length;
    const contratos=arr.filter(v=>v.contrato_fechado||v.status==="contrato").length;
    return {
      visitas:visitasTotal,
      concluidas,
      desmarcadas:arr.filter(v=>["cancelada","nao_apareceu"].includes(v.status)).length,
      fechamento:arr.filter(v=>v.checklist||v.status==="avancou_fechamento"||v.status==="pos_ok"||v.status==="contrato").length,
      contratos,
      valor:arr.reduce((s,v)=>s+Number(v.valor_proposta||0),0),
      conversao:pct(contratos,visitasTotal)
    };
  };

  const reportByPre=preUsers.map(p=>({nome:p.nome,...buildReport(reportVisits.filter(v=>v.pre_atendimento_id===p.id))}));
  const reportByMostrador=mostradores.map(m=>({nome:m.nome,...buildReport(reportVisits.filter(v=>v.mostrador_id===m.id))}));

  const fechamentoReportRows=fechamentoUsers.map(u=>{
    const arr=reportVisits.filter(v=>v.updated_by===u.id || v.pre_atendimento_id===u.id || v.created_by===u.id);
    const pos=arr.filter(v=>v.status==="pos_ok").length;
    const avancou=arr.filter(v=>v.status==="avancou_fechamento").length;
    const contratos=arr.filter(v=>v.status==="contrato"||v.contrato_fechado).length;
    return {nome:u.nome,pos_ok:pos,fechamento:avancou,contratos,conversao:pct(contratos,avancou||pos)};
  });

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
    const rows=[
      ["Dashboard Executivo"],
      ["Período",reportStart,reportEnd],
      ["Status","Quantidade"]
    ];

    statusReportRows.forEach(r=>rows.push([r.label,r.total]));

    rows.push([],["Taxas de conversão"],["Indicador","Base","Taxa"]);
    funilConversoes.forEach(r=>rows.push([r.etapa,r.base,r.taxa]));

    rows.push([],["Relatório por responsável"],["Nome","Visitas","Concluídas","Desmarcadas/Não apareceu","Avançaram fechamento","Contratos","Valor propostas","Conversão"]);
    reportByPre.forEach(r=>rows.push([r.nome,r.visitas,r.concluidas,r.desmarcadas,r.fechamento,r.contratos,brMoney(r.valor),r.conversao]));

    rows.push([],["Relatório por mostrador"],["Nome","Visitas","Concluídas","Desmarcadas/Não apareceu","Avançaram fechamento","Contratos","Valor propostas","Conversão"]);
    reportByMostrador.forEach(r=>rows.push([r.nome,r.visitas,r.concluidas,r.desmarcadas,r.fechamento,r.contratos,brMoney(r.valor),r.conversao]));

    rows.push([],["Motivos de cancelamento"],["Motivo","Quantidade","Percentual"]);
    motivoCancelamentoRows.forEach(r=>rows.push([r.motivo,r.total,r.percentual]));

    rows.push([],["Fechamento"],["Usuário","Pós OK","Avançou fechamento","Contratos","Conversão"]);
    fechamentoReportRows.forEach(r=>rows.push([r.nome,r.pos_ok,r.fechamento,r.contratos,r.conversao]));

    rows.push([],["Ações do mostrador/fechamento"],["Horário da ação","Usuário","Perfil","Ação","Imóvel","Cliente","Data da visita","Status anterior","Status novo","Valor proposta","Observação"]);
    acoes.filter(a=>{
      const d=parseHorarioBrasilDate(a.horario_brasil)||actionDateBR(a.created_at);
      return d>=reportStart && d<=reportEnd;
    }).forEach(a=>{
      const v=visitas.find(x=>x.id===a.visita_id);
      const u=getUser(a.usuario_id);
      rows.push([actionTimeDisplay(a),u?.nome||"",ROLES[u?.tipo]||u?.tipo||"",a.tipo_acao,v?.codigo_imovel||"",v?.cliente_nome||"",v?.data_visita||"",statusLabel(a.status_anterior),statusLabel(a.status_novo),brMoney(a.valor_proposta),a.observacao||""]);
    });

    exportCsv(`castan-relatorio-${reportStart}-a-${reportEnd}.csv`,rows);
  }

  function startNewVisit(day=null, horario=null){
    if(!canCreateVisit)return alert("Seu perfil não pode criar visitas.");

    const horaInicial = horario ? String(horario).slice(0,5) : "09:00";
    const idx = HORARIOS_VISITA.indexOf(horaInicial);
    const horaFinal = idx >= 0 && idx < HORARIOS_VISITA.length-1 ? HORARIOS_VISITA[idx+3] || HORARIOS_VISITA[idx+1] : "10:00";

    setModalVisit({
      ...emptyVisit(user,preUsers,mostradores),
      data_visita:day||todayISO(),
      horario_visita:horaInicial,
      horario_fim_visita:horaFinal
    });
  }

  function openVisit(v){
    const somenteLeitura = v.status==="cancelada" || !canEditVisit(v);
    setModalVisit({...v,valor_proposta:v.valor_proposta||"",somenteLeitura});
  }

  const unread=notificacoes.filter(n=>n.usuario_id===user?.id&&!n.lida).length;
  const minhasVisitasHoje=visitas
    .filter(v=>v.data_visita===todayISO())
    .filter(v=>v.pre_atendimento_id===user?.id || v.mostrador_id===user?.id)
    .filter(v=>!["cancelada","reserva_cancelada"].includes(v.status));
  const minhasAtualizacoesFotos=visitas
    .filter(v=>v.pre_atendimento_id===user?.id || v.mostrador_id===user?.id)
    .filter(v=>v.atualizar_fotos&&!["cancelada","reserva_cancelada"].includes(v.status)).length;

  const navItems=[
    ["inicio",Home,"Inicial"],
    ["calendario",CalendarDays,"Calendário"],
    ["minha_agenda",CalendarDays,"Minha agenda"],
    ["bloquear_agenda",CalendarDays,"Bloquear agenda"],
    ["canceladas",ListChecks,"Canceladas"],
    ["fechamento",ClipboardCheck,"Fechamento"],
    ["lista",ListChecks,"Lista"],
    ["central",BarChart3,"Central"],
    ["relatorios",BarChart3,"Relatórios"],
    ["equipe",Users,"Equipe"]
  ];

  function goMobile(id){
    setView(id);
    setMobileMenuOpen(false);
  }

  function ativarModoTV(){
    setTvMode(true);
    setTimeout(()=>{
      try{document.documentElement.requestFullscreen?.();}catch{}
    },100);
  }

  function sairModoTV(){
    setTvMode(false);
    try{document.exitFullscreen?.();}catch{}
  }

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

  return <div className={`app ${tvMode?"tv-mode":""}`} onTouchStart={e=>{touchStart.current=e.touches[0].clientY}} onTouchEnd={e=>{const end=e.changedTouches[0].clientY;if(window.scrollY===0&&end-touchStart.current>80)loadAll()}}>

    <Toast notifications={toast} onClose={()=>setToast([])} />
    {showNotifications&&<NotificationsPanel notificacoes={notificacoes.filter(n=>n.usuario_id===user?.id)} onClose={()=>setShowNotifications(false)} onMarkRead={marcarNotificacoesComoLidas}/>} 
    {updateAvailable&&<div className="update-banner">🔄 Nova versão disponível. O sistema será atualizado automaticamente assim que não houver edição aberta.</div>}

    <header className="header">
      {user&&<button className="mobile-menu-btn" onClick={()=>setMobileMenuOpen(true)} aria-label="Abrir menu">☰</button>}
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
        <button className="btn ghost" onClick={garantirNotificacoes}>Ativar notificações</button>
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
        <nav className="tabs desktop-tabs">
          {navItems.map(([id,Icon,label])=><button key={id} onClick={()=>setView(id)} className={view===id?"active":""}><Icon size={16}/> {label}</button>)}
        </nav>

        {mobileMenuOpen&&<div className="mobile-drawer-overlay" onClick={()=>setMobileMenuOpen(false)}>
          <aside className="mobile-drawer" onClick={e=>e.stopPropagation()}>
            <div className="mobile-drawer-head">
              <img src="/logo-castan-agenda.jpeg" alt="Castan" onError={e=>{e.currentTarget.style.display="none"}}/>
              <div>
                <strong>{user?.nome}</strong>
                <span>{ROLES[user?.tipo]||user?.tipo}</span>
              </div>
              <button onClick={()=>setMobileMenuOpen(false)}>×</button>
            </div>

            <div className="mobile-drawer-stats">
              <div><strong>{minhasVisitasHoje.length}</strong><span>visitas hoje</span></div>
              <div><strong>{minhasAtualizacoesFotos}</strong><span>fotos</span></div>
              <div><strong>{unread}</strong><span>notificações</span></div>
            </div>

            <div className="mobile-drawer-nav">
              {navItems.map(([id,Icon,label])=>
                <button key={id} onClick={()=>goMobile(id)} className={view===id?"active":""}>
                  <Icon size={18}/> {label}
                </button>
              )}
            </div>

            <div className="mobile-drawer-actions">
              <button className="btn ghost" onClick={()=>{setMobileMenuOpen(false);loadAll();}}>Atualizar</button>
              <button className="btn ghost" onClick={()=>{setMobileMenuOpen(false);garantirNotificacoes();}}>Ativar notificações</button>
              <button className="btn danger" onClick={()=>{setMobileMenuOpen(false);doLogout();}}>Sair</button>
            </div>
          </aside>
        </div>}

        <div className="mobile-bottom-nav">
          <button className={view==="inicio"?"active":""} onClick={()=>setView("inicio")}><Home size={19}/><span>Início</span></button>
          <button className={view==="calendario"?"active":""} onClick={()=>setView("calendario")}><CalendarDays size={19}/><span>Agenda</span></button>
          {canCreateVisit&&<button className="mobile-fab" onClick={()=>startNewVisit()}><Plus size={24}/></button>}
          <button className={view==="notificacoes"?"active":""} onClick={()=>setShowNotifications(v=>!v)}><Bell size={19}/><span>Notif.</span></button>
          <button onClick={()=>setMobileMenuOpen(true)}><Users size={19}/><span>Menu</span></button>
        </div>

        <main className="content">
          <div className="sync">Última sincronização: {lastSync}</div>

          {view==="inicio"&&<>
            <section className="welcome-card">
              <div>
                <span>{saudacaoDoDia()}, {user?.nome||"equipe"}!</span>
                <h2>Boa sorte nas visitas de hoje 🚀</h2>
              </div>
              <div className="welcome-stats">
                <strong>{minhasVisitasHoje.length}</strong>
                <small>visitas hoje</small>
              </div>
              <div className="welcome-stats">
                <strong>{minhasAtualizacoesFotos}</strong>
                <small>atualização de fotos</small>
              </div>
              <div className="welcome-stats">
                <strong>{unread}</strong>
                <small>notificações</small>
              </div>
            </section>

            <section className="metrics">
              <Metric title="Visitas do dia" value={todayVisits.length} onClick={()=>setView("lista")}/>
              <Metric title="Visitas agendadas" value={todayVisits.filter(v=>["agendada","confirmada"].includes(v.status)).length} onClick={()=>{setFilterStatus("agendada");setView("lista")}}/>
              <Metric title="Visitas canceladas" value={visitasCanceladasBase.length} onClick={()=>setView("canceladas")}/>
              <Metric title="Visitas remarcadas" value={todayVisits.filter(v=>v.status==="remarcada").length} onClick={()=>{setFilterStatus("remarcada");setView("lista")}}/>
              <Metric title="Reservas Canceladas" value={visitas.filter(v=>v.status==="reserva_cancelada").length} onClick={()=>{setFilterStatus("reserva_cancelada");setView("lista")}}/>
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
                  {todayVisits.map(v=><VisitCard key={v.id} v={v} getUser={getUser} colorForUser={colorForVisit} onClick={()=>openVisit(v)}/>)}
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
                ? <Calendar year={year} month={month} visitas={visibleVisits.filter(v=>v.status!=="reserva_cancelada")} bloqueios={agendaBloqueios.filter(b=>b.ativo!==false)} colorForUser={colorForVisit} getUser={getUser} onNew={startNewVisit} onEdit={openVisit}/>
                : calendarMode==="week"
                  ? <WeeklyCalendar weekStart={weekStart} visitas={visibleVisits.filter(v=>v.status!=="reserva_cancelada")} bloqueios={agendaBloqueios.filter(b=>b.ativo!==false)} colorForUser={colorForVisit} getUser={getUser} onNew={startNewVisit} onEdit={openVisit}/>
                  : <DailyCalendar currentDay={currentDay} visitas={visibleVisits.filter(v=>v.status!=="reserva_cancelada")} bloqueios={agendaBloqueios.filter(b=>b.ativo!==false)} colorForUser={colorForVisit} getUser={getUser} onNew={startNewVisit} onEdit={openVisit}/>
              }
            </Card>
          </>}

          {view==="minha_agenda"&&
            <Card title="Minha agenda">
              {minhaAgendaVisits.map(v=><VisitCard key={v.id} v={v} getUser={getUser} colorForUser={colorForVisit} onClick={()=>openVisit(v)}/>)}
              {!minhaAgendaVisits.length&&<Empty text="Nenhuma visita encontrada para esta agenda."/>}
            </Card>
          }
          {view==="bloquear_agenda"&&
            <Card title="Bloqueios de agenda">
              <p className="hint">Consulte os bloqueios de agenda dos mostradores. Somente mostradores podem criar ou remover seus próprios bloqueios.</p>

              {isMostrador&&<>
              <div className="bloqueio-form">
                <label>
                  <span>Período de bloqueio - início *</span>
                  <input type="date" value={bloqueioForm.data_bloqueio} onChange={e=>setBloqueioForm({...bloqueioForm,data_bloqueio:e.target.value,data_fim:e.target.value>bloqueioForm.data_fim?e.target.value:bloqueioForm.data_fim})}/>
                </label>

                <label>
                  <span>Período de bloqueio - final *</span>
                  <input type="date" value={bloqueioForm.data_fim} onChange={e=>setBloqueioForm({...bloqueioForm,data_fim:e.target.value})}/>
                </label>

                <label>
                  <span>Horário inicial *</span>
                  <input type="time" value={bloqueioForm.horario_inicio} step="600" onChange={e=>setBloqueioForm({...bloqueioForm,horario_inicio:e.target.value})}/>
                </label>

                <label>
                  <span>Horário final *</span>
                  <input type="time" value={bloqueioForm.horario_fim} step="600" onChange={e=>setBloqueioForm({...bloqueioForm,horario_fim:e.target.value})}/>
                </label>

                <label className="check full">
                  <input type="checkbox" checked={Boolean(bloqueioForm.almoco_fixo)} onChange={e=>setBloqueioForm({...bloqueioForm,almoco_fixo:e.target.checked,justificativa:e.target.checked?"Almoço":bloqueioForm.justificativa})}/>
                  Bloqueio fixo de horário de almoço no período
                </label>

                <label className="full">
                  <span>{bloqueioForm.almoco_fixo?"Observação do almoço":"Justificativa obrigatória *"}</span>
                  <textarea value={bloqueioForm.justificativa} onChange={e=>setBloqueioForm({...bloqueioForm,justificativa:e.target.value})} placeholder="Ex.: almoço, reunião externa, horário indisponível, compromisso particular..."/>
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
                  <option value="all">Todos pré-atendimentos</option>
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
                  <VisitCard key={v.id} v={v} getUser={getUser} colorForUser={colorForVisit} onClick={()=>openVisit(v)}/>
                )}
              </div>

              {!visitasCanceladasFiltradas.length&&<Empty text="Nenhuma visita cancelada encontrada."/>}
            </Card>
          }

          {view==="fechamento"&&
            <Card title="Visitas enviadas para fechamento">
              <p className="hint">Consulta das visitas que foram marcadas como Check list OK pela equipe de fechamento.</p>
              {visitasFechamentoConsulta.map(v=>
                <VisitCard key={v.id} v={{...v,somenteLeitura:true}} getUser={getUser} colorForUser={colorForVisit} onClick={()=>setModalVisit({...v,valor_proposta:v.valor_proposta||"",somenteLeitura:true})}/>
              )}
              {!visitasFechamentoConsulta.length&&<Empty text="Nenhuma visita enviada para fechamento."/>}
            </Card>
          }

          {view==="lista"&&<>
            <Filters preUsers={preUsers} mostradores={mostradores} filterPre={filterPre} setFilterPre={setFilterPre} filterMostrador={filterMostrador} setFilterMostrador={setFilterMostrador} filterStatus={filterStatus} setFilterStatus={setFilterStatus} searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
            <Card title="Lista de visitas">
              {visibleVisits.map(v=><VisitCard key={v.id} v={v} getUser={getUser} colorForUser={colorForVisit} onClick={()=>openVisit(v)}/>)}
            </Card>
          </>}

          {view==="central"&&
            <CentralOperacional
              visitasHoje={centralHoje}
              ativas={centralAtivas}
              concluidas={centralConcluidas}
              canceladas={centralCanceladas}
              reservas={centralReservas}
              fotos={centralFotos}
              emAndamento={centralEmAndamento}
              proxima={centralProxima}
              proximas={centralProximas.slice(0,5)}
              cancelamentosRecentes={centralCancelamentosRecentes}
              getUser={getUser}
              lastSync={lastSync}
              tvMode={tvMode}
              onModoTV={ativarModoTV}
              onSairTV={sairModoTV}
              onOpenVisit={openVisit}
            />
          }

          {view==="relatorios"&&canViewReports&&
            <Card title="Relatórios">
              <div className="reportbar">
                <label><span>De</span><input type="date" value={reportStart} onChange={e=>setReportStart(e.target.value)}/></label>
                <label><span>Até</span><input type="date" value={reportEnd} onChange={e=>setReportEnd(e.target.value)}/></label>
                <button className="btn primary" onClick={exportReport}>Exportar CSV/Excel</button>
              </div>

              <section className="report-section">
                <h2>Dashboard Executivo</h2>
                <div className="report-kpis">
                  <Metric title="Total de visitas" value={totalRelatorio}/>
                  <Metric title="Agendadas" value={agendadasRel}/>
                  <Metric title="Confirmadas" value={confirmadasRel}/>
                  <Metric title="Canceladas" value={canceladasRel}/>
                  <Metric title="Concluídas" value={concluidasRel}/>
                  <Metric title="Fechamento" value={fechamentoRel}/>
                  <Metric title="Contratos" value={contratosRel}/>
                </div>

                <div className="report-grid">
                  <PieReport title="Distribuição por status" rows={statusReportRows.filter(r=>r.total>0)} labelKey="label" valueKey="total"/>
                  <PieReport title="Análise de cancelamentos" rows={motivoCancelamentoRows} labelKey="motivo" valueKey="total"/>
                </div>

                <h3>Taxas de conversão</h3>
                <ConversionGrid rows={funilConversoes}/>
              </section>

              <section className="report-section">
                <h2>Relatório existente</h2>
                <h3>Por responsável pelo agendamento</h3>
                <ReportTable rows={reportByPre}/>
                <h3>Por mostrador</h3>
                <ReportTable rows={reportByMostrador}/>
              </section>

              <section className="report-section">
                <h2>Análise de Cancelamentos</h2>
                <CancelReasonTable rows={motivoCancelamentoRows} total={canceladasRel} outrosDetalhes={outrosCancelamentoDetalhes}/>
              </section>

              <section className="report-section">
                <h2>Análise de Cancelamento de Reservas de Agenda</h2>
                <CancelReasonTable rows={motivoReservaCanceladaRows} total={reservasCanceladasRel} outrosDetalhes={outrosReservaCanceladaDetalhes}/>
              </section>

              <section className="report-section">
                <h2>Relatório de Fechamento</h2>
                <FechamentoTable rows={fechamentoReportRows}/>
              </section>

              <section className="report-section">
                <h2>Relatório de Funil</h2>
                <FunnelReport rows={funilRows}/>
                <ConversionGrid rows={funilConversoes}/>
              </section>

              <section className="report-section">
                <h2>Horário das ações</h2>
                <ActionTable acoes={acoes} visitas={visitas} getUser={getUser} reportStart={reportStart} reportEnd={reportEnd}/>
              </section>
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
        <option value="all">Todos pré-atendimentos</option>
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

function CentralOperacional({visitasHoje,ativas,concluidas,canceladas,reservas,fotos,emAndamento,proxima,proximas,cancelamentosRecentes=[],getUser,lastSync,tvMode,onModoTV,onSairTV,onOpenVisit}){
  return <section className="central-op">
    <div className="central-head">
      <div>
        <h1>Castan Visitas</h1>
        <p>Central Operacional em tempo real</p>
      </div>
      <div className="central-actions">
        <span>Última atualização: {lastSync}</span>
        {!tvMode
          ? <button className="btn primary" onClick={onModoTV}>Modo TV</button>
          : <button className="btn ghost" onClick={onSairTV}>Sair do modo TV</button>
        }
      </div>
    </div>

    <div className="central-kpis">
      <Metric title="Visitas hoje" value={visitasHoje.length}/>
      <Metric title="Concluídas" value={concluidas}/>
      <Metric title="Em andamento" value={emAndamento.length}/>
      <Metric title="Reservas" value={reservas}/>
      <Metric title="Canceladas" value={canceladas}/>
      <Metric title="Atualização fotos" value={fotos}/>
    </div>

    <div className="central-grid">
      <div className="central-card central-next">
        <h2>Próxima visita</h2>
        {proxima?
          <button className="central-next-card" onClick={()=>onOpenVisit(proxima)}>
            <strong>{String(proxima.horario_visita||"").slice(0,5)}</strong>
            <span>{proxima.status==="reserva"?"RESERVA":proxima.codigo_imovel}</span>
            <small>Cliente: {proxima.cliente_nome||"-"}</small>
            <small>Mostrador: {getUser(proxima.mostrador_id)?.nome||"-"}</small>
            <small>Pré: {getUser(proxima.pre_atendimento_id)?.nome||"-"}</small>
          </button>
          : <Empty text="Nenhuma próxima visita para hoje."/>
        }
      </div>

      <div className="central-card">
        <h2>Visitas em andamento</h2>
        {emAndamento.length?emAndamento.map(v=>
          <button className="central-list-item active" key={v.id} onClick={()=>onOpenVisit(v)}>
            <strong>{String(v.horario_visita||"").slice(0,5)} • {v.codigo_imovel||"Reserva"}</strong>
            <span>{getUser(v.mostrador_id)?.nome||"-"} — {v.cliente_nome||"-"}</span>
          </button>
        ):<Empty text="Nenhuma visita em andamento."/>}
      </div>

      <div className="central-card">
        <h2>Próximas 5 visitas</h2>
        {proximas.length?proximas.map(v=>
          <button className="central-list-item" key={v.id} onClick={()=>onOpenVisit(v)}>
            <strong>{String(v.horario_visita||"").slice(0,5)} • {v.status==="reserva"?"RESERVA":v.codigo_imovel}</strong>
            <span>{getUser(v.mostrador_id)?.nome||"-"} — {v.cliente_nome||"-"}</span>
          </button>
        ):<Empty text="Sem próximas visitas."/>}
      </div>

      <div className={`central-card central-cancelamentos ${cancelamentosRecentes.length?"alerta-cancelamento":""}`}>
        <h2>⚠️ Cancelamentos recentes</h2>
        {cancelamentosRecentes.length?cancelamentosRecentes.map(v=>
          <button className="central-list-item cancelado" key={v.id} onClick={()=>onOpenVisit(v)}>
            <strong>{String(v.horario_visita||"").slice(0,5)} • {v.codigo_imovel||"Reserva"}</strong>
            <span>{v.motivo_cancelamento||"Cancelada"}{String(v.motivo_cancelamento||"").toLowerCase()==="outros"&&v.motivo_cancelamento_outros?` — ${v.motivo_cancelamento_outros}`:""}</span>
            <small>{getUser(v.mostrador_id)?.nome||"-"} — {v.cliente_nome||"-"}</small>
          </button>
        ):<Empty text="Nenhum cancelamento hoje."/>}
      </div>
    </div>
  </section>;
}

function Metric({title,value,onClick}){return <div className={`metric ${onClick?"metric-clickable":""}`} onClick={onClick}><strong>{value}</strong><span>{title}</span></div>}
function Card({title,children}){return <section className="card">{title&&<h2>{title}</h2>}{children}</section>}
function Empty({text}){return <div className="empty">{text}</div>}

function Filters({preUsers,mostradores,filterPre,setFilterPre,filterMostrador,setFilterMostrador,filterStatus,setFilterStatus,searchTerm,setSearchTerm}){
  return <div className="filters">
    <input placeholder="Buscar imóvel, cliente, proprietário ou contato" value={searchTerm||""} onChange={e=>setSearchTerm(e.target.value)} style={{minWidth:260}}/>
    <select value={filterPre} onChange={e=>setFilterPre(e.target.value)}>
      <option value="all">Todos pré-atendimentos</option>
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
  return <div className={`visitcard ${v.status==="cancelada"?"calendar-cancelada":""}`} style={{borderLeftColor:v.status==="cancelada"?"#B91C1C":colorForUser(v)}} onClick={onClick}>
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
      {v.cliente_contato && (
        <p>
          <a href={whatsappClienteLink(v)} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} className="whatsapp-link">
            WhatsApp Cliente
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
    `Imóvel: ${v.status==="reserva"?"RESERVA DE AGENDA":(v.codigo_imovel||"-")}`,
    `Cliente: ${v.cliente_nome||"-"}`,
    `Endereço: ${v.endereco_imovel||"-"}`,
    `Pré: ${getUser?.(v.pre_atendimento_id)?.nome||"-"}`,
    `Mostrador: ${getUser?.(v.mostrador_id)?.nome||"-"}`,
    `Status: ${statusLabel(v.status)}`,
    v.atualizar_fotos ? "ATUALIZAR FOTOS" : ""
  ].filter(Boolean).join("\n");
}

function bloqueioTooltip(b,getUser){
  return [
    `AGENDA BLOQUEADA`,
    `Mostrador: ${getUser?.(b.usuario_id)?.nome||"Mostrador"}`,
    `Data: ${String(b.data_bloqueio||"").split("-").reverse().join("/")}`,
    `Horário: ${String(b.horario_inicio||"").slice(0,5)} às ${String(b.horario_fim||"").slice(0,5)}`,
    `Motivo: ${b.justificativa||"-"}`
  ].join("\n");
}

function Calendar({year,month,visitas,bloqueios=[],colorForUser,getUser,onNew,onEdit}){
  const [tooltip,setTooltip]=useState(null);

  const slots=Array.from({length:21}).map((_,i)=>{
    const total=8*60+i*30;
    const h=Math.floor(total/60);
    const m=total%60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  });

  const monthDays=Array.from({length:new Date(year,month+1,0).getDate()}).map((_,i)=>{
    const date=`${year}-${String(month+1).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`;
    const d=new Date(`${date}T00:00:00`);
    return {day:i+1,date,weekday:d.getDay()};
  }).filter(d=>d.weekday!==0);

  const firstVisibleWeekday=monthDays[0]?.weekday || 1;
  const leadingEmpty=Math.max(0,firstVisibleWeekday-1);

  function setTip(e,text){
    const rect=e.currentTarget.getBoundingClientRect();
    setTooltip({text,x:Math.min(rect.left,window.innerWidth-330),y:Math.max(12,rect.top-12)});
  }

  function sortByTime(a,b){
    const ta=a.tipo==="bloqueio"?a.item.horario_inicio:a.item.horario_visita;
    const tb=b.tipo==="bloqueio"?b.item.horario_inicio:b.item.horario_visita;
    return String(ta).localeCompare(String(tb));
  }

  function belongsToSlot(ev,slot){
    const hora=String(ev.tipo==="bloqueio"?ev.item.horario_inicio:ev.item.horario_visita).slice(0,5);
    const [hh,mm]=hora.split(":").map(Number);
    const bucketMin = (mm||0) < 30 ? 0 : 30;
    const slotCalculado = `${String(hh||0).padStart(2,"0")}:${String(bucketMin).padStart(2,"0")}`;
    return slotCalculado===slot;
  }

  return <div className="month-scheduler month-scheduler-list no-sunday-calendar" onMouseLeave={()=>setTooltip(null)}>
    <div className="month-scheduler-weekdays">{["Seg","Ter","Qua","Qui","Sex","Sáb"].map(d=><div key={d}>{d}</div>)}</div>
    <div className="month-scheduler-grid">
      {Array.from({length:leadingEmpty}).map((_,i)=><div className="month-day emptyday" key={`e${i}`}/>)}
      {monthDays.map(({day,date})=>{
        const eventos=[
          ...bloqueios.filter(b=>b.data_bloqueio===date).map(b=>({tipo:"bloqueio",id:`bloq-${b.id}`,item:b})),
          ...visitas.filter(v=>v.data_visita===date).map(v=>({tipo:"visita",id:v.id,item:v}))
        ].sort(sortByTime);

        return <div className="month-day month-day-list" key={date}>
          <div className="month-day-number">{day}</div>
          <div className="month-day-agenda">
            {slots.map(slot=>{
              const items=eventos.filter(ev=>belongsToSlot(ev,slot));
              return <div className="month-hour-row halfhour-row" key={slot} onClick={()=>onNew(date,slot)}>
                <span className="month-hour-label">{slot}</span>
                <div className="month-hour-items">
                  {items.map(ev=>{
                    if(ev.tipo==="bloqueio"){
                      const b=ev.item;
                      return <div key={ev.id} className="month-list-event bloqueio-event" onMouseEnter={e=>setTip(e,bloqueioTooltip(b,getUser))} onMouseMove={e=>setTip(e,bloqueioTooltip(b,getUser))} onMouseLeave={()=>setTooltip(null)} onClick={e=>e.stopPropagation()}>
                        <strong>{String(b.horario_inicio).slice(0,5)}-{String(b.horario_fim).slice(0,5)} BLOQUEADO</strong>
                        <span>{getUser?.(b.usuario_id)?.nome||"Mostrador"} • {b.justificativa||"Sem motivo"}</span>
                      </div>;
                    }

                    const v=ev.item;
                    return <div key={ev.id} className={`month-list-event ${v.status==="cancelada"?"calendar-cancelada":""} ${v.atualizar_fotos?"foto-destaque":""}`} style={{borderLeftColor:colorForUser(v)}} onMouseEnter={e=>setTip(e,visitTooltip(v,getUser))} onMouseMove={e=>setTip(e,visitTooltip(v,getUser))} onMouseLeave={()=>setTooltip(null)} onClick={e=>{e.stopPropagation();onEdit(v)}}>
                      <strong>{v.status==="cancelada"?"⚠️ ":""}{String(v.horario_visita).slice(0,5)}-{String(v.horario_fim_visita||v.horario_visita).slice(0,5)} • {v.status==="cancelada"?"CANCELADA":(v.status==="reserva"?"RESERVA":v.codigo_imovel)}</strong>
                      <span>{v.status==="reserva"?(getUser?.(v.mostrador_id)?.nome||"Reserva"):(v.cliente_nome||"")}</span>
                    </div>;
                  })}
                </div>
              </div>;
            })}
          </div>
        </div>;
      })}
    </div>
    {tooltip&&<div className="calendar-tooltip-floating" style={{left:tooltip.x,top:tooltip.y}}>{tooltip.text}</div>}
  </div>;
}

function WeeklyCalendar({weekStart,visitas,bloqueios=[],colorForUser,getUser,onNew,onEdit}){
  const [tooltip,setTooltip]=useState(null);

  const monday=new Date(weekStart);
  const weekday=monday.getDay();
  const offset=weekday===0?1-weekday:1-weekday;
  monday.setDate(monday.getDate()+offset);

  const days=Array.from({length:6}).map((_,i)=>{
    const d=new Date(monday);
    d.setDate(monday.getDate()+i);
    return d;
  });

  const slots=Array.from({length:21}).map((_,i)=>{
    const total=8*60+i*30;
    const h=Math.floor(total/60);
    const m=total%60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  });

  function setTip(e,text){
    const rect=e.currentTarget.getBoundingClientRect();
    setTooltip({text,x:Math.min(rect.left,window.innerWidth-330),y:Math.max(12,rect.top-12)});
  }

  function sortByTime(a,b){
    const ta=a.tipo==="bloqueio"?a.item.horario_inicio:a.item.horario_visita;
    const tb=b.tipo==="bloqueio"?b.item.horario_inicio:b.item.horario_visita;
    return String(ta).localeCompare(String(tb));
  }

  function belongsToSlot(ev,slot){
    const hora=String(ev.tipo==="bloqueio"?ev.item.horario_inicio:ev.item.horario_visita).slice(0,5);
    const [hh,mm]=hora.split(":").map(Number);
    const bucketMin = (mm||0) < 30 ? 0 : 30;
    const slotCalculado = `${String(hh||0).padStart(2,"0")}:${String(bucketMin).padStart(2,"0")}`;
    return slotCalculado===slot;
  }

  const eventsByDateSlot = {};
  days.forEach(d=>{
    const date=dateStr(d);
    const eventos=[
      ...bloqueios.filter(b=>b.data_bloqueio===date).map(b=>({tipo:"bloqueio",id:`bloq-${b.id}`,item:b})),
      ...visitas.filter(v=>v.data_visita===date).map(v=>({tipo:"visita",id:v.id,item:v}))
    ].sort(sortByTime);

    slots.forEach(slot=>{
      eventsByDateSlot[`${date}|${slot}`]=eventos.filter(ev=>belongsToSlot(ev,slot));
    });
  });

  function rowMinHeight(slot){
    const maxItems=Math.max(...days.map(d=>eventsByDateSlot[`${dateStr(d)}|${slot}`]?.length||0),1);
    return Math.max(48, maxItems*48 + 8);
  }

  return <div className="week-scheduler week-scheduler-list week-autoheight" onMouseLeave={()=>setTooltip(null)}>
    <div className="week-scheduler-head">
      <div className="time-col-head"></div>
      {days.map(d=>{
        const date=dateStr(d);
        const isToday=date===todayISO();
        return <div className={`week-scheduler-day-head ${isToday?"today":""}`} key={date}>
          <span>{WEEKDAYS[d.getDay()]}</span>
          <strong>{d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}</strong>
        </div>;
      })}
    </div>

    <div className="week-table">
      {slots.map(slot=>{
        const height=rowMinHeight(slot);
        return <React.Fragment key={slot}>
          <div className={`week-time-cell ${slot.endsWith(":30")?"half-hour-label":""}`} style={{minHeight:height}}>{slot}</div>
          {days.map(d=>{
            const date=dateStr(d);
            const items=eventsByDateSlot[`${date}|${slot}`]||[];
            return <div className="week-slot-cell" key={`${date}-${slot}`} style={{minHeight:height}} onClick={()=>onNew(date,slot)}>
              {items.map(ev=>{
                if(ev.tipo==="bloqueio"){
                  const b=ev.item;
                  return <div key={ev.id} className="week-list-event bloqueio-event" onMouseEnter={e=>setTip(e,bloqueioTooltip(b,getUser))} onMouseMove={e=>setTip(e,bloqueioTooltip(b,getUser))} onMouseLeave={()=>setTooltip(null)} onClick={e=>e.stopPropagation()}>
                    <strong>{String(b.horario_inicio).slice(0,5)}-{String(b.horario_fim).slice(0,5)} • BLOQUEADO</strong>
                    <span>{getUser?.(b.usuario_id)?.nome||"Mostrador"} • {b.justificativa||"Sem motivo"}</span>
                  </div>;
                }

                const v=ev.item;
                return <div key={ev.id} className={`week-list-event ${v.status==="cancelada"?"calendar-cancelada":""} ${v.atualizar_fotos?"foto-destaque-card":""}`} style={{borderLeftColor:colorForUser(v)}} onMouseEnter={e=>setTip(e,visitTooltip(v,getUser))} onMouseMove={e=>setTip(e,visitTooltip(v,getUser))} onMouseLeave={()=>setTooltip(null)} onClick={e=>{e.stopPropagation();onEdit(v)}}>
                  <strong>{v.status==="cancelada"?"⚠️ ":""}{String(v.horario_visita).slice(0,5)}-{String(v.horario_fim_visita||v.horario_visita).slice(0,5)} • {v.status==="cancelada"?"CANCELADA":(v.status==="reserva"?"RESERVA":v.codigo_imovel)}</strong>
                  <span>{v.status==="reserva"?(getUser?.(v.mostrador_id)?.nome||"Reserva"):v.cliente_nome}</span>
                </div>;
              })}
            </div>;
          })}
        </React.Fragment>;
      })}
    </div>

    {tooltip&&<div className="calendar-tooltip-floating" style={{left:tooltip.x,top:tooltip.y}}>{tooltip.text}</div>}
  </div>;
}


function DailyCalendar({currentDay,visitas,bloqueios=[],colorForUser,getUser,onNew,onEdit}){
  const d = new Date(currentDay+"T00:00:00");
  const arr=visitas.filter(v=>v.data_visita===currentDay).sort((a,b)=>String(a.horario_visita).localeCompare(String(b.horario_visita)));
  const dayBloqueios=bloqueios.filter(b=>b.data_bloqueio===currentDay).sort((a,b)=>String(a.horario_inicio).localeCompare(String(b.horario_inicio)));

  return <div className="daily-calendar"><div className="daily-day" onClick={()=>onNew(currentDay)}>
    <div className="weekly-day-head"><strong>{WEEKDAYS[d.getDay()]}</strong><span>{d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"})}</span></div>
    {dayBloqueios.map(b=><div className="weekly-visit daily-visit bloqueio-event" key={`bloq-${b.id}`} onClick={e=>e.stopPropagation()}><strong>{String(b.horario_inicio).slice(0,5)}-{String(b.horario_fim).slice(0,5)} • BLOQUEADO</strong><span>{getUser?.(b.usuario_id)?.nome||"Mostrador"} • {b.justificativa||"Sem motivo"}</span></div>)}
    {arr.length?arr.map(v=><div className={`weekly-visit daily-visit ${v.atualizar_fotos?"foto-destaque-card":""}`} data-tooltip={visitTooltip(v,getUser)} key={v.id} style={{borderLeftColor:colorForUser(v)}} onClick={e=>{e.stopPropagation();onEdit(v)}}><strong>{String(v.horario_visita).slice(0,5)}-{String(v.horario_fim_visita||v.horario_visita).slice(0,5)} • {v.codigo_imovel}</strong><span>{v.cliente_nome}</span><small>{v.endereco_imovel}</small></div>):(!dayBloqueios.length&&<Empty text="Nenhuma visita para hoje."/>)}
  </div></div>;
}

function ReportTable({rows}){
  return <div className="tablewrap">
    <table>
      <thead><tr><th>Nome</th><th>Visitas</th><th>Concluídas</th><th>Desmarcadas</th><th>Fechamento</th><th>Contratos</th><th>Valor</th><th>Conversão</th></tr></thead>
      <tbody>{rows.map(r=><tr key={r.nome}><td>{r.nome}</td><td>{r.visitas}</td><td>{r.concluidas}</td><td>{r.desmarcadas}</td><td>{r.fechamento}</td><td>{r.contratos}</td><td>{brMoney(r.valor)}</td><td>{r.conversao}</td></tr>)}</tbody>
    </table>
  </div>;
}

function PieReport({title,rows,labelKey,valueKey}){
  const total=rows.reduce((s,r)=>s+Number(r[valueKey]||0),0);
  let acc=0;
  const colors=["#123B63","#B91C1C","#15803D","#F59E0B","#7C3AED","#0891B2","#DB2777","#475569","#65A30D"];
  const gradient=rows.length
    ? rows.map((r,i)=>{
        const val=total?Number(r[valueKey]||0)/total*100:0;
        const start=acc;
        acc+=val;
        return `${colors[i%colors.length]} ${start}% ${acc}%`;
      }).join(",")
    : "#e5e7eb 0% 100%";

  return <div className="chart-card">
    <h3>{title}</h3>
    <div className="pie-wrap">
      <div className="pie" style={{background:`conic-gradient(${gradient})`}}/>
      <div className="pie-legend">
        {rows.length?rows.map((r,i)=>
          <div className="legend-row" key={String(r[labelKey])}>
            <span className="legend-dot" style={{background:colors[i%colors.length]}}/>
            <span>{r[labelKey]}</span>
            <strong>{r[valueKey]}</strong>
          </div>
        ):<span className="hint">Sem dados no período.</span>}
      </div>
    </div>
  </div>;
}

function ConversionGrid({rows}){
  return <div className="conversion-grid">
    {rows.map(r=>
      <div className="conversion-card" key={r.etapa}>
        <span>{r.etapa}</span>
        <strong>{r.taxa}</strong>
        <small>{r.base}</small>
      </div>
    )}
  </div>;
}

function CancelReasonTable({rows,total,outrosDetalhes=[]}){
  const [showOutros,setShowOutros]=useState(false);
  const [busca,setBusca]=useState("");

  const detalhesFiltrados=outrosDetalhes.filter(r=>
    String(r.motivo||"").toLowerCase().includes(String(busca||"").toLowerCase())
  );

  return <div className="tablewrap cancel-analysis">
    <table>
      <thead><tr><th>Motivo</th><th>Quantidade</th><th>Percentual</th></tr></thead>
      <tbody>{rows.map(r=>{
        const isOutros=r.motivo==="Outros";
        return <tr
          key={r.motivo}
          className={isOutros?"linha-outros-clicavel":""}
          onClick={()=>isOutros&&setShowOutros(true)}
          title={isOutros?"Clique para ver os detalhes de Outros":""}
        >
          <td>
            {isOutros ? <button className="link-outros" type="button">▶ Outros <small>clique para detalhar</small></button> : r.motivo}
          </td>
          <td>{r.total}</td>
          <td>{r.percentual}</td>
        </tr>;
      })}</tbody>
      <tfoot><tr><td>Total</td><td>{total}</td><td>100%</td></tr></tfoot>
    </table>

    {showOutros&&
      <div className="overlay">
        <div className="modal modal-small">
          <div className="modalhead">
            <h2>Outros motivos de cancelamento</h2>
            <button onClick={()=>setShowOutros(false)}><X/></button>
          </div>

          <div className="outros-modal-body">
            <input
              className="search"
              placeholder="Pesquisar motivo..."
              value={busca}
              onChange={e=>setBusca(e.target.value)}
            />

            <div className="outros-lista">
              {detalhesFiltrados.length?detalhesFiltrados.map(r=>
                <div className="outros-item" key={r.motivo}>
                  <span>{r.motivo}</span>
                  <strong>{r.total}</strong>
                </div>
              ):<Empty text="Nenhum motivo encontrado."/>}
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn ghost" onClick={()=>setShowOutros(false)}>Fechar</button>
          </div>
        </div>
      </div>
    }
  </div>;
}

function FechamentoTable({rows}){
  return <div className="tablewrap">
    <table>
      <thead><tr><th>Usuário</th><th>Pós OK</th><th>Avançou fechamento</th><th>Contratos</th><th>Conversão</th></tr></thead>
      <tbody>{rows.map(r=><tr key={r.nome}><td>{r.nome}</td><td>{r.pos_ok}</td><td>{r.fechamento}</td><td>{r.contratos}</td><td>{r.conversao}</td></tr>)}</tbody>
    </table>
  </div>;
}

function FunnelReport({rows}){
  const max=Math.max(1,...rows.map(r=>Number(r.total||0)));
  return <div className="funnel-report">
    {rows.map(r=>
      <div className="funnel-row" key={r.etapa}>
        <span>{r.etapa}</span>
        <div className="funnel-bar">
          <i style={{width:`${Math.max(4,(Number(r.total||0)/max)*100)}%`}}/>
        </div>
        <strong>{r.total}</strong>
      </div>
    )}
  </div>;
}

function ActionTable({acoes,visitas,getUser,reportStart,reportEnd}){
  const rows=acoes.filter(a=>{
    const d=parseHorarioBrasilDate(a.horario_brasil)||actionDateBR(a.created_at);
    return d>=reportStart && d<=reportEnd;
  });

  return <div className="tablewrap">
    <table>
      <thead><tr><th>Horário da ação</th><th>Usuário</th><th>Perfil</th><th>Ação</th><th>Imóvel</th><th>Data da visita</th><th>Status</th><th>Valor</th><th>Obs.</th></tr></thead>
      <tbody>{rows.map(a=>{
        const v=visitas.find(x=>x.id===a.visita_id);
        const u=getUser(a.usuario_id);
        return <tr key={a.id}>
          <td>{actionTimeDisplay(a)}</td>
          <td>{u?.nome||"-"}</td>
          <td>{ROLES[u?.tipo]||u?.tipo||"-"}</td>
          <td>{a.tipo_acao}</td>
          <td>{v?.codigo_imovel||"-"}</td>
          <td>{v?.data_visita?String(v.data_visita).split("-").reverse().join("/"):"-"}</td>
          <td>{statusLabel(a.status_anterior)} → {statusLabel(a.status_novo)}</td>
          <td>{brMoney(a.valor_proposta)}</td>
          <td>{a.observacao}</td>
        </tr>;
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
        <Select label="Horário inicial *" value={String(f.horario_visita||"").slice(0,5)} disabled={limited} onChange={v=>setF({...f,horario_visita:v})} options={HORARIOS_VISITA.map(h=>[h,h])}/>
        <Select label="Horário final *" value={String(f.horario_fim_visita||"").slice(0,5)} disabled={limited} onChange={v=>setF({...f,horario_fim_visita:v})} options={HORARIOS_VISITA.map(h=>[h,h])}/>
        <Select label="Status *" value={f.status} disabled={limited} onChange={v=>setF({...f,status:v,motivo_cancelamento:["cancelada","reserva_cancelada"].includes(v)?f.motivo_cancelamento:"",
    motivo_cancelamento_outros:["cancelada","reserva_cancelada"].includes(v)?f.motivo_cancelamento_outros:""})} options={statusOptions}/>

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

        {["cancelada","reserva_cancelada"].includes(f.status)&&<>
          <Select
            label="Motivo do cancelamento *"
            value={f.motivo_cancelamento||""}
            disabled={limited}
            onChange={v=>setF({
              ...f,
              motivo_cancelamento:v,
              motivo_cancelamento_outros:String(v).toLowerCase()==="outros"?f.motivo_cancelamento_outros:""
            })}
            options={MOTIVOS_CANCELAMENTO.map(m=>[m,m])}
          />

          {String(f.motivo_cancelamento||"").toLowerCase()==="outros"&&
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
          {f.cliente_contato&&<p><a href={whatsappClienteLink(f)} target="_blank" rel="noreferrer" className="whatsapp-btn">WhatsApp Cliente</a></p>}
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
            <strong>{actionTimeDisplay(a)} — {getUser?.(a.usuario_id)?.nome||"Usuário"}</strong>
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
