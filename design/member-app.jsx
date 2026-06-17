// ===== Member portal — interactive showcase (mobile + desktop) =====
window.__signout = ()=>{ location.href = "index.html#signin"; };

const LABELS = { dashboard:"Dashboard", library:"Content Library", links:"Link Shortener", events:"Events", calendar:"Calendar", announcements:"Announcements", profile:"Profile", settings:"Settings", admin:"Admin" };

function EmptyTab({id, device}){
  const meta = {
    library:["book","Content Library","Browse the members-only superset of the Product Center \u2014 including private case studies, saved lists, and natural-language search."],
    links:["link","Link Shortener","Create and track short links, view analytics, and generate QR codes with the Falcon embedded."],
    events:["events","Events (CRS)","RSVP to events, scan attendance, track your points and retention, and view the leaderboard."],
    calendar:["calendar","Calendar","A filterable, multi-type calendar \u2014 official, casual, and birthdays \u2014 with CRS events attached."],
    announcements:["megaphone","Announcements","The full announcements archive with pinned posts and read tracking."],
    profile:["user","Profile","Edit your nickname, pronouns, and fields \u2014 and view other members\u2019 profiles."],
    settings:["settings","Settings","Manage your preferences and restart the guided tour."],
  }[id] || ["grid","Coming soon","This screen is part of a later build phase."];
  return (
    <div style={{display:'grid',placeItems:'center',minHeight:device==='mobile'?'60vh':'58vh',textAlign:'center',padding:'30px 24px'}}>
      <div style={{maxWidth:360}}>
        <div style={{width:64,height:64,borderRadius:18,background:'var(--pale-tint)',color:'var(--accent-strong)',display:'grid',placeItems:'center',margin:'0 auto 18px',fontSize:'1.7rem'}}>{React.createElement(I[meta[0]])}</div>
        <h2 style={{fontSize:'1.5rem'}}>{meta[1]}</h2>
        <p style={{color:'var(--text-2)',marginTop:10}}>{meta[2]}</p>
        <div style={{marginTop:18}}><Badge kind="warn">Next build phase</Badge></div>
      </div>
    </div>
  );
}

function PortalInstance({device, start, tour}){
  const [active,setActiveRaw] = useState(start||'dashboard');
  const [bell,setBell] = useState(false);
  const [notifs,setNotifs] = useState(()=>NOTIFS.map(n=>({...n})));
  const [evInit,setEvInit] = useState(null);
  const [evId,setEvId] = useState(null);
  const [libId,setLibId] = useState(null);
  const [tourSteps,setTourSteps] = useState(null);
  const setActive = (id)=>{ setEvInit(null); setEvId(null); setLibId(null); setActiveRaw(id); };
  const goSurvey = ()=>{ setBell(false); setEvInit('survey'); setActiveRaw('events'); };
  const openEvent = (id)=>{ setEvInit(null); setEvId(id); setActiveRaw('events'); };
  const openLibrary = (id)=>{ setLibId(id); setActiveRaw('library'); };
  const startTour = (which)=>{ setActiveRaw(which==='admin'?'admin':'dashboard'); setTimeout(()=>setTourSteps(which==='admin'?TOUR_ADMIN:TOUR_MEMBER),80); };
  // auto-start tour on mount when requested
  useEffect(()=>{ if(tour){ const t=setTimeout(()=>setTourSteps(tour==='admin'?TOUR_ADMIN:TOUR_MEMBER),400); return ()=>clearTimeout(t);} },[]);
  const content = active==='dashboard'
    ? <Dashboard device={device} onNav={setActive} onBell={()=>setBell(true)} onSurvey={goSurvey}/>
    : active==='library'
    ? <LibraryModule device={device} initialItem={libId}/>
    : active==='events'
    ? <EventsModule device={device} initialView={evInit} initialEventId={evId}/>
    : active==='links'
    ? <LinksModule device={device}/>
    : active==='calendar'
    ? <CalendarModule device={device} onOpenEvent={openEvent}/>
    : active==='profile'
    ? <ProfileModule device={device}/>
    : active==='announcements'
    ? <AnnouncementsModule device={device} onOpenEvent={openEvent} onOpenLibrary={openLibrary}/>
    : active==='admin'
    ? <AdminModule device={device}/>
    : active==='settings'
    ? <SettingsModule device={device} isAdmin onRestartTour={()=>startTour('admin')}/>
    : <EmptyTab id={active} device={device}/>;
  const common = { active, onNav:setActive, bell, setBell, notifs, setNotifs };
  const shell = device==='mobile'
    ? <MobileShell {...common}>{content}</MobileShell>
    : <DesktopShell {...common} pageTitle={LABELS[active]}>{content}</DesktopShell>;
  return (
    <>
      {shell}
      {tourSteps && <GuidedTour steps={tourSteps} device={device} onClose={()=>setTourSteps(null)}/>}
    </>
  );
}

function FrameLabel({n, title, sub}){
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
      <div style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1rem',color:'var(--a-steel)',width:30,height:30,borderRadius:8,background:'#fff',display:'grid',placeItems:'center',boxShadow:'var(--shadow-sm)'}}>{n}</div>
      <div>
        <div style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.25rem',color:'var(--navy)'}}>{title}</div>
        <div style={{color:'var(--a-slate)',fontSize:'.86rem'}}>{sub}</div>
      </div>
    </div>
  );
}

