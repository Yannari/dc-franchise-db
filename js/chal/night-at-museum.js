// js/chal/night-at-museum.js — Night at the Museum: pre-merge tribe challenge (security breach + gallery search + assembly)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const _pickUsed = {};
function _pickUnique(arr, tag) {
  if (!arr?.length) return null;
  if (!_pickUsed[tag]) _pickUsed[tag] = new Set();
  let avail = arr.filter(x => !_pickUsed[tag].has(x));
  if (!avail.length) { _pickUsed[tag].clear(); avail = arr; }
  const choice = avail[Math.floor(Math.random() * avail.length)];
  _pickUsed[tag].add(choice);
  return choice;
}
function noise(range = 2.5) { return (Math.random() - 0.5) * range; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function portrait(name, size = 42) {
  const sl = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${sl}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:4px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }

function vb(p, singular, plural) { return p.Sub === 'They' ? (plural || singular.replace(/s$/, '')) : singular; }

const NICE_ARCHS = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN_ARCHS = new Set(['villain', 'mastermind', 'schemer']);

function canScheme(name) {
  const a = arch(name);
  if (VILLAIN_ARCHS.has(a)) return true;
  if (NICE_ARCHS.has(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}
function isNice(name) { return NICE_ARCHS.has(arch(name)); }
function isVillain(name) { return VILLAIN_ARCHS.has(arch(name)); }

// ══════════════════════════════════════════════════════════════
// NARRATION TEXT POOLS
// ══════════════════════════════════════════════════════════════

// ── Phase 1: Security Breach ──
const SECURITY_PASS = [
  (n, p) => `${n} drops flat, rolling under the first laser grid with inches to spare. ${p.Sub} ${vb(p, 'times')} the camera sweep perfectly.`,
  (n, p) => `Moving like a shadow, ${n} glides through the pressure corridor without touching a single tile.`,
  (n, p) => `${n} reads the pattern, waits three beats, then slips through the sensor field like water through cracks.`,
  (n, p) => `${n} presses against the wall and sidesteps past every beam. ${p.Sub} ${vb(p, 'makes', 'make')} it look easy.`,
  (n, p) => `${n} mirrors the camera's rhythm — step, pause, step, pause — until ${p.Sub}'s through. Not even close.`,
  (n, p) => `${n} spots the blind spot between two sweeping cameras and threads the needle. Not a single alarm.`,
  (n, p) => `Low and fast. ${n} darts between marble columns, freezing whenever a red beam sweeps past ${p.posAdj} shoulder.`,
  (n, p) => `${n} exhales, goes still, then bursts through the corridor in one fluid sprint. Clean entry.`,
  (n, p) => `${n} counts the laser pulses under ${p.posAdj} breath — three, two, one — and dives through the gap.`,
  (n, p) => `The camera pans left. ${n} moves right. By the time it pans back, ${p.Sub}'s already gone.`,
  (n, p) => `${n} hugs the ceiling molding and shimmy-walks over two pressure tiles. Not a sound.`,
  (n, p) => `${n} finds a dead zone where three sensor fields overlap — and stands in the one pixel none of them cover.`,
  (n, p) => `${n} watches the guard patrol route from the shadows, then slips through the moment they pass. Professional.`,
  (n, p) => `Flat against the floor. ${n} army-crawls beneath the lowest laser, chin barely clearing the marble.`,
];

const SECURITY_FAIL = [
  (n, p) => `${n} clips a motion sensor with ${p.posAdj} elbow. The red light snaps on. Alarm.`,
  (n, p) => `${n} hesitates mid-step and the pressure plate clicks beneath ${p.posAdj} foot. Sirens wail.`,
  (n, p) => `The laser grid shifts pattern and ${n} doesn't adapt fast enough. ${p.Sub} ${vb(p, 'triggers', 'trigger')} the alarm.`,
  (n, p) => `${n} misjudges the camera timing and steps right into its sweep. The alarm blares.`,
  (n, p) => `A stumble. ${n}'s hand hits the glass case and the vibration sensor goes off. So much for stealth.`,
  (n, p) => `${n} freezes at the wrong moment — right in front of a heat sensor. The museum lights up red.`,
  (n, p) => `${n} thought ${p.Sub} cleared the last beam. ${p.Sub} didn't. The corridor floods with red light.`,
  (n, p) => `${n}'s shoe squeaks on marble. The acoustic sensor catches it. Alarm.`,
  (n, p) => `One tile. One wrong tile. ${n} feels it sink under ${p.posAdj} weight a half-second before the siren.`,
  (n, p) => `${n} lunges for the gap but ${p.posAdj} shadow crosses a photo-beam. The system doesn't forgive shadows.`,
  (n, p) => `${n} steps through what looked like a safe corridor — but a hidden floor laser catches ${p.posAdj} ankle.`,
  (n, p) => `${n} sneezes. In a museum with acoustic sensors. The alarm doesn't care about allergies.`,
];

const TEAMMATE_TIP = [
  (tipper, target, tp) => `${tipper} catches ${target}'s eye and taps ${tp.posAdj} own shoulder twice — the signal for "go left." ${target} nods.`,
  (tipper, target, tp) => `"Third tile from the right," ${tipper} whispers. ${target} adjusts ${pronouns(target).posAdj} approach.`,
  (tipper, target, tp) => `${tipper} holds up three fingers behind ${tp.posAdj} back. ${target} sees it and times the cameras.`,
  (tipper, target, tp) => `${tipper} traces the safe path with a fingertip from behind. ${target} follows the invisible map.`,
];

const SHOWMANCE_CALM = [
  (a, b, ap) => `${a} squeezes ${b}'s hand before the run. "You've got this." ${b}'s breathing steadies.`,
  (a, b, ap) => `${a} and ${b} lock eyes. No words. ${b} nods and moves with new confidence.`,
  (a, b, ap) => `"Hey. Focus on me for a second." ${a}'s voice cuts through ${b}'s nerves. It works.`,
  (a, b, ap) => `${a} brushes ${b}'s arm on the way past. Subtle. But ${b}'s hands stop shaking.`,
];

const ANIMAL_STARTLE = [
  (n, p) => `A taxidermied owl's eyes suddenly glow red. ${n} flinches hard and nearly steps into a beam.`,
  (n, p) => `Something skitters across the marble floor behind ${n}. ${p.Sub} ${vb(p, 'whips', 'whip')} around — museum rat. ${p.Sub} ${vb(p, 'loses', 'lose')} focus.`,
  (n, p) => `The animatronic T-Rex head swivels toward ${n}. ${p.Sub} ${vb(p, 'knows', 'know')} it's fake. ${p.Sub} still ${vb(p, 'jumps', 'jump')}.`,
  (n, p) => `A night bird slams into the skylight above ${n}. Glass rattles. ${p.Sub} ${vb(p, 'stumbles', 'stumble')}.`,
];

const VILLAIN_GUINEA_PIG = [
  (villain, target, vp) => `${villain} shoves ${target} forward. "You go first. Test the sensors." A cruel smile.`,
  (villain, target, vp) => `"Age before beauty," ${villain} mutters, pushing ${target} toward the laser grid.`,
  (villain, target, vp) => `${villain} "accidentally" bumps ${target} into the sensor zone. "Oops."`,
  (villain, target, vp) => `${villain} hangs back and lets ${target} walk point. If something triggers, better them.`,
];

const HERO_SCOUTS = [
  (n, p) => `${n} steps forward. "I'll go first. Watch where I step." The team falls in behind ${p.obj}.`,
  (n, p) => `"Nobody moves until I clear it." ${n} takes point without being asked.`,
  (n, p) => `${n} rolls ${p.posAdj} shoulders and enters the corridor first. If there's a trap, ${p.sub} ${vb(p, 'takes', 'take')} it.`,
  (n, p) => `"I've got this. Just follow my path." ${n} moves into the darkness ahead of everyone.`,
];

const SELF_PSYCHE_OUT = [
  (n, p) => `${n}'s hands are shaking. ${p.Sub} can't stop thinking about what happens if ${p.sub} ${vb(p, 'fails', 'fail')}.`,
  (n, p) => `${n} freezes at the entrance. Too many sensors. Too many cameras. Too many ways to mess up.`,
  (n, p) => `"I can't do this," ${n} mutters. Then ${p.sub} ${vb(p, 'goes', 'go')} anyway, rattled.`,
  (n, p) => `${n} psyches ${p.ref} out staring at the laser grid. By the time ${p.sub} ${vb(p, 'moves', 'move')}, ${p.posAdj} timing is off.`,
];

const RIVAL_DISTRACTION = [
  (rival, target, rp) => `${rival} catches ${target}'s attention from across the hall and makes a throat-cutting gesture. ${target} loses focus.`,
  (rival, target, rp) => `"Hey ${target}!" ${rival} stage-whispers. ${target} turns — right into a camera sweep.`,
  (rival, target, rp) => `${rival} drops a coin on the marble floor. The clang echoes. ${target} flinches mid-step.`,
  (rival, target, rp) => `${rival} flashes a light at ${target} from across the room, killing ${pronouns(target).posAdj} night vision.`,
];

const BLAME_TEXT = [
  (blamer, target, bp) => `${blamer} rounds on ${target}. "That alarm was YOUR fault. We're all paying for it now."`,
  (blamer, target, bp) => `"Smooth move," ${blamer} snaps at ${target}. The sarcasm could cut glass.`,
  (blamer, target, bp) => `${blamer} doesn't say anything to ${target}. ${bp.Sub} doesn't have to. The look says it all.`,
  (blamer, target, bp) => `"Who let ${target} go through security?" ${blamer} asks nobody in particular, loud enough for everyone to hear.`,
  (blamer, target, bp) => `${blamer} shakes ${bp.posAdj} head as the alarm dies down. "Thanks for that, ${target}. Really helpful."`,
];

const CLEAN_SWEEP = [
  (tribe) => `${tribe} moves through the security wing like they were born in the dark. Not a single alarm. Flawless.`,
  (tribe) => `Zero alarms. ${tribe} clears the entire security gauntlet without triggering so much as a blinking light.`,
  (tribe) => `Every member of ${tribe} threads the needle. The museum doesn't even know they're here.`,
  (tribe) => `${tribe} pulls off a clean sweep through security. The kind of performance that makes the other tribe nervous.`,
];

// ── Phase 2: Gallery Search ──
const GALLERY_NAMES = ['Sculpture Hall', 'Ancient Wing', 'Modern Gallery', 'The Vault'];

const GALLERY_INTROS = {
  'Sculpture Hall': [
    'Marble figures loom in the half-light. Every pedestal casts a long shadow.',
    'Rows of stone bodies stand frozen mid-gesture. The air smells of old marble and polish.',
    'Classical statues fill the hall — warriors, gods, lovers — all watching in silence.',
  ],
  'Ancient Wing': [
    'Sarcophagi line the walls. Hieroglyphs shimmer faintly under emergency lighting.',
    'The Ancient Wing is cold. Glass cases hold artifacts that haven\'t moved in centuries. Until tonight.',
    'Gold and turquoise gleam from display cases. The air tastes like dust and history.',
  ],
  'Modern Gallery': [
    'Abstract shapes hang from wires. In the dark, every installation looks like a threat.',
    'Neon installations cast pools of color across the polished floor. Nothing in here looks real.',
    'The Modern Gallery hums with hidden electronics. Motion-sensor art. Bad timing.',
  ],
  'The Vault': [
    'The Vault door stands open — barely. Inside, the museum\'s most valuable pieces wait behind triple glass.',
    'Climate-controlled. Laser-gridded. The Vault is the hardest room in the museum.',
    'Reinforced cases. Infrared beams. This is where the museum keeps what it doesn\'t want found.',
  ],
};

const STATUE_TYPES = {
  classical: { label: 'Classical Figure', pieces: 6, desc: 'A towering marble figure — six heavy pieces that demand both brawn and brains.',
    slots: [
      { id: 'base', label: 'Base', weight: 5, wLabel: 'HEAVY' },
      { id: 'torso', label: 'Torso', weight: 4, wLabel: 'HEAVY' },
      { id: 'larm', label: 'Left Arm', weight: 2, wLabel: 'LIGHT' },
      { id: 'rarm', label: 'Right Arm', weight: 2, wLabel: 'LIGHT' },
      { id: 'head', label: 'Head', weight: 3, wLabel: 'MED' },
      { id: 'crown', label: 'Crown', weight: 1, wLabel: 'CROWN' },
    ] },
  ancient: { label: 'Ancient Relic', pieces: 4, desc: 'A four-piece archaeological artifact. Fewer pieces, but the relic attracts... attention.',
    slots: [
      { id: 'base', label: 'Stone Pedestal', weight: 4, wLabel: 'HEAVY' },
      { id: 'torso', label: 'Idol Body', weight: 3, wLabel: 'MED' },
      { id: 'head', label: 'Death Mask', weight: 2, wLabel: 'LIGHT' },
      { id: 'crown', label: 'Scepter', weight: 1, wLabel: 'CROWN' },
    ] },
  modern: { label: 'Modern Abstract', pieces: 5, desc: 'Five interlocking geometric shapes. No carrying, but one wrong placement and you start over.',
    slots: [
      { id: 'base', label: 'Frame Base', weight: 3, wLabel: 'MED' },
      { id: 'torso', label: 'Core Module', weight: 3, wLabel: 'MED' },
      { id: 'larm', label: 'Left Panel', weight: 2, wLabel: 'LIGHT' },
      { id: 'rarm', label: 'Right Panel', weight: 2, wLabel: 'LIGHT' },
      { id: 'crown', label: 'Apex', weight: 1, wLabel: 'CROWN' },
    ] },
};

const ADVOCATE_TEXT = {
  classical: [
    (n, p) => `${n} points at the Classical Figure. "Six pieces. Heavy. But we've got the muscle for it."`,
    (n, p) => `"Classical Figure. More pieces, more points, more glory." ${n} crosses ${p.posAdj} arms.`,
    (n, p) => `${n} runs ${p.posAdj} hand along the display case. "This one. We carry it. We build it. We win."`,
    (n, p) => `"I want the big one," ${n} says. "We didn't come here to play it safe."`,
  ],
  ancient: [
    (n, p) => `${n} gravitates toward the Ancient Relic. "Four pieces. Quick. Smart. In and out."`,
    (n, p) => `"The Relic's calling to me." ${n} leans closer. "I can read these symbols. I know I can."`,
    (n, p) => `${n} traces the relic's inscriptions. "Fewer pieces. We just need to decode the assembly."`,
    (n, p) => `"Ancient Relic. Less to carry, more to think." ${n} taps ${p.posAdj} temple.`,
  ],
  modern: [
    (n, p) => `${n} circles the Modern Abstract. "No carrying. Pure puzzle. I like those odds."`,
    (n, p) => `"This one's all brain, no brawn." ${n} grins at the geometric shapes. "My kind of fight."`,
    (n, p) => `${n} studies the interlocking shapes. "Modern Abstract. We solve it or we don't. No middle ground."`,
    (n, p) => `"Nobody's going to outthink us," ${n} declares, pointing at the abstract sculpture.`,
  ],
};

const DEBATE_AGREE = [
  (n, champ, statue) => `${n} nods. "I'm with ${champ}. ${statue} is the play."`,
  (n, champ, statue) => `"${champ}'s right," ${n} says. "Let's lock it in."`,
  (n, champ, statue) => `${n} steps beside ${champ}. "I've been thinking the same thing. ${statue}."`,
  (n, champ, statue) => `"That's the one." ${n} points at the ${statue}. "Let's go."`,
];

const DEBATE_DISAGREE = [
  (n, altStatue) => `${n} shakes ${pronouns(n).posAdj} head. "We should go ${altStatue}. This is a mistake."`,
  (n, altStatue) => `"Are you serious?" ${n} gestures at the ${altStatue}. "That's clearly better."`,
  (n, altStatue) => `${n} crosses ${pronouns(n).posAdj} arms. "Fine. But when this goes wrong, remember I said ${altStatue}."`,
  (n, altStatue) => `"I don't like it." ${n} stares at the options. "The ${altStatue} makes more sense for this team."`,
];

const DEBATE_CONCERN = [
  (n, statue) => `${n} looks nervous. "Are we sure about ${statue}? That's a lot of pieces to find."`,
  (n, statue) => `"What about the animals?" ${n} asks. "The ${statue} is going to attract them."`,
  (n, statue) => `${n} bites ${pronouns(n).posAdj} lip. "I trust the team. But ${statue} is risky."`,
  (n, statue) => `"Just making sure everyone's ready for this," ${n} says quietly. "The ${statue} won't be easy."`,
];

const SHORTCUT_TEXT = [
  (n, p) => `${n} finds a maintenance corridor behind a tapestry. Shortcut. ${p.Sub} ${vb(p, 'grins', 'grin')}.`,
  (n, p) => `A vent grate is loose. ${n} crawls through and emerges two galleries ahead.`,
  (n, p) => `${n} notices the floor tiles form a pattern — a path the architects left for staff. ${p.Sub} ${vb(p, 'follows', 'follow')} it.`,
  (n, p) => `"This way." ${n} ducks behind a sarcophagus and finds a service tunnel. The room opens up.`,
  (n, p) => `${n} spots a staff-only door ajar. Behind it: a freight elevator. Straight to the next gallery.`,
  (n, p) => `A rotating wall panel. ${n} presses the right spot and it swings open into an adjacent gallery.`,
  (n, p) => `${n} reads the evacuation map on the wall and finds a route the others missed.`,
  (n, p) => `Behind the restoration curtain, ${n} discovers a connecting hallway. Nobody else has been through here.`,
];

const DEAD_END_TEXT = [
  (n, p) => `${n} turns a corner and hits a locked gate. Dead end. ${p.Sub} ${vb(p, 'backtracks', 'backtrack')}, fuming.`,
  (n, p) => `The gallery loops back on itself. ${n} has been walking in circles.`,
  (n, p) => `${n} pushes through a door that leads to a broom closet. Wasted time.`,
  (n, p) => `Every corridor looks the same in the dark. ${n} realizes ${p.sub}'s back where ${p.sub} started.`,
  (n, p) => `${n} follows a promising corridor that narrows to nothing. A wall. Just a wall.`,
  (n, p) => `The fire exit is sealed. ${n} rattles the handle for five seconds before giving up.`,
  (n, p) => `${n} climbs a staircase that leads to a blocked-off restoration lab. Has to go all the way back down.`,
  (n, p) => `${n} enters what looked like a gallery annex. It's a loading dock. Nothing here.`,
];

const PIECE_FOUND_TEXT = [
  (n, p, gallery) => `${n} spots a statue fragment tucked behind a display case in ${gallery}. Piece secured.`,
  (n, p, gallery) => `Half-hidden under a velvet cloth in ${gallery}. ${n} grabs it and signals the team.`,
  (n, p, gallery) => `${n} sweeps ${p.posAdj} flashlight across ${gallery} and catches a glint. Another piece.`,
  (n, p, gallery) => `${n} runs ${p.posAdj} fingers along the wall and feels the seam. A hidden compartment. Piece inside.`,
  (n, p, gallery) => `${n} pries open a false drawer beneath a pedestal. A fragment, wrapped in cloth. ${p.Sub} ${vb(p, 'pockets', 'pocket')} it.`,
  (n, p, gallery) => `The fragment is wedged behind a suit of armor in ${gallery}. ${n} works it free with both hands.`,
  (n, p, gallery) => `${n} checks behind a painting — there. A statue piece, taped to the back of the frame.`,
  (n, p, gallery) => `Instinct. ${n} reaches into a hollow bust and pulls out a fragment. ${p.Sub} knew it was there.`,
  (n, p, gallery) => `A loose ceiling tile in ${gallery}. ${n} pushes it aside and a piece drops into ${p.posAdj} arms.`,
  (n, p, gallery) => `${n} kneels at a vent grate and spots something glinting inside. ${p.Sub} ${vb(p, 'fishes', 'fish')} it out — another piece.`,
];

const ANIMAL_DODGE_TEXT = [
  (n, p) => `A museum cat lunges from a pedestal. ${n} sidesteps and it sails past. Close.`,
  (n, p) => `${n} hears the scratch of claws on marble and ducks. Something swoops overhead and vanishes.`,
  (n, p) => `An animatronic guard dog activates. ${n} freezes. It scans past ${p.obj}. False alarm.`,
  (n, p) => `${n} spots the shadow moving before the animal does. ${p.Sub} ${vb(p, 'presses', 'press')} flat against the wall and ${vb(p, 'waits', 'wait')} it out.`,
  (n, p) => `Claws click on tile behind ${n}. ${p.Sub} doesn't look back — just moves faster. The clicking fades.`,
  (n, p) => `${n} rolls behind a column as a security drone swoops through the gallery. It doesn't circle back.`,
  (n, p) => `Something hisses from inside a display case. ${n} backs away slowly. It doesn't follow.`,
  (n, p) => `A taxidermied wolf's jaw snaps open — motion-activated. ${n} flinches but keeps moving. Just a sensor.`,
];

const ANIMAL_CAUGHT_TEXT = [
  (n, p) => `A security drone shaped like a hawk slams into ${n}. ${p.Sub} ${vb(p, 'goes', 'go')} down hard, scattering a piece.`,
  (n, p) => `The animatronic bear exhibit comes alive and swipes at ${n}. Direct hit. ${p.Sub} ${vb(p, 'drops', 'drop')} what ${p.sub} was carrying.`,
  (n, p) => `Something grabs ${n}'s ankle from under a display case. ${p.Sub} ${vb(p, 'kicks', 'kick')} free but ${vb(p, 'loses', 'lose')} ${p.posAdj} piece.`,
  (n, p) => `${n} rounds a corner and collides with a patrolling security bot. The piece goes flying.`,
  (n, p) => `A mechanical snake drops from a ceiling vent onto ${n}'s shoulders. ${p.Sub} ${vb(p, 'panics', 'panic')} and ${vb(p, 'flings', 'fling')} ${p.posAdj} piece.`,
  (n, p) => `${n} steps on a pressure plate. A claw swings from the wall and catches ${p.posAdj} arm. The piece clatters away.`,
  (n, p) => `Three museum bats converge on ${n} at once. In the chaos, ${p.sub} ${vb(p, 'loses', 'lose')} grip on the fragment.`,
  (n, p) => `The animatronic raptor lunges out of its exhibit. ${n} dodges the bite but drops everything.`,
];

const TEAMMATE_DISTRACT_TEXT = [
  (hero, target, hp) => `${hero} grabs a vase and hurls it down the far corridor. The animal chases the noise. ${target} is clear.`,
  (hero, target, hp) => `"Over here!" ${hero} waves ${hp.posAdj} arms at the creature. It turns. ${target} escapes.`,
  (hero, target, hp) => `${hero} puts ${hp.ref} between ${target} and the thing. No hesitation. The animal lunges at ${hero} instead.`,
  (hero, target, hp) => `${hero} tackles the animatronic mid-lunge. ${target} scrambles free with the piece intact.`,
];

const PIECE_RACE_TEXT = [
  (winner, loser) => `${winner} and ${loser} spot the piece at the same time. They sprint. ${winner} gets there first.`,
  (winner, loser) => `Both hands reach for the fragment. ${winner} is faster. ${loser} grabs air.`,
  (winner, loser) => `${winner} slides across the marble floor and snatches the piece from under ${loser}'s fingertips.`,
  (winner, loser) => `A footrace down the corridor. ${winner} pulls ahead and claims the piece. ${loser} slams the wall in frustration.`,
];

const CROSS_TRIBE_BLOCK_TEXT = [
  (blocker, target, bp) => `${blocker} body-checks ${target} into a display case. "Wrong hallway, friend."`,
  (blocker, target, bp) => `${blocker} steps into ${target}'s path. "This gallery's taken." ${target} has to find another way.`,
  (blocker, target, bp) => `${blocker} shoves a mobile exhibit into ${target}'s path, blocking the corridor. "Find your own route."`,
  (blocker, target, bp) => `${blocker} trips ${target} as ${pronouns(target).sub} rounds the corner. "Oops. My bad."`,
];

const CROSS_TRIBE_TAUNT_TEXT = [
  (taunter, target, tp) => `"Still looking?" ${taunter} waves a piece at ${target}. "We've already got three."`,
  (taunter, target, tp) => `${taunter} laughs as ${target} passes. "You're in the wrong wing. But I won't tell you which one's right."`,
  (taunter, target, tp) => `"Keep searching," ${taunter} calls after ${target}. "I'm sure you'll find something. Eventually."`,
  (taunter, target, tp) => `${taunter} whistles a funeral march as ${target} walks by empty-handed.`,
];

const CROSS_TRIBE_RESPECT_TEXT = [
  (a, b) => `${a} and ${b} pass each other in the corridor. A nod of respect. This isn't personal.`,
  (a, b) => `${a} watches ${b} find a piece. Impressive technique. ${a} makes a mental note.`,
  (a, b) => `${b} stumbles in the dark. ${a} — from the rival tribe — steadies ${pronouns(b).obj}. "Careful." Then walks away.`,
  (a, b) => `${a} and ${b} reach for the same door handle. They lock eyes. ${a} lets go first. "After you."`,
];

const CROSS_TRIBE_TRASH_TALK_TEXT = [
  (a, b) => `"How many pieces you got?" ${a} asks ${b}. Before ${b} can answer: "Not enough."`,
  (a, b) => `${a} holds up a statue piece as ${b} passes. Doesn't say a word. Doesn't have to.`,
  (a, b) => `"You look lost," ${a} tells ${b}. "The exit's that way. Might want to head there early."`,
  (a, b) => `${a} whistles at ${b}'s empty hands. "Rough night, huh?"`,
];

const CROSS_TRIBE_ALLIANCE_MOMENT_TEXT = [
  (a, b) => `${a} pulls ${b} aside. "After this challenge... we should talk." ${b}: "I'm listening."`,
  (a, b) => `${a} and ${b} share a look that says more than words. An understanding forming. Cross-tribal. Dangerous.`,
  (a, b) => `"You and me," ${a} whispers to ${b} between galleries. "We both know who the real threats are." ${b} nods.`,
  (a, b) => `${a} passes ${b} a hint about a piece location — for a rival tribe. Why? "You'll owe me one."`,
];

// ── Phase 2: Social events between rooms ──
const SEARCH_SOCIAL_HELP = [
  (helper, target, hp) => `${helper} points ${target} toward a gallery ${hp.sub} already cleared. "Try the second case on the left."`,
  (helper, target, hp) => `${helper} shares ${hp.posAdj} search notes with ${target}. Two heads, faster results.`,
  (helper, target, hp) => `"You're overthinking it." ${helper} guides ${target} to the right corridor. Bond of trust.`,
  (helper, target, hp) => `${helper} doubles back to help ${target} search. They cover twice the ground.`,
];

const SEARCH_SOCIAL_SABOTAGE = [
  (villain, target, vp) => `${villain} moves a piece to a different gallery when nobody's looking. ${target}'s going to search that room for nothing.`,
  (villain, target, vp) => `${villain} tells ${target} the wrong gallery. "Pretty sure I saw a piece in the east wing." There isn't one.`,
  (villain, target, vp) => `${villain} quietly locks a gallery door behind ${target}. It takes ${target} three minutes to find another exit.`,
  (villain, target, vp) => `${villain} "accidentally" triggers an alarm near ${target}'s search area. The animal patrols converge.`,
];

const SEARCH_SOCIAL_ENCOURAGE = [
  (enc, target, ep2) => `"We need you." ${enc} looks ${target} in the eye. "Keep going." ${target} does.`,
  (enc, target, ep2) => `${enc} high-fives ${target} after a find. "That's the one. We're close."`,
  (enc, target, ep2) => `"You've got the best eyes on this team." ${enc} means it. ${target} searches harder.`,
  (enc, target, ep2) => `${enc} stays close to ${target}, keeping morale up. Small talk. Bad jokes. It works.`,
];

const SEARCH_SOCIAL_RIVALRY = [
  (a, b) => `${a} and ${b} nearly come to blows over who searches the Vault first. Old grudges die hard.`,
  (a, b) => `"Stay out of my gallery," ${a} snaps at ${b}. The tension is thick enough to cut.`,
  (a, b) => `${a} deliberately searches the same room as ${b}, just to make a point. Neither of them finds anything.`,
  (a, b) => `A cold stare between ${a} and ${b} in the Ancient Wing. No words. Just heat.`,
];

const SEARCH_SOCIAL_BOND = [
  (a, b) => `${a} and ${b} find a piece together. They share a look — that one meant something.`,
  (a, b) => `${a} saves ${b} from walking into a motion sensor. "Careful." "Thanks." Something shifts between them.`,
  (a, b) => `${a} and ${b} clear a gallery in perfect sync. They barely need to talk. Trust.`,
  (a, b) => `${a} hands ${b} a flashlight without being asked. Small gesture. Big meaning in the dark.`,
];

const SEARCH_SOCIAL_SHOWMANCE = [
  (a, b) => `${a} and ${b} end up alone in the Sculpture Hall. The marble figures watch. Neither minds.`,
  (a, b) => `${a} catches ${b} staring. Not at the artifacts. "Focus," ${b} murmurs. But ${pronouns(b).sub} doesn't look away.`,
  (a, b) => `${a} and ${b} hide behind a sarcophagus together, pressed close. The proximity does things to both of them.`,
  (a, b) => `${a}'s hand finds ${b}'s in the dark gallery. They let it stay there longer than necessary.`,
];

// ── Phase 3: Assembly Under Pressure ──
const ASSEMBLY_SUCCESS = [
  (n, p) => `${n} slots the piece into place. Perfect fit. The statue takes shape.`,
  (n, p) => `Careful hands. ${n} lowers the fragment onto the base. It clicks. One more down.`,
  (n, p) => `${n} studies the join, rotates the piece fifteen degrees, and sets it. Locked in.`,
  (n, p) => `${n} holds ${p.posAdj} breath and places the piece. It sits flush. ${p.Sub} ${vb(p, 'exhales', 'exhale')}.`,
  (n, p) => `A moment of concentration, then ${n} fits the piece like ${p.sub} designed it. Clean placement.`,
];

const ASSEMBLY_FUMBLE = [
  (n, p) => `${n}'s hands slip. The piece clatters to the floor. ${p.Sub} ${vb(p, 'scrambles', 'scramble')} to pick it up.`,
  (n, p) => `The fragment doesn't sit right. ${n} pushes it, adjusts it, pushes again — wrong angle.`,
  (n, p) => `${n} misjudges the weight and nearly drops the piece off the pedestal. Precious seconds lost.`,
  (n, p) => `The join looks right but won't hold. ${n} pulls it out and starts over, jaw tight.`,
];

const WRONG_PLACEMENT = [
  (n, p) => `${n} steps back and squints. Something's off. The geometry doesn't match. Wrong placement. Start over.`,
  (n, p) => `"Wait — that's upside down." ${n} realizes too late. The whole section has to come apart.`,
  (n, p) => `The abstract shape looked right from one angle. From another, it's clearly wrong. ${n} groans.`,
  (n, p) => `${n} places the piece with confidence. Then the coordinator points out it's mirror-reversed. Back to square one.`,
];

const CARRY_SUCCESS = [
  (n, p) => `${n} hefts the marble fragment and carries it to the assembly point without breaking stride.`,
  (n, p) => `Heavy stone, steady hands. ${n} delivers the piece to the builder's station.`,
  (n, p) => `${n} muscles the fragment across the gallery. ${p.Sub} ${vb(p, 'sets', 'set')} it down gently. Ready for placement.`,
  (n, p) => `${n} bear-hugs the stone piece and shuffles it to the pedestal. Brute force works.`,
];

const CARRY_FAIL = [
  (n, p) => `The piece is heavier than ${n} expected. ${p.Sub} ${vb(p, 'drops', 'drop')} it halfway. Has to start over.`,
  (n, p) => `${n}'s grip gives out. The marble fragment hits the floor with a crack that echoes through the gallery.`,
  (n, p) => `${n} tries to carry two pieces at once. Bad idea. One slips. Time wasted.`,
  (n, p) => `${n} stumbles under the weight and has to set the piece down. ${p.Sub} ${vb(p, 'needs', 'need')} a moment.`,
];

const DECODE_SUCCESS = [
  (n, p) => `${n} traces the ancient markings and finds the assembly sequence. "This one goes here. I'm sure of it."`,
  (n, p) => `The symbols click in ${n}'s mind. ${p.Sub} ${vb(p, 'sees', 'see')} the pattern. "Bottom-up, left side first."`,
  (n, p) => `${n} matches the inscriptions on two fragments. They tell ${p.obj} exactly how the relic fits together.`,
  (n, p) => `${n} rotates the piece until the glyphs align. The ancient builders left instructions after all.`,
];

const DECODE_FAIL = [
  (n, p) => `${n} stares at the markings. The symbols could mean anything. ${p.Sub} ${vb(p, 'guesses', 'guess')} wrong.`,
  (n, p) => `The inscriptions are worn smooth. ${n} can't read them. Trial and error it is.`,
  (n, p) => `${n} follows the symbol sequence but it leads to a dead end. The relic resists.`,
  (n, p) => `"I thought I had it." ${n} pulls the pieces apart. The glyphs don't match after all.`,
];

const DEFEND_SUCCESS = [
  (n, p) => `${n} hears the rumble and spins. The creature charges. ${n} holds the line. Not today.`,
  (n, p) => `${n} plants ${p.posAdj} feet and stares the thing down. It veers off at the last second.`,
  (n, p) => `The attack comes from the shadows. ${n} is ready. A shove, a dodge, and the statue is safe.`,
  (n, p) => `${n} grabs a museum stanchion and swings. The creature retreats. The builder keeps working.`,
  (n, p) => `${n} throws ${p.ref} between the animal and the statue. Absorbs the hit. Holds the ground.`,
];

const DEFEND_FAIL = [
  (n, p) => `${n} lunges for the creature but misses. It barrels past and slams into the statue. A piece falls.`,
  (n, p) => `The attack is too fast. ${n} can't react in time. The creature knocks a fragment loose.`,
  (n, p) => `${n} tries to block but gets bowled over. The statue shudders. A piece topples.`,
  (n, p) => `${n} freezes. The creature crashes into the pedestal. The team watches a piece shatter loose.`,
];

const COORDINATOR_ARGUE = [
  (coord, builder, cp) => `"No, rotate it!" ${coord} shouts. ${builder} ignores ${pronouns(builder).obj}. "I SAID rotate it!"`,
  (coord, builder, cp) => `${coord} and ${builder} disagree on the next placement. ${coord} wins the argument. Barely.`,
  (coord, builder, cp) => `"You're doing it wrong." ${coord} can't help it. ${builder}'s eye twitches.`,
  (coord, builder, cp) => `${coord} hovers over ${builder}'s shoulder. ${builder} finally snaps: "Back. Up."`,
];

const DEFENDER_HEROIC = [
  (n, p) => `${n} takes a hit meant for the statue and keeps standing. Blood from a scratch. ${p.Sub} doesn't notice.`,
  (n, p) => `The creature targets the builder. ${n} tackles it mid-air. The crowd gasps.`,
  (n, p) => `${n} catches the charging creature by the horns and redirects it into a wall. Raw power.`,
  (n, p) => `${n} stands between the team and the attack with nothing but ${p.posAdj} fists. And that's enough.`,
];

const VILLAIN_SLOW_TEXT = [
  (n, p) => `${n} "fumbles" a handoff. The delay is barely noticeable. The intent isn't.`,
  (n, p) => `${n} takes ${p.posAdj} time passing pieces to the builder. Suspiciously long pauses.`,
  (n, p) => `${n} drops a piece. Picks it up slowly. Looks at the other tribe's progress. Smiles.`,
  (n, p) => `"Sorry, slippery." ${n} hasn't been trying. The team is starting to notice.`,
];

const ASSEMBLY_ENCOURAGE = [
  (enc, target, ep2) => `"You've got this!" ${enc} calls to ${target}. "One more piece!"`,
  (enc, target, ep2) => `${enc} claps ${target} on the shoulder. "Best builder I've ever seen. Finish it."`,
  (enc, target, ep2) => `"We're almost there. Don't stop now." ${enc}'s voice steadies ${target}'s hands.`,
  (enc, target, ep2) => `${enc} starts a chant. The tribe picks it up. ${target} places the next piece with renewed energy.`,
];

const DEFENDER_BLAME = [
  (blamer, defender, bp) => `"You had ONE job!" ${blamer} shoves past ${defender}. The statue is missing a piece now.`,
  (blamer, defender, bp) => `${blamer} stares at the damage. Then at ${defender}. "This is on you."`,
  (blamer, defender, bp) => `${defender} looks at the knocked-loose piece. ${blamer} doesn't let ${pronouns(defender).obj} forget it. "We needed that."`,
  (blamer, defender, bp) => `"Some defender." ${blamer}'s voice drips acid. ${defender} says nothing. What can ${pronouns(defender).sub} say?`,
];

const SHOWMANCE_COMFORT_ASSEMBLY = [
  (a, b) => `${a} sees ${b} struggling and moves closer. "Hey. I believe in you." It sounds corny. It works.`,
  (a, b) => `${a} wipes the sweat from ${b}'s forehead. "Almost done. Then we celebrate."`,
  (a, b) => `${b} fumbles a piece and ${a} catches it. Their hands overlap on the stone. "Together," ${a} says.`,
  (a, b) => `${a} stands guard next to ${b}, close enough that their shoulders touch. Comfort through presence.`,
];

// ── Animal Escalation Narration ──
const ANIMAL_RELEASE_TEXT = {
  minimal: [
    'The security system powers down. Deep in the museum, something stirs... but barely. The halls stay quiet. For now.',
    'Alarms silenced. The museum settles. Behind a locked exhibit, a low hum — the containment system holding. No threats released.',
  ],
  normal: [
    'The alarm system cross-links to the containment wing. Locks disengage. Something scrapes against metal. The museum\'s countermeasures are awake.',
    'A distant clang echoes through the corridors. Then another. The security breach has triggered the animal containment protocols. They\'re loose.',
  ],
  elevated: [
    'Multiple alarm triggers have overloaded the containment grid. Cages snap open across the east wing. The animals don\'t wait for an invitation.',
    'The museum\'s automated defense goes to DEFCON 2. Reinforced gates lift. Heavy breathing fills the corridors. The animals are hunting.',
  ],
  swarm: [
    'Total containment failure. Every cage, every enclosure, every holding pen — wide open. The museum belongs to them now.',
    'The alarm cascade has fried the containment system. Animals pour from every exhibit. This is no longer a heist — it\'s survival.',
  ],
};

const ANIMAL_SIEGE_TEXT = [
  'The animals have found the assembly area. They circle. They wait. They charge.',
  'Growling from every corridor. The animals aren\'t searching anymore — they know exactly where the statues are.',
  'The siege begins. Animals converge on the assembly zone. The defenders take position. This is the final stand.',
  'Every creature in the museum is heading for the same place. The assembly area. The statues. The tribes.',
];

// ── Between-Phase Chatter ──
const BETWEEN_PHASE_TAUNT = [
  (taunter, target, tp) => `${taunter} makes eye contact with ${target} and mouths: "You're done."`,
  (taunter, target, tp) => `"How many alarms was that?" ${taunter} shouts across the gallery at ${target}'s tribe. "We lost count."`,
  (taunter, target, tp) => `${taunter} slow-claps as ${target}'s tribe regroups. The disrespect is palpable.`,
  (taunter, target, tp) => `"Nice work in there," ${taunter} tells ${target}. The sarcasm drips.`,
];

const BETWEEN_PHASE_CHATTER = [
  (a, b) => `${a} and ${b} exchange a nod between phases. Mutual respect, even across tribes.`,
  (a, b) => `${a} catches ${b}'s eye and shrugs. "Good luck in there." ${b}: "Don't need it."`,
  (a, b) => `${a} sizes up ${b}'s tribe while they regroup. Counting strengths. Noting weaknesses.`,
  (a, b) => `${a} overhears ${b}'s team strategy and files it away. Information is currency.`,
];

const BETWEEN_PHASE_SHOWMANCE = [
  (a, b) => `${a} finds ${b} between phases. "Be careful in there." "You too." They both mean it.`,
  (a, b) => `A stolen moment between rounds. ${a} and ${b} from rival tribes, close enough to whisper.`,
  (a, b) => `${a} passes something to ${b} — a small hand squeeze disguised as a bump. "After this is over."`,
  (a, b) => `${a} watches ${b} walk back to ${pronouns(b).posAdj} tribe. The worry is written all over ${pronouns(a).posAdj} face.`,
];

// ── Host Commentary ──
const HOST_INTRO = [
  (h) => `${h} sweeps a flashlight across the museum entrance. "Welcome to Night at the Museum. Break in. Find the pieces. Build the statue. Try not to trigger every alarm in the building."`,
  (h) => `"Three phases. Security. Search. Assembly." ${h} counts on ${h === 'Chris' ? 'his' : 'their'} fingers. "Mess up phase one and phase two gets harder. Mess up phase two and phase three gets impossible. Have fun."`,
  (h) => `${h} adjusts a night-vision monocle. "The museum is armed. The exhibits are... unpredictable. And the statues won't build themselves. Go."`,
  (h) => `"Tonight's challenge takes place in total darkness. Well, near-total. The security cameras have infrared." ${h} grins. "So does my popcorn warmer."`,
];

const HOST_SECURITY = [
  (h) => `${h} watches from the control room. "Oh, that alarm's going to cost them."`,
  (h) => `"Clean sweep!" ${h} sounds impressed. That's rare.`,
  (h) => `${h} cringes as another alarm blares. "That's going to attract attention in phase two."`,
  (h) => `"Security breach is supposed to be the EASY part," ${h} muses, watching the feeds.`,
];

const HOST_SEARCH = [
  (h) => `${h} monitors the gallery cameras. "They're splitting up. Classic horror movie mistake. I love it."`,
  (h) => `"The animals are getting restless," ${h} observes. "Probably all those alarms from phase one."`,
  (h) => `${h} zooms in on a piece race. "Now THIS is what I pay for."`,
  (h) => `"Four galleries. Dozens of hiding spots. And they're running out of time." ${h} settles into ${h === 'Chris' ? 'his' : 'their'} chair.`,
];

const HOST_ASSEMBLY = [
  (h) => `${h} leans forward. "This is where it all comes together. Or falls apart. Usually falls apart."`,
  (h) => `"The animals know the statues are being moved. They don't like it." ${h} presses a button. Something roars in the distance.`,
  (h) => `${h} starts a timer. "Assembly under pressure. My favorite words."`,
  (h) => `"One tribe's building smooth. The other..." ${h} winces. "Let's just say they picked the wrong statue."`,
];


// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════

export function simulateNightAtMuseum(ep) {
  const tribes = gs.tribes.filter(t => t.members.length > 0);
  const active = tribes.flatMap(t => t.members);
  const campKey = tribe => tribe.name;

  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => {
    if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] };
  });
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  // Build tribe lookup
  const tribeOf = {};
  tribes.forEach(t => t.members.forEach(m => { tribeOf[m] = t.name; }));

  // Active showmances
  const activeShowmances = (gs.showmances || []).filter(sh => !sh.broken && sh.pair?.length === 2);

  // Result data
  const result = {
    tribes: [],
    crossTribeEvents: [[], [], [], []],
    betweenPhaseEvents: [],
    hostIntro: pick(HOST_INTRO)(host()),
    winner: null,
    loser: null,
    immunityWinner: null,
    mvp: null,
  };

  // Per-tribe state
  const tribeState = {};
  tribes.forEach(t => {
    tribeState[t.name] = {
      name: t.name,
      members: [...t.members],
      alarmCount: 0,
      cleanSweep: false,
      statue: null,
      piecesFound: 0,
      totalPieces: 0,
      roles: { builder: null, defender: null, coordinator: null },
      phase1Events: [],
      phase2Events: [],
      phase3Events: [],
      assemblyResult: { placed: 0, fumbled: 0, knocked: false, complete: false, failedDefenses: 0 },
      score: 0,
    };
  });

  // ═══════════════════════════════════════════
  // PHASE 1: SECURITY BREACH
  // ═══════════════════════════════════════════

  tribes.forEach(t => {
    const ts = tribeState[t.name];
    const members = [...t.members];
    let heroScoutBonus = 0;
    let heroScoutName = null;

    // Shuffle member order
    for (let i = members.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [members[i], members[j]] = [members[j], members[i]];
    }

    members.forEach((name, idx) => {
      const s = pStats(name);
      const p = pronouns(name);
      let eventModifier = 0;
      let preEvent = null;

      // Apply hero scout bonus from earlier hero
      eventModifier += heroScoutBonus;

      // Pre-attempt micro-event (~40%)
      if (Math.random() < 0.4) {
        const possibleEvents = [];

        // Teammate tip
        const teammates = t.members.filter(m => m !== name);
        const tippers = teammates.filter(m => getBond(m, name) > 1);
        if (tippers.length > 0) possibleEvents.push('teammate-tip');

        // Showmance calm
        const showmancePair = activeShowmances.find(sh =>
          (sh.pair[0] === name && t.members.includes(sh.pair[1])) ||
          (sh.pair[1] === name && t.members.includes(sh.pair[0]))
        );
        if (showmancePair) possibleEvents.push('showmance-calm');

        // Animal startle (more likely with high alarm)
        if (Math.random() < 0.3 + ts.alarmCount * 0.1) possibleEvents.push('animal-startle');

        // Villain guinea pig
        if (canScheme(name)) {
          // Actually the villain uses someone else as guinea pig
          // Re-check: villain uses a target
        }
        const villainTeammates = teammates.filter(m => canScheme(m) && getBond(m, name) < 0);
        if (villainTeammates.length > 0) possibleEvents.push('villain-guinea-pig');

        // Hero scouts first (only first member)
        const heroTypes = ['hero', 'loyal-soldier'];
        if (idx === 0 && heroTypes.includes(arch(name))) possibleEvents.push('hero-scouts');

        // Self psyche-out
        possibleEvents.push('self-psyche-out');

        // Rival distraction
        const rivals = tribes.filter(ot => ot.name !== t.name)
          .flatMap(ot => ot.members)
          .filter(m => canScheme(m));
        if (rivals.length > 0) possibleEvents.push('rival-distraction');

        if (possibleEvents.length > 0) {
          const chosen = pick(possibleEvents);

          switch (chosen) {
            case 'teammate-tip': {
              const tipper = pick(tippers);
              const tp = pronouns(tipper);
              eventModifier += 0.15;
              addBond(tipper, name, 0.3);
              preEvent = { type: 'teammate-tip', player: name, tipper, text: pick(TEAMMATE_TIP)(tipper, name, tp) };
              break;
            }
            case 'showmance-calm': {
              const partner = showmancePair.pair[0] === name ? showmancePair.pair[1] : showmancePair.pair[0];
              const ap = pronouns(partner);
              eventModifier += 0.2;
              addBond(partner, name, 0.5);
              preEvent = { type: 'showmance-calm', player: name, partner, text: pick(SHOWMANCE_CALM)(partner, name, ap) };
              break;
            }
            case 'animal-startle': {
              eventModifier -= 0.15;
              popDelta(name, -1);
              preEvent = { type: 'animal-startle', player: name, text: pick(ANIMAL_STARTLE)(name, p) };
              break;
            }
            case 'villain-guinea-pig': {
              const villain = pick(villainTeammates);
              const vp = pronouns(villain);
              eventModifier -= 0.1;
              addBond(name, villain, -0.5);
              popDelta(villain, -1);
              preEvent = { type: 'villain-guinea-pig', player: name, villain, text: pick(VILLAIN_GUINEA_PIG)(villain, name, vp) };
              break;
            }
            case 'hero-scouts': {
              heroScoutBonus = 0.1;
              heroScoutName = name;
              const teammates2 = t.members.filter(m => m !== name);
              teammates2.forEach(m => addBond(m, name, 0.3));
              popDelta(name, 1);
              preEvent = { type: 'hero-scouts', player: name, text: pick(HERO_SCOUTS)(name, p) };
              // Hero's own bonus — they go first
              eventModifier += 0.1;
              break;
            }
            case 'self-psyche-out': {
              const psycheScore = s.boldness * 0.05 + noise(2.5);
              if (psycheScore < 0.2) {
                eventModifier -= 0.1;
                preEvent = { type: 'self-psyche-out', player: name, text: pick(SELF_PSYCHE_OUT)(name, p) };
              }
              break;
            }
            case 'rival-distraction': {
              const rival = pick(rivals);
              const rp = pronouns(rival);
              eventModifier -= 0.1;
              addBond(name, rival, -0.3);
              popDelta(rival, -1);
              preEvent = { type: 'rival-distraction', player: name, rival, text: pick(RIVAL_DISTRACTION)(rival, name, rp) };
              break;
            }
          }
        }
      }

      // Security roll
      const securityRoll = s.physical * 0.05 + s.intuition * 0.06 + eventModifier + noise(2.5);
      const passed = securityRoll > 0.3;

      let narration;
      if (passed) {
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;
        popDelta(name, 1);
        narration = _pickUnique(SECURITY_PASS, 'sec-pass')(name, p);
      } else {
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) - 2;
        popDelta(name, -1);
        ts.alarmCount++;
        narration = _pickUnique(SECURITY_FAIL, 'sec-fail')(name, p);
      }

      const event = {
        type: passed ? 'security-pass' : 'security-fail',
        player: name,
        passed,
        roll: securityRoll,
        preEvent,
        narration,
      };

      // Blame for alarm — attach to parent event so VP can render inline
      if (!passed && Math.random() < 0.5) {
        const blamers = t.members.filter(m => m !== name);
        if (blamers.length > 0) {
          let blamer;
          const hothead = blamers.find(m => arch(m) === 'hothead');
          const eligible = blamers.filter(m => !isNice(m) || arch(m) === 'hothead');
          if (hothead) {
            blamer = hothead;
          } else if (eligible.length > 0) {
            blamer = eligible.sort((a, b) => getBond(a, name) - getBond(b, name))[0];
          } else {
            blamer = blamers.sort((a, b) => getBond(a, name) - getBond(b, name))[0];
            if (arch(blamer) === 'hero') blamer = null;
          }

          if (blamer) {
            const bp = pronouns(blamer);
            addBond(blamer, name, -0.8);
            popDelta(name, -1);
            event.blame = {
              blamer,
              target: name,
              text: pick(BLAME_TEXT)(blamer, name, bp),
            };
          }
        }
      }
      ts.phase1Events.push(event);
    });

    // Clean sweep check
    if (ts.alarmCount === 0) {
      ts.cleanSweep = true;
      ts.score += 3;
      // Bond boost for all pairs
      for (let i = 0; i < t.members.length; i++) {
        for (let j = i + 1; j < t.members.length; j++) {
          addBond(t.members[i], t.members[j], 0.3);
        }
      }
      const sweepText = pick(CLEAN_SWEEP)(t.name);
      ts.phase1Events.push({ type: 'clean-sweep', tribe: t.name, text: sweepText });

      // Camp event
      ep.campEvents[t.name].post.push({
        text: `${t.name} executed a flawless museum break-in — zero alarms triggered`,
        players: [...t.members],
        badgeText: 'Clean Sweep',
        badgeClass: 'badge-positive',
      });
    }

    // Multiple alarms camp event
    const highAlarmPlayers = [];
    ts.phase1Events.filter(e => e.type === 'security-fail').forEach(e => {
      // Count per player
      if (!highAlarmPlayers.includes(e.player)) highAlarmPlayers.push(e.player);
    });
    // If tribe has 4+ alarms, blame the worst offenders
    if (ts.alarmCount >= 4) {
      highAlarmPlayers.forEach(name => {
        ep.campEvents[t.name].post.push({
          text: `${name} triggered multiple alarms during the museum break-in`,
          players: [name],
          badgeText: 'Alarm Magnet',
          badgeClass: 'badge-negative',
        });
      });
    }

    // Host commentary
    ts.phase1Events.push({ type: 'host', text: pick(HOST_SECURITY)(host()) });
  });

  // ═══════════════════════════════════════════
  // BETWEEN PHASES 1→2
  // ═══════════════════════════════════════════

  // Animal release transition
  const totalAlarms = Object.values(tribeState).reduce((sum, ts) => sum + ts.alarmCount, 0);
  result.animalRelease = {
    totalAlarms,
    severity: totalAlarms >= 5 ? 'swarm' : totalAlarms >= 3 ? 'elevated' : totalAlarms >= 1 ? 'normal' : 'minimal',
  };

  _generateBetweenPhaseEvents(tribes, result, active, activeShowmances, tribeOf);

  // ═══════════════════════════════════════════
  // PHASE 2: GALLERY SEARCH
  // ═══════════════════════════════════════════

  // Statue selection — ordered by security performance (fewest alarms picks first)
  const tribeOrder = [...tribes].sort((a, b) => {
    const alarmA = tribeState[a.name].alarmCount;
    const alarmB = tribeState[b.name].alarmCount;
    if (alarmA !== alarmB) return alarmA - alarmB;
    return tribeState[b.name].score - tribeState[a.name].score;
  });
  const takenStatues = [];
  result.statuePickOrder = tribeOrder.map(t => t.name);

  tribeOrder.forEach((t, pickIdx) => {
    const ts = tribeState[t.name];
    const members = t.members;
    const isFirstPick = pickIdx === 0;
    const available = ['classical', 'ancient', 'modern'].filter(s => !takenStatues.includes(s));
    const isLastPick = available.length === 1;

    // Determine champions for each AVAILABLE statue type
    const champions = {};
    available.forEach(type => {
      let bestScore = -Infinity;
      let bestName = members[0];
      members.forEach(name => {
        const s = pStats(name);
        let score;
        if (type === 'classical') score = s.physical * 0.06 + s.mental * 0.04 + noise(2.5);
        else if (type === 'ancient') score = s.intuition * 0.06 + s.mental * 0.04 + noise(2.5);
        else score = s.mental * 0.07 + s.strategic * 0.03 + noise(2.5);
        if (score > bestScore) { bestScore = score; bestName = name; }
      });
      champions[type] = bestName;
    });

    // Persuasion roll to determine preference (only from available)
    let bestType = available[0];
    let bestPersuasion = -Infinity;
    available.forEach(type => {
      const champ = champions[type];
      const s = pStats(champ);
      const persuasion = s.social * 0.06 + s.strategic * 0.04 + noise(2.5);
      if (persuasion > bestPersuasion) {
        bestPersuasion = persuasion;
        bestType = type;
      }
    });

    ts.statue = bestType;
    ts.totalPieces = STATUE_TYPES[bestType].pieces;

    const champName = champions[bestType];
    const champP = pronouns(champName);
    const advocateText = pick(ADVOCATE_TEXT[bestType])(champName, champP);

    // Build debate reactions (multiple interjections for non-first, non-last picks)
    const reactions = [];
    if (!isLastPick) {
      const nonChampions = members.filter(m => m !== champName);
      const shuffledNon = [...nonChampions].sort(() => Math.random() - 0.5);

      if (!isFirstPick && available.length >= 2) {
        // Losing champion argues for their statue
        const losingTypes = available.filter(t2 => t2 !== bestType);
        losingTypes.forEach(losingType => {
          const losingChamp = champions[losingType];
          if (losingChamp && losingChamp !== champName) {
            reactions.push({
              player: losingChamp,
              type: 'counter',
              text: pick(ADVOCATE_TEXT[losingType])(losingChamp, pronouns(losingChamp)),
            });
          }
        });
      }

      // 1-2 additional tribe member reactions
      const reactors = shuffledNon.filter(m => !reactions.find(r => r.player === m)).slice(0, 2);
      reactors.forEach(name => {
        const roll = Math.random();
        if (roll < 0.4) {
          // Agreement
          reactions.push({ player: name, type: 'agree', text: pick(DEBATE_AGREE)(name, champName, STATUE_TYPES[bestType].label) });
          addBond(name, champName, 0.2);
        } else if (roll < 0.7) {
          // Disagreement
          const altTypes = available.filter(t2 => t2 !== bestType);
          const altType = altTypes.length > 0 ? pick(altTypes) : bestType;
          reactions.push({ player: name, type: 'disagree', text: pick(DEBATE_DISAGREE)(name, STATUE_TYPES[altType].label) });
          addBond(name, champName, -0.3);
        } else {
          // Concern
          reactions.push({ player: name, type: 'concern', text: pick(DEBATE_CONCERN)(name, STATUE_TYPES[bestType].label) });
        }
      });
    }

    // Store ALL 3 statues with taken/available status for VP
    const allOptions = ['classical', 'ancient', 'modern'].map(type => ({
      type,
      label: STATUE_TYPES[type].label,
      taken: takenStatues.includes(type),
      available: available.includes(type),
      champion: available.includes(type) ? champions[type] : null,
    }));

    ts.phase2Events.push({
      type: 'statue-selection',
      statue: bestType,
      champion: champName,
      isFirstPick,
      isLastPick,
      pickOrder: pickIdx + 1,
      allOptions,
      chosen: bestType,
      chosenLabel: STATUE_TYPES[bestType].label,
      text: advocateText,
      reactions,
    });

    takenStatues.push(bestType);
  });

  // Gallery search
  const galleries = [...GALLERY_NAMES];

  tribes.forEach(t => {
    const ts = tribeState[t.name];
    const members = t.members;
    const animalRate = 0.25 + ts.alarmCount * 0.05 + (ts.statue === 'ancient' ? 0.25 : 0);

    galleries.forEach((gallery, gIdx) => {
      const roomEvents = [];

      members.forEach(name => {
        const s = pStats(name);
        const p = pronouns(name);

        // Per-room event (~40%)
        if (Math.random() < 0.4) {
          const possibleEvents = [];
          possibleEvents.push('shortcut', 'dead-end');
          if (Math.random() < animalRate) {
            possibleEvents.push('animal-dodge', 'animal-caught');
          }
          // Teammate distract (if animal encounter and teammate available)
          if (Math.random() < animalRate) {
            const teammates = members.filter(m => m !== name);
            if (teammates.length > 0) possibleEvents.push('teammate-distract');
          }

          const chosen = pick(possibleEvents);

          switch (chosen) {
            case 'shortcut': {
              ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;
              popDelta(name, 1);
              roomEvents.push({ type: 'shortcut', player: name, gallery, text: _pickUnique(SHORTCUT_TEXT, 'shortcut')(name, p) });
              break;
            }
            case 'dead-end': {
              ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) - 1;
              roomEvents.push({ type: 'dead-end', player: name, gallery, text: _pickUnique(DEAD_END_TEXT, 'dead-end')(name, p) });
              break;
            }
            case 'animal-dodge': {
              ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 1;
              roomEvents.push({ type: 'animal-dodge', player: name, gallery, text: _pickUnique(ANIMAL_DODGE_TEXT, 'animal-dodge')(name, p) });
              break;
            }
            case 'animal-caught': {
              ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) - 2;
              // Scatter a piece if tribe has found any
              if (ts.piecesFound > 0 && Math.random() < 0.4) {
                ts.piecesFound--;
                roomEvents.push({ type: 'piece-scattered', player: name, gallery, text: _pickUnique(ANIMAL_CAUGHT_TEXT, 'animal-caught')(name, p) });
              } else {
                roomEvents.push({ type: 'animal-caught', player: name, gallery, text: _pickUnique(ANIMAL_CAUGHT_TEXT, 'animal-caught')(name, p) });
              }
              break;
            }
            case 'teammate-distract': {
              const teammates = members.filter(m => m !== name);
              const hero = pick(teammates);
              const hp = pronouns(hero);
              ep.chalMemberScores[hero] = (ep.chalMemberScores[hero] || 0) + 2;
              addBond(name, hero, 0.5);
              popDelta(hero, 1);
              roomEvents.push({ type: 'teammate-distract', player: name, hero, gallery, text: pick(TEAMMATE_DISTRACT_TEXT)(hero, name, hp) });
              break;
            }
          }
        }

        // Piece search
        const searchScore = s.intuition * 0.06 + s.mental * 0.05 + noise(2.5);
        if (searchScore > 0.3 && ts.piecesFound < ts.totalPieces) {
          ts.piecesFound++;
          ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;
          roomEvents.push({
            type: 'piece-found',
            player: name,
            gallery,
            pieceNum: ts.piecesFound,
            total: ts.totalPieces,
            text: _pickUnique(PIECE_FOUND_TEXT, 'piece-found')(name, p, gallery),
          });
        }
      });

      // Social events between rooms (~50%, guaranteed at least 1 per tribe on first gallery)
      if ((gIdx === 0 || Math.random() < 0.5) && members.length >= 2) {
        _generateSearchSocialEvent(members, t, ts, ep, roomEvents, activeShowmances);
      }

      ts.phase2Events.push({ gallery, events: roomEvents });
    });

    // Cap pieces found at total
    ts.piecesFound = Math.min(ts.piecesFound, ts.totalPieces);

    // Host commentary
    ts.phase2Events.push({ type: 'host', text: pick(HOST_SEARCH)(host()) });
  });

  // Cross-tribe collisions — 1 per gallery (4 total), assigned to specific galleries
  result.crossTribeEvents = [[], [], [], []]; // per gallery
  if (tribes.length >= 2) {
    const usedPairs = new Set();
    for (let gIdx = 0; gIdx < 4; gIdx++) {
      // 1 guaranteed per gallery + 40% chance of a 2nd
      const numHere = 1 + (Math.random() < 0.4 ? 1 : 0);
      for (let c = 0; c < numHere; c++) {
        const t1 = pick(tribes);
        const t2 = pick(tribes.filter(t => t.name !== t1.name));
        const p1 = pick(t1.members);
        const p2 = pick(t2.members);
        const pairKey = [p1, p2].sort().join('|');
        if (usedPairs.has(pairKey)) continue;
        usedPairs.add(pairKey);

        // Weight types: negative events more likely between rivals, positive between high-bond
        const bond12 = getBond(p1, p2);
        const negativeTypes = ['piece-race', 'block', 'taunt', 'trash-talk'];
        const positiveTypes = ['respect', 'alliance-moment'];
        const collisionType = bond12 < -1 ? pick(negativeTypes) : bond12 > 1 ? pick(positiveTypes) : pick([...negativeTypes, ...positiveTypes]);
        const gallery = GALLERY_NAMES[gIdx];

        switch (collisionType) {
          case 'piece-race': {
            const s1 = pStats(p1);
            const s2 = pStats(p2);
            const roll1 = s1.physical * 0.05 + s1.boldness * 0.04 + noise(2.5);
            const roll2 = s2.physical * 0.05 + s2.boldness * 0.04 + noise(2.5);
            const winner = roll1 >= roll2 ? p1 : p2;
            const loser = winner === p1 ? p2 : p1;
            const loserTribe = tribeOf[loser];
            ep.chalMemberScores[winner] = (ep.chalMemberScores[winner] || 0) + 3;
            ep.chalMemberScores[loser] = (ep.chalMemberScores[loser] || 0) - 2;
            popDelta(winner, 2);
            popDelta(loser, -1);
            addBond(winner, loser, -0.5);
            addBond(loser, winner, -0.5);
            // Loser's tribe loses a piece if they have any
            const loserTs = tribeState[loserTribe];
            let pieceLost = false;
            if (loserTs && loserTs.piecesFound > 0) {
              loserTs.piecesFound--;
              pieceLost = true;
            }
            result.crossTribeEvents[gIdx].push({
              type: 'piece-race', winner, loser, gallery, pieceLost,
              text: pick(PIECE_RACE_TEXT)(winner, loser),
            });
            ep.campEvents[tribeOf[winner]].post.push({
              text: `${winner} snatched a statue piece from ${loser} in a dramatic gallery footrace`,
              players: [winner, loser],
              badgeText: 'Piece Snatcher',
              badgeClass: 'badge-positive',
            });
            break;
          }
          case 'block': {
            const blocker = canScheme(p1) ? p1 : (canScheme(p2) ? p2 : p1);
            const target = blocker === p1 ? p2 : p1;
            const bp = pronouns(blocker);
            ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) - 2;
            ep.chalMemberScores[blocker] = (ep.chalMemberScores[blocker] || 0) + 1;
            addBond(target, blocker, -0.7);
            popDelta(blocker, -1);
            popDelta(target, -1);
            result.crossTribeEvents[gIdx].push({
              type: 'block', blocker, target, gallery,
              text: pick(CROSS_TRIBE_BLOCK_TEXT)(blocker, target, bp),
            });
            break;
          }
          case 'taunt': {
            const taunter = canScheme(p1) ? p1 : (canScheme(p2) ? p2 : p1);
            const target = taunter === p1 ? p2 : p1;
            const tp = pronouns(taunter);
            ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) - 1;
            addBond(target, taunter, -0.5);
            popDelta(taunter, -1);
            popDelta(target, -1);
            result.crossTribeEvents[gIdx].push({
              type: 'taunt', taunter, target, gallery,
              text: pick(CROSS_TRIBE_TAUNT_TEXT)(taunter, target, tp),
            });
            break;
          }
          case 'trash-talk': {
            ep.chalMemberScores[p2] = (ep.chalMemberScores[p2] || 0) - 1;
            addBond(p2, p1, -0.5);
            popDelta(p1, -1);
            popDelta(p2, -1);
            result.crossTribeEvents[gIdx].push({
              type: 'trash-talk', taunter: p1, target: p2, gallery,
              text: pick(CROSS_TRIBE_TRASH_TALK_TEXT)(p1, p2),
            });
            break;
          }
          case 'respect': {
            addBond(p1, p2, 0.5);
            addBond(p2, p1, 0.5);
            popDelta(p1, 1);
            popDelta(p2, 1);
            result.crossTribeEvents[gIdx].push({
              type: 'respect', players: [p1, p2], gallery,
              text: pick(CROSS_TRIBE_RESPECT_TEXT)(p1, p2),
            });
            break;
          }
          case 'alliance-moment': {
            addBond(p1, p2, 0.8);
            addBond(p2, p1, 0.8);
            ep.chalMemberScores[p1] = (ep.chalMemberScores[p1] || 0) + 1;
            ep.chalMemberScores[p2] = (ep.chalMemberScores[p2] || 0) + 1;
            result.crossTribeEvents[gIdx].push({
              type: 'alliance-moment', players: [p1, p2], gallery,
              text: pick(CROSS_TRIBE_ALLIANCE_MOMENT_TEXT)(p1, p2),
            });
            break;
          }
        }
      }
    }
  }

  // ═══════════════════════════════════════════
  // BETWEEN PHASES 2→3
  // ═══════════════════════════════════════════

  // Animal siege escalation
  result.animalSiege = { totalAlarms };

  _generateBetweenPhaseEvents(tribes, result, active, activeShowmances, tribeOf);

  // ═══════════════════════════════════════════
  // PHASE 3: ASSEMBLY UNDER PRESSURE
  // ═══════════════════════════════════════════

  tribes.forEach(t => {
    const ts = tribeState[t.name];
    const members = t.members;

    // Role assignment debate
    // Builder: mental + intuition
    // Defender: physical + boldness
    // Coordinator: social + strategic
    const roleScores = {};
    members.forEach(name => {
      const s = pStats(name);
      roleScores[name] = {
        builder: s.mental * 0.06 + s.intuition * 0.05 + noise(2.5),
        defender: s.physical * 0.06 + s.boldness * 0.04 + noise(2.5),
        coordinator: s.social * 0.06 + s.strategic * 0.04 + noise(2.5),
      };
    });

    // Priority draft: best score gets first pick
    const assigned = new Set();
    const roles = { builder: null, defender: null, coordinator: null };
    const roleOrder = ['builder', 'defender', 'coordinator'];

    roleOrder.forEach(role => {
      let bestScore = -Infinity;
      let bestName = null;
      members.forEach(name => {
        if (assigned.has(name)) return;
        if (roleScores[name][role] > bestScore) {
          bestScore = roleScores[name][role];
          bestName = name;
        }
      });
      if (bestName) {
        roles[role] = bestName;
        assigned.add(bestName);
      }
    });

    ts.roles = roles;

    ts.phase3Events.push({
      type: 'role-assignment',
      roles: { ...roles },
      support: members.filter(m => !assigned.has(m)),
    });

    // Assembly
    const builder = roles.builder;
    const defender = roles.defender;
    const coordinator = roles.coordinator;
    const builderStats = pStats(builder);
    const defenderStats = pStats(defender);
    const coordinatorStats = coordinator ? pStats(coordinator) : null;
    const coordinatorBonus = coordinator ? coordinatorStats.social * 0.02 : 0;

    let piecesPlaced = 0;
    let fumbles = 0;
    let failedDefenses = 0;
    let lastSocialIdx = -3;
    const slots = STATUE_TYPES[ts.statue]?.slots || STATUE_TYPES.classical.slots;
    let nextSlotIdx = 0;
    const pieceStates = {};
    slots.forEach(s => { pieceStates[s.id] = 'waiting'; });
    // Max attempts = found pieces + 2 retries for pre-placement failures
    const maxAttempts = ts.piecesFound + 2;

    for (let pieceIdx = 0; pieceIdx < maxAttempts; pieceIdx++) {
      if (nextSlotIdx >= slots.length) break;
      if (piecesPlaced + fumbles >= ts.piecesFound) break;
      const slot = slots[nextSlotIdx];

      // Statue-specific pre-placement
      if (ts.statue === 'classical') {
        // Carry roll
        const carriers = members.filter(m => m !== builder);
        const carrier = carriers.length > 0 ? pick(carriers) : builder;
        const carrierStats = pStats(carrier);
        const carryRoll = carrierStats.physical * 0.06 + noise(2.5);
        const cp = pronouns(carrier);
        if (carryRoll > 0.1) {
          ep.chalMemberScores[carrier] = (ep.chalMemberScores[carrier] || 0) + 1;
          ts.phase3Events.push({ type: 'carry-success', player: carrier, slotId: slot.id, slotLabel: slot.label, text: _pickUnique(CARRY_SUCCESS, 'carry')(carrier, cp) });
        } else {
          ep.chalMemberScores[carrier] = (ep.chalMemberScores[carrier] || 0) - 1;
          ts.phase3Events.push({ type: 'carry-fail', player: carrier, slotId: slot.id, slotLabel: slot.label, text: _pickUnique(CARRY_FAIL, 'carry-fail')(carrier, cp) });
          fumbles++;
          continue;
        }
      }

      if (ts.statue === 'ancient') {
        // Decode roll — lower threshold so decoding fails ~25% not ~50%
        const bp = pronouns(builder);
        const decodeRoll = builderStats.intuition * 0.05 + noise(2.5);
        if (decodeRoll > 0.1) {
          ts.phase3Events.push({ type: 'decode-success', player: builder, slotId: slot.id, slotLabel: slot.label, text: _pickUnique(DECODE_SUCCESS, 'decode')(builder, bp) });
        } else {
          ep.chalMemberScores[builder] = (ep.chalMemberScores[builder] || 0) - 1;
          ts.phase3Events.push({ type: 'decode-fail', player: builder, slotId: slot.id, slotLabel: slot.label, text: _pickUnique(DECODE_FAIL, 'decode-fail')(builder, bp) });
          fumbles++;
          continue;
        }
      }

      // Placement roll
      const placeScore = builderStats.mental * 0.07 + builderStats.intuition * 0.05 + coordinatorBonus + noise(2.5);
      const bp = pronouns(builder);

      if (placeScore > 0.25) {
        // Check wrong placement for Modern Abstract
        if (ts.statue === 'modern' && Math.random() < 0.15) {
          ts.score -= 2;
          ep.chalMemberScores[builder] = (ep.chalMemberScores[builder] || 0) - 2;
          fumbles++;
          pieceStates[slot.id] = 'fumbled';
          ts.phase3Events.push({ type: 'wrong-placement', player: builder, slotId: slot.id, slotLabel: slot.label, text: _pickUnique(WRONG_PLACEMENT, 'wrong-place')(builder, bp) });
        } else {
          piecesPlaced++;
          nextSlotIdx++;
          ts.score += 2;
          ep.chalMemberScores[builder] = (ep.chalMemberScores[builder] || 0) + 2;
          if (coordinator) ep.chalMemberScores[coordinator] = (ep.chalMemberScores[coordinator] || 0) + 1;
          pieceStates[slot.id] = 'placed';
          ts.phase3Events.push({ type: 'assembly-success', player: builder, pieceNum: piecesPlaced, slotId: slot.id, slotLabel: slot.label, text: _pickUnique(ASSEMBLY_SUCCESS, 'assembly')(builder, bp) });
        }
      } else {
        ts.score -= 1;
        ep.chalMemberScores[builder] = (ep.chalMemberScores[builder] || 0) - 1;
        fumbles++;
        pieceStates[slot.id] = 'fumbled';
        ts.phase3Events.push({ type: 'assembly-fumble', player: builder, slotId: slot.id, slotLabel: slot.label, text: _pickUnique(ASSEMBLY_FUMBLE, 'fumble')(builder, bp) });
      }

      // Animal attacks — every other piece guaranteed, small chance on off-beats
      const animalOffChance = ts.statue === 'ancient' ? 0.35 : 0.2;
      const isAnimalBeat = pieceIdx % 2 === 1 || Math.random() < animalOffChance;
      if (isAnimalBeat) {
        const defendScore = defenderStats.physical * 0.07 + defenderStats.boldness * 0.04 + noise(2.5);
        const dp = pronouns(defender);
        if (defendScore > 0.3) {
          ep.chalMemberScores[defender] = (ep.chalMemberScores[defender] || 0) + 2;
          popDelta(defender, 1);
          addBond(builder, defender, 0.5);
          ts.phase3Events.push({ type: 'defend-success', player: defender, text: _pickUnique(DEFEND_SUCCESS, 'defend')(defender, dp) });

          // Heroic save camp event
          if (Math.random() < 0.4) {
            ts.phase3Events.push({ type: 'defender-heroic', player: defender, text: pick(DEFENDER_HEROIC)(defender, dp) });
            ep.campEvents[t.name].post.push({
              text: `${defender} protected the statue from animal attacks during assembly`,
              players: [defender],
              badgeText: 'Statue Guardian',
              badgeClass: 'badge-positive',
            });
          }
        } else {
          failedDefenses++;
          let knockedSlotId = null;
          // Only knock a piece 50% of the time — otherwise just score penalty
          if (piecesPlaced > 0 && Math.random() < 0.5) {
            piecesPlaced--;
            if (nextSlotIdx > 0) {
              nextSlotIdx--;
              knockedSlotId = slots[nextSlotIdx].id;
              pieceStates[knockedSlotId] = 'knocked';
            }
          }
          ts.score -= knockedSlotId ? 3 : 2;
          ep.chalMemberScores[defender] = (ep.chalMemberScores[defender] || 0) - 2;
          ts.phase3Events.push({ type: 'defend-fail', player: defender, knockedSlotId, text: _pickUnique(DEFEND_FAIL, 'defend-fail')(defender, dp) });

          // Blame from builder or teammate
          if (knockedSlotId && Math.random() < 0.6) {
            const blamers = members.filter(m => m !== defender);
            const blamer = blamers.length > 0 ? blamers.reduce((worst, m) => getBond(m, defender) < getBond(worst, defender) ? m : worst, blamers[0]) : builder;
            const blp = pronouns(blamer);
            addBond(blamer, defender, -0.5);
            popDelta(defender, -1);
            ts.phase3Events.push({ type: 'defender-blame', blamer, defender, text: pick(DEFENDER_BLAME)(blamer, defender, blp) });
          }
        }
      }

      // Social events during assembly (~35%, at most 1 per 2 placements)
      if (pieceIdx - lastSocialIdx >= 2 && Math.random() < 0.35) {
        lastSocialIdx = pieceIdx;
        _generateAssemblySocialEvent(members, t, ts, ep, builder, defender, coordinator, activeShowmances);
      }
    }

    // Completion scoring
    if (piecesPlaced >= ts.totalPieces) {
      ts.score += 5;
      ts.assemblyResult.complete = true;
      // Camp event for builder
      ep.campEvents[t.name].post.push({
        text: `${builder} assembled ${t.name}'s statue to complete the museum challenge`,
        players: [builder],
        badgeText: 'Master Builder',
        badgeClass: 'badge-positive',
      });
    } else {
      const missing = ts.totalPieces - piecesPlaced;
      ts.score -= missing * 2;
    }

    // Statue knocked over (3+ failed defenses)
    if (failedDefenses >= 3) {
      ts.score -= 8;
      ts.assemblyResult.knocked = true;
      // Camp event for defender
      ep.campEvents[t.name].post.push({
        text: `${defender} let the animals destroy ${t.name}'s statue progress`,
        players: [defender],
        badgeText: 'Failed Guard',
        badgeClass: 'badge-negative',
      });
    }

    ts.assemblyResult.placed = piecesPlaced;
    ts.assemblyResult.fumbled = fumbles;
    ts.assemblyResult.failedDefenses = failedDefenses;
    ts.assemblyResult.pieceStates = { ...pieceStates };

    // Host commentary
    ts.phase3Events.push({ type: 'host', text: pick(HOST_ASSEMBLY)(host()) });
  });

  // ═══════════════════════════════════════════
  // SCORING & WINNER DETERMINATION
  // ═══════════════════════════════════════════

  // Calculate tribe scores — average per member
  const tribeScores = {};
  tribes.forEach(t => {
    const ts = tribeState[t.name];
    const memberTotal = t.members.reduce((sum, m) => sum + (ep.chalMemberScores[m] || 0), 0);
    const avgScore = memberTotal / t.members.length;
    ts.score += avgScore;
    tribeScores[t.name] = ts.score;
  });

  // Sort tribes by score
  const sortedTribes = Object.entries(tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerTribeName = sortedTribes[0][0];
  const loserTribeName = sortedTribes[sortedTribes.length - 1][0];

  result.winner = winnerTribeName;
  result.loser = loserTribeName;

  // Build result tribes array
  result.tribes = tribes.map(t => ({ ...tribeState[t.name] }));

  // Immunity winner = top scorer from winning tribe
  const winningTribe = tribes.find(t => t.name === winnerTribeName);
  let topScorer = null;
  let topScore = -Infinity;
  winningTribe.members.forEach(name => {
    const score = ep.chalMemberScores[name] || 0;
    if (score > topScore) { topScore = score; topScorer = name; }
  });
  result.immunityWinner = topScorer;
  result.mvp = topScorer;

  // ═══════════════════════════════════════════
  // VILLAIN SABOTAGE CAMP EVENTS
  // ═══════════════════════════════════════════

  // Check for any villain sabotage events that happened
  tribes.forEach(t => {
    const ts = tribeState[t.name];
    const allEvents = [...ts.phase1Events, ...ts.phase2Events.flatMap(e => e.events || []), ...ts.phase3Events];
    allEvents.forEach(ev => {
      if (ev.type === 'villain-guinea-pig' && ev.villain) {
        ep.campEvents[t.name].post.push({
          text: `${ev.villain} deliberately sabotaged the search by using ${ev.player} as a guinea pig`,
          players: [ev.villain],
          badgeText: 'Saboteur',
          badgeClass: 'badge-negative',
        });
      }
    });
  });

  // ═══════════════════════════════════════════
  // ROMANCE HOOKS
  // ═══════════════════════════════════════════

  const _romActive = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'museum heist');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'museum', _romActive);

  // ═══════════════════════════════════════════
  // FINALIZE
  // ═══════════════════════════════════════════

  ep.nightAtMuseum = result;
  ep.isNightAtMuseum = true;
  ep.challengeType = 'tribe';
  ep.challengeLabel = 'Night at the Museum';
  ep.challengeCategory = 'adventure';
  ep.challengeDesc = 'Three-phase heist: security breach, gallery search, statue assembly under attack.';

  ep.winner = gs.tribes.find(t => t.name === winnerTribeName);
  ep.loser = gs.tribes.find(t => t.name === loserTribeName);
  ep.safeTribes = tribes.length > 2
    ? sortedTribes.slice(1, -1).map(([name]) => gs.tribes.find(t => t.name === name)).filter(Boolean)
    : [];
  ep.challengePlacements = sortedTribes.map(([name]) => {
    const t = gs.tribes.find(tr => tr.name === name);
    return { name, members: [...(t?.members || [])], memberScores: Object.fromEntries((t?.members || []).map(m => [m, ep.chalMemberScores[m] || 0])) };
  });

  ep.tribalPlayers = tribes.find(t => t.name === loserTribeName)?.members ? [...tribes.find(t => t.name === loserTribeName).members] : [];

  // chalPlacements: all players best-to-worst
  ep.chalPlacements = Object.entries(ep.chalMemberScores)
    .sort(([, a], [, b]) => b - a)
    .map(([n]) => n);

  // Massive bonus for top scorer — podium only, no 1W (pre-merge tribe challenge)
  if (result.immunityWinner) {
    const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores).filter(([n]) => n !== result.immunityWinner).map(([, s]) => s));
    ep.chalMemberScores[result.immunityWinner] = Math.max(ep.chalMemberScores[result.immunityWinner] || 0, maxOther) + active.length + 5;
  }

  updateChalRecord(ep);

  return ep;
}

