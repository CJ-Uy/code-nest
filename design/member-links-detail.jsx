// ===== Link Shortener — detail / analytics + QR customizer =====
function LinkDetail({link, device, onBack, onEdit}){
  const [range,setRange] = useState(14);
  const a = linkAnalytics(link);
  const series = a.series.slice(-range);
  const total = series.reduce((n,d)=>n+d.v,0);
  const peak = Math.max(...series.map(d=>d.v),1);
  const avg = Math.round(total/series.length);
  const canEdit = link.mine || VIEWER_IS_LINK_ADMIN;
  return (
    <div style={{maxWidth:820}}>
      <button className="btn btn-sm btn-ghost" onClick={onBack} style={{marginBottom:18}}>← All links</button>

      {/* header */}
      <div className="card" style={{padding:device==='mobile'?'18px':'22px 24px',marginBottom:18}}>
        <div style={{display:'flex',gap:16,alignItems:'flex-start',flexWrap:'wrap'}}>
          <span style={{width:46,height:46,borderRadius:12,background:'var(--pale-tint)',color:'var(--accent-strong)',display:'grid',placeItems:'center',flexShrink:0,fontSize:'1.2rem'}}><I.link/></span>
          <div style={{flex:1,minWidth:0}}>
            <div className="mono" style={{fontSize:'1.25rem',fontWeight:700,color:'var(--text)'}}>{shortUrl(link.slug)}</div>
            <div style={{color:'var(--text-2)',fontSize:'.9rem',marginTop:3,display:'flex',alignItems:'center',gap:6}}><span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>→ {link.dest}</span><I.ext size={'.9em'} style={{flexShrink:0,color:'var(--text-3)'}}/></div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginTop:10,color:'var(--text-3)',fontSize:'.84rem',flexWrap:'wrap'}}>
              <span style={{display:'inline-flex',alignItems:'center',gap:6}}><Avatar name={link.creator} size={20} tone={link.mine?'navy':'steel'}/>{link.creator}{link.mine&&' · you'}</span>
              <span>·</span><span>Created {link.created}</span>
            </div>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <CopyBtn text={"https://"+shortUrl(link.slug)} label="Copy" sm/>
            {canEdit && <button className="btn btn-ghost btn-sm" onClick={()=>onEdit&&onEdit(link)}><I.doc size={'1em'}/> Edit</button>}
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:device==='mobile'?'1fr':'1.55fr 1fr',gap:18,alignItems:'start'}}>
        {/* analytics */}
        <div className="card" style={{padding:device==='mobile'?'18px':'20px 22px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:16}}>
            <h3 style={{fontSize:'1.15rem'}}>Clicks over time</h3>
            <div style={{display:'inline-flex',gap:3,background:'var(--surface-2)',borderRadius:9,padding:3}}>
              {[7,14,30].map(r=>(
                <button key={r} onClick={()=>setRange(r)} style={{padding:'5px 11px',borderRadius:7,fontSize:'.8rem',fontWeight:600,color:range===r?'#fff':'var(--text-2)',background:range===r?'var(--navy)':'transparent'}}>{r}d</button>
              ))}
            </div>
          </div>
          {/* stat row */}
          <div style={{display:'flex',gap:device==='mobile'?16:26,marginBottom:18,flexWrap:'wrap'}}>
            <Stat label="Total clicks" value={link.clicks.toLocaleString()}/>
            <Stat label={"Last "+range+"d"} value={total.toLocaleString()}/>
            <Stat label="Daily avg" value={avg}/>
          </div>
          <BarChart series={series} peak={peak} device={device}/>
        </div>

        {/* breakdowns */}
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          <div className="card" style={{padding:'18px 20px'}}>
            <h3 style={{fontSize:'1.05rem',marginBottom:14}}>Top referrers</h3>
            {a.refs.map(r=><BreakdownRow key={r.k} label={r.k} value={r.v} pct={r.p}/>)}
          </div>
          <div className="card" style={{padding:'18px 20px'}}>
            <h3 style={{fontSize:'1.05rem',marginBottom:14}}>Devices</h3>
            {a.dev.map(d=><BreakdownRow key={d.k} label={d.k} value={d.v} pct={d.p}/>)}
          </div>
        </div>
      </div>

      {/* QR customizer */}
      <QRCustomizer link={link} device={device}/>
    </div>
  );
}
function Stat({label,value}){
  return <div><div style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.6rem',color:'var(--text)',lineHeight:1}}>{value}</div><div style={{color:'var(--text-3)',fontSize:'.8rem',marginTop:4}}>{label}</div></div>;
}
function BarChart({series, peak, device}){
  const [hover,setHover] = useState(null);
  return (
    <div>
      <div style={{display:'flex',alignItems:'flex-end',gap:device==='mobile'?2:3,height:130,position:'relative'}}>
        {series.map((d,i)=>(
          <div key={i} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(null)}
            style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'flex-end',alignItems:'center',height:'100%',position:'relative',cursor:'default'}}>
            {hover===i && <div style={{position:'absolute',bottom:'calc('+(d.v/peak*100)+'% + 6px)',background:'var(--navy)',color:'#fff',fontSize:'.72rem',fontWeight:600,padding:'3px 7px',borderRadius:6,whiteSpace:'nowrap',zIndex:5}}>{d.v} · {d.label}</div>}
            <div style={{width:'100%',maxWidth:18,height:Math.max(3,d.v/peak*120),borderRadius:'4px 4px 2px 2px',background:hover===i?'var(--navy)':'linear-gradient(180deg,var(--a-steel),var(--mid))',transition:'.12s'}}></div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:8,color:'var(--text-3)',fontSize:'.74rem'}}>
        <span>{series[0]?.label}</span><span>{series[Math.floor(series.length/2)]?.label}</span><span>{series[series.length-1]?.label}</span>
      </div>
    </div>
  );
}
function BreakdownRow({label,value,pct}){
  return (
    <div style={{marginBottom:11}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:'.86rem',marginBottom:5}}><span style={{color:'var(--text)',fontWeight:600}}>{label}</span><span style={{color:'var(--text-3)'}}>{value.toLocaleString()} · {Math.round(pct*100)}%</span></div>
      <div style={{height:7,borderRadius:999,background:'var(--surface-2)',overflow:'hidden'}}><div style={{width:(pct*100)+'%',height:'100%',borderRadius:999,background:'linear-gradient(90deg,var(--a-steel),var(--mid))'}}></div></div>
    </div>
  );
}

