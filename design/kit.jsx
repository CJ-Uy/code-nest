// ===== Ateneo CODE — shared kit (icons + primitives) =====
const { useState, useEffect, useRef } = React;

const I = {
  home:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/></svg>,
  book:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M4 4h9a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4zM20 4h-1a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H20z"/></svg>,
  link:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M10 13a3 3 0 0 0 4.5.4l3-3a3 3 0 0 0-4.3-4.3l-1.7 1.7M14 11a3 3 0 0 0-4.5-.4l-3 3a3 3 0 0 0 4.3 4.3l1.7-1.7"/></svg>,
  events:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 9h18M8 3v4M16 3v4M9 15l2 2 4-4"/></svg>,
  calendar:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>,
  megaphone:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M3 11v2a1 1 0 0 0 1 1h2l6 4V6L6 10H4a1 1 0 0 0-1 1zM16 9a3 3 0 0 1 0 6M19 6a7 7 0 0 1 0 12"/></svg>,
  bell:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7M10 20a2 2 0 0 0 4 0"/></svg>,
  search:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>,
  plus:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M12 5v14M5 12h14"/></svg>,
  user:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>,
  settings:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><circle cx="12" cy="12" r="3.2"/><path d="M19.4 13a7.8 7.8 0 0 0 0-2l2-1.5-2-3.4-2.3 1a7.5 7.5 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a7.5 7.5 0 0 0-1.7 1l-2.3-1-2 3.4L4.6 11a7.8 7.8 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7.5 7.5 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7.5 7.5 0 0 0 1.7-1l2.3 1 2-3.4z"/></svg>,
  chev:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M9 6l6 6-6 6"/></svg>,
  chevDown:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M6 9l6 6 6-6"/></svg>,
  arrow:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  check:(p)=><svg viewBox="0 0 24 24" {...sv(p,2.4)}><path d="m5 12 5 5L20 6"/></svg>,
  x:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M6 6l12 12M18 6 6 18"/></svg>,
  star:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.4l6-.8z"/></svg>,
  heart:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.4-7 10-7 10z"/></svg>,
  bookmark:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M6 4h12v17l-6-4-6 4z"/></svg>,
  qr:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v7M17 21h4M14 19v2"/></svg>,
  scan:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M4 12h16"/></svg>,
  grid:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  more:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>,
  logout:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"/></svg>,
  clock:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  trophy:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 16h6M8 21h8M12 14v2"/></svg>,
  flame:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-1.5.6-2.8 1.3-3.7C9 10 10 12 11 12c1.2 0 1.4-2 1-4-.3-1.7 0-3.5-.0-5z"/></svg>,
  pin:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>,
  mapPin:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>,
  doc:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>,
  filter:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M3 5h18l-7 8v6l-4-2v-4z"/></svg>,
  ext:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>,
  mail:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>,
  lock:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>,
  refresh:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5"/></svg>,
  spark:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z"/></svg>,
  survey:(p)=><svg viewBox="0 0 24 24" {...sv(p)}><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 10h6M9 14h6M9 18h4"/></svg>,
};
function sv(p={}, w){ const {size, color, style, ...rest}=p; return {width:size||'1em',height:size||'1em',fill:'none',stroke:color||'currentColor',strokeWidth:w||1.8,strokeLinecap:'round',strokeLinejoin:'round',style,...rest}; }

// falcon mark
function Falcon({variant="navy", size=36, style={}}){
  const src = variant==="white" ? "assets/falcon-white-t.png"
            : variant==="pale" ? "assets/falcon-paleblue-t.png"
            : "assets/falcon-transparent.png";
  return <img src={src} alt="" width={size} height={size} style={{width:size,height:size,objectFit:'contain',...style}} />;
}

// avatar w/ falcon fallback
function Avatar({name, size=40, tone="navy"}){
  const initials = name ? name.split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase() : null;
  const bg = tone==="navy" ? 'var(--navy)' : tone==="steel" ? 'var(--a-steel)' : 'var(--navy-deep)';
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:bg,color:'#fff',display:'grid',placeItems:'center',flexShrink:0,fontFamily:'var(--serif)',fontWeight:700,fontSize:size*0.4,overflow:'hidden'}}>
      {initials || <Falcon variant="white" size={size*0.62}/>}
    </div>
  );
}

function Badge({children, kind="neutral", dot=false}){
  return <span className={"badge badge-"+kind+(dot?" badge-dot":"")} style={dot?{gap:'.45em'}:null}>{children}</span>;
}

// striped image placeholder (shared)
function Placeholder({label, ratio, h, tone="pale", rounded=true, style={}}){
  const bg = tone==="navy" ? "var(--navy)" : tone==="deep" ? "var(--navy-deep)" : "var(--pale-tint)";
  const fg = tone==="pale" ? "rgba(12,49,92,.16)" : "rgba(255,255,255,.13)";
  const txt = tone==="pale" ? "var(--a-slate)" : "rgba(234,240,248,.78)";
  return (
    <div aria-label={label} style={{position:'relative',background:bg,borderRadius:rounded?'var(--radius)':0,overflow:'hidden',display:'grid',placeItems:'center',backgroundImage:`repeating-linear-gradient(135deg, ${fg} 0 2px, transparent 2px 13px)`,...(ratio?{aspectRatio:ratio}:{}),...(h?{height:h}:{}),...style}}>
      <span className="mono" style={{fontSize:'.72rem',letterSpacing:'.06em',textTransform:'uppercase',color:txt,textAlign:'center',padding:'0 14px',lineHeight:1.5}}>{label}</span>
    </div>
  );
}

// generic small components
function Toast({icon, title, body, kind="info", onClose}){
  const c = {ok:'var(--ok)',warn:'var(--warn)',danger:'var(--danger)',info:'var(--info)'}[kind];
  return (
    <div className="card" style={{display:'flex',gap:12,alignItems:'flex-start',padding:'13px 14px',boxShadow:'var(--shadow-lg)',minWidth:280,maxWidth:360}}>
      <div style={{width:30,height:30,borderRadius:8,display:'grid',placeItems:'center',background:'color-mix(in srgb,'+c+' 14%,transparent)',color:c,flexShrink:0,fontSize:'1.05rem'}}>{icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:600,color:'var(--text)',fontSize:'.95rem'}}>{title}</div>
        {body && <div style={{color:'var(--text-3)',fontSize:'.86rem',marginTop:2}}>{body}</div>}
      </div>
      {onClose && <button onClick={onClose} style={{color:'var(--text-3)',fontSize:'1rem',lineHeight:1}}><I.x/></button>}
    </div>
  );
}

Object.assign(window, { useState, useEffect, useRef, I, Falcon, Avatar, Badge, Placeholder, Toast });
