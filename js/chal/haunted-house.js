// js/chal/haunted-house.js — Haunted House escape challenge (post-merge, individual immunity)
// DC4 "Carnival of Chaos". 3 rooms: Library combo lock → Three Keys split rooms → Ordinary Girl Doll boss.
// Last-one-standing race: eliminations knock players OUT of the challenge; first to cut the rope escapes = immunity.
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function pickUniq(arr, used) {
  const fresh = arr.filter(x => !used.has(x));
  const chosen = (fresh.length ? fresh : arr)[Math.floor(Math.random() * (fresh.length || arr.length))];
  used.add(chosen);
  return chosen;
}
function noise(range = 2.5) { return (Math.random() - 0.5) * range; }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function slugOf(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function portrait(name, size = 38) {
  return `<img src="assets/avatars/${slugOf(name)}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:5px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}
const VILLAINY = ['villain', 'mastermind', 'schemer'];
const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
function canScheme(name) {
  const a = arch(name);
  if (VILLAINY.includes(a)) return true;
  if (NICE.includes(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}
function _names(arr) {
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`;
}

// ══════════════════════════════════════════════════════════════
// TEXT POOLS
// ══════════════════════════════════════════════════════════════
const OPEN_TEXT = [
  (h) => `${h} lifts a lantern to the mansion's rotted door. "Three rooms. First one out wins immunity. The rest of you..." The door groans open on its own.`,
  (h) => `A frightened Trevor hides behind ${h}. "Th-three rooms of the haunted mansion. Escape, and you're safe. Simple." It is not simple.`,
  (h) => `${h} grins beneath a full moon. "Welcome to the Haunted House. Get through all three rooms and out the front door. First to escape can't be voted off."`,
  (h) => `The carnival's haunted mansion looms. ${h}: "First one to claw their way out the far side wins immunity. Everyone else — see you at the vote."`,
];
const NOSTALGIA_TEXT = [
  (n) => `${n} cracks knuckles. "I LOVE haunted houses. Grew up on 'em." Bold words for someone about to scream.`,
  (n) => `${n} eyes the mansion fondly. "Been waiting all season for a challenge like this."`,
  (n) => `${n} rolls ${pronouns(n).posAdj} shoulders. "Ghosts don't scare me. People scare me. Ghosts are fine."`,
];
const FEAR_TEXT = [
  (n) => `${n} freezes at the threshold. "I do NOT do demonic presences. Nope."`,
  (n) => `${n} clutches ${pronouns(n).posAdj} chest. "This place feels wrong. Like, breakup-level wrong."`,
  (n) => `${n} whispers a prayer. "If something in here has a face, I'm out."`,
  (n) => `${n} shivers. "I heard a bell ring. Who rang the bell? WHY is there a bell?"`,
];

const LIB_INTRO = [
  `Candles ignite one by one and lift off their holders, drifting like burning ghosts. A heavy door at the far end wears a four-digit combination lock. The numbers are hidden in the room.`,
  `The floor tilts. Books rain from the shelves and hover mid-air. The only exit is bolted with a numbered lock — and the digits are scattered across the library.`,
  `The library breathes. Floating candles circle overhead as the house shudders. Bolted shut: a door with a four-number combo. Find the numbers, unlock it, run.`,
];
const DIGIT_FIND = [
  (n, pr, d) => `${n} rips open a mildewed tome — the number <b>${d}</b> is scrawled inside. "GOT ONE!"`,
  (n, pr, d) => `${n} spots <b>${d}</b> carved into a candlestick as it floats past. Quick hands. "There!"`,
  (n, pr, d) => `A portrait's eyes follow ${n}; behind it, the digit <b>${d}</b> — pried loose in a heartbeat.`,
  (n, pr, d) => `${n} presses an ear to the wall, hears a click, and finds <b>${d}</b> etched under the sconce.`,
  (n, pr, d) => `Dodging a swooping candle, ${n} pries a floorboard loose. Number <b>${d}</b>. "Come to mama."`,
  (n, pr, d) => `${n} tips a suit of armor and a slip of paper flutters out: <b>${d}</b>. "Gotcha."`,
  (n, pr, d) => `Behind a cracked mirror, ${n} finds <b>${d}</b> written in dust. "One down."`,
  (n, pr, d) => `${n} solves the riddle on a lectern — the answer's a number: <b>${d}</b>.`,
];
const UNLOCK_TEXT = [
  (n, combo) => `${n} spins the dial — <b>${combo}</b> — and the lock CLUNKS open. "GO GO GO!"`,
  (n, combo) => `Hands shaking, ${n} enters <b>${combo}</b>. The bolt slams back. The door swings wide.`,
  (n, combo) => `${n} threads the combination <b>${combo}</b> as the house screams. Click. "It's open!"`,
];
const LOCKED_IN = [
  (s, t) => `${s} sees a chance — and slams the door on ${t}, twisting the lock. ${t} pounds the wood, trapped. "${s}! Are you SERIOUS?!"`,
  (s, t) => `As everyone bolts, ${s} shoves ${t} back into the library and jams the door. Immunity means no mercy.`,
  (s, t) => `${s} lets ${t} pass first — then yanks the door shut behind them, locking ${t} inside with the floating candles.`,
];
const KNOCKED_OUT = [
  (n, pr) => `A tower of books avalanches onto ${n}, burying ${pr.obj}. By the time the dust settles, the door's sealed. Out of the challenge.`,
  (n, pr) => `${n} trips on the buckling floor and a candelabra clips ${pr.obj} on the temple. Lights out — challenge over.`,
  (n, pr) => `The floor gives way under ${n} — a drop into the dark, and no coming back from that one.`,
];
const LEAVE_BEHIND = [
  (s, t) => `${t} wants to dig ${s} out, but ${s} — thinking only of the win — hisses "Leave ${pronouns(t).obj}!" and drags ${t} onward.`,
  (s, t) => `${s} grabs ${t}'s arm. "We don't have time. Move." ${t} looks back once, then keeps running.`,
];
const HELP_OUT = [
  (h, t) => `${h} skids back and hauls ${t} clear of the falling shelves just in time. "I've GOT you — go!"`,
  (h, t) => `${h} refuses to leave ${t} behind, shouldering the books aside. Both make it to the door.`,
];

const ROOMS = [
  { key: 'toy', name: 'The Toy Room', emoji: '🧸', hazard: 'a swarm of rats', icon: 'rat',
    entry: (names) => `${names} creep into a nursery of cracked porcelain dolls. A key dangles from the ceiling — then the floorboards seethe with rats.`,
    survive: [
      (n, pr) => `${n} kicks through the rat swarm and snatches the key. "GET OFF ME!" — but the grip holds.`,
      (n, pr) => `${n} wades through the squealing tide, one hand up, and comes out clutching the key.`,
      (n, pr) => `Rats swarm ${pr.posAdj} legs but ${n} just grits ${pr.posAdj} teeth and rips the key loose.`,
    ],
    fall: [
      (n, pr) => `The rats overwhelm ${n} — down thrashing, out of the room.`,
      (n, pr) => `${n} panics as the swarm surges up ${pr.posAdj} arms and stumbles back, out of it.`,
      (n, pr) => `A rat runs up ${n}'s sleeve — a shriek, a stumble, and no getting up in time.`,
    ] },
  { key: 'chandelier', name: 'The Chandelier Hall', emoji: '🕯️', hazard: 'a rotted chandelier', icon: 'chandelier',
    entry: (names) => `${names} enter a grand hall. The key hangs from a colossal chandelier swaying forty feet up.`,
    survive: [
      (n, pr) => `${n} climbs the drapes hand over hand and swipes the key from the chandelier's arm.`,
      (n, pr) => `${n} shimmies up a support chain, boots slipping, and snags the key at the top.`,
      (n, pr) => `${n} rides the chandelier's swing and grabs the key at the peak of the arc.`,
    ],
    fall: [
      (n, pr) => `${n} reaches too far; the chandelier lurches and drops ${pr.obj} through a trapdoor.`,
      (n, pr) => `The chain snaps under ${n}, and the falling drape carries ${pr.obj} into the dark.`,
      (n, pr) => `${n} loses ${pr.posAdj} grip near the top and drops out of the running.`,
    ] },
  { key: 'egyptian', name: 'The Cursed Tomb', emoji: '⚱️', hazard: 'glass panels over a pit', icon: 'tomb',
    entry: (names) => `${names} step into a sand-strewn tomb. The key sits across a floor of identical glass panels — some hold, some don't.`,
    survive: [
      (n, pr) => `${n} tests each panel, breathing slow, and threads a path across to the key.`,
      (n, pr) => `${n} reads the dust patterns and picks the solid panels one by one to reach the key.`,
      (n, pr) => `Whispering a prayer, ${n} crosses the glass gauntlet and lifts the key clear.`,
    ],
    fall: [
      (n, pr) => `${n} trusts the wrong panel; it shatters and drops ${pr.obj} into blackness.`,
      (n, pr) => `A hairline crack spiders out under ${n} and the glass gives way beneath ${pr.obj}.`,
      (n, pr) => `${n} hesitates a beat too long; the panel splinters, and ${n} is gone.`,
    ] },
  { key: 'mirror', name: 'The Mirror Maze', emoji: '🪞', hazard: 'shattering mirrors', icon: 'mirror',
    entry: (names) => `${names} vanish into a maze of mirrors, a hundred reflections grinning back. The real key is somewhere in the glass.`,
    survive: [
      (n, pr) => `${n} keeps a hand on one wall and finds the true key among a thousand fakes.`,
      (n, pr) => `${n} ignores the reflections, trusts ${pr.posAdj} gut, and closes on the real key.`,
      (n, pr) => `${n} tracks the one reflection that moves wrong — and grabs the key behind it.`,
    ],
    fall: [
      (n, pr) => `${n} punches a mirror that isn't a mirror; the floor tips and slides ${pr.obj} out.`,
      (n, pr) => `${n} chases a fake key into the glass and gets hopelessly turned around, out of the room.`,
      (n, pr) => `The mirrors close in on ${n} — panic sets in, and the path is lost entirely.`,
    ] },
  { key: 'clock', name: 'The Clockwork Attic', emoji: '⚙️', hazard: 'grinding gears', icon: 'gear',
    entry: (names) => `${names} climb into an attic of turning gears. The key rides a rotating cog above a grinding drop.`,
    survive: [
      (n, pr) => `${n} times the gears and rides a cog to pluck the key mid-turn.`,
      (n, pr) => `${n} counts the rhythm of the machine and steps between the teeth to the key.`,
      (n, pr) => `${n} vaults from gear to gear like clockwork and lands the key.`,
    ],
    fall: [
      (n, pr) => `${n} mistimes the leap; a gear catches ${pr.posAdj} sleeve and yanks ${pr.obj} out.`,
      (n, pr) => `The cog spins faster than ${n} expects and throws ${pr.obj} clear of the room.`,
      (n, pr) => `${n} slips on the greased teeth and tumbles off the machine, done.`,
    ] },
];
const KEY_GRAB = [
  (n) => `${n} rips the key free and holds it high. One of three.`,
  (n) => `The lock needs three keys — ${n} just claimed one. "That's ours!"`,
  (n) => `${n} pockets the key and sprints for the reunion door.`,
];

// ── THE ORDINARY GIRL DOLL — escalating boss siege ──
// The doll doesn't just swat people; she DRAGS them into the pit one by one, growing more monstrous
// each stage, until only one soul cuts the rope and escapes. Each level is an atmosphere beat.
const BOSS_WAKE = [
  `In the final room — voodoo dolls, black candles, a fire licking up a rotten throne — a discarded Ordinary Girl doll lies broken in the corner. The only way out is a rope, and only the doll's rusted knife can cut it. As hands close on the blade, her head snaps up with a wooden CRACK. Button eyes glow. "Nobody... leaves."`,
  `The escape rope hangs across the room, lashed tight; the knife to cut it rests in the lap of a ragged Ordinary Girl doll slumped on a burning throne. The moment someone reaches for it, her stitched mouth splits into a grin and she rises. "You'll all stay. Forever."`,
  `Skulls line the walls and a cold green fire climbs the throne. Between the last survivors and freedom: one rope, one knife, and the broken doll cradling it. Her head lolls up. "Down here... we play FOREVER."`,
];
const BOSS_LEVELS = [
  { title: 'THE WAKING', text: `The doll drags herself upright, joints snapping backward. The throne erupts in green flame and the candles gutter black. This isn't a prop anymore.` },
  { title: 'THE HUNT', text: `Her limbs crack and lengthen. She drops to all fours and skitters up the wall, head swiveling to track the warmest heartbeat in the room. The temperature plunges.` },
  { title: 'THE INFERNO', text: `The floorboards blacken and curl. A red glow bleeds up through the cracks — and something down there is breathing. The doll laughs, and the sound is far too deep for her little wooden chest.` },
  { title: "HELL'S MAW", text: `The floor tears open with a groan. A pit of embers and reaching shadow-hands yawns across the room, and the doll's laughter drops an octave into something ancient and hungry.` },
  { title: 'THE LAST SOUL', text: `The mansion itself is screaming now. The maw is everywhere, the walls peeling into smoke. Only the rope, the knife, and one desperate way out remain.` },
];
// Drag-to-hell eliminations — generic pool + archetype-flavored finishers.
const BOSS_DRAG = [
  (n, pr) => `The doll's arm shoots out impossibly far and closes around ${n}'s ankle — clawing at the boards, but the pit swallows ${pr.obj} whole. Gone.`,
  (n, pr) => `Shadow-hands erupt from the maw and drag ${n} down by the legs. The embers close over ${pr.obj} with a hiss.`,
  (n, pr) => `${n} looks the doll dead in her button eyes — a mistake. She reels ${pr.obj} off ${pr.posAdj} feet and flings ${pr.obj} into the glow below.`,
  (n, pr) => `${n} almost reaches the rope, but the floor dissolves underfoot and ${pr.sub === 'they' ? 'they drop' : pr.sub + ' drops'} into the red light with a cry.`,
  (n, pr) => `The doll points one cracked finger and the shadows take ${n}, pulling ${pr.obj} screaming into the pit.`,
];
const BOSS_DRAG_ARCH = {
  villain: (n, pr) => `${n} snarls a curse even as the hands drag ${pr.obj} under — "This isn't OVER—" The maw eats the rest.`,
  mastermind: (n, pr) => `${n} is still calculating an angle when the floor opens; there's no scheming your way out of hell. Down ${pr.sub === 'they' ? 'they go' : pr.sub + ' goes'}.`,
  hero: (n, pr) => `${n} shoves someone else clear of the edge — and the doll takes ${pr.obj} instead. A hero to the very last breath.`,
  'loyal-soldier': (n, pr) => `${n} plants ${pr.posAdj} feet and covers a teammate's back, and the pit claims ${pr.obj} for it. No regrets.`,
  goat: (n, pr) => `${n} scrambles and pleads with the doll, offering to hold the door open forever — she just grins wider and reels ${pr.obj} in.`,
  coward: (n, pr) => `${n} freezes at the wrong instant; the shadow-hands find ${pr.obj} first and drag ${pr.obj} shrieking into the dark.`,
  showmancer: (n, pr) => `${n} reaches for someone's hand across the widening pit — misses by an inch — and the maw takes ${pr.obj}.`,
};
// Between-drag scramble beats — survivors clawing for the knife as the room falls apart.
const BOSS_SCRAMBLE = [
  (n, pr) => `${n} vaults a widening crack and gets a hand on the knife — before the heat drives ${pr.obj} back a step.`,
  (n, pr) => `${n} fights toward the rope over buckling boards, eyes on the blade, ignoring the screaming walls.`,
  (n, pr) => `${n} snatches the knife, saws once at the rope — then has to leap clear as a shadow-hand lunges. Still in it.`,
  (n, pr) => `${n} circles the maw, waiting for the doll to look away, coiled to make the run.`,
];
// Heroic save (pull an ally back from the edge) / villain shove (feed a rival to the pit).
const BOSS_SAVE = [
  (h, v) => `${h} catches ${v}'s wrist at the very lip of the pit and HAULS ${pronouns(v).obj} back. "Not today. Not you."`,
  (h, v) => `${h} throws a candle-stand across the maw like a bridge and drags ${v} across it to safety.`,
];
const BOSS_SHOVE = [
  (s, v) => `${s} plants a boot on ${v}'s back and shoves ${pronouns(v).obj} a step toward the maw to buy ${pronouns(s).obj}self room. Ice cold.`,
  (s, v) => `${s} rips the knife from ${v}'s hand and lets the shadows take ${pronouns(v).obj} instead. "Better you than me."`,
];
const ESCAPE_TEXT = [
  (n, pr) => `As the maw closes on the last of them, ${n} saws through the rope with the doll's own knife, kicks the front door off its hinges, and throws ${pr.ref} into the moonlight. Behind ${pr.obj}, the mansion folds into the pit and is GONE. IMMUNITY.`,
  (n, pr) => `The doll's fingers graze ${n}'s collar — and the rope PARTS. ${n} spills out the front door as the whole house caves into hell behind ${pr.obj}. Alive. Safe. Immune.`,
  (n, pr) => `One stroke. The rope snaps, ${n} dives through the door, and the mansion implodes into the glowing pit at ${pr.posAdj} heels. ${n} lands on the wet lawn, gasping — the only soul to make it out. IMMUNITY.`,
];
const ESCAPE_NEARMISS = [ // the doll nearly takes the winner too, right at the threshold
  (n, pr) => `A shadow-hand locks around ${n}'s ankle in the doorway — ${pr.sub === 'they' ? 'they kick' : pr.sub + ' kicks'} free at the last possible second and tumbles into the night.`,
  (n, pr) => `The doll's shriek is inches from ${n}'s ear as ${pr.sub === 'they' ? 'they clear' : pr.sub + ' clears'} the threshold. A half-second slower and the pit would have ${pr.obj}.`,
];

// Per-player "search" beats — coverage for players who don't find a digit. They still contribute.
const SEARCH_BEATS = [
  (n, pr) => `${n} rifles through a stack of mildewed books — blank page after blank page. "Come ON."`,
  (n, pr) => `${n} shoulders a groaning bookcase aside looking for a hidden number. Nothing, but the effort buys the others time.`,
  (n, pr) => `${n} bats the floating candles back so the searchers can work. "I've got the fire, you find the numbers!"`,
  (n, pr) => `${n} swears there was a digit in the chandelier's shadow — but it's gone a blink later.`,
  (n, pr) => `${n} pries open a locked drawer. Empty. Just a dead moth and a bad smell.`,
  (n, pr) => `${n} runs ${pr.posAdj} hands along the shelves feeling for a false spine. So close — but no.`,
  (n, pr) => `${n} sounds out the walls for a hollow panel, knuckles rapping in the dark. No luck this round.`,
  (n, pr) => `${n} flips a portrait off the wall hunting for a number behind it. Just cobwebs and a spider the size of a fist.`,
  (n, pr) => `${n} tears through a globe, a clock, a vase — anything that might hide a digit. The room fights back.`,
  (n, pr) => `${n} keeps a cool head while the house screams, methodically clearing a shelf. Contributes, but comes up empty.`,
  (n, pr) => `A candle singes ${n}'s sleeve — a yelp, a dropped book, and a lost place in the search.`,
  (n, pr) => `${n} calls out false numbers half-seen in the gloom, more panic than help. "Was that a three? An eight?!"`,
];

// Social beats — chosen by the pair's REAL bond, so the text stays honest (no invented backstory).
// `reconcile` fires only between players with friction; `scheme` only between allies vs a real threat.
// Text is ENVIRONMENT-NEUTRAL so a beat reads correctly in any room (library, key room, boss).
const SOCIAL_BEATS = {
  reconcile: [ // pair has a negative bond — a wary truce, no fabricated specifics
    (a, b) => ({ t: `${a} and ${b} have been circling each other all game. In the dark, ${a} mutters, "Whatever's between us — truce till we're out of here." ${b} gives a wary nod.`, d: () => { addBond(a, b, 2); popDelta(a, 0.3); } }),
    (a, b) => ({ t: `${a} catches ${b}'s eye across the room. "We don't have to like each other to get through this." ${b}: "...Fine. Tonight only."`, d: () => { addBond(a, b, 2); } }),
    (a, b) => ({ t: `Cornered by the same danger, ${a} and ${b} put the feud on ice — for now. "After this, we go back to hating each other." "Deal."`, d: () => { addBond(a, b, 1.5); } }),
    (a, b) => ({ t: `"Truce?" ${a} offers, hand out. ${b} stares at it, then shakes. "Truce. Till we're out." The tension eases a notch.`, d: () => { addBond(a, b, 1.5); } }),
    (a, b) => ({ t: `Forced back to back by the house, ${a} and ${b} call an uneasy ceasefire. Neither trusts it — but it holds through the room.`, d: () => { addBond(a, b, 1.5); } }),
  ],
  scheme: [ // pair are allies — plotting against a genuinely high-threat third player
    (a, b, tgt) => ({ t: `${a} murmurs to ${b}: "${tgt}'s the biggest threat left. Whatever it takes tonight, ${tgt} doesn't walk out first." A plan hardens.`, d: () => { addBond(a, b, 1); addBond(a, tgt, -1); } }),
    (a, b, tgt) => ({ t: `${a} and ${b} trade a look. "${tgt}'s too dangerous to let win immunity. We box ${pronouns(tgt).obj} out." The alliance tightens.`, d: () => { addBond(a, b, 1); addBond(a, tgt, -1); } }),
    (a, b, tgt) => ({ t: `Under the noise, ${a} leans to ${b}. "If ${tgt} grabs immunity we're both in trouble. Slow ${pronouns(tgt).obj} down." ${b} nods.`, d: () => { addBond(a, b, 1); addBond(a, tgt, -1); } }),
    (a, b, tgt) => ({ t: `${a} and ${b} quietly agree: "${tgt} first. Then we sort out us." The pact holds — for now.`, d: () => { addBond(a, b, 1); addBond(a, tgt, -1); } }),
  ],
  friction: [ // pair has a negative bond — it flares under pressure
    (a, b) => ({ t: `${a} snaps at ${b} in the chaos. "Stay out of my way." ${b} bristles right back. The bad blood only thickens.`, d: () => { addBond(a, b, -1.5); popDelta(a, -0.2); } }),
    (a, b) => ({ t: `${a} and ${b} both lunge for the same spot and collide. "Back OFF." "You back off." Neither gives an inch.`, d: () => { addBond(a, b, -1.5); } }),
    (a, b) => ({ t: `${a} shoves past ${b} hard enough to send a message. ${b} files it away. This isn't over.`, d: () => { addBond(a, b, -1.5); } }),
    (a, b) => ({ t: `"You're seriously in MY way right now?" ${a} snarls. ${b} just smirks. The rivalry sharpens.`, d: () => { addBond(a, b, -1.5); } }),
  ],
  bond: [ // pair are already friendly — teamwork under fire
    (a, b) => ({ t: `${a} steadies ${b} when the floor pitches beneath them. "I've got you — keep going." The trust between them deepens.`, d: () => { addBond(a, b, 2); popDelta(a, 0.3); } }),
    (a, b) => ({ t: `${a} and ${b} fall into a rhythm, covering each other's blind spots. "We make a good team." They mean it.`, d: () => { addBond(a, b, 1.5); popDelta(a, 0.2); } }),
    (a, b) => ({ t: `When ${b} freezes up, ${a} grabs ${pronouns(b).posAdj} hand. "With me. We move together." And they do.`, d: () => { addBond(a, b, 2); popDelta(a, 0.2); } }),
    (a, b) => ({ t: `${a} pulls ${b} clear of a close call without thinking; ${b} returns the favor a beat later. Even.`, d: () => { addBond(a, b, 1.5); } }),
    (a, b) => ({ t: `${a} and ${b} watch each other's backs through the worst of it. "Wouldn't want anyone else in here." A real bond.`, d: () => { addBond(a, b, 1.5); popDelta(a, 0.2); } }),
  ],
  banter: [ // neutral pair — nervous gallows humor, keeps morale
    (a, b) => ({ t: `${a} whispers to ${b}, "If something grabs me, avenge me." ${b}: "I'll write a strongly-worded confessional." A shaky laugh cuts the tension.`, d: () => { addBond(a, b, 1); } }),
    (a, b) => ({ t: `${a} and ${b} keep up a running commentary of terror to stay sane. "Was that the wind?" "That was DEFINITELY not the wind."`, d: () => { addBond(a, b, 1); } }),
    (a, b) => ({ t: `"On a scale of one to haunted," ${a} mutters, "this is a solid nope." ${b} snorts despite ${pronouns(b).ref}.`, d: () => { addBond(a, b, 1); } }),
    (a, b) => ({ t: `${a} and ${b} crack nervous jokes to keep their nerve. It's barely working — but it's working.`, d: () => { addBond(a, b, 1); } }),
  ],
};

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════
function _libScore(n) { const s = pStats(n); return s.mental * 0.5 + s.intuition * 0.4 + s.boldness * 0.1 + noise(2.5); }
function _escapeScore(n) { const s = pStats(n); return s.endurance * 0.5 + s.boldness * 0.3 + s.physical * 0.2 + noise(2.5); }
function _roomScore(n) { const s = pStats(n); return s.physical * 0.4 + s.endurance * 0.3 + s.boldness * 0.3 + noise(3.0); }
function _knifeScore(n) { const s = pStats(n); return s.boldness * 0.4 + s.physical * 0.4 + s.strategic * 0.2 + noise(3.0); }

// Fire ONE grounded social beat: pick a pair with the strongest existing relationship
// (either direction), then let their REAL bond decide what kind of moment it is — so the
// narration never invents history that didn't happen.
function _addSocial(events, pool, used, tgtPool, usedBeats) {
  const avail = pool.filter(n => !used.has(n));
  if (avail.length < 2) return false;
  // rank candidate pairs by |bond| so players who actually have a relationship interact first
  let best = null, bestMag = -1;
  for (let i = 0; i < avail.length; i++) {
    for (let j = i + 1; j < avail.length; j++) {
      const mag = Math.abs(getBond(avail[i], avail[j])) + Math.random() * 1.5; // noise breaks ties
      if (mag > bestMag) { bestMag = mag; best = [avail[i], avail[j]]; }
    }
  }
  if (!best) return false;
  const [a, b] = best;
  used.add(a); used.add(b);
  const bond = getBond(a, b);

  let kind, beat;
  if (bond <= -2) {
    kind = Math.random() < 0.55 ? 'reconcile' : 'friction';
  } else if (bond >= 3) {
    // allies: scheme against a real threat if one exists, else bonding teamwork
    const tgts = (tgtPool || pool).filter(n => n !== a && n !== b);
    if (tgts.length && Math.random() < 0.6) {
      const tgt = [...tgts].sort((x, y) => (pStats(y).strategic + Math.max(0, -getBond(a, y))) - (pStats(x).strategic + Math.max(0, -getBond(a, x))))[0];
      beat = pickUniq(SOCIAL_BEATS.scheme, usedBeats || new Set())(a, b, tgt);
      beat.d();
      events.push({ type: 'social', kind: 'scheme', players: [a, b], target: tgt, icon: '🗣️', text: beat.t });
      return true;
    }
    kind = 'bond';
  } else {
    kind = bond < 0 ? 'friction' : (bond > 0 ? 'bond' : 'banter');
  }
  beat = pickUniq(SOCIAL_BEATS[kind], usedBeats || new Set())(a, b);
  beat.d();
  events.push({ type: 'social', kind, players: [a, b], icon: '🗣️', text: beat.t });
  return true;
}

export function simulateHauntedHouse(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  const result = {
    combo: '',
    phase1: { intro: pick(LIB_INTRO), events: [], finders: [], unlocker: null },
    phase2: { groups: [] },
    phase3: { intro: pick(BOSS_WAKE), finalists: [], events: [], knife: {}, immunityWinner: null },
    outOrder: [],        // elimination order, worst first: {name, phase, reason}
    reachedBoss: [],
    immunityWinner: null,
  };

  let alive = [...active];
  const eliminate = (name, phase, reason) => {
    if (!result.outOrder.find(o => o.name === name)) result.outOrder.push({ name, phase, reason });
    alive = alive.filter(n => n !== name);
  };

  // ══ INTRO ══
  result.open = pick(OPEN_TEXT)(host());
  // (nostalgia/fear reactions are now generated as avatar cards inside _simLibrary)
  // shared beat-text dedup across every phase so no social line repeats in one challenge
  const socialUsed = new Set();

  // ══ PHASE 1 — THE LIBRARY ══
  _simLibrary(active, alive, result, eliminate, ep, campKey, socialUsed);
  alive = active.filter(n => !result.outOrder.find(o => o.name === n));

  // ══ PHASE 2 — THREE KEYS ══
  _simKeys(alive, result, eliminate, ep, campKey, socialUsed);
  alive = active.filter(n => !result.outOrder.find(o => o.name === n));

  // ══ PHASE 3 — THE ORDINARY GIRL DOLL ══
  result.reachedBoss = [...alive];
  _simBoss(alive, result, eliminate, ep, campKey, socialUsed);

  // ══ ROMANCE HOOKS ══
  const romActive = active;
  for (let i = 0; i < romActive.length; i++)
    for (let j = i + 1; j < romActive.length; j++)
      _challengeRomanceSpark(romActive[i], romActive[j], ep, null, null, ep.chalMemberScores || {}, 'haunted mansion escape');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'haunt', romActive);

  // ══ FINALIZE ══
  const winner = result.immunityWinner;
  ep.hauntedHouse = result;
  ep.isHauntedHouse = true;
  ep.challengeType = 'haunted-house';
  ep.challengeLabel = 'Haunted House';
  ep.challengeCategory = 'mixed';
  ep.immunityWinner = winner;
  ep.tribalPlayers = active;

  // Placements: winner is #1; everyone else ranks by how long they lasted. outOrder is worst-first
  // (phase 1 knockouts/lock-ins → phase 2 falls → phase 3 drags-to-hell, weakest dragged first), so
  // reversing it puts the last soul taken (the runner-up) right behind the winner. Every non-winner
  // is in outOrder exactly once, so this covers the whole cast with no duplicates.
  const _elimBetterFirst = result.outOrder.map(o => o.name).reverse();
  ep.chalPlacements = [...new Set([winner, ..._elimBetterFirst].filter(Boolean))];

  // scores
  const N = active.length;
  ep.chalPlacements.forEach((name, idx) => {
    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + Math.max(1, N - idx);
  });
  result.reachedBoss.forEach(name => {
    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + Math.round(N * 0.5);
  });
  if (winner) ep.chalMemberScores[winner] = (ep.chalMemberScores[winner] || 0) + N + 5;

  updateChalRecord(ep);
  ep.episodeHistory = ep.episodeHistory || {};
  ep.episodeHistory.challenge = { type: 'haunted-house', label: 'Haunted House', winner };
  return ep;
}

