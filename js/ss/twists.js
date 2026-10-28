// ══════════════════════════════════════════════════════════════════════
// ss/twists.js — the twist catalog and the season randomizer
// ══════════════════════════════════════════════════════════════════════
//
// Part 2 design §13. The user, part 1: "every season use different twists ...
// a randomizer that knows where to put each so each season is always
// different from the others", and "two seasons can't feel the same, but a
// signature twist like the red phone or the secret room can always be there,
// cause the real show always does that".
//
// Two layers:
//   SIGNATURES  one per season, the season's identity (the real seasons each
//               had one: the masters of the nominations, the thieves, the
//               intruders' tunnel, the Secret Box...). `built` says whether
//               the engine plays it yet; the draw only takes built ones.
//   TOOLS       recurring pieces any season can have, in any number: the red
//               phone, the secret room, the room of truths, visits, parties,
//               the store, dilemmas. Each has a frequency the draw sets.
//
// The draw is scored against every past Secret Story season in the franchise
// ledger (same signature, same tools at the same strength, same secret-room
// week): above a ceiling it draws again. A setting can lock any piece.
//
// Pure: a draw is plain JSON on the season's state.

/** Signature twists, from the real seasons (docs/research/secret-story-france.md). */
export const SIGNATURES = [
  { id: 'masters', name: 'The Masters of the Nominations', from: 'S7', built: true,
    what: 'a secret pair adds a nominee every week until somebody finds their secret' },
  { id: 'thieves', name: 'The House Thieves', from: 'S12', built: true,
    what: 'a pair starts with nothing and steals from the kitties every week until they are found' },
  { id: 'intruders', name: 'The Intruders', from: 'S3', built: false, what: 'a group hides in a second house reached by a tunnel, and swaps in later' },
  { id: 'antechamber', name: 'The Antechamber', from: 'S4', built: false, what: 'three sacrificed at the door watch the house and must name who sacrificed them' },
  { id: 'labyrinth', name: 'The Labyrinth', from: 'S5', built: false, what: 'two masters of the tunnels spy on the house and nominate somebody for life' },
  { id: 'secret-box', name: 'The Secret Box', from: 'S6', built: false, what: 'three watch from a tinted cube in the living room; find one secret to take that person\'s place' },
  { id: 'seven-rooms', name: 'The Seven Rooms', from: 'S7', built: false, what: 'seven secret rooms behind an elevator, seven mysteries' },
  { id: 'impostors', name: 'The Impostors', from: 'S8', built: false, what: 'four play eight people from a hidden zone' },
  { id: 'neighbours', name: 'The Neighbours', from: 'S9, S11', built: false, what: 'a small second house with trapdoors into the main one' },
  { id: 'hotel', name: 'The Hotel of Secrets', from: 'S10', built: false, what: 'a hidden hotel next door, and six faces among two hundred portraits' },
  { id: 'fake-house', name: 'The Fake House', from: 'S12', built: false, what: 'night one in a fake house with a fake Voice' },
  { id: 'crystal-house', name: 'The Crystal House', from: 'S13', built: false, what: 'a glass house; the main house must guess how many live there' },
  { id: 'common-secret', name: 'The Common Secret', from: 'S7', built: false, what: 'one secret shared by the whole house; nobody finds it and everybody is nominated' },
];

/**
 * The recurring tools and the strengths a season can have them at. The prime,
 * the parties and the store read these (js/ss/prime.js, js/bb/secret-story.js).
 */
export const TOOLS = {
  phone: { name: 'The red phone', levels: ['none', 'some', 'often'], weights: [0.2, 0.5, 0.3] },
  secretRoom: { name: 'The secret room', levels: ['off', 'on'], weights: [0.3, 0.7] },
  truths: { name: 'The room of truths', levels: ['none', 'some', 'often'], weights: [0.35, 0.45, 0.2] },
  visits: { name: 'Visits from home', levels: ['none', 'some', 'often'], weights: [0.2, 0.55, 0.25] },
  dilemmas: { name: 'Dilemmas', levels: ['few', 'many'], weights: [0.55, 0.45] },
  parties: { name: 'Party nights', levels: ['some', 'often'], weights: [0.4, 0.6] },
  store: { name: 'The store', levels: ['off', 'on'], weights: [0.3, 0.7] },
};

/** How often a level makes a tool fire on a prime (or a week). */
export const RATE = {
  phone: { none: 0, some: 0.3, often: 0.55 },
  truths: { none: 0, some: 0.22, often: 0.4 },
  visits: { none: 0, some: 0.28, often: 0.45 },
  dilemmas: { few: 0.2, many: 0.55 },        // the chance of a second dilemma
  parties: { some: 0.45, often: 0.7 },
};

const weighted = (levels, weights, rng) => {
  let r = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < levels.length; i++) { r -= weights[i]; if (r <= 0) return levels[i]; }
  return levels[levels.length - 1];
};

/** One random draw: a signature and every tool's level. `locks` pin any piece. */
function drawOnce(rng, { castSize = 14, locks = {} } = {}) {
  const built = SIGNATURES.filter(s => s.built);
  const signature = locks.signature === 'none' ? null
    : locks.signature ? (SIGNATURES.find(s => s.id === locks.signature && s.built)?.id || null)
      : (rng() < 0.85 ? built[Math.floor(rng() * built.length)].id : null);
  const tools = {};
  for (const [id, t] of Object.entries(TOOLS)) tools[id] = t.levels.includes(locks[id]) ? locks[id] : weighted(t.levels, t.weights, rng);
  const last = Math.max(3, castSize - 7);
  const secretRoomWeek = tools.secretRoom === 'on' && last >= 3 ? 3 + Math.floor(rng() * (last - 2)) : null;
  return { signature, tools, secretRoomWeek };
}

/**
 * How alike two draws are, 0..1: the signature counts most, then each tool's
 * level, then the secret room landing in the same week.
 */
export function sameness(a, b) {
  if (!a || !b) return 0;
  let s = 0, w = 0;
  s += (a.signature && a.signature === b.signature ? 1 : 0) * 3; w += 3;
  for (const id of Object.keys(TOOLS)) { s += a.tools?.[id] === b.tools?.[id] ? 1 : 0; w += 1; }
  s += (a.secretRoomWeek && a.secretRoomWeek === b.secretRoomWeek ? 1 : 0); w += 1;
  return s / w;
}

/**
 * The season's draw: redrawn until it is not too close to any past Secret
 * Story season (`past`: their draws), at most 40 tries (then the least alike).
 */
export function drawSeason({ castSize = 14, past = [], locks = {}, rng = Math.random, ceiling = 0.72 } = {}) {
  let best = null, bestScore = Infinity;
  for (let i = 0; i < 40; i++) {
    const d = drawOnce(rng, { castSize, locks });
    const worst = Math.max(0, ...past.map(p => sameness(d, p)));
    // the signature should not repeat the LAST season's, whatever the score
    const repeatsLast = d.signature && past.length && past[past.length - 1]?.signature === d.signature && !locks.signature;
    const score = worst + (repeatsLast ? 1 : 0);
    if (score < bestScore) { best = d; bestScore = score; }
    if (score <= ceiling) break;
  }
  return { ...best, sameness: Math.round(bestScore * 100) / 100 };
}

/** The catalog entry for a signature id. */
export const signatureOf = id => SIGNATURES.find(s => s.id === id) || null;
