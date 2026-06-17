// ===== Events (CRS) — list, create, points, leaderboard =====
const TYPE_META = {
  official: { label:"Official", badge:"info",    dot:"var(--a-steel)" },
  casual:   { label:"Casual",   badge:"neutral", dot:"var(--a-grey)" },
  birthday: { label:"Birthday", badge:"warn",    dot:"var(--warn)" },
};

// ---------- Faux QR with Falcon center (brand-compliant placeholder) ----------
function FauxQR({size=180, seed=11, light=false, variant, download}){
  // variant: "light" (navy on white) | "dark" (white on navy) | "transparent" (navy on transparent)
  const v = variant || (light?"dark":"light");
  const N=25;
  let s=(seed%2147483646)+1;
  const rnd=()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; };
  const fins=[[0,0],[0,N-7],[N-7,0]];
  const m=Math.floor(N/2);
  const on=[];
  for(let r=0;r<N;r++){ on[r]=[]; for(let c=0;c<N;c++){
    if(r>=m-3&&r<=m+3&&c>=m-3&&c<=m+3){ on[r][c]=null; continue; } // falcon hole
    let done=false, val=false;
    for(const [R,C] of fins){
      if(r>=R-1&&r<R+8&&c>=C-1&&c<C+8){
        if(r>=R&&r<R+7&&c>=C&&c<C+7){ const ri=r-R,ci=c-C; val=(ri===0||ri===6||ci===0||ci===6)||(ri>=2&&ri<=4&&ci>=2&&ci<=4); }
        else val=false; done=true; break;
      }
    }
    on[r][c]= done? val : rnd()>0.52;
  }}
  const isDark = v==="dark";
  const fg = isDark ? "#FFFFFF" : "#06192F";
  const bg = v==="light" ? "#FFFFFF" : v==="dark" ? "var(--navy)" : "transparent";
  const checker = v==="transparent" ? "conic-gradient(#e6ebf2 0 25%, #fff 0 50%, #e6ebf2 0 75%, #fff 0) 0 0/14px 14px" : "none";
  const center = isDark ? "var(--navy)" : "#FFFFFF";
  return (
    <div style={{position:'relative',width:size,height:size,borderRadius:14,padding:size*0.05,boxShadow:v==="transparent"?'none':'var(--shadow-sm)',background:v==="transparent"?checker:bg,overflow:'hidden'}}>
      <svg viewBox={`0 0 ${N} ${N}`} width="100%" height="100%" shapeRendering="crispEdges" style={{display:'block',position:'relative'}}>
        {on.map((row,r)=>row.map((vv,c)=> vv? <rect key={r+'-'+c} x={c} y={r} width="1" height="1" fill={fg}/> : null))}
      </svg>
      <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:size*0.26,height:size*0.26,background:center,borderRadius:8,display:'grid',placeItems:'center',boxShadow:'0 0 0 3px '+center}}>
        <Falcon variant={isDark?"white":"navy"} size={size*0.2}/>
      </div>
    </div>
  );
}

