# Monster Cash Overhaul — Full Rebuild Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tear out and rebuild Monster Cash from a flat, generic challenge into a narrative-driven monster hunt with 90+ multi-beat encounter templates, escalating B-movie-to-horror tone, emergency broadcast VP theme, and proper character-driven storytelling. Fix post-merge to use normal tribal (no auto-elimination). Fix pre-merge to use last-tribe-standing (not just average).

**Architecture:** Full rebuild of `js/chal/monster-cash.js` (currently 845 lines → target ~2000+ lines). Minor changes to `js/episode.js` (remove auto-elim post-merge flow). CSS overhaul in `simulator.html`. All other integration points (main.js, vp-screens.js, text-backlog.js, run-ui.js, alliances.js, core.js, twists.js) remain unchanged — they already wire to the correct exports.

**Tech Stack:** Vanilla JS ES modules, CSS keyframe animations, no build step.

**Key Design Decisions:**
- Events use `(name, pr, target?) => \`narrative text\`` pattern (like Lucky Hunt / Hide and Be Sneaky)
- Each encounter has 3-5 text variants per beat
- Captures are 4-beat sequences: approach → reaction → capture → aftermath
- Captured players get a last-chance escape beat before being caught
- Monster has behavior modes per threat level affecting which events fire
- B-movie comedy at threat 1-2, tense at 3, full horror at 4-5
- VP theme: emergency broadcast / surveillance camera feed that degrades as threat rises
- Post-merge: immunity winner only, normal tribal council follows
- Pre-merge: last tribe with survivors standing wins (avg survival as tiebreak)

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `js/chal/monster-cash.js` | Rewrite | All encounter templates, simulation, text backlog, VP builders |
| `js/episode.js` | Modify | Remove auto-elimination from post-merge Monster Cash flow |
| `simulator.html` | Modify | Overhaul Monster Cash CSS for surveillance theme |

---

### Task 1: Episode.js — Remove Post-Merge Auto-Elimination

**Files:**
- Modify: `js/episode.js:1447-1519` (the post-merge Monster Cash block)

The current post-merge Monster Cash block auto-eliminates the lowest scorer and skips tribal. We need to change it to only set the immunity winner and let the normal tribal flow handle voting/elimination.

- [ ] **Step 1: Read the current post-merge Monster Cash block**

Read `js/episode.js` lines 1447-1519 to see the current auto-elimination flow.

- [ ] **Step 2: Replace the post-merge Monster Cash block**

Find this block starting at line 1448:
```js
  if (ep.isMonsterCash && gs.isMerged) {
```

Replace the ENTIRE block (from line 1448 through line 1519, ending with `window.patchEpisodeHistory(ep); window.saveGameState(); return ep;`) with a simpler version that only sets immunity and lets the normal episode flow continue:

```js
  // ── MONSTER CASH (post-merge) — monster hunt determines immunity, normal tribal follows ──
  if (ep.isMonsterCash && gs.isMerged) {
    simulateMonsterCash(ep);
    ep.immunityWinner = ep.monsterCash.immunityWinner;
    ep.challengeType = 'monster-cash';
    // Fall through to normal tribal flow — no auto-elimination, no early return
  }
```

This removes:
- `ep.noTribal = true`
- `ep.eliminated = ep.monsterCash.eliminated`
- The entire RI check / elimination / episodeHistory.push / early return block
- The normal episode flow will handle tribal council, voting, RI, etc.

- [ ] **Step 3: Remove `ep.isMonsterCash` from `_hasTwistChallenge`**

Find the `_hasTwistChallenge` variable (around line 1627). Remove `|| ep.isMonsterCash` from it. Monster Cash no longer bypasses sudden death handling since it doesn't auto-eliminate.

- [ ] **Step 4: Verify the simulation function contract change**

The `simulateMonsterCash` function currently sets `ep.eliminated` and `ep.noTribal = true` internally. We'll fix this in Task 3 when we rebuild the simulation, but for now note that the episode.js side no longer reads `ep.monsterCash.eliminated`.

- [ ] **Step 5: Commit**

```bash
git add js/episode.js
git commit -m "fix(monster-cash): remove auto-elimination, use normal tribal for post-merge"
```

---

### Task 2: Encounter Templates — Survival Events (25 templates)

**Files:**
- Modify: `js/chal/monster-cash.js` (replace POSITIVE_EVENTS and NEGATIVE_EVENTS with new system)

The new event system uses narrative text generators instead of flat `{ name, basePoints }` objects. Each template has a `text` function that takes `(name, pr, target?)` and returns a narrative sentence. Templates are organized by category.

**IMPORTANT:** Every text function must use `pronouns(name)` for pronoun access. Use `pr.sub`, `pr.obj`, `pr.pos`, `pr.posAdj`, `pr.ref`, `pr.Sub`, `pr.Obj`, `pr.PosAdj`. NO `pr.Pos`. Use `pr.posAdj` before nouns, `pr.pos` standalone.

- [ ] **Step 1: Read the current file to understand what to replace**

Read `js/chal/monster-cash.js` lines 1-60 to see the current imports, constants, and event pool structure.

- [ ] **Step 2: Replace the event pools with the new encounter template system**

After the existing `LOCATIONS` array (keep locations unchanged), replace `POSITIVE_EVENTS` and `NEGATIVE_EVENTS` with the new encounter template pools. Delete the old arrays entirely.

Add the following encounter template system:

```js
// ══════════════════════════════════════════════════════════════════════
// ENCOUNTER TEMPLATES — narrative text generators
// Each template: { id, cat, type, stat, stat2?, basePoints, maxPoints,
//   needsTarget?, minThreat?, text: [(n,pr,tgt?) => `...`, ...] }
// ══════════════════════════════════════════════════════════════════════

// ── SURVIVAL: HIDE (8 templates) ──
const HIDE_ENCOUNTERS = [
  {
    id: 'duck-behind-props', cat: 'survival', type: 'hide', stat: 'mental',
    basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} spots a fake storefront and ducks behind it. The monster's shadow passes. ${pr.Sub} barely breathe${pr.sub==='they'?'':'s'}.`,
      (n,pr) => `${n} drops flat behind a prop building. The paint is still wet — ${pr.sub} can smell it. The monster walks past inches away.`,
      (n,pr) => `A cardboard saloon. Not exactly Fort Knox. ${n} squeezes behind it anyway. The monster doesn't even glance over.`,
      (n,pr) => `${n} presses ${pr.ref} against the back of a facade. ${pr.PosAdj} heart is pounding so loud ${pr.sub} swear${pr.sub==='they'?'':'s'} the monster can hear it.`,
    ],
  },
  {
    id: 'costume-rack', cat: 'survival', type: 'hide', stat: 'mental', stat2: 'social',
    basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} dives into a costume rack and goes still. The monster passes. ${pr.Sub} emerge${pr.sub==='they'?'':'s'} wearing half a gorilla suit.`,
      (n,pr) => `Between a werewolf costume and a space suit, ${n} finds the perfect spot. ${pr.Sub} don't dare move.`,
      (n,pr) => `${n} hides inside a row of monster costumes. Ironic. The real monster walks right by.`,
    ],
  },
  {
    id: 'crawl-under-cart', cat: 'survival', type: 'hide', stat: 'physical', stat2: 'endurance',
    basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} rolls under a catering cart. It smells like old sandwiches. The monster stomps past, rattling the plates.`,
      (n,pr) => `A low dolly cart. ${n} slides under it like a mechanic. The ground shakes with each of the monster's steps.`,
      (n,pr) => `${n} crawls under the nearest vehicle — a golf cart. ${pr.Sub} curl${pr.sub==='they'?'':'s'} into a ball and wait${pr.sub==='they'?'':'s'}.`,
    ],
  },
  {
    id: 'fake-car', cat: 'survival', type: 'hide', stat: 'mental',
    basePoints: 2, maxPoints: 4,
    text: [
      (n,pr) => `${n} climbs into a prop car. It has no engine. It has no floor. But it has a door, and that door locks.`,
      (n,pr) => `The set car looks real from ten feet away. ${n} slips inside and hunkers down. The monster investigates, sniffs the hood, moves on.`,
      (n,pr) => `${n} hides in a fake taxi. The meter is painted on. The steering wheel is cardboard. But the seat is surprisingly comfortable.`,
    ],
  },
  {
    id: 'billboard-cutout', cat: 'survival', type: 'hide', stat: 'mental', stat2: 'social',
    basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} flattens ${pr.ref} behind a movie poster billboard. The monster's claw brushes the other side. ${pr.Sub} don't flinch.`,
      (n,pr) => `A giant movie poster: "ATTACK OF THE 50-FOOT INTERN." ${n} slides behind it, becoming part of the set.`,
      (n,pr) => `${n} stands behind a cutout of a screaming actress. The irony is not lost on ${pr.obj}.`,
    ],
  },
  {
    id: 'dumpster', cat: 'survival', type: 'hide', stat: 'endurance',
    basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} climbs into a dumpster. It's exactly as unpleasant as it sounds. But the monster doesn't check dumpsters.`,
      (n,pr) => `"I can't believe I'm doing this." ${n} pulls the dumpster lid shut. Something in there is alive. ${pr.Sub} choose${pr.sub==='they'?'':'s'} not to investigate.`,
      (n,pr) => `${n} hauls ${pr.ref} into a dumpster and lies perfectly still. The smell is indescribable. Effective, though.`,
    ],
  },
  {
    id: 'between-crates', cat: 'survival', type: 'hide', stat: 'physical',
    basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} wedges between two stacked shipping crates. Tight fit. The monster can't reach in even if it finds ${pr.obj}.`,
      (n,pr) => `A gap between crates, barely wide enough. ${n} squeezes in sideways. ${pr.PosAdj} shoulder scrapes the wood.`,
      (n,pr) => `${n} finds a gap in the crate wall and slips through. Dark in here. Quiet. Safe — for now.`,
    ],
  },
  {
    id: 'footprint-crater', cat: 'survival', type: 'hide', stat: 'boldness', stat2: 'mental',
    basePoints: 3, maxPoints: 4,
    text: [
      (n,pr) => `The monster's own footprint left a crater in the asphalt. ${n} lies down inside it. Bold move — the last place it would look.`,
      (n,pr) => `${n} spots a depression in the ground from the monster's earlier rampage. ${pr.Sub} curl${pr.sub==='they'?'':'s'} into it. Hiding in the monster's own tracks.`,
      (n,pr) => `"It won't come back to the same spot." ${n} drops into a monster footprint crater. ${pr.Sub}'${pr.sub==='they'?'re':'s'} either brilliant or insane.`,
    ],
  },
];

// ── SURVIVAL: RUN (6 templates) ──
const RUN_ENCOUNTERS = [
  {
    id: 'sprint-back-lot', cat: 'survival', type: 'run', stat: 'physical',
    basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} breaks into a full sprint down the back lot. Arms pumping, feet slapping pavement. The monster roars behind ${pr.obj} but can't close the gap.`,
      (n,pr) => `The back lot stretches out — open ground, no cover. ${n} runs for it. Pure speed against pure size. ${pr.Sub} win${pr.sub==='they'?'':'s'}.`,
      (n,pr) => `${n} hits top speed in three strides. The monster lurches after ${pr.obj} but ${pr.sub} already ${pr.sub==='they'?'have':'has'} too much ground.`,
    ],
  },
  {
    id: 'revolving-door', cat: 'survival', type: 'run', stat: 'physical', stat2: 'mental',
    basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} dashes through a revolving set door — the monster follows but gets stuck in the mechanism. Mechanical grinding. ${n} doesn't look back.`,
      (n,pr) => `A revolving door. ${n} hits it at full speed, spins through, and keeps running. The monster slams into the frame a second later.`,
      (n,pr) => `${n} spots the revolving door trick — goes through, then immediately back, leaving the monster confused on the other side.`,
    ],
  },
  {
    id: 'slide-under-door', cat: 'survival', type: 'run', stat: 'physical', stat2: 'endurance',
    basePoints: 2, maxPoints: 4,
    text: [
      (n,pr) => `A garage door is closing. ${n} dives and slides under it with inches to spare. The monster's claw scrapes the door shut behind ${pr.obj}.`,
      (n,pr) => `${n} sees the door coming down. No time to think. ${pr.Sub} drop${pr.sub==='they'?'':'s'} and slide${pr.sub==='they'?'':'s'}. Made it. Just.`,
      (n,pr) => `Baseball slide under a closing door. ${n} rolls to ${pr.posAdj} feet on the other side, heart hammering. The door slams shut.`,
    ],
  },
  {
    id: 'rooftop-parkour', cat: 'survival', type: 'run', stat: 'physical', stat2: 'boldness',
    basePoints: 3, maxPoints: 4,
    text: [
      (n,pr) => `${n} scrambles up a fire escape and runs across the rooftops. The monster follows below, tearing through buildings trying to reach ${pr.obj}.`,
      (n,pr) => `Rooftop to rooftop. ${n} leaps a gap that shouldn't be leapable. Lands hard, keeps running. The monster can only watch.`,
      (n,pr) => `${n} takes the high road — literally. Across catwalks, over set rooftops, never touching the ground. The monster loses ${pr.posAdj} trail.`,
    ],
  },
  {
    id: 'zigzag-fog', cat: 'survival', type: 'run', stat: 'mental', stat2: 'physical',
    basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `Fog machines are still running from an old shoot. ${n} zigzags through the mist — the monster swipes at shadows and misses.`,
      (n,pr) => `${n} hits the fog bank and disappears. The monster thrashes around blindly. ${n} is already three sets away.`,
      (n,pr) => `The fog is thick enough to taste. ${n} keeps low, changes direction twice, and slips out the other side unseen.`,
    ],
  },
  {
    id: 'breakaway-wall', cat: 'survival', type: 'run', stat: 'physical', stat2: 'boldness',
    basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} barrels straight through a breakaway wall. Foam bricks scatter everywhere. The monster smashes through behind ${pr.obj} — but ${n} is gone.`,
      (n,pr) => `Dead end. Or is it? ${n} throws a shoulder into the wall. It explodes outward — set construction. ${pr.Sub} burst${pr.sub==='they'?'':'s'} through laughing.`,
      (n,pr) => `The wall is fake. ${n} figures this out by running directly through it. The monster does not figure this out in time.`,
    ],
  },
];

// ── SURVIVAL: OUTSMART (6 templates) ──
const OUTSMART_ENCOUNTERS = [
  {
    id: 'read-pattern', cat: 'survival', type: 'outsmart', stat: 'strategic', stat2: 'intuition',
    basePoints: 3, maxPoints: 4,
    text: [
      (n,pr) => `${n} watches from a catwalk. Left, right, left. The monster has a pattern. ${pr.Sub} time${pr.sub==='they'?'':'s'} ${pr.posAdj} move and slip${pr.sub==='they'?'':'s'} past undetected.`,
      (n,pr) => `Three rounds of observation. ${n} has the monster's patrol mapped. When it turns right, ${pr.sub} go${pr.sub==='they'?'':'es'} left. Textbook.`,
      (n,pr) => `"It always checks the warehouse first." ${n} has been counting. ${pr.Sub} position${pr.sub==='they'?'':'s'} ${pr.ref} in the monster's blind spot and wait${pr.sub==='they'?'':'s'} it out.`,
    ],
  },
  {
    id: 'prop-decoy', cat: 'survival', type: 'outsmart', stat: 'strategic', stat2: 'mental',
    basePoints: 3, maxPoints: 4,
    text: [
      (n,pr) => `${n} rigs a mannequin in a contestant jacket and props it by a window. The monster lunges for it. ${n} is three buildings away.`,
      (n,pr) => `A dummy made from a broom and a hat. It shouldn't work. The monster demolishes it. ${n} uses the distraction to relocate.`,
      (n,pr) => `${n} sets up a decoy from wardrobe scraps — and then a second one. The monster wastes two full minutes on them.`,
    ],
  },
  {
    id: 'loop-blind-spot', cat: 'survival', type: 'outsmart', stat: 'strategic', stat2: 'physical',
    basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `The monster charges. ${n} doesn't run — ${pr.sub} step${pr.sub==='they'?'':'s'} behind a pillar and let${pr.sub==='they'?'':'s'} it pass. Then walk${pr.sub==='they'?'':'s'} in the opposite direction.`,
      (n,pr) => `${n} loops back through the monster's blind spot. It's looking north; ${pr.sub}'${pr.sub==='they'?'re':'s'} heading south. Simple geometry.`,
      (n,pr) => `While the monster tears apart a set piece, ${n} circles behind it and slips away. It never even knew ${pr.sub} ${pr.sub==='they'?'were':'was'} there.`,
    ],
  },
  {
    id: 'fire-alarm', cat: 'survival', type: 'outsmart', stat: 'strategic', stat2: 'boldness',
    basePoints: 3, maxPoints: 4,
    text: [
      (n,pr) => `${n} finds a fire alarm pull station. One yank. Sirens scream. Sprinklers activate. The monster recoils from the water — its circuits don't like that.`,
      (n,pr) => `Fire alarm. ${n} pulls it without hesitation. The sprinklers hit the monster's hydraulics and it seizes up for thirty crucial seconds.`,
      (n,pr) => `${n} sets off the fire alarm. "Sorry, Chris!" ${pr.Sub} shout${pr.sub==='they'?'':'s'}. The monster stumbles in the spray. ${n} sprints away.`,
    ],
  },
  {
    id: 'fake-trail', cat: 'survival', type: 'outsmart', stat: 'strategic',
    basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} scatters props in a trail leading away from ${pr.posAdj} actual position. The monster follows the breadcrumbs. Wrong direction.`,
      (n,pr) => `Drag marks in the dust, a knocked-over chair, an open door — ${n} leaves a fake escape route and hides in the closet next to it.`,
      (n,pr) => `${n} tosses ${pr.posAdj} jacket down a hallway. The monster investigates. ${n} goes the other way.`,
    ],
  },
  {
    id: 'golf-cart-getaway', cat: 'survival', type: 'outsmart', stat: 'mental', stat2: 'boldness',
    basePoints: 3, maxPoints: 4,
    text: [
      (n,pr) => `${n} hotwires a golf cart and floors it. The monster gives chase but the cart weaves through alleys too narrow for its bulk.`,
      (n,pr) => `A production golf cart, keys in the ignition. ${n} hops in and peels out. The monster roars. Chris on the walkie: "That's company property!"`,
      (n,pr) => `${n} finds a golf cart and drives it straight at the monster, then swerves at the last second. The monster stumbles into a prop stack.`,
    ],
  },
];

// ── SURVIVAL: CLIMB (5 templates) ──
const CLIMB_ENCOUNTERS = [
  {
    id: 'scaffolding', cat: 'survival', type: 'climb', stat: 'physical', stat2: 'endurance',
    basePoints: 2, maxPoints: 4,
    text: [
      (n,pr) => `${n} scales a scaffolding tower. The monster shakes the base but can't climb. ${n} clings on twenty feet up, knuckles white.`,
      (n,pr) => `Up the scaffolding, hand over hand. ${n} reaches the top platform and looks down. The monster circles below like a shark.`,
      (n,pr) => `The scaffolding creaks under ${pr.posAdj} weight. ${n} doesn't stop climbing. The higher ${pr.sub} go${pr.sub==='they'?'':'es'}, the safer ${pr.sub} get${pr.sub==='they'?'':'s'}.`,
    ],
  },
  {
    id: 'lighting-rig', cat: 'survival', type: 'climb', stat: 'physical', stat2: 'boldness',
    basePoints: 3, maxPoints: 4,
    text: [
      (n,pr) => `${n} shimmies up a lighting rig and straddles a beam forty feet up. The stage lights are blinding. The monster can't see ${pr.obj}.`,
      (n,pr) => `The lighting rig wasn't designed for people. ${n} doesn't care. ${pr.Sub} climb${pr.sub==='they'?'':'s'} until the monster is a speck below.`,
      (n,pr) => `${n} hangs from a spotlight mount, swinging gently. The monster searches the ground. ${n} watches from above like a gargoyle.`,
    ],
  },
  {
    id: 'water-tower', cat: 'survival', type: 'climb', stat: 'endurance', stat2: 'physical',
    basePoints: 3, maxPoints: 4,
    text: [
      (n,pr) => `The water tower ladder is rusty. ${n} climbs anyway. Each rung groans. At the top, ${pr.sub} can see the whole lot — and the monster can't reach ${pr.obj}.`,
      (n,pr) => `${n} reaches the water tower platform, gasping. Below, the monster headbutts the support legs. The whole structure sways. ${pr.Sub} hold${pr.sub==='they'?'':'s'} on tighter.`,
      (n,pr) => `From the water tower, ${n} has a bird's-eye view. The monster looks almost small from up here. Almost.`,
    ],
  },
  {
    id: 'catwalk', cat: 'survival', type: 'climb', stat: 'physical',
    basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} pulls ${pr.ref} onto a catwalk. The grating rattles under ${pr.posAdj} feet. The monster reaches up but falls short by inches.`,
      (n,pr) => `A narrow catwalk connecting two soundstages. ${n} crawls across on hands and knees. The monster passes underneath, oblivious.`,
      (n,pr) => `${n} crosses a catwalk as the monster thunders past below. The vibration nearly shakes ${pr.obj} loose. ${pr.Sub} grip${pr.sub==='they'?'':'s'} the railing and hold${pr.sub==='they'?'':'s'} on.`,
    ],
  },
  {
    id: 'fake-rooftop', cat: 'survival', type: 'climb', stat: 'physical', stat2: 'mental',
    basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} climbs onto a fake rooftop set piece. It's only twelve feet up, but the monster can't figure out how to reach ${pr.obj}. Sometimes dumb works.`,
      (n,pr) => `The "rooftop" is plywood and paint. ${n} perches on it anyway. It holds. The monster paces below, confused.`,
      (n,pr) => `${n} scrambles onto a set building's roof. Not high, but the monster keeps trying to walk through the wall instead of going around. Buying time.`,
    ],
  },
];

