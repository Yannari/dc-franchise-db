// ══════════════════════════════════════════════════════════════════════
// bb/secret-story.js — Secret Story, played as a Big Brother MODE
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-24: "end it with secret story theme ... 1:1 of the real
// show". The design (memory: project_secret_story_design) and the format, as
// the classic French seasons ran it:
//
//   · every houseguest moves in with a SECRET, and the house is told there are
//     secrets but not whose. Find somebody's and you take their money.
//   · each houseguest starts with a kitty (here €10,000). Pressing the buzzer
//     and naming a secret costs a stake: right, and you take the target's whole
//     kitty and the secret is out; wrong, and the stake goes to the person you
//     wrongly accused, in front of everybody.
//   · there is no Head of Household and no veto. The week's competition is for
//     IMMUNITY. In the Diary Room the house nominates, girls against boys or
//     boys against girls, and the most-nominated face the public.
//   · the PUBLIC evicts, and the public crowns the winner, who takes their kitty.
//   · the house is run by The Voice, who speaks from everywhere and nowhere.
//
// WHICH SECRETS. Real ones first, never invented biography (CLAUDE.md, and the
// continuity rule "quote-or-it-is-not-canon"): two houseguests the roster says
// are siblings, a couple, exes; a houseguest who has already won or played this
// franchise. Everybody the roster says nothing about is handed a role BY THE
// VOICE, which is what the show itself did (its fake couples and missions): a
// fake couple, a pair of fake siblings, a secret mission. None of those claims
// anything about the person; they are jobs.
import { gs, players, seasonConfig, kinshipPairs } from '../core.js';
import { pStats } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { careerOf } from '../franchise-meta.js';

export const KITTY_START = 10000;
export const BUZZ_STAKE = 5000;
export const ssOn = () => seasonConfig?.bbSecretStory === 'on';

const st = (n, k) => { try { return Number(pStats(n)?.[k]) || 5; } catch { return 5; } };
const genderOf = n => (players || []).find(p => p.name === n)?.gender || null;
const bond = (a, b) => { try { return getBond(a, b) || 0; } catch { return 0; } };
const pop = n => Number(gs.popularity?.[n] || 0);
const addPop = (n, d) => { gs.popularity ||= {}; gs.popularity[n] = Math.round(((gs.popularity[n] || 0) + d) * 100) / 100; };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** The season's secret-story state, created on first touch. Plain JSON. */
export function ssState() {
  gs.bb ||= {};
  return gs.bb.secretStory || null;
}

// The relations the roster can carry that make a real pair secret.
const PAIR_KIN = {
  twins: 'twins', siblings: 'brother and sister', 'step-siblings': 'step-siblings', married: 'married',
  engaged: 'engaged', partners: 'a couple', dating: 'a couple', exes: 'exes', 'parent-child': 'parent and child',
  cousins: 'cousins', 'best-friends': 'best friends', 'childhood-friends': 'childhood friends',
};

/**
 * Night one: everybody's secret. Returns the act, or null when the house is too small.
 */
