// ══════════════════════════════════════════════════════════════════════
// js/dr/reunion.js — the season, talked through by the people who lived it
// ══════════════════════════════════════════════════════════════════════
//
// AFTER THE FINALE (the user's call: it was superficial, eight cards, and it
// sat before the crowning). The winner sits in her crown and the reunion
// goes through the whole season: the numbers, the first ones out together,
// a seat for every queen after them in the order they went home, the room
// asked who it feared, the feuds had out loud with the receipts, the
// friendships and the romance, the awards, the winner a week later, and the
// sign-off.
//
// EVERY FACT IS THE SEASON'S. The episode, the song, the challenge, the look
// a line mentions are read off the aired rows; nothing is invented, and a
// quiet season gets a shorter reunion. And it changes the room: a feud aired
// cools or hardens, a friendship named is stronger, a robbed queen gains the
// audience — no cosmetic scenes.

import { REUNION_LINES, RECEIPTS } from './data/reunion-beats.js';
import { arcSummary, popSnapshot } from './storylines.js';
import { recordStrength } from './season.js';

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
  // The song each finalist sang for the crown, the last one she sang.
  const crownSong = {};
  for (const sc of finRow?.dr?.scenes || []) {
    if (sc.kind === 'finale:crown-speech' && sc.data?.song) for (const n of sc.data.players || []) crownSong[n] = sc.data.song;
  }

  const winsOf = n => weeks.filter(row => (row.dr.call?.win || []).includes(n))
    .map(row => ({ chal: row.dr.challenge?.name || 'that challenge', ep: row.num }));
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
  // Who she beat in a lip sync and sent home: the sofa remembers.
  const sentHomeBy = n => exits.filter(x => x.opp === n).map(x => x.name);

  /* THE RECEIPTS: what happened between two queens, episode by episode, in
     the words somebody can say out loud (RECEIPTS in reunion-beats.js). */
  const receipts = [];
  for (const row of rows) {
    for (const e of row.dr.events || []) {
      const R = RECEIPTS[e.type || e.kind];
      const [x, y] = e.players || [];
      if (!R || !x || !y || !cast.includes(x) || !cast.includes(y)) continue;
      receipts.push({ ep: row.num, type: e.type || e.kind, from: x, to: y, heat: R.heat, said: !!R.said, by: R.by || null, pair: R.pair || null });
    }
  }

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
  return { rows, weeks, cast, exits, winners, runnerUp, placements, crownSong, winsOf, looks, bestLookOf,
    lipsyncWins, bottoms, wins, doubles, sentHomeBy, receipts, pairs, sharedEp, romances, rec };
}

/* A receipt as the host says it TO `who`: "you said in Untucked that Riot
   should go home". Null if `who` is not the one who did it (a `by` receipt
   is asked of the queen who did the thing, never of the queen it was done
   to). */
function receiptTo(r, who) {
  if (r.by) return r.from === who ? fill(r.by, { t: r.to }) : null;
  if (r.from !== who && r.to !== who) return null;
  return fill(r.pair, { t: r.from === who ? r.to : r.from });
}

