// ===== Content Library — browse, detail, lists =====
const VIEWER_IS_CONTENT_ADMIN = true; // demo: current user can moderate

const CONF_META = {
  public:  { label:"Public",        kind:"neutral", icon:"book" },
  members: { label:"Members-only",  kind:"info",    icon:"lock" },
  confidential:{ label:"Confidential", kind:"danger", icon:"lock" },
};
const KIND_META = { article:{label:"Article"}, case:{label:"Case Study"} };

function libItem(id){ return LIBRARY.find(x=>x.id===id); }

// ---------- Save control (favorite + lists) ----------
function SaveControl({item, fav, onFav, lists, onToggleList, compact}){
  const [open,setOpen] = useState(false);
  const inLists = lists.filter(l=>l.items.includes(item.id));
  return (
    <div style={{display:'flex',gap:8,alignItems:'center',position:'relative'}}>
      <button onClick={onFav} aria-label="Favorite" className="btn btn-ghost btn-sm" style={{color:fav?'var(--danger)':'var(--text-2)',boxShadow:'inset 0 0 0 1.5px '+(fav?'var(--danger)':'var(--line)')}}>
        <span style={{fontSize:'1.05em',display:'grid',placeItems:'center'}}>{fav?<FilledHeart/>:<I.heart/>}</span>{!compact&&(fav?'Favorited':'Favorite')}
      </button>
      <button onClick={()=>setOpen(o=>!o)} className="btn btn-ghost btn-sm">
        <I.bookmark/>{!compact && (inLists.length?`In ${inLists.length} list${inLists.length>1?'s':''}`:'Save to list')}<I.chevDown size={'.85em'}/>
      </button>
      {open && <>
        <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:40}}></div>
        <div className="card" style={{position:'absolute',top:'110%',right:0,width:260,zIndex:50,boxShadow:'var(--shadow-lg)',padding:'8px',overflow:'hidden'}}>
          <div style={{padding:'6px 10px 8px',fontSize:'.78rem',fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.05em'}}>Save to a list</div>
          {lists.map(l=>{ const on=l.items.includes(item.id); return (
            <button key={l.id} onClick={()=>onToggleList(l.id)} style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'9px 10px',borderRadius:9,color:'var(--text)',fontSize:'.9rem'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--surface-2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <span style={{width:18,height:18,borderRadius:5,border:'1.5px solid '+(on?'var(--accent)':'var(--line)'),background:on?'var(--accent)':'transparent',color:'#fff',display:'grid',placeItems:'center',flexShrink:0}}>{on&&<I.check size={'.8em'}/>}</span>
              <span style={{width:9,height:9,borderRadius:'50%',background:l.color,flexShrink:0}}></span>
              <span style={{flex:1,textAlign:'left',fontWeight:on?600:400}}>{l.name}</span>
            </button>
          );})}
          <div style={{borderTop:'1px solid var(--line-soft)',marginTop:6,paddingTop:6}}>
            <button style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'9px 10px',borderRadius:9,color:'var(--accent-strong)',fontWeight:600,fontSize:'.9rem'}}><I.plus size={'1em'}/> New list…</button>
          </div>
        </div>
      </>}
    </div>
  );
}
function FilledHeart(){ return <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.4-7 10-7 10z"/></svg>; }

// ---------- confidentiality + kind chips ----------
function ItemMeta({item, light}){
  const c = CONF_META[item.conf]; const dim = light?'var(--chrome-dim)':'var(--text-3)';
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
      <span style={{fontWeight:700,fontSize:'.72rem',letterSpacing:'.08em',textTransform:'uppercase',color:light?'var(--mid)':'var(--accent)'}}>{KIND_META[item.kind].label}</span>
      <span style={{color:dim}}>·</span>
      <span style={{display:'inline-flex',alignItems:'center',gap:4,color:dim,fontSize:'.8rem',fontWeight:600}}>{item.cat}</span>
      <span style={{color:dim}}>·</span>
      <span style={{display:'inline-flex',alignItems:'center',gap:4,color:dim,fontSize:'.8rem'}}><I.clock size={'.9em'}/>{item.read}</span>
    </div>
  );
}
function ConfPill({conf}){
  const c = CONF_META[conf];
  return <Badge kind={c.kind}>{conf!=='public' && <I.lock size={'.85em'}/>}{c.label}</Badge>;
}

