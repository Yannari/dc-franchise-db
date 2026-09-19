// ════════════════════════════════════════════════════════════════
//  CHALLENGE KITS — the dozen sets the challenges are played on
// ════════════════════════════════════════════════════════════════
// js/stage-challenges.js maps each twist challenge to one of these by what it
// physically looks like. Same shape as any set (see js/stage-sets-island.js):
// { label, fx, far, mid, fg } plus forceTime / indoor / amb / fire / glow.
//
// Drawn in the show's own cartoon language: a dark ink outline on every prop,
// flat colour lifted by a gradient and a highlight stroke, a soft cast shadow
// under anything that stands on the ground, and two or three receding layers
// behind it. Ground line near y=620, where the standees stand.
import { svg, flame } from './stage-sets-island.js';

// ── the kit's drawing vocabulary ──
const INK = '#1a1109';
const O = (w = 5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
const lg = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const rg = (id, stops, cx = .5, cy = .5, r = .6) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`;
const shadow = (x, y, rx, ry = rx * .2, o = .3) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#000" opacity="${o}"/>`;
// soft rolling hills along y, amplitude a
const hills = (y, a, fill, phase = 0, extra = '') => {
  let d = `M-40 ${y}`;
  for (let x = -40; x <= 1680; x += 80) d += ` Q ${x + 40} ${y - a * (1 + Math.sin((x + phase) / 170)) } ${x + 80} ${y}`;
  return `<path d="${d} V900 H-40Z" fill="${fill}" ${extra}/>`;
};
// a line of rounded tree crowns
const treeline = (y, fill, r = 46, step = 60, seed = 0) =>
  `<path d="M-40 ${y + r} ${rep(Math.ceil(1760 / step), i => { const x = -40 + i * step, rr = r * (.75 + ((i * 37 + seed) % 10) / 20); return `A ${rr} ${rr} 0 0 1 ${x + step} ${y + r}`; })} V900 H-40Z" fill="${fill}"/>`;
// a pine with an inked outline
const pine = (x, y, s = 1, c = '#1f5a3a', snow = false) => `<g transform="translate(${x} ${y}) scale(${s})">
  <rect x="-9" y="-30" width="18" height="34" fill="#5a3a20" ${O(4)}/>
  <path d="M0 -250 L-62 -120 L-34 -124 L-80 -40 L80 -40 L34 -124 L62 -120Z" fill="${c}" ${O(5)}/>
  <path d="M0 -250 L-20 -205 M0 -170 L-30 -130 M0 -110 L-40 -58" stroke="#ffffff30" stroke-width="6" fill="none"/>
  ${snow ? `<path d="M0 -250 L-26 -196 L-8 -204 L6 -196 L22 -206Z M-50 -120 L-34 -124 L-20 -112 L4 -126 L34 -124 L50 -120 L30 -110 L-30 -110Z" fill="#fff" ${O(3)}/>` : ''}</g>`;
// grass tufts along the front edge
const tufts = (y, c = '#3d6b2a', n = 14, seed = 3) => rep(n, i => {
  const x = (i * 131 + seed * 57) % 1600, h = 26 + (i * 13) % 22;
  return `<path class="sway d${i % 3 + 1}" style="transform-origin:${x}px ${y}px" d="M${x - 16} ${y} Q ${x - 12} ${y - h} ${x - 4} ${y - h * .6} Q ${x} ${y - h * 1.2} ${x + 5} ${y - h * .5} Q ${x + 12} ${y - h} ${x + 16} ${y}Z" fill="${c}"/>`;
});
const bulbs = (x0, x1, y, n, sag = 30) => rep(n, i => {
  const t = i / (n - 1), x = x0 + (x1 - x0) * t, yy = y + Math.sin(t * Math.PI) * sag;
  return `<circle class="twinkle" style="animation-delay:${-(i % 5) * .3}s" cx="${x}" cy="${yy}" r="7" fill="${['#ffd84d','#ff6b6b','#6bd3ff','#9dff7a'][i % 4]}" ${O(2)}/>`;
});
// a car tyre lying flat, in perspective
const tyre = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${shadow(0, 14, 66, 16, .35)}
  <ellipse cx="0" cy="0" rx="62" ry="24" fill="#26262a" ${O(5)}/><ellipse cx="0" cy="-4" rx="34" ry="11" fill="#6b5a3a" ${O(4)}/>
  <path d="M-58 -6 Q 0 -30 58 -6" stroke="#4a4a52" stroke-width="5" fill="none"/>${rep(7, i => `<path fill="none" d="M${-48 + i * 16} ${10 - Math.abs(i - 3) * 2} l 6 -8" stroke="#44444c" stroke-width="4"/>`)}</g>`;

// a palm crown of filled, pointed leaves (never bare strokes)
function frond(cx, cy){
  return [-160, -120, -75, -30, 15, 55].map((a, k) => {
    const r = a * Math.PI / 180, L = 120 + (k % 2) * 20, tx = cx + Math.cos(r) * L, ty = cy + Math.sin(r) * L * .55 + 40;
    const nx = -Math.sin(r) * 22, ny = Math.cos(r) * 22, mx = (cx + tx) / 2, my = (cy + ty) / 2 - 30;
    return `<path d="M${cx} ${cy} Q ${mx + nx} ${my + ny} ${tx} ${ty} Q ${mx - nx} ${my - ny} ${cx} ${cy}Z" fill="${k % 2 ? '#2e7d3c' : '#3d9a4a'}" ${O(4)}/>`;
  }).join('') + `<circle cx="${cx}" cy="${cy}" r="12" fill="#6b4724" ${O(4)}/>`;
}

// a bough: a tapered limb from the trunk out to a tip, with a mass of leaves on the end
function bough(x, y, tx, ty, dark){
  const mx = (x + tx) / 2, my = Math.min(y, ty) - 40, w = 16;
  return `<path d="M${x} ${y - w} Q ${mx} ${my - w} ${tx} ${ty} Q ${mx} ${my + w} ${x} ${y + w}Z" fill="${dark ? '#241a12' : '#3a2a1e'}" ${O(4)}/>`
    + [[0, 0], [-34, -22], [30, -18], [-8, 24]].map(([dx, dy]) =>
        `<ellipse cx="${tx + dx}" cy="${ty + dy}" rx="${34 + Math.abs(dx) / 3}" ry="26" fill="#14251a" ${O(4)}/>`).join('');
}

export const KITS = {
  // ─────────────────────────────────────────────────────────────
  // OBSTACLE COURSE — boot camps, races, anything run across a field
  course: {
    label:'Obstacle Course', fx:'dust', amb:['wind', 'birds'],
    far:t=>svg(`${hills(430, 70, '#7fa7c4', 0)}${hills(470, 50, '#5f8fae', 90)}
      ${treeline(420, '#2f6a3a', 40, 56, 1)}${treeline(460, '#255a31', 46, 64, 5)}
      <g ${O(3)}>${rep(21, i => `<rect x="${i * 80 - 6}" y="455" width="10" height="60" fill="#8a6a44"/>`)}</g>
      <path fill="none" d="M-20 470 H1620 M-20 492 H1620" stroke="#9aa3aa" stroke-width="3" stroke-dasharray="8 6"/>`),
    mid:t=>svg(`<defs>${lg('kco-grass', [[0, '#8fbe55'], [1, '#5f9a3a']])}${lg('kco-wood', [[0, '#c8904f'], [1, '#8a5a2c']], 1, 0)}${lg('kco-mud', [[0, '#7a5230'], [1, '#4d3219']])}</defs>
      <path d="M-40 520 Q 800 490 1640 522 V900 H-40Z" fill="url(#kco-grass)"/>
      ${rep(8, i => `<path d="M${-40 + i * 240} 900 L${560 + i * 70} 520 L${620 + i * 70} 520 L${80 + i * 240} 900Z" fill="#ffffff" opacity=".05"/>`)}
      <path d="M-40 640 Q 500 600 900 630 T 1640 610 V660 Q 1200 650 900 676 T -40 690Z" fill="#b89a66" opacity=".85"/>
      <g transform="translate(300 600)">${shadow(0, 12, 180, 26)}
        <path d="M-170 0 L-120 -260 L120 -260 L170 0Z" fill="url(#kco-wood)" ${O(6)}/>
        ${rep(6, i => `<path fill="none" d="M${-160 + i * 8} ${-40 - i * 40} H${160 - i * 8}" stroke="#6b4422" stroke-width="4"/>`)}
        ${[[-60,-210,'#e8453c'],[30,-170,'#3aa0ff'],[-20,-120,'#ffcc33'],[70,-80,'#40c060'],[-90,-60,'#c084fc']].map(([x,y,c]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="8" fill="${c}" ${O(3)}/>`).join('')}
        <path fill="none" d="M-120 -260 L-150 -280 M120 -260 L150 -280" ${O(8)}/>
      </g>
      <g transform="translate(560 600)">${shadow(0, 8, 90, 18)}
        <path d="M-80 0 L-60 -230 L60 -230 L80 0" fill="none" ${O(8)}/><path d="M-80 0 L-60 -230 L60 -230 L80 0" fill="none" stroke="#a8743c" stroke-width="4"/>
        <g class="sway" style="transform-origin:0 -230px">${rep(6, i => `<path d="M${-60 + i * 24} -230 Q ${-58 + i * 22} -110 ${-72 + i * 29} -6" stroke="#d9c38a" stroke-width="5" fill="none"/>`)}${rep(8, i => `<path d="M${-62 - i * 1.5} ${-205 + i * 26} Q 0 ${-196 + i * 26} ${62 + i * 1.5} ${-205 + i * 26}" stroke="#d9c38a" stroke-width="5" fill="none"/>`)}</g>
      </g>
      <g transform="translate(890 690)">${shadow(0, 30, 250, 34, .25)}
        <ellipse cx="0" cy="0" rx="240" ry="48" fill="url(#kco-mud)" ${O(6)}/>
        <path d="M-160 -8 Q -100 -26 -30 -12 M40 6 Q 110 -14 170 2" stroke="#9a6b40" stroke-width="6" fill="none" opacity=".8"/>
        ${[[-120,4,10],[-40,14,7],[70,-6,9],[140,10,6]].map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#a87a4c" stroke-width="3"/>`).join('')}
        ${[-200,-70,70,200].map(x => `<rect x="${x - 5}" y="-78" width="10" height="72" fill="#6b5a4a" ${O(3)}/>`).join('')}
        <path d="M-205 -66 ${rep(20, i => `L ${-195 + i * 20} ${i % 2 ? -58 : -72}`)}" stroke="#555" stroke-width="3" fill="none"/>
      </g>
      ${[[1000, 620, 1], [1120, 628, 1], [1240, 620, 1], [1060, 668, 1.05], [1180, 674, 1.05]].map(([x, y, s]) => tyre(x, y, s)).join('')}
      <g transform="translate(1350 610)">${shadow(0, 6, 80, 16)}
        ${[-50, 50].map(x => `<path fill="none" d="M${x} 0 L${x * .6} -300" ${O(9)}/><path fill="none" d="M${x} 0 L${x * .6} -300" stroke="#a8743c" stroke-width="5"/>`).join('')}
        <path fill="none" d="M-44 -60 L26 -170 M44 -60 L-26 -170 M-40 -170 L32 -250" ${O(5)}/>
        <rect x="-70" y="-360" width="140" height="70" fill="#9a6b3c" ${O(6)}/><path d="M-90 -360 L0 -420 L90 -360Z" fill="#6b8a3a" ${O(6)}/>
        <path fill="none" d="M0 -420 V-480" ${O(5)}/><path class="sway" style="transform-origin:0 -480px" d="M0 -478 Q 40 -490 80 -470 Q 40 -456 0 -462Z" fill="#e8453c" ${O(4)}/>
        <path d="M-20 -326 A 20 20 0 0 1 20 -326 L 16 -306 L -16 -306Z" fill="#ffcc33" ${O(4)}/>
      </g>
      ${[240, 130].map((x, i) => `<g transform="translate(${x} ${640 + i * 30})">${shadow(0, 6, 60, 10)}<rect x="-50" y="-62" width="100" height="14" fill="#fff" ${O(4)}/>${rep(4, k => `<rect x="${-48 + k * 25}" y="-62" width="12" height="14" fill="#e8453c"/>`)}<path fill="none" d="M-44 -48 V0 M44 -48 V0" ${O(6)}/></g>`).join('')}`),
    fg:t=>svg(`${tufts(900, '#4d7a2e', 16, 2)}
      <g transform="translate(1500 860)">${rep(3, r => rep(4 - r, k => `<ellipse cx="${-90 + k * 60 + r * 30}" cy="${-r * 34}" rx="34" ry="20" fill="#c2a66a" ${O(4)}/>`))}</g>`),
  },

  // ─────────────────────────────────────────────────────────────
  // THE LAKE — cliff dives, docks, canoes, sharks
  water: {
    label:'The Lake', fx:'spray', amb:['waves', 'birds'],
    far:t=>svg(`<defs>${lg('kw-lake', [[0, '#5bb3dd'], [1, '#2a78b0']])}</defs>
      ${hills(420, 60, '#6d9fb8', 20)}${treeline(400, '#2e6a3e', 44, 58, 3)}
      <rect x="-40" y="440" width="1680" height="460" fill="url(#kw-lake)"/>
      <path fill="none" d="M-40 440 H1640" stroke="#dff4ff" stroke-width="3" opacity=".6"/>`),
    mid:t=>svg(`<defs>${lg('kw-rock', [[0, '#8a7e70'], [1, '#554b42']], 1, 0)}${lg('kw-water', [[0, '#3a8fc4'], [1, '#1d5f92']])}</defs>
      <path d="M-60 900 L-60 250 Q 0 170 120 190 Q 210 150 290 230 Q 330 330 360 560 L420 900Z" fill="url(#kw-rock)" ${O(7)}/>
      <path d="M120 190 Q 180 260 170 360 M40 260 Q 70 330 60 420 M250 300 Q 280 420 300 540" stroke="#3f362f" stroke-width="5" fill="none"/>
      <path d="M-40 230 Q 60 150 150 176 Q 230 160 290 230 Q 200 206 120 212 Q 40 214 -40 250Z" fill="#4f8a3a" ${O(5)}/>
      <g transform="translate(260 206)"><rect x="0" y="-12" width="190" height="16" fill="#b5864c" ${O(5)}/><path fill="none" d="M20 4 V70 M170 4 V40" ${O(6)}/>
        <path d="M150 -12 Q 190 -40 184 -12" stroke="#ffcc33" stroke-width="8" fill="none"/></g>
      <rect x="360" y="560" width="1300" height="340" fill="url(#kw-water)"/>
      <g class="wave"><path d="M330 500 q 70 -16 140 0 t 140 0 t 140 0 t 140 0 t 140 0 t 140 0 t 140 0 t 140 0 t 140 0 t 140 0" stroke="#bfe6ff" stroke-width="6" fill="none" opacity=".8"/></g>
      <g class="wave d2"><path d="M330 546 q 90 -18 180 0 t 180 0 t 180 0 t 180 0 t 180 0 t 180 0 t 180 0 t 180 0" stroke="#bfe6ff" stroke-width="5" fill="none" opacity=".5"/></g>
      <ellipse class="shimmer" cx="600" cy="556" rx="120" ry="14" fill="#ffffff" opacity=".25"/>
      <g transform="translate(1050 470)">${shadow(260, 100, 330, 26, .2)}
        <path d="M-60 -10 L620 -44 L620 -12 L-60 26Z" fill="#b5864c" ${O(6)}/>
        ${rep(11, i => `<path fill="none" d="M${-40 + i * 62} ${-10 - i * 3.2} L${-38 + i * 62} ${24 - i * 3.4}" stroke="#7a5230" stroke-width="4"/>`)}
        ${rep(6, i => `<rect x="${-50 + i * 120}" y="${16 - i * 6}" width="18" height="${150 - i * 10}" fill="#6b4726" ${O(4)}/>`)}
        <path fill="none" d="M600 -44 V-120 M600 -120 L570 -100" ${O(5)}/><circle cx="600" cy="-130" r="14" fill="#fff" ${O(4)}/>
      </g>
      <g transform="translate(650 520)"><g class="bob"><path d="M-140 0 Q 0 40 140 0 L118 -26 Q 0 -8 -118 -26Z" fill="#d6352b" ${O(6)}/><path d="M-110 -18 Q 0 -2 110 -18" stroke="#ff8a7a" stroke-width="5" fill="none"/><path fill="none" d="M-60 -12 L-40 -60 M40 -12 L70 -56" ${O(5)}/><ellipse cx="-38" cy="-66" rx="12" ry="22" fill="#e8c27a" ${O(4)} transform="rotate(25 -38 -66)"/></g></g>
      <g transform="translate(1320 560)"><g class="wave d2"><path d="M-40 10 Q -10 -60 30 -70 Q 20 -30 40 10Z" fill="#6f7f8e" ${O(5)}/><path d="M-50 12 Q 0 0 50 12" stroke="#bfe6ff" stroke-width="5" fill="none"/></g></g>
      ${[[450, 560, '#fff'], [540, 524, '#ff6b6b'], [860, 566, '#fff'], [940, 530, '#ff6b6b']].map(([x, y, c], i) => `<g class="bob" style="animation-delay:${-i * .6}s"><circle cx="${x}" cy="${y}" r="14" fill="${c}" ${O(4)}/><path fill="none" d="M${x - 14} ${y} H${x + 14}" stroke="${c === '#fff' ? '#ff6b6b' : '#fff'}" stroke-width="5"/></g>`).join('')}
      <path d="M-40 900 V600 Q 420 566 900 592 T 1640 580 V900Z" fill="#e8d2a0" ${O(5)}/>
      <path d="M-40 618 Q 420 584 900 610 T 1640 598" stroke="#fff6dc" stroke-width="10" fill="none" opacity=".7"/>
      ${rep(22, i => `<ellipse cx="${(i * 137) % 1620 - 20}" cy="${652 + (i * 47) % 200}" rx="${7 + i % 6}" ry="4" fill="#cdb684" opacity=".8"/>`)}`),
    fg:t=>svg(`<path d="M1480 900 Q 1500 800 1580 780 Q 1640 790 1660 900Z" fill="#4a4e5a" ${O(6)}/><path d="M1500 860 Q 1540 820 1600 812" stroke="#6b7080" stroke-width="5" fill="none"/>`),
  },

  // ─────────────────────────────────────────────────────────────
  // THE WOODS AT NIGHT — hunts, survival, things with claws
  nightwoods: {
    label:'The Woods at Night', fx:'fireflies', forceTime:'night', amb:['wind'],
    glow:'radial-gradient(ellipse at 78% 16%,#c8d6ff55,transparent 42%)',
    far:t=>svg(`${rep(22, i => { const x = i * 76 - 20, h = 330 + (i * 47) % 120; return `<path d="M${x} 620 L${x + 38} ${620 - h} L${x + 76} 620Z" fill="${i % 2 ? '#101d22' : '#13242a'}"/>`; })}
      ${rep(18, i => { const x = i * 94 + 30, h = 250 + (i * 61) % 110; return `<path d="M${x} 640 L${x + 47} ${640 - h} L${x + 94} 640Z" fill="${i % 2 ? '#0c171b' : '#0e1b20'}"/>`; })}
      <path class="shimmer" d="M-40 560 Q 400 530 800 560 T 1640 550 V610 Q 1200 600 800 620 T -40 620Z" fill="#b8c8e8" opacity=".14"/>`),
    mid:t=>svg(`<defs>${lg('knw-ground', [[0, '#1e3326'], [1, '#101d15']])}${lg('knw-trunk', [[0, '#3a2a1e'], [1, '#1c130c']], 1, 0)}${rg('knw-lamp', [[0, '#ffe9a8'], [1, '#ffe9a800']])}</defs>
      <path d="M-40 580 Q 800 550 1640 585 V900 H-40Z" fill="url(#knw-ground)"/>
      <path d="M560 900 Q 700 700 780 590 Q 820 580 860 590 Q 940 700 1100 900Z" fill="#2a3a2c" opacity=".7"/>
      ${[[80, 1.2], [330, .9], [1260, 1], [1480, 1.25]].map(([x, s], i) => `<g transform="translate(${x} 610) scale(${s})">
        <path d="M-34 0 Q -30 -250 -18 -520 L18 -520 Q 30 -250 34 0Z" fill="url(#knw-trunk)" ${O(6)}/>
        ${bough(-10, -120, -130, -162, 1)}${bough(12, -260, 140, -294, 1)}${bough(-8, -380, -110, -414, 1)}
        <path fill="none" d="M-40 0 Q -60 20 -80 16 M40 0 Q 60 20 84 12" ${O(7)}/>
        <ellipse cx="4" cy="-200" rx="12" ry="18" fill="#0a0604"/></g>`).join('')}
      ${[[560, 596], [1060, 600], [1140, 560]].map(([x, y], i) => `<g transform="translate(${x} ${y})"><path d="M-70 0 Q -80 -60 -30 -70 Q -10 -110 30 -80 Q 80 -90 76 0Z" fill="#172a1d" ${O(5)}/>
        <g class="twinkle" style="animation-delay:${-i * .9}s"><ellipse cx="-12" cy="-44" rx="7" ry="5" fill="#ffe14d"/><ellipse cx="12" cy="-44" rx="7" ry="5" fill="#ffe14d"/><circle cx="-12" cy="-44" r="2" fill="#000"/><circle cx="12" cy="-44" r="2" fill="#000"/></g></g>`).join('')}
      <g transform="translate(760 640)">${shadow(0, 6, 40, 8)}<path d="M-20 0 L20 0 L12 -40 L-12 -40Z" fill="#555" ${O(4)}/><path d="M-8 -40 L8 -40 L4 -58 L-4 -58Z" fill="#ffd84d" ${O(3)}/>
        <circle cx="0" cy="-50" r="120" fill="url(#knw-lamp)" opacity=".5"/></g>`),
    fg:t=>svg(`<path d="M-60 900 Q 40 560 250 500 Q 150 700 130 900Z" fill="#050b08" ${O(4)}/><path d="M-60 900 Q 170 700 400 690 Q 250 790 190 900Z" fill="#07100b"/>
      <path d="M1660 900 Q 1530 580 1310 540 Q 1430 740 1460 900Z" fill="#050b08" ${O(4)}/>
      <g class="sway d3" style="transform-origin:1600px 0"><path d="M1640 -20 Q 1400 60 1280 20 Q 1420 110 1640 90Z" fill="#050b08"/></g>`),
  },

  // ─────────────────────────────────────────────────────────────
  // THE STAGE — talent shows, game shows, runways
  stage: {
    label:'The Stage', fx:'confetti', indoor:true, amb:['hum'],
    glow:'radial-gradient(ellipse at 50% 34%,#fff3c466,transparent 55%)',
    far:t=>svg(`<defs>${lg('ks-back', [[0, '#3a1f66'], [1, '#170b2e']])}${rg('ks-star', [[0, '#ffe98a'], [1, '#ffe98a00']])}</defs>
      <rect width="1600" height="900" fill="url(#ks-back)"/>
      ${rep(7, i => `<path d="M${i * 250 - 40} 80 Q ${i * 250 + 85} 420 ${i * 250 + 210} 80" fill="none" stroke="#5a3a8a" stroke-width="10" opacity=".6"/>`)}
      <g transform="translate(800 250)"><circle r="150" fill="url(#ks-star)" opacity=".5"/>
        <path d="M0 -110 L26 -36 L104 -34 L42 12 L64 88 L0 44 L-64 88 L-42 12 L-104 -34 L-26 -36Z" fill="#ffcc33" ${O(7)}/>
        <path d="M0 -76 L14 -30 L62 -28" stroke="#fff3b0" stroke-width="6" fill="none"/></g>
      <rect x="-20" y="40" width="1640" height="40" fill="#141018" ${O(4)}/>${bulbs(20, 1580, 60, 28, 0)}`),
    mid:t=>svg(`<defs>${lg('ks-floor', [[0, '#8a5530'], [1, '#4a2a14']])}</defs>
      <path d="M-40 540 L1640 540 L1640 900 L-40 900Z" fill="url(#ks-floor)"/>
      ${rep(14, i => `<path fill="none" d="M${800 + (i - 7) * 70} 540 L${800 + (i - 7) * 190} 900" stroke="#5a3418" stroke-width="3"/>`)}
      <path fill="none" d="M-40 540 H1640" stroke="#ffcc33" stroke-width="10"/><path fill="none" d="M-40 556 H1640" stroke="#b8860b" stroke-width="4"/>
      ${[380, 800, 1220].map((x, i) => `<path class="shimmer" style="animation-delay:${-i * .7}s" d="M${x} -20 L${x - 210} 640 L${x + 210} 640Z" fill="#fff6c9" opacity=".1"/><ellipse cx="${x}" cy="640" rx="210" ry="30" fill="#fff6c9" opacity=".1"/>`).join('')}
      <g transform="translate(800 628)">${shadow(0, 4, 56, 10)}<path d="M-46 0 L46 0 L30 -14 L-30 -14Z" fill="#2a2a30" ${O(4)}/><rect x="-5" y="-270" width="10" height="256" fill="#3a3a44" ${O(3)}/>
        <path d="M-14 -300 Q 0 -318 14 -300 L12 -262 L-12 -262Z" fill="#555c66" ${O(4)}/>${rep(4, i => `<path fill="none" d="M-12 ${-298 + i * 9} H12" stroke="#8a929c" stroke-width="2"/>`)}</g>`),
    fg:t=>svg(`<defs>${lg('ks-curt', [[0, '#d6243a'], [.5, '#a0142a'], [1, '#6b0a1c']], 1, 0)}</defs>
      <g class="sway" style="transform-origin:0 0"><path d="M-20 0 H250 Q 200 450 270 900 H-20Z" fill="url(#ks-curt)" ${O(6)}/>${rep(5, i => `<path d="M${20 + i * 44} 0 Q ${-4 + i * 44} 450 ${30 + i * 46} 900" stroke="#6b0a1c" stroke-width="8" fill="none"/>`)}
        <path fill="none" d="M-20 300 Q 120 330 250 290" ${O(5)}/><circle cx="240" cy="292" r="16" fill="#ffcc33" ${O(4)}/></g>
      <g class="sway d2" style="transform-origin:1600px 0"><path d="M1620 0 H1350 Q 1400 450 1330 900 H1620Z" fill="url(#ks-curt)" ${O(6)}/>${rep(5, i => `<path d="M${1580 - i * 44} 0 Q ${1604 - i * 44} 450 ${1570 - i * 46} 900" stroke="#6b0a1c" stroke-width="8" fill="none"/>`)}
        <path fill="none" d="M1620 300 Q 1480 330 1350 290" ${O(5)}/><circle cx="1360" cy="292" r="16" fill="#ffcc33" ${O(4)}/></g>
      <path d="M-20 -10 H1620 V56 Q 1400 110 1200 60 Q 1000 110 800 60 Q 600 110 400 60 Q 200 110 -20 56Z" fill="url(#ks-curt)" ${O(6)}/>
      <path d="M-20 890 ${rep(24, i => `Q ${i * 70 + 15} 820 ${i * 70 + 35} 836 Q ${i * 70 + 55} 820 ${i * 70 + 70} 890`)}" fill="#0c0714"/>`),
  },

  // ─────────────────────────────────────────────────────────────
  // THE ARENA — a dodgeball court, a gym, a dojo
  arena: {
    label:'The Arena', fx:'dust', indoor:true, amb:['hum'],
    far:t=>svg(`<defs>${lg('ka-wall', [[0, '#3a4252'], [1, '#262c38']])}</defs>
      <rect width="1600" height="900" fill="url(#ka-wall)"/>
      ${rep(5, r => { const y = 150 + r * 62, dim = .55 + r * .09;
        return `<path d="M-20 ${y + 26} H1620 V${y + 62} H-20Z" fill="${r % 2 ? '#4a5366' : '#414959'}" ${O(3)}/>`
          + rep(22, i => { const x = -10 + i * 74 + ((i * 29 + r * 17) % 26), up = (i * 7 + r * 3) % 5 === 0,
              skin = ['#f0c8a0', '#d9a273', '#a97048', '#7a4a2c'][(i + r) % 4],
              shirt = ['#e8453c', '#3aa0ff', '#ffcc33', '#40c060', '#c084fc', '#ff8ac4'][(i * 3 + r) % 6];
            return `<g transform="translate(${x} ${y}) scale(${dim > 1 ? 1 : 1})" opacity="${dim}">`
              + `<path d="M-17 26 Q -15 -2 0 -2 Q 15 -2 17 26Z" fill="${shirt}" ${O(3)}/>`
              + (up ? `<path fill="none" d="M-13 6 L-24 -18 M13 6 L24 -18" stroke="${skin}" stroke-width="7" stroke-linecap="round"/>` : '')
              + `<circle cx="0" cy="-12" r="11" fill="${skin}" ${O(3)}/></g>`; });
      })}
      <g transform="translate(800 118)"><rect x="-200" y="-50" width="400" height="100" rx="12" fill="#101216" ${O(6)}/>
        <rect x="-180" y="-34" width="150" height="68" rx="6" fill="#1c0808"/><rect x="30" y="-34" width="150" height="68" rx="6" fill="#08141c"/>
        <text x="-105" y="22" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="54" fill="#ff5a3c" class="twinkle">0</text>
        <text x="105" y="22" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="54" fill="#3cc0ff" class="twinkle">0</text></g>
      ${[250, 1350].map(x => `<g transform="translate(${x} 150)"><path d="M-70 -30 H70 L60 60 L0 90 L-60 60Z" fill="${x < 800 ? '#d6352b' : '#2f7fd6'}" ${O(5)}/><path d="M-40 10 L0 -14 L40 10" stroke="#fff" stroke-width="7" fill="none"/></g>`).join('')}`),
    mid:t=>svg(`<defs>${lg('ka-floor', [[0, '#e0a868'], [1, '#b07838']])}</defs>
      <path d="M-40 520 L1640 520 L1640 900 L-40 900Z" fill="url(#ka-floor)"/>
      ${rep(12, i => `<path fill="none" d="M${-40 + i * 150} 520 L${-400 + i * 190} 900" stroke="#c08850" stroke-width="3"/>`)}
      <path d="M60 540 L1540 540 L1640 900 L-40 900Z" fill="none" stroke="#fff" stroke-width="8"/>
      <path fill="none" d="M800 540 L800 900" stroke="#fff" stroke-width="8"/><ellipse cx="800" cy="700" rx="170" ry="56" fill="none" stroke="#fff" stroke-width="8"/>
      <path d="M60 540 Q 250 640 -40 740 M1540 540 Q 1350 640 1640 740" stroke="#d6352b" stroke-width="8" fill="none"/>
      ${[[430,650,1],[600,720,1.1],[1060,660,1],[1230,760,1.15],[760,820,1.2],[300,780,1.1]].map(([x,y,s], i) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="bob" style="animation-delay:${-i*.4}s">${shadow(0, 30, 34, 7)}<circle r="30" fill="#d6352b" ${O(5)}/><path d="M-20 -12 Q 0 -26 20 -12" stroke="#ff9a8a" stroke-width="6" fill="none"/><path d="M-30 0 Q 0 12 30 0" stroke="#9a1f18" stroke-width="3" fill="none"/></g></g>`).join('')}`),
    fg:t=>svg(`<path d="M-20 -10 H1620 V26 H-20Z" fill="#161a22" ${O(4)}/>${rep(6, i => `<g transform="translate(${140 + i * 260} 26)"><path d="M-40 0 L40 0 L28 30 L-28 30Z" fill="#2a2f3a" ${O(4)}/><ellipse cx="0" cy="32" rx="26" ry="6" fill="#fffbe0"/></g>`)}`),
  },

  // ─────────────────────────────────────────────────────────────
  // THE KITCHEN — cooking, eating, and whatever that is on the tray
  kitchen: {
    label:'The Kitchen', fx:'steam', indoor:true, amb:['hum', 'fire'],
    far:t=>svg(`<defs>${lg('kk-wall', [[0, '#e6eef0'], [1, '#c6d2d6']])}</defs>
      <rect width="1600" height="900" fill="url(#kk-wall)"/>
      ${rep(27, c => rep(8, r => `<rect x="${c * 60 + (r % 2) * 30 - 30}" y="${r * 44 + 150}" width="58" height="42" rx="3" fill="${(c + r) % 3 ? '#ffffff' : '#dce6e9'}" stroke="#b8c4c8" stroke-width="2"/>`))}
      <rect x="-20" y="118" width="1640" height="22" fill="#8a949b" ${O(4)}/>
      ${rep(9, i => `<g class="sway" style="transform-origin:${150 + i * 165}px 140px"><path fill="none" d="M${150 + i * 165} 140 V${190 + (i % 3) * 26}" stroke="#555" stroke-width="5"/>${
        i % 3 === 0 ? `<ellipse cx="${150 + i * 165}" cy="${212 + (i % 3) * 26}" rx="30" ry="16" fill="#6b7880" ${O(4)}/><path fill="none" d="M${120 + i * 165} ${208 + (i % 3) * 26} h 60" stroke="#aab4ba" stroke-width="4"/>`
        : i % 3 === 1 ? `<path d="M${150 + i * 165} ${216 + (i % 3) * 26} q -26 22 0 44 q 26 -22 0 -44" fill="#aab4ba" ${O(4)}/>`
        : `<circle cx="${150 + i * 165}" cy="${226 + (i % 3) * 26}" r="18" fill="#b8c2c7" ${O(4)}/>`}</g>`)}`),
    mid:t=>svg(`<defs>${lg('kk-steel', [[0, '#dfe6ea'], [1, '#8f9ba2']])}${lg('kk-floor', [[0, '#9aa6ac'], [1, '#6b777c']])}</defs>
      <path d="M-40 560 L1640 560 L1640 900 L-40 900Z" fill="url(#kk-floor)"/>
      ${rep(12, c => rep(5, r => `<rect x="${c * 140 - 40 + (r % 2) * 70}" y="${560 + r * 68}" width="138" height="66" fill="${(c + r) % 2 ? '#ffffff14' : '#00000010'}"/>`))}
      <g transform="translate(430 560)">${shadow(0, 8, 340, 20)}
        <rect x="-320" y="-160" width="640" height="160" fill="url(#kk-steel)" ${O(6)}/><rect x="-330" y="-176" width="660" height="22" rx="4" fill="#eef3f5" ${O(5)}/>
        ${[-200, 0, 200].map(x => `<rect x="${x - 70}" y="-140" width="140" height="110" rx="6" fill="#58636a" ${O(4)}/><rect x="${x - 56}" y="-124" width="112" height="60" rx="4" fill="#20262a"/><circle cx="${x - 40}" cy="-46" r="7" fill="#ccc"/><circle cx="${x + 40}" cy="-46" r="7" fill="#ccc"/>`).join('')}
        ${[-200, 0, 200].map((x, i) => `<g transform="translate(${x} -176)"><path d="M-66 0 L-56 -86 L56 -86 L66 0Z" fill="#6b7880" ${O(5)}/><ellipse cx="0" cy="-86" rx="58" ry="14" fill="#3a4248" ${O(4)}/>
          <path fill="none" d="M-58 -40 H58" stroke="#8f9ba2" stroke-width="4"/>${i === 1 ? `<ellipse cx="0" cy="-88" rx="46" ry="10" fill="#8ab83a"/><circle cx="-14" cy="-92" r="6" fill="#b8e05a"/>` : ''}${flame(-30, 6, .32)}${flame(30, 6, .3)}</g>`).join('')}
      </g>
      <g transform="translate(1180 560)">${shadow(0, 8, 300, 20)}
        <rect x="-280" y="-140" width="560" height="140" fill="url(#kk-steel)" ${O(6)}/><rect x="-290" y="-156" width="580" height="20" rx="4" fill="#eef3f5" ${O(5)}/>
        <path d="M-200 -156 Q -210 -200 -150 -214 Q -120 -260 -60 -236 Q 0 -262 30 -216 Q 90 -214 80 -156Z" fill="#7a9a2a" ${O(5)}/>
        ${[[-140,-200,10],[-60,-222,8],[10,-196,9]].map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#b8e05a" ${O(3)}/>`).join('')}
        <g transform="translate(170 -170)"><rect x="-8" y="-60" width="16" height="70" fill="#b8c2c7" ${O(4)}/><path d="M-24 -60 L24 -60 L20 -100 L-20 -100Z" fill="#dfe6ea" ${O(4)}/></g>
        <rect x="-250" y="-120" width="90" height="100" rx="6" fill="#aab4ba" ${O(4)}/><rect x="-150" y="-120" width="90" height="100" rx="6" fill="#aab4ba" ${O(4)}/>
      </g>`),
    fg:t=>svg(`<rect x="-20" y="-10" width="1640" height="30" fill="#6b777c" ${O(4)}/>`),
  },

  // ─────────────────────────────────────────────────────────────
  // THE MANSION — haunted houses, museums, dungeons, labs, trains
  spooky: {
    label:'The Mansion', fx:'dust', forceTime:'night', indoor:true, amb:['wind'],
    glow:'radial-gradient(ellipse at 50% 16%,#ffcf6b44,transparent 46%)',
    far:t=>svg(`<defs>${lg('ksp-wall', [[0, '#2a1e38'], [1, '#150f1e']])}${lg('ksp-sky', [[0, '#0b1230'], [1, '#2a3a6a']])}</defs>
      <rect width="1600" height="900" fill="url(#ksp-wall)"/>
      ${rep(9, i => `<rect x="${i * 190 - 20}" y="0" width="16" height="900" fill="#1a1226"/>${rep(3, k => `<path d="M${i * 190 + 30} ${80 + k * 180} q 40 -30 80 0 q -40 30 -80 0" fill="none" stroke="#3a2a4a" stroke-width="3"/>`)}`)}
      <g transform="translate(1250 150)"><path d="M-120 330 V0 Q 0 -110 120 0 V330Z" fill="url(#ksp-sky)" ${O(10)}/><path fill="none" d="M0 -60 V330 M-120 150 H120" ${O(9)}/>
        <circle cx="60" cy="40" r="30" fill="#eef1ff" opacity=".9"/><path class="twinkle" d="M-60 20 L-30 100 L-50 100 L-14 190" stroke="#e8f0ff" stroke-width="5" fill="none"/></g>
      ${[[160, 150, '#6b2a2a'], [440, 190, '#2a4a6b']].map(([x, y, c]) => `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="170" height="210" fill="#c9a227" ${O(6)}/><rect x="16" y="16" width="138" height="178" fill="${c}"/>
        <path d="M40 194 Q 46 136 85 124 Q 124 136 130 194Z" fill="#241a2c" ${O(3)}/><path d="M85 124 L70 150 L85 176 L100 150Z" fill="#c9bfae" ${O(2)}/>
        <ellipse cx="85" cy="82" rx="34" ry="42" fill="#e0c9a6" ${O(4)}/>
        <path d="M51 78 Q 52 34 85 34 Q 118 34 119 78 Q 110 56 85 54 Q 60 56 51 78Z" fill="#241a2c" ${O(3)}/>
        <ellipse cx="72" cy="82" rx="5" ry="6" fill="#1a1109"/><ellipse cx="98" cy="82" rx="5" ry="6" fill="#1a1109"/>
        <path fill="none" d="M64 68 q 8 -6 16 -1 M90 67 q 8 -5 16 1 M74 104 q 11 7 22 0" stroke="#5a4230" stroke-width="4"/></g>`).join('')}`),
    mid:t=>svg(`<defs>${lg('ksp-floor', [[0, '#3a2a22'], [1, '#1c130f']])}${lg('ksp-rug', [[0, '#8a1c2a'], [1, '#4a0c16']])}</defs>
      <path d="M-40 560 L1640 560 L1640 900 L-40 900Z" fill="url(#ksp-floor)"/>
      ${rep(12, i => `<path fill="none" d="M${-40 + i * 150} 560 L${-500 + i * 210} 900" stroke="#2a1d17" stroke-width="4"/>`)}
      <path d="M620 560 L700 300 L900 300 L980 560Z" fill="#4a3226" ${O(6)}/>${rep(8, i => `<path fill="none" d="M${626 + i * 10} ${540 - i * 32} H${974 - i * 10}" stroke="#2a1810" stroke-width="7"/>`)}
      <path fill="none" d="M700 300 L660 560 M900 300 L940 560" ${O(6)}/>${rep(6, i => `<path fill="none" d="M${690 - i * 6} ${320 + i * 40} V${290 + i * 40}" stroke="#6b4a32" stroke-width="6"/>`)}
      <path d="M560 560 L1040 560 L1160 900 L440 900Z" fill="url(#ksp-rug)" ${O(5)}/><path d="M590 590 L1010 590 L1110 880 L490 880Z" fill="none" stroke="#c9a227" stroke-width="5"/>
      <g class="sway" style="transform-origin:800px 0"><path fill="none" d="M800 0 V110" ${O(5)}/><path d="M680 120 Q 800 200 920 120" fill="none" ${O(9)}/><path d="M680 120 Q 800 200 920 120" fill="none" stroke="#c9a227" stroke-width="5"/>
        ${[690, 745, 800, 855, 910].map(x => `<rect x="${x - 7}" y="${120 + (x === 800 ? 60 : Math.abs(x - 800) < 60 ? 36 : 4)}" width="14" height="30" fill="#f4ecd6" ${O(3)}/>${flame(x, 120 + (x === 800 ? 60 : Math.abs(x - 800) < 60 ? 36 : 4), .2)}`).join('')}</g>
      ${[240, 1360].map(x => `<g transform="translate(${x} 570)">${shadow(0, 6, 40, 8)}<path d="M-22 0 L22 0 L10 -120 L-10 -120Z" fill="#3a2a1a" ${O(5)}/><path d="M-40 -120 Q 0 -150 40 -120" fill="none" ${O(6)}/>
        ${[-40, 0, 40].map(dx => `<rect x="${dx - 6}" y="-150" width="12" height="26" fill="#f4ecd6" ${O(3)}/>${flame(dx, -150, .22)}`).join('')}</g>`).join('')}`),
    fg:t=>svg(`<path d="M0 0 Q 90 40 170 0 M0 0 Q 50 90 0 170 M0 0 L130 130 M0 60 Q 60 70 70 0 M0 110 Q 100 110 110 0" stroke="#cfcfd8" stroke-width="2" fill="none" opacity=".55"/>
      <path d="M1600 0 Q 1510 40 1430 0 M1600 0 Q 1550 90 1600 170 M1600 0 L1470 130 M1600 60 Q 1540 70 1530 0" stroke="#cfcfd8" stroke-width="2" fill="none" opacity=".55"/>`),
  },

  // ─────────────────────────────────────────────────────────────
  // THE DESERT — pyramids, ruins, digs, safaris
  desert: {
    label:'The Desert', fx:'dust', amb:['wind'],
    far:t=>svg(`<defs>${lg('kd-pyr', [[0, '#f0cf88'], [1, '#c8a060']], 1, 0)}</defs>
      <g transform="translate(1040 470)"><path d="M-240 0 L0 -300 L240 0Z" fill="url(#kd-pyr)" ${O(6)}/><path d="M0 -300 L240 0 L90 0Z" fill="#b08040" opacity=".6"/>
        ${rep(8, i => `<path fill="none" d="M${-210 + i * 26} ${-36 - i * 34} H${210 - i * 26}" stroke="#b08a52" stroke-width="3"/>`)}<rect x="-26" y="-70" width="52" height="70" fill="#5a3a20" ${O(4)}/></g>
      <g transform="translate(1340 480)"><path d="M-150 0 L0 -190 L150 0Z" fill="url(#kd-pyr)" ${O(5)}/><path d="M0 -190 L150 0 L60 0Z" fill="#b08040" opacity=".6"/></g>
      ${hills(480, 34, '#e6c47e', 40)}`),
    mid:t=>svg(`<defs>${lg('kd-sand', [[0, '#f4d99a'], [1, '#d9b26a']])}${lg('kd-stone', [[0, '#e0cc98'], [1, '#b8a070']], 1, 0)}</defs>
      <path d="M-40 560 Q 400 520 800 556 T 1640 548 V900 H-40Z" fill="url(#kd-sand)"/>
      <path d="M-40 680 Q 600 640 1640 684 V900 H-40Z" fill="#e8c88a"/>
      ${rep(6, i => `<path d="M${60 + i * 270} ${600 + (i % 2) * 30} q 40 -10 80 0" stroke="#c9a060" stroke-width="4" fill="none"/>`)}
      ${[[170, 610, 1], [340, 600, .8]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})">${shadow(0, 6, 60, 12)}
        <rect x="-40" y="-300" width="80" height="300" fill="url(#kd-stone)" ${O(6)}/><rect x="-54" y="-322" width="108" height="26" fill="#d0bb86" ${O(5)}/><rect x="-54" y="-24" width="108" height="24" fill="#d0bb86" ${O(5)}/>
        ${rep(4, k => `<path fill="none" d="M${-24 + k * 16} -290 V-30" stroke="#b8a070" stroke-width="4"/>`)}<path d="M-40 -150 L-20 -160 L0 -140" stroke="#8a7a50" stroke-width="3" fill="none"/></g>`).join('')}
      <g transform="translate(500 612) rotate(-6)">${shadow(0, 6, 90, 14)}<rect x="-90" y="-40" width="180" height="40" fill="url(#kd-stone)" ${O(5)}/></g>
      <g transform="translate(1400 640)"><ellipse cx="0" cy="10" rx="170" ry="30" fill="#4ab8d4" ${O(5)}/><ellipse cx="-30" cy="4" rx="80" ry="8" fill="#bff0ff" opacity=".6"/>
        ${[-120, 110].map((x, i) => `<g class="sway${i ? ' d2' : ''}" style="transform-origin:${x}px 0px"><path fill="none" d="M${x} 0 Q ${x + 10} -120 ${x + (i ? -20 : 30)} -240" ${O(12)}/><path d="M${x} 0 Q ${x + 10} -120 ${x + (i ? -20 : 30)} -240" stroke="#8a6238" stroke-width="7" fill="none"/>
          ${frond(x + (i ? -20 : 30), -240)}</g>`).join('')}</g>
      <g transform="translate(880 700)">${shadow(0, 8, 120, 14)}<path d="M-120 8 Q -60 -60 10 -52 Q 90 -46 120 8Z" fill="#e2bf7c" ${O(5)}/><path d="M-80 -20 Q -20 -44 40 -34" stroke="#c9a060" stroke-width="4" fill="none"/>
        <g transform="translate(-40 -46) rotate(-18)"><rect x="-5" y="-150" width="10" height="130" fill="#8a5a2c" ${O(4)}/><path fill="none" d="M-22 -150 H22" ${O(8)}/><path fill="none" d="M-22 -150 H22" stroke="#8a5a2c" stroke-width="5"/><path d="M-20 -22 H20 L16 26 Q 0 40 -16 26Z" fill="#9aa3ad" ${O(5)}/></g>
        <g transform="translate(60 -40) rotate(14)"><path d="M-26 0 Q -40 -40 -18 -60 H18 Q 40 -40 26 0Z" fill="#c2622e" ${O(5)}/><rect x="-18" y="-72" width="36" height="14" rx="4" fill="#a44f22" ${O(4)}/><path fill="none" d="M-30 -30 H30" stroke="#f0cf88" stroke-width="5"/></g></g>`),
    fg:t=>svg(`<path d="M-40 900 Q 300 810 640 900Z" fill="#d9b26a" ${O(4)}/><path d="M1000 900 Q 1300 830 1640 880 V900Z" fill="#d9b26a" ${O(4)}/>`),
  },

  // ─────────────────────────────────────────────────────────────
  // THE FROZEN NORTH — ice, snow, mountains, yetis
  snow: {
    label:'The Frozen North', fx:'snow', amb:['wind'],
    glow:'linear-gradient(#cfe6ff33,#cfe6ff00)',
    far:t=>svg(`<defs>${lg('ksn-mtn', [[0, '#dfeaf6'], [1, '#9fb4cc']])}</defs>
      <path d="M-40 500 L180 190 L300 300 L520 110 L760 360 L980 150 L1240 380 L1440 200 L1640 360 V900 H-40Z" fill="url(#ksn-mtn)" ${O(6)}/>
      ${[[180, 190], [520, 110], [980, 150], [1440, 200]].map(([x, y]) => `<path d="M${x} ${y} L${x - 60} ${y + 84} L${x - 26} ${y + 70} L${x} ${y + 92} L${x + 30} ${y + 66} L${x + 64} ${y + 88}Z" fill="#fff" ${O(4)}/>`).join('')}
      <path d="M300 300 L360 420 M760 360 L820 460 M1240 380 L1300 470" stroke="#8aa0b8" stroke-width="5" fill="none"/>
      ${rep(9, i => pine(80 + i * 190, 520, .45, '#2a5a4a', true))}`),
    mid:t=>svg(`<defs>${lg('ksn-snow', [[0, '#ffffff'], [1, '#dbe7f3']])}${lg('ksn-ice', [[0, '#c8ecfb'], [1, '#86c4e4']])}</defs>
      <path d="M-40 540 Q 800 500 1640 546 V900 H-40Z" fill="url(#ksn-snow)"/>
      <ellipse cx="820" cy="720" rx="440" ry="80" fill="url(#ksn-ice)" ${O(5)}/>
      <path d="M520 700 L620 726 L590 760 M900 690 L980 720 L960 746 M1060 740 L1120 712" stroke="#ffffff" stroke-width="5" fill="none"/>
      <ellipse class="shimmer" cx="740" cy="704" rx="140" ry="12" fill="#fff" opacity=".6"/>
      ${[[70, 620, 1.1], [300, 610, .9], [1480, 620, 1.15]].map(([x, y, s]) => pine(x, y, s, '#1f4a3a', true)).join('')}
      <g transform="translate(1250 628)">${shadow(0, 4, 130, 16)}<path d="M-120 0 A120 120 0 0 1 120 0Z" fill="#f4f8fc" ${O(6)}/>
        ${[-80, -40].map(y => `<path fill="none" d="M${-Math.sqrt(120 * 120 - y * y)} ${y} H${Math.sqrt(120 * 120 - y * y)}" stroke="#b8c8d8" stroke-width="4"/>`).join('')}
        ${rep(5, i => `<path fill="none" d="M${-96 + i * 48} -40 V0" stroke="#b8c8d8" stroke-width="4"/>`)}<path d="M-36 0 A36 36 0 0 1 36 0Z" fill="#1a2a3a" ${O(4)}/></g>
      <g transform="translate(920 480)"><path fill="none" d="M0 0 V150" ${O(6)}/><path class="sway" style="transform-origin:0 4px" d="M3 4 Q 50 -6 96 12 Q 50 26 3 40Z" fill="#e8453c" ${O(4)}/></g>
      <g transform="translate(540 640)">${rep(3, r => `<circle cx="0" cy="${-r * 48 - 30}" r="${40 - r * 10}" fill="#fff" ${O(5)}/>`)}<circle cx="-8" cy="-136" r="4" fill="#111"/><circle cx="8" cy="-136" r="4" fill="#111"/><path d="M0 -128 l 22 6 l -22 4Z" fill="#ff8a2a" ${O(2)}/></g>`),
    fg:t=>svg(`<path d="M-40 900 Q 300 820 700 900Z" fill="#fff" ${O(5)}/><path d="M900 900 Q 1300 834 1640 872 V900Z" fill="#fff" ${O(5)}/>`),
  },

  // ─────────────────────────────────────────────────────────────
  // THE BIG TOP — circus, carnival rides, the midway
  bigtop: {
    label:'The Big Top', fx:'confetti', amb:['hum'],
    far:t=>svg(`${hills(500, 40, '#3a5a3a', 30)}
      <g transform="translate(1320 320)"><path fill="none" d="M0 0 L-110 300 M0 0 L110 300" ${O(12)}/><path fill="none" d="M0 0 L-110 300 M0 0 L110 300" stroke="#c8ccd8" stroke-width="6"/>
        <g style="transform-box:fill-box;transform-origin:center;animation:spin 40s linear infinite">
          <circle r="220" fill="none" ${O(12)}/><circle r="220" fill="none" stroke="#e8ecff" stroke-width="6"/><circle r="40" fill="#ffcc33" ${O(5)}/>
          ${rep(12, i => { const a = i / 12 * Math.PI * 2, x = Math.cos(a) * 220, y = Math.sin(a) * 220; return `<path fill="none" d="M0 0 L${x} ${y}" stroke="#e8ecff" stroke-width="5"/><g transform="translate(${x} ${y})"><path d="M-22 0 H22 L18 34 H-18Z" fill="${['#ff6b6b','#ffd84d','#6bd3ff','#9dff7a'][i % 4]}" ${O(4)}/></g>`; })}</g></g>`),
    mid:t=>svg(`<defs>${lg('kb-ground', [[0, '#8a6a44'], [1, '#5a4228']])}</defs>
      <path d="M-40 560 Q 800 530 1640 562 V900 H-40Z" fill="url(#kb-ground)"/>
      ${rep(30, i => `<ellipse cx="${(i * 97) % 1600}" cy="${600 + (i * 53) % 280}" rx="10" ry="4" fill="${['#ffd84d','#ff6b6b','#6bd3ff'][i % 3]}" opacity=".6"/>`)}
      <g transform="translate(600 580)">${shadow(0, 10, 500, 36, .3)}
        <path d="M-440 0 V-190 H440 V0Z" fill="#fff" ${O(7)}/>${rep(11, i => `<rect x="${-440 + i * 80}" y="-190" width="40" height="190" fill="#d6352b"/>`)}<path d="M-440 0 V-190 H440 V0" fill="none" ${O(7)}/>
        <path d="M-490 -190 L0 -440 L490 -190Z" fill="#d6352b" ${O(8)}/>${rep(8, i => `<path fill="none" d="M0 -440 L${-490 + i * 140} -190" stroke="#fff" stroke-width="30"/>`)}<path d="M-490 -190 L0 -440 L490 -190" fill="none" ${O(8)}/>
        <path d="M-490 -190 ${rep(14, i => `Q ${-455 + i * 70} -150 ${-420 + i * 70} -190`)}" fill="#ffcc33" ${O(5)}/>
        <path fill="none" d="M0 -440 V-500" ${O(6)}/><path class="sway" style="transform-origin:0 -500px" d="M0 -498 Q 44 -512 88 -490 Q 44 -474 0 -482Z" fill="#ffcc33" ${O(4)}/>
        <path d="M-90 0 V-130 Q 0 -190 90 -130 V0Z" fill="#2a0f0f" ${O(6)}/><path d="M-90 -130 Q -30 -60 -40 0 M90 -130 Q 30 -60 40 0" fill="#b01c2e" ${O(4)}/></g>
      <path d="M-40 150 Q 800 290 1640 150" stroke="#444" stroke-width="3" fill="none"/>${bulbs(-20, 1620, 150, 30, 130)}`),
    fg:t=>svg(`${rep(17, i => `<path d="M${i * 100 - 20} 0 L${i * 100 + 30} 70 L${i * 100 + 80} 0Z" fill="${['#d6352b','#ffd84d','#3aa0ff','#40c060'][i % 4]}" ${O(4)}/>`)}<path fill="none" d="M-40 0 H1640" ${O(5)}/>`),
  },

  // ─────────────────────────────────────────────────────────────
  // THE MAZE — hedge and corn mazes, lanterns at the crossroads
  maze: {
    label:'The Maze', fx:'fireflies', amb:['wind', 'birds'],
    far:t=>svg(`${hills(460, 40, '#4a7a3a', 10)}${rep(12, i => `<rect x="${i * 150 - 20}" y="${360 + (i % 3) * 20}" width="${118 + (i % 2) * 20}" height="200" rx="10" fill="${i % 2 ? '#2f6a2c' : '#285e27'}" ${O(4)}/>`)}`),
    mid:t=>svg(`<defs>${lg('km-hedge', [[0, '#4a9a3e'], [1, '#2a6a24']])}${lg('km-path', [[0, '#d2b98a'], [1, '#b89c6c']])}${lg('km-hole', [[0, '#1a3a16'], [1, '#6a5a3a']])}</defs>
      ${rep(34, i => `<circle cx="${i * 50 - 20}" cy="${392 + (i % 3) * 4}" r="${30 + (i % 4) * 4}" fill="${i % 2 ? '#3f8a36' : '#4a9a3e'}" ${O(5)}/>`)}<path d="M-40 392 H1640 V590 H-40Z" fill="url(#km-hedge)"/>
      ${rep(46, i => `<circle cx="${(i * 97) % 1640 - 20}" cy="${410 + (i * 53) % 170}" r="${14 + i % 9}" fill="${i % 3 ? '#5aae4a' : '#3f8a36'}" opacity=".75"/>`)}
      
      ${[260, 800, 1340].map(x => `<g transform="translate(${x} 590)"><path d="M-70 0 V-170 H70 V0Z" fill="url(#km-hole)" ${O(5)}/>
        <path d="M-70 -170 L-40 -150 V-20 L-70 0Z" fill="#23541e" ${O(3)}/><path d="M70 -170 L40 -150 V-40 L70 0" fill="#1d4a19" ${O(3)}/>
        <path d="M-40 -20 L40 -40 L70 0 L-70 0Z" fill="#b89c6c"/><path d="M-40 -150 H40 V-40 L-40 -20Z" fill="#2a6a24" opacity=".85"/></g>`).join('')}
      <path d="M-40 580 H1640 V900 H-40Z" fill="url(#km-path)"/>
      ${rep(26, i => `<ellipse cx="${(i * 71) % 1600}" cy="${610 + (i * 29) % 270}" rx="${6 + i % 5}" ry="3" fill="#8a7450" opacity=".55"/>`)}
      ${[530, 1070].map(x => `<g transform="translate(${x} 600)">${shadow(0, 4, 26, 6)}<path fill="none" d="M0 0 V-170" ${O(9)}/><path fill="none" d="M0 0 V-170" stroke="#3a3a44" stroke-width="5"/>
        <path fill="none" d="M0 -170 Q 24 -186 36 -164" ${O(5)}/><path d="M22 -164 L50 -164 L46 -122 L26 -122Z" fill="#ffd84d" ${O(4)}/><circle class="twinkle" cx="36" cy="-142" r="34" fill="#ffd84d" opacity=".22"/></g>`).join('')}
      <g transform="translate(1210 700)">${shadow(0, 6, 40, 8)}<rect x="-7" y="-190" width="14" height="190" fill="#8a5a2c" ${O(4)}/>
        <g><path d="M-6 -176 H96 L120 -156 L96 -136 H-6Z" fill="#d6352b" ${O(4)}/><text x="44" y="-148" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="22" fill="#fff">EXIT</text></g>
        <path d="M6 -124 H-96 L-120 -104 L-96 -84 H6Z" fill="#f4ecd6" ${O(4)}/><text x="-48" y="-96" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="22" fill="#2b1a0a">???</text></g>`),
    fg:t=>svg(`<path d="M-40 900 V790 Q 40 750 130 790 V900Z" fill="#2f6a2a" ${O(5)}/><path d="M1640 900 V790 Q 1560 750 1470 790 V900Z" fill="#2f6a2a" ${O(5)}/>`),
  },

  // ─────────────────────────────────────────────────────────────
  // THE SOUNDSTAGE — westerns, sci-fi, heists, anything on a film set
  studio: {
    label:'The Soundstage', fx:'dust', indoor:true, amb:['hum'],
    far:t=>svg(`<defs>${lg('kst-wall', [[0, '#2a2e38'], [1, '#1a1d24']])}${lg('kst-wood', [[0, '#c8904f'], [1, '#8a5a2c']])}</defs>
      <rect width="1600" height="900" fill="url(#kst-wall)"/>
      <g transform="translate(180 540)"><path d="M0 0 V-300 H200 V-360 H340 V-300 H560 V0Z" fill="url(#kst-wood)" ${O(7)}/><path fill="none" d="M0 -300 H560" ${O(8)}/>
        <rect x="80" y="-220" width="100" height="220" fill="#5a3a1f" ${O(5)}/><rect x="330" y="-230" width="150" height="100" fill="#2a1a0c" ${O(5)}/><path fill="none" d="M405 -230 V-130 M330 -180 H480" ${O(4)}/>
        <path fill="none" d="M-20 -150 H580" stroke="#6b4422" stroke-width="8"/><rect x="220" y="-352" width="100" height="40" fill="#f4ecd6" ${O(4)}/></g>
      <g transform="translate(880 160)"><rect x="0" y="0" width="580" height="380" fill="#22b24c" ${O(7)}/>${rep(5, i => `<path d="M${i * 116 + 30} 0 Q ${i * 116 + 50} 190 ${i * 116 + 30} 380" stroke="#1b9a40" stroke-width="6" fill="none"/>`)}</g>
      <g transform="translate(1170 110)"><rect x="-110" y="-32" width="220" height="64" rx="10" fill="#300" ${O(5)}/><text x="0" y="14" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="36" fill="#ff3b30" class="twinkle">ON AIR</text></g>`),
    mid:t=>svg(`<defs>${lg('kst-floor', [[0, '#484c56'], [1, '#2c2f36']])}</defs>
      <path d="M-40 540 L1640 540 L1640 900 L-40 900Z" fill="url(#kst-floor)"/>
      ${rep(10, i => `<path fill="none" d="M${i * 200 - 40} 540 L${i * 240 - 380} 900" stroke="#3a3d45" stroke-width="4"/>`)}
      <path fill="none" d="M200 760 H1400" stroke="#ffcc33" stroke-width="6" stroke-dasharray="30 20"/>
      ${[[150, 1], [1460, -1]].map(([x, f]) => `<g transform="translate(${x} 580)">${shadow(0, 6, 70, 12)}<path fill="none" d="M-60 0 L0 -40 L60 0 M0 -40 V-320" ${O(9)}/><path d="M-60 0 L0 -40 L60 0 M0 -40 V-320" stroke="#555a64" stroke-width="4" fill="none"/>
        <g transform="translate(0 -330) rotate(${f * 24})"><path d="M-70 -46 H70 L84 46 H-84Z" fill="#1c1e24" ${O(6)}/><ellipse cx="0" cy="46" rx="80" ry="12" fill="#fffbe0"/><path class="shimmer" d="M-70 50 L-260 820 L260 820 L70 50Z" fill="#fffbe0" opacity=".14"/></g></g>`).join('')}
      <g transform="translate(1180 660)">${shadow(0, 10, 110, 16)}<path d="M-90 0 L-60 -80 L60 -80 L90 0" fill="none" ${O(8)}/><path d="M-90 0 L-60 -80 L60 -80 L90 0" stroke="#555a64" stroke-width="4" fill="none"/>
        <rect x="-80" y="-170" width="140" height="90" rx="10" fill="#1c1e24" ${O(6)}/><path d="M60 -150 L110 -170 L110 -90 L60 -110Z" fill="#2a2d34" ${O(5)}/>
        <circle cx="-40" cy="-190" r="30" fill="#2a2d34" ${O(5)}/><circle cx="20" cy="-190" r="30" fill="#2a2d34" ${O(5)}/><circle cx="-40" cy="-190" r="8" fill="#888"/><circle cx="20" cy="-190" r="8" fill="#888"/></g>
      <g transform="translate(430 700) rotate(-8)">${shadow(0, 40, 80, 12)}<rect x="-70" y="-30" width="140" height="80" fill="#1c1e24" ${O(5)}/>
        <g transform="rotate(-12 -70 -30)"><rect x="-70" y="-56" width="140" height="26" fill="#f4f4f4" ${O(5)}/>${rep(5, i => `<path fill="none" d="M${-60 + i * 28} -56 L${-46 + i * 28} -30" stroke="#111" stroke-width="12"/>`)}</g>
        <path fill="none" d="M-50 0 H40 M-50 22 H20" stroke="#ddd" stroke-width="4"/></g>`),
    fg:t=>svg(`<path d="M-20 -10 H1620 V40 H-20Z" fill="#101216" ${O(4)}/>${rep(8, i => `<g transform="translate(${80 + i * 205} 40)"><rect x="-34" y="0" width="68" height="30" fill="#22252c" ${O(4)}/><ellipse cx="0" cy="32" rx="24" ry="5" fill="#fffbe0"/></g>`)}`),
  },
};
KITS.kitchen.fire = [430, 400];
