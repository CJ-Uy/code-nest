// ===== Events (CRS) — event detail: attendance, media, forum =====

// ---------- live check-in count hook ----------
function useLiveCheckins(open, base){
  const [count,setCount] = useState(base);
  const [feed,setFeed] = useState([]);
  useEffect(()=>{
    if(!open) return;
    let i=0;
    const id=setInterval(()=>{
      if(i>=LIVE_CHECKINS.length){ return; }
      const c=LIVE_CHECKINS[i++];
      setCount(n=>n+1);
      setFeed(f=>[{...c,id:Date.now()+Math.random()},...f].slice(0,5));
    }, 1800);
    return ()=>clearInterval(id);
  },[open]);
  return [count,feed,setCount];
}

// ---------- Attendance panel ----------
function AttendancePanel({e, role, device, onScan}){
  const [open,setOpen] = useState(e.windowOpen);
  const [secs,setSecs] = useState(15*60);
  const [count,feed] = useLiveCheckins(open && role==='organizer', e.count);
  useEffect(()=>{
    if(!open) return;
    const id=setInterval(()=>setSecs(s=>Math.max(0,s-1)),1000);
    return ()=>clearInterval(id);
  },[open]);
  useEffect(()=>{ if(secs===0 && open) setOpen(false); },[secs,open]);
  const mm=String(Math.floor(secs/60)).padStart(2,'0'), ss=String(secs%60).padStart(2,'0');

  if(role==='organizer'){
    return (
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <PanelHead icon={<I.scan/>} title="Attendance" right={<Badge kind={open?'ok':'neutral'} dot>{open?'Window open':'Window closed'}</Badge>}/>
        {open ? (
          <div style={{padding:'4px 18px 20px'}}>
            <div style={{display:'flex',gap:device==='mobile'?18:26,flexWrap:'wrap',alignItems:'center',justifyContent:'center',padding:'8px 0 6px'}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
                <FauxQR size={device==='mobile'?160:184} seed={e.id.length*7+3}/>
                <div style={{display:'flex',gap:8}}>
                  <button className="btn btn-ghost btn-sm"><I.ext size={'1em'}/> Add to slide</button>
                  <button className="btn btn-ghost btn-sm"><I.qr size={'1em'}/> Download</button>
                </div>
              </div>
              <div style={{flex:1,minWidth:200}}>
                <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                  <span style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'2.6rem',color:'var(--text)',lineHeight:1}}>{count}</span>
                  <span style={{color:'var(--text-3)'}}>checked in{e.cap>0?` / ${e.cap}`:''}</span>
                </div>
                <div style={{display:'inline-flex',alignItems:'center',gap:7,marginTop:10,padding:'6px 11px',borderRadius:999,background:'var(--warn-bg)',color:'var(--warn)',fontWeight:600,fontSize:'.84rem'}}>
                  <I.clock size={'1em'}/> Expires in {mm}:{ss}
                </div>
                <p style={{color:'var(--text-3)',fontSize:'.82rem',marginTop:10,lineHeight:1.5}}>This static QR is valid only while the window is open. It stops working the moment you close it or the event ends.</p>
                {/* live feed */}
                <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:8,minHeight:40}}>
                  {feed.map(f=>(
                    <div key={f.id} style={{display:'flex',alignItems:'center',gap:9,animation:'fadein .3s'}}>
                      <Avatar name={f.nick} size={26} tone="steel"/>
                      <span style={{fontWeight:600,fontSize:'.86rem',color:'var(--text)'}}>{f.nick}</span>
                      <span style={{color:'var(--text-3)',fontSize:'.78rem'}}>checked in · {f.time}</span>
                      <span style={{marginLeft:'auto',color:'var(--ok)'}}><I.check size={'1em'}/></span>
                    </div>
                  ))}
                  {feed.length===0 && <span style={{color:'var(--text-3)',fontSize:'.84rem'}}>Waiting for the first check-in…</span>}
                </div>
              </div>
            </div>
            <button className="btn btn-danger" style={{width:'100%',justifyContent:'center',marginTop:10}} onClick={()=>setOpen(false)}>Close check-in window</button>
          </div>
        ) : (
          <div style={{padding:'18px'}}>
            <div style={{display:'flex',gap:13,alignItems:'flex-start',padding:'14px 16px',background:'var(--surface-2)',borderRadius:12,marginBottom:14}}>
              <span style={{color:'var(--accent)',fontSize:'1.2rem',marginTop:1}}><I.qr/></span>
              <div><div style={{fontWeight:600,color:'var(--text)'}}>Open the window to take attendance</div><p style={{color:'var(--text-2)',fontSize:'.88rem',marginTop:3}}>Opening generates a static QR you can drop into a slide. It expires when you close the window (or at event end), so it can\u2019t be reused.</p></div>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
              <span style={{color:'var(--text-3)',fontSize:'.86rem'}}>{e.count>0?`${e.count} checked in last time`:'No check-ins yet'}</span>
              <button className="btn btn-primary" onClick={()=>{setSecs(15*60);setOpen(true);}}>Open check-in window</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // member view
  const checked = e.going==='checked-in';
  return (
    <div className="card" style={{padding:0,overflow:'hidden'}}>
      <PanelHead icon={<I.scan/>} title="Attendance" right={open?<Badge kind="ok" dot>Window open</Badge>:<Badge kind="neutral" dot>Closed</Badge>}/>
      <div style={{padding:'18px'}}>
        {checked ? (
          <div style={{display:'flex',gap:13,alignItems:'center',padding:'16px',background:'var(--ok-bg)',borderRadius:12}}>
            <div style={{width:44,height:44,borderRadius:'50%',background:'var(--ok)',color:'#fff',display:'grid',placeItems:'center',fontSize:'1.3rem',flexShrink:0}}><I.check/></div>
            <div><div style={{fontWeight:700,color:'var(--text)'}}>You\u2019re checked in</div><div style={{color:'var(--text-2)',fontSize:'.88rem'}}>+{e.pts} retention points earned</div></div>
          </div>
        ) : open ? (
          <div style={{textAlign:'center',padding:'6px 0'}}>
            <p style={{color:'var(--text-2)',marginBottom:14}}>The organizer has opened check-in. Scan the QR on screen to log your attendance.</p>
            <button className="btn btn-primary btn-lg" onClick={onScan}><I.scan/> Scan to check in</button>
          </div>
        ) : (
          <div style={{display:'flex',gap:13,alignItems:'center',padding:'14px 16px',background:'var(--surface-2)',borderRadius:12}}>
            <span style={{color:'var(--text-3)',fontSize:'1.2rem'}}><I.clock/></span>
            <div><div style={{fontWeight:600,color:'var(--text)'}}>Check-in isn\u2019t open</div><div style={{color:'var(--text-3)',fontSize:'.86rem'}}>The organizer opens the window during the event.</div></div>
          </div>
        )}
      </div>
    </div>
  );
}
function PanelHead({icon,title,right}){
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'15px 18px',borderBottom:'1px solid var(--line-soft)'}}>
      <span style={{color:'var(--accent)',fontSize:'1.1rem'}}>{icon}</span>
      <h3 style={{fontSize:'1.1rem',flex:1}}>{title}</h3>
      {right}
    </div>
  );
}

