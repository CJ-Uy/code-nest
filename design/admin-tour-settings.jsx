// ===== Guided tour (coachmarks) + Settings =====
const TOUR_MEMBER = [
  { sel:'[data-tour="nav-dashboard"]', title:"This is your dashboard", body:"Announcements, upcoming events, your retention status, and notifications all live here.", place:"right" },
  { sel:'[data-tour="nav-library"]', title:"The Content Library", body:"The members-only superset of the public Product Center — including confidential case studies.", place:"right" },
  { sel:'[data-tour="nav-events"]', title:"Events & attendance", body:"RSVP, scan to check in, and track your retention points across the term.", place:"right" },
  { sel:'[data-tour="bell"]', title:"Notifications", body:"Your bell shows unread updates. We\u2019ll nudge you when you\u2019re selected for a survey, too.", place:"bottom" },
  { sel:'[data-tour="avatar"]', title:"You\u2019re all set!", body:"Edit your profile and restart this tour anytime from Settings. Welcome to CODE!", place:"bottom" },
];
const TOUR_ADMIN = [
  { sel:'[data-tour="nav-admin"]', title:"Admin tools live here", body:"As an admin, you get an extra workspace for roles, approvals, surveys, and the audit log.", place:"right" },
  { sel:'[data-tour="admin-roles"]', title:"Manage roles", body:"Grant granular admin roles. A member can hold several — permissions combine. Super-admin changes are logged.", place:"bottom" },
  { sel:'[data-tour="bell"]', title:"Stay in the loop", body:"Approval requests and admin mentions surface in your notifications.", place:"bottom" },
  { sel:'[data-tour="avatar"]', title:"That\u2019s the tour!", body:"Every admin action is recorded in the audit log. Restart this tour anytime from Settings.", place:"bottom" },
];

