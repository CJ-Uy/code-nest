// ===== Announcements — list + detail, publishing-admin authored =====
const ANN_TAG = {
  OSG:{ bg:"var(--info-bg)", text:"var(--info)" },
  CRS:{ bg:"var(--warn-bg)", text:"var(--warn)" },
  Publishing:{ bg:"var(--ok-bg)", text:"var(--ok)" },
};

function AnnouncementsModule({device, onOpenEvent, onOpenLibrary}){
  const [openId,setOpenId] = useState(null);
  const [composing,setComposing] = useState(false);
  const open = ANNOUNCEMENTS_FULL.find(a=>a.id===openId);
  if(composing) return <AnnCompose device={device} onCancel={()=>setComposing(false)} onPost={()=>setComposing(false)}/>;
  if(open) return <AnnDetail a={open} device={device} onBack={()=>setOpenId(null)} onOpenEvent={onOpenEvent} onOpenLibrary={onOpenLibrary}/>;

  const pinned = ANNOUNCEMENTS_FULL.filter(a=>a.pinned);
  const rest = ANNOUNCEMENTS_FULL.filter(a=>!a.pinned);
  return (
    <div style={{maxWidth:760}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:6,flexWrap:'wrap'}}>
        <div><h2 style={{fontSize:'1.6rem'}}>Announcements</h2><p style={{color:'var(--text-3)',fontSize:'.9rem',marginTop:2}}>Org-wide updates from the OSG and admin teams.</p></div>
        {VIEWER_IS_PUBLISHING_ADMIN
          ? <button className="btn btn-primary btn-sm" onClick={()=>setComposing(true)}><I.plus size={'1em'}/> New announcement</button>
          : <span style={{display:'inline-flex',alignItems:'center',gap:6,color:'var(--text-3)',fontSize:'.82rem'}}><I.lock size={'.9em'}/> Publishing admins post here</span>}
      </div>

      {pinned.length>0 && (
        <div style={{marginTop:18}}>
          <div className="eyebrow" style={{marginBottom:10,display:'flex',alignItems:'center',gap:6}}><I.pin size={'.9em'}/> Pinned</div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {pinned.map(a=><AnnCard key={a.id} a={a} device={device} onOpen={()=>setOpenId(a.id)} pinned/>)}
          </div>
        </div>
      )}
      <div style={{marginTop:pinned.length?22:18,display:'flex',flexDirection:'column',gap:12}}>
        {rest.map(a=><AnnCard key={a.id} a={a} device={device} onOpen={()=>setOpenId(a.id)}/>)}
      </div>
    </div>
  );
}

function AnnCard({a, device, onOpen, pinned}){
  const t = ANN_TAG[a.tag]||ANN_TAG.OSG;
  return (
    <button onClick={onOpen} className="card" style={{padding:device==='mobile'?'15px 16px':'18px 20px',textAlign:'left',display:'flex',gap:15,transition:'.15s',borderLeft:pinned?'3px solid var(--accent)':'1px solid var(--line)'}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow='var(--shadow-md)';}} onMouseLeave={e=>{e.currentTarget.style.boxShadow='var(--shadow-sm)';}}>
      <div style={{width:44,height:44,borderRadius:12,background:t.bg,color:t.text,display:'grid',placeItems:'center',flexShrink:0,fontSize:'1.2rem'}}><I.megaphone/></div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,flexWrap:'wrap'}}>
          <span className="badge" style={{background:t.bg,color:t.text}}>{a.tag}</span>
          {pinned && <span style={{color:'var(--accent)',fontSize:'.72rem',fontWeight:700,display:'inline-flex',alignItems:'center',gap:3}}><I.pin size={'.85em'}/>Pinned</span>}
          <span style={{color:'var(--text-3)',fontSize:'.78rem',marginLeft:'auto'}}>{a.time}</span>
        </div>
        <div style={{fontFamily:'var(--serif)',fontWeight:700,color:'var(--text)',fontSize:device==='mobile'?'1.1rem':'1.25rem',lineHeight:1.2}}>{a.title}</div>
        <p style={{color:'var(--text-2)',fontSize:'.9rem',marginTop:5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{a.excerpt}</p>
        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:10,color:'var(--text-3)',fontSize:'.8rem'}}>
          <Avatar name={a.author} size={20} tone="steel"/><span style={{fontWeight:600,color:'var(--text-2)'}}>{a.author}</span><span>·</span><span>{a.authorRole}</span>
        </div>
      </div>
    </button>
  );
}

