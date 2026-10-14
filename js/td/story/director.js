// ══════════════════════════════════════════════════════════════════════
// td/story/director.js — which camp scenes an episode airs, and in what order
// ══════════════════════════════════════════════════════════════════════
//
// Spec docs/superpowers/specs/2026-10-07-td-storylines-design.md §1b, §2. The real
// shows air 8–10 camp scenes an episode, a few of them long and connected; the sim
// had ~60 short unrelated ones. This runs once an episode, after it has been
// played (text-backlog generateSummaryText → scriptPendingScenes), touches no game
// state, and builds ep.campStory: per camp and phase, the scenes that air.
//
//   - the morning after a vote: the camp wakes up one person short (new scene);
//   - after a team challenge: the losing team's blame, the winners' relief (new scene);
//   - storyline steps: each camp event that is a chapter of a storyline (storylines.js)
//     is filed; the most dramatic, best-connected ones air as whole scenes written
//     from the story pools (write.js), or in their own words when no pool exists yet;
//   - quick cuts: a few short moments between the long ones, as the show cuts away;
//   - nobody forgotten: every living camper speaks at camp every episode (the user,
//     2026-10-07; the real shows let people vanish for ten episodes, this does not).
//
// ep.campStory[camp][phase] is a list of { ref: <index into that phase's events> }
// (a moment airing in its own words) or a written scene { story: true, lines, ... }.
// Everything the engine wrote stays in ep.campEvents, unchanged: consequences,
// badges and every other reader are untouched. Viewers read the list through
// feed.js campFeed().
import { gs, players, seasonConfig, TWIST_CATALOG } from '../../core.js';
import { getBond, addBond } from '../../bonds.js';
import { kinshipBetween } from '../../core.js';
import { pronouns, pStats as pStatsOf, threatScore } from '../../players.js';
import { voiceOf } from './voice.js';
import { writeFirstImpression } from './first-impressions.js';
import { classify, file, prevAired } from './storylines.js';
import { continuityScore, rememberMoment } from './continuity.js';
import { recordFollowups, followupScene } from './followups.js';
import { recordTurns, turnScene } from './turns.js';
import { witnessConflicts, witnessAfter, sidedFight } from './witness.js';
import { onCommit, onDiscard, adopt, commit, discard, pending } from './commit.js';
import { writeStory as writeRaw, hasStoryPool } from './write.js';
import { lastTribalOf, challengeOf, lossStreak, bootsBefore, dayOf } from './record.js';
import { numberWord } from '../script/write.js';
import { registerOf, factsFor } from '../script/facts.js';
import { writeTribal, multiTribalView, firstVoteView, secondVoteView, isTwoVoteNight, whyOf as ballotWhy, writeCrashReplies, writeExit } from './tribal.js';
import { relationalReason } from '../../alliances.js';
import { dressConfessionals } from './captions.js';
import { writeTwistStory, writeExile, writeFirstImpressions, writeAuctionScript } from './twist.js';
import { needOf, psycheCast } from './psyche.js';
import { runnerDue } from './runners.js';
import { recordThreads, threadDue, threadKnown } from './threads.js';
import { writePreviously } from './previously.js';
import { chalMoments } from './chalmoments.js';
import { MEAL_KIND, MEAL_TYPE } from '../script/food.js';
import { placeOf, kindOf, placeById } from './places.js';
import { kitBitScene, kitDigScene, kitRomanceScene, kitLifeScene, kitClashScene, kitDeepScene, kitCallbackScene, kitSoloScene, hasKit, kitOf, sharedGround, setKitVenue } from './kits.js';
import { runArcs, campGame } from './arcs.js';
import { coupleScenes } from './couple.js';

// Where the season lives decides a few words ({quarters}, {bed}) and what campers can know:
// at a venue that reads the votes aloud (the Elimination Trial) everyone hears the count; at a
// marshmallow, Gilded Chris or barf bag ceremony nobody does (fact 'count').
const VENUE_WORDS = {
  'hosted-camp': { quarters: 'cabin', bed: 'bunk', count: false, item: 'marshmallow' },
  'film-lot': { quarters: 'trailer', bed: 'bunk', count: false, item: 'Gilded Chris' },
  'world-tour': { quarters: 'cabin', bed: 'seat', count: false, item: 'barf bag' },
  'survival-island': { quarters: 'shelter', bed: 'sleeping spot', count: true, item: 'vote' },
  carnival: { quarters: 'shelter', bed: 'sleeping bag', count: true, item: 'vote' },
};
let venueNow = 'hosted-camp';
// engine moments that air whatever the episode's story is (see airTdEpisode): somebody leaving or arriving,
// and the secret plays a viewer has to have seen for what follows to make sense
const MUST_AIR = new Set(['medevac', 'medevacReplacement', 'kissTrap', 'moleBondSabotage', 'moleInfoLeak', 'moleChallengeThrow', 'moleAdvSabotage']);
const AIRS_FIRST = new Set(['medevac', 'medevacReplacement']);
let ctxAvoid = () => null;

// The director's own scenes are events (the user, 2026-10-10: "they're not events that change bonds?"): each
// carries fx, [[a, b, delta]] or [['pop', name, delta]], applied here and kept on the scene as `effects`.
// airTdEpisode runs at the end of simulateEpisode, after the vote and before the next episode, so the change
// reaches the next episode's alliances and votes. It applies only on the live episode: the one simulateEpisode
// built (it carries bondChanges; the history rows are fresh copies without it) and the one now playing. A
// transcript regenerated for an old row (cast-ui.js export) must never move today's bonds.
// only the people the written scene has in it: a role the entry never speaks or names stays off the stage
// (the viewer stages scene.who; read 2026-10-10: Will and Sterling stood silent through Ashley and Seraphine)
const castOnly = (who, w) => (Array.isArray(w?.cast) ? Object.fromEntries(Object.entries(who).filter(([r]) => w.cast.includes(r) || r === 'a' || r === 'b')) : who);
// What the critic holds against b in a defence (camp-events.js protectiveInstinct; n-defend.js): something the
// game really produced, as a verb phrase that reads after "I", "you" or a name. b came last for a team that
// lost the last challenge; else b had votes at the last vote; else b's own kit thing; else not pulling weight.
function defendCharge(ep, b) {
  const prev = (gs.episodeHistory || []).find(h => h.num === ep.num - 1);
  const team = prev ? (prev.tribesAtStart || []).find(t => (t.members || []).includes(b))?.name : null;
  const ch = team ? challengeOf(prev, team) : null;
  if (ch?.lost && ch.sank === b) {
    const chal = prev.challengeLabel || 'the challenge';
    return { chargeKey: 'sank', chal, charge: `cost us ${chal}` };
  }
  if ((prev?.votingLog || []).some(v => v.voted === b && v.voter !== b)) return { chargeKey: 'votes', charge: 'should be the next one to go' };
  const k = kitOf(b);
  if (k?.thing) return { chargeKey: 'kit', thing: k.thing, charge: `won't stop going on about ${k.thing}` };
  return { chargeKey: 'lazy', charge: 'should be doing a lot more around here' };
}

const liveEp = ep => Array.isArray(ep?.bondChanges) && ep.num === gs.episode;
// ── kindred (lines/n-kindred.js): two people find out their lives have the same thing in them ──
// kits.js sharedGround: a kit's authored ground tags (kits/kits-ground.js, read off the roster profile) or
// the same hometown or nationality on both roster rows, so it is true of both of them. The user, 2026-10-10:
// "do we also have bond by backstory? ... continuing storyline". Three beats over the season:
//   discovery  an afternoon: one lets it slip, the other recognises it; the bond goes up (most for grief
//              and family wounds). Weightier ground first; the same country only when nothing else is
//              shared. Once a pair, at most one discovery a camp every other episode, from episode 3.
//   check-in   two to five episodes later, a morning: the one who heard it checks on the other
//   betrayal   the morning after one of them voted for the other and both are still here: a confrontation,
//              the bond drops, and the thread is over. The booth knows it too (tribal.js truthOf: kindred).
// gs.tdStory.kindred['A||B'] = { tag, tone, ep, opener, checked?, broken? }.
const KIN_HEAVY = new Set(['lost-parent', 'widowed', 'lost-child', 'parent-left', 'estranged', 'hard-home', 'trauma', 'mental-health', 'came-out', 'sibling-bully', 'strict-parents', 'parents-split', 'divorced']);
const KIN_HOME = new Set(['same-hometown', 'same-country']);
export const kinTone = tag => (KIN_HEAVY.has(tag) ? 'heavy' : KIN_HOME.has(tag) ? 'home' : 'light');
// What they found they share, said out loud ({about}): the check-in and the betrayal come days after the talk, and
// "what you told me the other day" named nothing (the user, 2026-10-14: "wtf did he say stop with these conversation
// with 0 context"). No "your" or "my": the same words work said by either of them.
const KIN_ABOUT = {
  'lost-parent': 'losing a parent', widowed: 'losing a partner', 'lost-child': 'losing a child', 'parent-left': 'a parent walking out',
  estranged: 'being cut off from family', 'hard-home': "growing up in a house that wasn't safe", 'strict-parents': 'growing up with strict parents',
  'golden-child': "being the one the whole family is counting on", 'family-doubts': "a family that thinks this is all a mistake",
  'raised-siblings': 'helping raise the little ones at home', 'big-family': 'coming from a huge family', twin: 'being a twin',
  'sibling-bully': 'getting picked on by a brother or sister', 'close-sibling': 'missing a brother or sister', grandma: 'grandmas',
  'immigrant-family': 'a family that moved countries', 'moved-countries': 'moving countries', 'left-home-young': 'leaving home young',
  'lonely-child': 'being a lonely kid', 'shy-child': 'being a shy kid', parent: 'having kids at home', grandparent: 'having grandkids',
  divorced: 'a marriage ending', 'parents-split': 'parents splitting up', 'came-out': 'coming out', 'mental-health': 'the bad days, the ones nobody can see',
  trauma: 'the stuff from before that still comes back', 'needs-money': 'really needing the money', 'supports-family': 'sending money home',
  'online-fame': 'making a living online', performer: 'performing', drag: 'drag', athlete: 'sports', farm: 'growing up working in the family business',
  'followed-parent': 'going into the same job as a parent', 'left-school': 'leaving school early', pets: 'pets', writer: 'writing', artist: 'making art',
  'career-slipped': 'having it all and losing it', underestimated: 'being written off', stuck: 'feeling stuck back home',
  wealthy: 'growing up with money', 'tight-money': 'growing up with no money', cook: 'cooking, and the family who taught it',
};
const kinAbout = r => (r.where ? `being from ${r.where}` : KIN_ABOUT[r.tag] || 'what we have in common');
const kinKey = (x, y) => (x < y ? `${x}||${y}` : `${y}||${x}`);
/** The kindred thread between x and y, if they found one and it hasn't been broken. */
export function kindredOf(x, y) { const r = gs.tdStory?.kindred?.[kinKey(x, y)]; return r && !r.broken ? r : null; }
const KIN_W = g => (g.kind === 'kit' ? (KIN_HEAVY.has(g.tag) ? 3 : 2) : g.kind === 'home' ? 1.5 : 0.5);
function kindredScenes(ep, members, camp, phase, nextN) {
  const S = (gs.tdStory ||= {}), K = (S.kindred ||= {}), last = (S.kindredLast ||= {});
  const out = [];
  const avoid = ctxAvoid(phase === 'pre' ? 'afternoon' : 'evening');
  const put = (at, kind, step, who, w, why, d, then = null) => out.push({ at, item: onCommit({ story: true, kind, storyType: 'kindred', step, players: [who.a, who.b], lines: w.lines, text: w.text, lineId: w.lineId,
    scene: { kind: 'kindred', who, data: {}, spot: w.spot || null }, badgeText: '', badgeClass: '', why: [why], fx: [[who.a, who.b, d]] }, then) });
  const write = (pool, outcome, who, data) => writeStory(pool, outcome, who, data, { ...factsFor({ who, data: {} }, { ep: ep.num, phase }), pair: true },
    { ep: ep.num, camp, phase, n: nextN(), place: 'aside', unique: 'soft', avoid, draft: true });
  if (phase === 'pre') {
    // the morning after a vote: one of them wrote the other's name, and both are still here
    const prev = (gs.episodeHistory || []).find(e => e.num === ep.num - 1);
    for (const v of prev?.votingLog || []) {
      const r = v.voter && v.voted && v.voter !== v.voted ? kindredOf(v.voter, v.voted) : null;
      if (!r || !members.includes(v.voter) || !members.includes(v.voted)) continue;
      const who = { a: v.voted, b: v.voter };
      const w = write('kindred.betray', r.tone, who, { about: kinAbout(r), ...(r.where ? { where: r.where } : {}) });
      if (!w) continue;
      put(0.3, 'kindred.betray', 'betray', who, w, `${who.b} voted for ${who.a}, after what they found they share.`, -2.5, () => { r.broken = ep.num; });
      return out;
    }
    // or days later, the one who heard it checks in
    for (const [k, r] of Object.entries(K)) {
      if (r.broken || r.checked || ep.num - r.ep < 2 || ep.num - r.ep > 5) continue;
      const [x, y] = k.split('||');
      if (!members.includes(x) || !members.includes(y) || getBond(x, y) < 0) continue;
      const a = r.opener === y ? y : x, who = { a, b: a === x ? y : x };
      const w = write('kindred.check', r.tone, who, { about: kinAbout(r), ...(r.where ? { where: r.where } : {}) });
      if (!w) continue;
      put(0.45, 'kindred.check', 'check', who, w, `${who.b} checks in on ${who.a}.`, 0.75, () => { r.checked = ep.num; });
      return out;
    }
    return out;
  }
  // the afternoon: two people find it
  if (ep.num < 3 || (last[camp] ?? -99) >= ep.num - 1) return out;
  const cand = [];
  for (let i = 0; i < members.length; i++) for (let j = i + 1; j < members.length; j++) {
    const x = members[i], y = members[j];
    if (K[kinKey(x, y)] || getBond(x, y) <= -3) continue;
    const g = sharedGround(x, y).sort((p, q) => KIN_W(q) - KIN_W(p) || p.tag.localeCompare(q.tag))[0];
    if (g) cand.push({ x, y, g, w: KIN_W(g) });
  }
  cand.sort((p, q) => q.w - p.w || p.x.localeCompare(q.x) || p.y.localeCompare(q.y));
  const open = n0 => { const s = pStatsOf(n0) || {}; return (s.social || 5) + (s.boldness || 5); };
  for (const c of cand.slice(0, 4)) {
    const a = open(c.x) >= open(c.y) ? c.x : c.y, who = { a, b: a === c.x ? c.y : c.x };
    const data = c.g.value ? { where: c.g.value } : {};
    const w = write('kindred', c.g.tag, who, data);
    if (!w) continue;
    const tone = kinTone(c.g.tag);
    put(0.55, 'kindred.find', 'find', who, w, `${who.a} and ${who.b} find out they share something.`, tone === 'heavy' ? 2 : tone === 'light' ? 1.5 : c.g.kind === 'home' ? 1.25 : 1,
      () => { K[kinKey(c.x, c.y)] = { tag: c.g.tag, tone, ep: ep.num, opener: a, ...(c.g.value ? { where: c.g.value } : {}) }; last[camp] = ep.num; });
    break;
  }
  return out;
}

function applyStoryFx(ep, list) {
  const live = liveEp(ep);
  for (const { item } of list) {
    if (!item?.fx) continue;
    item.effects = item.fx.map(([x, y, d]) => x === 'pop' ? { pop: y, d } : { a: x, b: y, d });
    if (live) for (const [x, y, d] of item.fx) {
      if (x === 'pop') { if (!gs.popularity) gs.popularity = {}; gs.popularity[y] = (gs.popularity[y] || 0) + d; }
      else addBond(x, y, d);
    }
    delete item.fx;
  }
}
function writeStory(pool, outcome, who, data, facts, ctx) {
  const v = VENUE_WORDS[venueNow] || VENUE_WORDS['hosted-camp'];
  const voteYet = (gs.episodeHistory || []).some(h => (h.num || 0) < (ctx.ep || 0) && h.eliminated) || ctx.phase === 'tribal';
  return writeRaw(pool, outcome, who, { quarters: v.quarters, bed: v.bed, item: v.item, ...data }, { venue: venueNow, count: v.count, voteYet, ...facts }, ctx);
}

// How much each step is worth on screen (narrative weighting only).
const DRAMA = {
  'alliance.formed': 7, 'alliance.recruit': 5, 'alliance.refused': 5, 'alliance.checkin': 4, 'alliance.crack': 7, 'alliance.end': 8,
  'alliance.betrayal': 9, 'alliance.deal': 6, 'alliance.exposed': 8,
  'rivalry.friction': 5, 'rivalry.blowup': 8, 'rivalry.truce': 6, 'rivalry.cold': 4,
  'showmance.spark': 5, 'showmance.kiss': 7, 'showmance.official': 6, 'showmance.jealous': 7, 'showmance.breakup': 9, 'showmance.targeted': 6,
  'bottom.noticed': 4, 'bottom.scramble': 6, 'bottom.targeted': 6,
  'scheme.move': 7, 'scheme.caught': 9,
  'friendship.bond': 3, 'friendship.drift': 5,
  'underdog.rise': 4,
  'idol.found': 7, 'idol.shared': 6, 'idol.search': 3, 'idol.known': 6,
};
const dramaOf = (type, step) => DRAMA[`${type}.${step}`] ?? 3;
// which coach moment airs first after the challenge (the coaching twist's slot, below)
const COACH_PRI = { coachCardTalk: 9, coachDealBroken: 9, coachTheFall: 9, coachGivesAdvantage: 8, coachBadAdvice: 8, coachCardFlush: 7, coachSaysTheUnsayable: 7,
  coachPoachedProtege: 7, coachPassedOverNotices: 6, coachDefended: 6, coachCardFlinch: 6, coachUnimpressed: 6, coachPullsRank: 5, coachCompareNotes: 5,
  coachBreakthrough: 5, coachNoBallotWeightless: 5, coachDealRejected: 5, coachTrade: 5, coachNonAggression: 4, coachStarstruck: 4, coachShineWearsOff: 4,
  coachOwnSeason: 4, coachPlayingForTheMerge: 3, coachIdleAdvantage: 3, coachProtegeBond: 3 };

// fight scenes that end with b fine about it: nobody steps in for b afterwards
const CALM_ENDS = new Set(['ndo.hh4']);

const eventsOf = (ep, camp, phase) => {
  const block = ep.campEvents?.[camp];
  return phase === 'pre' ? (Array.isArray(block) ? block : (block?.pre || [])) : (Array.isArray(block) ? [] : (block?.post || []));
};
const saysIn = ev => [...new Set((ev?.lines || []).filter(l => l.kind === 'say' && l.by).map(l => l.by))];
const speaksIn = ev => [...new Set((ev?.lines || []).filter(l => (l.kind === 'say' || l.kind === 'conf') && l.by).map(l => l.by))];

// who has left the game before this episode and not come back (a returnee, or anybody at tonight's vote, is back)
function goneBefore(ep) {
  const gone = new Set((gs.episodeHistory || []).filter(h => (h.num || 0) < (ep.num || 0))
    .flatMap(h => [h.eliminated, h.firstEliminated, h.tiedDestinies?.eliminatedPartner, h.ambassadorData?.ambassadorEliminated, h.medevac?.name]).filter(Boolean));
  for (const h of (gs.episodeHistory || []).filter(h => (h.num || 0) <= (ep.num || 0))) for (const n of [h.returnee, h.riReturnee, ...(h.returnees || [])]) gone.delete(n);
  for (const n of ep.tribalPlayers || []) gone.delete(n);
  return gone;
}

function membersOf(ep, camp) {
  // nobody voted out before this episode is in its camp, whatever list says so (the user, 2026-10-14: Finn, voted out in
  // episode one, was the one Manu "went and found" in episode two; measured: Max talking at camp the morning after his
  // boot, because a merged camp was read off the episode's events and the events still name whoever just left)
  const gone = goneBefore(ep);
  const here = n => n && !gone.has(n);
  const t = (ep.tribesAtStart || []).find(x => x.name === camp);
  if (t) return [...t.members].filter(here);
  // the merged camp: everybody who started the episode (who sat at its vote, when there was one)
  const all = (ep.tribesAtStart || []).flatMap(x => x.members || []);
  if (all.length) return [...new Set(all)].filter(here);
  const sat = (ep.tribalPlayers || []).filter(here);
  return sat.length ? [...new Set(sat)] : [...new Set(eventsOf(ep, camp, 'pre').flatMap(e => e.players || []))].filter(here);
}

// the scene's facts: what the event knew when it fired, plus what the story knows
function storyFacts(ev, extra) {
  const base = { ...(ev?.scene?.facts || {}) };
  return { ...base, ...extra };
}

function recordSlots(ep, a, b, camp, phase) {
  const data = {}, facts = {};
  const lt = a ? lastTribalOf(a, ep.num) : null;
  if (lt && lt.gap === 1) {
    data.lastBoot = lt.boot;
    facts.lastBoot = true;
    facts.voted = lt.myVote ? (lt.votedBoot ? 'boot' : 'other') : 'none';
    if (lt.myVote && !lt.votedBoot && lt.myVote !== a) { data.myVote = lt.myVote; facts.myVote = true; }
    facts.blindside = !!lt.blindside;
    facts.gotVotes = lt.against > 0;
    // a just made a move at the last vote: wrote the boot's name in a blindside, or against somebody a
    // was close to. A scene whose premise is 'I've never made a move' can't air for them (read in a
    // played season: Nichelle voted out her closest ally, then 'I've never made a big move in my life')
    facts.madeMove = !!lt.votedBoot && (!!lt.blindside || getBond(a, lt.boot) >= 3);
    data.bootVotes = numberWord(lt.bootVotes);
  }
  // b's own ballot is b's secret: a line may only rely on it when b says it (b's own words)
  const ltB = b ? lastTribalOf(b, ep.num) : null;
  if (ltB && ltB.gap === 1) facts.votedB = ltB.myVote ? (ltB.votedBoot ? 'boot' : 'other') : 'none';
  if (phase === 'post' && !ep.isMerge && !gs.isMerged) {
    const ch = challengeOf(ep, camp);
    if (ch) {
      facts.lost = ch.lost; facts.won = ch.won;
      if (ch.sank && ch.sank !== a && ch.sank !== b) { data.sank = ch.sank; facts.sank = true; }
      if (ch.carried && ch.carried !== a && ch.carried !== b) { data.carried = ch.carried; facts.carried = true; }
      facts.sankA = ch.sank === a; facts.carriedA = ch.carried === a;
      facts.sankB = !!b && ch.sank === b; facts.carriedB = !!b && ch.carried === b;
      // b's plan really is {carried}: b writes that name tonight (read 2026-10-14: "you want to get rid of Anastasia" to
      // Lynda, who was after Natalia and wrote Alessio)
      if (data.carried) facts.bWritesCarried = (ep.votingLog || []).some(v => v.voter === b && v.voted === ch.carried);
      const streak = ch.lost ? lossStreak(camp, ep.num, ep) : 0;
      facts.streak = streak >= 3 ? 'many' : streak === 2 ? 'two' : streak === 1 ? 'one' : 'none';
      data.streak = numberWord(streak);
    }
  }
  return { data, facts };
}

// How big the alliance in the scene is, and whether a or b is in another one: a line that says
// "three votes" needs three members, one that says "my first alliance" needs it to be.
function allianceFacts(ev, who, data) {
  const name = data.group || ev.alliance || data.alliance || null;
  const al = name ? (gs.namedAlliances || []).find(x => x.name === name) : null;
  const size = (ev.members || al?.members || []).length;
  const others = n => (gs.namedAlliances || []).some(x => x.active !== false && x.name !== name && (x.members || []).includes(n));
  return { members: size >= 4 ? 'many' : size || null, aOther: !!who.a && others(who.a), bOther: !!who.b && others(who.b) };
}


// ── what the viewer may know that the dialogue does not say (the side panel, 'In their heads') ──
const BANDWORD = { friends: 'close', neutral: 'on neutral terms', cold: 'cool with each other', enemies: 'at each other\'s throats' };
const STEP_WHY = {
  'alliance.formed': '{a} and {b} start an alliance{al}.', 'alliance.recruit': '{a} brings {b} into {alx}.', 'alliance.refused': '{b} turns down {a}\'s alliance.',
  'alliance.checkin': '{alx} checks its numbers.', 'alliance.crack': '{a} is starting to doubt {b}.', 'alliance.end': '{alx} is finished.',
  'alliance.betrayal': 'A vote went against the plan, and it shows.', 'alliance.deal': '{a} and {b} make a deal about the end.',
  'alliance.exposed': '{a} overheard {b} and {c}. They have no idea.',
  'rivalry.friction': '{a} and {b} rub each other the wrong way.', 'rivalry.blowup': 'It boils over between {a} and {b}.', 'rivalry.truce': '{a} tries to make peace with {b}.', 'rivalry.cold': '{a} and {b} have stopped pretending.',
  'showmance.spark': '{a} and {b} are into each other.', 'showmance.kiss': '{a} and {b} kiss.', 'showmance.official': '{a} and {b} are a couple.', 'showmance.jealous': 'Jealousy: {a} doesn\'t like what {a} sees.',
  'showmance.breakup': '{a} and {b} are over.', 'showmance.targeted': '{a} wants the couple split up.',
  'bottom.noticed': '{a} feels the camp turning.', 'bottom.scramble': '{a} is scrambling to stay.', 'bottom.targeted': '{a} has picked a target.',
  'scheme.move': '{a} is working an angle on {b}.', 'scheme.caught': 'A scheme comes out.', 'friendship.bond': '{a} and {b} get closer.', 'friendship.drift': '{a} is pulling away from {b}.',
  'underdog.rise': '{a} is proving people wrong.', 'idol.found': '{a} has found something.', 'idol.shared': '{a} lets {b} in on a secret advantage.', 'idol.search': '{a} goes looking for an idol.', 'idol.known': 'Somebody knows about an idol.',
};
const HIDDEN = { 'deal.side.hollow': '{a} doesn\'t mean a word of it.', 'plot.lie.believed': '{a} made that up, and {b} believed it.', 'plot.lie.rejected': '{a} made that up. {b} didn\'t buy it.',
  'plot.majority.fooled': 'There is no majority. {a} invented it.', 'read.played.deep': '{a} is playing {b}.', 'read.played.plain': '{a} is playing {b}.',
  'fallout.flip.ally': '{a} voted against {b} last night. {b} has no idea.', 'fallout.flip.swap': '{a} flipped last night. Nobody knows.', 'talk.lie.about': '{a} is lying about {target}.' };
function whyOf(kind, ending, storyKey, who, data, facts) {
  const fill = t => t.replace(/\{(\w+)\}/g, (m, k) => k === 'al' ? (data.group || data.alliance ? ` (${data.group || data.alliance})` : '')
    : k === 'alx' ? (data.group || data.alliance || 'their alliance') : (who[k] || data[k] || m));
  const out = [];
  if (STEP_WHY[storyKey]) out.push(fill(STEP_WHY[storyKey]));
  const hid = HIDDEN[`${kind}.${ending}`];
  if (hid) out.push(fill(hid));
  if (facts.voted === 'other' && data.lastBoot) out.push(fill(`{a} was on the wrong side of the last vote: {a} didn't write {lastBoot}.`));
  if (facts.gotVotes) out.push(fill('{a} had votes cast against {a} at the last vote.'));
  if (data.sank && facts.lost) out.push(fill('{sank} had the team\'s lowest score today.'));
  if (who.a && who.b && facts.band) out.push(`${who.a} & ${who.b}: ${BANDWORD[facts.band] || facts.band}${facts.alliance ? ', in the same alliance' : ''}.`);
  return out.filter(t => !/\{\w+\}/.test(t));
}

// What may air in the engine's own short words (no long pool for it, or the pool is spent for
// the season). The user, 2026-10-08: "I still get 3-line conversations that mean nothing". Banter
// with nothing behind it stays off camera (the backlog still lists it); what airs as-is is game
// information: a confessional, an idol, a pitch, a flip, a deal, a catch, or a real scene.
const GAME_TYPE = /^(idol|voteSteal|votePitch|scramble|secretFlip|betrayal|loyaltyTest|conflictingDeals|challengeThrow|stolenCredit|dealOverheard|showmance|affair|triangle|eavesdrop|infoTrade|allianceForm|allianceCrack|allianceDissolved|allianceExpelled|allianceRecruit|turnFriend|sideDeal|endgameDeal|spreadLies|forgeNote|whisperCampaign|falseMajority|chalThreat|sitOut|bigMoveThoughts|mergeScramble|mergeConfessional|goat|ftc|perceptionRealization|wildcardPivot)/;
function worthAiring(ev) {
  if (!ev) return false;
  const kind = ev.scene?.kind || '';
  // a challenge's leftover sentence with three generic lines glued on: the challenge screen has it
  if (/^aside\./.test(kind)) return false;
  const lines = ev.lines || [];
  if (lines.length && lines.every(l => l.kind !== 'say')) return true;
  if (GAME_TYPE.test(ev.type || '')) return true;
  return lines.filter(l => l.kind === 'say').length >= 4;
}

// ── who they were to each other before this season ───────────────────────
// The user, 2026-10-08: "if there are prior relationships, from other shows, or siblings,
// acknowledge that". Two sources: the cast's declared relationships (cast setup: siblings, a
// couple, old friends, exes) and the franchise ledger (gs.franchiseMeta: allies, a betrayal, a
// blindside, rivals, a showmance, on a named season). Returns facts and the words for them.
const KIN = { twins: 'siblings', siblings: 'siblings', 'step-siblings': 'siblings', 'parent-child': 'family', grandparent: 'family', 'aunt-uncle': 'family',
  cousins: 'cousins', 'in-laws': 'family', married: 'couple', engaged: 'couple', partners: 'couple', dating: 'couple', 'best-friends': 'friends',
  'childhood-friends': 'friends', 'old-friends': 'friends', roommates: 'friends', colleagues: 'knew', teammates: 'knew', estranged: 'estranged', exes: 'exes', 'ex-friends': 'exfriends' };
function kinWord(kin, b) {
  const p = pronouns(b) || {}, she = p.sub === 'she', he = p.sub === 'he';
  if (kin === 'twins') return she ? 'twin sister' : he ? 'twin brother' : 'twin';
  if (kin === 'siblings' || kin === 'step-siblings') return she ? 'sister' : he ? 'brother' : 'sibling';
  if (kin === 'cousins') return 'cousin';
  if (kin === 'married') return she ? 'wife' : he ? 'husband' : 'spouse';
  if (kin === 'engaged') return she ? 'fiancée' : 'fiancé';
  if (kin === 'dating' || kin === 'partners') return she ? 'girlfriend' : he ? 'boyfriend' : 'partner';
  if (kin === 'exes') return 'ex';
  if (/friends|roommates/.test(kin)) return 'friend';
  return 'family';
}
export function historyOf(a, b) {
  if (!a || !b) return { facts: { hist: 'none' }, data: {} };
  let kin = 'none'; try { kin = kinshipBetween(a, b); } catch { kin = 'none'; }
  if (KIN[kin]) return { facts: { hist: KIN[kin] }, data: { kinWord: kinWord(kin, b) } };
  const sp = (gs.franchiseMeta?.seededPairs || []).filter(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
  const where = x => (/\(([^)]+)\)\s*$/.exec(x?.reason || '') || [])[1] || 'last time';
  const bet = sp.find(x => x.kind === 'betrayal' || x.kind === 'blindside');
  if (bet) return { facts: { hist: bet.a === a && bet.wronged !== false ? 'wronged' : 'wronger' }, data: { where: where(bet) } };
  for (const [k, h] of [['showmance-broken', 'oldflame'], ['showmance-intact', 'oldcouple'], ['rivals', 'oldrivals'], ['allies', 'oldallies']]) {
    const x = sp.find(y => y.kind === k); if (x) return { facts: { hist: h }, data: { where: where(x) } };
  }
  return { facts: { hist: 'none' }, data: {} };
}
const statsOf = m => { try { return pStatsOf(m) || {}; } catch { return {}; } };