// ── SURVIVAL: DISTRACT (5 templates) ──
const DISTRACT_ENCOUNTERS = [
  {
    id: 'trigger-pyro', cat: 'survival', type: 'distract', stat: 'boldness',
    basePoints: 3, maxPoints: 4,
    text: [
      (n,pr) => `${n} finds the pyrotechnics control panel. One switch. BOOM. Flames shoot up thirty feet. The monster reels back. Everyone scatters.`,
      (n,pr) => `Pyro charges from an old action scene, still live. ${n} slaps the detonator. The explosion lights up the lot. The monster freezes in its tracks.`,
      (n,pr) => `${n} triggers a pyro charge and dives behind a wall. The fireball sends the monster stumbling sideways. "THAT WAS SEVEN THOUSAND DOLLARS!" Chris screams.`,
    ],
  },
  {
    id: 'fog-machine-bank', cat: 'survival', type: 'distract', stat: 'mental', stat2: 'boldness',
    basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} cranks every fog machine to maximum. Within seconds, the entire soundstage is whiteout conditions. The monster swings at nothing.`,
      (n,pr) => `Fog rolls out in waves. ${n} disappears into it. Everyone does. The monster's sensors can't cut through the artificial haze.`,
      (n,pr) => `"Let's see you find anyone now." ${n} activates the fog bank. The monster roars in frustration, blind and angry.`,
    ],
  },
  {
    id: 'barrel-ramp', cat: 'survival', type: 'distract', stat: 'physical', stat2: 'boldness',
    basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} kicks a barrel down a ramp. It crashes into the monster's legs. Not much damage, but the monster stumbles and loses its lock on the nearest target.`,
      (n,pr) => `A stack of barrels at the top of a loading ramp. ${n} puts a shoulder into them. They cascade downhill. The monster gets bowled sideways.`,
      (n,pr) => `${n} rolls a prop barrel directly at the monster. It bounces off harmlessly, but the monster turns to investigate — buying precious seconds.`,
    ],
  },
  {
    id: 'loudspeaker-blast', cat: 'survival', type: 'distract', stat: 'mental',
    basePoints: 2, maxPoints: 3,
    text: [
      (n,pr) => `${n} finds the PA system and blasts a monster roar sound effect at full volume. The real monster stops. Cocks its head. Confused.`,
      (n,pr) => `The set loudspeaker. ${n} cranks it and screams into the mic. The feedback sends the monster reeling away from the nearest hiding players.`,
      (n,pr) => `${n} hits play on the PA system. An air horn effect blares across the lot. The monster shakes its head, disoriented.`,
    ],
  },
  {
    id: 'domino-flats', cat: 'survival', type: 'distract', stat: 'strategic', stat2: 'physical',
    basePoints: 3, maxPoints: 4,
    text: [
      (n,pr) => `${n} tips a set flat. It crashes into the next one. Then the next. A domino chain of plywood walls collapses across the lot, blocking the monster's path.`,
      (n,pr) => `Set flats lined up like dominoes. ${n} shoves the first one. CRASH-CRASH-CRASH. A wall of debris separates the monster from the survivors. For now.`,
      (n,pr) => `${n} engineers a domino effect with six set pieces. The chain reaction creates a barrier the monster has to smash through, buying everyone a full minute.`,
    ],
  },
];

// ── SOCIAL: HEROIC (8 templates) ──
const HEROIC_ENCOUNTERS = [
  {
    id: 'guard-ally', cat: 'social', type: 'heroic', stat: 'loyalty',
    basePoints: 2, maxPoints: 3, needsTarget: true,
    text: [
      (n,pr,t) => `The monster closes on ${t}. ${n} steps in front. "Over here!" ${pr.Sub} wave${pr.sub==='they'?'':'s'} ${pr.posAdj} arms. The monster turns. ${t} slips away.`,
      (n,pr,t) => `${n} sees ${t} trapped. Without thinking, ${pr.sub} grab${pr.sub==='they'?'':'s'} a prop shield and plants ${pr.ref} between ${t} and the monster.`,
      (n,pr,t) => `"Stay behind me." ${n} says it to ${t} like ${pr.sub} mean${pr.sub==='they'?'':'s'} it. The monster hesitates. Something about ${pr.posAdj} stance.`,
    ],
  },
  {
    id: 'sacrifice-cover', cat: 'social', type: 'heroic', stat: 'loyalty',
    basePoints: 3, maxPoints: 4, needsTarget: true,
    text: [
      (n,pr,t) => `${n} has the perfect hiding spot. Then ${pr.sub} see${pr.sub==='they'?'':'s'} ${t} in the open. "${t}! Get in here!" ${n} gives up ${pr.posAdj} cover and runs.`,
      (n,pr,t) => `${n} pulls ${t} into ${pr.posAdj} hiding spot and climbs out. "Your turn." ${pr.Sub} take${pr.sub==='they'?'':'s'} off running with no plan and no cover.`,
      (n,pr,t) => `The hiding spot fits one. ${n} shoves ${t} in, says "Don't move," and walks out into the open. The monster is thirty feet away.`,
    ],
  },
  {
    id: 'pull-from-path', cat: 'social', type: 'heroic', stat: 'physical', stat2: 'loyalty',
    basePoints: 2, maxPoints: 3, needsTarget: true,
    text: [
      (n,pr,t) => `The monster's claw swings. ${n} grabs ${t} by the collar and yanks ${pronouns(t).obj} sideways. The claw hits empty air.`,
      (n,pr,t) => `${t} doesn't see the monster coming around the corner. ${n} does. One hard pull and they're both flat against the wall as it thunders past.`,
      (n,pr,t) => `${n} tackles ${t} out of the monster's path. They hit the ground together, roll, and scramble to cover.`,
    ],
  },
  {
    id: 'carry-injured', cat: 'social', type: 'heroic', stat: 'physical', stat2: 'loyalty',
    basePoints: 2, maxPoints: 3, needsTarget: true,
    text: [
      (n,pr,t) => `${t} twisted an ankle two rounds ago. ${n} slings ${pronouns(t).posAdj} arm over ${pr.posAdj} shoulder. "Come on. We're not stopping."`,
      (n,pr,t) => `${n} half-carries ${t} through the back lot. It's slow. It's loud. But ${pr.sub} won't leave ${pronouns(t).obj} behind.`,
      (n,pr,t) => `${t} can barely run. ${n} doesn't hesitate — fireman's carry. The monster is gaining. ${n} runs faster.`,
    ],
  },
  {
    id: 'shield-with-door', cat: 'social', type: 'heroic', stat: 'physical',
    basePoints: 2, maxPoints: 3, needsTarget: true,
    text: [
      (n,pr,t) => `${n} rips a prop door off its hinges and holds it up as a shield between ${t} and the monster. The claw dents the wood. ${n} doesn't move.`,
      (n,pr,t) => `A set door becomes a shield. ${n} braces it against the monster's advance while ${t} crawls to safety behind ${pr.obj}.`,
      (n,pr,t) => `${n} finds a steel-framed set door and stands firm. The monster hits it. ${n} slides back two feet but holds. ${t} makes it out.`,
    ],
  },
  {
    id: 'diversion-for-group', cat: 'social', type: 'heroic', stat: 'boldness', stat2: 'loyalty',
    basePoints: 3, maxPoints: 4, needsTarget: false,
    text: [
      (n,pr) => `${n} stands up in plain view. "HEY! OVER HERE!" The monster pivots. Three other players use the distraction to relocate.`,
      (n,pr) => `${n} makes a decision. ${pr.Sub} step${pr.sub==='they'?'':'s'} out of cover and bang${pr.sub==='they'?'':'s'} a pipe against a wall. Every eye — including the monster's — turns to ${pr.obj}. Everyone else runs.`,
      (n,pr) => `${n} draws the monster's attention on purpose. It's selfless. It's stupid. Chris calls it "great TV."`,
    ],
  },
  {
    id: 'calm-panicker', cat: 'social', type: 'heroic', stat: 'social', stat2: 'loyalty',
    basePoints: 2, maxPoints: 2, needsTarget: true,
    text: [
      (n,pr,t) => `${t} is hyperventilating. ${n} grabs ${pronouns(t).posAdj} shoulders. "Look at me. Breathe. We're gonna be fine." ${t} steadies.`,
      (n,pr,t) => `"Hey. Hey! Focus." ${n} snaps ${pr.posAdj} fingers in front of ${t}'s face. It works. ${t} stops freezing and starts moving.`,
      (n,pr,t) => `${t} is about to scream. ${n} covers ${pronouns(t).posAdj} mouth gently. "Not yet. Trust me." ${t} nods. They stay hidden.`,
    ],
  },
  {
    id: 'block-corridor', cat: 'social', type: 'heroic', stat: 'physical', stat2: 'loyalty',
    basePoints: 2, maxPoints: 3, needsTarget: false,
    text: [
      (n,pr) => `${n} drags a heavy set piece across a corridor. It won't stop the monster, but it'll slow it down. The others get a head start.`,
      (n,pr) => `${n} jams a steel beam across a doorway. The monster hits it and staggers. By the time it breaks through, everyone is gone.`,
      (n,pr) => `Barricade duty. ${n} stacks crates, chairs, anything heavy. It buys thirty seconds. In monster time, that's a lifetime.`,
    ],
  },
];

// ── SOCIAL: SHOWMANCE (4 templates) ──
const SHOWMANCE_ENCOUNTERS = [
  {
    id: 'hide-together', cat: 'social', type: 'showmance', stat: 'social',
    basePoints: 2, maxPoints: 2,
    text: [
      (n,pr,t) => `${n} and ${t} find each other in the chaos. They squeeze into a storage closet together. Neither speaks. They don't need to.`,
      (n,pr,t) => `${n} reaches for ${t}'s hand in the dark. The monster's footsteps fade. Their breathing slows together.`,
      (n,pr,t) => `Behind a set wall, ${n} and ${t} sit shoulder to shoulder. The monster passes. ${t} whispers: "Still alive?" ${n}: "Still alive."`,
    ],
  },
  {
    id: 'pull-to-safety', cat: 'social', type: 'showmance', stat: 'physical', stat2: 'loyalty',
    basePoints: 2, maxPoints: 3,
    text: [
      (n,pr,t) => `The monster rounds a corner. ${n} grabs ${t} and pulls ${pronouns(t).obj} behind a wall. They press together, barely breathing, as the monster passes.`,
      (n,pr,t) => `${n} sees ${t} exposed. No hesitation — ${pr.sub} sprint${pr.sub==='they'?'':'s'} across open ground, grab${pr.sub==='they'?'':'s'} ${pronouns(t).posAdj} arm, and drag${pr.sub==='they'?'':'s'} ${pronouns(t).obj} to cover.`,
      (n,pr,t) => `"Come on!" ${n} pulls ${t} through a window into a set building. They land in a heap. ${t} starts to speak. ${n} puts a finger to ${pr.posAdj} lips.`,
    ],
  },
  {
    id: 'argue-direction', cat: 'social', type: 'showmance', stat: 'social',
    basePoints: 1, maxPoints: 2,
    text: [
      (n,pr,t) => `"This way!" "No, THAT way!" ${n} and ${t} whisper-argue about which direction to run. They compromise by standing still. The monster walks right past.`,
      (n,pr,t) => `${n} wants to go left. ${t} wants to go right. They bicker for ten seconds, then the monster settles it by blocking the left path.`,
      (n,pr,t) => `"You never listen!" ${t} hisses. "I'm trying to save us!" ${n} hisses back. Somehow the argument is quieter than most conversations.`,
    ],
  },
  {
    id: 'freeze-together', cat: 'social', type: 'showmance', stat: 'endurance',
    basePoints: 2, maxPoints: 2,
    text: [
      (n,pr,t) => `The monster stops right next to ${n} and ${t}. Neither moves. Neither breathes. ${t}'s hand finds ${n}'s. They squeeze. The monster moves on.`,
      (n,pr,t) => `Frozen in place. ${n} and ${t} lock eyes. The monster is so close they can feel the heat from its hydraulics. It passes. They exhale together.`,
      (n,pr,t) => `Complete stillness. ${n} and ${t}, inches from each other, inches from the monster. It sniffs the air. Turns. Leaves. They collapse against each other in relief.`,
    ],
  },
];

