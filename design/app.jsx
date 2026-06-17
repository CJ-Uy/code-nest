// ===== App shell: router, nav, footer =====
const NAV = [
  {id:'landing', label:'Home'},
  {id:'services', label:'Our Services'},
  {id:'product', label:'Product Center'},
  {id:'projects', label:'Our Projects'},
  {id:'contact', label:'Contact'},
];

function useRoute(){
  const parse = ()=>{
    const h = (location.hash||'#landing').replace('#','');
    const [page, q] = h.split('?');
    const params = {};
    if(q) q.split('&').forEach(kv=>{const[k,v]=kv.split('=');params[k]=decodeURIComponent(v||'');});
    return {page:page||'landing', params};
  };
  const [route,setRoute] = useState(parse());
  useEffect(()=>{
    const on = ()=>setRoute(parse());
    window.addEventListener('hashchange', on);
    return ()=>window.removeEventListener('hashchange', on);
  },[]);
  const go = useCallback((page, params)=>{
    let h = '#'+page;
    if(params) h += '?'+Object.entries(params).map(([k,v])=>k+'='+encodeURIComponent(v)).join('&');
    if(location.hash===h){ window.scrollTo({top:0,behavior:'smooth'}); } else { location.hash = h; window.scrollTo(0,0); }
  },[]);
  return [route, go];
}

function TopNav({route, go}){
  const [open,setOpen] = useState(false);
  const [solid,setSolid] = useState(false);
  useEffect(()=>{
    const on = ()=>setSolid(window.scrollY>12);
    on(); window.addEventListener('scroll', on, {passive:true});
    return ()=>window.removeEventListener('scroll', on);
  },[]);
  useEffect(()=>{ setOpen(false); },[route.page]);
  const page = route.page==='article' ? 'product' : route.page;
  return (
    <nav style={{position:'sticky', top:0, zIndex:60, background:'var(--navy)', boxShadow:solid?'0 1px 0 var(--on-chrome-line), 0 10px 30px rgba(6,25,47,.28)':'0 1px 0 var(--on-chrome-line)', transition:'.2s'}}>
      <div className="wrap" style={{display:'flex', alignItems:'center', justifyContent:'space-between', height:68, gap:18}}>
        <button onClick={()=>go('landing')} style={{display:'flex', alignItems:'center', gap:12}} aria-label="Ateneo CODE home">
          <Falcon variant="white" size={36}/>
          <span style={{display:'flex', flexDirection:'column', lineHeight:1.05, textAlign:'left'}}>
            <span style={{fontFamily:'var(--serif)', fontWeight:700, color:'#fff', fontSize:'1.2rem', letterSpacing:'.5px'}}>Ateneo CODE</span>
            <span style={{fontFamily:'var(--sans)', color:'var(--chrome-text-dim)', fontSize:'.66rem', letterSpacing:'.04em'}}>Org Development & Empowerment</span>
          </span>
        </button>

        <div className="nav-links" style={{display:'flex', alignItems:'center', gap:4}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>go(n.id)}
              style={{padding:'.55em .95em', borderRadius:999, fontWeight:600, fontSize:'.93rem', color:page===n.id?'#fff':'var(--chrome-text-dim)', background:page===n.id?'rgba(255,255,255,.1)':'transparent', transition:'.15s'}}
              onMouseEnter={e=>{if(page!==n.id)e.currentTarget.style.color='#fff';}}
              onMouseLeave={e=>{if(page!==n.id)e.currentTarget.style.color='var(--chrome-text-dim)';}}>{n.label}</button>
          ))}
          <button className="btn btn-sm" style={{background:'#fff', color:'var(--navy)', marginLeft:10}} onClick={()=>go('signin')}><Ic.lock/> Sign in</button>
        </div>

        <button className="nav-burger" onClick={()=>setOpen(o=>!o)} aria-label="Menu" style={{display:'none', color:'#fff', fontSize:'1.5rem', padding:8}}>
          {open?<Ic.close/>:<Ic.menu/>}
        </button>
      </div>

      {/* mobile sheet */}
      <div className="nav-sheet" style={{maxHeight:open?'460px':0, overflow:'hidden', transition:'max-height .3s ease', background:'var(--navy)', borderTop:open?'1px solid var(--on-chrome-line)':'none'}}>
        <div className="wrap" style={{padding:open?'14px 28px 22px':'0 28px', display:'flex', flexDirection:'column', gap:4}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>go(n.id)} style={{textAlign:'left', padding:'13px 14px', borderRadius:10, fontWeight:600, fontSize:'1.05rem', color:page===n.id?'#fff':'var(--chrome-text-dim)', background:page===n.id?'rgba(255,255,255,.08)':'transparent'}}>{n.label}</button>
          ))}
          <button className="btn" style={{background:'#fff', color:'var(--navy)', marginTop:10, justifyContent:'center'}} onClick={()=>go('signin')}><Ic.lock/> Member sign in</button>
        </div>
      </div>
    </nav>
  );
}

