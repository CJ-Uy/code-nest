// ===== Member portal — reusable app shell =====
const NAV_PRIMARY = [
  { id:"dashboard", label:"Dashboard", icon:"home" },
  { id:"library", label:"Library", icon:"book" },
  { id:"events", label:"Events", icon:"events" },
  { id:"calendar", label:"Calendar", icon:"calendar" },
];
const NAV_SECONDARY = [
  { id:"links", label:"Link Shortener", icon:"link" },
  { id:"announcements", label:"Announcements", icon:"megaphone" },
];
const NAV_FOOT = [
  { id:"admin", label:"Admin", icon:"lock", admin:true },
  { id:"profile", label:"Profile", icon:"user" },
  { id:"settings", label:"Settings", icon:"settings" },
];

function unreadCount(list){ return list.filter(n=>n.unread).length; }

// ---------- Notifications panel (shared content) ----------
function NotifPanel({notifs, onMarkAll, onClose, embedded}){
  const unread = unreadCount(notifs);
  return (
    <div style={{display:'flex',flexDirection:'column',maxHeight:'100%',overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px 12px',borderBottom:'1px solid var(--line)'}}>
        <div style={{display:'flex',alignItems:'center',gap:9}}>
          <h3 style={{fontSize:'1.15rem'}}>Notifications</h3>
          {unread>0 && <Badge kind="info">{unread} new</Badge>}
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {unread>0 && <button className="btn btn-sm btn-ghost" onClick={onMarkAll}>Mark all read</button>}
          {onClose && <button onClick={onClose} style={{color:'var(--text-3)',padding:6,fontSize:'1.05rem'}}><I.x/></button>}
        </div>
      </div>
      <div className="thin-scroll" style={{overflowY:'auto',padding:'6px 0'}}>
        {notifs.map(n=>(
          <div key={n.id} style={{display:'flex',gap:12,padding:'12px 18px',background:n.unread?'var(--info-bg)':'transparent',alignItems:'flex-start',position:'relative'}}>
            <div style={{width:36,height:36,borderRadius:10,background:'var(--pale-tint)',color:'var(--accent-strong)',display:'grid',placeItems:'center',flexShrink:0,fontSize:'1.05rem'}}>{React.createElement(I[n.kind]||I.bell)}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:'.94rem',color:'var(--text)'}}>{n.title}</div>
              <div style={{color:'var(--text-2)',fontSize:'.88rem',marginTop:1}}>{n.body}</div>
              <div style={{color:'var(--text-3)',fontSize:'.78rem',marginTop:4}}>{n.time}</div>
            </div>
            {n.unread && <span style={{width:8,height:8,borderRadius:'50%',background:'var(--accent)',flexShrink:0,marginTop:6}}></span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function BellButton({count, onClick, onChrome}){
  return (
    <button onClick={onClick} aria-label="Notifications" data-tour="bell" style={{position:'relative',width:42,height:42,borderRadius:12,display:'grid',placeItems:'center',color:onChrome?'var(--chrome-text)':'var(--text-2)',background:onChrome?'rgba(255,255,255,.08)':'var(--surface-2)',fontSize:'1.2rem'}}>
      <I.bell/>
      {count>0 && <span style={{position:'absolute',top:6,right:7,minWidth:16,height:16,padding:'0 4px',borderRadius:999,background:'var(--danger)',color:'#fff',fontSize:'.62rem',fontWeight:700,display:'grid',placeItems:'center',boxShadow:'0 0 0 2px var(--chrome)'}}>{count}</span>}
    </button>
  );
}

// ---------- MOBILE shell ----------
function MobileShell({active, onNav, children, greeting, bell, setBell, notifs, setNotifs}){
  const [more,setMore] = useState(false);
  const unread = unreadCount(notifs);
  const markAll = ()=>setNotifs(ns=>ns.map(n=>({...n,unread:false})));
  const tabs = [...NAV_PRIMARY, { id:"more", label:"More", icon:"grid" }];
  return (
    <div className="ac-root thin-scroll" style={{height:'100%',display:'flex',flexDirection:'column',background:'var(--bg)',position:'relative',overflow:'hidden'}}>
      {/* app bar */}
      <div style={{background:'var(--chrome)',color:'#fff',padding:'52px 18px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:11,minWidth:0}}>
          <Falcon variant="white" size={30}/>
          <div style={{minWidth:0}}>
            <div style={{fontSize:'.72rem',color:'var(--chrome-dim)',fontWeight:600,letterSpacing:'.02em'}}>{greeting||"Saturday · March 15"}</div>
            <div style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.32rem',lineHeight:1.1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>Kumusta, {ME.nick}</div>
          </div>
        </div>
        <BellButton count={unread} onClick={()=>setBell(true)} onChrome/>
      </div>

      {/* content */}
      <div className="thin-scroll" style={{flex:1,overflowY:'auto',padding:'18px 16px 26px'}}>
        {children}
      </div>

      {/* bottom tab bar */}
      <div style={{background:'var(--chrome)',display:'flex',padding:'8px 6px 26px',flexShrink:0,boxShadow:'0 -1px 0 var(--on-chrome-line)'}}>
        {tabs.map(t=>{
          const on = t.id==='more' ? more : active===t.id;
          return (
            <button key={t.id} onClick={()=>{ if(t.id==='more'){setMore(true);} else {setMore(false); onNav&&onNav(t.id);} }} data-tour={t.id==='more'?undefined:"nav-"+t.id}
              style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'4px 0',color:on?'var(--mid)':'var(--chrome-dim)',position:'relative'}}>
              <span style={{fontSize:'1.4rem',display:'grid',placeItems:'center'}}>{React.createElement(I[t.icon])}</span>
              <span style={{fontSize:'.66rem',fontWeight:600}}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* bell sheet */}
      {bell && <Sheet onClose={()=>setBell(false)}><NotifPanel notifs={notifs} onMarkAll={markAll} onClose={()=>setBell(false)}/></Sheet>}
      {/* more sheet */}
      {more && <Sheet onClose={()=>setMore(false)} title="More">
        <div style={{padding:'4px 0 10px'}}>
          {[...NAV_SECONDARY,...NAV_FOOT].map(n=>(
            <button key={n.id} onClick={()=>{setMore(false); onNav&&onNav(n.id);}} style={{display:'flex',alignItems:'center',gap:14,width:'100%',padding:'14px 18px',color:'var(--text)'}}>
              <span style={{fontSize:'1.25rem',color:'var(--accent)',width:26,display:'grid',placeItems:'center'}}>{React.createElement(I[n.icon])}</span>
              <span style={{fontWeight:600,flex:1,textAlign:'left'}}>{n.label}</span>
              <span style={{color:'var(--text-3)'}}><I.chev/></span>
            </button>
          ))}
          <div style={{borderTop:'1px solid var(--line)',margin:'8px 18px 0',paddingTop:12}}>
            <button onClick={()=>{ if(window.__signout) window.__signout(); }} style={{display:'flex',alignItems:'center',gap:14,width:'100%',padding:'12px 0',color:'var(--danger)'}}>
              <span style={{fontSize:'1.2rem',width:26,display:'grid',placeItems:'center'}}><I.logout/></span>
              <span style={{fontWeight:600}}>Sign out</span>
            </button>
          </div>
        </div>
      </Sheet>}
    </div>
  );
}

function Sheet({children, onClose, title}){
  return (
    <div onClick={onClose} style={{position:'absolute',inset:0,zIndex:80,background:'rgba(6,25,47,.42)',display:'flex',flexDirection:'column',justifyContent:'flex-end',animation:'fadein .2s ease'}}>
      <div onClick={e=>e.stopPropagation()} className="thin-scroll" style={{background:'var(--surface)',borderRadius:'22px 22px 0 0',maxHeight:'78%',display:'flex',flexDirection:'column',overflow:'hidden',animation:'slideup .26s cubic-bezier(.2,.8,.2,1)'}}>
        <div style={{display:'grid',placeItems:'center',padding:'10px 0 2px'}}><div style={{width:38,height:4,borderRadius:3,background:'var(--line)'}}></div></div>
        {title && <div style={{padding:'8px 18px 4px'}}><h3 style={{fontSize:'1.15rem'}}>{title}</h3></div>}
        {children}
      </div>
    </div>
  );
}

// ---------- DESKTOP shell ----------
function DesktopShell({active, onNav, children, pageTitle, bell, setBell, notifs, setNotifs}){
  const unread = unreadCount(notifs);
  const markAll = ()=>setNotifs(ns=>ns.map(n=>({...n,unread:false})));
  const RailItem = ({n})=>{
    const on = active===n.id;
    return (
      <button onClick={()=>onNav&&onNav(n.id)} data-tour={n.id==='admin'?'nav-admin':"nav-"+n.id} style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:'10px 13px',borderRadius:11,color:on?'#fff':'var(--chrome-dim)',background:on?'rgba(255,255,255,.1)':'transparent',fontWeight:600,fontSize:'.95rem',transition:'.14s',position:'relative'}}
        onMouseEnter={e=>{if(!on)e.currentTarget.style.color='#fff';}} onMouseLeave={e=>{if(!on)e.currentTarget.style.color='var(--chrome-dim)';}}>
        {on && <span style={{position:'absolute',left:-13,top:'50%',transform:'translateY(-50%)',width:4,height:20,borderRadius:3,background:'var(--mid)'}}></span>}
        <span style={{fontSize:'1.25rem',display:'grid',placeItems:'center'}}>{React.createElement(I[n.icon])}</span>{n.label}
        {n.admin && <span style={{marginLeft:'auto',fontSize:'.6rem',fontWeight:700,color:'var(--mid)',letterSpacing:'.05em',background:'rgba(144,180,204,.16)',padding:'2px 7px',borderRadius:999}}>ADMIN</span>}
      </button>
    );
  };
  return (
    <div className="ac-root" style={{height:'100%',display:'grid',gridTemplateColumns:'248px 1fr',background:'var(--bg)',position:'relative',overflow:'hidden'}}>
      {/* rail */}
      <aside style={{background:'var(--chrome)',display:'flex',flexDirection:'column',padding:'22px 16px',gap:4,overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',gap:11,padding:'0 8px 18px'}}>
          <Falcon variant="white" size={34}/>
          <div style={{lineHeight:1.05}}>
            <div style={{fontFamily:'var(--serif)',fontWeight:700,color:'#fff',fontSize:'1.15rem'}}>Ateneo CODE</div>
            <div style={{color:'var(--chrome-dim)',fontSize:'.66rem'}}>Member Portal</div>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:3}}>
          {NAV_PRIMARY.map(n=><RailItem key={n.id} n={n}/>)}
        </div>
        <div style={{height:1,background:'var(--on-chrome-line)',margin:'12px 8px'}}></div>
        <div style={{display:'flex',flexDirection:'column',gap:3}}>
          {NAV_SECONDARY.map(n=><RailItem key={n.id} n={n}/>)}
        </div>
        <div style={{marginTop:'auto',display:'flex',flexDirection:'column',gap:3}}>
          {NAV_FOOT.map(n=><RailItem key={n.id} n={n}/>)}
          <div style={{height:1,background:'var(--on-chrome-line)',margin:'8px 8px'}}></div>
          <button onClick={()=>{ if(window.__signout) window.__signout(); }} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 13px',borderRadius:11,color:'var(--chrome-dim)'}}>
            <Avatar name={ME.name} size={30}/>
            <div style={{textAlign:'left',lineHeight:1.15,flex:1,minWidth:0}}>
              <div style={{color:'#fff',fontWeight:600,fontSize:'.88rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ME.name}</div>
              <div style={{fontSize:'.72rem'}}>{ME.batch}</div>
            </div>
            <span style={{fontSize:'1rem'}}><I.logout/></span>
          </button>
        </div>
      </aside>

      {/* main */}
      <div style={{display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>
        <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,padding:'16px 28px',borderBottom:'1px solid var(--line)',background:'var(--surface)',flexShrink:0}}>
          <h1 style={{fontSize:'1.6rem'}}>{pageTitle||"Dashboard"}</h1>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <label style={{display:'flex',alignItems:'center',gap:8,background:'var(--surface-2)',border:'1px solid var(--line)',borderRadius:999,padding:'.45em 1em',color:'var(--text-3)',width:240}}>
              <I.search/><input placeholder="Search the portal" style={{border:'none',outline:'none',background:'transparent',color:'var(--text)',width:'100%',fontSize:'.9rem'}}/>
            </label>
            <div style={{position:'relative'}}>
              <BellButton count={unread} onClick={()=>setBell(b=>!b)}/>
              {bell && <>
                <div onClick={()=>setBell(false)} style={{position:'fixed',inset:0,zIndex:40}}></div>
                <div className="card" style={{position:'absolute',top:50,right:0,width:380,maxHeight:460,zIndex:50,boxShadow:'var(--shadow-lg)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
                  <NotifPanel notifs={notifs} onMarkAll={markAll} onClose={()=>setBell(false)}/>
                </div>
              </>}
            </div>
            <span data-tour="avatar"><Avatar name={ME.name} size={40}/></span>
          </div>
        </header>
        <div className="thin-scroll" style={{flex:1,overflowY:'auto',padding:'26px 28px 40px'}}>
          {children}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { NAV_PRIMARY, NAV_SECONDARY, NAV_FOOT, MobileShell, DesktopShell, NotifPanel, BellButton, Sheet });
