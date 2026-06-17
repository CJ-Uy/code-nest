// ===== Services + Projects =====
function Services({go}){
  const ref = useReveal();
  return (
    <div ref={ref}>
      <PageHero eyebrow="Our Services" title={<>Tailor-fit OD, <span className="serif-i" style={{color:'var(--mid)'}}>never generalized.</span></>} sub={SERVICES_INTRO}/>
      <div className="wrap" style={{padding:'clamp(48px,7vw,84px) 28px'}}>
        <div style={{display:'grid', gap:'clamp(20px,3vw,32px)'}}>
          {SERVICES.map((s,i)=>(
            <article key={s.id} className="reveal svc-row" style={{display:'grid', gridTemplateColumns:'minmax(0,1.15fr) minmax(0,1fr)', gap:'clamp(24px,5vw,64px)', alignItems:'center', background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--radius-lg)', padding:'clamp(28px,4vw,48px)', direction:i%2?'rtl':'ltr'}}>
              <div style={{direction:'ltr'}}>
                <Tag>{s.tag}</Tag>
                <h2 style={{fontSize:'clamp(1.7rem,3.4vw,2.5rem)', marginTop:16}}>{s.title}</h2>
                <p className="lead" style={{marginTop:16}}>{s.summary}</p>
                <div style={{display:'flex', alignItems:'center', gap:8, marginTop:18, color:'var(--text-3)', fontSize:'.9rem', fontWeight:600}}>
                  <Ic.clock style={{color:'var(--mid)'}}/> {s.meta}
                </div>
                <ul style={{listStyle:'none', margin:'22px 0 0', padding:0, display:'grid', gap:10}}>
                  {s.points.map(p=>(
                    <li key={p} style={{display:'flex', gap:11, alignItems:'baseline', color:'var(--text-2)'}}>
                      <span style={{color:'var(--accent)', flexShrink:0}}><Ic.check/></span>{p}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{direction:'ltr'}}>
                <Placeholder tone="pale" label={"Photo — "+s.title.toLowerCase()+" in session"} ratio="5/4"/>
              </div>
            </article>
          ))}
        </div>
      </div>
      <ProcessBand/>
      <CtaBand go={go}/>
    </div>
  );
}

function ProcessBand(){
  const steps=[["Listen","We do heavy research into each client's specific context."],["Tailor","We design an engagement unique to that reality — not a template."],["Develop","We train, restructure, or advise toward lasting change."],["Sustain","We leave the org healthier and more conducive to flourishing."]];
  return (
    <section style={{background:'var(--bg-alt)'}}>
      <div className="wrap" style={{padding:'clamp(52px,8vw,90px) 28px'}}>
        <SectionHead eyebrow="How an engagement works" title="Research-led, end to end"/>
        <div className="proc-grid" style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'clamp(16px,2.5vw,28px)', marginTop:40}}>
          {steps.map((s,i)=>(
            <div key={s[0]} className="reveal" style={{position:'relative'}}>
              <div style={{fontFamily:'var(--serif)', fontWeight:700, fontSize:'1rem', color:'var(--mid)', letterSpacing:'.1em'}}>{String(i+1).padStart(2,'0')}</div>
              <div style={{width:34,height:3,background:'var(--accent)',borderRadius:2,margin:'12px 0 14px'}}></div>
              <h3 style={{fontSize:'1.3rem'}}>{s[0]}</h3>
              <p style={{marginTop:8, color:'var(--text-2)', fontSize:'.98rem'}}>{s[1]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Projects({go}){
  const ref = useReveal();
  return (
    <div ref={ref}>
      <PageHero eyebrow="Our Projects" title={<>Where OD meets <span className="serif-i" style={{color:'var(--mid)'}}>the youth sector.</span></>} sub="Two flagship programs carry CODE's advocacy beyond our clients — to student leaders across the Philippines."/>
      <div className="wrap" style={{padding:'clamp(48px,7vw,84px) 28px', display:'grid', gap:'clamp(28px,5vw,56px)'}}>
        {PROJECTS.map((p,i)=>(
          <article key={p.id} className="reveal" id={p.id} style={{scrollMarginTop:90}}>
            <div className="proj-row" style={{display:'grid', gridTemplateColumns:i%2?'1fr 1.05fr':'1.05fr 1fr', gap:'clamp(24px,5vw,56px)', alignItems:'center'}}>
              <div style={{order:i%2?2:1}}>
                <div style={{display:'flex', alignItems:'center', gap:14, marginBottom:18}}>
                  <div style={{width:54,height:54,borderRadius:14,background:'var(--navy)',color:'#fff',display:'grid',placeItems:'center',fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.3rem'}}>{p.short}</div>
                  <Tag>{p.kicker}</Tag>
                </div>
                <h2 style={{fontSize:'clamp(2rem,4vw,3rem)'}}>{p.name}</h2>
                <p className="serif-i" style={{fontStyle:'italic', color:'var(--accent-strong)', fontSize:'1.1rem', marginTop:12}}>{p.theme}</p>
                <p className="lead" style={{marginTop:18}}>{p.summary}</p>
                <ul style={{listStyle:'none', margin:'22px 0 0', padding:0, display:'grid', gap:12}}>
                  {p.goals.map(g=>(
                    <li key={g} style={{display:'flex', gap:12, alignItems:'baseline', color:'var(--text-2)'}}>
                      <span style={{width:7,height:7,borderRadius:'50%',background:'var(--accent)',flexShrink:0,marginTop:8}}></span>{g}
                    </li>
                  ))}
                </ul>
                <div style={{display:'flex', gap:'clamp(24px,4vw,48px)', marginTop:28}}>
                  {p.stat.map(st=>(
                    <div key={st.k}>
                      <div style={{fontFamily:'var(--serif)', fontWeight:700, fontSize:'1.9rem', color:'var(--navy)', lineHeight:1}}>{st.k}</div>
                      <div style={{color:'var(--text-3)', fontSize:'.9rem', marginTop:5}}>{st.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{order:i%2?1:2}}>
                <Placeholder tone={i%2?"navy":"pale"} label={"Gallery — "+p.name+" highlights"} ratio="4/5"/>
              </div>
            </div>
          </article>
        ))}
      </div>
      <CtaBand go={go}/>
    </div>
  );
}

// shared page hero (light)
function PageHero({eyebrow, title, sub}){
  return (
    <header style={{background:'var(--navy)', color:'#fff', position:'relative', overflow:'hidden'}}>
      <img src="assets/falcon-white-t.png" alt="" aria-hidden="true" style={{position:'absolute', right:'-4%', top:'-26%', height:'170%', opacity:.06}}/>
      <div aria-hidden="true" style={{position:'absolute', inset:0, background:'radial-gradient(110% 80% at 10% 0%, rgba(73,134,172,.22), transparent 55%)'}}></div>
      <div className="wrap" style={{position:'relative', padding:'clamp(54px,8vw,96px) 28px clamp(44px,6vw,72px)'}}>
        <div className="eyebrow in" style={{color:'var(--mid)'}}>{eyebrow}</div>
        <h1 style={{fontSize:'clamp(2.4rem,5.5vw,4rem)', color:'#fff', marginTop:18, maxWidth:820}}>{title}</h1>
        {sub && <p className="lead" style={{color:'#C6D4E6', marginTop:20, maxWidth:640}}>{sub}</p>}
      </div>
    </header>
  );
}

Object.assign(window, { Services, Projects, ProcessBand, PageHero });
