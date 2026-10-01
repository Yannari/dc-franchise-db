// ══════════════════════════════════════════════════════════════════════
// vp-ci/visit-stage.js — the visit: the hallway, the apartments, the door
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-10-01): "the hallway is really ugly ... too black, the doors don't
// even look like doors"; "whose door? we should be in their apartment each
// time someone prepares themselves"; "the music should change after the door
// opens". Mockup: mockup/mockup-circle-blocking-visit.html (approved, with
// "more lights, like the Circle's animated neon").
//
//   the walk     a bright Circle hallway in one-point perspective (SVG): light
//                walls, a neon stripe flowing in the Circle's colours, ceiling
//                strips, numbered doors with their own lights, the ring on the
//                far wall; the camera pushes slowly down it
//   the waiting  each player in their own apartment (their theme all season),
//                their numbered door in view, light under it; a strip of who
//                is still waiting; the last one is the knock
//   the visit    the visited player's apartment, the door open behind, the
//                two of them on the couch
//
// Everything drawn is SVG (CLAUDE.md: never objects out of CSS boxes); the
// walls of an apartment are the same theme gradients the apartments use.
import { esc, faceUrl, ringOf, nameOf, realOf, isCatfish, bg, aptNo, themeFor, dlg, cam, where, upTo } from './parts.js';
import { faceOf } from './steps.js';

// ── the hallway ───────────────────────────────────────────────────────
const VX = 800, BL = 600, BR = 1000, BT = 270, BB = 560;
const wallTop = x => (x <= BL ? BT * x / BL : BT * (1600 - x) / (1600 - BR));
const wallBot = x => (x <= BL ? 900 - (900 - BB) * x / BL : 900 - (900 - BB) * (1600 - x) / (1600 - BR));
const P = (x, y) => `${Math.round(x)},${Math.round(y)}`;

function hallDoor(side, x1, x2, num) {
  const X = x => (side === 'L' ? x : 1600 - x);
  const pt = (x, f) => { const t = wallTop(x), b = wallBot(x); return [X(x), b - (b - t) * f]; };
  const [a, b, c, d] = [pt(x1, 0), pt(x1, 0.74), pt(x2, 0.74), pt(x2, 0)];
  const k = 1 - x1 / 700;
  const mid = (p, q, f) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
  const top = mid(b, c, 0.5), lampY = top[1] - 40 * k;
  const quad = (p1, p2, p3, p4) => `${P(...p1)} ${P(...p2)} ${P(...p3)} ${P(...p4)}`;
  const p1 = mid(a, b, 0.12), p2 = mid(a, b, 0.88), p3 = mid(d, c, 0.88), p4 = mid(d, c, 0.12);
  const plate = mid(mid(b, c, 0.5), mid(a, d, 0.5), 0.2), sz = 30 * (1 - x1 / 720) + 6;
  const h = mid(mid(c, d, 0.45), mid(b, a, 0.45), 0.12);
  return `<g class="cvh-door">
    <ellipse class="cvh-sconce-glow" cx="${top[0]}" cy="${lampY + 30}" rx="${90 * k + 8}" ry="${110 * k + 10}" fill="url(#cvhGlow)"/>
    <polygon points="${quad(a, b, c, d)}" fill="#fff" stroke="#fff" stroke-width="${14 * k + 2}" stroke-linejoin="round"/>
    <polygon points="${quad(a, b, c, d)}" fill="url(#cvhDoor)"/>
    <polygon points="${quad(mid(p1, p4, 0.14), mid(p2, p3, 0.14), mid(p3, p2, 0.14), mid(p4, p1, 0.14))}" fill="none" stroke="#5a60a8" stroke-width="${3 * k + 1}"/>
    <rect x="${plate[0] - sz * 0.75}" y="${plate[1] - sz * 0.55}" width="${sz * 1.5}" height="${sz * 1.1}" rx="${sz * 0.2}" fill="#ffd23f"/>
    <text x="${plate[0]}" y="${plate[1] + sz * 0.32}" font-family="Montserrat,sans-serif" font-weight="900" font-size="${sz * 0.85}" text-anchor="middle" fill="#2a1d00">${num}</text>
    <circle cx="${h[0]}" cy="${h[1]}" r="${7 * k + 2}" fill="#ffd23f"/>
    <rect class="cvh-sconce" x="${top[0] - 22 * k}" y="${lampY}" width="${44 * k + 2}" height="${10 * k + 2}" rx="4" fill="#fff4c8"/>
  </g>`;
}

