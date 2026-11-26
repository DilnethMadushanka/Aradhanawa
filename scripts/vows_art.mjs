/* Draws stand-in art for the two intro video wedding designs, "Cathedral Vows" (th-chapel) and "Sunset Vows" (th-sunset),
 * and makes stand-in videos from it, so both cards work before the real AI images and videos are uploaded.
 * The real ones come from wedding-video-cards-prompts.md. Run from the repo root:
 *   NODE_PATH=$(npm root -g) node scripts/vows_art.mjs        (needs playwright, python3 Pillow and ffmpeg)
 * Files that already exist are kept (so real uploads are never overwritten); FORCE=1 redraws them.
 * Writes: th-chapel-doors, th-chapel-poster(-480), th-chapel.mp4, th-chapel-480.mp4, th-chapel-venue,
 *         th-sunset-poster(-480), th-sunset.mp4, th-sunset-480.mp4, th-sunset-venue.
 * Side flowers and couple pictures start as copies of existing art (see the end of this file). */
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdtempSync, copyFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "img");
const TMP = mkdtempSync(join(tmpdir(), "vows-art-"));
const n = v => Math.round(v * 10) / 10;
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const R = (a, b) => a + rnd() * (b - a);

const DEFS = `
<linearGradient id="gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6E4B4"/><stop offset=".4" stop-color="#C9A45E"/><stop offset=".75" stop-color="#9C7838"/><stop offset="1" stop-color="#E8CF92"/></linearGradient>
<linearGradient id="ivory" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#F6F1E7"/><stop offset="1" stop-color="#E9E0CF"/></linearGradient>
<linearGradient id="door" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F1EBDF"/><stop offset=".5" stop-color="#FFFFFF"/><stop offset="1" stop-color="#ECE4D5"/></linearGradient>
<radialGradient id="light" cx=".5" cy=".3" r=".6"><stop offset="0" stop-color="#FFFDF6" stop-opacity=".95"/><stop offset="1" stop-color="#FFFDF6" stop-opacity="0"/></radialGradient>
<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E7DDCB"/><stop offset="1" stop-color="#CDBFA5"/></linearGradient>
<linearGradient id="pew" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8A6440"/><stop offset="1" stop-color="#5E4128"/></linearGradient>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6E7FB0"/><stop offset=".32" stop-color="#E8A27E"/><stop offset=".55" stop-color="#FFC97E"/><stop offset=".7" stop-color="#FFE2A8"/><stop offset="1" stop-color="#F3B98A"/></linearGradient>
<radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF8DC"/><stop offset=".35" stop-color="#FFE7A0" stop-opacity=".9"/><stop offset="1" stop-color="#FFC56E" stop-opacity="0"/></radialGradient>
<linearGradient id="car" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFBF2"/><stop offset=".55" stop-color="#EFE6D6"/><stop offset="1" stop-color="#BFB29C"/></linearGradient>
<linearGradient id="chrome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8F969E"/><stop offset=".5" stop-color="#F4F6F8"/><stop offset="1" stop-color="#7D848C"/></linearGradient>
<filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="blur2"><feGaussianBlur stdDeviation="2"/></filter>
<filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .35  0 0 0 .05 0"/></filter>`;

