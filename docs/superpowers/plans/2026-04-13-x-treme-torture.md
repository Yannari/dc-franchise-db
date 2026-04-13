# X-Treme Torture Challenge Twist — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the X-Treme Torture challenge twist — a 3-event extreme sports challenge (Sofa Bed Skydiving, Rodeo Moose Riding, Mud Skiing) with deep social mechanics, injuries, cross-tribe sabotage, composable narrative text, romance integration, and an overdrive VP screen.

**Architecture:** Single file (`simulator.html`). The challenge follows the established twist pattern: text pools → simulation function → VP builder → integration hooks. The simulation generates an `ep.xtremeTorture` data object consumed by the VP. Social events fire during the simulation and generate camp events. The VP uses the flat-steps click-to-reveal pattern (like Dodgebrawl's per-event reveal).

**Tech Stack:** Vanilla JS + CSS in `simulator.html`. No dependencies.

**Spec:** `docs/superpowers/specs/2026-04-13-x-treme-torture-design.md`

---

## File Map

All changes in `simulator.html`:

| Section | Approx Lines | What Changes |
|---|---|---|
| Text pools (constants) | Near 7347 | Add `XT_SKY_*`, `XT_MOOSE_*`, `XT_SKI_*` composable text pools |
| Simulation function | After 19662 (after simulateBasicStraining) | Add `simulateXtremeTorture(ep)` (~500-700 lines) |
| Text backlog | After 44313 (after _textBasicStraining) | Add `_textXtremeTorture(ep, ln, sec)` |
| CSS | After Cliff Dive Overdrive CSS (~line 600) | Add `.xt-*` overdrive classes and keyframes |
| VP builder | After rpBuildCliffDive (~line 67120) | Add `rpBuildXtremeTorture(ep)` (~300-400 lines) |
| Integration hooks | Multiple locations | Registration, dispatch, patch, badge, debug tab, VP push |

---

## Task 1: Integration Hooks (Wiring)

Wire the challenge into all existing systems before writing any logic. This ensures the challenge can be selected and dispatched even with a stub simulation.

**Files:** Modify `simulator.html` at 8 integration points

- [ ] **Step 1: Add engine registration**

After line 26872 (`} else if (engineType === 'basic-straining') {`), add:

```javascript
  } else if (engineType === 'x-treme-torture') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    if (epNum < 2) return;
    ep.isXtremeTorture = true;
```

- [ ] **Step 2: Add challenge dispatch**

After line 38139 (end of basic straining dispatch), add:

```javascript
  } else if (ep.isXtremeTorture && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateXtremeTorture(ep);
```

- [ ] **Step 3: Add to updateChalRecord skip list**

On line 38475, add `&& !ep.isXtremeTorture` after `!ep.isBasicStraining`:

```javascript
if (!ep.isDodgebrawl && !ep.isCliffDive && ... && !ep.isBasicStraining && !ep.isXtremeTorture) {
```

- [ ] **Step 4: Add to patchEpisodeHistory**

After line 46932, add:

```javascript
  if (ep.isXtremeTorture) h.isXtremeTorture = true;
  if (!h.xtremeTorture && ep.xtremeTorture) h.xtremeTorture = ep.xtremeTorture;
```

- [ ] **Step 5: Add episode history badge tag**

Find the section where other twist tags are defined (near line 47614-47620). Add:

```javascript
const xtTag = ep.isXtremeTorture ? `<span class="ep-hist-tag" style="background:rgba(239,68,68,0.15);color:#ef4444">X-Treme Torture</span>` : '';
```

And add `${xtTag}` to the tag concatenation.

- [ ] **Step 6: Add to debug challenge tab visibility**

On line 52631, add `|| ep.isXtremeTorture` after `ep.isBasicStraining`:

```javascript
${(ep.chalMemberScores || ... || ep.isBasicStraining || ep.isXtremeTorture) ? _tabBtn('challenge', 'Challenge') : ''}
```

- [ ] **Step 7: Add to _chalType ternary chain**

On line 53329, add before the final `: _chalLabel`:

```javascript
ep.isXtremeTorture ? 'X-Treme Torture' :
```

- [ ] **Step 8: Add VP screen registration**

After line 68929 (basic straining VP push), add:

```javascript
  } else if (ep.isXtremeTorture && ep.xtremeTorture) {
    vpScreens.push({ id:'xtreme-torture', label:'X-Treme Torture', html: rpBuildXtremeTorture(ep) });
  }
```

- [ ] **Step 9: Commit**

```bash
git add simulator.html
git commit -m "feat(x-treme-torture): wire integration hooks for new challenge twist"
```

---

## Task 2: Composable Text Pools

Add all narrative text pools near the existing `CLIFF_DIVE_JUMPED` pools (around line 7347). These use the composable segment pattern from Trust Challenge: functions that take `(name, pr)` and return text strings, organized by stat tier.

**Files:** Modify `simulator.html` near line 7347

- [ ] **Step 1: Add Skydiving text pools**

Insert after the Cliff Dive text pools (after `CLIFF_DIVE_CHICKEN`). Each pool is an object with `high`/`mid`/`low` arrays of template functions:

```javascript
// ══════════════════════════════════════════════════════════════════════
// X-TREME TORTURE TEXT POOLS (composable segments)
// ══════════════════════════════════════════════════════════════════════

const XT_SKY_PLANE = {
  high: [
    (n, pr) => `${n} looks out the plane door and grins. "This is nothing." ${pr.Sub} ${pr.sub === 'they' ? 'crack' : 'cracks'} ${pr.posAdj} knuckles.`,
    (n, pr) => `${n} is already standing at the door before Chris finishes the safety briefing. "${pr.Sub}'s done scarier things before breakfast."`,
    (n, pr) => `${n} peers down at the drop zone. One thousand feet. ${pr.Sub} ${pr.sub === 'they' ? 'don\'t' : 'doesn\'t'} even flinch.`,
  ],
  mid: [
    (n, pr) => `${n} takes a deep breath at the plane door. Looks down. Looks away. Looks down again. "Okay. Okay, I can do this."`,
    (n, pr) => `${n} grips the doorframe. The wind is louder than ${pr.sub} expected. ${pr.Sub} ${pr.sub === 'they' ? 'swallow' : 'swallows'} hard.`,
    (n, pr) => `${n} inches toward the edge. Every instinct says no. But ${pr.posAdj} team is counting on ${pr.obj}.`,
  ],
  low: [
    (n, pr) => `${n} is plastered against the back wall of the plane. "${pr.Sub} ${pr.sub === 'they' ? 'aren\'t' : 'isn\'t'} going anywhere near that door."`,
    (n, pr) => `${n}'s hands are shaking. ${pr.Sub} ${pr.sub === 'they' ? 'look' : 'looks'} at the parachute like it's a death sentence.`,
    (n, pr) => `${n} is hyperventilating. "How high did he say? One THOUSAND?" ${pr.PosAdj} voice cracks.`,
  ]
};

const XT_SKY_JUMP = {
  willing: [
    (n, pr) => `${n} steps off the edge. Clean exit. No hesitation.`,
    (n, pr) => `${n} takes one last look at ${pr.posAdj} team below, nods, and jumps.`,
    (n, pr) => `"See you at the bottom." ${n} leaps.`,
  ],
  hesitant: [
    (n, pr) => `${n} stands at the edge for ten long seconds. The wind howls. Then ${pr.sub} ${pr.sub === 'they' ? 'jump' : 'jumps'}.`,
    (n, pr) => `${n} almost turns back twice. Finally, eyes squeezed shut, ${pr.sub} ${pr.sub === 'they' ? 'step' : 'steps'} off.`,
    (n, pr) => `${n} counts to three. Stops at two. Counts again. Then goes.`,
  ],
  pushed: [
    (n, pr, pusher) => `${pusher} gives ${n} a "comforting pat" on the back — which sends ${pr.obj} tumbling out of the plane.`,
    (n, pr, pusher) => `"You've got this!" ${pusher} shoves ${n} before ${pr.sub} can protest. ${n}'s scream echoes all the way down.`,
    (n, pr, pusher) => `${n} is still saying "I'm not ready" when ${pusher}'s hand connects with ${pr.posAdj} back. Out ${pr.sub} ${pr.sub === 'they' ? 'go' : 'goes'}.`,
  ],
  refused: [
    (n, pr) => `${n} plants ${pr.posAdj} feet. "No. Absolutely not." No amount of yelling changes ${pr.posAdj} mind.`,
    (n, pr) => `${n} looks down, goes pale, and sits on the floor of the plane. "${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} not jumping." Final answer.`,
    (n, pr) => `${n} shakes ${pr.posAdj} head so hard it's a blur. "Find someone else." The team gets zero for this event.`,
  ]
};