export function hallwaySvg() {
  let s = `<defs>
    <linearGradient id="cvhWallL" x1="0" x2="1"><stop offset="0" stop-color="#f6f3fb"/><stop offset="1" stop-color="#d8d1ee"/></linearGradient>
    <linearGradient id="cvhWallR" x1="1" x2="0"><stop offset="0" stop-color="#f6f3fb"/><stop offset="1" stop-color="#d8d1ee"/></linearGradient>
    <linearGradient id="cvhFloor" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#cdd0e4"/><stop offset="1" stop-color="#e9eaf4"/></linearGradient>
    <linearGradient id="cvhNeon" x1="0" x2="1"><stop offset="0" stop-color="#ff4fb4"/><stop offset=".5" stop-color="#8b5cff"/><stop offset="1" stop-color="#3fd8ff"/>
      <animate attributeName="x1" values="0;1;0" dur="6s" repeatCount="indefinite"/><animate attributeName="x2" values="1;2;1" dur="6s" repeatCount="indefinite"/></linearGradient>
    <linearGradient id="cvhDoor" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3a3f7a"/><stop offset="1" stop-color="#262a58"/></linearGradient>
    <radialGradient id="cvhGlow"><stop offset="0" stop-color="#fff6d8" stop-opacity=".95"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
    <filter id="cvhSoft"><feGaussianBlur stdDeviation="7"/></filter>
  </defs>`;
  s += `<polygon points="0,0 1600,0 ${BR},${BT} ${BL},${BT}" fill="#fbfaff"/>`;
  // ceiling light strips, nearer ones bigger, each glowing
  for (let i = 0; i < 5; i++) {
    const k = 1 - i / 5, y = BT * (1 - k * 0.92), w = 160 * k + 60;
    s += `<rect class="cvh-strip" style="animation-delay:${i * 0.35}s" x="${VX - w}" y="${y - 6 * k - 2}" width="${w * 2}" height="${10 * k + 4}" rx="5" fill="#fffbe8"/>`;
    s += `<rect x="${VX - w}" y="${y - 6 * k - 2}" width="${w * 2}" height="${10 * k + 4}" rx="5" fill="#fff6c8" opacity=".6" filter="url(#cvhSoft)"/>`;
  }
  s += `<polygon points="0,0 ${BL},${BT} ${BL},${BB} 0,900" fill="url(#cvhWallL)"/>`;
  s += `<polygon points="1600,0 ${BR},${BT} ${BR},${BB} 1600,900" fill="url(#cvhWallR)"/>`;
  s += `<polygon points="0,900 ${BL},${BB} ${BR},${BB} 1600,900" fill="url(#cvhFloor)"/>`;
  // a Circle-coloured runner down the middle
  s += `<polygon points="520,900 ${VX - 70},${BB} ${VX + 70},${BB} 1080,900" fill="#2a2360"/>`;
  s += `<polygon points="560,900 ${VX - 56},${BB} ${VX + 56},${BB} 1040,900" fill="none" stroke="url(#cvhNeon)" stroke-width="5" opacity=".9"/>`;
  // the far wall and the ring, breathing
  s += `<rect x="${BL}" y="${BT}" width="${BR - BL}" height="${BB - BT}" fill="#2b2466"/>`;
  s += `<circle class="cvh-ringglow" cx="${VX}" cy="${(BT + BB) / 2}" r="120" fill="url(#cvhNeon)" opacity=".25" filter="url(#cvhSoft)"/>`;
  s += `<circle cx="${VX}" cy="${(BT + BB) / 2}" r="92" fill="none" stroke="url(#cvhNeon)" stroke-width="22"/><circle cx="${VX}" cy="${(BT + BB) / 2 - 92}" r="11" fill="#fff"/>`;
  // the neon stripe along both walls, with a light running along it
  for (const side of ['L', 'R']) {
    const near = side === 'L' ? 0 : 1600, far = side === 'L' ? BL : BR;
    const yNear = 900 * 0.58, yFar = wallBot(far) - (wallBot(far) - wallTop(far)) * 0.42;
    s += `<line x1="${near}" y1="${yNear}" x2="${far}" y2="${yFar}" stroke="url(#cvhNeon)" stroke-width="30" opacity=".3" filter="url(#cvhSoft)"/>`;
    s += `<line x1="${near}" y1="${yNear}" x2="${far}" y2="${yFar}" stroke="url(#cvhNeon)" stroke-width="9" stroke-linecap="round"/>`;
    s += `<line class="cvh-run" x1="${near}" y1="${yNear}" x2="${far}" y2="${yFar}" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-dasharray="40 900"/>`;
    // a second, higher stripe near the ceiling
    const yNear2 = 900 * 0.08, yFar2 = wallTop(far) + (wallBot(far) - wallTop(far)) * 0.06;
    s += `<line x1="${near}" y1="${yNear2}" x2="${far}" y2="${yFar2}" stroke="url(#cvhNeon)" stroke-width="5" opacity=".75"/>`;
  }
  s += hallDoor('L', 70, 250, 1) + hallDoor('L', 360, 450, 3) + hallDoor('L', 520, 560, 5)
    + hallDoor('R', 70, 250, 2) + hallDoor('R', 360, 450, 4) + hallDoor('R', 520, 560, 6);
  const plant = x => `<rect x="${x - 14}" y="${BB - 46}" width="28" height="40" rx="6" fill="#fff"/><ellipse cx="${x}" cy="${BB - 66}" rx="26" ry="32" fill="#3fbf7a"/><ellipse cx="${x - 14}" cy="${BB - 56}" rx="14" ry="20" fill="#2f9a60"/>`;
  s += plant(BL + 40) + plant(BR - 40);
  return `<svg class="cvh-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${s}</svg>`;
}