// The first day: the team meets (episode one, or a team that has just been shuffled together).
function firstDay(ep, camp, members, n, fresh = 'start') {
  if (members.length < 3) return null;
  // the loudest takes charge: authored voice first, then boldness and social
  const loudness = m => { const t = voiceOf(m), s = statsOf(m);
    return (t.includes('loud') ? 3 : 0) + (t.includes('bossy') ? 3 : 0) + (t.includes('competitive') ? 1 : 0) + (s.boldness ?? 5) * 0.3 + (s.social ?? 5) * 0.2; };
  // somebody here already knows somebody: that is the first thing anybody notices
  let pair = null;
  for (let i = 0; i < members.length && !pair; i++) for (let j = i + 1; j < members.length && !pair; j++) {
    const h = historyOf(members[i], members[j]);
    if (h.facts.hist !== 'none') pair = { a: members[i], b: members[j], h };
  }
  const order = [...members].sort((x, y) => loudness(y) - loudness(x) || x.localeCompare(y));
  const a = pair ? pair.a : order[0];
  const b = pair ? pair.b : order[1];
  const rest = order.filter(m => m !== a && m !== b);
  const who = { a, b, c: rest[0] || null, d: rest[1] || null };
  const data = { tribe: camp, ...(pair ? pair.h.data : {}) };
  const outcome = pair ? pair.h.facts.hist : fresh;
  const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'pre' }), outcome, third: !!who.c, fourth: !!who.d,
    hist: pair ? pair.h.facts.hist : 'none', fresh, merged: !!(ep.isMerge || gs.isMerged) };
  const pool = pair ? 'story.firstday.history' : 'story.firstday';
  const w = writeStory(pool, pair ? outcome : fresh, who, data, facts, { ep: ep.num, camp, phase: 'pre', n, place: 'public', avoid: ctxAvoid('morning') });
  return w ? { story: true, kind: pool, storyType: 'firstday', step: fresh, players: Object.values(who).filter(Boolean), lines: w.lines, text: w.text, lineId: w.lineId,
    scene: { kind: pool, who, data, spot: w.spot ? { window: 'morning', ...w.spot } : null }, badgeText: fresh === 'swap' ? 'New Team' : 'Day One', badgeClass: 'gold',
    why: [pair ? `${a} and ${b} knew each other before this season.` : `${camp}'s first day together.`] } : null;
}
// ...and by the end of it, the first two who clicked and the first two who didn't
function firstPair(ep, camp, members, n, kind) {
  let best = null;
  for (let i = 0; i < members.length; i++) for (let j = i + 1; j < members.length; j++) {
    const v = getBond(members[i], members[j]);
    if (!best || (kind === 'clicked' ? v > best.v : v < best.v)) best = { a: members[i], b: members[j], v };
  }
  if (!best || (kind === 'clicked' ? best.v < 1 : best.v > -0.5)) return null;
  if (historyOf(best.a, best.b).facts.hist !== 'none') return null;
  const phase = kind === 'clicked' ? 'pre' : 'post';
  const v = VENUE_WORDS[venueNow] || VENUE_WORDS['hosted-camp'];
  const written = writeFirstImpression(best, members, kind, { ep: ep.num, camp, phase, n, venue: venueNow, history: historyOf,
    data: { tribe: camp, bed: v.bed }, facts: { count: v.count, voteYet: false },
    place: 'aside', avoid: ctxAvoid(phase === 'pre' ? 'camp-work' : 'scramble') });
  const { w, who } = written || {};
  return w ? { story: true, kind: 'story.firstpair', storyType: 'firstday', step: kind, players: Object.values(who), firstImpressionMode: written.mode, kit: written.kit,
    fx: kind === 'clicked' ? Object.values(who).flatMap((a,i,all)=>all.slice(i+1).map(b=>[a,b,0.3]))
      : [[who.a,who.b,-0.35],...(who.c?[[who.a,who.c,0.15],[who.b,who.c,-0.2]]:[]),...(who.d?[[who.a,who.d,0.1],[who.b,who.d,-0.15]]:[])],
    lines: w.lines, text: w.text, lineId: w.lineId,
    scene: { kind: 'story.firstpair', who, data: {}, spot: w.spot ? { window: phase === 'pre' ? 'camp-work' : 'scramble', ...w.spot } : null },
    badgeText: kind === 'clicked' ? 'First Impressions' : 'Off on the Wrong Foot', badgeClass: kind === 'clicked' ? 'green' : 'red' } : null;
}

// A moment that airs in the engine's own words passes the same time logic the written scenes do
// (write.js): no shared past between strangers, nothing about a vote before the first one, the
// time of day, nothing about a challenge before it happens. A challenge's leftover sentence with
// three generic lines glued on (aside.*) stays off camera: the challenge screen has the moment.
const RAW_PAST = /\b(always|you never|every time|again|anymore|lately|like before|used to|last time|the other day|yesterday|days ago|since day one|all week|for days)\b/i;
const RAW_VOTE = /\b(voted|last vote|the vote last|wrote (my|your|his|her|their) name|on the edge of a vote)\b/i;
const RAW_MORNING = /\b(breakfast|good morning|sunrise|wakes? up|woke up|five in the morning|airhorn)\b/i;
const RAW_CHAL = /\b(we lost|we won|lost it for us|carried us|dead last|flew up that wall|right at the end)\b/i;
function rawFits(ev, ep, phase) {
  if (/^aside\./.test(ev?.scene?.kind || '')) return false;
  // the coaching twist's scenes are written for the moment they air (td/coach/scenes.js): the word checks below
  // are for engine lines written without knowing when they would play ("Again." in a drill is not a past)
  if (/^coach\./.test(ev?.scene?.kind || '')) return true;
  const text = (ev?.lines || []).map(l => l.text).join(' ') || String(ev?.text || '');
  if (ep.num <= 2 && RAW_PAST.test(text)) return false;
  if (!(gs.episodeHistory || []).some(h => (h.num || 0) < ep.num && h.eliminated) && RAW_VOTE.test(text)) return false;
  if (phase === 'post' && RAW_MORNING.test(text)) return false;
  if (phase === 'pre' && RAW_CHAL.test(text)) return false;
  return true;
}

// An engine moment that airs in its own words (no long version fit) has to be a scene, not three
// lines of nothing (the user: "That was incredible!" / "It was just a knot." / "It was an INCREDIBLE
// knot."): four spoken lines at least, or a confessional of two. Anything shorter does not air on its
// own; the screen-time pass writes that person a whole scene instead.
function rawFull(ev) {
  const spoken = (ev?.lines || []).filter(l => l.by && l.kind !== 'beat' && !(l.text || '').startsWith('('));
  if (spoken.length >= 4) return true;
  return spoken.length >= 2 && spoken.every(l => l.kind === 'conf' || /confessional/i.test(l.kind || ''));
}

// ── the new scenes ─────────────────────────────────────────────────────

// The morning after a vote: whoever was closest to the person who left, and somebody who wrote
// their name down. Only a camp that was AT that vote wakes up to it.
function morningAfter(ep, camp, members, n) {
  const present = members;
  const lts = present.map(m => [m, lastTribalOf(m, ep.num)]).filter(([, lt]) => lt && lt.gap === 1);
  if (lts.length < 2) return null;
  const boot = lts[0][1].boot;
  if (!boot || present.includes(boot)) return null;
  // a = the one who feels it most (closest to the boot); b = someone who did it
  const byBond = [...lts].sort((x, y) => getBond(y[0], boot) - getBond(x[0], boot) || x[0].localeCompare(y[0]));
  const [a, ltA] = byBond[0];
  const voters = lts.filter(([m, lt]) => m !== a && lt.votedBoot);
  const b = (voters.find(([, lt]) => lt.planTarget === boot) || voters[0] || byBond[1])?.[0];
  if (!b) return null;
  const others = present.filter(m => m !== a && m !== b && m !== boot);
  const c = others.sort((x, y) => getBond(a, y) - getBond(a, x) || x.localeCompare(y))[0] || null;
  const bondBoot = getBond(a, boot);
  const outcome = bondBoot <= -2 ? 'relief' : bondBoot < 2 ? 'nobody' : ltA.votedBoot ? 'agreed' : 'blindside';
  const who = { a, b, c };
  const data = { lastBoot: boot, bootVotes: numberWord(ltA.bootVotes), target: boot };
  const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'pre' }), outcome, lastBoot: true,
    voted: ltA.votedBoot ? 'boot' : 'other', unanimous: !!ltA.unanimous, bVoted: lts.find(([m]) => m === b)?.[1]?.votedBoot ? 'boot' : 'other', third: !!c };
  const w = writeStory('story.morning', outcome, who, data, facts, { ep: ep.num, camp, phase: 'pre', n, place: 'sleep', avoid: ctxAvoid('morning') });
  return w ? { story: true, kind: 'story.morning', storyType: 'morning', step: outcome, players: [a, b, c].filter(Boolean), lines: w.lines, text: w.text, lineId: w.lineId,
    scene: { kind: 'story.morning', who, data, spot: w.spot ? { ...w.spot, window: 'morning' } : null }, badgeText: 'The Morning After', badgeClass: outcome === 'blindside' ? 'red' : '', why: [`${boot} went home last night, ${data.bootVotes} votes.`] } : null;
}

// The auction (auction.js), back at camp: what it did between people. A refused loan is a grudge (a
// asked, b said no); a bidding war leaves a sore loser (a, outbid by b); an advantage bought in front
// of the whole table gets clocked (a, a strategic player, tells an ally b about {target}, who bought
// it); a loan is a debt (a won with b's money); a letter from home gets shared (a with a friend b).
// Two scenes at most, the game-changing ones first (the big buy, a refusal, a loan), nobody in both.
function auctionTalk(ep, camp, members, next) {
  const A = (ep.twists || []).find(t => t.type === 'auction')?.auction;
  if (!A) return [];
  const here = x => !!x && members.includes(x);
  const sold = (A.items || []).filter(r => r.sold && here(r.winner));
  const out = [];
  const seen = new Set();
  const add = (ending, who, data, badge, why) => {
    const cast = Object.values(who).filter(Boolean);
    if (out.length >= 2 || cast.some(p => seen.has(p) || !here(p))) return;
    const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'post' }), third: !!who.c, lot: !!data.lot, eats: !!data.eats };
    const w = writeStory('story.auction', ending, who, data, facts, { ep: ep.num, camp, phase: 'post', n: next(), place: 'secret', avoid: ctxAvoid('evening'), unique: 'soft' });
    if (!w) return;
    cast.forEach(p => seen.add(p));
    out.push({ story: true, kind: `story.auction.${ending}`, storyType: 'auction', step: ending, players: cast, lines: w.lines, text: w.text, lineId: w.lineId,
      scene: { kind: 'story.auction', who, data, spot: w.spot ? { ...w.spot, window: 'evening' } : null }, badgeText: badge[0], badgeClass: badge[1], why });
  };
  const itemOf = r => (!r.blind && r.label ? { lot: r.label, ...(['food', 'snack'].includes(r.role) ? { eats: true } : {}) } : {});
  // one big buy on screen: immunity first (it changes tonight), then the advantage
  for (const r of sold.filter(x => x.isPower || x.effect === 'immunity').sort((x, y) => (y.effect === 'immunity') - (x.effect === 'immunity')).slice(0, 1)) {
    const watcher = members.filter(m => m !== r.winner).sort((x, y) => (pStatsOf(y)?.strategic || 0) - (pStatsOf(x)?.strategic || 0) || x.localeCompare(y))[0];
    const ally = watcher ? members.filter(m => m !== watcher && m !== r.winner && getBond(watcher, m) >= 2).sort((x, y) => getBond(watcher, y) - getBond(watcher, x) || x.localeCompare(y))[0] : null;
    if (watcher && ally) add(r.effect === 'immunity' ? 'immunity' : 'power', { a: watcher, b: ally }, { target: r.winner }, ['The Big Buy', 'purple'], [`${r.winner} bought ${r.effect === 'immunity' ? 'immunity' : 'something powerful'} at the auction, in front of everybody.`]);
  }
  for (const r of sold) for (const f of r.refusals || []) add('refused', { a: f.asker, b: f.refuser }, itemOf(r), ['Turned Down', 'red'], [`${f.refuser} wouldn't lend ${f.asker} the money at the auction.`]);
  for (const r of sold) for (const l of r.loans || []) add('loan', { a: r.winner, b: l.from }, itemOf(r), ['A Loan', 'teal'], [`${l.from} lent ${r.winner} $${l.amount} at the auction.`]);
  for (const r of sold.filter(x => x.emotional && !x.gotDud)) {
    const friend = members.filter(m => m !== r.winner).sort((x, y) => getBond(r.winner, y) - getBond(r.winner, x) || x.localeCompare(y))[0];
    if (friend && getBond(r.winner, friend) >= 1) add('letter', { a: r.winner, b: friend }, itemOf(r), ['A Piece of Home', 'teal'], [`${r.winner} spent the money on ${r.label}.`]);
  }
  for (const r of sold) {
    const fighters = [...new Set((r.bidLog || []).filter(b => !b.failed).map(b => b.bidder))];
    const loser = (r.bidLog || []).length >= 5 && fighters.length === 2 ? fighters.find(x => x !== r.winner) : null;
    if (loser) add('outbid', { a: loser, b: r.winner }, itemOf(r), ['Outbid', 'red'], [`${r.winner} outbid ${loser} at the auction.`]);
  }
  return out;
}

// The morning after an Exile Duel: the winner walks back into camp (the exiled player, back in the
// game, or the new boot, who won their place back). a is the winner; b the one here who wrote a's
// name and likes a least, if anybody did; c a's closest friend here.
function duelReturn(ep, camp, members, n) {
  const prev = (gs.episodeHistory || []).find(h => h.num === ep.num - 1);
  const R = prev?.exileDuelResult;
  if (!R?.winner || !members.includes(R.winner)) return null;
  const a = R.winner;
  const back = a === R.exilePlayer ? 'exiled' : 'survived';
  // who sent them: the vote that put a on Exile (the duel night's own for the new boot)
  const src = back === 'exiled' ? (gs.episodeHistory || []).find(h => h.exilePlayer === a && h.num < ep.num) : prev;
  const wrote = (src?.votingLog || []).filter(v => v.voted === a && v.voter !== a && members.includes(v.voter)).map(v => v.voter);
  const b = [...wrote].sort((x, y) => getBond(a, x) - getBond(a, y) || x.localeCompare(y))[0] || null;
  const c = members.filter(m => m !== a && m !== b && getBond(a, m) >= 2).sort((x, y) => getBond(a, y) - getBond(a, x) || x.localeCompare(y))[0] || null;
  const who = { a, ...(b ? { b } : {}), ...(c ? { c } : {}) };
  const data = { other: R.loser };
  const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'pre' }), pair: !!b, third: !!c, other: true };
  const w = writeStory('exile.back', back, who, data, facts, { ep: ep.num, camp, phase: 'pre', n, place: 'public', avoid: ctxAvoid('morning'), unique: 'soft' });
  return w ? { story: true, kind: `exile.back.${back}`, storyType: 'exile', step: back, players: Object.values(who), lines: w.lines, text: w.text, lineId: w.lineId,
    scene: { kind: 'exile.back', who, data, spot: w.spot ? { ...w.spot, window: 'morning' } : null }, badgeText: 'Back from Exile', badgeClass: 'gold', why: [`${a} beat ${R.loser} in the Exile Duel and is back in the game.`] } : null;
}

// After a team challenge: the losers find someone to blame; the winners exhale.
function afterChallenge(ep, camp, members, n) {
  if (ep.isMerge || gs.isMerged) return null;
  const ch = challengeOf(ep, camp);
  if (!ch || (!ch.lost && !ch.won)) return null;
  if (ch.lost) {
    const b = ch.sank;
    // the blamer: whoever talks loudest about it — a fiery or scheming teammate, else the one who carried
    const loud = members.filter(m => m !== b && ['fiery', 'schemer'].includes(registerOf(m)))
      .sort((x, y) => getBond(x, b) - getBond(y, b) || x.localeCompare(y))[0];
    // the team that picks itself up (regroup) is talked round by somebody NOT writing b's name tonight:
    // the peacemaker who says "we're not doing the blame thing" can't then pin it on b in the booth
    // (read in a played season: Heather's "STOP, we're not doing that", then "Lindsay cost us the challenge")
    const blamedRecently = ep.num - (((gs.tdStory ||= {}).blamed ||= {})[camp] ?? -99) <= 2;
    const writesB = m => (ep.votingLog || []).some(v => v.voter === m && v.voted === b);
    const peace = blamedRecently ? [ch.carried, ...members.filter(m => m !== b).sort((x, y) => getBond(y, b) - getBond(x, b) || x.localeCompare(y))]
      .find(m => m && m !== b && !writesB(m)) : null;
    const a = blamedRecently ? peace : loud || (ch.carried !== b ? ch.carried : ch.order[0]);
    if (!a || a === b) return null;
    const c = members.filter(m => m !== a && m !== b).sort((x, y) => getBond(b, y) - getBond(b, x) || x.localeCompare(y))[0] || null;
    const who = { a, b, c };
    const streak = lossStreak(camp, ep.num, ep);
    const data = { sank: b, carried: ch.carried !== a ? ch.carried : null, streak: numberWord(streak), tribe: camp };
    if (!data.carried) delete data.carried;
    const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'post' }), outcome: 'blame', third: !!c, carriedA: ch.carried === a,
      carried: !!data.carried, streak: streak >= 3 ? 'many' : streak === 2 ? 'two' : 'one', registerB: registerOf(b) };
    // not the blame game every time (the user: "it always appears and is super repetitive"): a team
    // that turned on somebody at a recent loss picks itself up this time, around whoever carried it
    const blamed = ((gs.tdStory ||= {}).blamed ||= {});
    const lately = ep.num - (blamed[camp] ?? -99) <= 2;
    const ending = lately ? 'regroup' : 'lost';
    const w = writeStory('story.chal', ending, who, data, { ...facts, outcome: lately ? 'regroup' : 'blame' }, { ep: ep.num, camp, phase: 'post', n, place: 'public', avoid: ctxAvoid('return') })
      || (lately ? writeStory('story.chal', 'lost', who, data, facts, { ep: ep.num, camp, phase: 'post', n, place: 'public', avoid: ctxAvoid('return') }) : null);
    // (the team is on record as having blamed somebody when the scene airs: commit.js)
    return w ? onCommit({ story: true, kind: `story.chal.${ending}`, storyType: 'chal', step: ending, players: [a, b, c].filter(Boolean), lines: w.lines, text: w.text, lineId: w.lineId,
      scene: { kind: 'story.chal', who, data, spot: w.spot ? { ...w.spot, window: 'return' } : null }, badgeText: 'Who Lost It', badgeClass: 'red',
      why: [`${camp} lost${streak > 1 ? ` (${numberWord(streak)} in a row)` : ''}. ${b} had the team's lowest score; ${ch.carried} the highest.`] }, () => { if (!lately) blamed[camp] = ep.num; }) : null;
  }
  const a = ch.carried;
  const b = members.filter(m => m !== a).sort((x, y) => getBond(a, y) - getBond(a, x) || x.localeCompare(y))[0];
  if (!a || !b) return null;
  const who = { a, b, c: ch.sank !== a && ch.sank !== b ? ch.sank : null };
  const data = { carried: a, tribe: camp };
  const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'post' }), outcome: 'won', third: !!who.c };
  const w = writeStory('story.chal', 'won', who, data, facts, { ep: ep.num, camp, phase: 'post', n, place: 'public', avoid: ctxAvoid('return') });
  return w ? { story: true, kind: 'story.chal.won', storyType: 'chal', step: 'won', players: [a, b, who.c].filter(Boolean), lines: w.lines, text: w.text, lineId: w.lineId,
    scene: { kind: 'story.chal', who, data, spot: w.spot ? { ...w.spot, window: 'return' } : null }, badgeText: 'Safe Tonight', badgeClass: 'green', why: [`${camp} won. ${a} had the team's best score.`] } : null;
}

// Somebody the episode has not heard from: a confessional about where they stand.
function coverScene(ep, camp, phase, name, n, tribal = false) {
  const lt = lastTribalOf(name, ep.num);
  const lines = (gs.tdStory?.lines || []).filter(l => l.people.includes(name) && l.steps.some(s => s.aired));
  const state = lt && lt.gap === 1 && lt.against > 0 ? 'votes' : lines.some(l => l.type === 'alliance') ? 'allied' : lines.length ? 'thread' : 'quiet';
  const who = { a: name };
  const data = lt && lt.gap === 1 ? { lastBoot: lt.boot } : {};
  const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase }), outcome: state, lastBoot: !!data.lastBoot, phase, tribal };
  const w = writeStory('story.cover', state, who, data, facts, { ep: ep.num, camp, phase, n, place: 'confessional', unique: false });
  return w ? { story: true, kind: 'story.cover', storyType: 'cover', step: state, players: [name], lines: w.lines, text: w.text, lineId: w.lineId,
    scene: { kind: 'story.cover', who, data, spot: { id: 'confessional' } }, badgeText: '', badgeClass: '' } : null;
}

// ── the director ───────────────────────────────────────────────────────

/** Build ep.campStory. Idempotent: an episode that already has one is left alone. */
// ── the vote, talked through ──
// The real shows spend the back half of a losing episode on who goes and why: the bloc agrees on
// a name and gives its reason, somebody gets worked on, the other side has its own plan, and the
// target either scrambles or has no idea. All of it is already decided (voting.js: ep.alliances,
// votePitches, pitchIntel, votingLog); this only shows it, before the vote, in the order it was
// worked out. Nobody says more than they could know: the bloc's talk leaves the target out, and
// the target's own scene says only their own vote and what reached them.
const SWING_WHY = { 'trusted-pitcher': 'trust', 'numbers-confirmed': 'numbers', 'does-not-save-me': 'self', 'protecting-target': 'protect',
  'impossible-numbers': 'doubt', 'strong-plan-not-replaced': 'plan' };
const WHY_WORDS = { weak: 'the weakest link', threat: 'too big a threat', grudge: 'personal', strike: 'coming after them first', shield: 'protecting someone else', plan: 'where the numbers are' };
const SWING_WORDS = { trust: 'trusts the pitcher', numbers: 'the numbers checked out', self: "it doesn't save them", protect: 'protecting the target', doubt: "didn't believe the numbers", plan: 'already had a plan', plain: 'went with it' };

// ── how a person talks strategy: alone, to one person, or with the group ──
// The user, 2026-10-08: "it really depends on the person: strategy, personality and
// relationship". A social leader calls the people they trust together; a schemer takes one
// person aside; a loner decides on their own and tells the camera. Narrative selection only
// (it chooses who is in the scene, never what anybody votes), read from the stats, the
// archetype and the authored voice; who joins is who they are close to.
const GROUP_ARCH = new Set(['social-butterfly', 'hero', 'loyal-soldier', 'showmancer', 'underdog']);
const DUO_ARCH = new Set(['mastermind', 'schemer', 'villain', 'perceptive-player', 'chaos-agent']);
const SOLO_ARCH = new Set(['floater', 'goat', 'wildcard']);
function shapeFor(name, close) {
  // people in a named alliance with a meet as one: each close ally in it pulls toward the huddle
  const allied = close.filter(x => (gs.namedAlliances || []).some(al => al.active !== false && al.members?.includes(name) && al.members?.includes(x))).length;
  const s = pStatsOf(name) || {};
  const arch = (players || []).find(p => p.name === name)?.archetype || '';
  const v = voiceOf(name);
  const group = (s.social || 5) * 0.6 + (GROUP_ARCH.has(arch) ? 2 : 0) + (v.some(t => ['bossy', 'loud', 'warm', 'theatrical'].includes(t)) ? 1.5 : 0) + Math.min(3, close.length) * 0.5 + Math.min(3, allied) * 1.2;
  const duo = (s.strategic || 5) * 0.6 + (DUO_ARCH.has(arch) ? 2 : 0) + (v.some(t => ['schemer', 'calm', 'dry'].includes(t)) ? 1.5 : 0);
  const solo = (10 - (s.social || 5)) * 0.45 + (SOLO_ARCH.has(arch) ? 2 : 0) + (close.length ? 0 : 2);
  if (group >= duo && group >= solo && close.length >= 2) return 'group';
  if (solo > duo && solo > group) return 'solo';
  return 'duo';
}
// the people a would bring to the huddle: on the same side, and people a gets on with
const closeTo = (name, pool) => [...pool].filter(x => x !== name && getBond(name, x) >= 1).sort((x, y) => getBond(name, y) - getBond(name, x) || x.localeCompare(y));

// the moments that can grow past two people, and how ('shared': friends of both, when a works in
// groups; 'side': b's closest friend steps into a public fight)
// moments that happen in front of the camp: somebody else is always there to see it
const PUBLIC = /^(drama\.(bomb|fight|dispute|clash|explode|meltdown|dig|stir|showboat|nemesis|jealous)|blame\.loss|credit\.(callout|steal)|villain\.(power|loom))/;
// what a witness takes away from it, to the camera (public.note.<fam>)
const NOTE_FAM = k => /^credit/.test(k) ? 'credit' : /showboat|jealous/.test(k) ? 'brag' : /^villain/.test(k) ? 'power' : 'fight';
const CROWD_WORDS = /\b(everybody|everyone|the whole (camp|team)|the others|the rest of)/i;
// ── the vote, told across the day (the user: "I don't understand why people target x or y, I
// don't understand where this is going") ──────────────────────────────────────────────────────
// The plan scenes say the name and the reason at the end of the afternoon; these are the beats
// before them, each from what the engine did, so the vote has a start and a middle:
//   arc.spark.<case>   the moment the target becomes a target, seen by the one who runs the plan
//                      (a; b is the target): pre-challenge for a threat, a grudge, a pair, a group,
//                      an outsider or an idol; just after the challenge for a loss (sank)
//   arc.warn.<how>     word reaches somebody (voting.js pitchIntel): told (a tells b that {pitcher}
//                      is pushing {target}; self when that's b) or overheard (b hears {pitcher})
//   arc.adv.<why>      why an advantage comes out tonight, before the vote (advantages.js): an idol
//                      after a warning, a tip-off, a leak, paranoia, desperation or a read; an idol
//                      for an ally; an Extra Vote or a Vote Steal and on whom. {found} is when they
//                      found it, when an earlier episode aired it
//   arc.ally.formed    an alliance the engine formed today that no scene showed
// Off with seasonConfig.tdEdit === 'off'. The engine decided all of it; these only show it.
const SPARK_PRE = new Set(['threat', 'grudge', 'pair', 'group', 'outsider', 'idol']);
// mode 'vote': the spark, the warnings, the advantage decisions (written before the plan scenes, so
// those can call back to them through t.em, the episode's memory); 'ally': an unseen alliance, last
function arcBeats(ep, camp, members, phase, t, next, list, earlier = [], mode = 'all') {
  const out = [];
  const facts = (who, extra = {}) => ({ ...factsFor({ who, data: {} }, { ep: ep.num, phase, tribal: phase === 'post' || !!(ep.isMerge || gs.isMerged) }), third: !!who.c, pair: !!who.b, ...extra });
  // each beat has its own stretch of the day, so it never shares a spot with the vote talk
  const windowOf = step => step === 'spark' ? (phase === 'pre' ? 'morning' : 'afternoon') : step === 'warn' || step === 'ally' ? 'evening' : 'before-tribal';
  const say = (pool, ending, who, data, at, step, badge, why, extra) => {
    const win = windowOf(step);
    const w = writeStory(pool, ending, who, data, facts(who, extra), { ep: ep.num, camp, phase, n: next(), place: 'secret', avoid: ctxAvoid(win), unique: 'soft' });
    if (!w) return;
    const players = [...new Set(Object.values(who).filter(Boolean))];
    if (t?.em) t.em.aired.push({ step, pool, ending, who, data });
    out.push({ at, item: { story: true, kind: `${pool}.${ending}`, storyType: 'vote', step, players, lines: w.lines, text: w.text, lineId: w.lineId,
      scene: { kind: pool, who, data, spot: w.spot ? { ...w.spot, window: win } : null }, badgeText: badge[0], badgeClass: badge[1], why } });
  };
  const here = x => !!x && members.includes(x);
  // an alliance forms whether or not this camp votes tonight
  const allyBeats = () => {
    for (const al of (gs.namedAlliances || []).filter(x => x.formed === ep.num && (x.members || []).filter(here).length >= 2)) {
      const mem = (al.members || []).filter(here);
      const shown = [...earlier.map(item => ({ item })), ...list, ...out].some(x => /alliance|ally|recruit|pact|deal/i.test(x.item?.kind || '') && mem.filter(m => x.item?.players?.includes?.(m)).length >= 2);
      if (shown || phase !== 'post') continue;
      const [a, b, c, d] = mem;
      say('arc.ally', 'formed', { a, b, ...(c ? { c } : {}), ...(d ? { d } : {}) }, { group: al.name }, 4e5, 'ally', ['New Alliance', 'gold'], [`${mem.join(', ')} form ${al.name}.`], { group: true });
    }
  };
  if (mode === 'ally' || !t) { if (mode !== 'vote') allyBeats(); return out; }
  const { boot, leader, tribal } = t;
  // 1. the spark
  const caseNow = sparkCase(ep, t);
  if (boot && leader && here(boot) && here(leader) && leader !== boot && !(t.cause || []).some(c => c.by === leader && c.of === boot)) {
    const pre = SPARK_PRE.has(caseNow.kind);
    if (caseNow.kind === 'coming' || caseNow.kind === 'numbers') { /* the warning, or the plan itself, is the start */ } else
    if ((phase === 'pre') === pre && (caseNow.kind !== 'sank' || phase === 'post')) {
      const seenWith = list.some(x => x.item?.players?.includes?.(boot) && x.item?.players?.includes?.(leader) && /drama|blame|crowd\.lost/.test(x.item?.kind || ''));
      if (!(caseNow.kind === 'sank' && seenWith))
        say('arc.spark', caseNow.kind, { a: leader, b: boot, ...(caseNow.partner ? { c: caseNow.partner } : {}) }, caseNow.data, pre ? 0.4 : 0.3, 'spark', ['The Spark', 'gold'],
          [`This is where ${boot} becomes a target: ${caseNow.words}.`]);
      if (t.em && out.some(x => x.item.step === 'spark')) t.em.spark = { by: leader, of: boot, kind: caseNow.kind };
    }
  }
  if (phase !== 'post') return out;
  if (mode === 'all') allyBeats();
  // 2. word gets around
  // only word that turned out true: the pitcher really wrote that name (an earlier pitch that changed would contradict the plan scene)
  const wrote = x => (ep.votingLog || []).find(v => v.voter === x)?.voted;
  const warned = (ep.pitchIntel || []).filter(i => i.believed !== false && here(i.knower) && tribal.includes(i.knower) && i.target && tribal.includes(i.target) && i.pitcher && i.pitcher !== i.knower && wrote(i.pitcher) === i.target);
  const seen = new Set();
  const toldTargets = new Set();
  // (the warning the pitch scene already stages, its own pitch.warn part (episode.js), is not told a second time: Sierra
  // pulled Owen aside with "Courtney wants you gone", then came back that evening with "Watch out for Courtney", read
  // 2026-10-14)
  const staged = i => i.sourceType === 'direct-warning' && i.knower === i.target && (ep.votePitches || []).some(p => p.pitcher === i.pitcher && p.pitchTarget === i.target);
  for (const i of warned) {
    if (seen.size >= 2 || seen.has(i.knower) || staged(i)) continue;
    const told = i.sourceType !== 'overheard' && i.source && i.source !== i.pitcher && here(i.source) && i.source !== i.knower;
    const who = told ? { a: i.source, b: i.knower } : { a: i.knower };
    const data = { pitcher: i.pitcher, target: i.target };
    seen.add(i.knower);
    // (the user, 2026-10-11: Bruno told Millie, then told Julia "Millie doesn't know yet, I came to you first")
    const targetKnows = toldTargets.has(i.target);
    if (i.target === i.knower) toldTargets.add(i.target);
    if (t.em) t.em.warned.push({ teller: told ? i.source : null, knower: i.knower, pitcher: i.pitcher, target: i.target });
    say('arc.warn', told ? 'told' : 'overheard', who, data, 5e5 + seen.size, 'warn', ['Word Gets Around', 'blue'],
      [`${i.knower} finds out ${i.pitcher} is pushing ${i.target === i.knower ? 'their name' : i.target}.`], { self: i.target === i.knower, pitcher: true, target: true, targetKnows });
  }
  // 3. why an advantage comes out tonight
  (ep.idolPlays || []).forEach((p, k) => {
    if (!here(p.player) || !tribal.includes(p.player)) return;
    const a = p.player;
    const r = String(p.playReason || '');
    let why;
    if (!p.type || p.type === 'legacy') {
      if (p.fake || p.misplay) why = 'idol.paranoid';
      else if (p.playedFor && p.playedFor !== a) why = 'idolfor';
      else why = /^warned by .+ that .+ was organizing/.test(r) ? 'idol.warned' : /^warned by/.test(r) ? 'idol.tipped' : /idol leak|idol was exposed/.test(r) ? 'idol.exposed'
        : /paranoia/.test(r) ? 'idol.paranoid' : /desperation/.test(r) ? 'idol.desperate' : 'idol.read';
    } else why = { extraVote: p.forAlly ? 'extrafor' : 'extra', voteSteal: 'steal', voteBlock: 'block', soleVote: 'sole', safetyNoPower: 'safety' }[p.type];
    if (!why) return;
    const m = /^warned by (.+?) that (.+?) was organizing/.exec(r);
    const ally = p.playedFor && p.playedFor !== a ? p.playedFor : p.forAlly || null;
    const target = p.target && tribal.includes(p.target) ? p.target : null;
    const confidant = members.filter(x => x !== a && x !== target && tribal.includes(x) && getBond(a, x) >= 3).sort((x, y) => getBond(a, y) - getBond(a, x) || x.localeCompare(y))[0] || null;
    const foundAt = (gs.episodeHistory || []).filter(h => h.num <= ep.num).find(h => (h.idolFinds || []).some(f => f.finder === a));
    const found = foundAt ? (foundAt.num === ep.num ? 'today' : foundAt.num === ep.num - 1 ? 'a couple of days ago' : `back on day ${dayOf(foundAt.num)}`) : null;
    const who = { a, ...(confidant && why !== 'idolfor' ? { b: confidant } : {}), ...(ally && why === 'idolfor' ? { b: ally } : {}) };
    const data = { ...(target ? { target } : {}), ...(m ? { pitcher: m[2], source: m[1] } : {}), ...(found ? { found } : {}), ...(p.stolenFrom ? { other: p.stolenFrom } : {}) };
    say('arc.adv', why, who, data, 7e5 + k, 'advwhy', ['The Decision', 'purple'], [`${a} decides to play it tonight.`],
      { target: !!target, pitcher: !!m, found: !!found, other: !!p.stolenFrom });
  });
  return out;
}