const XT_SKY_FALL = {
  perfect: [
    (n, pr) => `Chute deploys perfectly. ${n} floats down in a controlled descent, steering toward the target.`,
    (n, pr) => `Blue cord, red cord — ${n} pulls them in order. The parachute blooms open. Textbook.`,
  ],
  late: [
    (n, pr) => `${n} fumbles with the cord — finally pulls it at the last possible second. The chute snaps open and ${pr.sub} ${pr.sub === 'they' ? 'jerk' : 'jerks'} upward violently.`,
    (n, pr) => `The ground is getting very close very fast before ${n} remembers to pull the cord. The chute opens with barely enough time.`,
  ],
  tangled: [
    (n, pr) => `${n} pulls the cord and the chute tangles immediately. ${pr.Sub}'s spinning — can't see — can't steer.`,
    (n, pr) => `The parachute half-opens and starts corkscrewing. ${n} is a ragdoll in the wind.`,
  ],
  forgot: [
    (n, pr) => `In ${pr.posAdj} panic, ${n} completely forgets to pull the cord. Free-falling. The ground is coming fast.`,
    (n, pr) => `${n}'s too busy screaming to remember the parachute. ${pr.Sub} ${pr.sub === 'they' ? 'plummet' : 'plummets'} like a stone.`,
  ]
};

const XT_SKY_GROUND = {
  perfect: [
    (names) => `The ground crew moves like a machine. Sofa bed positioned dead center under the drop zone.`,
    (names) => `${names[0]} calls the shots. The team slides the sofa bed into place with seconds to spare.`,
  ],
  decent: [
    (names) => `The ground crew scrambles. The bed's a little off — but close enough.`,
    (names) => `"LEFT! No, MY left!" The team argues, but gets the bed roughly in position.`,
  ],
  chaos: [
    (names, sleeper) => sleeper ? `The team tries to move the sofa bed — but ${sleeper} is asleep on it. They can't budge it.` : `The ground crew drops one end. Then the other. The bed is nowhere near the landing zone.`,
    (names) => `Two crew members pull in opposite directions. A third trips over the bed frame. It's a disaster.`,
  ]
};

const XT_SKY_LANDING = {
  perfect: [
    (n, pr) => `${n} touches down dead center on the sofa bed. Perfect landing. Bounces once, sits up grinning.`,
    (n, pr) => `Soft landing. ${n} sinks into the sofa cushions like ${pr.sub} ${pr.sub === 'they' ? 'were' : 'was'} landing on a cloud. The team erupts.`,
  ],
  rough: [
    (n, pr) => `${n} clips the edge of the sofa bed and tumbles into the sand. Rough, but ${pr.sub}'s okay. Mostly.`,
    (n, pr) => `${n} hits the sofa bed sideways. The frame collapses. ${pr.Sub}'s dazed but standing.`,
  ],
  crash: [
    (n, pr) => `${n} misses the sofa bed entirely. Face-first into the sand. The impact leaves a ${n}-shaped impression.`,
    (n, pr) => `${n} lands hard. Really hard. The sand doesn't cushion much from a thousand feet. ${pr.Sub} ${pr.sub === 'they' ? 'don\'t' : 'doesn\'t'} get up right away.`,
  ],
  injury: [
    (n, pr) => `${n} isn't moving. Medics rush in. It's bad — full body cast by the end of the hour. "Nurse Hatchet" wheels ${pr.obj} away.`,
    (n, pr) => `The crash is ugly. ${n} tries to stand and crumples. Something's wrong. Chef appears with a stretcher and a concerning grin.`,
  ]
};
```

- [ ] **Step 2: Add Moose Riding text pools**

```javascript
const XT_MOOSE_APPROACH = {
  high: [
    (n, pr, mooseType) => `${n} walks up to the moose like it's a house cat. "${pr.Sub}'s ridden worse."`,
    (n, pr, mooseType) => `${n} squares up. The moose is ${mooseType === 'aggressive' ? 'snorting and pawing the ground' : mooseType === 'lazy' ? 'barely awake' : mooseType === 'chaotic' ? 'spinning in circles' : 'shaking in the pen'}. ${n} doesn't care.`,
  ],
  mid: [
    (n, pr, mooseType) => `${n} eyes the moose. It's... bigger than expected. ${mooseType === 'aggressive' ? '"It looks angry."' : mooseType === 'chaotic' ? '"Is it supposed to do that?"' : '"Okay. Okay, it\'s fine."'}`,
    (n, pr, mooseType) => `${n} takes a steadying breath. The moose ${mooseType === 'aggressive' ? 'locks eyes with ' + pr.obj + ' and snorts' : 'makes a noise that\'s somewhere between a grunt and a scream'}.`,
  ],
  low: [
    (n, pr, mooseType) => `${n} stops dead twenty feet from the pen. "That's not a moose. That's a tank with antlers."`,
    (n, pr, mooseType) => `${n}'s legs have stopped working. The moose is ${mooseType === 'aggressive' ? 'literally trying to break out of the pen' : 'making direct eye contact and it\'s terrifying'}. ${pr.Sub} ${pr.sub === 'they' ? 'don\'t' : 'doesn\'t'} want to do this.`,
  ]
};