// ---------- Event card ----------
function EventCard({e, onOpen, device}){
  const t = TYPE_META[e.type];
  const full = e.cap>0 ? Math.round(e.count/e.cap*100) : 0;
  return (
    <button onClick={()=>onOpen(e)} className="card" style={{padding:0,overflow:'hidden',textAlign:'left',display:'flex',flexDirection:'column',transition:'.16s',cursor:'pointer'}}
      onMouseEnter={ev=>{ev.currentTarget.style.boxShadow='var(--shadow-md)';ev.currentTarget.style.borderColor='var(--mid)';}}
      onMouseLeave={ev=>{ev.currentTarget.style.boxShadow='var(--shadow-sm)';ev.currentTarget.style.borderColor='var(--line)';}}>
      <div style={{display:'flex',gap:14,padding:'16px 16px',alignItems:'flex-start'}}>
        <div style={{width:52,height:58,borderRadius:12,background:'var(--navy)',color:'#fff',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0,lineHeight:1}}>
          <span style={{fontSize:'.62rem',color:'var(--mid)',fontWeight:700}}>{e.day}</span>
          <span style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.25rem',marginTop:2}}>{e.date.split(' ')[1].replace(',','')}</span>
          <span style={{fontSize:'.54rem',color:'var(--chrome-dim)'}}>{e.date.split(' ')[0]}</span>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:5,flexWrap:'wrap'}}>
            <Badge kind={t.badge} dot>{t.label}</Badge>
            {e.mine && <Badge kind="neutral">Organizer</Badge>}
            {e.approval==='pending' && <Badge kind="warn">Pending approval</Badge>}
          </div>
          <div style={{fontWeight:700,color:'var(--text)',fontSize:'1.05rem',lineHeight:1.2}}>{e.name}</div>
          <div style={{display:'flex',alignItems:'center',gap:7,color:'var(--text-3)',fontSize:'.84rem',marginTop:5,flexWrap:'wrap'}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:4}}><I.clock size={'.95em'}/>{e.time}</span>
            <span>·</span><span style={{display:'inline-flex',alignItems:'center',gap:4}}><I.mapPin size={'.95em'}/>{e.place}</span>
          </div>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',borderTop:'1px solid var(--line-soft)',background:'var(--surface-2)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,fontSize:'.82rem',color:'var(--text-2)'}}>
          {e.going==='checked-in' ? <Badge kind="ok" dot>Checked in</Badge>
            : e.going==='going' ? <Badge kind="info" dot>Going</Badge>
            : <span style={{color:'var(--text-3)'}}>Not RSVP\u2019d</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12,fontSize:'.82rem'}}>
          {e.cap>0 && <span style={{color:'var(--text-3)',display:'inline-flex',alignItems:'center',gap:4}}><I.user size={'.95em'}/>{e.count}/{e.cap}</span>}
          {e.pts>0 && <span style={{color:'var(--accent-strong)',fontWeight:700}}>+{e.pts} pts</span>}
        </div>
      </div>
    </button>
  );
}

// ---------- Events list with tabs ----------
function EventsList({device, onOpen}){
  const [tab,setTab] = useState("upcoming");
  const tabs=[["upcoming","Upcoming"],["past","Past"],["mine","Mine"]];
  let list = EVENTS_FULL.filter(e=> tab==="mine" ? e.mine : e.state===tab);
  return (
    <div>
      <div style={{display:'inline-flex',gap:3,background:'var(--surface-2)',borderRadius:12,padding:4,marginBottom:18}}>
        {tabs.map(([id,l])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:'8px 16px',borderRadius:9,fontWeight:600,fontSize:'.9rem',color:tab===id?'#fff':'var(--text-2)',background:tab===id?'var(--navy)':'transparent',transition:'.15s'}}>{l}</button>
        ))}
      </div>
      {list.length===0 ? (
        <EventsEmpty tab={tab}/>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:device==='mobile'?'1fr':'1fr 1fr',gap:14}}>
          {list.map(e=><EventCard key={e.id} e={e} onOpen={onOpen} device={device}/>)}
        </div>
      )}
    </div>
  );
}
function EventsEmpty({tab}){
  const msg = tab==="mine" ? ["You haven\u2019t organized any events yet","Create one and it\u2019ll show up here with its attendance and points."]
    : tab==="past" ? ["No past events yet","Once events wrap up, they\u2019ll be archived here with media and the forum."]
    : ["No upcoming events","When officers schedule events, they\u2019ll appear here. Check back soon!"];
  return (
    <div style={{textAlign:'center',padding:'48px 24px',border:'1.5px dashed var(--line)',borderRadius:'var(--radius-lg)',background:'var(--surface-2)'}}>
      <div style={{width:60,height:60,borderRadius:16,background:'var(--pale-tint)',color:'var(--accent-strong)',display:'grid',placeItems:'center',margin:'0 auto 16px',fontSize:'1.6rem'}}><I.events/></div>
      <h3 style={{fontSize:'1.3rem'}}>{msg[0]}</h3>
      <p style={{color:'var(--text-2)',marginTop:8,maxWidth:360,marginInline:'auto'}}>{msg[1]}</p>
    </div>
  );
}