function Footer({go}){
  return (
    <footer style={{background:'var(--ink)', color:'#fff'}}>
      <div className="wrap" style={{padding:'clamp(48px,7vw,76px) 28px 0'}}>
        <div className="foot-grid" style={{display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr', gap:'clamp(28px,5vw,56px)', paddingBottom:'clamp(36px,5vw,56px)'}}>
          <div>
            <div style={{display:'flex', alignItems:'center', gap:12}}>
              <Falcon variant="white" size={40}/>
              <span style={{fontFamily:'var(--serif)', fontWeight:700, fontSize:'1.4rem'}}>Ateneo CODE</span>
            </div>
            <p style={{color:'#9FB0C4', marginTop:16, maxWidth:360, fontSize:'.98rem'}}>{ORG.full}.</p>
            <div style={{display:'flex', gap:10, marginTop:20}}>
              <a className="foot-soc" href={"mailto:"+ORG.email} aria-label="Email"><Ic.mail/></a>
              <a className="foot-soc" href={ORG.fbUrl} target="_blank" rel="noreferrer" aria-label="Facebook"><Ic.fb/></a>
            </div>
          </div>
          <div>
            <div className="foot-h">Explore</div>
            <div style={{display:'grid', gap:11, marginTop:16}}>
              {NAV.map(n=> <button key={n.id} onClick={()=>go(n.id)} className="foot-link">{n.label}</button>)}
            </div>
          </div>
          <div>
            <div className="foot-h">Visit</div>
            <div style={{color:'#9FB0C4', marginTop:16, fontSize:'.96rem', lineHeight:1.7}}>
              {ORG.room}<br/>{ORG.campus}<br/><br/>
              <a href={"mailto:"+ORG.email} className="foot-link" style={{display:'inline'}}>{ORG.email}</a>
            </div>
            <button className="btn btn-on-chrome btn-sm" style={{marginTop:18}} onClick={()=>go('signin')}><Ic.lock/> Member sign in</button>
          </div>
        </div>
        <div style={{borderTop:'1px solid rgba(255,255,255,.1)', padding:'22px 0', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12, color:'#6E7E92', fontSize:'.85rem'}}>
          <span>© {new Date().getFullYear()} Ateneo CODE · {ORG.ay}</span>
          <span>Branding by the Office of the Secretary-General</span>
        </div>
      </div>
    </footer>
  );
}

function App(){
  const [route, go] = useRoute();
  const {page, params} = route;
  if(page==='signin') return <SignIn go={go}/>;
  let body;
  switch(page){
    case 'services': body = <Services go={go}/>; break;
    case 'product': body = <ProductCenter go={go}/>; break;
    case 'article': body = <Article id={params.id} go={go}/>; break;
    case 'projects': body = <Projects go={go}/>; break;
    case 'contact': body = <Contact go={go}/>; break;
    default: body = <Landing go={go}/>;
  }
  return (
    <div>
      <TopNav route={route} go={go}/>
      <main>{body}</main>
      <Footer go={go}/>
    </div>
  );
}

let _mounted = false;
function mountApp(){
  if(_mounted) return; _mounted = true;
  ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
}
// Render only once Unna + Source Sans are loaded, so we never paint in the
// fallback serif (Georgia is wider → transient wraps/overlap). Spinner shows meanwhile.
(function(){
  const faces = ['700 1rem "Unna"','italic 400 1rem "Unna"','italic 700 1rem "Unna"','400 1rem "Source Sans 3"','600 1rem "Source Sans 3"'];
  if(document.fonts && document.fonts.load){
    Promise.all(faces.map(f=>document.fonts.load(f).catch(()=>{})))
      .then(()=>document.fonts.ready).catch(()=>{}).then(mountApp);
  } else { mountApp(); }
  setTimeout(mountApp, 2500); // safety: never block render forever
})();