/**
 * The reunion episode. Eliminates nobody, changes no record, and carries
 * `dr.reunion` so a screen can tell it from a normal night.
 *
 * NOT ONE SHAPE THIRTEEN TIMES. The first version sat every queen through
 * the same five lines and it read like a form (the user: "kinda
 * repetitive"). Now the early exits share one quick segment, as they do on
 * the show; each queen after that gets the seat her season earned — robbed,
 * the one with the receipts, the survivor, the frontrunner who fell, the one
 * we never saw, a finalist, or a plain exit — and what follows the first
 * answer is drawn from what she actually has (a reply from the queen who
 * beat her, a receipt, a win, a look, a voice from the sofa), in a
 * different order each time. The room gets asked questions it answers with
 * names. And no line is ever said twice in one reunion.
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
  const shuffle = arr => arr.map(x => [rng(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

  /* A LINE NOBODY HAS SAID YET. A queen's line is never reused: if the pool
     is dry the beat is dropped (returns false), so a big season gets fewer
     of a kind rather than the same one twice. The host may repeat a
     structural question — he is the host — but only once every line has
     been used. */
  const fresh = lines => (lines || []).filter(l => !used.has(l));
  const push = (seg, key, speaker, line, { who = null, players = [], subs = {}, extra = {} } = {}) => {
    used.add(line);
    const text = fill(line, { w, cast: F.cast.length, a: players[0], b: players[1], c: players[2], ...subs });
    scenes.push({ step: 'reunion', kind: `reunion:${seg}`,
      data: { seg, speaker, players, key, ...(who ? { speakerName: who } : {}), ...extra }, text });
    return true;
  };
  const any = arr => arr[Math.floor(rng() * arr.length)];
  /* `keys` may be several pools drawn as one (a receipt that was words adds
     the lines only words can answer). */
  const say = (seg, key, { speaker = 'queen', also = [], ...o } = {}) => {
    const lines = [key, ...also].flatMap(k => REUNION_LINES[k] || []);
    const f = fresh(lines);
    if (!f.length && speaker !== 'host') return false;
    const pool = f.length ? f : lines;
    if (!pool.length) return false;
    return push(seg, key, speaker, any(pool), o);
  };
  const has = (...keys) => fresh(keys.flatMap(k => REUNION_LINES[k] || [])).length > 0;
  /* A HOST QUESTION ONLY WITH AN ANSWER LEFT TO GIVE IT. Twice in one
     reunion the host raised a receipt and nobody replied, because the
     answer pool had run dry and the question had already been said. */
  const ask = (seg, hostKey, answerKey, o = {}, ao = {}) => {
    if (!has(answerKey)) return false;
    say(seg, hostKey, { speaker: 'host', ...o });
    return say(seg, answerKey, { ...o, ...ao });
  };
  /* QUESTION AND ANSWER AS ONE ITEM ({ q, a: [...] }): the answer is written
     for that question, so it always answers it. */
  const qa = (seg, key, o = {}) => {
    const items = (REUNION_LINES[key] || []).filter(it => fresh(it.a).length);
    if (!items.length) return false;
    const pool = items.filter(it => !used.has(it.q));
    const it = any(pool.length ? pool : items);
    push(seg, key, 'host', it.q, o);
    return push(seg, key, 'queen', any(fresh(it.a)), o);
  };
  /* A REPLY WRITTEN FOR ITS LINE ({ a, b: [...] }): she answers, the other
     queen answers what she said. */
  const exchange = (seg, keys, o = {}) => {
    const items = keys.flatMap(k => REUNION_LINES[k] || []).filter(it => !used.has(it.a) && fresh(it.b).length);
    if (!items.length) return false;
    const it = any(items);
    push(seg, keys[0], 'queen', it.a, o);
    return push(seg, keys[0], 'queen', any(fresh(it.b)), { ...o, who: o.players?.[1] });
  };
  const plate = (seg, speaker, players, extra) => {
    scenes.push({ step: 'reunion', kind: `reunion:${seg}`, data: { seg, speaker, players, ...extra }, text: extra.text });
  };
  const header = (seg, title, sub = '', players = []) => {
    segments.push(seg);
    scenes.push({ step: 'reunion', kind: `reunion:${seg}`, data: { seg, speaker: 'segment', title, sub, players }, text: `${title}${sub ? ' — ' + sub : ''}` });
  };
  /* ONE RECEIPT PER PAIR AND KIND. "You got in the way of Taystee's prep"
     came up three times in one reunion, from three different weeks. */
  const usedReceipt = new Set();
  const rkey = r => `${[r.from, r.to].sort().join('|')}|${r.type}`;
  const spend = r => usedReceipt.add(rkey(r));
  const receiptFor = (who, { with: other = null } = {}) => F.receipts
    .filter(r => !usedReceipt.has(rkey(r)) && receiptTo(r, who) && (!other || r.from === other || r.to === other))
    .sort((p, q) => q.heat - p.heat || p.ep - q.ep)[0] || null;
  const otherOf = (r, who) => (r.from === who ? r.to : r.from);

  // ── 1. THE OPENING ──
  header('open', 'The Reunion', 'the whole season, back on one stage');
  say('open', 'open-host', { speaker: 'host' });
  say('open', 'open-room', { speaker: 'room' });

  // ── 2. THE SEASON IN NUMBERS ──
  header('numbers', 'The season in numbers');
  say('numbers', 'numbers-host', { speaker: 'host' });
  const byWins = [...F.cast].sort((a, b) => F.wins(b) - F.wins(a));
  if (F.wins(byWins[0]) > 0) plate('numbers', 'stat', [byWins[0]], { stat: 'Most challenge wins', value: F.wins(byWins[0]), text: `Most challenge wins: ${byWins[0]}, ${F.wins(byWins[0])}.` });
  const byBtm = [...F.cast].sort((a, b) => F.bottoms(b) - F.bottoms(a));
  if (F.bottoms(byBtm[0]) >= 2) {
    plate('numbers', 'stat', [byBtm[0]], { stat: 'Most times in the bottom', value: F.bottoms(byBtm[0]), text: `Most times in the bottom: ${byBtm[0]}, ${F.bottoms(byBtm[0])}.` });
    say('numbers', 'numbers-most-btm', { players: [byBtm[0]], subs: { n: spoken(F.bottoms(byBtm[0])) } });
  }
  if (F.exits[0]) plate('numbers', 'stat', [F.exits[0].name], { stat: 'First out', value: `episode ${F.exits[0].ep}`, text: `First out: ${F.exits[0].name}, episode ${F.exits[0].ep}.` });

  // ── 3. THE FIRST ONES OUT, together ──
  const exitsOrder = F.exits.filter(x => !F.winners.includes(x.name));
  const earlyN = exitsOrder.length >= 6 ? Math.max(2, Math.min(4, Math.round(exitsOrder.length / 3))) : 0;
  const early = exitsOrder.slice(0, earlyN).filter(x => !x.robbed);
  const seated = new Set(F.winners);
  if (early.length >= 2) {
    header('early', 'The first ones out', early.map(x => x.name).join(', '), early.map(x => x.name));
    const names = early.map(x => x.name);
    say('early', 'early-host', { speaker: 'host', players: names,
      subs: { names: `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` } });
    for (const x of early) {
      seated.add(x.name);
      qa('early', 'early-qa', { players: [x.name, x.opp || 'her'], subs: { ep: x.ep, song: x.song || 'that song' } });
      // Somebody who liked her, sometimes. Never the same voice twice here.
      const fan = F.cast.filter(o => o !== x.name && bond(x.name, o) >= 3).sort((p, q) => bond(x.name, q) - bond(x.name, p))[0];
      if (fan && rng() < 0.6 && say('early', 'early-sofa', { players: [x.name, fan], who: fan })) ctx.addBond?.(x.name, fan, 0.5);
    }
  }

  // ── 4. THE HOT SEAT, the seat her season earned ──
  const rest = [...exitsOrder.filter(x => !seated.has(x.name)),
    ...[...F.placements].reverse().filter(n => !seated.has(n) && !F.winners.includes(n)).map(n => ({ name: n, finalist: true }))];
  const heatOf = n => F.receipts.filter(r => r.from === n).reduce((t, r) => t + r.heat, 0);
  const villain = rest.map(x => x.name).filter(n => F.receipts.filter(r => r.from === n).length >= 2 && heatOf(n) >= 4)
    .sort((p, q) => heatOf(q) - heatOf(p))[0] || null;
  const survivor = rest.map(x => x.name).filter(n => n !== villain && F.bottoms(n) >= 3)
    .sort((p, q) => F.bottoms(q) - F.bottoms(p))[0] || null;
  const frontrunner = rest.filter(x => !x.finalist && x.name !== villain && x.name !== survivor && F.wins(x.name) >= 2)
    .sort((p, q) => F.wins(q.name) - F.wins(p.name))[0]?.name || null;
  const quiet = rest.filter(x => !x.finalist && ![villain, survivor, frontrunner].includes(x.name))
    .map(x => x.name).filter(n => {
      const r = F.rec(n); const safes = r.filter(v => v === 'SAFE').length;
      return r.length >= 4 && safes / r.length >= 0.6 && F.wins(n) === 0;
    })[0] || null;

  /* WHAT FOLLOWS HER FIRST ANSWER: drawn from what she actually has, shuffled,
     two of them. This is what stops thirteen seats reading as one. */
  const followUps = (n, x, max = 2, heard = new Set()) => {
    const opts = [];
    // Each option says who it puts on the microphone, so a seat never hears
    // the same voice from the sofa twice.
    const add = (voice, f) => opts.push({ voice, f });
    if (x?.opp && F.cast.includes(x.opp)) add(x.opp, () => say('seat', 'seat-exit-reply', { players: [n, x.opp], who: x.opp }));
    const r = receiptFor(n);
    if (r) {
      const o = otherOf(r, n);
      add(o, () => {
        const keys = r.said ? ['seat-receipt-qa', 'seat-receipt-qa-said'] : ['seat-receipt-qa'];
        if (!keys.some(k => (REUNION_LINES[k] || []).some(it => !used.has(it.a) && fresh(it.b).length))) return false;
        say('seat', 'seat-receipt-host', { speaker: 'host', players: [n, o], subs: { ep: r.ep, rec: receiptTo(r, n) } });
        spend(r);
        exchange('seat', keys, { players: [n, o] });
        ctx.addBond?.(n, o, rng() < 0.5 ? 1 : -1);
        return true;
      });
    }
    const win = F.winsOf(n)[0];
    const look = F.bestLookOf(n);
    if (win) add(null, () => ask('seat', 'seat-high-host', 'seat-high-answer', { players: [n], subs: { chal: win.chal, ep: win.ep } }));
    else if (look && look.score >= 6) add(null, () => ask('seat', 'seat-look-host', 'seat-look-answer', { players: [n], subs: { cat: look.cat, ep: look.ep } }));
    const others = F.cast.filter(o => o !== n);
    const ally = shuffle(others.filter(o => bond(n, o) >= 4))[0];
    const foe = shuffle(others.filter(o => bond(n, o) <= -3))[0];
    if (ally) add(ally, () => say('seat', 'seat-ally', { players: [n, ally], who: ally }) && (ctx.addBond?.(n, ally, 1), true));
    if (foe) add(foe, () => say('seat', 'seat-shade', { players: [n, foe], who: foe }) && (ctx.addBond?.(n, foe, -1), true));
    let done = 0;
    for (const { voice, f } of shuffle(opts)) {
      if (done >= max) break;
      if (voice && heard.has(voice)) continue;
      if (f()) { done++; if (voice) heard.add(voice); }
    }
  };

  for (const x of rest) {
    const n = x.name;
    if (x.robbed) {
      header('seat', 'Robbed?', n, [n]);
      say('seat', 'seat-robbed-host', { speaker: 'host', players: [n, x.stayed], subs: { ep: x.ep, song: x.song || 'that song' } });
      say('seat', 'seat-robbed-answer', { players: [n, x.stayed] });
      say('seat', 'robbed-stayed', { players: [n, x.stayed], who: x.stayed });
      say('seat', 'robbed-host-why', { speaker: 'host', players: [n] });
      ctx.popDelta?.(n, 2);
      followUps(n, null, 1, new Set([x.stayed]));
    } else if (n === villain) {
      const r = receiptFor(n);
      const o = r ? otherOf(r, n) : null;
      header('seat', 'The receipts', n, [n]);
      if (r && say('seat', 'seat-villain-host', { speaker: 'host', players: [n, o], subs: { ep: r.ep, rec: receiptTo(r, n) } })) {
        spend(r);
        // Words can be answered as words; a thing she DID cannot.
        const also = k => (r.said ? [`${k}-said`] : []);
        say('seat', 'seat-villain-answer', { players: [n, o], also: also('seat-villain-answer') });
        say('seat', 'seat-villain-victim', { players: [n, o], who: o, also: also('seat-villain-victim') });
        say('seat', 'seat-villain-back', { players: [n, o], also: also('seat-villain-back') });
        ctx.popDelta?.(n, -1);
      }
      // And how she went home: the seat is about her season, ending included.
      if (!x.finalist) qa('seat', 'seat-exit-qa', { players: [n, x.opp || 'her'], subs: { ep: x.ep, song: x.song || 'that song' } });
      followUps(n, x, 1, new Set([o]));
    } else if (n === survivor) {
      header('seat', 'The survivor', n, [n]);
      say('seat', 'seat-survivor-host', { speaker: 'host', players: [n], subs: { n: spoken(F.bottoms(n)) } });
      say('seat', 'seat-survivor-answer', { players: [n] });
      const beaten = F.sentHomeBy(n)[0];
      if (beaten) say('seat', 'seat-survivor-sofa', { players: [n, beaten], who: beaten });
      // And how she went home: the seat is about her season, ending included.
      if (!x.finalist) qa('seat', 'seat-exit-qa', { players: [n, x.opp || 'her'], subs: { ep: x.ep, song: x.song || 'that song' } });
      followUps(n, x, 1, new Set([beaten]));
    } else if (n === frontrunner) {
      header('seat', 'The frontrunner', n, [n]);
      say('seat', 'seat-frontrunner-host', { speaker: 'host', players: [n], subs: { n: spoken(F.wins(n)), ep: x.ep } });
      say('seat', 'seat-frontrunner-answer', { players: [n] });
      const rival = F.cast.filter(o => o !== n && !F.exits.some(e => e.name === o && e.ep <= x.ep))[0];
      if (rival) say('seat', 'seat-frontrunner-sofa', { players: [n, rival], who: rival });
      followUps(n, x, 1, new Set([rival]));
    } else if (n === quiet) {
      header('seat', 'Where were you?', n, [n]);
      say('seat', 'seat-quiet-host', { speaker: 'host', players: [n] });
      say('seat', 'seat-quiet-answer', { players: [n] });
      const friend = F.cast.filter(o => o !== n).sort((p, q) => bond(n, q) - bond(n, p))[0];
      if (friend && bond(n, friend) > 0) say('seat', 'seat-quiet-sofa', { players: [n, friend], who: friend });
      // And how she went home: the seat is about her season, ending included.
      if (!x.finalist) qa('seat', 'seat-exit-qa', { players: [n, x.opp || 'her'], subs: { ep: x.ep, song: x.song || 'that song' } });
      followUps(n, x, 1, new Set([friend]));
    } else if (x.finalist) {
      header('seat', 'The finalist', n, [n]);
      qa('seat', 'seat-finalist-qa', { players: [n], subs: { song: F.crownSong[n] || 'your last song' } });
      followUps(n, null, 2);
    } else {
      header('seat', 'The hot seat', n, [n]);
      qa('seat', 'seat-exit-qa', { players: [n, x.opp || 'her'], subs: { ep: x.ep, song: x.song || 'that song' } });
      followUps(n, x, 2);
    }
  }

  // ── 5. THE ROOM, asked questions it answers with names ──
  const voices = shuffle(F.cast.filter(n => !F.winners.includes(n)));
  if (voices.length >= 3) {
    header('room', 'Ask the room');
    // The queen to beat: her season, with a little of who you were scared of.
    say('room', 'room-threat-host', { speaker: 'host' });
    const named = {};
    for (const a of voices.slice(0, 3)) {
      const b = F.cast.filter(o => o !== a)
        .map(o => ({ o, v: recordStrength(F.rec(o)) + rng() * 0.3 }))
        .sort((p, q) => q.v - p.v)[0]?.o;
      if (b && say('room', 'room-threat', { players: [a, b] })) named[b] = (named[b] || 0) + 1;
    }
    const most = Object.entries(named).sort((p, q) => q[1] - p[1])[0];
    if (most && most[1] >= 2) { say('room', 'room-threat-react', { players: [null, most[0]], who: most[0] }); ctx.popDelta?.(most[0], 1); }
    // Who went home too soon: her favourite of the first half of the exits.
    const half = F.exits.slice(0, Math.max(2, Math.ceil(F.exits.length / 2))).map(x => x.name);
    say('room', 'room-stay-host', { speaker: 'host' });
    for (const a of voices.slice(3, 5)) {
      const b = half.filter(o => o !== a).sort((p, q) => bond(a, q) - bond(a, p))[0];
      if (b) say('room', 'room-stay', { players: [a, b] });
    }
    // Who surprised you: the queen whose second half beat her first.
    const lift = n => {
      const r = F.rec(n); const mid = Math.floor(r.length / 2);
      const good = xs => xs.filter(v => v === 'WIN' || v === 'HIGH').length;
      return good(r.slice(mid)) - good(r.slice(0, mid));
    };
    const riser = [...F.cast].sort((p, q) => lift(q) - lift(p))[0];
    if (riser && lift(riser) >= 2) {
      const a = voices.find(v => v !== riser && !voices.slice(0, 5).includes(v)) || voices.find(v => v !== riser);
      if (a && say('room', 'room-surprise-host', { speaker: 'host' })) say('room', 'room-surprise', { players: [a, riser] });
    }
  }

  // ── 6. THE FEUDS, with the receipts ──
  const feuds = F.pairs.filter(p => p.bond <= -3)
    .map(p => ({ ...p, r: receiptFor(p.a, { with: p.b }) || receiptFor(p.b, { with: p.a }) }))
    .filter(p => p.r).sort((p, q) => p.bond - q.bond).slice(0, 2);
  if (feuds.length) header('feud', 'The feuds');
  for (const f of feuds) {
    // The host puts it to the queen who did it.
    const a = receiptTo(f.r, f.a) ? f.a : f.b;
    const b = a === f.a ? f.b : f.a;
    spend(f.r);
    const pr = [a, b];
    say('feud', 'feud-host', { speaker: 'host', players: pr, subs: { ep: f.r.ep, rec: receiptTo(f.r, a) } });
    say('feud', 'feud-a', { players: pr });
    say('feud', 'feud-b', { players: pr, who: b, subs: { ep: f.r.ep } });
    // Somebody who was there cuts in — on b's side, against a.
    const c = F.cast.filter(o => o !== a && o !== b && bond(o, b) >= 3 && bond(o, a) <= -1)
      .sort((p, q) => bond(q, b) - bond(p, b))[0];
    if (c) say('feud', 'feud-third', { players: [a, b, c], who: c });
    say('feud', 'feud-a2', { players: pr });
    say('feud', 'feud-host2', { speaker: 'host', players: pr });
    const cools = rng() < Math.max(0.2, 0.7 + f.bond * 0.05);
    say('feud', cools ? 'feud-cools' : 'feud-hardens', { speaker: 'room', players: pr });
    ctx.addBond?.(a, b, cools ? 3 : -2);
  }

  // ── 7. THE BONDS ──
  const romanceKeys = new Set(F.romances.map(p => [...p].sort().join('|')));
  const friends = F.pairs.filter(p => p.bond >= 6 && !romanceKeys.has([p.a, p.b].sort().join('|')))
    .sort((p, q) => q.bond - p.bond).slice(0, 2);
  if (friends.length || F.romances.length) header('bonds', 'Friends, sisters and more');
  for (const p of friends) {
    say('bonds', 'friend-host', { speaker: 'host', players: [p.a, p.b] });
    say('bonds', 'friend-a', { players: [p.a, p.b] });
    say('bonds', 'friend-b', { players: [p.a, p.b], who: p.b });
    ctx.addBond?.(p.a, p.b, 1);
  }
  for (const [a, b] of F.romances.slice(0, 1)) {
    say('bonds', 'romance-host', { speaker: 'host', players: [a, b] });
    say('bonds', 'romance-a', { players: [a, b] });
    say('bonds', 'romance-b', { players: [a, b], who: b });
  }

  // ── 8. THE NIGHT NOBODY WENT HOME ──
  for (const d of F.doubles.slice(0, 1)) {
    header('double', 'Shantay, you both stay', `episode ${d.ep}`);
    say('double', 'double-host', { speaker: 'host', players: d.queens, subs: { ep: d.ep, song: d.song } });
    say('double', 'double-answer', { players: d.queens });
  }

  // ── 9. THE AWARDS ──
  header('awards', 'The awards');
  say('awards', 'award-host', { speaker: 'host' });
  const assassin = [...F.cast].sort((a, b) => F.lipsyncWins(b) - F.lipsyncWins(a))[0];
  if (assassin && F.lipsyncWins(assassin) >= 2) {
    plate('awards', 'award', [assassin], { award: 'Lip Sync Assassin', detail: `${F.lipsyncWins(assassin)} lip syncs won`, text: `Lip Sync Assassin of the season: ${assassin}, ${F.lipsyncWins(assassin)} lip syncs won.` });
    say('awards', 'award-assassin', { players: [assassin] });
    ctx.popDelta?.(assassin, 1);
  }
  const sortedLooks = [...F.looks].sort((a, b) => b.score - a.score);
  const bestLook = sortedLooks[0];
  const worstLook = sortedLooks[sortedLooks.length - 1];
  if (bestLook) {
    plate('awards', 'award', [bestLook.n], { award: 'Best Look of the Season', detail: `${bestLook.cat}, episode ${bestLook.ep}`, text: `Best Look of the Season: ${bestLook.n}, for ${bestLook.cat} (episode ${bestLook.ep}).` });
    say('awards', 'award-look', { players: [bestLook.n] });
  }
  if (worstLook && worstLook !== bestLook) {
    plate('awards', 'award', [worstLook.n], { award: 'The Golden Boot', detail: `${worstLook.cat}, episode ${worstLook.ep}`, boot: true, text: `The Golden Boot, for the worst look of the season: ${worstLook.n}, for ${worstLook.cat} (episode ${worstLook.ep}).` });
    say('awards', 'award-boot', { players: [worstLook.n] });
    ctx.popDelta?.(worstLook.n, 1);   // a good sport about it is endearing
  }
  if (state.congeniality) {
    plate('awards', 'award', [state.congeniality], { award: 'Miss Congeniality', detail: 'voted by the fans', text: `Miss Congeniality: ${state.congeniality}.` });
    say('awards', 'award-congeniality', { players: [state.congeniality] });
  }

  // ── 10. THE WINNER, A WEEK LATER ──
  if (w) {
    header('winner', F.winners.length > 1 ? 'The winners' : 'The winner', F.winners.join(' & '), [...F.winners]);
    say('winner', 'winner-host', { speaker: 'host', players: [w] });
    say('winner', 'winner-answer', { players: [w], who: w });
    // Her season too: which of her wins meant the most.
    const wWin = F.winsOf(w);
    if (wWin.length) {
      const fav = wWin[Math.floor(rng() * wWin.length)];
      say('winner', 'winner-journey-host', { speaker: 'host', players: [w], subs: { n: spoken(wWin.length) } });
      say('winner', 'winner-journey-answer', { players: [w], who: w, subs: { chal: fav.chal } });
    }
    if (F.winners.length > 1) say('winner', 'winners-double', { players: [F.winners[1]], who: F.winners[1], subs: { w: F.winners[1] } });
    if (F.runnerUp) {
      say('winner', 'winner-runnerup-host', { speaker: 'host', players: [F.runnerUp] });
      say('winner', 'winner-runnerup-answer', { players: [F.runnerUp] });
    }
  }

  // ── 11. THE CLOSE ──
  header('close', 'Goodnight');
  say('close', 'close-host', { speaker: 'host' });

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
