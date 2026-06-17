// ===== Admin — survey configuration (live sample size + friendly explainer) =====
// Cochran's formula with finite population correction.
function zForConfidence(c){ return ({0.80:1.282,0.85:1.440,0.90:1.645,0.95:1.960,0.99:2.576})[c] || 1.96; }
function sampleSize(N, confidence, marginPct){
  const z = zForConfidence(confidence);
  const e = marginPct/100;
  const p = 0.5;
  const n0 = (z*z*p*(1-p))/(e*e);
  const n = n0 / (1 + (n0-1)/N);
  return Math.min(N, Math.ceil(n));
}

function SurveyConfig({device}){
  const [population,setPopulation] = useState(72);
  const [confidence,setConfidence] = useState(0.95);
  const [margin,setMargin] = useState(8);
  const [showHelp,setShowHelp] = useState(false);

  const n = sampleSize(population, confidence, margin);
  const everyone = n >= population || population <= 20;
  const pct = Math.round(n/population*100);

  return (
    <div style={{maxWidth:880}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:18}}>
        <div><h2 style={{fontSize:'1.6rem'}}>Survey configuration</h2><p style={{color:'var(--text-3)',fontSize:'.9rem',marginTop:2}}>Pick how confident you want to be. We\u2019ll compute how many people to ask.</p></div>
        <button className="btn btn-ghost btn-sm" onClick={()=>setShowHelp(h=>!h)}><HelpIcon/> What is this?</button>
      </div>

      {/* friendly explainer */}
      {showHelp && <SamplingExplainer onClose={()=>setShowHelp(false)}/>}

      <div style={{display:'grid',gridTemplateColumns:device==='mobile'?'1fr':'1.1fr 1fr',gap:18}}>
        {/* inputs */}
        <div className="card" style={{padding:'20px 22px'}}>
          <h3 style={{fontSize:'1.1rem',marginBottom:16}}>Inputs</h3>
          <SliderField label="Population" hint="People who attended" value={population} min={5} max={300} step={1} onChange={setPopulation} suffix="attendees"/>
          <div style={{marginTop:18}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span style={{fontWeight:600,fontSize:'.88rem',color:'var(--text-2)'}}>Confidence level</span><span style={{fontWeight:700,color:'var(--accent-strong)'}}>{Math.round(confidence*100)}%</span></div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {[0.80,0.85,0.90,0.95,0.99].map(c=>(
                <button key={c} onClick={()=>setConfidence(c)} style={{flex:1,minWidth:54,padding:'8px 0',borderRadius:9,fontWeight:600,fontSize:'.86rem',color:confidence===c?'#fff':'var(--text-2)',background:confidence===c?'var(--navy)':'var(--surface-2)',boxShadow:confidence===c?'none':'inset 0 0 0 1px var(--line)'}}>{Math.round(c*100)}%</button>
              ))}
            </div>
            <p style={{color:'var(--text-3)',fontSize:'.78rem',marginTop:8}}>How sure you want to be that the sample reflects everyone.</p>
          </div>
          <div style={{marginTop:18}}>
            <SliderField label="Margin of error" hint="How much wiggle room" value={margin} min={3} max={15} step={1} onChange={setMargin} suffix="±%"/>
            <p style={{color:'var(--text-3)',fontSize:'.78rem',marginTop:8}}>Smaller margin = more precise = more people to ask.</p>
          </div>
        </div>

        {/* live result */}
        <div className="card" style={{padding:'22px',background:'linear-gradient(135deg,var(--navy),var(--navy-deep))',color:'#fff',position:'relative',overflow:'hidden',display:'flex',flexDirection:'column'}}>
          <img src="assets/falcon-white-t.png" alt="" style={{position:'absolute',right:-16,bottom:-30,height:160,opacity:.06}}/>
          <div className="eyebrow" style={{color:'var(--mid)'}}>Ask this many</div>
          {everyone ? (
            <>
              <div style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'2.6rem',lineHeight:1.05,marginTop:10}}>Everyone</div>
              <div style={{color:'var(--mid)',marginTop:6,fontSize:'.95rem'}}>All {population} attendees</div>
              <p style={{color:'#C6D4E6',fontSize:'.88rem',marginTop:14,lineHeight:1.5}}>This group is small enough that sampling wouldn\u2019t help — just ask everyone for the most accurate picture.</p>
            </>
          ) : (
            <>
              <div style={{display:'flex',alignItems:'baseline',gap:8,marginTop:10}}>
                <span style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'3.4rem',lineHeight:1}}>{n}</span>
                <span style={{color:'var(--mid)',fontSize:'1.1rem'}}>of {population}</span>
              </div>
              <div style={{color:'var(--mid)',marginTop:6,fontSize:'.95rem'}}>{pct}% of attendees, chosen at random</div>
              <div style={{height:8,borderRadius:999,background:'rgba(255,255,255,.14)',overflow:'hidden',marginTop:16}}>
                <div style={{width:pct+'%',height:'100%',borderRadius:999,background:'linear-gradient(90deg,var(--a-steel),var(--mid))'}}></div>
              </div>
              <p style={{color:'#C6D4E6',fontSize:'.88rem',marginTop:16,lineHeight:1.5}}>Asking <strong style={{color:'#fff'}}>{n}</strong> randomly-picked attendees gives results within <strong style={{color:'#fff'}}>±{margin}%</strong> of what all {population} would say, {Math.round(confidence*100)}% of the time.</p>
            </>
          )}
          <div style={{marginTop:'auto',paddingTop:18}}>
            <button className="btn" style={{background:'#fff',color:'var(--navy)',width:'100%',justifyContent:'center'}}>Save survey configuration</button>
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:10,alignItems:'flex-start',marginTop:16,padding:'13px 16px',background:'var(--info-bg)',borderRadius:'var(--radius)',color:'var(--info)'}}>
        <span style={{marginTop:1}}><HelpIcon/></span>
        <p style={{fontSize:'.88rem',color:'var(--text-2)',lineHeight:1.5}}><strong style={{color:'var(--text)'}}>TLDR:</strong> You don\u2019t need to ask everyone. A handful of randomly-chosen attendees can represent the whole group\u2019s honest opinion — saving people\u2019s time while keeping results trustworthy.</p>
      </div>
    </div>
  );
}

