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
import { openKitties, ledgerOf, mint, burn, KITTY_START as LEDGER_START, BUZZ_STAKE as LEDGER_STAKE } from '../ss/kitty.js';
import { huntOf, huntDay, showClue, runBuzzes, secretOf, addEvidence } from '../ss/hunt.js';
import { oopsNight, miniSecretsNight, blackBuzzer } from '../ss/evening.js';
import { voiceMoments } from '../ss/voice-moments.js';
import { houseEvent } from '../ss/house-events.js';
import { productionWeek } from '../ss/production.js';
import { startSplit, splitWeek, splitActive, SPLIT_KINDS } from '../ss/split.js';
import { deceptionDue, falseVoiceWeek, revealFalseVoice, robotWeek, unmaskRobot } from '../ss/deceptions.js';
import { voteMode, evictShares, houseDecides, ticketDue, ticketVote } from '../ss/public-votes.js';
import { secretRoomDilemma } from '../ss/secret-room.js';
import { cardsBeforeNominations, cardsAfterNominations, expireCards } from '../ss/powers.js';
import { weekTwist, twistOf, forLifeNow } from '../ss/nomination-twists.js';
import { startGroup, weekInGroup, enterFromGroup, groupHidden, GROUPS } from '../ss/hidden-groups.js';
import { weeklyRuleBreaks, dOfficeFor, extraVotesFor, COMMANDMENTS, COMMANDMENTS_REVIVAL } from '../ss/voice.js';
import { resolveWeekly, settleWeeklyGame } from '../ss/games.js';
import { handOutMissions, playMissions, settleMissions } from '../ss/missions.js';
import { castNominations } from '../ss/nominations.js';
import { playPrime, revealOnExit, afterShow } from '../ss/prime.js';
import { throwParty, runSuperette } from '../ss/parties.js';
import { isFakeNight, sendToSecretRoom, watchFromSecretRoom, bringBack, planFakes, fakePlanFor, usePlan } from '../ss/hidden.js';
import { romanticCompat } from '../players.js';
import { notice, weekPasses, readHouseBeats, absorbPopularity, support, standing, voteShares, publicRead, awareness, fileOf, carriedBy, GROUP_LABEL } from '../ss/public.js';
import { pStats } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { careerOf, activeSeasons } from '../franchise-meta.js';
import { drawSeason, RATE, signatureOf } from '../ss/twists.js';
import { castRole, playRole, accuseRole, ROLE_NAMES } from '../ss/signatures.js';
import { planLaunch, lastSummer } from '../ss/launch.js';
import { planHouseSecret, houseSecretClue, solveHouseSecret, finalPlace, unveilSecrets, finalWeekReturns, journeyOf, CHEQUE, KEPT_BONUS } from '../ss/final.js';
import { styleOf } from './game-style.js';

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
// THE PUBLIC (js/ss/public.js): what the country noticed, on its axis. The
// engine's one-number popularity moves with it (other screens read it), and
// the public's own copy of that number is kept in step so it is not read back.
const POP_OF = { warmth: 1, pity: 0.7, fun: 0.4, arc: 0.6, real: 0.3, heat: -0.6, seen: 0, game: 0.3 };
/*
 * How a housemate plays the HUNT, from how they play the game (bb/game-style.js):
 * the reader is a hunter, the provoker presses early, the manipulator hides and
 * bluffs, the alliance player hides behind the group, and the floaters, the
 * coattail riders and the ones lying low barely play it at all (the 'plante
 * verte', who the public forgets) until a lowkey player rises.
 */
const SS_PLAY = {
  read: { watch: 1, bar: -0.04, press: 0.05 },
  provoke: { bar: -0.07, press: 0.12 },
  manipulate: { guard: 0.2, bluff: 0.15, bar: -0.02 },
  alliance: { guard: 0.1, bluff: 0.08 },
  social: { bar: 0.03 },
  loyal: { bar: 0.02 },
  comp: {},
  float: { watch: -1, bar: 0.08, press: -0.15 },
  coattail: { watch: -1, bar: 0.07, press: -0.12 },
  lowkey: { watch: -1, bar: 0.1, press: -0.2, guard: 0.1 },
  rise: { watch: 1, bar: -0.06, press: 0.1 },
};
const playStyle = n => { try { return styleOf(n); } catch { return null; } };
function pub(n, axis, d, why = '') {
  const state = ssState();
  if (!state || !n) return;
  notice(state, n, axis, d, why, state._week || 0);
  const p = d * (POP_OF[axis] ?? 0);
  if (p) { addPop(n, p); state.publicSeenPop ||= {}; state.publicSeenPop[n] = Number(gs.popularity?.[n]) || 0; }
}
/** An effect list's `pop` entries, read as the public's warmth or heat. */
const FX_WHY = { dilemma: 'faced a dilemma on the prime', phone: 'answered the red phone', truths: 'went into the room of truths', visit: 'got a visit from home', mission: 'took on a secret mission' };
const popFx = (list, kind) => { for (const [n, d] of list || []) pub(n, d >= 0 ? 'warmth' : 'heat', Math.abs(d), FX_WHY[kind] || ''); };
const MOVING = ['survived', 'family', 'love', 'body'];
/** An act's `effects` (bonds, the public), applied. */
function applyFx(fx) {
  for (const [a, b, d] of fx?.bond || []) { try { addBond(a, b, d); } catch { /* no bond */ } }
  for (const [n, axis, d, why] of fx?.pub || []) pub(n, axis, d, why);
}

// THE TIMELINE: a Secret Story twist placed on a week (js/core.js TWIST_CATALOG, format 'secret-story') sets the
// week's choice before the engine draws its own.
const SS_SCHEDULE = {
  'ss-linked': ['forceWeekTwist', 'linked'], 'ss-for-life': ['forceWeekTwist', 'for-life'], 'ss-inverted': ['forceWeekTwist', 'inverted'], 'ss-houses': ['forceWeekTwist', 'houses'],
  'ss-red-room': ['forceWeekTwist', 'red-room'], 'ss-exclusive': ['forceWeekTwist', 'exclusive'], 'ss-everybody': ['forceWeekTwist', 'everybody'],
  'ss-red-phone': ['forcePrimeTheme', 'red-phone'], 'ss-dilemmas': ['forcePrimeTheme', 'dilemmas'], 'ss-bridge': ['forcePrimeTheme', 'bridge'], 'ss-truths': ['forcePrimeTheme', 'truths'], 'ss-rings': ['forcePrimeTheme', 'rings'],
  'ss-second-house': ['forceSplit', 'second-house'], 'ss-clans': ['forceSplit', 'clans'], 'ss-bears': ['forceSplit', 'bears'],
  'ss-false-voice': ['forceDeception', 'false-voice'], 'ss-robot': ['forceDeception', 'robot'],
  'ss-house-decides': ['forceVoteMode', 'house-decides'], 'ss-vote-to-evict': ['forceVoteMode', 'evict'], 'ss-ticket': ['forceTicket', true],
};
export function readSchedule(state, wk) {
  for (const t of (seasonConfig?.twistSchedule || []).filter(x => x && Number(x.episode) === Number(wk))) {
    const m = SS_SCHEDULE[t.type];
    if (m && (state[m[0]] ||= {})[wk] == null) state[m[0]][wk] = m[1];
  }
}

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
  /** @type {any[]} */ const secrets = [];
  const placed = new Set();
  for (const n of room) {
    if (placed.has(n)) continue;
    const e = fill[n];
    if (!e) continue;
    // A real tie is ONE secret two people share, if both are in the house; a production secret is one secret
    // its whole group shares (js/ss/casting.js PRODUCTION_SECRETS).
    const group = Array.isArray(e.group) ? e.group.filter(h => room.includes(h) && !placed.has(h)) : null;
    const holders = group && group.length > 1 && group.includes(n) ? group : e.pair && room.includes(e.pair) && !placed.has(e.pair) ? [n, e.pair] : [n];
    secrets.push({ id: `secret-${holders.join('-')}`, kind: e.source === 'production' ? (holders.length > 1 ? 'voice-pair' : 'voice-mission') : e.pair && holders.length > 1 ? 'real-pair' : 'personal',
      source: e.source, poolId: e.id || null, ...(e.plays ? { plays: e.plays } : {}), secretKind: e.kind || null, holders, text: e.text,
      clues: [...(e.clues || [])], tells: [...(e.tells || [])], difficulty: Number(e.difficulty) || 0.55 });
    for (const h of holders) placed.add(h);
  }
  return secrets;
}

/**
 * Launch night's hidden group, if the season's signature is one (js/ss/hidden-groups.js): who goes to the space
 * instead of the house. week.js takes them off the house list; the launch act learns where they went.
 * @returns {string[]}
 */
