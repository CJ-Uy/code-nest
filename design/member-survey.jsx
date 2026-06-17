// ===== Feedback Survey — structured, sampled, one-time (distinct from the forum) =====
const SURVEY_STEPS = ["Overall","Ratings","Return","Highlights","Open feedback"];
const RATING_ROWS = [
  { id:"content", label:"Content & relevance" },
  { id:"facilitation", label:"Facilitation" },
  { id:"logistics", label:"Logistics & flow" },
  { id:"venue", label:"Venue / platform" },
];
const HIGHLIGHTS = ["Plenary talks","Breakout workshops","Facilitators","Networking","Materials","Food & breaks","Org collaboration","Overall energy"];
const RETURN_OPTS = ["Definitely","Probably","Not sure","Probably not"];

function SurveyBadge(){ return <Badge kind="info"><I.survey size={'.85em'}/> Survey</Badge>; }

// entry card shown on an event when the member is selected
function SurveySelected({onOpen, done}){
  if(done){
    return (
      <div style={{borderRadius:'var(--radius)',border:'1px solid var(--line)',background:'var(--surface)',padding:'16px 18px',display:'flex',gap:14,alignItems:'center'}}>
        <span style={{width:42,height:42,borderRadius:12,background:'var(--ok-bg)',color:'var(--ok)',display:'grid',placeItems:'center',flexShrink:0}}><I.check/></span>
        <div style={{flex:1}}><div style={{fontWeight:700,color:'var(--text)'}}>Survey submitted</div><p style={{color:'var(--text-3)',fontSize:'.86rem',marginTop:2}}>Salamat — your structured feedback is in. This was a one-time ask.</p></div>
      </div>
    );
  }
  return (
    <div style={{borderRadius:'var(--radius)',background:'linear-gradient(135deg, color-mix(in srgb,var(--a-steel) 14%,var(--surface)), var(--surface))',border:'1.5px solid var(--a-steel)',padding:'18px 20px',position:'relative',overflow:'hidden'}}>
      <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
        <span style={{width:46,height:46,borderRadius:13,background:'#fff',color:'var(--a-steel)',display:'grid',placeItems:'center',flexShrink:0,boxShadow:'var(--shadow-sm)',fontSize:'1.2rem'}}><I.survey/></span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}><h3 style={{fontSize:'1.12rem'}}>You were selected for the survey</h3><SurveyBadge/></div>
          <p style={{color:'var(--text-2)',fontSize:'.9rem',marginTop:5}}>A quiet, structured ask sent to a sample of attendees — separate from the open forum. About 3 minutes, confidential, one time only.</p>
          <button className="btn btn-primary btn-sm" style={{marginTop:13,background:'var(--a-slate)'}} onClick={onOpen}>Start survey <I.arrow size={'1em'}/></button>
        </div>
      </div>
    </div>
  );
}