// ── SOCIAL: ALLIANCE/BOND (5 templates) ──
const ALLIANCE_ENCOUNTERS = [
  {
    id: 'share-intel', cat: 'social', type: 'alliance', stat: 'strategic', stat2: 'social',
    basePoints: 2, maxPoints: 2, needsTarget: true,
    text: [
      (n,pr,t) => `${n} catches ${t}'s eye from across the lot. Points left, shakes ${pr.posAdj} head. Points right, nods. ${t} gets the message. The monster went right.`,
      (n,pr,t) => `"Warehouse is clear, parking structure is NOT." ${n} whispers the intel to ${t} in passing. No time for pleasantries.`,
      (n,pr,t) => `${n} and ${t} develop a hand signal system on the fly. Fist means stop. Palm means run. Two fingers means the monster is behind you.`,
    ],
  },
  {
    id: 'group-sprint', cat: 'social', type: 'alliance', stat: 'social', stat2: 'physical',
    basePoints: 2, maxPoints: 2, needsTarget: true,
    text: [
      (n,pr,t) => `"On three." ${n} and ${t} burst from cover simultaneously, splitting in opposite directions. The monster can only chase one.`,
      (n,pr,t) => `${n} and ${t} coordinate a run. One goes first, draws attention. The other follows on the blind side. Teamwork.`,
      (n,pr,t) => `${n} nods at ${t}. They run together, matching pace, covering ground. Two targets are harder to catch than one.`,
    ],
  },
  {
    id: 'promise-watch', cat: 'social', type: 'alliance', stat: 'loyalty', stat2: 'social',
    basePoints: 1, maxPoints: 2, needsTarget: true,
    text: [
      (n,pr,t) => `"I'll watch the west corridor. You watch east." ${n} and ${t} split up, but with a plan. Trust over panic.`,
      (n,pr,t) => `"If either of us sees it coming, we warn the other. Deal?" ${n} holds out a hand. ${t} takes it.`,
      (n,pr,t) => `${n} and ${t} set up a buddy system. Check in every few minutes. It's not much, but it's more than most have.`,
    ],
  },
  {
    id: 'reluctant-split', cat: 'social', type: 'alliance', stat: 'strategic',
    basePoints: 1, maxPoints: 2, needsTarget: true,
    text: [
      (n,pr,t) => `"We need to split up." ${n} says it like ${pr.sub} don't believe it. ${t} nods slowly. A last look, then they go separate ways.`,
      (n,pr,t) => `The hiding spot won't fit both of them. ${n} and ${t} exchange a glance — who stays, who goes? ${n} leaves. ${t} stays.`,
      (n,pr,t) => `"Together we're a bigger target." ${n} is right. ${t} knows it. They separate. It feels wrong immediately.`,
    ],
  },
  {
    id: 'reunite-relief', cat: 'social', type: 'alliance', stat: 'social', stat2: 'loyalty',
    basePoints: 2, maxPoints: 2, needsTarget: true,
    text: [
      (n,pr,t) => `${n} rounds a corner and nearly collides with ${t}. A beat. Then relief. "You're alive." "So are you." They keep moving.`,
      (n,pr,t) => `${n} finds ${t} hiding in the prop warehouse. A nod. A breath. Neither says "I'm glad you're okay," but both think it.`,
      (n,pr,t) => `"I thought the monster got you!" ${n} grabs ${t}'s arm. "Not yet." They're both grinning. Adrenaline does that.`,
    ],
  },
];

// ── SOCIAL: CAUGHT POOL (4 templates) ──
const CAUGHT_POOL_ENCOUNTERS = [
  {
    id: 'taunt-from-pool', cat: 'social', type: 'caught-pool', stat: 'social', stat2: 'boldness',
    basePoints: 0, maxPoints: 0, needsTarget: true,
    text: [
      (n,pr,t) => `From the bounce house, ${n} cups ${pr.posAdj} hands: "Hey ${t}! Behind you!" ${t} spins. Nothing there. ${n} cackles.`,
      (n,pr,t) => `"${t}! You're still out there? I give it one more round!" ${n} shouts from the captured pool, bouncing gleefully.`,
      (n,pr,t) => `${n} waves from the bounce house. "Having fun out there, ${t}?" It's easy to be brave when you've already been caught.`,
    ],
  },
  {
    id: 'cheer-ally', cat: 'social', type: 'caught-pool', stat: 'loyalty',
    basePoints: 0, maxPoints: 0, needsTarget: true,
    text: [
      (n,pr,t) => `"Come on, ${t}! You've got this!" ${n} yells from the bounce house. It's not helpful. But ${t} stands a little taller.`,
      (n,pr,t) => `${n} leads a chant from the captured pool: "${t}! ${t}! ${t}!" The monster seems annoyed by it.`,
      (n,pr,t) => `"Keep going, ${t}!" ${n} shouts. ${pr.Sub}'${pr.sub==='they'?'re':'s'} genuinely worried about ${pronouns(t).obj}. The bounce house bouncing undercuts the drama slightly.`,
    ],
  },
  {
    id: 'give-away-position', cat: 'social', type: 'caught-pool', stat: 'strategic',
    basePoints: -1, maxPoints: -1, needsTarget: true, isSabotage: true,
    text: [
      (n,pr,t) => `${n} points directly at ${t}'s hiding spot. "OVER THERE, CHEF!" The monster pivots. ${t}'s cover is blown.`,
      (n,pr,t) => `"Check the prop warehouse! ${t}'s in there!" ${n} sells out ${t}'s position from the captured area. The monster heads straight for it.`,
      (n,pr,t) => `${n} mouths "behind the car" to no one in particular. But the monster seems to get the hint. It heads toward ${t}.`,
    ],
  },
  {
    id: 'betting-pool', cat: 'social', type: 'caught-pool', stat: 'social',
    basePoints: 0, maxPoints: 0,
    text: [
      (n,pr) => `${n} starts taking bets in the bounce house. "Five bucks says the monster gets the tall one next." The other captured players join in.`,
      (n,pr) => `The bounce house has become a social club. ${n} has organized a running commentary. "Ooh, close one! That's going to cost someone."`,
      (n,pr) => `${n} has made peace with being caught. ${pr.Sub}'${pr.sub==='they'?'re':'s'} now ranking the remaining players' survival chances out loud. It's surprisingly accurate.`,
    ],
  },
];

// ── VILLAIN: SABOTAGE (6 templates) ──
const SABOTAGE_ENCOUNTERS = [
  {
    id: 'lure-monster', cat: 'villain', type: 'sabotage', stat: 'strategic', stat2: 'boldness',
    basePoints: -1, maxPoints: -1, needsTarget: true, catchBoost: 0.2, heat: 1.5,
    text: [
      (n,pr,t) => `${n} kicks a trash can near ${t}'s position. CLANG. The monster swivels. ${n} is already gone. ${t} is not.`,
      (n,pr,t) => `${n} drops a metal pipe near where ${t} is hiding. The noise echoes. The monster's head turns. ${n} watches from the shadows.`,
      (n,pr,t) => `A deliberate noise near ${t}'s hiding spot. ${n} made it look accidental. The monster is already heading that way.`,
    ],
  },
  {
    id: 'trip-someone', cat: 'villain', type: 'sabotage', stat: 'physical',
    basePoints: -2, maxPoints: -2, needsTarget: true, catchBoost: 0, heat: 1.5,
    text: [
      (n,pr,t) => `${t} sprints past. ${n}'s foot shoots out. ${t} goes down hard, skidding across the pavement. The monster closes in.`,
      (n,pr,t) => `"Oops." ${n} sticks a leg out as ${t} runs by. ${t} hits the ground face-first. ${n} doesn't look back.`,
      (n,pr,t) => `${n} clotheslines ${t} with an arm across the corridor. ${t} drops. ${n} keeps running. Cold.`,
    ],
  },
  {
    id: 'use-decoy', cat: 'villain', type: 'sabotage', stat: 'strategic',
    basePoints: -1, maxPoints: -1, needsTarget: true, catchBoost: 0.1, heat: 2.0,
    text: [
      (n,pr,t) => `${n} grabs ${t} and shoves ${pronouns(t).obj} toward the monster. "Sorry. Survival." ${n} disappears while the monster locks on ${t}.`,
      (n,pr,t) => `"Quick, this way!" ${n} leads ${t} around a corner — directly into the monster's path. Then ${n} runs the other way.`,
      (n,pr,t) => `${n} uses ${t} as a human shield, ducking behind ${pronouns(t).obj} when the monster appears. Then ${pr.sub} bolt${pr.sub==='they'?'':'s'}, leaving ${t} exposed.`,
    ],
  },
  {
    id: 'shove-from-cover', cat: 'villain', type: 'sabotage', stat: 'physical', stat2: 'boldness',
    basePoints: -2, maxPoints: -2, needsTarget: true, catchBoost: 0.15, heat: 2.0,
    text: [
      (n,pr,t) => `${n} rips the cover away from ${t}'s hiding spot. ${t} stumbles into the open. The monster sees ${pronouns(t).obj} immediately.`,
      (n,pr,t) => `A hard shove sends ${t} sprawling out from behind a crate. ${n} takes the now-empty spot. The monster has a new target.`,
      (n,pr,t) => `${n} knocks over the set flat ${t} was hiding behind. It crashes down. ${t} stands exposed. ${n} is already hidden somewhere else.`,
    ],
  },
  {
    id: 'lock-door', cat: 'villain', type: 'sabotage', stat: 'strategic', stat2: 'mental',
    basePoints: -1, maxPoints: -1, needsTarget: true, catchBoost: 0.1, heat: 1.5,
    text: [
      (n,pr,t) => `${n} slips through a door and locks it behind ${pr.obj}. ${t} reaches the same door seconds later. Locked. The monster is right behind ${pronouns(t).obj}.`,
      (n,pr,t) => `${n} wedges a chair under a door handle after passing through. ${t} slams into it from the other side. Won't budge. ${t}'s escape route is cut off.`,
      (n,pr,t) => `The exit door. ${n} goes through and — click — locks it. From the other side, ${t}'s frantic banging. Then silence. Then the monster.`,
    ],
  },
  {
    id: 'kick-hiding-prop', cat: 'villain', type: 'sabotage', stat: 'boldness',
    basePoints: -1, maxPoints: -1, needsTarget: true, catchBoost: 0.1, heat: 1.5,
    text: [
      (n,pr,t) => `${n} kicks over the crate ${t} is crouching behind. Just kicks it. Doesn't even slow down. ${t} is suddenly very visible.`,
      (n,pr,t) => `${n} "accidentally" bumps the prop stack ${t} was hiding in. It topples. ${t} scrambles. The monster notices.`,
      (n,pr,t) => `As ${n} passes ${t}'s hiding spot, ${pr.sub} casually shove${pr.sub==='they'?'':'s'} the costume rack aside. "Oh no, did I do that?" ${n} doesn't stop walking.`,
    ],
  },
];

// ── VILLAIN: SCHEMING (5 templates) ──
const SCHEMING_ENCOUNTERS = [
  {
    id: 'fake-directions', cat: 'villain', type: 'scheming', stat: 'social', stat2: 'strategic',
    basePoints: -1, maxPoints: -1, needsTarget: true, heat: 1.0,
    text: [
      (n,pr,t) => `"The monster went east!" ${n} tells ${t}. The monster actually went west. ${t} runs directly into its path.`,
      (n,pr,t) => `${n} waves ${t} over frantically. "Safe zone, over here!" It is not a safe zone. Not even close.`,
      (n,pr,t) => `"I just saw it go into the warehouse." ${n} points. ${t} heads for the warehouse — where the monster is definitely NOT. Or IS. ${n} smirks.`,
    ],
  },
  {
    id: 'point-out-position', cat: 'villain', type: 'scheming', stat: 'strategic',
    basePoints: -1, maxPoints: -1, needsTarget: true, catchBoost: 0.15, heat: 1.5,
    text: [
      (n,pr,t) => `${n} doesn't say anything. Just makes eye contact with the monster and glances toward ${t}'s hiding spot. The monster follows ${pr.posAdj} gaze.`,
      (n,pr,t) => `A subtle gesture. ${n} tips ${pr.posAdj} head toward where ${t} is hiding. The monster pauses. Then heads that direction.`,
      (n,pr,t) => `${n} coughs loudly near ${t}'s position. Not near enough to draw attention to ${pr.ref} — just close enough to draw it to ${t}.`,
    ],
  },
  {
    id: 'steal-escape-route', cat: 'villain', type: 'scheming', stat: 'strategic', stat2: 'physical',
    basePoints: -1, maxPoints: -1, needsTarget: true, heat: 1.5,
    text: [
      (n,pr,t) => `${n} and ${t} are both heading for the same exit. ${n} gets there first and blocks it. "Find your own way out." ${t} has to backtrack.`,
      (n,pr,t) => `${n} spots ${t}'s planned escape route and takes it first. When ${t} arrives, ${n} is already through and gone.`,
      (n,pr,t) => `The gap in the fence — their best exit. ${n} squeezes through and pushes a crate against it from the other side. ${t} finds it blocked.`,
    ],
  },
  {
    id: 'pretend-help-bail', cat: 'villain', type: 'scheming', stat: 'social', stat2: 'strategic',
    basePoints: -1, maxPoints: -1, needsTarget: true, heat: 2.0,
    text: [
      (n,pr,t) => `"Follow me, I know a safe spot!" ${n} leads ${t} into an open area with zero cover. "Oh no." ${n} runs. ${t} doesn't.`,
      (n,pr,t) => `${n} offers a hand to pull ${t} up. Gets ${pronouns(t).obj} standing. Then lets go and sprints away as the monster appears. "Nothing personal!"`,
      (n,pr,t) => `"We'll go together." ${n} says it convincingly. They run together for exactly four seconds before ${n} peels off. ${t} doesn't notice until it's too late.`,
    ],
  },
  {
    id: 'noisy-prop-plant', cat: 'villain', type: 'scheming', stat: 'mental', stat2: 'strategic',
    basePoints: -1, maxPoints: -1, needsTarget: true, heat: 1.0,
    text: [
      (n,pr,t) => `${n} balances a stack of tin cans near ${t}'s position. One wrong move and the clatter will bring the monster running.`,
      (n,pr,t) => `${n} places a squeaky prop right where ${t} will step. When ${t} shifts position — SQUEAK. The monster's head snaps around.`,
      (n,pr,t) => `A windchime from the set. ${n} hangs it right above ${t}'s hiding spot. One breeze and ${t}'s cover is blown.`,
    ],
  },
];

// ── VILLAIN: CONFRONTATION (4 templates) ──
const CONFRONTATION_ENCOUNTERS = [
  {
    id: 'caught-in-act', cat: 'villain', type: 'confrontation', stat: 'intuition',
    basePoints: 1, maxPoints: 2, needsTarget: true,
    text: [
      (n,pr,t) => `${n} sees ${t} kick over someone's cover. "I saw that." ${t} freezes. "You saw nothing." "I saw EVERYTHING."`,
      (n,pr,t) => `"You led them straight into the monster." ${n} steps out. ${t} tries to play innocent. ${n} isn't buying it.`,
      (n,pr,t) => `${n} watched the whole thing. ${t} sabotaging. ${t} lying. "When we get back to camp," ${n} says quietly, "everyone's going to know."`,
    ],
  },
  {
    id: 'fight-over-spot', cat: 'villain', type: 'confrontation', stat: 'physical', stat2: 'boldness',
    basePoints: 1, maxPoints: 2, needsTarget: true,
    text: [
      (n,pr,t) => `One hiding spot. Two people. ${n} and ${t} stare each other down. "I was here first." "I'm here NOW."`,
      (n,pr,t) => `${n} finds ${t} in the spot ${pr.sub} had picked out. A tense standoff. The monster's footsteps are getting louder. Someone has to leave.`,
      (n,pr,t) => `"Move." "No." ${n} and ${t} waste precious seconds arguing over a hiding spot. The monster is three corridors away and closing.`,
    ],
  },
  {
    id: 'victim-calls-out', cat: 'villain', type: 'confrontation', stat: 'social', stat2: 'boldness',
    basePoints: 1, maxPoints: 2, needsTarget: true,
    text: [
      (n,pr,t) => `From the captured pool, ${n} points at ${t}. "${t} shoved me into the monster's path! That's how I got caught!" Everyone stares.`,
      (n,pr,t) => `"${t} locked the door on me!" ${n} shouts from the bounce house. "I was TRAPPED because of ${pronouns(t).obj}!" Chris: "Drama! Love it."`,
      (n,pr,t) => `${n} stands up in the bounce house. "I want everyone to know — ${t} used me as a decoy. ${pronouns(t).Sub} left me for the monster."`,
    ],
  },
  {
    id: 'retaliate-expose', cat: 'villain', type: 'confrontation', stat: 'boldness', stat2: 'strategic',
    basePoints: 1, maxPoints: 2, needsTarget: true,
    text: [
      (n,pr,t) => `${n} saw ${t} sabotage someone last round. Now ${n} "accidentally" reveals ${t}'s position by walking loudly near it. Payback.`,
      (n,pr,t) => `${n} catches ${t}'s eye. Points at ${pronouns(t).obj}. Points at the monster. Mouths: "Your turn." ${t} goes pale.`,
      (n,pr,t) => `${n} makes noise near ${t}'s spot — not enough to guarantee capture, but enough to make ${t} sweat. "Consider us even."`,
    ],
  },
];

// ── ENVIRONMENTAL: SET DESTRUCTION (5 templates) ──
const SET_DESTRUCTION_EVENTS = [
  {
    id: 'wall-collapse', cat: 'environmental', type: 'set-destruction', minThreat: 3,
    text: [
      () => `A set wall buckles and crashes to the ground. Dust billows. The monster walks through the gap like it was always there.`,
      () => `CRACK. A support beam gives way. An entire facade crumbles. Anyone hiding behind it scrambles for new cover.`,
      () => `The monster shoulder-checks a wall. It doesn't just crack — the whole structure folds like cardboard. Because it IS cardboard.`,
    ],
  },
  {
    id: 'catwalk-breaks', cat: 'environmental', type: 'set-destruction', minThreat: 4,
    text: [
      () => `A catwalk shears from its mounts and swings down like a pendulum. Metal screams. The landing zone becomes a no-go.`,
      () => `The monster's bulk clips a support column. A catwalk above groans, sags, and drops. Steel and cable everywhere.`,
      () => `SNAP. Catwalk cables go one by one. The walkway sags, tilts, and dumps lighting equipment across the floor.`,
    ],
  },
  {
    id: 'facade-falls', cat: 'environmental', type: 'set-destruction', minThreat: 2,
    text: [
      () => `A building facade topples forward with a theatrical groan. It's only plywood, but the CRASH is real enough.`,
      () => `The "Main Street" storefront falls flat. The whole thing. Like someone pulled the world's worst curtain.`,
      () => `A set piece crashes down — the "bank" front. It hits the ground with a boom that echoes across the lot.`,
    ],
  },
  {
    id: 'ceiling-cave', cat: 'environmental', type: 'set-destruction', minThreat: 4,
    text: [
      () => `Inside Stage 5, a section of ceiling collapses. Insulation rains down. Dust fills the air. The monster roars through the debris.`,
      () => `The monster rams a support beam. The ceiling above groans and drops in chunks. What was shelter is now a hazard zone.`,
      () => `Ceiling tiles cascade down like the world's worst snowfall. The stage is compromised. Everyone inside needs new hiding spots.`,
    ],
  },
  {
    id: 'floor-gives', cat: 'environmental', type: 'set-destruction', minThreat: 3,
    text: [
      () => `The monster steps on a weak spot. The floor caves in. It drops six feet and roars — stuck for a moment before hauling itself out.`,
      () => `A section of elevated flooring collapses under the monster's weight. For thirty seconds, it's trapped. Then it tears free.`,
      () => `The set floor isn't rated for a multi-ton animatronic. The monster crashes through. Two survivors use the pause to relocate.`,
    ],
  },
];

