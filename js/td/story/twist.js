// ══════════════════════════════════════════════════════════════════════
// td/story/twist.js — twists as conversations
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-08: "make sure we have conversation for twists, the Summit for example".
// twists.js decides what a twist does and records it on the twist (ep.twists[]); this writes the
// people in it talking, in their own voices (write.js, phrase.js): ep.twistStory[type] = a list of
// scenes { lines, players, at: 'set' | 'camp', camp }. The twist screen plays them after the
// host's announcement (vp-td-ep/twist-screens.js) and the text backlog prints them.
//
// The Summit ('three-gifts'): one nominee per team meets the others; each takes the survival kit
// (gift 1), the idol clue (2) or the Immunity Totem (3), and the engine says why in its weights
// (loyalty and social for the kit, intuition and strategy for the clue, boldness and disloyalty
// for the totem). Back at camp the team asks; a totem-taker may brag, shrug or slip (giftDrama).
import { gs, seasonConfig } from '../../core.js';
import { pStats } from '../../players.js';
import { getBond } from '../../bonds.js';
import { writeStory } from './write.js';
import { factsFor } from '../script/facts.js';

const GIFT = { 1: 'kit', 2: 'clue', 3: 'totem' };

function teamOf(ep, name) {
  return (ep.tribesAtStart || gs.tribes || []).find(t => (t.members || []).includes(name)) || null;
}
const closestOf = (name, pool) => [...pool].sort((x, y) => getBond(name, y) - getBond(name, x) || x.localeCompare(y));

export function writeTwistStory(ep) {
  const out = {};
  for (const tw of ep.twists || []) {
    const put = (k, list) => { if (list?.length) out[k] = [...(out[k] || []), ...list]; };
    if (tw.type === 'three-gifts' && tw.giftResults?.length >= 2) put('three-gifts', summit(ep, tw));
    if (tw.type === 'journey' && ep.journey?.travelers?.length) put('journey', journey(ep));
    if (tw.type === 'returning-player' && (tw.returnees || []).length) put('returning-player', returning(ep, tw));
    if (tw.newTribes?.length) put(tw.type, split(ep, tw));
    if (tw.type === 'idol-wager' && (tw.idolWagerResults || []).some(r => r.holder)) put('idol-wager', wager(ep, tw));
  }
  return Object.keys(out).length ? out : null;
}

function summit(ep, tw) {
  const scenes = [];
  const venue = seasonConfig?.setting || 'hosted-camp';
  const base = who => ({ ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'pre' }), venue, voteYet: (gs.episodeHistory || []).some(h => h.num < ep.num && h.eliminated) });
  let n = 500;
  const write = (pool, ending, who, data = {}) => writeStory(pool, ending, who, data, base(who), { ep: ep.num, camp: 'twist', phase: 'pre', n: n++, place: 'secret', unique: 'soft' });
  const nominees = tw.giftResults.map(r => r.player);

  // the nominees meet, far from both camps
  const [a, b, c, d] = nominees;
  const meet = write('twist.summit.meet', 'any', { a, b, ...(c ? { c } : {}), ...(d ? { d } : {}) });
  if (meet) scenes.push({ at: 'set', lines: meet.lines, players: nominees });

  // each one's choice, to the camera, for the reason the engine weighed
  for (const r of tw.giftResults) {
    const w = write('twist.summit.choose', GIFT[r.gift] || 'kit', { a: r.player });
    if (w) scenes.push({ at: 'set', lines: w.lines, players: [r.player] });
  }

  // back at camp: the closest teammates ask
  for (const r of tw.giftResults) {
    const team = teamOf(ep, r.player);
    const mates = closestOf(r.player, (team?.members || []).filter(m => m !== r.player && (gs.activePlayers || []).includes(m)));
    if (mates.length < 2) continue;
    const drama = (tw.giftDrama || []).find(x => x.player === r.player);
    let s = {}; try { s = pStats(r.player) || {}; } catch { s = {}; }
    const ending = r.gift === 1 ? 'kit'
      : r.gift === 2 ? (r.searchOutcome === 'found' ? 'found' : 'empty')
        : drama ? ((s.boldness ?? 5) >= 8 ? 'totem-brag' : (s.loyalty ?? 5) <= 3 ? 'totem-cold' : 'totem-slip') : 'totem';
    const who = { a: r.player, b: mates[0], c: mates[1], ...(mates[2] ? { d: mates[2] } : {}) };
    const w = write('twist.summit.back', ending, who, { tribe: team?.name || 'the team' });
    if (w) scenes.push({ at: 'camp', camp: team?.name || null, lines: w.lines, players: Object.values(who) });
  }
  return scenes;
}

