// Motion-only page: the same worktable, only motion design, split by skill. Shared by index.html and grid.html.
const V = (yt, title) => ({ yt, title, o: "v", thumb: `../media/thumbs/${yt}.jpg`, prev: `../media/prev/${yt}.mp4` });
const H = (yt, title) => ({ yt, title, o: "h", thumb: `../media/thumbs/${yt}.jpg`, prev: `../media/prev/${yt}.mp4` });
const M = (key, o, title, extra = {}) => ({ key, o, src: `media/${key}.mp4`, poster: `media/${key}.jpg`, prev: `media/${key}.mp4`, title, ...extra });
const UP = (key, o, file, title) => ({ key, o, src: `../media/${file}.mp4`, poster: `../media/${file}.jpg`, prev: `../media/${file}.mp4`, title });

export const ZONES = [
  {
    id: "brand", n: "01", label: "Brand systems", idx: "Logo animation, identity, brand stings",
    blurb: "Logo animation and brand identity in motion: every idea with its intro, loop and outro, in every format.",
    notes: ["Intro, loop and outro for every idea", "Every format: 16x9 · 4x5 · 9x16", "Textures from the client's files", "Alpha versions for the editors"],
    swatches: true,
    groups: [
      { label: "FICU · festival identity", items: [
        M("ficu-proyeccion", "h", "FICU · Proyección"), M("ficu-mosaico", "h", "FICU · Mosaico"),
        M("ficu-bobina", "h", "FICU · Bobina"), M("ficu-garabato", "h", "FICU · Garabato"),
      ] },
      { label: "Campaigns & identity", items: [
        UP("presidente-900", "h", "t23-presidente-900", "Brandy Presidente · “Hecho con puro México”"),
        UP("presidente-duo", "h", "t23-presidente-duo", "Brandy Presidente · 900 ml + 200 ml"),
        H("Vd6dbzqx5T8", "Heineken · Encore"), H("5kg__k4jTmU", "Levité · Frescura Posta"),
        M("lpyd-qg-identity", "v", "Qigong18 · Identity"),
      ] },
    ],
  },
  {
    id: "ads", n: "02", label: "Animated ads", idx: "Social ads for retail, schools and fitness",
    blurb: "Animated ads for social: the offer on screen from the first second, one idea per ad.",
    notes: ["Offer on screen in the first second", "One idea per ad", "Inside the platform's safe zones", "Type that moves on the beat"],
    groups: [
      { label: "Cyber Monday 2026 · Topmega & Volta", items: [
        M("tm-arranco", "v", "Topmega · ¡Arrancó el Cyber!"), M("tm-bomba", "v", "Topmega · Promo bomba"), M("tm-descuento", "v", "Topmega · 30% off"),
        M("volta-brest", "v", "Volta · Brest"), M("volta-bomba", "v", "Volta · Promo bomba"), M("volta-indumentaria", "v", "Volta · ¡Vestite para rodar!"),
      ] },
      { label: "Topmega, Volta, Eclipsa, Kuka", items: [
        V("z_VTnXEuQug", "Volta · MTB Gen 2"), V("z3Nu0pv7kaY", "Cyber Monday"), V("SoX02zMLj2c", "Hot Sale"), V("1cqXkxQsIUY", "Volta · Gravel"),
        V("CGnE07KYyUQ", "TM · 12 installments"), V("24d0-T4_bBk", "TM · 20% off"), V("lr-jl1lcb2I", "Volta · MTB"), V("xM-pn44K53E", "TM · Hot Sale"),
        V("Tj9PdjKBwxk", "TM · Hot Sale MTB"), V("ErHjWb-1osg", "TM · Neptune"), V("ZTU6ILEVlpc", "Eclipsa · Pre Hot Sale"), V("bK1p5TCma7M", "Kuka · Animated"),
      ] },
      { label: "Schools · enrollment", items: [
        M("occs-receipt", "v", "Oak Creek · The school bill"), M("inf-paths", "v", "Infinity Prep · Paths"), M("csds-reading", "v", "Condra · Reading"),
        M("vcs-hundreds", "v", "Victory · Known by name"), M("occs-belt", "v", "Oak Creek · Strong body"), M("bcsri-seats", "v", "Beacon · Seats available"),
        M("nrca-enroll", "v", "North River · Now enrolling"), M("pca-hscredit", "v", "Parrish · High school credit"),
      ] },
    ],
  },
  {
    id: "versions", n: "03", label: "Versioning", idx: "One idea in every colourway, ratio and market",
    blurb: "One idea delivered in every colourway, ratio and market. Each wall plays a whole set in sync.",
    notes: ["70 files for one campaign", "59 files for one Cyber Monday", "46 files, 5 schools, one system", "Every ratio: 16x9 · 1x1 · 4x5 · 9x16"],
    groups: [
      { label: "Campaign sets", items: [
        M("wall-presidente", "h", "Brandy Presidente · 4 colourways × 3 ratios"),
        M("wall-topmega", "h", "Topmega · Cyber Monday · 14 concepts"),
        M("wall-volta", "h", "Volta · Cyber Monday · 15 concepts"),
        M("wall-schools", "h", "Info sessions · 5 schools"),
        M("wall-kalos", "h", "KALOS · 4 locations"),
      ] },
    ],
  },
  {
    id: "type", n: "04", label: "Kinetic type", idx: "Supers, titles and type that moves",
    blurb: "Supers and titles for TV and social spots, delivered with alpha, and type that carries the whole piece.",
    notes: ["Delivered with alpha", "Read time before style", "The client's own typefaces"],
    groups: [
      { label: "Supers & titles", items: [
        M("sinuberase-supers", "h", "Sinuberase · Supers"), M("icbc-supers", "h", "ICBC Mall · Vuelos supers"), H("p-KileNty5w", "ICBC Mall"),
        M("sinuberase-anim", "h", "Sinuberase · Product animation"),
        H("d2JHtBoSxBg", "Ofelia Fernández · ¿Qué le pasa a nuestra generación?"), M("lpyd-notmagic", "v", "LPYD · Marketing isn't magic"),
      ] },
    ],
  },
  {
    id: "illo", n: "05", label: "Illustration", idx: "Illustrated 2D scenes",
    blurb: "Illustrated 2D scenes, animated in layers. 30-second excerpts.",
    notes: ["Intro, loop and outro for every scene", "Layered parallax", "Weather and light that change"],
    groups: [
      { label: "Capitán Teuco", items: [
        M("teuco-abuela", "h", "Capitán Teuco · Casa de la abuela"), M("teuco-museo", "h", "Capitán Teuco · El misterio del museo"),
        M("teuco-universo", "h", "Capitán Teuco · Salto de emergencia"),
      ] },
    ],
  },
  {
    id: "web", n: "06", label: "Web & UI", idx: "Landing video, app screens, data on screen",
    blurb: "Product and UI in motion: a landing-page video, app screens tracked onto phones, and data that animates to the real numbers.",
    notes: ["UI from the real product", "Numbers animate to the real data", "Screens tracked onto the shot"],
    groups: [
      { label: "Product & UI", items: [
        M("raw365-landing", "h", "RAW Enroll365 · Landing video"), M("mifel-screens", "h", "Mifel · App on screen"),
        M("kalos-dexa", "v", "KALOS · DEXA timeline"), M("kalos-metrics", "v", "KALOS · Body metrics"),
      ] },
    ],
  },
  { id: "about", n: "07", label: "About", idx: "Who I am and where I've worked", kind: "about", groups: [] },
];

