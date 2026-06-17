// ===== Link Shortener — demo data =====
const LINK_RESERVED = ["admin","api","login","signin","code","help","about","osg","falcon","www","app","dashboard"];

const LINKS = [
  { id:1, slug:"xchange-reg", dest:"https://forms.gle/xchange2025registration", creator:"Bea", mine:true, clicks:1284, created:"Feb 12, 2025", createdSort:20250212, title:"XChange 8 Registration" },
  { id:2, slug:"yh-signup", dest:"https://forms.gle/youthhuddle-leg2-signup", creator:"Karl", mine:false, clicks:842, created:"Feb 20, 2025", createdSort:20250220, title:"Youth Huddle Leg 2" },
  { id:3, slug:"ga2-deck", dest:"https://drive.google.com/code-ga2-slides", creator:"Bea", mine:true, clicks:317, created:"Mar 10, 2025", createdSort:20250310, title:"2nd GA Slide Deck" },
  { id:4, slug:"od-primer", dest:"https://ateneocode.org/product-center/organization-identity", creator:"Mara", mine:false, clicks:2056, created:"Jan 8, 2025", createdSort:20250108, title:"OD Primer — Org Identity" },
  { id:5, slug:"feedback-q3", dest:"https://forms.gle/code-q3-feedback", creator:"Jio", mine:false, clicks:198, created:"Mar 2, 2025", createdSort:20250302, title:"Q3 Member Feedback" },
  { id:6, slug:"merch-2025", dest:"https://ateneocode.org/merch", creator:"Bea", mine:true, clicks:73, created:"Mar 14, 2025", createdSort:20250314, title:"CODE Merch 2025" },
];

// deterministic analytics for a link
function linkAnalytics(link){
  let s=(link.id*9301+49297)%233280; const rnd=()=>{ s=(s*9301+49297)%233280; return s/233280; };
  const days=30; const series=[];
  const base=Math.max(2,Math.round(link.clicks/days*0.6));
  const today=new Date(2025,2,15);
  for(let i=days-1;i>=0;i--){
    const d=new Date(today); d.setDate(d.getDate()-i);
    const spike = rnd()>0.86 ? 2.4+rnd()*2 : 1;
    const v=Math.round(base*(0.5+rnd()*1.1)*spike);
    series.push({ date:d, label:(d.getMonth()+1)+"/"+d.getDate(), v });
  }
  const refs=[["Facebook",0.42],["Messenger",0.23],["Direct",0.18],["Twitter / X",0.1],["Other",0.07]].map(([k,p])=>({k,p,v:Math.round(link.clicks*p)}));
  const dev=[["Mobile",0.78],["Desktop",0.18],["Tablet",0.04]].map(([k,p])=>({k,p,v:Math.round(link.clicks*p)}));
  return { series, refs, dev };
}

const VIEWER_IS_LINK_ADMIN = true; // demo: current user can edit/delete any link

Object.assign(window, { LINK_RESERVED, LINKS, linkAnalytics, VIEWER_IS_LINK_ADMIN });
