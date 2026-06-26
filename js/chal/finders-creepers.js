// js/chal/finders-creepers.js — Finders Creepers: a found-footage night scavenger hunt (pre-merge tribe challenge)
// Signature mechanic: FEWEST members lost wins. The mutant spider + booby traps WEB members out of the hunt.
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
// Archetypes that panic in the dark / around the spider → likelier to be captured
const SKITTISH_ARCHS = new Set(['underdog', 'floater', 'goat']);
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
  h => `${h} stands at the dark tree line, lit only by a flashlight under his chin. "Welcome to the scariest night of your lives. Three cursed locations. Three souvenirs to find."`,
  h => `"Here's the twist," ${h} grins, the camera grain crawling over his face. "Something is out there. It WANTS you. Every teammate it takes is a point off your team."`,
  h => `${h} clicks on a lantern. "The team that comes back with the MOST bodies — sorry, members — wins immunity. Lose the most, you're at tribal. Good luck. You'll need it."`,
  h => `"Forest, then cemetery, then the cave," ${h} counts on his fingers. "Find the souvenir at each. Don't get webbed. Try not to scream." He pauses. "Actually, scream. It's great TV."`,
];

const HOST_PHASE = {
  forest: [
    h => `"PHASE ONE!" ${h}'s voice echoes off the pines. "The Haunted Forest. The first souvenir hides in a knothole — guarded by something with too many arms."`,
    h => `${h} points his flashlight into the black trees. "Find the key. Mind the mines. And whatever you do… don't go alone."`,
  ],
  cemetery: [
    h => `"The Pet Cemetery," ${h} whispers into a bullhorn, which defeats the purpose. "Decode the grave date. Dig up the coffin. The flashlights are inside. So are the worms."`,
    h => `${h} leans on a crooked headstone. "Phase two. Read the dates, find the right grave, dig. Watch the grease pits. They're a real… slippery slope."`,
  ],
  cave: [
    h => `"THE CAVE!" ${h} bellows, then lowers his voice. "Six hooks. One zipline. Find them, clip in, and ride to the finish — if the spider lets you."`,
    h => `${h} stands at the cave mouth, mist pouring out. "Last phase. Six grappling hooks hidden in the dark. Then zip out. First team home matters — but bodies matter more."`,
  ],
};

const HOST_WINNER = [
  (h, w) => `${h} raises the immunity totem. "${w} came back with the most members! Fewest lost takes it — immunity is YOURS!"`,
  (h, w) => `"${w} wins!" ${h} is grinning ear to ear. "You didn't finish first. You finished ALIVE. That's what counts tonight."`,
  (h, w) => `${h} nods at ${w}. "Most of you made it back. Immunity to ${w}. The rest of you — see you at the campfire."`,
];

const HOST_LOSER = [
  (h, l) => `${h} shakes his head at ${l}. "You left too many behind out there. Tribal council. Tonight."`,
  (h, l) => `"${l}…" ${h} counts the empty spots. "The forest ate half your team. I'll see you at tribal."`,
  (h, l) => `${h} doesn't smile. "${l}, you lost the most members. Somebody's going home — again. Tribal awaits."`,
];

// ── FOREST: knothole key ──
const FOREST_FIND = [
  (n, pr) => `${n} jams ${pr.posAdj} arm into the knothole — a tentacle grabs it. ${pr.Sub} hauls back, decks the mutant tree-squid in the eye, and rips out KEY #1.`,
  (n, pr) => `The tree-squid hisses, but ${n} doesn't flinch. ${pr.Sub} yanks the souvenir key free and holds it up like a trophy.`,
  (n, pr) => `${n} spots the right knothole, reaches past the slick tentacles, and closes ${pr.posAdj} fist around cold metal. First souvenir, secured.`,
  (n, pr) => `While everyone else hesitates, ${n} plunges ${pr.posAdj} hand into the dark and comes out with KEY #1. "Was that so hard?"`,
];

const FOREST_FUMBLE = [
  (n, pr) => `${n} reaches into the wrong knothole and a tentacle slaps ${pr.obj} backward into the leaves. The key stays hidden.`,
  (n, pr) => `${n} tiptoes around the minefield, freezes at a clicking sound, and retreats empty-handed. The knothole keeps its secret.`,
  (n, pr) => `${n} gets a finger on the key — then the tree-squid clamps down. ${pr.Sub} jerks free, but the souvenir is gone for now.`,
];

const MINE_DODGE = [
  (n, pr) => `A trip-mine clicks under ${n}'s boot. ${pr.Sub} freezes, lifts ${pr.posAdj} foot, and steps off it in one smooth motion. Lucky.`,
  (n, pr) => `${n} reads the leaf pattern, spots the buried mine, and threads around it like ${pr.sub} ${pr.sub === 'they' ? 'have' : 'has'} done this before.`,
  (n, pr) => `${n} hears the faint hiss of a pressure plate and dives sideways. The mine erupts harmlessly behind ${pr.obj}.`,
];

// ── CEMETERY: grave-date dig ──
const CEM_FIND = [
  (n, pr) => `${n} decodes the grave date — adds the numbers, finds the plot — and digs up a coffin packed with FLASHLIGHTS. "Got 'em!"`,
  (n, pr) => `${n} reads the chiseled date by phone-light, paces off the rows, and hauls the right coffin lid open. Souvenir number two.`,
  (n, pr) => `The riddle clicks for ${n}. ${pr.Sub} marks the grave, drives the shovel in, and pulls up a box of flashlights.`,
  (n, pr) => `${n} cross-references the dates the others ignored, then unearths the coffin in record time. Smart digging.`,
];

const CEM_FUMBLE = [
  (n, pr) => `${n} digs the wrong grave, hits nothing but dirt and a very offended raccoon, and has to start over.`,
  (n, pr) => `${n} miscounts the date and wanders the rows of headstones, shovel dragging. The clue stays uncracked.`,
  (n, pr) => `${n} cracks the date but the soil is frozen solid. ${pr.Sub} barely dents it before the spider's shadow falls across the plot.`,
];

const GREASE_DODGE = [
  (n, pr) => `${n}'s foot slides toward a grease-filled grave — ${pr.sub} windmills, grabs a headstone, and stays upright. Barely.`,
  (n, pr) => `${n} spots the slick sheen on the open grave and edges around it on the balls of ${pr.posAdj} feet. No slip tonight.`,
];

// ── CAVE: hooks + zipline ──
const CAVE_FIND = [
  (n, pr) => `${n} sweeps the cave wall, finds the last grappling hook glinting in the mist, and clips into the zipline. "RIDE OR DIE!"`,
  (n, pr) => `${n} gathers six hooks from the dark crevices, snaps the harness shut, and launches down the zipline toward the finish.`,
  (n, pr) => `${n} reads the cave like a map — six hooks in six niches — then zips out over the chasm, whooping the whole way.`,
];

const CAVE_FUMBLE = [
  (n, pr) => `${n} can only find five hooks. ${pr.Sub} doubles back into the dark just as the spider's legs scrape the cave ceiling.`,
  (n, pr) => `${n} clips in wrong, the harness slips, and ${pr.sub} has to re-rig while precious seconds bleed away.`,
];

// ── CAPTURE / WEBBING ──
const SPIDER_CAPTURE = [
  (n, pr) => `A web snaps down from the canopy — ${n} is yanked off-screen mid-stride. The flashlight spins on the ground.`,
  (n, pr) => `The mutant spider drops behind ${n}. By the time ${pr.sub} turns, the silk already has ${pr.posAdj} legs. Gone.`,
  (n, pr) => `${n} hears the clicking too late. Eight legs, one web, and ${pr.sub}'s cocooned to a tree before ${pr.sub} can scream.`,
  (n, pr) => `Something huge moves in the dark. ${n} bolts — straight into a tripwire of silk. The spider reels ${pr.obj} in.`,
];

const SPIDER_CAPTURE_PANIC = [
  (n, pr) => `${n} freezes — fear of the dark wins. ${pr.Sub} doesn't even run when the web comes down. Webbed, eyes wide.`,
  (n, pr) => `Arachnophobia takes over. ${n} sees the legs and locks up completely. The spider doesn't even hurry.`,
  (n, pr) => `${n} panics at the first skittering sound, sprints the wrong way, and runs right into the cocoon. Taken.`,
];

const TRAP_CAPTURE = [
  (n, pr) => `${n} steps onto a hidden pressure plate. The net springs — ${pr.sub}'s hoisted into the canopy, webbed and dangling. Out.`,
  (n, pr) => `A grease-grave gives way under ${n}. ${pr.Sub} slides in, stuck fast, easy pickings. The spider claims ${pr.obj}.`,
  (n, pr) => `A snare trap whips shut around ${n}'s ankle. ${pr.Sub} swings upside down, webbed before ${pr.sub} can cut loose.`,
];

const RESIST_CAPTURE = [
  (n, pr) => `The web lashes out — but ${n} ducks, rolls, and comes up running. Too quick to catch.`,
  (n, pr) => `${n} feels the air move, throws ${pr.ref} flat, and the silk sails overhead. ${pr.Sub} keeps moving, heart pounding.`,
  (n, pr) => `The spider lunges. ${n} stares it down, sidesteps, and keeps hunting like nothing happened. Ice cold.`,
  (n, pr) => `A trap clicks — ${n} reads it, vaults it, and lands clean on the far side. Not today.`,
];