export function ssLaunchGroup({ rng = Math.random, house = [], act = null } = {}) {
  const state = ssState();
  if (!state?.draw?.signature || !GROUPS[state.draw.signature]) return [];
  const members = startGroup(state, huntCtx(undefined, rng), { signature: state.draw.signature, house });
  if (members.length && act) act.group = { id: state.group.id, name: state.group.name, space: state.group.space, outside: state.group.outside, members: [...members] };
  return members;
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
  // THE SEASON'S DRAW (js/ss/twists.js): a signature and every tool's level, redrawn until it is
  // not too close to a past Secret Story season in the franchise ledger. Settings lock pieces.
  {
    const st0 = gs.bb.secretStory;
    let past = [];
    try { past = Object.values(activeSeasons() || {}).map(r => r?.ssDraw).filter(Boolean); } catch { past = []; }
    const locks = { signature: seasonConfig?.ssSignature || undefined,
      secretRoom: seasonConfig?.ssSecretRoom === 'on' ? 'once' : ['off', 'once', 'twice'].includes(seasonConfig?.ssSecretRoom) ? seasonConfig.ssSecretRoom : undefined };
    st0.draw = drawSeason({ castSize: room.length, past, locks, rng });
    st0.tools = { ...st0.draw.tools };
    // the season's fake eliminations: how many, which kind, how long, and what they do up there (js/ss/hidden.js)
    planFakes(st0, { castSize: room.length, level: st0.tools.secretRoom === 'on' ? 'once' : st0.tools.secretRoom, rng, first: st0.draw.secretRoomWeek, tower: st0.draw.signature === 'control-tower' });
    // the signature's pair, chosen by the Voice tonight
    castRole(st0, huntCtx(undefined, rng), { signature: st0.draw.signature, house: room });
    // the secret of the house, hidden for the whole season (js/ss/final.js)
    planHouseSecret(st0, rng);
  }
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
  // LAUNCH NIGHT (js/ss/launch.js): who arrives when, the first missions, what the first ones in do
  // while they wait, the list of secrets; its first impressions move the bonds now
  // (a first crush on launch night only between two who could: romanticCompat)
  const launch = planLaunch(gs.bb.secretStory, { ...huntCtx(undefined, rng), compat: (a, b) => { try { return romanticCompat(a, b); } catch { return false; } } }, { house: room.slice().sort(() => rng() - 0.5) });
  for (const [a, b, d] of launch.effects.bond) { try { addBond(a, b, d); } catch { /* no bond */ } }
  let summer = null;
  try { summer = lastSummer(activeSeasons() || {}); } catch { summer = null; }
  return {
    type: 'ss-secrets', week: 1, secret: true,
    secrets: secrets.map(s => ({ holders: [...s.holders], text: s.text, kind: s.kind })),
    // launch night (part 2 §2): the arrivals in order, who recognises whom, the season's signature
    arrivals: launch.order,
    launch: { missions: launch.missions, checkins: launch.checkins, lists: launch.lists },
    lastSummer: summer,
    houseTheme: gs.bb.secretStory.houseTheme || null,
    styles: Object.fromEntries(room.map(n => [n, playStyle(n)])),
    commandments: (gs.bb.secretStory.weekly === 'revival' ? COMMANDMENTS_REVIVAL : COMMANDMENTS).slice(),
    houseRiddle: gs.bb.secretStory.houseSecret?.riddle || null,
    recognitions: (gs.bb.secretStory.recognitions || []).slice(),
    signature: gs.bb.secretStory.draw?.signature ? { ...signatureOf(gs.bb.secretStory.draw.signature), pair: gs.bb.secretStory.role?.pair || [] } : null,
    kitty: KITTY_START, stake: BUZZ_STAKE,
    beats: [{ text: `Every housemate moves in with a secret and $${KITTY_START.toLocaleString('en-US')} in the kitty.`, players: room.slice(0, 4), badgeText: 'THE SECRETS', badgeClass: 'gold', part: 'rules' }],
  };
}


