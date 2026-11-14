// Breakdowns for the motion page: everything from the main page, plus the pieces only shown here.
// DRAFT (2026-11-13): written from the files themselves (names, frames, folders). Eyal to check clients, years and roles.
import BASE from "../breakdowns.js";

const TM = "Topmega (Lopez Hermanos) · Cyber Monday 2026";
const VOLTA = "Volta Bikes (Lopez Hermanos) · Cyber Monday 2026";
const CM = "Cyber Monday offers: one idea per ad, each in 9x16, 1x1 and 16x9.";
const SCHOOL = "Enrollment ads for a tuition-free school: one message, the offer, the CTA.";
const TEUCO = "Capitán Teuco (GRUV) · 2024";
const TEUCO_GOAL = "Illustrated scenes of an interactive story set in the Chaco. Every scene has an intro, a loop and an outro.";
const FICU = "FICU, Festival Internacional de Cine Universitario (GRUV) · 2026";
const FICU_GOAL = "Brand animation for the festival's identity: four ideas, each with an intro, a loop and an outro, in 16x9, 4x5 and 9x16, with alpha versions.";

export default {
  ...BASE,
  /* ---------- brand systems ---------- */
  "ficu-proyeccion": { client: FICU, goal: FICU_GOAL, did: "“Proyección”: a projector lights up and its rays open on the FICU logo. Intro and outro shown here." },
  "ficu-garabato": { client: FICU, goal: FICU_GOAL, did: "“Garabato”: scribble textures in the brand colours fill the screen and settle into the logo." },
  "ficu-mosaico": { client: FICU, goal: FICU_GOAL, did: "“Mosaico”: a wall of FICU letters in the brand palette resolves into the logo and the line “El cine nos encuentra”." },
  "ficu-bobina": { client: FICU, goal: FICU_GOAL, did: "“Bobina”: a film strip printed with the brand pattern unrolls across the frame and winds into the logo's reel." },
  "lpyd-qg-identity": { client: "LPYD Studio · Instagram · 2026", goal: "A post for the studio's own feed: the identity it built for Qigong18.",
    did: "Identity animation: the name, its definition, the palette and the look of the content, one card at a time." },
  /* ---------- animated ads ---------- */
  "tm-arranco": { client: TM, goal: CM, did: "“¡Arrancó el Cyber!”: a detective who already investigated and compared, then the offer and the CTA." },
  "tm-bomba": { client: TM, goal: CM, did: "“¡Promo bomba!”: a flash sale on an electric scooter, more than $470,000 off, on a sunburst." },
  "tm-descuento": { client: TM, goal: CM, did: "“Esa bici que venís mirando”: up to 30% off, with ring transitions between the bikes." },
  "volta-brest": { client: VOLTA, goal: CM, did: "Two versions of the Brest model, up to 10% off, with the specs on screen." },
  "volta-bomba": { client: VOLTA, goal: CM, did: "“¡Promo bomba!”: the Razz and the Viggo, the same performance, for two days only." },
  "volta-indumentaria": { client: VOLTA, goal: CM, did: "“¡Vestite para rodar!”: up to 30% off cycling apparel." },
  "occs-receipt": { client: "Oak Creek Charter School (RAW) · Meta · 2026", goal: SCHOOL,
    did: "“Here's your school bill”: a receipt prints line by line, tuition $0, meals $0, bus $0, and gets stamped “Tuition-free”." },
  "inf-paths": { client: "Infinity Prep (RAW) · Meta · 2026", goal: "Launch a new private college prep in Clearwater, Florida.",
    did: "“Most schools teach every kid the same way”: one line splits into paths, one per way of learning, and ends on the logo." },
  "csds-reading": { client: "Condra School (RAW) · Meta · 2026", goal: SCHOOL,
    did: "“Most schools wait until 2nd grade to test. We test as early as kindergarten.” Small groups, certified reading specialists, all of it free." },
  "vcs-hundreds": { client: "Victory (RAW) · Meta · 2026", goal: SCHOOL,
    did: "“At a big school, they're one of hundreds. Here, they're known by name.” Small classes, tuition-free." },
  "occs-belt": { client: "Oak Creek Charter School (RAW) · Meta · 2026", goal: SCHOOL, did: "“Strong body. Strong mind.” Tuition-free K–8." },
  "bcsri-seats": { client: "Beacon Charter School (RAW) · Meta · 2026", goal: SCHOOL, did: "“Seats available”: grades 9–12, now enrolling." },
  "nrca-enroll": { client: "North River Charter Academy (RAW) · Meta · 2026", goal: SCHOOL, did: "“Now enrolling”, hands-on STEAM, register today." },
  "pca-hscredit": { client: "Parrish Charter Academy (RAW) · Meta · 2026", goal: SCHOOL, did: "“High school credit in middle school”, with the credits counting up." },
  /* ---------- versioning ---------- */
  "wall-presidente": { client: "Brandy Presidente (TEAM23) · 2026",
    goal: "One campaign in four colourways and three ratios: 70 files in all.",
    did: "The “Hecho con puro México” close in 4 colourways × 16x9, 4x5 and 9x16. All 12 play in sync here." },
  "wall-topmega": { client: TM, goal: "Cyber Monday for Topmega: 14 concepts, 34 files across 9x16, 1x1 and 16x9.",
    did: "Every concept, from launch day to the last hours. The 14 vertical versions play in sync here." },
  "wall-volta": { client: VOLTA, goal: "Cyber Monday for Volta: 15 concepts, 25 files.",
    did: "One look for the whole set: bikes, apparel and flash sales. 14 of the vertical versions play here." },
  "wall-schools": { client: "RAW · 5 charter schools · Meta · Fall 2026",
    goal: "Tours, field days and info nights for 5 schools: 23 events, 46 files in 9x16 and 4x5.",
    did: "One system for every event: each school's colours and photos, the date and time, the CTA. 14 of them play here." },
  "wall-kalos": { client: "KALOS (DEXA scans) · Meta · 2026", goal: "The same two ads for four Bay Area locations, each with its own price.",
    did: "2 concepts × 4 locations: Palo Alto, San Francisco, San Jose and Walnut Creek." },
  /* ---------- kinetic type ---------- */
  "sinuberase-supers": { client: "Sinuberase probiotics (TEAM23) · 2025", goal: "Supers for the brand's spots.",
    did: "Typography animation: 17 supers delivered with alpha, from “Alivia la colitis desde la raíz” to the URL. Shown here on black." },
  "sinuberase-anim": { client: "Sinuberase probiotics (TEAM23) · 2025", goal: "Product animation for the brand's spots.",
    did: "Probiotic spheres float through the frame and the pack lands with “Recupera tu paz intestinal”; symptom bubbles tracked over live action." },
  "icbc-supers": { client: "ICBC Mall (TEAM23) · 2025", goal: "“Bomba” flight deals: a title for each offer.",
    did: "Typography animation: viajes, consolas, notebooks, 18 interest-free instalments, up to $250,000 back, and the logo close. Delivered with alpha." },
  "lpyd-notmagic": { client: "LPYD Studio · Instagram · 2026", goal: "A post for the studio's own feed.",
    did: "Kinetic type: “marketing is content, ads, SEO, automations… marketing isn't magic, but it feels like it with LPYD”." },
  /* ---------- illustration ---------- */
  "teuco-abuela": { client: TEUCO, goal: TEUCO_GOAL, did: "“Casa de la abuela”: a storm clears into a rainbow over grandma's house. A 30-second excerpt." },
  "teuco-museo": { client: TEUCO, goal: TEUCO_GOAL, did: "“El misterio del museo”: from the street into the hall, the camera moves between the animal silhouettes. A 30-second excerpt." },
  "teuco-universo": { client: TEUCO, goal: TEUCO_GOAL, did: "“Salto de emergencia”: the Earth turns among the planets. The scene's loop." },
  /* ---------- web & UI ---------- */
  "raw365-landing": { client: "RAW Enroll365 · website · 2026", goal: "Explain the agency's enrollment system on its landing page.",
    did: "Motion design for the landing video: the product's screens on laptops, a tour counter, dashboards and kinetic type over the voice-over. 25 seconds of the 2:38 video." },
  "mifel-screens": { client: "Banca Mifel (TEAM23) · 2025", goal: "A spot that shows the Mifel app in use.",
    did: "UI animation and VFX: the app's screens animated and tracked onto the phones and the card terminal, the balance counting up, the cards fanning out." },
  "kalos-dexa": { client: "KALOS (DEXA scans) · Meta · 2026", goal: "Show what a DEXA scan tracks over time.",
    did: "Data animation: two scans side by side, body fat and lean mass counting to the real values, then the offer." },
  "kalos-metrics": { client: "KALOS (DEXA scans) · Meta · 2026", goal: "Show what a DEXA scan tracks over time.",
    did: "Animated charts: body fat, visceral fat and ALMI over time, then the offer." },
  "reel-motion": { client: "Eyal Fabregat · 2026", goal: "Under a minute of motion design.", did: "Brand systems, animated ads, versioning, kinetic type, illustration and UI, in the order of this table." },
};