// ── ENVIRONMENTAL: ATMOSPHERE (5 templates) ──
const ATMOSPHERE_EVENTS = [
  {
    id: 'power-flicker', cat: 'environmental', type: 'atmosphere',
    text: [
      () => `The lights flicker. Once. Twice. Then the entire soundstage goes dark. Three seconds of absolute silence. The lights slam back on. The monster is closer.`,
      () => `Power fluctuation. The lights buzz, dim, and recover. In that half-second of darkness, everyone repositions. Smart.`,
      () => `Fluorescent lights pop overhead, one by one, like a horror movie countdown. The darkness spreads from east to west.`,
    ],
  },
  {
    id: 'fog-rolls', cat: 'environmental', type: 'atmosphere',
    text: [
      () => `Ground fog creeps across the lot, knee-high and getting thicker. The monster's feet disappear. Then its legs. Good for hiding. Bad for seeing it coming.`,
      () => `A fog bank rolls in — real fog, not the machines. Visibility drops to twenty feet. The monster is somewhere in it.`,
      () => `Mist settles over the film lot like a blanket. Shapes move in it. Most of them are shadows. One of them isn't.`,
    ],
  },
  {
    id: 'distant-roar', cat: 'environmental', type: 'atmosphere',
    text: [
      () => `A roar from somewhere deep in the lot. Everyone freezes. Where is it? Close? Far? The echo makes it impossible to tell.`,
      () => `The monster roars. It's not close — but it's not far enough. The sound rattles loose screws and vibrates through the floor.`,
      () => `ROAAAAR. Every bird on the lot takes flight simultaneously. The roar fades. Then the footsteps start.`,
    ],
  },
  {
    id: 'emergency-lights', cat: 'environmental', type: 'atmosphere', minThreat: 3,
    text: [
      () => `Emergency lights kick in — red, pulsing. Everything is cast in bloody light. The monster's silhouette stretches across the walls.`,
      () => `The backup generators engage. Red light floods the corridors. It's worse than the dark — now everything looks like a horror movie.`,
      () => `Red emergency lighting. The set goes from abandoned film lot to active nightmare. Shadows crawl in every direction.`,
    ],
  },
  {
    id: 'sprinklers', cat: 'environmental', type: 'atmosphere',
    text: [
      () => `Sprinklers activate from the ceiling. Water everywhere. The monster's hydraulics hiss on contact. It slows down — but doesn't stop.`,
      () => `The fire suppression system kicks in. Rain inside. Everyone's soaked. The monster sparks and sputters but keeps moving.`,
      () => `Water from the sprinklers turns the floor slippery. The monster slides. People slide. Nobody has traction. Chaos.`,
    ],
  },
];

// ── ENVIRONMENTAL: MONSTER BEHAVIOR (5 templates) ──
const MONSTER_BEHAVIOR_EVENTS = [
  {
    id: 'monster-sniff', cat: 'environmental', type: 'monster-behavior',
    text: [
      () => `The monster pauses. Tilts its head. Sniffs the air with a mechanical whirring. Its sensors are scanning. Someone nearby holds their breath.`,
      () => `A metallic sniffing sound. The monster's head sweeps left, right, left. Its targeting array is searching. Everyone within fifty feet goes very still.`,
      () => `The animatronic stops. Its nose sensor extends and rotates. It's smelling for heat signatures. Or sweat. Or fear.`,
    ],
  },
  {
    id: 'monster-destroy-search', cat: 'environmental', type: 'monster-behavior', minThreat: 3,
    text: [
      () => `The monster doesn't bother searching the set building. It walks straight through the wall. Inside: nothing. But the building is now in pieces.`,
      () => `Systematic destruction. The monster tears apart a row of props looking for someone. It doesn't find anyone — but nobody can use those props again.`,
      () => `The monster rips a door off its hinges, checks inside, and moves on. It's getting smarter. Methodical. This isn't random anymore.`,
    ],
  },
  {
    id: 'monster-stuck', cat: 'environmental', type: 'monster-behavior',
    text: [
      () => `The monster gets wedged between two structures. Gears grind. Chef's voice crackles over the walkie: "Hold on, hold on — the left arm is stuck!" Chris: "FIX IT!"`,
      () => `A cable wraps around the monster's foot. It stumbles, roars, and tears free — but it bought everyone a full round of breathing room.`,
      () => `The monster rams a narrow alley and gets stuck. Its claws scrape concrete. Chef: "REVERSE! REVERSE!" Thirty seconds of peace.`,
    ],
  },
  {
    id: 'monster-reflection', cat: 'environmental', type: 'monster-behavior',
    text: [
      () => `The monster catches its own reflection in a prop mirror. It stops. Stares. Tilts its head. Then smashes the mirror. Seven years of bad luck for an animatronic.`,
      () => `A window. The monster sees something move. Charges. Smashes through — it was its own reflection. Chef: "That's coming out of YOUR pay, Chris."`,
      () => `The monster pauses in front of a reflective surface. For one weird moment, it looks... curious. Then it eats the mirror.`,
    ],
  },
  {
    id: 'monster-malfunction', cat: 'environmental', type: 'monster-behavior',
    text: [
      () => `Sparks fly from the monster's shoulder joint. It freezes mid-step, shudders, and recalibrates. Chef: "Don't you DARE die on me now!" It roars back to life.`,
      () => `The monster's left arm locks up. It swings in circles for a moment, then Chef reboots the servos. It comes back angrier.`,
      () => `A grinding sound from inside the monster. It stops. Smoke rises from a seam. Then it lurches forward again, one eye flickering.`,
    ],
  },
];

// ── COMEDY BEATS (8 templates) ──
const COMEDY_ENCOUNTERS = [
  {
    id: 'phone-goes-off', cat: 'comedy', type: 'comedy', stat: 'temperament',
    basePoints: -1, maxPoints: -1,
    text: [
      (n,pr) => `${n}'s phone goes off. Full volume. It's ${pr.posAdj} mom. The monster turns. ${n} stares at the phone in horror. "NOT NOW, MOM."`,
      (n,pr) => `A ringtone — the default one. ${n} fumbles for ${pr.posAdj} pocket. Everyone within earshot glares. The monster's already moving.`,
      (n,pr) => `${n}'s alarm goes off. 7:00 AM wake-up call. In the middle of a monster hunt. ${pr.Sub} forgot to turn it off.`,
    ],
  },
  {
    id: 'worst-sneeze', cat: 'comedy', type: 'comedy', stat: 'endurance',
    basePoints: -1, maxPoints: -1,
    text: [
      (n,pr) => `${n} holds it for as long as ${pr.sub} can. Then: "ACHOO!" It echoes across the entire lot. The monster pivots. Everyone groans.`,
      (n,pr) => `The sneeze is catastrophic. ${n} tries to muffle it in ${pr.posAdj} sleeve. It sounds like a small explosion. The monster heard it from three sets away.`,
      (n,pr) => `Dust in the prop warehouse. ${n}'s nose twitches. "No no no no—" SNEEZE. "...Ugh."`,
    ],
  },
  {
    id: 'confetti-cannon', cat: 'comedy', type: 'comedy', stat: 'mental',
    basePoints: -1, maxPoints: -1,
    text: [
      (n,pr) => `${n} leans against a prop and accidentally triggers a confetti cannon. BOOM. Streamers everywhere. The monster turns. ${n} stands in a cloud of glitter.`,
      (n,pr) => `A party prop. ${n} bumps it. Confetti explosion. If the monster wasn't looking before, it is now.`,
      (n,pr) => `Confetti cannon. Point blank. ${n} is covered in paper streamers and shame. The monster is already heading over to investigate.`,
    ],
  },
  {
    id: 'collide-running', cat: 'comedy', type: 'comedy', stat: 'physical',
    basePoints: -1, maxPoints: -1, needsTarget: true,
    text: [
      (n,pr,t) => `${n} sprints around a corner. ${t} sprints around the same corner from the other side. They collide. Both go down. The monster is fifty feet away.`,
      (n,pr,t) => `Full speed, opposite directions. ${n} and ${t} meet in the middle. Stars. Pain. Then: "MOVE!" They scramble apart.`,
      (n,pr,t) => `${n} runs headfirst into ${t}. They tumble. "Watch where you're—" "ME?! YOU watch—" The argument dies when the ground shakes.`,
    ],
  },
  {
    id: 'port-a-potty', cat: 'comedy', type: 'comedy', stat: 'endurance',
    basePoints: 1, maxPoints: 2,
    text: [
      (n,pr) => `${n} dives into a port-a-potty. It's occupied by a raccoon. They stare at each other. The monster walks past. ${n} and the raccoon have an understanding.`,
      (n,pr) => `The port-a-potty. Last resort. ${n} climbs in and immediately regrets every choice that led to this moment. But the monster doesn't check bathrooms.`,
      (n,pr) => `${n} hides in a port-a-potty. It tips over. ${n} is now trapped in a horizontal bathroom. The monster walks past. Small mercies.`,
    ],
  },
  {
    id: 'mannequin-mistake', cat: 'comedy', type: 'comedy', stat: 'mental',
    basePoints: 0, maxPoints: 0,
    text: [
      (n,pr) => `${n} rounds a corner and screams. It's a mannequin. Dressed as a monster. ${pr.Sub} just screamed at a prop. Two other players heard.`,
      (n,pr) => `A shape in the dark. ${n} freezes. Heart hammering. It's... a mannequin in a lab coat. ${n} has to sit down for a minute.`,
      (n,pr) => `${n} punches a mannequin thinking it's the monster. The mannequin falls over dramatically. ${n}: "I knew it was fake." ${pr.Sub} did not know it was fake.`,
    ],
  },
  {
    id: 'skateboard-monster', cat: 'comedy', type: 'comedy',
    basePoints: 0, maxPoints: 0,
    text: [
      () => `The monster steps on a skateboard. It wobbles. It rolls. For three beautiful seconds, the monster rides a skateboard. Then it crashes. Chef screams.`,
      () => `Someone left a skateboard on set. The monster's foot lands on it and slides sideways. The resulting stumble destroys a mailbox and a fire hydrant.`,
      () => `A skateboard under the monster's foot. It goes nowhere and everywhere simultaneously. The crash is spectacular. The damage is expensive.`,
    ],
  },
  {
    id: 'chris-trailer', cat: 'comedy', type: 'comedy',
    basePoints: 0, maxPoints: 0,
    text: [
      () => `The monster rams into Chris's private trailer. Chris on walkie: "NOT THE TRAILER! THAT HAS MY HAIR PRODUCTS!" The monster backs away. Even it has limits.`,
      () => `Chef steers the monster toward a trailer. CRASH. Chris: "Was that MY trailer?!" Chef: "No comment." Chris: "CHEF!"`,
      () => `The monster stumbles into a parked trailer and flips it. Coffee spills. A blow dryer falls out. Chris: "That's it. Someone's paying for this."`,
    ],
  },
];

// ── PANIC / MISFORTUNE (6 templates) ──
const PANIC_ENCOUNTERS = [
  {
    id: 'panic-freeze', cat: 'panic', type: 'panic', stat: 'temperament',
    basePoints: -2, maxPoints: -2, invertStat: true,
    text: [
      (n,pr) => `${n} freezes. Legs won't move. The monster is RIGHT THERE. ${pr.PosAdj} brain says run. ${pr.PosAdj} body says absolutely not.`,
      (n,pr) => `Panic locks ${n} in place. Eyes wide. Breathing fast. The world narrows to the monster's footsteps. Everything else is white noise.`,
      (n,pr) => `${n}'s legs give out. Not from exhaustion — from fear. ${pr.Sub} crouch${pr.sub==='they'?'':'es'} behind a wall and can't make ${pr.ref} stand back up.`,
    ],
  },
  {
    id: 'trip-own-feet', cat: 'panic', type: 'panic', stat: 'physical',
    basePoints: -1, maxPoints: -1, invertStat: true,
    text: [
      (n,pr) => `${n} trips over ${pr.posAdj} own feet. Just... falls. On flat ground. The monster doesn't even need to try.`,
      (n,pr) => `Running too fast to think. ${n}'s foot catches ${pr.posAdj} other foot. Down ${pr.sub} go${pr.sub==='they'?'':'es'}.`,
      (n,pr) => `${n} stumbles on absolutely nothing. Face-first into the pavement. ${pr.Sub} taste${pr.sub==='they'?'':'s'} concrete and regret.`,
    ],
  },
  {
    id: 'tangled-cables', cat: 'panic', type: 'panic', stat: 'physical',
    basePoints: -1, maxPoints: -1,
    text: [
      (n,pr) => `Power cables on the ground. ${n}'s foot catches one. Then the other foot. ${pr.Sub}'${pr.sub==='they'?'re':'s'} wrapped up like a present. A very panicked present.`,
      (n,pr) => `${n} gets tangled in a nest of cables. The more ${pr.sub} struggle${pr.sub==='they'?'':'s'}, the worse it gets. The monster's footsteps grow louder.`,
      (n,pr) => `An extension cord. ${n}'s ankle. A terrible combination. ${pr.Sub} hit${pr.sub==='they'?'':'s'} the ground and frantically kick${pr.sub==='they'?'':'s'} free.`,
    ],
  },
  {
    id: 'hiding-spot-decay', cat: 'panic', type: 'panic', stat: 'endurance',
    basePoints: -1, maxPoints: -1,
    text: [
      (n,pr) => `${n}'s hiding spot is falling apart. The prop wall leans. Creaks. Tilts. ${pr.Sub} abandon${pr.sub==='they'?'':'s'} it just before it collapses.`,
      (n,pr) => `The crate ${n} is hiding in starts to split at the seams. The wood groans. ${pr.Sub} need${pr.sub==='they'?'':'s'} to move — NOW.`,
      (n,pr) => `Termites. The set wall ${n} is behind crumbles like wet paper. ${pr.Sub}'${pr.sub==='they'?'re':'s'} suddenly exposed and very upset about it.`,
    ],
  },
  {
    id: 'knock-something', cat: 'panic', type: 'panic', stat: 'mental',
    basePoints: -1, maxPoints: -1, invertStat: true,
    text: [
      (n,pr) => `${n} bumps a shelf. A can falls. Then another can. Then twelve more cans. It's the loudest thing that's happened all challenge.`,
      (n,pr) => `${n} shifts position and knocks over a broom. It hits a bucket. The bucket rolls into a pipe. The pipe rings like a bell. It's a Rube Goldberg machine of bad luck.`,
      (n,pr) => `An elbow hits a stack of paint cans. They tumble. Each one louder than the last. ${n} watches in slow-motion horror.`,
    ],
  },
  {
    id: 'cramp-stillness', cat: 'panic', type: 'panic', stat: 'endurance',
    basePoints: -1, maxPoints: -1,
    text: [
      (n,pr) => `${n} has been crouching too long. ${pr.PosAdj} leg cramps. Hard. ${pr.Sub} let${pr.sub==='they'?'':'s'} out a yelp before ${pr.sub} can stop it.`,
      (n,pr) => `Cramp. Right calf. ${n} grits ${pr.posAdj} teeth and tries not to move. The pain is blinding. ${pr.Sub} nearly give${pr.sub==='they'?'':'s'} away ${pr.posAdj} position.`,
      (n,pr) => `${n}'s been still too long. Every muscle screams. ${pr.Sub} need${pr.sub==='they'?'':'s'} to move but the monster is right there.`,
    ],
  },
];