// 'they're coming for us' is a reason only somebody who heard it can give (the user: it was the case
// in 89 of 170 plans, because in a two-bloc vote the other side always wants one of you): word reached
// someone in the group (pitchIntel: a leak, an overheard pitch, a warning) that a member of the other
// side is pushing one of their names
function heardComing(ep, t, al) {
  const us = new Set([t.leader, ...(t.voters || [])].filter(Boolean));
  const them = new Set(al.members || []);
  return (ep.pitchIntel || []).some(i => i.believed !== false && us.has(i.knower) && them.has(i.pitcher) && us.has(i.target))
    || (t.em?.warned || []).some(w => us.has(w.knower) && them.has(w.pitcher));
}

// what made the target a target, from what the plan scene will say (planTalk's case, read the same way)
function sparkCase(ep, t) {
  const { boot, tribal, voters, leader } = t;
  const has = s => !!s && (typeof s.has === 'function' ? s.has(boot) : Array.isArray(s) ? s.includes(boot) : false);
  const coming = (t.rivals || []).find(al => (al.members || []).includes(boot) && al.target && (al.target === leader || voters.includes(al.target)) && heardComing(ep, t, al));
  const partner = tribal.filter(x => x !== boot && x !== leader && !voters.includes(x)).sort((x, y) => getBond(boot, y) - getBond(boot, x) || x.localeCompare(y))[0];
  const pair = partner && getBond(boot, partner) >= 5 ? partner : null;
  const theirs = (gs.namedAlliances || []).find(al => al.active !== false && (al.members || []).includes(boot) && !(al.members || []).includes(leader))?.name || null;
  const ts = x => threatScore(x) || 0;
  const rank = [...tribal].sort((x, y) => ts(y) - ts(x) || x.localeCompare(y)).indexOf(boot);
  const best = Math.max(-10, ...tribal.filter(x => x !== boot).map(x => getBond(boot, x)));
  const fromBallot = { weak: 'sank', grudge: 'grudge', threat: 'threat' }[t.why];
  void best;
  if (coming) return { kind: 'coming', data: {}, words: `${boot}'s side is going after ${coming.target}` };
  if ((fromBallot === 'sank' || t.ch?.sank === boot)) return { kind: 'sank', data: {}, words: `${boot} cost them the challenge` };
  if (has(gs.knownIdolHoldersPersistent) || has(gs.knownIdolHoldersThisEp)) return { kind: 'idol', data: {}, words: `${leader} suspects ${boot} has an idol` };
  if (pair) return { kind: 'pair', partner: pair, data: { partner: pair }, words: `${boot} and ${pair} vote as one` };
  if (theirs) return { kind: 'group', data: { theirs }, words: `${boot} is with ${theirs}` };
  if (fromBallot === 'grudge' || getBond(leader, boot) <= -2) return { kind: 'grudge', data: {}, words: `${leader} and ${boot} can't stand each other` };
  if (fromBallot === 'threat' || (rank >= 0 && rank <= 1 && tribal.length >= 4)) return { kind: 'threat', data: {}, words: `${boot} is the one everybody will have to beat` };
  if (Math.max(-10, ...tribal.filter(x => x !== boot).map(x => getBond(boot, x))) <= 0) return { kind: 'outsider', data: {}, words: `nobody is close to ${boot}` };
  return { kind: 'numbers', data: {}, words: `${boot} is the easy name` };
}

const PULL = [
  // [kind, who joins, how many at most, only when a works in groups]
  [/^talk\.(plan|game|checkin|scramble)/, 'shared', 2, true],
  [/^friend\.(bond|goof|joke|sunrise|struggle|laugh|rally|lift)/, 'shared', 3, false],
  [/^alliance\.crack/, 'shared', 1, true],
  // (one friend at most, and a close one: every fight pulling in two friends made every fight a three-way, read
  // 2026-10-14, the user: "theres a lot of fight and people taking sides")
  [/^drama\.(fight|bomb|dig|clash|explode)/, 'side', 1, false],
  [/^recruit\.join/, 'members', 3, false],
];
// One fight a camp a day with people taking sides (the user, 2026-10-14: "theres a lot of fight and people taking sides
// i mean this structure happens a lot why"; measured on the carnival read: every fight with anybody else around had a
// third person backing one of them, and the next morning a "you took their side"). The first fight of the day that has
// somebody else speaking up keeps them, a fight whose own lines are written with a defender included; a later one loses
// the room's reaction (marked sideTake) and is the two of them. witness.js adds nobody to a day that already has one.
// The same for the one watching it who tells the camera what it showed them (watchNote, and the "X heard every word"
// beat that brings them on, watch): one fight a day has one.
function sidesOncePerDay(out, live) {
  let sided = false, noted = false;
  const drop = (it, mark) => {
    const off = new Set(it.lines.filter(l => l[mark] && l.by).map(l => l.by));
    it.lines = it.lines.filter(l => !l[mark]);
    // (a "heard every word" beat for somebody who now says nothing goes with them)
    it.lines = it.lines.filter(l => !(l.watch && l.watch.every(p => !it.lines.some(x => x.by === p))));
    it.text = it.lines.map(l => l.text).join(' ');
    // (somebody whose every line went is no longer in the scene)
    if (Array.isArray(it.players)) it.players = it.players.filter(p => !off.has(p) || it.lines.some(l => l.by === p || (l.kind === 'beat' && (l.text || '').includes(p))));
  };
  for (const phase of ['pre', 'post']) for (const it of out[phase] || []) {
    if (!it?.story || !Array.isArray(it.lines)) continue;
    if (it.lines.some(l => l.watchNote)) {
      if (!noted) {
        noted = true;
        if (live) { const nb = ((gs.tdStory ||= {}).noteBy ||= {}); for (const p of new Set(it.lines.filter(l => l.watchNote && l.by).map(l => l.by))) nb[p] = (nb[p] || 0) + 1; }
      } else drop(it, 'watchNote');
    }
    if (!sidedFight(it)) continue;
    if (!sided) { sided = true; continue; }
    if (it.lines.some(l => l.sideTake)) drop(it, 'sideTake');
  }
}
function votePlan(ep, camp, members) {
  const gone = ep.eliminated;
  const tribal = (ep.tribalPlayers || []).filter(p => members.includes(p));
  if (!gone || !tribal.includes(gone) || tribal.length < 3) return null;
  const ballots = (ep.votingLog || []).filter(v => v.voter && v.voted && tribal.includes(v.voter));
  // the name the plan was on: the boot, or (a tie that went to rocks, a vote that never landed on
  // the person who left) the name that drew the most votes; the target's own scene is the boot's only
  const tally0 = {};
  for (const v of ballots) tally0[v.voted] = (tally0[v.voted] || 0) + 1;
  const boot = tally0[gone] ? gone : Object.entries(tally0).filter(([x]) => tribal.includes(x)).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))[0]?.[0];
  if (!boot) return null;
  const onBoot = ballots.filter(v => v.voted === boot && v.voter !== boot);
  if (ballots.length < 3 || !onBoot.length) return null;
  const voters = onBoot.map(v => v.voter);
  const strat = x => pStatsOf(x)?.strategic || 0;
  const byStrat = list => [...list].sort((x, y) => strat(y) - strat(x) || x.localeCompare(y));
  const pitch = (ep.votePitches || []).find(p => p.pitchTarget === boot && voters.includes(p.pitcher));
  const bloc = (ep.alliances || []).find(al => al.target === boot && (al.members || []).some(m => voters.includes(m)));
  const leader = pitch?.pitcher || byStrat(voters.filter(v => bloc?.members?.includes(v)))[0] || byStrat(voters)[0];
  // the reason the bloc gives each other: the commonest one among the people writing the name
  const tally = {};
  for (const v of onBoot) { const w = ballotWhy(v, ep); if (w !== 'flip' && w !== 'self') tally[w] = (tally[w] || 0) + 1; }
  const ch = ep.isMerge || gs.isMerged ? null : challengeOf(ep, camp);
  let why = Object.entries(tally).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))[0]?.[0] || 'plan';
  // no ballot gave a reason of its own (they joined a pitch): the reason is the one the pitch was
  // picked on (voting.js weighs the pitcher's choice by threat and by bad blood), read the same way
  if (why === 'plan') {
    const ts = x => threatScore(x) || 0;
    const rank = [...tribal].sort((x, y) => ts(y) - ts(x) || x.localeCompare(y)).indexOf(boot);
    const bond = getBond(leader, boot);
    if (ch?.sank === boot) why = 'weak';
    else if (bond <= -2 && -bond * 0.3 > ts(boot) * 0.4) why = 'grudge';
    else if (rank >= 0 && rank <= 1 && tribal.length >= 4) why = 'threat';
  }
  const other = pitch?.originalTarget && pitch.originalTarget !== boot && tribal.includes(pitch.originalTarget) && !voters.includes(pitch.originalTarget) ? pitch.originalTarget : null;
  // the other side: a bloc of two or more with a different name, the boot's own if there is one
  const rivals = (ep.alliances || []).filter(al => al.target && al.target !== boot && tribal.includes(al.target) && (al.members || []).filter(m => tribal.includes(m) && m !== al.target).length >= 2);
  // ...and every other name that two ballots or more went to, by whoever wrote it, alliance or not (the user,
  // 2026-10-12: "Thom and Finn were on the chopping block but I heard no one talk about Thom, no bloc formation,
  // no explanation, no logic". Measured: 27% of the names on the block who survived had no scene about them,
  // because a plan only aired when one alliance had made it, and votes from people in different groups made none)
  const wroteFor = {};
  for (const v of ballots) if (v.voted !== boot && v.voter !== v.voted && tribal.includes(v.voted)) (wroteFor[v.voted] ||= []).push(v.voter);
  for (const [name, vs] of Object.entries(wroteFor))
    if (vs.length >= 2 && !rivals.some(al => al.target === name)) rivals.push({ label: null, members: [...vs], target: name, loose: true });
  // a plan two ballots really followed first (it is on the chopping block), then the boot's own side (they're sure
  // it's someone else), then the one with the most real votes behind it
  const realVotes = al => ballots.filter(v => v.voted === al.target && (al.members || []).includes(v.voter)).length;
  rivals.sort((x, y) => (realVotes(y) >= 2) - (realVotes(x) >= 2) || (y.members.includes(boot) ? 1 : 0) - (x.members.includes(boot) ? 1 : 0) || realVotes(y) - realVotes(x) || (y.members || []).length - (x.members || []).length);
  const rival = rivals.find(al => al.members.includes(boot)) || rivals[0] || null;
  const counter = (ep.votePitches || []).find(p => p !== pitch && p.pitchTarget !== boot && tribal.includes(p.pitcher) && tribal.includes(p.pitchTarget));
  const covers = new Set([pitch?.pitcher, counter?.pitcher].filter(Boolean));
  return { boot, gone, tribal, ballots, onBoot, voters, pitch, bloc, leader, why, other, ch, rival, rivals, counter, covers };
}

// The plan, as a strategy talk (the user: "lacking in context, strategy, drama, comedy"). Built in
// beats, each from what is true tonight, so the reason, the pushback and the count are always this
// vote's own and never repeat as a block:
//   vp.open.<shape>    pulling people aside (group / duo)
//   vp.case.<case>     a says the name and the real reason: coming ({target} is on a plan against
//                      {mark}), sank (cost them the challenge), idol (suspected of holding one), pair
//                      ({target} and {partner} vote together), group ({target} is with {theirs}),
//                      grudge, threat, outsider (nobody here is close to {target}), numbers (the
//                      only name that can get enough votes)
//   vp.push.<kind>     b answers with their own position: like (b likes {target}), idol, pair, alt
//                      (b would rather write {alt}), sure (no objection)
//   vp.answer.<kind>   a answers it
//   vp.count.<kind>    a counts: close ({count} of us against {them} on another name), all
//                      (everybody but {target}), enough
//   vp.close.<shape>   the button, and somebody's read to the camera
//   vp.solo.case.<case> / vp.solo.count.<kind>   nobody to tell: a to the camera
function planTalk(ep, camp, t, who, shape, baseFacts, next, why, as = { step: 'plan', badge: ['The Plan', 'gold'] }) {
  const { boot, tribal, voters, leader } = t;
  const a = who.a;
  if (!a) return null;
  const has = s => !!s && (typeof s.has === 'function' ? s.has(boot) : Array.isArray(s) ? s.includes(boot) : false);
  const outside = tribal.filter(x => x !== boot && !voters.includes(x));
  // the case: the ballots' own reason first, then the truest specific one
  const coming = (t.rivals || []).find(al => (al.members || []).includes(boot) && al.target && (al.target === leader || voters.includes(al.target)) && heardComing(ep, t, al));
  const partner = tribal.filter(x => x !== boot && x !== a && !voters.includes(x)).sort((x, y) => getBond(boot, y) - getBond(boot, x) || x.localeCompare(y))[0];
  const pair = partner && getBond(boot, partner) >= 5 ? partner : null;
  const theirs = (gs.namedAlliances || []).find(al => al.active !== false && (al.members || []).includes(boot) && !(al.members || []).includes(a))?.name || null;
  const idol = has(gs.knownIdolHoldersPersistent) || has(gs.knownIdolHoldersThisEp);
  const best = Math.max(-10, ...tribal.filter(x => x !== boot).map(x => getBond(boot, x)));
  const ts = x => threatScore(x) || 0;
  const rank = [...tribal].sort((x, y) => ts(y) - ts(x) || x.localeCompare(y)).indexOf(boot);
  const fromBallot = { weak: 'sank', strike: 'coming', grudge: 'grudge', threat: 'threat' }[t.why];
  // a reason about somebody else (alliances.js relationalTargetMod, the same conditions): cut {keep}'s
  // ride-or-die so {keep} has nobody but us; or {target} said out loud they'd never vote {protects}
  const rel = !fromBallot && !coming ? relationalReason([a, ...voters.filter(x => x !== a)], boot) : null;
  const relCase = rel?.kind === 'isolate' && tribal.includes(rel.partner) && rel.partner !== who.b && rel.partner !== a ? 'isolate' : rel?.kind === 'pledge' && tribal.includes(rel.protects) ? 'pledge' : null;
  const caseOf = relCase || ((fromBallot === 'coming' && !coming ? null : fromBallot)
    || (coming ? 'coming' : t.ch?.sank === boot ? 'sank' : idol ? 'idol' : pair ? 'pair' : theirs ? 'group'
      : getBond(a, boot) <= -2 ? 'grudge' : rank >= 0 && rank <= 1 && tribal.length >= 4 ? 'threat' : best <= 1 ? 'outsider' : 'numbers'));
  if (t.why === 'shield') return null;   // saving an ally has its own scenes
  const mark = coming ? coming.target : null;
  // the pushback: b's own position
  const b = who.b;
  const alt = b ? outside.filter(x => x !== b && x !== a).sort((x, y) => getBond(b, x) - getBond(b, y) || x.localeCompare(y))[0] : null;
  const push = !b ? null : getBond(b, boot) >= 2 ? 'like' : idol && caseOf !== 'idol' ? 'idol' : pair && caseOf !== 'pair' ? 'pair'
    : alt && getBond(b, alt) <= 0 ? 'alt' : 'sure';
  // the count
  const rival = (t.rivals || [])[0];
  const them = rival ? (rival.members || []).filter(m => tribal.includes(m) && m !== rival.target && !voters.includes(m)).length : 0;
  // what a can know: their own number, and roughly the other side's (never more than a winning plan faced)
  // (two or more short is behind, not tight: read 2026-10-14, "two against five" answered "That's basically even")
  const count = them >= 2 ? (them >= voters.length + 2 ? 'behind' : them >= voters.length ? 'tight' : 'close') : voters.length >= tribal.length - 1 ? 'all' : 'enough';
  // everybody on the plan but the two talking, so "{others} are on it as well. That's {votes}" adds up (read 2026-10-14:
  // "Zoey and Max are on it as well. That's five" between Mike and Sky: a third in the cast was left out of the list)
  const inScene = new Set([who.a, who.b].filter(Boolean));
  const rest = voters.filter(v => !inScene.has(v));
  const list = n => n.length <= 1 ? n.join('') : `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`;
  // the close is work, not a quip: the shakiest vote (the plan's voter least close to a, someone who is
  // not here if possible), the name they tell camp, and why b is really in
  const shaky = [...rest].sort((x, y) => getBond(a, x) - getBond(a, y) || x.localeCompare(y))[0] || null;
  const cover = alt || (rival?.target && rival.target !== a ? rival.target : null) || outside.find(x => x !== a) || null;
  // the sides, by name (the user, 2026-10-10: "four against five" on day one, and nobody had ever been
  // shown who the four and the five were): who a is counting on, said from a's side ("you, me, Sky and
  // Riot"), and who the other side is
  const usNames = voters.filter(v => v !== a);
  const us = list([...(b && usNames.includes(b) ? ['you'] : []), 'me', ...usNames.filter(v => v !== b)]);
  const themNames = rival ? (rival.members || []).filter(m => tribal.includes(m) && m !== rival.target && !voters.includes(m)) : [];
  const theirSide = themNames.length ? list(themNames) : 'the rest of them';
  const data = { target: boot, us, theirSide, votes: numberWord(voters.length), ...(relCase === 'isolate' ? { keep: rel.partner } : {}), ...(relCase === 'pledge' ? { protects: rel.protects } : {}), ...(shaky ? { shaky } : {}), ...(cover ? { cover } : {}), them: numberWord(them || 1), ...(mark ? { mark } : {}), ...(pair ? { partner: pair } : {}),
    ...(theirs ? { theirs } : {}), ...(alt ? { alt } : {}), ...(rest.length ? { others: list(rest) } : {}), ...(rival?.target ? { other: rival.target } : {}) };
  // the glue (the user's Disventure Camp read: "Aiden connects Gabby and Tom to Lake and Rosa. Cut him out, and
  // that group is toast"): the target is close to two people here who aren't close to each other
  const gluePair = (() => { const f = tribal.filter(x => x !== boot && !inScene.has(x) && getBond(boot, x) >= 3);
    for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) if (getBond(f[i], f[j]) < 1) return [f[i], f[j]];
    return null; })();
  if (gluePair) { data.glueA = gluePair[0]; data.glueB = gluePair[1]; }
  // the other side has really voted as one before: two or more of them wrote the same name at an earlier vote (read
  // 2026-10-14: "Duncan, Lake and Bowie always end up writing the same name. Every time." before that team had voted)
  const sideVoted = themNames.length >= 2 && (gs.episodeHistory || []).some(h => h.num < ep.num && (() => {
    const log = (h.votingLog || []).filter(v => themNames.includes(v.voter) && v.voted);
    return log.length >= 2 && new Set(log.map(v => v.voted)).size === 1; })());
  // there is a side to be afraid of: two or more of them, or three or more left off the plan (read 2026-10-14: "the rest
  // of them already are one" with seven on the plan and the one left off it the target)
  const sideBig = themNames.length >= 2 || tribal.filter(x => !voters.includes(x)).length >= 3;
  const facts = { ...baseFacts, sideVoted, sideBig, count, glue: !!gluePair, shaky: !!shaky, cover: !!cover, close: !!b && getBond(a, b) >= 4, others: !!rest.length, other: !!rival?.target, markMe: mark === a, markB: !!mark && mark === b, otherMe: rival?.target === a, otherB: !!b && rival?.target === b, cast: shape };
  // what this camp's day has already shown (arcBeats, t.em): the plan can call back to it
  const em = t.em || { spark: null, warned: [] };
  const sparkSeen = !!em.spark && em.spark.by === a && em.spark.of === boot;
  const tip = em.warned.find(w => w.knower === a && w.teller && w.teller !== b) || null;
  if (tip) data.teller = tip.teller;
  // warned by the very person this plan is going after: the scene has to say so
  const fromTarget = em.warned.find(w => w.knower === a && w.teller === boot) || null;
  if (fromTarget) data.warnedAbout = fromTarget.pitcher;
  Object.assign(facts, { sparkSeen, told: !!tip, tally: count, alt: !!alt, fromTarget: !!fromTarget, sparkKind: sparkSeen ? em.spark.kind : 'none' });
  // has the viewer ever SEEN this side come together? (the user, 2026-10-10: "four against five" on day one,
  // with no scene before it setting those sides). An alliance chapter with a and one of the people being
  // counted that aired before now, or a vote they planned together on an earlier night. If not, the scene
  // shows the side forming instead of counting it (vp.form), and the counting lines stay out (fact sides).
  const sideNames = [...new Set([...voters.filter(v => v !== a), ...(b ? [b] : [])])];
  const sides = (() => {
    const shown = (gs.tdStory?.lines || []).some(l => l.type === 'alliance' && (l.people || []).includes(a) && l.people.some(p => sideNames.includes(p))
      && l.steps.some(s => s.aired && (s.ep < ep.num || (s.ep === ep.num && s.phase === 'pre'))));
    if (shown) return true;
    return (gs.episodeHistory || []).some(h => h.num < ep.num && Object.values(h.campStory || {}).some(c => [...(c.pre || []), ...(c.post || [])]
      .some(x => x?.storyType === 'vote' && (x.players || []).includes(a) && x.players.some(p => sideNames.includes(p)))));
  })();
  facts.sides = sides;
  // the moment it started (causeOf), said to the camera at the end of the plan
  // only a moment that aired: the morning's must have made it on screen; the afternoon's airs after this (airTdEpisode)
  const causeAired = c => { if (c.aired) return true; const ev = eventsOf(ep, camp, c.phase)[c.i]; return c.phase === 'pre' ? ev?.aired === true : ev?.aired == null || ev?.aired === true; };
  const cause = (em.causes || []).find(c => c.by === a && c.of === boot && causeAired(c)) || null;
  const recall = lines => {
    if (!cause || lines.some(l => l.recall) || (em.recalled ||= new Set()).has(a + '|' + boot)) return;
    const r = writeStory('vp.recall', cause.kind, { a }, { target: boot, moment: cause.moment.replace('{target}', boot), ...(cause.fallen ? { fallen: cause.fallen } : {}) }, { ...facts }, { ep: ep.num, camp, phase: 'post', n: next(), place: 'confessional', unique: 'soft' });
    if (r) { em.recalled.add(a + '|' + boot); lines.push(...r.lines.map(l => ({ ...l, recall: `${cause.phase}:${cause.i}` }))); }
  };
  // a whole scene, written start to finish (the user: "they're not talking to each other, it's cut
  // short"); the beats below only when no whole scene fits this cast
  // (a side nobody has seen form plays beat by beat, so it can form on camera: vp.form below)
  if (b && sides) {
    // a scene nobody has seen this season first, then the least-aired one
    // (never a whole plan scene this episode has already aired for another plan: then it plays beat by beat, below)
    const ws = u => writeStory('vp2', caseOf, who, data, facts, { ep: ep.num, camp, phase: 'post', n: next(), place: 'secret', avoid: ctxAvoid('scramble'), unique: u, epFresh: true });
    // (a fresh one only: once this season has used them, the plan is built beat by beat from tonight's own reason and count,
    // never a whole scene from an earlier night again; read 2026-10-14, plan scenes came back 2.4 times a season)
    const whole = ws(true);
    if (whole) recall(whole.lines);
    if (whole) return { story: true, kind: `story.vote.${as.step}.${caseOf}`, storyType: 'vote', step: as.step, players: [...new Set(Object.values(who).filter(Boolean))], lines: whole.lines,
      text: whole.text, lineId: whole.lineId, scene: { kind: 'story.vote', who, data, spot: whole.spot ? { ...whole.spot, window: 'scramble' } : null }, badgeText: as.badge[0], badgeClass: as.badge[1], why };
  }
  const lines = [];
  let spot = null, lineId = null;
  // one conversation, one place (the user, 2026-10-11: five set-ups in five places inside one scene, "the cave",
  // "the shoreline", "the fishing rocks", while the screen stayed at the ruins): only the first beat sets it
  // a beat the talk can go without (the pushback, the count, the button) is left out rather than said twice in one
  // episode by two different plans; the case itself always gets said
  const OPTIONAL_BEAT = /^vp\.(push|count|close|solo\.count)$/;
  const beat = (pool, ending, w = who) => {
    // (a side forming is said once a season per version: once they're spent the plan goes on without it, the reason and the
    // count still said; read 2026-10-14, the same 'they always end up writing the same name' 1.6 times a season)
    const r = writeStory(pool, ending, w, data, facts, { ep: ep.num, camp, phase: 'post', n: next(), place: 'secret', avoid: ctxAvoid('scramble'), unique: /^vp\.form/.test(pool) ? true : 'soft', noSetup: lines.length > 0, epFresh: OPTIONAL_BEAT.test(pool) });
    if (!r) return false;
    if (!spot && r.spot) spot = r.spot;
    lineId = lineId || r.lineId;
    // a later beat's own pull-aside is said already: they are away from camp (read 2026-10-14, carnival: hiding in the
    // corn maze, Marissa joins them, then "Ivy waits until everybody else is busy, then pulls Marissa and the others
    // away from camp")
    const own = lines.length && r.lines[0]?.kind === 'beat' && /\b(pulls?|walks?|gets|rounds? up|waits until|drags?|leads?)\b.*\b(away|aside|alone|out of)\b/i.test(r.lines[0].text || '') ? 1 : 0;
    lines.push(...r.lines.slice(own));
    return true;
  };
  if (shape === 'solo' || !b) {
    if (!beat('vp.solo.case', caseOf)) return null;
    if (sides) beat('vp.solo.count', count);
  } else {
    beat('vp.open', shape === 'group' ? 'group' : 'duo');
    if (!beat('vp.case', caseOf)) return null;
    if (push && beat('vp.push', push)) beat('vp.answer', push);
    // the count, or, when nobody has seen this side form, the side forming right here
    if (sides) beat('vp.count', count);
    else beat('vp.form', shape === 'group' ? 'group' : 'duo');
    beat('vp.close', shape === 'group' ? 'group' : 'duo');
  }
  recall(lines);
  // somebody who speaks only in a later beat walks up when they first speak (read 2026-10-14: "Oliwia follows Nura into
  // the cave", then Natasha asked what they'd say, never having arrived): the set-up is written for the opening beat only
  { const seen = new Set();
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.kind === 'beat') { for (const n of inScene) if ((l.text || '').includes(n)) seen.add(n); continue; }
      if (l.kind !== 'say' || !l.by) continue;
      if (seen.size >= 2 && !seen.has(l.by) && inScene.has(l.by)) {
        lines.splice(i, 0, { kind: 'beat', by: null, text: `${l.by} joins them.`, arrive: [l.by] });
        i++;
      }
      seen.add(l.by);
    } }
  const players = [...inScene];
  return { story: true, kind: `story.vote.${as.step}.${caseOf}`, storyType: 'vote', step: as.step, players, lines, text: lines.map(l => l.text).join(' '), lineId,
    scene: { kind: 'story.vote', who, data, spot: spot ? { ...spot, window: 'scramble' } : null }, badgeText: as.badge[0], badgeClass: as.badge[1], why };
}

// ── the cause (the user, 2026-10-08, pointing at the Strategy Timeline: "it gives you big hindsight
// on how to build an episode") ──
// The timeline lists the engine's day in order, and the vote's cause is in it: a fight, a slacker
// called out, a lie caught, between the person who runs tonight's plan and the person it's on. That
// moment airs (on top of the caps), the generic spark steps aside, and the plan calls back to it.
// Only moments between the two of them, worst first; one per plan, three in all.
// [kind, what it matches, how the leader names it, who has to have started it (the
// event's first player): the target caught out, or the leader doing the blaming]
const CAUSE = [
  ['caught', /sabotag|caught|lie\b|backstab|betray/i, 'what {target} pulled', 'boot'],
  ['fight', /fight|clash|dispute|argument|confront|explo|blow/i, 'that fight', null],
  ['blame', /blame|slack/i, 'the way {target} let us down', 'leader'],
  ['rival', /triangle|jealous/i, 'that whole love triangle mess', null],
  ['rival', /hatred|nemesis|cold war|passive/i, 'another {half} stuck next to {target}', null],
  ['rival', /grudge|rival|tension|trust ?crack/i, 'what happened between us', null],
];
// the other plan's people tonight, and who runs it (a member writing the boot's name is with the other side)
function rivalLead(t, rv) {
  const { tribal, boot, ballots } = t;
  const ballotOf = x => ballots.find(v => v.voter === x)?.voted || null;
  // (the one going home is on the plan whose name they wrote, not on every bloc they belong to: read 2026-10-13, Leshawna
  // ran two 'other plans' back to back with the same two people, 'Aubrey is coming after me', then 'Heather is')
  const mem = rv.members.filter(m => tribal.includes(m) && m !== rv.target && (m === boot ? !ballotOf(boot) || ballotOf(boot) === rv.target : ballotOf(m) !== boot));
  const a = mem.includes(boot) ? boot : [...mem].sort((x, y) => (pStatsOf(y)?.strategic || 0) - (pStatsOf(x)?.strategic || 0) || x.localeCompare(y))[0];
  return { mem, a };
}
// every plan's leader and target: tonight's plan, then the other side's (the user: Will's pitch on
// Seraphine needs its reason as much as Grett's on Ashley)
function causeOf(ep, camp, t) {
  const pairs = [[t.leader, t.boot], ...(t.rivals || []).slice(0, 2).map(rv => [rivalLead(t, rv).a, rv.target])];
  const used = new Set();
  const out = [];
  for (const [leader, boot] of pairs) {
    if (!leader || !boot || leader === boot) continue;
    const mine = causeFor(ep, camp, leader, boot).filter(c => !used.has(c.phase + c.i));
    mine.forEach(c => used.add(c.phase + c.i));
    out.push(...mine.map(c => ({ ...c, by: leader, of: boot })));
  }
  return out.slice(0, 3);
}
function causeFor(ep, camp, leader, boot) {
  const out = [];
  for (const phase of ['pre', 'post']) {
    const evs = eventsOf(ep, camp, phase);
    const found = evs.map((ev, i) => {
      if (!ev || ev.aired != null || !(ev.players || []).includes(leader) || !(ev.players || []).includes(boot)) return null;
      const s = `${ev.type || ''} ${ev.badgeText || ''} ${ev.scene?.kind || ''}`;
      // back from a loss the team's own blame scene opens the afternoon already
      if (phase === 'post' && (ev.type === 'blame' || /^crowd\.lost/.test(ev.scene?.kind || ''))) return null;
      if (/idol/i.test(s)) return null;   // an idol read is the idol case's own scene
      if (ev.type === 'turnFriend') return null;   // a pitch airs in its own slot (pitchTake), never a second way
      // a loyalty test is the tester's move, not the tested one's ("what Topher pulled this morning": Topher passed Jo's
      // test, read 2026-10-14)
      if (/^test\./.test(ev.scene?.kind || '')) return null;
      // making up is not where a vote starts
      if (/thaw|amend|truce|forgiv|apolog|rekindle|celebrat|gratitude|bond/i.test(s)) return null;
      const kind = ev.scene?.kind || '';
      if (!(kind && hasStoryPool(`long.${kind}`)) && !rawFits(ev, ep, phase)) return null;
      // (by its own window: a fight at chore time is not "this morning", read 2026-10-14)
      const win = ev.scene?.spot?.window || ev.access?.windowId || null;
      const when = phase === 'pre' ? (win && win !== 'morning' ? 'earlier today' : 'this morning') : 'this afternoon';
      // the morning after a vote: a grieves the friend b helped vote out (camp-events.js fallout.mourn).
      // Revenge when a runs the plan; when b does, b is getting rid of the person who will want it
      const fallen = ev.scene?.data?.fallen;
      if (/^fallout\.mourn/.test(kind) && fallen) {
        const mourner = ev.scene?.who?.a;
        if (mourner !== leader && mourner !== boot) return null;
        return { i, k: -1, phase, kind: mourner === leader ? 'revenge' : 'fallout', moment: when, fallen };
      }
      // (the two of them are the ones it happened between, not one of them and somebody who watched: read 2026-10-14,
      // Diego "that fight this afternoon" against Spencer, who had only overheard Alessio and Natalia)
      const ab = ev.scene?.who ? [ev.scene.who.a, ev.scene.who.b] : (ev.players || []).slice(0, 2);
      if (!ab.includes(leader) || !ab.includes(boot)) return null;
      const k = CAUSE.findIndex(([, re, , by]) => re.test(s) && (!by || ev.players[0] === (by === 'boot' ? boot : leader)));
      if (k < 0) return null;
      const half = phase === 'pre' ? 'morning' : 'afternoon';
      return { i, k, phase, kind: CAUSE[k][0], moment: CAUSE[k][2].includes('{half}') ? CAUSE[k][2].replace('{half}', half) : `${CAUSE[k][2]} ${when}` };
    }).filter(Boolean).sort((x, y) => x.k - y.k || x.i - y.i);
    if (found[0]) out.push(found[0]);
  }
  // one moment per plan: the morning's when there was one, it came first
  return out.slice(0, 1);
}