// ── SOCIAL: heroic rescue ──
const RESCUE_TEXT = [
  (a, b, aPr) => `${a} hears ${b} screaming in the web, charges back into the dark, and tears ${pronouns(b).obj} loose before the spider can drag ${pronouns(b).obj} under.`,
  (a, b, aPr) => `Adrenaline kicks in. ${a} rips the silk apart with bare hands and hauls ${b} out of the cocoon. "I've got you. RUN."`,
  (a, b, aPr) => `${a} refuses to leave ${b} behind. ${aPr.Sub} cuts the web, drags ${pronouns(b).obj} clear, and they sprint into the dark together.`,
  (a, b, aPr) => `${a} sees ${b} webbed to the tree and doesn't think — just acts. Two yanks and ${b} is free, gasping but safe.`,
];

// ── SOCIAL: self-sabotage ──
const SABOTAGE_TEXT = [
  (a, b, aPr) => `"Bye-bye, dead weight." ${a} 'accidentally' shoves ${b} into a grease-filled grave and strolls on, leaving ${pronouns(b).obj} stuck in the dark — easy prey.`,
  (a, b, aPr) => `${a} kicks over ${b}'s flashlight and walks off whistling. Alone in the black, ${b} doesn't last long.`,
  (a, b, aPr) => `${a} 'forgets' to warn ${b} about the tripwire ahead. The net takes ${pronouns(b).obj}. ${aPr.Sub} doesn't look back.`,
  (a, b, aPr) => `${a} quietly cuts ${b}'s harness strap and points ${pronouns(b).obj} toward the spider's nest. "Souvenir's that way." It isn't.`,
];

// ── SOCIAL: panic / coward ──
const PANIC_TEXT = [
  (n, pr) => `${n} hears the clicking, drops the souvenir, and bolts the wrong way screaming. The team loses ground.`,
  (n, pr) => `${n} refuses to go past the tree line. "Nope. NOPE." ${pr.Sub} hangs back while ${pr.posAdj} team pushes on without ${pr.obj}.`,
  (n, pr) => `A shadow moves and ${n} hits the dirt, covering ${pr.posAdj} head. The spider isn't even close yet.`,
];

// ── SOCIAL: clutch find / brave moment ──
const BRAVE_TEXT = [
  (n, pr) => `${n} walks straight toward the skittering sound, flashlight steady. "Come on then." The team rallies behind ${pr.obj}.`,
  (n, pr) => `While others freeze, ${n} grabs the souvenir off the spider's web itself. Pure nerve.`,
  (n, pr) => `${n} plants ${pr.ref} between the spider and a webbed teammate, swinging a torch. "Back. OFF."`,
];

// ── SOCIAL: bonding / teamwork ──
const BOND_TEXT = [
  (a, b) => `${a} and ${b} move back to back through the dark, covering each other's blind spots. Trust, forged in fear.`,
  (a, b) => `${a} shares ${pronouns(a).posAdj} flashlight with ${b} when ${pronouns(b).pos} dies. They navigate the cemetery as one.`,
  (a, b) => `${a} and ${b} crack the grave-date riddle together, finishing each other's math. The bond grows.`,
];

// ── SOCIAL: showmance distraction (text only; mechanic via romance hooks) ──
const SHOWMANCE_TEXT = [
  (a, b) => `The team finds ${a} and ${b} huddled close behind a gravestone instead of digging. Two souvenirs slip away while they… reconnect.`,
  (a, b) => `${a} and ${b} keep "checking on each other" in the dark. Romantic. Also, the spider is RIGHT THERE.`,
];

// ── ATMOSPHERE / TICKER ──
const TICKER_MESSAGES = [
  'CAM 04: Heat signature detected in the canopy. Large. Moving.',
  'AUDIO: Unidentified clicking recorded near the cemetery gate.',
  'ADVISORY: Two grease-graves reported open near the dig site.',
  'TRACKING: One team member off-grid in the forest. Status unknown.',
  'WARNING: Battery levels low on three flashlights.',
  'NOTE: The "tree-squid" is, per craft services, animatronic. Probably.',
  'FEED: Webbing material recovered. Tensile strength: alarming.',
  'STATUS: Cave entrance mist density rising. Visibility near zero.',
  'POLL: 68% of viewers think the spider is someone we know.',
  'HOST CHATTER: "This is the best Halloween special we have ever done."',
  'MEDICAL: One twisted ankle. Several twisted nerves.',
  'COUNT: Members remaining is now the only stat that matters.',
];

const ATMOSPHERE_FLAVOR = [
  'A branch snaps somewhere in the dark. Nobody admits they heard it.',
  'The flashlight beams catch a hundred eyes reflecting back. They blink, then vanish.',
  'Fog rolls low over the graves like something exhaling.',
  'The clicking sound is closer now. Or maybe that\'s just the cameras.',
  'A flock of bats peels off the cave mouth and scatters into the night.',
  'Cold mist beads on every lens. The picture goes grainy, then clears.',
  'Somewhere, a strand of silk swings empty where a player used to be.',
  'The wind dies. The forest holds its breath. So does everyone in it.',
  'A flashlight rolls across the dirt, beam spinning, owner nowhere in sight.',
  'The moon ducks behind a cloud and the whole island goes pitch black for three seconds.',
  'Eight legs scrape across stone, just out of frame. The REC light keeps blinking.',
  'Static washes the feed. When it clears, one more spot in the lineup is empty.',
];

// ── EXPLORATION / NAVIGATION (per-location, between the find + capture beats) ──
const FOREST_NAV = [
  (n, pr) => `${n} pushes deeper into the pines, flashlight carving a narrow tunnel through the black. Every trunk looks like it has too many arms.`,
  (n, pr) => `${n} reads the clue again by the dying beam: "a knothole, guarded by a pest." ${pr.Sub} scans the bark for the team-color markings.`,
  (n, pr) => `Branches claw at ${n} as ${pr.sub} sweep${pr.sub === 'they' ? '' : 's'} the canopy overhead. Something up there is sweeping back.`,
  (n, pr) => `${n} steps over a root, freezes at a wet clicking sound, and waves the team forward in total silence.`,
  (n, pr) => `The forest floor is a minefield of leaves and trip-wires. ${n} picks a careful path, one boot at a time.`,
];
const CEM_NAV = [
  (n, pr) => `${n} moves between the leaning headstones, phone-light skimming chiseled dates: 1806… 1818… "The math is here somewhere."`,
  (n, pr) => `Fog pools around ${n}'s ankles as ${pr.sub} count${pr.sub === 'they' ? '' : 's'} the rows of graves. Something shifts behind the mausoleum.`,
  (n, pr) => `${n} kneels at a fresh-looking plot, brushes off the dirt, and squints at the worn numbers. The coffin's close.`,
  (n, pr) => `A grease-grave yawns open three feet from ${n}. ${pr.Sub} gives it a wide berth and keeps reading dates.`,
  (n, pr) => `${n} paces off the grave rows like a treasure map, muttering the date code under ${pr.posAdj} breath.`,
];
const CAVE_NAV = [
  (n, pr) => `${n} edges into the cave, mist so thick the flashlight only lights ${pr.posAdj} own hand. Six hooks. Somewhere in here.`,
  (n, pr) => `Water drips in the dark and every drop makes ${n} flinch. ${pr.Sub} sweep${pr.sub === 'they' ? '' : 's'} the walls for a glint of metal.`,
  (n, pr) => `${n} finds the first grappling hook wedged in a crevice and clips it to ${pr.posAdj} belt. Five to go.`,
  (n, pr) => `The zipline cable hums somewhere overhead. ${n} follows it deeper, counting hooks as ${pr.sub} go${pr.sub === 'they' ? '' : 'es'}.`,
  (n, pr) => `Eight legs scrape stone behind ${n}. ${pr.Sub} doesn't look back — just hunts faster for the last hook.`,
];

// ══════════════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════════════

const LOCATIONS = [
  { key: 'forest', name: 'The Haunted Forest', souvenir: 'Knothole Key', icon: 'forest',
    find: FOREST_FIND, fumble: FOREST_FUMBLE, trapDodge: MINE_DODGE, nav: FOREST_NAV, trap: 'trip-mine', findStat: ['boldness', 'physical'] },
  { key: 'cemetery', name: 'The Pet Cemetery', souvenir: 'Coffin of Flashlights', icon: 'cemetery',
    find: CEM_FIND, fumble: CEM_FUMBLE, trapDodge: GREASE_DODGE, nav: CEM_NAV, trap: 'grease-grave', findStat: ['mental', 'intuition'] },
  { key: 'cave', name: 'The Cave', souvenir: 'Six Hooks + Zipline', icon: 'cave',
    find: CAVE_FIND, fumble: CAVE_FUMBLE, trapDodge: GREASE_DODGE, nav: CAVE_NAV, trap: 'snare', findStat: ['endurance', 'intuition'] },
];

// Per-player capture-risk: high intuition/boldness/temperament resist; panic (skittish arch / low temperament) raises risk.
function captureRisk(name, phobiaActive) {
  const s = pStats(name);
  const a = arch(name);
  // base resistance from composure stats (proportional)
  const resist = s.intuition * 0.4 + s.boldness * 0.35 + s.temperament * 0.35;
  let risk = 6.6 - resist * 0.42 + noise(3.0);
  // phobia amplifiers — fear of the dark / arachnophobia
  if (phobiaActive) {
    if (SKITTISH_ARCHS.has(a)) risk += 1.8;
    if (s.temperament <= 4) risk += 1.4;
    if (s.boldness <= 4) risk += 0.8;
  }
  return risk;
}