// ---------- Library card (grid) ----------
function LibCard({item, onOpen, fav}){
  return (
    <button onClick={()=>onOpen(item.id)} className="card" style={{padding:0,overflow:'hidden',textAlign:'left',display:'flex',flexDirection:'column',cursor:'pointer',transition:'.16s'}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow='var(--shadow-md)';e.currentTarget.style.borderColor='var(--mid)';}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow='var(--shadow-sm)';e.currentTarget.style.borderColor='var(--line)';}}>
      <div style={{height:120,position:'relative',background:item.kind==='case'?'var(--navy)':'var(--pale-tint)',backgroundImage:item.kind==='case'?'none':'repeating-linear-gradient(135deg,rgba(12,49,92,.13) 0 2px,transparent 2px 13px)',display:'grid',placeItems:'center',overflow:'hidden'}}>
        {item.kind==='case' && <img src="assets/falcon-white-t.png" alt="" style={{position:'absolute',right:-10,bottom:-18,height:110,opacity:.08}}/>}
        <span className="mono" style={{fontSize:'.66rem',letterSpacing:'.08em',textTransform:'uppercase',color:item.kind==='case'?'rgba(234,240,248,.6)':'var(--a-slate)',padding:'0 16px',textAlign:'center'}}>{item.kind==='case'?'Case study cover':'Article cover'}</span>
        <div style={{position:'absolute',top:10,left:10}}><ConfPill conf={item.conf}/></div>
        {item.conf==='confidential' && <div style={{position:'absolute',top:10,right:10,color:'#fff',opacity:.8}}><I.lock/></div>}
      </div>
      <div style={{padding:'14px 16px 16px',display:'flex',flexDirection:'column',flex:1}}>
        <ItemMeta item={item}/>
        <h3 style={{fontSize:'1.18rem',marginTop:9,lineHeight:1.22}}>{item.title}</h3>
        <p style={{color:'var(--text-2)',fontSize:'.9rem',marginTop:7,flex:1,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{item.dek}</p>
        <div style={{display:'flex',gap:6,marginTop:12,flexWrap:'wrap',alignItems:'center'}}>
          {item.topics?.slice(0,2).map(t=><span key={t} style={{fontSize:'.74rem',fontWeight:600,color:'var(--accent-strong)',background:'var(--surface-2)',padding:'3px 8px',borderRadius:999}}>{t}</span>)}
          {fav && <span style={{marginLeft:'auto',color:'var(--danger)',fontSize:'.95rem'}}><FilledHeart/></span>}
        </div>
      </div>
    </button>
  );
}

// ---------- Library row (list view) ----------
function LibRow({item, onOpen, fav}){
  return (
    <button onClick={()=>onOpen(item.id)} className="card" style={{padding:'14px 16px',textAlign:'left',display:'flex',gap:15,alignItems:'center',cursor:'pointer',width:'100%'}}
      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--mid)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--line)'}>
      <div style={{width:46,height:46,borderRadius:11,flexShrink:0,background:item.kind==='case'?'var(--navy)':'var(--pale-tint)',color:item.kind==='case'?'#fff':'var(--accent-strong)',display:'grid',placeItems:'center',fontSize:'1.15rem'}}>{item.kind==='case'?<I.doc/>:<I.book/>}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}><ItemMeta item={item}/></div>
        <div style={{fontWeight:700,color:'var(--text)',fontSize:'1.02rem'}}>{item.title}</div>
        <div style={{color:'var(--text-2)',fontSize:'.87rem',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.dek}</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        {fav && <span style={{color:'var(--danger)'}}><FilledHeart/></span>}
        <ConfPill conf={item.conf}/>
      </div>
    </button>
  );
}

// ---------- Browse ----------
const NL_SUGGESTIONS = ["interventions like our stalled council","case studies on volunteer burnout","frameworks for vision & mission","how to facilitate a hard conversation"];

