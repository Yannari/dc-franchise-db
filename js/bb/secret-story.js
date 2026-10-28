// ══════════════════════════════════════════════════════════════════════
// bb/secret-story.js — Secret Story, played as a Big Brother MODE
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-24: "end it with secret story theme ... 1:1 of the real
// show". The design (memory: project_secret_story_design) and the format, as
// the classic French seasons ran it:
//
//   · every housemate moves in with a SECRET, and the house is told there are
//     secrets but not whose. Find somebody's and you take their money.
//   · each housemate starts with a kitty (here $10,000; the user chose dollars, 2026-10-27). Pressing the buzzer
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
// continuity rule "quote-or-it-is-not-canon"): two housemates the roster says
// are siblings, a couple, exes; a housemate who has already won or played this
// franchise. Everybody the roster says nothing about is handed a role BY THE
// VOICE, which is what the show itself did (its fake couples and missions): a
// fake couple, a pair of fake siblings, a secret mission. None of those claims
// anything about the person; they are jobs.
import { gs, players, seasonConfig, kinshipPairs, seasonFormat } from '../core.js';
import { SS_FORMAT, seasonId } from '../shows.js';
import { canonSecretsOf, pushCanonSecrets } from '../ss/canon.js';
import { castSecrets, recognitions, resolveNominationRule, SS_HOUSE_THEMES } from '../ss/casting.js';
import { KIND_KIT } from '../ss/secret-pool.js';
import { openKitties, ledgerOf, KITTY_START as LEDGER_START, BUZZ_STAKE as LEDGER_STAKE } from '../ss/kitty.js';
import { huntOf, huntDay, showClue, runBuzzes, secretOf } from '../ss/hunt.js';
import { weeklyRuleBreaks, dOfficeFor, extraVotesFor } from '../ss/voice.js';
import { resolveWeekly, settleWeeklyGame } from '../ss/games.js';
import { handOutMissions, playMissions, settleMissions } from '../ss/missions.js';
import { pStats } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { careerOf } from '../franchise-meta.js';

// The ledger owns the amounts (js/ss/kitty.js); re-exported for v1's callers.
export const KITTY_START = LEDGER_START;
export const BUZZ_STAKE = LEDGER_STAKE;
// The show, not a knob: a Secret Story season (or an old Big Brother one that
// ran the theme, which seasonFormat reads as Secret Story).
export const ssOn = () => seasonFormat(seasonConfig) === SS_FORMAT;

const st = (n, k) => { try { return Number(pStats(n)?.[k]) || 5; } catch { return 5; } };
const genderOf = n => (players || []).find(p => p.name === n)?.gender || null;
const archetypeOf = n => (players || []).find(p => p.name === n)?.archetype || null;
const statsOf = n => { try { return pStats(n) || {}; } catch { return {}; } };
const canonOf = n => (players || []).find(p => p.name === n)?.secret || null;
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
 * Night one, from the cast screen (js/ss/casting.js): every housemate walks in
 * with the secret they were shown there — a draw from the pool, one the user
 * wrote, a real tie to somebody else in the house, or their canon from an
 * earlier season. A housemate the screen never saw (added after) gets a draw.
 */
function assignChosenSecrets(room, chosen, rng) {
  const fill = castSecrets(room.map(n => ({ name: n, archetype: archetypeOf(n), stats: statsOf(n), secret: canonOf(n) })),
    { existing: chosen, rng });
  const secrets = [];
  const placed = new Set();
  for (const n of room) {
    if (placed.has(n)) continue;
    const e = fill[n];
    if (!e) continue;
    // A real tie is ONE secret two people share, if both are in the house.
    const holders = e.pair && room.includes(e.pair) && !placed.has(e.pair) ? [n, e.pair] : [n];
    secrets.push({ id: `secret-${holders.join('-')}`, kind: e.pair && holders.length > 1 ? 'real-pair' : 'personal',
      source: e.source, poolId: e.id || null, secretKind: e.kind || null, holders, text: e.text,
      clues: [...(e.clues || [])], tells: [...(e.tells || [])], difficulty: Number(e.difficulty) || 0.55 });
    for (const h of holders) placed.add(h);
  }
  return secrets;
}

/**
 * Night one: everybody's secret. Returns the act, or null when the house is too small.
 */
