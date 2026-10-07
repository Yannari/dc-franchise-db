// js/camp-events.js - Camp events: alliance recruitment, paranoia, social politics, etc.
import { gs, seasonConfig, players } from './core.js';
import { pStats, pronouns, getPlayerState, romanticCompat } from './players.js';
import { getBond, addBond, getPerceivedBond } from './bonds.js';
import { wRandom, computeHeat, nameNewAlliance, resolveAllianceRepair } from './alliances.js';
import { recordIdolIntel, idolIntelFor } from './advantage-intel.js';
import {
  checkShowmanceFormation, updateRomanticSparks, getShowmancePartner,
  updateShowmancePhases, checkLoveTriangleFormation, updateAffairExposure,
  updateLoveTrianglePhases, checkFirstMove, checkShowmanceSabotage
} from './romance.js';
import { generateSocialManipulationEvents } from './social-manipulation.js';
import { simulateTribeChallenge } from './challenges-core.js';
import { eventAllowedInSetting, settingWeightMod, settingProfile, fillVocab, currentSetting, settingReskin } from './settings.js';
import { reputationModifier } from './reputation.js';
import { campRoster, isCoach as isCoachName } from './coaches.js';
import { recordIntimidation, recordProtection, recordBetrayal } from './relationship-events.js';
import { attachCampAccessToEvents, buildCampAccessSchedule, findConversationAccess } from './camp-access.js';
import { makeScene, spotOf, spotFromAccess } from './td/script/scene.js';
import { scriptEvent, scriptEventParts, withSceneCtx, ambientCtx, transcript } from './td/script/write.js';

// Where two people talk, in the phase the camp generator is writing (its callers set it).
const _spotNow = (a, b) => spotOf(null, a, b, ambientCtx().phase === 'post' ? 'post' : 'pre').spot;
// The two tribemates closest to {a}: the other voices in a camp-wide moment (no dice).
const _twoOthers = (group, a) => group.filter(x => x !== a).sort((x, y) => getBond(a, y) - getBond(a, x) || x.localeCompare(y)).slice(0, 2);
// A moment the venue wrote (settings.js: this set's weather, this camp's animal, this place's
// afternoon): its sentence opens the scene as the stage direction, then the people in it talk.
function _venueScene(evt, line, kind, who, data = {}) {
  const ev = scriptEvent(evt, makeScene(kind, who, data, [], _spotNow(who.a, who.b || null)));
  if (line) { ev.lines = [{ kind: 'beat', by: null, text: line }, ...ev.lines]; ev.text = transcript(ev.lines); }
  return ev;
}
import { ensureIntentions, evolveIntentions, getIntentions, evaluateEndgameBeatability } from './intentions.js';
import { getRelationshipDimensions } from './relationships.js';

function _intentionCampKey(name) {
  return gs.isMerged ? (gs.mergeName || 'merge')
    : ((Array.isArray(gs.tribes) ? gs.tribes : []).find(t => (t.members || []).includes(name))?.name || null);
}

// A small sample of persistent strategy becomes story. Private preference is
// labelled as private; actual F2/F3 promises remain the sideDeal event's job.
function generateIntentionStoryEvents(ep, phase) {
  if (phase !== 'pre' && phase !== 'both') return;
  // A confirmed deal cannot vanish because a number changed. When resentment
  // makes it untenable, the withdrawal itself is a camp event.
  // Both still in the game: a deal with somebody already voted out is not withdrawn, it is over.
  const strained = (gs.sideDeals || []).find(d => d.active && d.genuine !== false && (d.players || []).length === 2 &&
    d.players.every(p => (gs.activePlayers || []).includes(p)) &&
    d.players.some(a => (getRelationshipDimensions(a, d.players.find(b => b !== a))?.resentment || 0) >= 4));
  if (strained) {
    const [a,b] = strained.players;
    const ar = getRelationshipDimensions(a,b)?.resentment || 0;
    const br = getRelationshipDimensions(b,a)?.resentment || 0;
    const breaker = ar >= br ? a : b;
    const partner = breaker === a ? b : a;
    const arr = ep.campEvents?.[_intentionCampKey(breaker)]?.pre;
    if (arr) {
      const access = findConversationAccess(ep, breaker, partner, { phase:'pre', privacy:.35, allowPublicPullAside:true });
      strained.active = false; strained.brokenEp = ep.num; strained.brokenBy = breaker;
      strained.brokenAgainst = partner; strained.breakReason = 'relationship deteriorated until the promise was withdrawn';
      arr.push(scriptEvent({ type:'endgameDealDissolved', players:[breaker, partner], access:access || undefined,
        badgeText:'ENDGAME DEAL ENDS', badgeClass:'red' },
        makeScene('deal.end', { a: breaker, b: partner },
          { ending: access?.possible ? 'face' : 'cold', size: strained.type === 'f3' ? 'three' : 'two' }, [], spotFromAccess(access)),
        { ep: ep.num, phase: 'pre' }));
    }
  }
  const candidates = (gs.activePlayers || []).map(name => {
    const plan = ensureIntentions(name, ep.num);
    if (!plan) return null;
    evolveIntentions(name, ep.num);
    plan.narrated = plan.narrated || {};
    const key = `formed:${plan.formedEp}:${plan.stage}`;
    return plan.narrated[key] ? null : { name, plan, key, skill:pStats(name).strategic || 5 };
  }).filter(Boolean).sort((a,b) => b.skill-a.skill).slice(0, 2);

  candidates.forEach(({ name, plan, key }) => {
    const arr = ep.campEvents?.[_intentionCampKey(name)]?.pre;
    if (!arr) return;
    const preferred = (plan.preferredCore || [])[0];
    const target = (plan.targets || [])[0];
    const access = preferred && Math.random() < Math.min(.65, .18 + pStats(name).social * .04)
      ? findConversationAccess(ep, name, preferred, { phase:'pre', privacy:.55, allowPublicPullAside:true }) : null;
    if (access) {
      arr.push(scriptEvent({ type:'gamePlanProbe', players:[name, preferred], access,
        badgeText:'TESTING THE WATER', badgeClass:'gold' },
        makeScene('plan.probe', { a: name, b: preferred }, {}, [], spotFromAccess(access)),
        { ep: ep.num, phase: 'pre' }));
    } else {
      // A confessional: nobody else hears it.
      const ending = preferred && target ? 'both' : preferred ? 'ally' : target ? 'target' : 'open';
      arr.push(scriptEvent({ type:'gamePlanConfessional', players:[name], badgeText:'PRIVATE GAME PLAN', badgeClass:'blue' },
        makeScene('plan.private', { a: name }, { ending, ally: preferred || null, target: target || null }, [], { id: 'confessional', label: 'Confessional' }),
        { ep: ep.num, phase: 'pre' }));
    }
    plan.narrated[key] = ep.num;
  });

  const broken = (gs._brokenDeals || []).splice(0);
  // The betrayed partner has to still be here to find out; the breaker may be gone.
  broken.filter(b => (gs.activePlayers || []).includes(b.partner)).slice(0, 2).forEach(b => {
    const arr = ep.campEvents?.[_intentionCampKey(b.partner) || _intentionCampKey(b.breaker)]?.pre;
    if (!arr) return;
    // Face to face when the breaker lives in the same camp; otherwise only the camera hears it.
    const breakerHere = (gs.activePlayers || []).includes(b.breaker);
    const together = breakerHere && _intentionCampKey(b.breaker) === _intentionCampKey(b.partner);
    arr.push(scriptEvent({ type:'endgameDealBroken', players:[b.partner, b.breaker], badgeText:'ENDGAME DEAL BROKEN', badgeClass:'red' },
      makeScene('deal.broken', { a: b.partner, b: b.breaker },
        { ending: together ? 'confront' : breakerHere ? 'alone' : 'gone', size: b.deal.type === 'f3' ? 'three' : 'two' }, [],
        together ? spotOf(ep, b.partner, b.breaker, 'pre').spot : { id: 'confessional', label: 'Confessional' }),
      { ep: ep.num, phase: 'pre' }));
  });
}

// Fill a reskin/atmosphere template: player tokens first, then vocab tokens.
// {a}/{b} = the two players, {p} = single featured player, {po} = possessive.
function _reskinFill(tpl, a, b) {
  const pa = a ? pronouns(a) : null;
  let s = String(tpl)
    .replace(/\{a\}/g, a || '').replace(/\{b\}/g, b || '')
    .replace(/\{p\}/g, a || '').replace(/\{po\}/g, pa ? pa.posAdj : 'their');
  return fillVocab(s);
}

export const CAMP_EVENT_TYPES = [
  // ═══ POSITIVE (~55%) — bonding, comfort, growth, alliance building ═══
  { id: 'bond',                twoPlayer: true,  weight: 18 },
  { id: 'tdBond',              twoPlayer: true,  weight: 18 },
  { id: 'comfort',             twoPlayer: true,  weight: 15 },
  { id: 'hardWork',            twoPlayer: false, weight: 13 },
  { id: 'groupLaugh',          twoPlayer: false, weight: 15 },
  { id: 'sharedStruggle',      twoPlayer: true,  weight: 15 },
  { id: 'rivalThaw',           twoPlayer: true,  weight: 11 },
  { id: 'flirtation',          twoPlayer: true,  weight: 11 },
  { id: 'unexpectedCompetence',twoPlayer: false, weight: 8  },
  { id: 'teachingMoment',      twoPlayer: true,  weight: 10 },
  { id: 'vulnerability',       twoPlayer: true,  weight: 12 },
  { id: 'insideJoke',          twoPlayer: true,  weight: 12 },
  { id: 'loyaltyProof',        twoPlayer: true,  weight: 11 },
  { id: 'showmancerMoment',    twoPlayer: true,  weight: 8  },
  { id: 'socialBoost',         twoPlayer: false, weight: 8  },
  { id: 'soldierCheckin',      twoPlayer: true,  weight: 8  },
  { id: 'underdogMoment',      twoPlayer: false, weight: 8  },
  { id: 'beastDrills',         twoPlayer: false, weight: 7  },
  { id: 'allianceForm',        twoPlayer: false, weight: 18 }, // builds protection structure
  { id: 'sideDeal',            twoPlayer: true,  weight: 10 }, // builds connection
  { id: 'idolSearch',          twoPlayer: false, weight: 10 }, // empowers finder
  { id: 'wildcardPivot',       twoPlayer: false, weight: 8  }, // wildcard finds new path (positive for them)
  { id: 'gratitude',           twoPlayer: true,  weight: 11 }, // thanks for past help deepens bond
  { id: 'protectiveInstinct',  twoPlayer: true,  weight: 10 }, // defends another from blame
  { id: 'sharedMeal',          twoPlayer: true,  weight: 11 }, // cooking/fishing together bonds
  { id: 'moraleBoost',         twoPlayer: false, weight: 10 }, // rallies tribe after adversity
  { id: 'secretShared',        twoPlayer: true,  weight: 11 }, // confides personal info, trust deepens
  { id: 'sunriseTalk',         twoPlayer: true,  weight: 11 }, // early morning honest conversation
  { id: 'celebrateTogether',   twoPlayer: false, weight: 10 }, // tribe bonds over a win/milestone
  { id: 'mentorBond',          twoPlayer: true,  weight: 10 }, // emotional guidance (not skill teaching)
  { id: 'forgiveness',         twoPlayer: true,  weight: 4  }, // apology accepted, bond recovery (kept rare — apologies were over-firing)
  { id: 'silentSolidarity',    twoPlayer: true,  weight: 9  }, // standing together without words
  { id: 'campImprovement',     twoPlayer: false, weight: 10 }, // builds something for the tribe
  // ═══ NEGATIVE (~35%) — conflict, damage, drama, scheming, suspicion ═══
  { id: 'fight',               twoPlayer: true,  weight: 13 },
  { id: 'dispute',             twoPlayer: true,  weight: 11 },
  { id: 'meltdown',            twoPlayer: false, weight: 10 },
  { id: 'injury',              twoPlayer: false, weight: 7  },
  { id: 'rumor',               twoPlayer: true,  weight: 10 },
  { id: 'overplay',            twoPlayer: false, weight: 10 },
  { id: 'leadershipClash',     twoPlayer: true,  weight: 10 },
  { id: 'foodConflict',        twoPlayer: true,  weight: 8  },
  { id: 'intimidation',        twoPlayer: true,  weight: 8  },
  { id: 'lie',                 twoPlayer: true,  weight: 10 },
  { id: 'hotheadExplosion',    twoPlayer: false, weight: 10 },
  { id: 'chaosAgentStirsUp',   twoPlayer: true,  weight: 9  },
  { id: 'jealousy',            twoPlayer: true,  weight: 9  },
  { id: 'exclusion',           twoPlayer: false, weight: 8  },
  { id: 'blame',               twoPlayer: true,  weight: 9  },
  { id: 'passiveAggressive',   twoPlayer: true,  weight: 8  },
  { id: 'trustCrack',          twoPlayer: true,  weight: 9  },
  { id: 'allianceCrack',       twoPlayer: true,  weight: 8  },
  { id: 'eavesdrop',           twoPlayer: true,  weight: 8  }, // creates suspicion
  { id: 'paranoia',            twoPlayer: false, weight: 7  },
  { id: 'scramble',            twoPlayer: true,  weight: 8  }, // desperation
  { id: 'overconfidence',      twoPlayer: false, weight: 6  }, // blindside setup
  { id: 'doubt',               twoPlayer: false, weight: 7  },
  { id: 'watchingYou',         twoPlayer: true,  weight: 8  }, // surveillance = negative
  { id: 'prank',               twoPlayer: true,  weight: 8  }, // usually causes friction
  { id: 'showboat',            twoPlayer: false, weight: 5  }, // rubs people wrong
  { id: 'schemerManipulates',  twoPlayer: true,  weight: 9  },
  { id: 'mastermindOrchestrates',twoPlayer: true, weight: 8  },
  { id: 'goatOblivious',       twoPlayer: false, weight: 7  }, // negative perception
  // ═══ TRUE NEUTRAL (~10%) — flavor with minor consequences ═══
  { id: 'confessional',        twoPlayer: false, weight: 8  },
  { id: 'weirdMoment',         twoPlayer: false, weight: 5  },
  { id: 'readingRoom',         twoPlayer: false, weight: 5  },
  { id: 'tribeMood',           twoPlayer: false, weight: 4  },
  { id: 'homesick',            twoPlayer: false, weight: 4  },
  { id: 'loneWolf',            twoPlayer: false, weight: 4  },
  { id: 'superstition',        twoPlayer: false, weight: 8  }, // ritual/lucky charm
  { id: 'animalEncounter',     twoPlayer: false, weight: 8  }, // wildlife at camp
  { id: 'dreaming',            twoPlayer: false, weight: 8  }, // vivid dream talk
  { id: 'weatherShift',        twoPlayer: false, weight: 8  }, // weather changes camp mood
  // ═══ MIXED (lean positive or negative based on context) ═══
  { id: 'strategicTalk',       twoPlayer: true,  weight: 14 },
  { id: 'tdStrategy',          twoPlayer: true,  weight: 14 },
  { id: 'bigMoveThoughts',     twoPlayer: false, weight: 6  },
  { id: 'perceptiveReads',     twoPlayer: true,  weight: 8  },
  { id: 'floaterInvisible',    twoPlayer: false, weight: 6  },
  // ═══ HOST & CHEF meddling (camp antagonists torment the campers) ═══
  { id: 'chefSlop',            twoPlayer: true,  weight: 9  }, // inedible food → bond over misery or turn on each other
  { id: 'rudeWakeup',          twoPlayer: false, weight: 8  }, // dawn airhorn / chores → clap back or camp stews
  { id: 'hostFavoritism',      twoPlayer: true,  weight: 8  }, // host plays favorites → jealousy
  { id: 'fakeReward',          twoPlayer: true,  weight: 7  }, // "reward" that's a punishment → bond over the prank
  // hosted-camp exclusives
  { id: 'messHallDrama',       twoPlayer: true,  weight: 10 },
  { id: 'cabinRaid',           twoPlayer: true,  weight: 9  },
  { id: 'campfireStory',       twoPlayer: true,  weight: 10 },
  // ═══ CASUAL NIGHT GAMES (the cast's own after-dark spin-the-bottle etc.) ═══
  { id: 'nightGame',           twoPlayer: true,  weight: 11 }, // spin-the-bottle / never-have-I-ever / truth-or-dare
  // ═══ SETTING-EXCLUSIVE (gated by seasonConfig.setting via SETTING_EXCLUSIVE) ═══
  { id: 'settingAtmosphere',   twoPlayer: true,  weight: 14 }, // scene-setting flavor per venue (always on)
  // survival island
  { id: 'forage',              twoPlayer: true,  weight: 12 },
  { id: 'shelterStorm',        twoPlayer: true,  weight: 10 },
  { id: 'fireStruggle',        twoPlayer: true,  weight: 10 },
  { id: 'rationLow',           twoPlayer: true,  weight: 10 },
  { id: 'waterRun',            twoPlayer: true,  weight: 10 },
  { id: 'exhaustion',          twoPlayer: true,  weight: 10 },
  { id: 'wildlifeScare',       twoPlayer: true,  weight: 9  },
  // carnival
  { id: 'midwayGames',         twoPlayer: true,  weight: 12 },
  { id: 'rideDare',            twoPlayer: true,  weight: 11 },
  { id: 'funhouse',            twoPlayer: true,  weight: 10 },
  { id: 'carnivalTreat',       twoPlayer: true,  weight: 10 },
  { id: 'dunkTank',            twoPlayer: true,  weight: 10 },
  { id: 'prizeBooth',          twoPlayer: true,  weight: 9  },
  // film lot
  { id: 'craftServices',       twoPlayer: true,  weight: 11 },
  { id: 'stuntWrong',          twoPlayer: true,  weight: 11 },
  { id: 'trailerEnvy',         twoPlayer: true,  weight: 10 },
  { id: 'wardrobeVanity',      twoPlayer: true,  weight: 10 },
  { id: 'divaFit',             twoPlayer: true,  weight: 9  },
  { id: 'bloopers',            twoPlayer: true,  weight: 10 },
  // world tour
  { id: 'classDivide',         twoPlayer: true,  weight: 12 },
  { id: 'jetLag',              twoPlayer: true,  weight: 10 },
  { id: 'planeFood',           twoPlayer: true,  weight: 10 },
  { id: 'layover',             twoPlayer: true,  weight: 10 },
  { id: 'souvenirGrab',        twoPlayer: true,  weight: 9  },
];

// Variety control for camp event picking (applied in generateCampEventsForGroup's weight fn):
// SIGNATURE — loud "story beats" that cheapen when repeated: cross-episode cooldown (last 2 eps
//   downweighted) + within-episode dedup (don't fire the same beat twice in one camp feed).
// TEXTURE — conflict events that are fine day-to-day but jarring twice in one feed: within-episode
//   dedup only, no cross-episode cooldown.
// 'fight' is deliberately in NEITHER set — real camp brawls are allowed to flare more than once.
const _CAMP_BEAT_SIGNATURE = new Set([
  'allianceCrack', 'trustCrack', 'meltdown', 'hotheadExplosion',
  'mastermindOrchestrates', 'schemerManipulates', 'rumor', 'lie', 'blame',
  'eavesdrop', 'watchingYou', 'paranoia', 'bigMoveThoughts', 'overconfidence',
  'prank', 'showboat', 'nightGame', 'hostFavoritism',
]);
const _CAMP_BEAT_TEXTURE = new Set([
  'dispute', 'jealousy', 'exclusion', 'leadershipClash', 'foodConflict', 'intimidation',
  'chefSlop', 'rudeWakeup', 'fakeReward', 'messHallDrama', 'cabinRaid', 'campfireStory',
  // setting-exclusive venue beats — fine day-to-day, jarring twice in one feed
  'forage', 'shelterStorm', 'fireStruggle', 'rationLow', 'waterRun', 'exhaustion', 'wildlifeScare',
  'midwayGames', 'rideDare', 'funhouse', 'carnivalTreat', 'dunkTank', 'prizeBooth',
  'craftServices', 'stuntWrong', 'trailerEnvy', 'wardrobeVanity', 'divaFit', 'bloopers',
  'classDivide', 'jetLag', 'planeFood', 'layover', 'souvenirGrab',
]);


// Flatten campEvents for code that just needs all events (handles both old array and new {pre,post} format)
export function allCampEvents(ep) {
  return Object.values(ep.campEvents || {}).flatMap(v =>
    Array.isArray(v) ? v : [...(v.pre || []), ...(v.post || [])]
  );
}

  // ── EMISSARY VOTE: post-challenge selection (called from simulateEpisode after challenge) ──
export function executeEmissarySelection(ep) {
    if (!ep.isEmissaryVote || !ep.winner || !ep.loser) return;
    const _evWinTribe = ep.winner;
    const _evLoseTribe = ep.loser;
    const _evWinMembers = _evWinTribe.members.filter(m => gs.activePlayers.includes(m));
    if (_evWinMembers.length < 2) return;

    // ── Emissary selection: boldness + strategic + social scoring ──
    const _evScores = _evWinMembers.map(name => {
      const s = pStats(name);
      return { name, score: s.boldness * 0.06 + s.strategic * 0.05 + s.social * 0.04 + Math.random() * 0.15 };
    }).sort((a, b) => b.score - a.score);
    const _evEmissary = _evScores[0].name;
    const _evEmS = pStats(_evEmissary);
    const _evArch = _evEmS.archetype || 'neutral';

    ep.emissary = { name: _evEmissary, tribe: _evWinTribe.name, targetTribe: _evLoseTribe.name };

    // ── Archetype-flavored volunteer dialogue ──
    const _evVolunteerText = ['villain','schemer','mastermind'].includes(_evArch)
      ? `${_evEmissary} volunteers with a thin smile. "I'll handle this."`
      : ['hero','loyal','protector'].includes(_evArch)
      ? `${_evEmissary} steps forward reluctantly. "Someone has to do it. Might as well be me."`
      : ['floater','follower'].includes(_evArch)
      ? `${_evEmissary} shrugs and volunteers. "Sure, I'll go check it out."`
      : `${_evEmissary} volunteers. "I want to see what's going on over there."`;

    // ── Own tribe bond shifts ──
    _evWinMembers.filter(p => p !== _evEmissary).forEach(p => {
      const pS = pStats(p);
      if (['villain','schemer','mastermind'].includes(_evArch)) {
        const suspicion = -pS.intuition * 0.04;
        const admiration = 0.3;
        addBond(p, _evEmissary, admiration + suspicion);
      } else {
        addBond(p, _evEmissary, 0.3);
      }
    });

    // ── Camp event on winning tribe ──
    const _evWinKey = _evWinTribe.name;
    if (!ep.campEvents) ep.campEvents = {};
    if (!ep.campEvents[_evWinKey]) ep.campEvents[_evWinKey] = { pre: [], post: [] };
    if (!ep.campEvents[_evWinKey].post) ep.campEvents[_evWinKey].post = [];
    ep.campEvents[_evWinKey].post.push({
      type: 'emissaryVolunteer',
      players: [_evEmissary, ..._evWinMembers.filter(p => p !== _evEmissary).slice(0, 2)],
      text: _evVolunteerText,
      consequences: `${_evEmissary} will visit ${_evLoseTribe.name}'s tribal council.`,
      badgeText: 'EMISSARY', badgeClass: 'gold'
    });
  }

  // ── EMISSARY VOTE: scouting events at losing tribe's camp ──
export function generateEmissaryScoutEvents(ep) {
    if (!ep.emissary) return;
    const emissary = ep.emissary.name;
    const emS = pStats(emissary);
    const emPr = pronouns(emissary);
    const emArch = emS.archetype || 'neutral';
    const loseTribeName = ep.emissary.targetTribe;
    const loseTribe = gs.tribes.find(t => t.name === loseTribeName);
    if (!loseTribe) return;
    const loseMembers = loseTribe.members.filter(m => gs.activePlayers.includes(m));
    if (!loseMembers.length) return;

    ep.emissaryScoutEvents = [];
    const _evCampKey = loseTribeName;
    if (!ep.campEvents) ep.campEvents = {};
    if (!ep.campEvents[_evCampKey]) ep.campEvents[_evCampKey] = { pre: [], post: [] };
    if (!ep.campEvents[_evCampKey].post) ep.campEvents[_evCampKey].post = [];

    // ── 1. PITCHES (1-2 losing tribe members approach the emissary) ──
    const _evPitchCandidates = loseMembers.map(name => {
      const s = pStats(name);
      const heat = computeHeat(name, loseMembers, ep.alliances || []);
      const bond = getBond(emissary, name);
      return { name, score: s.social * 0.05 + s.strategic * 0.04 + heat * 0.03 + bond * 0.02 + Math.random() * 0.10 };
    }).sort((a, b) => b.score - a.score);

    const _evPitchCount = Math.min(_evPitchCandidates.length, Math.random() < 0.4 ? 2 : 1);
    const _evPitchers = _evPitchCandidates.slice(0, _evPitchCount);

    _evPitchers.forEach(pitcher => {
      const pS = pStats(pitcher.name);
      const pPr = pronouns(pitcher.name);
      const _evRivals = loseMembers.filter(p => p !== pitcher.name)
        .map(p => ({ name: p, bond: getBond(pitcher.name, p) }))
        .sort((a, b) => a.bond - b.bond);
      const pitchTarget = _evRivals[0]?.name || null;
      if (!pitchTarget) return;

      const receptiveness = getBond(emissary, pitcher.name) * 0.10 + pS.social * 0.05 + Math.random() * 0.15;
      const pitchStrength = Math.max(0, Math.min(1, receptiveness));

      const pitchEvent = {
        type: 'emissaryPitch',
        players: [pitcher.name, emissary],
        pitcher: pitcher.name,
        pitchTarget: pitchTarget,
        pitchStrength: pitchStrength,
        text: (['villain','schemer','mastermind'].includes(pS.archetype)
          ? `${pitcher.name} corners ${emissary}. "Get rid of ${pitchTarget}. ${pronouns(pitchTarget).Sub} ${pronouns(pitchTarget).sub==='they'?'are':'is'} playing everyone."`
          : pS.strategic >= 7
          ? `${pitcher.name} lays out the case to ${emissary}. "${pitchTarget} is the biggest threat here. The numbers don't lie."`
          : pS.social >= 7
          ? `${pitcher.name} pulls ${emissary} aside. "Nobody here would miss ${pitchTarget}. Trust me on this."`
          : `${pitcher.name} approaches ${emissary}. "${pitchTarget} is the weakest link. Just saying."`),
        consequences: `Pitch influence: ${(pitchStrength * 100).toFixed(0)}% receptiveness.`,
        badgeText: 'PITCH', badgeClass: 'gold'
      };
      ep.emissaryScoutEvents.push(pitchEvent);
      ep.campEvents[_evCampKey].post.push(pitchEvent);

      addBond(pitcher.name, emissary, 0.3);
      addBond(emissary, pitcher.name, pitchStrength * 0.4);
    });

    // ── 2. OBSERVATION (emissary reads the tribe) ──
    const _evObsQuality = emS.intuition * 0.07 + emS.mental * 0.025 + Math.random() * 0.10;
    const _evMostIsolated = loseMembers.map(name => {
      const avgBond = loseMembers.filter(p => p !== name).reduce((sum, p) => sum + getBond(name, p), 0) / Math.max(1, loseMembers.length - 1);
      return { name, avgBond };
    }).sort((a, b) => a.avgBond - b.avgBond)[0];

    const obsText = _evObsQuality > 0.5
      ? `${emissary} watches carefully. ${emPr.Sub} notices ${_evMostIsolated?.name || 'tension'} seems isolated — conversations stop when ${pronouns(_evMostIsolated?.name || emissary).sub} walks by.`
      : `${emissary} tries to read the tribe, but it's hard to tell who's really on the outs.`;

    const obsEvent = {
      type: 'emissaryObservation',
      players: [emissary, ...(_evMostIsolated ? [_evMostIsolated.name] : [])],
      text: obsText,
      observationQuality: _evObsQuality,
      isolatedPlayer: _evMostIsolated?.name || null,
      consequences: _evObsQuality > 0.5 ? `${emissary} identified ${_evMostIsolated?.name} as isolated.` : 'Surface-level read only.',
      badgeText: 'EMISSARY', badgeClass: 'blue'
    };
    ep.emissaryScoutEvents.push(obsEvent);
    ep.campEvents[_evCampKey].post.push(obsEvent);

    // ── 3. ALLIANCE OFFER (optional — if emissary has strong existing bond) ──
    const _evAllyCandidate = loseMembers.find(p => getBond(emissary, p) >= 3.0);
    if (_evAllyCandidate && Math.random() < 0.6) {
      const _evAllyBond = getBond(emissary, _evAllyCandidate);
      if (!gs.sideDeals) gs.sideDeals = [];
      const _evGenuine = emS.loyalty * 0.08 + _evAllyBond * 0.05 + Math.random() * 0.15 > 0.5;
      gs.sideDeals.push({
        players: [emissary, _evAllyCandidate],
        initiator: emissary,
        madeEp: (gs.episode || 0) + 1,
        type: 'f2',
        active: true,
        genuine: _evGenuine
      });

      const dealEvent = {
        type: 'emissaryDeal',
        players: [emissary, _evAllyCandidate],
        text: `${emissary} and ${_evAllyCandidate} make a cross-tribe deal. "When we merge, we look out for each other."`,
        consequences: `F2 pact formed (${_evGenuine ? 'genuine' : 'strategic'}).`,
        badgeText: 'CROSS-TRIBE DEAL', badgeClass: 'gold'
      };
      ep.emissaryScoutEvents.push(dealEvent);
      ep.campEvents[_evCampKey].post.push(dealEvent);
      addBond(emissary, _evAllyCandidate, 0.5);
      addBond(_evAllyCandidate, emissary, 0.5);
    }
  }

export function generateCampEventsForGroup(group, finds, twistBoosts = {}, maxEvents = null, ep = null) {
  const events = [];
  if (group.length < 2) return events;

  const numEvents = maxEvents ?? (Math.floor(Math.random() * 5) + Math.max(10, Math.floor(group.length * 1.5)));
  const boosts = twistBoosts || {};
  // Social players generate more bonding events — proportional boost per social player on tribe
  // Also generates conflict — high-social tribes have more drama too (people care more → conflicts matter more)
  const _groupSocialBoost = group.reduce((sum, p) => sum + pStats(p).social * 0.01, 0);
  if (_groupSocialBoost > 0) {
    boosts.tdBond = (boosts.tdBond || 0) + Math.round(_groupSocialBoost * 6);
    boosts.bond = (boosts.bond || 0) + Math.round(_groupSocialBoost * 5);
    boosts.comfort = (boosts.comfort || 0) + Math.round(_groupSocialBoost * 3);
    boosts.groupLaugh = (boosts.groupLaugh || 0) + Math.round(_groupSocialBoost * 3);
    // Social tribes also have more interpersonal friction — people who care have bigger reactions
    boosts.dispute = (boosts.dispute || 0) + Math.round(_groupSocialBoost * 3);
    boosts.rumor = (boosts.rumor || 0) + Math.round(_groupSocialBoost * 2);
    boosts.watchingYou = (boosts.watchingYou || 0) + Math.round(_groupSocialBoost * 2);
  }

  // If any advantage was found by someone in this group, always open with that event
  // beware-activated is a global event — include it regardless of finder
  const findsInGroup = finds.filter(f => f.type === 'beware-activated' || group.includes(f.finder));
  findsInGroup.forEach(find => {
    const name = find.finder;
    // Auction idol find — use auction-specific narrative
    if (find.fromAuction) {
      events.push(scriptEvent({ type: 'idolFound', players: [name], badgeText: 'IDOL FOUND', badgeClass: 'gold' },
        makeScene('adv.found', { a: name }, { ending: 'auction' }, [], { id: 'confessional', label: 'Confessional' })));
      return;
    }
    // Gift 2 (idol clue) — narrative already handled by ep.giftNarrativeEvents injection; skip duplicate
    if (find.fromGift2) return;
    // Beware activation is a group event — handle separately
    if (find.type === 'beware-activated') {
      // Each holder in this camp tells the camera: the idol is live, and the vote is back.
      const _here = (find.holders || []).filter(h => group.includes(h));
      if (_here.length) events.push(scriptEventParts({ type: 'idolFound', players: find.holders || [], badgeText: 'IDOLS ACTIVATED', badgeClass: 'gold' },
        _here.slice(0, 2).map(h => makeScene('adv.found', { a: h }, { ending: 'beware-live' }, [], { id: 'confessional', label: 'Confessional' }))));
      return;
    }
    const advType = find.type || 'idol';
    // What can be found here, by its engine name (the scene's ending).
    const FINDABLE = ["idol", "extraVote", "voteSteal", "legacy", "kip", "amulet", "secondLife", "idol-totem", "beware"];
    // Tactical advantages (teamSwap, voteBlock, voteSteal, safetyNoPower, soleVote) already
    // generate their own discovery camp events via key+'Found' in findAdvantages — skip them here
    if (['teamSwap', 'voteBlock', 'voteSteal', 'safetyNoPower', 'soleVote'].includes(advType)) return;
    Math.random(); // the draw that picked the sentence (the season must not move)
    const _found = FINDABLE.includes(advType) ? advType : 'idol';
    events.push(scriptEvent({ type: 'idolFound', advType, players: [name], badgeText: 'ADVANTAGE FOUND', badgeClass: 'gold' },
      makeScene('adv.found', { a: name }, { ending: _found.toLowerCase() }, [], { id: 'confessional', label: 'Confessional' })));
  });

  // Chain of Command aftermath — gratitude, resentment, blame
  if (gs._chainCampEvents && gs._chainCampEvents.length > 0) {
    const _cocEvts = gs._chainCampEvents.splice(0);
    const _cocPk = arr => arr[Math.floor(Math.random() * arr.length)];
    _cocEvts.forEach(evt => {
      if (evt.type === 'chainGratitude' && group.includes(evt.picked) && group.includes(evt.picker)) {
        const pr = pronouns(evt.picked);
        addBond(evt.picked, evt.picker, 1);
        events.push({ type: 'chainGratitude', players: [evt.picked, evt.picker], badgeText: 'GRATEFUL', badgeClass: 'green',
          text: _cocPk([
            `${evt.picked} pulls ${evt.picker} aside. "You picked me early. I won't forget that." ${pr.PosAdj} loyalty runs deep.`,
            `${evt.picked} thanks ${evt.picker} quietly, off to the side. The early pick meant everything — a public declaration of trust.`,
            `"You saved me when you didn't have to." ${evt.picked} looks at ${evt.picker} with genuine gratitude. Their bond is stronger now.`,
            `${evt.picked} finds ${evt.picker} alone. "I know what that pick meant. I've got your back." The alliance solidifies.`,
          ]) });
      } else if (evt.type === 'chainResentment' && group.includes(evt.picked) && group.includes(evt.picker)) {
        const pr = pronouns(evt.picked);
        addBond(evt.picked, evt.picker, -1);
        events.push({ type: 'chainResentment', players: [evt.picked, evt.picker], badgeText: 'RESENTFUL', badgeClass: 'red',
          text: _cocPk([
            `${evt.picked} corners ${evt.picker}. "You picked me LAST. Everyone saw that." The damage is done.`,
            `"I was your afterthought." ${evt.picked} won't look at ${evt.picker}. The late pick exposed where ${pr.sub} really stand${pr.sub === 'they' ? '' : 's'}.`,
            `${evt.picked} brings it up at camp. "You had choices and I was at the bottom. That tells me everything." ${evt.picker} has no good answer.`,
            `The confrontation is quiet but brutal. ${evt.picked} asks ${evt.picker} one question: "Why was I last?" The silence says everything.`,
          ]) });
      } else if (evt.type === 'chainBlame' && group.includes(evt.ally) && group.includes(evt.immunityWinner)) {
        addBond(evt.ally, evt.immunityWinner, -2);
        events.push({ type: 'chainBlame', players: [evt.ally, evt.immunityWinner], badgeText: 'BLAME', badgeClass: 'red',
          text: _cocPk([
            `${evt.ally} gets in ${evt.immunityWinner}'s face. "You started that chain. ${evt.eliminated} is gone because of YOU." The accusation hangs in the air.`,
            `"You had the power and you used it to destroy someone." ${evt.ally} won't let ${evt.immunityWinner} forget what happened to ${evt.eliminated}.`,
            `${evt.ally} blames ${evt.immunityWinner} for everything. "That chain was YOUR doing. ${evt.eliminated} never had a chance." The camp goes silent.`,
            `"You picked first. You set the order. ${evt.eliminated}'s blood is on your hands." ${evt.ally} is furious. ${evt.immunityWinner} has made a permanent enemy.`,
          ]) });
      }
    });
  }

  // Participation tracker — penalises players already featured in loop events (weight ÷ 1.9^appearances).
  // Idol finds are excluded so finding an advantage doesn't burn a player's screentime quota.
  const _parts = {};
  const _pick = (arr, fn) => {
    const r = wRandom(arr, n => Math.max(0.01, fn(n) / Math.pow(1.9, _parts[n]||0)));
    if (typeof r === 'string') _parts[r] = (_parts[r]||0)+1;
    return r;
  };
  // plain uniform pick from a line pool (used by the newer setting-exclusive events)
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const _pron = n => pronouns(n);

  // Track per-pair bond events to prevent the same pair from stacking too many in one phase
  const _pairBondCount = {};
  const _pairKey = (a, b) => [a, b].sort().join('|');
  const _canBond = (a, b) => (_pairBondCount[_pairKey(a, b)] || 0) < 2; // max 2 bond events per pair per phase
  const _trackBond = (a, b) => { const k = _pairKey(a, b); _pairBondCount[k] = (_pairBondCount[k] || 0) + 1; };

  // ── Variety control: avoid repeating loud beats within a feed or across recent episodes ──
  // Recency is keyed PER TRIBE (or 'merge' post-merge) so separate tribes stay independent storylines
  // — a beat in one tribe never suppresses another, and there's no first-tribe ordering bias.
  const _epNum = ep?.num || (gs.episode || 0) + 1;
  const _beatKey = gs.isMerged ? 'merge' : (gs.tribes?.find(t => group.some(m => t.members.includes(m)))?.name || 'group');
  if (!gs._recentCampBeats) gs._recentCampBeats = {};
  const _beatLog = (gs._recentCampBeats[_beatKey] = (gs._recentCampBeats[_beatKey] || []).filter(r => _epNum - r.ep <= 2)); // keep last 2 eps
  const _recentBeat = t => _beatLog.some(r => r.type === t);
  const _firedThisGroup = {};

  // SETTING GATE: hard-filter to events valid for this venue BEFORE weighting.
  // (wRandom clamps every weight to >=0.01, so a zero weight would still leak —
  // exclusion has to happen by removing the item from the pool.)
  const _settingPool = CAMP_EVENT_TYPES.filter(e => eventAllowedInSetting(e.id));

  for (let i = 0; i < numEvents; i++) {
    const eventType = wRandom(_settingPool, e => {
      let w = (e.weight + (boosts[e.id] || 0)) * settingWeightMod(e.id);
      // Within-episode dedup: a loud beat shouldn't fire twice in the same camp feed
      if (_firedThisGroup[e.id] && (_CAMP_BEAT_SIGNATURE.has(e.id) || _CAMP_BEAT_TEXTURE.has(e.id))) w *= 0.15;
      // Cross-episode cooldown: signature beats used in the last 2 eps are downweighted
      if (_CAMP_BEAT_SIGNATURE.has(e.id) && _recentBeat(e.id)) w *= 0.3;
      return Math.max(0.05, w);
    }).id;
    // Record for variety control (cross-episode entry only once per type per episode, per tribe)
    _firedThisGroup[eventType] = (_firedThisGroup[eventType] || 0) + 1;
    if (_CAMP_BEAT_SIGNATURE.has(eventType) && !_beatLog.some(r => r.type === eventType && r.ep === _epNum)) {
      _beatLog.push({ type: eventType, ep: _epNum });
    }

    if (eventType === 'fight') {
      // Low temperament = more likely to snap. Low loyalty = doesn't suppress it for the group.
      const a = _pick(group, n => Math.max(0.1, (10 - pStats(n).temperament) * 0.5 + pStats(n).boldness * 0.3 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, (5 - getBond(a, n)) * 0.4 + (10 - pStats(n).temperament) * 0.15 + 1));
      addBond(a, b, -1.5);
      // The bond hit above owns dislike/trust/resentment. Record the semantic
      // direction separately: a was the aggressor and b was in the blast radius.
      recordIntimidation(a, b, { strength: 0.45, applyWarmth: false, ep: _epNum });
      const tmpA = pStats(a).temperament;
      Math.random(); // the draw that picked the sentence (the season must not move)
      const _fightEv = scriptEvent({ type: 'fight', players: [a, b], badgeText: 'FIGHT', badgeClass: 'red' },
        makeScene('drama.fight', { a, b }, { ending: tmpA <= 2 ? 'erupt' : tmpA <= 4 ? 'snap' : tmpA <= 6 ? 'tense' : 'rare' }, [], _spotNow(a, b)));
      events.push(_fightEv);
      const _fightText = _fightEv.text;
      if (!gs._blowupPlayers) gs._blowupPlayers = [];
      if (!gs._blowupPlayers.some(r => r.name === a)) gs._blowupPlayers.push({ name: a, type: 'fight', target: b, incident: _fightText });

    } else if (eventType === 'bond') {
      // High social = initiates. High temperament = calm enough to open up genuinely.
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.4 + pStats(n).temperament * 0.15 + 1));
      const others = group.filter(p => p !== a && _canBond(a, p));
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.3 + pStats(n).social * 0.3 + 2));
      addBond(a, b, 0.5);
      _trackBond(a, b);
      const socA = pStats(a).social;
      const tmpA = pStats(a).temperament;
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'bond', players: [a, b], badgeText: 'BONDING', badgeClass: 'green' },
        makeScene('friend.bond', { a, b }, {}, [], _spotNow(a, b))));

    } else if (eventType === 'meltdown') {
      // Very low temperament + high boldness = full breakdown. Low temperament alone = implosion.
      const p = _pick(group, n => Math.max(0.1, (10 - pStats(n).temperament) * 0.6 + pStats(n).boldness * 0.3 + 1));
      group.filter(x => x !== p).forEach(other => addBond(p, other, -0.3));
      const tmpP = pStats(p).temperament;
      const _mpP = pronouns(p);
      const _hve = _mpP.sub === 'they' ? "they've" : _mpP.sub === 'she' ? "she's" : "he's";
      Math.random(); // the draw that picked the sentence (the season must not move)
      const _mdEv = scriptEvent({ type: 'meltdown', player: p, players: [p], badgeText: 'MELTDOWN', badgeClass: 'red' },
        makeScene('drama.meltdown', { a: p }, { ending: tmpP <= 2 ? 'total' : tmpP <= 4 ? 'crack' : 'rare' }, [], _spotNow(p, null)));
      events.push(_mdEv);
      const _meltdownText = _mdEv.text;
      if (!gs._blowupPlayers) gs._blowupPlayers = [];
      if (!gs._blowupPlayers.some(r => r.name === p)) gs._blowupPlayers.push({ name: p, type: 'meltdown', target: null, incident: _meltdownText });

    } else if (eventType === 'hardWork') {
      const p = _pick(group, n => Math.max(0.1, pStats(n).loyalty + pStats(n).endurance * 0.2 + 1));
      group.filter(x => x !== p).forEach(other => addBond(p, other, 0.08)); // was 0.15 — hardWork to ALL tribe is too much
      const _hwP = pronouns(p);
      Math.random(); // the draw that picked the sentence (the season must not move)
      const _wit = _twoOthers(group, p)[0];   // who sees it (closest by bond; no dice)
      events.push(scriptEvent({ type: 'hardWork', player: p, players: [p], badgeText: 'HARD WORK', badgeClass: 'green' },
        makeScene('life.work', { a: p, b: _wit }, {}, [], _spotNow(p, _wit))));

    } else if (eventType === 'strategicTalk') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).strategic * pStats(n).strategic * 0.1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) + pStats(n).social * 0.2 + 1));
      addBond(a, b, 0.5);
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'strategicTalk', players: [a, b], badgeText: 'STRATEGY', badgeClass: 'gold' },
        makeScene('talk.game', { a, b }, {}, [], _spotNow(a, b))));

    } else if (eventType === 'dispute') {
      // Strategic + bold initiates disputes. Low temperament makes them escalate faster.
      const a = _pick(group, n => Math.max(0.1, pStats(n).strategic * 0.4 + pStats(n).boldness * 0.3 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, (5 - getBond(a, n)) * 0.3 + pStats(n).strategic * 0.2 + 1));
      addBond(a, b, -0.8);
      const tmpA = pStats(a).temperament;
      const strA = pStats(a).strategic;
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'dispute', players: [a, b], badgeText: 'DISPUTE', badgeClass: 'red' },
        makeScene('drama.dispute', { a, b }, { ending: (tmpA <= 3 && strA >= 7) ? 'callout' : (tmpA <= 5 && strA >= 7) ? 'press' : strA >= 8 ? 'precise' : 'plain' }, [], _spotNow(a, b))));

    } else if (eventType === 'idolSearch') {
      const searchers = group.filter(n => !findsInGroup.some(f => f.finder === n));
      if (!searchers.length) continue;
      const p = _pick(searchers, n => Math.max(0.1, pStats(n).intuition * 0.5 + 1));
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'idolSearch', players: [p], badgeText: 'SEARCHING', badgeClass: 'gold' },
        makeScene('adv.search', { a: p }, {}, [], { id: 'confessional', label: 'Confessional' })));

    } else if (eventType === 'injury') {
      // Low survival = more injury-prone (weakened body). Survival 80 = 1x, 40 = 1.6x, 20 = 2.2x
      const p = _pick(group, n => {
        const _survMult = seasonConfig.foodWater === 'enabled' && gs.survival
          ? 1.0 + Math.max(0, (70 - (gs.survival[n] || 80)) * 0.02) : 1.0;
        return Math.max(0.1, ((10 - pStats(n).endurance) * 0.5 + 1) * _survMult);
      });
      const _ijP = pronouns(p);
      Math.random(); // the draw that picked the sentence (the season must not move)
      const _wit = _twoOthers(group, p)[0];   // who sees it (closest by bond; no dice)
      events.push(scriptEvent({ type: 'injury', player: p, players: [p], badgeText: 'INJURY', badgeClass: 'red' },
        makeScene('life.hurt', { a: p, b: _wit }, {}, [], _spotNow(p, _wit))));

    } else if (eventType === 'allianceForm') {
      // Skip if this group already has an allianceForm this episode
      if (events.filter(e => e.type === 'allianceForm').length >= 2) continue;

      // Helper: create alliance, boost bonds, push event
      // Guards: duplicate check + hostile members check
      const _createAlliance = (members, sceneOf) => {
        const _sorted = [...members].sort();
        const _alreadyAllied = gs.namedAlliances?.some(a => a.active && _sorted.length === a.members.length && _sorted.every(m => a.members.includes(m)));
        const _pairAlreadyAllied = members.length === 2 && gs.namedAlliances?.some(a => a.active && a.members.includes(members[0]) && a.members.includes(members[1]));
        if (_alreadyAllied || _pairAlreadyAllied) return;
        // Don't form alliances between players who dislike each other
        // Strategic players (≥7) can bridge slight negativity — they make pitches that work even without chemistry
        const _maxStrategic = Math.max(...members.map(m => pStats(m).strategic));
        const _bondFloor = 0.5 - _maxStrategic * 0.15; // stat 5=-0.25, stat 8=-0.70, stat 10=-1.0
        for (let x = 0; x < members.length; x++) {
          for (let y = x + 1; y < members.length; y++) {
            if (getBond(members[x], members[y]) < _bondFloor) return;
          }
        }
        const allianceName = nameNewAlliance(members.length);
        gs.namedAlliances.push({ id: `alliance_${Date.now()}_${Math.floor(Math.random()*1000)}`, name: allianceName, members: [...members], formed: gs.episode + 1, betrayals: [], active: true });
        for (let x = 0; x < members.length; x++) for (let y = x + 1; y < members.length; y++) addBond(members[x], members[y], 0.2);
        events.push(scriptEvent({ type: 'allianceForm', alliance: allianceName, members, players: members, badgeText: 'ALLIANCE', badgeClass: 'gold' },
          sceneOf(allianceName)));
      };
      const _isAllied = p => gs.namedAlliances?.some(a => a.active && a.members.includes(p) && a.members.filter(m => group.includes(m)).length >= 2);
      // Global cap: max active alliances scales with active player count
      // 10 players → max 4 alliances, 8 → max 3, 6 → max 2
      const _globalAllianceCount = (gs.namedAlliances || []).filter(a => a.active).length;
      const _globalCap = Math.max(3, Math.floor(gs.activePlayers.length / 2));
      if (_globalAllianceCount >= _globalCap) continue; // don't form more — skip to next event type
      // Cap: players in too many active alliances shouldn't form more (overcommitted)
      // Strategic players can juggle more alliances without being overcommitted
      // Coaches present at this camp — the alliance triggers below pair on
      // bonds, and a coach only has bonds with the people they trained.
      const _campCoaches = group.filter(n => isCoachName(n));
      const _isOvercommitted = p => {
        const _activeCount = (gs.namedAlliances || []).filter(a => a.active && a.members.includes(p)).length;
        const _cap = 1 + Math.floor(pStats(p).strategic * 0.2); // stat 3=1, stat 5=2, stat 7=2, stat 10=3
        return _activeCount >= _cap;
      };
      const _rpl = arr => arr[Math.floor(Math.random() * arr.length)];

      // Pick which formation trigger to attempt (weighted by game state)
      const _triggers = [];

      // ── TRIGGER 1: Strategic pitch — strategic OR social player recruits by affinity ──
      // Strategic players recruit via game logic; social players recruit via personal charm
      // Proportional: any player can initiate, chance scales with strategic/social
      const _stratPlayers = group.filter(n => {
        const _ns = pStats(n);
        return Math.random() < Math.max(_ns.strategic, _ns.social) * 0.08 && !_isOvercommitted(n);
      });
      if (_stratPlayers.length) _triggers.push({ id: 'strategic-pitch', weight: 10 });

      // ── TRIGGER 2: Power couple — two players with strong bond who aren't allied ──
      // Probability scales: bond 2 = unlikely, bond 5 = likely, bond 8+ = near-certain
      let _pcPair = null;
      for (let i = 0; i < group.length && !_pcPair; i++) {
        for (let j = i + 1; j < group.length && !_pcPair; j++) {
          const _pcBond = getBond(group[i], group[j]);
          if (_pcBond >= 1 && Math.random() < (_pcBond - 1) * 0.15 && !gs.namedAlliances?.some(a => a.active && a.members.includes(group[i]) && a.members.includes(group[j])))
            _pcPair = [group[i], group[j]];
        }
      }
      if (_pcPair) _triggers.push({ id: 'power-couple', weight: 8 });

      // ── TRIGGER 3: Mutual enemy — two unallied players who both dislike someone ──
      // Scales: deeper mutual hatred = easier trigger
      let _mePair = null, _meEnemy = null;
      const _unallied = group.filter(n => !_isOvercommitted(n));
      for (let i = 0; i < _unallied.length && !_mePair; i++) {
        for (let j = i + 1; j < _unallied.length && !_mePair; j++) {
          if (getBond(_unallied[i], _unallied[j]) < -0.5) continue;
          const enemy = group.find(e => {
            if (e === _unallied[i] || e === _unallied[j]) return false;
            const h1 = getBond(_unallied[i], e), h2 = getBond(_unallied[j], e);
            return h1 <= -1 && h2 <= -1 && (h1 + h2) <= -3; // combined hatred must be significant
          });
          if (enemy) { _mePair = [_unallied[i], _unallied[j]]; _meEnemy = enemy; }
        }
      }
      if (_mePair) _triggers.push({ id: 'mutual-enemy', weight: 7 });

      // ── TRIGGER 4: Survival pact — minority players (bottom bonds) band together ──
      const _bottomPlayers = [...group].sort((a,b) => {
        const avgA = group.filter(p=>p!==a).reduce((s,p)=>s+getBond(a,p),0)/(group.length-1||1);
        const avgB = group.filter(p=>p!==b).reduce((s,p)=>s+getBond(b,p),0)/(group.length-1||1);
        return avgA - avgB;
      }).slice(0, 2).filter(n => !_isAllied(n));
      if (_bottomPlayers.length >= 2 && getBond(_bottomPlayers[0], _bottomPlayers[1]) > -1) _triggers.push({ id: 'survival-pact', weight: 6 });

      // ── TRIGGER 5: Shared struggle — two players who survived close votes together ──
      let _ssPair = null;
      const _recentEps = (gs.episodeHistory || []).slice(-3);
      for (const re of _recentEps) {
        const vlog = re.votingLog || [];
        const targetedPlayers = group.filter(n => vlog.filter(v => v.voted === n).length >= 2 && n !== re.eliminated);
        if (targetedPlayers.length >= 2 && getBond(targetedPlayers[0], targetedPlayers[1]) >= 0) {
          if (!gs.namedAlliances?.some(a => a.active && a.members.includes(targetedPlayers[0]) && a.members.includes(targetedPlayers[1]))) {
            _ssPair = targetedPlayers.slice(0, 2);
            break;
          }
        }
      }
      if (_ssPair) _triggers.push({ id: 'shared-struggle', weight: 7 });

      // ── TRIGGER: the coach and the player they built ──────────────────
      // Coaches are 25% of a two-coach camp and were reaching only 13% of its
      // alliances, because every trigger above pairs on strong mutual bonds
      // and a coach's relationships form through sessions with one or two
      // people rather than across the whole beach. The training relationship
      // IS the basis for an alliance — it is the twist's own answer to how a
      // coach builds influence — and nothing was using it.
      let _cpPair = null;
      for (const _cc of _campCoaches) {
        if (_isOvercommitted(_cc)) continue;
        const _banked = Object.entries(gs.coachTraining?.[_cc] || {})
          .filter(([n]) => group.includes(n) && !_isOvercommitted(n))
          .sort(([, a], [, b]) => {
            const sa = Object.values(a).reduce((t, v) => t + Math.max(0, v), 0);
            const sb = Object.values(b).reduce((t, v) => t + Math.max(0, v), 0);
            return sb - sa;
          });
        const _best = _banked.find(([n]) => getBond(_cc, n) > 0);
        if (_best) { _cpPair = [_cc, _best[0]]; break; }
      }
      if (_cpPair) _triggers.push({ id: 'coach-protege', weight: 9 });

      if (!_triggers.length) continue;

      // Weighted random pick from available triggers
      const _totalW = _triggers.reduce((s,t) => s + t.weight, 0);
      let _roll = Math.random() * _totalW;
      let _chosen = _triggers[0];
      for (const t of _triggers) { _roll -= t.weight; if (_roll <= 0) { _chosen = t; break; } }

      // Execute the chosen trigger
      if (_chosen.id === 'coach-protege' && _cpPair) {
        const [_cA, _cB] = _cpPair;
        _createAlliance([_cA, _cB], name => makeScene('alliance.form', { a: _cA, b: _cB }, { ending: 'coach', group: name }, [], _spotNow(_cA, _cB)));
      } else if (_chosen.id === 'strategic-pitch') {
        // Pick initiator: highest strategic OR social (social butterflies can recruit too)
        const initiator = _stratPlayers.sort((a,b) => Math.max(pStats(b).strategic, pStats(b).social) - Math.max(pStats(a).strategic, pStats(a).social))[0];
        const _initS = pStats(initiator);
        // Social initiators get a charm bonus — people are drawn to them naturally
        const _socialCharm = _initS.social * 0.05; // proportional: stat 3=0.15, stat 7=0.35, stat 10=0.50
        const recruits = group.filter(p => p !== initiator)
          .map(p => ({ name: p, score: getBond(initiator, p) * 0.5 + pStats(p).loyalty * 0.15 + _socialCharm + Math.random() * 0.5 }))
          .sort((a, b) => b.score - a.score)
          .slice(0, Math.min(2 + Math.floor(Math.random() * 2), group.length - 1))
          .filter(r => r.score > -0.5 && getBond(initiator, r.name) > -2.5)
          .filter(r => { const rel = relationships.find(rx => [rx.a,rx.b].sort().join('|') === [initiator,r.name].sort().join('|')); return !rel || rel.type !== 'enemy'; })
          .map(r => r.name);
        const safeRecruits = recruits.reduce((acc, name) => {
          const conflict = acc.some(ex => getBond(ex, name) <= -2);
          return conflict ? acc : [...acc, name];
        }, []);
        if (!safeRecruits.length) continue;
        const allianceMembers = [initiator, ...safeRecruits];
        if (gs.namedAlliances?.some(a => a.active && allianceMembers.every(m => a.members.includes(m)))) continue;
        Math.random(); // the draw that picked the sentence
        // a pitches; b and c are the first two recruits; anyone past them is named in {more}.
        const [_r1, _r2, ..._rMore] = safeRecruits;
        _createAlliance(allianceMembers, name => makeScene('alliance.form', { a: initiator, b: _r1, ...(_r2 ? { c: _r2 } : {}) },
          { ending: 'pitch', group: name, more: _rMore.length ? _rMore.join(' and ') : null }, [], _spotNow(initiator, _r1)));

      } else if (_chosen.id === 'power-couple') {
        const [a, b] = _pcPair;
        Math.random(); // the draw that picked the sentence (the season must not move)
        _createAlliance([a, b], name => makeScene('alliance.form', { a, b }, { ending: 'couple', group: name }, [], _spotNow(a, b)));

      } else if (_chosen.id === 'mutual-enemy') {
        const [a, b] = _mePair;
        Math.random(); // the draw that picked the sentence (the season must not move)
        _createAlliance([a, b], name => makeScene('alliance.form', { a, b }, { ending: 'enemy', group: name, target: _meEnemy }, [], _spotNow(a, b)));

      } else if (_chosen.id === 'survival-pact') {
        const [a, b] = _bottomPlayers;
        Math.random(); // the draw that picked the sentence (the season must not move)
        _createAlliance([a, b], name => makeScene('alliance.form', { a, b }, { ending: 'survival', group: name }, [], _spotNow(a, b)));

      } else if (_chosen.id === 'shared-struggle') {
        const [a, b] = _ssPair;
        Math.random(); // the draw that picked the sentence (the season must not move)
        _createAlliance([a, b], name => makeScene('alliance.form', { a, b }, { ending: 'struggle', group: name }, [], _spotNow(a, b)));
      }

    } else if (eventType === 'rumor') {
      // Someone hears their name is being floated — rattles them, slightly damages the spreader's bond
      const target = _pick(group, n => Math.max(0.1, (10 - pStats(n).social) * 0.4 + (10 - pStats(n).boldness) * 0.2 + 1));
      const others = group.filter(p => p !== target);
      if (!others.length) continue;
      const spreader = wRandom(others, n => Math.max(0.1, pStats(n).strategic * 0.3 + (10 - pStats(n).loyalty) * 0.2 + 1));
      addBond(target, spreader, -0.7);
      const tmpT = pStats(target).temperament;
      Math.random(); // the draw that picked the sentence (the season must not move)
      // tmpT is text selection only: a short fuse confronts the spreader, the rest keep it to themselves.
      events.push(scriptEvent({ type: 'rumor', players: [spreader, target], badgeText: 'RUMOR', badgeClass: 'red' },
        tmpT <= 3
          ? makeScene('rumor.heard', { a: target, b: spreader }, { ending: 'confront' }, [], _spotNow(target, spreader))
          : makeScene('rumor.heard', { a: target, b: spreader }, { ending: tmpT <= 6 ? 'stew' : 'shrug' }, [], { id: 'confessional', label: 'Confessional' })));

    } else if (eventType === 'comfort') {
      // One player supports another after a hard day — builds a real bond
      const struggling = _pick(group, n => Math.max(0.1, (10 - pStats(n).temperament) * 0.4 + (10 - pStats(n).endurance) * 0.2 + 1));
      const comforterPool = group.filter(p => p !== struggling && _canBond(p, struggling));
      if (!comforterPool.length) continue;
      const comforter = wRandom(comforterPool, n => Math.max(0.1, pStats(n).social * 0.4 + pStats(n).temperament * 0.2 + 1));
      addBond(comforter, struggling, 0.6);
      addBond(struggling, comforter, 0.4);
      // Comfort is a small protective act. Warmth was already applied above;
      // only add the saved player's modest feeling of debt/gratitude.
      recordProtection(comforter, struggling, { strength: 0.25, applyWarmth: false, ep: _epNum });
      _trackBond(comforter, struggling);
      const socC = pStats(comforter).social;
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'comfort', players: [comforter, struggling], badgeText: 'COMFORT', badgeClass: 'green' },
        makeScene('friend.comfort', { a: comforter, b: struggling }, {}, [], _spotNow(comforter, struggling))));

    } else if (eventType === 'overplay') {
      // Someone is visibly making too many deals — slight bond damage with everyone who notices
      const p = _pick(group, n => Math.max(0.1, pStats(n).strategic * 0.5 + pStats(n).boldness * 0.3 + (10 - pStats(n).temperament) * 0.1 + 1));
      group.filter(x => x !== p).forEach(other => addBond(p, other, -0.4));
      const strP = pStats(p).strategic;
      Math.random();
      events.push(scriptEvent({ type: 'overplay', player: p, players: [p], badgeText: 'OVERPLAYING', badgeClass: 'red' },
        makeScene('conf.overplay', { a: p }, { ending: strP >= 9 ? 'everywhere' : strP >= 7 ? 'overtime' : 'nervous' }, [], { id: 'confessional', label: 'Confessional' })));

    // ══════════════════════════════════════════════════════════
    // TOTAL DRAMA — SOCIAL & BONDING
    // ══════════════════════════════════════════════════════════

    } else if (eventType === 'tdBond') {
      // TD-flavored bonding — covers archetypes the generic 'bond' doesn't
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.4 + pStats(n).loyalty * 0.2 + 1));
      const others = group.filter(p => p !== a && _canBond(a, p));
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.3 + pStats(n).social * 0.3 + 2));
      addBond(a, b, 0.5);
      _trackBond(a, b);
      const sA = pStats(a), sB = pStats(b);
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'tdBond', players: [a, b], badgeText: 'BONDING', badgeClass: 'green' },
        makeScene('friend.goof', { a, b }, {}, [], _spotNow(a, b))));

    } else if (eventType === 'groupLaugh') {
      // A funny shared moment — eases tension camp-wide, small bond to several random pairs
      const p = _pick(group, n => Math.max(0.1, pStats(n).social * 0.5 + pStats(n).boldness * 0.2 + 1));
      const _glP = pronouns(p);
      // Give small bond boost to a random subset of the group
      const shuffled = [...group].sort(() => Math.random() - 0.5);
      for (let i = 0; i < shuffled.length - 1; i += 2) addBond(shuffled[i], shuffled[i+1], 0.5);
      const sP = pStats(p);
      Math.random(); // the draw that picked the sentence (the season must not move)
      // the camp's voices in it: the two closest to p (a group of two is just a moment between them)
      const [_gB, _gC] = _twoOthers(group, p);
      events.push(scriptEvent({ type: 'groupLaugh', player: p, players: [p], badgeText: 'GOOD VIBES', badgeClass: 'green' },
        _gC ? makeScene('friend.laugh', { a: p, b: _gB, c: _gC }, {}, [], _spotNow(p, _gB))
          : makeScene('friend.bond', { a: p, b: _gB }, {}, [], _spotNow(p, _gB || null))));

    } else if (eventType === 'sharedStruggle') {
      // Two players endure something hard together — builds bond even between unlikely pairs
      const a = _pick(group, n => Math.max(0.1, (10 - pStats(n).endurance) * 0.4 + 1));
      const others = group.filter(p => p !== a && _canBond(a, p));
      if (!others.length) continue;
      // Prefer pairs that aren't already close — shared struggle matters more between neutrals/rivals
      const b = wRandom(others, n => Math.max(0.1, (5 - getBond(a, n)) * 0.3 + (10 - pStats(n).endurance) * 0.2 + 1));
      addBond(a, b, 0.5);
      _trackBond(a, b);
      const sA = pStats(a), sB = pStats(b);
      const _ssA = pronouns(a), _ssB = pronouns(b);
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'sharedStruggle', players: [a, b], badgeText: 'SHARED STRUGGLE', badgeClass: 'green' },
        makeScene('friend.struggle', { a, b }, { ending: (sA.endurance <= 4 || sB.endurance <= 4) ? 'empty' : getBond(a, b) < 0 ? 'rivals' : 'plain' }, [], _spotNow(a, b))));

    } else if (eventType === 'rivalThaw') {
      // Two players who have been in conflict find unexpected common ground
      // Only fires if a pair in the group has a negative bond
      const rivals = [];
      for (let i = 0; i < group.length; i++)
        for (let j = i+1; j < group.length; j++)
          if (getBond(group[i], group[j]) < -0.5) rivals.push([group[i], group[j]]);
      if (!rivals.length) continue;
      const [a, b] = rivals[Math.floor(Math.random() * rivals.length)];
      addBond(a, b, 1.2); // partial recovery — doesn't erase the conflict, just softens it
      const sA = pStats(a), sB = pStats(b);
      const _rtA = pronouns(a);
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'rivalThaw', players: [a, b], badgeText: 'THAWING', badgeClass: 'green' },
        makeScene('drama.thaw', { a, b }, { ending: (sA.strategic >= 8 || sB.strategic >= 8) ? 'talk' : (sA.temperament <= 4 && sB.temperament <= 4) ? 'blowup' : 'small' }, [], _spotNow(a, b))));

    } else if (eventType === 'flirtation') {
      // Romantic tension — bond boost for both; others notice
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.5 + pStats(n).boldness * 0.2 + 1));
      const others = group.filter(p => p !== a && romanticCompat(a, p));
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.4 + pStats(n).social * 0.3 + 1));
      addBond(a, b, 1.2);
      const _fA = pronouns(a), _fB = pronouns(b);
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'flirtation', players: [a, b], badgeText: 'SPARKS', badgeClass: 'green' },
        makeScene('romance.flirt', { a, b }, {}, [], _spotNow(a, b))));

    } else if (eventType === 'showmancerMoment') {
      // Showmancer deepens their most important relationship — bigger bond boost than flirtation
      // Strongly prefers showmancer archetype players; falls back to highest-social if none present
      const isShowmancer = n => players.find(p => p.name === n)?.archetype === 'showmancer';
      const showmancers = group.filter(isShowmancer);
      const a = showmancers.length
        ? _pick(showmancers, n => Math.max(0.1, pStats(n).social * 0.5 + 1))
        : _pick(group, n => Math.max(0.1, pStats(n).social * 0.6 + pStats(n).boldness * 0.15 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      // Prefer confirmed showmance partner if present, otherwise closest compatible person
      const compatOthers = others.filter(p => romanticCompat(a, p));
      if (!compatOthers.length) continue;
      const smPartner = getShowmancePartner(a);
      const b = (smPartner && compatOthers.includes(smPartner))
        ? smPartner
        : compatOthers.reduce((best, p) => getBond(a, p) >= getBond(a, best) ? p : best, compatOthers[0]);
      addBond(a, b, 1.5);
      const _sA = pronouns(a), _sB = pronouns(b);
      const isCouple = gs.showmances?.some(sh => sh.players.includes(a) && sh.players.includes(b) && sh.phase !== 'broken-up');
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'showmancerMoment', players: [a, b], badgeText: 'SHOWMANCE', badgeClass: 'green' },
        makeScene('romance.moment', { a, b }, { ending: isCouple ? 'couple' : 'crush' }, [], _spotNow(a, b))));

    } else if (eventType === 'prank') {
      // Prank — goes well or badly depending on target's temperament
      const a = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.4 + pStats(n).social * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, (10 - getBond(a, n)) * 0.1 + 1 + Math.random() * 2));
      const goesWell = pStats(b).temperament >= 6 && pStats(a).social >= 6;
      if (goesWell) {
        addBond(a, b, 0.7);
        group.filter(x => x !== a && x !== b).forEach(x => addBond(a, x, 0.2));
      } else {
        addBond(a, b, -1.2);
      }
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'prank', player: a, players: [a, b], goesWell, badgeText: 'PRANK', badgeClass: 'red' },
        makeScene('drama.prank', { a, b }, { ending: goesWell ? 'well' : 'badly' }, [], _spotNow(a, b))));

    } else if (eventType === 'unexpectedCompetence') {
      // A "weak" player surprises everyone — threat perception shifts
      const p = _pick(group, n => Math.max(0.1, ((10 - pStats(n).physical) * 0.3 + (10 - pStats(n).social) * 0.2) + 1));
      group.filter(x => x !== p).forEach(other => addBond(p, other, 0.12)); // was 0.25
      const _ucP = pronouns(p);
      Math.random(); // the draw that picked the sentence (the season must not move)
      const _wit = _twoOthers(group, p)[0];   // who sees it (closest by bond; no dice)
      events.push(scriptEvent({ type: 'unexpectedCompetence', player: p, players: [p], badgeText: 'SURPRISE', badgeClass: 'green' },
        makeScene('life.surprise', { a: p, b: _wit }, {}, [], _spotNow(p, _wit))));

    } else if (eventType === 'homesick') {
      // Emotional exhaustion — doesn't want sympathy, but the tribe sees it
      const p = _pick(group, n => Math.max(0.1, (10 - pStats(n).boldness) * 0.3 + pStats(n).loyalty * 0.25 + (10 - pStats(n).endurance) * 0.15 + 1));
      const _hkP = pronouns(p);
      Math.random(); // the draw that picked the sentence (the season must not move)
      const _wit = _twoOthers(group, p)[0];   // who sees it (closest by bond; no dice)
      events.push(scriptEvent({ type: 'homesick', player: p, players: [p], badgeText: 'HOMESICK', badgeClass: '' },
        makeScene('life.homesick', { a: p, b: _wit }, {}, [], _spotNow(p, _wit))));

    // ══════════════════════════════════════════════════════════
    // TOTAL DRAMA — CONFLICT & DRAMA
    // ══════════════════════════════════════════════════════════

    } else if (eventType === 'leadershipClash') {
      // Two players both try to direct the group — both take a hit
      const a = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.4 + pStats(n).strategic * 0.3 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, pStats(n).boldness * 0.4 + pStats(n).strategic * 0.3 + 1));
      addBond(a, b, -1.0);
      group.filter(x => x !== a && x !== b).forEach(x => { addBond(a, x, -0.2); addBond(b, x, -0.2); });
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'leadershipClash', players: [a, b], badgeText: 'POWER CLASH', badgeClass: 'red' },
        makeScene('drama.clash', { a, b }, {}, [], _spotNow(a, b))));

    } else if (eventType === 'showboat') {
      // Someone brags — tribe gets quietly irritated
      const p = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.5 + (10 - pStats(n).temperament) * 0.1 + 1));
      group.filter(x => x !== p).forEach(other => addBond(p, other, -0.35));
      const _sbP = pronouns(p);
      const _sbEar = group.filter(x => x !== p).sort((x, y) => getBond(p, x) - getBond(p, y) || x.localeCompare(y))[0];
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'showboat', player: p, players: _sbEar ? [p, _sbEar] : [p], badgeText: 'SHOWBOATING', badgeClass: 'red' },
        makeScene('drama.showboat', _sbEar ? { a: p, b: _sbEar } : { a: p }, {}, [], _spotNow(p, _sbEar || null))));

    } else if (eventType === 'foodConflict') {
      // Someone takes more than their share — targeted resentment
      const a = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.3 + (10 - pStats(n).loyalty) * 0.3 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, pStats(n).loyalty * 0.4 + (10 - pStats(n).temperament) * 0.1 + 1));
      addBond(a, b, -1.0);
      group.filter(x => x !== a && x !== b).forEach(x => addBond(a, x, -0.2));
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'foodConflict', player: a, players: [a, b], badgeText: 'FOOD FIGHT', badgeClass: 'red' },
        makeScene('drama.food', { a, b }, {}, [], _spotNow(a, b))));

    } else if (eventType === 'intimidation') {
      // Physical or social dominant player establishes presence — target is unnerved
      const a = _pick(group, n => Math.max(0.1, pStats(n).physical * 0.4 + pStats(n).boldness * 0.4 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, (10 - pStats(n).boldness) * 0.4 + (10 - pStats(n).physical) * 0.2 + 1));
      addBond(b, a, -0.8);
      recordIntimidation(a, b, { strength: 0.8, applyWarmth: false, ep: _epNum });
      const phA = pStats(a).physical;
      const _intA = pronouns(a);
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'intimidation', players: [a, b], badgeText: 'INTIMIDATION', badgeClass: 'red' },
        makeScene('drama.intimidate', { a, b }, { ending: phA >= 8 ? 'physical' : 'presence' }, [], _spotNow(a, b))));

    // ══════════════════════════════════════════════════════════
    // TOTAL DRAMA — STRATEGY & SCHEMING
    // ══════════════════════════════════════════════════════════

    } else if (eventType === 'tdStrategy') {
      // TD-flavored strategy — covers villain scheming, paranoia, manipulation
      const a = _pick(group, n => Math.max(0.1, pStats(n).strategic * pStats(n).strategic * 0.1 + pStats(n).boldness * 0.2));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.3 + pStats(n).social * 0.2 + 1));
      addBond(a, b, 0.4);
      const sA = pStats(a);
      Math.random(); // the draw that picked the sentence (the season must not move)
      // How a plays it, read from who a is (text selection only; the engine already decided the bond).
      const _tdEnd = (sA.strategic >= 9 && sA.loyalty <= 4) ? 'use' : (sA.strategic >= 8 && sA.boldness >= 7) ? 'map'
        : (sA.social >= 8 && sA.strategic >= 6) ? 'charm' : (sA.boldness <= 4 && sA.strategic >= 7) ? 'quiet' : 'plain';
      events.push(scriptEvent({ type: 'tdStrategy', player: a, players: [a, b], badgeText: 'STRATEGY', badgeClass: 'gold' },
        makeScene('talk.plan', { a, b }, { ending: _tdEnd }, [], _spotNow(a, b))));

    } else if (eventType === 'lie') {
      // Someone plants false information — bond damage if the target finds out
      const a = _pick(group, n => Math.max(0.1, pStats(n).strategic * 0.4 + (10 - pStats(n).loyalty) * 0.35 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      // b = the person being lied TO (receptive)
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) + pStats(n).social * 0.1 + 2));
      // subject = the person being lied ABOUT (a third player if possible)
      const subjects = others.filter(p => p !== b);
      const subject = subjects.length ? subjects[Math.floor(Math.random() * subjects.length)] : b;
      // Slight negative for subject since they're being targeted
      addBond(subject, a, -0.5);
      if (!gs.lieTargetsThisEp) gs.lieTargetsThisEp = new Set();
      gs.lieTargetsThisEp.add(subject);
      Math.random();
      events.push(scriptEvent({ type: 'lie', player: a, players: [a, b], badgeText: 'DECEPTION', badgeClass: 'red' },
        makeScene('talk.lie', { a, b }, { target: subject !== b ? subject : null, ending: subject !== b ? 'about' : 'vague' }, [], _spotNow(a, b))));

    } else if (eventType === 'eavesdrop') {
      // Someone overhears a conversation — strategic info gain, bond shift
      const a = _pick(group, n => Math.max(0.1, pStats(n).intuition * 0.5 + pStats(n).strategic * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, pStats(n).strategic * 0.3 + 1));
      addBond(a, b, -0.8); // a now trusts b less for what they heard
      // Eavesdropper gains an intuition-flavored edge — more likely to play an advantage this episode
      if (!gs.playerStates[a]) gs.playerStates[a] = {};
      gs.playerStates[a].eavesdropBoostThisEp = true;
      const tmpA = pStats(a).temperament;
      Math.random();
      events.push(scriptEvent({ type: 'eavesdrop', players: [a, b], badgeText: 'EAVESDROP', badgeClass: 'red' },
        makeScene('talk.overheard', { a, b }, { ending: tmpA <= 4 ? 'shows' : tmpA <= 6 ? 'files' : 'poker' }, [], _spotNow(a, b))));

    // ══════════════════════════════════════════════════════════
    // FLAVOR / NO IMPACT
    // ══════════════════════════════════════════════════════════

    } else if (eventType === 'confessional') {
      // Player speaks honestly — pure character voice, no bond change
      const p = _pick(group, n => Math.max(0.1, pStats(n).strategic * 0.3 + pStats(n).boldness * 0.2 + (10 - pStats(n).temperament) * 0.2 + 1));
      const sP = pStats(p);
      Math.random();
      const _cfEnd = (sP.strategic >= 9 && sP.loyalty <= 4) ? 'snake' : (sP.temperament <= 3 && sP.boldness >= 7) ? 'vent'
        : (sP.social >= 8) ? 'people' : (sP.boldness <= 3) ? 'quiet' : 'honest';
      events.push(scriptEvent({ type: 'confessional', player: p, players: [p], badgeText: 'CONFESSIONAL', badgeClass: '' },
        makeScene('conf.mind', { a: p }, { ending: _cfEnd }, [], { id: 'confessional', label: 'Confessional' })));

    } else if (eventType === 'doubt') {
      // Player privately questions their position — no bond change, foreshadowing
      const p = _pick(group, n => Math.max(0.1, (10 - pStats(n).boldness) * 0.3 + (10 - pStats(n).social) * 0.2 + 1));
      Math.random();
      events.push(scriptEvent({ type: 'doubt', player: p, players: [p], badgeText: 'DOUBT', badgeClass: 'red' },
        makeScene('conf.doubt', { a: p }, {}, [], { id: 'confessional', label: 'Confessional' })));

    } else if (eventType === 'weirdMoment') {
      // Total Drama absurdism — chaotic, funny, or bizarre — but with real consequences
      const p = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.3 + (10 - pStats(n).temperament) * 0.1 + Math.random() * 2 + 1));
      const others = group.filter(x => x !== p);
      const b = others.length ? others[Math.floor(Math.random() * others.length)] : null;
      const _pPr = pronouns(p);

      // Categorize: argument (conflict), bonding (shared absurdity), solo (chaos/embarrassment)
      const _wmRoll = Math.random();
      if (b && _wmRoll < 0.35) {
        // ── Argument: two players clash over something dumb, tribe picks sides ──
        const _bPr = pronouns(b);
        const _tempAvg = (pStats(p).temperament + pStats(b).temperament) / 2;
        const _bondDrop = _tempAvg <= 4 ? -1.5 : _tempAvg <= 6 ? -1.0 : -0.5;
        addBond(p, b, _bondDrop);
        // Bystanders pick sides — bond toward whoever they're closer to, drift from the other
        others.filter(x => x !== b).forEach(bystander => {
          const _bpBond = getBond(bystander, p);
          const _bbBond = getBond(bystander, b);
          if (_bpBond > _bbBond + 0.5) {
            addBond(bystander, p, 0.3);
            addBond(bystander, b, -0.3);
          } else if (_bbBond > _bpBond + 0.5) {
            addBond(bystander, b, 0.3);
            addBond(bystander, p, -0.3);
          }
        });
        Math.random(); // the draw that picked the sentence (the season must not move)
        events.push(scriptEvent({ type: 'weirdMoment', players: [p, b], badgeText: 'WEIRD', badgeClass: '' },
          makeScene('life.weird', { a: p, b }, { ending: 'argue' }, [], _spotNow(p, b))));

      } else if (b && _wmRoll < 0.60) {
        // ── Bonding: shared absurdity builds connection ──
        addBond(p, b, 0.5);
        // Tribe lightens up — small boost for everyone present
        others.filter(x => x !== b).forEach(bystander => {
          addBond(bystander, p, 0.1);
          addBond(bystander, b, 0.1);
        });
        Math.random(); // the draw that picked the sentence (the season must not move)
        events.push(scriptEvent({ type: 'weirdMoment', players: [p, b], badgeText: 'WEIRD', badgeClass: '' },
          makeScene('life.weird', { a: p, b }, { ending: 'bond' }, [], _spotNow(p, b))));

      } else {
        // ── Solo chaos: embarrassment or endearing moment depending on how they handle it ──
        const _pS = pStats(p);
        if (_pS.boldness >= 6) {
          // Bold players lean into the chaos — tribe finds it endearing
          others.forEach(o => addBond(o, p, 0.2));
          Math.random(); // the draw that picked the sentence (the season must not move)
          events.push(scriptEvent({ type: 'weirdMoment', players: [p], badgeText: 'WEIRD', badgeClass: '' },
            makeScene('life.weird', { a: p, b }, { ending: 'bold' }, [], _spotNow(p, b))));
        } else {
          // Shy/low-temperament players get embarrassed — slight social friction
          others.slice(0, 2).forEach(o => addBond(o, p, -0.2));
          Math.random(); // the draw that picked the sentence (the season must not move)
          events.push(scriptEvent({ type: 'weirdMoment', players: [p], badgeText: 'WEIRD', badgeClass: '' },
            makeScene('life.weird', { a: p, b }, { ending: 'shy' }, [], _spotNow(p, b))));
        }
      }

    } else if (eventType === 'paranoia') {
      const p = _pick(group, n => {
        const st = getPlayerState(n);
        return Math.max(0.1, (10 - pStats(n).temperament) * 0.3 + (st.emotional === 'paranoid' ? 3 : st.emotional === 'desperate' ? 2 : st.emotional === 'uneasy' ? 1 : 0) + 1);
      });
      group.filter(x => x !== p).forEach(other => addBond(p, other, -0.2));
      const paSt = getPlayerState(p);
      Math.random();
      events.push(scriptEvent({ type: 'paranoia', players: [p], badgeText: 'PARANOIA', badgeClass: 'red' },
        makeScene('conf.paranoia', { a: p }, { ending: paSt.emotional === 'desperate' ? 'unraveling' : 'watching' }, [], { id: 'confessional', label: 'Confessional' })));

    } else if (eventType === 'scramble') {
      const a = _pick(group, n => {
        const st = getPlayerState(n);
        return Math.max(0.1, pStats(n).strategic * 0.3 + (st.emotional === 'desperate' ? 4 : st.emotional === 'paranoid' ? 2 : st.emotional === 'uneasy' ? 1 : 0) + 1);
      });
      const scOthers = group.filter(p => p !== a);
      if (!scOthers.length) continue;
      const scB = wRandom(scOthers, n => Math.max(0.1, getBond(a, n) * 0.2 + pStats(n).social * 0.3 + 2));
      addBond(a, scB, 0.3);
      // Tribe reads the scramble — everyone else gets slightly more wary of the scrambler
      group.filter(x => x !== a && x !== scB).forEach(other => addBond(other, a, -0.2));
      if (!gs.scramblingThisEp) gs.scramblingThisEp = new Set();
      gs.scramblingThisEp.add(a);
      const scSt = getPlayerState(a);
      Math.random();
      events.push(scriptEvent({ type: 'scramble', player: a, players: [a], badgeText: 'SCRAMBLING', badgeClass: 'red' },
        makeScene('talk.scramble', { a, b: scB }, { ending: scSt.emotional === 'desperate' ? 'desperate' : 'busy' }, [], _spotNow(a, scB))));

    } else if (eventType === 'overconfidence') {
      const p = _pick(group, n => {
        const st = getPlayerState(n);
        return Math.max(0.1, (st.emotional === 'comfortable' || st.emotional === 'content' || st.emotional === 'confident' ? 3 : 0) + pStats(n).boldness * 0.2 + 1);
      });
      group.filter(x => x !== p).forEach(other => addBond(p, other, -0.15));
      Math.random();
      events.push(scriptEvent({ type: 'overconfidence', player: p, players: [p], badgeText: 'OVERCONFIDENT', badgeClass: 'red' },
        makeScene('conf.cocky', { a: p }, {}, [], { id: 'confessional', label: 'Confessional' })));

    } else if (eventType === 'readingRoom') {
      const p = _pick(group, n => Math.max(0.1, pStats(n).intuition * 0.6 + pStats(n).strategic * 0.2 + 1));
      const intP = pStats(p).intuition;
      Math.random();
      events.push(scriptEvent({ type: 'readingRoom', players: [p], badgeText: 'READING', badgeClass: '' },
        makeScene('conf.readroom', { a: p }, { ending: intP >= 8 ? 'expert' : 'quiet' }, [], { id: 'confessional', label: 'Confessional' })));

    } else if (eventType === 'allianceCrack') {
      // A crack only makes sense between allies whose trust is actually thinning — NEVER between
      // members who still genuinely like each other. Bonds >= 3 ("solid" and up) don't crack.
      // Build the pool of strained ally pairs first; if none exist, the alliance isn't cracking → skip.
      const CRACK_MAX_BOND = 3; // below "solid bond" — solid/strong/ride-or-die/unbreakable never crack
      const _crackCandidates = [];
      group.forEach(n => {
        const na = gs.namedAlliances?.find(al => al.active && al.members.includes(n));
        if (!na) return;
        na.members.filter(m => group.includes(m) && m !== n && getBond(n, m) < CRACK_MAX_BOND)
          .forEach(m => _crackCandidates.push({ a: n, b: m, na, bond: getBond(n, m) }));
      });
      if (!_crackCandidates.length) continue;
      // Weight toward the weakest bonds and lowest-loyalty instigators
      const _cc = wRandom(_crackCandidates, c => Math.max(0.1, (CRACK_MAX_BOND - c.bond) * 0.5 + (10 - pStats(c.a).loyalty) * 0.2 + 1));
      const acA = _cc.a, acB = _cc.b, acNa = _cc.na;
      addBond(acA, acB, -0.25);
      Math.random();
      events.push(scriptEvent({ type: 'allianceCrack', players: [acA, acB], alliance: acNa.name, badgeText: 'ALLIANCE CRACK', badgeClass: 'red' },
        makeScene('alliance.crack', { a: acA, b: acB }, { group: acNa.name }, [], _spotNow(acA, acB))));

    } else if (eventType === 'sideDeal') {
      const sdCandidates = group.filter(n => {
        const na = gs.namedAlliances?.find(a => a.active && a.members.includes(n));
        if (!na) return true;
        const allies = na.members.filter(m => group.includes(m) && m !== n);
        return !allies.length || isAllianceBottom(n, na.members);
      });
      if (!sdCandidates.length) continue;
      const sdA = _pick(sdCandidates, n => Math.max(0.1, pStats(n).strategic * 0.4 + pStats(n).boldness * 0.2 + 1));
      const sdOthers = group.filter(p => p !== sdA);
      if (!sdOthers.length) continue;
      const sdB = wRandom(sdOthers, n => Math.max(0.1, getBond(sdA, n) * 0.2 + pStats(n).social * 0.3 + 1));
      addBond(sdA, sdB, 0.5);
      Math.random();
      events.push(scriptEvent({ type: 'strategicApproach', players: [sdA, sdB], badgeText: 'SIDE DEAL', badgeClass: 'gold' },
        makeScene('talk.approach', { a: sdA, b: sdB },
          { ending: gs.namedAlliances?.some(al => al.active && al.members.includes(sdA) && al.members.includes(sdB)) ? 'inside' : 'outside' },
          [], _spotNow(sdA, sdB))));

    } else if (eventType === 'bigMoveThoughts') {
      const p = _pick(group, n => {
        const st = getPlayerState(n);
        return Math.max(0.1, pStats(n).strategic * 0.5 + pStats(n).boldness * 0.2 + ((st.bigMoves || 0) === 0 ? 2 : 0) + 1);
      });
      const strP = pStats(p).strategic;
      Math.random();
      events.push(scriptEvent({ type: 'bigMoveThoughts', player: p, players: [p], badgeText: 'BIG MOVE', badgeClass: 'gold' },
        makeScene('conf.bigmove', { a: p }, { ending: strP >= 8 ? 'planner' : 'restless' }, [], { id: 'confessional', label: 'Confessional' })));

    } else if (eventType === 'watchingYou') {
      const wyA = _pick(group, n => Math.max(0.1, pStats(n).intuition * 0.5 + pStats(n).strategic * 0.2 + 1));
      const wyOthers = group.filter(p => p !== wyA);
      if (!wyOthers.length) continue;
      const wyB = wRandom(wyOthers, n => Math.max(0.1, pStats(n).strategic * 0.3 + pStats(n).boldness * 0.2 + 1));
      addBond(wyA, wyB, -0.5);
      const intA = pStats(wyA).intuition;
      
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'watchingYou', players: [wyA, wyB], badgeText: 'WATCHING', badgeClass: 'red' },
        makeScene('read.watched', { a: wyA, b: wyB }, { ending: intA >= 7 ? 'sharp' : 'uneasy' }, [], _spotNow(wyA, wyB))));

    } else if (eventType === 'loneWolf') {
      const p = _pick(group, n => Math.max(0.1, (10 - pStats(n).loyalty) * 0.4 + pStats(n).boldness * 0.25 + 1));
      
      group.filter(x => x !== p).forEach(other => addBond(p, other, -0.15));
      Math.random();
      events.push(scriptEvent({ type: 'loneWolf', player: p, players: [p], badgeText: 'LONE WOLF', badgeClass: '' },
        makeScene('conf.lonewolf', { a: p }, {}, [], { id: 'confessional', label: 'Confessional' })));

    } else if (eventType === 'tribeMood') {
      const tmP = group[Math.floor(Math.random() * group.length)];
      const tmOthers = group.filter(x => x !== tmP);
      const tmB = tmOthers.length ? tmOthers[Math.floor(Math.random() * tmOthers.length)] : null;
      const _tmP = pronouns(tmP);
      const moodLines = [
        `A quiet morning at camp. For one hour, nobody talks about the game.`,
        tmB ? `The tribe reaches an unspoken agreement to just exist today. ${tmP} and ${tmB} hang back and talk about nothing. Nobody makes a move.` : `For once, the place feels like somewhere people are living — not just competing.`,
        `The collective exhaustion sets in. Everyone feels it. Nobody wants to be the first to say so.`,
        tmB ? `${tmP} and ${tmB} exchange a look across camp that says everything the game won't let them say out loud.` : `${tmP} stands at the edge of camp watching the water for a long time. Nobody disturbs ${_tmP.obj}.`,
        `There's a moment at sunset where the game disappears — for everyone, briefly. Then it comes back.`,
        `The tribe laughs together at something dumb. For thirty seconds it doesn't feel like a competition.`,
      ];
      const _moodLine = moodLines[Math.floor(Math.random() * moodLines.length)];
      events.push(tmB ? scriptEvent({ type: 'tribeMood', players: [tmP, tmB], badgeText: 'TRIBE MOOD', badgeClass: '' },
          makeScene('life.mood', { a: tmP, b: tmB }, {}, [], _spotNow(tmP, tmB)))
        : { type: 'tribeMood', text: _moodLine, badgeText: 'TRIBE MOOD', badgeClass: '' });

    // ══════════════════════════════════════════════════════════
    // ARCHETYPE-SPECIFIC EVENTS
    // ══════════════════════════════════════════════════════════

    } else if (eventType === 'schemerManipulates') {
      // Schemer builds false trust — target bond rises (they're being played)
      const a = _pick(group, n => Math.max(0.1, pStats(n).strategic * 0.5 + (10 - pStats(n).loyalty) * 0.4 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) + pStats(n).social * 0.2 + 2));
      addBond(b, a, 0.6); // b trusts a more — they're being played
      const strA = pStats(a).strategic, loA = pStats(a).loyalty;
      const _smA = pronouns(a);
      Math.random();
      events.push(scriptEvent({ type: 'schemerManipulates', player: a, players: [a, b], badgeText: 'MANIPULATION', badgeClass: 'red' },
        makeScene('read.played', { a, b }, { ending: (strA >= 9 && loA <= 3) ? 'deep' : 'plain' }, [], _spotNow(a, b))));

    } else if (eventType === 'mastermindOrchestrates') {
      // Mastermind quietly engineers something without anyone knowing
      const a = _pick(group, n => Math.max(0.1, pStats(n).strategic * 0.4 + pStats(n).mental * 0.3 + pStats(n).temperament * 0.1 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.3 + pStats(n).social * 0.2 + 1));
      addBond(a, b, 0.4);
      const strA = pStats(a).strategic, tmpA = pStats(a).temperament;
      
      Math.random();
      events.push(scriptEvent({ type: 'mastermindOrchestrates', player: a, players: [a, b], badgeText: 'ORCHESTRATING', badgeClass: 'red' },
        makeScene('read.orchestrate', { a, b }, { ending: (strA >= 9 && tmpA >= 5) ? 'unseen' : 'setup' }, [], _spotNow(a, b))));

    } else if (eventType === 'hotheadExplosion') {
      // Hothead loses control — wide bond damage
      const a = _pick(group, n => Math.max(0.1, (10 - pStats(n).temperament) * 0.7 + pStats(n).boldness * 0.3 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = others[Math.floor(Math.random() * others.length)];
      addBond(a, b, -2.0);
      group.filter(x => x !== a && x !== b).forEach(other => addBond(a, other, -0.5));
      const tmpA = pStats(a).temperament;
      const _hhA = pronouns(a);
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'hotheadExplosion', player: a, players: [a, b], badgeText: 'EXPLOSION', badgeClass: 'red' },
        makeScene('drama.explode', { a, b }, { ending: tmpA <= 2 ? 'erupt' : tmpA <= 4 ? 'snap' : 'crack' }, [], _spotNow(a, b))));

    } else if (eventType === 'beastDrills') {
      // Challenge beast is training — tribe grows quietly threatened
      const a = _pick(group, n => Math.max(0.1, pStats(n).physical * 0.5 + pStats(n).endurance * 0.4 + 1));
      group.filter(x => x !== a).forEach(other => addBond(other, a, -0.2));
      const phA = pStats(a).physical, enA = pStats(a).endurance;
      const _bdA = pronouns(a);
      Math.random(); // the draw that picked the sentence (the season must not move)
      const _wit = _twoOthers(group, a)[0];   // who sees it (closest by bond; no dice)
      events.push(scriptEvent({ type: 'beastDrills', player: a, players: [a], badgeText: 'TRAINING', badgeClass: 'green' },
        makeScene('life.beast', { a, b: _wit }, { ending: (phA >= 9 && enA >= 8) ? 'machine' : (phA >= 7 || enA >= 7) ? 'strong' : 'worker' }, [], _spotNow(a, _wit))));

    } else if (eventType === 'socialBoost') {
      // Social butterfly lifts the whole tribe's mood
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.6 + pStats(n).temperament * 0.2 + 1));
      group.filter(x => x !== a).forEach(other => addBond(a, other, 0.15)); // was 0.3
      const socA = pStats(a).social;
      const _sbA = pronouns(a);
      Math.random(); // the draw that picked the sentence (the season must not move)
      // the camp's voices in it: the two closest to a (a group of two is just a moment between them)
      const [_gB, _gC] = _twoOthers(group, a);
      events.push(scriptEvent({ type: 'socialBoost', player: a, players: [a], badgeText: 'SOCIAL LIFT', badgeClass: 'green' },
        _gC ? makeScene('friend.lift', { a: a, b: _gB, c: _gC }, {}, [], _spotNow(a, _gB))
          : makeScene('friend.bond', { a: a, b: _gB }, {}, [], _spotNow(a, _gB || null))));

    } else if (eventType === 'soldierCheckin') {
      // Loyal soldier reaffirms alliance — bond boost
      const a = _pick(group, n => Math.max(0.1, pStats(n).loyalty * 0.6 + (10 - pStats(n).boldness) * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.5 + pStats(n).loyalty * 0.2 + 2));
      addBond(a, b, 0.6);
      const loA = pStats(a).loyalty;
      Math.random();
      events.push(scriptEvent({ type: 'soldierCheckin', player: a, players: [a, b], badgeText: 'LOYALTY', badgeClass: 'green' },
        makeScene('talk.checkin', { a, b }, { ending: loA >= 9 ? 'rock' : loA >= 7 ? 'steady' : 'quiet' }, [], _spotNow(a, b))));

    } else if (eventType === 'wildcardPivot') {
      // Wildcard does something nobody predicted — direction could go either way
      const a = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.5 + (10 - pStats(n).loyalty) * 0.3 + 1));
      const others = group.filter(p => p !== a);
      const b = others.length ? wRandom(others, n => Math.max(0.1, Math.random() * 3 + 1)) : null;
      if (b) addBond(a, b, (Math.random() > 0.5 ? 1.0 : -1.0));
      const boA = pStats(a).boldness;
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'wildcardPivot', player: a, players: [a], badgeText: 'WILDCARD', badgeClass: 'gold' },
        b ? makeScene('wild.pivot', { a, b }, { ending: boA >= 8 ? 'wild' : 'odd' }, [], _spotNow(a, b))
          : makeScene('wild.solo', { a }, { ending: boA >= 8 ? 'wild' : 'odd' }, [], { id: 'confessional', label: 'Confessional' })));

    } else if (eventType === 'chaosAgentStirsUp') {
      // Chaos agent deliberately engineers drama between two others
      const a = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.4 + (10 - pStats(n).temperament) * 0.3 + (10 - pStats(n).loyalty) * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (others.length < 2) continue;
      const b = wRandom(others, n => Math.max(0.1, pStats(n).strategic * 0.2 + 1));
      const cOthers = others.filter(p => p !== b);
      if (!cOthers.length) continue;
      const c = wRandom(cOthers, n => Math.max(0.1, (5 - getBond(b, n)) * 0.3 + 1));
      addBond(b, c, -0.6);
      const boA = pStats(a).boldness;
      const _caA = pronouns(a);
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'chaosAgentStirsUp', players: [a, b, c], badgeText: 'CHAOS', badgeClass: 'red' },
        makeScene('drama.stir', { a, b, c }, { ending: boA >= 8 ? 'bold' : 'sly' }, [], _spotNow(a, b))));

    } else if (eventType === 'floaterInvisible') {
      // Floater successfully goes unnoticed — no bond change, pure flavor
      const a = _pick(group, n => Math.max(0.1, (10 - pStats(n).boldness) * 0.4 + pStats(n).social * 0.2 + 1));
      const _flA = pronouns(a);
      Math.random(); // the draw that picked the sentence (the season must not move)
      const _wit = _twoOthers(group, a)[0];   // who sees it (closest by bond; no dice)
      events.push(scriptEvent({ type: 'floaterInvisible', player: a, players: [a], badgeText: 'INVISIBLE', badgeClass: 'gold' },
        makeScene('life.floater', { a, b: _wit }, {}, [], _spotNow(a, _wit))));

    } else if (eventType === 'underdogMoment') {
      // Underdog shows quiet resilience — small bond boost with tribe
      const a = _pick(group, n => Math.max(0.1, (10 - pStats(n).physical) * 0.3 + pStats(n).loyalty * 0.3 + (10 - pStats(n).boldness) * 0.1 + 1));
      group.filter(x => x !== a).forEach(other => addBond(a, other, 0.2));
      const loA = pStats(a).loyalty, phA = pStats(a).physical;
      const _udA = pronouns(a);
      Math.random(); // the draw that picked the sentence (the season must not move)
      const _wit = _twoOthers(group, a)[0];   // who sees it (closest by bond; no dice)
      events.push(scriptEvent({ type: 'underdogMoment', player: a, players: [a], badgeText: 'UNDERDOG', badgeClass: 'green' },
        makeScene('life.underdog', { a, b: _wit }, { ending: (loA >= 8 && phA <= 5) ? 'driven' : 'unseen' }, [], _spotNow(a, _wit))));

    } else if (eventType === 'goatOblivious') {
      // Goat is unaware of how the tribe actually sees them, gets actively used
      const a = _pick(group, n => Math.max(0.1, (10 - pStats(n).strategic) * 0.5 + (10 - pStats(n).boldness) * 0.3 + 1));
      const others = group.filter(p => p !== a);
      const b = others.length ? wRandom(others, n => Math.max(0.1, pStats(n).strategic * 0.4 + 1)) : null;
      if (b) addBond(b, a, 0.3); // strategic player values their goat
      const strA = pStats(a).strategic;
      Math.random();
      // b (when there is one) is the strategist who wants a kept exactly as a is: only b's confessional says why.
      events.push(scriptEvent({ type: 'goatOblivious', players: [a], badgeText: 'OBLIVIOUS', badgeClass: 'red' },
        b ? makeScene('goat.kept', { a, b }, { ending: strA <= 3 ? 'happy' : 'drifting' }, [], _spotNow(a, b))
          : makeScene('goat.alone', { a }, { ending: strA <= 3 ? 'happy' : 'drifting' }, [], { id: 'confessional', label: 'Confessional' })));

    } else if (eventType === 'perceptiveReads') {
      // Perceptive player catches something others missed — trust in target drops
      const a = _pick(group, n => Math.max(0.1, pStats(n).intuition * 0.6 + pStats(n).social * 0.3 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, pStats(n).strategic * 0.3 + pStats(n).boldness * 0.2 + 1));
      addBond(a, b, -0.5);
      const intA = pStats(a).intuition, socA = pStats(a).social;
      
      Math.random();
      events.push(scriptEvent({ type: 'perceptiveReads', players: [a, b], badgeText: 'SHARP READ', badgeClass: 'gold' },
        makeScene('read.sharp', { a, b }, { ending: (intA >= 8 && socA >= 7) ? 'expert' : intA >= 7 ? 'sure' : 'gut' }, [], _spotNow(a, b))));

    // ── NEW POSITIVE EVENTS ──

    } else if (eventType === 'teachingMoment') {
      // Experienced player helps someone with a skill — requires stat gap
      const teachers = group.filter(n => pStats(n).physical >= 7 || pStats(n).strategic >= 7 || pStats(n).mental >= 7);
      if (!teachers.length) continue;
      const a = _pick(teachers, n => Math.max(0.1, Math.max(pStats(n).physical, pStats(n).strategic, pStats(n).mental) * 0.4 + 1));
      const aS = pStats(a);
      // Pick what they teach based on their strongest stat
      const _teachStat = aS.physical >= aS.strategic && aS.physical >= aS.mental ? 'physical'
        : aS.strategic >= aS.mental ? 'strategic' : 'mental';
      // Recipient must be weak in that stat
      const learners = group.filter(p => p !== a && pStats(p)[_teachStat] <= 5);
      if (!learners.length) continue;
      const b = wRandom(learners, n => Math.max(0.1, (6 - pStats(n)[_teachStat]) * 0.4 + 1));
      addBond(a, b, 0.5);
      addBond(b, a, 0.5);
      const pA = pronouns(a), pB = pronouns(b);
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'teachingMoment', players: [a, b], badgeText: 'TEACHING', badgeClass: 'green' },
        makeScene('friend.teach', { a, b }, { ending: _teachStat }, [], _spotNow(a, b))));

    } else if (eventType === 'vulnerability') {
      // Player opens up emotionally — requires social >= 5, temperament <= 6, bond >= 1 with recipient
      const openers = group.filter(n => pStats(n).social >= 5 && pStats(n).temperament <= 6);
      if (!openers.length) continue;
      const a = _pick(openers, n => Math.max(0.1, pStats(n).social * 0.4 + (7 - pStats(n).temperament) * 0.3 + 1));
      const trusted = group.filter(p => p !== a && getBond(a, p) >= 1);
      if (!trusted.length) continue;
      const b = wRandom(trusted, n => Math.max(0.1, getBond(a, n) * 0.5 + pStats(n).social * 0.2 + 1));
      addBond(a, b, 0.6);
      addBond(b, a, 0.6);
      const pA = pronouns(a);
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'vulnerability', players: [a, b], badgeText: 'VULNERABLE', badgeClass: 'green' },
        makeScene('friend.open', { a, b }, {}, [], _spotNow(a, b))));

    } else if (eventType === 'insideJoke') {
      // Two bonded players develop a running bit — bond >= 1, at least one has temperament >= 6
      const candidates = [];
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          if (getBond(group[i], group[j]) >= 1 && (pStats(group[i]).temperament >= 6 || pStats(group[j]).temperament >= 6)) {
            candidates.push([group[i], group[j]]);
          }
        }
      }
      if (!candidates.length) continue;
      const [a, b] = candidates[Math.floor(Math.random() * candidates.length)];
      addBond(a, b, 0.3);
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'insideJoke', players: [a, b], badgeText: 'INSIDE JOKE', badgeClass: 'green' },
        makeScene('friend.joke', { a, b }, {}, [], _spotNow(a, b))));

    } else if (eventType === 'loyaltyProof') {
      // Player defends someone who isn't present — loyalty >= 6, bond >= 2
      const defenders = group.filter(n => pStats(n).loyalty >= 6);
      if (!defenders.length) continue;
      const a = _pick(defenders, n => Math.max(0.1, pStats(n).loyalty * 0.5 + 1));
      // Defended person must be in the group and bonded to defender
      const defended = group.filter(p => p !== a && getBond(a, p) >= 2);
      if (!defended.length) continue;
      const b = wRandom(defended, n => Math.max(0.1, getBond(a, n) * 0.4 + 1));
      addBond(a, b, 0.8);
      Math.random();
      // b is not there when a defends b: the scene is a with somebody else at camp, and the camera.
      events.push(scriptEvent({ type: 'loyaltyProof', players: [a, b], badgeText: 'LOYALTY PROOF', badgeClass: 'green' },
        makeScene('loyal.defend', { a, b }, {}, [], { id: 'confessional', label: 'Confessional' })));

    // ── NEW NEGATIVE EVENTS ──

    } else if (eventType === 'jealousy') {
      // Player resents another's challenge success — worse record + loyalty <= 6
      const _chalRec = gs.chalRecord || {};
      const withRecords = group.filter(n => (_chalRec[n]?.wins || 0) > 0 || (_chalRec[n]?.podiums || 0) > 0);
      if (!withRecords.length) continue;
      // Target: someone with good challenge record
      const target = wRandom(withRecords, n => Math.max(0.1, (_chalRec[n]?.wins || 0) * 2 + (_chalRec[n]?.podiums || 0) + 1));
      // Jealous player: worse record AND loyalty <= 6
      const jealousPool = group.filter(p => p !== target && pStats(p).loyalty <= 6 &&
        ((_chalRec[p]?.wins || 0) < (_chalRec[target]?.wins || 0) || (_chalRec[p]?.podiums || 0) < (_chalRec[target]?.podiums || 0)));
      if (!jealousPool.length) continue;
      const a = _pick(jealousPool, n => Math.max(0.1, (7 - pStats(n).loyalty) * 0.4 + pStats(n).boldness * 0.2 + 1));
      addBond(a, target, -0.6);
      const pA = pronouns(a), pT = pronouns(target);
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'jealousy', players: [a, target], badgeText: 'JEALOUSY', badgeClass: 'red' },
        makeScene('drama.jealous', { a, b: target }, {}, [], _spotNow(a, target))));

    } else if (eventType === 'exclusion') {
      // Player left out of group conversation — low social OR minority position
      const socialScores = group.map(n => ({ name: n, social: pStats(n).social })).sort((a, b) => a.social - b.social);
      // Excluded: lowest social, or lowest average bond with group
      const excluded = socialScores[0].name;
      if (pStats(excluded).social > 5) continue; // only fires for genuinely low-social players
      const others = group.filter(p => p !== excluded);
      // Need at least 3 others who are bonded to each other
      const _groupBonds = others.filter(p => others.filter(q => q !== p && getBond(p, q) >= 1).length >= 2);
      if (_groupBonds.length < 3) continue;
      _groupBonds.forEach(p => addBond(excluded, p, -0.4));
      Math.random();
      events.push(scriptEvent({ type: 'exclusion', players: [excluded], badgeText: 'EXCLUDED', badgeClass: 'red' },
        makeScene('conf.excluded', { a: excluded }, {}, [], { id: 'confessional', label: 'Confessional' })));

    } else if (eventType === 'blame') {
      // Someone blamed for challenge loss — target must have actually performed poorly
      const _lastChalScores = gs.episodeHistory?.[gs.episodeHistory.length - 1]?.chalMemberScores;
      if (!_lastChalScores) continue;
      // Find worst performers who are in this group
      const _groupScores = group.filter(n => _lastChalScores[n] !== undefined)
        .map(n => ({ name: n, score: _lastChalScores[n] }))
        .sort((a, b) => a.score - b.score);
      if (_groupScores.length < 2) continue;
      const target = _groupScores[0].name; // worst performer
      // Blamer: someone who performed better and is bold enough to say it
      const blamers = group.filter(p => p !== target && (_lastChalScores[p] || 0) > (_lastChalScores[target] || 0) && pStats(p).boldness >= 5);
      if (!blamers.length) continue;
      const a = _pick(blamers, n => Math.max(0.1, pStats(n).boldness * 0.4 + (10 - pStats(n).loyalty) * 0.2 + 1));
      addBond(a, target, -0.7);
      addBond(target, a, -0.7);
      Math.random();
      events.push(scriptEvent({ type: 'blame', players: [a, target], badgeText: 'BLAME', badgeClass: 'red' },
        makeScene('blame.loss', { a, b: target }, {}, [], _spotNow(a, target))));

    } else if (eventType === 'passiveAggressive') {
      // Subtle dig — initiator: temperament <= 5, target: bond <= 1 with initiator
      const paPool = group.filter(n => pStats(n).temperament <= 5);
      if (!paPool.length) continue;
      const a = _pick(paPool, n => Math.max(0.1, (6 - pStats(n).temperament) * 0.4 + pStats(n).strategic * 0.2 + 1));
      const targets = group.filter(p => p !== a && getBond(a, p) <= 1);
      if (!targets.length) continue;
      const b = wRandom(targets, n => Math.max(0.1, (2 - getBond(a, n)) * 0.3 + 1));
      addBond(a, b, -0.4);
      // Witnesses lose respect for the initiator
      group.filter(p => p !== a && p !== b).forEach(p => addBond(p, a, -0.2));
      const pA = pronouns(a), pB = pronouns(b);
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'passiveAggressive', players: [a, b], badgeText: 'PASSIVE-AGGRESSIVE', badgeClass: 'red' },
        makeScene('drama.dig', { a, b }, {}, [], _spotNow(a, b))));

    } else if (eventType === 'trustCrack') {
      // Caught in a contradiction — target must have actually contradicted themselves
      // Detector needs intuition >= 6
      const detectors = group.filter(n => pStats(n).intuition >= 6);
      if (!detectors.length) continue;
      // Target: in multiple alliances with conflicting members, OR voted differently than stated
      const _prevEp = gs.episodeHistory?.[gs.episodeHistory.length - 1];
      const _multiAlliancePlayers = group.filter(n => {
        const myAlliances = (gs.namedAlliances || []).filter(a => a.active && a.members.includes(n));
        if (myAlliances.length < 2) return false;
        // Check if alliances have conflicting membership (members in one but not the other)
        const allMembers = myAlliances.flatMap(a => a.members);
        const unique = [...new Set(allMembers)];
        return unique.length > myAlliances[0].members.length + 1; // overlapping but different groups
      });
      // ── Contradictors: actual vote deviated from their alliance's consensus target ──
      // Capture the SPECIFIC contradiction (what they were expected to do vs. what they did)
      // so the narration can name names instead of staying vague.
      const _contradictorInfo = {};
      if (_prevEp?.votingLog) {
        group.forEach(n => {
          const vote = _prevEp.votingLog.find(v => v.voter === n);
          if (!vote || !vote.voted || vote.voted === n) return;
          const myAlliance = (gs.namedAlliances || []).find(al => al.active && al.members.includes(n));
          if (!myAlliance) return;
          // Consensus = the name most of the REST of the alliance wrote
          const allyVotes = {};
          myAlliance.members.forEach(m => {
            if (m === n) return;
            const mv = _prevEp.votingLog.find(v => v.voter === m);
            if (mv && mv.voted) allyVotes[mv.voted] = (allyVotes[mv.voted] || 0) + 1;
          });
          const consensus = Object.entries(allyVotes).sort((x, y) => y[1] - x[1])[0]?.[0];
          if (consensus && consensus !== vote.voted) {
            _contradictorInfo[n] = { actual: vote.voted, expected: consensus, alliance: myAlliance.name };
          }
        });
      }
      const _contradictors = Object.keys(_contradictorInfo);

      // Multi-alliance: capture the two conflicting alliance names for specificity
      const _multiInfo = {};
      _multiAlliancePlayers.forEach(n => {
        const myAlliances = (gs.namedAlliances || []).filter(a => a.active && a.members.includes(n));
        if (myAlliances.length >= 2) _multiInfo[n] = { names: myAlliances.slice(0, 2).map(a => a.name) };
      });

      const targets = [...new Set([..._multiAlliancePlayers, ..._contradictors])].filter(n => detectors.some(d => d !== n));
      if (!targets.length) continue;
      const b = targets[Math.floor(Math.random() * targets.length)];
      const detectPool = detectors.filter(d => d !== b);
      if (!detectPool.length) continue;
      const a = _pick(detectPool, n => Math.max(0.1, pStats(n).intuition * 0.5 + 1));
      addBond(a, b, -0.8);
      const _ci = _contradictorInfo[b];   // concrete vote contradiction (preferred — most specific)
      const _mi = _multiInfo[b];          // two-timing across named alliances
      Math.random(); // the draw that picked the sentence
      events.push(scriptEvent({ type: 'trustCrack', players: [a, b], badgeText: 'TRUST CRACKED', badgeClass: 'red' },
        makeScene('trust.crack', { a, b },
          _ci ? { ending: 'vote', plan: _ci.expected, wrote: _ci.actual, group: _ci.alliance }
            : _mi ? { ending: 'double', group: _mi.names[0], group2: _mi.names[1] }
              : { ending: 'vague' }, [], _spotNow(a, b))));

    // ═══════════════════════════════════════════════════════════
    // NEW POSITIVE EVENTS
    // ═══════════════════════════════════════════════════════════

    } else if (eventType === 'gratitude') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.3 + pStats(n).loyalty * 0.4 + 1));
      const others = group.filter(p => p !== a && getBond(a, p) >= 1 && _canBond(a, p));
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.5 + 1));
      addBond(a, b, 0.6);
      addBond(b, a, 0.3);
      _trackBond(a, b);
      const pA = pronouns(a), pB = pronouns(b);
      const loA = pStats(a).loyalty, socA = pStats(a).social;
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'gratitude', players: [a, b], badgeText: 'GRATITUDE', badgeClass: 'green' },
        makeScene('friend.thanks', { a, b }, {}, [], _spotNow(a, b))));

    } else if (eventType === 'protectiveInstinct') {
      // Player defends another from group criticism — needs someone who was recently blamed/targeted
      const _recentTargets = group.filter(n => {
        const avgBond = group.filter(p => p !== n).reduce((s, p) => s + getBond(p, n), 0) / Math.max(1, group.length - 1);
        return avgBond < 1.5;
      });
      if (!_recentTargets.length) continue;
      const target = _recentTargets[Math.floor(Math.random() * _recentTargets.length)];
      const defenders = group.filter(p => p !== target && getBond(p, target) >= 0.5 && (pStats(p).loyalty >= 6 || pStats(p).boldness >= 7));
      if (!defenders.length) continue;
      const a = _pick(defenders, n => Math.max(0.1, pStats(n).loyalty * 0.4 + pStats(n).boldness * 0.3 + 1));
      addBond(a, target, 0.7);
      addBond(target, a, 0.8);
      group.filter(p => p !== a && p !== target).forEach(p => addBond(p, a, 0.1));
      const pA = pronouns(a), pT = pronouns(target);
      const boA = pStats(a).boldness, loA = pStats(a).loyalty;
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'protectiveInstinct', players: [a, target], badgeText: 'DEFENDED', badgeClass: 'green' },
        makeScene('friend.defend', { a, b: target }, { ending: boA >= 8 ? 'loud' : loA >= 8 ? 'quiet' : 'surprise' }, [], _spotNow(a, target))));

    } else if (eventType === 'sharedMeal') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).loyalty * 0.3 + pStats(n).social * 0.3 + pStats(n).endurance * 0.2 + 1));
      const others = group.filter(p => p !== a && _canBond(a, p));
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.2 + pStats(n).social * 0.2 + 2));
      addBond(a, b, 0.5);
      addBond(b, a, 0.4);
      _trackBond(a, b);
      const pA = pronouns(a), pB = pronouns(b);
      // setting-specific meal flavor (funnel cake at a carnival, tray on a plane…) plus
      // a few venue-neutral lines that read fine anywhere
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'sharedMeal', players: [a, b], badgeText: 'SHARED MEAL', badgeClass: 'green' },
        makeScene('friend.meal', { a, b }, {}, [], _spotNow(a, b))));

    } else if (eventType === 'moraleBoost') {
      // Player rallies tribe after a challenge loss or tough stretch
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.4 + pStats(n).temperament * 0.3 + pStats(n).boldness * 0.2 + 1));
      group.filter(x => x !== a).forEach(other => addBond(other, a, 0.25));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[a] = (gs.popularity[a] || 0) + 1;
      const socA = pStats(a).social, boA = pStats(a).boldness;
      const pA = pronouns(a);
      Math.random(); // the draw that picked the sentence (the season must not move)
      // the camp's voices in it: the two closest to a (a group of two is just a moment between them)
      const [_gB, _gC] = _twoOthers(group, a);
      events.push(scriptEvent({ type: 'moraleBoost', player: a, players: [a], badgeText: 'RALLIED', badgeClass: 'green' },
        _gC ? makeScene('friend.rally', { a: a, b: _gB, c: _gC }, {}, [], _spotNow(a, _gB))
          : makeScene('friend.bond', { a: a, b: _gB }, {}, [], _spotNow(a, _gB || null))));

    } else if (eventType === 'secretShared') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.3 + pStats(n).loyalty * 0.3 + pStats(n).temperament * 0.2 + 1));
      const others = group.filter(p => p !== a && getBond(a, p) >= 2 && _canBond(a, p));
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.5 + pStats(n).loyalty * 0.2 + 1));
      addBond(a, b, 0.7);
      addBond(b, a, 0.5);
      _trackBond(a, b);
      const pA = pronouns(a), pB = pronouns(b);
      const loA = pStats(a).loyalty, intB = pStats(b).intuition;
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'secretShared', players: [a, b], badgeText: 'SECRET SHARED', badgeClass: 'green' },
        makeScene('friend.secret', { a, b }, {}, [], _spotNow(a, b))));

    } else if (eventType === 'sunriseTalk') {
      const earlyRisers = group.filter(n => pStats(n).endurance >= 5 || pStats(n).temperament >= 6);
      if (earlyRisers.length < 2) continue;
      const a = _pick(earlyRisers, n => Math.max(0.1, pStats(n).temperament * 0.3 + pStats(n).social * 0.3 + 1));
      const bPool = earlyRisers.filter(p => p !== a && _canBond(a, p));
      if (!bPool.length) continue;
      const b = wRandom(bPool, n => Math.max(0.1, pStats(n).temperament * 0.3 + getBond(a, n) * 0.2 + 2));
      addBond(a, b, 0.6);
      addBond(b, a, 0.6);
      _trackBond(a, b);
      const pA = pronouns(a), pB = pronouns(b);
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'sunriseTalk', players: [a, b], badgeText: 'SUNRISE TALK', badgeClass: 'green' },
        makeScene('friend.sunrise', { a, b }, {}, [], _spotNow(a, b))));

    } else if (eventType === 'celebrateTogether') {
      // Tribe bonds over shared success — requires recent challenge win or merge milestone
      const shuffled = [...group].sort(() => Math.random() - 0.5);
      for (let ci = 0; ci < Math.min(shuffled.length - 1, 3); ci++) addBond(shuffled[ci], shuffled[ci + 1], 0.4);
      group.forEach(p => { if (!gs.popularity) gs.popularity = {}; gs.popularity[p] = (gs.popularity[p] || 0) + 0.3; });
      const instigator = _pick(group, n => Math.max(0.1, pStats(n).social * 0.4 + pStats(n).boldness * 0.3 + 1));
      const pI = pronouns(instigator);
      Math.random(); // the draw that picked the sentence (the season must not move)
      // the camp's voices in it: the two closest to instigator (a group of two is just a moment between them)
      const [_gB, _gC] = _twoOthers(group, instigator);
      events.push(scriptEvent({ type: 'celebrateTogether', player: instigator, players: [instigator], badgeText: 'CELEBRATION', badgeClass: 'green' },
        _gC ? makeScene('friend.celebrate', { a: instigator, b: _gB, c: _gC }, {}, [], _spotNow(instigator, _gB))
          : makeScene('friend.bond', { a: instigator, b: _gB }, {}, [], _spotNow(instigator, _gB || null))));

    } else if (eventType === 'mentorBond') {
      // Older/experienced player offers emotional guidance — different from teachingMoment (skill-based)
      const mentors = group.filter(n => pStats(n).temperament >= 7 && pStats(n).social >= 5);
      if (!mentors.length) continue;
      const a = _pick(mentors, n => Math.max(0.1, pStats(n).temperament * 0.4 + pStats(n).social * 0.3 + 1));
      const mentees = group.filter(p => p !== a && pStats(p).temperament <= 5 && _canBond(a, p));
      if (!mentees.length) continue;
      const b = wRandom(mentees, n => Math.max(0.1, (6 - pStats(n).temperament) * 0.4 + 1));
      addBond(a, b, 0.6);
      addBond(b, a, 0.7);
      _trackBond(a, b);
      const pA = pronouns(a), pB = pronouns(b);
      const tmpB = pStats(b).temperament;
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'mentorBond', players: [a, b], badgeText: 'MENTORING', badgeClass: 'green' },
        makeScene('friend.mentor', { a, b }, { ending: tmpB <= 3 ? 'spiral' : 'rough' }, [], _spotNow(a, b))));

    } else if (eventType === 'forgiveness') {
      // Two players with a negative bond reconcile — requires existing conflict
      const conflictPairs = [];
      for (let i = 0; i < group.length; i++)
        for (let j = i + 1; j < group.length; j++)
          if (getBond(group[i], group[j]) >= -4 && getBond(group[i], group[j]) <= -1) conflictPairs.push([group[i], group[j]]);
      if (!conflictPairs.length) continue;
      const [a, b] = conflictPairs[Math.floor(Math.random() * conflictPairs.length)];
      const initiator = pStats(a).temperament >= pStats(b).temperament ? a : b;
      const receiver = initiator === a ? b : a;
      addBond(a, b, 1.5);
      const pI = pronouns(initiator), pR = pronouns(receiver);
      const tmpI = pStats(initiator).temperament;
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'forgiveness', players: [initiator, receiver], badgeText: 'TRUCE', badgeClass: 'green' },
        makeScene('drama.truce', { a: initiator, b: receiver }, { ending: tmpI >= 8 ? 'plain' : tmpI >= 6 ? 'gesture' : 'slow' }, [], _spotNow(initiator, receiver))));

    } else if (eventType === 'silentSolidarity') {
      // Two allied players show loyalty through action, not words
      const bondedPairs = [];
      for (let i = 0; i < group.length; i++)
        for (let j = i + 1; j < group.length; j++)
          if (getBond(group[i], group[j]) >= 3 && _canBond(group[i], group[j])) bondedPairs.push([group[i], group[j]]);
      if (!bondedPairs.length) continue;
      const [a, b] = bondedPairs[Math.floor(Math.random() * bondedPairs.length)];
      addBond(a, b, 0.4);
      _trackBond(a, b);
      const pA = pronouns(a), pB = pronouns(b);
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'silentSolidarity', players: [a, b], badgeText: 'SOLIDARITY', badgeClass: 'green' },
        makeScene('friend.solidarity', { a, b }, {}, [], _spotNow(a, b))));

    } else if (eventType === 'campImprovement') {
      // Player builds/fixes something for the whole tribe — respect boost
      const a = _pick(group, n => Math.max(0.1, pStats(n).physical * 0.3 + pStats(n).loyalty * 0.3 + pStats(n).endurance * 0.2 + 1));
      group.filter(x => x !== a).forEach(other => addBond(other, a, 0.15));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[a] = (gs.popularity[a] || 0) + 0.5;
      const pA = pronouns(a);
      const phA = pStats(a).physical, loA = pStats(a).loyalty;
      // setting-specific "fixing up the space" flavor (shelter on an island, tents at a
      // carnival, trailers on a lot…) plus a tier-flavored venue-neutral line
      const _improveLines = [
        _reskinFill(settingReskin('improve'), a),
        _reskinFill(settingReskin('improve'), a),
        phA >= 8
          ? `${a} throws real muscle into fixing up the place — hours of hauling and hammering. By nightfall everyone's better off, and nobody questions ${pA.posAdj} value.`
          : loA >= 7
          ? `${a} spends the whole afternoon quietly making the place livable. By evening it feels less like a dump and more like a home.`
          : `${a} figures out a small fix that makes daily life easier. Not flashy — but everyone notices they're a little less miserable now.`,
      ];
      const _venueLine = _improveLines[Math.floor(Math.random() * _improveLines.length)];
      const _wit = _twoOthers(group, a)[0];   // who sees it (closest by bond; no dice)
      events.push(_venueScene({ type: 'campImprovement', player: a, players: [a], badgeText: 'CAMP BUILD', badgeClass: 'green' }, _venueLine, 'life.build', { a, b: _wit }, {}));

    // ═══════════════════════════════════════════════════════════
    // NEW NEUTRAL EVENTS
    // ═══════════════════════════════════════════════════════════

    } else if (eventType === 'superstition') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).intuition * 0.3 + pStats(n).boldness * 0.2 + Math.random() * 2 + 1));
      const pA = pronouns(a);
      Math.random(); // the draw that picked the sentence (the season must not move)
      const _wit = _twoOthers(group, a)[0];   // who sees it (closest by bond; no dice)
      events.push(scriptEvent({ type: 'superstition', player: a, players: [a], badgeText: 'SUPERSTITION', badgeClass: '' },
        makeScene('life.charm', { a, b: _wit }, {}, [], _spotNow(a, _wit))));

    } else if (eventType === 'animalEncounter') {
      const a = _pick(group, n => Math.max(0.1, Math.random() * 3 + 1));
      const b2 = group.filter(p => p !== a)[0] || a;
      const pA = pronouns(a);
      // setting-specific critter (a loon on the lake, a midway pigeon, a lot cat, a
      // stowaway bug at altitude…) plus a couple venue-neutral animal beats
      const _animalLines = [
        _reskinFill(settingReskin('wildlife'), a, b2),
        _reskinFill(settingReskin('wildlife'), a, b2),
        `A bird lands on ${a}'s shoulder out of nowhere. ${pA.Sub} freeze${pA.sub==='they'?'':'s'}. Everyone watches in disbelief. It stays ten seconds, then flies off. ${a} takes it as a sign.`,
        `${a} befriends a stray animal that's been hanging around and spends twenty minutes just sitting with it. Everyone lets ${pA.obj} have the moment. Everyone needs one.`,
      ];
      const _venueLine = _animalLines[Math.floor(Math.random() * _animalLines.length)];
      events.push(_venueScene({ type: 'animalEncounter', player: a, players: [a], badgeText: 'WILDLIFE', badgeClass: '' }, _venueLine, 'life.critter', { a, b: b2 }, {}));

    } else if (eventType === 'dreaming') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).intuition * 0.3 + (10 - pStats(n).temperament) * 0.2 + 1));
      const pA = pronouns(a);
      const intA = pStats(a).intuition;
      Math.random(); // the draw that picked the sentence (the season must not move)
      const _wit = _twoOthers(group, a)[0];   // who sees it (closest by bond; no dice)
      events.push(scriptEvent({ type: 'dreaming', player: a, players: [a], badgeText: 'DREAM', badgeClass: '' },
        makeScene('life.dream', { a, b: _wit }, { ending: intA >= 7 ? 'seer' : 'home' }, [], _spotNow(a, _wit))));

    } else if (eventType === 'weatherShift') {
      const shuffled = [...group].sort(() => Math.random() - 0.5);
      const featured = shuffled[0];
      const b2 = shuffled[1] || featured;
      const pF = pronouns(featured);
      // setting-specific environmental beats (rain on the shelter, mud on the midway,
      // turbulence on the plane…) plus venue-neutral mood shifts
      const _weatherLines = [
        _reskinFill(settingReskin('weather'), featured, b2),
        _reskinFill(settingReskin('weather'), featured, b2),
        `The heat today is oppressive. Everything slows to a crawl. Conversations get shorter. Tempers hover near the surface but never quite break.`,
        `Thunder rumbles in the distance all afternoon. It never quite arrives — but the tension from waiting changes every conversation.`,
        `The temperature drops sharply after dark and everyone clusters closer than they have all season. Proximity creates conversation creates connection.`,
      ];
      const _venueLine = _weatherLines[Math.floor(Math.random() * _weatherLines.length)];
      events.push(_venueScene({ type: 'weatherShift', player: featured, players: [featured], badgeText: 'WEATHER', badgeClass: '' }, _venueLine, 'life.weather', { a: featured, b: b2 }, {}));

    // ═══════════════ HOST & CHEF MEDDLING ═══════════════
    } else if (eventType === 'chefSlop') {
      // Chef serves something inedible — a pair either bonds over the misery or turns on each other
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.3 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, 6 - Math.abs(getBond(a, n)) * 0.2));
      const pA = pronouns(a), pB = pronouns(b);
      if (Math.min(pStats(a).temperament, pStats(b).temperament) <= 4 && getBond(a, b) < 3) {
        addBond(a, b, -0.6);
        Math.random(); // the draw that picked the sentence (the season must not move)
        events.push(scriptEvent({ type: 'chefSlop', players: [a, b], badgeText: "CHEF'S SLOP", badgeClass: 'red' },
          makeScene('hosted.slop', { a, b }, { ending: 'bad' }, [], _spotNow(a, b))));
      } else {
        addBond(a, b, 0.5);
        Math.random(); // the draw that picked the sentence (the season must not move)
        events.push(scriptEvent({ type: 'chefSlop', players: [a, b], badgeText: 'SHARED MISERY', badgeClass: 'green' },
          makeScene('hosted.slop', { a, b }, { ending: 'good' }, [], _spotNow(a, b))));
      }

    } else if (eventType === 'rudeWakeup') {
      // The host torments camp at dawn — a bold camper claps back, or everyone just stews
      const clapper = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.4 + 1));
      const pC = pronouns(clapper);
      if (pStats(clapper).boldness >= 6) {
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[clapper] = (gs.popularity[clapper] || 0) + 1;
        group.filter(p => p !== clapper).forEach(p => addBond(clapper, p, 0.2));
        Math.random(); // the draw that picked the sentence (the season must not move)
        const _wit = _twoOthers(group, clapper)[0];
        events.push(scriptEvent({ type: 'rudeWakeup', players: [clapper], player: clapper, badgeText: 'CLAPPED BACK', badgeClass: 'green' },
          makeScene('life.wakeup', { a: clapper, b: _wit }, { ending: 'clap' }, [], _spotNow(clapper, _wit))));
      } else {
        const others = group.filter(p => p !== clapper);
        if (!others.length) continue;
        const b = others[Math.floor(Math.random() * others.length)];
        addBond(clapper, b, -0.3);
        Math.random(); // the draw that picked the sentence (the season must not move)
        events.push(scriptEvent({ type: 'rudeWakeup', players: [clapper, b], badgeText: 'RUDE AWAKENING', badgeClass: 'red' },
          makeScene('life.wakeup', { a: clapper, b }, { ending: 'snap' }, [], _spotNow(clapper, b))));
      }

    } else if (eventType === 'hostFavoritism') {
      // The host visibly favors one camper — breeds resentment from a rival
      const fav = _pick(group, n => Math.max(0.1, pStats(n).social * 0.4 + 1));
      const others = group.filter(p => p !== fav);
      if (!others.length) continue;
      const jealous = wRandom(others, n => Math.max(0.1, (3 - getBond(fav, n)) * 0.4 + pStats(n).boldness * 0.1 + 1));
      addBond(jealous, fav, -0.6);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[fav] = (gs.popularity[fav] || 0) + 0.5;
      const pF = pronouns(fav), pJ = pronouns(jealous);
      Math.random(); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'hostFavoritism', players: [jealous, fav], badgeText: 'PLAYING FAVORITES', badgeClass: 'red' },
        makeScene('life.favorite', { a: jealous, b: fav }, {}, [], _spotNow(jealous, fav))));

    } else if (eventType === 'fakeReward') {
      // A "reward" that turns out to be a punishment — camp bonds over the shared gotcha
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.2 + 2));
      addBond(a, b, 0.4);
      Math.random();
      events.push(scriptEvent({ type: 'fakeReward', players: [a, b], badgeText: 'GOTCHA', badgeClass: 'green' },
        makeScene('host.gotcha', { a, b }, {}, [], _spotNow(a, b))));

    // ═══════════════ CASUAL NIGHT GAMES ═══════════════
    } else if (eventType === 'nightGame') {
      const mode = ['spin', 'never', 'dare'][Math.floor(Math.random() * 3)];
      if (mode === 'spin') {
        const a = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.3 + pStats(n).social * 0.2 + 1));
        const compat = group.filter(p => p !== a && romanticCompat(a, p) && seasonConfig.romance !== 'disabled');
        if (compat.length) {
          const b = wRandom(compat, n => Math.max(0.1, getBond(a, n) * 0.4 + pStats(n).social * 0.3 + 1));
          addBond(a, b, 1.0);
          Math.random(); // the draw that picked the sentence (the season must not move)
          events.push(scriptEvent({ type: 'nightGame', players: [a, b], badgeText: 'SPIN THE BOTTLE', badgeClass: 'green' },
            makeScene('romance.night', { a, b }, { ending: 'kiss' }, [], _spotNow(a, b))));
        } else {
          const others = group.filter(p => p !== a);
          if (!others.length) continue;
          const b = others[Math.floor(Math.random() * others.length)];
          addBond(a, b, 0.3);
          Math.random(); // the draw that picked the sentence (the season must not move)
          events.push(scriptEvent({ type: 'nightGame', players: [a, b], badgeText: 'SPIN THE BOTTLE', badgeClass: 'green' },
            makeScene('romance.night', { a, b }, { ending: 'friends' }, [], _spotNow(a, b))));
        }
      } else if (mode === 'never') {
        const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.3 + 1));
        const others = group.filter(p => p !== a);
        if (!others.length) continue;
        const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.3 + 2));
        addBond(a, b, 0.5);
        const pA = pronouns(a);
        Math.random(); // the draw that picked the sentence (the season must not move)
        events.push(scriptEvent({ type: 'nightGame', players: [a, b], badgeText: 'NEVER HAVE I EVER', badgeClass: 'green' },
          makeScene('romance.night', { a, b }, { ending: 'never' }, [], _spotNow(a, b))));
      } else {
        const a = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.4 + 1));
        const others = group.filter(p => p !== a);
        if (!others.length) continue;
        const b = others[Math.floor(Math.random() * others.length)];
        addBond(a, b, 0.3);
        if (pStats(a).boldness >= 6) {
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[a] = (gs.popularity[a] || 0) + 0.5;
        }
        Math.random(); // the draw that picked the sentence (the season must not move)
        events.push(scriptEvent({ type: 'nightGame', players: [a, b], badgeText: 'TRUTH OR DARE', badgeClass: 'green' },
          makeScene('romance.night', { a, b }, { ending: 'dare' }, [], _spotNow(a, b))));
      }

    // ═══════════════ SETTING ATMOSPHERE (per-venue scene flavor) ═══════════════
    } else if (eventType === 'settingAtmosphere') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.2 + 2));
      addBond(a, b, 0.2);
      const pool = settingProfile().atmosphere || [];
      let line = pool.length ? pool[Math.floor(Math.random() * pool.length)] : `${a} and ${b} pass a quiet hour together at camp.`;
      line = fillVocab(line).replace(/\{a\}/g, a).replace(/\{b\}/g, b);
      const _atmosBadge = { 'hosted-camp': 'CAMP LIFE', 'survival-island': 'ISLAND LIFE', 'carnival': 'CARNIVAL', 'film-lot': 'ON SET', 'world-tour': 'IN FLIGHT' }[currentSetting()] || 'ATMOSPHERE';
      events.push(_venueScene({ type: 'settingAtmosphere', players: [a, b], badgeText: _atmosBadge, badgeClass: 'gold' }, line, 'life.atmos', { a, b }, {}));

    // ═══════════════ SURVIVAL ISLAND ═══════════════
    } else if (eventType === 'forage') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).physical * 0.2 + pStats(n).intuition * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.3 + 2));
      const success = (pStats(a).physical + pStats(a).intuition) / 2 + (Math.random() - 0.5) * 6 >= 5.5;
      if (success) {
        addBond(a, b, 0.6);
        const lines = [
          `${a} and ${b} wade out at low tide and come back with a haul — crabs, a few fish, enough for everyone. The whole camp eats tonight.`,
          `${a} spots a coconut palm ${b} can climb, and between them they bring down a dozen. Real food, for once. It bonds them.`,
          `${a} and ${b} spend hours over the fishing line and finally land a big one. They carry it back like a trophy.`,
          `${a} finds a fruit tree upstream and shows only ${b}. They fill their arms and share the credit at camp.`,
        ];
        events.push({ type: 'forage', players: [a, b], badgeText: 'GOOD HAUL', badgeClass: 'green', text: lines[Math.floor(Math.random() * lines.length)] });
      } else {
        addBond(a, b, -0.3);
        const lines = [
          `${a} and ${b} spend all day on the reef and come back with nothing. The tribe's faces say it all. The two of them barely speak on the walk back.`,
          `The fishing line snaps and ${a}'s only catch gets away. ${b} sighs loud enough to sting. Empty hands, short tempers.`,
          `${a} swears there were crabs here yesterday. ${b} is done looking. They return with nothing but sunburn and frustration.`,
          `${a} and ${b} lose the afternoon to a tide that never cooperates. Another night hungry, and each blames the other a little.`,
        ];
        events.push({ type: 'forage', players: [a, b], badgeText: 'CAME UP EMPTY', badgeClass: 'red', text: lines[Math.floor(Math.random() * lines.length)] });
      }

    } else if (eventType === 'shelterStorm') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).loyalty * 0.2 + pStats(n).physical * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.2 + 2));
      if (getBond(a, b) >= 0 || pStats(a).loyalty >= 6) {
        addBond(a, b, 0.6);
        const lines = [
          `A squall tears the roof off the shelter at midnight. ${a} and ${b} are the only two who get up, and they rebuild it in the rain, soaked and laughing by the end.`,
          `The storm floods the shelter. ${a} and ${b} bail water and re-lash the frame together until dawn. Nobody else moved. They won't forget that about each other.`,
          `Wind rips the palm-thatch loose. ${a} holds the frame while ${b} re-ties it, both of them shivering, both of them staying. It counts.`,
          `The rain comes sideways all night. ${a} and ${b} share the one dry corner and take turns holding the tarp down. Misery, shared, becomes trust.`,
        ];
        events.push({ type: 'shelterStorm', players: [a, b], badgeText: 'WEATHERED IT', badgeClass: 'green', text: lines[Math.floor(Math.random() * lines.length)] });
      } else {
        addBond(a, b, -0.4);
        const lines = [
          `The storm caves in the shelter. ${a} is out there fixing it alone while ${b} stays curled up dry. ${a} says nothing. ${a} remembers everything.`,
          `Rain floods the camp and only ${a} gets up to bail. ${b} sleeps through it — or pretends to. The resentment sets in with the damp.`,
          `${a} re-lashes the frame in the downpour while ${b} watches from the dry side. "Thanks for the help," ${a} mutters. The bond takes on water.`,
          `The shelter half-collapses and ${a} handles it solo. ${b}'s absence is noted, filed, and not forgiven.`,
        ];
        events.push({ type: 'shelterStorm', players: [a, b], badgeText: 'LEFT IN THE RAIN', badgeClass: 'red', text: lines[Math.floor(Math.random() * lines.length)] });
      }

    } else if (eventType === 'fireStruggle') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).mental * 0.2 + pStats(n).endurance * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.2 + 2));
      const got = pStats(a).mental * 0.3 + pStats(a).endurance * 0.2 + (Math.random() - 0.5) * 6 >= 3;
      if (got) {
        addBond(a, b, 0.5);
        const lines = [
          `The fire's been dead for a day. ${a} works the flint for hours while ${b} shields the tinder from the wind — and it finally catches. The camp erupts.`,
          `${a} refuses to give up on the fire. ${b} stays up feeding it slivers of dry bark until the first flame takes. They did that together.`,
          `After a dozen failures, ${a} coaxes an ember to life and ${b} nurses it into a blaze. Warmth, at last — and a small unbreakable thing between them.`,
        ];
        events.push({ type: 'fireStruggle', players: [a, b], badgeText: 'FIRE!', badgeClass: 'green', text: lines[Math.floor(Math.random() * lines.length)] });
      } else {
        addBond(a, b, -0.2);
        const lines = [
          `${a} works the fire kit until ${a}'s hands blister — nothing. ${b} takes over and does no better. Another cold, dark night at camp.`,
          `The tinder's too damp and ${a} knows it. ${b} keeps insisting ${a} try again. The fire stays dead; the mood colder.`,
          `${a} and ${b} trade the flint back and forth for an hour with nothing to show. The camp goes to sleep hungry and unlit.`,
        ];
        events.push({ type: 'fireStruggle', players: [a, b], badgeText: 'NO SPARK', badgeClass: 'red', text: lines[Math.floor(Math.random() * lines.length)] });
      }

    } else if (eventType === 'rationLow') {
      const a = _pick(group, n => Math.max(0.1, 2));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, (5 - getBond(a, n)) * 0.3 + 2));
      if (pStats(a).loyalty >= 6 && pStats(b).loyalty >= 5) {
        addBond(a, b, 0.6);
        const lines = [
          `Down to the last scoop of rice, ${a} quietly gives ${b} the bigger half and takes the burnt bottom of the pot. ${b} notices. ${b} always notices.`,
          `There's barely enough to go around. ${a} skips ${a}'s portion so ${b} can eat, and pretends it's because ${a} isn't hungry. It's not true, and they both know it.`,
          `${a} and ${b} split the last handful of beans grain by grain, laughing at how little it is. Starving together, but together.`,
        ];
        events.push({ type: 'rationLow', players: [a, b], badgeText: 'SHARED THE LAST', badgeClass: 'green', text: lines[Math.floor(Math.random() * lines.length)] });
      } else {
        addBond(a, b, -0.5);
        const lines = [
          `The rice is almost gone and ${a} catches ${b} taking more than a share. The argument that follows is about food. It's not really about food.`,
          `${a} accuses ${b} of sneaking rations at night. ${b} denies it. The pot's emptier than it should be, and so is the trust.`,
          `Hunger makes everyone mean. ${a} and ${b} snap over who ate what, and neither backs down. The camp goes quiet around them.`,
        ];
        events.push({ type: 'rationLow', players: [a, b], badgeText: 'RATION FIGHT', badgeClass: 'red', text: lines[Math.floor(Math.random() * lines.length)] });
      }

    // ═══════════════ CARNIVAL ═══════════════
    } else if (eventType === 'midwayGames') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).physical * 0.2 + pStats(n).boldness * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.2 + 2));
      addBond(a, b, 0.4);
      const aWins = pStats(a).physical + (Math.random() - 0.5) * 8 >= pStats(b).physical;
      const winner = aWins ? a : b;
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[winner] = (gs.popularity[winner] || 0) + 0.4;
      const lines = [
        `${a} and ${b} sink their tickets into the ring toss and go bust together. ${winner} lands the only decent throw and wins a giant stuffed banana. Worth it.`,
        `The whirl-a-ball game is obviously rigged. ${a} and ${b} figure out the trick together and ${winner} cleans up. They split the prize tickets.`,
        `${a} challenges ${b} to the strongman hammer. ${winner} rings the bell; the loser demands three rematches. Best afternoon of the week.`,
        `${a} and ${b} team up against the balloon-dart barker and slowly bankrupt him. ${winner} takes the top prize. The barker is not amused.`,
      ];
      events.push({ type: 'midwayGames', players: [a, b], badgeText: 'MIDWAY', badgeClass: 'green', text: lines[Math.floor(Math.random() * lines.length)] });

    } else if (eventType === 'rideDare') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.3 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.2 + 2));
      if (pStats(b).boldness >= 5 || Math.random() < 0.5) {
        addBond(a, b, 0.5);
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[b] = (gs.popularity[b] || 0) + 0.4;
        const lines = [
          `${a} dares ${b} onto the rustiest coaster in the park. ${b} does it, screaming the whole way, and stumbles off a legend. The two of them can't stop laughing.`,
          `${a} bets ${b} won't ride the Zipper twice in a row. ${b} rides it three times out of spite and wins the whole camp's respect.`,
          `${a} points at the drop tower and raises an eyebrow. ${b} marches straight on. They come off wobbly, grinning, closer.`,
        ];
        events.push({ type: 'rideDare', players: [a, b], badgeText: 'THRILL RIDE', badgeClass: 'green', text: lines[Math.floor(Math.random() * lines.length)] });
      } else {
        addBond(a, b, 0.2);
        const lines = [
          `${a} dares ${b} onto the coaster. ${b} takes one look at the loose bolts and hard-passes. ${a} rides it alone and reports back that ${b} was right.`,
          `${a} tries to talk ${b} onto the Ferris wheel that's visibly missing a car. ${b} declines with dignity. They split a lemonade instead.`,
          `${a} bets ${b} won't ride the Gravitron. ${b} politely values ${b}'s stomach more than ${b}'s pride. No hard feelings.`,
        ];
        events.push({ type: 'rideDare', players: [a, b], badgeText: 'HARD PASS', badgeClass: 'gold', text: lines[Math.floor(Math.random() * lines.length)] });
      }

    } else if (eventType === 'funhouse') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.2 + 2));
      addBond(a, b, 0.5);
      const lines = [
        `${a} and ${b} get lost in the mirror maze and give up trying to escape, just narrating their own distorted reflections until security fishes them out.`,
        `A mechanical clown lunges out of the funhouse dark and ${a} shrieks and grabs ${b}. They laugh about it for the rest of the night.`,
        `${a} and ${b} go through the funhouse backwards for no reason and befriend the bored guy running it. Now they have an inside man.`,
        `The tilted room in the funhouse defeats ${a} completely. ${b} has to drag ${a} out by the collar, both of them wheezing.`,
      ];
      events.push({ type: 'funhouse', players: [a, b], badgeText: 'FUNHOUSE', badgeClass: 'green', text: lines[Math.floor(Math.random() * lines.length)] });

    } else if (eventType === 'carnivalTreat') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.3 + 2));
      if (Math.random() < 0.5) {
        addBond(a, b, 0.5);
        const lines = [
          `${a} splurges the last tickets on a funnel cake and splits it with ${b}. Powdered sugar everywhere, zero regrets.`,
          `${a} and ${b} share a corn dog of dubious origin and rate it far too highly. Carnival food hits different at midnight.`,
          `${a} wins a candy apple at the ring toss and hands it straight to ${b}. Small thing. ${b} keeps the stick.`,
        ];
        events.push({ type: 'carnivalTreat', players: [a, b], badgeText: 'SWEET TOOTH', badgeClass: 'green', text: lines[Math.floor(Math.random() * lines.length)] });
      } else {
        addBond(a, b, -0.3);
        const lines = [
          `The snack stand's "meat" is a mystery even to the vendor. ${a} dares ${b} to finish it; ${b} does, then spends the night regretting everything and blaming ${a}.`,
          `${a} and ${b} split a corn dog that was clearly fried last season. Neither feels right after, and each says it was the other's idea.`,
          `The cotton candy is somehow both stale and wet. ${a} gags, ${b} laughs at ${a}, and it curdles into a real spat.`,
        ];
        events.push({ type: 'carnivalTreat', players: [a, b], badgeText: 'BAD BATCH', badgeClass: 'red', text: lines[Math.floor(Math.random() * lines.length)] });
      }

    // ═══════════════ FILM LOT ═══════════════
    } else if (eventType === 'craftServices') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.3 + 2));
      if (getBond(a, b) >= 0 && Math.random() < 0.55) {
        addBond(a, b, 0.5);
        const lines = [
          `Craft services finally restocks and ${a} and ${b} raid the good snacks together before anyone else wakes up. Loot split evenly, alliance of the stomach sealed.`,
          `${a} saves ${b} the last real coffee from the catering table. On a film lot, that's practically a blood oath.`,
          `${a} and ${b} build absurd sandwiches from the craft-services spread and hold a private tasting. It's the best either has felt all week.`,
        ];
        events.push({ type: 'craftServices', players: [a, b], badgeText: 'CRAFT SERVICES', badgeClass: 'green', text: lines[Math.floor(Math.random() * lines.length)] });
      } else {
        addBond(a, b, -0.4);
        const lines = [
          `The craft-services table runs dry and ${a} finds out ${b} took the last of everything. On an empty lot, that's a declaration of war.`,
          `${a} was saving that donut. ${b} ate it. The catering table becomes a battlefield.`,
          `Nothing's been restocked in days and ${a} catches ${b} hoarding snacks in ${b}'s trailer. The resentment is fully catered.`,
        ];
        events.push({ type: 'craftServices', players: [a, b], badgeText: "TABLE'S BARE", badgeClass: 'red', text: lines[Math.floor(Math.random() * lines.length)] });
      }

    } else if (eventType === 'stuntWrong') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.3 + pStats(n).physical * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.2 + 2));
      const nailedIt = pStats(a).physical + pStats(a).boldness * 0.5 + (Math.random() - 0.5) * 6 >= 8;
      if (nailedIt) {
        addBond(a, b, 0.4);
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[a] = (gs.popularity[a] || 0) + 0.6;
        const lines = [
          `${a} takes on an old stunt rig left on the lot and absolutely nails the landing. ${b} filmed the whole thing. It's going to be replayed for weeks.`,
          `The wire gag looks lethal. ${a} does it anyway, sticks it clean, and takes a bow. ${b} leads the applause.`,
          `${a} rides the runaway prop cart down the back lot and dismounts like an action hero. ${b} can't believe ${a} survived. Neither can ${a}.`,
        ];
        events.push({ type: 'stuntWrong', players: [a, b], badgeText: 'TAKE ONE', badgeClass: 'green', text: lines[Math.floor(Math.random() * lines.length)] });
      } else {
        addBond(a, b, 0.6);
        const lines = [
          `${a} tries a stunt off the old set and it goes wrong fast. ${b} is first to reach ${a}, hauls ${a} up, checks ${a} over. ${a} won't forget who showed up.`,
          `The prop rig collapses mid-stunt and ${a} goes down hard. ${b} drops everything to help. Bruised pride, deepened bond.`,
          `${a}'s big stunt ends in a heap of collapsed scenery. ${b} digs ${a} out, more worried than ${b} expected to be.`,
        ];
        events.push({ type: 'stuntWrong', players: [a, b], badgeText: 'CUT!', badgeClass: 'red', text: lines[Math.floor(Math.random() * lines.length)] });
      }

    } else if (eventType === 'trailerEnvy') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.3 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const jealous = wRandom(others, n => Math.max(0.1, (3 - getBond(a, n)) * 0.4 + pStats(n).boldness * 0.1 + 1));
      addBond(jealous, a, -0.5);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[a] = (gs.popularity[a] || 0) + 0.3;
      const lines = [
        `${a} somehow scored the star trailer with the working A/C while everyone else shares a hot double-wide. ${jealous} has done the math and does not like the result.`,
        `Production keeps treating ${a} like the lead — private trailer, name on the door. ${jealous} is stuck in the shared unit and stewing.`,
        `${a} gets the trailer with the couch and the mini-fridge. ${jealous} gets a folding chair. The set has a class system now, and ${jealous} is on the wrong side.`,
      ];
      events.push({ type: 'trailerEnvy', players: [jealous, a], badgeText: 'STAR TREATMENT', badgeClass: 'red', text: lines[Math.floor(Math.random() * lines.length)] });

    // ═══════════════ WORLD TOUR ═══════════════
    } else if (eventType === 'classDivide') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.3 + 2));
      addBond(a, b, 0.5);
      const lines = [
        `Stuck back in economy class while the winners lounge up front, ${a} and ${b} split a stale pretzel and quietly promise each other they'll be the ones behind the curtain next time.`,
        `The first-class curtain stays shut the whole flight. ${a} and ${b} bond over the shared indignity of the loser cabin — nothing unites people like a common enemy.`,
        `${a} and ${b} press against the economy divider trying to see what the winners are eating. They can't. They plot instead.`,
        `A flight attendant waves ${a} and ${b} back from the first-class aisle. Humiliated together, they trade seats to sit next to each other and scheme.`,
      ];
      events.push({ type: 'classDivide', players: [a, b], badgeText: 'LOSER CLASS', badgeClass: 'green', text: lines[Math.floor(Math.random() * lines.length)] });

    } else if (eventType === 'jetLag') {
      const a = _pick(group, n => Math.max(0.1, (10 - pStats(n).endurance) * 0.3 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.3 + 2));
      if (pStats(b).loyalty >= 5 || getBond(a, b) >= 1) {
        addBond(a, b, 0.5);
        const lines = [
          `Three time zones in two days has wrecked ${a}. ${b} takes ${a}'s shift on the cabin watch without being asked and lets ${a} sleep. Small mercy, long memory.`,
          `${a} is a jet-lagged zombie and can barely form words. ${b} quietly covers for ${a} all day. ${a} clocks every bit of it.`,
          `${a} hasn't slept since the last set. ${b} makes ${a} lie down and stands guard over the seat. Loyalty, at 30,000 feet.`,
        ];
        events.push({ type: 'jetLag', players: [a, b], badgeText: 'RUNNING ON EMPTY', badgeClass: 'green', text: lines[Math.floor(Math.random() * lines.length)] });
      } else {
        addBond(a, b, -0.4);
        const lines = [
          `Jet-lagged and raw, ${a} snaps at ${b} over the armrest, the window shade, everything. It's the exhaustion talking — but ${b} hears it anyway.`,
          `${a} hasn't slept in what feels like days and takes it out on ${b} across the aisle. Nobody's at their best at this altitude.`,
          `${a} is too tired to be kind and ${b} is the nearest target. The bickering lasts the whole flight.`,
        ];
        events.push({ type: 'jetLag', players: [a, b], badgeText: 'FRAYED', badgeClass: 'red', text: lines[Math.floor(Math.random() * lines.length)] });
      }

    } else if (eventType === 'planeFood') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.2 + 1));
      const others = group.filter(p => p !== a);
      if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.3 + 2));
      if (Math.random() < 0.55) {
        addBond(a, b, 0.5);
        const lines = [
          `Economy gets a foil tray of something beige and unidentifiable. ${a} and ${b} trade the edible bits back and forth and make a whole bit out of it.`,
          `The drink cart skips their row entirely. ${a} and ${b} split one warm soda and toast to better days up front.`,
          `${a} saves ${b} the only roll that isn't rock-hard. On this flight, that's romance-adjacent.`,
        ];
        events.push({ type: 'planeFood', players: [a, b], badgeText: 'TRAY TABLE', badgeClass: 'green', text: lines[Math.floor(Math.random() * lines.length)] });
      } else {
        addBond(a, b, -0.3);
        const lines = [
          `There's one hot meal left on the cart and both ${a} and ${b} want it. The flight attendant gives it to first class. Now they're mad at each other instead.`,
          `${a} takes the last edible tray and ${b} gets the mystery entrée. The pettiness reaches cruising altitude.`,
          `${a} and ${b} argue over whose turn it was for the window seat AND the good snack. Neither wins. The cabin gets colder than the food.`,
        ];
        events.push({ type: 'planeFood', players: [a, b], badgeText: 'CART FIGHT', badgeClass: 'red', text: lines[Math.floor(Math.random() * lines.length)] });
      }

    // ═══════════════ HOSTED-CAMP (more) ═══════════════
    } else if (eventType === 'messHallDrama') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.2 + 1));
      const others = group.filter(p => p !== a); if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.2 + 2));
      if (getBond(a, b) < 0 || Math.min(pStats(a).temperament, pStats(b).temperament) <= 4) {
        addBond(a, b, -0.6);
        _rp([0]); // the draw that picked the sentence (the season must not move)
        events.push(scriptEvent({ type: 'messHallDrama', players: [a, b], badgeText: 'MESS HALL', badgeClass: 'red' },
          makeScene('drama.mess', { a, b }, { ending: 'bad' }, [], { id: 'mess-hall', label: 'Mess Hall' })));
      } else {
        addBond(a, b, 0.5);
        _rp([0]); // the draw that picked the sentence (the season must not move)
        events.push(scriptEvent({ type: 'messHallDrama', players: [a, b], badgeText: 'MESS HALL', badgeClass: 'green' },
          makeScene('drama.mess', { a, b }, { ending: 'good' }, [], { id: 'mess-hall', label: 'Mess Hall' })));
      }

    } else if (eventType === 'cabinRaid') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.2 + 1));
      const others = group.filter(p => p !== a); if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, 2));
      const _arch = m => players.find(p => p.name === m)?.archetype || '';
      const _villainish = m => { const ar = _arch(m), s = pStats(m); return ['villain','mastermind','schemer'].includes(ar) || (!['hero','loyal-soldier','social-butterfly','showmancer','underdog','goat'].includes(ar) && s.strategic >= 6 && s.loyalty <= 4); };
      if (_villainish(a) && getBond(a, b) < 4) {
        addBond(a, b, -0.8);
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[a] = (gs.popularity[a] || 0) - 0.4;
        _rp([0]); // the draw that picked the sentence (the season must not move)
        events.push(scriptEvent({ type: 'cabinRaid', players: [a, b], badgeText: 'CABIN RAID', badgeClass: 'red' },
          makeScene('hosted.raid', { a, b }, { ending: 'mean' }, [], _spotNow(a, b))));
      } else {
        addBond(a, b, 0.5);
        _rp([0]); // the draw that picked the sentence (the season must not move)
        events.push(scriptEvent({ type: 'cabinRaid', players: [a, b], badgeText: 'MIDNIGHT RUN', badgeClass: 'green' },
          makeScene('hosted.raid', { a, b }, { ending: 'fun' }, [], _spotNow(a, b))));
      }

    } else if (eventType === 'campfireStory') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.3 + 1));
      const others = group.filter(p => p !== a); if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.2 + 2));
      addBond(a, b, 0.5);
      if (!gs.popularity) gs.popularity = {};
      if (pStats(a).social >= 6) gs.popularity[a] = (gs.popularity[a] || 0) + 0.4;
      _rp([0]); // the draw that picked the sentence (the season must not move)
      events.push(scriptEvent({ type: 'campfireStory', players: [a, b], badgeText: 'CAMPFIRE', badgeClass: 'green' },
        makeScene('hosted.story', { a, b }, {}, [], _spotNow(a, b))));

    // ═══════════════ SURVIVAL-ISLAND (more) ═══════════════
    } else if (eventType === 'waterRun') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).endurance * 0.2 + pStats(n).loyalty * 0.2 + 1));
      const others = group.filter(p => p !== a); if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.2 + 2));
      if (pStats(b).loyalty >= 5 || getBond(a, b) >= 1) {
        addBond(a, b, 0.5);
        events.push({ type: 'waterRun', players: [a, b], badgeText: 'WATER RUN', badgeClass: 'green', text: _rp([
          `${a} and ${b} haul water together up the long trail from the well, trading the heavy jug back and forth without a word of complaint.`,
          `${b} takes the second trip so ${a} can rest. Nobody made ${_pron(b).obj}. ${a} won't forget it.`,
          `${a} and ${b} boil and ration the day's water side by side. Thirsty, tired, but in it together.`,
        ]) });
      } else {
        addBond(a, b, -0.5);
        events.push({ type: 'waterRun', players: [a, b], badgeText: 'DEAD WEIGHT', badgeClass: 'red', text: _rp([
          `${a} does the whole water run alone while ${b} lounges in the shade. ${a} says nothing and remembers everything.`,
          `${b} "forgets" it's ${_pron(b).posAdj} turn to fetch water. ${a} hauls it solo, again, and the resentment builds with every trip.`,
          `${a} calls out ${b} for never carrying ${_pron(b).posAdj} share of the water. ${b} shrugs. It sticks.`,
        ]) });
      }

    } else if (eventType === 'exhaustion') {
      const a = _pick(group, n => Math.max(0.1, (10 - pStats(n).endurance) * 0.3 + 1));
      const others = group.filter(p => p !== a); if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.3 + 2));
      if (!gs.popularity) gs.popularity = {};
      if (pStats(b).loyalty >= 5 || getBond(a, b) >= 0) {
        addBond(b, a, 0.6);
        gs.popularity[b] = (gs.popularity[b] || 0) + 0.4;
        events.push({ type: 'exhaustion', players: [b, a], badgeText: 'CARRIED', badgeClass: 'green', text: _rp([
          `Days of no food catch up with ${a}, who nearly faints at camp. ${b} gets ${_pron(a).obj} water and shade and sits with ${_pron(a).obj} until the color comes back.`,
          `${a} is running on empty and can barely stand. ${b} quietly takes over ${_pron(a).posAdj} chores for the day. ${a} won't forget who showed up.`,
          `${b} notices ${a} hasn't eaten and splits ${_pron(b).posAdj} own ration without being asked. Out here, that's everything.`,
        ]) });
      } else {
        addBond(a, b, -0.4);
        events.push({ type: 'exhaustion', players: [a, b], badgeText: 'RUNNING ON FUMES', badgeClass: 'red', text: _rp([
          `${a} is wrecked from hunger and asks ${b} to cover a chore. ${b} refuses. ${a} does it anyway, hollow-eyed and quietly furious.`,
          `${a} nearly collapses and ${b} barely looks up. Camp notices who helped and who didn't.`,
          `${a} snaps at ${b} out of pure exhaustion. It's not really about ${b} — but the fight is real anyway.`,
        ]) });
      }

    } else if (eventType === 'wildlifeScare') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.3 + 1));
      const others = group.filter(p => p !== a); if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, 2));
      if (!gs.popularity) gs.popularity = {};
      if (pStats(a).boldness >= 6) {
        addBond(a, b, 0.5);
        gs.popularity[a] = (gs.popularity[a] || 0) + 0.6;
        events.push({ type: 'wildlifeScare', players: [a, b], badgeText: 'STOOD GUARD', badgeClass: 'green', text: _rp([
          `A wild boar crashes through camp and ${a} steps between it and a frozen ${b}, waving a stick until it bolts. ${b} owes ${_pron(a).obj} one.`,
          `Something big moves in the treeline at night. ${a} stays up on watch so ${b} and the others can sleep. A quiet kind of brave.`,
          `A snake turns up in the shelter and ${a} calmly carries it out while ${b} stands on a log shrieking. Camp has a new hero and a new punchline.`,
        ]) });
      } else {
        addBond(a, b, -0.3);
        gs.popularity[a] = (gs.popularity[a] || 0) - 0.4;
        events.push({ type: 'wildlifeScare', players: [a, b], badgeText: 'EVERY MAN FOR HIMSELF', badgeClass: 'red', text: _rp([
          `A boar charges through camp and ${a} bolts first, leaving ${b} scrambling. ${b} makes a mental note about who runs when it counts.`,
          `Something rustles in the dark and ${a} shoves past ${b} to get away. Camp saw it. Camp remembers it.`,
          `A rat gets into the food and ${a} shrieks and abandons the whole ration pile. ${b} has to save the food alone.`,
        ]) });
      }

    // ═══════════════ CARNIVAL (more) ═══════════════
    } else if (eventType === 'dunkTank') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.2 + 1));
      const others = group.filter(p => p !== a); if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, (4 - getBond(a, n)) * 0.2 + 2));
      const hit = pStats(a).physical + (Math.random() - 0.5) * 6 >= 4;
      if (!gs.popularity) gs.popularity = {};
      if (hit) {
        addBond(a, b, getBond(a, b) < 0 ? -0.4 : 0.3);
        gs.popularity[a] = (gs.popularity[a] || 0) + 0.4;
        events.push({ type: 'dunkTank', players: [a, b], badgeText: 'DUNKED!', badgeClass: getBond(a, b) < 0 ? 'red' : 'green', text: _rp([
          `${a} winds up at the dunk-tank lever and drops ${b} straight into the cold water on the first throw. ${b} comes up sputtering; the midway roars.`,
          `${b} volunteers for the dunk tank and instantly regrets it — ${a} has deadly aim. Splash. The crowd loves it.`,
          `${a} nails the target and ${b} plunges under. Whether it's friendly or payback depends entirely on who you ask.`,
        ]) });
      } else {
        addBond(a, b, 0.3);
        events.push({ type: 'dunkTank', players: [a, b], badgeText: 'MISSED', badgeClass: '', text: _rp([
          `${a} throws everything at the dunk-tank target and can't land one. ${b} heckles from the dry seat until they're both laughing.`,
          `${a} misses the dunk-tank target ten straight times. ${b} offers pointers that are actively unhelpful. Good time, though.`,
        ]) });
      }

    } else if (eventType === 'prizeBooth') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).physical * 0.2 + pStats(n).boldness * 0.2 + 1));
      const others = group.filter(p => p !== a); if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.3 + 2));
      const won = pStats(a).physical + pStats(a).intuition + (Math.random() - 0.5) * 8 >= 9;
      if (!gs.popularity) gs.popularity = {};
      if (won && (pStats(a).loyalty >= 5 || getBond(a, b) >= 1)) {
        addBond(a, b, 0.6);
        gs.popularity[a] = (gs.popularity[a] || 0) + 0.4;
        events.push({ type: 'prizeBooth', players: [a, b], badgeText: 'GIANT PRIZE', badgeClass: 'green', text: _rp([
          `${a} finally beats the rigged ring toss, wins a giant stuffed banana the size of a person — and hands it straight to ${b}. ${b} names it.`,
          `${a} cleans out the balloon-dart booth and gives the top prize to ${b} without a second thought. Small gesture, big deal.`,
          `${a} wins the strongman hammer game and dedicates the prize to ${b} in front of the whole midway. ${b} pretends to hate it and secretly loves it.`,
        ]) });
      } else if (won) {
        gs.popularity[a] = (gs.popularity[a] || 0) + 0.3;
        addBond(a, b, -0.2);
        events.push({ type: 'prizeBooth', players: [a, b], badgeText: 'GLOATING', badgeClass: '', text: _rp([
          `${a} wins the giant prize and will not stop talking about it. ${b} is one victory lap away from snapping.`,
          `${a} cleans out the prize booth and rubs it in ${b}'s face all afternoon. Impressive. Insufferable.`,
        ]) });
      } else {
        addBond(a, b, 0.3);
        events.push({ type: 'prizeBooth', players: [a, b], badgeText: 'RIGGED', badgeClass: '', text: _rp([
          `${a} and ${b} pour their tickets into the ring toss and figure out too late that it's rigged. They lose together and roast the barker on the way out.`,
          `${a} swears the prize booth is fixed. ${b} agrees. They bankrupt themselves proving it. No prize, good bit.`,
        ]) });
      }

    // ═══════════════ FILM-LOT (more) ═══════════════
    } else if (eventType === 'wardrobeVanity') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.3 + 1));
      const others = group.filter(p => p !== a); if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.2 + 2));
      if (getBond(a, b) >= 0 && Math.random() < 0.6) {
        addBond(a, b, 0.5);
        events.push({ type: 'wardrobeVanity', players: [a, b], badgeText: 'WARDROBE', badgeClass: 'green', text: _rp([
          `${a} and ${b} raid the costume department and put on an impromptu fashion show for no one. The trailers have never been this fun.`,
          `${a} does ${b}'s makeup with the set kit and it actually looks incredible. ${b} won't stop admiring it. A little vanity, a lot of bonding.`,
          `${a} and ${b} claim the good mirror and gossip through the whole makeup call. Two hours vanish. Worth it.`,
        ]) });
      } else {
        addBond(a, b, -0.4);
        events.push({ type: 'wardrobeVanity', players: [a, b], badgeText: 'MIRROR HOG', badgeClass: 'red', text: _rp([
          `${a} hogs the one good lit mirror for an hour while ${b} waits and steams. On a film lot, vanity is a competitive sport.`,
          `${a} takes the best costume before ${b} can and won't trade. ${b} is stuck in the ridiculous one and it's personal now.`,
          `${a} rearranges the whole shared trailer around ${_pron(a).posAdj} own look. ${b} liked it the old way and says so.`,
        ]) });
      }

    } else if (eventType === 'divaFit') {
      const a = _pick(group, n => Math.max(0.1, (['villain','hothead','mastermind'].includes(players.find(p=>p.name===n)?.archetype) ? 3 : 0) + (10 - pStats(n).temperament) * 0.2 + 1));
      const others = group.filter(p => p !== a); if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, 2));
      addBond(a, b, -0.6);
      group.filter(x => x !== a && x !== b).forEach(o => addBond(o, a, -0.2));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[a] = (gs.popularity[a] || 0) - 0.6;
      events.push({ type: 'divaFit', players: [a, b], badgeText: 'DIVA FIT', badgeClass: 'red', text: _rp([
        `${a} decides ${_pron(a).sub}'${_pron(a).sub==='they'?'re':'s'} the star of this season and throws a full tantrum when ${b} gets the better trailer. The lot hears every second of it.`,
        `${a} demands a bigger role in the challenge and storms off the "set" when ${b} disagrees. Very dramatic. Not a good look.`,
        `${a} treats ${b} like a personal assistant on the lot. ${b} is done being ordered around, and everyone watching agrees.`,
      ]) });

    } else if (eventType === 'bloopers') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.2 + 1));
      const others = group.filter(p => p !== a); if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.2 + 2));
      addBond(a, b, 0.5);
      events.push({ type: 'bloopers', players: [a, b], badgeText: 'BLOOPER', badgeClass: 'green', text: _rp([
        `${a} flubs a "line" during the challenge so badly that ${b} breaks character laughing, and then neither of them can stop. Best take of the day, for the wrong reasons.`,
        `A prop falls apart mid-scene and ${a} and ${b} improvise something so dumb the whole lot cracks up. An inside joke is born.`,
        `${a} trips over the fake set and takes ${b} down too. They lie in the wreckage wheezing. Production keeps the footage.`,
        `${a} and ${b} keep corpsing every time they make eye contact on set. The bit that ruins the take is the bit that makes them friends.`,
      ]) });

    // ═══════════════ WORLD-TOUR (more) ═══════════════
    } else if (eventType === 'layover') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).social * 0.2 + 1));
      const others = group.filter(p => p !== a); if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, getBond(a, n) * 0.2 + 2));
      if (getBond(a, b) >= 0 || Math.random() < 0.55) {
        addBond(a, b, 0.5);
        events.push({ type: 'layover', players: [a, b], badgeText: 'LAYOVER', badgeClass: 'green', text: _rp([
          `Stuck waiting on the tarmac for hours, ${a} and ${b} invent a game with a deck of cards and one bad snack. The delay flies by.`,
          `The plane's grounded between sets and ${a} and ${b} explore the empty terminal, narrating everything like tour guides. Boredom, defeated.`,
          `A long layover turns into ${a} and ${b} trading life stories on the terminal floor. By boarding call they're a unit.`,
        ]) });
      } else {
        addBond(a, b, -0.4);
        events.push({ type: 'layover', players: [a, b], badgeText: 'DELAYED', badgeClass: 'red', text: _rp([
          `A five-hour delay frays everyone. ${a} and ${b} snipe at each other over the last outlet and the good bench. Neither wins.`,
          `Trapped in a dead terminal with no sleep, ${a} takes it out on ${b}. It's the delay talking — but ${b} hears it anyway.`,
          `${a} and ${b} argue about whose fault the missed connection was. It was nobody's. The grudge is real regardless.`,
        ]) });
      }

    } else if (eventType === 'souvenirGrab') {
      const a = _pick(group, n => Math.max(0.1, pStats(n).boldness * 0.2 + 1));
      const others = group.filter(p => p !== a); if (!others.length) continue;
      const b = wRandom(others, n => Math.max(0.1, 2));
      const _arch2 = m => players.find(p => p.name === m)?.archetype || '';
      const _vill2 = m => { const ar = _arch2(m), s = pStats(m); return ['villain','mastermind','schemer'].includes(ar) || (!['hero','loyal-soldier','social-butterfly','showmancer','underdog','goat'].includes(ar) && s.strategic >= 6 && s.loyalty <= 4); };
      if (_vill2(a) && getBond(a, b) < 4) {
        addBond(a, b, -0.7);
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[a] = (gs.popularity[a] || 0) - 0.4;
        events.push({ type: 'souvenirGrab', players: [a, b], badgeText: 'STICKY FINGERS', badgeClass: 'red', text: _rp([
          `${a} pockets the little trinket ${b} grabbed from the last set as a keepsake. ${b} notices it's gone and does the math.`,
          `${a} "borrows" ${b}'s souvenir from the themed set and conveniently forgets to give it back. ${b} won't forget.`,
          `${a} swipes a prop off the set and lets ${b} take the blame when a producer asks. Cold.`,
        ]) });
      } else {
        addBond(a, b, 0.5);
        events.push({ type: 'souvenirGrab', players: [a, b], badgeText: 'KEEPSAKE', badgeClass: 'green', text: _rp([
          `${a} sneaks a tiny keepsake off the themed set and gives a matching one to ${b}. A dumb little bond nobody else gets.`,
          `${a} and ${b} each grab a ridiculous souvenir from the set and swear to keep them forever. It's silly. It sticks.`,
          `${a} pockets a prop as a memento and shows ${b} first. Their inside joke has a physical form now.`,
        ]) });
      }
    }
  }

  // ── EXTREME BOND EVENTS: rare events that only fire for very high or very low bonds ──
  const _rp2 = arr => arr[Math.floor(Math.random() * arr.length)];
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const _eb = getBond(group[i], group[j]);
      const a = group[i], b = group[j];
      const pA = pronouns(a), pB = pronouns(b);

      // ── PURE HATRED (-9 or worse) ──
      if (_eb <= -9 && Math.random() < 0.55) {
        addBond(a, b, -0.8);
        group.filter(p => p !== a && p !== b).forEach(p => { addBond(p, a, -0.3); addBond(p, b, -0.3); });
        _rp2([0]); // the draw that picked the sentence (the season must not move)
        events.push(scriptEvent({ type: 'pureHatred', players: [a, b], badgeText: 'HATRED', badgeClass: 'red' },
          makeScene('drama.nemesis', { a, b }, {}, [], _spotNow(a, b))));
      }

      // ── NEMESIS (-7 to -9) ──
      else if (_eb <= -7 && Math.random() < 0.40) {
        addBond(a, b, -0.5);
        if (gs.playerStates?.[a] && pStats(a).temperament <= 5) gs.playerStates[a].emotional = 'paranoid';
        else if (gs.playerStates?.[b] && pStats(b).temperament <= 5) gs.playerStates[b].emotional = 'paranoid';
        _rp2([0]); // the draw that picked the sentence (the season must not move)
        events.push(scriptEvent({ type: 'nemesis', players: [a, b], badgeText: 'NEMESIS', badgeClass: 'red' },
          makeScene('drama.nemesis', { a, b }, {}, [], _spotNow(a, b))));
      }

      // ── UNBREAKABLE (+9 or better) ──
      if (_eb >= 9 && Math.random() < 0.55) {
        addBond(a, b, 0.3);
        group.filter(p => p !== a && p !== b).forEach(p => {
          if (getBond(p, a) < 3) addBond(p, a, -0.2);
          if (getBond(p, b) < 3) addBond(p, b, -0.2);
        });
        _rp2([0]); // the draw that picked the sentence (the season must not move)
        events.push(scriptEvent({ type: 'unbreakableBond', players: [a, b], badgeText: 'UNBREAKABLE', badgeClass: 'green' },
          makeScene('friend.unbreakable', { a, b }, {}, [], _spotNow(a, b))));
      }

      // ── RIDE OR DIE (+7 to +9) ──
      else if (_eb >= 7 && Math.random() < 0.40) {
        addBond(a, b, 0.5);
        const protector = pStats(a).loyalty >= pStats(b).loyalty ? a : b;
        group.filter(p => p !== a && p !== b).forEach(p => { if (Math.random() < 0.3) addBond(p, protector, 0.3); });
        _rp2([0]); // the draw that picked the sentence (the season must not move)
        events.push(scriptEvent({ type: 'rideOrDie', players: [a, b], badgeText: 'RIDE OR DIE', badgeClass: 'green' },
          makeScene('friend.rideordie', { a, b }, {}, [], _spotNow(a, b))));
      }

      // ── REKINDLE: damaged bond (-4 to -7) starts to heal ──
      if (_eb >= -7 && _eb <= -4 && Math.random() < 0.12) {
        const canRekindle = pStats(a).social >= 6 || pStats(b).social >= 6 || pStats(a).temperament >= 7 || pStats(b).temperament >= 7;
        if (canRekindle) {
          const initiator = pStats(a).social >= pStats(b).social ? a : b;
          const receiver = initiator === a ? b : a;
          const pI = pronouns(initiator), pR = pronouns(receiver);
          addBond(a, b, 2.5);
          _rp2([0]); // the draw that picked the sentence (the season must not move)
          events.push(scriptEvent({ type: 'rekindle', players: [initiator, receiver], badgeText: 'REKINDLE', badgeClass: 'green' },
            makeScene('friend.rekindle', { a: initiator, b: receiver }, {}, [], _spotNow(initiator, receiver))));
        }
      }

      // ── BREAKUP: strong bond (+5 to +8) fractures ──
      if (_eb >= 5 && _eb <= 8 && Math.random() < 0.10) {
        const hasStrategist = pStats(a).strategic >= 7 || pStats(b).strategic >= 7;
        const hasLowLoyalty = pStats(a).loyalty <= 4 || pStats(b).loyalty <= 4;
        if (hasStrategist || hasLowLoyalty) {
          const instigator = pStats(a).strategic > pStats(b).strategic ? a : b;
          const hurt = instigator === a ? b : a;
          const pIn = pronouns(instigator), pH = pronouns(hurt);
          const damage = -1.5 - Math.random() * 1.5;
          addBond(a, b, damage);
          if (gs.playerStates?.[hurt]) gs.playerStates[hurt].emotional = 'uneasy';
          _rp2([0]); // the draw that picked the sentence (the season must not move)
          events.push(scriptEvent({ type: 'breakup', players: [instigator, hurt], badgeText: 'BREAKUP', badgeClass: 'red' },
            makeScene('friend.drift', { a: instigator, b: hurt }, {}, [], _spotNow(instigator, hurt))));
        }
      }
    }
  }

  // Franchise meta: once-per-season history moments between returnees who share a past.
  const _fm = gs.franchiseMeta;
  if (_fm && group.length >= 2) {
    if (!gs._metaCalloutsFired) gs._metaCalloutsFired = {};
    // Decaying frequency: the "everyone's catching up" wave belongs to the
    // premiere episodes. 100% weight at ep 1 tapering ~8%/episode to a 30%
    // floor, so only the juiciest leftover history surfaces late-game.
    const _metaDecay = Math.max(0.3, 1 - (gs.episode || 0) * 0.08);
    const _pairs = (_fm.seededPairs || []).filter(sp =>
      // Skip betrayer-side duplicate of a betrayal pair (wronged === false) so one betrayal fires one event.
      sp.wronged !== false &&
      group.includes(sp.a) && group.includes(sp.b) &&
      !gs._metaCalloutsFired[sp.a + '||' + sp.b + '::' + sp.kind]);
    for (const sp of _pairs) {
      if (Math.random() > 0.25 * _metaDecay) continue; // early-season wave, rare late
      gs._metaCalloutsFired[sp.a + '||' + sp.b + '::' + sp.kind] = true;
      const A = sp.a, B = sp.b, pa = pronouns(A);
      if (sp.kind === 'betrayal' || sp.kind === 'blindside') {
        addBond(A, B, -0.5);
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[A] = (gs.popularity[A] || 0) + 0.5; // sympathy for the wronged
        events.push({ type: 'metaGrudge', players: [A, B],
          text: _rp([
            `${A} finally says it to ${B}'s face: "${sp.reason}. I haven't forgotten." The whole camp goes quiet.`,
            `${A} and ${B} circle each other all morning. ${sp.reason} — some wounds don't close between seasons.`,
            `${B} tries to laugh off the past. ${A} isn't laughing. ${sp.reason}, and ${pa.sub} came back to settle it.`,
            `Old business surfaces at the fire: ${sp.reason}. ${A} wants an apology. ${B} offers strategy instead. It goes badly.`
          ]),
          consequences: `Bond ${A}↔${B} −0.5. ${A} gains sympathy.`,
          badgeText: 'OLD WOUNDS', badgeClass: 'red' });
      } else if (sp.kind === 'allies' || sp.kind === 'showmance-intact') {
        addBond(A, B, +0.5);
        events.push({ type: 'metaReunion', players: [A, B],
          text: _rp([
            `${A} and ${B} fall back into their old rhythm within minutes. ${sp.reason} — and everyone else at camp notices the shorthand.`,
            `No pitch needed: ${A} and ${B} shared a foxhole once. ${sp.reason}. The trust is already built.`,
            `${A} catches ${B}'s eye across camp and grins. ${sp.reason}. The band might be getting back together.`,
            `Veterans move different: ${A} and ${B} debrief by the water like no time passed at all. ${sp.reason}.`
          ]),
          consequences: `Bond ${A}↔${B} +0.5. Their closeness is public knowledge.`,
          badgeText: 'REUNION', badgeClass: 'gold' });
      } else { // rivals, showmance-broken
        addBond(A, B, -0.3);
        events.push({ type: 'metaAwkward', players: [A, B],
          text: _rp([
            `${A} and ${B} get assigned the same chore and say maybe nine words total. ${sp.reason} — the tension is its own third player.`,
            `Everyone can feel it: ${A} and ${B} have history. ${sp.reason}. Nobody asks. Everybody watches.`,
            `${B} picks the far side of camp. ${A} pretends not to notice. ${sp.reason}, and neither wants to relive it.`,
            `A too-long silence when ${A} and ${B} end up alone at the fire. ${sp.reason}. Some things don't need a confessional.`
          ]),
          consequences: `Bond ${A}↔${B} −0.3. Camp reads the tension.`,
          badgeText: 'HISTORY', badgeClass: 'red' });
      }
    }

    // ── Real-returnee moments beyond shared-past pairs ──
    const _epNext = (gs.episode || 0) + 1;

    // (a) Someone names a decorated vet as THE threat — real targeting heat.
    for (const T of group) {
      const _prof = _fm.profiles?.[T];
      if (!_prof || _prof.repScore < 0.5) continue;
      const _tKey = 'threatcall::' + T;
      if (gs._metaCalloutsFired[_tKey] || Math.random() > 0.2 * _metaDecay) continue;
      const O = group.filter(n => n !== T && (_fm.profiles?.[n]?.repScore || 0) < 0.5)
        .sort((x, y) => (pStats(y).strategic + pStats(y).intuition) - (pStats(x).strategic + pStats(x).intuition))[0];
      if (!O) continue;
      gs._metaCalloutsFired[_tKey] = true;
      if (!gs._metaThreatHeat) gs._metaThreatHeat = {};
      gs._metaThreatHeat[T] = { amount: 0.8 + _prof.repScore, expiresEp: _epNext + 2 };
      addBond(O, T, -0.3);
      const _headline = _prof.resume?.[0] || 'that résumé';
      events.push({ type: 'metaThreatCall', players: [O, T],
        text: _rp([
          `${O} says the quiet part at the fire: "${_headline}. Why are we all pretending ${T} isn't the biggest threat here?" Heads nod slowly.`,
          `${O} pulls two people aside and holds up fingers, counting: "${_headline}. You don't carry that record by accident." ${T}'s name is officially in the air.`,
          `Someone asks who's dangerous. ${O} doesn't hesitate: "${T}. ${_headline}. We let that slide, we lose." The silence afterward agrees.`,
          `${O} watches ${T} work the camp and mutters, "${_headline} — and we're just letting it happen again." A few people start watching too.`
        ]),
        consequences: `${T} takes threat heat for 2 episodes. Bond ${O}↔${T} −0.3.`,
        badgeText: 'THREAT NAMED', badgeClass: 'red' });
    }

    // (b) Distrust of a known betrayer by someone with no personal history — the tapes are enough.
    for (const T of group) {
      const _prof = _fm.profiles?.[T];
      if (!_prof || _prof.knownSchemer < 0.4) continue;
      const _cands = group.filter(n => n !== T && !(_fm.seededPairs || []).some(sp =>
        (sp.a === n && sp.b === T) || (sp.a === T && sp.b === n)));
      const A = _cands.sort((x, y) => (pStats(y).intuition + pStats(y).mental) - (pStats(x).intuition + pStats(x).mental))[0];
      if (!A) continue;
      const _dKey = 'distrust::' + A + '>>' + T;
      if (gs._metaCalloutsFired[_dKey] || Math.random() > 0.18 * _metaDecay) continue;
      gs._metaCalloutsFired[_dKey] = true;
      addBond(A, T, -0.5);
      events.push({ type: 'metaDistrust', players: [A, T],
        text: _rp([
          `${T} extends a hand and a deal. ${A} smiles, agrees to nothing, and later tells the fire: "I've seen ${T}'s seasons. I know how this movie ends."`,
          `${A} keeps every conversation with ${T} short and public. Nothing personal — just an unreliable history and a good memory.`,
          `"${T} plays people. That's not an insult, it's a record." ${A} says it without heat, which somehow makes it worse.`,
          `${T} offers ${A} the same warmth that worked on past casts. ${A} clocks it instantly — different season, same script — and quietly steps back.`
        ]),
        consequences: `Bond ${A}↔${T} −0.5. ${A} won't be recruited easily.`,
        badgeText: 'RECEIPTS', badgeClass: 'red' });
    }

    // (c) Old flames — rekindle attempt through the REAL romance pipeline
    // (window call: romance.js imports this module, direct import would cycle;
    // _challengeRomanceSpark enforces romance toggle, 4-showmance cap,
    // romanticCompat, and duplicate-spark guards internally).
    for (const sp of (_fm.seededPairs || [])) {
      if (sp.kind !== 'showmance-intact' && sp.kind !== 'showmance-broken') continue;
      if (!group.includes(sp.a) || !group.includes(sp.b)) continue;
      const _rKey = 'rekindle::' + sp.a + '||' + sp.b;
      if (gs._metaCalloutsFired[_rKey]) continue;
      if (Math.random() > (sp.kind === 'showmance-intact' ? 0.3 : 0.12) * _metaDecay) continue;
      gs._metaCalloutsFired[_rKey] = true; // one attempt per season, sparked or not
      const _sparked = (typeof window !== 'undefined' && typeof window._challengeRomanceSpark === 'function')
        ? window._challengeRomanceSpark(sp.a, sp.b, null, null, null) : false;
      if (_sparked) {
        events.push({ type: 'metaRekindle', players: [sp.a, sp.b],
          text: _rp([
            `${sp.a} and ${sp.b} end up on water duty together. Ten quiet minutes, one old joke, and suddenly last season doesn't feel so far away.`,
            `Everyone remembers ${sp.a} and ${sp.b} from before. Judging by the way they're orbiting each other at the fire, so do they.`,
            `${sp.b} swore it was strictly game this time. Then ${sp.a} laughed at something dumb, and the whole camp watched the wall come down an inch.`,
            `Old flames don't need kindling: ${sp.a} saves ${sp.b} the good spot in the shelter without being asked. Neither of them comments. Everyone else does.`
          ]),
          consequences: `A romantic spark rekindles between ${sp.a} and ${sp.b} (romance pipeline).`,
          badgeText: 'OLD FLAME', badgeClass: 'gold' });
      }
    }
  }

  // ── Social Manipulation Events ──
  // Kept deliberately uncommon so ordinary social moments (bonding, side deals, comfort, etc.)
  // outnumber scheming. Elevated, but not spammy, during Lucky Hunt.
  const _schemeBoost = ep?.isLuckyHunt ? 0.28 : 0.09;
  const socialEvents = generateSocialManipulationEvents(group, ep, _schemeBoost);
  socialEvents.forEach(evt => events.push(evt));

  return events;
}

export function checkAllianceRecruitment(ep) {
  if (!gs.namedAlliances?.length) return;

  const active = gs.activePlayers;
  if (!ep.allianceRecruits) ep.allianceRecruits = [];

  // Deterministic per-episode roll keyed by player+alliance+scenario
  const epSeed = ep.num * 43;
  const pctRoll = (key) => ([...key].reduce((s, c) => s + c.charCodeAt(0), 0) + epSeed) % 100;

  // Avg bond between a player and an array of members
  const avgBondWith = (player, members) => {
    const others = members.filter(m => m !== player && active.includes(m));
    if (!others.length) return 0;
    return others.reduce((sum, m) => sum + getBond(player, m), 0) / others.length;
  };

  // Perform the recruitment: add player to alliance, boost bonds, inject camp event
  const doRecruit = (alliance, recruit, recruiter, scenario) => {
    // Prevent double-recruitment this episode
    if (ep.allianceRecruits.some(r => r.player === recruit)) return;
    if (alliance.members.includes(recruit)) return;
    // Cap: don't recruit if alliance already has 5+ active members
    if (alliance.members.filter(m => active.includes(m)).length >= 6) return;

    // ── Acceptance check: based on RELATIONSHIPS, not stats ──
    const _rS = pStats(recruit);
    const _rState = gs.playerStates?.[recruit]?.emotional || 'comfortable';
    const bondWithRecruiter = getPerceivedBond(recruit, recruiter);
    const allianceActives = alliance.members.filter(m => active.includes(m));
    const avgBondAlliance = allianceActives.length ? allianceActives.reduce((s,m) => s + getPerceivedBond(recruit, m), 0) / allianceActives.length : 0;
    // Has the recruiter ever voted against the recruit?
    const _recruiterVotedMe = (gs.episodeHistory || []).some(e =>
      (e.votingLog || []).some(v => v.voter === recruiter && v.voted === recruit && v.voter !== 'THE GAME')
    );
    // Does the recruit have an existing alliance they're loyal to?
    const _hasExistingAlliance = gs.namedAlliances.some(a => a.active && a.members.includes(recruit) && a.members.filter(m => active.includes(m)).length >= 2);

    // Acceptance is relationship-driven:
    // Strong bond = easy yes. Negative bond = hard no. History matters.
    let acceptChance = 40; // base
    acceptChance += bondWithRecruiter * 12;  // bond 3 = +36%, bond -2 = -24% (THE main driver)
    acceptChance += avgBondAlliance * 6;     // avg 2 = +12% (do I trust this group?)
    acceptChance += reputationModifier(recruiter, 'recruitment') * 45;
    acceptChance += reputationModifier(recruit, 'recruitment') * 25;
    if (_recruiterVotedMe && bondWithRecruiter < 2) acceptChance -= 20; // you voted me out, now you want to ally?
    if (_hasExistingAlliance && _rS.loyalty >= 6) acceptChance -= 15; // loyal to my current people
    // Emotional state — desperation makes you say yes to anyone
    if (_rState === 'desperate') acceptChance += 20;
    else if (_rState === 'paranoid') acceptChance += 10;
    else if (_rState === 'comfortable') acceptChance -= 8;

    acceptChance = Math.max(10, Math.min(90, acceptChance)); // clamp 10-90%

    const _roll = pctRoll(recruit + recruiter + alliance.name + scenario);
    if (_roll >= acceptChance) {
      // Refused — small bond hit (recruiter feels rejected)
      addBond(recruit, recruiter, -0.2);
      ep.allianceRefusals = ep.allianceRefusals || [];
      ep.allianceRefusals.push({ player: recruit, recruiter, alliance: alliance.name, scenario });
      // Refusal camp event — in the recruit's own camp. It used to go to the episode's first
      // camp whoever was in it, so a refusal could air in the other tribe's camp.
      const _refCamp = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(recruit))?.name;
      const _refKey = (_refCamp && ep.campEvents?.[_refCamp]) ? _refCamp : null;
      if (_refKey) {
        const _refBlock = ep.campEvents[_refKey].post || ep.campEvents[_refKey].pre;
        Math.random(); // the draw that picked the sentence (the season must not move)
        const _rb = getPerceivedBond(recruit, recruiter);
        if (Array.isArray(_refBlock)) _refBlock.push(scriptEvent({ type: 'allianceRefusal', players: [recruit, recruiter], badgeText: 'TURNED DOWN', badgeClass: 'red' },
          makeScene('recruit.refuse', { a: recruiter, b: recruit },
            { ending: _rb <= -1 ? 'hostile' : _rb >= 2 ? 'friendly' : 'neutral', group: alliance.name }, [],
            spotOf(ep, recruiter, recruit, 'post').spot),
          { ep: ep.num, phase: 'post' }));
      }
      return;
    }

    alliance.members.push(recruit);

    // Bond boost with all existing members
    alliance.members.filter(m => m !== recruit && active.includes(m))
      .forEach(m => { addBond(recruit, m, 0.25); });

    // Emotional state → confident
    if (gs.playerStates?.[recruit]) gs.playerStates[recruit].emotional = 'confident';

    // If recruit was in a rival alliance: bond hit there + blowup heat (betrayal risk next tribal)
    const rivalAlliance = gs.namedAlliances.find(a =>
      a !== alliance && a.active && a.members.includes(recruit) &&
      a.members.filter(m => active.includes(m)).length >= 2
    );
    if (rivalAlliance) {
      rivalAlliance.members.filter(m => m !== recruit && active.includes(m))
        .forEach(m => addBond(recruit, m, -0.5));
      if (!gs.blowupHeatNextEp) gs.blowupHeatNextEp = new Set();
      gs.blowupHeatNextEp.add(recruit);
    }

    ep.allianceRecruits.push({ player: recruit, toAlliance: alliance.name, fromAlliance: rivalAlliance?.name || null, scenario });

    // Camp event — guaranteed: find recruit's tribe block, fall back to any available block
    const _recruitCampKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(recruit))?.name;
    // The recruit's own camp only (the fallback to the episode's first camp aired it in the wrong one).
    const _campKey = (_recruitCampKey && ep.campEvents?.[_recruitCampKey]) ? _recruitCampKey : null;
    if (_campKey) {
      const _block = ep.campEvents[_campKey];
      const _target = _block.post || _block.pre;
      Math.random(); // the draw that picked the sentence
      const _RECRUIT_KINDS = ['swap-outsider', 'post-quit', 'blindside-swing', 'free-agent', 'post-betrayal', 'power-couple', 'idol-shield'];
      _target.push(scriptEvent({ type: 'allianceRecruit', players: [recruit, recruiter], badgeText: 'RECRUITED', badgeClass: 'gold' },
        makeScene('recruit.join', { a: recruiter, b: recruit },
          { ending: _RECRUIT_KINDS.includes(scenario) ? scenario : 'other', group: alliance.name }, [],
          spotOf(ep, recruiter, recruit, 'post').spot),
        { ep: ep.num, phase: 'post' }));
    }
  };

  // ── SCENARIO A: Post-swap outsider recruited by alliance majority on new tribe ──
  const hadSwap = ep.twists?.some(t =>
    ['tribe-swap', 'tribe-dissolve', 'tribe-expansion', 'abduction', 'kidnapping', 'mutiny'].includes(t.type) // kidnapping included: cross-tribe bond formation counts as swap-adjacent
  );
  if (hadSwap && ep.tribesAtStart?.length && gs.phase === 'pre-merge' && gs.tribes.length) {
    gs.tribes.forEach(newTribe => {
      newTribe.members.filter(m => active.includes(m)).forEach(outsider => {
        // Did this player change tribes this episode?
        const preTribe = ep.tribesAtStart.find(t => t.members.includes(outsider));
        if (!preTribe || preTribe.name === newTribe.name) return;
        // Skip if already in a named alliance with members on this new tribe
        const alreadyCovered = gs.namedAlliances.some(a =>
          a.active && a.members.includes(outsider) &&
          a.members.some(m => m !== outsider && newTribe.members.includes(m) && active.includes(m))
        );
        if (alreadyCovered) return;
        // Find qualifying alliances: 2+ members on new tribe, positive avg bond with outsider
        gs.namedAlliances.forEach(alliance => {
          if (!alliance.active) return;
          const onNewTribe = alliance.members.filter(m => m !== outsider && newTribe.members.includes(m) && active.includes(m));
          if (onNewTribe.length < 2) return;
          const _avgB = avgBondWith(outsider, onNewTribe);
          if (_avgB < 1) return;
          if (Math.random() >= Math.min(0.65, _avgB * 0.12)) return; // bond 2=24%, 4=48%, 6+=65%
          const recruiter = onNewTribe.sort((a, b) => getBond(outsider, b) - getBond(outsider, a))[0];
          doRecruit(alliance, outsider, recruiter, 'swap-outsider');
        });
      });
    });
  }

  // ── SCENARIO B: Just quit a named alliance, has bond >= 3 with a member of another ──
  (ep.allianceQuits || []).forEach(({ player }) => {
    if (!active.includes(player)) return;
    gs.namedAlliances.forEach(alliance => {
      if (!alliance.active || alliance.members.includes(player)) return;
      const allianceActives = alliance.members.filter(m => active.includes(m));
      if (allianceActives.length < 2) return;
      const anchor = allianceActives.sort((a,b) => getBond(player,b) - getBond(player,a))[0];
      const anchorBond = getBond(player, anchor);
      if (anchorBond < 1) return;
      if (Math.random() >= Math.min(0.60, anchorBond * 0.10)) return; // bond 2=20%, 5=50%, 6+=60% cap
      doRecruit(alliance, player, anchor, 'post-quit');
    });
  });

  // ── SCENARIO C: Blindside — swing voter absorbed into winning bloc ──
  // Only fires post-tribal (ep.eliminated + ep.votingLog must exist)
  const vlog = ep.votingLog || [];
  if (ep.eliminated && ep.eliminated !== 'No elimination' && vlog.length) {
    // Alliance the eliminated player belonged to (the "blindsided" side)
    const elimAlliance = gs.namedAlliances.find(a =>
      a.active && a.members.includes(ep.eliminated) &&
      a.members.filter(m => active.includes(m)).length >= 1
    );
    if (elimAlliance) {
      // Swing voters: voted for the eliminated AND not in the eliminated's alliance
      const swingVoters = vlog.filter(l =>
        l.voted === ep.eliminated && l.voter !== 'THE GAME' &&
        active.includes(l.voter) && !elimAlliance.members.includes(l.voter)
      ).map(l => l.voter);
      // Winning blocs: alliances that had members voting for the eliminated
      const winningBlocs = gs.namedAlliances.filter(a =>
        a !== elimAlliance && a.active &&
        a.members.some(m => vlog.some(l => l.voter === m && l.voted === ep.eliminated))
      );
      swingVoters.forEach(voter => {
        winningBlocs.forEach(bloc => {
          if (bloc.members.includes(voter)) return;
          const blocActives = bloc.members.filter(m => active.includes(m));
          if (!blocActives.length) return;
          const anchor = blocActives.sort((a,b) => getBond(voter,b) - getBond(voter,a))[0];
          if (!anchor || getBond(voter, anchor) < 1) return;
          if (pctRoll(voter + bloc.name + 'C') >= 30) return; // ~30%
          doRecruit(bloc, voter, anchor, 'blindside-swing');
        });
      });
    }
  }

  // ── SCENARIO D: Free agents post-merge — unallied players seek existing alliances ──
  if (gs.isMerged) {
    const _activeAlliances = gs.namedAlliances.filter(a => a.active && a.members.filter(m => active.includes(m)).length >= 2);
    active.forEach(freeAgent => {
      // Skip if already in an active alliance
      if (_activeAlliances.some(a => a.members.includes(freeAgent))) return;
      // Skip if already recruited this episode
      if (ep.allianceRecruits?.some(r => r.player === freeAgent)) return;
      // Find best alliance to join: highest avg bond with active members
      const candidates = _activeAlliances.map(a => {
        const actives = a.members.filter(m => active.includes(m));
        const avg = avgBondWith(freeAgent, actives);
        const bestMember = actives.sort((x,y) => getBond(freeAgent, y) - getBond(freeAgent, x))[0];
        return { alliance: a, avg, bestMember };
      }).filter(c => c.avg >= 0.5 && c.bestMember).sort((a,b) => b.avg - a.avg);

      if (candidates.length) {
        const _faS = pStats(freeAgent);
        const _faState = gs.playerStates?.[freeAgent]?.emotional || 'comfortable';
        // Base chance scaled by personality:
        // - Strategic players actively seek alliances (they know they need numbers)
        // - Social players naturally gravitate toward groups
        // - Desperate/paranoid players scramble for safety
        // - Comfortable/content players feel less urgency
        // - Low strategic + comfortable = barely tries
        let _faChance = 20; // base 20%
        _faChance += _faS.strategic * 2.5;  // strategic 1=+2.5%, 10=+25%
        _faChance += _faS.social * 1.5;     // social 1=+1.5%, 10=+15%
        if (_faState === 'desperate') _faChance += 25;  // scrambling for any lifeline
        else if (_faState === 'paranoid') _faChance += 20;  // knows they need protection
        else if (_faState === 'uneasy') _faChance += 10;   // starting to worry
        else if (_faState === 'calculating') _faChance += 15; // actively planning
        else if (_faState === 'comfortable') _faChance -= 10; // doesn't feel the urgency
        else if (_faState === 'content') _faChance -= 5;
        if (_faS.loyalty >= 7) _faChance += 5; // loyal players want a group
        if (_faS.boldness >= 8) _faChance += 5; // bold players make moves
        if (_faS.boldness <= 3) _faChance -= 10; // passive players wait to be approached
        _faChance = Math.max(5, Math.min(85, _faChance)); // clamp 5-85%

        if (pctRoll(freeAgent + 'D' + ep.num) < _faChance) {
          const best = candidates[0];
          doRecruit(best.alliance, freeAgent, best.bestMember, 'free-agent');
        }
      }
    });

    // ── SCENARIO E: No alliances at all — force create one from the two closest players ──
    if (_activeAlliances.length === 0 && active.length >= 3) {
      let bestPair = null, bestBond = -Infinity;
      for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
          const b = getBond(active[i], active[j]);
          if (b > bestBond) { bestBond = b; bestPair = [active[i], active[j]]; }
        }
      }
      if (bestPair && bestBond > -1) {
        const allianceName = nameNewAlliance(2);
        gs.namedAlliances.push({
          id: `alliance_${Date.now()}_${Math.floor(Math.random()*1000)}`,
          name: allianceName,
          members: [...bestPair],
          formed: ep.num,
          betrayals: [],
          active: true,
        });
        addBond(bestPair[0], bestPair[1], 0.4);
        ep.allianceRecruits = ep.allianceRecruits || [];
        ep.allianceRecruits.push({ player: bestPair[1], toAlliance: allianceName, fromAlliance: null, scenario: 'emergency-pair' });
      }
    }

    // ── SCENARIO F+H+I moved to camp event allianceForm triggers (prevents double-firing) ──

    // ── SCENARIO G: Post-betrayal refuge — betrayed player recruited by rivals ──
    (ep.allianceQuits || []).forEach(({ player, alliance: quitAlliance }) => {
      if (!active.includes(player)) return;
      if (ep.allianceRecruits?.some(r => r.player === player)) return;
      // Find rival alliances that opposed the one they left
      const rivalAlliances = gs.namedAlliances.filter(a =>
        a.active && a.name !== quitAlliance && !a.members.includes(player) &&
        a.members.filter(m => active.includes(m)).length >= 2
      );
      rivalAlliances.forEach(rival => {
        const bestAnchor = rival.members.filter(m => active.includes(m)).sort((x,y) => getBond(player, y) - getBond(player, x))[0];
        if (!bestAnchor || getBond(player, bestAnchor) < 0) return;
        if (pctRoll(player + rival.name + 'G') >= 45) return; // ~45%
        doRecruit(rival, player, bestAnchor, 'post-betrayal');
      });
    });

    // ── SCENARIOS H+I: Power couple and idol shield now handled by camp event allianceForm triggers ──
  }
}

// ── Scenario-specific camp event text for recruitment ──
// Called from doRecruit's camp event injection — replaces generic text with scenario-aware narration
// The recruit and refusal sentences became scenes (td/script/lines/recruit.js).

// [1] PARANOIA SPIRAL — paranoid + strategic player turns on a real ally, creating a self-fulfilling prophecy.
// The ally was loyal. Now they might not be.
export function checkParanoiaSpiral(ep) {
  if (!ep.paranoiaSpirals) ep.paranoiaSpirals = [];
  const active = gs.activePlayers;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // Group by tribe (pre-merge) or merge
  const groups = gs.isMerged ? [{ name: 'merge', members: [...active] }] : gs.tribes;

  groups.forEach(tribe => {
    const members = tribe.members?.filter(m => active.includes(m)) || [];
    if (members.length < 3) return;

    // Find paranoid + strategic players
    const candidates = members.filter(p => {
      const em = gs.playerStates?.[p]?.emotional;
      if (em !== 'paranoid') return false;
      const s = pStats(p);
      // Proportional: strategic * 0.03 chance (stat 5=15%, stat 7=21%, stat 10=30%)
      return Math.random() < s.strategic * 0.03;
    });

    candidates.forEach(paranoid => {
      // Already spiraled this episode? One per player max
      if (ep.paranoiaSpirals.some(ps => ps.paranoid === paranoid)) return;

      const s = pStats(paranoid);
      const _pr = pronouns(paranoid);

      // Pick the target: their CLOSEST ally on the tribe — the person they should trust most
      // That's what makes paranoia devastating — it attacks the strongest bonds
      const allies = members.filter(p => p !== paranoid && getBond(paranoid, p) >= 2)
        .sort((a, b) => getBond(paranoid, b) - getBond(paranoid, a));
      if (!allies.length) return; // no allies to turn on
      const target = allies[0];
      const targetBond = getBond(paranoid, target);
      const _tPr = pronouns(target);

      // Bond damage — proportional to strategic (smarter paranoid players build more elaborate theories)
      const bondDrop = -(0.8 + s.strategic * 0.1); // stat 5: -1.3, stat 8: -1.6, stat 10: -1.8
      addBond(paranoid, target, bondDrop);
      // The target also loses trust — being accused when you're innocent creates distance
      addBond(target, paranoid, bondDrop * 0.6);

      // Flag the accused ally for vote nudge: they're now less likely to follow the paranoid player's plan
      // This is stored and read by simulateVotes — makes the self-fulfilling prophecy work
      if (!gs.paranoiaNudges) gs.paranoiaNudges = {};
      gs.paranoiaNudges[target] = { accusedBy: paranoid, ep: ep.num || (gs.episode || 0) + 1 };

      const campKey = gs.isMerged ? 'merge' : tribe.name;
      const spiralData = { paranoid, target, bondDrop, campKey };
      ep.paranoiaSpirals.push(spiralData);

      // Camp event — two tonal variants: confrontation (bold) vs quiet campaign (strategic)
      if (ep.campEvents?.[campKey]) {
        const block = ep.campEvents[campKey];
        const evts = Array.isArray(block) ? block : (block.pre || []);
        const isBold = s.boldness >= 6;
        Math.random(); // the draw that picked the sentence (the season must not move)
        // bold: to the ally's face. quiet: to someone else, about the ally (the closest other tribemate hears it)
        const _ear = members.filter(p => p !== paranoid && p !== target).sort((x, y) => getBond(paranoid, y) - getBond(paranoid, x) || x.localeCompare(y))[0];
        evts.push(scriptEvent({ type: 'paranoiaSpiral', players: [paranoid, target], badgeText: 'PARANOIA', badgeClass: 'red' },
          isBold || !_ear ? makeScene('drama.paranoia', { a: paranoid, b: target }, { ending: 'bold' }, [], _spotNow(paranoid, target))
            : makeScene('drama.paranoia', { a: paranoid, b: _ear }, { ending: 'quiet', target }, [], _spotNow(paranoid, _ear)), { ep: ep.num, phase: 'pre' }));
      }
    });
  });
}

// [4] INFORMATION BROKER — player in 2+ alliances with high social + low loyalty plays both sides.
// Intel from both alliances, bond boosts while active, escalating exposure risk per episode.
// Exposure: bond collapse with both alliances, heat spike, named exposer gets credit.
export function checkInformationBroker(ep) {
  const active = gs.activePlayers;
  const epNum = ep.num || (gs.episode || 0) + 1;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];

  if (!gs.broker) gs.broker = null;

  // ── PATH 1: No broker yet — check if one emerges ──
  if (!gs.broker) {
    // Once per game
    const activeAlliances = (gs.namedAlliances || []).filter(a => a.active && a.members.filter(m => active.includes(m)).length >= 2);
    if (activeAlliances.length < 2) return;

    for (const player of active) {
      const s = pStats(player);
      if (s.social < 5 || s.loyalty > 5) continue;
      const playerAlliances = activeAlliances.filter(a => a.members.includes(player));
      if (playerAlliances.length < 2) continue;

      // Proportional roll: social * 0.025 * (6 - loyalty) * 0.1
      const chance = s.social * 0.025 * (6 - s.loyalty) * 0.1;
      if (Math.random() >= chance) continue;

      // Broker emerges
      gs.broker = {
        player,
        alliances: playerAlliances.slice(0, 2).map(a => a.name),
        startEp: epNum,
        episodesActive: 0,
        exposed: false,
        exposedEp: null,
      };

      // Activation camp event
      const campKey = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(player))?.name || 'merge');
      if (ep.campEvents?.[campKey]) {
        const block = ep.campEvents[campKey];
        const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
        const _pr = pronouns(player);
        evts.push({ type: 'brokerConfidence', text: _pick([
          `${player} has ${_pr.posAdj} hands in two pots and nobody knows it yet. ${_pr.Sub} ${_pr.sub==='they'?'sit':'sits'} between two alliances, hearing everything, saying exactly what each side needs to hear. It's working. For now.`,
          `${player} knows what ${gs.broker.alliances[0]} is planning. ${player} also knows what ${gs.broker.alliances[1]} is planning. Neither group knows ${_pr.sub} ${_pr.sub==='they'?'know':'knows'} the other side's plan. That's the game ${_pr.sub}'s playing.`,
          `There's a version of this game where ${player} gets caught. But right now? Right now ${_pr.sub} ${_pr.sub==='they'?'have':'has'} more information than anyone else on this island. That's power.`,
        ]), players: [player] });
      }
      ep.brokerEvents = ep.brokerEvents || [];
      ep.brokerEvents.push({ type: 'activation', player });
      return; // one broker per game
    }
    return;
  }

  // ── PATH 2: Broker exists but already exposed — nothing to do ──
  if (gs.broker.exposed) return;

  // ── PATH 3: Broker is active — run per-episode effects ──
  const broker = gs.broker;
  const player = broker.player;
  if (!active.includes(player)) { broker.exposed = true; return; } // broker eliminated

  broker.episodesActive++;
  const s = pStats(player);
  const _pr = pronouns(player);
  const campKey = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(player))?.name || 'merge');
  ep.brokerEvents = ep.brokerEvents || [];

  // Gather all alliance members (excluding broker)
  const allianceMembers = new Set();
  broker.alliances.forEach(aName => {
    const alliance = (gs.namedAlliances || []).find(a => a.name === aName && a.active);
    if (alliance) alliance.members.filter(m => m !== player && active.includes(m)).forEach(m => allianceMembers.add(m));
  });

  // If both alliances dissolved, broker status ends quietly
  if (!allianceMembers.size) { broker.exposed = true; return; }

  // ── Intel gain: eavesdrop boost ──
  if (!gs.playerStates[player]) gs.playerStates[player] = {};
  gs.playerStates[player].eavesdropBoostThisEp = true;

  // ── Bond boost: +0.15 with all alliance members ──
  allianceMembers.forEach(m => addBond(player, m, 0.15));

  // ── Exposure check ──
  const baseRisk = broker.episodesActive * 0.08;
  const mergeSwapSpike = (ep.isMerge || ep.swapResult) ? 0.30 : 0;
  const exposureRisk = Math.min(0.85, baseRisk + mergeSwapSpike);

  // Detector: highest intuition among all alliance members
  let bestDetector = null, bestDetectorScore = 0;
  allianceMembers.forEach(m => {
    const score = pStats(m).intuition * 0.04 + pStats(m).mental * 0.015 + Math.random() * 0.1;
    if (score > bestDetectorScore) { bestDetectorScore = score; bestDetector = m; }
  });

  if (Math.random() < exposureRisk && bestDetector) {
    // ── EXPOSURE FIRES ──
    broker.exposed = true;
    broker.exposedEp = epNum;
    broker.exposer = bestDetector;

    // Bond collapse with all alliance members
    const bondHit = -(1.0 + broker.episodesActive * 0.4);
    allianceMembers.forEach(m => {
      addBond(player, m, bondHit);
    });

    // Light secondary hit between alliance members (-0.3 "how did we not see this")
    const memberArr = [...allianceMembers];
    for (let i = 0; i < memberArr.length; i++) {
      for (let j = i + 1; j < memberArr.length; j++) {
        addBond(memberArr[i], memberArr[j], -0.3);
      }
    }

    // Exposer bond boost
    allianceMembers.forEach(m => {
      if (m !== bestDetector) addBond(bestDetector, m, 0.5);
    });

    // Heat spike flag
    gs.brokerExposedHeat = player;
    gs.brokerExposedEp = epNum;

    // Camp events: exposure blowup (guaranteed)
    if (ep.campEvents?.[campKey]) {
      const block = ep.campEvents[campKey];
      const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
      const _dPr = pronouns(bestDetector);
      const isBoldDetector = pStats(bestDetector).boldness >= 6;

      // Event 1: The confrontation
      evts.push({ type: 'brokerExposed', text: _pick(isBoldDetector ? [
        `${bestDetector} stood up at camp and said it in front of everyone. "${player} has been playing both sides. ${gs.broker.alliances[0]} and ${gs.broker.alliances[1]}. Ask ${_pr.obj}." The silence that followed was worse than any argument.`,
        `${bestDetector} didn't wait for the right moment. ${_dPr.Sub} walked up to ${player} and laid it out: "You've been feeding ${gs.broker.alliances[0]} our plans and feeding us theirs. It's done." ${player} didn't deny it fast enough.`,
      ] : [
        `${bestDetector} pulled three people aside before ${player} woke up. By breakfast, everyone knew. ${player} walked into a camp that had already made up its mind.`,
        `It started with a question ${bestDetector} asked ${player} that didn't add up. Then another. Then ${bestDetector} went to ${gs.broker.alliances[0]} and asked what ${player} had told them. The story didn't match. It was over.`,
      ]), players: [bestDetector, player] });

      // Event 2: Fallout
      evts.push({ type: 'brokerFallout', text: _pick([
        `The camp split open. Not into new alliances — into silence. Nobody trusted anyone. ${player} did that. Even the people who weren't involved are recalculating.`,
        `${gs.broker.alliances[0]} and ${gs.broker.alliances[1]} spent the afternoon comparing notes. Every conversation ${player} had with either side — exposed. The betrayal wasn't the worst part. The worst part was how long it worked.`,
        `People are angry. Not screaming angry — the quiet kind. The kind where you don't talk to someone at camp and everybody notices.`,
      ]), players: [player] });

      // Event 3: Broker's defense
      const isBoldBroker = s.boldness >= 6;
      const isLowTemp = s.temperament <= 4;
      evts.push({ type: 'brokerDefense', text: _pick(isBoldBroker ? [
        `${player} didn't apologize. "I played the game. Both of you were using me too — you just didn't know I was using you back." The audacity almost earned respect. Almost.`,
        `"You can be mad," ${player} said. "But I had more information than anyone in this game for ${broker.episodesActive} episodes. That's not betrayal — that's strategy." Nobody agreed, but nobody could argue the math.`,
      ] : isLowTemp ? [
        `${player} tried to explain. It came out wrong. Then it came out worse. By the end, ${_pr.sub} ${_pr.sub==='they'?'were':'was'} sitting alone by the fire, and the explanation had turned into an apology nobody accepted.`,
        `The confrontation broke ${player}. Not strategically — emotionally. ${_pr.Sub} didn't have a speech prepared for this. ${_pr.Sub} just said "I'm sorry" and it wasn't enough.`,
      ] : [
        `${player} tried to reframe it. "I was keeping options open for all of us." The room didn't buy it. ${_pr.Sub} knew ${_pr.sub} ${_pr.sub==='they'?'were':'was'} done the moment ${bestDetector} opened ${pronouns(bestDetector).posAdj} mouth.`,
        `${player} went quiet after the confrontation. Not defeated — calculating. But the math has changed. The numbers aren't there anymore.`,
      ]), players: [player] });
    }

    ep.brokerExposure = { player, exposer: bestDetector, episodesActive: broker.episodesActive, bondHit, alliances: [...broker.alliances] };
    ep.brokerEvents.push({ type: 'exposed', player, exposer: bestDetector });
    return;
  }

  // ── Not exposed this episode — generate active-phase camp event (~60%) ──
  if (Math.random() < 0.60 && ep.campEvents?.[campKey]) {
    const block = ep.campEvents[campKey];
    const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
    const memberArr = [...allianceMembers];
    const randomAlly = memberArr[Math.floor(Math.random() * memberArr.length)];

    const eventRoll = Math.random();
    if (eventRoll < 0.25) {
      evts.push({ type: 'brokerWhisper', text: _pick([
        `${player} caught ${randomAlly} alone and dropped a name. "Watch out for that one. I've been hearing things." ${randomAlly} didn't question where the intel came from. That's the trick.`,
        `${player} slipped ${randomAlly} a piece of information that nobody else had. It was true. That's what makes ${player} dangerous — the lies are mixed in with just enough truth.`,
      ]), players: [player, randomAlly] });
      ep.brokerEvents.push({ type: 'whisper', player, target: randomAlly });
    } else if (eventRoll < 0.50) {
      const scapegoat = active.filter(p => p !== player && !allianceMembers.has(p))[0] || randomAlly;
      evts.push({ type: 'brokerManipulate', text: _pick([
        `${player} mentioned ${scapegoat}'s name in two separate conversations today — casually, but deliberately. By sunset, ${scapegoat} was a topic. ${player} wasn't.`,
        `Somebody asked who was running things. ${player} said nothing — but glanced at ${scapegoat}. The redirect was so smooth nobody noticed it was a redirect.`,
      ]), players: [player, scapegoat] });
      ep.brokerEvents.push({ type: 'manipulate', player, scapegoat });
    } else if (eventRoll < 0.75) {
      evts.push({ type: 'brokerConfidence', text: _pick([
        `${player} is ${broker.episodesActive} episodes into the double game and it's still holding. ${_pr.Sub} ${_pr.sub==='they'?'know':'knows'} what both sides are planning before they plan it. The question isn't whether it works — it's how long.`,
        `Confessional: "${_pr.Sub === 'They' ? 'I have' : 'I have'} two alliances. Two sets of plans. Two sets of trust. And neither one knows about the other. This is the best position in the game." — ${player}`,
      ]), players: [player] });
      ep.brokerEvents.push({ type: 'confidence', player });
    } else {
      evts.push({ type: 'brokerClose', text: _pick([
        `${randomAlly} asked ${player} a question today that came a little too close. "Who told you that?" ${player} deflected. ${randomAlly} let it go. But ${_pr.sub} won't forget the question.`,
        `There was a moment at camp where ${player}'s story didn't quite line up. ${randomAlly} noticed. ${player} noticed that ${randomAlly} noticed. Neither said anything. The clock is ticking.`,
      ]), players: [player, randomAlly] });
      ep.brokerEvents.push({ type: 'close', player, suspector: randomAlly });
    }
  }
}

// [5] STOLEN CREDIT — bold player takes public credit for another's big move
export function checkStolenCredit(ep) {
  // ── PHASE 1: Check for CONFRONTATION from previous episode's theft ──
  if (gs.stolenCredit && !gs.stolenCredit.confronted) {
    const { stealer, architect, ep: theftEp } = gs.stolenCredit;
    const currentEp = (gs.episode || 0) + 1;
    if (!gs.activePlayers.includes(stealer) || !gs.activePlayers.includes(architect)) {
      gs.stolenCredit.confronted = true; // one of them got eliminated, consume
    } else if (currentEp - theftEp >= 3) {
      gs.stolenCredit.confronted = true; // expired — architect let it go
    } else if (currentEp > theftEp) {
      // Confrontation roll
      const aS = pStats(architect);
      const aPr = pronouns(architect);
      const sPr = pronouns(stealer);
      const sS = pStats(stealer);
      const confrontChance = aS.boldness * 0.08 + (10 - aS.temperament) * 0.05;
      if (Math.random() < confrontChance) {
        // Confrontation fires
        const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+(gs.episode||0)*7)%arr.length];

        // Beat 1: The Callout (architect speaks)
        let calloutText;
        if (aS.temperament <= 4) {
          // Hothead — explosive
          calloutText = _pick([
            `${architect} snaps. It's been building since last tribal. "You sat there and did NOTHING and then you told everyone it was YOUR move? Say it to my face, ${stealer}. Say it right now." The camp goes dead silent.`,
            `${architect} doesn't plan it. It just comes out — right in the open, in front of three people. "You want to know who ACTUALLY flipped the vote? Because it wasn't ${stealer}. Ask me. Ask anyone who was actually paying attention." ${stealer} goes still.`,
            `${architect} explodes at the fire. "I am DONE watching ${stealer} walk around this camp like ${sPr.sub} ${sPr.sub==='they'?'run':'runs'} this game. That was MY move. MINE. And every single person here knows it." ${stealer} doesn't blink.`,
          ], architect + stealer + 'hothead');
        } else if (aS.boldness >= 7) {
          // Bold + composed — calculated confrontation
          calloutText = _pick([
            `${architect} pulls ${stealer} aside after the challenge. "We both know what happened at that tribal. You didn't orchestrate anything. I did. And if you keep telling people otherwise, I'll make sure the jury knows exactly who did what." It's not a threat. It's a promise.`,
            `${architect} waits until the right moment — when enough people are listening. "Hey ${stealer}, tell them again about how you planned the blindside. I love that story. Especially the part where I came to YOU with the plan." ${stealer}'s smile freezes.`,
            `${architect} corners ${stealer} at the water well. ${aPr.Sub} ${aPr.sub==='they'?'keep':'keeps'} ${aPr.pos} voice low but every word lands: "I know what you're doing. Taking credit for my game. It ends now — or I tell everyone exactly how that vote really went down."`,
          ], architect + stealer + 'bold');
        } else {
          // Emotional crack — wasn't planning to confront
          calloutText = _pick([
            `${architect} didn't mean to say anything. But sitting there listening to ${stealer} take credit one more time — something breaks. "That was MY move. You know it was my move. Why are you doing this?" The rawness catches everyone off guard.`,
            `It happens at the worst possible time — right before tribal. ${architect}'s voice cracks: "I just — I can't listen to this anymore. ${stealer} didn't do anything. I did. And I'm tired of pretending otherwise." The tribe freezes.`,
            `${architect} has been holding it in for days. ${aPr.Sub} finally ${aPr.sub==='they'?'break':'breaks'} at camp, voice shaking: "You took my move. You took the one thing I did in this game that mattered and you put your name on it. I can't just — I can't let that go."`,
          ], architect + stealer + 'emotional');
        }

        // Beat 2: The Response + Outcome
        const architectScore = aS.social + aS.strategic;
        const stealerScore = sS.social + sS.boldness;
        const architectWins = architectScore > stealerScore;

        let responseText;
        if (architectWins) {
          responseText = _pick([
            `${stealer} tries to laugh it off, but ${architect} has receipts. ${aPr.Sub} ${aPr.sub==='they'?'name':'names'} the conversation, the timing, the exact words. ${stealer} has nothing. The tribe watches ${stealer} shrink. Nobody believes ${sPr.pos} version anymore.`,
            `${stealer} starts to respond — and stops. There's nothing to say. ${architect} laid it out too clearly. The tribe exchanges looks. ${stealer}'s credibility just evaporated.`,
            `"That's not how it happened—" ${stealer} starts. ${architect} cuts ${sPr.obj} off with specifics: who said what, when, where. ${stealer} goes quiet. The silence is the verdict.`,
          ], architect + stealer + 'awin');
          // Architect reclaims partial credit
          const aState = gs.playerStates[architect] || {};
          aState.bigMoves = (aState.bigMoves || 0) + 0.5;
          gs.playerStates[architect] = aState;
          const sState = gs.playerStates[stealer] || {};
          sState.bigMoves = Math.max(0, (sState.bigMoves || 0) - 0.5);
          gs.playerStates[stealer] = sState;
          // Stealer loses face with witnesses
          const witnesses = gs.activePlayers.filter(p => p !== stealer && p !== architect).slice(0, 2);
          witnesses.forEach(w => addBond(w, stealer, -0.5));
          // Stealer gets heat
          gs.stolenCreditHeat = { player: stealer, ep: currentEp };
        } else {
          responseText = _pick([
            `${stealer} doesn't flinch. "${sPr.Sub} ${sPr.sub==='they'?'don\'t':'doesn\'t'} know what ${architect} is talking about. We all saw what happened. I'm sorry ${aPr.sub} ${aPr.sub==='they'?'feel':'feels'} that way." It's so smooth it almost sounds sincere. The tribe nods along. ${architect} looks like the petty one.`,
            `${stealer} turns it around: "If ${architect} really made that move, why didn't ${aPr.sub} say something at the time? Why now?" The tribe looks at ${architect}. ${aPr.Sub} ${aPr.sub==='they'?'have':'has'} no answer. ${stealer} walks away looking vindicated.`,
            `${stealer} sighs, shakes ${sPr.pos} head. "I'm not going to argue about who did what. The game speaks for itself." It's dismissive. It's condescending. And it works. ${architect} looks desperate.`,
          ], architect + stealer + 'swin');
          // Architect looks petty — loses MORE standing
          const aState = gs.playerStates[architect] || {};
          aState.bigMoves = Math.max(0, (aState.bigMoves || 0) - 0.5);
          gs.playerStates[architect] = aState;
          // Architect loses face with witnesses
          const witnesses = gs.activePlayers.filter(p => p !== stealer && p !== architect).slice(0, 2);
          witnesses.forEach(w => addBond(w, architect, -0.3));
        }

        // Both outcomes: additional bond damage
        addBond(architect, stealer, -1.0);
        gs.stolenCredit.confronted = true;

        // Push camp event
        const _campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(architect))?.name || 'merge');
        if (ep.campEvents?.[_campKey]) {
          const phase = ep.campEvents[_campKey].pre ? 'pre' : null;
          if (phase) {
            ep.campEvents[_campKey].pre.push({
              type: 'stolenCreditConfrontation',
              players: [architect, stealer],
              text: calloutText + ' ' + responseText,
              badgeText: architectWins ? 'CREDIT RECLAIMED' : 'CONFRONTATION FAILED',
              badgeClass: architectWins ? 'gold' : 'red',
            });
          }
        }
        // Save to episode history
        if (!ep.stolenCreditEvents) ep.stolenCreditEvents = [];
        ep.stolenCreditEvents.push({ type: 'confrontation', architect, stealer, architectWins, ep: currentEp });
      } else {
        // No confrontation — resentment simmers
        addBond(architect, stealer, -0.3);
      }
    }
    return; // Don't check for new theft in the same call as confrontation
  }

  // ── PHASE 2: Check for NEW theft ──
  if (gs.stolenCreditFired) return; // once per game
  const currentEp = (gs.episode || 0) + 1;
  if (currentEp < 2) return; // need at least one tribal

  // Check previous episode's bigMoves earners
  const architects = gs.bigMoveEarnersThisEp || [];
  gs.bigMoveEarnersThisEp = []; // consume
  if (!architects.length) return;

  for (const architect of architects) {
    if (!gs.activePlayers.includes(architect)) continue;
    const aS = pStats(architect);

    // Find potential stealer at same camp
    const campMembers = gs.isMerged
      ? gs.activePlayers
      : (gs.tribes.find(t => t.members.includes(architect))?.members || []);
    const candidates = campMembers.filter(p => {
      if (p === architect) return false;
      const s = pStats(p);
      if (s.boldness < 6) return false;
      // Not in strong alliance with architect
      const sharedAlliance = (gs.namedAlliances || []).find(a =>
        a.active !== false && a.members.includes(p) && a.members.includes(architect)
      );
      if (sharedAlliance && getBond(p, architect) >= 3) return false;
      return true;
    });
    if (!candidates.length) continue;

    // Pick best candidate: boldness * 0.6 + social * 0.4
    candidates.sort((a, b) => {
      const aScore = pStats(a).boldness * 0.6 + pStats(a).social * 0.4;
      const bScore = pStats(b).boldness * 0.6 + pStats(b).social * 0.4;
      return bScore - aScore;
    });
    const stealer = candidates[0];
    const sS = pStats(stealer);
    const sPr = pronouns(stealer);
    const aPr = pronouns(architect);

    // Roll
    const bond = getBond(stealer, architect);
    const chance = sS.boldness * 0.015 + (bond <= -1 ? 0.05 : 0);
    if (Math.random() >= chance) continue;

    // THEFT FIRES
    gs.stolenCreditFired = true;

    // bigMoves transfer
    const sState = gs.playerStates[stealer] || { emotional: 'content', votesReceived: 0, lastVotedEp: null, bigMoves: 0 };
    sState.bigMoves = (sState.bigMoves || 0) + 1;
    gs.playerStates[stealer] = sState;
    const aState = gs.playerStates[architect] || { emotional: 'content', votesReceived: 0, lastVotedEp: null, bigMoves: 0 };
    aState.bigMoves = Math.max(0, (aState.bigMoves || 0) - 1);
    gs.playerStates[architect] = aState;

    // Bond damage
    addBond(architect, stealer, -(1.5 + sS.boldness * 0.1));

    // State
    gs.stolenCredit = { stealer, architect, ep: currentEp, confronted: false };

    // Generate theft camp event text
    const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+(gs.episode||0)*7)%arr.length];

    let theftText;
    if (sS.boldness >= 8) {
      theftText = _pick([
        `${stealer} is holding court at the fire, retelling the blindside like ${sPr.sub} drew it up on a whiteboard. "I pulled them aside before tribal and told them exactly what was going to happen." ${architect} is sitting three feet away. ${aPr.Sub} didn't say a word.`,
        `${stealer} can't stop talking about last tribal. The story gets bigger every time ${sPr.sub} ${sPr.sub==='they'?'tell':'tells'} it. "That was the biggest move of the season and I'm not afraid to say I made it." ${architect} stares at the ground.`,
        `At the water well, ${stealer} is explaining the vote to anyone who'll listen. "I saw the opening and I took it. Simple as that." ${architect} was there. ${architect} MADE the opening. But ${stealer} is louder. And louder wins at camp.`,
      ], stealer + architect + 'shameless');
    } else {
      theftText = _pick([
        `${stealer} keeps saying "we" but meaning "I." Every time someone brings up last tribal, ${sPr.sub} ${sPr.sub==='they'?'steer':'steers'} the story. ${architect} notices. Everyone else doesn't.`,
        `It's subtle. ${stealer} doesn't outright claim the move — ${sPr.sub} just... positions ${sPr.ref} at the center of every retelling. "Yeah, I talked to them first, and then the rest of us got on board." ${architect} bites ${aPr.pos} tongue.`,
        `${stealer} drops it casually at dinner: "I've been thinking about this game strategically, and I think last tribal was my best move." ${architect} almost chokes on ${aPr.pos} rice. That was NOT ${stealer}'s move.`,
      ], stealer + architect + 'subtle');
    }

    // Architect reaction (brief — confrontation comes next episode)
    let reactionText;
    if (aS.temperament >= 7) {
      reactionText = _pick([
        `${architect} says nothing. But in confessional: "I'm watching someone take credit for MY move and I can't even—" ${aPr.Sub} stops. Breathes. "This isn't over."`,
        `${architect} keeps ${aPr.pos} face neutral. Inside, something is boiling. ${aPr.Sub} ${aPr.sub==='they'?'know':'knows'} the truth. The question is whether anyone else does.`,
      ], architect + 'composed');
    } else if (aS.temperament <= 4) {
      reactionText = _pick([
        `${architect}'s jaw clenches. ${aPr.Sub} ${aPr.sub==='they'?'stand':'stands'} up, ${aPr.sub==='they'?'walk':'walks'} away from the fire. Everyone notices. The tension is thick enough to cut.`,
        `${architect} slams something down and storms off alone. The tribe exchanges looks. Something just broke — they're just not sure what yet.`,
      ], architect + 'hothead');
    } else {
      reactionText = _pick([
        `${architect} forces a smile when ${stealer} retells the story. In confessional: "If ${stealer} wants to tell people ${sPr.sub} did that, fine. The jury will know the truth. I hope."`,
        `${architect} rolls ${aPr.pos} eyes and looks away. ${aPr.Sub} ${aPr.sub==='they'?'don\'t':'doesn\'t'} trust ${aPr.ref} to respond without losing it. Not yet. But soon.`,
      ], architect + 'mid');
    }

    // Push camp event
    const _campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(architect))?.name || 'merge');
    if (ep.campEvents?.[_campKey]) {
      const phase = ep.campEvents[_campKey].pre ? 'pre' : null;
      if (phase) {
        ep.campEvents[_campKey].pre.push({
          type: 'stolenCredit',
          players: [stealer, architect],
          text: theftText + ' ' + reactionText,
          badgeText: 'STOLEN CREDIT',
          badgeClass: 'gold',
        });
      }
    }

    // Save to episode history
    if (!ep.stolenCreditEvents) ep.stolenCreditEvents = [];
    ep.stolenCreditEvents.push({ type: 'theft', stealer, architect, ep: currentEp });

    break; // one theft per episode max
  }
}

// [2] SOCIAL BOMB / FAUX PAS — player with low temperament or high boldness says something
// that lands badly at camp. All tribemates take a bond hit (high-social players feel it more).
// Adds vote heat for that episode's tribal via gs.socialBombHeatThisEp.
export function checkSocialBomb(ep) {
  if (!ep.socialBombs) ep.socialBombs = [];
  const epSeed = ep.num * 17;
  const groups = gs.isMerged
    ? [{ members: [...gs.activePlayers], campKey: Object.keys(ep.campEvents)[0] }]
    : gs.tribes.filter(t => ep.campEvents[t.name])
        .map(t => ({ members: t.members.filter(m => gs.activePlayers.includes(m)), campKey: t.name }));

  groups.forEach(({ members, campKey }) => {
    if (!campKey || !ep.campEvents[campKey]) return;
    members.forEach(name => {
      if (ep.socialBombs.some(b => b.player === name)) return;
      const s = pStats(name);
      // Proportional: chance = inverse temperament + boldness
      const roll = ([...name].reduce((a, c) => a + c.charCodeAt(0), 0) + epSeed) % 100;
      const threshold = Math.round((10 - s.temperament) * 1.5 + s.boldness * 0.8); // temp 3 + bold 8 = 17%, temp 5 + bold 5 = 11.5%
      if (roll >= threshold) return;

      // Bond damage to all tribemates — high social = more offended
      const tribemates = members.filter(m => m !== name);
      tribemates.forEach(tm => {
        const tmS = pStats(tm);
        const dmg = -(0.5 + Math.max(0, (tmS.social - 5) * 0.2));
        addBond(name, tm, Math.max(-1.5, dmg));
      });

      // Vote heat for this episode's tribal
      if (!gs.socialBombHeatThisEp) gs.socialBombHeatThisEp = new Set();
      gs.socialBombHeatThisEp.add(name);
      if (!gs._blowupPlayers) gs._blowupPlayers = [];
      if (!gs._blowupPlayers.some(r => r.name === name)) gs._blowupPlayers.push({ name, type: 'bomb', target: null });

      // Tone: arrogant (bold) vs hothead (low temperament)
      const isArrogant = s.boldness >= 8;
      const prn = pronouns(name);
      const s3 = prn.sub === 'they';
      const hashBase = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
      // Reaction witness: the most-offended tribemate (highest social stat) clocks it
      const witness = tribemates.length
        ? tribemates.reduce((best, tm) => pStats(tm).social > pStats(best).social ? tm : best, tribemates[0])
        : null;
      const _tone = isArrogant ? 'arrogant' : 'hothead';
      const _bombEv = scriptEvent({ type: 'socialBomb', players: [name], badgeText: 'SOCIAL BOMB', badgeClass: 'red' },
        makeScene('drama.bomb', witness ? { a: name, b: witness } : { a: name }, { ending: _tone }, [], _spotNow(name, witness || null)));
      const text = _bombEv.text;
      // Record the actual narration so next episode's apology can link back to it
      const _bombRec = gs._blowupPlayers.find(r => r.name === name);
      if (_bombRec && !_bombRec.incident) _bombRec.incident = text;

      const _readEv = witness ? scriptEvent({ type: 'socialBombReaction', players: [witness, name], badgeText: 'NOTED', badgeClass: 'red' },
        makeScene('drama.read', { a: witness, b: name }, { ending: _tone }, [], { id: 'confessional', label: 'Confessional' })) : null;

      // Always inject into post events (fire during post-phase, show in "After The Challenge")
      const block = ep.campEvents[campKey];
      const arr = Array.isArray(block.post) ? block.post : block.pre;
      arr.push(_bombEv);
      if (_readEv) arr.push(_readEv);
      ep.socialBombs.push({ player: name, tribe: campKey, type: isArrogant ? 'arrogant' : 'hothead' });
    });
  });
}

// Goat targeting — two parts:
// Part 1 (merge): player with bombs >= 3 reaches merge → someone clocks them as a drag-along.
// Part 2 (late game, <= 9 left): a planner reassesses someone they actually
// intended to take, after the social/strategic evidence makes that read risky.
//   and starts mentally targeting them. Injects camp events + heat for next tribal.
export function checkGoatTargeting(ep) {
  if (!gs.isMerged || !gs.chalRecord) return;
  const campKey = Object.keys(ep.campEvents)[0];
  if (!campKey || !ep.campEvents[campKey]) return;
  const arr = ep.campEvents[campKey].post;
  const epSeed = ep.num * 29;
  const active = gs.activePlayers;
  if (!ep.goatEvents) ep.goatEvents = [];

  // ── PART 1: merge arrival — one consolidated strategic assessment ──
  if (ep.isMerge) {
    const goats = active.filter(name => {
      const rec = gs.chalRecord[name];
      return rec && rec.bombs >= 3 && !ep.goatEvents.some(g => g.player === name && g.type === 'mergeGoat');
    }).sort((a, b) => (gs.chalRecord[b]?.bombs || 0) - (gs.chalRecord[a]?.bombs || 0));
    if (goats.length) {
      const observers = active.filter(player => !goats.includes(player));
      const observerPool = observers.length ? observers : active.filter(player => player !== goats[0]);
      const observer = observerPool.length
        ? observerPool.reduce((best, player) => pStats(player).strategic > pStats(best).strategic ? player : best, observerPool[0])
        : null;
      const visible = goats.slice(0, 3);
      const names = visible.length === 1 ? visible[0]
        : visible.length === 2 ? `${visible[0]} and ${visible[1]}`
        : `${visible.slice(0, -1).join(', ')}, and ${visible.at(-1)}`;
      const remainder = goats.length - visible.length;
      // The strongest strategist sizes up the weakest challenge records at the merge, to the camera.
      const _goatScene = observer
        ? makeScene('goat.merge', { a: observer }, { ending: visible.length === 1 ? 'one' : 'many', goats: names, target: visible[0] }, [], { id: 'confessional', label: 'Confessional' })
        : null;
      const _goatEvt = { type: 'goatMergeAssessment', players: [...new Set([observer, ...visible].filter(Boolean))],
        candidates: [...goats], observer, badgeText: 'ENDGAME OPTIONS', badgeClass: 'gold' };
      arr.push(_goatScene ? scriptEvent(_goatEvt, _goatScene, { ep: ep.num, phase: 'pre' })
        : { ..._goatEvt, text: `${names} enter the merge with the weakest challenge records.` });
      goats.forEach(player => ep.goatEvents.push({ player, observer, type: 'mergeGoat', ep: ep.num }));
    }
    // Do not immediately repeat the same read as a late-game FTC reassessment.
    return;
  }

  // ── PART 2: FTC threat reassessment — late game only (9 or fewer left) ──
  if (active.length > 9) return;

  const goats = [...new Set(active.map(planner => getIntentions(planner)?.goat).filter(name => name && active.includes(name)))];
  if (!goats.length) return;

  goats.forEach(goat => {
    // Guard: each goat can only be re-assessed once per episode
    if (ep.goatEvents.some(g => g.player === goat && g.type === 'ftcThreat' && g.ep === ep.num)) return;

    // Only the contestant whose persistent plan named this person can have the
    // reassessment. A low challenge record alone no longer creates this story.
    const strategists = active.filter(p => p !== goat && getIntentions(p)?.goat === goat && pStats(p).strategic >= 5.5)
      .map(p => ({ player:p, read:evaluateEndgameBeatability(p, goat) }))
      .filter(x => x.read && (x.read.beatability < 6 || x.read.warnings?.length));
    if (!strategists.length) return;

    // Deterministic roll per goat per episode
    const hashBase = [...goat].reduce((a, c) => a + c.charCodeAt(0), 0);
    const roll = (hashBase + epSeed) % 100;
    if (roll >= 22) return;

    const picked = strategists.reduce((best, x) => x.read.beatability < best.read.beatability ? x : best, strategists[0]);
    const strategist = picked.player;
    const gPrn = pronouns(goat);
    const gs3 = gPrn.sub === 'they';
    const sPrn = pronouns(strategist);
    const ss3 = sPrn.sub === 'they';

    const evidenceLead = picked.read.warnings?.[0] || picked.read.reasons?.[0] || 'the FTC evidence no longer looks harmless';
    const ftcLines = [
      `${goat} looked beatable earlier. Now the read has changed: ${evidenceLead}. That is a problem.`,
      `${goat} look${gs3 ? '' : 's'} easy to beat on paper, but the evidence no longer supports treating ${gPrn.obj} as a guaranteed losing finalist.`,
      `Everyone's been treating ${goat} like a goat. But goats who make it deep don't need immunity wins. They need relationships. And ${gPrn.sub} ${gs3 ? 'have' : 'has'} those.`,
      `The challenge résumé is a distraction. ${goat} will sit in front of the jury, smile, and explain how ${gPrn.sub} played ${gPrn.posAdj} social game quietly for 30 days. And it'll work.`,
      `${goat} is the most dangerous person at this stage — not because ${gPrn.sub} ${gs3 ? 'win' : 'wins'} challenges, but because nobody's afraid of ${gPrn.obj}. Jury never hates someone they never feared.`,
      `${goat}'s challenge record was only one part of the original read. The jury and strategic résumé are now telling a less comfortable story.`,
    ];
    const strategistLines = [
      `${strategist} recalculate${ss3 ? '' : 's'}. ${gPrn.Sub} ${gs3 ? 'weren\'t' : 'wasn\'t'} supposed to be a concern. Now ${sPrn.sub} ${ss3 ? 'aren\'t' : 'isn\'t'} sure anymore.`,
      `${strategist} run${ss3 ? '' : 's'} the jury math in ${sPrn.posAdj} head and land${ss3 ? '' : 's'} somewhere uncomfortable. ${goat}'s name is near the top now.`,
      `${strategist} ha${ss3 ? 've' : 's'} been sleeping on ${goat}. ${sPrn.Sub} ${ss3 ? 'aren\'t' : 'isn\'t'} anymore.`,
      `${strategist} start${ss3 ? '' : 's'} asking around about ${goat} quietly — not loudly, not yet. Just testing whether other people see what ${sPrn.sub} ${ss3 ? 'see' : 'sees'}.`,
    ];

    const hashBase2 = [...strategist].reduce((a, c) => a + c.charCodeAt(0), 0);
    const ftcText  = ftcLines[(hashBase + epSeed * 3) % ftcLines.length];
    const stratText = strategistLines[(hashBase2 + epSeed * 11) % strategistLines.length];

    arr.push({ type: 'ftcThreatAlert',   text: ftcText,  players: [goat] });
    arr.push({ type: 'ftcThreatStrategist', text: stratText, players: [strategist, goat] });

    // Bump vote heat for next tribal — strategist is now mentally targeting this goat
    if (!gs.blowupHeatNextEp) gs.blowupHeatNextEp = new Set();
    gs.blowupHeatNextEp.add(goat);

    ep.goatEvents.push({ player: goat, strategist, type: 'ftcThreat', ep: ep.num });
  });
}

export function checkAllianceQuitting(ep) {
  if (!gs.namedAlliances?.length) return;
  gs.namedAlliances.forEach(alliance => {
    if (!alliance.active) return;
    const activeMembers = alliance.members.filter(m => gs.activePlayers.includes(m));
    [...activeMembers].forEach(member => {
      const s = pStats(member);
      const allies = activeMembers.filter(m => m !== member);
      if (!allies.length) return;
      // Average bond with alliance members
      const avgBond = allies.reduce((sum, m) => sum + getBond(member, m), 0) / allies.length;
      const wasBetrayed = alliance.betrayals?.some(b => b.votedFor === member);
      // Tribe split: member is on a different tribe from the majority of their alliance
      let isSplit = false;
      if (gs.phase === 'pre-merge' && gs.tribes.length) {
        const memberTribe = gs.tribes.find(t => t.members.includes(member))?.name;
        const allyTribeNames = allies.map(m => gs.tribes.find(t => t.members.includes(m))?.name).filter(Boolean);
        const majorityTribe = allyTribeNames.sort((a, b) =>
          allyTribeNames.filter(t => t === b).length - allyTribeNames.filter(t => t === a).length
        )[0];
        isSplit = !!(memberTribe && majorityTribe && memberTribe !== majorityTribe);
      }
      // Quit chance: bad bonds, low loyalty, high boldness, betrayal, tribe split
      const splitBonus = isSplit ? Math.max(0, 0.08 + (s.boldness - 5) * 0.015 + (5 - s.loyalty) * 0.015) : 0;
      const quitChance = Math.max(0,
        (avgBond < 0 ? -avgBond * 0.08 : 0)
        + (s.boldness - 5) * 0.015
        + (5 - s.loyalty) * 0.02
        + (wasBetrayed ? 0.2 : 0)
        + splitBonus
        + 0.015
      );
      if (Math.random() < quitChance) {
        const reason = wasBetrayed ? 'betrayed by alliance member'
          : isSplit ? 'tribe split — drifted away on separate tribe'
          : avgBond < -1 ? 'relationship breakdown'
          : (s.strategic >= 7 && s.loyalty <= 4 && Math.random() < 0.55) ? 'strategic pivot'
          : 'went solo';
        alliance.members = alliance.members.filter(m => m !== member);
        alliance.quits = alliance.quits || [];
        alliance.quits.push({ player: member, ep: ep.num, reason });
        if (alliance.members.filter(m => gs.activePlayers.includes(m)).length < 2) alliance.active = false;
        ep.allianceQuits = ep.allianceQuits || [];
        ep.allianceQuits.push({ player: member, alliance: alliance.name, reason });
        // Inject a camp event so the VP shows HOW and WHY the quit happened
        const _qTribeName = gs.isMerged ? 'merge'
          : gs.tribes.find(t => t.members.includes(member))?.name;
        if (_qTribeName && ep.campEvents?.[_qTribeName]) {
          Math.random(); // the draw that picked the sentence (the season must not move)
          const _qEnding = { 'betrayed by alliance member': 'betrayed', 'tribe split — drifted away on separate tribe': 'split',
            'relationship breakdown': 'breakdown', 'strategic pivot': 'pivot', 'went solo': 'solo' }[reason] || 'solo';
          const _qBlock = ep.campEvents[_qTribeName];
          (_qBlock.post?.length >= 0 ? _qBlock.post : _qBlock.pre).push(scriptEvent(
            { type: 'allianceCrack', players: [member], badgeText: 'WALKED AWAY', badgeClass: 'red' },
            makeScene('alliance.quit', { a: member }, { ending: _qEnding, group: alliance.name }, [], { id: 'confessional', label: 'Confessional' }),
            { ep: ep.num, phase: 'post' }));
        }
      }
    });
  });
}

// phase: 'pre' (before challenge), 'post' (after challenge result known), 'both' (no-tribal/finale)
// How much each archetype resists romantic entanglement
export const SHOWMANCE_ARCHETYPE_MULT = {
  'showmancer':        2.5,  // built for this
  'social-butterfly':  0.70, // warm but not specifically romantic
  'underdog':          0.75, // genuine connections happen, but rare
  'wildcard':          0.75, // unpredictable — could go either way
  'hothead':           0.40, // intense but burns fast, not deep romance
  'goat':              0.45, // low social skills reduce the odds
  'chaos-agent':       0.35, // uses relationships as tools, doesn't feel them
  'floater':           0.30, // avoids any visible entanglement
  'perceptive-player': 0.30, // knows a showmance is a liability, actively avoids it
  'loyal-soldier':     0.25, // loyalty is to the alliance, not a person
  'schemer':           0.20, // relationships are instruments, not feelings
  'mastermind':        0.15, // too calculated to let emotion in
  'challenge-beast':   0.15, // focused on winning, not bonding
};

// Helper: check if a player is in any active showmance

// [6] FALSE IDOL PLANT — strategic player crafts and plants a fake idol
export function checkFakeIdolPlant(ep) {
  if (gs.fakeIdolPlanted) return; // once per game
  const epNum = (gs.episode || 0) + 1;
  if (epNum < 3) return; // too early — nobody's searching yet

  const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+epNum*7)%arr.length];

  // Find potential planters: strategic >= 7, being targeted (heat >= 3)
  const _campMembers = gs.isMerged ? gs.activePlayers : (gs.tribes.flatMap(t => t.members).filter(m => gs.activePlayers.includes(m)));
  const _planters = _campMembers.filter(name => {
    const s = pStats(name);
    if (s.strategic < 7) return false;
    const heat = computeHeat(name, _campMembers, gs.namedAlliances || []);
    if (heat < 3) return false;
    return true;
  });
  if (!_planters.length) return;

  // Roll for each potential planter: strategic * 0.015 + boldness * 0.01
  for (const planter of _planters) {
    const pS = pStats(planter);
    const pPr = pronouns(planter);
    if (Math.random() >= pS.strategic * 0.015 + pS.boldness * 0.01) continue;

    // FAKE IDOL PLANT FIRES
    gs.fakeIdolPlanted = true;
    const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(planter))?.name || 'merge');

    // ── ARC 1: Planter caught crafting? ──
    const _witnesses = _campMembers.filter(p => p !== planter);
    const _caughtBy = _witnesses.find(w => Math.random() < pStats(w).intuition * 0.03 + pStats(w).mental * 0.01);
    if (_caughtBy) {
      // Exposed — no fake idol enters the game
      addBond(_caughtBy, planter, -1.0);
      _witnesses.filter(w => w !== _caughtBy).forEach(w => addBond(w, planter, -0.3));
      if (!gs.challengeThrowHeat) gs.challengeThrowHeat = {};
      // Reuse heat mechanism — schemer exposed

      if (ep.campEvents?.[campKey]) {
        (ep.campEvents[campKey].pre || ep.campEvents[campKey].post || []).push(scriptEvent(
          { type: 'fakeIdolCaught', players: [_caughtBy, planter], badgeText: 'FAKE IDOL EXPOSED', badgeClass: 'red' },
          makeScene('adv.fakecaught', { a: _caughtBy, b: planter }, {}, [], spotOf(ep, _caughtBy, planter, 'pre').spot),
          { ep: ep.num, phase: 'pre' }));
      }
      if (!ep.fakeIdolEvents) ep.fakeIdolEvents = [];
      ep.fakeIdolEvents.push({ arc: 'caught-crafting', planter, caughtBy: _caughtBy });
      return;
    }

    // ── ARC 2-4: Fake idol successfully planted ──
    // Find the victim — target based on planter's lowest bond (enemy) who searches
    const _searchers = _campMembers.filter(p => p !== planter && pStats(p).intuition >= 4);
    // Targeted victim: planter's enemy or the person the planter most wants to deceive
    let victim;
    const _enemies = _campMembers.filter(p => p !== planter && getBond(planter, p) <= -1)
      .sort((a, b) => getBond(planter, a) - getBond(planter, b));
    if (_enemies.length && _searchers.some(s => _enemies.includes(s))) {
      victim = _enemies.find(e => _searchers.includes(e)) || _enemies[0];
    } else if (_searchers.length) {
      victim = _searchers[Math.floor(Math.random() * _searchers.length)];
    } else {
      victim = _campMembers.filter(p => p !== planter)[0];
    }
    if (!victim) return;

    const vPr = pronouns(victim);
    const vS = pStats(victim);

    // Plant the fake idol as an advantage with fake flag
    gs.advantages.push({ holder: victim, type: 'idol', fake: true, plantedBy: planter, foundEp: epNum });

    // Camp event: victim finds the "idol" — they're excited
    const _findText = _pick([
      `${victim} finds something buried near the tree mail. ${vPr.Sub} ${vPr.sub==='they'?'unwrap':'unwraps'} it with shaking hands — it looks like a Hidden Immunity Idol. ${vPr.Sub} ${vPr.sub==='they'?'can\'t':'can\'t'} believe it. "${vPr.Sub === 'They' ? 'We found' : 'I found'} an idol." ${planter} watches from across camp. ${pPr.Sub} ${pPr.sub==='they'?'say':'says'} nothing.`,
      `${victim} stumbles onto something half-buried near the water well. It's wrapped in a leaf with a note: "This is a Hidden Immunity Idol." ${vPr.Sub} ${vPr.sub==='they'?'tuck':'tucks'} it away before anyone sees. But ${planter} already knows — because ${pPr.sub} put it there.`,
      `${victim} has been searching for days. Today, ${vPr.sub} finally ${vPr.sub==='they'?'find':'finds'} it — or what ${vPr.sub} ${vPr.sub==='they'?'think':'thinks'} is it. An idol. The relief on ${vPr.pos} face is real. The idol is not.`,
    ], victim + planter + 'find');

    if (ep.campEvents?.[campKey]) {
      (ep.campEvents[campKey].pre || ep.campEvents[campKey].post || []).push({
        type: 'fakeIdolFound', players: [victim], text: _findText,
        badgeText: 'IDOL FOUND', badgeClass: 'gold', // looks real to the viewer at this point? No — viewer should know
      });
      // Also show the planter's satisfaction (viewer knows it's fake)
      (ep.campEvents[campKey].pre || ep.campEvents[campKey].post || []).push({
        type: 'fakeIdolPlanted', players: [planter], text: _pick([
          `${planter} to confessional: "That idol ${victim} just found? I made it. Last night. Coconut shell, string, and a prayer. If ${vPr.sub} ${vPr.sub==='they'?'play':'plays'} it at tribal — and ${vPr.sub} will — the look on ${vPr.pos} face will be worth more than any real idol."`,
          `${planter} watches ${victim} celebrate the find from across camp. ${pPr.Sub} almost ${pPr.sub==='they'?'feel':'feels'} bad. Almost. "That's not an idol. That's a death sentence wrapped in a leaf."`,
        ], planter + 'satisfaction'),
        badgeText: 'FAKE IDOL PLANTED', badgeClass: 'red',
      });
    }

    // ── ARC 3: Tip-off check — can someone warn the victim? ──
    // Players who are close to the victim AND perceptive might notice something is off
    const _tipOffers = _campMembers.filter(p => p !== planter && p !== victim && getBond(p, victim) >= 2);
    const _tipOff = _tipOffers.find(t => Math.random() < pStats(t).intuition * 0.035 + getBond(t, victim) * 0.02);

    if (_tipOff) {
      // Someone warns the victim — fake idol exposed before tribal
      const tPr = pronouns(_tipOff);
      gs.advantages = gs.advantages.filter(a => !(a.fake && a.holder === victim && a.plantedBy === planter));
      addBond(victim, _tipOff, 1.0); // gratitude
      addBond(victim, planter, -2.0); // betrayal
      addBond(_tipOff, planter, -0.5); // suspicion confirmed

      // Store tip-off for next-episode camp event (confrontation happens after they verify)
      gs.fakeIdolTipOff = { victim, tipOffer: _tipOff, planter, ep: epNum };
    }

    if (!ep.fakeIdolEvents) ep.fakeIdolEvents = [];
    ep.fakeIdolEvents.push({
      arc: _tipOff ? 'tipped-off' : 'planted',
      planter, victim, tippedOffBy: _tipOff || null,
    });
    return; // one fake idol per game
  }
}

// Fake idol tip-off confrontation — fires next episode if someone warned the victim
export function generateFakeIdolTipOffEvents(ep) {
  if (!gs.fakeIdolTipOff) return;
  const { victim, tipOffer, planter, ep: tipEp } = gs.fakeIdolTipOff;
  if ((gs.episode || 0) + 1 <= tipEp) return; // wait for next episode
  gs.fakeIdolTipOff = null; // consume

  if (!gs.activePlayers.includes(victim) || !gs.activePlayers.includes(planter)) return;

  const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+(gs.episode||0)*7)%arr.length];
  const vPr = pronouns(victim);
  const pPr = pronouns(planter);
  const vS = pStats(victim);

  const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(victim))?.name || 'merge');
  if (!ep.campEvents?.[campKey]) return;

  // Confrontation — personality-driven
  let confrontText;
  if (vS.temperament <= 4 || vS.boldness >= 7) {
    confrontText = _pick([
      `${victim} holds up the fake idol in front of the tribe. "This is what ${planter} thinks of me. A FAKE. ${pPr.Sub} planted this hoping I'd humiliate myself at tribal." ${victim} throws it in the fire. ${planter} doesn't deny it.`,
      `${victim} walks straight up to ${planter}. "You made this." ${vPr.Sub} ${vPr.sub==='they'?'hold':'holds'} up the fake idol. "You thought I was stupid enough to play this." ${planter}: "I thought you were desperate enough." The camp goes nuclear.`,
    ], victim + planter + 'confrontBold');
  } else if (vS.strategic >= 7) {
    confrontText = _pick([
      `${victim} doesn't confront ${planter} publicly. Instead, ${vPr.sub} quietly ${vPr.sub==='they'?'show':'shows'} the fake to two allies. "This is what we're dealing with. ${planter} is playing dirty." The fake becomes ammunition — not for tribal, but for the social game.`,
      `${victim} to confessional: "${tipOffer} warned me. The idol is fake — ${planter} made it. I'm not going to blow up at camp. I'm going to use this information when it matters most. ${planter} doesn't know I know. And that's power."`,
    ], victim + planter + 'confrontStrat');
  } else {
    confrontText = _pick([
      `${victim} sits by the fire holding the fake idol. ${vPr.Sub} ${vPr.sub==='they'?'know':'knows'} now. ${tipOffer} told ${vPr.obj} everything. The hurt on ${vPr.pos} face isn't anger — it's disbelief. "I actually believed it was real. I was so happy." ${vPr.Sub} ${vPr.sub==='they'?'drop':'drops'} it in the dirt.`,
      `${victim} doesn't say anything to ${planter}. But ${vPr.sub} ${vPr.sub==='they'?'stop':'stops'} talking to ${pPr.obj}. ${vPr.Sub} ${vPr.sub==='they'?'stop':'stops'} making eye contact. The silence is the punishment. Everyone notices. Nobody asks why.`,
    ], victim + planter + 'confrontEmotional');
  }

  (ep.campEvents[campKey].pre || []).push({
    type: 'fakeIdolConfrontation', players: [victim, planter, tipOffer],
    text: `${tipOffer} pulled ${victim} aside last night. "That idol you found? I don't think it's real. I saw ${planter} working on something." ${victim} checked. ${tipOffer} was right. ` + confrontText,
    badgeText: 'FAKE IDOL', badgeClass: 'red',
  });
}

// Black Vote guess events — players speculate about who received the black vote
export function generateBlackVoteGuessEvents(ep) {
  if (!gs.blackVotes?.length && !ep.blackVoteApplied) return;
  if (seasonConfig.blackVote === 'off' || !seasonConfig.blackVote) return;

  const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+(gs.episode||0)*7)%arr.length];

  // Who knows there's a black vote in play? Everyone — it's a known rule.
  // But who received it is secret. Players try to guess.
  const _pendingBVs = gs.blackVotes?.filter(bv => bv.type === 'classic' && gs.activePlayers.includes(bv.target)) || [];
  if (!_pendingBVs.length) return;

  const _bv = _pendingBVs[0]; // the active black vote
  const _realTarget = _bv.target;
  const _from = _bv.from;

  // Each strategic/intuitive player guesses who got the black vote
  const _guessers = gs.activePlayers.filter(p => {
    const s = pStats(p);
    return (s.strategic >= 5 || s.intuition >= 6) && Math.random() < s.strategic * 0.04 + s.intuition * 0.03;
  });

  if (!_guessers.length) return;

  const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(_guessers[0]))?.name || 'merge');
  if (!ep.campEvents?.[campKey]) return;

  _guessers.forEach(guesser => {
    const gS = pStats(guesser);
    const gPr = pronouns(guesser);

    // Correct guess? proportional to intuition
    const _guessCorrect = Math.random() < gS.intuition * 0.08; // intuition 7 = 56%, intuition 3 = 24%
    const _guessedTarget = _guessCorrect ? _realTarget
      : gs.activePlayers.filter(p => p !== guesser).sort((a, b) => getBond(_from, a) - getBond(_from, b))[0]; // wrong guess — picks someone with bad bond to the eliminated

    if (!_guessedTarget) return;

    // Heat consequences of the guess
    if (!_guessCorrect) {
      // Wrong guess — heat on the wrong person
      // Other players who hear this might pile on
      if (Math.random() < 0.4) {
        if (!gs.blackVoteGuessHeat) gs.blackVoteGuessHeat = {};
        gs.blackVoteGuessHeat[_guessedTarget] = (gs.episode || 0) + 1;
      }
    }

    const _guessText = _pick([
      `${guesser} pulls someone aside. "I've been thinking about ${_from}'s Black Vote. I think ${gPr.sub} ${gPr.sub==='they'?'sent':'sent'} it to ${_guessedTarget}." ${_guessCorrect ? 'The read is correct — but nobody can confirm it.' : 'The read is wrong. But nobody knows that yet.'}`,
      `${guesser} to confessional: "Who did ${_from} target with the Black Vote? ${gS.intuition >= 7 ? `My gut says ${_guessedTarget}. ${_from} never trusted ${pronouns(_guessedTarget).obj}.` : `I have no idea. But if I had to guess... ${_guessedTarget}. ${_from} would want to hurt ${pronouns(_guessedTarget).obj} one last time.`}"`,
      `At camp, ${guesser} brings it up: "We need to talk about the Black Vote. ${_from} is gone but ${pronouns(_from).pos} vote isn't. I think it's on ${_guessedTarget}." The tribe considers this. ${_guessCorrect ? 'They should — because it\'s right.' : 'They shouldn\'t — because it\'s wrong.'}`,
    ], guesser + _guessedTarget + 'bvguess');

    (ep.campEvents[campKey].pre || []).push({
      type: 'blackVoteGuess', players: [guesser, _guessedTarget],
      text: _guessText,
      badgeText: _guessCorrect ? 'CORRECT READ' : 'WRONG READ',
      badgeClass: _guessCorrect ? 'gold' : 'red',
    });
  });
}


// ── Showmance Lifecycle: phase progression + events each episode ──

// ── Showmance Test: fires when a partner is the top vote target at tribal ──

// ── Showmance Breakup: detect when one partner votes out the other ──

// ── Love Triangle Breakup: resolve when any member is eliminated ──

// ── Love Triangle Detection: dual-showmance or one-sided crush ──


// ── Secret Affair Lifecycle: exposure tier progression each episode ──

// ── Affair Resolution: the confrontation and choice ──

export function checkIdolConfessions(ep) {
  if (!gs.advantages?.length) return;
  if (!gs.knownIdolHoldersThisEp) gs.knownIdolHoldersThisEp = new Set();
  ep.idolConfessions = ep.idolConfessions || [];
  ep.idolBetrayals   = ep.idolBetrayals   || [];

  const idolHolders = gs.advantages.filter(a => a.type === 'idol' && gs.activePlayers.includes(a.holder));
  idolHolders.forEach(adv => {
    const holder = adv.holder;
    const s = pStats(holder);
    // Confession chance: social + bold players talk; high loyalty keeps secrets
    // Strategic players are more deliberate — they confess less randomly but more purposefully
    const _stratPenalty = -(s.strategic * 0.007); // proportional: stat 5=-0.035, stat 10=-0.07
    const confChance = Math.max(0.03, Math.min(0.28, 0.03 + s.social * 0.015 + s.boldness * 0.01 - s.loyalty * 0.008 + _stratPenalty));
    if (Math.random() >= confChance) return;

    // Find best ally on same tribe with bond >= 2
    const tribeMembers = gs.isMerged
      ? gs.activePlayers.filter(p => p !== holder)
      : (gs.tribes.find(t => t.members.includes(holder))?.members || []).filter(p => p !== holder);
    // Strategic players pick confidants smarter — they factor in the person's loyalty stat
    // (less likely to pick a leaky low-loyalty player as their confidant)
    const allies = tribeMembers
      .map(p => ({ name: p, bond: getBond(holder, p), trustScore: getBond(holder, p) + s.strategic * 0.04 * pStats(p).loyalty }))
      .filter(x => x.bond > 0)
      .sort((a, b) => b.trustScore - a.trustScore);
    if (!allies.length) return;

    const confidant = allies[0].name;
    ep.idolConfessions.push({ holder, confidant });

    const _pr = pronouns(holder);
    const confLines = [
      `${holder} pulled ${confidant} aside after everyone else had gone to sleep. ${_pr.Sub} trusted ${confidant} with something ${_pr.sub} hadn't told anyone else.`,
      `${holder} needed to tell someone. ${confidant} was the one ${_pr.sub} trusted most out here. That trust might have a price.`,
      `In the dark, ${holder} leaned close and told ${confidant} what was in ${_pr.posAdj} bag. It felt like the right call at the time.`,
    ];
    const confEvt = { type: 'idolConfession', text: confLines[Math.floor(Math.random() * confLines.length)] };

    const tribeName = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(holder))?.name);
    if (tribeName && ep.campEvents?.[tribeName]) {
      const campBlock = ep.campEvents[tribeName];
      (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(confEvt);
    }

    // Roll betrayal: low loyalty, low bond with holder, or rival alliance pressure
    const cs = pStats(confidant);
    const bondVal = getBond(confidant, holder);
    const rivalAlliance = (gs.namedAlliances || []).find(a => a.active && a.members.includes(confidant) && !a.members.includes(holder));
    const betrayChance = Math.max(0.05, Math.min(0.45,
      0.05 + (10 - cs.loyalty) * 0.025 + (5 - Math.max(-5, Math.min(5, bondVal))) * 0.02 + (rivalAlliance ? 0.15 : 0)
    ));
    if (Math.random() >= betrayChance) return;

    // Betrayal fires
    ep.idolBetrayals.push({ holder, betrayer: confidant });
    gs.knownIdolHoldersThisEp.add(holder);
    recordIdolIntel(confidant, holder, { source:'betrayed confidence', confidence:0.95, truth:'confirmed' });
    addBond(confidant, holder, -1.5);

    const betrayLines = [
      `${confidant} didn't sleep after that conversation. By morning, the information had moved.`,
      `${confidant} thought about it for hours. By the time the sun came up, a decision had been made — one that ${holder} doesn't know about yet.`,
      `The secret lasted until ${confidant} found someone who needed to hear it.`,
    ];
    const betrayEvt = { type: 'idolBetrayal', text: betrayLines[Math.floor(Math.random() * betrayLines.length)] };
    if (tribeName && ep.campEvents?.[tribeName]) {
      const campBlock = ep.campEvents[tribeName];
      (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(betrayEvt);
    }
  });
}

// ── Team Swap confession: holder confides in closest ally about the Team Swap advantage ──
export function checkTeamSwapConfessions(ep) {
  const tsHolders = (gs.advantages || []).filter(a => a.type === 'teamSwap' && gs.activePlayers.includes(a.holder));
  if (!tsHolders.length || !ep.campEvents) return;
  if (!gs.knownTeamSwapHolders) gs.knownTeamSwapHolders = new Set();

  tsHolders.forEach(adv => {
    const holder = adv.holder;
    const s = pStats(holder);
    // ~15% chance, proportional to social
    const confChance = s.social * 0.03;
    if (Math.random() >= confChance) return;

    // Find best ally on same tribe with bond >= 2
    const tribeMembers = gs.isMerged
      ? gs.activePlayers.filter(p => p !== holder)
      : (gs.tribes.find(t => t.members.includes(holder))?.members || []).filter(p => p !== holder);
    const allies = tribeMembers
      .map(p => ({ name: p, bond: getBond(holder, p) }))
      .filter(x => x.bond >= 2)
      .sort((a, b) => b.bond - a.bond);
    if (!allies.length) return;

    const confidant = allies[0].name;
    gs.knownTeamSwapHolders.add(holder);
    addBond(holder, confidant, 0.3); // trust gesture

    const _pr = pronouns(holder);
    const confLines = [
      `${holder} pulled ${confidant} aside. ${_pr.Sub} showed ${confidant} the Team Swap — the power to move someone between tribes. ${confidant}'s eyes widened. That kind of trust doesn't come cheap.`,
      `${holder} needed someone to know. ${_pr.Sub} told ${confidant} about the Team Swap. If things go south, ${_pr.sub} ${_pr.sub === 'they' ? 'have' : 'has'} an exit strategy — and now ${confidant} knows it too.`,
      `In a quiet moment, ${holder} confided in ${confidant} about the Team Swap. It felt like the right move — sharing the weight of that kind of power.`,
    ];
    const confEvt = { type: 'teamSwapConfession', players: [holder, confidant],
      text: confLines[Math.floor(Math.random() * confLines.length)] };

    const tribeName = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(holder))?.name);
    if (tribeName && ep.campEvents?.[tribeName]) {
      const campBlock = ep.campEvents[tribeName];
      (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(confEvt);
    }
  });
}

export function checkSafetyNoPowerConfessions(ep) {
  const holders = (gs.advantages || []).filter(a => a.type === 'safetyNoPower' && gs.activePlayers.includes(a.holder));
  if (!holders.length || !ep.campEvents) return;
  if (!gs.knownSafetyNoPowerHolders) gs.knownSafetyNoPowerHolders = new Set();

  holders.forEach(adv => {
    const holder = adv.holder;
    const s = pStats(holder);
    const confChance = s.social * 0.03;
    if (Math.random() >= confChance) return;

    const tribeMembers = gs.isMerged
      ? gs.activePlayers.filter(p => p !== holder)
      : (gs.tribes.find(t => t.members.includes(holder))?.members || []).filter(p => p !== holder);
    const allies = tribeMembers
      .map(p => ({ name: p, bond: getBond(holder, p) }))
      .filter(x => x.bond >= 2)
      .sort((a, b) => b.bond - a.bond);
    if (!allies.length) return;

    const confidant = allies[0].name;
    gs.knownSafetyNoPowerHolders.add(holder);
    addBond(holder, confidant, 0.3);

    const _pr = pronouns(holder);
    const confLines = [
      `${holder} pulled ${confidant} aside. "I found something. If things go bad, I can leave tribal. Just... walk out." ${confidant} stared. "And your vote?" ${holder} shrugged. "Gone."`,
      `${holder} told ${confidant} about the Safety Without Power. An escape route — but it means abandoning the vote. ${confidant} didn't say much. The weight of it sat between them.`,
      `In a quiet moment, ${holder} confided in ${confidant}. "I have a way out. But if I use it, you're on your own at tribal." ${confidant} nodded slowly. That kind of honesty costs something.`,
    ];
    const _seed = [...(holder+confidant)].reduce((s, c) => s + c.charCodeAt(0), 0);
    const confEvt = { type: 'safetyNoPowerConfession', players: [holder, confidant],
      text: confLines[_seed % confLines.length] };

    const tribeName = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(holder))?.name);
    if (tribeName && ep.campEvents?.[tribeName]) {
      const campBlock = ep.campEvents[tribeName];
      (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(confEvt);
    }
  });
}

export function checkSoleVoteConfessions(ep) {
  const holders = (gs.advantages || []).filter(a => a.type === 'soleVote' && gs.activePlayers.includes(a.holder));
  if (!holders.length || !ep.campEvents) return;
  if (!gs.knownSoleVoteHolders) gs.knownSoleVoteHolders = new Set();

  holders.forEach(adv => {
    const holder = adv.holder;
    const s = pStats(holder);
    const tribeMembers = gs.isMerged
      ? gs.activePlayers.filter(p => p !== holder)
      : (gs.tribes.find(t => t.members.includes(holder))?.members || []).filter(p => p !== holder);
    const allies = tribeMembers
      .map(p => ({ name: p, bond: getBond(holder, p) }))
      .filter(x => x.bond >= 2)
      .sort((a, b) => b.bond - a.bond);
    if (!allies.length) return;

    const confidant = allies[0].name;
    const confChance = s.loyalty * 0.06 + getBond(holder, confidant) * 0.04;
    if (Math.random() >= confChance) return;

    gs.knownSoleVoteHolders.add(holder);
    addBond(holder, confidant, 0.3);

    const _pr = pronouns(holder);
    const confLines = [
      `${holder} pulled ${confidant} aside and lowered ${_pr.posAdj} voice. "I found something that changes everything. I can cast the only vote at tribal. Everyone else? Silenced." ${confidant} went pale.`,
      `${holder} confided in ${confidant}. "I have a Sole Vote. When I play it, I decide who goes. Just me." ${confidant} didn't know whether to feel protected or terrified.`,
      `${holder} trusted ${confidant} enough to share the truth: ${_pr.sub} ${_pr.sub === 'they' ? 'hold' : 'holds'} a Sole Vote. One person decides the entire elimination. ${confidant} nodded slowly, already calculating what that means for ${pronouns(confidant).obj}.`,
    ];
    const _seed = [...(holder+confidant)].reduce((s, c) => s + c.charCodeAt(0), 0);
    const confEvt = { type: 'soleVoteConfession', players: [holder, confidant],
      text: confLines[_seed % confLines.length] };

    const tribeName = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(holder))?.name);
    if (tribeName && ep.campEvents?.[tribeName]) {
      const campBlock = ep.campEvents[tribeName];
      (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(confEvt);
    }
  });
}

// ── Social intel gathering: social butterflies learn things through conversation, not sneaking ──
export function checkSocialIntel(ep) {
  if (!ep.campEvents) return;
  // Proportional: every player has a chance, scales with social stat
  const _socialPlayers = gs.activePlayers;

  _socialPlayers.forEach(socialP => {
    const _socialChance = pStats(socialP).social * 0.03; // proportional: stat 4=12%, stat 7=21%, stat 10=30%
    if (Math.random() > _socialChance) return;
    const _sS = pStats(socialP);
    const _pr = pronouns(socialP);
    const tribeName = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(socialP))?.name;
    if (!tribeName || !ep.campEvents?.[tribeName]) return;
    const campBlock = ep.campEvents[tribeName];
    const _pushEvt = evt => (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(evt);

    // What do they learn? Check what secrets exist on their tribe
    const tribeMembers = gs.isMerged
      ? gs.activePlayers.filter(p => p !== socialP)
      : (gs.tribes.find(t => t.members.includes(socialP))?.members || []).filter(p => p !== socialP);

    // 1. Discover an idol holder through natural conversation (not snooping — they just READ people)
    const _hiddenIdolHolder = tribeMembers.find(p =>
      gs.advantages.some(a => (a.type === 'idol' || a.type === 'legacy') && a.holder === p)
      && !gs.knownIdolHoldersPersistent?.has(p)
      && getBond(socialP, p) > -1 // needs at least neutral relationship to have a conversation
    );
    if (_hiddenIdolHolder && Math.random() < _sS.social * 0.05) { // proportional: stat 4=20%, stat 7=35%, stat 10=50%
      if (!gs.knownIdolHoldersThisEp) gs.knownIdolHoldersThisEp = new Set();
      gs.knownIdolHoldersThisEp.add(_hiddenIdolHolder);
      if (!gs.knownIdolHoldersPersistent) gs.knownIdolHoldersPersistent = new Set();
      gs.knownIdolHoldersPersistent.add(_hiddenIdolHolder);
      // A long friendly talk, then the camera hears what socialP worked out. The holder never knows.
      _pushEvt(scriptEvent({ type: 'socialIntel', players: [socialP, _hiddenIdolHolder], badgeText: 'Social Intel', badgeClass: 'gold' },
        makeScene('intel.social', { a: socialP, b: _hiddenIdolHolder }, { ending: 'idol' }, [], spotOf(ep, socialP, _hiddenIdolHolder, 'pre').spot),
        { ep: ep.num, phase: 'pre' }));
      return; // one intel per episode max
    }

    // 2. Pick up on vote plans — learn who's being targeted through camp gossip
    const _targetedPlayers = tribeMembers.filter(p => computeHeat(p, tribeMembers.concat(socialP), []) >= 3);
    if (_targetedPlayers.length && Math.random() < 0.30) {
      const _target = _targetedPlayers[Math.floor(Math.random() * _targetedPlayers.length)];
      _pushEvt(scriptEvent({ type: 'socialIntel', players: [socialP], badgeText: 'Social Read', badgeClass: 'gold' },
        makeScene('intel.social', { a: socialP }, { ending: 'target', target: _target }, [], { id: 'confessional', label: 'Confessional' }),
        { ep: ep.num, phase: 'pre' }));
      // Boost their eavesdrop flag so voting plans are more accurate for them
      if (gs.playerStates?.[socialP]) gs.playerStates[socialP].eavesdropBoostThisEp = true;
      return;
    }

    // 3. Read the room — sense alliance dynamics others miss
    const _crackingAlliances = (gs.namedAlliances || []).filter(a => {
      if (!a.active) return false;
      const members = a.members.filter(m => tribeMembers.includes(m) || m === socialP);
      if (members.length < 2) return false;
      const avgBond = members.reduce((s, m) => s + members.filter(o => o !== m).reduce((ss, o) => ss + getBond(m, o), 0), 0) / Math.max(1, members.length * (members.length - 1));
      return avgBond < 1;
    });
    if (_crackingAlliances.length && Math.random() < 0.25) {
      const _crackA = _crackingAlliances[Math.floor(Math.random() * _crackingAlliances.length)];
      _pushEvt(scriptEvent({ type: 'socialIntel', players: [socialP], badgeText: 'Social Read', badgeClass: 'gold' },
        makeScene('intel.social', { a: socialP }, { ending: 'crack', group: _crackA.name }, [], { id: 'confessional', label: 'Confessional' }),
        { ep: ep.num, phase: 'pre' }));
    }
  });
}

// ── Second Life Amulet events: tension, leaks, strategic ripple ──
export function checkSecondLifeAmuletEvents(ep) {
  const holders = (gs.advantages || []).filter(a => a.type === 'secondLife' && gs.activePlayers.includes(a.holder));
  if (!holders.length || !ep.campEvents) return;

  holders.forEach(adv => {
    const holder = adv.holder;
    const s = pStats(holder);
    const _pr = pronouns(holder);
    const tribeName = gs.isMerged ? (gs.mergeName || 'merge')
      : (gs.tribes.find(t => t.members.includes(holder))?.name);
    if (!tribeName || !ep.campEvents[tribeName]) return;
    const campBlock = ep.campEvents[tribeName];
    const pushEvt = evt => { (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(evt); };

    // Only fire one event per holder per episode, ~30% chance
    if (Math.random() > 0.30) return;

    const tribeMembers = gs.isMerged
      ? gs.activePlayers.filter(p => p !== holder)
      : (gs.tribes.find(t => t.members.includes(holder))?.members || []).filter(p => p !== holder);
    const bestAlly = tribeMembers.slice().sort((a, b) => getBond(holder, b) - getBond(holder, a))[0];
    const rival = tribeMembers.slice().sort((a, b) => getBond(holder, a) - getBond(holder, b))[0];

    const _roll = Math.random();

    if (_roll < 0.20 && bestAlly && getBond(holder, bestAlly) >= 2) {
      // ── Confession: tells a close ally about the amulet ──
      const confLines = [
        `${holder} pulled ${bestAlly} aside after the challenge. "If they come for me, I have something." ${_pr.Sub} didn't say what. ${bestAlly} didn't ask.`,
        `${holder} leaned in close. "I found something at camp. If I go to tribal and it goes wrong — I'm not done." ${bestAlly}'s expression said everything.`,
        `${holder} told ${bestAlly} about the amulet. It felt like insurance. It also felt like a target if the wrong person finds out.`,
      ];
      pushEvt({ type: 'amuletConfession', players: [holder, bestAlly],
        text: confLines[Math.floor(Math.random() * confLines.length)] });
      addBond(holder, bestAlly, 0.5); // trust deepens

      // Betrayal roll: ally leaks it
      const cs = pStats(bestAlly);
      const betrayChance = Math.max(0.05, 0.08 + (10 - cs.loyalty) * 0.02 - getBond(bestAlly, holder) * 0.02);
      if (Math.random() < betrayChance) {
        const leakTarget = tribeMembers.filter(p => p !== bestAlly && p !== holder)
          .sort((a, b) => getBond(bestAlly, b) - getBond(bestAlly, a))[0];
        if (leakTarget) {
          const leakLines = [
            `${bestAlly} told ${leakTarget} about ${holder}'s amulet. The information is out. What happens next depends on who moves first.`,
            `By nightfall, ${leakTarget} knew about the Second Life Amulet. ${bestAlly} let it slip — maybe on purpose, maybe not. Either way, the secret is no longer a secret.`,
          ];
          pushEvt({ type: 'amuletLeak', players: [bestAlly, leakTarget, holder],
            text: leakLines[Math.floor(Math.random() * leakLines.length)] });
          addBond(holder, bestAlly, -1.5); // betrayal
          addBond(leakTarget, holder, -0.5); // suspicion
          // Tribe now knows — amulet holder becomes less attractive target
          if (!gs.knownAmuletHoldersThisEp) gs.knownAmuletHoldersThisEp = new Set();
          gs.knownAmuletHoldersThisEp.add(holder);
          if (!gs.knownAmuletHoldersPersistent) gs.knownAmuletHoldersPersistent = new Set();
          gs.knownAmuletHoldersPersistent.add(holder);
        }
      }

    } else if (_roll < 0.45) {
      // ── False Security: holder plays looser, others notice ──
      const secLines = [
        `${holder} has been different since finding the amulet. Looser. Less worried. The tribe hasn't figured out why yet — but someone will.`,
        `Something shifted in ${holder}'s game. ${_pr.Sub} stopped scrambling before tribal. Started sitting back. That kind of calm is suspicious when you're supposed to be fighting for your life.`,
        `${holder} doesn't flinch when names come up anymore. ${_pr.Sub} used to. The tribe is starting to notice the difference.`,
      ];
      pushEvt({ type: 'amuletFalseSecurity', players: [holder],
        text: secLines[Math.floor(Math.random() * secLines.length)] });

    } else if (_roll < 0.65 && rival && getBond(holder, rival) <= -1) {
      // ── Strategic Dilemma: holder considers who to pick if it activates ──
      const stratLines = [
        `${holder} has been watching ${rival} all day. If the amulet fires, ${rival}'s name is already written in ${_pr.posAdj} head. This isn't just survival — it's personal.`,
        `${holder} sat by the fire thinking. If tribal goes south, the Second Life Amulet gives ${_pr.obj} a choice. And ${_pr.sub} already know${_pr.sub==='they'?'':'s'} who ${_pr.sub}'d pick.`,
      ];
      pushEvt({ type: 'amuletDilemma', players: [holder, rival],
        text: stratLines[Math.floor(Math.random() * stratLines.length)] });

    } else if (_roll < 0.80) {
      // ── The Weight: holding power and saying nothing takes a toll ──
      const weightLines = [
        `${holder} checked the amulet again tonight. Third time today. The weight of carrying it — knowing what it does, knowing when it fires — sits heavier than ${_pr.sub} expected.`,
        `The Second Life Amulet doesn't do anything until you're already dead in the game. That's the cruelest part. ${holder} carry${_pr.sub==='they'?'':'ies'} hope and dread in the same pocket.`,
        `${holder} almost told someone tonight. Almost. Then ${_pr.sub} looked around the fire and decided that silence was the only safe play left.`,
      ];
      pushEvt({ type: 'amuletWeight', players: [holder],
        text: weightLines[Math.floor(Math.random() * weightLines.length)] });

    } else {
      // ── Snooping: someone spots the amulet ──
      // Proportional: any player can snoop, chance scales with intuition
      const snooper = tribeMembers.filter(p => Math.random() < pStats(p).intuition * 0.04 + pStats(p).mental * 0.015)
        .sort(() => Math.random() - 0.5)[0];
      if (snooper) {
        const snoopLines = [
          `${snooper} saw something in ${holder}'s bag. ${pronouns(snooper).Sub} didn't get a clear look — but it wasn't nothing. The shape was wrong for anything normal.`,
          `${snooper} caught ${holder} reaching into ${_pr.posAdj} bag near the water well. ${holder} froze for a half-second. That was enough.`,
          `${snooper} has been watching ${holder} for days. Something about ${_pr.posAdj} posture changed after that morning alone at camp. ${pronouns(snooper).Sub} think${pronouns(snooper).sub==='they'?'':'s'} ${holder} found something.`,
        ];
        pushEvt({ type: 'amuletSnoop', players: [snooper, holder],
          text: snoopLines[Math.floor(Math.random() * snoopLines.length)] });
        addBond(snooper, holder, -0.3); // suspicion
        // Snooper suspects — adds to known holders (they'll share the info)
        if (!gs.knownAmuletHoldersThisEp) gs.knownAmuletHoldersThisEp = new Set();
        gs.knownAmuletHoldersThisEp.add(holder);
        if (!gs.knownAmuletHoldersPersistent) gs.knownAmuletHoldersPersistent = new Set();
        gs.knownAmuletHoldersPersistent.add(holder);
      }
    }
  });
}

// ── Legacy Advantage Camp Events: confession, weight, heir scheming ──
export function checkLegacyCampEvents(ep) {
  if (!ep.campEvents) return;
  const legacyAdvs = gs.advantages.filter(a => a.type === 'legacy' && gs.activePlayers.includes(a.holder));
  if (!legacyAdvs.length) return;

  legacyAdvs.forEach(adv => {
    const holder = adv.holder;
    const _pr = pronouns(holder);
    const s = pStats(holder);
    const tribeName = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(holder))?.name;
    if (!tribeName || !ep.campEvents[tribeName]) return;
    const campBlock = ep.campEvents[tribeName];
    const pushEvt = evt => { (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(evt); };

    // ~25% chance per episode
    if (Math.random() > 0.25) return;

    const tribeMembers = gs.isMerged
      ? gs.activePlayers.filter(p => p !== holder)
      : (gs.tribes.find(t => t.members.includes(holder))?.members || []).filter(p => p !== holder);
    const bestAlly = tribeMembers.slice().sort((a, b) => getBond(holder, b) - getBond(holder, a))[0];
    const likelyHeir = bestAlly; // highest bond = most likely to be willed the advantage

    const _roll = Math.random();
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

    if (_roll < 0.25 && bestAlly && getBond(holder, bestAlly) >= 2) {
      // ── Confession: tells ally about the Legacy Advantage (like Sierra → Sarah) ──
      pushEvt({ type: 'legacyConfession', players: [holder, bestAlly], text: _rp([
        `${holder} pulled ${bestAlly} aside. "I have the Legacy Advantage. If I go home, it goes to you." The weight of that statement hangs between them.`,
        `${holder} told ${bestAlly} about the Legacy Advantage. Trust — or a mistake. Time will tell which.`,
        `"If something happens to me, check your bag the next morning." ${holder} didn't explain further. ${bestAlly} understood.`,
      ]), badgeText: 'Legacy Confessed', badgeClass: 'gold' });
      addBond(holder, bestAlly, 0.5);
      // Track knowledge
      if (!gs.knownLegacyHolders) gs.knownLegacyHolders = new Set();
      gs.knownLegacyHolders.add(holder);
      // Store who the holder confessed to — they now know about the will
      if (!gs.legacyConfessedTo) gs.legacyConfessedTo = {};
      gs.legacyConfessedTo[holder] = bestAlly;

      // Betrayal roll: ally leaks the secret (lower chance than amulet — legacy is more personal)
      const _allyS = pStats(bestAlly);
      const _betrayChance = Math.max(0.03, 0.06 + (10 - _allyS.loyalty) * 0.015 - getBond(bestAlly, holder) * 0.02);
      if (Math.random() < _betrayChance) {
        const leakTarget = tribeMembers.filter(p => p !== bestAlly).sort((a, b) => getBond(bestAlly, b) - getBond(bestAlly, a))[0];
        if (leakTarget) {
          pushEvt({ type: 'legacyLeak', players: [bestAlly, leakTarget, holder], text: _rp([
            `${bestAlly} told ${leakTarget} about ${holder}'s Legacy Advantage. The information is out — and now ${leakTarget} knows exactly what's at stake.`,
            `By nightfall, ${leakTarget} knew. ${bestAlly} let it slip. The Legacy Advantage just became everyone's business.`,
          ]), badgeText: 'Legacy Leaked', badgeClass: 'red' });
          addBond(holder, bestAlly, -1.5);
          gs.knownLegacyHolders.add(holder);
        }
      }

    } else if (_roll < 0.50 && gs.legacyConfessedTo?.[holder]) {
      // ── The Sarah Play: someone who knows about the legacy wants the holder gone to inherit it ──
      const _knower = gs.legacyConfessedTo[holder];
      if (gs.activePlayers.includes(_knower) && _knower !== holder) {
        const _knowerS = pStats(_knower);
        // Strategic players with low loyalty see the opportunity
        if (_knowerS.strategic >= 6 && _knowerS.loyalty <= 6) {
          pushEvt({ type: 'legacyScheme', players: [_knower, holder], text: _rp([
            `${_knower} does the math. If ${holder} goes home, the Legacy Advantage lands in ${pronouns(_knower).posAdj} bag. The thought isn't going away.`,
            `${_knower} has been thinking about it since ${holder} told ${pronouns(_knower).obj}. Vote ${holder} out → inherit the Legacy Advantage. The logic is clean. The loyalty is complicated.`,
            `"${holder} trusts me with everything." ${_knower} says it to the confessional. Then pauses. "That might be the problem."`,
          ]), badgeText: 'Heir Scheming', badgeClass: 'red' });
          // The knower's heat toward the holder increases — they WANT them gone
          addBond(_knower, holder, -0.3); // subtle erosion
        }
      }

    } else if (_roll < 0.75) {
      // ── Weight: holder feels the burden of carrying a ticking clock ──
      pushEvt({ type: 'legacyWeight', players: [holder], text: _rp([
        `${holder} checks ${_pr.posAdj} bag for the third time today. The Legacy Advantage is still there. The question is whether ${_pr.sub}'ll make it to the day it activates.`,
        `The Legacy Advantage sits in ${holder}'s bag like a promise. But promises don't mean anything if you don't survive long enough to keep them.`,
        `${holder} knows the number. ${(adv.activatesAt || [5]).join(' or ')} players left. That's when it fires. The math says ${_pr.sub} ${_pr.sub==='they'?'need':'needs'} to survive ${gs.activePlayers.length - Math.min(...(adv.activatesAt || [5]))} more tribals. The game says nothing is guaranteed.`,
      ]), badgeText: 'Legacy Weight', badgeClass: '' });

    } else {
      // ── Heir awareness: tribe speculates about who'd inherit if the holder left ──
      if (likelyHeir) {
        const _obs = tribeMembers.filter(p => p !== likelyHeir && pStats(p).strategic >= 6);
        const _observer = _obs[Math.floor(Math.random() * _obs.length)];
        if (_observer && gs.knownLegacyHolders?.has(holder)) {
          pushEvt({ type: 'legacyHeirWatch', players: [_observer, holder, likelyHeir], text: _rp([
            `${_observer} has been watching ${holder} and ${likelyHeir}. If ${holder} goes, the Legacy Advantage goes to ${likelyHeir}. That changes the calculus on both of them.`,
            `${_observer} clocks the bond between ${holder} and ${likelyHeir}. If the Legacy Advantage exists — and ${_observer} thinks it does — ${likelyHeir} is the heir. That makes ${likelyHeir} valuable. And ${holder} expendable.`,
          ]), badgeText: 'Watching the Heir', badgeClass: 'gold' });
        }
      }
    }
  });
}

// ── Tactical advantage snoop: intuitive players notice Team Swap / Vote Block / Vote Steal holders ──
export function checkTacticalAdvantageSnoop(ep) {
  if (!ep.campEvents) return;
  const _snoopTypes = [
    { type: 'teamSwap', setKey: 'knownTeamSwapHolders', chance: 0.02, evtType: 'teamSwapSnooped', label: 'Team Swap' },
    { type: 'voteBlock', setKey: 'knownVoteBlockHolders', chance: 0.015, evtType: 'voteBlockSnooped', label: 'Vote Block' },
    { type: 'voteSteal', setKey: 'knownVoteStealHolders', chance: 0.015, evtType: 'voteStealSnooped', label: 'Vote Steal' },
    { type: 'safetyNoPower', setKey: 'knownSafetyNoPowerHolders', chance: 0.02, evtType: 'safetyNoPowerSnooped', label: 'Safety Without Power' },
    { type: 'soleVote', setKey: 'knownSoleVoteHolders', chance: 0.02, evtType: 'soleVoteSnooped', label: 'Sole Vote' },
  ];

  _snoopTypes.forEach(({ type: _sType, setKey, chance, evtType, label }) => {
    const _sHolders = (gs.advantages || []).filter(a => a.type === _sType && gs.activePlayers.includes(a.holder));
    _sHolders.forEach(_sAdv => {
      const _sHolder = _sAdv.holder;
      if (!gs[setKey]) gs[setKey] = new Set();

      const tribeName = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(_sHolder))?.name);
      if (!tribeName || !ep.campEvents?.[tribeName]) return;

      const tribeMembers = gs.isMerged
        ? gs.activePlayers.filter(p => p !== _sHolder)
        : (gs.tribes.find(t => t.members.includes(_sHolder))?.members || []).filter(p => p !== _sHolder);

      // Skip if all tribemates already know
      const _sUnaware = tribeMembers.filter(p => !gs[setKey].has(p));
      if (!_sUnaware.length) return;

      // Find snooper — proportional to intuition
      const _sSnooper = _sUnaware.filter(p => Math.random() < pStats(p).intuition * chance)
        .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
      if (!_sSnooper) return;

      gs[setKey].add(_sHolder);
      const _sPr = pronouns(_sHolder);
      const _sSnoopPr = pronouns(_sSnooper);
      const _sSnoopLines = [
        `${_sSnooper} noticed ${_sHolder} checking ${_sPr.posAdj} bag one too many times. Something's in there — and ${_sSnoopPr.sub} think${_sSnoopPr.sub === 'they' ? '' : 's'} it's a ${label}.`,
        `${_sSnooper} caught a glimpse of something in ${_sHolder}'s things. ${_sSnoopPr.Sub} ${_sSnoopPr.sub === 'they' ? 'aren\'t' : 'isn\'t'} sure, but it looked like a ${label}. ${_sSnooper} is keeping that to ${_sSnoopPr.ref}.`,
        `${_sSnooper} has been watching ${_sHolder}. The way ${_sPr.sub} ${_sPr.sub === 'they' ? 'move' : 'moves'} around camp changed a few days ago. ${_sSnooper} is almost certain ${_sHolder} has a ${label}.`,
      ];

      const campBlock = ep.campEvents[tribeName];
      (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push({
        type: evtType, players: [_sSnooper, _sHolder],
        text: _sSnoopLines[Math.floor(Math.random() * _sSnoopLines.length)]
      });
    });
  });
}

// ── Comfort Blindspot: foreshadowing for complacent players sitting on danger ──
// Fires ~25% when a checked-out player (comfortable + low stats) is the heat leader on their tribe.
// Pushes a comfortBlindspot event + clockingIt reaction into pre-challenge camp events.
// ep.comfortBlindspotPlayer is used by rpBuildTribal to flag a comfort blindside if they're eliminated.
// ── Hero + Villain archetype camp events ──
export function checkHeroVillainEvents(ep) {
  if (!ep.campEvents) return;
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

  const _heroes = gs.activePlayers.filter(p => players.find(pl => pl.name === p)?.archetype === 'hero');
  const _villains = gs.activePlayers.filter(p => players.find(pl => pl.name === p)?.archetype === 'villain');

  // ── VILLAIN EVENTS (~30% per villain per episode) ──
  _villains.forEach(v => {
    if (Math.random() > 0.30) return;
    const _vPr = pronouns(v);
    const _vS = pStats(v);
    const tribeName = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(v))?.name;
    if (!tribeName || !ep.campEvents?.[tribeName]) return;
    const campBlock = ep.campEvents[tribeName];
    const pushEvt = evt => (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(evt);
    const tribeMembers = gs.isMerged ? gs.activePlayers.filter(p => p !== v) : (gs.tribes.find(t => t.members.includes(v))?.members || []).filter(p => p !== v);

    const _roll = Math.random();

    if (_roll < 0.25 && tribeMembers.length) {
      // Intimidation — villain asserts dominance
      const _target = tribeMembers.sort((a, b) => getBond(v, a) - getBond(v, b))[0]; // worst enemy
      addBond(_target, v, -0.4);
      pushEvt({ type: 'villainIntimidate', players: [v, _target], text: _rp([
        `${v} walks past ${_target} at the fire and doesn't sit down. Just stands there. Looking. The message is clear.`,
        `"You know it's coming, right?" ${v} says it to ${_target} like ${_vPr.sub} ${_vPr.sub==='they'?'are':'is'} discussing the weather. ${_target} doesn't respond.`,
        `${v} positions ${_vPr.ref} between ${_target} and the rest of the tribe. It's not accidental. Everyone notices.`,
      ]), badgeText: 'Intimidation', badgeClass: 'red' });
    } else if (_roll < 0.50) {
      // Power declaration — villain announces control
      pushEvt({ type: 'villainPower', players: [v], text: _rp([
        `"I'm running this game and everyone knows it." ${v} says it at camp. Out loud. The tribe goes quiet.`,
        `${v} doesn't whisper strategy. ${_vPr.Sub} announce${_vPr.sub==='they'?'':'s'} it. The tribe can accept it or fight it — but ${_vPr.sub} ${_vPr.sub==='they'?'aren\'t':'isn\'t'} hiding.`,
        `${v} lays out exactly what's going to happen tonight. No deception. No spin. Just power.`,
      ]), badgeText: 'Power Play', badgeClass: 'red' });
    } else if (_roll < 0.70 && ep.eliminated) {
      // Gloating — villain celebrates an enemy's departure
      const _elimBond = getBond(v, ep.eliminated);
      if (_elimBond < -1) {
        _rp([0]); // the draw that picked the sentence
        pushEvt(scriptEvent({ type: 'villainGloat', players: [v], badgeText: 'Gloating', badgeClass: 'red' },
          makeScene('villain.gloat', { a: v }, { fallen: ep.eliminated }, [], { id: 'confessional', label: 'Confessional' }), { ep: ep.num, phase: 'pre' }));
        tribeMembers.forEach(p => { if (getBond(p, ep.eliminated) >= 2) addBond(p, v, -0.3); }); // allies of eliminated resent
      }
    } else {
      // Villain's inner circle — fierce loyalty to their #1
      const _bestAlly = tribeMembers.sort((a, b) => getBond(v, b) - getBond(v, a))[0];
      if (_bestAlly && getBond(v, _bestAlly) >= 1) {
        addBond(v, _bestAlly, 0.4);
        _rp([0]);
        pushEvt(scriptEvent({ type: 'villainLoyalty', players: [v, _bestAlly], badgeText: 'Inner Circle', badgeClass: 'gold' },
          makeScene('villain.loyal', { a: v, b: _bestAlly }, {}, [], spotOf(ep, v, _bestAlly, 'pre').spot), { ep: ep.num, phase: 'pre' }));
      }
    }
  });

  // ── HERO EVENTS (~30% per hero per episode) ──
  _heroes.forEach(h => {
    if (Math.random() > 0.30) return;
    const _hPr = pronouns(h);
    const _hS = pStats(h);
    const tribeName = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(h))?.name;
    if (!tribeName || !ep.campEvents?.[tribeName]) return;
    const campBlock = ep.campEvents[tribeName];
    const pushEvt = evt => (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(evt);
    const tribeMembers = gs.isMerged ? gs.activePlayers.filter(p => p !== h) : (gs.tribes.find(t => t.members.includes(h))?.members || []).filter(p => p !== h);

    const _roll = Math.random();

    if (_roll < 0.25 && _villains.some(v => tribeMembers.includes(v) || v === h)) {
      // Confronting the villain — the hero stands up
      const _villain = _villains.find(v => tribeMembers.includes(v));
      if (_villain) {
        addBond(h, _villain, -0.5);
        // Tribe respects the stand
        tribeMembers.filter(p => p !== _villain).forEach(p => addBond(p, h, 0.2));
        pushEvt({ type: 'heroConfront', players: [h, _villain], text: _rp([
          `${h} walks up to ${_villain} and says what nobody else will. The camp holds its breath.`,
          `"Enough." ${h} says it to ${_villain}'s face in front of everyone. ${_villain} ${pronouns(_villain).sub==='they'?'don\'t':'doesn\'t'} flinch — but the tribe sees something shift.`,
          `${h} stands between ${_villain} and the rest of the tribe. Not physically — but in a way that everyone understands.`,
        ]), badgeText: 'Hero vs Villain', badgeClass: 'gold' });
      }
    } else if (_roll < 0.50) {
      // Standing up for the weak — protect an underdog/bottom player
      const _weak = tribeMembers.sort((a, b) => {
        const avgA = tribeMembers.reduce((s, p) => s + getBond(a, p), 0) / Math.max(1, tribeMembers.length);
        const avgB = tribeMembers.reduce((s, p) => s + getBond(b, p), 0) / Math.max(1, tribeMembers.length);
        return avgA - avgB;
      })[0]; // most isolated player
      if (_weak) {
        addBond(h, _weak, 0.6);
        addBond(_weak, h, 0.8);
        pushEvt({ type: 'heroProtect', players: [h, _weak], text: _rp([
          `${h} notices ${_weak} is on the outside. Instead of using it, ${_hPr.sub} sit${_hPr.sub==='they'?'':'s'} with ${_weak}. Not strategy — just decency.`,
          `"Leave ${_weak} alone." ${h} doesn't say it loudly. But the people who needed to hear it, heard it.`,
          `Everyone else is circling ${_weak}. ${h} is the only one who extends a hand instead of writing a name.`,
        ]), badgeText: 'Protecting the Weak', badgeClass: 'green' });
      }
    } else if (_roll < 0.70) {
      // Sacrifice — giving up something for the tribe
      pushEvt({ type: 'heroSacrifice', players: [h], text: _rp([
        `${h} gives up ${_hPr.posAdj} portion of rice so someone else can eat. Nobody asked ${_hPr.obj} to. That's the point.`,
        `${h} volunteers for the hardest camp task — the one nobody wants. Again. The tribe notices, even if they don't say it.`,
        `${h} could have kept the information to ${_hPr.ref}. Instead, ${_hPr.sub} shared it with the group. It's a risk — but ${_hPr.sub} ${_hPr.sub==='they'?'play':'plays'} with a code.`,
      ]), badgeText: 'Sacrifice', badgeClass: 'green' });
      tribeMembers.forEach(p => addBond(p, h, 0.15)); // tribe respects the sacrifice
    } else {
      // Emotional weight — the cost of being the hero
      pushEvt({ type: 'heroWeight', players: [h], text: _rp([
        `Everyone comes to ${h} with their problems. Nobody asks how ${h} is doing.`,
        `${h} sits alone at the end of the day. The moral compass of the tribe is heavy. ${_hPr.Sub} carry${_hPr.sub==='they'?'':'s'} it because nobody else will.`,
        `${h} is tired. Not physically — emotionally. Being the person everyone trusts means being the person everyone leans on.`,
      ]), badgeText: 'The Weight', badgeClass: '' });
    }
  });
}

// ── Social Politics: active campaigning between tribals ──
// ══════════════════════════════════════════════════════════════════════════════
// THE MOLE — sabotage actions + suspicion accumulation
// ══════════════════════════════════════════════════════════════════════════════
export function checkMoleSabotage(ep) {
  if (!gs.moles?.length || !ep.campEvents) return;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const curEp = (gs.episode || 0) + 1;
  const coordinated = seasonConfig.moleCoordination === 'coordinated' && gs.moles.length === 2;

  gs.moles.forEach(mole => {
    if (!gs.activePlayers.includes(mole.player)) return; // eliminated

    // Post-exposure: no sabotage, but inject survival-mode camp events
    if (mole.exposed) {
      const _moleTribe = gs.isMerged ? (gs.mergeName || 'merge')
        : gs.tribes.find(t => t.members.includes(mole.player))?.name;
      if (_moleTribe && ep.campEvents[_moleTribe] && Math.random() < 0.40) {
        const mp = pronouns(mole.player);
        const _survTexts = [
          `${mole.player} tries to rebuild. ${mp.Sub} pull${mp.sub === 'they' ? '' : 's'} people aside one by one, making ${mp.posAdj} case. "I was playing the game — same as everyone else."`,
          `${mole.player} is scrambling. The tribe knows what ${mp.sub} did, and the trust is gone. But ${mp.sub} ${mp.sub === 'they' ? 'aren\'t' : 'isn\'t'} done yet.`,
          `Nobody sits next to ${mole.player} at the fire anymore. ${mp.Sub} eat${mp.sub === 'they' ? '' : 's'} alone. But ${mp.sub} ${mp.sub === 'they' ? 'keep' : 'keeps'} talking, keeps working, keeps trying to find a crack.`,
          `${mole.player} plays the victim card. "Production put me up to this — I had no choice." Some buy it. Most don't.`,
          `${mole.player} offers information — real information — to anyone who'll listen. It's the only currency ${mp.sub} ${mp.sub === 'they' ? 'have' : 'has'} left.`,
        ];
        const evts = ep.campEvents[_moleTribe].post || ep.campEvents[_moleTribe].pre || (Array.isArray(ep.campEvents[_moleTribe]) ? ep.campEvents[_moleTribe] : []);
        evts.push({
          type: 'moleExposedSurvival', text: _pick(_survTexts),
          players: [mole.player], badgeText: 'EXPOSED'
        });
      }
      return;
    }

    // ── Laying low check — but max 2 consecutive episodes, then forced back ──
    const _moleHeat = computeHeat(mole.player, gs.activePlayers, gs.namedAlliances || []);
    const _maxSusp = Math.max(0, ...Object.values(mole.suspicion));
    const _recentActs = mole.sabotageLog.filter(s => s.ep >= curEp - 2).length;
    // Track consecutive lay-low episodes
    if (!mole._layLowStreak) mole._layLowStreak = 0;
    const _shouldLayLow = (_moleHeat >= 4 || _maxSusp >= 2.0 || _recentActs >= 4);
    const _forcedBack = mole._layLowStreak >= 1; // max 1 consecutive — then the Mole acts
    if (_shouldLayLow && !_forcedBack && Math.random() > 0.15) {
      mole.layingLow = true;
      // Inject a laying-low camp event
      const _moleTribe = gs.isMerged ? (gs.mergeName || 'merge')
        : gs.tribes.find(t => t.members.includes(mole.player))?.name;
      if (_moleTribe && ep.campEvents[_moleTribe]) {
        const mp = pronouns(mole.player);
        const _layLowTexts = [
          `${mole.player} is unusually helpful today — pitching in on chores, fetching water, staying out of strategy talks. ${mp.Sub} ${mp.sub === 'they' ? 'seem' : 'seems'} to be making a point of being useful.`,
          `${mole.player} spends the day bonding with anyone who'll listen. Jokes, stories, camp chores. No game talk. Just vibes.`,
          `${mole.player} keeps ${mp.posAdj} head down. No scheming, no whispering. Just another day at camp. Nobody notices — which is exactly the point.`,
          `${mole.player} volunteers to cook for the tribe. It's a small gesture, but it lands. ${mp.Sub} ${mp.sub === 'they' ? 'know' : 'knows'} the heat is on — and the best move is no move at all.`,
          `${mole.player} is all smiles today. Checking in on alliances, affirming commitments. The perfect teammate. If only they knew.`,
        ];
        const evts = ep.campEvents[_moleTribe].post || ep.campEvents[_moleTribe].pre || (Array.isArray(ep.campEvents[_moleTribe]) ? ep.campEvents[_moleTribe] : []);
        evts.push({
          type: 'moleLayingLow', text: _pick(_layLowTexts),
          players: [mole.player], badgeText: 'LAYING LOW'
        });
      }
      mole._layLowStreak = (mole._layLowStreak || 0) + 1;
      return; // no sabotage this episode
    }
    mole.layingLow = false;
    mole._layLowStreak = 0; // reset streak — Mole is back in action

    // Love triangle / affair cover — drama distracts from suspicion
    const _moleInTriangle = (gs.loveTriangles || []).some(t => !t.resolved && (t.center === mole.player || t.suitors.includes(mole.player)));
    const _moleInAffair = (gs.affairs || []).some(af => !af.resolved && (af.cheater === mole.player || af.secretPartner === mole.player));
    if (_moleInTriangle || _moleInAffair) mole.resistance = Math.min(0.85, mole.resistance + 0.15);

    // ── SUSPICION EVENTS — players getting closer to the truth ──
    const _moleTribeSusp = gs.isMerged ? (gs.mergeName || 'merge')
      : gs.tribes.find(t => t.members.includes(mole.player))?.name;
    if (_moleTribeSusp && ep.campEvents) {
      if (!ep.campEvents[_moleTribeSusp]) ep.campEvents[_moleTribeSusp] = { pre: [], post: [] };
      const _suspEvts = (typeof ep.campEvents[_moleTribeSusp] === 'object' && !Array.isArray(ep.campEvents[_moleTribeSusp]))
        ? (ep.campEvents[_moleTribeSusp].pre || []) : (Array.isArray(ep.campEvents[_moleTribeSusp]) ? ep.campEvents[_moleTribeSusp] : []);

      Object.entries(mole.suspicion).forEach(([observer, susp]) => {
        if (!gs.activePlayers.includes(observer)) return;
        const op = pronouns(observer), mp = pronouns(mole.player);

        // Suspicion >= 2.0 — player starts talking to others, planting doubt
        if (susp >= 2.0 && susp < 2.5 && Math.random() < 0.40) {
          // Only fire once per observer (track to avoid repeat events)
          if (!mole._suspEvtFired) mole._suspEvtFired = {};
          if (mole._suspEvtFired[observer + '_talk']) return;
          mole._suspEvtFired[observer + '_talk'] = true;
          const _talkTexts = [
            `${observer} pulls someone aside. "Have you noticed anything about ${mole.player}? Every time something goes wrong, ${mp.sub} ${mp.sub === 'they' ? 'are' : 'is'} right there." The other person pauses. They have noticed.`,
            `${observer} has been comparing notes. The challenge where ${mole.player} underperformed. The alliance that cracked right after ${mp.sub} joined it. The leaked intel. ${observer} isn't sure yet — but the pattern is forming.`,
            `"I'm not accusing anyone," ${observer} says carefully. "But I think we need to talk about ${mole.player}." The conversation is quiet. The implications are not.`,
            `${observer} asks around camp: who told you that? Who started that rumor? Every answer leads back to ${mole.player}. ${observer} isn't ready to say it out loud yet. But ${op.sub} ${op.sub === 'they' ? 'are' : 'is'} getting close.`,
          ];
          _suspEvts.push({
            type: 'moleSuspicionTalk', text: _pick(_talkTexts),
            players: [observer, mole.player], badgeText: 'GROWING SUSPICION'
          });
          // Talking spreads suspicion — nearby players gain a small amount
          gs.activePlayers.filter(p => p !== observer && p !== mole.player).forEach(p => {
            if (getBond(observer, p) >= 1 && Math.random() < 0.25) {
              if (!mole.suspicion[p]) mole.suspicion[p] = 0;
              mole.suspicion[p] += 0.2; // word spreads
            }
          });
        }

        // Suspicion >= 2.5 — direct confrontation or trap
        if (susp >= 2.5 && Math.random() < 0.50) {
          if (!mole._suspEvtFired) mole._suspEvtFired = {};
          if (mole._suspEvtFired[observer + '_confront']) return;
          mole._suspEvtFired[observer + '_confront'] = true;
          const _confrontTexts = [
            `${observer} corners ${mole.player} at camp. "I know what you've been doing." ${mole.player} laughs it off. ${observer} doesn't laugh. The tension doesn't break.`,
            `${observer} sets a trap — tells ${mole.player} a fake piece of intel and waits to see where it goes. If it leaks, ${observer} has ${mp.posAdj} proof.`,
            `${observer} brings it up at the fire, in front of everyone. "Something isn't right about ${mole.player}'s game." The tribe shifts uncomfortably. ${mole.player} keeps ${mp.posAdj} face neutral. Barely.`,
            `${observer} confronts ${mole.player} directly. "Every time you're involved in a conversation, someone ends up on the wrong side of the vote. That's not a coincidence." ${mole.player} deflects. ${observer} isn't buying it.`,
          ];
          _suspEvts.push({
            type: 'moleSuspicionConfront', text: _pick(_confrontTexts),
            players: [observer, mole.player], badgeText: 'CONFRONTATION'
          });
          // Confrontation damages bond and spreads suspicion faster
          addBond(observer, mole.player, -0.5);
          gs.activePlayers.filter(p => p !== observer && p !== mole.player).forEach(p => {
            if (Math.random() < 0.35) {
              if (!mole.suspicion[p]) mole.suspicion[p] = 0;
              mole.suspicion[p] += 0.3; // public confrontation — everyone hears it
            }
          });
        }
      });
    }

    // ── GUARANTEED SABOTAGE: Mole always does at least 1-2 acts per episode ──
    // Pick 1-2 sabotage types that are guaranteed to fire (if their gates pass)
    // Remaining types still roll independently at normal rates
    const _availableTypes = ['bondSabotage', 'infoLeak', 'voteDisruption', 'advantageSabotage'];
    const _guaranteedCount = Math.random() < 0.5 ? 2 : 1; // 50% chance of 2 guaranteed
    const _shuffled = _availableTypes.sort(() => Math.random() - 0.5);
    const _guaranteed = new Set(_shuffled.slice(0, _guaranteedCount));

    // ── THREAT ASSESSMENT: who suspects the Mole most? Target them. ──
    const _suspEntries = Object.entries(mole.suspicion).filter(([n, v]) => v >= 0.5 && gs.activePlayers.includes(n));
    _suspEntries.sort((a, b) => b[1] - a[1]);
    const _moleThreat = _suspEntries.length ? _suspEntries[0][0] : null; // most suspicious player
    const _moleThreatLevel = _moleThreat ? mole.suspicion[_moleThreat] : 0;

    // ── BOND SABOTAGE — guaranteed or 30% chance ──
    if (_guaranteed.has('bondSabotage') || Math.random() < 0.30) {
      // Find the Mole's tribe/group
      const _moleTribe = gs.isMerged ? (gs.mergeName || 'merge')
        : gs.tribes.find(t => t.members.includes(mole.player))?.name;
      if (!_moleTribe) return;
      const _tribeMembers = gs.isMerged
        ? gs.activePlayers.filter(p => p !== mole.player)
        : (gs.tribes.find(t => t.name === _moleTribe)?.members || []).filter(p => p !== mole.player);

      // Find two players with bond >= 2 to sabotage
      const _otherMole = coordinated ? gs.moles.find(m => m.player !== mole.player)?.player : null;
      const _candidates = [];
      for (let i = 0; i < _tribeMembers.length; i++) {
        for (let j = i + 1; j < _tribeMembers.length; j++) {
          const a = _tribeMembers[i], b = _tribeMembers[j];
          // Coordinated moles don't sabotage each other
          if (_otherMole && (a === _otherMole || b === _otherMole)) continue;
          if (getBond(a, b) >= 0.5) _candidates.push([a, b]); // low gate — Mole can fabricate conflict between anyone not already enemies
        }
      }
      if (!_candidates.length) return;

      // Pre-merge: Owen mode — random chaos, weaken the tribe
      // Post-merge: Scott mode — surgical, target pairs that threaten the Mole
      let _selectedPair;
      if (gs.isMerged && _candidates.length > 1) {
        // Score each pair: higher = more valuable to sabotage
        const _scored = _candidates.map(([a, b]) => {
          let score = 0;
          const bondAB = getBond(a, b);
          const moleBondA = getBond(mole.player, a);
          const moleBondB = getBond(mole.player, b);
          // Prefer strong pairs (bigger bond = more damage when broken)
          score += bondAB * 0.3;
          // Prefer pairs where neither is the Mole's ally (don't wreck your own network)
          if (moleBondA < 2) score += 0.5;
          if (moleBondB < 2) score += 0.5;
          // Prefer pairs containing players who are threats to the Mole
          const threatA = threatScore(a), threatB = threatScore(b);
          score += (threatA + threatB) * 0.15;
          // Prefer pairs in alliances the Mole isn't part of
          const _moleAlliances = (gs.namedAlliances || []).filter(al => al.active && al.members.includes(mole.player));
          const _moleAllianceMembers = new Set(_moleAlliances.flatMap(al => al.members));
          if (!_moleAllianceMembers.has(a) && !_moleAllianceMembers.has(b)) score += 1.0;
          // Prefer players who have been voting for the Mole (weaken their support)
          const _prevEp = gs.episodeHistory?.[gs.episodeHistory.length - 1];
          if (_prevEp?.voteDetail) {
            const _votedForMole = _prevEp.voteDetail.filter(v => v.target === mole.player).map(v => v.voter);
            if (_votedForMole.includes(a)) score += 0.8;
            if (_votedForMole.includes(b)) score += 0.8;
          }
          // PRIORITY: target pairs involving the most suspicious player — weaken their social network
          if (_moleThreat) {
            if (a === _moleThreat || b === _moleThreat) score += 1.5 + _moleThreatLevel * 0.5;
          }
          return { pair: [a, b], score: score + Math.random() * 0.5 };
        });
        _scored.sort((a, b) => b.score - a.score);
        _selectedPair = _scored[0].pair;
      } else {
        // Pre-merge: random
        _selectedPair = _pick(_candidates);
      }

      const [targetA, targetB] = _selectedPair;
      const ms = pStats(mole.player);
      // Bond damage proportional to Mole's social stat
      const bondDmg = -(ms.social * 0.12 + 0.5);
      addBond(targetA, targetB, bondDmg);

      // Log the sabotage
      mole.sabotageCount++;
      mole.sabotageLog.push({ ep: curEp, type: 'bondSabotage', targets: [targetA, targetB], bondDmg });

      // Erode stealth resistance
      mole.resistance = Math.max(0.15, 0.5 - mole.sabotageCount * 0.03);

      // Inject camp event
      const mp = pronouns(mole.player);
      const pA = pronouns(targetA), pB = pronouns(targetB);
      const _sabTexts = [
        `${mole.player} pulls ${targetA} aside. "You know what ${targetB} said about you?" The quote is fabricated — but ${targetA} doesn't know that. ${pA.PosAdj} expression changes.`,
        `${mole.player} casually mentions to ${targetA} that ${targetB} has been talking about ${pA.obj} behind ${pA.posAdj} back. It's an exaggeration at best, a lie at worst — but the seed is planted.`,
        `At camp, ${mole.player} plays telephone. A minor disagreement between ${targetA} and ${targetB} becomes a full-blown conflict after ${mp.sub} ${mp.sub === 'they' ? 'twist' : 'twists'} the words on both sides.`,
        `${mole.player} approaches ${targetB} with concern. "I'm worried about you — ${targetA} has been saying some things." The empathy is convincing. The information is not.`,
        `${mole.player} sits between ${targetA} and ${targetB} at the fire. By the time ${mp.sub} ${mp.sub === 'they' ? 'leave' : 'leaves'}, both think the other has been plotting against them. Neither confronts the other — they just trust ${mole.player} more.`,
      ];
      if (ep.campEvents[_moleTribe]) {
        const evts = ep.campEvents[_moleTribe].pre || (Array.isArray(ep.campEvents[_moleTribe]) ? ep.campEvents[_moleTribe] : []);
        evts.push({
          type: 'moleBondSabotage', text: _pick(_sabTexts),
          players: [mole.player, targetA, targetB], badgeText: 'MOLE'
        });
      }

      // ── SUSPICION ACCUMULATION — nearby high-intuition players may notice ──
      const _witnesses = _tribeMembers.filter(p => p !== targetA && p !== targetB);
      _witnesses.forEach(w => {
        const wIntuition = pStats(w).intuition;
        // Roll: intuition * 0.04, halved by Mole's resistance
        const suspGain = (wIntuition * 0.04 + pStats(w).mental * 0.015) * (1.1 - mole.resistance);
        if (Math.random() < suspGain) {
          if (!mole.suspicion[w]) mole.suspicion[w] = 0;
          mole.suspicion[w] += 0.4 + mole.sabotageCount * 0.03; // scales with sloppiness
        }
      });
      // The targets themselves might notice the fabrication
      [targetA, targetB].forEach(t => {
        const tIntuition = pStats(t).intuition;
        const suspGain = (tIntuition * 0.04 + pStats(t).mental * 0.015) * (1.1 - mole.resistance);
        if (Math.random() < suspGain) {
          if (!mole.suspicion[t]) mole.suspicion[t] = 0;
          mole.suspicion[t] += 0.4 + mole.sabotageCount * 0.03;
        }
      });

      // ── EXPOSURE CHECK — any observer hits suspicion threshold 3.0? ──
      _checkMoleExposure(mole, ep, _moleTribe);
    }

    // Helper: get Mole's tribe for remaining actions
    const _moleTribe2 = gs.isMerged ? (gs.mergeName || 'merge')
      : gs.tribes.find(t => t.members.includes(mole.player))?.name;
    if (!_moleTribe2) return;
    const _tribeMembers2 = gs.isMerged
      ? gs.activePlayers.filter(p => p !== mole.player)
      : (gs.tribes.find(t => t.name === _moleTribe2)?.members || []).filter(p => p !== mole.player);
    const _otherMole2 = coordinated ? gs.moles.find(m => m.player !== mole.player)?.player : null;

    // NOTE: Challenge throw camp events + suspicion handled in patchEpisodeHistory
    // (checkMoleSabotage runs BEFORE simulateTribeChallenge, so gs._moleChalThrows is empty here)

    // ── INFO LEAK — guaranteed or 30% chance ──
    if (!mole.exposed && (_guaranteed.has('infoLeak') || Math.random() < 0.30)) {
      const _moleAlliances = (gs.namedAlliances || []).filter(a =>
        a.active && a.members.includes(mole.player)
      );
      // Actionable intel: alliance vote targets or idol knowledge (doesn't require Mole's own alliance)
      const _knownIdols = (gs.advantages || []).filter(a =>
        (a.type === 'idol' || a.type === 'legacy' || a.type === 'amulet') &&
        a.holder !== mole.player
      );
      // Pick a leak recipient — someone NOT in the Mole's alliances (or anyone if no alliances)
      const _allianceMembers = new Set(_moleAlliances.flatMap(a => a.members));
      const _leakTargets = _allianceMembers.size
        ? _tribeMembers2.filter(p => !_allianceMembers.has(p) && (_otherMole2 ? p !== _otherMole2 : true))
        : _tribeMembers2.filter(p => (_otherMole2 ? p !== _otherMole2 : true));
      if (_leakTargets.length) {
        const _leakTo = _pick(_leakTargets);
        let _leakInfo, _leakType;
        if (_knownIdols.length && Math.random() < 0.4) {
          // Leak idol knowledge — Mole may have overheard or snooped
          const _idol = _pick(_knownIdols);
          _leakInfo = `${_idol.holder} has a ${_idol.type === 'idol' ? 'Hidden Immunity Idol' : _idol.type}`;
          _leakType = 'idolLeak';
          if (!gs.knownIdolHoldersPersistent) gs.knownIdolHoldersPersistent = new Set();
          gs.knownIdolHoldersPersistent.add(_idol.holder);
        } else if (_moleAlliances.length) {
          // Leak alliance plans
          const _al = _pick(_moleAlliances);
          const _alMembers = _al.members.filter(m => m !== mole.player).slice(0, 3).join(', ');
          _leakInfo = `${_al.name} (${_alMembers}) is targeting someone — watch your back`;
          _leakType = 'allianceLeak';
        } else {
          // No alliance, no idols — fabricate a rumor to stir paranoia
          // PRIORITY: target whoever suspects the Mole — turn others against them
          const _rumorPool = _tribeMembers2.filter(p => p !== _leakTo && (_otherMole2 ? p !== _otherMole2 : true));
          const _rumorTarget = (_moleThreat && _rumorPool.includes(_moleThreat) && Math.random() < 0.7)
            ? _moleThreat
            : _pick(_rumorPool);
          if (_rumorTarget) {
            _leakInfo = `${_rumorTarget} has been talking about making a move — you might be on the wrong side`;
            _leakType = 'fabrication';
            addBond(_leakTo, _rumorTarget, -0.4); // the recipient now distrusts the rumor target
          }
        }
        if (_leakInfo) {
          addBond(mole.player, _leakTo, 0.3); // "helpful" relationship building
          mole.sabotageCount++;
          mole.sabotageLog.push({ ep: curEp, type: 'infoLeak', leakedTo: _leakTo, info: _leakInfo });
          mole.leaks.push({ ep: curEp, leakedTo: _leakTo, info: _leakInfo });
          mole.resistance = Math.max(0.15, 0.5 - mole.sabotageCount * 0.03);

          const mp = pronouns(mole.player);
          const _leakTexts = [
            `${mole.player} pulls ${_leakTo} aside for what looks like a casual chat. By the end, ${_leakTo} knows something ${pronouns(_leakTo).sub} shouldn't: ${_leakInfo}.`,
            `Over the fire, ${mole.player} drops a piece of intel to ${_leakTo}. "Just thought you should know." The tip is real — and it came from ${mp.posAdj} own alliance.`,
            `${mole.player} slips ${_leakTo} a warning. It looks like friendship. It's sabotage.`,
            `"Between you and me," ${mole.player} whispers to ${_leakTo}, "you might want to be careful." The intel is genuine — stolen from ${mp.posAdj} own alliance's plans.`,
            `${mole.player} bonds with ${_leakTo} over shared information. What ${_leakTo} doesn't realize is that this "trust" is a tool — and ${mole.player} just weaponized ${mp.posAdj} own alliance's secrets.`,
          ];
          if (ep.campEvents[_moleTribe2]) {
            const evts = ep.campEvents[_moleTribe2].pre || (Array.isArray(ep.campEvents[_moleTribe2]) ? ep.campEvents[_moleTribe2] : []);
            evts.push({
              type: 'moleInfoLeak', text: _pick(_leakTexts),
              players: [mole.player, _leakTo], badgeText: 'MOLE'
            });
          }
          // Suspicion: if the leaked info comes back around, alliance members notice
          _moleAlliances.forEach(al => {
            al.members.filter(m => m !== mole.player && gs.activePlayers.includes(m)).forEach(m => {
              const suspGain = (pStats(m).intuition * 0.04 + pStats(m).mental * 0.015) * (1.1 - mole.resistance);
              if (Math.random() < suspGain * 0.5) { // harder to trace back
                if (!mole.suspicion[m]) mole.suspicion[m] = 0;
                mole.suspicion[m] += 0.4 + mole.sabotageCount * 0.03;
              }
            });
          });
          _checkMoleExposure(mole, ep, _moleTribe2);
        }
      }
    }

    // ── VOTE DISRUPTION — guaranteed or 30% chance, store for use in simulateVotes ──
    // Flag only — sabotageCount/log NOT incremented here. simulateVotes handles that
    // because we don't know yet if the Mole's tribe goes to tribal (pre-merge).
    if (!mole.exposed && (_guaranteed.has('voteDisruption') || Math.random() < 0.30)) {
      if (!gs._moleVoteDisruption) gs._moleVoteDisruption = [];
      gs._moleVoteDisruption.push(mole.player);
    }

    // ── ADVANTAGE SABOTAGE — guaranteed or 35% chance while holding an advantage ──
    if (!mole.exposed) {
      const _moleAdvs = (gs.advantages || []).filter(a => a.holder === mole.player);
      if (_moleAdvs.length && (_guaranteed.has('advantageSabotage') || Math.random() < 0.35)) {
        const _adv = _pick(_moleAdvs);
        const mp = pronouns(mole.player);
        let _advSabText, _advSabAction;

        if (Math.random() < 0.4) {
          // Leak advantage existence to a rival
          const _rivals = _tribeMembers2.filter(p =>
            getBond(mole.player, p) < 1 && (_otherMole2 ? p !== _otherMole2 : true)
          );
          if (_rivals.length) {
            const _rival = _pick(_rivals);
            _advSabAction = 'leaked';
            const _typeLabel = _adv.type === 'idol' ? 'Hidden Immunity Idol' : _adv.type === 'extraVote' ? 'Extra Vote' : _adv.type === 'voteSteal' ? 'Vote Steal' : _adv.type;
            _advSabText = `${mole.player} "accidentally" lets it slip to ${_rival} that ${mp.sub} ${mp.sub === 'they' ? 'have' : 'has'} a ${_typeLabel}. The leak looks careless. It's calculated — now the wrong people know.`;
            // Mark advantage as known
            if (_adv.type === 'idol') {
              if (!gs.knownIdolHoldersPersistent) gs.knownIdolHoldersPersistent = new Set();
              gs.knownIdolHoldersPersistent.add(mole.player);
            }
          }
        } else if (Math.random() < 0.5) {
          // Plant false idol/advantage location
          _advSabAction = 'falseInfo';
          _advSabText = `${mole.player} plants false information about where an idol might be hidden. A couple of players spend hours searching the wrong spot. ${mp.Sub} ${mp.sub === 'they' ? 'watch' : 'watches'} from a distance.`;
          if (!gs._falseInfoPlanted) gs._falseInfoPlanted = [];
          gs._falseInfoPlanted.push({ planter: mole.player, ep: curEp, type: 'mole' });
        } else {
          // Will waste the play at tribal — flag for checkIdolPlays/checkNonIdolAdvantageUse
          _advSabAction = 'wastePlan';
          _advSabText = `${mole.player} has a plan for ${mp.posAdj} advantage — and it's not a good one. ${mp.Sub} ${mp.sub === 'they' ? 'intend' : 'intends'} to use it at the worst possible moment. Maximum chaos, minimum strategy.`;
          if (!gs._moleAdvWaste) gs._moleAdvWaste = [];
          gs._moleAdvWaste.push(mole.player);
        }

        if (_advSabText) {
          mole.sabotageCount++;
          mole.sabotageLog.push({ ep: curEp, type: 'advantageSabotage', action: _advSabAction, advType: _adv.type });
          mole.resistance = Math.max(0.15, 0.5 - mole.sabotageCount * 0.03);

          if (ep.campEvents[_moleTribe2]) {
            const evts = ep.campEvents[_moleTribe2].pre || (Array.isArray(ep.campEvents[_moleTribe2]) ? ep.campEvents[_moleTribe2] : []);
            evts.push({
              type: 'moleAdvSabotage', text: _advSabText,
              players: [mole.player], badgeText: 'MOLE'
            });
          }
          // Suspicion from advantage sabotage
          _tribeMembers2.forEach(w => {
            const suspGain = (pStats(w).intuition * 0.04 + pStats(w).mental * 0.015) * (1.1 - mole.resistance);
            if (Math.random() < suspGain * 0.3) { // subtle
              if (!mole.suspicion[w]) mole.suspicion[w] = 0;
              mole.suspicion[w] += 0.3 + mole.sabotageCount * 0.02;
            }
          });
          _checkMoleExposure(mole, ep, _moleTribe2);
        }
      }
    }
  });

  // Clear per-episode Mole challenge throw tracking
  delete gs._moleChalThrows;
}

export function _checkMoleExposure(mole, ep, tribeName) {
  const curEp = (gs.episode || 0) + 1;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  for (const [observer, susp] of Object.entries(mole.suspicion)) {
    if (susp < 3.0) continue;
    if (!gs.activePlayers.includes(observer)) continue;

    // EXPOSED!
    mole.exposed = true;
    mole.exposedEp = curEp;
    mole.exposedBy = observer;
    mole.resistance = 1.0;

    // Bond damage: -1.5 with everyone except closest ally
    const closestAlly = gs.activePlayers.filter(p => p !== mole.player)
      .sort((a, b) => getBond(mole.player, b) - getBond(mole.player, a))[0];
    gs.activePlayers.forEach(p => {
      if (p === mole.player || p === closestAlly) return;
      addBond(mole.player, p, -1.5);
    });

    // Heat spike stored for computeHeat
    if (!gs.moleExposedHeat) gs.moleExposedHeat = {};
    gs.moleExposedHeat[mole.player] = curEp;

    // Reveal advantages (mark as public knowledge)
    const _moleAdvs = (gs.advantages || []).filter(a => a.holder === mole.player);
    _moleAdvs.forEach(a => { a.knownBy = 'all'; });

    // Exposure camp event
    const op = pronouns(observer), mp = pronouns(mole.player);
    const _expTexts = [
      `${observer} has been watching. The patterns were too clear — the whispers, the convenient conflicts, the too-good-to-be-true alliance loyalty. ${op.Sub} ${op.sub === 'they' ? 'confront' : 'confronts'} ${mole.player} in front of the tribe. "You've been playing all of us."`,
      `It clicks for ${observer}. Every time something went wrong at camp, ${mole.player} was nearby. Every leaked plan, every fabricated quote — it all traces back. ${op.Sub} ${op.sub === 'they' ? 'don\'t' : 'doesn\'t'} wait for tribal. "We need to talk about ${mole.player}."`,
      `${observer} pulls the tribe together. "I've been keeping track. ${mole.player} has been sabotaging us from the inside." The evidence is damning. ${mole.player} has nowhere to hide.`,
    ];
    // Exposure rendered as dedicated VP screen — no camp event needed
    // Save exposure data to gs for episode history
    if (!gs._moleExposureEvents) gs._moleExposureEvents = [];
    gs._moleExposureEvents.push({ mole: mole.player, exposedBy: observer, ep: curEp, sabotageCount: mole.sabotageCount });

    // If coordinated, spike the other Mole's suspicion
    if (seasonConfig.moleCoordination === 'coordinated' && gs.moles.length === 2) {
      const otherMole = gs.moles.find(m => m.player !== mole.player);
      if (otherMole && !otherMole.exposed) {
        // +0.8 suspicion from all witnesses
        gs.activePlayers.forEach(p => {
          if (p === otherMole.player) return;
          if (!otherMole.suspicion[p]) otherMole.suspicion[p] = 0;
          otherMole.suspicion[p] += 0.8;
        });
      }
    }

    // ── DETECTIVE REWARDS — the player who exposed the Mole gets rewarded ──
    // Bond boost: tribe respects the detective
    gs.activePlayers.forEach(p => {
      if (p === mole.player || p === observer) return;
      addBond(observer, p, 0.5); // everyone trusts the person who figured it out
    });
    // Heat reduction: detective is seen as an ally, not a threat
    if (!gs.moleDetectiveHeatReduction) gs.moleDetectiveHeatReduction = {};
    gs.moleDetectiveHeatReduction[observer] = curEp; // tracked for computeHeat
    // Popularity boost
    if (gs.popularity) {
      gs.popularity[observer] = (gs.popularity[observer] || 0) + 6; // big fan moment
    }

    break; // only one exposure per check
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// VOLUNTEER EXILE DUEL — bold player asks to be voted out to face rival
// ══════════════════════════════════════════════════════════════════════════════
export function checkVolunteerExileDuel(ep) {
  // Prerequisite: exile duel must be active AND someone on exile to duel
  if (!ep.exileDuelActive && !gs.exileDuelPlayer) return;
  if (!gs.exileDuelPlayer) return; // nobody on exile to duel
  const curEp = (gs.episode || 0) + 1;
  if (curEp < 3) return; // too early
  if (!gs._volunteerExileUsed) gs._volunteerExileUsed = new Set();

  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const exileRival = gs.exileDuelPlayer;

  // Check each active player for volunteer motivation
  gs.activePlayers.forEach(name => {
    if (gs._volunteerExileUsed.has(name)) return; // once per game
    if (ep.volunteerDuel) return; // one volunteer per episode
    if (name === ep.immunityWinner || (ep.extraImmune || []).includes(name)) return; // can't volunteer if immune
    const bond = getBond(name, exileRival);
    if (bond > -3) return; // needs genuine rivalry
    const s = pStats(name);
    const chance = s.boldness * 0.015 + (10 - s.temperament) * 0.01;
    if (Math.random() >= chance) return;

    // VOLUNTEER!
    gs._volunteerExileUsed.add(name);
    ep.volunteerDuel = { volunteer: name, rival: exileRival, granted: false, duelResult: null, heatBoost: 8.0, targetBoost: 5.0 };

    // Heat boost — they WANT to be targeted
    if (!gs._volunteerDuelHeat) gs._volunteerDuelHeat = {};
    gs._volunteerDuelHeat[name] = curEp;

    // Camp event
    const mp = pronouns(name);
    const campKey = gs.isMerged ? (gs.mergeName || 'merge')
      : gs.tribes.find(t => t.members.includes(name))?.name;
    if (campKey && ep.campEvents) {
      if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
      const _cd = ep.campEvents[campKey];
      const evts = (typeof _cd === 'object' && !Array.isArray(_cd)) ? (_cd.pre || []) : (Array.isArray(_cd) ? _cd : []);

      const _volTexts = s.temperament <= 4
        ? [
            `${name} stands up at camp. "Vote me out tonight. I want ${exileRival}." The tribe goes silent. ${mp.Sub} ${mp.sub === 'they' ? 'aren\'t' : 'isn\'t'} bluffing.`,
            `"Send me to exile." ${name} says it like ${mp.sub} ${mp.sub === 'they' ? 'have' : 'has'} been thinking about it for days. ${mp.Sub} probably ${mp.sub === 'they' ? 'have' : 'has'}. "I want to look ${exileRival} in the eye and end this."`,
            `${name} loses it at camp. "I'm done waiting. Vote me out. Let me face ${exileRival}. I'll handle this myself." The tribe watches, stunned.`,
          ]
        : [
            `${name} makes the announcement calmly, but the fire behind it is obvious. "I'm volunteering. Send me to the duel. I want ${exileRival}."`,
            `"This is my choice," ${name} tells the tribe. "Vote me out tonight. I'll beat ${exileRival} and I'll come back stronger. Trust me."`,
            `${name} pulls the tribe together. "I know this sounds crazy. But I need to face ${exileRival}. It's personal. Send me."`,
          ];

      evts.push({
        type: 'volunteerExileDuel', text: _pick(_volTexts),
        players: [name, exileRival], badgeText: 'VOLUNTEER DUEL'
      });
    }
  });
}

export function checkSocialPolitics(ep) {
  if (!ep.campEvents) return;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const curEp = (gs.episode || 0) + 1;
  if (!gs.sideDeals) gs.sideDeals = [];
  if (!gs.loyaltyTests) gs.loyaltyTests = [];
  if (!ep._politicsLog) ep._politicsLog = [];

  // ── TEMPERAMENT RECOVERY: high-social players apologize after blowups ──
  const prevEp = gs.episodeHistory?.find(e => e.num === curEp - 1);
  let _apologiesThisEp = 0; // hard cap: at most ONE temperament-recovery apology per episode
  if (prevEp && gs._blowupPlayers?.length) {
    gs._blowupPlayers.forEach(rec => {
      if (_apologiesThisEp >= 1) return; // already used this episode's apology slot
      // Back-compat: older saves stored bare names instead of records.
      if (typeof rec === 'string') rec = { name: rec, type: 'blowup', target: null };
      const name = rec.name;
      if (!gs.activePlayers.includes(name)) return;
      const s = pStats(name);
      // Recovery chance: social determines damage control ability. Kept low on
      // purpose — apologies were over-firing and making everyone sound contrite.
      const recoveryChance = s.social * 0.035 + s.loyalty * 0.01;
      if (Math.random() >= recoveryChance) {
        // No recovery — the damage stands. Most blowups simply don't get patched up.
        return;
      }
      const pr = pronouns(name);
      const sThey = pr.sub === 'they';
      const sV = sThey ? '' : 's';            // 3rd-person-singular verb suffix
      const wasWere = sThey ? 'they were' : (pr.sub === 'she' ? 'she was' : 'he was');
      // Find the most damaged relationship from the blowup
      const tribeMembers = gs.isMerged ? gs.activePlayers : (gs.tribes.find(t => t.members.includes(name))?.members || []);
      const damaged = tribeMembers.filter(m => m !== name && getBond(name, m) < 0)
        .sort((a, b) => getBond(name, a) - getBond(name, b));
      // The person from the actual blowup takes priority — if the rift is still open.
      // Apologize to only ONE person — the actual blowup target if the rift is still
      // open, otherwise the single most-damaged relationship. (Multi-target apologies
      // made players sound like they were on an apology tour every episode.)
      const toRecover = [];
      const realTarget = rec.target && tribeMembers.includes(rec.target) && getBond(name, rec.target) < 0 ? rec.target : null;
      if (realTarget) toRecover.push(realTarget);
      else if (damaged.length) toRecover.push(damaged[0]);
      if (!toRecover.length) return;
      // Recover bond with the apology targets
      const recoveryAmount = s.social * 0.06; // social 10 = +0.6, social 5 = +0.3
      toRecover.forEach(target => addBond(name, target, recoveryAmount));
      const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(name))?.name || 'merge');
      if (ep.campEvents?.[campKey]?.pre) {
        const target = toRecover[0];
        // What the apology is for: the fight with this very person, a meltdown, a social bomb, or a rift to mend.
        const _sorryFor = rec.type === 'fight' && target === realTarget ? 'fight' : rec.type === 'meltdown' ? 'meltdown' : rec.type === 'bomb' ? 'bomb' : 'other';
        Math.random(); // the draw that picked the sentence (the season must not move)
        ep.campEvents[campKey].pre.push(scriptEvent({ type: 'apology', players: [name, target], badgeText: 'MAKING AMENDS', badgeClass: 'green' },
          makeScene('drama.sorry', { a: name, b: target }, { ending: _sorryFor }, [], _spotNow(name, target)), { ep: ep.num, phase: 'pre' }));
        _apologiesThisEp++; // consume this episode's single apology slot
      }
      ep._politicsLog.push(`RECOVERY: ${name} apologized to ${toRecover.join(', ')} for ${rec.type} (+${recoveryAmount.toFixed(1)} bond)`);
    });
    delete gs._blowupPlayers;
  }

  const groups = gs.isMerged
    ? [{ name: gs.mergeName || 'merge', members: [...gs.activePlayers] }]
    : gs.tribes.map(t => ({ name: t.name, members: [...t.members] }));

  let budget = 3 + Math.floor(Math.random() * 3); // 3-5 actions

  groups.forEach(group => {
    const members = group.members;
    if (members.length < 3) return;
    const campKey = group.name;
    const pre = ep.campEvents[campKey]?.pre;
    if (!pre) return;

    // ── SIDE DEALS ──
    if (budget > 0) {
      members.forEach(initiator => {
        if (budget <= 0) return;
        const s = pStats(initiator);
        const dealChance = s.strategic * 0.06 + s.social * 0.02;
        if (Math.random() >= dealChance * 0.15) return; // scale down so not everyone deals every ep
        // Already has 3 deals? Can't make more
        const existingDeals = gs.sideDeals.filter(d => d.active && d.players.includes(initiator));
        if (existingDeals.length >= 3) return;
        // Pick best partner: highest bond, not already in a deal with initiator
        const candidates = members.filter(m => m !== initiator
          && !gs.sideDeals.some(d => d.active && d.players.includes(initiator) && d.players.includes(m)));
        if (!candidates.length) return;
        const partner = wRandom(candidates, p => Math.max(0.1, getBond(initiator, p) * 0.3 + pStats(p).social * 0.05));
        const bond = getBond(initiator, partner);
        // Acceptance check
        const partnerDeals = gs.sideDeals.filter(d => d.active && d.players.includes(partner)).length;
        const acceptChance = bond * 0.08 + pStats(partner).social * 0.03 + (10 - partnerDeals * 3) * 0.05;
        if (Math.random() >= acceptChance) return;
        // Deal forms
        // Genuine check: loyalty makes you honest, strong bond makes it real,
        // multiple deals make each one less genuine, low loyalty makes you a liar
        const _genuineChance = s.loyalty * 0.09 + getBond(initiator, partner) * 0.06
          - (10 - s.loyalty) * 0.02 - existingDeals.length * 0.2;
        const genuine = Math.random() < Math.max(0.15, Math.min(0.95, _genuineChance));
        const dealType = members.length <= 5 ? 'f2' : (Math.random() < 0.3 ? 'f3' : 'f2');
        gs.sideDeals.push({
          players: [initiator, partner], initiator, madeEp: curEp,
          type: dealType, active: true, genuine
        });
        addBond(initiator, partner, 1.0);
        // Non-genuine: create perceived bond gap on partner
        if (!genuine) {
          addPerceivedBond(partner, initiator, getBond(partner, initiator) + 1.5, 'side-deal-fake');
        }
        // A scene, not a sentence (td/script, spec 2026-10-06). The draw that
        // used to pick the sentence stays, so the season does not move.
        Math.random();
        const { spot } = spotOf(ep, initiator, partner, 'pre');
        pre.push(scriptEvent({ type: 'sideDeal', players: [initiator, partner], badgeText: 'SIDE DEAL', badgeClass: 'gold' },
          makeScene('deal.side', { a: initiator, b: partner },
            { ending: genuine ? 'genuine' : 'hollow', size: dealType === 'f2' ? 'two' : 'three' }, [], spot),
          { ep: curEp, phase: 'pre' }));
        ep._politicsLog.push(`DEAL: ${initiator} + ${partner} (${dealType}, genuine=${genuine})`);
        budget--;
      });
    }

    // ── INFO TRADES ──
    if (budget > 0) {
      members.forEach(trader => {
        if (budget <= 0) return;
        const s = pStats(trader);
        const tradeChance = s.intuition * 0.04 + s.strategic * 0.03;
        if (Math.random() >= tradeChance * 0.12) return;
        // Must have knowledge to trade
        const _knownIdols = [...(gs.knownIdolHoldersPersistent || [])].filter(h => h !== trader);
        const _inAlliance = (gs.namedAlliances || []).find(a => a.active && a.members.includes(trader));
        const _knownAdvs = (gs.advantages || []).filter(a => a.holder !== trader &&
          (gs.knownVoteStealHolders?.has(a.holder) || gs.knownVoteBlockHolders?.has(a.holder) || gs.knownSoleVoteHolders?.has(a.holder)));
        if (!_knownIdols.length && !_inAlliance && !_knownAdvs.length) return;
        // Pick trade partner
        const targets = members.filter(m => m !== trader);
        if (!targets.length) return;
        const target = wRandom(targets, p => Math.max(0.1, getBond(trader, p) * 0.06 + (10 - threatScore(p)) * 0.02));
        // False info chance — only deceptive/villainous players plant lies
        const _traderArch = players.find(p => p.name === trader)?.archetype || '';
        const _isDeceptive = _traderArch === 'villain' || _traderArch === 'schemer' || _traderArch === 'mastermind';
        const _falseChance = _isDeceptive
          ? (10 - s.loyalty) * 0.08 + 0.10  // villains/schemers: high base + loyalty scales
          : s.loyalty >= 7 ? 0              // loyal/hero types: never plant false info
          : (10 - s.loyalty) * 0.03;         // average players: very rare, only if low loyalty
        const isFalse = Math.random() < _falseChance;
        // What to trade
        let infoType, infoDetail;
        if (_knownIdols.length && Math.random() < 0.5) {
          infoType = 'idol-holder';
          infoDetail = isFalse ? members.filter(m => !_knownIdols.includes(m) && m !== trader && m !== target)[0] || _knownIdols[0] : _knownIdols[0];
        } else if (_inAlliance && Math.random() < 0.5) {
          infoType = 'alliance-target';
          infoDetail = _inAlliance.name;
        } else {
          infoType = 'general-intel';
          infoDetail = null;
        }
        addBond(trader, target, 0.5);
        addBond(target, trader, 0.5);
        if (isFalse && infoType === 'idol-holder') {
          // Target now "knows" the wrong idol holder
          if (!gs.knownIdolHoldersThisEp) gs.knownIdolHoldersThisEp = new Set();
          gs.knownIdolHoldersThisEp.add(infoDetail);
          // Create perceived bond gap — target trusts liar
          addPerceivedBond(target, trader, getBond(target, trader) + 1.0, 'false-info-trade');
          // Track for blowup detection
          if (!gs._falseInfoPlanted) gs._falseInfoPlanted = [];
          gs._falseInfoPlanted.push({ liar: trader, victim: target, fakeHolder: infoDetail, plantedEp: curEp });
        } else if (!isFalse && infoType === 'idol-holder') {
          if (!gs.knownIdolHoldersThisEp) gs.knownIdolHoldersThisEp = new Set();
          gs.knownIdolHoldersThisEp.add(infoDetail);
        }
        Math.random(); // the draw that picked the sentence (the season must not move)
        // What changed hands, as a scene. A false tip is admitted only in the trader's confessional,
        // so the event no longer hides its badge to keep the secret (it had none at all).
        const _tradeEnding = infoType === 'idol-holder' && infoDetail && infoDetail !== target ? 'idol'
          : infoType === 'alliance-target' ? 'plans' : 'general';
        pre.push(scriptEvent({ type: 'infoTrade', players: [trader, target], badgeText: 'INFO TRADE', badgeClass: 'gold' },
          makeScene('trade.info', { a: trader, b: target },
            { ending: _tradeEnding, result: isFalse ? 'false' : 'true', holder: _tradeEnding === 'idol' ? infoDetail : null,
              group: _tradeEnding === 'plans' ? infoDetail : null }, [], spotOf(ep, trader, target, 'pre').spot),
          { ep: curEp, phase: 'pre' }));
        ep._politicsLog.push(`TRADE: ${trader} → ${target} (${infoType}, false=${isFalse})`);
        budget--;
      });
    }

    // ── LOYALTY TESTS ──
    if (budget > 0) {
      members.forEach(tester => {
        if (budget <= 0) return;
        const s = pStats(tester);
        const testChance = s.strategic * 0.05 + (10 - s.loyalty) * 0.03;
        if (Math.random() >= testChance * 0.08) return;
        // Don't test if already running a test
        if (gs.loyaltyTests.some(t => t.tester === tester && !t.resolved)) return;
        // Pick target: someone you're unsure about
        const targets = members.filter(m => m !== tester);
        if (!targets.length) return;
        const target = wRandom(targets, p => Math.max(0.1, (10 - getBond(tester, p)) * 0.05 + pStats(tester).strategic * 0.03));
        // Counter-detection: target might realize they're being tested
        if (Math.random() < pStats(target).intuition * 0.05) {
          addBond(target, tester, -1.0);
          _pick([0]); // the draw that picked the sentence (the season must not move)
          pre.push(scriptEvent({ type: 'loyaltyTestCaught', players: [target, tester], badgeText: 'TEST CAUGHT', badgeClass: 'red' },
            makeScene('test.caught', { a: target, b: tester }, {}, [], spotOf(ep, target, tester, 'pre').spot), { ep: curEp, phase: 'pre' }));
          ep._politicsLog.push(`TEST CAUGHT: ${tester} tried to test ${target}, caught`);
          budget--;
          return;
        }
        // Plant the test
        const fakeTarget = members.filter(m => m !== tester && m !== target)[Math.floor(Math.random() * (members.length - 2))] || members[0];
        gs.loyaltyTests.push({
          tester, target, falseInfo: `voting for ${fakeTarget}`,
          plantedEp: curEp, resolved: false
        });
        _pick([0]);
        // The lie is the test: tester tells target the vote is fakeTarget, and waits to hear it back.
        pre.push(scriptEvent({ type: 'loyaltyTest', players: [tester, target], badgeText: 'LOYALTY TEST', badgeClass: 'gold' },
          makeScene('test.plant', { a: tester, b: target }, { target: fakeTarget !== tester && fakeTarget !== target ? fakeTarget : null,
            ending: fakeTarget !== tester && fakeTarget !== target ? 'named' : 'vague' }, [], spotOf(ep, tester, target, 'pre').spot),
          { ep: curEp, phase: 'pre' }));
        ep._politicsLog.push(`TEST: ${tester} → ${target} (planted false info about ${fakeTarget})`);
        budget--;
      });
    }
  });

  // ── LOYALTY TEST RESOLUTION: check pending tests ──
  gs.loyaltyTests.filter(t => !t.resolved).forEach(test => {
    const epsSincePlant = curEp - test.plantedEp;
    if (epsSincePlant < 1) return; // give it at least 1 episode
    if (!gs.activePlayers.includes(test.tester) || !gs.activePlayers.includes(test.target)) {
      test.resolved = true; return;
    }
    const targetS = pStats(test.target);
    const spreadChance = (10 - targetS.loyalty) * 0.06 + targetS.social * 0.02;
    const spread = Math.random() < spreadChance;
    if (spread) {
      test.resolved = true;
      addBond(test.tester, test.target, -1.5);
      const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(test.tester))?.name || 'merge');
      if (ep.campEvents?.[campKey]?.pre) {
        _pick([0]);
        ep.campEvents[campKey].pre.push(scriptEvent({ type: 'loyaltyTestFailed', players: [test.tester, test.target], badgeText: 'FAILED TEST', badgeClass: 'red' },
          makeScene('test.failed', { a: test.tester, b: test.target }, {}, [], { id: 'confessional', label: 'Confessional' }), { ep: curEp, phase: 'pre' }));
      }
      ep._politicsLog.push(`TEST FAILED: ${test.target} leaked (planted ep ${test.plantedEp})`);
    } else if (epsSincePlant >= 2) {
      test.resolved = true;
      addBond(test.tester, test.target, 0.8);
      const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(test.tester))?.name || 'merge');
      if (ep.campEvents?.[campKey]?.pre) {
        _pick([0]);
        ep.campEvents[campKey].pre.push(scriptEvent({ type: 'loyaltyTestPassed', players: [test.tester, test.target], badgeText: 'TRUST EARNED', badgeClass: 'green' },
          makeScene('test.passed', { a: test.tester, b: test.target }, {}, [], { id: 'confessional', label: 'Confessional' }), { ep: curEp, phase: 'pre' }));
      }
      ep._politicsLog.push(`TEST PASSED: ${test.target} kept quiet (planted ep ${test.plantedEp})`);
    }
  });
}

// ── Side Deal Breaks: detect when someone votes against their deal partner ──
export function checkSideDealBreaks(ep) {
  if (!gs.sideDeals?.length || !ep.votingLog?.length) return;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const curEp = (gs.episode || 0) + 1;

  ep.votingLog.forEach(v => {
    if (!v.voter || v.voter === 'THE GAME' || !v.voted) return;
    gs.sideDeals.filter(d => d.active && d.players.includes(v.voter)).forEach(deal => {
      const partner = deal.players.find(p => p !== v.voter);
      if (v.voted !== partner) return; // didn't vote against partner
      // Deal broken
      deal.active = false;
      deal.brokenEp = curEp;
      deal.brokenBy = v.voter;
      deal.brokenAgainst = partner;
      deal.breakReason = 'voted against endgame partner';
      addBond(partner, v.voter, -2.0);
      recordBetrayal(partner, v.voter, { severity:1.35, applyWarmth:false, ep:curEp });
      // Emotional state shift
      if (gs.playerStates?.[partner]) {
        const _pBond = getBond(partner, v.voter);
        gs.playerStates[partner].emotional = _pBond <= -2 ? 'desperate' : 'paranoid';
      }
      // Camp event next episode (saved on gs for pickup)
      if (!gs._brokenDeals) gs._brokenDeals = [];
      gs._brokenDeals.push({ breaker: v.voter, partner, deal, ep: curEp });
    });
  });
}

// ── Conflicting Deal Detection: multiple F2 deals get discovered ──
export function checkConflictingDeals(ep) {
  if (!gs.sideDeals?.length) return;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const curEp = (gs.episode || 0) + 1;

  // Find players with 2+ active deals
  const dealCounts = {};
  gs.sideDeals.filter(d => d.active).forEach(d => {
    d.players.forEach(p => { dealCounts[p] = (dealCounts[p] || 0) + 1; });
  });

  Object.entries(dealCounts).forEach(([player, count]) => {
    if (count < 2) return;
    if (!gs.activePlayers.includes(player)) return;
    // Each partner rolls intuition to discover the double-dealing
    const deals = gs.sideDeals.filter(d => d.active && d.players.includes(player));
    deals.forEach(deal => {
      const partner = deal.players.find(p => p !== player);
      if (!gs.activePlayers.includes(partner)) return;
      const discoverChance = pStats(partner).intuition * 0.03;
      if (Math.random() >= discoverChance) return;
      // Discovered!
      addBond(partner, player, -2.5);
      deal.active = false;
      deal.brokenEp = curEp;
      deal.brokenBy = player;
      deal.brokenAgainst = partner;
      deal.breakReason = 'conflicting endgame promises were exposed';
      recordBetrayal(partner, player, { severity:1.1, applyWarmth:false, ep:curEp });
      const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(player))?.name || 'merge');
      if (ep.campEvents?.[campKey]?.pre) {
        const otherPartners = deals.filter(d => d !== deal && d.active).map(d => d.players.find(p => p !== player)).filter(Boolean);
        _pick([0]);
        // Face to face when they share a camp; otherwise the partner tells the camera.
        const _sameCamp = gs.isMerged || gs.tribes.some(t => t.members.includes(partner) && t.members.includes(player));
        ep.campEvents[campKey].pre.push(scriptEvent({ type: 'conflictingDeals', players: [partner, player, ...(otherPartners.slice(0, 1))], badgeText: 'DOUBLE DEALER', badgeClass: 'red' },
          makeScene('deal.double', { a: partner, b: player }, { ending: _sameCamp ? 'confront' : 'alone', other: otherPartners[0] || null }, [],
            _sameCamp ? spotOf(ep, partner, player, 'pre').spot : { id: 'confessional', label: 'Confessional' }),
          { ep: curEp, phase: 'pre' }));
      }
    });
  });
}

// ── False Info Blowup: when planted lies get exposed ──
export function checkFalseInfoBlowup(ep) {
  if (!gs._falseInfoPlanted?.length) return;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const curEp = (gs.episode || 0) + 1;
  // Check each false info plant — was the "idol holder" voted for but didn't play an idol?
  for (let i = gs._falseInfoPlanted.length - 1; i >= 0; i--) {
    const plant = gs._falseInfoPlanted[i];
    if (!gs.activePlayers.includes(plant.victim)) { gs._falseInfoPlanted.splice(i, 1); continue; }
    if (!gs.activePlayers.includes(plant.liar)) { gs._falseInfoPlanted.splice(i, 1); continue; }
    // High-mental victims may catch the lie before acting on it — mental * 0.03 chance to avoid the trap
    const _victimMental = pStats(plant.victim).mental;
    if (Math.random() < _victimMental * 0.03) { gs._falseInfoPlanted.splice(i, 1); continue; } // saw through it
    // Did the victim vote for the fake idol holder this episode?
    const _victimVote = ep.votingLog?.find(v => v.voter === plant.victim);
    if (!_victimVote || _victimVote.voted !== plant.fakeHolder) continue;
    // Did the fake holder NOT play an idol?
    const _holderPlayedIdol = ep.idolPlays?.some(p => p.player === plant.fakeHolder);
    if (_holderPlayedIdol) continue; // they actually had one — the info was accidentally right
    // BLOWUP — the lie is exposed
    const pr = pronouns(plant.liar);
    const vPr = pronouns(plant.victim);
    // Bond damage: victim → liar
    addBond(plant.victim, plant.liar, -3.0);
    // Tribe-wide credibility hit: everyone at tribal loses trust in the liar
    const _tribal = ep.tribalPlayers || gs.activePlayers;
    _tribal.filter(p => p !== plant.liar && p !== plant.victim).forEach(p => {
      addBond(p, plant.liar, -0.5);
    });
    // Camp event
    const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (ep.loser?.name || gs.tribes[0]?.name || 'merge');
    if (ep.campEvents?.[campKey]?.post) {
      ep.campEvents[campKey].post.push({
        type: 'falseInfoBlowup', players: [plant.victim, plant.liar],
        text: _pick([
          `${plant.victim} voted ${plant.fakeHolder} to flush an idol that didn't exist. The info came from ${plant.liar}. ${plant.victim} hasn't said a word to ${plant.liar} since.`,
          `The lie traced back. ${plant.liar} told ${plant.victim} that ${plant.fakeHolder} had an idol. ${plant.fakeHolder} didn't. ${plant.victim} wasted ${vPr.pos} vote. The trust is gone.`,
          `${plant.victim} figured it out. ${plant.liar} planted false information. The idol was never real. The alliance might not be either.`,
        ]),
        badgeText: 'LIE EXPOSED', badgeClass: 'red'
      });
    }
    // Remove the plant — it's resolved
    gs._falseInfoPlanted.splice(i, 1);
    // Perceived bond correction
    const pbKey = plant.victim + '→' + plant.liar;
    if (gs.perceivedBonds?.[pbKey]) delete gs.perceivedBonds[pbKey];
  }
}

export function checkComfortBlindspot(ep) {
  if (!ep.campEvents) return;
  const groups = gs.isMerged
    ? [{ name: gs.mergeName || 'merge', members: gs.activePlayers }]
    : gs.tribes.map(t => ({ name: t.name, members: [...t.members] }));

  groups.forEach(group => {
    const campKey = gs.isMerged ? 'merge' : group.name;
    if (!ep.campEvents[campKey]) return;

    // Candidates: comfortable players with low boldness + strategic
    const candidates = group.members.filter(p => {
      const state = getPlayerState(p);
      const s = pStats(p);
      return state.emotional === 'comfortable' && s.boldness < 6 && s.strategic < 6;
    });
    if (!candidates.length) return;

    // Heat proxy: low avg-bond from tribe + known blowup heat = more in danger than they realise
    const heatProxy = p => {
      const others = group.members.filter(m => m !== p);
      const avgBond = others.length
        ? others.reduce((sum, m) => sum + getBond(m, p), 0) / others.length
        : 0;
      return threatScore(p) * 0.3 - avgBond * 0.5 + (gs.blowupHeatNextEp?.has(p) ? 1 : 0);
    };
    const heatLeader = candidates.reduce((best, p) => heatProxy(p) > heatProxy(best) ? p : best, candidates[0]);

    // ~25% chance per episode
    if (Math.random() >= 0.25) return;

    // Observer: intuitive tribemate who notices the checked-out player
    const observers = group.members.filter(p => p !== heatLeader && pStats(p).intuition >= 6);
    if (!observers.length) return;
    const observer = observers[Math.floor(Math.random() * observers.length)];

    Math.random(); Math.random(); // the two draws that picked the sentences (the season must not move)
    ep.campEvents[campKey].pre.push(
      scriptEvent({ type: 'comfortBlindspot', players: [heatLeader, observer], badgeText: 'TOO COMFORTABLE', badgeClass: 'red' },
        makeScene('blind.comfy', { a: observer, b: heatLeader }, {}, [], { id: 'confessional', label: 'Confessional' }), { ep: ep.num, phase: 'pre' }),
      scriptEvent({ type: 'clockingIt', players: [observer], badgeText: 'CLOCKED', badgeClass: 'red' },
        makeScene('blind.clock', { a: observer, b: heatLeader }, {}, [], spotOf(ep, observer, heatLeader, 'pre').spot), { ep: ep.num, phase: 'pre' })
    );
    ep.comfortBlindspotPlayer = heatLeader;
  });
}

export function generateCampEvents(ep, phase = 'both') {
  // Build the physical access layer before scenes are generated. This records
  // where contestants actually were; strategy modules may query the same
  // schedule without owning or duplicating venue logic.
  if (phase === 'both') {
    buildCampAccessSchedule(ep, 'pre');
    buildCampAccessSchedule(ep, 'post');
  } else {
    buildCampAccessSchedule(ep, phase);
  }
  // Clear per-episode camp event heat flags
  gs.injuredThisEp    = new Set();
  gs.scramblingThisEp = new Set();
  gs.beastDrillsThisEp = new Set();
  gs.lieTargetsThisEp  = new Set();
  delete gs._scrambleActivations;

  const idolFinds = ep.idolFinds || [];
  const allTwists = ep.twists?.length ? ep.twists : (ep.twist ? [ep.twist] : []);

  // ── Build twist-driven event weight boosts ──
  const boosts = {};
  const boost = (id, amount) => { boosts[id] = (boosts[id] || 0) + amount; };

  allTwists.forEach(tw => {
    if (!tw?.type) return;
    switch (tw.type) {
      case 'tribe-swap':
      case 'tribe-dissolve':
      case 'tribe-expansion':
      case 'abduction':
      case 'kidnapping':
        // New faces, new pecking order — bonding + power struggle
        boost('tdBond', 30); boost('bond', 20);
        boost('leadershipClash', 25); boost('dispute', 15);
        boost('eavesdrop', 15); boost('doubt', 15);
        boost('idolSearch', 15); // new camps = new idol locations
        break;
      case 'mutiny':
        // Someone left — those who stayed are rattled
        boost('fight', 25); boost('dispute', 20);
        boost('leadershipClash', 20); boost('confessional', 15);
        boost('rumor', 15);
        break;
      case 'journey':
        // Players came back changed — strategy shifts, others paranoid
        boost('tdStrategy', 25); boost('doubt', 20);
        boost('confessional', 20); boost('eavesdrop', 15);
        boost('rumor', 15); // those who didn't go want to know what happened
        break;
      case 'exile-island':
        // Exiled player missed everything — isolation and paranoia on return
        boost('doubt', 25); boost('confessional', 20);
        boost('rumor', 20); boost('eavesdrop', 15);
        break;
      case 'loved-ones':
        // Emotional episode — homesick guaranteed, comfort and bonding up
        boost('homesick', 80); boost('comfort', 40);
        boost('tdBond', 30); boost('confessional', 25);
        boost('doubt', 15); // seeing family can crack your resolve
        break;
      case 'the-feast':
      case 'merge-reward':
        // Shared food, cross-tribe bonding — alliances form across lines
        boost('tdBond', 35); boost('bond', 25);
        boost('flirtation', 20); boost('tdStrategy', 20);
        boost('foodConflict', -20); // plenty to eat — no scarcity conflict
        break;
      case 'reward-challenge':
      case 'reward-twist-challenge':
        // Winners bond on reward; those left behind stew
        boost('tdBond', 20); boost('dispute', 15);
        boost('rumor', 10); boost('doubt', 10);
        break;
      case 'double-elim':
      case 'double-tribal':
        // Chaos — everyone is stressed, paranoia is high
        boost('doubt', 30); boost('confessional', 25);
        boost('comfort', 20); boost('tdStrategy', 20);
        boost('fight', 15);
        break;
      case 'returning-player': {
        // Disruption — existing alliances rattled, scheming to handle returners
        const _rpCount = tw.returnees?.length || 1;
        boost('tdStrategy', 30 * _rpCount); boost('dispute', 25 * _rpCount);
        boost('eavesdrop', 20 * _rpCount); boost('leadershipClash', 15 * _rpCount);
        boost('rumor', 15 * _rpCount);
        break;
      }
      case 'cultural-reset':
        // Everything is exposed — alliances public, people scrambling
        boost('dispute', 30); boost('leadershipClash', 25);
        boost('tdStrategy', 25); boost('fight', 20);
        boost('doubt', 20); boost('confessional', 20);
        break;
      case 'slasher-night':
        // Someone was eliminated in the night — camp is shaken
        boost('doubt', 35); boost('confessional', 30);
        boost('rumor', 25); boost('homesick', 15);
        boost('weirdMoment', 15); // paranoia makes people act strange
        break;
      case 'triple-dog-dare':
        // Dare challenge aftermath — drama, doubt, strategic talk
        boost('doubt', 30); boost('confessional', 30);
        boost('strategicTalk', 25); boost('rumor', 20);
        break;
      case 'say-uncle':
        boost('doubt', 25); boost('confessional', 30);
        boost('strategicTalk', 20); boost('fight', 15);
        break;
      case 'brunch-of-disgustingness':
        // Social chaos — gender split + eating stress + blame game
        boost('dispute', 30); boost('tdStrategy', 25);
        boost('confessional', 25); boost('fight', 20);
        boost('doubt', 15); boost('rumor', 15);
        break;
      case 'phobia-factor':
        boost('confessional', 35); boost('vulnerability', 25);
        boost('bond', 20); boost('doubt', 15);
        break;
      case 'auction':
        // After an auction — well-fed players are social; strategic players are thinking about advantages
        boost('tdBond', 20); boost('comfort', 25); boost('flirtation', 15);
        boost('tdStrategy', 20); boost('confessional', 15);
        boost('fight', -10); // less tension — people got what they needed
        break;
      case 'elimination-swap':
        // Chaos — alliances scrambled, strangers arriving at camp
        boost('doubt', 30); boost('tdStrategy', 25); boost('dispute', 20);
        boost('eavesdrop', 20); boost('scramble', 25); boost('rumor', 15);
        break;
      case 'exile-duel':
        // Someone just escaped elimination — survivors relieved, but watching
        boost('confessional', 20); boost('comfort', 15); boost('doubt', 20);
        boost('tdStrategy', 15); boost('rumor', 15);
        break;
      case 'no-tribal':
        // Relaxed episode — more flavor, less strategy stress
        boost('tdBond', 25); boost('flirtation', 20);
        boost('prank', 20); boost('weirdMoment', 20);
        boost('confessional', 15);
        boost('fight', -15); boost('dispute', -10); // lower tension
        break;
      case 'rock-draw':
        // Rock draw means chaos next tribal — paranoia up in advance
        boost('doubt', 25); boost('confessional', 20);
        boost('rumor', 15);
        break;
    }
  });

  // ── Rock draw AFTERMATH (previous episode was a rock draw) ──
  const prevEp = gs.episodeHistory.find(e => e.num === ep.num - 1);
  if (prevEp?.isRockDraw) {
    boost('doubt', 25); boost('confessional', 20);
    boost('homesick', 15); boost('comfort', 15);
    boost('weirdMoment', 10); // people are still processing the chaos
  }

  // (Post-save aftermath injected after pre events are generated — see below)
  // ── Emotional state boosts — driven by current player mental states ──
  if (gs.playerStates) {
    const paranoidN    = gs.activePlayers.filter(p => getPlayerState(p).emotional === 'paranoid').length;
    const desperateN   = gs.activePlayers.filter(p => getPlayerState(p).emotional === 'desperate').length;
    const uneasyN      = gs.activePlayers.filter(p => getPlayerState(p).emotional === 'uneasy').length;
    const calculatingN = gs.activePlayers.filter(p => getPlayerState(p).emotional === 'calculating').length;
    const comfortableN = gs.activePlayers.filter(p => ['comfortable', 'content'].includes(getPlayerState(p).emotional)).length;
    if (paranoidN >= 2) { boost('paranoia', paranoidN * 7); boost('scramble', paranoidN * 5); boost('watchingYou', paranoidN * 5); boost('readingRoom', paranoidN * 4); }
    if (desperateN >= 1) { boost('scramble', desperateN * 10); boost('sideDeal', desperateN * 8); boost('bigMoveThoughts', desperateN * 7); boost('paranoia', desperateN * 5); }
    if (uneasyN >= 2) { boost('paranoia', uneasyN * 4); boost('scramble', uneasyN * 3); boost('watchingYou', uneasyN * 3); }
    if (calculatingN >= 1) { boost('bigMoveThoughts', calculatingN * 8); boost('sideDeal', calculatingN * 6); boost('allianceCrack', calculatingN * 4); }
    if (comfortableN >= 3) boost('overconfidence', comfortableN * 5);
  }
  if (gs.namedAlliances?.some(a => a.active && (ep.num - a.formed) >= 5)) { boost('allianceCrack', 12); boost('sideDeal', 8); }
  if (gs.isMerged && gs.activePlayers.length <= 8) { boost('bigMoveThoughts', 15); boost('allianceCrack', 12); boost('sideDeal', 10); }
  // Boost alliance formation when alliances are thin post-merge
  if (gs.isMerged) {
    const _activeAlliances = (gs.namedAlliances || []).filter(a => a.active && a.members.filter(m => gs.activePlayers.includes(m)).length >= 2);
    const _unallied = gs.activePlayers.filter(p => !_activeAlliances.some(a => a.members.includes(p)));
    if (_activeAlliances.length <= 2) boost('allianceForm', 20); // few alliances left — new ones should form
    if (_unallied.length >= 2) boost('allianceForm', _unallied.length * 5); // free agents need alliances
  }

  // ── Per-group event count: total split across pre and post ──
  // Coaches live at camp even though they never compete or vote, so the camp
  // group is campRoster(), not tribe.members. Using tribe.members here made a
  // coach ineligible for all 110 event types and invisible in every sentence
  // the season generated about their own tribe.
  const getGroupPresent = (tribe) => {
    const name = tribe.name ?? tribe.tribeName;
    const roster = campRoster(name, tribe.members);
    return gs.exiledThisEp ? roster.filter(m => m !== gs.exiledThisEp) : roster;
  };
  const totalForGroup = (present) => Math.floor(Math.random() * 5) + Math.max(8, Math.floor(present.length * 1.4));

  // ── PRE-CHALLENGE phase: initialize structure, fill pre events ──
  if (phase === 'pre' || phase === 'both') {
    if (gs.phase === 'pre-merge' && gs.tribes.length > 0) {
      if (!ep.campEvents) ep.campEvents = {};
      gs.tribes.forEach(tribe => {
        const present = getGroupPresent(tribe);
        const total = totalForGroup(present);
        const preCount = phase === 'both' ? total : Math.ceil(total / 2);
        // Merge tribe-specific gift boosts (from Three Gifts Gift 1) into the base boosts
        const tribeBoosts = ep.giftTribeBoosts?.[tribe.name]
          ? (() => { const tb = { ...boosts }; Object.entries(ep.giftTribeBoosts[tribe.name]).forEach(([k,v]) => { tb[k] = (tb[k]||0) + v; }); return tb; })()
          : boosts;
        const preEvents = withSceneCtx({ ep: ep.num, phase: 'pre' }, () => generateCampEventsForGroup(present, idolFinds, tribeBoosts, preCount));
        // Prepend gift return narrative as the first camp event for this tribe
        if (ep.giftNarrativeEvents?.[tribe.name]) preEvents.unshift(ep.giftNarrativeEvents[tribe.name]);
        if (ep.twistNarrativeEvents?.[tribe.name]) preEvents.unshift(ep.twistNarrativeEvents[tribe.name]);
        const _existingPre = ep.campEvents[tribe.name]?.pre || [];
        const _existingPost = ep.campEvents[tribe.name]?.post || [];
        ep.campEvents[tribe.name] = { pre: [..._existingPre, ...preEvents], post: [..._existingPost] };

        // ── PRE-MERGE SPECIFIC EVENTS: drama unique to small tribal camps ──
        const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
        const pre = preEvents;

        // Challenge pressure: if this tribe lost last episode, anxiety builds
        const _prevLoss = gs.episodeHistory?.find(h => h.num === ep.num - 1);
        if (_prevLoss?.tribalTribe === tribe.name && Math.random() < 0.50) {
          const _cpSpeaker = present[Math.floor(Math.random() * present.length)];
          const _cpP = pronouns(_cpSpeaker);
          pre.push({ type: 'strategicTalk', players: present, text: _rp([
            `The mood at ${tribe.name} is heavy. They lost last time and everyone knows what another loss means. ${_cpSpeaker} says it out loud: "We can't afford to go back there."`,
            `${_cpSpeaker} addresses the tribe. "We lose again, one of us goes home. That's the reality." Nobody argues. Nobody has to.`,
            `${tribe.name} is on edge. The last vote is still fresh. ${_cpSpeaker} tries to rally the group: "We need this one. No excuses." The tribe nods. Whether they believe it is another question.`,
            `Camp is quiet this morning. Last tribal took something out of ${tribe.name}. ${_cpSpeaker} breaks the silence: "We're not going back. Not tonight."`,
          ]) });
        }

        // Cross-tribe rivalry speculation
        if (gs.tribes.length >= 2 && Math.random() < 0.25) {
          const _otherTribe = gs.tribes.filter(t => t.name !== tribe.name)[Math.floor(Math.random() * (gs.tribes.length - 1))];
          const _speculator = present[Math.floor(Math.random() * present.length)];
          if (_otherTribe) {
            pre.push({ type: 'strategicTalk', players: [_speculator], text: _rp([
              `${_speculator} wonders aloud what's happening at ${_otherTribe.name} camp. "You think they're falling apart over there?" The tribe laughs. But they're all thinking the same thing.`,
              `${_speculator} brings up ${_otherTribe.name} at the fire. "They looked off at the challenge. Something's going on over there." The speculation fuels the tribe's confidence.`,
              `"I bet ${_otherTribe.name} is a mess right now." ${_speculator} says it with a grin. Nobody disagrees. Whether it's true or not, believing it helps.`,
              `The tribe talks about ${_otherTribe.name} more than their own game tonight. ${_speculator} starts it: "Did you see their faces?" It becomes the camp's favorite topic.`,
            ]) });
          }
        }

        // Underdog rally: small tribe or tribe that's been losing rallies together
        if (present.length <= 4 && Math.random() < 0.35) {
          const _rallier = present.reduce((best, p) => pStats(p).social + pStats(p).loyalty > pStats(best).social + pStats(best).loyalty ? p : best, present[0]);
          const _raP = pronouns(_rallier);
          pre.push({ type: 'bond', players: present, text: _rp([
            `${_rallier} gathers the tribe. "We're small. That means every single person here matters. We go out there and we fight." It's not a speech — it's a promise.`,
            `${tribe.name} is outnumbered and they know it. ${_rallier} turns that into fuel. "They think we're done. Let's make them wrong." The energy shifts.`,
            `${_rallier} sits the tribe down. "I know the numbers aren't great. But look around — everyone here is still fighting. That counts for something." It does.`,
            `The fire is low and the tribe is smaller than ever. ${_rallier} keeps it burning. Not the fire — the belief that they can still do this.`,
          ]) });
          present.forEach(p => { if (p !== _rallier) addBond(p, _rallier, 0.3); });
        }

        // New arrival / tribe reshuffle events
        const _swapTw = (ep.twists || []).find(t => ['tribe-swap','tribe-dissolve','abduction','mutiny','kidnapping'].includes(t.type));
        if (_swapTw) {
          const _prevTribes = gs.episodeHistory?.find(h => h.num === ep.num - 1)?.gsSnapshot?.tribes || [];
          const _prevMembers = _prevTribes.find(t => t.name === tribe.name)?.members || [];
          const _newArrivals = present.filter(p => !_prevMembers.includes(p));
          const _originals = present.filter(p => _prevMembers.includes(p));
          const _isFullReshuffle = _newArrivals.length >= present.length * 0.5; // half or more are new = full swap

          if (_isFullReshuffle && _newArrivals.length >= 2) {
            // Full tribe swap: everyone cautious — small universal bond penalty
            present.forEach(a => present.forEach(b => {
              if (a < b && !_prevMembers.includes(a) !== !_prevMembers.includes(b)) addBond(a, b, -0.3);
            }));
            if (Math.random() < 0.60) {
              pre.push({ type: 'strategicTalk', players: present, text: _rp([
                `New tribe. New faces. The first day at ${tribe.name} is a chess match disguised as small talk. Everyone is sizing each other up.`,
                `${tribe.name} camp feels different with the new blood. Old alliances mean nothing here — or everything. Nobody knows which yet.`,
                `The swap changed the numbers, the relationships, and the pecking order at ${tribe.name}. The first conversations are careful. Nobody shows their hand.`,
                `${tribe.name} is a brand new tribe in everything but name. The camp is the same. The people aren't. The game starts over.`,
              ]) });
            }
            // Originals vs newcomers tension — originals bond tighter, newcomers scramble
            if (_originals.length >= 2 && _newArrivals.length >= 2 && Math.random() < 0.45) {
              // Originals consolidate
              for (let _oi = 0; _oi < _originals.length; _oi++)
                for (let _oj = _oi+1; _oj < _originals.length; _oj++) addBond(_originals[_oi], _originals[_oj], 0.5);
              // Newcomers try to bond with each other
              for (let _ni = 0; _ni < _newArrivals.length; _ni++)
                for (let _nj = _ni+1; _nj < _newArrivals.length; _nj++) addBond(_newArrivals[_ni], _newArrivals[_nj], 0.3);
              const _origNames = _originals.slice(0, 2).join(' and ');
              const _newNames = _newArrivals.slice(0, 2).join(' and ');
              pre.push({ type: 'doubt', players: [..._originals.slice(0,2), ..._newArrivals.slice(0,2)], text: _rp([
                `The originals — ${_origNames} — already have a rhythm at camp. The newcomers — ${_newNames} — are watching from the outside.`,
                `There's a line between who was here before and who just arrived. ${_origNames} know the camp. ${_newNames} know nothing except they need allies fast.`,
                `${_origNames} have home-court advantage. ${_newNames} have fresh perspective. Neither lasts — but right now, both matter.`,
                `The first meal at the new ${tribe.name} is tense. ${_origNames} serve. ${_newNames} accept. The power dynamic is silent but everyone feels it.`,
              ]) });
            }
            // Cross-tribe intel: newcomer bonds with tribe by sharing info, reveals idol holders
            if (_newArrivals.length >= 1 && Math.random() < 0.40) {
              const _intelSource = _newArrivals[Math.floor(Math.random() * _newArrivals.length)];
              const _iP = pronouns(_intelSource);
              // Real consequence: intel source gains trust with originals
              _originals.forEach(o => addBond(_intelSource, o, 0.6));
              // Chance to expose an idol holder from the other tribe
              const _otherTribes = gs.tribes.filter(t => t.name !== tribe.name);
              const _otherIdolHolder = gs.advantages.find(a => a.type === 'idol' && _otherTribes.some(t => t.members.includes(a.holder)));
              if (_otherIdolHolder && Math.random() < 0.35) {
                if (!gs.knownIdolHoldersThisEp) gs.knownIdolHoldersThisEp = new Set();
                gs.knownIdolHoldersThisEp.add(_otherIdolHolder.holder);
              }
              pre.push({ type: 'eavesdrop', players: [_intelSource], text: _rp([
                `${_intelSource} has information about the other tribe that ${tribe.name} didn't have before. Whether ${_iP.sub} ${_iP.sub==='they'?'share':'shares'} it — and how much — is ${_iP.posAdj} first strategic decision.`,
                `The tribe wants to know what was happening at ${_intelSource}'s old camp. ${_intelSource} gives them enough to seem useful. Not enough to seem dangerous.`,
                `${_intelSource} knows who has idols, who's on the bottom, and who's been lying on the other side. That knowledge is currency.`,
                `${_intelSource} drops a piece of information at camp — casually, like it doesn't matter. It does.`,
              ]) });
            }
          } else {
            // 1-2 newcomers into existing group: individual integration with real bond consequences
            _newArrivals.forEach(newcomer => {
              if (Math.random() < 0.55) {
                const _ncP = pronouns(newcomer);
                const _ncBondAvg = present.filter(m => m !== newcomer).reduce((s,m) => s + getBond(newcomer,m), 0) / Math.max(1, present.length - 1);
                if (_ncBondAvg >= 1) {
                  // Good integration: bonds grow with new tribe
                  present.filter(m => m !== newcomer).forEach(m => addBond(newcomer, m, 0.4));
                } else if (_ncBondAvg <= -1) {
                  // Bad integration: outsider status worsens
                  present.filter(m => m !== newcomer).forEach(m => addBond(newcomer, m, -0.3));
                  if (gs.playerStates?.[newcomer]) gs.playerStates[newcomer].emotional = 'uneasy';
                }
                // Neutral: no bond change, just observing
                const _ncText = _ncBondAvg >= 1 ? _rp([
                  `${newcomer} is settling in faster than expected. ${_ncP.Sub} already ${_ncP.sub==='they'?'have':'has'} inside jokes with half the tribe.`,
                  `${newcomer} fits. ${_ncP.Sub} ${_ncP.sub==='they'?'contribute':'contributes'} at camp, ${_ncP.sub} ${_ncP.sub==='they'?'listen':'listens'} at strategy talks. The new tribemates are warming up.`,
                  `${newcomer} brings an energy ${tribe.name} didn't know it needed. By sundown, ${_ncP.sub} ${_ncP.sub==='they'?'feel':'feels'} less like an outsider and more like a missing piece.`,
                ]) : _ncBondAvg <= -1 ? _rp([
                  `${newcomer} hasn't found ${_ncP.pos} footing at ${tribe.name}. The conversations are polite but short.`,
                  `${newcomer} eats alone again. The tribe isn't hostile — just closed. Breaking in is harder than it looks.`,
                  `${newcomer} tries to join a strategy talk. The conversation stops. It starts again when ${_ncP.sub} ${_ncP.sub==='they'?'leave':'leaves'}.`,
                ]) : _rp([
                  `${newcomer} is still reading the room. Who's in charge, who's on the outs, who can be trusted — all new questions.`,
                  `${newcomer} watches more than ${_ncP.sub} ${_ncP.sub==='they'?'talk':'talks'} today. Every conversation is data.`,
                  `${newcomer} keeps ${_ncP.pos} head down and does the work. No alliances yet. Just proving ${_ncP.sub} ${_ncP.sub==='they'?'belong':'belongs'} here.`,
                ]);
                pre.push({ type: 'doubt', players: [newcomer], text: _ncText });
              }
            });
          }
        }
      });
    } else {
      const total = totalForGroup(gs.activePlayers);
      const preCount = phase === 'both' ? total : Math.ceil(total / 2);
      const _campActivePlayers = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
      const mergePreEvents = withSceneCtx({ ep: ep.num, phase: 'pre' }, () => generateCampEventsForGroup(_campActivePlayers, idolFinds, boosts, preCount));
      if (ep.twistNarrativeEvents?.['merge']) mergePreEvents.unshift(ep.twistNarrativeEvents['merge']);
      if (!ep.campEvents) ep.campEvents = {};
      const _existingMergePre = ep.campEvents.merge?.pre || [];
      ep.campEvents.merge = { pre: [..._existingMergePre, ...mergePreEvents], post: [] };
    }
  }

  // ── LINGERING INJURY EVENTS: recovery or ongoing pain ──
  if (gs.lingeringInjuries && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    Object.entries(gs.lingeringInjuries).forEach(([name, inj]) => {
      if (!gs.activePlayers.includes(name)) { delete gs.lingeringInjuries[name]; return; }
      const age = ep.num - inj.ep;
      if (age >= inj.duration) { delete gs.lingeringInjuries[name]; return; } // fully healed
      const _ip = pronouns(name);
      const tribe = gs.isMerged ? (Object.keys(ep.campEvents)[0] || 'merge')
        : gs.tribes.find(t => t.members.includes(name))?.name;
      if (!tribe || !ep.campEvents?.[tribe]) return;
      const pre = Array.isArray(ep.campEvents[tribe]) ? ep.campEvents[tribe] : (ep.campEvents[tribe].pre || []);
      if (age === 0) return; // injury event itself already fired this episode
      if (age === inj.duration - 1) {
        // Last episode of injury — recovery event
        pre.push({ type: 'injury', players: [name], text: _rp([
          `${name} moves differently today — looser, faster. The injury from a few days ago is finally fading. The tribe notices.`,
          `${name} is back to full strength. ${_ip.Sub} ${_ip.sub==='they'?'don\'t':'doesn\'t'} announce it — ${_ip.sub} just ${_ip.sub==='they'?'start':'starts'} keeping up again. The worry is over.`,
          `The limp is gone. ${name} pushes through a camp task that would've been painful yesterday. The tribe watches and recalculates.`,
        ]) });
      } else {
        // Still injured — ongoing pain event
        if (Math.random() < 0.45) {
          pre.push({ type: 'injury', players: [name], text: _rp([
            `${name} is still hurting. ${_ip.Sub} ${_ip.sub==='they'?'hide':'hides'} it well — but not well enough. The tribe is watching.`,
            `${name} winces during a camp task. ${_ip.Sub} ${_ip.sub==='they'?'wave':'waves'} it off. Nobody believes ${_ip.obj}.`,
            `The injury is slowing ${name} down. ${_ip.Sub} ${_ip.sub==='they'?'know':'knows'} it. The tribe knows it. A challenge is coming.`,
            `${name} sits out of a camp task for the first time. "I'm fine," ${_ip.sub} ${_ip.sub==='they'?'say':'says'}. ${_ip.Sub} ${_ip.sub==='they'?'are':'is'} not fine.`,
          ]) });
        }
      }
    });
  }

  // ── SCRAMBLE camp events (post-merge only) ──
  if (gs.phase === 'post-merge' && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const _campKey = Object.keys(ep.campEvents || {}).find(k => ep.campEvents[k]?.pre) || 'merge';
    const _pre = ep.campEvents?.[_campKey]?.pre;
    if (_pre) {
      // Scramble Effect camp events
      if (gs._scrambleActivations) {
        Object.entries(gs._scrambleActivations).forEach(([name, power]) => {
          if (Math.random() >= 0.35) return; // ~35% chance to show the event
          const pr = pronouns(name);
          const allies = gs.activePlayers.filter(p => p !== name && getBond(name, p) >= 2);
          // Bond boost: +0.3 with 1-2 random allies
          const bondTargets = allies.sort(() => Math.random() - 0.5).slice(0, Math.min(2, allies.length));
          bondTargets.forEach(a => addBond(a, name, 0.3));
          _pre.push({ type: 'scramble', players: [name, ...bondTargets], text: _rp([
            `${name} pulled three people aside before tribal. By sundown, the conversation had shifted.`,
            `Nobody's sure who changed the plan. ${name} knows.`,
            `${name} spent the afternoon making rounds. By dinner, ${pr.pos} name wasn't coming up anymore.`,
            `The vote was locked — until ${name} had a conversation with the right person at the right time.`,
            `${name} doesn't panic. ${pr.Sub} work${pr.sub==='they'?'':'s'} the camp like it's a job. Two hours later, the target is someone else.`,
            `There was a plan. Then ${name} talked to everyone individually. Now there's a different plan. Nobody can explain how it happened.`,
          ], name + 'scramble' + ep.num), badgeText: 'SCRAMBLE', badgeClass: 'gold' });
        });
        ep._debugScramble = { ...gs._scrambleActivations };
        delete gs._scrambleActivations;
      }
      // Shield network removed — replaced by vote pitches in social politics system
    }
  }

  // ── IDOL SNOOPING: bold/low-loyalty players search through belongings ──
  if ((phase === 'pre' || phase === 'both') && gs.advantages?.some(a => a.type === 'idol')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    Object.entries(ep.campEvents || {}).forEach(([tribeName, phaseData]) => {
      const pre = Array.isArray(phaseData) ? phaseData : (phaseData.pre || []);
      const tribeMembers = gs.isMerged ? gs.activePlayers
        : (gs.tribes.find(t => t.name === tribeName)?.members || []);

      // Snooping: bold + low-loyalty player searches through belongings
      const idolHoldersHere = gs.advantages.filter(a => a.type === 'idol' && tribeMembers.includes(a.holder));
      if (idolHoldersHere.length && Math.random() < 0.08) {
        const snooper = tribeMembers.filter(n =>
          !idolHoldersHere.some(a => a.holder === n) && pStats(n).boldness >= 6 && pStats(n).loyalty <= 5
        ).sort((a,b) => (pStats(b).boldness + pStats(b).intuition) - (pStats(a).boldness + pStats(a).intuition))[0];
        if (snooper) {
          const target = idolHoldersHere[Math.floor(Math.random() * idolHoldersHere.length)];
          const _spP = pronouns(snooper);
          const caught = Math.random() < 0.35;
          if (!gs.knownIdolHoldersThisEp) gs.knownIdolHoldersThisEp = new Set();
          gs.knownIdolHoldersThisEp.add(target.holder);
          recordIdolIntel(snooper, target.holder, { source:'saw idol while snooping', confidence:0.95, truth:'confirmed' });
          if (caught) {
            addBond(target.holder, snooper, -2.5);
            tribeMembers.filter(m => m !== snooper && m !== target.holder).forEach(m => addBond(m, snooper, -0.5));
            pre.push({ type: 'idolBetrayal', players: [snooper, target.holder], text: _rp([
              `${snooper} goes through ${target.holder}'s bag while the tribe is at the water well. ${_spP.Sub} find${_spP.sub==='they'?'':'s'} it — the idol. But ${target.holder} walks back early and catches ${_spP.obj} red-handed. The camp goes silent.`,
              `${snooper} searches ${target.holder}'s belongings and discovers a hidden idol. ${_spP.Sub} barely ${_spP.sub==='they'?'get':'gets'} it back in the bag before someone sees. Someone did see.`,
              `${target.holder} finds ${snooper} rummaging through ${pronouns(target.holder).pos} things. The excuse is bad. The damage is real. Everyone at camp heard what happened.`,
            ]) });
          } else {
            pre.push({ type: 'eavesdrop', players: [snooper, target.holder], text: _rp([
              `${snooper} searches ${target.holder}'s bag while nobody is looking. ${_spP.Sub} find${_spP.sub==='they'?'':'s'} what ${_spP.sub} ${_spP.sub==='they'?'were':'was'} looking for. Nobody knows. Not yet.`,
              `${snooper} waits until ${target.holder} is gone and checks ${pronouns(target.holder).pos} things. There it is — the idol. ${snooper} puts everything back exactly as it was. The secret is ${_spP.posAdj} now.`,
              `${snooper} discovers ${target.holder}'s idol during a quiet moment at camp. ${_spP.Sub} ${_spP.sub==='they'?'don\'t':'doesn\'t'} take it — ${_spP.sub} just ${_spP.sub==='they'?'need':'needs'} to know it's there. And now ${_spP.sub} ${_spP.sub==='they'?'do':'does'}.`,
            ]) });
          }
        }
      }

      // Ally tip-off: someone with high social tells their close ally about an idol holder
      if (idolHoldersHere.length && Math.random() < 0.10) {
        const knownHolders = [...(gs.knownIdolHoldersThisEp || [])].filter(n => tribeMembers.includes(n));
        if (knownHolders.length) {
          const holder = knownHolders[Math.floor(Math.random() * knownHolders.length)];
          // Find a social player who knows and has a close ally who DOESN'T know
          const informedNames = new Set(idolIntelFor(holder, tribeMembers).map(x => x.knower));
          const informers = tribeMembers.filter(n => n !== holder && informedNames.has(n) && pStats(n).social >= 6 && getBond(n, holder) <= 1);
          const informer = informers[Math.floor(Math.random() * informers.length)];
          if (informer) {
            const recipient = tribeMembers.filter(n =>
              n !== informer && n !== holder && getBond(informer, n) >= 2
            ).sort((a,b) => getBond(informer,b) - getBond(informer,a))[0];
            if (recipient) {
              addBond(informer, recipient, 0.5);
              const sourceIntel = idolIntelFor(holder, [informer])[0];
              recordIdolIntel(recipient, holder, { source:`told by ${informer}`, confidence:Math.max(0.55, (sourceIntel?.effectiveConfidence || 0.7) * 0.9), truth:sourceIntel?.truth || 'unknown' });
              const _infP = pronouns(informer);
              pre.push({ type: 'eavesdrop', players: [informer, recipient], text: _rp([
                `${informer} pulls ${recipient} aside. "${holder} has an idol." Two words that change everything. ${recipient} nods. The plan adjusts.`,
                `${informer} tells ${recipient} about ${holder}'s idol — quietly, away from camp. It's the kind of information that bonds people. And targets others.`,
                `${informer} shares what ${_infP.sub} know${_infP.sub==='they'?'':'s'} about ${holder}'s idol with ${recipient}. Trust has a price. This is how you pay it.`,
                `${informer} whispers to ${recipient}: "${holder} is holding something." ${recipient} doesn't need to ask what. The look on ${informer}'s face says it all.`,
              ]) });
            }
          }
        }
      }
    });
  }

  // ── MERGE ANNOUNCEMENT: inject guaranteed reaction events when tribes dissolve ──
  if (ep.isMerge && (phase === 'pre' || phase === 'both') && ep.campEvents?.merge) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const pre = ep.campEvents.merge.pre;
    const _n = gs.activePlayers.length;
    // Big announcement — always first
    pre.unshift({ type: 'mergeAnnounce', text: _rp([
      `It's official. The tribes are done. ${_n} players, one camp, one game from here. Everybody is acting like they're fine. Nobody is fine.`,
      `The merge is here. The flag drops, the buffs come off, and ${_n} people who've been trying to outlast each other suddenly have to share a fire. The game just started for real.`,
      `${_n} left. One tribe. The old lines don't disappear — they just go underground. Everyone is smiling and everyone is counting.`,
      `The moment the merge is announced, something shifts in the air. Pre-merge alliances are already obsolete. ${_n} players are doing the math on who they actually trust.`,
    ]) });
    // Scramble/recalibration — always second
    pre.splice(1, 0, { type: 'mergeScramble', text: _rp([
      `The first hours of the merge are a scramble. Everyone is pulling people aside, reconnecting with old allies, testing new ones. The game is moving fast.`,
      `Old tribal lines mean nothing and everything at the same time. Everyone is pretending to start fresh. Nobody actually is.`,
      `The conversations are nonstop. Everyone wants to know where everyone else stands. Nobody is giving a straight answer.`,
      `Cross-tribal relationships that were built over weeks are being stress-tested in a single afternoon. Some of them hold. Some of them don't.`,
    ]) });
    // Confessional-style individual reads — pick a random player
    const _pivot = gs.activePlayers[Math.floor(Math.random() * gs.activePlayers.length)];
    const _pP = pronouns(_pivot);
    pre.splice(2, 0, { type: 'mergeConfessional', players: [_pivot], text: _rp([
      `${_pivot} is watching. Watching how people group up, who walks with who, who gets quiet. ${_pP.Sub} ${_pP.sub === 'they' ? "have" : "has"} been waiting for this. Now it's time to play.`,
      `${_pivot} already has a number in ${_pP.posAdj} head. ${_pP.Sub} ${_pP.sub === 'they' ? "know" : "knows"} exactly who ${_pP.sub} need${_pP.sub === 'they' ? '' : 's'} to go next. The merge is just when the plan starts.`,
      `${_pivot} walked into merge camp and immediately started counting allies. ${_pP.Sub} ${_pP.sub === 'they' ? "aren't" : "isn't"} celebrating. ${_pP.Sub} ${_pP.sub === 'they' ? "are" : "is"} calculating.`,
      `The merge is a reset for most people. Not for ${_pivot}. ${_pP.Sub} ${_pP.sub === 'they' ? "have" : "has"} been preparing for this since day one.`,
    ]) });
    // ── Pre-merge challenge dominance — inject threat narrative at merge for standout performers ──
    const _chalDom = gs.activePlayers
      .map(n => ({ name: n, rec: gs.chalRecord?.[n] }))
      .filter(({ rec }) => rec && (rec.podiums >= 3 || rec.wins >= 1))
      .sort((a, b) => (b.rec.podiums + b.rec.wins * 2) - (a.rec.podiums + a.rec.wins * 2))
      .slice(0, 2); // at most 2 players flagged per merge episode
    _chalDom.forEach(({ name: threat, rec }) => {
      // Notifier: most strategic player who isn't the threat
      const _notifier = gs.activePlayers.filter(p => p !== threat)
        .reduce((best, p) => pStats(p).strategic > pStats(best).strategic ? p : best,
          gs.activePlayers.filter(p => p !== threat)[0]);
      Math.random(); Math.random(); // the two draws that picked the sentences (the season must not move)
      const _cw = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
      const _mData = { ending: 'merge', count: _cw[rec.podiums] || String(rec.podiums), wins: rec.wins >= 1 ? (_cw[rec.wins] || String(rec.wins)) : null };
      const _cf = { id: 'confessional', label: 'Confessional' };
      pre.push(scriptEvent({ type: 'chalThreat', players: [threat], badgeText: 'THREAT', badgeClass: 'gold' },
        makeScene('threat.self', { a: threat }, _mData, [], _cf), { ep: ep.num, phase: 'pre' }));
      pre.push(scriptEvent({ type: 'chalThreatReaction', players: [_notifier, threat], badgeText: 'TAKING NOTE', badgeClass: 'red' },
        makeScene('threat.notice', { a: _notifier, b: threat }, _mData, [], _cf), { ep: ep.num, phase: 'pre' }));
    });

    // Boost merge-specific events in the generated list
    boost('tdStrategy', 40); boost('tdBond', 30); boost('doubt', 25);
    boost('leadershipClash', 20); boost('rumor', 20); boost('eavesdrop', 20);
  }

  // ── Idol confession/betrayal + amulet events: probabilistic chain fired after pre events are built ──
  if (phase === 'pre' || phase === 'both') {
    checkIdolConfessions(ep);
    checkTeamSwapConfessions(ep);
    checkSafetyNoPowerConfessions(ep);
    checkSoleVoteConfessions(ep);
    checkSocialIntel(ep);
    checkSecondLifeAmuletEvents(ep);
    checkLegacyCampEvents(ep);
    checkTacticalAdvantageSnoop(ep);
    checkHeroVillainEvents(ep);
    checkComfortBlindspot(ep);
    checkSocialPolitics(ep);
  }

  // ── Post-save aftermath (idol / SITD / KIP from previous episode) ──
  // Runs AFTER ep.campEvents is fully populated so pushes aren't overwritten.
  if (prevEp && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const _prevSaves = [
      ...(prevEp.idolPlays || [])
        .filter(p => p.type === 'idol' || p.type === 'kip' || (!p.type && !p.stolenFrom && p.votesNegated !== undefined))  // only actual idol plays, not extra votes / vote steals
        .filter((p, i, arr) => arr.findIndex(x => x.player === p.player && (x.playedFor || null) === (p.playedFor || null)) === i)  // deduplicate same player
        .map(p => ({
          player: p.player, playedFor: p.playedFor || null, votesNegated: p.votesNegated || 0,
          type: p.type === 'kip' ? 'kip' : p.superIdol ? 'super-idol' : p.playedFor ? 'idol-for-ally' : 'idol',
          stolenFrom: p.stolenFrom || null, safe: true,
        })),
      // Include SITD regardless of safe/unsafe — both outcomes have drama
      ...(prevEp.shotInDark
        ? [{ player: prevEp.shotInDark.player, votesNegated: prevEp.shotInDark.votesNegated || 0, type: 'sitd', safe: prevEp.shotInDark.safe }]
        : []),
    ];
    _prevSaves.forEach(save => {
      // Camp is the tribe the player belonged to last episode (may be on exile/eliminated now)
      const campKey = gs.isMerged ? 'merge'
        : gs.tribes.find(t => t.members.includes(save.player))?.name
        || prevEp.tribalTribe || prevEp.loser?.name || null;
      if (!campKey || !ep.campEvents[campKey]) return;
      const pre = ep.campEvents[campKey].pre;
      const _p = pronouns(save.player);
      const vn = save.votesNegated;
      const voteWord = vn === 1 ? 'vote' : 'votes';
      const _saveBadge = { sitd: 'SHOT IN THE DARK', kip: 'POWER SHIFT', 'super-idol': 'SUPER IDOL', 'idol-for-ally': 'IDOL SAVE' }[save.type] || 'IDOL PLAY';

      if (save.type === 'sitd') {
        if (save.safe) {
          pre.push({ type: 'saveReaction', badgeText: _saveBadge, badgeClass: 'gold', text: _rp([
            `The morning after is quiet — not the comfortable kind. ${save.player} rolled the Shot in the Dark and it landed safe. ${vn > 0 ? `${vn} ${voteWord} just gone.` : ''} Nobody has processed it yet.`,
            `${save.player} is still here. That's the fact everyone woke up to. The Shot in the Dark isn't supposed to work. It did. The people who voted are recalibrating.`,
            `Camp feels different this morning. ${save.player} survived on a 1-in-6 chance. ${_p.Sub} ${_p.sub==='they'?'know':'knows'} ${_p.sub} ${_p.sub==='they'?'are':'is'} still a target — and so does everyone else.`,
          ]) });
          pre.push({ type: 'saveScramble', badgeText: 'SCRAMBLE', badgeClass: 'red', text: _rp([
            `The plan from last night is dead. Whatever comes next has to account for the fact that ${save.player} is still in the game and now knows exactly who voted for ${_p.obj}.`,
            `Someone needs to rebuild the numbers. The vote failed, the target survived, and the game has a new variable: ${save.player} playing with nothing left to lose.`,
          ]) });
        } else {
          // SITD played but didn't save them — check if they actually went home or survived
          const _sitdWentHome = prevEp.eliminated === save.player || (Array.isArray(prevEp.eliminated) && prevEp.eliminated.includes(save.player));
          if (_sitdWentHome) {
            pre.push({ type: 'saveReaction', badgeText: _saveBadge, badgeClass: 'gold', text: _rp([
              `${save.player} rolled the Shot in the Dark last night. It didn't land. ${_p.Sub} ${_p.sub==='they'?'are':'is'} gone — but the fact that ${_p.sub} tried it is all anyone is talking about this morning.`,
              `The Shot in the Dark failed. ${save.player} sacrificed their vote and still went home. The move didn't work, but it told everyone something about how ${_p.sub} ${_p.sub==='they'?'play':'plays'} this game.`,
              `${save.player} gambled last night. The dice came up wrong. The camp is quiet about it — not because they don't care, but because it could have been any of them reaching for that slip of paper.`,
          ]) });
          } else {
            // SITD failed but they survived anyway (someone else went home)
            pre.push({ type: 'saveReaction', badgeText: _saveBadge, badgeClass: 'gold', text: _rp([
              `${save.player} rolled the Shot in the Dark last night and it didn't land. ${_p.Sub} survived anyway — but ${_p.sub} wasted ${_p.pos} vote for nothing. The tribe knows ${_p.sub} panicked.`,
              `The Shot in the Dark failed, but ${save.player} is still here. Someone else went home instead. The desperation move didn't matter — but the tribe saw ${_p.obj} reach for it.`,
              `${save.player} sacrificed ${_p.pos} vote on a 1-in-6 gamble. It missed. ${_p.Sub} ${_p.sub==='they'?'are':'is'} still in the game, but everyone knows ${_p.sub} felt cornered enough to try.`,
            ]) });
          }
        }
      } else if (save.type === 'kip') {
        const stolenLine = save.stolenFrom ? `${save.stolenFrom} woke up without the idol they had. ` : '';
        pre.push({ type: 'saveReaction', badgeText: _saveBadge, badgeClass: 'gold', text: _rp([
          `${stolenLine}${save.player} has an idol that wasn't ${_p.posAdj} 24 hours ago. The camp is still absorbing what happened last night.`,
          `The Knowledge Is Power play worked. ${save.player} comes to camp this morning with leverage nobody saw coming. The people who thought they understood the game are starting over.`,
          `${save.player} made a move at tribal that changed the board entirely. ${stolenLine}This morning, the math is different.`,
        ]) });
        pre.push({ type: 'saveScramble', badgeText: 'SCRAMBLE', badgeClass: 'red', text: _rp([
          `${save.stolenFrom ? save.stolenFrom + ' needs a new plan' : 'Someone lost their insurance last night'}. The idol is gone, and the person who has it is a threat in a different way now.`,
          `Everyone knows what ${save.player} did. The question is what ${_p.sub} ${_p.sub==='they'?'do':'does'} next — and who ${_p.sub} ${_p.sub==='they'?'use':'uses'} it on.`,
        ]) });
      } else if (save.type === 'super-idol') {
        // Super Idol: played AFTER votes — the most dramatic play possible
        if (save.playedFor) {
          pre.push({ type: 'saveReaction', badgeText: _saveBadge, badgeClass: 'gold', text: _rp([
            `Nobody can stop talking about it. The votes were read. ${save.playedFor} was done. Then ${save.player} stood up with the Super Idol. ${vn} ${voteWord} — erased. After the read. That's never happened before.`,
            `${save.player} waited until the host read every single vote. Then pulled out the Super Idol for ${save.playedFor}. The camp hasn't recovered. You don't see that kind of loyalty — or that kind of nerve.`,
          ]) });
          addBond(save.player, save.playedFor, 1.5); // lingering gratitude on top of the engine's +3
        } else {
          pre.push({ type: 'saveReaction', badgeText: _saveBadge, badgeClass: 'gold', text: _rp([
            `The Super Idol play is all anyone is talking about this morning. ${save.player} sat through every vote being read — ${_p.posAdj} name, over and over — and then pulled it out. ${vn} ${voteWord} gone. After the read.`,
            `${save.player} let the votes happen. Watched ${_p.posAdj} own name pile up. Then played the Super Idol. The camp woke up to a different game. That wasn't just an advantage play — that was a statement.`,
            `Nobody sleeps well after a Super Idol play. ${save.player} is still here, the idol is gone, and everyone who voted for ${_p.obj} knows they were outplayed in a way they couldn't have predicted.`,
          ]) });
        }
        pre.push({ type: 'saveScramble', badgeText: 'SCRAMBLE', badgeClass: 'red', text: _rp([
          `The coalition that put ${vn} ${voteWord} on ${save.playedFor || save.player}? Still exists. Still wants them gone. But now they know what they're up against — someone who waits, watches, and strikes at the last possible moment.`,
          `The Super Idol is gone. That's the consolation. But the player who held it just proved they're willing to play the most dangerous game possible. That changes how everyone plans from here.`,
        ]) });
      } else if (save.type === 'idol-for-ally') {
        const _a = pronouns(save.playedFor);
        // Consolidated idol-for-ally event — reaction + bond + scramble in one
        const _allyReact = _rp([
          `${save.player} played their idol for ${save.playedFor} last night. ${save.playedFor} is still here because of it.`,
          `What ${save.player} did at tribal wasn't calculated. It was a choice — put ${save.playedFor} above ${_p.posAdj} own safety. ${vn > 0 ? `${vn} ${voteWord} wiped out.` : ''}`,
          `${save.player} burned an idol for ${save.playedFor}. It worked. That alliance just proved it means something real.`,
        ]);
        const _allyAfter = _rp([
          `${save.playedFor} knows what ${save.player} gave up. That debt runs deeper than strategy. But ${save.player} has no idol now — the math just changed for everyone.`,
          `${save.player} spent their protection. Whether it was the right move depends on how loyal ${save.playedFor} turns out to be from here.`,
          `The idol is gone. But a proven ally willing to sacrifice? That's a different kind of threat.`,
        ]);
        pre.push({ type: 'saveReaction', badgeText: _saveBadge, badgeClass: 'gold', players: [save.player, save.playedFor], text: `${_allyReact} ${_allyAfter}` });
      } else {
        // Consolidated self-idol event — one event covering reaction + empowerment + scramble
        const _selfIdolReact = _rp([
          `${save.player} wakes up this morning having played an idol and survived. ${vn} ${voteWord} wiped out. The people who cast them are watching ${_p.obj} from across the fire.`,
          `The idol play is the first thing on everyone's mind when they wake up. ${save.player} is still here. The plan failed. The game goes on.`,
          `${save.player} pulled out an idol last night and it worked. This morning ${_p.sub} ${_p.sub==='they'?'move':'moves'} around camp like nothing happened. That kind of composure is its own kind of threat.`,
        ]);
        const _selfIdolAfter = _rp([
          `The idol is gone, but the threat hasn't changed. Someone is already figuring out how to finish what they started.`,
          `${vn} ${voteWord} went nowhere. That coalition still exists. It just needs a new shot. ${save.player} bought one episode — everybody knows it.`,
          `There's something different about ${save.player} this morning. ${_p.Sub} ${_p.sub==='they'?'survive':'survives'} with ${_p.posAdj} own hand. But ${_p.sub} ${_p.sub==='they'?'are':'is'} still the target.`,
        ]);
        pre.push({ type: 'saveReaction', badgeText: _saveBadge, badgeClass: 'gold', text: `${_selfIdolReact} ${_selfIdolAfter}` });
      }
    });
  }

  // ── Open vote aftermath: next episode people are still processing public declarations ──
  if (prevEp?.openVote && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    // Find pairs where someone voted against a former ally (bond was positive pre-tribal)
    const _ovLog = prevEp.votingLog || [];
    const _ovBroken = _ovLog.filter(({ voter, voted }) =>
      voted !== prevEp.eliminated && gs.activePlayers.includes(voter) && gs.activePlayers.includes(voted) && getBond(voter, voted) < -0.5
    );
    // Inject 1-2 aftermath events per camp
    const _campKeys = gs.isMerged ? ['merge'] : gs.tribes.map(t => t.name);
    _campKeys.forEach(campKey => {
      if (!ep.campEvents[campKey]) return;
      const pre = ep.campEvents[campKey].pre;
      // General open vote aftermath
      pre.push({ type: 'saveReaction', badgeText: _saveBadge, badgeClass: 'gold', text: _rp([
        `The open vote is all anyone is talking about. Every name that was called last night is still hanging in the air this morning. There's no way to pretend it didn't happen.`,
        `Last night's public declarations changed the camp. People were named out loud, and the ones who heard it woke up in a different position than they went to sleep in.`,
        `An open vote leaves marks. You can't take back a name you said out loud — and the people who heard it haven't forgotten.`,
      ]) });
      // Specific pair drama if applicable
      if (_ovBroken.length) {
        const _pair = _ovBroken[Math.floor(Math.random() * _ovBroken.length)];
        if (gs.activePlayers.includes(_pair.voter) && gs.activePlayers.includes(_pair.voted)) {
          pre.push({ type: 'dispute', players: [_pair.voter, _pair.voted], text: _rp([
            `${_pair.voter} called ${_pair.voted}'s name publicly last night. That conversation is not over. The awkwardness between them is visible enough that the whole camp feels it.`,
            `${_pair.voted} heard ${_pair.voter} say their name out loud. This morning ${_pair.voted} hasn't said a word to ${_pair.voter}. Some things don't wash off overnight.`,
            `The open vote exposed what ${_pair.voter} actually thinks of ${_pair.voted}. There's no backtracking. Whatever existed between them before last night is complicated now.`,
          ]) });
        }
      }
    });
  }

  // ── Post-tribal discovery aftermath: vote discovery + lost ally reactions ──
  // Reads gs.discoveredVotesLastEp set by applyPostTribalConsequences() last episode.
  if (gs.discoveredVotesLastEp?.length && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const _disc = [...gs.discoveredVotesLastEp];
    gs.discoveredVotesLastEp = []; // consume — cleared so it doesn't repeat next episode
    // Group lost-ally events by ally so one ally's reaction is ONE consolidated event
    const _lostAllyGroups = {};
    _disc.filter(e => e.type === 'lost-ally').forEach(evt => {
      const key = evt.ally + '|' + evt.elim;
      if (!_lostAllyGroups[key]) _lostAllyGroups[key] = { ally: evt.ally, elim: evt.elim, voters: [] };
      if (gs.activePlayers.includes(evt.voter) && evt.voter !== evt.ally) _lostAllyGroups[key].voters.push(evt.voter);
    });
    Object.values(_lostAllyGroups).forEach(({ ally, elim: evElim, voters }) => {
      if (!gs.activePlayers.includes(ally) || !voters.length) return;
      const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(ally))?.name;
      if (!_campKey || !ep.campEvents[_campKey]) return;
      const _aP = pronouns(ally);
      const voterList = voters.length === 1 ? voters[0] : voters.slice(0, -1).join(', ') + ' and ' + voters[voters.length - 1];
      // One draw, where the sentence used to be picked (the season must not move).
      Math.random();
      ep.campEvents[_campKey].pre.push(scriptEvent({ type: 'doubt', players: [ally, ...voters], badgeText: 'GRUDGE', badgeClass: 'red' },
        makeScene('fallout.mourn', { a: ally, b: voters[0] },
          { ending: voters.length === 1 ? 'one' : 'many', fallen: evElim, voters: voterList }, [],
          voters.length === 1 ? spotOf(ep, ally, voters[0], 'pre').spot : { id: 'confessional', label: 'Confessional' }),
        { ep: ep.num, phase: 'pre' }));
    });
    // Group vote-discovery events by target so one player's reaction is ONE consolidated event
    const _voteDiscGroups = {};
    _disc.filter(e => e.type === 'vote-discovery').forEach(evt => {
      if (!_voteDiscGroups[evt.target]) _voteDiscGroups[evt.target] = { target: evt.target, voters: [] };
      if (gs.activePlayers.includes(evt.voter)) _voteDiscGroups[evt.target].voters.push(evt.voter);
    });
    Object.values(_voteDiscGroups).forEach(({ target, voters }) => {
      if (!gs.activePlayers.includes(target) || !voters.length) return;
      const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(target))?.name;
      if (!_campKey || !ep.campEvents[_campKey]) return;
      const _tP = pronouns(target);
      const voterList = voters.length === 1 ? voters[0] : voters.slice(0, -1).join(', ') + ' and ' + voters[voters.length - 1];
      Math.random();
      ep.campEvents[_campKey].pre.push(scriptEvent({ type: 'doubt', players: [target, ...voters], badgeText: 'KNOWS', badgeClass: 'red' },
        makeScene('fallout.found', { a: target, b: voters[0] },
          { ending: voters.length === 1 ? 'one' : 'many', voters: voterList }, [],
          voters.length === 1 ? spotOf(ep, target, voters[0], 'pre').spot : { id: 'confessional', label: 'Confessional' }),
        { ep: ep.num, phase: 'pre' }));
    });
    // ── MISATTRIBUTION: a flip went undetected and an impulsive player turned on the WRONG suspect. Its
    // own confrontation beat (the traitor's clean getaway is the separate "Got Away With It" event).
    // Names specifics: which alliance's plan broke, who they were supposed to vote, who actually went home. ──
    _disc.filter(e => e.type === 'misattribution').forEach(({ reactor, wrongSuspect, alliance, plannedTarget, actualBoot, votedAlly }) => {
      if (!gs.activePlayers.includes(reactor) || !gs.activePlayers.includes(wrongSuspect)) return;
      const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(reactor))?.name;
      if (!_campKey || !ep.campEvents[_campKey]) return;
      const _rP = pronouns(reactor), _wP = pronouns(wrongSuspect);
      const _allw = alliance ? `${alliance}'s` : 'the';
      // what the reactor SAW go wrong: either the plan target survived, or a wrong name went home
      const _whatBroke = votedAlly
        ? (actualBoot ? `${actualBoot}, one of their own, went home instead of ${plannedTarget || 'the target'}` : `an ally's name came up instead of ${plannedTarget || 'the plan'}`)
        : (plannedTarget && actualBoot && plannedTarget !== actualBoot
          ? `${plannedTarget} was supposed to go, and ${actualBoot} went instead`
          : plannedTarget ? `the vote on ${plannedTarget} came apart` : `the plan came apart`);
      const _planShort = plannedTarget ? `the plan to vote ${plannedTarget}` : `the plan`;
      Math.random();
      // What the reactor SAW go wrong, as a decided ending; the real flipper is never named (nobody here knows).
      const _misEnding = votedAlly && actualBoot ? 'ally'
        : plannedTarget && actualBoot && plannedTarget !== actualBoot ? 'swapped' : 'broke';
      ep.campEvents[_campKey].pre.push(scriptEvent({ type: 'misattribution', players: [reactor, wrongSuspect], badgeText: 'Wrong Suspect', badgeClass: 'red' },
        makeScene('fallout.blame', { a: reactor, b: wrongSuspect },
          { ending: _misEnding, plan: plannedTarget || null, boot: actualBoot || null, group: alliance || null }, [],
          spotOf(ep, reactor, wrongSuspect, 'pre').spot),
        { ep: ep.num, phase: 'pre' }));
    });
  }

  // ── SECRET FLIP (VIEWER-ONLY DRAMATIC IRONY): a betrayal that went UNDETECTED. The audience is let in
  // on it — the cast never is (no bonds change here; it's pure narration). So the viewer ALWAYS knows a
  // rank was broken even with debug off. This beat is purely the TRAITOR'S clean getaway; any wrong-blame
  // fallout is its OWN 'misattribution' event (above). Severity scales it: MAJOR/MODERATE = full "Got Away
  // With It", MINOR (target went home anyway) = lighter "Loose Vote" aside. Cap 2 big + 1 minor/ep. ──
  if (gs.secretFlipsLastEp?.length && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const _all = [...gs.secretFlipsLastEp].filter(f => gs.activePlayers.includes(f.traitor));
    gs.secretFlipsLastEp = []; // consume
    const _big = _all.filter(f => f.severity !== 'minor').slice(0, 2);        // real betrayals — full beat
    const _minor = _all.filter(f => f.severity === 'minor').slice(0, 1);      // one stray-vote aside
    _big.forEach(({ traitor, alliance, votedFor, consensusWas, votedAlly }) => {
      const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(traitor))?.name;
      if (!_campKey || !ep.campEvents[_campKey]) return;
      const _tPr = pronouns(traitor);
      // name the specifics: which alliance, who the plan was, who they secretly wrote
      const _allw = alliance ? alliance : 'the alliance';
      const _wrote = (votedFor && consensusWas && votedFor !== consensusWas)
        ? `wrote ${votedFor}${votedAlly ? ', an ally,' : ''} instead of ${consensusWas}`
        : votedFor ? `quietly wrote ${votedFor}` : `flipped the vote`;
      Math.random();
      // Only the camera knows. With an ally voted against who is still here, that ally is in the
      // scene being friendly — the viewer knows, the ally does not.
      const _withAlly = votedAlly && gs.activePlayers.includes(votedFor);
      const _flipEnding = _withAlly ? 'ally' : (votedFor && consensusWas && votedFor !== consensusWas) ? 'swap' : 'plain';
      ep.campEvents[_campKey].pre.push(scriptEvent({ type: 'secretFlip', players: _withAlly ? [traitor, votedFor] : [traitor], badgeText: 'Got Away With It', badgeClass: 'gold' },
        makeScene('fallout.flip', _withAlly ? { a: traitor, b: votedFor } : { a: traitor },
          { ending: _flipEnding, wrote: votedFor || null, plan: consensusWas || null, group: alliance || null }, [],
          _withAlly ? spotOf(ep, traitor, votedFor, 'pre').spot : { id: 'confessional', label: 'Confessional' }),
        { ep: ep.num, phase: 'pre' }));
    });
    // MINOR: a lighter "loose vote" aside — a stray vote that didn't change anything doesn't need a beat
    // every time, so it only fires ~35% of the time (the viewer occasionally catches the hairline crack).
    _minor.forEach(({ traitor, votedFor, alliance }) => {
      if (Math.random() > 0.35) return;
      const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(traitor))?.name;
      if (!_campKey || !ep.campEvents[_campKey]) return;
      const _tPr = pronouns(traitor);
      const _tgtActive = gs.activePlayers.includes(votedFor);
      Math.random();
      ep.campEvents[_campKey].pre.push(scriptEvent({ type: 'secretFlip', players: _tgtActive ? [traitor, votedFor] : [traitor], badgeText: 'Loose Vote', badgeClass: 'gold' },
        makeScene('fallout.loose', { a: traitor }, { wrote: votedFor || null, group: alliance || null }, [], { id: 'confessional', label: 'Confessional' }),
        { ep: ep.num, phase: 'pre' }));
    });
  }

  // ── DETECTED BETRAYAL RECKONING: a MAJOR/MODERATE flip the alliance CAUGHT. The caught traitor faces
  // the group next episode — isolated, marked, on the outs. (The sneaky undetected version is the separate
  // "Got Away With It" beat.) One per episode, most severe first, so it stays a headline moment. ──
  if (gs.detectedFlipsLastEp?.length && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const _caught = [...gs.detectedFlipsLastEp]
      .filter(f => gs.activePlayers.includes(f.traitor))
      .sort((a, b) => (b.severity === 'major' ? 1 : 0) - (a.severity === 'major' ? 1 : 0))[0];
    gs.detectedFlipsLastEp = []; // consume
    if (_caught) {
      const { traitor, alliance, votedFor, consensusWas, votedAlly, allyEliminated } = _caught;
      const _repair = resolveAllianceRepair(_caught, ep.num);
      if (_repair) {
        ep.allianceRepairs = ep.allianceRepairs || [];
        ep.allianceRepairs.push(_repair);
      }
      const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(traitor))?.name;
      if (_campKey && ep.campEvents[_campKey]) {
        const _tPr = pronouns(traitor);
        const _allw = alliance || 'the alliance';
        const _what = (votedFor && consensusWas && votedFor !== consensusWas)
          ? `wrote ${votedFor}${votedAlly ? ', one of their own,' : ''} instead of ${consensusWas}`
          : votedFor ? `wrote ${votedFor}` : `broke ranks`;
        // partner card: the ally they voted (if still around), else solo
        const _partner = votedAlly && gs.activePlayers.includes(votedFor) && votedFor !== traitor ? votedFor : null;
        const _repairText = !_repair ? '' : _repair.outcome === 'forgiven'
          ? ` ${traitor} ${_repair.approach === 'apology' ? 'owned the move and apologized' : 'explained the strategic necessity'}, and enough of the group accepted it to reopen the conversation. Forgiveness did not erase the vote.`
          : _repair.outcome === 'working-truce'
            ? ` The explanation split the room. They will still work with ${traitor} when the numbers require it, but sensitive plans stay guarded.`
            : _repair.outcome === 'fracture'
              ? ` ${traitor}'s ${_repair.approach.replace('-', ' ')} failed to land. The relationship is now a practical fracture, not a temporary argument.`
              : ` ${traitor} tried to explain it, but the group did not accept the account. Strategy access remains closed.`;
        Math.random(); // the draw that picked the sentence (the season must not move)
        // Who says it to the traitor's face: the ally they voted against, if still here; otherwise
        // the alliance member who trusts them least. Nobody left to say it: the camera hears it.
        const _al = (gs.namedAlliances || []).find(a => a.name === alliance);
        const _campMates = _campKey === 'merge' ? gs.activePlayers : (gs.tribes.find(t => t.name === _campKey)?.members || []);
        const _accuser = _partner || (_al?.members || [])
          .filter(m => m !== traitor && gs.activePlayers.includes(m) && _campMates.includes(m))
          .sort((x, y) => getBond(x, traitor) - getBond(y, traitor) || x.localeCompare(y))[0] || null;
        const _approach = { apology: 'apology', 'strategic-explanation': 'explain', refusal: 'refusal', denial: 'denial' }[_repair?.approach] || 'none';
        const _verdict = { forgiven: 'forgiven', 'working-truce': 'truce', fracture: 'fracture', rejected: 'rejected' }[_repair?.outcome] || 'none';
        const _cData = { wrote: votedFor || null, plan: consensusWas || null, group: alliance || null,
          result: _partner ? 'victim' : 'member', fallen: allyEliminated ? votedFor : null };
        const _cWho = _accuser ? { a: traitor, b: _accuser } : { a: traitor };
        const _cSpot = _accuser ? spotOf(ep, traitor, _accuser, 'pre').spot : { id: 'confessional', label: 'Confessional' };
        ep.campEvents[_campKey].pre.push(scriptEventParts(
          { type: 'betrayalReckoning', players: _partner ? [traitor, _partner] : [traitor], badgeText: 'Caught Flipping', badgeClass: 'red' },
          _accuser
            ? [makeScene('caught.face', _cWho, { ..._cData, ending: _approach }, [], _cSpot),
               // no repair attempted: the 'none' confrontation already ends with the verdict
               _approach === 'none' ? null : makeScene('caught.verdict', _cWho, { ..._cData, ending: _verdict }, [], _cSpot)]
            : [makeScene('caught.alone', _cWho, { ..._cData, ending: _verdict }, [], _cSpot)],
          { ep: ep.num, phase: 'pre' }));
      }
    }
  }

  // ── KiP steal aftermath: victim reaction + tribe awareness ──
  if (gs.kipStealLastEp && (phase === 'pre' || phase === 'both')) {
    const _kip = gs.kipStealLastEp;
    gs.kipStealLastEp = null; // consume
    const _kipHolder = _kip.holder;
    const _kipVictim = _kip.victim;
    if (gs.activePlayers.includes(_kipVictim) || gs.activePlayers.includes(_kipHolder)) {
      const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(_kipHolder) || t.members.includes(_kipVictim))?.name;
      if (_campKey && ep.campEvents[_campKey]) {
        const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
        const _vPr = pronouns(_kipVictim);
        const _hPr = pronouns(_kipHolder);
        const _vS = pStats(_kipVictim);
        const _kipTypeLabel = _kip.stolenType === 'extraVote' ? 'Extra Vote' : _kip.stolenType === 'voteSteal' ? 'Vote Steal' : 'idol';
        if (_kip.success === false) {
          // KiP FAILED — asked the wrong person
          if (gs.activePlayers.includes(_kipHolder)) {
            ep.campEvents[_campKey].pre.push({ type: 'kipAftermath', players: [_kipHolder, _kipVictim], text: _rp([
              `${_kipHolder} used Knowledge is Power on ${_kipVictim} — and got nothing. The whole tribe saw it. The embarrassment hangs over camp like smoke.`,
              `"Do you have an idol?" ${_kipHolder} asked ${_kipVictim} in front of everyone. "${_kipVictim === _kipVictim ? 'No' : 'No'}." The advantage is gone. The information is not.`,
              `${_kipHolder} swung and missed. Knowledge is Power wasted on ${_kipVictim}, who had nothing. The tribe is quietly recalculating ${_hPr.posAdj} threat level — downward.`,
            ]), badgeText: 'KiP Failed', badgeClass: 'red' });
          }
          if (gs.activePlayers.includes(_kipVictim)) {
            ep.campEvents[_campKey].pre.push({ type: 'kipAftermath', players: [_kipVictim, _kipHolder], text: _rp([
              `${_kipVictim} was targeted by Knowledge is Power — and had nothing to take. ${_vPr.Sub} ${_vPr.sub==='they'?'walk':'walks'} around camp a little taller today.`,
              `${_kipHolder} came for ${_kipVictim}'s bag and found it empty. ${_kipVictim} hasn't stopped smiling since.`,
            ]), badgeText: 'Survived KiP', badgeClass: 'green' });
          }
        } else {
          // KiP SUCCESS — stole an advantage
          if (gs.activePlayers.includes(_kipVictim)) {
            const _victimText = _vS.boldness >= 7
              ? _rp([
                `${_kipVictim} hasn't said a word to ${_kipHolder} since last tribal. The silence is louder than any confrontation. ${_vPr.Sub} ${_vPr.sub==='they'?'are':'is'} done talking. ${_vPr.Sub} ${_vPr.sub==='they'?'are':'is'} planning.`,
                `${_kipVictim} woke up furious. ${_kipHolder} took ${_vPr.posAdj} ${_kipTypeLabel} in front of everyone. That's not something ${_vPr.sub} ${_vPr.sub==='they'?'forget':'forgets'}. That's something ${_vPr.sub} ${_vPr.sub==='they'?'avenge':'avenges'}.`,
              ])
              : _vS.strategic >= 7
              ? _rp([
                `${_kipVictim} lost the ${_kipTypeLabel} — but not the information. ${_vPr.Sub} ${_vPr.sub==='they'?'know':'knows'} exactly who has it now. And ${_vPr.sub} ${_vPr.sub==='they'?'know':'knows'} what that person is afraid of.`,
                `${_kipVictim} replays the moment ${_kipHolder} stood up. The ${_kipTypeLabel} is gone. But the picture of who ${_kipHolder} really is? That's the clearest it's ever been.`,
              ])
              : _rp([
                `${_kipVictim} sits by the fire, staring at nothing. The ${_kipTypeLabel} was ${_vPr.posAdj} only protection. ${_kipHolder} took it. Just like that.`,
                `${_kipVictim} hasn't been the same since last tribal. ${_kipHolder} asked the question and ${_vPr.sub} had to hand it over. The game feels different now.`,
              ]);
            ep.campEvents[_campKey].pre.push({ type: 'kipAftermath', players: [_kipVictim, _kipHolder], text: _victimText, badgeText: 'KiP Aftermath', badgeClass: 'bad' });
          }
          if (gs.activePlayers.includes(_kipHolder)) {
            const _tribeText = _kip.wasAlly
              ? _rp([
                `The tribe saw what ${_kipHolder} did to ${_kipVictim}. They were supposed to be working together. Nobody is saying it out loud. Everybody is thinking it.`,
                `${_kipHolder} stole from ${_vPr.posAdj} own ally. The camp feels different this morning. People are checking their bags.`,
              ])
              : _rp([
                `${_kipHolder} walks around camp with a secret everyone can feel. Something shifted last night. The ${_kipTypeLabel} changed hands and the whole game tilted.`,
                `Word spread fast. ${_kipHolder} used Knowledge is Power. The tribe is doing the math on what that means for every alliance in the game.`,
              ]);
            ep.campEvents[_campKey].pre.push({ type: 'kipAftermath', players: [_kipHolder, _kipVictim], text: _tribeText, badgeText: 'Power Shift', badgeClass: 'gold' });
          }
        }
      }
    }
  }

  // ── Safety Without Power aftermath: holder walked out last tribal ──
  if (gs.safetyNoPowerPlayed && (phase === 'pre' || phase === 'both')) {
      const _snpData = gs.safetyNoPowerPlayed;
      const _snpPr = pronouns(_snpData.holder);
      const _snpTribe = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(_snpData.holder))?.name);
      if (_snpTribe && ep.campEvents?.[_snpTribe]) {
        const _snpBlock = ep.campEvents[_snpTribe];
        const _push = evt => (Array.isArray(_snpBlock) ? _snpBlock : (_snpBlock.pre || [])).push(evt);

        if (_snpData.surprise) {
          // Surprise exit — dramatic aftermath
          const _snpLines = [
            `Camp is tense this morning. ${_snpData.holder} walked out of tribal last night without a word. ${_snpPr.Sub} ${_snpPr.sub === 'they' ? 'are' : 'is'} safe, but the trust ${_snpPr.sub} left behind isn't.`,
            `Nobody has spoken to ${_snpData.holder} since last night. ${_snpPr.Sub} stood up, walked out, and left everyone to fend for themselves. Some people call that survival. Others have a different word for it.`,
            `${_snpData.holder} sits alone by the fire. ${_snpPr.Sub} used the Safety Without Power. ${_snpPr.Sub} ${_snpPr.sub === 'they' ? 'are' : 'is'} still here. But the looks from the others say everything words can't.`,
          ];
          const _snpSeed = [..._snpData.holder].reduce((s, c) => s + c.charCodeAt(0), 0);
          _push({ type: 'safetyNoPowerAftermath', players: [_snpData.holder],
            text: _snpLines[_snpSeed % _snpLines.length] });
        } else {
          // Warned exit — quieter aftermath
          const _snpLines = [
            `${_snpData.holder} is back at camp after walking out of tribal. ${_snpData.warnedAlly} knew it was coming. The rest didn't. The air is different this morning.`,
            `${_snpData.holder} warned ${_snpData.warnedAlly} before leaving tribal. That bought some goodwill — but not with everyone. The tribe is split on whether it was smart or selfish.`,
            `${_snpData.holder} played the Safety Without Power. ${_snpData.warnedAlly} covered for ${_snpPr.obj} as best ${pronouns(_snpData.warnedAlly).sub} could. The question now is whether anyone else will.`,
          ];
          const _snpSeed = [..._snpData.holder].reduce((s, c) => s + c.charCodeAt(0), 0);
          _push({ type: 'safetyNoPowerEscaped', players: [_snpData.holder, _snpData.warnedAlly],
            text: _snpLines[_snpSeed % _snpLines.length] });
        }

        // If an ally was eliminated because of the missing vote
        if (_snpData.allyCost) {
          const _costPr = pronouns(_snpData.allyCost);
          _push({ type: 'safetyNoPowerAftermath', players: [_snpData.holder],
            text: `${_snpData.allyCost} went home last night. ${_snpData.holder}'s vote could have changed that. ${_snpPr.Sub} know${_snpPr.sub === 'they' ? '' : 's'} it. Everyone knows it.` });
          addBond(_snpData.allyCost, _snpData.holder, -1.0); // extra sting
        }
      }
      delete gs.safetyNoPowerPlayed;
    }

  // ── Sole Vote aftermath: holder dictated the vote last tribal ──
  if (gs.soleVotePlayed && (phase === 'pre' || phase === 'both')) {
    const _svData = gs.soleVotePlayed;
    const _svPr = pronouns(_svData.holder);
    const _svTribe = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(_svData.holder))?.name);
    if (_svTribe && ep.campEvents?.[_svTribe]) {
      const _svBlock = ep.campEvents[_svTribe];
      const _push = evt => (Array.isArray(_svBlock) ? _svBlock : (_svBlock.pre || [])).push(evt);
      const _svSeed = [..._svData.holder].reduce((s, c) => s + c.charCodeAt(0), 0);

      if (_svData.target && !_svData.survived) {
        // Target was eliminated — dictator fallout
        const _svLines = [
          `Nobody is talking to ${_svData.holder} this morning. ${_svPr.Sub} silenced every voice at tribal and sent ${_svData.target} home alone. That kind of power leaves a mark.`,
          `${_svData.holder} made the call. One vote. ${_svPr.Pos} vote. ${_svData.target} is gone because ${_svData.holder} said so. The tribe hasn't forgotten.`,
          `Camp is quiet. ${_svData.holder} played the Sole Vote and eliminated ${_svData.target} single-handedly. Some call it strategy. Others call it tyranny. Nobody calls it forgettable.`,
        ];
        _push({ type: 'soleVoteFallout', players: [_svData.holder],
          text: _svLines[_svSeed % _svLines.length] });
        // Extra bond damage from players bonded to the eliminated
        gs.activePlayers.filter(p => p !== _svData.holder && getBond(p, _svData.target) >= 2).forEach(p => {
          addBond(p, _svData.holder, -0.5);
        });
      } else if (_svData.survived) {
        // Target idol'd out — wasted power
        const _svLines = [
          `${_svData.holder} played the Sole Vote — and it didn't matter. The target had an idol. Every voice was silenced for nothing. The dictator's crown turned to dust.`,
          `The Sole Vote was supposed to be the ultimate power move. Instead, an idol made it the ultimate embarrassment. ${_svData.holder} has no advantage and no allies to show for it.`,
          `${_svData.holder} burned the biggest advantage in the game for nothing. The idol cancelled the only vote that counted. Now ${_svPr.sub} ${_svPr.sub === 'they' ? 'have' : 'has'} a target on ${_svPr.posAdj} back and nothing left to play.`,
        ];
        _push({ type: 'soleVoteWasted', players: [_svData.holder],
          text: _svLines[_svSeed % _svLines.length] });
        // General contempt — wasted a scary advantage
        gs.activePlayers.filter(p => p !== _svData.holder).forEach(p => {
          addBond(p, _svData.holder, -0.3);
        });
      }

      // Warned ally noticed — complicity suspicion
      if (_svData.warnedAlly && gs.activePlayers.includes(_svData.warnedAlly)) {
        const _svAllyPr = pronouns(_svData.warnedAlly);
        _push({ type: 'soleVoteAccomplice', players: [_svData.warnedAlly, _svData.holder],
          text: `People noticed that ${_svData.warnedAlly} didn't flinch when ${_svData.holder} played the Sole Vote. ${_svAllyPr.Sub} knew. The tribe is asking what else ${_svAllyPr.sub} knew.` });
        gs.activePlayers.filter(p => p !== _svData.holder && p !== _svData.warnedAlly).forEach(p => {
          addBond(p, _svData.warnedAlly, -0.3);
        });
      }
    }
    delete gs.soleVotePlayed;
  }

  // ── Miscommunication fallout: voter accidentally helped eliminate their own ally ──
  if (gs.miscommunicationFallout?.length && (phase === 'pre' || phase === 'both')) {
    const _mcFallouts = gs.miscommunicationFallout;
    gs.miscommunicationFallout = null;
    _mcFallouts.forEach(mc => {
      if (!gs.activePlayers.includes(mc.voter)) return;
      const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(mc.voter))?.name;
      if (!_campKey || !ep.campEvents?.[_campKey]) return;
      const _mcPr = pronouns(mc.voter);
      const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
      if (mc.wasAlly && mc.changedOutcome) {
        // Worst case: ally went home because of the miscommunication
        ep.campEvents[_campKey].pre.push({ type: 'miscommunicationFallout', players: [mc.voter],
          text: _rp([
            `${mc.voter} hasn't spoken since last night. ${_mcPr.Sub} voted ${mc.eliminated} by accident — meant to write ${mc.intended}. And ${mc.eliminated} went home because of it. Everyone at camp knows. Nobody's saying it out loud.`,
            `The miscommunication cost ${mc.eliminated} the game. ${mc.voter} knows it. The rest of ${mc.alliance} knows it. ${_mcPr.Sub} can't take it back, and ${_mcPr.sub} can't explain it away. That's the kind of mistake that defines the rest of your game.`,
            `${mc.voter} was supposed to vote ${mc.intended}. Instead ${_mcPr.sub} wrote ${mc.eliminated}'s name. ${mc.eliminated} is gone now — and ${mc.voter}'s alliance is looking at ${_mcPr.obj} differently this morning.`,
          ]), badgeText: 'COSTLY MISTAKE', badgeClass: 'red' });
      } else if (mc.wasAlly) {
        // Voted ally but didn't change the outcome — still embarrassing
        ep.campEvents[_campKey].pre.push({ type: 'miscommunicationFallout', players: [mc.voter],
          text: _rp([
            `${mc.voter} voted for ${mc.eliminated} last night — ${_mcPr.posAdj} own ally. It didn't change the result, but ${mc.alliance} noticed. Trust takes time to build. One wrong name can undo it.`,
            `The tribe figured out that ${mc.voter} wrote the wrong name. ${mc.eliminated} would have gone home anyway, but that's not the point. ${mc.alliance} is questioning ${_mcPr.posAdj} focus.`,
          ]), badgeText: 'MISFIRE', badgeClass: 'red' });
      } else if (mc.changedOutcome) {
        // Not an ally but the misfire changed who went home
        ep.campEvents[_campKey].pre.push({ type: 'miscommunicationFallout', players: [mc.voter],
          text: _rp([
            `${mc.voter}'s stray vote landed on ${mc.eliminated}. It wasn't supposed to. And it might have been the vote that sent ${mc.eliminated} home. The tribe is still processing what happened.`,
            `${mc.voter} wrote the wrong name — and it mattered. ${mc.eliminated} went home on a margin that thin. One misfire, one exit. That's the game.`,
          ]), badgeText: 'COSTLY MISTAKE', badgeClass: 'red' });
      }
    });
  }

  // ── Alliance dissolution camp events ──
  if (gs.allianceDissolutions?.length && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const _dissolutions = [...gs.allianceDissolutions];
    gs.allianceDissolutions = [];
    _dissolutions.forEach(({ name, reason, members, betrayals, avgBond, lastMember, betrayalCount }) => {
      const activeMembers = (members || []).filter(m => gs.activePlayers.includes(m));
      if (!activeMembers.length && !lastMember) return;
      const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => activeMembers.some(m => t.members.includes(m)))?.name;
      if (!_campKey || !ep.campEvents?.[_campKey]) return;

      // The members actually in this camp (before the merge the others are on another beach
      // and were being listed in this camp's event).
      const _campTribe = gs.isMerged ? null : gs.tribes.find(t => t.name === _campKey);
      const _here = activeMembers.filter(m => !_campTribe || _campTribe.members.includes(m));
      const _known = ['last-member', 'betrayal', 'bonds-collapsed', 'betrayals-and-low-trust'];
      if (!_known.includes(reason)) return;
      if (reason === 'last-member' && !(lastMember && gs.activePlayers.includes(lastMember))) return;
      Math.random(); // the draw that picked the sentence (the season must not move)
      const _betrayers = (betrayals || []).map(b => b.player).filter(Boolean);
      const _endKind = { 'last-member': 'last', betrayal: 'betrayal', 'bonds-collapsed': 'collapsed', 'betrayals-and-low-trust': 'both' }[reason];
      const _endWho = reason === 'last-member' ? { a: lastMember }
        : _here.length >= 2 ? { a: _here[0], b: _here[1] } : { a: _here[0] || lastMember };
      const _endData = { ending: _endKind, group: name,
        betrayer: _betrayers.length ? _betrayers.slice(0, 2).join(' and ') : null };
      ep.campEvents[_campKey].pre.push(scriptEvent(
        { type: 'allianceDissolved', players: reason === 'last-member' ? [lastMember] : _here, badgeText: 'Alliance Dissolved', badgeClass: 'red' },
        makeScene(_endWho.b ? 'alliance.end' : 'alliance.endsolo', _endWho, _endData, [],
          _endWho.b ? spotOf(ep, _endWho.a, _endWho.b, 'pre').spot : { id: 'confessional', label: 'Confessional' }),
        { ep: ep.num, phase: 'pre' }));
    });
  }

  // ── Alliance expulsion camp events ──
  if (gs._pendingExpulsions?.length && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const _expulsions = [...gs._pendingExpulsions];
    gs._pendingExpulsions = [];
    _expulsions.forEach(({ player, alliance, reason, remainingMembers }) => {
      if (!gs.activePlayers.includes(player)) return;
      const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(player))?.name;
      if (!_campKey || !ep.campEvents?.[_campKey]) return;
      const _remaining = (remainingMembers || []).filter(m => gs.activePlayers.includes(m));
      Math.random(); // the draw that picked the sentence
      // Somebody from the alliance tells them, if anyone from it lives in this camp.
      const _xTribe = gs.isMerged ? null : gs.tribes.find(t => t.name === _campKey);
      const _remainingHere = _remaining.filter(m => !_xTribe || _xTribe.members.includes(m));
      const _teller = [..._remainingHere].sort((x, y) => getBond(x, player) - getBond(y, player) || x.localeCompare(y))[0] || null;
      const _xEnding = reason === 'voted against an alliance member' ? 'voted' : 'repeated';
      ep.campEvents[_campKey].pre.push(scriptEvent({ type: 'allianceExpelled', players: [player, ..._remainingHere], badgeText: 'EXPELLED', badgeClass: 'red' },
        _teller
          ? makeScene('alliance.expel', { a: _teller, b: player }, { ending: _xEnding, group: alliance }, [], spotOf(ep, _teller, player, 'pre').spot)
          : makeScene('alliance.expelsolo', { a: player }, { ending: _xEnding, group: alliance }, [], { id: 'confessional', label: 'Confessional' }),
        { ep: ep.num, phase: 'pre' }));
    });
  }

  // ── Fan Vote consequences ──
  if (gs.fanVoteWinner && gs.fanVoteEp === ((gs.episode || 0) + 1) && (phase === 'pre' || phase === 'both')) {
    const _fvWinner = gs.fanVoteWinner;
    gs.fanVoteWinner = null; // consume
    const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(_fvWinner))?.name;
    if (_campKey && ep.campEvents?.[_campKey] && gs.activePlayers.includes(_fvWinner)) {
      const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
      const _wPr = pronouns(_fvWinner);

      // 1. Winner confidence
      ep.campEvents[_campKey].pre.push({ type: 'fanVoteWinner', players: [_fvWinner], text: _rp([
        `${_fvWinner} walks different today. The fans chose ${_wPr.obj}. Whatever that means for the game, it means something for ${_wPr.posAdj} confidence.`,
        `The fan vote landed on ${_fvWinner}. ${_wPr.Sub} ${_wPr.sub==='they'?'try':'tries'} not to let it show — but the energy at camp has shifted. Everyone noticed.`,
      ]), badgeText: 'Fan Favorite', badgeClass: 'gold' });

      // 2. Jealousy from personality-driven rivals (NOT nice archetypes)
      const _jealousArchetypes = new Set(['schemer', 'mastermind', 'hothead', 'wildcard', 'villain', 'chaos-agent']);
      gs.activePlayers.filter(p => p !== _fvWinner).forEach(p => {
        const _pArch = players.find(pl => pl.name === p)?.archetype || '';
        const _pS = pStats(p);
        // Jealousy driven by personality: low social + scheming/hotheaded archetype
        const _jealousChance = (_jealousArchetypes.has(_pArch) ? 0.40 : 0) + (10 - _pS.social) * 0.03;
        if (Math.random() < _jealousChance && getBond(p, _fvWinner) < 3) {
          addBond(p, _fvWinner, -0.3);
          ep.campEvents[_campKey].pre.push({ type: 'fanVoteJealousy', players: [p, _fvWinner], text: _rp([
            `${p} watches ${_fvWinner} celebrate the fan vote and says nothing. The silence is louder than any reaction.`,
            `${p} to the confessional: "The fans love ${_fvWinner}. Good for ${_wPr.obj}. That just tells me ${_wPr.sub} ${_wPr.sub==='they'?'win':'wins'} at the end. And I can't let that happen."`,
            `${p} doesn't care about the fans. But ${pronouns(p).sub} care${pronouns(p).sub==='they'?'':'s'} about jury votes — and fan favorite is a FTC resume line. ${_fvWinner} just became more dangerous.`,
          ]), badgeText: 'Jealousy', badgeClass: 'red' });
        }
      });

      // 3. Alliance validation — winner's allies feel good
      gs.activePlayers.filter(p => p !== _fvWinner && getBond(p, _fvWinner) >= 2).forEach(p => {
        addBond(p, _fvWinner, 0.2);
      });
    }
  }

  // ── Legacy inheritance camp events ──
  if (gs.legacyInheritances?.length && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const _legInherit = [...gs.legacyInheritances];
    gs.legacyInheritances = [];
    _legInherit.forEach(({ from, to }) => {
      if (!gs.activePlayers.includes(to)) return;
      const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(to))?.name;
      if (!_campKey || !ep.campEvents[_campKey]) return;
      const _toPr = pronouns(to);
      ep.campEvents[_campKey].pre.push({ type: 'legacyInheritance', players: [to], text: _rp([
        `${to} finds something unexpected in ${_toPr.posAdj} bag this morning. A note from ${from}: "You'll know when to use it." The Legacy Advantage has been passed down.`,
        `${from} willed ${_toPr.posAdj} Legacy Advantage to ${to}. Production slipped it into ${_toPr.posAdj} bag overnight. ${to} unfolds the note and goes very, very quiet.`,
        `The Legacy Advantage changes hands. ${from} chose ${to} with ${_toPr.posAdj} last words. ${to} now carries a secret and a responsibility.`,
      ]), badgeText: 'Legacy Inherited', badgeClass: 'gold' });
    });
  }

  // ── Amulet power upgrade camp events ──
  if (gs.amuletUpgrades?.length && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const _amuUpgrades = [...gs.amuletUpgrades];
    gs.amuletUpgrades = [];
    _amuUpgrades.forEach(({ eliminated, remainingHolders, newPower }) => {
      remainingHolders.forEach(holder => {
        if (!gs.activePlayers.includes(holder)) return;
        const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(holder))?.name;
        if (!_campKey || !ep.campEvents[_campKey]) return;
        const _hPr = pronouns(holder);
        const _powerLabel = newPower === 'idol' ? 'Hidden Immunity Idol' : newPower === 'voteSteal' ? 'Vote Steal' : 'Extra Vote';
        ep.campEvents[_campKey].pre.push({ type: 'amuletUpgrade', players: [holder], text: _rp([
          `${holder} feels the amulet shift. With ${eliminated} gone, the power grows. It's now a ${_powerLabel}.`,
          `One fewer holder. The amulet in ${holder}'s pocket just became more dangerous. ${_powerLabel} level unlocked.`,
          `${eliminated}'s elimination changed everything for ${holder}. The amulet's power has increased — ${_hPr.sub} now ${_hPr.sub==='they'?'hold':'holds'} a ${_powerLabel}.`,
        ]), badgeText: 'Amulet Upgraded', badgeClass: 'gold' });
      });
    });
  }

  // ── Amulet holder alliance-vs-betrayal dynamics ──
  if (gs.amuletHolders?.length >= 2 && (phase === 'pre' || phase === 'both')) {
    const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
    const _activeAmuletHolders = gs.advantages.filter(a => a.type === 'amulet').map(a => a.holder).filter(h => gs.activePlayers.includes(h));
    if (_activeAmuletHolders.length >= 2) {
      const _amuletCount = _activeAmuletHolders.length;
      const _powerLabel = _amuletCount >= 3 ? 'Extra Vote' : _amuletCount === 2 ? 'Vote Steal' : 'Hidden Immunity Idol';
      const _nextPower = _amuletCount >= 3 ? 'Vote Steal' : _amuletCount === 2 ? 'Hidden Immunity Idol' : null;
      for (let i = 0; i < _activeAmuletHolders.length; i++) {
        for (let j = i + 1; j < _activeAmuletHolders.length; j++) {
          const a = _activeAmuletHolders[i], b = _activeAmuletHolders[j];
          const _aPr = pronouns(a), _bPr = pronouns(b);
          const sameTribe = gs.isMerged || gs.tribes.some(t => t.members.includes(a) && t.members.includes(b));
          if (!sameTribe) continue;
          const _campKey = gs.isMerged ? 'merge' : gs.tribes.find(t => t.members.includes(a))?.name;
          if (!_campKey || !ep.campEvents?.[_campKey]) continue;
          const _pairHash = ([...a].reduce((s,c) => s + c.charCodeAt(0), 0) + [...b].reduce((s,c) => s + c.charCodeAt(0), 0) + ep.num) % 3;
          if (_pairHash !== 0) continue;
          const bond = getBond(a, b);
          const _aS = pStats(a), _bS = pStats(b);

          if (ep.isMerge) {
            // MERGE reunion — the reckoning
            ep.campEvents[_campKey].pre.push({ type: 'amuletReunion', players: [a, b], text: _rp([
              `${a} and ${b} lock eyes across the merged camp. They both know what the other is carrying. The amulet is a ${_powerLabel} now — and one of them has to go for the other to get more.`,
              `The merge brings ${a} and ${b} face to face. The shared secret hangs between them. Do they honor it — or use it against each other?`,
              `${a} pulls ${b} aside. "You know what we have. You know what happens if one of us goes." The conversation is short. The implications are not.`,
            ]), badgeText: 'Amulet Holders Meet', badgeClass: 'gold' });
            // Bond shift at merge: strategic players start seeing each other as targets
            if (_aS.strategic >= 7 || _bS.strategic >= 7) addBond(a, b, -0.3);
          } else if (bond >= 2) {
            // ── ALLIANCE PATH: working together, but the temptation is always there ──
            const _betrayalTemptation = (_aS.strategic >= 7 ? 0.15 : 0) + (_aS.loyalty <= 4 ? 0.10 : 0) + (_nextPower === 'Hidden Immunity Idol' ? 0.15 : 0.05);
            if (Math.random() < _betrayalTemptation) {
              // One of them is starting to think about it...
              const _schemer = _aS.strategic >= _bS.strategic ? a : b;
              const _target = _schemer === a ? b : a;
              const _scPr = pronouns(_schemer);
              ep.campEvents[_campKey].pre.push({ type: 'amuletBetrayal', players: [_schemer, _target], text: _rp([
                `${_schemer} and ${_target} are still working together. But ${_schemer} has been doing the math. If ${_target} goes home, the amulet becomes a ${_nextPower || 'stronger weapon'}. The alliance is real. The temptation is realer.`,
                `"We're in this together." ${_schemer} says it to ${_target} at camp. In the confessional: "I keep thinking about what happens if ${_target} leaves. The amulet upgrades. I know I shouldn't be thinking about it. But I am."`,
                `${_schemer} catches ${_scPr.ref} calculating the amulet math again. ${_target} trusts ${_scPr.obj}. That trust is the only thing standing between the alliance and the upgrade.`,
              ]), badgeText: 'Temptation', badgeClass: 'gold' });
              addBond(_schemer, _target, -0.2); // subtle erosion from the scheming
            } else {
              ep.campEvents[_campKey].pre.push({ type: 'amuletReunion', players: [a, b], text: _rp([
                `${a} and ${b} check in about the amulet. Right now it's a ${_powerLabel}. Together they're stronger — and right now, that matters more than the upgrade.`,
                `"We use it together or not at all." ${a} and ${b} shake on it. For now, the pact holds.`,
                `${a} and ${b} discuss when to play the amulet. The ${_powerLabel} requires both of them to agree. Tonight? Next tribal? The decision is shared — and that's both powerful and fragile.`,
              ]), badgeText: 'Amulet Alliance', badgeClass: 'green' });
            }
          } else if (bond <= -1) {
            // ── RIVALRY PATH: actively targeting each other for the upgrade ──
            ep.campEvents[_campKey].pre.push({ type: 'amuletRivalry', players: [a, b], text: _rp([
              `${a} and ${b} both carry an amulet. Both know the other needs to go. The tribe can feel it — every conversation between them is a negotiation wrapped in a threat.`,
              `"One of us is going home eventually." ${a} said it to the confessional about ${b}. "And when they do, my amulet becomes a ${_nextPower || 'weapon'}. I can live with that."`,
              `The amulet has turned ${a} and ${b} into something worse than enemies. They're enemies with incentive. Every tribal where both survive is a tribal where neither gets stronger.`,
              `${a} is building a coalition against ${b}. Not because of the game — because of the amulet. Eliminate ${b}, upgrade to ${_nextPower || 'something better'}. It's that simple.`,
            ]), badgeText: 'Amulet Rivalry', badgeClass: 'red' });
            // Rivalry deepens the targeting
            addBond(a, b, -0.3);
          } else {
            // ── NEUTRAL PATH: sizing up, neither committing ──
            ep.campEvents[_campKey].pre.push({ type: 'amuletReunion', players: [a, b], text: _rp([
              `${a} and ${b} haven't talked about the amulet in days. The silence says more than any conversation could. Both are waiting to see who moves first.`,
              `${a} watches ${b} at the fire. Fellow amulet holder. The question isn't whether to work together or turn on each other. The question is when to decide.`,
              `Neither ${a} nor ${b} has committed to the amulet alliance. Neither has betrayed it. They exist in the space between — and the game won't let them stay there forever.`,
            ]), badgeText: 'Amulet Standoff', badgeClass: '' });
          }
        }
      }
    }
  }

  // ── POST-CHALLENGE phase: fill post events with outcome-aware boosts ──
  if (phase === 'post') {
    const postBoosts = { ...boosts };
    const pb = (id, amt) => { postBoosts[id] = (postBoosts[id] || 0) + amt; };

    if (gs.phase === 'pre-merge') {
      // Different boosts per tribe based on win/loss
      gs.tribes.forEach(tribe => {
        const present = getGroupPresent(tribe);
        const isLoser = ep.loser?.name === tribe.name;
        const isWinner = ep.winner?.name === tribe.name;
        const tribeBoosts = { ...boosts };
        const tb = (id, amt) => { tribeBoosts[id] = (tribeBoosts[id] || 0) + amt; };

        if (isLoser) {
          // Going to tribal — scramble, panic, scheming
          tb('rumor', 35); tb('dispute', 30); tb('tdStrategy', 30);
          tb('eavesdrop', 25); tb('doubt', 25); tb('confessional', 25);
          tb('fight', 20); tb('leadershipClash', 15);
          tb('weirdMoment', -10); tb('prank', -15); tb('flirtation', -10);
          // High-stat players stay visible even in a scramble — strategic/social players
          // still operate in panic mode; their archetype events shouldn't be buried
          const hasStrategist = present.some(n => pStats(n).strategic >= 8);
          const hasSocialPlayer = present.some(n => pStats(n).social >= 8);
          if (hasStrategist) { tb('mastermindOrchestrates', 20); tb('schemerManipulates', 15); }
          if (hasSocialPlayer) { tb('socialBoost', 15); tb('perceptiveReads', 12); }
        } else if (isWinner) {
          // Won immunity — relief, celebration, let guard down
          tb('tdBond', 30); tb('bond', 25); tb('flirtation', 20);
          tb('prank', 20); tb('weirdMoment', 20); tb('hardWork', 15);
          tb('confessional', 15); tb('showboat', 15);
          tb('fight', -15); tb('dispute', -15); tb('rumor', -10);
        } else {
          // Safe (3+ tribes) — watching from a distance, speculating
          tb('tdBond', 20); tb('confessional', 20); tb('tdStrategy', 15);
          tb('rumor', 15); tb('eavesdrop', 10);
        }
        const total = totalForGroup(present);
        // Loser tribe gets more post-challenge events — that's where the real action is
        const postCount = isLoser
          ? Math.floor(Math.random() * 4) + Math.max(6, Math.ceil(total * 0.8))
          : Math.floor(Math.random() * 3) + Math.max(5, Math.ceil(total * 0.7));
        if (!ep.campEvents[tribe.name]) ep.campEvents[tribe.name] = { pre: [], post: [] };
        const _existingPostEvts = ep.campEvents[tribe.name].post || [];
        ep.campEvents[tribe.name].post = [..._existingPostEvts, ...withSceneCtx({ ep: ep.num, phase: 'post', tribal: ep.loser?.name === tribe.name },
          () => generateCampEventsForGroup(present, [], tribeBoosts, postCount))];
      });
      // ── Sit-out narrative events ──
      if (ep.chalSitOuts) {
        const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
        gs.tribes.forEach(tribe => {
          const sos     = ep.chalSitOuts[tribe.name]     || [];
          const prevSos = ep.prevChalSitOuts?.[tribe.name] || [];
          if (!sos.length && !prevSos.length) return;
          const isLoser = ep.loser?.name === tribe.name;
          if (!ep.campEvents[tribe.name]) ep.campEvents[tribe.name] = { pre: [], post: [] };
          const post = ep.campEvents[tribe.name].post;
          // Events for current sit-outs
          sos.forEach(name => {
            const _p = pronouns(name);
            const totalSitOuts = gs.sitOutCount?.[name] || 1;
            if (isLoser) {
              Math.random(); post.push(scriptEvent({ type: 'sitOutHeat', players: [name], badgeText: 'BENCHED', badgeClass: 'red' },
                makeScene('sitout.heat', { a: name }, { tribe: tribe.name }, [], { id: 'confessional', label: 'Confessional' }), { ep: ep.num, phase: 'post', tribal: isLoser }));
            }
            if (totalSitOuts >= 2) {
              Math.random(); post.push(scriptEvent({ type: 'sitOutRecurring', players: [name], badgeText: 'BENCHED AGAIN', badgeClass: 'red' },
                makeScene('sitout.again', { a: name }, { tribe: tribe.name }, [], { id: 'confessional', label: 'Confessional' }), { ep: ep.num, phase: 'post', tribal: isLoser }));
              if (totalSitOuts >= 3) {
                Math.random(); post.push(scriptEvent({ type: 'sitOutPolitics', players: [name], badgeText: 'BENCH TALK', badgeClass: 'red' },
                makeScene('sitout.politics', { a: name }, { tribe: tribe.name }, [], { id: 'confessional', label: 'Confessional' }), { ep: ep.num, phase: 'post', tribal: isLoser }));
              }
            }
          });
          // Players who sat out last ep but competed this ep — forced back in or eager to prove themselves
          const returnedCompetitors = prevSos.filter(m => tribe.members.includes(m) && !sos.includes(m));
          returnedCompetitors.forEach(name => {
            if (Math.random() < 0.4) {
              const _p = pronouns(name);
              Math.random(); post.push(scriptEvent({ type: 'sitOutReturn', players: [name], badgeText: 'BACK IN', badgeClass: 'green' },
                makeScene('sitout.back', { a: name }, { tribe: tribe.name }, [], { id: 'confessional', label: 'Confessional' }), { ep: ep.num, phase: 'post', tribal: isLoser }));
            }
          });
        });
      }
    } else {
      // Post-merge: lighter outcome distinction — immunity winner is safe, everyone else is at risk
      const postBoostsMerge = { ...boosts };
      const pbm = (id, amt) => { postBoostsMerge[id] = (postBoostsMerge[id] || 0) + amt; };
      pbm('tdStrategy', 20); pbm('confessional', 20); pbm('doubt', 15);
      pbm('eavesdrop', 15); pbm('rumor', 15);
      const total = totalForGroup(gs.activePlayers);
      const postCount = Math.floor(Math.random() * 3) + Math.max(5, Math.ceil(total * 0.72));
      if (!ep.campEvents.merge) ep.campEvents.merge = { pre: [], post: [] };
      const _existingMergePost = ep.campEvents.merge.post || [];
      ep.campEvents.merge.post = [..._existingMergePost, ...withSceneCtx({ ep: ep.num, phase: 'post', tribal: true },
        () => generateCampEventsForGroup(gs.activePlayers.filter(p => p !== gs.exileDuelPlayer), [], postBoostsMerge, postCount))];
    }

    // ── Temporary bloc alignment events (non-named alliances forming for this vote) ──
    {
      const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
      const _namedNames = new Set((gs.namedAlliances || []).filter(a => a.active).map(a => a.name));
      (ep.alliances || []).forEach(bloc => {
        if (bloc.type === 'solo' || _namedNames.has(bloc.label)) return;
        if (!bloc.members || bloc.members.length < 2) return;
        const campKey = gs.phase === 'pre-merge'
          ? (gs.tribes.find(t => t.members.some(m => bloc.members.includes(m)))?.name || null)
          : 'merge';
        if (!campKey || !ep.campEvents[campKey]) return;
        const lead = bloc.members[0];
        const rest = bloc.members.slice(1);
        const restStr = rest.length === 1 ? rest[0] : rest.slice(0, -1).join(', ') + ' and ' + rest[rest.length - 1];
        const _p = pronouns(lead);
        ep.campEvents[campKey].post.push({ type: 'tempBloc', members: bloc.members, text: _rp([
          `${lead} and ${restStr} find themselves on the same side going into tribal. Whether it holds past tonight is a different question.`,
          `Something unspoken settles between ${lead} and ${restStr}. It isn't an alliance — not yet, maybe never. But tonight they're pointed the same direction.`,
          `${lead} pulls ${restStr} into a brief conversation. No formal names, no handshakes. Just an understanding for now.`,
          `${restStr} and ${lead} arrive at the same conclusion from different angles. That kind of alignment is fragile — but it only needs to last one night.`,
        ]) });
      });
    }

    // ── Inject guaranteed events for specific twists (post-challenge timing) ──
    const hasLovedOnes = allTwists.some(tw => tw?.type === 'loved-ones');
    if (hasLovedOnes) {
      Object.keys(ep.campEvents).forEach(campName => {
        const groupMembers = gs.phase === 'pre-merge'
          ? (gs.tribes.find(t => t.name === campName)?.members || [])
          : gs.activePlayers;
        if (!groupMembers.length) return;
        const p = groupMembers[Math.floor(Math.random() * groupMembers.length)];
        const _loP = pronouns(p);
        const loLines = [
          `${p} sees ${_loP.posAdj} loved one and completely loses it. The composure ${_loP.sub} ${_loP.sub==='they'?'have':'has'} been holding for weeks breaks in seconds.`,
          `${p} grabs ${_loP.posAdj} family and doesn't let go for a long time. The tribe looks away. Some of them are crying too.`,
          `${p} holds it together during the visit. Barely. The dam breaks the moment they leave.`,
          `Seeing home walks up to ${p} in person. ${_loP.Sub} ${_loP.sub==='they'?'keep':'keeps'} smiling. The smile doesn't reach ${_loP.posAdj} eyes.`,
        ];
        ep.campEvents[campName].post.unshift({ type: 'lovedOnes', text: loLines[Math.floor(Math.random() * loLines.length)] });
      });
    }

    const hasTheFeast = allTwists.some(tw => tw?.type === 'the-feast' || tw?.type === 'merge-reward');
    if (hasTheFeast) {
      const camp = Object.keys(ep.campEvents)[0];
      if (camp) {
        const all = gs.activePlayers;
        if (all.length >= 2) {
          const a = all[Math.floor(Math.random() * all.length)];
          const b = all.filter(p => p !== a)[Math.floor(Math.random() * (all.length - 1))];
          const ev = { type: 'feast', text: `The feast brings everyone to the same table for the first time. ${a} and ${b} end up next to each other. That conversation will matter.` };
          ep.campEvents[camp].post.unshift(ev);
        }
      }
    }

    // ── ARE WE THERE YETI post-challenge camp reactions ──
    if (ep.isAreWeThereYeti && ep.areWeThereYeti) {
      const yt = ep.areWeThereYeti;
      const camp = Object.keys(ep.campEvents)[0];
      if (camp) {
        if (!ep.campEvents[camp]) ep.campEvents[camp] = { pre: [], post: [] };
        const ytEvents = [];
        const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

        // Winning pair celebration + bond boost
        const winMembers = yt.immunityWinners || [];
        if (winMembers.length >= 2) {
          const [w1, w2] = winMembers;
          const pr1 = pronouns(w1);
          addBond(w1, w2, 1.5);
          ytEvents.push({ type: 'yetiWinBond', players: [w1, w2],
            badgeText: 'PAIR BOND', badgeClass: 'green',
            text: _rp([
              `${w1} and ${w2} can't stop grinning. They ran that forest together and survived. That kind of trust doesn't just disappear.`,
              `Back at camp, ${w1} bumps ${w2}'s fist without a word. The forest changed something between them.`,
              `${w2} tells anyone who'll listen how ${w1} kept them going when the trail went dark. ${pr1.Sub} just shrugs, but ${pr1.sub === 'they' ? 'they\'re' : pr1.sub + '\'s'} smiling.`,
              `${w1} and ${w2} sit apart from the others, still running on adrenaline. The forest forged something that camp politics can't easily break.`,
            ]) });
        }

        // Losing pair stress + blame dynamics
        const losePairLabel = yt.losingPair;
        const losePair = yt.pairs?.find(p => p.label === losePairLabel);
        if (losePair?.members?.length >= 2) {
          const [l1, l2] = losePair.members;
          const l1Score = yt.personalScores?.[l1] || 0;
          const l2Score = yt.personalScores?.[l2] || 0;
          const weaker = l1Score < l2Score ? l1 : l2;
          const stronger = weaker === l1 ? l2 : l1;
          const prW = pronouns(weaker);
          const prS = pronouns(stronger);

          // Blame event — stronger player frustrated at weaker
          const strongerTemp = pStats(stronger).temperament;
          const blameChance = strongerTemp * 0.08 + 0.1;
          if (Math.random() < blameChance) {
            addBond(stronger, weaker, -1.0);
            yt.chefGrudge[weaker] = (yt.chefGrudge[weaker] || 0) + 0.4;
            ytEvents.push({ type: 'yetiBlame', players: [stronger, weaker],
              badgeText: 'BLAME', badgeClass: 'red',
              text: _rp([
                `${stronger} won't say it directly, but ${prS.posAdj} body language screams it: ${weaker} cost them the challenge. ${prW.Sub} ${prW.sub === 'they' ? 'know' : 'knows'} it too.`,
                `"We would've had it if—" ${stronger} catches ${prS.ref} mid-sentence. The damage is done. ${weaker} heard enough.`,
                `${stronger} vents to the group about the challenge. ${prS.Sub} never says ${weaker}'s name, but everyone knows who ${prS.sub === 'they' ? 'they mean' : prS.sub + ' means'}.`,
                `${weaker} sits alone by the fire. ${stronger} hasn't said a word to ${prW.obj} since they got back. The silence says everything.`,
              ]) });
          }

          // Loser pair sadness/stress
          ytEvents.push({ type: 'yetiLoserStress', players: losePair.members,
            badgeText: 'POST-YETI STRESS', badgeClass: 'grey',
            text: _rp([
              `The losing pair comes back to camp exhausted and quiet. ${l1} and ${l2} can barely look at each other. The forest took something out of them.`,
              `${weaker} keeps replaying the race in ${prW.posAdj} head. Every wrong turn. Every hesitation. Chef saw all of it.`,
              `${l1} and ${l2} sit on opposite sides of camp. Neither wants to talk about what happened out there.`,
              `The others give ${l1} and ${l2} space. You can see it on their faces — they know Chef is watching, and one of them is going home.`,
            ]) });
        }

        // Stolen supply confrontation — thief gets called out
        const stolenItems = yt.stolenItems || [];
        if (stolenItems.length > 0) {
          const theft = _rp(stolenItems);
          const prT = pronouns(theft.thief);
          if (gs.activePlayers.includes(theft.thief) && gs.activePlayers.includes(theft.victim)) {
            const victimIntuition = pStats(theft.victim).intuition;
            const discoveryChance = victimIntuition * 0.08 + 0.15;
            if (Math.random() < discoveryChance) {
              addBond(theft.victim, theft.thief, -1.5);
              yt.chefGrudge[theft.thief] = (yt.chefGrudge[theft.thief] || 0) + 0.5;
              ytEvents.push({ type: 'yetiTheftConfrontation', players: [theft.victim, theft.thief],
                badgeText: 'CONFRONTATION', badgeClass: 'red',
                text: _rp([
                  `${theft.victim} finds ${prT.posAdj} ${theft.item} in ${theft.thief}'s bag. The confrontation is loud enough for Chef to hear from across camp.`,
                  `"Where's my ${theft.item}?" ${theft.victim} asks quietly. ${theft.thief} doesn't have a good answer. The whole tribe is watching now.`,
                  `${theft.victim} doesn't accuse ${theft.thief} directly — just pointedly asks the group if anyone's seen a ${theft.item}. ${theft.thief}'s face says it all.`,
                ]) });
            } else {
              ytEvents.push({ type: 'yetiTheftSuspicion', players: [theft.victim],
                badgeText: 'SUSPICIOUS', badgeClass: 'grey',
                text: `${theft.victim} can't find ${pronouns(theft.victim).posAdj} ${theft.item}. Keeps looking. Keeps wondering.` });
            }
          }
        }

        // Sasquatch stories — bonding over shared terror
        if (yt.sasquatch?.aggression >= 2) {
          const storytellers = gs.activePlayers.filter(n => !winMembers.includes(n));
          if (storytellers.length >= 2) {
            const [s1, s2] = storytellers.sort(() => Math.random() - 0.5).slice(0, 2);
            addBond(s1, s2, 0.8);
            ytEvents.push({ type: 'yetiSasquatchStory', players: [s1, s2],
              badgeText: 'SHARED FEAR', badgeClass: 'blue',
              text: _rp([
                `${s1} and ${s2} trade Sasquatchanakwa stories by the fire. Somehow surviving something terrifying together makes everything else feel smaller.`,
                `"Did you see how close it got?" ${s1} asks. ${s2} nods. They both laugh — the kind of laugh that comes out when you're still processing fear.`,
                `Nobody else believes what ${s1} and ${s2} saw in those woods. That's fine. They know. And that shared secret becomes its own kind of alliance.`,
              ]) });
          }
        }

        // Chef watching — players feel his eyes, paranoia builds
        const chefGrudgeEntries = Object.entries(yt.chefGrudge || {}).filter(([, v]) => v > 1.0).sort(([, a], [, b]) => b - a);
        if (chefGrudgeEntries.length > 0) {
          const [target] = chefGrudgeEntries[0];
          const prTgt = pronouns(target);
          if (gs.activePlayers.includes(target)) {
            ytEvents.push({ type: 'yetiChefWatch', players: [target],
              badgeText: 'CHEF\'S EYES', badgeClass: 'grey',
              text: _rp([
                `${target} catches Chef staring from across camp. No expression. Just... evaluating. ${prTgt.Sub} can't shake the feeling that the decision is already made.`,
                `Chef walks past ${target} without a word. Somehow that's worse than yelling. ${prTgt.Sub} ${prTgt.sub === 'they' ? 'start' : 'starts'} calculating what went wrong.`,
                `Everyone's laughing about something, but ${target} keeps glancing at Chef. ${prTgt.Sub} ${prTgt.sub === 'they' ? 'know' : 'knows'} ${prTgt.sub === 'they' ? 'they\'re' : prTgt.sub + '\'s'} on the chopping block. The forest doesn't lie.`,
              ]) });
          }
        }

        // Immunity winners' guilt or cockiness (archetype-driven)
        if (winMembers.length >= 1 && Math.random() < 0.5) {
          const winner = _rp(winMembers);
          const arch = players.find(p => p.name === winner)?.archetype;
          const prWin = pronouns(winner);
          if (arch === 'hero' || arch === 'loyal-soldier' || arch === 'social-butterfly') {
            const guiltTarget = gs.activePlayers.filter(n => !winMembers.includes(n))[0];
            if (guiltTarget) {
              addBond(winner, guiltTarget, 0.5);
              ytEvents.push({ type: 'yetiWinnerGuilt', players: [winner, guiltTarget],
                badgeText: 'SURVIVOR\'S GUILT', badgeClass: 'blue',
                text: _rp([
                  `${winner} pulls ${guiltTarget} aside. "I wish I could share immunity." ${prWin.Sub} ${prWin.sub === 'they' ? 'mean' : 'means'} it. That counts for something.`,
                  `${winner} can't enjoy the win. Not when ${prWin.sub} ${prWin.sub === 'they' ? 'know' : 'knows'} one of ${prWin.posAdj} friends is going home because Chef says so.`,
                ]) });
            }
          } else if (arch === 'villain' || arch === 'mastermind' || arch === 'schemer') {
            ytEvents.push({ type: 'yetiWinnerSmug', players: [winner],
              badgeText: 'SMUG', badgeClass: 'grey',
              text: _rp([
                `${winner} stretches out at camp with the confidence of someone who doesn't have to worry tonight. ${prWin.Sub} ${prWin.sub === 'they' ? 'make' : 'makes'} sure everyone notices.`,
                `"Chef can't touch me." ${winner} says it under ${prWin.posAdj} breath, but loud enough. The losers are not amused.`,
              ]) });
          }
        }

        // Partner who carried vs partner who was deadweight — bond shift
        const carryEvents = yt.timeline?.filter(e => e.type === 'partnerCarryChoice');
        if (carryEvents?.length) {
          const carry = _rp(carryEvents);
          if (carry.players?.length >= 2) {
            const [carrier, carried] = carry.players;
            if (gs.activePlayers.includes(carrier) && gs.activePlayers.includes(carried)) {
              addBond(carried, carrier, 1.0);
              const prC = pronouns(carried);
              ytEvents.push({ type: 'yetiGratitude', players: [carried, carrier],
                badgeText: 'GRATITUDE', badgeClass: 'green',
                text: _rp([
                  `${carried} finds ${carrier} after the challenge. "I know you carried me out there. I won't forget that." ${prC.Sub} ${prC.sub === 'they' ? 'won\'t' : 'won\'t'}.`,
                  `${carried} doesn't say much to ${carrier}. Just hands ${pronouns(carrier).obj} the best spot by the fire. Some debts don't need words.`,
                ]) });
            }
          }
        }

        // Shuffle and add to camp events
        ytEvents.sort(() => Math.random() - 0.5);
        ep.campEvents[camp].post.push(...ytEvents);
      }
    }

    // Survival events — provider/slacker/food crisis
    generateSurvivalEvents(ep);
    // Paranoia spiral — fires before social bomb (bond hits stack)
    checkParanoiaSpiral(ep);
    // Information broker — double agent playing both alliances
    checkInformationBroker(ep);
    // Stolen credit — bold player takes credit for another's big move
    checkStolenCredit(ep);
    // Fake idol plant — strategic player crafts and plants a fake idol
    checkFakeIdolPlant(ep);
    // Fake idol tip-off confrontation (fires next episode after tip-off)
    generateFakeIdolTipOffEvents(ep);
    generateBlackVoteGuessEvents(ep);
    // Social bomb check — fires before alliance quitting (bond hits can trigger quitting)
    checkSocialBomb(ep);
    // Alliance quitting evaluated once after all events are done, then recruitment (scenarios A + B)
    checkAllianceQuitting(ep);
    checkAllianceRecruitment(ep);
    // Goat targeting: merge recognition + late-game FTC threat reassessment
    checkGoatTargeting(ep);
  }

  // ── 'both' phase: no pre/post distinction (no-tribal, finale) — just one block ──
  if (phase === 'both') {
    generateSurvivalEvents(ep);
    checkParanoiaSpiral(ep);
    checkInformationBroker(ep);
    checkStolenCredit(ep);
    checkFakeIdolPlant(ep);
    generateFakeIdolTipOffEvents(ep);
    generateBlackVoteGuessEvents(ep);
    // Social bomb + alliance quitting + recruitment after the single-phase generation
    checkSocialBomb(ep);
    checkAllianceQuitting(ep);
    checkAllianceRecruitment(ep);
    checkGoatTargeting(ep);
  }

  // ── Slow burn sparks: grow/decay spark intensity before showmance formation ──
  updateRomanticSparks(ep);
  // ── First move: fire when spark intensity crosses archetype threshold ──
  checkFirstMove(ep);
  // ── Showmance sabotage: villain/schemer engineers romantic crisis to destroy a couple ──
  checkShowmanceSabotage(ep);
  // ── Showmance formation: check all pairs after bonds are updated this episode ──
  checkShowmanceFormation(ep);
  // ── Showmance lifecycle: progress phases, generate phase-specific events ──
  updateShowmancePhases(ep);
  // ── Love triangle: detect 3-way romantic tension + progress phases ──
  checkLoveTriangleFormation(ep);
  updateLoveTrianglePhases(ep);
  // ── Secret affairs: progress exposure tiers ──
  updateAffairExposure(ep);
  // Persistent strategy is surfaced sparingly, after ordinary camp scenes
  // exist and before access metadata is attached.
  generateIntentionStoryEvents(ep, phase);
  if (phase === 'both') {
    attachCampAccessToEvents(ep, 'pre');
    attachCampAccessToEvents(ep, 'post');
  } else {
    attachCampAccessToEvents(ep, phase);
  }
}
