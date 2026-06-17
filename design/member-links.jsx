// ===== Link Shortener — table, create, module router =====
const LINK_HOST = "code.ph";

function shortUrl(slug){ return LINK_HOST+"/"+slug; }

function CopyBtn({text, label, sm}){
  const [done,setDone] = useState(false);
  const copy = (e)=>{ e.stopPropagation(); try{navigator.clipboard&&navigator.clipboard.writeText(text);}catch(_){}; setDone(true); setTimeout(()=>setDone(false),1400); };
  return (
    <button onClick={copy} className={"btn btn-ghost "+(sm?'btn-sm':'')} style={done?{color:'var(--ok)',boxShadow:'inset 0 0 0 1.5px var(--ok)'}:null}>
      {done? <><I.check size={'1em'}/> Copied</> : <><CopyIcon/> {label||'Copy'}</>}
    </button>
  );
}
function CopyIcon(){ return <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>; }

// ---------- Links table ----------
function LinksTable({device, scope, setScope, links, onOpen, onEdit, onDelete}){
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <div style={{display:'inline-flex',gap:3,background:'var(--surface-2)',borderRadius:10,padding:4}}>
          {[["mine","My links"],["all","All links"]].map(([id,l])=>(
            <button key={id} onClick={()=>setScope(id)} style={{padding:'7px 14px',borderRadius:8,fontWeight:600,fontSize:'.86rem',color:scope===id?'#fff':'var(--text-2)',background:scope===id?'var(--navy)':'transparent'}}>{l}</button>
          ))}
        </div>
        <span style={{color:'var(--text-3)',fontSize:'.85rem',marginLeft:'auto'}}>{links.length} link{links.length!==1?'s':''}</span>
      </div>

      {links.length===0 ? (
        <div style={{textAlign:'center',padding:'48px 24px',border:'1.5px dashed var(--line)',borderRadius:'var(--radius-lg)',background:'var(--surface-2)'}}>
          <div style={{width:58,height:58,borderRadius:16,background:'var(--pale-tint)',color:'var(--accent-strong)',display:'grid',placeItems:'center',margin:'0 auto 14px',fontSize:'1.5rem'}}><I.link/></div>
          <h3 style={{fontSize:'1.25rem'}}>No links yet</h3>
          <p style={{color:'var(--text-2)',marginTop:8,maxWidth:340,marginInline:'auto'}}>Create a short link to share registrations, decks, and resources — with click tracking and a branded QR.</p>
        </div>
      ) : device==='mobile' ? (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {links.map(l=><LinkCard key={l.id} l={l} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete}/>)}
        </div>
      ) : (
        <div className="card" style={{overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'.92rem'}}>
            <thead><tr style={{background:'var(--surface-2)',textAlign:'left'}}>
              {["Short link","Destination","Creator","Clicks","Created",""].map((h,i)=><th key={i} style={{padding:'11px 16px',fontWeight:600,color:'var(--text-2)',fontSize:'.74rem',textTransform:'uppercase',letterSpacing:'.05em',textAlign:i===3?'right':'left'}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {links.map(l=>(
                <tr key={l.id} onClick={()=>onOpen(l)} style={{borderTop:'1px solid var(--line-soft)',cursor:'pointer'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--surface-2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'12px 16px'}}><div style={{display:'flex',alignItems:'center',gap:9}}><span style={{width:30,height:30,borderRadius:8,background:'var(--pale-tint)',color:'var(--accent-strong)',display:'grid',placeItems:'center',flexShrink:0}}><I.link size={'.95em'}/></span><div><div style={{fontWeight:700,color:'var(--text)'}} className="mono">{shortUrl(l.slug)}</div><div style={{color:'var(--text-3)',fontSize:'.8rem'}}>{l.title}</div></div></div></td>
                  <td style={{padding:'12px 16px',color:'var(--text-2)',maxWidth:220}}><span style={{display:'block',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{l.dest.replace('https://','')}</span></td>
                  <td style={{padding:'12px 16px'}}><div style={{display:'flex',alignItems:'center',gap:8}}><Avatar name={l.creator} size={24} tone={l.mine?'navy':'steel'}/><span style={{color:'var(--text-2)'}}>{l.creator}{l.mine&&' · you'}</span></div></td>
                  <td style={{padding:'12px 16px',textAlign:'right',fontWeight:700,color:'var(--text)'}}>{l.clicks.toLocaleString()}</td>
                  <td style={{padding:'12px 16px',color:'var(--text-3)'}}>{l.created}</td>
                  <td style={{padding:'12px 16px',textAlign:'right'}}><RowMenu l={l} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
function LinkCard({l, onOpen, onEdit, onDelete}){
  return (
    <div className="card" onClick={()=>onOpen(l)} style={{padding:'14px 15px',cursor:'pointer'}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:11}}>
        <span style={{width:34,height:34,borderRadius:9,background:'var(--pale-tint)',color:'var(--accent-strong)',display:'grid',placeItems:'center',flexShrink:0}}><I.link/></span>
        <div style={{flex:1,minWidth:0}}>
          <div className="mono" style={{fontWeight:700,color:'var(--text)',fontSize:'.95rem'}}>{shortUrl(l.slug)}</div>
          <div style={{color:'var(--text-3)',fontSize:'.82rem',marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{l.title}</div>
        </div>
        <RowMenu l={l} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete}/>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:14,marginTop:11,paddingTop:11,borderTop:'1px solid var(--line-soft)',fontSize:'.82rem',color:'var(--text-3)'}}>
        <span style={{display:'inline-flex',alignItems:'center',gap:5,color:'var(--text)',fontWeight:700}}>{l.clicks.toLocaleString()} <span style={{color:'var(--text-3)',fontWeight:400}}>clicks</span></span>
        <span style={{display:'inline-flex',alignItems:'center',gap:5}}><Avatar name={l.creator} size={18} tone={l.mine?'navy':'steel'}/>{l.creator}{l.mine&&' · you'}</span>
        <span style={{marginLeft:'auto'}}>{l.created}</span>
      </div>
    </div>
  );
}
function RowMenu({l, onOpen, onEdit, onDelete}){
  const [open,setOpen] = useState(false);
  const canEdit = l.mine || VIEWER_IS_LINK_ADMIN;
  const canDelete = VIEWER_IS_LINK_ADMIN;
  return (
    <div style={{position:'relative'}} onClick={e=>e.stopPropagation()}>
      <button onClick={()=>setOpen(o=>!o)} style={{color:'var(--text-3)',padding:6,borderRadius:8}}><I.more/></button>
      {open && <>
        <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:40}}></div>
        <div className="card" style={{position:'absolute',top:'100%',right:0,width:180,zIndex:50,padding:6,boxShadow:'var(--shadow-lg)'}}>
          <LMenuItem icon={<CopyIcon/>} onClick={()=>{try{navigator.clipboard.writeText('https://'+shortUrl(l.slug));}catch(_){}; setOpen(false);}}>Copy link</LMenuItem>
          <LMenuItem icon={<I.events size={'1em'}/>} onClick={()=>{onOpen(l);setOpen(false);}}>View analytics</LMenuItem>
          {canEdit && <LMenuItem icon={<I.doc size={'1em'}/>} onClick={()=>{onEdit&&onEdit(l);setOpen(false);}}>Edit{!l.mine&&VIEWER_IS_LINK_ADMIN?' (admin)':''}</LMenuItem>}
          {canDelete && <LMenuItem icon={<I.x size={'1em'}/>} danger onClick={()=>{onDelete&&onDelete(l);setOpen(false);}}>Delete{!l.mine?' (admin)':''}</LMenuItem>}
        </div>
      </>}
    </div>
  );
}
function LMenuItem({icon,children,onClick,danger}){
  return <button onClick={onClick} style={{display:'flex',alignItems:'center',gap:9,width:'100%',padding:'8px 10px',borderRadius:8,fontSize:'.88rem',color:danger?'var(--danger)':'var(--text)'}}
    onMouseEnter={e=>e.currentTarget.style.background='var(--surface-2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>{icon}{children}</button>;
}

// ---------- Create / edit link ----------
function slugStatus(slug, links, editingId){
  if(!slug) return {state:"empty"};
  if(!/^[a-z0-9-]+$/.test(slug)) return {state:"invalid", msg:"Use lowercase letters, numbers, and hyphens only."};
  if(slug.length<3) return {state:"invalid", msg:"At least 3 characters."};
  if(LINK_RESERVED.includes(slug)) return {state:"reserved", msg:"\u201C"+slug+"\u201D is a reserved word."};
  const clash = links.find(l=>l.slug===slug && l.id!==editingId);
  if(clash) return {state:"taken", msg:"Taken by "+clash.creator+"."};
  return {state:"available", msg:"Available!"};
}
function CreateLink({device, links, editing, onCancel, onSave}){
  const [slug,setSlug] = useState(editing?editing.slug:"");
  const [dest,setDest] = useState(editing?editing.dest:"");
  const [title,setTitle] = useState(editing?editing.title:"");
  const st = slugStatus(slug, links, editing?editing.id:null);
  const destOk = /^https?:\/\/.+\..+/.test(dest);
  const valid = st.state==="available" && destOk;
  const statusColor = {available:'var(--ok)',taken:'var(--danger)',reserved:'var(--warn)',invalid:'var(--danger)',empty:'var(--text-3)'}[st.state];
  return (
    <div style={{maxWidth:560}}>
      <button className="btn btn-sm btn-ghost" onClick={onCancel} style={{marginBottom:18}}>← {editing?'Cancel edit':'Cancel'}</button>
      <h2 style={{fontSize:'1.6rem'}}>{editing?'Edit link':'Create a short link'}</h2>
      <p style={{color:'var(--text-2)',marginTop:6,marginBottom:22}}>Short, shareable, and tracked — with a branded QR generated automatically.</p>

      <div style={{display:'flex',flexDirection:'column',gap:18}}>
        {/* slug */}
        <div>
          <label style={{display:'block',fontWeight:600,fontSize:'.85rem',color:'var(--text-2)',marginBottom:7}}>Short link</label>
          <div style={{display:'flex',alignItems:'stretch',borderRadius:'var(--radius-sm)',overflow:'hidden',boxShadow:'inset 0 0 0 1px '+(st.state==='available'?'var(--ok)':st.state==='taken'||st.state==='invalid'?'var(--danger)':st.state==='reserved'?'var(--warn)':'var(--line)'),transition:'.15s'}}>
            <span className="mono" style={{display:'flex',alignItems:'center',padding:'0 12px',background:'var(--surface-2)',color:'var(--text-3)',fontSize:'.92rem',borderRight:'1px solid var(--line)'}}>{LINK_HOST}/</span>
            <input className="mono" value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/\s/g,'-'))} placeholder="xchange-reg" autoFocus
              style={{flex:1,border:'none',outline:'none',padding:'11px 13px',background:'var(--surface)',color:'var(--text)',fontSize:'.95rem'}}/>
            <span style={{display:'grid',placeItems:'center',padding:'0 12px',color:statusColor}}>
              {st.state==='available'&&<I.check/>}{(st.state==='taken'||st.state==='invalid')&&<I.x/>}{st.state==='reserved'&&<I.clock/>}
            </span>
          </div>
          {st.msg && <div style={{display:'flex',alignItems:'center',gap:6,marginTop:7,fontSize:'.84rem',fontWeight:600,color:statusColor}}>
            {st.state==='available'?<I.check size={'.95em'}/>:<I.x size={'.95em'}/>}{st.msg}
            {st.state==='taken' && <span style={{fontWeight:400,color:'var(--text-3)'}}>· try {slug}-2 or {slug}-25</span>}
          </div>}
          {st.state==='reserved' && <div style={{marginTop:8,fontSize:'.82rem',color:'var(--text-3)'}}>Reserved words ({LINK_RESERVED.slice(0,5).join(', ')}…) are protected for official use.</div>}
        </div>

        {/* destination */}
        <div>
          <label style={{display:'block',fontWeight:600,fontSize:'.85rem',color:'var(--text-2)',marginBottom:7}}>Destination URL</label>
          <input className="inp" value={dest} onChange={e=>setDest(e.target.value)} placeholder="https://forms.gle/…"/>
          {dest && !destOk && <div style={{marginTop:7,fontSize:'.84rem',color:'var(--warn)',fontWeight:600}}>Enter a full URL starting with https://</div>}
        </div>

        {/* title */}
        <div>
          <label style={{display:'block',fontWeight:600,fontSize:'.85rem',color:'var(--text-2)',marginBottom:7}}>Label <span style={{color:'var(--text-3)',fontWeight:400}}>(optional)</span></label>
          <input className="inp" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. XChange 8 Registration"/>
        </div>

        {/* preview */}
        {valid && (
          <div style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',background:'var(--surface-2)',borderRadius:'var(--radius)',border:'1px solid var(--line)'}}>
            <FauxQR size={64} seed={slug.length*5+7}/>
            <div style={{minWidth:0}}><div className="mono" style={{fontWeight:700,color:'var(--text)'}}>{shortUrl(slug)}</div><div style={{color:'var(--text-3)',fontSize:'.83rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>→ {dest}</div></div>
          </div>
        )}
      </div>

      <div style={{display:'flex',gap:10,marginTop:22}}>
        <button className="btn btn-primary" disabled={!valid} onClick={()=>onSave({slug,dest,title})}>{editing?'Save changes':'Create link'}</button>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ---------- Module router ----------
function LinksModule({device}){
  const [view,setView] = useState("list");  // list | create | detail
  const [scope,setScope] = useState("mine");
  const [sel,setSel] = useState(null);
  const [editing,setEditing] = useState(null);
  const [links,setLinks] = useState(()=>LINKS.map(l=>({...l})));

  const visible = links.filter(l=> scope==='mine'? l.mine : true).sort((a,b)=>b.createdSort-a.createdSort);
  const openLink = (l)=>{ setSel(l); setView("detail"); const s=document.querySelector('.lk-scroll'); if(s) s.scrollTop=0; };
  const save = (data)=>{
    if(editing){ setLinks(ls=>ls.map(l=>l.id===editing.id?{...l,...data}:l)); }
    else { setLinks(ls=>[{ id:Date.now(), ...data, creator:ME.nick, mine:true, clicks:0, created:"Just now", createdSort:99999999 }, ...ls]); }
    setEditing(null); setView("list");
  };
  const del = (l)=> setLinks(ls=>ls.filter(x=>x.id!==l.id));

  return (
    <div className="lk-scroll">
      {view==='list' && (
        <>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:16,flexWrap:'wrap'}}>
            <div><h2 style={{fontSize:'1.5rem'}}>Link Shortener</h2><p style={{color:'var(--text-3)',fontSize:'.88rem',marginTop:2}}>Branded short links with click analytics and QR codes.</p></div>
            <button className="btn btn-primary btn-sm" onClick={()=>{setEditing(null);setView('create');}}><I.plus size={'1em'}/> Create link</button>
          </div>
          <LinksTable device={device} scope={scope} setScope={setScope} links={visible} onOpen={openLink}
            onEdit={(l)=>{setEditing(l);setView('create');}} onDelete={del}/>
        </>
      )}
      {view==='create' && <CreateLink device={device} links={links} editing={editing} onCancel={()=>{setEditing(null);setView('list');}} onSave={save}/>}
      {view==='detail' && <LinkDetail link={sel} device={device} onBack={()=>setView('list')} onEdit={(l)=>{setEditing(l);setView('create');}}/>}
    </div>
  );
}

Object.assign(window, { LINK_HOST, shortUrl, CopyBtn, CopyIcon, LinksTable, LinkCard, RowMenu, slugStatus, CreateLink, LinksModule });
