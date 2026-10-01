// ══════════════════════════════════════════════════════════════════════
// vp-ci/web-stage.js — THE CIRCLE WEB: the episode, summed up as a network
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-10-01): "a web tab at the end of each episode to see the
// relationship of each person with a tab switcher and the alliances ... make
// it modern animated ... movement compared to last episode ... a summarizer of
// the episode"; "include romance/crush"; "more tech forward"; "last screen,
// before Debug". Mockup: mockup/mockup-circle-web.html (approved).
//
// Everyone on the ring (the Circle's own shape), their ties drawn between
// them, alliances as named bands. Each click is one change since the last
// episode, lit up on the web and said in words; the tabs (everything,
// alliances, romance, rivalries, one person) re-draw it at any time.
// The ties and the changes come from web-data.js (pure).
import { esc, faceUrl, bg, ringOf, nameOf, isCatfish } from './parts.js';
import { faceOf } from './steps.js';
import { tiesOf } from '../ci/web-data.js';

const ALLY_COLORS = ['#ffd23f', '#3fd8ff', '#3fbf7a', '#ff8a4c', '#b35cff', '#ff4fb4'];
const TABS = [['all', 'EVERYTHING'], ['alliance', 'ALLIANCES'], ['romance', 'ROMANCE'], ['rival', 'RIVALRIES']];

/** The screen, after an episode's last: its steps are the changes. */
export function webScreen(row, prev) {
  const cur = row?.ci?.end;
  if (!cur) return null;
  // Worked out by the season (ci/web-data.js changesOf), so the backlog prints the same list.
  const changes = cur.changes || [];
  const steps = changes.length
    ? changes.map((c, i) => ({ part: 'stage', who: null, host: true, key: `web.${c.kind}`, text: c.text, change: c, ...(i === 0 ? { open: true } : {}) }))
    : [{ part: 'stage', who: null, host: true, key: 'web.quiet', text: 'A quiet night in The Circle: nobody moved much.' }];
  return { id: 'web', kind: 'web', stage: 'web', title: 'The Circle Web', who: [], cast: [], steps,
    d: { cur, prevPeople: prev?.ci?.end?.people || null, changes, prevTies: tiesOf(prev?.ci?.end || null).map(t => `${t.kind}:${[t.a, t.b].sort().join('|')}`) } };
}

function layout(people) {
  const R = 225, pos = {};
  people.forEach((h, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / Math.max(1, people.length); pos[h] = [Math.cos(a) * R, Math.sin(a) * R]; });
  return { R, pos };
}