const XT_MOOSE_MOUNT = {
  success: [
    (n, pr) => `${n} grabs the antlers, swings a leg over, and holds on. Ride's starting.`,
    (n, pr) => `${n} clambers up. It takes two tries but ${pr.sub}'s on. The moose does NOT approve.`,
  ],
  fail: [
    (n, pr) => `${n} tries to mount the moose and slides right off the other side. The moose looks insulted.`,
    (n, pr) => `${n} gets one leg over and the moose takes a step. ${n} falls. Gets up. Falls again. This is going nowhere.`,
  ]
};

const XT_MOOSE_BUCK = {
  hold: [
    (n, pr, round) => round <= 2 ? `The moose bucks hard. ${n} grips the antlers — holds on!` : `Round ${round}. ${n}'s arms are burning but ${pr.sub} ${pr.sub === 'they' ? 'won\'t' : 'won\'t'} let go. Grit.`,
    (n, pr, round) => round <= 2 ? `Buck! ${n} absorbs it. Legs locked. Still riding.` : `The moose is furious now. ${n} is barely hanging on — but hanging on.`,
    (n, pr, round) => round >= 4 ? `Round ${round}. The crowd is screaming. ${n} is white-knuckling it. This is legendary.` : `Another buck. ${n} sways but corrects. Still up.`,
  ],
  thrown: [
    (n, pr, round) => round <= 2 ? `One buck and ${n} is airborne. ${pr.Sub} didn't last long.` : `Round ${round} — the moose finds another gear. ${n} loses ${pr.posAdj} grip and goes flying.`,
    (n, pr, round) => round <= 2 ? `The moose barely tries. ${n} slides off like wet soap.` : `${n}'s been fighting for ${round} rounds but ${pr.posAdj} hands give out. Off ${pr.sub} ${pr.sub === 'they' ? 'go' : 'goes'}.`,
  ]
};

const XT_MOOSE_DISMOUNT_LOCATION = [
  'a pile of smelly socks',
  'the lake',
  'a bush',
  'Chris\'s craft services table',
  'a bewildered cameraman',
  'Chef\'s lunch setup',
  'the confessional outhouse',
];

const XT_MOOSE_DISMOUNT = {
  graceful: [
    (n, pr) => `The buzzer sounds. ${n} dismounts on ${pr.posAdj} own terms. Tips an imaginary hat to the moose.`,
    (n, pr) => `Five rounds. ${n} slides off, legs wobbling but upright. The moose actually looks impressed.`,
  ],
  thrown: [
    (n, pr, location) => `${n} launches off the moose like a catapult. Sails through the air. Lands in ${location}.`,
    (n, pr, location) => `The moose bucks ${n} into orbit. ${pr.Sub} ${pr.sub === 'they' ? 'crash' : 'crashes'} into ${location}. The crowd winces.`,
    (n, pr, location) => `${n} is LAUNCHED. Spinning. Screaming. Disappears into ${location}. There's a long pause. Then a thumbs-up emerges.`,
  ]
};
```

- [ ] **Step 3: Add Mud Skiing text pools**

```javascript
const XT_SKI_START = {
  clean: [
    (skier, driver, spr) => `The jet ski roars to life. ${skier} braces. ${driver} hits the throttle — clean launch, rope taut, skis level.`,
    (skier, driver, spr) => `${driver} eases into it. Professional start. ${skier} rises out of the mud and finds ${spr.posAdj} balance.`,
  ],
  jolt: [
    (skier, driver, spr) => `${driver} GUNS it from zero. ${skier} is yanked off ${spr.posAdj} skis and dragged face-first through the mud.`,
    (skier, driver, spr) => `${driver} launches the jet ski like a missile. ${skier}'s rope arm nearly dislocates. ${spr.Sub}'s being dragged.`,
  ],
  joltResisted: [
    (skier, driver, spr) => `${driver} tries to jolt ${skier} — but ${spr.sub} ${spr.sub === 'they' ? 'absorb' : 'absorbs'} the shock. Feet planted. "Nice try."`,
    (skier, driver, spr) => `The launch is violent but ${skier} was ready for it. Skis dig into mud. ${spr.Sub} ${spr.sub === 'they' ? 'hold' : 'holds'}.`,
  ]
};

const XT_SKI_FLAG = {
  collect: [
    (skier, flagNum, spr) => `Flag ${flagNum} — ${skier} reaches out and snatches it clean.`,
    (skier, flagNum, spr) => flagNum >= 4 ? `Flag ${flagNum}. ${skier}'s in a rhythm now. Hand out, grab, tuck. Machine.` : `${skier} leans for flag ${flagNum} — got it!`,
    (skier, flagNum, spr) => `Flag ${flagNum}. ${skier} does a ramp backflip and catches it on the way down. Show-off.`,
  ],
  miss: [
    (skier, flagNum, spr) => `Flag ${flagNum} — ${skier} reaches... and ${spr.posAdj} fingers brush it but can't grip. Miss.`,
    (skier, flagNum, spr) => `${skier} lunges for flag ${flagNum} and nearly falls. Misses by inches.`,
  ],
  swerved: [
    (skier, flagNum, spr, driver) => `${driver} swerves at the last second. ${skier} reaches for flag ${flagNum} but the rope yanks ${spr.obj} sideways. Miss.`,
    (skier, flagNum, spr, driver) => `Flag ${flagNum} is right there — but ${driver} cuts hard. ${skier}'s angle is ruined.`,
  ]
};

const XT_SKI_SABOTAGE = {
  attempt: [
    (driver, skier, dpr) => `${driver} spots a curve ahead and cranks the wheel. Trying to whip ${skier} into the rocks.`,
    (driver, skier, dpr) => `${driver} suddenly brakes and accelerates — the rope snaps taut. ${dpr.Sub}'s trying to crash ${skier}.`,
  ],
  backfire: [
    (driver, skier, dpr) => `${driver} turns too hard — the jet ski tips. ${dpr.Sub} ${dpr.sub === 'they' ? 'go' : 'goes'} flying. ${skier} keeps sliding on momentum.`,
    (driver, skier, dpr) => `The crash attempt backfires spectacularly. ${driver} eats mud. ${skier} sails past, still upright. The crowd roars.`,
  ],
  success: [
    (driver, skier, dpr, spr) => `${skier} goes down hard. Mud everywhere. ${driver} doesn't even look back.`,
    (driver, skier, dpr, spr) => `The deliberate crash works. ${skier} is face-down in the mud. ${driver} guns it to the finish alone.`,
  ]
};

