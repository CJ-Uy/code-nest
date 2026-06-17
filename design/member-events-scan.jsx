// ===== Events (CRS) — mobile attendance scan (full-screen) =====
function ScanScreen({event, onClose, onDone}){
  const [state,setState] = useState("scanning"); // scanning | success | expired | invalid
  useEffect(()=>{
    if(state!=="scanning") return;
    const id=setTimeout(()=>setState("success"), 2200);
    return ()=>clearTimeout(id);
  },[state]);
  const e = event || EVENTS_FULL[0];

  return (
    <div style={{position:'absolute',inset:0,zIndex:120,background:'#05101F',color:'#fff',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* faux camera bg */}
      <div aria-hidden="true" style={{position:'absolute',inset:0,background:'radial-gradient(120% 80% at 50% 30%, #16324f 0%, #0a1a2e 55%, #05101F 100%)'}}></div>
      <div aria-hidden="true" style={{position:'absolute',inset:0,opacity:.5,backgroundImage:'repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0 1px, transparent 1px 4px)'}}></div>

      {/* top bar */}
      <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'52px 18px 14px'}}>
        <button onClick={onClose} style={{width:40,height:40,borderRadius:'50%',background:'rgba(255,255,255,.12)',color:'#fff',display:'grid',placeItems:'center',fontSize:'1.1rem'}}><I.x/></button>
        <div style={{fontWeight:600,fontSize:'.95rem'}}>Scan attendance QR</div>
        <div style={{width:40}}></div>
      </div>

      {state==="scanning" && (
        <div style={{position:'relative',flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 28px'}}>
          <div style={{position:'relative',width:230,height:230}}>
            {/* corner brackets */}
            {[[0,0,'nwse',{top:0,left:0,borderTop:'3px solid #fff',borderLeft:'3px solid #fff',borderTopLeftRadius:14}],
              [0,0,'',{top:0,right:0,borderTop:'3px solid #fff',borderRight:'3px solid #fff',borderTopRightRadius:14}],
              [0,0,'',{bottom:0,left:0,borderBottom:'3px solid #fff',borderLeft:'3px solid #fff',borderBottomLeftRadius:14}],
              [0,0,'',{bottom:0,right:0,borderBottom:'3px solid #fff',borderRight:'3px solid #fff',borderBottomRightRadius:14}]].map((c,i)=>(
              <span key={i} style={{position:'absolute',width:42,height:42,...c[3]}}></span>
            ))}
            {/* faint QR hint */}
            <div style={{position:'absolute',inset:24,opacity:.22,display:'grid',placeItems:'center'}}><FauxQR size={150} light/></div>
            {/* scan line */}
            <div style={{position:'absolute',left:10,right:10,height:2,background:'linear-gradient(90deg,transparent,var(--mid),transparent)',boxShadow:'0 0 12px 2px rgba(144,180,204,.6)',animation:'scanline 2.1s ease-in-out infinite'}}></div>
          </div>
          <div style={{marginTop:30,textAlign:'center'}}>
            <div style={{fontFamily:'var(--serif)',fontWeight:700,fontSize:'1.3rem'}}>Point at the QR on screen</div>
            <p style={{color:'#9FB3CC',marginTop:7,fontSize:'.92rem'}}>Hold steady — we\u2019ll check you in automatically.</p>
          </div>
          {/* demo controls */}
          <div style={{position:'absolute',bottom:30,left:0,right:0,display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',padding:'0 20px'}}>
            <DemoPill onClick={()=>setState('success')}>Simulate success</DemoPill>
            <DemoPill onClick={()=>setState('expired')}>Expired</DemoPill>
            <DemoPill onClick={()=>setState('invalid')}>Invalid</DemoPill>
          </div>
        </div>
      )}

      {state==="success" && (
        <ResultView tone="ok" icon={<I.check/>} title="You\u2019re checked in!" sub={`${e.name} · +${e.pts} retention points`}
          body="Your attendance is logged. Salamat for coming!" primary="Done" onPrimary={()=>onDone&&onDone(e)} />
      )}
      {state==="expired" && (
        <ResultView tone="warn" icon={<I.clock/>} title="This QR has expired" sub="The check-in window has closed"
          body="The organizer closed attendance or the event ended. Ask them to re-open the window if you still need to check in." primary="Try again" onPrimary={()=>setState('scanning')} secondary="Close" onSecondary={onClose}/>
      )}
      {state==="invalid" && (
        <ResultView tone="danger" icon={<I.x/>} title="Couldn\u2019t read that code" sub="That doesn\u2019t look like a CODE attendance QR"
          body="Make sure you\u2019re scanning the QR shown by the organizer for this event." primary="Scan again" onPrimary={()=>setState('scanning')} secondary="Close" onSecondary={onClose}/>
      )}
    </div>
  );
}
function DemoPill({children,onClick}){
  return <button onClick={onClick} style={{fontSize:'.74rem',fontWeight:600,color:'#cdd9e6',background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.14)',borderRadius:999,padding:'6px 12px'}}>{children}</button>;
}
function ResultView({tone,icon,title,sub,body,primary,onPrimary,secondary,onSecondary}){
  const c = {ok:'#2E9C76',warn:'#D69A4A',danger:'#D86A6A'}[tone];
  return (
    <div style={{position:'relative',flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 32px',textAlign:'center'}}>
      <div style={{width:96,height:96,borderRadius:'50%',background:c,color:'#fff',display:'grid',placeItems:'center',fontSize:'2.6rem',boxShadow:`0 0 0 12px color-mix(in srgb,${c} 22%, transparent)`,animation:'pop .4s cubic-bezier(.2,.9,.3,1.4)'}}>{icon}</div>
      <h2 style={{color:'#fff',fontSize:'1.8rem',marginTop:26}}>{title}</h2>
      <div style={{color:c==='#2E9C76'?'#7FD3B6':'#C6D4E6',fontWeight:600,marginTop:8,fontSize:'1rem'}}>{sub}</div>
      <p style={{color:'#9FB3CC',marginTop:14,maxWidth:320,lineHeight:1.55}}>{body}</p>
      <div style={{display:'flex',flexDirection:'column',gap:10,width:'100%',maxWidth:300,marginTop:30}}>
        <button className="btn btn-lg" style={{background:'#fff',color:'var(--navy)',justifyContent:'center'}} onClick={onPrimary}>{primary}</button>
        {secondary && <button className="btn btn-lg" style={{background:'rgba(255,255,255,.1)',color:'#fff',justifyContent:'center'}} onClick={onSecondary}>{secondary}</button>}
      </div>
    </div>
  );
}

Object.assign(window, { ScanScreen, ResultView });
