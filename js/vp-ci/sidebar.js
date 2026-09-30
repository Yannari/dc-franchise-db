// ══════════════════════════════════════════════════════════════════════
// vp-ci/sidebar.js — the live sidebar (Plan 5, spec 18.3)
// ══════════════════════════════════════════════════════════════════════
//
// The room as the day began (row.ci.start: who is in, who holds power, who
// suspects whom, the closest bonds and the worst grudges), played forward by
// what has aired so far: a new player once they walk in, the Influencers once
// they are crowned, BLOCKED once the name is sent. Screens before this one
// count as seen; on this one, only the steps up to `idx`. It can never tell
// the viewer something the screen has not.
//
// The viewer is told who is really behind every profile; the room is not.
import { esc, faceUrl, ringOf, nameOf, realOf, isCatfish, bg } from './parts.js';
import { faceOf } from './steps.js';

const NAMED = /^(block\.announce\.|vote\.result|block\.inperson\.tell)/;
const CROWN = /^result\.(influencers|sole|super|secret)$/;

/** What has happened on screen by step `idx` of screen `si`. */
export function playedTo(row, screens, si, idx) {
  const start = row.ci.start || { active: row.ci.active || [], influencers: [], suspects: [], bonds: [], rivals: [] };
  const inRoom = [...start.active];
  let influencers = [...start.influencers];
  const out = new Set();
  screens.forEach((s, i) => {
    if (i > si) return;
    const upto = i < si ? s.steps.length - 1 : idx;
    const seen = s.steps.slice(0, upto + 1);
    if (s.stage === 'arrive') for (const x of seen) if (x.entry && x.about && x.who === x.about && !inRoom.includes(x.about)) inRoom.push(x.about);
    if (s.kind === 'ratings' && s.d && seen.some(x => CROWN.test(x.key || ''))) influencers = [...s.d.influencers];
    if (s.kind === 'blocking' && s.d?.target && seen.some(x => NAMED.test(x.key || ''))) out.add(s.d.target);
  });
  return { start, inRoom, influencers, out };
}

export function sidebarHtml(row, screens, si, idx) {
  const { start, inRoom, influencers, out } = playedTo(row, screens, si, idx);
  const players = inRoom.filter(h => row.ci.profiles?.[h]).map(h => {
    const url = faceUrl(faceOf(row, h, 'profile'));
    const fake = isCatfish(row, h);
    return `<div class="civ-sp${out.has(h) ? ' out' : ''}" data-h="${esc(h)}" style="--ring:${ringOf(row, h)}">
      <div class="ph"${bg(url)}>${url ? '' : esc(nameOf(row, h)[0] || '?')}</div>
      <div class="t"><b>${esc(nameOf(row, h))}</b>${influencers.includes(h) ? '<span class="civ-crown">♛</span>' : ''}${out.has(h) ? '<span class="civ-x">BLOCKED</span>' : ''}
        <small>${fake ? `<i>catfish</i> · really ${esc(realOf(row, h))}` : row.ci.profiles[h].people?.length > 1 ? `shared · ${esc(realOf(row, h))}` : 'playing as themselves'}</small></div></div>`;
  }).join('');
  const who = h => `<b style="color:${ringOf(row, h)}">${esc(nameOf(row, h))}</b>`;
  const live = h => inRoom.includes(h) && !out.has(h);
  const sus = start.suspects.filter(([o, t]) => live(o) && live(t)).slice(0, 5)
    .map(([o, t, real]) => `<li>${who(o)} doubts ${who(t)} is real <span class="civ-meter"><i style="width:${real}%"></i></span></li>`).join('');
  const bonds = start.bonds.filter(([a, b]) => live(a) && live(b)).slice(0, 4).map(([a, b]) => `<li>${who(a)} <span class="civ-heart">♥</span> ${who(b)}</li>`).join('');
  const rivals = start.rivals.filter(([a, b]) => live(a) && live(b)).slice(0, 4).map(([a, b]) => `<li>${who(a)} <span class="civ-bolt">⚡</span> ${who(b)}</li>`).join('');
  return `<div class="civ-sidehd">THE ROOM <small>Day ${esc(row.day)} · live</small></div>
    <div class="civ-splist">${players}</div>
    ${sus ? `<div class="civ-sidesec">SUSPICIONS<ul>${sus}</ul></div>` : ''}
    ${bonds ? `<div class="civ-sidesec">CLOSEST<ul>${bonds}</ul></div>` : ''}
    ${rivals ? `<div class="civ-sidesec">GRUDGES<ul>${rivals}</ul></div>` : ''}
    <div class="civ-sidenote">As the day began. Suspicions and bonds move after the episode.</div>`;
}