// ══════════════════════════════════════════════════════════════
// HELPER: Between-phase events
// ══════════════════════════════════════════════════════════════

function _generateBetweenPhaseEvents(tribes, result, active, activeShowmances, tribeOf) {
  // Cross-tribe taunts
  if (tribes.length >= 2 && Math.random() < 0.6) {
    const t1 = pick(tribes);
    const t2 = pick(tribes.filter(t => t.name !== t1.name));
    const taunter = pick(t1.members.filter(m => canScheme(m))) || pick(t1.members);
    const target = pick(t2.members);
    const tp = pronouns(taunter);
    addBond(target, taunter, -0.3);
    popDelta(taunter, -1);
    result.betweenPhaseEvents.push({
      type: 'taunt', taunter, target,
      text: pick(BETWEEN_PHASE_TAUNT)(taunter, target, tp),
    });
  }

  // Chatter
  if (tribes.length >= 2 && Math.random() < 0.5) {
    const t1 = pick(tribes);
    const t2 = pick(tribes.filter(t => t.name !== t1.name));
    const a = pick(t1.members);
    const b = pick(t2.members);
    result.betweenPhaseEvents.push({
      type: 'chatter', players: [a, b],
      text: pick(BETWEEN_PHASE_CHATTER)(a, b),
    });
  }

  // Cross-tribe showmance moment
  const crossShowmances = activeShowmances.filter(sh => {
    const t1 = tribeOf[sh.pair[0]];
    const t2 = tribeOf[sh.pair[1]];
    return t1 && t2 && t1 !== t2;
  });
  if (crossShowmances.length > 0 && Math.random() < 0.7) {
    const sh = pick(crossShowmances);
    const [a, b] = sh.pair;
    addBond(a, b, 0.3);
    result.betweenPhaseEvents.push({
      type: 'showmance', players: [a, b],
      text: pick(BETWEEN_PHASE_SHOWMANCE)(a, b),
    });
  }
}