// The cover plan on screen (alliances.js planCoverVotes; the user, from Disventure Camp's "Luckily,
// I have a plan"):
//   cover.meet   a (the leader) gives b (and c), the members a doesn't trust with the name, the cover:
//                {cover}. a is lying; b believes it (or, saw: b senses something's off)
//   cover.tease  a and d, one of the core: the plan exists, the name doesn't get said ({told}: who's
//                being kept out of it)
//   cover.doubt  e, another of the core, close to someone being lied to ({told1}), has second thoughts
// Nothing here says {target}: the name comes out at the reading.
function coverTalk(ep, camp, t, cv, item, base, closest) {
  const { tribal } = t;
  const told = (cv.told || []).filter(m => tribal.includes(m));
  const core = (cv.core || []).filter(m => tribal.includes(m) && m !== cv.leader);
  if (!told.length || !core.length) return [];
  const out = [];
  const a = cv.leader;
  const list = n => n.length <= 1 ? n.join('') : `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`;
  const meetWho = { a, b: told[0], ...(told[1] ? { c: told[1] } : {}) };
  const meet = item('plan', 'cover', 'meet', meetWho, { cover: cv.cover }, base(meetWho, { saw: (cv.saw || []).includes(told[0]), third: !!told[1] }), 'secret', 'scramble', ['The Plan', 'gold'],
    [`${a} tells ${list(told)} the vote is ${cv.cover}.`, `It isn't.`]);
  if (meet) out.push(meet);
  const d0 = closest(a, core);
  if (d0) {
    const w = { a, b: d0 };
    const tease = item('cover', 'cover', 'tease', w, { told: list(told) }, base(w, { two: told.length >= 2 }), 'secret', 'scramble', ['Need to Know', 'purple'],
      [`${a} and ${d0} are on the real plan.`, `${list(told)} ${told.length > 1 ? 'have' : 'has'} been told something else.`]);
    if (tease) out.push(tease);
  }
  const doubter = core.find(m => m !== d0 && told.some(x => getBond(m, x) >= 3)) || null;
  if (doubter) {
    const friend = told.find(x => getBond(doubter, x) >= 3);
    const w = { a: doubter, b: a };
    const dt = item('doubt', 'cover', 'doubt', w, { told1: friend }, base(w, {}), 'aside', 'scramble', ['Second Thoughts', 'blue'], [`${doubter} doesn't like lying to ${friend}.`]);
    if (dt) out.push(dt);
  }
  return out;
}