export function simulateFindersCreepers(ep) {
  _usedTexts.clear();

  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return ep;

  const allActive = tribes.flatMap(t => t.members);
  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  allActive.forEach(n => { ep.chalMemberScores[n] = 0; });

  const tribeOf = {};
  tribes.forEach(t => t.members.forEach(m => { tribeOf[m] = t.name; }));

  // Per-tribe trackers
  const webbed = {};        // tribeName -> Set of captured member names
  const progress = {};      // tribeName -> { forest, cemetery, cave } completion flags
  const finishOrder = [];   // tribeNames in order of completing the cave
  tribes.forEach(t => {
    webbed[t.name] = new Set();
    progress[t.name] = { forest: false, cemetery: false, cave: false };
  });

  const phaseEvents = { forest: [], cemetery: [], cave: [] };

  // Spider identity — a costumed eliminated player, or Chef
  const eliminatedPool = (gs.eliminated || []).filter(n => !allActive.includes(n));
  const spiderName = eliminatedPool.length > 0 ? pick(eliminatedPool) : null;
  const spiderLabel = spiderName || 'Chef in a suit';

  // ══ RUN EACH LOCATION ══
  LOCATIONS.forEach((loc, locIdx) => {
    const events = phaseEvents[loc.key];

    // 0) HOST PHASE INTRO — Chris sets up the location
    events.push({
      type: 'host', player: host(), loc: loc.key,
      text: pick(HOST_PHASE[loc.key])(host()),
      badge: `PHASE ${locIdx + 1} · ${loc.name.toUpperCase()}`, badgeClass: 'host'
    });

    tribes.forEach((tribe, tribeIdx) => {
      const survivors = tribe.members.filter(m => !webbed[tribe.name].has(m));
      if (survivors.length === 0) return;

      // 0b) EXPLORATION — 1-2 navigation/atmosphere cards as the team pushes in
      const navCount = 1 + (Math.random() < 0.6 ? 1 : 0);
      const navPool = [...survivors];
      for (let nv = 0; nv < navCount && navPool.length; nv++) {
        const explorer = navPool.splice(Math.floor(Math.random() * navPool.length), 1)[0];
        ep.chalMemberScores[explorer] += 1;
        events.push({
          type: 'nav', player: explorer, tribe: tribe.name, loc: loc.key,
          text: _pickUnique(loc.nav, explorer, pronouns(explorer)),
          badge: 'IN THE DARK', badgeClass: 'nav'
        });
      }

      // 1) FIND the souvenir — best-suited survivor leads the attempt
      const [s1, s2] = loc.findStat;
      const finder = [...survivors].sort((a, b) =>
        (pStats(b)[s1] + pStats(b)[s2]) - (pStats(a)[s1] + pStats(a)[s2]))[0];
      const fStats = pStats(finder);
      const findScore = (fStats[s1] * 0.5 + fStats[s2] * 0.4 + fStats.mental * 0.1) * noise(2.5);
      const fPr = pronouns(finder);

      if (findScore > 2 || progress[tribe.name][loc.key]) {
        progress[tribe.name][loc.key] = true;
        ep.chalMemberScores[finder] += 6;
        popDelta(finder, 2);
        events.push({
          type: 'find', player: finder, tribe: tribe.name, loc: loc.key,
          text: _pickUnique(loc.find, finder, fPr),
          badge: `★ ${loc.souvenir.toUpperCase()}`, badgeClass: 'find'
        });
      } else {
        events.push({
          type: 'fumble', player: finder, tribe: tribe.name, loc: loc.key,
          text: _pickUnique(loc.fumble, finder, fPr),
          badge: 'STALLED', badgeClass: 'sab'
        });
        // a fumble still counts as eventual progress (they're slower, but they get it)
        progress[tribe.name][loc.key] = true;
        ep.chalMemberScores[finder] += 2;
      }

      // 2) TRAP DODGE flavor — up to 2 other survivors thread the booby traps
      const others = survivors.filter(m => m !== finder);
      const dodgeCount = others.length >= 2 ? 2 : others.length;
      const dodgePool = [...others];
      for (let dd = 0; dd < dodgeCount; dd++) {
        if (dd === 1 && Math.random() > 0.55) break; // 2nd dodge is ~55% likely
        const dodger = dodgePool.splice(Math.floor(Math.random() * dodgePool.length), 1)[0];
        ep.chalMemberScores[dodger] += 1;
        events.push({
          type: 'trapDodge', player: dodger, tribe: tribe.name, loc: loc.key,
          text: _pickUnique(loc.trapDodge, dodger, pronouns(dodger)),
          badge: 'NEAR MISS', badgeClass: 'save'
        });
      }

      // 3) CAPTURE PASS — the spider/traps hunt each surviving member
      survivors.forEach(member => {
        if (webbed[tribe.name].has(member)) return;
        // phobia amplifier is location-driven: dark forest & cave + spider presence
        const phobiaActive = loc.key === 'forest' || loc.key === 'cave';
        const risk = captureRisk(member, phobiaActive);
        const captureThreshold = 5.0 + locIdx * 0.55; // escalates as the hunt goes on
        if (risk > captureThreshold) {
          // CAPTURED
          webbed[tribe.name].add(member);
          ep.chalMemberScores[member] -= 3;
          const isTrap = Math.random() < 0.4;
          const isPanic = !isTrap && (SKITTISH_ARCHS.has(arch(member)) || pStats(member).temperament <= 4) && Math.random() < 0.5;
          const pool = isTrap ? TRAP_CAPTURE : isPanic ? SPIDER_CAPTURE_PANIC : SPIDER_CAPTURE;
          events.push({
            type: 'capture', player: member, tribe: tribe.name, loc: loc.key,
            text: pick(pool)(member, pronouns(member)),
            lostCount: webbed[tribe.name].size,
            badge: `${tribe.name.toUpperCase()} — ${webbed[tribe.name].size} LOST`, badgeClass: 'cap'
          });
          if (isPanic) popDelta(member, -1);
        } else if (risk > captureThreshold - 2 && Math.random() < 0.5) {
          // narrow escape — composure shows
          ep.chalMemberScores[member] += 2;
          popDelta(member, 1);
          events.push({
            type: 'resist', player: member, tribe: tribe.name, loc: loc.key,
            text: pick(RESIST_CAPTURE)(member, pronouns(member)),
            badge: 'ESCAPED THE WEB', badgeClass: 'save'
          });
        }
      });

      // 4) HEROIC RESCUE — a nice/brave survivor can free a webbed teammate
      const stillUp = tribe.members.filter(m => !webbed[tribe.name].has(m));
      const captured = [...webbed[tribe.name]];
      if (captured.length > 0 && stillUp.length > 0) {
        const rescuers = stillUp.filter(m =>
          NICE_ARCHS.has(arch(m)) || arch(m) === 'hero' || pStats(m).loyalty >= 6 || pStats(m).boldness >= 7);
        if (rescuers.length > 0 && Math.random() < 0.5) {
          const rescuer = pick(rescuers);
          const saved = pick(captured);
          const rStats = pStats(rescuer);
          const rescueScore = (rStats.boldness * 0.4 + rStats.physical * 0.3 + rStats.loyalty * 0.3) * noise(2.5);
          if (rescueScore > 3) {
            webbed[tribe.name].delete(saved);
            ep.chalMemberScores[rescuer] += 5;
            popDelta(rescuer, 3);
            addBond(rescuer, saved, 1.2);
            events.push({
              type: 'rescue', player: rescuer, saved, tribe: tribe.name, loc: loc.key,
              text: pick(RESCUE_TEXT)(rescuer, saved, pronouns(rescuer)),
              lostCount: webbed[tribe.name].size,
              badge: `✚ RESCUE · ${saved} FREED`, badgeClass: 'save'
            });
            ep.campEvents[tribe.name].post.push({
              type: 'fc-rescue',
              text: `${rescuer} risked the spider to cut ${saved} out of the webs during Finders Creepers. ${saved} won't forget it.`,
              players: [rescuer, saved], badgeText: 'HEROIC RESCUE', badgeClass: 'badge-positive'
            });
          }
        }
      }

      // 5) SELF-SABOTAGE — a schemer feeds a teammate to the spider
      const sabSurvivors = tribe.members.filter(m => !webbed[tribe.name].has(m));
      const targets = sabSurvivors;
      if (sabSurvivors.length >= 2 && Math.random() < 0.28) {
        const saboteur = sabSurvivors.find(m => canSabotage(m));
        if (saboteur) {
          // frame/feed the lowest-bond teammate who is still up
          const victims = sabSurvivors.filter(m => m !== saboteur);
          if (victims.length > 0) {
            const victim = victims.sort((a, b) => getBond(saboteur, a) - getBond(saboteur, b))[0];
            webbed[tribe.name].add(victim);
            ep.chalMemberScores[saboteur] -= 1;
            ep.chalMemberScores[victim] -= 2;
            popDelta(saboteur, -2);
            addBond(saboteur, victim, -1.5);
            // temporary heat on the saboteur
            const expiresEp = (gs.episodeHistory?.length || 0) + 2;
            gs._findersCreepersHeat = gs._findersCreepersHeat || {};
            gs._findersCreepersHeat[saboteur] = { amount: 1.5, expiresEp };
            events.push({
              type: 'sabotage', player: saboteur, victim, tribe: tribe.name, loc: loc.key,
              text: pick(SABOTAGE_TEXT)(saboteur, victim, pronouns(saboteur)),
              lostCount: webbed[tribe.name].size,
              badge: `⚠ SABOTAGE · HEAT +1.5`, badgeClass: 'sab'
            });
            ep.campEvents[tribe.name].post.push({
              type: 'fc-sabotage',
              text: `${saboteur} deliberately left ${victim} for the spider during Finders Creepers, costing the team a member.`,
              players: [saboteur, victim], badgeText: 'FED TO THE SPIDER', badgeClass: 'badge-negative'
            });
          }
        }
      }

      // 6) BRAVE / PANIC / BOND social beat — up to 2 per tribe per location
      for (let sb = 0; sb < 2; sb++) {
        if (sb === 1 && Math.random() > 0.6) break; // 2nd social beat ~60% likely
        const socialUp = tribe.members.filter(m => !webbed[tribe.name].has(m));
        if (socialUp.length === 0) break;
        const roll = Math.random();
        const a = pick(socialUp);
        const aS = pStats(a);
        if (roll < 0.30 && (aS.boldness >= 6 || arch(a) === 'hero' || arch(a) === 'challenge-beast')) {
          ep.chalMemberScores[a] += 3;
          popDelta(a, 2);
          events.push({
            type: 'brave', player: a, tribe: tribe.name, loc: loc.key,
            text: _pickUnique(BRAVE_TEXT, a, pronouns(a)),
            badge: 'NERVES OF STEEL', badgeClass: 'save'
          });
        } else if (roll < 0.55 && (aS.boldness <= 4 || aS.temperament <= 4 || SKITTISH_ARCHS.has(arch(a)))) {
          ep.chalMemberScores[a] -= 1;
          popDelta(a, -2);
          events.push({
            type: 'panic', player: a, tribe: tribe.name, loc: loc.key,
            text: _pickUnique(PANIC_TEXT, a, pronouns(a)),
            badge: 'PANIC', badgeClass: 'sab'
          });
        } else if (socialUp.length >= 2) {
          const b = socialUp.filter(m => m !== a)[Math.floor(Math.random() * (socialUp.length - 1))];
          if (b) {
            addBond(a, b, 0.6);
            events.push({
              type: 'bond', players: [a, b], tribe: tribe.name, loc: loc.key,
              text: _pickUnique(BOND_TEXT, a, b),
              badge: 'TRUST', badgeClass: 'save'
            });
          }
        }
      }

      // 7) Showmance moment (uses romance.js — respects romance toggle + cap internally)
      const stillStanding = tribe.members.filter(m => !webbed[tribe.name].has(m));
      _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, `finders creepers ${loc.key}`, stillStanding);

      // 8) ATMOSPHERE interstitial — found-footage dread between teams (~65%)
      if (Math.random() < 0.65) {
        events.push({
          type: 'atmosphere', loc: loc.key,
          text: pick(ATMOSPHERE_FLAVOR),
        });
      }
    });

    // Mark cave completion order (finish line). Rank tribes that completed the
    // cave by how well they performed there (avg member score in this phase),
    // NOT by tribe-array order — otherwise tribes[0] always "finishes first" and
    // wins every tie. Random jitter breaks exact ties without favoring anyone.
    if (loc.key === 'cave') {
      const caveScore = {};
      tribes.forEach(t => {
        const ms = t.members.map(m => ep.chalMemberScores[m] || 0);
        caveScore[t.name] = (ms.reduce((a, b) => a + b, 0) / Math.max(1, ms.length)) + (Math.random() - 0.5);
      });
      tribes
        .filter(t => progress[t.name].cave && !finishOrder.includes(t.name))
        .sort((a, b) => caveScore[b.name] - caveScore[a.name])
        .forEach(t => finishOrder.push(t.name));
    }
  });

  // Romance spark hooks across the whole cast
  for (let i = 0; i < allActive.length; i++)
    for (let j = i + 1; j < allActive.length; j++)
      _challengeRomanceSpark(allActive[i], allActive[j], ep, null, null, ep.chalMemberScores || {}, 'finders creepers');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'finders creepers', allActive);

  // ══ DETERMINE WINNER: FEWEST MEMBERS LOST (size-fair) ══
  // Rank by the FRACTION of the team lost, not the raw count — otherwise a bigger
  // tribe is unfairly penalized (captures are per-member rolls, so expected raw
  // losses scale with size, while expected fraction lost is size-independent).
  // For equal-size tribes this ranks identically to raw count, so the common case
  // is unchanged and still reads as "fewest lost."
  const standings = tribes.map(t => {
    const lost = webbed[t.name].size;
    const size = Math.max(1, t.members.length);
    const lostFraction = lost / size;
    const remaining = t.members.length - lost;
    const completed = Object.values(progress[t.name]).filter(Boolean).length;
    const finishRank = finishOrder.indexOf(t.name);
    return {
      name: t.name, lost, size, lostFraction, remaining, completed,
      // finishRank: -1 if never finished the cave → worst; otherwise 0 = first
      finishRank: finishRank === -1 ? 99 : finishRank,
    };
  });

  // Sort: smallest fraction lost first; tie → fewest raw lost; tie → most
  // locations completed; tie → finished cave earliest.
  standings.sort((a, b) =>
    (a.lostFraction - b.lostFraction) ||
    (a.lost - b.lost) ||
    (b.completed - a.completed) ||
    (a.finishRank - b.finishRank));

  const winnerTribeName = standings[0].name;
  const loserTribeName = standings[standings.length - 1].name;
  const tribesSorted = standings.map(s => s.name);

  const winnerTribe = gs.tribes.find(t => t.name === winnerTribeName);
  const loserTribe = gs.tribes.find(t => t.name === loserTribeName);

  // Spider reveal flavor: cure the most arachnophobic active player's fear
  const scaredPlayer = [...allActive].sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];

  // ══ FINALIZE ══
  ep.findersCreepers = {
    phaseEvents,
    locations: LOCATIONS.map(l => ({ key: l.key, name: l.name, souvenir: l.souvenir, icon: l.icon })),
    progress,
    webbed: Object.fromEntries(Object.entries(webbed).map(([k, v]) => [k, [...v]])),
    standings,
    tribesSorted,
    winner: winnerTribeName,
    loser: loserTribeName,
    finishOrder,
    spiderName: spiderLabel,
    spiderRevealed: spiderName,
    scaredPlayer,
    tribes: tribes.map(t => ({
      name: t.name,
      members: [...t.members],
      webbed: [...webbed[t.name]],
      lost: webbed[t.name].size,
      remaining: t.members.length - webbed[t.name].size,
      isWinner: t.name === winnerTribeName,
    })),
    hostIntro: pick(HOST_INTRO)(host()),
    hostForest: pick(HOST_PHASE.forest)(host()),
    hostCemetery: pick(HOST_PHASE.cemetery)(host()),
    hostCave: pick(HOST_PHASE.cave)(host()),
    hostWinner: pick(HOST_WINNER)(host(), winnerTribeName),
    hostLoser: pick(HOST_LOSER)(host(), loserTribeName),
  };

  ep.isFindersCreepers = true;
  ep.challengeType = 'tribe';
  ep.challengeLabel = 'Finders Creepers';
  ep.challengeCategory = 'hunt';

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

  // Top scorer bonus (winning tribe member who scored highest)
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