export function assignSecrets({ house = [], rng = Math.random } = {}) {
  const room = house.filter(Boolean);
  if (room.length < 6) return null;
  // A season started as the show (not an old Big Brother theme save) always
  // casts from the screen's choices, and draws the pool for anybody it lacks.
  const asShow = seasonConfig?.format === SS_FORMAT;
  const chosen = asShow || (seasonConfig?.ssSecrets && Object.keys(seasonConfig.ssSecrets).length)
    ? (seasonConfig?.ssSecrets || {}) : null;
  const secrets = chosen ? assignChosenSecrets(room, chosen, rng) : [];
  const taken = new Set(secrets.flatMap(s => s.holders));

  // ── v1, for a season the cast screen never saw (an old save, a headless run) ──
  // ── real pairs, from the roster's ties ──
  let pairs = [];
  if (!chosen) {
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
  // second housemate, who is in on nothing.
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
  }

  // Who recognised whom walking in: the cast screen's draw, or made now.
  let recog = Array.isArray(seasonConfig?.ssRecognitions) ? seasonConfig.ssRecognitions : null;
  if (!recog) {
    const careers = {};
    for (const n of room) { try { careers[n] = careerOf(n) || []; } catch { careers[n] = []; } }
    const fame = Object.fromEntries(room.map(n => [n, (careers[n] || []).some(c => c.rec?.winner || c.rec?.finalist) ? 0.6 : 0]));
    recog = recognitions(room, { careers, fame, rng });
  }

  // Every secret needs something to hunt with: a v1 role or a real tie has
  // no written clues, so it takes its kind's kit (js/ss/secret-pool.js).
  const KIT_FOR = { 'real-pair': 'family', 'voice-pair': 'love', 'voice-mission': 'past', 'real-career': 'past' };
  for (const s of secrets) {
    const kit = KIND_KIT[s.secretKind] || KIND_KIT[KIT_FOR[s.kind]] || KIND_KIT.past;
    if (!s.clues?.length) s.clues = [...kit.clues];
    if (!s.tells?.length) s.tells = [...kit.tells];
    if (!s.secretKind) s.secretKind = KIND_KIT[KIT_FOR[s.kind]] ? KIT_FOR[s.kind] : 'past';
  }
  gs.bb ||= {};
  gs.bb.secretStory = {
    secrets: secrets.map(s => ({ ...s, found: false, foundBy: null, week: null })),
    kitty: {},
    suspicion: {},
    buzzes: [],
    // How the confessional nominates all season (js/ss/casting.js).
    rule: resolveNominationRule(seasonConfig?.ssNominations, rng),
    // Classic (the Voice's game pays prizes) or revival (a Master of the House).
    weekly: resolveWeekly(seasonConfig?.ssWeekly, rng),
    // The season's house (a pick, or the draw made now) and its name.
    houseTheme: SS_HOUSE_THEMES.some(h => h.id === seasonConfig?.ssHouseTheme)
      ? seasonConfig.ssHouseTheme : SS_HOUSE_THEMES[Math.floor(rng() * SS_HOUSE_THEMES.length)].id,
    name: String(seasonConfig?.ssName || '').trim() || null,
    recognitions: recog.filter(r => room.includes(r.who) && room.includes(r.whom)),
  };
  openKitties(gs.bb.secretStory, room, KITTY_START, 1);
  huntOf(gs.bb.secretStory);
  // THE SECRETS BECOME CANON NOW (js/ss/canon.js): from this browser if it can;
  // the published season carries them as well, for the worker to finish.
  if (asShow && typeof window !== 'undefined') {
    const st = gs.bb.secretStory;
    const slugOf = n => (players || []).find(p => p.name === n)?.slug || null;
    const list = canonSecretsOf(st, { season: seasonId(SS_FORMAT, seasonConfig?.seasonNumber || 1), slugOf: n => slugOf(n) || undefined });
    pushCanonSecrets(list).then(r => { if (r) st.canonWritten = [...(r.written || []), ...(r.kept || [])]; }).catch(() => {});
  }
  // a mission that says The Voice told somebody a secret is knowledge they really hold
  for (const s of gs.bb.secretStory.secrets) {
    const m = /^The Voice told me (.+)'s secret$/.exec(s.text);
    if (m && room.includes(m[1])) (gs.bb.secretStory.suspicion[s.holders[0]] ||= {})[m[1]] = 0.9;
  }
  return {
    type: 'ss-secrets', week: 1, secret: true,
    secrets: secrets.map(s => ({ holders: [...s.holders], text: s.text, kind: s.kind })),
    kitty: KITTY_START, stake: BUZZ_STAKE,
    beats: [{ text: `Every housemate moves in with a secret and $${KITTY_START.toLocaleString('en-US')} in the kitty.`, players: room.slice(0, 4), badgeText: 'THE SECRETS', badgeClass: 'gold', part: 'rules' }],
  };
}


