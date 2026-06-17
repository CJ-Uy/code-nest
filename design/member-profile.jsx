// ===== Profile — mine (editable) + others (read-only) =====
const RET_KIND = { "Retained":"ok", "At-Risk":"warn", "On Probation":"danger" };

function ProfileModule({device}){
  const [viewId,setViewId] = useState("bea");
  const member = MEMBERS.find(m=>m.id===viewId) || MY_PROFILE;
  return (
    <div style={{maxWidth:820}}>
      {/* demo: whose profile */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18,flexWrap:'wrap'}}>
        <span style={{fontSize:'.82rem',color:'var(--text-3)',fontWeight:600}}>Viewing</span>
        <div style={{display:'inline-flex',gap:3,background:'var(--surface-2)',borderRadius:10,padding:4,flexWrap:'wrap'}}>
          {MEMBERS.map(m=>(
            <button key={m.id} onClick={()=>setViewId(m.id)} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'6px 12px',borderRadius:8,fontWeight:600,fontSize:'.84rem',color:viewId===m.id?'#fff':'var(--text-2)',background:viewId===m.id?'var(--navy)':'transparent'}}>
              <Avatar name={m.name} size={20} tone={m.you?'navy':'steel'}/>{m.you?'My profile':m.nick}
            </button>
          ))}
        </div>
      </div>
      {member.you ? <MyProfile device={device} key={member.id}/> : <OtherProfile member={member} device={device} key={member.id}/>}
    </div>
  );
}