// ══════════════════════════════════════════════════════════════
// HELPER: Search social events
// ══════════════════════════════════════════════════════════════

function _generateSearchSocialEvent(members, tribe, ts, ep, roomEvents, activeShowmances) {
  const possibleTypes = ['help', 'encourage', 'bond', 'rivalry'];

  // Add sabotage if schemer present
  const schemers = members.filter(m => canScheme(m));
  if (schemers.length > 0) possibleTypes.push('sabotage');

  // Add showmance if applicable
  const showmancePairs = activeShowmances.filter(sh =>
    members.includes(sh.pair[0]) && members.includes(sh.pair[1])
  );
  if (showmancePairs.length > 0) possibleTypes.push('showmance');

  const type = pick(possibleTypes);
  const shuffled = [...members].sort(() => Math.random() - 0.5);

  switch (type) {
    case 'help': {
      if (shuffled.length < 2) break;
      const [helper, target] = shuffled;
      const hp = pronouns(helper);
      addBond(target, helper, 0.5);
      ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) + 1;
      roomEvents.push({ type: 'search-help', helper, target, text: pick(SEARCH_SOCIAL_HELP)(helper, target, hp) });
      break;
    }
    case 'sabotage': {
      const villain = pick(schemers);
      const targets = members.filter(m => m !== villain);
      if (targets.length === 0) break;
      const target = pick(targets);
      const vp = pronouns(villain);
      addBond(target, villain, -0.5);
      ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) - 1;
      popDelta(villain, -1);
      roomEvents.push({ type: 'search-sabotage', villain, target, text: pick(SEARCH_SOCIAL_SABOTAGE)(villain, target, vp) });
      // Camp event
      ep.campEvents[tribe.name].post.push({
        text: `${villain} deliberately sabotaged the search`,
        players: [villain],
        badgeText: 'Saboteur',
        badgeClass: 'badge-negative',
      });
      break;
    }
    case 'encourage': {
      if (shuffled.length < 2) break;
      const [enc, target] = shuffled;
      const ep2 = pronouns(enc);
      addBond(target, enc, 0.3);
      popDelta(enc, 1);
      roomEvents.push({ type: 'search-encourage', encourager: enc, target, text: pick(SEARCH_SOCIAL_ENCOURAGE)(enc, target, ep2) });
      break;
    }
    case 'bond': {
      if (shuffled.length < 2) break;
      const [a, b] = shuffled;
      addBond(a, b, 0.5);
      roomEvents.push({ type: 'search-bond', players: [a, b], text: pick(SEARCH_SOCIAL_BOND)(a, b) });
      break;
    }
    case 'rivalry': {
      if (shuffled.length < 2) break;
      const [a, b] = shuffled;
      addBond(a, b, -0.5);
      popDelta(a, -1);
      popDelta(b, -1);
      roomEvents.push({ type: 'search-rivalry', players: [a, b], text: pick(SEARCH_SOCIAL_RIVALRY)(a, b) });
      break;
    }
    case 'showmance': {
      const sh = pick(showmancePairs);
      const [a, b] = sh.pair;
      addBond(a, b, 0.5);
      roomEvents.push({ type: 'search-showmance', players: [a, b], text: pick(SEARCH_SOCIAL_SHOWMANCE)(a, b) });
      break;
    }
  }
}

// ══════════════════════════════════════════════════════════════
// HELPER: Assembly social events
// ══════════════════════════════════════════════════════════════

function _generateAssemblySocialEvent(members, tribe, ts, ep, builder, defender, coordinator, activeShowmances) {
  const possibleTypes = [];

  // Coordinator argues with builder
  if (coordinator && coordinator !== builder) possibleTypes.push('coordinator-argue');

  // Defender heroic save already handled inline

  // Villain deliberately slow
  const villains = members.filter(m => canScheme(m) && m !== builder);
  if (villains.length > 0) possibleTypes.push('villain-slow');

  // Encourage
  possibleTypes.push('encourage');

  // Showmance comfort
  const showmancePairs = activeShowmances.filter(sh =>
    members.includes(sh.pair[0]) && members.includes(sh.pair[1])
  );
  if (showmancePairs.length > 0) possibleTypes.push('showmance-comfort');

  if (possibleTypes.length === 0) return;

  const type = pick(possibleTypes);

  switch (type) {
    case 'coordinator-argue': {
      const cp = pronouns(coordinator);
      addBond(builder, coordinator, -0.3);
      addBond(coordinator, builder, -0.3);
      ts.phase3Events.push({ type: 'coordinator-argue', coordinator, builder, text: pick(COORDINATOR_ARGUE)(coordinator, builder, cp) });
      break;
    }
    case 'villain-slow': {
      const villain = pick(villains);
      const vp = pronouns(villain);
      ts.score -= 1;
      ep.chalMemberScores[villain] = (ep.chalMemberScores[villain] || 0) - 1;
      popDelta(villain, -1);
      ts.phase3Events.push({ type: 'villain-slow', player: villain, text: pick(VILLAIN_SLOW_TEXT)(villain, vp) });
      break;
    }
    case 'encourage': {
      const encouragers = members.filter(m => m !== builder);
      if (encouragers.length === 0) break;
      const enc = pick(encouragers);
      const ep2 = pronouns(enc);
      addBond(builder, enc, 0.3);
      popDelta(enc, 1);
      ts.phase3Events.push({ type: 'assembly-encourage', encourager: enc, target: builder, text: pick(ASSEMBLY_ENCOURAGE)(enc, builder, ep2) });
      break;
    }
    case 'showmance-comfort': {
      const sh = pick(showmancePairs);
      const [a, b] = sh.pair;
      addBond(a, b, 0.5);
      ts.phase3Events.push({ type: 'showmance-comfort', players: [a, b], text: pick(SHOWMANCE_COMFORT_ASSEMBLY)(a, b) });
      break;
    }
  }
}


// ══════════════════════════════════════════════════════════════════════
// VP: REVEAL STATE + CONTROLS
// ══════════════════════════════════════════════════════════════════════

const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`nm-step-${suffix}-${i}`);
    if (el) el.classList.add('nm-visible');
  }
  const counter = document.getElementById(`nm-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`nm-controls-${suffix}`);
    if (controls) { const btns = controls.querySelectorAll('.nm-btn'); btns.forEach(b => b.style.opacity = '0.4'); }
  }
}

export function nightMuseumRevealNext(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  if (st.idx >= st.total - 1) return;
  st.idx++;
  const suffix = screenKey.replace('nm-', '');
  try { _reapplyVisibility(suffix, st.idx, st.total); } catch (e) { /* stale DOM */ }
  try {
    const el = document.getElementById(`nm-step-${suffix}-${st.idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (el.querySelector('.nm-card-alarm')) _triggerAlarmBlast();
    }
  } catch (e) {}
  try { _updateStatueTracker(screenKey); } catch (e) { console.warn('nm statue tracker error:', e); }
  try { _updateSidebar(screenKey); } catch (e) { console.warn('nm sidebar update error:', e); }
}