/* a pointed (gothic) arch path, base width w, from y0 down to y1 */
const arch = (cx, y0, y1, w) => `M${n(cx - w / 2)} ${y1}V${n(y0 + w * .55)}Q${n(cx - w / 2)} ${n(y0 + w * .08)} ${cx} ${y0}Q${n(cx + w / 2)} ${n(y0 + w * .08)} ${n(cx + w / 2)} ${n(y0 + w * .55)}V${y1}`;
/* rose window: rings of petals */
function rose(cx, cy, r) {
  let o = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFFDF7" stroke="url(#gd)" stroke-width="${n(r * .04)}"/>`;
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; o += `<ellipse cx="${n(cx + Math.cos(a) * r * .62)}" cy="${n(cy + Math.sin(a) * r * .62)}" rx="${n(r * .3)}" ry="${n(r * .12)}" transform="rotate(${n(a * 180 / Math.PI)} ${n(cx + Math.cos(a) * r * .62)} ${n(cy + Math.sin(a) * r * .62)})" fill="#EAF0F7" stroke="#C9B48A" stroke-width="${n(r * .015)}"/>` }
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + .2; o += `<circle cx="${n(cx + Math.cos(a) * r * .28)}" cy="${n(cy + Math.sin(a) * r * .28)}" r="${n(r * .1)}" fill="#F7EFD9" stroke="#C9B48A" stroke-width="${n(r * .012)}"/>` }
  return o + `<circle cx="${cx}" cy="${cy}" r="${n(r * .12)}" fill="url(#gd)"/>`;
}
/* a cluster of white flowers with green leaves */
function blooms(cx, cy, s) {
  let o = "";
  for (let i = 0; i < 6; i++) o += `<ellipse cx="${n(cx + R(-40, 40) * s)}" cy="${n(cy + R(-10, 24) * s)}" rx="${n(16 * s)}" ry="${n(7 * s)}" transform="rotate(${n(R(-50, 50))} ${cx} ${cy})" fill="#7E9670"/>`;
  for (let i = 0; i < 9; i++) { const x = cx + R(-34, 34) * s, y = cy + R(-22, 16) * s, r = R(8, 14) * s; o += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="#FFFFFF" stroke="#E2DACB" stroke-width="${n(1.4 * s)}"/><circle cx="${n(x)}" cy="${n(y)}" r="${n(r * .35)}" fill="#F1E8D6"/>` }
  return o;
}

/* ---------- Cathedral Vows ---------- */
function chapelDoors(W, H) {
  const cx = W / 2, top = H * .1, bot = H * .9, w = W * .84;
  let s = `<rect width="${W}" height="${H}" fill="url(#ivory)"/>`;
  /* outer stone arches */
  s += `<path d="${arch(cx, top - 60, bot + 4, w + 120)}" fill="#EFE8DA" stroke="#D9CCB1" stroke-width="3"/>`;
  s += `<path d="${arch(cx, top - 24, bot + 4, w + 52)}" fill="#F8F4EB" stroke="url(#gd)" stroke-width="4"/>`;
  s += `<path d="${arch(cx, top, bot, w)}" fill="url(#door)" stroke="url(#gd)" stroke-width="6"/>`;
  /* the two leaves: carved panels, gold mouldings */
  const panel = (x, y, pw, ph) => `<rect x="${n(x)}" y="${n(y)}" width="${n(pw)}" height="${n(ph)}" rx="6" fill="none" stroke="url(#gd)" stroke-width="3"/><rect x="${n(x + 12)}" y="${n(y + 12)}" width="${n(pw - 24)}" height="${n(ph - 24)}" rx="4" fill="#FFFFFF" fill-opacity=".55" stroke="#D8C9A6" stroke-width="1.5"/>`;
  const quat = (x, y, r) => `<g transform="translate(${n(x)} ${n(y)})" fill="none" stroke="url(#gd)" stroke-width="3">${[0, 90, 180, 270].map(a => `<circle cx="${n(Math.cos(a * Math.PI / 180) * r * .5)}" cy="${n(Math.sin(a * Math.PI / 180) * r * .5)}" r="${n(r * .5)}"/>`).join("")}<circle r="${n(r * .22)}" fill="url(#gd)"/></g>`;
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? cx - w / 2 + 40 : cx + 22, pw = w / 2 - 62;
    s += `<path d="${arch(side < 0 ? cx - w / 4 - 9 : cx + w / 4 + 9, top + 70, top + w * .58, pw)}" fill="none" stroke="url(#gd)" stroke-width="3"/>`;
    s += quat(x0 + pw / 2, top + w * .4, 70);
    s += panel(x0, top + w * .64, pw, H * .2) + quat(x0 + pw / 2, top + w * .64 + H * .1, 46);
    s += panel(x0, top + w * .64 + H * .22, pw, H * .22) + quat(x0 + pw / 2, top + w * .64 + H * .33, 52);
    /* ring handle */
    const hx = cx + side * 46, hy = H * .56;
    s += `<circle cx="${hx}" cy="${n(hy - 26)}" r="10" fill="url(#gd)"/><circle cx="${hx}" cy="${hy}" r="26" fill="none" stroke="url(#gd)" stroke-width="7"/>`;
  }
  s += `<path d="M${cx} ${n(top + 8)}V${bot}" stroke="#C7B48A" stroke-width="3"/>`;
  /* white roses at the foot */
  s += blooms(cx - w / 2 - 10, bot - 10, 2.4) + blooms(cx + w / 2 + 10, bot - 10, 2.4);
  s += `<rect y="${n(bot)}" width="${W}" height="${n(H - bot)}" fill="url(#floor)"/>`;
  s += `<rect width="${W}" height="${H}" fill="url(#light)" opacity=".5"/>`;
  return s + `<rect width="${W}" height="${H}" filter="url(#paper)"/>`;
}
function chapelAisle(W, H) {
  const cx = W / 2, vy = H * .44; /* vanishing point */
  let s = `<rect width="${W}" height="${H}" fill="url(#ivory)"/>`;
  /* vaulted ceiling ribs */
  for (let i = 0; i < 7; i++) { const t = i / 6, w = W * (1.5 - t * 1.2), y = H * (.02 + t * .2); s += `<path d="${arch(cx, y, n(vy + 200 - t * 160), w)}" fill="none" stroke="#E2D8C4" stroke-width="${n(14 - t * 10)}"/>` }
  /* side arcades */
  for (let i = 0; i < 6; i++) {
    const t = i / 6, sc = 1 - t * .78, aw = 260 * sc, ah = 900 * sc;
    for (const side of [-1, 1]) { const x = cx + side * (W * .62 * sc + aw * .2), y = vy + 380 * sc - ah; s += `<path d="${arch(x, y, n(vy + 380 * sc), aw)}" fill="#EFE7D8" stroke="#D6C7A8" stroke-width="${n(5 * sc + 1)}"/>` }
  }
  /* far wall + rose window + altar */
  s += `<path d="${arch(cx, vy - 470, vy + 120, 420)}" fill="#FBF8F1" stroke="url(#gd)" stroke-width="4"/>`;
  s += rose(cx, vy - 260, 150);
  s += `<rect x="${cx - 120}" y="${vy + 30}" width="240" height="80" fill="#F6EFE0" stroke="url(#gd)" stroke-width="3"/><path d="M${cx} ${vy - 70}V${vy + 20}M${cx - 26} ${vy - 44}H${cx + 26}" stroke="url(#gd)" stroke-width="6"/>`;
  s += blooms(cx - 150, vy + 90, 1.1) + blooms(cx + 150, vy + 90, 1.1);
  /* floor, runner and pews */
  s += `<path d="M0 ${H}L${cx - 140} ${vy + 120}H${cx + 140}L${W} ${H}Z" fill="url(#floor)"/>`;
  s += `<path d="M${cx - 260} ${H}L${cx - 40} ${vy + 120}H${cx + 40}L${cx + 260} ${H}Z" fill="#FFFFFF"/>`;
  for (let i = 0; i < 9; i++) {
    const t = Math.pow(i / 8, 1.25), y = vy + 130 + t * (H - vy - 130), sc = .14 + t * 1.1, x1 = cx - 50 - 230 * t;
    for (const side of [-1, 1]) {
      const xa = side < 0 ? 0 - 40 * t : cx + 50 + 230 * t, xb = side < 0 ? x1 : W + 40 * t;
      s += `<rect x="${n(Math.min(xa, xb))}" y="${n(y - 70 * sc)}" width="${n(Math.abs(xb - xa))}" height="${n(80 * sc)}" fill="url(#pew)"/>`;
      s += blooms(side < 0 ? x1 - 20 * sc : cx + 50 + 230 * t + 20 * sc, y - 90 * sc, sc * 1.3);
    }
  }
  /* the couple, seen from behind, walking to the altar */
  const by = H * .72, bx = cx - 70, gx = cx + 80;
  s += `<path d="M${bx} ${by - 330}C${bx - 50} ${by - 200} ${bx - 210} ${by + 60} ${bx - 250} ${by + 160}H${bx + 190}C${bx + 140} ${by + 40} ${bx + 50} ${by - 200} ${bx} ${by - 330}Z" fill="#FFFFFF" opacity=".75" filter="url(#blur2)"/>`;
  s += `<path d="M${bx} ${by - 270}C${bx - 40} ${by - 160} ${bx - 140} ${by + 40} ${bx - 170} ${by + 130}H${bx + 140}C${bx + 100} ${by + 20} ${bx + 40} ${by - 160} ${bx} ${by - 270}Z" fill="#FBFAF7" stroke="#E4DED2" stroke-width="2"/>`;
  s += `<ellipse cx="${bx}" cy="${by - 300}" rx="30" ry="36" fill="#3A2A20"/>`;
  s += `<path d="M${gx - 50} ${by - 250}H${gx + 50}L${gx + 46} ${by - 40}H${gx + 30}L${gx + 26} ${by + 120}H${gx - 26}L${gx - 30} ${by - 40}H${gx - 46}Z" fill="#2B2B33"/>`;
  s += `<ellipse cx="${gx}" cy="${by - 290}" rx="28" ry="34" fill="#2A1F18"/><path d="M${bx + 30} ${by - 150}L${gx - 46} ${by - 140}" stroke="#2B2B33" stroke-width="16" stroke-linecap="round"/>`;
  s += `<rect width="${W}" height="${H}" fill="url(#light)" opacity=".7"/>`;
  return s;
}
function chapelVenue(W, H) {
  /* gold line-art of a white church on ivory */
  const cx = W / 2, by = H * .86;
  let a = `<g fill="none" stroke="url(#gd)" stroke-width="2.4" stroke-linejoin="round">`;
  a += `<path d="M${cx - 150} ${by}V${by - 230}L${cx} ${by - 360}L${cx + 150} ${by - 230}V${by}"/>`;
  a += `<path d="M${cx - 44} ${by - 330}V${by - 470}L${cx} ${by - 540}L${cx + 44} ${by - 470}V${by - 330}"/><path d="M${cx} ${by - 540}V${by - 590}M${cx - 16} ${by - 572}H${cx + 16}"/>`;
  a += `<path d="${arch(cx, by - 150, by, 90)}"/><path d="M${cx} ${by - 140}V${by}"/>`;
  a += `<circle cx="${cx}" cy="${by - 245}" r="40"/><circle cx="${cx}" cy="${by - 245}" r="14"/>`;
  for (const x of [-100, 100]) a += `<path d="${arch(cx + x, by - 190, by - 70, 40)}"/>`;
  a += `<path d="${arch(cx, by - 455, by - 405, 26)}"/>`;
  a += `<path d="M${cx - 300} ${by}H${cx + 300}" stroke-width="1.4"/></g>`;
  return `<rect width="${W}" height="${H}" fill="url(#ivory)"/>` + a + blooms(cx - 200, by - 14, 1.3) + blooms(cx + 200, by - 14, 1.3) + `<rect width="${W}" height="${H}" filter="url(#paper)"/>`;
}

/* ---------- Sunset Vows ---------- */
function sunsetScene(W, H) {
  let s = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  s += `<circle cx="${W * .5}" cy="${H * .44}" r="${W * .55}" fill="url(#sun)"/><circle cx="${W * .5}" cy="${H * .44}" r="70" fill="#FFF7DE"/>`;
  /* soft clouds */
  for (let i = 0; i < 7; i++) s += `<ellipse cx="${n(R(0, W))}" cy="${n(R(H * .12, H * .34))}" rx="${n(R(120, 260))}" ry="${n(R(18, 36))}" fill="#FFE6C4" opacity="${n(R(.35, .6))}" filter="url(#soft)"/>`;
  /* layered hills */
  const hill = (y, amp, col, k) => { let d = `M0 ${H}V${y}`; for (let x = 0; x <= W; x += 40) d += `L${x} ${n(y - Math.sin(x / W * Math.PI * k + y) * amp - amp)}`; return `<path d="${d}V${H}Z" fill="${col}"/>` };
  s += hill(H * .5, 40, "#B98AA0", 1.6) + hill(H * .54, 50, "#8E7B98", 2.2) + hill(H * .6, 46, "#5E7A62", 1.3);
  /* tea terraces */
  let t = ""; for (let i = 0; i < 14; i++) { const y = H * .62 + i * 26; t += `<path d="M0 ${n(y)}Q${W * .5} ${n(y - 30 + i * 2)} ${W} ${n(y + 10)}" stroke="#7FA068" stroke-width="10" fill="none" opacity=".55"/>` }
  s += `<rect y="${H * .6}" width="${W}" height="${H * .4}" fill="#4F6E48"/>` + t;
  /* balustrade on the right edge */
  s += `<rect x="${W * .82}" y="${H * .6}" width="${W * .2}" height="18" fill="#EDE2CF"/>`;
  for (let i = 0; i < 4; i++) s += `<rect x="${n(W * .84 + i * 44)}" y="${H * .6 + 18}" width="18" height="70" rx="8" fill="#E2D4BB"/>`;
  /* road */
  s += `<path d="M${W * .46} ${H * .62}L${W * .54} ${H * .62}L${W * 1.1} ${H}H${W * -.1}Z" fill="#A79A8C"/>`;
  /* the couple in a cream vintage convertible, seen from the front */
  const cx = W / 2, cy = H * .8;
  s += `<ellipse cx="${cx}" cy="${cy + 200}" rx="430" ry="40" fill="#2E2A26" opacity=".35" filter="url(#soft)"/>`;
  s += `<ellipse cx="${cx - 110}" cy="${cy - 250}" rx="44" ry="52" fill="#3A2A22"/><path d="M${cx - 180} ${cy - 190}Q${cx - 110} ${cy - 230} ${cx - 40} ${cy - 190}V${cy - 90}H${cx - 180}Z" fill="#FDF7EE"/>`;
  s += `<ellipse cx="${cx + 110}" cy="${cy - 254}" rx="42" ry="50" fill="#2C211B"/><path d="M${cx + 40} ${cy - 190}Q${cx + 110} ${cy - 228} ${cx + 180} ${cy - 190}V${cy - 90}H${cx + 40}Z" fill="#F3EEE5"/>`;
  s += blooms(cx - 70, cy - 150, 1.2);
  s += `<path d="M${cx - 280} ${cy - 120}Q${cx} ${cy - 250} ${cx + 280} ${cy - 120}" fill="#DCE6EE" fill-opacity=".45" stroke="url(#chrome)" stroke-width="10"/>`;
  s += `<path d="M${cx - 420} ${cy + 170}V${cy - 20}Q${cx - 400} ${cy - 120} ${cx - 300} ${cy - 120}H${cx + 300}Q${cx + 400} ${cy - 120} ${cx + 420} ${cy - 20}V${cy + 170}Z" fill="url(#car)"/>`;
  s += `<path d="M${cx - 100} ${cy - 60}H${cx + 100}V${cy + 130}Q${cx} ${cy + 170} ${cx - 100} ${cy + 130}Z" fill="url(#chrome)"/>`;
  for (let i = -8; i <= 8; i++) s += `<path d="M${cx + i * 11} ${cy - 50}V${cy + 135}" stroke="#5E646B" stroke-width="3"/>`;
  for (const x of [-1, 1]) s += `<circle cx="${cx + x * 260}" cy="${cy + 20}" r="62" fill="url(#chrome)"/><circle cx="${cx + x * 260}" cy="${cy + 20}" r="46" fill="#FFFBEA"/>`;
  s += `<rect x="${cx - 430}" y="${cy + 150}" width="860" height="30" rx="14" fill="url(#chrome)"/><path d="M${cx} ${cy - 120}V${cy - 160}" stroke="url(#chrome)" stroke-width="8"/>`;
  return s;
}
function sunsetVenue(W, H) {
  /* a hill-country bungalow at sunset, simple flat art */
  let s = sunsetScene(W, H * 2.2).replace(/<ellipse cx="[\d.]+" cy="[\d.]+" rx="430"[\s\S]*$/, "");
  return `<g transform="translate(0 ${-H * .55})">${s}</g>`;
}

const JOBS = [
  ["th-chapel-doors", 1080, 1920, chapelDoors], ["th-chapel-poster", 1080, 1920, chapelAisle], ["th-chapel-venue", 900, 672, chapelVenue],
  ["th-sunset-poster", 1080, 1920, sunsetScene], ["th-sunset-venue", 900, 672, sunsetVenue],
];
const webp = (png, out, w) => execFileSync("python3", ["-c", `import sys
from PIL import Image
im=Image.open(sys.argv[1]).convert("RGB"); w=int(sys.argv[3])
im=im.resize((w, round(im.height*w/im.width)), Image.LANCZOS) if w!=im.width else im
im.save(sys.argv[2], "WEBP", quality=80, method=6)`, png, out, String(w)]);
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, W, H, fn] of JOBS) {
  if (!process.env.FORCE && existsSync(join(OUT, name + ".webp"))) { console.log("kept", name, "(FORCE=1 redraws it)"); continue }
  seed = 11 + name.length * 7;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${DEFS}</defs>${fn(W, H)}</svg>`;
  await page.setViewportSize({ width: W, height: H });
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  const png = join(TMP, name + ".png");
  await page.locator("svg").first().screenshot({ path: png });
  if (name.endsWith("-poster")) {
    webp(png, join(OUT, name + ".webp"), 720); webp(png, join(OUT, name + "-480.webp"), 480);
    /* stand-in video: a slow push in on the still (8 s, loops) */
    const base = join(OUT, name.replace("-poster", ""));
    const zoom = `scale=2160:3840,zoompan=z='1+0.12*on/192':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=192:s=720x1280:fps=24`;
    execFileSync("ffmpeg", ["-v", "error", "-y", "-loop", "1", "-i", png, "-vf", zoom, "-frames:v", "192", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "28", "-movflags", "+faststart", base + ".mp4"]);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", base + ".mp4", "-vf", "scale=480:-2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "30", "-an", "-movflags", "+faststart", base + "-480.mp4"]);
  } else webp(png, join(OUT, name + ".webp"), W > 1000 ? 1080 : W);
  console.log("saved", name);
}
await browser.close();