function _simLibrary(active, aliveRef, result, eliminate, ep, campKey, socialUsed = new Set()) {
  const p1 = result.phase1;
  const combo = String(Math.floor(1000 + Math.random() * 9000));
  result.combo = combo;
  const digits = combo.split('');

  // ── reactions (personality-driven) as avatar cards ──
  const bold = [...active].sort((a, b) => pStats(b).boldness - pStats(a).boldness);
  const timid = [...active].sort((a, b) => (pStats(a).boldness + pStats(a).temperament) - (pStats(b).boldness + pStats(b).temperament));
  const nostalgiaP = bold[0];
  const fearP = timid.find(n => n !== nostalgiaP) || timid[0];

  // ── decide the scramble outcome FIRST (names only) so search coverage skips the eliminated ──
  const elimCount = active.length >= 9 ? 2 : 1;
  const schemers = active.filter(canScheme);
  const scramble = []; // ordered {type, player, by?, reason?}
  const outNames = new Set();

  // First elimination — schemer lock-in (targets biggest threat) or a books knockout
  if (schemers.length && Math.random() < 0.6) {
    const schemer = pick(schemers);
    const target = active.filter(n => n !== schemer).sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
    if (target) { scramble.push({ type: 'lockin', player: target, by: schemer }); outNames.add(target); }
  }
  if (!scramble.length) {
    const weakest = [...active].sort((a, b) => _escapeScore(a) - _escapeScore(b))[0];
    scramble.push({ type: 'knockout', player: weakest }); outNames.add(weakest);
  }
  // Second elimination — knockout, with a help (cancels) or leave-behind beat
  if (elimCount >= 2) {
    const remaining = active.filter(n => !outNames.has(n));
    const victim = [...remaining].sort((a, b) => _escapeScore(a) - _escapeScore(b))[0];
    if (victim) {
      const rescuer = remaining.filter(n => n !== victim && getBond(n, victim) >= 3)
        .sort((a, b) => _escapeScore(b) - _escapeScore(a))[0];
      if (rescuer && Math.random() < 0.45) {
        scramble.push({ type: 'help', player: victim, by: rescuer }); // survives
      } else {
        const abandoner = remaining.find(n => n !== victim && canScheme(n) && getBond(n, victim) >= 1);
        if (abandoner) scramble.push({ type: 'leave', player: victim, by: abandoner });
        scramble.push({ type: 'knockout', player: victim }); outNames.add(victim);
      }
    }
  }

  // ── finders (top 4 by search skill) ──
  const ranked = [...active].sort((a, b) => _libScore(b) - _libScore(a));
  const finders = ranked.slice(0, Math.min(4, ranked.length));
  const unlocker = finders[0];
  p1.unlocker = unlocker;

  // ══ BUILD THE CARD ORDER: reactions → finds → searches → socials → unlock → scramble ══
  if (nostalgiaP) p1.events.push({ type: 'reaction', player: nostalgiaP, players: [nostalgiaP], icon: '🕯️', text: pick(NOSTALGIA_TEXT)(nostalgiaP) });
  if (fearP) p1.events.push({ type: 'reaction', player: fearP, players: [fearP], icon: '😱', text: pick(FEAR_TEXT)(fearP) });

  const usedFind = new Set();
  finders.forEach((n, i) => {
    p1.finders.push({ name: n, digit: digits[i] });
    p1.events.push({ type: 'find', player: n, players: [n], icon: '🔢', text: pickUniq(DIGIT_FIND, usedFind)(n, pronouns(n), digits[i]) });
    ep.chalMemberScores[n] = (ep.chalMemberScores[n] || 0) + 2;
  });

  // search coverage — every non-finder who ISN'T eliminated in the scramble gets a beat + a point
  const usedSearch = new Set();
  active.filter(n => !finders.includes(n) && !outNames.has(n)).forEach(n => {
    p1.events.push({ type: 'search', player: n, players: [n], icon: '🔦', text: pickUniq(SEARCH_BEATS, usedSearch)(n, pronouns(n)) });
    ep.chalMemberScores[n] = (ep.chalMemberScores[n] || 0) + 1;
  });

  // grounded social beats (2-3)
  const socialPlayers = new Set();
  const nSocial = active.length >= 8 ? 3 : 2;
  for (let i = 0; i < nSocial; i++) _addSocial(p1.events, active, socialPlayers, active, socialUsed);

  // unlock
  p1.events.push({ type: 'unlock', player: unlocker, players: [unlocker], icon: '🗝️', text: pick(UNLOCK_TEXT)(unlocker, combo) });
  ep.chalMemberScores[unlocker] = (ep.chalMemberScores[unlocker] || 0) + 2;

  // ── scramble cards (with side effects + eliminations), both avatars on two-person cards ──
  const usedKO = new Set();
  scramble.forEach(s => {
    if (s.type === 'lockin') {
      p1.events.push({ type: 'lockin', player: s.player, by: s.by, players: [s.by, s.player], icon: '🔒', text: pick(LOCKED_IN)(s.by, s.player) });
      addBond(s.player, s.by, -3); popDelta(s.by, -0.5); popDelta(s.player, 0.4);
      eliminate(s.player, 1, 'locked in');
    } else if (s.type === 'help') {
      p1.events.push({ type: 'help', player: s.player, by: s.by, players: [s.by, s.player], icon: '🤝', text: pick(HELP_OUT)(s.by, s.player) });
      addBond(s.by, s.player, 2); popDelta(s.by, 0.6);
    } else if (s.type === 'leave') {
      p1.events.push({ type: 'leave', player: s.player, by: s.by, players: [s.by, s.player], icon: '🏃', text: pick(LEAVE_BEHIND)(s.by, s.player) });
      addBond(s.by, s.player, -2); popDelta(s.by, -0.4);
    } else if (s.type === 'knockout') {
      p1.events.push({ type: 'knockout', player: s.player, players: [s.player], icon: '📚', text: pickUniq(KNOCKED_OUT, usedKO)(s.player, pronouns(s.player)) });
      eliminate(s.player, 1, 'knocked out');
    }
  });

  // camp event summarizing the sabotage (consequence-bearing)
  const lockEv = p1.events.find(e => e.type === 'lockin');
  if (lockEv) {
    ep.campEvents[campKey].post.push({
      icon: '🔒', badgeText: 'SABOTAGE', badgeClass: 'bad',
      players: [lockEv.by, lockEv.player],
      text: `${lockEv.by} locked ${lockEv.player} inside the haunted library to steal a shot at immunity. ${lockEv.player} won't forget it.`,
    });
  }
}