// ── shared helpers for the twists below ──
function writer(ep) {
  const venue = seasonConfig?.setting || 'hosted-camp';
  const voteYet = (gs.episodeHistory || []).some(h => h.num < ep.num && h.eliminated);
  let n = 700;
  return (pool, ending, who, data = {}) => writeStory(pool, ending, who, data,
    { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'pre' }), venue, voteYet }, { ep: ep.num, camp: 'twist', phase: 'pre', n: n++, place: 'secret', unique: 'soft' });
}
const sceneOf = (w, at, players, camp = null) => (w ? { at, camp, lines: w.lines, players } : null);

// The journey: the travellers meet; each learns what it cost or gave them (safe, a deal between
// them, an advantage, a lost vote) and says so to the camera.
function journey(ep) {
  const write = writer(ep);
  const J = ep.journey;
  const out = [];
  const [a, b, c] = J.travelers;
  const deal = (J.results || []).some(r => r.dealMade);
  out.push(sceneOf(write('twist.journey.meet', deal ? 'deal' : 'any', { a, b, ...(c ? { c } : {}) }), 'set', J.travelers));
  for (const r of J.results || []) {
    const ending = r.dealMade ? 'deal' : r.result === 'advantage' ? 'advantage' : r.result === 'lostVote' ? 'lostvote' : 'safe';
    out.push(sceneOf(write('twist.journey.result', ending, { a: r.name }), 'set', [r.name]));
  }
  return out.filter(Boolean);
}

// A player comes back: the closest person still in the game, and (when they are here) somebody
// who wrote their name, are the first to face them.
function returning(ep, tw) {
  const write = writer(ep);
  const out = [];
  for (const r of tw.returnees) {
    const name = r.name;
    const out1 = (gs.episodeHistory || []).filter(h => h.eliminated === name || (Array.isArray(h.eliminated) && h.eliminated.includes(name))).slice(-1)[0];
    const voters = (out1?.votingLog || []).filter(v => v.voted === name).map(v => v.voter).filter(v => (gs.activePlayers || []).includes(v) && v !== name);
    const here = (gs.activePlayers || []).filter(x => x !== name);
    const friend = closestOf(name, here.filter(x => !voters.includes(x)))[0] || null;
    const foe = voters.sort((x, y) => getBond(name, x) - getBond(name, y) || x.localeCompare(y))[0] || null;
    if (!friend) continue;
    const who = { a: name, b: friend, ...(foe ? { c: foe } : {}) };
    out.push(sceneOf(write('twist.return.arrive', foe ? 'foe' : 'any', who), 'camp', Object.values(who)));
  }
  return out.filter(Boolean);
}

// A swap splits people who were close: the closest pairs now on different teams say goodbye.
function split(ep, tw) {
  const before = (gs.episodeHistory || []).filter(h => h.num < ep.num).slice(-1)[0]?.gsSnapshot?.tribes || ep.tribesAtStart || [];
  const teamBefore = name => before.find(t => (t.members || []).includes(name))?.name;
  const teamAfter = name => tw.newTribes.find(t => (t.members || []).includes(name))?.name;
  const people = tw.newTribes.flatMap(t => t.members || []);
  const pairs = [];
  for (let i = 0; i < people.length; i++) for (let j = i + 1; j < people.length; j++) {
    const x = people[i], y = people[j];
    if (teamBefore(x) && teamBefore(x) === teamBefore(y) && teamAfter(x) !== teamAfter(y) && getBond(x, y) >= 3) pairs.push([x, y, getBond(x, y)]);
  }
  pairs.sort((p, q) => q[2] - p[2] || p[0].localeCompare(q[0]));
  const write = writer(ep);
  const used = new Set();
  const out = [];
  for (const [x, y] of pairs) {
    if (used.has(x) || used.has(y) || out.length >= 2) continue;
    used.add(x); used.add(y);
    out.push(sceneOf(write('twist.swap.split', 'any', { a: x, b: y }, { mine: teamAfter(x), theirs: teamAfter(y) }), 'set', [x, y]));
  }
  return out.filter(Boolean);
}

// The idol wager: each holder decides, and the ones who play find out.
function wager(ep, tw) {
  const write = writer(ep);
  // one scene per holder, whatever they hold (two idols, one decision on screen)
  const seen = new Set();
  return tw.idolWagerResults.filter(r => r.holder && !seen.has(r.holder) && seen.add(r.holder)).map(r =>
    sceneOf(write('twist.wager', r.decision === 'declined' ? 'declined' : r.won ? 'won' : 'lost', { a: r.holder }), 'set', [r.holder])).filter(Boolean);
}
