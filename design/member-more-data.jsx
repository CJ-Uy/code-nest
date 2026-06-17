// ===== Calendar · Profile · Announcements — data =====

// ---- Calendar (March 2025); eventId links to EVENTS_FULL where applicable ----
const CAL_MONTH = { y:2025, m:2, label:"March 2025", today:15 }; // m: 0-indexed (2 = March)
const CAL_EVENTS = [
  { id:"c1", day:3,  name:"Consultancy Workshop", type:"official", time:"4:00 PM", place:"MVP 216", pts:25 },
  { id:"c2", day:8,  name:"Karl\u2019s Birthday", type:"birthday", time:"All day", place:"\u2014", pts:0 },
  { id:"c3", day:10, name:"2nd GA Deck Prep", type:"casual", time:"6:00 PM", place:"Online", pts:0 },
  { id:"c4", day:14, name:"Merch Launch", type:"casual", time:"12:00 NN", place:"Area 2", pts:0 },
  { id:"c5", day:15, name:"OD Reading Circle", type:"casual", time:"3:00 PM", place:"Rizal Library", pts:5 },
  { id:"c6", day:19, name:"Facilitators\u2019 Sync", type:"official", time:"5:30 PM", place:"CTC 102", pts:10 },
  { id:"ga2", day:22, name:"2nd General Assembly", type:"official", time:"2:00 PM", place:"MVP 216", pts:15, eventId:"ga2" },
  { id:"c7", day:24, name:"XChange Partner Call", type:"official", time:"7:00 PM", place:"Online", pts:10 },
  { id:"yh", day:25, name:"Youth Huddle Planning", type:"official", time:"6:00 PM", place:"Online", pts:10, eventId:"yh" },
  { id:"xc", day:28, name:"XChange Org Sync", type:"official", time:"4:30 PM", place:"CTC 102", pts:10, eventId:"xc" },
  { id:"c8", day:30, name:"Patti\u2019s Birthday", type:"birthday", time:"All day", place:"\u2014", pts:0 },
];

// ---- Profiles ----
const MY_PROFILE = {
  id:"bea", name:"Bea Mendoza", nick:"Bea", pronouns:"she/her", you:true,
  batch:"Batch 16", dept:"Consultancy Team B", course:"BS Management",
  email:"bea.mendoza@code.org", joined:"Joined Aug 2023",
  roles:["Consultant","Content Admin"],
  bio:"Consultant focused on organizational diagnosis and member retention. Happiest facilitating a hard conversation that ends in a real commitment.",
  fields:["Org Diagnosis","Facilitation","Retention","Human-Centered Design"],
  retention:{ status:"At-Risk", tier:"Tier II \u00b7 Engaged", points:185, threshold:240 },
  stats:{ events:14, points:185, links:3, articles:8 },
};
const MEMBERS = [
  MY_PROFILE,
  { id:"karl", name:"Karl Reyes", nick:"Karl", pronouns:"he/him", you:false,
    batch:"Batch 14", dept:"Publishing", course:"BS Communications Tech Mgmt",
    email:"karl.reyes@code.org", joined:"Joined Aug 2021",
    roles:["Consultant","Publishing Admin","Super Admin"],
    bio:"Publishing lead. Believes good OD content is the most scalable intervention CODE can make.",
    fields:["OD Writing","Publishing","Change Management"],
    retention:{ status:"Retained", tier:"Tier III \u00b7 Core", points:255, threshold:240 },
    stats:{ events:22, points:255, links:6, articles:19 } },
  { id:"mara", name:"Mara Lim", nick:"Mara", pronouns:"she/they", you:false,
    batch:"Batch 15", dept:"Consultancy Team A", course:"BS Psychology",
    email:"mara.lim@code.org", joined:"Joined Aug 2022",
    roles:["Consultant"],
    bio:"Psych major drawn to the human side of organizations — belonging, burnout, and what keeps people showing up.",
    fields:["Volunteer Retention","Culture","Empathy Research"],
    retention:{ status:"On Probation", tier:"Tier I \u00b7 New", points:95, threshold:240 },
    stats:{ events:6, points:95, links:0, articles:3 } },
];

// ---- Announcements ----
const VIEWER_IS_PUBLISHING_ADMIN = true; // demo: current user can post announcements
const ANNOUNCEMENTS_FULL = [
  { id:1, tag:"OSG", title:"Gen Assembly moved to Saturday", pinned:true,
    author:"Tonio Cruz", authorRole:"Secretary-General", date:"Mar 14, 2025", time:"2h ago", audience:"All members",
    excerpt:"The 2nd General Assembly is now on March 22, 2:00 PM at MVP 216. Attendance is part of your CRS points.",
    body:["The 2nd General Assembly has been moved to <b>Saturday, March 22, 2:00 PM</b> at MVP 216 to accommodate more of you who had Friday conflicts.","Attendance is part of your CRS retention points (+15). If you can\u2019t make it, please coordinate with your team lead ahead of time.","We\u2019ll cover the XChange roadmap, CRS standing, and updates from the Super Seven. Snacks will be provided — come hungry and ready."],
    linkedEvent:"ga2" },
  { id:2, tag:"CRS", title:"Q3 retention window closes Friday", pinned:false,
    author:"Patti Gomez", authorRole:"CRS Admin", date:"Mar 13, 2025", time:"Yesterday", audience:"All members",
    excerpt:"Make sure your points are logged before the window closes. Check your retention status to see what\u2019s pending.",
    body:["The Q3 retention window closes this <b>Friday, March 21</b>. After that, points for this term are locked.","Open <b>Events \u2192 My points</b> to see where you stand against the threshold. If you\u2019re At-Risk, a couple of upcoming events will get you there — the 2nd GA alone is worth +15.","Questions about your standing? Reach out to the CRS team anytime. We\u2019d rather help early than mark anyone short."] },
  { id:3, tag:"Publishing", title:"New private case study in the Library", pinned:false,
    author:"Karl Reyes", authorRole:"Publishing Admin", date:"Mar 11, 2025", time:"2 days ago", audience:"All members",
    excerpt:"\u201CDiagnosing a Stalled Council\u201D is now live for members \u2014 a full engagement walkthrough.",
    body:["A new members-only case study, <b>\u201CDiagnosing a Stalled Student Council,\u201D</b> is now in the Content Library.","It walks through a real engagement: the presenting problem, the culture-vs-structure diagnosis, and the intervention the council left with. Keep client details confidential.","Find it under Library \u2192 Case studies. Comments are open for members."],
    linkedLibrary:"diagnosing-stalled-council" },
  { id:4, tag:"OSG", title:"Welcome, Batch 16!", pinned:false,
    author:"Tonio Cruz", authorRole:"Secretary-General", date:"Feb 9, 2025", time:"Last month", audience:"All members",
    excerpt:"A warm welcome to our newest consultants. Here\u2019s how to find your footing in your first few weeks.",
    body:["To our newest batch of consultants — <b>welcome to CODE.</b> You\u2019ve joined a community that takes both the work and each other seriously.","Start with the guided tour (Settings \u2192 Restart tour), browse the Content Library, and don\u2019t be shy in the event forums. Your team lead will reach out this week.","We can\u2019t wait to see what you\u2019ll build with us."] },
];

Object.assign(window, { CAL_MONTH, CAL_EVENTS, MY_PROFILE, MEMBERS, VIEWER_IS_PUBLISHING_ADMIN, ANNOUNCEMENTS_FULL });