function _simKeys(alive, result, eliminate, ep, campKey, socialUsed = new Set()) {
  // split into up to 3 groups (one per key)
  const nGroups = alive.length >= 6 ? 3 : alive.length >= 4 ? 2 : 1;
  const shuffled = [...alive].sort(() => Math.random() - 0.5);
  const groups = Array.from({ length: nGroups }, () => []);
  shuffled.forEach((n, i) => groups[i % nGroups].push(n));

  const roomPool = [...ROOMS].sort(() => Math.random() - 0.5);

  groups.forEach((members, gi) => {
    const room = roomPool[gi % roomPool.length];
    const g = { room, members: [...members], survivors: [], fell: [], keyHolder: null, events: [] };
    g.events.push({ type: 'entry', icon: room.emoji, room: room.key, text: room.entry(_names(members)) });

    // roll each member; ~40% fall (with upsets), but the top roller always survives to claim the key
    const rolls = members.map(n => ({ n, r: _roomScore(n) }));
    const topRoller = [...rolls].sort((a, b) => b.r - a.r)[0]?.n;
    const usedSurv = new Set(), usedFall = new Set();
    rolls.sort((a, b) => b.r - a.r).forEach(({ n, r }) => {
      const fallChance = Math.min(0.78, Math.max(0.12, 0.70 - r * 0.055));
      const survived = n === topRoller || Math.random() >= fallChance;
      if (survived) {
        g.survivors.push(n);
        g.events.push({ type: 'survive', player: n, icon: '✅', room: room.key, text: pickUniq(room.survive, usedSurv)(n, pronouns(n)) });
        ep.chalMemberScores[n] = (ep.chalMemberScores[n] || 0) + 3;
      } else {
        g.fell.push(n);
        g.events.push({ type: 'fall', player: n, icon: '🕳️', room: room.key, text: pickUniq(room.fall, usedFall)(n, pronouns(n)) });
        eliminate(n, 2, 'fell');
      }
    });

    // key claimed by best survivor
    g.keyHolder = topRoller;
    g.events.push({ type: 'key', player: topRoller, icon: '🔑', room: room.key, text: pick(KEY_GRAB)(topRoller) });
    ep.chalMemberScores[topRoller] = (ep.chalMemberScores[topRoller] || 0) + 2;

    // grounded social beat(s) per group among survivors
    const survPool = g.survivors;
    if (survPool.length >= 2) {
      const groupPlayers = new Set();
      _addSocial(g.events, survPool, groupPlayers, alive, socialUsed);
      if (survPool.length >= 4) _addSocial(g.events, survPool, groupPlayers, alive, socialUsed);
    }

    result.phase2.groups.push(g);
  });
}

