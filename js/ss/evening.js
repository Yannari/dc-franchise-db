// ══════════════════════════════════════════════════════════════════════
// ss/evening.js — the Voice's evening games, and the black buzzer
// ══════════════════════════════════════════════════════════════════════
//
// From the real dailies (docs/research/secret-story-transcripts.md §2):
//
// - THE "OOPS" NIGHT: the Voice reads statements ("one of you thinks somebody
//   has an accomplice", "one of you finds someone fake", "one of you has a
//   crush") and whoever it fits raises a sign. It sets off accusations said to
//   the face, crushes admitted in front of everybody, and a confession a
//   housemate had been saving to mislead the hunters.
// - MINI-SECRETS: the Voice tells a small true anecdote about somebody; the
//   first to buzz the right name wins $200, a wrong name costs $100.
// - THE BLACK BUZZER: hidden in the house; whoever finds it is immune this
//   week and names a nominee themselves.
//
// Every statement is built from what is true in the state, and every one has
// a consequence (bonds, the public, the hunt's evidence, the kitty). Pure:
// the adapter (js/bb/secret-story.js) applies `effects`.

import { mint, burn } from './kitty.js';
import { addEvidence, nearMisses, secretOf } from './hunt.js';

const pick = (l, rng) => l[Math.floor(rng() * l.length) % Math.max(1, l.length)];
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

// small, true, harmless: the Voice's anecdotes (one per housemate, kept all season)
export const MINI_SECRETS = [
  'never learned to ride a bike', 'still sleeps with the light on', 'once fell asleep at their own birthday party',
  'has a tattoo nobody in here has seen', 'cried at a cartoon about a lost dog', 'was the school spelling champion',
  'has been stung by a jellyfish three times', 'once got stuck in a lift for six hours', 'talks to their plants every morning',
  'can recite every capital city in the world', 'has never eaten a single vegetable willingly', 'sang in a church choir for six years',
  'broke an arm falling off a trampoline at twenty-five', 'has a collection of more than two hundred snow globes',
  'once won a hot-dog eating contest', 'is terrified of butterflies', 'learned to drive in a field, aged twelve',
  'had a pet duck that followed them to school', 'sings in the shower every single day, loudly', 'has never seen the sea in winter',
];

// ── the "Oops" night ─────────────────────────────────────────────────────
// Each statement: whom it fits (from the truth), and what raising the sign sets off.
const STATEMENTS = [
  { id: 'accomplice', text: ['One of you thinks somebody in this house has an accomplice.', 'One of you is convinced two people in here share a secret.', "One of you thinks somebody isn't playing this game alone."],
    fit: (st, ctx, n, room) => room.find(t => t !== n && (st.theories?.[n]?.[t]) && (secretOf(st, t)?.holders || []).length > 1) || null },
  { id: 'fake', text: ['One of you finds someone in this house fake.', "One of you doesn't believe a word somebody in here says.", 'One of you thinks someone in here is playing a character.'],
    fit: (st, ctx, n, room) => room.filter(t => t !== n && ctx.bond(n, t) <= -2).sort((a, b) => ctx.bond(n, a) - ctx.bond(n, b))[0] || null },
  { id: 'crush', text: ['One of you has a crush on someone in this house.', 'One of you has feelings for somebody in this room.', "One of you can't stop thinking about someone in here."],
    fit: (st, ctx, n, room) => room.filter(t => t !== n && ctx.compat(n, t) && ctx.bond(n, t) >= 4).sort((a, b) => ctx.bond(n, b) - ctx.bond(n, a))[0] || null },
  { id: 'wrong-buzz', text: ['One of you has already lost money on a wrong buzz.', 'One of you pressed the buzzer and got it completely wrong.', 'One of you paid five thousand dollars to be wrong.'],
    fit: (st, ctx, n) => ((st.buzzes || []).find(b => b.by === n && !b.right)?.target) || null },
  { id: 'know', text: ["One of you is sure they know somebody's secret, and hasn't buzzed.", 'One of you knows a secret in this house and is keeping quiet about it.', 'One of you is just waiting for the right moment to buzz.'],
    fit: (st, ctx, n, room) => room.find(t => t !== n && st.theories?.[n]?.[t]?.right && !secretOf(st, t)?.found && (Number(st.theories[n][t].conf) || 0) >= 0.45) || null },
  { id: 'mislead', text: ['One of you has told the house something about their secret that is not true.', 'One of you has been lying about their own secret.', 'One of you has been laying a false trail.'],
    // a housemate who plays the bluff, with a secret still standing
    fit: (st, ctx, n) => (secretOf(st, n) && !secretOf(st, n).found && (ctx.play(n)?.bluff || 0) >= 0.08) ? n : null },
];

/**
 * The Voice's "Oops" night. Returns { statements: [{ id, text, raised: [{ who, about, honest }],
 * hid: [names who fit and kept their sign down], scene }], effects }.
 */
