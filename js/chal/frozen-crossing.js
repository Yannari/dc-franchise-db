// js/chal/frozen-crossing.js — Frozen Crossing: pre-merge tribe challenge (ice floe gauntlet + sled pickup race)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord, romanticCompat } from '../players.js';
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
function portrait(name, size = 42) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:4px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }

const NICE_ARCHS = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN_ARCHS = new Set(['villain', 'mastermind', 'schemer']);

// ══════════════════════════════════════════════════════════════
// NARRATION TEXT POOLS
// ══════════════════════════════════════════════════════════════
const CLEAN_HOP = [
  (n, pr) => `${n} lands clean on the next floe. Steady as ice.`,
  (n, pr) => `${n} leaps across without hesitation. ${pr.Sub} makes it look easy.`,
  (n, pr) => `Perfect landing from ${n}. The floe barely rocks.`,
  (n, pr) => `${n} plants ${pr.posAdj} feet on the ice and keeps moving. No time to celebrate.`,
  (n, pr) => `${n} vaults to the next floe with athletic precision. The cold hasn't slowed ${pr.obj} down yet.`,
  (n, pr) => `${n} gauges the distance, jumps, and sticks the landing. Textbook.`,
];

const WATER_FALL = [
  (n, pr) => `${n}'s foot slips on the frost and ${pr.sub} plunges into the freezing water. The gasp echoes across the river.`,
  (n, pr) => `The floe tilts under ${n}'s weight and ${pr.sub} goes in. The cold hits like a wall.`,
  (n, pr) => `${n} misjudges the gap. Splash. The water is so cold it stops ${pr.posAdj} breathing for a second.`,
  (n, pr) => `${n} lands on the edge of the floe but can't hold on. Into the water ${pr.sub} goes.`,
  (n, pr) => `A rogue current shifts the floe just as ${n} jumps. ${pr.Sub} hits water instead of ice.`,
];

const BEAR_DODGE = [
  (n, pr) => `A polar bear lunges from behind an ice shelf! ${n} dives sideways and barely avoids the swipe.`,
  (n, pr) => `${n} spots the polar bear charging and rolls under its swing. Pure instinct.`,
  (n, pr) => `The polar bear roars at ${n} but ${pr.sub} stands ${pr.posAdj} ground. It backs off. Barely.`,
  (n, pr) => `${n} sees the bear's shadow on the ice and sidesteps before it can connect. Close call.`,
];

const BEAR_HIT = [
  (n, pr) => `The polar bear slams into ${n} and sends ${pr.obj} tumbling into the water. The cold and the impact hit at the same time.`,
  (n, pr) => `${n} never sees it coming. The bear's paw catches ${pr.obj} across the back and ${pr.sub} crashes through the ice.`,
  (n, pr) => `A massive polar bear blindsides ${n}. ${pr.Sub} goes airborne and lands in the freezing river.`,
  (n, pr) => `The polar bear charges and ${n} tries to dodge, but the ice is too slick. Down ${pr.sub} goes.`,
];

const RESCUE_TEXT = [
  (r, f, rPr) => `${r} reaches into the water and hauls ${f} back onto the ice. "I got you." ${f} nods, teeth chattering.`,
  (r, f, rPr) => `${r} drops to ${rPr.posAdj} knees and pulls ${f} out of the freezing water. No hesitation.`,
  (r, f, rPr) => `Without thinking, ${r} grabs ${f}'s arm and drags ${f} back onto solid ice. "Don't thank me. Move."`,
  (r, f, rPr) => `${r} sees ${f} struggling in the water and extends a hand. ${f} grabs it. They lock eyes. Then they keep going.`,
];

const COLLISION_TEXT = [
  (w, l) => `${w} and ${l} reach the same floe at the same time. Shoulder to shoulder. ${w} stays planted. ${l} doesn't.`,
  (w, l) => `The floe isn't big enough for both of them. ${w} has the better footing. ${l} gets bumped off.`,
  (w, l) => `${w} and ${l} collide mid-crossing. ${w} absorbs the impact. ${l} slips into the water.`,
  (w, l) => `Two players, one floe. ${w} braces. ${l} loses balance and tips backward into the river.`,
];

const PICKUP_TEXT = [
  (puller, rider) => `${puller} slides the sled up to the checkpoint. ${rider} jumps on. "Let's go!"`,
  (puller, rider) => `${rider} is shivering at the checkpoint. ${puller} pulls up and ${rider} scrambles aboard.`,
  (puller, rider) => `The sled grinds to a halt at ${rider}'s checkpoint. ${rider} grabs the rail and hops on.`,
  (puller, rider) => `${puller} barely slows down. ${rider} has to sprint and leap onto the moving sled.`,
];

const ENCOURAGE_TEXT = [
  (a, b) => `${a} leans forward on the sled. "You got this! Faster!" ${b} grits ${pronouns(b).posAdj} teeth and pulls harder.`,
  (a, b) => `"We're almost there!" ${a} yells from the back of the sled. The encouragement helps more than either of them expected.`,
  (a, b) => `${a} starts a chant. The sled picks up speed. Something about the rhythm keeps ${b} going.`,
  (a, b) => `${a} puts a hand on ${b}'s shoulder. "I believe in you." ${b} digs in and finds another gear.`,
];

const WHIPPING_TEXT = [
  (a, b) => `${a} leans in close to ${b}. "FASTER. I'm not losing because of you." The sled speeds up. The mood doesn't.`,
  (a, b) => `${a} starts barking orders at ${b}. Harsh ones. ${b} pulls faster, but the look on ${pronouns(b).posAdj} face says this isn't over.`,
  (a, b) => `"What are you DOING? PULL!" ${a} screams at ${b}. It works. ${b} picks up the pace. But the damage is done.`,
  (a, b) => `${a} makes it clear that failure is not an option. ${b} speeds up, but won't forget this.`,
];

const BRIDGE_COLLAPSE_TEXT = [
  t => `The ice bridge cracks beneath the sled. ${t}'s sled drops into the gap and the whole team braces for impact.`,
  t => `A thunderous crack echoes across the tundra. The bridge ahead of ${t}'s sled is gone.`,
  t => `${t}'s sled hits the bridge at full speed just as it starts to buckle. Everything goes sideways.`,
  t => `The bridge crumbles. ${t}'s sled hangs on the edge. Time freezes.`,
];

const HERO_SAVE_TEXT = [
  (puller, pr) => `${puller} grabs the sled rope with both hands and hauls the entire team back from the edge. Superhuman effort.`,
  (puller, pr) => `${puller} digs ${pr.posAdj} heels into the ice and pulls. Every muscle screams. The sled holds. The team survives.`,
  (puller, pr) => `${puller} refuses to let go. The ice cuts ${pr.posAdj} hands. ${pr.Sub} doesn't care. The sled comes back up.`,
  (puller, pr) => `${puller} channels everything left and drags the sled to safety. The team stares in disbelief.`,
];

const FINAL_SPRINT_TEXT = [
  t => `${t}'s entire team leans forward. The sled rockets toward the finish line.`,
  t => `Everyone on ${t}'s sled pushes off in unison. The coordination is perfect. They fly.`,
  t => `${t} gives everything in the final stretch. The sled is moving faster than it should be.`,
  t => `The finish line is in sight. ${t}'s sled burns through the last hundred meters.`,
];

const STUCK_TEXT = [
  (n, pr) => `${n} is frozen in place. ${pr.Sub} can't move. The ice has ${pr.obj}.`,
  (n, pr) => `${n} stands perfectly still, arms wrapped tight. ${pr.Sub}'s not going anywhere.`,
  (n, pr) => `${n}'s legs won't respond. The cold has seeped too deep. ${pr.Sub}'s stuck.`,
  (n, pr) => `${n} tries to take a step and can't. The ice has claimed ${pr.obj}.`,
];

const CROSSED_TEXT = [
  (n, pr) => `${n} plants both feet on solid ground. ${pr.Sub}'s across!`,
  (n, pr) => `${n} leaps off the final floe and hits dry land. Done.`,
  (n, pr) => `${n} clears the last ice floe and collapses on the far bank. Made it.`,
  (n, pr) => `${n} stumbles off the final floe — shaking, freezing, but finished.`,
];

const PULLER_TEXT = [
  (n, tribe, pr) => `${n} is the first player from ${tribe} to cross! ${pr.Sub} takes the sled reins for Phase 2.`,
  (n, tribe, pr) => `"${n} is your sled puller!" ${host()} shouts. First across for ${tribe}.`,
  (n, tribe, pr) => `${n} crosses first for ${tribe}. The sled is ${pr.pos}. Now ${pr.sub} has to go back for the rest.`,
  (n, tribe, pr) => `First across the river for ${tribe}: ${n}. ${pr.Sub}'ll be driving the sled.`,
];

const PULLER_REACT_POS = [
  (n, pr) => `${n} grins. "I'll get everyone across. Count on it."`,
  (n, pr) => `${n} cracks ${pr.posAdj} knuckles. "Let's do this."`,
  (n, pr) => `${n} pumps ${pr.posAdj} fist. "I was born for this."`,
  (n, pr) => `"Fastest across, fastest back." ${n} is already planning the route.`,
];
const PULLER_REACT_NEG = [
  (n, pr) => `${n} stares at the sled. "I have to pull ALL of them?"`,
  (n, pr) => `"Great. I'm the mule." ${n} looks at ${pr.posAdj} exhausted teammates.`,
  (n, pr) => `${n}'s smile fades when ${pr.sub} sees the sled. "That's... a lot of weight."`,
  (n, pr) => `"Why did I have to be first?" ${n} mutters, grabbing the sled rope.`,
];
const SLED_REACT_GOOD = [
  (tribe) => `${tribe} examines their sled. Polished runners, reinforced frame. This thing is built to win.`,
  (tribe) => `"Now THAT'S a sled." ${tribe}'s eyes light up.`,
  (tribe) => `${tribe}'s sled gleams in the arctic light. Competition-grade. Fastest on the ice.`,
  (tribe) => `${tribe} runs a hand along the sled's smooth runners. Top tier equipment.`,
];
const SLED_REACT_MID = [
  (tribe) => `${tribe} looks at their wooden sled. Solid, functional, nothing fancy. It'll do.`,
  (tribe) => `"Could be worse." ${tribe} tests the weight. Standard issue.`,
  (tribe) => `${tribe}'s sled is sturdy but unexceptional. No advantage, no disadvantage.`,
  (tribe) => `The wooden sled creaks slightly. ${tribe} shrugs. "It'll hold."`,
];
const SLED_REACT_BAD = [
  (tribe) => `${tribe}'s sled is... glowing? That can't be good.`,
  (tribe) => `"Is that sled... radioactive?" Someone on ${tribe} takes a step back.`,
  (tribe) => `${tribe}'s sled hums with an unsettling green light. The penalty for finishing last.`,
  (tribe) => `"We got the worst sled." ${tribe} stares at the eerie green glow. "Fantastic."`,
];

const BRIDGETTE_RULE_TEXT = [
  (t, names) => `${t} crosses the finish line... but they're short a teammate. ${names.join(' and ')} never made it.`,
  (t, names) => `${t}'s sled arrives at the end. Empty seats where ${names.join(' and ')} should be. Automatic last place.`,
  (t, names) => `"Where's ${names.join(' and ')}?" ${host()} looks at ${t}'s sled. "That's an automatic loss."`,
  (t, names) => `${t} left ${names.join(' and ')} behind. The penalty is swift: automatic last place.`,
];

const FROZEN_TEXT = [
  (n, pr) => `${n} can't move anymore. ${pr.Sub}'s completely frozen. The medics rush in with blankets.`,
  (n, pr) => `${n} collapses on the ice. ${pr.posAdj} body temperature has dropped too far. ${pr.Sub}'s done.`,
  (n, pr) => `The cold wins. ${n} goes rigid on the floe. Medics haul ${pr.obj} to the warming tent.`,
  (n, pr) => `${n}'s lips are blue. ${pr.posAdj} fingers are white. ${pr.Sub} can't continue. DNF.`,
];

const ROMANCE_TRAP_TEXT = [
  (a, b) => `${a} locks eyes with ${b} from across the ice. They drift toward each other like magnets. The race can wait.`,
  (a, b) => `${a} notices ${b} shivering at the checkpoint and pulls ${b} close. "For warmth." Neither of them moves.`,
  (a, b) => `The cold brings ${a} and ${b} together. Literally. They huddle for heat and forget there's a race happening.`,
  (a, b) => `${a} and ${b} find each other at the checkpoint. The embrace lasts too long. Their tribe watches in horror.`,
];

const APPROACH_TEXT = [
  (puller, tn, cp) => `${tn}'s sled cuts through the snow toward checkpoint ${cp}. ${puller} leans into the harness.`,
  (puller, tn, cp) => `${puller} drives hard toward checkpoint ${cp}. The runners hiss across the ice.`,
  (puller, tn, cp) => `The path to checkpoint ${cp} stretches ahead. ${puller} grits ${pronouns(puller).posAdj} teeth and pulls.`,
  (puller, tn, cp) => `${tn}'s sled rounds a bend. Checkpoint ${cp} barely visible through the blowing snow.`,
  (puller, tn, cp) => `${puller} pushes through the headwind. Checkpoint ${cp} for ${tn} is getting closer.`,
  (puller, tn, cp) => `The snow thickens as ${tn}'s sled grinds toward checkpoint ${cp}. ${puller} doesn't slow down.`,
];

const TERRAIN_UPHILL_TEXT = [
  (puller, tn) => `The trail climbs sharply. ${puller} digs in, muscles screaming. ${tn}'s sled barely inches forward.`,
  (puller, tn) => `${tn} hits a steep incline. ${puller} drops low and hauls with everything left.`,
  (puller, tn) => `Uphill. ${puller}'s legs burn. The passengers on ${tn}'s sled lean forward, trying to help.`,
  (puller, tn) => `The gradient gets brutal. ${puller} gasps for air as ${tn}'s sled crawls up the slope.`,
];
const TERRAIN_DOWNHILL_TEXT = [
  (puller, tn) => `The trail drops and ${tn}'s sled picks up speed. Everyone holds on tight.`,
  (puller, tn) => `Downhill! ${tn}'s sled rockets forward. ${puller} can barely steer.`,
  (puller, tn) => `Gravity takes over. ${tn}'s sled flies down the slope — half terror, half thrill.`,
  (puller, tn) => `${tn} hits a decline and the sled goes airborne for a heartbeat. They land hard but keep moving.`,
];
const TERRAIN_ICE_TEXT = [
  (puller, tn) => `${tn}'s sled hits a patch of pure ice. The runners lock up and the sled slides sideways.`,
  (puller, tn) => `Black ice. ${puller} loses traction and ${tn}'s sled spins a full 180 before stopping.`,
  (puller, tn) => `The ground turns to glass beneath ${tn}'s sled. ${puller} scrambles for grip.`,
  (puller, tn) => `${tn}'s sled hits ice and drifts wide. ${puller} fights to correct course.`,
];
const TERRAIN_DRIFT_TEXT = [
  (puller, tn) => `A massive snowdrift blocks the path. ${puller} has to power straight through it.`,
  (puller, tn) => `${tn} slams into a wall of packed snow. The sled buries itself to the runners.`,
  (puller, tn) => `Snow piles up ahead. ${puller} plows into it and the sled shudders to near-stop.`,
  (puller, tn) => `${tn}'s sled hits deep powder. Everyone scrambles to push through the drift.`,
];

const OVERTAKE_TEXT = [
  (faster, slower) => `${faster}'s sled shoots past ${slower}! The lead changes hands!`,
  (faster, slower) => `${faster} pulls ahead of ${slower}. The gap is growing.`,
  (faster, slower) => `Side by side — then ${faster} edges forward. ${slower} falls behind.`,
  (faster, slower) => `${faster}'s sled blazes past a struggling ${slower}. "Later!" someone shouts.`,
  (faster, slower) => `${slower} watches ${faster}'s sled pull away. The race just shifted.`,
];

const TRASH_TALK_TEXT = [
  (a, tA, b, tB) => `${a} shouts at ${tB}'s sled: "See you at the finish line — oh wait, you won't make it!"`,
  (a, tA, b, tB) => `"Nice sled!" ${a} yells sarcastically as ${tA} passes ${tB}. ${b} glares back.`,
  (a, tA, b, tB) => `${a} from ${tA} locks eyes with ${b} on ${tB}'s sled. "You're going home tonight."`,
  (a, tA, b, tB) => `"Keep up!" ${a} taunts ${b}. ${b} won't forget that.`,
  (a, tA, b, tB) => `${b} catches ${a} smirking from ${tA}'s sled. No words needed. The grudge is set.`,
];

const NEAR_COLLISION_TEXT = [
  (tA, tB) => `${tA}'s sled nearly clips ${tB}'s! Both swerve at the last second.`,
  (tA, tB) => `The paths converge and ${tA} and ${tB} almost collide. Chaos for a heartbeat.`,
  (tA, tB) => `${tA}'s sled drifts into ${tB}'s lane. Both teams scream. They miss by inches.`,
  (tA, tB) => `A near-miss between ${tA} and ${tB}. The sleds scrape past each other.`,
];

const COLD_PENALTY_TEXT = [
  (puller) => `${puller}'s hands are going numb. The cold from Phase 1 is catching up. The sled slows.`,
  (puller) => `Frostbite is setting in on ${puller}'s fingers. ${pronouns(puller).Sub} can barely grip the harness.`,
  (puller) => `${puller} stumbles. The accumulated cold is taking its toll. Every step is agony.`,
  (puller) => `The Phase 1 cold hits ${puller} like a wall. ${pronouns(puller).posAdj} pace drops noticeably.`,
  (puller) => `${puller}'s breath comes in ragged gasps. The river crossing left more damage than anyone realized.`,
];

const SLED_STRESS_TEXT = [
  (tn, count) => `The sled groans under ${count} passengers. A runner cracks. It still moves, but barely.`,
  (tn, count) => `${tn}'s sled creaks ominously. ${count} bodies is a lot of weight on ice.`,
  (tn, count) => `Something snaps on ${tn}'s sled. A crossbeam splinters. They keep going but it won't last.`,
  (tn, count) => `The weight of ${count} passengers pushes the runners deep into the snow. Friction builds.`,
];

const PULLER_FATIGUE_TEXT = [
  (puller) => `${puller} stumbles and nearly drops. The weight is crushing. But ${pronouns(puller).sub} gets back up.`,
  (puller) => `${puller}'s legs give out for a second. ${pronouns(puller).Sub} grabs the harness and forces ${pronouns(puller).ref} upright.`,
  (puller) => `Exhaustion hits ${puller} mid-stride. ${pronouns(puller).Sub} wobbles, recovers, keeps pulling. Barely.`,
  (puller) => `${puller} dry-heaves from the effort but doesn't stop. ${pronouns(puller).posAdj} teammates watch nervously.`,
];

const TEAM_MOMENT_TEXT = [
  (a, b) => `${a} catches ${b}'s eye on the sled. A small nod. They're in this together.`,
  (a, b) => `${a} grabs ${b}'s hand as the sled lurches. Neither lets go immediately.`,
  (a, b) => `${a} and ${b} share a look that says everything. No words needed.`,
  (a, b) => `"We've got this," ${a} whispers to ${b}. ${b} believes it.`,
  (a, b) => `${a} shifts to block the wind for ${b}. A small gesture. ${b} notices.`,
];

const FROSTBITE_TEXT = [
  (n) => `${n}'s fingers are turning white. The cold is creeping in. ${pronouns(n).Sub} tucks ${pronouns(n).posAdj} hands under ${pronouns(n).posAdj} arms but the damage is done.`,
  (n) => `${n} shivers violently on the sled. The Phase 1 cold never really left ${pronouns(n).posAdj} body.`,
  (n) => `${n}'s teeth are chattering so hard ${pronouns(n).sub} can barely speak. The chill deepens.`,
  (n) => `A wave of cold hits ${n} out of nowhere. ${pronouns(n).posAdj} lips go blue. The warmth from earlier is gone.`,
];

const WEATHER_TEXT = [
  (tn) => `A blizzard gust slams into ${tn}'s sled. Visibility drops to nothing.`,
  (tn) => `The temperature plummets. Everyone on ${tn}'s sled feels it in their bones.`,
  (tn) => `Wind howls across the tundra. ${tn}'s sled fights through a wall of snow.`,
  (tn) => `Ice crystals tear at exposed skin on ${tn}'s sled. The arctic is fighting back.`,
  (tn) => `A gust of polar wind cuts through ${tn}. The temperature hasn't been this low all day.`,
];

const HOST_FLAVOR = [
  () => `${host()} watches from a heated observation tower. "I love this job."`,
  () => `${host()} sips hot cocoa on the riverbank. "They signed the waiver."`,
  () => `"The water temperature is... well, let's just say the medical team is on standby." ${host()} grins.`,
  () => `${host()} adjusts his parka. "I'm cold just watching this. And I'm wearing three jackets."`,
  () => `"Fun fact: that river hasn't been above freezing since... ever." ${host()} checks his notes.`,
  () => `${host()} winces as another player hits the water. "That's gonna leave a mark. Emotionally."`,
  () => `"Remember, the safe zone is the OTHER side of the river. Not the bottom of it." ${host()} is helpful.`,
  () => `${host()} turns to camera. "If you're wondering whether we tested this challenge... no. No we did not."`,
  () => `"Those polar bears are technically wildlife consultants. They're on the payroll." ${host()} nods seriously.`,
  () => `${host()} peers through binoculars. "I can see hypothermia from here. Beautiful."`,
];