// Popularity swing for being dragged under, by HOW you go: selfless heroes earn fan love,
// villains get no sympathy, cowards who plead/freeze lose face. (popularity rule.)
function _dragPop(n) {
  const a = arch(n);
  if (['hero', 'loyal-soldier'].includes(a)) return 1.0;          // died protecting someone
  if (a === 'showmancer') return 0.5;                              // reaching for a loved one
  if (['villain', 'mastermind'].includes(a)) return 0;            // went down cursing — no sympathy
  if (['floater', 'goat'].includes(a) && pStats(n).boldness <= 4) return -0.3; // begged/froze
  return 0.3;                                                      // went down fighting
}

// Archetype-appropriate drag finisher (falls back to the generic pool).
function _dragText(n, usedDrag) {
  const a = arch(n);
  const pr = pronouns(n);
  const coward = ['floater', 'goat'].includes(a) && pStats(n).boldness <= 4;
  let key = a;
  if (coward && !BOSS_DRAG_ARCH[a]) key = 'coward';
  const fn = BOSS_DRAG_ARCH[key];
  if (fn && !usedDrag.has(fn)) { usedDrag.add(fn); return fn(n, pr); }
  return pickUniq(BOSS_DRAG, usedDrag)(n, pr);
}

function _simBoss(alive, result, eliminate, ep, campKey, socialUsed = new Set()) {
  const p3 = result.phase3;
  p3.finalists = [...alive];
  p3.levels = [];

  if (alive.length <= 1) {
    const w = alive[0];
    p3.immunityWinner = w || null;
    result.immunityWinner = w || null;
    if (w) {
      p3.knife[w] = 99;
      p3.events.push({ type: 'wake', icon: '🎎', text: p3.intro });
      p3.events.push({ type: 'level', title: BOSS_LEVELS[BOSS_LEVELS.length - 1].title, icon: '🔥', text: BOSS_LEVELS[BOSS_LEVELS.length - 1].text });
      p3.events.push({ type: 'escape', player: w, players: [w], icon: '🚪', text: pick(ESCAPE_TEXT)(w, pronouns(w)) });
      popDelta(w, 1.0);
    }
    return;
  }

  // ── knife scores decide who holds out longest; lowest gets dragged first ──
  const scores = {};
  alive.forEach(n => { scores[n] = _knifeScore(n); });
  const winner = [...alive].sort((a, b) => scores[b] - scores[a])[0];

  // A loyal ally can lift a bonded runner-up (they hold the knife longer — climbs the order).
  const runnerUpProv = [...alive].filter(n => n !== winner).sort((a, b) => scores[b] - scores[a])[0];
  const savedByLoyalty = alive.find(h => NICE.includes(arch(h)) && h !== winner && h !== runnerUpProv && getBond(h, runnerUpProv) >= 4);

  // Drag order = everyone but the winner, weakest first. Villains can shove a rival earlier;
  // a hero can pull a bonded ally back a slot (someone else goes first).
  let order = [...alive].filter(n => n !== winner).sort((a, b) => scores[a] - scores[b]);

  p3.knife = scores;
  p3.immunityWinner = winner;
  result.immunityWinner = winner;

  // ══ BUILD THE SIEGE ══
  p3.events.push({ type: 'wake', icon: '🎎', text: p3.intro });

  const usedDrag = new Set(), usedScr = new Set();
  const nNonWinners = order.length;               // people the doll takes
  const levelCount = Math.min(BOSS_LEVELS.length, Math.max(3, nNonWinners)); // 3-5 escalation beats
  // distribute the escalation levels across the drags
  const dragsPerLevel = Math.max(1, Math.ceil(nNonWinners / (levelCount - 1)));
  let levelIdx = 0;
  const pushLevel = () => {
    if (levelIdx >= BOSS_LEVELS.length) return;
    const L = BOSS_LEVELS[levelIdx];
    p3.levels.push(L.title);
    p3.events.push({ type: 'level', title: L.title, icon: ['🎃', '🕷️', '🔥', '🕳️', '💀'][levelIdx] || '🔥', text: L.text });
    levelIdx++;
  };

  // Level 1 fires immediately (the waking horror)
  pushLevel();

  let dragsSinceLevel = 0;
  let shoveUsed = false, saveUsed = false;
  const dragged = [];

  for (let i = 0; i < order.length; i++) {
    const victim = order[i];

    // Villain shove: a schemer feeds the soul about to be taken to the maw to buy survival.
    // CHALLENGE EFFECT: the schemer climbs the order (outlasts rivals → better placement); the
    // victim goes down now and is owed a little sympathy. Fires once, mid-siege.
    if (!shoveUsed && i < order.length - 1) {
      const schemer = alive.find(s => canScheme(s) && s !== victim && !dragged.includes(s) && s !== winner);
      if (schemer && Math.random() < 0.5) {
        p3.events.push({ type: 'shove', player: victim, by: schemer, players: [schemer, victim], icon: '🤛', text: pick(BOSS_SHOVE)(schemer, victim) });
        addBond(victim, schemer, -2);
        popDelta(schemer, -0.4);   // villainy costs fan goodwill
        popDelta(victim, 0.3);     // being shoved earns a little sympathy
        // the schemer buys survival — climb two slots later in the drag order (better placement)
        const si = order.indexOf(schemer);
        if (si > i) {
          order.splice(si, 1);
          order.splice(Math.min(order.length, si + 2), 0, schemer);
        }
        shoveUsed = true;
      }
    }

    // Hero save: a nice ally yanks a bonded victim back from the edge — skip this drag, take the next.
    if (!saveUsed) {
      const saver = alive.find(h => NICE.includes(arch(h)) && h !== victim && !dragged.includes(h) && h !== winner && getBond(h, victim) >= 3);
      if (saver && i < order.length - 1 && Math.random() < 0.45) {
        p3.events.push({ type: 'save', player: victim, by: saver, players: [saver, victim], icon: '🛡️', text: pick(BOSS_SAVE)(saver, victim) });
        addBond(saver, victim, 2); popDelta(saver, 0.8);
        saveUsed = true;
        // swap victim with the next in line — someone else is taken first
        [order[i], order[i + 1]] = [order[i + 1], order[i]];
        i--; // re-run this slot with the swapped-in victim
        continue;
      }
    }

    // the doll drags this soul into the pit — popularity swings by HOW they go down
    p3.events.push({ type: 'drag', player: victim, players: [victim], icon: '🕳️', text: _dragText(victim, usedDrag) });
    eliminate(victim, 3, 'dragged to hell');
    dragged.push(victim);
    popDelta(victim, _dragPop(victim));
    dragsSinceLevel++;

    // escalate the horror as the pit claims more souls
    if (dragsSinceLevel >= dragsPerLevel && levelIdx < levelCount - 1 && (order.length - 1 - i) > 0) {
      pushLevel();
      dragsSinceLevel = 0;
    }

    // a survivor scrambles for the knife between drags (not every beat, to keep pace)
    const stillIn = alive.filter(n => !dragged.includes(n) && n !== winner);
    if (stillIn.length && Math.random() < 0.6) {
      const scr = stillIn[Math.floor(Math.random() * stillIn.length)];
      p3.events.push({ type: 'scramble', player: scr, players: [scr], icon: '🔪', text: pickUniq(BOSS_SCRAMBLE, usedScr)(scr, pronouns(scr)) });
      ep.chalMemberScores[scr] = (ep.chalMemberScores[scr] || 0) + 1; // fought for the knife
    }
  }

  // Final escalation + the winner's escape (with a near-miss for tension)
  while (levelIdx < levelCount) pushLevel();
  const wpr = pronouns(winner);
  if (savedByLoyalty && Math.random() < 0.5) {
    p3.events.push({ type: 'nearmiss', player: winner, players: [winner], icon: '⛓️', text: pick(ESCAPE_NEARMISS)(winner, wpr) });
  }
  p3.events.push({ type: 'escape', player: winner, players: [winner], icon: '🚪', text: pick(ESCAPE_TEXT)(winner, wpr) });
  popDelta(winner, 1.4); // surviving hell is a legend-maker
  if (savedByLoyalty) { addBond(savedByLoyalty, winner, 1); }
}