export function assignSecrets({ house = [], rng = Math.random } = {}) {
  const room = house.filter(Boolean);
  if (room.length < 6) return null;
  const secrets = [];
  const taken = new Set();

  // ── real pairs, from the roster's ties ──
  let pairs = [];
  try { pairs = kinshipPairs() || []; } catch { pairs = []; }
  for (const p of pairs) {
    const kin = PAIR_KIN[p.kin];
    if (!kin || !room.includes(p.a) || !room.includes(p.b) || taken.has(p.a) || taken.has(p.b)) continue;
    secrets.push({ id: `kin-${p.a}-${p.b}`, kind: 'real-pair', holders: [p.a, p.b],
      text: `We are ${kin}`, difficulty: 0.55 });
    taken.add(p.a); taken.add(p.b);
  }

  // ── real careers ──
  for (const n of room) {
    if (taken.has(n)) continue;
    let career = [];
    try { career = careerOf(n) || []; } catch { career = []; }
    if (!career.length) continue;
    const won = career.find(c => c.rec?.winner);
    const fin = career.find(c => c.rec?.finalist);
    const text = won ? `I have already won ${won.where}`
      : fin ? `I made the final of ${fin.where}`
        : `I have played this franchise before, on ${career[career.length - 1].where}`;
    secrets.push({ id: `career-${n}`, kind: 'real-career', holders: [n], text, difficulty: won ? 0.35 : 0.5 });
    taken.add(n);
  }

  // ── the Voice's roles, for everybody the roster is silent about ──
  let rest = room.filter(n => !taken.has(n));
  // shuffle
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  const men = rest.filter(n => genderOf(n) === 'm');
  const women = rest.filter(n => genderOf(n) === 'f');
  while (men.length && women.length && rest.length >= 2) {
    const a = women.shift(), b = men.shift();
    secrets.push({ id: `fake-couple-${a}-${b}`, kind: 'voice-pair', holders: [a, b], text: 'We are a fake couple, cast by The Voice', difficulty: 0.6 });
    taken.add(a); taken.add(b);
    rest = rest.filter(n => n !== a && n !== b);
    if (secrets.filter(s => s.kind === 'voice-pair').length >= 1) break;   // one fake couple a season, as the show ran it
  }
  rest = rest.filter(n => !taken.has(n));
  while (rest.length >= 2 && secrets.filter(s => s.text.startsWith('We are fake siblings')).length < 1) {
    const [a, b] = rest.splice(0, 2);
    secrets.push({ id: `fake-siblings-${a}-${b}`, kind: 'voice-pair', holders: [a, b], text: 'We are fake siblings, cast by The Voice', difficulty: 0.65 });
    taken.add(a); taken.add(b);
  }
  // A role, not a biography: anybody left gets a mission from The Voice, each one different (the
  // show's own missions: get somebody nominated, fake a rivalry, report on the house). Some name a
  // second houseguest, who is in on nothing.
  const others = n => room.filter(x => x !== n);
  const MISSIONS = [
    n => 'I am The Voice\'s double agent, and I report on this house',
    n => { const t = others(n)[Math.floor(rng() * others(n).length)]; return `My mission is to get ${t} nominated`; },
    n => { const t = others(n)[Math.floor(rng() * others(n).length)]; return `I have to keep a fake feud going with ${t}`; },
    n => { const t = others(n)[Math.floor(rng() * others(n).length)]; return `The Voice told me ${t}'s secret`; },
    n => 'I must convince the house that I am a twin',
    n => { const t = others(n)[Math.floor(rng() * others(n).length)]; return `I have to win ${t}'s trust without saying why`; },
    n => 'I hold a second key to the confessional',
    n => 'I have to cry in front of the whole house once a week',
  ];
  let mi = Math.floor(rng() * MISSIONS.length);
  for (const n of rest) {
    const text = MISSIONS[mi++ % MISSIONS.length](n);
    secrets.push({ id: `mission-${n}`, kind: 'voice-mission', holders: [n], text, difficulty: 0.7 });
    taken.add(n);
  }

  gs.bb ||= {};
  gs.bb.secretStory = {
    secrets: secrets.map(s => ({ ...s, found: false, foundBy: null, week: null })),
    kitty: Object.fromEntries(room.map(n => [n, KITTY_START])),
    suspicion: {},
    buzzes: [],
  };
  // a mission that says The Voice told somebody a secret is knowledge they really hold
  for (const s of gs.bb.secretStory.secrets) {
    const m = /^The Voice told me (.+)'s secret$/.exec(s.text);
    if (m && room.includes(m[1])) (gs.bb.secretStory.suspicion[s.holders[0]] ||= {})[m[1]] = 0.9;
  }
  return {
    type: 'ss-secrets', week: 1, secret: true,
    secrets: secrets.map(s => ({ holders: [...s.holders], text: s.text, kind: s.kind })),
    kitty: KITTY_START, stake: BUZZ_STAKE,
    beats: [{ text: `Every houseguest moves in with a secret and ${KITTY_START.toLocaleString()} euros in the kitty.`, players: room.slice(0, 4), badgeText: 'THE SECRETS', badgeClass: 'gold', part: 'rules' }],
  };
}

const secretOf = (state, n) => (state?.secrets || []).find(s => s.holders.includes(n)) || null;