const SLED_NAMES = {
  competition: 'Competition Sled',
  wood: 'Wooden Sled',
  radioactive: 'Radioactive Sled'
};

const SLED_DESC = {
  competition: 'Aerodynamic. Fast. First place earned this.',
  wood: 'Solid construction. Nothing special. Gets the job done.',
  radioactive: 'It glows. It wobbles. It might fall apart. Last place has consequences.'
};

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════

export function simulateFrozenCrossing(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return ep;

  const allActive = tribes.flatMap(t => t.members);
  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  allActive.forEach(n => { ep.chalMemberScores[n] = 0; });

  const tribeOf = {};
  tribes.forEach(t => t.members.forEach(m => { tribeOf[m] = t.name; }));

  // ══ PHASE 1: ICE FLOE GAUNTLET ══
  const FLOES_PER_PLAYER = 4;
  const phase1 = [];
  const coldMeter = {};  // per-player cold: starts at 8
  const floeProgress = {}; // per-player: current floe index
  const frozenPlayers = new Set(); // players who hit cold 0
  const finishOrder = {}; // tribe -> array of {name, order}
  const tribeFinishOrder = []; // ordered tribe names by first finisher

  allActive.forEach(n => {
    coldMeter[n] = 8;
    floeProgress[n] = 0;
  });

  // Simulate floe-by-floe crossing — runs until all tribes have a finisher or max rounds
  const MAX_ROUNDS = FLOES_PER_PLAYER * 3;
  for (let floe = 0; floe < MAX_ROUNDS; floe++) {
    // Stop once every tribe has at least one finisher
    if (tribeFinishOrder.length >= tribes.length) break;

    const isHuddle = floe > 0 && floe % Math.floor(FLOES_PER_PLAYER / 2) === 0;

    // Huddle checkpoint
    if (isHuddle) {
      allActive.forEach(n => {
        if (frozenPlayers.has(n)) return;
        coldMeter[n] = clamp(coldMeter[n] + 1.5, 0, 10);
      });
      phase1.push({
        type: 'huddle', floe, text: `Midway checkpoint! Everyone huddles together for warmth. Cold meters recover slightly.`,
        players: allActive.filter(n => !frozenPlayers.has(n)),
        badge: 'HUDDLE', badgeClass: 'gold'
      });
    }

    // Each active player attempts this floe
    const floeAttempts = [];
    allActive.forEach(n => {
      if (frozenPlayers.has(n)) return;
      if (floeProgress[n] >= FLOES_PER_PLAYER) return; // already finished
      if (finishOrder[tribeOf[n]]?.length > 0) return; // tribe already has a finisher — wait for sled

      const s = pStats(n);
      const pr = pronouns(n);
      const threshold = s.endurance * 0.6;
      const coldPenalty = coldMeter[n] < threshold ? (threshold - coldMeter[n]) * 0.08 : 0;
      const hopScore = s.physical * 0.08 + noise(2.5) - coldPenalty;

      if (hopScore > 0) {
        // Clean hop
        floeProgress[n]++;
        ep.chalMemberScores[n] += 2;
        floeAttempts.push({
          type: 'cleanHop', player: n, floe,
          text: pick(CLEAN_HOP)(n, pr),
          score: 2, badge: 'CLEAN HOP', badgeClass: 'gold'
        });
      } else {
        // Water fall
        const coldLoss = 1.5 + Math.random();
        coldMeter[n] = clamp(coldMeter[n] - coldLoss, 0, 10);
        ep.chalMemberScores[n] -= 1;
        floeAttempts.push({
          type: 'waterFall', player: n, floe,
          text: pick(WATER_FALL)(n, pr),
          coldLoss: Math.round(coldLoss * 10) / 10,
          score: -1, badge: 'WATER FALL', badgeClass: 'red'
        });

        // Check frozen
        if (coldMeter[n] <= 0) {
          frozenPlayers.add(n);
          ep.chalMemberScores[n] -= 3;
          popDelta(n, -1);
          floeAttempts.push({
            type: 'frozen', player: n, floe,
            text: pick(FROZEN_TEXT)(n, pr),
            score: -3, badge: 'FROZEN', badgeClass: 'red'
          });
        }
      }
    });

    phase1.push(...floeAttempts);

    // Check if any players finished — only ONE per tribe (alphabetical tiebreak)
    const finishedThisRound = {};
    allActive.forEach(n => {
      if (frozenPlayers.has(n)) return;
      if (floeProgress[n] >= FLOES_PER_PLAYER && !finishOrder[tribeOf[n]]?.length) {
        const tribe = tribeOf[n];
        if (!finishedThisRound[tribe]) finishedThisRound[tribe] = [];
        finishedThisRound[tribe].push(n);
      }
    });
    Object.entries(finishedThisRound).forEach(([tribe, names]) => {
      names.sort();
      const puller = names[0];
      if (!finishOrder[tribe]) finishOrder[tribe] = [];
      finishOrder[tribe].push({ name: puller, order: Object.values(finishOrder).flat().length });
      ep.chalMemberScores[puller] += 8;
      popDelta(puller, 2);
      tribeFinishOrder.push(tribe);
      const pr = pronouns(puller);
      phase1.push({
        type: 'crossed', player: puller, floe, isPuller: true,
        text: pick(PULLER_TEXT)(puller, tribe, pr),
        score: 8, badge: 'SLED PULLER', badgeClass: 'gold'
      });
    });

    // Polar bear attacks (~15% per hop for random active players)
    const activeThisFloe = allActive.filter(n => !frozenPlayers.has(n) && floeProgress[n] < FLOES_PER_PLAYER);
    activeThisFloe.forEach(n => {
      if (Math.random() > 0.15) return;
      const s = pStats(n);
      const pr = pronouns(n);
      const dodgeScore = s.physical * 0.06 + s.boldness * 0.04 + noise(2.5);
      if (dodgeScore > 0) {
        ep.chalMemberScores[n] += 1;
        popDelta(n, 1);
        phase1.push({
          type: 'bearDodge', player: n, floe,
          text: pick(BEAR_DODGE)(n, pr),
          score: 1, badge: 'BEAR DODGE', badgeClass: 'gold'
        });
      } else {
        const coldLoss = 2;
        coldMeter[n] = clamp(coldMeter[n] - coldLoss, 0, 10);
        floeProgress[n] = Math.max(0, floeProgress[n] - 1);
        ep.chalMemberScores[n] -= 2;
        popDelta(n, -1);
        phase1.push({
          type: 'bearHit', player: n, floe,
          text: pick(BEAR_HIT)(n, pr),
          coldLoss: 2, score: -2, badge: 'BEAR ATTACK', badgeClass: 'red'
        });
        if (coldMeter[n] <= 0) {
          frozenPlayers.add(n);
          ep.chalMemberScores[n] -= 3;
          phase1.push({
            type: 'frozen', player: n, floe,
            text: pick(FROZEN_TEXT)(n, pronouns(n)),
            score: -3, badge: 'FROZEN', badgeClass: 'red'
          });
        }
      }
    });

    // Cross-tribe rescue (~20% when someone falls in water near a rival)
    const fallenThisFloe = floeAttempts.filter(e => e.type === 'waterFall').map(e => e.player);
    fallenThisFloe.forEach(fallen => {
      if (frozenPlayers.has(fallen)) return;
      const nearbyRivals = allActive.filter(n =>
        n !== fallen && !frozenPlayers.has(n) &&
        tribeOf[n] !== tribeOf[fallen] &&
        Math.abs(floeProgress[n] - floeProgress[fallen]) <= 1 &&
        getBond(n, fallen) >= -2
      );
      if (nearbyRivals.length > 0 && Math.random() < 0.2) {
        const rescuer = pick(nearbyRivals);
        const rPr = pronouns(rescuer);
        addBond(rescuer, fallen, 1.5);
        popDelta(rescuer, 2);
        ep.chalMemberScores[rescuer] += 5;
        phase1.push({
          type: 'rescue', rescuer, fallen, floe,
          text: pick(RESCUE_TEXT)(rescuer, fallen, rPr),
          score: 5, badge: 'ICE RESCUE', badgeClass: 'gold'
        });

        ep.campEvents[tribeOf[rescuer]].post.push({
          type: 'frozen-crossing-rescue',
          text: `${rescuer} pulled ${fallen} from the icy water during the crossing`,
          players: [rescuer, fallen],
          badgeText: 'Ice Rescue', badgeClass: 'badge-positive'
        });
      }
    });

    // Collision (~10% per floe for players on same progress)
    const progressGroups = {};
    allActive.filter(n => !frozenPlayers.has(n)).forEach(n => {
      const p = floeProgress[n];
      if (!progressGroups[p]) progressGroups[p] = [];
      progressGroups[p].push(n);
    });
    Object.values(progressGroups).forEach(group => {
      if (group.length < 2) return;
      if (Math.random() > 0.1) return;
      const shuffled = group.slice().sort(() => Math.random() - 0.5);
      const a = shuffled[0], b = shuffled[1];
      const aScore = pStats(a).physical * 0.1 + noise(2.5);
      const bScore = pStats(b).physical * 0.1 + noise(2.5);
      const winner = aScore >= bScore ? a : b;
      const loser = winner === a ? b : a;
      const coldLoss = 1.5;
      coldMeter[loser] = clamp(coldMeter[loser] - coldLoss, 0, 10);
      ep.chalMemberScores[winner] += 1;
      ep.chalMemberScores[loser] -= 1;
      addBond(winner, loser, -0.5);
      phase1.push({
        type: 'collision', winner, loser, floe,
        text: pick(COLLISION_TEXT)(winner, loser),
        score: { [winner]: 1, [loser]: -1 }, badge: 'COLLISION', badgeClass: 'red'
      });
      if (coldMeter[loser] <= 0) {
        frozenPlayers.add(loser);
        ep.chalMemberScores[loser] -= 3;
        phase1.push({
          type: 'frozen', player: loser, floe,
          text: pick(FROZEN_TEXT)(loser, pronouns(loser)),
          score: -3, badge: 'FROZEN', badgeClass: 'red'
        });
      }
    });

  }

  // Force finish any non-frozen players still in progress
  allActive.forEach(n => {
    if (frozenPlayers.has(n)) return;
    if (floeProgress[n] < FLOES_PER_PLAYER) {
      floeProgress[n] = FLOES_PER_PLAYER;
      const tribe = tribeOf[n];
      if (!finishOrder[tribe]) finishOrder[tribe] = [];
      if (!finishOrder[tribe].find(f => f.name === n)) {
        finishOrder[tribe].push({ name: n, order: Object.values(finishOrder).flat().length });
      }
      if (!tribeFinishOrder.includes(tribe)) tribeFinishOrder.push(tribe);
    }
  });

  // Ensure all tribes are in tribeFinishOrder
  tribes.forEach(t => {
    if (!tribeFinishOrder.includes(t.name)) tribeFinishOrder.push(t.name);
  });

  // ══ SLED ASSIGNMENT ══
  const sledTypes = ['competition', 'wood', 'radioactive'];
  const sledAssignment = {};
  const pullers = {};
  tribeFinishOrder.forEach((tribeName, idx) => {
    sledAssignment[tribeName] = sledTypes[Math.min(idx, sledTypes.length - 1)];
    const tribeFinishers = finishOrder[tribeName] || [];
    const firstFinisher = tribeFinishers.sort((a, b) => a.order - b.order)[0];
    pullers[tribeName] = firstFinisher ? firstFinisher.name : tribes.find(t => t.name === tribeName)?.members[0];
  });

  // ══ PHASE 2: SLED PICKUP RACE (INTERLEAVED) ══
  const phase2 = [];
  const tribeTimings = {};
  const leftBehind = {};
  const stuckPlayers = new Set();
  const sledMultiplier = { competition: 1.15, wood: 1.0, radioactive: 0.85 };

  const raceState = tribes.map(t => {
    const tribeName = t.name;
    const puller = pullers[tribeName];
    const passengers = t.members.filter(n => n !== puller && !frozenPlayers.has(n));
    const sortedPassengers = passengers.sort((a, b) => {
      const aOrder = finishOrder[tribeName]?.find(f => f.name === a)?.order ?? 999;
      const bOrder = finishOrder[tribeName]?.find(f => f.name === b)?.order ?? 999;
      return aOrder - bOrder;
    });
    leftBehind[tribeName] = [...t.members.filter(n => frozenPlayers.has(n))];
    const ps = pStats(puller);
    const pullerCold = coldMeter[puller] || 4;
    const pullerThreshold = ps.endurance * 0.6;
    return {
      tribeName, puller, passengers: sortedPassengers,
      nextPickup: 0, passengerCount: 0, time: 0,
      finished: false, bridgeHit: false,
      sled: sledAssignment[tribeName],
      sledMult: sledMultiplier[sledAssignment[tribeName]] || 1.0,
      members: [...t.members],
      ps,
      coldPenalty: pullerCold < pullerThreshold ? (pullerThreshold - pullerCold) * 0.05 : 0
    };
  });

  const maxPickups = Math.max(...raceState.map(rs => rs.passengers.length));
  const totalRounds = maxPickups + 3;
  let lastTribePOV = null;
  let prevRaceOrder = raceState.map(rs => rs.tribeName);

  for (let round = 0; round < totalRounds; round++) {
    const raceOrder = [...raceState].sort((a, b) => a.time - b.time);
    const currentOrder = raceOrder.map(rs => rs.tribeName);

    // Detect overtakes
    if (round > 0) {
      for (let i = 0; i < currentOrder.length; i++) {
        const tn = currentOrder[i];
        const prevPos = prevRaceOrder.indexOf(tn);
        if (prevPos > i && !raceState.find(rs => rs.tribeName === tn).finished) {
          const overtaken = prevRaceOrder[i];
          if (overtaken && overtaken !== tn) {
            phase2.push({
              type: 'overtake', tribeName: tn, overtaken,
              text: pick(OVERTAKE_TEXT)(tn, overtaken),
              badge: 'OVERTAKE!', badgeClass: 'gold'
            });
            lastTribePOV = null;
          }
        }
      }
    }
    prevRaceOrder = [...currentOrder];

    for (const rs of raceOrder) {
      if (rs.finished) continue;
      const tn = rs.tribeName;
      const campKey = tn;

      // Tribe header when POV switches
      if (lastTribePOV !== tn) {
        const pos = currentOrder.indexOf(tn) + 1;
        const posLabel = pos === 1 ? '1ST' : pos === 2 ? '2ND' : pos === 3 ? '3RD' : `${pos}TH`;
        phase2.push({
          type: 'tribeHeader', tribeName: tn, position: posLabel,
          text: '', badge: tn.toUpperCase(), badgeClass: 'tribe'
        });
        lastTribePOV = tn;
      }

      if (rs.nextPickup < rs.passengers.length) {
        const passenger = rs.passengers[rs.nextPickup];
        if (stuckPlayers.has(passenger)) { rs.nextPickup++; continue; }
        const cpNum = rs.nextPickup + 1;

        // APPROACH segment
        const passengerFinishIdx = finishOrder[tn]?.findIndex(f => f.name === passenger) ?? rs.passengers.length;
        const distance = 10 + passengerFinishIdx * 5;
        const baseSpeed = rs.ps.physical * 0.08 + rs.ps.endurance * 0.04 + noise(2.5);
        const weightPenalty = rs.passengerCount * 0.08;
        const speed = Math.max(0.1, (baseSpeed - weightPenalty) * rs.sledMult - rs.coldPenalty);
        rs.time += distance / Math.max(0.1, speed);

        phase2.push({
          type: 'approach', tribeName: tn, puller: rs.puller, cpNum,
          text: pick(APPROACH_TEXT)(rs.puller, tn, cpNum),
          badge: `CHECKPOINT ${cpNum}`, badgeClass: 'default'
        });

        // Terrain hazard (~40%)
        if (Math.random() < 0.40) {
          const terrainRoll = Math.random();
          let terrainText, timeDelta, badgeLbl, badgeCls;
          if (terrainRoll < 0.3) {
            terrainText = pick(TERRAIN_UPHILL_TEXT)(rs.puller, tn);
            timeDelta = 5 + noise(3); badgeLbl = 'UPHILL'; badgeCls = 'red';
          } else if (terrainRoll < 0.55) {
            terrainText = pick(TERRAIN_DOWNHILL_TEXT)(rs.puller, tn);
            timeDelta = -(3 + noise(2)); badgeLbl = 'DOWNHILL'; badgeCls = 'gold';
          } else if (terrainRoll < 0.8) {
            terrainText = pick(TERRAIN_ICE_TEXT)(rs.puller, tn);
            timeDelta = 3 + noise(2); badgeLbl = 'ICE PATCH'; badgeCls = 'red';
          } else {
            terrainText = pick(TERRAIN_DRIFT_TEXT)(rs.puller, tn);
            timeDelta = 6 + noise(3); badgeLbl = 'SNOWDRIFT'; badgeCls = 'red';
          }
          rs.time += timeDelta;
          phase2.push({
            type: 'terrain', tribeName: tn, puller: rs.puller,
            text: terrainText, badge: badgeLbl, badgeClass: badgeCls
          });
        }

        // Cold penalty (~30% if puller cold < 5)
        if (coldMeter[rs.puller] < 5 && Math.random() < 0.30) {
          rs.time += (5 - coldMeter[rs.puller]) * 1.5;
          ep.chalMemberScores[rs.puller] = (ep.chalMemberScores[rs.puller] || 0) - 1;
          phase2.push({
            type: 'coldPenalty', tribeName: tn, puller: rs.puller,
            text: pick(COLD_PENALTY_TEXT)(rs.puller),
            badge: 'COLD PENALTY', badgeClass: 'red'
          });
        }

        // PICKUP
        rs.passengerCount++;
        ep.chalMemberScores[passenger] = (ep.chalMemberScores[passenger] || 0) + 3;
        ep.chalMemberScores[rs.puller] = (ep.chalMemberScores[rs.puller] || 0) + 1;
        phase2.push({
          type: 'pickup', puller: rs.puller, passenger, tribeName: tn, idx: rs.nextPickup,
          text: pick(PICKUP_TEXT)(rs.puller, passenger),
          score: 3, badge: 'PICKUP', badgeClass: 'gold'
        });

        // Social events after pickup (guaranteed 1, chance of more scaling with passengers)
        const onSled = [rs.puller, ...rs.passengers.slice(0, rs.nextPickup + 1)].filter(n => !stuckPlayers.has(n));
        const numSocial = 1 + (rs.passengerCount >= 2 && Math.random() < 0.5 ? 1 : 0) + (rs.passengerCount >= 4 && Math.random() < 0.4 ? 1 : 0);
        for (let ev = 0; ev < numSocial; ev++) {
          if (onSled.length < 2) break;
          const a = pick(onSled);
          const b = pick(onSled.filter(n => n !== a));
          if (!a || !b) continue;
          const bond = getBond(a, b);
          const roll = Math.random();

          if (bond >= 2 && roll < 0.35) {
            rs.time -= 0.5;
            addBond(a, b, 0.5);
            ep.chalMemberScores[a] = (ep.chalMemberScores[a] || 0) + 4;
            phase2.push({
              type: 'encouragement', from: a, to: b, tribeName: tn,
              text: pick(ENCOURAGE_TEXT)(a, b),
              score: 4, badge: 'ENCOURAGEMENT', badgeClass: 'gold'
            });
          } else if ((bond <= -1 || pStats(a).strategic * 0.1 + noise(2.5) > 0.5) && roll < 0.6) {
            rs.time -= 1.0;
            addBond(a, b, -1.0);
            popDelta(a, -1);
            ep.chalMemberScores[b] = (ep.chalMemberScores[b] || 0) - 2;
            phase2.push({
              type: 'whipping', from: a, to: b, tribeName: tn,
              text: pick(WHIPPING_TEXT)(a, b),
              score: -2, badge: 'WHIPPING', badgeClass: 'red'
            });
            ep.campEvents[campKey].post.push({
              type: 'frozen-crossing-whipping',
              text: `${a} was ruthless toward ${b} during the sled race`,
              players: [a, b],
              badgeText: 'Harsh Driver', badgeClass: 'badge-negative'
            });
          } else if (roll < 0.8) {
            coldMeter[a] = clamp((coldMeter[a] || 4) + 0.5, 0, 10);
            coldMeter[b] = clamp((coldMeter[b] || 4) + 0.5, 0, 10);
            phase2.push({
              type: 'huddleWarmth', from: a, to: b, tribeName: tn,
              text: `${a} and ${b} huddle together on the sled. The shared warmth helps them both.`,
              badge: 'WARMTH', badgeClass: 'gold'
            });
          } else {
            addBond(a, b, 0.5);
            phase2.push({
              type: 'teamMoment', from: a, to: b, tribeName: tn,
              text: pick(TEAM_MOMENT_TEXT)(a, b),
              badge: 'MOMENT', badgeClass: 'gold'
            });
          }
        }

        // Frostbite — targets coldest player on sled (~20%)
        if (Math.random() < 0.20) {
          const coldest = onSled.filter(n => (coldMeter[n] ?? 8) < 6).sort((a, b) => (coldMeter[a] ?? 8) - (coldMeter[b] ?? 8))[0];
          if (coldest) {
            const loss = 0.8 + Math.random() * 0.7;
            coldMeter[coldest] = clamp((coldMeter[coldest] ?? 8) - loss, 0, 10);
            phase2.push({
              type: 'frostbite', from: coldest, tribeName: tn,
              text: pick(FROSTBITE_TEXT)(coldest),
              badge: 'FROSTBITE', badgeClass: 'red'
            });
          }
        }

        // Puller fatigue (~25% when 2+ passengers)
        if (rs.passengerCount >= 2 && Math.random() < 0.25) {
          rs.time += 3 + noise(2);
          ep.chalMemberScores[rs.puller] = (ep.chalMemberScores[rs.puller] || 0) - 1;
          phase2.push({
            type: 'pullerFatigue', tribeName: tn, puller: rs.puller,
            text: pick(PULLER_FATIGUE_TEXT)(rs.puller),
            badge: 'FATIGUE', badgeClass: 'red'
          });
        }

        // Sled stress (~20% when 3+ passengers)
        if (rs.passengerCount >= 3 && Math.random() < 0.20) {
          rs.time += 4 + noise(2);
          phase2.push({
            type: 'sledStress', tribeName: tn,
            text: pick(SLED_STRESS_TEXT)(tn, rs.passengerCount),
            badge: 'SLED DAMAGE', badgeClass: 'red'
          });
        }

        // Romance trap (~10%)
        if (seasonConfig.romance && Math.random() < 0.10) {
          const otherTribes = tribes.filter(ot => ot.name !== tn);
          otherTribes.forEach(otherTribe => {
            const crossPairs = otherTribe.members.filter(n =>
              !frozenPlayers.has(n) && !stuckPlayers.has(n) &&
              romanticCompat(passenger, n) && getBond(passenger, n) >= 2
            );
            if (crossPairs.length > 0 && Math.random() < 0.3) {
              const target = pick(crossPairs);
              const isCharmer = arch(passenger) === 'showmancer' || arch(passenger) === 'social-butterfly';
              const isAccident = !isCharmer && Math.random() < 0.08;

              if (isCharmer) {
                ep.chalMemberScores[passenger] = (ep.chalMemberScores[passenger] || 0) + 4;
                stuckPlayers.add(target);
                phase2.push({
                  type: 'romanceTrap', charmer: passenger, target, tribeName: tn,
                  deliberate: true,
                  text: pick(ROMANCE_TRAP_TEXT)(passenger, target),
                  score: 4, badge: 'ROMANCE TRAP', badgeClass: 'pink'
                });
                popDelta(passenger, 1);
              } else if (isAccident) {
                stuckPlayers.add(passenger);
                stuckPlayers.add(target);
                phase2.push({
                  type: 'romanceTrap', charmer: passenger, target, tribeName: tn,
                  deliberate: false,
                  text: pick(ROMANCE_TRAP_TEXT)(passenger, target),
                  badge: 'STUCK', badgeClass: 'pink'
                });
              }

              if (stuckPlayers.has(passenger) || stuckPlayers.has(target)) {
                const stuckInTribe = stuckPlayers.has(passenger) ? passenger : null;
                const stuckInOther = stuckPlayers.has(target) ? target : null;
                [{ stuck: stuckInTribe, stn: tn }, { stuck: stuckInOther, stn: otherTribe.name }].forEach(({ stuck, stn }) => {
                  if (!stuck) return;
                  const tribeMembers = tribes.find(t2 => t2.name === stn)?.members || [];
                  const hasLoyal = tribeMembers.some(m => NICE_ARCHS.has(arch(m)));
                  const hasVillain = tribeMembers.some(m => VILLAIN_ARCHS.has(arch(m)));
                  const waitChance = hasLoyal ? 0.7 : hasVillain ? 0.2 : 0.5;

                  if (Math.random() < waitChance) {
                    const rsStuck = raceState.find(r => r.tribeName === stn);
                    if (rsStuck) rsStuck.time += 45;
                    stuckPlayers.delete(stuck);
                    phase2.push({
                      type: 'waitDecision', tribe: stn, player: stuck, tribeName: stn,
                      text: `${stn} decides to wait for ${stuck}. It costs precious time, but nobody gets left behind.`,
                      badge: 'WAIT', badgeClass: 'gold'
                    });
                  } else {
                    if (!leftBehind[stn]) leftBehind[stn] = [];
                    leftBehind[stn].push(stuck);
                    if (!gs._frozenCrossingHeat) gs._frozenCrossingHeat = {};
                    const epNum = gs.episodeHistory.length;
                    const pullerOfTribe = pullers[stn];
                    tribeMembers.filter(m => m !== stuck).forEach(m => {
                      gs._frozenCrossingHeat[stuck + '-' + m] = { target: m, amount: 3, expiresEp: epNum + 3 };
                    });
                    addBond(stuck, pullerOfTribe, -2);
                    popDelta(stuck, -2);
                    phase2.push({
                      type: 'leaveDecision', tribe: stn, player: stuck, tribeName: stn,
                      text: `${stn} leaves ${stuck} behind. ${pronouns(stuck).Sub} watches the sled disappear into the blizzard.`,
                      badge: 'LEFT BEHIND', badgeClass: 'red'
                    });
                    ep.campEvents[stn].post.push({
                      type: 'frozen-crossing-abandoned',
                      text: `${stuck} was left behind during the sled race and won't forget it`,
                      players: [stuck],
                      badgeText: 'Abandoned', badgeClass: 'badge-negative'
                    });
                  }
                });
              }
            }
          });
        }

        rs.nextPickup++;

      } else if (!rs.bridgeHit) {
        // Bridge section
        rs.bridgeHit = true;
        if (Math.random() < 0.45) {
          const pullerPr = pronouns(rs.puller);
          phase2.push({
            type: 'bridgeCollapse', tribeName: tn,
            text: pick(BRIDGE_COLLAPSE_TEXT)(tn),
            badge: 'BRIDGE COLLAPSE', badgeClass: 'red'
          });
          const physCheck = rs.ps.physical * 0.08 + noise(2.5);
          if (physCheck > 0.3) {
            ep.chalMemberScores[rs.puller] = (ep.chalMemberScores[rs.puller] || 0) + 5;
            popDelta(rs.puller, 3);
            const t = tribes.find(t2 => t2.name === tn);
            t.members.filter(m => m !== rs.puller && !frozenPlayers.has(m)).forEach(m => addBond(m, rs.puller, 1));
            phase2.push({
              type: 'heroSave', puller: rs.puller, tribeName: tn,
              text: pick(HERO_SAVE_TEXT)(rs.puller, pullerPr),
              score: 5, badge: 'HERO SAVE', badgeClass: 'gold'
            });
            ep.campEvents[campKey].post.push({
              type: 'frozen-crossing-hero',
              text: `${rs.puller} saved the entire team from a bridge collapse during the crossing`,
              players: [rs.puller],
              badgeText: 'Hero Save', badgeClass: 'badge-positive'
            });
          } else {
            rs.time += 20;
            phase2.push({
              type: 'bridgeFail', puller: rs.puller, tribeName: tn,
              text: `${rs.puller} can't hold on. The sled drops and the team scrambles to recover. Precious seconds lost.`,
              badge: 'BRIDGE FAIL', badgeClass: 'red'
            });
          }
        }
      } else if (!rs.finished) {
        // Final sprint
        const t = tribes.find(t2 => t2.name === tn);
        const sprintBonus = t.members.filter(n => !frozenPlayers.has(n) && !stuckPlayers.has(n) && !leftBehind[tn]?.includes(n))
          .reduce((sum, n) => {
            const s = pStats(n);
            return sum + s.physical * 0.02 + s.endurance * 0.01 + noise(1);
          }, 0) / Math.max(1, t.members.length);
        rs.time -= sprintBonus * 5;
        phase2.push({
          type: 'finalSprint', tribeName: tn,
          text: pick(FINAL_SPRINT_TEXT)(tn),
          badge: 'FINAL SPRINT', badgeClass: 'gold'
        });
        rs.finished = true;
        tribeTimings[tn] = rs.time;
      }
    }

    // Cross-tribe events between rounds (~35%)
    const activeTribes = raceState.filter(rs => !rs.finished);
    if (activeTribes.length >= 2 && Math.random() < 0.35) {
      const tA = pick(activeTribes);
      const tB = pick(activeTribes.filter(rs => rs !== tA));
      if (tA && tB) {
        if (Math.random() < 0.4) {
          // Trash talk
          const sledA = [tA.puller, ...tA.passengers.slice(0, tA.nextPickup)].filter(n => !stuckPlayers.has(n));
          const sledB = [tB.puller, ...tB.passengers.slice(0, tB.nextPickup)].filter(n => !stuckPlayers.has(n));
          const a = pick(sledA); const b = pick(sledB);
          if (a && b) {
            addBond(a, b, -0.5);
            popDelta(a, -1);
            phase2.push({
              type: 'trashTalk', from: a, target: b, tribeName: tA.tribeName,
              tribeA: tA.tribeName, tribeB: tB.tribeName,
              text: pick(TRASH_TALK_TEXT)(a, tA.tribeName, b, tB.tribeName),
              badge: 'TRASH TALK', badgeClass: 'red'
            });
          }
        } else {
          // Near collision
          tA.time += 1; tB.time += 1;
          phase2.push({
            type: 'nearCollision', tribeA: tA.tribeName, tribeB: tB.tribeName, tribeName: tA.tribeName,
            text: pick(NEAR_COLLISION_TEXT)(tA.tribeName, tB.tribeName),
            badge: 'NEAR COLLISION', badgeClass: 'red'
          });
        }
        lastTribePOV = null;
      }
    }

    // Weather event (~15%)
    if (Math.random() < 0.15 && activeTribes.length > 0) {
      const affected = pick(activeTribes);
      if (affected) {
        affected.time += 2 + noise(2);
        phase2.push({
          type: 'weather', tribeName: affected.tribeName,
          text: pick(WEATHER_TEXT)(affected.tribeName),
          badge: 'WEATHER', badgeClass: 'red'
        });
        lastTribePOV = null;
      }
    }

    if (raceState.every(rs => rs.finished)) break;
  }

  // Ensure all tribes have timings
  raceState.forEach(rs => {
    if (!tribeTimings[rs.tribeName]) tribeTimings[rs.tribeName] = rs.time;
  });

  // ══ DETERMINE RESULTS ══
  // Check Bridgette Rule first
  const bridgetteTribes = [];
  const cleanTribes = [];
  tribes.forEach(t => {
    if (leftBehind[t.name]?.length > 0 || t.members.some(n => frozenPlayers.has(n) && !leftBehind[t.name]?.includes(n))) {
      // Tribe has missing members (frozen + left behind)
      const missingCount = (leftBehind[t.name]?.length || 0) + t.members.filter(n => frozenPlayers.has(n) && !(leftBehind[t.name] || []).includes(n)).length;
      bridgetteTribes.push({ name: t.name, missing: missingCount, time: tribeTimings[t.name] || 999 });
    } else {
      cleanTribes.push({ name: t.name, time: tribeTimings[t.name] || 999 });
    }
  });

  // Sort clean tribes by time, then bridgette tribes by fewer missing then time
  cleanTribes.sort((a, b) => a.time - b.time);
  bridgetteTribes.sort((a, b) => a.missing - b.missing || a.time - b.time);

  const tribesSorted = [...cleanTribes, ...bridgetteTribes];
  const winnerTribeName = tribesSorted[0]?.name;
  const loserTribeName = tribesSorted[tribesSorted.length - 1]?.name;

  // Bridgette Rule narration
  bridgetteTribes.forEach(bt => {
    const missingNames = [
      ...(leftBehind[bt.name] || []),
      ...tribes.find(t => t.name === bt.name).members.filter(n => frozenPlayers.has(n) && !(leftBehind[bt.name] || []).includes(n))
    ];
    if (missingNames.length > 0) {
      phase2.push({
        type: 'bridgetteRule', tribeName: bt.name, missing: missingNames,
        text: pick(BRIDGETTE_RULE_TEXT)(bt.name, missingNames),
        badge: 'BRIDGETTE RULE', badgeClass: 'red'
      });
    }
  });

  // Build result object
  const result = {
    phase1,
    phase2,
    coldMeter: { ...coldMeter },
    floeProgress: { ...floeProgress },
    frozenPlayers: [...frozenPlayers],
    finishOrder,
    tribeFinishOrder,
    sledAssignment,
    pullers,
    tribeTimings,
    leftBehind,
    bridgetteTribes: bridgetteTribes.map(b => b.name),
    tribesSorted: tribesSorted.map(t => t.name),
    winner: winnerTribeName,
    loser: loserTribeName,
    floesPerPlayer: FLOES_PER_PLAYER,
    immunityWinner: null, // tribe challenge, not individual
    tribes: tribes.map(t => {
      const puller = pullers[t.name];
      const passengers = t.members.filter(n => n !== puller && !frozenPlayers.has(n));
      const sortedPass = passengers.sort((a, b) => {
        const aO = finishOrder[t.name]?.find(f => f.name === a)?.order ?? 999;
        const bO = finishOrder[t.name]?.find(f => f.name === b)?.order ?? 999;
        return aO - bO;
      });
      return {
        name: t.name,
        members: [...t.members],
        puller,
        checkpoints: sortedPass,
        sled: sledAssignment[t.name],
        time: tribeTimings[t.name],
        hasBridgette: bridgetteTribes.some(b => b.name === t.name),
        missing: leftBehind[t.name] || []
      };
    })
  };

  // Romance hooks
  const _romActive = allActive;
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'frozen crossing');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'frozen crossing', _romActive);

  // ══ FINALIZE ══
  ep.frozenCrossing = result;
  ep.isFrozenCrossing = true;
  ep.challengeType = 'tribe';
  ep.challengeLabel = 'Frozen Crossing';
  ep.challengeCategory = 'adventure';

  const winnerTribe = gs.tribes.find(t => t.name === winnerTribeName);
  const loserTribe = gs.tribes.find(t => t.name === loserTribeName);
  ep.winner = winnerTribe;
  ep.loser = loserTribe;
  ep.safeTribes = tribesSorted.length > 2
    ? tribesSorted.slice(1, -1).map(tn => gs.tribes.find(t => t.name === tn)).filter(Boolean)
    : [];
  ep.tribalPlayers = loserTribe ? [...loserTribe.members] : [];

  ep.challengePlacements = tribesSorted.map(tn => ({
    name: tn, members: [...(gs.tribes.find(t => t.name === tn)?.members || [])],
    memberScores: {},
  }));

  ep.chalPlacements = Object.entries(ep.chalMemberScores)
    .sort(([, a], [, b]) => b - a).map(([n]) => n);

  // Top scorer from winning tribe gets massive bonus
  const topScorer = winnerTribe?.members.slice().sort((a, b) =>
    (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0)
  )[0];
  if (topScorer) {
    const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores)
      .filter(([n]) => n !== topScorer).map(([, s]) => s));
    ep.chalMemberScores[topScorer] = Math.max(
      ep.chalMemberScores[topScorer] || 0, maxOther) + allActive.length + 5;
  }

  updateChalRecord(ep);
  return ep;
}

