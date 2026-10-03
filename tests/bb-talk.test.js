// The house's talk as scripts (spec 2026-10-01 Phase 5).
//
// Each of the spec's talk intents is played by an existing event that keeps
// its own casting, weight and consequences; the conversion moved only the
// words, into js/bb/script/lines/talk.js. These tests hold that line: the
// season must not change, the scripts must be whole, and a line that stages
// a room may only air in it.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { POOLS } from '../js/bb/script/lines/index.js';
import { writing } from '../js/bb/script/write.js';
import { registerOf } from '../js/bb/script/facts.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const R = JSON.parse(readFileSync(resolve(process.cwd(), 'franchise_roster.json'), 'utf8'));
const POOL = (Array.isArray(R) ? R : R.players || Object.values(R)[0]).filter(p => p?.stats && p.name);

// intent → the event that plays it
const CONVERTED = {
  campaign: 'deals-vote-pitch', 'final-two': 'deals-final-two', safety: 'deals-safety',
  debrief: 'deals-numbers-check', reaffirm: 'deals-reaffirm', confront: 'social-blow-up',
  gossip: 'social-info-trade', comfort: 'social-comfort-block', 'pitch-target': 'power-hoh-pitch',
  'hoh-visit': 'power-hoh-room-court', 'hoh-decide': 'power-hoh-deciding',
};
// Phase 6: the rest of the house, converted a file at a time. Each batch adds its ids.
const PHASE6 = [
  // bb-events/social.js
  'social-alliance-forms', 'social-late-night-trust', 'social-paranoia', 'social-rumour',
  'social-showmance-spark', 'social-grudge-hardens', 'social-drifting-out',
  // bb-events/deals.js
  'deals-exposed', 'deals-defection', 'deals-broken-promise', 'deals-jury-management', 'deals-final-three-pact',
  'deals-competing', 'deals-hedged', 'deals-jury-pact', 'deals-vote-flip',
  // bb-events/alliance-life.js
  'alliance-missed-meeting', 'alliance-inner-two', 'alliance-overlap-compares-notes', 'alliance-unauthorized-vote-fear',
  'alliance-side-deal-protected', 'alliance-wrong-blame', 'alliance-name-slips',
  // built inside the week engine (bb/script/inject.js)
  'alliance-formed', 'alliance-inner-circle', 'alliance-recruited', 'alliance-betrayal', 'alliance-repair', 'alliance-collapsed',
  'campaign-pitch',
  // bb-events/power.js
  'power-nom-campaign', 'power-block-pressure', 'power-pawn-resents', 'power-ceremony-confrontation',
  'power-hoh-traffic', 'power-hoh-weight', 'power-hoh-promise',
  'power-replacement-fallout', 'power-saved-guilt', 'power-hoh-refuses', 'power-veto-draw-lobby', 'power-veto-promise',
  'power-hoh-room-reveal', 'power-hoh-room-overstay', 'power-hoh-room-queue', 'power-hoh-room-last-night', 'power-hoh-room-spy',
  'power-pawn-ask', 'power-backdoor-plan', 'power-nom-eve-guessing', 'power-saved-themselves', 'power-replacement-reacts',
  'power-veto-no-surprise', 'power-pick-me-lobby', 'power-fears-backdoor',
  // bb-events/house-life.js
  'life-prank', 'life-chores', 'life-diary-room', 'life-sleepless', 'life-homesick', 'life-kitchen-table', 'life-showmance-domestic',
  // bb-events/house-friction.js
  'friction-noise', 'friction-condescended', 'friction-space', 'friction-same-story', 'friction-snapped', 'friction-joke-lands-wrong',
  'life-workout', 'life-cooks-for-everybody', 'life-invented-game', 'life-real-conversation', 'life-grooming', 'life-talking-about-home',
  'life-boredom', 'life-inside-joke',
  // bb-events/phases.js
  'phase-open-field', 'phase-pre-positioning', 'phase-scramble', 'phase-power-changes-people', 'phase-block-isolation',
  'phase-safe-relief', 'phase-lobby-veto', 'phase-veto-holder-weighs', 'phase-last-night-equal', 'phase-outgoing-exposed',
  'phase-hoh-room', 'phase-targets-align', 'phase-nominee-reckons', 'phase-house-takes-sides', 'phase-hoh-pressures-veto',
  'phase-replacement-fear',
  // bb-events/blocs.js
  'bloc-noticed', 'bloc-vote-tell', 'bloc-target-picked', 'bloc-recruit', 'bloc-told', 'bloc-blowup',
  // bb-events/venue.js
  'venue-shared-space', 'venue-private-corner', 'venue-atmosphere', 'venue-overlooked',
  // bb-events/fallout.js
  'fallout-grief', 'fallout-hypocrisy', 'fallout-relief', 'fallout-blame', 'fallout-denial', 'fallout-recognition',
  'fallout-rogue-hunt', 'fallout-word-gets-around',
  // bb-events/bonds.js
  'bond-first-kiss', 'bond-quiet-night', 'bond-best-friends', 'bond-bad-day', 'bond-cold-war', 'bond-petty',
  'bond-apology-refused',
  // bb-events/reign.js (the house meeting keeps its own screen)
  'reign-announces-target', 'reign-loyalty-test', 'reign-house-decides', 'reign-apologises', 'reign-reckoning',
  'reign-carve-it-up', 'reign-works-both-rooms',
  // bb-events/schemes.js
  'scheme-forge-note', 'scheme-spread-lies', 'scheme-whisper-campaign', 'scheme-campaign-rally', 'scheme-false-majority',
  'scheme-kiss-trap', 'scheme-exposed', 'scheme-comfort-victim', 'scheme-false-accusation', 'scheme-accusation-collapses',
  // bb-events/story-followups.js
  'followup-isolation-check-in', 'followup-overheard-confrontation', 'followup-lie-damage-control', 'followup-fight-aftershock',
  // bb-events/location-texture.js
  'texture-kitchen-lesson', 'texture-backyard-game', 'texture-bedroom-snoring', 'texture-washroom-haircut',
  'texture-living-room-trial', 'texture-pantry-name-drop', 'texture-diary-room-rant', 'texture-hoh-letter',
  // bb-events/editorial-social.js
  'editorial-bedroom-politics', 'editorial-interrupted-whisper', 'editorial-kitchen-after-dark', 'editorial-secret-spill',
  'editorial-hoh-orbit', 'editorial-apology-tour', 'editorial-poolside-spark', 'editorial-vote-flip-room',
  'editorial-house-roast', 'editorial-storage-room-breakdown', 'editorial-meeting-crash', 'editorial-silent-standoff',
  // bb-events/consequence-arcs.js
  'arc-lie-disproved-later', 'arc-apology-without-trust', 'arc-fight-splits-the-room', 'arc-promise-exposed-by-count',
  'arc-comfort-becomes-loyalty', 'arc-blindside-rewatch', 'arc-rogue-vote-denial', 'arc-wrong-person-blamed-lingers',
  'arc-threatened-remembers', 'arc-endgame-sole-voter-court', 'arc-endgame-cut-calculus',
  'arc-endgame-unbeatable-realization', 'arc-endgame-final-three-promises-compared', 'arc-endgame-jury-math',
];
// Engine beats keep the players list the engine counts; a fallout scene is had
// with an alliance member who is not on it, so these skip the speaker check.
const OFF_CARD = new Set(['alliance-betrayal', 'alliance-repair', 'bloc-recruit']);
// Engine beats fall back to their plain sentence when there is nobody to have
// the scene with (an alliance down to its betrayer): those carry no script.
const INJECTED = new Set(['alliance-formed', 'alliance-inner-circle', 'alliance-recruited', 'alliance-betrayal', 'alliance-repair', 'alliance-collapsed',
  'campaign-pitch',     // a pitch folded into one summary for several voters keeps its sentence
  // with no HOH to name (an Invisible HOH week) these keep a plain sentence
  'power-replacement-fallout', 'power-saved-themselves', 'power-replacement-reacts', 'power-veto-fallout', 'power-veto-no-surprise']);
