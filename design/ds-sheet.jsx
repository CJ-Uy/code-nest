// ===== Ateneo CODE — Design System sheet =====
function Section({n, title, desc, children}){
  return (
    <section style={{padding:'40px 0',borderTop:'1px solid var(--line)'}}>
      <div style={{display:'flex',gap:16,alignItems:'baseline',marginBottom:6}}>
        <span style={{fontFamily:'var(--serif)',fontWeight:700,color:'var(--mid)',fontSize:'1rem'}}>{n}</span>
        <h2 style={{fontSize:'1.7rem'}}>{title}</h2>
      </div>
      {desc && <p style={{color:'var(--text-2)',maxWidth:620,marginBottom:26,marginLeft:32}}>{desc}</p>}
      <div style={{marginLeft:32}}>{children}</div>
    </section>
  );
}
function Cell({label, children, w}){
  return (
    <div style={{flex:w?`0 0 ${w}`:'1 1 240px'}}>
      {label && <div className="mono" style={{fontSize:'.72rem',color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>{label}</div>}
      {children}
    </div>
  );
}
function Swatch({name, hex, varname, dark}){
  return (
    <div style={{borderRadius:12,overflow:'hidden',border:'1px solid var(--line)',background:'var(--surface)'}}>
      <div style={{height:74,background:hex}}></div>
      <div style={{padding:'10px 12px'}}>
        <div style={{fontWeight:600,fontSize:'.86rem',color:'var(--text)'}}>{name}</div>
        <div className="mono" style={{fontSize:'.74rem',color:'var(--text-3)',marginTop:2}}>{hex}</div>
      </div>
    </div>
  );
}

function Tabs({items}){
  const [a,setA] = useState(0);
  return (
    <div>
      <div style={{display:'inline-flex',gap:2,background:'var(--surface-2)',borderRadius:12,padding:4}}>
        {items.map((t,i)=>(
          <button key={t} onClick={()=>setA(i)} style={{padding:'8px 16px',borderRadius:9,fontWeight:600,fontSize:'.9rem',color:a===i?'#fff':'var(--text-2)',background:a===i?'var(--navy)':'transparent',transition:'.15s'}}>{t}</button>
        ))}
      </div>
    </div>
  );
}
function UnderlineTabs({items}){
  const [a,setA] = useState(0);
  return (
    <div style={{display:'flex',gap:24,borderBottom:'1px solid var(--line)'}}>
      {items.map((t,i)=>(
        <button key={t} onClick={()=>setA(i)} style={{padding:'10px 0',fontWeight:600,fontSize:'.94rem',color:a===i?'var(--accent-strong)':'var(--text-3)',borderBottom:'2px solid '+(a===i?'var(--accent)':'transparent'),marginBottom:-1,transition:'.15s'}}>{t}</button>
      ))}
    </div>
  );
}

function ModalDemo(){
  const [open,setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={()=>setOpen(true)}>Open modal</button>
      {open && (
        <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:100,background:'rgba(6,25,47,.5)',display:'grid',placeItems:'center',padding:20,animation:'fadein .2s'}}>
          <div onClick={e=>e.stopPropagation()} className="card" style={{maxWidth:420,width:'100%',padding:'26px',boxShadow:'var(--shadow-lg)'}}>
            <div style={{width:48,height:48,borderRadius:12,background:'var(--danger-bg)',color:'var(--danger)',display:'grid',placeItems:'center',fontSize:'1.3rem',marginBottom:16}}><I.logout/></div>
            <h3 style={{fontSize:'1.4rem'}}>Remove super admin?</h3>
            <p style={{color:'var(--text-2)',marginTop:8}}>This revokes all super-admin permissions for Karl Reyes. This action is recorded in the audit log.</p>
            <div style={{display:'flex',gap:10,marginTop:22,justifyContent:'flex-end'}}>
              <button className="btn btn-ghost" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={()=>setOpen(false)}>Remove access</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MiniRail(){
  const items=[["home","Dashboard",true],["book","Library",false],["link","Links",false],["events","Events",false],["calendar","Calendar",false]];
  return (
    <div style={{width:190,background:'var(--chrome)',borderRadius:14,padding:'16px 12px',display:'flex',flexDirection:'column',gap:3}}>
      <div style={{display:'flex',alignItems:'center',gap:9,padding:'0 6px 14px'}}><Falcon variant="white" size={26}/><span style={{fontFamily:'var(--serif)',fontWeight:700,color:'#fff',fontSize:'.95rem'}}>Ateneo CODE</span></div>
      {items.map(([ic,l,on])=>(
        <div key={l} style={{display:'flex',alignItems:'center',gap:11,padding:'9px 11px',borderRadius:10,color:on?'#fff':'var(--chrome-dim)',background:on?'rgba(255,255,255,.1)':'transparent',fontWeight:600,fontSize:'.86rem'}}>
          <span style={{fontSize:'1.1rem',display:'grid',placeItems:'center'}}>{React.createElement(I[ic])}</span>{l}
        </div>
      ))}
    </div>
  );
}
function MiniTabBar(){
  const items=[["home","Dashboard",true],["book","Library",false],["events","Events",false],["calendar","Calendar",false],["grid","More",false]];
  return (
    <div style={{width:300,background:'var(--chrome)',borderRadius:'14px',padding:'10px 6px 14px',display:'flex'}}>
      {items.map(([ic,l,on])=>(
        <div key={l} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,color:on?'var(--mid)':'var(--chrome-dim)'}}>
          <span style={{fontSize:'1.3rem'}}>{React.createElement(I[ic])}</span>
          <span style={{fontSize:'.6rem',fontWeight:600}}>{l}</span>
        </div>
      ))}
    </div>
  );
}

function DSheet(){
  return (
    <div className="ac-root" style={{background:'var(--bg)',minHeight:'100vh'}}>
      {/* header */}
      <header style={{background:'var(--navy)',color:'#fff',position:'relative',overflow:'hidden'}}>
        <img src="assets/falcon-white-t.png" alt="" aria-hidden="true" style={{position:'absolute',right:'-3%',top:'-40%',height:'200%',opacity:.06}}/>
        <div style={{maxWidth:1000,margin:'0 auto',padding:'46px 28px 40px',position:'relative'}}>
          <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:18}}>
            <Falcon variant="white" size={42}/>
            <a href="index.html" className="badge" style={{background:'rgba(255,255,255,.1)',color:'var(--mid)'}}>← Public site</a>
            <a href="Member Portal.html" className="badge" style={{background:'rgba(255,255,255,.1)',color:'var(--mid)'}}>Member portal →</a>
          </div>
          <div className="eyebrow" style={{color:'var(--mid)'}}>Foundation</div>
          <h1 style={{fontSize:'clamp(2.2rem,5vw,3.2rem)',color:'#fff',marginTop:12}}>Design System</h1>
          <p style={{color:'#C6D4E6',marginTop:14,maxWidth:560,fontSize:'1.1rem'}}>The tokens and components every Ateneo CODE screen is built from — light-primary surfaces with navy chrome, Unna for editorial weight, Source Sans Pro for everything else.</p>
        </div>
      </header>

      <div style={{maxWidth:1000,margin:'0 auto',padding:'0 28px 80px'}}>
        {/* COLORS */}
        <Section n="01" title="Color" desc="Navy is the master. Light and pale-blue surfaces carry content; the secondary palette is reserved for accents, data, and states — used sparingly.">
          <Cell label="Primary"><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:12,marginBottom:24}}>
            <Swatch name="Navy / Master" hex="#06192F"/>
            <Swatch name="Deep Navy" hex="#0C315C"/>
            <Swatch name="Near-black" hex="#121315"/>
            <Swatch name="Mid Blue" hex="#90B4CC"/>
            <Swatch name="Pale Blue" hex="#D7DFE9"/>
            <Swatch name="White" hex="#FFFFFF"/>
          </div></Cell>
          <Cell label="Secondary / accents"><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:12,marginBottom:24}}>
            <Swatch name="Steel" hex="#4986AC"/>
            <Swatch name="Slate" hex="#3D5266"/>
            <Swatch name="Charcoal" hex="#343B41"/>
            <Swatch name="Grey" hex="#717D89"/>
            <Swatch name="Mist" hex="#AAAFB5"/>
          </div></Cell>
          <Cell label="States (brand-harmonized)"><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:12}}>
            <Swatch name="Success" hex="#2E7D63"/>
            <Swatch name="Warning" hex="#B5742B"/>
            <Swatch name="Danger" hex="#B23A3A"/>
            <Swatch name="Info" hex="#4986AC"/>
          </div></Cell>
        </Section>

        {/* TYPE */}
        <Section n="02" title="Typography" desc="Unna Bold for headings, Unna Italic for subheads and editorial accents, Source Sans Pro for body and UI.">
          <div style={{display:'flex',flexDirection:'column',gap:20}}>
            {[["Display / Unna Bold","2.8rem",700,"normal","Empowering the youth"],["Heading / Unna Bold","2rem",700,"normal","Organization Development"],["Subhead / Unna Italic","1.4rem",400,"italic","Consultants in action"]].map(([l,sz,w,st,tx])=>(
              <div key={l} style={{display:'flex',gap:24,alignItems:'baseline',borderBottom:'1px solid var(--line-soft)',paddingBottom:16,flexWrap:'wrap'}}>
                <div className="mono" style={{fontSize:'.72rem',color:'var(--text-3)',width:170,flexShrink:0}}>{l}</div>
                <div style={{fontFamily:'var(--serif)',fontWeight:w,fontStyle:st,fontSize:sz,color:'var(--text)',lineHeight:1.1}}>{tx}</div>
              </div>
            ))}
            <div style={{display:'flex',gap:24,alignItems:'baseline',flexWrap:'wrap'}}>
              <div className="mono" style={{fontSize:'.72rem',color:'var(--text-3)',width:170,flexShrink:0}}>Body / Source Sans Pro</div>
              <div style={{maxWidth:520}}>
                <p style={{fontSize:'1.05rem',color:'var(--text)'}}>Regular 400 — CODE caters to clients with services tailor-fit to their specific needs instead of generalized programs.</p>
                <p style={{fontSize:'1.05rem',color:'var(--text)',fontWeight:600,marginTop:8}}>Semibold 600 — used for labels, buttons, and emphasis.</p>
                <p style={{fontSize:'.82rem',color:'var(--text-3)',marginTop:8,letterSpacing:'.06em',textTransform:'uppercase',fontWeight:600}}>Eyebrow / .72rem · uppercase · tracked</p>
              </div>
            </div>
          </div>
        </Section>

        {/* BUTTONS */}
        <Section n="03" title="Buttons" desc="Pill buttons. Primary navy for the main action, secondary pale for supporting, ghost for tertiary, danger for destructive.">
          <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center',marginBottom:18}}>
            <button className="btn btn-primary">Primary action</button>
            <button className="btn btn-secondary">Secondary</button>
            <button className="btn btn-ghost">Ghost</button>
            <button className="btn btn-danger">Destructive</button>
            <button className="btn btn-primary" disabled>Disabled</button>
          </div>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
            <button className="btn btn-primary btn-lg">Large <I.arrow size={'1em'}/></button>
            <button className="btn btn-primary">Default</button>
            <button className="btn btn-primary btn-sm">Small</button>
            <div style={{background:'var(--navy)',padding:'12px 14px',borderRadius:12,display:'flex',gap:10}}>
              <button className="btn btn-on-chrome btn-sm">On chrome</button>
              <button className="btn btn-sm" style={{background:'#fff',color:'var(--navy)'}}>On chrome</button>
            </div>
          </div>
        </Section>

        {/* INPUTS */}
        <Section n="04" title="Inputs & selects" desc="Soft-filled fields with a steel focus ring.">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16,maxWidth:720}}>
            <div><label style={{fontWeight:600,fontSize:'.85rem',color:'var(--text-2)',display:'block',marginBottom:7}}>Text field</label><input className="inp" placeholder="Juan dela Cruz"/></div>
            <div><label style={{fontWeight:600,fontSize:'.85rem',color:'var(--text-2)',display:'block',marginBottom:7}}>Select</label><select className="inp"><option>Within the Loyola Schools</option><option>Outside the Loyola Schools</option></select></div>
            <div style={{gridColumn:'1/-1'}}><label style={{fontWeight:600,fontSize:'.85rem',color:'var(--text-2)',display:'block',marginBottom:7}}>Textarea</label><textarea className="inp" rows={3} placeholder="A short description of your context"></textarea></div>
          </div>
        </Section>

        {/* CARDS */}
        <Section n="05" title="Cards" desc="The base surface for grouped content — 14px radius, hairline border, soft shadow.">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16,maxWidth:720}}>
            <div className="card" style={{padding:'20px'}}>
              <Badge kind="neutral">Foundations</Badge>
              <h3 style={{fontSize:'1.25rem',marginTop:12}}>Organization Identity</h3>
              <p style={{color:'var(--text-2)',fontSize:'.92rem',marginTop:8}}>How org identities are formed, and why a shared sense of who you are anchors everything.</p>
            </div>
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              <div style={{height:80,background:'var(--pale-tint)',backgroundImage:'repeating-linear-gradient(135deg,rgba(12,49,92,.14) 0 2px,transparent 2px 13px)'}}></div>
              <div style={{padding:'16px 18px'}}><h3 style={{fontSize:'1.2rem'}}>Media card</h3><p style={{color:'var(--text-2)',fontSize:'.9rem',marginTop:6}}>With an image slot header.</p></div>
            </div>
          </div>
        </Section>

        {/* BADGES */}
        <Section n="06" title="Badges & pills" desc="Compact status and category markers.">
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <Badge kind="neutral">Category</Badge>
            <Badge kind="info" dot>Official</Badge>
            <Badge kind="ok" dot>On track</Badge>
            <Badge kind="warn">Pending</Badge>
            <Badge kind="danger">Overdue</Badge>
            <Badge kind="ok"><I.check size={'.9em'}/> Going</Badge>
          </div>
        </Section>

        {/* TABS */}
        <Section n="07" title="Tabs" desc="Segmented control for view switching; underline tabs for in-page sections.">
          <div style={{display:'flex',gap:40,flexWrap:'wrap'}}>
            <Cell label="Segmented" w="auto"><Tabs items={["Upcoming","Past","Mine"]}/></Cell>
            <Cell label="Underline" w="auto"><div style={{minWidth:260}}><UnderlineTabs items={["All","Foundations","Methods"]}/></div></Cell>
          </div>
        </Section>

        {/* TABLE */}
        <Section n="08" title="Table" desc="For admin tooling — audit logs, member lists, link analytics.">
          <div className="card" style={{overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'.92rem'}}>
              <thead><tr style={{background:'var(--surface-2)',textAlign:'left'}}>
                {["Member","Role","Points","Status"].map(h=><th key={h} style={{padding:'12px 16px',fontWeight:600,color:'var(--text-2)',fontSize:'.78rem',textTransform:'uppercase',letterSpacing:'.05em'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[["Bea Mendoza","Consultant","185","ok|On track"],["Karl Reyes","CRS Admin","240","ok|On track"],["Mara Lim","Consultant","95","warn|At risk"]].map((r,i)=>(
                  <tr key={i} style={{borderTop:'1px solid var(--line-soft)'}}>
                    <td style={{padding:'12px 16px'}}><div style={{display:'flex',alignItems:'center',gap:10}}><Avatar name={r[0]} size={28}/><span style={{fontWeight:600,color:'var(--text)'}}>{r[0]}</span></div></td>
                    <td style={{padding:'12px 16px',color:'var(--text-2)'}}>{r[1]}</td>
                    <td style={{padding:'12px 16px',color:'var(--text-2)'}}>{r[2]}</td>
                    <td style={{padding:'12px 16px'}}><Badge kind={r[3].split('|')[0]} dot>{r[3].split('|')[1]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* TOAST + MODAL */}
        <Section n="09" title="Toast & modal" desc="Transient feedback and focused decisions.">
          <div style={{display:'flex',gap:24,flexWrap:'wrap',alignItems:'flex-start'}}>
            <Cell label="Toast" w="auto"><div style={{display:'flex',flexDirection:'column',gap:12}}>
              <Toast kind="ok" icon={<I.check/>} title="Attendance confirmed" body="You earned 15 points."/>
              <Toast kind="danger" icon={<I.x/>} title="Couldn't save link" body="That slug is already taken."/>
            </div></Cell>
            <Cell label="Modal" w="auto"><ModalDemo/></Cell>
          </div>
        </Section>

        {/* NAV */}
        <Section n="10" title="Navigation pattern" desc="Mobile collapses to a bottom tab bar (plus a More sheet); desktop expands to a navy nav rail.">
          <div style={{display:'flex',gap:32,flexWrap:'wrap',alignItems:'flex-start'}}>
            <Cell label="Desktop — nav rail" w="auto"><MiniRail/></Cell>
            <Cell label="Mobile — bottom tab bar" w="auto"><MiniTabBar/></Cell>
          </div>
        </Section>

        {/* FALCON */}
        <Section n="11" title="Falcon in-app" desc="The Falcon is the consistent identifier — undistorted, single-color, approved palette only. Used as the nav mark and as the avatar fallback.">
          <div style={{display:'flex',gap:28,flexWrap:'wrap',alignItems:'center'}}>
            <Cell label="On navy" w="auto"><div style={{background:'var(--navy)',padding:20,borderRadius:14,display:'flex',gap:18,alignItems:'center'}}><Falcon variant="white" size={44}/><Falcon variant="pale" size={36}/></div></Cell>
            <Cell label="On light" w="auto"><div style={{background:'var(--surface)',padding:20,borderRadius:14,border:'1px solid var(--line)',display:'flex',gap:18,alignItems:'center'}}><Falcon variant="navy" size={44}/></div></Cell>
            <Cell label="Avatar fallback" w="auto"><div style={{display:'flex',gap:12,alignItems:'center'}}><Avatar name="Bea Mendoza" size={44}/><Avatar size={44}/><Avatar name="Karl Reyes" size={44} tone="steel"/></div></Cell>
          </div>
        </Section>
      </div>
    </div>
  );
}

function mountDS(){ if(window.__dsMounted)return; window.__dsMounted=true; ReactDOM.createRoot(document.getElementById('root')).render(<DSheet/>); }
(function(){
  const faces=['700 1rem "Unna"','italic 400 1rem "Unna"','400 1rem "Source Sans 3"','600 1rem "Source Sans 3"'];
  if(document.fonts&&document.fonts.load){ Promise.all(faces.map(f=>document.fonts.load(f).catch(()=>{}))).then(()=>document.fonts.ready).catch(()=>{}).then(mountDS); } else mountDS();
  setTimeout(mountDS,2500);
})();