export function nightMuseumRevealAll(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  st.idx = st.total - 1;
  const suffix = screenKey.replace('nm-', '');
  try { _reapplyVisibility(suffix, st.idx, st.total); } catch (e) {}
  try { _updateStatueTracker(screenKey); } catch (e) { console.warn('nm statue tracker error:', e); }
  try { _updateSidebar(screenKey); } catch (e) { console.warn('nm sidebar update error:', e); }
}

function _updateStatueTracker(screenKey) {
  if (!screenKey.includes('assembly')) return;
  const meta = (typeof window !== 'undefined' && window._nmAssemblyStepMeta) || [];
  const st = _tvState[screenKey];
  if (!st) return;

  const tribeStates = {};
  const tribePlaced = {};

  for (let i = 0; i <= st.idx && i < meta.length; i++) {
    const m = meta[i];
    if (!m || !m.tribeSfx) continue;
    if (!tribeStates[m.tribeSfx]) { tribeStates[m.tribeSfx] = {}; tribePlaced[m.tribeSfx] = 0; }
    if (m.statueAction) {
      tribeStates[m.tribeSfx][m.statueAction.slotId] = m.statueAction.state;
      if (m.statueAction.state === 'placed') tribePlaced[m.tribeSfx]++;
      if (m.statueAction.state === 'knocked') tribePlaced[m.tribeSfx] = Math.max(0, tribePlaced[m.tribeSfx] - 1);
    }
  }

  Object.keys(tribeStates).forEach(sfx => {
    const states = tribeStates[sfx];
    const placed = tribePlaced[sfx] || 0;
    let fumbled = 0;

    Object.keys(states).forEach(slotId => {
      const el = document.getElementById(`nm-sp-${sfx}-${slotId}`);
      if (!el) return;
      const state = states[slotId];
      el.className = el.className.replace(/\s*(placed|fumbled|knocked|success-glow)\b/g, '');
      el.style.removeProperty('opacity');
      if (state === 'placed') {
        el.classList.add('placed');
      } else if (state === 'fumbled') {
        el.classList.add('fumbled');
        fumbled++;
      } else if (state === 'knocked') {
        el.classList.add('knocked');
      } else {
        el.style.opacity = '0';
      }
    });

    // Update counter — show fumble count when no pieces placed
    const cntEl = document.getElementById(`nm-statue-count-${sfx}`);
    const epRec = (typeof window !== 'undefined' && window.vpEpNum) ? gs.episodeHistory[window.vpEpNum - 1] : null;
    const tribeData = epRec?.nightAtMuseum?.tribes?.find(t => (t.name || '').replace(/\s+/g, '-').toLowerCase() === sfx);
    const total = tribeData?.totalPieces || 6;
    const countText = fumbled > 0 && placed === 0 ? `0 / ${total} (${fumbled} fumbled)` : `${placed} / ${total}`;
    if (cntEl) cntEl.textContent = countText;

    // Update badge
    const badgeEl = document.getElementById(`nm-statue-badge-${sfx}`);
    const badgeText = fumbled > 0 && placed === 0 ? `0 / ${total} FUMBLED` : `${placed} / ${total} PLACED`;
    if (badgeEl) badgeEl.textContent = badgeText;

    // Completion glow
    const glowEl = document.getElementById(`nm-statue-glow-${sfx}`);
    if (glowEl) {
      if (placed >= total) glowEl.classList.add('active');
      else glowEl.classList.remove('active');
    }
  });
}


// ══════════════════════════════════════════════════════════════════════
// VP: ICON HELPER
// ══════════════════════════════════════════════════════════════════════

function _nmIcon(type, large) {
  const cls = `nm-icon nm-icon-${type}${large ? ' nm-icon-lg' : ''}`;
  return `<span class="${cls}"><div class="frame-wrap"><div class="corner-tl"></div><div class="corner-tr"></div><div class="corner-bl"></div><div class="corner-br"></div><div class="canvas-inner"></div></div></span>`;
}

function _nmPortraitIcon(name) {
  if (!name) return _nmIcon('frame');
  const sl = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<span class="nm-icon nm-icon-portrait"><div class="frame-wrap"><div class="corner-tl"></div><div class="corner-tr"></div><div class="corner-bl"></div><div class="corner-br"></div><img src="assets/avatars/${sl}.png" alt="${name}" style="position:absolute;top:2px;left:2px;right:2px;bottom:2px;width:calc(100% - 4px);height:calc(100% - 4px);object-fit:cover;border-radius:1px;z-index:0;" onerror="this.style.display='none'"><div class="canvas-inner" style="background:transparent;"></div></div></span>`;
}


// ══════════════════════════════════════════════════════════════════════
// VP: SIDEBAR
// ══════════════════════════════════════════════════════════════════════

function _tribeColorCls(t, tribes) {
  if (!tribes || tribes.length === 0) return 'y';
  const idx = tribes.findIndex(tr => tr.name === t);
  return idx <= 0 ? 'y' : 'r';
}

function _buildSidebarContent(ep, screenKey) {
  const data = ep.nightAtMuseum || ep.challengeData?.nightAtMuseum;
  if (!data) return '<div class="nm-sb-body"><span style="color:var(--nm-muted);font-size:11px;">No data</span></div>';
  const tribes = data.tribes || [];
  const phase = screenKey.replace('nm-', '').replace(/\d+$/, '').replace(/-$/, '') || 'title';
  const epScores = ep.chalMemberScores || {};

  // Compute per-player scores gated by reveal state
  const gatedScores = {};
  const gatedAlarms = {};
  const gatedPieces = {};
  tribes.forEach(t => { gatedAlarms[t.name] = 0; gatedPieces[t.name] = 0; });

  // Accumulate from stepMeta up to current reveal index
  const _accum = (metaKey, stateKey) => {
    const meta = (typeof window !== 'undefined' && window[metaKey]) || [];
    const st = _tvState[stateKey];
    if (!st) return;
    for (let i = 0; i <= st.idx && i < meta.length; i++) {
      const m = meta[i];
      if (!m) continue;
      if (m.player && m.scoreDelta) gatedScores[m.player] = (gatedScores[m.player] || 0) + m.scoreDelta;
      if (m.tribe && m.alarm) gatedAlarms[m.tribe] = (gatedAlarms[m.tribe] || 0) + 1;
      if (m.tribe && m.pieceFound) gatedPieces[m.tribe] = (gatedPieces[m.tribe] || 0) + 1;
    }
  };
  _accum('_nmSecurityStepMeta', 'nm-security');
  _accum('_nmGalleryStepMeta', 'nm-gallery');
  _accum('_nmAssemblyStepMeta', 'nm-assembly');

  // During active phases, always use gated scores (start at 0, build up). Results/title show finals.
  const useGated = phase !== 'results' && phase !== 'title';

  let html = '';

  // Per-tribe player roster with portrait icons
  tribes.forEach((t, ti) => {
    const cc = ti === 0 ? 'y' : 'r';
    const tribeColor = cc === 'y' ? 'var(--nm-gold)' : 'var(--nm-tribe-red)';

    // Tribe header
    html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid rgba(212,168,75,.08);">`;
    html += `<div class="nm-sb-tribe nm-sb-tribe-${cc}"></div>`;
    html += `<span style="font-family:'Playfair Display',serif;font-size:11px;font-weight:700;letter-spacing:1.5px;color:${tribeColor};">${t.name.toUpperCase()}</span>`;

    // Tribe-level stats on header line
    if (phase === 'security' || phase === 'gallery' || phase === 'assembly') {
      const alarmShow = useGated ? (gatedAlarms[t.name] || 0) : t.alarmCount;
      if (alarmShow > 0) html += `<span class="nm-sb-pill nm-sb-pill-d" style="margin-left:auto;font-size:7px;">${alarmShow} ALARM${alarmShow !== 1 ? 'S' : ''}</span>`;
    }
    html += `</div>`;

    // Player rows — portrait icon + name + score
    const members = [...(t.members || [])];
    members.forEach(name => {
      const sl = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
      const score = useGated ? (gatedScores[name] || 0) : (epScores[name] || 0);
      const scoreCls = score > 0 ? 'nm-sb-val-g' : score < 0 ? 'nm-sb-val-d' : 'nm-sb-val-w';
      const scoreSign = score > 0 ? '+' : '';

      // Role badge if assembly phase
      let rolePill = '';
      if ((phase === 'assembly' || phase === 'results') && t.roles) {
        if (t.roles.builder === name) rolePill = `<span class="nm-sb-pill nm-sb-pill-g" style="font-size:6px;">BLD</span>`;
        else if (t.roles.defender === name) rolePill = `<span class="nm-sb-pill nm-sb-pill-w" style="font-size:6px;">DEF</span>`;
        else if (t.roles.coordinator === name) rolePill = `<span class="nm-sb-pill nm-sb-pill-w" style="font-size:6px;">CRD</span>`;
      }

      html += `<div class="nm-sb-row" style="gap:6px;">`;
      // Mini portrait in gilded frame
      html += `<div style="width:22px;height:22px;flex-shrink:0;border:2px solid rgba(180,145,60,.4);border-radius:2px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.3),inset 0 0 4px rgba(0,0,0,.15);position:relative;">`;
      html += `<img src="assets/avatars/${sl}.png" alt="${name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`;
      html += `</div>`;
      html += `<span class="nm-sb-name" style="font-size:10px;">${name}</span>`;
      html += rolePill;
      html += `<span class="nm-sb-val ${scoreCls}" style="font-size:10px;">${scoreSign}${score}</span>`;
      html += `</div>`;
    });

    // Tribe-level progress bars
    if (phase === 'gallery' || phase === 'assembly' || phase === 'results') {
      const piecesShow = useGated ? (gatedPieces[t.name] || 0) : t.piecesFound;
      const pct = t.totalPieces > 0 ? Math.round((piecesShow / t.totalPieces) * 100) : 0;
      html += `<div style="display:flex;align-items:center;gap:4px;padding:3px 0 2px;font-size:9px;">`;
      html += `<span style="color:var(--nm-muted);letter-spacing:1px;font-family:'IBM Plex Mono',monospace;">PIECES</span>`;
      html += `<div class="nm-sb-bar"><div class="nm-sb-bar-fill nm-sb-bar-fill-${cc}" style="width:${pct}%;"></div></div>`;
      html += `<span style="color:var(--nm-gold);font-weight:700;font-family:'IBM Plex Mono',monospace;">${piecesShow}/${t.totalPieces}</span>`;
      html += `</div>`;
    }

    if ((phase === 'assembly' || phase === 'results') && t.assemblyResult) {
      const placed = t.assemblyResult.placed || 0;
      const aPct = t.totalPieces > 0 ? Math.round((placed / t.totalPieces) * 100) : 0;
      html += `<div style="display:flex;align-items:center;gap:4px;padding:2px 0;font-size:9px;">`;
      html += `<span style="color:var(--nm-muted);letter-spacing:1px;font-family:'IBM Plex Mono',monospace;">BUILT</span>`;
      html += `<div class="nm-sb-bar"><div class="nm-sb-bar-fill nm-sb-bar-fill-${cc}" style="width:${aPct}%;"></div></div>`;
      html += `<span style="color:var(--nm-success);font-weight:700;font-family:'IBM Plex Mono',monospace;">${placed}/${t.totalPieces}</span>`;
      html += `</div>`;
      if (t.assemblyResult.complete) html += `<div style="text-align:center;padding:2px 0;"><span class="nm-sb-pill nm-sb-pill-g">STATUE COMPLETE</span></div>`;
      if (t.assemblyResult.knocked) html += `<div style="text-align:center;padding:2px 0;"><span class="nm-sb-pill nm-sb-pill-d">KNOCKED OVER</span></div>`;
    }

    html += '<div class="nm-sb-divider"></div>';
  });

  // Animal Threat
  if (phase !== 'title') {
    const totalAlarms = useGated ? Object.values(gatedAlarms).reduce((s, v) => s + v, 0) : tribes.reduce((s, t) => s + t.alarmCount, 0);
    const threatLevel = totalAlarms >= 6 ? 'max' : totalAlarms >= 4 ? 'high' : totalAlarms >= 2 ? 'med' : 'low';
    html += `<div class="nm-threat"><div class="nm-threat-label">ANIMAL THREAT</div><div class="nm-threat-bar"><div class="nm-threat-fill nm-threat-${threatLevel}"></div></div></div>`;
  }

  // Winner (results only)
  if (phase === 'results' && data.winner) {
    html += '<div class="nm-sb-divider"></div>';
    html += '<div class="nm-sb-section">RESULT</div>';
    html += `<div class="nm-sb-row highlight"><span class="nm-sb-name"><strong>${data.winner}</strong></span><span class="nm-sb-pill nm-sb-pill-g">IMMUNITY</span></div>`;
    if (data.loser) html += `<div class="nm-sb-row"><span class="nm-sb-name">${data.loser}</span><span class="nm-sb-pill nm-sb-pill-d">TRIBAL</span></div>`;
    if (data.mvp) html += `<div class="nm-sb-row"><span class="nm-sb-name"><strong>${data.mvp}</strong></span><span class="nm-sb-pill nm-sb-pill-w">MVP</span></div>`;
  }

  return html;
}

function _triggerAlarmBlast() {
  const blast = document.getElementById('nm-alarm-blast');
  if (!blast) return;
  blast.classList.remove('nm-blast-active');
  void blast.offsetWidth;
  blast.classList.add('nm-blast-active');
  setTimeout(() => blast.classList.remove('nm-blast-active'), 900);
}

function _updateSidebar(screenKey) {
  const sideEl = document.getElementById('nm-sidebar-inner');
  if (!sideEl) return;
  const epIdx = window.vpEpNum;
  const epRecord = gs.episodeHistory?.[epIdx - 1];
  if (!epRecord) return;
  const content = _buildSidebarContent(epRecord, screenKey);
  sideEl.innerHTML = `<div class="nm-sb-hdr">${_nmIcon('statue')}MUSEUM STATUS</div><div class="nm-sb-body">${content}</div>`;
}


// ══════════════════════════════════════════════════════════════════════
// VP: CSS + SHELL
// ══════════════════════════════════════════════════════════════════════

