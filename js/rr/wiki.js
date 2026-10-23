// ══════════════════════════════════════════════════════════════════════
// rr/wiki.js — a Ridonculous Race season as a reference article
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-23: "build the wiki and awards pages from it". The season page's Wiki tab
// (season-wiki-tab.js) was written for shows with a vote, a block or a runway, and a race season drew a cast wall,
// a "Nothing identifies a twist" note and nothing else. A real race season's article is built around one chart, every
// team's place on every leg with the eliminations, the Express Passes and the U-Turns marked on it, then a block per
// leg: where it went, the tasks, who did which, who checked in when, who went home. Every line here is read off the
// export's leg records (rr/leg-record.js); nothing is written by hand, so it fills itself in for any season.
// PURE: the document in, HTML out. The season page hands in its own portrait resolver.
import { showName } from '../shows.js';
import {
  legsOf, teamName, cap, ordinal, count, minutesWords, andList, penaltyLabel, twistName, KIND, relWords, nonElimWords,
  rewardWords, fearWords, hurtWords, stretchName, penaltyPhrase,
} from './record-words.js';

export { penaltyLabel } from './record-words.js';

/** A season whose rounds are legs: teams, and each round a check-in order. Asked of the data, not of the show's slug. */
export const isRaceSeason = s => Array.isArray(s?.teams) && s.teams.length > 0
  && [...(s.votingHistory || []), ...(s.final ? [s.final] : [])].some(h => Array.isArray(h?.order) && h.order.some(o => o?.team));

export const RACE_WIKI_CSS = `
.rrw-grid{border-collapse:collapse;font-size:13px;min-width:100%}
.rrw-grid th,.rrw-grid td{border:1px solid var(--stroke,rgba(255,255,255,.1));padding:5px 7px;text-align:center;white-space:nowrap}
.rrw-grid thead th{font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.75}
.rrw-grid th.rrw-team,.rrw-grid td.rrw-team{text-align:left;position:sticky;left:0;background:var(--panel,#141821);z-index:1}
.rrw-grid td.rrw-team small{display:block;opacity:.6;font-size:11px}
.rrw-p{font-weight:700;font-variant-numeric:tabular-nums}
.rrw-m{font-size:11px;margin-left:2px;opacity:.9}
.rrw-win{background:#c79a0a;color:#1a1200}
.rrw-out{background:#b42f3a;color:#fff}
.rrw-ne{background:#d9772b;color:#1d0d00}
.rrw-saved{background:#1f9e8f;color:#fff}
.rrw-quit{background:#7c3aed;color:#fff}
.rrw-gone{background:rgba(255,255,255,.025)}
.rrw-legend{display:flex;flex-wrap:wrap;gap:6px 16px;margin:10px 0 0;font-size:12.5px;opacity:.85}
.rrw-legend span{display:inline-flex;align-items:center;gap:6px}
.rrw-legend i{display:inline-block;width:14px;height:14px;border-radius:3px}
.rrw-leg{margin:0 0 30px;padding:0 0 6px;border-bottom:1px solid var(--stroke,rgba(255,255,255,.08))}
.rrw-leg h3{font-size:18px;margin:0 0 6px;display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.rrw-tag{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:2px 8px;border-radius:999px;
  background:rgba(242,183,5,.16);color:#f2c94c}
.rrw-tag.is-ne{background:rgba(251,146,60,.18);color:#fdba74}
.rrw-tag.is-final{background:rgba(52,211,153,.18);color:#6ee7b7}
.rrw-route{font-size:13.5px;opacity:.8;margin:0 0 10px;line-height:1.6}
.rrw-leg .wk-table{margin:0 0 12px}
.rrw-leg .wk-table td{vertical-align:top;font-size:13.5px;line-height:1.55}
.rrw-kind{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;opacity:.7;white-space:nowrap}
.rrw-side b{color:var(--wk-accent,#f2b705)}
.rrw-clock{font-variant-numeric:tabular-nums;white-space:nowrap}
.rrw-clock small,.rrw-gap{opacity:.65;font-size:12px}
.rrw-note{font-size:12.5px;opacity:.85}
.rrw-out-row td{background:rgba(239,68,68,.12)}
.rrw-win-row td{background:rgba(242,183,5,.1)}
.rrw-faces{display:inline-flex;gap:3px;vertical-align:middle;margin-right:8px}
.rrw-faces img{width:28px;height:28px;border-radius:50%;object-fit:cover;background:rgba(255,255,255,.06)}
`;