const scripted = b => EVENT_IDS.has(b.eventId) && (Array.isArray(b.lines) || !INJECTED.has(b.eventId));
const EVENT_IDS = new Set([...Object.values(CONVERTED), ...PHASE6]);
// Converted, but these three seasons cannot be sure of one: a first kiss needs a
// showmance (not a spark) under two weeks old, about 0.4 a season; the two
// reign-* ones need two Heads of Household, which only Battle of the Block gives;
// a kiss trap needs a showmance and an accomplice the schemer is close to.
const RARE = new Set(['bond-first-kiss', 'reign-carve-it-up', 'reign-works-both-rooms', 'scheme-kiss-trap']);

function playSeason(seed, shift) {
  const cast = Array.from({ length: 14 }, (_, i) => POOL[(i * 11 + 3 + shift) % POOL.length]).map(p => ({ name: p.name,
    archetype: p.archetype || 'floater', gender: p.gender || 'm', sexuality: p.sexuality || 'straight', stats: { ...p.stats } }));
  seedGame(cast, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, popularityEnabled: true });
  seasonConfig.twistSchedule = [];
  gs.riPlayers = gs.riPlayers || []; gs.tribes = gs.tribes || [];
  withSeededRandom(seed, () => { for (let w = 0; w < 16 && gs.phase !== 'complete'; w++) simulateBBEpisode(); });
  return (gs.episodeHistory || []).map(ep => JSON.parse(JSON.stringify(ep)));
}
const beatsOf = eps => eps.flatMap(ep => (ep.acts || []).flatMap(a => (a.socialBeats || []).map(b => ({ ...b, week: ep.num, hoh: ep.hoh, act: a.type }))));
/** What the season DID: every event with its people and result, every week's ceremonies. */
const record = eps => eps.map(ep => [ep.hoh, ...(ep.initialNominees || []), ep.vetoWinner, ep.evicted,
  ...(ep.acts || []).flatMap(a => (a.socialBeats || []).map(b => `${b.eventId}:${(b.players || []).join(',')}:${b.badgeText}`))].join('|'));

