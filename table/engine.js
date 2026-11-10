// The 3D worktable: shared by every portfolio page. Each page sets window.SITE (content) and then imports this.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const { ZONES, REEL, ROLE, ME, CONTACT, BD, HERO } = window.SITE;

/* =====================================================================
   02) RENDERER / SCENE  (night: a desk lamp over the table, screens glowing)
   ===================================================================== */
const canvas = document.getElementById("scene");
const IS_TOUCH = matchMedia("(pointer: coarse)").matches;
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
} catch (e) {
  location.replace("grid.html");
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, IS_TOUCH ? 1.75 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const EXPOSURE = 0.95, SPOT_ROOM = 0.4, SPOT_SCREENS = 0.5; // how far the room and the other screens go down while one plays
let spot = 0;
renderer.toneMappingExposure = EXPOSURE;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const MAX_ANISO = renderer.capabilities.getMaxAnisotropy();

const scene = new THREE.Scene();
scene.background = new THREE.Color("#07080b");
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(26, innerWidth / innerHeight, 0.1, 300);
const PITCH = THREE.MathUtils.degToRad(74);

// Night. The room is nearly dark: every screen lights the table around it, and desk lamps point at the papers.
// Lights come from two fixed pools that follow the view (a fixed count, so shaders never recompile).
const hemi = new THREE.HemisphereLight("#5a6f9c", "#070605", 0.18);
const moon = new THREE.DirectionalLight("#8aa2ff", 0.16);
moon.position.set(10, 14, -12);
scene.add(hemi, moon);
const SCREEN_LIGHTS = IS_TOUCH ? 4 : 8;
const PAPER_LAMPS = IS_TOUCH ? 2 : 3;
const screenLights = [], paperLamps = [];
for (let i = 0; i < SCREEN_LIGHTS; i++) {
  const l = new THREE.PointLight("#ffffff", 0, 4.2, 2);
  l.userData = { tgt: null, lvl: 0, col: new THREE.Color("#9cb8ff") };
  scene.add(l); screenLights.push(l);
}
for (let i = 0; i < PAPER_LAMPS; i++) {
  const s = new THREE.SpotLight("#ffcf96", 0, 0, 0.4, 0.7, 0);
  s.castShadow = i < (IS_TOUCH ? 1 : 2);
  s.shadow.mapSize.set(1024, 1024);
  s.shadow.bias = -0.0004; s.shadow.normalBias = 0.02;
  s.shadow.camera.near = 2; s.shadow.camera.far = 20;
  s.userData = { tgt: null, lvl: 0 };
  scene.add(s, s.target); paperLamps.push(s);
}

// average colour of an image or video frame: what a screen throws on the table
const avgCanvas = document.createElement("canvas"); avgCanvas.width = avgCanvas.height = 6;
const avgCtx = avgCanvas.getContext("2d", { willReadFrequently: true });
function avgOf(src) {
  try {
    avgCtx.drawImage(src, 0, 0, 6, 6);
    const d = avgCtx.getImageData(0, 0, 6, 6).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const n = d.length / 4;
    return new THREE.Color().setRGB(r / n / 255, g / n / 255, b / n / 255, THREE.SRGBColorSpace);
  } catch (e) { return null; }
}

/* =====================================================================
   03) TEXTURES
   ===================================================================== */
const loadingManager = new THREE.LoadingManager();
const fillEl = document.getElementById("fill");
loadingManager.onProgress = (_, done, total) => { fillEl.style.width = `${Math.round((done / total) * 100)}%`; };
const texLoader = new THREE.TextureLoader(loadingManager);
const texCache = new Map();
function imgTex(url) {
  if (texCache.has(url)) return texCache.get(url);
  const t = texLoader.load(url, (tt) => { tt.userData.avg = avgOf(tt.image); });
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = MAX_ANISO;
  t.userData.keep = true;
  texCache.set(url, t);
  return t;
}

function canvasTex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = MAX_ANISO;
  return t;
}

function rand(seed) { // deterministic, so the table looks the same every visit
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function wrapLines(g, text, maxW) {
  const words = text.split(" ");
  const lines = []; let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (g.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}
function paperBase(g, w, h, tint = "#f5f0e7") {
  g.fillStyle = tint; g.fillRect(0, 0, w, h);
  const r = rand(w * 7 + h);
  for (let i = 0; i < 2600; i++) { // paper fibre
    g.fillStyle = `rgba(80,60,40,${r() * 0.035})`;
    g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
}

let WOOD, WOOD_BUMP, MAT_GRID, PAPER_SHADOW, GLARE, GLOW, PLAY_DISC, PLAY_TRI;
function makeSharedTextures() {
  WOOD = canvasTex(2048, 1024, (g, w, h) => { // dark walnut: 3 boards per tile, flat-sawn figure, pores, a knot, wear
    const r = rand(42), TAU = Math.PI * 2;
    const wrapDx = (x, cx) => ((x - cx) % w + w * 1.5) % w - w / 2; // seamless along the grain
    g.fillStyle = "#3a2516"; g.fillRect(0, 0, w, h);
    const cuts = [0, h * (0.31 + r() * 0.06), h * (0.64 + r() * 0.06), h];
    for (let p = 0; p < 3; p++) {
      const y0 = cuts[p], ph = cuts[p + 1] - y0, yc = y0 + ph * (0.35 + r() * 0.3);
      g.save(); g.beginPath(); g.rect(0, y0, w, ph); g.clip();
      const tone = 0.78 + r() * 0.36;
      g.fillStyle = `rgb(${(88 * tone) | 0},${(57 * tone) | 0},${(34 * tone) | 0})`; g.fillRect(0, y0, w, ph);
      for (let i = 0; i < 16; i++) { // soft streaks
        g.fillStyle = r() < 0.55 ? `rgba(14,7,3,${0.06 + r() * 0.1})` : `rgba(130,88,52,${0.04 + r() * 0.07})`;
        g.fillRect(0, y0 + r() * ph, w, 3 + r() * 34);
      }
      const cx = r() * w, L = 260 + r() * 380, bulge = 0.5 + r() * 0.7; // the cathedral "eye" of the board
      for (let i = 0; i < 150; i++) {
        const d = (r() * 2 - 1) * ph * 0.75, k1 = 1 + ((r() * 4) | 0), k2 = 3 + ((r() * 9) | 0), f1 = r() * TAU, f2 = r() * TAU;
        const a1 = 1 + r() * 5, a2 = r() * 1.6;
        const dark = r() < 0.8;
        g.strokeStyle = dark ? `rgba(12,6,2,${0.08 + r() * 0.3})` : `rgba(150,104,62,${0.05 + r() * 0.1})`;
        g.lineWidth = 0.5 + r() * (dark ? 2.4 : 1.2);
        g.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const dx = wrapDx(x, cx), e = Math.exp(-((dx / L) ** 2));
          const y = yc + d * (1 - bulge * e) + Math.sin((x / w) * TAU * k1 + f1) * a1 + Math.sin((x / w) * TAU * k2 + f2) * a2;
          x ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
      }
      for (let i = 0; i < 2600; i++) { // pores: short dark dashes along the grain
        g.fillStyle = `rgba(8,4,1,${0.18 + r() * 0.38})`;
        g.fillRect(r() * w, y0 + r() * ph, 2 + r() * 8, r() < 0.8 ? 1 : 2);
      }
      const xj = r() * w; // a butt joint
      g.fillStyle = "rgba(6,3,1,.8)"; g.fillRect(xj, y0, 3, ph);
      g.fillStyle = "rgba(255,215,170,.07)"; g.fillRect(xj + 3, y0, 1, ph);
      if (p === 1) { // one knot
        const kx = (xj + w * (0.3 + r() * 0.4)) % w, ky = y0 + ph * (0.3 + r() * 0.4);
        for (let k = 9; k >= 0; k--) {
          g.strokeStyle = `rgba(10,5,2,${0.18 + (9 - k) * 0.05})`; g.lineWidth = 1 + r() * 1.5;
          g.beginPath(); g.ellipse(kx, ky, 8 + k * 7, 5 + k * 2.6, r() * 0.1, 0, TAU); g.stroke();
        }
        g.fillStyle = "rgba(14,7,3,.85)"; g.beginPath(); g.ellipse(kx, ky, 9, 6, 0, 0, TAU); g.fill();
      }
      g.restore();
      if (p) { // the seam above this board
        g.fillStyle = "rgba(4,2,1,.9)"; g.fillRect(0, y0 - 2, w, 4);
        g.fillStyle = "rgba(255,215,170,.06)"; g.fillRect(0, y0 + 2, w, 1);
      }
    }
    g.fillStyle = "rgba(4,2,1,.9)"; g.fillRect(0, 0, w, 2); g.fillRect(0, h - 2, w, 2);
    for (let i = 0; i < 140; i++) { // fine scratches and wear
      const x = r() * w, y = r() * h, a = (r() - 0.5) * 1.2, l = 15 + r() * 150;
      g.strokeStyle = `rgba(215,175,130,${0.03 + r() * 0.08})`; g.lineWidth = 0.4 + r() * 0.8;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    for (let i = 0; i < 16000; i++) { g.fillStyle = r() < 0.5 ? `rgba(255,225,190,${r() * 0.035})` : `rgba(0,0,0,${r() * 0.08})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1); }
  });
  WOOD_BUMP = canvasTex(2048, 1024, (g) => { g.filter = "grayscale(1) contrast(1.8) brightness(1.4)"; g.drawImage(WOOD.image, 0, 0); });
  WOOD_BUMP.colorSpace = THREE.NoColorSpace;
  WOOD_BUMP.wrapS = WOOD_BUMP.wrapT = THREE.RepeatWrapping;
  WOOD.wrapS = WOOD.wrapT = THREE.RepeatWrapping;

  MAT_GRID = canvasTex(512, 512, (g, w, h) => { // one 1x1 unit tile of the cutting mat
    g.fillStyle = "#2c5442"; g.fillRect(0, 0, w, h);
    const r = rand(7);
    for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.05})`; g.fillRect(r() * w, r() * h, 2, 2); }
    g.strokeStyle = "rgba(200,230,205,.26)"; g.lineWidth = 2;
    for (let i = 1; i < 5; i++) { const p = (i / 5) * w; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, h); g.moveTo(0, p); g.lineTo(w, p); g.stroke(); }
    g.strokeStyle = "rgba(220,240,222,.5)"; g.lineWidth = 3;
    g.strokeRect(1.5, 1.5, w - 3, h - 3);
  });
  MAT_GRID.wrapS = MAT_GRID.wrapT = THREE.RepeatWrapping;

  PAPER_SHADOW = canvasTex(256, 256, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.5);
    grd.addColorStop(0, "rgba(0,0,0,.6)"); grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  });

  GLARE = canvasTex(256, 256, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, "rgba(255,255,255,.0)");
    grd.addColorStop(0.42, "rgba(255,255,255,.0)");
    grd.addColorStop(0.5, "rgba(255,255,255,.5)");
    grd.addColorStop(0.62, "rgba(255,255,255,.0)");
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  });

  GLOW = canvasTex(256, 256, (g, w, h) => { // light a screen spills on the table
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.45, "rgba(255,255,255,.45)"); grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  });
  PLAY_DISC = canvasTex(256, 256, (g, w, h) => { // the play button's disc; its material tints it (dark, red on hover)
    g.fillStyle = "#fff"; g.beginPath(); g.arc(w / 2, h / 2, w * 0.47, 0, Math.PI * 2); g.fill();
  });
  PLAY_TRI = canvasTex(256, 256, (g, w, h) => { // ring + triangle, always white
    g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = w * 0.025;
    g.beginPath(); g.arc(w / 2, h / 2, w * 0.455, 0, Math.PI * 2); g.stroke();
    const c = w / 2, r = w * 0.16;
    g.fillStyle = "#fff"; g.strokeStyle = "#fff"; g.lineJoin = "round"; g.lineWidth = w * 0.035;
    g.beginPath(); g.moveTo(c - r * 0.62, c - r); g.lineTo(c + r * 1.0, c); g.lineTo(c - r * 0.62, c + r); g.closePath(); g.fill(); g.stroke();
  });
  for (const t of [WOOD, MAT_GRID, PAPER_SHADOW, GLARE, GLOW, PLAY_DISC, PLAY_TRI]) t.userData.keep = true;
}

/* ---------- printed things (no handwriting: everything on the table came out of a printer) ---------- */
// one variable family for everything; width and weight do the talking
const FAM = `"scale-variable", Anybody, system-ui, sans-serif`;
const WD = { 50: "ultra-condensed", 62: "extra-condensed", 75: "condensed", 87: "semi-condensed", 100: "normal", 112: "semi-expanded", 125: "expanded", 150: "extra-expanded" };
const font = (wt, px, wd = 100, ital = false) => `${ital ? "italic " : ""}${wt} ${WD[wd]} ${Math.max(6, Math.round(px))}px ${FAM}`;
const INK = "#16130f", RED = "#e10600";

function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function fitFont(g, text, maxW, wt, px, wd, min = 8, ital = false) {
  let fs = px; g.font = font(wt, fs, wd, ital);
  while (g.measureText(text).width > maxW && fs > min) { fs -= 1; g.font = font(wt, fs, wd, ital); }
  return fs;
}

