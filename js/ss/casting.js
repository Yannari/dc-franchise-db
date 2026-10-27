// ══════════════════════════════════════════════════════════════════════
// ss/casting.js — who moves into the House of Secrets, with what secret
// ══════════════════════════════════════════════════════════════════════
//
// Part 1 of Secret Story as its own show
// (docs/superpowers/specs/2026-10-27-secret-story-show-design.md):
//
//   · every housemate shows a secret on the cast screen BEFORE the season
//     starts: a draw from the pool that suits them by default, with Keep /
//     Reroll / Write my own, and their real history (kin in the house, a past
//     win) offered as an option, never imposed;
//   · somebody whose secret is already canon (an earlier Secret Story season)
//     keeps it, locked;
//   · who would recognise whom is computed here, once, and stored on the
//     season, so the hunt (part 2) and launch night (part 3) read one truth;
//   · the season's name, house theme and nomination rule.
//
// Pure functions over plain data; the setup panel is at the bottom.

import { SECRET_POOL, SECRET_KINDS, drawSecret, ownSecret } from './secret-pool.js';

/** The house themes a season can be redecorated as. The real house changed
 *  its decor every year; part 4 draws them, part 2's randomizer picks them. */
export const SS_HOUSE_THEMES = [
  { id: 'loft', name: 'The Loft', blurb: 'a prefab house on a studio car park, rebuilt and redecorated every year' },
  { id: 'chalet', name: 'The Rooftop Chalet', blurb: 'a wooden chalet twenty metres up on a studio roof, with a garden over the city' },
  { id: 'campus', name: 'The Campus of Secrets', blurb: 'a university campus with a library, a control tower and doors in the walls' },
  { id: 'arena', name: 'The Warehouse and its Arena', blurb: 'a vast warehouse house with a games arena and a wall that splits it in two' },
  { id: 'crystal', name: 'The Glass House', blurb: 'a house of mirrors and glass, with a second house hidden beside it' },
  { id: 'labyrinth', name: 'The Labyrinth', blurb: 'a house built over tunnels, with rooms nobody is told about' },
];

/** How the confessional nominates: one sex the other (the classic seasons),
 *  everybody anybody (the revival), or decided by the draw. */
export const SS_NOMINATION_RULES = ['random', 'gendered', 'mixed'];

const PAIR_WORDS = {
  twins: 'We are twins', siblings: 'We are brother and sister', 'step-siblings': 'We are step-siblings',
  married: 'We are married', engaged: 'We are engaged', partners: 'We are a couple', dating: 'We are a couple',
  exes: 'We used to be together', 'parent-child': 'We are parent and child', cousins: 'We are cousins',
  'best-friends': 'We are best friends', 'childhood-friends': 'We grew up together',
};

/**
 * The real-history secrets a housemate COULD carry: a tie to somebody else in
 * the house, or what they did on another show. Options, never a default.
 *   pairs:   kinshipPairs() rows ({ a, b, kin })
 *   career:  careerOf(name) rows ({ where, rec })
 */
export function historySecretOptions(name, { cast = [], pairs = [], career = [] } = {}) {
  const out = [];
  for (const p of pairs) {
    const other = p.a === name ? p.b : p.b === name ? p.a : null;
    if (!other || !cast.includes(other) || !PAIR_WORDS[p.kin]) continue;
    out.push({ source: 'history', kind: 'family', pair: other, text: PAIR_WORDS[p.kin],
      clues: ['two halves of one photo', 'two names on one card', 'the word "together"'],
      tells: [`keeps finding a reason to be near ${other}`], difficulty: 0.55 });
  }
  const won = career.find(c => c.rec?.winner);
  const fin = career.find(c => c.rec?.finalist);
  const last = career[career.length - 1];
  const past = won ? `I have already won ${won.where}` : fin ? `I made the final of ${fin.where}` : last ? `I have already played ${last.where}` : null;
  if (past) {
    out.push({ source: 'history', kind: 'past', text: past,
      clues: ['a trophy with the name scratched off', 'an old cast photo', 'the word "again"'],
      tells: ['knows how a game like this works far too well'], difficulty: won ? 0.35 : 0.5 });
  }
  return out;
}