const XT_SKI_FINISH = {
  clean: [
    (skier, driver, spr) => `${skier} crosses the finish line upright. Mud-soaked but triumphant.`,
    (skier, driver, spr) => `${skier} slides across the line. Drops the rope. Collapses. But ${spr.sub} finished.`,
  ],
  driverRefused: [
    (skier, driver, spr) => `${driver} stops the jet ski ten feet from the finish. Won't cross. "I'm not giving them the win."`,
    (skier, driver, spr) => `${driver} deliberately veers off course before the line. Not happening.`,
  ],
  momentumSuccess: [
    (skier, driver, spr) => `${driver} stops — but ${skier}'s momentum carries ${spr.obj} across the line anyway. The crowd goes insane.`,
    (skier, driver, spr) => `${skier} lets go of the rope and slides through the mud across the finish. ${driver} just stares. ${spr.Sub} did it.`,
  ],
  momentumFail: [
    (skier, driver, spr) => `${driver} stops and ${skier} runs out of momentum three feet from the line. So close. So far.`,
    (skier, driver, spr) => `Without the jet ski pulling, ${skier} slows to a stop just short. ${spr.Sub} pounds the mud in frustration.`,
  ]
};

const XT_SELECTION = {
  volunteer: [
    (n, pr, event) => `${n} steps up for ${event}. No hesitation. "${pr.Sub} ${pr.sub === 'they' ? 'have' : 'has'} got this."`,
    (n, pr, event) => `"I'll do ${event}." ${n} volunteers before anyone else can speak.`,
  ],
  assigned: [
    (n, pr, event) => `The tribe looks at ${n}. ${pr.Sub} ${pr.sub === 'they' ? 'sigh' : 'sighs'}. "Fine. ${event}. I'll do it."`,
    (n, pr, event) => `${n} is volunteered by the group for ${event}. ${pr.PosAdj} expression says everything.`,
  ],
  forced: [
    (n, pr, event, refuser) => `After ${refuser} refuses, ${n} is forced into ${event}. ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} not happy about it.`,
    (n, pr, event, refuser) => `Someone has to do ${event}. ${refuser} won't. That leaves ${n}. The look ${pr.sub} ${pr.sub === 'they' ? 'give' : 'gives'} ${refuser} could curdle milk.`,
  ],
  refused: [
    (n, pr, event) => `${n} plants ${pr.posAdj} feet. "No. Not doing ${event}." The tribe stares in disbelief.`,
    (n, pr, event) => `"Absolutely not." ${n} refuses ${event} flat out. ${pr.PosAdj} teammates are furious.`,
  ]
};
```

- [ ] **Step 4: Commit text pools**

```bash
git add simulator.html
git commit -m "feat(x-treme-torture): add composable text pools for all 3 events"
```

---

## Task 3: Simulation Function — Core Structure + Selection

Create the simulation function shell with player selection, event assignment, and the data structure.

**Files:** Modify `simulator.html`, insert after `simulateBasicStraining` (after line ~19662)

- [ ] **Step 1: Create function shell with selection logic**

```javascript
function simulateXtremeTorture(ep) {
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const host = seasonConfig.host || 'Chris';
  const epNum = (gs.episode || 0) + 1;

  if (!ep.campEvents) ep.campEvents = {};
  if (!gs.lingeringInjuries) gs.lingeringInjuries = {};
  gs.tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });

  const tribes = gs.tribes;
  const EVENT_NAMES = ['Sofa Bed Skydiving', 'Rodeo Moose Riding', 'Mud Skiing'];

  // ── PLAYER SELECTION ──
  const selections = {}; // { tribeName: { sky: name, moose: name, ski: name } }
  const refusals = [];

  tribes.forEach(tribe => {
    const available = [...tribe.members].filter(m => gs.activePlayers.includes(m) && !gs.lingeringInjuries[m]);
    const used = new Set();
    const sel = {};

    // Selection for each event with archetype bias
    ['sky', 'moose', 'ski'].forEach((evKey, evIdx) => {
      const remaining = available.filter(m => !used.has(m));
      // If no one left, allow repeats
      const pool = remaining.length > 0 ? remaining : available.filter(m => true);
      if (!pool.length) return;

      // Weight by relevant stats
      const weights = pool.map(name => {
        const s = pStats(name);
        const arch = players.find(p => p.name === name)?.archetype || '';
        let w = 1;
        if (evKey === 'sky') w += s.boldness * 0.08 + s.physical * 0.03;
        if (evKey === 'moose') w += s.endurance * 0.08 + s.physical * 0.04;
        if (evKey === 'ski') w += s.physical * 0.05 + s.mental * 0.04 + s.strategic * 0.03;
        if (['hero', 'physical'].includes(arch)) w += 0.15;
        if (['villain', 'schemer'].includes(arch) && evKey !== 'ski') w -= 0.10;
        return Math.max(0.05, w);
      });

      // Weighted random selection
      const totalW = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * totalW;
      let picked = pool[pool.length - 1];
      for (let i = 0; i < pool.length; i++) {
        r -= weights[i];
        if (r <= 0) { picked = pool[i]; break; }
      }

      // Refusal check
      const ps = pStats(picked);
      const refuseChance = Math.max(0, 0.08 + (5 - ps.boldness) * 0.03 + (5 - ps.loyalty) * 0.02);
      const pr = pronouns(picked);
      if (Math.random() < refuseChance && remaining.length > 1) {
        // Refused — pick next person
        refusals.push({ name: picked, tribe: tribe.name, event: EVENT_NAMES[evIdx] });
        const replacement = remaining.filter(m => m !== picked)[0] || available.filter(m => m !== picked)[0];
        if (replacement) {
          sel[evKey] = replacement;
          used.add(replacement);
          // Heat for refuser
          tribe.members.forEach(tm => {
            if (tm !== picked) addBond(tm, picked, -0.3);
          });
        }
      } else {
        sel[evKey] = picked;
        used.add(picked);
      }
    });

    selections[tribe.name] = sel;
  });

  // ── Initialize result structure ──
  const xt = {
    selections,
    refusals,
    skydiving: [],
    mooseRiding: [],
    mudSkiing: [],
    sidelineEvents: [],
    tribeScores: {},
    campEvents: {},
    winner: null,
    loser: null,
    mvp: null,
  };

  // Build tribe score tracker
  tribes.forEach(t => { xt.tribeScores[t.name] = { sky: 0, moose: 0, ski: 0, total: 0 }; });

  // Selection text
  const selectionText = {};
  tribes.forEach(tribe => {
    const sel = selections[tribe.name];
    selectionText[tribe.name] = {};
    ['sky', 'moose', 'ski'].forEach((evKey, evIdx) => {
      const name = sel[evKey];
      if (!name) return;
      const pr = pronouns(name);
      const ps = pStats(name);
      const refusal = refusals.find(r => r.tribe === tribe.name && r.event === EVENT_NAMES[evIdx]);
      if (refusal) {
        selectionText[tribe.name][evKey] = _rp(XT_SELECTION.forced)(name, pr, EVENT_NAMES[evIdx], refusal.name);
      } else if (ps.boldness >= 7) {
        selectionText[tribe.name][evKey] = _rp(XT_SELECTION.volunteer)(name, pr, EVENT_NAMES[evIdx]);
      } else {
        selectionText[tribe.name][evKey] = _rp(XT_SELECTION.assigned)(name, pr, EVENT_NAMES[evIdx]);
      }
    });
  });
  xt.selectionText = selectionText;
  // Refusal text
  refusals.forEach(r => {
    const pr = pronouns(r.name);
    r.text = _rp(XT_SELECTION.refused)(r.name, pr, r.event);
  });

  // ... (Events 1-3 and social events added in subsequent tasks)

  ep.xtremeTorture = xt;
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(x-treme-torture): simulation shell with player selection + refusal mechanic"
```

---

## Task 4: Simulation — Event 1 (Sofa Bed Skydiving)

Add the skydiving event simulation inside `simulateXtremeTorture`, after the selection code.

**Files:** Modify `simulator.html` inside `simulateXtremeTorture`

- [ ] **Step 1: Add skydiving simulation**

Insert after the selection code, before `ep.xtremeTorture = xt;`:

```javascript
  // ══════════════════════════════════════════════════════════════════
  // EVENT 1: SOFA BED SKYDIVING
  // ══════════════════════════════════════════════════════════════════

  tribes.forEach(tribe => {
    const jumperName = selections[tribe.name]?.sky;
    if (!jumperName) { xt.skydiving.push({ tribe: tribe.name, jumper: null, score: 0 }); return; }

    const s = pStats(jumperName);
    const pr = pronouns(jumperName);
    const members = tribe.members.filter(m => gs.activePlayers.includes(m));
    const groundCrew = members.filter(m => m !== jumperName);

    // 2a. Plane mood
    const tier = s.boldness >= 7 ? 'high' : s.boldness <= 3 ? 'low' : 'mid';
    const planeText = _rp(XT_SKY_PLANE[tier])(jumperName, pr);

    // 2b. Jump decision
    const jumpWillingly = s.boldness * 0.08 + s.physical * 0.02 + 0.15;
    let jumpDecision, jumpText;
    const jumpRoll = Math.random();
    if (jumpRoll < jumpWillingly) {
      jumpDecision = 'willing';
      jumpText = _rp(XT_SKY_JUMP.willing)(jumperName, pr);
    } else if (jumpRoll < jumpWillingly + 0.25) {
      jumpDecision = 'hesitant';
      jumpText = _rp(XT_SKY_JUMP.hesitant)(jumperName, pr);
    } else if (jumpRoll < jumpWillingly + 0.50) {
      jumpDecision = 'pushed';
      const pusher = _rp(groundCrew) || jumperName;
      jumpText = _rp(XT_SKY_JUMP.pushed)(jumperName, pr, pusher);
    } else {
      jumpDecision = 'refused';
      jumpText = _rp(XT_SKY_JUMP.refused)(jumperName, pr);
    }

    // 2c. Fall quality (skip if refused)
    let fallQuality = 0, fallText = '';
    if (jumpDecision !== 'refused') {
      const deployChance = s.physical * 0.06 + s.mental * 0.04 + 0.30;
      const deployRoll = Math.random();
      if (deployRoll < deployChance) {
        fallQuality = 1.0;
        fallText = _rp(XT_SKY_FALL.perfect)(jumperName, pr);
      } else if (deployRoll < deployChance + 0.20) {
        fallQuality = 0.6;
        fallText = _rp(XT_SKY_FALL.late)(jumperName, pr);
      } else if (deployRoll < deployChance + 0.35) {
        fallQuality = 0.3;
        fallText = _rp(XT_SKY_FALL.tangled)(jumperName, pr);
      } else {
        fallQuality = s.physical > 4 ? 0.15 : 0.05;
        fallText = _rp(XT_SKY_FALL.forgot)(jumperName, pr);
      }
    }

    // 2d. Team positioning
    let posQuality = 0, groundText = '';
    if (jumpDecision !== 'refused' && groundCrew.length > 0) {
      const avgPhys = groundCrew.reduce((sum, m) => sum + pStats(m).physical, 0) / groundCrew.length;
      const avgSoc = groundCrew.reduce((sum, m) => sum + pStats(m).social, 0) / groundCrew.length;
      const avgMent = groundCrew.reduce((sum, m) => sum + pStats(m).mental, 0) / groundCrew.length;
      const posScore = avgPhys * 0.4 + avgSoc * 0.3 + avgMent * 0.3;
      const posRoll = Math.random() * 10;

      // Check for sleeper complication
      const lowEnd = groundCrew.filter(m => pStats(m).endurance <= 3);
      const sleeper = lowEnd.length > 0 && Math.random() < 0.15 ? _rp(lowEnd) : null;

      if (posRoll < posScore * 0.7) {
        posQuality = 1.0;
        groundText = _rp(XT_SKY_GROUND.perfect)(groundCrew);
      } else if (posRoll < posScore * 1.0) {
        posQuality = 0.6;
        groundText = _rp(XT_SKY_GROUND.decent)(groundCrew);
      } else {
        posQuality = 0.2;
        groundText = _rp(XT_SKY_GROUND.chaos)(groundCrew, sleeper);
      }
    }

    // 2e. Landing + scoring
    let score = 0, landingText = '', injured = false;
    if (jumpDecision === 'refused') {
      score = 0;
      landingText = `${tribe.name} gets zero for skydiving. ${jumperName} refused to jump.`;
    } else {
      score = Math.round(Math.min(10, Math.max(1, (fallQuality * 5 + posQuality * 5) * (0.8 + Math.random() * 0.4))) * 10) / 10;
      if (fallQuality >= 0.8 && posQuality >= 0.8) {
        landingText = _rp(XT_SKY_LANDING.perfect)(jumperName, pr);
      } else if (score >= 4) {
        landingText = _rp(XT_SKY_LANDING.rough)(jumperName, pr);
      } else {
        landingText = _rp(XT_SKY_LANDING.crash)(jumperName, pr);
        // Injury check
        const injChance = 0.15 + (10 - s.physical) * 0.04;
        if (Math.random() < injChance) {
          injured = true;
          gs.lingeringInjuries[jumperName] = {
            ep: epNum, duration: 2 + Math.floor(Math.random() * 2),
            penalty: 1.5 + Math.random(), type: 'skydiving-crash'
          };
          landingText += ' ' + _rp(XT_SKY_LANDING.injury)(jumperName, pr);
        }
      }
    }

    xt.tribeScores[tribe.name].sky = score;
    xt.skydiving.push({
      tribe: tribe.name, jumper: jumperName, jumpDecision, fallQuality, posQuality,
      score, injured, groundCrew,
      text: { plane: planeText, jump: jumpText, fall: fallText, ground: groundText, landing: landingText }
    });
  });
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(x-treme-torture): Event 1 simulation (Sofa Bed Skydiving)"
```

---

## Task 5: Simulation — Sideline Social 1

Add the social events that fire between Events 1 and 2, with deep consequences.

**Files:** Modify `simulator.html` inside `simulateXtremeTorture`, after Event 1

- [ ] **Step 1: Add sideline social 1 logic**

Insert after the skydiving forEach, before `ep.xtremeTorture = xt;`:

```javascript
  // ══════════════════════════════════════════════════════════════════
  // SIDELINE SOCIAL 1 (post-skydiving)
  // ══════════════════════════════════════════════════════════════════

  const sideline1 = [];
  xt.skydiving.forEach(sky => {
    if (!sky.jumper) return;
    const tribe = tribes.find(t => t.name === sky.tribe);
    if (!tribe) return;
    const members = tribe.members.filter(m => gs.activePlayers.includes(m));
    const jumper = sky.jumper;
    const jpr = pronouns(jumper);

    // Injury consequences
    if (sky.injured) {
      // Sympathy from loyal teammates
      const sympathizers = members.filter(m => m !== jumper && pStats(m).loyalty >= 6);
      if (sympathizers.length) {
        const sym = _rp(sympathizers);
        const spr = pronouns(sym);
        addBond(sym, jumper, 0.4);
        sideline1.push({
          type: 'injurySympathy', players: [sym, jumper],
          text: `${sym} rushes to ${jumper}'s side. "You okay? That was insane." ${spr.Sub} stays with ${jpr.obj} until the medics arrive.`,
          badgeText: 'SUPPORT', badgeClass: 'gold',
          bondChanges: [{ a: sym, b: jumper, delta: 0.4 }]
        });
        // Romance spark opportunity
        if (seasonConfig.romance !== 'disabled' && typeof romanticCompat === 'function' && romanticCompat(sym, jumper)) {
          _challengeRomanceSpark(sym, jumper, ep, 'xt-sideline1', {}, {}, 'danger-bonding-injury');
        }
      }

      // Blame from strategic/low-loyalty
      const blamers = members.filter(m => m !== jumper && (pStats(m).loyalty <= 4 || pStats(m).strategic >= 7) && !sympathizers.includes(m));
      if (blamers.length) {
        const blamer = _rp(blamers);
        const bpr = pronouns(blamer);
        addBond(blamer, jumper, -0.4);
        sideline1.push({
          type: 'injuryBlame', players: [blamer, jumper],
          text: `${blamer} watches the medics work on ${jumper} and turns to the group. "Great. Now we're down a player." No sympathy. Just math.`,
          badgeText: 'BLAME', badgeClass: 'red',
          bondChanges: [{ a: blamer, b: jumper, delta: -0.4 }]
        });
      }
    }

    // Underdog moment
    const js = pStats(jumper);
    const overall = (js.physical + js.endurance + js.mental + js.social + js.strategic + js.loyalty + js.boldness + js.intuition + js.temperament) / 9;
    if (overall <= 5 && sky.score >= 7) {
      members.forEach(m => { if (m !== jumper) addBond(m, jumper, 0.5); });
      sideline1.push({
        type: 'underdog', players: [jumper],
        text: `Nobody expected ${jumper} to pull that off. ${sky.score} points from the dive. The whole tribe is looking at ${jpr.obj} differently now.`,
        badgeText: 'UNDERDOG', badgeClass: 'gold',
        bondChanges: members.filter(m => m !== jumper).map(m => ({ a: m, b: jumper, delta: 0.5 }))
      });
    }

    // Existing showmance moments
    if (gs.showmances?.length) {
      const activeShows = gs.showmances.filter(sh =>
        sh.phase !== 'broken-up' && sh.players.includes(jumper) &&
        sh.players.every(p => gs.activePlayers.includes(p))
      );
      activeShows.forEach(sh => {
        const partner = sh.players.find(p => p !== jumper);
        const ppr = pronouns(partner);
        if (sky.injured) {
          sh.intensity = (sh.intensity || 3) + 0.8;
          addBond(partner, jumper, 0.5);
          sideline1.push({
            type: 'showmanceWorry', players: [partner, jumper],
            text: `${partner} can't watch. Then can't look away. ${ppr.Sub} ${ppr.sub === 'they' ? 'are' : 'is'} at ${jumper}'s side before the medics are.`,
            badgeText: 'WORRIED', badgeClass: 'pink',
            bondChanges: [{ a: partner, b: jumper, delta: 0.5 }]
          });
        } else if (sky.score >= 8) {
          sh.intensity = (sh.intensity || 3) + 0.3;
          sideline1.push({
            type: 'showmanceProud', players: [partner, jumper],
            text: `${partner} is beaming. "${ppr.Sub} did that." ${ppr.PosAdj} eyes haven't left ${jumper} since the landing.`,
            badgeText: 'PROUD', badgeClass: 'pink',
            bondChanges: [{ a: partner, b: jumper, delta: 0.3 }]
          });
        }
      });
    }
  });

  // Cross-tribe taunt
  const skyScores = xt.skydiving.map(s => ({ tribe: s.tribe, score: s.score })).sort((a, b) => b.score - a.score);
  if (skyScores.length >= 2 && skyScores[0].score - skyScores[skyScores.length - 1].score >= 4) {
    const winTribe = tribes.find(t => t.name === skyScores[0].tribe);
    const loseTribe = tribes.find(t => t.name === skyScores[skyScores.length - 1].tribe);
    if (winTribe && loseTribe) {
      const taunters = winTribe.members.filter(m => gs.activePlayers.includes(m) && pStats(m).boldness >= 6);
      if (taunters.length) {
        const taunter = _rp(taunters);
        loseTribe.members.filter(m => gs.activePlayers.includes(m)).forEach(m => addBond(taunter, m, -0.3));
        winTribe.members.filter(m => gs.activePlayers.includes(m) && m !== taunter).forEach(m => addBond(m, taunter, 0.2));
        sideline1.push({
          type: 'taunt', players: [taunter],
          text: `${taunter} can't help it. "That was your BEST?" Directed at ${loseTribe.name}. ${winTribe.name} loves it. ${loseTribe.name} remembers.`,
          badgeText: 'TAUNT', badgeClass: 'red-orange'
        });
      }
    }
  }

  xt.sidelineEvents.push(...sideline1.map(e => ({ ...e, phase: 'sideline1' })));
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(x-treme-torture): Sideline Social 1 with injury/romance/taunt consequences"
```

---

## Task 6: Simulation — Event 2 (Rodeo Moose Riding)

**Files:** Modify `simulator.html` inside `simulateXtremeTorture`, after sideline 1

- [ ] **Step 1: Add moose riding simulation**

Insert after sideline social 1:

```javascript
  // ══════════════════════════════════════════════════════════════════
  // EVENT 2: RODEO MOOSE RIDING
  // ══════════════════════════════════════════════════════════════════

  const MOOSE_TYPES = ['aggressive', 'lazy', 'chaotic', 'terrified'];

  tribes.forEach(tribe => {
    const riderName = selections[tribe.name]?.moose;
    if (!riderName || gs.lingeringInjuries[riderName]) {
      // Injured in Event 1 — need replacement
      const available = tribe.members.filter(m =>
        gs.activePlayers.includes(m) && !gs.lingeringInjuries[m] &&
        m !== selections[tribe.name]?.sky && m !== selections[tribe.name]?.ski
      );
      const replacement = available.length ? _rp(available) : riderName;
      if (replacement !== riderName) selections[tribe.name].moose = replacement;
      if (!replacement) { xt.mooseRiding.push({ tribe: tribe.name, rider: null, score: 0 }); return; }
    }

    const rider = selections[tribe.name].moose;
    const s = pStats(rider);
    const pr = pronouns(rider);
    const mooseType = _rp(MOOSE_TYPES);
    const boldTier = s.boldness >= 7 ? 'high' : s.boldness <= 3 ? 'low' : 'mid';

    // Context from Event 1
    const e1 = xt.skydiving.find(sk => sk.tribe === tribe.name);
    const ctxPrefix = e1 && e1.score >= 8 ? 'Riding the high from the skydiving win, ' :
                      e1 && e1.injured ? 'With their skydiver in a body cast, the pressure\'s on. ' :
                      e1 && e1.score <= 3 ? 'Still rattled from the skydiving disaster, ' : '';

    // 4a. Approach
    const approachText = ctxPrefix + _rp(XT_MOOSE_APPROACH[boldTier])(rider, pr, mooseType);

    // 4b. Mount
    const mountChance = s.physical * 0.07 + s.boldness * 0.03 + 0.30;
    const mounted = Math.random() < mountChance;
    const mountText = mounted ? _rp(XT_MOOSE_MOUNT.success)(rider, pr) : _rp(XT_MOOSE_MOUNT.fail)(rider, pr);

    // 4c. The Ride
    let roundsSurvived = 0;
    const roundTexts = [];
    if (mounted) {
      for (let round = 1; round <= 5; round++) {
        const mooseMod = mooseType === 'aggressive' ? -0.10 :
                         mooseType === 'lazy' ? 0.05 :
                         mooseType === 'chaotic' ? (Math.random() - 0.5) * 0.16 :
                         mooseType === 'terrified' && round === 1 ? -0.15 : 0;
        const stayChance = s.endurance * 0.07 + s.physical * 0.03 + 0.15 - (round * 0.08) + mooseMod;
        if (Math.random() < stayChance) {
          roundsSurvived = round;
          roundTexts.push(_rp(XT_MOOSE_BUCK.hold)(rider, pr, round));
        } else {
          roundTexts.push(_rp(XT_MOOSE_BUCK.thrown)(rider, pr, round));
          break;
        }
      }
    }

    // 4d. Dismount
    let dismountType, dismountLocation = '', dismountText;
    if (!mounted) {
      dismountType = 'failedMount';
      dismountText = `${rider} never got on. Zero points.`;
    } else if (roundsSurvived >= 5) {
      dismountType = 'graceful';
      dismountText = _rp(XT_MOOSE_DISMOUNT.graceful)(rider, pr);
    } else {
      dismountType = 'thrown';
      dismountLocation = _rp(XT_MOOSE_DISMOUNT_LOCATION);
      dismountText = _rp(XT_MOOSE_DISMOUNT.thrown)(rider, pr, dismountLocation);
    }

    // 4e. Score + injury
    let score = mounted ? roundsSurvived * 2 + (roundsSurvived >= 5 ? 1 : 0) : 0;
    score = Math.min(10, score);
    let injured = false;
    if (dismountType === 'thrown') {
      const injChance = roundsSurvived <= 2 ? 0.12 + (10 - s.endurance) * 0.03 : 0.06 + (10 - s.endurance) * 0.02;
      if (Math.random() < injChance) {
        injured = true;
        gs.lingeringInjuries[rider] = {
          ep: epNum, duration: 2 + Math.floor(Math.random() * 2),
          penalty: 1.5 + Math.random(), type: 'moose-thrown'
        };
      }
    }

    xt.tribeScores[tribe.name].moose = score;
    xt.mooseRiding.push({
      tribe: tribe.name, rider, moosePersonality: mooseType,
      mounted, roundsSurvived, dismountType, dismountLocation,
      score, injured,
      text: { approach: approachText, mount: mountText, rounds: roundTexts, dismount: dismountText }
    });
  });
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(x-treme-torture): Event 2 simulation (Rodeo Moose Riding)"
```

---

## Task 7: Simulation — Sideline Social 2

Same structure as Sideline 1 but contextualized to moose riding + accumulated pressure. Adds comedy bond, pressure talk, showmance argument/rally, desperation pact.

**Files:** Modify `simulator.html` inside `simulateXtremeTorture`, after Event 2

- [ ] **Step 1: Add sideline social 2 logic**

Insert after moose riding forEach. This follows the same pattern as sideline 1 — check each tribe's moose result, fire social events with real consequences. Include: comedy bond (dismount into funny location), pressure talk (strategist pressures Event 3 skier), showmance argument/rally, desperation pact, and all injury/underdog events from the Phase 3 pool. Add `_challengeRomanceSpark` calls for comfort moments. Add `_checkShowmanceChalMoment` for existing showmance downtime. Mark events with `phase: 'sideline2'`.

Follow the exact same code structure as sideline 1 — iterate `xt.mooseRiding`, check outcomes, fire probabilistic events, push to `xt.sidelineEvents`. The spec section "Phase 5: Sideline Social 2" has the full event table.

Key additions beyond sideline 1:
- Comedy bond: if dismountType === 'thrown' and dismountLocation is funny, high-social witnesses get +0.4 bond
- Pressure talk: if tribe losing after 2 events, strategist (≥7) pressures the ski competitor. Sets a `pressured` flag on the skier's selection entry that applies −0.05 to flag collection in Event 3
- Showmance argument: if existing showmance partner performed poorly (score ≤ 3), strategic partner gets frustrated (−0.6 intensity)
- Showmance rally: if partner about to compete in Event 3, encouraging partner gives +0.4 intensity and sets `motivated` flag (+0.08 to Event 3 checks)
- Desperation pact: if tribe lost both events, two non-allied players form survival pact (+0.3 bond)

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(x-treme-torture): Sideline Social 2 with pressure/comedy/romance/pact"
```