function noteTex(text, color = "#f3efe6", size = 300) { // a printed note card; "3. Hook in 2 s" prints the number big
  return canvasTex(size, size, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    const r = rand(text.length * 31);
    for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(80,60,40,${r() * 0.04})`; g.fillRect(r() * w, r() * h, 2, 2); }
    const m = w * 0.1;
    g.textBaseline = "top"; g.textAlign = "left";
    const num = text.match(/^(\d+)\.\s*(.*)$/);
    let body = text, y = m;
    if (num) {
      body = num[2];
      g.fillStyle = RED; g.font = font(600, h * 0.36, 62); g.fillText(num[1].padStart(2, "0"), m - 2, y - h * 0.02);
      y += h * 0.43;
    } else {
      g.fillStyle = RED; g.fillRect(m, y, w * 0.14, h * 0.025);
      y += h * 0.09;
    }
    g.fillStyle = INK;
    let fs = h * 0.15; g.font = font(800, fs, 75);
    let lines = wrapLines(g, body, w - 2 * m);
    while ((y + lines.length * fs * 1.04 > h - m || lines.length > 3) && fs > 14) { fs -= 2; g.font = font(800, fs, 75); lines = wrapLines(g, body, w - 2 * m); }
    lines.forEach((l, i) => g.fillText(l, m, y + i * fs * 1.04));
  });
}
function labelTex(text, pxPerU, wU, hU, sub = "") { // a printed label: section name, condensed and heavy
  const w = Math.round(wU * pxPerU), h = Math.round(hU * pxPerU);
  return canvasTex(w, h, (g) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = "#f6f3ed"; rrect(g, 1, 1, w - 2, h - 2, h * 0.12); g.fill();
    g.fillStyle = INK; rrect(g, 1, 1, h * 0.86, h - 2, h * 0.12); g.fill(); g.fillRect(h * 0.5, 1, h * 0.36, h - 2);
    g.fillStyle = "#f6f3ed"; g.textBaseline = "middle"; g.textAlign = "center";
    g.font = font(700, h * 0.46, 62); g.fillText(sub, h * 0.43, h * 0.55);
    g.textAlign = "left"; g.fillStyle = INK;
    const x0 = h * 1.08;
    const fs = fitFont(g, text.toUpperCase(), w - x0 - h * 0.25, 850, h * 0.5, 75, 12);
    g.fillText(text.toUpperCase(), x0, h * 0.55);
  });
}
function zoneCardTex(zone, pxPerU, wU, hU) { // phone layout: a banner
  const w = Math.round(wU * pxPerU), h = Math.round(hU * pxPerU);
  return canvasTex(w, h, (g) => {
    paperBase(g, w, h, "#f6f1e8");
    g.textBaseline = "middle"; g.textAlign = "left";
    g.fillStyle = RED; g.font = font(200, h * 0.78, 50); g.fillText(zone.n, h * 0.22, h * 0.56);
    const x0 = h * 0.22 + g.measureText(zone.n).width + h * 0.22;
    g.fillStyle = INK;
    fitFont(g, zone.label.toUpperCase(), w - x0 - h * 0.25, 900, h * 0.42, 125, 12);
    g.fillText(zone.label.toUpperCase(), x0, h * 0.55);
  });
}
function zoneCoverTex(zone, pxPerU, wU, hU) { // desktop: the section's title page, with what is inside it
  const w = Math.round(wU * pxPerU), h = Math.round(hU * pxPerU);
  return canvasTex(w, h, (g) => {
    paperBase(g, w, h, "#f7f3ec");
    const m = w * 0.1;
    g.textBaseline = "top"; g.textAlign = "left";
    const total = zone.groups.reduce((n, gr) => n + gr.items.length, 0);
    g.font = font(600, w * 0.046, 87, true);
    const foot = wrapLines(g, `${total} videos. ${IS_TOUCH ? "Tap" : "Click"} a screen to play or pause it, hold it for the breakdown.`, w - 2 * m);
    const footTop = h - m - foot.length * w * 0.062;
    const rows = zone.groups.map((gr) => [gr.label, String(gr.items.length).padStart(2, "0")]);
    const run = (k, draw) => {
      let y = m * 0.8;
      const T = (txt, x, yy) => { if (draw) g.fillText(txt, x, yy); };
      g.fillStyle = RED; g.font = font(100, w * 0.5 * k, 50); T(zone.n, m - w * 0.02, y);
      y += w * 0.5 * k;
      const words = zone.label.toUpperCase().split(" ");
      let fs = w * 0.16; g.font = font(900, fs, 125);
      while (Math.max(...words.map((wd) => g.measureText(wd).width)) > w - 2 * m && fs > 16) { fs -= 2; g.font = font(900, fs, 125); }
      g.fillStyle = INK;
      for (const wd of words) { T(wd, m, y); y += fs * 0.98; }
      y += w * 0.05 * k;
      g.fillStyle = "rgba(22,19,15,.72)"; g.font = font(450, w * 0.05 * k, 100);
      for (const l of wrapLines(g, zone.blurb, w - 2 * m)) { T(l, m, y); y += w * 0.068 * k; }
      y += w * 0.05 * k;
      if (draw) { g.fillStyle = INK; g.fillRect(m, y, w - 2 * m, 3); }
      y += w * 0.05 * k;
      g.fillStyle = RED; g.font = font(800, w * 0.038 * k, 150); T("ON THE TABLE", m, y); y += w * 0.08 * k;
      for (const [lab, val] of rows) {
        g.font = font(300, w * 0.1 * k, 62); g.fillStyle = INK;
        const vw = g.measureText(val).width;
        g.textAlign = "right"; T(val, w - m, y - w * 0.012 * k); g.textAlign = "left";
        g.font = font(750, w * 0.054 * k, 87);
        const ls = lab.split("\n").flatMap((part) => wrapLines(g, part, w - 2 * m - vw - w * 0.05));
        ls.forEach((l, li) => { g.fillStyle = li ? "rgba(22,19,15,.6)" : INK; T(l, m, y + w * 0.012 * k); y += w * 0.068 * k; });
        y += w * 0.05 * k;
      }
      return y;
    };
    let k = 1;
    while (run(k, false) > footTop - w * 0.05 && k > 0.5) k -= 0.03;
    run(k, true);
    g.fillStyle = "rgba(22,19,15,.6)"; g.font = font(600, w * 0.046, 87, true);
    foot.forEach((l, li) => g.fillText(l, m, footTop + li * w * 0.062));
  });
}
function caseCardTex(c, pxPerU, wU, hU) {
  const w = Math.round(wU * pxPerU), h = Math.round(hU * pxPerU);
  return canvasTex(w, h, (g) => {
    paperBase(g, w, h, "#f7f3ec");
    const m = w * 0.08;
    const footY = h - m - w * 0.04;
    const run = (k, draw) => {
      let y = m;
      const F = (wt, f, wd = 100, it = false) => { g.font = font(wt, w * f * k, wd, it); };
      const lines = (txt, f, wt, lh, col, wd = 100, it = false, max = 9) => {
        F(wt, f, wd, it);
        for (const l of wrapLines(g, txt, w - 2 * m).slice(0, max)) { if (draw) { g.fillStyle = col; g.fillText(l, m, y); } y += w * lh * k; }
      };
      g.textBaseline = "top";
      if (draw) { g.fillStyle = RED; g.fillRect(m, y, w * 0.12, 6); }
      y += 34 * k;
      lines(c.meta.toUpperCase(), 0.034, 800, 0.048, "rgba(22,19,15,.6)", 112);
      y += w * 0.02 * k;
      lines(c.cardTitle, 0.07, 850, 0.08, INK, 87);
      y += w * 0.05 * k;
      for (const [num, lab] of c.stats) {
        F(900, 0.22, 62); if (draw) { g.fillStyle = INK; g.fillText(num, m - 4, y); } y += w * 0.215 * k;
        if (draw) { g.fillStyle = RED; g.beginPath(); g.arc(m + 7, y + w * 0.022 * k, 6, 0, Math.PI * 2); g.fill(); }
        F(550, 0.042);
        for (const l of wrapLines(g, lab, w - 2 * m - 26)) { if (draw) { g.fillStyle = "rgba(22,19,15,.75)"; g.fillText(l, m + 22, y); } y += w * 0.054 * k; }
        y += w * 0.05 * k;
      }
      lines("HOOK", 0.034, 800, 0.05, INK, 150);
      lines(c.hook, 0.05, 500, 0.064, "rgba(22,19,15,.85)", 100, true, 4);
      return y;
    };
    let k = 1;
    while (run(k, false) > footY - w * 0.03 && k > 0.55) k -= 0.03;
    run(k, true);
    g.fillStyle = RED; g.font = font(800, w * 0.036, 112); g.textBaseline = "top";
    g.fillText("CLICK FOR THE FULL BREAKDOWN →", m, footY);
  });
}
function heroTex(pxPerU, wU, hU, compact) {
  const w = Math.round(wU * pxPerU), h = Math.round(hU * pxPerU);
  return canvasTex(w, h, (g) => {
    paperBase(g, w, h, "#f7f3ec");
    const run = (k, draw) => {
      const m = w * 0.065; let y = m * 0.85;
      const F = (wt, f, wd = 100, it = false) => { g.font = font(wt, w * f * k, wd, it); };
      g.textBaseline = "top"; g.textAlign = "left";
      F(900, compact ? 0.2 : 0.14, 150);
      if (draw) { g.fillStyle = INK; g.fillText("GRUV", m - 4, y); }
      const gw = g.measureText("GRUV").width;
      if (draw) { g.fillStyle = RED; g.beginPath(); g.arc(m + gw + w * 0.03 * k, y + w * (compact ? 0.15 : 0.105) * k, w * (compact ? 0.02 : 0.014) * k, 0, Math.PI * 2); g.fill(); }
      y += w * (compact ? 0.215 : 0.15) * k;
      const SUB = HERO.sub;
      F(800, compact ? 0.036 : 0.021, 150);
      for (const wd of [125, 100, 87, 75]) { if (g.measureText(SUB).width <= w - 2 * m) break; F(800, compact ? 0.036 : 0.021, wd); }
      if (g.measureText(SUB).width > w - 2 * m) F(800, (compact ? 0.036 : 0.021) * (w - 2 * m) / g.measureText(SUB).width, 75);
      if (draw) { g.fillStyle = "rgba(22,19,15,.6)"; g.fillText(SUB, m, y); }
      y += w * (compact ? 0.07 : 0.042) * k;
      F(750, compact ? 0.056 : 0.034, 87);
      for (const l of wrapLines(g, HERO.lines[0], w - 2 * m)) {
        if (draw) { g.fillStyle = INK; g.fillText(l, m, y); } y += w * (compact ? 0.068 : 0.041) * k;
      }
      y += w * 0.01 * k;
      F(450, compact ? 0.044 : 0.025);
      for (const l of wrapLines(g, HERO.lines[1], w - 2 * m)) {
        if (draw) { g.fillStyle = "rgba(22,19,15,.72)"; g.fillText(l, m, y); } y += w * (compact ? 0.056 : 0.034) * k;
      }
      y += w * 0.022 * k;
      if (draw) { g.fillStyle = INK; g.fillRect(m, y, w - 2 * m, 3); }
      y += w * 0.024 * k;
      F(900, compact ? 0.046 : 0.026, 112);
      const maxLab = Math.max(...ZONES.map((z) => g.measureText(z.label.toUpperCase()).width));
      const numX = m, labX = m + w * (compact ? 0.085 : 0.05) * k, blX = labX + maxLab + w * 0.035;
      for (const z of ZONES) {
        F(600, compact ? 0.042 : 0.024, 62);
        if (draw) { g.fillStyle = RED; g.fillText(z.n, numX, y + w * 0.001 * k); }
        F(900, compact ? 0.046 : 0.026, 112);
        if (draw) { g.fillStyle = INK; g.fillText(z.label.toUpperCase(), labX, y); }
        if (!compact) {
          let fs = w * 0.019 * k; g.font = font(450, fs, 87);
          while (g.measureText(z.idx).width > w - m - blX && fs > 10) { fs -= 1; g.font = font(450, fs, 87); }
          if (draw) { g.fillStyle = "rgba(22,19,15,.62)"; g.fillText(z.idx, blX, y + w * 0.004 * k); }
        }
        y += w * (compact ? 0.064 : 0.04) * k;
      }
      return y;
    };
    const footY = h - w * 0.065 - w * (compact ? 0.06 : 0.034);
    let k = ZONES.length <= 3 ? 1.4 : 1; // a short table index: bigger type instead of an empty sheet
    while (run(k, false) > footY - w * 0.02 && k > 0.5) k -= 0.03;
    run(k, true);
    const foot = compact ? "Tap a screen to play or pause it, hold it for the breakdown. Jump with the bar above ↑" : "Click a screen: it comes to the middle and plays. Click again to pause, hold it for the breakdown. Jump with the bar above ↑";
    g.fillStyle = "rgba(22,19,15,.55)"; g.textBaseline = "top";
    fitFont(g, foot, w * 0.87, 600, w * (compact ? 0.04 : 0.022), 87, 10, true);
    g.fillText(foot, w * 0.065, footY);
  });
}
function aboutTex(pxPerU, wU, hU, columns) { // a printed page: one column per half
  const w = Math.round(wU * pxPerU), h = Math.round(hU * pxPerU);
  return canvasTex(w, h, (g) => {
    paperBase(g, w, h, "#f8f5ee");
    if (columns.length === 2) { g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(w / 2 - 1, h * 0.05, 2, h * 0.9); }
    const colW = w / columns.length;
    g.textBaseline = "top"; g.textAlign = "left";
    columns.forEach((blocks, ci) => {
      const x0 = ci * colW, m = colW * 0.08;
      const run = (k, draw) => {
        let y = h * 0.055;
        for (const b of blocks) {
          if (b.h) { g.font = font(850, colW * 0.034 * k, 150); if (draw) { g.fillStyle = RED; g.fillText(b.h, x0 + m, y); } y += colW * 0.058 * k; }
          const fs = colW * (b.big ? 0.05 : 0.04) * k; g.font = font(b.big ? 650 : 450, fs, b.big ? 87 : 100);
          for (const t of b.lines) {
            for (const l of wrapLines(g, (b.bullet ? "— " : "") + t, colW - 2 * m)) { if (draw) { g.fillStyle = INK; g.fillText(l, x0 + m, y); } y += fs * 1.28; }
            y += fs * 0.3;
          }
          y += colW * 0.035 * k;
        }
        return y;
      };
      let k = 1;
      while (run(k, false) > h * 0.955 && k > 0.4) k -= 0.025;
      run(k, true);
    });
  });
}
function slateTex() {
  return canvasTex(600, 440, (g, w, h) => {
    g.fillStyle = "#1b1b1d"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 3;
    g.strokeRect(24, 24, w - 48, h - 48);
    g.beginPath(); g.moveTo(24, h * 0.42); g.lineTo(w - 24, h * 0.42); g.moveTo(w / 2, h * 0.42); g.lineTo(w / 2, h - 24); g.stroke();
    g.fillStyle = "#f2f2f2"; g.font = font(900, 64, 150); g.textBaseline = "middle";
    g.fillText("GRUV", 50, h * 0.24);
    g.font = font(800, 22, 112); g.fillStyle = "rgba(255,255,255,.6)";
    g.fillText("SCENE", 46, h * 0.52); g.fillText("TAKE", w / 2 + 22, h * 0.52);
    g.font = font(200, 96, 50); g.fillStyle = "#f2f2f2";
    g.fillText("01", 60, h * 0.74); g.fillText("03", w / 2 + 36, h * 0.74);
  });
}

/* =====================================================================
   04) OBJECTS
   ===================================================================== */
const PH = { w: 1.8, h: 3.2, sw: 1.66, sh: 2.95, r: 0.24, rs: 0.17 };   // phone, 9:16 screen
const PAD = { w: 2.75, h: 1.56, sw: 2.6, sh: 1.4625, r: 0.12, rs: 0.06 }; // tablet, 16:9 screen
const IDLE = 0.8; // idle screens a little dimmer than the one playing
const PLAY_DARK = new THREE.Color("#0b0b0d"), PLAY_RED = new THREE.Color("#e10600");

const world = new THREE.Group();
scene.add(world);
const pickables = [];
const devices = [];
const lampTargets = []; // papers a desk lamp points at: { x, z, r }

const bodyMatPhone = new THREE.MeshStandardMaterial({ color: "#1c1d21", metalness: 0.6, roughness: 0.35, envMapIntensity: 0.45 });
const bodyMatPad = new THREE.MeshStandardMaterial({ color: "#2a2c31", metalness: 0.65, roughness: 0.32, envMapIntensity: 0.45 });
const barMat = new THREE.MeshBasicMaterial({ color: "#e10600", toneMapped: false });
const trackMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.28, depthWrite: false, toneMapped: false });
for (const m of [bodyMatPhone, bodyMatPad, barMat, trackMat]) m.userData.keep = true;
const glareMat = () => new THREE.MeshBasicMaterial({ map: GLARE, transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });

function flatPlane(w, h, mat) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.rotation.x = -Math.PI / 2;
  return m;
}

function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
const geoCache = new Map();
function deviceGeos(o, s) {
  const key = o + s.toFixed(3);
  if (geoCache.has(key)) return geoCache.get(key);
  const D = o === "h" ? PAD : PH;
  const th = 0.07, bev = 0.014;
  const body = new THREE.ExtrudeGeometry(roundedRect(D.w * s - 2 * bev, D.h * s - 2 * bev, D.r * s), { depth: th, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 10 });
  body.rotateX(-Math.PI / 2); body.translate(0, bev, 0);
  const sw = D.sw * s, sh = D.sh * s;
  const screen = new THREE.ShapeGeometry(roundedRect(sw, sh, D.rs * s), 10);
  const uv = screen.attributes.uv, pos = screen.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + sw / 2) / sw, (pos.getY(i) + sh / 2) / sh);
  screen.rotateX(-Math.PI / 2);
  const glow = new THREE.PlaneGeometry(D.w * s * 1.9, D.h * s * 1.55); glow.rotateX(-Math.PI / 2);
  const bar = new THREE.PlaneGeometry(1, 0.035 * s + 0.012); bar.translate(0.5, 0, 0); bar.rotateX(-Math.PI / 2);
  const G = { body, screen, glow, bar, top: th + 2 * bev, sw, sh };
  for (const gg of [body, screen, glow, bar]) gg.userData.keep = true;
  geoCache.set(key, G);
  return G;
}

function addDevice(item, x, z, scale = 1, rotY = 0) {
  const G = deviceGeos(item.o, scale);
  const g = new THREE.Group();
  const glowMat = new THREE.MeshBasicMaterial({ map: GLOW, color: "#9cb8ff", transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const glow = new THREE.Mesh(G.glow, glowMat); glow.position.y = 0.0105;
  const body = new THREE.Mesh(G.body, item.o === "h" ? bodyMatPad : bodyMatPhone);
  body.castShadow = true;
  const thumbTex = imgTex(item.poster || item.thumb);
  const screenMat = new THREE.MeshBasicMaterial({ map: thumbTex, toneMapped: false });
  screenMat.color.setScalar(IDLE);
  const screen = new THREE.Mesh(G.screen, screenMat); screen.position.y = G.top + 0.002;
  const glare = new THREE.Mesh(G.screen, glareMat()); glare.position.y = G.top + 0.004;
  const D0 = item.o === "h" ? PAD : PH, inset = D0.rs * scale + 0.07 * scale, barW = G.sw - 2 * inset, barZ = G.sh / 2 - 0.11 * scale;
  const bar = new THREE.Mesh(G.bar, barMat); bar.position.set(-G.sw / 2 + inset, G.top + 0.007, barZ); bar.scale.x = 0.0001; bar.visible = false;
  const track = new THREE.Mesh(G.bar, trackMat); track.position.set(-G.sw / 2 + inset, G.top + 0.006, barZ); track.scale.x = barW; track.visible = false;
  // a play button on every screen: it goes away while the screen plays
  const playDiscMat = new THREE.MeshBasicMaterial({ map: PLAY_DISC, color: PLAY_DARK, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false });
  const playTriMat = new THREE.MeshBasicMaterial({ map: PLAY_TRI, transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false });
  const ps = Math.min(G.sw, G.sh) * 0.3;
  const play = new THREE.Group();
  const pDisc = flatPlane(ps, ps, playDiscMat), pTri = flatPlane(ps, ps, playTriMat); pTri.position.y = 0.001;
  play.add(pDisc, pTri); play.position.y = G.top + 0.008;
  g.add(glow, body, screen, glare, track, bar, play);
  g.position.set(x, 0, z); g.rotation.y = rotY;
  const D = item.o === "h" ? PAD : PH;
  g.userData = { item, hover: 0, act: 0, on: 0, ph: 0, baseY: 0, screenMat, thumbTex, glowMat, bar, play, playDiscMat, playTriMat, sw: G.sw, fw: D.w * scale, fh: D.h * scale, col: new THREE.Color("#9cb8ff"), live: null,
    glow, screen, sh: G.sh, rs: D.rs * scale, bd: null, track, barW };
  body.userData.dev = g; screen.userData.dev = g;
  pickables.push(body, screen);
  devices.push(g);
  world.add(g);
  item.__dev = g;
  return g;
}

function addPaper(tex, x, z, w, h, rotY = 0, { pick = null, tape = true, lift = 0.013, linked = null, lamp = true } = {}) {
  const g = new THREE.Group();
  const shadow = flatPlane(w * 1.08, h * 1.06, new THREE.MeshBasicMaterial({ map: PAPER_SHADOW, transparent: true, opacity: 0.5, depthWrite: false }));
  shadow.position.set(0.04, 0.0095, 0.06);
  const paper = flatPlane(w, h, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0, envMapIntensity: 0.12 }));
  paper.position.y = lift;
  paper.receiveShadow = true;
  g.add(shadow, paper);
  if (tape) {
    const tapeMat = new THREE.MeshStandardMaterial({ color: "#e10600", transparent: true, opacity: 0.78, roughness: 0.6, envMapIntensity: 0.1 });
    const t1 = flatPlane(Math.min(0.55, w * 0.3), 0.14, tapeMat); t1.position.set(-w * 0.32, lift + 0.002, -h / 2); t1.rotation.z = 0.12;
    const t2 = flatPlane(Math.min(0.55, w * 0.3), 0.14, tapeMat); t2.position.set(w * 0.32, lift + 0.002, -h / 2); t2.rotation.z = -0.1;
    g.add(t1, t2);
  }
  g.position.set(x, 0, z); g.rotation.y = rotY;
  world.add(g);
  if (lamp) lampTargets.push({ x, z, r: Math.hypot(w, h) / 2 });
  if (pick) { paper.userData.dev = g; g.userData = { item: pick, hover: 0, act: 0, baseY: 0, paper: true, linked, fw: w, fh: h }; pickables.push(paper); devices.push(g); }
  return g;
}

function addSticky(text, x, z, size = 0.6, rotY = 0, color) {
  const m = flatPlane(size, size, new THREE.MeshStandardMaterial({ map: noteTex(text, color), roughness: 0.85, envMapIntensity: 0.12 }));
  m.position.set(x, 0.012, z); m.rotation.z = rotY; m.receiveShadow = true;
  const sh = flatPlane(size * 1.1, size * 1.1, new THREE.MeshBasicMaterial({ map: PAPER_SHADOW, transparent: true, opacity: 0.4, depthWrite: false }));
  sh.position.set(x + 0.03, 0.0095, z + 0.04);
  world.add(sh, m);
  return m;
}

function addLabel(text, x, z, hU = 0.5, rotY = 0, sub = "") {
  const pxPerU = 300;
  const c = document.createElement("canvas").getContext("2d");
  c.font = font(850, hU * pxPerU * 0.5, 75);
  const wU = Math.max(1.0, c.measureText(text.toUpperCase()).width / pxPerU + hU * 1.08 + hU * 0.3);
  const m = flatPlane(wU, hU, new THREE.MeshStandardMaterial({ map: labelTex(text, pxPerU, wU, hU, sub), transparent: true, roughness: 0.55, envMapIntensity: 0.12 }));
  m.position.set(x + wU / 2, 0.012, z); m.rotation.z = rotY; m.receiveShadow = true;
  const sh = flatPlane(wU * 1.06, hU * 1.5, new THREE.MeshBasicMaterial({ map: PAPER_SHADOW, transparent: true, opacity: 0.35, depthWrite: false }));
  sh.position.set(x + wU / 2 + 0.03, 0.0095, z + 0.04);
  world.add(sh, m);
  return wU;
}

function addZoneCard(zone, x, z, wU = 2.7, hU = 0.56) {
  const m = flatPlane(wU, hU, new THREE.MeshStandardMaterial({ map: zoneCardTex(zone, 300, wU, hU), roughness: 0.9, envMapIntensity: 0.12 }));
  m.position.set(x + wU / 2, 0.013, z); m.receiveShadow = true;
  const sh = flatPlane(wU * 1.04, hU * 1.3, new THREE.MeshBasicMaterial({ map: PAPER_SHADOW, transparent: true, opacity: 0.45, depthWrite: false }));
  sh.position.set(x + wU / 2 + 0.03, 0.0095, z + 0.05);
  world.add(sh, m);
  return wU;
}

function addMat(x0, z0, x1, z1) {
  const w = x1 - x0, h = z1 - z0;
  const tex = MAT_GRID.clone(); tex.needsUpdate = true; tex.repeat.set(w, h);
  const edge = new THREE.MeshStandardMaterial({ color: "#244636", roughness: 0.9, envMapIntensity: 0.1 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.008, h), [edge, edge, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.88, envMapIntensity: 0.1 }), edge, edge, edge]);
  m.position.set(x0 + w / 2, 0.004, z0 + h / 2);
  m.receiveShadow = true;
  world.add(m);
}

function addPencil(x, z, rotY, len = 1.5) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, len, 6), new THREE.MeshStandardMaterial({ color: "#e8b83a", roughness: 0.55, envMapIntensity: 0.2 }));
  body.rotation.z = Math.PI / 2;
  const wood = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 6), new THREE.MeshStandardMaterial({ color: "#e2c08f", roughness: 0.8 }));
  wood.rotation.z = -Math.PI / 2; wood.position.x = len / 2 + 0.08;
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 6), new THREE.MeshStandardMaterial({ color: "#2b2b2b" }));
  lead.rotation.z = -Math.PI / 2; lead.position.x = len / 2 + 0.165;
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.09, 12), new THREE.MeshStandardMaterial({ color: "#b9b9b9", metalness: 0.9, roughness: 0.3, envMapIntensity: 0.4 }));
  ferrule.rotation.z = Math.PI / 2; ferrule.position.x = -len / 2 - 0.045;
  const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.09, 12), new THREE.MeshStandardMaterial({ color: "#e86f7a", roughness: 0.8 }));
  eraser.rotation.z = Math.PI / 2; eraser.position.x = -len / 2 - 0.135;
  g.add(body, wood, lead, ferrule, eraser);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.position.set(x, 0.054, z); g.rotation.y = rotY;
  world.add(g);
}

function addMug(x, z) {
  const g = new THREE.Group();
  const cer = new THREE.MeshStandardMaterial({ color: "#efe9e0", roughness: 0.35, envMapIntensity: 0.25, side: THREE.DoubleSide });
  const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.035, 48), new THREE.MeshStandardMaterial({ color: "#a47c4f", roughness: 0.95 }));
  cork.position.y = 0.018; cork.receiveShadow = true; cork.castShadow = true;
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.29, 0.5, 40, 1, true), cer);
  mug.position.y = 0.035 + 0.25; mug.castShadow = true;
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.295, 40), new THREE.MeshStandardMaterial({ color: "#2e1a0e", roughness: 0.12, metalness: 0.1 }));
  coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.035 + 0.42;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.305, 0.018, 8, 40), cer);
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.035 + 0.5;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 10, 24, Math.PI * 1.2), cer);
  handle.position.set(0.36, 0.035 + 0.25, 0); handle.rotation.z = -Math.PI * 0.6; handle.castShadow = true;
  g.add(cork, mug, coffee, rim, handle);
  g.position.set(x, 0, z);
  world.add(g);
}

function addCutter(x, z, rotY) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.95, 0.07, 0.2, 2, 0.03), new THREE.MeshStandardMaterial({ color: "#f2b31d", roughness: 0.45, envMapIntensity: 0.2 }));
  body.position.y = 0.035;
  const grip = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.075, 0.12, 2, 0.02), new THREE.MeshStandardMaterial({ color: "#2b2b2b", roughness: 0.7 }));
  grip.position.set(-0.12, 0.04, 0);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.13), new THREE.MeshStandardMaterial({ color: "#cfd3d6", metalness: 0.95, roughness: 0.2, envMapIntensity: 0.5 }));
  blade.position.set(0.56, 0.03, 0);
  g.add(body, grip, blade);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.position.set(x, 0, z); g.rotation.y = rotY;
  world.add(g);
}

function addSwatches(x, z) {
  const cols = [["#FF2E43", "Presidente red"], ["#BA1F2F", "Deep red"], ["#550C13", "Wine"], ["#7cc242", "Lime"], ["#1fc7c1", "Cyan"]];
  cols.forEach(([c, n], i) => {
    const t = canvasTex(160, 420, (g, w, h) => {
      g.fillStyle = "#f6f1e8"; g.fillRect(0, 0, w, h); g.fillStyle = c; g.fillRect(0, 0, w, h * 0.72);
      g.fillStyle = "#1d1712"; g.font = font(800, 20, 112); g.fillText(c.toUpperCase(), 12, h * 0.8); g.font = font(500, 18, 87); g.fillStyle = "rgba(29,23,18,.6)"; g.fillText(n, 12, h * 0.9);
    });
    const m = flatPlane(0.38, 1.0, new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, envMapIntensity: 0.12 }));
    const piv = new THREE.Group(); piv.position.set(x, 0.012 + i * 0.002, z + 0.45);
    m.position.set(0, 0, -0.45); piv.add(m); piv.rotation.y = -0.18 * i + 0.3; m.receiveShadow = true;
    world.add(piv);
  });
}

function addSlate(x, z, rotY) {
  const g = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: "#151517" });
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.88), [dark, dark, new THREE.MeshStandardMaterial({ map: slateTex(), roughness: 0.6, envMapIntensity: 0.15 }), dark, dark, dark]);
  board.position.y = 0.025;
  const stripes = canvasTex(400, 60, (gg, w, h) => { for (let i = 0; i < 10; i++) { gg.fillStyle = i % 2 ? "#f2f2f2" : "#151517"; gg.beginPath(); gg.moveTo(i * 44 - 20, h); gg.lineTo(i * 44 + 4, 0); gg.lineTo(i * 44 + 26, 0); gg.lineTo(i * 44 + 2, h); gg.fill(); } });
  const stick = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.05, 0.16), new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.5 }));
  stick.position.set(0.02, 0.05, -0.54); stick.rotation.y = 0.12;
  g.add(board, stick);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.position.set(x, 0, z); g.rotation.y = rotY;
  world.add(g);
}

function addPolaroid(x, z, rotY, wU = 1.5) {
  const hU = wU * 1.2;
  const frame = canvasTex(450, 540, (g, w, h) => {
    g.fillStyle = "#f4f1ea"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#1d1712"; g.textBaseline = "middle";
    g.font = font(850, 30, 125); g.fillText(ME.name.toUpperCase(), 30, h - 58);
    g.fillStyle = "rgba(29,23,18,.55)"; g.font = font(500, 19, 87); g.fillText("Argentina · editor & motion designer", 30, h - 28);
  });
  const grp = addPaper(frame, x, z, wU, hU, rotY, { tape: true, pick: CONTACT });
  const pw = wU * 0.88, ph = pw * (435 / 400);
  const photo = flatPlane(pw, ph, new THREE.MeshStandardMaterial({ map: imgTex(ME.photo), roughness: 0.45, envMapIntensity: 0.15 }));
  photo.position.set(0, 0.016, -hU / 2 + wU * 0.06 + ph / 2);
  grp.add(photo);
}

const WOOD_BUMP_SCALE = 1.2;
function addTable(x0, z0, x1, z1, alongZ) {
  const w = x1 - x0, d = z1 - z0;
  const [tex, bump] = [WOOD, WOOD_BUMP].map((t0) => {
    const t = t0.clone(); t.needsUpdate = true;
    if (alongZ) { t.rotation = Math.PI / 2; t.center.set(0.5, 0.5); t.repeat.set(d / 8, w / 4); }
    else t.repeat.set(w / 8, d / 4);
    return t;
  });
  const top = new THREE.MeshStandardMaterial({ map: tex, bumpMap: bump, bumpScale: WOOD_BUMP_SCALE, roughness: 0.5, metalness: 0, envMapIntensity: 0.32 });
  const side = new THREE.MeshStandardMaterial({ color: "#22160d", roughness: 0.7, envMapIntensity: 0.1 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), [side, side, top, side, side, side]);
  m.position.set(x0 + w / 2, -0.15, z0 + d / 2);
  m.receiveShadow = true;
  world.add(m);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: "#0b0b0d", roughness: 1, envMapIntensity: 0.05 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -2.2; floor.receiveShadow = true;
  world.add(floor);
}

/* =====================================================================
   05) LAYOUT  (desktop: the table runs left→right · phone: top→bottom)
   ===================================================================== */
let ORIENT = null;
let NAV = { zones: [], uMin: 0, uMax: 1 };
let FLAT = [];

function clearWorld() {
  for (const [dev, e] of [...pool]) evictVideo(dev, e);
  active = null;
  pickables.length = 0; devices.length = 0; lampTargets.length = 0;
  for (const l of [...screenLights, ...paperLamps]) { l.userData.tgt = null; l.userData.lvl = 0; l.intensity = 0; }
  world.traverse((o) => {
    if (o.geometry && !o.geometry.userData.keep) o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    mats.forEach((m) => { if (m.userData.keep) return; if (m.map && !m.map.userData.keep && !m.map.isVideoTexture) m.map.dispose(); m.dispose(); });
  });
  world.clear();
}

function buildDesktopV() {
  // Desktop: the table runs top→bottom and is wide enough to show a whole spread of screens at once.
  // Each screen drops into the highest free spot (left first), with a little give, so rows stagger instead of lining up;
  // tablets tuck into the gaps phones leave. Notes, swatches and the slate fill the holes that remain.
  const HW = 8.4;                                 // table half-width
  const XL = -HW + 0.55, XR = HW - 0.55;          // where things may sit
  const R = rand(2207), J = (a) => (R() * 2 - 1) * a;
  const zones = [];
  const placed = [];
  const GAP = 0.3;
  const fits = (x0, x1, z0, z1, list) => x0 >= XL - 1e-6 && x1 <= XR + 1e-6 && list.every((r) => x1 + GAP <= r.x0 || x0 >= r.x1 + GAP || z1 + GAP <= r.z0 || z0 >= r.z1 + GAP);
  // highest free spot at or below zMin, nearest prefX on that line; above band.zEnd only right of band.xMin (keeps reading order)
  function spot(w, h, zMin, prefX = XL, zMax = Infinity, band = null) {
    const list = placed.filter((r) => r.z1 + GAP > zMin);
    const n = Math.max(1, Math.round((XR - XL - w) / 0.12)), xs = [];
    for (let i = 0; i <= n; i++) xs.push(XL + ((XR - XL - w) * i) / n);
    xs.sort((a, b) => Math.abs(a - prefX) - Math.abs(b - prefX));
    for (let z = zMin; z + h <= zMax && z < zMin + 120; z += 0.06)
      for (const x0 of xs) {
        if (band && z < band.zEnd && x0 < band.xMin) continue;
        if (fits(x0, x0 + w, z, z + h, list)) return { x0, x1: x0 + w, z0: z, z1: z + h };
      }
    return null;
  }
  const take = (r) => { placed.push(r); return r; };
  const sink = (r, d) => { // let it settle a little lower when nothing is in the way
    const list = placed.filter((q) => q !== r);
    for (let k = d; k > 0.02; k *= 0.5) if (fits(r.x0, r.x1, r.z0 + k, r.z1 + k, list)) { r.z0 += k; r.z1 += k; break; }
    return r;
  };
  const footprint = (D, s, rot) => { const c = Math.abs(Math.cos(rot)), sn = Math.abs(Math.sin(rot)); return [D.w * s * c + D.h * s * sn, D.h * s * c + D.w * s * sn]; };
  const bottom = (from) => placed.slice(from).reduce((m, r) => Math.max(m, r.z1), -Infinity);
  const labelW = (text, hU = 0.42) => { const c = document.createElement("canvas").getContext("2d"); c.font = font(850, hU * 300 * 0.5, 75); return Math.max(1.0, c.measureText(text.toUpperCase()).width / 300 + hU * 1.38); };
  const TAB = 1.1;
  // each group is a block of whole columns: its tag on top, its screens in a small grid under it.
  // Blocks pack into COLS columns like bricks; the widths are chosen (small search) so the section ends level.
  const COLS = 7, CW = (XR - XL) / COLS;
  const IP = PH.w + 0.26, VG = 0.3, TAG = 0.42 + 0.26, BG = 0.95, TABS = (2 * IP - 0.26) / PAD.w * 0.97;
  const itemH = (it) => (it.o === "h" ? PAD.h * TABS : PH.h);
  const WASTE = 0.45, RAG = 0.3; // what a hole costs against a taller section
  function inner(items, c, T) { // lay a group out in c columns from z = T; returns slots and column bottoms
    const lt = Array(c).fill(T + TAG), slots = [];
    for (const it of items) {
      const s = it.o === "h" ? 2 : 1;
      let best = null;
      for (let k = 0; k + s <= c; k++) { const t = Math.max(...lt.slice(k, k + s)); if (!best || t < best.t - 0.2) best = { k, t }; }
      const h = itemH(it);
      slots.push({ it, k: best.k, s, z: best.t, h });
      for (let i = best.k; i < best.k + s; i++) lt[i] = best.t + h + VG;
    }
    return { slots, lt };
  }
  function planZone(groups, tops0) { // beam search over block widths and positions
    let beam = [{ tops: tops0, plan: [], pen: 0 }];
    groups.forEach((grp) => {
      const units = grp.items.reduce((n, it) => n + (it.o === "h" ? 2 : 1), 0);
      const cMin = Math.max(grp.items.some((it) => it.o === "h") ? 2 : 1, Math.ceil((labelW(grp.label) + 0.3) / IP));
      const next = [];
      for (const st of beam)
        for (let c = cMin; c <= Math.min(COLS, Math.max(cMin, units)); c++)
          for (let c0 = 0; c0 + c <= COLS; c0++) {
            const pv = st.plan[st.plan.length - 1]; // reading order: never above the group before; left of it only once that one is nearly done
            let T = Math.max(...st.tops.slice(c0, c0 + c));
            if (pv && c0 < pv.c0) T = Math.max(T, pv.T + TAG + 2.4); // on its next line
            const { lt } = inner(grp.items, c, T);
            const tops = st.tops.slice();
            let waste = 0;
            const lb = Math.max(...lt);
            for (let i = 0; i < c; i++) { waste += T - st.tops[c0 + i] + (lb - lt[i]) * 1.2; tops[c0 + i] = lb - VG + BG; } // space above it, and holes left inside it
            const rows = Math.ceil(units / c), aspect = rows > c + 1 ? (rows - c - 1) * 2.5 : 0;
            const order = pv && T < pv.T - 0.3 ? 40 : 0;
            const pen = st.pen + waste * WASTE + aspect + order + c0 * 0.02;
            next.push({ tops, plan: [...st.plan, { c0, c, T, B: lb }], pen, score: Math.max(...tops) + pen });
          }
      next.sort((x, y) => x.score - y.score);
      beam = next.slice(0, 120);
    });
    beam.forEach((st) => { const m = Math.max(...st.tops); st.final = m + st.pen + st.tops.reduce((n, t) => n + (m - t), 0) * RAG; });
    beam.sort((x, y) => x.final - y.final);
    return beam[0].plan;
  }
  function addRule(x0, x1, z) { // the hairline that runs from a tag across its block
    const m = flatPlane(x1 - x0, 0.022, new THREE.MeshBasicMaterial({ color: "#efe7d6", transparent: true, opacity: 0.32, depthWrite: false }));
    m.position.set((x0 + x1) / 2, 0.011, z); world.add(m);
  }
  function putBlock(grp, zone, gi, { c0, c, T }, z0) {
    const bw = c * IP - 0.26, bx0 = XL + c0 * CW + (c * CW - bw) / 2;
    const wL = addLabel(grp.label, bx0, T + 0.21, 0.42, J(0.01), String(gi + 1).padStart(2, "0"));
    take({ x0: bx0, x1: bx0 + wL, z0: T, z1: T + 0.42 });
    if (bx0 + wL + 0.25 < bx0 + bw) addRule(bx0 + wL + 0.15, bx0 + bw, T + 0.21);
    z0.groups.push({ label: grp.label, start: gi === 0 ? z0.start : T - 0.2 });
    for (const sl of inner(grp.items, c, T).slots) {
      const tab = sl.it.o === "h", sc = tab ? TABS : 1, rot = J(0.03);
      const w = (tab ? PAD.w : PH.w) * sc;
      const cx = bx0 + sl.k * IP + (sl.s * IP - 0.26) / 2 + J(0.04), cz = sl.z + sl.h / 2 + J(0.05);
      addDevice(sl.it, cx, cz, sc, rot);
      take({ x0: cx - w / 2, x1: cx + w / 2, z0: sl.z, z1: sl.z + sl.h });
      sl.it.__zone = zone; sl.it.__group = grp; FLAT.push(sl.it);
    }
  }
  function fillHoles(zTop, zBot, things) { // small things go where they fit inside the section; the rest under it
    let extra = zBot;
    for (const t of things) {
      const r = spot(t.w, t.h, zTop, XL + R() * (XR - XL), zBot) || spot(t.w, t.h, extra, XL + R() * (XR - XL));
      take(r); extra = Math.max(extra, r.z1 - 0.2);
      t.put((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2);
    }
    return Math.max(zBot, extra);
  }

  let z = 0;
  // intro: the title sheet, the showreel, the mug
  addPaper(heroTex(330, 5.5, 4.5, false), XL + 2.75, z + 2.25, 5.5, 4.5, -0.018);
  take({ x0: XL, x1: XL + 5.5, z0: z, z1: z + 4.5 });
  const reelS = 2.0, reelRot = 0.025;
  const [rw, rh] = footprint(PAD, reelS, reelRot);
  const rx = XL + 6.3, rz = z + 0.75;
  addLabel("Showreel", rx + 0.05, rz - 0.05, 0.42, -0.02, "00");
  addDevice(REEL, rx + rw / 2, rz + 0.3 + rh / 2, reelS, reelRot);
  take({ x0: rx, x1: rx + rw, z0: rz - 0.3, z1: rz + 0.3 + rh });
  addMug(XR - 0.7, z + 1.0); take({ x0: XR - 1.2, x1: XR, z0: z + 0.5, z1: z + 1.5 });
  addPencil(XL + 4.6, z + 4.95, 0.16);
  z += 5.6;

  ZONES.forEach((zone) => {
    const zt = z;
    const z0 = { id: zone.id, label: zone.label, n: zone.n, start: zt, groups: [] };
    zones.push(z0);
    const first = placed.length;
    if (zone.kind === "about") {
      addPaper(aboutTex(300, 6.8, 4.6, [
        [{ h: "ABOUT ME", lines: [ME.lead], big: true }, { h: "WHERE I'VE WORKED", lines: ME.worked, bullet: true }],
        [{ h: "WHAT I DO", lines: ME.does, bullet: true }, { h: "HOW I WORK", lines: [ME.detail] }, { h: "TOOLS", lines: [ME.tools] }, { h: "CONTACT", lines: [ME.email, "Click the page or the photo to write."], big: true }],
      ]), XL + 3.6, zt + 2.4, 6.8, 4.6, 0.012, { tape: false, pick: CONTACT });
      addPolaroid(XL + 8.6, zt + 1.9, -0.08, 1.7);
      addPencil(XL + 11.2, zt + 3.4, 0.5, 1.3);
      z = zt + 5.4;
      z0.end = z;
      return;
    }
    // the section's title page lies at its top-left; the screens spread around and under it
    const coverW = 2.15, coverH = 4.5;
    addPaper(zoneCoverTex(zone, 300, coverW, coverH), XL + coverW / 2 + 0.05, zt + coverH / 2 + 0.1, coverW, coverH, J(0.03));
    take({ x0: XL, x1: XL + coverW + 0.1, z0: zt, z1: zt + coverH + 0.2 });
    const things = [];
    let gs = zone.groups, go = 0;
    if (gs[0] && gs[0].cases) { // ads with their numbers: the process notes, then each phone with its result sheet
      const grp = gs[0], x0 = XL + coverW + 0.5;
      const wL = addLabel(grp.label, x0, zt + 0.21, 0.42, J(0.01), "01");
      take({ x0, x1: x0 + wL, z0: zt, z1: zt + 0.42 });
      addRule(x0 + wL + 0.15, XR, zt + 0.21);
      z0.groups.push({ label: grp.label, start: zt });
      const sz = zt + 1.06;
      let px = x0;
      (grp.process || []).forEach((p, i, a) => { addSticky(`${i + 1}. ${p}`, px + 0.31, sz + J(0.04), 0.62, J(0.06), i === a.length - 1 ? "#ffd1c7" : "#f3efe6"); px += 0.72; });
      if (px > x0) { take({ x0, x1: px, z0: sz - 0.36, z1: sz + 0.36 }); lampTargets.push({ x: (x0 + px) / 2, z: sz, r: (px - x0) / 2 }); }
      const cardW = 2.1, cardH = 3.05, blockW = PH.w + 0.15 + cardW;
      for (const c of grp.items) {
        const r = take(sink(spot(blockW, 3.3, sz + 0.66, x0), 0.3));
        const zc = (r.z0 + r.z1) / 2;
        const pd = addDevice(c, r.x0 + PH.w / 2, zc + J(0.08), 1, J(0.04));
        addPaper(caseCardTex(c, 420, cardW, cardH), r.x0 + PH.w + 0.15 + cardW / 2, zc + J(0.1), cardW, cardH, J(0.03), { pick: c, tape: true, linked: pd });
        c.__zone = zone; c.__group = grp; FLAT.push(c);
      }
      things.push({ w: 1.1, h: 0.4, put: (x, zz) => addCutter(x, zz, -0.25) });
      gs = gs.slice(1); go = 1;
    }
    {
      const tops0 = Array(COLS).fill(zt); tops0[0] = zt + coverH + 0.2 + BG;
      if (go) tops0.fill(bottom(first) + BG); // the other groups start under the ads
      planZone(gs, tops0).forEach((pl, gi) => putBlock(gs[gi], zone, gi + go, pl, z0));
      (zone.notes || []).forEach((t, i) => things.push({ w: 0.72, h: 0.72, put: (x, zz) => addSticky(t, x, zz, 0.68, J(0.07), i % 3 === 2 ? "#ffd1c7" : "#f3efe6") }));
      if (zone.swatches) things.push({ w: 1.3, h: 1.25, put: (x, zz) => addSwatches(x, zz - 0.45) });
      if (zone.slate) things.push({ w: 1.3, h: 1.05, put: (x, zz) => addSlate(x, zz, -0.2) });
      if (zone.id === "short") things.push({ w: 1.5, h: 0.3, put: (x, zz) => addPencil(x - 0.05, zz, -0.08, 1.3) });
    }
    let zb = bottom(first);
    zb = fillHoles(zt + 0.6, zb, things);
    addMat(XL - 0.35, zt - 0.3, XR + 0.35, zb + 0.35);
    z = zb + 1.0;
    z0.end = z;
  });
  const tableEnd = z + 0.2;
  addTable(-HW, -0.6, HW, tableEnd, true);
  return { zones, tableStart: -0.6, tableEnd, cross: [-HW, HW] };
}

function buildMobile() {
  const GAP = 0.24, MS = 0.72, COLS = [-0.7, 0.7];
  const MR = rand(77), MJ = (a) => (MR() * 2 - 1) * a;
  const zones = [];
  let z = 0;
  addPaper(heroTex(330, 2.7, 3.55, true), 0, z + 1.8, 2.7, 3.55, -0.015);
  z += 3.85;
  addLabel("Showreel", -1.3, z + 0.25, 0.42, -0.02, "00");
  z += 0.6;
  addDevice(REEL, 0, z + PAD.h / 2, 1.0);
  z += PAD.h + 0.75;
  for (const zone of ZONES) {
    const z0 = { id: zone.id, label: zone.label, n: zone.n, start: z, groups: [] };
    zones.push(z0);
    addZoneCard(zone, -1.3, z + 0.3, 2.6, 0.54);
    z += 0.85;
    if (zone.kind === "about") {
      addPolaroid(-0.45, z + 1.0, -0.06, 1.55);
      z += 2.1;
      addPaper(aboutTex(300, 2.75, 8.2, [[
        { h: "ABOUT ME", lines: [ME.lead], big: true }, { h: "WHAT I DO", lines: ME.does, bullet: true },
        { h: "WHERE I'VE WORKED", lines: ME.worked, bullet: true }, { h: "HOW I WORK", lines: [ME.detail] },
        { h: "TOOLS", lines: [ME.tools] }, { h: "CONTACT", lines: [ME.email, "Tap the page to write."], big: true },
      ]]), 0, z + 4.1, 2.75, 8.2, 0.006, { tape: false, pick: CONTACT });
      z += 8.6;
    } else {
      const matZ0 = z - 0.15;
      zone.groups.forEach((grp, gi) => {
        z0.groups.push({ label: grp.label, start: gi === 0 ? z0.start : z });
        addLabel(grp.label, -1.25, z + 0.22, 0.42, -0.012, String(gi + 1).padStart(2, "0"));
        z += 0.6;
        if (grp.cases) { // each ad, then the sheet with its numbers
          const S = 0.8;
          for (const c of grp.items) {
            const pd = addDevice(c, 0, z + (PH.h * S) / 2, S);
            z += PH.h * S + 0.25;
            addPaper(caseCardTex(c, 420, 2.5, 3.35), 0, z + 1.675, 2.5, 3.35, 0.01, { pick: c, tape: true, linked: pd });
            z += 3.35 + 0.5;
            c.__zone = zone; c.__group = grp; FLAT.push(c);
          }
          return;
        }
        let row = null;
        const flush = () => { if (!row) return; z += row.h + GAP; row = null; };
        for (const it of grp.items) {
          if (it.o === "h") { flush(); addDevice(it, MJ(0.06), z + PAD.h / 2, 1, MJ(0.035)); z += PAD.h + GAP; }
          else {
            if (!row || row.n >= 2) { flush(); row = { h: PH.h * MS + 0.22, n: 0 }; }
            addDevice(it, COLS[row.n] + MJ(0.05), z + (PH.h * MS) / 2 + (row.n ? 0.22 : -0.04), MS, MJ(0.045));
            row.n++;
          }
          it.__zone = zone; it.__group = grp; FLAT.push(it);
        }
        flush();
        z += 0.25;
      });
      addMat(-1.42, matZ0, 1.42, z - 0.1);
      if (zone.notes && zone.notes.length) {
        z += 0.2;
        const ns = zone.notes.slice(0, 2);
        ns.forEach((t, i) => addSticky(t, ns.length === 1 ? 0 : (i ? 0.62 : -0.62), z + 0.55, 1.05, (i ? 1 : -1) * 0.05, i ? "#ffd1c7" : "#f3efe6"));
        z += 1.25;
      }
      z += 0.3;
    }
    z0.end = z;
  }
  const tableEnd = z + 0.4;
  addTable(-1.55, -0.4, 1.55, tableEnd, true);
  return { zones, tableStart: -0.4, tableEnd, cross: [-1.55, 1.55] };
}

/* =====================================================================
   06) CAMERA / NAVIGATION
   ===================================================================== */
let camU = 0, targetU = 0, velU = 0;
const view = { dist: 10, lo: 5, hi: 5, span: 10, upp: 0.01, c: 0, barPx: 64 };

function frame() {
  const aspect = innerWidth / innerHeight;
  camera.aspect = aspect; camera.updateProjectionMatrix();
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const sn = Math.sin(PITCH), cs = Math.cos(PITCH);
  const barPx = document.querySelector(".bar").getBoundingClientRect().height;
  const yTop = 1 - (2 * (barPx + 6)) / innerHeight; // NDC just under the top bar
  const yBot = 1 - (2 * 66) / innerHeight;           // NDC just above the bottom controls
  view.barPx = barPx;
  if (ORIENT === "H") {
    // fit the whole table depth between the bar and the bottom controls (perspective makes the near edge bigger)
    const F = NAV.fit || NAV.cross;
    const h = (F[1] - F[0]) / 2 + 0.05;
    const dFar = (c) => ((h + c) * sn) / (yTop * t) - (h + c) * cs;
    const dNear = (c) => ((h - c) * sn) / (yBot * t) + (h - c) * cs;
    let lo = -h, hi = h;
    for (let i = 0; i < 40; i++) { const c = (lo + hi) / 2; if (dFar(c) > dNear(c)) hi = c; else lo = c; }
    view.c = (lo + hi) / 2;
    view.dist = dFar(view.c);
    const visW = 2 * view.dist * t * aspect;
    view.lo = view.hi = visW / 2;
    view.upp = visW / innerWidth;
  } else {
    const need = (NAV.cross[1] - NAV.cross[0]) + 0.1;
    view.dist = need / (2 * t * aspect * 0.93) * (ORIENT === "W" ? W_ZOOM : 1);
    view.crossMax = Math.max(2.2, (NAV.cross[1] - NAV.cross[0]) / 2 - view.dist * t * aspect + 0.4); // past each edge
    view.c = 0;
    const d = view.dist;
    view.lo = (yTop * d * t) / (sn - yTop * t * cs); // table visible above the target, up to the bar
    view.hi = (yBot * d * t) / (sn + yBot * t * cs); // and below it
    view.upp = (view.lo + view.hi) / (innerHeight - barPx - 66);
  }
  view.span = view.lo + view.hi;
  const pad = ORIENT === "H" ? 0.3 : 0.1;
  NAV.uMin = NAV.tableStart - pad + view.lo;
  NAV.uMax = Math.max(NAV.uMin, NAV.tableEnd + pad - view.hi);
  renderer.setSize(innerWidth, innerHeight, false);
}

function uForStart(start) { return clampU(start - (ORIENT === "H" ? 0.55 : 0.2) + view.lo); }
const clampU = (u) => Math.min(NAV.uMax, Math.max(NAV.uMin, u));

// click a screen: the camera glides it to the middle and leans in; the video starts as it lands
let crossOff = 0, crossT = 0, zoom = 1, zoomT = 1;
let focus = null, lockHover = false, fly = null;
const FOCUS_ZOOM = 0.8, CROSS_FREE = 1.0, CROSS_MAX = 1.4, W_ZOOM = 0.86;
const crossLim = () => (ORIENT === "H" ? CROSS_FREE : ORIENT === "W" ? view.crossMax || 1 : 0); // how far up/down a drag (or a centred screen) may take the view
const fitC = () => { const F = NAV.fit || NAV.cross; return (F[0] + F[1]) / 2; };
function placeCamera() {
  let tx, tz;
  if (ORIENT === "H") { tx = camU; tz = fitC() + view.c + crossOff; }
  else { tx = (NAV.cross[0] + NAV.cross[1]) / 2 + crossOff; tz = camU; }
  const d = view.dist * zoom;
  camera.position.set(tx, Math.sin(PITCH) * d, tz + Math.cos(PITCH) * d);
  camera.lookAt(tx, 0, tz);
  view.tx = tx; view.tz = tz;
}
function centerOf(dev) {
  const l = dev.userData.linked;
  return l ? { x: (dev.position.x + l.position.x) / 2, z: (dev.position.z + l.position.z) / 2 } : { x: dev.position.x, z: dev.position.z };
}
function focusOn(dev, then) {
  endFly();
  focus = dev; lockHover = true; velU = 0;
  const p = centerOf(dev), mid = (view.hi - view.lo) / 2; // the middle of what's visible, not of the canvas
  if (ORIENT === "H") {
    targetU = clampU(p.x - mid);
    crossT = Math.max(-CROSS_MAX, Math.min(CROSS_MAX, p.z - (fitC() + view.c)));
    zoomT = dev.userData.fw > 4 || dev.userData.linked ? 0.92 : FOCUS_ZOOM;
  } else {
    targetU = clampU(p.z - mid);
    if (ORIENT === "W") { // wide table: slide it sideways under the camera and lean in
      const m = crossLim() + 0.8;
      crossT = Math.max(-m, Math.min(m, p.x - (NAV.cross[0] + NAV.cross[1]) / 2));
      zoomT = dev.userData.fw > 4 || dev.userData.linked ? 0.9 : dev.userData.item.o === "h" ? 0.79 : 0.72;
    } else zoomT = 1;
  }
  const far = (Math.abs(targetU - camU) + Math.abs(crossT - crossOff)) / view.span + Math.abs(zoomT - zoom);
  fly = { u0: camU, c0: crossOff, z0: zoom, t: 0, T: REDUCED ? 0 : far < 0.03 ? 0.18 : Math.min(0.8, 0.42 + far * 0.5), then };
}
function endFly() { if (!fly) return; const f = fly.then; fly = null; EV.push(["land", performance.now()]); if (f) f(); }
const EV = []; // timing marks for the headless checks
function unfocus() { endFly(); focus = null; lockHover = false; zoomT = 1; const m = crossLim(); crossT = Math.max(-m, Math.min(m, crossT)); }

function rebuild() {
  const o = innerWidth / innerHeight < 0.9 ? "V" : "W"; // phone: one narrow column · desktop: the wide vertical table
  if (o === ORIENT) { frame(); targetU = clampU(targetU); camU = clampU(camU); return; }
  const keepZone = ORIENT ? currentZone()?.id : null;
  ORIENT = o;
  clearWorld();
  FLAT = [];
  const L = o === "W" ? buildDesktopV() : buildMobile();
  NAV = { ...NAV, zones: L.zones, tableStart: L.tableStart, tableEnd: L.tableEnd, cross: L.cross, fit: L.fit || null };
  fly = null; focus = null; crossOff = crossT = 0; zoom = zoomT = 1;
  world.traverse((ob) => { // night: keep the room's reflections faint on everything that isn't metal
    const ms = Array.isArray(ob.material) ? ob.material : ob.material ? [ob.material] : [];
    for (const m of ms) if (m.envMapIntensity !== undefined && !m.metalness && !m.userData.night) { m.userData.night = true; m.envMapIntensity *= 0.3; }
  });
  frame();
  const z = keepZone && NAV.zones.find((zz) => zz.id === keepZone);
  camU = targetU = z ? uForStart(z.start) : NAV.uMin;
  buildNav();
}

/* =====================================================================
   07) UI: categories, sub-sections, stepper, hint
   ===================================================================== */
const catsEl = document.getElementById("cats");
const subEl = document.getElementById("subnav");
const hintEl = document.getElementById("hint");

function buildNav() {
  catsEl.innerHTML = NAV.zones.map((z) => `<button class="cat" type="button" data-z="${z.id}"><span class="n">${z.n}</span>${z.label}</button>`).join("");
  lastZoneId = undefined;
}
catsEl.addEventListener("click", (e) => {
  const b = e.target.closest(".cat"); if (!b) return;
  const z = NAV.zones.find((zz) => zz.id === b.dataset.z);
  if (z) goTo(uForStart(z.start));
});
subEl.addEventListener("click", (e) => {
  const b = e.target.closest(".sub"); if (!b) return;
  goTo(uForStart(Number(b.dataset.u)));
});
document.getElementById("home").addEventListener("click", () => goTo(NAV.uMin));

function stops() {
  const s = [NAV.uMin];
  for (const z of NAV.zones) { s.push(uForStart(z.start)); for (const g of z.groups.slice(1)) s.push(uForStart(g.start)); }
  return [...new Set(s.map((v) => +v.toFixed(3)))].sort((a, b) => a - b);
}
document.getElementById("next").addEventListener("click", () => { const s = stops().find((v) => v > targetU + 0.05); goTo(s ?? NAV.uMax); });
document.getElementById("prev").addEventListener("click", () => { const s = stops().reverse().find((v) => v < targetU - 0.05); goTo(s ?? NAV.uMin); });

function goTo(u) { unfocus(); crossT = 0; targetU = clampU(u); velU = 0; if (REDUCED) camU = targetU; dismissHint(); }

function currentZone() {
  const probe = camU - view.lo + view.span * 0.35;
  let cur = null;
  for (const z of NAV.zones) if (probe >= z.start - 0.6) cur = z;
  return cur;
}
let lastZoneId, lastGroupKey = null;
function updateNavState() {
  const z = currentZone();
  const id = z ? z.id : null;
  if (id !== lastZoneId) {
    lastZoneId = id;
    catsEl.querySelectorAll(".cat").forEach((b) => b.classList.toggle("active", b.dataset.z === id));
    const act = catsEl.querySelector(".cat.active");
    if (act) act.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    if (z && z.groups.length > 1) {
      subEl.innerHTML = z.groups.map((g) => `<button class="sub" type="button" data-u="${g.start}">${g.label}</button>`).join("");
      subEl.classList.add("show");
      hintGone = true; hintEl.classList.add("hide");
    } else { subEl.classList.remove("show"); subEl.innerHTML = ""; }
    lastGroupKey = null;
  }
  if (z && z.groups.length > 1) {
    const probe = camU - view.lo + view.span * 0.3;
    let g = z.groups[0];
    for (const gg of z.groups) if (probe >= gg.start - 0.4) g = gg;
    if (g.label !== lastGroupKey) {
      lastGroupKey = g.label;
      subEl.querySelectorAll(".sub").forEach((b) => b.classList.toggle("active", Number(b.dataset.u) === g.start));
    }
  }
}

let hintGone = false;
function dismissHint() { if (hintGone) return; hintGone = true; setTimeout(() => hintEl.classList.add("hide"), 900); }
if (IS_TOUCH) hintEl.innerHTML = "<b>Swipe</b> along the table · <b>Tap</b> a screen to play or pause · <b>Hold</b> it for the breakdown";

/* =====================================================================
   08) VIDEO ON THE TABLE: click a screen to play it, one at a time.
       Its sound sits where the screen is: it pans and fades as the table moves away.
   ===================================================================== */
const pool = new Map(); // device -> { v, vt, node, pan, gain, go }; the last few stay loaded so they resume where they stopped
const POOL_MAX = 8;
let active = null;
let SOUND = true;
const sndBtn = document.getElementById("snd");
const sndLabel = document.getElementById("sndLabel");

let AC = null, MASTER = null;
function ensureAudio() { // needs a click or tap: browsers only start sound from one
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      MASTER = AC.createGain(); MASTER.gain.value = SOUND ? 1 : 0; MASTER.connect(AC.destination);
    } catch (err) { AC = null; }
  }
  if (AC && AC.state === "suspended") AC.resume().catch(() => {});
}
function routeAudio(e) { // video → panner → gain → master, so its sound can follow the screen
  if (e.node || e.noRoute || !AC) return;
  try {
    e.node = AC.createMediaElementSource(e.v);
    e.gain = AC.createGain(); e.gain.gain.value = 0;
    e.pan = AC.createStereoPanner ? AC.createStereoPanner() : null;
    (e.pan ? e.node.connect(e.pan).connect(e.gain) : e.node.connect(e.gain)).connect(MASTER);
  } catch (err) { e.noRoute = true; e.node = e.gain = e.pan = null; }
}
function evictVideo(dev, e) {
  e.v.pause(); e.v.removeAttribute("src"); e.v.load();
  if (e.node) { e.node.disconnect(); e.gain.disconnect(); if (e.pan) e.pan.disconnect(); }
  dev.userData.screenMat.map = dev.userData.thumbTex; dev.userData.screenMat.needsUpdate = true;
  dev.userData.bar.visible = dev.userData.track.visible = false;
  e.vt.dispose();
  pool.delete(dev);
}
function showVideo(dev, e) { const m = dev.userData.screenMat; if (m.map !== e.vt) { m.map = e.vt; m.needsUpdate = true; EV.push(["video", performance.now()]); } }
function videoFor(dev) { // also used to preload a screen the pointer rests on
  let e = pool.get(dev);
  if (e) { pool.delete(dev); pool.set(dev, e); return e; } // keep the most recent last
  const v = document.createElement("video");
  v.src = dev.userData.item.prev; v.loop = true; v.playsInline = true; v.preload = "auto"; v.muted = true;
  v.setAttribute("playsinline", ""); v.setAttribute("webkit-playsinline", "");
  const vt = new THREE.VideoTexture(v); vt.colorSpace = THREE.SRGBColorSpace;
  e = { v, vt, go: false };
  v.addEventListener("playing", () => { if (e.go) showVideo(dev, e); });
  pool.set(dev, e);
  for (const [od, oe] of [...pool]) { if (pool.size <= POOL_MAX) break; if (od !== dev && od !== active) evictVideo(od, oe); }
  return e;
}
const canSound = () => SOUND && (!navigator.userActivation || navigator.userActivation.hasBeenActive);
function setActive(dev) { // the one screen that plays; null stops it
  if (dev && dev.userData.linked) dev = dev.userData.linked;
  if (dev && !dev.userData.item.prev) dev = null;
  if (dev === active) return;
  if (active) { const e = pool.get(active); if (e) { e.go = false; e.v.pause(); if (e.gain) e.gain.gain.value = 0; } }
  active = dev;
  if (!dev) return;
  const e = videoFor(dev);
  routeAudio(e);
  e.go = false;
  e.v.muted = e.gain ? false : !canSound();
  // start it inside the click so every browser lets it make sound later, then hold it until the camera lands
  e.v.play().then(() => { if (!e.go) e.v.pause(); }).catch(() => {});
}
function startActive(dev) { // the camera has landed: it plays now
  if (!dev || dev !== active) return;
  const e = pool.get(dev); if (!e) return;
  e.go = true;
  if (!e.v.paused && e.v.readyState >= 2) showVideo(dev, e);
  e.v.play().catch(() => { e.v.muted = true; e.v.play().catch(() => {}); });
}
function playDevice(dev) {
  ensureAudio();
  setActive(dev);
  focusOn(dev, () => startActive(active));
}
const _p = new THREE.Vector3();
function updateSound() { // pan with the screen's place in the view, fade as it leaves; far off, it stops
  if (!active) return;
  const e = pool.get(active); if (!e || !e.go) return;
  _p.copy(active.position).project(camera);
  const along = ORIENT === "H" ? _p.x : _p.y, cross = ORIENT === "H" ? _p.y : _p.x;
  const d = Math.hypot(along, cross * 0.7);
  const g = Math.max(0, Math.min(1, 1 - (d - 0.4) / 1.4));
  const vol = g * g * (3 - 2 * g);
  if (e.gain) {
    const t = AC.currentTime;
    e.gain.gain.setTargetAtTime(vol, t, 0.06);
    if (e.pan) e.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, _p.x * 0.9)), t, 0.06);
  } else e.v.volume = vol;
  if (d > 2.4) setActive(null);
}
function setSound(on) {
  SOUND = on;
  sndBtn.classList.toggle("off", !on);
  sndLabel.textContent = on ? "Sound on" : "Sound off";
  sndBtn.querySelector(".w").style.display = on ? "" : "none";
  if (MASTER) MASTER.gain.setTargetAtTime(on ? 1 : 0, AC.currentTime, 0.03);
  if (active) { const e = pool.get(active); if (e && !e.gain) e.v.muted = !canSound(); }
}
sndBtn.addEventListener("click", () => setSound(!SOUND));
addEventListener("pointerdown", ensureAudio, true); // the first press anywhere opens the sound

/* =====================================================================
   09) INPUT: drag / swipe / wheel / keys / hover / click
   ===================================================================== */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const tipEl = document.getElementById("tip");
const ptr = { x: 0, y: 0, inside: false };
let hovered = null;
let drag = null;

function pick(cx, cy) {
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(pickables, false)[0];
  return hit ? hit.object.userData.dev : null;
}

// a press longer than a click lifts the screen off the table; held through, it opens the details
const HOLD_DELAY = 140, HOLD_MS = 620, DRAG_GAIN = 0.85;
let press = null; // { dev, t0, p, done }
canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY, t: performance.now(), moved: 0, id: e.pointerId };
  velU = 0;
  const dev = lockHover && hovered ? hovered : pick(e.clientX, e.clientY);
  press = dev && !dev.userData.item.mailto ? { dev, t0: performance.now(), p: 0, done: false } : null;
});
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("pointermove", (e) => {
  if (Math.abs(e.clientX - ptr.x) + Math.abs(e.clientY - ptr.y) > 1) lockHover = false; // the hand moved: hover follows it again
  ptr.x = e.clientX; ptr.y = e.clientY; ptr.inside = true;
  if (drag && drag.id === e.pointerId) {
    const dx = e.clientX - drag.lastX, dy = e.clientY - drag.lastY;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    if (drag.moved > 6) {
      if (focus || fly) unfocus();
      press = null;
      canvas.classList.add("dragging");
      // along the table with the hand (the camera eases after it), and a little across it
      const du = -(ORIENT === "H" ? dx : dy) * view.upp * DRAG_GAIN;
      targetU = clampU(targetU + du);
      const side = ORIENT === "H" ? dy : ORIENT === "W" ? dx : 0;
      if (side) {
        const m = crossLim();
        let dc = -side * view.upp * (ORIENT === "H" ? 1.3 : DRAG_GAIN);
        if (Math.sign(dc) === Math.sign(crossT)) dc *= 1 - Math.min(1, Math.abs(crossT) / m) ** 2; // it gets heavier near the edge
        crossT = Math.max(-m, Math.min(m, crossT + dc));
      }
      const now = performance.now(), dt = Math.max(4, now - drag.t);
      drag.v = (drag.v || 0) * 0.6 + (du / dt) * 0.4; drag.t = now; // units per ms, smoothed over the last few moves
      dismissHint();
    }
    drag.lastX = e.clientX; drag.lastY = e.clientY;
  }
});
const endDrag = (e) => {
  if (!drag || drag.id !== e.pointerId) return;
  canvas.classList.remove("dragging");
  if (drag.moved > 6 && performance.now() - drag.t < 70) { // let go while moving: it glides on a little
    const cap = view.span * 0.018;
    velU = Math.max(-cap, Math.min(cap, (drag.v || 0) * 16.7 * 0.8));
  } else velU = 0;
  const quick = !press || performance.now() - press.t0 < HOLD_DELAY + 160;
  if (drag.moved <= 6 && quick && !(press && press.done)) {
    // a hand that hasn't moved since the camera centred a screen still means that screen
    const dev = press ? press.dev : lockHover && hovered ? hovered : pick(e.clientX, e.clientY);
    if (dev) clickDevice(dev);
  }
  press = null; drag = null;
};
function clickDevice(dev) { // a click plays a screen (and centres it), or pauses / resumes the one playing
  const it = dev.userData.item;
  if (it.mailto) { location.href = `mailto:${ME.email}`; return; }
  if (dev.userData.paper || !it.prev) { openBreakdown(it); return; }
  if (!IS_TOUCH) { hovered = dev; lockHover = true; }
  if (dev !== active) { playDevice(dev); return; }
  const e = pool.get(dev);
  if (!e || !e.go) return;
  if (!e.v.paused) { e.v.pause(); return; }
  ensureAudio();
  e.go = false; // resume like a first play: glide back to the middle, start as it lands
  focusOn(dev, () => startActive(active));
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", (e) => { if (drag && drag.id === e.pointerId) { drag = null; press = null; canvas.classList.remove("dragging"); } });
canvas.addEventListener("pointerleave", () => { ptr.inside = false; if (!drag) setHover(null); });

addEventListener("wheel", (e) => {
  if (lb.classList.contains("open")) return;
  e.preventDefault();
  const d = ORIENT === "H" ? (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) : e.deltaY;
  const scale = e.deltaMode === 1 ? 32 : 1;
  if (focus || fly) unfocus();
  targetU = clampU(targetU + d * scale * view.upp * 1.1);
  if (ORIENT === "W" && e.deltaX) { // a trackpad's sideways swipe slides the table a little across
    let dc = e.deltaX * scale * view.upp * 0.6;
    const m = crossLim();
    if (Math.sign(dc) === Math.sign(crossT)) dc *= 1 - Math.min(1, Math.abs(crossT) / m) ** 2;
    crossT = Math.max(-m, Math.min(m, crossT + dc));
  }
  velU = 0; dismissHint();
}, { passive: false });

addEventListener("keydown", (e) => {
  if (lb.classList.contains("open")) {
    if (e.key === "Escape") closeBreakdown();
    if (e.key === "ArrowRight") stepBreakdown(1);
    if (e.key === "ArrowLeft") stepBreakdown(-1);
    return;
  }
  const step = view.span * 0.6;
  if (["ArrowRight", "ArrowDown", "PageDown"].includes(e.key)) { unfocus(); targetU = clampU(targetU + step); e.preventDefault(); dismissHint(); }
  if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) { unfocus(); targetU = clampU(targetU - step); e.preventDefault(); dismissHint(); }
  if (e.key === "Home") goTo(NAV.uMin);
  if (e.key === "End") goTo(NAV.uMax);
});

let hoverT = 0, tipKey = "";
function setHover(dev) {
  if (dev === hovered) return;
  hovered = dev; hoverT = 0;
  canvas.classList.toggle("pointing", !!dev);
  if (!dev) { tipEl.classList.remove("show"); tipKey = ""; }
}
function refreshTip() { // what a click does here, said under the screen
  const dev = hovered, it = dev.userData.item;
  const e = active && pool.get(active);
  const playing = dev === active && e && e.go && !e.v.paused;
  const act = it.mailto ? ME.email : dev.userData.paper || !it.prev ? "Click for the breakdown" : `${playing ? "Click to pause" : "Click to play"} · hold for the breakdown`;
  const key = `${it.title}|${act}`;
  if (key === tipKey) return;
  tipKey = key;
  const b = bdFor(it);
  const where = it.mailto ? "About" : it.reel ? "Showreel" : [it.__zone?.label, it.__group?.label].filter(Boolean).join(" · ");
  tipEl.innerHTML = `<div class="t">${it.title}</div><div class="g">${b.client && !it.mailto ? b.client : where}</div><div class="p">${act}</div>`;
  tipEl.classList.add("show");
}
const _c = new THREE.Vector3();
function placeTip(dev) { // the label sits under the screen it belongs to (above it near the bottom edge)
  const u = dev.userData, c = Math.cos(dev.rotation.y), sn = Math.sin(dev.rotation.y);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const lx = (a * u.fw) / 2, lz = (b * u.fh) / 2;
    _c.set(dev.position.x + lx * c + lz * sn, 0.1, dev.position.z - lx * sn + lz * c).project(camera);
    const sx = ((_c.x + 1) / 2) * innerWidth, sy = ((1 - _c.y) / 2) * innerHeight;
    x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
  }
  const tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
  let ty = y1 + 10;
  if (ty + th > innerHeight - 74) ty = y0 - th - 10;
  ty = Math.max(view.barPx + 8, Math.min(innerHeight - 74 - th, ty));
  const cx = Math.max(tw / 2 + 10, Math.min(innerWidth - tw / 2 - 10, (x0 + x1) / 2));
  tipEl.style.left = `${cx}px`; tipEl.style.top = `${ty}px`;
}

/* =====================================================================
   10) BREAKDOWN
   ===================================================================== */
const lb = document.getElementById("lb");
const lbMedia = document.getElementById("lbMedia");
const lbInfo = document.getElementById("lbInfo");
let lbIndex = -1;
let lbList = [];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function bdFor(it) {
  const b = BD[it.key || it.yt] || {};
  const zid = it.__zone?.id;
  return {
    client: b.client || it.meta || "",
    goal: b.goal || "",
    did: b.did || (it.reel ? REEL.did || "" : ROLE[it.__group?.role] || ROLE[zid] || ""),
    result: b.result || "",
  };
}

function sizeMedia(o) {
  const narrow = innerWidth <= 820;
  const maxW = narrow ? innerWidth - 28 : innerWidth - 160 - 410;
  const maxH = narrow ? innerHeight * (o === "v" ? 0.6 : 0.42) : innerHeight - 110;
  const ar = o === "v" ? 9 / 16 : 16 / 9;
  let w = maxW, h = w / ar;
  if (h > maxH) { h = maxH; w = h * ar; }
  lbMedia.style.width = `${Math.round(w)}px`; lbMedia.style.height = `${Math.round(h)}px`;
  if (narrow) lbMedia.style.alignSelf = "center";
}

// hold a screen: it lifts off the table and comes up to the camera, facing you, with its full video on it;
// the table dims behind it and the breakdown slides in beside it. Let go of it (close, Esc, click outside) and it goes back.
const dimMat = new THREE.MeshBasicMaterial({ color: 0x050608, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
const dimPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), dimMat);
dimPlane.visible = false; dimPlane.renderOrder = 5; scene.add(dimPlane);
let dimT = 0, dimD = 6, bdDev = null, bdShown = false;
const lbPrevBtn = document.getElementById("lbPrev"), lbNextBtn = document.getElementById("lbNext");
const BD_T = 0.75, _v = new THREE.Vector3(), _q = new THREE.Quaternion(), FACE = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
const easeIO = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
function bdBox(o) { // where the screen sits on the page, in px: left of the breakdown (desktop, and a phone screen on a phone) or above it
  const W = innerWidth, H = innerHeight;
  if (W >= 760) { const P = Math.min(440, W * 0.36) + 56; return { x: 70, y: 72, w: W - P - 110, h: H - 72 - 34 }; }
  if (o === "v") return { x: 8, y: 96, w: Math.round(W * 0.54) - 12, h: H - 96 - 76 }; // the notes go beside it, the arrows under it
  return { x: 14, y: 100, w: W - 28, h: H * 0.57 - 100 };
}
function bdTarget(d) { // a pose in front of the camera that fills the box
  const u = d.userData, bx = bdBox(u.item.o), t2 = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const D = Math.max(u.fh * innerHeight / (bx.h * 0.92 * t2), u.fw * innerWidth / (bx.w * 0.92 * t2 * camera.aspect));
  const xN = ((bx.x + bx.w / 2) / innerWidth) * 2 - 1, yN = 1 - ((bx.y + bx.h / 2) / innerHeight) * 2;
  const vh = D * t2, vw = vh * camera.aspect;
  const p = new THREE.Vector3(xN * vw / 2, yN * vh / 2, -D); camera.localToWorld(p);
  // the screen's face, not the body's back, sits at that distance
  return { p: p.sub(_v.set(0, 0, 1).applyQuaternion(camera.quaternion).multiplyScalar(0.09)), q: camera.quaternion.clone().multiply(FACE), D };
}
function flyUp(d) {
  const u = d.userData;
  u.bd = { dir: 1, t: REDUCED ? 1 : 0, p0: d.position.clone(), q0: d.quaternion.clone(), home: u.bd ? u.bd.home : { p: new THREE.Vector3(d.position.x, u.baseY, d.position.z), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, d.rotation.y, 0)) } };
  u.glow.visible = false; u.play.visible = false; u.bar.visible = u.track.visible = false;
  d.traverse((o) => { if (o.isMesh) o.renderOrder = 6; });
}
function flyBack(d) {
  const u = d.userData; if (!u.bd) return;
  u.bd = { dir: -1, t: REDUCED ? 1 : 0, p0: d.position.clone(), q0: d.quaternion.clone(), home: u.bd.home };
}
function stepFlight(d, dt) {
  const u = d.userData, b = u.bd;
  b.t = Math.min(1, b.t + dt / BD_T);
  const k = easeIO(b.t);
  const to = b.dir > 0 ? bdTarget(d) : b.home;
  d.position.lerpVectors(b.p0, to.p, k);
  if (b.dir < 0) d.position.y += Math.sin(Math.PI * k) * 0.6; // a little arc on the way down
  d.quaternion.slerpQuaternions(b.q0, to.q, k);
  d.scale.set(1, 1, 1);
  u.screenMat.color.setScalar(1);
  if (b.dir > 0) dimD = to.D + 1.4;
  if (b.dir < 0 && b.t >= 1) { // home again
    u.bd = null; d.position.copy(b.home.p); d.rotation.set(0, new THREE.Euler().setFromQuaternion(b.home.q).y, 0);
    u.glow.visible = true; u.lift = 0;
    d.traverse((o) => { if (o.isMesh) o.renderOrder = 0; });
  }
  if (d === bdDev && b.dir > 0) placeMedia(d, b.t >= 1);
}
function stepDim(dt) {
  dimT += ((bdDev ? (innerWidth < 760 ? 0.8 : 0.68) : 0) - dimT) * (1 - Math.exp(-dt * 6));
  dimPlane.visible = dimT > 0.005;
  if (!dimPlane.visible) return;
  dimMat.opacity = dimT;
  const vh = dimD * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  dimPlane.scale.set(vh * camera.aspect * 1.2, vh * 1.2, 1);
  dimPlane.position.set(0, 0, -dimD); camera.localToWorld(dimPlane.position);
  dimPlane.quaternion.copy(camera.quaternion);
}
function placeMedia(d, landed) { // the video player sits exactly on the 3D screen
  const u = d.userData; d.updateMatrixWorld(true);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const top = u.screen.position.y + 0.004;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    _v.set(sx * u.sw / 2, top, sz * u.sh / 2).applyMatrix4(d.matrixWorld).project(camera);
    const px = (_v.x + 1) / 2 * innerWidth, py = (1 - _v.y) / 2 * innerHeight;
    x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
  }
  const st = lbMedia.style, g = 1.5; // a hair over the screen's edge so none of the 3D screen shows round it
  st.left = `${(x0 - g).toFixed(1)}px`; st.top = `${(y0 - g).toFixed(1)}px`; st.width = `${(x1 - x0 + 2 * g).toFixed(1)}px`; st.height = `${(y1 - y0 + 2 * g).toFixed(1)}px`;
  st.borderRadius = `${(u.rs / u.sw * (x1 - x0) + g).toFixed(1)}px`;
  const wide = innerWidth >= 760, cy = `${((y0 + y1) / 2 - 23).toFixed(0)}px`; // the arrows sit either side of the screen
  lbPrevBtn.style.cssText = wide ? `left:${Math.max(12, x0 - 92).toFixed(0)}px; top:${cy}; transform:none;` : "";
  lbNextBtn.style.cssText = (wide ? `left:${(x1 + 46).toFixed(0)}px; right:auto; top:${cy}; transform:none;` : "") + `visibility:${lbList.length > 1 ? "visible" : "hidden"}`;
  lbPrevBtn.style.visibility = lbList.length > 1 ? "visible" : "hidden";
  if (landed && !bdShown) { bdShown = true; lbMedia.classList.add("on"); }
  if (bdShown) u.screenMat.color.setScalar(0); // the player covers it
}

function openBreakdown(item) {
  let startAt = 0;
  const dev = item.__dev;
  if (dev && pool.get(dev)) startAt = pool.get(dev).v.currentTime || 0;
  setActive(null); setHover(null); unfocus();
  if (item.reel) { lbList = [REEL]; lbIndex = 0; }
  else { lbList = FLAT.filter((f) => f.__zone === item.__zone); lbIndex = lbList.indexOf(item); }
  lb.classList.add("open"); document.body.classList.add("bd");
  showItem(startAt);
}
function showItem(startAt = 0) { // the item at lbIndex comes up; the one before goes back
  const it = lbList[lbIndex], d = it.__dev && !it.__dev.userData.paper ? it.__dev : null;
  if (bdDev && bdDev !== d) flyBack(bdDev);
  bdDev = d; bdShown = false;
  lbMedia.classList.remove("on");
  lb.classList.toggle("flat", !d);
  lb.classList.toggle("side", !!d && innerWidth < 760 && it.o === "v");
  if (d) flyUp(d); else { lbMedia.removeAttribute("style"); sizeMedia(it.o); }
  renderBreakdown(startAt);
  if (!d) lbMedia.classList.add("on");
}
function renderBreakdown(startAt = 0) {
  const it = lbList[lbIndex];
  const b = bdFor(it);
  if (it.src) {
    lbMedia.innerHTML = `<video src="${it.src}" poster="${it.poster || ""}" controls autoplay playsinline></video>`;
    if (startAt > 0.5) lbMedia.querySelector("video").currentTime = startAt;
  } else {
    const st = startAt > 1 ? `&start=${Math.floor(startAt)}` : "";
    lbMedia.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${it.yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1${st}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="${esc(it.title)}"></iframe>`;
  }
  const zone = it.reel ? "Showreel" : it.__zone.label;
  let html = `<div class="lbZone">${zone}${it.__group && it.__group.label !== zone ? " · " + esc(it.__group.label) : ""}</div>`;
  html += `<h2 class="lbTitle">${esc(it.cardTitle || it.title)}</h2>`;
  if (b.client) html += `<div class="lbClient">${esc(b.client)}</div>`;
  if (it.stats) html += `<div class="lbStats">${it.stats.map(([n, l]) => `<div class="lbStat"><b>${n}</b><span>${l}</span></div>`).join("")}</div>`;
  if (b.goal) html += `<div class="lbSec"><h3>The goal</h3><p>${esc(b.goal)}</p></div>`;
  if (b.did) html += `<div class="lbSec"><h3>${HERO.didLabel || "What we did"}</h3><p>${esc(b.did)}</p></div>`;
  if (b.result) html += `<div class="lbSec res"><h3>Result</h3><p>${esc(b.result)}</p></div>`;
  if (lbList.length > 1) html += `<div class="lbCount">${lbIndex + 1} / ${lbList.length} in ${zone}${IS_TOUCH ? "" : " · ← → for the next one"}</div>`;
  lbInfo.innerHTML = html;
  lbInfo.scrollTop = 0;
  lbInfo.classList.remove("in"); void lbInfo.offsetWidth; lbInfo.classList.add("in");
  document.getElementById("lbPrev").style.visibility = lbList.length > 1 ? "visible" : "hidden";
  document.getElementById("lbNext").style.visibility = lbList.length > 1 ? "visible" : "hidden";
}
function stepBreakdown(d) { if (lbList.length < 2) return; lbIndex = (lbIndex + d + lbList.length) % lbList.length; showItem(); }
function closeBreakdown() {
  lb.classList.remove("open", "flat", "side"); document.body.classList.remove("bd"); lbMedia.classList.remove("on"); lbMedia.innerHTML = ""; lbInfo.classList.remove("in");
  if (bdDev) flyBack(bdDev);
  bdDev = null;
}
document.getElementById("lbClose").addEventListener("click", closeBreakdown);
document.getElementById("lbPrev").addEventListener("click", () => stepBreakdown(-1));
document.getElementById("lbNext").addEventListener("click", () => stepBreakdown(1));
lb.addEventListener("click", (e) => { // outside the screen and the panel: put it back
  if (e.target !== lb) return;
  const r = lbMedia.getBoundingClientRect(), m = 34;
  if (bdDev && e.clientX > r.left - m && e.clientX < r.right + m && e.clientY > r.top - m && e.clientY < r.bottom + m) return;
  closeBreakdown();
});