/* stand-in side flowers and couple pictures, copied from existing art until the AI ones are uploaded */
const COPY = [["ivory-couple-960.webp", "th-chapel-hero-960.webp"], ["ivory-couple-480.webp", "th-chapel-hero-480.webp"],
  ["th-drive-l.webp", "th-sunset-l.webp"], ["th-drive-r.webp", "th-sunset-r.webp"], ["poruwa-couple-960.webp", "th-sunset-hero-960.webp"], ["poruwa-couple-480.webp", "th-sunset-hero-480.webp"]];
for (const [a, b] of COPY) if (!existsSync(join(OUT, b))) { copyFileSync(join(OUT, a), join(OUT, b)); console.log("copied", b) }
/* chapel corner flowers: the top of the Navy Promise white rose vine */
for (const side of ["l", "r"]) if (!existsSync(join(OUT, `th-chapel-${side}.webp`))) execFileSync("python3", ["-c", `import sys
from PIL import Image
im=Image.open(sys.argv[1]).convert("RGBA"); w,h=im.size; box=(0,0,560,840) if sys.argv[3]=="l" else (w-560,0,w,840)
im.crop(box).save(sys.argv[2], "WEBP", quality=82, method=6)`, join(OUT, `th-navy-${side}.webp`), join(OUT, `th-chapel-${side}.webp`), side]);