// ══════════════════════════════════════════════════════════════
// VP BUILDERS — Mockup-faithful (frozen-crossing mockup v3)
// ══════════════════════════════════════════════════════════════

const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`fc-step-${suffix}-${i}`);
    if (el) el.classList.add('fc-visible');
  }
  const counter = document.getElementById(`fc-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`fc-controls-${suffix}`);
    if (controls) { const btns = controls.querySelectorAll('.fc-btn'); btns.forEach(b => b.style.opacity = '0.4'); }
  }
}

function _fcUpdateMap(screenKey) {
  if (!screenKey?.includes('phase2')) return;
  const st = _tvState[screenKey];
  if (!st) return;
  const revealIdx = st.idx;
  const ep = window._fcEpRecord;
  if (!ep?.frozenCrossing) return;

  // Update sled dot positions
  const snaps = window._fcMapSnapshots;
  const totals = window._fcMapTribeTotals;
  if (snaps && totals) {
    const snap = snaps[Math.min(Math.max(revealIdx, 0), snaps.length - 1)];
    if (snap) {
      ep.frozenCrossing.tribes.forEach((tribe, idx) => {
        const dot = document.getElementById(`fc-mapsled-${idx}`);
        if (!dot) return;
        const total = totals[tribe.name] || 1;
        const progress = snap[tribe.name] || 0;
        const pct = 3 + (progress / total) * 90;
        dot.style.left = `${pct}%`;
      });
    }
  }

  // Update checkpoint node states (unvisited → visited / left-behind)
  const cpSnaps = window._fcCpStateSnapshots;
  if (!cpSnaps) return;
  const cpSnap = cpSnaps[Math.min(Math.max(revealIdx, 0), cpSnaps.length - 1)] || {};
  const checkpoints = window._fcMapCheckpoints;
  if (!checkpoints) return;
  checkpoints.forEach(cp => {
    const key = `${cp.tribeIdx}-${cp.cpIdx}`;
    const el = document.getElementById(`fc-mapcp-${key}`);
    if (!el) return;
    const state = cpSnap[key];
    el.classList.remove('visited', 'left-behind', 'unvisited');
    if (state === 'visited') {
      el.classList.add('visited');
      const mark = el.querySelector('.fc-mapcp-mark');
      if (mark) mark.textContent = '✓';
      const img = el.querySelector('img');
      if (img) { img.style.filter = ''; }
    } else if (state === 'left-behind') {
      el.classList.add('left-behind');
      const mark = el.querySelector('.fc-mapcp-mark');
      if (mark) mark.textContent = '✗';
      const img = el.querySelector('img');
      if (img) { img.style.filter = ''; }
    } else {
      el.classList.add('unvisited');
      const mark = el.querySelector('.fc-mapcp-mark');
      if (mark) mark.textContent = '?';
      const img = el.querySelector('img');
      if (img) { img.style.filter = 'grayscale(1) brightness(.6)'; }
    }
  });
}

function _fcUpdateSidebar(screenKey) {
  const sideEl = document.getElementById('fc-sidebar-inner');
  if (!sideEl) return;
  const epRecord = window._fcEpRecord || gs.episodeHistory?.[window.vpEpNum - 1];
  if (!epRecord?.frozenCrossing) return;
  sideEl.innerHTML = _buildSidebarContent(epRecord, screenKey);
}

export function frozenCrossingRevealNext(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    if (st.idx >= st.total - 1) return;
    st.idx++;
    const suffix = screenKey.replace('fc-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
    const el = document.getElementById(`fc-step-${suffix}-${st.idx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (e) { console.warn('FC reveal error:', e); }
  try { _fcUpdateSidebar(screenKey); } catch (e) { /* sidebar update optional */ }
  try { _fcUpdateMap(screenKey); } catch (e) { /* map update optional */ }
}

export function frozenCrossingRevealAll(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    st.idx = st.total - 1;
    const suffix = screenKey.replace('fc-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
  } catch (e) { console.warn('FC revealAll error:', e); }
  try { _fcUpdateSidebar(screenKey); } catch (e) { /* sidebar update optional */ }
  try { _fcUpdateMap(screenKey); } catch (e) { /* map update optional */ }
}

// ── CSS MULTI-ELEMENT ICONS (from mockup) ──
function _iconSnow() {
  return `<div class="fc-isnow" style="flex-shrink:0;"><span class="a"></span><span class="a"></span><span class="a"></span><span class="d"></span></div>`;
}
function _iconBearLg() {
  return `<div class="fc-ibear-lg" style="flex-shrink:0;"><div class="bear bear-l"></div><div class="bear bear-r"></div><div class="bhead"><div class="beye beye-l"></div><div class="beye beye-r"></div><div class="bnose"></div><div class="bteeth"><div class="btooth"></div><div class="btooth"></div><div class="btooth"></div></div></div><div class="bfrost"></div><div class="bfrost"></div></div>`;
}
function _iconFloe(cracked = false) {
  return `<div class="fc-ifloe${cracked ? ' crk' : ''}" style="flex-shrink:0;"><div class="fb"></div>${cracked ? '<div class="fcrk"></div>' : ''}<div class="fs"></div></div>`;
}
function _iconSled(type = 'comp') {
  return `<div class="fc-isled ${type}" style="flex-shrink:0;"><div class="sb"></div><div class="sr"></div></div>`;
}
function _iconHeart() {
  return `<div class="fc-iheart" style="flex-shrink:0;"></div>`;
}
function _iconBridge(color = 'var(--fc-ice)') {
  return `<div class="fc-ibridge" style="flex-shrink:0;"><div class="ba" style="border-color:${color};"></div><div class="bp bp-l" style="background:${color};"></div><div class="bp bp-r" style="background:${color};"></div></div>`;
}
function _iconStuck() {
  return `<div class="fc-istuck" style="flex-shrink:0;"><div class="sp"></div><div class="sfr"></div><div class="st"></div></div>`;
}
function _iconWind() {
  return `<div class="fc-iwind" style="flex-shrink:0;"><div class="wl"></div><div class="wl"></div><div class="wl"></div></div>`;
}

function _eventIcon(type) {
  const map = {
    cleanHop: () => _iconFloe(false),
    waterFall: () => _iconFloe(true),
    bearDodge: () => _iconBearLg(),
    bearHit: () => _iconBearLg(),
    rescue: () => _iconHeart(),
    collision: () => _iconFloe(true),
    huddle: () => _iconSnow(),
    frozen: () => _iconSnow(),
    crossed: () => _iconFloe(false),
    pickup: () => _iconSled('comp'),
    encouragement: () => _iconSnow(),
    whipping: () => _iconWind(),
    huddleWarmth: () => _iconSnow(),
    bridgeCollapse: () => _iconBridge('var(--fc-danger)'),
    heroSave: () => _iconSnow(),
    bridgeFail: () => _iconBridge('var(--fc-danger)'),
    finalSprint: () => _iconWind(),
    romanceTrap: () => _iconHeart(),
    waitDecision: () => _iconSnow(),
    leaveDecision: () => _iconStuck(),
    bridgetteRule: () => _iconStuck(),
    approach: () => _iconSled('comp'),
    terrain: () => _iconWind(),
    coldPenalty: () => _iconSnow(),
    frostbite: () => _iconSnow(),
    sledStress: () => _iconSled('rad'),
    pullerFatigue: () => _iconWind(),
    teamMoment: () => _iconHeart(),
    overtake: () => _iconSled('comp'),
    trashTalk: () => _iconWind(),
    nearCollision: () => _iconSled('comp'),
    weather: () => _iconSnow(),
    tribeHeader: () => ''
  };
  return (map[type] || (() => _iconSnow()))();
}

function _badgeClass(cls) {
  return cls === 'gold' ? 'fc-bs' : cls === 'red' ? 'fc-bd' : cls === 'pink' ? 'fc-bp' : cls === 'blue' ? 'fc-bc' : 'fc-bh';
}

function _av(name, cls = '', extraStyle = '') {
  const tc = _playerTribeColor(name);
  const frozenCls = cls.includes('frozen') ? ' fc-av-frozen' : '';
  const shiverCls = cls.includes('shiver') ? ' fc-av-shiver' : '';
  const sizeCls = cls.includes('lg') ? ' fc-av-lg' : cls.includes('sm') ? ' fc-av-sm' : cls.includes('xs') ? ' fc-av-xs' : '';
  return `<img class="fc-av${sizeCls}${frozenCls}${shiverCls}" src="assets/avatars/${slug(name)}.png" alt="${name}" style="border-color:${tc};${extraStyle}" onerror="this.style.display='none'">`;
}

function _avWrap(name, cls = '', breath = false) {
  return `<div class="fc-bwrap">${_av(name, cls)}${breath ? '<div class="fc-vapor"></div>' : ''}</div>`;
}

// Get tribe color for a player
function _playerTribeColor(name) {
  const epIdx = window.vpEpNum;
  const epRecord = gs.episodeHistory?.[epIdx - 1];
  const fc = epRecord?.frozenCrossing;
  if (!fc) return 'var(--fc-ice)';
  const tribe = fc.tribes.find(t => t.members.includes(name));
  return tribe ? tribeColor(tribe.name) : 'var(--fc-ice)';
}

function _playerTribeName(name) {
  const epIdx = window.vpEpNum;
  const epRecord = gs.episodeHistory?.[epIdx - 1];
  const fc = epRecord?.frozenCrossing;
  if (!fc) return '';
  const tribe = fc.tribes.find(t => t.members.includes(name));
  return tribe ? tribe.name : '';
}

function _coldBar(cold, delta = 0) {
  const pct = clamp(cold / 10, 0, 1) * 100;
  const cls = cold > 5 ? 'w' : cold > 2 ? 'c' : 'f';
  return `<div class="fc-cold" style="margin-top:8px;">
    <div class="fc-isnow" style="transform:scale(.6);flex-shrink:0;"><span class="a"></span><span class="a"></span><span class="a"></span><span class="d"${cls === 'w' ? ' style="background:var(--fc-warm);"' : ''}></span></div>
    <div class="fc-ctrack"><div class="fc-cfill ${cls}" style="width:${pct}%;"></div></div>
    <span class="fc-cval ${cls}">${cold.toFixed(1)}</span>
    ${delta ? `<span class="fc-cdelta">▼ -${Math.abs(delta).toFixed(1)}</span>` : ''}
  </div>`;
}

// ── SIDEBAR ──
function _buildSidebarContent(ep, screenKey) {
  const fc = ep.frozenCrossing;
  if (!fc) return '';
  const phase = screenKey?.includes('phase2') ? 'phase2' : screenKey?.includes('sled') ? 'sled' : screenKey?.includes('results') ? 'results' : 'phase1';

  let html = '';

  if (phase === 'phase1' || phase === 'sled') {
    html += `<div class="fc-sbtitle">ICE FLOE PROGRESS</div>`;

    const stKey = screenKey || 'fc-phase1';
    const st = _tvState[stKey];
    const revealIdx = st?.idx ?? -1;
    const snaps = window._fcPhase1Snapshots;
    const snap = snaps && revealIdx >= 0 ? snaps[Math.min(revealIdx, snaps.length - 1)] : null;

    fc.tribes.forEach(tribe => {
      const tc = tribeColor(tribe.name);
      html += `<div style="font-family:'Black Ops One',cursive;font-size:9px;letter-spacing:2px;color:${tc};margin:8px 0 4px;border-bottom:1px solid ${tc}33;padding-bottom:3px;">${tribe.name.toUpperCase()}</div>`;
      tribe.members.forEach(name => {
        const gatedCold = snap ? (snap.cold[name] ?? 8) : 8;
        const gatedProgress = snap ? Math.min(snap.prog[name] || 0, fc.floesPerPlayer) : 0;
        const gatedFrozen = snap ? snap.frozen.has(name) : false;
        const coldCls = gatedCold > 5 ? 'w' : gatedCold > 2 ? 'c' : 'f';
        const coldPct = clamp(gatedCold / 10, 0, 1) * 100;
        const shiverCls = gatedCold <= 4 && !gatedFrozen ? ' fc-av-shiver' : '';
        const frozenCls = gatedFrozen ? ' fc-av-frozen' : '';
        const donePill = gatedProgress >= fc.floesPerPlayer ? ' done' : '';
        const pillText = gatedProgress >= fc.floesPerPlayer ? 'DONE' : `${gatedProgress}/${fc.floesPerPlayer}`;

        html += `<div class="fc-sbrow">`;
        html += `<div class="fc-bwrap"><img class="fc-av-xs${shiverCls}${frozenCls}" src="assets/avatars/${slug(name)}.png" style="border:1px solid ${tc};" onerror="this.style.display='none'">${gatedCold <= 4 && !gatedFrozen ? '<div class="fc-vapor"></div>' : ''}</div>`;
        html += `<div class="fc-sbname"${gatedFrozen ? ' style="color:var(--fc-frozen);"' : ''}>${name}</div>`;
        if (gatedFrozen) {
          html += `<span class="fc-floe-pill" style="background:rgba(239,68,68,.1);color:var(--fc-danger);">${gatedProgress}/${fc.floesPerPlayer}</span>`;
          html += `<div class="fc-thm"><div class="fc-thm-f" style="height:0%;"></div></div>`;
          html += `<span class="fc-cval f" style="font-size:8px;animation:fc-fbar 1s infinite;">0.0</span>`;
        } else {
          html += `<span class="fc-floe-pill${donePill}">${pillText}</span>`;
          const thmBg = coldCls === 'w' ? 'linear-gradient(to top,#fb923c,#f97316)' : coldCls === 'c' ? 'linear-gradient(to top,#7dd3fc,var(--fc-ice))' : 'linear-gradient(to top,#60a5fa,var(--fc-frozen))';
          html += `<div class="fc-thm"><div class="fc-thm-f" style="height:${coldPct}%;background:${thmBg};${coldCls === 'f' ? 'animation:fc-fbar 1.5s infinite;' : ''}"></div></div>`;
          html += `<span class="fc-cval ${coldCls}" style="font-size:8px;">${gatedCold.toFixed(1)}</span>`;
        }
        html += `</div>`;
      });
    });
  } else if (phase === 'phase2') {
    html += `<div class="fc-sbtitle">SLED RACE STATUS</div>`;

    const stKey = screenKey || 'fc-phase2';
    const st2 = _tvState[stKey];
    const revealIdx2 = st2?.idx ?? -1;
    const cpSnap = window._fcCpStateSnapshots;
    const cpState = cpSnap && revealIdx2 >= 0 ? cpSnap[Math.min(revealIdx2, cpSnap.length - 1)] : {};

    fc.tribes.forEach((tribe, tIdx) => {
      const tc = tribeColor(tribe.name);
      const sledType = tribe.sled;
      html += `<div style="font-family:'Black Ops One',cursive;font-size:9px;letter-spacing:2px;color:${tc};margin:8px 0 4px;border-bottom:1px solid ${tc}33;padding-bottom:3px;">${tribe.name.toUpperCase()}</div>`;
      html += `<div style="font-size:8px;color:${tc};opacity:.5;margin-bottom:4px;letter-spacing:1px;">${_iconSled(sledType)} ${(SLED_NAMES[sledType] || 'Sled').toUpperCase()}</div>`;

      // Puller row
      const pullerCold = fc.coldMeter?.[tribe.puller] ?? 8;
      const pullerColdCls = pullerCold > 5 ? 'w' : pullerCold > 2 ? 'c' : 'f';
      const pullerColdPct = clamp(pullerCold / 10, 0, 1) * 100;
      html += `<div class="fc-sbrow">`;
      html += `<div class="fc-bwrap"><img class="fc-av-xs" src="assets/avatars/${slug(tribe.puller)}.png" style="border:1px solid ${tc};" onerror="this.style.display='none'"></div>`;
      html += `<div class="fc-sbname">${tribe.puller}</div>`;
      html += `<span class="fc-floe-pill" style="background:rgba(251,191,36,.12);color:var(--fc-gold);font-size:7px;">PULLER</span>`;
      const pullerBg = pullerColdCls === 'w' ? 'linear-gradient(to top,#fb923c,#f97316)' : pullerColdCls === 'c' ? 'linear-gradient(to top,#7dd3fc,var(--fc-ice))' : 'linear-gradient(to top,#60a5fa,var(--fc-frozen))';
      html += `<div class="fc-thm"><div class="fc-thm-f" style="height:${pullerColdPct}%;background:${pullerBg};"></div></div>`;
      html += `<span class="fc-cval ${pullerColdCls}" style="font-size:8px;">${pullerCold.toFixed(1)}</span>`;
      html += `</div>`;

      // Passenger rows
      tribe.checkpoints.forEach((name, cpIdx) => {
        const cold = fc.coldMeter?.[name] ?? 8;
        const coldCls = cold > 5 ? 'w' : cold > 2 ? 'c' : 'f';
        const coldPct = clamp(cold / 10, 0, 1) * 100;
        const key = `${tIdx}-${cpIdx}`;
        const state = (cpState || {})[key];
        let statusPill = '';
        if (state === 'visited') {
          statusPill = `<span class="fc-floe-pill" style="background:rgba(74,222,128,.12);color:var(--fc-aurora-g);font-size:7px;">PICKED UP</span>`;
        } else if (state === 'left-behind') {
          statusPill = `<span class="fc-floe-pill" style="background:rgba(239,68,68,.12);color:var(--fc-danger);font-size:7px;">LEFT BEHIND</span>`;
        } else {
          statusPill = `<span class="fc-floe-pill" style="font-size:7px;">CP ${cpIdx + 1}</span>`;
        }
        const isFrozen = fc.frozenPlayers?.includes(name);
        const shiverCls = cold <= 4 && !isFrozen ? ' fc-av-shiver' : '';
        const frozenCls = isFrozen ? ' fc-av-frozen' : '';
        html += `<div class="fc-sbrow">`;
        html += `<div class="fc-bwrap"><img class="fc-av-xs${shiverCls}${frozenCls}" src="assets/avatars/${slug(name)}.png" style="border:1px solid ${tc};" onerror="this.style.display='none'">${cold <= 4 && !isFrozen ? '<div class="fc-vapor"></div>' : ''}</div>`;
        html += `<div class="fc-sbname"${isFrozen ? ' style="color:var(--fc-frozen);"' : ''}>${name}</div>`;
        html += statusPill;
        if (isFrozen) {
          html += `<div class="fc-thm"><div class="fc-thm-f" style="height:0%;"></div></div>`;
          html += `<span class="fc-cval f" style="font-size:8px;">0.0</span>`;
        } else {
          const thmBg = coldCls === 'w' ? 'linear-gradient(to top,#fb923c,#f97316)' : coldCls === 'c' ? 'linear-gradient(to top,#7dd3fc,var(--fc-ice))' : 'linear-gradient(to top,#60a5fa,var(--fc-frozen))';
          html += `<div class="fc-thm"><div class="fc-thm-f" style="height:${coldPct}%;background:${thmBg};${coldCls === 'f' ? 'animation:fc-fbar 1.5s infinite;' : ''}"></div></div>`;
          html += `<span class="fc-cval ${coldCls}" style="font-size:8px;">${cold.toFixed(1)}</span>`;
        }
        html += `</div>`;
      });
    });
  } else if (phase === 'results') {
    html += `<div class="fc-sbtitle">FINAL STANDINGS</div>`;
    fc.tribesSorted.forEach((tn, i) => {
      const tc = tribeColor(tn);
      const tribe = fc.tribes.find(t => t.name === tn);
      const medal = i === 0 ? '1ST' : i === fc.tribesSorted.length - 1 ? 'LAST' : `${i + 1}${i === 1 ? 'ND' : 'RD'}`;
      const medalColor = i === 0 ? 'var(--fc-gold)' : i === fc.tribesSorted.length - 1 ? 'var(--fc-danger)' : 'var(--fc-frost)';
      html += `<div class="fc-sb2-team">`;
      html += `<div class="fc-sb2-tname" style="color:${medalColor};">${medal}</div>`;
      html += `<div class="fc-sb2-sled" style="color:${tc};">${tn}</div>`;
      if (tribe?.hasBridgette) html += `<div style="font-size:7px;color:var(--fc-danger);letter-spacing:1px;">RULE</div>`;
      html += `</div>`;
    });
  }

  return html;
}

function _buildSidebar(ep, screenKey) {
  return `<div class="fc-sidebar" id="fc-sidebar"><div id="fc-sidebar-inner">${_buildSidebarContent(ep, screenKey)}</div></div>`;
}

// ── ATMOSPHERE GENERATOR ──
function _buildAtmosphere() {
  let html = '';

  // Stars (60)
  html += `<div class="fc-stars">`;
  for (let i = 0; i < 60; i++) {
    const left = ((i * 37 + 13) % 100);
    const top = ((i * 23 + 7) % 60);
    const dur = 3 + (i % 6);
    const delay = -((i * 0.8) % 6);
    const opacity = 0.1 + (i % 5) * 0.08;
    const sz = 1 + (i % 3);
    html += `<div class="fc-star" style="left:${left}%;top:${top}%;animation-duration:${dur}s;animation-delay:${delay}s;opacity:${opacity};width:${sz}px;height:${sz}px;"></div>`;
  }
  html += `</div>`;

  // Aurora (4 bands)
  html += `<div class="fc-aurora"><div class="fc-aband"></div><div class="fc-aband"></div><div class="fc-aband"></div><div class="fc-aband"></div></div>`;

  // Mountains (5 peaks + 2 caps)
  html += `<div class="fc-mtns">
    <div class="fc-mtn b1"></div><div class="fc-mtn b2"></div><div class="fc-mtn b3"></div><div class="fc-mtn b4"></div><div class="fc-mtn b5"></div>
    <div class="fc-cap c1"></div><div class="fc-cap c3"></div>
  </div>`;

  // Pine forest (35 trees)
  html += `<div class="fc-forest">`;
  for (let i = 0; i < 35; i++) {
    const left = i * 3 + (i * 7 % 3);
    const sc = 0.5 + (i * 11 % 8) * 0.1;
    html += `<div class="fc-pine" style="left:${left}%;transform:scale(${sc.toFixed(1)});"></div>`;
  }
  html += `</div>`;

  // Ground
  html += `<div class="fc-ground"></div>`;

  // Snow (55 particles)
  html += `<div class="fc-snow">`;
  for (let i = 0; i < 55; i++) {
    const left = ((i * 31 + 11) % 100);
    const sz = 2 + (i % 5);
    const dur = 4 + (i % 11);
    const delay = -((i * 0.9) % 12);
    const opacity = 0.12 + (i % 4) * 0.1;
    html += `<div class="fc-sf" style="left:${left}%;width:${sz}px;height:${sz}px;animation-duration:${dur}s;animation-delay:${delay}s;opacity:${opacity};"></div>`;
  }
  html += `</div>`;

  // Wind gusts (10)
  html += `<div class="fc-wg">`;
  for (let i = 0; i < 10; i++) {
    const top = 8 + (i * 9 % 84);
    const w = 80 + (i * 37 % 220);
    const dur = 3 + (i * 11 % 7);
    const delay = -((i * 1.3) % 8);
    html += `<div class="fc-gs" style="top:${top}%;width:${w}px;animation-duration:${dur}s;animation-delay:${delay}s;"></div>`;
  }
  html += `</div>`;

  // Frost edges
  html += `<div class="fc-fedge fc-fedge-t"></div><div class="fc-fedge fc-fedge-l"></div><div class="fc-fedge fc-fedge-r"></div>`;

  // Fog
  html += `<div class="fc-fog"></div>`;

  return html;
}

// ── SHELL WRAPPER ──
function _shell(content, ep, sidebarPhase = 'fc-phase1') {
  const fc = ep.frozenCrossing;
  if (!fc) return '';
  window._fcEpRecord = ep;
  const sidebar = _buildSidebar(ep, sidebarPhase);

  return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Chakra+Petch:wght@400;600;700&display=swap');

:root{--fc-ice:#a8d8ea;--fc-frost:#e8f4f8;--fc-deep:#08111e;--fc-deep2:#0f1d33;--fc-aurora-g:#4ade80;--fc-aurora-p:#a855f7;--fc-aurora-b:#38bdf8;--fc-aurora-t:#2dd4bf;--fc-danger:#ef4444;--fc-gold:#fbbf24;--fc-frozen:#93c5fd;--fc-radio:#22c55e;--fc-warm:#f97316;--fc-pink:#f472b6;--fc-teal:#2dd4bf;--fc-white:#f0f9ff;--fc-glass:rgba(168,216,234,0.04);--fc-gb:rgba(168,216,234,0.10);}

.fc-shell{max-width:1100px;margin:0 auto;padding:20px;position:relative;z-index:2;font-family:'Chakra Petch',sans-serif;color:var(--fc-frost);min-height:800px;display:flex;gap:16px;align-items:flex-start;}
.fc-shell *{box-sizing:border-box;}

/* ═══ ATMOSPHERE (position:absolute inside shell) ═══ */
.fc-atmosphere{position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:0;}

.fc-stars{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;}
.fc-star{position:absolute;width:2px;height:2px;background:white;border-radius:50%;animation:fc-twinkle 4s ease-in-out infinite;}
@keyframes fc-twinkle{0%,100%{opacity:.2;}50%{opacity:.8;}}

.fc-aurora{position:absolute;top:0;left:0;right:0;height:500px;pointer-events:none;overflow:hidden;}
.fc-aband{position:absolute;width:300%;height:120px;border-radius:50%;filter:blur(60px);}
.fc-aband:nth-child(1){background:linear-gradient(90deg,transparent 5%,var(--fc-aurora-g) 25%,var(--fc-aurora-b) 50%,var(--fc-aurora-t) 75%,transparent 95%);top:10px;left:-40%;opacity:.2;animation:fc-au 18s ease-in-out infinite alternate;}
.fc-aband:nth-child(2){background:linear-gradient(90deg,transparent 10%,var(--fc-aurora-p) 35%,var(--fc-aurora-g) 65%,transparent 90%);top:80px;left:-60%;opacity:.15;animation:fc-au 24s ease-in-out infinite alternate-reverse;}
.fc-aband:nth-child(3){background:linear-gradient(90deg,transparent,var(--fc-aurora-b),var(--fc-aurora-t),transparent);top:140px;left:-20%;opacity:.1;animation:fc-au 14s ease-in-out infinite alternate;}
.fc-aband:nth-child(4){background:linear-gradient(90deg,transparent,rgba(74,222,128,.3),rgba(56,189,248,.2),transparent);top:40px;left:-30%;opacity:.12;animation:fc-au 20s ease-in-out 3s infinite alternate;}
@keyframes fc-au{0%{transform:translateX(-10%) scaleY(.7) rotate(-1deg);}50%{transform:translateX(12%) scaleY(2) rotate(1.5deg);}100%{transform:translateX(-8%) scaleY(1) rotate(-.5deg);}}

.fc-mtns{position:absolute;bottom:0;left:0;right:0;height:400px;pointer-events:none;}
.fc-mtn{position:absolute;bottom:0;}
.fc-mtn.b1{left:-5%;width:0;height:0;border-style:solid;border-width:0 200px 300px 180px;border-color:transparent transparent rgba(12,20,38,.8) transparent;}
.fc-mtn.b2{left:20%;width:0;height:0;border-style:solid;border-width:0 160px 240px 140px;border-color:transparent transparent rgba(14,24,42,.7) transparent;}
.fc-mtn.b3{left:45%;width:0;height:0;border-style:solid;border-width:0 220px 350px 190px;border-color:transparent transparent rgba(10,18,34,.85) transparent;}
.fc-mtn.b4{left:70%;width:0;height:0;border-style:solid;border-width:0 170px 260px 150px;border-color:transparent transparent rgba(13,22,40,.75) transparent;}
.fc-mtn.b5{left:88%;width:0;height:0;border-style:solid;border-width:0 140px 210px 120px;border-color:transparent transparent rgba(11,19,36,.7) transparent;}
.fc-cap{position:absolute;bottom:0;}
.fc-cap.c1{left:calc(-5% + 100px);width:0;height:0;border-style:solid;border-width:0 80px 100px 60px;border-color:transparent transparent rgba(168,216,234,.08) transparent;bottom:200px;}
.fc-cap.c3{left:calc(45% + 90px);width:0;height:0;border-style:solid;border-width:0 100px 120px 80px;border-color:transparent transparent rgba(168,216,234,.1) transparent;bottom:230px;}

.fc-forest{position:absolute;bottom:0;left:0;right:0;height:100px;pointer-events:none;}
.fc-pine{position:absolute;bottom:0;}
.fc-pine::before{content:'';display:block;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:20px solid rgba(74,222,128,.06);}
.fc-pine::after{content:'';display:block;width:3px;height:6px;background:rgba(90,62,40,.1);margin:0 auto;}

.fc-ground{position:absolute;bottom:0;left:0;right:0;height:60px;pointer-events:none;background:linear-gradient(to top,rgba(168,216,234,.04),transparent);}

.fc-snow{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;overflow:hidden;}
.fc-sf{position:absolute;background:white;border-radius:50%;box-shadow:0 0 3px rgba(255,255,255,.3);animation:fc-fall linear infinite;}
@keyframes fc-fall{0%{transform:translateY(-20px) translateX(0);opacity:0;}5%{opacity:.7;}50%{transform:translateY(50vh) translateX(50px);}100%{transform:translateY(105vh) translateX(20px);opacity:0;}}

.fc-wg{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;overflow:hidden;}
.fc-gs{position:absolute;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);animation:fc-gust linear infinite;}
@keyframes fc-gust{0%{transform:translateX(-100%);opacity:0;}15%{opacity:1;}85%{opacity:.5;}100%{transform:translateX(120vw);opacity:0;}}

.fc-fedge{position:absolute;pointer-events:none;}
.fc-fedge-t{top:0;left:0;right:0;height:100px;background:linear-gradient(to bottom,rgba(168,216,234,.1),transparent);}
.fc-fedge-l{top:0;bottom:0;left:0;width:50px;background:linear-gradient(to right,rgba(168,216,234,.06),transparent);}
.fc-fedge-r{top:0;bottom:0;right:0;width:50px;background:linear-gradient(to left,rgba(168,216,234,.06),transparent);}

.fc-fog{position:absolute;bottom:0;left:0;right:0;height:250px;pointer-events:none;background:linear-gradient(to top,rgba(8,17,30,.95),transparent);}

/* ═══ CARDS ═══ */
.fc-card{background:linear-gradient(135deg,rgba(168,216,234,.05),rgba(56,189,248,.02));border:1px solid rgba(168,216,234,.10);border-radius:10px;padding:18px 22px;margin:14px 0;position:relative;overflow:hidden;animation:fc-slide .7s cubic-bezier(.16,1,.3,1) forwards;}
.fc-card::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 10%,rgba(168,216,234,.35) 50%,transparent 90%);animation:fc-shim 4s ease-in-out infinite;}
@keyframes fc-shim{0%,100%{opacity:.3;}50%{opacity:1;}}
@keyframes fc-slide{from{transform:translateX(-25px) skewX(-.5deg);opacity:0;filter:blur(2px);}to{transform:none;opacity:1;filter:none;}}
.fc-card[data-tribe]{border-left:3px solid var(--fc-ice);}
.fc-card-danger{border-color:rgba(239,68,68,.25)!important;background:linear-gradient(135deg,rgba(239,68,68,.06),rgba(168,216,234,.02))!important;}