export function webStage(row, screen, idx, fresh) {
  const d = screen.d || {};
  const cur = d.cur || {};
  const tab = screen.tab || 'all', who = screen.who1 || (cur.people || [])[0];
  const st = idx >= 0 ? screen.steps[idx] : null;
  const ch = st?.change || null;
  const ghosts = cur.leftToday || [];
  const people = [...(cur.people || []), ...ghosts];
  const { R, pos } = layout(people);
  const ties = tiesOf(cur);
  const alliances = (cur.alliances || []).filter(a => a.status === 'active' && a.members.filter(m => cur.people?.includes(m)).length >= 2);
  const colorOf = id => ALLY_COLORS[(cur.alliances || []).findIndex(a => a.id === id) % ALLY_COLORS.length];
  const inAlliance = (a, b) => alliances.some(al => al.members.includes(a) && al.members.includes(b));
  const keep = t => tab === 'all' || (tab === 'romance' && (t.kind === 'crush' || t.kind === 'mutual')) || (tab === 'rival' && t.kind === 'grudge')
    || (tab === 'alliance' && inAlliance(t.a, t.b)) || (tab === 'person' && (t.a === who || t.b === who));
  const shown = ties.filter(keep);
  const lit = t => ch && ((t.a === ch.a && t.b === ch.b) || (t.a === ch.b && t.b === ch.a));
  const isNew = t => !(d.prevTies || []).includes(`${t.kind}:${[t.a, t.b].sort().join('|')}`);
  const involved = new Set(shown.flatMap(t => [t.a, t.b]));
  let s = `<defs>
    <linearGradient id="cwG"><stop offset="0" stop-color="#ff4fb4"/><stop offset=".5" stop-color="#8b5cff"/><stop offset="1" stop-color="#3fd8ff"/></linearGradient>
    <pattern id="cwHex" width="28" height="48.5" patternUnits="userSpaceOnUse" patternTransform="scale(.9)"><path d="M14 0 L28 8.1 L28 24.3 L14 32.4 L0 24.3 L0 8.1 Z M14 32.4 L14 48.5" fill="none" stroke="rgba(120,140,255,.10)" stroke-width="1"/></pattern>
    <radialGradient id="cwSweep" cx="0" cy="0" r="1"><stop offset="0" stop-color="#3fd8ff" stop-opacity=".0"/><stop offset="1" stop-color="#3fd8ff" stop-opacity=".22"/></radialGradient>
    <filter id="cwGlow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`;
  s += `<rect x="-400" y="-330" width="800" height="660" fill="url(#cwHex)"/>`;
  for (const k of [0.33, 0.66, 1]) s += `<circle r="${R * k}" fill="none" stroke="rgba(120,160,255,${k === 1 ? 0.35 : 0.12})" stroke-width="1" ${k === 1 ? '' : 'stroke-dasharray="2 6"'}/>`;
  s += `<circle r="${R + 38}" fill="none" stroke="url(#cwG)" stroke-width="1.5" opacity=".45" stroke-dasharray="4 10" class="cw-orbit"/>`;
  s += `<g class="cw-sweep"><path d="M0 0 L${R + 60} 0 A${R + 60} ${R + 60} 0 0 0 ${(R + 60) * Math.cos(-0.7)} ${(R + 60) * Math.sin(-0.7)} Z" fill="url(#cwSweep)"/></g>`;
  // Alliances: a soft band through their members, named.
  if (tab === 'all' || tab === 'alliance') for (const al of alliances) {
    const pts = al.members.filter(m => pos[m]).map(m => pos[m]);
    if (pts.length < 2) continue;
    const c = colorOf(al.id), on = ch?.alliance === al.id;
    const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ') + (pts.length > 2 ? ' Z' : '');
    s += `<path class="cw-band${on ? ' on' : ''}" d="${path}" stroke="${c}" fill="${c}"/>`;
    const m = pts.reduce((acc, p) => [acc[0] + p[0] / pts.length, acc[1] + p[1] / pts.length], [0, 0]);
    s += `<text class="cw-band-l" x="${m[0] * 0.6}" y="${m[1] * 0.6}" fill="${c}">${esc(al.name.toUpperCase())}</text>`;
  }
  // The ties.
  for (const t of shown) {
    const A = pos[t.a], B = pos[t.b];
    if (!A || !B) continue;
    const k = 0.32, mx = (A[0] + B[0]) * k, my = (A[1] + B[1]) * k;
    const cls = ['cw-e', `k-${t.kind}`, lit(t) ? 'lit' : '', isNew(t) ? 'fresh' : ''].join(' ');
    s += `<path class="${cls}" d="M${A[0]},${A[1]} Q${mx},${my} ${B[0]},${B[1]}" stroke-width="${1.2 + t.w * 1.5}"/>`;
    if (t.kind === 'crush' || t.kind === 'mutual') {
      const hx = (A[0] + B[0]) / 2 * 0.62 + (t.kind === 'crush' ? (B[0] - A[0]) * 0.12 : 0), hy = (A[1] + B[1]) / 2 * 0.62 + (t.kind === 'crush' ? (B[1] - A[1]) * 0.12 : 0);
      s += `<text class="cw-heart" x="${hx}" y="${hy + 5}">${t.kind === 'mutual' ? '💞' : '💗'}</text>`;
    }
  }
  // The people.
  for (const h of people) {
    const [x, y] = pos[h];
    const gone = ghosts.includes(h);
    const dim = gone || (tab !== 'all' && !involved.has(h) && !(tab === 'person' && h === who));
    const on = ch && (ch.a === h || ch.b === h);
    const url = faceUrl(faceOf(row, h, 'profile'));
    s += `<g class="cw-n${dim ? ' dim' : ''}${on ? ' on' : ''}${gone ? ' gone' : ''}" transform="translate(${x},${y})">
      <circle r="39" class="cw-halo" stroke="${ringOf(row, h)}"/>
      <circle r="33" fill="#13163d"/>${url ? `<image href="${esc(url)}" x="-31" y="-31" width="62" height="62" preserveAspectRatio="xMidYMid slice" clip-path="circle(31px)"/>` : `<text class="cw-ini" y="9">${esc(nameOf(row, h)[0] || '?')}</text>`}
      <circle r="33" fill="none" stroke="${ringOf(row, h)}" stroke-width="3"/>
      <text class="cw-nm" y="54">${esc(nameOf(row, h).toUpperCase())}${isCatfish(row, h) ? ' ◆' : ''}</text>
      ${gone ? '<text class="cw-x" y="5">BLOCKED</text>' : ''}</g>`;
  }
  const changes = d.changes || [];
  const seen = changes.slice(0, Math.max(0, idx + 1));
  const TAG = { blocked: 'OUT', formed: 'NEW', broken: 'BROKE', left: 'LEFT', mutual: '♥ BOTH', crush: 'CRUSH', grudge: 'GRUDGE', bond: 'CLOSE', closer: 'CLOSER', cooled: 'COOLED' };
  const list = seen.map((c, i) => `<div class="cw-chg k-${c.kind}${i === idx && fresh ? ' new' : ''}"><span class="t">${TAG[c.kind] || 'Δ'}</span>${esc(c.text)}</div>`).join('')
    || `<div class="cw-empty">${changes.length ? 'Click to run the changes ▸' : 'Nothing moved tonight.'}</div>`;
  const al = alliances.map(a => `<div class="cw-al"><i style="background:${colorOf(a.id)}"></i><b>${esc(a.name)}</b><small>${a.members.filter(m => cur.people?.includes(m)).map(m => esc(nameOf(row, m))).join(' · ')}</small></div>`).join('')
    || '<div class="cw-empty">No alliances standing.</div>';
  const people1 = (cur.people || []).map(h => `<option value="${esc(h)}"${h === who && tab === 'person' ? ' selected' : ''}>${esc(nameOf(row, h))}</option>`).join('');
  const tabs = TABS.map(([k, l]) => `<button type="button" class="cw-tab${tab === k ? ' on' : ''}" data-webtab="${k}">${l}</button>`).join('')
    + `<label class="cw-tab${tab === 'person' ? ' on' : ''}">PERSON <select data-webwho>${people1}</select></label>`;
  return `<div class="civ-layer cw">
    <div class="cw-hud tl"></div><div class="cw-hud tr"></div><div class="cw-hud bl"></div><div class="cw-hud br"></div><div class="cw-scan"></div>
    <div class="cw-head"><small>NETWORK ANALYSIS // EPISODE ${esc(row.num)} · DAY ${esc(row.day)}</small><b>THE CIRCLE WEB</b>
      <div class="cw-read">NODES ${(cur.people || []).length} · TIES ${ties.length} · ALLIANCES ${alliances.length} · Δ ${changes.length}</div></div>
    <div class="cw-tabs" onclick="event.stopPropagation()">${tabs}</div>
    <div class="cw-web"><svg viewBox="-330 -300 660 600">${s}</svg></div>
    <div class="cw-side" onclick="event.stopPropagation()">
      <div class="cw-card"><h3>Δ SINCE LAST EPISODE</h3>${list}</div>
      <div class="cw-card"><h3>ALLIANCES</h3>${al}</div>
      <div class="cw-card cw-legend"><span><i class="l-bond"></i>close</span><span><i class="l-crush"></i>crush · 💞 both</span><span><i class="l-grudge"></i>grudge</span><span>◆ catfish</span></div>
    </div></div>`;
}