// ---------- Media gallery ----------
function MediaGallery({device}){
  return (
    <div className="card" style={{padding:0,overflow:'hidden'}}>
      <PanelHead icon={<I.grid/>} title="Media gallery" right={<span style={{color:'var(--text-3)',fontSize:'.82rem'}}>{EVENT_MEDIA.length} photos</span>}/>
      <div style={{padding:'16px 18px 18px'}}>
        <p style={{color:'var(--text-3)',fontSize:'.84rem',marginBottom:14}}>Attendee uploads — a remembrance archive and proof of attendance.</p>
        <div style={{display:'grid',gridTemplateColumns:device==='mobile'?'1fr 1fr':'repeat(4,1fr)',gap:10}}>
          {EVENT_MEDIA.map(m=>(
            <figure key={m.id} style={{margin:0}}>
              <Placeholder label={"Photo"} ratio="1/1" tone="pale"/>
              <figcaption style={{marginTop:6,fontSize:'.78rem',color:'var(--text-2)',lineHeight:1.35}}>{m.caption}<span style={{color:'var(--text-3)'}}> · {m.by}</span></figcaption>
            </figure>
          ))}
          <button style={{aspectRatio:'1/1',borderRadius:'var(--radius)',border:'1.5px dashed var(--line)',background:'var(--surface-2)',color:'var(--accent-strong)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,fontWeight:600,fontSize:'.82rem'}}>
            <I.plus/> Add photo
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Event forum (distinct from survey) ----------
function ForumPost({p, depth, onReply}){
  const [replying,setReplying] = useState(false);
  const [txt,setTxt] = useState("");
  const [anon,setAnon] = useState(false);
  return (
    <div style={{display:'flex',gap:11}}>
      {p.anon ? <div style={{width:34,height:34,borderRadius:12,background:'var(--a-mist)',color:'#fff',display:'grid',placeItems:'center',flexShrink:0}}><I.user size={'1em'}/></div>
              : <Avatar name={p.author} size={34} tone={p.nick===ME.nick?'navy':'steel'}/>}
      <div style={{flex:1,minWidth:0}}>
        <div style={{background:'var(--surface-2)',borderRadius:'4px 14px 14px 14px',padding:'11px 14px'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
            <span style={{fontWeight:700,fontSize:'.88rem',color:'var(--text)'}}>{p.anon?'Anonymous':p.author}</span>
            {p.anon && <Badge kind="neutral">Anon</Badge>}
            <span style={{color:'var(--text-3)',fontSize:'.76rem',marginLeft:'auto'}}>{p.time}</span>
          </div>
          <p style={{color:'var(--text)',fontSize:'.92rem',lineHeight:1.5}}>{p.body}</p>
        </div>
        {depth<1 && <button onClick={()=>setReplying(r=>!r)} style={{color:'var(--accent-strong)',fontWeight:600,fontSize:'.8rem',marginTop:6,marginLeft:4}}>Reply</button>}
        {replying && (
          <div style={{marginTop:9}}>
            <textarea className="inp" rows={2} value={txt} onChange={e=>setTxt(e.target.value)} placeholder="Write a reply…"></textarea>
            <div style={{display:'flex',gap:10,alignItems:'center',marginTop:8}}>
              <button className="btn btn-primary btn-sm" disabled={!txt.trim()} onClick={()=>{onReply(p.id,txt,anon);setTxt("");setReplying(false);setAnon(false);}}>Reply</button>
              <ForumAnon on={anon} onClick={()=>setAnon(a=>!a)}/>
            </div>
          </div>
        )}
        {p.replies?.length>0 && (
          <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:14,paddingLeft:12,borderLeft:'2px solid var(--line-soft)'}}>
            {p.replies.map(r=><ForumPost key={r.id} p={r} depth={depth+1} onReply={onReply}/>)}
          </div>
        )}
      </div>
    </div>
  );
}
function ForumAnon({on,onClick}){
  return (
    <button onClick={onClick} style={{display:'inline-flex',alignItems:'center',gap:7,fontSize:'.8rem',fontWeight:600,color:on?'var(--accent-strong)':'var(--text-3)'}}>
      <span style={{width:34,height:20,borderRadius:999,background:on?'var(--accent)':'var(--line)',position:'relative'}}><span style={{position:'absolute',top:2,left:on?16:2,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'.15s'}}></span></span>
      {on?'Anonymous':'As '+ME.nick}
    </button>
  );
}
function EventForum({device}){
  const [posts,setPosts] = useState(()=>FORUM.map(p=>({...p,replies:[...(p.replies||[])]})));
  const [txt,setTxt] = useState("");
  const [anon,setAnon] = useState(false);
  const total = posts.reduce((n,p)=>n+1+(p.replies?.length||0),0);
  const add = ()=>{ if(!txt.trim())return; setPosts(ps=>[{id:Date.now(),author:ME.name,nick:ME.nick,anon,time:"Just now",body:txt.trim(),replies:[]},...ps]); setTxt("");setAnon(false); };
  const reply = (pid,body,rAnon)=> setPosts(ps=>ps.map(p=>p.id===pid?{...p,replies:[...(p.replies||[]),{id:Date.now(),author:ME.name,nick:ME.nick,anon:rAnon,time:"Just now",body:body.trim()}]}:p));
  return (
    <div className="card" style={{padding:0,overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',gap:11,padding:'15px 18px',borderBottom:'1px solid var(--line-soft)',background:'var(--surface)'}}>
        <span style={{width:34,height:34,borderRadius:10,background:'var(--pale-tint)',color:'var(--accent-strong)',display:'grid',placeItems:'center'}}><ChatIcon/></span>
        <div style={{flex:1}}><h3 style={{fontSize:'1.1rem'}}>Forum</h3><div style={{color:'var(--text-3)',fontSize:'.78rem'}}>Open to all · threaded · permanent</div></div>
        <Badge kind="neutral">{total}</Badge>
      </div>
      <div style={{padding:'16px 18px 18px'}}>
        {/* composer */}
        <div style={{display:'flex',gap:11,marginBottom:20}}>
          <Avatar name={ME.name} size={34} tone="navy"/>
          <div style={{flex:1}}>
            <textarea className="inp" rows={2} value={txt} onChange={e=>setTxt(e.target.value)} placeholder="Share a thought, memory, or feedback…" style={{background:'var(--surface-2)'}}></textarea>
            <div style={{display:'flex',alignItems:'center',gap:12,marginTop:9,flexWrap:'wrap'}}>
              <button className="btn btn-primary btn-sm" disabled={!txt.trim()} onClick={add}>Post to forum</button>
              <ForumAnon on={anon} onClick={()=>setAnon(a=>!a)}/>
            </div>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          {posts.map(p=><ForumPost key={p.id} p={p} depth={0} onReply={reply}/>)}
        </div>
      </div>
    </div>
  );
}
function ChatIcon(){ return <svg viewBox="0 0 24 24" width="1.15em" height="1.15em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"/></svg>; }

// ---------- Survey entry (visibly distinct from forum) ----------
function SurveyEntry(){
  return (
    <div style={{borderRadius:'var(--radius)',border:'1.5px dashed var(--a-steel)',background:'color-mix(in srgb,var(--a-steel) 7%,transparent)',padding:'16px 18px',display:'flex',gap:14,alignItems:'center'}}>
      <span style={{width:42,height:42,borderRadius:12,background:'#fff',color:'var(--a-steel)',display:'grid',placeItems:'center',flexShrink:0,boxShadow:'var(--shadow-sm)'}}><ClipboardIcon/></span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}><h3 style={{fontSize:'1.05rem'}}>Post-event survey</h3><Badge kind="info">Structured</Badge></div>
        <p style={{color:'var(--text-2)',fontSize:'.86rem',marginTop:2}}>A separate, structured questionnaire — distinct from the open forum. Appears here when you\u2019re selected.</p>
      </div>
      <button className="btn btn-ghost btn-sm" disabled>Not assigned</button>
    </div>
  );
}
function ClipboardIcon(){ return <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 10h6M9 14h6M9 18h4"/></svg>; }

// ---------- Event detail ----------
function EventDetail({e, device, onBack, onScan, onSurvey, surveyDone}){
  const t = TYPE_META[e.type];
  const canOrganize = e.mine;
  const [role,setRole] = useState(canOrganize?'organizer':'member');
  return (
    <div style={{maxWidth:760}}>
      <button className="btn btn-sm btn-ghost" onClick={onBack} style={{marginBottom:18}}>← Events</button>

      {/* info header */}
      <div style={{position:'relative',borderRadius:'var(--radius-lg)',overflow:'hidden',background:'linear-gradient(135deg,var(--navy),var(--navy-deep))',color:'#fff',padding:device==='mobile'?'24px 22px':'30px 30px',marginBottom:18}}>
        <img src="assets/falcon-white-t.png" alt="" style={{position:'absolute',right:-16,bottom:-34,height:180,opacity:.07}}/>
        <div style={{position:'relative'}}>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
            <span className="badge" style={{background:'rgba(255,255,255,.12)',color:'#fff'}}><span style={{width:7,height:7,borderRadius:'50%',background:'var(--mid)'}}></span>{t.label}</span>
            {e.approval==='pending' ? <Badge kind="warn">Pending approval</Badge> : <span className="badge" style={{background:'rgba(46,125,99,.25)',color:'#fff'}}><I.check size={'.85em'}/> Approved</span>}
            {e.mine && <span className="badge" style={{background:'rgba(255,255,255,.12)',color:'var(--mid)'}}>You organize this</span>}
          </div>
          <h1 style={{color:'#fff',fontSize:device==='mobile'?'1.8rem':'2.4rem',lineHeight:1.12}}>{e.name}</h1>
          <div style={{display:'flex',gap:device==='mobile'?14:26,flexWrap:'wrap',marginTop:18}}>
            <HeaderFact icon={<I.calendar/>} label={e.date} sub={`${e.day} · ${e.time}${e.end?'–'+e.end:''}`}/>
            <HeaderFact icon={<I.mapPin/>} label={e.place} sub="Location"/>
            {e.pts>0 && <HeaderFact icon={<I.trophy/>} label={`+${e.pts} pts`} sub="Retention"/>}
          </div>
          <p style={{color:'#C6D4E6',marginTop:18,maxWidth:560,lineHeight:1.6}}>{e.desc}</p>
          {role==='member' && e.state==='upcoming' && (
            <div style={{display:'flex',gap:10,marginTop:20,flexWrap:'wrap'}}>
              <button className="btn" style={{background:'#fff',color:'var(--navy)'}}>{e.going==='going'?'✓ Going':'RSVP — I\u2019m going'}</button>
              <button className="btn btn-on-chrome">Add to calendar</button>
            </div>
          )}
        </div>
      </div>

      {/* demo role switch */}
      {canOrganize && (
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,padding:'10px 14px',background:'var(--surface-2)',borderRadius:11,border:'1px solid var(--line)'}}>
          <span style={{fontSize:'.82rem',color:'var(--text-3)',fontWeight:600}}>Preview as</span>
          <div style={{display:'inline-flex',gap:3,background:'var(--surface)',borderRadius:9,padding:3,boxShadow:'inset 0 0 0 1px var(--line)'}}>
            {[['organizer','Organizer'],['member','Member']].map(([id,l])=>(
              <button key={id} onClick={()=>setRole(id)} style={{padding:'5px 12px',borderRadius:7,fontSize:'.82rem',fontWeight:600,color:role===id?'#fff':'var(--text-2)',background:role===id?'var(--navy)':'transparent'}}>{l}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <AttendancePanel e={e} role={role} device={device} onScan={onScan}/>
        <MediaGallery device={device}/>
        <EventForum device={device}/>
        {e.surveyAssigned ? <SurveySelected onOpen={onSurvey} done={surveyDone}/> : <SurveyEntry/>}
      </div>
    </div>
  );
}
function HeaderFact({icon,label,sub}){
  return (
    <div style={{display:'flex',gap:9,alignItems:'center'}}>
      <span style={{color:'var(--mid)',fontSize:'1.1rem'}}>{icon}</span>
      <div style={{lineHeight:1.2}}><div style={{fontWeight:700,color:'#fff',fontSize:'.98rem'}}>{label}</div><div style={{color:'var(--chrome-dim)',fontSize:'.76rem'}}>{sub}</div></div>
    </div>
  );
}

Object.assign(window, { AttendancePanel, MediaGallery, EventForum, SurveyEntry, EventDetail, useLiveCheckins });
