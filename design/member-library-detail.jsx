// ===== Content Library — item detail, comments, lists =====

// ---------- Locked / confidential state ----------
function LockedDetail({item, onBack, onRequest}){
  return (
    <div style={{maxWidth:640}}>
      <button className="btn btn-sm btn-ghost" onClick={onBack} style={{marginBottom:20}}>← Library</button>
      <div className="card" style={{padding:'40px 30px',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{width:70,height:70,borderRadius:20,background:'var(--danger-bg)',color:'var(--danger)',display:'grid',placeItems:'center',margin:'0 auto 20px',fontSize:'1.9rem'}}><I.lock/></div>
        <div style={{marginBottom:12}}><Badge kind="danger"><I.lock size={'.85em'}/> Confidential</Badge></div>
        <h2 style={{fontSize:'1.6rem'}}>{item.title}</h2>
        <p style={{color:'var(--text-2)',marginTop:12,maxWidth:420,marginInline:'auto'}}>This engagement record contains identifying client details and is restricted to the <strong style={{color:'var(--text)'}}>assigned consultancy team</strong> and <strong style={{color:'var(--text)'}}>content admins</strong>.</p>
        <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:24,flexWrap:'wrap'}}>
          <button className="btn btn-primary" onClick={onRequest}>Request access</button>
          <button className="btn btn-ghost" onClick={onBack}>Back to library</button>
        </div>
        <div style={{marginTop:22,paddingTop:18,borderTop:'1px solid var(--line-soft)',display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap',color:'var(--text-3)',fontSize:'.84rem'}}>
          <span style={{display:'inline-flex',alignItems:'center',gap:6}}><I.user size={'1em'}/> {item.author}</span>
          <span style={{display:'inline-flex',alignItems:'center',gap:6}}><I.clock size={'1em'}/> {item.read}</span>
          <span style={{display:'inline-flex',alignItems:'center',gap:6}}>{item.cat}</span>
        </div>
      </div>
      {/* related still visible */}
      {item.related?.length>0 && <RelatedRow ids={item.related} onOpen={()=>{}} note="Related (non-confidential) items"/>}
    </div>
  );
}

// ---------- Related items ----------
function RelatedRow({ids, onOpen, note}){
  const items = ids.map(libItem).filter(Boolean).filter(x=>x.conf!=='confidential');
  if(items.length===0) return null;
  return (
    <div style={{marginTop:30}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
        <span style={{color:'var(--accent)'}}><GraphIcon/></span>
        <h3 style={{fontSize:'1.2rem'}}>{note||"Related case studies"}</h3>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
        {items.map(it=>(
          <button key={it.id} onClick={()=>onOpen(it.id)} className="card" style={{padding:'14px 15px',textAlign:'left',cursor:'pointer',display:'flex',flexDirection:'column',gap:7}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--mid)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--line)'}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontWeight:700,fontSize:'.72rem',letterSpacing:'.06em',textTransform:'uppercase',color:'var(--accent)'}}>{KIND_META[it.kind].label}</span><ConfPill conf={it.conf}/></div>
            <div style={{fontWeight:700,color:'var(--text)',fontSize:'1rem',lineHeight:1.2}}>{it.title}</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{it.topics?.slice(0,2).map(t=><span key={t} style={{fontSize:'.72rem',fontWeight:600,color:'var(--accent-strong)',background:'var(--surface-2)',padding:'2px 7px',borderRadius:999}}>{t}</span>)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Comments ----------
function Comment({c, depth, onReply, onEdit, onDelete, onModerate}){
  const [menu,setMenu] = useState(false);
  const [editing,setEditing] = useState(false);
  const [draft,setDraft] = useState(c.body);
  const [replying,setReplying] = useState(false);
  const [reply,setReply] = useState("");
  const [anon,setAnon] = useState(false);
  const roleBadge = c.role==='Content Admin';
  return (
    <div style={{display:'flex',gap:11}}>
      {c.anon ? <div style={{width:36,height:36,borderRadius:'50%',background:'var(--a-mist)',color:'#fff',display:'grid',placeItems:'center',flexShrink:0,fontSize:'1rem'}}><I.user size={'1.05em'}/></div>
              : <Avatar name={c.author} size={36} tone={c.own?'navy':'steel'}/>}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          <span style={{fontWeight:700,color:'var(--text)',fontSize:'.92rem'}}>{c.anon?'Anonymous':c.author}</span>
          {!c.anon && roleBadge && <Badge kind="info">Content Admin</Badge>}
          {c.own && <Badge kind="neutral">You</Badge>}
          <span style={{color:'var(--text-3)',fontSize:'.78rem'}}>{c.time}{c.edited?' · edited':''}</span>
          <div style={{marginLeft:'auto',position:'relative'}}>
            {(c.own || VIEWER_IS_CONTENT_ADMIN) && <button onClick={()=>setMenu(m=>!m)} style={{color:'var(--text-3)',padding:4}}><I.more size={'1.1em'}/></button>}
            {menu && <>
              <div onClick={()=>setMenu(false)} style={{position:'fixed',inset:0,zIndex:40}}></div>
              <div className="card" style={{position:'absolute',top:'100%',right:0,width:170,zIndex:50,padding:6,boxShadow:'var(--shadow-lg)'}}>
                {c.own && <MenuItem icon={<I.doc size={'1em'}/>} onClick={()=>{setEditing(true);setMenu(false);}}>Edit</MenuItem>}
                {c.own && <MenuItem icon={<I.x size={'1em'}/>} danger onClick={()=>{onDelete(c.id);setMenu(false);}}>Delete</MenuItem>}
                {!c.own && VIEWER_IS_CONTENT_ADMIN && <>
                  <div style={{padding:'4px 10px',fontSize:'.68rem',fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.05em'}}>Moderation</div>
                  <MenuItem icon={<I.lock size={'1em'}/>} onClick={()=>{onModerate(c.id,'hide');setMenu(false);}}>Hide comment</MenuItem>
                  <MenuItem icon={<I.x size={'1em'}/>} danger onClick={()=>{onModerate(c.id,'remove');setMenu(false);}}>Remove</MenuItem>
                </>}
              </div>
            </>}
          </div>
        </div>
        {c.hidden ? (
          <div style={{color:'var(--text-3)',fontStyle:'italic',fontSize:'.9rem',marginTop:4,padding:'8px 12px',background:'var(--surface-2)',borderRadius:9}}>This comment was hidden by a moderator. <button onClick={()=>onModerate(c.id,'unhide')} style={{color:'var(--accent-strong)',fontWeight:600}}>Undo</button></div>
        ) : editing ? (
          <div style={{marginTop:6}}>
            <textarea className="inp" rows={2} value={draft} onChange={e=>setDraft(e.target.value)}></textarea>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn btn-primary btn-sm" onClick={()=>{onEdit(c.id,draft);setEditing(false);}}>Save</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>{setDraft(c.body);setEditing(false);}}>Cancel</button>
            </div>
          </div>
        ) : (
          <p style={{color:'var(--text)',fontSize:'.94rem',marginTop:4,lineHeight:1.55}}>{c.body}</p>
        )}

        {!c.hidden && !editing && depth<1 && (
          <button onClick={()=>setReplying(r=>!r)} style={{color:'var(--accent-strong)',fontWeight:600,fontSize:'.82rem',marginTop:7,display:'inline-flex',alignItems:'center',gap:5}}>Reply</button>
        )}
        {replying && (
          <div style={{marginTop:10,marginBottom:4}}>
            <textarea className="inp" rows={2} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Write a reply…"></textarea>
            <div style={{display:'flex',gap:10,alignItems:'center',marginTop:8}}>
              <button className="btn btn-primary btn-sm" disabled={!reply.trim()} onClick={()=>{onReply(c.id,reply,anon);setReply("");setReplying(false);setAnon(false);}}>Reply</button>
              <AnonToggle on={anon} onClick={()=>setAnon(a=>!a)}/>
              <button className="btn btn-ghost btn-sm" onClick={()=>setReplying(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* replies */}
        {c.replies?.length>0 && (
          <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:16,paddingLeft:14,borderLeft:'2px solid var(--line-soft)'}}>
            {c.replies.map(r=><Comment key={r.id} c={r} depth={depth+1} onReply={onReply} onEdit={onEdit} onDelete={onDelete} onModerate={onModerate}/>)}
          </div>
        )}
      </div>
    </div>
  );
}
function MenuItem({icon,children,onClick,danger}){
  return <button onClick={onClick} style={{display:'flex',alignItems:'center',gap:9,width:'100%',padding:'8px 10px',borderRadius:8,fontSize:'.88rem',fontWeight:500,color:danger?'var(--danger)':'var(--text)'}}
    onMouseEnter={e=>e.currentTarget.style.background='var(--surface-2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>{icon}{children}</button>;
}
function AnonToggle({on,onClick}){
  return (
    <button onClick={onClick} style={{display:'inline-flex',alignItems:'center',gap:7,fontSize:'.82rem',fontWeight:600,color:on?'var(--accent-strong)':'var(--text-3)'}}>
      <span style={{width:34,height:20,borderRadius:999,background:on?'var(--accent)':'var(--line)',position:'relative',transition:'.15s'}}><span style={{position:'absolute',top:2,left:on?16:2,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'.15s'}}></span></span>
      {on?'Posting anonymously':'Post as '+ME.nick}
    </button>
  );
}

function CommentsSection({itemId}){
  const [comments,setComments] = useState(()=> (LIB_COMMENTS[itemId]||[]).map(c=>({...c,replies:[...(c.replies||[])]})) );
  const [draft,setDraft] = useState("");
  const [anon,setAnon] = useState(false);
  const total = comments.reduce((n,c)=>n+1+(c.replies?.length||0),0);

  const addTop = ()=>{
    if(!draft.trim()) return;
    setComments(cs=>[{ id:Date.now(), author:ME.name, nick:ME.nick, role:"Consultant", time:"Just now", own:true, anon, body:draft.trim(), replies:[] }, ...cs]);
    setDraft(""); setAnon(false);
  };
  const addReply = (pid,body,rAnon)=> setComments(cs=>cs.map(c=> c.id===pid ? {...c, replies:[...(c.replies||[]), { id:Date.now(), author:ME.name, nick:ME.nick, role:"Consultant", time:"Just now", own:true, anon:rAnon, body:body.trim() }]} : c));
  const edit = (id,body)=> setComments(cs=>mapDeep(cs, id, c=>({...c, body, edited:true})));
  const del  = (id)=> setComments(cs=> cs.filter(c=>c.id!==id).map(c=>({...c, replies:(c.replies||[]).filter(r=>r.id!==id)})) );
  const moderate = (id,action)=> setComments(cs=>mapDeep(cs, id, c=> action==='hide'?{...c,hidden:true}: action==='unhide'?{...c,hidden:false}: c, action==='remove'?id:null));

  return (
    <section style={{marginTop:'clamp(36px,5vw,52px)'}}>
      <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:6}}>
        <h2 style={{fontSize:'1.4rem'}}>Member discussion</h2>
        <Badge kind="neutral">{total}</Badge>
      </div>
      <p style={{color:'var(--text-3)',fontSize:'.88rem',marginBottom:18}}>Visible to CODE members. Be kind and keep client details confidential.</p>

      {/* composer */}
      <div className="card" style={{padding:'14px 15px',marginBottom:24}}>
        <div style={{display:'flex',gap:11}}>
          <Avatar name={ME.name} size={36} tone="navy"/>
          <div style={{flex:1}}>
            <textarea className="inp" rows={2} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Add to the discussion…" style={{background:'var(--surface-2)'}}></textarea>
            <div style={{display:'flex',alignItems:'center',gap:12,marginTop:10,flexWrap:'wrap'}}>
              <button className="btn btn-primary btn-sm" disabled={!draft.trim()} onClick={addTop}>Post comment</button>
              <AnonToggle on={anon} onClick={()=>setAnon(a=>!a)}/>
            </div>
          </div>
        </div>
      </div>

      {comments.length===0 ? (
        <div style={{textAlign:'center',padding:'30px',color:'var(--text-3)'}}>No comments yet — start the discussion.</div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:22}}>
          {comments.map(c=><Comment key={c.id} c={c} depth={0} onReply={addReply} onEdit={edit} onDelete={del} onModerate={moderate}/>)}
        </div>
      )}
    </section>
  );
}
function mapDeep(cs, id, fn, removeId){
  return cs.map(c=>{
    let nc = c.id===id ? fn(c) : c;
    if(nc.replies?.length){ nc = {...nc, replies: nc.replies.map(r=> r.id===id?fn(r):r).filter(r=> removeId? r.id!==removeId : true)}; }
    return nc;
  }).filter(c=> removeId? c.id!==removeId : true);
}

// ---------- Item detail (article anatomy) ----------
function LibDetail({itemId, device, onBack, onOpen, favorites, onFav, lists, onToggleList}){
  const item = libItem(itemId);
  useEffect(()=>{ const el=document.getElementById('lib-scroll-top'); if(el) el.scrollIntoView===undefined; },[itemId]);
  if(!item) return null;
  if(item.locked) return <LockedDetail item={item} onBack={onBack} onRequest={()=>alert('Access request sent to the content admins.')}/>;
  const fav = favorites.includes(item.id);
  return (
    <div style={{maxWidth:760}} id="lib-scroll-top">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:18,flexWrap:'wrap'}}>
        <button className="btn btn-sm btn-ghost" onClick={onBack}>← Library</button>
        <SaveControl item={item} fav={fav} onFav={()=>onFav(item.id)} lists={lists} onToggleList={(lid)=>onToggleList(lid,item.id)} compact={device==='mobile'}/>
      </div>

      {/* header */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        <ConfPill conf={item.conf}/>
        {item.kind==='case' && <Badge kind="neutral"><I.doc size={'.85em'}/> Case study</Badge>}
        {item.client && <span style={{color:'var(--text-3)',fontSize:'.84rem'}}>· {item.client}</span>}
      </div>
      <h1 style={{fontSize:device==='mobile'?'1.9rem':'2.6rem',lineHeight:1.12}}>{item.title}</h1>
      <p style={{color:'var(--text-2)',fontSize:'1.12rem',marginTop:14,lineHeight:1.5}}>{item.dek}</p>
      <div style={{display:'flex',alignItems:'center',gap:12,marginTop:18,paddingBottom:22,borderBottom:'1px solid var(--line)',color:'var(--text-2)',fontSize:'.9rem'}}>
        <Avatar name={item.author} size={34}/>
        <div><strong style={{color:'var(--text)'}}>{item.author}</strong><div style={{color:'var(--text-3)'}}>{item.date} · {item.read} read</div></div>
        <div style={{marginLeft:'auto',display:'flex',gap:6,flexWrap:'wrap'}}>{item.topics?.map(t=><span key={t} style={{fontSize:'.74rem',fontWeight:600,color:'var(--accent-strong)',background:'var(--surface-2)',padding:'4px 9px',borderRadius:999}}>{t}</span>)}</div>
      </div>

      {/* abstract lead */}
      <p style={{fontFamily:'var(--serif)',fontSize:device==='mobile'?'1.25rem':'1.5rem',lineHeight:1.5,color:'var(--text)',borderLeft:'3px solid var(--accent)',paddingLeft:20,marginTop:28}}>{item.abstract}</p>

      {/* framework sections */}
      {item.sections?.map((s,i)=>(
        <section key={i} style={{marginTop:'clamp(34px,4vw,48px)'}}>
          <h2 style={{fontSize:device==='mobile'?'1.4rem':'1.85rem'}}>{s.h}</h2>
          <p style={{marginTop:12,fontSize:'1.06rem',color:'var(--text-2)',lineHeight:1.7}}>{s.body}</p>
          <figure style={{margin:'22px 0 0'}}>
            <Placeholder label={s.figure} ratio="16/9"/>
            <figcaption style={{marginTop:9,color:'var(--text-3)',fontSize:'.84rem',fontStyle:'italic',fontFamily:'var(--serif)'}}>{s.figure}</figcaption>
          </figure>
        </section>
      ))}

      {/* component breakdown */}
      {item.components && (
        <section style={{marginTop:'clamp(38px,5vw,52px)'}}>
          <h2 style={{fontSize:device==='mobile'?'1.4rem':'1.85rem'}}>{item.components.title}</h2>
          <div style={{display:'grid',gap:13,marginTop:20}}>
            {item.components.items.map((it,i)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'16px 18px',background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--radius)',padding:'20px 22px'}}>
                <div style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.3rem',color:'var(--mid)',minWidth:32}}>{String(i+1).padStart(2,'0')}</div>
                <div>
                  <h3 style={{fontSize:'1.18rem'}}>{it.name}</h3>
                  <p style={{marginTop:5,color:'var(--text-2)'}}>{it.def}</p>
                  <p style={{marginTop:9,color:'var(--text-3)',fontSize:'.9rem'}}><strong style={{color:'var(--accent-strong)',fontWeight:600}}>Example · </strong><span className="serif-i">{it.ex}</span></p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* guide questions */}
      {item.questions?.length>0 && (
        <section style={{marginTop:'clamp(38px,5vw,52px)',background:'var(--navy)',color:'#fff',borderRadius:'var(--radius-lg)',padding:device==='mobile'?'24px 22px':'34px 36px'}}>
          <div className="eyebrow" style={{color:'var(--mid)',marginBottom:16}}>Guide questions</div>
          <ol style={{listStyle:'none',margin:0,padding:0,display:'grid',gap:16}}>
            {item.questions.map((q,i)=>(
              <li key={i} style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:16,alignItems:'baseline'}}>
                <span style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.4rem',color:'var(--mid)',lineHeight:1}}>{String(i+1).padStart(2,'0')}</span>
                <span style={{fontFamily:'var(--serif)',fontSize:'1.15rem',lineHeight:1.5,color:'#EAF0F8'}}>{q}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* references */}
      {item.refs?.length>0 && (
        <section style={{marginTop:'clamp(34px,4vw,48px)'}}>
          <h2 style={{fontSize:'1.3rem'}}>Learn more</h2>
          <ul style={{listStyle:'none',margin:'16px 0 0',padding:0,display:'grid',gap:11}}>
            {item.refs.map((r,i)=>(
              <li key={i} style={{display:'flex',gap:11,color:'var(--text-2)',fontSize:'.96rem',paddingBottom:11,borderBottom:'1px solid var(--line-soft)'}}>
                <I.doc size={'1.05em'} style={{color:'var(--mid)',flexShrink:0,marginTop:3}}/> <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* feedback form (article anatomy) */}
      <LibFeedback/>

      {/* comments */}
      <CommentsSection itemId={item.id}/>

      {/* related */}
      {item.related?.length>0 && <RelatedRow ids={item.related} onOpen={onOpen}/>}
    </div>
  );
}

function LibFeedback(){
  const [sent,setSent] = useState(false);
  const [r,setR] = useState(0);
  return (
    <section style={{marginTop:'clamp(36px,5vw,52px)',border:'1px solid var(--line)',borderRadius:'var(--radius-lg)',background:'var(--surface)',padding:'24px 24px'}}>
      {sent ? (
        <div style={{textAlign:'center',padding:'8px 0'}}>
          <div style={{width:50,height:50,borderRadius:'50%',background:'var(--pale-tint)',color:'var(--accent-strong)',display:'grid',placeItems:'center',margin:'0 auto 12px',fontSize:'1.4rem'}}><I.check/></div>
          <h3 style={{fontSize:'1.3rem'}}>Salamat for the feedback!</h3>
        </div>
      ) : (
        <div>
          <div className="eyebrow" style={{marginBottom:10}}>Feedback form</div>
          <h3 style={{fontSize:'1.35rem'}}>Was this helpful for your work?</h3>
          <div style={{display:'flex',gap:8,margin:'14px 0'}}>
            {[1,2,3,4,5].map(n=><button key={n} onClick={()=>setR(n)} style={{width:42,height:42,borderRadius:10,fontSize:'1.15rem',background:n<=r?'var(--navy)':'var(--surface-2)',color:n<=r?'#fff':'var(--text-3)',boxShadow:n<=r?'none':'inset 0 0 0 1px var(--line)'}}>★</button>)}
          </div>
          <textarea className="inp" rows={2} placeholder="Anything we should add or clarify?" style={{background:'var(--surface-2)'}}></textarea>
          <button className="btn btn-primary" style={{marginTop:12}} onClick={()=>setSent(true)}>Submit feedback</button>
        </div>
      )}
    </section>
  );
}

Object.assign(window, { LockedDetail, RelatedRow, Comment, CommentsSection, LibDetail, LibFeedback, GraphIcon });