let seasons = [];
beforeAll(() => { seasons = [playSeason(4242, 0), playSeason(777, 5), playSeason(31337, 10)]; }, 900000);

describe('converting the words did not change the game', () => {
  it('plays the same season with the words muted', () => {
    // Muted, no scene is written at all: no pick, no ledger, no dice. Every
    // event, every person in it, every result and every eviction must match.
    // (The house's scenes once picked with the scheduler's rng; converting one
    // event then changed every draw after it.)
    const voiced = record(seasons[0]);
    writing.muted = true;
    try {
      expect(record(playSeason(4242, 0))).toEqual(voiced);
    } finally { writing.muted = false; }
  }, 900000);
});

describe('every intent airs as a script', () => {
  it('fires each converted event as a written exchange', () => {
    const fired = new Set();
    for (const eps of seasons) for (const b of beatsOf(eps)) {
      if (!scripted(b)) continue;
      fired.add(b.eventId);
      // A script: at least one line somebody SAYS (a lone Diary Room counts), never only narration.
      expect(Array.isArray(b.lines) && b.lines.some(l => l.kind !== 'beat'), `${b.eventId} week ${b.week} has no script`).toBe(true);
    }
    for (const id of EVENT_IDS) if (!RARE.has(id)) expect(fired.has(id), `${id} never fired in three seasons`).toBe(true);
  });

  it('fills every slot, and only the people in the scene speak', () => {
    for (const eps of seasons) for (const b of beatsOf(eps)) {
      if (!scripted(b)) continue;
      for (const l of b.lines) {
        expect(l.text, `${b.lineId}`).not.toMatch(/[{}]|undefined|null/);
        if (l.by && !OFF_CARD.has(b.eventId)) expect(b.players.includes(l.by), `${l.by} speaks in ${b.lineId} but is not in it`).toBe(true);
      }
    }
  });

  it('never airs the same exchange twice in a week, and keeps a season fresh', () => {
    for (const eps of seasons) {
      const week = new Set();
      const heard = new Map();
      let lines = 0, repeats = 0, selfRepeats = 0;
      for (const b of beatsOf(eps)) {
        if (!scripted(b)) continue;
        const k = `${b.week}|${b.lineId}`;
        expect(week.has(k), `${b.lineId} twice in week ${b.week}`).toBe(false);
        week.add(k);
        for (const l of b.lines) {
          if (l.kind === 'beat' || l.text.length < 20) continue;
          lines++;
          const by = heard.get(l.text);
          if (by) { repeats++; if (by.has(l.by)) selfRepeats++; by.add(l.by); } else heard.set(l.text, new Set([l.by]));
        }
      }
      // Spec §7: under 12% of lines heard before this season, under 1.5% a person
      // repeating themselves. Held tighter here than the spec asks: 6%.
      expect(repeats / lines, `${repeats} of ${lines} lines repeat`).toBeLessThan(0.06);
      expect(selfRepeats / lines, `${selfRepeats} of ${lines} are somebody repeating themselves`).toBeLessThan(0.015);
    }
  });

  it('puts nobody in the HOH room without the HOH', () => {
    for (const eps of seasons) for (const b of beatsOf(eps)) {
      if (!scripted(b) || b.location !== 'hoh-room' || !b.hoh) continue;
      expect(b.players.includes(b.hoh), `${b.eventId} week ${b.week} is in the HOH room without ${b.hoh}`).toBe(true);
    }
  });
});