// ---------- Create event ----------
function CreateEvent({device, onCancel, onDone}){
  const [type,setType] = useState("official");
  const [advanced,setAdvanced] = useState(false);
  const [rotating,setRotating] = useState(false);
  return (
    <div style={{maxWidth:640}}>
      <button className="btn btn-sm btn-ghost" onClick={onCancel} style={{marginBottom:18}}>← Cancel</button>
      <h2 style={{fontSize:'1.7rem'}}>Create event</h2>
      <p style={{color:'var(--text-2)',marginTop:6,marginBottom:24}}>Set the details, then open a check-in window during the event to take attendance.</p>

      <div style={{display:'flex',flexDirection:'column',gap:18}}>
        <Field label="Event name"><input className="inp" placeholder="e.g. 3rd General Assembly"/></Field>
        <Field label="Type">
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {Object.entries(TYPE_META).map(([k,v])=>(
              <button key={k} onClick={()=>setType(k)} className="badge" style={{padding:'.6em 1em',fontSize:'.85rem',cursor:'pointer',background:type===k?'var(--navy)':'var(--surface-2)',color:type===k?'#fff':'var(--text-2)',boxShadow:type===k?'none':'inset 0 0 0 1px var(--line)'}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:type===k?'var(--mid)':v.dot}}></span>{v.label}
              </button>
            ))}
          </div>
        </Field>
        <div style={{display:'grid',gridTemplateColumns:device==='mobile'?'1fr':'1fr 1fr',gap:14}}>
          <Field label="Date"><input className="inp" type="date"/></Field>
          <Field label="Location"><input className="inp" placeholder="MVP 216 / Online"/></Field>
          <Field label="Start time"><input className="inp" type="time"/></Field>
          <Field label="End time"><input className="inp" type="time"/></Field>
        </div>
        {type!=="birthday" && <Field label="Retention points"><input className="inp" defaultValue="15" style={{maxWidth:120}}/></Field>}
        <Field label="Description"><textarea className="inp" rows={3} placeholder="What\u2019s this event about?"></textarea></Field>

        {/* attendance setting */}
        <div className="card" style={{padding:'18px 18px',background:'var(--surface-2)'}}>
          <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:6}}>
            <span style={{color:'var(--accent)',fontSize:'1.1rem'}}><I.qr/></span>
            <h3 style={{fontSize:'1.05rem'}}>Attendance check-in</h3>
          </div>
          <p style={{color:'var(--text-2)',fontSize:'.9rem'}}>During the event you\u2019ll <strong>open a check-in window</strong>. That generates a static QR you can drop straight into a slide. The QR <strong>expires when the window closes</strong> (or at event end), so it can\u2019t be reused afterward.</p>
          <div style={{display:'flex',gap:10,alignItems:'center',marginTop:14,padding:'12px 0 0',borderTop:'1px solid var(--line)'}}>
            <Toggle on={advanced} onClick={()=>setAdvanced(a=>!a)}/>
            <div><div style={{fontWeight:600,fontSize:'.92rem'}}>Advanced QR options</div><div style={{color:'var(--text-3)',fontSize:'.82rem'}}>For high-stakes events</div></div>
          </div>
          {advanced && (
            <div style={{marginTop:14,padding:'12px 14px',background:'var(--surface)',borderRadius:10,border:'1px solid var(--line)'}}>
              <label style={{display:'flex',gap:10,alignItems:'flex-start',cursor:'pointer'}}>
                <input type="radio" checked={!rotating} onChange={()=>setRotating(false)} style={{marginTop:3}}/>
                <div><div style={{fontWeight:600,fontSize:'.9rem'}}>Static QR with expiry <Badge kind="ok">Recommended</Badge></div><div style={{color:'var(--text-3)',fontSize:'.82rem'}}>One code for the whole window. Simplest for slides.</div></div>
              </label>
              <label style={{display:'flex',gap:10,alignItems:'flex-start',cursor:'pointer',marginTop:12}}>
                <input type="radio" checked={rotating} onChange={()=>setRotating(true)} style={{marginTop:3}}/>
                <div><div style={{fontWeight:600,fontSize:'.9rem'}}>Rotating / refreshing QR</div><div style={{color:'var(--text-3)',fontSize:'.82rem'}}>Code refreshes every 30s to prevent screenshot sharing. Needs the live QR on screen.</div></div>
              </label>
            </div>
          )}
        </div>
      </div>

      <div style={{display:'flex',gap:10,marginTop:24}}>
        <button className="btn btn-primary" onClick={onDone}>Create event</button>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <span style={{marginLeft:'auto',alignSelf:'center',color:'var(--text-3)',fontSize:'.82rem'}}>{type==='official'?'Needs moderator approval':'Auto-approved'}</span>
      </div>
    </div>
  );
}
function Field({label, children}){
  return <label style={{display:'block'}}><span style={{display:'block',fontWeight:600,fontSize:'.85rem',color:'var(--text-2)',marginBottom:7}}>{label}</span>{children}</label>;
}
function Toggle({on, onClick, disabled}){
  return <button onClick={disabled?undefined:onClick} aria-disabled={disabled} style={{width:44,height:26,borderRadius:999,background:on?'var(--accent)':'var(--line)',position:'relative',flexShrink:0,transition:'.16s',cursor:disabled?'not-allowed':'pointer',opacity:disabled?.55:1}}><span style={{position:'absolute',top:3,left:on?21:3,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'.16s',boxShadow:'0 1px 3px rgba(0,0,0,.2)'}}></span></button>;
}