// ---------- QR customizer ----------
function QRCustomizer({link, device}){
  const [variant,setVariant] = useState("light");
  const variants = [["light","Light","On white"],["dark","Dark","On navy"],["transparent","Transparent","No background"]];
  const previewBg = variant==='light'? 'var(--surface-2)' : variant==='dark'? 'var(--navy)' : 'transparent';
  return (
    <div className="card" style={{padding:device==='mobile'?'18px':'22px 24px',marginTop:18}}>
      <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:4}}>
        <span style={{color:'var(--accent)',fontSize:'1.1rem'}}><I.qr/></span>
        <h3 style={{fontSize:'1.15rem'}}>QR code</h3>
      </div>
      <p style={{color:'var(--text-2)',fontSize:'.88rem',marginBottom:18}}>The CODE Falcon sits centered and undistorted, in approved colors only. Choose a variant and download.</p>
      <div style={{display:'grid',gridTemplateColumns:device==='mobile'?'1fr':'auto 1fr',gap:device==='mobile'?20:32,alignItems:'center'}}>
        {/* preview */}
        <div style={{display:'grid',placeItems:'center',padding:variant==='dark'?24:0,borderRadius:'var(--radius)',background:variant==='dark'?'var(--navy)':'transparent',justifySelf:device==='mobile'?'center':'start'}}>
          <div style={{borderRadius:18,padding:variant==='transparent'?0:0,background:'transparent'}}>
            <FauxQR size={device==='mobile'?180:200} seed={link.slug.length*5+7} variant={variant}/>
          </div>
        </div>
        {/* controls */}
        <div>
          <div style={{fontWeight:600,fontSize:'.82rem',color:'var(--text-2)',marginBottom:9,textTransform:'uppercase',letterSpacing:'.05em'}}>Variant</div>
          <div style={{display:'flex',flexDirection:'column',gap:9}}>
            {variants.map(([id,l,sub])=>{ const on=variant===id; return (
              <button key={id} onClick={()=>setVariant(id)} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 13px',borderRadius:11,textAlign:'left',background:on?'color-mix(in srgb,var(--accent) 8%,var(--surface))':'var(--surface-2)',boxShadow:on?'inset 0 0 0 1.5px var(--accent)':'inset 0 0 0 1px var(--line)',transition:'.12s'}}>
                <span style={{width:34,height:34,borderRadius:8,flexShrink:0,background:id==='light'?'#fff':id==='dark'?'var(--navy)':'transparent',backgroundImage:id==='transparent'?'conic-gradient(#e6ebf2 0 25%, #fff 0 50%, #e6ebf2 0 75%, #fff 0)':'none',backgroundSize:id==='transparent'?'10px 10px':'auto',boxShadow:'inset 0 0 0 1px var(--line)',display:'grid',placeItems:'center'}}>
                  <span style={{width:7,height:7,borderRadius:1,background:id==='dark'?'#fff':'var(--navy)'}}></span>
                </span>
                <div style={{flex:1}}><div style={{fontWeight:600,color:'var(--text)',fontSize:'.92rem'}}>{l}</div><div style={{color:'var(--text-3)',fontSize:'.78rem'}}>{sub}</div></div>
                <span style={{width:18,height:18,borderRadius:'50%',border:'2px solid '+(on?'var(--accent)':'var(--line)'),display:'grid',placeItems:'center'}}>{on&&<span style={{width:9,height:9,borderRadius:'50%',background:'var(--accent)'}}></span>}</span>
              </button>
            );})}
          </div>
          <div style={{display:'flex',gap:8,marginTop:16,flexWrap:'wrap'}}>
            <button className="btn btn-primary btn-sm"><DownloadIcon/> PNG</button>
            <button className="btn btn-ghost btn-sm"><DownloadIcon/> SVG</button>
          </div>
          <p style={{color:'var(--text-3)',fontSize:'.78rem',marginTop:12,display:'flex',alignItems:'center',gap:6}}><I.lock size={'.9em'}/> Logo locked to brand-approved colors — recoloring is disabled.</p>
        </div>
      </div>
    </div>
  );
}
function DownloadIcon(){ return <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 11l5 5 5-5M5 21h14"/></svg>; }

Object.assign(window, { LinkDetail, Stat, BarChart, BreakdownRow, QRCustomizer, DownloadIcon });
