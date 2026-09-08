// ══════════════════════════════════════════════════════════════════════
// js/dr/reunion.js — the season, argued about by the people who lived it
// ══════════════════════════════════════════════════════════════════════
//
// The one episode that reads the WHOLE season instead of one night, which is
// why it was deferred out of the plan that built the weekly screens: nothing
// else in this engine needs more than the row in front of it.
//
// It sits between the last elimination and the finale — the real show's track
// record chart has a "Reunion" column in exactly that position, ahead of
// "Finale" — and it eliminates nobody.
//
// EVERY TOPIC IS DERIVED. The reunion does not invent a feud so it has
// something to talk about: it goes looking through the bonds, the record and
// the season's own events for the arguments that are actually there, and if a
// season was a quiet one the reunion is short. A reunion that always produced
// the same five confrontations would be a format, not a memory.

import { REUNION_BEATS } from './data/reunion-beats.js';
import { recordStrength } from './season.js';

const pickLine = (lines, rng, used, key) => {
  if (!lines || !lines.length) return '';
  const fresh = lines.filter(l => !used.has(key + ' ' + l));
  const pool = fresh.length ? fresh : lines;
  const chosen = pool[Math.floor(rng() * pool.length)];
  used.add(key + ' ' + chosen);
  return chosen;
};

const fill = (line, { a, b } = {}) => (line || '')
  .replace(/\{a\}/g, a || '').replace(/\{b\}/g, b || '');

const beatById = id => REUNION_BEATS.find(b => b.id === id);

/**
 * The arguments this season actually produced.
 *
 * Returns a list of `{ kind, players, data }`, best story first. Nothing is
 * scored and nothing is decided — the reunion is a reading of a season that
 * has already happened.
 */
export function reunionTopics({ cast, record, bond, rows, congeniality = null }) {
  const topics = [];
  const rec = n => record?.[n] || [];

  // ── the feud: the worst pair in the room who actually shared scenes ──
  let worst = null;
  for (let i = 0; i < cast.length; i++) {
    for (let j = i + 1; j < cast.length; j++) {
      const a = cast[i]; const b = cast[j];
      const v = bond(a, b);
      // Shared history, not just a low number: two queens who never appeared
      // in a scene together have no feud to have, whatever the graph says.
      const shared = rows.reduce((n, row) => n + (row.dr?.scenes || []).filter(sc => {
        const p = sc.data?.players || [];
        return p.includes(a) && p.includes(b);
      }).length, 0);
      if (v <= -3 && shared > 0 && (!worst || v < worst.bond)) {
        worst = { a, b, bond: v, shared };
      }
    }
  }
  if (worst) {
    topics.push({ kind: 'feud', players: [worst.a, worst.b], data: worst });
  }

  // ── the exit nobody understood: the best record to go home early ──
  const exits = [];
  for (const row of rows) {
    for (const x of row.exits || []) {
      const name = typeof x === 'string' ? x : x?.name;
      if (name) exits.push({ name, episode: row.num || 0 });
    }
  }
  const shock = exits
    .filter(x => recordStrength(rec(x.name)) > 0.2)
    .sort((p, q) => recordStrength(rec(q.name)) - recordStrength(rec(p.name)))[0];
  if (shock) {
    topics.push({
      kind: 'shock-exit', players: [shock.name],
      data: { ...shock, strength: Math.round(recordStrength(rec(shock.name)) * 100) / 100 },
    });
  }

  // ── the queen who was told she was coasting, and finished above them ──
  const safest = cast
    .map(n => ({ n, safes: rec(n).filter(r => r === 'SAFE').length, len: rec(n).length }))
    .filter(x => x.len >= 4 && x.safes / x.len >= 0.5)
    .sort((p, q) => q.safes - p.safes)[0];
  if (safest) topics.push({ kind: 'the-invisible', players: [safest.n], data: safest });

  // ── the reconciliation: a pair the season put back together ──
  let best = null;
  for (let i = 0; i < cast.length; i++) {
    for (let j = i + 1; j < cast.length; j++) {
      const v = bond(cast[i], cast[j]);
      if (v >= 6 && (!best || v > best.bond)) best = { a: cast[i], b: cast[j], bond: v };
    }
  }
  if (best) topics.push({ kind: 'the-friendship', players: [best.a, best.b], data: best });

  // ── the frontrunner, asked whether she knew ──
  const top = [...cast].sort((p, q) => recordStrength(rec(q)) - recordStrength(rec(p)))[0];
  if (top && rec(top).filter(r => r === 'WIN').length >= 2) {
    topics.push({ kind: 'the-frontrunner', players: [top], data: { wins: rec(top).filter(r => r === 'WIN').length } });
  }

  if (congeniality) topics.push({ kind: 'congeniality', players: [congeniality], data: {} });

  return topics;
}

/**
 * The reunion episode.
 *
 * Eliminates nobody, changes no record, and carries `dr.reunion` so a screen
 * can tell it from a normal night. Bonds DO move: this is the one place a
 * season's arguments get had out loud, and a reunion that changed nothing
 * would be the cosmetic-scene bug with a bigger stage.
 */
export function runReunion(state, cfg, ctx) {
  const { rng } = ctx;
  const cast = [...(state.castOrder || [])];
  const topics = reunionTopics({
    cast,
    record: state.record,
    bond: ctx.bond,
    rows: state.episodes || [],
    congeniality: state.congeniality || null,
  });

  const used = new Set();
  const scenes = [{
    step: 'reunion', kind: 'reunion-open',
    data: { cast, back: [...(state.out || [])], living: [...state.living] }, text: '',
  }];

  const emit = (id, players, extra = {}) => {
    const beat = beatById(id);
    const t = beat?.tiers?.[0];
    if (!t) return;
    scenes.push({
      step: 'reunion', kind: `reunion:${id}`,
      data: { beat: id, players, note: t.note, ...extra },
      text: fill(pickLine(t.lines, rng, used, id), { a: players[0], b: players[1] }),
    });
  };

  emit('reunion-open', []);
  for (const t of topics) {
    emit(t.kind, t.players, { topic: t.data });
    // THE ARGUMENT LANDS SOMEWHERE. A feud aired is a feud that either cools
    // or hardens, and a friendship named in front of everybody is stronger.
    if (t.kind === 'feud') ctx.addBond(t.players[0], t.players[1], rng() < 0.55 ? 2 : -2);
    if (t.kind === 'the-friendship') ctx.addBond(t.players[0], t.players[1], 1);
    if (t.kind === 'the-invisible') ctx.popDelta(t.players[0], 2);
    if (t.kind === 'shock-exit') ctx.popDelta(t.players[0], 2);
  }
  emit('reunion-close', []);

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
      // NOT a finale and NOT a normal week: its own flag, so no reader has to
      // infer what this episode is from the absence of a challenge.
      reunion: { topics, cast },
      storylines: state.storylines || [],
      storylineNeed: {},
      record: JSON.parse(JSON.stringify(state.record)),
      living: [...state.living],
      scenes,
    },
  };
  state.episodes.push(row);
  return row;
}