// ══════════════════════════════════════════════════════════════════════
// VP BUILDERS — found-footage horror
// ══════════════════════════════════════════════════════════════════════

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

function _fcUpdateSidebar(screenKey) {
  const sideEl = document.getElementById('fc-sidebar-inner');
  if (!sideEl) return;
  const epRecord = window._fcEpRecord || gs.episodeHistory?.[window.vpEpNum - 1];
  if (!epRecord?.findersCreepers) return;
  sideEl.innerHTML = _buildSidebarContent(epRecord, screenKey);
}

export function fcrRevealNext(screenKey, totalSteps) {
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
}

export function fcrRevealAll(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    st.idx = st.total - 1;
    const suffix = screenKey.replace('fc-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
  } catch (e) { console.warn('FC revealAll error:', e); }
  try { _fcUpdateSidebar(screenKey); } catch (e) { /* sidebar update optional */ }
}

// ── AVATARS ──
function _av(name, cls = '') {
  const initial = (name || '?').charAt(0).toUpperCase();
  return `<span class="fc-iav${cls ? ' ' + cls : ''}"><img src="assets/avatars/${slug(name)}.png" alt="${name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><b>${initial}</b></span>`;
}

function _badgeClass(cls) {
  return cls === 'find' ? 'fc-b-find' : cls === 'save' ? 'fc-b-save' : cls === 'sab' ? 'fc-b-sab' :
    cls === 'cap' ? 'fc-b-cap' : cls === 'love' ? 'fc-b-love' : cls === 'nav' ? 'fc-b-nav' :
    cls === 'host' ? 'fc-b-host' : 'fc-b-find';
}