/* =====================================================================
   11) LOOP
   ===================================================================== */
const clock = new THREE.Clock();
let frameNo = 0;

function assign(poolL, cands) { // keep lights on what they already light; free ones fade out, then move
  const want = new Set(cands);
  for (const l of poolL) if (l.userData.tgt) l.userData.leaving = !want.has(l.userData.tgt);
  const have = new Set(poolL.map((l) => l.userData.tgt).filter(Boolean));
  for (const c of cands) {
    if (have.has(c)) continue;
    const free = poolL.find((l) => !l.userData.tgt);
    if (!free) break;
    Object.assign(free.userData, { tgt: c, leaving: false, lvl: 0 }); have.add(c);
  }
}
const LIGHT_K = 6, LAMP_K = 1.7;
function updateLights(dt) {
  const tx = view.tx, tz = view.tz;
  const near = (p) => ORIENT === "H" ? Math.abs(p.x - tx) < view.lo * zoom + 1.8 : p.z - tz > -view.lo - 1.6 && p.z - tz < view.hi + 1.6;
  const d2 = (p) => (p.x - tx) ** 2 + (p.z - tz) ** 2;
  if (frameNo % 6 === 0) {
    const devs = devices.filter((d) => !d.userData.paper && near(d.position))
      .sort((a, b) => (b === active) - (a === active) || d2(a.position) - d2(b.position)).slice(0, SCREEN_LIGHTS);
    assign(screenLights, devs);
    assign(paperLamps, lampTargets.filter(near).sort((a, b) => d2(a) - d2(b)).slice(0, PAPER_LAMPS));
  }
  const k = 1 - Math.exp(-dt * 6);
  for (const l of screenLights) {
    const u = l.userData;
    u.lvl += ((u.tgt && !u.leaving ? 1 : 0) - u.lvl) * k;
    if (u.leaving && u.lvl < 0.02) { u.tgt = null; u.leaving = false; }
    if (!u.tgt) { l.intensity = 0; continue; }
    const d = u.tgt, du = d.userData;
    l.position.set(d.position.x, 0.42 + d.position.y, d.position.z);
    l.color.copy(du.lightCol);
    l.intensity = u.lvl * du.lightI * LIGHT_K;
  }
  for (const s of paperLamps) {
    const u = s.userData;
    u.lvl += ((u.tgt && !u.leaving ? 1 : 0) - u.lvl) * k;
    if (u.leaving && u.lvl < 0.02) { u.tgt = null; u.leaving = false; }
    if (!u.tgt) { s.intensity = 0; continue; }
    const t = u.tgt;
    s.position.set(t.x - 1.5, 6.6, t.z - 1.2);
    s.target.position.set(t.x, 0, t.z);
    s.angle = Math.min(0.75, Math.atan((t.r * 1.12) / 6.6) + 0.03);
    s.intensity = u.lvl * LAMP_K;
  }
}

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  frameNo++;
  if (fly) { // a click's glide: ease in and out, and the video starts the frame it lands
    fly.t += dt;
    const k = fly.T ? Math.min(1, fly.t / fly.T) : 1;
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    camU = fly.u0 + (targetU - fly.u0) * e; crossOff = fly.c0 + (crossT - fly.c0) * e; zoom = fly.z0 + (zoomT - fly.z0) * e;
    if (k >= 1) endFly();
  } else {
    if (!drag && Math.abs(velU) > 0.0005) { targetU = clampU(targetU + velU * dt * 60); velU *= Math.pow(0.9, dt * 60); }
    const ease = REDUCED ? 1 : 1 - Math.exp(-dt * (drag && drag.moved > 6 ? 14 : 7));
    camU += (targetU - camU) * ease;
    crossOff += (crossT - crossOff) * ease;
    zoom += (zoomT - zoom) * ease;
  }
  placeCamera();

  if (press && !press.done && drag && drag.moved <= 6) {
    press.p = Math.max(0, Math.min(1, (performance.now() - press.t0 - HOLD_DELAY) / HOLD_MS));
    if (press.p >= 1) { press.done = true; const it = press.dev.userData.item; setTimeout(() => openBreakdown(it), 110); }
  }
  const lbOpen = lb.classList.contains("open");
  if (!lbOpen && !document.hidden) {
    if (!IS_TOUCH) {
      if (ptr.inside && !lockHover && !(drag && drag.moved > 6)) setHover(pick(ptr.x, ptr.y));
      // rest on a screen for a moment and its video starts loading, so a click plays it without a wait
      if (hovered && !drag && !hovered.userData.paper && hovered.userData.item.prev && !pool.has(hovered)) { hoverT += dt; if (hoverT > 0.12) videoFor(hovered); }
    }
  } else if (document.hidden && active) setActive(null);

  const kh = 1 - Math.exp(-dt * 12), ka = 1 - Math.exp(-dt * 8), kc = 1 - Math.exp(-dt * 4);
  stepDim(dt);
  const pe0 = active && pool.get(active), playingNow = !!(pe0 && pe0.go && !pe0.v.paused && !bdDev);
  spot += ((playingNow ? 1 : 0) - spot) * (1 - Math.exp(-dt * (playingNow ? 2.5 : 4)));
  renderer.toneMappingExposure = EXPOSURE * (1 - SPOT_ROOM * spot);
  for (const d of devices) {
    const u = d.userData;
    if (u.bd) { stepFlight(d, dt); continue; }
    const isHover = d === hovered || (hovered && hovered.userData.linked === d);
    u.hover += ((isHover ? 1 : 0) - u.hover) * kh;
    // held: it rises off the table and tips toward you; let go, it settles back
    const held = press && press.dev === d ? (press.done ? 1.25 : press.p * press.p * (3 - 2 * press.p)) : 0;
    u.lift = (u.lift || 0) + (held - (u.lift || 0)) * (held > (u.lift || 0) ? 0.5 : kh);
    d.position.y = u.baseY + u.hover * (u.paper ? 0.03 : 0.1) + u.lift * (u.paper ? 0.25 : 0.6);
    d.rotation.x = u.lift * (u.paper ? 0.05 : 0.2);
    const s = 1 + u.hover * (u.paper ? 0.008 : 0.02) + u.lift * 0.05;
    d.scale.set(s, 1, s);
    if (u.paper) continue;
    u.act += ((d === active ? 1 : 0) - u.act) * ka;
    // play button: red under the pointer, gone while this screen plays
    const pe = d === active && pool.get(d), playing = pe && pe.go && !pe.v.paused;
    u.on += ((playing ? 1 : 0) - u.on) * kh;
    u.ph += ((d === hovered ? 1 : 0) - u.ph) * kh;
    if (d !== active) u.bar.visible = u.track.visible = false;
    const down = 1 - SPOT_SCREENS * spot * (1 - u.act); // the others step back while one plays
    const show = (1 - u.on) * (1 - 0.7 * spot * (1 - u.act));
    u.play.visible = show > 0.01;
    if (u.play.visible) {
      u.playDiscMat.opacity = show * (0.5 + 0.4 * u.ph);
      u.playDiscMat.color.copy(PLAY_DARK).lerp(PLAY_RED, u.ph);
      u.playTriMat.opacity = show * 0.95;
      const ps = 1 + 0.12 * u.ph; u.play.scale.set(ps, 1, ps);
    }
    u.screenMat.color.setScalar((IDLE + (1 - IDLE) * u.act) * down);
    // the colour this screen throws on the table: the playing frame, or its poster
    if (d === active && frameNo % 6 === 0) { const e = pool.get(d); if (e && e.v.readyState >= 2) u.live = avgOf(e.v) || u.live; }
    const src = d === active && u.live ? u.live : u.thumbTex.userData.avg;
    if (src) u.col.lerp(src, kc);
    const lum = 0.2126 * u.col.r + 0.7152 * u.col.g + 0.0722 * u.col.b; // linear
    const mx = Math.max(u.col.r, u.col.g, u.col.b, 0.002);
    u.lightCol = u.lightCol || new THREE.Color();
    u.lightCol.setRGB(u.col.r / mx, u.col.g / mx, u.col.b / mx).lerp(WHITE, 0.3);
    u.lightI = (0.4 + 0.8 * u.act) * Math.min(1.5, 0.3 + lum * 2.6);
    u.glowMat.color.copy(u.lightCol);
    u.glowMat.opacity = (0.05 + 0.15 * u.act) * Math.min(1.4, 0.4 + lum * 2.4) * down;
  }
  if (active) {
    const e = pool.get(active), bar = active.userData.bar;
    if (e && e.v.duration && !active.userData.bd) { bar.visible = active.userData.track.visible = true; bar.scale.x = Math.max(0.0001, (e.v.currentTime / e.v.duration) * active.userData.barW); }
  }
  updateLights(dt);
  updateSound();
  if (hovered && !IS_TOUCH) { refreshTip(); placeTip(hovered); }

  updateNavState();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
