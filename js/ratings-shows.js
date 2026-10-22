// ══════════════════════════════════════════════════════════════════════
// ratings-shows.js — the eleven signals, read off four more shows' rows
// ══════════════════════════════════════════════════════════════════════
//
// js/ratings.js reads a vote (Total Drama, Big Brother), a runway night (Drag
// Race) and a villa (Perfect Match). These four shows write none of what those
// readers look for, so every signal came back zero and every season rated the
// same: The Circle measured 46.1 "Okay" on every seed (2026-10-22), which is a
// constant wearing a rating's name. Dramagram scales a whole cast's followers by
// that number, so a flat one is worse than none.
//
// Each reader keeps the signal's MEANING and changes only its source, the way
// readPlacementSignals does. A signal a show genuinely lacks (a return on a race
// with no returns) is an honest zero, said out loud. Counted by the show's own
// event KINDS, because those are the show's words — a betrayal at a round table
// and a boomerang on a race are what each is watched for.
//
// Each reader is named in the registry (`signals:` in js/shows.js) and each has
// a test that every signal moves and sits inside its calibrated band
// (tests/ratings-shows.test.js), the same two questions pm-ratings.test.js asks.
import { players } from './core.js';

const clamp01 = n => Math.max(0, Math.min(1, Number(n) || 0));
const norm = (n, span) => clamp01((Number(n) || 0) / span);
const DIRTY = new Set(['villain', 'mastermind', 'schemer']);

/** Archetypes from the row's own cast when the caller has it, else the app's. */
function archetypes(opts) {
  const list = opts.players;
  return n => (Array.isArray(list) ? list.find(p => p.name === n)?.archetype
    : list?.[n]?.archetype) || players.find(p => p.name === n)?.archetype || 'floater';
}
const dirtyShare = (names, opts) => {
  const arch = archetypes(opts);
  return names.length ? names.filter(n => DIRTY.has(arch(n))).length / names.length : 0;
};
/** How likeable the week made the cast look: 0.5 neutral, up with warmth, down with spite. */
const warmth = (warm, cold) => clamp01(0.5 + 0.5 * (warm - cold) / (warm + cold + 3));
/** The share of a vote that went one way. */
function unanimity(targets) {
  if (!targets.length) return 0;
  const tally = {};
  for (const t of targets) tally[t] = (tally[t] || 0) + 1;
  return Math.max(...Object.values(tally)) / targets.length;
}
const overlap = (now, before) => (now.length && before?.length
  ? now.filter(n => before.includes(n)).length / Math.max(now.length, before.length) : 0);

/* ══════════════════════════════════════════════════════════════════════
   THE CASTLE (The Traitors)
   ══════════════════════════════════════════════════════════════════════
   The round table is the vote, and the night it lands on a traitor is the
   one the audience talks about. The murder is the other door. Who the crowd
   likes is `tr.crowd` (standing), the scenes are `tr.castle.scenes` by family,
   and `tr.table.truth` says what everybody really was. */