export function oopsNight(state, ctx, { house = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const room = house.filter(Boolean);
  const fx = { bond: [], pub: [] };
  const said = new Set(state.oopsSaid || []);
  const key = (id, n) => `${id}|${n}`;
  const chosen = STATEMENTS.map(s => ({ s, fits: room.map(n => [n, s.fit(state, ctx, n, room)]).filter(([n, t]) => t && !said.has(key(s.id, n))) }))
    .filter(x => x.fits.length).sort(() => rng() - 0.5).slice(0, 4);
  if (chosen.length < 2) return null;
  const out = [];
  const callers = new Set();
  for (const { s, fits } of chosen) {
    const raised = [], hid = [];
    for (const [n, about] of fits.slice(0, s.id === 'crush' ? 1 : 2)) {
      // raising the sign is bold; a player who weighs how it looks may keep it down on a game statement
      const nerve = 0.45 + ctx.stat(n, 'boldness') * 0.05 - (s.id === 'know' || s.id === 'mislead' ? ctx.stat(n, 'strategic') * 0.03 : 0) - ctx.looks(n) * 0.1;
      if (rng() < clamp(nerve, 0.1, 0.92)) { raised.push({ who: n, about }); (state.oopsSaid ||= []).push(key(s.id, n)); } else hid.push(n);
    }
    const st = { id: s.id, text: s.text[((ctx.week ?? 0) + out.length) % s.text.length], raised, hid, scene: [] };
    for (const r of raised) {
      if (s.id === 'fake') {
        // the accusation, to the face
        fx.bond.push([r.who, r.about, -1.5]);
        fx.pub.push([r.who, 'real', 0.15, `told ${r.about} to the face they were fake`], [r.who, 'heat', 0.12, `called ${r.about} fake in front of everybody`], [r.about, 'pity', 0.1, 'was called fake in front of the house']);
        st.scene.push({ kind: 'accuse', who: r.who, about: r.about, answer: ctx.stat(r.about, 'temperament') < 5 ? 'snaps' : 'shrugs' });
        if (ctx.stat(r.about, 'temperament') < 5) fx.bond.push([r.about, r.who, -0.5]);
      } else if (s.id === 'crush') {
        // the crush, admitted in front of everybody; returned or not
        const theirs = room.filter(t => t !== r.about && ctx.compat(r.about, t)).sort((a, b) => ctx.bond(r.about, b) - ctx.bond(r.about, a))[0];
        const back = theirs === r.who && ctx.bond(r.about, r.who) >= 3;
        fx.bond.push([r.who, r.about, back ? 1.2 : 0.4]);
        fx.pub.push([r.who, 'arc', 0.18, `admitted a crush on ${r.about} in front of the house`], [r.who, 'warmth', 0.1, 'admitted a crush in front of the house']);
        if (back) fx.pub.push([r.about, 'arc', 0.12, `found out ${r.who} has a crush on them`]);
        st.scene.push({ kind: 'crush', who: r.who, about: r.about, back });
      } else if (s.id === 'accomplice') {
        // the house hears the theory: everybody looks at the pair a little harder
        for (const o of room) if (o !== r.who && o !== r.about) addEvidence(state, ctx, o, r.about, { strength: 0.06, how: 'oops' });
        fx.bond.push([r.about, r.who, -0.6]);
        fx.pub.push([r.who, 'game', 0.12, 'said out loud who they think has an accomplice']);
        st.scene.push({ kind: 'accomplice', who: r.who, about: r.about });
      } else if (s.id === 'wrong-buzz') {
        fx.pub.push([r.who, 'fun', 0.12, 'laughed at their own wrong buzz in front of everybody']);
        st.scene.push({ kind: 'wrong-buzz', who: r.who, about: r.about });
      } else if (s.id === 'know') {
        // they raise it: the target now knows somebody is close
        fx.pub.push([r.who, 'game', 0.15, "told the house they know somebody's secret"], [r.who, 'heat', 0.08, "told the house they know somebody's secret"]);
        st.scene.push({ kind: 'know', who: r.who, about: r.about });
      } else if (s.id === 'mislead') {
        // the confession saved to mislead the hunters: a false trail, laid in front of everybody
        const sec = secretOf(state, r.who);
        const decoy = sec ? pick(nearMisses(sec), rng) : null;
        if (decoy) for (const o of room) if (o !== r.who) addEvidence(state, ctx, o, r.who, { strength: 0.12, how: 'oops', toward: decoy });
        fx.pub.push([r.who, 'game', 0.2, 'laid a false trail about their own secret in front of the house']);
        st.scene.push({ kind: 'mislead', who: r.who, decoy });
      }
    }
    // a sign kept down when the house knows better: somebody calls it out
    for (const n of hid.slice(0, 1)) {
      const caller = room.filter(o => o !== n && !callers.has(o) && ctx.bond(o, n) >= 4).sort((a, b) => ctx.stat(b, 'boldness') - ctx.stat(a, 'boldness'))[0];
      if (caller && rng() < 0.45) {
        callers.add(caller);
        fx.pub.push([n, 'fun', 0.08, `got caught keeping their sign down by ${caller}`]);
        st.scene.push({ kind: 'caught', who: n, by: caller });
      }
    }
    out.push(st);
  }
  for (const st of out) for (const r of st.raised) fx.pub.push([r.who, 'seen', 0.12, '']);
  return { statements: out, effects: fx };
}

// ── mini-secrets ─────────────────────────────────────────────────────────
/** Each housemate's anecdote, drawn once and kept. */
export function miniSecretOf(state, n, rng = Math.random) {
  state.minis ||= {};
  if (!state.minis[n]) {
    const used = new Set(Object.values(state.minis));
    const free = MINI_SECRETS.filter(x => !used.has(x));
    state.minis[n] = pick(free.length ? free : MINI_SECRETS, rng);
  }
  return state.minis[n];
}

/**
 * Mini-secrets night: three anecdotes; for each, the first to buzz and whether they were right.
 * A friend is likelier to know; a bold player buzzes first. Right +$200 (the Voice mints), wrong -$100.
 */
export function miniSecretsNight(state, ctx, { house = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const room = house.filter(Boolean);
  if (room.length < 4) return null;
  const fx = { bond: [], pub: [] };
  const told = new Set(state.minisTold || []);
  const subjects = room.filter(n => !told.has(n)).sort(() => rng() - 0.5).slice(0, 3);
  if (subjects.length < 2) return null;
  (state.minisTold ||= []).push(...subjects);
  const rounds = [];
  for (const s of subjects) {
    const fact = miniSecretOf(state, s, rng);
    const others = room.filter(n => n !== s);
    const speed = n => ctx.stat(n, 'boldness') + rng() * 10 - rounds.filter(r => r.first === n).length * 4;
    const first = others.map(n => [n, speed(n)]).sort((a, b) => b[1] - a[1])[0][0];
    const knows = rng() < clamp(0.08 + Math.max(0, ctx.bond(first, s)) * 0.05 + ctx.stat(first, 'intuition') * 0.025, 0.05, 0.7);
    const guess = knows ? s : pick(others.filter(n => n !== first), rng) || s;
    const right = guess === s;
    const money = right ? mint(state, first, 200, `guessed ${s}'s mini-secret`, ctx.week ?? 0) : burn(state, first, 100, 'buzzed a wrong name at mini-secrets', ctx.week ?? 0);
    if (right) fx.bond.push([first, s, 0.4]);
    fx.pub.push([s, 'fun', 0.08, `had "${fact}" told to the whole house`], [first, 'seen', 0.08, '']);
    rounds.push({ subject: s, fact, first, guess, right, money, close: ctx.bond(first, s) >= 3 });
  }
  return { rounds, effects: fx };
}

// ── the black buzzer ─────────────────────────────────────────────────────
/**
 * The Voice hides the black buzzer. The finder is immune this week and names one nominee.
 * Returns { finder, named, why } or null; writes the immunity and the nomination into the rules.
 */
export function blackBuzzer(state, ctx, { house = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const room = house.filter(Boolean);
  if (room.length < 5) return null;
  const wk = ctx.week ?? 0;
  const finder = room.slice().sort((a, b) => (ctx.stat(b, 'intuition') + rng() * 7) - (ctx.stat(a, 'intuition') + rng() * 7))[0];
  const immune = new Set([...(state.nextImmune?.[wk] || []), finder]);
  // who they name: their worst bond; a player who weighs the public avoids the country's favourite
  const named = room.filter(n => !immune.has(n))
    .sort((a, b) => (ctx.bond(finder, a) + ctx.looks(finder) * ctx.pop(a)) - (ctx.bond(finder, b) + ctx.looks(finder) * ctx.pop(b)))[0];
  if (!named) return null;
  (state.nextImmune ||= {});
  (state.nextImmune[wk] ||= []).includes(finder) || state.nextImmune[wk].push(finder);
  state.rules ||= { log: [], dOffice: {}, extraVotes: {}, house: {} };
  (state.rules.dOffice[wk] ||= []).includes(named) || state.rules.dOffice[wk].push(named);
  (state.blackBuzzers ||= []).push({ week: wk, finder, named });
  const why = ctx.bond(finder, named) <= -2 ? 'grudge' : ctx.pop(named) > 0.5 ? 'threat' : 'game';
  return { finder, named, why, effects: { bond: [[finder, named, -2], [named, finder, -1.5]],
    pub: [[finder, 'game', 0.15, 'found the black buzzer and used it'], [finder, 'heat', 0.2, `nominated ${named} with the black buzzer`], [named, 'pity', 0.15, 'was nominated with the black buzzer']] } };
}