// the structured stepped form
function SurveyForm({event, device, onClose, onDone}){
  const [step,setStep] = useState(0);
  const [overall,setOverall] = useState(0);
  const [ratings,setRatings] = useState({});
  const [ret,setRet] = useState(null);
  const [tags,setTags] = useState([]);
  const [text,setText] = useState("");
  const [done,setDone] = useState(false);
  const e = event || {name:"the event"};
  const N = SURVEY_STEPS.length;
  const toggleTag = (t)=> setTags(x=> x.includes(t)? x.filter(y=>y!==t):[...x,t]);
  const canNext = step===0? overall>0 : step===1? RATING_ROWS.every(r=>ratings[r.id]) : step===2? !!ret : true;

  if(done){
    return (
      <div style={{maxWidth:560,margin:'0 auto'}}>
        <div className="card" style={{padding:device==='mobile'?'32px 24px':'44px 36px',textAlign:'center'}}>
          <div style={{width:64,height:64,borderRadius:18,background:'var(--ok-bg)',color:'var(--ok)',display:'grid',placeItems:'center',margin:'0 auto 18px',fontSize:'1.8rem'}}><I.check/></div>
          <h2 style={{fontSize:'1.7rem'}}>Salamat for your feedback</h2>
          <p style={{color:'var(--text-2)',marginTop:10,maxWidth:380,marginInline:'auto'}}>Your structured responses go straight to the organizing team. Because this is a sampled, one-time survey, you won\u2019t be asked again for this event.</p>
          <button className="btn btn-primary" style={{marginTop:22}} onClick={()=>onDone&&onDone()}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{maxWidth:620,margin:'0 auto'}}>
      {/* distinct survey header */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
        <button className="btn btn-sm btn-ghost" onClick={onClose}>← Exit</button>
        <SurveyBadge/>
        <span style={{color:'var(--text-3)',fontSize:'.84rem',marginLeft:'auto'}}>Step {step+1} of {N}</span>
      </div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        {/* steel header band — visually unlike the forum */}
        <div style={{background:'var(--a-slate)',color:'#fff',padding:device==='mobile'?'18px 20px':'22px 26px'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{width:34,height:34,borderRadius:10,background:'rgba(255,255,255,.15)',display:'grid',placeItems:'center'}}><I.survey/></span>
            <div><div style={{fontWeight:700,fontSize:'1.05rem'}}>Post-event survey</div><div style={{color:'#C6D4E6',fontSize:'.8rem'}}>{e.name}</div></div>
          </div>
          {/* progress */}
          <div style={{display:'flex',gap:5,marginTop:16}}>
            {SURVEY_STEPS.map((s,i)=>(
              <div key={s} style={{flex:1,height:5,borderRadius:999,background:i<=step?'var(--mid)':'rgba(255,255,255,.18)',transition:'.2s'}}></div>
            ))}
          </div>
        </div>

        <div style={{padding:device==='mobile'?'22px 20px':'28px 28px',minHeight:240}}>
          {step===0 && (
            <div>
              <StepTitle n="01" title="How was it overall?" sub="One tap. Be honest — this is anonymous to other members."/>
              <div style={{display:'flex',gap:device==='mobile'?6:10,marginTop:22,justifyContent:'space-between'}}>
                {[1,2,3,4,5].map(n=>{
                  const faces=["\uD83D\uDE1E","\uD83D\uDE15","\uD83D\uDE10","\uD83D\uDE42","\uD83D\uDE0D"];
                  const on=overall===n;
                  return <button key={n} onClick={()=>setOverall(n)} style={{flex:1,padding:device==='mobile'?'12px 0':'16px 0',borderRadius:14,background:on?'var(--a-slate)':'var(--surface-2)',boxShadow:on?'none':'inset 0 0 0 1px var(--line)',transition:'.14s',display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                    <span style={{fontSize:device==='mobile'?'1.5rem':'1.9rem',filter:on?'none':'grayscale(.4)'}}>{faces[n-1]}</span>
                    <span style={{fontSize:'.72rem',fontWeight:600,color:on?'#fff':'var(--text-3)'}}>{n}</span>
                  </button>;
                })}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:10,color:'var(--text-3)',fontSize:'.78rem'}}><span>Not great</span><span>Loved it</span></div>
            </div>
          )}

          {step===1 && (
            <div>
              <StepTitle n="02" title="Rate a few specifics" sub="Tap a score for each — 1 (poor) to 5 (excellent)."/>
              <div style={{display:'flex',flexDirection:'column',gap:14,marginTop:20}}>
                {RATING_ROWS.map(row=>(
                  <div key={row.id} style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                    <span style={{flex:1,minWidth:120,fontWeight:600,color:'var(--text)',fontSize:'.94rem'}}>{row.label}</span>
                    <div style={{display:'flex',gap:6}}>
                      {[1,2,3,4,5].map(n=>{ const on=ratings[row.id]===n; return (
                        <button key={n} onClick={()=>setRatings(r=>({...r,[row.id]:n}))} style={{width:36,height:36,borderRadius:9,fontWeight:700,fontSize:'.9rem',background:on?'var(--a-slate)':'var(--surface-2)',color:on?'#fff':'var(--text-3)',boxShadow:on?'none':'inset 0 0 0 1px var(--line)',transition:'.12s'}}>{n}</button>
                      );})}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step===2 && (
            <div>
              <StepTitle n="03" title="Would you attend again?" sub="Pick the one that fits best."/>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:20}}>
                {RETURN_OPTS.map(o=>{ const on=ret===o; return (
                  <button key={o} onClick={()=>setRet(o)} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderRadius:12,textAlign:'left',background:on?'color-mix(in srgb,var(--a-slate) 10%,var(--surface))':'var(--surface-2)',boxShadow:on?'inset 0 0 0 1.5px var(--a-slate)':'inset 0 0 0 1px var(--line)',transition:'.12s'}}>
                    <span style={{width:20,height:20,borderRadius:'50%',border:'2px solid '+(on?'var(--a-slate)':'var(--line)'),display:'grid',placeItems:'center',flexShrink:0}}>{on&&<span style={{width:10,height:10,borderRadius:'50%',background:'var(--a-slate)'}}></span>}</span>
                    <span style={{fontWeight:600,color:'var(--text)'}}>{o}</span>
                  </button>
                );})}
              </div>
            </div>
          )}

          {step===3 && (
            <div>
              <StepTitle n="04" title="What stood out?" sub="Select all that apply — optional."/>
              <div style={{display:'flex',gap:9,flexWrap:'wrap',marginTop:20}}>
                {HIGHLIGHTS.map(t=>{ const on=tags.includes(t); return (
                  <button key={t} onClick={()=>toggleTag(t)} style={{padding:'9px 14px',borderRadius:999,fontWeight:600,fontSize:'.88rem',background:on?'var(--a-slate)':'var(--surface-2)',color:on?'#fff':'var(--text-2)',boxShadow:on?'none':'inset 0 0 0 1px var(--line)',transition:'.12s'}}>{on&&'✓ '}{t}</button>
                );})}
              </div>
            </div>
          )}

          {step===4 && (
            <div>
              <StepTitle n="05" title="Anything else?" sub="Open feedback for the organizing team — optional."/>
              <textarea className="inp" rows={5} value={text} onChange={e=>setText(e.target.value)} placeholder="What worked, what to improve next time…" style={{marginTop:18,background:'var(--surface-2)'}}></textarea>
              <p style={{color:'var(--text-3)',fontSize:'.8rem',marginTop:10,display:'flex',alignItems:'center',gap:6}}><I.lock size={'.95em'}/> Your responses are confidential and used only to improve future events.</p>
            </div>
          )}
        </div>

        {/* footer nav */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:'14px 22px',borderTop:'1px solid var(--line-soft)',background:'var(--surface-2)'}}>
          <button className="btn btn-ghost btn-sm" onClick={()=> step===0? onClose() : setStep(step-1)}>{step===0?'Cancel':'← Back'}</button>
          {step<N-1
            ? <button className="btn btn-primary btn-sm" style={{background:'var(--a-slate)'}} disabled={!canNext} onClick={()=>setStep(step+1)}>Next →</button>
            : <button className="btn btn-primary btn-sm" style={{background:'var(--ok)'}} onClick={()=>setDone(true)}>Submit survey</button>}
        </div>
      </div>
    </div>
  );
}
function StepTitle({n,title,sub}){
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontFamily:'var(--serif)',fontWeight:700,color:'var(--a-steel)',fontSize:'1rem'}}>{n}</span>
        <h3 style={{fontSize:'1.3rem'}}>{title}</h3>
      </div>
      {sub && <p style={{color:'var(--text-2)',marginTop:6,fontSize:'.92rem'}}>{sub}</p>}
    </div>
  );
}

Object.assign(window, { SurveyBadge, SurveySelected, SurveyForm });
