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
import { huntOf, huntDay, showClue, runBuzzes, secretOf } from '../ss/hunt.js';
import { weeklyRuleBreaks, dOfficeFor, extraVotesFor, COMMANDMENTS, COMMANDMENTS_REVIVAL } from '../ss/voice.js';
import { resolveWeekly, settleWeeklyGame } from '../ss/games.js';
import { handOutMissions, playMissions, settleMissions } from '../ss/missions.js';
import { castNominations } from '../ss/nominations.js';
import { playPrime, revealOnExit, afterShow } from '../ss/prime.js';
import { throwParty, runSuperette } from '../ss/parties.js';
import { isFakeNight, sendToSecretRoom, watchFromSecretRoom, bringBack } from '../ss/hidden.js';
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
  // THE SEASON'S DRAW (js/ss/twists.js): a signature and every tool's level, redrawn until it is
  // not too close to a past Secret Story season in the franchise ledger. Settings lock pieces.
  {
    const st0 = gs.bb.secretStory;
    let past = [];
    try { past = Object.values(activeSeasons() || {}).map(r => r?.ssDraw).filter(Boolean); } catch { past = []; }
    const locks = { signature: seasonConfig?.ssSignature || undefined,
      secretRoom: seasonConfig?.ssSecretRoom === 'on' ? 'on' : seasonConfig?.ssSecretRoom === 'off' ? 'off' : undefined };
    st0.draw = drawSeason({ castSize: room.length, past, locks, rng });
    st0.tools = { ...st0.draw.tools };
    (st0.plan ||= {}).secretRoomWeek = st0.draw.secretRoomWeek;
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
  const launch = planLaunch(gs.bb.secretStory, huntCtx(undefined, rng), { house: room.slice().sort(() => rng() - 0.5) });
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
    acts.push({ type: 'ss-secret-room', week: ctx.week, who: w.name, moments: w.moments, heard: w.heard,
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
  // THE RETURN (js/ss/hidden.js): back down from the secret room, with a power. Back on the house
  // list now, so the week engine's roster keeps them (a late arrival keeps the seat it was given).
  for (const b of bringBack(state, ctx, { house: room })) {
    gs.activePlayers = [...new Set([...(gs.activePlayers || []), b.name])];
    /** @type {any[]} */ (night.segments).unshift({ kind: 'return', ...b, effects: { bond: [...b.glad.map(n => [b.name, n, -1]), ...b.mourners.map(n => [b.name, n, 1])], pop: [] } });
    pub(b.name, 'arc', 0.5, 'came back from the secret room'); pub(b.name, 'fun', 0.3, 'came back from the secret room');
    for (const n of b.glad) pub(n, 'pity', 0.05, '');
  }
  for (const s of /** @type {any[]} */ (night.segments)) {
    for (const [a, b, d] of s.effects?.bond || []) { try { addBond(a, b, d); } catch { /* no bond */ } }
    popFx(s.effects?.pop, s.kind);
    // and what the country made of it
    if (s.kind === 'return') { /* its bonds are above */ }
    else if (s.kind === 'dilemma') {
      if (s.heart) pub(s.to, 'warmth', 0.35, 'chose the heart over the money');
      else { pub(s.to, 'fun', 0.22, 'took the deal'); pub(s.to, 'heat', 0.2, 'took the deal'); }
    } else if (s.kind === 'phone' && s.answered) pub(s.answered, 'fun', 0.15, 'ran for the red phone');
    else if (s.kind === 'truths') {
      pub(s.subject, 'pity', 0.4, 'watched what the house says about them');
      if (s.reaction === 'explodes') pub(s.subject, 'fun', 0.25, 'lost it in the room of truths');
      for (const t of s.talkers || []) { pub(t, 'real', -0.22, `was two-faced about ${s.subject}`); pub(t, 'heat', 0.12, `was two-faced about ${s.subject}`); }
    } else if (s.kind === 'visit') { pub(s.to, 'pity', 0.2, 'got a visit from home'); pub(s.to, 'warmth', 0.25, 'got a visit from home'); pub(s.to, 'arc', 0.15, 'got a visit from home'); }
  }
  (state.primes ||= []).push({ week: ctx.week, name: night.name, segments: night.segments.map(s => s.kind) });
  const players = [...new Set(/** @type {any[]} */ (night.segments).flatMap(s => [s.to, s.answered, s.subject, s.target, ...(s.talkers || []), ...(s.mission?.holders || [])]).filter(Boolean))];
  return [{ type: 'ss-prime', week: ctx.week, name: night.name, nominees: [...nominees], segments: night.segments, holders: players.slice(0, 6),
    // last week's eliminated, on the studio couch all night (S14)
    couch: state.lastEvicted && state.lastEvicted.week === ctx.week - 1 ? state.lastEvicted.name : null,
    kitty: { ...(state.kitty || {}) },
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
export function afterPrime({ week = undefined, evicted = null, house = [], rng = Math.random, fake = false } = {}) {
  const state = ssState();
  if (!state || !evicted) return null;
  const room = house.filter(n => n && n !== evicted);
  const ctx = huntCtx(week, rng);
  if (fake) {
    // not the studio: the secret room. The secret is NOT told; the house mourns a housemate who is upstairs.
    const sent = sendToSecretRoom(state, ctx, { name: evicted, house: room });
    pub(evicted, 'seen', 0.5, '');
    const after = afterShow(state, ctx, { evicted, house: room, popOf: n => support(state, n) });
    after.public = readThePublic(state, room);
    return { type: 'ss-after', week: ctx.week, evicted, fake: true, mourners: sent.mourners, glad: sent.glad, reveal: null, after, holders: [evicted],
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
  // Who names whom, and why (js/ss/nominations.js); the Voice's extra votes
  // against (a broken commandment, the red phone) count on top.
  const extra = state ? extraVotesFor(state, wk) : {};
  const cast = castNominations(state || {}, huntCtx(week, rng), { voters, pool, extraVotes: extra });
  const nominees = [...dOffice, ...cast.nominees];
  return { nominees, ballots: cast.ballots, tally: cast.tally, rule, voiceTie: !!cast.secondRound?.stillTied, secondRound: cast.secondRound,
    dOffice, extraVotes: extra, immune: immune.filter(n => room.includes(n)) };
}

// How the country splits its vote: popularity sets the order, but nobody who made it this far is
// voted for by nobody. A floor under every name, then the gap between them, plus the night's noise.
function shares(names, rng, noise) {
  const lo = Math.min(...names.map(pop));
  return Object.fromEntries(names.map(n => [n, Math.max(0.4, 3 + (pop(n) - lo) * 0.6 + (rng() - 0.5) * noise)]));
}

/** The public's eviction vote: the nominee the country likes least goes. Percentages to SAVE. */
export function secretStoryPublicVote({ nominees = [], rng = Math.random, week = undefined, houseSize = 0 } = {}) {
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
  const evicted = nominees.slice().sort((a, b) => percents[a] - percents[b])[0];
  // the fake elimination (js/ss/hidden.js): the verdict is read as usual; the house will believe it
  const fake = !!state && isFakeNight(state, Number(week?.num) || 0, houseSize);
  return { evicted, percents, saved: nominees.filter(n => n !== evicted), fake };
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
  acts.push({ type: 'ss-journeys', finalists: [...finalists], journeys: Object.fromEntries(finalists.map(n => [n, journeyOf(state, n)])),
    kitties: Object.fromEntries(finalists.map(n => [n, Number(state.kitty?.[n]) || 0])) });
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
  return { winner, order, percents, kitty: state?.kitty?.[winner] ?? KITTY_START, cheque: CHEQUE,
    secrets: (state?.secrets || []).map(x => ({ holders: [...x.holders], text: x.text, found: x.found, foundBy: x.foundBy, unveiled: x.unveiled ?? null })) };
}
