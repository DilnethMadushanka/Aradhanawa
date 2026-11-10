/* Draws the art for the "Ran Nelum" design (golden lotus, blush ivory, traditional layout) and saves it as WebP in img/.
 * Makes: th-nelum-bg, th-nelum-l, th-nelum-r (transparent), th-nelum-card-480/960 and th-nelum-venue.
 * The couple picture (th-nelum-hero-480/960) is NOT drawn here: it comes from Gemini (image-prompts.md, "Ran Nelum").
 * Run from the repo root: NODE_PATH=$(npm root -g) node scripts/nelum_art.mjs && python3 scripts/card_sides.py th-nelum-card
 * (needs playwright + python3 Pillow) */
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "img");
const TMP = mkdtempSync(join(tmpdir(), "nelum-art-"));
const n = v => Math.round(v * 10) / 10;
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const R = (a, b) => a + rnd() * (b - a);

const DEFS = `
<linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6E1A2"/><stop offset=".45" stop-color="#D9AE58"/><stop offset="1" stop-color="#A9772C"/></linearGradient>
<linearGradient id="gdL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBEFC8"/><stop offset="1" stop-color="#DDB46A"/></linearGradient>
<radialGradient id="blush" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#FFF8F3"/><stop offset=".55" stop-color="#F9EAE4"/><stop offset="1" stop-color="#F1D9D2"/></radialGradient>
<radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".85"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
<filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .62  0 0 0 0 .42  0 0 0 0 .36  0 0 0 .06 0"/></filter>
<filter id="sheen" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="28"/></filter>
<filter id="soft"><feGaussianBlur stdDeviation="1.2"/></filter>`;

/* ---------- motifs ---------- */
const petal = (h, w) => `M0 0C${n(w)} ${n(-h * .22)} ${n(w * .6)} ${n(-h * .7)} 0 ${n(-h)}C${n(-w * .6)} ${n(-h * .7)} ${n(-w)} ${n(-h * .22)} 0 0Z`;
const leaf = s => `M0 0C${n(6 * s)} ${n(-6 * s)} ${n(6 * s)} ${n(-16 * s)} 0 ${n(-23 * s)}C${n(-6 * s)} ${n(-16 * s)} ${n(-6 * s)} ${n(-6 * s)} 0 0Z`;

/* the gold lotus on a scroll, drawn in a 400 x 170 box; base of the flower at (200,112) */
function lotus() {
  const P = (a, h, w, fill = "url(#gd)") => `<g transform="translate(200 112) rotate(${a})"><path d="${petal(h, w)}" fill="${fill}" stroke="#8A6020" stroke-width="1"/><path d="M0 -8V${n(-h * .78)}" stroke="#FFF3D0" stroke-width="1.1" opacity=".7"/></g>`;
  const L = (x, y, r, s) => `<path transform="translate(${x} ${y}) rotate(${r})" d="${leaf(s)}" fill="url(#gd)" stroke="#8A6020" stroke-width=".8"/>`;
  const side = `<g fill="none" stroke="url(#gd)" stroke-linecap="round">
    <path d="M196 121C166 124 151 141 119 138C93 135 86 112 104 106C118 101 129 116 117 122C111 125 104 121 107 115" stroke-width="4"/>
    <path d="M152 134C122 151 82 153 59 141C41 131 44 112 60 113C73 114 73 128 62 128" stroke-width="3.2"/>
    <path d="M60 141C42 151 24 149 12 141" stroke-width="2"/>
    <path d="M132 136C124 122 130 106 146 101" stroke-width="2"/>
    <path d="M96 147C92 160 104 166 112 160" stroke-width="1.6"/></g>
    ${L(146, 101, 62, .8)}${L(130, 116, -30, .55)}${L(84, 132, -70, .6)}${L(100, 146, 200, .5)}${L(36, 146, -100, .5)}
    <circle cx="8" cy="141" r="3" fill="url(#gd)"/><circle cx="114" cy="161" r="2.4" fill="url(#gd)"/><circle cx="170" cy="138" r="2.2" fill="url(#gd)"/>`;
  return `<g>${side}<g transform="translate(400 0) scale(-1 1)">${side}</g>
    ${P(-74, 54, 19)}${P(74, 54, 19)}${P(-52, 70, 22)}${P(52, 70, 22)}${P(-26, 84, 24)}${P(26, 84, 24)}${P(0, 96, 26)}
    ${P(-14, 52, 19, "url(#gdL)")}${P(14, 52, 19, "url(#gdL)")}
    <path d="M168 112Q200 132 232 112Q218 124 200 124Q182 124 168 112Z" fill="url(#gd)" stroke="#8A6020" stroke-width=".8"/>
    ${[-3, -2, -1, 0, 1, 2, 3].map(i => `<circle cx="${200 + i * 7}" cy="${n(128 + Math.abs(i) * -.6)}" r="1.8" fill="#B9893A"/>`).join("")}</g>`;
}

