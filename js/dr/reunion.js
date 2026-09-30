// ══════════════════════════════════════════════════════════════════════
// js/dr/reunion.js — the season, talked through by the people who lived it
// ══════════════════════════════════════════════════════════════════════
//
// AFTER THE FINALE (the user's call: it was superficial, eight cards, and it
// sat before the crowning). The winner sits in her crown and the reunion
// goes through the whole season: the numbers, a hot seat for every queen in
// the order they went home, the feuds had out loud, the friendships and the
// romance, the calls people still argue about, the awards, the winner a week
// later, and the sign-off.
//
// EVERY FACT IS THE SEASON'S. The episode, the song, the challenge, the look
// a line mentions are read off the aired rows; nothing is invented, and a
// quiet season gets a shorter reunion. And it changes the room: a feud aired
// cools or hardens, a friendship named is stronger, a robbed queen gains the
// audience — no cosmetic scenes.

import { REUNION_LINES } from './data/reunion-beats.js';
import { arcSummary, popSnapshot } from './storylines.js';
import { recordStrength } from './season.js';

const pickLine = (lines, rng, used, key) => {
  if (!lines || !lines.length) return '';
  const fresh = lines.filter(l => !used.has(key + ' ' + l));
  const pool = fresh.length ? fresh : lines;
  const chosen = pool[Math.floor(rng() * pool.length)];
  used.add(key + ' ' + chosen);
  return chosen;
};

/* Numbers spoken as words, the way people say them on a sofa: "three
   times", not "3 times". `cap` capitalises one that starts a sentence. */
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const spoken = (n, cap = false) => {
  const w = WORDS[n] ?? String(n);
  return cap ? w[0].toUpperCase() + w.slice(1) : w;
};
const fill = (line, subs = {}) => String(line || '').replace(/\{(\w+)\}/g, (m, k) => (subs[k] != null ? String(subs[k]) : m));

/**
 * The arguments this season actually produced (kept for the readers that
 * already use it — the chart, the tests). `{ kind, players, data }`.
 */
export function reunionTopics({ cast, record, bond, rows, congeniality = null }) {
  const topics = [];
  const rec = n => record?.[n] || [];
  let worst = null;
  for (let i = 0; i < cast.length; i++) {
    for (let j = i + 1; j < cast.length; j++) {
      const a = cast[i]; const b = cast[j];
      const v = bond(a, b);
      const shared = rows.reduce((n, row) => n + (row.dr?.scenes || []).filter(sc => {
        const p = sc.data?.players || [];
        return p.includes(a) && p.includes(b);
      }).length, 0);
      if (v <= -3 && shared > 0 && (!worst || v < worst.bond)) worst = { a, b, bond: v, shared };
    }
  }
  if (worst) topics.push({ kind: 'feud', players: [worst.a, worst.b], data: worst });
  const exits = [];
  for (const row of rows) {
    for (const x of row.exits || []) {
      const name = typeof x === 'string' ? x : x?.name;
      if (name) exits.push({ name, episode: row.num || 0 });
    }
  }
  const shock = exits.filter(x => recordStrength(rec(x.name)) > 0.2)
    .sort((p, q) => recordStrength(rec(q.name)) - recordStrength(rec(p.name)))[0];
  if (shock) {
    topics.push({ kind: 'shock-exit', players: [shock.name],
      data: { ...shock, strength: Math.round(recordStrength(rec(shock.name)) * 100) / 100 } });
  }
  const safest = cast.map(n => ({ n, safes: rec(n).filter(r => r === 'SAFE').length, len: rec(n).length }))
    .filter(x => x.len >= 4 && x.safes / x.len >= 0.5).sort((p, q) => q.safes - p.safes)[0];
  if (safest) topics.push({ kind: 'the-invisible', players: [safest.n], data: safest });
  let best = null;
  for (let i = 0; i < cast.length; i++) {
    for (let j = i + 1; j < cast.length; j++) {
      const v = bond(cast[i], cast[j]);
      if (v >= 6 && (!best || v > best.bond)) best = { a: cast[i], b: cast[j], bond: v };
    }
  }
  if (best) topics.push({ kind: 'the-friendship', players: [best.a, best.b], data: best });
  const top = [...cast].sort((p, q) => recordStrength(rec(q)) - recordStrength(rec(p)))[0];
  if (top && rec(top).filter(r => r === 'WIN').length >= 2) {
    topics.push({ kind: 'the-frontrunner', players: [top], data: { wins: rec(top).filter(r => r === 'WIN').length } });
  }
  if (congeniality) topics.push({ kind: 'congeniality', players: [congeniality], data: {} });
  return topics;
}