// ── SIDEBAR CONTENT (live "MEMBERS REMAINING") ──
function _buildSidebarContent(ep, screenKey) {
  const fc = ep.findersCreepers;
  if (!fc) return '';

  const revIdx = _tvState[screenKey]?.idx ?? -1;
  // progressive webbed snapshot from per-screen meta on window
  const metaKey = screenKey === 'fc-forest' ? '_fcForestMeta' :
    screenKey === 'fc-cemetery' ? '_fcCemeteryMeta' :
    screenKey === 'fc-cave' ? '_fcCaveMeta' : null;
  const meta = metaKey ? window[metaKey] : null;
  const snap = (meta && revIdx >= 0 && meta[revIdx]) ? meta[revIdx] : null;

  let html = `<div class="fc-track"><h3>◈ MEMBERS REMAINING ◈</h3>`;

  fc.tribes.forEach(tribe => {
    const tc = tribeColor(tribe.name);
    // determine webbed set at this point in the reveal
    let webbedSet;
    if (snap && snap.webbed && snap.webbed[tribe.name]) {
      webbedSet = new Set(snap.webbed[tribe.name]);
    } else if (screenKey === 'fc-title' || revIdx < 0) {
      webbedSet = new Set(); // start: nobody webbed
    } else {
      webbedSet = new Set(tribe.webbed); // results screens: final state
    }
    const remaining = tribe.members.length - webbedSet.size;
    html += `<div class="fc-team-head" style="color:${tc};border-bottom-color:${tc}55;"><span>${tribe.name.toUpperCase()}</span><span class="fc-count">${remaining} / ${tribe.members.length}</span></div>`;
    tribe.members.forEach(name => {
      const isWebbed = webbedSet.has(name);
      html += `<div class="fc-mem${isWebbed ? ' webbed' : ''}">${_av(name, 'sm')}<span class="fc-name-sm">${name}</span>${isWebbed ? '<span class="tag">WEBBED</span>' : ''}</div>`;
    });
  });
  html += `</div>`;

  // progress board
  html += `<div class="fc-prog">`;
  const progSnap = snap?.progress || fc.progress;
  fc.locations.forEach(loc => {
    const cells = fc.tribes.map(t => {
      const done = progSnap[t.name]?.[loc.key];
      const init = t.name.slice(0, 3).toUpperCase();
      return `${init} ${done ? '✓' : '…'}`;
    }).join(' · ');
    html += `<div class="row"><span class="loc">${_locGlyph(loc.icon)} ${loc.name.replace('The ', '')}</span><span>${cells}</span></div>`;
  });
  html += `</div>`;

  return html;
}

function _locGlyph(icon) {
  return icon === 'forest' ? '🌲' : icon === 'cemetery' ? '⚰' : '🕳';
}

function _buildSidebar(ep, screenKey) {
  return `<div class="fc-side"><div id="fc-sidebar-inner">${_buildSidebarContent(ep, screenKey)}</div></div>`;
}

// ── CONTROLS ──
function _buildControls(screenKey, total) {
  const suffix = screenKey.replace('fc-', '');
  return `<div class="fc-ctrl" id="fc-controls-${suffix}">
    <span class="fc-counter" id="fc-counter-${suffix}">0 / ${total}</span>
    <button class="fc-btn primary" onclick="fcrRevealNext('${screenKey}',${total})">NEXT ▶</button>
    <button class="fc-btn" onclick="fcrRevealAll('${screenKey}',${total})">REVEAL ALL</button>
  </div>`;
}

// ── EVENT CARD ──
function _card(event, idx, screenKey) {
  const suffix = screenKey.replace('fc-', '');
  const badge = event.badge ? `<span class="fc-badge ${_badgeClass(event.badgeClass)}">${event.badge}</span>` : '';
  const tc = _playerTribeColor(event.tribe);
  const teamCls = event.tribe ? `<span class="fc-team" style="color:${tc};border-color:${tc}55;background:${tc}1a;">${(event.tribe || '').toUpperCase()}</span>` : '';

  // Atmosphere interstitial — centered, italic found-footage dread (no player)
  if (event.type === 'atmosphere') {
    return `<div class="fc-atmos" id="fc-step-${suffix}-${idx}">${event.text}</div>`;
  }

  // Host phase-intro card — host avatar + distinct framing
  if (event.type === 'host') {
    return `<div class="fc-card fc-host beam" id="fc-step-${suffix}-${idx}">
      <div class="who">${_av(event.player, 'big')}<div class="fc-name">${event.player}</div>
        ${event.badge ? `<span class="fc-badge ${_badgeClass(event.badgeClass)}">${event.badge}</span>` : ''}</div>
      <div class="body">${event.text}</div>
    </div>`;
  }

  // Special glitch CAPTURE card
  if (event.type === 'capture') {
    return `<div class="fc-capture" id="fc-step-${suffix}-${idx}">
      <div class="fc-static"></div>
      <div class="fc-cap-who"><div class="fc-capwrap">${_av(event.player, 'big')}
        <svg class="fc-capweb" viewBox="0 0 100 100" preserveAspectRatio="none"><g stroke="rgba(223,230,238,.7)" fill="none" stroke-width=".6"><path d="M50,0 V100 M0,50 H100 M0,0 L100,100 M100,0 L0,100"/><circle cx="50" cy="50" r="16"/><circle cx="50" cy="50" r="32"/></g></svg>
      </div></div>
      <div class="fc-glitch">WEBBED</div>
      <div class="fc-victim">${event.text} <span style="color:var(--fc-rec)">${event.badge || ''}</span></div>
    </div>`;
  }

  const who = event.player
    ? `${_av(event.player, 'big')}<div class="fc-name">${event.player}</div>${teamCls}`
    : event.players
      ? `${_av(event.players[0], 'big')}<div class="fc-name">${event.players.join(' & ')}</div>${teamCls}`
      : `<div class="fc-name">${event.tribe || ''}</div>`;

  return `<div class="fc-card beam" id="fc-step-${suffix}-${idx}">
    <div class="who">${who}</div>
    <div class="body">${event.text}</div>
    ${badge}
  </div>`;
}

function _playerTribeColor(tribeName) {
  if (!tribeName) return '#5fe39a';
  return tribeColor(tribeName) || '#5fe39a';
}

// ── AMBIENT BACKGROUND ──
function _buildAmbient() {
  let spores = '';
  for (let i = 0; i < 26; i++) {
    const left = ((i * 37 + 11) % 100);
    const dur = 9 + (i % 12);
    const delay = -((i * 0.7) % dur);
    const sz = 2 + (i % 2);
    const green = i % 3 === 0;
    spores += `<div class="fc-spore" style="left:${left}%;width:${sz}px;height:${sz}px;animation-duration:${dur}s;animation-delay:${delay}s;${green ? 'background:#7fe0a0;box-shadow:0 0 6px #7fe0a0;' : ''}"></div>`;
  }
  return `<div class="fc-amb">
    <div class="fc-fog f1"></div><div class="fc-fog f2"></div><div class="fc-fog f3"></div>
    <div class="fc-mist"></div>
    <div class="fc-spider">🕷️</div>
    <svg class="fc-web-corner tl" viewBox="0 0 100 100"><g stroke="#cfd6e0" fill="none" stroke-width=".5"><path d="M0,0 L100,40 M0,0 L40,100 M0,0 L70,70 M0,0 L18,95 M0,0 L95,18"/><path d="M14,8 Q22,22 8,14 M30,18 Q40,40 18,30 M48,28 Q62,62 28,48"/></g></svg>
    <svg class="fc-web-corner tr" viewBox="0 0 100 100"><g stroke="#cfd6e0" fill="none" stroke-width=".5"><path d="M0,0 L100,40 M0,0 L40,100 M0,0 L70,70"/><path d="M30,18 Q40,40 18,30 M48,28 Q62,62 28,48"/></g></svg>
    <div class="fc-eyes" style="top:24%;left:8%;animation-delay:1s"><span></span><span></span></div>
    <div class="fc-eyes" style="top:64%;right:6%;animation-delay:4.5s"><span></span><span></span></div>
    <div class="fc-eyes" style="top:48%;left:82%;animation-delay:7s"><span></span><span></span></div>
    ${spores}
  </div>
  <div class="fc-grain"></div>
  <div class="fc-light"></div>`;
}

function _buildHud(loc) {
  const camLabel = loc === 'forest' ? 'CAM 04 — WAWANAKWA NORTH'
    : loc === 'cemetery' ? 'CAM 07 — PET CEMETERY'
    : loc === 'cave' ? 'CAM 11 — CAVE MOUTH' : 'CAM 01 — BASE';
  const tc = '00:' + String(14 + (window.vpEpNum || 0) % 40).padStart(2, '0') + ':32:08';
  return `<div class="fc-hud">
    <span class="fc-rec"><b></b>REC</span>
    <span class="fc-cam">${camLabel}</span>
    <span class="fc-tc">${tc}</span>
    <span class="fc-batt">PWR <i></i> 62%</span>
  </div>`;
}

