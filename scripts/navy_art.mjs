/* Draws the art for the "Navy Promise" engagement design (deep navy, white roses, gold rings and gold line work) and saves it as WebP in img/.
 * The live bg, side flowers, card and couple picture are AI images (image-prompts.md, "Navy Promise"), so by default this only makes
 * th-navy-venue. ALL=1 redraws the old code-drawn versions too (th-navy-bg, -l, -r, -card-480/960, -hero-480/960); then run
 * python3 scripts/card_sides.py th-navy-card.  Run from the repo root: NODE_PATH=$(npm root -g) node scripts/navy_art.mjs
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
const TMP = mkdtempSync(join(tmpdir(), "navy-art-"));
const n = v => Math.round(v * 10) / 10;
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const R = (a, b) => a + rnd() * (b - a);
const G = (x, y, r, s, body) => `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(r)}) scale(${n(s)})">${body}</g>`;

const DEFS = `
<radialGradient id="navy" cx=".5" cy=".42" r=".8"><stop offset="0" stop-color="#22366E"/><stop offset=".55" stop-color="#152451"/><stop offset="1" stop-color="#0A1330"/></radialGradient>
<linearGradient id="gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBE9B2"/><stop offset=".35" stop-color="#E2BC68"/><stop offset=".7" stop-color="#B98A3A"/><stop offset="1" stop-color="#F3D58E"/></linearGradient>
<linearGradient id="gdv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8E3A6"/><stop offset=".5" stop-color="#D6AE5C"/><stop offset="1" stop-color="#A97A2E"/></linearGradient>
<radialGradient id="pt" cx=".5" cy=".85" r="1"><stop offset="0" stop-color="#C9D2E6"/><stop offset=".35" stop-color="#F2F4FA"/><stop offset="1" stop-color="#FFFFFF"/></radialGradient>
<radialGradient id="ptIn" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#B7C2DC"/><stop offset="1" stop-color="#F4F6FB"/></radialGradient>
<radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3A5398" stop-opacity=".55"/><stop offset="1" stop-color="#3A5398" stop-opacity="0"/></radialGradient>
<radialGradient id="bok" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE7A8" stop-opacity=".55"/><stop offset="1" stop-color="#FFE7A8" stop-opacity="0"/></radialGradient>
<linearGradient id="dia" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#DCE6F8"/><stop offset="1" stop-color="#9FB3DA"/></linearGradient>
<filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 .8  0 0 0 0 .85  0 0 0 0 1  0 0 0 .05 0"/></filter>
<filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#050A1C" flood-opacity=".45"/></filter>
<filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter>`;

/* ---------- motifs ---------- */
const petalP = (h, w) => `M0 0C${n(-w * .9)} ${n(-h * .25)} ${n(-w)} ${n(-h * .92)} 0 ${n(-h)}C${n(w)} ${n(-h * .92)} ${n(w * .9)} ${n(-h * .25)} 0 0Z`;
const leafP = s => `M0 0C${n(7 * s)} ${n(-7 * s)} ${n(7 * s)} ${n(-18 * s)} 0 ${n(-26 * s)}C${n(-7 * s)} ${n(-18 * s)} ${n(-7 * s)} ${n(-7 * s)} 0 0Z`;