/**
 * The week's hunt: suspicion grows, and the bold press the buzzer. Returns the buzz acts.
 */
export function runSecretHunt({ week = undefined, house = [], rng = Math.random } = {}) {
  const state = ssState();
  if (!state) return [];
  const room = house.filter(Boolean);
  const acts = [];
  // ── suspicion: everybody watches somebody ──
  for (const n of room) {
    const looks = room.filter(x => x !== n && !(secretOf(state, x)?.found) && !secretOf(state, n)?.holders.includes(x));
    for (let k = 0; k < 2 && looks.length; k++) {
      const t = looks.splice(Math.floor(rng() * looks.length), 1)[0];
      const s = secretOf(state, t);
      if (!s) continue;
      // a pair gives itself away by being together; a nervous holder by being nervous
      const tell = s.holders.length > 1 ? 0.12 : 0.04;
      const gain = (st(n, 'intuition') * 0.03 + tell + (10 - st(t, 'temperament')) * 0.01) * (1 - s.difficulty * 0.6) * (0.5 + rng());
      state.suspicion[n] ||= {};
      state.suspicion[n][t] = Math.round(clamp((state.suspicion[n][t] || 0) + gain, 0, 1) * 100) / 100;
    }
  }
  // ── the buzzer ──
  const candidates = [];
  for (const n of room) {
    const sus = state.suspicion[n] || {};
    const [t, conf] = Object.entries(sus).filter(([x]) => room.includes(x) && !secretOf(state, x)?.found).sort((a, b) => b[1] - a[1])[0] || [];
    if (!t || (state.kitty[n] || 0) < BUZZ_STAKE) continue;
    if ((Number(week?.num) || 1) < 2) continue;
    const nerve = (conf - 0.35) * 1.3 + st(n, 'boldness') * 0.02;
    if (rng() < clamp(nerve, 0, 0.6)) candidates.push({ n, t, conf });
  }
  candidates.sort((a, b) => b.conf - a.conf);
  for (const c of candidates.slice(0, 2)) {
    const s = secretOf(state, c.t);
    if (!s || s.found) continue;
    const right = rng() < clamp(c.conf * 0.75 + st(c.n, 'intuition') * 0.025 - s.difficulty * 0.2, 0.05, 0.9);
    const others = (state.secrets || []).filter(x => x !== s && !x.found).map(x => x.text);
    const wrongGuess = others.length ? others[Math.floor(rng() * others.length)] : 'We are a couple';
    const record = { week: week?.num || 0, by: c.n, target: c.t, guess: right ? s.text : wrongGuess, right };
    if (right) {
      const took = state.kitty[c.t] || 0;
      state.kitty[c.n] = (state.kitty[c.n] || 0) + took;
      state.kitty[c.t] = 0;
      s.found = true; s.foundBy = c.n; s.week = week?.num || 0;
      record.took = took;
      addPop(c.n, 1.2); addPop(c.t, 0.4);
      try { addBond(c.t, c.n, -2); for (const h of s.holders) if (h !== c.t) addBond(h, c.n, -1.2); } catch { /* */ }
    } else {
      state.kitty[c.n] = (state.kitty[c.n] || 0) - BUZZ_STAKE;
      state.kitty[c.t] = (state.kitty[c.t] || 0) + BUZZ_STAKE;
      record.lost = BUZZ_STAKE;
      addPop(c.n, -0.4);
      try { addBond(c.t, c.n, -1.4); } catch { /* */ }
      // and the house now knows who suspects whom
      for (const n of room) if (n !== c.n && n !== c.t && rng() < 0.3) { try { addBond(n, c.n, -0.2); } catch { /* */ } }
    }
    state.buzzes.push(record);
    acts.push({
      type: 'ss-buzz', week: week?.num || 0, by: c.n, target: c.t, right, secretText: s.text, holders: [...s.holders], guess: record.guess,
      took: record.took || 0, lost: record.lost || 0, kitty: { [c.n]: state.kitty[c.n], [c.t]: state.kitty[c.t] },
      beats: [{ text: right ? `${c.n} presses the buzzer, names ${c.t}'s secret, and takes the kitty.` : `${c.n} presses the buzzer on ${c.t} and gets the secret wrong.`,
        players: [c.n, c.t], badgeText: right ? 'SECRET FOUND' : 'WRONG BUZZ', badgeClass: right ? 'gold' : 'red', part: right ? 'found' : 'wrong' }],
    });
  }
  return acts;
}