// ── CHRIS COMMENTARY (organized by act) ──
const CHRIS_COMMENTARY = {
  act1: [
    `"This is almost too easy. Chef, turn up the difficulty." — Chris McLean`,
    `"Hope everyone's comfortable! It's only going to get worse." — Chris`,
    `"The monster is barely trying. I'm honestly insulted on its behalf." — Chris`,
    `"Places, everyone! Chef is just warming up!" — Chris McLean`,
    `"Reminder: the monster can't ACTUALLY eat you. Probably. We didn't test that." — Chris`,
    `"Ten bucks says someone gets caught doing something embarrassing." — Chris`,
  ],
  act2: [
    `"Now we're getting somewhere! The monster's learning!" — Chris McLean`,
    `"The herd is thinning, folks. This is GREAT television." — Chris`,
    `"Chef, is the monster supposed to smoke like that? ...Chef?" — Chris`,
    `"Ooh, that's gonna leave a mark! On the set, I mean. That was expensive." — Chris`,
    `"This is what I live for. Other people's misery, captured on camera." — Chris`,
    `"I can practically taste the drama. Tastes like fear and hairspray." — Chris`,
    `"Chef, easy on the hydraulics! That thing cost the network a fortune!" — Chris`,
  ],
  act3: [
    `"Down to the final few... and the monster is NOT slowing down." — Chris McLean`,
    `"Someone call the set department. And the fire department. And maybe a therapist." — Chris`,
    `"The monster's in FINAL FORM. I don't even control this thing anymore!" — Chris`,
    `"Chef? CHEF?! Did you lose control of the— oh. Oh no." — Chris McLean`,
    `"Anyone else smell smoke? No? Just me? Cool cool cool." — Chris`,
    `"This is BETTER than the time we released actual bears! And legally, I can't say more." — Chris`,
    `"And THAT is why we have insurance! We DO have insurance, right?" — Chris`,
  ],
  capture_comedy: [
    `"That was just sad." — Chris McLean`,
    `"Did they even TRY to hide?" — Chris`,
    `"I've seen better hiding from a toddler." — Chris`,
    `"That's going in the highlight reel." — Chris`,
    `"Quick and painless. Well, quick." — Chris McLean`,
  ],
  capture_tense: [
    `"Now THAT was a chase." — Chris McLean`,
    `"They almost made it. Almost." — Chris`,
    `"The monster earned that one." — Chris McLean`,
    `"Somebody get them a towel. And maybe a hug." — Chris`,
  ],
  capture_terror: [
    `"...Okay, even I felt that one." — Chris McLean`,
    `"Note to self: increase the budget for set repairs." — Chris`,
    `"That was... intense. We might need to stop. LOL, just kidding." — Chris`,
    `"I'd say that was the scariest capture yet, but we still have rounds to go." — Chris McLean`,
  ],
};

// ── CAPTURE SEQUENCES (4-beat: approach, reaction, capture, aftermath) ──
const CAPTURE_APPROACH = {
  comedy: [
    (n,pr) => `The monster stumbles around a corner and nearly trips over ${n}. Neither of them saw the other coming.`,
    (n,pr) => `${n} is hiding behind a cardboard tree. The monster bumps into it. The tree falls. ${n} waves sheepishly.`,
    (n,pr) => `The monster trips over a cable, falls forward, and accidentally scoops up ${n}. It looks as surprised as ${pr.sub} do${pr.sub==='they'?'':'es'}.`,
    (n,pr) => `${n} was doing great. Then a bird landed on ${pr.posAdj} head. ${n} flailed. The monster noticed.`,
    (n,pr) => `The monster's foot comes down six inches from ${n}'s face. ${n} looks up. The monster looks down. Awkward.`,
  ],
  tense: [
    (n,pr) => `The monster's shadow creeps over ${n}'s hiding spot. Slow. Deliberate. It knows someone is here.`,
    (n,pr) => `Footsteps. Getting louder. ${n} presses deeper into the shadows. The footsteps stop right in front of ${pr.obj}.`,
    (n,pr) => `The monster rounds the corner. ${n}'s back is against the wall. Nowhere left to go. It locks on.`,
    (n,pr) => `A wall collapses beside ${n}. The monster reaches through the rubble, searching. Its sensors are locked.`,
    (n,pr) => `${n} hears breathing. Mechanical breathing. It's right behind ${pr.obj}. ${pr.Sub} turn${pr.sub==='they'?'':'s'} around slowly.`,
  ],
  terror: [
    (n,pr) => `The monster tears through the set wall. ${n} has nowhere left to run. The claw comes down.`,
    (n,pr) => `Buildings crumble. Sirens wail. The monster finds ${n} in the wreckage, lit by emergency red.`,
    (n,pr) => `The monster doesn't sneak up on ${n}. It walks straight through every obstacle between them. Walls, cars, doesn't matter.`,
    (n,pr) => `${n} is in the last standing structure. The monster circles it once. Then brings it down.`,
    (n,pr) => `The ground shakes. The monster appears through smoke and debris. ${n} makes a final sprint. The claw slams down.`,
  ],
};

const CAPTURE_REACTION = {
  hothead: [
    (n,pr) => `${n} doesn't run. ${pr.Sub} grab${pr.sub==='they'?'':'s'} a pipe and swings. It bounces off the monster's hull. The monster doesn't flinch.`,
    (n,pr) => `"COME ON THEN!" ${n} screams at the monster. It's not a strategy. It's not even brave. It's just ${n}.`,
  ],
  underdog: [
    (n,pr) => `${n} freezes. Eyes wide. Every instinct says run. ${pr.PosAdj} legs won't cooperate.`,
    (n,pr) => `${n} backs up. Steps on something. Stumbles. The monster doesn't even have to hurry.`,
  ],
  villain: [
    (n,pr) => `${n} tries to bargain. "We can work something out, right? You and me?" The monster doesn't negotiate.`,
    (n,pr) => `${n} points in a random direction. "Someone's over there!" The monster doesn't fall for it this time.`,
  ],
  beast: [
    (n,pr) => `${n} tries to outrun the monster one more time. ${pr.Sub} almost make${pr.sub==='they'?'':'s'} it. Almost.`,
    (n,pr) => `${n} vaults a barrier and lands hard. Gets up. Runs. The monster is faster now.`,
  ],
  default: [
    (n,pr) => `${n} sees it coming. There's a moment of acceptance. Then the grab.`,
    (n,pr) => `${n} turns to run. Too late. The monster is already there.`,
    (n,pr) => `${n} makes one last move — a dodge, a duck, anything. The monster adjusts. Catches ${pr.obj} anyway.`,
  ],
};

const CAPTURE_GRAB = {
  comedy: [
    (n,pr) => `The monster picks ${n} up gently — almost tenderly — and deposits ${pr.obj} in the bounce house. ${n} bounces twice.`,
    (n,pr) => `The grab is undignified. ${n} dangling from one ankle, arms crossed, scowling. The bounce house awaits.`,
    (n,pr) => `The monster scoops ${n} up like a claw machine prize. First try. The other captured players applaud sarcastically.`,
  ],
  tense: [
    (n,pr) => `The monster's claw closes. ${n} is lifted off the ground. For a moment, ${pr.sub} dangle${pr.sub==='they'?'':'s'}. Then the march to the bounce house begins.`,
    (n,pr) => `A mechanical hand wraps around ${n}. Not gentle. Not crushing. Just... certain. ${pr.Sub}'${pr.sub==='they'?'re':'s'} caught.`,
    (n,pr) => `The grab is fast. One second ${n} is running, the next ${pr.sub}'${pr.sub==='they'?'re':'s'} three feet off the ground. Fight's over.`,
  ],
  terror: [
    (n,pr) => `The monster's claw slams down, pinning ${n}. Metal screeches. ${n} is lifted, carried through the debris, and dropped into the bounce house from ten feet up.`,
    (n,pr) => `${n} is caught mid-sprint. The monster doesn't slow down — it drags ${pr.obj} twenty feet before depositing ${pr.obj} in the captured zone.`,
    (n,pr) => `The monster catches ${n} and roars in ${pr.posAdj} face. Hydraulic fluid drips. One eye sparks. Then it flings ${pr.obj} into the bounce house.`,
  ],
};

const CAPTURE_AFTERMATH = [
  (n,pr) => `${n} sits in the bounce house, staring at nothing. "I had a plan," ${pr.sub} say${pr.sub==='they'?'':'s'} to no one. "I had a PLAN."`,
  (n,pr) => `The other captured players make room. ${n} flops onto the inflatable floor. "That sucked."`,
  (n,pr) => `${n} checks for injuries. Nothing broken. Just pride. "How many are left?" ${pr.Sub} already ${pr.sub==='they'?'know':'knows'} the answer.`,
  (n,pr) => `${n} bounces once in the bounce house. Involuntarily. "This is humiliating." Bounce again. "Stop that."`,
  (n,pr) => `From the bounce house, ${n} watches the remaining survivors. "I could've lasted longer," ${pr.sub} mutter${pr.sub==='they'?'':'s'}. Maybe. Maybe not.`,
];

// ── MONSTER PROWL BEATS (per threat level) ──
const MONSTER_PROWL = {
  1: [
    () => `The monster lumbers across the back lot, bumping into set pieces and knocking over trash cans. Chef is still learning the controls.`,
    () => `Mechanical whirring. The monster wanders aimlessly, occasionally headbutting a wall by accident. It's almost cute. Almost.`,
    () => `The monster trips over its own tail. Chef curses over the walkie. Chris giggles.`,
  ],
  2: [
    () => `The monster is finding its rhythm. Its movements are smoother now, more purposeful. It checks behind set pieces systematically.`,
    () => `A low growl from the monster as it prowls Main Street. Chef has figured out the steering. The hunt is on for real.`,
    () => `The monster pauses at an intersection, head swiveling. It's choosing a direction. It chooses correctly.`,
  ],
  3: [
    () => `The monster is angry. It charges through obstacles instead of going around them. The film lot is becoming a debris field.`,
    () => `Heavy footsteps. Faster than before. The monster has locked onto a sector and is methodically sweeping it.`,
    () => `The monster roars and the sound shakes loose ceiling tiles. It's not searching anymore. It's hunting.`,
  ],
  4: [
    () => `The monster moves with terrifying precision. No wasted motion. Every step is calculated. Chef has mastered this thing.`,
    () => `Buildings crumble in the monster's wake. It doesn't go around anything anymore. It goes through.`,
    () => `The monster's eyes glow brighter. Its claws leave gouges in concrete. Whatever safety limiters existed are long gone.`,
  ],
  5: [
    () => `Final Form. The monster is barely recognizable — larger, louder, glowing with overloaded circuitry. The film lot shakes with every step.`,
    () => `The monster tears through the last standing structures. There is no hiding from this. There is only running.`,
    () => `Chef on the walkie, panicked: "I can't slow it down! The override isn't responding!" Chris: "...That's fine. Keep rolling."`,
  ],
};

// ── LAST CHANCE BEATS (escape attempts before capture) ──
const LAST_CHANCE_BEATS = {
  physical: [
    (n,pr,win) => win ? `${n} breaks from the monster's grip with raw strength. ${pr.Sub} wrench${pr.sub==='they'?'':'es'} free and sprint${pr.sub==='they'?'':'s'} into the darkness.` : `${n} struggles against the monster's grip. Not enough. The hydraulics are stronger than ${pr.posAdj} arms.`,
    (n,pr,win) => win ? `${n} ducks under the claw and rolls. Pure athleticism. ${pr.Sub}'${pr.sub==='they'?'re':'s'} gone before the monster can recalibrate.` : `${n} dives sideways but the monster's second arm cuts off the escape. Caught.`,
  ],
  mental: [
    (n,pr,win) => win ? `${n} throws a prop at a pipe. CLANG. The monster turns. ${n} goes the other way. Outsmarted at the last second.` : `${n} tries a feint. The monster doesn't buy it. Not this time.`,
    (n,pr,win) => win ? `${n} hits the lights. Darkness. By the time they come back on, ${pr.sub}'${pr.sub==='they'?'re':'s'} gone.` : `${n} reaches for the light switch. Too far. The monster is too close.`,
  ],
  boldness: [
    (n,pr,win) => win ? `${n} charges AT the monster. It flinches — yes, it FLINCHES — and ${n} darts past it.` : `${n} charges the monster head-on. Bold. Stupid. Caught.`,
    (n,pr,win) => win ? `${n} screams in the monster's face. Primal. The monster actually recoils. ${n} bolts.` : `${n} tries to intimidate the monster. The monster is not intimidated.`,
  ],
};

// ── RESCUE BEATS (multi-beat rescue encounters) ──
const RESCUE_APPROACH = [
  (r,rp,t) => `${r} sees ${t} about to be captured. No hesitation. ${rp.Sub} sprint${rp.sub==='they'?'':'s'} toward the monster.`,
  (r,rp,t) => `"${t}!" ${r} shouts. ${rp.Sub}'${rp.sub==='they'?'re':'s'} already running. The monster has ${t}. Not for long.`,
  (r,rp,t) => `${r} doesn't think. Doesn't plan. ${rp.Sub} see${rp.sub==='they'?'':'s'} ${t} in trouble and ${rp.posAdj} legs start moving.`,
];

const RESCUE_ACTION = {
  success: [
    (r,rp,t) => `${r} grabs ${t}'s arm and PULLS. The monster's grip breaks. They tumble backward together, free.`,
    (r,rp,t) => `${r} kicks a prop into the monster's sensors. It releases ${t} reflexively. ${r} pulls ${t} away. "RUN!"`,
    (r,rp,t) => `${r} throws ${rp.ref} at the monster — full body tackle on a mechanical nightmare. It staggers. ${t} scrambles free.`,
  ],
  failure: [
    (r,rp,t) => `${r} reaches ${t}. Grabs ${pronouns(t).posAdj} hand. Pulls. The monster pulls harder. ${r} loses ${rp.posAdj} grip. ${t} is caught.`,
    (r,rp,t) => `${r} charges in but the monster sweeps ${rp.obj} aside with one arm. ${t} is lifted with the other. Both attempts failed.`,
    (r,rp,t) => `${r} gets there too late. The monster already has ${t}. ${r} stands there, hands empty, watching ${t} get carried to the bounce house.`,
  ],
};
```

That's **93 encounter templates** with **300+ text variants**. The pools break down as:
- Hide: 8 templates
- Run: 6 templates
- Outsmart: 6 templates
- Climb: 5 templates
- Distract: 5 templates
- Heroic: 8 templates
- Showmance: 4 templates
- Alliance: 5 templates
- Caught Pool: 4 templates
- Sabotage: 6 templates
- Scheming: 5 templates
- Confrontation: 4 templates
- Set Destruction: 5 templates
- Atmosphere: 5 templates
- Monster Behavior: 5 templates
- Comedy: 8 templates
- Panic: 6 templates
Plus capture sequences (approach/reaction/grab/aftermath), monster prowl beats, last-chance beats, rescue beats, and Chris commentary.

- [ ] **Step 3: Commit**

```bash
git add js/chal/monster-cash.js
git commit -m "feat(monster-cash): add 93 narrative encounter templates with 300+ text variants"
```

---

### Task 3: Simulation Engine — New Round Structure + Event Selection

**Files:**
- Modify: `js/chal/monster-cash.js` (replace `_selectEvents` and `simulateMonsterCash`)

The new simulation engine uses the narrative encounter templates. Each round produces:
- A monster prowl beat (narrative text)
- 2-3 encounters per player (selected from the pools, generating narrative text)
- Environmental events (atmosphere, set destruction, monster behavior)
- A capture sequence (multi-beat if someone is caught)
- A possible rescue attempt (multi-beat)
- Chris commentary

- [ ] **Step 1: Replace the `_selectEvents` function**

Delete the old `_selectEvents` function and replace it with:

```js
// ══════════════════════════════════════════════════════════════════════
// EVENT SELECTION ENGINE
// ══════════════════════════════════════════════════════════════════════

function _pickText(arr, seed) {
  const h = typeof seed === 'string' ? [...seed].reduce((a, c) => a + c.charCodeAt(0), 0) : (seed || 0);
  return arr[(h + Math.floor(Math.random() * arr.length)) % arr.length];
}

function _canSabotage(name) {
  const s = pStats(name);
  const arch = players.find(p => p.name === name)?.archetype || '';
  const villains = ['villain', 'mastermind', 'schemer'];
  const nice = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
  if (villains.includes(arch)) return true;
  if (nice.includes(arch)) return false;
  return s.strategic >= 6 && s.loyalty <= 4;
}

function _getThreatLevel(roundIndex, totalRounds) {
  const raw = Math.ceil((roundIndex + 1) / totalRounds * 5);
  return Math.min(5, Math.max(1, raw));
}

function _getThreatData(level) {
  return THREAT_LEVELS[Math.min(level, 5) - 1];
}

function _pickLocation(usedLocations) {
  const available = LOCATIONS.filter(l => !usedLocations.includes(l.id));
  if (available.length === 0) return LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  return available[Math.floor(Math.random() * available.length)];
}

function _getArchReaction(name) {
  const arch = players.find(p => p.name === name)?.archetype || '';
  if (['hothead'].includes(arch)) return 'hothead';
  if (['underdog', 'goat', 'floater'].includes(arch)) return 'underdog';
  if (['villain', 'mastermind', 'schemer'].includes(arch)) return 'villain';
  if (['challenge-beast'].includes(arch)) return 'beast';
  return 'default';
}

