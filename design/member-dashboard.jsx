// ===== Member portal — Dashboard =====
function SecHead({title, action, onAction}){
  return (
    <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:12,marginBottom:12}}>
      <h2 style={{fontSize:'1.18rem'}}>{title}</h2>
      {action && <button onClick={onAction} style={{color:'var(--accent-strong)',fontWeight:600,fontSize:'.86rem',display:'inline-flex',alignItems:'center',gap:4}}>{action} <I.chev size={'.85em'}/></button>}
    </div>
  );
}

// ---- Retention status widget ----
function RetentionWidget({onNav}){
  const r = RETENTION;
  const pct = Math.round(r.points/r.target*100);
  return (
    <div style={{background:'linear-gradient(135deg,var(--navy) 0%,var(--navy-deep) 100%)',color:'#fff',borderRadius:'var(--radius)',padding:'20px 22px',position:'relative',overflow:'hidden'}}>
      <img src="assets/falcon-white-t.png" alt="" aria-hidden="true" style={{position:'absolute',right:-14,bottom:-30,height:170,opacity:.06}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,position:'relative'}}>
        <div>
          <div className="eyebrow" style={{color:'var(--mid)'}}>Your retention</div>
          <div style={{display:'flex',alignItems:'center',gap:9,marginTop:8}}>
            <span style={{width:9,height:9,borderRadius:'50%',background:'var(--ok)',boxShadow:'0 0 0 3px rgba(46,125,99,.25)'}}></span>
            <span style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.5rem'}}>{r.status}</span>
          </div>
          <div style={{color:'var(--mid)',fontSize:'.9rem',marginTop:2}}>{r.tier}</div>
        </div>
        <div style={{display:'flex',gap:18,textAlign:'right',flexShrink:0}}>
          <div><div style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.3rem',lineHeight:1}}>#{r.rank}</div><div style={{color:'var(--chrome-dim)',fontSize:'.72rem',marginTop:3}}>Rank</div></div>
          <div><div style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.3rem',lineHeight:1,display:'flex',alignItems:'center',gap:3,justifyContent:'flex-end'}}><I.flame size={'.9em'} color="var(--mid)"/>{r.streak}</div><div style={{color:'var(--chrome-dim)',fontSize:'.72rem',marginTop:3}}>Streak</div></div>
        </div>
      </div>
      {/* progress */}
      <div style={{marginTop:18,position:'relative'}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:'.8rem',color:'var(--chrome-dim)',marginBottom:6}}>
          <span><strong style={{color:'#fff',fontSize:'.92rem'}}>{r.points}</strong> / {r.target} pts</span>
          <span>{r.target-r.points} to next tier</span>
        </div>
        <div style={{height:8,borderRadius:999,background:'rgba(255,255,255,.14)',overflow:'hidden'}}>
          <div style={{width:pct+'%',height:'100%',borderRadius:999,background:'linear-gradient(90deg,var(--a-steel),var(--mid))'}}></div>
        </div>
      </div>
      <div style={{display:'flex',gap:8,marginTop:16,position:'relative'}}>
        <button className="btn btn-sm" style={{background:'#fff',color:'var(--navy)'}} onClick={()=>onNav&&onNav('events')}>View my points</button>
        <button className="btn btn-sm btn-on-chrome" onClick={()=>onNav&&onNav('events')}>Leaderboard</button>
      </div>
    </div>
  );
}

