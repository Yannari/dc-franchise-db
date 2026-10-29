// ══════════════════════════════════════════════════════════════════════
// rr/awards.js — a Ridonculous Race season's awards, worked out from the record
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-23: "build the wiki and awards pages from it". The other shows' awards are written by a model
// after the season; a race has a clock, so most of what an award would argue is a number the leg records already
// hold: the legs won, the smallest margin a team escaped elimination by, the most tries at one task, the fears beaten.
// Each award names its winner, the number and one sentence saying what it was for, and an award nobody earned is
// left out rather than handed to whoever scored zero. PURE. `raceAwards(doc)` is the list; `raceAwardsHtml(doc)` is
// the awards page's body (season-awards_ref.html); `raceAwardsIndex(doc)` is the card the awards index reads.
import { avatarUrl } from '../avatar-registry.js';
import { RACE_FORMAT } from '../shows.js';
import {
  legsOf, teamName, cap, ordinal, count, minutesWords, andList, penaltyLabel, hurtWords, FEAR_BEATEN,
} from './record-words.js';

const legName = h => (h.isFinal ? 'the final leg' : `Leg ${h.leg}`);
const median = xs => { const s = xs.slice().sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** The season's awards, best first; each is { id, icon, title, kind, team, members, value, detail }. */
export function raceAwards(doc) {
  const legs = legsOf(doc);
  const teams = doc?.teams || [];
  const placeOf = new Map(teams.map(t => [t.team, t.placement || 99]));
  const people = new Map((doc?.placements || []).map(p => [p.name, p]));
  const teamOfRacer = n => teams.find(t => t.members.includes(n));
  const out = [];
  // the best of a scored list, ties to the team that finished higher; null when nobody scored
  const top = (rows, better = (a, b) => b.v - a.v) => {
    const r = rows.filter(x => x && x.v > 0).sort((a, b) => better(a, b) || (placeOf.get(a.team) || 99) - (placeOf.get(b.team) || 99));
    return r[0] ? { ...r[0], tied: r.filter(x => better(x, r[0]) === 0 && x !== r[0]) } : null;
  };
  const teamAward = (id, icon, title, w, detail) => w && out.push({ id, icon, title, kind: 'team', team: w.team,
    members: teams.find(t => t.team === w.team)?.members || [], value: w.v, detail });
  const racerAward = (id, icon, title, w, detail) => w && out.push({ id, icon, title, kind: 'racer', team: teamOfRacer(w.name)?.team || null,
    members: [w.name], value: w.v, detail });
  const tieNote = (w, say) => (w.tied?.length ? ` ${say(w.tied)}` : '');

  // ── Most Legs Won ──
  const wins = top(teams.map(t => ({ team: t.team, v: legs.filter(h => h.order?.[0]?.team === t.team).length })));
  teamAward('leg-wins', '🏁', 'Most Legs Won', wins, wins && `Won ${count(wins.v)} of the ${count(legs.length)} legs.${tieNote(wins,
    tied => `${cap(andList(tied.map(x => teamName(x.team))))} won as many legs but finished lower.`)}`);

  // ── Most Consistent: the best average place, over at least half the race ──
  const enough = Math.ceil(legs.length / 2);
  const avg = top(teams.map(t => {
    const ps = legs.map(h => h.order?.find(o => o.team === t.team)?.place).filter(Number.isFinite);
    return ps.length >= enough ? { team: t.team, v: Math.round(ps.reduce((a, b) => a + b, 0) / ps.length * 10) / 10, n: ps.length, worst: Math.max(...ps) } : null;
  }), (a, b) => a.v - b.v);
  teamAward('consistent', '📈', 'Most Consistent', avg, avg && `An average place of ${avg.v} across ${count(avg.n)} legs, and never lower than ${ordinal(avg.worst)}.`);

  // ── Biggest Comeback: the most places made up from one leg to the next ──
  const jumps = [];
  for (const t of teams) for (let i = 1; i < legs.length; i++) {
    const a = legs[i - 1].order?.find(o => o.team === t.team), b = legs[i].order?.find(o => o.team === t.team);
    if (a && b && a.place - b.place >= 3) jumps.push({ team: t.team, v: a.place - b.place, from: a.place, to: b.place, h0: legs[i - 1], h1: legs[i] });
  }
  const jump = top(jumps);
  teamAward('comeback', '🔄', 'Biggest Comeback', jump, jump && `Went from ${ordinal(jump.from)} on ${legName(jump.h0)} to ${
    jump.to === 1 ? 'winning' : ordinal(jump.to) + ' on'} ${legName(jump.h1)}.`);

  // ── Nine Lives: last at a mat and still in the race ──
  const lives = top(teams.map(t => {
    const at = legs.filter(h => {
      const o = h.order?.find(x => x.team === t.team);
      if (!o || h.isFinal) return false;
      const gone = (h.exits || []).some(x => t.members.includes(x.name));
      return !gone && (h.saved === t.team || (h.nonElimination && o.place === Math.max(...h.order.map(x => x.place))));
    });
    return { team: t.team, v: at.length, at };
  }));
  teamAward('nine-lives', '🛟', 'Nine Lives', lives, lives && `Came in last on ${lives.at.length > 1 ? 'Legs' : 'Leg'} ${andList(lives.at.map(h => String(h.leg)))} and stayed in the race.`);

  // ── Closest Escape: the smallest margin a team beat the eliminated team by ──
  let esc = null;
  for (const h of legs) {
    if (h.isFinal || h.nonElimination || !(h.exits || []).length) continue;
    const gone = h.order?.find(o => h.exits.some(x => o.members.includes(x.name)));
    const above = gone && h.order.find(o => o.place === gone.place - 1);
    if (gone?.time == null || above?.time == null) continue;
    const m = gone.time - above.time;
    if (!esc || m < esc.v) esc = { team: above.team, v: m, h, gone: gone.team };
  }
  if (esc) out.push({ id: 'closest-escape', icon: '⏱️', title: 'Closest Escape', kind: 'team', team: esc.team,
    members: teams.find(t => t.team === esc.team)?.members || [], value: esc.v,
    detail: `Beat ${teamName(esc.gone)} to the Chill Zone by ${minutesWords(esc.v)} on ${legName(esc.h)} in ${esc.h.place}, and sent them home.` });

  // ── Biggest Lead ──
  const leads = legs.map(h => {
    const o = (h.order || []).filter(x => x.time != null).sort((a, b) => a.time - b.time);
    return o.length > 1 ? { team: o[0].team, v: o[1].time - o[0].time, h, next: o[1].team } : null;
  });
  const lead = top(leads);
  teamAward('biggest-lead', '🚀', 'Biggest Lead', lead, lead && `Checked in ${minutesWords(lead.v)} ahead of ${teamName(lead.next)} on ${legName(lead.h)} in ${lead.h.place}.`);

  // ── Most Penalty Time ──
  const pen = top(teams.map(t => {
    const rows = legs.map(h => h.order?.find(o => o.team === t.team)).filter(o => o?.penalty);
    const why = {};
    for (const o of rows) for (const r of o.penaltyReasons || []) why[penaltyLabel(r.reason)] = (why[penaltyLabel(r.reason)] || 0) + r.minutes;
    const main = Object.entries(why).sort((a, b) => b[1] - a[1])[0]?.[0];
    return { team: t.team, v: rows.reduce((a, o) => a + o.penalty, 0), n: rows.length, main };
  }));
  teamAward('penalty-time', '⛔', 'Most Penalty Time', pen, pen && `Served ${minutesWords(pen.v)} of penalties over ${count(pen.n)} leg${pen.n === 1 ? '' : 's'}${
    pen.main ? `, most of it for ${pen.main}` : ''}.`);

  // ── Dirtiest Racers: the most sabotage ──
  const sab = top(teams.map(t => {
    const did = legs.flatMap(h => (h.sabotage || []).filter(x => x.by === t.team));
    return { team: t.team, v: did.length, caught: did.filter(x => x.caught).length };
  }));
  teamAward('saboteurs', '😈', 'Dirtiest Racers', sab, sab && `Sabotaged other teams ${sab.v === 1 ? 'once' : `${count(sab.v)} times`}${
    sab.caught ? ` and were caught ${sab.caught === 1 ? 'once' : `${count(sab.caught)} times`}` : ' and were never caught'}.`);

  // ── Most Targeted: Boomerangs, Yields and sabotage aimed at them ──
  const hit = top(teams.map(t => {
    const b = legs.reduce((a, h) => a + (h.passes || []).filter(p => p.pass === 'boomerang' && !p.wasted && p.on === t.team).length + (h.boomerangVote?.target === t.team ? 1 : 0), 0);
    const y = legs.reduce((a, h) => a + (h.passes || []).filter(p => p.pass === 'yield' && p.on === t.team).length, 0);
    const s = legs.reduce((a, h) => a + (h.sabotage || []).filter(x => x.on === t.team).length, 0);
    return { team: t.team, v: b + y + s, b, y, s };
  }));
  if (hit && hit.v >= 2) teamAward('most-targeted', '🎯', 'Most Targeted', hit, `Hit by ${andList([
    hit.b ? `${count(hit.b)} Boomerang${hit.b === 1 ? '' : 's'}` : '', hit.y ? `${count(hit.y)} Yield${hit.y === 1 ? '' : 's'}` : '',
    hit.s ? `${count(hit.s)} act${hit.s === 1 ? '' : 's'} of sabotage` : ''].filter(Boolean))}.`);

  // ── racer awards ──
  const fears = {}, hurt = {}, solo = {};
  for (const h of legs) {
    for (const f of h.fears || []) if (f.racer) { const x = (fears[f.racer] ||= { faced: 0, beat: 0 }); x.faced++; if (FEAR_BEATEN.has(f.ending)) x.beat++; }
    for (const x of h.hurt || []) if (x.racer) (hurt[x.racer] ||= []).push(hurtWords(x.kind, x.ending));
    for (const c of h.challenges || []) for (const r of c.runs || []) if (r.by?.length === 1 && r.members?.length === 2) solo[r.by[0]] = (solo[r.by[0]] || 0) + 1;
  }
  const racerTop = (rows, better = (a, b) => b.v - a.v) => {
    const r = rows.filter(x => x.v > 0).map(x => ({ ...x, team: teamOfRacer(x.name)?.team }))
      .sort((a, b) => better(a, b) || (placeOf.get(a.team) || 99) - (placeOf.get(b.team) || 99) || a.name.localeCompare(b.name));
    return r[0] || null;
  };
  const brave = racerTop(Object.entries(fears).map(([name, x]) => ({ name, v: x.beat, faced: x.faced })), (a, b) => b.v - a.v || b.faced - a.faced);
  racerAward('fearless', '🦁', 'Fearless', brave, brave && `Faced ${count(brave.faced)} fear${brave.faced === 1 ? '' : 's'} and got through ${
    brave.v === brave.faced ? (brave.v === 1 ? 'it' : `all ${count(brave.v)}`) : count(brave.v)}.`);
  const work = racerTop(Object.entries(solo).map(([name, v]) => ({ name, v })));
  racerAward('workhorse', '💪', 'Workhorse', work, work && `Took on ${count(work.v)} task${work.v === 1 ? '' : 's'} alone for ${teamName(work.team)}, more than anyone else in the race.`);
  const tough = racerTop(Object.entries(hurt).map(([name, xs]) => ({ name, v: xs.length, xs })));
  racerAward('toughest', '🩹', 'Toughest Racer', tough, tough && `${cap(andList([...new Set(tough.xs)]))}${tough.v > 1 ? `, ${count(tough.v)} times in all,` : ''} and ${
    people.get(tough.name)?.status === 'Medical' ? 'raced until the doctors stopped it' : 'kept racing'}.`);

  // ── Never Gave Up: the most tries at one task, finished ──
  let stub = null;
  for (const h of legs) for (const c of h.challenges || []) for (const r of c.runs || []) {
    if (!r.quit && r.attempts >= 3 && (!stub || r.attempts > stub.v)) stub = { v: r.attempts, r, c, h };
  }
  if (stub) out.push({ id: 'never-gave-up', icon: '🔁', title: 'Never Gave Up', kind: stub.r.by.length === 1 ? 'racer' : 'team', team: stub.r.team,
    members: stub.r.by, value: stub.v, detail: `Took ${count(stub.v)} tries at ${stub.c.name} on ${legName(stub.h)}, and finished it.` });

  // ── Fastest Run: the furthest under the field at one task ──
  let fast = null;
  for (const h of legs) for (const c of h.challenges || []) {
    const groups = c.sides?.length ? c.sides.map(sd => c.runs.filter(r => r.side === sd.id)) : [c.runs || []];
    for (const g of groups) {
      const done = g.filter(r => !r.quit && r.minutes > 0);
      if (done.length < 4) continue;
      const mid = median(done.map(r => r.minutes));
      for (const r of done) if (mid - r.minutes >= 5 && (!fast || mid - r.minutes > fast.v)) fast = { v: Math.round(mid - r.minutes), r, c, h, mid: Math.round(mid) };
    }
  }
  if (fast) out.push({ id: 'fastest-run', icon: '⚡', title: 'Fastest Run', kind: fast.r.by.length === 1 ? 'racer' : 'team', team: fast.r.team,
    members: fast.r.by, value: fast.v, detail: `Finished ${fast.c.name}${fast.r.sideName ? ` (${fast.r.sideName})` : ''} in ${minutesWords(fast.r.minutes)} on ${legName(fast.h)}, when a typical team took ${minutesWords(fast.mid)}.` });

  // ── Fan Favourite ──
  const fan = racerTop((doc?.placements || []).map(p => ({ name: p.name, v: Number(p.popularity) || 0 })));
  racerAward('fan-favourite', '⭐', 'Fan Favourite', fan, fan && `Ended the race as the season's most popular racer, racing with ${
    people.get(fan.name)?.partner || 'a partner'}.`);

  // ── Biggest Villain: the top of the season's villain board (js/villain-score.js), with its first piece of evidence ──
  const vb = doc?.villainBoard?.board?.[0];
  if (vb && vb.score > 0 && people.has(vb.name)) {
    racerAward('villain', '😈', 'Biggest Villain', { name: vb.name, v: vb.score },
      vb.evidence?.[0] || `Did more to the other teams than anybody else in the race.`);
  }
  return out;
}

/** The card the awards index (awards.html) reads off seasons_database.json. */
export function raceAwardsIndex(doc) {
  const list = raceAwards(doc);
  const legs = list.find(a => a.id === 'leg-wins');
  const fan = list.find(a => a.id === 'fan-favourite');
  const slugOf = n => doc.placements?.find(p => p.name === n)?.playerSlug || null;
  return {
    ...(legs ? { mostChallengeWins: { name: legs.team, playerSlug: slugOf(legs.members[0]), detail: `${legs.value} leg${legs.value === 1 ? '' : 's'}` } } : {}),
    ...(fan ? { fanFavorite: { name: fan.members[0], playerSlug: slugOf(fan.members[0]) } } : {}),
  };
}

/** The awards page's body for a race season: the winners, every award, and the leaderboards. */
export function raceAwardsHtml(doc) {
  const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const byName = new Map((doc?.placements || []).map(p => [p.name, p]));
  const face = (n, size = 40, cls = 'aw-avatar') => {
    const p = byName.get(n);
    const src = avatarUrl({ playerSlug: p?.playerSlug || String(n).toLowerCase().replace(/[^a-z0-9]+/g, '-'), avatarId: p?.avatarId,
      avatarFile: p?.avatarFile, show: RACE_FORMAT });
    return `<img class="${cls}" style="width:${size}px;height:${size}px" src="${esc(src)}" alt="" onerror="this.style.display='none'">`;
  };
  const link = n => {
    const p = byName.get(n);
    return p?.playerSlug ? `<a href="player.html?player=${esc(p.playerSlug)}" style="color:inherit;text-decoration:none">${esc(n)}</a>` : esc(n);
  };
  const legs = legsOf(doc);
  const teams = doc?.teams || [];
  const win = teams.find(t => t.status === 'Winner');
  const finalOrder = doc?.final?.order || [];
  const runner = finalOrder.find(o => o.team !== win?.team);
  const margin = finalOrder[1]?.time != null && finalOrder[0]?.time != null ? finalOrder[1].time - finalOrder[0].time : null;
  const legWins = t => legs.filter(h => h.order?.[0]?.team === t.team).length;

  const spotlight = win ? `<div class="sa-winner">
    <div class="sa-winner-lbl">👑 Season Winners</div>
    <div class="sa-winner-row">
      <div class="sa-winner-av rra-pair">${win.members.map(n => face(n, 64, 'rra-face')).join('')}</div>
      <div class="sa-winner-info">
        <div class="sa-winner-name">${esc(win.team)}</div>
        <div class="sa-winner-vote">${win.members.map(link).join(' &amp; ')}</div>
        <div class="sa-winner-desc">${esc(cap(teamName(win.team)))} won ${count(legWins(win))} of the ${count(legs.length)} legs${
          runner && margin != null ? ` and crossed the final line ${esc(minutesWords(margin))} ahead of ${esc(teamName(runner.team))}` : ''}.</div>
      </div>
    </div>
  </div>` : '';

  const card = a => `<div class="aw-card">
    <div class="aw-card-label"><span class="aw-icon">${a.icon}</span>${esc(a.title)}</div>
    <div class="aw-player">${a.members.map(n => face(n)).join('')}<div class="aw-name">${a.kind === 'team' && a.team
      ? esc(a.team) : a.members.map(link).join(' &amp; ')}</div></div>
    ${a.kind === 'team' && a.team ? `<div class="aw-sub">${a.members.map(link).join(' &amp; ')}</div>`
      : a.team ? `<div class="aw-sub">${esc(a.team)}</div>` : ''}
    <div class="aw-desc">${esc(a.detail)}</div>
  </div>`;
  const list = raceAwards(doc);
  const teamCards = list.filter(a => a.kind === 'team' && !['never-gave-up', 'fastest-run'].includes(a.id));
  const racerCards = list.filter(a => !teamCards.includes(a));

  // the leaderboards, racer by racer
  const rows = (doc?.placements || []).map(p => ({ name: p.name, ...(p.rr || {}) }));
  // an average needs half the race behind it, or a team out on Leg 2 after a win leads the board
  const enough = Math.ceil(legs.length / 2);
  const board = (title, key, fmt = v => v, asc = false) => {
    const r = rows.filter(x => Number.isFinite(x[key]) && (asc ? (x.legPlaces?.length || 0) >= enough : x[key] > 0))
      .sort((a, b) => (asc ? a[key] - b[key] : b[key] - a[key]) || a.name.localeCompare(b.name)).slice(0, 5);
    if (!r.length) return '';
    return `<div class="stat-lb"><div class="stat-lb-head">${title}</div>${r.map((x, i) => `<div class="stat-lb-row">
      <span class="stat-lb-rank">${i < 3 ? ['🥇', '🥈', '🥉'][i] : `<span style="font-size:12px;color:var(--muted);font-weight:700">${i + 1}</span>`}</span>
      ${face(x.name, 28, 'stat-lb-av')}<div class="stat-lb-name">${link(x.name)}</div><div class="stat-lb-val">${esc(fmt(x[key]))}</div></div>`).join('')}</div>`;
  };
  const boards = [
    board('🏁 Legs won', 'legWins'),
    board('📈 Best average place', 'averagePlace', v => v, true),
    board('💪 Tasks done alone', 'solo'),
    board('🦁 Fears beaten', 'fearsBeaten'),
    board('🔁 Failed tries', 'fails'),
    board('⛔ Legs with a penalty', 'penaltyLegs'),
  ].join('');

  return `<style>.rra-pair{display:flex;gap:6px;width:auto!important;height:auto!important;background:none!important;border:0!important}
    .rra-pair .rra-face{border-radius:50%;object-fit:cover;border:2px solid rgba(242,183,5,.6)}
    .aw-player img + img{margin-left:-10px}</style>
    ${spotlight}
    ${teamCards.length ? `<div class="sa-section-heading">🏁 Team Awards</div><div class="award-grid">${teamCards.map(card).join('')}</div>` : ''}
    ${racerCards.length ? `<div class="sa-section-heading">🏃 Racer Awards</div><div class="award-grid">${racerCards.map(card).join('')}</div>` : ''}
    ${boards ? `<div class="sa-section-heading">📊 Statistical Leaders</div><div class="stat-grid">${boards}</div>` : ''}`;
}