function _nmShell(content, ep, phaseCls) {
  if (typeof window !== 'undefined') window._nmEpRecord = ep;
  const data = ep.nightAtMuseum || ep.challengeData;

  const css = `
<style>
:root {
  --nm-void:#b09070;--nm-marble:#c8a878;--nm-gallery:#a08868;
  --nm-gold:#d4a84b;--nm-gold-bright:#f0c060;--nm-gold-dim:rgba(212,168,75,.15);
  --nm-laser-red:#e84030;--nm-laser-green:#40c860;
  --nm-ivory:#f0e8d8;--nm-cream:rgba(240,232,216,.85);
  --nm-bronze:#8a6a30;--nm-copper:#a07040;
  --nm-danger:#c83030;--nm-success:#50b860;--nm-info:#4090d0;
  --nm-purple:#7a5080;--nm-violet:rgba(122,80,128,.15);
  --nm-frame-gold:linear-gradient(135deg,#c8a040,#e0c060,#a08030);
  --nm-card-bg:rgba(42,32,24,.88);
  --nm-white:#f0e8d8;--nm-muted:rgba(240,232,216,.5);
  --nm-alarm-glow:rgba(232,64,48,.15);
  --nm-mauve:#7a6070;--nm-burgundy:#6a2828;--nm-tan:#c8a878;
  --nm-floor-red:#5a2020;
  --nm-tribe-red:#e05050;--nm-tribe-yellow-dark:#8a7a10;--nm-tribe-red-dark:#8a2020;
  --nm-tribe-yellow-bright:#a89520;--nm-tribe-red-bright:#a83030;
  --nm-fumble:#e8a020;
}
.nm-atmosphere{position:fixed;top:0;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:0;
  background:linear-gradient(180deg,#c8a878 0%,#b89868 10%,#a88a60 45%,#8a7058 70%,#6a2828 90%,#5a2020 100%);transition:background .8s;}
.nm-wrap[data-phase="title"] .nm-atmosphere{background:linear-gradient(180deg,#c8a878 0%,#b89868 10%,#a88a60 45%,#8a7058 70%,#6a2828 90%,#5a2020 100%);}
.nm-wrap[data-phase="security"] .nm-atmosphere{background:linear-gradient(180deg,#1a1418 0%,#1e1520 10%,#221822 45%,#1a1015 70%,#2a0808 90%,#1a0505 100%);}
.nm-wrap[data-phase="gallery"] .nm-atmosphere{background:linear-gradient(180deg,#c8a878 0%,#b89868 10%,#a88a60 45%,#8a7058 70%,#6a2828 90%,#5a2020 100%);}
.nm-wrap[data-phase="assembly"] .nm-atmosphere{background:linear-gradient(180deg,#8a7058 0%,#705848 10%,#584030 45%,#483028 70%,#5a1818 90%,#401010 100%);}
.nm-wrap[data-phase="results"] .nm-atmosphere{background:linear-gradient(180deg,#b09070 0%,#a08060 10%,#907050 45%,#806048 70%,#6a2828 90%,#5a2020 100%);}
.nm-floor{position:absolute;bottom:0;left:0;right:0;height:160px;
  background:linear-gradient(to top,rgba(90,32,32,.9),rgba(106,40,40,.5) 40%,transparent);pointer-events:none;}
.nm-floor::before{content:'';position:absolute;bottom:0;left:0;right:0;height:60px;
  background:repeating-linear-gradient(90deg,rgba(80,25,25,.25) 0px,transparent 1px,transparent 80px,rgba(80,25,25,.25) 81px);opacity:.4;}
.nm-columns{position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;}
.nm-col{position:absolute;top:0;bottom:140px;width:28px;
  background:linear-gradient(90deg,rgba(200,180,150,.06) 0%,rgba(220,200,170,.12) 20%,rgba(240,220,190,.15) 45%,rgba(220,200,170,.12) 70%,rgba(200,180,150,.06) 100%);
  border-left:1px solid rgba(220,200,170,.06);border-right:1px solid rgba(220,200,170,.06);}
.nm-col::before{content:'';position:absolute;top:0;left:-4px;right:-4px;height:18px;
  background:linear-gradient(180deg,rgba(200,180,150,.15),rgba(200,180,150,.05));border-bottom:2px solid rgba(212,168,75,.08);}
.nm-col::after{content:'';position:absolute;bottom:0;left:-4px;right:-4px;height:18px;
  background:linear-gradient(to top,rgba(200,180,150,.15),rgba(200,180,150,.05));border-top:2px solid rgba(212,168,75,.08);}
.nm-col:nth-child(1){left:4%;}.nm-col:nth-child(2){left:22%;}.nm-col:nth-child(3){right:22%;}.nm-col:nth-child(4){right:4%;}
.nm-panels{position:absolute;top:20px;bottom:160px;left:0;right:0;}
.nm-panel{position:absolute;top:0;bottom:0;background:rgba(100,75,85,.12);border:1px solid rgba(140,110,120,.08);}
.nm-panel:nth-child(1){left:7%;right:76%;}.nm-panel:nth-child(2){left:26%;right:26%;}.nm-panel:nth-child(3){left:76%;right:7%;}
.nm-portraits{position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:1;}
.nm-portrait{position:absolute;overflow:visible;}
/* Ornate gilded museum frame — layered gold molding */
.nm-portrait .frame{position:absolute;top:0;left:0;right:0;bottom:0;
  border:4px solid rgba(180,145,60,.3);border-radius:2px;
  box-shadow:
    inset 0 0 12px rgba(0,0,0,.25),
    inset 0 0 0 1px rgba(212,168,75,.15),
    0 2px 10px rgba(0,0,0,.25),
    0 0 0 1px rgba(120,95,40,.2);}
/* Inner gold lip — second frame layer */
.nm-portrait .frame::before{content:'';position:absolute;top:3px;left:3px;right:3px;bottom:3px;
  border:2px solid rgba(212,168,75,.18);border-radius:1px;
  box-shadow:inset 0 0 6px rgba(0,0,0,.1);}
/* Corner rosette ornaments */
.nm-portrait .frame::after{content:'';position:absolute;top:-1px;left:-1px;right:-1px;bottom:-1px;
  background:
    radial-gradient(circle 5px at 0% 0%,rgba(212,168,75,.2),transparent 6px),
    radial-gradient(circle 5px at 100% 0%,rgba(212,168,75,.2),transparent 6px),
    radial-gradient(circle 5px at 0% 100%,rgba(212,168,75,.2),transparent 6px),
    radial-gradient(circle 5px at 100% 100%,rgba(212,168,75,.2),transparent 6px);
  pointer-events:none;}
.nm-portrait .canvas{position:absolute;top:7px;left:7px;right:7px;bottom:7px;border-radius:1px;overflow:hidden;
  background:linear-gradient(145deg,rgba(60,45,35,.4),rgba(45,32,25,.5));
  box-shadow:inset 0 0 10px rgba(0,0,0,.2);}
/* Oval portraits get round frame */
.nm-portrait-oval .frame{border-radius:50%;}
.nm-portrait-oval .frame::before{border-radius:50%;}
.nm-portrait-oval .frame::after{border-radius:50%;}
.nm-portrait-oval .canvas{border-radius:50%;}
/* Name plaque on frame bottom — tiny brass plate */
.nm-portrait::after{content:attr(data-name);position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);
  font-family:'IBM Plex Mono',monospace;font-size:5px;letter-spacing:1.5px;color:rgba(212,168,75,.25);
  background:rgba(56,42,32,.6);padding:1px 6px;border-radius:1px;white-space:nowrap;
  border:1px solid rgba(180,145,60,.12);text-transform:uppercase;}
/* Phase-specific portrait moods */
.nm-wrap[data-phase="title"] .nm-portrait .frame,.nm-wrap[data-phase="gallery"] .nm-portrait .frame{border-color:rgba(200,160,70,.4);box-shadow:inset 0 0 12px rgba(0,0,0,.2),0 2px 10px rgba(0,0,0,.2),0 0 0 1px rgba(160,130,50,.25),0 0 15px rgba(212,168,75,.06);}
.nm-wrap[data-phase="title"] .nm-portrait .canvas img,.nm-wrap[data-phase="gallery"] .nm-portrait .canvas img{filter:sepia(.4) brightness(.75) contrast(1.1)!important;opacity:.4!important;}
.nm-wrap[data-phase="security"] .nm-portrait{opacity:.5;}
.nm-wrap[data-phase="security"] .nm-portrait .canvas img{filter:sepia(.6) brightness(.5) contrast(1.2)!important;opacity:.4!important;}
.nm-wrap[data-phase="results"] .nm-portrait .frame{border-color:rgba(212,168,75,.45);box-shadow:inset 0 0 12px rgba(0,0,0,.15),0 2px 10px rgba(0,0,0,.2),0 0 0 1px rgba(180,145,60,.3),0 0 20px rgba(212,168,75,.1);}
.nm-wrap[data-phase="results"] .nm-portrait .canvas img{filter:sepia(.3) brightness(.8) contrast(1.05)!important;opacity:.45!important;}
.nm-deco-statues{position:absolute;top:0;left:0;right:0;bottom:0;}
.nm-deco-statue{position:absolute;bottom:140px;}
.nm-deco-statue .ped{width:24px;height:14px;background:linear-gradient(180deg,rgba(200,190,170,.15),rgba(160,150,130,.08));border-top:1px solid rgba(212,168,75,.12);margin:0 auto;}
.nm-deco-statue .fig{width:10px;height:22px;margin:0 auto;position:relative;bottom:22px;background:linear-gradient(180deg,rgba(220,210,195,.12),rgba(200,190,170,.08));border-radius:40% 40% 0 0;clip-path:polygon(20% 100%,30% 40%,50% 0%,70% 40%,80% 100%);}
.nm-deco-statue:nth-child(1){left:6%;}.nm-deco-statue:nth-child(2){right:6%;}
.nm-ceiling{position:absolute;top:0;left:0;right:0;height:22px;z-index:1;background:linear-gradient(to bottom,rgba(200,168,120,.25),transparent);}
.nm-ceiling::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent 3%,rgba(212,168,75,.15) 20%,rgba(212,168,75,.2) 50%,rgba(212,168,75,.15) 80%,transparent 97%);}
.nm-dust{position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;}
.nm-mote{position:absolute;width:2px;height:2px;border-radius:50%;background:rgba(232,200,140,.15);animation:nm-drift linear infinite;}
.nm-mote:nth-child(1){top:15%;left:20%;animation-duration:25s;}
.nm-mote:nth-child(2){top:40%;left:55%;width:1px;height:1px;animation-duration:30s;animation-delay:-8s;}
.nm-mote:nth-child(3){top:60%;left:35%;animation-duration:22s;animation-delay:-4s;}
.nm-mote:nth-child(4){top:25%;left:75%;width:1px;height:1px;animation-duration:28s;animation-delay:-12s;}
.nm-mote:nth-child(5){top:70%;left:10%;animation-duration:26s;animation-delay:-6s;}
.nm-mote:nth-child(6){top:50%;left:85%;width:1px;height:1px;animation-duration:32s;animation-delay:-15s;}
@keyframes nm-drift{0%{transform:translate(0,0);opacity:.1;}15%{opacity:.35;}30%{transform:translate(15px,-30px);opacity:.15;}50%{transform:translate(-10px,-50px);opacity:.3;}70%{transform:translate(20px,-70px);opacity:.1;}100%{transform:translate(5px,-100px);opacity:0;}}
.nm-ceiling-lights{position:absolute;top:0;left:0;right:0;height:300px;}
.nm-clight{position:absolute;top:0;border-radius:50%;background:radial-gradient(ellipse at 50% 0%,rgba(240,200,120,.06),transparent 70%);}
.nm-clight:nth-child(1){left:15%;width:200px;height:250px;}
.nm-clight:nth-child(2){left:45%;width:180px;height:220px;animation:nm-chandelier 8s 2s ease-in-out infinite;}
.nm-clight:nth-child(3){right:10%;width:160px;height:200px;animation:nm-chandelier 8s 4s ease-in-out infinite;}
@keyframes nm-chandelier{0%,100%{opacity:.5;}50%{opacity:.9;}}
.nm-laser-grid{position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;opacity:0;transition:opacity .5s;}
.nm-wrap[data-phase="security"] .nm-laser-grid{opacity:1;}
.nm-laser{position:absolute;height:2px;background:var(--nm-laser-red);box-shadow:0 0 12px rgba(232,64,48,.6),0 0 30px rgba(232,64,48,.3),0 0 60px rgba(232,64,48,.1);opacity:.5;animation:nm-laser-pulse 3s ease-in-out infinite,nm-laser-sweep 6s ease-in-out infinite;}
.nm-laser:nth-child(1){top:20%;left:5%;right:15%;transform:rotate(3deg);}
.nm-laser:nth-child(2){top:38%;left:10%;right:5%;transform:rotate(-2deg);animation-delay:-1.5s,-3s;}
.nm-laser:nth-child(3){top:55%;left:3%;right:20%;transform:rotate(1.5deg);animation-delay:-3s,-5s;}
.nm-laser:nth-child(4){top:70%;left:15%;right:8%;transform:rotate(-2.5deg);animation-delay:-.8s,-2s;}
.nm-laser:nth-child(5){top:85%;left:8%;right:12%;transform:rotate(1deg);animation-delay:-2.2s,-6s;}
.nm-laser-v{width:2px;height:auto;top:10%;bottom:10%;animation:nm-laser-pulse 4s ease-in-out infinite,nm-laser-sweep-v 10s ease-in-out infinite;}
.nm-laser-v:nth-child(6){left:20%;animation-delay:-1s,-4s;top:5%;bottom:25%;}
.nm-laser-v:nth-child(7){left:55%;animation-delay:-2.5s,-7s;top:15%;bottom:10%;}
.nm-laser-v:nth-child(8){left:80%;animation-delay:-.5s,-1s;top:8%;bottom:20%;}
@keyframes nm-laser-pulse{0%,100%{opacity:.15;}50%{opacity:.45;}}
@keyframes nm-laser-sweep{0%,100%{transform:rotate(var(--r,3deg)) translateY(0);}25%{transform:rotate(var(--r,3deg)) translateY(12px);}50%{transform:rotate(var(--r,3deg)) translateY(-8px);}75%{transform:rotate(var(--r,3deg)) translateY(5px);}}
@keyframes nm-laser-sweep-v{0%,100%{transform:translateX(0);}30%{transform:translateX(15px);}60%{transform:translateX(-10px);}85%{transform:translateX(6px);}}
.nm-alarm-wash{position:absolute;top:0;left:0;right:0;bottom:0;opacity:0;transition:opacity .5s;background:radial-gradient(ellipse 80% 60% at 50% 50%,rgba(200,30,30,.04),transparent);pointer-events:none;}
.nm-wrap[data-phase="security"] .nm-alarm-wash{opacity:1;animation:nm-alarm-flash 3s ease-in-out infinite;}
@keyframes nm-alarm-flash{0%,100%{opacity:.3;}50%{opacity:1;}}
/* ALARM BLAST — full-screen red siren flash when alarm triggers */
.nm-alarm-blast{position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:9999;opacity:0;}
.nm-alarm-blast.nm-blast-active{animation:nm-siren-blast .8s ease-out forwards;}
@keyframes nm-siren-blast{
  0%{opacity:0;background:rgba(255,0,0,0);}
  10%{opacity:1;background:rgba(255,0,0,.35);}
  20%{opacity:.1;background:rgba(255,0,0,.05);}
  30%{opacity:1;background:rgba(255,20,20,.3);}
  45%{opacity:.1;background:rgba(255,0,0,.02);}
  55%{opacity:1;background:rgba(200,0,0,.25);}
  70%{opacity:.05;}
  85%{opacity:.6;background:rgba(180,0,0,.15);}
  100%{opacity:0;}
}
/* Alarm card — pulsing red border + siren icon */
.nm-card-alarm{border:2px solid rgba(255,40,40,.6)!important;box-shadow:0 0 20px rgba(255,0,0,.3),0 0 60px rgba(255,0,0,.1),inset 0 0 30px rgba(255,0,0,.08)!important;animation:nm-alarm-card-pulse 1.5s ease-in-out 3;}
@keyframes nm-alarm-card-pulse{0%,100%{border-color:rgba(255,40,40,.6);box-shadow:0 0 20px rgba(255,0,0,.3),0 0 60px rgba(255,0,0,.1);}50%{border-color:rgba(255,80,80,.9);box-shadow:0 0 35px rgba(255,0,0,.5),0 0 80px rgba(255,0,0,.2);}}
.nm-siren-bar{height:4px;margin:8px -12px;background:repeating-linear-gradient(90deg,rgba(255,0,0,.7) 0px,rgba(255,0,0,.7) 12px,transparent 12px,transparent 20px);animation:nm-siren-scroll .4s linear infinite;border-radius:2px;}
@keyframes nm-siren-scroll{0%{background-position:0 0;}100%{background-position:20px 0;}}
.nm-gallery-glow{position:absolute;top:0;left:0;right:0;bottom:0;opacity:0;transition:opacity .5s;background:radial-gradient(ellipse 50% 40% at 50% 25%,rgba(240,200,120,.08),transparent);}
.nm-wrap[data-phase="title"] .nm-gallery-glow{opacity:.7;}
.nm-wrap[data-phase="gallery"] .nm-gallery-glow{opacity:1;}
.nm-siege-pulse{position:absolute;top:0;left:0;right:0;bottom:0;opacity:0;transition:opacity .5s;}
.nm-wrap[data-phase="assembly"] .nm-siege-pulse{opacity:1;animation:nm-siege 3s ease-in-out infinite;}
@keyframes nm-siege{0%,100%{background:rgba(232,64,48,0);}50%{background:rgba(232,64,48,.04);}}
.nm-ornate-strip{height:4px;background:repeating-linear-gradient(90deg,var(--nm-gold) 0px,var(--nm-gold) 3px,transparent 3px,transparent 8px,rgba(212,168,75,.3) 8px,rgba(212,168,75,.3) 10px,transparent 10px,transparent 16px);opacity:.2;}
.nm-ornate-strip-thick{height:6px;background:repeating-linear-gradient(90deg,var(--nm-gold) 0px,var(--nm-gold) 2px,transparent 2px,transparent 5px,var(--nm-bronze) 5px,var(--nm-bronze) 7px,transparent 7px,transparent 10px,var(--nm-gold) 10px,var(--nm-gold) 12px,transparent 12px,transparent 18px);opacity:.15;}
.nm-shell{max-width:1100px;margin:0 auto;padding:20px 20px 80px;position:relative;z-index:2;display:flex;gap:16px;align-items:flex-start;}
.nm-main{flex:1;min-width:0;position:relative;z-index:2;}
.nm-sidebar{width:260px;flex-shrink:0;position:sticky;top:20px;z-index:3;}
.nm-shell.screen-shake{animation:nm-screen-shake .35s ease-out;}
@keyframes nm-screen-shake{0%,100%{transform:translateX(0);}10%{transform:translateX(-3px) rotate(-.1deg);}20%{transform:translateX(3px) rotate(.1deg);}30%{transform:translateX(-2px);}40%{transform:translateX(2px);}50%{transform:translateX(-1px);}}
.nm-icon{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;flex-shrink:0;position:relative;}
.nm-icon .frame-wrap{position:relative;width:26px;height:26px;border:2px solid rgba(180,145,70,.6);border-radius:2px;background:linear-gradient(145deg,rgba(56,42,32,.85),rgba(72,55,40,.9));box-shadow:0 1px 4px rgba(0,0,0,.3),inset 0 0 8px rgba(0,0,0,.15),0 0 0 1px rgba(212,168,75,.15);overflow:hidden;}
.nm-icon .frame-wrap::before{content:'';position:absolute;top:1px;left:1px;right:1px;bottom:1px;border:1px solid rgba(212,168,75,.2);pointer-events:none;z-index:1;}
.nm-icon .frame-wrap::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(240,200,120,.25),transparent);z-index:1;}
.nm-icon .canvas-inner{position:absolute;top:3px;left:3px;right:3px;bottom:3px;display:flex;align-items:center;justify-content:center;}
.nm-icon .corner-tl,.nm-icon .corner-tr,.nm-icon .corner-bl,.nm-icon .corner-br{position:absolute;width:4px;height:4px;z-index:2;}
.nm-icon .corner-tl{top:0;left:0;border-top:1px solid rgba(240,200,120,.4);border-left:1px solid rgba(240,200,120,.4);}
.nm-icon .corner-tr{top:0;right:0;border-top:1px solid rgba(240,200,120,.4);border-right:1px solid rgba(240,200,120,.4);}
.nm-icon .corner-bl{bottom:0;left:0;border-bottom:1px solid rgba(240,200,120,.4);border-left:1px solid rgba(240,200,120,.4);}
.nm-icon .corner-br{bottom:0;right:0;border-bottom:1px solid rgba(240,200,120,.4);border-right:1px solid rgba(240,200,120,.4);}
.nm-icon-laser .canvas-inner{background:linear-gradient(170deg,rgba(40,20,20,.8),rgba(60,30,25,.6));}
.nm-icon-laser .canvas-inner::before{content:'';position:absolute;top:6px;left:2px;right:2px;height:1px;background:var(--nm-laser-red);box-shadow:0 0 6px var(--nm-laser-red);animation:nm-icon-lpulse 2s ease-in-out infinite;}
.nm-icon-laser .canvas-inner::after{content:'';position:absolute;top:12px;left:4px;right:4px;height:1px;background:var(--nm-laser-red);box-shadow:0 0 4px var(--nm-laser-red);animation:nm-icon-lpulse 2s .5s ease-in-out infinite;}
@keyframes nm-icon-lpulse{0%,100%{opacity:.4;}50%{opacity:1;}}
.nm-icon-camera .canvas-inner{background:linear-gradient(160deg,rgba(30,25,40,.7),rgba(45,35,50,.6));}
.nm-icon-camera .canvas-inner::before{content:'';position:absolute;top:5px;left:4px;width:10px;height:7px;background:rgba(56,42,32,.5);border:1px solid rgba(212,168,75,.35);border-radius:2px;}
.nm-icon-camera .canvas-inner::after{content:'';position:absolute;top:3px;left:8px;width:3px;height:3px;background:var(--nm-danger);border-radius:50%;box-shadow:0 0 4px var(--nm-danger);animation:nm-cam-blink 2s step-end infinite;}
@keyframes nm-cam-blink{0%,50%{opacity:1;}51%,100%{opacity:.2;}}
.nm-icon-alarm .canvas-inner{background:linear-gradient(170deg,rgba(60,35,20,.7),rgba(50,30,25,.5));}
.nm-icon-alarm .canvas-inner::before{content:'';position:absolute;top:4px;left:5px;width:10px;height:8px;background:linear-gradient(180deg,var(--nm-gold),var(--nm-bronze));border-radius:5px 5px 0 0;clip-path:polygon(10% 100%,20% 30%,50% 0%,80% 30%,90% 100%);}
.nm-icon-alarm .canvas-inner::after{content:'';position:absolute;bottom:3px;left:9px;width:3px;height:2px;background:var(--nm-gold);border-radius:0 0 50% 50%;}
.nm-icon-statue .canvas-inner{background:linear-gradient(170deg,rgba(50,40,35,.7),rgba(70,55,45,.5));}
.nm-icon-statue .canvas-inner::before{content:'';position:absolute;top:3px;left:8px;width:5px;height:5px;background:var(--nm-ivory);border-radius:50%;opacity:.7;}
.nm-icon-statue .canvas-inner::after{content:'';position:absolute;top:8px;left:6px;width:8px;height:8px;background:linear-gradient(180deg,var(--nm-ivory),rgba(232,224,208,.4));clip-path:polygon(30% 0%,70% 0%,85% 40%,100% 100%,60% 80%,40% 80%,0% 100%,15% 40%);opacity:.6;}
.nm-icon-frame .canvas-inner{background:linear-gradient(135deg,rgba(60,40,30,.7),rgba(80,60,40,.5));}
.nm-icon-frame .canvas-inner::before{content:'';position:absolute;top:4px;left:3px;width:14px;height:11px;border:1.5px solid rgba(212,168,75,.4);border-radius:1px;}
.nm-icon-frame .canvas-inner::after{content:'';position:absolute;top:6px;left:5px;width:10px;height:7px;background:linear-gradient(135deg,rgba(96,64,160,.2),rgba(40,90,160,.2));border-radius:1px;}
.nm-icon-shield .canvas-inner{background:linear-gradient(170deg,rgba(40,30,25,.7),rgba(55,40,30,.5));}
.nm-icon-shield .canvas-inner::before{content:'';position:absolute;top:3px;left:5px;width:11px;height:14px;background:linear-gradient(180deg,var(--nm-gold),var(--nm-bronze));clip-path:polygon(50% 100%,0 25%,0 0,100% 0,100% 25%);opacity:.6;}
.nm-icon-paw .canvas-inner{background:linear-gradient(160deg,rgba(50,30,20,.7),rgba(65,40,25,.5));}
.nm-icon-paw .canvas-inner::before{content:'';position:absolute;bottom:4px;left:5px;width:9px;height:7px;background:rgba(212,168,75,.45);border-radius:50% 50% 40% 40%;}
.nm-icon-paw .canvas-inner::after{content:'';position:absolute;top:4px;left:5px;width:10px;height:5px;background:radial-gradient(circle 2px at 15% 50%,rgba(212,168,75,.4),transparent 2.5px),radial-gradient(circle 2px at 85% 50%,rgba(212,168,75,.4),transparent 2.5px),radial-gradient(circle 1.5px at 0% 80%,rgba(212,168,75,.35),transparent 2px),radial-gradient(circle 1.5px at 100% 80%,rgba(212,168,75,.35),transparent 2px);}
.nm-icon-search .canvas-inner{background:linear-gradient(150deg,rgba(45,35,30,.7),rgba(60,48,38,.5));}
.nm-icon-search .canvas-inner::before{content:'';position:absolute;top:3px;left:3px;width:9px;height:9px;border:2px solid rgba(212,168,75,.5);border-radius:50%;}
.nm-icon-search .canvas-inner::after{content:'';position:absolute;bottom:3px;right:3px;width:5px;height:1.5px;background:rgba(212,168,75,.5);transform:rotate(45deg);border-radius:1px;}
.nm-icon-key .canvas-inner{background:linear-gradient(155deg,rgba(50,38,28,.7),rgba(65,50,35,.5));}
.nm-icon-key .canvas-inner::before{content:'';position:absolute;top:5px;left:2px;width:7px;height:7px;border:2px solid var(--nm-gold);border-radius:50%;}
.nm-icon-key .canvas-inner::after{content:'';position:absolute;top:8px;left:8px;width:7px;height:1.5px;background:var(--nm-gold);border-radius:0 1px 1px 0;}
.nm-icon-build .canvas-inner{background:linear-gradient(170deg,rgba(35,40,30,.7),rgba(45,55,35,.5));}
.nm-icon-build .canvas-inner::before{content:'';position:absolute;top:3px;left:6px;width:3px;height:12px;background:linear-gradient(180deg,rgba(212,168,75,.5),rgba(160,112,64,.5));border-radius:1px;transform:rotate(-30deg);transform-origin:center center;}
.nm-icon-build .canvas-inner::after{content:'';position:absolute;top:3px;right:6px;width:3px;height:12px;background:linear-gradient(180deg,rgba(160,112,64,.5),rgba(212,168,75,.5));border-radius:1px;transform:rotate(30deg);transform-origin:center center;}
.nm-icon-bond .canvas-inner{background:linear-gradient(160deg,rgba(55,30,35,.7),rgba(70,40,45,.5));}
.nm-icon-bond .canvas-inner::before,.nm-icon-bond .canvas-inner::after{content:'';position:absolute;width:6px;height:9px;border-radius:6px 6px 0 0;}
.nm-icon-bond .canvas-inner::before{left:4px;top:4px;background:var(--nm-gold);transform:rotate(-45deg);transform-origin:bottom right;}
.nm-icon-bond .canvas-inner::after{right:4px;top:4px;background:var(--nm-gold);transform:rotate(45deg);transform-origin:bottom left;}
.nm-icon-debate .canvas-inner{background:linear-gradient(155deg,rgba(45,30,50,.7),rgba(60,40,65,.5));}
.nm-icon-debate .canvas-inner::before{content:'';position:absolute;top:3px;left:3px;width:13px;height:9px;background:rgba(212,168,75,.12);border-radius:3px;border:1px solid rgba(212,168,75,.25);}
.nm-icon-debate .canvas-inner::after{content:'';position:absolute;bottom:4px;left:6px;width:0;height:0;border-style:solid;border-width:3px 3px 0 0;border-color:rgba(212,168,75,.25) transparent transparent transparent;}
.nm-icon-trophy .canvas-inner{background:linear-gradient(170deg,rgba(50,35,20,.7),rgba(65,48,25,.5));}
.nm-icon-trophy .canvas-inner::before{content:'';position:absolute;top:3px;left:5px;width:10px;height:8px;background:linear-gradient(180deg,var(--nm-gold-bright),var(--nm-gold));border-radius:0 0 5px 5px;clip-path:polygon(0 0,100% 0,85% 100%,15% 100%);}
.nm-icon-trophy .canvas-inner::after{content:'';position:absolute;bottom:3px;left:8px;width:5px;height:4px;background:var(--nm-bronze);clip-path:polygon(20% 0%,80% 0%,100% 100%,0% 100%);border-radius:0 0 1px 1px;}
/* Portrait icon — player avatar in gilded frame */
.nm-icon-portrait .frame-wrap{border-color:rgba(200,160,70,.7);
  box-shadow:0 1px 5px rgba(0,0,0,.35),inset 0 0 6px rgba(0,0,0,.2),0 0 0 1px rgba(212,168,75,.25),0 0 8px rgba(212,168,75,.08);}
.nm-icon-portrait .corner-tl,.nm-icon-portrait .corner-tr,.nm-icon-portrait .corner-bl,.nm-icon-portrait .corner-br{border-color:rgba(240,200,120,.5);}
.nm-icon-lg{width:70px;height:70px;}
.nm-icon-lg .frame-wrap{width:66px;height:66px;border-width:3px;box-shadow:0 2px 12px rgba(0,0,0,.4),inset 0 0 12px rgba(0,0,0,.2),0 0 0 1px rgba(212,168,75,.2),0 0 20px rgba(212,168,75,.06);}
.nm-icon-lg .frame-wrap::before{top:2px;left:2px;right:2px;bottom:2px;border-width:2px;}
.nm-icon-lg .corner-tl,.nm-icon-lg .corner-tr,.nm-icon-lg .corner-bl,.nm-icon-lg .corner-br{width:8px;height:8px;border-width:2px;}
.nm-icon-lg .canvas-inner{top:5px;left:5px;right:5px;bottom:5px;}
.nm-icon-lg.nm-icon-statue .canvas-inner{background:linear-gradient(170deg,rgba(50,40,35,.8),rgba(70,55,45,.6));}
.nm-icon-lg.nm-icon-statue .canvas-inner::before{content:'';position:absolute;top:10px;left:50%;margin-left:-6px;width:12px;height:12px;background:var(--nm-ivory);border-radius:50%;opacity:.7;}
.nm-icon-lg.nm-icon-statue .canvas-inner::after{content:'';position:absolute;top:22px;left:50%;margin-left:-10px;width:20px;height:22px;background:linear-gradient(180deg,var(--nm-ivory),rgba(232,224,208,.4));clip-path:polygon(30% 0%,70% 0%,85% 40%,100% 100%,60% 80%,40% 80%,0% 100%,15% 40%);opacity:.6;}
.nm-phase-hdr{text-align:center;margin:0 0 20px;padding:28px 20px 16px;position:relative;z-index:2;
  background:var(--nm-card-bg);border:1px solid rgba(212,168,75,.1);border-radius:8px;
  box-shadow:0 4px 20px rgba(0,0,0,.2);}
.nm-phase-hdr::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 5%,rgba(212,168,75,.2) 50%,transparent 95%);}
.nm-phase-tag{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:5px;color:var(--nm-gold);opacity:.5;margin-bottom:4px;font-weight:600;}
.nm-phase-title{font-family:'Playfair Display',serif;font-size:38px;font-weight:800;letter-spacing:1px;color:var(--nm-white);text-shadow:0 2px 25px rgba(0,0,0,.4),0 0 50px rgba(212,168,75,.06);line-height:1.1;}
.nm-phase-sub{font-size:13px;color:var(--nm-muted);margin-top:8px;max-width:500px;margin-left:auto;margin-right:auto;line-height:1.5;}
.nm-sec-readout{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--nm-laser-green);opacity:.5;padding:6px 12px;border-left:2px solid rgba(64,200,96,.15);
  background:rgba(20,18,14,.85);border-radius:4px;}
.nm-sec-readout.alert{color:var(--nm-laser-red);border-left-color:rgba(232,64,48,.2);animation:nm-readout-flash .8s ease-out;}
@keyframes nm-readout-flash{0%{background:rgba(232,64,48,.08);}100%{background:transparent;}}
.nm-alarm-meter{display:flex;align-items:center;gap:8px;padding:8px 12px;}
.nm-alarm-label{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:2px;color:rgba(232,64,48,.5);font-weight:600;}
.nm-alarm-dots{display:flex;gap:4px;}
.nm-alarm-dot{width:10px;height:10px;border-radius:50%;border:1.5px solid rgba(232,64,48,.2);background:transparent;transition:all .4s;position:relative;}
.nm-alarm-dot::after{content:'';position:absolute;top:-8px;left:-8px;right:-8px;bottom:-8px;}
.nm-alarm-dot.triggered{background:var(--nm-laser-red);border-color:var(--nm-laser-red);box-shadow:0 0 8px rgba(232,64,48,.4);}
.nm-step{opacity:0;transform:translateY(25px);filter:blur(4px);pointer-events:none;max-height:0;overflow:hidden;margin:0;padding:0;}
.nm-step.nm-visible{opacity:1;transform:none;filter:none;max-height:3000px;overflow:visible;pointer-events:auto;margin-top:12px;margin-bottom:12px;}
.nm-entering{animation:nm-card-enter .45s cubic-bezier(.16,1,.3,1) forwards!important;max-height:3000px!important;overflow:visible!important;pointer-events:auto!important;}
@keyframes nm-card-enter{0%{opacity:0;transform:translateY(22px) rotate(-.2deg);filter:blur(3px);}65%{opacity:1;transform:translateY(-3px) rotate(.1deg);filter:none;}100%{opacity:1;transform:none;filter:none;}}
.nm-step.nm-visible .nm-hdr{animation:nm-stag-in .35s .04s cubic-bezier(.16,1,.3,1) both;}
.nm-step.nm-visible .nm-txt{animation:nm-stag-in .35s .1s cubic-bezier(.16,1,.3,1) both;}
@keyframes nm-stag-in{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
.nm-card{background:rgba(32,24,18,.95);border:1px solid rgba(212,168,75,.12);border-radius:6px;padding:16px 20px;position:relative;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.35);}
.nm-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 5%,rgba(212,168,75,.2) 50%,transparent 95%);}
.nm-card-framed{border:2px solid rgba(212,168,75,.15);position:relative;}
.nm-card-framed::after{content:'';position:absolute;top:2px;left:2px;right:2px;bottom:2px;border:1px solid rgba(212,168,75,.06);pointer-events:none;}
.nm-card-security{border-left:3px solid var(--nm-laser-green);}
.nm-card-alarm{border-left:3px solid var(--nm-laser-red);background:linear-gradient(135deg,rgba(232,64,48,.06),var(--nm-card-bg))!important;}
.nm-card-danger{border-left:3px solid var(--nm-danger);background:linear-gradient(135deg,rgba(200,48,48,.05),var(--nm-card-bg))!important;}
.nm-card-hero{border-left:3px solid var(--nm-gold);background:linear-gradient(135deg,rgba(212,168,75,.06),var(--nm-card-bg))!important;}
.nm-card-social{border-left:3px dashed rgba(212,168,75,.15);background:rgba(72,55,40,.6)!important;}
.nm-card-piece{border-left:3px solid var(--nm-gold-bright);background:linear-gradient(135deg,rgba(240,192,96,.06),var(--nm-card-bg))!important;}
.nm-card-animal{border-left:3px solid var(--nm-danger);background:linear-gradient(135deg,rgba(200,48,48,.05),var(--nm-card-bg))!important;}
.nm-card-build{border-left:3px solid var(--nm-success);background:linear-gradient(135deg,rgba(80,184,96,.05),var(--nm-card-bg))!important;}
.nm-card-defend{border-left:3px solid var(--nm-bronze);background:linear-gradient(135deg,rgba(138,106,48,.06),var(--nm-card-bg))!important;}
.nm-card-debate{border-left:3px solid var(--nm-purple);background:linear-gradient(135deg,var(--nm-violet),var(--nm-card-bg))!important;}
.nm-card-fumble{border-left:3px solid rgba(232,160,32,.6);background:linear-gradient(135deg,rgba(232,160,32,.05),var(--nm-card-bg))!important;}
.nm-hdr{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
.nm-label{font-family:'Playfair Display',serif;font-size:13px;font-weight:700;letter-spacing:1px;color:var(--nm-ivory);}
.nm-txt{font-size:13.5px;line-height:1.7;color:rgba(245,238,225,.92);}
.nm-txt strong{color:var(--nm-ivory);}
.nm-badge{margin-left:auto;padding:3px 10px;border-radius:12px;font-size:9px;font-weight:700;letter-spacing:1.5px;white-space:nowrap;font-family:'IBM Plex Mono',monospace;}
.nm-badge-pass{background:rgba(64,200,96,.1);color:var(--nm-success);border:1px solid rgba(64,200,96,.2);}
.nm-badge-fail{background:rgba(232,64,48,.1);color:var(--nm-laser-red);border:1px solid rgba(232,64,48,.2);}
.nm-badge-found{background:rgba(212,168,75,.1);color:var(--nm-gold);border:1px solid rgba(212,168,75,.2);}
.nm-badge-danger{background:rgba(200,48,48,.1);color:var(--nm-danger);border:1px solid rgba(200,48,48,.15);}
.nm-badge-hero{background:rgba(212,168,75,.1);color:var(--nm-gold);border:1px solid rgba(212,168,75,.18);}
.nm-badge-social{background:rgba(212,168,75,.06);color:rgba(212,168,75,.6);border:1px solid rgba(212,168,75,.1);}
.nm-badge-build{background:rgba(80,184,96,.1);color:var(--nm-success);border:1px solid rgba(80,184,96,.15);}
.nm-badge-defend{background:rgba(160,112,64,.1);color:var(--nm-copper);border:1px solid rgba(160,112,64,.2);}
.nm-badge-fumble{background:rgba(232,160,32,.1);color:var(--nm-fumble);border:1px solid rgba(232,160,32,.2);}
.nm-score-bar{display:flex;align-items:center;gap:8px;margin:6px 0;}
.nm-strack{flex:1;height:6px;background:rgba(212,168,75,.06);border-radius:3px;overflow:hidden;}
.nm-sfill{height:100%;border-radius:3px;}
.nm-sfill-g{background:linear-gradient(90deg,var(--nm-success),var(--nm-laser-green));box-shadow:0 0 6px rgba(80,184,96,.3);}
.nm-sfill-d{background:linear-gradient(90deg,var(--nm-danger),var(--nm-tribe-red));box-shadow:0 0 6px rgba(200,48,48,.3);}
.nm-sfill-gold{background:linear-gradient(90deg,var(--nm-bronze),var(--nm-gold));box-shadow:0 0 6px rgba(212,168,75,.3);}
.nm-sval{font-size:11px;font-weight:700;min-width:24px;text-align:right;font-family:'IBM Plex Mono',monospace;}
.nm-sval-g{color:var(--nm-success);}.nm-sval-d{color:var(--nm-danger);}.nm-sval-w{color:var(--nm-gold);}
.nm-chatter{padding:10px 16px;font-size:12px;color:rgba(232,220,200,.55);font-style:italic;letter-spacing:.5px;border-left:2px solid rgba(212,168,75,.15);
  background:rgba(25,18,12,.9);border-radius:4px;}
.nm-chatter-host{color:rgba(212,168,75,.7);font-style:normal;font-weight:600;}
.nm-tribe-pov{padding:10px 16px;border-radius:6px;font-family:'Playfair Display',serif;font-size:14px;font-weight:700;letter-spacing:2px;display:flex;align-items:center;gap:10px;}
.nm-tribe-pov-y{background:rgba(138,122,16,.08);border:1px solid rgba(138,122,16,.15);color:var(--nm-gold);}
.nm-tribe-pov-r{background:rgba(138,32,32,.08);border:1px solid rgba(138,32,32,.15);color:var(--nm-tribe-red);}
.nm-sb-tribe{display:inline-block;width:8px;height:8px;border-radius:2px;flex-shrink:0;}
.nm-sb-tribe-y{background:var(--nm-tribe-yellow-dark);}.nm-sb-tribe-r{background:var(--nm-tribe-red-dark);}
.nm-debate{background:rgba(122,80,128,.06);border:1px solid rgba(122,80,128,.12);border-radius:8px;padding:14px 16px;margin:10px 0;}
.nm-debate-title{font-family:'Playfair Display',serif;font-size:11px;font-weight:700;letter-spacing:2px;color:var(--nm-gold);margin-bottom:8px;}
.nm-debate-opt{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:4px;margin:4px 0;font-size:12px;}
.nm-debate-opt.chosen{background:rgba(212,168,75,.08);border:1px solid rgba(212,168,75,.15);}
.nm-debate-opt.rejected{opacity:.4;text-decoration:line-through;}
.nm-debate-vote{font-size:10px;font-weight:700;color:var(--nm-gold);margin-left:auto;font-family:'IBM Plex Mono',monospace;}
.nm-blame{display:flex;align-items:center;gap:12px;margin-top:8px;padding:8px 12px;background:rgba(200,48,48,.06);border:1px dashed rgba(200,48,48,.15);border-radius:6px;}
.nm-blame-arrow{font-family:'Playfair Display',serif;font-size:18px;color:var(--nm-danger);opacity:.6;}
.nm-map-wrap{position:sticky;top:0;z-index:5;margin:0 -20px 16px;}
.nm-map{position:relative;width:100%;height:220px;overflow:hidden;background:linear-gradient(135deg,rgba(72,55,40,.95),rgba(56,42,32,.92));border-bottom:2px solid rgba(212,168,75,.1);}
.nm-map-grid{position:absolute;top:0;left:0;right:0;bottom:0;background:repeating-linear-gradient(0deg,rgba(212,168,75,.03) 0px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,rgba(212,168,75,.03) 0px,transparent 1px,transparent 40px);opacity:.5;}
.nm-map-room{position:absolute;border:1.5px solid rgba(212,168,75,.12);border-radius:4px;background:rgba(56,42,32,.6);transition:all .5s;overflow:hidden;}
.nm-map-room::before{content:attr(data-name);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'IBM Plex Mono',monospace;font-size:7px;letter-spacing:2px;color:rgba(212,168,75,.25);white-space:nowrap;}
.nm-map-room.active{border-color:rgba(212,168,75,.35);background:rgba(212,168,75,.06);box-shadow:0 0 15px rgba(212,168,75,.08);}
.nm-map-room.active::before{color:var(--nm-gold);opacity:.7;}
.nm-map-room.done{border-color:rgba(80,184,96,.2);background:rgba(80,184,96,.04);}
.nm-map-room.done::before{color:rgba(80,184,96,.4);}
.nm-map-room.locked{opacity:.3;}
.nm-map-room.locked::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(40,30,22,.75);}
.nm-map-corridor{position:absolute;background:rgba(212,168,75,.05);z-index:0;}
.nm-map-corridor.active{background:rgba(212,168,75,.12);}
.nm-map-title{position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:4;text-align:center;}
.nm-map-title-text{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:4px;color:rgba(212,168,75,.3);font-weight:600;}
.nm-map-phase{font-size:7px;font-weight:600;letter-spacing:2px;color:rgba(232,220,200,.2);margin-top:2px;font-family:'IBM Plex Mono',monospace;}
.nm-map-marker{position:absolute;z-index:4;width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.4);transition:left 1s cubic-bezier(.16,1,.3,1),top 1s cubic-bezier(.16,1,.3,1);transform:translate(-50%,-50%);}
.nm-map-marker::after{content:'';position:absolute;top:-8px;left:-8px;right:-8px;bottom:-8px;}
.nm-map-marker-y{background:linear-gradient(135deg,var(--nm-tribe-yellow-dark),var(--nm-tribe-yellow-bright));border-color:var(--nm-gold);}
.nm-map-marker-r{background:linear-gradient(135deg,var(--nm-tribe-red-dark),var(--nm-tribe-red-bright));border-color:var(--nm-tribe-red);}
.nm-map-piece{position:absolute;z-index:3;width:16px;height:16px;display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);transition:all .4s;}
.nm-map-piece::after{content:'';position:absolute;top:-14px;left:-14px;right:-14px;bottom:-14px;}
.nm-map-piece::before{content:'';width:8px;height:8px;background:var(--nm-gold);clip-path:polygon(50% 0%,100% 30%,100% 70%,50% 100%,0 70%,0 30%);box-shadow:0 0 6px rgba(212,168,75,.4);animation:nm-piece-glow 2s ease-in-out infinite;}
@keyframes nm-piece-glow{0%,100%{box-shadow:0 0 6px rgba(212,168,75,.3);}50%{box-shadow:0 0 12px rgba(212,168,75,.6);}}
.nm-map-piece.collected{opacity:0;transform:translate(-50%,-50%) scale(0);}
.nm-map-animal{position:absolute;z-index:3;width:16px;height:16px;border-radius:50%;background:rgba(232,64,48,.15);border:1px solid rgba(232,64,48,.3);display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);animation:nm-animal-prowl 3s ease-in-out infinite;}
@keyframes nm-animal-prowl{0%,100%{transform:translate(-50%,-50%) translate(0,0);}25%{transform:translate(-50%,-50%) translate(3px,-2px);}75%{transform:translate(-50%,-50%) translate(-3px,2px);}}
.nm-map-animal .paw-mini{width:6px;height:6px;position:relative;}
.nm-map-animal .paw-mini::before{content:'';position:absolute;bottom:0;left:1px;width:4px;height:3px;background:rgba(232,64,48,.5);border-radius:50%;}
.nm-statue-wrap{position:relative;width:100%;max-width:340px;margin:20px auto;height:280px;background:radial-gradient(ellipse 80% 60% at 50% 70%,rgba(40,30,22,.3),transparent),linear-gradient(180deg,rgba(72,55,40,.4) 0%,rgba(56,42,32,.6) 100%);border:1px solid rgba(212,168,75,.08);border-radius:10px;overflow:visible;}
.nm-statue-wrap::before{content:'';position:absolute;top:-20px;left:50%;transform:translateX(-50%);width:200px;height:120px;background:radial-gradient(ellipse at 50% 0%,rgba(240,200,120,.06),transparent 70%);pointer-events:none;z-index:0;}
.nm-pedestal{position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:140px;height:32px;z-index:1;background:linear-gradient(180deg,rgba(200,190,170,.22) 0%,rgba(160,150,130,.14) 40%,rgba(120,115,100,.08) 100%);border-radius:4px 4px 0 0;border-top:2px solid rgba(212,168,75,.25);box-shadow:0 -4px 20px rgba(212,168,75,.05),inset 0 2px 8px rgba(232,224,208,.03);}
.nm-pedestal::before{content:'';position:absolute;top:-4px;left:8px;right:8px;height:4px;background:linear-gradient(90deg,transparent,rgba(212,168,75,.25),rgba(240,192,96,.3),rgba(212,168,75,.25),transparent);border-radius:2px 2px 0 0;}
.nm-pedestal::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:repeating-linear-gradient(95deg,transparent,transparent 15px,rgba(232,224,208,.015) 15px,rgba(232,224,208,.015) 16px);pointer-events:none;}
.nm-statue-shadow{position:absolute;bottom:30px;left:50%;transform:translateX(-50%);width:90px;height:12px;background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,.2),transparent 70%);z-index:0;transition:width .6s,opacity .6s;}
.nm-sp{position:absolute;z-index:2;transition:none;will-change:transform,opacity;}
.nm-sp-ghost{opacity:.06;filter:none;z-index:1;}
.nm-sp.placed{opacity:1;transform:none;z-index:2;}
.nm-sp.placed.success-glow::after{content:'';position:absolute;top:-4px;left:-4px;right:-4px;bottom:-4px;background:radial-gradient(circle,rgba(80,184,96,.2),transparent 70%);border-radius:4px;animation:nm-success-pulse 1.5s ease-out forwards;pointer-events:none;}
@keyframes nm-success-pulse{0%{opacity:1;transform:scale(1);}100%{opacity:0;transform:scale(1.3);}}
.nm-sp.fumbled{transform:translateX(2px) rotate(1.5deg);opacity:.65;z-index:2;}
.nm-sp.fumbled .shape{filter:brightness(.7) saturate(.6);}
.nm-sp.knocked{opacity:0;transform:translateY(20px) rotate(15deg) scale(.6);transition:all .6s cubic-bezier(.55,.06,.68,.19);z-index:4;}
.nm-statue-counter{position:absolute;bottom:6px;left:50%;transform:translateX(-50%);font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:2px;color:var(--nm-gold);opacity:.6;z-index:5;white-space:nowrap;}
.nm-sp-base{bottom:32px;left:50%;margin-left:-46px;width:92px;height:36px;}
.nm-sp-base .shape{width:92px;height:36px;clip-path:polygon(8% 0%,92% 0%,100% 100%,0% 100%);background:linear-gradient(175deg,rgba(220,210,195,.85) 0%,rgba(200,190,170,.7) 30%,rgba(180,170,150,.6) 60%,rgba(160,150,135,.5) 100%);box-shadow:inset 2px 2px 6px rgba(255,255,255,.08),inset -2px -2px 4px rgba(0,0,0,.15),0 4px 12px rgba(0,0,0,.3);border-radius:0 0 3px 3px;position:relative;}
.nm-sp-torso{bottom:68px;left:50%;margin-left:-34px;width:68px;height:58px;}
.nm-sp-torso .shape{width:68px;height:58px;clip-path:polygon(18% 0%,82% 0%,92% 100%,8% 100%);background:linear-gradient(170deg,rgba(225,215,200,.8) 0%,rgba(205,195,175,.7) 40%,rgba(185,175,158,.55) 100%);box-shadow:inset 2px 3px 8px rgba(255,255,255,.06),inset -2px -2px 5px rgba(0,0,0,.12),0 3px 10px rgba(0,0,0,.25);position:relative;}
.nm-sp-larm{bottom:92px;left:50%;margin-left:-62px;width:34px;height:42px;}
.nm-sp-larm .shape{width:34px;height:42px;clip-path:polygon(55% 0%,95% 8%,80% 100%,5% 85%,20% 15%);background:linear-gradient(140deg,rgba(215,205,190,.75) 0%,rgba(190,180,165,.6) 100%);box-shadow:inset 1px 2px 5px rgba(255,255,255,.06),inset -1px -1px 3px rgba(0,0,0,.1),0 2px 8px rgba(0,0,0,.2);transform:rotate(-12deg);position:relative;}
.nm-sp-rarm{bottom:92px;left:50%;margin-left:28px;width:34px;height:42px;}
.nm-sp-rarm .shape{width:34px;height:42px;clip-path:polygon(45% 0%,5% 8%,20% 100%,95% 85%,80% 15%);background:linear-gradient(220deg,rgba(215,205,190,.75) 0%,rgba(190,180,165,.6) 100%);box-shadow:inset -1px 2px 5px rgba(255,255,255,.06),inset 1px -1px 3px rgba(0,0,0,.1),0 2px 8px rgba(0,0,0,.2);transform:rotate(12deg);position:relative;}
.nm-sp-head{bottom:126px;left:50%;margin-left:-16px;width:32px;height:38px;}
.nm-sp-head .shape{width:32px;height:38px;border-radius:50% 50% 42% 42%;background:radial-gradient(ellipse 80% 70% at 45% 35%,rgba(230,220,205,.8),rgba(200,190,170,.65) 60%,rgba(180,170,155,.5) 100%);box-shadow:inset 2px 3px 8px rgba(255,255,255,.08),inset -1px -2px 5px rgba(0,0,0,.1),0 2px 8px rgba(0,0,0,.2);position:relative;}
.nm-sp-crown{bottom:162px;left:50%;margin-left:-20px;width:40px;height:22px;}
.nm-sp-crown .shape{width:40px;height:22px;clip-path:polygon(12% 100%,0% 55%,22% 0%,50% 45%,78% 0%,100% 55%,88% 100%);background:linear-gradient(170deg,#e8c860,#c8a040 40%,#a08030 100%);box-shadow:0 0 8px rgba(212,168,75,.2),inset 1px 1px 4px rgba(255,255,255,.15),inset -1px -1px 3px rgba(0,0,0,.1);position:relative;filter:drop-shadow(0 0 6px rgba(212,168,75,.15));}
.nm-statue-complete{position:absolute;top:0;left:0;right:0;bottom:0;z-index:0;opacity:0;pointer-events:none;transition:opacity 1s;}
.nm-statue-complete.active{opacity:1;}
.nm-statue-complete .glow{position:absolute;top:20%;left:50%;transform:translateX(-50%);width:150px;height:200px;background:radial-gradient(ellipse at 50% 60%,rgba(212,168,75,.12),rgba(212,168,75,.04) 40%,transparent 70%);animation:nm-complete-breathe 2.5s ease-in-out infinite;}
@keyframes nm-complete-breathe{0%,100%{transform:translateX(-50%) scale(1);opacity:.6;}50%{transform:translateX(-50%) scale(1.08);opacity:1;}}
.nm-weight{display:flex;align-items:center;gap:6px;margin-top:6px;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1px;}
.nm-weight-label{color:rgba(232,220,200,.3);}
.nm-weight-bar{display:flex;gap:2px;}
.nm-weight-seg{width:12px;height:4px;border-radius:1px;background:rgba(212,168,75,.08);}
.nm-weight-seg.filled{background:var(--nm-gold);box-shadow:0 0 4px rgba(212,168,75,.2);}
.nm-threat{padding:10px 14px;background:rgba(200,48,48,.04);border:1px solid rgba(200,48,48,.08);border-radius:6px;margin:8px 0;}
.nm-threat-label{font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:2px;color:rgba(232,64,48,.4);margin-bottom:6px;font-weight:600;}
.nm-threat-bar{height:8px;background:rgba(232,64,48,.04);border-radius:4px;overflow:hidden;}
.nm-threat-fill{height:100%;border-radius:4px;transition:width .8s cubic-bezier(.16,1,.3,1);}
.nm-threat-low{background:linear-gradient(90deg,rgba(80,184,96,.4),rgba(80,184,96,.6));width:20%;box-shadow:0 0 4px rgba(80,184,96,.3);}
.nm-threat-med{background:linear-gradient(90deg,rgba(232,160,32,.5),rgba(232,160,32,.7));width:50%;box-shadow:0 0 6px rgba(232,160,32,.3);}
.nm-threat-high{background:linear-gradient(90deg,rgba(200,48,48,.5),rgba(200,48,48,.8));width:80%;box-shadow:0 0 8px rgba(200,48,48,.3);animation:nm-threat-pulse 1.5s ease-in-out infinite;}
.nm-threat-max{background:linear-gradient(90deg,rgba(232,64,48,.7),rgba(232,64,48,1));width:95%;box-shadow:0 0 12px rgba(232,64,48,.4);animation:nm-threat-pulse .8s ease-in-out infinite;}
@keyframes nm-threat-pulse{0%,100%{box-shadow:0 0 8px rgba(232,64,48,.3);}50%{box-shadow:0 0 16px rgba(232,64,48,.6);}}
.nm-sb{background:linear-gradient(180deg,rgba(56,42,32,.92),rgba(48,36,28,.95));border:1px solid rgba(212,168,75,.08);border-radius:8px;overflow:hidden;}
.nm-sb-hdr{padding:14px 16px 10px;border-bottom:1px solid rgba(212,168,75,.06);font-family:'Playfair Display',serif;font-size:12px;font-weight:700;letter-spacing:2px;color:var(--nm-gold);display:flex;align-items:center;gap:8px;}
.nm-sb-body{padding:12px 14px;max-height:calc(100vh - 120px);overflow-y:auto;}
.nm-sb-section{font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:600;letter-spacing:2px;color:rgba(232,220,200,.2);margin-bottom:6px;}
.nm-sb-divider{height:1px;background:rgba(212,168,75,.06);margin:10px 0;}
.nm-sb-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(212,168,75,.03);font-size:11px;transition:all .3s;}
.nm-sb-row:last-child{border-bottom:none;}
.nm-sb-row.highlight{background:rgba(212,168,75,.06);border-radius:4px;padding-left:6px;padding-right:6px;}
.nm-sb-name{flex:1;color:rgba(232,220,200,.55);}
.nm-sb-name strong{color:var(--nm-white);}
.nm-sb-val{font-weight:700;font-family:'IBM Plex Mono',monospace;font-size:11px;}
.nm-sb-val-g{color:var(--nm-success);}.nm-sb-val-d{color:var(--nm-danger);}.nm-sb-val-w{color:var(--nm-gold);}
.nm-sb-pill{display:inline-block;padding:1px 6px;border-radius:6px;font-size:8px;font-weight:700;letter-spacing:.5px;font-family:'IBM Plex Mono',monospace;}
.nm-sb-pill-g{background:rgba(80,184,96,.1);color:var(--nm-success);}
.nm-sb-pill-d{background:rgba(200,48,48,.1);color:var(--nm-danger);}
.nm-sb-pill-w{background:rgba(212,168,75,.1);color:var(--nm-gold);}
.nm-sb-bar{flex:1;height:4px;background:rgba(212,168,75,.06);border-radius:2px;overflow:hidden;margin:0 4px;}
.nm-sb-bar-fill{height:100%;border-radius:2px;transition:width .8s cubic-bezier(.16,1,.3,1);}
.nm-sb-bar-fill-y{background:var(--nm-gold);box-shadow:0 0 4px rgba(212,168,75,.3);}
.nm-sb-bar-fill-r{background:var(--nm-tribe-red);box-shadow:0 0 4px rgba(224,80,80,.3);}
.nm-controls{position:fixed;bottom:0;left:0;right:0;z-index:10;background:linear-gradient(to top,rgba(56,42,32,.98),rgba(56,42,32,.85) 70%,transparent);padding:20px 0 16px;text-align:center;}
.nm-btn{display:inline-block;padding:8px 20px;margin:0 6px;border:1px solid rgba(212,168,75,.2);border-radius:6px;background:rgba(212,168,75,.06);color:var(--nm-gold);font-family:'Playfair Display',serif;font-size:11px;font-weight:700;letter-spacing:2px;cursor:pointer;transition:all .15s;user-select:none;-webkit-appearance:none;appearance:none;outline:none;}
.nm-btn:focus-visible{outline:2px solid var(--nm-gold);outline-offset:2px;}
.nm-btn:hover{background:rgba(212,168,75,.12);border-color:rgba(212,168,75,.35);box-shadow:0 0 15px rgba(212,168,75,.1);}
.nm-btn:active{transform:scale(.96);}
.nm-btn.disabled{opacity:.35;pointer-events:none;}
.nm-counter{font-family:'IBM Plex Mono',monospace;font-size:11px;color:rgba(232,220,200,.3);letter-spacing:1px;margin:0 10px;}
.nm-title-card{text-align:center;padding:50px 20px 40px;position:relative;}
.nm-title-card::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse 70% 50% at 50% 40%,rgba(212,168,75,.04),transparent);pointer-events:none;}
.nm-tc-title{font-family:'Playfair Display',serif;font-size:48px;font-weight:900;color:var(--nm-white);text-shadow:0 2px 40px rgba(0,0,0,.4),0 0 80px rgba(212,168,75,.06);letter-spacing:2px;line-height:1.1;}
.nm-tc-sub{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:4px;color:var(--nm-gold);opacity:.5;margin-top:10px;}
.nm-tc-cold{font-size:14px;color:var(--nm-cream);margin-top:16px;max-width:550px;margin-left:auto;margin-right:auto;line-height:1.6;font-style:italic;}
.nm-tc-tribes{display:flex;justify-content:center;gap:20px;margin-top:24px;}
.nm-tc-tribe{padding:10px 24px;border-radius:6px;font-family:'Playfair Display',serif;font-size:14px;font-weight:700;letter-spacing:2px;}
.nm-tc-tribe-y{background:rgba(138,122,16,.08);border:1px solid rgba(138,122,16,.2);color:var(--nm-gold);}
.nm-tc-tribe-r{background:rgba(138,32,32,.08);border:1px solid rgba(138,32,32,.2);color:var(--nm-tribe-red);}
@media(prefers-reduced-motion:reduce){
  .nm-shell *{animation-duration:.01s!important;animation-delay:0s!important;transition-duration:.01s!important;}
  .nm-step,.nm-entering{opacity:1;transform:none;filter:none;}
  .nm-step.nm-visible{opacity:1;transform:none;filter:none;}
  .nm-shell.screen-shake{animation:none!important;}
}
@media(max-width:768px){
  .nm-shell{flex-direction:column;padding:12px 12px 80px;}
  .nm-sidebar{width:100%;position:relative;top:auto;order:-1;}
  .nm-sb-body{max-height:200px;}
  .nm-phase-title{font-size:28px;}
  .nm-tc-title{font-size:32px;}
  .nm-tc-tribes{flex-direction:column;align-items:center;gap:10px;}
  .nm-map{height:160px;}
  .nm-card{padding:12px 14px;}
  .nm-statue-wrap{max-width:280px;height:240px;}
  .nm-controls{padding:14px 0 12px;}
}
@media(max-width:480px){
  .nm-shell{padding:8px 8px 70px;}
  .nm-phase-title{font-size:22px;}
  .nm-tc-title{font-size:26px;}
  .nm-map{height:120px;}
  .nm-card{padding:10px 12px;}
  .nm-btn{padding:10px 16px;font-size:12px;min-height:44px;}
  .nm-statue-wrap{max-width:240px;height:200px;}
  .nm-sb-body{max-height:160px;}
}
</style>`;

  // Fill background with ALL player portraits in a museum gallery grid
  const allMembers = data?.tribes ? data.tribes.flatMap(t => t.members || []) : [];
  const shuffledMembers = [...allMembers].sort(() => Math.random() - 0.5);
  const pw = 72, ph = 90;

  // Lay out portraits centered in viewport — evenly spaced grid using vh/vw
  const cols = Math.min(Math.ceil(Math.sqrt(shuffledMembers.length * 2.5)), 7);
  const rows = Math.ceil(shuffledMembers.length / cols);
  const xGap = 100 / (cols + 1);
  const yGap = 80 / (rows + 1); // vh units, distribute across middle 80% of screen
  const yOffset = 10; // start 10vh from top — centers the grid vertically

  let portraitsHtml = '';
  shuffledMembers.forEach((pName, i) => {
    const sl = pName ? slug(pName) : '';
    const row = Math.floor(i / cols);
    const col = i % cols;
    const xOff = row % 2 === 1 ? xGap * 0.5 : 0;
    const xPct = xGap * (col + 1) + xOff;
    const yPct = yOffset + yGap * (row + 1);
    const isOval = i % 4 === 1;
    const br = isOval ? 'border-radius:50%;' : '';
    const sizeVar = [0, 6, -4, 8, -2, 4][i % 6];
    const w = pw + sizeVar;
    const h = ph + sizeVar;
    portraitsHtml += `<div class="nm-portrait${isOval ? ' nm-portrait-oval' : ''}" data-name="${pName}" style="left:${xPct.toFixed(1)}%;top:${yPct.toFixed(1)}vh;width:${w}px;height:${h}px;transform:translate(-50%,-50%);${br}">` +
      `<div class="canvas" style="${br}"><img src="assets/avatars/${sl}.png" alt="${pName}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:.35;filter:sepia(.5) brightness(.65) contrast(1.15);${br}" onerror="this.style.display='none'"></div>` +
      `<div class="frame" style="${br}"></div></div>`;
  });

  const atmosphere = `
<div class="nm-atmosphere">
  <div class="nm-ceiling"></div>
  <div class="nm-columns"><div class="nm-col"></div><div class="nm-col"></div><div class="nm-col"></div><div class="nm-col"></div></div>
  <div class="nm-panels"><div class="nm-panel"></div><div class="nm-panel"></div><div class="nm-panel"></div></div>
  <div class="nm-portraits">${portraitsHtml}</div>
  <div class="nm-deco-statues"><div class="nm-deco-statue"><div class="fig"></div><div class="ped"></div></div><div class="nm-deco-statue"><div class="fig"></div><div class="ped"></div></div></div>
  <div class="nm-ceiling-lights"><div class="nm-clight"></div><div class="nm-clight"></div><div class="nm-clight"></div></div>
  <div class="nm-dust"><div class="nm-mote"></div><div class="nm-mote"></div><div class="nm-mote"></div><div class="nm-mote"></div><div class="nm-mote"></div><div class="nm-mote"></div></div>
  <div class="nm-laser-grid"><div class="nm-laser"></div><div class="nm-laser"></div><div class="nm-laser"></div><div class="nm-laser"></div><div class="nm-laser"></div><div class="nm-laser nm-laser-v"></div><div class="nm-laser nm-laser-v"></div><div class="nm-laser nm-laser-v"></div></div>
  <div class="nm-alarm-wash"></div>
  <div class="nm-alarm-blast" id="nm-alarm-blast"></div>
  <div class="nm-gallery-glow"></div>
  <div class="nm-siege-pulse"></div>
  <div class="nm-floor"></div>
</div>`;

  const sidebar = phaseCls === 'title' ? '' : (() => {
    const sidebarContent = _buildSidebarContent(ep, 'nm-' + phaseCls);
    return `<div class="nm-sidebar" role="complementary" aria-label="Museum status"><div class="nm-sb" id="nm-sidebar-inner" aria-live="polite"><div class="nm-sb-hdr">${_nmIcon('statue')}MUSEUM STATUS</div><div class="nm-sb-body">${sidebarContent}</div></div></div>`;
  })();

  return `${css}
<div class="nm-wrap" data-phase="${phaseCls}">
${atmosphere}
<div class="nm-shell" data-phase="${phaseCls}">
  <div class="nm-main">${content}</div>
  ${sidebar}
</div>
</div>`;
}


