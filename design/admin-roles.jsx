// ===== Admin — role management (+ last-super-admin guard) =====
function roleLabel(id){ return (ROLE_DEFS.find(r=>r.id===id)||{}).label||id; }
function countSupers(members){ return members.filter(m=>m.roles.includes('super')).length; }

function RoleManagement({device}){
  const [members,setMembers] = useState(()=>ADMIN_MEMBERS.map(m=>({...m,roles:[...m.roles]})));
  const [editing,setEditing] = useState(null); // member id
  const [confirm,setConfirm] = useState(null); // {member, role, adding}
  const supers = countSupers(members);

  const apply = (mid, role, adding)=>{
    setMembers(ms=>ms.map(m=>m.id===mid?{...m,roles:adding?[...m.roles,role]:m.roles.filter(r=>r!==role)}:m));
  };
  const onToggle = (member, role)=>{
    const has = member.roles.includes(role);
    // guard: last super admin cannot self-demote
    if(role==='super' && has && member.id===ADMIN_ME.id && supers<=1){ return; }
    // confirm for super-admin changes
    if(role==='super'){ setConfirm({member, role, adding:!has}); return; }
    apply(member.id, role, !has);
  };

  const editMember = members.find(m=>m.id===editing);

  return (
    <div style={{maxWidth:880}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:6}}>
        <div><h2 style={{fontSize:'1.6rem'}}>Role management</h2><p style={{color:'var(--text-3)',fontSize:'.9rem',marginTop:2}}>Assign granular admin roles. A member can hold several — permissions are the union.</p></div>
        <Badge kind="neutral"><I.lock size={'.85em'}/> {supers} super admin{supers!==1?'s':''}</Badge>
      </div>

      {/* role legend */}
      <div style={{display:'grid',gridTemplateColumns:device==='mobile'?'1fr':'1fr 1fr',gap:10,margin:'18px 0 22px'}}>
        {ROLE_DEFS.map(r=>(
          <div key={r.id} style={{display:'flex',gap:10,padding:'12px 14px',background:'var(--surface-2)',borderRadius:11,border:'1px solid var(--line-soft)'}}>
            <span style={{width:8,height:8,borderRadius:3,marginTop:6,flexShrink:0,background:r.kind==='danger'?'var(--danger)':'var(--a-steel)'}}></span>
            <div><div style={{fontWeight:700,fontSize:'.9rem',color:'var(--text)'}}>{r.label}</div><div style={{color:'var(--text-3)',fontSize:'.8rem',marginTop:1}}>{r.desc}</div></div>
          </div>
        ))}
      </div>

      {/* members table */}
      <div className="card" style={{overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid var(--line)',background:'var(--surface-2)'}}>
          <span style={{fontWeight:600,fontSize:'.78rem',textTransform:'uppercase',letterSpacing:'.05em',color:'var(--text-3)',flex:1}}>Member</span>
          <span style={{fontWeight:600,fontSize:'.78rem',textTransform:'uppercase',letterSpacing:'.05em',color:'var(--text-3)'}}>Roles</span>
        </div>
        {members.map((m,i)=>(
          <div key={m.id} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',borderTop:i?'1px solid var(--line-soft)':'none'}}>
            <Avatar name={m.name} size={36} tone={m.roles.includes('super')?'navy':'steel'}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:7}}><span style={{fontWeight:600,color:'var(--text)'}}>{m.name}</span>{m.id===ADMIN_ME.id && <Badge kind="info">You</Badge>}</div>
              <div style={{color:'var(--text-3)',fontSize:'.82rem'}}>{m.batch}</div>
            </div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap',justifyContent:'flex-end',maxWidth:device==='mobile'?160:340}}>
              {m.roles.length===0 ? <span style={{color:'var(--text-3)',fontSize:'.84rem'}}>Member</span>
                : m.roles.map(r=><Badge key={r} kind={r==='super'?'danger':'neutral'}>{device==='mobile'?roleLabel(r).split(' ')[0]:roleLabel(r)}</Badge>)}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(m.id)}>Edit</button>
          </div>
        ))}
      </div>

      {/* edit drawer */}
      {editMember && (
        <Modal onClose={()=>setEditing(null)} title={`Roles · ${editMember.name}`}>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {ROLE_DEFS.map(r=>{
              const has = editMember.roles.includes(r.id);
              const isLastSuperSelf = r.id==='super' && has && editMember.id===ADMIN_ME.id && supers<=1;
              return (
                <div key={r.id} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'12px 14px',borderRadius:11,background:has?'var(--info-bg)':'var(--surface-2)',border:'1px solid '+(has?'color-mix(in srgb,var(--accent) 30%,transparent)':'var(--line-soft)'),opacity:isLastSuperSelf?.85:1}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontWeight:700,fontSize:'.92rem',color:'var(--text)'}}>{r.label}</span>{r.id==='super' && <Badge kind="danger">Elevated</Badge>}</div>
                    <div style={{color:'var(--text-3)',fontSize:'.82rem',marginTop:2}}>{r.desc}</div>
                    {isLastSuperSelf && (
                      <div style={{display:'flex',gap:8,alignItems:'flex-start',marginTop:10,padding:'9px 11px',background:'var(--warn-bg)',borderRadius:9,color:'var(--warn)'}}>
                        <I.lock size={'1em'} style={{marginTop:2,flexShrink:0}}/>
                        <span style={{fontSize:'.8rem',fontWeight:600,lineHeight:1.4}}>You\u2019re the last super admin — you can\u2019t remove your own super-admin role. Promote someone else first.</span>
                      </div>
                    )}
                  </div>
                  <Toggle on={has} onClick={()=> isLastSuperSelf ? null : onToggle(editMember, r.id)} disabled={isLastSuperSelf}/>
                </div>
              );
            })}
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',marginTop:18}}>
            <button className="btn btn-primary" onClick={()=>setEditing(null)}>Done</button>
          </div>
        </Modal>
      )}

      {/* super-admin confirm */}
      {confirm && (
        <Modal onClose={()=>setConfirm(null)} title={confirm.adding?"Grant super admin?":"Remove super admin?"}>
          <p style={{color:'var(--text-2)'}}>
            {confirm.adding
              ? <>This gives <strong>{confirm.member.name}</strong> the full set of permissions, including the ability to manage other super admins.</>
              : <>This revokes all super-admin permissions for <strong>{confirm.member.name}</strong>.</>}
          </p>
          <div style={{display:'flex',alignItems:'center',gap:8,marginTop:14,color:'var(--text-3)',fontSize:'.84rem'}}><I.doc size={'1em'}/> This action is recorded in the audit log.</div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
            <button className="btn btn-ghost" onClick={()=>setConfirm(null)}>Cancel</button>
            <button className={"btn "+(confirm.adding?'btn-primary':'btn-danger')} onClick={()=>{apply(confirm.member.id,confirm.role,confirm.adding); setConfirm(null);}}>{confirm.adding?'Grant super admin':'Remove access'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// shared modal
function Modal({children, onClose, title, wide}){
  return (
    <div onClick={onClose} style={{position:'absolute',inset:0,zIndex:95,background:'rgba(6,25,47,.45)',display:'grid',placeItems:'center',padding:20,animation:'fadein .18s'}}>
      <div onClick={e=>e.stopPropagation()} className="card thin-scroll" style={{maxWidth:wide?620:480,width:'100%',maxHeight:'86%',overflowY:'auto',boxShadow:'var(--shadow-lg)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:'18px 20px 14px',borderBottom:'1px solid var(--line)',position:'sticky',top:0,background:'var(--surface)'}}>
          <h3 style={{fontSize:'1.25rem'}}>{title}</h3>
          <button onClick={onClose} style={{color:'var(--text-3)',padding:6}}><I.x/></button>
        </div>
        <div style={{padding:'18px 20px 20px'}}>{children}</div>
      </div>
    </div>
  );
}

Object.assign(window, { RoleManagement, Modal, roleLabel, countSupers });
