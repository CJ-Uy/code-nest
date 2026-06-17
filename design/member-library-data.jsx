// ===== Content Library — members-only superset of the Product Center =====
// confidentiality: "public" (also on Product Center) | "members" | "confidential" (role-gated)
// kind: "article" | "case"

const LIB_TOPICS = ["Org Identity","Diagnosis","Culture","Structure","Retention","Facilitation","Vision & Mission","Human-Centered Design","Change Mgmt","Leadership"];

const LIBRARY = [
  {
    id:"organization-identity", kind:"article", conf:"public", cat:"Foundations",
    title:"Organization Identity", read:"7 min", author:"CODE Consultants", date:"Feb 2025", dateSort:202502,
    topics:["Org Identity","Culture"],
    dek:"How organization identities are formed — and why a shared sense of who we are anchors everything an org does.",
    abstract:"Every organization carries an identity: a shared, enduring sense of who it is, what it values, and why it exists. This piece unpacks how those identities form over time, how they are reinforced through culture and ritual, and how consultants can help an org articulate an identity its members actually recognize.",
    sections:[
      { h:"What we mean by identity", figure:"Diagram — the identity formation loop", body:"Organization identity is the set of beliefs members hold about the central, distinctive, and enduring character of their organization. It answers \u201Cwho are we?\u201D before it answers \u201Cwhat do we do?\u201D — and it is built, not declared." },
      { h:"How identities form", figure:"Figure — founding story \u2192 shared practice \u2192 narrative", body:"Identity accumulates: from a founding story, through repeated shared practice, into a narrative members tell about themselves. Each cycle either reinforces or quietly revises who the org believes it is." },
    ],
    components:{ title:"The Three Anchors of Identity", items:[
      { name:"Central character", def:"The values and purpose members treat as core.", ex:"\u201CWe exist to empower the youth.\u201D" },
      { name:"Distinctiveness", def:"What makes the org recognizably different.", ex:"Contextualized OD, not generic programs." },
      { name:"Endurance", def:"The continuity members perceive across time and turnover.", ex:"A vision that outlasts any single batch." },
    ]},
    questions:["What story does your organization tell about why it was founded?","Which practices most reliably remind members of who you are?","Where does the identity members feel diverge from the one you publish?"],
    refs:["Albert, S., & Whetten, D. A. (1985). Organizational identity. Research in Organizational Behavior.","Gioia, D. A., et al. (2013). Organizational identity formation and change. Academy of Management Annals."],
    related:["diagnosing-stalled-council","vision-mission-recalibration"],
  },
  {
    id:"human-centered-design", kind:"article", conf:"public", cat:"Methods",
    title:"Human-Centered Design", read:"9 min", author:"CODE Consultants", date:"Jan 2025", dateSort:202501,
    topics:["Human-Centered Design","Facilitation"],
    dek:"An empathy-, feedback-, and creativity-driven process for designing interventions that fit the people they serve.",
    abstract:"Human-Centered Design (HCD) puts the people an organization serves at the center of every decision. It is empathy-led, feedback-driven, and relentlessly iterative — making it a natural companion to OD work, where the \u201Cusers\u201D are members, volunteers, and the communities an org hopes to develop.",
    sections:[
      { h:"Empathy first", figure:"Diagram — empathize, define, ideate, prototype, test", body:"HCD begins by understanding people in their context — their needs, frustrations, and aspirations — before proposing any solution. The goal is to design with people, not merely for them." },
      { h:"Feedback as fuel", figure:"Figure — the iterative feedback loop", body:"Prototypes are made to be tested early and often. Each round of feedback sharpens the intervention, so the final design reflects lived reality rather than a planning-room guess." },
    ],
    components:{ title:"The Four Components", items:[
      { name:"Empathy", def:"Deeply understanding the people you design for.", ex:"Interviews, shadowing, listening sessions." },
      { name:"Definition", def:"Framing the real problem worth solving.", ex:"A sharp, human problem statement." },
      { name:"Ideation", def:"Generating many possible directions.", ex:"Divergent brainstorming, then converge." },
      { name:"Iteration", def:"Prototyping and refining through feedback.", ex:"Test, learn, revise, repeat." },
    ]},
    questions:["Whose needs are at the center of your current intervention?","When did you last test an idea with real members before committing?","What feedback have you been avoiding — and why?"],
    refs:["Brown, T. (2009). Change by Design. Harper Business.","IDEO.org (2015). The Field Guide to Human-Centered Design."],
    related:["facilitating-difficult-conversations","diagnosing-stalled-council"],
  },
  {
    id:"diagnosing-stalled-council", kind:"case", conf:"members", cat:"Case Study",
    title:"Diagnosing a Stalled Student Council", read:"12 min", author:"Consultancy Team B", date:"Mar 2025", dateSort:202503,
    topics:["Diagnosis","Structure","Retention"],
    client:"A college student council (anonymized)",
    dek:"A members-only case study: how we diagnosed why a once-active council went quiet — and the intervention that restarted it.",
    abstract:"A student council that had been a campus mainstay found itself unable to fill committees or sustain projects two terms running. Leadership assumed a motivation problem. Our diagnosis found something structural instead. This case walks through the engagement: what we observed, the framework we used, and the plan of action the council left with.",
    sections:[
      { h:"The presenting problem", figure:"Diagram — reported vs. actual problem", body:"The council described \u201Clazy members\u201D and low turnout. But framing it as motivation would have led to a morale-boosting intervention that missed the real cause. We started by separating the symptom from the system." },
      { h:"Diagnosis: culture vs. structure", figure:"Figure — the org-health diagnostic grid", body:"Using an organizational-diagnosis grid, we mapped where energy was lost. The bottleneck wasn\u2019t will — it was that every decision routed through two overloaded officers, so committees couldn\u2019t act without waiting. People disengaged because participation felt pointless, not because they didn\u2019t care." },
      { h:"The intervention", figure:"Figure — redistributed decision rights", body:"We facilitated a redesign of decision rights: clear committee mandates, a lightweight approval path, and a standing sync that surfaced blockers early. The council left with a written plan of action and owners for each change." },
    ],
    components:{ title:"The Diagnostic Lens", items:[
      { name:"Symptom", def:"What the org reports feeling.", ex:"\u201COur members are unmotivated.\u201D" },
      { name:"System", def:"The structure actually producing the symptom.", ex:"Over-centralized decision-making." },
      { name:"Leverage", def:"The smallest change with the largest effect.", ex:"Redistributing approval authority." },
      { name:"Ownership", def:"Who carries each change forward.", ex:"Named committee leads, not \u2018everyone\u2019." },
    ]},
    questions:["Where in your org does work wait on a single person?","Is your most-cited problem a symptom or a system?","If you redistributed one decision, which would unlock the most?"],
    refs:["Cummings, T. & Worley, C. (2014). Organization Development and Change.","Beckhard, R. (1969). Organization Development: Strategies and Models."],
    related:["organization-identity","reviving-volunteer-base"],
  },
  {
    id:"reviving-volunteer-base", kind:"case", conf:"members", cat:"Case Study",
    title:"Reviving a Disengaged Volunteer Base", read:"10 min", author:"Consultancy Team A", date:"Feb 2025", dateSort:202502,
    topics:["Retention","Culture"],
    client:"A youth non-profit (anonymized)",
    dek:"A members-only case study on rebuilding belonging after a burnout cycle thinned an org\u2019s active volunteers.",
    abstract:"After an intense campaign season, a youth non-profit watched its active volunteers drop by half. This case examines how we helped them move from a transactional, task-first culture to one where volunteers felt seen — and why retention recovered without adding a single new program.",
    sections:[
      { h:"Burnout is a structure problem too", figure:"Diagram — the burnout-to-exit pipeline", body:"Volunteers rarely leave in anger; they drift when effort stops feeling meaningful. We traced the drift to a cycle where only output was acknowledged, never the people producing it." },
      { h:"Designing belonging", figure:"Figure — recognition and rest, built into the calendar", body:"The intervention built recognition and rest into the org\u2019s rhythm rather than leaving them to chance: lightweight check-ins, visible appreciation, and protected downtime between pushes." },
    ],
    components:{ title:"Three Levers of Retention", items:[
      { name:"Meaning", def:"Connecting tasks to the mission.", ex:"\u201CYour booth onboarded 40 new members.\u201D" },
      { name:"Belonging", def:"Being known beyond your output.", ex:"Check-ins that aren\u2019t about deliverables." },
      { name:"Rest", def:"Recovery designed into the calendar.", ex:"A deliberate pause after big pushes." },
    ]},
    questions:["When did your org last thank someone for who they are, not what they shipped?","Where is rest assumed rather than scheduled?","Which of your most reliable people are quietly closest to drifting?"],
    refs:["Maslach, C., & Leiter, M. (2016). Understanding the burnout experience.","Cummings, T. & Worley, C. (2014). Organization Development and Change."],
    related:["diagnosing-stalled-council","organization-identity"],
  },
  {
    id:"facilitating-difficult-conversations", kind:"article", conf:"members", cat:"Methods",
    title:"Facilitating Difficult Conversations", read:"8 min", author:"CODE Consultants", date:"Jan 2025", dateSort:202501,
    topics:["Facilitation","Leadership"],
    dek:"A members-only field guide for holding the hard, necessary conversations OD work surfaces.",
    abstract:"OD work routinely surfaces tensions an org has been avoiding. This guide gives consultants a structure for facilitating those conversations so they build trust rather than fracture it — staying curious, naming dynamics, and landing on shared commitments.",
    sections:[
      { h:"Prepare the container", figure:"Diagram — psychological safety before content", body:"Before content comes safety. People speak honestly only when they believe candor won\u2019t be used against them, so the facilitator\u2019s first job is to establish how the conversation will be held." },
    ],
    components:{ title:"The Facilitator\u2019s Stance", items:[
      { name:"Curiosity", def:"Assume you\u2019re missing context.", ex:"\u201CHelp me understand what led here.\u201D" },
      { name:"Naming", def:"Make the dynamic discussable.", ex:"\u201CI notice we keep avoiding this.\u201D" },
      { name:"Commitment", def:"Convert insight into agreements.", ex:"\u201CWhat will each of us do differently?\u201D" },
    ]},
    questions:["What conversation has your org been postponing?","What would make it safe enough to have?","What single commitment would signal real change?"],
    refs:["Stone, D., Patton, B., Heen, S. (1999). Difficult Conversations.","Schein, E. (2013). Humble Inquiry."],
    related:["human-centered-design","reviving-volunteer-base"],
  },
  {
    id:"vision-mission-recalibration", kind:"article", conf:"members", cat:"Frameworks",
    title:"Vision & Mission Recalibration", read:"9 min", author:"CODE Consultants", date:"Dec 2024", dateSort:202412,
    topics:["Vision & Mission","Org Identity"],
    dek:"A members-only framework for re-grounding an org whose vision and mission have drifted from its reality.",
    abstract:"Vision and mission statements decay quietly. They get written once, then the org changes around them until the words no longer describe what anyone actually does. This framework helps a consultant guide an org through recalibration — honoring the founding intent while telling the truth about the present.",
    sections:[
      { h:"Drift is normal", figure:"Diagram — stated vs. enacted mission over time", body:"A gap between the stated and the enacted mission isn\u2019t failure; it\u2019s a signal the org has grown. Recalibration closes the gap deliberately instead of letting it widen." },
    ],
    components:{ title:"The Recalibration Pass", items:[
      { name:"Honor", def:"Name what the founding vision got right.", ex:"The enduring why." },
      { name:"Tell the truth", def:"Describe what the org actually does now.", ex:"The enacted mission." },
      { name:"Re-ground", def:"Write statements that fit both.", ex:"Aspirational, but honest." },
    ]},
    questions:["When did you last read your vision aloud as a group?","Where does your stated mission overpromise?","What are you doing now that your mission doesn\u2019t yet name?"],
    refs:["Collins, J. & Porras, J. (1996). Building Your Company\u2019s Vision. HBR.","Cummings, T. & Worley, C. (2014). Organization Development and Change."],
    related:["organization-identity","diagnosing-stalled-council"],
  },
  {
    id:"restructuring-student-government", kind:"case", conf:"confidential", cat:"Case Study",
    title:"Restructuring a Student Government", read:"15 min", author:"Consultancy Team B", date:"Mar 2025", dateSort:202503,
    topics:["Structure","Change Mgmt","Leadership"],
    client:"Confidential engagement",
    dek:"A confidential engagement record. Access is limited to the assigned consultancy team and content admins.",
    abstract:"This case study contains identifying details from an ongoing engagement and is restricted.",
    locked:true,
    related:["diagnosing-stalled-council"],
  },
];