export function readCastleSignals(ep, prev, opts) {
  const tr = ep.tr || {};
  const table = tr.table || {};
  const ballots = (table.votes || []).filter(v => v.channel === 'banishment' || !v.channel).map(v => v.target).filter(Boolean);
  const banished = (ep.exits || []).find(x => x.channel === 'banishment')?.name || ep.eliminated || null;
  const murdered = (ep.exits || []).filter(x => x.channel === 'murder').map(x => x.name);
  const truth = table.truth || {};
  const caught = banished && truth[banished] === 'traitor' ? 1 : 0;
  const faithfulOut = banished && truth[banished] === 'faithful' ? 1 : 0;
  const scenes = tr.castle?.scenes || [];
  const fam = f => scenes.filter(s => s.family === f).length;
  const down = re => (tr.downstairs || []).filter(d => re.test(d.kind || '')).length;
  const crowdRows = tr.crowd?.rows || [];
  const fav = tr.crowd?.favourite?.name || tr.crowd?.favourite || null;
  const recruited = tr.recruitment ? 1 : 0;

  // ── blindside: a traitor caught, a split table, the favourite murdered ──
  const split = ballots.length ? 1 - unanimity(ballots) : 0;
  const favMurdered = fav && prev?.fav && murdered.includes(prev.fav) ? 1 : 0;
  const blindside = clamp01(caught * 0.45 + split * 0.35 + favMurdered * 0.25 + recruited * 0.15
    + norm((table.betrayals || []).length, 2) * 0.2);

  // ── predictable: the table ganged up on the name everybody was saying ──
  const accused = (table.accusations || []).map(a => a.target);
  const mostAccused = accused.length ? Object.entries(accused.reduce((t, n) => ({ ...t, [n]: (t[n] || 0) + 1 }), {}))
    .sort((a, b) => b[1] - a[1])[0][0] : null;
  const predictable = banished ? clamp01(unanimity(ballots) * 0.6 + (mostAccused === banished ? 0.3 : 0)) : 0.3;

  // ── steamroll: the traitors getting away with it, night after night ──
  const steamroll = clamp01((prev?.steamroll || 0) * 0.5 + faithfulOut * 0.45);

  // ── powerShift: the game turned — a traitor out, a new one made ──
  const favChanged = fav && prev?.fav && fav !== prev.fav ? 1 : 0;
  const powerShift = prev ? clamp01(caught * 0.65 + recruited * 0.45 + favChanged * 0.3) : 0.35;

  const showmance = clamp01(norm(fam('romance') + down(/romance/), 3) * 0.7);
  const twist = clamp01(norm(recruited + (tr.armoury ? 1 : 0) + (tr.trial ? 1 : 0) + (table.dagger ? 1 : 0)
    + (table.deal ? 1 : 0) + (tr.endgame && tr.finale ? 1 : 0) + (tr.arrival && (tr.ep || ep.num) > 1 ? 1 : 0), 2));
  // Somebody new walking into the castle after the first night.
  const returns = tr.arrival && (tr.ep || ep.num) > 1 ? 1 : 0;

  // ── likability: the crowd's regard for who is still in ──
  const living = crowdRows.filter(r => !r.out);
  const biggest = Math.max(1e-6, ...crowdRows.map(r => Math.abs(Number(r.standing) || 0)));
  const mean = living.length ? living.reduce((s, r) => s + (Number(r.standing) || 0), 0) / living.length : 0;
  const likability = crowdRows.length ? clamp01(0.5 + 0.5 * mean / biggest) : 0.5;

  const villainy = clamp01(norm(fam('cover'), 8) * 0.25 + dirtyShare(tr.living || [], opts) * 0.3);
  const mess = clamp01(norm(fam('confrontation') + (table.clashes || []).length, 8) * 0.3);
  const strategy = clamp01(norm(fam('testing') + fam('suspicion') + (tr.strategy?.plans || []).length * 2, 16) * 0.5);

  return {
    ep: ep.num ?? tr.ep ?? 0, format: opts.format,
    blindside, predictable, steamroll, powerShift, showmance, twist, returns, likability, villainy, mess, strategy,
    fav, bloc: [], holder: fav, target: mostAccused, boot: banished, nominees: [],
  };
}

/* ══════════════════════════════════════════════════════════════════════
   THE CHALLENGE
   ══════════════════════════════════════════════════════════════════════
   The house votes somebody into the Arena (`ch.votes`, with `flip` on a
   ballot that moved), the Arena decides, and TJ's power rankings say who was
   supposed to win it. Everything else is the aired scenes, by kind. */
const CH_BETRAYAL = new Set(['alliance-betrayal', 'deal-broken', 'final-pact-broken', 'scheme-lie', 'gossip-backfire',
  'wishlist-leak', 'throw', 'instant-elimination', 'named-fallout']);
const CH_ROMANCE = new Set(['spark', 'flirt', 'showmance', 'beach-date', 'party-kiss', 'pda', 'jealousy', 'hot-tub-truths', 'sunset-talk']);
const CH_MESS = new Set(['fight', 'kitchen-blowup', 'party-callout', 'party-tears', 'jealousy', 'ranking-beef', 'bunk-war',
  'partner-blame', 'arena-eve-confront', 'payback', 'party-slip', 'receipts', 'kitchen-disaster', 'prank', 'overheard',
  'floater-callout', 'empty-threat']);