function GuidedTour({steps, onClose, device}){
  const [i,setI] = useState(0);
  const [rect,setRect] = useState(null);
  const step = steps[i];
  useEffect(()=>{
    const find = ()=>{
      const el = document.querySelector(step.sel);
      if(el){ const r=el.getBoundingClientRect(); const root=el.closest('.ac-root'); const rr=root?root.getBoundingClientRect():{left:0,top:0};
        setRect({left:r.left-rr.left, top:r.top-rr.top, width:r.width, height:r.height}); }
      else setRect(null);
    };
    find();
    const t=setTimeout(find,60);
    return ()=>clearTimeout(t);
  },[i,step.sel]);

  const last = i===steps.length-1;
  const pad=6;
  // tooltip position
  let tip={};
  if(rect){
    if(step.place==='right' && device!=='mobile'){ tip={left:rect.left+rect.width+14, top:Math.max(12,rect.top)}; }
    else { tip={left:Math.max(12,Math.min(rect.left, 9999)), top:rect.top+rect.height+14}; }
  }
  return (
    <div style={{position:'absolute',inset:0,zIndex:140,animation:'fadein .2s'}}>
      {/* dim with spotlight hole via box-shadow */}
      {rect ? (
        <div style={{position:'absolute',left:rect.left-pad,top:rect.top-pad,width:rect.width+pad*2,height:rect.height+pad*2,borderRadius:12,boxShadow:'0 0 0 9999px rgba(6,25,47,.62)',border:'2px solid var(--mid)',transition:'.25s cubic-bezier(.2,.8,.2,1)',pointerEvents:'none'}}></div>
      ) : (
        <div style={{position:'absolute',inset:0,background:'rgba(6,25,47,.62)'}}></div>
      )}
      {/* click-catcher */}
      <div onClick={onClose} style={{position:'absolute',inset:0}}></div>
      {/* tooltip */}
      <div style={{position:'absolute',width:device==='mobile'?260:300,maxWidth:'calc(100% - 24px)',...(rect?tip:{left:'50%',top:'50%',transform:'translate(-50%,-50%)'})}}>
        <div className="card" style={{padding:'18px 18px 16px',boxShadow:'var(--shadow-lg)',border:'1px solid var(--mid)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:9}}>
            <Falcon variant="navy" size={22}/>
            <span style={{fontSize:'.74rem',fontWeight:700,color:'var(--text-3)',letterSpacing:'.04em'}}>STEP {i+1} OF {steps.length}</span>
            <button onClick={onClose} style={{marginLeft:'auto',color:'var(--text-3)',padding:2}}><I.x size={'.95em'}/></button>
          </div>
          <h3 style={{fontSize:'1.2rem'}}>{step.title}</h3>
          <p style={{color:'var(--text-2)',fontSize:'.92rem',marginTop:7,lineHeight:1.5}}>{step.body}</p>
          <div style={{display:'flex',alignItems:'center',gap:8,marginTop:16}}>
            <div style={{display:'flex',gap:5,flex:1}}>
              {steps.map((_,k)=><span key={k} style={{width:k===i?18:6,height:6,borderRadius:999,background:k===i?'var(--accent)':'var(--line)',transition:'.2s'}}></span>)}
            </div>
            {i>0 && <button className="btn btn-ghost btn-sm" onClick={()=>setI(i-1)}>Back</button>}
            <button className="btn btn-primary btn-sm" onClick={()=> last?onClose():setI(i+1)}>{last?'Finish':'Next'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Settings ----
function SettingsModule({device, onRestartTour, isAdmin}){
  const [theme,setTheme] = useState('light');
  const [toggles,setToggles] = useState({ email:true, push:true, survey:true, digest:false });
  const tg=(k)=>setToggles(t=>({...t,[k]:!t[k]}));
  return (
    <div style={{maxWidth:680}}>
      <h2 style={{fontSize:'1.6rem',marginBottom:18}}>Settings</h2>

      <SettingsCard title="Appearance">
        <Line label="Theme" hint="Light is the default; dark is easier at night.">
          <div style={{display:'inline-flex',gap:3,background:'var(--surface-2)',borderRadius:9,padding:3}}>
            {[['light','Light'],['dark','Dark'],['system','System']].map(([id,l])=>(
              <button key={id} onClick={()=>setTheme(id)} style={{padding:'6px 12px',borderRadius:7,fontWeight:600,fontSize:'.82rem',color:theme===id?'#fff':'var(--text-2)',background:theme===id?'var(--navy)':'transparent'}}>{l}</button>
            ))}
          </div>
        </Line>
      </SettingsCard>

      <SettingsCard title="Notifications">
        <ToggleLine label="Email updates" hint="Announcements and approvals" on={toggles.email} onClick={()=>tg('email')}/>
        <ToggleLine label="Push notifications" hint="On this device" on={toggles.push} onClick={()=>tg('push')}/>
        <ToggleLine label="Survey invitations" hint="When you\u2019re selected for a post-event survey" on={toggles.survey} onClick={()=>tg('survey')}/>
        <ToggleLine label="Weekly digest" hint="A Monday summary of activity" on={toggles.digest} onClick={()=>tg('digest')} last/>
      </SettingsCard>

      <SettingsCard title="Getting started">
        <Line label="Guided tour" hint={isAdmin?"Replay the walkthrough (member + admin tips).":"Replay the walkthrough of the portal."}>
          <button className="btn btn-ghost btn-sm" data-tour="restart" onClick={onRestartTour}><I.spark/> Restart tour</button>
        </Line>
      </SettingsCard>

      <SettingsCard title="Account">
        <Line label="Email" hint="bea.mendoza@code.org"><Badge kind="ok"><I.check size={'.85em'}/> Google connected</Badge></Line>
        <div style={{borderTop:'1px solid var(--line-soft)',marginTop:14,paddingTop:14}}>
          <button onClick={()=>{ if(window.__signout) window.__signout(); }} className="btn btn-ghost btn-sm" style={{color:'var(--danger)',boxShadow:'inset 0 0 0 1.5px color-mix(in srgb,var(--danger) 35%,transparent)'}}><I.logout/> Sign out</button>
        </div>
      </SettingsCard>
    </div>
  );
}
function SettingsCard({title, children}){
  return <div className="card" style={{padding:'18px 20px',marginBottom:14}}><h3 style={{fontSize:'1.05rem',marginBottom:14}}>{title}</h3>{children}</div>;
}
function Line({label, hint, children}){
  return (
    <div style={{display:'flex',alignItems:'center',gap:14,justifyContent:'space-between',padding:'6px 0'}}>
      <div style={{minWidth:0}}><div style={{fontWeight:600,color:'var(--text)',fontSize:'.94rem'}}>{label}</div>{hint && <div style={{color:'var(--text-3)',fontSize:'.82rem',marginTop:1}}>{hint}</div>}</div>
      {children}
    </div>
  );
}
function ToggleLine({label, hint, on, onClick, last}){
  return (
    <div style={{display:'flex',alignItems:'center',gap:14,justifyContent:'space-between',padding:'10px 0',borderBottom:last?'none':'1px solid var(--line-soft)'}}>
      <div><div style={{fontWeight:600,color:'var(--text)',fontSize:'.94rem'}}>{label}</div>{hint && <div style={{color:'var(--text-3)',fontSize:'.82rem',marginTop:1}}>{hint}</div>}</div>
      <Toggle on={on} onClick={onClick}/>
    </div>
  );
}

Object.assign(window, { TOUR_MEMBER, TOUR_ADMIN, GuidedTour, SettingsModule });
