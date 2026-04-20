// ══════════════════════════════════════════════════════════════════════
// alien-egg.js — Alien Resurr-eggtion challenge (TDA S2E2)
// Chef as Mama Alien hunts players with paintball slime gun across a
// sci-fi film lot. Players must find alien eggs and deliver them back.
// Pre-merge: tribe with most eggs wins. Post-merge: player(s) with
// most eggs win immunity. Slimed = eliminated from challenge.
// ══════════════════════════════════════════════════════════════════════
import { gs, seasonConfig, players } from '../core.js';
import { pStats, pronouns, romanticCompat } from '../players.js';
import { getBond, addBond } from '../bonds.js';
import { _checkShowmanceChalMoment } from '../romance.js';

// ── Sci-Fi Set Locations ──
const LOCATIONS = [
  { id: 'corridor-a',     name: 'Corridor A — Main Access',        searchBonus: 0, hideBonus: 1, sprintBonus: 1 },
  { id: 'lab-wing',       name: 'Lab Wing — Research Sector',      searchBonus: 2, hideBonus: 0, sprintBonus: -1 },
  { id: 'deep-storage',   name: 'Deep Storage — Containment',      searchBonus: 1, hideBonus: 2, sprintBonus: -1 },
  { id: 'ventilation',    name: 'Ventilation Shafts',               searchBonus: 0, hideBonus: 2, sprintBonus: 0 },
  { id: 'reactor-room',   name: 'Reactor Room — Core Access',      searchBonus: 1, hideBonus: -1, sprintBonus: 0 },
  { id: 'cargo-bay',      name: 'Cargo Bay — Loading Dock',        searchBonus: 0, hideBonus: 0, sprintBonus: 2 },
  { id: 'med-bay',        name: 'Med Bay — Quarantine Zone',       searchBonus: 2, hideBonus: 1, sprintBonus: -1 },
  { id: 'bridge',         name: 'Bridge — Command Center',         searchBonus: 1, hideBonus: 0, sprintBonus: 0 },
];

// ── Egg Types ──
const EGG_TYPES = { normal: 'normal', gold: 'gold', trap: 'trap', empty: 'empty' };
const EGG_VALUES = { normal: 1, gold: 2, trap: 0, empty: 0 };

// ── Chef Escalation ──
const MAMA_LEVELS = [
  { level: 1, name: 'Patrolling',   baseHit: 0.10, targetBonus: 0.05 },
  { level: 2, name: 'Hunting',      baseHit: 0.20, targetBonus: 0.08 },
  { level: 3, name: 'Rampaging',    baseHit: 0.35, targetBonus: 0.10 },
  { level: 4, name: 'Gatling Mode', baseHit: 0.50, targetBonus: 0.12 },
  { level: 5, name: 'Full Rampage', baseHit: 0.70, targetBonus: 0.15 },
];

const CHRIS_OPENERS = [
  "Welcome to the film lot's sci-fi set! Today's challenge: retrieve alien eggs from the set and deliver them to the extraction zone. Oh, and Chef is playing Mama Alien. He has a paintball gun. Full of slime.",
  "Lights! Camera! Alien invasion! Your mission: find eggs, bring them back. Simple, right? Except Chef's in a rubber alien suit with a gatling paintball gun. Good luck!",
  "Today you're starring in a sci-fi horror movie! The eggs are scattered across the set. Mama Alien is guarding them. Get slimed and you're done. Any questions? No? GO!",
  "Hope everyone signed their waivers! Chef's Mama Alien costume has been... upgraded. More teeth. More slime. And a paintball gun that Chef is WAY too excited about.",
];

const CHRIS_CLOSERS = [
  "And CUT! That's a wrap on the slimiest challenge in franchise history!",
  "I hope wardrobe has backup outfits, because NOBODY is getting that slime out.",
  "Chef, take off the costume. CHEF. Take it off. He's still in character, folks.",
  "The set is destroyed, everyone's covered in slime, and I couldn't be happier.",
];

const CHRIS_COMMENTARY = {
  act1: [
    `"This is almost too easy. Chef, you can actually START shooting now." — Chris McLean`,
    `"Ten bucks says someone screams at a mannequin." — Chris`,
    `"Reminder: the slime washes out. Mostly. We think." — Chris`,
    `"Chef's still learning the controls. Enjoy the grace period while it lasts." — Chris`,
    `"The eggs are out there. So is Chef. Choose wisely." — Chris McLean`,
  ],
  act2: [
    `"Now we're getting somewhere! Chef's found his rhythm!" — Chris McLean`,
    `"The egg count is climbing and so is the slime count. This is GREAT television." — Chris`,
    `"Ooh, that was a close one! Almost got painted!" — Chris`,
    `"I love watching people carry fragile objects while running for their lives." — Chris McLean`,
    `"Chef, easy on the trigger! ...Actually, no. Go wild." — Chris`,
  ],
  act3: [
    `"Down to the final few! And Chef is NOT slowing down!" — Chris McLean`,
    `"The extraction zone is RIGHT THERE. All you have to do is not get slimed. Easy, right?" — Chris`,
    `"Chef's in full rampage mode. I don't even feel safe in the control room." — Chris`,
    `"THAT is what I call a challenge. Someone get me a towel. And a therapist." — Chris McLean`,
  ],
};

// ══════════════════════════════════════════════════════════════════════
// ENCOUNTER TEMPLATES
// ══════════════════════════════════════════════════════════════════════

// ── SEARCH: finding eggs ──
const SEARCH_ENCOUNTERS = [
  { id: 'check-console', type: 'search', stat: 'mental', basePoints: 1, maxPoints: 2,
    text: [
      (n,pr) => `${n} pries open a fake console panel. Nothing. Tries the next one. Nothing. The third one has an egg wedged inside. ${pr.Sub} pull${pr.sub==='they'?'':'s'} it out carefully.`,
      (n,pr) => `Methodical. ${n} checks every prop surface in the corridor. Under the chairs. Behind the monitors. Inside a fake plant pot — there. An egg.`,
    ],
  },
  { id: 'crawl-vent', type: 'search', stat: 'physical', basePoints: 1, maxPoints: 2,
    text: [
      (n,pr) => `${n} crawls into a ventilation shaft. It's dark, it's cramped, and something drips on ${pr.posAdj} neck. But at the end of the shaft — an egg, sitting in a nest of wires.`,
      (n,pr) => `The vent cover pops off easily. ${n} shimmies inside. Twenty feet of darkness later, ${pr.posAdj} fingers close around an egg. Getting back out is another problem.`,
    ],
  },
  { id: 'alien-nest', type: 'search', stat: 'boldness', basePoints: 1, maxPoints: 2,
    text: [
      (n,pr) => `A prop alien nest — resin eggs, fake goo, the works. But one of these eggs is real. ${n} reaches in and starts testing them. Third one is heavy. That's the one.`,
      (n,pr) => `${n} finds a cluster of alien pods. Most are decorative. One isn't. ${pr.Sub} pull${pr.sub==='they'?'':'s'} it from the goo. It's warm.`,
    ],
  },
  { id: 'locker-search', type: 'search', stat: 'mental', stat2: 'intuition', basePoints: 1, maxPoints: 2,
    text: [
      (n,pr) => `A row of prop lockers. ${n} opens them one by one. Empty. Empty. A rubber alien head. Empty. An egg. ${pr.Sub} pocket${pr.sub==='they'?'':'s'} it.`,
      (n,pr) => `${n}'s instinct says check the lockers. ${pr.PosAdj} instinct is right — third one from the left, behind a fake biohazard suit.`,
    ],
  },
  { id: 'ceiling-egg', type: 'search', stat: 'physical', stat2: 'boldness', basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} spots it — an egg wedged in the ceiling pipes, fifteen feet up. ${pr.Sub} climb${pr.sub==='they'?'':'s'} a prop scaffold to reach it. One hand on the pipe, one on the egg. Don't look down.`,
      (n,pr) => `There's an egg in the rafters. Of course there is. ${n} scales the scaffolding like ${pr.sub}'${pr.sub==='they'?'ve':'s'} done this before. Maybe ${pr.sub} ha${pr.sub==='they'?'ve':'s'}.`,
    ],
  },
  { id: 'cryopod-search', type: 'search', stat: 'boldness', basePoints: 1, maxPoints: 2,
    text: [
      (n,pr) => `A row of cryopods. One is slightly ajar. ${n} pulls it open — inside, nestled in foam, an egg. ${pr.Sub} grab${pr.sub==='they'?'':'s'} it before the pod can close again.`,
      (n,pr) => `${n} checks inside a prop cryopod. There's a mannequin in there. And behind the mannequin — an egg. ${n} reaches past the plastic face and grabs it.`,
    ],
  },
];

// ── EVASION: dodging Chef ──
const EVASION_ENCOUNTERS = [
  { id: 'duck-behind-wall', type: 'evasion', stat: 'mental', basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} hears the hiss of the paintball gun cycling. ${pr.Sub} drop${pr.sub==='they'?'':'s'} flat behind a prop wall. Green paint splatters the surface above ${pr.posAdj} head. Close. Too close.`,
      (n,pr) => `The targeting laser sweeps the corridor. ${n} presses into a doorway. The beam passes. ${pr.Sub} don't breathe until the footsteps fade.`,
    ],
  },
  { id: 'sprint-corridor', type: 'evasion', stat: 'physical', basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} hears Chef coming and bolts. Full sprint down the corridor. Paintballs whiz past — one clips the wall, another hits a light fixture. ${pr.Sub} make${pr.sub==='they'?'':'s'} the corner. Safe. Barely.`,
      (n,pr) => `Running. Just running. ${n} doesn't look back. Slime splashes the floor behind ${pr.obj}. Left turn. Right turn. The footsteps stop. ${pr.Sub} slow${pr.sub==='they'?'':'s'} down. Heart hammering.`,
    ],
  },
  { id: 'climb-scaffold', type: 'evasion', stat: 'physical', stat2: 'boldness', basePoints: 3, maxPoints: 4,
    text: [
      (n,pr) => `${n} scales a scaffold tower. Mama Alien can't follow — too heavy. ${pr.Sub} watch${pr.sub==='they'?'':'es'} from twenty feet up as Chef circles below, paintball gun aimed upward. Standoff.`,
      (n,pr) => `Vertical escape. ${n} goes up. Pipes, scaffolding, whatever holds weight. Chef shoots upward — the angle is bad. Slime hits the ceiling and drips back down on Chef. ${pr.Sub} stay${pr.sub==='they'?'':'s'} up there.`,
    ],
  },
  { id: 'costume-blend', type: 'evasion', stat: 'mental', stat2: 'social', basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} grabs a prop alien mask off a shelf and freezes among a row of mannequins. Chef walks past. Scans the line. Keeps walking. ${n} doesn't move for sixty seconds after.`,
      (n,pr) => `${n} dives into a costume rack. Alien suit, space helmet, the works. Mama Alien passes. Stops. Looks at the rack. Moves on. ${n} exhales into a rubber mask.`,
    ],
  },
  { id: 'distraction-throw', type: 'evasion', stat: 'mental', basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} picks up a prop and hurls it down the corridor. It crashes into a wall. Mama Alien's head whips toward the noise. ${n} slips away in the other direction.`,
      (n,pr) => `A prop beaker. ${n} throws it. Glass shatters three corridors over. Chef pivots toward the sound. ${n} is already gone.`,
    ],
  },
];

// ── HEROIC ──
const HEROIC_ENCOUNTERS = [
  { id: 'cover-fire', type: 'heroic', stat: 'boldness', stat2: 'loyalty', basePoints: 3, maxPoints: 4, needsTarget: true,
    text: [
      (n,pr,t) => `${n} grabs a fire extinguisher and blasts a cloud of white fog across the corridor. "GO! NOW!" ${t} sprints through the smoke with ${pronouns(t).posAdj} egg. ${n} holds the line.`,
      (n,pr,t) => `${n} steps into the open. Arms wide. "HEY! OVER HERE!" Mama Alien turns. ${t} slips past behind Chef's back. ${n} runs before the first shot fires.`,
    ],
  },
  { id: 'rescue-grab', type: 'heroic', stat: 'physical', stat2: 'loyalty', basePoints: 3, maxPoints: 4, needsTarget: true,
    text: [
      (n,pr,t) => `${t} is frozen in the open. Mama Alien is closing. ${n} sprints across the gap, grabs ${t} by the collar, and hauls ${pronouns(t).obj} behind a bulkhead. "MOVE or you're PAINT."`,
      (n,pr,t) => `${n} sees ${t} cornered. Without thinking, ${pr.sub} grab${pr.sub==='they'?'':'s'} ${t}'s arm and drags ${pronouns(t).obj} into a side corridor. The paintball hits the wall where ${t} was standing.`,
    ],
  },
  { id: 'decoy-run', type: 'heroic', stat: 'physical', stat2: 'boldness', basePoints: 4, maxPoints: 5, needsTarget: true,
    text: [
      (n,pr,t) => `${n} runs into the open, waving ${pr.posAdj} arms. "HEY CHEF! OVER HERE!" Mama Alien turns. ${n} sprints the opposite direction. Behind ${pr.obj}, ${t} slips through with ${pronouns(t).posAdj} egg.`,
      (n,pr,t) => `"I'll draw fire." ${n} says it like it's nothing. Then ${pr.sub} sprint${pr.sub==='they'?'':'s'} into the corridor, paintballs pinging around ${pr.obj}. ${t} delivers ${pronouns(t).posAdj} egg in the chaos.`,
    ],
  },
];

// ── SABOTAGE ──
const SABOTAGE_ENCOUNTERS = [
  { id: 'kick-pipe', type: 'sabotage', stat: 'strategic', basePoints: -2, maxPoints: -2, needsTarget: true,
    text: [
      (n,pr,t) => `${n} "accidentally" kicks a pipe as ${pr.sub} pass${pr.sub==='they'?'':'es'} ${t}'s position. The clang echoes down the shaft. Mama Alien's head snaps around. ${n} is already three corridors away.`,
      (n,pr,t) => `A casual boot against a metal drum. CLANG. ${t} flinches. The sound carries. ${n} keeps walking, expression blank. Chef heard it. Chef always hears it.`,
    ],
  },
  { id: 'tip-shelf', type: 'sabotage', stat: 'strategic', stat2: 'boldness', basePoints: -3, maxPoints: -3, needsTarget: true,
    text: [
      (n,pr,t) => `${n} tips a shelf into ${t}'s path. Props scatter. ${t} stumbles. The crash echoes through the set. Chef is already turning.`,
      (n,pr,t) => `A prop bookshelf, right in ${t}'s lane. ${n} gives it a shove. It crashes. ${t} has to climb over the wreckage. Mama Alien is already turning.`,
    ],
  },
  { id: 'steal-egg', type: 'sabotage', stat: 'strategic', stat2: 'social', basePoints: -3, maxPoints: -4, needsTarget: true,
    text: [
      (n,pr,t) => `${t} sets ${pronouns(t).posAdj} egg down for one second to check a corner. ${n} takes it. Smooth. Silent. ${t} turns back. The egg is gone. ${n} is gone. "${pronouns(t).Sub}... wait, WHAT?"`,
      (n,pr,t) => `While ${t} is distracted by a noise, ${n} lifts the egg right out of ${pronouns(t).posAdj} hands. Sleight of hand. ${t} doesn't realize for a full corridor.`,
    ],
  },
];

