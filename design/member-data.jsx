// ===== Member portal — demo data =====
const ME = { name:"Bea Mendoza", nick:"Bea", role:"Consultant", batch:"Batch 16", pronouns:"she/her" };

const ANNOUNCEMENTS = [
  { id:1, tag:"OSG", title:"Gen Assembly moved to Saturday", body:"The 2nd General Assembly is now on March 22, 2:00 PM at MVP 216. Attendance is part of your CRS points.", time:"2h ago", pinned:true, author:"Secretary-General" },
  { id:2, tag:"CRS", title:"Q3 retention window closes Friday", body:"Make sure your points are logged. Tap your retention status to see what's pending.", time:"Yesterday", author:"CRS Team" },
  { id:3, tag:"Publishing", title:"New case study added to the Library", body:"\u201CDiagnosing a stalled council\u201D \u2014 a private case study \u2014 is now live for members.", time:"2 days ago", author:"Publishing" },
];

const EVENTS = [
  { id:1, short:"GA", name:"2nd General Assembly", date:"Mar 22", day:"Sat", time:"2:00 PM", place:"MVP 216", type:"official", pts:15, going:true },
  { id:2, short:"YH", name:"Youth Huddle Planning", date:"Mar 25", day:"Tue", time:"6:00 PM", place:"Online", type:"official", pts:10, going:false },
  { id:3, short:"XC", name:"XChange Org Sync", date:"Mar 28", day:"Fri", time:"4:30 PM", place:"CTC 102", type:"official", pts:10, going:false },
  { id:4, short:"\u2615", name:"CODE Coffee & Catch-up", date:"Apr 2", day:"Wed", time:"5:00 PM", place:"Area 2", type:"casual", pts:5, going:false },
];

const RETENTION = { status:"On track", tier:"Tier II \u00b7 Engaged", points:185, target:240, rank:7, streak:4 };

const LIBRARY_ACTIVITY = [
  { id:1, title:"Human-Centered Design", action:"You saved to \u2018Frameworks\u2019", cat:"Methods", time:"1h ago", icon:"bookmark" },
  { id:2, title:"Diagnosing a Stalled Council", action:"New private case study", cat:"Case Study", time:"3h ago", icon:"doc", isNew:true },
  { id:3, title:"Organization Identity", action:"You finished reading", cat:"Foundations", time:"Yesterday", icon:"check" },
];

const NOTIFS = [
  { id:0, kind:"survey", title:"You\u2019ve been selected for a survey", body:"Share quiet, structured feedback on the 1st General Assembly. ~3 min.", time:"1h ago", unread:true, survey:true },
  { id:1, kind:"events", title:"Attendance confirmed", body:"You earned 15 pts at 2nd General Assembly.", time:"2h ago", unread:true },
  { id:2, kind:"megaphone", title:"New announcement", body:"Gen Assembly moved to Saturday.", time:"2h ago", unread:true },
  { id:3, kind:"book", title:"Reply on your comment", body:"Karl replied in \u2018Human-Centered Design\u2019.", time:"5h ago", unread:true },
  { id:4, kind:"trophy", title:"You moved up the leaderboard", body:"You\u2019re now #7 in retention this quarter.", time:"Yesterday", unread:false },
  { id:5, kind:"link", title:"Your link hit 100 clicks", body:"code.ph/xchange-reg reached 100 clicks.", time:"2 days ago", unread:false },
];

Object.assign(window, { ME, ANNOUNCEMENTS, EVENTS, RETENTION, LIBRARY_ACTIVITY, NOTIFS });
