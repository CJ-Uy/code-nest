// ===== Content Library — My Lists & Favorites + module router =====

function MyLists({device, lists, favorites, onOpen, onFav}){
  const [open,setOpen] = useState("favorites");
  const favItems = favorites.map(libItem).filter(Boolean);
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:18,flexWrap:'wrap'}}>
        <div><h2 style={{fontSize:'1.5rem'}}>Lists & Favorites</h2><p style={{color:'var(--text-3)',fontSize:'.9rem',marginTop:2}}>Your saved library items, organized.</p></div>
        <button className="btn btn-ghost btn-sm"><I.plus size={'1em'}/> New list</button>
      </div>

      {/* favorites */}
      <Collapse open={open==='favorites'} onToggle={()=>setOpen(open==='favorites'?'':'favorites')}
        icon={<span style={{color:'var(--danger)'}}><FilledHeart/></span>} title="Favorites" count={favItems.length}>
        {favItems.length===0 ? <ListEmpty kind="favorites"/> : (
          <div style={{display:'grid',gridTemplateColumns:device==='mobile'?'1fr':'repeat(auto-fill,minmax(240px,1fr))',gap:12,marginTop:12}}>
            {favItems.map(it=><LibCard key={it.id} item={it} onOpen={onOpen} fav={true}/>)}
          </div>
        )}
      </Collapse>

      {/* lists */}
      {lists.map(l=>(
        <Collapse key={l.id} open={open===l.id} onToggle={()=>setOpen(open===l.id?'':l.id)}
          icon={<span style={{width:12,height:12,borderRadius:4,background:l.color,display:'block'}}></span>} title={l.name} count={l.items.length}>
          {l.items.length===0 ? <ListEmpty kind="list"/> : (
            <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:12}}>
              {l.items.map(libItem).filter(Boolean).map(it=><LibRow key={it.id} item={it} onOpen={onOpen} fav={favorites.includes(it.id)}/>)}
            </div>
          )}
        </Collapse>
      ))}
    </div>
  );
}
function Collapse({open,onToggle,icon,title,count,children}){
  return (
    <div className="card" style={{padding:0,overflow:'hidden',marginBottom:12}}>
      <button onClick={onToggle} style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:'15px 18px',textAlign:'left'}}>
        <span style={{display:'grid',placeItems:'center',width:22}}>{icon}</span>
        <span style={{fontWeight:700,color:'var(--text)',fontSize:'1.05rem',flex:1}}>{title}</span>
        <Badge kind="neutral">{count}</Badge>
        <span style={{color:'var(--text-3)',transform:open?'rotate(90deg)':'none',transition:'.18s'}}><I.chev/></span>
      </button>
      {open && <div style={{padding:'0 18px 18px'}}>{children}</div>}
    </div>
  );
}
function ListEmpty({kind}){
  return (
    <div style={{textAlign:'center',padding:'28px 20px',color:'var(--text-3)'}}>
      <div style={{fontSize:'1.5rem',marginBottom:8,color:'var(--mid)'}}>{kind==='favorites'?<I.heart/>:<I.bookmark/>}</div>
      <p style={{fontSize:'.92rem'}}>{kind==='favorites'?"No favorites yet. Tap the heart on any library item.":"This list is empty. Save items to it from their detail page."}</p>
    </div>
  );
}

// ---------- Library module (router) ----------
function LibraryModule({device, initialItem}){
  const [view,setView] = useState(initialItem?"detail":"browse");     // browse | detail | lists
  const [sel,setSel] = useState(initialItem||null);
  const [grid,setGrid] = useState("grid");
  const [favorites,setFavorites] = useState(()=>[...FAVORITES]);
  const [lists,setLists] = useState(()=>LISTS.map(l=>({...l,items:[...l.items]})));

  const openItem = (id)=>{ setSel(id); setView("detail"); const s=document.querySelector('.lib-scroll'); if(s) s.scrollTop=0; };
  const toggleFav = (id)=> setFavorites(f=> f.includes(id)? f.filter(x=>x!==id) : [...f,id]);
  const toggleList = (lid,id)=> setLists(ls=> ls.map(l=> l.id===lid ? {...l, items: l.items.includes(id)? l.items.filter(x=>x!==id) : [...l.items,id]} : l));

  return (
    <div className="lib-scroll">
      {view!=="detail" && (
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18,flexWrap:'wrap'}}>
          <div style={{display:'inline-flex',gap:3,background:'var(--surface-2)',borderRadius:11,padding:4}}>
            <SubTab on={view==='browse'} onClick={()=>setView('browse')} icon={<I.book size={'1em'}/>}>Browse</SubTab>
            <SubTab on={view==='lists'} onClick={()=>setView('lists')} icon={<I.bookmark size={'1em'}/>}>Lists & Favorites</SubTab>
          </div>
          {view==='browse' && device!=='mobile' && <div style={{marginLeft:'auto',color:'var(--text-3)',fontSize:'.85rem'}}>{LIBRARY.length} items · {LIBRARY.filter(i=>i.kind==='case').length} case studies</div>}
        </div>
      )}

      {view==='browse' && <LibBrowse device={device} onOpen={openItem} favorites={favorites} view={grid} setView={setGrid}/>}
      {view==='lists' && <MyLists device={device} lists={lists} favorites={favorites} onOpen={openItem} onFav={toggleFav}/>}
      {view==='detail' && <LibDetail itemId={sel} device={device} onBack={()=>setView('browse')} onOpen={openItem} favorites={favorites} onFav={toggleFav} lists={lists} onToggleList={toggleList}/>}
    </div>
  );
}
function SubTab({on,onClick,icon,children}){
  return <button onClick={onClick} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'8px 14px',borderRadius:8,fontWeight:600,fontSize:'.88rem',color:on?'#fff':'var(--text-2)',background:on?'var(--navy)':'transparent',transition:'.14s'}}>{icon}{children}</button>;
}

Object.assign(window, { MyLists, Collapse, LibraryModule, SubTab });