// ══════════════════════════════════════════════════════════════════════
// VP: CHATTER TEXT POOLS
// ══════════════════════════════════════════════════════════════════════

const SEC_CHATTER = [
  'The marble halls hold their breath. Somewhere a camera rotates...',
  'Infrared beams cut through the darkness like surgical lasers...',
  'A distant alarm test echoes through the east wing. False alarm. This time.',
  'The security feeds flicker. Night vision. Green shadows. Moving shapes.',
  'Every footstep on marble feels like a thunderclap in this silence...',
  'The motion sensors are calibrated to detect anything larger than a housecat. Unfortunately, the museum cats are larger than housecats.',
  'Red emergency lights wash across the corridor ceiling in slow, menacing sweeps...',
  'The pressure tiles hum with stored energy. One wrong step...',
];

const SYS_READOUT = [
  'SYS > SECTOR 2 SWEEP COMPLETE — NO ANOMALIES',
  'SYS > CAMERA 7 ROTATING — BLIND SPOT: 0.8s',
  'SYS > MOTION GRID RECALIBRATING...',
  'SYS > PRESSURE FLOOR SENSITIVITY: HIGH — THRESHOLD: 4.2kg',
  'SYS > INFRARED ARRAY: NOMINAL — NEXT CYCLE: 8s',
  'SYS > WARNING: ACOUSTIC ANOMALY DETECTED — SECTOR 3',
  'SYS > THERMAL SCAN IN PROGRESS — CORRIDOR B',
  'SYS > CAMERA 12 OFFLINE — MAINTENANCE MODE',
  'SYS > PERIMETER BREACH PROBABILITY: LOW',
  'SYS > GUARD ROTATION: T-MINUS 45s',
  'SYS > VAULT DOOR SENSOR: ARMED — VIBRATION LOCK ENGAGED',
  'SYS > LASER GRID PATTERN SHIFT IN 3... 2... 1...',
];

const GALLERY_CHATTER = [
  'Moonlight filters through the skylight dome, painting silver pools across the gallery floor...',
  'The ancient exhibits seem to watch from their cases. Marble eyes. Bronze faces. Waiting.',
  'Something moves in the Modern Gallery. Could be a shadow. Could be worse.',
  'The gallery air is thick with dust and history. And something else.',
  'A portrait\'s eyes follow the contestants across the room. Or is that just the lighting?',
  'The vault door gleams in the distance. Whatever\'s inside, it\'s well-protected.',
  'Footsteps echo differently in each gallery. The Sculpture Hall booms. The Ancient Wing whispers.',
  'The display cases hum with climate control. Behind the glass, treasures wait to be found.',
];

const ASSEMBLY_CHATTER = [
  'The pedestal stands empty. Not for long.',
  'Heavy marble fragments wait on the floor. This is the hard part.',
  'Somewhere in the galleries, the animals pace. They know something is happening.',
  'The assembly area is bathed in amber spotlight. Every move is visible.',
  'Time is running out. The pieces must fit. The statue must rise.',
  'Animal growls echo from the corridor. The defenders grip their positions.',
  'Marble dust hangs in the air. The smell of stone and sweat.',
  'The coordinator barks orders. The builder\'s hands tremble. The defender watches the shadows.',
];


// ══════════════════════════════════════════════════════════════════════
// VP: ALARM DOTS HELPER
// ══════════════════════════════════════════════════════════════════════

function _alarmDots(count, max) {
  max = max || 5;
  let dots = '';
  for (let i = 0; i < max; i++) {
    dots += `<div class="nm-alarm-dot${i < count ? ' triggered' : ''}"></div>`;
  }
  return `<div class="nm-alarm-dots">${dots}</div>`;
}

function _scoreBar(label, pct, cls, val) {
  return `<div class="nm-score-bar"><span style="font-size:10px;color:var(--nm-muted);">${label}</span><div class="nm-strack"><div class="nm-sfill ${cls}" style="width:${Math.min(100, Math.max(5, pct))}%;"></div></div><span class="nm-sval ${cls === 'nm-sfill-g' ? 'nm-sval-g' : cls === 'nm-sfill-d' ? 'nm-sval-d' : 'nm-sval-w'}">${val}</span></div>`;
}

function _weightBar(level, label) {
  const segs = 5;
  let html = '<div class="nm-weight"><span class="nm-weight-label">WEIGHT</span><div class="nm-weight-bar">';
  for (let i = 0; i < segs; i++) html += `<div class="nm-weight-seg${i < level ? ' filled' : ''}"></div>`;
  html += `</div><span style="color:${level >= 4 ? 'var(--nm-gold)' : 'rgba(232,220,200,.3)'};font-size:9px;">${label}</span></div>`;
  return html;
}


// ══════════════════════════════════════════════════════════════════════
// VP: EVENT CARD BUILDER
// ══════════════════════════════════════════════════════════════════════