/** What the season did, read off the aired rows: the facts every segment quotes. */
function seasonFacts(state, bond) {
  const rows = (state.episodes || []).filter(r => r?.dr && !r.dr.reunion);
  const weeks = rows.filter(r => !r.dr.finale);
  const cast = [...(state.castOrder || [])];
  const rec = n => state.record?.[n] || [];

  const exits = [];
  for (const row of weeks) {
    const ls = row.dr.lipsync || null;
    for (const x of row.exits || []) {
      const name = typeof x === 'string' ? x : x?.name;
      if (!name) continue;
      const opp = (ls?.queens || []).find(q => q !== name) || null;
      exits.push({ name, ep: row.num, song: ls?.song || null, opp,
        robbed: !!(ls?.overruled && ls.loser === name), stayed: ls?.overruled && ls.loser === name ? ls.winner : null });
    }
  }
  const finRow = rows.find(r => r.dr.finale);
  const fin = finRow?.dr?.finale || {};
  const winners = fin.winners?.length ? fin.winners : state.winners?.length ? state.winners : [state.winner].filter(Boolean);
  const placements = fin.placements || [];
  const runnerUp = winners.length > 1 ? null : (state.runnerUp || placements[1] || null);

  const bestWin = n => {
    for (const row of weeks) if ((row.dr.call?.win || []).includes(n)) return { chal: row.dr.challenge?.name || 'that challenge', ep: row.num };
    return null;
  };
  const looks = [];
  for (const row of weeks) {
    const rw = row.dr.runway;
    if (!rw?.category) continue;
    for (const n of cast) if (rw[n] && Number.isFinite(rw[n].score)) looks.push({ n, score: rw[n].score, cat: rw.category, ep: row.num });
  }
  const bestLookOf = n => looks.filter(l => l.n === n).sort((a, b) => b.score - a.score)[0] || null;
  const lipsyncWins = n => (state.lipsyncRecord?.[n] || []).filter(r => r === 'W').length;
  const bottoms = n => rec(n).filter(r => r === 'BTM2' || r === 'ELIM' || r === 'BTM').length;
  const wins = n => rec(n).filter(r => r === 'WIN').length;
  const doubles = weeks.filter(r => r.dr.lipsync?.call === 'double-shantay')
    .map(r => ({ ep: r.num, song: r.dr.lipsync.song, queens: [...(r.dr.lipsync.queens || [])] }));

  // Pairs: bond and whether they ever shared a scene (a feud needs a history).
  const sharedEp = (a, b) => {
    for (const row of rows) {
      if ((row.dr.scenes || []).some(sc => { const p = sc.data?.players || []; return p.includes(a) && p.includes(b); })) return row.num;
    }
    return null;
  };
  const pairs = [];
  for (let i = 0; i < cast.length; i++) {
    for (let j = i + 1; j < cast.length; j++) pairs.push({ a: cast[i], b: cast[j], bond: bond(cast[i], cast[j]) });
  }
  const romances = (fin.romances || state.romances || []).filter(p => Array.isArray(p) && p.length === 2);
  return { rows, weeks, cast, exits, winners, runnerUp, placements, bestWin, looks, bestLookOf,
    lipsyncWins, bottoms, wins, doubles, pairs, sharedEp, romances, rec };
}

/**
 * The reunion episode. Eliminates nobody, changes no record, and carries
 * `dr.reunion` so a screen can tell it from a normal night.
 */
