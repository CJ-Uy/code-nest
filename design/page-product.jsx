// ===== Product Center: card, list, article detail =====
function ArticleCard({a, go, compact}){
  return (
    <article className="reveal art-card" onClick={()=>go('article',{id:a.id})}
      style={{background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--radius)', overflow:'hidden', cursor:'pointer', transition:'.2s ease', display:'flex', flexDirection:'column'}}>
      <Placeholder tone="pale" rounded={false} label={"Article cover — "+a.title} h={compact?150:178} />
      <div style={{padding:'22px 22px 24px', display:'flex', flexDirection:'column', flex:1}}>
        <div style={{display:'flex', gap:10, alignItems:'center', color:'var(--text-3)', fontSize:'.82rem', fontWeight:600}}>
          <span style={{color:'var(--accent)', textTransform:'uppercase', letterSpacing:'.08em'}}>{a.cat}</span>
          <span>·</span><span>{a.read}</span>
        </div>
        <h3 style={{fontSize:'1.4rem', marginTop:12}}>{a.title}</h3>
        <p style={{marginTop:10, color:'var(--text-2)', fontSize:'.98rem', flex:1}}>{a.dek}</p>
        <div style={{display:'flex', alignItems:'center', gap:8, marginTop:18, color:'var(--accent-strong)', fontWeight:600, fontSize:'.92rem'}}>
          Read article <Ic.arrow style={{transition:'.2s'}} className="card-arrow"/>
        </div>
      </div>
    </article>
  );
}

function ProductCenter({go}){
  const ref = useReveal();
  const [cat,setCat] = useState("All");
  const [q,setQ] = useState("");
  const list = ARTICLES.filter(a=>(cat==="All"||a.cat===cat) && (a.title+a.dek+a.cat).toLowerCase().includes(q.toLowerCase()));
  return (
    <div ref={ref}>
      <header style={{background:'var(--navy)', color:'#fff', position:'relative', overflow:'hidden'}}>
        <img src="assets/falcon-white-t.png" alt="" aria-hidden="true" style={{position:'absolute', right:'-4%', top:'-30%', height:'180%', opacity:.06}}/>
        <div className="wrap" style={{position:'relative', padding:'clamp(54px,8vw,96px) 28px clamp(40px,6vw,64px)'}}>
          <div className="eyebrow in" style={{color:'var(--mid)'}}>Product Center</div>
          <h1 style={{fontSize:'clamp(2.4rem,5.5vw,4rem)', color:'#fff', marginTop:18, maxWidth:760}}>Organization Development, <span className="serif-i" style={{color:'var(--mid)'}}>made digestible.</span></h1>
          <p className="lead" style={{color:'#C6D4E6', marginTop:20, maxWidth:620}}>Digestible, contextualized OD content for public use — written by CODE consultants for youth who want to learn OD as a stepping point toward nation-building.</p>
        </div>
      </header>

      <div className="wrap" style={{padding:'clamp(28px,4vw,40px) 28px clamp(56px,8vw,96px)'}}>
        {/* filter bar */}
        <div className="reveal" style={{display:'flex', justifyContent:'space-between', gap:18, flexWrap:'wrap', alignItems:'center', marginBottom:34, position:'sticky', top:0}}>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            {ARTICLE_CATS.map(c=>(
              <button key={c} onClick={()=>setCat(c)} className="btn btn-sm"
                style={cat===c?{background:'var(--navy)',color:'#fff'}:{background:'var(--surface)',color:'var(--text-2)',boxShadow:'inset 0 0 0 1px var(--line)'}}>{c}</button>
            ))}
          </div>
          <label style={{display:'flex', alignItems:'center', gap:10, background:'var(--surface)', border:'1px solid var(--line)', borderRadius:999, padding:'.55em 1em', minWidth:220, color:'var(--text-3)'}}>
            <Ic.search/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search articles" style={{border:'none', outline:'none', background:'transparent', color:'var(--text)', width:'100%'}}/>
          </label>
        </div>

        {list.length===0 ? (
          <EmptyState icon={<Ic.search/>} title="No articles match yet" body="Try a different category or search term."/>
        ) : (
          <div className="teaser-grid" style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'clamp(16px,2.5vw,26px)'}}>
            {list.map(a=> <ArticleCard key={a.id} a={a} go={go} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({icon, title, body, action}){
  return (
    <div className="reveal" style={{textAlign:'center', padding:'clamp(48px,8vw,90px) 20px', border:'1.5px dashed var(--line)', borderRadius:'var(--radius-lg)', background:'var(--surface-2)'}}>
      <div style={{fontSize:'1.8rem', color:'var(--mid)', display:'grid', placeItems:'center', width:64, height:64, margin:'0 auto 18px', background:'var(--pale-tint)', borderRadius:'50%'}}>{icon}</div>
      <h3 style={{fontSize:'1.4rem'}}>{title}</h3>
      <p style={{color:'var(--text-2)', marginTop:10, maxWidth:380, marginInline:'auto'}}>{body}</p>
      {action}
    </div>
  );
}

function Article({id, go}){
  const ref = useReveal();
  const a = ARTICLES.find(x=>x.id===id) || ARTICLES[0];
  const others = ARTICLES.filter(x=>x.id!==a.id).slice(0,2);
  useEffect(()=>{ window.scrollTo(0,0); },[id]);
  return (
    <div ref={ref}>
      {/* article header */}
      <header style={{background:'var(--bg-alt)', borderBottom:'1px solid var(--line)'}}>
        <div className="wrap" style={{maxWidth:820, padding:'clamp(34px,5vw,54px) 28px clamp(30px,4vw,44px)'}}>
          <button className="btn btn-sm btn-ghost" onClick={()=>go('product')} style={{marginBottom:24}}>← Product Center</button>
          <div style={{display:'flex', gap:10, alignItems:'center', color:'var(--text-3)', fontSize:'.86rem', fontWeight:600, marginBottom:16}}>
            <span style={{color:'var(--accent)', textTransform:'uppercase', letterSpacing:'.08em'}}>{a.cat}</span>
            <span>·</span><span style={{display:'inline-flex',alignItems:'center',gap:5}}><Ic.clock/> {a.read}</span>
          </div>
          <h1 style={{fontSize:'clamp(2.1rem,5vw,3.4rem)', maxWidth:760}}>{a.title}</h1>
          <p className="lead" style={{marginTop:18, fontSize:'1.22rem'}}>{a.dek}</p>
          <div style={{display:'flex', alignItems:'center', gap:12, marginTop:26, color:'var(--text-2)', fontSize:'.95rem'}}>
            <Falcon variant="navy" size={34}/>
            <div><strong style={{color:'var(--text)'}}>{a.author}</strong><div style={{color:'var(--text-3)'}}>{a.date}</div></div>
          </div>
        </div>
      </header>

      <article className="wrap article-body" style={{maxWidth:820, padding:'clamp(40px,6vw,64px) 28px clamp(56px,8vw,90px)'}}>
        {/* abstract lead */}
        <p className="reveal" style={{fontFamily:'var(--serif)', fontSize:'clamp(1.3rem,2.4vw,1.7rem)', lineHeight:1.5, color:'var(--text)', borderLeft:'3px solid var(--accent)', paddingLeft:24}}>
          {a.abstract}
        </p>

        {/* framework sections */}
        {a.sections.map((s,i)=>(
          <section key={i} className="reveal" style={{marginTop:'clamp(40px,5vw,56px)'}}>
            <h2 style={{fontSize:'clamp(1.5rem,2.8vw,2rem)'}}>{s.h}</h2>
            <p style={{marginTop:14, fontSize:'1.12rem', color:'var(--text-2)', lineHeight:1.7}}>{s.body}</p>
            <figure style={{margin:'28px 0 0'}}>
              <Placeholder tone="pale" label={s.figure} ratio="16/9"/>
              <figcaption style={{marginTop:10, color:'var(--text-3)', fontSize:'.86rem', fontStyle:'italic', fontFamily:'var(--serif)'}}>{s.figure}</figcaption>
            </figure>
          </section>
        ))}

        {/* component breakdown */}
        <section className="reveal" style={{marginTop:'clamp(44px,6vw,64px)'}}>
          <h2 style={{fontSize:'clamp(1.5rem,2.8vw,2rem)'}}>{a.components.title}</h2>
          <div style={{display:'grid', gap:14, marginTop:24}}>
            {a.components.items.map((it,i)=>(
              <div key={i} style={{display:'grid', gridTemplateColumns:'auto 1fr', gap:'18px 20px', background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--radius)', padding:'22px 24px'}}>
                <div style={{fontFamily:'var(--serif)', fontWeight:700, fontSize:'1.3rem', color:'var(--mid)', minWidth:36}}>{String(i+1).padStart(2,'0')}</div>
                <div>
                  <h3 style={{fontSize:'1.22rem'}}>{it.name}</h3>
                  <p style={{marginTop:6, color:'var(--text-2)'}}>{it.def}</p>
                  <p style={{marginTop:10, color:'var(--text-3)', fontSize:'.92rem'}}><strong style={{color:'var(--accent-strong)', fontWeight:600}}>Example · </strong><span className="serif-i" style={{fontStyle:'italic'}}>{it.ex}</span></p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* guide questions callout */}
        <section className="reveal" style={{marginTop:'clamp(44px,6vw,64px)', background:'var(--navy)', color:'#fff', borderRadius:'var(--radius-lg)', padding:'clamp(28px,4vw,44px)'}}>
          <div className="eyebrow" style={{color:'var(--mid)', marginBottom:18}}>Guide questions</div>
          <ol style={{listStyle:'none', margin:0, padding:0, counterReset:'gq', display:'grid', gap:18}}>
            {a.questions.map((qq,i)=>(
              <li key={i} style={{display:'grid', gridTemplateColumns:'auto 1fr', gap:18, alignItems:'baseline'}}>
                <span style={{fontFamily:'var(--serif)', fontWeight:700, fontSize:'1.5rem', color:'var(--mid)', lineHeight:1}}>{String(i+1).padStart(2,'0')}</span>
                <span style={{fontFamily:'var(--serif)', fontSize:'1.2rem', lineHeight:1.5, color:'#EAF0F8'}}>{qq}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* learn more */}
        <section className="reveal" style={{marginTop:'clamp(40px,5vw,56px)'}}>
          <h2 style={{fontSize:'1.4rem'}}>Learn more</h2>
          <ul style={{listStyle:'none', margin:'18px 0 0', padding:0, display:'grid', gap:12}}>
            {a.refs.map((r,i)=>(
              <li key={i} style={{display:'flex', gap:12, color:'var(--text-2)', fontSize:'.98rem', paddingBottom:12, borderBottom:'1px solid var(--line-soft)'}}>
                <Ic.doc style={{color:'var(--mid)', flexShrink:0, marginTop:3}}/> <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* feedback form */}
        <FeedbackForm/>
      </article>

      {/* related */}
      <section style={{background:'var(--bg-alt)', borderTop:'1px solid var(--line)'}}>
        <div className="wrap" style={{padding:'clamp(48px,7vw,80px) 28px'}}>
          <SectionHead eyebrow="Keep reading" title="More from the Product Center"/>
          <div className="teaser-grid" style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'clamp(16px,2.5vw,26px)', marginTop:36}}>
            {others.map(o=> <ArticleCard key={o.id} a={o} go={go}/>)}
          </div>
        </div>
      </section>
    </div>
  );
}

function FeedbackForm(){
  const [sent,setSent] = useState(false);
  const [rating,setRating] = useState(0);
  return (
    <section className="reveal" style={{marginTop:'clamp(44px,6vw,64px)', border:'1px solid var(--line)', borderRadius:'var(--radius-lg)', background:'var(--surface)', padding:'clamp(26px,4vw,40px)'}}>
      {sent ? (
        <div style={{textAlign:'center', padding:'12px 0'}}>
          <div style={{width:56,height:56,borderRadius:'50%',background:'var(--pale-tint)',color:'var(--accent-strong)',display:'grid',placeItems:'center',margin:'0 auto 16px',fontSize:'1.6rem'}}><Ic.check/></div>
          <h3 style={{fontSize:'1.4rem'}}>Salamat for the feedback!</h3>
          <p style={{color:'var(--text-2)', marginTop:8}}>Your response helps our consultants write better OD content.</p>
        </div>
      ) : (
      <div>
        <div className="eyebrow" style={{marginBottom:12}}>Feedback form</div>
        <h3 style={{fontSize:'1.5rem'}}>Was this article helpful?</h3>
        <p style={{color:'var(--text-2)', marginTop:8}}>We embed a short form on every piece so readers can shape what we publish next.</p>
        <div style={{display:'flex', gap:8, margin:'20px 0'}}>
          {[1,2,3,4,5].map(n=>(
            <button key={n} onClick={()=>setRating(n)} aria-label={n+" stars"}
              style={{width:44,height:44,borderRadius:10,fontSize:'1.2rem',background:n<=rating?'var(--navy)':'var(--surface-2)',color:n<=rating?'#fff':'var(--text-3)',boxShadow:n<=rating?'none':'inset 0 0 0 1px var(--line)',transition:'.15s'}}>★</button>
          ))}
        </div>
        <textarea placeholder="What stood out — or what could be clearer?" rows={3} style={{width:'100%', border:'1px solid var(--line)', borderRadius:'var(--radius-sm)', padding:'14px 16px', resize:'vertical', background:'var(--surface-2)', color:'var(--text)', outline:'none'}}></textarea>
        <button className="btn btn-primary" style={{marginTop:16}} onClick={()=>setSent(true)}>Submit feedback <Ic.arrow/></button>
      </div>
      )}
    </section>
  );
}

Object.assign(window, { ArticleCard, ProductCenter, Article, EmptyState, FeedbackForm });