/* a full mandala (centre 0,0, radius about 210) */
function mandala(stroke, sw = 1.25) {
  const ring = (k, fn) => { let o = ""; for (let i = 0; i < k; i++) o += `<g transform="rotate(${n(i * 360 / k)})">${fn(i)}</g>`; return o };
  let g = `<circle r="14"/><circle r="22"/>` + ring(12, () => `<path d="M0-24C6-30 6-40 0-46C-6-40-6-30 0-24Z"/>`);
  g += `<circle r="50"/><circle r="54" stroke-dasharray="2 3"/>` + ring(36, () => `<circle cy="-59" r="1.8"/>`);
  g += `<circle r="64"/>` + ring(16, () => `<path d="M0-66C13-76 13-94 0-106C-13-94-13-76 0-66Z"/><path d="M0-72C7-78 7-90 0-98C-7-90-7-78 0-72Z"/><circle cy="-84" r="1.4"/>`);
  g += `<circle r="112" stroke-dasharray="3 4"/><circle r="118"/>` + ring(24, () => `<path d="M0-120C11-128 15-146 0-160C-15-146-11-128 0-120Z"/><path d="M0-128C5-134 6-142 0-149C-6-142-5-134 0-128Z"/>`);
  g += `<circle r="164"/>` + ring(48, () => `<path d="M-9-166Q0-180 9-166"/>`) + ring(24, () => `<path d="M0-168L7-188L0-202L-7-188Z"/><circle cy="-209" r="2.6"/>`);
  return `<g fill="none" stroke="${stroke}" stroke-width="${sw}">${g}</g>`;
}

/* a lotus flower seen from the side, line art, for the edge strips */
function bloom(x, y, s, r) {
  const P = (a, h, w) => `<path transform="rotate(${a})" d="${petal(h, w)}"/>`;
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(r)}) scale(${n(s)})" fill="#FBEFE4" fill-opacity=".55" stroke="#C49A4C" stroke-width="1.6">
    ${P(-60, 44, 15)}${P(60, 44, 15)}${P(-32, 58, 18)}${P(32, 58, 18)}${P(0, 66, 19)}<path d="M-22 2Q0 14 22 2" fill="none"/></g>`;
}
const bud = (x, y, s, r) => `<path transform="translate(${n(x)} ${n(y)}) rotate(${n(r)}) scale(${n(s)})" d="${petal(52, 15)}" fill="#F7DCD6" fill-opacity=".6" stroke="#C49A4C" stroke-width="1.6"/>`;
const pad = (x, y, s, r) => `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(r)}) scale(${n(s)})" fill="none" stroke="#C49A4C" stroke-width="1.5"><path d="M0 0L-46 -10A48 26 0 1 0 -38 18Z" fill="#EFE3CC" fill-opacity=".35"/>${[-150, -120, -90, -60, -30, 0, 30].map(a => `<path d="M0 0L${n(40 * Math.cos(a * Math.PI / 180))} ${n(20 * Math.sin(a * Math.PI / 180))}" stroke-width=".8" opacity=".7"/>`).join("")}</g>`;