/** The secret entry stored on the season for one housemate. */
const asEntry = (e, source) => e && ({
  source, id: e.id ?? null, kind: e.kind, text: e.text,
  clues: [...(e.clues || [])], tells: [...(e.tells || [])], difficulty: Number(e.difficulty) || 0.55,
  ...(e.pair ? { pair: e.pair } : {}),
});

/**
 * Everybody's secret for the cast screen.
 *   cast:     [{ name, archetype, stats, secret? }]  (secret = canon, from the roster)
 *   existing: the season's current map (the user's keeps, rerolls and own)
 *   taken:    pool ids nobody may draw (canon held by anybody in the roster)
 * Returns a new map name → entry; never changes a canon or a user's choice.
 */
export function castSecrets(cast = [], { existing = {}, taken = new Set(), rng = Math.random } = {}) {
  const used = new Set(taken);
  const out = {};
  // Canon and choices first, so a draw can never collide with them.
  for (const p of cast) {
    if (p?.secret?.text) { out[p.name] = { ...asEntry(p.secret, 'canon'), firstSeason: p.secret.firstSeason || null }; if (p.secret.id) used.add(p.secret.id); continue; }
    const mine = existing[p.name];
    if (mine?.text) { out[p.name] = mine; if (mine.id) used.add(mine.id); }
  }
  for (const p of cast) {
    if (out[p.name]) continue;
    const e = drawSecret(p, { rng, taken: used });
    if (!e) continue;
    used.add(e.id);
    out[p.name] = asEntry(e, 'pool');
  }
  return out;
}

/** A fresh draw for one housemate, leaving everybody else's alone. */
export function rerollSecret(player, secrets = {}, { taken = new Set(), rng = Math.random } = {}) {
  const used = new Set(taken);
  for (const e of Object.values(secrets)) if (e?.id) used.add(e.id);
  const e = drawSecret(player, { rng, taken: used });
  return e ? asEntry(e, 'pool') : null;
}

/** A secret the user wrote, with its kind's clues and tells. */
export function writtenSecret(text, kind) {
  return text && String(text).trim() ? asEntry(ownSecret(text, kind), 'own') : null;
}

/**
 * Who would recognise whom on launch night, and from where.
 *   careers:  { name: careerOf(name) }
 *   fame:     { name: 0..1 } how famous across the franchise (popularity)
 * Two housemates who played the same season know each other ("from Total
 * Drama 3"). A famous face is recognised by others with a chance that grows
 * with their fame; the draw is made here, once, and stored.
 */
export function recognitions(cast = [], { careers = {}, fame = {}, rng = Math.random } = {}) {
  const names = cast.map(p => (typeof p === 'string' ? p : p?.name)).filter(Boolean);
  const out = [];
  const seen = new Set();
  const key = (a, b) => `${a}>${b}`;
  for (const a of names) {
    for (const b of names) {
      if (a === b) continue;
      const shared = (careers[a] || []).find(x => (careers[b] || []).some(y => y.format === x.format && y.num === x.num));
      if (shared && !seen.has(key(a, b))) { out.push({ who: a, whom: b, from: shared.where, shared: true }); seen.add(key(a, b)); }
    }
  }
  for (const b of names) {
    const f = Math.max(0, Math.min(1, Number(fame[b]) || 0));
    if (!f || !(careers[b] || []).length) continue;
    const show = (careers[b] || [])[careers[b].length - 1]?.where || null;
    for (const a of names) {
      if (a === b || seen.has(key(a, b))) continue;
      if (rng() < f * 0.6) { out.push({ who: a, whom: b, from: show, famous: true }); seen.add(key(a, b)); }
    }
  }
  return out;
}

/** The season's nomination rule, the draw made once when it is 'random'. */
export function resolveNominationRule(rule, rng = Math.random) {
  if (rule === 'gendered' || rule === 'mixed') return rule;
  return rng() < 0.5 ? 'gendered' : 'mixed';
}

export { SECRET_KINDS, SECRET_POOL };
