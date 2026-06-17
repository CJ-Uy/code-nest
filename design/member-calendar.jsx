// ===== Calendar — month + agenda, type filters =====
const CAL_TYPE = {
  official:{ label:"Official", color:"var(--a-steel)", bg:"var(--info-bg)", text:"var(--info)" },
  casual:  { label:"Casual",   color:"var(--a-grey)", bg:"var(--surface-2)", text:"var(--text-2)" },
  birthday:{ label:"Birthday", color:"var(--warn)",   bg:"var(--warn-bg)", text:"var(--warn)" },
};
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function CalendarModule({device, onOpenEvent}){
  const [view,setView] = useState(device==='mobile'?'agenda':'month');
  const [filters,setFilters] = useState({official:true,casual:true,birthday:true});
  const [peek,setPeek] = useState(null);
  const evs = CAL_EVENTS.filter(e=>filters[e.type]);
  const toggle = (t)=> setFilters(f=>({...f,[t]:!f[t]}));

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <h2 style={{fontSize:'1.5rem'}}>{CAL_MONTH.label}</h2>
          <div style={{display:'flex',gap:4}}>
            <button className="btn btn-ghost btn-sm" style={{padding:'6px 9px'}} aria-label="Prev"><span style={{transform:'rotate(180deg)',display:'grid'}}><I.chev size={'1em'}/></span></button>
            <button className="btn btn-ghost btn-sm" style={{padding:'6px 9px'}} aria-label="Next"><I.chev size={'1em'}/></button>
          </div>
        </div>
        <div style={{display:'inline-flex',gap:3,background:'var(--surface-2)',borderRadius:10,padding:4}}>
          {[["month","Month"],["agenda","Agenda"]].map(([id,l])=>(
            <button key={id} onClick={()=>setView(id)} style={{padding:'7px 14px',borderRadius:8,fontWeight:600,fontSize:'.85rem',color:view===id?'#fff':'var(--text-2)',background:view===id?'var(--navy)':'transparent'}}>{l}</button>
          ))}
        </div>
      </div>

      {/* filters */}
      <div style={{display:'flex',gap:8,marginBottom:18,flexWrap:'wrap'}}>
        {Object.entries(CAL_TYPE).map(([k,v])=>{ const on=filters[k]; return (
          <button key={k} onClick={()=>toggle(k)} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'6px 12px',borderRadius:999,fontSize:'.84rem',fontWeight:600,color:on?'var(--text)':'var(--text-3)',background:on?'var(--surface)':'transparent',boxShadow:'inset 0 0 0 1px '+(on?'var(--line)':'var(--line-soft)'),opacity:on?1:.6,transition:'.14s'}}>
            <span style={{width:10,height:10,borderRadius:3,background:on?v.color:'var(--line)'}}></span>{v.label}
            {on && <I.check size={'.85em'} style={{color:v.color}}/>}
          </button>
        );})}
      </div>

      {view==='month' ? <MonthGrid evs={evs} device={device} onPeek={setPeek}/> : <AgendaView evs={evs} device={device} onPeek={setPeek}/>}

      {peek && <EventPeek e={peek} onClose={()=>setPeek(null)} onOpenEvent={onOpenEvent}/>}
    </div>
  );
}