.fc-hdr{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.fc-title{font-family:'Black Ops One',cursive;font-size:13px;color:var(--fc-frost);letter-spacing:1px;}
.fc-txt{font-size:12.5px;line-height:1.65;color:rgba(240,249,255,.7);}
.fc-txt strong{color:var(--fc-ice);}
.fc-badge{margin-left:auto;padding:3px 10px;border-radius:10px;font-size:9px;font-weight:700;letter-spacing:1px;white-space:nowrap;}
.fc-bs{background:rgba(74,222,128,.08);color:var(--fc-aurora-g);border:1px solid rgba(74,222,128,.2);}
.fc-bd{background:rgba(239,68,68,.08);color:var(--fc-danger);border:1px solid rgba(239,68,68,.2);}
.fc-bc{background:rgba(147,197,253,.08);color:var(--fc-frozen);border:1px solid rgba(147,197,253,.2);}
.fc-bw{background:rgba(249,115,22,.08);color:var(--fc-warm);border:1px solid rgba(249,115,22,.2);}
.fc-bp{background:rgba(244,114,182,.08);color:var(--fc-pink);border:1px solid rgba(244,114,182,.2);}
.fc-bh{background:rgba(251,191,36,.08);color:var(--fc-gold);border:1px solid rgba(251,191,36,.2);}

/* Avatars */
.fc-av{width:36px;height:36px;border-radius:50%;border:2px solid var(--fc-ice);object-fit:cover;}
.fc-av-lg{width:48px;height:48px;}
.fc-av-sm{width:26px;height:26px;}
.fc-av-xs{width:20px;height:20px;}
.fc-av-frozen{filter:brightness(1.4) saturate(.2);box-shadow:0 0 12px rgba(147,197,253,.5);animation:fc-fpulse 2s ease-in-out infinite;}
@keyframes fc-fpulse{0%,100%{box-shadow:0 0 12px rgba(147,197,253,.5);}50%{box-shadow:0 0 22px rgba(147,197,253,.8),0 0 44px rgba(147,197,253,.2);}}
.fc-av-shiver{animation:fc-shiv .25s ease-in-out infinite;}
@keyframes fc-shiv{0%,100%{transform:translateX(0);}25%{transform:translateX(-1px) rotate(-.4deg);}75%{transform:translateX(1px) rotate(.4deg);}}

/* Breath vapor */
.fc-bwrap{position:relative;display:inline-block;}
.fc-vapor{position:absolute;top:-4px;left:50%;width:14px;height:10px;pointer-events:none;}
.fc-vapor::before,.fc-vapor::after{content:'';position:absolute;border-radius:50%;background:radial-gradient(ellipse,rgba(200,230,255,.2),transparent 70%);}
.fc-vapor::before{width:10px;height:7px;left:-2px;animation:fc-puff 3s ease-out infinite;}
.fc-vapor::after{width:7px;height:5px;left:5px;top:2px;animation:fc-puff 3s ease-out 1.2s infinite;}
@keyframes fc-puff{0%{transform:translateY(0) scale(.3);opacity:.5;}100%{transform:translateY(-16px) scale(1.6) translateX(6px);opacity:0;}}

/* Cold bar */
.fc-cold{display:flex;align-items:center;gap:8px;margin:6px 0;}
.fc-ctrack{flex:1;height:6px;background:rgba(168,216,234,.06);border-radius:3px;overflow:hidden;}
.fc-cfill{height:100%;border-radius:3px;transition:width 1s cubic-bezier(.34,1.56,.64,1);}
.fc-cfill.w{background:linear-gradient(90deg,#fb923c,#f97316);box-shadow:0 0 6px rgba(249,115,22,.3);}
.fc-cfill.c{background:linear-gradient(90deg,#7dd3fc,var(--fc-ice));box-shadow:0 0 6px rgba(168,216,234,.3);}
.fc-cfill.f{background:linear-gradient(90deg,#60a5fa,var(--fc-frozen));box-shadow:0 0 8px rgba(147,197,253,.5);animation:fc-fbar 1.5s ease-in-out infinite;}
@keyframes fc-fbar{0%,100%{opacity:1;}50%{opacity:.5;}}
.fc-cval{font-size:11px;font-weight:700;min-width:24px;text-align:right;font-family:'Black Ops One',cursive;}
.fc-cval.w{color:var(--fc-warm);}
.fc-cval.c{color:var(--fc-ice);}
.fc-cval.f{color:var(--fc-frozen);text-shadow:0 0 6px rgba(147,197,253,.4);}
.fc-cdelta{font-size:10px;font-weight:700;color:var(--fc-danger);animation:fc-dflash .5s ease;}
@keyframes fc-dflash{0%{transform:scale(1.5);color:white;}100%{transform:scale(1);}}

/* ═══ CSS ICONS ═══ */
.fc-isnow{width:20px;height:20px;position:relative;filter:drop-shadow(0 0 3px rgba(168,216,234,.4));}
.fc-isnow .a{position:absolute;top:50%;left:50%;width:2px;height:16px;background:var(--fc-ice);border-radius:1px;}
.fc-isnow .a:nth-child(1){transform:translate(-50%,-50%) rotate(0);}
.fc-isnow .a:nth-child(2){transform:translate(-50%,-50%) rotate(60deg);}
.fc-isnow .a:nth-child(3){transform:translate(-50%,-50%) rotate(-60deg);}
.fc-isnow .d{position:absolute;top:50%;left:50%;width:5px;height:5px;background:var(--fc-frost);border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 4px rgba(232,244,248,.5);}

.fc-ibear-lg{width:60px;height:55px;position:relative;filter:drop-shadow(0 2px 8px rgba(0,0,0,.5));}
.fc-ibear-lg .bhead{width:44px;height:38px;background:radial-gradient(ellipse at 50% 40%,#fff,#ddd);border-radius:50%;position:absolute;bottom:0;left:8px;}
.fc-ibear-lg .bear{width:16px;height:14px;background:radial-gradient(circle,#ccc,#e0e0e0);border-radius:50%;position:absolute;top:0;}
.fc-ibear-lg .bear-l{left:6px;}
.fc-ibear-lg .bear-r{right:6px;}
.fc-ibear-lg .beye{width:6px;height:7px;background:#1a1a1a;border-radius:50%;position:absolute;top:14px;}
.fc-ibear-lg .beye-l{left:14px;transform:rotate(10deg);}
.fc-ibear-lg .beye-r{right:14px;transform:rotate(-10deg);}
.fc-ibear-lg .beye::after{content:'';position:absolute;width:2px;height:2px;background:var(--fc-danger);border-radius:50%;top:1px;left:2px;box-shadow:0 0 4px var(--fc-danger);}
.fc-ibear-lg .bnose{width:10px;height:7px;background:#1a1a1a;border-radius:50%;position:absolute;bottom:8px;left:50%;transform:translateX(-50%);}
.fc-ibear-lg .bteeth{position:absolute;bottom:2px;left:50%;transform:translateX(-50%);display:flex;gap:2px;}
.fc-ibear-lg .btooth{width:3px;height:5px;background:white;border-radius:0 0 2px 2px;border:1px solid #ccc;}
.fc-ibear-lg .bfrost{position:absolute;width:8px;height:8px;background:radial-gradient(circle,rgba(168,216,234,.3),transparent);border-radius:50%;}
.fc-ibear-lg .bfrost:nth-child(7){top:6px;left:0;}
.fc-ibear-lg .bfrost:nth-child(8){top:20px;right:0;}

.fc-ifloe{width:30px;height:16px;position:relative;}
.fc-ifloe .fb{width:100%;height:11px;background:linear-gradient(180deg,#d4eef8,#a8d8ea 40%,#7ec8e3);clip-path:polygon(10% 0,92% 0,100% 35%,95% 100%,8% 100%,0 60%);}
.fc-ifloe .fs{width:85%;height:4px;background:rgba(56,189,248,.15);border-radius:50%;position:absolute;bottom:-1px;left:8%;filter:blur(2px);}
.fc-ifloe.crk .fb{background:linear-gradient(180deg,#c0dde8,#90c8dd 40%,#6bb5d4);}
.fc-ifloe .fcrk{position:absolute;top:2px;left:42%;width:1px;height:7px;background:rgba(0,0,0,.15);transform:rotate(18deg);}

.fc-isled{width:34px;height:18px;position:relative;}
.fc-isled .sb{width:24px;height:10px;border-radius:3px 9px 2px 2px;position:absolute;top:2px;left:5px;}
.fc-isled .sr{width:30px;height:3px;border-radius:0 0 5px 2px;position:absolute;bottom:0;left:2px;border-bottom:2px solid;border-right:2px solid;}
.fc-isled.comp .sb{background:linear-gradient(135deg,#c8c8cc,#e4e4e7,#a8a8af);}
.fc-isled.comp .sr{border-color:#a0a0a5;}
.fc-isled.wood .sb{background:linear-gradient(135deg,#8a6010,#b8860b,#7a5209);}
.fc-isled.wood .sr{border-color:#6b4c0a;}
.fc-isled.rad .sb{background:linear-gradient(135deg,#5a4a0a,#8B6914);animation:fc-radglo 2s ease-in-out infinite;}
.fc-isled.rad .sr{border-color:#6b4c0a;}
.fc-isled.rad::after{content:'';position:absolute;top:-2px;left:10px;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle,rgba(34,197,94,.35),transparent 70%);animation:fc-radglo 2s ease-in-out infinite;}
@keyframes fc-radglo{0%,100%{opacity:.3;}50%{opacity:1;}}

.fc-iheart{width:16px;height:14px;position:relative;filter:drop-shadow(0 0 4px rgba(244,114,182,.4));}
.fc-iheart::before,.fc-iheart::after{content:'';position:absolute;width:8px;height:12px;background:var(--fc-pink);border-radius:8px 8px 0 0;}
.fc-iheart::before{left:0;top:0;transform:rotate(-45deg);transform-origin:bottom right;}
.fc-iheart::after{right:0;top:0;transform:rotate(45deg);transform-origin:bottom left;}

.fc-ibridge{width:28px;height:18px;position:relative;}
.fc-ibridge .ba{width:24px;height:12px;border:2px solid var(--fc-ice);border-bottom:none;border-radius:12px 12px 0 0;position:absolute;top:3px;left:2px;}
.fc-ibridge .bp{width:3px;height:8px;background:var(--fc-ice);position:absolute;bottom:0;border-radius:0 0 1px 1px;}
.fc-ibridge .bp-l{left:4px;}
.fc-ibridge .bp-r{right:4px;}

.fc-istuck{width:16px;height:24px;position:relative;}
.fc-istuck .sp{width:3px;height:24px;background:linear-gradient(180deg,#999,#bbb,#999);border-radius:1px;position:absolute;left:50%;transform:translateX(-50%);box-shadow:0 0 5px rgba(168,216,234,.3);}
.fc-istuck .sfr{position:absolute;top:4px;left:50%;transform:translateX(-50%);width:10px;height:10px;background:radial-gradient(circle,rgba(168,216,234,.25),transparent 70%);border-radius:50%;}
.fc-istuck .st{width:7px;height:4px;background:var(--fc-danger);border-radius:0 0 3px 3px;position:absolute;top:8px;left:50%;transform:translateX(-50%);}

.fc-iwind{width:20px;height:12px;position:relative;}
.fc-iwind .wl{height:2px;background:linear-gradient(90deg,transparent,var(--fc-ice),transparent);border-radius:1px;position:absolute;}
.fc-iwind .wl:nth-child(1){width:16px;top:1px;left:2px;}
.fc-iwind .wl:nth-child(2){width:12px;top:5px;left:5px;}
.fc-iwind .wl:nth-child(3){width:18px;top:9px;left:0;}

/* ═══ SECTION HEADERS ═══ */
.fc-sec{text-align:center;padding:48px 0 24px;}
.fc-sec h2{font-family:'Black Ops One',cursive;font-size:30px;color:var(--fc-frost);text-shadow:0 0 30px rgba(147,197,253,.3);letter-spacing:4px;}
.fc-sec .sub{font-size:11px;color:var(--fc-ice);letter-spacing:5px;text-transform:uppercase;opacity:.4;margin-top:6px;}

.fc-flavor{text-align:center;padding:10px 20px;font-size:11px;color:var(--fc-ice);opacity:.22;font-style:italic;letter-spacing:1px;}
.fc-divider{display:flex;align-items:center;gap:16px;margin:36px 0;}
.fc-divider::before,.fc-divider::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(168,216,234,.12),transparent);}
.fc-divider span{font-size:9px;color:var(--fc-ice);letter-spacing:4px;opacity:.25;text-transform:uppercase;white-space:nowrap;}

/* ═══ TITLE CARD ═══ */
.fc-titlecard{text-align:center;padding:90px 20px 60px;position:relative;}
.fc-titlecard h1{font-family:'Black Ops One',cursive;font-size:52px;color:var(--fc-frost);text-shadow:0 0 60px rgba(147,197,253,.4),0 0 120px rgba(56,189,248,.12),0 4px 20px rgba(0,0,0,.5);letter-spacing:6px;animation:fc-tbreathe 6s ease-in-out infinite;}
@keyframes fc-tbreathe{0%,100%{text-shadow:0 0 60px rgba(147,197,253,.4),0 4px 20px rgba(0,0,0,.5);}50%{text-shadow:0 0 90px rgba(147,197,253,.6),0 0 160px rgba(56,189,248,.2),0 4px 20px rgba(0,0,0,.5);}}
.fc-tsub{font-size:14px;color:var(--fc-ice);letter-spacing:8px;text-transform:uppercase;opacity:.45;}
.fc-ttag{display:inline-block;margin-top:24px;padding:6px 24px;border:1px solid rgba(168,216,234,.12);border-radius:20px;background:rgba(168,216,234,.03);font-size:11px;color:var(--fc-ice);letter-spacing:3px;}
.fc-tcrack{display:block;margin:24px auto;width:250px;height:2px;background:linear-gradient(90deg,transparent,rgba(168,216,234,.3),rgba(232,244,248,.5),rgba(168,216,234,.3),transparent);position:relative;}
.fc-tcrack::before{content:'';position:absolute;width:35px;height:1px;background:rgba(168,216,234,.25);top:-7px;left:65px;transform:rotate(22deg);}
.fc-tcrack::after{content:'';position:absolute;width:28px;height:1px;background:rgba(168,216,234,.2);top:5px;right:55px;transform:rotate(-12deg);}
.fc-ticons{display:flex;gap:30px;justify-content:center;margin-top:20px;flex-wrap:wrap;}
.fc-ticons>div{text-align:center;opacity:.5;}
.fc-ticons .lbl{font-size:8px;color:var(--fc-ice);letter-spacing:2px;margin-top:6px;}

/* ═══ SIDEBAR ═══ */
.fc-sidebar{position:sticky;top:80px;flex-shrink:0;width:215px;background:linear-gradient(180deg,rgba(168,216,234,.06),rgba(8,17,30,.92));border:1px solid var(--fc-gb);border-radius:12px;padding:14px;backdrop-filter:blur(16px);z-index:20;box-shadow:0 4px 30px rgba(0,0,0,.5);max-height:calc(100vh - 100px);overflow-y:auto;order:2;}
.fc-sbtitle{font-family:'Black Ops One',cursive;font-size:10px;color:var(--fc-ice);letter-spacing:3px;text-align:center;margin-bottom:10px;text-transform:uppercase;opacity:.5;}
.fc-sbrow{display:flex;align-items:center;gap:5px;padding:4px 0;border-bottom:1px solid rgba(168,216,234,.04);}
.fc-sbrow:last-child{border-bottom:none;}
.fc-sbname{font-size:10px;font-weight:600;color:var(--fc-frost);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.fc-thm{width:5px;height:20px;background:rgba(168,216,234,.06);border-radius:3px;overflow:hidden;position:relative;}
.fc-thm-f{position:absolute;bottom:0;left:0;right:0;border-radius:3px;transition:height .8s;}
.fc-floe-pill{font-size:8px;font-weight:700;padding:1px 5px;border-radius:6px;letter-spacing:1px;background:rgba(168,216,234,.08);color:var(--fc-ice);white-space:nowrap;}
.fc-floe-pill.done{background:rgba(74,222,128,.1);color:var(--fc-aurora-g);}

.fc-sb2-team{display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid rgba(168,216,234,.04);}
.fc-sb2-team:last-child{border-bottom:none;}
.fc-sb2-tname{font-size:10px;font-weight:700;font-family:'Black Ops One',cursive;min-width:24px;}
.fc-sb2-sled{font-size:8px;letter-spacing:1px;flex:1;}
.fc-sb2-pass{font-size:9px;font-weight:700;font-family:'Black Ops One',cursive;}

/* ═══ POLAR BEAR ATTACK ═══ */
.fc-bear-attack{background:linear-gradient(135deg,rgba(239,68,68,.1),rgba(8,17,30,.95) 60%);border:2px solid rgba(239,68,68,.35);border-radius:12px;padding:24px;margin:16px 0;position:relative;overflow:hidden;animation:fc-shake .6s ease-in-out;}
@keyframes fc-shake{0%,100%{transform:translateX(0) rotate(0);}10%{transform:translateX(-5px) rotate(-.5deg);}20%{transform:translateX(5px) rotate(.5deg);}30%{transform:translateX(-4px) rotate(-.3deg);}40%{transform:translateX(4px) rotate(.3deg);}50%{transform:translateX(-2px);}}
.fc-bear-attack .claw{position:absolute;width:3px;border-radius:2px;background:linear-gradient(180deg,transparent,rgba(239,68,68,.3),transparent);transform:rotate(-25deg);}
.fc-bear-attack .claw:nth-child(1){height:80px;top:10%;left:8%;}
.fc-bear-attack .claw:nth-child(2){height:70px;top:15%;left:12%;}
.fc-bear-attack .claw:nth-child(3){height:90px;top:5%;left:16%;}
.fc-bear-attack .claw-r{position:absolute;width:3px;border-radius:2px;background:linear-gradient(180deg,transparent,rgba(239,68,68,.2),transparent);transform:rotate(20deg);}
.fc-bear-attack .claw-r:nth-child(4){height:60px;top:20%;right:10%;}
.fc-bear-attack .claw-r:nth-child(5){height:75px;top:12%;right:14%;}
.fc-bear-attack::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at 50% 50%,rgba(239,68,68,.08),transparent 60%);animation:fc-dpulse 2s ease-in-out infinite;}
@keyframes fc-dpulse{0%,100%{opacity:.3;}50%{opacity:1;}}
.fc-bear-attack::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at 80% 20%,rgba(147,197,253,.06),transparent 40%),radial-gradient(circle at 20% 80%,rgba(147,197,253,.04),transparent 40%);pointer-events:none;}

/* ═══ HERO SAVE ═══ */
.fc-hero{background:linear-gradient(135deg,rgba(251,191,36,.08),rgba(251,191,36,.02));border:2px solid var(--fc-gold);border-radius:12px;padding:32px;margin:16px 0;text-align:center;position:relative;overflow:hidden;box-shadow:0 0 40px rgba(251,191,36,.06);}
.fc-hero::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(ellipse at center,rgba(251,191,36,.08),transparent 45%);animation:fc-hpulse 4s ease-in-out infinite;}
@keyframes fc-hpulse{0%,100%{opacity:.3;transform:scale(1);}50%{opacity:1;transform:scale(1.1);}}
.fc-hero-title{font-family:'Black Ops One',cursive;font-size:24px;color:var(--fc-gold);text-shadow:0 0 30px rgba(251,191,36,.5);letter-spacing:4px;position:relative;z-index:2;}

/* ═══ BRIDGE COLLAPSE ═══ */
.fc-bridge-card{background:linear-gradient(135deg,rgba(239,68,68,.08),rgba(168,216,234,.02));border:2px solid rgba(239,68,68,.35);border-radius:12px;padding:28px;margin:16px 0;position:relative;overflow:hidden;animation:fc-shake .6s ease-in-out;}
.fc-crack{position:absolute;height:1px;background:linear-gradient(90deg,transparent,var(--fc-frost),transparent);opacity:.15;pointer-events:none;}

/* ═══ STUCK ═══ */
.fc-stuck{background:linear-gradient(135deg,rgba(147,197,253,.07),rgba(147,197,253,.02));border:2px dashed rgba(147,197,253,.35);border-radius:12px;padding:24px;margin:16px 0;position:relative;overflow:hidden;animation:fc-fflash .4s;}
@keyframes fc-fflash{0%{background-color:rgba(147,197,253,.2);}100%{background-color:transparent;}}
.fc-decision{padding:10px 20px;border:1px solid;border-radius:8px;text-align:center;min-width:120px;}
.fc-decision-chosen{box-shadow:0 0 15px rgba(239,68,68,.2);border-color:var(--fc-danger)!important;}

/* ═══ ROMANCE ═══ */
.fc-romance{background:linear-gradient(135deg,rgba(244,114,182,.06),rgba(168,85,247,.04));border:1px solid rgba(244,114,182,.2);border-radius:12px;padding:24px;margin:16px 0;position:relative;overflow:hidden;}

/* ═══ SLED PANELS ═══ */
.fc-sled-reveal{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin:20px 0;}
.fc-sled-panel{background:linear-gradient(135deg,rgba(168,216,234,.04),rgba(56,189,248,.02));border:1px solid var(--fc-gb);border-radius:12px;padding:24px;text-align:center;width:210px;position:relative;overflow:hidden;}
.fc-sled-panel.first{border-color:rgba(192,192,192,.25);}
.fc-sled-panel.last{border-color:rgba(34,197,94,.2);box-shadow:0 0 24px rgba(34,197,94,.06);}

/* ═══ RESULTS ═══ */
.fc-results{text-align:center;padding:50px 20px;}
.fc-results-title{font-family:'Black Ops One',cursive;font-size:36px;color:var(--fc-frost);text-shadow:0 0 40px rgba(147,197,253,.4);letter-spacing:6px;}
.fc-results-sub{font-size:12px;color:var(--fc-ice);letter-spacing:5px;opacity:.35;margin-top:4px;margin-bottom:30px;}
.fc-rteam{background:linear-gradient(135deg,rgba(168,216,234,.04),rgba(56,189,248,.02));border:1px solid var(--fc-gb);border-radius:12px;padding:18px 22px;margin:12px auto;max-width:520px;display:flex;align-items:center;gap:16px;position:relative;}
.fc-rteam.winner{border-color:rgba(251,191,36,.25);box-shadow:0 0 25px rgba(251,191,36,.05);}
.fc-rteam.loser{border-color:rgba(239,68,68,.25);}

/* ═══ CONTROLS ═══ */
.fc-controls{position:fixed;bottom:0;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:16px;padding:14px 28px;background:rgba(8,17,30,.95);border:1px solid var(--fc-gb);border-bottom:none;border-radius:12px 12px 0 0;backdrop-filter:blur(16px);z-index:30;box-shadow:0 -4px 30px rgba(0,0,0,.5);}
.fc-btn{padding:8px 22px;border-radius:6px;border:1px solid rgba(168,216,234,.25);background:transparent;color:var(--fc-ice);font-family:'Chakra Petch',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;cursor:pointer;transition:all .25s;}
.fc-btn:hover{background:rgba(168,216,234,.06);border-color:var(--fc-ice);}
.fc-btn-p{background:linear-gradient(135deg,rgba(168,216,234,.15),rgba(56,189,248,.1));color:var(--fc-frost);border-color:rgba(168,216,234,.3);}
.fc-counter{font-size:11px;color:var(--fc-ice);opacity:.35;letter-spacing:3px;font-family:'Black Ops One',cursive;}

/* ═══ STEP VISIBILITY ═══ */
.fc-hidden{display:none;}
.fc-visible{display:block!important;}

/* ═══ MAP ═══ */
.fc-map{background:linear-gradient(135deg,rgba(18,34,64,.6),rgba(10,22,40,.8));border:2px solid rgba(168,216,234,.12);border-radius:16px;padding:24px;margin:20px 0;position:relative;overflow:hidden;min-height:280px;}
.fc-map::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at 30% 20%,rgba(168,216,234,.04),transparent 50%),radial-gradient(ellipse at 70% 80%,rgba(56,189,248,.03),transparent 50%);pointer-events:none;}
.fc-map-title{font-family:'Black Ops One',cursive;font-size:12px;color:var(--fc-ice);letter-spacing:4px;text-align:center;margin-bottom:16px;opacity:.5;text-transform:uppercase;}
.fc-map svg{width:100%;height:200px;position:relative;z-index:2;}
.fc-map-route{fill:none;stroke:rgba(168,216,234,.15);stroke-width:4;stroke-linecap:round;stroke-dasharray:8 4;}
.fc-map-route-glow{fill:none;stroke:rgba(168,216,234,.06);stroke-width:12;stroke-linecap:round;filter:blur(4px);}
.fc-mm{width:0;height:0;border-style:solid;position:absolute;}
.fc-mm.s{border-width:0 12px 18px 10px;border-color:transparent transparent rgba(168,216,234,.08) transparent;}
.fc-mm.m{border-width:0 18px 28px 15px;border-color:transparent transparent rgba(168,216,234,.06) transparent;}
.fc-mt{position:absolute;}
.fc-mt::before{content:'';display:block;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:12px solid rgba(74,222,128,.06);}
.fc-mriver{position:absolute;height:3px;background:linear-gradient(90deg,transparent,rgba(56,189,248,.1),rgba(168,216,234,.08),transparent);border-radius:2px;transform:rotate(-5deg);}
.fc-mapcp{position:absolute;z-index:5;text-align:center;}
.fc-mapcp-node{width:28px;height:28px;border-radius:50%;border:2px solid rgba(168,216,234,.2);background:rgba(168,216,234,.05);display:flex;align-items:center;justify-content:center;position:relative;margin:0 auto;}
.fc-mapcp-node img{width:20px;height:20px;border-radius:50%;border:1px solid rgba(168,216,234,.3);}
.fc-mapcp.visited .fc-mapcp-node{border-color:var(--fc-aurora-g);background:rgba(74,222,128,.08);box-shadow:0 0 8px rgba(74,222,128,.2);}
.fc-mapcp.left-behind .fc-mapcp-node{border-color:var(--fc-danger);background:rgba(239,68,68,.08);box-shadow:0 0 8px rgba(239,68,68,.2);}
.fc-mapcp.unvisited .fc-mapcp-node{opacity:.35;}
.fc-mapcp-mark{position:absolute;top:-6px;right:-6px;width:14px;height:14px;border-radius:50%;font-size:8px;font-weight:700;display:flex;align-items:center;justify-content:center;line-height:1;}
.fc-mapcp.visited .fc-mapcp-mark{background:var(--fc-aurora-g);color:#000;}
.fc-mapcp.left-behind .fc-mapcp-mark{background:var(--fc-danger);color:white;}
.fc-mapcp.unvisited .fc-mapcp-mark{background:rgba(168,216,234,.15);color:var(--fc-ice);}
.fc-mapcp-label{font-size:7px;color:var(--fc-ice);letter-spacing:1px;margin-top:3px;opacity:.5;}
.fc-mapsled{position:absolute;z-index:6;transition:all 2s cubic-bezier(.25,.46,.45,.94);}
.fc-mapsled-dot{width:24px;height:24px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;font-family:'Black Ops One',cursive;box-shadow:0 2px 10px rgba(0,0,0,.5);}
.fc-maplm{position:absolute;z-index:3;text-align:center;}
.fc-maplm-label{font-size:7px;color:var(--fc-ice);letter-spacing:2px;opacity:.3;margin-top:2px;text-transform:uppercase;}
.fc-map-sticky{position:sticky;top:70px;z-index:10;margin-bottom:16px;}
.fc-tribe-banner{display:flex;align-items:center;gap:12px;padding:8px 16px;border:1px solid;border-radius:8px;margin:18px 0 6px;position:relative;overflow:hidden;}
.fc-tribe-banner-bar{position:absolute;left:0;top:0;bottom:0;width:4px;}
.fc-tribe-banner-content{flex:1;display:flex;align-items:baseline;gap:10px;}
.fc-tribe-banner-name{font-family:'Black Ops One',cursive;font-size:14px;letter-spacing:3px;}
.fc-tribe-banner-info{font-size:9px;color:var(--fc-ice);opacity:.5;letter-spacing:2px;}

@media(max-width:900px){.fc-sidebar{display:none;}.fc-shell{display:block;}}
@media(prefers-reduced-motion:reduce){.fc-aband,.fc-sf,.fc-gs,.fc-cfill.f,.fc-hero::before,.fc-titlecard h1,.fc-av-frozen,.fc-av-shiver,.fc-bear-attack::before,.fc-isled.rad .sb,.fc-isled.rad::after,.fc-card,.fc-bear-attack,.fc-bridge-card,.fc-stuck{animation:none!important;}.fc-star{animation:none!important;}}
</style>

<div class="fc-shell" data-phase="${sidebarPhase}">
  <div class="fc-atmosphere">
    ${_buildAtmosphere()}
  </div>
  <div style="position:relative;z-index:2;flex:1;min-width:0;order:1;">
    ${content}
  </div>
  ${sidebar}
</div>
<div style="height:80px;"></div>`;
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN BUILDERS
// ══════════════════════════════════════════════════════════════

export function rpBuildFCTitleCard(ep) {
  const fc = ep.frozenCrossing;
  if (!fc) return '';

  const epNum = (window.vpEpNum || gs.episodeHistory?.length || 1);

  // Build player grid showing everyone freezing in snow
  const allPlayers = fc.tribes.flatMap(t => t.members);
  const playerGrid = allPlayers.map(name => {
    const tc = _playerTribeColor(name);
    const cold = fc.coldMeter?.[name] ?? 8;
    const isFrozen = fc.frozenPlayers.includes(name);
    const shiverCls = cold <= 6 ? ' fc-av-shiver' : '';
    const frozenCls = isFrozen ? ' fc-av-frozen' : '';
    return `<div style="text-align:center;margin:4px;">
      <div class="fc-bwrap"><img class="fc-av${shiverCls}${frozenCls}" src="assets/avatars/${slug(name)}.png" style="border-color:${tc};" onerror="this.style.display='none'"><div class="fc-vapor"></div></div>
      <div style="font-size:8px;color:var(--fc-ice);margin-top:4px;letter-spacing:1px;opacity:.6;">${name}</div>
    </div>`;
  }).join('');

  const content = `
    <div class="fc-titlecard">
      <div class="fc-ttag">EPISODE ${epNum} — TRIBE CHALLENGE</div>
      <h1 style="margin-top:24px;">FROZEN CROSSING</h1>
      <div class="fc-tsub">Survive the Ice. Endure the Cold.</div>
      <div class="fc-tcrack"></div>
      <div class="fc-ticons">
        <div><div class="fc-ifloe" style="margin:0 auto;"><div class="fb"></div><div class="fs"></div></div><div class="lbl">ICE FLOES</div></div>
        <div><div style="width:30px;height:28px;margin:0 auto;overflow:hidden;"><div class="fc-ibear-lg" style="transform:scale(.5);transform-origin:top left;"><div class="bear bear-l"></div><div class="bear bear-r"></div><div class="bhead"><div class="beye beye-l"></div><div class="beye beye-r"></div><div class="bnose"></div><div class="bteeth"><div class="btooth"></div><div class="btooth"></div><div class="btooth"></div></div></div></div></div><div class="lbl">POLAR BEARS</div></div>
        <div><div class="fc-isled comp" style="margin:0 auto;"><div class="sb"></div><div class="sr"></div></div><div class="lbl">SLED RACE</div></div>
        <div><div class="fc-ibridge" style="margin:0 auto;"><div class="ba"></div><div class="bp bp-l"></div><div class="bp bp-r"></div></div><div class="lbl">ICY BRIDGE</div></div>
        <div><div class="fc-isnow" style="margin:0 auto;"><span class="a"></span><span class="a"></span><span class="a"></span><span class="d"></span></div><div class="lbl">COLD METER</div></div>
      </div>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:2px;margin-top:30px;">
        ${playerGrid}
      </div>
      <div class="fc-flavor" style="margin-top:20px;opacity:.3;">"${pick(HOST_FLAVOR)()}"</div>
    </div>`;

  return _shell(content, ep, 'fc-title');
}

export function rpBuildFCPhase1(ep) {
  const fc = ep.frozenCrossing;
  if (!fc?.phase1) return '';

  const screenKey = 'fc-phase1';
  const suffix = 'phase1';
  const events = fc.phase1;
  const totalSteps = events.length + 1;
  _ensureState(screenKey, totalSteps);

  window._fcPhase1StepMeta = [{ idx: 0, type: 'intro' }, ...events.map((e, i) => ({ idx: i + 1, type: e.type, player: e.player || e.rescuer || e.winner }))];

  // Build per-step cold/progress snapshots for live sidebar
  const allP1Players = fc.tribes.flatMap(t => t.members);
  const snapCold = {};
  const snapProg = {};
  const snapFrozen = new Set();
  allP1Players.forEach(n => { snapCold[n] = 8; snapProg[n] = 0; });
  const snapshots = [{ cold: { ...snapCold }, prog: { ...snapProg }, frozen: new Set() }]; // step 0 = intro
  events.forEach(e => {
    const p = e.player || e.rescuer || e.winner || '';
    if (p && e.coldLoss) snapCold[p] = Math.max(0, (snapCold[p] ?? 8) - e.coldLoss);
    if (p && e.type === 'cleanHop') snapProg[p] = (snapProg[p] || 0) + 1;
    if (p && e.type === 'crossed') snapProg[p] = fc.floesPerPlayer;
    if (p && e.type === 'frozen') snapFrozen.add(p);
    if (e.type === 'huddle') allP1Players.forEach(n => { if (!snapFrozen.has(n)) snapCold[n] = Math.min(10, (snapCold[n] ?? 8) + 1.5); });
    if (e.type === 'bearHit' && p) snapProg[p] = Math.max(0, (snapProg[p] || 0) - 1);
    snapshots.push({ cold: { ...snapCold }, prog: { ...snapProg }, frozen: new Set(snapFrozen) });
  });
  window._fcPhase1Snapshots = snapshots;

  const h = host();
  const hostSlug = (seasonConfig?.hostSlug || 'chris');

  let cardsHtml = '';

  // Step 0: Chris explains Phase 1
  cardsHtml += `<div id="fc-step-${suffix}-0" class="fc-hidden">
    <div class="fc-card" style="border-left:3px solid var(--fc-gold);box-shadow:inset 3px 0 15px -8px rgba(251,191,36,.25);">
      <div class="fc-hdr">
        <img src="assets/avatars/${hostSlug}.png" class="fc-av" style="border-color:var(--fc-gold);" onerror="this.style.display='none'">
        <div><div class="fc-title" style="color:var(--fc-gold);">${h.toUpperCase()} EXPLAINS</div><div style="font-size:10px;color:var(--fc-gold);opacity:.5;">Phase 1 Rules</div></div>
      </div>
      <div class="fc-txt">
        <div>"Alright everyone, welcome to the <strong>Ice Floe Gauntlet</strong>! Each of you will cross a frozen river by jumping across <strong>${fc.floesPerPlayer} ice floes</strong>. Your cold meter starts at 8 — fall in the water and it drops. Hit zero? You're <strong>frozen solid</strong>. Out of the challenge."</div>
        <div style="margin-top:8px;">"Oh, and watch out for the <strong>polar bears</strong>. They're hungry. First person across from each tribe becomes the <strong>sled puller</strong> for Phase 2. Good luck — you'll need it."</div>
      </div>
    </div>
  </div>`;

  let flavorIdx = 0;

  events.forEach((e, idx) => {
    const i = idx + 1;
    let flavorHtml = '';
    if (i > 0 && i % (6 + flavorIdx % 3) === 0 && flavorIdx < 4) {
      const flavor = HOST_FLAVOR[flavorIdx % HOST_FLAVOR.length]();
      const hostSlug = (seasonConfig?.hostSlug || 'chris');
      flavorHtml = `<div class="fc-flavor" style="display:flex;align-items:center;gap:8px;justify-content:center;"><img src="assets/avatars/${hostSlug}.png" style="width:20px;height:20px;border-radius:50%;border:1px solid rgba(168,216,234,.2);object-fit:cover;" onerror="this.style.display='none'"><span>"${flavor}"</span></div>`;
      flavorIdx++;
    }

    const playerName = e.player || e.rescuer || e.winner || '';
    const tribeName = playerName ? _playerTribeName(playerName) : '';
    const tc = playerName ? _playerTribeColor(playerName) : '';
    const snap = snapshots[i] || snapshots[snapshots.length - 1];
    const cold = snap ? (snap.cold[playerName] ?? 8) : (fc.coldMeter?.[playerName] ?? 8);
    const isCold = cold <= 4;

    if (e.type === 'bearDodge' || e.type === 'bearHit') {
      // Bear attack card
      const dodged = e.type === 'bearDodge';
      cardsHtml += `<div id="fc-step-${suffix}-${i}" class="fc-hidden">
        ${flavorHtml}
        <div class="fc-bear-attack">
          <div class="claw"></div><div class="claw"></div><div class="claw"></div>
          <div class="claw-r"></div><div class="claw-r"></div>
          <div style="position:relative;z-index:2;">
            <div class="fc-hdr">
              ${_iconBearLg()}
              <div>
                <div class="fc-title" style="color:var(--fc-danger);font-size:15px;">POLAR BEAR ${dodged ? 'AMBUSH' : 'ATTACK'}</div>
                <div style="font-size:10px;color:var(--fc-danger);opacity:.6;">${playerName} • ${tribeName} — Floe ${(snap ? (snap.prog[playerName] || 0) : 0) + 1}</div>
              </div>
              <span class="fc-badge ${dodged ? 'fc-bs' : 'fc-bd'}">${dodged ? 'DODGED' : 'HIT'}</span>
            </div>
            <div class="fc-txt">
              <div style="display:flex;align-items:center;gap:10px;">
                ${_avWrap(playerName, '', isCold)}
                <div>${e.text}</div>
              </div>
              ${!dodged && e.coldLoss ? _coldBar(cold, e.coldLoss) : ''}
            </div>
          </div>
        </div>
      </div>`;
    } else if (e.type === 'rescue') {
      // Rescue card with heart icon
      const rescuer = e.rescuer;
      const fallen = e.fallen;
      cardsHtml += `<div id="fc-step-${suffix}-${i}" class="fc-hidden">
        ${flavorHtml}
        <div class="fc-card" style="border-left:3px solid var(--fc-pink);box-shadow:inset 3px 0 15px -8px rgba(244,114,182,.25);">
          <div class="fc-hdr">
            ${_iconHeart()}
            <div><div class="fc-title" style="color:var(--fc-pink);">CROSS-TRIBE RESCUE</div><div style="font-size:10px;color:var(--fc-pink);opacity:.5;">${rescuer} pulls ${fallen} from the water</div></div>
            <span class="fc-badge fc-bp">BOND +1.5</span>
          </div>
          <div class="fc-txt">
            <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;">
              ${_avWrap(rescuer, '', false)}
              ${_iconWind()}
              ${_avWrap(fallen, 'shiver', true)}
            </div>
            <div>${e.text}</div>
            <div style="font-size:9px;color:var(--fc-teal);margin-top:8px;letter-spacing:1px;">★ POPULARITY +2 ${rescuer} (heroic rescue)</div>
          </div>
        </div>
      </div>`;
    } else if (e.type === 'frozen') {
      // Frozen card — ice blue
      cardsHtml += `<div id="fc-step-${suffix}-${i}" class="fc-hidden">
        ${flavorHtml}
        <div class="fc-stuck">
          <div class="fc-hdr">
            ${_iconSnow()}
            <div><div class="fc-title" style="color:var(--fc-frozen);">FROZEN OUT</div><div style="font-size:10px;color:var(--fc-frozen);opacity:.5;">${playerName} • ${tribeName}</div></div>
            <span class="fc-badge fc-bd">DNF</span>
          </div>
          <div class="fc-txt">
            <div style="display:flex;align-items:center;gap:10px;">
              <img class="fc-av fc-av-frozen" src="assets/avatars/${slug(playerName)}.png" style="border-color:var(--fc-frozen);" onerror="this.style.display='none'">
              <div>${e.text}</div>
            </div>
          </div>
        </div>
      </div>`;
    } else if (e.type === 'huddle') {
      // Huddle checkpoint
      const hudPlayers = e.players || [];
      cardsHtml += `<div id="fc-step-${suffix}-${i}" class="fc-hidden">
        ${flavorHtml}
        <div class="fc-card" style="border-left:3px solid var(--fc-warm);box-shadow:inset 3px 0 15px -8px rgba(249,115,22,.25);">
          <div class="fc-hdr">
            <div class="fc-isnow" style="flex-shrink:0;filter:drop-shadow(0 0 4px rgba(249,115,22,.4));"><span class="a"></span><span class="a"></span><span class="a"></span><span class="d" style="background:var(--fc-warm);"></span></div>
            <div class="fc-title" style="color:var(--fc-warm);">HUDDLE CHECKPOINT — MIDWAY</div>
            <span class="fc-badge fc-bw">WARMTH +1.5</span>
          </div>
          <div class="fc-txt">
            <div style="margin-bottom:8px;">${e.text}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              ${hudPlayers.map(n => _avWrap(n, 'sm shiver', true)).join('')}
            </div>
          </div>
        </div>
      </div>`;
    } else if (e.type === 'collision') {
      // Collision
      const w = e.winner;
      const l = e.loser;
      cardsHtml += `<div id="fc-step-${suffix}-${i}" class="fc-hidden">
        ${flavorHtml}
        <div class="fc-card fc-card-danger" data-tribe="${tribeName}">
          <div class="fc-hdr">
            ${_iconFloe(true)}
            <div><div class="fc-title" style="color:var(--fc-danger);">COLLISION</div><div style="font-size:10px;color:var(--fc-danger);opacity:.5;">${w} vs ${l}</div></div>
            <span class="fc-badge fc-bd">COLLISION</span>
          </div>
          <div class="fc-txt">
            <div style="display:flex;gap:10px;align-items:center;">
              ${_avWrap(w, '', false)}
              ${_iconWind()}
              ${_avWrap(l, 'shiver', true)}
            </div>
            <div style="margin-top:8px;">${e.text}</div>
          </div>
        </div>
      </div>`;
    } else if (e.type === 'crossed') {
      const isPuller = e.isPuller;
      const borderColor = isPuller ? 'var(--fc-gold)' : 'var(--fc-aurora-g)';
      const titleText = isPuller ? 'SLED PULLER — FIRST ACROSS!' : 'CROSSED!';
      const badgeText = isPuller ? 'SLED PULLER' : 'CROSSED';
      cardsHtml += `<div id="fc-step-${suffix}-${i}" class="fc-hidden">
        ${flavorHtml}
        <div class="fc-card" style="border-left:3px solid ${borderColor};box-shadow:inset 3px 0 15px -8px ${isPuller ? 'rgba(251,191,36,.3)' : 'rgba(74,222,128,.2)'};">
          <div class="fc-hdr">
            ${isPuller ? _iconSled('comp') : _iconFloe(false)}
            <div>
              <div class="fc-title" style="color:${borderColor};font-size:${isPuller ? '15px' : '13px'};">${titleText}</div>
              <div style="font-size:10px;color:${borderColor};opacity:.5;">${playerName} • ${tribeName}</div>
            </div>
            <span class="fc-badge ${isPuller ? 'fc-bh' : 'fc-bs'}">${badgeText}</span>
          </div>
          <div class="fc-txt">
            <div style="display:flex;align-items:center;gap:10px;">
              ${_avWrap(playerName, '', false)}
              <div>${e.text}</div>
            </div>
            ${isPuller ? `<div style="font-size:9px;color:var(--fc-gold);margin-top:8px;letter-spacing:1px;">★ POPULARITY +2 ${playerName} (first across)</div>` : ''}
          </div>
        </div>
      </div>`;
    } else {
      // Default cards: cleanHop, waterFall
      const isDanger = e.type === 'waterFall';
      const badgeCls = _badgeClass(e.badgeClass);
      const prevSnap = snapshots[i - 1] || snapshots[0];
      const playerProg = prevSnap ? (prevSnap.prog[playerName] || 0) : 0;
      const floeLabel = `FLOE ${playerProg + 1}`;
      const tribeAttr = tribeName ? ` data-tribe="${tribeName}"` : '';

      cardsHtml += `<div id="fc-step-${suffix}-${i}" class="fc-hidden">
        ${flavorHtml}
        <div class="fc-card${isDanger ? ' fc-card-danger' : ''}"${tribeAttr} ${tc ? `style="border-left-color:${tc};"` : ''}>
          <div class="fc-hdr">
            ${isDanger ? _iconFloe(true) : _iconFloe(false)}
            <div><div class="fc-title"${isDanger ? ' style="color:var(--fc-danger);"' : ''}>${floeLabel}${isDanger ? ' — SINKING' : ''}</div><div style="font-size:10px;color:${isDanger ? 'var(--fc-danger)' : 'var(--fc-ice)'};opacity:.4;">${playerName} • ${tribeName}</div></div>
            <span class="fc-badge ${badgeCls}">${e.badge || ''}</span>
          </div>
          <div class="fc-txt">
            <div style="display:flex;align-items:center;gap:10px;">
              ${_avWrap(playerName, isCold ? 'shiver' : '', isCold)}
              <div><strong>${playerName}</strong> ${e.text.replace(new RegExp('^' + playerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*'), '')}</div>
            </div>
            ${isDanger && e.coldLoss ? `<div style="display:flex;gap:12px;align-items:center;margin-top:8px;">
              ${_coldBar(cold, e.coldLoss)}
            </div>` : !isDanger ? _coldBar(cold) : ''}
          </div>
        </div>
      </div>`;
    }
  });

  const content = `
    <div class="fc-sec"><h2>ICE FLOE GAUNTLET</h2><div class="sub">Phase 1 — Cross the Frozen River</div></div>
    ${cardsHtml}
    <div class="fc-controls" id="fc-controls-${suffix}">
      <button class="fc-btn fc-btn-p" onclick="frozenCrossingRevealNext('${screenKey}',${totalSteps})">▶ Reveal Next</button>
      <span class="fc-counter" id="fc-counter-${suffix}">0 / ${totalSteps}</span>
      <button class="fc-btn" onclick="frozenCrossingRevealAll('${screenKey}',${totalSteps})">⏩ Reveal All</button>
    </div>`;

  return _shell(content, ep, screenKey);
}

export function rpBuildFCSledAssignment(ep) {
  const fc = ep.frozenCrossing;
  if (!fc) return '';

  const screenKey = 'fc-sled';
  const suffix = 'sled';
  const totalSteps = fc.tribeFinishOrder.length;
  _ensureState(screenKey, totalSteps);

  let cardsHtml = '<div class="fc-sled-reveal">';
  fc.tribeFinishOrder.forEach((tribeName, i) => {
    const tc = tribeColor(tribeName);
    const sledType = fc.sledAssignment[tribeName];
    const puller = fc.pullers[tribeName];
    const sledCls = sledType === 'competition' ? 'comp' : sledType === 'radioactive' ? 'rad' : 'wood';
    const sledLabel = SLED_NAMES[sledType];
    const mult = { competition: 1.15, wood: 1.0, radioactive: 0.85 }[sledType];
    const panelCls = i === 0 ? ' first' : i === totalSteps - 1 ? ' last' : '';
    const sledColor = sledType === 'competition' ? '#d4d4d8' : sledType === 'radioactive' ? 'var(--fc-radio)' : '#d4a520';
    const multBg = sledType === 'competition' ? 'rgba(192,192,192,.06)' : sledType === 'radioactive' ? 'rgba(34,197,94,.06)' : 'rgba(139,105,20,.06)';
    const multBorder = sledType === 'competition' ? 'rgba(192,192,192,.15)' : sledType === 'radioactive' ? 'rgba(34,197,94,.15)' : 'rgba(139,105,20,.15)';
    const multColor = sledType === 'competition' ? '#c0c0c0' : sledType === 'radioactive' ? 'var(--fc-radio)' : '#b8860b';
    const ordinal = i === 0 ? '1ST ACROSS' : i === 1 ? '2ND ACROSS' : '3RD ACROSS';

    const pullerPr = pronouns(puller);
    const pullerReact = Math.random() < 0.5 ? pick(PULLER_REACT_POS)(puller, pullerPr) : pick(PULLER_REACT_NEG)(puller, pullerPr);
    const sledReact = sledType === 'competition' ? pick(SLED_REACT_GOOD)(tribeName) : sledType === 'radioactive' ? pick(SLED_REACT_BAD)(tribeName) : pick(SLED_REACT_MID)(tribeName);

    cardsHtml += `<div id="fc-step-${suffix}-${i}" class="fc-hidden">
      <div class="fc-sled-panel${panelCls}">
        <div style="font-family:'Black Ops One',cursive;font-size:10px;letter-spacing:3px;opacity:.4;margin-bottom:10px;">${ordinal}</div>
        <img class="fc-av-lg" src="assets/avatars/${slug(puller)}.png" style="border-color:${tc};display:block;margin:0 auto;" onerror="this.style.display='none'">
        <div style="font-family:'Black Ops One',cursive;font-size:14px;color:${tc};margin-top:8px;letter-spacing:2px;">${tribeName.toUpperCase()}</div>
        <div style="font-size:11px;color:rgba(240,249,255,.6);margin:6px 0;font-style:italic;line-height:1.5;">${pullerReact}</div>
        ${_iconSled(sledCls)}
        <div style="font-family:'Black Ops One',cursive;font-size:14px;color:${sledColor};letter-spacing:2px;margin-top:4px;${sledType === 'radioactive' ? 'text-shadow:0 0 8px var(--fc-radio);' : ''}">${sledType.toUpperCase()}</div>
        <div style="font-size:11px;padding:4px 12px;border-radius:12px;display:inline-block;margin-top:6px;background:${multBg};color:${multColor};border:1px solid ${multBorder};font-weight:700;">×${mult.toFixed(2)}</div>
        <div style="font-size:10.5px;color:rgba(240,249,255,.5);margin-top:8px;font-style:italic;line-height:1.5;">${sledReact}</div>
      </div>
    </div>`;
  });
  cardsHtml += '</div>';

  const content = `
    <div class="fc-divider"><span>Phase 1 Complete — Sled Assignment</span></div>
    <div class="fc-sec"><h2>SLED ASSIGNMENT</h2><div class="sub">First Across = Puller — Sled Quality = Tribe Speed</div></div>
    ${cardsHtml}
    <div class="fc-controls" id="fc-controls-${suffix}">
      <button class="fc-btn fc-btn-p" onclick="frozenCrossingRevealNext('${screenKey}',${totalSteps})">▶ Reveal Next</button>
      <span class="fc-counter" id="fc-counter-${suffix}">0 / ${totalSteps}</span>
      <button class="fc-btn" onclick="frozenCrossingRevealAll('${screenKey}',${totalSteps})">⏩ Reveal All</button>
    </div>`;

  return _shell(content, ep, 'fc-sled');
}

export function rpBuildFCPhase2(ep) {
  const fc = ep.frozenCrossing;
  if (!fc?.phase2) return '';

  const screenKey = 'fc-phase2';
  const suffix = 'phase2';
  const events = fc.phase2;
  const totalSteps = events.length + 1;
  _ensureState(screenKey, totalSteps);

  window._fcPhase2StepMeta = [{ idx: 0, type: 'intro' }, ...events.map((e, i) => ({ idx: i + 1, type: e.type, tribe: e.tribeName }))];

  // Build per-step tribe progress for map: count events per tribe up to each step
  const tribeNames = fc.tribes.map(t => t.name);
  const tribeTotalEvents = {};
  tribeNames.forEach(tn => { tribeTotalEvents[tn] = events.filter(e => e.tribeName === tn).length || 1; });
  const mapSnapshots = [{}]; // step 0 = all at start
  tribeNames.forEach(tn => { mapSnapshots[0][tn] = 0; });
  const runningCount = {};
  tribeNames.forEach(tn => { runningCount[tn] = 0; });
  events.forEach(e => {
    if (e.tribeName && runningCount[e.tribeName] !== undefined) runningCount[e.tribeName]++;
    mapSnapshots.push({ ...runningCount });
  });
  window._fcMapSnapshots = mapSnapshots;
  window._fcMapTribeTotals = tribeTotalEvents;

  // Build per-step checkpoint state snapshots for live map update
  // Each snapshot: { 'tribeIdx-cpIdx': 'visited'|'left-behind' }
  const cpStateSnapshots = [{}]; // step 0 = all unvisited
  const runningCpState = {};
  events.forEach(e => {
    if (e.type === 'pickup' && e.passenger) {
      const tn = e.tribeName || e.tribe;
      const tribe = fc.tribes.find(t => t.name === tn);
      if (tribe) {
        const tIdx = fc.tribes.indexOf(tribe);
        const cpIdx = tribe.checkpoints.indexOf(e.passenger);
        if (cpIdx >= 0) runningCpState[`${tIdx}-${cpIdx}`] = 'visited';
      }
    } else if (e.type === 'waitDecision' && e.player) {
      const tribe = fc.tribes.find(t => t.name === e.tribe);
      if (tribe) {
        const tIdx = fc.tribes.indexOf(tribe);
        const cpIdx = tribe.checkpoints.indexOf(e.player);
        if (cpIdx >= 0) runningCpState[`${tIdx}-${cpIdx}`] = 'visited';
      }
    } else if (e.type === 'leaveDecision' && e.player) {
      const tribe = fc.tribes.find(t => t.name === e.tribe);
      if (tribe) {
        const tIdx = fc.tribes.indexOf(tribe);
        const cpIdx = tribe.checkpoints.indexOf(e.player);
        if (cpIdx >= 0) runningCpState[`${tIdx}-${cpIdx}`] = 'left-behind';
      }
    }
    cpStateSnapshots.push({ ...runningCpState });
  });
  window._fcCpStateSnapshots = cpStateSnapshots;

  const h = host();
  const hostSlug = (seasonConfig?.hostSlug || 'chris');

  let cardsHtml = '';

  // Race map — sticky at top of content area
  cardsHtml += `<div class="fc-map-sticky">${_buildRaceMap(fc)}</div>`;

  // Step 0: Chris explains Phase 2
  const tribeList = fc.tribes.map(t => `<strong style="color:${tribeColor(t.name)}">${t.name}</strong> (${SLED_NAMES[t.sled]})`).join(', ');
  cardsHtml += `<div id="fc-step-${suffix}-0" class="fc-hidden">
    <div class="fc-card" style="border-left:3px solid var(--fc-gold);box-shadow:inset 3px 0 15px -8px rgba(251,191,36,.25);">
      <div class="fc-hdr">
        <img src="assets/avatars/${hostSlug}.png" class="fc-av" style="border-color:var(--fc-gold);" onerror="this.style.display='none'">
        <div><div class="fc-title" style="color:var(--fc-gold);">${h.toUpperCase()} EXPLAINS</div><div style="font-size:10px;color:var(--fc-gold);opacity:.5;">Phase 2 Rules</div></div>
      </div>
      <div class="fc-txt">
        <div>"Phase 2 — the <strong>Sled Pickup Race</strong>! Your puller drives the sled to pick up teammates at checkpoints. Faster crossers in Phase 1 get <strong>closer checkpoints</strong>. Every passenger adds weight and slows you down."</div>
        <div style="margin-top:8px;">"Your sleds: ${tribeList}. Watch out for the <strong>icy bridge</strong> — it might not hold. And the <strong>Bridgette Rule</strong>: cross the finish missing a teammate? <strong>Automatic last place.</strong>"</div>
      </div>
    </div>
  </div>`;

  let flavorIdx = 0;

  events.forEach((e, idx) => {
    const i = idx + 1;
    let flavorHtml = '';
    if (i > 0 && i % (8 + flavorIdx % 4) === 0 && flavorIdx < 8) {
      const flavor = HOST_FLAVOR[(flavorIdx + 5) % HOST_FLAVOR.length]();
      const hostSlug = (seasonConfig?.hostSlug || 'chris');
      flavorHtml = `<div class="fc-flavor" style="display:flex;align-items:center;gap:8px;justify-content:center;"><img src="assets/avatars/${hostSlug}.png" style="width:20px;height:20px;border-radius:50%;border:1px solid rgba(168,216,234,.2);object-fit:cover;" onerror="this.style.display='none'"><span>"${flavor}"</span></div>`;
      flavorIdx++;
    }

    const tribeName = e.tribeName || e.tribe || '';
    const tc = tribeName ? tribeColor(tribeName) : 'var(--fc-ice)';

    if (e.type === 'tribeHeader') {
      const posLabel = e.position || '';
      const sledInfo = fc.tribes.find(t => t.name === tribeName);
      const sledName = sledInfo ? (SLED_NAMES[sledInfo.sled] || 'Sled') : '';
      cardsHtml += `<div id="fc-step-${suffix}-${i}" class="fc-hidden">
        ${flavorHtml}
        <div class="fc-tribe-banner" style="border-color:${tc};background:linear-gradient(90deg,${tc}15,transparent 60%);">
          <div class="fc-tribe-banner-bar" style="background:${tc};"></div>
          <div class="fc-tribe-banner-content">
            <span class="fc-tribe-banner-name" style="color:${tc};">${tribeName.toUpperCase()}</span>
            <span class="fc-tribe-banner-info">${sledName} • ${posLabel} PLACE</span>
          </div>
          ${_iconSled(sledInfo?.sled === 'competition' ? 'comp' : sledInfo?.sled === 'radioactive' ? 'rad' : 'wood')}
        </div>
      </div>`;
    } else if (e.type === 'bridgeCollapse') {
      cardsHtml += `<div id="fc-step-${suffix}-${i}" class="fc-hidden">
        ${flavorHtml}
        <div class="fc-bridge-card">
          <div class="fc-crack" style="width:80px;top:15%;left:25%;transform:rotate(22deg);"></div>
          <div class="fc-crack" style="width:50px;top:40%;left:55%;transform:rotate(-18deg);"></div>
          <div class="fc-crack" style="width:65px;top:65%;left:20%;transform:rotate(35deg);"></div>
          <div class="fc-crack" style="width:40px;top:30%;left:70%;transform:rotate(-28deg);"></div>
          <div style="position:relative;z-index:2;">
            <div class="fc-hdr">
              ${_iconBridge('var(--fc-danger)')}
              <div><div class="fc-title" style="color:var(--fc-danger);font-size:15px;">BRIDGE COLLAPSE</div><div style="font-size:10px;color:var(--fc-danger);opacity:.5;">${tribeName}</div></div>
              <span class="fc-badge fc-bd">CRITICAL</span>
            </div>
            <div class="fc-txt">${e.text}</div>
          </div>
        </div>
      </div>`;
    } else if (e.type === 'heroSave') {
      const puller = e.puller || '';
      cardsHtml += `<div id="fc-step-${suffix}-${i}" class="fc-hidden">
        ${flavorHtml}
        <div class="fc-hero">
          <div style="position:relative;z-index:2;">
            <img class="fc-av-lg" src="assets/avatars/${slug(puller)}.png" style="border-color:var(--fc-gold);display:block;margin:0 auto 14px;box-shadow:0 0 25px rgba(251,191,36,.3);" onerror="this.style.display='none'">
            <div class="fc-hero-title">HERO SAVE</div>
            <div style="font-size:12px;color:var(--fc-frost);opacity:.45;letter-spacing:3px;margin-bottom:14px;">${puller} grips the ice edge with raw strength</div>
            <div class="fc-txt" style="max-width:500px;margin:0 auto;">${e.text}</div>
            <div style="display:flex;gap:14px;justify-content:center;margin-top:16px;">
              <span style="font-size:9px;color:var(--fc-gold);letter-spacing:2px;font-weight:700;">★ POP +3</span>
              <span style="font-size:9px;color:var(--fc-aurora-g);letter-spacing:2px;">BOND +1 ALL</span>
              <span style="font-size:9px;color:var(--fc-ice);letter-spacing:2px;">+5 INDIVIDUAL</span>
            </div>
          </div>
        </div>
      </div>`;
    } else if (e.type === 'romanceTrap') {
      const charmer = e.charmer || '';
      const target = e.target || '';
      cardsHtml += `<div id="fc-step-${suffix}-${i}" class="fc-hidden">
        ${flavorHtml}
        <div class="fc-romance">
          <div class="fc-hdr">
            ${_iconHeart()}
            <div><div class="fc-title" style="color:var(--fc-pink);">ROMANCE TRAP</div><div style="font-size:10px;color:var(--fc-pink);opacity:.5;">${e.deliberate ? 'Deliberate' : 'Accidental'}</div></div>
            <span class="fc-badge fc-bp">${e.deliberate ? 'DELIBERATE' : 'STUCK'}</span>
          </div>
          <div class="fc-txt">
            <div style="display:flex;gap:16px;align-items:center;justify-content:center;margin:12px 0;">
              <div style="text-align:center;"><img class="fc-av-lg" src="assets/avatars/${slug(charmer)}.png" style="border-color:${_playerTribeColor(charmer)};" onerror="this.style.display='none'"><div style="font-size:9px;color:${_playerTribeColor(charmer)};margin-top:4px;font-weight:700;letter-spacing:2px;">CHARMER</div></div>
              <div style="text-align:center;">${_iconHeart()}<div style="font-size:8px;color:var(--fc-pink);margin-top:6px;letter-spacing:3px;">TRAP</div></div>
              <div style="text-align:center;"><div class="fc-bwrap"><img class="fc-av-lg fc-av-shiver" src="assets/avatars/${slug(target)}.png" style="border-color:${_playerTribeColor(target)};" onerror="this.style.display='none'"><div class="fc-vapor"></div></div><div style="font-size:9px;color:${_playerTribeColor(target)};margin-top:4px;font-weight:700;letter-spacing:2px;">VICTIM</div></div>
            </div>
            <div>${e.text}</div>
            ${e.score ? `<div style="font-size:9px;color:var(--fc-aurora-g);margin-top:8px;letter-spacing:1px;">★ ${charmer} +${e.score} individual (strategic play)</div>` : ''}
          </div>
        </div>
      </div>`;
    } else if (e.type === 'waitDecision' || e.type === 'leaveDecision') {
      const isLeave = e.type === 'leaveDecision';
      const player = e.player || '';
      cardsHtml += `<div id="fc-step-${suffix}-${i}" class="fc-hidden">
        ${flavorHtml}
        <div class="fc-stuck">
          <div class="fc-hdr">
            ${_iconStuck()}
            <div><div class="fc-title" style="color:var(--fc-frozen);">STUCK — DECISION</div><div style="font-size:10px;color:var(--fc-frozen);opacity:.5;">${player} • ${tribeName}</div></div>
            <span class="fc-badge ${isLeave ? 'fc-bd' : 'fc-bw'}">${isLeave ? 'LEFT BEHIND' : 'WAIT'}</span>
          </div>
          <div class="fc-txt">
            <div>${e.text}</div>
            <div style="display:flex;gap:16px;margin-top:14px;justify-content:center;">
              <div class="fc-decision${!isLeave ? ' fc-decision-chosen' : ''}" style="border-color:rgba(168,216,234,.25);${!isLeave ? 'background:rgba(249,115,22,.04);' : ''}"><div style="font-weight:700;font-size:12px;color:var(--fc-ice);">WAIT</div><div style="font-size:9px;color:var(--fc-ice);opacity:.5;">+45s penalty</div></div>
              <div class="fc-decision${isLeave ? ' fc-decision-chosen' : ''}" style="border-color:${isLeave ? 'var(--fc-danger)' : 'rgba(168,216,234,.25)'};${isLeave ? 'background:rgba(239,68,68,.04);' : ''}"><div style="font-weight:700;font-size:12px;color:var(--fc-danger);">LEAVE BEHIND</div><div style="font-size:9px;color:var(--fc-danger);opacity:.6;">BRIDGETTE RULE</div></div>
            </div>
            <div style="text-align:center;margin-top:10px;font-size:10px;color:${isLeave ? 'var(--fc-danger)' : 'var(--fc-warm)'};letter-spacing:2px;font-weight:700;">${tribeName.toUpperCase()} CHOSE: ${isLeave ? 'LEAVE BEHIND' : 'WAIT'}</div>
          </div>
        </div>
      </div>`;
    } else if (e.type === 'bridgetteRule') {
      cardsHtml += `<div id="fc-step-${suffix}-${i}" class="fc-hidden">
        ${flavorHtml}
        <div class="fc-card fc-card-danger" style="border-left-color:var(--fc-danger);">
          <div class="fc-hdr">
            ${_iconStuck()}
            <div><div class="fc-title" style="color:var(--fc-danger);">BRIDGETTE RULE</div><div style="font-size:10px;color:var(--fc-danger);opacity:.5;">${tribeName} — Automatic Last Place</div></div>
            <span class="fc-badge fc-bd">PENALTY</span>
          </div>
          <div class="fc-txt">${e.text}</div>
        </div>
      </div>`;
    } else if (e.type === 'encouragement') {
      const from = e.from || '';
      cardsHtml += `<div id="fc-step-${suffix}-${i}" class="fc-hidden">
        ${flavorHtml}
        <div class="fc-card" data-tribe="${tribeName}" style="border-left-color:var(--fc-aurora-g);">
          <div class="fc-hdr"><div class="fc-title" style="color:var(--fc-aurora-g);">ENCOURAGEMENT</div><span class="fc-badge fc-bs">SPEED + | BOND +0.5</span></div>
          <div class="fc-txt"><div style="display:flex;gap:10px;align-items:center;">
            <img class="fc-av-sm" src="assets/avatars/${slug(from)}.png" style="border-color:${tc};" onerror="this.style.display='none'">
            <div>${e.text}</div>
          </div></div>
        </div>
      </div>`;
    } else if (e.type === 'whipping') {
      const from = e.from || '';
      cardsHtml += `<div id="fc-step-${suffix}-${i}" class="fc-hidden">
        ${flavorHtml}
        <div class="fc-card fc-card-danger" data-tribe="${tribeName}">
          <div class="fc-hdr"><div class="fc-title" style="color:var(--fc-danger);">WHIPPING</div><span class="fc-badge fc-bd">SPEED ++ | BOND -1.0</span></div>
          <div class="fc-txt"><div style="display:flex;gap:10px;align-items:center;">
            <img class="fc-av-sm" src="assets/avatars/${slug(from)}.png" style="border-color:${tc};" onerror="this.style.display='none'">
            <div>${e.text}</div>
          </div>
          <div style="font-size:9px;color:var(--fc-danger);margin-top:6px;letter-spacing:1px;">POP -1 ${from} • Camp event injected</div>
          </div>
        </div>
      </div>`;
    } else {
      // Default: pickup, huddleWarmth, finalSprint, approach, teamMoment, overtake, terrain(downhill), etc.
      const positiveTypes = new Set(['pickup', 'finalSprint', 'huddleWarmth', 'approach', 'teamMoment', 'overtake']);
      const isPositive = positiveTypes.has(e.type) || e.badgeClass === 'gold';
      const badgeCls = _badgeClass(e.badgeClass);
      const player = e.puller || e.from || e.passenger || '';

      cardsHtml += `<div id="fc-step-${suffix}-${i}" class="fc-hidden">
        ${flavorHtml}
        <div class="fc-card${!isPositive ? ' fc-card-danger' : ''}" data-tribe="${tribeName}">
          <div class="fc-hdr">
            ${_eventIcon(e.type)}
            <div><div class="fc-title">${(e.badge || e.type).toUpperCase()}</div><div style="font-size:10px;color:var(--fc-ice);opacity:.4;">${tribeName}${player ? ' • ' + player : ''}</div></div>
            <span class="fc-badge ${badgeCls}">${e.badge || ''}</span>
          </div>
          <div class="fc-txt">
            <div style="display:flex;align-items:center;gap:10px;">
              ${player ? `<div class="fc-bwrap"><img class="fc-av" src="assets/avatars/${slug(player)}.png" style="border-color:${tc};" onerror="this.style.display='none'"><div class="fc-vapor"></div></div>` : ''}
              <div>${e.text}</div>
            </div>
          </div>
        </div>
      </div>`;
    }
  });

  const content = `
    <div class="fc-divider"><span>Sled Pickup Race</span></div>
    <div class="fc-sec"><h2>SLED PICKUP RACE</h2><div class="sub">Pick Up Teammates — Reach the Finish</div></div>
    ${cardsHtml}
    <div class="fc-controls" id="fc-controls-${suffix}">
      <button class="fc-btn fc-btn-p" onclick="frozenCrossingRevealNext('${screenKey}',${totalSteps})">▶ Reveal Next</button>
      <span class="fc-counter" id="fc-counter-${suffix}">0 / ${totalSteps}</span>
      <button class="fc-btn" onclick="frozenCrossingRevealAll('${screenKey}',${totalSteps})">⏩ Reveal All</button>
    </div>`;

  return _shell(content, ep, screenKey);
}

function _buildRaceMap(fc) {
  if (!fc?.tribes) return '';

  // Checkpoint positions along the route (left%, top px) — spread evenly
  const cpPositions = [
    [16, 80], [28, 120], [40, 110], [52, 60], [64, 90], [76, 70], [88, 55]
  ];

  // Build all checkpoints across all tribes
  let checkpointsHtml = '';
  const allCheckpoints = []; // {name, tribe, tribeIdx, cpIdx, left, top, isStuck}
  fc.tribes.forEach((tribe, tIdx) => {
    const passengers = tribe.checkpoints || tribe.members.filter(n => n !== tribe.puller);
    passengers.forEach((name, cpIdx) => {
      const pos = cpPositions[cpIdx % cpPositions.length];
      const left = pos[0] + tIdx * 2; // slight offset per tribe
      const top = pos[1] + tIdx * 8;
      const isStuck = tribe.missing.includes(name);
      allCheckpoints.push({ name, tribe: tribe.name, tribeIdx: tIdx, cpIdx, left, top, isStuck });
      const tc = tribeColor(tribe.name);
      checkpointsHtml += `<div class="fc-mapcp unvisited" id="fc-mapcp-${tIdx}-${cpIdx}" style="top:${top}px;left:${left}%;">
        <div class="fc-mapcp-node" style="border-color:${tc}33;">
          <img src="assets/avatars/${slug(name)}.png" alt="${name}" style="filter:grayscale(1) brightness(.6);" onerror="this.style.display='none'">
          <div class="fc-mapcp-mark" style="background:rgba(168,216,234,.15);color:var(--fc-ice);">?</div>
        </div>
        <div class="fc-mapcp-label">CP ${cpIdx + 1}</div>
      </div>`;
    });
  });
  window._fcMapCheckpoints = allCheckpoints;

  // Bridge landmark (placed at ~68% along route)
  const bridgeLm = `<div class="fc-maplm" style="top:42px;left:68%;z-index:3;">
    ${_iconBridge('rgba(239,68,68,.3)')}
    <div class="fc-maplm-label" style="color:var(--fc-danger);">BRIDGE</div>
  </div>`;

  // Map decorations
  let decos = '';
  const mtnSpots = [[20,5],[10,12],[5,25],[25,38]];
  mtnSpots.forEach(([t,l], i) => { decos += `<div class="fc-mm ${i%2===0?'s':'m'}" style="top:${t}px;left:${l}%;"></div>`; });
  decos += `<div class="fc-mm m" style="top:8px;right:20%;"></div><div class="fc-mm s" style="top:15px;right:8%;"></div>`;
  for (let i = 0; i < 6; i++) { decos += `<div class="fc-mt" style="top:${48+i*3%10}px;left:${3+i*8}%;"></div>`; }
  decos += `<div class="fc-mriver" style="width:120px;top:80px;left:2%;"></div>`;
  decos += `<div class="fc-mriver" style="width:80px;bottom:70px;right:5%;transform:rotate(8deg);"></div>`;

  // SVG route
  const svg = `<svg viewBox="0 0 1000 200" preserveAspectRatio="none" style="position:relative;z-index:2;width:100%;height:200px;">
    <path class="fc-map-route-glow" d="M 30,160 C 80,160 100,100 180,100 C 260,100 280,150 360,140 C 440,130 460,70 540,80 C 620,90 650,140 720,130 C 790,120 830,60 900,70 L 970,70" fill="none" stroke="rgba(168,216,234,.06)" stroke-width="12" stroke-linecap="round"/>
    <path class="fc-map-route" d="M 30,160 C 80,160 100,100 180,100 C 260,100 280,150 360,140 C 440,130 460,70 540,80 C 620,90 650,140 720,130 C 790,120 830,60 900,70 L 970,70" fill="none" stroke="rgba(168,216,234,.15)" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 4"/>
    <circle cx="30" cy="160" r="6" fill="none" stroke="var(--fc-ice)" stroke-width="2" opacity=".4"/>
    <text x="30" y="180" text-anchor="middle" font-size="8" fill="var(--fc-ice)" opacity=".35" font-family="'Black Ops One',cursive" letter-spacing="2">START</text>
    <rect x="960" y="58" width="16" height="12" fill="none" stroke="var(--fc-ice)" stroke-width="1.5" opacity=".4"/>
    <text x="968" y="85" text-anchor="middle" font-size="8" fill="var(--fc-ice)" opacity=".35" font-family="'Black Ops One',cursive" letter-spacing="2">FINISH</text>
  </svg>`;

  // Team sled dots with IDs for live update
  let sledDots = '';
  fc.tribes.forEach((tribe, idx) => {
    const tc = tribeColor(tribe.name);
    const label = tribe.name.substring(0, 1).toUpperCase();
    sledDots += `<div class="fc-mapsled" id="fc-mapsled-${idx}" style="top:${140 + idx * 14}px;left:3%;transition:left .8s cubic-bezier(.34,1.56,.64,1);">
      <div class="fc-mapsled-dot" style="border-color:${tc};background:radial-gradient(circle at 30% 30%,${tc}66,${tc}1f);color:${tc};">${label}</div>
    </div>`;
  });

  // Compass
  const compass = `<div class="fc-compass" style="position:absolute;bottom:12px;right:16px;width:40px;height:40px;z-index:3;opacity:.15;">
    <span style="position:absolute;top:-2px;left:50%;transform:translateX(-50%);font-size:8px;color:var(--fc-ice);font-family:'Black Ops One',cursive;">N</span>
    <div class="cn" style="position:absolute;top:50%;left:50%;width:1px;height:16px;background:var(--fc-ice);transform-origin:bottom center;transform:translate(-50%,-100%) rotate(0);"></div>
    <div class="cn" style="position:absolute;top:50%;left:50%;width:1px;height:16px;background:var(--fc-ice);transform-origin:bottom center;transform:translate(-50%,-100%) rotate(90deg);"></div>
    <div class="cn" style="position:absolute;top:50%;left:50%;width:1px;height:16px;background:var(--fc-ice);transform-origin:bottom center;transform:translate(-50%,-100%) rotate(180deg);"></div>
    <div class="cn" style="position:absolute;top:50%;left:50%;width:1px;height:16px;background:var(--fc-ice);transform-origin:bottom center;transform:translate(-50%,-100%) rotate(270deg);"></div>
  </div>`;

  return `<div class="fc-map" id="fc-race-map">
    <div class="fc-map-title">Expedition Route</div>
    ${decos}
    ${svg}
    ${checkpointsHtml}
    ${bridgeLm}
    ${sledDots}
    ${compass}
  </div>`;
}

export function rpBuildFCResults(ep) {
  const fc = ep.frozenCrossing;
  if (!fc) return '';

  const screenKey = 'fc-results';
  const suffix = 'results';
  const totalSteps = fc.tribesSorted.length;
  _ensureState(screenKey, totalSteps);

  let cardsHtml = '';
  fc.tribesSorted.forEach((tribeName, i) => {
    const tc = tribeColor(tribeName);
    const tribe = fc.tribes.find(t => t.name === tribeName);
    const isWinner = i === 0;
    const isLoser = i === fc.tribesSorted.length - 1;
    const place = isWinner ? '1st' : isLoser ? `${fc.tribesSorted.length}${fc.tribesSorted.length === 3 ? 'rd' : 'th'}` : `${i + 1}${i === 1 ? 'nd' : 'rd'}`;
    const teamCls = isWinner ? ' winner' : isLoser ? ' loser' : '';
    const statusLabel = isWinner ? 'IMMUNITY' : isLoser ? 'TRIBAL COUNCIL' : 'SAFE';
    const statusColor = isWinner ? 'var(--fc-gold)' : isLoser ? 'var(--fc-danger)' : 'var(--fc-frost)';
    const hasBridgette = tribe?.hasBridgette;

    const memberAvatars = (tribe?.members || []).map(name => {
      const isMissing = tribe?.missing?.includes(name);
      const frozenCls = isMissing ? ' fc-av-frozen' : '';
      return `<img class="fc-av-sm${frozenCls}" src="assets/avatars/${slug(name)}.png" style="border-color:${tc};${isMissing ? 'opacity:.3;' : ''}" onerror="this.style.display='none'">`;
    }).join('');

    cardsHtml += `<div id="fc-step-${suffix}-${i}" class="fc-hidden">
      <div class="fc-rteam${teamCls}">
        <div style="font-family:'Black Ops One',cursive;font-size:32px;color:${isWinner ? 'var(--fc-gold)' : isLoser ? 'var(--fc-danger)' : 'var(--fc-frost)'};${!isWinner && !isLoser ? 'opacity:.35;' : ''}min-width:50px;text-align:center;">${place}</div>
        <div style="flex:1;text-align:left;">
          <div style="font-family:'Black Ops One',cursive;font-size:16px;color:${tc};letter-spacing:2px;">${tribeName}</div>
          <div style="font-size:10px;color:${statusColor};letter-spacing:3px;margin-top:2px;">${statusLabel}</div>
          ${hasBridgette ? `<div style="font-size:9px;color:var(--fc-danger);margin-top:3px;letter-spacing:1px;">BRIDGETTE RULE — ${(tribe?.missing || []).join(', ')} left behind</div>` : ''}
        </div>
        <div style="display:flex;gap:4px;">${memberAvatars}</div>
      </div>
    </div>`;
  });

  // Bridgette rule box if any
  let bridgetteBox = '';
  const bridgetteTribes = fc.tribes.filter(t => t.hasBridgette);
  if (bridgetteTribes.length > 0) {
    const bt = bridgetteTribes[0];
    bridgetteBox = `<div style="margin-top:24px;padding:14px 20px;border:1px dashed rgba(239,68,68,.25);border-radius:10px;max-width:520px;margin-left:auto;margin-right:auto;background:rgba(239,68,68,.02);">
      <div style="font-size:10px;color:var(--fc-danger);letter-spacing:3px;font-weight:700;margin-bottom:6px;">BRIDGETTE RULE ACTIVATED</div>
      <div style="font-size:11px;color:rgba(240,249,255,.45);">${bt.name} crossed the finish without ${(bt.missing || []).join(', ')}. Auto last place.</div>
    </div>`;
  }

  const content = `
    <div class="fc-divider"><span>Results</span></div>
    <div class="fc-results">
      <div class="fc-results-title">RACE COMPLETE</div>
      <div class="fc-results-sub">Final Standings</div>
      ${cardsHtml}
      ${bridgetteBox}
    </div>
    <div class="fc-controls" id="fc-controls-${suffix}">
      <button class="fc-btn fc-btn-p" onclick="frozenCrossingRevealNext('${screenKey}',${totalSteps})">▶ Reveal Next</button>
      <span class="fc-counter" id="fc-counter-${suffix}">0 / ${totalSteps}</span>
      <button class="fc-btn" onclick="frozenCrossingRevealAll('${screenKey}',${totalSteps})">⏩ Reveal All</button>
    </div>`;

  return _shell(content, ep, screenKey);
}