// ── COMEDY ──
const COMEDY_ENCOUNTERS = [
  { id: 'mannequin-scream', type: 'comedy', stat: 'temperament', basePoints: -1, maxPoints: -1,
    text: [
      (n,pr) => `${n} rounds a corner and screams. It's a mannequin. In an alien costume. ${pr.Sub} just screamed at a prop. Two other players heard.`,
      (n,pr) => `A shape in the dark. ${n} freezes. Heart hammering. It's a mannequin in a lab coat. ${n} has to sit down for a minute.`,
    ],
  },
  { id: 'sneeze-reveal', type: 'comedy', stat: 'endurance', basePoints: -1, maxPoints: -1,
    text: [
      (n,pr) => `${n} holds it as long as ${pr.sub} can. Then: "ACHOO!" It echoes across the entire set. Mama Alien pivots. Every nearby player groans.`,
      (n,pr) => `The dust in the ventilation shaft gets to ${n}. The sneeze is catastrophic. It sounds like a small explosion. Chef's boots change direction.`,
    ],
  },
  { id: 'raccoon-shaft', type: 'comedy', stat: 'mental', basePoints: 0, maxPoints: 1,
    text: [
      (n,pr) => `${n} dives into a ventilation shaft to hide. It's already occupied — by a raccoon. They stare at each other. The raccoon hisses. ${n} hisses back. A truce is formed.`,
      (n,pr) => `${n} crawls into a vent and finds a raccoon nest. Three babies. The mom eyes ${n}. ${n} eyes the mom. Neither moves. An understanding.`,
    ],
  },
  { id: 'alien-prop-hit', type: 'comedy', stat: 'physical', basePoints: -1, maxPoints: -1,
    text: [
      (n,pr) => `${n} walks face-first into a hanging alien prop. Screams. It's rubber. ${pr.Sub} punch${pr.sub==='they'?'':'es'} it. It swings back and hits ${pr.obj} again.`,
      (n,pr) => `A fake facehugger drops from the ceiling onto ${n}'s head. Chaos. Flailing. Screaming. It's attached by a string. ${n} finally rips it off. Dignity: gone.`,
    ],
  },
  { id: 'phone-ring', type: 'comedy', stat: 'temperament', basePoints: -1, maxPoints: -1,
    text: [
      (n,pr) => `${n}'s phone goes off. Full volume. It's ${pr.posAdj} mom. Mama Alien turns. ${n} stares at the phone in horror. "NOT NOW, MOM."`,
      (n,pr) => `A ringtone — the default one. ${n} fumbles for ${pr.posAdj} pocket. Every player within earshot glares. Chef's boots are already moving.`,
    ],
  },
  { id: 'egg-juggle', type: 'comedy', stat: 'physical', basePoints: -1, maxPoints: 0,
    text: [
      (n,pr) => `${n} tries to carry two eggs at once. Bad idea. ${pr.Sub} juggle${pr.sub==='they'?'':'s'} them for three terrifying seconds. One survives. The other bounces off a wall and somehow doesn't break.`,
      (n,pr) => `The egg is slippery. ${n}'s hands are sweaty. It pops out of ${pr.posAdj} grip. ${pr.Sub} catch${pr.sub==='they'?'':'es'} it between ${pr.posAdj} knees. Graceless. Effective.`,
    ],
  },
  { id: 'chef-costume-squeak', type: 'comedy', basePoints: 0, maxPoints: 0,
    text: [
      () => `Chef's costume squeaks with every step. SQUEAK. SQUEAK. SQUEAK. He stops. Looks down at the rubber suit. Sighs. The squeaking resumes. Even the contestants feel bad.`,
      () => `The Mama Alien costume's tail gets caught in a door. Chef is stuck. He yanks. The door comes off its hinges. Chris over the walkie: "That's coming out of YOUR pay!"`,
    ],
  },
];

// ── PANIC ──
const PANIC_ENCOUNTERS = [
  { id: 'panic-freeze', type: 'panic', stat: 'temperament', basePoints: -2, maxPoints: -2, invertStat: true,
    text: [
      (n,pr) => `${n} freezes. Legs won't move. Mama Alien is RIGHT THERE. ${pr.PosAdj} brain says run. ${pr.PosAdj} body says absolutely not.`,
      (n,pr) => `Panic locks ${n} in place. Eyes wide. Breathing fast. The targeting laser passes across ${pr.posAdj} chest. ${pr.Sub} can't even duck.`,
    ],
  },
  { id: 'egg-fumble', type: 'panic', stat: 'physical', basePoints: -2, maxPoints: -2, invertStat: true,
    text: [
      (n,pr) => `${n} drops ${pr.posAdj} egg. It bounces. Once. Twice. Rolls toward Mama Alien. ${pr.Sub} watch${pr.sub==='they'?'':'es'} it go in slow motion.`,
      (n,pr) => `Sweaty hands. The egg slips. ${n} grabs for it — misses. It hits the grated floor and rolls. ${pr.Sub} chase${pr.sub==='they'?'':'s'} it on hands and knees.`,
    ],
  },
  { id: 'trip-cables', type: 'panic', stat: 'physical', basePoints: -1, maxPoints: -1,
    text: [
      (n,pr) => `Power cables on the ground. ${n}'s foot catches one. Then the other foot. ${pr.Sub}'${pr.sub==='they'?'re':'s'} tangled. The more ${pr.sub} struggle${pr.sub==='they'?'':'s'}, the worse it gets. Chef's footsteps grow louder.`,
      (n,pr) => `${n} trips over a cable bundle and goes down hard. The egg flies — ${pr.sub} catch${pr.sub==='they'?'':'es'} it mid-fall. Face-down on the floor with an intact egg. Small victory.`,
    ],
  },
  { id: 'cramp-still', type: 'panic', stat: 'endurance', basePoints: -1, maxPoints: -1,
    text: [
      (n,pr) => `${n} has been crouching too long. ${pr.PosAdj} leg cramps. Hard. ${pr.Sub} let${pr.sub==='they'?'':'s'} out a yelp before ${pr.sub} can stop it. The sound carries.`,
      (n,pr) => `Cramp. Right calf. ${n} grits ${pr.posAdj} teeth. The pain is blinding. ${pr.Sub} nearly give${pr.sub==='they'?'':'s'} away ${pr.posAdj} position.`,
    ],
  },
];

// ── SHOWMANCE ──
const SHOWMANCE_ENCOUNTERS = [
  { id: 'couple-hiding', type: 'showmance', basePoints: 0, maxPoints: 0,
    text: [
      (n,pr,t) => `${n} and ${t} are supposed to be searching for eggs. They are not searching for eggs. They're hiding in a prop spaceship, whispering and laughing. Zero eggs found.`,
      (n,pr,t) => `${n} and ${t} have found a cozy spot behind a fake reactor. The challenge is happening around them. They don't seem to notice. Or care.`,
    ],
  },
  { id: 'couple-run', type: 'showmance', basePoints: 1, maxPoints: 2,
    text: [
      (n,pr,t) => `${n} grabs ${t}'s hand. "We need to move NOW." They run together, hands clasped, eggs bouncing. It would be romantic if they weren't both screaming.`,
      (n,pr,t) => `Chef closes in. ${n} pulls ${t} into a side corridor. Their faces are close. Chef passes. The moment stretches. Then: "...we should go." "Yeah."`,
    ],
  },
  { id: 'couple-separated', type: 'showmance', basePoints: -1, maxPoints: -1,
    text: [
      (n,pr,t) => `A paintball barrage separates ${n} and ${t}. Green slime between them like a wall. ${n} reaches out. ${t} reaches back. They can't cross. "I'll find you!" "WIN THIS!"`,
      (n,pr,t) => `Mama Alien forces ${n} down one corridor and ${t} down another. They look back at each other one last time before the corners swallow them.`,
    ],
  },
];

// ── GROUP DYNAMICS ──
const GROUP_ENCOUNTERS = [
  { id: 'group-form', type: 'group', basePoints: 1, maxPoints: 1,
    text: [
      (n,pr,t) => `${n} and ${t} cluster together at an intersection. ${n} takes point. ${t} watches the flanks. Strength in numbers — at least until the shooting starts.`,
      (n,pr,t) => `"Stay close." ${n} and ${t} move as a unit through the corridor. One searches, one watches for Chef. Efficient. Professional. Terrified.`,
    ],
  },
  { id: 'group-split', type: 'group', basePoints: 0, maxPoints: 0,
    text: [
      (n,pr,t) => `${n} and ${t} reach a fork. Left or right? They stare at each other. "I'll go left." "Fine. Don't die." They split. The corridor feels emptier immediately.`,
      (n,pr,t) => `A disagreement. ${n} wants to go deeper. ${t} wants to head back. They part ways. Neither looks happy about it.`,
    ],
  },
  { id: 'group-abandon', type: 'group', basePoints: -1, maxPoints: -1,
    text: [
      (n,pr,t) => `Chef appears. ${n} makes a decision: run. ${t} is left behind, staring at the empty corridor where ${pr.posAdj} ally used to be. "${n}?! ...${n}?!"`,
      (n,pr,t) => `${n} hears the gatling spin up. Self-preservation wins. ${pr.Sub} bolt${pr.sub==='they'?'':'s'}, leaving ${t} to fend for ${pronouns(t).ref}. It's not heroic. It's honest.`,
    ],
  },
];

// ── ALLIANCE ──
const ALLIANCE_ENCOUNTERS = [
  { id: 'alliance-form', type: 'alliance', basePoints: 1, maxPoints: 2,
    text: [
      (n,pr,t) => `${n} pulls ${t} aside. "You and me — we take turns carrying. One carries, one watches. Switch every corridor." ${t} nods. They shake on it.`,
      (n,pr,t) => `"I know where there's a gold egg." ${n} locks eyes with ${t}. "But I need backup. You in?" ${t}: "I'm in."`,
    ],
  },
  { id: 'intel-trade', type: 'alliance', basePoints: 1, maxPoints: 2,
    text: [
      (n,pr,t) => `${n} shares intel with ${t}: "Gold egg. Deep Storage. Prop cage on the left." ${t}: "What's the catch?" ${n}: "You owe me at tribal."`,
      (n,pr,t) => `"Chef patrols the Lab Wing every third round." ${n} tells ${t} this like it's a secret. It is. ${t} files it away. Information for loyalty.`,
    ],
  },
  { id: 'alliance-break', type: 'alliance', basePoints: -2, maxPoints: -2,
    text: [
      (n,pr,t) => `${n} promised to watch ${t}'s back. Instead, ${pr.sub} used ${t} as a distraction while ${pr.sub} grabbed the last egg in the sector. ${t} doesn't know yet. ${t} will find out.`,
      (n,pr,t) => `"We were supposed to share intel." ${t} stares at ${n}. ${n} shrugs. "Plans change." The alliance dies in that shrug.`,
    ],
  },
];

// ── CONFRONTATION ──
const CONFRONTATION_ENCOUNTERS = [
  { id: 'post-sabotage', type: 'confrontation', basePoints: 0, maxPoints: 0,
    text: [
      (n,pr,t) => `${n} catches up to ${t}. "Did you just KICK that pipe?" ${t}: "I don't know what you're talking about." ${n}: "I heard you laughing." Silence. Neither blinks.`,
      (n,pr,t) => `"You tipped that shelf." ${n}'s voice is flat. ${t} turns slowly. "Prove it." They stare at each other. Somewhere, Chef reloads.`,
    ],
  },
  { id: 'egg-dispute', type: 'confrontation', basePoints: -1, maxPoints: -1,
    text: [
      (n,pr,t) => `${n} and ${t} spot the same egg. Same time. Same reach. Their hands close on it simultaneously. "I saw it first." "No. I did." The tug of war begins.`,
      (n,pr,t) => `One egg. Two players. ${n} and ${t} both grab for it. For a moment they're pulling in opposite directions. "LET GO." "YOU let go."`,
    ],
  },
];

// ── ENVIRONMENTAL ──
const ENVIRONMENTAL_EVENTS = [
  { id: 'lights-out', type: 'atmosphere', minLevel: 2,
    text: [
      () => `The lights cut out. Total darkness. Then emergency reds kick in. Everything is shadows and crimson. The set just became a real horror movie.`,
      () => `Power failure. The corridor goes black. Then the backup generators engage — red emergency lighting. Mama Alien's silhouette stretches thirty feet across the walls.`,
    ],
  },
  { id: 'sprinklers', type: 'atmosphere', minLevel: 1,
    text: [
      () => `Sprinklers activate from the ceiling. Water everywhere. Chef's costume sparks. The floor becomes a slip hazard. Nobody has traction.`,
      () => `The fire suppression system kicks in. Rain inside. Everyone's soaked. The eggs get slippery. Chef's paintball gun sputters but keeps firing.`,
    ],
  },
  { id: 'fog-machine', type: 'atmosphere', minLevel: 1,
    text: [
      () => `Someone kicked a fog machine on. Thick white mist rolls through the corridors. Visibility drops to ten feet. Chef: "I can still SMELL you!"`,
      () => `Fog pours from vents. The set becomes a maze of white. Footsteps echo but you can't tell whose. Could be a player. Could be Chef.`,
    ],
  },
  { id: 'alien-pod-open', type: 'atmosphere', minLevel: 2,
    text: [
      () => `A prop alien pod opens by itself — pneumatic hiss, then nothing. Nobody was near it. The set is turning against them.`,
      () => `Six cryopods open simultaneously. Empty. The hissing fills the corridor. Chef didn't do that. Chris didn't either. "...Technical difficulties." — Chris.`,
    ],
  },
  { id: 'set-collapse', type: 'atmosphere', minLevel: 3,
    text: [
      () => `A section of the set collapses. Plywood, fake wiring, props — all crashing down. Dust everywhere. When it clears, the corridor layout has changed. Some paths are blocked. Others just opened up.`,
      () => `Mama Alien walks through a wall. Just... through it. Plywood splinters. Fake wiring rains down. Chef doesn't bother with doors anymore.`,
    ],
  },
  { id: 'mama-prowl', type: 'monster-behavior', minLevel: 1,
    text: [
      () => `Mama Alien stalks the corridor — the rubber suit squeaking with every step. Chef doesn't care about stealth. He cares about the gatling paintball gun.`,
      () => `The mechanical hiss of the costume's breath system. Footsteps. Squeaking rubber. Chef is close. And he's not in a hurry. That's worse.`,
      () => `Chef pauses. Looks around. Tilts the alien head. The targeting laser sweeps left, right. Looking for heat signatures. Looking for eggs being carried.`,
    ],
  },
];

// ── BOOBY TRAP ──
const TRAP_ENCOUNTERS = [
  { id: 'alarm-egg',
    text: [
      (n,pr) => `${n} picks up the egg. It clicks. A siren blasts from inside it. Red lights flash. Before ${pr.sub} can drop it, slime erupts from hidden nozzles in the ceiling — drenching ${pr.obj} head to toe. Booby-trapped.`,
      (n,pr) => `The egg feels wrong. Too light. ${n} turns it over — a red light blinks inside. BOOM. Green slime explodes from every direction. The egg was bait. ${n} is covered.`,
    ],
  },
  { id: 'slime-splash',
    text: [
      (n,pr) => `${n} lifts the egg. PSHHH — green slime erupts from underneath it, from above it, from everywhere. A full slime mine. ${n} stands there, dripping, eliminated before Mama Alien even got close.`,
      (n,pr) => `The egg is rigged. A massive slime charge detonates when ${n} picks it up. Green paint covers ${pr.obj} from head to toe. ${pr.Sub} didn't even get a chance to run. Chris over the intercom: "BOOBY TRAP! Love those."`,
    ],
  },
];

// ── EMPTY EGG ──
const EMPTY_ENCOUNTERS = [
  { id: 'empty-reveal',
    text: [
      (n,pr) => `${n} carries the egg all the way back to the extraction zone. Opens it. Empty. Foam core. ${pr.Sub} stare${pr.sub==='they'?'':'s'} at it for five seconds. Sets it down. Goes back in. Doesn't speak.`,
      (n,pr) => `The egg felt light. ${n} hoped it was just the shell. It wasn't. Empty. A prop. All that risk for nothing. The walk of shame back into the set begins.`,
    ],
  },
];

// ── GOLD EGG ──
const GOLD_ENCOUNTERS = [
  { id: 'gold-found',
    text: [
      (n,pr) => `${n} finds it — wedged behind a broken cryopod. It's heavier than the others. Golden shimmer. Worth double. Now ${pr.sub} just ha${pr.sub==='they'?'ve':'s'} to get it out alive.`,
      (n,pr) => `Deep in the set, behind a locked prop cage that ${n} shoulder-checks open. The egg is gold. Warm. Glowing faintly. Worth two. ${n}'s a walking target now.`,
    ],
  },
];

// ── DELIVERY ──
const DELIVERY_ENCOUNTERS = [
  { id: 'clean-delivery',
    text: [
      (n,pr) => `${n} reaches the extraction zone, slides the egg into the containment crate. Safe. Banked. ${pr.Sub}'${pr.sub==='they'?'re':'s'} breathing hard. Looks back at the set. Goes back in.`,
      (n,pr) => `${n} bursts out of the set at full sprint, egg clutched to ${pr.posAdj} chest. Slides it into containment. The scoreboard updates. ${pr.Sub} don't celebrate — too busy catching ${pr.posAdj} breath.`,
      (n,pr) => `${n} walks the egg into the extraction zone like ${pr.sub}'${pr.sub==='they'?'ve':'s'} returning a library book. Calm. Collected. The egg clicks into the crate. One more banked.`,
      (n,pr) => `${n} makes it to the extraction zone without incident. Sets the egg down. Takes a breath. Looks at the scoreboard. Goes back in.`,
    ],
  },
  { id: 'close-delivery',
    text: [
      (n,pr) => `${n} slides into the extraction zone on ${pr.posAdj} knees, egg held above ${pr.posAdj} head. Green paint splatters the ground behind ${pr.obj}. Safe. Barely.`,
      (n,pr) => `${n} dives. Literally dives. The egg lands in the containment crate. ${n} lands on the floor. Slime splatters the wall above ${pr.obj}. Chris: "STYLE POINTS!"`,
      (n,pr) => `${n} sprints for the extraction zone — footsteps pounding behind ${pr.obj}. ${pr.Sub} throw${pr.sub==='they'?'':'s'} the egg the last five feet. It lands in the crate. ${n} crashes into the wall. Worth it.`,
    ],
  },
];

