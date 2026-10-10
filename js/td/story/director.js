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
import { classify, file, prevAired } from './storylines.js';
import { writeStory as writeRaw, hasStoryPool } from './write.js';
import { lastTribalOf, challengeOf, lossStreak, bootsBefore, dayOf } from './record.js';
import { numberWord } from '../script/write.js';
import { registerOf, factsFor } from '../script/facts.js';
import { writeTribal, whyOf as ballotWhy, writeCrashReplies, writeExit } from './tribal.js';
import { relationalReason } from '../../alliances.js';
import { dressConfessionals } from './captions.js';
import { writeTwistStory, writeExile, writeFirstImpressions, writeAuctionScript } from './twist.js';
import { needOf, psycheCast } from './psyche.js';
import { runnerDue } from './runners.js';
import { recordThreads, threadDue } from './threads.js';
import { writePreviously } from './previously.js';
import { chalMoments } from './chalmoments.js';
import { MEAL_KIND, MEAL_TYPE } from '../script/food.js';
import { placeOf, kindOf } from './places.js';
import { kitBitScene, kitLifeScene, kitClashScene, kitDeepScene, kitCallbackScene, kitSoloScene, hasKit } from './kits.js';
import { runArcs, campGame } from './arcs.js';

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
const liveEp = ep => Array.isArray(ep?.bondChanges) && ep.num === gs.episode;
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

const eventsOf = (ep, camp, phase) => {
  const block = ep.campEvents?.[camp];
  return phase === 'pre' ? (Array.isArray(block) ? block : (block?.pre || [])) : (Array.isArray(block) ? [] : (block?.post || []));
};
const saysIn = ev => [...new Set((ev?.lines || []).filter(l => l.kind === 'say' && l.by).map(l => l.by))];
const speaksIn = ev => [...new Set((ev?.lines || []).filter(l => (l.kind === 'say' || l.kind === 'conf') && l.by).map(l => l.by))];