---

## Task 8: Simulation — Event 3 (Mud Skiing) + Sabotage Setup

The most complex event — dual-actor with sabotage, driver assignment, flag collection, backfire mechanics.

**Files:** Modify `simulator.html` inside `simulateXtremeTorture`, after sideline 2

- [ ] **Step 1: Add sabotage setup + mud skiing simulation**

Insert after sideline 2. Driver assignment uses opposing-tribe rotation. Sabotage intent calculated from strategic + loyalty + perceived bond. The flag run is 5 flags with per-flag sabotage checks. Mid-course crash attempt with backfire. Finish line with driver-refuses mechanic. Both skier and driver can be injured.

Key formulas from spec:
- `saboIntent = strategic * 0.05 + (10 - loyalty) * 0.03 - getPerceivedBond(driver, skier) * 0.02 + (isVillain ? 0.10 : 0)`
- Per flag: `collectChance = physical * 0.05 + mental * 0.03 + 0.20 - (swerve ? 0.12 : 0) - (dragged ? 0.08 : 0) + (motivated ? 0.08 : 0) - (pressured ? 0.05 : 0)`
- Backfire: `0.20 + (10 - driverPhysical) * 0.03`
- Driver refuses finish: `(10 - loyalty) * 0.03 + saboIntent * 0.2`