export const WEB_CSS = `
.cw{background:radial-gradient(80% 90% at 35% 40%,#1c1650,#05061a 75%);overflow:hidden;font-family:Montserrat,sans-serif}
.cw-scan{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px);z-index:2}
.cw-hud{position:absolute;width:3cqw;height:3cqw;border:2px solid rgba(63,216,255,.6);z-index:3}
.cw-hud.tl{left:1.2%;top:2%;border-right:0;border-bottom:0}.cw-hud.tr{right:1.2%;top:2%;border-left:0;border-bottom:0}
.cw-hud.bl{left:1.2%;bottom:2%;border-right:0;border-top:0}.cw-hud.br{right:1.2%;bottom:2%;border-left:0;border-top:0}
.cw-head{position:absolute;left:3%;top:3.5%;z-index:5}
.cw-head small{display:block;font:700 .85cqw ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.18em;color:#3fd8ff}
.cw-head b{display:block;font-weight:900;font-size:2.4cqw;letter-spacing:.05em;background:linear-gradient(90deg,#ff4fb4,#8b5cff,#3fd8ff);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 1cqw rgba(139,92,255,.5))}
.cw-read{font:700 .8cqw ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.12em;color:#9fb4ff;margin-top:.2cqw}
.cw-tabs{position:absolute;left:3%;top:15.5%;z-index:6;display:flex;gap:.45cqw;flex-wrap:wrap;max-width:58%}
.cw-tab{font:800 .82cqw Montserrat,sans-serif;letter-spacing:.12em;padding:.45cqw .9cqw;border-radius:.35cqw;border:1px solid rgba(63,216,255,.35);background:rgba(5,8,30,.7);color:#bfe9ff;cursor:pointer;transition:all .2s;clip-path:polygon(0 0,calc(100% - .6cqw) 0,100% .6cqw,100% 100%,.6cqw 100%,0 calc(100% - .6cqw))}
.cw-tab:hover{border-color:#3fd8ff;color:#fff}
.cw-tab.on{background:linear-gradient(90deg,rgba(255,79,180,.85),rgba(139,92,255,.85));color:#fff;border-color:transparent;box-shadow:0 0 1.2cqw rgba(255,79,180,.45)}
.cw-tab select{font:inherit;background:transparent;color:inherit;border:0;outline:0;margin-left:.3cqw}
.cw-tab select option{color:#111}
.cw-web{position:absolute;left:2%;top:21%;width:58%;height:77%;z-index:4}
.cw-web svg{width:100%;height:100%;overflow:visible}
.cw-orbit{animation:cwSpin 60s linear infinite;transform-origin:center}
.cw-sweep{animation:cwSpin 7s linear infinite;transform-origin:0 0}
@keyframes cwSpin{to{transform:rotate(360deg)}}
.cw-band{stroke-width:14;stroke-linejoin:round;stroke-linecap:round;fill-opacity:.07;stroke-opacity:.28;transition:all .4s}
.cw-band.on{stroke-opacity:.6;fill-opacity:.16;filter:url(#cwGlow)}
.cw-band-l{font:900 11px Montserrat,sans-serif;letter-spacing:.1em;text-anchor:middle;paint-order:stroke;stroke:#05061a;stroke-width:4px}
.cw-e{fill:none;stroke-linecap:round;opacity:.75;stroke-dasharray:10 7;animation:cwFlow 2.4s linear infinite;transition:opacity .3s}
@keyframes cwFlow{to{stroke-dashoffset:-34}}
.cw-e.k-bond{stroke:#3fd8ff}.cw-e.k-crush,.cw-e.k-mutual{stroke:#ff4fb4}.cw-e.k-grudge{stroke:#ff4a6a;stroke-dasharray:4 6}
.cw-e.k-mutual{stroke-dasharray:none;animation:none}
.cw-e.fresh{animation:cwDraw 1.4s ease-out both, cwFlow 2.4s 1.4s linear infinite}
@keyframes cwDraw{from{stroke-dasharray:0 900;opacity:0}to{stroke-dasharray:900 0;opacity:.75}}
.cw-e.lit{opacity:1;filter:url(#cwGlow);animation:cwPulse 1.1s ease-in-out infinite}
@keyframes cwPulse{50%{opacity:.55}}
.cw-heart{font-size:15px;text-anchor:middle}
.cw-n{transition:opacity .35s}
.cw-n.dim{opacity:.2}
.cw-n.gone{opacity:.35}
.cw-halo{fill:none;stroke-width:1.5;opacity:.0;stroke-dasharray:3 4}
.cw-n.on .cw-halo{opacity:.9;animation:cwSpin 4s linear infinite;transform-origin:center}
.cw-n.on{filter:url(#cwGlow)}
.cw-nm{font:800 11.5px Montserrat,sans-serif;fill:#fff;text-anchor:middle;paint-order:stroke;stroke:#05061a;stroke-width:4px;letter-spacing:.05em}
.cw-ini{font:900 26px Montserrat,sans-serif;fill:#fff;text-anchor:middle}
.cw-x{font:900 10px Montserrat,sans-serif;fill:#ff4a6a;text-anchor:middle;letter-spacing:.12em}
.cw-side{position:absolute;right:2.5%;top:4%;bottom:4%;width:35%;z-index:5;display:flex;flex-direction:column;gap:.9cqw}
.cw-card{background:linear-gradient(180deg,rgba(10,14,46,.82),rgba(6,8,30,.82));border:1px solid rgba(63,216,255,.28);border-radius:.6cqw;padding:1cqw 1.2cqw;backdrop-filter:blur(6px);box-shadow:inset 0 0 1.5cqw rgba(63,216,255,.06)}
.cw-card h3{margin:0 0 .6cqw;font:800 .85cqw ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.2em;color:#3fd8ff}
.cw-card:first-child{flex:1;overflow:hidden}
.cw-chg{display:flex;gap:.7cqw;align-items:center;font-size:1cqw;line-height:1.35;margin:.4cqw 0;color:#e6eaff}
.cw-chg.new{animation:cwIn .5s cubic-bezier(.2,1.2,.3,1) both}
@keyframes cwIn{from{opacity:0;transform:translateX(8%)}}
.cw-chg .t{flex:none;min-width:5cqw;text-align:center;font:800 .7cqw ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.08em;padding:.2cqw .4cqw;border-radius:.25cqw;background:#3fd8ff;color:#04102a}
.cw-chg.k-blocked .t,.cw-chg.k-broken .t{background:#ff4a6a;color:#fff}.cw-chg.k-grudge .t{background:#ff7a4a;color:#fff}
.cw-chg.k-crush .t,.cw-chg.k-mutual .t{background:#ff4fb4;color:#fff}.cw-chg.k-left .t,.cw-chg.k-cooled .t{background:#5a5f8a;color:#fff}
.cw-chg.k-formed .t{background:#ffd23f;color:#211700}.cw-chg.k-closer .t,.cw-chg.k-bond .t{background:#3fbf7a;color:#03140b}
.cw-empty{font-size:.95cqw;color:#8f96c8;font-style:italic}
.cw-al{display:flex;align-items:center;gap:.55cqw;margin:.35cqw 0;font-size:.95cqw}
.cw-al i{width:.9cqw;height:.9cqw;border-radius:50%;box-shadow:0 0 .6cqw currentColor}
.cw-al small{color:#9fb4ff}
.cw-legend{display:flex;flex-wrap:wrap;gap:.9cqw;font-size:.8cqw;color:#9fb4ff}
.cw-legend i{display:inline-block;width:1.6cqw;height:.3cqw;border-radius:2px;vertical-align:middle;margin-right:.35cqw}
.l-bond{background:#3fd8ff}.l-crush{background:#ff4fb4}.l-grudge{background:#ff4a6a}
@media (prefers-reduced-motion: reduce){.cw-orbit,.cw-sweep,.cw-e,.cw-n.on .cw-halo{animation:none}}
`;