/** The engine context the hunt reads (js/ss/hunt.js is pure). */
export function huntCtx(week, rng) {
  const state = ssState();
  const ctx = { rng, week: Number(week?.num) || 0, stat: (n, k) => st(n, k), bond: (a, b) => bond(a, b), archetype: n => archetypeOf(n),
    // where they stand with the country (js/ss/public.js), not the raw number
    pop: n => (state ? standing(state, n, (gs.activePlayers || []).filter(Boolean)) : pop(n)) };
  // how much a housemate weighs how a choice will LOOK (grows with the weeks)
  ctx.looks = n => awareness(ctx, n);
  // how they play the hunt
  ctx.play = n => SS_PLAY[playStyle(n)] || {};
  // a flirt or a kiss checks romantic compatibility first (CLAUDE.md), real or fake
  ctx.compat = (a, b) => { try { return !!romanticCompat(a, b); } catch { return false; } };
  ctx.gender = n => genderOf(n);
  // buzzing a friend, or the country's favourite, on air: it looks bad
  ctx.buzzCost = (n, t) => ctx.looks(n) * (Math.max(0, bond(n, t)) / 10 * 0.12 + Math.max(0, ctx.pop(t)) * 0.04);
  return ctx;
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
  state._week = ctx.week;
  // the twists the user placed on this week in the timeline, before the engine draws its own
  readSchedule(state, ctx.week);
  state.publicRoom = room.slice();
  state.kittyAtWeekStart = Object.fromEntries(room.map(n => [n, Number(state.kitty?.[n]) || 0]));
  // a new week: last week's headlines fade, the stories stay (js/ss/public.js)
  for (const n of room) fileOf(state, n);
  if (ctx.week > 1) weekPasses(state, room);
  // The Voice's game: what the week's winner wins (§8, §15).
  if (week && gameWinner && room.includes(gameWinner)) {
    const g = settleWeeklyGame(state, ctx, { winner: gameWinner, house: room });
    week._ssImmune = g.immune; week._ssMaster = g.masterPick;
    if (g.act) acts.push(g.act);
    if (g.clueAct) acts.push(g.clueAct);
    pub(gameWinner, 'fun', 0.12, "won the Voice's game"); pub(gameWinner, 'game', 0.1, "won the Voice's game");
  } else if (week) { week._ssImmune = []; week._ssMaster = null; }
  // Monday: the Voice's missions (§7), played through the week.
  acts.push(...handOutMissions(state, ctx, { house: room }));
  // The weekend: the Voice throws a party most weeks (§15). Guards come down; a slip is likelier.
  if (room.length >= 4 && rng() < (ctx.week <= 1 ? 0.5 : (RATE.parties[state.tools?.parties] ?? 0.65))) {
    const party = throwParty(state, ctx, { house: room });
    if (party) { applyFx(party.effects); acts.push(party); if (week) week._ssParty = true; }
  } else if (week) week._ssParty = false;
  const moments = [];
  for (let day = 0; day < 4; day++) moments.push(...huntDay(state, ctx, { house: room }));
  // the secret room (js/ss/hidden.js): whoever is upstairs watches every screen, and hears what the house says
  for (const w of watchFromSecretRoom(state, ctx, { house: room })) {
    for (const h of w.heard) { try { addBond(w.name, h.who, h.d); } catch { /* no bond */ } }
    pub(w.name, 'arc', 0.2, 'watched the house from the secret room');
    if (w.masterPick) { pub(w.name, 'game', 0.2, 'nominated from the secret room'); pub(w.masterPick, 'pity', 0.1, 'was nominated from the secret room'); }
    if (w.order) {
      try { addBond(w.name, w.order.accomplice, 0.8); } catch { /* no bond */ }
      pub(w.order.accomplice, 'game', 0.12, 'ran the secret room\'s orders');
      // a slip: the house does not know, but somebody noticed something
      if (w.order.slip && w.order.other) { try { addBond(w.order.other, w.order.accomplice, -0.6); } catch { /* */ } pub(w.order.accomplice, 'fun', 0.1, 'nearly gave the secret room away'); }
    }
    acts.push({ type: 'ss-secret-room', week: ctx.week, who: w.name, moments: w.moments, heard: w.heard, role: w.role, masterPick: w.masterPick, order: w.order, accomplice: w.accomplice, partner: w.partner, first: w.first, space: w.space,
      beats: [{ text: `Upstairs in the secret room, ${w.name} watches the house on the screens.`, players: [w.name], badgeText: 'SECRET ROOM', badgeClass: 'purple', part: 'secret-room' }] });
  }
  // A mission is played through the week; a seduction or a nightmare moves a bond.
  for (const [a, b, d] of playMissions(state, ctx, { house: room })) { try { addBond(a, b, d); } catch { /* no bond */ } }
  // the hunt on screen: the ones watching and talking are seen, and seen playing
  for (const m of moments.slice(0, 6)) { pub(m.who, 'seen', 0.15, ''); pub(m.who, 'game', 0.04, 'went hunting for secrets'); }
  if (moments.length) {
    acts.push({ type: 'ss-hunt', week: ctx.week, moments: moments.slice(0, 6),
      beats: moments.slice(0, 3).map(m => ({ text: m.kind === 'tell'
        ? `${m.who} notices something about ${m.about}: ${m.about} ${m.tell}.`
        : `${m.who} tells ${m.to} what they think ${m.about} is hiding.`,
      players: [m.who, m.to || m.about].filter(Boolean), badgeText: m.kind === 'tell' ? 'NOTICED' : 'THEORY', badgeClass: 'blue', part: 'hunt' })) });
  }
  // The Voice's clue of the week (until the weekly game hands them out, M3).
  // two a week, and a third in the back half of the season when the Voice wants the hunt to finish
  for (let c = 0; c < (room.length <= 9 ? 3 : 2); c++) {
    const hidden = room.filter(n => secretOf(state, n) && !secretOf(state, n).found);
    if (!hidden.length) break;
    const holder = hidden[Math.floor(rng() * hidden.length)];
    const clue = showClue(state, ctx, { holder, how: 'voice', house: room });
    if (clue) acts.push(clue);
  }
  // THE SECRET OF THE HOUSE (js/ss/final.js): a clue most weeks; in the semi-final week, somebody may solve it.
  const semi = room.length <= (Number(seasonConfig?.finaleSize) || 3) + 1;
  if (semi) {
    const end = solveHouseSecret(state, ctx, { house: room });
    if (end) {
      if (end.solved && !end.sold) { pub(end.by, 'game', 0.5, 'solved the secret of the house'); if (week) week._ssImmune = [...new Set([...(week._ssImmune || []), end.by])]; }
      if (end.solved && end.sold) { pub(end.by, 'fun', 0.2, 'sold the place in the final'); pub(end.by, 'heat', 0.2, 'sold the place in the final'); }
      acts.push(end);
    }
  } else if (ctx.week >= 2 && rng() < 0.55) {
    const c = houseSecretClue(state, ctx, { house: room, to: rng() < 0.5 ? gameWinner : null });
    if (c) { pub(c.finder, 'game', 0.08, 'found a clue to the secret of the house'); acts.push(c); }
  }
  // A fake couple (or fake siblings) still playing it: the public, which knows, follows the story every week.
  for (const s of (state.secrets || []).filter(x => x.kind === 'voice-pair' && !x.found)) {
    const on = (s.holders || []).filter(h => room.includes(h));
    if (on.length === 2) for (const h of on) pub(h, 'arc', 0.14, 'played the fake couple for another week');
  }
  // The season's signature role (js/ss/signatures.js): the masters add a nominee, the thieves steal.
  {
    const r = playRole(state, ctx, { house: room });
    if (r) {
      if (r.target) pub(r.target, 'pity', 0.1, 'was nominated by the masters');
      for (const t of r.takes || []) pub(t.from, 'pity', 0.08, 'was robbed by the house thieves');
      for (const p of r.pair) pub(p, 'game', 0.12, `played ${ROLE_NAMES[r.role]} in secret`);
      acts.push(r);
    }
  }
  // The Voice's rules (§3): breaks from behaviour, each with its price.
  for (const r of weeklyRuleBreaks(state, ctx, { house: room, party: !!week?._ssParty })) {
    // a slip is human (a little pity); arguing with the Voice or talking
    // nominations is a character, and a bit of a rule-breaker
    if (r.kind === 'reveal') for (const h of r.holders) { pub(h, 'pity', 0.15, 'gave the secret away'); pub(h, 'fun', 0.1, 'gave the secret away'); }
    else if (r.kind === 'contest') { pub(r.who, 'fun', 0.2, 'argued with the Voice'); pub(r.who, 'heat', 0.12, 'argued with the Voice'); }
    else { pub(r.who, 'fun', 0.1, "broke the Voice's rules"); pub(r.who, 'heat', 0.08, "broke the Voice's rules"); }
    acts.push(r);
  }
  // Wednesday: the store (§15). The game's winner picks who runs in with them;
  // a house-wide punishment this week keeps it shut.
  {
    const shut = state.rules?.house?.[ctx.week] === 'no-shopping' ? (state.rules.houseBlame?.[ctx.week] || true) : false;
    const shop = state.tools?.store === 'off' ? null : runSuperette(state, ctx, { house: room, closed: shut, picker: gameWinner && room.includes(gameWinner) ? gameWinner : null });
    if (shop) { applyFx(shop.effects); acts.push(shop); }
  }
  // An evening: the Voice's game (js/ss/evening.js), the "Oops" night or mini-secrets.
  if (room.length >= 4 && ctx.week >= 2 && rng() < (RATE.evenings?.[state.tools?.evenings] ?? 0.5)) {
    // the games take turns: an "Oops" night rarely follows another
    const oops = rng() < (state.lastEvening === 'oops' ? 0.25 : 0.65);
    const ev = (oops ? oopsNight(state, ctx, { house: room }) : miniSecretsNight(state, ctx, { house: room }))
      || (oops ? miniSecretsNight(state, ctx, { house: room }) : oopsNight(state, ctx, { house: room }));
    if (ev) {
      applyFx(ev.effects);
      const game = ev.statements ? 'oops' : 'mini';
      state.lastEvening = game;
      acts.push({ type: 'ss-evening', week: ctx.week, game, statements: ev.statements || null, rounds: ev.rounds || null,
        beats: game === 'oops'
          ? ev.statements.filter(s => s.raised.length).slice(0, 3).map(s => ({ text: `The Voice's "Oops" night: "${s.text}" ${s.raised.map(r => r.who).join(' and ')} ${s.raised.length > 1 ? 'raise' : 'raises'} the sign.`, players: s.raised.map(r => r.who).slice(0, 4), badgeText: 'OOPS NIGHT', badgeClass: 'gold', part: 'evening' }))
          : ev.rounds.map(r => ({ text: `Mini-secrets: the Voice reveals that somebody ${r.fact}. ${r.first} buzzes ${r.guess}: ${r.right ? `right, and wins $${r.money}` : `wrong, and loses $${r.money}`}.`, players: [r.first, r.subject], badgeText: 'MINI-SECRETS', badgeClass: r.right ? 'gold' : 'red', part: 'evening' })) });
    }
  }
  // The Voice between the house and the world (js/ss/voice-moments.js): a paid mission, the red phone round the
  // house, a present from the public, the red room, a birthday, a letter from home, a telling-off.
  for (const m of voiceMoments(state, ctx, { house: room })) {
    applyFx(m.effects);
    const { effects, ...rest } = m;
    void effects;
    acts.push({ type: 'ss-voice-moment', week: ctx.week, ...rest,
      beats: [{ text: `The Voice: ${m.kind === 'poll' ? `the red phone asks ${m.q}, round the house` : m.kind === 'present' ? `${m.who} gets a present from the public` : m.kind === 'scold' ? `${m.who} is told off: ${m.text}` : m.kind === 'birthday' ? `${m.who}'s birthday` : m.kind === 'letter' ? `a letter from home for ${m.who}` : `a mission for ${m.who}${m.other ? ` and ${m.other}` : ''}, ${m.ok ? 'done' : 'failed'}`}.`,
        players: [m.who, m.other].filter(Boolean), badgeText: 'THE VOICE', badgeClass: 'gold', part: 'voice' }] });
  }
  // THE HIDDEN GROUP (js/ss/hidden-groups.js): a week in the space; who comes in at this week's prime
  {
    const gw = weekInGroup(state, ctx, { house: room });
    if (gw) {
      state._groupEntering = gw.entering;
      for (const e of gw.events) {
        if (e.kind === 'found') { pub(e.who, 'game', 0.3, `found ${e.on}'s secret from ${gw.name}`); pub(e.on, 'pity', 0.15, 'had the secret found from the hidden space'); }
        if (e.kind === 'tunnel') pub(e.who, 'game', 0.25, 'found the intruders\' tunnel');
        if (e.kind === 'identified') pub(e.by, 'game', 0.15, 'picked out a hidden face among the portraits');
      }
      for (const n of gw.hidden) pub(n, 'arc', 0.12, `lived in ${gw.name}`);
      acts.push({ type: 'ss-group', week: ctx.week, ...gw,
        beats: [{ text: `${gw.name}: ${gw.hidden.join(', ')} ${gw.hidden.length > 1 ? 'are' : 'is'} still hidden.${gw.entering.length ? ` ${gw.entering.map(e => e.name).join(' and ')} will come in at the prime.` : ''}`,
          players: gw.hidden.slice(0, 4), badgeText: 'HIDDEN', badgeClass: 'purple', part: 'group' }] });
    }
  }
  // THE SPLIT (js/ss/split.js): two houses, two clans, or the bears, for two or three weeks. An Arena house ("a wall
  // splits the House of Secrets in two") always has one from week two; otherwise about half the seasons.
  // state.forceSplit[wk] = kind | 'none' for tests.
  let started = null;
  {
    const forced = state.forceSplit?.[ctx.week];
    const wk = ctx.week || 0;
    const due = forced ? forced !== 'none'
      : !state.split && wk >= 2 && wk <= 6 && room.length >= 9 && (state.houseTheme === 'arena' || rng() < 0.1);
    if (due && !splitActive(state, wk)) {
      const kind = forced && SPLIT_KINDS.includes(forced) ? forced
        : room.length >= 10 && rng() < 0.25 ? 'bears' : rng() < 0.55 ? 'second-house' : 'clans';
      const s = startSplit(state, ctx, { house: room, kind });
      started = { kind: s.kind, names: s.names.slice(), sides: s.sides.map(x => x.slice()), apart: s.apart, captains: s.captains, parted: s.parted.map(p => p.slice()), until: s.until };
    }
    if (splitActive(state, wk)) {
      const ev = splitWeek(state, ctx, { house: room });
      if (ev) {
        applyFx(ev.effects);
        const { effects, ...rest } = ev;
        void effects;
        acts.push({ type: 'ss-split', week: ctx.week, start: started, ...rest,
          beats: [{ text: `${started ? `The house splits: ${ev.names.join(' against ')}. ` : ''}The duel: ${ev.names[ev.duel.w]} win, and are immune.${ev.traitor ? ` ${ev.traitor.who} ${ev.traitor.took ? 'changes sides for $3,000' : 'refuses to change sides'}.` : ''}${ev.reunion ? ' The split is over.' : ''}`,
            players: ev.duel.winners.slice(0, 4), badgeText: 'THE SPLIT', badgeClass: 'gold', part: 'split' }] });
      }
    }
  }
  // THE WEEK'S NOMINATION TWIST (js/ss/nomination-twists.js), announced before the nominations (never during a split)
  if (!(state.split && (splitActive(state, ctx.week || 0) || state.split.over === ctx.week))) {
    const nt = weekTwist(state, ctx, { house: room, winner: gameWinner });
    if (nt && (nt.kind || nt.life)) {
      if (nt.kind === 'for-life') { pub(nt.who, 'pity', 0.3, 'was nominated for life'); if (nt.by) pub(nt.by, 'heat', 0.25, 'nominated somebody for life'); }
      if (nt.life?.kind === 'taken') { pub(nt.life.by, 'warmth', 0.45, `took ${nt.life.who}'s nomination for life`); try { addBond(nt.life.who, nt.life.by, 2.5); } catch { /* */ } }
      if (nt.kind === 'red-room') { pub(nt.who, 'fun', 0.2, 'walked into the red room'); try { addBond(nt.dragged, nt.who, -1.5); } catch { /* */ } }
      if (nt.kind === 'houses') pub(nt.winner, 'game', 0.2, 'won the duel of the houses');
      if (nt.kind === 'exclusive') pub(nt.who, 'heat', 0.15, 'named the nominees alone');
      acts.push({ type: 'ss-week-twist', week: ctx.week, twist: nt.kind ? { ...nt, life: undefined } : null, life: nt.life || null,
        beats: [{ text: nt.kind ? `The Voice changes the nominations this week: ${nt.kind.replace(/-/g, ' ')}.` : `${nt.life.who} is still nominated for life.`,
          players: [nt.who, nt.dragged, nt.life?.who].filter(Boolean), badgeText: 'THE NOMINATIONS', badgeClass: 'red', part: 'week-twist' }] });
    }
  }
  // THE SECRET ROOM, the Voice's room of dilemmas (js/ss/secret-room.js): most weeks somebody is called up alone
  // and offered a trade that somebody else pays for. Before the nominations, which read what it wrote.
  if (ctx.week >= 1 && rng() < (state.tools?.dilemmas === 'many' ? 0.75 : 0.55)) {
    const d = secretRoomDilemma(state, ctx, { house: room, immune: [...((state.nextImmune || {})[ctx.week] || [])] });
    if (d) {
      applyFx(d.effects);
      const { effects, ...rest } = d;
      void effects;
      acts.push({ type: 'ss-room-dilemma', week: ctx.week, ...rest,
        beats: [{ text: `In the secret room, the Voice offers ${d.to} a trade (${d.kind.replace(/-/g, ' ')}). ${d.to} ${d.accepted ? 'takes it' : 'refuses'}.`,
          players: [d.to, d.named].filter(Boolean), badgeText: 'SECRET ROOM', badgeClass: 'purple', part: 'secret-room' }] });
    }
  }
  // The week's big house event (js/ss/house-events.js): the house mission, the housework in uniform, Miss and
  // Mister Secret, the clan war, a secret room found.
  {
    const he = houseEvent(state, ctx, { house: room });
    if (he) {
      applyFx(he.effects);
      const { effects, ...rest } = he;
      void effects;
      const who = [he.who, he.other, he.miss, he.mister, he.weak, ...(he.captains || [])].filter(Boolean);
      acts.push({ type: 'ss-house-event', week: ctx.week, ...rest,
        beats: [{ text: he.kind === 'mission' ? `The house mission: ${he.text}. ${he.ok ? 'Done: money for everybody.' : `Failed, because of ${he.weak}: no hot water.`}`
          : he.kind === 'housework' ? `${he.who} and ${he.other} clean the house in uniform, for the Voice.`
          : he.kind === 'pageant' ? `Miss and Mister Secret: ${[he.miss, he.mister].filter(Boolean).join(' and ')} win, and a clue each.`
          : he.kind === 'clans' ? `The clan war: ${he.captains.join(' against ')}. ${he.names[he.winners]} win.`
          : `${he.who} finds a secret room ${he.where}.`, players: who.slice(0, 4), badgeText: 'THE HOUSE', badgeClass: 'gold', part: 'house-event' }] });
    }
  }
  // THE PRODUCTION SECRETS, playing (js/ss/production.js): every live role does its week's job, before the
  // nominations (the chosen ones' immunity and the tunnels' nomination for life are read by them).
  for (const p of productionWeek(state, ctx, { house: room })) {
    applyFx(p.effects);
    for (const [w, t, s] of p.evidence) addEvidence(state, ctx, w, t, { strength: s, how: `role:${p.role}` });
    const { effects, evidence, ...rest } = p;
    void effects; void evidence;
    acts.push({ type: 'ss-production', week: ctx.week, ...rest,
      beats: [{ text: `${p.holders.join(' and ')}: the week's production mission (${p.role.replace(/-/g, ' ')}). ${p.ok ? 'Done.' : 'It goes wrong.'}`,
        players: p.holders.slice(0, 4), badgeText: 'PRODUCTION SECRET', badgeClass: 'purple', part: 'production' }] });
  }
  // WHO IS REALLY TALKING (js/ss/deceptions.js): a week of the false Voice, or of Monsieur Robot with an eliminated
  // housemate inside; both are revealed at the prime.
  {
    const gone = (gs.eliminated || []).filter(n => !room.includes(n));
    const kind = deceptionDue(state, ctx, { house: room, gone });
    const ev = kind === 'false-voice' ? falseVoiceWeek(state, ctx, { house: room }) : kind === 'robot' ? robotWeek(state, ctx, { house: room, gone }) : null;
    if (ev) acts.push({ type: 'ss-deception', week: ctx.week, ...ev,
      beats: [{ text: ev.kind === 'false-voice' ? `A new Voice takes over the house. ${ev.doubters.length} of the house do not trust it.` : `Monsieur Robot moves in. ${ev.robot} is inside.`,
        players: ev.kind === 'robot' ? [ev.robot] : ev.doubters.slice(0, 4), badgeText: ev.kind === 'robot' ? 'MONSIEUR ROBOT' : 'THE NEW VOICE', badgeClass: 'purple', part: 'deception' }] });
  }
  // The black buzzer: hidden by the Voice; the finder is immune and names a nominee (before the nominations).
  if (!state.huntClosed && ctx.week >= 2 && rng() < (RATE.blackBuzzer?.[state.tools?.blackBuzzer] ?? 0.15)) {
    const bz = blackBuzzer(state, ctx, { house: room });
    if (bz) {
      applyFx(bz.effects);
      acts.push({ type: 'ss-black-buzzer', week: ctx.week, finder: bz.finder, named: bz.named, why: bz.why,
        beats: [{ text: `${bz.finder} finds the black buzzer: immune this week, and ${bz.named} is nominated by ${bz.finder}'s hand.`, players: [bz.finder, bz.named], badgeText: 'BLACK BUZZER', badgeClass: 'red', part: 'black-buzzer' }] });
    }
  }
  const weeksLeft = Math.max(0, room.length - 5);
  // (the hunt closes at the semi prime: js/ss/final.js unveilSecrets)
  for (const b of state.huntClosed ? [] : runBuzzes(state, ctx, { house: room, weeksLeft })) {
    if (b.outcome === 'right') {
      // the hunter is a character; buzzing a FRIEND on air is a betrayal the country saw
      const friend = bond(b.by, b.target) > 3;
      pub(b.by, 'fun', 0.4, `found ${b.target}'s secret`); pub(b.by, 'game', 0.55, `found ${b.target}'s secret`);
      if (friend) { pub(b.by, 'heat', 0.45, `buzzed a friend, ${b.target}`); pub(b.by, 'real', -0.15, `buzzed a friend, ${b.target}`); }
      else pub(b.by, 'warmth', 0.12, `found ${b.target}'s secret`);
      pub(b.target, 'pity', friend ? 0.5 : 0.3, 'lost the secret and the money');
      // the secret itself, told to the country: a moving one wins hearts, a fake couple is a story
      const sk = secretOf(state, b.target);
      if (MOVING.includes(sk?.secretKind)) for (const h of b.holders) { pub(h, 'pity', 0.35, 'told the story behind the secret'); pub(h, 'warmth', 0.2, 'told the story behind the secret'); }
      if (sk?.kind === 'voice-pair') for (const h of b.holders) pub(h, 'arc', 0.35, 'was found out as a fake couple');
      try { addBond(b.target, b.by, -2); for (const h of b.holders) if (h !== b.target) addBond(h, b.by, -1.2); } catch { /* no bond */ }
    } else if (b.outcome === 'wrong') {
      // a wrong buzz is funny to watch, and a bit embarrassing
      pub(b.by, 'fun', 0.15, `buzzed ${b.target}, wrongly`); pub(b.by, 'warmth', -0.12, `buzzed ${b.target}, wrongly`);
      // playing and missing is still playing
      pub(b.by, 'game', 0.1, `went for ${b.target}'s secret`);
      pub(b.target, 'pity', 0.12, `was wrongly accused by ${b.by}`);
      try { addBond(b.target, b.by, -1.4); } catch { /* no bond */ }
      for (const n of room) if (n !== b.by && n !== b.target && rng() < 0.3) { try { addBond(n, b.by, -0.2); } catch { /* */ } }
    } else {
      try { addBond(b.target, b.by, -0.6); } catch { /* */ }
      pub(b.by, 'fun', 0.06, 'backed down at the buzzer');
    }
    // the hunter had it right and the holder talked their way out: kept under pressure
    if (b.held) { pub(b.target, 'game', 0.4, `kept a secret with ${b.by} closing in`); pub(b.target, 'fun', 0.1, `kept a secret with ${b.by} closing in`); }
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
  state._week = ctx.week;
  // what the country saw of the week's house life, and what the house's own
  // events already did to the number (js/ss/public.js)
  absorbPopularity(state, gs.popularity || {}, room, ctx.week);
  readHouseBeats(state, (week?.acts || []).filter(a => a?.type === 'house').flatMap(a => a.socialBeats || []), ctx.week);
  // the nominees: named by many, the country feels for them; named by the Voice, they asked for it
  const nomAct = (week?.acts || []).find(a => a?.secretStory)?.secretStory;
  for (const n of nominees) {
    // (the final's Voice and awards count these: secretStoryFinalWeek)
    (state.nominated ||= {})[n] = (state.nominated[n] || 0) + 1;
    const votes = Number(nomAct?.tally?.[n]) || 0;
    if (votes) pub(n, 'pity', Math.min(0.4, votes * 0.05), 'was nominated by the house');
    if ((nomAct?.dOffice || []).includes(n)) pub(n, 'heat', 0.1, 'was nominated by the Voice');
  }
  // the money: a kitty that grew this week is a player's work; nobody plays the hunt
  // for three weeks after the first, and the country notices that too
  for (const n of room) {
    const grew = (Number(state.kitty?.[n]) || 0) - (Number(state.kittyAtWeekStart?.[n]) || 0);
    if (grew > 0) pub(n, 'game', Math.min(0.4, grew / 25000), 'grew the kitty');
    const lastPress = Math.max(0, ...(state.buzzes || []).filter(b => b.by === n).map(b => b.week || 0));
    if (ctx.week >= 4 && ctx.week - lastPress >= 3) notice(state, n, 'game', -0.08, '', ctx.week);
  }
  const missions = [];
  for (const r of settleMissions(state, ctx, { house: room, nominees })) {
    if (r.won) for (const h of r.mission.holders) { pub(h, 'fun', 0.35, 'pulled off a secret mission'); pub(h, 'game', 0.3, 'pulled off a secret mission'); }
    else for (const h of r.mission.holders) pub(h, 'pity', 0.08, 'failed a secret mission');
    missions.push(r);
  }
  // The night's segments (js/ss/prime.js): every one has consequences, applied
  // here, BEFORE the lines close, so the public votes on what it just watched.
  const night = playPrime(state, ctx, { house: room, nominees, missions, tools: state.tools || {} });
  // THE FAKE VOLUNTARY DEPARTURE (js/ss/hidden.js, S6, S7): the Voice offers a housemate their kitty to walk out of
  // the game, on air. They take it, say goodbye, walk out the door, and climb the stairs. The verdict stays real.
  {
    const plan = fakePlanFor(state, ctx.week, room.length);
    if (plan?.kind === 'voluntary') {
      const who = room.filter(n => !nominees.includes(n))
        .sort((a, b) => (st(b, 'boldness') + st(b, 'strategic') * 0.5 + rng() * 4) - (st(a, 'boldness') + st(a, 'strategic') * 0.5 + rng() * 4))[0];
      if (who) {
        state.pendingVoluntary = who;
        state.pendingVoluntaryPlan = { weeks: plan.weeks, role: plan.role };
        usePlan(plan, 'voluntary');
        /** @type {any[]} */ (night.segments).push({ kind: 'voluntary', to: who, kitty: Number(state.kitty?.[who]) || 0, effects: { bond: [], pop: [] } });
        pub(who, 'fun', 0.2, 'walked out of the game on the prime');
      }
    }
  }
  // THE SEMI PRIME (js/ss/final.js): the hunt closes, the secrets nobody found are unveiled and paid.
  if (room.length <= (Number(seasonConfig?.finaleSize) || 3) + 1 && !state.huntClosed) {
    const unveiled = unveilSecrets(state, ctx, { house: room });
    for (const u of unveiled) for (const h of u.holders) {
      pub(h, 'arc', 0.3, 'kept the secret to the semi-final'); pub(h, 'game', 0.3, 'kept the secret to the semi-final');
      const sk = (state.secrets || []).find(s => s.text === u.text);
      if (MOVING.includes(sk?.secretKind)) pub(h, 'warmth', 0.25, 'told the story behind the secret');
    }
    /** @type {any[]} */ (night.segments).unshift({ kind: 'unveil', list: unveiled, bonus: KEPT_BONUS, place: finalPlace(state), effects: { bond: [], pop: [] } });
  }
  // THE ACCUSATION (js/ss/signatures.js): somebody sure enough names the season's secret pair.
  {
    const acc = accuseRole(state, ctx, { house: room });
    if (acc) {
      if (acc.right) { pub(acc.by, 'game', 0.5, `unmasked ${ROLE_NAMES[acc.role]}`); pub(acc.by, 'fun', 0.3, `unmasked ${ROLE_NAMES[acc.role]}`);
        for (const p of acc.pair) { pub(p, 'fun', 0.25, `was unmasked as one of ${ROLE_NAMES[acc.role]}`); pub(p, 'heat', 0.3, `was unmasked as one of ${ROLE_NAMES[acc.role]}`); try { addBond(acc.by, p, -1.5); } catch { /* */ } } }
      else { pub(acc.by, 'fun', 0.1, 'accused the wrong people'); pub(acc.by, 'warmth', -0.1, 'accused the wrong people');
        for (const x of acc.named) { try { addBond(x, acc.by, -1.2); } catch { /* */ } } }
      /** @type {any[]} */ (night.segments).push({ kind: 'accusation', ...acc, effects: { bond: [], pop: [] } });
    }
  }
  // THE HIDDEN GROUP COMES IN (js/ss/hidden-groups.js): live, on the prime, onto the house list for next week
  {
    const came = enterFromGroup(state, state._groupEntering || []);
    state._groupEntering = null;
    if (came.length) {
      gs.activePlayers = [...new Set([...(gs.activePlayers || []), ...came.map(e => e.name)])];
      for (const e of came) pub(e.name, 'seen', 0.3, `walked into the house from ${state.group?.name || 'the hidden space'}`);
      /** @type {any[]} */ (night.segments).unshift({ kind: 'entry', group: state.group?.id, groupName: state.group?.name, space: state.group?.space, came, left: groupHidden(state), effects: { bond: [], pop: [] } });
    }
  }
  // THE RETURN (js/ss/hidden.js): back down from the secret room, with a power. Back on the house
  // list now, so the week engine's roster keeps them (a late arrival keeps the seat it was given).
  for (const b of bringBack(state, ctx, { house: room })) {
    gs.activePlayers = [...new Set([...(gs.activePlayers || []), b.name])];
    // (the accomplice knew all along: the house was lied to; the one upstairs owes them)
    const acc = b.accomplice ? [[b.name, b.accomplice, 1.5], ...room.filter(n => n !== b.accomplice && n !== b.name).slice(0, 4).map(n => [n, b.accomplice, -0.4])] : [];
    if (b.accomplice) pub(b.accomplice, 'game', 0.25, `kept ${b.name}'s secret room from the house`);
    /** @type {any[]} */ (night.segments).unshift({ kind: 'return', ...b, effects: { bond: [...b.glad.map(n => [b.name, n, -1]), ...b.mourners.map(n => [b.name, n, 1]), ...acc], pop: [] } });
    pub(b.name, 'arc', 0.5, 'came back from the secret room'); pub(b.name, 'fun', 0.3, 'came back from the secret room');
    for (const n of b.glad) pub(n, 'pity', 0.05, '');
  }
  // the week's deception, revealed live (js/ss/deceptions.js); the ticket, voted live (js/ss/public-votes.js)
  const fvSeg = revealFalseVoice(state, ctx, { house: room });
  if (fvSeg) /** @type {any[]} */ (night.segments).push(fvSeg);
  const rbSeg = unmaskRobot(state, ctx, { house: room });
  if (rbSeg) /** @type {any[]} */ (night.segments).push(rbSeg);
  if (ticketDue(state, ctx, { house: room })) {
    const tk = ticketVote(state, ctx, { house: room });
    if (tk.winner) { /** @type {any[]} */ (night.segments).push(tk); pub(tk.winner, 'game', 0.25, 'was voted straight through by the house'); }
  }
  for (const s of /** @type {any[]} */ (night.segments)) {
    for (const [a, b, d] of s.effects?.bond || []) { try { addBond(a, b, d); } catch { /* no bond */ } }
    // (the Bridge of Sacrifices carries the public's read of each crossing: js/ss/prime-themes.js)
    for (const [n, axis, d, why] of s.pub || []) pub(n, axis, d, why);
    popFx(s.effects?.pop, s.kind);
    // and what the country made of it
    if (s.kind === 'return') { /* its bonds are above */ }
    else if (s.kind === 'dilemma') {
      if (s.heart) pub(s.to, 'warmth', 0.35, 'chose the heart over the money');
      else { pub(s.to, 'fun', 0.22, 'took the deal'); pub(s.to, 'heat', 0.2, 'took the deal'); }
    } else if (s.kind === 'phone' && s.answered) pub(s.answered, 'fun', 0.15, 'ran for the red phone');
    else if (s.kind === 'truths') {
      pub(s.subject, 'pity', 0.4, 'sat in the room of truths and heard what the house really thinks');
      if (s.reaction === 'explodes') pub(s.subject, 'fun', 0.25, 'lost it in the room of truths');
      for (const t of s.talkers || []) { pub(t, 'real', -0.22, `was two-faced about ${s.subject}`); pub(t, 'heat', 0.12, `was two-faced about ${s.subject}`); }
    } else if (s.kind === 'visit') { pub(s.to, 'pity', 0.2, 'got a visit from home'); pub(s.to, 'warmth', 0.25, 'got a visit from home'); pub(s.to, 'arc', 0.15, 'got a visit from home'); }
  }
  (state.primes ||= []).push({ week: ctx.week, name: night.name, theme: night.theme || null, segments: night.segments.map(s => s.kind) });
  const players = [...new Set(/** @type {any[]} */ (night.segments).flatMap(s => [s.to, s.answered, s.subject, s.target, ...(s.talkers || []), ...(s.mission?.holders || [])]).filter(Boolean))];
  return [{ type: 'ss-prime', week: ctx.week, name: night.name, theme: night.theme || null, nominees: [...nominees], segments: night.segments, holders: players.slice(0, 6),
    // last week's eliminated, on the studio couch all night (S14)
    couch: state.lastEvicted && state.lastEvicted.week === ctx.week - 1 ? state.lastEvicted.name : null,
    kitty: { ...(state.kitty || {}) },
    // (where each kitty stood when the week began: the board rolls from there, vp-bb-ep/ss-hud.js)
    kittyStart: { ...(state.kittyAtWeekStart || {}) },
    beats: [{ text: `The prime: ${night.name}.`, players: players.slice(0, 4), badgeText: 'THE PRIME', badgeClass: 'gold', part: 'prime' }] }];
}

/** The country, read for After Secret: its favourite (and the group carrying them), the one it
 *  loves to hate, the one it never sees, and the gamers' own favourite. */
function readThePublic(state, room) {
  // the country, read for the viewers: its favourite, the one it loves to hate, the one it never sees
  const reads = room.map(n => ({ n, s: support(state, n), r: publicRead(state, n), f: fileOf(state, n) }));
  const whyOf = (f, axis) => [...(f.log || [])].reverse().find(l => l.axis === axis && l.d > 0)?.why || null;
  const AX = { sweetheart: 'warmth', underdog: 'pity', character: 'fun', story: 'arc', villain: 'heat', hated: 'heat', player: 'game' };
  const pick = list => list[0] ? { name: list[0].n, label: list[0].r.label, key: list[0].r.key, why: whyOf(list[0].f, AX[list[0].r.key] || 'warmth') } : null;
  const out = {
    favourite: pick(reads.slice().sort((a, b) => b.s - a.s)),
    villain: pick(reads.filter(x => x.r.key === 'villain' || x.r.key === 'hated').sort((a, b) => b.f.heat - a.f.heat)),
    unseen: pick(reads.filter(x => x.r.key === 'unseen').sort((a, b) => a.f.seen - b.f.seen)),
    // the gamers' favourite: the best player, whatever the country thinks of them otherwise
    player: (() => { const p = reads.filter(x => x.f.game > 0.6).sort((a, b) => b.f.game - a.f.game)[0]; return p ? { name: p.n, why: whyOf(p.f, 'game') } : null; })(),
  };
  // which group of the audience carries the favourite
  if (out.favourite) { const g = carriedBy(state, out.favourite.name); out.favourite.carriedBy = g ? GROUP_LABEL[g] : null; }
  return out;
}

/**
 * After the public's verdict: the secret the house never found is told on the
 * set, and After Secret (the host and Blaineley) reads the house to the
 * viewers. Runs on the house as it stands after the elimination.
 */
export function afterPrime(opts = {}) {
  const a = afterPrimeCore(opts);
  const state = ssState();
  if (!a || !state) return a;
  const hidden = a.fake ? [a.evicted, ...(a.pair ? [a.pair] : [])] : [];
  // the voluntary departure from tonight's prime climbs the stairs too
  const v = state.pendingVoluntary;
  if (v && (opts.house || []).includes(v) && v !== a.evicted) {
    const p = state.pendingVoluntaryPlan || {};
    state.pendingVoluntary = null; state.pendingVoluntaryPlan = null;
    const ctx = huntCtx(opts.week, opts.rng || Math.random);
    const sent = sendToSecretRoom(state, ctx, { name: v, house: (opts.house || []).filter(n => n !== v && n !== opts.evicted), weeks: p.weeks || 1, role: p.role || 'watch', kind: 'voluntary' });
    a.voluntary = { ...sent };
    hidden.push(v);
  }
  a.hidden = hidden;
  return a;
}
function afterPrimeCore({ week = undefined, evicted = null, house = [], rng = Math.random, fake = false, second = null, power = null } = {}) {
  const state = ssState();
  if (!state || !evicted) return null;
  const room = house.filter(n => n && n !== evicted);
  const ctx = huntCtx(week, rng);
  if (fake) {
    // not the studio: the secret room. The secret is NOT told; the house mourns a housemate who is upstairs.
    const plan = fakePlanFor(state, ctx.week, room.length + 1) || { weeks: 1, role: 'watch' };
    const pair = second && room.includes(second) ? second : null;
    const kind = pair ? 'double' : power ? 'power' : 'verdict';
    usePlan(plan, kind);
    const left = room.filter(n => n !== pair);
    const sent = sendToSecretRoom(state, ctx, { name: evicted, house: left, weeks: plan.weeks, role: plan.role, kind, partner: pair, space: plan.space || null });
    if (pair) sendToSecretRoom(state, ctx, { name: pair, house: left, weeks: plan.weeks, role: plan.role === 'remote' ? 'watch' : plan.role, kind, partner: evicted, space: plan.space || null });
    if (power) { try { addBond(evicted, power, -2); } catch { /* */ } pub(power, 'heat', 0.3, `eliminated ${evicted} with the Voice's power`); }
    pub(evicted, 'seen', 0.5, '');
    const after = afterShow(state, ctx, { evicted, house: left, popOf: n => support(state, n) });
    after.public = readThePublic(state, left);
    return { type: 'ss-after', week: ctx.week, evicted, fake: true, mourners: sent.mourners, glad: sent.glad, reveal: null, after, holders: [evicted, ...(pair ? [pair] : [])],
      pair, power, role: sent.role, weeks: sent.weeks, accomplice: sent.accomplice, fakeKind: kind, space: sent.space,
      beats: [{ text: `${evicted} is not eliminated: the Voice sends ${evicted} to the secret room. The house thinks ${evicted} has gone.`, players: [evicted], badgeText: 'SECRET ROOM', badgeClass: 'purple', part: 'after' }] };
  }
  const reveal = revealOnExit(state, { evicted, house: room, week: ctx.week });
  // a partner left in the house is exposed with it: the house knows now
  for (const p of reveal?.partners || []) pub(p, 'pity', 0.2, 'had a shared secret come out on the set');
  // the ones who were right and never pressed: "I knew it", and the house hears it
  for (const n of reveal?.right || []) pub(n, 'fun', 0.05, 'had it right all along');
  const after = afterShow(state, ctx, { evicted, house: room, popOf: n => support(state, n) });
  after.public = readThePublic(state, room);
  // THE FAREWELL POWER (S14 semi-final; the draw's `farewell` tool): from the studio, the eliminated
  // gives $2,000 to the friend still inside and halves the kitty of the one they blame most
  let farewell = null;
  if (room.length >= 4 && rng() < (RATE.farewell?.[state.tools?.farewell] ?? 0)) {
    const byBond = room.slice().sort((a, b) => bond(evicted, b) - bond(evicted, a));
    const friend = byBond[0], foe = byBond[byBond.length - 1];
    if (friend && foe && friend !== foe) {
      mint(state, friend, 2000, `${evicted}'s farewell gift`, ctx.week);
      const lost = burn(state, foe, Math.floor((Number(state.kitty?.[foe]) || 0) / 2), `${evicted}'s farewell power`, ctx.week);
      farewell = { friend, foe, gift: 2000, lost };
      pub(evicted, 'fun', 0.15, 'used the farewell power');
      // the house hears it at the next prime: the foe knows who did it
      try { addBond(foe, friend, -0.3); } catch { /* */ }
    }
  }
  // who sits on the studio couch at the next prime
  state.lastEvicted = { name: evicted, week: ctx.week };
  return { type: 'ss-after', week: ctx.week, evicted, reveal, after, farewell, read: publicRead(state, evicted), holders: [evicted],
    beats: [{ text: reveal && !reveal.alreadyFound ? `${evicted}'s secret, never found, is told on the set: ${reveal.secret}.` : `${evicted} leaves the House of Secrets.`,
      players: [evicted], badgeText: 'AFTER SECRET', badgeClass: 'gold', part: 'after' }] };
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
  // Immunities won at last week's prime (a dilemma, the red phone) hold this week.
  immune = [...new Set([...immune, ...((ssState()?.nextImmune || {})[wk] || [])])];
  // THE CARDS, before the vote (js/ss/powers.js): the immunity thief, the nomination ring
  const cardState = ssState();
  const cardCtx = huntCtx(week, rng);
  if (cardState) expireCards(cardState, wk);
  const pre = cardState ? cardsBeforeNominations(cardState, cardCtx, { house: room, immune, week: wk }) : { immune, dOffice: [], played: [] };
  immune = pre.immune;
  const eligible = l => l.filter(n => !immune.includes(n));
  // The revival's rule: everybody nominates anybody.
  const mixed = ssState()?.rule === 'mixed';
  // this week's twist (js/ss/nomination-twists.js): the Immunity House cannot be named
  const nt = cardState ? twistOf(cardState, wk) : null;
  if (nt?.kind === 'houses') immune = [...new Set([...immune, ...nt.immuneHouse.filter(n => room.includes(n))])];
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
  // ...and the week's twist: the red room's two, the one nominated for life
  const lifer = state ? forLifeNow(state, wk) : null;
  const twistUp = [...(nt?.kind === 'red-room' ? [nt.who, nt.dragged] : []), ...(lifer ? [lifer] : [])];
  const dOffice = [...new Set([...(state ? dOfficeFor(state, wk) : []), ...(direct ? [direct] : []), ...pre.dOffice, ...twistUp])].filter(n => room.includes(n));
  pool = pool.filter(n => !dOffice.includes(n));
  // Who names whom, and why (js/ss/nominations.js); the Voice's extra votes
  // against (a broken commandment, the red phone) count on top.
  const extra = state ? extraVotesFor(state, wk) : {};
  // How many go up this week (the real show varies it: two most weeks, three or four on a big week). Read off the
  // week and the room, not the season's dice, so the rest of the season plays as it did.
  // The setting (season setup, "Nominees each week"): the classic seasons put two up most weeks; the revival
  // (2024-2026, fr.wikipedia: S13 averaged 3.6) three or four, sometimes five. 'auto' follows the nominations rule.
  const roll = [...`${wk}|${room.join(',')}`].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 100;
  const style = seasonConfig?.ssNomineeCount === 'classic' || seasonConfig?.ssNomineeCount === 'revival' ? seasonConfig.ssNomineeCount
    : (ssState()?.rule === 'mixed' ? 'revival' : 'classic');
  const seats = room.length < 7 ? 2 : style === 'revival'
    ? (room.length < 9 ? (roll < 60 ? 3 : 2) : roll < 50 ? 3 : roll < 85 ? 4 : 5)
    : (wk <= 1 || room.length < 9 ? 2 : roll < 85 ? 2 : 3);
  // The secret room's trades this week (js/ss/secret-room.js): a vote taken away, a vote doubled.
  const blocked = (state?.rules?.blockedVote?.[wk] || []).filter(n => voters.includes(n));
  const double = (state?.rules?.doubleVote?.[wk] || []).filter(n => voters.includes(n) && !blocked.includes(n));
  voters = voters.filter(n => !blocked.includes(n));
  // the Nomination House nominates among itself; the exclusive nominator names them all alone
  if (nt?.kind === 'houses') pool = pool.filter(n => nt.nominationHouse.includes(n));
  const exclusive = nt?.kind === 'exclusive' && room.includes(nt.who) ? nt.who : null;
  if (exclusive) { voters = [exclusive]; pool = pool.filter(n => n !== exclusive); }
  // (five at most: direct nominations take the house's seats first, and four of them leave the house no vote)
  // (a linked week names half as many: every name the house reads can bring a partner up with it)
  const seatsNow = dOffice.length >= 4 ? 0 : nt?.kind === 'linked' ? Math.max(1, 2 - dOffice.length)
    : Math.max(dOffice.length >= 3 ? 1 : 2, Math.min(seats, pool.length - 1, 5 - dOffice.length));
  // the whole house faces the public this week (S7's opening, S12 weeks one and five): no vote at all
  const everybody = nt?.kind === 'everybody';
  const cast = seatsNow && !everybody ? castNominations(state || {}, huntCtx(week, rng), { voters, pool, extraVotes: extra, double, seats: seatsNow,
    invert: nt?.kind === 'inverted', picksPer: exclusive ? seatsNow : 2 }) : { nominees: [], ballots: [], tally: {}, secondRound: null };
  let before = everybody ? room.slice() : [...dOffice, ...cast.nominees];
  // THE CARDS, after the result (js/ss/powers.js): the secret immunity, the Switch, the Joker; one a night
  const post = state && !everybody ? cardsAfterNominations(state, cardCtx, { house: room, nominees: before, immune, week: wk, tally: cast.tally, locked: lifer ? [lifer] : [] }) : { nominees: before, played: [] };
  // linked destinies: a nominee's partner goes up too (unless immune)
  const linked = [];
  if (nt?.kind === 'linked') for (const n of [...post.nominees]) {
    const pair = (nt.pairs || []).find(p => p.includes(n));
    const p = pair && pair.find(x => x !== n);
    if (p && room.includes(p) && !immune.includes(p) && !post.nominees.includes(p) && !linked.some(l => l.to === p)) linked.push({ from: n, to: p });
  }
  let nominees = [...post.nominees, ...linked.map(l => l.to)];
  // five at most, ever (but the week the whole house is up): a tie in the house's vote can still read out more.
  // The house-voted names the fewest named come off; never a direct nomination, a nomination for life, a linked
  // partner or a card's target.
  if (!everybody && nominees.length > 5) {
    const keep = new Set([...dOffice, lifer, ...linked.map(l => l.to), ...post.played.map(p => p.put)].filter(Boolean));
    const T = cast.tally || {};
    const cut = nominees.filter(n => !keep.has(n)).sort((a, b) => (cast.inverted ? (T[b] || 0) - (T[a] || 0) : (T[a] || 0) - (T[b] || 0)));
    // (a name that comes off takes the partner it brought up with it; and off the list the Voice reads out too)
    while (nominees.length > 5 && cut.length) {
      const x = cut.shift();
      const gone = [x, ...linked.filter(l => l.from === x).map(l => l.to)];
      nominees = nominees.filter(n => !gone.includes(n)); before = before.filter(n => !gone.includes(n));
      for (let i = linked.length - 1; i >= 0; i--) if (gone.includes(linked[i].from) || gone.includes(linked[i].to)) linked.splice(i, 1);
    }
    // (still over, when the Voice's own names bring partners: the last partners linked stay safe this time)
    while (nominees.length > 5 && linked.length) { const l = linked.pop(); nominees = nominees.filter(n => n !== l?.to); }
  }
  return { nominees, before, cards: [...pre.played, ...post.played], twist: nt ? { kind: nt.kind, who: nt.who || null, dragged: nt.dragged || null, pairs: nt.pairs || null,
    immuneHouse: nt.immuneHouse || null, nominationHouse: nt.nominationHouse || null } : null, lifer, linked, inverted: !!cast.inverted, exclusive, ballots: cast.ballots, tally: cast.tally, rule, blocked, double, voiceTie: !!cast.secondRound?.stillTied, secondRound: cast.secondRound,
    dOffice, extraVotes: extra, immune: immune.filter(n => room.includes(n)) };
}

// How the country splits its vote: popularity sets the order, but nobody who made it this far is
// voted for by nobody. A floor under every name, then the gap between them, plus the night's noise.
function shares(names, rng, noise) {
  const lo = Math.min(...names.map(pop));
  return Object.fromEntries(names.map(n => [n, Math.max(0.4, 3 + (pop(n) - lo) * 0.6 + (rng() - 0.5) * noise)]));
}

/** The public's eviction vote: the nominee the country likes least goes. Percentages to SAVE. */
export function secretStoryPublicVote({ nominees = [], rng = Math.random, week = undefined, houseSize = 0, house = [] } = {}) {
  if (!nominees.length) return null;
  // the country saves by fan base (js/ss/public.js); an old save with no file votes the old way
  const state = ssState();
  let percents;
  if (state?.public) percents = voteShares(state, nominees, rng, 0.2);
  else {
    const s = shares(nominees, rng, 2.5);
    const total = Object.values(s).reduce((a, b) => a + b, 0) || 1;
    percents = Object.fromEntries(nominees.map(n => [n, Math.round((s[n] / total) * 1000) / 10]));
  }
  const order = nominees.slice().sort((a, b) => percents[a] - percents[b]);
  let evicted = order[0];
  // the fake elimination (js/ss/hidden.js): the verdict is read as usual; the house will believe it.
  // A double sends the two lowest up together; an elimination power hands the choice to one housemate.
  const plan = state ? fakePlanFor(state, Number(week?.num) || 0, houseSize) : null;
  const fake = !!plan && plan.kind !== 'voluntary';
  // THE NIGHT THE PUBLIC DECIDES DIFFERENTLY (js/ss/public-votes.js): to eliminate, or the house picks from the
  // public's bottom two. Never on a fake elimination's night.
  const mode = state && !fake ? voteMode(state, huntCtx(week, rng), { nominees }) : 'save';
  if (state) (state.voteModes ||= {})[Number(week?.num) || 0] = mode;
  if (mode === 'evict' && nominees.length >= 2) {
    const against = evictShares(state, nominees, rng, 0.2);
    const out = nominees.slice().sort((a, b) => against[b] - against[a])[0];
    return { evicted: out, percents: against, saved: nominees.filter(n => n !== out), mode, fake: false, second: null, power: null, fakeKind: null };
  }
  if (mode === 'house-decides' && nominees.length >= 2) {
    const bottom = order.slice(0, 2);
    const hd = houseDecides(huntCtx(week, rng), { bottom, house, publicLowest: order[0] });
    return { evicted: hd.evicted, percents, saved: nominees.filter(n => n !== hd.evicted), mode, bottom, houseVotes: hd.votes, houseTally: hd.tally, houseTie: hd.tie,
      fake: false, second: null, power: null, fakeKind: null };
  }
  let second = null, power = null;
  if (fake && plan.kind === 'double' && order.length >= 3) second = order[1];
  if (fake && plan.kind === 'power') {
    const holder = house.filter(n => !nominees.includes(n)).sort((a, b) => (st(b, 'strategic') + st(b, 'boldness') + rng() * 3) - (st(a, 'strategic') + st(a, 'boldness') + rng() * 3))[0];
    if (holder) { power = holder; evicted = nominees.slice().sort((a, b) => bond(holder, a) - bond(holder, b))[0]; }
  }
  return { evicted, percents, saved: nominees.filter(n => n !== evicted && n !== second), mode, fake, second, power, fakeKind: fake ? (second ? 'double' : power ? 'power' : 'verdict') : null };
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
      // what the country thought of them, at the end (js/ss/public.js)
      publicRead: state?.public?.[n] ? publicRead(state, n).label : null,
    };
  }
  return { players, secrets };
}