/** The engine context the hunt reads (js/ss/hunt.js is pure). */
export function huntCtx(week, rng) {
  return { rng, week: Number(week?.num) || 0, stat: (n, k) => st(n, k), bond: (a, b) => bond(a, b), archetype: n => archetypeOf(n) };
}

/**
 * The week's hunt (part 2 §4–§5): four days of watching and talking, the
 * Voice's clue on the table, then the buzzer. Returns the acts, in order.
 * Bonds and the public move with every buzz (§5 consequences).
 */
export function runSecretHunt({ week = undefined, house = [], rng = Math.random, gameWinner = null } = {}) {
  const state = ssState();
  if (!state) return [];
  ledgerOf(state); huntOf(state);
  const room = house.filter(Boolean);
  const ctx = huntCtx(week, rng);
  const acts = [];
  // The Voice's game: what the week's winner wins (§8, §15).
  if (week && gameWinner && room.includes(gameWinner)) {
    const g = settleWeeklyGame(state, ctx, { winner: gameWinner, house: room });
    week._ssImmune = g.immune; week._ssMaster = g.masterPick;
    if (g.act) acts.push(g.act);
    if (g.clueAct) acts.push(g.clueAct);
  } else if (week) { week._ssImmune = []; week._ssMaster = null; }
  // Monday: the Voice's missions (§7), played through the week.
  acts.push(...handOutMissions(state, ctx, { house: room }));
  const moments = [];
  for (let day = 0; day < 4; day++) moments.push(...huntDay(state, ctx, { house: room }));
  playMissions(state, ctx, { house: room });
  if (moments.length) {
    acts.push({ type: 'ss-hunt', week: ctx.week, moments: moments.slice(0, 6),
      beats: moments.slice(0, 3).map(m => ({ text: m.kind === 'tell'
        ? `${m.who} notices something about ${m.about}: ${m.about} ${m.tell}.`
        : `${m.who} tells ${m.to} what they think ${m.about} is hiding.`,
      players: [m.who, m.to || m.about].filter(Boolean), badgeText: m.kind === 'tell' ? 'NOTICED' : 'THEORY', badgeClass: 'blue', part: 'hunt' })) });
  }
  // The Voice's clue of the week (until the weekly game hands them out, M3).
  for (let c = 0; c < 2; c++) {
    const hidden = room.filter(n => secretOf(state, n) && !secretOf(state, n).found);
    if (!hidden.length) break;
    const holder = hidden[Math.floor(rng() * hidden.length)];
    const clue = showClue(state, ctx, { holder, how: 'voice', house: room });
    if (clue) acts.push(clue);
  }
  // The Voice's rules (§3): breaks from behaviour, each with its price.
  for (const r of weeklyRuleBreaks(state, ctx, { house: room, party: !!week?._ssParty })) {
    if (r.kind === 'reveal') for (const h of r.holders) addPop(h, -0.3);
    acts.push(r);
  }
  const weeksLeft = Math.max(0, room.length - 5);
  for (const b of runBuzzes(state, ctx, { house: room, weeksLeft })) {
    if (b.outcome === 'right') {
      addPop(b.by, 1.0); addPop(b.target, 0.4);
      try { addBond(b.target, b.by, -2); for (const h of b.holders) if (h !== b.target) addBond(h, b.by, -1.2); } catch { /* no bond */ }
    } else if (b.outcome === 'wrong') {
      addPop(b.by, -0.4);
      try { addBond(b.target, b.by, -1.4); } catch { /* no bond */ }
      for (const n of room) if (n !== b.by && n !== b.target && rng() < 0.3) { try { addBond(n, b.by, -0.2); } catch { /* */ } }
    } else {
      try { addBond(b.target, b.by, -0.6); } catch { /* */ }
    }
    acts.push(b);
  }
  return acts;
}

/**
 * THE PRIME (§10): the week's live show, between the nominations and the
 * public's verdict. Missions are judged and revealed here; the rest of the
 * prime's segments join in M6. Returns acts, in running order.
 */
export function runPrime({ week = undefined, house = [], nominees = [], rng = Math.random } = {}) {
  const state = ssState();
  if (!state) return [];
  const room = house.filter(Boolean);
  const ctx = huntCtx(week, rng);
  const acts = [];
  for (const r of settleMissions(state, ctx, { house: room, nominees })) {
    if (r.won) for (const h of r.mission.holders) addPop(h, 0.3);
    acts.push(r);
  }
  return acts;
}