function voteTalk(ep, camp, t, next) {
  const out = [];
  const { boot, tribal, ballots, voters, pitch, leader, why, other, ch } = t;
  const merged = !!(ep.isMerge || gs.isMerged);
  const base = (who, extra = {}) => ({ ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'post', tribal: true }), tribal: true, merged, late: merged && tribal.length <= 6, third: !!who.c, fourth: !!who.d, ...extra });
  const ballotOf = x => ballots.find(v => v.voter === x)?.voted || null;
  const named = new Set((gs.namedAlliances || []).filter(al => al.active !== false).map(al => al.name));
  const groupOf = (a, b) => (gs.namedAlliances || []).find(al => named.has(al.name) && al.members?.includes(a) && al.members?.includes(b))?.name || null;
  const closest = (x, pool) => [...pool].sort((p, q) => getBond(x, q) - getBond(x, p) || p.localeCompare(q))[0] || null;
  // (u: 'soft' brings back the least-used scene once a pool is spent; true steps aside so the caller's next choice airs)
  const item = (step, pool, ending, who, data, facts, place, win, badge, why, u = 'soft') => {
    const w = writeStory(pool, ending, who, data, facts, { ep: ep.num, camp, phase: 'post', n: next(), place, avoid: ctxAvoid(win), unique: u });
    if (!w) return null;
    return { story: true, kind: `${pool}.${ending}`, storyType: 'vote', step, players: [...new Set(Object.values(who).filter(Boolean))], lines: w.lines, text: w.text, lineId: w.lineId,
      scene: { kind: 'story.vote', who, data, spot: w.spot ? { ...w.spot, window: win } : null }, badgeText: badge[0], badgeClass: badge[1], why };
  };

  // 1. every other plan, first (the user: "I'm seeing a betrayal of the majority's plan, but when did they
  // make that plan?"): each bloc that meant to write another name, up to two of them
  for (const rv of (t.rivals || []).slice(0, 2)) {
    // the people actually on that plan tonight: a member writing the boot's name is with the other side
    const lead = rivalLead(t, rv);
    // somebody already in one plan on screen is not in another, unless this is the name they really wrote (read
    // 2026-10-13: Duncan pitched Lake to Owen, then sat in Millie's plan on Bruno, his alliance's, as if it were his)
    const inOther = new Set(out.filter(o => o.step === 'other').flatMap(o => o.players));
    const mem = lead.mem.filter(m => !inOther.has(m) || ballotOf(m) === rv.target);
    const a = mem.includes(lead.a) ? lead.a : [...mem].sort((x, y) => (pStatsOf(y)?.strategic || 0) - (pStatsOf(x)?.strategic || 0) || x.localeCompare(y))[0];
    // one person runs one plan on screen: a second plan with the same leader would contradict the first
    if (!a || out.some(o => o.step === 'other' && o.scene?.who?.a === a)) continue;
    // the same three ways of working as the plan below (shapeFor)
    const oShape = shapeFor(a, closeTo(a, mem));
    const b = oShape === 'solo' ? null : oShape === 'group' ? closeTo(a, mem)[0] : closest(a, mem.filter(m => m !== a));
    const c = oShape === 'group' ? closeTo(a, mem)[1] || null : null;
    if (a) {
      const g = b ? groupOf(a, b) : null;
      const data = { target: rv.target, ...(g ? { group: g } : {}) };
      const who = { a, b, c };
      const whyO = [`${mem.join(', ')} planned to vote ${rv.target}.`, a === boot ? `${boot} has no idea the numbers are on ${pronouns(boot).obj}.` : `They don't have the numbers.`];
      // the same strategy talk as the plan that happens, from their side: their name, their reason,
      // their count; the one going home may be the one running it
      const theirT = { ...t, boot: rv.target, voters: mem, leader: a, why: 'plan', ch, rivals: [{ members: voters, target: boot }] };
      const it = planTalk(ep, camp, theirT, who, oShape, base(who, { group: !!g, cast: oShape }), next, whyO, { step: 'other', badge: ['Other Plan', 'blue'] })
        || item('other', 'story.vote.other', a === boot ? 'boot' : 'losing', who, data, base(who, { group: !!g, cast: oShape }), 'secret', 'scramble', ['Other Plan', 'blue'], whyO);
      if (it) out.push(it);
    }
  }

  let r = (pitch?.responses || []).find(x => x.voter && tribal.includes(x.voter) && x.voter !== boot && x.voter !== pitch.pitcher
    && !out.some(o => o.players.includes(x.voter)) && voters.filter(v => v !== leader && v !== x.voter).length >= 1);
  // no pitch reached anyone outside the bloc: the swing is somebody outside it who wrote the name
  // anyway (they went with the plan), or, failing that, somebody who did not (they turned it down)
  if (!r) {
    const inBloc = x => (t.bloc?.members || []).includes(x);
    const seen = x => out.some(o => o.players.includes(x));
    const came = voters.find(v => v !== leader && !inBloc(v) && !seen(v) && voters.filter(w => w !== leader && w !== v).length >= 1);
    const held = tribal.find(x => x !== boot && x !== leader && !voters.includes(x) && !seen(x));
    r = came ? { voter: came, accepted: true, reason: null } : held ? { voter: held, accepted: false, reason: (t.rival?.members || []).includes(held) ? 'strong-plan-not-replaced' : null } : null;
  }
  // 2. the plan: the person running it and the people with them agree on the name and the reason
  {
    const pool = voters.filter(v => v !== leader && v !== r?.voter);
    // how the person running it works (shapeFor): the trusted people together, one person aside,
    // or nobody (a solo decision, to the camera)
    const close = closeTo(leader, pool);
    const shape = pool.length ? shapeFor(leader, close) : 'solo';
    const b = shape === 'group' ? close[0] : shape === 'duo' ? closest(leader, pool) : null;
    const c = shape === 'group' ? close[1] || null : null;
    const d = shape === 'group' ? close[2] || null : null;
    const e = shape === 'group' ? close[3] || null : null;
    {
      const who = { a: leader, b, c, d, e };
      const g = b ? groupOf(leader, b) : null;
      const data = { target: boot, votes: numberWord(voters.length), ...(other ? { other } : {}), ...(g ? { group: g } : {}), ...(ch?.sank === boot ? { sank: boot } : {}) };
      const facts = base(who, { cast: shape, other: !!other, group: !!g, sank: ch?.sank === boot, sankT: ch?.sank === boot, unanimous: voters.length === ballots.filter(v => v.voter !== boot).length,
        votes: voters.length >= 5 ? 'many' : voters.length === tribal.length - 1 ? 'all' : 'some' });
      const reason = pitch ? `${leader} organised it${other ? `, moving off ${other}` : ''}.` : `${leader} is running it.`;
      const whyLine = [`The plan is ${boot}: ${WHY_WORDS[why]}.`, reason, `${numberWord(voters.length)} votes: ${voters.join(', ')}.`];
      // the strategy talk, built beat by beat from what is true tonight (planTalk); the old
      // single-entry scene only when a beat pool has nothing for this cast
      // a cover plan that worked (alliances.js planCoverVotes): the viewer is told what the room was
      // told. The leader gives the people they don't trust a cover name, teases the real plan to one
      // of the core without saying it, and the name only comes out at the reading. The real reason
      // is the leader's confessional after the vote (tribal.js).
      const cv = (ep.coverPlans || []).find(p => p.real === boot && tribal.includes(p.leader) && voters.includes(p.leader) && (p.misled || p.told || []).some(m => tribal.includes(m)));
      const coverScenes = cv ? coverTalk(ep, camp, t, cv, item, base, closest) : [];
      const it = coverScenes.length ? null : planTalk(ep, camp, t, who, shape, facts, next, whyLine)
        || item('plan', 'story.vote.plan', why, who, data, facts, 'secret', 'scramble', ['The Plan', 'gold'], whyLine);
      if (coverScenes.length) out.push(...coverScenes);
      else if (it) out.push(it);
    }
  }

  // 3. the swing: somebody the plan needs gets worked on, and answers the way they decided
  if (r) {
    const yes = !!r.accepted;
    const reason = SWING_WHY[r.reason] || 'plain';
    const asker = pitch?.pitcher || leader;
    const who = { a: asker, b: r.voter };
    const data = { target: boot, votes: numberWord(Math.max(2, pitch?.claimedSupport || voters.length)) };
    const it = item('swing', 'story.vote.swing', yes ? 'yes' : 'no', who, data, base(who, { swing: reason, bVoted: ballotOf(r.voter) === boot ? 'boot' : 'other' }), 'aside', 'scramble',
      [yes ? 'Locked In' : 'Not Sold', yes ? 'gold' : 'red'], [`${asker} pitched ${boot} to ${r.voter}.`, `${r.voter} ${yes ? 'said yes' : 'said no'}: ${SWING_WORDS[reason]}.`]);
    if (it) out.push(it);
  }

  // 3b. the doubts (the user: "spearheader, pitch, target, people hesitating"): a member the engine
  // marked unsure of their bloc's plan (voting.js reliability: tentative, drifting, reservations from the
  // start) tells somebody close, or the camera. 'holds': they go along anyway. 'breaks': they are about
  // to write another name (their ballot says so), and this is the moment the viewer sees it coming.
  {
    const unsure = al => new Set([...(al.reliability?.tentative || []), ...(al.reliability?.drifting || []), ...(al.reliability?.initialReservations || [])]);
    // the one who breaks first (that is why a plan fails); one who holds, now and then, when nobody breaks
    // only a plan the viewer saw made (its scene aired), and only somebody who was in that scene: a
    // doubt about a meeting nobody watched reads as a meeting that never happened (the user)
    const aired = al => out.find(o => ['other', 'plan'].includes(o.step) && o.scene?.data?.target === al.target);
    const cand = [];
    for (const al of [t.bloc, ...(t.rivals || []).slice(0, 2)].filter(Boolean)) {
      const sc = aired(al);
      if (!sc) continue;
      const pool = (al.members || []).filter(m => tribal.includes(m) && m !== al.target && m !== boot && unsure(al).has(m) && sc.players.includes(m) && m !== sc.scene?.who?.a);
      for (const m of pool) cand.push({ al, m, breaks: !!ballotOf(m) && ballotOf(m) !== al.target });
    }
    cand.sort((p, q) => (q.breaks ? 1 : 0) - (p.breaks ? 1 : 0) || p.m.localeCompare(q.m));
    const picked = cand.some(c => c.breaks) ? cand.filter(c => c.breaks).slice(0, 1) : cand.slice(0, next() % 2 ? 1 : 0);
    const seenDoubt = new Set();
    // who fought today: "I just like Lynda" from the one who told Lynda "do better" after the loss (read 2026-10-14)
    const pkD = (p, q) => [p, q].sort().join('|');
    const hotD = new Set(['pre', 'post'].flatMap(ph => eventsOf(ep, camp, ph)).filter(ev => ev && /^(long\.)?(drama\.|blame|clash|crowd\.(lost|clash)|fallout\.blame|cross\.rival|witness\.after)/.test(ev.scene?.kind || '')
      && ev.scene?.who?.a && ev.scene?.who?.b).map(ev => pkD(ev.scene.who.a, ev.scene.who.b)));
    for (const { al, m: x, breaks } of picked) {
      if (seenDoubt.has(x)) continue;
      const breaker = breaks ? x : null;
      seenDoubt.add(x);
      const mates = (al.members || []).filter(m => tribal.includes(m) && m !== x && m !== al.target);
      // the one who checks on them was in the same scene, so they both know the plan
      const was = aired(al)?.players || [];
      const conf = closest(x, mates.filter(m => getBond(x, m) >= 1 && was.includes(m))) || null;
      const shape = conf ? shapeFor(x, closeTo(x, mates)) : 'solo';
      const who = shape === 'solo' || !conf ? { a: x } : { a: x, b: conf };
      const data = { target: al.target, ...(breaker && ballotOf(x) !== al.target ? { wrote: ballotOf(x) } : {}) };
      const likesT = getBond(x, al.target) >= 2 && !hotD.has(pkD(x, al.target));
      const it = item('doubt', 'story.vote.doubt', breaker ? 'breaks' : 'holds', who, data, base(who, { cast: who.b ? shape : 'solo', wrote: !!data.wrote, likesT }), who.b ? 'aside' : 'confessional', 'scramble',
        [breaker ? 'Second Thoughts' : 'Doubts', breaker ? 'red' : 'blue'],
        [`${x} isn't sure about the plan to vote ${al.target}.`, breaker ? `${x} is going to write ${ballotOf(x)} instead.` : `${x} goes along with it anyway.`]);
      if (it) out.push(it);
    }
  }

  // 4. the target: scrambling if word reached them, sure of their own name if it did not. And the
  // suspense (the user: "don't focus on one person on the chopping block"): the other plan's target,
  // who will survive, is just as sure it's them, and goes after the name they want instead.
  const em = t.em || { warned: [] };
  const tipFor = x => em.warned.find(w => w.knower === x && w.teller) || null;
  // (somebody running a plan tonight isn't sitting there sure it's them: the plan's leader, a cover's leader)
  const leads = new Set([t.leader, ...out.filter(o => ['plan', 'other'].includes(o.step)).map(o => o.scene?.who?.a), ...(ep.coverPlans || []).map(p => p.leader)].filter(Boolean));
  const rivalT = (t.rivals || []).map(al => al.target).find(x => x && x !== boot && tribal.includes(x) && !leads.has(x) && !out.some(o => o.step === 'decoy'));
  if (rivalT && boot === t.gone) {
    const dWrote = ballotOf(rivalT);
    const friend = closest(rivalT, tribal.filter(x => x !== rivalT && x !== boot && getBond(rivalT, x) >= 1));
    if (friend && dWrote && dWrote !== rivalT) {
      const tip = tipFor(rivalT);
      const who = { a: rivalT, b: friend };
      const it = item('decoy', 'vt2', 'decoy', who, { wrote: dWrote, ...(tip ? { teller: tip.teller } : {}) },
        base(who, { told: !!tip, bVoted: ballotOf(friend) === rivalT ? 'boot' : 'other', bWrote: ballotOf(friend) === dWrote, wroteIsBoot: dWrote === boot }), 'aside', 'before-tribal', ['On Edge', 'red'],
        [`${rivalT} is sure the votes are coming for ${pronouns(rivalT).obj}.`, `${rivalT} is pushing ${dWrote}.`]);
      if (it) out.push(it);
    }
  }
  // the same scene for the one going home and for one person who survives the night thinking the same way (the
  // user, 2026-10-12: "they always focus more on the person getting the boot"): read in played seasons, the
  // scramble or the 'feels safe' scene was the boot's alone whenever no other plan had aired, so the person shown
  // relaxing while a friend kept a secret was always the person who went home. Now a decoy with a vote of their
  // own on them gets the same scene, and which of the two airs first has nothing to do with who goes.
  const targetScene = (x, step) => {
    const mine = ballotOf(x);
    if (!mine || mine === x) return null;
    const onX = ballots.filter(v => v.voted === x && v.voter !== x).map(v => v.voter);
    const heard = (ep.pitchIntel || []).find(i => i.knower === x && i.target === x && i.believed !== false)
      || (ep.pitchCounterplay || []).filter(c => c.actor === x).map(c => ({ pitcher: c.pitcher }))[0];
    if (heard) {
      const b = closest(x, tribal.filter(y => y !== x && y !== mine));
      if (!b) return null;
      const who = { a: x, b };
      const tip = tipFor(x);
      const data = { wrote: mine, pitcher: heard.pitcher || (x === boot ? leader : onX[0]) || leader, ...(tip && tip.teller !== b ? { teller: tip.teller } : {}) };
      // what b actually writes: b only promises the name b really writes (the user: Owen promising Mike a vote he never cast)
      const facts = base(who, { bVoted: ballotOf(b) === x ? 'boot' : 'other', bWrote: ballotOf(b) === mine, pitcher: !!heard.pitcher, told: !!data.teller });
      const why = [`${x} heard the votes were coming for ${pronouns(x).obj}.`, `${x} is pushing ${mine} instead. ${b} ${ballotOf(b) === x ? 'is voting ' + x : 'is not on ' + x}.`];
      return item(step, 'vt2', 'scramble', who, data, facts, 'aside', 'before-tribal', ['Scramble', 'red'], why)
        || item(step, 'story.vote.target', 'scramble', who, data, facts, 'aside', 'before-tribal', ['Scramble', 'red'], why);
    }
    // no idea: a friend who is writing their name sits with them, and keeps it from them
    // (never the person they are voting for: they'd be told 'tonight it's you' to their face)
    const liar = closest(x, onX.filter(v => v !== leader && v !== mine && getBond(x, v) >= 1 && !out.some(o => o.players.includes(v) && o.step === 'plan')));
    const why = [`${x} thinks it's ${mine} tonight.`, `${pronouns(x).Sub} ${pronouns(x).sub === 'they' ? "haven't" : "hasn't"} heard ${pronouns(x).posAdj} own name.`];
    // (fresh ones only, here and below: a spent pool steps aside to the target's own confessional rather than replay a scene
    // from an earlier night; read 2026-10-14, "I'm confident because I counted" 2.5 times a season)
    const two = liar ? item(step, 'vt2', 'safe', { a: x, b: liar }, { wrote: mine }, base({ a: x, b: liar }, {}), 'aside', 'before-tribal', ['Feels Safe', 'blue'],
      [...why, `${liar} is writing ${x}'s name.`], true) : null;
    // nobody close is lying to them: they talk it over with a friend who isn't writing their name and
    // doesn't know either (the user: one-line scenes that tell nothing)
    const pal = !two ? closest(x, tribal.filter(y => y !== x && y !== mine && ballotOf(y) !== x && !onX.includes(y) && getBond(x, y) >= 1)) : null;
    const sure = pal ? item(step, 'vt2', 'sure', { a: x, b: pal }, { wrote: mine, ...(ballotOf(pal) && ballotOf(pal) !== mine ? { other: ballotOf(pal) } : {}) },
      base({ a: x, b: pal }, { bWrote: ballotOf(pal) === mine, other: !!(ballotOf(pal) && ballotOf(pal) !== mine) }), 'aside', 'before-tribal', ['Feels Safe', 'blue'], [...why, `${pal} isn't writing ${x}'s name, and doesn't know either.`], true) : null;
    return two || sure || item(step, 'story.vote.target', 'safe', { a: x }, { wrote: mine }, base({ a: x }, { why: ballotWhy(ballots.find(v => v.voter === x), ep) }), 'confessional', 'before-tribal', ['Feels Safe', 'blue'], why);
  };
  if (boot === t.gone) {
    const pair = [];
    const own = targetScene(boot, 'target');
    if (own) pair.push(own);
    // no other plan's target sat there sure it was them (the decoy above): somebody with a vote on them who survives
    if (own && !out.some(o => o.step === 'decoy')) {
      const imm = new Set([].concat(ep.immunityWinner || [], ep.extraImmune || []));
      const hs = x => { let h = 2166136261; for (const c of `${ep.num}|decoy|${x}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
      // (somebody not on screen yet first; then anybody, short of the people running plans)
      const seen = x => out.some(o => o.players.includes(x)) ? 1 : 0;
      // (not somebody about to play an Extra Vote or steal one: they have their own scene saying who it's on, and read
      // 2026-10-14, Tristan told Richard "it's Ivy tonight, both of them", then was scared and asked him for votes on Ivy)
      const attacking = new Set((ep.idolPlays || []).filter(p => ['extraVote', 'voteSteal'].includes(p.type)).map(p => p.player));
      const cands = tribal.filter(x => x !== boot && !leads.has(x) && !imm.has(x) && !attacking.has(x) && ballots.some(v => v.voted === x && v.voter !== x))
        .sort((p, q) => seen(p) - seen(q) || hs(p) - hs(q) || p.localeCompare(q));
      for (const x of cands) { const d = targetScene(x, 'decoy'); if (d) { pair.push(d); break; } }
      // a unanimous night has nobody else with a vote on them: somebody scared, or a plan's name that came to
      // nothing, is as sure as anybody that it's them (vt2.decoy: sure the votes are coming, pushing their own name)
      if (pair.length < 2) {
        const scared = x => ['paranoid', 'desperate'].includes(gs.playerStates?.[x]?.emotional);
        const planned = new Set((ep.alliances || []).map(al => al.target));
        const more = tribal.filter(x => x !== boot && !leads.has(x) && !imm.has(x) && !attacking.has(x) && (scared(x) || planned.has(x)) && ballotOf(x) && ballotOf(x) !== x)
          .sort((p, q) => seen(p) - seen(q) || hs(p) - hs(q) || p.localeCompare(q));
        for (const x of more) {
          const friend = closest(x, tribal.filter(y => y !== x && y !== boot && getBond(x, y) >= 1));
          if (!friend) continue;
          const tip = tipFor(x), who = { a: x, b: friend }, dWrote = ballotOf(x);
          const d = item('decoy', 'vt2', 'decoy', who, { wrote: dWrote, ...(tip ? { teller: tip.teller } : {}) },
            base(who, { told: !!tip, bVoted: ballotOf(friend) === x ? 'boot' : 'other', bWrote: ballotOf(friend) === dWrote, wroteIsBoot: dWrote === boot }), 'aside', 'before-tribal', ['On Edge', 'red'],
            [`${x} is sure the votes are coming for ${pronouns(x).obj}.`, `${x} is pushing ${dWrote}.`]);
          if (d) { pair.push(d); break; }
        }
      }
      if (pair.length === 2 && hs(boot) % 2) pair.reverse();
    }
    out.push(...pair);
  }
  return out;
}

const THREAD_BADGE = { misled: ['Lied To', 'red'], grievance: ['Unfinished Business', 'red'], debt: ['A Debt', 'teal'], rescue: ['A Debt', 'teal'], wronged: ['Unfinished Business', 'red'], rivals: ['Rivals', 'red'] };
const THREAD_WHY = {
  grievance: t => `${t.b} wrote ${t.a}'s name at episode ${t.ep}'s vote.`,
  debt: t => `${t.b} ${t.how === 'idol' ? 'played an idol for' : 'warned'} ${t.a} at episode ${t.ep}.`,
  rescue: t => `${t.b} saved ${t.a} at ${t.chal}.`,
  wronged: t => `${t.b} ${t.how === 'betray' ? 'left' : 'sabotaged'} ${t.a} at ${t.chal}.`,
  rivals: t => `${t.a} and ${t.b} went at each other at ${t.chal}.`,
  misled: t => `${t.b} gave ${t.a} a fake name at episode ${t.ep}'s vote.`,
};

// ── one budget for the day (the pacing plan, stage 3) ──
// Every system proposes its scenes for a stretch of the day (a morning or an evening); this decides which air.
// The vote's information and the day's frame always air (must). A payoff that is due (a follow-up, a turn, the
// morning after a fight, an arc's chapter) comes next and may take the day past its target, up to the ceiling. Then
// the storyline steps and the challenge's moments, then the colour (kits, games, quick cuts), which fills a day up
// to the target and no further. A proposal that does not air changes nothing (commit.js), so a payoff dropped for
// room is still there to be told another day. Every proposal gets a recorded reason, for the debug view.
// (the user, 2026-10-14, reading a season: "we definitely don't have enough events... there's barely any strategy...
// where's the drama, the comedy, the romance": thirty a day and more; it was 18 to 22, and most of the game's own story
// never aired. The talk budgets scale with it, about five and a half spoken lines a scene)
export const DAY_BUDGET = { target: 30, ceiling: 36, turnTarget: 180, turnCeiling: 220 };
const TIER_RANK = { must: 0, due: 1, story: 2, colour: 3 };
const spokenIn = lines => (Array.isArray(lines) ? lines.filter(l => l?.by && l.kind === 'say').length : 0);
// Who gets the last places (stage 4): within the story and the colour, a scene about somebody the last two episodes
// barely heard from goes before one about somebody they heard plenty from, a pair that has never had a scene of their
// own goes before one the show keeps cutting back to, and nobody carries three scenes in a day while others sit
// silent. The vote's information and the payoffs that are due keep their order: they are continuity, not airtime.
// The system's own order (the storyline's drama, the quick cuts' new faces) stays as a weak preference.
const centralOf = (e, events) => {
  const it = e.item || {}, ev = it.ref != null && !it.lines ? events?.[it.ref] : null;
  const who = it.scene?.who || ev?.scene?.who || null;
  const two = who ? [who.a, who.b].filter(x => typeof x === 'string' && x) : (it.players || ev?.players || []).slice(0, 2);
  return [...new Set(two)];
};
const pairKey = c => (c.length === 2 ? [...c].sort().join('|') : null);
/** How much a candidate deserves a last place: higher airs first. `look` reads the season's airtime books. */
export function airtimeScore(e, events, look, today, prior = 0) {
  const c = centralOf(e, events);
  // (the systems' own order breaks near-ties: across systems it says little, so it weighs less than airtime)
  let s = -0.5 * prior;
  if (c.length) {
    // their share of the talk over the last two episodes, against the camp's average (1 = average)
    s -= 0.9 * (c.reduce((t, p) => t + Math.min(3, look.ratio(p)), 0) / c.length - 1);
    // ...and today: a third scene in a day costs more than the systems' own order can make up, a fourth twice that
    s -= 1.2 * c.reduce((t, p) => t + Math.max(0, (today.people[p] || 0) - 1), 0);
  }
  const k = pairKey(c);
  if (k) {
    const pi = look.pair(k);
    // a tie (an active showmance, a big friendship, a big rivalry: look.tie, 0..1) is a relationship the show follows,
    // not a pair it keeps cutting back to (the user, 2026-10-13: "a romance between two people shows only one scene per
    // episode?" - measured, stage 4 had cost 5% of the romance scenes): the recent-episodes cost goes, and a second
    // scene the same day costs half
    const tie = look.tie ? look.tie(k) : 0;
    if (today.pairs[k]) s -= 1.5 * (1 - 0.5 * tie);
    else if (!pi.seen) s += 0.6;
    else s -= 0.35 * Math.min(3, pi.recent) * (1 - tie);
  }
  return s;
}
// ── rhythm (the pacing plan, stage 5) ──
// A scene's tone, from what it is: 'H' the game (the vote, a scheme, a fight, a betrayal), 'L' a breather from it (a
// person's own thing, friends, a game, a joke, a flirt, two people finding what they share), 'N' neither. Measured on
// the stage-4 matrix: a quarter of the stretches with a tribal at the end ran five or more heavy scenes in a row, all
// of them the vote block (scramble, before-tribal), and a merge night could run twelve.
const LIGHT_KIND = /^(kit\.(bit|call|life|solo|deep)|camp\.game|story\.dayone|run\.|kindred\.(find|check)|chm\.(banter|comedy|bond|saved|comeback)|(long\.)?(friend\.(bond|goof|joke|sunrise|meal|celebrate|laugh|rally|teach|open|solidarity|struggle|lift|mentor|rideordie)|crowd\.(meal|chores|banter|project|dinner|won)|romance\.(flirt|honeymoon|moment|spark|rekindle))|follow\.romance|arc\.mentor\.)/;
const HEAVY_KIND = /vote|tribal|pitch|scheme|betray|blame|fight|clash|explode|threat|jealous|breakup|wronged|grievance|witness|turn\.|guarded|tense|paranoi|meltdown|bottom|eliminat|plot|lie|caught|scramble|spark|warn|adv\.|ally\.|cover|deal|recruit|dispute|nemesis|intimidat/;
export function toneOf(item, events) {
  const it = item || {}, ev = it.ref != null && !it.lines ? events?.[it.ref] : null;
  const kind = it.kind || (ev?.scene?.kind ? ev.scene.kind : ev?.type) || '';
  if (it.storyType === 'vote' || /^(story\.vote|vt2|vp|arc\.(warn|ally|spark|adv))/.test(kind)) return 'H';
  if (LIGHT_KIND.test(kind)) return 'L';
  if (HEAVY_KIND.test(`${kind} ${it.step || ''} ${it.storyType || ''}`)) return 'H';
  return 'N';
}

/**
 * Choose what airs from one stretch of the day's proposals. `entries` are { at, item, src, tier, extra? } in the
 * order they were proposed; `used` is what the day has aired already ({ scenes, turns, people, pairs }); `limit` this
 * stretch's share ({ target, ceiling }); `look` the season's airtime ({ ratio(name), pair(key) }, stage 4: without it
 * every tier keeps proposal order). Returns { keep, drop, log }, keep in proposal order.
 */
export function selectScenes(entries, events, used, limit, turns = DAY_BUDGET, look = null, rhythm = false) {
  const cost = e => spokenIn(e.item?.lines || events?.[e.item?.ref]?.lines);
  // A colour scene about somebody the last two episodes barely heard from (under 60% of the camp's average) competes
  // with the day's story, not with the rest of the colour: read on the stage-4 matrix, Lindsay spoke 7 lines in three
  // merge episodes while her own scenes (a life talk, a game) waited behind the vote and the storylines every evening
  const underheard = e => !!look && e.tier === 'colour' && !e.extra && (c => c.length > 0 && c.reduce((t, p) => t + look.ratio(p), 0) / c.length < 0.6)(centralOf(e, events));
  const rank = e => (underheard(e) ? TIER_RANK.story : (TIER_RANK[e.tier] ?? 2)) + (e.extra ? 1.5 : 0);
  const kept = new Set(), lineIds = new Set(), claims = new Set(), reasons = new Map();
  let scenes = used.scenes || 0, said = used.turns || 0;
  const today = { people: { ...(used.people || {}) }, pairs: { ...(used.pairs || {}) } };
  const claimOf = e => {
    const it = e.item || {};
    // one of a person's own bits a day, and one payoff a day between the same two people
    if (/^kit\./.test(it.kind || '') && it.kind !== 'kit.call') return `kit:${it.scene?.who?.a || it.players?.[0]}`;
    if (e.tier === 'due' && (it.players || []).length >= 2) return `pair:${[...it.players].slice(0, 2).sort().join('|')}`;
    return null;
  };
  const decide = e => {
    const it = e.item || {};
    const c = cost(e);
    const claim = claimOf(e);
    let why = null;
    if (e.tier !== 'must') {
      if (it.lineId && lineIds.has(it.lineId)) why = 'same-scene';
      else if (claim && claims.has(claim)) why = 'claimed';
      else if (scenes >= (e.tier === 'due' ? limit.ceiling : limit.target)) why = e.tier === 'due' ? 'deferred' : 'budget';
      else if (said + c > ((e.tier === 'colour' && !underheard(e)) || e.extra ? turns.turnTarget : turns.turnCeiling)) why = e.tier === 'due' ? 'deferred-dialogue' : 'dialogue-budget';
    }
    if (why) { reasons.set(e, why); return; }
    kept.add(e); reasons.set(e, e.tier === 'must' ? 'must' : e.extra ? 'room' : underheard(e) ? 'underheard' : e.tier);
    scenes++; said += c;
    if (it.lineId) lineIds.add(it.lineId);
    if (claim) claims.add(claim);
    const cc = centralOf(e, events);
    for (const p of cc) today.people[p] = (today.people[p] || 0) + 1;
    const k = pairKey(cc);
    if (k) today.pairs[k] = (today.pairs[k] || 0) + 1;
  };
  // tier by tier; inside the story and the colour, the best last-place candidate each time (the day changes as it fills)
  const groups = new Map();
  entries.forEach((e, i) => { const r = rank(e); if (!groups.has(r)) groups.set(r, []); groups.get(r).push({ e, i }); });
  for (const r of [...groups.keys()].sort((x, y) => x - y)) {
    const g = groups.get(r);
    if (!look || r < TIER_RANK.story) { for (const { e } of g) decide(e); continue; }
    const left = g.map(({ e, i }, pos) => ({ e, i, prior: g.length > 1 ? pos / (g.length - 1) : 0 }));
    while (left.length) {
      let best = 0, bs = -Infinity;
      left.forEach((x, k) => { const sc = airtimeScore(x.e, events, look, today, x.prior); if (sc > bs + 1e-9) { bs = sc; best = k; } });
      const [x] = left.splice(best, 1);
      decide(x.e);
    }
  }
  // A breather (stage 5): a stretch that is all game, five heavy scenes and not one light one, gets back the best light
  // scene the budget dropped, up to the ceiling (a real edit cuts away from the scramble for a moment, then comes back)
  if (rhythm) {
    const tones = entries.filter(e => kept.has(e)).map(e => toneOf(e.item, events));
    if (tones.filter(t => t === 'H').length >= 5 && !tones.includes('L') && scenes < limit.ceiling) {
      const light = entries.filter(e => !kept.has(e) && ['budget', 'dialogue-budget'].includes(reasons.get(e)) && toneOf(e.item, events) === 'L'
        && !(e.item?.lineId && lineIds.has(e.item.lineId)) && !(claimOf(e) && claims.has(claimOf(e))) && said + cost(e) <= turns.turnCeiling);
      const best = look ? light.map((e, i) => ({ e, s: airtimeScore(e, events, look, today, i / Math.max(1, light.length)) })).sort((x, y) => y.s - x.s)[0]?.e : light[0];
      if (best) { kept.add(best); reasons.set(best, 'breather'); scenes++; said += cost(best); }
    }
  }
  const keep = entries.filter(e => kept.has(e)), drop = entries.filter(e => !kept.has(e));
  // the log: what each proposal was, who, and why it aired or didn't (compact strings: it is saved with the episode)
  const log = entries.map(e => {
    const it = e.item || {}, ev = it.ref != null && !it.lines ? events?.[it.ref] : null;
    const kind = it.kind || ev?.scene?.kind || ev?.type || '?';
    const who = (it.players || ev?.players || []).slice(0, 4).join(',');
    return `${kept.has(e) ? '+' : '-'}${reasons.get(e)}|${e.src || '?'}|${e.tier || '?'}${e.extra ? '+' : ''}|${kind}|${who}|${cost(e)}`;
  });
  return { keep, drop, log, scenes, turns: said, people: today.people, pairs: today.pairs };
}

// The partner in a colour scene (stage 4, the proposal side): somebody close to a, and among the people nearly as close
// as the closest (within two points), the one the show has heard least from lately and seen least with a. The selection
// alone could not fix who is heard: measured on the stage-4 matrix, the quiet people's dropped scenes were few, because
// every builder cast a's closest friend, so the same best-friend pairs were proposed day after day.
// `today` counts the scenes each person is already cast in today: the least-heard person is nobody's partner three
// times in one day (read on the stage-4 matrix: Owen was Millie's, Bowie's and Bruno's partner on the same day).
function foilFor(a, pool, look, today = {}, band = 2) {
  const byBond = [...pool].filter(x => x && x !== a).sort((x, y) => getBond(a, y) - getBond(a, x) || x.localeCompare(y));
  if (!byBond.length || !look) return byBond[0] || null;
  const top = getBond(a, byBond[0]);
  const near = byBond.filter(x => getBond(a, x) >= top - band);
  // (the person a is tied to, a showmance, a best friend, a sworn enemy, stays the partner: look.tie)
  const worn = x => { const k = [a, x].sort().join('|'), pi = look.pair(k), tie = look.tie ? look.tie(k) : 0, mate = look.couple?.(k) ? 1 : 0;
    return Math.min(3, look.ratio(x)) + 0.5 * Math.min(3, pi.recent) * (1 - tie) - (pi.seen ? 0 : 0.5) + 0.6 * (today[x] || 0) - 1.2 * mate; };
  return near.sort((x, y) => worn(x) - worn(y) || getBond(a, y) - getBond(a, x) || x.localeCompare(y))[0];
}

// The season's airtime books (stage 4), written once a camp's day is final: each person's spoken and confessional turns
// over the last three episodes (gs.tdStory.airtime: [{ ep, people }]), and the episodes each central pair had a scene
// (gs.tdStory.pairAir: { 'A|B': [ep, ...] }, the last six kept; a pair seen once stays in the book).
function recordAirtime(ep, camp, out) {
  const S = (gs.tdStory ||= {});
  const book = (S.airtime ||= []);
  let row = book.find(r => r.ep === ep.num);
  if (!row) { row = { ep: ep.num, people: {} }; book.push(row); }
  const pairs = (S.pairAir ||= {});
  for (const phase of ['pre', 'post']) {
    const events = eventsOf(ep, camp, phase);
    for (const it of out[phase] || []) {
      const ev = it?.lines ? it : events[it?.ref];
      for (const l of ev?.lines || []) if (l?.by && (l.kind === 'say' || l.kind === 'conf')) row.people[l.by] = (row.people[l.by] || 0) + 1;
      const k = pairKey(centralOf({ item: it }, events));
      if (k) { const eps = (pairs[k] ||= []); if (eps[eps.length - 1] !== ep.num) eps.push(ep.num); if (eps.length > 6) eps.splice(0, eps.length - 6); }
    }
  }
  S.airtime = book.filter(r => r.ep > ep.num - 3).sort((x, y) => x.ep - y.ep);
}
// What selectScenes reads from those books, for one camp on this episode: a person's turns over the last two episodes
// against the average of this camp's people (1 when nobody has history yet), and a pair's record before today.
function airtimeLook(ep, members) {
  const S = gs.tdStory || {};
  const rows = (S.airtime || []).filter(r => r.ep < ep.num && r.ep >= ep.num - 2);
  const turnsOf = p => rows.reduce((t, r) => t + (r.people[p] || 0), 0);
  const mean = members.length ? members.reduce((t, m) => t + turnsOf(m), 0) / members.length : 0;
  const pairs = S.pairAir || {};
  // an active showmance (romance on, not broken up)
  const couple = k => { const [x, y] = k.split('|');
    return seasonConfig?.romance !== 'disabled' && (gs.showmances || []).some(sh => sh.phase !== 'broken-up' && (sh.players || []).includes(x) && (sh.players || []).includes(y)); };
  return {
    ratio: p => (rows.length && mean > 0 ? (turnsOf(p) + 2) / (mean + 2) : 1),
    pair: k => { const eps = (pairs[k] || []).filter(x => x < ep.num); return { seen: eps.length > 0, recent: eps.filter(x => x >= ep.num - 2).length }; },
    // how tied two people are, 0..1: an active showmance is 1; otherwise the bond either way, from nothing at 3 to all
    // of it at 7 (measured 2026-10-13: about 15 of a season's 120 pairs reach 5 either way)
    tie: k => (couple(k) ? 1 : (([x, y]) => Math.max(0, Math.min(1, (Math.abs(getBond(x, y)) - 3) / 4)))(k.split('|'))),
    couple: k => couple(k),
  };
}

// ── a breather inside a long heavy run (stage 5) ──
const THREAD_START = new Set(['plan', 'other', 'target', 'decoy']);
const MOVABLE = new Set(['kit', 'fun', 'comedy', 'kindred', 'friendship', 'showmance', 'arc', 'challenge']);
export function breathe(items, events, winOf, chalTalk = () => false) {
  const out = [...items];
  for (let pass = 0; pass < 2; pass++) {
    const tone = out.map(it => toneOf(it, events));
    let best = 0, start = -1;
    for (let i = 0, run = 0; i < out.length; i++) { run = tone[i] === 'H' ? run + 1 : 0; if (run > best) { best = run; start = i - run + 1; } }
    if (best < 5) break;
    const end = start + best;   // the run is out[start .. end-1]
    // where it can open: at a new thread (or where the window changes), not in the first two or last two scenes
    const opens = [];
    for (let k = start + 2; k <= end - 2; k++) {
      const it = out[k];
      const newThread = it.storyType === 'vote' ? THREAD_START.has(it.step) : true;
      if (newThread || winOf(out[k]) !== winOf(out[k - 1])) opens.push(k);
    }
    if (!opens.length) break;
    const mid = start + best / 2;
    opens.sort((x, y) => Math.abs(x - mid) - Math.abs(y - mid));
    // what can move: a light written scene from earlier in the stretch, not the challenge talk, not part of the vote,
    // from a story kind that does not depend on its hour (a kit, a game, friends, a flirt); the nearest one first
    let moved = false;
    for (const k of opens) {
      const win = winOf(out[k]);
      const busy = new Set(out.filter(x => winOf(x) === win).map(x => x.scene?.spot?.id).filter(Boolean));
      for (let j = start - 1; j >= 0 && !moved; j--) {
        const it = out[j];
        if (tone[j] !== 'L' || !it?.story || !it.scene?.spot?.id || chalTalk(it) || !MOVABLE.has(it.storyType) || it.storyType === 'vote') continue;
        if (/^(story\.(firstday|morning|chal)|long\.crowd\.(won|lost))/.test(it.kind || '')) continue;
        if (busy.has(it.scene.spot.id)) continue;
        const moving = { ...it, scene: { ...it.scene, spot: { ...it.scene.spot, window: win } } };
        out.splice(j, 1);
        out.splice(k - 1, 0, moving);   // (k shifted down by one when j < k)
        moved = true;
      }
      if (moved) break;
    }
    if (!moved) break;
  }
  return out;
}

// ── scenes that run into each other ──
// Two scenes in a row that share somebody happen as one: the second plays where the first was,
// whoever isn't in it walks off, whoever is new walks up, and when the first was a row, the
// person who just arrived asks about it (handoff.tense). Nothing changes about what happens, only
// that it happens in one place, one after the other. Never into a private talk from a public spot
// (a plan isn't made at the mess hall), never from or into a confessional, three scenes at most.
const TENSE = /^(long\.)?(drama|crowd\.(lost|clash)|blame|caught|story\.chal\.lost|thr\.(wronged|rivals|grievance|misled)|chm\.(clash|sabotage|betray|taunt)|nbl)/;
const STAGING = /\b(at|on|in|by|behind|down to|over to|away from|out to|near) (the|a) |pulls .{1,30} (aside|away)|\b(finds|catches up|waits until|walks? (over|up|down|in))\b/i;
function chainScenes(ep, camp, phase, items, next) {
  const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  // who is there when the scene opens: a scene that moves or that somebody walks into partway (a line marked goes or
  // comes, td/story/write.js) counts only its opening, so the friend b is about to warn isn't standing there for it
  const opening = it => { const k = (it.lines || []).findIndex((l, i) => i > 0 && l.kind === 'beat' && (l.goes || (l.arrive?.length && !l.auto))); return k > 0 ? it.lines.slice(0, k) : (it.lines || []); };
  const castOf = it => {
    const head = opening(it), all = it.lines || [];
    const later = all.slice(head.length).filter(l => l.by).map(l => l.by).filter(n => !head.some(l => l.by === n));
    const present = n => all.some(l => l.by === n && l.kind !== 'conf') || head.some(l => l.kind === 'beat' && (l.text || '').includes(n));
    return [...new Set([...Object.values(it.scene?.who || {}).filter(n => n && !later.includes(n) && present(n)), ...head.filter(l => l.by && l.kind !== 'conf').map(l => l.by)])]
      .filter(n => n !== (seasonConfig?.host || 'Chris'));
  };
  const talks = it => it?.story && Array.isArray(it.lines) && it.lines.some(l => l.kind === 'say') && it.scene?.spot?.id && it.scene.spot.id !== 'confessional';
  const list = n => n.length <= 1 ? n.join('') : `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`;
  let run = 0;
  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1], cur = items[i];
    if (!talks(prev) || !talks(cur) || run >= 2) { run = 0; continue; }
    const pc = castOf(prev), cc = castOf(cur);
    const stay = cc.filter(x => pc.includes(x)), come = cc.filter(x => !pc.includes(x)), go = pc.filter(x => !cc.includes(x));
    if (!stay.length || come.length > 3 || cc.length > 6) { run = 0; continue; }
    const pk = kindOf(venueNow, prev.scene.spot.id), ck = kindOf(venueNow, cur.scene.spot.id);
    // the same stretch of the day, and a place the next talk belongs in: a row about a bunk stays in the
    // cabin, a sunrise doesn't follow an afternoon
    if ((prev.scene.spot.window || '') !== (cur.scene.spot.window || '')) { run = 0; continue; }
    if (prev.scene.spot.id !== cur.scene.spot.id && (pk !== ck || ck === 'secret' || ck === 'sleep')) { run = 0; continue; }
    // a scene that opens by setting itself somewhere keeps its own place (and its set-up line)
    // (an automatic set-up line, setup.js, gives way to the arrival instead)
    if (cur.lines[0]?.kind === 'beat' && !cur.lines[0].auto) { run = 0; continue; }
    // the hand-off: who leaves, who arrives
    const h = hash(`${ep.num}${camp}${phase}${i}`);
    const beats = [];
    const pl = go.length > 1;
    const LEAVE = [`${list(go)} ${pl ? 'head' : 'heads'} off.`, `${list(go)} ${pl ? 'get up and leave' : 'gets up and leaves'} them to it.`, `${list(go)} ${pl ? 'wander' : 'wanders'} away.`,
      `${list(go)} ${pl ? 'find' : 'finds'} something else to do.`, `${list(go)} ${pl ? 'head' : 'heads'} off.`, `${list(go)} ${pl ? 'leave' : 'leaves'} without another word.`];
    if (go.length) beats.push(LEAVE[h % LEAVE.length]);
    if (come.length) beats.push(come.length === 1
      ? [`${come[0]} comes over.`, `${come[0]} walks up.`, `${come[0]} sits down next to ${stay[0]}.`, `${come[0]} drifts over, pretending not to be curious.`, `${come[0]} wanders over to see what's going on.`, `${come[0]} drops down beside ${stay[0]}.`][(h >>> 3) % 6]
      : [`${come[0]} comes over with ${list(come.slice(1))}.`, `${list(come)} walk up together.`][(h >>> 3) % 2]);
    if (!beats.length) { run = 0; continue; }
    const lines = cur.lines[0]?.auto ? cur.lines.slice(1) : [...cur.lines];
    const lead = [{ kind: 'beat', text: beats.join(' ').trim(), arrive: come }];
    // walking in on a row: the newcomer asks, the one who stayed answers
    if (come.length && go.length && TENSE.test(prev.kind || '')) {
      const who = { a: come[0], b: stay[0], c: go[0] };
      const w = writeStory('handoff', 'tense', who, {}, { ...factsFor({ who, data: {} }, { ep: ep.num, phase }), third: true }, { ep: ep.num, camp, phase, n: next(), place: 'aside', unique: 'soft' });
      if (w) lead.push(...w.lines);
    }
    items[i] = { ...cur, lines: [...lead, ...lines], text: [...lead, ...lines].map(l => l.text).join(' '), chained: true,
      players: [...new Set([...(cur.players || []), ...come])],
      scene: { ...cur.scene, spot: { ...cur.scene.spot, id: prev.scene.spot.id, label: prev.scene.spot.label, window: prev.scene.spot.window ?? cur.scene.spot.window } } };
    run++;
  }
  return items;
}

export function airTdEpisode(ep) {
  if (!ep || ep.campStory || !ep.campEvents || !Object.keys(ep.campEvents).length) return;
  if (gs.bb || ep.isFinale) return;
  venueNow = VENUE_WORDS[ep.campAccess?.setting] ? ep.campAccess.setting : 'hosted-camp';
  setKitVenue(venueNow);
  const seasonAired = ((gs.tdStory ||= {}).aired ||= {});
  const story = {};
  const continuity = (gs.tdStory.continuity ||= {});
  const dirLog = {};
  let n = 0;
  for (const camp of Object.keys(ep.campEvents)) {
    const members = membersOf(ep, camp);
    const tribalTonight = !!(ep.tribalPlayers || []).some(p => members.includes(p)) && (ep.isMerge || gs.isMerged || ep.tribalTribe === camp || ep.loser?.name === camp);
    // ...which a team only knows once it has lost the challenge: before it, a line may not say
    // "tonight" unless everybody votes (the merge)
    const knowsTribal = phase => (phase === 'post' || ep.isMerge || gs.isMerged ? tribalTonight : false);
    const spoke = new Set();
    const out = { pre: [], post: [] };
    // the day's budget, spent across its two stretches, and the director's reason for every proposal (selectScenes)
    const dayUsed = { scenes: 0, turns: 0, people: {}, pairs: {} };
    // who the last episodes heard from, and which pairs they kept cutting back to (stage 4: who gets the last places)
    // (globalThis.__tdNoAirtime: the pacing audit's control arm, stage 4 off; nothing in the app sets it)
    const look = globalThis.__tdNoAirtime ? null : airtimeLook(ep, members);
    const dayLog = { pre: [], post: [] };
    const filedMoments = new Map();
    const talk = tribalTonight ? votePlan(ep, camp, members) : null;
    // the episode's memory for this camp: what the vote story has shown so far (arcBeats fills it)
    if (talk) talk.em = { spark: null, warned: [], aired: [], causes: [] };
    if (talk && (seasonConfig?.tdEdit || 'full') !== 'off') talk.cause = causeOf(ep, camp, talk);
    if (talk?.cause?.length) talk.em.causes = talk.cause;
    // ...or an old wound between them (threads.js): the plan's leader has been carrying it since
    if (talk && !talk.cause?.length) {
      const old = ((gs.tdStory ||= {}).threads || []).find(t => !t.done && t.ep < ep.num && t.a === talk.leader && t.b === talk.boot && threadKnown(t, ep.num) && ['wronged', 'rivals', 'grievance'].includes(t.kind))
        || ((gs.tdStory ||= {}).threads || []).find(t => !t.done && t.ep < ep.num && t.kind === 'rivals' && t.a === talk.boot && t.b === talk.leader);
      if (old) talk.em.causes = [{ by: talk.leader, of: talk.boot, kind: 'history', aired: true,
        moment: old.kind === 'grievance' ? 'the night {target} wrote my name' : old.kind === 'wronged' ? `what {target} did to me at ${old.chal}` : `everything that happened at ${old.chal}` }];
    }
    if (talk) for (const ev of eventsOf(ep, camp, 'post')) if (ev && ev.aired == null && /^votePitch/.test(ev.type || '') && talk.covers.has(ev.players?.[0])) ev.aired = 'covered';
    // A First Impressions swap is told on the twist's own screen (td/story/twist.js: the vote, the walk over,
    // the new team's welcome). The camp's copy of it had no scene, got a generic aside bolted on, and aired as
    // "I saw what you did" / "Don't make it a thing" with nothing seen (the user, 2026-10-10: "she did what
    // exactly?"): it stays off the camp feed.
    for (const ph of ['pre', 'post']) for (const ev of eventsOf(ep, camp, ph)) if (ev && ev.aired == null && ev.type === 'firstImpressionsSwap') ev.aired = 'covered';
    for (const phase of ['pre', 'post']) {
      const events = eventsOf(ep, camp, phase);
      // an engine moment that casts somebody already gone (as one of its parts, or speaking) never airs: talk ABOUT the
      // one who left is fine, a scene where they did something today is not (the user, 2026-10-14: "they talk about
      // finn but finn isnt suppose to be here", Finn the critic Manu "went and found")
      { const gone = goneBefore(ep);
        if (gone.size) for (const ev of events) if (ev && ev.aired == null
          && [...Object.values(ev.scene?.who || {}), ...speaksIn(ev)].some(n => typeof n === 'string' && gone.has(n))) ev.aired = 'gone'; }
      // ...and a friendship cooling never airs on the day the same two shook on a deal or an alliance (read 2026-10-14:
      // Jasmine "needs a little distance" from Anne Maria in the afternoon, made a final two with her that morning and an
      // alliance that night)
      { const pk = (x, y) => [x, y].sort().join('|');
        const sealed = new Set(['pre', 'post'].flatMap(ph => eventsOf(ep, camp, ph)).filter(ev => /^(alliance\.form|deal\.)/.test(ev?.scene?.kind || ''))
          .map(ev => pk(ev.scene.who?.a, ev.scene.who?.b)));
        for (const ev of events) if (ev && ev.aired == null && /^friend\.drift/.test(ev.scene?.kind || '') && sealed.has(pk(ev.scene.who?.a, ev.scene.who?.b))) ev.aired = 'covered'; }
      // ...and somebody who led last night's vote does not "steal the credit" for it from somebody who only went along
      // (read 2026-10-14: Natalia drew up the Lynda plan, said "I made it happen" at Tribal, and the next morning was
      // "stealing" it from Alessio, who flipped to join her)
      if (phase === 'pre') { const prev = (gs.episodeHistory || []).find(h => h.num === ep.num - 1);
        const led = new Set((prev?.tribalStory?.booth || []).filter(b => b.role === 'lead').map(b => b.voter));
        for (const ev of ['pre', 'post'].flatMap(ph => eventsOf(ep, camp, ph))) if (ev && ev.aired == null && ev.scene?.kind === 'credit.steal' && led.has(ev.scene.who?.a)) ev.aired = 'covered'; }
      // ...and two people do not make up on the day one of them asks a third to help vote the other out (read 2026-10-14:
      // Isabel decided her problem with Natalia "was Lynda's doing", then offered Anastasia the end to get rid of Natalia)
      if (phase === 'pre') { const pk = (x, y) => [x, y].sort().join('|'), day = ['pre', 'post'].flatMap(ph => eventsOf(ep, camp, ph)).filter(Boolean);
        const against = new Set(day.filter(ev => ev.scene?.kind === 'pitch.turn' && ev.scene.data?.friend).map(ev => pk(ev.scene.who?.a, ev.scene.data.friend)));
        for (const ev of day) if (ev.aired == null && /^drama\.thaw/.test(ev.scene?.kind || '') && against.has(pk(ev.scene.who?.a, ev.scene.who?.b))) ev.aired = 'covered'; }
      // ...and the camp has one party and one blow-up a day, and no party on the way to a vote (read 2026-10-14: two
      // celebrations at the carousel, the second "We are CELEBRATING!" just before Tribal; two blow-ups back to back) ...and no
      // pep talk after a win ("Everybody say one good thing about today" the day they won)
      if (phase === 'pre') { const seenG = new Set(), ch0 = challengeOf(ep, camp), lostToday = !!ch0?.lost, wonToday = !!ch0?.won, post = eventsOf(ep, camp, 'post');
        for (const ev of ['pre', 'post'].flatMap(ph => eventsOf(ep, camp, ph))) {
          const g = /^(friend\.celebrate|friend\.rally|drama\.bomb)/.exec(ev?.scene?.kind || '')?.[1];
          if (!g || ev.aired != null) continue;
          if (seenG.has(g) || (g === 'friend.celebrate' && lostToday && post.includes(ev)) || (g === 'friend.rally' && wonToday && post.includes(ev))) { ev.aired = 'covered'; continue; }
          seenG.add(g);
        } }
      // ...and one person sits with what the one who left forgot: two mourners in a row aired the same scene, "folding a
      // shirt he left behind", word for word (read 2026-10-14)
      { let seen = false;
        for (const ev of events) if (ev && ev.aired == null && /^fallout\.mourn/.test(ev.scene?.kind || '')) { if (seen) ev.aired = 'covered'; seen = true; } }
      // ...and two people who fought today do not also share a warm moment today (read 2026-10-14: Mike and Anne Maria
      // had a grudge over the water, then "the only thing getting me through is Mike", then split the last bite "like a
      // vow", then Mike voted her out for "what she said to me"): the warm one stays off the air. Making up is its own
      // story (sorry, truce, thaw) and airs. Decided once, on the morning, over the whole day.
      if (phase === 'pre') { const pk = (x, y) => [x, y].sort().join('|');
        const day = ['pre', 'post'].flatMap(ph => eventsOf(ep, camp, ph)).filter(Boolean);
        const HOT = /^(drama\.|blame|clash|cross\.rival|witness\.after|fallout\.found|deal\.(broken|double|end)|caught)/;
        const WARM = /^friend\.(struggle|meal|bond|joke|secret|thanks|lift|comfort|teach|celebrate|open|rideordie|solidarity|mentor)/;
        const fought = new Set(day.filter(ev => HOT.test(ev.scene?.kind || '') && ev.scene?.who?.a && ev.scene?.who?.b).map(ev => pk(ev.scene.who.a, ev.scene.who.b)));
        for (const ev of day) if (ev.aired == null && WARM.test(ev.scene?.kind || '') && ev.scene?.who?.a && ev.scene?.who?.b && fought.has(pk(ev.scene.who.a, ev.scene.who.b))) ev.aired = 'covered'; }
      // ...and nobody makes up with somebody before they have it out with them the same day (read 2026-10-14: Diego gave
      // Anastasia an apology bracelet, then "I know you didn't vote with us")
      if (phase === 'pre') { const pk = (x, y) => [x, y].sort().join('|');
        const day = ['pre', 'post'].flatMap(ph => eventsOf(ep, camp, ph)).filter(Boolean);
        const HOT = /^(drama\.(fight|explode|bomb|clash|dispute)|blame|clash|caught|witness\.after|deal\.(broken|double|end))/;
        day.forEach((ev, i) => { const w = ev.scene?.who || {};
          if (ev.aired != null || !/^drama\.(sorry|thaw)|truce/.test(ev.scene?.kind || '') || !w.a || !w.b) return;
          if (day.slice(i + 1).some(x => HOT.test(x.scene?.kind || '') && pk(x.scene.who?.a, x.scene.who?.b) === pk(w.a, w.b))) ev.aired = 'covered'; }); }
      // ...and the same moment between the same two people airs once a day (read 2026-10-14: Gwen said Izzy should go
      // next and Geoff told her off in the morning, then all of it again in the afternoon)
      if (phase === 'pre') { const seenK = new Set();
        for (const ev of ['pre', 'post'].flatMap(ph => eventsOf(ep, camp, ph))) {
          const k = ev?.scene?.kind, w = ev?.scene?.who || {};
          if (!ev || ev.aired != null || !k || !w.a || !w.b || /^(pitch|couple|vote|booth|tribal)/.test(k)) continue;
          const key = `${k.split('.').slice(0, 2).join('.')}|${[w.a, w.b].sort().join('|')}`;
          if (seenK.has(key)) { ev.aired = 'covered'; continue; }
          seenK.add(key);
        } }
      // ...and one romance a person a day: a flirt, a spark or a moment with one person, not three (read 2026-10-14: Mike
      // kissed Ella in secret, flirted with Sky and had a moment with Jasmine, all after one challenge). Decided once, on
      // the morning, over the whole day in its order; a couple's own scenes and an affair's steps are the story and stay
      if (phase === 'pre') { const had = new Map();
        for (const ev of ['pre', 'post'].flatMap(ph => eventsOf(ep, camp, ph))) {
          const k = ev?.scene?.kind || '';
          if (!ev || ev.aired != null || !/^romance\.(spark|flirt|moment|first)/.test(k)) continue;
          const pair = [ev.scene.who?.a, ev.scene.who?.b].filter(Boolean);
          if (pair.some(n => had.has(n) && had.get(n) !== pair.find(x => x !== n))) { ev.aired = 'covered'; continue; }
          for (const n of pair) had.set(n, pair.find(x => x !== n));
        } }
      // file every moment of the phase into its storyline
      const filed = [];
      events.forEach((ev, i) => {
        if (!ev || ev.aired != null) return;
        const c = classify(ev);
        if (!c) return;
        const { line, step } = file(c, { ep: ep.num, phase, camp, order: i });
        filed.push({ ev, i, line, step });
        filedMoments.set(ev, { type: line.type, ...step });
      });
      const list = [];
      // every system proposes its scenes onto the day's list, tagged with where it came from and how much it matters
      // (selectScenes: must, due, story, colour); what airs is decided when the stretch of the day is complete, and only
      // then does what a scene changes in the story happen (commit.js)
      const offer = (src, tier, ...es) => { for (const e of es) if (e?.item) { e.src = src; e.tier = tier; e.extra = !!e.extra; list.push(e); } return list.length; };
      // an engine moment a proposal airs is claimed now (so no other system proposes it today) and given back if the
      // proposal is dropped; what airing it counts for the season is counted only if it airs
      // how many of today's scenes (the morning's aired ones, this stretch's proposals so far) each person is cast in
      const castToday = () => {
        const c = {}, preEvs = eventsOf(ep, camp, 'pre');
        const add = (it, evs) => { for (const p of new Set(it?.players || (it?.ref != null ? evs[it.ref]?.players : null) || [])) c[p] = (c[p] || 0) + 1; };
        if (phase === 'post') for (const it of out.pre || []) add(it, preEvs);
        for (const x of list) add(x.item, events);
        return c;
      };
      const claimEv = (item, ev, then = null) => { const was = ev.aired; ev.aired = true; onDiscard(item, () => { ev.aired = was; }); return then ? onCommit(item, then) : item; };
      // the spots taken in each stretch of the day, so two talks are never staged on top of each other
      const taken = {};
      const avoidIn = win => (taken[win || 'any'] ||= new Set());
      ctxAvoid = avoidIn;
      // the opener
      const swapped = (ep.twists || []).some(t => /swap|shuffle|dissolve|new-tribes|mutiny/.test(t.type || '')) && !(ep.isMerge || gs.isMerged);
      const dayOne = ep.num === 1;
      const opener = phase === 'pre' ? (dayOne ? firstDay(ep, camp, members, n++) : swapped ? firstDay(ep, camp, members, n++, 'swap') : morningAfter(ep, camp, members, n++))
        : afterChallenge(ep, camp, members, n++);
      if (opener) offer('opener', 'must', { at: -1, item: opener });
      // back from the Exile Duel: the winner walks into camp first thing
      if (phase === 'pre') { const dr = duelReturn(ep, camp, members, n++); if (dr) offer('duel', 'must', { at: -0.5, item: dr }); }
      // the auction's fallout, early in the evening
      if (phase === 'post') auctionTalk(ep, camp, members, () => n++).forEach((it, k) => offer('auction', 'must', { at: 0.2 + k * 0.01, item: it }));
      // day one: by the afternoon two of them have hit it off, and by the evening two of them have not
      if (dayOne) { const fp = firstPair(ep, camp, members, n++, phase === 'pre' ? 'clicked' : 'clashed'); if (fp) offer('first-pair', 'must', { at: phase === 'pre' ? 0.5 : 1e5, item: fp }); }
      // the storyline steps worth a scene
      const merged = ep.isMerge || gs.isMerged;
      // the vote story's own beats first, so the plan scenes can call back to them
      const editOn = (seasonConfig?.tdEdit || 'full') !== 'off';
      if (editOn && talk) offer('vote-beat', 'must', ...arcBeats(ep, camp, members, phase, talk, () => n++, list, [], 'vote'));
      // the challenge, brought back to camp (chalmoments.js): its biggest moments between people here
      if (editOn && phase === 'post') {
        const W = { betray: 5, sabotage: 5, saved: 4, spark: 4, clash: 4, quit: 3, taunt: 3, comeback: 3, hurt: 3, pact: 3, panic: 2, wipeout: 2, comedy: 2, bond: 2 };
        const tw = (ep.twists || []).find(x => TWIST_CATALOG.some(c => c.id === (x.catalogId || x.type) && c.chalStyle));
        const chal = (tw && TWIST_CATALOG.find(c => c.id === (tw.catalogId || tw.type))?.name) || ep.challengeLabel || 'the challenge';
        const seenPair = new Set();
        // what happened between tonight's plan leader and its target at the challenge comes first: it
        // is where the vote starts (the user: "the twist already has the events, you just don't use them")
        const planPair = m => talk && m.players.length >= 2 && m.players.includes(talk.leader) && m.players.includes(talk.boot);
        const picks = chalMoments(ep).filter(m => m.players.every(p => members.includes(p)))
          .sort((x, y) => (W[y.kind] + (y.players.length >= 2 ? 1 : 0) + (planPair(y) ? 10 : 0)) - (W[x.kind] + (x.players.length >= 2 ? 1 : 0) + (planPair(x) ? 10 : 0)));
        let took = 0, turnHere = null;
        // a relationship that turned on something done at this challenge (turns.js): an aired setup between these two,
        // and what one of them did to the other today. It replaces the plain moment between the same pair.
        {
          // (not a pair the morning already gave a chapter to: a follow-up, an arc, a turn)
          const busyPairs = new Set((out.pre || []).filter(x => ['arc', 'challenge'].includes(x?.storyType) && (x.players || []).length >= 2).map(x => [...x.players].slice(0, 2).sort().join('|')));
          turnHere = editOn ? turnScene(ep, camp, members, chal, () => n++, who => factsFor({ who, data: {} }, { ep: ep.num, phase, tribal: knowsTribal(phase) }), 'post', busyPairs,
            (p, o, w, d, f, c) => writeStory(p, o, w, d, f, { ...c, draft: true, avoid: ctxAvoid('afternoon') })) : null;
          if (turnHere) { offer('turn', 'due', turnHere); seenPair.add([...turnHere.item.players].sort().join('|')); took++; }
        }
        for (const m of picks) {
          if (took >= (members.length >= 8 ? 3 : 2)) break;
          const a = m.players[0];
          const b = m.players[1] || foilFor(a, members, editOn ? look : null, castToday());
          if (!b) continue;
          // a pact or a rescue between two people doesn't air the night one writes the other's name: read in a
          // played season, Duncan renewed 'to the end' with Seraphine, then ran the vote on her, unremarked
          const writes = (x, y) => (ep.votingLog || []).some(v => v.voter === x && v.voted === y);
          if (['pact', 'saved', 'bond', 'spark', 'comeback'].includes(m.kind) && (writes(a, b) || writes(b, a))) continue;
          const key = [a, b].sort().join('|');
          if (seenPair.has(key) || seenPair.has(m.kind + a)) continue;
          // one of each kind a camp: read in a played season, three 'let's be clear what we agreed' pacts in
          // one team's evening (and three more at the other camp)
          if (seenPair.has('kind:' + m.kind)) continue;
          const who = { a, b };
          // a physical line (a hand held over a drop, a bandaged ankle) only after a physical challenge
          const style = (tw && TWIST_CATALOG.find(c => c.id === (tw.catalogId || tw.type))?.chalStyle) || 'physical';
          const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase, tribal: knowsTribal(phase) }), pair: true, two: m.players.length >= 2,
            // did this camp win the challenge it is talking about? (a team that lost goes to tribal tonight; the user,
            // 2026-10-12: Spencer's "We won, and I should be happy" after his team lost). After the merge there is no team
            teamWon: !(ep.isMerge || gs.isMerged) && !tribalTonight, bLikesA: getBond(b, a) >= 2, bHatesA: getBond(b, a) <= -2,
            physical: ['physical', 'endurance', 'adventure', 'hunt', 'chaos'].includes(style) };
          const w = writeStory(`chm.${m.kind}`, 'any', who, { chal }, facts, { ep: ep.num, camp, phase, n: n++, place: 'aside', draft: true, avoid: ctxAvoid('afternoon'),
            // a moment is colour, not a reason: once its scenes have aired it skips rather than repeats (read: Alejandro's
            // sabotage as the same scene three episodes running). Only the one tonight's plan calls back to may come back.
            unique: planPair(m) ? 'soft' : true });
          if (!w) continue;
          // the same scene never airs twice in one evening, between two different pairs (read: two identical
          // 'Did you have to celebrate quite that loudly?' exchanges back to back)
          if (list.some(x => x.item?.lineId === w.lineId)) continue;
          seenPair.add(key); seenPair.add(m.kind + a); seenPair.add('kind:' + m.kind); took++;
          // tonight's plan calls back to it (planTalk's recall): what the target did, or the fight between them
          if (planPair(m) && talk.em) {
            const did = m.players[0];
            const CK = { sabotage: 'caught', betray: 'caught', clash: 'fight', taunt: 'fight', quit: 'blame', panic: 'blame', wipeout: 'blame' }[m.kind];
            const ok = CK && (CK !== 'caught' || did === talk.boot) && (CK !== 'blame' || did === talk.boot);
            const MOM = { caught: `what {target} pulled at ${chal}`, fight: `that fight at ${chal}`, blame: `the way {target} let us down at ${chal}` };
            if (ok && !(talk.em.causes || []).some(c => c.by === talk.leader && c.of === talk.boot))
              (talk.em.causes ||= []).push({ by: talk.leader, of: talk.boot, kind: CK, moment: MOM[CK], phase: 'post', aired: true, chm: true });
          }
          offer('challenge', 'story', { at: 0.25 + took * 0.01, item: { story: true, kind: `chm.${m.kind}`, storyType: 'challenge', step: m.kind, players: [a, b], lines: w.lines, text: w.text, lineId: w.lineId,
            scene: { kind: 'chm', who, data: { chal, two: m.players.length >= 2 }, spot: w.spot ? { ...w.spot, window: 'afternoon' } : null }, badgeText: m.badge, badgeClass: '', why: [`At ${chal}: ${m.badge} (${m.players.join(', ')}).`] } });
        }
        // ...and when the challenge left room, two friends replay it: the jokes, not the result (lines/n-banter.js)
        // (a turn is the day's real conversation about the challenge: the light replay steps aside)
        if (took < 2 && !turnHere) {
          const inChm = new Set(list.filter(x => /^chm\./.test(x.item?.kind || '')).flatMap(x => x.item.players || []));
          const fr = [];
          for (const x of members) for (const y of members) if (x < y && !inChm.has(x) && !inChm.has(y) && getBond(x, y) >= 2) fr.push([x, y, getBond(x, y)]);
          // (the closest pairs, and among them the pairing the show has seen least: stage 4)
          const wornPair = ([x, y]) => { if (!look) return 0; const pi = look.pair([x, y].sort().join('|')); return 0.5 * (Math.min(3, look.ratio(x)) + Math.min(3, look.ratio(y))) + 0.5 * Math.min(3, pi.recent) - (pi.seen ? 0 : 0.5); };
          fr.sort((p, q) => (q[2] - wornPair(q)) - (p[2] - wornPair(p)) || p[0].localeCompare(q[0]));
          for (const [x, y] of fr.slice(0, 4)) {
            const who = { a: x, b: y };
            const w = writeStory('chm.banter', 'any', who, { chal }, factsFor({ who, data: {} }, { ep: ep.num, phase }), { ep: ep.num, camp, phase, n: n++, place: 'aside', draft: true, avoid: ctxAvoid('afternoon'), unique: true });
            if (!w) continue;
            offer('banter', 'colour', { at: 0.27, item: { story: true, kind: 'chm.banter', storyType: 'challenge', step: 'banter', players: [x, y], lines: w.lines, text: w.text, lineId: w.lineId,
              scene: { kind: 'chm', who, data: { chal }, spot: w.spot ? { ...w.spot, window: 'afternoon' } : null }, badgeText: '', badgeClass: '', why: [`${x} and ${y} replay ${chal}.`], fx: [[x, y, 0.5]] } });
            break;
          }
        }
      }
      // a thread carried from an earlier episode (threads.js): one scene when one is due
      if (editOn && liveEp(ep) && phase === 'pre' && ep.num > 1) {
        const td = threadDue(ep, members);
        const writesT = (x, y) => (ep.votingLog || []).some(v => v.voter === x && v.voted === y);
        // ...and a feud thread doesn't air between two people who are friends now (read: Duncan and Felipe split
        // the last bite, 'basically a vow', then fought over a bowl at breakfast in the next scene)
        const madeUp = td && td.t.kind === 'rivals' && getBond(td.t.a, td.t.b) >= 2;
        if (td && !madeUp && !(['rescue', 'debt'].includes(td.t.kind) && (writesT(td.t.a, td.t.b) || writesT(td.t.b, td.t.a)))) {
          const who = { a: td.t.a, b: td.t.b };
          const prevBoot = (gs.episodeHistory || []).find(h => h.num === td.t.ep)?.eliminated || null;
          const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase }), pair: true, how: td.t.how || 'vote', lastBoot: !!prevBoot, ago: ep.num - td.t.ep <= 1 ? 'recent' : 'while' };
          const w = writeStory(`thr.${td.t.kind}`, td.stage, who, { ...(prevBoot ? { lastBoot: prevBoot } : {}), ...(td.t.chal ? { chal: td.t.chal } : {}) }, facts, { ep: ep.num, camp, phase, n: n++, place: 'aside', avoid: ctxAvoid('morning'), unique: 'soft', draft: true });
          if (w) {
            offer('thread', 'due', { at: 0.45, item: onCommit({ story: true, kind: `thr.${td.t.kind}.${td.stage}`, storyType: 'thread', step: td.stage, players: [td.t.a, td.t.b], lines: w.lines, text: w.text, lineId: w.lineId,
              scene: { kind: 'thr', who, data: {}, spot: w.spot ? { ...w.spot, window: 'morning' } : null }, badgeText: THREAD_BADGE[td.t.kind][0], badgeClass: THREAD_BADGE[td.t.kind][1],
              why: [THREAD_WHY[td.t.kind](td.t)] }, () => td.commit()) });
          }
        }
      }
      // a running gag (runners.js): one beat when it's due, before the challenge
      if (editOn && phase === 'pre') {
        const rd = runnerDue(ep, members);
        if (rd) {
          const foil1 = foilFor(rd.name, members, look, castToday());
          const foil = [foil1, ...members.filter(m => m !== rd.name && m !== foil1).sort((x, y) => getBond(rd.name, y) - getBond(rd.name, x) || x.localeCompare(y))].filter(Boolean);
          const who = { a: rd.name, ...(foil[0] ? { b: foil[0] } : {}), ...(foil[1] ? { c: foil[1] } : {}) };
          const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase }), third: !!who.c, pair: !!who.b, call: rd.call || 0 };
          const w = writeStory(`run.${rd.kind}`, String(rd.stage), who, {}, facts, { ep: ep.num, camp, phase, n: n++, place: 'public', avoid: ctxAvoid('afternoon'), unique: 'soft', draft: true });
          if (w) {
            offer('running-gag', 'colour', { at: 0.8, item: onCommit({ story: true, kind: `run.${rd.kind}.${rd.stage}`, storyType: 'comedy', step: String(rd.stage), players: Object.values(who), lines: w.lines, text: w.text, lineId: w.lineId,
              scene: { kind: 'run', who, data: {}, spot: w.spot ? { ...w.spot, window: 'afternoon' } : null }, badgeText: 'Meanwhile', badgeClass: '', why: [`${rd.name}'s running gag.`] }, () => rd.commit()) });
          }
        }
      }
      // the C-story: one person's inner life, before the challenge (psyche.js)
      if (editOn && phase === 'pre' && ep.num > 1) {
        const pc = psycheCast(ep, members);
        if (pc) {
          const need = needOf(pc.name);
          const conf = foilFor(pc.name, members.filter(m => getBond(pc.name, m) >= 3), look, castToday()) || null;
          const who = { a: pc.name, ...(conf ? { b: conf } : {}) };
          const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase }), moment: pc.moment, lastBoot: !!pc.lastBoot, pair: !!conf };
          const w = writeStory('psy', need, who, pc.lastBoot ? { lastBoot: pc.lastBoot } : {}, facts, { ep: ep.num, camp, phase, n: n++, place: 'aside', avoid: ctxAvoid('afternoon'), unique: 'soft', draft: true });
          if (w) {
            offer('psyche', 'colour', { at: 0.6, item: onCommit({ story: true, kind: `psy.${need}`, storyType: 'psyche', step: pc.moment, players: Object.values(who), lines: w.lines, text: w.text, lineId: w.lineId,
              scene: { kind: 'psy', who, data: {}, spot: w.spot ? { ...w.spot, window: 'afternoon' } : null }, badgeText: 'In Their Head', badgeClass: 'teal', why: [`${pc.name}: ${need}.`] }, () => { ((gs.tdStory ||= {}).psySeen ||= {})[pc.name] = ep.num; }) });
          }
        }
      }
      const votes = phase === 'post' && talk ? voteTalk(ep, camp, talk, () => n++) : [];
      // the confessionals where somebody argues with themselves (the user, from Disventure Camp: "I
      // don't want to hurt Topaz, but if I hold back, I'm only hurting myself... Right?"), at the two
      // moments the engine says are real: writing the name of somebody you're close to, and winning
      // immunity when the camp isn't glad you did
      {
        const deep = (kind, a, data, why, more = {}) => {
          const who = { a };
          const w = writeStory(`deep.${kind}`, 'any', who, data, { ...factsFor({ who, data: {} }, { ep: ep.num, phase, tribal: knowsTribal(phase) }), merged, ...more }, { ep: ep.num, camp, phase, n: n++, place: 'confessional', unique: 'soft', draft: true });
          if (w) offer('deep', 'story', { at: 7e5, item: { story: true, kind: `deep.${kind}`, storyType: 'conf', step: kind, players: [a], lines: w.lines, text: w.text, lineId: w.lineId,
            scene: { kind: 'deep', who, data, spot: { id: 'confessional' } }, badgeText: '', badgeClass: '', why: [why] } });
        };
        if (!editOn) { /* the edit is off: the day as the engine's moments alone */ }
        else if (phase === 'pre') {
          // the morning after a cover plan: the one who wrote the fake name works out what happened
          const prevEp = (gs.episodeHistory || []).find(h => h.num === ep.num - 1);
          const cv = (prevEp?.coverPlans || []).find(p => p.real === prevEp.eliminated && members.includes(p.leader));
          const fooled = cv ? (cv.told || []).find(m => members.includes(m) && (prevEp.votingLog || []).find(v => v.voter === m)?.voted === cv.cover) : null;
          if (fooled) deep('liedto', fooled, { leader: cv.leader, cover: cv.cover, lastBoot: prevEp.eliminated }, `${cv.leader} gave ${fooled} a fake name last night.`);
          // nobody close, two episodes running
          const book = ((gs.tdStory ||= {}).alone ||= {});
          const lonely = members.filter(x => Math.max(-10, ...members.filter(y => y !== x).map(y => getBond(x, y))) <= 1);
          const twice = lonely.filter(x => book[x] === ep.num - 1).sort()[0];
          lonely.forEach(x => { if (book[x] !== ep.num) book[x] = book[x] === ep.num - 1 && x === twice ? -99 : ep.num; });
          if (twice && !fooled && ep.num > 2) deep('alone', twice, {}, `Nobody here is close to ${twice}, and hasn't been for days.`);
        }
        else if (talk) {
          const wrote = x => (ep.votingLog || []).find(v => v.voter === x)?.voted;
          const torn = members.filter(x => x !== talk.leader && x !== talk.boot && wrote(x) === talk.boot && getBond(x, talk.boot) >= 3)
            .sort((x, y) => getBond(y, talk.boot) - getBond(x, talk.boot) || x.localeCompare(y))[0];
          if (torn) deep('betray', torn, { friend: talk.boot }, `${torn} is close to ${talk.boot}, and is writing ${talk.boot}'s name tonight.`);
          // the swing vote, the night they decide (director.js voteTalk's swing scene)
          const sw = votes.find(it => it.step === 'swing');
          const swinger = sw?.scene?.who?.b;
          // only when it really is the vote everybody needs: a close count, and no other confessional like it tonight
          const tl = {}; (talk.ballots || []).forEach(v => { tl[v.voted] = (tl[v.voted] || 0) + 1; });
          const top = Object.values(tl).sort((x, y) => y - x);
          const close = top.length >= 2 && top[0] - top[1] <= 1;
          if (swinger && !torn && close && members.includes(swinger)) deep('swing', swinger, { pitcher: sw.scene.who.a, target: talk.boot }, `${swinger} is the vote everybody needs tonight.`, { yes: /yes$/.test(sw.kind || '') });
        }
        const imm = [].concat(ep.immunityWinner || []).find(x => members.includes(x));
        // after the challenge only: nobody has won it yet in the morning (read: Paige's winner's
        // confessional aired before the challenge she went on to win)
        if (merged && imm && phase === 'post') {
          const warm = members.filter(x => x !== imm).reduce((s0, x) => s0 + getBond(x, imm), 0) / Math.max(1, members.length - 1);
          const before = (gs.episodeHistory || []).filter(h => h.num < ep.num && [].concat(h.immunityWinner || []).includes(imm)).length;
          if (warm < 1) deep('win', imm, {}, `${imm} won immunity, and the camp is not happy about it.`, { again: before >= 1 });
        }
      }
      // the vote's information always airs; a doubt that changes nothing and the other name's nerves are suspense, and
      // take their place with the day's story
      votes.forEach((it, k) => offer('vote', /\.doubt\.holds$|^vt2\.decoy/.test(it.kind || '') ? 'story' : 'must', { at: 8e5 + k, item: it }));
      // the vote's own scenes come first, and each one past the first takes a place from the rest of the day, three at
      // most (the user, 2026-10-12: "I sometimes don't feel like the strategy is talked about much... prioritize")
      const cap = (phase === 'pre' ? (merged ? 4 : 3) : tribalTonight ? (merged ? 5 : 4) : 2) - Math.min(3, Math.max(0, votes.length - 1));
      const onScreen = {};
      [opener, ...votes].forEach(it => it?.players.forEach(p => { onScreen[p] = (onScreen[p] || 0) + 1; }));
      const score = f => dramaOf(f.line.type, f.step.step)
        + continuityScore(continuity, { type: f.line.type, ...f.step, topic: f.ev.scene?.kind || f.ev.type }, { ep: ep.num, camp, phase })
        + (phase === 'post' && tribalTonight && ['bottom', 'alliance', 'scheme'].includes(f.line.type) ? 2 : 0)
        - 0.6 * (seasonAired[`${f.line.type}.${f.step.step}`] || 0)
        + (f.ev.scene?.kind && hasStoryPool(`long.${f.ev.scene.kind}`) ? 1.5 : 0);
      // The first day is strangers: no vote has happened, no alliance has history, nobody has
      // betrayed anybody. Only what can happen between people who just met airs on it.
      const STRANGERS = /^(friendship\.bond|showmance\.spark|rivalry\.friction|idol\.(search|found)|underdog\.rise|alliance\.formed|alliance\.recruit|alliance\.refused)$/;
      const fitsDay = f => ep.num > 1 || STRANGERS.test(`${f.line.type}.${f.step.step}`);
      const ranked = filed.filter(fitsDay).sort((x, y) => score(y) - score(x) || x.i - y.i);
      const usedLines = new Set();
      const chosen = [];
      // camp life keeps its room (the user: "aside from strategy there's literally nothing, nothing
      // from camp life"): the day's best friendship, showmance and underdog moments go first, on top
      // of the cap, two in the morning and one after the challenge
      const LIFE = /^(friendship|showmance|underdog)$/;
      // (a pitch to turn on a friend, below, takes one of these places: the day stays a show's length)
      const pitchHere = ranked.some(f => f.ev?.type === 'turnFriend');
      // the coaching twist airs every day (td/coach/scenes.js): in the morning one session (the one where most
      // happened), after the challenge its strongest moment, two when that one is a big one (the card, a deal,
      // a gift, a fall). They take camp life's places, so the day stays a show's length.
      const coachTake = (() => {
        const mine = ranked.filter(f => f.line.type === 'coach');
        if (!mine.length) return [];
        if (phase === 'pre') {
          const ss = mine.filter(f => f.ev?.type === 'coachSession');
          const loud = f => (f.ev.trainees || []).reduce((t, x) => t + Math.abs(Number(x.gain) || 0), 0) + (gs._coachSessAired?.[f.ev.coach] === ep.num - 1 ? 0 : 1);
          const one = ss.sort((x, y) => loud(y) - loud(x) || x.i - y.i).slice(0, 1);
          if (one[0]) (gs._coachSessAired ||= {})[one[0].ev.coach] = ep.num;
          // the morning after a coach night comes first: the camp has to feel what the vote did
          const after = mine.filter(f => /^coach(Gone|Saved)Morning$/.test(f.ev?.type || '')).slice(0, 1);
          return [...after, ...one];
        }
        const pri = f => COACH_PRI[f.ev?.type] ?? 3;
        // the same kind of moment with the same coach not again within four episodes (read 2026-10-10: the
        // same passed-over confrontation three weeks running, the card shown to the same person twice)
        const seen = gs._coachAiredKind ||= {};
        const kindKey = f => `${f.ev?.type}|${f.ev?.scene?.data?.coach || f.step.roles?.a}`;
        const rest = mine.filter(f => f.ev?.type !== 'coachSession' && !(ep.num - (seen[kindKey(f)] ?? -99) < 4)).sort((x, y) => pri(y) - pri(x) || x.i - y.i);
        const take = rest.slice(0, rest.length && pri(rest[0]) >= 7 ? 2 : 1);
        take.forEach(f => { seen[kindKey(f)] = ep.num; });
        return take;
      })();
      const lifeTake = editOn ? ranked.filter(f => LIFE.test(f.line.type)).slice(0, Math.max(0, (phase === 'pre' ? 2 : 1) - (pitchHere ? 1 : 0) - coachTake.length)) : [];
      // a pitch to turn on a friend airs first, inside the cap: it comes back at the vote, and a
      // payoff nobody saw set up is the thing the user keeps finding (camp-events.js checkTurnFriendPitches)
      const pitchTake = [...ranked.filter(f => f.ev?.type === 'turnFriend' && !lifeTake.includes(f)), ...coachTake];
      const order = [...pitchTake, ...lifeTake, ...ranked.filter(f => !lifeTake.includes(f) && !pitchTake.includes(f) && !(f.line.type === 'coach' && f.ev?.type === 'coachSession'))];
      // one day, one story per person (the user: Duncan panicking, then calmly running the winning plan):
      // tonight's leader doesn't come apart on camera, and the one going home unaware doesn't scramble
      const DISTRESS = { 'friend.mentor': 'b', 'friend.comfort': 'b', 'friend.lift': 'b', 'talk.scramble': 'a', 'conf.paranoia': 'a', 'drama.paranoia': 'a',
        'conf.excluded': 'a', 'drama.meltdown': 'a', 'sitout.heat': 'a' };
      const bootKnows = !!talk && ((ep.pitchIntel || []).some(i => i.knower === talk.boot && i.target === talk.boot) || (ep.pitchCounterplay || []).some(c => c.actor === talk.boot));
      const clashes = f => {
        const k = (f.ev.scene?.kind || '').replace(/^long\./, '');
        const fam = k.split('.').slice(0, 2).join('.');
        const role = DISTRESS[fam];
        if (!role || !talk) return false;
        const who = f.ev.scene?.who?.[role] || f.step.roles?.[role];
        return who === talk.leader || (who === talk.boot && !bootKnows);
      };
      // The game's own story, offered whole (the user, 2026-10-14: "where's the story... they talk like two or three
      // times and it's over"): measured on the stage-5 matrix, the engine made about 21 storyline moments a camp-day
      // (friendship 4.7, rivalry 3.4, alliance 2.9, the bottom 2.7, schemes 1.6, idols 0.9, romance 0.7) and 1 in 5 aired:
      // this loop took 2 to 5 a stretch, and a person could be in two at most counting the opener and the vote talk.
      // Now up to twelve a stretch are proposed, in the storyline's own drama order, and the day's budget chooses
      // (selectScenes: story before colour, airtime spread). The old quota is kept as the order's first places.
      const STORY_MAX = editOn ? Math.max(12, cap + lifeTake.length) : cap + lifeTake.length;
      for (const f of order) {
        if (chosen.length >= STORY_MAX) break;
        const must = pitchTake.includes(f);
        if (!must && editOn && clashes(f)) continue;
        if (!must && usedLines.has(f.line)) continue;
        const cast = [f.step.roles.a, f.step.roles.b, f.step.roles.c].filter(Boolean);
        // ...except a moment between a couple (an active showmance: look.couple): measured 2026-10-13, this cap cut ~45%
        // of the engine's romance moments, because one of the two is nearly always in the vote talk; the day's budget
        // still charges a third scene in a day (selectScenes). Big friendships and feuds keep the cap: letting them
        // through too gave the room back to the central players and undid stage 4's spread (Gini 0.129 -> 0.140)
        const tiedPair = !!look && !!f.step.roles.a && !!f.step.roles.b && look.couple(pairKey([f.step.roles.a, f.step.roles.b]));
        // (six a person now, with the day at thirty: the airtime score charges each scene past two, selectScenes; measured
        // 2026-10-14, at four this still cut 1,265 friendship and 1,066 rivalry moments on the matrix)
        if (!must && !tiedPair && cast.some(p => (onScreen[p] || 0) >= (editOn ? 6 : 2))) continue;
        chosen.push(f);
        usedLines.add(f.line);
        cast.forEach(p => { onScreen[p] = (onScreen[p] || 0) + 1; });
      }
      // The long scene is a fuller version of the engine's OWN moment: its kind and ending say
      // exactly what happened (lines/*.js headers in td/script), so the long pool is keyed on
      // them, and it plays the same people in the same parts. A storyline step adds what came
      // before; a quick cut (no storyline) is written from the same pools when one exists.
      const longScene = (ev, i, line = null, step = null) => {
        const kind = ev.scene?.kind || '';
        const pool = kind ? `long.${kind}` : null;
        if (!pool || !hasStoryPool(pool)) return null;
        // with romance off, no romance scene is written out (the long night games are romantic): the engine's own words only
        if (seasonConfig?.romance === 'disabled' && /^romance\./.test(kind)) return null;
        // a coach's own version (a pitch or an alliance with no ballot in it, td/script pitch-coach.js) is never
        // swapped for the general long scene, which is written for somebody who votes
        if (['withcoach', 'coach'].includes(ev.scene?.data?.ending) || /^pitch\.coach/.test(kind)) return null;
        const ending = ev.scene?.data?.ending || 'any';
        const who = { ...(ev.scene?.who || (step ? { a: step.roles.a, b: step.roles.b, c: step.roles.c } : { a: ev.players?.[0], b: ev.players?.[1], c: ev.players?.[2] })) };
        // the people a group moment invited (camp-events.js _crowdScenes data.with) take the next
        // parts, up to six in all
        for (const x of [].concat(ev.scene?.data?.with || [])) {
          if (Object.values(who).includes(x)) continue;
          const slot = ['c', 'd', 'e', 'f'].find(r => !who[r]);
          if (!slot) break;
          who[slot] = x;
        }
        // Who else is in it (the user: "group, duo and solo versions... it depends on the person's
        // strategy, personality and relationships"). A strategy talk or a friendship moment started
        // by someone who works in groups (shapeFor) pulls in the friends a and b share; a fight in
        // front of camp pulls in b's closest friend, who takes b's side; an alliance wobbling pulls
        // in an ally of both. Nobody is added who would learn something they should not: they are
        // on the same side, or the moment is public.
        if (who.a && who.b && !who.c && !['use', 'charm', 'tense'].includes(ev.scene?.data?.ending)) {
          const rule = PULL.find(([re]) => re.test(kind));
          if (rule) {
            const [, how, most, needsGroup] = rule;
            const rest = members.filter(m => m !== who.a && m !== who.b);
            const both = m => getBond(who.a, m) + getBond(who.b, m);
            // 'members': the rest of the alliance b is joining, there to welcome b
            const al = how === 'members' ? (gs.namedAlliances || []).find(x => x.name === ev.scene?.data?.group) : null;
            const mates = how === 'side'
              ? rest.filter(m => getBond(who.b, m) >= 5).sort((x, y) => getBond(who.b, y) - getBond(who.b, x) || x.localeCompare(y))
              : how === 'members' ? rest.filter(m => al?.members?.includes(m)).sort((x, y) => getBond(who.a, y) - getBond(who.a, x) || x.localeCompare(y))
              : rest.filter(m => getBond(who.a, m) >= 1 && getBond(who.b, m) >= 1).sort((x, y) => both(y) - both(x) || x.localeCompare(y));
            const joins = mates.length > 0 && (!needsGroup || shapeFor(who.a, closeTo(who.a, rest)) === 'group');
            if (joins) mates.slice(0, most).forEach((m, k) => { who[['c', 'd', 'e'][k]] = m; });
          }
        }
        // Public couple downtime can include a friend already present in this camp.
        // Private flirtation and triangle confrontations keep their engine cast.
        if (!who.c && who.a && who.b && (kind === 'romance.honeymoon' || (kind === 'romance.moment' && ending === 'couple')) && (ep.num + i) % 3 === 0) {
          who.c = members.filter(m => m !== who.a && m !== who.b && getBond(m, who.a) >= 0 && getBond(m, who.b) >= 0)
            .sort((x, y) => getBond(y, who.a) + getBond(y, who.b) - getBond(x, who.a) - getBond(x, who.b) || x.localeCompare(y))[0] || null;
        }
        const prev = line && step ? prevAired(line, step) : null;
        const rec = recordSlots(ep, who.a, who.b, camp, phase);
        // who they were to each other before the season (siblings, exes, an old betrayal)
        const hist = historyOf(who.a, who.b);
        const data = { ...rec.data, ...hist.data, ...(ev.scene?.data || {}) };
        // a defence says what the critic said (and the setup scene shows them saying it)
        if (ev.type === 'protectiveInstinct' && who.b) Object.assign(data, defendCharge(ep, who.b));
        const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase, tribal: knowsTribal(phase) }), ...(ev.scene?.facts || {}), ...rec.facts,
          ...Object.fromEntries(['ending', 'result', 'intent', 'reason', 'again', 'size'].filter(k => ev.scene?.data?.[k] != null).map(k => [k, ev.scene.data[k]])),
          ...Object.fromEntries(['rival', 'friend', 'threat', 'weak', 'group', 'plan', 'boot', 'wrote', 'fallen', 'more', 'betrayer', 'holder', 'wins', 'other', 'target', 'mine', 'theirs'].map(k => [k, !!data[k]])),
          story: line?.type || 'cut', step: step?.step || 'cut', prev: prev ? prev.step : 'none', chapter: line ? Math.min(3, line.steps.filter(s => s.aired).length + 1) : 1,
          prevGap: prev ? (ep.num - prev.ep >= 3 ? 'long' : ep.num === prev.ep ? 'same' : 'recent') : 'none',
          tribal: knowsTribal(phase), phase, third: !!who.c, known: !!data.target && !Object.values(who).includes(data.target),
          registerC: who.c ? registerOf(who.c) : null, ...allianceFacts(ev, who, data), hist: hist.facts.hist };
        // the engine's own spot, unless a scene already written for this window is there (read: a crowd huddle and a vote
        // plan both at the caves at 4:30): then the writer finds this one somewhere else
        const engineSpot = ev.scene?.spot?.id || ev.access?.locationId || null, winHere = ev.scene?.spot?.window || ev.access?.windowId;
        const sceneCtx = { ep: ep.num, camp, phase, n: n++, place: 'aside', draft: true, spotId: engineSpot && !ctxAvoid(winHere)?.has?.(engineSpot) ? engineSpot : null, avoid: ctxAvoid(winHere) };
        const groupRomanceId = who.c && (kind === 'romance.honeymoon' ? 'nrx.honey1' : kind === 'romance.moment' && ending === 'couple' ? 'nrx.couple2' : null);
        const w = kitRomanceScene(kind, ending, who, data, facts, sceneCtx) || kitDigScene(kind, who, data, facts, sceneCtx)
          || (groupRomanceId ? writeStory(pool, ending, who, data, facts, { ...sceneCtx, entryIds: [groupRomanceId] }) : null)
          || writeStory(pool, ending, who, data, facts, sceneCtx);
        if (!w) return null;
        if ((w.lineId?.startsWith('ndx.') || w.lineId?.startsWith('nrx.')) && /^(drama\.|crowd\.clash)/.test(kind) && who.c && w.lines.some(l => l.by === who.c && l.kind === 'say'))
          w.fx = [[who.a, who.c, -0.15]];
        if (w.lineId?.startsWith('nrx.') && /^romance\./.test(kind) && who.c && w.lines.some(l => l.by === who.c && l.kind === 'say'))
          w.fx = [[who.a, who.c, 0.15], [who.b, who.c, 0.15]];
        // a public moment has an audience (the user: "a social bomb, but no one in the background and
        // no one reacted"): when nobody but a and b spoke, the people around them react, the one
        // closer to b first (defending b, or just mortified), then one closer to a
        let lines = w.lines;
        const watched = [];
        // (the reactions are written in draft too: they are spent only if this scene airs; and a bystander's line the
        // episode has already used is left out rather than said again, 2026-10-14: 'Best entertainment we've had all week'
        // twice in one episode)
        const spentToo = [];
        // ...and the camp is there: the scene opens with them in earshot, so the stage brings them on
        if (PUBLIC.test(kind) && who.a && who.b && !lines.slice(0, 2).some(l => CROWD_WORDS.test(l.text || ''))) {
          const OPEN = ['The rest of the camp has stopped what they are doing to watch.', 'Everybody nearby can hear every word.', 'Half the camp is close enough to hear every word.'];
          // (after the scene's own opening beat, which says what is happening: read 2026-10-14, "The rest of the camp has
          // stopped what they are doing to watch", then "Isabel walks past Natalia at the water pump")
          const o = lines[0]?.kind === 'beat' ? 1 : 0;
          lines = [...lines.slice(0, o), { kind: 'beat', text: OPEN[(ep.num + i) % OPEN.length] }, ...lines.slice(o)];
        }
        // the reactions go in before the scene's closing confessional(s), not after them
        // ...and before anybody walks off: "Logan puts down his bowl and walks off", then "Logan, come sit with me" (read
        // 2026-10-14)
        const tailAt = (() => { let k = lines.length; while (k > 0 && lines[k - 1].kind === 'conf') k--;
          const off = lines.findIndex((l, j) => j > 0 && j < k && l.kind === 'beat' && /\b(storms?|stomps?|walks?|marches?|stalks?) (off|away)\b|\bleaves\b/i.test(l.text || ''));
          return off > 0 ? off : k; })();
        const insert = more => { const t = tailAt + (lines.length - tailAt === 0 ? 0 : 0); lines = [...lines.slice(0, t), ...more, ...lines.slice(t)]; };
        const fam = NOTE_FAM(kind);
        if (PUBLIC.test(kind) && who.a && who.b && !lines.some(l => l.by && l.by !== who.a && l.by !== who.b)) {
          const lean = x => (getBond(x, who.b) - getBond(x, who.a));
          const around = members.filter(m => !Object.values(who).includes(m));
          const forB = [...around].sort((x, y) => lean(y) - lean(x) || x.localeCompare(y))[0] || null;
          const forA = around.filter(x => x !== forB).sort((x, y) => lean(x) - lean(y) || x.localeCompare(y))[0] || null;
          // somebody steps in only when it was an attack: a brag or a boast just gets watched
          // (not after a scene that ended friendly: Topher called Max "so mean" for a line Zoey had just called sweet,
          // read 2026-10-14; those entries are in CALM_ENDS), nor in a dispute, an argument about somebody else)
          // ...and only somebody who really cares: a close friend of b, or of a (the user, 2026-10-14: "theres a lot of
          // fight and people taking sides i mean this structure happens a lot"; it was every public fight, a mortified
          // 'awkward' line from whoever stood nearest when nobody cared). Most fights are the two of them, watched.
          const tone = lean(forB) >= 2 ? 'defend' : getBond(forB, who.a) >= 4 ? 'excuse' : null;
          if (forB && tone && (fam === 'fight' || fam === 'credit') && !CALM_ENDS.has(w.lineId) && !/dispute/.test(kind)) {
            const ww = { a: who.a, b: who.b, c: forB, ...(forA ? { d: forA } : {}) };
            const r = writeStory('public.react', tone, ww, data, { ...facts, third: true, fourth: !!forA, registerC: registerOf(forB) },
              { ep: ep.num, camp, phase, n: n++, place: 'aside', unique: 'soft', draft: true, epFresh: true });
            // (marked: one fight a day keeps its side-takers, sidesOncePerDay below)
            if (r) { for (const l of r.lines) l.sideTake = true; spentToo.push(r.lines); insert(r.lines); watched.push(forB, ...(forA && r.lines.some(l => l.by === forA) ? [forA] : [])); }
          }
          // ...and somebody watching takes it in: what everybody now knows about a
          // (the sharpest, less each time they've been the one watching: read 2026-10-14, Jade "heard every word" of four
          // fights in one season)
          const sharpness = x => (pStatsOf(x)?.intuition || 0) + (pStatsOf(x)?.strategic || 0) - 3 * ((gs.tdStory?.noteBy || {})[x] || 0);
          const sharp = around.filter(x => x !== forB && x !== forA).sort((x, y) => sharpness(y) - sharpness(x) || x.localeCompare(y))[0];
          if (sharp) {
            const wn = { a: sharp, b: who.a, c: who.b };
            const nt = writeStory(`public.note.${NOTE_FAM(kind)}`, 'any', wn, data, { ...factsFor({ who: wn, data: {} }, { ep: ep.num, phase }), third: true }, { ep: ep.num, camp, phase, n: n++, place: 'confessional', unique: 'soft', draft: true, epFresh: true });
            if (nt) { for (const l of nt.lines) l.watchNote = true; spentToo.push(nt.lines); lines = [...lines, ...nt.lines]; watched.push(sharp); }
          }
        }
        return spentToo.reduce((it, x) => adopt(it, x), adopt(adopt({ story: true, kind: pool, storyType: line?.type || 'cut', step: step?.step || 'cut', ...(line ? { storyline: line.id } : { cut: true }), ref: i, type: ev.type,
          players: [...new Set([...Object.values(who).filter(Boolean), ...(ev.players || []), ...watched])],
          lines, text: lines.map(l => l.text).join(' '), lineId: w.lineId, scene: { kind, who: castOnly(who, w), data, spot: w.spot ? { window: ev.scene?.spot?.window || ev.access?.windowId || null, ...w.spot } : (ev.scene?.spot || null) }, access: ev.access || null,
          alliance: ev.alliance, members: ev.members, advType: ev.advType, badgeText: ev.badgeText || '', badgeClass: ev.badgeClass || '',
          why: whyOf(kind, ending, line ? `${line.type}.${step.step}` : '', who, data, facts), bondDelta: ev.bondDelta || null, ...(w.fx?.length ? { fx: w.fx } : {}) }, w), w.lines));
      };
      for (const f of chosen) {
        const { ev, i, line, step } = f;
        const item = longScene(ev, i, line, step);
        if (!item && (!rawFits(ev, ep, phase) || !rawFull(ev))) continue;
        const it = claimEv(item || { ref: i, storyline: line.id }, ev, () => {
          step.aired = true;
          seasonAired[`${line.type}.${step.step}`] = (seasonAired[`${line.type}.${step.step}`] || 0) + 1;
        });
        // the day's frame (a pitch it pays off at the vote, the coaching twist's daily scene) always airs
        offer(pitchTake.includes(f) ? 'pitch' : lifeTake.includes(f) ? 'life' : 'storyline', pitchTake.includes(f) ? 'must' : 'story', { at: i, item: it, extra: !!f.extra });
      }
      // each character's own material (td/story/kits.js, written from the roster profile: Bruno's job as a
      // personal assistant, Dunia's witchcraft, Gabby's pets and Ellie): one bit a camp in the morning, the
      // least recently featured first, teased by whoever is closest to them; and one life talk a camp in the
      // afternoon, between two people still getting to know each other. On top of the caps: it is what the
      // day is made of in a real episode (the user, 2026-10-10: "more like a real Disventure Camp episode").
      if (editOn && !ep.isFinale) {
        const book = ((gs.tdStory ||= {}).kitLast ||= {});
        const kitted = members.filter(m => hasKit(m)).sort((x, y) => (book[x] ?? -99) - (book[y] ?? -99) || x.localeCompare(y));
        const busy = new Set(list.flatMap(x => x.item?.players || []).filter(Boolean));
        if (phase === 'pre') {
          for (const a of kitted) {
            // the closest one to a teases them, but not the same person every time
            const lastB = ((gs.tdStory ||= {}).kitBitWith ||= {})[a];
            const b = foilFor(a, members.filter(m => m !== lastB), look, castToday());
            if (!b) break;
            const who = { a, b };
            // A third camper joins the same scheduled bit, with a consequence for participating.
            const third = (ep.num + n) % 3 === 0 ? members.filter(m => m !== a && m !== b && getBond(a, m) >= 0 && getBond(b, m) >= 0)
              .sort((x, y) => getBond(a, y) + getBond(b, y) - getBond(a, x) - getBond(b, x) || x.localeCompare(y))[0] : null;
            const w = kitBitScene(a, b, factsFor({ who, data: {} }, { ep: ep.num, phase }), { ep: ep.num, camp, phase, n: n++, third, place: 'aside', draft: true, avoid: ctxAvoid(phase === 'pre' ? 'afternoon' : 'evening') });
            if (!w) continue;
            offer('kit', 'colour', { at: 0.35, item: onCommit(adopt({ story: true, kind: 'kit.bit', storyType: 'kit', step: 'bit', players: Object.values(w.who || who), lines: w.lines, text: w.text, lineId: w.lineId,
              scene: { kind: 'kit', who: w.who || who, data: {}, spot: w.spot || null }, badgeText: 'Camp Banter', badgeClass: 'green', why: [`${a}'s own thing, and ${b} has opinions about it.`], fx: [[a, b, 0.5], ...(w.fx || [])] }, w), () => { book[a] = ep.num; gs.tdStory.kitBitWith[a] = b; }) });
            break;
          }
          const kitItem = (kind, step, players, w, who, why, fx = [], then = null) => offer('kit', 'colour', { at: kind === 'kit.call' ? 0.4 : 0.38, item: onCommit(adopt({ story: true, kind, storyType: 'kit', step, players, lines: w.lines, text: w.text, lineId: w.lineId,
            scene: { kind: 'kit', who, data: {}, spot: w.spot || null }, badgeText: '', badgeClass: '', why: [why], fx }, w), then) });
          // a mentor arc over three episodes (lines/n-mentor.js): somebody struggling at a skill, somebody good at it
          // who offers, the practice, and the day they do it alone. One at a time, two a season, and it ends if
          // either of them leaves. The skill is the mentor's strongest (the user's read: Anastasia teaching Rosa fire).
          {
            const M = ((gs.tdStory ||= {}).mentor ||= { arcs: 0, cur: null });
            const STEPS = ['offer', 'practice', 'done'];
            // (what there is to learn where the season is: read 2026-10-14, "making fire" taught on the World Tour jet)
            const SKILL = ({
              'world-tour': { endurance: 'packing a parachute', physical: 'climbing the cargo net', mental: 'reading a map', intuition: 'reading a map', social: 'packing a parachute', strategic: 'tying knots' },
              'film-lot': { endurance: 'stage fighting', physical: 'climbing the scaffolding', mental: 'learning lines', intuition: 'learning lines', social: 'stage fighting', strategic: 'tying knots' },
            })[venueNow] || { endurance: 'making fire', physical: 'climbing', mental: 'tying the shelter knots', intuition: 'fishing', social: 'fishing', strategic: 'tying the shelter knots' };
            const st = x => { try { return pStatsOf(x) || {}; } catch { return {}; } };
            // it ends when one of them has left the game, not when this camp is somebody else's
            const alive = new Set(gs.activePlayers || []);
            if (M.cur && (!alive.has(M.cur.a) || !alive.has(M.cur.b))) M.cur = null;
            let cand = null;
            if (!M.cur && M.arcs < 2 && ep.num >= 2 && !merged) {
              const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'underdog', 'goat', 'showmancer', 'perceptive-player', 'floater']);
              const archOf = x => (players.find(p => p.name === x) || {}).archetype;
              // (nobody is taught twice: read 2026-10-14, Diego taught Jade fire, "I did it!", and offered to teach her fire
              // the next day)
              const taught = new Set(M.taught || []);
              for (const key of ['endurance', 'physical', 'mental']) {
                const learner = [...members].filter(x => !taught.has(x)).sort((x, y) => (st(x)[key] ?? 5) - (st(y)[key] ?? 5) || x.localeCompare(y))[0];
                const teacher = members.filter(x => x !== learner && NICE.has(archOf(x)) && getBond(x, learner) >= 0 && (st(x)[key] ?? 5) - (st(learner)[key] ?? 5) >= 3)
                  .sort((x, y) => (st(y)[key] ?? 5) - (st(x)[key] ?? 5) || x.localeCompare(y))[0];
                // (proposed here; it starts when its first scene airs, below)
                if (learner && teacher) { cand = { a: teacher, b: learner, skill: SKILL[key], step: 0, last: -1 }; break; }
              }
            }
            const cur = M.cur || cand;
            if (cur && cur.last < ep.num && members.includes(cur.a) && members.includes(cur.b)) {
              const step = STEPS[cur.step];
              const who = { a: cur.a, b: cur.b };
              const w = writeStory('arc.mentor', step, who, { skill: cur.skill }, factsFor({ who, data: {} }, { ep: ep.num, phase }), { ep: ep.num, camp, phase, n: n++, place: 'aside', unique: 'soft', draft: true, avoid: ctxAvoid(phase === 'pre' ? 'afternoon' : 'evening') });
              if (w) {
                offer('mentor', 'due', { at: 0.33, item: onCommit({ story: true, kind: `arc.mentor.${step}`, storyType: 'arc', step, players: [who.a, who.b], lines: w.lines, text: w.text, lineId: w.lineId,
                  scene: { kind: 'arc', who, data: { skill: cur.skill }, spot: w.spot || null }, badgeText: '', badgeClass: '', why: [`${who.a} is teaching ${who.b} ${cur.skill}.`], fx: [[who.a, who.b, 1]] }, () => {
                  if (!M.cur) { M.cur = cur; M.arcs++; (M.taught ||= []).push(cur.b); }
                  M.cur.last = ep.num; M.cur.step++;
                  if (M.cur.step >= STEPS.length) M.cur = null;
                }) });
              }
            }
          }
          // the heat between two people who don't like each other: b sneers at a's thing, a defends it
          // (every other day, so a cast full of kits doesn't fight every morning)
          if (ep.num % 2 === 1) for (const a of kitted) {
            if (book[a] === ep.num) continue;
            const b = members.filter(m => m !== a && getBond(m, a) <= -3).sort((x, y) => getBond(x, a) - getBond(y, a) || x.localeCompare(y))[0];
            if (!b) continue;
            const who = { a, b };
            const w = kitClashScene(a, b, factsFor({ who, data: {} }, { ep: ep.num, phase }), { ep: ep.num, camp, phase, n: n++, place: 'aside', draft: true, avoid: ctxAvoid(phase === 'pre' ? 'afternoon' : 'evening') });
            if (!w) continue;
            kitItem('kit.clash', 'clash', [a, b], w, who, `${b} can't stand ${a}, and today it came out.`, [[a, b, -1]], () => { book[a] = ep.num; });
            break;
          }
          // a running bit, called back by two others (every other day, once it has aired)
          if (ep.num % 2 === 0) for (const about of kitted) {
            const [c, d] = members.filter(m => m !== about).sort((x, y) => getBond(about, x) - getBond(about, y) || x.localeCompare(y));
            if (!c || !d) break;
            const who = { a: c, b: d };
            const w = kitCallbackScene(c, d, about, factsFor({ who, data: {} }, { ep: ep.num, phase }), { ep: ep.num, camp, phase, n: n++, place: 'aside', draft: true, avoid: ctxAvoid(phase === 'pre' ? 'afternoon' : 'evening') });
            if (!w) continue;
            kitItem('kit.call', 'callback', [c, d, about], w, { ...who, c: about }, `${about}'s running bit, as the camp sees it.`, [[c, d, 0.5]]);
            break;
          }
        } else {
          // a friend hears the true thing under the bit (every other day)
          if (ep.num % 2 === 0) for (const a of kitted) {
            const b = members.filter(m => m !== a && getBond(a, m) >= 4).sort((x, y) => getBond(a, y) - getBond(a, x) || x.localeCompare(y))[0];
            if (!b) continue;
            const who = { a, b };
            const w = kitDeepScene(a, b, factsFor({ who, data: {} }, { ep: ep.num, phase }), { ep: ep.num, camp, phase, n: n++, place: 'secret', draft: true, avoid: ctxAvoid(phase === 'pre' ? 'afternoon' : 'evening') });
            if (!w) continue;
            offer('kit', 'colour', { at: 0.55, item: adopt({ story: true, kind: 'kit.deep', storyType: 'kit', step: 'deep', players: [a, b], lines: w.lines, text: w.text, lineId: w.lineId,
              scene: { kind: 'kit', who, data: {}, spot: w.spot || null }, badgeText: '', badgeClass: '', why: [`${a} trusts ${b} with something real.`], fx: [[a, b, 1.5]] }, w) });
            break;
          }
          const pairs = [];
          for (const a of kitted) for (const b of members) {
            if (b === a || busy.has(a) && busy.has(b)) continue;
            const bd = getBond(a, b);
            if (bd <= -3) continue;
            pairs.push([a, b, Math.abs(bd - 1) - (hasKit(b) ? 1 : 0) + ((book[a] ?? -99) === ep.num ? 3 : 0)]);
          }
          pairs.sort((x, y) => x[2] - y[2] || x[0].localeCompare(y[0]) || x[1].localeCompare(y[1]));
          for (const [a, b] of pairs.slice(0, 6)) {
            const who = { a, b };
            const w = kitLifeScene(a, b, factsFor({ who, data: {} }, { ep: ep.num, phase }), { ep: ep.num, camp, phase, n: n++, place: 'aside', draft: true, avoid: ctxAvoid(phase === 'pre' ? 'afternoon' : 'evening') });
            if (!w) continue;
            offer('kit', 'colour', { at: 0.5, item: onCommit(adopt({ story: true, kind: 'kit.life', storyType: 'kit', step: 'life', players: [a, b], lines: w.lines, text: w.text, lineId: w.lineId,
              scene: { kind: 'kit', who, data: {}, spot: w.spot || null }, badgeText: '', badgeClass: '', why: [`${a} and ${b} get to know each other.`], fx: [[a, b, 1]] }, w), () => { book[a] = ep.num; }) });
            break;
          }
        }
      }
      // what two people's lives have in common, and what they do with it later (kindredScenes)
      if (editOn && !ep.isFinale && !ep.isMerge) for (const it of kindredScenes(ep, members, camp, phase, () => n++)) offer('kindred', it.item.kind === 'kindred.find' ? 'colour' : 'due', it);
      // a couple between their engine moments (couple.js: competing priorities, a disagreement and making up, something real,
      // a small moment of their own), one beat a couple a stretch
      if (editOn && !ep.isFinale) for (const it of coupleScenes(ep, camp, members, phase, () => n++,
        (p, o, w, d, f, c) => writeStory(p, o, w, d, f, { ...c, draft: true, avoid: ctxAvoid(phase === 'pre' ? 'afternoon' : 'evening') }),
        who => factsFor({ who, data: {} }, { ep: ep.num, phase, tribal: knowsTribal(phase) }), { tribalTonight })) offer('couple', it.tier, it);
      // stories that run across episodes (arcs.js: revenge for a friend, the friend who won't let go, envy,
      // the one who coasts, learning to talk to people, a showmance for the numbers), the camp's free time
      // (four people and a game, every other episode), and one person alone with the camera in the afternoon
      // (kits-solo.js, the least recently alone first). On top of the caps, like the kit scenes.
      // The merge episode is its own story (the merge, everybody in one camp, the busiest night of the season,
      // 21-24 scenes without these): the arcs wait a day and there is no game or solo.
      if (editOn && !ep.isFinale && !ep.isMerge) {
        // (in draft: a scene here is a proposal, and spends its lines and its place only if it airs, commit.js)
        const writeHere = (p, o, w, d, f, c) => writeStory(p, o, w, d, f, { ...c, draft: true, avoid: ctxAvoid(phase === 'pre' ? 'afternoon' : 'evening') });
        // the mentor arc counts against the same room: two serial stories a phase is plenty
        let arcsNow = list.filter(x => x.item?.storyType === 'arc').length;
        // (how much of this airs is the day's budget's call, selectScenes: these only propose)
        // (three serial stories a stretch, and two follow-ups a morning, with the day at thirty: measured 2026-10-14, with
        // the game's own story airing, a clash's follow-up kept taking the one slot and a defence's never came)
        const ARCS_MAX = 3;
        if (liveEp(ep) && arcsNow < ARCS_MAX) {
          const skip = new Set();
          for (let k = 0; k < 2 && arcsNow < ARCS_MAX; k++) {
            const follow = followupScene(ep, camp, members, phase, () => n++, writeHere, who => factsFor({ who, data: {} }, { ep: ep.num, phase, tribal: knowsTribal(phase) }), skip);
            if (!follow) break;
            skip.add(follow.item.scene?.data?.followupId);
            offer('follow-up', 'due', follow); arcsNow++;
          }
        }
        // a relationship that turned on something one of them did since an aired setup (turns.js): one a morning, in
        // the same room as the follow-ups and the arcs
        if (liveEp(ep) && phase === 'pre' && arcsNow < ARCS_MAX) {
          const busyPairs = new Set(list.filter(x => x.item?.storyType === 'arc' && (x.item.players || []).length >= 2).map(x => [...x.item.players].slice(0, 2).sort().join('|')));
          const tn = turnScene(ep, camp, members, null, () => n++, who => factsFor({ who, data: {} }, { ep: ep.num, phase, tribal: knowsTribal(phase) }), 'pre', busyPairs, writeHere);
          if (tn) { offer('turn', 'due', tn); arcsNow++; }
        }
        // the morning after a fight somebody watched: the one they went against (or left on their own) has it out with them
        if (liveEp(ep) && phase === 'pre' && arcsNow < ARCS_MAX) {
          const wa = witnessAfter(ep, camp, members, () => n++, writeHere, who => factsFor({ who, data: {} }, { ep: ep.num, phase, tribal: knowsTribal(phase) }));
          if (wa) { offer('witness-after', 'due', wa); arcsNow++; }
        }
        offer('arc', 'due', ...runArcs(ep, camp, members, phase, () => n++, writeHere, Math.max(0, ARCS_MAX - arcsNow)));
        const busyNow = new Set(list.flatMap(x => x.item?.players || []).filter(Boolean));
        // the game and the solo are colour: they air only while the day has room (selectScenes; a merge night, one
        // camp holding everybody, already fills a show's worth; tests/td-story.test.js 'show-sized episode')
        const g = campGame(ep, camp, members, phase, () => n++, writeHere, busyNow);
        if (g) offer('camp-game', 'colour', g);
        // Day one's own set pieces (lines/n-dayone.js: the tour going wrong, the luggage, lost exploring, a raid
        // on the food, the flag, the first cooking, the first night's noise, homesick), one a team in each stretch
        // of the day, the franchise's least-seen first (write.js storySeen). The user, 2026-10-10: "the first day
        // seems to roll always the same events".
        if (ep.num === 1 && members.length >= 3) {
          const FUNNY = new Set(['wildcard', 'chaos-agent', 'goat', 'social-butterfly', 'hothead', 'showmancer', 'underdog']);
          const free = members.filter(m => !busyNow.has(m));
          const pool = free.length >= 3 ? free : members;
          const archOf = x => (players.find(p => p.name === x) || {}).archetype;
          const lead = [...pool].sort((x, y) => (FUNNY.has(archOf(y)) ? 3 : 0) + (pStatsOf(y)?.boldness ?? 5) - (FUNNY.has(archOf(x)) ? 3 : 0) - (pStatsOf(x)?.boldness ?? 5) || x.localeCompare(y))[0];
          const rest = pool.filter(m => m !== lead).sort((x, y) => getBond(lead, y) - getBond(lead, x) || x.localeCompare(y));
          const dwho = { a: lead, b: rest[0], c: rest[1], ...(rest[2] ? { d: rest[rest.length - 1] } : {}), h: seasonConfig?.host || 'Chris' };
          if (dwho.b && dwho.c) {
            const dw = writeHere('story.dayone', 'any', dwho, { host: dwho.h },
              { ...factsFor({ who: dwho, data: {} }, { ep: ep.num, phase }), third: true, fourth: !!dwho.d, phase }, { ep: ep.num, camp, phase, n: n++, place: 'public', unique: true });
            if (dw) offer('day-one', 'colour', { at: phase === 'pre' ? 0.44 : 0.46, item: { story: true, kind: 'story.dayone', storyType: 'fun', step: 'dayone',
              players: [dwho.a, dwho.b, dwho.c, ...(dwho.d ? [dwho.d] : [])], lines: dw.lines, text: dw.text, lineId: dw.lineId,
              scene: { kind: 'dayone', who: Object.fromEntries(Object.entries(dwho).filter(([r]) => r !== 'h')), data: {}, spot: dw.spot || null }, badgeText: '', badgeClass: '', why: ['Day one at camp.'] } });
          }
        }
        if (phase === 'post') {
          const soloBook = ((gs.tdStory ||= {}).soloLast ||= {});
          // somebody not already in a scene this afternoon first, then the rest
          const loners = members.filter(m => hasKit(m)).sort((x, y) => (busyNow.has(x) ? 1 : 0) - (busyNow.has(y) ? 1 : 0) || (soloBook[x] ?? -99) - (soloBook[y] ?? -99) || x.localeCompare(y));
          for (const a of loners) {
            const w = kitSoloScene(a, factsFor({ who: { a }, data: {} }, { ep: ep.num, phase }), { ep: ep.num, camp, phase, n: n++, place: 'aside', draft: true, avoid: ctxAvoid(phase === 'pre' ? 'afternoon' : 'evening') });
            if (!w) continue;
            offer('kit', 'colour', { at: 0.47, item: onCommit(adopt({ story: true, kind: 'kit.solo', storyType: 'kit', step: 'solo', players: [a], lines: w.lines, text: w.text, lineId: w.lineId,
              scene: { kind: 'kit', who: { a }, data: {}, spot: w.spot || null }, badgeText: '', badgeClass: '', why: [`${a}, on ${pronouns(a).posAdj} own.`] }, w), () => { soloBook[a] = ep.num; }) });
            break;
          }
        }
      }
      // the extra scenes (kits, the mentor, the arcs, games, solos) are in the afternoon stretch of the day, or
      // the evening's: their spot says so, so two of them are never staged in one place at one time
      for (const { item } of list) if (item && ['kit', 'arc', 'fun'].includes(item.storyType) && item.scene?.spot && !item.scene.spot.window)
        item.scene.spot = { ...item.scene.spot, window: phase === 'pre' ? 'afternoon' : 'evening' };
      // a returnee's past airs on top of the caps (camp-events.js franchise-meta block: the grudge from
      // last season, the reunion, the newcomer asking what happened, the newcomers plotting against the
      // vets). No storyline files them, so without this none ever aired (read 2026-10-09: twenty of them
      // in one returnee season, all off camera). Two a camp early on, one after.
      { let tookR = 0;
        const capR = ep.num <= 2 ? 2 : 1;
        events.forEach((ev, i) => {
          if (tookR >= capR || !ev || ev.aired != null || !/^meta[A-Z]/.test(ev.type || '') || !ev.scene?.kind) return;
          const item = longScene(ev, i);
          if (!item) return;
          tookR++;
          offer('returnee', 'story', { at: 0.3 + tookR * 0.01, item: claimEv(item, ev) });
        }); }
      // what tonight's plan comes from (causeOf) airs on top of the caps: the plan calls back to it
      for (const c of (talk?.cause || []).filter(c => c.phase === phase)) {
        const ev = events[c.i];
        if (!ev || ev.aired != null) continue;
        // the morning's own scene already has the mourner grieving
        if ((c.kind === 'revenge' || c.kind === 'fallout') && opener?.players?.includes(ev.scene?.who?.a)) continue;
        const item = longScene(ev, c.i);
        offer('cause', 'must', { at: c.i, item: claimEv(item ? adopt({ ...item, why: [...(item.why || []), `This is where ${c.of} becomes ${c.by}'s target.`] }, item) : { ref: c.i }, ev) });
      }
      // quick cuts: short moments between the long scenes, new faces first. A moment the opener
      // already covered (the team's own "who lost it", the morning's mourning) does not air twice.
      // Back from the challenge, the whole team reacts together when the engine staged it (crowd.won
      // / crowd.lost: the top scorer cheered, the lowest scorer blamed and defended): that group
      // scene opens the afternoon in place of the two-person "who lost it", with the same facts
      let openerNow = opener;
      if (phase === 'post' && opener && /^story\.chal/.test(opener.kind || '')) {
        const gi = events.findIndex(ev => ev && ev.aired == null && ev.type === 'groupScene' && /^crowd\.(won|lost)$/.test(ev.scene?.kind || ''));
        // a regrouping team doesn't then air the shouting match too
        if (gi >= 0 && opener.step === 'regroup' && events[gi].scene?.kind === 'crowd.lost') events[gi].aired = 'covered';
        const g = gi >= 0 && events[gi].aired == null ? longScene(events[gi], gi) : null;
        if (g) {
          const k = list.findIndex(x => x.item === opener);
          const item = claimEv(adopt({ ...g, why: opener.why || g.why }, g), events[gi]);
          // (the two-person opener it replaces never airs: what it would have spent stays unspent)
          if (k >= 0) discard(opener);
          if (k >= 0) list[k] = { at: -1, item, src: 'opener', tier: 'must', extra: false }; else offer('opener', 'must', { at: -1, item });
          openerNow = item;
        }
      }
      const dup = ev => {
        const k = ev.scene?.kind || '';
        const ok = openerNow?.kind || '';
        if (/^(story\.chal\.lost|long\.crowd\.lost)/.test(ok) && (/^crowd\.lost/.test(k) || ev.type === 'blame')) return true;
        if (/^(story\.chal\.won|long\.crowd\.won)/.test(ok) && /^crowd\.won/.test(k)) return true;
        if (opener?.kind === 'story.morning' && /^fallout\.mourn/.test(k)) return true;
        return false;
      };
      // Group scenes have a slot of their own (the real shows: 41% of Total Drama's camp scenes and
      // 51% of Disventure Camp's have three or more people talking, spec §1b): each half-day airs the
      // team's biggest group moment, with the most people the episode hasn't heard from yet, before
      // the quick cuts, and takes one quick cut's place
      let groupN = 0;
      {
        const seenNow = new Set(list.flatMap(x => x.item.players || speaksIn(events[x.item.ref])));
        const groupEvs = events.map((ev, i) => ({ ev, i })).filter(({ ev }) => ev && !ev.aired && ev.type === 'groupScene' && !dup(ev) && rawFits(ev, ep, phase)
          && (ev.players || []).filter(p => !seenNow.has(p)).length >= 1)
          .sort((x, y) => (y.ev.players || []).filter(p => !seenNow.has(p)).length - (x.ev.players || []).filter(p => !seenNow.has(p)).length || x.i - y.i);
        for (const { ev, i } of groupEvs.slice(0, members.length >= 7 ? 2 : 1)) {
          const item = longScene(ev, i);
          if (!item && !rawFull(ev)) continue;
          groupN++;
          offer('group', 'story', { at: i, item: claimEv(item || { ref: i }, ev) });
        }
      }
      const shown = new Set(list.flatMap(x => x.item.players || speaksIn(events[x.item.ref])));
      const cuts = events.map((ev, i) => ({ ev, i })).filter(({ ev }) => ev && !ev.aired && !dup(ev) && saysIn(ev).length && (ev.lines || []).length <= 7 && rawFits(ev, ep, phase))
        .sort((x, y) => saysIn(y.ev).filter(p => !shown.has(p)).length - saysIn(x.ev).filter(p => !shown.has(p)).length || x.i - y.i);
      // a pitch that aired (pitchTake) takes one quick cut's place, so the day stays a show's length
      const pitchN = events.filter(ev => ev?.type === 'turnFriend' && ev.aired === true).length;
      const cutCap = Math.max(0, (phase === 'pre' ? 3 : votes.length >= 3 ? 1 : 2) - groupN - pitchN);
      let cutN = 0;
      const topicsNow = new Set();
      // the same kind of moment between the same people (a threat confessional about the same rival)
      // rests three episodes: the same thought aired again reads as a loop
      const topic = ev => `${ev.type}:${[...(ev.players || [])].sort().join('|')}`;
      const rested = ev => ep.num - (seasonAired['cut:' + topic(ev)] ?? -99) < 3;
      // (and two more past the quota, as room-fillers, like the storyline steps' extras)
      for (const { ev, i } of cuts) {
        if (cutN >= cutCap + (editOn ? 2 : 0)) break;
        if (!saysIn(ev).some(p => !shown.has(p)) || rested(ev) || topicsNow.has(topic(ev))) continue;
        if (editOn && clashes({ ev, step: { roles: {} } })) continue;
        const item = longScene(ev, i);
        if (!item && !rawFull(ev)) continue;
        topicsNow.add(topic(ev));
        const extra = cutN >= cutCap;
        cutN++;
        (item ? item.players : saysIn(ev)).forEach(p => shown.add(p));
        offer('cut', 'colour', { at: i, extra, item: claimEv(item || { ref: i }, ev, () => { seasonAired['cut:' + topic(ev)] = ep.num; }) });
      }
      // ...and the coverage pass below does not bring the duplicate back
      events.forEach(ev => { if (ev && !ev.aired && dup(ev)) ev.aired = 'covered'; });
      // The day's budget (selectScenes): everything above was proposed; this decides what airs. The morning gets its
      // share and the evening what the day has left, so a tribal night's vote talk has its room.
      {
        const B = DAY_BUDGET;
        const limit = phase === 'pre'
          ? { target: tribalTonight ? 13 : 15, ceiling: tribalTonight ? 16 : 18 }
          // (one place kept for what comes after the edit: somebody nobody has heard from yet, a defence's setup)
          : { target: B.target - 1, ceiling: B.ceiling - 1 };
        const turns = phase === 'pre' ? { turnTarget: Math.round(B.turnTarget / 2), turnCeiling: Math.round(B.turnCeiling / 2) } : B;
        const sel = selectScenes(list, events, dayUsed, limit, turns, editOn ? look : null, editOn && !globalThis.__tdNoRhythm);
        for (const e of sel.drop) { discard(e.item); discard(e.item.lines); }
        for (const e of sel.keep) { commit(e.item); commit(e.item.lines); }
        list.splice(0, list.length, ...sel.keep);
        dayUsed.scenes = sel.scenes; dayUsed.turns = sel.turns; dayUsed.people = sel.people; dayUsed.pairs = sel.pairs;
        dayLog[phase] = sel.log;
      }
      // what the director's own scenes did to the people in them (fx: kits, banter, mentor, arcs, games, reactions)
      applyStoryFx(ep, list);
      // the vote told across the day: its spark, the warnings, the advantage decisions, an unseen
      // alliance (arcBeats); seasonConfig.tdEdit 'off' leaves the day as the engine's moments alone
      if ((seasonConfig?.tdEdit || 'full') !== 'off') {
        // the story beats are added on top: the free scenes keep their room (the user, 2026-10-08)
        // what already aired this morning, quick cuts read from their engine event; and what airs this stretch
        // (after the budget: an alliance chapter that was proposed and dropped did not show them forming)
        const morning = phase === 'post' ? (out.pre || []).map(it => it.lines ? it : { kind: eventsOf(ep, camp, 'pre')[it.ref]?.type || '', players: eventsOf(ep, camp, 'pre')[it.ref]?.players || [] }) : [];
        for (const e of arcBeats(ep, camp, members, phase, talk, () => n++, list, morning, 'ally')) {
          list.push(e);
          dayLog[phase].push(`+must|ally|must|${e.item.kind}|${(e.item.players || []).slice(0, 4).join(',')}|${spokenIn(e.item.lines)}`);
        }
      }
      list.sort((x, y) => x.at - y.at);
      for (const x of list) {
        const ev = x.item.lines ? x.item : events[x.item.ref];
        speaksIn(ev).forEach(p => spoke.add(p));
      }
      out[phase] = list.map(x => x.item);
    }
    // nobody forgotten: a camper this camp has not heard from all episode gets a moment of their own
    const alive = members;
    for (const name of alive) {
      if (spoke.has(name)) continue;
      // their own moment, if the engine gave them one
      let placed = false;
      for (const phase of ['post', 'pre']) {
        const events = eventsOf(ep, camp, phase);
        const i = events.findIndex(ev => ev && !ev.aired && speaksIn(ev).includes(name) && (ev.lines || []).length <= 8 && rawFits(ev, ep, phase) && rawFull(ev));
        if (i >= 0) {
          events[i].aired = true;
          out[phase].push({ ref: i });
          speaksIn(events[i]).forEach(p => spoke.add(p));
          placed = true;
          break;
        }
      }
      if (placed) continue;
      const phase = out.post.length ? 'post' : 'pre';
      const sc = coverScene(ep, camp, phase, name, n++, knowsTribal(phase));
      if (sc) { out[phase].push(sc); spoke.add(name); }
    }
    // a meal is a meal: whatever airs in the engine's own words about food is staged where the camp
    // eats, at breakfast (the morning) or dinner (the evening), with everybody else eating too
    for (const phase of ['pre', 'post']) {
      const events = eventsOf(ep, camp, phase);
      out[phase] = out[phase].map(it => {
        if (it.story || it.ref == null) return it;
        const ev = events[it.ref];
        if (!ev || !(MEAL_TYPE.test(ev.type || '') || MEAL_KIND.test(ev.scene?.kind || ''))) return it;
        const eat = placeOf(venueNow, 'eat', 0);
        if (!eat) return it;
        return { ...ev, story: true, kind: ev.scene?.kind || ev.type, ref: it.ref, ...(it.storyline ? { storyline: it.storyline } : {}),
          scene: { ...(ev.scene || {}), spot: { id: eat.id, label: eat.label, fixed: true, window: phase === 'pre' ? 'morning' : 'before-tribal' } } };
      });
    }
    // a pitch is somebody trying to get the numbers, so it airs before the plans that settle the vote, never after them on
    // the walk to Tribal (read 2026-10-14: Yul pitched Aubrey before Tribal, after his plan for Julia had aired)
    { const evs = eventsOf(ep, camp, 'post');
      out.post = out.post.map(it => {
        const ev = it.ref != null && !it.lines ? evs[it.ref] : it;
        const kind = it.kind || ev?.scene?.kind || ev?.type || '';
        if (!/^pitch\./.test(kind)) return it;
        const sp = ev?.scene?.spot || null, win = sp?.window || ev?.access?.windowId;
        if (win !== 'before-tribal') return it;
        const id = sp?.id || ev?.access?.locationId;
        const at = id ? placeById(id) : null;
        if (!id) return it;
        return { ...ev, ...it, story: true, kind, ref: it.ref, ...(it.storyline ? { storyline: it.storyline } : {}),
          scene: { ...(ev.scene || {}), spot: { ...(sp || {}), id, label: sp?.label || at?.label || id, window: 'scramble' } } };
      }); }
    // a night scene written before the challenge airs that evening (read 2026-10-14: spin the bottle "in a circle around
    // the fire" aired on the trail in the morning): only a written scene moves, an engine moment keeps its own phase
    { const NIGHT_GAME = /spin the bottle|empty bottle|the bottle (wobbles|spins|stops)|truth or dare|never have I ever|^\(?late[,.]|\bit's late\b|gone to bed|as it gets dark|\bin the dark\b|under the stars|moonlight|last (two|ones) (awake|still up)|still awake|every(one|body) else is asleep/i;
      const night = it => it?.story && Array.isArray(it.lines) && it.scene?.spot && it.scene.spot.id !== 'confessional' && it.storyType !== 'vote'
        && it.lines.some(l => l.kind === 'beat' && NIGHT_GAME.test(l.text || ''));
      const moving = out.pre.filter(night);
      if (moving.length) {
        out.pre = out.pre.filter(it => !moving.includes(it));
        out.post.push(...moving.map(it => ({ ...it, scene: { ...it.scene, spot: { ...it.scene.spot, window: 'evening' } } })));
      }
      // ...and the other way: a scene that says it is first thing (sunrise, everybody else asleep, "Morning!") airs in the
      // morning, moved back to before the challenge if it was written after it (read 2026-10-14: "Early. Everyone else is
      // asleep" in the evening, a sunrise workout in the afternoon); a ghost story round the fire is night
      const EARLY = /\bsunrise\b|^\(?early[.,]|\bfirst light\b|before (anyone|everybody|everyone)('s| is)? (up|awake)|every(one|body) else is (still )?asleep/i;
      const morningOf = it => it?.story && Array.isArray(it.lines) && it.scene?.spot && it.scene.spot.id !== 'confessional' && it.storyType !== 'vote'
        && (it.lines.some(l => l.kind === 'beat' && EARLY.test(l.text || '')) || it.lines.some(l => l.kind === 'say' && /^morning[!,.]/i.test(l.text || '')));
      const ghost = it => it?.story && Array.isArray(it.lines) && it.lines.some(l => l.kind === 'say' && /ghost story|closer to the fire/i.test(l.text || ''));
      for (const it of out.pre) if (morningOf(it)) it.scene = { ...it.scene, spot: { ...it.scene.spot, window: 'morning' } };
      const early = out.post.filter(morningOf), spooky = out.pre.filter(ghost);
      if (early.length) { out.post = out.post.filter(it => !early.includes(it)); out.pre.push(...early.map(it => ({ ...it, scene: { ...it.scene, spot: { ...it.scene.spot, window: 'morning' } } }))); }
      if (spooky.length) { out.pre = out.pre.filter(it => !spooky.includes(it)); out.post.push(...spooky.map(it => ({ ...it, scene: { ...it.scene, spot: { ...it.scene.spot, window: 'evening' } } }))); }
      for (const it of out.post) if (ghost(it)) it.scene = { ...it.scene, spot: { ...it.scene.spot, window: 'evening' } };
      // ...and a night scene already after the challenge airs in the evening, not on the walk back (read 2026-10-14: "the
      // last two awake" in the 'return' window)
      for (const it of out.post) if (night(it) && it.scene.spot.window !== 'evening' && it.scene.spot.window !== 'scramble' && it.scene.spot.window !== 'before-tribal') it.scene = { ...it.scene, spot: { ...it.scene.spot, window: 'evening' } };
    }
    // the refs that were added late go back into the camp's own order
    const editOn0 = (seasonConfig?.tdEdit || 'full') !== 'off';
    for (const phase of ['pre', 'post']) {
      const VOTE_AT = { other: 2e6, plan: 2.1e6, cover: 2.15e6, swing: 2.2e6, doubt: 2.25e6, decoy: 2.28e6, target: 2.3e6 };
      // the rest of the written scenes keep to the clock of the day: the challenge talk of the afternoon, then the
      // evening, then the scramble, then the walk to the vote. The vote's own beats (its spark, a warning, a bloc
      // forming: arcBeats) had no place here and sorted as NaN, which leaves a sort's order undefined: the user,
      // 2026-10-12, "they talk about the challenge, then the votes, and right after about the challenge again"
      const WIN_RANK = { morning: 0, 'camp-work': 1, return: 0, afternoon: 1, evening: 2, scramble: 3, 'before-tribal': 4 };
      // ...and every scene by the window the viewer stages it in (vp-td-ep/steps.js tdCampScreen: its own spot's window,
      // the engine's access window, else the phase's), the order within a window as before. Engine moments sorted by
      // their place in the engine's list ahead of every written scene, so a 7 PM fight aired before the 3 PM banter
      const evs0 = eventsOf(ep, camp, phase);
      const winOf = it => { const ev = it.ref != null && !it.lines ? evs0[it.ref] : it;
        return ev?.scene?.spot?.window || ev?.access?.windowId || (phase === 'pre' ? 'camp-work' : 'scramble'); };
      // the challenge is talked about once, as the camp gets back, and then the day moves on (the user, 2026-10-12:
      // "when a discussion has been talked about, no need to come back unless there's a real reason"): its moments
      // (chm.*: a sabotage, a rescue, the replay between friends) follow the opener instead of resuming after a
      // pitch. A plan that names the challenge as its reason is that reason, and stays with the vote.
      const chalTalk = it => /^chm\./.test(it.kind || '');
      // (said as the camp gets back, when its spot is free then; else in its own window, still straight after the opener)
      const takenAt = new Set(out[phase].filter(it => !chalTalk(it) && it.scene?.spot?.window === 'return').map(it => it.scene.spot.id));
      for (const it of out[phase]) if (chalTalk(it) && it.scene?.spot && !takenAt.has(it.scene.spot.id)) { it.scene.spot = { ...it.scene.spot, window: 'return' }; takenAt.add(it.scene.spot.id); }
      // the hour a scene says it is (read 2026-10-14: an engine moment marked 'morning' aired after the challenge, and "Late.
      // Courtney and Julia are still up after everybody else has gone to bed" aired as the team got back): a morning window
      // after the challenge is the afternoon, an evening one before it is the afternoon, and a scene whose stage directions
      // say it is late or dark is the evening
      { const PRE_WIN = new Set(['morning', 'camp-work']), POST_WIN = new Set(['return', 'evening', 'scramble', 'before-tribal']);
        const NIGHT = /^\(?late[,.]|\bit's late\b|after every(one|body)( else)?( has)? gone to bed|\b(are|is) (the last (two|ones) )?still up\b|as it gets dark|\bin the dark\b|under the stars|moonlight|can't sleep/i;
        for (const it of out[phase]) {
          const sp = it?.story ? it.scene?.spot : null;
          if (!sp || sp.id === 'confessional' || it.storyType === 'vote') continue;
          let w = sp.window || null;
          if (phase === 'post' && PRE_WIN.has(w)) w = 'afternoon';
          if (phase === 'pre' && POST_WIN.has(w)) w = 'afternoon';
          if (phase === 'post' && (!w || ['return', 'afternoon'].includes(w)) && (it.lines || []).some(l => l.kind === 'beat' && NIGHT.test(l.text || ''))) w = 'evening';
          if (w && w !== sp.window) it.scene = { ...it.scene, spot: { ...sp, window: w } };
        } }
      // one spot, one talk at a time (tests/td-story 'never stages two written scenes on the same spot'): a written scene
      // that would share its spot and its stretch with an earlier one moves to the next stretch of the day where that spot
      // is free (its lines name the place, not the hour). Read 2026-10-14: with thirty a day, a friendship moment and the
      // team's return from the challenge both landed on the communal grounds as everybody got back.
      { const NEXT = phase === 'pre' ? ['morning', 'camp-work', 'afternoon'] : ['return', 'afternoon', 'evening', 'scramble', 'before-tribal'];
        const eats = new Set(placeOf(venueNow, 'eat', 0) ? [placeOf(venueNow, 'eat', 0).id] : []);
        const held = new Set();
        for (const it of out[phase]) {
          const sp = it?.story ? it.scene?.spot : null;
          // (a fixed spot keeps its place: only its stretch of the day moves)
          if (!sp?.id || sp.id === 'confessional' || eats.has(sp.id)) continue;
          let win = sp.window || winOf(it);
          if (held.has(`${win}|${sp.id}`)) {
            // (the last stretch has no later one: an earlier free one, else two vote talks shared the cabins before Tribal)
            const i0 = NEXT.indexOf(win);
            const later = NEXT.slice(i0 + 1).find(w => !held.has(`${w}|${sp.id}`))
              || (i0 > 0 ? NEXT.slice(0, i0).reverse().find(w => !held.has(`${w}|${sp.id}`)) : null);
            if (later) { win = later; it.scene = { ...it.scene, spot: { ...sp, window: later } }; }
          }
          held.add(`${win}|${sp.id}`);
        } }
      // (the first two who click, learning names, air right after the first-day opener: read 2026-10-14, Jade comforted Diego
      // by the lake, then "Confession. I've forgotten both your names")
      // the swing's confessional ("X wanted my vote, and I said no") airs right after the scene where it happened, not
      // before it (read 2026-10-14)
      const swingIt = out[phase].find(x => x.storyType === 'vote' && x.step === 'swing');
      const afterSwing = it => !!swingIt && it.kind === 'deep.swing';
      const rank = it => (afterSwing(it) ? rank(swingIt) : at(it) === -1 ? -1 : (it.kind === 'story.firstpair' && it.step === 'clicked') ? -1 : chalTalk(it) ? 0 : WIN_RANK[winOf(it)] ?? 1);
      const at = it => afterSwing(it) ? VOTE_AT.swing + 1e4 : (/^(story\.(firstday|morning|chal)|long\.crowd\.(won|lost))/.test(it.kind || '') ? -1 : chalTalk(it) ? -0.5 : it.kind === 'story.firstpair' ? (it.step === 'clicked' ? 0.5 : 1e5)
        : it.storyType === 'vote' ? (VOTE_AT[it.step] ?? 1.5e6) : it.ref != null ? it.ref : 1e6);
      out[phase].sort((x, y) => rank(x) - rank(y) || at(x) - at(y));
      // somebody spotted hiding an advantage is spotted after the scene where they found it (read 2026-10-14: Topher saw
      // Dawn tuck "something deep into a bag" a scene before Dawn found her Vote Steal)
      { const evsP = eventsOf(ep, camp, phase), kindOf = it => it.kind || it.scene?.kind || evsP[it.ref]?.scene?.kind || '';
        const playersOf = it => it.players || evsP[it.ref]?.players || [], whoOf = it => it.scene?.who || evsP[it.ref]?.scene?.who || {};
      for (const sp of out[phase].filter(it => /spot\.power/.test(kindOf(it)))) {
        const who = whoOf(sp), isFind = it => it !== sp && /adv\.found/.test(kindOf(it));
        const holder = [who.b, ...playersOf(sp).filter(n => n !== who.a)].find(n => n && out[phase].some(it => isFind(it) && playersOf(it).includes(n)));
        const found = holder ? out[phase].findIndex(it => isFind(it) && playersOf(it).includes(holder)) : -1;
        const at0 = out[phase].indexOf(sp);
        if (found > at0) { out[phase].splice(at0, 1); out[phase].splice(found, 0, sp); }
      } }
      // the same two people, alone together, three times a day at most (read 2026-10-14, carnival ep 3: Logan and Richard had
      // a solidarity moment, a final-two deal, a thank-you for sticking up, banter about the challenge and a ride-or-die
      // promise, five scenes of the two of them in one day). Plans, couples and fights between them are their own story.
      { const day = {};
        const pairOf = (ph, it) => { const evs = eventsOf(ep, camp, ph);
          const kind = it.kind || it.scene?.kind || evs[it.ref]?.scene?.kind || '';
          const names = Object.values(it.scene?.who || evs[it.ref]?.scene?.who || {}).filter(Boolean);
          return names.length !== 2 || /^(story\.(vote|first|morning|chal|dayone)|vt2|pitch|deep\.|booth|tribal|couple|(long\.)?romance|arc\.spark|witness|(long\.)?drama|follow\.clash)/.test(kind) ? null : [...names].sort().join('|'); };
        // (the morning's are counted again from its finished list, so a rebuilt episode counts the same)
        if (phase === 'post') for (const it of out.pre || []) { const k = it && pairOf('pre', it); if (k) day[k] = (day[k] || 0) + 1; }
        const evsQ = eventsOf(ep, camp, phase);
        out[phase] = out[phase].filter(it => { const k = it && pairOf(phase, it); if (!k) return true; day[k] = (day[k] || 0) + 1;
          if (day[k] <= 3) return true;
          // (an engine moment cut here never aired: nothing later may call back to it)
          if (it.ref != null && evsQ[it.ref] && evsQ[it.ref].aired == null) evsQ[it.ref].aired = 'covered';
          return false; }); }
      // a plan's confessional that calls back to the moment it started ("I didn't say a word to Alessio after that fight
      // this afternoon") is cut when that moment airs after the plan (read 2026-10-14: the fight was staged before Tribal)
      for (const [k, it] of out[phase].entries()) {
        if (!it?.story || !Array.isArray(it.lines) || !it.lines.some(l => l.recall)) continue;
        const later = new Set(out[phase].slice(k + 1).filter(x => x?.ref != null).map(x => `${phase}:${x.ref}`));
        if (it.lines.some(l => l.recall && later.has(l.recall))) { it.lines = it.lines.filter(l => !(l.recall && later.has(l.recall))); it.text = it.lines.map(l => l.text).join(' '); }
      }
      // the rhythm of the stretch (stage 5): a run of five heavy scenes or more gets a light one from earlier the same
      // evening cut into it, at a thread's start (before a plan, another plan, the target's or a decoy's scene; never
      // between a plan and its swing or its doubt), staged in the window it now airs in and at a spot nobody else uses then
      if (editOn0 && !globalThis.__tdNoRhythm) out[phase] = breathe(out[phase], evs0, winOf, chalTalk);
      // one stretch of the day, not a stack of cut-off scenes (the user: "do we have conversation when
      // people jump in"): scenes that share a person run on from each other at the same spot
      // a confessional from somebody the scene never showed (a watcher's take, an onlooker's line): they are put in it,
      // watching, before they speak to the camera (the user, 2026-10-14: "make sure the confessional dont mismatch with
      // the conversation"; read: "Nothing tells you more about people than watching them fight" from somebody who was
      // never on screen)
      for (const it of out[phase]) {
        if (!it?.story || !Array.isArray(it.lines)) continue;
        const said = new Set(it.lines.filter(l => l.kind === 'say' && l.by).map(l => l.by));
        if (!said.size) continue;
        const beats = it.lines.filter(l => l.kind === 'beat').map(l => l.text || '').join(' ');
        const unseen = [...new Set(it.lines.filter(l => l.kind === 'conf' && l.by && !said.has(l.by) && !beats.includes(l.by)).map(l => l.by))];
        if (!unseen.length) continue;
        const at = it.lines.findIndex(l => l.kind === 'conf' && unseen.includes(l.by));
        const names = unseen.length === 1 ? unseen[0] : `${unseen.slice(0, -1).join(', ')} and ${unseen[unseen.length - 1]}`;
        const one = unseen.length === 1, h = [...`${ep.num}${camp}${phase}${names}`].reduce((x, c) => (x * 31 + c.charCodeAt(0)) >>> 0, 7);
        const WATCH = one
          ? [`${names} has been watching the whole thing.`, `${names} is close enough to hear every word.`, `${names} saw all of it from a few steps away.`, `${names} heard every word of that.`, `${names} hasn't missed a second of it.`]
          : [`${names} have been watching the whole thing.`, `${names} are close enough to hear every word.`, `${names} saw all of it from a few steps away.`, `${names} heard every word of that.`];
        const beat = { kind: 'beat', by: null, text: WATCH[h % WATCH.length], watch: unseen };
        it.lines = [...it.lines.slice(0, at), beat, ...it.lines.slice(at)];
        it.text = it.lines.map(l => l.text).join(' ');
        if (Array.isArray(it.players)) for (const x of unseen) if (!it.players.includes(x)) it.players.push(x);
      }
      out[phase] = chainScenes(ep, camp, phase, out[phase], () => n++);
      // A defence needs its setup (the user, 2026-10-10: "it needs a prior setup, that's how we know it's a good
      // show with continuation"): the critic needles b in front of people, and the one who'll defend b is
      // there and says nothing yet (n-defend.js). It airs earlier the same stretch of the day, after the opener.
      const evsHere = eventsOf(ep, camp, phase);
      for (let idx = 0; idx < out[phase].length; idx++) {
        const it = out[phase][idx];
        if (!it || it.setupDone) continue;
        // the long defence carries its charge; the engine's own short one (when the long ones are spent) gets it here
        // (a defence chained onto the scene before it keeps the engine's type, story: true)
        const raw = it.ref != null && evsHere[it.ref]?.type === 'protectiveInstinct' && !it.scene?.data?.chargeKey ? evsHere[it.ref]
          : it.story && it.type === 'protectiveInstinct' && !it.scene?.data?.chargeKey ? it : null;
        const longOne = it.story && /^long\.friend\.defend/.test(it.kind || '') && it.scene?.data?.chargeKey;
        if (!raw && !longOne) continue;
        const sc = raw ? raw.scene : it.scene;
        const { a: defender, b: target, c: critic } = sc?.who || {};
        if (!defender || !target || !critic) continue;
        const sdata = longOne ? it.scene.data : { ...(sc.data || {}), ...defendCharge(ep, target) };
        const more = sdata.more && members.includes(sdata.more) ? sdata.more : null;
        const swho = { a: critic, b: target, c: defender, ...(more ? { d: more } : {}) };
        const sw = writeStory('story.defend.setup', sdata.chargeKey, swho, sdata,
          { ...factsFor({ who: swho, data: {} }, { ep: ep.num, phase }), fourth: !!more }, { ep: ep.num, camp, phase, n: n++, place: 'public', unique: 'soft' });
        it.setupDone = true;
        if (!sw) continue;
        const setup = { story: true, kind: 'story.defend.setup', storyType: 'drama', step: 'setup', players: Object.values(swho),
          lines: sw.lines, text: sw.text, lineId: sw.lineId, scene: { kind: 'defend.setup', who: swho, data: sdata, spot: sw.spot || null },
          badgeText: '', badgeClass: '', why: [`${critic} gives ${target} a hard time, and ${defender} sees it.`] };
        // early in the stretch, after the opener, and never inside a run of chained scenes
        let pos = idx > 1 ? 1 : idx;
        while (pos < idx && out[phase][pos]?.chained) pos++;
        out[phase].splice(pos, 0, setup);
        idx++;
      }
      // nobody stands on stage through a scene that never speaks to them or of them: the viewer stages
      // scene.who (the user, 2026-10-10: "it's a 4 person scene but no one talking but the 2 girls").
      // The morning, the challenge's aftermath and the psyche beats cast more people than their lines use.
      // No sketches on screen (the user, 2026-10-10, of a three-line meal at the campfire: "i thought we fix
      // this type of scenes"): a conversation of fewer than four spoken lines doesn't air. The quick cuts
      // and the meal pass air the engine's own words, and the engine's pools are full of two- and three-liners;
      // such a moment stays off camera (the text backlog lists it) unless a long scene was written for it.
      // A vote or arc scene is the story's spine and stays; its pools are written long (td-story guard).
      { const evs = eventsOf(ep, camp, phase);
        out[phase] = out[phase].filter((it, i, all) => {
          if (!it || it.storyType === 'vote' || it.storyType === 'arc' || all[i + 1]?.chained) return true;
          // an aside (td/script/lines/aside.js) is the filler written onto a moment that has no scene of its
          // own: "So... that happened", "I saw what you did". It can't say what happened, so it doesn't air
          const ev = it.story ? null : evs[it.ref];
          if (ev && /^aside\./.test(ev.scene?.kind || '')) return false;
          const lines = it.story ? it.lines : ev?.lines;
          if (!Array.isArray(lines)) return true;
          const spoken = lines.filter(l => l.by && l.kind === 'say').length;
          return spoken === 0 || spoken >= 4;
        }); }
      // one scene, one set-up (the user, 2026-10-11: "multiple scenes mixing"): a scene assembled from several
      // writes (a plan beat by beat, a row with the people it pulls in) got the automatic set-up line on each
      // piece, "in the cave", "on the shoreline", "at the river", inside one scene in one place. An automatic
      // set-up (setup.js, marked auto) belongs only at a scene's start.
      for (const it of out[phase]) {
        if (!it?.story || !Array.isArray(it.lines)) continue;
        const kept = it.lines.filter((l, i) => !(l.auto && i > 0));
        if (kept.length !== it.lines.length) { it.lines = kept; it.text = kept.map(l => l.text).join(' '); }
      }
      for (const it of out[phase]) {
        if (!it?.story || !it.scene?.who || !Array.isArray(it.lines) || !it.lines.length) continue;
        const inIt = n => it.lines.some(l => l.by === n || String(l.text || '').includes(n));
        it.scene = { ...it.scene, who: Object.fromEntries(Object.entries(it.scene.who).filter(([r, n]) => n && (r === 'a' || inIt(n)))) };
      }
    }
    // A show-sized day (tests/td-story.test.js 'show-sized episode', 22 scenes a camp): when the day runs
    // over, the most optional colour makes way, the morning's first, latest in the day first. Never a vote
    // scene, an arc's chapter, a storyline step, or a scene the next one runs on from (chainScenes).
    { const CAP = DAY_BUDGET.ceiling;
      const OPTIONAL = /^(run\.|psy\.|kit\.|camp\.game|long\.friend\.(bond|sunrise|goof|joke|meal|celebrate|laugh)|long\.crowd\.(meal|chores|banter|project|dinner))/;
      const total = () => out.pre.length + out.post.length;
      for (const phase of ['pre', 'post']) for (let i = out[phase].length - 1; i >= 0 && total() > CAP; i--) {
        const it = out[phase][i], next = out[phase][i + 1];
        if (!it?.story || it.storyType === 'vote' || it.storyType === 'arc' || it.storyline || next?.chained) continue;
        if (!OPTIONAL.test(it.kind || '')) continue;
        out[phase].splice(i, 1);
      } }
    // a moment that changes who is in the game, or that the season cannot be followed without, always
    // airs (a medevac used to be left off camera every time: a player was gone with no screen saying so).
    // Last, after every cut: `aired` is not enough, a storyline step can claim a moment and then be cut.
    for (const phase of ['pre', 'post']) {
      eventsOf(ep, camp, phase).forEach((ev, i) => {
        if (!ev || !MUST_AIR.has(ev.type) || out[phase].some(it => it.ref === i)) return;
        ev.aired = true;
        if (AIRS_FIRST.has(ev.type)) out[phase].unshift({ ref: i }); else out[phase].push({ ref: i });
      });
    }
    // Record only scenes that survived every cut. Off-camera events cannot create continuity.
    for (const phase of ['pre', 'post']) for (const item of out[phase]) {
      const ev = item.ref != null ? eventsOf(ep, camp, phase)[item.ref] : null;
      const classified = ev && (filedMoments.get(ev) || classify(ev));
      if (classified) rememberMoment(continuity, { ...classified, topic: ev.scene?.kind || ev.type }, { ep: ep.num, camp, phase });
    }
    // everything that airs has spent what it spends (commit.js): a scene that reached the day by any path other than
    // it spends it now, so nothing on screen can leave its lines unspent for a later scene to repeat
    for (const phase of ['pre', 'post']) for (const it of out[phase] || []) {
      if (!it?.story) continue;
      if (pending(it) || pending(it.lines)) { if (globalThis.__tdCommitLate) globalThis.__tdCommitLate.push({ ep: ep.num, camp, phase, kind: it.kind }); commit(it); commit(it.lines); }
    }
    // one fight a day with people taking sides: the first that aired keeps its side-takers, a later one is the two of them
    sidesOncePerDay(out, liveEp(ep));
    // the people watching a public fight take a side, and it lasts (witness.js): before the follow-ups and turns read
    // the day, so a stance can become their next chapter
    if ((seasonConfig?.tdEdit || 'full') !== 'off') witnessConflicts(ep, camp, out, members, writeStory,
      who => ({ ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'post' }) }), liveEp(ep));
    // why each scene aired or didn't, for the debug view (compact strings; selectScenes)
    (dirLog[camp] = dayLog);
    if (liveEp(ep)) recordAirtime(ep, camp, out);
    if (liveEp(ep)) recordFollowups(ep, camp, out);
    if (liveEp(ep)) recordTurns(ep, camp, out);
    story[camp] = out;
  }
  ep.campStory = story;
  ep.tdDirectorLog = dirLog;
  // the night's words: every voter in the booth, the reading, last words, after (tribal.js)
  // (a double boot: the second vote's night here, and the first vote's on ep.tribalStory1, each from its own ballots)
  if (!ep.tribalStory) ep.tribalStory = writeTribal(isTwoVoteNight(ep) ? secondVoteView(ep) : ep);
  if (isTwoVoteNight(ep) && ep.tribalStory1 === undefined) ep.tribalStory1 = writeTribal(firstVoteView(ep));
  // a Multi-Tribal night: each losing tribe's council has its own booth, reading and last words
  for (const r of ep.multiTribalResults || []) if (!r.tribalStory) r.tribalStory = writeTribal(multiTribalView(ep, r));
  // last episode, as the host recaps it before this one (previously.js)
  if (ep.tdPreviously === undefined) ep.tdPreviously = writePreviously(ep);
  // what this episode leaves between people, for the episodes after it (threads.js)
  if (liveEp(ep)) { const all = Object.values(story).flatMap(c => [...(c.pre || []), ...(c.post || [])]);
    recordThreads(ep, all.filter(it => it?.kind === 'arc.warn.told').map(it => ({ teller: it.scene?.who?.a, knower: it.scene?.who?.b })), all.filter(it => it?.storyType === 'challenge')); }
  // the Exile Duel's two nights: the one sent to Exile, and the face-off (twist.js writeExile)
  if (ep.exileStory === undefined) ep.exileStory = writeExile(ep);
  // First Impressions and the auction play as dialogue on their own stepped screens (twist.js)
  if (ep.tdFirstImp === undefined) { const fi = (ep.twists || []).find(t => t.type === 'first-impressions' && t.firstImpressions?.length); ep.tdFirstImp = fi ? writeFirstImpressions(ep, fi) : null; }
  if (ep.tdAuction === undefined) { const A = (ep.twists || []).find(t => t.type === 'auction')?.auction; ep.tdAuction = A ? writeAuctionScript(ep, A) : null; }
  // the twists, as the people in them talk (twist.js; the twist screen plays them)
  if (ep.twistStory === undefined) {
    try { ep.twistStory = writeTwistStory(ep); } catch (e) { if (typeof process !== 'undefined' && process.env?.VITEST) throw e; ep.twistStory = null; }
  }
  // the classic screen's Crashout (vp-screens.js buildCrashout) reads the live game: taken now,
  // while the game is still at this episode, so a replay shows that night and not today
  if (ep.tribalStory && !ep.tribalBlowup && ep.tribalStory.crashout === undefined) {
    try { ep.tribalStory.crashout = typeof window !== 'undefined' && typeof window.buildCrashout === 'function' ? (window.buildCrashout(ep) || null) : null; } catch { ep.tribalStory.crashout = null; }
  }
  // ...and whoever it names answers back (tribal.js writeCrashReplies)
  if (ep.tribalStory && ep.tribalStory.crashReplies === undefined) {
    const swing = ep.tribalBlowup?.player === ep.eliminated ? ep.tribalBlowup : ep.tribalStory.crashout ? { ...ep.tribalStory.crashout, player: ep.eliminated } : null;
    ep.tribalStory.crashReplies = swing ? writeCrashReplies(ep, swing) : null;
  }
  // ...and the walk out remembers it: the one they just accused is who they turn round to, or their
  // friend walks them down knowing who they blame (tribal.js writeExit)
  const ts = ep.tribalStory;
  if (ts?.crashReplies?.length && !ts.exitRedone) {
    ts.exitRedone = true;
    const acc = ts.crashReplies.find(r => r.type === 'callout')?.b || null;
    let kind = ts.exitKind, b = ts.exitWith;
    if (acc && (b === acc || kind !== 'friend')) { kind = 'shot'; b = acc; }
    const ex = writeExit(ep, { elim: ep.eliminated, kind, b, revealKind: ts.revealKind, base: ts.exitBase || {}, data: { lastBoot: ep.eliminated }, blame: acc, crash: true });
    if (ex) { ts.exit = ex.lines; ts.exitWith = b; ts.exitKind = kind; }
  }
  // the last confessional: their whole game, said on the way out (the user's Disventure Camp exits:
  // "After losing Seth and Kylie, I knew I had an uphill battle... I stayed true to myself")
  if (ts && ep.eliminated && !ts.finalConf) {
    const elim = ep.eliminated;
    const gone = (gs.episodeHistory || []).filter(h => h.num < ep.num && h.eliminated && h.eliminated !== elim && getBond(elim, h.eliminated) >= 3).map(h => h.eliminated);
    const lostAlly = gone[gone.length - 1] || null;
    const told = (ep.pitchIntel || []).find(i => i.knower === elim && i.target === elim && i.believed !== false && i.pitcher)?.pitcher || null;
    const blame = told || ts.crashReplies?.find(r => r.type === 'callout')?.b || null;
    const flipped = (gs.namedAlliances || []).some(al => (al.betrayals || []).some(b0 => b0.player === elim));
    const wins = (gs.episodeHistory || []).filter(h => h.num <= ep.num && [].concat(h.immunityWinner || []).includes(elim)).length;
    const who = { a: elim };
    // led: they ran a plan of their own today, so nobody "never said a word to them about the vote" (read 2026-10-14: Ivy
    // spent the day getting Hannah on Tristan, then "when nobody's talking to you about the vote, it's because the vote is you")
    const led = (ts.booth || []).some(b0 => b0.voter === elim && b0.role === 'lead');
    const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'tribal' }), lostAlly: !!lostAlly, blame: !!blame, flipped, won: wins > 0, late: (gs.activePlayers || []).length <= 7, led };
    const d0 = { ...(lostAlly ? { lostAlly } : {}), ...(blame ? { blame } : {}) };
    const c0 = u => ({ ep: ep.num, camp: 'tribal', phase: 'tribal', n: 2900, place: 'confessional', unique: u });
    // a fresh one from the night's own pool, then any fresh one, before one comes back
    const w = writeStory('exit.final', ts.revealKind || 'any', who, d0, facts, c0(true)) || writeStory('exit.final', 'any', who, d0, facts, c0(true)) || writeStory('exit.final', ts.revealKind || 'any', who, d0, facts, c0('soft'));
    if (w) { ts.exit = [...(ts.exit || []), ...w.lines.map(l => ({ ...l, stage: 'on the way out' }))]; ts.finalConf = true; }
  }
  // how every confessional is shot, and the caption under it (captions.js)
  dressConfessionals(ep);
}