function ProfileHeader({member, device, editable, onEditPhoto}){
  return (
    <div className="card" style={{padding:0,overflow:'hidden'}}>
      <div style={{height:device==='mobile'?80:104,background:'linear-gradient(120deg,var(--navy),var(--navy-deep))',position:'relative'}}>
        <img src="assets/falcon-white-t.png" alt="" style={{position:'absolute',right:10,top:-12,height:120,opacity:.08}}/>
      </div>
      <div style={{padding:device==='mobile'?'0 18px 18px':'0 26px 22px',marginTop:device==='mobile'?-40:-48}}>
        <div style={{display:'flex',alignItems:'flex-end',gap:16,flexWrap:'wrap'}}>
          <div style={{position:'relative'}}>
            <div style={{width:device==='mobile'?80:96,height:device==='mobile'?80:96,borderRadius:'50%',border:'4px solid var(--surface)',background:'var(--surface)'}}>
              <Avatar name={member.name} size={device==='mobile'?72:88} tone={member.you?'navy':'steel'}/>
            </div>
            {editable && <button onClick={onEditPhoto} style={{position:'absolute',right:0,bottom:4,width:30,height:30,borderRadius:'50%',background:'var(--navy)',color:'#fff',display:'grid',placeItems:'center',border:'2px solid var(--surface)'}} aria-label="Change photo"><CameraIcon/></button>}
          </div>
          <div style={{flex:1,minWidth:0,paddingBottom:6}}>
            <div style={{display:'flex',alignItems:'center',gap:9,flexWrap:'wrap'}}>
              <h2 style={{fontSize:device==='mobile'?'1.5rem':'1.8rem'}}>{member.name}</h2>
              <span style={{color:'var(--text-3)',fontSize:'.9rem'}}>· {member.pronouns}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4,flexWrap:'wrap',color:'var(--text-2)',fontSize:'.9rem'}}>
              <span style={{fontWeight:600}}>@{member.nick}</span><span>·</span><span>{member.batch}</span><span>·</span><span>{member.dept}</span>
            </div>
            <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap'}}>
              {member.roles.map(r=><Badge key={r} kind={r==='Super Admin'?'danger':r.includes('Admin')?'info':'neutral'}>{r}</Badge>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function CameraIcon(){ return <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.2"/></svg>; }

function RetentionStrip({r}){
  const pct = Math.min(100,Math.round(r.points/r.threshold*100));
  const k = RET_KIND[r.status];
  return (
    <div className="card" style={{padding:'18px 20px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:12,flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{width:10,height:10,borderRadius:'50%',background:`var(--${k})`}}></span>
          <span style={{fontWeight:700,color:'var(--text)',fontSize:'1.05rem'}}>{r.status}</span>
          <Badge kind="neutral">{r.tier}</Badge>
        </div>
        <span style={{color:'var(--text-2)',fontSize:'.9rem'}}><strong style={{color:'var(--text)'}}>{r.points}</strong> / {r.threshold} pts</span>
      </div>
      <div style={{height:8,borderRadius:999,background:'var(--surface-2)',overflow:'hidden'}}>
        <div style={{width:pct+'%',height:'100%',borderRadius:999,background:k==='ok'?'linear-gradient(90deg,var(--ok),#3da888)':k==='warn'?'linear-gradient(90deg,var(--warn),#d2a050)':'linear-gradient(90deg,var(--danger),#d06a6a)'}}></div>
      </div>
    </div>
  );
}

function StatsRow({stats}){
  const items=[["events","Events"],["points","Points"],["articles","Articles read"],["links","Links"]];
  return (
    <div className="card" style={{padding:'16px 20px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
      {items.map(([k,l])=>(
        <div key={k} style={{textAlign:'center'}}>
          <div style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.5rem',color:'var(--text)',lineHeight:1}}>{stats[k]}</div>
          <div style={{color:'var(--text-3)',fontSize:'.74rem',marginTop:4}}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function InfoCard({member}){
  return (
    <div className="card" style={{padding:'18px 20px'}}>
      <h3 style={{fontSize:'1.1rem',marginBottom:12}}>About</h3>
      <p style={{color:'var(--text-2)',lineHeight:1.6}}>{member.bio}</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:7,marginTop:14}}>
        {member.fields.map(f=><span key={f} style={{fontSize:'.78rem',fontWeight:600,color:'var(--accent-strong)',background:'var(--surface-2)',padding:'5px 11px',borderRadius:999}}>{f}</span>)}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:18,paddingTop:16,borderTop:'1px solid var(--line-soft)'}}>
        <Row icon={<I.mail/>} label={member.email}/>
        <Row icon={<I.clock/>} label={member.joined}/>
      </div>
    </div>
  );
}
function Row({icon,label}){ return <div style={{display:'flex',alignItems:'center',gap:10,color:'var(--text-2)',fontSize:'.9rem'}}><span style={{color:'var(--mid)'}}>{icon}</span>{label}</div>; }

// ---- read-only other ----
function OtherProfile({member, device}){
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <ProfileHeader member={member} device={device} editable={false}/>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <button className="btn btn-primary btn-sm"><I.mail size={'1em'}/> Message</button>
        <button className="btn btn-ghost btn-sm">View activity</button>
      </div>
      <RetentionStrip r={member.retention}/>
      <StatsRow stats={member.stats}/>
      <InfoCard member={member}/>
    </div>
  );
}

// ---- editable mine ----
function MyProfile({device}){
  const [editing,setEditing] = useState(false);
  const [form,setForm] = useState({ nick:MY_PROFILE.nick, pronouns:MY_PROFILE.pronouns, batch:MY_PROFILE.batch, dept:MY_PROFILE.dept, bio:MY_PROFILE.bio });
  const member = { ...MY_PROFILE, ...form };
  if(editing){
    return (
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div className="card" style={{padding:device==='mobile'?'20px 18px':'24px 26px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
            <h2 style={{fontSize:'1.4rem'}}>Edit profile</h2>
            <button onClick={()=>setEditing(false)} style={{color:'var(--text-3)',padding:6}}><I.x/></button>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
            <Avatar name={MY_PROFILE.name} size={64} tone="navy"/>
            <button className="btn btn-ghost btn-sm"><CameraIcon/> Change photo</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:device==='mobile'?'1fr':'1fr 1fr',gap:16}}>
            <PField label="Nickname"><input className="inp" value={form.nick} onChange={e=>setForm(f=>({...f,nick:e.target.value}))}/></PField>
            <PField label="Pronouns">
              <select className="inp" value={form.pronouns} onChange={e=>setForm(f=>({...f,pronouns:e.target.value}))}>
                {["she/her","he/him","they/them","she/they","he/they","prefer not to say"].map(p=><option key={p}>{p}</option>)}
              </select>
            </PField>
            <PField label="Batch"><input className="inp" value={form.batch} onChange={e=>setForm(f=>({...f,batch:e.target.value}))}/></PField>
            <PField label="Team / Department"><input className="inp" value={form.dept} onChange={e=>setForm(f=>({...f,dept:e.target.value}))}/></PField>
            <PField label="About" full><textarea className="inp" rows={3} value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))}></textarea></PField>
          </div>
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <button className="btn btn-primary" onClick={()=>setEditing(false)}>Save changes</button>
            <button className="btn btn-ghost" onClick={()=>setEditing(false)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <ProfileHeader member={member} device={device} editable onEditPhoto={()=>setEditing(true)}/>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <button className="btn btn-primary btn-sm" onClick={()=>setEditing(true)}><I.doc size={'1em'}/> Edit profile</button>
        <button className="btn btn-ghost btn-sm">Share profile</button>
      </div>
      <RetentionStrip r={member.retention}/>
      <StatsRow stats={member.stats}/>
      <InfoCard member={member}/>
    </div>
  );
}
function PField({label,children,full}){ return <label style={{display:'block',gridColumn:full?'1/-1':'auto'}}><span style={{display:'block',fontWeight:600,fontSize:'.85rem',color:'var(--text-2)',marginBottom:7}}>{label}</span>{children}</label>; }

Object.assign(window, { ProfileModule, MyProfile, OtherProfile, ProfileHeader, RetentionStrip, StatsRow });