const CH_SPITE = new Set(['mock', 'gloat', 'trash-talk', 'scheme-lie', 'overnight-sabotage', 'rookie-hazing', 'leverage-threat',
  'injury-target', 'vet-dismisses', 'bank-brag']);
const CH_WARM = new Set(['vet-mentors-rookie', 'injury-care', 'homesick', 'call-home', 'arena-eve-pep', 'house-dinner', 'beach-run',
  'run-snacks', 'pool-games', 'show-banter', 'final-congrats', 'champion-reflect', 'outing', 'gym-training', 'final-pact-help']);
// The format interrupting itself on air: a double, an instant elimination, a villa reveal.
const CH_TWIST = new Set(['tj-double', 'instant-elimination', 'villa-reveal']);
const CH_SCHEME = new Set(['meeting', 'recruit', 'deal', 'counter-pitch', 'alliance-form', 'alliance-grow', 'alliance-end',
  'alliance-leave', 'alliance-betrayal', 'party-deal', 'spare-deal', 'leverage-threat', 'house-debate', 'loyalty-test',
  'wavering', 'money-talk', 'meeting-spotted', 'pick-talk']);

export function readChallengeSignals(ep, prev, opts) {
  const ch = ep.ch || {};
  const kinds = (ch.aired || []).map(a => a.kind);
  const count = set => kinds.filter(k => set.has(k)).length;
  const ballots = (ch.votes || []).flatMap(v => v.ballots || []);
  const flips = ballots.filter(b => b.flip).length;
  const votedIn = [...(ch.votedIn || [])];
  const rankOf = n => (ch.rankings || []).find(r => r.n === n)?.rank ?? null;
  const duels = ch.arena || [];
  // An upset: the Arena went to somebody TJ ranked well below the one they beat.
  const upsets = duels.filter(d => {
    const w = rankOf(d.winner || d.winners?.[0]), l = rankOf(d.loser || d.losers?.[0]);
    return w != null && l != null && w > l + 2;
  }).length;
  const favouriteWon = duels.length - upsets > 0 && duels.length ? (duels.length - upsets) / duels.length : 0;

  const blindside = clamp01(norm(flips, Math.max(2, ballots.length * 0.3)) * 0.5 + norm(upsets, 1) * 0.3
    + norm(count(CH_BETRAYAL), 2) * 0.3);
  const targets = ballots.map(b => b.target).filter(Boolean);
  const predictable = duels.length || targets.length
    ? clamp01(unanimity(targets) * 0.5 + favouriteWon * 0.3 + ((ch.dailyWinners || [])[0] && prev?.holder === ch.dailyWinners[0] ? 0.2 : 0))
    : 0.3;

  // ── steamroll: the same people deciding who goes in ──
  const bloc = ballots.filter(b => votedIn.includes(b.target)).map(b => b.voter);
  const steamroll = clamp01((prev?.steamroll || 0) * 0.55 + overlap(bloc, prev?.bloc) * 0.55);

  // ── powerShift: tonight's daily winner was being hunted last week ──
  const holder = (ch.dailyWinners || [])[0] || null;
  let powerShift = 0;
  if (holder && prev) {
    const hunted = (prev.nominees || []).includes(holder) || prev.target === holder;
    powerShift = prev.holder === holder ? 0 : clamp01(0.3 + (hunted ? 0.5 : 0) + norm(upsets, 1) * 0.2);
  } else if (holder) powerShift = 0.35;

  const showmance = clamp01(norm(count(CH_ROMANCE), 4) * 0.7);
  const twist = clamp01(norm((ch.twist ? 1 : 0) + (ch.purged ? 1 : 0) + (ch.returnArena ? 1 : 0) + (ch.tribunal ? 1 : 0)
    + (ch.teamsBroken ? 1 : 0) + (ch.teams?.switches || []).length + (ch.teams?.folds || []).length + count(CH_TWIST), 2));
  const returns = ch.returnArena ? 1 : 0;
  const spite = count(CH_SPITE);
  const likability = warmth(count(CH_WARM), spite);
  const villainy = clamp01(norm(spite, 8) * 0.3 + dirtyShare(ch.people || ch.house || [], opts) * 0.2);
  const mess = clamp01(norm(count(CH_MESS), 10) * 0.3);
  const strategy = clamp01(norm(count(CH_SCHEME) + (ch.pitches || []).length, 16) * 0.45 + norm(flips, 3) * 0.1);

  return {
    ep: ep.num ?? 0, format: opts.format,
    blindside, predictable, steamroll, powerShift, showmance, twist, returns, likability, villainy, mess, strategy,
    bloc, holder, target: votedIn[0] || null, boot: ep.eliminated || null, nominees: votedIn,
  };
}

