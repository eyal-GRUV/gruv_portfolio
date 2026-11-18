// Breakdowns for the media buying page. Numbers checked 2026-11-17 against the ad accounts.
// FORZA: September 2026 vs Oct 12–Nov 17, 2026 (Oct 22 left out: a website pixel glitch). Ad results are for the same window.
// AI UGC: lifetime results of each ad. RAW's media buyers set those budgets; the role says so.
import BASE from "../breakdowns.js";

const FZ = "(FORZA, through RAW) · Meta";
const BUILD = "Took the account over on Oct 8 and rebuilt it on Oct 12: an Enrollment campaign split into website applications and instant forms, and an Info Sessions campaign with one ad set per session, running only until that session. 10 miles around campus, Advantage+ audience and creative enhancements off.";

export default {
  ...BASE,
  /* ---------- FORZA ---------- */
  "nrca-sessions": { client: `North River Charter Academy, Parrish FL ${FZ} · Nov 2026`,
    goal: "Fill the Nov 4 in-person STEAM session and bring the school's cost per lead down.",
    did: `${BUILD} This ad: the session's date, time and campus on screen from the first frame.`,
    result: "22 sign-ups at $9.39 for this session. The school: $38.40 per lead in September (57 leads) → $15.52 (130 leads). The info sessions campaign alone: 38 sign-ups at $12.99." },
  "pca-tour": { client: `Parrish Charter Academy, Parrish FL ${FZ} · Nov 2026`,
    goal: "Fill the Nov 13 school tour.",
    did: `${BUILD} This ad: the tour's date and time, then the campus, from soccer to theater.`,
    result: "9 sign-ups at $17.39 from this ad (its static version: 5 at $8.49). The school: $48.60 per lead in September (23 leads) → $24.37 (67 leads)." },
  "occs-sofia": { client: `Oak Creek Charter School, Bonita Springs FL ${FZ} · Spanish`,
    goal: "Oak Creek's old campaign was optimising on a dataset that had recorded zero leads. Fix that, then reach the Spanish-speaking families.",
    did: "With the RAW team, moved the school's lead events to its own pixel with CAPI and started a clean Enrollment campaign. Then raised the ad set to $30 a day and swapped three old ads for three new ones. This ad: Sofía, a student, presents the school in Spanish.",
    result: "5 leads at $8.98 on this ad. The school: $163.28 per lead in September (9 leads) → $48.73 (22 leads). A Spanish carousel brought 11 more at $41.31." },
  "gccas-whatsnew": { client: `Gulf Coast Charter Academy South, Naples FL ${FZ}`,
    goal: "Bring down the cost per lead at the Naples campus.",
    did: `${BUILD} This ad opens on what's new this year, the Student Ambassador Program. Spanish copy runs beside it.`,
    result: "6 leads at $32.64 on this ad; the Spanish “Free K–8” static: 5 at $16.32. The school: $111.09 per lead in September (12 leads) → $49.17 (29 leads)." },
  "steam-day": { client: `North River Charter Academy, Parrish FL ${FZ} · Oct 2026`,
    goal: "Applications for 2026–27 from families new to Parrish.",
    did: "The offer on screen from the first frame: tuition-free K–6, hands-on STEAM, care 6:30–6. Running in the instant form ad set of the rebuilt Enrollment campaign.",
    result: "23 leads at $15.89 (the 4x5 cut, instant form), Oct 12–Nov 17." },
  "pca-evergreen": { client: `Parrish Charter Academy ${FZ}`,
    goal: "Applications for 2026–27, always on.",
    did: "“Parrish parents:” speaks to the families nearby; the school's students and campus carry the rest.",
    result: "8 leads at $24.38, Oct 12–Nov 17." },
  "pca-student": { client: `Parrish Charter Academy ${FZ} · Nov 2026`,
    goal: "Open enrollment for 2027–28.",
    did: "One of the 2027–28 campaigns, live since Nov 9: a student on the school's courts, “Now enrolling for 2027–28”.",
    result: "6 leads at $20.68. The four schools' 2027–28 campaigns together: 61 leads at $18.70." },
  /* ---------- AI UGC ---------- */
  "vtx-dad": { client: "PTAA Virtual Texas (RAW) · Meta · Jul 2026",
    goal: "Applications for PTAA's online school in Texas.",
    did: "Concept, script, AI dad and edit: a parent in his car talks to other parents who are quietly looking. RAW's media buyers set the budget.",
    result: "Lifetime: $5,459 spent, 463 leads at $11.79, 2.8% CTR. The account's biggest spender." },
  "nd-teacher": { client: "PTAA North Dallas (RAW) · Meta · Jun 2026",
    goal: "Applications for PTAA's North Dallas campus.",
    did: "Concept, script, AI teacher and edit. AI only in the hook and the CTA; the body is her voice over the school's real classes. RAW's media buyers set the budget.",
    result: "Lifetime: $6,444 spent, 151 leads at $42.67. CTR 1.36% vs. 0.70% for the account." },
  "inf-teacher": { client: "Infinity Prep, Clearwater FL (RAW) · Meta · Jul 2026",
    goal: "Launch a new private college prep that takes Step Up scholarships.",
    did: "Concept, script, AI teacher and edit. RAW's media buyers set the budget.",
    result: "Lifetime: $6,332 spent, 154 leads at $41.12, 18% under the account's cost per lead." },
  /* ---------- KALOS ---------- */
  "wall-kalos": { client: "KALOS (DEXA scans) · Meta · 2026", goal: "Book DEXA scans in four Bay Area cities.",
    did: "Ran the Meta ads and made them: 2 concepts × 4 locations (Palo Alto, San Francisco, San Jose, Walnut Creek), each with its own price." },
  "kalos-dexa": { client: "KALOS (DEXA scans) · Meta · 2026", goal: "Book DEXA scans: show what a scan tracks over time.",
    did: "Two scans side by side, body fat and lean mass counting to the real values, then the offer." },
  "kalos-metrics": { client: "KALOS (DEXA scans) · Meta · 2026", goal: "Book DEXA scans: show what a scan tracks over time.",
    did: "Animated charts: body fat, visceral fat and ALMI over time, then the offer." },
  "wall-mbuy": { client: "Eyal Fabregat · Meta ads · 2026", goal: "Every ad on this table, at once.",
    did: "FORZA's four schools, the AI UGC ads and KALOS." },
};