// ── SHELL ──
function _fcShell(content, ep, screenKey, hudLoc) {
  const sidebar = _buildSidebar(ep, screenKey);
  window._fcEpRecord = ep;
  return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Creepster&family=Special+Elite&family=VT323&family=Inter:wght@400;600;800&display=swap');
.fc-wrap{--fc-black:#05060a;--fc-night:#090c13;--fc-panel:#0e1219;--fc-rec:#e23b3b;--fc-blood:#9b1d22;--fc-flash:#ffcf6b;--fc-flash-dim:#7a6336;--fc-bone:#e7e2d2;--fc-mute:#7d8593;--fc-ghost:#454d5a;--fc-rats:#5fe39a;--fc-maggots:#b98cff;--fc-web:#dfe6ee;}
.fc-wrap *{box-sizing:border-box;}
.fc-wrap{max-width:1100px;margin:0 auto;position:relative;min-height:100vh;overflow:hidden;padding:0 0 96px;color:var(--fc-bone);font-family:'Inter',system-ui,sans-serif;
  background:radial-gradient(ellipse at 50% 6%, #10161f 0%, var(--fc-night) 42%, var(--fc-black) 100%);}

/* ambient bg */
.fc-amb{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.fc-fog{position:absolute;width:160%;height:60%;filter:blur(40px);opacity:.5;mix-blend-mode:screen}
.fc-fog.f1{top:5%;left:-30%;background:radial-gradient(ellipse,#16323f,transparent 60%);animation:fc-fogA 46s ease-in-out infinite}
.fc-fog.f2{top:35%;left:-40%;background:radial-gradient(ellipse,#1b2540,transparent 60%);animation:fc-fogB 62s ease-in-out infinite}
.fc-fog.f3{top:60%;left:-20%;background:radial-gradient(ellipse,#241830,transparent 60%);animation:fc-fogA 54s ease-in-out infinite reverse}
@keyframes fc-fogA{0%,100%{transform:translate(0,0)}50%{transform:translate(22%,-4%)}}
@keyframes fc-fogB{0%,100%{transform:translate(0,0)}50%{transform:translate(30%,5%)}}
.fc-mist{position:absolute;left:-20%;bottom:0;width:140%;height:140px;background:linear-gradient(0deg, rgba(120,170,150,.10), transparent);filter:blur(18px);animation:fc-mist 28s ease-in-out infinite}
@keyframes fc-mist{0%,100%{transform:translateX(0)}50%{transform:translateX(8%)}}
.fc-spore{position:absolute;bottom:-12px;width:3px;height:3px;border-radius:50%;background:var(--fc-flash);opacity:0;box-shadow:0 0 6px var(--fc-flash);animation:fc-rise linear infinite}
@keyframes fc-rise{0%{transform:translateY(0) translateX(0);opacity:0}10%{opacity:.7}90%{opacity:.5}100%{transform:translateY(-105vh) translateX(20px);opacity:0}}
.fc-eyes{position:absolute;display:flex;gap:7px;opacity:0;animation:fc-peer 9s ease-in-out infinite}
.fc-eyes span{width:7px;height:7px;border-radius:50%;background:#ff5a3c;box-shadow:0 0 8px #ff5a3c}
@keyframes fc-peer{0%,72%,100%{opacity:0}76%,88%{opacity:.85}80%{opacity:.1}}
.fc-web-corner{position:absolute;width:160px;height:160px;opacity:.18}
.fc-web-corner.tl{top:-6px;left:-6px}
.fc-web-corner.tr{top:-6px;right:-6px;transform:scaleX(-1)}
.fc-spider{position:absolute;top:18%;left:-60px;font-size:26px;opacity:.22;filter:blur(.4px);animation:fc-crawl 40s linear infinite}
@keyframes fc-crawl{0%{left:-60px;top:18%}50%{left:104%;top:30%}50.01%{left:-60px;top:55%}100%{left:104%;top:42%}}
.fc-grain{position:absolute;inset:-20%;z-index:1;pointer-events:none;opacity:.06;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");animation:fc-grain .4s steps(4) infinite}
@keyframes fc-grain{0%,100%{transform:translate(0,0)}25%{transform:translate(-2%,1%)}50%{transform:translate(1%,-2%)}75%{transform:translate(2%,1%)}}
.fc-light{position:absolute;inset:0;z-index:1;pointer-events:none;mix-blend-mode:screen;opacity:.5;
  background:radial-gradient(circle at 50% 38%, rgba(255,207,107,.10), transparent 38%);animation:fc-flick 5s infinite}
@keyframes fc-flick{0%,100%{opacity:.5}48%{opacity:.5}49%{opacity:.18}50%{opacity:.55}52%{opacity:.25}53%{opacity:.5}}

/* avatar */
.fc-iav{width:34px;height:34px;border-radius:7px;overflow:hidden;flex-shrink:0;position:relative;background:#1a2230;border:1px solid #2c3a4d;display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;}
.fc-iav img{width:100%;height:100%;object-fit:cover}
.fc-iav b{display:none;font-family:'Special Elite',serif;color:var(--fc-flash);font-size:14px}
.fc-iav.sm{width:24px;height:24px;border-radius:5px}
.fc-iav.sm b{font-size:11px}
.fc-iav.big{width:46px;height:46px;border-radius:9px}

/* HUD */
.fc-hud{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;padding:10px 16px;font-family:'VT323',monospace;font-size:20px;letter-spacing:1px;
  background:linear-gradient(180deg,rgba(5,6,10,.96),rgba(5,6,10,.4));border-bottom:1px solid #1a2230}
.fc-rec{display:inline-flex;align-items:center;gap:8px;color:var(--fc-rec)}
.fc-rec b{width:12px;height:12px;border-radius:50%;background:var(--fc-rec);box-shadow:0 0 10px var(--fc-rec);animation:fc-blink 1.1s steps(2,start) infinite}
@keyframes fc-blink{50%{opacity:.15}}
.fc-tc{color:var(--fc-flash)}.fc-cam{color:var(--fc-mute)}
.fc-batt{display:inline-flex;align-items:center;gap:6px;color:var(--fc-mute)}
.fc-batt i{width:26px;height:12px;border:2px solid var(--fc-mute);border-radius:2px;position:relative;display:inline-block}
.fc-batt i::before{content:'';position:absolute;inset:1px;width:55%;background:var(--fc-flash)}

/* title */
.fc-title{text-align:center;padding:36px 16px 14px;position:relative;z-index:2}
.fc-title .kick{font-family:'VT323',monospace;color:var(--fc-rec);letter-spacing:4px;font-size:18px}
.fc-title h1{font-family:'Creepster',cursive;font-size:clamp(44px,9vw,86px);margin:6px 0 4px;color:var(--fc-bone);text-shadow:0 0 18px rgba(255,207,107,.25), 2px 2px 0 #000;letter-spacing:2px}
.fc-title .sub{font-family:'Special Elite',serif;color:var(--fc-mute);font-size:14px}
.fc-title .host{font-family:'Special Elite',serif;color:var(--fc-flash);margin-top:14px;font-size:14px;border:1px dashed var(--fc-flash-dim);display:inline-block;padding:8px 16px;border-radius:4px;max-width:680px}
.fc-lineup{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:18px auto 0;max-width:760px}
.fc-lineup-lbl{font-family:'VT323',monospace;color:var(--fc-mute);letter-spacing:3px;font-size:14px;margin-top:14px}

/* layout */
.fc-body{display:grid;grid-template-columns:1fr 280px;gap:18px;padding:0 18px;position:relative;z-index:2}
@media(max-width:820px){.fc-body{grid-template-columns:1fr}}
.fc-phase-hdr{text-align:center;padding:24px 16px 4px;position:relative;z-index:2}
.fc-phase-hdr .ph{font-family:'Creepster',cursive;font-size:clamp(30px,6vw,52px);color:var(--fc-bone);text-shadow:0 0 14px rgba(255,207,107,.2)}
.fc-phase-hdr .psub{font-family:'VT323',monospace;color:var(--fc-mute);letter-spacing:3px;font-size:15px}

/* feed */
.fc-feed{display:flex;flex-direction:column;gap:14px}
.fc-card{position:relative;background:linear-gradient(180deg,rgba(15,20,29,.92),rgba(11,15,22,.92));border:1px solid #1d2735;border-radius:12px;padding:14px 16px;box-shadow:0 8px 24px rgba(0,0,0,.5);opacity:0;transform:translateY(18px);}
.fc-card.fc-visible{animation:fc-card-in .55s cubic-bezier(.16,1,.3,1) forwards}
@keyframes fc-card-in{to{opacity:1;transform:translateY(0)}}
.fc-card .who{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.fc-name{font-family:'Special Elite',serif;font-size:15px}
.fc-team{font-family:'VT323',monospace;font-size:13px;letter-spacing:1px;margin-left:auto;padding:2px 8px;border-radius:4px;border:1px solid}
.fc-card .body{font-size:14px;line-height:1.6;color:#cfd6e0;font-family:'Special Elite',serif}
.fc-card .body strong{color:var(--fc-flash)}
.fc-badge{display:inline-block;font-family:'VT323',monospace;font-size:13px;letter-spacing:1px;padding:2px 8px;border-radius:4px;margin-top:8px}
.fc-b-find{color:var(--fc-flash);background:rgba(255,207,107,.12);border:1px solid var(--fc-flash-dim)}
.fc-b-save{color:var(--fc-rats);background:rgba(95,227,154,.12);border:1px solid rgba(95,227,154,.35)}
.fc-b-sab{color:var(--fc-rec);background:rgba(226,59,59,.12);border:1px solid rgba(226,59,59,.35)}
.fc-b-cap{color:var(--fc-rec);background:rgba(226,59,59,.12);border:1px solid rgba(226,59,59,.35)}
.fc-b-love{color:#ff8fd0;background:rgba(255,143,208,.12);border:1px solid rgba(255,143,208,.35)}
.fc-b-nav{color:var(--fc-mute);background:rgba(125,133,147,.12);border:1px solid rgba(125,133,147,.35)}
.fc-b-host{color:var(--fc-rec);background:rgba(226,59,59,.1);border:1px solid rgba(226,59,59,.4);letter-spacing:2px}
/* host phase-intro card */
.fc-host{border-left:3px solid var(--fc-rec);background:linear-gradient(180deg,rgba(28,12,14,.55),rgba(11,15,22,.92))}
/* atmosphere interstitial — found-footage dread strip */
.fc-atmos{position:relative;text-align:center;font-family:'Special Elite',serif;font-style:italic;color:var(--fc-mute);
  font-size:13px;letter-spacing:.5px;padding:12px 18px;margin:2px 0;opacity:0;transform:translateY(14px);
  border-top:1px dashed rgba(125,133,147,.22);border-bottom:1px dashed rgba(125,133,147,.22)}
.fc-atmos::before{content:'◦ ';color:var(--fc-rec)}.fc-atmos::after{content:' ◦';color:var(--fc-rec)}
.fc-atmos.fc-visible{animation:fc-card-in .5s ease forwards}
.fc-card.beam::after{content:'';position:absolute;top:-30px;left:30px;width:120px;height:160px;pointer-events:none;background:radial-gradient(ellipse at top, rgba(255,207,107,.16), transparent 70%);transform:rotate(8deg)}

/* capture card */
.fc-capture{position:relative;border:2px solid var(--fc-rec);background:#0a0608;text-align:center;padding:22px 16px;overflow:hidden;border-radius:12px;opacity:0;transform:translateY(18px);}
.fc-capture.fc-visible{animation:fc-card-in .55s cubic-bezier(.16,1,.3,1) forwards, fc-shake .5s ease-in-out}
@keyframes fc-shake{0%,100%{margin-left:0}20%{margin-left:-5px}40%{margin-left:5px}60%{margin-left:-3px}80%{margin-left:3px}}
.fc-cap-who{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:6px}
.fc-glitch{font-family:'Creepster',cursive;font-size:44px;color:var(--fc-web);letter-spacing:3px;position:relative;text-shadow:0 0 14px rgba(223,230,238,.4)}
.fc-glitch::before,.fc-glitch::after{content:'WEBBED';position:absolute;left:0;top:0;width:100%}
.fc-glitch::before{color:var(--fc-rec);animation:fc-gl1 .9s infinite linear alternate;clip-path:inset(0 0 55% 0)}
.fc-glitch::after{color:#39d6ff;animation:fc-gl2 1.1s infinite linear alternate;clip-path:inset(55% 0 0 0)}
@keyframes fc-gl1{0%{transform:translate(0,0)}100%{transform:translate(-3px,1px)}}
@keyframes fc-gl2{0%{transform:translate(0,0)}100%{transform:translate(3px,-1px)}}
.fc-victim{font-family:'Special Elite',serif;font-size:14px;color:#cfd6e0;margin-top:8px}
.fc-victim strong{color:var(--fc-web)}
.fc-static{position:absolute;inset:0;opacity:.12;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='s'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23s)'/%3E%3C/svg%3E")}
.fc-capwrap{position:relative;display:inline-block}
.fc-capwrap .fc-iav{filter:grayscale(.4) brightness(.7)}
.fc-capweb{position:absolute;inset:-6px;opacity:.55;pointer-events:none}

/* map */
.fc-map{background:rgba(14,18,25,.85);border:1px solid #1c2533;border-radius:12px;padding:12px;margin-bottom:18px}
.fc-map .lbl{font-family:'VT323',monospace;color:var(--fc-mute);font-size:16px;letter-spacing:2px;margin-bottom:6px}
.fc-loc-name{font-family:'Special Elite',serif;font-size:11px;fill:var(--fc-bone)}
.fc-path{stroke:#2a3547;stroke-width:2;stroke-dasharray:5 6;fill:none}
.fc-node{fill:#11161f;stroke:#2f3b4f;stroke-width:2}
.fc-node.done{stroke:var(--fc-flash);fill:#1a1608}

/* flavor */
.fc-flavor{font-style:italic;font-size:12px;color:rgba(231,226,210,.4);font-family:'Special Elite',serif;padding:8px 14px;margin:4px 0;border-left:1px solid rgba(185,140,255,.2)}

/* sidebar */
.fc-side{align-self:start;position:sticky;top:54px}
.fc-track{background:rgba(14,18,25,.9);border:1px solid #1c2533;border-radius:12px;padding:12px;margin-bottom:14px}
.fc-track h3{font-family:'VT323',monospace;font-size:16px;letter-spacing:2px;color:var(--fc-mute);margin:0 0 8px;text-align:center}
.fc-team-head{display:flex;align-items:center;justify-content:space-between;font-family:'Special Elite',serif;font-size:13px;margin:10px 0 6px;padding-bottom:4px;border-bottom:1px solid #1c2533}
.fc-count{font-family:'VT323',monospace;font-size:15px}
.fc-mem{display:flex;align-items:center;gap:8px;padding:3px 2px;font-family:'Special Elite',serif;font-size:13px}
.fc-mem .tag{margin-left:auto;font-family:'VT323',monospace;font-size:12px;color:var(--fc-rec)}
.fc-mem.webbed{color:var(--fc-ghost)}
.fc-mem.webbed .fc-iav{filter:grayscale(1) brightness(.45)}
.fc-mem.webbed .fc-name-sm{text-decoration:line-through}
.fc-name-sm{font-size:13px}
.fc-prog{background:rgba(14,18,25,.9);border:1px solid #1c2533;border-radius:12px;padding:12px;font-family:'VT323',monospace;font-size:14px;color:var(--fc-mute)}
.fc-prog .row{display:flex;justify-content:space-between;gap:8px;padding:4px 0}.fc-prog .loc{color:var(--fc-bone)}

/* reveal + winner */
.fc-reveal{margin:18px;padding:22px;border:2px dashed var(--fc-flash-dim);border-radius:12px;text-align:center;background:rgba(10,12,18,.85);position:relative;z-index:2;opacity:0;transform:translateY(18px)}
.fc-reveal.fc-visible{animation:fc-card-in .55s cubic-bezier(.16,1,.3,1) forwards}
.fc-reveal .tag{font-family:'VT323',monospace;color:var(--fc-rec);letter-spacing:3px}
.fc-reveal h2{font-family:'Creepster',cursive;font-size:34px;margin:8px 0;color:var(--fc-bone)}
.fc-reveal .body{font-family:'Special Elite',serif;color:var(--fc-mute);font-size:14px;max-width:560px;margin:0 auto}
.fc-winner{margin:18px;padding:20px;border:2px solid var(--fc-rats);border-radius:12px;text-align:center;background:linear-gradient(180deg,rgba(95,227,154,.08),transparent);position:relative;z-index:2;opacity:0;transform:translateY(18px)}
.fc-winner.fc-visible{animation:fc-card-in .55s cubic-bezier(.16,1,.3,1) forwards}
.fc-winner .tag{font-family:'VT323',monospace;color:var(--fc-rats);letter-spacing:3px}
.fc-winner h2{font-family:'Creepster',cursive;font-size:30px;margin:6px 0;color:var(--fc-rats)}
.fc-winner .body{font-family:'Special Elite',serif;color:#cfd6e0;font-size:14px}
.fc-result-avatars{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:10px}

/* controls */
.fc-ctrl{position:fixed;bottom:0;left:0;right:0;z-index:40;display:flex;align-items:center;justify-content:center;gap:14px;padding:12px;background:linear-gradient(0deg,rgba(5,6,10,.98),rgba(5,6,10,.5))}
.fc-btn{font-family:'VT323',monospace;font-size:18px;letter-spacing:1px;padding:8px 22px;border-radius:6px;cursor:pointer;background:#11161f;color:var(--fc-bone);border:1px solid #2c3a4d}
.fc-btn.primary{background:var(--fc-blood);color:#fff;border-color:var(--fc-rec)}
.fc-counter{font-family:'VT323',monospace;color:var(--fc-mute);font-size:18px}

@media(prefers-reduced-motion:reduce){
  .fc-fog,.fc-mist,.fc-spore,.fc-eyes,.fc-spider,.fc-grain,.fc-light,.fc-rec b,.fc-glitch::before,.fc-glitch::after{animation:none!important}
  .fc-spore{display:none}
  .fc-card,.fc-capture,.fc-reveal,.fc-winner{opacity:1;transform:none}
  .fc-card.fc-visible,.fc-capture.fc-visible,.fc-reveal.fc-visible,.fc-winner.fc-visible{animation:none}
}
</style>
<div class="fc-wrap">
  ${_buildAmbient()}
  ${_buildHud(hudLoc)}
  ${content}
</div>`;
}

// ── SVG island map (3 locations, team markers) ──
function _buildMap(fc, doneSet) {
  const nodeCls = k => doneSet.has(k) ? 'fc-node done' : 'fc-node';
  // team markers spread along the path by furthest completed location
  let markers = '';
  fc.tribes.forEach((t, i) => {
    const tc = tribeColor(t.name);
    const done = fc.progress[t.name];
    let cx = 70, cy = 110;
    if (done.cave) { cx = 570; cy = 60; }
    else if (done.cemetery) { cx = 445; cy = 74; }
    else if (done.forest) { cx = 195; cy = 84; }
    cy += i * 14;
    markers += `<circle cx="${cx}" cy="${cy}" r="9" fill="${tc}" style="filter:drop-shadow(0 0 5px ${tc})"/><text x="${cx}" y="${cy - 13}" text-anchor="middle" style="font-family:'VT323',monospace;font-size:13px;font-weight:700;fill:${tc}">${t.name.slice(0, 3).toUpperCase()}</text>`;
  });
  return `<div class="fc-map"><div class="lbl">◣ TRACKING — ${fc.tribes.length} TEAMS · 3 LOCATIONS</div>
    <svg viewBox="0 0 640 160" width="100%">
      <path class="fc-path" d="M70,110 Q200,30 320,90 T570,60"/>
      <circle class="${nodeCls('forest')}" cx="70" cy="110" r="14"/><text class="fc-loc-name" x="70" y="138" text-anchor="middle">🌲 Forest</text>
      <circle class="${nodeCls('cemetery')}" cx="320" cy="90" r="14"/><text class="fc-loc-name" x="320" y="118" text-anchor="middle">⚰ Cemetery</text>
      <circle class="${nodeCls('cave')}" cx="570" cy="60" r="14"/><text class="fc-loc-name" x="570" y="88" text-anchor="middle">🕳 Cave</text>
      ${markers}
    </svg></div>`;
}

// ── meta snapshot builder for progressive sidebar ──
function _buildPhaseMeta(fc, locKey, events) {
  // running webbed sets + progress, evolving per event index
  const webbed = {};
  const progress = {};
  fc.tribes.forEach(t => { webbed[t.name] = new Set(); progress[t.name] = { forest: false, cemetery: false, cave: false }; });
  // pre-fill progress + webbed from prior locations (so cemetery starts where forest ended)
  const order = ['forest', 'cemetery', 'cave'];
  const upTo = order.indexOf(locKey);
  for (let li = 0; li < upTo; li++) {
    const pk = order[li];
    fc.tribes.forEach(t => {
      if (fc.progress[t.name][pk]) progress[t.name][pk] = true;
    });
    (fc.phaseEvents[pk] || []).forEach(e => {
      if (e.type === 'capture' && e.player) webbed[e.tribe].add(e.player);
      if ((e.type === 'rescue') && e.saved) webbed[e.tribe].delete(e.saved);
      if (e.type === 'sabotage' && e.victim) webbed[e.tribe].add(e.victim);
    });
  }
  const meta = [];
  events.forEach(e => {
    if (e.type === 'find' || e.type === 'fumble') progress[e.tribe][locKey] = true;
    if (e.type === 'capture' && e.player) webbed[e.tribe].add(e.player);
    if (e.type === 'rescue' && e.saved) webbed[e.tribe].delete(e.saved);
    if (e.type === 'sabotage' && e.victim) webbed[e.tribe].add(e.victim);
    meta.push({
      webbed: Object.fromEntries(Object.entries(webbed).map(([k, v]) => [k, [...v]])),
      progress: JSON.parse(JSON.stringify(progress)),
    });
  });
  return meta;
}

// ══════════════════════════════════════════════════════════════════════
// VP SCREENS
// ══════════════════════════════════════════════════════════════════════

export function rpBuildFCRTitleCard(ep) {
  const fc = ep.findersCreepers;
  if (!fc) return '';
  let content = `<div class="fc-title">
    <div class="kick">★ NIGHT CHALLENGE ★</div>
    <h1>Finders Creepers</h1>
    <div class="sub">A scavenger hunt in the dark — find the souvenirs, don't get taken</div>
    <div class="host">${fc.hostIntro}</div>
    <div class="fc-lineup-lbl">— TONIGHT'S HUNTERS —</div>
    <div class="fc-lineup">`;
  fc.tribes.forEach(t => t.members.forEach(m => { content += _av(m); }));
  content += `</div></div>`;
  content += `<div class="fc-body"><div>${_buildMap(fc, new Set())}</div>${_buildSidebar(ep, 'fc-title').replace('<div class="fc-side">', '<div class="fc-side">')}</div>`;
  return _fcShell(content, ep, 'fc-title', 'base');
}

function _buildPhaseScreen(ep, locKey, locName, sub, hostLine, screenKey) {
  const fc = ep.findersCreepers;
  if (!fc) return '';
  const events = fc.phaseEvents[locKey] || [];
  const total = events.length;
  _ensureState(screenKey, total);

  // progressive meta for the sidebar
  const metaKey = locKey === 'forest' ? '_fcForestMeta' : locKey === 'cemetery' ? '_fcCemeteryMeta' : '_fcCaveMeta';
  window[metaKey] = _buildPhaseMeta(fc, locKey, events);

  // which locations are already done entering this phase (for the map)
  const doneSet = new Set();
  if (locKey !== 'forest') doneSet.add('forest');
  if (locKey === 'cave') doneSet.add('cemetery');

  let feed = '';
  const shuffledAtmo = [...ATMOSPHERE_FLAVOR].sort(() => Math.random() - 0.5);
  let atmoIdx = 0;
  events.forEach((evt, idx) => {
    if (idx > 0 && idx % 4 === 0) {
      feed += `<div class="fc-flavor">${shuffledAtmo[atmoIdx % shuffledAtmo.length]}</div>`;
      atmoIdx++;
    }
    feed += _card(evt, idx, screenKey);
  });

  let content = `<div class="fc-phase-hdr"><div class="ph">${locName}</div><div class="psub">${sub}</div></div>`;
  content += `<div class="fc-body"><div>`;
  content += _buildMap(fc, doneSet);
  content += `<div class="host" style="display:block;margin:0 0 14px;font-family:'Special Elite',serif;color:var(--fc-flash);font-size:13px;border:1px dashed var(--fc-flash-dim);padding:10px 14px;border-radius:4px;">${hostLine}</div>`;
  content += `<div class="fc-feed">${feed}</div>`;
  content += `</div>${_buildSidebar(ep, screenKey)}</div>`;
  content += _buildControls(screenKey, total);
  return _fcShell(content, ep, screenKey, locKey);
}

export function rpBuildFCRForest(ep) {
  const fc = ep.findersCreepers;
  if (!fc) return '';
  return _buildPhaseScreen(ep, 'forest', 'The Haunted Forest', 'FIND THE KEY // MIND THE MINES', fc.hostForest, 'fc-forest');
}

export function rpBuildFCRCemetery(ep) {
  const fc = ep.findersCreepers;
  if (!fc) return '';
  return _buildPhaseScreen(ep, 'cemetery', 'The Pet Cemetery', 'DECODE // DIG // DON\'T SLIP', fc.hostCemetery, 'fc-cemetery');
}

export function rpBuildFCRCave(ep) {
  const fc = ep.findersCreepers;
  if (!fc) return '';
  return _buildPhaseScreen(ep, 'cave', 'The Cave', 'SIX HOOKS // ZIP OUT // SURVIVE', fc.hostCave, 'fc-cave');
}

export function rpBuildFCRResults(ep) {
  const fc = ep.findersCreepers;
  if (!fc) return '';
  const screenKey = 'fc-results';
  const steps = [];

  // 1) spider unmasked
  steps.push(`<div class="fc-reveal">
    <div class="tag">◤ UNMASKED ◢</div>
    <div style="display:flex;justify-content:center;margin:6px 0 10px">${fc.spiderRevealed ? _av(fc.spiderRevealed, 'big') : '<span class="fc-iav big"><img src="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><b>?</b></span>'}</div>
    <h2>The spider was… ${fc.spiderName}</h2>
    <div class="body">The mutant spider rips off its head — ${fc.spiderRevealed ? 'a former castaway in a mechanical suit the whole time' : 'Chef, sweating inside a mechanical suit'}. ${fc.scaredPlayer}'s arachnophobia is cured. The nightmares are just beginning.</div>
  </div>`);

  // 2) winner card
  const winnerTribe = fc.tribes.find(t => t.name === fc.winner);
  const loserStanding = fc.standings.find(s => s.name === fc.loser);
  const winStanding = fc.standings.find(s => s.name === fc.winner);
  steps.push(`<div class="fc-winner">
    <div class="tag">★ CHALLENGE RESULT ★</div>
    <h2>${fc.winner} win${winnerTribe && winnerTribe.members.length === 1 ? 's' : 's'}</h2>
    <div class="body">${fc.hostWinner}<br><br>Fewest lost takes it — <strong style="color:var(--fc-rats)">${winStanding.remaining} of ${winStanding.remaining + winStanding.lost}</strong> made it back${loserStanding ? ` against ${fc.loser}'s ${loserStanding.remaining} of ${loserStanding.remaining + loserStanding.lost}` : ''}.</div>
    <div class="fc-result-avatars">${(winnerTribe?.members || []).map(m => _av(m, 'big')).join('')}</div>
  </div>`);

  // 3) loser → tribal
  const loserTribe = fc.tribes.find(t => t.name === fc.loser);
  steps.push(`<div class="fc-reveal" style="border-color:rgba(226,59,59,.4)">
    <div class="tag" style="color:var(--fc-rec)">⚰ TRIBAL COUNCIL ⚰</div>
    <h2 style="color:var(--fc-rec)">${fc.loser}</h2>
    <div class="body">${fc.hostLoser}</div>
    <div class="fc-result-avatars">${(loserTribe?.members || []).map(m => _av(m, 'big')).join('')}</div>
  </div>`);

  // 4) standings board
  let standRows = fc.standings.map((s, i) => {
    const tc = tribeColor(s.name);
    const place = i === 0 ? '1ST' : i === fc.standings.length - 1 ? 'LAST' : `${i + 1}TH`;
    return `<div style="display:flex;justify-content:space-between;font-family:'Special Elite',serif;font-size:14px;padding:6px 0;border-bottom:1px solid #1c2533"><span style="color:${tc}">${place} · ${s.name}</span><span style="font-family:'VT323',monospace;color:var(--fc-mute)">${s.remaining} kept · ${s.lost} webbed · ${s.completed}/3 sites</span></div>`;
  }).join('');
  steps.push(`<div class="fc-reveal" style="border-style:solid;border-color:#1c2533;text-align:left">
    <div class="tag" style="text-align:center;display:block">◈ FINAL TALLY ◈</div>
    <div style="margin-top:10px">${standRows}</div>
  </div>`);

  const total = steps.length;
  _ensureState(screenKey, total);

  let content = `<div class="fc-phase-hdr"><div class="ph">The Reckoning</div><div class="psub">UNMASKED // TALLIED // JUDGED</div></div>`;
  content += `<div class="fc-body"><div>`;
  steps.forEach((html, idx) => {
    // inject the step id onto the outer element
    content += html.replace(/^(<div class="fc-(?:reveal|winner)")/, `$1 id="fc-step-results-${idx}"`);
  });
  content += `</div>${_buildSidebar(ep, screenKey)}</div>`;
  content += _buildControls(screenKey, total);
  return _fcShell(content, ep, screenKey, 'base');
}