function MonthGrid({evs, device, onPeek}){
  // March 2025 starts on Saturday (day 1 = Sat). firstDow:
  const first = new Date(CAL_MONTH.y, CAL_MONTH.m, 1).getDay();
  const days = new Date(CAL_MONTH.y, CAL_MONTH.m+1, 0).getDate();
  const cells = [];
  for(let i=0;i<first;i++) cells.push(null);
  for(let d=1;d<=days;d++) cells.push(d);
  const byDay = {};
  evs.forEach(e=>{ (byDay[e.day]=byDay[e.day]||[]).push(e); });
  return (
    <div className="card" style={{padding:device==='mobile'?'8px':'14px',overflow:'hidden'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:device==='mobile'?2:6}}>
        {DOW.map(d=><div key={d} style={{textAlign:'center',fontWeight:700,fontSize:device==='mobile'?'.66rem':'.74rem',color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.04em',padding:'4px 0 8px'}}>{device==='mobile'?d[0]:d}</div>)}
        {cells.map((d,i)=>{
          const list = d?byDay[d]||[]:[];
          const isToday = d===CAL_MONTH.today;
          return (
            <div key={i} style={{minHeight:device==='mobile'?56:96,borderRadius:10,padding:device==='mobile'?'3px':'6px',background:d?(isToday?'var(--info-bg)':'var(--surface-2)'):'transparent',border:isToday?'1.5px solid var(--accent)':'1px solid var(--line-soft)',opacity:d?1:0,display:'flex',flexDirection:'column',gap:2,overflow:'hidden'}}>
              {d && <div style={{fontSize:device==='mobile'?'.7rem':'.8rem',fontWeight:isToday?700:600,color:isToday?'var(--accent-strong)':'var(--text-2)',textAlign:device==='mobile'?'center':'left',padding:device==='mobile'?0:'0 2px'}}>{d}</div>}
              {device==='mobile' ? (
                list.length>0 && <div style={{display:'flex',gap:2,justifyContent:'center',flexWrap:'wrap',marginTop:'auto',marginBottom:3}}>
                  {list.slice(0,3).map(e=><span key={e.id} onClick={()=>onPeek(e)} style={{width:6,height:6,borderRadius:'50%',background:CAL_TYPE[e.type].color,cursor:'pointer'}}></span>)}
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:3,overflow:'hidden'}}>
                  {list.slice(0,3).map(e=>(
                    <button key={e.id} onClick={()=>onPeek(e)} style={{display:'flex',alignItems:'center',gap:5,padding:'2px 5px',borderRadius:5,background:CAL_TYPE[e.type].bg,textAlign:'left',width:'100%'}}>
                      <span style={{width:6,height:6,borderRadius:'50%',background:CAL_TYPE[e.type].color,flexShrink:0}}></span>
                      <span style={{fontSize:'.68rem',fontWeight:600,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.name}</span>
                    </button>
                  ))}
                  {list.length>3 && <span style={{fontSize:'.66rem',color:'var(--text-3)',paddingLeft:5}}>+{list.length-3} more</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgendaView({evs, device, onPeek}){
  const sorted = [...evs].sort((a,b)=>a.day-b.day);
  const groups = {};
  sorted.forEach(e=>{ (groups[e.day]=groups[e.day]||[]).push(e); });
  const upcoming = Object.keys(groups).map(Number).filter(d=>d>=CAL_MONTH.today);
  const earlier = Object.keys(groups).map(Number).filter(d=>d<CAL_MONTH.today);
  const Section = ({label, days})=> days.length===0?null:(
    <div style={{marginBottom:22}}>
      <div className="eyebrow" style={{marginBottom:12}}>{label}</div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {days.map(d=>(
          <div key={d} style={{display:'flex',gap:device==='mobile'?12:18}}>
            <div style={{textAlign:'center',flexShrink:0,width:48}}>
              <div style={{fontSize:'.66rem',color:'var(--text-3)',fontWeight:700,textTransform:'uppercase'}}>{DOW[new Date(CAL_MONTH.y,CAL_MONTH.m,d).getDay()]}</div>
              <div style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.6rem',color:d===CAL_MONTH.today?'var(--accent-strong)':'var(--text)',lineHeight:1.1}}>{d}</div>
            </div>
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
              {groups[d].map(e=>{ const t=CAL_TYPE[e.type]; return (
                <button key={e.id} onClick={()=>onPeek(e)} className="card" style={{padding:'12px 14px',display:'flex',alignItems:'center',gap:12,textAlign:'left',borderLeft:'3px solid '+t.color}}
                  onMouseEnter={ev=>ev.currentTarget.style.borderColor='var(--mid)'} onMouseLeave={ev=>ev.currentTarget.style.borderColor='var(--line)'}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,color:'var(--text)',fontSize:'.98rem'}}>{e.name}</div>
                    <div style={{display:'flex',alignItems:'center',gap:8,color:'var(--text-3)',fontSize:'.82rem',marginTop:3,flexWrap:'wrap'}}>
                      <span style={{display:'inline-flex',alignItems:'center',gap:4}}><I.clock size={'.9em'}/>{e.time}</span>
                      {e.place!=='\u2014' && <><span>·</span><span style={{display:'inline-flex',alignItems:'center',gap:4}}><I.mapPin size={'.9em'}/>{e.place}</span></>}
                    </div>
                  </div>
                  <Badge kind={e.type==='official'?'info':e.type==='birthday'?'warn':'neutral'} dot>{t.label}</Badge>
                  {e.pts>0 && <span style={{color:'var(--accent-strong)',fontWeight:700,fontSize:'.84rem'}}>+{e.pts}</span>}
                </button>
              );})}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div>
      <Section label="Upcoming" days={upcoming}/>
      <Section label="Earlier this month" days={earlier}/>
      {evs.length===0 && <div style={{textAlign:'center',padding:'40px',color:'var(--text-3)'}}>No events match those filters.</div>}
    </div>
  );
}

function EventPeek({e, onClose, onOpenEvent}){
  const t = CAL_TYPE[e.type];
  return (
    <div onClick={onClose} style={{position:'absolute',inset:0,zIndex:90,background:'rgba(6,25,47,.4)',display:'grid',placeItems:'center',padding:20,animation:'fadein .18s'}}>
      <div onClick={ev=>ev.stopPropagation()} className="card" style={{maxWidth:380,width:'100%',padding:0,overflow:'hidden',boxShadow:'var(--shadow-lg)'}}>
        <div style={{height:6,background:t.color}}></div>
        <div style={{padding:'20px 22px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
            <Badge kind={e.type==='official'?'info':e.type==='birthday'?'warn':'neutral'} dot>{t.label}</Badge>
            <button onClick={onClose} style={{color:'var(--text-3)',padding:4}}><I.x/></button>
          </div>
          <h3 style={{fontSize:'1.35rem',marginTop:12}}>{e.name}</h3>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:14,color:'var(--text-2)',fontSize:'.92rem'}}>
            <div style={{display:'flex',alignItems:'center',gap:9}}><I.calendar size={'1.05em'} style={{color:'var(--mid)'}}/> {CAL_MONTH.label.split(' ')[0]} {e.day}, {CAL_MONTH.y}</div>
            <div style={{display:'flex',alignItems:'center',gap:9}}><I.clock size={'1.05em'} style={{color:'var(--mid)'}}/> {e.time}</div>
            {e.place!=='\u2014' && <div style={{display:'flex',alignItems:'center',gap:9}}><I.mapPin size={'1.05em'} style={{color:'var(--mid)'}}/> {e.place}</div>}
            {e.pts>0 && <div style={{display:'flex',alignItems:'center',gap:9}}><I.trophy size={'1.05em'} style={{color:'var(--mid)'}}/> +{e.pts} retention points</div>}
          </div>
          {e.eventId ? (
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:18}} onClick={()=>{onClose(); onOpenEvent&&onOpenEvent(e.eventId);}}>Open event <I.arrow size={'1em'}/></button>
          ) : (
            <div style={{marginTop:18,padding:'10px 12px',background:'var(--surface-2)',borderRadius:10,color:'var(--text-3)',fontSize:'.84rem',textAlign:'center'}}>{e.type==='birthday'?'Greet them a happy birthday! \uD83C\uDF82':'A calendar-only event — no CRS attendance.'}</div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CAL_TYPE, CalendarModule, MonthGrid, AgendaView, EventPeek });
