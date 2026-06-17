// ===== Events (CRS) — demo data =====
const EVENTS_FULL = [
  { id:"ga2", short:"GA", name:"2nd General Assembly", type:"official", date:"Mar 22, 2025", day:"Sat", time:"2:00 PM", end:"5:00 PM", place:"MVP 216", pts:15, cap:80, count:0,
    approval:"approved", mine:true, state:"upcoming", windowOpen:false, going:"going",
    desc:"The second org-wide assembly of the term. Updates from the Super Seven, CRS standing, and the XChange roadmap. Attendance is part of your retention points." },
  { id:"yh", short:"YH", name:"Youth Huddle Planning", type:"official", date:"Mar 25, 2025", day:"Tue", time:"6:00 PM", end:"8:00 PM", place:"Online · Meet", pts:10, cap:40, count:0,
    approval:"approved", mine:false, state:"upcoming", windowOpen:false, going:"none",
    desc:"Planning session for the next Youth Huddle leg. Bring your module drafts and facilitation ideas." },
  { id:"xc", short:"XC", name:"XChange Org Sync", type:"official", date:"Mar 28, 2025", day:"Fri", time:"4:30 PM", end:"6:00 PM", place:"CTC 102", pts:10, cap:60, count:0,
    approval:"pending", mine:true, state:"upcoming", windowOpen:false, going:"none",
    desc:"Coordination sync with partner orgs ahead of XChange. Pending faculty-moderator approval." },
  { id:"coffee", short:"\u2615", name:"CODE Coffee & Catch-up", type:"casual", date:"Apr 2, 2025", day:"Wed", time:"5:00 PM", end:"7:00 PM", place:"Area 2", pts:5, cap:30, count:0,
    approval:"approved", mine:false, state:"upcoming", windowOpen:false, going:"none",
    desc:"Low-key merienda and catch-up. No agenda — just kamustahan." },
  { id:"bday", short:"\uD83C\uDF82", name:"Bea\u2019s Birthday", type:"birthday", date:"Apr 5, 2025", day:"Sat", time:"All day", end:"", place:"\u2014", pts:0, cap:0, count:0,
    approval:"approved", mine:false, state:"upcoming", windowOpen:false, going:"none",
    desc:"Greet Bea a happy birthday!" },

  { id:"orient", short:"OR", name:"Consultant Orientation", type:"official", date:"Feb 8, 2025", day:"Sat", time:"1:00 PM", end:"5:00 PM", place:"MVP 216", pts:15, cap:80, count:72,
    approval:"approved", mine:false, state:"past", windowOpen:false, going:"checked-in",
    desc:"Onboarding for the new batch of consultants — vision, OD foundations, and team assignments." },
  { id:"ga1", short:"GA", name:"1st General Assembly", type:"official", date:"Jan 18, 2025", day:"Sat", time:"2:00 PM", end:"5:00 PM", place:"Escaler Hall", pts:15, cap:120, count:104,
    approval:"approved", mine:true, state:"past", windowOpen:false, going:"checked-in", surveyAssigned:true,
    desc:"The opening assembly of the term." },
  { id:"team", short:"TB", name:"Team-building Day", type:"casual", date:"Dec 14, 2024", day:"Sat", time:"9:00 AM", end:"4:00 PM", place:"Eagle\u2019s Nest", pts:10, cap:60, count:58,
    approval:"approved", mine:false, state:"past", windowOpen:false, going:"checked-in",
    desc:"A full day of games, reflection, and bonding." },
];

const LIVE_CHECKINS = [
  { nick:"Karl", time:"2:01 PM" }, { nick:"Mara", time:"2:01 PM" }, { nick:"Jio", time:"2:02 PM" },
  { nick:"Patti", time:"2:02 PM" }, { nick:"Renz", time:"2:03 PM" }, { nick:"Andi", time:"2:03 PM" },
];

const EVENT_MEDIA = [
  { id:1, caption:"Opening prayer led by the Super Seven", by:"Karl", time:"Jan 18" },
  { id:2, caption:"Breakout: diagnosing our own org health", by:"Mara", time:"Jan 18" },
  { id:3, caption:"The whole batch after closing", by:"Jio", time:"Jan 18" },
  { id:4, caption:"Merienda break candids", by:"Patti", time:"Jan 18" },
];

const FORUM = [
  { id:1, author:"Karl Reyes", nick:"Karl", anon:false, time:"2h ago", body:"The breakout on org diagnosis was so good. Can we get the framework slides posted here?",
    replies:[
      { id:11, author:"Mara Lim", nick:"Mara", anon:false, time:"1h ago", body:"Seconded! Especially the part on culture vs. structure." },
      { id:12, author:"Anonymous", nick:null, anon:true, time:"54m ago", body:"+1, the facilitators were great. Maybe a bit more time per breakout next time?" },
    ] },
  { id:2, author:"Anonymous", nick:null, anon:true, time:"3h ago", body:"Honest feedback: the venue was a little cramped for 100+ people. Loved everything else though.",
    replies:[] },
  { id:3, author:"Jio Santos", nick:"Jio", anon:false, time:"5h ago", body:"Salamat to everyone who came! Media uploads are open — drop your photos in the gallery above.",
    replies:[] },
];

// retention (per-term, against threshold)
const RETENTION_FULL = {
  status:"At-Risk",            // Retained | At-Risk | On Probation
  tier:"Tier II \u00b7 Engaged",
  term:"2nd Sem, A.Y. 2024\u201325",
  points:185, threshold:240, retainedAt:240, probationBelow:120,
  history:[
    { event:"Consultant Orientation", date:"Feb 8", pts:15, type:"official" },
    { event:"1st General Assembly", date:"Jan 18", pts:15, type:"official" },
    { event:"Team-building Day", date:"Dec 14", pts:10, type:"casual" },
    { event:"Youth Huddle Leg 1", date:"Nov 30", pts:20, type:"official" },
    { event:"Consultancy workshop", date:"Nov 16", pts:25, type:"official" },
  ],
};

const LEADERBOARD = {
  term: [
    { rank:1, nick:"Renz", pts:285, you:false }, { rank:2, nick:"Patti", pts:270, you:false },
    { rank:3, nick:"Karl", pts:255, you:false }, { rank:4, nick:"Andi", pts:240, you:false },
    { rank:5, nick:"Jio", pts:225, you:false }, { rank:6, nick:"Mara", pts:200, you:false },
    { rank:7, nick:"Bea", pts:185, you:true }, { rank:8, nick:"Coco", pts:170, you:false },
    { rank:9, nick:"Tonio", pts:150, you:false },
  ],
  all: [
    { rank:1, nick:"Karl", pts:1420, you:false }, { rank:2, nick:"Renz", pts:1360, you:false },
    { rank:3, nick:"Patti", pts:1280, you:false }, { rank:4, nick:"Bea", pts:1190, you:true },
    { rank:5, nick:"Jio", pts:1120, you:false }, { rank:6, nick:"Mara", pts:1050, you:false },
  ],
};

Object.assign(window, { EVENTS_FULL, LIVE_CHECKINS, EVENT_MEDIA, FORUM, RETENTION_FULL, LEADERBOARD });