const WHITE = new THREE.Color(1, 1, 1);
window.__dbg = () => { const e = active && pool.get(active); return { active: active?.userData.item.title, go: !!e?.go, t: e?.v.currentTime, paused: e?.v.paused, gain: e?.gain?.gain.value, pan: e?.pan?.pan.value, ac: AC?.state, fly: !!fly, camU, crossOff, zoom, hovered: hovered?.userData.item.title, tip: tipEl.textContent, ev: EV.slice(-6) }; };

/* =====================================================================
   12) START
   ===================================================================== */
async function start() {
  try {
    await Promise.race([
      Promise.all([
        ...[[900, 150], [900, 125], [850, 75], [800, 87], [450, 100], [200, 50], [100, 50]].map(([wt, wd]) => document.fonts.load(font(wt, 40, wd))),
        document.fonts.load(font(600, 40, 87, true)),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch (e) { /* fonts are optional */ }
  makeSharedTextures();
  rebuild();
  let resizeT;
  addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(() => { rebuild(); if (lb.classList.contains("open")) sizeMedia(lbList[lbIndex].o); }, 120); });
  const done = () => document.getElementById("loader").classList.add("done");
  loadingManager.onLoad = done;
  setTimeout(done, 1500); // never hold the page for textures; they fade in as they land
  tick();
}
start().catch((e) => { console.error(e); window.__err = String(e && e.stack || e); });
