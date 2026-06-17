// ===== Admin — dashboard + module router =====
const ADMIN_NAV = [
  { id:"overview", label:"Overview", icon:"grid" },
  { id:"roles", label:"Roles", icon:"lock" },
  { id:"approval", label:"Event approval", icon:"events" },
  { id:"survey", label:"Surveys", icon:"doc" },
  { id:"audit", label:"Audit log", icon:"clock" },
];

function AdminDashboard({device, onGo}){
  const toneColor = { warn:["var(--warn-bg)","var(--warn)"], info:["var(--info-bg)","var(--info)"] };
  return (
    <div style={{maxWidth:900}}>
      <div style={{marginBottom:18}}>
        <h2 style={{fontSize:'1.6rem'}}>Admin overview</h2>
        <p style={{color:'var(--text-3)',fontSize:'.9rem',marginTop:2}}>Kumusta, {ADMIN_ME.nick}. Here\u2019s what needs attention.</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:device==='mobile'?'1fr 1fr':'repeat(4,1fr)',gap:12,marginBottom:24}}>
        {ADMIN_METRICS.map(m=>{ const [bg,fg]=toneColor[m.tone]; return (
          <div key={m.k} className="card" style={{padding:'16px 16px'}}>
            <div style={{width:36,height:36,borderRadius:10,background:bg,color:fg,display:'grid',placeItems:'center',marginBottom:10}}>{React.createElement(I[m.icon],{size:'1.1em'})}</div>
            <div style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.9rem',color:'var(--text)',lineHeight:1}}>{m.value}</div>
            <div style={{color:'var(--text-3)',fontSize:'.8rem',marginTop:4}}>{m.label}</div>
          </div>
        );})}
      </div>

      <div style={{display:'grid',gridTemplateColumns:device==='mobile'?'1fr':'1.3fr 1fr',gap:18,alignItems:'start'}}>
        {/* needs attention */}
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',gap:9,padding:'15px 18px',borderBottom:'1px solid var(--line-soft)'}}>
            <span style={{color:'var(--warn)'}}><I.events/></span><h3 style={{fontSize:'1.05rem',flex:1}}>Awaiting your approval</h3><Badge kind="warn">{PENDING_EVENTS.length}</Badge>
          </div>
          {PENDING_EVENTS.slice(0,3).map((e,i)=>(
            <div key={e.id} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 18px',borderTop:i?'1px solid var(--line-soft)':'none'}}>
              <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,color:'var(--text)',fontSize:'.94rem'}}>{e.name}</div><div style={{color:'var(--text-3)',fontSize:'.8rem'}}>{e.date} · {e.organizer}</div></div>
              <Badge kind={e.type==='official'?'info':'neutral'}>{TYPE_META[e.type].label}</Badge>
            </div>
          ))}
          <button onClick={()=>onGo('approval')} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,width:'100%',padding:'13px',borderTop:'1px solid var(--line-soft)',color:'var(--accent-strong)',fontWeight:600,fontSize:'.9rem',background:'var(--surface-2)'}}>Review all <I.arrow size={'1em'}/></button>
        </div>

        {/* recent audit */}
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',gap:9,padding:'15px 18px',borderBottom:'1px solid var(--line-soft)'}}>
            <span style={{color:'var(--accent)'}}><I.clock/></span><h3 style={{fontSize:'1.05rem',flex:1}}>Recent activity</h3>
          </div>
          {AUDIT_LOG.slice(0,4).map((l,i)=>(
            <div key={l.id} style={{padding:'11px 18px',borderTop:i?'1px solid var(--line-soft)':'none'}}>
              <div style={{fontSize:'.88rem',color:'var(--text)',lineHeight:1.4}}><strong>{l.actor}</strong> {l.action} <strong>{l.target}</strong></div>
              <div style={{color:'var(--text-3)',fontSize:'.76rem',marginTop:2}}>{l.time}</div>
            </div>
          ))}
          <button onClick={()=>onGo('audit')} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,width:'100%',padding:'13px',borderTop:'1px solid var(--line-soft)',color:'var(--accent-strong)',fontWeight:600,fontSize:'.9rem',background:'var(--surface-2)'}}>Full audit log <I.arrow size={'1em'}/></button>
        </div>
      </div>
    </div>
  );
}

function AdminModule({device}){
  const [view,setView] = useState("overview");
  const body = view==='overview' ? <AdminDashboard device={device} onGo={setView}/>
    : view==='roles' ? <RoleManagement device={device}/>
    : view==='approval' ? <EventApproval device={device}/>
    : view==='survey' ? <SurveyConfig device={device}/>
    : <AuditLog device={device}/>;
  return (
    <div>
      <div className="thin-scroll" style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:8,marginBottom:18,borderBottom:'1px solid var(--line)'}}>
        {ADMIN_NAV.map(n=>(
          <button key={n.id} onClick={()=>setView(n.id)} data-tour={n.id==='roles'?'admin-roles':undefined}
            style={{display:'inline-flex',alignItems:'center',gap:7,padding:'9px 14px',borderRadius:'9px 9px 0 0',fontWeight:600,fontSize:'.9rem',whiteSpace:'nowrap',color:view===n.id?'var(--accent-strong)':'var(--text-3)',borderBottom:'2px solid '+(view===n.id?'var(--accent)':'transparent'),marginBottom:-9}}>
            {React.createElement(I[n.icon],{size:'1em'})}{n.label}
          </button>
        ))}
      </div>
      {body}
    </div>
  );
}

Object.assign(window, { ADMIN_NAV, AdminDashboard, AdminModule });