// the short gap a table prints: "+12m", "+1h 24m"
const gapShort = m => (m == null ? '' : m === 0 ? '—' : m < 60 ? `+${m}m` : `+${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}`);

export function buildRaceWiki(s, { face = () => '', seasonRow = null } = {}) {
  const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const legs = legsOf(s);
  const placements = s.placements || [];
  const byName = new Map(placements.map(p => [p.name, p]));
  const teams = (s.teams?.length ? s.teams : []).map(t => ({ ...t }));
  if (!teams.length) return '<p class="sr-thin">No teams recorded for this season.</p>';
  const nLegs = legs.length;

  // ── when and how each team left ──
  const exitOf = new Map();
  for (const h of legs) for (const x of h.exits || []) {
    const t = x.team || teams.find(tt => tt.members.includes(x.name))?.team;
    if (t) exitOf.set(t, { leg: h.leg, channel: x.channel, verb: x.verb, isFinal: !!h.isFinal });
  }
  const winners = teams.find(t => t.status === 'Winner') || null;
  const finalOrder = s.final?.order || [];
  const runnersUp = finalOrder.filter(o => o.team !== winners?.team);
  const nonElims = legs.filter(h => h.nonElimination).length;

  const faces = members => `<span class="rrw-faces">${members.map(n => {
    const p = byName.get(n);
    return `<img src="${esc(face(p || null, p?.playerSlug, n))}" alt="" onerror="this.style.visibility='hidden'">`;
  }).join('')}</span>`;
  const link = n => {
    const p = byName.get(n);
    return p?.playerSlug ? `<a href="player.html?player=${esc(p.playerSlug)}">${esc(n)}</a>` : esc(n);
  };
  const resultOf = t => {
    if (t.status === 'Winner') return 'Winners';
    const x = exitOf.get(t.team);
    if (x?.isFinal) return x.channel === 'midpoint' ? 'Out at the halfway mat of the final leg' : 'Third or lower in the final';
    if (!x) return t.status === 'Finalist' ? 'Runners-up' : esc(t.status || '');
    const how = { quit: 'Quit', medevac: 'Medically evacuated', disqualified: 'Disqualified', 'on-location': 'Eliminated on location' }[x.channel] || 'Eliminated';
    return `${how}, Leg ${x.leg}`;
  };
  const legsWon = t => legs.filter(h => h.order?.[0]?.team === t.team).length;
  const avgPlace = t => {
    const ps = legs.map(h => h.order?.find(o => o.team === t.team)?.place).filter(Number.isFinite);
    return ps.length ? Math.round(ps.reduce((a, b) => a + b, 0) / ps.length * 10) / 10 : null;
  };

  // ── the sections ──
  const toc = [];
  const sec = (title, body, note) => {
    if (!body) return '';
    const id = 'wk-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    toc.push([id, title]);
    return `<section class="wk-section" id="${id}"><h2>${title}${note ? ` <span class="wk-count">${note}</span>` : ''}</h2>${body}</section>`;
  };

  // the lead: where it went and who won it
  const start = legs[0]?.place, end = legs[nLegs - 1]?.place;
  const margin = finalOrder[1]?.time != null && finalOrder[0]?.time != null ? finalOrder[1].time - finalOrder[0].time : null;
  const lead = `<p class="wk-lead"><strong>${esc(s.title || showName(s.format))}</strong> ran ${count(nLegs)} legs${
    start && end ? `, from ${esc(start)} to ${esc(end)}` : ''}. ${cap(count(teams.length))} teams of two started${
    winners ? `; ${esc(teamName(winners.team))}, ${esc(andList(winners.members))}, won it${
      margin != null && runnersUp[0] ? `, ${esc(minutesWords(margin))} ahead of ${esc(teamName(runnersUp[0].team))}` : ''}` : ''}.</p>`;

  const teamTable = `<div class="wk-scroll"><table class="wk-table"><thead><tr><th>Team</th><th>Racers</th><th>Relationship</th>
    <th>Result</th><th>Legs won</th><th>Average place</th></tr></thead><tbody>${teams.map(t => `<tr>
      <td>${faces(t.members)}<b>${esc(t.team)}</b></td>
      <td>${t.members.map(link).join(' &amp; ')}</td>
      <td>${esc(cap(relWords(t.relationship)))}</td>
      <td>${resultOf(t)}</td>
      <td>${legsWon(t)}</td>
      <td>${avgPlace(t) ?? ''}</td></tr>`).join('')}</tbody></table></div>`;

  // ── the race summary: every team's place on every leg ──
  const used = new Set();
  const marksFor = (h, team, o) => {
    const m = [];
    for (const p of h.passes || []) {
      if (p.pass === 'express' && p.team === team) m.push(['ε', 'used the Express Pass']);
      if (p.pass === 'save' && p.team === team) m.push(['♥', 'used the Save']);
      if (p.pass === 'boomerang' && p.on === team && !p.wasted) m.push(['⊃', 'hit by a Boomerang']);
      if (p.pass === 'yield' && p.on === team) m.push(['⊲', 'Yielded']);
    }
    if (h.boomerangVote?.target === team) m.push(['⊃', 'hit by a Boomerang']);
    if (o?.penalty) m.push(['⏱', 'served a penalty at the mat']);
    for (const [k, why] of m) used.add(`${k}|${why}`);
    return m.map(([k, why]) => `<span class="rrw-m" title="${esc(why)}">${k}</span>`).join('');
  };
  const summary = `<div class="wk-scroll"><table class="rrw-grid"><thead><tr><th class="rrw-team">Team</th>${legs.map(h =>
    `<th title="${esc(h.place || '')}">${h.isFinal ? 'Final' : h.leg}</th>`).join('')}</tr></thead><tbody>${teams.map(t => {
    const out = exitOf.get(t.team);
    return `<tr><td class="rrw-team">${esc(t.team)}<small>${esc(andList(t.members))}</small></td>${legs.map(h => {
      const o = h.order?.find(x => x.team === t.team);
      if (!o && out && out.leg === h.leg) return `<td data-team="${esc(t.team)}" data-leg="${h.leg}" class="rrw-out" title="${esc(resultOf(t))}"><span class="rrw-p">${t.placement || '✕'}</span></td>`;
      if (!o) return `<td data-team="${esc(t.team)}" data-leg="${h.leg}" class="rrw-gone"></td>`;
      const last = Math.max(...h.order.map(x => x.place));
      const gone = out && out.leg === h.leg;
      const cls = gone ? (['quit', 'medevac', 'disqualified'].includes(out.channel) ? 'rrw-quit rrw-out' : 'rrw-out')
        : o.place === 1 ? 'rrw-win' : h.saved === t.team ? 'rrw-saved' : h.nonElimination && o.place === last ? 'rrw-ne' : '';
      return `<td data-team="${esc(t.team)}" data-leg="${h.leg}" class="${cls}"><span class="rrw-p">${o.place}</span>${marksFor(h, t.team, o)}</td>`;
    }).join('')}</tr>`;
  }).join('')}</tbody></table></div>
  <div class="rrw-legend">
    <span><i class="rrw-win"></i>Won the leg</span>
    <span><i class="rrw-out"></i>Eliminated</span>
    ${nonElims ? '<span><i class="rrw-ne"></i>Last on a non-elimination leg</span>' : ''}
    ${legs.some(h => h.saved) ? '<span><i class="rrw-saved"></i>Saved by the Save</span>' : ''}
    ${[...used].map(x => x.split('|')).map(([k, why]) => `<span><b>${k}</b>${esc(cap(why))}</span>`).join('')}
  </div>`;

  // ── a block per leg ──
  const sideList = c => (c.sides || []).map(sd => {
    const runs = c.runs.filter(r => r.side === sd.id);
    if (!runs.length) return '';
    return `<div class="rrw-side"><b>${esc(sd.name)}</b> (${runs.length}): ${runs.map(r =>
      `${esc(r.team)}${r.attempts > 1 ? ` <span class="rrw-gap">${r.attempts} tries</span>` : ''}${r.switched ? ' <span class="rrw-gap">switched</span>' : ''}`).join(', ')}</div>`;
  }).join('');
  const howItWent = c => {
    if (c.sides?.length) return sideList(c);
    const runs = c.runs || [];
    if (!runs.length) return '';
    if (c.kind === 'botch') {
      return runs.map(r => `${esc(andList(r.by))} <span class="rrw-gap">(${esc(r.team)}${r.attempts > 1 ? `, ${r.attempts} tries` : ''})</span>`).join(', ');
    }
    const done = runs.filter(r => !r.quit);
    const fast = done.slice().sort((a, b) => a.minutes - b.minutes)[0];
    const most = runs.slice().sort((a, b) => b.attempts - a.attempts)[0];
    const quit = runs.filter(r => r.quit);
    return [fast ? `Fastest: ${esc(fast.team)}, ${esc(minutesWords(fast.minutes))}.` : '',
      most && most.attempts > 1 ? `Most tries: ${esc(most.team)}, ${most.attempts}.` : '',
      quit.length ? `Quit: ${esc(andList(quit.map(r => r.team)))}.` : ''].filter(Boolean).join(' ');
  };
  const legBlock = h => {
    const tags = [h.isFinal ? '<span class="rrw-tag is-final">Final leg</span>' : '',
      h.nonElimination ? '<span class="rrw-tag is-ne">Non-elimination</span>' : '',
      h.twist ? `<span class="rrw-tag">${esc(twistName(h.twist))}</span>` : ''].join('');
    const route = (h.route || []).filter(r => r.name && r.name !== r.id && r.kind !== 'mat');
    const ch = (h.challenges || []).filter(c => c.runs?.length);
    const last = h.order?.length ? Math.max(...h.order.map(x => x.place)) : 0;
    const outTeams = new Set((h.exits || []).map(x => x.team || teams.find(t => t.members.includes(x.name))?.team).filter(Boolean));
    const rows = (h.order || []).map(o => {
      const notes = [];
      if (o.penalty) notes.push(`⏱ ${esc(cap(penaltyPhrase(o.penalty)))} for ${esc(andList([...new Set((o.penaltyReasons || []).map(r => penaltyLabel(r.reason)))]) || 'a penalty')}`);
      if (outTeams.has(o.team)) {
        const x = (h.exits || []).find(e => o.members.includes(e.name));
        notes.push(x?.channel === 'midpoint' ? 'Out at the halfway mat' : x?.channel === 'quit' ? 'Quit the race'
          : x?.channel === 'medevac' ? 'Medically evacuated' : 'Eliminated');
      } else if (h.saved === o.team) notes.push('Used the Save to stay in');
      else if (h.nonElimination && o.place === last && h.nonElim) notes.push(`Not eliminated; ${esc(nonElimWords(h.nonElim.penalty))}`);
      const cls = outTeams.has(o.team) ? 'rrw-out-row' : o.place === 1 ? 'rrw-win-row' : '';
      return `<tr class="${cls}"><td>${o.place}</td><td>${faces(o.members)}${esc(o.team)} <small class="rrw-gap">${esc(andList(o.members))}</small></td>
        <td class="rrw-clock">${o.clock ? `${esc(o.clock)}${o.day > 1 ? ` <small>+${o.day - 1} day${o.day > 2 ? 's' : ''}</small>` : ''}` : ''}</td>
        <td class="rrw-gap">${esc(gapShort(o.gap))}</td><td class="rrw-note">${notes.join('<br>')}</td></tr>`;
    }).join('') + [...outTeams].filter(t => !(h.order || []).some(o => o.team === t)).map(name => {
      // a team out before the mat (the final's halfway cut, a team eliminated on location) has no check-in
      const t = teams.find(x => x.team === name);
      const x = (h.exits || []).find(e => t?.members.includes(e.name));
      return `<tr class="rrw-out-row"><td>${t?.placement || ''}</td><td>${faces(t?.members || [])}${esc(name)} <small class="rrw-gap">${esc(andList(t?.members || []))}</small></td>
        <td></td><td></td><td class="rrw-note">${x?.channel === 'midpoint' ? 'Out at the halfway mat' : 'Eliminated before the Chill Zone'}</td></tr>`;
    }).join('');
    // what else happened on the leg
    const notes = [];
    const where = id => { const n = stretchName(legs, h.leg, id); return n ? ` at ${esc(n.replace(/^The /, 'the '))}` : ''; };
    if (h.reward?.team && h.reward.kind) notes.push(`${esc(teamName(h.reward.team, true))} won ${esc(rewardWords(h.reward.kind))} for checking in first.`);
    for (const p of h.passes || []) {
      if (p.pass === 'express') notes.push(`${esc(teamName(p.team, true))} used the Express Pass${where(p.stretch)}.`);
      else if (p.pass === 'save') notes.push(`${esc(teamName(p.team, true))} used the Save.`);
      else if (p.pass === 'boomerang') notes.push(p.wasted ? `${esc(teamName(p.team, true))} held the Boomerang and never threw it.`
        : `${esc(teamName(p.team, true))} threw ${p.blind ? 'a blind' : 'the'} Boomerang at ${esc(teamName(p.on))}.`);
      else if (p.pass === 'yield') notes.push(`${esc(teamName(p.team, true))} Yielded ${esc(teamName(p.on))}.`);
    }
    if (h.boomerangVote?.target) {
      const n = h.boomerangVote.ballots.filter(b => b.to === h.boomerangVote.target).length;
      notes.push(`The teams voted the Boomerang onto ${esc(teamName(h.boomerangVote.target))}, with ${n} of the ${h.boomerangVote.ballots.length} votes.`);
    }
    for (const x of h.sabotage || []) notes.push(`${esc(teamName(x.by, true))} sabotaged ${esc(teamName(x.on))}${where(x.stretch)}${
      x.caught ? ' and were caught' : x.backfired ? ', and it backfired' : ' and got away with it'}.`);
    for (const f of h.fears || []) if (f.racer) notes.push(`${esc(f.racer)} ${esc(fearWords(f.kind, f.ending))}${where(f.stretch)}.`);
    for (const x of h.hurt || []) if (x.racer) notes.push(`${esc(x.racer)} ${esc(hurtWords(x.kind, x.ending))}.`);
    if (h.onLocation?.length) notes.push(`${esc(andList(h.onLocation.map(t => teamName(t))).replace(/^./, c => c.toUpperCase()))} ${h.onLocation.length > 1 ? 'were' : 'was'} eliminated on location.`);
    return `<section class="rrw-leg" id="wk-leg-${h.leg}">
      <h3>${h.isFinal ? 'Final leg' : `Leg ${h.leg}`} · ${esc(h.place || '')} ${tags}</h3>
      ${route.length ? `<p class="rrw-route">${route.map(r => esc(cap(r.name))).join(' → ')}</p>` : ''}
      ${ch.length ? `<div class="wk-scroll"><table class="wk-table"><thead><tr><th>Challenge</th><th>Type</th><th>How it went</th></tr></thead>
        <tbody>${ch.map(c => `<tr><td><b>${esc(cap(c.name))}</b></td><td class="rrw-kind">${esc(KIND[c.kind] || '')}</td><td>${howItWent(c)}</td></tr>`).join('')}</tbody></table></div>` : ''}
      ${rows ? `<div class="wk-scroll"><table class="wk-table"><thead><tr><th>#</th><th>Team</th><th>Checked in</th><th>Behind</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table></div>` : ''}
      ${notes.length ? `<ul class="wk-list">${notes.map(n => `<li>${n}</li>`).join('')}</ul>` : ''}
    </section>`;
  };

  // ── trivia, worked out from the record ──
  const trivia = [];
  const first = legs[0]?.order?.[0];
  if (first) {
    const t = teams.find(x => x.team === first.team);
    const x = t && exitOf.get(t.team);
    if (t) trivia.push(t.status === 'Winner' ? `${esc(teamName(first.team, true))} won the first leg and the race.`
      : x && !x.isFinal ? `${esc(teamName(first.team, true))} won the first leg and went home on Leg ${x.leg}.`
        : `${esc(teamName(first.team, true))} won the first leg and made it to the final.`);
  }
  if (winners) {
    const ps = legs.map(h => ({ leg: h.leg, place: h.order?.find(o => o.team === winners.team)?.place })).filter(x => x.place);
    const worst = Math.max(...ps.map(x => x.place));
    if (worst >= Math.ceil(teams.length / 2)) {
      const at = ps.filter(x => x.place === worst).map(x => x.leg);
      trivia.push(`${esc(teamName(winners.team, true))} won the race despite finishing ${ordinal(worst)} on Leg${at.length > 1 ? 's' : ''} ${andList(at.map(String))}.`);
    }
    const w = legsWon(winners);
    if (w === 0) trivia.push(`${esc(teamName(winners.team, true))} won the race without winning a single leg before the final.`);
  }
  let close = null, far = null;
  for (const h of legs) {
    const o = (h.order || []).filter(x => x.time != null).sort((a, b) => a.time - b.time);
    for (let i = 1; i < o.length; i++) {
      const g = o[i].time - o[i - 1].time;
      if (!close || g < close.g) close = { g, a: o[i - 1].team, b: o[i].team, leg: h };
    }
    if (o.length > 1 && (!far || o[1].time - o[0].time > far.g)) far = { g: o[1].time - o[0].time, a: o[0].team, leg: h };
  }
  if (close) trivia.push(`The closest check-in of the season was on ${close.leg.isFinal ? 'the final leg' : `Leg ${close.leg.leg}`}, where ${esc(teamName(close.a))} beat ${esc(teamName(close.b))} to the Chill Zone by ${esc(minutesWords(close.g))}.`);
  if (far && far.g >= 30) trivia.push(`The biggest lead of the season came on ${far.leg.isFinal ? 'the final leg' : `Leg ${far.leg.leg}`}, when ${esc(teamName(far.a))} checked in ${esc(minutesWords(far.g))} ahead of the next team.`);
  for (let i = 0; i + 1 < legs.length; i++) {
    const won = legs[i].order?.[0]?.team;
    const nx = exitOf.get(won);
    if (won && nx && nx.leg === legs[i + 1].leg && !nx.isFinal) trivia.push(`${esc(teamName(won, true))} won Leg ${legs[i].leg} and went home on the very next leg.`);
  }
  let tries = null;
  for (const h of legs) for (const c of h.challenges || []) for (const r of c.runs || []) if (!tries || r.attempts > tries.r.attempts) tries = { r, c, h };
  if (tries && tries.r.attempts >= 4) trivia.push(`The most tries anybody needed at one challenge was ${count(tries.r.attempts)}, by ${esc(teamName(tries.r.team))} at ${esc(tries.c.name)} on ${tries.h.isFinal ? 'the final leg' : `Leg ${tries.h.leg}`}.`);
  const booms = legs.flatMap(h => (h.passes || []).filter(p => p.pass === 'boomerang' && !p.wasted).map(p => p.on))
    .concat(legs.map(h => h.boomerangVote?.target).filter(Boolean));
  if (booms.length) trivia.push(`${cap(count(booms.length))} Boomerang${booms.length === 1 ? ' was' : 's were'} thrown this season.`);
  const fears = legs.flatMap(h => h.fears || []);
  if (fears.length) {
    const beat = fears.filter(f => ['overcomes', 'talked-down', 'panic-break', 'relents'].includes(f.ending)).length;
    trivia.push(`Racers faced their fears ${fears.length} times and got through ${beat} of them.`);
  }
  if (nonElims) trivia.push(`${cap(count(nonElims))} of the ${count(nLegs)} legs were non-elimination legs.`);

  // ── the infobox ──
  const facts = [
    ['Show', esc(showName(s.format))],
    ['Teams', `${teams.length} (${placements.length} racers)`],
    ['Legs', `${nLegs}${nonElims ? ` (${nonElims} non-elimination)` : ''}`],
    start ? ['Start', esc(start)] : null,
    end ? ['Finish', esc(end)] : null,
    winners ? ['Winners', `${esc(winners.team)}<br><small>${winners.members.map(link).join(' &amp; ')}</small>`] : null,
    runnersUp[0] ? ['Runners-up', `${esc(runnersUp[0].team)}<br><small>${runnersUp[0].members.map(link).join(' &amp; ')}</small>`] : null,
    ['Host', 'Don'],
  ].filter(Boolean);
  const infobox = `<aside class="wk-infobox"><div class="wk-ib-title">${esc(s.title || showName(s.format))}</div>
    <div class="wk-ib-show">${esc(showName(s.format))}</div>
    <table class="wk-ib-table">${facts.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</table></aside>`;

  const body = `${lead}
    ${sec('Teams', teamTable, `${teams.length} · winners first`)}
    ${sec('Race summary', summary, 'every team’s place on every leg')}
    ${sec('Legs', legs.map(legBlock).join(''), `${nLegs}`)}
    ${sec('Trivia', trivia.length ? `<ul class="wk-list">${trivia.map(t => `<li>${t}</li>`).join('')}</ul>` : '')}`;
  const contents = toc.length > 2 ? `<nav class="wk-contents"><b>Contents</b><ol>${toc.map(([id, t]) =>
    `<li><a href="#${id}">${esc(t)}</a>${id === 'wk-legs' ? `<ol>${legs.map(h => `<li><a href="#wk-leg-${h.leg}">${h.isFinal ? 'Final' : `Leg ${h.leg}`}: ${esc(h.place || '')}</a></li>`).join('')}</ol>` : ''}</li>`).join('')}</ol></nav>` : '';
  const castPhoto = (seasonRow && seasonRow.castPhotoPath) || s.castPhotoPath || '';
  const hero = castPhoto ? `<figure class="wk-castphoto"><img src="${esc(castPhoto)}" alt="The cast of ${esc(s.title || '')}" loading="lazy"
    onerror="this.closest('figure').remove()"></figure>` : '';
  return `<style>${RACE_WIKI_CSS}</style><article class="wk-article">${infobox}<div class="wk-main">${hero}${contents}${body}</div></article>`;
}