// ── an apartment's furniture: the door, and (for the visit) the couch ─
function aptSvg(num, { open = false, knock = false } = {}) {
  const dx = 150, dw = 300, dt = 150, db = 702;
  let s = `<defs>
    <linearGradient id="cvaDoor" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3a3f7a"/><stop offset="1" stop-color="#262a58"/></linearGradient>
    <linearGradient id="cvaHall" x1="0" x2="1"><stop offset="0" stop-color="#f6f3fb"/><stop offset="1" stop-color="#d9d3ee"/></linearGradient>
    <linearGradient id="cvaNeon" x1="0" x2="1"><stop offset="0" stop-color="#ff4fb4"/><stop offset=".5" stop-color="#8b5cff"/><stop offset="1" stop-color="#3fd8ff"/></linearGradient>
    <linearGradient id="cvaFloor" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6a4028"/><stop offset="1" stop-color="#3a2214"/></linearGradient>
    <filter id="cvaSoft"><feGaussianBlur stdDeviation="10"/></filter>
  </defs>`;
  s += `<polygon points="0,700 1600,700 1600,900 0,900" fill="url(#cvaFloor)"/>`;
  for (let i = 0; i < 10; i++) s += `<line x1="${i * 190}" y1="700" x2="${i * 190 - 120}" y2="900" stroke="rgba(0,0,0,.18)" stroke-width="3"/>`;
  s += `<g class="cva-door${knock ? ' knock' : ''}">`;
  if (knock) s += `<rect x="${dx - 40}" y="${dt - 40}" width="${dw + 80}" height="${db - dt + 40}" rx="20" fill="#ffd23f" opacity=".45" filter="url(#cvaSoft)" class="cva-knockglow"/>`;
  s += `<rect x="${dx - 18}" y="${dt - 18}" width="${dw + 36}" height="${db - dt + 18}" rx="6" fill="#fff"/>`;
  if (open) {
    s += `<rect x="${dx}" y="${dt}" width="${dw}" height="${db - dt}" fill="url(#cvaHall)"/>`;
    s += `<line x1="${dx}" y1="${dt + 200}" x2="${dx + dw}" y2="${dt + 230}" stroke="url(#cvaNeon)" stroke-width="8"/>`;
    s += `<polygon points="${dx},${dt} ${dx + 70},${dt + 30} ${dx + 70},${db - 10} ${dx},${db}" fill="url(#cvaDoor)"/>`;
    s += `<rect x="${dx}" y="${dt}" width="${dw}" height="${db - dt}" fill="#fff4c8" opacity=".25"/>`;
  } else {
    s += `<rect x="${dx}" y="${dt}" width="${dw}" height="${db - dt}" fill="url(#cvaDoor)"/>`;
    s += `<rect x="${dx + 40}" y="${dt + 40}" width="${dw - 80}" height="${(db - dt) / 2 - 60}" rx="6" fill="none" stroke="#5a60a8" stroke-width="5"/>`;
    s += `<rect x="${dx + 40}" y="${dt + (db - dt) / 2}" width="${dw - 80}" height="${(db - dt) / 2 - 50}" rx="6" fill="none" stroke="#5a60a8" stroke-width="5"/>`;
    s += `<circle cx="${dx + dw - 40}" cy="${(dt + db) / 2 + 10}" r="13" fill="#ffd23f"/>`;
    s += `<rect x="${dx + dw / 2 - 40}" y="${dt + 70}" width="80" height="56" rx="10" fill="#ffd23f"/><text x="${dx + dw / 2}" y="${dt + 112}" font-family="Montserrat,sans-serif" font-weight="900" font-size="40" text-anchor="middle" fill="#2a1d00">${esc(num)}</text>`;
    // light under the door: somebody is out in the hallway
    s += `<rect class="cva-under" x="${dx + 6}" y="${db - 6}" width="${dw - 12}" height="8" fill="#fff4c8"/><ellipse class="cva-under" cx="${dx + dw / 2}" cy="${db + 6}" rx="${dw * 0.6}" ry="24" fill="#fff4c8" opacity=".35" filter="url(#cvaSoft)"/>`;
  }
  s += `</g>`;
  // a lamp and a plant; the couch when two people share the room
  s += `<rect x="1228" y="250" width="10" height="440" fill="#2a1a10"/><path d="M1180 250 L1290 250 L1265 170 L1205 170 Z" fill="#fff6dc"/>`;
  s += `<rect x="1380" y="600" width="90" height="100" rx="12" fill="#fff"/><ellipse cx="1425" cy="560" rx="70" ry="80" fill="#3fbf7a"/><ellipse cx="1395" cy="585" rx="40" ry="50" fill="#2f9a60"/>`;
  if (open) {
    s += `<ellipse cx="800" cy="850" rx="430" ry="40" fill="rgba(0,0,0,.25)"/>`;
    s += `<rect x="470" y="560" width="660" height="150" rx="36" fill="#8b5cff"/><rect x="440" y="610" width="720" height="140" rx="40" fill="#7a4cf0"/>`;
    s += `<rect x="420" y="590" width="80" height="170" rx="30" fill="#6a3ee0"/><rect x="1100" y="590" width="80" height="170" rx="30" fill="#6a3ee0"/>`;
  }
  return `<svg class="cva-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${s}</svg>`;
}