// ---- Announcements digest ----
function AnnouncementsDigest({onNav, compact}){
  return (
    <div>
      <SecHead title="Announcements" action="See all" onAction={()=>onNav&&onNav('announcements')}/>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {ANNOUNCEMENTS.slice(0,compact?2:3).map(a=>(
          <div key={a.id} className="card" style={{padding:'15px 16px',display:'flex',gap:13}}>
            <div style={{width:40,height:40,borderRadius:11,background:'var(--pale-tint)',color:'var(--accent-strong)',display:'grid',placeItems:'center',flexShrink:0,fontSize:'1.15rem'}}><I.megaphone/></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                <Badge kind="neutral">{a.tag}</Badge>
                {a.pinned && <span style={{color:'var(--accent)',fontSize:'.7rem',fontWeight:600,display:'inline-flex',alignItems:'center',gap:3}}><I.pin size={'.85em'}/>Pinned</span>}
                <span style={{color:'var(--text-3)',fontSize:'.76rem',marginLeft:'auto'}}>{a.time}</span>
              </div>
              <div style={{fontWeight:700,color:'var(--text)',fontSize:'1rem'}}>{a.title}</div>
              <p style={{color:'var(--text-2)',fontSize:'.9rem',marginTop:3,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{a.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Upcoming events strip ----
function EventsStrip({onNav}){
  const typeColor = { official:'var(--a-steel)', casual:'var(--a-grey)' };
  return (
    <div>
      <SecHead title="Upcoming events" action="All events" onAction={()=>onNav&&onNav('events')}/>
      <div className="thin-scroll" style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:6,margin:'0 -2px',scrollSnapType:'x mandatory'}}>
        {EVENTS.map(e=>(
          <div key={e.id} className="card" style={{padding:'14px 15px',minWidth:212,width:212,flexShrink:0,scrollSnapAlign:'start',display:'flex',flexDirection:'column',gap:10}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div style={{width:46,height:50,borderRadius:10,background:'var(--navy)',color:'#fff',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',lineHeight:1}}>
                <span style={{fontSize:'.62rem',color:'var(--mid)',fontWeight:700,letterSpacing:'.04em'}}>{e.day}</span>
                <span style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.05rem',marginTop:2}}>{e.date.split(' ')[1]}</span>
                <span style={{fontSize:'.56rem',color:'var(--chrome-dim)'}}>{e.date.split(' ')[0]}</span>
              </div>
              <Badge kind={e.type==='official'?'info':'neutral'} dot>{e.type==='official'?'Official':'Casual'}</Badge>
            </div>
            <div>
              <div style={{fontWeight:700,color:'var(--text)',fontSize:'.98rem',lineHeight:1.2}}>{e.name}</div>
              <div style={{display:'flex',alignItems:'center',gap:6,color:'var(--text-3)',fontSize:'.8rem',marginTop:5}}><I.clock size={'.95em'}/>{e.time} · {e.place}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'auto'}}>
              <span style={{fontSize:'.78rem',color:'var(--accent-strong)',fontWeight:700}}>+{e.pts} pts</span>
              <span className={"badge "+(e.going?'badge-ok':'badge-neutral')}>{e.going?<><I.check size={'.9em'}/> Going</>:'RSVP'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Recent library activity ----
function LibraryActivity({onNav}){
  return (
    <div>
      <SecHead title="Recent library activity" action="Open Library" onAction={()=>onNav&&onNav('library')}/>
      <div className="card" style={{overflow:'hidden'}}>
        {LIBRARY_ACTIVITY.map((a,i)=>(
          <div key={a.id} style={{display:'flex',gap:13,alignItems:'center',padding:'13px 16px',borderTop:i?'1px solid var(--line-soft)':'none'}}>
            <div style={{width:38,height:38,borderRadius:10,background:'var(--surface-2)',color:'var(--accent)',display:'grid',placeItems:'center',flexShrink:0}}>{React.createElement(I[a.icon]||I.book)}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <span style={{fontWeight:600,color:'var(--text)',fontSize:'.95rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.title}</span>
                {a.isNew && <Badge kind="ok">New</Badge>}
              </div>
              <div style={{color:'var(--text-3)',fontSize:'.83rem'}}>{a.action}</div>
            </div>
            <span style={{color:'var(--text-3)',fontSize:'.76rem',flexShrink:0}}>{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- compact notifications (dashboard panel) ----
function DashNotifications({onSeeAll, onSurvey}){
  const top = NOTIFS.slice(0,4);
  return (
    <div>
      <SecHead title="Notifications" action="See all" onAction={onSeeAll}/>
      <div className="card" style={{overflow:'hidden'}}>
        {top.map((n,i)=>(
          <div key={n.id} onClick={()=> n.survey && onSurvey && onSurvey()} style={{display:'flex',gap:12,padding:'12px 16px',borderTop:i?'1px solid var(--line-soft)':'none',background:n.unread?'var(--info-bg)':'transparent',alignItems:'flex-start',cursor:n.survey?'pointer':'default'}}>
            <div style={{width:34,height:34,borderRadius:9,background:'var(--surface)',color:'var(--accent-strong)',display:'grid',placeItems:'center',flexShrink:0,boxShadow:'inset 0 0 0 1px var(--line)'}}>{React.createElement(I[n.kind]||I.bell)}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:'.9rem',color:'var(--text)'}}>{n.title}</div>
              <div style={{color:'var(--text-2)',fontSize:'.83rem'}}>{n.body}</div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                <span style={{color:'var(--text-3)',fontSize:'.74rem'}}>{n.time}</span>
                {n.survey && <span style={{color:'var(--accent-strong)',fontSize:'.74rem',fontWeight:700,display:'inline-flex',alignItems:'center',gap:3}}>Start survey <I.chev size={'.85em'}/></span>}
              </div>
            </div>
            {n.unread && <span style={{width:7,height:7,borderRadius:'50%',background:'var(--accent)',flexShrink:0,marginTop:6}}></span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Dashboard composition ----
function Dashboard({device, onNav, onBell, onSurvey}){
  if(device==='mobile'){
    return (
      <div style={{display:'flex',flexDirection:'column',gap:24}}>
        <RetentionWidget onNav={onNav}/>
        <AnnouncementsDigest onNav={onNav} compact/>
        <EventsStrip onNav={onNav}/>
        <LibraryActivity onNav={onNav}/>
        <DashNotifications onSeeAll={onBell} onSurvey={onSurvey}/>
      </div>
    );
  }
  return (
    <div style={{display:'flex',flexDirection:'column',gap:26}}>
      <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:26,alignItems:'start'}}>
        <RetentionWidget onNav={onNav}/>
        <div className="card" style={{padding:'18px 20px'}}>
          <div className="eyebrow" style={{marginBottom:10}}>Quick actions</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[['scan','Scan attendance','events'],['plus','Create link','links'],['book','Browse library','library'],['calendar','Open calendar','calendar']].map(([ic,lbl,nv])=>(
              <button key={lbl} onClick={()=>onNav&&onNav(nv)} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 13px',borderRadius:11,background:'var(--surface-2)',border:'1px solid var(--line)',color:'var(--text)',fontWeight:600,fontSize:'.86rem',textAlign:'left',transition:'.14s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--mid)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--line)'}>
                <span style={{color:'var(--accent)',fontSize:'1.15rem',display:'grid',placeItems:'center'}}>{React.createElement(I[ic])}</span>{lbl}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:26,alignItems:'start'}}>
        <div style={{display:'flex',flexDirection:'column',gap:26}}>
          <AnnouncementsDigest onNav={onNav}/>
          <EventsStrip onNav={onNav}/>
          <LibraryActivity onNav={onNav}/>
        </div>
        <DashNotifications onSeeAll={onBell} onSurvey={onSurvey}/>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, RetentionWidget, AnnouncementsDigest, EventsStrip, LibraryActivity, DashNotifications, SecHead });