export const REEL = { ...M("reel-motion", "h", "Motion reel"), prev: "media/reel-motion-prev.mp4", reel: true,
  did: "Under a minute of motion design, in the order of this table: brand systems, animated ads, versioning, kinetic type, illustration and UI." };

export const ROLE = {
  brand: "Logo and brand animation.",
  ads: "Animation and motion design.",
  versions: "Animation and every version.",
  type: "Typography animation.",
  illo: "2D animation.",
  web: "Motion design and UI animation.",
};

export const ME = {
  name: "Eyal Fabregat", photo: "../media/eyal.jpg",
  email: "fabregateyal@gmail.com",
  lead: "I'm Eyal Fabregat, a motion designer and video editor from Argentina. For the last 6 years I've made motion graphics, animated ads and edits for brands in the US and Latin America, most of it remote, working with US teams every day.",
  detail: "I'm picky about the details. Type that holds long enough to read. Every ratio checked against the platform's safe zones. Files named and versioned so anyone can open the project.",
  worked: [
    "TEAM23 (2021–2026): motion graphics and VFX for Heineken, Nissan, Mercado Libre and UNICEF. In 2026, post-production coordinator on campaigns for Netflix, Mercado Libre, Nissan and Garnier.",
    "RAW (2023–2026): content lead and editor at a US performance agency. Short-form and animated ads for 20+ brands.",
    "KALOS (2025–2026): content lead and editor. Short form and Meta ads for a US fitness app.",
    "LPYD (2025–2026): reels, ads, testimonials and course videos for wellness brands.",
    "GRUV (2023–2026): my own studio. Brand animation and short form for 10+ brands.",
  ],
  does: [
    "Motion graphics and brand animation",
    "Animated ads in every ratio and colourway",
    "Kinetic typography and supers",
    "2D animation",
    "VFX and screen comps",
    "Editing, sound and color",
  ],
  tools: "After Effects, Premiere Pro, Photoshop, Illustrator, Frame.io, Higgsfield, ChatGPT, Claude.",
};
export const CONTACT = { title: "Write to me", mailto: true };
export const HERO = {
  didLabel: "What I did",
  sub: "EYAL FABREGAT · MOTION DESIGNER",
  lines: ["Brand animation, animated ads, versioning, kinetic type, illustration and UI for brands in the US and Latin America.",
    "The notes around each piece are how it got made."],
};