/** The apartment's walls: the same theme that apartment has all season. */
function walls(row, h) {
  const real = (row.ci.profiles?.[h]?.people || [])[0] || nameOf(row, h);
  const t = themeFor(real);
  return `<div class="cva-wall" style="background:${t.pat ? `${t.pat},` : ''}${t.wall}"></div><div class="cva-dado" style="background:${t.dado}"></div>
    <div class="cva-lamp" style="background:${t.lamp}"></div><div class="cva-poster" style="background:${t.p1}"></div>`;
}

const WAIT = /^visit\.wait/;
const TOGETHER = /^visit\.(door|sit|talk|power|hand|kiss|bye|inperson\.bye)/;

/** The visit, from the walk to the goodbye. */
export function visitStage(row, screen, idx, fresh) {
  const st = idx >= 0 ? screen.steps[idx] : null;
  const [visitor, visited] = screen.who;
  const k = st?.key || '';
  const doorAt = screen.steps.findIndex(x => TOGETHER.test(x.key || ''));
  const together = doorAt >= 0 && idx >= doorAt && !/^visit\.(after|inperson\.after)/.test(k);
  // The door opened, the two of them in the visited player's apartment.
  if (together || /^visit\.(after|inperson\.after)/.test(k)) {
    const host = visited;
    const opening = fresh && idx === doorAt;
    const after = !together;
    const person = h => `<div class="cva-person${h === st?.who ? ' talk' : ''}">${cam(row, h, 'big', realOf(row, h).toUpperCase())}
      ${isCatfish(row, h) ? `<div class="cva-was fake">played as <b>${esc(nameOf(row, h))}</b> · catfish</div>` : `<div class="cva-was">the real ${esc(nameOf(row, h))}</div>`}</div>`;
    const who = after ? [st?.who || host] : [visitor, host];
    return `<div class="civ-layer cva visit${opening ? ' open' : ''}">${walls(row, host)}${aptSvg(aptNo(row, host), { open: !after })}
      <div class="cva-two${after ? ' one' : ''}">${who.map(person).join('')}</div>
      ${opening ? '<div class="cva-flash"></div>' : ''}
      ${where(after ? 'AFTER THE VISIT' : `FACE TO FACE · ${realOf(row, host).toUpperCase()}'S APARTMENT`)}${dlg(row, st, fresh)}</div>`;
  }
  // Waiting: whoever the line is about, in their own apartment.
  const seen = upTo(screen, idx);
  const waiters = [...new Set(seen.filter(x => WAIT.test(x.key || '')).map(x => x.who).filter(Boolean))];
  // A stage direction in the wait keeps the camera in that apartment.
  const waiting = WAIT.test(k) ? (st.who || waiters.at(-1) || null) : null;
  if (waiting) {
    const lastWait = screen.steps.map(x => WAIT.test(x.key || '')).lastIndexOf(true);
    const knock = idx === lastWait && waiting === visited;
    const all = [...new Set(screen.steps.filter(x => WAIT.test(x.key || '')).map(x => x.who).filter(Boolean))];
    const strip = all.map(h => { const u = faceUrl(faceOf(row, h, 'cam')); return `<span class="${h === waiting ? 'on' : waiters.includes(h) ? 'seen' : ''}"${bg(u)}>${u ? '' : esc(realOf(row, h)[0] || '?')}</span>`; }).join('');
    return `<div class="civ-layer cva${fresh ? ' cut' : ''}">${walls(row, waiting)}${aptSvg(aptNo(row, waiting), { knock })}
      <div class="cva-whose"><small>APARTMENT ${aptNo(row, waiting)}</small>${knock ? 'KNOCK KNOCK' : 'Whose door?'}</div>
      <div class="cva-strip">${strip}</div>
      <div class="cva-waitcam">${cam(row, waiting, '', `CAM ${aptNo(row, waiting)} · ${realOf(row, waiting).toUpperCase()}`)}</div>
      ${where('A VISIT · EVERYBODY WAITS')}${dlg(row, st, fresh)}</div>`;
  }
  // The walk: down the hallway, centred, the camera pushing in.
  return `<div class="civ-layer cvh">${hallwaySvg()}
    <div class="cvh-walker">${cam(row, visitor, '', `THE HALLWAY · ${realOf(row, visitor).toUpperCase()}`)}</div>
    ${where('A VISIT · THE BLOCKED PLAYER WALKS')}${dlg(row, st, fresh)}</div>`;
}

