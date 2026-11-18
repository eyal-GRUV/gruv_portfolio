// Media buying page: the same worktable, only Meta ads with their numbers. Shared by index.html and grid.html.
// Numbers checked 2026-11-17 against the ad accounts (Light Table DB and lifetime insights). FORZA: Sep 1–30 vs Oct 12–Nov 17, 2026,
// with Oct 22 left out (a website pixel glitch reported 71 leads from 6 clicks on one ad).
const M = (key, o, title, extra = {}) => ({ key, o, src: `media/${key}.mp4`, poster: `media/${key}.jpg`, prev: `media/${key}.mp4`, title, ...extra });
const UP = (key, o, file, title, extra = {}) => ({ key, o, src: `../media/${file}.mp4`, poster: `../media/${file}.jpg`, prev: `../media/${file}.mp4`, title, ...extra });
const MO = (key, o, title) => ({ key, o, src: `../motion/media/${key}.mp4`, poster: `../motion/media/${key}.jpg`, prev: `../motion/media/${key}.mp4`, title });

export const ZONES = [
  {
    id: "forza", n: "01", label: "FORZA", idx: "Four Florida charter schools, run by me since Oct 2026",
    blurb: "Four tuition-free charter schools in Florida. I took over their Meta accounts on Oct 8, 2026, rebuilt the campaigns on Oct 12 and made the new ads. September vs. Oct 12–Nov 17.",
    notes: ["Cost per lead $60.49 → $24.79", "Leads a day 3.4 → 6.7", "Spend a day $204 → $166", "Lead events on 4 of 4 pixels", "One ad set per session date"],
    groups: [
      { label: "Before and after", cases: true, role: "forza",
        process: ["Audit", "Fix tracking", "Rebuild", "New ads", "Read daily", "Next round"], items: [
        M("nrca-sessions", "v", "North River · Info session", {
          meta: "North River Charter Academy · Parrish, FL · Nov 2026",
          cardTitle: "Info session ads: one ad set per date",
          stats: [["−60%", "Cost per lead: $38.40 → $15.52"], ["$9.39", "Per sign-up, Nov 4 STEAM session (22)"]],
          hook: "“See what happens at North River after the bell.”" }),
        M("pca-tour", "v", "Parrish · School tour", {
          meta: "Parrish Charter Academy · Parrish, FL · Nov 2026",
          cardTitle: "A tour ad for every session date",
          stats: [["−50%", "Cost per lead: $48.60 → $24.37"], ["$17.39", "Per sign-up, Nov 13 tour (9)"]],
          hook: "“Soccer to cheer, music to theater: come see it.”" }),
        M("occs-sofia", "v", "Oak Creek · Sofía (Spanish)", {
          meta: "Oak Creek Charter School · Bonita Springs, FL · Spanish",
          cardTitle: "Tracking fixed, then a student tells it in Spanish",
          stats: [["−70%", "Cost per lead: $163.28 → $48.73"], ["$8.98", "Per lead on this ad (5)"]],
          hook: "“Hola, me llamo Sofía y esto es Oak Creek…”" }),
        M("gccas-whatsnew", "v", "Gulf Coast · What's new", {
          meta: "Gulf Coast Charter Academy South · Naples, FL",
          cardTitle: "“What's new this year” as the hook",
          stats: [["−56%", "Cost per lead: $111.09 → $49.17"], ["$32.64", "Per lead on this ad (6)"]],
          hook: "“This year at Gulf Coast Charter Academy South, your child gets real leadership experience…”" }),
      ] },
      { label: "More FORZA ads", role: "forza", items: [
        UP("steam-day", "v", "raw-northriver-steam-day", "North River · STEAM Day · 23 leads at $15.89"),
        M("pca-evergreen", "v", "Parrish · Evergreen · 8 leads at $24.38"),
        M("pca-student", "v", "Parrish · 2027–28 · 6 leads at $20.68"),
      ] },
    ],
  },
  {
    id: "ugc", n: "02", label: "AI UGC ads", idx: "Ads I made, with their lifetime results",
    blurb: "AI UGC ads I made for RAW's school accounts: AI only in the hook and the CTA, the school's real footage in the body. Lifetime results from Ads Manager. RAW's media buyers set the budgets.",
    notes: ["AI only in the hook and the CTA", "The school's real footage in the body", "Lifetime results, not a good week"],
    groups: [
      { label: "Ads with their numbers", cases: true, role: "ugc",
        process: ["Persona", "Script", "AI hook & CTA", "Real footage", "Edit", "Read the numbers"], items: [
        M("vtx-dad", "v", "PTAA Virtual Texas · AI dad", {
          meta: "PTAA Virtual Texas · Meta · Jul 2026",
          cardTitle: "An AI dad in his car, the account's biggest spender",
          stats: [["$11.79", "Per lead: 463 leads on $5,459"], ["2.8%", "CTR"]],
          hook: "“Parents in Texas, if you've been quietly looking for a school that actually gets your kid…”" }),
        M("nd-teacher", "v", "PTAA North Dallas · AI teacher", {
          meta: "PTAA North Dallas · Meta · Jun 2026",
          cardTitle: "An AI teacher for the hook, the school's real classes for the rest",
          stats: [["1.9×", "The account's CTR: 1.36% vs. 0.70%"], ["151", "Leads on $6,444"]],
          hook: "“Parents in Dallas, if you are looking for a school where your child is not just another face in the crowd…”" }),
        M("inf-teacher", "v", "Infinity Prep · AI teacher", {
          meta: "Infinity Prep · Clearwater, FL · Meta · Jul 2026",
          cardTitle: "Step Up scholarships at a new private school",
          stats: [["−18%", "Cost per lead vs. the account: $41.12"], ["154", "Leads on $6,332"]],
          hook: "“Parents in the Clearwater area, Step Up scholarships are now accepted at the newest private school in town.”" }),
      ] },
    ],
  },
  {
    id: "kalos", n: "03", label: "KALOS", idx: "DEXA body scans in four Bay Area cities",
    blurb: "Meta ads for KALOS's DEXA body scans in Palo Alto, San Francisco, San Jose and Walnut Creek: the same two ads in each city, each with its own price.",
    notes: ["2 concepts × 4 locations", "Each city with its own price", "The scan, the report, the price"],
    groups: [
      { label: "DEXA scans", role: "kalos", items: [
        MO("wall-kalos", "h", "KALOS · 4 locations"),
        MO("kalos-dexa", "v", "KALOS · DEXA timeline"), MO("kalos-metrics", "v", "KALOS · Body metrics"),
      ] },
    ],
  },
  { id: "about", n: "04", label: "About", idx: "Who I am and where I've worked", kind: "about", groups: [] },
];