/* ══════════════════════════════════════════════════════════════════════
   THE RACE (Ridonculous Race)
   ══════════════════════════════════════════════════════════════════════
   No vote at all: a leg is a finishing ORDER. A surprise is a team that ran
   up front last leg going home on this one; a dull leg is the same teams at
   the front and the same team at the back. The rest is the segments, by kind. */
const RR_SABOTAGE = new Set(['course-sabotage', 'boomerang-hit', 'don-fakeout', 'ram', 'save-your-enemy', 'comeuppance']);
const RR_ROMANCE = new Set(['flirt', 'crush-noticed', 'crush-confided', 'goodbye-kiss', 'matchmaking', 'proposal',
  'back-together', 'confession-attempt']);
const RR_MESS = new Set(['blame', 'collision', 'whose-botch', 'travel-mishap', 'manage-partner', 'exhaustion', 'surrender',
  'watching-botch', 'old-wound', 'push', 'shove', 'plane-row', 'int-contradict', 'illness', 'makeup', 'money-worry']);
const RR_SPITE = new Set(['trash-talk', 'gloat', 'mock-the-struggle', 'shove', 'ram', 'blame', 'mind-game', 'course-sabotage',
  'spy', 'rumour']);
const RR_WARM = new Set(['bond-moment', 'help-offer', 'rescue', 'mentor', 'pep-talk', 'celebrate', 'repay', 'save-your-enemy',
  'watching-together', 'souvenir', 'local-help', 'borrow', 'yield', 'console', 'small-talk']);
const RR_SCHEME = new Set(['alliance-pitch', 'alliance-check', 'deal', 'share-info', 'spy', 'plan-the-leg', 'int-strategy',
  'which-way', 'rumour', 'superteam-pick', 'boomerang-vote', 'boomerang-decide', 'decide-side', 'follow', 'mind-game']);
const RR_TWIST = new Set(['don-rule', 'don-fakeout', 'superteam-pick', 'save-used', 'speed-bump', 'boomerang-reveal']);

export function readRaceSignals(ep, prev, opts) {
  const rr = ep.rr || {};
  const kinds = (rr.aired?.segments || []).map(s => s.kind);
  const count = set => kinds.filter(k => set.has(k)).length;
  const order = (rr.order || []).map(o => o.team);
  const field = Math.max(2, order.length);
  const out = [...(rr.eliminated || [])];
  const prevOrder = prev?.order || [];
  const prevPlace = id => { const i = prevOrder.indexOf(id); return i < 0 ? null : i; };

  // ── blindside: a team that ran up front last leg went home on this one ──
  const fallFrom = out.map(prevPlace).filter(i => i != null).map(i => 1 - i / Math.max(1, prevOrder.length - 1));
  const surprise = fallFrom.length ? Math.max(...fallFrom) : 0;
  const blindside = clamp01(surprise * 0.55 + norm(count(RR_SABOTAGE), 3) * 0.35);

  // ── predictable: the leader led again and the back marker went home ──
  const sameWinner = order[0] && prevOrder[0] === order[0] ? 1 : 0;
  const lastAgain = out.length && out.every(id => { const i = prevPlace(id); return i != null && i >= prevOrder.length - 2; }) ? 1 : 0;
  const predictable = prev ? clamp01(sameWinner * 0.4 + lastAgain * 0.45) : 0.3;

  // ── steamroll: the same three at the front, leg after leg ──
  const topThree = order.slice(0, 3);
  const steamroll = clamp01((prev?.steamroll || 0) * 0.55 + overlap(topThree, prev?.topThree) * 0.55);

  // ── powerShift: back of the pack to the front, or the front to the back ──
  const bottom = order.slice(-Math.max(2, Math.ceil(field / 4)));
  const rose = order[0] && (prev?.bottom || []).includes(order[0]) ? 1 : 0;
  const fell = bottom.some(id => (prev?.topThree || []).includes(id)) ? 1 : 0;
  const powerShift = prev ? clamp01(rose * 0.65 + fell * 0.45) : 0.35;

  const showmance = clamp01(norm(count(RR_ROMANCE), 3) * 0.7);
  const twist = clamp01(norm((rr.twist ? 1 : 0) + count(RR_TWIST), 2));
  const spite = count(RR_SPITE);
  const likability = warmth(count(RR_WARM), spite);
  const villainy = clamp01(norm(spite, 12) * 0.3 + dirtyShare(rr.people || [], opts) * 0.2);
  const mess = clamp01(norm(count(RR_MESS), 10) * 0.3);
  const strategy = clamp01(norm(count(RR_SCHEME), 8) * 0.5);

  return {
    ep: ep.num ?? rr.leg ?? 0, format: opts.format,
    blindside, predictable, steamroll, powerShift, showmance, twist,
    // AN HONEST ZERO: the race has no way back in (a boomerang is a penalty, not a return).
    returns: 0,
    likability, villainy, mess, strategy,
    order, topThree, bottom, bloc: [], holder: order[0] || null, target: null,
    boot: (ep.exits || [])[0]?.name || null, nominees: [],
  };
}