// ══════════════════════════════════════════════════════════════
// VP — HAUNTED MANSION
// ══════════════════════════════════════════════════════════════
function css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Creepster&family=Special+Elite&family=Cinzel:wght@600;800&display=swap');
  .hh-shell{--ink:#e8e0d0;--blood:#a11414;--candle:#8bd66a;--gold:#c9a227;--purple:#3a1f52;
    font-family:'Special Elite',serif;color:var(--ink);
    background:radial-gradient(ellipse at 50% 0%,#241435 0%,#120a1c 55%,#080510 100%);
    max-width:1100px;margin:0 auto;position:relative;min-height:440px;overflow:clip;
    border:5px solid #000;box-shadow:0 0 0 3px #2a1a3d,0 14px 40px rgba(0,0,0,0.7)}
  .hh-shell::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background:radial-gradient(circle at 20% 15%,rgba(139,214,106,0.10),transparent 32%),
      radial-gradient(circle at 82% 22%,rgba(161,20,20,0.10),transparent 34%);
    animation:hh-flick 5s ease-in-out infinite alternate}
  @keyframes hh-flick{0%{opacity:.7}50%{opacity:1}100%{opacity:.55}}
  .hh-shell::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:1;opacity:.5;
    background-image:radial-gradient(circle,rgba(0,0,0,0.5) 1px,transparent 1px);background-size:5px 5px}
  @media(prefers-reduced-motion:reduce){.hh-shell::before{animation:none}.hh-cand,.hh-web{animation:none!important}}

  .hh-web{position:absolute;width:70px;height:70px;z-index:2;pointer-events:none;opacity:.35}
  .hh-cand{position:absolute;width:8px;height:20px;border-radius:50% 50% 45% 45%;z-index:2;pointer-events:none;
    background:linear-gradient(180deg,#fff6c0,#f0a020);box-shadow:0 0 12px 4px rgba(240,180,60,0.55);animation:hh-float 6s ease-in-out infinite}
  @keyframes hh-float{0%{transform:translateY(0)}50%{transform:translateY(-16px)}100%{transform:translateY(0)}}

  .hh-cover{position:relative;z-index:5;text-align:center;padding:34px 22px 30px}
  .hh-title{font-family:'Creepster',cursive;font-size:64px;line-height:0.92;color:var(--ink);
    text-shadow:0 0 18px rgba(139,214,106,0.45),3px 3px 0 #000;letter-spacing:2px}
  .hh-sub{font-family:'Cinzel',serif;font-size:12px;letter-spacing:5px;color:var(--gold);margin-top:8px}
  .hh-tag{font-family:'Special Elite';font-size:13px;color:#c9bfae;margin-top:14px;font-style:italic;max-width:560px;margin-left:auto;margin-right:auto;line-height:1.5}
  .hh-roster{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:20px}
  .hh-badge{width:56px;text-align:center;filter:drop-shadow(0 3px 5px rgba(0,0,0,0.6))}
  .hh-badge img{width:48px;height:48px;object-fit:contain;border-radius:6px;border:2px solid var(--purple);background:#0d0715}
  .hh-badge span{display:block;font-size:9px;color:#b8ad9a;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

  .hh-layout{display:flex;gap:0;position:relative;z-index:5;min-height:320px}
  .hh-feed{flex:1;padding:16px 18px 96px;min-width:0}
  .hh-side{width:224px;flex-shrink:0;padding:14px 12px;background:linear-gradient(180deg,#160d24,#0c0716);
    border-left:3px solid var(--purple);position:sticky;top:0;align-self:flex-start;max-height:82vh;overflow-y:auto}
  .hh-side-h{font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;color:var(--gold);
    border-bottom:1px solid rgba(201,162,39,0.3);padding-bottom:4px;margin:12px 0 8px}
  .hh-side-h:first-child{margin-top:0}
  .hh-srow{display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px}
  .hh-srow img{width:20px;height:20px;object-fit:contain;border-radius:3px}
  .hh-srow.out{opacity:.4}.hh-srow.out img{filter:grayscale(1)}
  .hh-srow.out .hh-nm{text-decoration:line-through;color:#8a7f6e}
  .hh-srow.esc .hh-nm{color:var(--candle);font-weight:bold}
  .hh-nm{color:#ddd3c0}.hh-mini{font-size:8px;color:#7a7060;margin-left:auto}

  .hh-phase-h{font-family:'Creepster',cursive;font-size:30px;color:var(--candle);text-shadow:0 0 12px rgba(139,214,106,0.4),2px 2px 0 #000;margin:4px 0 10px;letter-spacing:1px}
  .hh-intro{font-style:italic;color:#c4baa8;font-size:13px;line-height:1.55;border-left:3px solid var(--purple);padding:6px 12px;margin-bottom:14px;background:rgba(58,31,82,0.2)}
  .hh-step{margin:9px 0;transition:opacity .3s;scroll-margin-top:20px}
  .hh-card{background:linear-gradient(180deg,rgba(24,16,36,0.92),rgba(14,9,22,0.92));border:1px solid #33224a;border-radius:8px;
    padding:10px 12px;display:flex;gap:10px;align-items:flex-start;box-shadow:0 4px 14px rgba(0,0,0,0.4)}
  .hh-card .hh-ico{font-size:20px;flex-shrink:0;filter:drop-shadow(0 0 4px rgba(139,214,106,0.4))}
  .hh-card .hh-txt{font-size:13px;line-height:1.5;color:#e2d8c6}
  .hh-card.find{border-left:4px solid var(--gold)}
  .hh-card.unlock{border-left:4px solid var(--candle);background:linear-gradient(180deg,rgba(40,60,30,0.6),rgba(14,9,22,0.9))}
  .hh-card.bad{border-left:4px solid var(--blood);background:linear-gradient(180deg,rgba(60,16,16,0.55),rgba(14,9,22,0.9))}
  .hh-card.key{border-left:4px solid var(--gold);background:linear-gradient(180deg,rgba(60,48,16,0.4),rgba(14,9,22,0.9))}
  .hh-card.social{border:1px dashed #5a4a72;background:rgba(40,26,58,0.5)}
  .hh-card.reaction{border-left:4px solid #6a5acd;background:linear-gradient(180deg,rgba(48,40,72,0.5),rgba(14,9,22,0.9));font-style:italic}
  .hh-card.search{border-left:3px solid #4a4560;background:rgba(20,16,30,0.75);opacity:0.94}
  .hh-card.hell{border:2px solid #ff3b3b;background:linear-gradient(180deg,rgba(70,8,8,0.85),rgba(30,2,2,0.97));box-shadow:0 0 16px rgba(255,40,40,0.25) inset;animation:hh-shake .5s}
  .hh-card.hell .hh-txt{color:#ffd7d0}
  .hh-level{position:relative;z-index:2;margin:16px 0;padding:14px 16px;border-radius:8px;text-align:center;
    background:radial-gradient(ellipse at 50% 0%,rgba(255,60,30,0.28),rgba(20,4,4,0.95));
    border:1px solid #ff5a2a;box-shadow:0 0 26px rgba(255,70,20,0.3);animation:hh-pulse 2.4s ease-in-out infinite}
  @keyframes hh-pulse{0%,100%{box-shadow:0 0 18px rgba(255,70,20,0.25)}50%{box-shadow:0 0 34px rgba(255,90,30,0.5)}}
  .hh-level-t{font-family:'Creepster',cursive;font-size:26px;letter-spacing:2px;color:#ff7a3a;text-shadow:0 0 14px rgba(255,90,30,0.6),2px 2px 0 #000}
  .hh-level-x{font-size:13px;line-height:1.55;color:#ffcfc2;margin-top:6px;font-style:italic}
  .hh-card.escape{border-left:5px solid var(--candle);background:linear-gradient(90deg,rgba(139,214,106,0.18),rgba(14,9,22,0.9));animation:hh-glow 1.4s ease-in-out infinite alternate}
  @keyframes hh-glow{from{box-shadow:0 0 8px rgba(139,214,106,0.3)}to{box-shadow:0 0 22px rgba(139,214,106,0.6)}}
  .hh-card.boss{border:2px solid var(--blood);background:linear-gradient(180deg,rgba(50,10,10,0.7),rgba(20,6,6,0.95));animation:hh-shake .5s}
  @keyframes hh-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
  .hh-pill{display:inline-block;font-family:'Cinzel',serif;font-size:9px;letter-spacing:1px;padding:1px 6px;border-radius:3px;margin-bottom:3px}
  .hh-room-h{font-family:'Cinzel',serif;font-size:15px;color:var(--gold);margin:16px 0 6px;border-bottom:1px solid rgba(201,162,39,0.25);padding-bottom:3px}
  .hh-avs{display:flex;gap:-6px}.hh-avs img{width:26px;height:26px;object-fit:contain;border-radius:4px;border:1px solid #000;margin-left:-6px;background:#0d0715}
  .hh-avs img:first-child{margin-left:0}

  .hh-ctrl{position:sticky;bottom:0;z-index:20;display:flex;gap:8px;align-items:center;justify-content:center;
    padding:10px;margin:0 -18px -96px;background:linear-gradient(0deg,#0a0512,rgba(10,5,18,0.85) 70%,transparent);backdrop-filter:blur(2px)}
  .hh-btn{font-family:'Cinzel',serif;font-size:12px;letter-spacing:1px;cursor:pointer;padding:8px 16px;border-radius:5px;
    border:1px solid var(--purple);background:linear-gradient(180deg,#2a1a3d,#160d24);color:var(--ink)}
  .hh-btn:hover{border-color:var(--candle);color:var(--candle)}
  .hh-btn.all{border-color:var(--blood)}
  .hh-cnt{font-family:'Special Elite';font-size:11px;color:#9a8f7e}
  .hh-done{font-family:'Cinzel',serif;font-size:12px;color:var(--candle);text-align:center;padding:10px}
  </style>`;
}

function _webs() {
  const w = (x, y, r) => `<svg class="hh-web" style="${x};${y};transform:rotate(${r}deg)" viewBox="0 0 100 100"><g stroke="#b8ad9a" stroke-width="1" fill="none"><path d="M0 0 L100 100 M0 0 L100 40 M0 0 L40 100 M0 0 L70 100 M0 0 L100 70"/><path d="M15 15 Q40 10 55 55 Q10 40 15 15"/><path d="M30 30 Q60 22 75 75 Q22 60 30 30"/></g></svg>`;
  return w('top:0', 'left:0', 0) + w('top:0', 'right:0', 90);
}

function _shell(content) {
  const cands = [
    'top:60px;left:40px', 'top:90px;right:70px', 'top:150px;left:120px', 'top:120px;right:180px', 'top:200px;right:40px',
  ].map((p, i) => `<div class="hh-cand" style="${p};animation-delay:${i * 0.7}s"></div>`).join('');
  return `${css()}<div class="hh-shell">${_webs()}${cands}${content}</div>`;
}

// ── Sidebar: escape status ──
function _sideStatus(result, revealedOut, escaped) {
  const active = result._active || [];
  const outNames = {};
  result.outOrder.forEach(o => { outNames[o.name] = o; });
  let h = `<div class="hh-side-h">👻 ESCAPE STATUS</div>`;
  const inside = active.filter(n => !revealedOut.has(n) && n !== escaped);
  if (escaped) {
    h += `<div class="hh-srow esc">${portrait(escaped, 20)}<span class="hh-nm">${escaped}</span><span class="hh-mini">ESCAPED ✦</span></div>`;
  }
  inside.forEach(n => {
    h += `<div class="hh-srow">${portrait(n, 20)}<span class="hh-nm">${n}</span></div>`;
  });
  const outList = [...revealedOut];
  if (outList.length) {
    h += `<div class="hh-side-h" style="color:var(--blood)">💀 OUT</div>`;
    outList.forEach(n => {
      const o = outNames[n];
      const tag = o ? (o.reason === 'locked in' ? 'LOCKED IN' : o.reason === 'fell' ? `FELL` : 'KO') : '';
      h += `<div class="hh-srow out">${portrait(n, 20)}<span class="hh-nm">${n}</span><span class="hh-mini">${tag}</span></div>`;
    });
  }
  return h;
}

function _ctrl(suffix, total, revIdx) {
  const done = revIdx >= total - 1;
  return `<div class="hh-ctrl" id="hh-ctrl-${suffix}" style="${done ? 'display:none' : ''}">
      <button class="hh-btn" onclick="hauntedRevealNext('hh-${suffix}',${total})">Next →</button>
      <span class="hh-cnt" id="hh-cnt-${suffix}">${Math.max(0, revIdx + 1)} / ${total}</span>
      <button class="hh-btn all" onclick="hauntedRevealAll('hh-${suffix}',${total})">Reveal all</button>
    </div>
    <div class="hh-done" id="hh-done-${suffix}" style="${done ? '' : 'display:none'}">— the house falls silent —</div>`;
}

function _steps(suffix, stepHtmls, revIdx) {
  return stepHtmls.map((html, i) =>
    `<div class="hh-step" id="hh-step-${suffix}-${i}" style="display:${i <= revIdx ? '' : 'none'}">${html}</div>`
  ).join('');
}

function _card(cls, ev) {
  const players = ev.players || (ev.player ? [ev.player] : []);
  const avs = players.length ? `<div class="hh-avs">${players.map(n => portrait(n, 26)).join('')}</div>` : `<span class="hh-ico">${ev.icon || ''}</span>`;
  return `<div class="hh-card ${cls}">${avs}<div class="hh-txt">${ev.text}</div></div>`;
}

export function rpBuildHauntedTitleCard(ep) {
  const r = ep.hauntedHouse; if (!r) return '';
  const active = ep.tribalPlayers || [];
  const badges = active.map(n =>
    `<div class="hh-badge"><img src="assets/avatars/${slugOf(n)}.png" onerror="this.style.display='none'"><span>${n}</span></div>`
  ).join('');
  return _shell(`
    <div class="hh-cover">
      <div class="hh-sub">STAWAKI CARNIVAL PRESENTS</div>
      <div class="hh-title">Haunted<br>House</div>
      <div class="hh-sub" style="margin-top:10px">THREE ROOMS · ONE ESCAPE · ${host().toUpperCase()}'S MANSION</div>
      <div class="hh-tag">"${r.open}"</div>
      <div class="hh-tag" style="color:var(--candle)">First one out the front door wins immunity. Everyone else walks to the vote.</div>
      <div class="hh-roster">${badges}</div>
    </div>
  `);
}

export function rpBuildHauntedLibrary(ep) {
  const r = ep.hauntedHouse; if (!r) return '';
  const suffix = 'library';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState['hh-library']) window._tvState['hh-library'] = { idx: -1 };
  const revIdx = window._tvState['hh-library'].idx;
  window.hhData = r; r._active = ep.tribalPlayers || [];

  const steps = [];
  const meta = []; // cumulative out-set per step
  const outSet = new Set();
  for (const ev of r.phase1.events) {
    let cls = 'find';
    if (ev.type === 'unlock') cls = 'unlock';
    else if (ev.type === 'lockin' || ev.type === 'knockout' || ev.type === 'leave') cls = 'bad';
    else if (ev.type === 'help') cls = 'unlock';
    else if (ev.type === 'social') cls = 'social';
    else if (ev.type === 'reaction') cls = 'reaction';
    else if (ev.type === 'search') cls = 'search';
    let extra = '';
    if (ev.type === 'lockin') extra = `<span class="hh-pill" style="background:var(--blood);color:#fff">SABOTAGE</span><br>`;
    else if (ev.type === 'knockout') extra = `<span class="hh-pill" style="background:#5a2020;color:#fff">KNOCKED OUT</span><br>`;
    else if (ev.type === 'leave') extra = `<span class="hh-pill" style="background:#5a2020;color:#fff">LEFT BEHIND</span><br>`;
    else if (ev.type === 'help') extra = `<span class="hh-pill" style="background:var(--candle);color:#111">RESCUE</span><br>`;
    else if (ev.type === 'find') extra = `<span class="hh-pill" style="background:var(--gold);color:#111">DIGIT ${ev.text.match(/<b>(\d)<\/b>/)?.[1] || '✦'}</span><br>`;
    else if (ev.type === 'unlock') extra = `<span class="hh-pill" style="background:var(--candle);color:#111">UNLOCKED</span><br>`;
    else if (ev.type === 'social') extra = `<span class="hh-pill" style="background:var(--purple);color:#ddd">${(ev.kind === 'scheme' || ev.kind === 'friction') ? 'TENSION' : 'SOCIAL'}</span><br>`;
    steps.push(_card(cls, { ...ev, text: extra + ev.text }));
    if (ev.type === 'lockin' || ev.type === 'knockout') outSet.add(ev.player);
    meta.push(new Set(outSet));
  }
  window.hhLibMeta = meta.map(s => [...s]);

  return _shell(`
    <div class="hh-layout">
      <div class="hh-feed">
        <div class="hh-phase-h">Room I · The Library</div>
        <div class="hh-intro">${r.phase1.intro} The lock reads four digits: <b style="color:var(--gold)">? ? ? ?</b></div>
        ${_steps(suffix, steps, revIdx)}
        ${_ctrl(suffix, steps.length, revIdx)}
      </div>
      <div class="hh-side" id="hh-side-${suffix}">${_sideStatus(r, new Set((window.hhLibMeta[Math.max(0, revIdx)] || [])), null)}</div>
    </div>
  `);
}

export function rpBuildHauntedKeys(ep) {
  const r = ep.hauntedHouse; if (!r) return '';
  const suffix = 'keys';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState['hh-keys']) window._tvState['hh-keys'] = { idx: -1 };
  const revIdx = window._tvState['hh-keys'].idx;
  window.hhData = r; r._active = ep.tribalPlayers || [];

  // out from phase 1 already gone before this screen
  const preOut = new Set(r.outOrder.filter(o => o.phase === 1).map(o => o.name));
  const steps = [];
  const meta = [];
  const outSet = new Set(preOut);
  r.phase2.groups.forEach(g => {
    steps.push(`<div class="hh-room-h">${g.room.emoji} ${g.room.name}</div>`);
    meta.push(new Set(outSet));
    for (const ev of g.events) {
      let cls = 'find';
      if (ev.type === 'entry') cls = 'reaction';
      else if (ev.type === 'survive') cls = 'find';
      else if (ev.type === 'fall') cls = 'bad';
      else if (ev.type === 'key') cls = 'key';
      else if (ev.type === 'social') cls = 'social';
      let extra = '';
      if (ev.type === 'fall') extra = `<span class="hh-pill" style="background:#5a2020;color:#fff">FELL</span><br>`;
      else if (ev.type === 'survive') extra = `<span class="hh-pill" style="background:#2d5a3a;color:#dfe">CLEARED</span><br>`;
      else if (ev.type === 'key') extra = `<span class="hh-pill" style="background:var(--gold);color:#111">KEY ✦</span><br>`;
      else if (ev.type === 'social') extra = `<span class="hh-pill" style="background:var(--purple);color:#ddd">${(ev.kind === 'scheme' || ev.kind === 'friction') ? 'TENSION' : 'SOCIAL'}</span><br>`;
      steps.push(_card(cls, { ...ev, text: extra + ev.text }));
      if (ev.type === 'fall') outSet.add(ev.player);
      meta.push(new Set(outSet));
    }
  });
  window.hhKeysMeta = meta.map(s => [...s]);

  return _shell(`
    <div class="hh-layout">
      <div class="hh-feed">
        <div class="hh-phase-h">Room II · Three Keys</div>
        <div class="hh-intro">The next door needs three keys. The survivors split up — each team braves a different cursed room to bring one back. Fall through, and you're done.</div>
        ${_steps(suffix, steps, revIdx)}
        ${_ctrl(suffix, steps.length, revIdx)}
      </div>
      <div class="hh-side" id="hh-side-${suffix}">${_sideStatus(r, new Set((window.hhKeysMeta[Math.max(0, revIdx)] || preOut)), null)}</div>
    </div>
  `);
}

export function rpBuildHauntedBoss(ep) {
  const r = ep.hauntedHouse; if (!r) return '';
  const suffix = 'boss';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState['hh-boss']) window._tvState['hh-boss'] = { idx: -1 };
  const revIdx = window._tvState['hh-boss'].idx;
  window.hhData = r; r._active = ep.tribalPlayers || [];

  const steps = [];
  const meta = []; // per-step: cumulative {taken:[], escaped}
  const taken = [];
  let escaped = null;
  r.phase3.events.forEach(ev => {
    let html;
    if (ev.type === 'level') {
      // full-width escalation banner — the doll grows, the room descends toward hell
      html = `<div class="hh-level"><div class="hh-level-t">${ev.icon || '🔥'} ${ev.title}</div><div class="hh-level-x">${ev.text}</div></div>`;
    } else {
      let cls = 'boss', pill = '';
      if (ev.type === 'wake') cls = 'boss';
      else if (ev.type === 'drag') { cls = 'hell'; pill = `<span class="hh-pill" style="background:#000;color:#ff5555;border:1px solid #ff5555">DRAGGED TO HELL 🔥</span><br>`; }
      else if (ev.type === 'shove') { cls = 'bad'; pill = `<span class="hh-pill" style="background:var(--blood);color:#fff">SHOVED</span><br>`; }
      else if (ev.type === 'save') { cls = 'unlock'; pill = `<span class="hh-pill" style="background:var(--candle);color:#111">PULLED BACK</span><br>`; }
      else if (ev.type === 'scramble') { cls = 'search'; }
      else if (ev.type === 'nearmiss') { cls = 'bad'; pill = `<span class="hh-pill" style="background:#5a2020;color:#fff">SO CLOSE</span><br>`; }
      else if (ev.type === 'escape') { cls = 'escape'; pill = `<span class="hh-pill" style="background:var(--candle);color:#111">IMMUNITY ✦ — THE LAST SOUL</span><br>`; }
      html = _card(cls, { ...ev, text: pill + ev.text });
    }
    steps.push(html);
    if (ev.type === 'drag') taken.push(ev.player);
    if (ev.type === 'escape') escaped = ev.player;
    meta.push({ taken: [...taken], escaped });
  });
  window.hhBossMeta = meta;

  const cur = meta[Math.max(0, revIdx)] || { taken: [], escaped: null };
  const finSide = _bossSidebar(r, cur.taken, cur.escaped);

  return _shell(`
    <div class="hh-layout">
      <div class="hh-feed">
        <div class="hh-phase-h" style="color:var(--blood)">Room III · The Ordinary Girl Doll</div>
        <div class="hh-intro" style="border-color:var(--blood)">${r.phase3.intro}</div>
        ${_steps(suffix, steps, revIdx)}
        ${_ctrl(suffix, steps.length, revIdx)}
      </div>
      <div class="hh-side" id="hh-side-${suffix}">${finSide}</div>
    </div>
  `);
}

// Boss sidebar: finalists still fighting → those the doll has TAKEN → the one who ESCAPED.
function _bossSidebar(r, takenList, escaped) {
  const finalists = r.reachedBoss || [];
  const takenSet = new Set(takenList);
  const stillIn = finalists.filter(n => !takenSet.has(n) && n !== escaped);
  let h = `<div class="hh-side-h" style="color:var(--blood)">🎎 THE DOLL'S GAME</div>`;
  if (escaped) {
    h += `<div class="hh-srow esc">${portrait(escaped, 20)}<span class="hh-nm">${escaped}</span><span class="hh-mini">ESCAPED ✦</span></div>`;
  }
  h += `<div class="hh-side-h">STILL FIGHTING (${stillIn.length})</div>`;
  stillIn.forEach(n => { h += `<div class="hh-srow">${portrait(n, 20)}<span class="hh-nm">${n}</span></div>`; });
  if (takenList.length) {
    h += `<div class="hh-side-h" style="color:#ff5555">🔥 DRAGGED TO HELL (${takenList.length})</div>`;
    takenList.forEach(n => { h += `<div class="hh-srow out">${portrait(n, 20)}<span class="hh-nm">${n}</span><span class="hh-mini" style="color:#ff5555">TAKEN</span></div>`; });
  }
  return h;
}

// ── Reveal handlers ──
function _hhUpdateSidebar(screenKey, revIdx) {
  const suffix = screenKey.replace('hh-', '');
  const sideEl = document.getElementById(`hh-side-${suffix}`);
  const r = window.hhData;
  if (!sideEl || !r) return;
  if (suffix === 'library') {
    const out = new Set(window.hhLibMeta?.[Math.max(0, revIdx)] || []);
    sideEl.innerHTML = _sideStatus(r, out, null);
  } else if (suffix === 'keys') {
    const preOut = r.outOrder.filter(o => o.phase === 1).map(o => o.name);
    const out = new Set(window.hhKeysMeta?.[Math.max(0, revIdx)] || preOut);
    sideEl.innerHTML = _sideStatus(r, out, null);
  } else if (suffix === 'boss') {
    const meta = window.hhBossMeta || [];
    const cur = meta[Math.max(0, revIdx)] || { taken: [], escaped: null };
    sideEl.innerHTML = _bossSidebar(r, cur.taken, cur.escaped);
  }
}

export function hauntedRevealNext(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const st = window._tvState[screenKey];
  if (st.idx >= total - 1) return;
  st.idx++;
  const suffix = screenKey.replace('hh-', '');
  const el = document.getElementById(`hh-step-${suffix}-${st.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  const cnt = document.getElementById(`hh-cnt-${suffix}`);
  if (cnt) cnt.textContent = `${st.idx + 1} / ${total}`;
  if (st.idx >= total - 1) {
    const c = document.getElementById(`hh-ctrl-${suffix}`); if (c) c.style.display = 'none';
    const d = document.getElementById(`hh-done-${suffix}`); if (d) d.style.display = '';
  }
  _hhUpdateSidebar(screenKey, st.idx);
}

export function hauntedRevealAll(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const st = window._tvState[screenKey];
  const suffix = screenKey.replace('hh-', '');
  for (let i = st.idx + 1; i < total; i++) {
    const el = document.getElementById(`hh-step-${suffix}-${i}`);
    if (el) el.style.display = '';
  }
  st.idx = total - 1;
  const cnt = document.getElementById(`hh-cnt-${suffix}`);
  if (cnt) cnt.textContent = `${total} / ${total}`;
  const c = document.getElementById(`hh-ctrl-${suffix}`); if (c) c.style.display = 'none';
  const d = document.getElementById(`hh-done-${suffix}`); if (d) d.style.display = '';
  _hhUpdateSidebar(screenKey, st.idx);
}
