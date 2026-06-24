// js/chal/backstabbers-ahoy.js — Backstabbers Ahoy!: a two-part aquatic challenge (pre-merge tribe challenge)
// Phase 1 The Deep Dive: one diver + an air-pump crew, balance the air, dodge Fang.
// Phase 2 The Gull Run: boat race, driver + gunner shooting mutant gulls at mines.
// Signature mechanic: a SCHEMER can THROW the challenge for their own team — heavily subtracting points,
// enough to FLIP a win into a loss. A high-intuition teammate can EXPOSE them (or get framed if the read fails).
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function noise(range = 2.5) { return (Math.random() - 0.5) * range; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }

const _usedTexts = new Set();
function _pickUnique(pool, ...args) {
  const available = pool.filter((_, i) => !_usedTexts.has(pool[i]));
  const chosen = available.length > 0 ? pick(available) : pick(pool);
  _usedTexts.add(chosen);
  return chosen(...args);
}

const NICE_ARCHS = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN_ARCHS = new Set(['villain', 'mastermind', 'schemer']);
function canSabotage(name) {
  const a = arch(name);
  if (VILLAIN_ARCHS.has(a)) return true;
  if (NICE_ARCHS.has(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

// ══════════════════════════════════════════════════════════════════════
// NARRATION TEXT POOLS
// ══════════════════════════════════════════════════════════════════════

const HOST_INTRO = [
  h => `${h} stands on the dock in a captain's hat. "Welcome to Backstabbers Ahoy! Two parts. First you dive for the skis. Then you race boats and fire mutant gulls at mines. Try not to sabotage your own crew. Or do."`,
  h => `"Here's the deal," ${h} grins, salt spray in his hair. "One diver per team goes down in a brass suit. The rest pump air. Then we race. Whoever blows the last mine wins immunity. Losers hit tribal."`,
  h => `${h} taps a barnacled diving helmet. "Phase one: the deep dive. Phase two: the gull run. Combine your scores. Highest total takes immunity. And keep an eye on your teammates — not everyone wants to win."`,
  h => `"Divers, crews, drivers, gunners," ${h} counts on his fingers. "Two phases, one winner. Fang's hungry, the gulls are mutant, and somebody on a team might just throw the whole thing. Great TV."`,
];

const HOST_PHASE = {
  dive: [
    h => `"PHASE ONE — THE DEEP DIVE!" ${h} bellows. "One diver per team sinks in a brass suit. The crew works the air pump. Too much air and they balloon up. Too little and they drown. Find that sweet spot."`,
    h => `${h} points at the murky water. "The skis are on the seabed. Your diver goes down, your crew pumps the air. And Fang? Fang's down there too, and he is NOT a fan of brass suits."`,
  ],
  race: [
    h => `"PHASE TWO — THE GULL RUN!" ${h} fires a flare. "Boats in the water. Driver steers, gunner shoots mutant gulls at the mines. Blow the most mines, score the most points. Watch the weeds and the venom-gulls."`,
    h => `${h} stands on the committee boat. "Race phase. Driver and gunner per team. Load the gull cannon, lead the target, detonate the mines. First crew to blow the last one looks real good for immunity."`,
  ],
};

const HOST_WINNER = [
  (h, w) => `${h} raises the immunity totem. "${w}! Highest combined score — dive plus race. Immunity is YOURS!"`,
  (h, w) => `"${w} wins!" ${h} is beaming. "Best diver, best gunner, fewest backstabs. That's how you do it."`,
  (h, w) => `${h} nods at ${w}. "Add it all up and ${w} comes out on top. Immunity. The rest of you — see you at tribal."`,
];

const HOST_LOSER = [
  (h, l) => `${h} shakes his head at ${l}. "Lowest total. Somebody dragged you down out there. Tribal council. Tonight."`,
  (h, l) => `"${l}…" ${h} counts the score again. "You came up short. Maybe it was the dive. Maybe it was a traitor. Either way — tribal."`,
  (h, l) => `${h} doesn't smile. "${l}, you lost it. Whether you were thrown or just slow, somebody's going home. Tribal awaits."`,
];

// ── PHASE 1: DIVE — good pump ──
const DIVE_GOOD = [
  (d, c, dPr) => `${c} works the pump in a steady rhythm and ${d} sinks clean into the murk, suit pressure perfect. ${dPr.Sub} reads the current and kicks straight for the skis.`,
  (d, c, dPr) => `${c}'s crew finds the sweet spot — not too much air, not too little. ${d} glides down like ${dPr.sub} was born in a brass suit and snatches the skis off the seabed.`,
  (d, c, dPr) => `Perfect air delivery. ${c} keeps ${d} neutral and steady. ${dPr.Sub} walks the seabed and clamps onto the skis. "Got 'em!"`,
  (d, c, dPr) => `${c} and the crew pump in perfect time. ${d} drops fast, controlled, and hauls the skis up out of the silt. Textbook.`,
];

const DIVE_OVER = [
  (d, c, dPr) => `${c} leans on the pump way too hard. ${d}'s suit balloons up like a parade float and ${dPr.sub} bobs helplessly toward the surface, skis just out of reach.`,
  (d, c, dPr) => `Too much air! ${c} over-cranks the pump and ${d} pops off the seabed, arms windmilling, completely out of control.`,
  (d, c, dPr) => `${c}'s crew panics and floods the line. ${d} inflates like a balloon and shoots upward, losing all the progress ${dPr.sub} made.`,
];

const DIVE_UNDER = [
  (d, c, dPr) => `${c} barely works the pump and ${d}'s air runs thin. ${dPr.Sub} gasps, sees stars, and has to surface early — empty-handed.`,
  (d, c, dPr) => `Not enough air! ${c} falls behind on the pump and ${d} starts running out down below. ${dPr.Sub} aborts and kicks for the surface.`,
  (d, c, dPr) => `${c}'s crew can't keep pace. ${d} sucks the line dry, panics, and bails out before reaching the skis.`,
];

// ── PHASE 1: Fang ──
const FANG_RESIST = [
  (d, dPr) => `Fang clamps onto ${d}'s air line and thrashes. ${dPr.Sub} stares the shark dead in the eye, yanks the line free, and keeps swimming. Ice cold.`,
  (d, dPr) => `Fang lunges out of the murk. ${d} doesn't flinch — bonks the mutant shark on the snout and shoves past it toward the skis.`,
  (d, dPr) => `${d} feels Fang circling, times the charge, and rolls aside as the shark snaps shut on nothing. "Not today, fishstick."`,
];

const FANG_HIT = [
  (d, dPr) => `Fang rockets out of the dark and chomps ${d}'s flipper. ${dPr.Sub} flails, drops the skis, and burns precious seconds shaking the shark off.`,
  (d, dPr) => `${d} freezes as Fang's jaws close on the air line. The shark drags ${dPr.obj} sideways and the dive falls apart.`,
  (d, dPr) => `Fang body-checks ${d} into the seabed. ${dPr.Sub} loses ${dPr.posAdj} grip on the skis and the shark circles back for more.`,
];

// ── PHASE 1: clutch ski grab ──
const SKI_CLUTCH = [
  (d, dPr) => `Air running low, Fang closing in, ${d} makes a desperate lunge and rips the skis off the seabed in the last second. The crew goes wild on the dock.`,
  (d, dPr) => `${d} ignores the screaming pressure gauge, kicks one more stroke, and clamps both skis under ${dPr.posAdj} arm. Clutch.`,
];

// ── PHASE 2: RACE — driving ──
const DRIVE_GOOD = [
  (dr, drPr) => `${dr} guns the dinghy through the chop, carving a clean line around the weeds and threading the rocks like a stunt driver.`,
  (dr, drPr) => `${dr} owns the throttle, leaning into every turn. The boat skips across the bay and pulls ahead of the pack.`,
  (dr, drPr) => `${dr} reads the water perfectly, dodges a venom-gull, and keeps the gunner steady on a smooth, fast line.`,
  (dr, drPr) => `${dr} drives like ${drPr.sub} stole it — full speed, no fear, the bay spray flying off the bow.`,
];

const DRIVE_BAD = [
  (dr, drPr) => `${dr} clips a rock and the boat slews sideways into the weeds. ${drPr.Sub} fights the wheel but loses a chunk of the lead.`,
  (dr, drPr) => `${dr} takes the turn too wide, plows into a weed bank, and the dinghy bogs down. The gunner can't get a clean shot.`,
  (dr, drPr) => `A venom-gull dive-bombs the cockpit and ${dr} swerves hard, killing all the speed. The boat wallows.`,
];

// ── PHASE 2: gunning ──
const GUN_HIT = [
  (g, gPr) => `${g} lines up the gull cannon, leads the target, and BLAM — direct hit on the mine. The blast rocks both boats. "That's how it's DONE!"`,
  (g, gPr) => `${g} loads a mutant gull, tracks the mine, and squeezes. Bullseye — the mine detonates in a geyser of bay water.`,
  (g, gPr) => `${g} doesn't even blink. One gull, one mine, one massive explosion. ${gPr.Sub} reloads before the spray even lands.`,
  (g, gPr) => `${g} calls the wind, leads the mine, and fires. Direct hit. The crew whoops as debris rains down.`,
];

const GUN_MISS = [
  (g, gPr) => `${g} fires too early — the gull sails wide and splashes harmlessly past the mine. ${gPr.Sub} swears and reloads.`,
  (g, gPr) => `${g} jerks the cannon at the last second and the gull arcs off into open water. Mine still floating.`,
  (g, gPr) => `A gust catches ${g}'s shot and the gull veers off-target. So close. Reload.`,
];

// ── PHASE 2: venom-gull knockout ──
const VENOM_GULL = [
  (n, pr) => `A venom-gull divebombs ${n} and pecks ${pr.obj} right off the bench. ${pr.Sub} goes down clutching ${pr.posAdj} face — out for the count.`,
  (n, pr) => `${n} takes a venom-gull straight to the head. The toxin hits and ${pr.sub} slumps over the gunwale, useless for the rest of the run.`,
];

// ── SIGNATURE: BACKSTAB / THROW ──
const BACKSTAB_DIVE = [
  (s, v, sPr) => `"No way we win this. And winning ruins my plan." ${s} cranks the air pump to the max on purpose — ${v}'s suit balloons up and the dive is blown. The crew never sees it coming.`,
  (s, v, sPr) => `${s} 'fumbles' the pump and floods ${v}'s air line. ${v} rockets to the surface, useless, while ${s} shrugs. "Whoops. My bad."`,
  (s, v, sPr) => `Quietly, deliberately, ${s} chokes off ${v}'s air a few breaths too long. ${v} surfaces gasping, the skis lost. ${s} hides a smile.`,
];

const BACKSTAB_RACE = [
  (s, v, sPr) => `${s} swings the gull cannon a few degrees off and fires a gull straight into ${v}'s back. The boat veers into the weeds. "Sorry, must've slipped."`,
  (s, v, sPr) => `${s} lines up the mine… and 'misses' on purpose, three times in a row. The crew has no idea their own gunner is throwing it.`,
  (s, v, sPr) => `${s} 'accidentally' fires a gull into the boat's own engine. ${v} loses steering and the dinghy spins out. ${s} feigns horror.`,
];

// ── SIGNATURE: EXPOSURE ──
const EXPOSE_SUCCESS = [
  (e, s, ePr) => `"That gull came from OUR boat — ${s}'s cannon was the only one aimed our way." ${e} reads the angles like a detective and locks eyes with ${s}. The crew goes silent. Caught.`,
  (e, s, ePr) => `${e} watches the pump gauge, watches ${s}'s hands, and puts it together. "You're throwing this. On PURPOSE." ${s} has nowhere to hide.`,
  (e, s, ePr) => `${e} replays every 'mistake' in ${pronouns(e).posAdj} head and the pattern snaps into focus. "${s}. It was you. You sandbagged us." The whole team turns to stare.`,
];

const EXPOSE_BACKFIRE = [
  (e, s, ePr) => `${e} points the finger at ${s} — but ${s} spins it instantly. "ME? You're the one who fumbled the line!" The crew turns on ${e} instead. The frame holds.`,
  (e, s, ePr) => `${e} accuses ${s} of throwing it, but ${s} is too smooth. "Convenient, blaming me for YOUR screwup." Suddenly ${e} is the suspect, and nobody believes ${pronouns(e).obj}.`,
  (e, s, ePr) => `${e} tries to expose ${s}, but ${s} flips the read cold. "Funny — ${e}'s the one who's been off all day." The team buys it. ${e} takes the heat for a crime ${pronouns(e).sub} didn't commit.`,
];

// ── SOCIAL: encouragement / brave ──
const BRAVE_TEXT = [
  (n, pr) => `${n} hammers the pump and screams encouragement down the air line. "BREATHE EASY, WE GOT YOU!" The whole crew syncs up behind ${pr.obj}.`,
  (n, pr) => `${n} grabs the cannon, plants ${pr.ref}, and fires through a venom-gull swarm without flinching. Pure nerve.`,
  (n, pr) => `While the others panic at Fang's shadow, ${n} keeps the crew calm and on-task. "Eyes on the skis. We're fine."`,
];

// ── SOCIAL: panic / coward ──
const PANIC_TEXT = [
  (n, pr) => `${n} sees Fang's fin break the surface and drops the pump handle entirely. The diver's air stutters while ${pr.sub} backs away from the edge.`,
  (n, pr) => `A venom-gull buzzes ${n} and ${pr.sub} hits the deck, covering ${pr.posAdj} head, leaving the cannon unmanned for a crucial stretch.`,
  (n, pr) => `${n} freezes at the wheel when the wake gets choppy. "I don't — I can't —" The boat drifts off line.`,
];

// ── SOCIAL: bonding / teamwork ──
const BOND_TEXT = [
  (a, b) => `${a} and ${b} work the pump in perfect rhythm, calling the count back and forth. Trust, forged on the dock.`,
  (a, b) => `${a} spots for ${b} on the cannon, calling out the wind while ${b} fires. They read the bay as one.`,
  (a, b) => `When ${a}'s arms give out on the pump, ${b} steps in without a word. They finish the dive together.`,
];

// ── SOCIAL: rivalry ──
const RIVALRY_TEXT = [
  (a, b) => `${a} and ${b} argue over who calls the shots on the cannon, nearly fumbling a reload. The tension is thick enough to chum the water.`,
  (a, b) => `${a} shoves ${b} off the pump handle. "Let a REAL crew do it." ${b} doesn't forget it.`,
];

// ── SOCIAL: showmance distraction (text only; mechanic via romance hooks) ──
const SHOWMANCE_TEXT = [
  (a, b) => `${a} keeps glancing back at ${b} on the dock instead of watching the air gauge. Romantic. Also, the diver's turning blue.`,
  (a, b) => `${a} and ${b} share a look over the gull cannon and forget to fire for a full ten seconds. The mine drifts past.`,
];

// ── ATMOSPHERE / FLAVOR ──
const ATMOSPHERE_FLAVOR = [
  'A foghorn moans somewhere out in the bay. Nobody answers it.',
  'Fang\'s fin cuts a slow circle around the dive platform, then sinks out of sight.',
  'A mutant gull lands on the committee boat, screeches, and steals a sandwich.',
  'The air pumps wheeze and clatter, a dozen hands cranking in the salt spray.',
  'Bubbles boil up from the deep where a brass-helmeted figure walks the seabed.',
  'Two mines bob in the chop, waiting. The water around them is suspiciously still.',
  'A venom-gull screams overhead and the whole dock flinches as one.',
  'Spray comes off the bow in sheets. Somewhere a cannon coughs out another gull.',
  'The depth gauge needle creeps lower. The crew on the pump cranks faster.',
  'Chris narrates from the committee boat, eating popcorn. "Ohhh, this is GOOD."',
  'A floating mine drifts dangerously close to a boat. Everyone holds their breath.',
  'The radar sweep paints two boat blips and three live mines in glowing green.',
];

// ── EXPLORATION / SETUP (per-phase, the team gets into position) ──
const DIVE_SETUP = [
  (n, pr) => `${n} buckles the brass helmet on the diver and double-checks the air line seal. "Don't die down there. We need the points."`,
  (n, pr) => `${n} tests the pump, watches the pressure needle swing, and sets the crew's rhythm. "On my count."`,
  (n, pr) => `${n} scans the murk from the dock, looking for Fang's fin before the diver goes under.`,
  (n, pr) => `${n} coils the air line clean so it won't tangle and waves the diver down into the deep.`,
];

const RACE_SETUP = [
  (n, pr) => `${n} loads the gull cannon, checks the firing pin, and stacks a row of very angry mutant gulls beside the gunner.`,
  (n, pr) => `${n} guns the engine to life, points the bow at the first mine, and grips the wheel. "Hold on."`,
  (n, pr) => `${n} scans the radar for the mine pattern and shouts the course to the driver over the engine roar.`,
  (n, pr) => `${n} ties down the loose gear as the boat rocks in the swell, eyes already on the floating mines.`,
];

// ══════════════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════════════

// Choose the best diver: physical + endurance + boldness
function pickDiver(members) {
  return [...members].sort((a, b) => {
    const sa = pStats(a), sb = pStats(b);
    return (sb.physical + sb.endurance + sb.boldness) - (sa.physical + sa.endurance + sa.boldness);
  })[0];
}
// Driver: physical + boldness. Gunner: intuition + mental.
function pickDriver(members) {
  return [...members].sort((a, b) => {
    const sa = pStats(a), sb = pStats(b);
    return (sb.physical + sb.boldness) - (sa.physical + sa.boldness);
  })[0];
}
function pickGunner(members) {
  return [...members].sort((a, b) => {
    const sa = pStats(a), sb = pStats(b);
    return (sb.intuition + sb.mental) - (sa.intuition + sa.mental);
  })[0];
}

export function simulateBackstabbersAhoy(ep) {
  _usedTexts.clear();

  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return ep;

  const allActive = tribes.flatMap(t => t.members);
  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  allActive.forEach(n => { ep.chalMemberScores[n] = 0; });

  const phaseEvents = { dive: [], race: [] };
  // per-team trackers
  const teamData = {};   // tribeName -> { diveScore, raceScore, total, roles, throws:[], thrown:bool }

  tribes.forEach(tribe => {
    teamData[tribe.name] = {
      diveScore: 0, raceScore: 0, total: 0,
      diver: null, pumpCrew: [], driver: null, gunner: null,
      throws: [], thrownDive: false, thrownRace: false,
      saboteur: null, exposed: false, framed: null,
    };
  });

  // ══ PHASE 1: THE DEEP DIVE ══
  {
    const events = phaseEvents.dive;
    events.push({
      type: 'host', player: host(), phase: 'dive',
      text: pick(HOST_PHASE.dive)(host()),
      badge: 'PHASE 1 · THE DEEP DIVE', badgeClass: 'host'
    });

    tribes.forEach(tribe => {
      const td = teamData[tribe.name];
      const members = tribe.members;
      if (members.length === 0) return;

      const diver = pickDiver(members);
      const pumpCrew = members.filter(m => m !== diver);
      td.diver = diver;
      td.pumpCrew = [...pumpCrew];

      // SETUP card
      const setupGuy = pumpCrew.length ? pick(pumpCrew) : diver;
      events.push({
        type: 'setup', player: setupGuy, tribe: tribe.name, phase: 'dive',
        text: _pickUnique(DIVE_SETUP, setupGuy, pronouns(setupGuy)),
        badge: 'GEARING UP', badgeClass: 'nav'
      });

      // Crew teamwork → air-pump balance. Aim for the "good pump" sweet spot.
      const crewSkill = pumpCrew.length
        ? pumpCrew.reduce((acc, m) => { const s = pStats(m); return acc + (s.social + s.temperament + s.intuition) / 3; }, 0) / pumpCrew.length
        : 5;
      // pumpQuality centered ~0; over = >2, under = <-2, good in between
      const pumpQuality = (crewSkill - 5) * 0.6 + noise(3.0);
      const dStats = pStats(diver);
      const dPr = pronouns(diver);
      let diveBase = 0;
      let pumpedBy = pumpCrew.length ? pick(pumpCrew) : diver;

      if (pumpQuality > 2.2) {
        // OVER-inflate
        diveBase = 4 + dStats.physical * 0.25 + noise(1.5);
        ep.chalMemberScores[pumpedBy] -= 1;
        events.push({
          type: 'over', player: pumpedBy, diver, tribe: tribe.name, phase: 'dive',
          text: pick(DIVE_OVER)(diver, pumpedBy, dPr),
          badge: '⚠ OVER-INFLATED · DIVER LOST CONTROL', badgeClass: 'air'
        });
      } else if (pumpQuality < -2.2) {
        // UNDER-inflate
        diveBase = 3.5 + dStats.endurance * 0.25 + noise(1.5);
        ep.chalMemberScores[pumpedBy] -= 1;
        events.push({
          type: 'under', player: pumpedBy, diver, tribe: tribe.name, phase: 'dive',
          text: pick(DIVE_UNDER)(diver, pumpedBy, dPr),
          badge: '⚠ UNDER-INFLATED · DIVER SURFACED EARLY', badgeClass: 'air'
        });
      } else {
        // GOOD pump
        diveBase = 8 + dStats.physical * 0.3 + dStats.endurance * 0.25 + noise(1.8);
        ep.chalMemberScores[pumpedBy] += 2;
        ep.chalMemberScores[diver] += 3;
        popDelta(diver, 1);
        events.push({
          type: 'good', player: diver, helper: pumpedBy, tribe: tribe.name, phase: 'dive',
          text: pick(DIVE_GOOD)(diver, pumpedBy, dPr),
          badge: '★ CLEAN DIVE · SKIS IN SIGHT', badgeClass: 'good'
        });
      }

      // Fang harassment — boldness + intuition resist
      const fangResist = (dStats.boldness * 0.4 + dStats.intuition * 0.4 + dStats.temperament * 0.2) + noise(2.5);
      if (fangResist > 6) {
        diveBase += 2;
        ep.chalMemberScores[diver] += 2;
        popDelta(diver, 2);
        events.push({
          type: 'fang', player: diver, tribe: tribe.name, phase: 'dive', resisted: true,
          text: pick(FANG_RESIST)(diver, dPr),
          badge: '🦈 FANG ATTACK · RESISTED', badgeClass: 'fang'
        });
      } else if (fangResist < 3.5) {
        diveBase -= 2.5;
        ep.chalMemberScores[diver] -= 1;
        events.push({
          type: 'fang', player: diver, tribe: tribe.name, phase: 'dive', resisted: false,
          text: pick(FANG_HIT)(diver, dPr),
          badge: '🦈 FANG ATTACK · DIVER HIT', badgeClass: 'fang'
        });
      }

      // Clutch ski grab (~30%) when dive was decent
      if (diveBase > 6 && Math.random() < 0.3) {
        diveBase += 1.5;
        ep.chalMemberScores[diver] += 2;
        popDelta(diver, 2);
        events.push({
          type: 'clutch', player: diver, tribe: tribe.name, phase: 'dive',
          text: pick(SKI_CLUTCH)(diver, dPr),
          badge: '★ CLUTCH SKI GRAB', badgeClass: 'good'
        });
      }

      td.diveScore = clamp(diveBase, 0, 15);

      // SOCIAL beat (guaranteed 1, ~55% for a 2nd)
      _diveSocialBeats(ep, tribe, td, events);

      // Showmance moment on the dock
      _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'backstabbers dive', members);

      // Atmosphere (~60%)
      if (Math.random() < 0.6) {
        events.push({ type: 'atmosphere', phase: 'dive', text: pick(ATMOSPHERE_FLAVOR) });
      }
    });
  }

  // ══ PHASE 2: THE GULL RUN ══
  {
    const events = phaseEvents.race;
    events.push({
      type: 'host', player: host(), phase: 'race',
      text: pick(HOST_PHASE.race)(host()),
      badge: 'PHASE 2 · THE GULL RUN', badgeClass: 'host'
    });

    tribes.forEach(tribe => {
      const td = teamData[tribe.name];
      const members = tribe.members;
      if (members.length === 0) return;

      const driver = pickDriver(members);
      const gunner = pickGunner(members.filter(m => m !== driver).length ? members.filter(m => m !== driver) : members);
      td.driver = driver;
      td.gunner = gunner;

      // SETUP
      const setupGuy = pick(members);
      events.push({
        type: 'setup', player: setupGuy, tribe: tribe.name, phase: 'race',
        text: _pickUnique(RACE_SETUP, setupGuy, pronouns(setupGuy)),
        badge: 'CASTING OFF', badgeClass: 'nav'
      });

      const drStats = pStats(driver);
      const drPr = pronouns(driver);
      let raceBase = 0;
      let minesHit = 0;

      // DRIVING
      const driveSkill = (drStats.physical * 0.4 + drStats.boldness * 0.4 + drStats.endurance * 0.2) + noise(2.5);
      if (driveSkill > 6.5) {
        raceBase += 5;
        ep.chalMemberScores[driver] += 3;
        popDelta(driver, 1);
        events.push({
          type: 'drive', player: driver, tribe: tribe.name, phase: 'race', good: true,
          text: pick(DRIVE_GOOD)(driver, drPr),
          badge: '⛵ CLEAN LINE · FULL SPEED', badgeClass: 'good'
        });
      } else {
        raceBase += 2;
        ep.chalMemberScores[driver] -= 1;
        events.push({
          type: 'drive', player: driver, tribe: tribe.name, phase: 'race', good: false,
          text: pick(DRIVE_BAD)(driver, drPr),
          badge: '⚠ INTO THE WEEDS', badgeClass: 'air'
        });
      }

      // GUNNING — up to 3 mine attempts
      const gStats = pStats(gunner);
      const gPr = pronouns(gunner);
      const attempts = 3;
      for (let a = 0; a < attempts; a++) {
        const aim = (gStats.intuition * 0.4 + gStats.mental * 0.4 + gStats.boldness * 0.2) + noise(3.0);
        if (aim > 6) {
          minesHit++;
          raceBase += 2.5;
          ep.chalMemberScores[gunner] += 2;
          if (a === 0) popDelta(gunner, 1);
          events.push({
            type: 'gun', player: gunner, tribe: tribe.name, phase: 'race', hit: true,
            text: pick(GUN_HIT)(gunner, gPr),
            badge: '💥 MINE DETONATED', badgeClass: 'good'
          });
        } else {
          events.push({
            type: 'gun', player: gunner, tribe: tribe.name, phase: 'race', hit: false,
            text: pick(GUN_MISS)(gunner, gPr),
            badge: 'GULL MISSED', badgeClass: 'air'
          });
        }
        // venom-gull knockout interrupt (~22% per attempt, on a random crew member)
        if (Math.random() < 0.22 && members.length > 0) {
          const victim = pick(members);
          raceBase -= 1.5;
          ep.chalMemberScores[victim] -= 1;
          events.push({
            type: 'venom', player: victim, tribe: tribe.name, phase: 'race',
            text: pick(VENOM_GULL)(victim, pronouns(victim)),
            badge: '☠ VENOM-GULL KNOCKOUT', badgeClass: 'air'
          });
        }
      }

      td.minesHit = minesHit;
      td.raceScore = clamp(raceBase, 0, 15);

      // SOCIAL beats
      _raceSocialBeats(ep, tribe, td, events);

      // Showmance moment on the boat
      _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'backstabbers race', members);

      // Atmosphere (~60%)
      if (Math.random() < 0.6) {
        events.push({ type: 'atmosphere', phase: 'race', text: pick(ATMOSPHERE_FLAVOR) });
      }
    });
  }

  // ══ THE BACKSTAB / THROW ══
  // A schemer on a team can deliberately throw. Heavy penalty — enough to flip.
  // Then an EXPOSURE check: a high-intuition teammate catches them, or gets framed.
  _resolveBackstabs(ep, tribes, teamData, phaseEvents);

  // ══ Romance spark hooks across the whole cast ══
  for (let i = 0; i < allActive.length; i++)
    for (let j = i + 1; j < allActive.length; j++)
      _challengeRomanceSpark(allActive[i], allActive[j], ep, null, null, ep.chalMemberScores || {}, 'backstabbers ahoy');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'backstabbers ahoy', allActive);

  // ══ COMPUTE TOTALS + WINNER ══
  tribes.forEach(t => {
    const td = teamData[t.name];
    td.total = clamp(td.diveScore + td.raceScore, 0, 30);
  });

  const standings = tribes.map(t => {
    const td = teamData[t.name];
    return {
      name: t.name, diveScore: +td.diveScore.toFixed(1), raceScore: +td.raceScore.toFixed(1),
      total: +td.total.toFixed(1), minesHit: td.minesHit || 0,
      thrown: td.thrownDive || td.thrownRace, throwPenalty: td.throwPenalty || 0,
      saboteur: td.saboteur, exposed: td.exposed, framed: td.framed,
    };
  });

  // Higher total wins
  standings.sort((a, b) => (b.total - a.total) || (b.raceScore - a.raceScore) || (Math.random() - 0.5));

  const winnerTribeName = standings[0].name;
  const loserTribeName = standings[standings.length - 1].name;
  const tribesSorted = standings.map(s => s.name);

  const winnerTribe = gs.tribes.find(t => t.name === winnerTribeName);
  const loserTribe = gs.tribes.find(t => t.name === loserTribeName);

  // Did a throw flip the result? (loser would have won without the penalty)
  let flipNote = false;
  const loserStanding = standings.find(s => s.name === loserTribeName);
  if (loserStanding && loserStanding.thrown && loserStanding.throwPenalty > 0) {
    const wouldBe = loserStanding.total + loserStanding.throwPenalty;
    if (wouldBe > standings[0].total) flipNote = true;
  }

  // ══ FINALIZE ══
  ep.backstabbersAhoy = {
    phaseEvents,
    standings,
    tribesSorted,
    winner: winnerTribeName,
    loser: loserTribeName,
    flipped: flipNote,
    teams: tribes.map(t => {
      const td = teamData[t.name];
      return {
        name: t.name,
        members: [...t.members],
        diver: td.diver, pumpCrew: [...td.pumpCrew],
        driver: td.driver, gunner: td.gunner,
        saboteur: td.saboteur,
        diveScore: +td.diveScore.toFixed(1),
        raceScore: +td.raceScore.toFixed(1),
        total: +td.total.toFixed(1),
        minesHit: td.minesHit || 0,
        isWinner: t.name === winnerTribeName,
      };
    }),
    hostIntro: pick(HOST_INTRO)(host()),
    hostDive: pick(HOST_PHASE.dive)(host()),
    hostRace: pick(HOST_PHASE.race)(host()),
    hostWinner: pick(HOST_WINNER)(host(), winnerTribeName),
    hostLoser: pick(HOST_LOSER)(host(), loserTribeName),
  };

  ep.isBackstabbersAhoy = true;
  ep.challengeType = 'backstabbers-ahoy';
  ep.challengeLabel = 'Backstabbers Ahoy!';
  ep.challengeCategory = 'physical';

  // PRE-MERGE finalize: tribe wins, NOT individual. DO NOT set ep.immunityWinner.
  ep.winner = winnerTribe;
  ep.loser = loserTribe;
  ep.safeTribes = tribesSorted.length > 2
    ? tribesSorted.slice(1, -1).map(tn => gs.tribes.find(t => t.name === tn)).filter(Boolean)
    : [];
  ep.tribalPlayers = loserTribe ? [...loserTribe.members] : [];

  ep.challengePlacements = tribesSorted.map(tn => ({
    name: tn, members: [...(gs.tribes.find(t => t.name === tn)?.members || [])],
    memberScores: Object.fromEntries((gs.tribes.find(t => t.name === tn)?.members || []).map(m => [m, ep.chalMemberScores[m] || 0])),
  }));

  ep.chalPlacements = Object.entries(ep.chalMemberScores)
    .sort(([, a], [, b]) => b - a).map(([n]) => n);

  // Massive bonus to winning tribe's top scorer so chal tab ranks correctly
  const topScorer = winnerTribe?.members.slice().sort((a, b) =>
    (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0))[0];
  if (topScorer) {
    const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores)
      .filter(([n]) => n !== topScorer).map(([, s]) => s));
    ep.chalMemberScores[topScorer] = Math.max(ep.chalMemberScores[topScorer] || 0, maxOther) + allActive.length + 5;
  }

  updateChalRecord(ep);
  return ep;
}