function _buildPool(name, survivors, threatLevel, location, capturedPool, usedIds) {
  const s = pStats(name);
  const pr = pronouns(name);
  const canSab = _canSabotage(name);
  const pool = [];

  const addPool = (templates, category) => {
    for (const t of templates) {
      if (usedIds.has(t.id)) continue;
      if (t.minThreat && threatLevel < t.minThreat) continue;
      if (t.isSabotage && !canSab) continue;

      let weight = 1;
      if (t.stat) weight += (s[t.stat] || 5) * 0.3;
      if (t.stat2) weight += (s[t.stat2] || 5) * 0.2;
      if (t.invertStat) weight = (10 - (s[t.stat] || 5)) * 0.3;

      if (t.type === 'hide') {
        weight += (location.hideBonus || 0);
        if (threatLevel >= 3) weight *= 1.5;
      }
      if (t.type === 'climb') weight += (location.climbBonus || 0);
      if (t.type === 'run') weight += (location.sprintBonus || 0);
      if (t.type === 'distract') weight += (location.pyroBonus || 0);

      if (t.type === 'heroic') {
        if (s.loyalty < 5) continue;
        const allies = survivors.filter(p => p !== name && getBond(name, p) >= 2);
        if (allies.length === 0 && !t.needsTarget === false) continue;
      }

      if (t.type === 'sabotage' || t.type === 'scheming') {
        if (!canSab) continue;
        const enemies = survivors.filter(p => p !== name && getBond(name, p) <= 0);
        if (enemies.length === 0 && Math.random() > 0.3) continue;
        weight *= 0.6;
      }

      if (t.type === 'showmance') {
        const showmances = gs.showmances || [];
        const inShowmance = showmances.some(sm =>
          sm.pair && sm.pair.includes(name) && sm.pair.some(p => p !== name && survivors.includes(p))
        );
        if (!inShowmance) continue;
      }

      if (t.type === 'caught-pool') {
        if (capturedPool.length === 0) continue;
        if (!capturedPool.includes(name)) continue;
      }

      if (t.type === 'alliance') {
        const bonded = survivors.filter(p => p !== name && getBond(name, p) >= 3);
        if (bonded.length === 0) continue;
      }

      pool.push({ ...t, weight: Math.max(0.1, weight), category });
    }
  };

  addPool(HIDE_ENCOUNTERS, 'survival');
  addPool(RUN_ENCOUNTERS, 'survival');
  addPool(OUTSMART_ENCOUNTERS, 'survival');
  addPool(CLIMB_ENCOUNTERS, 'survival');
  addPool(DISTRACT_ENCOUNTERS, 'survival');
  addPool(HEROIC_ENCOUNTERS, 'social');
  addPool(SHOWMANCE_ENCOUNTERS, 'social');
  addPool(ALLIANCE_ENCOUNTERS, 'social');
  addPool(SABOTAGE_ENCOUNTERS, 'villain');
  addPool(SCHEMING_ENCOUNTERS, 'villain');
  addPool(COMEDY_ENCOUNTERS, 'comedy');
  addPool(PANIC_ENCOUNTERS, 'panic');

  return pool;
}

function _selectEncounters(name, survivors, threatLevel, location, capturedPool, roundUsedIds) {
  const s = pStats(name);
  const pr = pronouns(name);
  const pool = _buildPool(name, survivors, threatLevel, location, capturedPool, roundUsedIds);
  if (pool.length === 0) return [];

  const eventCount = 2 + (Math.random() < 0.3 ? 1 : 0);
  const events = [];

  for (let i = 0; i < eventCount; i++) {
    if (pool.length === 0) break;
    const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
    let r = Math.random() * totalWeight;
    let chosen = pool[0];
    for (const e of pool) {
      r -= e.weight;
      if (r <= 0) { chosen = e; break; }
    }

    let pts;
    if (chosen.basePoints < 0) {
      pts = chosen.basePoints;
    } else {
      const statVal = s[chosen.stat] || 5;
      pts = chosen.basePoints + Math.floor((statVal / 10) * ((chosen.maxPoints || chosen.basePoints) - chosen.basePoints));
    }

    let target = null;
    if (chosen.needsTarget) {
      if (chosen.type === 'sabotage' || chosen.type === 'scheming' || chosen.isSabotage) {
        const enemies = survivors.filter(p => p !== name && getBond(name, p) <= 0);
        const candidates = enemies.length ? enemies : survivors.filter(p => p !== name);
        target = candidates[Math.floor(Math.random() * candidates.length)] || null;
      } else if (chosen.type === 'heroic') {
        const allies = survivors.filter(p => p !== name && getBond(name, p) >= 2);
        const candidates = allies.length ? allies : survivors.filter(p => p !== name);
        target = candidates[Math.floor(Math.random() * candidates.length)] || null;
      } else if (chosen.type === 'showmance') {
        const showmances = gs.showmances || [];
        const sm = showmances.find(sm => sm.pair && sm.pair.includes(name) && sm.pair.some(p => p !== name && survivors.includes(p)));
        target = sm ? sm.pair.find(p => p !== name) : null;
      } else if (chosen.type === 'alliance' || chosen.type === 'caught-pool') {
        const bonded = survivors.filter(p => p !== name && getBond(name, p) >= 1);
        const candidates = bonded.length ? bonded : survivors.filter(p => p !== name);
        target = candidates[Math.floor(Math.random() * candidates.length)] || null;
      } else if (chosen.type === 'confrontation') {
        const villainTargets = survivors.filter(p => p !== name && _canSabotage(p));
        target = villainTargets.length ? villainTargets[Math.floor(Math.random() * villainTargets.length)] : null;
      }
    }

    const textFn = _pickText(chosen.text, name + (target || '') + i);
    const narrativeText = target ? textFn(name, pr, target) : textFn(name, pr);

    events.push({
      id: chosen.id, player: name, target,
      points: pts, type: chosen.type, category: chosen.category,
      text: narrativeText,
      catchBoost: chosen.catchBoost || 0,
      heat: chosen.heat || 0,
      negative: pts < 0 || chosen.type === 'sabotage' || chosen.type === 'scheming' || chosen.type === 'panic' || chosen.isSabotage,
    });

    roundUsedIds.add(chosen.id);
    const idx = pool.findIndex(e => e.id === chosen.id);
    if (idx !== -1) pool.splice(idx, 1);
  }

  return events;
}

function _buildCaptureSequence(name, threatLevel) {
  const pr = pronouns(name);
  const tier = threatLevel <= 2 ? 'comedy' : threatLevel === 3 ? 'tense' : 'terror';

  const approach = _pickText(CAPTURE_APPROACH[tier], name)(name, pr);
  const reactionType = _getArchReaction(name);
  const reaction = _pickText(CAPTURE_REACTION[reactionType] || CAPTURE_REACTION.default, name)(name, pr);
  const grab = _pickText(CAPTURE_GRAB[tier], name)(name, pr);
  const aftermath = _pickText(CAPTURE_AFTERMATH, name)(name, pr);

  return { approach, reaction, grab, aftermath, tier };
}

function _buildRescueSequence(rescuer, target, success) {
  const rp = pronouns(rescuer);
  const approach = _pickText(RESCUE_APPROACH, rescuer + target)(rescuer, rp, target);
  const actionPool = success ? RESCUE_ACTION.success : RESCUE_ACTION.failure;
  const action = _pickText(actionPool, rescuer + target)(rescuer, rp, target);
  return { rescuer, target, success, approach, action };
}