/* ══════════════════════════════════════════════════════════════════════
   THE CIRCLE
   ══════════════════════════════════════════════════════════════════════
   The ratings are the vote: their results say who is on top, the two
   influencers decide who is blocked, and `ci.end.public` is what the audience
   thinks of each profile. A ratings day does not happen every day, so the
   last one is carried forward. The scenes are read by their script's block
   keys (`chat.flirt.warm`, `busted.accuse`), which say what a chat was ABOUT. */
const CI_ROMANCE = /^(chat\.flirt|party\.flirt|visit\.kiss|date\.|visit\.(choose|talk|talk2)\.crush|arrival\.react\.crush|farewell\.word\.crush|reunion\.(ask|talk)\.flirt|chat\.jealous|party\.jealous)/;
const CI_MESS = /^(busted\.|chat\.jealous|party\.jealous|visit\.(choose|talk|talk2|after)\.confront|style\.mismatch\.suspicious|style\.hype\.annoyed|chat\.defend|chat\.repair|game\.ask\.barbed|hangout\.view\.grudge|block\.(fear|announce)\.grudge|alliance\.betrayed|goodbye\.react\.(surprised|guilty)|visit\.door\.caught)/;
const CI_SPITE = /^(aside\.schemer|busted\.|chat\.[a-z]+\.cold|game\.ask\.barbed|alliance\.betrayed|rate\.threat|rate\.suspicion|block\.fear|welcome\.cold)/;
const CI_WARM = /^(chat\.[a-z]+\.warm|aside\.sweet|welcome\.warm|goodbye\.react\.friend|game\.gift|visit\.(choose|talk|talk2)\.friend|rate\.affection\.top|party\.(dance|photo|nhie)|reveal\.react\.proud)/;
const CI_SCHEME = /^(group\.(plan|form|check)|chat\.(ally|pitch|probe|pump|debrief)|aside\.schemer|hangout\.(pact|trade|agree)|notes\.|rate\.(alliance|protection|threat))/;
const CI_BLINDSIDE = /^(busted\.|alliance\.betrayed|clone\.(host\.caught|out\.caught)|lurk\.reveal|visit\.door\.caught|goodbye\.react\.surprised|reveal\.react\.shocked)/;