// ── DIVE social beats ──
function _diveSocialBeats(ep, tribe, td, events) {
  for (let sb = 0; sb < 2; sb++) {
    if (sb === 1 && Math.random() > 0.55) break;
    const members = tribe.members;
    if (members.length === 0) break;
    const roll = Math.random();
    const a = pick(members);
    const aS = pStats(a);
    if (roll < 0.30 && (aS.boldness >= 6 || arch(a) === 'hero' || arch(a) === 'challenge-beast')) {
      ep.chalMemberScores[a] += 2;
      popDelta(a, 1);
      events.push({
        type: 'brave', player: a, tribe: tribe.name, phase: 'dive',
        text: _pickUnique(BRAVE_TEXT, a, pronouns(a)),
        badge: 'STEADY HANDS', badgeClass: 'good'
      });
    } else if (roll < 0.52 && (aS.boldness <= 4 || aS.temperament <= 4)) {
      ep.chalMemberScores[a] -= 1;
      popDelta(a, -2);
      events.push({
        type: 'panic', player: a, tribe: tribe.name, phase: 'dive',
        text: _pickUnique(PANIC_TEXT, a, pronouns(a)),
        badge: 'PANIC', badgeClass: 'air'
      });
    } else if (members.length >= 2) {
      const b = members.filter(m => m !== a)[Math.floor(Math.random() * (members.length - 1))];
      if (b) {
        if (getBond(a, b) < -1 || Math.random() < 0.2) {
          addBond(a, b, -0.6);
          events.push({
            type: 'rivalry', players: [a, b], tribe: tribe.name, phase: 'dive',
            text: _pickUnique(RIVALRY_TEXT, a, b),
            badge: 'FRICTION', badgeClass: 'air'
          });
        } else {
          addBond(a, b, 0.6);
          events.push({
            type: 'bond', players: [a, b], tribe: tribe.name, phase: 'dive',
            text: _pickUnique(BOND_TEXT, a, b),
            badge: 'TRUST', badgeClass: 'good'
          });
        }
      }
    }
  }
}