// ── SLIME SEQUENCES (approach → hit → reaction → aftermath) ──
const SLIME_APPROACH = {
  comedy: [
    (n,pr) => `Chef stumbles around a corner in the squeaking costume and nearly trips over ${n}. They make eye contact through the alien mouth-hole.`,
    (n,pr) => `${n} is hiding behind a cardboard console. Chef bumps into it. It falls. ${n} waves sheepishly.`,
  ],
  tense: [
    (n,pr) => `The targeting laser finds ${n}. Slow. Deliberate. The red dot tracks up ${pr.posAdj} chest to ${pr.posAdj} face. Chef has ${pr.obj} locked.`,
    (n,pr) => `Footsteps. Getting louder. ${n} presses deeper into the shadows. The footsteps stop right in front of ${pr.obj}. The paintball gun hums.`,
  ],
  terror: [
    (n,pr) => `Mama Alien walks through the wall. Not around it. Through it. Plywood explodes. ${n} has nowhere to go. Chef levels the gatling.`,
    (n,pr) => `The ground shakes. The monster appears through smoke and debris. ${n} makes a final sprint. The gatling spins up behind ${pr.obj}.`,
  ],
};

const SLIME_HIT = [
  (n,pr) => `Green paint explodes across ${n}'s chest. ${pr.PosAdj} egg flies out of ${pr.posAdj} hands, hits the floor, and shatters. Slime everywhere.`,
  (n,pr) => `Three paintball rounds in rapid succession. Chest. Arm. Forehead. ${n} goes down in a shower of green.`,
  (n,pr) => `One shot. Center mass. ${n} folds. Green paint splashes across ${pr.posAdj} shirt, ${pr.posAdj} face, the wall behind ${pr.obj}.`,
  (n,pr) => `The gatling opens up. Six rounds. ${n} takes three of them. The other three repaint the corridor wall. ${pr.Sub} stand${pr.sub==='they'?'':'s'} there, dripping.`,
  (n,pr) => `Chef doesn't miss at this range. The paintball catches ${n} square in the back. ${pr.Sub} pitch${pr.sub==='they'?'':'es'} forward. Green everywhere.`,
];

const SLIME_REACTION = {
  hothead: [
    (n,pr) => `${n} wipes the slime off ${pr.posAdj} face. Slowly. Looks at Chef. "We're not done." Chef: "Yeah we are."`,
    (n,pr) => `"SERIOUSLY?!" ${n} kicks a prop. The prop doesn't care. Neither does Chef.`,
  ],
  underdog: [
    (n,pr) => `${n} stands there, dripping. "I had one job." Drip. "ONE." Drip.`,
    (n,pr) => `${n} looks at ${pr.posAdj} slimed hands. Then at the ceiling. "Why."`,
  ],
  villain: [
    (n,pr) => `${n} smirks through the slime. "That all you got, Chef?" Chef fires one more for good measure.`,
    (n,pr) => `${n} takes the hit with ${pr.posAdj} chin up. "I'll remember this." Chef doesn't look concerned.`,
  ],
  beast: [
    (n,pr) => `${n} was so close. ${pr.Sub} can see the extraction zone from here. Slime drips off ${pr.posAdj} fingertips.`,
    (n,pr) => `${n} tried to outrun the paintball. Almost made it. Almost.`,
  ],
  default: [
    (n,pr) => `${n} checks for injuries. Nothing broken. Just pride. And a lot of green paint.`,
    (n,pr) => `${n} looks down at the slime. Looks at Chef. "That was unnecessary." Chef shrugs inside the costume. It squeaks.`,
    (n,pr) => `${n} walks to the slime bench without a word. Sits down. The bench squelches.`,
  ],
};

const SLIME_AFTERMATH = [
  (n,pr) => `${n} sits on the slime bench, staring at nothing. "I had a plan," ${pr.sub} say${pr.sub==='they'?'':'s'} to no one. "I had a PLAN."`,
  (n,pr) => `The other slimed players make room. ${n} flops down. "That sucked." General agreement.`,
  (n,pr) => `From the slime bench, ${n} watches the remaining players. "I could've lasted longer," ${pr.sub} mutter${pr.sub==='they'?'':'s'}. Maybe. Maybe not.`,
  (n,pr) => `${n} trudges to the bench, leaving a green trail on the floor. The other eliminated players slow-clap. ${pr.Sub} sit${pr.sub==='they'?'':'s'} down. Drips. "Don't."`,
  (n,pr) => `${n} sits on the bench. Green dripping from everywhere. ${pr.Sub} pull${pr.sub==='they'?'':'s'} out ${pr.posAdj} phone. It's also covered in slime. "Great."`,
];

// ══════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════

function _pick(arr, seed) {
  if (!arr || !arr.length) return arr;
  const h = typeof seed === 'string' ? [...seed].reduce((a, c) => a + c.charCodeAt(0), 0) : (seed || 0);
  return arr[Math.abs(h) % arr.length];
}