function AnnDetail({a, device, onBack, onOpenEvent, onOpenLibrary}){
  const t = ANN_TAG[a.tag]||ANN_TAG.OSG;
  return (
    <div style={{maxWidth:680}}>
      <button className="btn btn-sm btn-ghost" onClick={onBack} style={{marginBottom:18}}>← Announcements</button>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap'}}>
        <span className="badge" style={{background:t.bg,color:t.text}}>{a.tag}</span>
        {a.pinned && <span style={{color:'var(--accent)',fontSize:'.74rem',fontWeight:700,display:'inline-flex',alignItems:'center',gap:3}}><I.pin size={'.85em'}/>Pinned</span>}
        <span style={{color:'var(--text-3)',fontSize:'.84rem'}}>{a.audience}</span>
      </div>
      <h1 style={{fontSize:device==='mobile'?'1.7rem':'2.3rem',lineHeight:1.14}}>{a.title}</h1>
      <div style={{display:'flex',alignItems:'center',gap:11,marginTop:18,paddingBottom:20,borderBottom:'1px solid var(--line)'}}>
        <Avatar name={a.author} size={42} tone="navy"/>
        <div><div style={{fontWeight:700,color:'var(--text)'}}>{a.author}</div><div style={{color:'var(--text-3)',fontSize:'.85rem'}}>{a.authorRole} · {a.date}</div></div>
        {VIEWER_IS_PUBLISHING_ADMIN && <button className="btn btn-ghost btn-sm" style={{marginLeft:'auto'}}><I.doc size={'1em'}/> Edit</button>}
      </div>
      <div style={{marginTop:22,display:'flex',flexDirection:'column',gap:16}}>
        {a.body.map((p,i)=>(
          <p key={i} style={{color:'var(--text)',fontSize:device==='mobile'?'1rem':'1.08rem',lineHeight:1.7}} dangerouslySetInnerHTML={{__html:p}}></p>
        ))}
      </div>
      {(a.linkedEvent||a.linkedLibrary) && (
        <div style={{marginTop:24,padding:'16px 18px',background:'var(--surface-2)',borderRadius:'var(--radius)',display:'flex',alignItems:'center',gap:14}}>
          <span style={{width:42,height:42,borderRadius:11,background:'var(--pale-tint)',color:'var(--accent-strong)',display:'grid',placeItems:'center',flexShrink:0}}>{a.linkedEvent?<I.events/>:<I.book/>}</span>
          <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,color:'var(--text)',fontSize:'.92rem'}}>{a.linkedEvent?'Linked event':'Linked library item'}</div><div style={{color:'var(--text-3)',fontSize:'.82rem'}}>{a.linkedEvent?'Open it to RSVP and see attendance':'Open it in the Content Library'}</div></div>
          <button className="btn btn-primary btn-sm" onClick={()=>{ if(a.linkedEvent) onOpenEvent&&onOpenEvent(a.linkedEvent); else onOpenLibrary&&onOpenLibrary(a.linkedLibrary); }}>Open <I.arrow size={'1em'}/></button>
        </div>
      )}
    </div>
  );
}

function AnnCompose({device, onCancel, onPost}){
  const [tag,setTag] = useState("OSG");
  const [pinned,setPinned] = useState(false);
  return (
    <div style={{maxWidth:680}}>
      <button className="btn btn-sm btn-ghost" onClick={onCancel} style={{marginBottom:18}}>← Cancel</button>
      <h2 style={{fontSize:'1.6rem'}}>New announcement</h2>
      <div style={{display:'inline-flex',alignItems:'center',gap:7,marginTop:8,marginBottom:20,padding:'6px 12px',borderRadius:999,background:'var(--ok-bg)',color:'var(--ok)',fontSize:'.82rem',fontWeight:600}}><I.check size={'.9em'}/> Posting as Publishing Admin</div>
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <PField label="Category">
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {Object.keys(ANN_TAG).map(k=>(
              <button key={k} onClick={()=>setTag(k)} className="badge" style={{padding:'.55em 1em',fontSize:'.84rem',cursor:'pointer',background:tag===k?'var(--navy)':'var(--surface-2)',color:tag===k?'#fff':'var(--text-2)',boxShadow:tag===k?'none':'inset 0 0 0 1px var(--line)'}}>{k}</button>
            ))}
          </div>
        </PField>
        <PField label="Title"><input className="inp" placeholder="What\u2019s the update?"/></PField>
        <PField label="Audience">
          <select className="inp"><option>All members</option><option>Batch 16 only</option><option>Admins only</option><option>Consultancy Teams</option></select>
        </PField>
        <PField label="Body"><textarea className="inp" rows={6} placeholder="Write the announcement…"></textarea></PField>
        <label style={{display:'flex',alignItems:'center',gap:11,cursor:'pointer'}}>
          <Toggle on={pinned} onClick={()=>setPinned(p=>!p)}/>
          <div><div style={{fontWeight:600,fontSize:'.92rem'}}>Pin to top</div><div style={{color:'var(--text-3)',fontSize:'.82rem'}}>Keep this above other announcements until unpinned</div></div>
        </label>
      </div>
      <div style={{display:'flex',gap:10,marginTop:22}}>
        <button className="btn btn-primary" onClick={onPost}>Publish</button>
        <button className="btn btn-ghost" onClick={onCancel}>Save draft</button>
      </div>
    </div>
  );
}

Object.assign(window, { ANN_TAG, AnnouncementsModule, AnnCard, AnnDetail, AnnCompose });