/**
 * The Diary Room nominations: one sex nominates two of the other, and the two most named go up.
 * Odd weeks the women nominate the men; even weeks the men nominate the women. A side too small
 * to nominate from (or a house with no gender on the roster) nominates freely.
 */
export function secretStoryNominations({ week = undefined, house = [], immune = [], direct = null, rng = Math.random } = {}) {
  const room = house.filter(Boolean);
  const wk = Number(week?.num) || 1;
  const nominateMen = wk % 2 === 1;
  const g = genderOf;
  let voters, pool, rule;
  const men = room.filter(n => g(n) === 'm'), women = room.filter(n => g(n) === 'f');
  const eligible = l => l.filter(n => !immune.includes(n));
  // The revival's rule: everybody nominates anybody.
  const mixed = ssState()?.rule === 'mixed';
  if (mixed) {
    voters = room; pool = eligible(room); rule = 'everybody';
  } else if (nominateMen && eligible(men).length >= 2 && women.length) {
    voters = room.filter(n => g(n) !== 'm'); pool = eligible(men); rule = 'women-nominate-men';
  } else if (!nominateMen && eligible(women).length >= 2 && men.length) {
    voters = room.filter(n => g(n) !== 'f'); pool = eligible(women); rule = 'men-nominate-women';
  } else {
    voters = room; pool = eligible(room); rule = 'everybody';
  }
  // NOMINATED D'OFFICE (§8): rule-breakers and the Voice's sanctions go up
  // whatever their immunity; the house names its two from everybody else.
  const state = ssState();
  // ...and the Master of the House's direct nomination (revival seasons).
  const dOffice = [...new Set([...(state ? dOfficeFor(state, wk) : []), ...(direct ? [direct] : [])])].filter(n => room.includes(n));
  pool = pool.filter(n => !dOffice.includes(n));
  const ballots = [];
  const tally = Object.fromEntries(pool.map(n => [n, 0]));
  for (const v of voters) {
    const choices = pool.filter(n => n !== v);
    const want = n => -bond(v, n) * 0.6 + (st(n, 'physical') + st(n, 'strategic')) * 0.08 + rng() * 2.2;
    const picks = choices.sort((a, b) => want(b) - want(a)).slice(0, 2);
    for (const p of picks) tally[p] = (tally[p] || 0) + 1;
    ballots.push({ voter: v, picks });
  }
  // The Voice's extra votes against (a broken commandment, the red phone).
  const extra = state ? extraVotesFor(state, wk) : {};
  for (const [n, k] of Object.entries(extra)) if (n in tally) tally[n] += k;
  const ranked = Object.keys(tally).sort((a, b) => tally[b] - tally[a] || (rng() - 0.5));
  const nominees = [...dOffice, ...ranked.slice(0, 2)];
  const tie = ranked.length > 2 && tally[ranked[1]] === tally[ranked[2]];
  return { nominees, ballots, tally, rule, voiceTie: tie, dOffice, extraVotes: extra, immune: immune.filter(n => room.includes(n)) };
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

/**
 * What a Secret Story season publishes about the hunt: each housemate's
 * secret and what became of it, the buzzes, the kitty, and the secrets board.
 * Pure: reads the state handed in (the export passes gs.bb.secretStory).
 *
 * A secret is KEPT when nobody found it and its holder lasted to the end
 * (`finalists`): a secret taken out of the house by an elimination was never
 * tested to the semi-final.
 */
export function secretStoryExport(state, { finalists = [] } = {}) {
  const secrets = (state?.secrets || []).map(s => ({
    holders: [...(s.holders || [])], text: s.text, kind: s.secretKind || s.kind,
    found: !!s.found, foundBy: s.foundBy || null, week: s.week ?? null,
  }));
  const names = new Set([...Object.keys(state?.kitty || {}), ...secrets.flatMap(s => s.holders)]);
  const buzzes = state?.buzzes || [];
  const players = {};
  for (const n of names) {
    const mine = secrets.find(s => s.holders.includes(n)) || null;
    players[n] = {
      secret: mine?.text || null,
      secretKind: mine?.kind || null,
      foundBy: mine?.found ? mine.foundBy : null,
      foundWeek: mine?.found ? mine.week : null,
      secretKept: mine && !mine.found && finalists.includes(n) ? 1 : 0,
      secretsFound: secrets.filter(s => s.found && s.foundBy === n).length,
      buzzesRight: buzzes.filter(b => b.by === n && b.right).length,
      buzzesWrong: buzzes.filter(b => b.by === n && !b.right).length,
      kitty: Number(state?.kitty?.[n]) || 0,
    };
  }
  return { players, secrets };
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
