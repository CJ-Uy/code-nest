// ===== Contact + Sign in =====
function Contact({go}){
  const ref = useReveal();
  const [sent,setSent] = useState(false);
  return (
    <div ref={ref}>
      <PageHero eyebrow="Contact Us" title={<>Let's talk about <span className="serif-i" style={{color:'var(--mid)'}}>your organization.</span></>} sub="Reach the right representative for your context, or send us a note — we read everything."/>
      <div className="wrap" style={{padding:'clamp(48px,7vw,84px) 28px'}}>
        <div className="contact-grid" style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1.1fr)', gap:'clamp(28px,5vw,64px)', alignItems:'start'}}>
          {/* left: reps + channels */}
          <div className="reveal">
            <h2 style={{fontSize:'1.6rem'}}>Representatives</h2>
            <p style={{color:'var(--text-2)', marginTop:8}}>Choose by where your organization sits.</p>
            <div style={{display:'grid', gap:12, marginTop:22}}>
              {CONTACTS.map(c=>(
                <a key={c.role} href={"mailto:"+c.email} style={{display:'block', background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--radius)', padding:'20px 22px', transition:'.18s'}} className="contact-card">
                  <div style={{display:'flex', justifyContent:'space-between', gap:12, alignItems:'flex-start'}}>
                    <h3 style={{fontSize:'1.2rem'}}>{c.role}</h3>
                    <span style={{color:'var(--mid)', flexShrink:0, marginTop:2}}><Ic.mail/></span>
                  </div>
                  <p style={{color:'var(--text-3)', fontSize:'.92rem', marginTop:10}}>{c.scope}</p>
                  <p style={{color:'var(--accent-strong)', fontWeight:600, fontSize:'.92rem', marginTop:10}}>{c.email}</p>
                </a>
              ))}
            </div>

            <div style={{display:'flex', gap:12, marginTop:22, flexWrap:'wrap'}}>
              <a className="btn btn-ghost btn-sm" href={"mailto:"+ORG.email}><Ic.mail/> {ORG.email}</a>
              <a className="btn btn-ghost btn-sm" href={ORG.fbUrl} target="_blank" rel="noreferrer"><Ic.fb/> {ORG.fb}</a>
            </div>

            {/* location + map slot */}
            <div style={{marginTop:30}}>
              <h2 style={{fontSize:'1.6rem'}}>Find us</h2>
              <div style={{display:'flex', gap:12, marginTop:14, alignItems:'flex-start', color:'var(--text-2)'}}>
                <span style={{color:'var(--mid)', marginTop:2}}><Ic.pin/></span>
                <div><strong style={{color:'var(--text)'}}>{ORG.room}</strong><br/>{ORG.campus}</div>
              </div>
              <div style={{marginTop:16}}>
                <Placeholder tone="pale" label="Map — MVP Center for Student Leadership, ADMU" ratio="16/9"/>
              </div>
            </div>
          </div>

          {/* right: form */}
          <div className="reveal" style={{background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--radius-lg)', padding:'clamp(26px,4vw,40px)', boxShadow:'var(--shadow-sm)'}}>
            {sent ? (
              <div style={{textAlign:'center', padding:'30px 0'}}>
                <div style={{width:60,height:60,borderRadius:'50%',background:'var(--pale-tint)',color:'var(--accent-strong)',display:'grid',placeItems:'center',margin:'0 auto 18px',fontSize:'1.7rem'}}><Ic.check/></div>
                <h3 style={{fontSize:'1.5rem'}}>Message sent</h3>
                <p style={{color:'var(--text-2)', marginTop:10, maxWidth:340, marginInline:'auto'}}>A representative will reach out to learn more about your organization's context.</p>
                <button className="btn btn-ghost" style={{marginTop:22}} onClick={()=>setSent(false)}>Send another</button>
              </div>
            ) : (
              <div>
                <h2 style={{fontSize:'1.7rem'}}>Send us a note</h2>
                <p style={{color:'var(--text-2)', marginTop:8, marginBottom:22}}>Tell us a little about your org and what you're hoping to develop.</p>
                <div style={{display:'grid', gap:16}}>
                  <Field label="Your name"><input className="inp" placeholder="Juan dela Cruz"/></Field>
                  <Field label="Organization"><input className="inp" placeholder="e.g. a student council, a youth NGO"/></Field>
                  <Field label="Email"><input className="inp" type="email" placeholder="you@example.com"/></Field>
                  <Field label="Where does your org sit?">
                    <select className="inp">
                      <option>Within the Loyola Schools</option>
                      <option>Outside the Loyola Schools</option>
                      <option>Not sure yet</option>
                    </select>
                  </Field>
                  <Field label="What are you hoping to develop?"><textarea className="inp" rows={4} placeholder="A short description of your context"></textarea></Field>
                </div>
                <button className="btn btn-primary btn-lg" style={{marginTop:22, width:'100%', justifyContent:'center'}} onClick={()=>setSent(true)}>Send message <Ic.arrow/></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({label, children}){
  return (
    <label style={{display:'block'}}>
      <span style={{display:'block', fontWeight:600, fontSize:'.88rem', color:'var(--text-2)', marginBottom:7}}>{label}</span>
      {children}
    </label>
  );
}

// ---- discreet sign-in ----
function SignIn({go}){
  return (
    <div style={{minHeight:'calc(100vh - 0px)', display:'grid', gridTemplateColumns:'1fr', background:'var(--navy)', color:'#fff', position:'relative', overflow:'hidden'}}>
      <img src="assets/falcon-white-t.png" alt="" aria-hidden="true" style={{position:'absolute', left:'-12%', bottom:'-22%', height:'150%', opacity:.05}}/>
      <div aria-hidden="true" style={{position:'absolute', inset:0, background:'radial-gradient(90% 70% at 80% 10%, rgba(73,134,172,.22), transparent 55%)'}}></div>
      <div style={{position:'relative', display:'grid', placeItems:'center', padding:'40px 24px'}}>
        <div style={{width:'100%', maxWidth:400}}>
          <div style={{display:'flex', alignItems:'center', gap:14, justifyContent:'center', marginBottom:30}}>
            <Falcon variant="white" size={48}/>
          </div>
          <div style={{background:'rgba(255,255,255,.04)', border:'1px solid var(--on-chrome-line)', borderRadius:'var(--radius-lg)', padding:'34px 30px', backdropFilter:'blur(8px)'}}>
            <div className="eyebrow" style={{color:'var(--mid)', marginBottom:10, display:'flex', alignItems:'center', gap:8}}><Ic.lock/> Member access</div>
            <h1 style={{fontSize:'1.9rem', color:'#fff'}}>Welcome back</h1>
            <p style={{color:'var(--chrome-text-dim)', marginTop:8, fontSize:'.95rem'}}>Sign in with your Ateneo Google account to enter the member portal.</p>
            <button onClick={()=>{ window.location.href = 'Member Portal.html'; }}
              style={{display:'flex', alignItems:'center', justifyContent:'center', gap:12, width:'100%', marginTop:24, background:'#fff', color:'#1f2937', fontFamily:'var(--sans)', fontWeight:600, fontSize:'1rem', padding:'13px 16px', borderRadius:'12px', boxShadow:'var(--shadow-md)', transition:'.16s'}}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'} onMouseLeave={e=>e.currentTarget.style.transform='none'}>
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.8 6c1.9-5.6 7.1-9.8 13.7-9.8z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-3.9 6.8-9.7 6.8-17.4z"/><path fill="#FBBC05" d="M10.3 28.3c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.8-6C.9 16.2 0 20 0 24s.9 7.8 2.5 11l7.8-6.7z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.7 2.3-8.6 2.3-6.6 0-12.2-4.2-14.1-9.9l-7.8 6C6.4 42.6 14.6 48 24 48z"/></svg>
              Continue with Google
            </button>
            <div style={{display:'flex', alignItems:'center', gap:12, margin:'18px 0', color:'var(--chrome-text-dim)', fontSize:'.78rem'}}>
              <div style={{flex:1, height:1, background:'var(--on-chrome-line)'}}></div>DEMO<div style={{flex:1, height:1, background:'var(--on-chrome-line)'}}></div>
            </div>
            <p style={{textAlign:'center', fontSize:'.84rem', color:'var(--chrome-text-dim)'}}>For this prototype, signing in takes you straight to the member dashboard.</p>
          </div>
          <button onClick={()=>go('landing')} style={{display:'block', margin:'24px auto 0', color:'var(--mid)', fontWeight:600, fontSize:'.92rem'}}>← Back to the public site</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Contact, Field, SignIn });