/**
 * THE FINAL WEEK (js/ss/final.js): the eliminated come back for a day, a few at a time, and each
 * finalist's journey is told. Before the final vote: the last days move the country too.
 */
export function secretStoryFinalWeek({ finalists = [], rng = Math.random } = {}) {
  const state = ssState();
  if (!state) return [];
  const ctx = huntCtx({ num: (gs.bb?.weeks?.length || 0) + 1 }, rng);
  const eliminated = (gs.eliminated || []).filter(n => !finalists.includes(n));
  const visits = finalWeekReturns(state, ctx, { finalists, eliminated });
  for (const v of visits) {
    if (!v.with) continue;
    if (v.kind === 'reunion') { try { addBond(v.who, v.with, 1); } catch { /* */ } pub(v.with, 'warmth', 0.08, `was welcomed back by ${v.who}`); }
    else { try { addBond(v.who, v.with, -1); } catch { /* */ } pub(v.with, 'fun', 0.1, `faced ${v.who} again in the final week`); }
  }
  const acts = [];
  if (visits.length) acts.push({ type: 'ss-returns', visits, beats: [{ text: `The eliminated come back for a day: ${visits.map(v => v.who).join(', ')}.`, players: visits.map(v => v.who).slice(0, 4), badgeText: 'THE RETURNS', badgeClass: 'gold', part: 'final' }] });
  // THE SEASON, AS THE FINAL TELLS IT (the real finals: docs/research/secret-story-transcripts.md §4):
  // each finalist's record for the Voice's farewell, and the joke awards, all from what really happened
  const nominatedTimes = n => Number(state.nominated?.[n]) || 0;
  const facts = Object.fromEntries(finalists.map(n => {
    const s = (state.secrets || []).find(x => (x.holders || []).includes(n));
    const friend = finalists.concat(eliminated).filter(x => x !== n).sort((a, b) => bond(n, b) - bond(n, a))[0] || null;
    return [n, { secret: s?.text || null, foundBy: s?.found ? s.foundBy || null : null, foundWeek: s?.found ? s.week ?? null : null,
      kept: !!s && !s.found, unveiled: s?.unveiled ?? null, nominated: nominatedTimes(n), friend, read: publicRead(state, n).label }];
  }));
  const everyone = [...finalists, ...eliminated];
  const buzzCount = n => (state.buzzes || []).filter(b => b.by === n).length;
  const awards = [];
  const presser = everyone.slice().sort((a, b) => buzzCount(b) - buzzCount(a))[0];
  if (presser && buzzCount(presser) >= 2) awards.push({ id: 'buzzer', who: presser, n: buzzCount(presser) });
  const wild = (state.buzzes || []).find(b => !b.right && b.guess && b.target);
  if (wild) awards.push({ id: 'theory', who: wild.by, about: wild.target, guess: wild.guess });
  const first = (state.secrets || []).filter(x => x.found && x.foundBy).sort((a, b) => (a.week ?? 99) - (b.week ?? 99))[0];
  if (first) awards.push({ id: 'fastest', who: first.foundBy, week: first.week, of: (first.holders || [])[0] });
  const calm = finalists.slice().sort((a, b) => nominatedTimes(a) - nominatedTimes(b))[0];
  if (calm && finalists.every(n => n === calm || nominatedTimes(n) > nominatedTimes(calm))) awards.push({ id: 'untouchable', who: calm, n: nominatedTimes(calm) });
  acts.push({ type: 'ss-journeys', finalists: [...finalists], journeys: Object.fromEntries(finalists.map(n => [n, journeyOf(state, n)])),
    kitties: Object.fromEntries(finalists.map(n => [n, Number(state.kitty?.[n]) || 0])),
    studio: eliminated.slice(), facts, awards,
    // who in the studio is behind whom (their closest finalist)
    support: Object.fromEntries(eliminated.map(e => [e, finalists.slice().sort((a, b) => bond(e, b) - bond(e, a))[0] || null])) });
  return acts;
}

/** The public's final vote, among the finalists. The winner takes their kitty, and the cheque. */
export function secretStoryFinalVote({ finalists = [], rng = Math.random } = {}) {
  if (!finalists.length) return null;
  const state = ssState();
  let percents;
  if (state?.public) percents = voteShares(state, finalists, rng, 0.15);
  else {
    const s = shares(finalists, rng, 2);
    const total = Object.values(s).reduce((a, b) => a + b, 0) || 1;
    percents = Object.fromEntries(finalists.map(n => [n, Math.round((s[n] / total) * 1000) / 10]));
  }
  const order = finalists.slice().sort((a, b) => percents[b] - percents[a]);
  const winner = order[0];
  // (whether the winner's secret survived: their speech must not claim it did when it was found)
  const kept = !(state?.secrets || []).some(s => (s.holders || []).includes(winner) && s.found);
  return { winner, order, percents, kitty: state?.kitty?.[winner] ?? KITTY_START, cheque: CHEQUE, kept,
    secrets: (state?.secrets || []).map(x => ({ holders: [...x.holders], text: x.text, found: x.found, foundBy: x.foundBy, unveiled: x.unveiled ?? null })) };
}