function SliderField({label, hint, value, min, max, step, onChange, suffix}){
  const pct = ((value-min)/(max-min))*100;
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:8}}>
        <span style={{fontWeight:600,fontSize:'.88rem',color:'var(--text-2)'}}>{label} <span style={{color:'var(--text-3)',fontWeight:400}}>· {hint}</span></span>
        <span style={{fontWeight:700,color:'var(--accent-strong)'}}>{value} <span style={{fontWeight:400,fontSize:'.82rem',color:'var(--text-3)'}}>{suffix}</span></span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(parseInt(e.target.value,10))}
        style={{width:'100%',accentColor:'var(--accent)',background:`linear-gradient(90deg,var(--accent) ${pct}%, var(--line) ${pct}%)`,height:6,borderRadius:999,appearance:'none',WebkitAppearance:'none',cursor:'pointer'}}/>
    </div>
  );
}
function HelpIcon(){ return <svg viewBox="0 0 24 24" width="1.05em" height="1.05em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3M12 17h.01"/></svg>; }

function SamplingExplainer({onClose}){
  return (
    <div className="card" style={{padding:0,overflow:'hidden',marginBottom:18,border:'1px solid color-mix(in srgb,var(--accent) 28%,transparent)'}}>
      <div style={{display:'flex',alignItems:'center',gap:11,padding:'15px 18px',background:'var(--info-bg)'}}>
        <span style={{width:36,height:36,borderRadius:10,background:'#fff',color:'var(--accent-strong)',display:'grid',placeItems:'center'}}><HelpIcon/></span>
        <h3 style={{fontSize:'1.1rem',flex:1}}>Why you don\u2019t have to ask everyone</h3>
        <button onClick={onClose} style={{color:'var(--text-3)',padding:6}}><I.x/></button>
      </div>
      <div style={{padding:'18px 20px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16}}>
          {[
            ["1","A taste of the soup","Stir the pot, taste one spoonful — you don\u2019t drink the whole thing to know if it needs salt. A good random sample is that spoonful."],
            ["2","Random keeps it fair","Picking attendees at random means no group is over- or under-represented, so the sample mirrors the room."],
            ["3","Confidence & margin","\u201C95% confident, ±8%\u201D means: if we re-ran this many times, the true answer lands within 8 points of our result 95% of the time."],
          ].map(([n,h,b])=>(
            <div key={n}>
              <div style={{width:30,height:30,borderRadius:9,background:'var(--navy)',color:'#fff',display:'grid',placeItems:'center',fontFamily:'var(--serif)',fontWeight:700,marginBottom:10}}>{n}</div>
              <div style={{fontWeight:700,color:'var(--text)',fontSize:'.95rem'}}>{h}</div>
              <p style={{color:'var(--text-2)',fontSize:'.86rem',marginTop:5,lineHeight:1.5}}>{b}</p>
            </div>
          ))}
        </div>
        <div style={{marginTop:16,paddingTop:14,borderTop:'1px solid var(--line-soft)',color:'var(--text-3)',fontSize:'.82rem'}}>
          For small events we skip sampling entirely and survey everyone — the math only helps once a group is large.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SurveyConfig, sampleSize, SamplingExplainer, SliderField });