// ---------- My points / retention ----------
function MyPoints({device}){
  const r = RETENTION_FULL;
  const pct = Math.min(100,Math.round(r.points/r.threshold*100));
  const statusMeta = { "Retained":["ok","You\u2019re retained for this term."], "At-Risk":["warn","A little short of the threshold \u2014 a couple more events will get you there."], "On Probation":["danger","Below the probation line. Let\u2019s get you back on track \u2014 reach out to the CRS team anytime."] }[r.status];
  return (
    <div style={{maxWidth:760}}>
      <h2 style={{fontSize:'1.6rem',marginBottom:4}}>My points & retention</h2>
      <p style={{color:'var(--text-3)',marginBottom:20}}>{r.term} · retention is measured per term against the points threshold.</p>

      <div style={{background:'linear-gradient(135deg,var(--navy),var(--navy-deep))',color:'#fff',borderRadius:'var(--radius)',padding:'22px 22px',position:'relative',overflow:'hidden'}}>
        <img src="assets/falcon-white-t.png" alt="" aria-hidden="true" style={{position:'absolute',right:-14,bottom:-30,height:170,opacity:.06}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:14,position:'relative',flexWrap:'wrap'}}>
          <div>
            <div className="eyebrow" style={{color:'var(--mid)'}}>Status this term</div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginTop:8}}>
              <span style={{width:11,height:11,borderRadius:'50%',background:`var(--${statusMeta[0]==='ok'?'ok':statusMeta[0]==='warn'?'warn':'danger'})`,boxShadow:`0 0 0 4px color-mix(in srgb, var(--${statusMeta[0]==='ok'?'ok':statusMeta[0]==='warn'?'warn':'danger'}) 30%, transparent)`}}></span>
              <span style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.7rem'}}>{r.status}</span>
            </div>
            <div style={{color:'var(--mid)',fontSize:'.92rem',marginTop:3}}>{r.tier}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'2.1rem',lineHeight:1}}>{r.points}<span style={{fontSize:'1rem',color:'var(--chrome-dim)'}}> / {r.threshold}</span></div>
            <div style={{color:'var(--chrome-dim)',fontSize:'.8rem',marginTop:3}}>points · threshold</div>
          </div>
        </div>
        <div style={{marginTop:16,position:'relative'}}>
          <div style={{height:9,borderRadius:999,background:'rgba(255,255,255,.14)',overflow:'hidden'}}>
            <div style={{width:pct+'%',height:'100%',borderRadius:999,background:`linear-gradient(90deg,var(--a-steel),var(--mid))`}}></div>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:7,fontSize:'.78rem',color:'var(--chrome-dim)'}}>
            <span>Probation line · {r.probationBelow}</span><span>Retained · {r.threshold}</span>
          </div>
        </div>
      </div>

      {/* at-risk nudge */}
      <div style={{display:'flex',gap:13,alignItems:'flex-start',marginTop:16,padding:'15px 17px',borderRadius:'var(--radius)',background:'var(--warn-bg)',border:'1px solid color-mix(in srgb,var(--warn) 25%,transparent)'}}>
        <span style={{color:'var(--warn)',fontSize:'1.2rem',marginTop:1}}><I.flame/></span>
        <div>
          <div style={{fontWeight:700,color:'var(--text)'}}>{r.threshold-r.points} points to retained</div>
          <p style={{color:'var(--text-2)',fontSize:'.9rem',marginTop:3}}>{statusMeta[1]} The 2nd General Assembly alone is worth +15.</p>
        </div>
      </div>

      {/* history */}
      <h3 style={{fontSize:'1.2rem',marginTop:26,marginBottom:12}}>Points history</h3>
      <div className="card" style={{overflow:'hidden'}}>
        {r.history.map((h,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:13,padding:'13px 16px',borderTop:i?'1px solid var(--line-soft)':'none'}}>
            <div style={{width:34,height:34,borderRadius:9,background:'var(--surface-2)',color:'var(--accent)',display:'grid',placeItems:'center',flexShrink:0}}><I.check size={'1.05em'}/></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,color:'var(--text)',fontSize:'.95rem'}}>{h.event}</div>
              <div style={{color:'var(--text-3)',fontSize:'.82rem'}}>{h.date} · {TYPE_META[h.type].label}</div>
            </div>
            <span style={{color:'var(--accent-strong)',fontWeight:700}}>+{h.pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Leaderboard ----------
function Leaderboard({device}){
  const [scope,setScope] = useState("term");
  const list = LEADERBOARD[scope];
  const you = list.find(x=>x.you);
  const top = list.slice(0,3);
  const rest = list.slice(3);
  const medal = ["#C9A227","#9AA7B4","#B08D57"];
  return (
    <div style={{maxWidth:680}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:18}}>
        <div><h2 style={{fontSize:'1.6rem'}}>Retention leaderboard</h2><p style={{color:'var(--text-3)',fontSize:'.9rem',marginTop:2}}>Points earned through CRS events. Keep it up!</p></div>
        <div style={{display:'inline-flex',gap:3,background:'var(--surface-2)',borderRadius:10,padding:4}}>
          {[["term","This term"],["all","All-time"]].map(([id,l])=>(
            <button key={id} onClick={()=>setScope(id)} style={{padding:'7px 14px',borderRadius:8,fontWeight:600,fontSize:'.85rem',color:scope===id?'#fff':'var(--text-2)',background:scope===id?'var(--navy)':'transparent'}}>{l}</button>
          ))}
        </div>
      </div>

      {/* podium */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:18}}>
        {[top[1],top[0],top[2]].map((p,idx)=>{ const realRank=p.rank; const h=[96,120,82][idx]; return (
          <div key={p.nick} style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end'}}>
            <Avatar name={p.nick} size={idx===1?56:46} tone={idx===1?'navy':'steel'}/>
            <div style={{fontWeight:700,marginTop:8,color:'var(--text)'}}>{p.nick}</div>
            <div style={{color:'var(--accent-strong)',fontWeight:700,fontSize:'.9rem'}}>{p.pts} pts</div>
            <div style={{width:'100%',height:h,marginTop:8,borderRadius:'10px 10px 0 0',background:idx===1?'linear-gradient(180deg,var(--navy),var(--navy-deep))':'var(--pale-tint)',display:'grid',placeItems:'center'}}>
              <span style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.6rem',color:idx===1?'#fff':'var(--a-slate)'}}>{realRank}</span>
            </div>
          </div>
        );})}
      </div>

      {/* the rest */}
      <div className="card" style={{overflow:'hidden'}}>
        {rest.map((p,i)=>(
          <div key={p.nick} style={{display:'flex',alignItems:'center',gap:13,padding:'11px 16px',borderTop:i?'1px solid var(--line-soft)':'none',background:p.you?'var(--info-bg)':'transparent'}}>
            <span style={{width:24,textAlign:'center',fontWeight:700,color:'var(--text-3)',fontSize:'.92rem'}}>{p.rank}</span>
            <Avatar name={p.nick} size={32} tone={p.you?'navy':'steel'}/>
            <span style={{flex:1,fontWeight:600,color:'var(--text)'}}>{p.nick}{p.you && <Badge kind="info" >You</Badge>}</span>
            <span style={{color:'var(--accent-strong)',fontWeight:700}}>{p.pts} pts</span>
          </div>
        ))}
      </div>
      {you && you.rank>3 && (
        <div style={{marginTop:12,padding:'4px 0',textAlign:'center',color:'var(--text-3)',fontSize:'.85rem'}}>You\u2019re <strong style={{color:'var(--accent-strong)'}}>#{you.rank}</strong> of {list.length} — {(list[you.rank-2]?.pts - you.pts)||0} pts behind #{you.rank-1}. You\u2019ve got this.</div>
      )}
    </div>
  );
}

Object.assign(window, { TYPE_META, FauxQR, EventCard, EventsList, EventsEmpty, CreateEvent, Field, Toggle, MyPoints, Leaderboard });