Score: `flagsCollected * 2 + (cleanFinish ? 1 : 0) + (backfire ? 2 : 0) - (driverRefusedAndNoMomentum ? 2 : 0)`, clamped 0-10.

Generate confessional text for driver intent and skier reaction. Use composable `XT_SKI_*` pools for each sub-stage.

Store results in `xt.mudSkiing[]` with full data: tribe, skier, driver, driverTribe, saboIntent, joltedOff, flagsCollected, sabotageAttempt, sabotageBackfire, driverRefusedFinish, skierMomentum, score, skierInjured, driverInjured, and text segments.

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(x-treme-torture): Event 3 simulation (Mud Skiing + sabotage)"
```

---

## Task 9: Simulation — Results, Heat, Camp Events

Add final scoring, winner/loser determination, heat system, MVP selection, and camp event generation.

**Files:** Modify `simulator.html` inside `simulateXtremeTorture`, after Event 3

- [ ] **Step 1: Add results + camp events**

After mud skiing, compute totals, determine winner/loser, set `ep.winner`/`ep.loser`/`ep.challengeType`/`ep.tribalPlayers`. Generate heat via `gs._xtremeTortureHeat`. Generate `ep.chalMemberScores` for challenge record. Generate 3-4 camp events per tribe from the positive/negative pools in the spec. Call `updateChalRecord(ep)` with the custom scores.

Set `ep.winner`, `ep.loser`, `ep.challengeType = 'tribe'`, and `ep.tribalPlayers` from the losing tribe. These are required for the post-challenge flow to work.

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(x-treme-torture): results, heat, MVP, camp events"
```

