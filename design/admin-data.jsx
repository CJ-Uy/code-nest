// ===== Admin + onboarding — data =====

// ---- Roles model ----
const ROLE_DEFS = [
  { id:"super",     label:"Super Admin",     desc:"Superset of all permissions. Can create or remove other super admins.", kind:"danger" },
  { id:"calendar",  label:"Calendar Admin",  desc:"Create and manage calendar events of any type.", kind:"info" },
  { id:"publishing",label:"Publishing Admin",desc:"Author announcements and publish Library/Product Center content.", kind:"info" },
  { id:"link",      label:"Link Admin",      desc:"Edit or delete any short link; manage reserved slugs.", kind:"info" },
  { id:"crs",       label:"CRS / Points Admin",desc:"Approve events, assign points, configure surveys, manage retention.", kind:"info" },
  { id:"member",    label:"Member Admin",    desc:"Manage member records, batches, and role assignments.", kind:"info" },
];

// current admin viewer
const ADMIN_ME = { id:"bea", name:"Bea Mendoza", nick:"Bea" };

let ADMIN_MEMBERS = [
  { id:"bea",   name:"Bea Mendoza", nick:"Bea",   batch:"Batch 16", roles:["super","publishing","crs"] },
  { id:"karl",  name:"Karl Reyes",  nick:"Karl",  batch:"Batch 14", roles:["super","publishing"] },
  { id:"tonio", name:"Tonio Cruz",  nick:"Tonio", batch:"Batch 13", roles:["member","calendar"] },
  { id:"patti", name:"Patti Gomez", nick:"Patti", batch:"Batch 14", roles:["crs","calendar"] },
  { id:"mara",  name:"Mara Lim",    nick:"Mara",  batch:"Batch 15", roles:[] },
  { id:"renz",  name:"Renz Tan",    nick:"Renz",  batch:"Batch 15", roles:["link"] },
  { id:"jio",   name:"Jio Santos",  nick:"Jio",   batch:"Batch 16", roles:[] },
  { id:"andi",  name:"Andi Cruz",   nick:"Andi",  batch:"Batch 16", roles:[] },
];

// ---- Pending events for approval ----
const PENDING_EVENTS = [
  { id:"pe1", name:"XChange Org Sync", type:"official", date:"Mar 28, 2025", time:"4:30 PM", place:"CTC 102", organizer:"Bea Mendoza", requested:18, cap:60, note:"Coordination sync with partner orgs ahead of XChange." },
  { id:"pe2", name:"Consultant Skills Workshop", type:"official", date:"Apr 4, 2025", time:"1:00 PM", place:"MVP 216", organizer:"Renz Tan", requested:20, cap:40, note:"Hands-on facilitation skills for newer consultants." },
  { id:"pe3", name:"Inter-Org Mixer", type:"casual", date:"Apr 9, 2025", time:"5:00 PM", place:"Area 2", organizer:"Jio Santos", requested:5, cap:50, note:"Casual networking with partner youth orgs." },
];

// ---- Audit log ----
const AUDIT_LOG = [
  { id:1, actor:"Karl Reyes", role:"Super Admin", action:"granted", target:"Patti Gomez", detail:"CRS / Points Admin role", cat:"role", time:"Today · 10:24 AM" },
  { id:2, actor:"Bea Mendoza", role:"CRS Admin", action:"approved", target:"1st General Assembly", detail:"+15 points assigned", cat:"event", time:"Today · 9:02 AM" },
  { id:3, actor:"Tonio Cruz", role:"Super Admin", action:"published", target:"Gen Assembly moved to Saturday", detail:"Announcement · pinned", cat:"content", time:"Yesterday · 4:15 PM" },
  { id:4, actor:"Patti Gomez", role:"CRS Admin", action:"configured", target:"Consultancy Workshop survey", detail:"Sample size set to 28 of 72", cat:"survey", time:"Yesterday · 2:40 PM" },
  { id:5, actor:"Renz Tan", role:"Link Admin", action:"deleted", target:"code.ph/old-xc", detail:"Reserved slug reclaimed", cat:"link", time:"Mar 13 · 11:08 AM" },
  { id:6, actor:"Karl Reyes", role:"Super Admin", action:"removed", target:"Coco Lim", detail:"Member Admin role", cat:"role", time:"Mar 12 · 6:30 PM" },
  { id:7, actor:"Bea Mendoza", role:"Publishing Admin", action:"published", target:"Diagnosing a Stalled Council", detail:"Library case study · members-only", cat:"content", time:"Mar 11 · 3:22 PM" },
  { id:8, actor:"Patti Gomez", role:"CRS Admin", action:"rejected", target:"Duplicate GA event", detail:"Reason: duplicate of approved event", cat:"event", time:"Mar 10 · 9:50 AM" },
];
const AUDIT_CATS = [["all","All activity"],["role","Roles"],["event","Events"],["content","Content"],["survey","Surveys"],["link","Links"]];

// ---- Admin dashboard metrics ----
const ADMIN_METRICS = [
  { k:"pending", label:"Events awaiting approval", value:3, icon:"events", tone:"warn" },
  { k:"members", label:"Active members", value:64, icon:"user", tone:"info" },
  { k:"admins", label:"Admins (any role)", value:6, icon:"lock", tone:"info" },
  { k:"surveys", label:"Surveys running", value:2, icon:"doc", tone:"info" },
];

Object.assign(window, { ROLE_DEFS, ADMIN_ME, ADMIN_MEMBERS, PENDING_EVENTS, AUDIT_LOG, AUDIT_CATS, ADMIN_METRICS });
