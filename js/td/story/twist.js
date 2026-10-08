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
    if (tw.type === 'three-gifts' && tw.giftResults?.length >= 2) out['three-gifts'] = summit(ep, tw);
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