function _selectEnvironmentalEvents(threatLevel, roundNum) {
  const events = [];

  if (Math.random() < 0.5 + threatLevel * 0.1) {
    const pools = [SET_DESTRUCTION_EVENTS, ATMOSPHERE_EVENTS, MONSTER_BEHAVIOR_EVENTS];
    const pool = pools[Math.floor(Math.random() * pools.length)];
    const eligible = pool.filter(e => !e.minThreat || threatLevel >= e.minThreat);
    if (eligible.length > 0) {
      const chosen = eligible[Math.floor(Math.random() * eligible.length)];
      const text = _pickText(chosen.text, roundNum + chosen.id)();
      events.push({ id: chosen.id, type: chosen.type || chosen.cat, text });
    }
  }

  return events;
}
```

- [ ] **Step 2: Replace `simulateMonsterCash` with the new engine**

Delete the old `simulateMonsterCash` function and replace with:

```js
// ══════════════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════════════
export function simulateMonsterCash(ep) {
  const active = [...gs.activePlayers];
  const isMerged = gs.isMerged;
  const totalRounds = Math.max(3, active.length - 2);
  const minSurvivors = isMerged ? 2 : 1;

  const filmTitle = _pickText(FILM_TITLES, ep.num + active.join(''));
  const chrisOpener = _pickText(CHRIS_OPENERS, ep.num);
  const chrisCloser = _pickText(CHRIS_CLOSERS, ep.num);

  const scores = {};
  active.forEach(p => { scores[p] = 0; });
  const capturedOrder = [];
  const rounds = [];
  const usedLocations = [];
  const monsterLevels = [];
  let survivors = [...active];
  const catchBoosts = {};
  active.forEach(p => { catchBoosts[p] = 0; });
  const actBreaks = [];
  const chalMemberScores = {};

  for (let r = 0; r < totalRounds && survivors.length > minSurvivors; r++) {
    const threatLevel = _getThreatLevel(r, totalRounds);
    const threat = _getThreatData(threatLevel);
    const location = _pickLocation(usedLocations);
    usedLocations.push(location.id);
    if (usedLocations.length >= LOCATIONS.length) usedLocations.length = 0;

    monsterLevels.push({ round: r + 1, level: threatLevel, name: THREAT_NAMES[threatLevel - 1] });

    const act = threatLevel <= 2 ? 'act1' : threatLevel <= 3 ? 'act2' : 'act3';
    const monsterProwl = _pickText(MONSTER_PROWL[threatLevel], r + ep.num)();
    const environmentalEvents = _selectEnvironmentalEvents(threatLevel, r);
    const chrisLine = _pickText(CHRIS_COMMENTARY[act], r + ep.num);

    const roundEvents = [];
    const roundUsedIds = new Set();

    for (const name of survivors) {
      const playerEvents = _selectEncounters(name, survivors, threatLevel, location, capturedOrder, roundUsedIds);
      roundEvents.push(...playerEvents);

      for (const ev of playerEvents) {
        if (ev.negative && ev.target && ev.type !== 'panic') {
          scores[ev.target] = (scores[ev.target] || 0) + ev.points;
        } else {
          scores[name] = (scores[name] || 0) + ev.points;
        }

        if (ev.catchBoost && ev.target) {
          catchBoosts[ev.target] = (catchBoosts[ev.target] || 0) + ev.catchBoost;
        }

        if (ev.heat && ev.target) {
          if (!gs._monsterCashHeat) gs._monsterCashHeat = {};
          gs._monsterCashHeat[ev.target] = {
            target: ev.player, amount: (gs._monsterCashHeat[ev.target]?.amount || 0) + ev.heat,
            expiresEp: (gs.episode || 0) + 3,
          };
        }

        if (ev.type === 'heroic' && ev.target) {
          addBond(name, ev.target, ev.id === 'sacrifice-cover' ? 2 : 1);
          if (gs._monsterCashHeat?.[name]) {
            gs._monsterCashHeat[name].amount = Math.max(0, gs._monsterCashHeat[name].amount - 1);
          }
        }
        if (ev.type === 'sabotage' || ev.type === 'scheming') {
          if (ev.target) addBond(name, ev.target, ev.type === 'sabotage' ? -2 : -1);
        }

        if (!gs.popularity) gs.popularity = {};
        if (ev.type === 'heroic') {
          gs.popularity[name] = (gs.popularity[name] || 0) + (ev.id === 'sacrifice-cover' ? 2 : 1);
        } else if (ev.type === 'sabotage') {
          gs.popularity[name] = (gs.popularity[name] || 0) + (ev.catchBoost >= 0.15 ? -2 : -1);
        }
      }
    }

    for (const name of survivors) {
      scores[name] = (scores[name] || 0) + 2;
    }

    if (seasonConfig.romance) {
      for (const sm of (gs.showmances || [])) {
        if (sm.pair && survivors.includes(sm.pair[0]) && survivors.includes(sm.pair[1])) {
          _checkShowmanceChalMoment(sm.pair[0], sm.pair[1], ep);
        }
      }
    }

    // ── Capture resolution with last-chance beat ──
    let captured = null;
    let captureSequence = null;
    let rescueSequence = null;
    let lastChance = null;

    if (survivors.length > minSurvivors) {
      const catchScores = {};
      for (const name of survivors) {
        const roundScore = roundEvents.filter(e => e.player === name && !e.negative).reduce((s, e) => s + e.points, 0);
        catchScores[name] = threat.baseCatch - (roundScore * 0.1) + (catchBoosts[name] || 0);
      }

      const sorted = [...survivors].sort((a, b) => {
        if (catchScores[b] !== catchScores[a]) return catchScores[b] - catchScores[a];
        const aNeg = roundEvents.filter(e => e.player === a && e.negative).length;
        const bNeg = roundEvents.filter(e => e.player === b && e.negative).length;
        if (bNeg !== aNeg) return bNeg - aNeg;
        return Math.random() - 0.5;
      });

      let target = sorted[0];

      // Last chance beat
      const ts = pStats(target);
      const tp = pronouns(target);
      let lastChanceStat = null;
      let lastChanceChance = 0;
      if (ts.physical >= 7) { lastChanceStat = 'physical'; lastChanceChance = ts.physical * 0.08; }
      else if (ts.mental >= 7) { lastChanceStat = 'mental'; lastChanceChance = ts.mental * 0.06; }
      else if (ts.boldness >= 7) { lastChanceStat = 'boldness'; lastChanceChance = ts.boldness * 0.05; }

      if (lastChanceStat && threatLevel < 5) {
        const escaped = Math.random() < lastChanceChance;
        const beatPool = LAST_CHANCE_BEATS[lastChanceStat];
        const beatText = _pickText(beatPool, target)(target, tp, escaped);
        lastChance = { player: target, stat: lastChanceStat, escaped, text: beatText };
        if (escaped) {
          scores[target] = (scores[target] || 0) + 2;
          target = sorted[1] || null;
        }
      }

      if (target) {
        // Rescue attempt
        if (threatLevel < 5) {
          const potentialRescuers = survivors.filter(p => {
            if (p === target) return false;
            const s = pStats(p);
            return s.loyalty >= 5 && getBond(p, target) >= 3;
          });
          if (potentialRescuers.length > 0 && Math.random() < 0.4) {
            const rescuer = potentialRescuers[Math.floor(Math.random() * potentialRescuers.length)];
            const rs = pStats(rescuer);
            const rescueChance = rs.loyalty * 0.08 + getBond(rescuer, target) * 0.05;
            const success = Math.random() < rescueChance;
            rescueSequence = _buildRescueSequence(rescuer, target, success);
            if (success) {
              scores[rescuer] = (scores[rescuer] || 0) - 2;
              addBond(rescuer, target, 3);
              if (!gs.popularity) gs.popularity = {};
              gs.popularity[rescuer] = (gs.popularity[rescuer] || 0) + 2;
              target = null;
            }
          }
        }

        if (target) {
          captured = target;
          captureSequence = _buildCaptureSequence(target, threatLevel);
          survivors = survivors.filter(p => p !== captured);
          capturedOrder.push(captured);
          catchBoosts[captured] = 0;
        }
      }
    }

    if (capturedOrder.length === 1 && !actBreaks.includes(r)) actBreaks.push(r);
    if (survivors.length === 3 && !actBreaks.some(a => typeof a === 'number' && a > 0)) actBreaks.push(r);

    rounds.push({
      roundNum: r + 1, threatLevel,
      threatName: THREAT_NAMES[threatLevel - 1],
      location: location.name, locationId: location.id,
      monsterProwl, environmentalEvents,
      events: roundEvents,
      captured, captureSequence, rescueSequence, lastChance,
      survivors: [...survivors],
      chrisLine,
    });
  }

  // ── Final showdown (post-merge) ──
  let finalShowdown = null;
  let immunityWinner = null;
  if (isMerged && survivors.length === 2) {
    const [s1, s2] = survivors;
    const s1s = pStats(s1), s2s = pStats(s2);
    const s1Score = scores[s1] + (s1s.physical + s1s.mental + s1s.endurance) * 0.3 + Math.random() * 3;
    const s2Score = scores[s2] + (s2s.physical + s2s.mental + s2s.endurance) * 0.3 + Math.random() * 3;
    immunityWinner = s1Score >= s2Score ? s1 : s2;
    const loser = immunityWinner === s1 ? s2 : s1;
    const methods = ['outlasted', 'outran', 'outsmarted', 'outmaneuvered'];
    finalShowdown = {
      survivor1: s1, survivor2: s2, winner: immunityWinner,
      method: `${immunityWinner} ${_pickText(methods, immunityWinner)} ${loser} in the final showdown`,
    };
  } else if (isMerged && survivors.length === 1) {
    immunityWinner = survivors[0];
  } else if (!isMerged) {
    const tribeScores = {};
    for (const tribe of gs.tribes) {
      const members = tribe.members.filter(m => active.includes(m));
      if (members.length === 0) continue;
      let totalSurvival = 0;
      for (const m of members) {
        const capturedRound = capturedOrder.indexOf(m);
        totalSurvival += capturedRound === -1 ? rounds.length + 1 : capturedRound + 1;
      }
      tribeScores[tribe.name] = totalSurvival / members.length;
    }
    const sortedTribes = Object.entries(tribeScores).sort(([,a],[,b]) => b - a);
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
    ep.challengeType = 'monster-cash';
    immunityWinner = null;
  }

  // Build chalMemberScores for debug
  active.forEach(name => { chalMemberScores[name] = scores[name] || 0; });
  ep.chalMemberScores = chalMemberScores;

  const leaderboard = active.map(name => ({
    name, score: scores[name] || 0,
    capturedRound: capturedOrder.indexOf(name) === -1 ? null : capturedOrder.indexOf(name) + 1,
    events: rounds.flatMap(r => r.events.filter(e => e.player === name)),
  })).sort((a, b) => b.score - a.score);

  if (!gs.popularity) gs.popularity = {};
  if (isMerged && immunityWinner) {
    gs.popularity[immunityWinner] = (gs.popularity[immunityWinner] || 0) + 3;
  }

  const tribeScoresForEp = !isMerged ? (() => {
    const ts = {};
    for (const tribe of gs.tribes) {
      const members = tribe.members.filter(m => active.includes(m));
      if (!members.length) continue;
      let total = 0;
      for (const m of members) {
        const ci = capturedOrder.indexOf(m);
        total += ci === -1 ? rounds.length + 1 : ci + 1;
      }
      ts[tribe.name] = total / members.length;
    }
    return ts;
  })() : null;

  ep.monsterCash = {
    rounds, scores, capturedOrder, finalShowdown, immunityWinner,
    leaderboard, monsterLevels,
    filmTitle, chrisOpener, chrisCloser, actBreaks,
    locations: rounds.map(r => r.location),
    tribeScores: tribeScoresForEp,
  };

  if (isMerged) {
    ep.immunityWinner = immunityWinner;
    ep.challengeType = 'monster-cash';
  }
}
```

Note the key changes:
- **No `ep.eliminated`** — post-merge goes to normal tribal
- **No `ep.noTribal`** — normal tribal follows
- **`ep.chalMemberScores`** — for debug tab
- **Multi-beat capture sequences** stored in round data
- **Last-chance beats** before capture
- **Environmental events** per round
- **Monster prowl beats** per round
- **Chris commentary** by act, not random

- [ ] **Step 3: Commit**

```bash
git add js/chal/monster-cash.js
git commit -m "feat(monster-cash): rebuild simulation engine with multi-beat encounters"
```

---

### Task 4: Text Backlog — Narrative Overhaul

**Files:**
- Modify: `js/chal/monster-cash.js` (replace `_textMonsterCash`)

- [ ] **Step 1: Replace text backlog function**

Delete the old `_textMonsterCash` and replace with:

```js
// ══════════════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════════════
export function _textMonsterCash(ep, ln, sec) {
  const mc = ep.monsterCash;
  if (!mc) return;
  sec('MONSTER CASH');

  ln(`Film Lot Challenge — ${mc.filmTitle}`);
  ln(`Monster Escalation: ${mc.monsterLevels.map(l => l.name).filter((v, i, a) => a.indexOf(v) === i).join(' → ')}`);
  ln(`Chris: "${mc.chrisOpener}"`);
  ln('');

  for (const round of mc.rounds) {
    ln(`═══ ROUND ${round.roundNum} (Threat: ${round.threatName}) — ${round.location} ═══`);
    ln('');
    ln(round.monsterProwl);
    ln('');

    if (round.environmentalEvents?.length) {
      for (const env of round.environmentalEvents) {
        ln(env.text);
      }
      ln('');
    }

    const highlights = round.events
      .filter(e => e.text)
      .sort((a, b) => Math.abs(b.points) - Math.abs(a.points))
      .slice(0, 6);

    for (const ev of highlights) {
      ln(ev.text);
    }
    ln('');

    if (round.lastChance) {
      const lc = round.lastChance;
      ln(`LAST CHANCE: ${lc.text}`);
      ln('');
    }

    if (round.rescueSequence) {
      const rs = round.rescueSequence;
      ln(`RESCUE ATTEMPT:`);
      ln(rs.approach);
      ln(rs.action);
      ln('');
    }

    if (round.captured && round.captureSequence) {
      const cs = round.captureSequence;
      ln(`CAPTURED: ${round.captured}`);
      ln(cs.approach);
      ln(cs.reaction);
      ln(cs.grab);
      ln(cs.aftermath);
      ln('');
    }

    ln(`${round.chrisLine}`);
    ln(`Survivors: ${round.survivors.join(', ')}`);
    ln('');
  }

  if (mc.finalShowdown) {
    ln('═══ FINAL SHOWDOWN ═══');
    ln(`${mc.finalShowdown.survivor1} vs ${mc.finalShowdown.survivor2}`);
    ln(mc.finalShowdown.method);
    ln('');
  }

  ln(`CAPTURE ORDER: ${mc.capturedOrder.join(' → ')}`);
  if (mc.immunityWinner) ln(`IMMUNITY WINNER: ${mc.immunityWinner}`);

  if (mc.tribeScores) {
    ln('');
    ln('TRIBE SCORES (avg survival round):');
    Object.entries(mc.tribeScores).sort(([,a],[,b]) => b - a).forEach(([name, score]) => {
      ln(`  ${name}: ${score.toFixed(1)}`);
    });
  }

  ln('');
  ln(`Chris: "${mc.chrisCloser}"`);
}
```

- [ ] **Step 2: Commit**

```bash
git add js/chal/monster-cash.js
git commit -m "feat(monster-cash): rebuild text backlog with narrative sentences"
```

---

### Task 5: VP Screens — Emergency Broadcast Theme Overhaul

**Files:**
- Modify: `js/chal/monster-cash.js` (replace all VP builders)
- Modify: `simulator.html` (overhaul CSS)

- [ ] **Step 1: Overhaul CSS in `simulator.html`**

Find the existing Monster Cash CSS block (around lines 921-980, starting with `.mc-shell`). Replace the ENTIRE block with:

```css
    /* ── Monster Cash — Emergency Broadcast / Surveillance ── */
    .mc-shell { position:relative; background:#0a0a0a; border:2px solid #2d2d2d; border-radius:8px; overflow:hidden; min-height:400px; }
    .mc-monster-silhouette { position:absolute; top:10px; right:10px; opacity:0.08; font-size:80px; z-index:0; transition:opacity 0.5s, font-size 0.5s; }
    .mc-monster-silhouette.threat-3 { opacity:0.15; font-size:100px; }
    .mc-monster-silhouette.threat-4 { opacity:0.25; font-size:120px; }
    .mc-monster-silhouette.threat-5 { opacity:0.4; font-size:150px; top:0; }
    .mc-film-grain { position:absolute; top:0; left:0; right:0; bottom:0; opacity:0.03; background:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); pointer-events:none; z-index:4; }
    .mc-ticker { position:absolute; bottom:0; left:0; right:0; background:rgba(200,0,0,0.85); color:#fff; font-size:11px; font-family:'Courier New',monospace; padding:3px 0; z-index:2; overflow:hidden; white-space:nowrap; }
    .mc-ticker-text { display:inline-block; animation:mcTickerScroll 20s linear infinite; }
    @keyframes mcTickerScroll { 0% { transform:translateX(100%); } 100% { transform:translateX(-100%); } }
    .mc-rubble-pile { position:absolute; bottom:25px; right:10px; display:flex; flex-wrap:wrap; gap:2px; max-width:80px; z-index:2; }
    .mc-rubble-portrait { width:24px; height:24px; border-radius:50%; border:1px solid #555; opacity:0.6; filter:grayscale(1); position:relative; }
    .mc-rubble-portrait::after { content:''; position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(255,0,0,0.3); border-radius:50%; }
    .mc-title-card { text-align:center; padding:40px 20px; position:relative; z-index:3; }
    .mc-film-title { font-size:28px; font-weight:900; color:#e8e8e8; text-transform:uppercase; letter-spacing:3px; text-shadow:0 0 20px rgba(255,60,60,0.5), 2px 2px 0 #333; font-family:'Impact','Arial Black',sans-serif; }
    .mc-now-playing { font-size:11px; color:#888; letter-spacing:4px; text-transform:uppercase; margin-bottom:8px; }
    .mc-cam-label { font-size:10px; color:#ff3333; font-family:'Courier New',monospace; letter-spacing:2px; display:flex; align-items:center; gap:6px; margin-bottom:4px; }
    .mc-cam-dot { width:8px; height:8px; border-radius:50%; background:#f00; animation:mcCamBlink 1.5s infinite; }
    @keyframes mcCamBlink { 0%,100%{opacity:1} 50%{opacity:0.2} }
    .mc-threat-bar { display:flex; align-items:center; gap:6px; margin:8px 0; }
    .mc-threat-label { font-size:10px; color:#aaa; text-transform:uppercase; letter-spacing:1px; min-width:70px; }
    .mc-threat-fill { height:6px; border-radius:3px; transition:width 0.5s, background 0.5s; }
    .mc-threat-1 { width:20%; background:#4caf50; }
    .mc-threat-2 { width:40%; background:#ff9800; }
    .mc-threat-3 { width:60%; background:#ff5722; }
    .mc-threat-4 { width:80%; background:#f44336; }
    .mc-threat-5 { width:100%; background:#b71c1c; box-shadow:0 0 8px rgba(183,28,28,0.5); }
    .mc-location-header { font-size:12px; color:#ff9800; text-transform:uppercase; letter-spacing:2px; border-bottom:1px solid rgba(255,152,0,0.2); padding-bottom:4px; margin:12px 0 8px; }
    .mc-prowl-text { font-size:12px; color:#999; font-style:italic; padding:6px 8px; margin:6px 0; border-left:3px solid rgba(255,60,60,0.3); background:rgba(255,60,60,0.03); border-radius:0 4px 4px 0; }
    .mc-env-text { font-size:12px; color:#888; padding:4px 8px; margin:4px 0; border-left:2px solid rgba(255,152,0,0.3); }
    .mc-event-card { display:flex; align-items:flex-start; gap:8px; padding:8px; margin:4px 0; border-radius:6px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); }
    .mc-event-card.mc-heroic { border-color:rgba(76,175,80,0.2); background:rgba(76,175,80,0.04); }
    .mc-event-card.mc-sabotage { border-color:rgba(244,67,54,0.2); background:rgba(244,67,54,0.04); }
    .mc-event-card.mc-comedy { border-color:rgba(255,193,7,0.2); background:rgba(255,193,7,0.04); }
    .mc-event-card.mc-showmance { border-color:rgba(233,30,99,0.2); background:rgba(233,30,99,0.04); }
    .mc-event-narrative { flex:1; font-size:12px; color:#ccc; line-height:1.5; }
    .mc-event-pts { font-size:11px; font-weight:700; padding:2px 6px; border-radius:4px; font-family:'Courier New',monospace; white-space:nowrap; }
    .mc-pts-pos { color:#4caf50; background:rgba(76,175,80,0.12); }
    .mc-pts-neg { color:#f44336; background:rgba(244,67,54,0.12); }
    .mc-capture-card { border:2px solid rgba(244,67,54,0.4); background:rgba(244,67,54,0.08); padding:12px; border-radius:8px; margin:10px 0; }
    .mc-capture-beat { font-size:12px; color:#ccc; line-height:1.6; margin:4px 0; padding-left:12px; border-left:2px solid rgba(244,67,54,0.3); }
    .mc-captured-label { font-size:14px; font-weight:900; color:#f44336; letter-spacing:3px; text-transform:uppercase; text-align:center; margin-bottom:8px; }
    .mc-survivors-count { font-size:13px; color:#ff9800; font-weight:700; text-align:center; margin:8px 0; }
    .mc-chris-line { font-size:11px; color:#888; font-style:italic; padding:4px 8px; border-left:2px solid #555; margin:6px 0; }
    .mc-rescue-card { border:2px solid rgba(76,175,80,0.3); background:rgba(76,175,80,0.05); padding:10px; border-radius:8px; margin:8px 0; }
    .mc-rescue-beat { font-size:12px; color:#ccc; line-height:1.6; margin:3px 0; }
    .mc-last-chance { border:2px solid rgba(255,152,0,0.3); background:rgba(255,152,0,0.05); padding:8px; border-radius:8px; margin:8px 0; font-size:12px; color:#ccc; }
    .mc-signal-lost { text-align:center; font-family:'Courier New',monospace; color:#f44; font-size:14px; letter-spacing:4px; padding:20px; animation:mcSignalBlink 0.5s infinite; }
    @keyframes mcSignalBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
    .mc-clapperboard { text-align:center; padding:12px; background:#1a1a1a; border:2px solid #333; margin:8px 0; border-radius:4px; font-family:'Courier New',monospace; font-size:11px; color:#aaa; letter-spacing:2px; text-transform:uppercase; }
    @keyframes mcShakeLight { 0%,100% { transform:translateX(0); } 25% { transform:translateX(-2px); } 75% { transform:translateX(2px); } }
    @keyframes mcShakeMedium { 0%,100% { transform:translateX(0); } 20% { transform:translate(-4px,-2px); } 40% { transform:translate(3px,1px); } 60% { transform:translate(-3px,2px); } 80% { transform:translate(4px,-1px); } }
    @keyframes mcShakeHeavy { 0%,100% { transform:translate(0); } 10% { transform:translate(-6px,-3px); } 20% { transform:translate(5px,2px); } 30% { transform:translate(-4px,4px); } 40% { transform:translate(6px,-2px); } 50% { transform:translate(-5px,3px); } 60% { transform:translate(4px,-4px); } 70% { transform:translate(-3px,5px); } 80% { transform:translate(6px,-1px); } 90% { transform:translate(-2px,3px); } }
    .mc-capture-comedy { animation:mcShakeLight 0.4s ease-out; }
    .mc-capture-tense { animation:mcShakeMedium 0.5s ease-out; }
    .mc-capture-terror { animation:mcShakeHeavy 0.6s ease-out; }
    @keyframes mcCrack { 0% { clip-path:polygon(0 0, 100% 0, 100% 100%, 0 100%); } 100% { clip-path:polygon(0 0, 48% 0, 50% 45%, 52% 0, 100% 0, 100% 100%, 55% 100%, 50% 55%, 45% 100%, 0 100%); } }
    .mc-portrait-cracked { animation:mcCrack 0.3s ease-out forwards; }
    @keyframes mcShatter { 0% { transform:scale(1); opacity:1; filter:brightness(1); } 30% { transform:scale(1.1); filter:brightness(2); } 100% { transform:scale(0.8); opacity:0; filter:brightness(0.3); } }
    .mc-portrait-shatter { animation:mcShatter 0.8s ease-out forwards; }
    .mc-emergency-flash { position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(255,0,0,0.08); pointer-events:none; z-index:3; animation:mcEmergencyPulse 2s ease-in-out infinite; }
    @keyframes mcEmergencyPulse { 0%,100% { opacity:0; } 50% { opacity:1; } }
    .mc-screen-crack { position:absolute; top:0; left:0; right:0; bottom:0; pointer-events:none; z-index:5; opacity:0; transition:opacity 0.3s; }
    .mc-screen-crack.active { opacity:1; }
    .mc-vhs-distortion { position:absolute; top:0; left:0; right:0; bottom:0; pointer-events:none; z-index:5; opacity:0; background:repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.01) 3px, rgba(255,255,255,0.01) 4px); }
    .mc-vhs-distortion.active { opacity:1; animation:mcVhsFlicker 3s infinite; }
    @keyframes mcVhsFlicker { 0%,94%,100%{opacity:0.3} 95%{opacity:0.6} 97%{opacity:0.2} }
```

- [ ] **Step 2: Replace all VP builders in `js/chal/monster-cash.js`**

Delete everything from `const _mcState = {};` to the end of the file. Replace with:

```js
// ══════════════════════════════════════════════════════════════════════
// VP SCREENS — EMERGENCY BROADCAST / SURVEILLANCE THEME
// ══════════════════════════════════════════════════════════════════════

const _mcState = {};

function _mcPortrait(name, size = 32) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;border:2px solid #444;" onerror="this.style.display='none'">`;
}

function _mcShell(content, ep, threatLevel) {
  const mc = ep.monsterCash;
  const threatClass = `threat-${Math.min(threatLevel || 1, 5)}`;
  const tickerMessages = threatLevel <= 2 ? [
    'MONSTER SIGHTED IN SECTOR 7', 'ALL CONTESTANTS PROCEED TO SHELTER', 'SITUATION UNDER CONTROL',
    'ANIMATRONIC CONTAINMENT ACTIVE', 'CHEF REPORTS MINOR TECHNICAL DIFFICULTIES',
  ] : threatLevel <= 3 ? [
    'EVACUATION ROUTE BLOCKED', 'STRUCTURAL DAMAGE REPORTED ON STAGE 5', 'SITUATION ESCALATING',
    'MONSTER HEADING TOWARD BACK LOT', 'EMERGENCY BROADCAST — STAY HIDDEN', 'PROP WAREHOUSE COMPROMISED',
  ] : [
    'CHEF HAS LOST CONTROL OF THE ANIMATRONIC', 'THIS IS NOT A DRILL — REPEAT — NOT A DRILL',
    'ALL SECTORS COMPROMISED', 'SIGNAL DEGRADING', 'CONTAINMENT FAILURE — TOTAL STRUCTURAL COLLAPSE',
    'EMERGENCY SERVICES HAVE BEEN CONTACTED', 'EVACUATE IMMEDIATELY',
  ];
  const ticker = tickerMessages.sort(() => Math.random() - 0.5).slice(0, 4).join('  ///  ');

  const rubble = (mc?.capturedOrder || []).map(name =>
    `<div class="mc-rubble-portrait">${_mcPortrait(name, 24)}</div>`
  ).join('');

  return `
    <div class="rp-page" style="background:#0a0a0a;padding:0;">
    <div class="mc-shell">
      <div class="mc-film-grain"></div>
      <div class="mc-monster-silhouette ${threatClass}">🦎</div>
      ${threatLevel >= 4 ? '<div class="mc-emergency-flash"></div>' : ''}
      ${threatLevel >= 3 ? `<div class="mc-vhs-distortion ${threatLevel >= 4 ? 'active' : ''}"></div>` : ''}
      <div style="position:relative;z-index:3;padding:16px;">
        ${content}
      </div>
      <div class="mc-rubble-pile">${rubble}</div>
      <div class="mc-ticker"><span class="mc-ticker-text">/// EMERGENCY BROADCAST /// ${ticker} ///</span></div>
      <div class="mc-screen-crack ${threatLevel >= 4 ? 'active' : ''}" style="background:url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><line x1="180" y1="0" x2="200" y2="200" stroke="rgba(255,255,255,0.15)" stroke-width="1"/><line x1="200" y1="200" x2="220" y2="400" stroke="rgba(255,255,255,0.1)" stroke-width="1"/><line x1="200" y1="200" x2="280" y2="300" stroke="rgba(255,255,255,0.08)" stroke-width="1"/></svg>`)}') center/cover no-repeat;"></div>
    </div>
    </div>`;
}

function _mcThreatBar(level) {
  return `
    <div class="mc-threat-bar">
      <span class="mc-threat-label">Threat: ${THREAT_NAMES[level - 1]}</span>
      <div style="flex:1;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">
        <div class="mc-threat-fill mc-threat-${level}"></div>
      </div>
    </div>`;
}

export function rpBuildMonsterCashTitleCard(ep) {
  const mc = ep.monsterCash;
  if (!mc) return '';
  const content = `
    <div class="mc-title-card">
      <div class="mc-cam-label"><span class="mc-cam-dot"></span> ALERT — CONTAINMENT BREACH</div>
      <div class="mc-film-title">${mc.filmTitle}</div>
      <div style="margin:16px 0;font-size:12px;color:#666;">A Chris McLean Production</div>
      <div style="font-size:12px;color:#aaa;max-width:400px;margin:0 auto;">
        "${mc.chrisOpener}"
      </div>
      <div style="margin-top:20px;font-size:11px;color:#555;letter-spacing:1.5px;text-transform:uppercase;">
        ${mc.rounds.length} Rounds &middot; ${(gs.activePlayers?.length || 0) + mc.capturedOrder.length} Contestants &middot; 1 Monster
      </div>
    </div>`;
  return _mcShell(content, ep, 1);
}

function _mcBuildEventCard(ev) {
  const portrait = _mcPortrait(ev.player);
  const ptsClass = ev.negative ? 'mc-pts-neg' : 'mc-pts-pos';
  const ptsLabel = ev.negative ? `${ev.points}` : `+${ev.points}`;
  const typeClass = ev.type === 'heroic' ? 'mc-heroic' :
    (ev.type === 'sabotage' || ev.type === 'scheming') ? 'mc-sabotage' :
    ev.type === 'comedy' ? 'mc-comedy' :
    ev.type === 'showmance' ? 'mc-showmance' : '';
  return `
    <div class="mc-event-card ${typeClass}">
      ${portrait}
      <div class="mc-event-narrative">${ev.text}</div>
      ${ev.points !== 0 ? `<span class="mc-event-pts ${ptsClass}">${ptsLabel}</span>` : ''}
    </div>`;
}

function _mcBuildCaptureCard(round) {
  const name = round.captured;
  const cs = round.captureSequence;
  if (!name || !cs) return '';

  const portrait = _mcPortrait(name, 48);
  const shakeClass = cs.tier === 'comedy' ? 'mc-capture-comedy' : cs.tier === 'tense' ? 'mc-capture-tense' : 'mc-capture-terror';
  const portraitClass = cs.tier === 'comedy' ? '' : cs.tier === 'tense' ? 'mc-portrait-cracked' : 'mc-portrait-shatter';

  return `
    <div class="mc-capture-card ${shakeClass}">
      <div class="mc-captured-label">CAPTURED</div>
      <div style="text-align:center;margin:8px 0;" class="${portraitClass}">${portrait}</div>
      <div style="text-align:center;font-size:14px;color:#e8e8e8;font-weight:700;margin-bottom:8px;">${name}</div>
      <div class="mc-capture-beat">${cs.approach}</div>
      <div class="mc-capture-beat">${cs.reaction}</div>
      <div class="mc-capture-beat">${cs.grab}</div>
      <div class="mc-capture-beat" style="border-color:rgba(255,255,255,0.1);color:#999;font-style:italic;">${cs.aftermath}</div>
    </div>`;
}

function _mcBuildRound(round) {
  let html = '';
  html += `<div class="mc-cam-label"><span class="mc-cam-dot"></span> CAM ${String(round.roundNum).padStart(2, '0')} — ${round.location.toUpperCase()}</div>`;
  html += _mcThreatBar(round.threatLevel);

  html += `<div class="mc-prowl-text">${round.monsterProwl}</div>`;

  if (round.environmentalEvents?.length) {
    for (const env of round.environmentalEvents) {
      html += `<div class="mc-env-text">${env.text}</div>`;
    }
  }

  for (const ev of round.events) {
    html += _mcBuildEventCard(ev);
  }

  if (round.lastChance) {
    const lc = round.lastChance;
    const color = lc.escaped ? '#ff9800' : '#f44336';
    html += `<div class="mc-last-chance" style="border-color:${color}40;">
      <div style="font-size:10px;color:${color};font-weight:700;letter-spacing:2px;margin-bottom:4px;">LAST CHANCE</div>
      ${lc.text}
    </div>`;
  }

  if (round.rescueSequence) {
    const rs = round.rescueSequence;
    const color = rs.success ? '#4caf50' : '#f44336';
    html += `<div class="mc-rescue-card" style="border-color:${color}30;">
      <div style="font-size:10px;color:${color};font-weight:700;letter-spacing:2px;margin-bottom:4px;">RESCUE ${rs.success ? 'SUCCESS' : 'FAILED'}</div>
      <div class="mc-rescue-beat">${rs.approach}</div>
      <div class="mc-rescue-beat">${rs.action}</div>
    </div>`;
  }

  if (round.captured) {
    html += _mcBuildCaptureCard(round);
  }

  html += `<div class="mc-survivors-count">${round.survivors.length} ACTIVE FEEDS REMAINING</div>`;
  html += `<div class="mc-chris-line">${round.chrisLine}</div>`;

  return html;
}

export function rpBuildMonsterCashRounds(ep) {
  const mc = ep.monsterCash;
  if (!mc) return '';

  const stateKey = String(ep.num || 0) + '_mc';
  if (!_mcState[stateKey]) _mcState[stateKey] = { idx: -1 };

  let html = '<div class="mc-clapperboard">SURVEILLANCE FEED — CLICK TO ADVANCE</div>';

  for (let i = 0; i < mc.rounds.length; i++) {
    const round = mc.rounds[i];
    const isRevealed = i <= _mcState[stateKey].idx;
    const isActBreak = mc.actBreaks.includes(i) && i > 0;

    if (isActBreak) {
      html += `<div class="mc-clapperboard" style="margin-top:16px;border-color:#f44;">— THREAT LEVEL INCREASING —</div>`;
    }

    html += `<div id="mc-round-${i}" style="display:${isRevealed ? 'block' : 'none'};">`;
    html += `<div style="font-size:11px;color:#666;margin-top:12px;letter-spacing:1px;">ROUND ${round.roundNum}</div>`;
    html += _mcBuildRound(round);
    html += '</div>';
  }

  html += `<div id="mc-reveal-btn" style="text-align:center;margin-top:16px;">
    <button onclick="window.monsterCashRevealNext()" style="padding:8px 24px;background:#ff5722;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700;letter-spacing:1px;">
      NEXT FEED ▶
    </button>
    <button onclick="window.monsterCashRevealAll()" style="padding:8px 16px;background:#333;color:#aaa;border:1px solid #555;border-radius:6px;cursor:pointer;margin-left:8px;font-size:11px;">
      Reveal All
    </button>
  </div>`;

  const maxThreat = mc.rounds.reduce((max, r) => Math.max(max, r.threatLevel), 1);
  return _mcShell(html, ep, maxThreat);
}

export function monsterCashRevealNext() {
  const mc = gs.episodeHistory[gs.episodeHistory.length - 1]?.monsterCash;
  if (!mc) return;
  const ep = gs.episodeHistory[gs.episodeHistory.length - 1];
  const stateKey = String(ep.num || 0) + '_mc';
  if (!_mcState[stateKey]) _mcState[stateKey] = { idx: -1 };
  _mcState[stateKey].idx++;
  const el = document.getElementById(`mc-round-${_mcState[stateKey].idx}`);
  if (el) {
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  if (_mcState[stateKey].idx >= mc.rounds.length - 1) {
    const btn = document.getElementById('mc-reveal-btn');
    if (btn) btn.style.display = 'none';
  }
}

export function monsterCashRevealAll() {
  const mc = gs.episodeHistory[gs.episodeHistory.length - 1]?.monsterCash;
  if (!mc) return;
  const ep = gs.episodeHistory[gs.episodeHistory.length - 1];
  const stateKey = String(ep.num || 0) + '_mc';
  if (!_mcState[stateKey]) _mcState[stateKey] = { idx: -1 };
  for (let i = 0; i < mc.rounds.length; i++) {
    const el = document.getElementById(`mc-round-${i}`);
    if (el) el.style.display = 'block';
  }
  _mcState[stateKey].idx = mc.rounds.length - 1;
  const btn = document.getElementById('mc-reveal-btn');
  if (btn) btn.style.display = 'none';
}

export function rpBuildMonsterCashShowdown(ep) {
  const mc = ep.monsterCash;
  if (!mc?.finalShowdown) return '';
  const fs = mc.finalShowdown;

  const content = `
    <div style="text-align:center;padding:20px;">
      <div class="mc-cam-label" style="justify-content:center;"><span class="mc-cam-dot"></span> LAST TWO FEEDS ACTIVE</div>
      <div style="display:flex;justify-content:center;align-items:center;gap:20px;margin:20px 0;">
        <div style="text-align:center;">
          ${_mcPortrait(fs.survivor1, 64)}
          <div style="font-size:13px;color:#e8e8e8;margin-top:6px;font-weight:700;">${fs.survivor1}</div>
          <div style="font-size:11px;color:#888;">Score: ${(mc.scores[fs.survivor1] || 0).toFixed(1)}</div>
        </div>
        <div style="font-size:24px;color:#ff5722;font-weight:900;">VS</div>
        <div style="text-align:center;">
          ${_mcPortrait(fs.survivor2, 64)}
          <div style="font-size:13px;color:#e8e8e8;margin-top:6px;font-weight:700;">${fs.survivor2}</div>
          <div style="font-size:11px;color:#888;">Score: ${(mc.scores[fs.survivor2] || 0).toFixed(1)}</div>
        </div>
      </div>
      <div style="font-size:13px;color:#ccc;margin-top:12px;max-width:400px;margin-left:auto;margin-right:auto;">
        The monster bears down on the last two survivors. Only one can escape.
      </div>
      <div style="font-size:14px;color:#ff9800;margin-top:16px;font-weight:700;">
        ${fs.method}
      </div>
    </div>`;
  return _mcShell(content, ep, 5);
}

export function rpBuildMonsterCashImmunity(ep) {
  const mc = ep.monsterCash;
  if (!mc) return '';
  const winner = mc.immunityWinner;
  if (!winner) return '';

  const ws = pStats(winner);
  const wp = pronouns(winner);
  let flavorText = '';
  if (ws.physical >= 8) flavorText = `${winner} powered through the destruction like it was nothing. The monster couldn't keep up.`;
  else if (ws.mental >= 8) flavorText = `${winner} read every move the monster made. ${wp.Sub} was always two steps ahead.`;
  else if (ws.endurance >= 8) flavorText = `${winner} outlasted everyone. When the monster came, ${wp.sub} just kept running.`;
  else if (ws.strategic >= 8) flavorText = `${winner} played the film lot like a chess board. Every hiding spot, every escape route — calculated.`;
  else flavorText = `${winner} survived the monster's rampage. Sometimes that's all it takes.`;

  const content = `
    <div style="text-align:center;padding:30px;">
      <div class="mc-cam-label" style="justify-content:center;"><span class="mc-cam-dot" style="background:#4caf50;"></span> SURVIVOR CONFIRMED</div>
      <div style="display:inline-block;position:relative;margin-top:12px;">
        ${_mcPortrait(winner, 80)}
        <div style="position:absolute;bottom:-4px;right:-4px;background:#4caf50;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:14px;">🛡️</div>
      </div>
      <div style="font-size:20px;color:#e8e8e8;font-weight:900;margin-top:12px;">${winner}</div>
      <div style="font-size:12px;color:#888;margin-top:4px;">Score: ${(mc.scores[winner] || 0).toFixed(1)}</div>
      <div style="font-size:13px;color:#aaa;margin-top:16px;max-width:400px;margin-left:auto;margin-right:auto;">
        ${flavorText}
      </div>
    </div>`;
  return _mcShell(content, ep, 1);
}

export function rpBuildMonsterCashLeaderboard(ep) {
  const mc = ep.monsterCash;
  if (!mc) return '';

  let rows = '';
  mc.leaderboard.forEach((entry, i) => {
    const isWinner = entry.name === mc.immunityWinner;
    const capturedText = entry.capturedRound ? `Rd ${entry.capturedRound}` : '—';
    const statusIcon = isWinner ? '🛡️' : '';
    const rowColor = isWinner ? 'rgba(76,175,80,0.1)' : 'transparent';

    rows += `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:${rowColor};border-radius:4px;margin:2px 0;">
        <span style="font-size:11px;color:#666;width:20px;text-align:right;">${i + 1}.</span>
        ${_mcPortrait(entry.name, 28)}
        <span style="flex:1;font-size:13px;color:#ccc;font-weight:${isWinner ? '700' : '400'};">${entry.name} ${statusIcon}</span>
        <span style="font-size:12px;color:#888;width:50px;text-align:center;">${capturedText}</span>
        <span style="font-size:12px;font-weight:700;color:${entry.score >= 0 ? '#4caf50' : '#f44336'};width:50px;text-align:right;">${entry.score.toFixed(1)}</span>
      </div>`;
  });

  let tribeSection = '';
  if (mc.tribeScores) {
    tribeSection = `<div style="margin-top:16px;"><div class="mc-clapperboard">SECTOR PERFORMANCE RATINGS</div>`;
    Object.entries(mc.tribeScores).sort(([,a],[,b]) => b - a).forEach(([name, score], i) => {
      const color = i === 0 ? '#4caf50' : '#f44336';
      tribeSection += `<div style="font-size:13px;color:${color};text-align:center;margin:4px 0;">${i === 0 ? '🏆' : '📛'} ${name}: ${score.toFixed(1)} avg</div>`;
    });
    tribeSection += '</div>';
  }

  const content = `
    <div style="padding:16px;">
      <div class="mc-clapperboard" style="margin-bottom:12px;">INCIDENT REPORT — SURVIVAL LOG</div>
      <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;">
        <span style="width:20px;"></span>
        <span style="width:32px;"></span>
        <span style="flex:1;">Operative</span>
        <span style="width:50px;text-align:center;">Caught</span>
        <span style="width:50px;text-align:right;">Rating</span>
      </div>
      ${rows}
      ${tribeSection}
      <div style="text-align:center;margin-top:20px;font-size:11px;color:#555;font-style:italic;">
        "${mc.chrisCloser}"
      </div>
    </div>`;
  return _mcShell(content, ep, 1);
}
```

- [ ] **Step 3: Commit**

```bash
git add js/chal/monster-cash.js simulator.html
git commit -m "feat(monster-cash): overhaul VP screens with emergency broadcast theme"
```

---

### Task 6: VP Screen Registration Update

**Files:**
- Modify: `js/vp-screens.js:10315-10343`

- [ ] **Step 1: Update VP screen registration**

Find the Monster Cash VP block in `js/vp-screens.js` (around line 10315). Remove the `rpBuildMonsterCashElimination` screen push since post-merge no longer auto-eliminates. The block should now be:

```js
  } else if (ep.isMonsterCash && ep.monsterCash) {
    vpScreens.push({ id:'mc-title', label:'🦎 Monster Cash', html: rpBuildMonsterCashTitleCard(ep) });
    vpScreens.push({ id:'mc-rounds', label:'The Hunt', html: rpBuildMonsterCashRounds(ep) });
    if (ep.monsterCash.finalShowdown) {
      vpScreens.push({ id:'mc-showdown', label:'Final Showdown', html: rpBuildMonsterCashShowdown(ep) });
    }
    if (ep.monsterCash.immunityWinner) {
      vpScreens.push({ id:'mc-immunity', label:'Immunity', html: rpBuildMonsterCashImmunity(ep) });
    }
    vpScreens.push({ id:'mc-leaderboard', label:'Incident Report', html: rpBuildMonsterCashLeaderboard(ep) });
```

Also update the import line to remove `rpBuildMonsterCashElimination` from the import.

- [ ] **Step 2: Commit**

```bash
git add js/vp-screens.js
git commit -m "fix(monster-cash): remove eliminated VP screen, update imports"
```

---

### Task 7: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update Monster Cash description in CLAUDE.md**

Find the Monster Cash entry in the "Both Phases" challenge table. Update the description to remove "lowest scorer auto-eliminated" and replace with "normal tribal council":

```markdown
| `monster-cash` | Monster Cash | Monster movie hunt. Chef's animatronic prowls the film lot. Monster escalates through 5 threat levels (Awakening→Final Form). Capture events, rescues, sabotage. Pre-merge: tribe immunity by avg survival. Post-merge: last standing wins, normal tribal council follows. |
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update Monster Cash description (no auto-elimination)"
```

---

### Task 8: Smoke Test

- [ ] **Step 1: Open simulator in browser**

Open `simulator.html` in a browser. Hard refresh.

- [ ] **Step 2: Test post-merge Monster Cash**

1. Load S9 Cast
2. Set a post-merge episode to `monster-cash` twist
3. Run to that episode
4. Verify:
   - Text backlog has narrative sentences (not "Player: Event (+2)")
   - VP title card shows containment breach alert
   - VP rounds show camera labels, monster prowl text, narrative event cards
   - Capture sequences have 4 beats (approach, reaction, grab, aftermath)
   - Immunity screen shows "SURVIVOR CONFIRMED"
   - Leaderboard shows "INCIDENT REPORT"
   - NO elimination screen — normal tribal follows
   - Chris commentary changes by act

- [ ] **Step 3: Test pre-merge Monster Cash**

1. Reset
2. Set episode 2 to `monster-cash`
3. Run to episode 2
4. Verify:
   - Tribe immunity works (winning + losing tribe set correctly)
   - Losing tribe goes to tribal council
   - Tribe scores show in leaderboard as "SECTOR PERFORMANCE RATINGS"

- [ ] **Step 4: Check for console errors**

Open browser dev tools. Check for:
- No undefined errors
- No missing function errors
- No serialization issues

- [ ] **Step 5: Fix any bugs found and commit**

```bash
git add -A
git commit -m "fix(monster-cash): smoke test fixes"
```