/* a white rose seen from above, radius about 40 at scale 1 */
function rose(x, y, s, r = 0) {
  const ring = (k, h, w, off, cls) => { let o = ""; for (let i = 0; i < k; i++) o += `<path transform="rotate(${n(off + i * 360 / k)})" d="${petalP(h, w)}" fill="url(#${cls})" stroke="#AEB9D3" stroke-width=".9"/>`; return o };
  const body = ring(6, 40, 21, 0, "pt") + ring(5, 30, 18, 30, "pt") + ring(5, 21, 14, 8, "pt") +
    `<circle r="11" fill="url(#ptIn)" stroke="#AEB9D3" stroke-width=".9"/>` +
    `<path d="M-6 2C-8 -5 -1 -9 4 -6C9 -3 7 4 1 5C-3 6 -5 2 -2 0C0 -2 3 -1 2 1" fill="none" stroke="#8D9BBD" stroke-width="1.2" stroke-linecap="round"/>`;
  return `<g filter="url(#shadow)">${G(x, y, r, s, body)}</g>`;
}
/* a rose bud from the side */
const bud = (x, y, s, r) => G(x, y, r, s, `<path d="M0 0C-10 -6 -11 -22 0 -32C11 -22 10 -6 0 0Z" fill="url(#pt)" stroke="#AEB9D3" stroke-width=".9"/><path d="M0 0C-4 -10 -2 -22 4 -28" fill="none" stroke="#AEB9D3" stroke-width=".9"/><path d="M0 2C-9 -2 -12 -10 -12 -14C-6 -10 -2 -6 0 2ZM0 2C9 -2 12 -10 12 -14C6 -10 2 -6 0 2Z" fill="url(#gdv)"/>`);
const leaf = (x, y, s, r) => G(x, y, r, s, `<path d="${leafP(1)}" fill="url(#gd)" stroke="#8A6424" stroke-width=".6"/><path d="M0 -2V-23" stroke="#FFF2CC" stroke-width=".8" opacity=".75"/>`);
const leafLine = (x, y, s, r) => G(x, y, r, s, `<path d="${leafP(1)}" fill="none" stroke="url(#gd)" stroke-width="1.4"/><path d="M0 -2V-23" stroke="url(#gd)" stroke-width=".9"/>`);
/* baby's breath: a spray of tiny white dots on fine gold stems */
function breath(x, y, s, r) {
  let o = ""; for (let i = 0; i < 7; i++) { const a = -150 + i * 20 + R(-6, 6), L = R(24, 44), ex = n(Math.cos(a * Math.PI / 180) * L), ey = n(Math.sin(a * Math.PI / 180) * L);
    o += `<path d="M0 0Q${n(ex * .4)} ${n(ey * .7)} ${ex} ${ey}" fill="none" stroke="#C9A35A" stroke-width=".9"/>`;
    for (let k = 0; k < 4; k++) o += `<circle cx="${n(ex + R(-6, 6))}" cy="${n(ey + R(-6, 6))}" r="${n(R(1.6, 3))}" fill="#FFFFFF" opacity="${n(R(.75, 1))}"/>` }
  return G(x, y, r, s, o);
}
/* a gold sprig: a curved stem with leaves on both sides */
function sprig(x, y, s, r, line) {
  let o = `<path d="M0 0C10 -30 6 -70 20 -110" fill="none" stroke="url(#gd)" stroke-width="1.8" stroke-linecap="round"/>`;
  const f = line ? leafLine : leaf;
  [[3, -18, -55], [8, -38, 55], [7, -58, -50], [10, -78, 50], [15, -96, -40]].forEach(([lx, ly, a], i) => o += f(lx, ly, .8 - i * .07, a));
  return G(x, y, r, s, o);
}
/* two interlocked gold rings, the right one with a diamond; centre 0,0, about 150 wide */
function rings(x, y, s) {
  const ring = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="40" fill="none" stroke="#7D5A1E" stroke-width="13"/><circle cx="${cx}" cy="${cy}" r="40" fill="none" stroke="url(#gd)" stroke-width="10"/><circle cx="${cx}" cy="${cy}" r="43" fill="none" stroke="#FFF1C4" stroke-width="1" opacity=".7"/>`;
  const A = ring(-26, 6), B = ring(26, -2);
  const over = `<path d="M-26 -34A40 40 0 0 1 12.3 -6.5" fill="none" stroke="#7D5A1E" stroke-width="13"/><path d="M-26 -34A40 40 0 0 1 12.3 -6.5" fill="none" stroke="url(#gd)" stroke-width="10"/>`;
  const dia = `<g transform="translate(26 -50)"><path d="M-6 6H6L4 0H-4Z" fill="url(#gdv)"/><path d="M-13 -6L-7 -14H7L13 -6L0 9Z" fill="url(#dia)" stroke="#8FA3CB" stroke-width=".8"/><path d="M-13 -6H13M-7 -14L-3 -6L0 9L3 -6L7 -14M-3 -6L0 -14L3 -6" fill="none" stroke="#8FA3CB" stroke-width=".6"/>
    <path d="M0 -30V-20M-10 -26L-6 -19M10 -26L6 -19" stroke="#FFF6D8" stroke-width="1.4" stroke-linecap="round"/></g>`;
  return `<g filter="url(#shadow)">${G(x, y, 0, s, A + B + over + dia)}</g>`;
}
/* fine gold corner ornament for the card frame (top-left; mirror for the others) */
const corner = `<g fill="none" stroke="url(#gd)" stroke-linecap="round"><path d="M0 70C0 30 30 0 70 0" stroke-width="2"/><path d="M14 90C14 40 40 14 90 14" stroke-width="1"/>
  <path d="M40 40C26 30 26 14 40 12C52 10 54 26 44 30" stroke-width="1.6"/><circle cx="40" cy="40" r="3" fill="url(#gd)"/><path d="M70 0C90 0 100 8 110 18M0 70C0 90 8 100 18 110" stroke-width="1.2"/></g>`;
const flourish = w => `<g fill="none" stroke="url(#gd)" stroke-linecap="round"><path d="M${-w} 0H-30M30 0H${w}" stroke-width="2"/><path d="M-30 0C-22 -10 -10 -10 0 0C10 -10 22 -10 30 0C22 10 10 10 0 0C-10 10 -22 10 -30 0Z" stroke-width="2.2"/><circle r="3" fill="url(#gd)"/><circle cx="${-w}" r="2.4" fill="url(#gd)"/><circle cx="${w}" r="2.4" fill="url(#gd)"/></g>`;

/* a rose cluster for corners: roses, buds, leaves, baby's breath */
function cluster(x, y, s, r) {
  let o = sprig(-40, 30, 1.1, -70) + sprig(30, 40, 1, 20) + sprig(10, 50, 1.2, -25, 1) + breath(-60, -10, 1.2, -30) + breath(60, 20, 1.1, 40);
  [[-48, 6, -120], [46, -14, 30], [-10, 46, 170], [20, 40, 120], [-30, -34, -60]].forEach(([lx, ly, a]) => o += leaf(lx, ly, 1.25, a));
  o += bud(-70, -30, 1, -50) + bud(70, -36, .9, 40);
  o += rose(-26, 0, 1.05, 10) + rose(30, 14, .82, -20) + rose(4, -32, .66, 40);
  return G(x, y, r, s, o);
}
const dust = (W, H, k, a = .5) => { let o = ""; for (let i = 0; i < k; i++) o += `<circle cx="${n(R(0, W))}" cy="${n(R(0, H))}" r="${n(R(.6, 2.2))}" fill="#E8C878" opacity="${n(R(.15, a))}"/>`; return o };
/* a damask-like lattice of fine gold diamonds, very faint */
function lattice(W, H, op) {
  let o = ""; for (let y = -40; y < H + 80; y += 80) for (let x = (y / 80) % 2 ? 40 : 0; x < W + 80; x += 80)
    o += `<path d="M${x} ${y - 14}L${x + 8} ${y}L${x} ${y + 14}L${x - 8} ${y}Z" /><circle cx="${x + 40}" cy="${y}" r="1.4"/>`;
  return `<g fill="none" stroke="#D6B26A" stroke-width=".8" opacity="${op}">${o}</g>`;
}

/* ---------- pictures ---------- */
function bg(W, H) {
  let s = `<rect width="${W}" height="${H}" fill="url(#navy)"/>` + lattice(W, H, .07);
  s += `<ellipse cx="${W / 2}" cy="${H * .45}" rx="${W * .6}" ry="${H * .35}" fill="url(#glow)"/>`;
  return s + dust(W, H, 90) + `<rect width="${W}" height="${H}" filter="url(#paper)"/>`;
}
function side(W, H, dir) {
  let s = `<g fill="none" stroke="url(#gd)" stroke-linecap="round">
    <path d="M-10 ${H}C70 ${H * .82} 20 ${H * .66} 96 ${H * .5}" stroke-width="2.2"/>
    <path d="M-10 ${H * .36}C50 ${H * .3} 70 ${H * .2} 60 ${H * .08}" stroke-width="1.8"/></g>`;
  s += sprig(96, H * .5, 2, 30, 1) + sprig(60, H * .08, 1.5, -10) + sprig(20, H * .7, 1.8, 40);
  s += breath(150, H * .62, 2.2, 50) + breath(80, H * .22, 1.8, 30) + breath(40, H * .86, 2.2, 60);
  s += cluster(40, H * .95, 1.9, 20) + cluster(10, H * .4, 1.5, 60) + cluster(0, H * .03, 1.3, 120);
  s += rose(120, H * .5, 1.4, 0) + bud(170, H * .74, 1.8, 50) + bud(90, H * .14, 1.5, 20);
  for (let i = 0; i < 16; i++) s += `<circle cx="${n(R(10, 230))}" cy="${n(R(0, H))}" r="${n(R(1, 2.8))}" fill="#E8C878" opacity="${n(R(.35, .8))}"/>`;
  return dir === "r" ? `<g transform="translate(${W} 0) scale(-1 1)">${s}</g>` : s;
}
function card(W, H) {
  let s = `<rect width="${W}" height="${H}" fill="url(#navy)"/>` + lattice(W, H, .05) + `<ellipse cx="${W / 2}" cy="${H * .52}" rx="${W * .46}" ry="${H * .32}" fill="url(#glow)"/>` + dust(W, H, 60, .4);
  s += `<rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="6" fill="none" stroke="url(#gd)" stroke-width="2.4"/>`;
  s += `<rect x="54" y="54" width="${W - 108}" height="${H - 108}" rx="4" fill="none" stroke="url(#gd)" stroke-width="1" opacity=".75"/>`;
  [[40, 40, 1, 1], [W - 40, 40, -1, 1], [40, H - 40, 1, -1], [W - 40, H - 40, -1, -1]].forEach(([x, y, a, b]) => s += `<g transform="translate(${x} ${y}) scale(${a} ${b})">${corner}</g>`);
  s += cluster(150, 150, 2.4, -35) + cluster(W - 140, H - 150, 2.6, 145);
  s += rings(W / 2, 180, 1.15) + `<g transform="translate(${W / 2} ${H - 110}) scale(1.3)">${flourish(100)}</g>`;
  return s + `<rect width="${W}" height="${H}" filter="url(#paper)"/>`;
}
function hero(W, H) {
  let s = `<rect width="${W}" height="${H}" fill="url(#navy)"/>` + lattice(W, H, .06);
  for (let i = 0; i < 22; i++) { const r = R(14, 60); s += `<circle cx="${n(R(0, W))}" cy="${n(R(0, H * .7))}" r="${n(r)}" fill="url(#bok)" opacity="${n(R(.3, .9))}"/>` }
  s += `<ellipse cx="${W / 2}" cy="${H * .5}" rx="${W * .4}" ry="${H * .42}" fill="url(#glow)"/>` + dust(W, H, 80, .7);
  s += `<g transform="translate(${W / 2} ${H * .9})" opacity=".55" filter="url(#blur8)"><ellipse rx="260" ry="26" fill="#050A1C"/></g>`;
  s += cluster(W * .22, H * .78, 2.1, -10) + cluster(W * .8, H * .8, 1.9, 20);
  s += rings(W / 2, H * .5, 2.3);
  s += `<g transform="translate(${W / 2} ${H * .14})">${flourish(180)}</g>`;
  return s + `<rect width="${W}" height="${H}" filter="url(#paper)"/>`;
}
function venue(W, H) {
  /* gold line-art pavilion with roses at its feet */
  let a = `<g fill="none" stroke="url(#gd)" stroke-linecap="round" stroke-width="2">
    <path d="M-150 260V40C-150 -60 -80 -120 0 -140C80 -120 150 -60 150 40V260"/><path d="M-128 260V44C-128 -46 -70 -98 0 -116C70 -98 128 -46 128 44V260" stroke-width="1"/>
    <path d="M-170 260H170" stroke-width="1.4"/>
    <path d="M0 -140V-170M-8 -162L0 -176L8 -162" /><circle cx="0" cy="-182" r="4"/>
    ${[-100, -50, 0, 50, 100].map(x => `<path d="M${x} ${n(-110 + Math.abs(x) * .55)}V${n(-60 + Math.abs(x) * .55)}" stroke-width=".8"/><circle cx="${x}" cy="${n(-54 + Math.abs(x) * .55)}" r="3"/>`).join("")}</g>`;
  let s = `<rect width="${W}" height="${H}" fill="url(#navy)"/>` + lattice(W, H, .06) + `<ellipse cx="${W / 2}" cy="${H * .55}" rx="${W * .4}" ry="${H * .45}" fill="url(#glow)"/>` + dust(W, H, 60);
  s += G(W / 2, H * .5, 0, 1.05, a) + cluster(W / 2 - 170, H * .86, 1.15, -10) + cluster(W / 2 + 170, H * .86, 1.15, 10) + rings(W / 2, H * .5, .7);
  return s + `<rect width="${W}" height="${H}" filter="url(#paper)"/>`;
}

const ALL_JOBS = [
  ["th-navy-bg", 900, 1612, bg], ["th-navy-l", 900, 1612, (W, H) => side(W, H, "l"), 1], ["th-navy-r", 900, 1612, (W, H) => side(W, H, "r"), 1],
  ["th-navy-card", 960, 1383, card], ["th-navy-hero", 960, 717, hero], ["th-navy-venue", 900, 672, venue],
];
const JOBS = process.env.ALL ? ALL_JOBS : ALL_JOBS.filter(j => j[0] === "th-navy-venue");
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, W, H, fn, alpha] of JOBS) {
  seed = 7 + name.length * 13;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${DEFS}</defs>${fn(W, H)}</svg>`;
  await page.setViewportSize({ width: W, height: H });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  const png = join(TMP, name + ".png");
  await page.locator("svg").first().screenshot({ path: png, omitBackground: !!alpha });
  const sizes = /-(card|hero)$/.test(name) ? [[960, "-960"], [480, "-480"]] : [[W, ""]];
  for (const [w, suf] of sizes)
    execFileSync("python3", ["-c", `import sys
from PIL import Image
im=Image.open(sys.argv[1]); im=im.convert("RGBA" if sys.argv[4]=="1" else "RGB")
w=int(sys.argv[3]); im=im.resize((w, round(im.height*w/im.width)), Image.LANCZOS) if w!=im.width else im
im.save(sys.argv[2], "WEBP", quality=82, method=6)`, png, join(OUT, name + suf + ".webp"), String(w), alpha ? "1" : "0"]);
  console.log("saved", name);
}
await browser.close();
