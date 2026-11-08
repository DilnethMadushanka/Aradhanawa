/* Draws the starter art for the two Halloween designs (Pumpkin Patch, Haunted Night) and saves it as WebP in img/.
 * The files are stand-ins until AI images are made from image-prompts.md (section "Halloween"): save new images
 * with the same names and sizes and they replace these. Run: NODE_PATH=$(npm root -g) node scripts/halloween_art.mjs && python3 scripts/card_sides.py  (needs playwright + python3 Pillow) */
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");   /* resolved through NODE_PATH too, e.g. NODE_PATH=$(npm root -g) */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "img");
const TMP = mkdtempSync(join(tmpdir(), "hw-art-"));
const n = v => Math.round(v * 10) / 10;

/* a seeded random so every run draws the same picture */
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const R = (a, b) => a + rnd() * (b - a);

/* ---------- motifs ---------- */
const DEFS = `
<radialGradient id="pk" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#FFB15C"/><stop offset=".55" stop-color="#E9711F"/><stop offset="1" stop-color="#A9420E"/></radialGradient>
<radialGradient id="pkD" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#F59A45"/><stop offset=".6" stop-color="#C85512"/><stop offset="1" stop-color="#7A2C08"/></radialGradient>
<radialGradient id="pkW" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#FFF8EC"/><stop offset=".6" stop-color="#F1E3CC"/><stop offset="1" stop-color="#C9B28E"/></radialGradient>
<radialGradient id="glowY"><stop offset="0" stop-color="#FFE9A0" stop-opacity=".95"/><stop offset=".4" stop-color="#FFB547" stop-opacity=".45"/><stop offset="1" stop-color="#FF8A1E" stop-opacity="0"/></radialGradient>
<radialGradient id="moon" cx=".42" cy=".4" r=".6"><stop offset="0" stop-color="#FFFBEA"/><stop offset=".7" stop-color="#F6E7B8"/><stop offset="1" stop-color="#E6C98A"/></radialGradient>
<radialGradient id="moonHalo"><stop offset=".35" stop-color="#FFF3C8" stop-opacity=".55"/><stop offset="1" stop-color="#B9A6FF" stop-opacity="0"/></radialGradient>
<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="blur2"><feGaussianBlur stdDeviation="2"/></filter>
<filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .38  0 0 0 0 .22  0 0 0 .07 0"/></filter>
<filter id="fog" x="-10%" y="-50%" width="120%" height="200%"><feTurbulence type="fractalNoise" baseFrequency=".006 .02" numOctaves="3" seed="9"/><feColorMatrix values="0 0 0 0 .78  0 0 0 0 .72  0 0 0 0 .95  0 0 0 .9 -.32"/><feGaussianBlur stdDeviation="3"/></filter>`;