function _pickRand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function _canSabotage(name) {
  const s = pStats(name);
  const p = players.find(pl => pl.name === name);
  const arch = p?.archetype || '';
  if (['villain', 'mastermind', 'schemer'].includes(arch)) return true;
  if (['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(arch)) return false;
  return s.strategic >= 6 && s.loyalty <= 4;
}

function _getArchReaction(name) {
  const p = players.find(pl => pl.name === name);
  const arch = p?.archetype || '';
  if (['hothead'].includes(arch)) return 'hothead';
  if (['underdog', 'goat', 'floater'].includes(arch)) return 'underdog';
  if (['villain', 'mastermind', 'schemer'].includes(arch)) return 'villain';
  if (['challenge-beast'].includes(arch)) return 'beast';
  return 'default';
}

function _getMamaLevel(roundIndex, totalRounds) {
  const pct = roundIndex / totalRounds;
  if (pct < 0.2) return 1;
  if (pct < 0.4) return 2;
  if (pct < 0.6) return 3;
  if (pct < 0.8) return 4;
  return 5;
}

function _getMamaData(level) {
  return MAMA_LEVELS[Math.min(level, MAMA_LEVELS.length) - 1];
}

function _pickLocation(usedLocations) {
  const avail = LOCATIONS.filter(l => !usedLocations.includes(l.id));
  return avail.length ? _pickRand(avail) : _pickRand(LOCATIONS);
}

function _generateEggs(playerCount) {
  const totalEggs = Math.max(8, Math.round(playerCount * 2));
  const eggs = [];
  const goldCount = Math.max(1, Math.round(totalEggs * 0.15));
  const trapCount = Math.max(1, Math.round(totalEggs * 0.15));
  const emptyCount = Math.max(1, Math.round(totalEggs * 0.10));
  const normalCount = totalEggs - goldCount - trapCount - emptyCount;

  for (let i = 0; i < normalCount; i++) eggs.push({ type: 'normal', value: 1, found: false, delivered: false, destroyed: false, location: _pickRand(LOCATIONS).id });
  for (let i = 0; i < goldCount; i++) eggs.push({ type: 'gold', value: 2, found: false, delivered: false, destroyed: false, location: _pickRand(LOCATIONS.filter(l => l.searchBonus >= 1 || l.hideBonus >= 2)).id });
  for (let i = 0; i < trapCount; i++) eggs.push({ type: 'trap', value: 0, found: false, delivered: false, destroyed: false, location: _pickRand(LOCATIONS).id });
  for (let i = 0; i < emptyCount; i++) eggs.push({ type: 'empty', value: 0, found: false, delivered: false, destroyed: false, location: _pickRand(LOCATIONS).id });

  return eggs;
}

function _buildSlimeSequence(name, mamaLevel) {
  const pr = pronouns(name);
  const arch = _getArchReaction(name);
  const tier = mamaLevel <= 2 ? 'comedy' : mamaLevel <= 3 ? 'tense' : 'terror';
  const approach = _pickRand(SLIME_APPROACH[tier])(name, pr);
  const hit = _pickRand(SLIME_HIT)(name, pr);
  const reactionPool = SLIME_REACTION[arch] || SLIME_REACTION.default;
  const reaction = _pickRand(reactionPool)(name, pr);
  const aftermath = _pickRand(SLIME_AFTERMATH)(name, pr);
  return { tier, approach, hit, reaction, aftermath };
}

// ══════════════════════════════════════════════════════════════════════
// ENCOUNTER SELECTION
// ══════════════════════════════════════════════════════════════════════

// Phase-based event selection: each player walks through a chronological sequence per round
// Phase 1: SEARCH (if not carrying) → find egg or not
// Phase 2: ENCOUNTER (social event: heroic/sabotage/comedy/alliance/group/panic/showmance)
// Phase 3: EVASION (dodge Chef) or get targeted for slime
// This ensures events chain logically: you can't steal an egg that was never found,
// and traps only fire after a visible pickup.
function _buildRoundTimeline(survivors, mamaLevel, location, eggs, playerState, tribeMap, isMerged) {
  const timeline = [];
  const roundUsedIds = new Set();

  function _getTargetPools(name) {
    const myTribe = tribeMap?.[name] || null;
    const tribeName = myTribe?.name || null;
    const eligible = survivors.filter(p => !playerState[p]?.trapEliminated);
    const teammates = myTribe ? eligible.filter(p => p !== name && tribeMap[p]?.name === myTribe.name) : eligible.filter(p => p !== name);
    const crossTribe = myTribe ? eligible.filter(p => p !== name && tribeMap[p]?.name !== myTribe.name) : [];
    const positivePool = teammates.length ? (Math.random() < 0.75 ? teammates : [...teammates, ...crossTribe.filter(p => getBond(name, p) >= 3)]) : eligible.filter(p => p !== name);
    const rivals = crossTribe;
    return { teammates, crossTribe, positivePool, rivals, tribeName };
  }

  function tag(ev, tribeName) { ev.tribe = tribeName; return ev; }

  // ── PHASE 1: SEARCH ──
  // Shuffle survivors so no tribe consistently goes first
  const searchOrder = [...survivors].sort(() => Math.random() - 0.5);
  for (const name of searchOrder) {
    const s = pStats(name);
    const pr = pronouns(name);
    const { tribeName } = _getTargetPools(name);
    const isCarrying = playerState[name]?.carrying != null;
    const eggsInLocation = eggs.filter(e => !e.found && !e.destroyed && e.location === location.id);

    const searchChance = 0.15 + (s.mental || 5) * 0.05 + (s.intuition || 5) * 0.03 + (s.boldness || 5) * 0.02 + location.searchBonus * 0.06;
    if (!isCarrying && eggsInLocation.length > 0 && Math.random() < searchChance) {
      const pool = SEARCH_ENCOUNTERS.filter(e => !roundUsedIds.has(e.id));
      if (pool.length) {
        const tmpl = _pickRand(pool);
        roundUsedIds.add(tmpl.id);
        const points = Math.min(tmpl.maxPoints, tmpl.basePoints + Math.round((s[tmpl.stat] || 5) * 0.2));
        const text = _pickRand(tmpl.text)(name, pr);

        // Actually assign the egg
        const egg = eggsInLocation[0];
        egg.found = true;
        egg.foundBy = name;
        playerState[name].carrying = egg;

        timeline.push(tag({ player: name, type: 'search', id: tmpl.id, text, points, stat: tmpl.stat, phase: 1 }, tribeName));

        // Immediately check if it's a trap or gold — these are discovered on pickup
        if (egg.type === 'trap' && !egg._trapFired) {
          egg._trapFired = true;
          const trapText = _pickRand(_pickRand(TRAP_ENCOUNTERS).text)(name, pr);
          playerState[name].carrying = null;
          egg.destroyed = true;
          playerState[name].trapEliminated = true;
          timeline.push(tag({ player: name, type: 'trap', text: trapText, points: -2, phase: 1, eliminates: true }, tribeName));
        } else if (egg.type === 'gold') {
          const goldText = _pickRand(_pickRand(GOLD_ENCOUNTERS).text)(name, pr);
          timeline.push(tag({ player: name, type: 'gold-found', text: goldText, points: 0, phase: 1 }, tribeName));
        }
      }
    }
  }

  // ── PHASE 2: SOCIAL ENCOUNTERS ──
  // Each player gets at most 1 social event per round
  // Filter out trap-eliminated players
  const alive = survivors.filter(p => !playerState[p]?.trapEliminated);
  // Interleave tribes so each gets equal representation
  const tribeGroups = {};
  for (const p of alive) {
    const t = tribeMap?.[p]?.name || '_merged';
    if (!tribeGroups[t]) tribeGroups[t] = [];
    tribeGroups[t].push(p);
  }
  for (const t in tribeGroups) tribeGroups[t].sort(() => Math.random() - 0.5);
  const shuffled = [];
  const tribeKeys = Object.keys(tribeGroups).sort(() => Math.random() - 0.5);
  const maxLen = Math.max(...Object.values(tribeGroups).map(g => g.length));
  for (let i = 0; i < maxLen; i++) {
    for (const t of tribeKeys) {
      if (tribeGroups[t][i]) shuffled.push(tribeGroups[t][i]);
    }
  }
  for (const name of shuffled) {
    const s = pStats(name);
    const pr = pronouns(name);
    const { teammates, positivePool, rivals, tribeName } = _getTargetPools(name);

    // Sabotage — steal-egg only if target is actually carrying
    if (_canSabotage(name) && Math.random() < 0.28) {
      const crossEnemies = rivals;
      const tribeEnemies = teammates.filter(p => getBond(name, p) <= -1);
      const targetPool = [...crossEnemies, ...tribeEnemies].filter(p => survivors.includes(p));
      const target = targetPool.length ? _pickRand(targetPool) : null;
      if (target) {
        // steal-egg only if target has an egg
        const canSteal = playerState[target]?.carrying != null;
        const pool = SABOTAGE_ENCOUNTERS.filter(e => !roundUsedIds.has(e.id) && (e.id !== 'steal-egg' || canSteal));
        if (pool.length) {
          const tmpl = _pickRand(pool);
          roundUsedIds.add(tmpl.id);
          const text = _pickRand(tmpl.text)(name, pr, target);
          const catchBoostAmt = 0.12 + s.strategic * 0.02;
          let eggDropped = false;
          // Non-steal sabotage: chance to make target drop their egg
          if (tmpl.id !== 'steal-egg' && playerState[target]?.carrying && Math.random() < 0.35) {
            const droppedEgg = playerState[target].carrying;
            droppedEgg.found = false;
            droppedEgg.foundBy = null;
            playerState[target].carrying = null;
            eggDropped = true;
          }
          timeline.push(tag({ player: name, type: 'sabotage', id: tmpl.id, text, points: tmpl.basePoints, target, negative: true, stat: tmpl.stat, catchBoost: catchBoostAmt, heat: 1 + Math.floor(s.strategic * 0.2), eggDropped, phase: 2 }, tribeName));
          if (tmpl.id === 'steal-egg' && canSteal) {
            const stolenEgg = playerState[target].carrying;
            playerState[target].carrying = null;
            playerState[name].carrying = stolenEgg;
          }
          continue;
        }
      }
    }

    // Heroic
    if (s.loyalty >= 5 && Math.random() < 0.18) {
      const allies = positivePool.filter(p => getBond(name, p) >= 2);
      if (allies.length) {
        const target = _pickRand(allies);
        const pool = HEROIC_ENCOUNTERS.filter(e => !roundUsedIds.has(e.id));
        if (pool.length) {
          const tmpl = _pickRand(pool);
          roundUsedIds.add(tmpl.id);
          const points = Math.min(tmpl.maxPoints, tmpl.basePoints + Math.round(s.boldness * 0.15));
          const text = _pickRand(tmpl.text)(name, pr, target);
          timeline.push(tag({ player: name, type: 'heroic', id: tmpl.id, text, points, target, stat: tmpl.stat, phase: 2 }, tribeName));
          continue;
        }
      }
    }

    // Alliance
    if (Math.random() < 0.12 && positivePool.length) {
      const bondedAllies = positivePool.filter(p => getBond(name, p) >= 1);
      const target = bondedAllies.length ? _pickRand(bondedAllies) : null;
      if (target) {
        const canBreak = getBond(name, target) <= -1;
        const pool = ALLIANCE_ENCOUNTERS.filter(e => !roundUsedIds.has(e.id) && (e.id !== 'alliance-break' || canBreak));
        if (pool.length) {
          const tmpl = _pickRand(pool);
          roundUsedIds.add(tmpl.id);
          const text = _pickRand(tmpl.text)(name, pr, target);
          timeline.push(tag({ player: name, type: 'alliance', id: tmpl.id, text, points: tmpl.basePoints, target, phase: 2 }, tribeName));
          continue;
        }
      }
    }

    // Confrontation
    if (playerState[name]?.sabotagedBy && Math.random() < 0.5) {
      const target = playerState[name].sabotagedBy;
      if (survivors.includes(target)) {
        const pool = CONFRONTATION_ENCOUNTERS.filter(e => !roundUsedIds.has(e.id));
        if (pool.length) {
          const tmpl = _pickRand(pool);
          roundUsedIds.add(tmpl.id);
          const text = _pickRand(tmpl.text)(name, pr, target);
          timeline.push(tag({ player: name, type: 'confrontation', id: tmpl.id, text, points: tmpl.basePoints, target, phase: 2 }, tribeName));
          continue;
        }
      }
    }

    // Group dynamics
    const group = playerState[name]?.group;
    if (group && group.length > 1 && Math.random() < 0.2) {
      const partner = group.find(p => p !== name && survivors.includes(p));
      if (partner) {
        const pool = GROUP_ENCOUNTERS.filter(e => !roundUsedIds.has(e.id));
        if (pool.length) {
          const tmpl = _pickRand(pool);
          roundUsedIds.add(tmpl.id);
          const text = _pickRand(tmpl.text)(name, pr, partner);
          timeline.push(tag({ player: name, type: 'group', id: tmpl.id, text, points: tmpl.basePoints, target: partner, phase: 2 }, tribeName));
          continue;
        }
      }
    }

    // Comedy
    if (Math.random() < 0.12) {
      const pool = COMEDY_ENCOUNTERS.filter(e => !roundUsedIds.has(e.id));
      if (pool.length) {
        const tmpl = _pickRand(pool);
        roundUsedIds.add(tmpl.id);
        const textFn = _pickRand(tmpl.text);
        const text = textFn.length >= 2 ? textFn(name, pr) : textFn();
        timeline.push(tag({ player: name, type: 'comedy', id: tmpl.id, text, points: tmpl.basePoints || 0, phase: 2 }, tribeName));
        continue;
      }
    }

    // Panic
    const panicChance = 0.06 + (10 - (s.temperament || 5)) * 0.03 + mamaLevel * 0.03;
    if (Math.random() < panicChance) {
      const pool = PANIC_ENCOUNTERS.filter(e => !roundUsedIds.has(e.id));
      if (pool.length) {
        const tmpl = _pickRand(pool);
        roundUsedIds.add(tmpl.id);
        const text = _pickRand(tmpl.text)(name, pr);
        timeline.push(tag({ player: name, type: 'panic', id: tmpl.id, text, points: tmpl.basePoints, negative: true, phase: 2 }, tribeName));
      }
    }
  }

  // ── PHASE 3: EVASION (players who are carrying try to evade Chef) ──
  for (const name of alive) {
    const s = pStats(name);
    const pr = pronouns(name);
    const { tribeName } = _getTargetPools(name);
    const isCarrying = playerState[name]?.carrying != null;

    const evasionChance = 0.1 + mamaLevel * 0.05 + (isCarrying ? 0.2 : 0) + (s.physical || 5) * 0.02 + (s.mental || 5) * 0.02;
    if (Math.random() < evasionChance) {
      const pool = EVASION_ENCOUNTERS.filter(e => !roundUsedIds.has(e.id));
      if (pool.length) {
        const tmpl = _pickRand(pool);
        roundUsedIds.add(tmpl.id);
        const statVal = s[tmpl.stat] || 5;
        const points = Math.min(tmpl.maxPoints, tmpl.basePoints + Math.round(statVal * 0.15));
        const text = _pickRand(tmpl.text)(name, pr);
        timeline.push(tag({ player: name, type: 'evasion', id: tmpl.id, text, points, stat: tmpl.stat, phase: 3 }, tribeName));
      }
    }
  }

  // ── PHASE 4: DELIVERIES (carriers who survived evasion attempt delivery) ──
  // Track which players found their egg THIS round (they already have a search event)
  const foundThisRound = new Set(timeline.filter(e => e.type === 'search').map(e => e.player));

  for (const name of alive) {
    const carried = playerState[name]?.carrying;
    if (!carried) continue;
    const s = pStats(name);
    const pr = pronouns(name);
    const { tribeName } = _getTargetPools(name);

    const deliveryChance = 0.15 + (s.physical || 5) * 0.04 + (s.endurance || 5) * 0.03 + (s.boldness || 5) * 0.02 + location.sprintBonus * 0.06 - mamaLevel * 0.05;
    if (Math.random() < deliveryChance) {
      // If this player has been carrying since a previous round, add a context beat
      if (!foundThisRound.has(name)) {
        const isGold = carried.type === 'gold';
        const carryIcon = isGold ? '🪙' : '🥚';
        timeline.push(tag({ player: name, type: 'carry-context', text: `${name} has been carrying ${isGold ? 'a gold egg' : 'an egg'} since last round — ${pr.sub} make${pr.sub==='they'?'':'s'} a break for the extraction zone.`, points: 0, phase: 4, contextOnly: true }, tribeName));
      }

      if (carried.type === 'empty') {
        const text = _pickRand(_pickRand(EMPTY_ENCOUNTERS).text)(name, pr);
        timeline.push(tag({ player: name, type: 'empty-egg', text, points: 0, phase: 4 }, tribeName));
        playerState[name].carrying = null;
        carried.delivered = true;
      } else {
        const isGold = carried.type === 'gold';
        const text = _pickRand(_pickRand(DELIVERY_ENCOUNTERS).text)(name, pr);
        const evType = isGold ? 'gold-delivery' : 'delivery';
        timeline.push(tag({ player: name, type: evType, text, points: isGold ? 2 : 1, eggType: isGold ? 'gold' : 'normal', phase: 4 }, tribeName));
        playerState[name].carrying = null;
        carried.delivered = true;
      }
    }
  }

  const eggTypes = new Set(['search', 'trap', 'gold-found', 'empty-egg', 'delivery', 'gold-delivery', 'carry-context']);
  return { events: timeline.filter(e => !eggTypes.has(e.type)), eggEvents: timeline.filter(e => eggTypes.has(e.type)) };
}

// ══════════════════════════════════════════════════════════════════════
// MAIN SIMULATION
// ══════════════════════════════════════════════════════════════════════

export function simulateAlienEgg(ep) {
  const active = [...gs.activePlayers];
  const isMerged = gs.isMerged;
  // Scale rounds to cast: 4-5 for small casts (6-8), 5-6 for medium (9-14), 6-7 for large (15+)
  const totalRounds = active.length <= 8 ? 4 : active.length <= 14 ? Math.min(6, Math.max(5, Math.ceil(active.length * 0.4))) : Math.min(7, Math.ceil(active.length * 0.35));
  const minSurvivors = isMerged ? 1 : 0;

  const chrisOpener = _pick(CHRIS_OPENERS, ep.num);
  const chrisCloser = _pick(CHRIS_CLOSERS, ep.num);

  // Build tribe map (pre-merge: restricts interactions to same tribe)
  const tribeMap = {};
  if (!isMerged && gs.tribes) {
    for (const tribe of gs.tribes) {
      for (const m of tribe.members) {
        if (active.includes(m)) tribeMap[m] = tribe;
      }
    }
  }

  const eggs = _generateEggs(active.length);
  const scores = {};
  active.forEach(p => { scores[p] = 0; });
  const bankedEggs = {};
  active.forEach(p => { bankedEggs[p] = 0; });
  const slimedOrder = [];
  const rounds = [];
  let survivors = [...active];
  const usedLocations = [];
  const actBreaks = [];

  // Player state: carrying egg, group, fatigue, sabotage tracking
  const playerState = {};
  active.forEach(p => {
    playerState[p] = { carrying: null, group: null, fatigue: 0, sabotagedBy: null, catchBoost: 0 };
  });

  // Initial group formation (same tribe only, bond-driven — ~40-60% of players pair up)
  const grouped = new Set();
  const groups = [];
  for (const name of active) {
    if (grouped.has(name)) continue;
    const sameTeam = isMerged
      ? active.filter(p => p !== name && !grouped.has(p))
      : active.filter(p => p !== name && !grouped.has(p) && tribeMap[p]?.name === tribeMap[name]?.name);
    if (!sameTeam.length) continue;
    // Sort by bond (highest first), but allow pairing even at bond 0 (strangers sticking together out of fear)
    const sorted = sameTeam.sort((a, b) => getBond(name, b) - getBond(name, a));
    const topBond = getBond(name, sorted[0]);
    // Higher bond = higher chance of grouping. Even at bond 0, ~40% chance (scared strangers)
    const groupChance = Math.min(0.85, 0.4 + topBond * 0.1);
    if (Math.random() < groupChance) {
      const partner = sorted[0];
      const grp = [name, partner];
      // Chance of a third member if bond is decent
      if (sorted.length > 1 && getBond(name, sorted[1]) >= 1 && Math.random() < 0.25) {
        grp.push(sorted[1]);
      }
      groups.push(grp);
      grp.forEach(p => { grouped.add(p); playerState[p].group = grp; });
    }
  }

  for (let r = 0; r < totalRounds && survivors.length > minSurvivors; r++) {
    const mamaLevel = _getMamaLevel(r, totalRounds);
    const mama = _getMamaData(mamaLevel);
    const location = _pickLocation(usedLocations);
    usedLocations.push(location.id);
    if (usedLocations.length >= LOCATIONS.length) usedLocations.length = 0;

    const act = mamaLevel <= 2 ? 'act1' : mamaLevel <= 3 ? 'act2' : 'act3';
    const chrisLine = _pick(CHRIS_COMMENTARY[act], r + ep.num);

    const environmentalEvents = [];
    const envPool = ENVIRONMENTAL_EVENTS.filter(e => mamaLevel >= (e.minLevel || 1));
    const envCount = mamaLevel <= 2 ? 1 : 2;
    for (let i = 0; i < envCount && envPool.length; i++) {
      const env = envPool.splice(Math.floor(Math.random() * envPool.length), 1)[0];
      environmentalEvents.push({ id: env.id, type: env.type, text: _pickRand(env.text)() });
    }

    // Build chronological timeline for this round
    const { events: roundEvents, eggEvents } = _buildRoundTimeline(survivors, mamaLevel, location, eggs, playerState, tribeMap, isMerged);

    // Apply gameplay consequences from timeline events
    for (const ev of [...roundEvents, ...eggEvents]) {
      const name = ev.player;
      if (!name) continue;

      if (ev.negative && ev.target) {
        scores[ev.target] = (scores[ev.target] || 0) + ev.points;
      } else {
        scores[name] = (scores[name] || 0) + ev.points;
      }

      if (ev.type === 'heroic' && ev.target) addBond(name, ev.target, 2);
      if (ev.type === 'sabotage' && ev.target) {
        addBond(name, ev.target, -2);
        playerState[ev.target].sabotagedBy = name;
        playerState[ev.target].catchBoost += ev.catchBoost || 0;
        if (!gs._alienEggHeat) gs._alienEggHeat = {};
        gs._alienEggHeat[name] = { target: ev.target, amount: (gs._alienEggHeat[name]?.amount || 0) + (ev.heat || 1), expiresEp: (gs.episode || 0) + 3 };
      }
      if (ev.type === 'confrontation' && ev.target) addBond(name, ev.target, -1);
      if (ev.type === 'alliance' && ev.target) {
        if (ev.id === 'alliance-break') addBond(name, ev.target, -2);
        else addBond(name, ev.target, 1);
      }
      if (ev.type === 'group' && ev.target) {
        if (ev.id === 'group-abandon') addBond(name, ev.target, -2);
        else if (ev.id === 'group-form') addBond(name, ev.target, 1);
      }
      if (!gs.popularity) gs.popularity = {};
      if (ev.type === 'heroic') gs.popularity[name] = (gs.popularity[name] || 0) + 2;
      if (ev.type === 'sabotage') gs.popularity[name] = (gs.popularity[name] || 0) - 1;

      // Track deliveries in bankedEggs
      if (ev.type === 'delivery') { bankedEggs[name] = (bankedEggs[name] || 0) + 1; scores[name] = (scores[name] || 0) + 2; }
      if (ev.type === 'gold-delivery') { bankedEggs[name] = (bankedEggs[name] || 0) + 2; scores[name] = (scores[name] || 0) + 4; }
      if (ev.type === 'trap') scores[name] = (scores[name] || 0) - 2;
    }

    // Fatigue + survival bonus
    for (const name of survivors) {
      playerState[name].fatigue += 0.03 + [...roundEvents, ...eggEvents].filter(e => e.player === name).length * 0.02;
      scores[name] = (scores[name] || 0) + 1;
    }

    // Showmance moments
    if (seasonConfig.romance) {
      for (const sm of (gs.showmances || [])) {
        if (sm.pair && survivors.includes(sm.pair[0]) && survivors.includes(sm.pair[1])) {
          if (Math.random() < 0.3) {
            const [a, b] = sm.pair;
            const pool = SHOWMANCE_ENCOUNTERS;
            if (pool.length) {
              const tmpl = _pickRand(pool);
              const text = _pickRand(tmpl.text)(a, pronouns(a), b);
              roundEvents.push({ player: a, type: 'showmance', id: tmpl.id, text, points: tmpl.basePoints, target: b, tribe: tribeMap[a]?.name || null });
              addBond(a, b, 1);
            }
          }
          _checkShowmanceChalMoment(sm.pair[0], sm.pair[1], ep);
        }
      }
    }

    // ── Trap eliminations (booby traps kill on contact) ──
    const slimes = [];
    for (const name of [...survivors]) {
      if (playerState[name]?.trapEliminated) {
        const slimeSeq = { tier: 'comedy', approach: '', hit: '', reaction: '', aftermath: `${name} sits on the slime bench, still dripping from the trap. "I didn't even see Chef."` };
        slimes.push({ name, slimeSequence: slimeSeq, eggDestroyed: true, eggsBanked: bankedEggs[name] || 0, round: r + 1, trapKill: true });
        survivors = survivors.filter(p => p !== name);
        slimedOrder.push(name);
        for (const grp of groups) { const idx = grp.indexOf(name); if (idx !== -1) grp.splice(idx, 1); }
        playerState[name].trapEliminated = false;
      }
    }

    // ── Chef slime resolution (independent of trap kills — both stack) ──
    // Scale slime count to survivors remaining — clear ~2-4 per round so the challenge resolves
    const survivorPressure = Math.max(0, Math.floor(survivors.length / 5));
    const slimesThisRound = r === 0 ? 0
      : mamaLevel <= 1 ? Math.max(1, survivorPressure)
      : mamaLevel === 2 ? Math.max(2, survivorPressure)
      : mamaLevel === 3 ? Math.max(2, survivorPressure + 1)
      : Math.max(3, survivorPressure + 1);

    for (let ci = 0; ci < slimesThisRound && survivors.length > minSurvivors; ci++) {
      const hitScores = {};
      for (const name of survivors) {
        const s = pStats(name);
        let score = mama.baseHit;
        if (playerState[name].carrying) score += mama.targetBonus + 0.1;
        if (playerState[name].carrying?.type === 'gold') score += 0.1;
        if (!playerState[name].group || playerState[name].group.length <= 1) score += 0.05;
        if (bankedEggs[name] >= 2) score += 0.05;
        score += (playerState[name].catchBoost || 0) + (playerState[name].fatigue || 0);
        score -= ((s.physical || 5) * 0.02 + (s.mental || 5) * 0.015 + (s.endurance || 5) * 0.01);
        score += Math.random() * 0.25;
        hitScores[name] = score;
      }

      const sorted = [...survivors].sort((a, b) => hitScores[b] - hitScores[a]);
      let target = sorted[0];

      if (ci === 0 && mamaLevel < 5) {
        const ts = pStats(target);
        const escapeChance = (ts.physical >= 7 ? ts.physical * 0.07 : ts.mental >= 7 ? ts.mental * 0.05 : 0);
        if (escapeChance > 0 && Math.random() < escapeChance) {
          scores[target] = (scores[target] || 0) + 3;
          target = sorted[1] || null;
        }
      }

      if (target) {
        const slimeSeq = _buildSlimeSequence(target, mamaLevel);
        const carriedEgg = playerState[target].carrying;
        if (carriedEgg) { carriedEgg.destroyed = true; playerState[target].carrying = null; }
        slimes.push({ name: target, slimeSequence: slimeSeq, eggDestroyed: !!carriedEgg, eggsBanked: bankedEggs[target] || 0, round: r + 1 });
        survivors = survivors.filter(p => p !== target);
        slimedOrder.push(target);
        for (const grp of groups) { const idx = grp.indexOf(target); if (idx !== -1) grp.splice(idx, 1); }
      }
    }

    if (slimedOrder.length >= 1 && slimedOrder.length <= 2 && !actBreaks.includes(r)) actBreaks.push(r);
    if (survivors.length <= 4 && !actBreaks.some(a => a > 0)) actBreaks.push(r);

    for (const name of survivors) {
      const grp = playerState[name].group;
      if (grp && grp.filter(p => survivors.includes(p)).length <= 1) playerState[name].group = null;
      if (!playerState[name].group && Math.random() < 0.15) {
        const nearby = survivors.filter(p => p !== name && !playerState[p].group && getBond(name, p) >= 1
          && (isMerged || !tribeMap[name] || tribeMap[p]?.name === tribeMap[name]?.name));
        if (nearby.length) {
          const partner = _pickRand(nearby);
          const newGrp = [name, partner];
          groups.push(newGrp);
          playerState[name].group = newGrp;
          playerState[partner].group = newGrp;
        }
      }
    }

    rounds.push({
      roundNum: r + 1, mamaLevel, mamaName: MAMA_LEVELS[mamaLevel - 1].name,
      location: location.name, locationId: location.id,
      environmentalEvents, events: roundEvents, eggEvents,
      slimes, survivors: [...survivors], chrisLine,
      bankedSnapshot: { ...bankedEggs },
      eggsRemaining: eggs.filter(e => !e.found && !e.destroyed).length,
    });
  }

  // ── Results ──
  let immunityWinner = null;
  if (isMerged) {
    // Most eggs banked wins
    const sorted = survivors.sort((a, b) => (bankedEggs[b] || 0) - (bankedEggs[a] || 0));
    if (sorted.length > 0) {
      const topScore = bankedEggs[sorted[0]] || 0;
      const winners = sorted.filter(p => (bankedEggs[p] || 0) === topScore);
      immunityWinner = winners.length === 1 ? winners[0] : winners[0]; // tiebreak by score
      if (winners.length > 1) {
        const tiebreak = winners.sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
        immunityWinner = tiebreak[0];
      }
    }
    // If nobody survived but some banked eggs, most eggs wins
    if (!immunityWinner || bankedEggs[immunityWinner] === 0) {
      const allSorted = active.sort((a, b) => (bankedEggs[b] || 0) - (bankedEggs[a] || 0));
      if ((bankedEggs[allSorted[0]] || 0) > 0) immunityWinner = allSorted[0];
    }
    ep.immunityWinner = immunityWinner;
    ep.challengeType = 'alien-egg';
  } else {
    // Pre-merge: tribe with most total eggs delivered
    const tribeScores = {};
    for (const tribe of gs.tribes) {
      const members = tribe.members.filter(m => active.includes(m));
      if (!members.length) continue;
      let total = 0;
      for (const m of members) total += bankedEggs[m] || 0;
      tribeScores[tribe.name] = total;
    }
    const sortedTribes = Object.entries(tribeScores).sort(([, a], [, b]) => b - a);
    if (sortedTribes.length > 0) {
      const winnerTribe = gs.tribes.find(t => t.name === sortedTribes[0][0]);
      const loserTribe = gs.tribes.find(t => t.name === sortedTribes[sortedTribes.length - 1][0]);
      ep.winner = winnerTribe;
      ep.loser = loserTribe;
      ep.safeTribes = gs.tribes.filter(t => t !== loserTribe && t !== winnerTribe);
      ep.challengePlacements = sortedTribes.map(([name]) => {
        const t = gs.tribes.find(tr => tr.name === name);
        return { name, members: [...(t?.members || [])] };
      });
      ep.tribalPlayers = [...(loserTribe?.members || [])];
    }
    ep.challengeType = 'alien-egg';
  }

  // Challenge scores
  // Challenge score = eggs delivered * 10 + survival/event points (eggs dominate ranking)
  const chalMemberScores = {};
  active.forEach(name => { chalMemberScores[name] = (bankedEggs[name] || 0) * 10 + (scores[name] || 0); });
  ep.chalMemberScores = chalMemberScores;

  // Popularity
  if (!gs.popularity) gs.popularity = {};
  if (isMerged && immunityWinner) gs.popularity[immunityWinner] = (gs.popularity[immunityWinner] || 0) + 3;

  // Leaderboard
  const leaderboard = active.map(name => ({
    name, score: scores[name] || 0,
    eggsDelivered: bankedEggs[name] || 0,
    slimedRound: slimedOrder.indexOf(name) === -1 ? null : rounds.find(rd => rd.slimes.some(s => s.name === name))?.roundNum || null,
    events: rounds.flatMap(rd => [...rd.events, ...rd.eggEvents].filter(e => e.player === name)),
  })).sort((a, b) => (b.eggsDelivered - a.eggsDelivered) || (b.score - a.score));

  const tribeScoresForEp = !isMerged ? (() => {
    const ts = {};
    for (const tribe of gs.tribes) {
      const members = tribe.members.filter(m => active.includes(m));
      if (!members.length) continue;
      let total = 0;
      for (const m of members) total += bankedEggs[m] || 0;
      ts[tribe.name] = { total, members: [...members] };
    }
    return ts;
  })() : null;

  // Camp events with badges
  const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes[0]?.name || 'merge');
  if (!gs.campEvents) gs.campEvents = {};
  if (!gs.campEvents[campKey]) gs.campEvents[campKey] = [];

  if (immunityWinner) {
    gs.campEvents[campKey].push({
      text: `${immunityWinner} delivered the most alien eggs and wins immunity in the Alien Resurr-eggtion challenge!`,
      players: [immunityWinner], badgeText: 'EGG CHAMPION', badgeClass: 'gold'
    });
  }
  for (const entry of leaderboard) {
    if (entry.eggsDelivered >= 3) {
      gs.campEvents[campKey].push({
        text: `${entry.name} delivered ${entry.eggsDelivered} eggs — a dominant performance in the egg hunt.`,
        players: [entry.name], badgeText: 'TOP COLLECTOR', badgeClass: 'gold'
      });
    }
  }
  for (const sl of slimedOrder) {
    const slimeData = rounds.flatMap(rd => rd.slimes).find(s => s.name === sl);
    if (slimeData && slimeData.round <= 2) {
      gs.campEvents[campKey].push({
        text: `${sl} was slimed early in Round ${slimeData.round} — an easy target for Mama Alien.`,
        players: [sl], badgeText: 'FIRST SLIMED', badgeClass: 'red'
      });
    }
  }
  const heroicPlayers = rounds.flatMap(rd => rd.events).filter(e => e.type === 'heroic').map(e => e.player);
  for (const hp of [...new Set(heroicPlayers)]) {
    gs.campEvents[campKey].push({
      text: `${hp} put ${pronouns(hp).ref} in danger to protect others during the alien egg hunt.`,
      players: [hp], badgeText: 'HEROIC', badgeClass: 'gold'
    });
  }
  const sabotagePlayers = rounds.flatMap(rd => rd.events).filter(e => e.type === 'sabotage').map(e => e.player);
  for (const sp of [...new Set(sabotagePlayers)]) {
    gs.campEvents[campKey].push({
      text: `${sp} sabotaged other players during the egg hunt — and people noticed.`,
      players: [sp], badgeText: 'SABOTEUR', badgeClass: 'red'
    });
  }

  // Per-step state snapshots for live sidebar updates
  const stepStates = [];

  ep.alienEgg = {
    rounds, scores, bankedEggs, slimedOrder, immunityWinner,
    leaderboard, eggs,
    chrisOpener, chrisCloser, actBreaks,
    tribeScores: tribeScoresForEp,
    groups: groups.map(g => [...g]),
    allPlayers: [...active],
    stepStates,
  };

  if (isMerged) { ep.immunityWinner = immunityWinner; }
}

// ══════════════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════════════

export function _textAlienEgg(ep, ln, sec) {
  const ae = ep.alienEgg;
  if (!ae) return;
  const totalSlimed = ae.slimedOrder.length;
  const totalEggs = Object.values(ae.bankedEggs).reduce((s, v) => s + v, 0);

  ln(`Chris explains the challenge: retrieve alien eggs from the sci-fi set and deliver them to the extraction zone — without getting slimed by Chef's paintball gun.`);
  sec();

  for (const round of ae.rounds) {
    ln(`Round ${round.roundNum} — ${round.location}. Mama Alien threat level: ${round.mamaName}.`);

    for (const env of round.environmentalEvents) {
      ln(env.text);
    }

    const highlights = [...round.events, ...round.eggEvents]
      .sort((a, b) => {
        const pri = ['sabotage', 'heroic', 'showmance', 'trap', 'gold-found', 'delivery', 'gold-delivery', 'comedy', 'panic'];
        return (pri.indexOf(a.type) === -1 ? 99 : pri.indexOf(a.type)) - (pri.indexOf(b.type) === -1 ? 99 : pri.indexOf(b.type));
      })
      .slice(0, 5);

    for (const ev of highlights) {
      ln(ev.text);
    }

    for (const sl of round.slimes) {
      const seq = sl.slimeSequence;
      ln(`${seq.approach} ${seq.hit}`);
      ln(`${sl.name} is eliminated from the challenge.${sl.eggDestroyed ? ' Their egg is destroyed.' : ''}`);
    }

    ln(round.chrisLine);
    sec();
  }

  if (ae.immunityWinner) {
    ln(`${ae.immunityWinner} wins immunity with ${ae.bankedEggs[ae.immunityWinner] || 0} eggs delivered!`);
  }
  ln(ae.chrisCloser);
  sec();
}

// ══════════════════════════════════════════════════════════════════════
// VP SCREENS
// ══════════════════════════════════════════════════════════════════════

function _aePortrait(name, size = 40) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;" onerror="this.style.display='none'">`;
}