export function readCircleSignals(ep, prev, opts) {
  const ci = ep.ci || {};
  const aired = ci.aired || [];
  const keys = aired.flatMap(a => (a.script?.blocks || []).map(b => b.key || ''));
  const count = re => keys.filter(k => re.test(k)).length;
  const rating = ci.rating && (ci.rating.results || []).length ? ci.rating : null;
  // The last ratings the room held, carried forward through the days without one.
  const ranks = rating ? rating.results.map(r => r.profile) : (prev?.ranks || []);
  const lastRanks = rating ? (prev?.ranks || []) : (prev?.lastRanks || []);
  const influencers = rating ? [...(rating.influencers || [])] : (prev?.influencers || []);
  const prevInfluencers = rating ? (prev?.influencers || []) : (prev?.prevInfluencers || []);
  const blocked = [...(ci.blocked || [])];
  const placeOf = h => { const i = ranks.indexOf(h); return i < 0 ? null : i; };

  // ── blindside: somebody the room rated well was blocked, or a lie came out ──
  const rose = blocked.map(placeOf).filter(i => i != null).map(i => 1 - i / Math.max(1, ranks.length - 1));
  const blindside = clamp01((rose.length ? Math.max(...rose) : 0) * 0.5 + norm(count(CI_BLINDSIDE), 3) * 0.4);

  // ── predictable: the bottom of the ratings went home ──
  const bottomBlocked = blocked.length && blocked.every(h => { const i = placeOf(h); return i != null && i >= ranks.length - 2; }) ? 1 : 0;
  const sameTop = rating && overlap(influencers, prevInfluencers) === 1 ? 1 : 0;
  const predictable = blocked.length || rating ? clamp01(bottomBlocked * 0.55 + sameTop * 0.35) : 0.3;

  // ── steamroll: the same influencers holding the power, rating after rating ──
  const steamroll = rating ? clamp01((prev?.steamroll || 0) * 0.55 + overlap(influencers, prevInfluencers) * 0.5)
    : clamp01((prev?.steamroll || 0) * 0.9);

  // ── powerShift: a new top, from the bottom half of the last ratings ──
  let powerShift = 0;
  if (rating && lastRanks.length) {
    const top = ranks[0];
    const was = lastRanks.indexOf(top);
    powerShift = top === lastRanks[0] ? 0 : clamp01(0.3 + (was >= lastRanks.length / 2 ? 0.5 : 0));
  } else if (rating) powerShift = 0.35;

  // A Circle day airs ~20-35 scenes of several blocks each: the spans are set
  // so a busy day sits mid-band rather than pinned at the top (measured, 4 seeds).
  const showmance = clamp01(norm(count(CI_ROMANCE), 10) * 0.7);
  const odd = new Set(['alert', 'disrupter', 'clone', 'newparty', 'invites', 'chosen', 'lurk', 'plead', 'date']);
  const twist = clamp01(norm((ci.night?.format && ci.night.format !== 'standard' ? 1 : 0)
    + aired.filter(a => odd.has(a.kind)).length, 2));

  // ── likability: what the audience thinks of the profiles still playing ──
  const pub = ci.end?.public || {};
  const active = ci.active || [];
  const biggest = Math.max(1e-6, ...Object.values(pub).map(p => Math.abs(Number(p?.approval) || 0)));
  const mean = active.length ? active.reduce((s, h) => s + (Number(pub[h]?.approval) || 0), 0) / active.length : 0;
  const liked = Object.keys(pub).length ? clamp01(0.5 + 0.5 * mean / biggest) : 0.5;
  const likability = clamp01(liked * 0.7 + warmth(count(CI_WARM), count(CI_SPITE)) * 0.3);

  // ── villainy: catfish in the room, and the spite on screen ──
  const profiles = ci.profiles || {};
  const catfish = active.length ? active.filter(h => profiles[h]?.mode === 'catfish').length / active.length : 0;
  const villainy = clamp01(catfish * 0.25 + norm(count(CI_SPITE), 24) * 0.25);
  const mess = clamp01(norm(count(CI_MESS), 12) * 0.3);
  const strategy = clamp01(norm(count(CI_SCHEME), 30) * 0.5);

  return {
    ep: ep.num ?? ci.day ?? 0, format: opts.format,
    blindside, predictable, steamroll, powerShift, showmance, twist,
    // AN HONEST ZERO: nobody blocked comes back into the Circle.
    returns: 0,
    likability, villainy, mess, strategy,
    ranks, lastRanks, influencers, prevInfluencers,
    bloc: [], holder: influencers[0] ? profiles[influencers[0]]?.name || influencers[0] : null, target: null,
    boot: (ep.exits || [])[0]?.name || null, nominees: [],
  };
}

/** By the registry's `signals:` name. */
export const SHOW_SIGNAL_READERS = {
  castle: readCastleSignals,
  challenge: readChallengeSignals,
  race: readRaceSignals,
  circle: readCircleSignals,
};
