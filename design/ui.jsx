// ===== shared UI =====
const { useState, useEffect, useRef, useCallback } = React;

// ---- icons (simple line set) ----
const Ic = {
  arrow:(p)=><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  menu:(p)=><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M3 6h18M3 12h18M3 18h18"/></svg>,
  close:(p)=><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>,
  chev:(p)=><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 6l6 6-6 6"/></svg>,
  mail:(p)=><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>,
  fb:(p)=><svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...p}><path d="M14 9h3V5.5h-3c-2.2 0-3.5 1.4-3.5 3.6V11H8v3.5h2.5V22H14v-7.5h2.7l.3-3.5H14V9.4c0-.3.2-.4.5-.4Z"/></svg>,
  pin:(p)=><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>,
  search:(p)=><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>,
  lock:(p)=><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>,
  quote:(p)=><svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...p}><path d="M10 7H5v6h3c0 2-.8 3-3 3.3V19c3.5-.3 5-2.2 5-5.8V7Zm9 0h-5v6h3c0 2-.8 3-3 3.3V19c3.5-.3 5-2.2 5-5.8V7Z"/></svg>,
  clock:(p)=><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  doc:(p)=><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>,
  check:(p)=><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m5 12 5 5L20 6"/></svg>,
  spark:(p)=><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>,
};

// ---- scroll reveal (robust: rect check on scroll + mount + safety fallback) ----
function useReveal(){
  const ref = useRef(null);
  useEffect(()=>{
    const root = ref.current;
    if(!root) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveal = ()=>{
      const els = root.querySelectorAll('.reveal:not(.in)');
      const vh = window.innerHeight || document.documentElement.clientHeight;
      els.forEach(e=>{
        const r = e.getBoundingClientRect();
        if(r.top < vh*0.92 && r.bottom > -40){ e.classList.add('in'); }
      });
    };
    if(reduce){ root.querySelectorAll('.reveal').forEach(e=>e.classList.add('in')); return; }
    // stagger siblings a touch
    root.querySelectorAll('.reveal').forEach((e,i)=>{ e.style.transitionDelay=(Math.min(i%7,6)*55)+'ms'; });
    reveal();
    requestAnimationFrame(reveal);
    const onScroll = ()=>reveal();
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll, {passive:true});
    // safety: never leave content hidden
    const t = setTimeout(()=>{ root.querySelectorAll('.reveal:not(.in)').forEach(e=>{ const r=e.getBoundingClientRect(); if(r.top < (window.innerHeight||0)) e.classList.add('in'); }); }, 1200);
    return ()=>{ window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); clearTimeout(t); };
  });
  return ref;
}

// ---- striped image placeholder ----
function Placeholder({label, ratio, h, tone="pale", rounded=true, className="", style={}}){
  const bg = tone==="navy" ? "var(--navy)" : tone==="deep" ? "var(--navy-deep)" : "var(--pale-tint)";
  const fg = tone==="pale" ? "rgba(12,49,92,.16)" : "rgba(255,255,255,.13)";
  const txt = tone==="pale" ? "var(--a-slate)" : "rgba(234,240,248,.78)";
  const st = {
    position:'relative', background:bg, borderRadius:rounded?'var(--radius)':0,
    overflow:'hidden', display:'grid', placeItems:'center',
    backgroundImage:`repeating-linear-gradient(135deg, ${fg} 0 2px, transparent 2px 13px)`,
    ...(ratio?{aspectRatio:ratio}:{}), ...(h?{height:h}:{}), ...style,
  };
  return (
    <div className={"ph "+className} style={st} aria-label={label}>
      <span style={{fontFamily:'ui-monospace,Menlo,Consolas,monospace',fontSize:'.72rem',letterSpacing:'.08em',textTransform:'uppercase',color:txt,textAlign:'center',padding:'0 14px',lineHeight:1.5}}>{label}</span>
    </div>
  );
}

// ---- falcon mark ----
function Falcon({variant="navy", size=40, style={}}){
  const src = variant==="white" ? "assets/falcon-white-t.png"
            : variant==="pale" ? "assets/falcon-paleblue-t.png"
            : "assets/falcon-transparent.png";
  return <img src={src} alt="CODE falcon" width={size} height={size} style={{width:size,height:size,objectFit:'contain',...style}} />;
}

// ---- section heading ----
function SectionHead({eyebrow, title, sub, align="left", light=false}){
  return (
    <div className="reveal" style={{maxWidth:align==='center'?760:680, margin:align==='center'?'0 auto':0, textAlign:align}}>
      {eyebrow && <div className="eyebrow" style={{marginBottom:14, color:light?'var(--mid)':'var(--accent)'}}>{eyebrow}</div>}
      <h2 style={{fontSize:'clamp(1.9rem,4vw,2.9rem)', color:light?'#fff':'var(--text)'}}>{title}</h2>
      {sub && <p className="lead" style={{marginTop:18, color:light?'var(--chrome-text-dim)':'var(--text-2)'}}>{sub}</p>}
    </div>
  );
}

// ---- pill / tag ----
function Tag({children, on="light"}){
  const s = on==="chrome"
    ? {background:'rgba(255,255,255,.1)', color:'var(--mid)', boxShadow:'inset 0 0 0 1px var(--on-chrome-line)'}
    : {background:'var(--pale-tint)', color:'var(--accent-strong)'};
  return <span style={{display:'inline-flex',alignItems:'center',gap:'.4em',fontFamily:'var(--sans)',fontWeight:600,fontSize:'.72rem',letterSpacing:'.1em',textTransform:'uppercase',padding:'.42em .8em',borderRadius:999,...s}}>{children}</span>;
}

Object.assign(window, { useState, useEffect, useRef, useCallback, Ic, useReveal, Placeholder, Falcon, SectionHead, Tag });