---

## Task 10: Text Backlog

Add the `_textXtremeTorture` function for the episode text summary.

**Files:** Modify `simulator.html`, after `_textBasicStraining` (line ~44313)

- [ ] **Step 1: Add text backlog function**

Follow the pattern of `_textCliffDive`: iterate through each phase, output the key moments in plain text. Use `ln()` for lines and `sec()` for section headers. Include selection, all 3 events with their sub-stages, sideline events, and results.

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(x-treme-torture): text backlog function"
```

---

## Task 11: CSS Overdrive

Add all CSS classes and keyframes for the X-Treme Torture VP screen.

**Files:** Modify `simulator.html`, after the Cliff Dive Overdrive CSS section

- [ ] **Step 1: Add CSS**

Add the `.xt-*` classes and keyframes from the spec's VP Overdrive Design section:
- `.xt-wrap` — extreme gradient background (altitude blue → mud brown, shifts per event)
- `.xt-scoreboard` — running tally sticky at top
- `.xt-event-card` — title card for each event with color identity
- `.xt-spotlight` — large centered portrait before competitor's turn
- `.xt-confessional` — selection/reaction card styling
- `.xt-injury-flash` — red flash overlay on injury
- `.xt-flag-slot` — 5 flag collection indicators for mud skiing
- Keyframes: `xtSlideIn`, `xtScoreReveal`, `xtInjuryFlash`, `xtFlagCollect`, `xtSaboBackfire`, `xtEventTransition`
- `@media (prefers-reduced-motion: reduce)` fallbacks for all animations

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(x-treme-torture): overdrive CSS"
```