function _eventCard(ev) {
  const type = ev.type || '';
  let cardCls = 'nm-card';
  let icon = 'frame';
  let label = '';
  let badge = '';
  let badgeCls = 'nm-badge-hero';
  let extra = '';

  switch (type) {
    case 'security-pass':
      cardCls += ' nm-card-security'; icon = 'laser';
      label = `${ev.player} — Security Roll`; badge = 'CLEAR'; badgeCls = 'nm-badge-pass';
      extra = _scoreBar('Security Score', 72, 'nm-sfill-g', '+2');
      break;
    case 'security-fail':
      cardCls += ' nm-card-alarm'; icon = 'alarm';
      label = `${ev.player} — Security Roll`; badge = 'ALARM!'; badgeCls = 'nm-badge-fail';
      extra = `<div class="nm-siren-bar"></div><div class="nm-alarm-meter"><div class="nm-alarm-label">ALARM COUNT</div>${_alarmDots(ev.alarmCount || 1)}</div>` + _scoreBar('Score', 40, 'nm-sfill-d', '-2') + `<div class="nm-siren-bar"></div>`;
      break;
    case 'teammate-tip':
      cardCls += ' nm-card-social'; icon = 'bond';
      label = 'Teammate Tip'; badge = 'MICRO-EVENT'; badgeCls = 'nm-badge-social';
      extra = _scoreBar('Roll boost', 65, 'nm-sfill-gold', '+0.15');
      break;
    case 'animal-startle':
      cardCls += ' nm-card-animal'; icon = 'paw';
      label = 'Animal Startle'; badge = 'DISRUPTION'; badgeCls = 'nm-badge-danger';
      extra = _scoreBar('Roll penalty', 45, 'nm-sfill-d', '-0.15');
      break;
    case 'villain-guinea-pig':
      cardCls += ' nm-card-danger'; icon = 'camera';
      label = 'Sabotage'; badge = 'VILLAIN'; badgeCls = 'nm-badge-danger';
      break;
    case 'hero-scout':
      cardCls += ' nm-card-hero'; icon = 'shield';
      label = `${ev.player} — Scout`; badge = 'HERO'; badgeCls = 'nm-badge-hero';
      break;
    case 'self-psyche-out':
      cardCls += ' nm-card-danger'; icon = 'alarm';
      label = 'Self Doubt'; badge = 'NERVES'; badgeCls = 'nm-badge-danger';
      break;
    case 'rival-distraction':
      cardCls += ' nm-card-danger'; icon = 'camera';
      label = 'Rival Distraction'; badge = 'SABOTAGE'; badgeCls = 'nm-badge-danger';
      break;
    case 'showmance-calm':
      cardCls += ' nm-card-social'; icon = 'bond';
      label = 'Showmance Calm'; badge = 'ROMANCE'; badgeCls = 'nm-badge-social';
      break;
    case 'blame':
      cardCls += ' nm-card-danger'; icon = 'camera';
      label = 'Blame'; badge = 'FRICTION'; badgeCls = 'nm-badge-danger';
      if (ev.blamer && ev.target) {
        extra = `<div class="nm-blame"><span class="nm-blame-arrow">→</span><span style="font-size:11px;"><strong>${ev.blamer}</strong> blames <strong>${ev.target}</strong></span><span class="nm-sb-pill nm-sb-pill-d" style="margin-left:auto;">BOND -0.8</span></div>`;
      }
      break;
    case 'shortcut':
      cardCls += ' nm-card-hero'; icon = 'key';
      label = `${ev.player} — Shortcut`; badge = 'DISCOVERY'; badgeCls = 'nm-badge-hero';
      extra = _scoreBar('Search Score', 70, 'nm-sfill-gold', '+2');
      break;
    case 'dead-end':
      cardCls += ' nm-card-fumble'; icon = 'search';
      label = `${ev.player} — Dead End`; badge = 'LOST'; badgeCls = 'nm-badge-fumble';
      extra = _scoreBar('Time Lost', 30, 'nm-sfill-d', '-1');
      break;
    case 'piece-found':
      cardCls += ' nm-card-piece'; icon = 'search';
      label = `${ev.player} — Piece Found!`; badge = `PIECE ${ev.pieceNum || '?'}/${ev.total || '?'}`; badgeCls = 'nm-badge-found';
      extra = _scoreBar('Search Score', 68, 'nm-sfill-gold', '+2');
      break;
    case 'animal-dodge':
      cardCls += ' nm-card-animal'; icon = 'paw';
      label = `${ev.player} — Animal Dodge`; badge = 'CLOSE CALL'; badgeCls = 'nm-badge-danger';
      extra = _scoreBar('Escape', 60, 'nm-sfill-g', '+1');
      break;
    case 'animal-caught':
    case 'piece-scattered':
      cardCls += ' nm-card-animal'; icon = 'paw';
      label = `${ev.player} — Animal Encounter!`; badge = type === 'piece-scattered' ? 'PIECE LOST' : 'CAUGHT'; badgeCls = 'nm-badge-danger';
      extra = _scoreBar('Impact', 55, 'nm-sfill-d', type === 'piece-scattered' ? '-2, PIECE LOST' : '-2');
      break;
    case 'teammate-distract':
      cardCls += ' nm-card-hero'; icon = 'shield';
      label = `${ev.hero} — Heroic Distraction`; badge = 'HERO'; badgeCls = 'nm-badge-hero';
      extra = _scoreBar('Hero Score', 75, 'nm-sfill-g', '+2') + `<div style="display:flex;gap:8px;margin-top:6px;"><span class="nm-sb-pill nm-sb-pill-g">POP +1</span><span class="nm-sb-pill nm-sb-pill-w">BOND +0.5</span></div>`;
      break;
    case 'search-help':
      cardCls += ' nm-card-social'; icon = 'bond';
      label = `${ev.helper || 'Teammate'} — Search Help`; badge = 'TEAMWORK'; badgeCls = 'nm-badge-social';
      break;
    case 'search-sabotage':
      cardCls += ' nm-card-danger'; icon = 'camera';
      label = `${ev.villain || 'Saboteur'} — Sabotage`; badge = 'VILLAIN'; badgeCls = 'nm-badge-danger';
      break;
    case 'search-encourage':
      cardCls += ' nm-card-social'; icon = 'bond';
      label = `${ev.encourager || 'Teammate'} — Encouragement`; badge = 'MORALE'; badgeCls = 'nm-badge-social';
      break;
    case 'search-rivalry':
      cardCls += ' nm-card-danger'; icon = 'debate';
      label = 'Rivalry Tension'; badge = 'FRICTION'; badgeCls = 'nm-badge-danger';
      break;
    case 'search-bond':
      cardCls += ' nm-card-social'; icon = 'bond';
      label = 'Trust Moment'; badge = 'BOND'; badgeCls = 'nm-badge-social';
      break;
    case 'search-showmance':
      cardCls += ' nm-card-social'; icon = 'bond';
      label = 'Stolen Moment'; badge = 'ROMANCE'; badgeCls = 'nm-badge-social';
      break;
    case 'carry-success':
      cardCls += ' nm-card-build'; icon = 'build';
      label = `${ev.player} — ${ev.slotLabel ? ev.slotLabel + ' ' : ''}Carried`; badge = 'DELIVERED'; badgeCls = 'nm-badge-build';
      extra = _scoreBar('Carry', 70, 'nm-sfill-g', '+1');
      break;
    case 'carry-fail':
      cardCls += ' nm-card-fumble'; icon = 'build';
      label = `${ev.player} — ${ev.slotLabel ? ev.slotLabel + ' ' : ''}Dropped`; badge = 'DROPPED'; badgeCls = 'nm-badge-fumble';
      extra = _scoreBar('Carry', 30, 'nm-sfill-d', '-1');
      break;
    case 'decode-success':
      cardCls += ' nm-card-build'; icon = 'key';
      label = `${ev.player} — ${ev.slotLabel ? ev.slotLabel + ' ' : ''}Decoded`; badge = 'SOLVED'; badgeCls = 'nm-badge-build';
      break;
    case 'decode-fail':
      cardCls += ' nm-card-fumble'; icon = 'key';
      label = `${ev.player} — ${ev.slotLabel ? ev.slotLabel + ' ' : ''}Decode Failed`; badge = 'WRONG'; badgeCls = 'nm-badge-fumble';
      extra = _scoreBar('Decode', 30, 'nm-sfill-d', '-1');
      break;
    case 'assembly-success':
      cardCls += ' nm-card-build'; icon = 'build';
      label = `${ev.player} — ${ev.slotLabel || 'Piece'} Placed`; badge = 'SUCCESS'; badgeCls = 'nm-badge-build';
      extra = _scoreBar('Placement', 78, 'nm-sfill-g', '+2');
      break;
    case 'assembly-fumble':
      cardCls += ' nm-card-fumble'; icon = 'build';
      label = `${ev.player} — ${ev.slotLabel || 'Piece'} Fumbled`; badge = 'MISALIGNED'; badgeCls = 'nm-badge-fumble';
      extra = _scoreBar('Placement', 35, 'nm-sfill-d', '-1');
      break;
    case 'wrong-placement':
      cardCls += ' nm-card-fumble'; icon = 'build';
      label = `${ev.player} — ${ev.slotLabel || 'Piece'} Wrong`; badge = 'RESTART'; badgeCls = 'nm-badge-fumble';
      extra = _scoreBar('Placement', 20, 'nm-sfill-d', '-2');
      break;
    case 'defend-success':
      cardCls += ' nm-card-defend'; icon = 'shield';
      label = `${ev.player} — Defense`; badge = 'BLOCKED'; badgeCls = 'nm-badge-defend';
      extra = _scoreBar('Defend Score', 82, 'nm-sfill-g', '+2') + `<div style="display:flex;gap:8px;margin-top:6px;"><span class="nm-sb-pill nm-sb-pill-g">POP +1</span><span class="nm-sb-pill nm-sb-pill-w">BOND +0.5</span></div>`;
      break;
    case 'defend-fail':
      cardCls += ' nm-card-alarm'; icon = 'alarm';
      label = `${ev.player} — Defense Failed`; badge = 'KNOCKED'; badgeCls = 'nm-badge-fail';
      extra = _scoreBar('Damage', 65, 'nm-sfill-d', '-3, PIECE LOST');
      break;
    case 'defender-heroic':
      cardCls += ' nm-card-hero'; icon = 'shield';
      label = `${ev.player} — Heroic Save`; badge = 'HERO'; badgeCls = 'nm-badge-hero';
      break;
    case 'coordinator-argue':
      cardCls += ' nm-card-debate'; icon = 'debate';
      label = 'Coordinator Clash'; badge = 'FRICTION'; badgeCls = 'nm-badge-fumble';
      break;
    case 'villain-slow':
      cardCls += ' nm-card-danger'; icon = 'camera';
      label = `${ev.player} — Deliberate Slow`; badge = 'SABOTAGE'; badgeCls = 'nm-badge-danger';
      break;
    case 'assembly-encourage':
      cardCls += ' nm-card-social'; icon = 'bond';
      label = 'Encouragement'; badge = 'MORALE'; badgeCls = 'nm-badge-social';
      break;
    case 'showmance-comfort':
      cardCls += ' nm-card-social'; icon = 'bond';
      label = 'Showmance Comfort'; badge = 'ROMANCE'; badgeCls = 'nm-badge-social';
      if (ev.players) {
        extra = `<div style="display:flex;gap:8px;margin-top:8px;"><span class="nm-sb-pill nm-sb-pill-w">BOND +0.5</span><span class="nm-sb-pill nm-sb-pill-g">SHOWMANCE</span></div>`;
      }
      break;
    case 'defender-blame':
      cardCls += ' nm-card-danger'; icon = 'camera';
      label = `${ev.blamer || 'Teammate'} — Blame`; badge = 'BLAME'; badgeCls = 'nm-badge-danger';
      extra = `<div style="display:flex;gap:8px;margin-top:8px;"><span class="nm-sb-pill nm-sb-pill-d">BOND -0.5</span><span class="nm-sb-pill nm-sb-pill-d">POP -1</span></div>`;
      break;
    case 'host':
      return `<div class="nm-chatter nm-chatter-host">${ev.text || ''}</div>`;
    default:
      label = type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  const pName = (type === 'teammate-distract' ? ev.hero : null) || ev.player || ev.hero || ev.blamer || ev.taunter || ev.encourager || ev.helper || ev.villain || (ev.players && ev.players[0]);
  const iconHtml = pName ? _nmPortraitIcon(pName) : _nmIcon(icon);

  return `<div class="${cardCls}"><div class="nm-hdr">${iconHtml}<div class="nm-label">${label}</div><div class="nm-badge ${badgeCls}">${badge}</div></div><div class="nm-txt">${ev.text || ev.narration || ''}</div>${extra}</div>`;
}


// ══════════════════════════════════════════════════════════════════════
// VP: CROSS-TRIBE EVENT CARD
// ══════════════════════════════════════════════════════════════════════

function _renderCrossTribeCard(ev, steps, stepMeta) {
  if (ev.type === 'piece-race') {
    let extra = `<div style="text-align:center;margin-top:8px;font-family:'Playfair Display',serif;font-size:13px;color:var(--nm-gold);font-weight:700;letter-spacing:1px;">${ev.winner} grabs the piece!</div>`;
    extra += `<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;"><span class="nm-sb-pill nm-sb-pill-g">${ev.winner} +3</span><span class="nm-sb-pill nm-sb-pill-d">${ev.loser} -2</span><span class="nm-sb-pill nm-sb-pill-d">BOND -0.5</span><span class="nm-sb-pill nm-sb-pill-g">POP +2</span>${ev.pieceLost ? '<span class="nm-sb-pill nm-sb-pill-d">PIECE STOLEN</span>' : ''}</div>`;
    steps.push(`<div class="nm-card nm-card-danger" style="border-left:3px solid var(--nm-laser-red);"><div class="nm-hdr">${_nmIcon('trophy')}${_nmPortraitIcon(ev.winner)}${_nmPortraitIcon(ev.loser)}<div class="nm-label">Piece Race — ${ev.gallery || 'Gallery'}</div><div class="nm-badge nm-badge-danger">COLLISION</div></div><div class="nm-txt">${ev.text || ''}</div>${extra}</div>`);
    stepMeta.push({ logType: 'piece', logText: `${ev.winner} beats ${ev.loser} in piece race` });
  } else if (ev.type === 'block') {
    steps.push(`<div class="nm-card nm-card-danger" style="border-left:3px solid var(--nm-laser-red);"><div class="nm-hdr">${_nmPortraitIcon(ev.blocker)}${_nmPortraitIcon(ev.target)}<div class="nm-label">Block — ${ev.gallery || 'Gallery'}</div><div class="nm-badge nm-badge-danger">BLOCKED</div></div><div class="nm-txt">${ev.text || ''}</div><div style="display:flex;gap:8px;margin-top:6px;"><span class="nm-sb-pill nm-sb-pill-d">${ev.target} -2</span><span class="nm-sb-pill nm-sb-pill-d">BOND -0.7</span><span class="nm-sb-pill nm-sb-pill-d">POP -1 BOTH</span></div></div>`);
    stepMeta.push({ logText: `${ev.blocker} blocks ${ev.target}` });
  } else if (ev.type === 'taunt' || ev.type === 'trash-talk') {
    const who = ev.taunter || (ev.players && ev.players[0]);
    const target = ev.target || (ev.players && ev.players[1]);
    steps.push(`<div class="nm-card nm-card-danger"><div class="nm-hdr">${who ? _nmPortraitIcon(who) : _nmIcon('debate')}${target ? _nmPortraitIcon(target) : ''}<div class="nm-label">Trash Talk — ${ev.gallery || 'Gallery'}</div><div class="nm-badge nm-badge-danger">RIVALRY</div></div><div class="nm-txt">${ev.text || ''}</div><div style="display:flex;gap:8px;margin-top:6px;"><span class="nm-sb-pill nm-sb-pill-d">${target} -1</span><span class="nm-sb-pill nm-sb-pill-d">BOND -0.5</span><span class="nm-sb-pill nm-sb-pill-d">POP -1 BOTH</span></div></div>`);
    stepMeta.push({ logText: `${who} taunts ${target}` });
  } else if (ev.type === 'respect') {
    const [a, b] = ev.players || [];
    steps.push(`<div class="nm-card nm-card-social"><div class="nm-hdr">${a ? _nmPortraitIcon(a) : ''}${b ? _nmPortraitIcon(b) : ''}<div class="nm-label">Mutual Respect — ${ev.gallery || 'Gallery'}</div><div class="nm-badge nm-badge-social">RESPECT</div></div><div class="nm-txt">${ev.text || ''}</div><div style="display:flex;gap:8px;margin-top:6px;"><span class="nm-sb-pill nm-sb-pill-w">BOND +0.5</span><span class="nm-sb-pill nm-sb-pill-g">POP +1 BOTH</span></div></div>`);
    stepMeta.push({ logText: `${a} and ${b}: mutual respect` });
  } else if (ev.type === 'alliance-moment') {
    const [a, b] = ev.players || [];
    steps.push(`<div class="nm-card nm-card-social" style="border-left:3px solid var(--nm-gold);"><div class="nm-hdr">${a ? _nmPortraitIcon(a) : ''}${b ? _nmPortraitIcon(b) : ''}<div class="nm-label">Alliance — ${ev.gallery || 'Gallery'}</div><div class="nm-badge nm-badge-hero">CROSS-TRIBAL</div></div><div class="nm-txt">${ev.text || ''}</div><div style="display:flex;gap:8px;margin-top:6px;"><span class="nm-sb-pill nm-sb-pill-w">BOND +0.8</span><span class="nm-sb-pill nm-sb-pill-g">+1 BOTH</span></div></div>`);
    stepMeta.push({ logText: `${a} and ${b}: alliance forming` });
  }
}


// VP: GALLERY MAP BUILDER
// ══════════════════════════════════════════════════════════════════════

function _buildGalleryMap(ep) {
  const data = ep.nightAtMuseum;
  if (!data) return '';
  const rooms = [
    { name: 'SCULPTURE HALL', left: '5%', top: '35%', w: '22%', h: '45%' },
    { name: 'ANCIENT WING', left: '32%', top: '25%', w: '20%', h: '50%' },
    { name: 'MODERN GALLERY', left: '57%', top: '30%', w: '18%', h: '45%' },
    { name: 'THE VAULT', left: '80%', top: '35%', w: '16%', h: '40%' },
  ];
  const corridors = [
    { left: '27%', top: '52%', w: '5%', h: '3px' },
    { left: '52%', top: '50%', w: '5%', h: '3px' },
    { left: '75%', top: '52%', w: '5%', h: '3px' },
  ];

  let html = `<div class="nm-map-wrap"><div class="nm-ornate-strip"></div><div class="nm-map" id="nm-map"><div class="nm-map-grid"></div>`;
  html += `<div class="nm-map-title"><div class="nm-map-title-text">MUSEUM FLOOR PLAN</div><div class="nm-map-phase">PHASE 2 · GALLERY SEARCH</div></div>`;
  rooms.forEach((r, i) => {
    html += `<div class="nm-map-room" data-name="${r.name}" style="left:${r.left};top:${r.top};width:${r.w};height:${r.h};"></div>`;
  });
  corridors.forEach(c => {
    html += `<div class="nm-map-corridor" style="left:${c.left};top:${c.top};width:${c.w};height:${c.h};"></div>`;
  });
  // Animal markers
  html += `<div class="nm-map-animal" style="left:40%;top:65%;"><div class="paw-mini"></div></div>`;
  html += `<div class="nm-map-animal" style="left:70%;top:40%;"><div class="paw-mini"></div></div>`;
  // Tribe markers
  const tribes = data.tribes || [];
  tribes.forEach((t, ti) => {
    const cc = ti === 0 ? 'y' : 'r';
    const initials = t.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const baseLeft = ti === 0 ? 16 : 36;
    html += `<div class="nm-map-marker nm-map-marker-${cc}" id="nm-map-marker-${t.name}" style="left:${baseLeft}%;top:50%;">${initials}</div>`;
  });
  html += `</div><div class="nm-ornate-strip"></div></div>`;
  return html;
}


// ══════════════════════════════════════════════════════════════════════
// VP: STATUE ASSEMBLY VISUAL
// ══════════════════════════════════════════════════════════════════════

function _buildStatueVisual(tribeData, tribeSuffix, forReveal) {
  if (!tribeData) return '';
  const ar = tribeData.assemblyResult || {};
  const statueType = tribeData.statue || 'classical';
  const slots = STATUE_TYPES[statueType]?.slots || STATUE_TYPES.classical.slots;
  const total = tribeData.totalPieces || slots.length;
  const sfx = tribeSuffix || tribeData.name || 'tribe';

  let html = `<div class="nm-statue-wrap" id="nm-statue-${sfx}">`;
  html += `<div class="nm-statue-shadow"></div>`;
  html += `<div class="nm-statue-complete" id="nm-statue-glow-${sfx}"><div class="glow"></div></div>`;
  // Ghost slots
  slots.forEach(s => { html += `<div class="nm-sp nm-sp-${s.id} nm-sp-ghost"><div class="shape"></div></div>`; });
  // Active pieces — all start hidden when forReveal, otherwise use final pieceStates
  const ps = ar.pieceStates || {};
  slots.forEach(s => {
    const state = forReveal ? 'waiting' : (ps[s.id] || 'waiting');
    const cls = state === 'placed' ? ' placed' : state === 'fumbled' ? ' fumbled' : state === 'knocked' ? ' knocked' : '';
    const vis = (state === 'waiting' || forReveal) ? 'opacity:0;' : '';
    html += `<div class="nm-sp nm-sp-${s.id}${cls}" id="nm-sp-${sfx}-${s.id}" style="${vis}"><div class="shape"></div></div>`;
  });
  html += `<div class="nm-pedestal"></div>`;
  html += `<div class="nm-statue-counter" id="nm-statue-count-${sfx}">0 / ${total}</div>`;
  html += `</div>`;
  return html;
}


// ══════════════════════════════════════════════════════════════════════
// VP SCREEN 1: TITLE CARD
// ══════════════════════════════════════════════════════════════════════

export function rpBuildNMTitleCard(ep) {
  const data = ep.nightAtMuseum;
  if (!data) return '<div>No museum data</div>';
  const tribes = data.tribes || [];
  const epNum = (window.vpEpNum || gs.episodeHistory?.length || 1);

  // Player grid per tribe
  const tribeGrids = tribes.map((t, ti) => {
    const cc = ti === 0 ? 'y' : (ti === 1 ? 'r' : 'b');
    const borderCol = cc === 'y' ? 'var(--nm-gold)' : (cc === 'r' ? 'var(--nm-tribe-red)' : 'var(--nm-info)');
    const members = (t.members || []).map(name => {
      const sl = slug(name);
      return `<div style="text-align:center;margin:3px;">
        <div style="width:38px;height:38px;border-radius:50%;border:2px solid ${borderCol};overflow:hidden;margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,.4);"><img src="assets/avatars/${sl}.png" alt="${name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'"></div>
        <div style="font-size:7px;color:var(--nm-cream);margin-top:3px;letter-spacing:1px;opacity:.6;">${name}</div>
      </div>`;
    }).join('');
    return `<div style="text-align:center;">
      <div style="font-family:'Playfair Display',serif;font-size:12px;font-weight:700;letter-spacing:2px;color:${borderCol};margin-bottom:6px;">${t.name.toUpperCase()}</div>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:2px;">${members}</div>
    </div>`;
  }).join('');

  // Phase icons
  const phaseIcons = `<div style="display:flex;justify-content:center;gap:28px;margin-top:24px;">
    <div style="text-align:center;">${_nmIcon('laser')}<div style="font-size:7px;letter-spacing:2px;color:var(--nm-muted);margin-top:4px;">SECURITY</div></div>
    <div style="text-align:center;">${_nmIcon('search')}<div style="font-size:7px;letter-spacing:2px;color:var(--nm-muted);margin-top:4px;">GALLERY</div></div>
    <div style="text-align:center;">${_nmIcon('build')}<div style="font-size:7px;letter-spacing:2px;color:var(--nm-muted);margin-top:4px;">ASSEMBLY</div></div>
    <div style="text-align:center;">${_nmIcon('paw')}<div style="font-size:7px;letter-spacing:2px;color:var(--nm-muted);margin-top:4px;">ANIMALS</div></div>
  </div>`;

  const coldOpen = 'The contestants step through towering marble columns into the grand atrium. Moonlight pours through the glass dome above, casting silver pools across the checkered floor. Display cases gleam in the darkness, each one a treasure chest waiting to be cracked. Somewhere deep in the galleries, <strong>something moves</strong>.';

  let html = `
    <div class="nm-title-card">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:4px;color:var(--nm-muted);opacity:.6;">EPISODE ${epNum} — TRIBE CHALLENGE</div>
      ${_nmIcon('statue', true)}
      <div class="nm-tc-title">Night at the Museum</div>
      <div class="nm-tc-sub">WORLD TOUR CHALLENGE</div>
      ${phaseIcons}
      <div style="display:flex;justify-content:center;gap:30px;margin-top:28px;flex-wrap:wrap;">${tribeGrids}</div>
    </div>
    <div class="nm-ornate-strip-thick"></div>
    <div class="nm-step nm-visible" style="margin:12px 0;">
      <div class="nm-card nm-card-framed"><div class="nm-hdr">${_nmIcon('frame')}<div class="nm-label">Grand Entrance</div><div class="nm-badge nm-badge-hero">COLD OPEN</div></div><div class="nm-txt">${coldOpen}</div></div>
    </div>
    <div class="nm-step nm-visible" style="margin:12px 0;">
      <div class="nm-chatter nm-chatter-host" style="opacity:1;">${data.hostIntro || '"Welcome to tonight\'s challenge."'}</div>
    </div>
    <div class="nm-step nm-visible" style="margin:12px 0;">
      <div class="nm-card"><div class="nm-hdr">${_nmIcon('alarm')}<div class="nm-label">Rules Briefing</div></div><div class="nm-txt"><strong>Phase 1:</strong> Navigate the security gauntlet — laser grids, pressure floors, camera sweeps. Every alarm you trigger makes Phase 2 harder.<br><strong>Phase 2:</strong> Search four galleries for scattered statue pieces. Choose your statue wisely.<br><strong>Phase 3:</strong> Assemble your statue while the museum's... inhabitants... try to stop you.</div></div>
    </div>`;

  return _nmShell(html, ep, 'title');
}


// ══════════════════════════════════════════════════════════════════════
// VP SCREEN 2: SECURITY BREACH
// ══════════════════════════════════════════════════════════════════════

export function rpBuildNMSecurity(ep) {
  const data = ep.nightAtMuseum;
  if (!data) return '<div>No museum data</div>';
  const tribes = data.tribes || [];
  const suffix = 'security';

  const steps = [];
  const stepMeta = [];

  // System readout
  steps.push(`<div class="nm-sec-readout">SYS &gt; SECURITY GRID ONLINE — MOTION SENSORS ACTIVE — CAMERA SWEEP: 12s CYCLE</div>`);
  stepMeta.push({ logText: null });

  let alarmCounts = {};
  tribes.forEach(t => { alarmCounts[t.name] = 0; });

  let sysIdx = 0;
  const _sysReadout = () => SYS_READOUT[sysIdx++ % SYS_READOUT.length];

  tribes.forEach((t, ti) => {
    const cc = ti === 0 ? 'y' : (ti === 1 ? 'r' : 'b');

    // Tribe POV header
    steps.push(`<div class="nm-tribe-pov nm-tribe-pov-${cc}"><div class="nm-sb-tribe nm-sb-tribe-${cc}"></div>${t.name.toUpperCase()}<div style="margin-left:auto;">${_alarmDots(0)}</div></div>`);
    stepMeta.push({ tribe: t.name, logText: null });

    // Filter to security roll events only (skip host, clean-sweep, blame — handled separately)
    const events = (t.phase1Events || []).filter(ev => ev.type !== 'host' && ev.type !== 'clean-sweep' && ev.type !== 'blame');

    // Group consecutive passes for compact display, but keep fails/pre-events as full cards
    let clearStreak = [];
    const _flushClears = () => {
      if (clearStreak.length === 0) return;
      if (clearStreak.length === 1) {
        // Single clear — full card
        const ev = clearStreak[0];
        steps.push(_eventCard({ type: 'security-pass', player: ev.player, text: ev.narration || ev.text || '' }));
        stepMeta.push({ tribe: t.name, player: ev.player, scoreDelta: 2, alarm: false, logType: 'pass', logText: `${ev.player} clears security` });
      } else {
        // Multiple consecutive clears — compact multi-player card
        const portraits = clearStreak.map(ev => _nmPortraitIcon(ev.player)).join('');
        const names = clearStreak.map(ev => `<strong>${ev.player}</strong>`);
        const nameStr = names.length === 2 ? names.join(' and ') : names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1];
        const flavorPool = [
          `${nameStr} slip through the security grid one after another — clean, precise, professional.`,
          `Like dominoes in reverse. ${nameStr} each find their window and take it. No hesitation.`,
          `${nameStr} move through the corridor in sequence. The lasers don't even flicker.`,
          `One by one, ${nameStr} clear the gauntlet. The museum's defenses might as well be decoration.`,
        ];
        const flavor = flavorPool[Math.floor(Math.random() * flavorPool.length)];
        steps.push(`<div class="nm-card nm-card-security"><div class="nm-hdr">${_nmIcon('laser')}<div style="display:flex;gap:2px;">${portraits}</div><div class="nm-label">Security Clear ×${clearStreak.length}</div><div class="nm-badge nm-badge-pass">ALL CLEAR</div></div><div class="nm-txt">${flavor}</div>${_scoreBar('Combined', 80, 'nm-sfill-g', '+' + (clearStreak.length * 2))}</div>`);
        clearStreak.forEach(ev => {
          stepMeta.push({ tribe: t.name, player: ev.player, scoreDelta: 2, alarm: false, logType: 'pass', logText: `${ev.player} clears security` });
        });
      }
      clearStreak = [];
    };

    let playerIdx = 0;
    events.forEach(ev => {
      const isPass = ev.passed !== false && ev.type !== 'security-fail';
      if (ev.passed === false || ev.type === 'security-fail') alarmCounts[t.name]++;

      // Pre-events always get their own card and flush any streak
      if (ev.preEvent) {
        _flushClears();
        steps.push(_eventCard({ ...ev.preEvent, type: ev.preEvent.type || 'teammate-tip' }));
        stepMeta.push({ tribe: t.name, logText: ev.preEvent.player ? `${ev.preEvent.player}: ${ev.preEvent.type}` : null });
      }

      if (isPass && !ev.preEvent) {
        // Accumulate into clear streak
        clearStreak.push(ev);
      } else {
        _flushClears();
        if (isPass) {
          // Pass after a pre-event — full card
          steps.push(_eventCard({ type: 'security-pass', player: ev.player, text: ev.narration || ev.text || '' }));
          stepMeta.push({ tribe: t.name, player: ev.player, scoreDelta: 2, alarm: false, logType: 'pass', logText: `${ev.player} clears security` });
        } else {
          // FAIL — always a dramatic full card
          steps.push(_eventCard({ type: 'security-fail', player: ev.player, text: ev.narration || ev.text || '', alarmCount: alarmCounts[t.name] }));
          stepMeta.push({ tribe: t.name, player: ev.player, scoreDelta: -2, alarm: true, logType: 'alarm', logText: `${ev.player} triggers alarm #${alarmCounts[t.name]}` });

          // Blame events
          if (ev.blame) {
            steps.push(_eventCard({ type: 'blame', blamer: ev.blame.blamer, target: ev.blame.target || ev.player, text: ev.blame.text || '' }));
            stepMeta.push({ tribe: t.name, logText: `${ev.blame.blamer} blames ${ev.blame.target || ev.player}` });
          }
        }
      }

      playerIdx++;
      // System readout between every 2-3 players for tension
      if (playerIdx % 2 === 0 && playerIdx < events.length) {
        _flushClears();
        steps.push(`<div class="nm-sec-readout">${_sysReadout()}</div>`);
        stepMeta.push({ tribe: t.name, logText: null });
      }
    });
    _flushClears();

    // Host commentary from phase 1
    const hostEvents = (t.phase1Events || []).filter(ev => ev.type === 'host');
    hostEvents.forEach(ev => {
      steps.push(`<div class="nm-chatter nm-chatter-host">${ev.text}</div>`);
      stepMeta.push({ tribe: t.name, logText: null });
    });

    // Clean sweep announcement
    if (t.cleanSweep) {
      steps.push(`<div class="nm-card nm-card-hero"><div class="nm-hdr">${_nmIcon('trophy')}<div class="nm-label">Clean Sweep!</div><div class="nm-badge nm-badge-hero">FLAWLESS</div></div><div class="nm-txt"><strong>${t.name}</strong> cleared the entire security gauntlet without triggering a single alarm. Not a beep. Not a flicker. The museum doesn't even know they're here.</div></div>`);
      stepMeta.push({ tribe: t.name, logType: 'pass', logText: `${t.name}: CLEAN SWEEP` });
    } else if (alarmCounts[t.name] > 0) {
      // Alarm summary for tribes that triggered alarms
      const alarmWord = alarmCounts[t.name] === 1 ? 'alarm' : 'alarms';
      steps.push(`<div class="nm-sec-readout" style="color:var(--nm-laser-red);border-color:rgba(232,64,48,.2);">SYS &gt; ${t.name.toUpperCase()} SECTOR: ${alarmCounts[t.name]} ${alarmWord.toUpperCase()} LOGGED — SECURITY LEVEL ESCALATED</div>`);
      stepMeta.push({ tribe: t.name, logText: `${t.name}: ${alarmCounts[t.name]} ${alarmWord}` });
    }

    // Chatter between tribes
    if (ti < tribes.length - 1) {
      steps.push(`<div class="nm-chatter">${_pickUnique(SEC_CHATTER, 'sec-chatter') || SEC_CHATTER[0]}</div>`);
      stepMeta.push({ logText: null });
    }
  });

  // Animal release transition — the big reveal
  const totalAlarms = Object.values(alarmCounts).reduce((s, v) => s + v, 0);
  const severity = totalAlarms >= 5 ? 'swarm' : totalAlarms >= 3 ? 'elevated' : totalAlarms >= 1 ? 'normal' : 'minimal';
  const releaseText = pick(ANIMAL_RELEASE_TEXT[severity]);
  const severityLabels = { minimal: 'DORMANT', normal: 'ACTIVE', elevated: 'AGGRESSIVE', swarm: 'TOTAL BREACH' };
  const threatLine = totalAlarms === 0
    ? 'Zero alarms. The containment holds — the animals stay in their cages. But they can smell the intruders.'
    : totalAlarms <= 2
    ? `${totalAlarms} alarm${totalAlarms > 1 ? 's' : ''} triggered. The containment grid weakens. The animals stir.`
    : `${totalAlarms} alarms have overloaded the system. Containment failure. The animals are loose and hunting.`;
  steps.push(`<div class="nm-card nm-card-animal" style="border-left:3px solid var(--nm-laser-red);"><div class="nm-hdr">${_nmIcon('paw')}<div class="nm-label">Museum Containment</div><div class="nm-badge nm-badge-danger">${severityLabels[severity]}</div></div><div class="nm-txt">${releaseText}<br><br><em>${threatLine}</em></div></div>`);
  stepMeta.push({ logText: `Animals: ${severity}` });

  // Between-phase events
  const bpEvents = (data.betweenPhaseEvents || []).slice(0, Math.ceil((data.betweenPhaseEvents || []).length / 2));
  bpEvents.forEach(ev => {
    const cardCls = ev.type === 'taunt' ? 'nm-card-social' : ev.type === 'showmance' ? 'nm-card-social' : 'nm-card-social';
    const icon = ev.type === 'taunt' ? 'debate' : ev.type === 'showmance' ? 'bond' : 'debate';
    const badge = ev.type === 'taunt' ? 'CROSS-TRIBE' : ev.type === 'showmance' ? 'ROMANCE' : 'BETWEEN PHASES';
    steps.push(`<div class="nm-card ${cardCls}"><div class="nm-hdr">${_nmIcon(icon)}<div class="nm-label">${ev.type === 'taunt' ? 'Cross-Tribe Taunt' : ev.type === 'showmance' ? 'Cross-Tribe Moment' : 'Between Phases'}</div><div class="nm-badge nm-badge-social">${badge}</div></div><div class="nm-txt">${ev.text || ''}</div></div>`);
    stepMeta.push({ logText: ev.taunter ? `${ev.taunter} taunts ${ev.target}` : null });
  });

  const totalSteps = steps.length;
  if (typeof window !== 'undefined') window._nmSecurityStepMeta = stepMeta;

  let html = '';
  html += `<div class="nm-phase-hdr"><div class="nm-phase-tag">PHASE 01</div><div class="nm-phase-title">Security Breach</div><div class="nm-phase-sub">Navigate the museum's security gauntlet. Laser grids. Pressure floors. Camera sweeps. Every alarm counts.</div></div>`;

  steps.forEach((step, i) => {
    html += `<div class="nm-step" id="nm-step-${suffix}-${i}">${step}</div>`;
  });

  html += `<div class="nm-controls" id="nm-controls-${suffix}"><button type="button" class="nm-btn" aria-label="Reveal next card" onclick="nightMuseumRevealNext('nm-${suffix}',${totalSteps})">NEXT ▶</button><span class="nm-counter" id="nm-counter-${suffix}" aria-live="polite" role="status">0 / ${totalSteps}</span><button type="button" class="nm-btn" aria-label="Reveal all cards" onclick="nightMuseumRevealAll('nm-${suffix}',${totalSteps})">REVEAL ALL</button></div>`;

  return _nmShell(html, ep, 'security');
}