function _aeShell(content, ep) {
  return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
.ae-shell{font-family:'Share Tech Mono',monospace;color:#4aff4a;background:#060d0a;padding:16px;max-width:1100px;margin:0 auto;position:relative}
.ae-shell::before{content:'';position:fixed;top:0;left:0;right:0;bottom:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,0,.012) 2px,rgba(0,255,0,.012) 4px);pointer-events:none;z-index:1000}
.ae-header{border:1px solid #4aff4a33;background:linear-gradient(180deg,#0d1a12,#060d0a);padding:16px 20px;margin-bottom:12px;position:relative}
.ae-header::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#4aff4a,transparent);animation:ae-scan 3s linear infinite}
@keyframes ae-scan{0%{opacity:.3}50%{opacity:1}100%{opacity:.3}}
.ae-title{font-family:'Orbitron',sans-serif;font-size:22px;font-weight:900;letter-spacing:4px;color:#4aff4a;text-shadow:0 0 15px #4aff4a44}
.ae-subtitle{font-size:10px;color:#4aff4a55;margin-top:4px;letter-spacing:2px}
.ae-corner{position:absolute;width:12px;height:12px;border-color:#4aff4a44;border-style:solid}
.ae-corner.tl{top:4px;left:4px;border-width:2px 0 0 2px}.ae-corner.tr{top:4px;right:4px;border-width:2px 2px 0 0}
.ae-corner.bl{bottom:4px;left:4px;border-width:0 0 2px 2px}.ae-corner.br{bottom:4px;right:4px;border-width:0 2px 2px 0}
.ae-layout{display:flex;gap:14px;align-items:flex-start}
.ae-feed{flex:1;min-width:0}
.ae-sidebar{width:260px;flex-shrink:0;position:sticky;top:12px;max-height:calc(100vh - 24px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:#4aff4a22 transparent}
.ae-sec{font-family:'Orbitron',sans-serif;font-size:9px;letter-spacing:3px;color:#4aff4a44;border-bottom:1px solid #4aff4a10;padding-bottom:3px;margin:14px 0 8px;text-transform:uppercase}
.ae-hud{display:flex;gap:2px;margin-bottom:12px}
.ae-hud-cell{flex:1;background:#0a1610;border:1px solid #4aff4a15;padding:8px 4px;text-align:center}
.ae-hud-cell:first-child{border-radius:4px 0 0 4px}.ae-hud-cell:last-child{border-radius:0 4px 4px 0}
.ae-hud-val{font-family:'Orbitron',sans-serif;font-size:18px;font-weight:700;text-shadow:0 0 8px currentColor}
.ae-hud-lbl{font-size:7px;letter-spacing:2px;color:#4aff4a44;margin-top:2px}
.ae-round{background:#0a1610;border:1px solid #4aff4a18;padding:8px 14px;display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;border-radius:2px}
.ae-cam{display:flex;align-items:center;gap:6px}
.ae-cam-dot{width:6px;height:6px;border-radius:50%;background:#ff4a4a;box-shadow:0 0 4px #ff4a4a;animation:ae-blink-red 1s ease-in-out infinite}
@keyframes ae-blink-red{0%,100%{opacity:.5}50%{opacity:1}}
.ae-cam-txt{font-family:'Orbitron',sans-serif;font-size:10px;letter-spacing:2px;color:#4aff4a77}
.ae-round-info{font-size:10px;color:#4aff4a44}
.ae-ev{background:#0a1610;border:1px solid #4aff4a12;border-left:3px solid #4aff4a33;padding:12px 14px;margin-bottom:5px;display:flex;align-items:flex-start;gap:12px;border-radius:2px;position:relative}
.ae-ev::before{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(90deg,var(--glow,#4aff4a05),transparent);pointer-events:none}
.ae-ev-port{width:44px;height:44px;border-radius:50%;border:1px solid var(--accent,#4aff4a33);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#4aff4a0a}
.ae-ev-port img{width:44px;height:44px;border-radius:50%;object-fit:cover}
.ae-ev-body{flex:1;min-width:0}
.ae-ev-badge{display:inline-block;font-family:'Orbitron',sans-serif;font-size:7px;letter-spacing:2px;padding:2px 6px;border-radius:2px;margin-bottom:4px}
.ae-ev-text{font-size:13px;line-height:1.7;color:#b8ccb8}
.ae-ev-impact{font-family:'Orbitron',sans-serif;font-size:9px;margin-top:5px;letter-spacing:1px;color:var(--accent,#4aff4a88)}
.ae-ev.survival{border-left-color:#4aff4a55;--accent:#4aff4a;--glow:#4aff4a05}.ae-ev.survival .ae-ev-badge{background:#4aff4a15;color:#4aff4a}
.ae-ev.evasion{border-left-color:#4aff4a55;--accent:#4aff4a;--glow:#4aff4a05}.ae-ev.evasion .ae-ev-badge{background:#4aff4a15;color:#4aff4a}
.ae-ev.heroic{border-left-color:#29b6f6;--accent:#29b6f6;--glow:#29b6f605}.ae-ev.heroic .ae-ev-badge{background:#29b6f615;color:#29b6f6}
.ae-ev.sabotage{border-left-color:#ff4a4a;--accent:#ff4a4a;--glow:#ff4a4a05}.ae-ev.sabotage .ae-ev-badge{background:#ff4a4a15;color:#ff4a4a}
.ae-ev.comedy{border-left-color:#ffd74a;--accent:#ffd74a;--glow:#ffd74a05}.ae-ev.comedy .ae-ev-badge{background:#ffd74a15;color:#ffd74a}
.ae-ev.showmance{border-left-color:#f06292;--accent:#f06292;--glow:#f0629205}.ae-ev.showmance .ae-ev-badge{background:#f0629215;color:#f06292}
.ae-ev.alliance{border-left-color:#ab47bc;--accent:#ab47bc;--glow:#ab47bc05}.ae-ev.alliance .ae-ev-badge{background:#ab47bc15;color:#ab47bc}
.ae-ev.confrontation{border-left-color:#ff7043;--accent:#ff7043;--glow:#ff704305}.ae-ev.confrontation .ae-ev-badge{background:#ff704315;color:#ff7043}
.ae-ev.group{border-left-color:#66bb6a;--accent:#66bb6a;--glow:#66bb6a05}.ae-ev.group .ae-ev-badge{background:#66bb6a15;color:#66bb6a}
.ae-ev.panic{border-left-color:#ff8a65;--accent:#ff8a65;--glow:#ff8a6505}.ae-ev.panic .ae-ev-badge{background:#ff8a6515;color:#ff8a65}
.ae-ev.search{border-left-color:#ffd74a;--accent:#ffd74a;--glow:#ffd74a05}.ae-ev.search .ae-ev-badge{background:#ffd74a15;color:#ffd74a}
.ae-ev.environmental{border-left-color:#4aff4a22;--accent:#4aff4a66}.ae-ev.environmental .ae-ev-badge{background:#4aff4a10;color:#4aff4a66}
.ae-delivery{background:#0a1610;border:1px solid #ffd74a22;border-left:3px solid #4aff4a;padding:12px 14px;margin-bottom:5px;display:flex;align-items:center;gap:12px;border-radius:2px}
.ae-delivery-icon{font-size:28px;flex-shrink:0}
.ae-delivery-lbl{font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:2px;color:#4aff4a;margin-bottom:3px}
.ae-delivery-txt{font-size:12px;line-height:1.5;color:#b8ccb8}
.ae-trap{background:linear-gradient(135deg,#1a0a0a,#0a1610);border:1px solid #ff4a4a33;border-left:3px solid #ff4a4a;padding:12px 14px;margin-bottom:5px;border-radius:2px}
.ae-trap-lbl{font-family:'Orbitron',sans-serif;font-size:10px;letter-spacing:2px;color:#ff4a4a;margin-bottom:4px}
.ae-trap-txt{font-size:13px;line-height:1.6;color:#b8ccb8}
.ae-slime{position:relative;background:linear-gradient(180deg,#0b2a10,#0a1610 25%);border:2px solid #39ff1444;padding:20px 16px 14px;margin-bottom:5px;overflow:hidden;border-radius:3px}
.ae-slime-pool{position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(180deg,#39ff14aa,#39ff1433);z-index:3}
.ae-slime-drips{position:absolute;top:0;left:0;right:0;height:70px;pointer-events:none;z-index:2}
.ae-drip{position:absolute;top:-2px;width:var(--w,14px);background:linear-gradient(180deg,#39ff14bb,#39ff1466,transparent);border-radius:0 0 50% 50%;animation:ae-drip var(--dur,4s) ease-in infinite;animation-delay:var(--delay,0s);opacity:.8}
@keyframes ae-drip{0%{height:var(--h1,25px)}60%{height:var(--h2,55px)}80%{height:var(--h2,55px)}100%{height:var(--h1,25px)}}
.ae-splat{position:absolute;border-radius:50%;background:radial-gradient(ellipse,#39ff1433,#39ff1418,transparent 70%);pointer-events:none;z-index:1}
.ae-slime-content{position:relative;z-index:5}
.ae-slime-hdr{display:flex;align-items:center;gap:14px;margin-bottom:10px}
.ae-slime-port{width:52px;height:52px;border-radius:50%;background:#39ff1412;border:2px solid #39ff14;display:flex;align-items:center;justify-content:center;box-shadow:0 0 15px #39ff1433;overflow:hidden;position:relative}
.ae-slime-port img{width:52px;height:52px;border-radius:50%;object-fit:cover;filter:brightness(.7) saturate(.5)}
.ae-slime-port .ae-pdrip{position:absolute;width:3px;background:linear-gradient(180deg,#39ff14aa,transparent);border-radius:0 0 50% 50%}
.ae-slime-port .pd1{bottom:-10px;left:10px;height:10px}.ae-slime-port .pd2{bottom:-16px;left:24px;height:16px}.ae-slime-port .pd3{bottom:-7px;right:12px;height:7px}
.ae-slime-lbl{font-family:'Orbitron',sans-serif;font-size:14px;font-weight:900;letter-spacing:3px;color:#39ff14;text-shadow:0 0 12px #39ff1444}
.ae-slime-sub{font-size:9px;color:#39ff1477;letter-spacing:1px;margin-top:2px}
.ae-slime-approach{font-size:12px;line-height:1.7;color:#6a886a;padding:6px 12px;border-left:2px solid #39ff1433;margin-bottom:8px;background:#39ff1404}
.ae-slime-text{font-size:13px;line-height:1.7;color:#b8ccb8;margin-bottom:6px}
.ae-slime-after{font-size:11px;line-height:1.5;color:#5a785a;font-style:italic;padding-top:6px;border-top:1px solid #39ff1415}
.ae-chris{font-size:11px;font-style:italic;color:#666;padding:4px 10px;border-left:2px solid #66666633;margin:6px 0;line-height:1.5}
.ae-escalation{background:linear-gradient(90deg,#ff4a4a08,#ff4a4a15,#ff4a4a08);border:1px solid #ff4a4a22;padding:8px 14px;text-align:center;margin:10px 0 6px;border-radius:2px}
.ae-escalation-txt{font-family:'Orbitron',sans-serif;font-size:10px;letter-spacing:3px;color:#ff4a4a}
.ae-escalation-sub{font-size:9px;color:#ff4a4a66;margin-top:2px}
.ae-crew{background:#0a1610;border:1px solid #4aff4a12;padding:6px 8px;display:flex;align-items:center;gap:6px;font-size:10px;margin-bottom:3px;border-radius:2px;position:relative;transition:all .4s}
.ae-crew img{width:24px;height:24px;border-radius:50%;object-fit:cover;flex-shrink:0}
.ae-crew-info{flex:1;min-width:0}
.ae-crew-name{color:#4aff4acc;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ae-crew-eggs{font-size:8px;color:#ffd74a66;margin-top:1px}
.ae-crew-badge{font-family:'Orbitron',sans-serif;font-size:6px;letter-spacing:1px;padding:1px 4px;border-radius:2px;flex-shrink:0}
.ae-badge-active{background:#4aff4a10;color:#4aff4a66}
.ae-badge-carrying{background:#ffd74a15;color:#ffd74a}
.ae-badge-slimed{background:#39ff1420;color:#39ff14}
.ae-crew.slimed{border-color:#39ff1425;overflow:hidden}
.ae-crew.slimed::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(135deg,#39ff140d,transparent 60%);pointer-events:none}
.ae-crew.slimed .ae-crew-name{color:#39ff1466;text-decoration:line-through}
.ae-crew.slimed img{filter:brightness(.5) saturate(.3)}
.ae-spec-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:3px}
.ae-spec{background:#0a1610;border:1px solid #4aff4a10;padding:5px 2px;text-align:center;border-radius:2px;transition:all .4s}
.ae-spec-icon{font-size:14px}.ae-spec-lbl{font-size:6px;letter-spacing:1px;color:#4aff4a44;margin-top:2px}
.ae-spec.banked{border-color:#4aff4a22;background:#4aff4a06}.ae-spec.banked .ae-spec-lbl{color:#4aff4a88}
.ae-spec.gold{border-color:#ffd74a18}.ae-spec.gold .ae-spec-lbl{color:#ffd74a88}
.ae-spec.trap{border-color:#ff4a4a18}.ae-spec.trap .ae-spec-lbl{color:#ff4a4a}
.ae-spec.dud{opacity:.3}
.ae-spec.destroyed{border-color:#39ff1422;background:#39ff1408}.ae-spec.destroyed .ae-spec-lbl{color:#39ff14}
.ae-radar{width:100%;aspect-ratio:1;max-width:230px;margin:0 auto 8px;position:relative;border-radius:50%;border:1px solid #4aff4a22;background:radial-gradient(circle,#0d1a1200,#060d0a 80%);overflow:hidden}
.ae-radar .ring{position:absolute;border-radius:50%;border:1px solid #4aff4a0d;top:50%;left:50%;transform:translate(-50%,-50%)}
.ae-radar .r1{width:33%;height:33%}.ae-radar .r2{width:66%;height:66%}
.ae-radar .cross{position:absolute;background:#4aff4a08}
.ae-radar .cross-h{top:50%;left:0;width:100%;height:1px}.ae-radar .cross-v{left:50%;top:0;width:1px;height:100%}
.ae-radar .sweep{position:absolute;top:50%;left:50%;width:50%;height:2px;transform-origin:left center;background:linear-gradient(90deg,#4aff4a88,transparent);animation:ae-sweep 4s linear infinite;box-shadow:0 0 12px 4px #4aff4a18}
@keyframes ae-sweep{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.ae-radar .blip{position:absolute;width:4px;height:4px;border-radius:50%;background:#4aff4a;box-shadow:0 0 4px #4aff4a;animation:ae-blink 2s ease-in-out infinite}
.ae-radar .blip-chef{width:8px;height:8px;background:#ff4a4a;box-shadow:0 0 8px #ff4a4a;animation:ae-blink-red 1s ease-in-out infinite}
.ae-radar .blip-carry{background:#ffd74a;box-shadow:0 0 4px #ffd74a}
@keyframes ae-blink{0%,100%{opacity:.3}50%{opacity:1}}
.ae-tracker-tag{font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:2px;color:#ff4a4a88;text-align:center;animation:ae-alert 1.5s ease-in-out infinite}
@keyframes ae-alert{0%,100%{opacity:.4}50%{opacity:1}}
.ae-controls{position:sticky;bottom:0;background:#060d0aee;border-top:1px solid #4aff4a18;padding:10px;text-align:center;backdrop-filter:blur(8px);margin-top:12px;z-index:10}
.ae-btn-next{padding:10px 28px;background:#39ff14;color:#060d0a;border:none;border-radius:3px;cursor:pointer;font-family:'Orbitron',sans-serif;font-weight:700;font-size:12px;letter-spacing:2px;box-shadow:0 0 16px #39ff1433}
.ae-btn-all{padding:6px 14px;background:transparent;color:#4aff4a44;border:1px solid #4aff4a18;border-radius:3px;cursor:pointer;font-size:10px;margin-left:8px}
</style>
<div class="ae-shell">
  <div class="ae-header">
    <div class="ae-corner tl"></div><div class="ae-corner tr"></div><div class="ae-corner bl"></div><div class="ae-corner br"></div>
    <div class="ae-title">👽 ALIEN RESURR-EGGTION</div>
    <div class="ae-subtitle">FILM LOT — SCI-FI SET // MAMA ALIEN ACTIVE // SPECIMEN RETRIEVAL IN PROGRESS</div>
  </div>
  ${content}
</div>`;
}

// ── Build sidebar HTML from a state snapshot ──
function _aeSidebarFromState(state, ae) {
  const { survivors, slimed, banked, carrying, location, eggsFound, eggsDelivered, eggsDestroyed, eggsTrapFired, groups } = state;

  // Radar blips
  const blips = [];
  for (let i = 0; i < survivors.length; i++) {
    const angle = (i / Math.max(survivors.length, 1)) * 2 * Math.PI + 0.5;
    const r = 25 + ((i * 37 + 13) % 20);
    const x = 50 + r * Math.cos(angle);
    const y = 50 + r * Math.sin(angle);
    const isCarrying = carrying.includes(survivors[i]);
    const cls = isCarrying ? 'blip blip-carry' : 'blip';
    blips.push(`<div class="${cls}" style="top:${y.toFixed(0)}%;left:${x.toFixed(0)}%"></div>`);
  }
  blips.push(`<div style="position:absolute;width:8px;height:8px;border-radius:50%;background:#ff4a4a;box-shadow:0 0 8px #ff4a4a;top:47%;left:48%;animation:ae-blink-red 1s ease-in-out infinite"></div>`);

  let html = `
    <div class="ae-sec">MOTION TRACKER</div>
    <div class="ae-radar">
      <div class="ring r1"></div><div class="ring r2"></div>
      <div class="cross cross-h"></div><div class="cross cross-v"></div>
      <div class="sweep"></div>
      ${blips.join('')}
    </div>
    <div class="ae-tracker-tag">⚠ HOSTILE ACTIVE${location ? ' — ' + location.toUpperCase() : ''}</div>
    <div class="ae-sec">CREW BIOSIGNS</div>`;

  // Group by tribe if we have tribe data
  const tribes = ae.tribeScores ? Object.keys(ae.tribeScores) : [];
  const hasTribeData = tribes.length > 0;

  // Build group lookup
  const groupOf = {};
  if (groups) {
    for (const grp of groups) {
      for (const p of grp) { groupOf[p] = grp.filter(g => g !== p && survivors.includes(g)); }
    }
  }

  // Build carrying-type lookup from egg data
  const carryingType = {};
  if (state.carryingTypes) {
    for (const [p, t] of Object.entries(state.carryingTypes)) carryingType[p] = t;
  }

  function renderCrewEntry(name) {
    const eggs = banked[name] || 0;
    const isCarry = carrying.includes(name);
    const partners = groupOf[name] || [];
    const eggType = carryingType[name] || 'normal';
    const eggIcon = eggType === 'gold' ? '🪙' : '🥚';
    let statusStr, badgeCls, badgeTxt;
    if (isCarry) {
      const carryLabel = eggType === 'gold' ? 'carrying GOLD 🪙' : 'carrying egg';
      statusStr = eggs > 0 ? '🥚'.repeat(Math.min(eggs, 5)) + ` ${eggs} banked • ${carryLabel}` : carryLabel;
      badgeCls = 'ae-badge-carrying'; badgeTxt = eggType === 'gold' ? '🪙 GOLD' : 'CARRYING';
    } else {
      statusStr = eggs > 0 ? '🥚'.repeat(Math.min(eggs, 5)) + ` ${eggs} banked` : 'searching...';
      badgeCls = 'ae-badge-active'; badgeTxt = 'ACTIVE';
    }
    const groupTag = partners.length ? `<div style="font-size:7px;color:#66bb6a88;margin-top:1px;">👥 w/ ${partners.join(', ')}</div>` : `<div style="font-size:7px;color:#4aff4a33;margin-top:1px;">solo</div>`;
    return `<div class="ae-crew${isCarry ? ' carrying' : ''}">
      ${_aePortrait(name, 24)}
      <div class="ae-crew-info"><div class="ae-crew-name">${name}</div><div class="ae-crew-eggs">${statusStr}</div>${groupTag}</div>
      <span class="ae-crew-badge ${badgeCls}">${badgeTxt}</span>
    </div>`;
  }

  if (hasTribeData) {
    for (const tribeName of tribes) {
      const tribeData = ae.tribeScores[tribeName];
      const tribeMembers = typeof tribeData === 'object' ? tribeData.members : [];
      const tribeSurvivors = survivors.filter(p => tribeMembers.includes(p));
      if (!tribeSurvivors.length) continue;
      const tribeTotal = tribeSurvivors.reduce((s, p) => s + (banked[p] || 0), 0);
      html += `<div style="font-size:8px;letter-spacing:2px;color:#4aff4a55;margin:6px 0 3px;font-family:'Orbitron',sans-serif;border-bottom:1px solid #4aff4a0a;padding-bottom:2px;">${tribeName.toUpperCase()} — ${tribeTotal} 🥚</div>`;
      for (const name of tribeSurvivors) html += renderCrewEntry(name);
    }
  } else {
    for (const name of survivors) html += renderCrewEntry(name);
  }

  if (slimed.length) {
    html += `<div class="ae-sec" style="color:#39ff1444;border-color:#39ff1415">SLIME BENCH</div>`;
    for (const entry of slimed) {
      html += `<div class="ae-crew slimed">
        ${_aePortrait(entry.name, 24)}
        <div class="ae-crew-info"><div class="ae-crew-name">${entry.name}</div><div class="ae-crew-eggs">R${entry.round} — ${entry.banked} banked</div></div>
        <span class="ae-crew-badge ae-badge-slimed">SLIMED</span>
      </div>`;
    }
  }

  // Specimen grid
  const foundSet = new Set(eggsFound || []);
  const deliveredSet = new Set(eggsDelivered || []);
  const destroyedSet = new Set(eggsDestroyed || []);
  const trapFiredSet = new Set(eggsTrapFired || []);
  html += `<div class="ae-sec">SPECIMEN STATUS</div><div class="ae-spec-grid">`;
  for (let ei = 0; ei < ae.eggs.length; ei++) {
    const egg = ae.eggs[ei];
    let cls = '', icon = '🥚', lbl = 'FIELD';
    if (deliveredSet.has(ei)) {
      if (egg.type === 'gold') { cls = 'gold banked'; icon = '🪙'; lbl = 'GOLD✓'; }
      else if (egg.type === 'empty') { cls = 'dud'; icon = '💨'; lbl = 'EMPTY'; }
      else { cls = 'banked'; lbl = 'BANKED'; }
    } else if (trapFiredSet.has(ei) || (destroyedSet.has(ei) && egg.type === 'trap')) {
      cls = 'trap'; icon = '💀'; lbl = 'TRAP💀';
    } else if (destroyedSet.has(ei)) {
      cls = 'destroyed'; icon = '💔'; lbl = 'LOST';
    } else if (foundSet.has(ei) && egg.type === 'gold') {
      cls = 'gold'; icon = '🪙'; lbl = 'CARRYING';
    } else if (foundSet.has(ei)) {
      lbl = 'CARRYING';
    } else {
      icon = `<span style="opacity:.3">${egg.type === 'gold' ? '🪙' : '🥚'}</span>`;
    }
    html += `<div class="ae-spec ${cls}"><div class="ae-spec-icon">${icon}</div><div class="ae-spec-lbl">${lbl}</div></div>`;
  }
  html += `</div>`;
  return html;
}

// ── Build event card HTML ──
function _aeEventCard(ev) {
  const typeLabels = {
    search: 'SPECIMEN FOUND', evasion: 'EVASION', heroic: 'HEROIC', sabotage: 'SABOTAGE',
    comedy: 'COMEDY', showmance: 'SHOWMANCE', alliance: 'ALLIANCE', confrontation: 'CONFRONTATION',
    group: 'GROUP', panic: 'PANIC', environmental: 'ATMOSPHERE',
  };
  const label = typeLabels[ev.type] || ev.type.toUpperCase();
  const portrait = ev.player ? _aePortrait(ev.player, 44) : '';
  const tribeBadge = ev.tribe ? `<span style="font-family:'Orbitron',sans-serif;font-size:7px;letter-spacing:1px;padding:1px 5px;border-radius:2px;background:#4aff4a10;color:#4aff4a66;margin-left:6px;">${ev.tribe.toUpperCase()}</span>` : '';
  const impactParts = [];
  if (ev.type === 'heroic' && ev.target) {
    impactParts.push(`BOND +2 (${ev.player} → ${ev.target})`);
    impactParts.push('POPULARITY +2');
  } else if (ev.type === 'sabotage' && ev.target) {
    impactParts.push(`BOND −2 (${ev.player} → ${ev.target})`);
    impactParts.push(`CHEF ALERTED TO ${ev.target.toUpperCase()}'S POSITION`);
    if (ev.eggDropped) impactParts.push(`${ev.target.toUpperCase()} DROPS EGG`);
    impactParts.push(`CATCH CHANCE ↑ • HEAT +${ev.heat || 1}`);
  } else if (ev.type === 'confrontation' && ev.target) {
    impactParts.push(`BOND −1 (${ev.player} → ${ev.target})`);
    impactParts.push('RIVALRY');
  } else if (ev.type === 'alliance' && ev.target) {
    if (ev.id === 'alliance-break') impactParts.push(`BOND −2 • ALLIANCE BROKEN`);
    else impactParts.push(`BOND +1 (${ev.player} ↔ ${ev.target})`);
  } else if (ev.type === 'group' && ev.target) {
    if (ev.id === 'group-abandon') impactParts.push(`BOND −2 (${ev.target} → ${ev.player}) • ABANDONED`);
    else if (ev.id === 'group-form') impactParts.push(`BOND +1 • GROUP FORMED`);
    else if (ev.id === 'group-split') impactParts.push('SPLIT UP');
  } else if (ev.type === 'showmance' && ev.target) {
    impactParts.push(`BOND +1 (${ev.player} ↔ ${ev.target})`);
    impactParts.push('SHOWMANCE MOMENT');
  } else if (ev.type === 'evasion') {
    impactParts.push(`+${ev.points || 0} EVASION`);
  } else if (ev.type === 'comedy') {
    if (ev.points < 0) impactParts.push('POSITION COMPROMISED');
  } else if (ev.type === 'panic') {
    impactParts.push('EXPOSED • CATCH CHANCE ↑');
  }
  const impact = impactParts.length ? impactParts.join(' • ') : '';

  return `<div class="ae-ev ${ev.type}">
    <div class="ae-ev-port">${portrait}</div>
    <div class="ae-ev-body">
      <div class="ae-ev-badge">${label}${tribeBadge}</div>
      <div class="ae-ev-text">${ev.text}</div>
      ${impact ? `<div class="ae-ev-impact">${impact}</div>` : ''}
    </div>
  </div>`;
}

// ── Title Card ──
export function rpBuildAlienEggTitleCard(ep) {
  const ae = ep.alienEgg;
  if (!ae) return '';
  return _aeShell(`
    <div style="text-align:center;padding:40px 20px;">
      <div style="font-size:60px;margin-bottom:16px;">👽</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:28px;font-weight:900;letter-spacing:4px;color:#4aff4a;text-shadow:0 0 20px #4aff4a44;margin-bottom:12px;">ALIEN RESURR-EGGTION</div>
      <div style="font-size:13px;color:#4aff4a88;line-height:1.8;max-width:500px;margin:0 auto 20px;">${ae.chrisOpener}</div>
      <div style="display:flex;gap:16px;justify-content:center;font-size:11px;color:#4aff4a66;">
        <span>🥚 ${ae.eggs.length} eggs hidden</span>
        <span>👾 Chef as Mama Alien</span>
        <span>👥 ${ae.leaderboard.length} contestants</span>
      </div>
    </div>
  `, ep);
}

// ── Main Rounds Screen (click-to-reveal) ──
export function rpBuildAlienEggRounds(ep) {
  const ae = ep.alienEgg;
  if (!ae) return '';
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = String(ep.num || 0) + '_ae';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };

  const steps = [];
  // 60-90 events: scales with cast but stays in range
  const targetTotal = Math.max(60, Math.min(90, ae.leaderboard.length * 5));
  const allPlayers = ae.allPlayers || ae.leaderboard.map(e => e.name);

  // Track live state for sidebar snapshots
  const liveState = {
    survivors: [...allPlayers],
    slimed: [],
    banked: {},
    carrying: [],
    location: '',
    eggsFound: [],
    eggsDelivered: [],
    eggsDestroyed: [],
    eggsTrapFired: [],
    groups: [],
    mamaLevel: 1,
    carryingTypes: {},
  };
  allPlayers.forEach(p => { liveState.banked[p] = 0; });

  function snap() {
    return JSON.stringify({
      survivors: [...liveState.survivors],
      slimed: [...liveState.slimed],
      banked: { ...liveState.banked },
      carrying: [...liveState.carrying],
      carryingTypes: { ...liveState.carryingTypes },
      location: liveState.location,
      eggsFound: [...liveState.eggsFound],
      eggsDelivered: [...liveState.eggsDelivered],
      eggsDestroyed: [...liveState.eggsDestroyed],
      eggsTrapFired: [...liveState.eggsTrapFired],
      groups: liveState.groups.map(g => [...g]),
      mamaLevel: liveState.mamaLevel,
    });
  }

  function pushStep(obj) {
    steps.push({ ...obj, stateJson: snap() });
  }

  // Set initial groups
  liveState.groups = (ae.groups || []).map(g => [...g]);

  // ── OPENING NARRATION ──
  pushStep({ html: `<div class="ae-ev environmental"><div class="ae-ev-port" style="font-size:22px;border-color:#4aff4a22;">🎬</div><div class="ae-ev-body"><div class="ae-ev-badge" style="background:#4aff4a15;color:#4aff4a">COLD OPEN</div><div class="ae-ev-text">${ae.chrisOpener}</div></div></div>` });

  // Tribe entries (pre-merge) or full cast (post-merge)
  if (ae.tribeScores) {
    for (const [tribeName, tribeData] of Object.entries(ae.tribeScores)) {
      const members = typeof tribeData === 'object' ? tribeData.members : [];
      if (members.length) {
        const portraits = members.map(m => _aePortrait(m, 32)).join('');
        pushStep({ html: `<div class="ae-ev group"><div class="ae-ev-port" style="font-size:18px;border-color:#66bb6a44;">👥</div><div class="ae-ev-body"><div class="ae-ev-badge" style="background:#66bb6a15;color:#66bb6a">${tribeName.toUpperCase()} ENTERS</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin:6px 0;">${portraits}</div><div class="ae-ev-text">${tribeName} moves into the sci-fi set. ${members.length} players, one mission: find eggs, deliver them, don't get slimed.</div></div></div>` });
      }
    }
  } else {
    const portraits = allPlayers.map(m => _aePortrait(m, 28)).join('');
    pushStep({ html: `<div class="ae-ev group"><div class="ae-ev-port" style="font-size:18px;border-color:#66bb6a44;">👥</div><div class="ae-ev-body"><div class="ae-ev-badge" style="background:#66bb6a15;color:#66bb6a">CONTESTANTS ENTER</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin:6px 0;">${portraits}</div><div class="ae-ev-text">${allPlayers.length} players scatter into the set. Find eggs, deliver them, don't get slimed.</div></div></div>` });
  }

  // Chef entrance
  pushStep({ html: `<div class="ae-ev" style="border-left-color:#ff4a4a;--accent:#ff4a4a;--glow:#ff4a4a08;"><div class="ae-ev-port" style="font-size:22px;border-color:#ff4a4a44;">👾</div><div class="ae-ev-body"><div class="ae-ev-badge" style="background:#ff4a4a15;color:#ff4a4a">MAMA ALIEN DEPLOYED</div><div class="ae-ev-text">Chef emerges from the darkness in full Mama Alien regalia. The rubber suit squeaks. The paintball gun hums. He looks ridiculous. He doesn't care. The hunt begins.</div></div></div>` });

  // Initial groups
  if (ae.groups?.length) {
    const groupDescs = ae.groups.filter(g => g.length >= 2).map(g => g.join(' & ')).join(' • ');
    if (groupDescs) {
      pushStep({ html: `<div class="ae-ev group"><div class="ae-ev-port" style="font-size:16px;border-color:#66bb6a33;">🤝</div><div class="ae-ev-body"><div class="ae-ev-badge" style="background:#66bb6a15;color:#66bb6a">GROUPS FORM</div><div class="ae-ev-text">Players pair up before heading deeper: ${groupDescs}. The rest go solo.</div></div></div>` });
    }
  }

  for (const round of ae.rounds) {
    liveState.location = round.location;
    liveState.mamaLevel = round.mamaLevel;

    if (ae.actBreaks.includes(round.roundNum - 2) && round.roundNum > 1) {
      pushStep({ html: `<div class="ae-escalation"><div class="ae-escalation-txt">⚠ THREAT ESCALATION ⚠</div><div class="ae-escalation-sub">Mama Alien entering ${round.mamaName} phase</div></div>` });
    }

    pushStep({ html: `<div class="ae-round"><div class="ae-cam"><div class="ae-cam-dot"></div><span class="ae-cam-txt">CAM ${String(round.roundNum).padStart(2, '0')} — ${round.location.toUpperCase()}</span></div><div class="ae-round-info">${round.survivors.length + round.slimes.length} active • ${round.eggsRemaining} eggs in field</div></div>` });

    if (round.environmentalEvents.length) {
      for (const env of round.environmentalEvents) {
        pushStep({ html: _aeEventCard({ type: 'environmental', text: env.text }) });
      }
    }

    // Mandatory events always show (story-critical beats)
    const mandatoryTypes = new Set(['search', 'delivery', 'gold-delivery', 'gold-found', 'trap', 'empty-egg', 'carry-context']);
    const mandatory = round.eggEvents.filter(e => mandatoryTypes.has(e.type));
    // Optional events get budget-capped
    const optional = [...round.events];
    const priorityOrder = ['sabotage', 'heroic', 'showmance', 'confrontation', 'alliance', 'group', 'evasion', 'comedy', 'panic'];
    optional.sort((a, b) => {
      const ai = priorityOrder.indexOf(a.type);
      const bi = priorityOrder.indexOf(b.type);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    const optionalBudget = Math.max(2, Math.min(6, Math.round(targetTotal / ae.rounds.length) - mandatory.length));
    // Distribute optional budget across tribes so no tribe is invisible
    const optByTribe = {};
    for (const ev of optional) {
      const t = ev.tribe || '_merged';
      if (!optByTribe[t]) optByTribe[t] = [];
      optByTribe[t].push(ev);
    }
    const optTribeKeys = Object.keys(optByTribe);
    const selectedOpt = [];
    let budget = optionalBudget;
    const perTribe = Math.max(1, Math.floor(budget / Math.max(optTribeKeys.length, 1)));
    for (const t of optTribeKeys) {
      const take = Math.min(perTribe, optByTribe[t].length);
      selectedOpt.push(...optByTribe[t].slice(0, take));
      budget -= take;
    }
    // Fill remaining budget from any tribe
    if (budget > 0) {
      const remaining = optional.filter(e => !selectedOpt.includes(e));
      selectedOpt.push(...remaining.slice(0, budget));
    }
    const highlights = [...mandatory, ...selectedOpt];

    for (const ev of highlights) {
      // Update live state based on event type
      if (ev.type === 'search' && ev.player) {
        if (!liveState.carrying.includes(ev.player)) liveState.carrying.push(ev.player);
        const eggIdx = ae.eggs.findIndex((e, i) => e.foundBy === ev.player && !liveState.eggsFound.includes(i));
        if (eggIdx !== -1) {
          liveState.eggsFound.push(eggIdx);
          liveState.carryingTypes[ev.player] = ae.eggs[eggIdx].type === 'gold' ? 'gold' : 'normal';
        }
      }
      if ((ev.type === 'delivery' || ev.type === 'gold-delivery') && ev.player) {
        liveState.carrying = liveState.carrying.filter(p => p !== ev.player);
        delete liveState.carryingTypes[ev.player];
        liveState.banked[ev.player] = (liveState.banked[ev.player] || 0) + (ev.eggType === 'gold' ? 2 : 1);
        const eggIdx = ae.eggs.findIndex((e, i) => e.foundBy === ev.player && liveState.eggsFound.includes(i) && !liveState.eggsDelivered.includes(i));
        if (eggIdx !== -1) liveState.eggsDelivered.push(eggIdx);
      }
      if (ev.type === 'empty-egg' && ev.player) {
        liveState.carrying = liveState.carrying.filter(p => p !== ev.player);
        delete liveState.carryingTypes[ev.player];
        const eggIdx = ae.eggs.findIndex((e, i) => e.type === 'empty' && liveState.eggsFound.includes(i) && !liveState.eggsDelivered.includes(i));
        if (eggIdx !== -1) liveState.eggsDelivered.push(eggIdx);
      }
      if (ev.type === 'trap' && ev.player) {
        liveState.carrying = liveState.carrying.filter(p => p !== ev.player);
        delete liveState.carryingTypes[ev.player];
        liveState.survivors = liveState.survivors.filter(p => p !== ev.player);
        liveState.groups = liveState.groups.map(g => g.filter(p => p !== ev.player)).filter(g => g.length >= 2);
        liveState.slimed.push({ name: ev.player, round: 0, banked: liveState.banked[ev.player] || 0 });
        const eggIdx = ae.eggs.findIndex((e, i) => e.type === 'trap' && !liveState.eggsTrapFired.includes(i));
        if (eggIdx !== -1) { liveState.eggsTrapFired.push(eggIdx); liveState.eggsDestroyed.push(eggIdx); }
      }
      if (ev.type === 'gold-found' && ev.player) {
        if (!liveState.carrying.includes(ev.player)) liveState.carrying.push(ev.player);
        liveState.carryingTypes[ev.player] = 'gold';
      }
      if (ev.type === 'sabotage' && ev.eggDropped && ev.target) {
        liveState.carrying = liveState.carrying.filter(p => p !== ev.target);
        delete liveState.carryingTypes[ev.target];
      }

      if (ev.type === 'trap') {
        const trapDrips = [10, 28, 45, 62, 80].map(l =>
          `<div class="ae-drip" style="left:${l}%;--w:${8+Math.random()*10|0}px;--h1:${15+Math.random()*12|0}px;--h2:${35+Math.random()*20|0}px;--dur:${4+Math.random()*2}s;--delay:${Math.random()*1.5}s"></div>`
        ).join('');
        pushStep({ slimed: true, html: `
          <div class="ae-slime" style="border-color:#ff4a4a55;">
            <div class="ae-slime-pool" style="background:linear-gradient(180deg,#ff4a4aaa,#39ff1466);"></div>
            <div class="ae-slime-drips">${trapDrips}</div>
            <div class="ae-splat" style="width:70px;height:45px;top:10px;right:20px;transform:rotate(-10deg)"></div>
            <div class="ae-splat" style="width:50px;height:35px;bottom:15px;left:12px;transform:rotate(15deg)"></div>
            <div class="ae-slime-content">
              <div class="ae-slime-hdr">
                <div class="ae-slime-port" style="border-color:#ff4a4a;">
                  ${_aePortrait(ev.player, 52)}
                  <div class="ae-pdrip pd1"></div><div class="ae-pdrip pd2"></div><div class="ae-pdrip pd3"></div>
                </div>
                <div>
                  <div class="ae-slime-lbl" style="color:#ff4a4a;">💀 BOOBY TRAP — ${(ev.player||'').toUpperCase()} ELIMINATED 💀</div>
                  <div class="ae-slime-sub">SLIMED ON CONTACT • ${(liveState.banked[ev.player]||0)} BANKED • ROUND ${round.roundNum}</div>
                </div>
              </div>
              <div class="ae-slime-text">${ev.text}</div>
              <div class="ae-slime-after">${ev.player} didn't even see Chef. The trap did the work. Walks to the slime bench, dripping from head to toe.</div>
            </div>
          </div>` });

      } else if (ev.type === 'delivery' || ev.type === 'gold-delivery') {
        const icon = ev.eggType === 'gold' ? '🪙' : '📦';
        const label = ev.eggType === 'gold' ? `★ GOLD SPECIMEN DELIVERED — ${ev.player}` : `✓ SPECIMEN DELIVERED — ${ev.player}`;
        pushStep({ html: `<div class="ae-delivery"><div class="ae-delivery-icon">${icon}</div><div><div class="ae-delivery-lbl">${label}</div><div class="ae-delivery-txt">${ev.text}</div></div></div>` });
      } else if (ev.type === 'gold-found') {
        pushStep({ html: `<div class="ae-delivery" style="border-left-color:#ffd74a"><div class="ae-delivery-icon">🪙</div><div><div class="ae-delivery-lbl" style="color:#ffd74a">★ GOLD SPECIMEN ACQUIRED — ${ev.player}</div><div class="ae-delivery-txt">${ev.text}</div></div></div>` });
      } else if (ev.type === 'empty-egg') {
        pushStep({ html: `<div class="ae-ev" style="border-left-color:#888;--accent:#888"><div class="ae-ev-port">${_aePortrait(ev.player, 44)}</div><div class="ae-ev-body"><div class="ae-ev-badge" style="background:#88888815;color:#888">EMPTY EGG</div><div class="ae-ev-text">${ev.text}</div><div class="ae-ev-impact" style="color:#888">EMPTY — 0 POINTS • WASTED RUN</div></div></div>` });
      } else if (ev.type === 'carry-context') {
        pushStep({ html: `<div class="ae-ev" style="border-left-color:#ffd74a33;--accent:#ffd74a88;--glow:#ffd74a05"><div class="ae-ev-port">${_aePortrait(ev.player, 44)}</div><div class="ae-ev-body"><div class="ae-ev-badge" style="background:#ffd74a15;color:#ffd74a88">MAKING A RUN</div><div class="ae-ev-text">${ev.text}</div></div></div>` });
      } else {
        pushStep({ html: _aeEventCard(ev) });
      }
    }

    // Slime cards — update live state BEFORE snapshot
    for (const sl of round.slimes) {
      // Trap kills already handled by the trap card — only update state, skip rendering
      if (sl.trapKill) {
        // State already updated by trap event handler above — skip duplicate card
        continue;
      }

      liveState.survivors = liveState.survivors.filter(p => p !== sl.name);
      liveState.carrying = liveState.carrying.filter(p => p !== sl.name);
      delete liveState.carryingTypes[sl.name];
      liveState.groups = liveState.groups.map(g => g.filter(p => p !== sl.name)).filter(g => g.length >= 2);
      liveState.slimed.push({ name: sl.name, round: sl.round, banked: sl.eggsBanked });
      if (sl.eggDestroyed) {
        const eggIdx = ae.eggs.findIndex((e, i) => e.foundBy === sl.name && liveState.eggsFound.includes(i) && !liveState.eggsDelivered.includes(i) && !liveState.eggsDestroyed.includes(i));
        if (eggIdx !== -1) liveState.eggsDestroyed.push(eggIdx);
      }

      const seq = sl.slimeSequence;
      const drips = [8, 22, 40, 58, 75, 90].map(l =>
        `<div class="ae-drip" style="left:${l}%;--w:${10+Math.random()*8|0}px;--h1:${18+Math.random()*15|0}px;--h2:${45+Math.random()*20|0}px;--dur:${4+Math.random()*2}s;--delay:${Math.random()*2}s"></div>`
      ).join('');
      const splatR = Math.random() * 20 + 10;
      pushStep({ slimed: true, html: `
        <div class="ae-slime">
          <div class="ae-slime-pool"></div>
          <div class="ae-slime-drips">${drips}</div>
          <div class="ae-splat" style="width:80px;height:50px;top:12px;right:${splatR}px;transform:rotate(-12deg)"></div>
          <div class="ae-splat" style="width:60px;height:40px;bottom:20px;left:8px;transform:rotate(20deg)"></div>
          <div class="ae-slime-content">
            <div class="ae-slime-hdr">
              <div class="ae-slime-port">
                ${_aePortrait(sl.name, 52)}
                <div class="ae-pdrip pd1"></div><div class="ae-pdrip pd2"></div><div class="ae-pdrip pd3"></div>
              </div>
              <div>
                <div class="ae-slime-lbl">☠ SLIMED — ${sl.name.toUpperCase()}</div>
                <div class="ae-slime-sub">${sl.eggDestroyed ? 'EGG DESTROYED • ' : ''}${sl.eggsBanked} BANKED • ROUND ${sl.round}</div>
              </div>
            </div>
            <div class="ae-slime-approach">${seq.approach}</div>
            <div class="ae-slime-text">${seq.hit} ${seq.reaction}</div>
            <div class="ae-slime-after">${seq.aftermath}</div>
          </div>
        </div>` });
    }

    pushStep({ html: `<div style="display:flex;align-items:center;justify-content:space-between;margin:8px 0;"><div style="font-family:'Orbitron',sans-serif;font-size:9px;letter-spacing:2px;color:#4aff4a44;">${round.survivors.length} REMAIN</div><div class="ae-chris">${round.chrisLine}</div></div>` });
  }

  // Store step states on ae for the reveal function
  ae.stepStates = steps.map(s => s.stateJson);

  const state = _tvState[stateKey];

  // Initial sidebar state (all players active, nothing happened yet)
  const initialState = {
    survivors: [...allPlayers], slimed: [], banked: {},
    carrying: [], location: ae.rounds[0]?.location || '',
    eggsFound: [], eggsDelivered: [], eggsDestroyed: [], eggsTrapFired: [],
    groups: (ae.groups || []).map(g => [...g]), mamaLevel: 1, carryingTypes: {},
  };
  allPlayers.forEach(p => { initialState.banked[p] = 0; });
  const currentSidebarState = state.idx >= 0 && ae.stepStates[state.idx]
    ? JSON.parse(ae.stepStates[state.idx]) : initialState;
  const sidebarHtml = _aeSidebarFromState(currentSidebarState, ae);

  // HUD also uses current state
  const hudActive = currentSidebarState.survivors.length;
  const hudSlimed = currentSidebarState.slimed.length;
  const hudBanked = Object.values(currentSidebarState.banked).reduce((s, v) => s + v, 0);
  const hudLevel = currentSidebarState.mamaLevel || 1;

  let feedHtml = `<div class="ae-sec">SURVEILLANCE FEED</div>`;
  feedHtml += `<div style="font-family:'Orbitron',sans-serif;font-size:9px;letter-spacing:2px;color:#4aff4a44;margin-bottom:8px;">CLICK TO ADVANCE FEED</div>`;

  steps.forEach((step, i) => {
    const visible = i <= state.idx;
    feedHtml += `<div id="ae-step-${stateKey}-${i}" data-slimed="${step.slimed ? 1 : 0}" data-state-idx="${i}" style="${visible ? '' : 'display:none'}">${step.html}</div>`;
  });

  feedHtml += `<div id="ae-controls-${stateKey}" class="ae-controls"${state.idx >= steps.length - 1 ? ' style="display:none"' : ''}>
    <button id="ae-btn-${stateKey}" class="ae-btn-next" onclick="window.alienEggRevealNext('${stateKey}', ${steps.length})">NEXT ▶ (${state.idx + 2}/${steps.length})</button>
    <button class="ae-btn-all" onclick="window.alienEggRevealAll('${stateKey}', ${steps.length})">Reveal All</button>
  </div>`;

  return _aeShell(`
    <div class="ae-hud">
      <div class="ae-hud-cell"><div class="ae-hud-val" style="color:#4aff4a" id="ae-hud-round-${stateKey}">R${state.idx >= 0 ? Math.min(ae.rounds.length, Math.ceil((state.idx + 1) / 5)) : 1}</div><div class="ae-hud-lbl">ROUND</div></div>
      <div class="ae-hud-cell"><div class="ae-hud-val" style="color:#4aff4a" id="ae-hud-active-${stateKey}">${hudActive}</div><div class="ae-hud-lbl">ACTIVE</div></div>
      <div class="ae-hud-cell"><div class="ae-hud-val" style="color:#39ff14" id="ae-hud-slimed-${stateKey}">${hudSlimed}</div><div class="ae-hud-lbl">SLIMED</div></div>
      <div class="ae-hud-cell"><div class="ae-hud-val" style="color:#ffd74a" id="ae-hud-banked-${stateKey}">${hudBanked}</div><div class="ae-hud-lbl">BANKED</div></div>
      <div class="ae-hud-cell"><div class="ae-hud-val" style="color:#ff4a4a" id="ae-hud-mama-${stateKey}">LV${hudLevel}</div><div class="ae-hud-lbl">MAMA ALIEN</div></div>
    </div>
    <div class="ae-layout">
      <div class="ae-feed">${feedHtml}</div>
      <div class="ae-sidebar" id="ae-sidebar-${stateKey}">${sidebarHtml}</div>
    </div>
  `, ep);
}

// ── Update sidebar + HUD from step state ──
function _aeUpdateSidebar(stateKey, stepIdx) {
  // Find the ae data from the current episode
  const epHistory = gs.episodeHistory || [];
  let ae = null;
  for (const ep of epHistory) {
    if (ep.alienEgg && String(ep.num || 0) + '_ae' === stateKey) { ae = ep.alienEgg; break; }
  }
  if (!ae || !ae.stepStates || !ae.stepStates[stepIdx]) return;

  const state = JSON.parse(ae.stepStates[stepIdx]);
  const sidebar = document.getElementById(`ae-sidebar-${stateKey}`);
  if (sidebar) sidebar.innerHTML = _aeSidebarFromState(state, ae);

  // Update HUD
  const hudActive = document.getElementById(`ae-hud-active-${stateKey}`);
  const hudSlimed = document.getElementById(`ae-hud-slimed-${stateKey}`);
  const hudBanked = document.getElementById(`ae-hud-banked-${stateKey}`);
  if (hudActive) hudActive.textContent = state.survivors.length;
  if (hudSlimed) hudSlimed.textContent = state.slimed.length;
  if (hudBanked) hudBanked.textContent = Object.values(state.banked).reduce((s, v) => s + v, 0);
  const hudMama = document.getElementById(`ae-hud-mama-${stateKey}`);
  if (hudMama) hudMama.textContent = `LV${state.mamaLevel || 1}`;
}

// ── Reveal handlers ──
export function alienEggRevealNext(stateKey, totalSteps) {
  const _tvState = window._tvState || (window._tvState = {});
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  const el = document.getElementById(`ae-step-${stateKey}-${state.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  const btn = document.getElementById(`ae-btn-${stateKey}`);
  if (btn) btn.textContent = `NEXT ▶ (${state.idx + 2}/${totalSteps})`;
  if (state.idx >= totalSteps - 1) {
    const ctrl = document.getElementById(`ae-controls-${stateKey}`);
    if (ctrl) ctrl.style.display = 'none';
  }
  _aeUpdateSidebar(stateKey, state.idx);
}

export function alienEggRevealAll(stateKey, totalSteps) {
  const _tvState = window._tvState || (window._tvState = {});
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  _tvState[stateKey].idx = totalSteps - 1;
  for (let i = 0; i < totalSteps; i++) {
    const el = document.getElementById(`ae-step-${stateKey}-${i}`);
    if (el) el.style.display = '';
  }
  const ctrl = document.getElementById(`ae-controls-${stateKey}`);
  if (ctrl) ctrl.style.display = 'none';
  _aeUpdateSidebar(stateKey, totalSteps - 1);
}

// ── Immunity Screen ──
export function rpBuildAlienEggImmunity(ep) {
  const ae = ep.alienEgg;
  if (!ae || !ae.immunityWinner) return '';
  const winner = ae.immunityWinner;
  const eggs = ae.bankedEggs[winner] || 0;
  return _aeShell(`
    <div style="text-align:center;padding:40px 20px;">
      <div style="font-size:50px;margin-bottom:16px;">🥚</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:12px;letter-spacing:3px;color:#4aff4a66;margin-bottom:12px;">IMMUNITY WINNER</div>
      <div style="display:inline-block;border-radius:50%;border:3px solid #4aff4a;padding:4px;box-shadow:0 0 20px #4aff4a44;margin-bottom:12px;">${_aePortrait(winner, 80)}</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:22px;font-weight:900;letter-spacing:3px;color:#4aff4a;text-shadow:0 0 15px #4aff4a44;">${winner.toUpperCase()}</div>
      <div style="font-size:12px;color:#ffd74a;margin-top:8px;">${eggs} egg${eggs !== 1 ? 's' : ''} delivered</div>
      <div style="font-size:11px;color:#4aff4a66;margin-top:16px;">${ae.chrisCloser}</div>
    </div>
  `, ep);
}

// ── Tribe Results Screen ──
export function rpBuildAlienEggTribeResults(ep) {
  const ae = ep.alienEgg;
  if (!ae || !ae.tribeScores) return '';
  const entries = Object.entries(ae.tribeScores);
  const sorted = entries.sort(([, a], [, b]) => {
    const aTotal = typeof a === 'object' ? a.total : a;
    const bTotal = typeof b === 'object' ? b.total : b;
    return bTotal - aTotal;
  });
  let html = `<div style="padding:20px;"><div style="font-family:'Orbitron',sans-serif;font-size:14px;letter-spacing:3px;color:#4aff4a;margin-bottom:16px;text-align:center;">TRIBE EGG RESULTS</div>`;
  for (let ti = 0; ti < sorted.length; ti++) {
    const [tribe, data] = sorted[ti];
    const total = typeof data === 'object' ? data.total : data;
    const members = typeof data === 'object' ? data.members : [];
    const isWinner = ti === 0;
    const isLoser = ti === sorted.length - 1 && sorted.length > 1;
    const color = isWinner ? '#4aff4a' : isLoser ? '#ff4a4a' : '#ffd74a';
    html += `<div style="margin-bottom:12px;padding:14px;border:1px solid ${color}33;background:${color}08;border-radius:4px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <div style="font-family:'Orbitron',sans-serif;font-size:14px;color:${color};letter-spacing:2px;">${tribe.toUpperCase()}</div>
        <div style="font-family:'Orbitron',sans-serif;font-size:22px;font-weight:700;color:${color};text-shadow:0 0 8px ${color}44;">${total} 🥚</div>
      </div>
      <div style="font-size:12px;color:#b8ccb8;margin-bottom:8px;">${total} egg${total !== 1 ? 's' : ''} delivered to extraction zone</div>`;
    if (members.length) {
      html += `<div style="display:flex;gap:8px;flex-wrap:wrap;">`;
      for (const m of members) {
        const mEggs = ae.bankedEggs[m] || 0;
        const isSlimed = ae.slimedOrder.includes(m);
        html += `<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:#0a161088;border:1px solid ${color}22;border-radius:3px;${isSlimed ? 'opacity:.6' : ''}">
          ${_aePortrait(m, 24)}
          <div>
            <div style="font-size:10px;color:#b8ccb8">${m}</div>
            <div style="font-size:9px;color:${mEggs > 0 ? '#ffd74a' : '#4aff4a44'}">${mEggs > 0 ? '🥚'.repeat(Math.min(mEggs, 4)) + ' ' + mEggs : 'none'}${isSlimed ? ' 💚' : ''}</div>
          </div>
        </div>`;
      }
      html += `</div>`;
    }
    if (isWinner) html += `<div style="font-size:10px;color:#4aff4a;margin-top:8px;letter-spacing:2px;text-align:center;">★ IMMUNE ★</div>`;
    if (isLoser) html += `<div style="font-size:10px;color:#ff4a4a;margin-top:8px;letter-spacing:2px;text-align:center;">TRIBAL COUNCIL</div>`;
    html += `</div>`;
  }
  html += `</div>`;
  return _aeShell(html, ep);
}

// ── Leaderboard Screen ──
export function rpBuildAlienEggLeaderboard(ep) {
  const ae = ep.alienEgg;
  if (!ae) return '';
  let html = `<div style="padding:16px;"><div style="font-family:'Orbitron',sans-serif;font-size:12px;letter-spacing:3px;color:#4aff4a55;text-align:center;margin-bottom:16px;">INCIDENT REPORT — ALIEN RESURR-EGGTION</div>`;

  function renderEntry(entry) {
    const isSlimed = ae.slimedOrder.includes(entry.name);
    const border = isSlimed ? '#39ff14' : '#4aff4a';
    const slimeLabel = entry.slimedRound ? `<span style="color:#39ff14;font-size:9px;"> SLIMED R${entry.slimedRound}</span>` : `<span style="color:#4aff4a;font-size:9px;"> SURVIVED</span>`;
    return `<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid ${border}22;background:#0a1610;margin-bottom:4px;border-radius:2px;${isSlimed ? 'opacity:.6' : ''}">
      ${_aePortrait(entry.name, 36)}
      <div style="flex:1;"><div style="color:#4aff4acc;font-size:13px;">${entry.name}${slimeLabel}</div></div>
      <div style="text-align:right;font-family:'Orbitron',sans-serif;">
        <div style="font-size:16px;color:#ffd74a;">${entry.eggsDelivered}</div>
        <div style="font-size:7px;color:#ffd74a66;letter-spacing:1px;">EGGS</div>
      </div>
      <div style="text-align:right;font-family:'Orbitron',sans-serif;">
        <div style="font-size:13px;color:#4aff4a88;">${entry.score}</div>
        <div style="font-size:7px;color:#4aff4a44;letter-spacing:1px;">SCORE</div>
      </div>
    </div>`;
  }

  // Group by tribe for pre-merge
  if (ae.tribeScores && ep.tribesAtStart?.length) {
    for (const tribe of ep.tribesAtStart) {
      const tribeData = ae.tribeScores[tribe.name];
      const total = typeof tribeData === 'object' ? tribeData.total : (tribeData || 0);
      const tribeMembers = tribe.members || [];
      const tribeEntries = ae.leaderboard.filter(e => tribeMembers.includes(e.name));
      if (!tribeEntries.length) continue;
      const isWinner = ep.winner?.name === tribe.name;
      const color = isWinner ? '#4aff4a' : '#ff4a4a';
      html += `<div style="margin-bottom:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 12px;border:1px solid ${color}33;background:${color}08;border-radius:3px;margin-bottom:4px;">
          <div style="font-family:'Orbitron',sans-serif;font-size:11px;letter-spacing:2px;color:${color};">${tribe.name.toUpperCase()}</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:13px;color:${color};">${total} 🥚${isWinner ? ' ★' : ''}</div>
        </div>`;
      for (const entry of tribeEntries) html += renderEntry(entry);
      html += `</div>`;
    }
  } else {
    for (const entry of ae.leaderboard) html += renderEntry(entry);
  }

  html += `</div>`;
  return _aeShell(html, ep);
}