export const REEL = { ...M("wall-mbuy", "h", "Every ad on this table"), reel: true,
  did: "The ads on this table playing at once: FORZA's four schools, the AI UGC ads and KALOS." };

export const ROLE = {
  forza: "Campaigns, budgets, tracking and the ad.",
  ugc: "Concept, script, AI and edit. RAW's media buyers set the budget.",
  kalos: "Meta ads and the creative.",
};

export const ME = {
  name: "Eyal Fabregat", photo: "../media/eyal.jpg",
  email: "fabregateyal@gmail.com",
  lead: "I'm Eyal Fabregat, from Argentina. For three years I've made Meta ads for US brands, mostly lead gen for charter schools. Since October 2026 I also run the accounts: tracking, campaigns, budgets and the ads that go in them.",
  detail: "Tracking first: every school sends its leads to its own pixel, with CAPI, before a dollar moves. Campaigns split by goal (website applications, instant forms, info sessions), one ad set per session date. Then the numbers, every day, by school and by ad. The biggest monthly budget I've run: $40,000.",
  worked: [
    "RAW (2023–2026): content lead and editor at a US performance agency, Meta ads for 20+ brands, most of them charter schools. Since Oct 2026 I also run the Meta accounts of FORZA's four Florida schools.",
    "KALOS (2025–2026): content lead and editor. I ran the Meta ads for its DEXA body scans in four Bay Area cities.",
    "TEAM23 (2021–2026): motion graphics and VFX for Heineken, Nissan, Mercado Libre and UNICEF; post-production coordinator on Netflix and Garnier campaigns.",
    "GRUV (2023–2026): my own studio. Ads and short form for 10+ brands.",
  ],
  does: [
    "Meta lead gen: instant forms and website applications",
    "Tracking: pixel, CAPI, lead events",
    "Campaign structure, audiences and budgets",
    "Ad creative: AI UGC, video, statics",
    "Daily reading by school and by ad",
    "English and Spanish",
  ],
  tools: "Meta Ads Manager, Events Manager, Meta Graph API, GoHighLevel, Claude, Higgsfield, Premiere Pro, After Effects.",
};
export const CONTACT = { title: "Write to me", mailto: true };
export const HERO = {
  didLabel: "What I did",
  sub: "EYAL FABREGAT · META MEDIA BUYER",
  lines: ["I run Meta lead-gen accounts for US schools and make the ads that go in them.",
    "Each ad sits next to its numbers, straight from Ads Manager."],
};