/**
 * The Diary Room nominations: one sex nominates two of the other, and the two most named go up.
 * Odd weeks the women nominate the men; even weeks the men nominate the women. A side too small
 * to nominate from (or a house with no gender on the roster) nominates freely.
 */
export function secretStoryNominations({ week = undefined, house = [], immune = [], rng = Math.random } = {}) {
  const room = house.filter(Boolean);
  const wk = Number(week?.num) || 1;
  const nominateMen = wk % 2 === 1;
  const g = genderOf;
  let voters, pool, rule;
  const men = room.filter(n => g(n) === 'm'), women = room.filter(n => g(n) === 'f');
  const eligible = l => l.filter(n => !immune.includes(n));
  if (nominateMen && eligible(men).length >= 2 && women.length) {
    voters = room.filter(n => g(n) !== 'm'); pool = eligible(men); rule = 'women-nominate-men';
  } else if (!nominateMen && eligible(women).length >= 2 && men.length) {
    voters = room.filter(n => g(n) !== 'f'); pool = eligible(women); rule = 'men-nominate-women';
  } else {
    voters = room; pool = eligible(room); rule = 'everybody';
  }
  const ballots = [];
  const tally = Object.fromEntries(pool.map(n => [n, 0]));
  for (const v of voters) {
    const choices = pool.filter(n => n !== v);
    const want = n => -bond(v, n) * 0.6 + (st(n, 'physical') + st(n, 'strategic')) * 0.08 + rng() * 2.2;
    const picks = choices.sort((a, b) => want(b) - want(a)).slice(0, 2);
    for (const p of picks) tally[p] = (tally[p] || 0) + 1;
    ballots.push({ voter: v, picks });
  }
  const ranked = Object.keys(tally).sort((a, b) => tally[b] - tally[a] || (rng() - 0.5));
  const nominees = ranked.slice(0, 2);
  const tie = ranked.length > 2 && tally[ranked[1]] === tally[ranked[2]];
  return { nominees, ballots, tally, rule, voiceTie: tie };
}

// How the country splits its vote: popularity sets the order, but nobody who made it this far is
// voted for by nobody. A floor under every name, then the gap between them, plus the night's noise.
function shares(names, rng, noise) {
  const lo = Math.min(...names.map(pop));
  return Object.fromEntries(names.map(n => [n, Math.max(0.4, 3 + (pop(n) - lo) * 0.6 + (rng() - 0.5) * noise)]));
}

/** The public's eviction vote: the nominee the country likes least goes. Percentages to SAVE. */
export function secretStoryPublicVote({ nominees = [], rng = Math.random } = {}) {
  if (!nominees.length) return null;
  const s = shares(nominees, rng, 2.5);
  const total = Object.values(s).reduce((a, b) => a + b, 0) || 1;
  const percents = Object.fromEntries(nominees.map(n => [n, Math.round((s[n] / total) * 1000) / 10]));
  const evicted = nominees.slice().sort((a, b) => percents[a] - percents[b])[0];
  return { evicted, percents, saved: nominees.filter(n => n !== evicted) };
}

/** The public's final vote, among the finalists. The winner takes their kitty. */
export function secretStoryFinalVote({ finalists = [], rng = Math.random } = {}) {
  if (!finalists.length) return null;
  const state = ssState();
  const s = shares(finalists, rng, 2);
  const total = Object.values(s).reduce((a, b) => a + b, 0) || 1;
  const percents = Object.fromEntries(finalists.map(n => [n, Math.round((s[n] / total) * 1000) / 10]));
  const order = finalists.slice().sort((a, b) => percents[b] - percents[a]);
  const winner = order[0];
  return { winner, order, percents, kitty: state?.kitty?.[winner] ?? KITTY_START,
    secrets: (state?.secrets || []).map(x => ({ holders: [...x.holders], text: x.text, found: x.found, foundBy: x.foundBy })) };
}