// current user's saved state
const FAVORITES = ["human-centered-design","diagnosing-stalled-council"];
const LISTS = [
  { id:"frameworks", name:"Frameworks to reuse", items:["human-centered-design","vision-mission-recalibration"], color:"var(--a-steel)" },
  { id:"council-engagement", name:"Council engagement prep", items:["diagnosing-stalled-council","reviving-volunteer-base","organization-identity"], color:"var(--navy-deep)" },
];

// threaded member comments per item
const LIB_COMMENTS = {
  "diagnosing-stalled-council":[
    { id:1, author:"Karl Reyes", nick:"Karl", role:"Consultant", time:"2d ago", own:false,
      body:"The symptom-vs-system framing is exactly what we needed for our current client. Did the council push back on redistributing decision rights?",
      replies:[
        { id:11, author:"Mara Lim", nick:"Mara", role:"Content Admin", time:"1d ago", own:false,
          body:"Great question — adding a short note in the abstract about handling that pushback. It came up a lot in debrief." },
        { id:12, author:"Bea Mendoza", nick:"Bea", role:"Consultant", time:"22h ago", own:true,
          body:"We hit the same resistance. What helped was framing it as relieving the two overloaded officers, not taking power from them." },
      ] },
    { id:2, author:"Jio Santos", nick:"Jio", role:"Consultant", time:"3d ago", own:false,
      body:"Saving this to our engagement list. The diagnostic grid figure would be great as a standalone handout.", replies:[] },
  ],
  "human-centered-design":[
    { id:1, author:"Bea Mendoza", nick:"Bea", role:"Consultant", time:"5d ago", own:true,
      body:"The four-components breakdown is such a clean way to teach this to first-time facilitators.", replies:[] },
  ],
};

Object.assign(window, { LIB_TOPICS, LIBRARY, FAVORITES, LISTS, LIB_COMMENTS });