function SurveyShowcase(){
  const [notifs,setNotifs] = useState(()=>NOTIFS.map(n=>({...n})));
  const [bell,setBell] = useState(false);
  const ev = EVENTS_FULL.find(x=>x.surveyAssigned);
  return (
    <MobileShell active="events" onNav={()=>{}} bell={bell} setBell={setBell} notifs={notifs} setNotifs={setNotifs}>
      <EventsModule device="mobile" initialView="survey" initialEvent={ev}/>
    </MobileShell>
  );
}

function Studio(){
  return (
    <div className="ac-root" style={{minHeight:'100vh',background:'var(--bg-alt)',padding:'40px 24px 80px'}}>
      <div style={{maxWidth:1240,margin:'0 auto'}}>
        {/* header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap',marginBottom:8}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <Falcon variant="navy" size={40}/>
            <div>
              <div className="eyebrow">Member Portal · Session 6</div>
              <h1 style={{fontSize:'1.9rem',color:'var(--navy)'}}>Admin & Onboarding</h1>
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <a className="btn btn-ghost btn-sm" href="Design System.html">View design system</a>
            <a className="btn btn-primary btn-sm" href="index.html">Public site</a>
          </div>
        </div>
        <p style={{color:'var(--a-slate)',maxWidth:730,marginBottom:36}}>The admin workspace and first-run onboarding. The <strong>Admin tab</strong> (in the nav rail) holds the overview, <strong>role management</strong> with the last-super-admin self-demote guard, <strong>event approval + points assignment</strong>, the <strong>survey configurator</strong> with a live sample-size calculator and a friendly explainer, and the <strong>audit log</strong>. The <strong>guided tour</strong> runs as coachmarks — a member variant and an admin variant — retriggerable from <strong>Settings</strong>. All interactive: open the Admin tab, try toggling your own last super-admin role (blocked), approve an event, drag the survey sliders, or replay the tour from Settings.</p>

        {/* desktop admin */}
        <FrameLabel n="01" title="Desktop — Admin workspace" sub="Overview · roles · approval · surveys · audit log"/>
        <div className="thin-scroll" style={{overflowX:'auto',paddingBottom:12,marginBottom:56}}>
          <div style={{minWidth:1180,margin:'0 auto',width:'fit-content'}}>
            <ChromeWindow width={1180} height={800} url="portal.ateneocode.org/admin" tabs={[{title:"CODE · Admin"}]}>
              <PortalInstance device="desktop" start="admin"/>
            </ChromeWindow>
          </div>
        </div>

        {/* desktop survey config */}
        <FrameLabel n="02" title="Desktop — Survey configuration" sub="Live sample size · confidence & margin · friendly explainer"/>
        <div className="thin-scroll" style={{overflowX:'auto',paddingBottom:12,marginBottom:56}}>
          <div style={{minWidth:1180,margin:'0 auto',width:'fit-content'}}>
            <ChromeWindow width={1180} height={800} url="portal.ateneocode.org/admin/surveys" tabs={[{title:"CODE · Surveys"}]}>
              <PortalInstance device="desktop" start="admin"/>
            </ChromeWindow>
          </div>
        </div>

        {/* desktop guided tour (admin) */}
        <FrameLabel n="03" title="Desktop — Guided tour (admin variant)" sub="Coachmark overlay · spotlight + tooltip · auto-runs on load"/>
        <div className="thin-scroll" style={{overflowX:'auto',paddingBottom:12,marginBottom:56}}>
          <div style={{minWidth:1180,margin:'0 auto',width:'fit-content'}}>
            <ChromeWindow width={1180} height={800} url="portal.ateneocode.org/?tour=admin" tabs={[{title:"CODE · Welcome"}]}>
              <PortalInstance device="desktop" start="admin" tour="admin"/>
            </ChromeWindow>
          </div>
        </div>

        {/* mobile trio */}
        <FrameLabel n="04" title="Mobile" sub="Member guided tour · Admin workspace · Settings"/>
        <div style={{display:'flex',gap:32,flexWrap:'wrap',justifyContent:'center'}}>
          <IOSDevice dark width={384} height={832}><PortalInstance device="mobile" start="dashboard" tour="member"/></IOSDevice>
          <IOSDevice dark width={384} height={832}><PortalInstance device="mobile" start="admin"/></IOSDevice>
          <IOSDevice dark width={384} height={832}><PortalInstance device="mobile" start="settings"/></IOSDevice>
        </div>
      </div>
    </div>
  );
}

function mountStudio(){
  if(window.__studioMounted) return; window.__studioMounted=true;
  ReactDOM.createRoot(document.getElementById('root')).render(<Studio/>);
}
(function(){
  const faces = ['700 1rem "Unna"','italic 400 1rem "Unna"','400 1rem "Source Sans 3"','600 1rem "Source Sans 3"','700 1rem "Source Sans 3"'];
  if(document.fonts && document.fonts.load){
    Promise.all(faces.map(f=>document.fonts.load(f).catch(()=>{}))).then(()=>document.fonts.ready).catch(()=>{}).then(mountStudio);
  } else mountStudio();
  setTimeout(mountStudio, 2500);
})();