describe('people sound like themselves', () => {
  // A line written for a register (schemer, fiery, shy, sweet, competitor,
  // cool) airs only from a speaker who talks that way, and those lines do air.
  // The register is read when the scene is written; archetypes do not change
  // mid-season, so reading it again here gives the same answer.
  it('airs register lines, each from a speaker with that register', () => {
    const byId = new Map(Object.values(POOLS).flat().map(e => [e.id, e]));
    let aired = 0;
    const registers = new Set();
    for (let i = 0; i < seasons.length; i++) {
      const eps = seasons[i];
      playSeason([4242, 777, 31337][i], [0, 5, 10][i]);   // the season's players, for registerOf
      for (const b of beatsOf(eps)) {
        const want = byId.get(b.lineId)?.when?.register;
        if (!want) continue;
        const speaker = b.players[0];   // every converted event lists its a first
        aired++;
        registers.add(want);
        expect(registerOf(speaker), `${b.lineId} is written for ${want}, spoken by ${speaker}`).toBe(want);
      }
    }
    expect(aired, 'no personality line aired in three seasons').toBeGreaterThan(10);
    expect(registers.size, `only ${[...registers].join(', ')} ever aired`).toBeGreaterThanOrEqual(4);
  }, 900000);
});

describe('the talk pools', () => {
  // Staging that names a room airs only in that room. The scene picks its room
  // before its words, so an ungated "pulls her into the storage room" played
  // in the bedroom.
  const ROOM_WORDS = [['kitchen', /kitchen|cupboard/i], ['bedroom', /bedroom|between the beds|'s bed\b/i],
    ['backyard', /backyard|the grass/i], ['pantry', /storage room|pantry/i], ['living-room', /living room/i]];
  const FIXED = { 'editorial.bedroom': 'bedroom', 'editorial.latenight': 'kitchen', 'editorial.spark': 'backyard', 'editorial.flip': 'bedroom', 'editorial.breakdown': 'pantry', 'editorial.meeting': 'bedroom', 'editorial.standoff': 'kitchen', 'texture.kitchen': 'kitchen', 'texture.backyard': 'backyard', 'texture.snoring': 'bedroom', 'texture.namedrop': 'pantry', 'texture.trial': 'living-room', 'followup.isolation': 'kitchen', 'followup.overheard': 'living-room', 'followup.damage': 'pantry', 'followup.aftershock': 'bedroom', 'reign.carve': 'hoh-room', 'reign.both': 'hoh-room', 'bond.kiss': 'bedroom', 'bond.quiet': 'bedroom', 'bond.bad-day': 'bedroom', 'bond.petty': 'kitchen', 'fallout.grief': 'bedroom', 'fallout.rogue': 'kitchen', 'bloc.blowup': 'kitchen', 'phase.hoh-room': 'hoh-room', 'phase.scramble': 'hoh-room', 'phase.targets': 'hoh-room', 'phase.leaned': 'hoh-room', 'friction.dishes': 'kitchen', 'friction.food': 'kitchen', 'life.chores': 'kitchen', 'life.table': 'kitchen', 'life.cook': 'kitchen', 'life.workout': 'backyard', 'talk.safety': 'hoh-room', 'talk.pitch-target': 'hoh-room', 'talk.hoh-visit': 'hoh-room', 'talk.hoh-decide': 'hoh-room' };
  it('only stages a room where the scene is', () => {
    for (const [key, pool] of Object.entries(POOLS)) {
      if (!/^(talk|social|deals|alliance|power|campaign|life|friction|phase|bloc|venue|fallout|bond|reign|scheme|followup|texture|editorial|arc)\./.test(key)) continue;
      const fixed = FIXED[key.split('.').slice(0, 2).join('.')];
      for (const e of pool) for (const t of e.turns) {
        if (!t.beat) continue;
        for (const [room, re] of ROOM_WORDS) {
          if (!re.test(t.beat)) continue;
          const ok = fixed === room || (e.when?.room || []).includes(room);
          expect(ok, `${key} ${e.id} stages the ${room} without when.room: ${t.beat}`).toBe(true);
        }
      }
    }
  });

  it('gives every intent a pool for each ending its event decides', () => {
    const ENDINGS = { campaign: ['lands', 'refused'], 'final-two': ['made'], safety: ['deal', 'lie', 'seen'],
      debrief: ['sure', 'shaky'], reaffirm: ['solid', 'doubt', 'cut', 'seen'], confront: ['volatile', 'calculated', 'general'],
      gossip: ['traded'], comfort: ['kind'], 'pitch-target': ['lands', 'overplayed'], 'hoh-visit': ['court'], 'hoh-decide': ['named'] };
    for (const [intent, ends] of Object.entries(ENDINGS)) {
      for (const e of ends) expect(POOLS[`talk.${intent}.${e}`]?.length, `talk.${intent}.${e}`).toBeGreaterThanOrEqual(6);
    }
  });
});