export function runReunion(state, cfg, ctx) {
  const { rng } = ctx;
  const bond = ctx.bond || (() => 0);
  const F = seasonFacts(state, bond);
  const w = F.winners[0] || state.winner || '';
  const used = new Set();
  const scenes = [{
    step: 'reunion', kind: 'reunion-open',
    data: { cast: F.cast, back: [...(state.out || [])], living: [...state.living], winners: [...F.winners] }, text: '',
  }];
  const segments = [];
  /* One card: `speaker` is host | queen | room | stat | award | segment. */
  const say = (seg, speaker, key, players = [], subs = {}, extra = {}) => {
    const text = key ? fill(pickLine(REUNION_LINES[key], rng, used, key), { w, cast: F.cast.length, a: players[0], b: players[1], ...subs }) : (extra.text || '');
    if (!text && speaker !== 'segment' && speaker !== 'stat' && speaker !== 'award') return;
    scenes.push({ step: 'reunion', kind: `reunion:${seg}`, data: { seg, speaker, players, key, ...extra }, text: text || extra.text || '' });
  };
  const header = (seg, title, sub = '', players = []) => {
    segments.push(seg);
    scenes.push({ step: 'reunion', kind: `reunion:${seg}`, data: { seg, speaker: 'segment', title, sub, players }, text: `${title}${sub ? ' — ' + sub : ''}` });
  };

  // ── 1. THE OPENING ──
  header('open', 'The Reunion', 'the whole season, back on one stage');
  say('open', 'host', 'open-host');
  say('open', 'room', 'open-room');

  // ── 2. THE SEASON IN NUMBERS ──
  header('numbers', 'The season in numbers');
  say('numbers', 'host', 'numbers-host');
  const byWins = [...F.cast].sort((a, b) => F.wins(b) - F.wins(a));
  if (F.wins(byWins[0]) > 0) say('numbers', 'stat', null, [byWins[0]], {}, { stat: 'Most challenge wins', value: F.wins(byWins[0]), text: `Most challenge wins: ${byWins[0]}, ${F.wins(byWins[0])}.` });
  const byBtm = [...F.cast].sort((a, b) => F.bottoms(b) - F.bottoms(a));
  if (F.bottoms(byBtm[0]) >= 2) {
    say('numbers', 'stat', null, [byBtm[0]], {}, { stat: 'Most times in the bottom', value: F.bottoms(byBtm[0]), text: `Most times in the bottom: ${byBtm[0]}, ${F.bottoms(byBtm[0])}.` });
    say('numbers', 'queen', 'numbers-most-btm', [byBtm[0]], { n: spoken(F.bottoms(byBtm[0])) });
  }
  if (F.exits[0]) say('numbers', 'stat', null, [F.exits[0].name], {}, { stat: 'First out', value: `episode ${F.exits[0].ep}`, text: `First out: ${F.exits[0].name}, episode ${F.exits[0].ep}.` });

  // ── 3. THE HOT SEAT, in the order they went home ──
  const reacted = new Set();
  const seatOf = (n, exit, i) => {
    header(`seat`, 'The hot seat', n, [n]);
    const first = i === 0 && exit;
    if (exit?.robbed) {
      say('seat', 'host', 'seat-robbed-host', [n, exit.stayed], { ep: exit.ep, song: exit.song || 'that song' });
      say('seat', 'queen', 'seat-robbed-answer', [n, exit.stayed], { ep: exit.ep, song: exit.song || 'that song' });
      say('seat', 'queen', 'robbed-stayed', [n, exit.stayed], {}, { speakerName: exit.stayed });
      say('seat', 'host', 'robbed-host-why', [n]);
      ctx.popDelta?.(n, 2);
    } else if (first) {
      say('seat', 'host', 'seat-first-host', [n], { ep: exit.ep, song: exit.song || 'your song' });
      say('seat', 'queen', 'seat-first-answer', [n]);
    } else if (exit) {
      say('seat', 'host', 'seat-exit-host', [n, exit.opp || 'her'], { ep: exit.ep, song: exit.song || 'your song' });
      say('seat', 'queen', 'seat-exit-answer', [n, exit.opp || 'she'], { song: exit.song || 'that song' });
    } else {
      say('seat', 'host', 'seat-finalist-host', [n]);
      say('seat', 'queen', 'seat-finalist-answer', [n]);
    }
    // Her high point: a win if she had one, or her best look.
    const win = F.bestWin(n);
    const look = F.bestLookOf(n);
    if (win) {
      say('seat', 'host', 'seat-high-host', [n], { chal: win.chal, ep: win.ep });
      say('seat', 'queen', 'seat-high-answer', [n]);
    } else if (look && look.score >= 6) {
      say('seat', 'host', 'seat-look-host', [n], { cat: look.cat, ep: look.ep });
      say('seat', 'queen', 'seat-look-answer', [n]);
    }
    // Someone on the sofa: her closest friend, or the queen who cannot stand her.
    const others = F.cast.filter(x => x !== n);
    const ally = others.map(x => ({ x, v: bond(n, x) })).filter(o => o.v >= 4).sort((p, q) => q.v - p.v)[0];
    const foe = others.map(x => ({ x, v: bond(n, x) })).filter(o => o.v <= -3).sort((p, q) => p.v - q.v)[0];
    const pick = ally && !reacted.has(`${n}|${ally.x}`) ? ['seat-ally', ally.x] : foe ? ['seat-shade', foe.x] : null;
    if (pick) {
      reacted.add(`${n}|${pick[1]}`);
      say('seat', 'queen', pick[0], [n, pick[1]], {}, { speakerName: pick[1] });
      ctx.addBond?.(n, pick[1], pick[0] === 'seat-ally' ? 1 : -1);
    }
  };
  const seated = new Set(F.winners);
  F.exits.forEach((x, i) => { if (!seated.has(x.name)) { seated.add(x.name); seatOf(x.name, x, i); } });
  // The finalists who did not win, last place first.
  for (const n of [...F.placements].reverse()) if (!seated.has(n)) { seated.add(n); seatOf(n, null, 99); }

  // ── 4. THE FEUDS ──
  const feuds = F.pairs.filter(p => p.bond <= -3).map(p => ({ ...p, ep: F.sharedEp(p.a, p.b) }))
    .filter(p => p.ep != null).sort((p, q) => p.bond - q.bond).slice(0, 2);
  if (feuds.length) header('feud', 'The feuds');
  for (const f of feuds) {
    const pr = [f.a, f.b];
    say('feud', 'host', 'feud-host', pr, { ep: f.ep });
    say('feud', 'queen', 'feud-a', pr);
    say('feud', 'queen', 'feud-b', pr, {}, { speakerName: f.b });
    say('feud', 'queen', 'feud-a2', pr);
    say('feud', 'host', 'feud-host2', pr);
    // It lands somewhere: the deeper the grudge, the less likely it cools.
    const cools = rng() < Math.max(0.2, 0.7 + f.bond * 0.05);
    say('feud', 'room', cools ? 'feud-cools' : 'feud-hardens', pr);
    ctx.addBond?.(f.a, f.b, cools ? 3 : -2);
  }

  // ── 5. THE BONDS ──
  const romanceKeys = new Set(F.romances.map(p => [...p].sort().join('|')));
  const friends = F.pairs.filter(p => p.bond >= 6 && !romanceKeys.has([p.a, p.b].sort().join('|')))
    .sort((p, q) => q.bond - p.bond).slice(0, 2);
  if (friends.length || F.romances.length) header('bonds', 'Friends, sisters and more');
  for (const p of friends) {
    say('bonds', 'host', 'friend-host', [p.a, p.b]);
    say('bonds', 'queen', 'friend-a', [p.a, p.b]);
    say('bonds', 'queen', 'friend-b', [p.a, p.b], {}, { speakerName: p.b });
    ctx.addBond?.(p.a, p.b, 1);
  }
  for (const [a, b] of F.romances.slice(0, 1)) {
    say('bonds', 'host', 'romance-host', [a, b]);
    say('bonds', 'queen', 'romance-a', [a, b]);
    say('bonds', 'queen', 'romance-b', [a, b], {}, { speakerName: b });
  }

  // ── 6. THE NIGHT NOBODY WENT HOME ──
  for (const d of F.doubles.slice(0, 1)) {
    header('double', 'Shantay, you both stay', `episode ${d.ep}`);
    say('double', 'host', 'double-host', d.queens, { ep: d.ep, song: d.song });
    say('double', 'queen', 'double-answer', d.queens);
  }

  // ── 7. THE AWARDS ──
  header('awards', 'The awards');
  say('awards', 'host', 'award-host');
  const assassin = [...F.cast].sort((a, b) => F.lipsyncWins(b) - F.lipsyncWins(a))[0];
  if (assassin && F.lipsyncWins(assassin) >= 2) {
    say('awards', 'award', null, [assassin], {}, { award: 'Lip Sync Assassin', detail: `${F.lipsyncWins(assassin)} lip syncs won`, text: `Lip Sync Assassin of the season: ${assassin}, ${F.lipsyncWins(assassin)} lip syncs won.` });
    say('awards', 'queen', 'award-assassin', [assassin]);
    ctx.popDelta?.(assassin, 1);
  }
  const sortedLooks = [...F.looks].sort((a, b) => b.score - a.score);
  const bestLook = sortedLooks[0];
  const worstLook = sortedLooks[sortedLooks.length - 1];
  if (bestLook) {
    say('awards', 'award', null, [bestLook.n], {}, { award: 'Best Look of the Season', detail: `${bestLook.cat}, episode ${bestLook.ep}`, text: `Best Look of the Season: ${bestLook.n}, for ${bestLook.cat} (episode ${bestLook.ep}).` });
    say('awards', 'queen', 'award-look', [bestLook.n]);
  }
  if (worstLook && worstLook !== bestLook) {
    say('awards', 'award', null, [worstLook.n], {}, { award: 'The Golden Boot', detail: `${worstLook.cat}, episode ${worstLook.ep}`, boot: true, text: `The Golden Boot, for the worst look of the season: ${worstLook.n}, for ${worstLook.cat} (episode ${worstLook.ep}).` });
    say('awards', 'queen', 'award-boot', [worstLook.n]);
    ctx.popDelta?.(worstLook.n, 1);   // a good sport about it is endearing
  }
  if (state.congeniality) {
    say('awards', 'award', null, [state.congeniality], {}, { award: 'Miss Congeniality', detail: 'voted by the fans', text: `Miss Congeniality: ${state.congeniality}.` });
    say('awards', 'queen', 'award-congeniality', [state.congeniality]);
  }

  // ── 8. THE WINNER, A WEEK LATER ──
  if (w) {
    header('winner', F.winners.length > 1 ? 'The winners' : 'The winner', F.winners.join(' & '), [...F.winners]);
    say('winner', 'host', 'winner-host', [w]);
    say('winner', 'queen', 'winner-answer', [w], {}, { speakerName: w });
    // Her season too: which of her wins meant the most.
    const wWin = F.bestWin(w);
    if (wWin && F.wins(w) >= 1) {
      say('winner', 'host', 'winner-journey-host', [w], { n: spoken(F.wins(w)) });
      say('winner', 'queen', 'winner-journey-answer', [w], { chal: wWin.chal }, { speakerName: w });
    }
    if (F.winners.length > 1) say('winner', 'queen', 'winners-double', [F.winners[1]], { w: F.winners[1] }, { speakerName: F.winners[1] });
    if (F.runnerUp) {
      say('winner', 'host', 'winner-runnerup-host', [F.runnerUp]);
      say('winner', 'queen', 'winner-runnerup-answer', [F.runnerUp]);
    }
  }

  // ── 9. THE CLOSE ──
  header('close', 'Goodnight');
  say('close', 'host', 'close-host');

  const topics = reunionTopics({
    cast: F.cast, record: state.record, bond, rows: F.rows,
    congeniality: state.congeniality || null,
  });
  const row = {
    num: cfg.num,
    format: 'drag-race',
    eliminated: null,
    exits: [],
    twists: [],
    houseAtStart: [...state.living],
    airedEvents: [],
    dr: {
      ep: cfg.num,
      challenge: { id: 'reunion', name: 'The Reunion', format: 'solo', stage: 'main' },
      mini: null,
      judges: [],
      guest: null,
      reunion: { topics, cast: F.cast, segments, winners: [...F.winners] },
      popularity: popSnapshot(state),
      storylines: arcSummary(state.storylines || []),
      storylineNeed: {},
      record: JSON.parse(JSON.stringify(state.record)),
      living: [...state.living],
      scenes,
    },
  };
  state.episodes.push(row);
  return row;
}
