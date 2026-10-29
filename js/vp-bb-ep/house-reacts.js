// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/house-reacts.js — the house, in the second after the voice stops
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-29: "theres a lack of a reaction when the mastermind announce something important". A twist was
// read out and the screen went dark on "Nobody moves"; the antagonist's weekly line had no answer at all, and the turn
// had one fixed exchange per theme, the same three lines every season.
//
// Two or three people answer, picked per week so it is not the same faces, each in their own register (the archetype
// is the character's, fixed, so a replayed week answers the same way): the schemer sees an opening, the hothead goes
// off, the loyal one rallies their people, the observer watches who looks relieved. One beat for the room, then the
// voices. Stable picks keyed by the week, never a die: a screen drawn twice says the same thing.

import { players } from '../core.js';
import { pronouns } from '../players.js';

const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const pick = (list, key) => list[hash(key) % list.length];

const GROUP = {
  villain: 'schemer', mastermind: 'schemer', schemer: 'schemer',
  hothead: 'hot', 'chaos-agent': 'hot', wildcard: 'hot',
  hero: 'warm', 'loyal-soldier': 'warm', 'social-butterfly': 'warm', showmancer: 'warm', underdog: 'warm', goat: 'warm',
  'perceptive-player': 'eye', floater: 'eye', 'challenge-beast': 'fighter',
};
const groupOf = n => GROUP[players.find(p => p.name === n)?.archetype] || 'warm';

// {a} the speaker, {b} somebody else in the room, {x} what was announced (or "this")
const SAY = {
  schemer: [
    ['say', 'Good. Everybody is going to panic, and panicked people make mistakes.'],
    ['dr', "Everybody in that room just got scared. I just got a plan."],
    ['say', '{b}, come and find me in an hour. We need to talk about {x}.'],
    ['dr', "{x}. I can work with that. Most of this house can't, and that's the point."],
    ['say', "Don't look at me like that, {b}. I didn't write the rules."],
  ],
  hot: [
    ['say', 'Are you serious? {x}? Now?'],
    ['say', "No. Absolutely not. This house is out of its mind."],
    ['dr', "I'm so tired of this house changing the rules every time I get comfortable."],
    ['say', "{b}, did you know about this? Don't lie to me."],
    ['say', 'I swear, the second I get settled in this place.'],
  ],
  warm: [
    ['say', "Okay. Okay. Whatever {x} is, we stick together. Right, {b}?"],
    ['say', "{b}, I don't like the sound of that at all."],
    ['dr', "I just want to know my people are safe. Right now I don't know anything."],
    ['say', 'That is terrifying. Is anybody else terrified?'],
    ['say', "We'll be fine. We'll be fine. Somebody tell me we'll be fine."],
  ],
  eye: [
    ['dr', "I wasn't watching the screen. I was watching who looked relieved. {b} looked relieved."],
    ['say', '{b}. You went very quiet just then.'],
    ['dr', "Somebody in this house already knew about {x}. I'd put money on it."],
    ['say', "Nobody say anything for a minute. Let's actually think about what that means."],
  ],
  fighter: [
    ['say', "Whatever it is, I'll win it. That's all I need to know."],
    ['dr', "{x} means another competition, sooner or later. Good. That's where I'm strongest."],
    ['say', "Bring it. I've been waiting for something to actually happen in here."],
  ],
};
const ROOM = [
  'Half the room starts talking at once.',
  '{a} and {b} look at each other and say nothing.',
  'Somebody laughs, and nobody joins in.',
  "For a second nobody moves. Then everybody is looking at everybody else.",
  "{a} is the first one off the sofa.",
  'The room goes very quiet, the kind of quiet where people are counting.',
];
const HOSTILE_ROOM = [
  'Nobody laughs this time.',
  "{a} pulls {a.posAdj} knees up onto the sofa and doesn't take {a.posAdj} eyes off the screen.",
  'The room is silent until the lights come back up, and then still silent.',
];

/**
 * The house answers. `names` the people in the room (the HOH included), `seed` the week and the moment, `about` what
 * was announced (a twist's name) or null, `hostile` the antagonist's register.
 * @returns {BB.Step[]}
 */
export function houseReacts({ names = [], seed = '', about = null, hostile = false, count = 2 } = {}) {
  const room = names.filter(Boolean);
  if (room.length < 2) return [];
  const order = [...room].sort((x, y) => hash(`${seed}|${x}`) - hash(`${seed}|${y}`));
  const speakers = order.slice(0, Math.min(count, room.length));
  const other = n => order.find(m => m !== n && !speakers.includes(m)) || order.find(m => m !== n);
  const x = about || 'this';
  const pron = n => { try { const p = pronouns(n); if (p?.posAdj) return p; } catch { /* default */ } return { posAdj: 'their' }; };
  const fill = (t, a, b) => t.replace(/\{a\.posAdj\}/g, pron(a).posAdj).replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{x\}/g, x)
    .replace(/^this\b/, 'This');
  /** @type {BB.Step[]} */ const out = [];
  const a0 = speakers[0];
  out.push({ k: 'beat', t: fill(pick(hostile ? HOSTILE_ROOM : ROOM, `${seed}|room`), a0, other(a0)) });
  const used = new Set();
  for (const a of speakers) {
    const pool = SAY[groupOf(a)].filter(([, t]) => !used.has(t) && (about || !t.includes('{x}')));
    if (!pool.length) continue;
    const [k, t] = pick(pool, `${seed}|${a}`);
    used.add(t);
    out.push(k === 'dr' ? { k: 'dr', by: a, t: fill(t, a, other(a)) } : { k: 'say', by: a, t: fill(t, a, other(a)) });
  }
  return out;
}
