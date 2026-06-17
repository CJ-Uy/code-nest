// ===== Admin — event approval + points assignment =====
function EventApproval({device}){
  const [pending,setPending] = useState(()=>PENDING_EVENTS.map(e=>({...e,points:e.type==='official'?15:e.type==='casual'?5:0})));
  const [done,setDone] = useState({}); // id -> 'approved' | 'rejected'

  const setPoints = (id,v)=> setPending(ps=>ps.map(e=>e.id===id?{...e,points:Math.max(0,parseInt(v||0,10))}:e));
  const decide = (id,verdict)=> setDone(d=>({...d,[id]:verdict}));

  const open = pending.filter(e=>!done[e.id]);
  return (
    <div style={{maxWidth:820}}>
      <div style={{marginBottom:18}}>
        <h2 style={{fontSize:'1.6rem'}}>Event approval & points</h2>
        <p style={{color:'var(--text-3)',fontSize:'.9rem',marginTop:2}}>Official events need a CRS admin\u2019s approval. Confirm the retention points before approving.</p>
      </div>

      {open.length===0 ? (
        <div style={{textAlign:'center',padding:'48px 24px',border:'1.5px dashed var(--line)',borderRadius:'var(--radius-lg)',background:'var(--surface-2)'}}>
          <div style={{width:60,height:60,borderRadius:16,background:'var(--ok-bg)',color:'var(--ok)',display:'grid',placeItems:'center',margin:'0 auto 16px',fontSize:'1.6rem'}}><I.check/></div>
          <h3 style={{fontSize:'1.3rem'}}>All caught up</h3>
          <p style={{color:'var(--text-2)',marginTop:8}}>No events are waiting for approval right now.</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {pending.map(e=>{
            const verdict = done[e.id];
            const t = TYPE_META[e.type];
            return (
              <div key={e.id} className="card" style={{padding:0,overflow:'hidden',opacity:verdict?.7:1,transition:'.2s'}}>
                <div style={{padding:device==='mobile'?'16px':'18px 20px'}}>
                  <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:8}}>
                    <Badge kind={e.type==='official'?'info':e.type==='casual'?'neutral':'warn'} dot>{t.label}</Badge>
                    {verdict==='approved' && <Badge kind="ok"><I.check size={'.85em'}/> Approved</Badge>}
                    {verdict==='rejected' && <Badge kind="danger">Rejected</Badge>}
                  </div>
                  <h3 style={{fontSize:'1.25rem'}}>{e.name}</h3>
                  <div style={{display:'flex',gap:14,flexWrap:'wrap',color:'var(--text-3)',fontSize:'.85rem',marginTop:8}}>
                    <span style={{display:'inline-flex',alignItems:'center',gap:5}}><I.calendar size={'.95em'}/>{e.date} · {e.time}</span>
                    <span style={{display:'inline-flex',alignItems:'center',gap:5}}><I.mapPin size={'.95em'}/>{e.place}</span>
                    <span style={{display:'inline-flex',alignItems:'center',gap:5}}><I.user size={'.95em'}/>{e.organizer}</span>
                  </div>
                  <p style={{color:'var(--text-2)',fontSize:'.9rem',marginTop:10}}>{e.note}</p>
                </div>
                {!verdict && (
                  <div style={{display:'flex',alignItems:'center',gap:14,padding:device==='mobile'?'14px 16px':'14px 20px',borderTop:'1px solid var(--line-soft)',background:'var(--surface-2)',flexWrap:'wrap'}}>
                    <label style={{display:'flex',alignItems:'center',gap:9}}>
                      <span style={{fontWeight:600,fontSize:'.85rem',color:'var(--text-2)'}}>Points</span>
                      <input className="inp" value={e.points} onChange={ev=>setPoints(e.id,ev.target.value)} style={{width:74,padding:'8px 10px',textAlign:'center'}}/>
                    </label>
                    {e.type!=='official' && <Badge kind="neutral">Auto-approves · points optional</Badge>}
                    <div style={{display:'flex',gap:8,marginLeft:'auto'}}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>decide(e.id,'rejected')}>Reject</button>
                      <button className="btn btn-primary btn-sm" onClick={()=>decide(e.id,'approved')}><I.check size={'1em'}/> Approve · +{e.points}</button>
                    </div>
                  </div>
                )}
                {verdict==='approved' && <div style={{padding:'11px 20px',borderTop:'1px solid var(--line-soft)',background:'var(--ok-bg)',color:'var(--ok)',fontSize:'.86rem',fontWeight:600,display:'flex',alignItems:'center',gap:8}}><I.check size={'1em'}/> Approved with +{e.points} points · attendees will earn these on check-in. <button onClick={()=>decide(e.id,null)} style={{marginLeft:'auto',color:'var(--text-2)',fontWeight:600,textDecoration:'underline'}}>Undo</button></div>}
                {verdict==='rejected' && <div style={{padding:'11px 20px',borderTop:'1px solid var(--line-soft)',background:'var(--danger-bg)',color:'var(--danger)',fontSize:'.86rem',fontWeight:600,display:'flex',alignItems:'center',gap:8}}>Rejected · the organizer will be notified. <button onClick={()=>decide(e.id,null)} style={{marginLeft:'auto',color:'var(--text-2)',fontWeight:600,textDecoration:'underline'}}>Undo</button></div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== Admin — audit log =====
function AuditLog({device}){
  const [cat,setCat] = useState("all");
  const list = AUDIT_LOG.filter(l=>cat==="all"||l.cat===cat);
  const actionColor = { granted:"ok", approved:"ok", published:"info", configured:"info", removed:"danger", deleted:"danger", rejected:"danger" };
  const catIcon = { role:"lock", event:"events", content:"megaphone", survey:"doc", link:"link" };
  return (
    <div style={{maxWidth:820}}>
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:'1.6rem'}}>Audit log</h2>
        <p style={{color:'var(--text-3)',fontSize:'.9rem',marginTop:2}}>Every admin action is recorded here — who did what, and when.</p>
      </div>
      <div className="thin-scroll" style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:6,marginBottom:18}}>
        {AUDIT_CATS.map(([id,l])=>(
          <button key={id} onClick={()=>setCat(id)} className="btn btn-sm" style={{flexShrink:0,...(cat===id?{background:'var(--navy)',color:'#fff'}:{background:'var(--surface)',color:'var(--text-2)',boxShadow:'inset 0 0 0 1px var(--line)'})}}>{l}</button>
        ))}
      </div>
      <div className="card" style={{overflow:'hidden'}}>
        {list.map((l,i)=>(
          <div key={l.id} style={{display:'flex',gap:13,padding:'14px 16px',borderTop:i?'1px solid var(--line-soft)':'none'}}>
            <div style={{width:38,height:38,borderRadius:10,background:'var(--surface-2)',color:'var(--accent-strong)',display:'grid',placeItems:'center',flexShrink:0}}>{React.createElement(I[catIcon[l.cat]]||I.doc,{size:'1.05em'})}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'.94rem',color:'var(--text)',lineHeight:1.45}}>
                <strong>{l.actor}</strong> <span style={{color:`var(--${actionColor[l.action]||'text-2'})`,fontWeight:600}}>{l.action}</span> <strong>{l.target}</strong>
              </div>
              <div style={{color:'var(--text-3)',fontSize:'.82rem',marginTop:2}}>{l.detail}</div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:5,color:'var(--text-3)',fontSize:'.76rem'}}>
                <Badge kind="neutral">{l.role}</Badge><span>·</span><span>{l.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { EventApproval, AuditLog });