// ── RACE social beats ──
function _raceSocialBeats(ep, tribe, td, events) {
  for (let sb = 0; sb < 2; sb++) {
    if (sb === 1 && Math.random() > 0.55) break;
    const members = tribe.members;
    if (members.length === 0) break;
    const roll = Math.random();
    const a = pick(members);
    const aS = pStats(a);
    if (roll < 0.30 && (aS.boldness >= 6 || arch(a) === 'hero' || arch(a) === 'challenge-beast')) {
      ep.chalMemberScores[a] += 2;
      popDelta(a, 1);
      events.push({
        type: 'brave', player: a, tribe: tribe.name, phase: 'race',
        text: _pickUnique(BRAVE_TEXT, a, pronouns(a)),
        badge: 'NERVES OF STEEL', badgeClass: 'good'
      });
    } else if (roll < 0.52 && (aS.boldness <= 4 || aS.temperament <= 4)) {
      ep.chalMemberScores[a] -= 1;
      popDelta(a, -2);
      events.push({
        type: 'panic', player: a, tribe: tribe.name, phase: 'race',
        text: _pickUnique(PANIC_TEXT, a, pronouns(a)),
        badge: 'PANIC', badgeClass: 'air'
      });
    } else if (members.length >= 2) {
      const b = members.filter(m => m !== a)[Math.floor(Math.random() * (members.length - 1))];
      if (b) {
        addBond(a, b, 0.6);
        events.push({
          type: 'bond', players: [a, b], tribe: tribe.name, phase: 'race',
          text: _pickUnique(BOND_TEXT, a, b),
          badge: 'TRUST', badgeClass: 'good'
        });
      }
    }
  }
}