export const VISIT_CSS = `
.cvh{background:#f4f2fa;overflow:hidden}
.cvh-svg,.cva-svg{position:absolute;inset:0;width:100%;height:100%}
.cvh-svg{animation:cvhPush 14s ease-out both;transform-origin:50% 45%}
@keyframes cvhPush{from{transform:scale(1)}to{transform:scale(1.12)}}
.cvh-strip{animation:cvhFlicker 3.2s ease-in-out infinite}
@keyframes cvhFlicker{0%,100%{opacity:1}45%{opacity:.82}50%{opacity:.95}}
.cvh-sconce-glow{animation:cvhBreathe 2.8s ease-in-out infinite}
.cvh-ringglow{animation:cvhBreathe 3.6s ease-in-out infinite}
@keyframes cvhBreathe{50%{opacity:.45}}
.cvh-run{stroke-dashoffset:940;animation:cvhRun 3s linear infinite;opacity:.9}
@keyframes cvhRun{to{stroke-dashoffset:0}}
.cvh-walker{position:absolute;left:50%;top:26%;width:15cqw;transform:translateX(-50%);z-index:5;animation:cvhStep 1.1s ease-in-out infinite}
.cvh-walker .civ-mcam{position:relative;width:100%;aspect-ratio:4/5}
@keyframes cvhStep{50%{transform:translateX(-50%) translateY(-1.5%)}}
.cva{overflow:hidden;background:#2a1a10}
.cva-wall{position:absolute;inset:0 0 22% 0}
.cva-dado{position:absolute;left:0;right:0;bottom:22%;height:16%;border-top:3px solid rgba(255,255,255,.3)}
.cva-lamp{position:absolute;right:8%;top:6%;width:34%;height:48%;border-radius:50%;filter:blur(40px);opacity:.45;mix-blend-mode:screen}
.cva-poster{position:absolute;left:40%;top:14%;width:13%;height:30%;border:.45cqw solid #f4efe6;box-shadow:0 10px 30px rgba(0,0,0,.35)}
.cva.visit .cva-poster{left:82%;top:9%;width:9%;height:22%}
.cva.cut{animation:cvaCut .45s ease-out both}
@keyframes cvaCut{from{filter:brightness(1.8)}}
.cva-door.knock{animation:cvaKnock .5s ease-in-out 2}
@keyframes cvaKnock{25%{transform:translateX(.4%)}75%{transform:translateX(-.4%)}}
.cva-knockglow{animation:cvhBreathe 1s ease-in-out infinite}
.cva-under{animation:cvhBreathe 1.6s ease-in-out infinite}
.cva-whose{position:absolute;left:36%;top:56%;z-index:6;font-weight:900;font-size:3cqw;letter-spacing:.03em;text-shadow:0 0 2cqw rgba(0,0,0,.6)}
.cva-whose small{display:block;font-size:1cqw;letter-spacing:.2em;color:#ffe08a;margin-bottom:.4cqw}
.cva-strip{position:absolute;left:36%;top:72%;z-index:6;display:flex;gap:.8cqw}
.cva-strip span{display:grid;place-items:center;font-weight:900;font-size:1.6cqw;width:4.6cqw;aspect-ratio:4/5;border-radius:.6cqw;border:.2cqw solid rgba(255,255,255,.6);background:#1b1f45 center 22%/cover;opacity:.4}
.cva-strip span.seen{opacity:.7}.cva-strip span.on{opacity:1;box-shadow:0 0 1.4cqw #ffd23f;border-color:#ffd23f}
.cva-waitcam{position:absolute;right:7%;top:12%;width:18cqw;z-index:5}
.cva-waitcam .civ-mcam{position:relative;width:100%;aspect-ratio:4/5}
.cva-two{position:absolute;left:30%;right:30%;top:11%;z-index:5;display:flex;justify-content:space-between}
.cva-two.one{justify-content:center}
.cva-person{width:15cqw;transition:transform .4s}
.cva-person .civ-mcam{position:relative;width:100%;aspect-ratio:4/5}
.cva-person.talk{transform:translateY(-3%)}
.cva-was{margin:.6cqw auto 0;width:max-content;font-size:1cqw;font-weight:700;background:rgba(10,12,40,.75);border-radius:99px;padding:.25cqw .8cqw}
.cva-was.fake{background:rgba(120,10,60,.85)}.cva-was b{color:#ff9ad4}
.cva-flash{position:absolute;inset:0;z-index:20;background:#fff8e6;pointer-events:none;animation:civFbFlash .8s ease-out both}
.cva.open .cva-person{animation:civUp .6s .15s both}
@media (prefers-reduced-motion: reduce){.cvh-svg,.cvh-strip,.cvh-sconce-glow,.cvh-ringglow,.cvh-run,.cvh-walker,.cva-door.knock,.cva-knockglow,.cva-under{animation:none}}
`;