function membersOf(ep, camp) {
  const t = (ep.tribesAtStart || []).find(x => x.name === camp);
  if (t) return [...t.members];
  // the merged camp: everybody who started the episode
  const all = (ep.tribesAtStart || []).flatMap(x => x.members || []);
  return all.length ? [...new Set(all)] : [...new Set([...(ep.tribalPlayers || []), ...eventsOf(ep, camp, 'pre').flatMap(e => e.players || [])])];
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
const GAME_TYPE = /^(idol|voteSteal|votePitch|scramble|secretFlip|betrayal|loyaltyTest|conflictingDeals|challengeThrow|stolenCredit|dealOverheard|showmance|affair|triangle|eavesdrop|infoTrade|allianceForm|allianceCrack|allianceDissolved|allianceExpelled|allianceRecruit|sideDeal|endgameDeal|spreadLies|forgeNote|whisperCampaign|falseMajority|chalThreat|sitOut|bigMoveThoughts|mergeScramble|mergeConfessional|goat|ftc|perceptionRealization|wildcardPivot)/;
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
  const who = { a: best.a, b: best.b };
  const phase = kind === 'clicked' ? 'pre' : 'post';
  const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase }), outcome: kind };
  const w = writeStory('story.firstpair', kind, who, { tribe: camp }, facts, { ep: ep.num, camp, phase, n, place: 'aside', avoid: ctxAvoid(phase === 'pre' ? 'camp-work' : 'scramble') });
  return w ? { story: true, kind: 'story.firstpair', storyType: 'firstday', step: kind, players: [best.a, best.b], lines: w.lines, text: w.text, lineId: w.lineId,
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
    if (!lately) blamed[camp] = ep.num;
    const w = writeStory('story.chal', ending, who, data, { ...facts, outcome: lately ? 'regroup' : 'blame' }, { ep: ep.num, camp, phase: 'post', n, place: 'public', avoid: ctxAvoid('return') })
      || (lately ? writeStory('story.chal', 'lost', who, data, facts, { ep: ep.num, camp, phase: 'post', n, place: 'public', avoid: ctxAvoid('return') }) : null);
    return w ? { story: true, kind: `story.chal.${ending}`, storyType: 'chal', step: ending, players: [a, b, c].filter(Boolean), lines: w.lines, text: w.text, lineId: w.lineId,
      scene: { kind: 'story.chal', who, data, spot: w.spot ? { ...w.spot, window: 'return' } : null }, badgeText: 'Who Lost It', badgeClass: 'red',
      why: [`${camp} lost${streak > 1 ? ` (${numberWord(streak)} in a row)` : ''}. ${b} had the team's lowest score; ${ch.carried} the highest.`] } : null;
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
  for (const i of warned) {
    if (seen.size >= 2 || seen.has(i.knower)) continue;
    const told = i.sourceType !== 'overheard' && i.source && i.source !== i.pitcher && here(i.source) && i.source !== i.knower;
    const who = told ? { a: i.source, b: i.knower } : { a: i.knower };
    const data = { pitcher: i.pitcher, target: i.target };
    seen.add(i.knower);
    if (t.em) t.em.warned.push({ teller: told ? i.source : null, knower: i.knower, pitcher: i.pitcher, target: i.target });
    say('arc.warn', told ? 'told' : 'overheard', who, data, 5e5 + seen.size, 'warn', ['Word Gets Around', 'blue'],
      [`${i.knower} finds out ${i.pitcher} is pushing ${i.target === i.knower ? 'their name' : i.target}.`], { self: i.target === i.knower, pitcher: true, target: true });
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
  [/^drama\.(fight|bomb|dig|clash|explode)/, 'side', 2, false],
  [/^recruit\.join/, 'members', 3, false],
];
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
  // the boot's own side first (they're sure it's someone else), then the biggest
  rivals.sort((x, y) => (y.members.includes(boot) ? 1 : 0) - (x.members.includes(boot) ? 1 : 0) || (y.members || []).length - (x.members || []).length);
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
  const count = them >= 2 ? (them >= voters.length ? 'tight' : 'close') : voters.length >= tribal.length - 1 ? 'all' : 'enough';
  const inScene = new Set(Object.values(who).filter(Boolean));
  const rest = voters.filter(v => !inScene.has(v));
  const list = n => n.length <= 1 ? n.join('') : `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`;
  // the close is work, not a quip: the shakiest vote (the plan's voter least close to a, someone who is
  // not here if possible), the name they tell camp, and why b is really in
  const shaky = [...rest].sort((x, y) => getBond(a, x) - getBond(a, y) || x.localeCompare(y))[0] || null;
  const cover = alt || (rival?.target && rival.target !== a ? rival.target : null) || outside.find(x => x !== a) || null;
  const data = { target: boot, votes: numberWord(voters.length), ...(relCase === 'isolate' ? { keep: rel.partner } : {}), ...(relCase === 'pledge' ? { protects: rel.protects } : {}), ...(shaky ? { shaky } : {}), ...(cover ? { cover } : {}), them: numberWord(them || 1), ...(mark ? { mark } : {}), ...(pair ? { partner: pair } : {}),
    ...(theirs ? { theirs } : {}), ...(alt ? { alt } : {}), ...(rest.length ? { others: list(rest) } : {}), ...(rival?.target ? { other: rival.target } : {}) };
  // the glue (the user's Disventure Camp read: "Aiden connects Gabby and Tom to Lake and Rosa. Cut him out, and
  // that group is toast"): the target is close to two people here who aren't close to each other
  const gluePair = (() => { const f = tribal.filter(x => x !== boot && !inScene.has(x) && getBond(boot, x) >= 3);
    for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) if (getBond(f[i], f[j]) < 1) return [f[i], f[j]];
    return null; })();
  if (gluePair) { data.glueA = gluePair[0]; data.glueB = gluePair[1]; }
  const facts = { ...baseFacts, count, glue: !!gluePair, shaky: !!shaky, cover: !!cover, close: !!b && getBond(a, b) >= 4, others: !!rest.length, other: !!rival?.target, markMe: mark === a, markB: !!mark && mark === b, otherMe: rival?.target === a, otherB: !!b && rival?.target === b, cast: shape };
  // what this camp's day has already shown (arcBeats, t.em): the plan can call back to it
  const em = t.em || { spark: null, warned: [] };
  const sparkSeen = !!em.spark && em.spark.by === a && em.spark.of === boot;
  const tip = em.warned.find(w => w.knower === a && w.teller && w.teller !== b) || null;
  if (tip) data.teller = tip.teller;
  // warned by the very person this plan is going after: the scene has to say so
  const fromTarget = em.warned.find(w => w.knower === a && w.teller === boot) || null;
  if (fromTarget) data.warnedAbout = fromTarget.pitcher;
  Object.assign(facts, { sparkSeen, told: !!tip, tally: count, alt: !!alt, fromTarget: !!fromTarget, sparkKind: sparkSeen ? em.spark.kind : 'none' });
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
  if (b) {
    // a scene nobody has seen this season first, then the least-aired one
    const ws = u => writeStory('vp2', caseOf, who, data, facts, { ep: ep.num, camp, phase: 'post', n: next(), place: 'secret', avoid: ctxAvoid('scramble'), unique: u });
    const whole = ws(true) || ws('soft');
    if (whole) recall(whole.lines);
    if (whole) return { story: true, kind: `story.vote.${as.step}.${caseOf}`, storyType: 'vote', step: as.step, players: [...new Set(Object.values(who).filter(Boolean))], lines: whole.lines,
      text: whole.text, lineId: whole.lineId, scene: { kind: 'story.vote', who, data, spot: whole.spot ? { ...whole.spot, window: 'scramble' } : null }, badgeText: as.badge[0], badgeClass: as.badge[1], why };
  }
  const lines = [];
  let spot = null, lineId = null;
  const beat = (pool, ending, w = who) => {
    const r = writeStory(pool, ending, w, data, facts, { ep: ep.num, camp, phase: 'post', n: next(), place: 'secret', avoid: ctxAvoid('scramble'), unique: 'soft' });
    if (!r) return false;
    if (!spot && r.spot) spot = r.spot;
    lineId = lineId || r.lineId;
    lines.push(...r.lines);
    return true;
  };
  if (shape === 'solo' || !b) {
    if (!beat('vp.solo.case', caseOf)) return null;
    beat('vp.solo.count', count);
  } else {
    beat('vp.open', shape === 'group' ? 'group' : 'duo');
    if (!beat('vp.case', caseOf)) return null;
    if (push && beat('vp.push', push)) beat('vp.answer', push);
    beat('vp.count', count);
    beat('vp.close', shape === 'group' ? 'group' : 'duo');
  }
  recall(lines);
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
  const mem = rv.members.filter(m => tribal.includes(m) && m !== rv.target && (m === boot || ballotOf(m) !== boot));
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
      // making up is not where a vote starts
      if (/thaw|amend|truce|forgiv|apolog|rekindle|celebrat|gratitude|bond/i.test(s)) return null;
      const kind = ev.scene?.kind || '';
      if (!(kind && hasStoryPool(`long.${kind}`)) && !rawFits(ev, ep, phase)) return null;
      const when = phase === 'pre' ? 'this morning' : 'this afternoon';
      // the morning after a vote: a grieves the friend b helped vote out (camp-events.js fallout.mourn).
      // Revenge when a runs the plan; when b does, b is getting rid of the person who will want it
      const fallen = ev.scene?.data?.fallen;
      if (/^fallout\.mourn/.test(kind) && fallen) {
        const mourner = ev.scene?.who?.a;
        if (mourner !== leader && mourner !== boot) return null;
        return { i, k: -1, phase, kind: mourner === leader ? 'revenge' : 'fallout', moment: when, fallen };
      }
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
  const item = (step, pool, ending, who, data, facts, place, win, badge, why) => {
    const w = writeStory(pool, ending, who, data, facts, { ep: ep.num, camp, phase: 'post', n: next(), place, avoid: ctxAvoid(win), unique: 'soft' });
    if (!w) return null;
    return { story: true, kind: `${pool}.${ending}`, storyType: 'vote', step, players: [...new Set(Object.values(who).filter(Boolean))], lines: w.lines, text: w.text, lineId: w.lineId,
      scene: { kind: 'story.vote', who, data, spot: w.spot ? { ...w.spot, window: win } : null }, badgeText: badge[0], badgeClass: badge[1], why };
  };

  // 1. every other plan, first (the user: "I'm seeing a betrayal of the majority's plan, but when did they
  // make that plan?"): each bloc that meant to write another name, up to two of them
  for (const rv of (t.rivals || []).slice(0, 2)) {
    // the people actually on that plan tonight: a member writing the boot's name is with the other side
    const { mem, a } = rivalLead(t, rv);
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
      const it = item('doubt', 'story.vote.doubt', breaker ? 'breaks' : 'holds', who, data, base(who, { cast: who.b ? shape : 'solo', wrote: !!data.wrote }), who.b ? 'aside' : 'confessional', 'scramble',
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
  const mine = ballotOf(boot);
  if (mine && mine !== boot && boot === t.gone) {
    const heard = (ep.pitchIntel || []).find(i => i.knower === boot && i.target === boot && i.believed !== false)
      || (ep.pitchCounterplay || []).filter(c => c.actor === boot).map(c => ({ pitcher: c.pitcher }))[0];
    if (heard) {
      const b = closest(boot, tribal.filter(x => x !== boot && x !== mine));
      if (b) {
        const who = { a: boot, b };
        const tip = tipFor(boot);
        const data = { wrote: mine, pitcher: heard.pitcher || leader, ...(tip && tip.teller !== b ? { teller: tip.teller } : {}) };
        // what b actually writes: b only promises the name b really writes (the user: Owen promising Mike a vote he never cast)
        const facts = base(who, { bVoted: ballotOf(b) === boot ? 'boot' : 'other', bWrote: ballotOf(b) === mine, pitcher: !!heard.pitcher, told: !!data.teller });
        const why = [`${boot} heard the votes were coming for ${pronouns(boot).obj}.`, `${boot} is pushing ${mine} instead. ${b} ${ballotOf(b) === boot ? 'is voting ' + boot : 'is not on ' + boot}.`];
        const it = item('target', 'vt2', 'scramble', who, data, facts, 'aside', 'before-tribal', ['Scramble', 'red'], why)
          || item('target', 'story.vote.target', 'scramble', who, data, facts, 'aside', 'before-tribal', ['Scramble', 'red'], why);
        if (it) out.push(it);
      }
    } else {
      // no idea: a friend who is writing their name sits with them, and keeps it from them
      // (never the person the boot is voting for: they'd be told 'tonight it's you' to their face)
      const liar = closest(boot, voters.filter(v => v !== leader && v !== mine && getBond(boot, v) >= 1 && !out.some(o => o.players.includes(v) && o.step === 'plan')));
      const why = [`${boot} thinks it's ${mine} tonight.`, `${pronouns(boot).Sub} ${pronouns(boot).sub === 'they' ? "haven't" : "hasn't"} heard ${pronouns(boot).posAdj} own name.`];
      const two = liar ? item('target', 'vt2', 'safe', { a: boot, b: liar }, { wrote: mine }, base({ a: boot, b: liar }, {}), 'aside', 'before-tribal', ['Feels Safe', 'blue'],
        [...why, `${liar} is writing ${boot}'s name.`]) : null;
      // nobody close is lying to them: they talk it over with a friend who isn't writing their name and
      // doesn't know either (the user: one-line scenes that tell nothing)
      const pal = !two ? closest(boot, tribal.filter(x => x !== boot && x !== mine && ballotOf(x) !== boot && !voters.includes(x) && getBond(boot, x) >= 1)) : null;
      const sure = pal ? item('target', 'vt2', 'sure', { a: boot, b: pal }, { wrote: mine, ...(ballotOf(pal) && ballotOf(pal) !== mine ? { other: ballotOf(pal) } : {}) },
        base({ a: boot, b: pal }, { bWrote: ballotOf(pal) === mine, other: !!(ballotOf(pal) && ballotOf(pal) !== mine) }), 'aside', 'before-tribal', ['Feels Safe', 'blue'], [...why, `${pal} isn't writing ${boot}'s name, and doesn't know either.`]) : null;
      const it = two || sure || item('target', 'story.vote.target', 'safe', { a: boot }, { wrote: mine }, base({ a: boot }, { why: ballotWhy(ballots.find(v => v.voter === boot), ep) }), 'confessional', 'before-tribal', ['Feels Safe', 'blue'], why);
      if (it) out.push(it);
    }
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
  const castOf = it => [...new Set([...Object.values(it.scene?.who || {}).filter(Boolean), ...(it.lines || []).filter(l => l.by && l.kind !== 'conf').map(l => l.by)])]
    .filter(n => n !== (seasonConfig?.host || 'Chris'));
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
      `${list(go)} ${pl ? 'find' : 'finds'} something else to do.`, `${list(go)} ${pl ? 'go' : 'goes'} to get water.`, `${list(go)} ${pl ? 'leave' : 'leaves'} without another word.`];
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
  const seasonAired = ((gs.tdStory ||= {}).aired ||= {});
  const story = {};
  let n = 0;
  for (const camp of Object.keys(ep.campEvents)) {
    const members = membersOf(ep, camp);
    const tribalTonight = !!(ep.tribalPlayers || []).some(p => members.includes(p)) && (ep.isMerge || gs.isMerged || ep.tribalTribe === camp || ep.loser?.name === camp);
    // ...which a team only knows once it has lost the challenge: before it, a line may not say
    // "tonight" unless everybody votes (the merge)
    const knowsTribal = phase => (phase === 'post' || ep.isMerge || gs.isMerged ? tribalTonight : false);
    const spoke = new Set();
    const out = { pre: [], post: [] };
    const talk = tribalTonight ? votePlan(ep, camp, members) : null;
    // the episode's memory for this camp: what the vote story has shown so far (arcBeats fills it)
    if (talk) talk.em = { spark: null, warned: [], aired: [], causes: [] };
    if (talk && (seasonConfig?.tdEdit || 'full') !== 'off') talk.cause = causeOf(ep, camp, talk);
    if (talk?.cause?.length) talk.em.causes = talk.cause;
    // ...or an old wound between them (threads.js): the plan's leader has been carrying it since
    if (talk && !talk.cause?.length) {
      const old = ((gs.tdStory ||= {}).threads || []).find(t => !t.done && t.ep < ep.num && t.a === talk.leader && t.b === talk.boot && ['wronged', 'rivals', 'grievance'].includes(t.kind))
        || ((gs.tdStory ||= {}).threads || []).find(t => !t.done && t.ep < ep.num && t.kind === 'rivals' && t.a === talk.boot && t.b === talk.leader);
      if (old) talk.em.causes = [{ by: talk.leader, of: talk.boot, kind: 'history', aired: true,
        moment: old.kind === 'grievance' ? 'the night {target} wrote my name' : old.kind === 'wronged' ? `what {target} did to me at ${old.chal}` : `everything that happened at ${old.chal}` }];
    }
    if (talk) for (const ev of eventsOf(ep, camp, 'post')) if (ev && ev.aired == null && /^votePitch/.test(ev.type || '') && talk.covers.has(ev.players?.[0])) ev.aired = 'covered';
    for (const phase of ['pre', 'post']) {
      const events = eventsOf(ep, camp, phase);
      // file every moment of the phase into its storyline
      const filed = [];
      events.forEach((ev, i) => {
        if (!ev || ev.aired != null) return;
        const c = classify(ev);
        if (!c) return;
        const { line, step } = file(c, { ep: ep.num, phase, camp, order: i });
        filed.push({ ev, i, line, step });
      });
      const list = [];
      // the spots taken in each stretch of the day, so two talks are never staged on top of each other
      const taken = {};
      const avoidIn = win => (taken[win || 'any'] ||= new Set());
      ctxAvoid = avoidIn;
      // the opener
      const swapped = (ep.twists || []).some(t => /swap|shuffle|dissolve|new-tribes|mutiny/.test(t.type || '')) && !(ep.isMerge || gs.isMerged);
      const dayOne = ep.num === 1;
      const opener = phase === 'pre' ? (dayOne ? firstDay(ep, camp, members, n++) : swapped ? firstDay(ep, camp, members, n++, 'swap') : morningAfter(ep, camp, members, n++))
        : afterChallenge(ep, camp, members, n++);
      if (opener) list.push({ at: -1, item: opener });
      // back from the Exile Duel: the winner walks into camp first thing
      if (phase === 'pre') { const dr = duelReturn(ep, camp, members, n++); if (dr) list.push({ at: -0.5, item: dr }); }
      // the auction's fallout, early in the evening
      if (phase === 'post') auctionTalk(ep, camp, members, () => n++).forEach((it, k) => list.push({ at: 0.2 + k * 0.01, item: it }));
      // day one: by the afternoon two of them have hit it off, and by the evening two of them have not
      if (dayOne) { const fp = firstPair(ep, camp, members, n++, phase === 'pre' ? 'clicked' : 'clashed'); if (fp) list.push({ at: phase === 'pre' ? 0.5 : 1e5, item: fp }); }
      // the storyline steps worth a scene
      const merged = ep.isMerge || gs.isMerged;
      // the vote story's own beats first, so the plan scenes can call back to them
      const editOn = (seasonConfig?.tdEdit || 'full') !== 'off';
      if (editOn && talk) list.push(...arcBeats(ep, camp, members, phase, talk, () => n++, list, [], 'vote'));
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
        let took = 0;
        for (const m of picks) {
          if (took >= (members.length >= 8 ? 3 : 2)) break;
          const a = m.players[0];
          const b = m.players[1] || members.filter(x => x !== a).sort((x, y) => getBond(a, y) - getBond(a, x) || x.localeCompare(y))[0];
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
          const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase, tribal: knowsTribal(phase) }), pair: true, two: m.players.length >= 2, bLikesA: getBond(b, a) >= 2, bHatesA: getBond(b, a) <= -2,
            physical: ['physical', 'endurance', 'adventure', 'hunt', 'chaos'].includes(style) };
          const w = writeStory(`chm.${m.kind}`, 'any', who, { chal }, facts, { ep: ep.num, camp, phase, n: n++, place: 'aside', avoid: ctxAvoid('afternoon'),
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
          list.push({ at: 0.25 + took * 0.01, item: { story: true, kind: `chm.${m.kind}`, storyType: 'challenge', step: m.kind, players: [a, b], lines: w.lines, text: w.text, lineId: w.lineId,
            scene: { kind: 'chm', who, data: { chal, two: m.players.length >= 2 }, spot: w.spot ? { ...w.spot, window: 'afternoon' } : null }, badgeText: m.badge, badgeClass: '', why: [`At ${chal}: ${m.badge} (${m.players.join(', ')}).`] } });
        }
        // ...and when the challenge left room, two friends replay it: the jokes, not the result (lines/n-banter.js)
        if (took < 2) {
          const inChm = new Set(list.filter(x => /^chm\./.test(x.item?.kind || '')).flatMap(x => x.item.players || []));
          const fr = [];
          for (const x of members) for (const y of members) if (x < y && !inChm.has(x) && !inChm.has(y) && getBond(x, y) >= 2) fr.push([x, y, getBond(x, y)]);
          fr.sort((p, q) => q[2] - p[2] || p[0].localeCompare(q[0]));
          for (const [x, y] of fr.slice(0, 4)) {
            const who = { a: x, b: y };
            const w = writeStory('chm.banter', 'any', who, { chal }, factsFor({ who, data: {} }, { ep: ep.num, phase }), { ep: ep.num, camp, phase, n: n++, place: 'aside', avoid: ctxAvoid('afternoon'), unique: true });
            if (!w) continue;
            list.push({ at: 0.27, item: { story: true, kind: 'chm.banter', storyType: 'challenge', step: 'banter', players: [x, y], lines: w.lines, text: w.text, lineId: w.lineId,
              scene: { kind: 'chm', who, data: { chal }, spot: w.spot ? { ...w.spot, window: 'afternoon' } : null }, badgeText: '', badgeClass: '', why: [`${x} and ${y} replay ${chal}.`], fx: [[x, y, 0.5]] } });
            break;
          }
        }
      }
      // a thread carried from an earlier episode (threads.js): one scene when one is due
      if (editOn && phase === 'pre' && ep.num > 1) {
        const td = threadDue(ep, members);
        const writesT = (x, y) => (ep.votingLog || []).some(v => v.voter === x && v.voted === y);
        // ...and a feud thread doesn't air between two people who are friends now (read: Duncan and Felipe split
        // the last bite, 'basically a vow', then fought over a bowl at breakfast in the next scene)
        const madeUp = td && td.t.kind === 'rivals' && getBond(td.t.a, td.t.b) >= 2;
        if (td && !madeUp && !(['rescue', 'debt'].includes(td.t.kind) && (writesT(td.t.a, td.t.b) || writesT(td.t.b, td.t.a)))) {
          const who = { a: td.t.a, b: td.t.b };
          const prevBoot = (gs.episodeHistory || []).find(h => h.num === td.t.ep)?.eliminated || null;
          const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase }), pair: true, how: td.t.how || 'vote', lastBoot: !!prevBoot, ago: ep.num - td.t.ep <= 1 ? 'recent' : 'while' };
          const w = writeStory(`thr.${td.t.kind}`, td.stage, who, { ...(prevBoot ? { lastBoot: prevBoot } : {}), ...(td.t.chal ? { chal: td.t.chal } : {}) }, facts, { ep: ep.num, camp, phase, n: n++, place: 'aside', avoid: ctxAvoid('morning'), unique: 'soft' });
          if (w) {
            td.commit();
            list.push({ at: 0.45, item: { story: true, kind: `thr.${td.t.kind}.${td.stage}`, storyType: 'thread', step: td.stage, players: [td.t.a, td.t.b], lines: w.lines, text: w.text, lineId: w.lineId,
              scene: { kind: 'thr', who, data: {}, spot: w.spot ? { ...w.spot, window: 'morning' } : null }, badgeText: THREAD_BADGE[td.t.kind][0], badgeClass: THREAD_BADGE[td.t.kind][1],
              why: [THREAD_WHY[td.t.kind](td.t)] } });
          }
        }
      }
      // a running gag (runners.js): one beat when it's due, before the challenge
      if (editOn && phase === 'pre') {
        const rd = runnerDue(ep, members);
        if (rd) {
          const foil = members.filter(m => m !== rd.name).sort((x, y) => getBond(rd.name, y) - getBond(rd.name, x) || x.localeCompare(y));
          const who = { a: rd.name, ...(foil[0] ? { b: foil[0] } : {}), ...(foil[1] ? { c: foil[1] } : {}) };
          const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase }), third: !!who.c, pair: !!who.b, call: rd.call || 0 };
          const w = writeStory(`run.${rd.kind}`, String(rd.stage), who, {}, facts, { ep: ep.num, camp, phase, n: n++, place: 'public', avoid: ctxAvoid('afternoon'), unique: 'soft' });
          if (w) {
            rd.commit();
            list.push({ at: 0.8, item: { story: true, kind: `run.${rd.kind}.${rd.stage}`, storyType: 'comedy', step: String(rd.stage), players: Object.values(who), lines: w.lines, text: w.text, lineId: w.lineId,
              scene: { kind: 'run', who, data: {}, spot: w.spot ? { ...w.spot, window: 'afternoon' } : null }, badgeText: 'Meanwhile', badgeClass: '', why: [`${rd.name}'s running gag.`] } });
          }
        }
      }
      // the C-story: one person's inner life, before the challenge (psyche.js)
      if (editOn && phase === 'pre' && ep.num > 1) {
        const pc = psycheCast(ep, members);
        if (pc) {
          const need = needOf(pc.name);
          const conf = members.filter(m => m !== pc.name && getBond(pc.name, m) >= 3).sort((x, y) => getBond(pc.name, y) - getBond(pc.name, x) || x.localeCompare(y))[0] || null;
          const who = { a: pc.name, ...(conf ? { b: conf } : {}) };
          const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase }), moment: pc.moment, lastBoot: !!pc.lastBoot, pair: !!conf };
          const w = writeStory('psy', need, who, pc.lastBoot ? { lastBoot: pc.lastBoot } : {}, facts, { ep: ep.num, camp, phase, n: n++, place: 'aside', avoid: ctxAvoid('afternoon'), unique: 'soft' });
          if (w) {
            ((gs.tdStory ||= {}).psySeen ||= {})[pc.name] = ep.num;
            list.push({ at: 0.6, item: { story: true, kind: `psy.${need}`, storyType: 'psyche', step: pc.moment, players: Object.values(who), lines: w.lines, text: w.text, lineId: w.lineId,
              scene: { kind: 'psy', who, data: {}, spot: w.spot ? { ...w.spot, window: 'afternoon' } : null }, badgeText: 'In Their Head', badgeClass: 'teal', why: [`${pc.name}: ${need}.`] } });
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
          const w = writeStory(`deep.${kind}`, 'any', who, data, { ...factsFor({ who, data: {} }, { ep: ep.num, phase, tribal: knowsTribal(phase) }), merged, ...more }, { ep: ep.num, camp, phase, n: n++, place: 'confessional', unique: 'soft' });
          if (w) list.push({ at: 7e5, item: { story: true, kind: `deep.${kind}`, storyType: 'conf', step: kind, players: [a], lines: w.lines, text: w.text, lineId: w.lineId,
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
      votes.forEach((it, k) => list.push({ at: 8e5 + k, item: it }));
      const cap = (phase === 'pre' ? (merged ? 4 : 3) : tribalTonight ? (merged ? 5 : 4) : 2) - Math.min(2, Math.max(0, votes.length - 1));
      const onScreen = {};
      [opener, ...votes].forEach(it => it?.players.forEach(p => { onScreen[p] = (onScreen[p] || 0) + 1; }));
      const score = f => dramaOf(f.line.type, f.step.step)
        + (f.line.steps.some(s => s.aired) ? 3 : 0)
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
      const lifeTake = editOn ? ranked.filter(f => LIFE.test(f.line.type)).slice(0, phase === 'pre' ? 2 : 1) : [];
      const order = [...lifeTake, ...ranked.filter(f => !lifeTake.includes(f))];
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
      for (const f of order) {
        if (chosen.length >= cap + lifeTake.length) break;
        if (editOn && clashes(f)) continue;
        if (usedLines.has(f.line)) continue;
        const cast = [f.step.roles.a, f.step.roles.b, f.step.roles.c].filter(Boolean);
        if (cast.some(p => (onScreen[p] || 0) >= 2)) continue;
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
              ? rest.filter(m => getBond(who.b, m) >= 3).sort((x, y) => getBond(who.b, y) - getBond(who.b, x) || x.localeCompare(y))
              : how === 'members' ? rest.filter(m => al?.members?.includes(m)).sort((x, y) => getBond(who.a, y) - getBond(who.a, x) || x.localeCompare(y))
              : rest.filter(m => getBond(who.a, m) >= 1 && getBond(who.b, m) >= 1).sort((x, y) => both(y) - both(x) || x.localeCompare(y));
            const joins = mates.length > 0 && (!needsGroup || shapeFor(who.a, closeTo(who.a, rest)) === 'group');
            if (joins) mates.slice(0, most).forEach((m, k) => { who[['c', 'd', 'e'][k]] = m; });
          }
        }
        const prev = line && step ? prevAired(line, step) : null;
        const rec = recordSlots(ep, who.a, who.b, camp, phase);
        // who they were to each other before the season (siblings, exes, an old betrayal)
        const hist = historyOf(who.a, who.b);
        const data = { ...rec.data, ...hist.data, ...(ev.scene?.data || {}) };
        const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase, tribal: knowsTribal(phase) }), ...(ev.scene?.facts || {}), ...rec.facts,
          ...Object.fromEntries(['ending', 'result', 'intent', 'reason', 'again', 'size'].filter(k => ev.scene?.data?.[k] != null).map(k => [k, ev.scene.data[k]])),
          ...Object.fromEntries(['rival', 'friend', 'threat', 'weak', 'group', 'plan', 'boot', 'wrote', 'fallen', 'more', 'betrayer', 'holder', 'wins', 'other', 'target', 'mine', 'theirs'].map(k => [k, !!data[k]])),
          story: line?.type || 'cut', step: step?.step || 'cut', prev: prev ? prev.step : 'none', chapter: line ? Math.min(3, line.steps.filter(s => s.aired).length + 1) : 1,
          prevGap: prev ? (ep.num - prev.ep >= 3 ? 'long' : ep.num === prev.ep ? 'same' : 'recent') : 'none',
          tribal: knowsTribal(phase), phase, third: !!who.c, known: !!data.target && !Object.values(who).includes(data.target),
          registerC: who.c ? registerOf(who.c) : null, ...allianceFacts(ev, who, data), hist: hist.facts.hist };
        const w = writeStory(pool, ending, who, data, facts, { ep: ep.num, camp, phase, n: n++, place: 'aside', spotId: ev.scene?.spot?.id || ev.access?.locationId || null, avoid: ctxAvoid(ev.scene?.spot?.window || ev.access?.windowId) });
        if (!w) return null;
        // a public moment has an audience (the user: "a social bomb, but no one in the background and
        // no one reacted"): when nobody but a and b spoke, the people around them react, the one
        // closer to b first (defending b, or just mortified), then one closer to a
        let lines = w.lines;
        const watched = [];
        // ...and the camp is there: the scene opens with them in earshot, so the stage brings them on
        if (PUBLIC.test(kind) && who.a && who.b && !lines.slice(0, 2).some(l => CROWD_WORDS.test(l.text || ''))) {
          const OPEN = ['The rest of the camp has stopped what they are doing to watch.', 'Everybody nearby can hear every word.', 'Half the camp is close enough to hear every word.'];
          lines = [{ kind: 'beat', text: OPEN[(ep.num + i) % OPEN.length] }, ...lines];
        }
        // the reactions go in before the scene's closing confessional(s), not after them
        const tailAt = (() => { let k = lines.length; while (k > 0 && lines[k - 1].kind === 'conf') k--; return k; })();
        const insert = more => { const t = tailAt + (lines.length - tailAt === 0 ? 0 : 0); lines = [...lines.slice(0, t), ...more, ...lines.slice(t)]; };
        const fam = NOTE_FAM(kind);
        if (PUBLIC.test(kind) && who.a && who.b && !lines.some(l => l.by && l.by !== who.a && l.by !== who.b)) {
          const lean = x => (getBond(x, who.b) - getBond(x, who.a));
          const around = members.filter(m => !Object.values(who).includes(m));
          const forB = [...around].sort((x, y) => lean(y) - lean(x) || x.localeCompare(y))[0] || null;
          const forA = around.filter(x => x !== forB).sort((x, y) => lean(x) - lean(y) || x.localeCompare(y))[0] || null;
          // somebody steps in only when it was an attack: a brag or a boast just gets watched
          if (forB && (fam === 'fight' || fam === 'credit')) {
            const ww = { a: who.a, b: who.b, c: forB, ...(forA ? { d: forA } : {}) };
            const tone = lean(forB) >= 1 ? 'defend' : getBond(forB, who.a) >= 3 ? 'excuse' : 'awkward';
            const r = writeStory('public.react', tone, ww, data, { ...facts, third: true, fourth: !!forA, registerC: registerOf(forB) },
              { ep: ep.num, camp, phase, n: n++, place: 'aside', unique: 'soft' });
            if (r) { insert(r.lines); watched.push(forB, ...(forA && r.lines.some(l => l.by === forA) ? [forA] : [])); }
          }
          // ...and somebody watching takes it in: what everybody now knows about a
          const sharp = around.filter(x => x !== forB && x !== forA).sort((x, y) => ((pStatsOf(y)?.intuition || 0) + (pStatsOf(y)?.strategic || 0)) - ((pStatsOf(x)?.intuition || 0) + (pStatsOf(x)?.strategic || 0)) || x.localeCompare(y))[0];
          if (sharp) {
            const wn = { a: sharp, b: who.a, c: who.b };
            const nt = writeStory(`public.note.${NOTE_FAM(kind)}`, 'any', wn, data, { ...factsFor({ who: wn, data: {} }, { ep: ep.num, phase }), third: true }, { ep: ep.num, camp, phase, n: n++, place: 'confessional', unique: 'soft' });
            if (nt) { lines = [...lines, ...nt.lines]; watched.push(sharp); }
          }
        }
        return { story: true, kind: pool, storyType: line?.type || 'cut', step: step?.step || 'cut', ...(line ? { storyline: line.id } : { cut: true }), ref: i, type: ev.type,
          players: [...new Set([...Object.values(who).filter(Boolean), ...(ev.players || []), ...watched])],
          lines, text: lines.map(l => l.text).join(' '), lineId: w.lineId, scene: { kind, who: castOnly(who, w), data, spot: w.spot ? { window: ev.scene?.spot?.window || ev.access?.windowId || null, ...w.spot } : (ev.scene?.spot || null) }, access: ev.access || null,
          alliance: ev.alliance, members: ev.members, advType: ev.advType, badgeText: ev.badgeText || '', badgeClass: ev.badgeClass || '',
          why: whyOf(kind, ending, line ? `${line.type}.${step.step}` : '', who, data, facts), bondDelta: ev.bondDelta || null };
      };
      for (const f of chosen) {
        const { ev, i, line, step } = f;
        const item = longScene(ev, i, line, step);
        if (!item && (!rawFits(ev, ep, phase) || !rawFull(ev))) continue;
        step.aired = true;
        ev.aired = true;
        seasonAired[`${line.type}.${step.step}`] = (seasonAired[`${line.type}.${step.step}`] || 0) + 1;
        list.push({ at: i, item: item || { ref: i, storyline: line.id } });
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
            const b = members.filter(m => m !== a && m !== lastB).sort((x, y) => getBond(a, y) - getBond(a, x) || x.localeCompare(y))[0];
            if (!b) break;
            const who = { a, b };
            const w = kitBitScene(a, b, factsFor({ who, data: {} }, { ep: ep.num, phase }), { ep: ep.num, camp, phase, n: n++, place: 'aside' });
            if (!w) continue;
            book[a] = ep.num; gs.tdStory.kitBitWith[a] = b;
            list.push({ at: 0.35, item: { story: true, kind: 'kit.bit', storyType: 'kit', step: 'bit', players: [a, b], lines: w.lines, text: w.text, lineId: w.lineId,
              scene: { kind: 'kit', who, data: {}, spot: w.spot || null }, badgeText: '', badgeClass: '', why: [`${a}'s own thing, and ${b} has opinions about it.`], fx: [[a, b, 0.5]] } });
            break;
          }
          const kitItem = (kind, step, players, w, who, why, fx = []) => list.push({ at: kind === 'kit.call' ? 0.4 : 0.38, item: { story: true, kind, storyType: 'kit', step, players, lines: w.lines, text: w.text, lineId: w.lineId,
            scene: { kind: 'kit', who, data: {}, spot: w.spot || null }, badgeText: '', badgeClass: '', why: [why], fx } });
          // a mentor arc over three episodes (lines/n-mentor.js): somebody struggling at a skill, somebody good at it
          // who offers, the practice, and the day they do it alone. One at a time, two a season, and it ends if
          // either of them leaves. The skill is the mentor's strongest (the user's read: Anastasia teaching Rosa fire).
          {
            const M = ((gs.tdStory ||= {}).mentor ||= { arcs: 0, cur: null });
            const STEPS = ['offer', 'practice', 'done'];
            const SKILL = { endurance: 'making fire', physical: 'climbing', mental: 'tying the shelter knots', intuition: 'fishing', social: 'fishing', strategic: 'tying the shelter knots' };
            const st = x => { try { return pStatsOf(x) || {}; } catch { return {}; } };
            // it ends when one of them has left the game, not when this camp is somebody else's
            const alive = new Set(gs.activePlayers || []);
            if (M.cur && (!alive.has(M.cur.a) || !alive.has(M.cur.b))) M.cur = null;
            if (!M.cur && M.arcs < 2 && ep.num >= 2 && !merged) {
              const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'underdog', 'goat', 'showmancer', 'perceptive-player', 'floater']);
              const archOf = x => (players.find(p => p.name === x) || {}).archetype;
              for (const key of ['endurance', 'physical', 'mental']) {
                const learner = [...members].sort((x, y) => (st(x)[key] ?? 5) - (st(y)[key] ?? 5) || x.localeCompare(y))[0];
                const teacher = members.filter(x => x !== learner && NICE.has(archOf(x)) && getBond(x, learner) >= 0 && (st(x)[key] ?? 5) - (st(learner)[key] ?? 5) >= 3)
                  .sort((x, y) => (st(y)[key] ?? 5) - (st(x)[key] ?? 5) || x.localeCompare(y))[0];
                if (learner && teacher) { M.cur = { a: teacher, b: learner, skill: SKILL[key], step: 0, last: -1 }; M.arcs++; break; }
              }
            }
            if (M.cur && M.cur.last < ep.num && members.includes(M.cur.a) && members.includes(M.cur.b)) {
              const step = STEPS[M.cur.step];
              const who = { a: M.cur.a, b: M.cur.b };
              const w = writeStory('arc.mentor', step, who, { skill: M.cur.skill }, factsFor({ who, data: {} }, { ep: ep.num, phase }), { ep: ep.num, camp, phase, n: n++, place: 'aside', unique: 'soft' });
              if (w) {
                M.cur.last = ep.num; M.cur.step++;
                list.push({ at: 0.33, item: { story: true, kind: `arc.mentor.${step}`, storyType: 'arc', step, players: [who.a, who.b], lines: w.lines, text: w.text, lineId: w.lineId,
                  scene: { kind: 'arc', who, data: { skill: M.cur.skill }, spot: w.spot || null }, badgeText: '', badgeClass: '', why: [`${who.a} is teaching ${who.b} ${M.cur.skill}.`], fx: [[who.a, who.b, 1]] } });
                if (M.cur.step >= STEPS.length) M.cur = null;
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
            const w = kitClashScene(a, b, factsFor({ who, data: {} }, { ep: ep.num, phase }), { ep: ep.num, camp, phase, n: n++, place: 'aside' });
            if (!w) continue;
            book[a] = ep.num;
            kitItem('kit.clash', 'clash', [a, b], w, who, `${b} can't stand ${a}, and today it came out.`, [[a, b, -1]]);
            break;
          }
          // a running bit, called back by two others (every other day, once it has aired)
          if (ep.num % 2 === 0) for (const about of kitted) {
            const [c, d] = members.filter(m => m !== about).sort((x, y) => getBond(about, x) - getBond(about, y) || x.localeCompare(y));
            if (!c || !d) break;
            const who = { a: c, b: d };
            const w = kitCallbackScene(c, d, about, factsFor({ who, data: {} }, { ep: ep.num, phase }), { ep: ep.num, camp, phase, n: n++, place: 'aside' });
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
            const w = kitDeepScene(a, b, factsFor({ who, data: {} }, { ep: ep.num, phase }), { ep: ep.num, camp, phase, n: n++, place: 'secret' });
            if (!w) continue;
            list.push({ at: 0.55, item: { story: true, kind: 'kit.deep', storyType: 'kit', step: 'deep', players: [a, b], lines: w.lines, text: w.text, lineId: w.lineId,
              scene: { kind: 'kit', who, data: {}, spot: w.spot || null }, badgeText: '', badgeClass: '', why: [`${a} trusts ${b} with something real.`], fx: [[a, b, 1.5]] } });
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
            const w = kitLifeScene(a, b, factsFor({ who, data: {} }, { ep: ep.num, phase }), { ep: ep.num, camp, phase, n: n++, place: 'aside' });
            if (!w) continue;
            book[a] = ep.num;
            list.push({ at: 0.5, item: { story: true, kind: 'kit.life', storyType: 'kit', step: 'life', players: [a, b], lines: w.lines, text: w.text, lineId: w.lineId,
              scene: { kind: 'kit', who, data: {}, spot: w.spot || null }, badgeText: '', badgeClass: '', why: [`${a} and ${b} get to know each other.`], fx: [[a, b, 1]] } });
            break;
          }
        }
      }
      // stories that run across episodes (arcs.js: revenge for a friend, the friend who won't let go, envy,
      // the one who coasts, learning to talk to people, a showmance for the numbers), the camp's free time
      // (four people and a game, every other episode), and one person alone with the camera in the afternoon
      // (kits-solo.js, the least recently alone first). On top of the caps, like the kit scenes.
      // The merge episode is its own story (the merge, everybody in one camp, the busiest night of the season,
      // 21-24 scenes without these): the arcs wait a day and there is no game or solo.
      if (editOn && !ep.isFinale && !ep.isMerge) {
        const writeHere = (p, o, w, d, f, c) => writeStory(p, o, w, d, f, { ...c, avoid: ctxAvoid(phase === 'pre' ? 'afternoon' : 'evening') });
        // the mentor arc counts against the same room: two serial stories a phase is plenty
        const arcsNow = list.filter(x => x.item?.storyType === 'arc').length;
        // after the merge every night is a tribal night for the one camp, and the vote talk fills the evening
        // (11-14 scenes), so the morning keeps less room for colour
        const ROOM = merged && tribalTonight ? 7 : 10;
        list.push(...runArcs(ep, camp, members, phase, () => n++, writeHere, Math.max(0, Math.min(2 - arcsNow, ROOM + 2 - list.length))));
        const busyNow = new Set(list.flatMap(x => x.item?.players || []).filter(Boolean));
        // the game and the solo are colour: they air only while the phase has room (a merge night, one camp
        // holding everybody, already fills a show's worth; tests/td-story.test.js 'show-sized episode')
        const g = list.length < ROOM ? campGame(ep, camp, members, phase, () => n++, writeHere, busyNow) : null;
        if (g) list.push(g);
        if (phase === 'post' && list.length < ROOM) {
          const soloBook = ((gs.tdStory ||= {}).soloLast ||= {});
          // somebody not already in a scene this afternoon first, then the rest
          const loners = members.filter(m => hasKit(m)).sort((x, y) => (busyNow.has(x) ? 1 : 0) - (busyNow.has(y) ? 1 : 0) || (soloBook[x] ?? -99) - (soloBook[y] ?? -99) || x.localeCompare(y));
          for (const a of loners) {
            const w = kitSoloScene(a, factsFor({ who: { a }, data: {} }, { ep: ep.num, phase }), { ep: ep.num, camp, phase, n: n++, place: 'aside' });
            if (!w) continue;
            soloBook[a] = ep.num;
            list.push({ at: 0.47, item: { story: true, kind: 'kit.solo', storyType: 'kit', step: 'solo', players: [a], lines: w.lines, text: w.text, lineId: w.lineId,
              scene: { kind: 'kit', who: { a }, data: {}, spot: w.spot || null }, badgeText: '', badgeClass: '', why: [`${a}, on ${pronouns(a).posAdj} own.`] } });
            break;
          }
        }
      }
      // what the director's own scenes did to the people in them (fx above: kits, banter, mentor, arcs, games)
      applyStoryFx(ep, list);
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
          ev.aired = true; tookR++;
          list.push({ at: 0.3 + tookR * 0.01, item });
        }); }
      // what tonight's plan comes from (causeOf) airs on top of the caps: the plan calls back to it
      for (const c of (talk?.cause || []).filter(c => c.phase === phase)) {
        const ev = events[c.i];
        if (!ev || ev.aired != null) continue;
        // the morning's own scene already has the mourner grieving
        if ((c.kind === 'revenge' || c.kind === 'fallout') && opener?.players?.includes(ev.scene?.who?.a)) continue;
        const item = longScene(ev, c.i);
        ev.aired = true;
        list.push({ at: c.i, item: item ? { ...item, why: [...(item.why || []), `This is where ${c.of} becomes ${c.by}'s target.`] } : { ref: c.i } });
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
          events[gi].aired = true;
          const k = list.findIndex(x => x.item === opener);
          const item = { ...g, why: opener.why || g.why };
          if (k >= 0) list[k] = { at: -1, item }; else list.push({ at: -1, item });
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
          ev.aired = true;
          groupN++;
          list.push({ at: i, item: item || { ref: i } });
        }
      }
      const shown = new Set(list.flatMap(x => x.item.players || speaksIn(events[x.item.ref])));
      const cuts = events.map((ev, i) => ({ ev, i })).filter(({ ev }) => ev && !ev.aired && !dup(ev) && saysIn(ev).length && (ev.lines || []).length <= 7 && rawFits(ev, ep, phase))
        .sort((x, y) => saysIn(y.ev).filter(p => !shown.has(p)).length - saysIn(x.ev).filter(p => !shown.has(p)).length || x.i - y.i);
      const cutCap = Math.max(0, (phase === 'pre' ? 3 : votes.length >= 3 ? 1 : 2) - groupN);
      let cutN = 0;
      // the same kind of moment between the same people (a threat confessional about the same rival)
      // rests three episodes: the same thought aired again reads as a loop
      const topic = ev => `${ev.type}:${[...(ev.players || [])].sort().join('|')}`;
      const rested = ev => ep.num - (seasonAired['cut:' + topic(ev)] ?? -99) < 3;
      for (const { ev, i } of cuts) {
        if (cutN >= cutCap) break;
        if (!saysIn(ev).some(p => !shown.has(p)) || rested(ev)) continue;
        if (editOn && clashes({ ev, step: { roles: {} } })) continue;
        const item = longScene(ev, i);
        if (!item && !rawFull(ev)) continue;
        seasonAired['cut:' + topic(ev)] = ep.num;
        ev.aired = true;
        cutN++;
        (item ? item.players : saysIn(ev)).forEach(p => shown.add(p));
        list.push({ at: i, item: item || { ref: i } });
      }
      // ...and the coverage pass below does not bring the duplicate back
      events.forEach(ev => { if (ev && !ev.aired && dup(ev)) ev.aired = 'covered'; });
      // the vote told across the day: its spark, the warnings, the advantage decisions, an unseen
      // alliance (arcBeats); seasonConfig.tdEdit 'off' leaves the day as the engine's moments alone
      if ((seasonConfig?.tdEdit || 'full') !== 'off') {
        // the story beats are added on top: the free scenes keep their room (the user, 2026-10-08)
        // what already aired this morning, quick cuts read from their engine event
        const morning = phase === 'post' ? (out.pre || []).map(it => it.lines ? it : { kind: eventsOf(ep, camp, 'pre')[it.ref]?.type || '', players: eventsOf(ep, camp, 'pre')[it.ref]?.players || [] }) : [];
        list.push(...arcBeats(ep, camp, members, phase, talk, () => n++, list, morning, 'ally'));
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
    // the refs that were added late go back into the camp's own order
    for (const phase of ['pre', 'post']) {
      const VOTE_AT = { other: 2e6, plan: 2.1e6, cover: 2.15e6, swing: 2.2e6, doubt: 2.25e6, decoy: 2.28e6, target: 2.3e6 };
      const at = it => (/^(story\.(firstday|morning|chal)|long\.crowd\.(won|lost))/.test(it.kind || '') ? -1 : it.kind === 'story.firstpair' ? (it.step === 'clicked' ? 0.5 : 1e5) : it.storyType === 'vote' ? VOTE_AT[it.step] : it.ref != null ? it.ref : 1e6);
      out[phase].sort((x, y) => at(x) - at(y));
      // one stretch of the day, not a stack of cut-off scenes (the user: "do we have conversation when
      // people jump in"): scenes that share a person run on from each other at the same spot
      out[phase] = chainScenes(ep, camp, phase, out[phase], () => n++);
      // nobody stands on stage through a scene that never speaks to them or of them: the viewer stages
      // scene.who (the user, 2026-10-10: "it's a 4 person scene but no one talking but the 2 girls").
      // The morning, the challenge's aftermath and the psyche beats cast more people than their lines use.
      for (const it of out[phase]) {
        if (!it?.story || !it.scene?.who || !Array.isArray(it.lines) || !it.lines.length) continue;
        const inIt = n => it.lines.some(l => l.by === n || String(l.text || '').includes(n));
        it.scene = { ...it.scene, who: Object.fromEntries(Object.entries(it.scene.who).filter(([r, n]) => n && (r === 'a' || inIt(n)))) };
      }
    }
    story[camp] = out;
  }
  ep.campStory = story;
  // the night's words: every voter in the booth, the reading, last words, after (tribal.js)
  if (!ep.tribalStory) ep.tribalStory = writeTribal(ep);
  // last episode, as the host recaps it before this one (previously.js)
  if (ep.tdPreviously === undefined) ep.tdPreviously = writePreviously(ep);
  // what this episode leaves between people, for the episodes after it (threads.js)
  { const all = Object.values(story).flatMap(c => [...(c.pre || []), ...(c.post || [])]);
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
    const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'tribal' }), lostAlly: !!lostAlly, blame: !!blame, flipped, won: wins > 0, late: (gs.activePlayers || []).length <= 7 };
    const d0 = { ...(lostAlly ? { lostAlly } : {}), ...(blame ? { blame } : {}) };
    const c0 = u => ({ ep: ep.num, camp: 'tribal', phase: 'tribal', n: 2900, place: 'confessional', unique: u });
    // a fresh one from the night's own pool, then any fresh one, before one comes back
    const w = writeStory('exit.final', ts.revealKind || 'any', who, d0, facts, c0(true)) || writeStory('exit.final', 'any', who, d0, facts, c0(true)) || writeStory('exit.final', ts.revealKind || 'any', who, d0, facts, c0('soft'));
    if (w) { ts.exit = [...(ts.exit || []), ...w.lines.map(l => ({ ...l, stage: 'on the way out' }))]; ts.finalConf = true; }
  }
  // how every confessional is shot, and the caption under it (captions.js)
  dressConfessionals(ep);
}
