// ===== Events (CRS) — module router =====
function EventsModule({device, initialView, initialEvent, initialEventId}){
  const resolved = initialEvent || (initialEventId ? EVENTS_FULL.find(x=>x.id===initialEventId) : null);
  const [view,setView] = useState(resolved?"detail":(initialView||"list"));   // list | create | detail | scan | survey | points | leaderboard
  const [sel,setSel] = useState(resolved||null);
  const [surveyDone,setSurveyDone] = useState(false);
  const openEvent = (e)=>{ setSel(e); setView("detail"); const s=document.querySelector('.ev-scroll'); if(s) s.scrollTop=0; };

  // scan is a full-screen overlay
  if(view==="scan"){
    return <ScanScreen event={sel} onClose={()=>setView(sel?'detail':'list')} onDone={()=>setView(sel?'detail':'list')}/>;
  }
  if(view==="survey"){
    const ev = sel || EVENTS_FULL.find(x=>x.surveyAssigned);
    return <SurveyForm event={ev} device={device} onClose={()=>setView(sel?'detail':'list')} onDone={()=>{ setSurveyDone(true); setView(sel?'detail':'list'); }}/>;
  }

  return (
    <div className="ev-scroll">
      {view!=="detail" && view!=="create" && (
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18,flexWrap:'wrap'}}>
          <div style={{display:'inline-flex',gap:3,background:'var(--surface-2)',borderRadius:11,padding:4}}>
            <EvTab on={view==='list'} onClick={()=>setView('list')} icon={<I.events size={'1em'}/>}>Events</EvTab>
            <EvTab on={view==='points'} onClick={()=>setView('points')} icon={<I.trophy size={'1em'}/>}>My points</EvTab>
            <EvTab on={view==='leaderboard'} onClick={()=>setView('leaderboard')} icon={<I.flame size={'1em'}/>}>Leaderboard</EvTab>
          </div>
          {view==='list' && <button className="btn btn-primary btn-sm" style={{marginLeft:'auto'}} onClick={()=>setView('create')}><I.plus size={'1em'}/> Create event</button>}
        </div>
      )}

      {view==='list' && <EventsList device={device} onOpen={openEvent}/>}
      {view==='create' && <CreateEvent device={device} onCancel={()=>setView('list')} onDone={()=>setView('list')}/>}
      {view==='detail' && <EventDetail e={sel} device={device} onBack={()=>setView('list')} onScan={()=>setView('scan')} onSurvey={()=>setView('survey')} surveyDone={surveyDone}/>}
      {view==='points' && <MyPoints device={device}/>}
      {view==='leaderboard' && <Leaderboard device={device}/>}
    </div>
  );
}
function EvTab({on,onClick,icon,children}){
  return <button onClick={onClick} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'8px 14px',borderRadius:8,fontWeight:600,fontSize:'.88rem',color:on?'#fff':'var(--text-2)',background:on?'var(--navy)':'transparent',transition:'.14s'}}>{icon}{children}</button>;
}
Object.assign(window, { EventsModule, EvTab });