function pumpkin(x, y, r, o = {}) {
  const fill = o.white ? "url(#pkW)" : o.dark ? "url(#pkD)" : "url(#pk)", line = o.white ? "#A88E66" : "#8A3208";
  const h = r * .82, lobes = [[-.62, .5], [.62, .5], [-.34, .58], [.34, .58], [0, .5]];
  let s = `<g transform="translate(${n(x)} ${n(y)}) rotate(${o.rot || 0})">`;
  if (o.lit) s += `<circle r="${n(r * 2.3)}" fill="url(#glowY)"/>`;
  s += `<ellipse cx="0" cy="${n(h * .92)}" rx="${n(r * 1.05)}" ry="${n(r * .16)}" fill="#000" opacity=".16" filter="url(#blur2)"/>`;
  lobes.forEach(([dx, rx]) => { s += `<ellipse cx="${n(dx * r)}" cy="0" rx="${n(rx * r)}" ry="${n(h)}" fill="${fill}" stroke="${line}" stroke-width="${n(Math.max(1, r * .03))}" stroke-opacity=".55"/>` });
  s += `<ellipse cx="${n(-r * .3)}" cy="${n(-h * .45)}" rx="${n(r * .12)}" ry="${n(h * .28)}" fill="#fff" opacity=".22"/>`;
  s += `<path d="M${n(-r * .07)} ${n(-h * .9)}C${n(-r * .1)} ${n(-h * 1.25)} ${n(r * .05)} ${n(-h * 1.45)} ${n(r * .22)} ${n(-h * 1.5)}L${n(r * .24)} ${n(-h * 1.38)}C${n(r * .12)} ${n(-h * 1.3)} ${n(r * .07)} ${n(-h * 1.1)} ${n(r * .09)} ${n(-h * .9)}Z" fill="#4E5A26" stroke="#2E3812" stroke-width="${n(Math.max(1, r * .03))}"/>`;
  if (o.curl) s += `<path d="M${n(r * .05)} ${n(-h * 1.05)}c${n(r * .2)} ${n(-r * .1)} ${n(r * .45)} ${n(-r * .02)} ${n(r * .38)} ${n(r * .12)}c${n(-r * .05)} ${n(r * .1)} ${n(-r * .2)} ${n(r * .05)} ${n(-r * .14)} ${n(-r * .04)}" fill="none" stroke="#5E6B2C" stroke-width="${n(r * .035)}" stroke-linecap="round"/>`;
  if (o.leaf) s += `<path transform="translate(${n(-r * .1)} ${n(-h * 1)}) rotate(-35) scale(${n(r / 60)})" d="M0 0C10-14 30-18 44-10C34-2 18 6 0 0Z" fill="#6F7F33" stroke="#3E4A16" stroke-width="1.4"/>`;
  if (o.lit) {
    const f = "#FFD45A";
    s += `<g fill="${f}" stroke="#7A2C08" stroke-width="${n(r * .02)}">
      <path d="M${n(-r * .45)} ${n(-h * .12)}L${n(-r * .2)} ${n(-h * .12)}L${n(-r * .33)} ${n(-h * .42)}Z"/>
      <path d="M${n(r * .45)} ${n(-h * .12)}L${n(r * .2)} ${n(-h * .12)}L${n(r * .33)} ${n(-h * .42)}Z"/>
      <path d="M${n(-r * .07)} ${n(h * .05)}L${n(r * .07)} ${n(h * .05)}L0 ${n(-h * .12)}Z"/>
      <path d="M${n(-r * .58)} ${n(h * .22)}Q0 ${n(h * .75)} ${n(r * .58)} ${n(h * .22)}L${n(r * .4)} ${n(h * .28)}L${n(r * .3)} ${n(h * .4)}L${n(r * .16)} ${n(h * .32)}L0 ${n(h * .45)}L${n(-r * .16)} ${n(h * .32)}L${n(-r * .3)} ${n(h * .4)}L${n(-r * .4)} ${n(h * .28)}Z"/></g>`;
  }
  return s + "</g>";
}
const MAPLE = "M0-20L4-10L10-14L8-5L18-6L12 2L16 6L6 6L4 14L0 10L-4 14L-6 6L-16 6L-12 2L-18-6L-8-5L-10-14L-4-10Z";
const LEAF_C = ["#D9572B", "#E8902F", "#B9381E", "#C9A23A", "#8E4A1E"];
const leaf = (x, y, s, rot, c) => `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(s)})"><path d="${MAPLE}" fill="${c}" stroke="#6A2A0E" stroke-width=".6" stroke-opacity=".5"/><path d="M0 10V24M0 10L0-14M0 4L10-8M0 4L-10-8" stroke="#6A2A0E" stroke-width=".7" stroke-opacity=".55" fill="none"/></g>`;
const BAT = "M0-4C3-10 6-10 7-4C12-12 22-14 30-8C26-6 24-2 25 3C21 0 17 1 15 5C12 2 8 2 6 6C4 3 2 2 0 4C-2 2-4 3-6 6C-8 2-12 2-15 5C-17 1-21 0-25 3C-24-2-26-6-30-8C-22-14-12-12-7-4C-6-10-3-10 0-4Z M-3-5L-4.5-10L-1-7H1L4.5-10L3-5Z";
const bat = (x, y, s, rot = 0, c = "#120A1E") => `<path transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(s)})" d="${BAT}" fill="${c}"/>`;
const star = (x, y, s, c = "#FFF3C8", o = 1) => `<path transform="translate(${n(x)} ${n(y)}) scale(${n(s)})" d="M0-7L1.5-1.5L7 0L1.5 1.5L0 7L-1.5 1.5L-7 0L-1.5-1.5Z" fill="${c}" opacity="${o}"/>`;
function web(x, y, s, rot, c) {
  let o = `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" fill="none" stroke="${c}" stroke-width="1.1">`;
  const A = [0, 15, 30, 45, 60, 75, 90].map(a => a * Math.PI / 180);
  A.forEach(a => o += `<path d="M0 0L${n(Math.cos(a) * 200)} ${n(Math.sin(a) * 200)}"/>`);
  for (let r = 30; r <= 190; r += 32) { let d = ""; A.forEach((a, i) => { const p = [Math.cos(a) * r, Math.sin(a) * r]; if (!i) d = `M${n(p[0])} ${n(p[1])}`; else { const m = (a + A[i - 1]) / 2, rr = r * .86; d += `Q${n(Math.cos(m) * rr)} ${n(Math.sin(m) * rr)} ${n(p[0])} ${n(p[1])}` } }); o += `<path d="${d}"/>` }
  return o + `<path d="M120 100V150" /><g transform="translate(120 160)"><ellipse rx="7" ry="9" fill="${c}"/><circle cy="-10" r="4.5" fill="${c}"/><path d="M-6-4L-16-12M-6 0L-17-2M-6 4L-15 10M6-4L16-12M6 0L17-2M6 4L15 10" stroke-width="1.6"/></g></g>`;
}
function ghost(x, y, s, o = .9) {
  return `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o}"><path d="M-30 40V-5C-30-30-14-44 0-44S30-30 30-5V40L20 30L10 40L0 30L-10 40L-20 30Z" fill="#F4F0FF"/><ellipse cx="-10" cy="-12" rx="4" ry="6" fill="#2A1C44"/><ellipse cx="10" cy="-12" rx="4" ry="6" fill="#2A1C44"/><ellipse cx="0" cy="4" rx="5" ry="6" fill="#2A1C44"/></g>`;
}
const candle = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><circle cy="-34" r="26" fill="url(#glowY)"/><rect x="-7" y="-22" width="14" height="40" rx="2" fill="#F3E6CF" stroke="#B59A72"/><path d="M0-36C5-30 5-25 0-22C-5-25-5-30 0-36Z" fill="#FFB547"/><path d="M0-31C2-28 2-25 0-23C-2-25-2-28 0-31Z" fill="#FFF3C0"/></g>`;
function vine(pts, w, c) { let d = `M${pts[0][0]} ${pts[0][1]}`; for (let i = 1; i < pts.length; i++) { const [a, b] = pts[i - 1], [x, y] = pts[i]; d += `Q${n(a + (x - a) * .5 + (i % 2 ? 18 : -18))} ${n(b + (y - b) * .5)} ${x} ${y}` } return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>` }
const curl = (x, y, r, dir, c, w = 2) => { let d = ""; for (let i = 0; i <= 30; i++) { const t = Math.PI * 2.2 * i / 30, rr = r * (1 - .8 * i / 30), a = dir * t; d += (i ? "L" : "M") + n(x + Math.cos(a) * rr) + " " + n(y + Math.sin(a) * rr) } return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>` };
function house(x, y, s, c) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}">
  <path d="M-150 0V-120L-110-170L-70-120V-150H-60V-190L-30-250L0-190V-150L60-210L120-150V-100L150-130L180-100V0Z"/>
  <path d="M-36-250H-24V-275H-36Z"/><path d="M70-200V-240H84V-188Z"/>
  ${[[-130, -100], [-95, -100], [-45, -170], [-15, -170], [20, -120], [60, -120], [95, -120], [140, -80], [-130, -50], [20, -60], [95, -60]].map(([a, b], i) => `<rect x="${a}" y="${b}" width="${i === 4 || i === 8 ? 16 : 18}" height="${i < 2 ? 26 : 28}" fill="${i % 3 === 1 ? "#1A1030" : "#FFC860"}" opacity="${i % 3 === 1 ? 1 : .9}"/>`).join("")}
  <path d="M50 0V-40Q65-55 80-40V0Z" fill="#1A1030"/></g>`;
}
const tomb = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><path d="M-20 0V-40Q-20-60 0-60Q20-60 20-40V0Z"/><path d="M-6-44H6M0-50V-30" stroke="#5C4A84" stroke-width="2.4" fill="none"/></g>`;
const fence = (x0, x1, y, h, c) => { let o = `<path d="M${x0} ${y - h * .6}H${x1}M${x0} ${y - h * .25}H${x1}" stroke="${c}" stroke-width="4"/>`; for (let x = x0; x <= x1; x += 22) o += `<path d="M${x} ${y}V${y - h}l5-10 5 10V${y}Z" fill="${c}"/>`; return o };

/* ---------- Pumpkin Patch (light, autumn) ---------- */
const PK_BG = "#FBF1E4";
function pkCluster(cx, cy, s, flip = 1) {
  return [
    leaf(cx + flip * 90 * s, cy - 40 * s, 2.4 * s, 20, LEAF_C[0]), leaf(cx - flip * 70 * s, cy - 10 * s, 2 * s, -30, LEAF_C[1]),
    pumpkin(cx + flip * 40 * s, cy + 10 * s, 70 * s, { curl: 1, leaf: 1 }), pumpkin(cx - flip * 55 * s, cy + 40 * s, 52 * s, { white: 1, curl: 1 }),
    pumpkin(cx + flip * 120 * s, cy + 50 * s, 40 * s, { dark: 1 }), leaf(cx + flip * 160 * s, cy + 70 * s, 1.6 * s, 60, LEAF_C[3])].join("");
}
function pkSide(W, H, side) { /* side art on a clear background: a hanging vine with leaves, pumpkins at the foot */
  let o = ""; const X = y => 30 + 50 * Math.sin(y / 170) + 40 * Math.sin(Math.PI * y / H);
  const pts = []; for (let y = -10; y <= H - 260; y += 90) pts.push([n(X(y)), y]);
  o += vine(pts, 5, "#5E6B2C");
  pts.forEach(([x, y], i) => { if (i % 2) o += curl(x + 30, y + 10, 20, 1, "#5E6B2C", 3); o += leaf(x + (i % 2 ? 40 : -10), y + 30, R(1.6, 2.6), R(-40, 60), LEAF_C[i % 5]) });
  o += pumpkin(150, H - 130, 120, { curl: 1, leaf: 1 }) + pumpkin(60, H - 50, 70, { dark: 1 }) + leaf(260, H - 60, 2.4, 40, LEAF_C[2]) + pumpkin(290, H - 70, 50, { white: 1 });
  for (let i = 0; i < 8; i++) o += leaf(R(20, 300), R(100, H - 300), R(1, 1.8), R(0, 360), LEAF_C[i % 5]);
  return side === "r" ? `<g transform="translate(${W} 0) scale(-1 1)">${o}</g>` : o;
}
function pkBg(W, H) {
  let o = `<rect width="${W}" height="${H}" fill="${PK_BG}"/><rect width="${W}" height="${H}" filter="url(#paper)"/>`;
  o += `<rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="#C8651B" stroke-opacity=".35" stroke-width="2"/><rect x="54" y="54" width="${W - 108}" height="${H - 108}" fill="none" stroke="#C8651B" stroke-opacity=".2" stroke-width="1"/>`;
  for (let i = 0; i < 22; i++) o += `<g opacity=".18">${leaf(R(60, W - 60), R(60, H - 60), R(.9, 1.6), R(0, 360), LEAF_C[i % 5])}</g>`;
  return o;
}
function pkCard(W, H) {
  let o = pkBg(W, H);
  o += `<g>${leaf(70, 60, 3, 30, LEAF_C[0])}${leaf(170, 40, 2.2, -20, LEAF_C[1])}${leaf(40, 170, 2, 80, LEAF_C[3])}${curl(130, 120, 30, 1, "#5E6B2C", 3)}</g>`;
  o += `<g transform="translate(${W} 0) scale(-1 1)">${leaf(70, 60, 3, 30, LEAF_C[2])}${leaf(170, 40, 2.2, -20, LEAF_C[1])}${leaf(40, 170, 2, 80, LEAF_C[0])}${curl(130, 120, 30, 1, "#5E6B2C", 3)}</g>`;
  o += pkCluster(140, H - 150, 1.1, 1) + `<g transform="translate(${W} 0) scale(-1 1)">${pkCluster(140, H - 150, 1.1, 1)}</g>`;
  o += pumpkin(W / 2, H - 70, 46, { curl: 1 }) + leaf(W / 2 - 70, H - 50, 1.4, -40, LEAF_C[1]) + leaf(W / 2 + 70, H - 50, 1.4, 40, LEAF_C[0]);
  return o;
}
function pkHero(W, H) {
  let o = `<defs><linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7C98B"/><stop offset=".55" stop-color="#F3A766"/><stop offset="1" stop-color="#E7895A"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#dusk)"/><circle cx="${W * .72}" cy="${H * .3}" r="90" fill="#FFE3A8" opacity=".85"/>
  <path d="M0 ${H * .55}Q${W * .25} ${H * .45} ${W * .5} ${H * .52}T${W} ${H * .5}V${H}H0Z" fill="#B9683A" opacity=".55"/>
  <path d="M0 ${H * .62}Q${W * .3} ${H * .55} ${W * .6} ${H * .62}T${W} ${H * .6}V${H}H0Z" fill="#8E5A2A" opacity=".7"/>
  <path d="M0 ${H * .7}H${W}V${H}H0Z" fill="#C99A55"/>`;
  for (let i = 0; i < 40; i++) o += `<path d="M${n(R(0, W))} ${n(R(H * .7, H))}l${n(R(-8, 8))} -${n(R(10, 24))}" stroke="#A97A3A" stroke-width="2"/>`;
  o += `<rect x="${W * .3}" y="${H * .68}" width="${W * .4}" height="${H * .14}" rx="10" fill="#E3B85F" stroke="#A7792D" stroke-width="3"/><path d="M${W * .3} ${H * .75}H${W * .7}" stroke="#A7792D" stroke-width="2"/>`;
  const strand = []; for (let x = 20; x <= W - 20; x += 46) strand.push(x);
  o += `<path d="M0 40Q${W / 2} 140 ${W} 40" fill="none" stroke="#5A3A20" stroke-width="2"/>` + strand.map(x => { const y = 40 + 100 * (1 - ((x - W / 2) / (W / 2)) ** 2); return `<circle cx="${x}" cy="${n(y + 8)}" r="18" fill="url(#glowY)"/><circle cx="${x}" cy="${n(y + 8)}" r="6" fill="#FFE29A"/>` }).join("");
  o += pumpkin(W * .5, H * .62, 95, { curl: 1, leaf: 1, lit: 1 }) + pumpkin(W * .36, H * .66, 60, { white: 1 }) + pumpkin(W * .63, H * .67, 66, { dark: 1, curl: 1 });
  o += pumpkin(W * .15, H * .86, 85, { curl: 1, leaf: 1 }) + pumpkin(W * .85, H * .86, 80, { lit: 1 }) + pumpkin(W * .3, H * .93, 50, { dark: 1 }) + pumpkin(W * .7, H * .94, 55, { white: 1 });
  o += candle(W * .44, H * .9, 1.4) + candle(W * .56, H * .92, 1.1);
  for (let i = 0; i < 14; i++) o += leaf(R(0, W), R(H * .15, H), R(1, 1.8), R(0, 360), LEAF_C[i % 5]);
  return o;
}
function pkVenue(W, H) {
  const c = "#B87A3C";
  let o = `<rect width="${W}" height="${H}" fill="#FBF3E8"/><g fill="none" stroke="${c}" stroke-width="2.2" stroke-linejoin="round">`;
  o += `<path d="M260 520V300L450 170L640 300V520Z"/><path d="M230 315L450 160L670 315"/><path d="M400 520V420H500V520"/><path d="M450 420V520"/>`;
  o += `<rect x="300" y="340" width="70" height="60"/><rect x="530" y="340" width="70" height="60"/><path d="M335 340V400M300 370H370M565 340V400M530 370H600"/>`;
  o += `<circle cx="450" cy="270" r="34"/><path d="M450 236V304M416 270H484"/>`;
  o += `<path d="M60 520H840"/><path d="M120 520C120 430 160 380 200 360M120 450L90 420M150 400L190 390" />`;
  o += `<path d="M700 520Q720 440 780 420M760 430L800 400"/></g>`;
  o += `<g opacity=".9">${pumpkin(330, 545, 38, { curl: 1 })}${pumpkin(570, 548, 34, {})}${pumpkin(700, 545, 30, { white: 1 })}</g>`;
  return o;
}

/* ---------- Haunted Night (dark, spooky) ---------- */
const HN_BG = "#1A1233";
function hnSky(W, H) {
  let o = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120B26"/><stop offset=".6" stop-color="#2A1A4E"/><stop offset="1" stop-color="#3B2466"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  for (let i = 0; i < 70; i++) o += `<circle cx="${n(R(0, W))}" cy="${n(R(0, H * .8))}" r="${n(R(.6, 2))}" fill="#FFF6DA" opacity="${n(R(.3, .9))}"/>`;
  return o;
}
function hnBg(W, H) {
  let o = hnSky(W, H);
  o += web(0, 0, 1.3, 0, "rgba(220,210,255,.28)") + `<g transform="translate(${W} 0) scale(-1 1)">${web(0, 0, 1.3, 0, "rgba(220,210,255,.28)")}</g>`;
  o += `<rect x="0" y="${H * .88}" width="${W}" height="${H * .12}" filter="url(#fog)" opacity=".6"/>`;
  for (let i = 0; i < 6; i++) o += bat(R(120, W - 120), R(260, H * .7), R(.6, 1.2), R(-20, 20), "#0B0616");
  return o;
}
function hnSide(W, H, side) {
  let o = `<path d="M40 0V${H * .2}" stroke="#0B0616" stroke-width="2"/>${web(0, 0, 1.4, 0, "rgba(230,220,255,.55)")}`;
  [[90, 280, 2.2, -12], [200, 420, 1.6, 8], [70, 560, 1.4, 16], [180, 720, 2, -6], [60, 900, 1.3, 10]].forEach(([x, y, s, r]) => o += bat(x, y, s, r, "#0B0616"));
  o += `<path d="M10 ${H}V${H - 380}Q40 ${H - 420} 70 ${H - 380}V${H}Z" fill="#0B0616"/>`;
  o += tomb(150, H - 30, 2.4, "#0F0920") + tomb(260, H - 10, 1.6, "#0F0920");
  o += pumpkin(110, H - 90, 80, { lit: 1, dark: 1, curl: 1 }) + pumpkin(240, H - 60, 55, { lit: 1 });
  o += `<path d="M0 ${H - 40}Q150 ${H - 90} 340 ${H - 20}V${H}H0Z" fill="#0B0616"/>`;
  o += ghost(90, 1230, .9, .35) + ghost(230, 1150, .7, .28);
  return side === "r" ? `<g transform="translate(${W} 0) scale(-1 1)">${o}</g>` : o;
}
function hnCard(W, H) {
  let o = hnSky(W, H);
  o += `<circle cx="${W - 170}" cy="190" r="190" fill="url(#moonHalo)"/><circle cx="${W - 170}" cy="190" r="95" fill="url(#moon)"/><circle cx="${W - 200}" cy="170" r="14" fill="#E3C98E" opacity=".5"/><circle cx="${W - 140}" cy="220" r="9" fill="#E3C98E" opacity=".5"/>`;
  o += web(0, 0, 1.6, 0, "rgba(230,220,255,.4)");
  [[220, 150, 1.6, -10], [330, 230, 1.1, 12], [W - 330, 330, 1.3, 6], [W - 260, 120, .9, -14], [140, 300, .9, 8]].forEach(([x, y, s, r]) => o += bat(x, y, s, r, "#0B0616"));
  o += `<rect x="0" y="${H - 300}" width="${W}" height="300" filter="url(#fog)"/>`;
  o += `<path d="M0 ${H - 120}Q${W * .3} ${H - 190} ${W * .55} ${H - 130}T${W} ${H - 150}V${H}H0Z" fill="#0B0616"/>`;
  o += fence(30, 300, H - 140, 90, "#0B0616") + fence(W - 300, W - 30, H - 140, 90, "#0B0616");
  o += tomb(110, H - 100, 2, "#120B26") + tomb(W - 120, H - 110, 2.2, "#120B26");
  o += pumpkin(200, H - 90, 75, { lit: 1, dark: 1, curl: 1 }) + pumpkin(320, H - 60, 50, { lit: 1 }) + pumpkin(W - 220, H - 85, 70, { lit: 1, curl: 1 }) + pumpkin(W - 340, H - 55, 45, { dark: 1 });
  o += ghost(W / 2 - 300, H - 360, .9, .35) + ghost(W / 2 + 300, H - 420, .7, .3);
  return o;
}
function hnHero(W, H) {
  let o = hnSky(W, H);
  o += `<circle cx="${W * .7}" cy="${H * .3}" r="210" fill="url(#moonHalo)"/><circle cx="${W * .7}" cy="${H * .3}" r="110" fill="url(#moon)"/>`;
  o += `<path d="M0 ${H * .72}Q${W * .35} ${H * .5} ${W * .6} ${H * .62}T${W} ${H * .58}V${H}H0Z" fill="#1A1030"/>`;
  o += house(W * .62, H * .66, 1.05, "#0F0920");
  o += `<path d="M${W * .14} ${H}V${H * .5}C${W * .13} ${H * .4} ${W * .1} ${H * .32} ${W * .04} ${H * .26}M${W * .14} ${H * .55}C${W * .2} ${H * .45} ${W * .25} ${H * .42} ${W * .3} ${H * .36}M${W * .13} ${H * .45}L${W * .08} ${H * .42}M${W * .22} ${H * .45}L${W * .24} ${H * .38}" stroke="#0B0616" stroke-width="14" fill="none" stroke-linecap="round"/>`;
  [[W * .5, H * .2, 1.4, -10], [W * .58, H * .14, 1, 8], [W * .85, H * .16, 1.2, 6], [W * .4, H * .32, .9, -6], [W * .78, H * .42, .8, 12]].forEach(([x, y, s, r]) => o += bat(x, y, s, r, "#0B0616"));
  o += `<rect x="0" y="${H * .7}" width="${W}" height="${H * .3}" filter="url(#fog)"/>`;
  o += `<path d="M0 ${H * .86}Q${W * .5} ${H * .78} ${W} ${H * .88}V${H}H0Z" fill="#0B0616"/>`;
  o += tomb(W * .32, H * .9, 1.6, "#140C28") + tomb(W * .42, H * .92, 1.2, "#140C28") + tomb(W * .9, H * .92, 1.4, "#140C28");
  o += pumpkin(W * .2, H * .9, 62, { lit: 1, dark: 1, curl: 1 }) + pumpkin(W * .55, H * .93, 48, { lit: 1 }) + pumpkin(W * .75, H * .94, 40, { lit: 1, dark: 1 });
  o += ghost(W * .3, H * .6, .9, .6);
  return o;
}
function hnVenue(W, H) {
  let o = `<rect width="${W}" height="${H}" fill="#F3EFF8"/><g fill="none" stroke="#5A4688" stroke-width="2.2" stroke-linejoin="round">`;
  o += `<path d="M220 560V320L300 250L380 320V280L450 180L520 280V320L600 250L680 320V560Z"/><path d="M450 180V140M440 150H460"/>`;
  o += `<path d="M410 560V460Q450 420 490 460V560"/>`;
  [[260, 360], [320, 360], [560, 360], [620, 360], [425, 300], [260, 450], [620, 450]].forEach(([x, y]) => o += `<path d="M${x} ${y + 50}V${y + 14}Q${x + 15} ${y} ${x + 30} ${y + 14}V${y + 50}Z"/>`);
  o += `<circle cx="450" cy="250" r="16"/>`;
  o += `<path d="M60 560H840"/>`;
  for (let x = 70; x <= 200; x += 22) o += `<path d="M${x} 560V500l5-10 5 10V560"/>`;
  for (let x = 700; x <= 830; x += 22) o += `<path d="M${x} 560V500l5-10 5 10V560"/>`;
  o += `<path d="M60 520H210M700 520H840"/><circle cx="760" cy="120" r="44"/>`;
  o += `</g>${bat(150, 140, 1.2, -8, "#5A4688")}${bat(230, 100, .8, 10, "#5A4688")}${bat(640, 170, .9, 6, "#5A4688")}`;
  return o;
}

/* ---------- render ---------- */
const JOBS = [
  ["th-pumpkin-bg", 900, 1612, pkBg], ["th-pumpkin-l", 900, 1612, (W, H) => pkSide(W, H, "l"), 1], ["th-pumpkin-r", 900, 1612, (W, H) => pkSide(W, H, "r"), 1],
  ["th-pumpkin-hero", 960, 717, pkHero], ["th-pumpkin-venue", 900, 672, pkVenue], ["th-pumpkin-card", 960, 1383, pkCard],
  ["th-haunted-bg", 900, 1612, hnBg], ["th-haunted-l", 900, 1612, (W, H) => hnSide(W, H, "l"), 1], ["th-haunted-r", 900, 1612, (W, H) => hnSide(W, H, "r"), 1],
  ["th-haunted-hero", 960, 717, hnHero], ["th-haunted-venue", 900, 672, hnVenue], ["th-haunted-card", 960, 1383, hnCard],
];
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, W, H, fn, alpha] of JOBS) {
  seed = 7 + name.length;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${DEFS}</defs>${fn(W, H)}</svg>`;
  await page.setViewportSize({ width: W, height: H });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  const png = join(TMP, name + ".png");
  await page.locator("svg").first().screenshot({ path: png, omitBackground: !!alpha });
  const sizes = /-(hero|card)$/.test(name) ? [[960, "-960"], [480, "-480"]] : [[W, ""]];
  for (const [w, suf] of sizes)
    execFileSync("python3", ["-c", `import sys
from PIL import Image
im=Image.open(sys.argv[1]); im=im.convert("RGBA" if sys.argv[4]=="1" else "RGB")
w=int(sys.argv[3]); im=im.resize((w, round(im.height*w/im.width)), Image.LANCZOS) if w!=im.width else im
im.save(sys.argv[2], "WEBP", quality=82, method=6)`, png, join(OUT, name + suf + ".webp"), String(w), alpha ? "1" : "0"]);
  console.log("saved", name);
}
await browser.close();