// ── THE BACKSTAB / THROW + EXPOSURE ──
function _resolveBackstabs(ep, tribes, teamData, phaseEvents) {
  tribes.forEach(tribe => {
    const td = teamData[tribe.name];
    const members = tribe.members;
    if (members.length < 2) return;

    // Find an eligible schemer
    const schemers = members.filter(m => canSabotage(m));
    if (schemers.length === 0) return;
    // Schemer most likely to throw: lowest loyalty, highest strategic
    const saboteur = [...schemers].sort((a, b) => {
      const sa = pStats(a), sb = pStats(b);
      return (sb.strategic - sb.loyalty) - (sa.strategic - sa.loyalty);
    })[0];
    const sStats = pStats(saboteur);

    // Throw chance scales with strategic + low loyalty (~30-45% for a strong schemer)
    const throwChance = 0.18 + sStats.strategic * 0.025 + (6 - Math.min(6, sStats.loyalty)) * 0.02;
    if (Math.random() > throwChance) return;

    td.saboteur = saboteur;
    const sPr = pronouns(saboteur);
    // Pick a teammate to friendly-fire / undermine (lowest bond, not the schemer)
    const others = members.filter(m => m !== saboteur);
    const victim = others.sort((a, b) => getBond(saboteur, a) - getBond(saboteur, b))[0];

    // Throw in whichever phase the schemer had a role; default race
    const inRace = (td.gunner === saboteur || td.driver === saboteur) || Math.random() < 0.6;
    const penalty = 4 + sStats.strategic * 0.3 + Math.random() * 2; // heavy, can flip
    td.throwPenalty = (td.throwPenalty || 0) + penalty;

    if (inRace) {
      td.raceScore = clamp(td.raceScore - penalty, 0, 15);
      td.thrownRace = true;
      phaseEvents.race.push({
        type: 'backstab', player: saboteur, victim, tribe: tribe.name, phase: 'race',
        text: pick(BACKSTAB_RACE)(saboteur, victim, sPr),
        penalty: +penalty.toFixed(1),
        badge: `⚠ THREW THE CHALLENGE · −${penalty.toFixed(1)} PTS`, badgeClass: 'stab'
      });
    } else {
      td.diveScore = clamp(td.diveScore - penalty, 0, 15);
      td.thrownDive = true;
      phaseEvents.dive.push({
        type: 'backstab', player: saboteur, victim, tribe: tribe.name, phase: 'dive',
        text: pick(BACKSTAB_DIVE)(saboteur, victim, sPr),
        penalty: +penalty.toFixed(1),
        badge: `⚠ THREW THE CHALLENGE · −${penalty.toFixed(1)} PTS`, badgeClass: 'stab'
      });
    }
    ep.chalMemberScores[saboteur] -= 2;

    // ══ EXPOSURE CHECK ══
    // A high-intuition surviving teammate may try to expose the saboteur.
    const exposers = others.filter(m => m !== victim || others.length === 1);
    const bestExposer = [...others].sort((a, b) => {
      const sa = pStats(a), sb = pStats(b);
      return (sb.intuition + sb.mental * 0.5) - (sa.intuition + sa.mental * 0.5);
    })[0];
    const exPhase = inRace ? phaseEvents.race : phaseEvents.dive;
    const exPhaseKey = inRace ? 'race' : 'dive';
    if (bestExposer) {
      const eStats = pStats(bestExposer);
      const expChance = 0.35 + eStats.intuition * 0.04;
      if (Math.random() < expChance) {
        const ePr = pronouns(bestExposer);
        // Read success: exposer's intuition+mental vs schemer's strategic+social
        const readScore = (eStats.intuition * 0.5 + eStats.mental * 0.4) + noise(2.5);
        const hideScore = (sStats.strategic * 0.5 + sStats.social * 0.4) + noise(2.5);
        const expiresEp = (gs.episodeHistory?.length || 0) + 2;
        gs._backstabbersHeat = gs._backstabbersHeat || {};

        if (readScore >= hideScore) {
          // EXPOSED — schemer takes heat + targeting
          td.exposed = true;
          gs._backstabbersHeat[saboteur] = { amount: 2, expiresEp };
          ep.chalMemberScores[saboteur] -= 1;
          popDelta(saboteur, -3);
          popDelta(bestExposer, 2);
          addBond(bestExposer, saboteur, -2);
          exPhase.push({
            type: 'expose', exposer: bestExposer, player: saboteur, tribe: tribe.name, phase: exPhaseKey, success: true,
            text: pick(EXPOSE_SUCCESS)(bestExposer, saboteur, ePr),
            badge: `⚖ SCHEMER EXPOSED · HEAT +2 ON ${saboteur.toUpperCase()}`, badgeClass: 'stab'
          });
          ep.campEvents[tribe.name].post.push({
            type: 'ba-exposed',
            text: `${bestExposer} caught ${saboteur} deliberately throwing the Backstabbers Ahoy challenge. The crew is out for blood — ${saboteur} is squarely in the crosshairs.`,
            players: [bestExposer, saboteur], badgeText: 'BACKSTAB EXPOSED', badgeClass: 'badge-negative'
          });
        } else {
          // BACKFIRE — exposer gets framed
          td.framed = bestExposer;
          gs._backstabbersHeat[bestExposer] = { amount: 2, expiresEp };
          ep.chalMemberScores[bestExposer] -= 2;
          popDelta(bestExposer, -3);
          popDelta(saboteur, 1);
          addBond(saboteur, bestExposer, -1.5);
          exPhase.push({
            type: 'expose', exposer: bestExposer, player: saboteur, tribe: tribe.name, phase: exPhaseKey, success: false,
            text: pick(EXPOSE_BACKFIRE)(bestExposer, saboteur, ePr),
            badge: `⚖ FRAME STUCK · HEAT +2 ON ${bestExposer.toUpperCase()}`, badgeClass: 'stab'
          });
          ep.campEvents[tribe.name].post.push({
            type: 'ba-framed',
            text: `${bestExposer} tried to expose ${saboteur} for throwing the challenge — but ${saboteur} flipped it, and now the crew blames ${bestExposer} for the loss.`,
            players: [bestExposer, saboteur], badgeText: 'FRAMED', badgeClass: 'badge-negative'
          });
        }
      } else {
        // Throw goes unnoticed — just a camp whisper
        gs._backstabbersHeat = gs._backstabbersHeat || {};
        gs._backstabbersHeat[saboteur] = { amount: 1, expiresEp: (gs.episodeHistory?.length || 0) + 2 };
        ep.campEvents[tribe.name].post.push({
          type: 'ba-throw',
          text: `Something felt off about ${saboteur}'s performance in the challenge. ${tribe.name} lost, and a few crewmates are starting to wonder why.`,
          players: [saboteur], badgeText: 'SUSPICION', badgeClass: 'badge-negative'
        });
      }
    }
  });
}

