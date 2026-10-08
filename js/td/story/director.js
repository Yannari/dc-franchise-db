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
import { gs, players } from '../../core.js';
import { getBond } from '../../bonds.js';
import { kinshipBetween } from '../../core.js';
import { pronouns, pStats as pStatsOf, threatScore } from '../../players.js';
import { voiceOf } from './voice.js';
import { classify, file, prevAired } from './storylines.js';
import { writeStory as writeRaw, hasStoryPool } from './write.js';
import { lastTribalOf, challengeOf, lossStreak, bootsBefore } from './record.js';
import { numberWord } from '../script/write.js';
import { registerOf, factsFor } from '../script/facts.js';
import { writeTribal, whyOf as ballotWhy } from './tribal.js';
import { writeTwistStory } from './twist.js';
import { MEAL_KIND, MEAL_TYPE } from '../script/food.js';
import { placeOf } from './places.js';

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
    const a = loud || (ch.carried !== b ? ch.carried : ch.order[0]);
    if (!a || a === b) return null;
    const c = members.filter(m => m !== a && m !== b).sort((x, y) => getBond(b, y) - getBond(b, x) || x.localeCompare(y))[0] || null;
    const who = { a, b, c };
    const streak = lossStreak(camp, ep.num, ep);
    const data = { sank: b, carried: ch.carried !== a ? ch.carried : null, streak: numberWord(streak), tribe: camp };
    if (!data.carried) delete data.carried;
    const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'post' }), outcome: 'blame', third: !!c, carriedA: ch.carried === a,
      carried: !!data.carried, streak: streak >= 3 ? 'many' : streak === 2 ? 'two' : 'one', registerB: registerOf(b) };
    const w = writeStory('story.chal', 'lost', who, data, facts, { ep: ep.num, camp, phase: 'post', n, place: 'public', avoid: ctxAvoid('return') });
    return w ? { story: true, kind: 'story.chal.lost', storyType: 'chal', step: 'lost', players: [a, b, c].filter(Boolean), lines: w.lines, text: w.text, lineId: w.lineId,
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
  const rival = rivals.find(al => al.members.includes(boot)) || rivals[0] || null;
  const counter = (ep.votePitches || []).find(p => p !== pitch && p.pitchTarget !== boot && tribal.includes(p.pitcher) && tribal.includes(p.pitchTarget));
  const covers = new Set([pitch?.pitcher, counter?.pitcher].filter(Boolean));
  return { boot, gone, tribal, ballots, onBoot, voters, pitch, bloc, leader, why, other, ch, rival, counter, covers };
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

  // 1. the other side's plan, first: it is the one that does not happen
  const rv = t.rival;
  if (rv) {
    // the people actually on that plan tonight: a member writing the boot's name is with the other side
    const mem = rv.members.filter(m => tribal.includes(m) && m !== rv.target && (m === boot || ballotOf(m) !== boot));
    const a = mem.includes(boot) ? boot : [...mem].sort((x, y) => (pStatsOf(y)?.strategic || 0) - (pStatsOf(x)?.strategic || 0) || x.localeCompare(y))[0];
    // the same three ways of working as the plan below (shapeFor)
    const oShape = shapeFor(a, closeTo(a, mem));
    const b = oShape === 'solo' ? null : oShape === 'group' ? closeTo(a, mem)[0] : closest(a, mem.filter(m => m !== a));
    const c = oShape === 'group' ? closeTo(a, mem)[1] || null : null;
    if (a) {
      const g = b ? groupOf(a, b) : null;
      const data = { target: rv.target, ...(g ? { group: g } : {}) };
      const who = { a, b, c };
      const it = item('other', 'story.vote.other', a === boot ? 'boot' : 'losing', who, data, base(who, { group: !!g, cast: oShape }), 'secret', 'scramble', ['Other Plan', 'blue'],
        [`${mem.join(', ')} planned to vote ${rv.target}.`, a === boot ? `${boot} has no idea the numbers are on ${pronouns(boot).obj}.` : `They don't have the numbers.`]);
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
      const it = item('plan', 'story.vote.plan', why, who, data, facts, 'secret', 'scramble', ['The Plan', 'gold'],
        [`The plan is ${boot}: ${WHY_WORDS[why]}.`, reason, `${numberWord(voters.length)} votes: ${voters.join(', ')}.`]);
      if (it) out.push(it);
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

  // 4. the target: scrambling if word reached them, sure of their own name if it did not
  const mine = ballotOf(boot);
  if (mine && mine !== boot && boot === t.gone) {
    const heard = (ep.pitchIntel || []).find(i => i.knower === boot && i.target === boot && i.believed !== false)
      || (ep.pitchCounterplay || []).filter(c => c.actor === boot).map(c => ({ pitcher: c.pitcher }))[0];
    if (heard) {
      const b = closest(boot, tribal.filter(x => x !== boot && x !== mine));
      if (b) {
        const who = { a: boot, b };
        const it = item('target', 'story.vote.target', 'scramble', who, { wrote: mine, pitcher: heard.pitcher || leader }, base(who, { bVoted: ballotOf(b) === boot ? 'boot' : 'other', pitcher: !!heard.pitcher }),
          'aside', 'before-tribal', ['Scramble', 'red'], [`${boot} heard the votes were coming for ${pronouns(boot).obj}.`, `${boot} is pushing ${mine} instead. ${b} ${ballotOf(b) === boot ? 'is voting ' + boot : 'is not on ' + boot}.`]);
        if (it) out.push(it);
      }
    } else {
      const who = { a: boot };
      const it = item('target', 'story.vote.target', 'safe', who, { wrote: mine }, base(who, { why: ballotWhy(ballots.find(v => v.voter === boot), ep) }), 'confessional', 'before-tribal', ['Feels Safe', 'blue'],
        [`${boot} thinks it's ${mine} tonight.`, `${pronouns(boot).Sub} ${pronouns(boot).sub === 'they' ? "haven't" : "hasn't"} heard ${pronouns(boot).posAdj} own name.`]);
      if (it) out.push(it);
    }
  }
  return out;
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
      // day one: by the afternoon two of them have hit it off, and by the evening two of them have not
      if (dayOne) { const fp = firstPair(ep, camp, members, n++, phase === 'pre' ? 'clicked' : 'clashed'); if (fp) list.push({ at: phase === 'pre' ? 0.5 : 1e5, item: fp }); }
      // the storyline steps worth a scene
      const merged = ep.isMerge || gs.isMerged;
      const votes = phase === 'post' && talk ? voteTalk(ep, camp, talk, () => n++) : [];
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
      for (const f of ranked) {
        if (chosen.length >= cap) break;
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
        return { story: true, kind: pool, storyType: line?.type || 'cut', step: step?.step || 'cut', ...(line ? { storyline: line.id } : { cut: true }), ref: i, type: ev.type,
          players: [...new Set([...Object.values(who).filter(Boolean), ...(ev.players || [])])],
          lines: w.lines, text: w.text, lineId: w.lineId, scene: { kind, who, data, spot: w.spot ? { window: ev.scene?.spot?.window || ev.access?.windowId || null, ...w.spot } : (ev.scene?.spot || null) }, access: ev.access || null,
          alliance: ev.alliance, members: ev.members, advType: ev.advType, badgeText: ev.badgeText || '', badgeClass: ev.badgeClass || '',
          why: whyOf(kind, ending, line ? `${line.type}.${step.step}` : '', who, data, facts), bondDelta: ev.bondDelta || null };
      };
      for (const f of chosen) {
        const { ev, i, line, step } = f;
        const item = longScene(ev, i, line, step);
        if (!item && !rawFits(ev, ep, phase)) continue;
        step.aired = true;
        ev.aired = true;
        seasonAired[`${line.type}.${step.step}`] = (seasonAired[`${line.type}.${step.step}`] || 0) + 1;
        list.push({ at: i, item: item || { ref: i, storyline: line.id } });
      }
      // quick cuts: short moments between the long scenes, new faces first. A moment the opener
      // already covered (the team's own "who lost it", the morning's mourning) does not air twice.
      // Back from the challenge, the whole team reacts together when the engine staged it (crowd.won
      // / crowd.lost: the top scorer cheered, the lowest scorer blamed and defended): that group
      // scene opens the afternoon in place of the two-person "who lost it", with the same facts
      let openerNow = opener;
      if (phase === 'post' && opener && /^story\.chal/.test(opener.kind || '')) {
        const gi = events.findIndex(ev => ev && ev.aired == null && ev.type === 'groupScene' && /^crowd\.(won|lost)$/.test(ev.scene?.kind || ''));
        const g = gi >= 0 ? longScene(events[gi], gi) : null;
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
        const item = longScene(ev, i);
        seasonAired['cut:' + topic(ev)] = ep.num;
        ev.aired = true;
        cutN++;
        (item ? item.players : saysIn(ev)).forEach(p => shown.add(p));
        list.push({ at: i, item: item || { ref: i } });
      }
      // ...and the coverage pass below does not bring the duplicate back
      events.forEach(ev => { if (ev && !ev.aired && dup(ev)) ev.aired = 'covered'; });
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
        const i = events.findIndex(ev => ev && !ev.aired && speaksIn(ev).includes(name) && (ev.lines || []).length <= 8 && rawFits(ev, ep, phase));
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
        return { ...ev, story: true, ref: it.ref, ...(it.storyline ? { storyline: it.storyline } : {}),
          scene: { ...(ev.scene || {}), spot: { id: eat.id, label: eat.label, fixed: true, window: phase === 'pre' ? 'morning' : 'before-tribal' } } };
      });
    }
    // the refs that were added late go back into the camp's own order
    for (const phase of ['pre', 'post']) {
      const VOTE_AT = { other: 2e6, plan: 2.1e6, swing: 2.2e6, target: 2.3e6 };
      const at = it => (/^(story\.(firstday|morning|chal)|long\.crowd\.(won|lost))/.test(it.kind || '') ? -1 : it.kind === 'story.firstpair' ? (it.step === 'clicked' ? 0.5 : 1e5) : it.storyType === 'vote' ? VOTE_AT[it.step] : it.ref != null ? it.ref : 1e6);
      out[phase].sort((x, y) => at(x) - at(y));
    }
    story[camp] = out;
  }
  ep.campStory = story;
  // the night's words: every voter in the booth, the reading, last words, after (tribal.js)
  if (!ep.tribalStory) ep.tribalStory = writeTribal(ep);
  // the twists, as the people in them talk (twist.js; the twist screen plays them)
  if (ep.twistStory === undefined) {
    try { ep.twistStory = writeTwistStory(ep); } catch (e) { if (typeof process !== 'undefined' && process.env?.VITEST) throw e; ep.twistStory = null; }
  }
  // the classic screen's Crashout (vp-screens.js buildCrashout) reads the live game: taken now,
  // while the game is still at this episode, so a replay shows that night and not today
  if (ep.tribalStory && !ep.tribalBlowup && ep.tribalStory.crashout === undefined) {
    try { ep.tribalStory.crashout = typeof window !== 'undefined' && typeof window.buildCrashout === 'function' ? (window.buildCrashout(ep) || null) : null; } catch { ep.tribalStory.crashout = null; }
  }
}