/* ---------- pictures ---------- */
function bg(W, H) {
  let s = `<rect width="${W}" height="${H}" fill="url(#blush)"/>`;
  s += `<g filter="url(#sheen)" opacity=".7"><path d="M-100 ${H * .18}L${W + 100} ${H * .02}L${W + 100} ${H * .1}L-100 ${H * .3}Z" fill="#fff"/><path d="M-100 ${H * .62}L${W + 100} ${H * .44}L${W + 100} ${H * .5}L-100 ${H * .7}Z" fill="#fff" opacity=".7"/></g>`;
  s += `<g transform="translate(${W / 2} ${H * .5}) scale(${n(W / 330)})" opacity=".2">${mandala("#C9973F", .9)}</g>`;
  for (let i = 0; i < 70; i++) s += `<circle cx="${n(R(0, W))}" cy="${n(R(0, H))}" r="${n(R(.8, 2.4))}" fill="#D6AA55" opacity="${n(R(.15, .5))}"/>`;
  return s + `<rect width="${W}" height="${H}" filter="url(#paper)"/>`;
}
function side(W, H, dir) {
  let s = `<g fill="none" stroke="#C49A4C" stroke-linecap="round">
    <path d="M30 ${H}C60 ${H * .78} 34 ${H * .62} 92 ${H * .48}" stroke-width="2.4"/>
    <path d="M0 ${H * .9}C80 ${H * .82} 120 ${H * .76} 150 ${H * .7}" stroke-width="2"/>
    <path d="M0 ${H * .4}C40 ${H * .32} 60 ${H * .22} 70 ${H * .12}" stroke-width="2"/>
    <path d="M0 ${H * .2}C24 ${H * .14} 30 ${H * .08} 26 ${H * .02}" stroke-width="1.6"/></g>`;
  s += pad(110, H * .86, 1.4, -12) + pad(10, H * .56, 1.1, 30);
  s += bloom(92, H * .48, 1.6, 18) + bloom(150, H * .7, 1.15, 38) + bloom(14, H * .97, 1.3, 4);
  s += bud(70, H * .12, 1.3, 14) + bud(26, H * .02, .9, -6);
  for (let i = 0; i < 12; i++) s += `<circle cx="${n(R(10, 220))}" cy="${n(R(0, H))}" r="${n(R(1.2, 3))}" fill="#D6AA55" opacity="${n(R(.3, .7))}"/>`;
  const g = `<g opacity=".9">${s}</g>`;
  return dir === "r" ? `<g transform="translate(${W} 0) scale(-1 1)">${g}</g>` : g;
}
function card(W, H) {
  let s = bg(W, H).replace(/opacity="\.2">/, 'opacity=".08">');
  s += `<g transform="translate(${W / 2} 0) scale(${n(W / 860)})" opacity=".75">${mandala("#C29043", 1.4)}</g>`;
  s += `<rect x="34" y="34" width="${W - 68}" height="${H - 68}" rx="18" fill="none" stroke="#C9A050" stroke-width="2"/>`;
  s += `<rect x="48" y="48" width="${W - 96}" height="${H - 96}" rx="12" fill="none" stroke="#C9A050" stroke-width="1" opacity=".7"/>`;
  s += `<ellipse cx="${W / 2}" cy="${H * .52}" rx="${W * .42}" ry="${H * .24}" fill="url(#glow)"/>`;
  s += `<g transform="translate(${W / 2 - 306} ${H - 330}) scale(1.53)">${lotus()}</g>`;
  return s;
}
function venue(W, H) {
  return `<rect width="${W}" height="${H}" fill="url(#blush)"/><g transform="translate(${W / 2} ${H * .62}) scale(1.35)" opacity=".25">${mandala("#C9973F")}</g>
    <g transform="translate(${W / 2 - 300} ${H / 2 - 150}) scale(1.5)">${lotus()}</g><rect width="${W}" height="${H}" filter="url(#paper)"/>`;
}

const JOBS = [
  ["th-nelum-bg", 900, 1612, bg], ["th-nelum-l", 900, 1612, (W, H) => side(W, H, "l"), 1], ["th-nelum-r", 900, 1612, (W, H) => side(W, H, "r"), 1],
  ["th-nelum-card", 960, 1383, card], ["th-nelum-venue", 900, 672, venue],
];
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, W, H, fn, alpha] of JOBS) {
  seed = 11 + name.length;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${DEFS}</defs>${fn(W, H)}</svg>`;
  await page.setViewportSize({ width: W, height: H });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  const png = join(TMP, name + ".png");
  await page.locator("svg").first().screenshot({ path: png, omitBackground: !!alpha });
  const sizes = /-card$/.test(name) ? [[960, "-960"], [480, "-480"]] : [[W, ""]];
  for (const [w, suf] of sizes)
    execFileSync("python3", ["-c", `import sys
from PIL import Image
im=Image.open(sys.argv[1]); im=im.convert("RGBA" if sys.argv[4]=="1" else "RGB")
w=int(sys.argv[3]); im=im.resize((w, round(im.height*w/im.width)), Image.LANCZOS) if w!=im.width else im
im.save(sys.argv[2], "WEBP", quality=82, method=6)`, png, join(OUT, name + suf + ".webp"), String(w), alpha ? "1" : "0"]);
  console.log("saved", name);
}
await browser.close();