// ══════════════════════════════════════════════════════════════════════
// VP BUILDERS — nautical retro
// ══════════════════════════════════════════════════════════════════════

const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`ba-step-${suffix}-${i}`);
    if (el) el.classList.add('ba-visible');
  }
  const counter = document.getElementById(`ba-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`ba-controls-${suffix}`);
    if (controls) { const btns = controls.querySelectorAll('.ba-btn'); btns.forEach(b => b.style.opacity = '0.4'); }
  }
}

function _baUpdateSidebar(screenKey) {
  const sideEl = document.getElementById('ba-sidebar-inner');
  if (!sideEl) return;
  const epRecord = window._baEpRecord || gs.episodeHistory?.[window.vpEpNum - 1];
  if (!epRecord?.backstabbersAhoy) return;
  sideEl.innerHTML = _buildSidebarContent(epRecord, screenKey);
}

export function baRevealNext(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    if (st.idx >= st.total - 1) return;
    st.idx++;
    const suffix = screenKey.replace('ba-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
    const el = document.getElementById(`ba-step-${suffix}-${st.idx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (e) { console.warn('BA reveal error:', e); }
  try { _baUpdateSidebar(screenKey); } catch (e) { /* sidebar optional */ }
}

export function baRevealAll(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    st.idx = st.total - 1;
    const suffix = screenKey.replace('ba-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
  } catch (e) { console.warn('BA revealAll error:', e); }
  try { _baUpdateSidebar(screenKey); } catch (e) { /* sidebar optional */ }
}

// ── AVATARS ──
function _av(name, cls = '') {
  const initial = (name || '?').charAt(0).toUpperCase();
  return `<span class="ba-iav${cls ? ' ' + cls : ''}"><img src="assets/avatars/${slug(name)}.png" alt="${name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><b>${initial}</b></span>`;
}

function _badgeClass(cls) {
  return cls === 'good' ? 'ba-b-good' : cls === 'air' ? 'ba-b-air' : cls === 'fang' ? 'ba-b-fang' :
    cls === 'stab' ? 'ba-b-stab' : cls === 'host' ? 'ba-b-host' : cls === 'nav' ? 'ba-b-air' : 'ba-b-good';
}

// ── SIDEBAR CONTENT (live DIVE BOARD / RACE BOARD) ──
function _buildSidebarContent(ep, screenKey) {
  const ba = ep.backstabbersAhoy;
  if (!ba) return '';
  const revIdx = _tvState[screenKey]?.idx ?? -1;

  // Determine which phase board to show, and whether scores are revealed yet
  const isRaceScreen = screenKey === 'ba-race';
  const isResultsScreen = screenKey === 'ba-results';
  const phaseKey = isRaceScreen ? 'race' : 'dive';
  const boardTitle = isRaceScreen ? '⚓ RACE BOARD ⚓' : '⚓ DIVE BOARD ⚓';

  // progressive snapshot for scores
  const metaKey = phaseKey === 'race' ? '_baRaceMeta' : '_baDiveMeta';
  const meta = window[metaKey];
  const snap = (meta && revIdx >= 0 && meta[revIdx]) ? meta[revIdx] : null;

  let html = `<div class="ba-track"><h3>${boardTitle}</h3>`;

  ba.teams.forEach(team => {
    const tc = tribeColor(team.name);
    let score = 0, showScore = false;
    if (isResultsScreen) { score = team.total; showScore = true; }
    else if (snap && snap[team.name] != null) { score = snap[team.name]; showScore = revIdx >= 0; }
    else if (revIdx < 0 || screenKey === 'ba-title') { showScore = false; }

    const scoreTxt = showScore ? (isResultsScreen ? team.total.toFixed(1) : score.toFixed(1)) : '—';
    const maxScore = isResultsScreen ? 30 : 15;
    const pct = showScore ? Math.round(clamp(score / maxScore * 100, 0, 100)) : 0;

    html += `<div class="ba-team-head" style="color:${tc};border-bottom-color:${tc}55;"><span>${team.name.toUpperCase()}</span><span class="ba-score">${scoreTxt}</span></div>`;

    if (isRaceScreen) {
      const drvFlag = team.saboteur === team.driver ? ' ⚠' : '';
      const gunFlag = team.saboteur === team.gunner ? ' ⚠' : '';
      if (team.driver) html += `<div class="ba-role">${_av(team.driver, 'sm')}<span>${team.driver}</span><span class="tag">DRIVER${drvFlag}</span></div>`;
      if (team.gunner) html += `<div class="ba-role">${_av(team.gunner, 'sm')}<span>${team.gunner}</span><span class="tag">GUNNER${gunFlag}</span></div>`;
    } else {
      if (team.diver) html += `<div class="ba-role">${_av(team.diver, 'sm')}<span>${team.diver}</span><span class="tag">DIVER</span></div>`;
      team.pumpCrew.slice(0, 4).forEach(m => {
        const flag = team.saboteur === m ? ' ⚠' : '';
        html += `<div class="ba-role">${_av(m, 'sm')}<span>${m}</span><span class="tag">PUMP${flag}</span></div>`;
      });
    }
    html += `<div class="ba-bar" style="--bc:${tc}"><i style="width:${pct}%;background:${tc}"></i></div>`;
  });
  html += `</div>`;
  return html;
}

function _buildSidebar(ep, screenKey) {
  return `<div class="ba-side"><div id="ba-sidebar-inner">${_buildSidebarContent(ep, screenKey)}</div></div>`;
}

// ── progressive meta: accumulating score per team across reveal indices ──
function _buildPhaseMeta(ba, phaseKey, events) {
  // mirror the scoring deltas the engine applied, accumulating per team
  const score = {};
  ba.teams.forEach(t => { score[t.name] = 0; });
  const meta = [];
  // approximate per-event contribution: use sign of badge to nudge a running total
  // We instead snap to final per-phase score progressively: distribute final score across that team's scoring events.
  const finalScore = {};
  ba.teams.forEach(t => { finalScore[t.name] = phaseKey === 'race' ? t.raceScore : t.diveScore; });
  const teamEventCount = {};
  ba.teams.forEach(t => { teamEventCount[t.name] = events.filter(e => e.tribe === t.name && e.type !== 'atmosphere').length || 1; });
  const teamSeen = {};
  ba.teams.forEach(t => { teamSeen[t.name] = 0; });

  events.forEach(e => {
    if (e.tribe && e.type !== 'atmosphere') {
      teamSeen[e.tribe] = (teamSeen[e.tribe] || 0) + 1;
      score[e.tribe] = +(finalScore[e.tribe] * (teamSeen[e.tribe] / teamEventCount[e.tribe])).toFixed(1);
    }
    meta.push({ ...score });
  });
  return meta;
}

// ── CONTROLS ──
function _buildControls(screenKey, total) {
  const suffix = screenKey.replace('ba-', '');
  return `<div class="ba-ctrl" id="ba-controls-${suffix}">
    <span class="ba-counter" id="ba-counter-${suffix}">0 / ${total}</span>
    <button class="ba-btn primary" onclick="baRevealNext('${screenKey}',${total})">NEXT ▶</button>
    <button class="ba-btn" onclick="baRevealAll('${screenKey}',${total})">REVEAL ALL</button>
  </div>`;
}

// ── EVENT CARD ──
function _card(event, idx, screenKey) {
  const suffix = screenKey.replace('ba-', '');
  const tc = event.tribe ? (tribeColor(event.tribe) || '#5fe39a') : '#5fe39a';
  const teamCls = event.tribe ? `<span class="ba-team" style="color:${tc};border-color:${tc}55;background:${tc}1a;">${(event.tribe || '').toUpperCase()}</span>` : '';
  const badge = event.badge ? `<span class="ba-badge ${_badgeClass(event.badgeClass)}">${event.badge}</span>` : '';

  // Atmosphere interstitial
  if (event.type === 'atmosphere') {
    return `<div class="ba-atmos" id="ba-step-${suffix}-${idx}">${event.text}</div>`;
  }

  // Host phase-intro card
  if (event.type === 'host') {
    return `<div class="ba-card ba-host" id="ba-step-${suffix}-${idx}">
      <div class="who">${_av(event.player, 'big')}<div class="ba-name">${event.player}</div>${badge}</div>
      <div class="body">${event.text}</div>
    </div>`;
  }

  // BACKSTAB hero card
  if (event.type === 'backstab') {
    return `<div class="ba-stab" id="ba-step-${suffix}-${idx}">
      <div class="cap-who">${_av(event.player, 'big')}</div>
      <div class="knife">BACKSTAB</div>
      <div class="body">${event.text}</div>
      ${badge}
    </div>`;
  }

  // EXPOSURE card
  if (event.type === 'expose') {
    return `<div class="ba-expose" id="ba-step-${suffix}-${idx}">
      <div class="tag">◤ SUSPICION ◢</div>
      <div style="display:flex;justify-content:center;gap:8px;margin:6px 0">${_av(event.exposer, 'big')}${_av(event.player, 'big')}</div>
      <h3>${event.success ? `${event.exposer} reads the angles` : `${event.exposer} points the finger`}</h3>
      <div class="body">${event.text}</div>
      ${badge}
    </div>`;
  }

  // standard card
  const who = event.player
    ? `${_av(event.player, 'big')}<div class="ba-name">${event.player}</div>${teamCls}`
    : event.players
      ? `${_av(event.players[0], 'big')}<div class="ba-name">${event.players.join(' & ')}</div>${teamCls}`
      : `<div class="ba-name">${event.tribe || ''}</div>`;
  return `<div class="ba-card" id="ba-step-${suffix}-${idx}">
    <div class="who">${who}</div>
    <div class="body">${event.text}</div>
    ${badge}
  </div>`;
}

// ── AMBIENT BACKGROUND ──
function _buildAmbient(phase) {
  let bubbles = '';
  for (let i = 0; i < 24; i++) {
    const left = ((i * 41 + 7) % 100);
    const dur = 8 + (i % 10);
    const delay = -((i * 0.7) % dur);
    const sz = 3 + (i % 5);
    bubbles += `<div class="ba-bub" style="left:${left}%;width:${sz}px;height:${sz}px;animation-duration:${dur}s;animation-delay:${delay}s"></div>`;
  }
  return `<div class="ba-amb">
    <div class="ba-caustic"></div>
    <div class="ba-fang">🦈</div>
    ${bubbles}
  </div>`;
}

function _buildHud(phase) {
  const label = phase === 'race' ? 'NAVAL RADAR — LIVE' : phase === 'dive' ? 'DIVE FEED — LIVE' : 'CHANNEL — LIVE';
  const mid = phase === 'race' ? 'RADAR ACTIVE · 3 MINES' : phase === 'dive' ? 'SONAR ACTIVE · DEPTH 14m' : 'STANDING BY';
  return `<div class="ba-hud">
    <span><span class="dot"></span>${label}</span>
    <span>${mid}</span>
    <span>⚓ WAWANAKWA BAY</span>
  </div>`;
}

// ── PHASE 1 instrument panel ──
function _diveInstrument() {
  return `<div class="ba-instr">
    <div class="ba-sonar"><div class="ba-sweep"></div></div>
    <div class="ba-gauges">
      <div class="ba-gauge">
        <div class="lbl">DEPTH</div>
        <div class="ba-dial"><span class="ba-needle depth"></span><span class="center"></span></div>
      </div>
      <div class="ba-gauge">
        <div class="lbl">AIR PRESSURE</div>
        <div class="ba-dial"><span class="ba-needle"></span><span class="center"></span></div>
        <div class="ba-airwarn over">⚠ WATCH THE PRESSURE</div>
      </div>
    </div>
  </div>`;
}

// ── PHASE 2 naval radar ──
function _raceRadar(ba) {
  // blips per team + mine markers
  let blips = '';
  ba.teams.forEach((t, i) => {
    const tc = tribeColor(t.name);
    const left = 36 + i * 10;
    const top = 62 + i * 8;
    blips += `<span class="ba-blip" style="left:${left}%;top:${top}%;color:${tc}"><span class="pip" style="background:${tc}"></span>${t.name.slice(0, 3).toUpperCase()}</span>`;
  });
  let mines = '';
  const minePos = [[30, 30], [62, 24], [80, 55]];
  // hit count = max minesHit across teams (cosmetic)
  const totalHit = Math.max(0, ...ba.teams.map(t => t.minesHit || 0));
  minePos.forEach(([l, tp], i) => {
    const hitCls = i < totalHit ? ' hit' : '';
    mines += `<span class="ba-mine${hitCls}" style="left:${l}%;top:${tp}%">✕</span>`;
  });
  let scoreboard = ba.teams.map(t => {
    const tc = tribeColor(t.name);
    return `<div class="ba-sb" style="color:${tc}"><div class="n">${t.name.slice(0, 8).toUpperCase()} · MINES</div><div class="v" style="color:${tc}">${t.minesHit || 0}</div></div>`;
  }).join('');
  return `<div class="ba-radar">
    <div class="rlbl">◣ NAVAL RADAR — RACE COURSE</div>
    <div class="ba-radarface">
      ${mines}
      <span class="ba-gullarc" style="left:40%;top:60%;transform:rotate(-32deg)"></span>
      ${blips}
    </div>
    <div class="ba-scoreboard">${scoreboard}</div>
  </div>`;
}

// ── SHELL ──
function _baShell(content, ep, screenKey, phase) {
  const sidebar = _buildSidebar(ep, screenKey);
  window._baEpRecord = ep;
  return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Pirata+One&family=Special+Elite&family=VT323&family=Inter:wght@400;600;800&display=swap');
.ba-wrap{--ba-deep:#04141a;--ba-sea:#072830;--ba-teal:#0e6c6c;--ba-teal-lt:#1aa7a7;--ba-brass:#caa45a;--ba-brass-lt:#e7c98a;--ba-brass-dk:#7a6336;--ba-bone:#eaf2ee;--ba-mute:#8aa0a0;--ba-rust:#c45a3a;--ba-radar:#5fe39a;--ba-mine:#e23b3b;--ba-gull:#dfe6ee;}
.ba-wrap *{box-sizing:border-box}
.ba-wrap{max-width:1100px;margin:0 auto;position:relative;min-height:100vh;overflow:hidden;padding:0 0 96px;color:var(--ba-bone);font-family:'Inter',system-ui,sans-serif;
  background:radial-gradient(ellipse at 50% 0%, #0a3038 0%, var(--ba-sea) 40%, var(--ba-deep) 100%)}
.ba-wrap.race{background:radial-gradient(ellipse at 50% 30%, #06281f 0%, #04161c 55%, #02100c 100%)}

.ba-amb{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.ba-caustic{position:absolute;inset:-20%;opacity:.10;mix-blend-mode:screen;
  background:radial-gradient(circle at 30% 20%, #2fd0d0, transparent 40%),radial-gradient(circle at 70% 60%, #1aa7a7, transparent 45%);animation:ba-caustic 22s ease-in-out infinite}
@keyframes ba-caustic{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(3%,2%) scale(1.06)}}
.ba-bub{position:absolute;bottom:-12px;border-radius:50%;background:radial-gradient(circle at 35% 30%, rgba(255,255,255,.5), rgba(120,200,200,.18));box-shadow:0 0 6px rgba(120,220,220,.25);opacity:0;animation:ba-bub linear infinite}
@keyframes ba-bub{0%{transform:translateY(0) translateX(0);opacity:0}10%{opacity:.7}90%{opacity:.4}100%{transform:translateY(-106vh) translateX(16px);opacity:0}}
.ba-fang{position:absolute;top:30%;left:-120px;font-size:40px;opacity:.16;filter:blur(.5px);animation:ba-fang 34s linear infinite}
@keyframes ba-fang{0%{left:-120px;top:30%}50%{left:106%;top:46%}50.01%{left:-120px;top:64%}100%{left:106%;top:38%}}

.ba-hud{position:sticky;top:0;z-index:40;display:flex;align-items:center;justify-content:space-between;padding:9px 16px;font-family:'VT323',monospace;font-size:19px;letter-spacing:1px;
  background:linear-gradient(180deg,rgba(4,20,26,.96),rgba(4,20,26,.35));border-bottom:1px solid var(--ba-brass-dk);color:var(--ba-brass-lt)}
.ba-hud .dot{width:10px;height:10px;border-radius:50%;background:var(--ba-rust);box-shadow:0 0 8px var(--ba-rust);display:inline-block;margin-right:6px;animation:ba-bk 1.4s steps(2) infinite}
@keyframes ba-bk{50%{opacity:.2}}

.ba-title{text-align:center;padding:34px 16px 12px;position:relative;z-index:2}
.ba-title .kick{font-family:'VT323',monospace;color:var(--ba-rust);letter-spacing:5px;font-size:17px}
.ba-title h1{font-family:'Pirata One',cursive;font-size:clamp(46px,9vw,90px);margin:4px 0;color:var(--ba-brass-lt);text-shadow:0 2px 0 #2a1c0a,0 0 24px rgba(202,164,90,.35);letter-spacing:1px}
.ba-title .sub{font-family:'Special Elite',serif;color:var(--ba-mute);font-size:14px}
.ba-title .host{font-family:'Special Elite',serif;color:var(--ba-brass-lt);margin-top:12px;font-size:14px;border:1px dashed var(--ba-brass-dk);display:inline-block;padding:8px 16px;border-radius:4px;max-width:680px}
.ba-lineup{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:16px auto 0;max-width:760px}
.ba-lineup-lbl{font-family:'VT323',monospace;color:var(--ba-mute);letter-spacing:3px;font-size:14px;margin-top:12px}

.ba-iav{width:34px;height:34px;border-radius:50%;overflow:hidden;flex-shrink:0;position:relative;background:#0c2a30;border:2px solid var(--ba-brass-dk);display:inline-flex;align-items:center;justify-content:center;vertical-align:middle}
.ba-iav img{width:100%;height:100%;object-fit:cover}
.ba-iav b{display:none;font-family:'Special Elite',serif;color:var(--ba-brass-lt);font-size:14px}
.ba-iav.sm{width:24px;height:24px;border-width:1px}.ba-iav.sm b{font-size:11px}
.ba-iav.big{width:46px;height:46px}

.ba-phase-hdr{position:relative;z-index:2;text-align:center;margin:26px 16px 14px;padding:14px;border-radius:12px;border:1px solid var(--ba-brass-dk);background:linear-gradient(180deg,rgba(12,42,48,.7),rgba(7,40,48,.5))}
.ba-phase-hdr .pn{font-family:'VT323',monospace;color:var(--ba-rust);letter-spacing:3px;font-size:16px}
.ba-phase-hdr h2{font-family:'Pirata One',cursive;font-size:30px;margin:4px 0 2px;color:var(--ba-brass-lt)}
.ba-phase-hdr .pd{font-family:'Special Elite',serif;color:var(--ba-mute);font-size:13px}

.ba-body{display:grid;grid-template-columns:1fr 280px;gap:18px;padding:0 18px;position:relative;z-index:2}
@media(max-width:820px){.ba-body{grid-template-columns:1fr}}

.ba-instr{background:radial-gradient(ellipse at 50% 40%, #0c3a44, #062028);border:6px solid var(--ba-brass);border-radius:18px;padding:16px;margin-bottom:16px;position:relative;box-shadow:inset 0 0 40px rgba(0,0,0,.6),0 6px 20px rgba(0,0,0,.5)}
.ba-instr::before{content:'';position:absolute;inset:0;border-radius:12px;border:2px solid rgba(231,201,138,.25);pointer-events:none;margin:4px}
.ba-gauges{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
.ba-gauge{width:150px;text-align:center}
.ba-gauge .lbl{font-family:'VT323',monospace;color:var(--ba-brass-lt);letter-spacing:2px;font-size:14px;margin-bottom:4px}
.ba-dial{width:120px;height:120px;margin:0 auto;border-radius:50%;background:radial-gradient(circle,#0a2a30,#04161c);border:4px solid var(--ba-brass-dk);position:relative;box-shadow:inset 0 0 16px #000}
.ba-needle{position:absolute;left:50%;bottom:50%;width:3px;height:48px;background:var(--ba-rust);transform-origin:bottom center;border-radius:2px;box-shadow:0 0 6px var(--ba-rust);transform:rotate(38deg);animation:ba-needle 3.5s ease-in-out infinite}
@keyframes ba-needle{0%,100%{transform:rotate(20deg)}50%{transform:rotate(64deg)}}
.ba-needle.depth{background:var(--ba-teal-lt);box-shadow:0 0 6px var(--ba-teal-lt);animation:ba-needle2 5s ease-in-out infinite}
@keyframes ba-needle2{0%,100%{transform:rotate(-50deg)}50%{transform:rotate(30deg)}}
.ba-dial .center{position:absolute;left:50%;top:50%;width:10px;height:10px;border-radius:50%;background:var(--ba-brass);transform:translate(-50%,-50%);box-shadow:0 0 4px #000}
.ba-airwarn{font-family:'VT323',monospace;font-size:12px;margin-top:4px;color:var(--ba-rust)}
.ba-sonar{position:absolute;top:10px;right:12px;width:54px;height:54px;border-radius:50%;border:1px solid var(--ba-teal);overflow:hidden;opacity:.8}
.ba-sweep{position:absolute;inset:0;background:conic-gradient(from 0deg, rgba(95,227,154,.45), transparent 40%);animation:ba-sweep 2.6s linear infinite}
@keyframes ba-sweep{to{transform:rotate(360deg)}}

.ba-radar{background:radial-gradient(circle at 50% 50%, #06241c, #03120e);border:4px solid var(--ba-brass-dk);border-radius:14px;padding:12px;margin-bottom:16px;position:relative;overflow:hidden}
.ba-radar .rlbl{font-family:'VT323',monospace;color:var(--ba-radar);letter-spacing:2px;font-size:15px;margin-bottom:4px}
.ba-radarface{position:relative;height:200px;border-radius:10px;background:repeating-radial-gradient(circle at 50% 100%, rgba(95,227,154,.08) 0 1px, transparent 1px 34px);overflow:hidden}
.ba-radarface::after{content:'';position:absolute;left:50%;bottom:0;width:240%;height:240%;transform:translateX(-50%);background:conic-gradient(from 200deg, rgba(95,227,154,.22), transparent 30%);animation:ba-rsweep 4s linear infinite}
@keyframes ba-rsweep{to{transform:translateX(-50%) rotate(360deg)}}
.ba-blip{position:absolute;font-family:'VT323',monospace;font-size:13px;font-weight:700;transform:translate(-50%,-50%)}
.ba-blip .pip{display:block;width:12px;height:12px;border-radius:50%;margin:0 auto 2px;box-shadow:0 0 8px currentColor}
.ba-mine{position:absolute;color:var(--ba-mine);font-size:18px;transform:translate(-50%,-50%);text-shadow:0 0 8px var(--ba-mine)}
.ba-mine.hit{opacity:.3;text-decoration:line-through}
.ba-gullarc{position:absolute;width:60px;height:2px;background:linear-gradient(90deg,var(--ba-gull),transparent);transform-origin:left;opacity:.5}
.ba-scoreboard{display:flex;justify-content:space-around;margin-top:8px;font-family:'VT323',monospace;flex-wrap:wrap;gap:8px}
.ba-sb{text-align:center}.ba-sb .n{font-size:13px;letter-spacing:1px}.ba-sb .v{font-size:26px}

.ba-feed{display:flex;flex-direction:column;gap:13px}
.ba-card{position:relative;background:linear-gradient(180deg,rgba(8,32,38,.92),rgba(5,22,28,.92));border:1px solid #16414a;border-radius:12px;padding:13px 15px;box-shadow:0 8px 22px rgba(0,0,0,.45);opacity:0;transform:translateY(16px)}
.ba-card.ba-visible{animation:ba-card-in .5s cubic-bezier(.16,1,.3,1) forwards}
@keyframes ba-card-in{to{opacity:1;transform:translateY(0)}}
.ba-card .who{display:flex;align-items:center;gap:10px;margin-bottom:7px}
.ba-name{font-family:'Special Elite',serif;font-size:15px}
.ba-team{font-family:'VT323',monospace;font-size:13px;letter-spacing:1px;margin-left:auto;padding:2px 8px;border-radius:4px;border:1px solid}
.ba-card .body{font-size:14px;line-height:1.6;color:#cfe0e0;font-family:'Special Elite',serif}
.ba-card .body strong{color:var(--ba-brass-lt)}
.ba-badge{display:inline-block;font-family:'VT323',monospace;font-size:13px;letter-spacing:1px;padding:2px 8px;border-radius:4px;margin-top:7px}
.ba-b-good{color:var(--ba-radar);background:rgba(95,227,154,.12);border:1px solid rgba(95,227,154,.35)}
.ba-b-air{color:var(--ba-brass-lt);background:rgba(202,164,90,.12);border:1px solid var(--ba-brass-dk)}
.ba-b-fang{color:var(--ba-teal-lt);background:rgba(26,167,167,.12);border:1px solid rgba(26,167,167,.4)}
.ba-b-stab{color:var(--ba-mine);background:rgba(226,59,59,.12);border:1px solid rgba(226,59,59,.4)}
.ba-b-host{color:var(--ba-rust);background:rgba(196,90,58,.12);border:1px solid rgba(196,90,58,.4);letter-spacing:2px}
.ba-host{border-left:3px solid var(--ba-rust)}

.ba-atmos{position:relative;text-align:center;font-family:'Special Elite',serif;font-style:italic;color:var(--ba-mute);font-size:13px;letter-spacing:.5px;padding:11px 18px;margin:2px 0;opacity:0;transform:translateY(12px);border-top:1px dashed rgba(138,160,160,.22);border-bottom:1px dashed rgba(138,160,160,.22)}
.ba-atmos::before{content:'◦ ';color:var(--ba-rust)}.ba-atmos::after{content:' ◦';color:var(--ba-rust)}
.ba-atmos.ba-visible{animation:ba-card-in .5s ease forwards}

.ba-stab{position:relative;border:2px solid var(--ba-mine);background:#1a0808;border-radius:12px;padding:18px 16px;overflow:hidden;text-align:center;opacity:0;transform:translateY(16px)}
.ba-stab.ba-visible{animation:ba-card-in .5s cubic-bezier(.16,1,.3,1) forwards, ba-shake .5s ease-in-out}
@keyframes ba-shake{0%,100%{margin-left:0}20%{margin-left:-5px}40%{margin-left:5px}60%{margin-left:-3px}80%{margin-left:3px}}
.ba-stab .knife{font-family:'Pirata One',cursive;font-size:38px;color:var(--ba-mine);letter-spacing:2px;text-shadow:0 0 12px rgba(226,59,59,.5)}
.ba-stab .cap-who{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px}
.ba-stab .body{font-family:'Special Elite',serif;color:#e7cfcf;font-size:14px;margin-top:6px}
.ba-stab .body strong{color:#ffd9d9}
.ba-stab .ba-badge{margin-top:10px}

.ba-expose{border:2px dashed var(--ba-brass);background:rgba(20,42,48,.7);border-radius:12px;padding:16px;text-align:center;opacity:0;transform:translateY(16px)}
.ba-expose.ba-visible{animation:ba-card-in .5s cubic-bezier(.16,1,.3,1) forwards}
.ba-expose .tag{font-family:'VT323',monospace;color:var(--ba-brass-lt);letter-spacing:3px}
.ba-expose h3{font-family:'Pirata One',cursive;font-size:24px;margin:6px 0;color:var(--ba-bone)}
.ba-expose .body{font-family:'Special Elite',serif;color:var(--ba-mute);font-size:13px}

.ba-side{align-self:start;position:sticky;top:50px}
.ba-track{background:rgba(8,32,38,.9);border:1px solid #16414a;border-radius:12px;padding:12px;margin-bottom:13px}
.ba-track h3{font-family:'VT323',monospace;font-size:15px;letter-spacing:2px;color:var(--ba-mute);margin:0 0 8px;text-align:center}
.ba-team-head{display:flex;align-items:center;justify-content:space-between;font-family:'Special Elite',serif;font-size:13px;margin:9px 0 5px;padding-bottom:4px;border-bottom:1px solid #16414a}
.ba-score{font-family:'VT323',monospace;font-size:18px}
.ba-role{display:flex;align-items:center;gap:8px;padding:3px 2px;font-family:'Special Elite',serif;font-size:12px}
.ba-role .tag{margin-left:auto;font-family:'VT323',monospace;font-size:11px;color:var(--ba-brass-lt)}
.ba-bar{height:8px;border-radius:4px;background:#0c2a30;overflow:hidden;margin:6px 0 2px}
.ba-bar i{display:block;height:100%}

.ba-reveal{margin:16px 18px;padding:18px;border:2px solid var(--ba-radar);border-radius:12px;text-align:center;background:linear-gradient(180deg,rgba(95,227,154,.08),transparent);position:relative;z-index:2;opacity:0;transform:translateY(16px)}
.ba-reveal.ba-visible{animation:ba-card-in .5s cubic-bezier(.16,1,.3,1) forwards}
.ba-reveal .tag{font-family:'VT323',monospace;color:var(--ba-radar);letter-spacing:3px}
.ba-reveal h2{font-family:'Pirata One',cursive;font-size:30px;margin:6px 0;color:var(--ba-radar)}
.ba-reveal .body{font-family:'Special Elite',serif;color:#cfe0e0;font-size:14px;max-width:560px;margin:0 auto}
.ba-result-avatars{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:10px}

.ba-ctrl{position:fixed;bottom:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:center;gap:14px;padding:12px;background:linear-gradient(0deg,rgba(4,20,26,.98),rgba(4,20,26,.4))}
.ba-btn{font-family:'VT323',monospace;font-size:18px;letter-spacing:1px;padding:8px 22px;border-radius:6px;cursor:pointer;background:#0c2a30;color:var(--ba-bone);border:1px solid var(--ba-brass-dk)}
.ba-btn.primary{background:var(--ba-rust);color:#fff;border-color:var(--ba-rust)}
.ba-counter{font-family:'VT323',monospace;color:var(--ba-mute);font-size:18px}

@media(prefers-reduced-motion:reduce){
  .ba-caustic,.ba-bub,.ba-fang,.ba-sweep,.ba-needle,.ba-radarface::after,.ba-hud .dot{animation:none!important}
  .ba-bub{display:none}
  .ba-card,.ba-stab,.ba-expose,.ba-reveal,.ba-atmos{opacity:1;transform:none}
  .ba-card.ba-visible,.ba-stab.ba-visible,.ba-expose.ba-visible,.ba-reveal.ba-visible{animation:none}
}
</style>
<div class="ba-wrap${phase === 'race' ? ' race' : ''}">
  ${_buildAmbient(phase)}
  ${_buildHud(phase)}
  ${content}
</div>`;
}

// ══════════════════════════════════════════════════════════════════════
// VP SCREENS
// ══════════════════════════════════════════════════════════════════════

export function rpBuildBATitleCard(ep) {
  const ba = ep.backstabbersAhoy;
  if (!ba) return '';
  let content = `<div class="ba-title">
    <div class="kick">⚓ TWO-PART AQUATIC CHALLENGE ⚓</div>
    <h1>Backstabbers Ahoy!</h1>
    <div class="sub">Dive for the skis, then race the gulls — and watch your own crew</div>
    <div class="host">${ba.hostIntro}</div>
    <div class="ba-lineup-lbl">— TODAY'S CREW —</div>
    <div class="ba-lineup">`;
  ba.teams.forEach(t => t.members.forEach(m => { content += _av(m); }));
  content += `</div></div>`;
  content += `<div class="ba-body"><div>${_diveInstrument()}</div>${_buildSidebar(ep, 'ba-title')}</div>`;
  return _baShell(content, ep, 'ba-title', 'dive');
}

function _buildPhaseScreen(ep, phaseKey, phaseName, pn, sub, hostLine, instrument, screenKey) {
  const ba = ep.backstabbersAhoy;
  if (!ba) return '';
  const events = ba.phaseEvents[phaseKey] || [];
  const total = events.length;
  _ensureState(screenKey, total);

  // progressive meta for the sidebar
  const metaKey = phaseKey === 'race' ? '_baRaceMeta' : '_baDiveMeta';
  window[metaKey] = _buildPhaseMeta(ba, phaseKey, events);

  let feed = '';
  events.forEach((evt, idx) => { feed += _card(evt, idx, screenKey); });

  let content = `<div class="ba-phase-hdr"><div class="pn">${pn}</div><h2>${phaseName}</h2><div class="pd">${sub}</div></div>`;
  content += `<div class="ba-body"><div>`;
  content += instrument;
  content += `<div class="ba-feed">${feed}</div>`;
  content += `</div>${_buildSidebar(ep, screenKey)}</div>`;
  content += _buildControls(screenKey, total);
  return _baShell(content, ep, screenKey, phaseKey);
}

export function rpBuildBADive(ep) {
  const ba = ep.backstabbersAhoy;
  if (!ba) return '';
  return _buildPhaseScreen(ep, 'dive', 'The Deep Dive', 'PHASE 1',
    'One diver per team in a brass suit · the crew works the air pump · Fang is hungry',
    ba.hostDive, _diveInstrument(), 'ba-dive');
}

export function rpBuildBARace(ep) {
  const ba = ep.backstabbersAhoy;
  if (!ba) return '';
  return _buildPhaseScreen(ep, 'race', 'The Gull Run', 'PHASE 2',
    'Race the boats · shoot mutant gulls at the mines · blow the last one to win',
    ba.hostRace, _raceRadar(ba), 'ba-race');
}

export function rpBuildBAResults(ep) {
  const ba = ep.backstabbersAhoy;
  if (!ba) return '';
  const screenKey = 'ba-results';
  const steps = [];

  // 1) winner card
  const winnerTeam = ba.teams.find(t => t.name === ba.winner);
  const winStanding = ba.standings.find(s => s.name === ba.winner);
  const loseStanding = ba.standings.find(s => s.name === ba.loser);
  let flipLine = '';
  if (ba.flipped && loseStanding) {
    flipLine = `<br><br><span style="color:var(--ba-mine)">${ba.loser} had the lead — until ${loseStanding.saboteur || 'a traitor'} threw it into the weeds. The backstab flipped the result.</span>`;
  }
  steps.push(`<div class="ba-reveal" id="ba-step-results-0">
    <div class="tag">⚓ CHALLENGE RESULT ⚓</div>
    <h2>${ba.winner} win</h2>
    <div class="body">${ba.hostWinner}<br><br><strong style="color:var(--ba-radar)">${ba.winner} ${winStanding ? winStanding.total.toFixed(1) : ''}</strong>${loseStanding ? ` to ${ba.loser} <strong>${loseStanding.total.toFixed(1)}</strong>` : ''}.${flipLine}</div>
    <div class="ba-result-avatars">${(winnerTeam?.members || []).map(m => _av(m, 'big')).join('')}</div>
  </div>`);

  // 2) loser → tribal
  const loserTeam = ba.teams.find(t => t.name === ba.loser);
  steps.push(`<div class="ba-reveal" id="ba-step-results-1" style="border-color:rgba(226,59,59,.5)">
    <div class="tag" style="color:var(--ba-mine)">⚓ TRIBAL COUNCIL ⚓</div>
    <h2 style="color:var(--ba-mine)">${ba.loser}</h2>
    <div class="body">${ba.hostLoser}</div>
    <div class="ba-result-avatars">${(loserTeam?.members || []).map(m => _av(m, 'big')).join('')}</div>
  </div>`);

  // 3) final tally
  let standRows = ba.standings.map((s, i) => {
    const tc = tribeColor(s.name);
    const place = i === 0 ? '1ST' : i === ba.standings.length - 1 ? 'LAST' : `${i + 1}TH`;
    const stabTag = s.thrown ? ` · <span style="color:var(--ba-mine)">THROWN −${s.throwPenalty.toFixed(1)}</span>` : '';
    return `<div style="display:flex;justify-content:space-between;font-family:'Special Elite',serif;font-size:14px;padding:6px 0;border-bottom:1px solid #16414a"><span style="color:${tc}">${place} · ${s.name}</span><span style="font-family:'VT323',monospace;color:var(--ba-mute)">dive ${s.diveScore.toFixed(1)} · race ${s.raceScore.toFixed(1)} · total ${s.total.toFixed(1)}${stabTag}</span></div>`;
  }).join('');
  steps.push(`<div class="ba-reveal" id="ba-step-results-2" style="border-style:solid;border-color:#16414a;text-align:left">
    <div class="tag" style="text-align:center;display:block;color:var(--ba-brass-lt)">⚓ FINAL TALLY ⚓</div>
    <div style="margin-top:10px">${standRows}</div>
  </div>`);

  const total = steps.length;
  _ensureState(screenKey, total);

  let content = `<div class="ba-phase-hdr"><div class="pn">RESULTS</div><h2>The Reckoning</h2><div class="pd">TALLIED // JUDGED // SENT TO TRIBAL</div></div>`;
  content += `<div class="ba-body"><div>${steps.join('')}</div>${_buildSidebar(ep, screenKey)}</div>`;
  content += _buildControls(screenKey, total);
  return _baShell(content, ep, screenKey, 'race');
}