function LibBrowse({device, onOpen, favorites, view, setView}){
  const [q,setQ] = useState("");
  const [kind,setKind] = useState("all");
  const [conf,setConf] = useState("all");
  const [topic,setTopic] = useState("all");
  const [sort,setSort] = useState("recent");
  const [filtersOpen,setFiltersOpen] = useState(false);

  let list = LIBRARY.filter(it=>{
    if(kind!=="all" && it.kind!==kind) return false;
    if(conf!=="all" && it.conf!==conf) return false;
    if(topic!=="all" && !(it.topics||[]).includes(topic)) return false;
    if(q){ const hay=(it.title+it.dek+it.abstract+(it.topics||[]).join(' ')+(it.cat||'')).toLowerCase(); if(!hay.includes(q.toLowerCase())) return false; }
    return true;
  });
  list = [...list].sort((a,b)=> sort==="recent" ? b.dateSort-a.dateSort : a.title.localeCompare(b.title));

  const activeFilters = (kind!=="all"?1:0)+(conf!=="all"?1:0)+(topic!=="all"?1:0);
  const Chip = ({active,onClick,children})=> (
    <button onClick={onClick} style={{padding:'6px 12px',borderRadius:999,fontSize:'.84rem',fontWeight:600,whiteSpace:'nowrap',color:active?'#fff':'var(--text-2)',background:active?'var(--navy)':'var(--surface)',boxShadow:active?'none':'inset 0 0 0 1px var(--line)',transition:'.14s'}}>{children}</button>
  );

  return (
    <div>
      {/* NL search */}
      <div style={{background:'linear-gradient(135deg,var(--navy),var(--navy-deep))',borderRadius:'var(--radius)',padding:device==='mobile'?'18px 16px':'22px 22px',position:'relative',overflow:'hidden',marginBottom:18}}>
        <img src="assets/falcon-white-t.png" alt="" style={{position:'absolute',right:-12,top:-26,height:150,opacity:.06}}/>
        <div style={{position:'relative'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,color:'var(--mid)',marginBottom:10,fontSize:'.8rem',fontWeight:600}}><I.search size={'1em'}/> Relationship-aware search · finds related interventions, not just keywords</div>
          <div style={{display:'flex',gap:9,alignItems:'center',background:'rgba(255,255,255,.96)',borderRadius:12,padding:'4px 6px 4px 14px'}}>
            <span style={{color:'var(--navy)',fontSize:'1.15rem',display:'grid',placeItems:'center'}}><GraphIcon/></span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Find OD interventions like ours…" style={{flex:1,border:'none',outline:'none',background:'transparent',fontSize:device==='mobile'?'.95rem':'1.02rem',color:'var(--navy)',padding:'9px 0'}}/>
            {q && <button onClick={()=>setQ("")} className="btn btn-sm" style={{background:'var(--surface-2)',color:'var(--text-2)'}}><I.x size={'.9em'}/></button>}
            <button className="btn btn-primary btn-sm" style={{background:'var(--navy)'}}>Search</button>
          </div>
          {!q && <div style={{display:'flex',gap:7,marginTop:11,flexWrap:'wrap'}}>
            {NL_SUGGESTIONS.slice(0,device==='mobile'?2:4).map(s=>(
              <button key={s} onClick={()=>setQ(s)} style={{fontSize:'.78rem',color:'#fff',background:'rgba(255,255,255,.1)',border:'1px solid var(--on-chrome-line)',borderRadius:999,padding:'5px 11px'}}>{s}</button>
            ))}
          </div>}
          {q && <div style={{display:'flex',alignItems:'center',gap:8,marginTop:11,color:'var(--mid)',fontSize:'.82rem'}}><I.spark size={'1em'}/> Showing matches and items related by topic & citation graph</div>}
        </div>
      </div>

      {/* filter row */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        {device!=='mobile' ? (
          <>
            <FilterSelect label="Type" value={kind} onChange={setKind} options={[["all","All types"],["article","Articles"],["case","Case studies"]]}/>
            <FilterSelect label="Access" value={conf} onChange={setConf} options={[["all","All access"],["public","Public"],["members","Members-only"],["confidential","Confidential"]]}/>
            <FilterSelect label="Topic" value={topic} onChange={setTopic} options={[["all","All topics"],...LIB_TOPICS.map(t=>[t,t])]}/>
            <FilterSelect label="Sort" value={sort} onChange={setSort} options={[["recent","Most recent"],["az","A–Z"]]}/>
            <div style={{marginLeft:'auto',display:'flex',gap:4,background:'var(--surface-2)',borderRadius:9,padding:3}}>
              <ViewBtn on={view==='grid'} onClick={()=>setView('grid')} icon={<I.grid/>}/>
              <ViewBtn on={view==='list'} onClick={()=>setView('list')} icon={<I.more/>}/>
            </div>
          </>
        ) : (
          <>
            <div className="thin-scroll" style={{display:'flex',gap:8,overflowX:'auto',flex:1,paddingBottom:2}}>
              <Chip active={conf==='all'&&kind==='all'} onClick={()=>{setConf('all');setKind('all');}}>All</Chip>
              <Chip active={kind==='case'} onClick={()=>setKind(kind==='case'?'all':'case')}>Case studies</Chip>
              <Chip active={conf==='members'} onClick={()=>setConf(conf==='members'?'all':'members')}>Members-only</Chip>
              <Chip active={kind==='article'} onClick={()=>setKind(kind==='article'?'all':'article')}>Articles</Chip>
            </div>
            <button onClick={()=>setFiltersOpen(true)} className="btn btn-ghost btn-sm" style={{flexShrink:0}}><I.filter size={'1em'}/>{activeFilters>0?` ${activeFilters}`:''}</button>
          </>
        )}
      </div>

      {/* results */}
      {list.length===0 ? (
        <LibEmpty q={q} onClear={()=>{setQ("");setKind("all");setConf("all");setTopic("all");}}/>
      ) : view==='grid' ? (
        <div style={{display:'grid',gridTemplateColumns:device==='mobile'?'1fr':'repeat(auto-fill,minmax(240px,1fr))',gap:14}}>
          {list.map(it=><LibCard key={it.id} item={it} onOpen={onOpen} fav={favorites.includes(it.id)}/>)}
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {list.map(it=><LibRow key={it.id} item={it} onOpen={onOpen} fav={favorites.includes(it.id)}/>)}
        </div>
      )}

      {device==='mobile' && filtersOpen && (
        <MobileFilterSheet onClose={()=>setFiltersOpen(false)}
          kind={kind} setKind={setKind} conf={conf} setConf={setConf} topic={topic} setTopic={setTopic} sort={sort} setSort={setSort}/>
      )}
    </div>
  );
}
function GraphIcon(){ return <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="6" cy="7" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="15" cy="17" r="2.4"/><path d="M8.2 8.2 13 15M8.4 6.6 15.6 6.2"/></svg>; }
function ViewBtn({on,onClick,icon}){ return <button onClick={onClick} style={{width:32,height:30,borderRadius:7,display:'grid',placeItems:'center',color:on?'var(--navy)':'var(--text-3)',background:on?'#fff':'transparent',boxShadow:on?'var(--shadow-sm)':'none',fontSize:'1.05rem'}}>{icon}</button>; }
function FilterSelect({label,value,onChange,options}){
  return (
    <label style={{position:'relative',display:'inline-flex'}}>
      <select className="inp" value={value} onChange={e=>onChange(e.target.value)} style={{padding:'8px 32px 8px 13px',fontSize:'.86rem',fontWeight:600,width:'auto',background:'var(--surface)',cursor:'pointer'}}>
        {options.map(([v,l])=><option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
function MobileFilterSheet({onClose,kind,setKind,conf,setConf,topic,setTopic,sort,setSort}){
  const Group = ({label,value,set,opts})=> (
    <div style={{marginBottom:18}}>
      <div style={{fontWeight:600,fontSize:'.82rem',color:'var(--text-2)',marginBottom:9,textTransform:'uppercase',letterSpacing:'.05em'}}>{label}</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {opts.map(([v,l])=>(
          <button key={v} onClick={()=>set(v)} style={{padding:'8px 13px',borderRadius:999,fontSize:'.86rem',fontWeight:600,color:value===v?'#fff':'var(--text-2)',background:value===v?'var(--navy)':'var(--surface-2)',boxShadow:value===v?'none':'inset 0 0 0 1px var(--line)'}}>{l}</button>
        ))}
      </div>
    </div>
  );
  return (
    <Sheet onClose={onClose} title="Filters">
      <div style={{padding:'12px 18px 24px'}}>
        <Group label="Type" value={kind} set={setKind} opts={[["all","All"],["article","Articles"],["case","Case studies"]]}/>
        <Group label="Access" value={conf} set={setConf} opts={[["all","All"],["public","Public"],["members","Members-only"],["confidential","Confidential"]]}/>
        <Group label="Topic" value={topic} set={setTopic} opts={[["all","All"],...LIB_TOPICS.map(t=>[t,t])]}/>
        <Group label="Sort" value={sort} set={setSort} opts={[["recent","Most recent"],["az","A–Z"]]}/>
        <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:6}} onClick={onClose}>Show results</button>
      </div>
    </Sheet>
  );
}

function LibEmpty({q,onClear}){
  return (
    <div style={{textAlign:'center',padding:'52px 24px',border:'1.5px dashed var(--line)',borderRadius:'var(--radius-lg)',background:'var(--surface-2)'}}>
      <div style={{width:60,height:60,borderRadius:16,background:'var(--pale-tint)',color:'var(--accent-strong)',display:'grid',placeItems:'center',margin:'0 auto 16px',fontSize:'1.5rem'}}><I.search/></div>
      <h3 style={{fontSize:'1.3rem'}}>{q?`No results for \u201C${q}\u201D`:"Nothing matches those filters"}</h3>
      <p style={{color:'var(--text-2)',marginTop:8,maxWidth:380,marginInline:'auto'}}>Try a broader topic, or clear filters to see the whole library.</p>
      <button className="btn btn-ghost" style={{marginTop:18}} onClick={onClear}>Clear search & filters</button>
    </div>
  );
}

Object.assign(window, { VIEWER_IS_CONTENT_ADMIN, CONF_META, KIND_META, libItem, SaveControl, FilledHeart, ItemMeta, ConfPill, LibCard, LibRow, LibBrowse, LibEmpty, FilterSelect });