// ══════════════════════════════════════════════════════════════════════
// VP SCREEN 3: GALLERY SEARCH
// ══════════════════════════════════════════════════════════════════════

export function rpBuildNMGallery(ep) {
  const data = ep.nightAtMuseum;
  if (!data) return '<div>No museum data</div>';
  const tribes = data.tribes || [];
  const suffix = 'gallery';

  const steps = [];
  const stepMeta = [];

  // Gallery map
  steps.push(_buildGalleryMap(ep));
  stepMeta.push({ logText: null });

  // Between-phase events (Phase 1 → Phase 2 transition)
  const bpEvents2 = (data.betweenPhaseEvents || []).slice(Math.floor((data.betweenPhaseEvents || []).length / 2));
  bpEvents2.forEach(ev => {
    const icon = ev.type === 'showmance' ? 'bond' : ev.type === 'taunt' ? 'debate' : 'search';
    const label = ev.type === 'taunt' ? 'Cross-Tribe Taunt' : ev.type === 'showmance' ? 'Cross-Tribe Moment' : 'Between Phases';
    steps.push(`<div class="nm-card nm-card-social"><div class="nm-hdr">${_nmIcon(icon)}<div class="nm-label">${label}</div><div class="nm-badge nm-badge-social">BETWEEN PHASES</div></div><div class="nm-txt">${ev.text || ''}</div></div>`);
    stepMeta.push({ logText: null });
  });

  // Statue selection — ordered by security performance
  const pickOrder = data.statuePickOrder || tribes.map(t => t.name);
  pickOrder.forEach((tribeName) => {
    const t = tribes.find(tr => tr.name === tribeName);
    if (!t) return;
    const sel = (t.phase2Events || []).find(e => e.type === 'statue-selection');
    if (!sel) return;
    const allOpts = sel.allOptions || (sel.availableOptions || []).map(o => ({ ...o, taken: false, available: true }));
    const isFirst = sel.isFirstPick;
    const isLast = sel.isLastPick;

    // Build statue option list — show ALL 3 statues with taken/chosen/available styling
    let optionsHtml = `<div class="nm-debate">`;
    optionsHtml += `<div class="nm-debate-title">${isFirst ? 'FIRST PICK — REWARD FOR CLEAN SECURITY' : isLast ? 'ONLY ONE REMAINS' : 'STATUE OPTIONS'}</div>`;
    allOpts.forEach(opt => {
      const isChosen = opt.type === sel.chosen;
      const isTaken = opt.taken;
      const cls = isChosen ? ' chosen' : isTaken ? ' taken' : ' rejected';
      const iconType = isChosen ? 'statue' : opt.type === 'ancient' ? 'key' : opt.type === 'classical' ? 'build' : 'search';
      const takenTag = isTaken ? ' <em style="color:var(--nm-laser-red);font-size:10px;letter-spacing:1px;">[TAKEN]</em>' : '';
      const chosenTag = isChosen ? ' <em style="color:var(--nm-gold);font-size:10px;letter-spacing:1px;">[SELECTED]</em>' : '';
      optionsHtml += `<div class="nm-debate-opt${cls}" ${isTaken ? 'style="opacity:.4;text-decoration:line-through;"' : ''}>${_nmIcon(iconType)}<div><strong>${opt.label}</strong> <span style="color:var(--nm-muted);font-size:11px;">— ${STATUE_TYPES[opt.type]?.desc || ''}</span>${takenTag}${chosenTag}</div></div>`;
    });
    optionsHtml += '</div>';

    // Build reactions HTML
    const reactions = sel.reactions || [];
    let reactionsHtml = '';
    if (reactions.length > 0) {
      reactionsHtml += '<div style="margin-top:10px;border-top:1px solid rgba(212,168,75,.1);padding-top:8px;">';
      reactions.forEach(r => {
        const rIcon = r.type === 'agree' ? '✓' : r.type === 'disagree' ? '✗' : r.type === 'counter' ? '⟵' : '…';
        const rColor = r.type === 'agree' ? 'var(--nm-gold)' : r.type === 'disagree' || r.type === 'counter' ? 'var(--nm-laser-red)' : 'var(--nm-muted)';
        reactionsHtml += `<div style="display:flex;align-items:flex-start;gap:8px;margin:6px 0;font-size:12px;">${_nmPortraitIcon(r.player)}<div><span style="color:${rColor};font-weight:700;margin-right:4px;">${rIcon}</span><span style="opacity:.8;font-style:italic;">${r.text}</span></div></div>`;
      });
      reactionsHtml += '</div>';
    }

    if (isFirst) {
      let advocateHtml = `<div class="nm-txt" style="font-style:italic;opacity:.7;font-size:12px;margin-top:8px;">${sel.text}</div>`;
      steps.push(`<div class="nm-card nm-card-hero"><div class="nm-hdr">${_nmIcon('trophy')}${_nmPortraitIcon(sel.champion)}<div class="nm-label">First Pick</div><div class="nm-badge nm-badge-hero">${t.name.toUpperCase()}</div></div><div class="nm-txt" style="margin-bottom:10px;"><strong>${t.name}</strong> cleared security with the fewest alarms. <strong>${sel.champion}</strong> steps up to claim their statue.</div>${optionsHtml}${advocateHtml}${reactionsHtml}</div>`);
    } else if (isLast) {
      steps.push(`<div class="nm-card nm-card-fumble"><div class="nm-hdr">${_nmIcon('frame')}<div class="nm-label">No Choice</div><div class="nm-badge nm-badge-fumble">${t.name.toUpperCase()}</div></div><div class="nm-txt" style="margin-bottom:10px;">The other tribes picked first. <strong>${t.name}</strong> gets whatever's left: the <strong>${sel.chosenLabel}</strong>.</div>${optionsHtml}</div>`);
    } else {
      let advocateHtml = `<div class="nm-txt" style="font-style:italic;opacity:.7;font-size:12px;margin-top:8px;">${sel.text}</div>`;
      const availCount = allOpts.filter(o => !o.taken).length;
      steps.push(`<div class="nm-card nm-card-debate"><div class="nm-hdr">${_nmIcon('debate')}${_nmPortraitIcon(sel.champion)}<div class="nm-label">Statue Debate</div><div class="nm-badge nm-badge-social">${t.name.toUpperCase()}</div></div><div class="nm-txt" style="margin-bottom:10px;"><strong>${t.name}</strong> debates the ${availCount} remaining options. <strong>${sel.champion}</strong> makes the case.</div>${optionsHtml}${advocateHtml}${reactionsHtml}</div>`);
    }
    stepMeta.push({ tribe: t.name, logType: 'piece', logText: `${t.name} picks ${sel.chosenLabel}` });
  });

  // Gallery-by-gallery: interleave all tribes + cross-tribe events per gallery
  const crossEvents = data.crossTribeEvents || [];
  const isArrayOfArrays = Array.isArray(crossEvents[0]);

  for (let gIdx = 0; gIdx < 4; gIdx++) {
    const galleryName = GALLERY_NAMES[gIdx];

    // Gallery intro header (shared, not per-tribe)
    const galIntro = pick(GALLERY_INTROS[galleryName] || [`The search continues in ${galleryName}.`]);
    steps.push(`<div class="nm-card nm-card-framed" style="border:2px solid rgba(212,168,75,.15);"><div class="nm-hdr">${_nmIcon('frame')}<div class="nm-label">${galleryName}</div><div class="nm-badge nm-badge-hero">GALLERY ${gIdx + 1} OF 4</div></div><div class="nm-txt">${galIntro}</div></div>`);
    stepMeta.push({ logText: null });

    // Each tribe's events for this gallery
    tribes.forEach((t, ti) => {
      const galleryEvents = (t.phase2Events || []).filter(e => e.gallery);
      const gev = galleryEvents[gIdx];
      if (!gev || !gev.events || gev.events.length === 0) return;

      // Tribe sub-header
      const cc = ti === 0 ? 'y' : (ti === 1 ? 'r' : 'b');
      steps.push(`<div class="nm-tribe-pov nm-tribe-pov-${cc}"><div class="nm-sb-tribe nm-sb-tribe-${cc}"></div>${t.name.toUpperCase()} in ${galleryName}</div>`);
      stepMeta.push({ tribe: t.name, logText: null });

      // Room events
      (gev.events || []).forEach(ev => {
        steps.push(_eventCard(ev));
        const isPieceFound = ev.type === 'piece-found';
        const _galDelta = isPieceFound ? 2 : ev.type === 'shortcut' || ev.type === 'teammate-distract' ? 2 : ev.type === 'animal-caught' || ev.type === 'piece-scattered' ? -2 : ev.type === 'animal-dodge' ? 1 : ev.type === 'dead-end' ? -1 : 0;
        stepMeta.push({
          tribe: t.name,
          player: ev.player || null,
          scoreDelta: _galDelta,
          pieceFound: isPieceFound,
          logType: isPieceFound ? 'piece' : ev.type === 'animal-caught' || ev.type === 'piece-scattered' ? 'fail' : ev.type === 'shortcut' || ev.type === 'teammate-distract' ? 'pass' : null,
          logText: ev.player ? `${ev.player}: ${ev.type.replace(/-/g, ' ')}` : null,
        });
      });
    });

    // Cross-tribe events for THIS gallery (interleaved right after both tribes' events)
    const galCross = isArrayOfArrays ? (crossEvents[gIdx] || []) : crossEvents.filter(ev => ev.gallery === GALLERY_NAMES[gIdx]);
    galCross.forEach(ev => {
      _renderCrossTribeCard(ev, steps, stepMeta);
    });

    // Chatter between galleries
    if (gIdx < 3) {
      steps.push(`<div class="nm-chatter">${_pickUnique(GALLERY_CHATTER, 'gal-chatter') || GALLERY_CHATTER[0]}</div>`);
      stepMeta.push({ logText: null });
    }
  }

  // Host commentary
  tribes.forEach(t => {
    const hostEvent = (t.phase2Events || []).find(e => e.type === 'host');
    if (hostEvent) {
      steps.push(`<div class="nm-chatter nm-chatter-host">${hostEvent.text}</div>`);
      stepMeta.push({ logText: null });
    }
  });

  // Animal siege escalation — transition to Phase 3
  if (data.animalSiege) {
    steps.push(`<div class="nm-card nm-card-animal" style="border-left:3px solid var(--nm-laser-red);"><div class="nm-hdr">${_nmIcon('paw')}<div class="nm-label">Animal Siege</div><div class="nm-badge nm-badge-danger">ESCALATION</div></div><div class="nm-txt">${pick(ANIMAL_SIEGE_TEXT)}<br><br><em>The assembly area is under attack. Defenders — take your positions.</em></div></div>`);
    stepMeta.push({ logText: 'Animals converge on assembly' });
  }

  const totalSteps = steps.length;
  if (typeof window !== 'undefined') window._nmGalleryStepMeta = stepMeta;

  let html = '';
  html += `<div class="nm-phase-hdr"><div class="nm-phase-tag">PHASE 02</div><div class="nm-phase-title">Gallery Search</div><div class="nm-phase-sub">Four themed galleries. Scattered statue pieces. Animals prowling. Find what you need before something finds you.</div></div>`;

  steps.forEach((step, i) => {
    html += `<div class="nm-step" id="nm-step-${suffix}-${i}">${step}</div>`;
  });

  html += `<div class="nm-controls" id="nm-controls-${suffix}"><button type="button" class="nm-btn" aria-label="Reveal next card" onclick="nightMuseumRevealNext('nm-${suffix}',${totalSteps})">NEXT ▶</button><span class="nm-counter" id="nm-counter-${suffix}" aria-live="polite" role="status">0 / ${totalSteps}</span><button type="button" class="nm-btn" aria-label="Reveal all cards" onclick="nightMuseumRevealAll('nm-${suffix}',${totalSteps})">REVEAL ALL</button></div>`;

  return _nmShell(html, ep, 'gallery');
}


// ══════════════════════════════════════════════════════════════════════
// VP SCREEN 4: ASSEMBLY UNDER PRESSURE
// ══════════════════════════════════════════════════════════════════════

export function rpBuildNMAssembly(ep) {
  const data = ep.nightAtMuseum;
  if (!data) return '<div>No museum data</div>';
  const tribes = data.tribes || [];
  const suffix = 'assembly';

  const steps = [];
  const stepMeta = [];

  tribes.forEach((t, ti) => {
    const cc = ti === 0 ? 'y' : (ti === 1 ? 'r' : 'b');
    const sfx = (t.name || 'tribe').replace(/\s+/g, '-').toLowerCase();
    const slots = STATUE_TYPES[t.statue]?.slots || STATUE_TYPES.classical.slots;

    // Role assignment
    const roleEvent = (t.phase3Events || []).find(e => e.type === 'role-assignment');
    if (roleEvent) {
      let roleHtml = `<div class="nm-debate"><div class="nm-debate-title">ROLE ASSIGNMENTS</div>`;
      if (roleEvent.roles.builder) roleHtml += `<div class="nm-debate-opt chosen">${_nmIcon('build')}<div><strong>Builder: ${roleEvent.roles.builder}</strong> <span style="color:var(--nm-muted);font-size:11px;">— mental + intuition</span></div></div>`;
      if (roleEvent.roles.defender) roleHtml += `<div class="nm-debate-opt chosen">${_nmIcon('shield')}<div><strong>Defender: ${roleEvent.roles.defender}</strong> <span style="color:var(--nm-muted);font-size:11px;">— physical + boldness</span></div></div>`;
      if (roleEvent.roles.coordinator) roleHtml += `<div class="nm-debate-opt chosen">${_nmIcon('bond')}<div><strong>Coordinator: ${roleEvent.roles.coordinator}</strong> <span style="color:var(--nm-muted);font-size:11px;">— social + strategic</span></div></div>`;
      roleHtml += '</div>';
      steps.push(`<div class="nm-card nm-card-debate"><div class="nm-hdr">${_nmIcon('debate')}<div class="nm-label">Role Assignment</div><div class="nm-badge nm-badge-hero">${t.name.toUpperCase()}</div></div><div class="nm-txt" style="margin-bottom:10px;">Three roles. Three tribe members. The rest provide support.</div>${roleHtml}</div>`);
      stepMeta.push({ tribe: t.name, logText: `${t.name}: roles assigned` });
    }

    // Statue tracker — live-updating silhouette
    steps.push(`<div class="nm-card" style="padding:20px;"><div class="nm-hdr">${_nmIcon('statue')}<div class="nm-label">${STATUE_TYPES[t.statue]?.label || 'Statue'} — ${t.name}</div><div class="nm-badge nm-badge-build" id="nm-statue-badge-${sfx}">0 / ${t.totalPieces || slots.length} PLACED</div></div>${_buildStatueVisual(t, sfx, true)}</div>`);
    stepMeta.push({ tribe: t.name, tribeSfx: sfx, logText: null, isStatueCard: true });

    // Phase 3 events (excluding role-assignment)
    const events = (t.phase3Events || []).filter(e => e.type !== 'role-assignment');

    events.forEach(ev => {
      if (ev.type === 'host') {
        steps.push(`<div class="nm-chatter nm-chatter-host">${ev.text}</div>`);
        stepMeta.push({ tribe: t.name, tribeSfx: sfx, logText: null });
        return;
      }

      const isPlace = ev.type === 'assembly-success';
      const isFumble = ev.type === 'assembly-fumble' || ev.type === 'wrong-placement';
      const isDefendFail = ev.type === 'defend-fail';
      const slotId = ev.slotId || null;
      const slotDef = slotId ? slots.find(s => s.id === slotId) : null;

      // Build card — _eventCard uses ev.slotLabel for piece-specific labels
      let card = _eventCard(ev);

      // Add weight bar for all placement events (all statue types)
      if ((isPlace || isFumble) && slotDef) {
        const insertIdx = card.lastIndexOf('</div>');
        card = card.substring(0, insertIdx) + _weightBar(slotDef.weight, slotDef.wLabel) + card.substring(insertIdx);
      }

      // Add knocked piece label for failed defenses
      if (isDefendFail && ev.knockedSlotId) {
        const knockedSlot = slots.find(s => s.id === ev.knockedSlotId);
        if (knockedSlot) {
          const knockTag = `<div style="margin-top:6px;"><span class="nm-sb-pill nm-sb-pill-d">${knockedSlot.label.toUpperCase()} KNOCKED OFF</span></div>`;
          const insertIdx = card.lastIndexOf('</div>');
          card = card.substring(0, insertIdx) + knockTag + card.substring(insertIdx);
        }
      }

      // Final piece highlight
      if (isPlace && ev.pieceNum >= (t.totalPieces || slots.length)) {
        card = card.replace('nm-card-build', 'nm-card-hero" style="border:2px solid rgba(212,168,75,.2);');
        const insertIdx = card.lastIndexOf('</div>');
        const bonusBar = `<div class="nm-score-bar" style="margin-top:10px;"><span style="font-size:10px;color:var(--nm-gold);font-weight:700;">Completion Bonus</span><div class="nm-strack"><div class="nm-sfill nm-sfill-gold" style="width:100%;"></div></div><span class="nm-sval nm-sval-w">+5</span></div>`;
        card = card.substring(0, insertIdx) + bonusBar + card.substring(insertIdx);
      }

      steps.push(card);

      // stepMeta tracks statue state changes for live tracker updates
      let statueAction = null;
      if (isPlace && slotId) statueAction = { slotId, state: 'placed' };
      else if (isFumble && slotId) statueAction = { slotId, state: 'fumbled' };
      else if (isDefendFail && ev.knockedSlotId) statueAction = { slotId: ev.knockedSlotId, state: 'knocked' };

      const _asmDelta = isPlace ? 2 : isFumble ? -1 : ev.type === 'wrong-placement' ? -2 : ev.type === 'defend-success' ? 2 : ev.type === 'defend-fail' ? -3 : 0;
      stepMeta.push({
        tribe: t.name,
        tribeSfx: sfx,
        player: ev.player || null,
        scoreDelta: _asmDelta,
        placed: isPlace ? 1 : 0,
        statueAction,
        logType: isPlace ? 'build' : ev.type === 'defend-success' ? 'defend' : ev.type === 'defend-fail' ? 'fail' : null,
        logText: ev.player ? `${ev.player}: ${ev.type.replace(/-/g, ' ')}${ev.slotLabel ? ' (' + ev.slotLabel + ')' : ''}` : null,
      });
    });

    // Chatter between tribes
    if (ti < tribes.length - 1) {
      steps.push(`<div class="nm-chatter">${_pickUnique(ASSEMBLY_CHATTER, 'asm-chatter') || ASSEMBLY_CHATTER[0]}</div>`);
      stepMeta.push({ logText: null });
    }
  });

  const totalSteps = steps.length;
  if (typeof window !== 'undefined') window._nmAssemblyStepMeta = stepMeta;

  let html = '';
  html += `<div class="nm-phase-hdr"><div class="nm-phase-tag">PHASE 03</div><div class="nm-phase-title">Assembly Under Pressure</div><div class="nm-phase-sub">Build your statue. Piece by piece. While the animals close in. Every placement counts. Every failed defense costs you.</div></div>`;

  steps.forEach((step, i) => {
    html += `<div class="nm-step" id="nm-step-${suffix}-${i}">${step}</div>`;
  });

  html += `<div class="nm-controls" id="nm-controls-${suffix}"><button type="button" class="nm-btn" aria-label="Reveal next card" onclick="nightMuseumRevealNext('nm-${suffix}',${totalSteps})">NEXT ▶</button><span class="nm-counter" id="nm-counter-${suffix}" aria-live="polite" role="status">0 / ${totalSteps}</span><button type="button" class="nm-btn" aria-label="Reveal all cards" onclick="nightMuseumRevealAll('nm-${suffix}',${totalSteps})">REVEAL ALL</button></div>`;

  return _nmShell(html, ep, 'assembly');
}


// ══════════════════════════════════════════════════════════════════════
// VP SCREEN 5: RESULTS
// ══════════════════════════════════════════════════════════════════════

export function rpBuildNMResults(ep) {
  const data = ep.nightAtMuseum;
  if (!data) return '<div>No museum data</div>';
  const tribes = data.tribes || [];
  const suffix = 'results';

  const steps = [];

  // Immunity winner announcement
  const winnerTribe = tribes.find(t => t.name === data.winner);
  const loserTribe = tribes.find(t => t.name === data.loser);

  let winHtml = `<div style="font-family:'Playfair Display',serif;font-size:11px;letter-spacing:3px;color:var(--nm-gold);opacity:.6;margin-bottom:8px;">IMMUNITY WINNER</div>`;
  winHtml += `<div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:800;color:var(--nm-white);margin-bottom:4px;">${data.winner || 'TBD'}</div>`;
  if (winnerTribe) {
    const ar = winnerTribe.assemblyResult || {};
    winHtml += `<div style="font-size:12px;color:var(--nm-cream);">${STATUE_TYPES[winnerTribe.statue]?.label || 'Statue'} assembled with ${ar.placed || 0}/${winnerTribe.totalPieces} pieces${ar.complete ? ' — COMPLETE' : ar.knocked ? ' — statue knocked over' : ''}</div>`;
  }
  winHtml += '<div class="nm-ornate-strip" style="margin:12px 0;"></div>';

  // Per-tribe score breakdown
  winHtml += '<div style="display:flex;gap:16px;margin-top:12px;text-align:left;">';
  tribes.forEach((t, ti) => {
    const cc = ti === 0 ? 'y' : 'r';
    const isWinner = t.name === data.winner;
    const bgColor = cc === 'y' ? 'rgba(138,122,16,.04)' : 'rgba(138,32,32,.04)';
    const borderColor = cc === 'y' ? 'rgba(138,122,16,.1)' : 'rgba(138,32,32,.1)';
    const headerColor = cc === 'y' ? 'var(--nm-gold)' : 'var(--nm-tribe-red)';

    // Calculate phase scores from member scores and tribe data
    const secScore = t.alarmCount <= 1 ? '+' + (t.members.length * 2 - t.alarmCount * 4) : '+' + Math.max(0, t.members.length * 2 - t.alarmCount * 4);
    const galScore = '+' + (t.piecesFound * 2);
    const asmResult = t.assemblyResult || {};
    const asmScore = (asmResult.placed || 0) * 2 - (asmResult.fumbled || 0) + (asmResult.complete ? 5 : 0) - (asmResult.knocked ? 8 : 0);
    const total = Math.round(t.score || 0);

    winHtml += `<div style="flex:1;padding:10px;background:${bgColor};border:1px solid ${borderColor};border-radius:6px;">`;
    winHtml += `<div style="font-family:'Playfair Display',serif;font-size:12px;font-weight:700;color:${headerColor};margin-bottom:8px;">${t.name}</div>`;
    winHtml += `<div class="nm-sb-row"><span class="nm-sb-name">Phase 1 (Security)</span><span class="nm-sb-val nm-sb-val-${t.alarmCount <= 2 ? 'g' : 'd'}">${secScore}</span></div>`;
    winHtml += `<div class="nm-sb-row"><span class="nm-sb-name">Phase 2 (Gallery)</span><span class="nm-sb-val nm-sb-val-g">${galScore}</span></div>`;
    winHtml += `<div class="nm-sb-row"><span class="nm-sb-name">Phase 3 (Assembly)</span><span class="nm-sb-val nm-sb-val-${asmScore >= 0 ? 'g' : 'd'}">${asmScore >= 0 ? '+' : ''}${asmScore}</span></div>`;
    winHtml += `<div class="nm-sb-row highlight"><span class="nm-sb-name"><strong>Total</strong></span><span class="nm-sb-val ${isWinner ? 'nm-sb-val-w' : ''}" style="${isWinner ? '' : 'color:rgba(232,220,200,.4);'}">${total}</span></div>`;
    winHtml += '</div>';
  });
  winHtml += '</div>';

  steps.push(`<div class="nm-card nm-card-hero" style="text-align:center;border:2px solid rgba(212,168,75,.2);">${winHtml}</div>`);

  // MVP callout
  if (data.mvp) {
    steps.push(`<div class="nm-card nm-card-hero"><div class="nm-hdr">${_nmIcon('trophy')}${portrait(data.mvp, 36)}<div class="nm-label">Challenge MVP</div><div class="nm-badge nm-badge-hero">${data.mvp.toUpperCase()}</div></div><div class="nm-txt"><strong>${data.mvp}</strong> led their tribe through the museum challenge, earning the highest individual score and securing immunity for ${data.winner || 'their tribe'}.</div></div>`);
  }

  // Losing tribe tribal council notice
  if (data.loser) {
    steps.push(`<div class="nm-card nm-card-alarm"><div class="nm-hdr">${_nmIcon('alarm')}<div class="nm-label">Tribal Council</div><div class="nm-badge nm-badge-fail">ELIMINATION</div></div><div class="nm-txt"><strong>${data.loser}</strong> will face Tribal Council tonight. The museum has claimed its victims.</div></div>`);
  }

  const totalSteps = steps.length;
  let html = '';
  html += `<div class="nm-phase-hdr"><div class="nm-phase-tag">FINAL</div><div class="nm-phase-title">Results</div><div class="nm-phase-sub">The museum falls silent. The statues are judged. One tribe earns immunity.</div></div>`;

  steps.forEach((step, i) => {
    html += `<div class="nm-step" id="nm-step-${suffix}-${i}">${step}</div>`;
  });

  html += `<div class="nm-controls" id="nm-controls-${suffix}"><button type="button" class="nm-btn" aria-label="Reveal next card" onclick="nightMuseumRevealNext('nm-${suffix}',${totalSteps})">NEXT ▶</button><span class="nm-counter" id="nm-counter-${suffix}" aria-live="polite" role="status">0 / ${totalSteps}</span><button type="button" class="nm-btn" aria-label="Reveal all cards" onclick="nightMuseumRevealAll('nm-${suffix}',${totalSteps})">REVEAL ALL</button></div>`;

  return _nmShell(html, ep, 'results');
}
