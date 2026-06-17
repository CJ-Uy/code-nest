// ===== Landing page =====
function Hero({go}){
  return (
    <header style={{position:'relative', background:'var(--navy)', color:'#fff', overflow:'hidden'}}>
      {/* falcon at scale */}
      <img src="assets/falcon-white-t.png" alt="" aria-hidden="true"
        style={{position:'absolute', right:'-6%', top:'50%', transform:'translateY(-50%)', height:'128%', opacity:.07, pointerEvents:'none', filter:'saturate(0)'}} />
      <div aria-hidden="true" style={{position:'absolute', inset:0, background:'radial-gradient(120% 90% at 12% 0%, rgba(73,134,172,.28), transparent 55%)'}}></div>
      <div className="wrap" style={{position:'relative', padding:'clamp(64px,11vw,128px) 28px clamp(72px,11vw,120px)'}}>
        <div style={{maxWidth:820}}>
          <div className="eyebrow reveal in" style={{color:'var(--mid)', display:'flex', gap:14, alignItems:'center', flexWrap:'wrap'}}>
            <span>Youth-led · Non-profit · Jesuit-formed</span>
          </div>
          <h1 className="reveal in" style={{fontSize:'clamp(2.3rem,5.2vw,4.2rem)', lineHeight:1.13, marginTop:22, color:'#fff', letterSpacing:'.3px'}}>
            Organization Development<br/>
            <span className="serif-i" style={{color:'var(--mid)', fontWeight:400}}>for the youth who'll build the nation.</span>
          </h1>
          <p className="lead reveal in" style={{color:'#C6D4E6', marginTop:34, maxWidth:600, fontSize:'1.2rem'}}>
            {ORG.blurb}
          </p>
          <div className="reveal in" style={{display:'flex', gap:14, flexWrap:'wrap', marginTop:38}}>
            <button className="btn btn-lg" style={{background:'#fff', color:'var(--navy)'}} onClick={()=>go('services')}>
              Explore our services <Ic.arrow/>
            </button>
            <button className="btn btn-lg btn-on-chrome" onClick={()=>go('product')}>
              Read the Product Center
            </button>
          </div>
          <div className="reveal in" style={{display:'flex', gap:'clamp(24px,5vw,64px)', marginTop:56, flexWrap:'wrap'}}>
            {[["160+","partner organizations"],["30+","universities & non-profits"],["8th","year of XChange"]].map(([k,v])=>(
              <div key={v}>
                <div style={{fontFamily:'var(--serif)', fontWeight:700, fontSize:'2.4rem', lineHeight:1, color:'#fff'}}>{k}</div>
                <div style={{color:'var(--chrome-text-dim)', fontSize:'.92rem', marginTop:6, maxWidth:150}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{height:1, background:'var(--on-chrome-line)'}}></div>
    </header>
  );
}

function IntroStrip(){
  return (
    <section className="wrap" style={{padding:'clamp(56px,8vw,90px) 28px'}}>
      <div className="reveal" style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1.3fr)', gap:'clamp(28px,6vw,80px)', alignItems:'start'}}>
        <div>
          <div className="eyebrow" style={{marginBottom:14}}>Who we are</div>
          <h2 style={{fontSize:'clamp(1.7rem,3.4vw,2.5rem)'}}>Consultants in action — real people, real change.</h2>
        </div>
        <div>
          <p className="lead" style={{fontSize:'1.3rem', color:'var(--text)'}}>
            We conduct <em className="serif-i">contextualized</em> OD services — tailor-fit to each client's reality — through short-term engagements, long-term partnerships, and consultancy teams.
          </p>
          <p style={{marginTop:18, color:'var(--text-2)', fontSize:'1.06rem'}}>
            Imbued with Ignatian values, we form the youth and youth-oriented organizations who will initiate positive change within the community.
          </p>
        </div>
      </div>
    </section>
  );
}

function VisionMission(){
  return (
    <section style={{background:'var(--bg-alt)'}}>
      <div className="wrap" style={{padding:'clamp(56px,8vw,96px) 28px'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(20px,4vw,40px)'}} className="vm-grid">
          {[["Vision",VISION],["Mission",MISSION]].map(([t,body],i)=>(
            <article key={t} className="reveal" style={{background:'var(--surface)', borderRadius:'var(--radius-lg)', padding:'clamp(28px,4vw,46px)', boxShadow:'var(--shadow-sm)', border:'1px solid var(--line-soft)', position:'relative', overflow:'hidden'}}>
              <Ic.quote style={{position:'absolute', top:24, right:26, fontSize:'2.6rem', color:'var(--pale-tint)'}}/>
              <div className="eyebrow" style={{marginBottom:18}}>{t}</div>
              <p style={{fontFamily:'var(--serif)', fontSize:'clamp(1.18rem,2vw,1.5rem)', lineHeight:1.5, color:'var(--text)'}}>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Competencies(){
  return (
    <section className="wrap" style={{padding:'clamp(56px,8vw,96px) 28px'}}>
      <SectionHead eyebrow="What grounds us" title="Three core competencies" sub="Everything we do as consultants traces back to these." />
      <div className="comp-grid" style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'clamp(16px,2.5vw,26px)', marginTop:44}}>
        {COMPETENCIES.map(c=>(
          <article key={c.n} className="reveal" style={{background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--radius)', padding:'30px 28px 32px', position:'relative'}}>
            <div style={{fontFamily:'var(--serif)', fontWeight:700, fontSize:'1.05rem', color:'var(--mid)', letterSpacing:'.1em'}}>{c.n}</div>
            <div style={{width:38, height:3, background:'var(--accent)', borderRadius:2, margin:'16px 0 18px'}}></div>
            <h3 style={{fontSize:'1.5rem'}}>{c.title}</h3>
            <p style={{marginTop:12, color:'var(--text-2)', fontSize:'1.02rem'}}>{c.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function WhatIsOD({go}){
  return (
    <section style={{background:'var(--navy)', color:'#fff', position:'relative', overflow:'hidden'}}>
      <div className="wrap" style={{padding:'clamp(60px,9vw,110px) 28px'}}>
        <div className="od-grid" style={{display:'grid', gridTemplateColumns:'1.1fr 1fr', gap:'clamp(28px,5vw,72px)', alignItems:'center'}}>
          <div className="reveal">
            <div className="eyebrow" style={{color:'var(--mid)', marginBottom:16}}>The discipline behind it all</div>
            <h2 style={{fontSize:'clamp(2rem,4.4vw,3.3rem)', color:'#fff'}}>What is Organization Development?</h2>
            <p className="lead" style={{color:'#C6D4E6', marginTop:24, fontSize:'1.18rem'}}>{WHAT_IS_OD}</p>
            <button className="btn btn-lg" style={{background:'#fff', color:'var(--navy)', marginTop:30}} onClick={()=>go('services')}>See how we apply it <Ic.arrow/></button>
          </div>
          <div className="reveal">
            <Placeholder tone="deep" label="Figure — the planned-change cycle: diagnose → intervene → reinforce" ratio="4/3" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductTeaser({go}){
  return (
    <section className="wrap" style={{padding:'clamp(56px,8vw,96px) 28px'}}>
      <div className="reveal" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:24, flexWrap:'wrap'}}>
        <SectionHead eyebrow="Product Center" title="OD, made digestible" sub="Contextualized OD content written by CODE consultants — free, for the youth, as a stepping point toward nation-building." />
        <button className="btn btn-ghost" onClick={()=>go('product')}>View all articles <Ic.arrow/></button>
      </div>
      <div className="teaser-grid" style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'clamp(16px,2.5vw,26px)', marginTop:44}}>
        {ARTICLES.slice(0,3).map(a=>(
          <ArticleCard key={a.id} a={a} go={go} />
        ))}
      </div>
    </section>
  );
}

function CtaBand({go}){
  return (
    <section style={{background:'var(--bg-alt)'}}>
      <div className="wrap" style={{padding:'clamp(56px,8vw,90px) 28px'}}>
        <div className="reveal" style={{background:'var(--navy)', borderRadius:'var(--radius-lg)', padding:'clamp(34px,6vw,68px)', position:'relative', overflow:'hidden'}}>
          <img src="assets/falcon-white-t.png" alt="" aria-hidden="true" style={{position:'absolute', right:'-2%', bottom:'-30%', height:'200%', opacity:.06}}/>
          <div style={{position:'relative', maxWidth:620}}>
            <h2 style={{color:'#fff', fontSize:'clamp(1.8rem,3.8vw,2.8rem)'}}>Have an organization you want to develop?</h2>
            <p className="lead" style={{color:'#C6D4E6', marginTop:18}}>Tell us your context. We'll tailor-fit an engagement — no generalized programs, ever.</p>
            <button className="btn btn-lg" style={{background:'#fff', color:'var(--navy)', marginTop:28}} onClick={()=>go('contact')}>Get in touch <Ic.arrow/></button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Landing({go}){
  const ref = useReveal();
  return (
    <div ref={ref}>
      <Hero go={go}/>
      <IntroStrip/>
      <VisionMission/>
      <Competencies/>
      <WhatIsOD go={go}/>
      <ProductTeaser go={go}/>
      <CtaBand go={go}/>
    </div>
  );
}

Object.assign(window, { Landing });