---

## Task 12: VP Builder — Structure + Scoreboard + Selection

Create the `rpBuildXtremeTorture` function with the flat-steps reveal system, scoreboard, and selection phase.

**Files:** Modify `simulator.html`, after `rpBuildCliffDive` (line ~67120)

- [ ] **Step 1: Create VP builder shell with steps array, scoreboard, and selection rendering**

Follow the Dodgebrawl pattern: build a flat `steps[]` array where each VP click reveals one step. Steps include: selection, per-tribe event sub-stages, sideline social, per-tribe event sub-stages, sideline social, sabotage setup, per-matchup mud skiing sub-stages, results.

The scoreboard is sticky at the top and updates as event scores are revealed. Use the `.xt-scoreboard` CSS class.

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(x-treme-torture): VP builder shell with scoreboard + selection"
```

---

## Task 13: VP Builder — Event Rendering

Add the rendering for all 3 events, sideline socials, sabotage setup, and results.

**Files:** Modify `simulator.html` inside `rpBuildXtremeTorture`

- [ ] **Step 1: Add event rendering**

For each event type in the steps array, render the appropriate card:
- **Event headers**: title card with event name, color identity, description
- **Skydiving sub-stages**: plane → jump → fall → ground → landing, each its own reveal step
- **Moose riding sub-stages**: approach → mount → per-round bucks → dismount
- **Mud skiing sub-stages**: start → per-flag collection → sabotage → finish
- **Sideline social**: social event cards with badge colors
- **Sabotage setup**: driver confessional cards
- **Results**: animated score bars per tribe, winner announcement, MVP portrait

Use the event's color identity for backgrounds:
- Skydiving: blue tones
- Moose: brown/orange tones
- Mud skiing: brown/red tones

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(x-treme-torture): VP event rendering for all 3 events + socials + results"
```

---

## Task 14: Browser Testing + Polish

Test the complete challenge in the browser, fix any issues.

**Files:** Modify `simulator.html` as needed

- [ ] **Step 1: Start dev server and load simulator**
- [ ] **Step 2: Configure x-treme-torture twist on episode 2, run 2 episodes**
- [ ] **Step 3: Open VP, navigate to X-Treme Torture screen**
- [ ] **Step 4: Click through all reveals, verify:**
  - Selection cards render with confessional text
  - Scoreboard updates after each event
  - Skydiving sub-stages reveal properly (plane→jump→fall→ground→landing)
  - Sideline social events appear with correct badges
  - Moose riding reveals round by round
  - Sabotage setup confessionals render
  - Mud skiing reveals per-flag with flag counter
  - Results show animated score bars and winner
  - NEXT button is sticky
  - Injury flash appears when injuries fire
- [ ] **Step 5: Fix any rendering issues found**
- [ ] **Step 6: Final commit**

```bash
git add simulator.html
git commit -m "feat(x-treme-torture): browser-tested, complete challenge twist"
```

---

## Summary

| Task | Description | Est. Lines |
|---|---|---|
| 1 | Integration hooks | ~20 |
| 2 | Text pools | ~250 |
| 3 | Simulation shell + selection | ~120 |
| 4 | Event 1: Skydiving | ~130 |
| 5 | Sideline Social 1 | ~100 |
| 6 | Event 2: Moose Riding | ~100 |
| 7 | Sideline Social 2 | ~100 |
| 8 | Event 3: Mud Skiing + sabotage | ~180 |
| 9 | Results + heat + camp events | ~100 |
| 10 | Text backlog | ~60 |
| 11 | CSS overdrive | ~120 |
| 12 | VP builder shell | ~120 |
| 13 | VP event rendering | ~250 |
| 14 | Browser testing | ~varies |

**Total: ~1,650 new lines**
