# Talent Show Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a schedulable pre-merge Talent Show challenge twist — auditions, stage performances with Chef-O-Meter scoring, disasters, clutch moments, villain sabotage, and audience reactions.

**Architecture:** New `simulateTalentShow(ep)` handles auditions, performances, and camp events. Two VP screens: `rpBuildTalentAuditions(ep)` (casual) and `rpBuildTalentShow(ep)` (stage atmosphere with animated Chef-O-Meter bars). Text backlog via `_textTalentShow(ep, ln, sec)`. All 30 talents with 4 text variants stored as a constant.

**Tech Stack:** Pure JS in `simulator.html`. No external dependencies.

---

### Task 1: TWIST_CATALOG Entry + applyTwist Flag

**Files:**
- Modify: `simulator.html:1635` (after dodgebrawl entry)
- Modify: `simulator.html:13579` (after dodgebrawl case in applyTwist)

- [ ] **Step 1: Add catalog entry**

After the dodgebrawl entry (line 1635), add:

```javascript
  { id:'talent-show', emoji:'🎭', name:'Talent Show', category:'challenge', phase:'pre-merge', desc:'Camp talent show. Each tribe auditions, captain picks 3 acts. Chef scores 0-9. Disasters, clutch moments, and villain sabotage.', engineType:'talent-show', minTribes:2, incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl'] },
```

Also add `'talent-show'` to the incompatible arrays of all 8 existing challenge twists.

- [ ] **Step 2: Add applyTwist flag**

After the dodgebrawl case in applyTwist (search for `ep.isDodgebrawl = true;`), add:

```javascript

  } else if (engineType === 'talent-show') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isTalentShow = true;
```

- [ ] **Step 3: Wire into simulateEpisode challenge branch**

Find the dodgebrawl branch (search for `ep.isDodgebrawl && gs.phase === 'pre-merge'`), add after it:

```javascript
  } else if (ep.isTalentShow && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateTalentShow(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateTalentShow
```

- [ ] **Step 4: Skip duplicate updateChalRecord**

Find the main `updateChalRecord(ep)` call that already has the challenge twist skip list (search for `!ep.isDodgebrawl && !ep.isCliffDive`). Add `&& !ep.isTalentShow` to the condition.

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: add Talent Show to TWIST_CATALOG + applyTwist flag + episode branch"
```

---

### Task 2: Talent Pool Constants

**Files:**
- Modify: `simulator.html` — add `TALENT_POOL` constant before `simulateTalentShow` function

- [ ] **Step 1: Add the talent pool**

Place this constant right before the `simulateTalentShow` function (which you'll add in Task 3). Put it after `simulateDodgebrawl` ends (after line ~7915, before the PHOBIA FACTOR comment).

The complete talent pool is in the spec at `docs/superpowers/specs/2026-04-10-talent-show-design.md` — all 30 talents across 5 categories with 4 text variants each. Read the spec and build the constant:

```javascript
// ══════════════════════════════════════════════════════════════════════
// ENGINE: TALENT SHOW — talent pool (30 talents, 5 categories)
// ══════════════════════════════════════════════════════════════════════
const TALENT_POOL = {
  physical: [
    { id: 'gymnastics', name: 'Gymnastics Routine',
      audition: (p, pr) => `${p} nails a backflip in the dirt. The tribe watches, impressed.`,
      performance: (p, pr) => `Full floor routine — handsprings, aerials, stuck landing. Chef nods.`,
      disaster: (p, pr) => `${p} lands wrong on the dismount. ${pr.PosAdj} ankle buckles. ${pr.Sub} ${pr.sub==='they'?'limp':'limps'} offstage to silence.`,
      clutch: (p, pr) => `${p} wobbles on the landing but saves it with a spin nobody saw coming. Perfect recovery.`,
    },
    { id: 'martial-arts', name: 'Martial Arts Demo',
      audition: (p, pr) => `${p} throws kicks at the air with scary precision. Nobody claps ironically.`,
      performance: (p, pr) => `Board breaks. Roundhouse. Flying knee. The stage shakes.`,
      disaster: (p, pr) => `${p} tries a spinning kick, slips, falls flat. The board doesn't break. Neither does the silence.`,
      clutch: (p, pr) => `${p} almost loses balance on the flying kick — catches it mid-air and SNAPS the board clean. Gasps.`,
    },
    { id: 'strength', name: 'Strength Display',
      audition: (p, pr) => `${p} lifts a log over ${pr.pos} head. Simple. Effective.`,
      performance: (p, pr) => `${p} deadlifts a canoe. Then puts a person in it and lifts again.`,
      disaster: (p, pr) => `The canoe doesn't budge. ${p} strains. Face goes red. Nothing.`,
      clutch: (p, pr) => `${p} is struggling — the canoe starts to tip — then SLAMS it overhead with a roar. Standing ovation.`,
    },
    { id: 'parkour', name: 'Parkour Run',
      audition: (p, pr) => `${p} vaults over a bench, rolls, sticks the landing. Quick and clean.`,
      performance: (p, pr) => `Full obstacle run — wall flip, rail slide, precision jump to the stage.`,
      disaster: (p, pr) => `${p} clips the rail. Eats dirt. Rolls into the front row.`,
      clutch: (p, pr) => `${p} slips on the rail — but grabs it one-handed, swings, lands on the stage mark. Showstopper.`,
    },
    { id: 'wrestling', name: 'Wrestling Showcase',
      audition: (p, pr) => `${p} throws a dummy around like it insulted ${pr.obj}.`,
      performance: (p, pr) => `${p} suplexes a training dummy off the stage. The crowd flinches.`,
      disaster: (p, pr) => `The dummy fights back. Or rather, gets tangled. Embarrassing struggle.`,
      clutch: (p, pr) => `The dummy catches on something — ${p} rips it free mid-move and launches it into the lake. Legend.`,
    },
    { id: 'endurance-hold', name: 'Endurance Hold',
      audition: (p, pr) => `${p} holds a handstand for two minutes straight during auditions. No wobble.`,
      performance: (p, pr) => `${p} planks on the edge of the stage while balancing objects. Pure control.`,
      disaster: (p, pr) => `${pr.PosAdj} arms give out. ${p} crashes down. Objects scatter everywhere.`,
      clutch: (p, pr) => `Arms shaking, sweat dripping — ${p} holds it. And holds it. And holds it. Chef slow-claps.`,
    },
  ],
  performanceArt: [
    { id: 'singing', name: 'Singing',
      audition: (p, pr) => `${p} hums a few bars. Voice is actually good. Tribe goes quiet.`,
      performance: (p, pr) => `Full song. No backing track. Just ${pr.pos} voice. The forest goes still.`,
      disaster: (p, pr) => `${pr.PosAdj} voice cracks on the high note. ${p} tries to recover. Cracks again. Walks off.`,
      clutch: (p, pr) => `${pr.PosAdj} voice cracks — ${p} pauses — then belts the note raw and perfect. Chills.`,
    },
    { id: 'comedy', name: 'Comedy Standup',
      audition: (p, pr) => `${p} tells one joke at audition. Gets a real laugh, not a pity one.`,
      performance: (p, pr) => `Five minutes. ${p} reads the crowd. Callbacks. Timing. They're crying laughing.`,
      disaster: (p, pr) => `${p} opens with a joke. Silence. Tries another. Worse silence. Panic sweats.`,
      clutch: (p, pr) => `${p} is bombing hard — then pivots to self-roast. "This is going great, right?" The crowd loses it.`,
    },
    { id: 'monologue', name: 'Dramatic Monologue',
      audition: (p, pr) => `${p} delivers three lines from memory. The vibe shifts. Everyone leans in.`,
      performance: (p, pr) => `Full monologue. Eye contact. Pauses that hit. Someone in the back is crying.`,
      disaster: (p, pr) => `${p} forgets the lines. Freezes. Mumbles something. Walks offstage staring at the ground.`,
      clutch: (p, pr) => `${p} goes blank — improvises from the heart. It's not the script. It's better.`,
    },
    { id: 'dance', name: 'Dance Routine',
      audition: (p, pr) => `Quick choreo. Nothing fancy. But the rhythm is there and the confidence sells it.`,
      performance: (p, pr) => `Full choreographed piece. ${p} uses the whole stage. Every beat lands.`,
      disaster: (p, pr) => `${p} steps on ${pr.pos} own foot. Stumbles. Tries to style it out. Doesn't work.`,
      clutch: (p, pr) => `${p} stumbles mid-spin — turns it into a slide. The crowd thinks it was planned.`,
    },
    { id: 'impressions', name: 'Impressions',
      audition: (p, pr) => `${p} does the host. It's uncanny. Even the host laughs.`,
      performance: (p, pr) => `Five impressions in a row — host, Chef, tribemates. Each one lands.`,
      disaster: (p, pr) => `${p} does an impression of someone in the audience. It's mean. Nobody laughs.`,
      clutch: (p, pr) => `The first three are rough — then ${p} nails the host so perfectly that Chef breaks character laughing.`,
    },
    { id: 'spoken-word', name: 'Spoken Word',
      audition: (p, pr) => `${p} recites something original. Short. Intense. The fire crackles louder.`,
      performance: (p, pr) => `Full piece. Raw. Personal. You can hear the silence between the words.`,
      disaster: (p, pr) => `${p} mumbles. Loses the thread. Reads from a crumpled paper. Nobody connects.`,
      clutch: (p, pr) => `${p} loses the paper — recites from memory. Voice shaking. Realer than the rehearsed version.`,
    },
  ],
  skill: [
    { id: 'beatboxing', name: 'Beatboxing',
      audition: (p, pr) => `${p} drops a beat. It's actually complex. People start nodding.`,
      performance: (p, pr) => `Full routine — bass, snare, vocal scratch, melody. All at once. Inhuman.`,
      disaster: (p, pr) => `${p} tries to go too fast. Chokes on spit. Coughs into the mic.`,
      clutch: (p, pr) => `${p} keeps building layers until it sounds like a full band. Nobody can believe it's one person.`,
    },
    { id: 'card-tricks', name: 'Card Tricks',
      audition: (p, pr) => `${p} fans the deck. Pulls the right card. Clean. No fumbles.`,
      performance: (p, pr) => `Full act — cards appear, vanish, end up in someone's pocket. Gasps throughout.`,
      disaster: (p, pr) => `${p} drops the deck. Cards scatter. The trick is exposed. Everyone sees the double lift.`,
      clutch: (p, pr) => `${p} drops the deck — catches a single card mid-air. It's their card. Mic drop.`,
    },
    { id: 'speed-solve', name: 'Speed-Solving',
      audition: (p, pr) => `${p} solves a puzzle in 40 seconds at audition. Tribe times it.`,
      performance: (p, pr) => `${p} solves three puzzles simultaneously. Blindfolded for the last one.`,
      disaster: (p, pr) => `${p} can't find the last piece. Panics. Time runs out with one piece missing.`,
      clutch: (p, pr) => `${p} is stuck on the last move — closes ${pr.pos} eyes — solves it by feel. Record time.`,
    },
    { id: 'fire-staff', name: 'Fire Staff',
      audition: (p, pr) => `${p} spins a lit staff with precision. Controlled. Mesmerizing.`,
      performance: (p, pr) => `Full fire performance — spins, tosses, catches behind the back. Shadows dance.`,
      disaster: (p, pr) => `The staff slips. Fire hits the ground. Someone stomps it out. Smoke everywhere.`,
      clutch: (p, pr) => `${p} tosses high — catches blind behind the back. The fire traces an arc in the dark. Perfect.`,
    },
    { id: 'knife-throwing', name: 'Knife Throwing',
      audition: (p, pr) => `${p} plants three knives in a target. Thunk thunk thunk. Clean grouping.`,
      performance: (p, pr) => `Full act — ${p} throws blindfolded. Splits a fruit on someone's head.`,
      disaster: (p, pr) => `${p} misses the target. Knife sticks in the stage. Awkward silence. Very awkward.`,
      clutch: (p, pr) => `Last throw goes wide — then curves and hits the bullseye. Nobody knows how.`,
    },
    { id: 'rubiks', name: "Rubik's Cube Solve",
      audition: (p, pr) => `Sub-minute solve during audition. ${pr.PosAdj} hands blurring.`,
      performance: (p, pr) => `${p} solves two cubes simultaneously — one in each hand. Audience counts along.`,
      disaster: (p, pr) => `${p} gets stuck. Turns and turns. Time passes. Still stuck. People start looking away.`,
      clutch: (p, pr) => `${p} is frozen for 10 seconds — then a burst of moves and both cubes lock in. Under a minute.`,
    },
  ],
  daredevil: [
    { id: 'fire-eating', name: 'Fire-Eating',
      audition: (p, pr) => `${p} breathes a small flame at audition. Controlled. Eyebrows intact.`,
      performance: (p, pr) => `Full fire-breathing display — arcs of flame light up the stage.`,
      disaster: (p, pr) => `${p} singes ${pr.pos} own face. Coughs smoke. Medic jogs over.`,
      clutch: (p, pr) => `Flame sputters — then ROARS. Biggest arc of the night. The crowd screams.`,
    },
    { id: 'knife-juggling', name: 'Knife Juggling',
      audition: (p, pr) => `${p} juggles two knives casually. No fear.`,
      performance: (p, pr) => `Three knives. Then four. ${p} catches the last one between ${pr.pos} fingers.`,
      disaster: (p, pr) => `${p} drops one. It sticks in the stage an inch from ${pr.pos} foot. Everyone gasps for the wrong reason.`,
      clutch: (p, pr) => `${p} fumbles the third — kicks it up with ${pr.pos} foot and catches it. Unplanned but incredible.`,
    },
    { id: 'high-dive', name: 'High Dive',
      audition: (p, pr) => `${p} jumps off a tall stump into water. Clean entry.`,
      performance: (p, pr) => `Full dive from the highest point at camp. Flip. Twist. Barely a splash.`,
      disaster: (p, pr) => `Belly flop. The sound echoes. The water doesn't forgive.`,
      clutch: (p, pr) => `${p} over-rotates — somehow adjusts mid-air and enters clean. The splash is nothing.`,
    },
    { id: 'eating-challenge', name: 'Eating Challenge',
      audition: (p, pr) => `${p} eats something terrible without flinching. Audition complete.`,
      performance: (p, pr) => `${p} eats progressively worse things on stage. Hot sauce. Bugs. Mystery meat. Never flinches.`,
      disaster: (p, pr) => `${p} gags on the second item. Runs offstage. Sounds of regret from backstage.`,
      clutch: (p, pr) => `On the verge of puking — ${p} swallows it, smiles, and asks for more. The crowd is horrified and impressed.`,
    },
    { id: 'balance-walk', name: 'Balance Walk',
      audition: (p, pr) => `${p} walks a narrow beam without wobbling. Casual.`,
      performance: (p, pr) => `${p} walks a tightrope over the campfire. Blindfolded for the last third.`,
      disaster: (p, pr) => `${p} falls off. Into the mud. Or worse, into the audience.`,
      clutch: (p, pr) => `${p} wobbles — drops to one knee on the rope — stands back up and finishes. Nails the dismount.`,
    },
    { id: 'extreme-yoyo', name: 'Extreme Yo-Yo',
      audition: (p, pr) => `${p} does a few tricks. One goes wrong, string tangles, recovers fast.`,
      performance: (p, pr) => `Full speed routine — around the world, walk the dog, cradle, all flawless.`,
      disaster: (p, pr) => `String wraps around ${pr.pos} own neck. Tribe watches in horror. Has to be untangled.`,
      clutch: (p, pr) => `String tangles — ${p} whips it free and launches into the hardest trick clean. Nobody saw that coming.`,
    },
  ],
  creative: [
    { id: 'instrument', name: 'Musical Instrument',
      audition: (p, pr) => `${p} plays a few chords. Melody is there. Tribe goes quiet for the right reasons.`,
      performance: (p, pr) => `Full song. Original composition. The fire crackles in time.`,
      disaster: (p, pr) => `String breaks mid-song. ${p} tries to keep going. Can't. Stops. Silence.`,
      clutch: (p, pr) => `String breaks — ${p} switches to humming the melody while finger-tapping the body. Haunting.`,
    },
    { id: 'painting', name: 'Painting/Drawing',
      audition: (p, pr) => `${p} sketches a portrait in two minutes. It's actually good.`,
      performance: (p, pr) => `Live portrait of the host. Every detail. ${p} reveals it at the end. Gasps.`,
      disaster: (p, pr) => `The portrait looks nothing like anyone. Maybe a raccoon? The host squints.`,
      clutch: (p, pr) => `Running out of time — last three strokes bring the whole thing together. It's perfect.`,
    },
    { id: 'poetry', name: 'Poetry Recital',
      audition: (p, pr) => `${p} reads an original poem. Short. Three lines. They land.`,
      performance: (p, pr) => `Full poem. About the island, the game, the people. Specific. Painful. Real.`,
      disaster: (p, pr) => `${p} reads from paper. Monotone. Nobody connects. A cricket literally chirps.`,
      clutch: (p, pr) => `${p} puts the paper down. Makes eye contact. Recites from the gut. Voice breaks. It hits.`,
    },
    { id: 'magic', name: 'Magic Show',
      audition: (p, pr) => `One trick at audition. Clean vanish. Crowd leans in.`,
      performance: (p, pr) => `Full act — levitation illusion, escape trick, finale with fire. Theatrical.`,
      disaster: (p, pr) => `The trick fails. The hidden card falls out. The rabbit escapes. Everything falls apart.`,
      clutch: (p, pr) => `Trick fails — ${p} plays it off as part of the act. "That's what you THINK happened." Recovers brilliantly.`,
    },
    { id: 'puppet-show', name: 'Puppet Show',
      audition: (p, pr) => `Quick bit with a sock puppet. Gets a laugh.`,
      performance: (p, pr) => `Full show — voices, story, callbacks to camp drama. The puppet roasts people.`,
      disaster: (p, pr) => `The puppet falls apart. Literally. Stuffing everywhere.`,
      clutch: (p, pr) => `Puppet's head falls off — ${p} uses it as a prop. "This is what happens when you cross me." Biggest laugh of the night.`,
    },
    { id: 'freestyle', name: 'Rap/Freestyle',
      audition: (p, pr) => `${p} spits 8 bars about camp life. Flow is there. Words are sharp.`,
      performance: (p, pr) => `Full freestyle — calls out names, references real events, rhyme scheme holds.`,
      disaster: (p, pr) => `Rhyme falls apart. ${p} mumbles. Loses the beat. Stares at shoes.`,
      clutch: (p, pr) => `${p} goes off-beat — stops — restarts with a completely different flow that's twice as hard. Jaw drop.`,
    },
  ],
};

const TALENT_CATEGORIES = [
  { id: 'physical', stats: ['physical', 'endurance'] },
  { id: 'performanceArt', stats: ['social', 'boldness'] },
  { id: 'skill', stats: ['mental', 'intuition'] },
  { id: 'daredevil', stats: ['boldness', 'physical'] },
  { id: 'creative', stats: ['mental', 'social'] },
];

const SABOTAGE_TYPES = [
  { id: 'diary', text: (saboteur, target, pr) => `${saboteur} reads ${target}'s private writings aloud to the audience. ${target} is humiliated. The crowd is silent — then the whispering starts.` },
  { id: 'props', text: (saboteur, target, pr) => `${saboteur} replaced ${target}'s props with broken ones. ${target} reaches for the guitar — wrong strings. The cards — marked. Nothing works.` },
  { id: 'rumors', text: (saboteur, target, pr) => `${saboteur} told everyone ${target} was planning to throw the challenge. The crowd is hostile before the act even starts.` },
  { id: 'psych', text: (saboteur, target, pr) => `${saboteur} whispered something to ${target} right before ${pr.sub} went on stage. Whatever it was, it worked. ${target} looks shaken.` },
];

const AUDIENCE_REACTIONS = {
  high: {
    hero: p => `${p}: "That's my tribe right there. That's what we do."`,
    loyal: p => `${p}: "That's my tribe right there."`,
    villain: p => `${p} slow-claps. Calculating. Already thinking about how to use this.`,
    schemer: p => `${p} slow-claps. Filing it away.`,
    floater: p => `${p} claps along. Relieved someone else carried the weight.`,
    showmancer: p => `${p} locks eyes with the performer. That was attractive.`,
    wildcard: p => `${p} loses it. Standing on the bench screaming.`,
    'chaos-agent': p => `${p} loses it. Standing on the bench screaming.`,
    mastermind: p => `${p} nods. That just bought the tribe safety. Good.`,
    _default: p => `${p} nods approvingly.`,
  },
  mid: {
    hero: p => `${p}: "Good effort." Means it, kind of.`,
    villain: p => `${p} is unimpressed. Expected more.`,
    floater: p => `${p} claps at the same speed as everyone else.`,
    mastermind: p => `${p}: "We need the next act to be better."`,
    _default: p => `${p} gives a polite clap.`,
  },
  low: {
    hero: p => `${p} looks away. Doesn't pile on. But the disappointment is visible.`,
    loyal: p => `${p} looks away. The disappointment is visible.`,
    villain: p => `${p} smirks. Files it away. That's a vote target now.`,
    schemer: p => `${p} smirks. That's a vote target now.`,
    floater: p => `${p} cringes. Glad it wasn't ${pronouns(p).obj} up there.`,
    showmancer: p => `${p} covers ${pronouns(p).pos} mouth. Second-hand embarrassment.`,
    wildcard: p => `${p} laughs out loud. Can't help it. Gets dirty looks.`,
    'chaos-agent': p => `${p} laughs out loud. Can't help it.`,
    mastermind: p => `${p} is already running numbers. Can the other two acts make up for this?`,
    _default: p => `${p} winces.`,
  },
  sabotage: {
    hero: p => `${p} is furious. Stands up. Has to be held back.`,
    loyal: p => `${p}: shock. Disbelief. Then quiet rage.`,
    villain: p => `${p} is impressed despite ${pronouns(p).ref}.`,
    'social-butterfly': p => `${p} immediately comforts the victim.`,
    _default: p => `${p} stares in disbelief.`,
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: talent show constants — TALENT_POOL, SABOTAGE_TYPES, AUDIENCE_REACTIONS"
```

---

### Task 3: Core Simulation — `simulateTalentShow(ep)`

**Files:**
- Modify: `simulator.html` — add function after the TALENT_POOL constants (before PHOBIA FACTOR)

- [ ] **Step 1: Add the simulation function**

Place after the constants from Task 2, before the `// ENGINE: PHOBIA FACTOR` comment:

```javascript
function simulateTalentShow(ep) {
  const tribes = gs.tribes.filter(t => t.members.filter(m => gs.activePlayers.includes(m)).length >= 2);
  if (tribes.length < 2) return;

  const tribeMembers = tribes.map(t => ({
    name: t.name,
    members: t.members.filter(m => gs.activePlayers.includes(m))
  }));

  // ── Assign talent type to each player based on highest stat combo ──
  function assignTalent(name) {
    const s = pStats(name);
    let bestCat = TALENT_CATEGORIES[0], bestScore = 0;
    TALENT_CATEGORIES.forEach(cat => {
      const score = s[cat.stats[0]] + s[cat.stats[1]] + Math.random() * 2;
      if (score > bestScore) { bestScore = score; bestCat = cat; }
    });
    const pool = TALENT_POOL[bestCat.id];
    const talent = pool[Math.floor(Math.random() * pool.length)];
    return { category: bestCat.id, primaryStat: bestCat.stats[0], secondaryStat: bestCat.stats[1], talent };
  }

  // ── Audition scoring ──
  function auditionScore(name, talent) {
    const s = pStats(name);
    return s[talent.primaryStat] * 0.35 + s[talent.secondaryStat] * 0.25 + s.social * 0.15 + s.temperament * 0.10 + Math.random() * 3.0;
  }

  // ── Show scoring (fresh random) ──
  function showScore(name, talent) {
    const s = pStats(name);
    return s[talent.primaryStat] * 0.35 + s[talent.secondaryStat] * 0.25 + s.social * 0.15 + s.temperament * 0.10 + Math.random() * 3.0;
  }

  function chefScore(raw) {
    return Math.min(9, Math.max(0, Math.round(raw - 2)));
  }

  // ── Auditions ──
  const auditions = {};
  const captains = {};
  tribeMembers.forEach(t => {
    // Captain: highest social+strategic
    const captain = t.members.slice().sort((a, b) => {
      const sA = pStats(a), sB = pStats(b);
      return (sB.social * 0.5 + sB.strategic * 0.5) - (sA.social * 0.5 + sA.strategic * 0.5);
    })[0];
    captains[t.name] = captain;

    // Everyone auditions
    const results = t.members.map(name => {
      const talentInfo = assignTalent(name);
      const score = auditionScore(name, talentInfo);
      return { name, ...talentInfo, auditionScore: score, selected: false };
    }).sort((a, b) => b.auditionScore - a.auditionScore);

    // Top 3 selected (or 2 if tribe has exactly 2 members)
    const actsCount = Math.min(3, t.members.length);
    results.slice(0, actsCount).forEach(r => { r.selected = true; });
    auditions[t.name] = results;
  });

  // ── Sabotage check (villain/schemer on opposing tribe, max 1) ──
  let sabotage = null;
  tribeMembers.forEach(t => {
    if (sabotage) return;
    t.members.forEach(name => {
      if (sabotage) return;
      const s = pStats(name);
      if (!['villain', 'schemer', 'mastermind'].includes(s.archetype)) return;
      if (Math.random() >= s.strategic * 0.03) return;
      // Pick target: highest audition scorer on an opposing tribe
      const otherTribes = tribeMembers.filter(ot => ot.name !== t.name);
      const targets = otherTribes.flatMap(ot => (auditions[ot.name] || []).filter(a => a.selected));
      if (!targets.length) return;
      const target = targets.sort((a, b) => b.auditionScore - a.auditionScore)[0];
      const sabType = SABOTAGE_TYPES[Math.floor(Math.random() * SABOTAGE_TYPES.length)];
      sabotage = {
        saboteur: name, saboteurTribe: t.name,
        target: target.name, targetTribe: otherTribes.find(ot => (auditions[ot.name] || []).some(a => a.name === target.name))?.name,
        type: sabType.id,
        text: sabType.text(name, target.name, pronouns(target.name)),
      };
    });
  });

  // ── The Show: perform acts (interleaved) ──
  const performances = [];
  const maxActs = Math.max(...Object.values(auditions).map(a => a.filter(r => r.selected).length));
  for (let actIdx = 0; actIdx < maxActs; actIdx++) {
    tribeMembers.forEach(t => {
      const selected = (auditions[t.name] || []).filter(r => r.selected);
      if (actIdx >= selected.length) return;
      const performer = selected[actIdx];
      const name = performer.name;
      const pr = pronouns(name);
      const s = pStats(name);
      const talent = performer.talent;

      let rawScore = showScore(name, performer);
      let outcome = 'normal';

      // Sabotage penalty
      const isSabotaged = sabotage?.target === name;
      if (isSabotaged) {
        rawScore -= 3 + Math.random();
        outcome = 'sabotaged';
      }

      // Disaster check (only if not already sabotaged into oblivion)
      const disasterChance = (10 - s.temperament) * 0.03;
      if (outcome === 'normal' && Math.random() < disasterChance) {
        rawScore = 1 + Math.random();
        outcome = 'disaster';
      }

      // Clutch check: only for lowest audition scorer of the selected 3
      const lowestAuditioner = selected[selected.length - 1]?.name;
      if (outcome === 'normal' && name === lowestAuditioner) {
        const clutchChance = s.boldness * 0.02;
        if (Math.random() < clutchChance) {
          rawScore = 8 + Math.random();
          outcome = 'clutch';
        }
      }

      const chef = chefScore(rawScore);
      const textKey = outcome === 'disaster' ? 'disaster' : outcome === 'clutch' ? 'clutch' : 'performance';
      const performanceText = talent[textKey](name, pr);

      // Audience reactions (2-3 from same tribe)
      const reactors = t.members.filter(m => m !== name).slice(0, 3);
      const scoreLevel = chef >= 7 ? 'high' : chef <= 3 ? 'low' : 'mid';
      const reactions = reactors.map(r => {
        const rArch = pStats(r).archetype || '_default';
        const pool = isSabotaged ? AUDIENCE_REACTIONS.sabotage : AUDIENCE_REACTIONS[scoreLevel];
        const fn = pool[rArch] || pool._default;
        return { name: r, text: fn(r) };
      });

      performances.push({
        name, tribe: t.name, talent: talent.name, talentId: talent.id,
        category: performer.category,
        auditionScore: performer.auditionScore,
        showScore: rawScore, chefScore: chef, outcome,
        performanceText, sabotageText: isSabotaged ? sabotage.text : null,
        reactions,
      });
    });
  }

  // ── Determine winner/loser ──
  const tribeScores = {};
  tribeMembers.forEach(t => { tribeScores[t.name] = 0; });
  performances.forEach(p => { tribeScores[p.tribe] += p.chefScore; });

  const sortedTribes = Object.entries(tribeScores).sort(([,a], [,b]) => b - a);
  const winnerName = sortedTribes[0][0];
  const loserName = sortedTribes[sortedTribes.length - 1][0];
  const winner = gs.tribes.find(t => t.name === winnerName);
  const loser = gs.tribes.find(t => t.name === loserName);

  // ── chalMemberScores from show scores ──
  const playerScores = {};
  performances.forEach(p => { playerScores[p.name] = p.showScore; });
  // Non-performers get 0
  tribeMembers.forEach(t => {
    t.members.forEach(m => { if (playerScores[m] === undefined) playerScores[m] = 0; });
  });

  // ── Set ep fields ──
  ep.winner = winner;
  ep.loser = loser;
  ep.challengeType = 'tribe';
  ep.tribalPlayers = [...loser.members];
  ep.challengeLabel = 'Talent Show';
  ep.challengeCategory = 'social';
  ep.challengeDesc = 'Camp talent show. Each tribe auditions, captain picks 3 acts. Chef scores 0-9.';
  ep.chalMemberScores = playerScores;
  ep.chalSitOuts = {};
  updateChalRecord(ep);

  // ── Camp events (2 per tribe) ──
  if (!ep.campEvents) ep.campEvents = {};
  tribeMembers.forEach(t => {
    const key = t.name;
    if (!ep.campEvents[key]) ep.campEvents[key] = { pre: [], post: [] };
    if (!ep.campEvents[key].post) ep.campEvents[key].post = [];

    const tribePerfs = performances.filter(p => p.tribe === t.name);
    const tribeAuditions = auditions[t.name] || [];

    // ── POSITIVE ──
    // Unlikely Hero: lowest auditioner who clutched
    const clutchPerf = tribePerfs.find(p => p.outcome === 'clutch');
    // Standing Ovation: highest chef score
    const bestPerf = tribePerfs.slice().sort((a, b) => b.chefScore - a.chefScore)[0];
    // Team Support: highest social non-performer
    const nonPerformers = t.members.filter(m => !tribePerfs.some(p => p.name === m));
    const supporter = nonPerformers.sort((a, b) => pStats(b).social - pStats(a).social)[0];

    if (clutchPerf) {
      const pr = pronouns(clutchPerf.name);
      ep.campEvents[key].post.push({
        type: 'talentShowUnlikelyHero', players: [clutchPerf.name],
        text: `Nobody expected ${clutchPerf.name} to steal the show. ${pr.Sub} almost didn't make the cut. Then ${pr.sub} walked on stage and changed everything.`,
        consequences: '+0.4 bond from tribemates.',
        badgeText: 'UNLIKELY HERO', badgeClass: 'gold'
      });
      t.members.filter(m => m !== clutchPerf.name).forEach(m => addBond(m, clutchPerf.name, 0.4));
    } else if (bestPerf && bestPerf.chefScore >= 7) {
      const pr = pronouns(bestPerf.name);
      ep.campEvents[key].post.push({
        type: 'talentShowStandingOvation', players: [bestPerf.name],
        text: `${bestPerf.name} brought the house down. Chef gave ${pr.obj} a ${bestPerf.chefScore}. The tribe carried ${pr.obj} off the stage.`,
        consequences: '+0.5 bond from tribemates, +2 popularity.',
        badgeText: 'STANDING OVATION', badgeClass: 'gold'
      });
      t.members.filter(m => m !== bestPerf.name).forEach(m => addBond(m, bestPerf.name, 0.5));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[bestPerf.name] = (gs.popularity[bestPerf.name] || 0) + 2;
    } else if (supporter) {
      const pr = pronouns(supporter);
      ep.campEvents[key].post.push({
        type: 'talentShowTeamSupport', players: [supporter, ...(tribePerfs[0] ? [tribePerfs[0].name] : [])],
        text: `${supporter} didn't perform, but ${pr.sub} ${pr.sub === 'they' ? 'were' : 'was'} the loudest voice in the crowd. Every cheer, every clap — the performers felt it.`,
        consequences: '+0.3 bond with performers.',
        badgeText: 'TEAM SUPPORT', badgeClass: 'gold'
      });
      tribePerfs.forEach(p => addBond(p.name, supporter, 0.3));
    }

    // ── NEGATIVE ──
    const sabotaged = sabotage && sabotage.saboteurTribe !== t.name && tribePerfs.some(p => p.outcome === 'sabotaged');
    const disasterPerf = tribePerfs.find(p => p.outcome === 'disaster');
    const bitterReject = tribeAuditions.find((a, idx) => !a.selected && idx < 4); // close to cutoff

    if (sabotaged && sabotage) {
      const pr = pronouns(sabotage.saboteur);
      ep.campEvents[key].post.push({
        type: 'talentShowSabotageFallout', players: [sabotage.target, sabotage.saboteur],
        text: `What ${sabotage.saboteur} did to ${sabotage.target} won't be forgotten. The tribe is furious.`,
        consequences: '-0.5 bond with saboteur, +1.5 heat.',
        badgeText: 'SABOTAGE', badgeClass: 'red'
      });
      t.members.forEach(m => addBond(m, sabotage.saboteur, -0.5));
      if (!gs._talentShowHeat) gs._talentShowHeat = {};
      gs._talentShowHeat[sabotage.saboteur] = { amount: 1.5, expiresEp: ((gs.episode || 0) + 1) + 2 };
    } else if (disasterPerf) {
      const pr = pronouns(disasterPerf.name);
      ep.campEvents[key].post.push({
        type: 'talentShowDisaster', players: [disasterPerf.name],
        text: `${disasterPerf.name} choked on stage. Chef gave ${pr.obj} a ${disasterPerf.chefScore}. The tribe tries not to talk about it. They fail.`,
        consequences: '-0.3 bond from tribemates, +0.5 heat.',
        badgeText: 'STAGE DISASTER', badgeClass: 'red'
      });
      t.members.filter(m => m !== disasterPerf.name).forEach(m => addBond(m, disasterPerf.name, -0.3));
      if (!gs._talentShowHeat) gs._talentShowHeat = {};
      gs._talentShowHeat[disasterPerf.name] = { amount: 0.5, expiresEp: ((gs.episode || 0) + 1) + 1 };
    } else if (bitterReject) {
      const captain = captains[t.name];
      const pr = pronouns(bitterReject.name);
      ep.campEvents[key].post.push({
        type: 'talentShowBitterReject', players: [bitterReject.name, captain],
        text: `${bitterReject.name} was THIS close to making the cut. ${captain} chose someone else. ${pr.Sub} ${pr.sub === 'they' ? 'haven\'t' : 'hasn\'t'} forgotten.`,
        consequences: '-0.4 bond with captain.',
        badgeText: 'BITTER REJECTION', badgeClass: 'red'
      });
      addBond(bitterReject.name, captain, -0.4);
    }
  });

  // ── Store data ──
  ep.talentShow = {
    auditions, performances, captains, sabotage,
    tribeScores,
    winner: winnerName, loser: loserName,
    mvp: performances.slice().sort((a, b) => b.chefScore - a.chefScore)[0]?.name || null,
  };
}
```

- [ ] **Step 2: Add talent show heat to computeHeat**

Find `gs._dodgebrawlHeat` in computeHeat, add after it:

```javascript
  if (gs._talentShowHeat?.[name] && ((gs.episode || 0) + 1) < gs._talentShowHeat[name].expiresEp) heat += gs._talentShowHeat[name].amount;
```

- [ ] **Step 3: Add talent show heat clearing**

Find the dodgebrawl heat clearing block, add after it:

```javascript
    // Clear expired talent show heat
    if (gs._talentShowHeat) {
      Object.keys(gs._talentShowHeat).forEach(k => {
        if (((gs.episode || 0) + 1) >= gs._talentShowHeat[k].expiresEp) delete gs._talentShowHeat[k];
      });
      if (!Object.keys(gs._talentShowHeat).length) delete gs._talentShowHeat;
    }
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: simulateTalentShow — auditions, performances, sabotage, camp events"
```

---

### Task 4: Episode History + patchEpisodeHistory + Badges

**Files:**
- Modify: `simulator.html` — episode history push, patchEpisodeHistory, badge chains

- [ ] **Step 1: Add to episode history push**

Find `isDodgebrawl:` in the standard history push, add after the dodgebrawl lines:

```javascript
    isTalentShow:       ep.isTalentShow       || false,
    talentShow:         ep.talentShow         || null,
```

- [ ] **Step 2: Add to patchEpisodeHistory**

Find `if (!h.dodgebrawl && ep.dodgebrawl)`, add after it:

```javascript
  if (ep.isTalentShow) h.isTalentShow = true;
  if (!h.talentShow && ep.talentShow) h.talentShow = ep.talentShow;
```

- [ ] **Step 3: Add badge text entries**

After the dodgebrawl badge text entries (after `dodgebrawlLiability`), add:

```javascript
                     : evt.type === 'talentShowStandingOvation' ? (evt.badgeText || 'STANDING OVATION')
                     : evt.type === 'talentShowUnlikelyHero'    ? (evt.badgeText || 'UNLIKELY HERO')
                     : evt.type === 'talentShowTeamSupport'     ? (evt.badgeText || 'TEAM SUPPORT')
                     : evt.type === 'talentShowSabotageFallout' ? (evt.badgeText || 'SABOTAGE')
                     : evt.type === 'talentShowDisaster'        ? (evt.badgeText || 'STAGE DISASTER')
                     : evt.type === 'talentShowBitterReject'    ? (evt.badgeText || 'BITTER REJECTION')
```

- [ ] **Step 4: Add badge class entries**

After the dodgebrawl badge class entries, add:

```javascript
                     : evt.type === 'talentShowStandingOvation' || evt.type === 'talentShowUnlikelyHero' || evt.type === 'talentShowTeamSupport' ? 'gold'
                     : evt.type === 'talentShowSabotageFallout' || evt.type === 'talentShowDisaster' || evt.type === 'talentShowBitterReject' ? 'red'
```

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: talent show episode history, patchEpisodeHistory, camp event badges"
```

---

### Task 5: VP Screen 1 — Auditions (`rpBuildTalentAuditions`)

**Files:**
- Modify: `simulator.html` — add function near other rpBuild functions, register in buildVPScreens

- [ ] **Step 1: Add the auditions VP function**

Place before `rpBuildDodgebrawl` (~line 49953):

```javascript
function rpBuildTalentAuditions(ep) {
  const ts = ep.talentShow;
  if (!ts?.auditions) return null;

  const stateKey = `ts_aud_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const tribeNames = Object.keys(ts.auditions);
  const totalItems = tribeNames.length;
  const allRevealed = state.idx >= totalItems - 1;

  const _tsReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  let html = `<div class="rp-page tod-dawn">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;color:#8b5cf6;text-shadow:0 0 20px rgba(139,92,246,0.3);margin-bottom:6px">🎭 TALENT SHOW — AUDITIONS</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:20px">Each tribe auditions. Captain picks the 3 best acts for the show.</div>`;

  tribeNames.forEach((tribeName, tIdx) => {
    const isVisible = tIdx <= state.idx;
    if (!isVisible) {
      html += `<div style="padding:14px;margin-bottom:6px;border:1px solid var(--border);border-radius:8px;opacity:0.12;text-align:center;color:var(--muted)">${tribeName} Auditions</div>`;
      return;
    }

    const tc = tribeColor(tribeName);
    const captain = ts.captains[tribeName];
    const results = ts.auditions[tribeName] || [];

    html += `<div style="margin-bottom:16px;padding:14px;border-radius:10px;border:1px solid ${tc}44;background:${tc}08;animation:scrollDrop 0.3s var(--ease-broadcast) both">`;
    html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <div style="font-family:var(--font-display);font-size:14px;letter-spacing:1px;color:${tc}">${tribeName.toUpperCase()} AUDITIONS</div>`;
    if (captain) {
      html += `<div style="display:flex;align-items:center;gap:4px;margin-left:auto">
        ${rpPortrait(captain, 'xs')}
        <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f0a500">CAPTAIN</span>
      </div>`;
    }
    html += `</div>`;

    results.forEach((r, i) => {
      const pr = pronouns(r.name);
      const badgeColor = r.selected ? '#3fb950' : (i === 3 ? '#f0a500' : '#f85149');
      const badgeText = r.selected ? 'SELECTED' : (i === 3 ? 'CLOSE CALL' : 'CUT');
      const opacity = r.selected ? '1' : '0.5';
      html += `<div style="display:flex;align-items:center;gap:10px;padding:8px;margin-bottom:4px;border-radius:6px;background:rgba(255,255,255,0.02);opacity:${opacity}">
        ${rpPortrait(r.name, 'sm')}
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:600;color:#e6edf3">${r.name}</div>
          <div style="font-size:10px;color:#8b949e">${r.talent.name}</div>
          <div style="font-size:10px;color:#6e7681;font-style:italic;margin-top:2px">${r.talent.audition(r.name, pr)}</div>
        </div>
        <div style="text-align:right">
          <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${badgeColor};background:${badgeColor}18;padding:2px 6px;border-radius:3px">${badgeText}</span>
          <div style="font-size:10px;color:#8b949e;margin-top:2px">${r.auditionScore.toFixed(1)}</div>
        </div>
      </div>`;
    });

    html += `</div>`;
  });

  if (!allRevealed) {
    html += `<div style="position:sticky;bottom:0;padding:12px 0;text-align:center;background:linear-gradient(transparent,var(--bg-primary) 30%)">
      <button class="rp-btn" onclick="${_tsReveal(state.idx + 1)}">NEXT (${state.idx + 2}/${totalItems})</button>
      <button class="rp-btn rp-btn-secondary" onclick="${_tsReveal(totalItems - 1)}" style="margin-left:8px">REVEAL ALL</button>
    </div>`;
  }

  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Register in buildVPScreens**

Find the dodgebrawl registration (`ep.isDodgebrawl && ep.dodgebrawl`), add after it:

```javascript
  } else if (ep.isTalentShow && ep.talentShow) {
    vpScreens.push({ id:'talent-auditions', label:'Auditions', html: rpBuildTalentAuditions(ep) });
    const _tsShowHtml = rpBuildTalentShowStage(ep);
    if (_tsShowHtml) vpScreens.push({ id:'talent-show', label:'The Show', html: _tsShowHtml });
```

- [ ] **Step 3: Exclude from generic twist screen**

Find the `rpBuildPreTwist` filter chain (search for `'dodgebrawl'`), add `&& t.type !== 'talent-show'`.

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: talent show auditions VP screen (click-to-reveal per tribe)"
```

---

### Task 6: VP Screen 2 — The Show (`rpBuildTalentShowStage`)

**Files:**
- Modify: `simulator.html` — add function after `rpBuildTalentAuditions`

- [ ] **Step 1: Add the show VP function**

Place right after `rpBuildTalentAuditions`:

```javascript
function rpBuildTalentShowStage(ep) {
  const ts = ep.talentShow;
  if (!ts?.performances?.length) return null;

  const stateKey = `ts_show_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const totalItems = ts.performances.length;
  const allRevealed = state.idx >= totalItems - 1;

  const _tsReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  // Live scoreboard based on revealed acts
  const revealedScores = {};
  Object.keys(ts.tribeScores).forEach(t => { revealedScores[t] = 0; });
  ts.performances.forEach((p, i) => { if (i <= state.idx) revealedScores[p.tribe] += p.chefScore; });

  let html = `<div class="rp-page tod-deepnight" style="background:linear-gradient(180deg,rgba(30,20,50,1) 0%,rgba(15,10,25,1) 100%)">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:3px;text-align:center;color:#f0a500;text-shadow:0 0 30px rgba(240,165,0,0.4);margin-bottom:4px">🎭 THE TALENT SHOW</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:16px">Chef scores each act 0-9. Highest tribe total wins immunity.</div>`;

  // Scoreboard
  html += `<div style="display:flex;justify-content:center;gap:20px;margin-bottom:16px;padding:10px;border-radius:8px;background:rgba(255,255,255,0.03)">`;
  Object.entries(revealedScores).forEach(([tribe, score], i, arr) => {
    const tc = tribeColor(tribe);
    const isWinner = allRevealed && tribe === ts.winner;
    html += `<div style="text-align:center;${isWinner ? 'text-shadow:0 0 12px ' + tc : ''}">
      <div style="font-family:var(--font-display);font-size:${isWinner ? '28' : '22'}px;color:${tc};font-weight:700">${score}</div>
      <div style="font-size:10px;color:${tc};opacity:0.8">${tribe}</div>
    </div>`;
    if (i < arr.length - 1) html += `<div style="font-size:20px;color:#484f58;align-self:center">—</div>`;
  });
  html += `</div>`;

  // Per-act cards
  ts.performances.forEach((perf, i) => {
    const isVisible = i <= state.idx;
    if (!isVisible) {
      html += `<div style="padding:14px;margin-bottom:6px;border:1px solid var(--border);border-radius:8px;opacity:0.12;text-align:center;color:var(--muted)">Act ${i + 1}</div>`;
      return;
    }

    const tc = tribeColor(perf.tribe);
    const isDisaster = perf.outcome === 'disaster';
    const isClutch = perf.outcome === 'clutch';
    const isSabotaged = perf.outcome === 'sabotaged';
    const glowColor = isDisaster ? '#f85149' : isClutch ? '#f0a500' : isSabotaged ? '#da3633' : tc;

    html += `<div style="margin-bottom:10px;padding:16px;border-radius:10px;border:1px solid ${glowColor}44;background:linear-gradient(135deg,${glowColor}08 0%,transparent 60%);animation:scrollDrop 0.3s var(--ease-broadcast) both">`;

    // Sabotage card (if sabotaged, shows before the act)
    if (isSabotaged && perf.sabotageText) {
      html += `<div style="padding:10px;margin-bottom:10px;border-radius:6px;background:rgba(218,54,51,0.1);border:1px solid rgba(218,54,51,0.3)">
        <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#da3633">SABOTAGE</span>
        <div style="display:flex;align-items:center;gap:6px;margin:6px 0">
          ${rpPortrait(ts.sabotage.saboteur, 'sm')}
          <span style="font-size:11px;color:#da3633">${ts.sabotage.saboteur}</span>
        </div>
        <div style="font-size:12px;color:#e6edf3;font-style:italic">${perf.sabotageText}</div>
      </div>`;
    }

    // Performer (large, centered, spotlight glow)
    html += `<div style="text-align:center;margin-bottom:10px">
      <div style="display:inline-block;border-radius:50%;box-shadow:0 0 30px ${glowColor}40;padding:3px">
        ${rpPortrait(perf.name, 'md')}
      </div>
      <div style="font-size:14px;font-weight:700;color:#e6edf3;margin-top:6px">${perf.name}</div>
      <div style="font-size:10px;color:${tc}">${perf.tribe} — ${perf.talent}</div>
    </div>`;

    // Outcome badge
    if (isDisaster) html += `<div style="text-align:center;margin-bottom:6px"><span style="font-size:10px;font-weight:700;letter-spacing:1px;color:#f85149;background:rgba(248,81,73,0.15);padding:3px 8px;border-radius:4px">DISASTER</span></div>`;
    if (isClutch) html += `<div style="text-align:center;margin-bottom:6px"><span style="font-size:10px;font-weight:700;letter-spacing:1px;color:#f0a500;background:rgba(240,165,0,0.15);padding:3px 8px;border-radius:4px">SURPRISE HIT</span></div>`;

    // Performance text
    html += `<div style="font-size:12px;color:#cdd9e5;text-align:center;line-height:1.6;margin-bottom:12px;font-style:italic">${perf.performanceText}</div>`;

    // Chef-O-Meter bar
    html += `<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px">
      <span style="font-size:20px">👨‍🍳</span>
      <div style="display:flex;gap:2px">`;
    for (let seg = 0; seg < 9; seg++) {
      const filled = seg < perf.chefScore;
      const segColor = filled ? (perf.chefScore >= 7 ? '#3fb950' : perf.chefScore >= 4 ? '#f0a500' : '#f85149') : 'rgba(255,255,255,0.08)';
      html += `<div style="width:20px;height:14px;border-radius:2px;background:${segColor};${filled ? 'animation:scrollDrop 0.2s var(--ease-broadcast) both;animation-delay:' + (seg * 0.06) + 's' : ''}"></div>`;
    }
    html += `</div>
      <span style="font-size:16px;font-weight:800;color:${perf.chefScore >= 7 ? '#3fb950' : perf.chefScore >= 4 ? '#f0a500' : '#f85149'}">${perf.chefScore}</span>
    </div>`;

    // Audience reactions
    if (perf.reactions?.length) {
      html += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06)">`;
      perf.reactions.forEach(r => {
        html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          ${rpPortrait(r.name, 'xs')}
          <span style="font-size:10px;color:#8b949e;font-style:italic">${r.text}</span>
        </div>`;
      });
      html += `</div>`;
    }

    html += `</div>`;
  });

  // Final result
  if (allRevealed) {
    const wTC = tribeColor(ts.winner);
    html += `<div style="padding:16px;margin-top:10px;border-radius:10px;border:2px solid ${wTC};background:${wTC}0c;text-align:center">
      <div style="font-family:var(--font-display);font-size:18px;color:${wTC};margin-bottom:4px">${ts.winner.toUpperCase()} WINS THE TALENT SHOW</div>
      <div style="font-size:12px;color:#8b949e">${ts.loser} goes to tribal council.</div>
      <div style="font-size:11px;color:#8b949e;margin-top:6px">Final: ${Object.entries(revealedScores).map(([t, s]) => `${t} ${s}`).join(' — ')}</div>
      ${ts.mvp ? `<div style="margin-top:8px">${rpPortrait(ts.mvp, 'sm')}<div style="font-size:10px;color:#8b949e;margin-top:2px">MVP: ${ts.mvp}</div></div>` : ''}
    </div>`;
  }

  // Buttons
  if (!allRevealed) {
    html += `<div style="position:sticky;bottom:0;padding:12px 0;text-align:center;background:linear-gradient(transparent,rgba(15,10,25,1) 30%)">
      <button class="rp-btn" onclick="${_tsReveal(state.idx + 1)}">NEXT ACT (${state.idx + 2}/${totalItems})</button>
      <button class="rp-btn rp-btn-secondary" onclick="${_tsReveal(totalItems - 1)}" style="margin-left:8px">REVEAL ALL</button>
    </div>`;
  }

  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: talent show stage VP screen (Chef-O-Meter bars, audience reactions, sabotage)"
```

---

### Task 7: Text Backlog + Cold Open + Timeline Tag + Debug

**Files:**
- Modify: `simulator.html` — multiple locations

- [ ] **Step 1: Add text backlog function**

After `_textDodgebrawl` (~line 30488), add:

```javascript
// ── TALENT SHOW ──
function _textTalentShow(ep, ln, sec) {
  if (!ep.isTalentShow || !ep.talentShow) return;
  const ts = ep.talentShow;
  sec('TALENT SHOW');
  Object.entries(ts.auditions).forEach(([tribe, results]) => {
    ln(`${tribe} (Captain: ${ts.captains[tribe]})`);
    results.forEach(r => ln(`  ${r.selected ? '✓' : '✗'} ${r.name} — ${r.talent.name} (${r.auditionScore.toFixed(1)})`));
  });
  if (ts.sabotage) ln(`SABOTAGE: ${ts.sabotage.saboteur} sabotaged ${ts.sabotage.target} (${ts.sabotage.type})`);
  ln('');
  ts.performances.forEach(p => {
    const tag = p.outcome === 'disaster' ? ' [DISASTER]' : p.outcome === 'clutch' ? ' [CLUTCH]' : p.outcome === 'sabotaged' ? ' [SABOTAGED]' : '';
    ln(`${p.tribe} — ${p.name}: ${p.talent} — Chef: ${p.chefScore}/9${tag}`);
  });
  ln(`Final: ${Object.entries(ts.tribeScores).map(([t, s]) => `${t} ${s}`).join(' — ')}`);
  ln(`Winner: ${ts.winner}. ${ts.loser} goes to tribal.`);
  if (ts.mvp) ln(`MVP: ${ts.mvp}`);
}
```

- [ ] **Step 2: Wire into generateSummaryText**

Find `_textDodgebrawl(ep, ln, sec)` in `generateSummaryText`, add after it:

```javascript
  _textTalentShow(ep, ln, sec);
```

- [ ] **Step 3: Add cold open recap**

After the dodgebrawl cold open recap (search for `prevEp.isDodgebrawl && prevEp.dodgebrawl`), add:

```javascript
    if (prevEp.isTalentShow && prevEp.talentShow) {
      const _ts = prevEp.talentShow;
      const _tsScore = Object.entries(_ts.tribeScores).map(([t, s]) => `${t} ${s}`).join('–');
      html += `<div class="vp-card" style="border-color:rgba(139,92,246,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#8b5cf6;margin-bottom:4px">TALENT SHOW</div>
        <div style="font-size:12px;color:#8b949e">${_ts.winner} won (${_tsScore}).${_ts.mvp ? ` MVP: ${_ts.mvp}.` : ''}${_ts.sabotage ? ` ${_ts.sabotage.saboteur} sabotaged ${_ts.sabotage.target}.` : ''}</div>
      </div>`;
    }
```

- [ ] **Step 4: Add timeline tag**

After `dbTag` definition, add:

```javascript
    const tsTag = ep.isTalentShow ? `<span class="ep-hist-tag" style="background:rgba(139,92,246,0.15);color:#8b5cf6">Talent Show</span>` : '';
```

Add `${tsTag}` to the tag rendering line (find `${dbTag}` and add `${tsTag}` after it).

- [ ] **Step 5: Add debug Challenge tab breakdown**

In the debug Challenge tab (inside `rpBuildDebug`, search for `_dbTab === 'challenge'`), find the dodgebrawl per-round breakdown section. After the cliff dive section, add:

```javascript
    // Talent show breakdown
    if (ep.talentShow?.performances?.length) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#f0883e;margin:16px 0 8px">Talent Show — Performances</div>`;
      ep.talentShow.performances.forEach((p, i) => {
        const tc = tribeColor(p.tribe);
        const tag = p.outcome === 'disaster' ? ' 💥 DISASTER' : p.outcome === 'clutch' ? ' ⭐ CLUTCH' : p.outcome === 'sabotaged' ? ' 🗡️ SABOTAGED' : '';
        html += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:10px">
          <span style="width:16px;color:#8b949e;text-align:right">${i + 1}.</span>
          <span style="color:${tc}">${p.name}</span>
          <span style="color:#8b949e">${p.talent}</span>
          <span style="font-weight:700;color:${p.chefScore >= 7 ? '#3fb950' : p.chefScore <= 3 ? '#f85149' : '#e6edf3'};margin-left:auto">Chef: ${p.chefScore}/9${tag}</span>
        </div>`;
      });
      if (ep.talentShow.sabotage) {
        const sab = ep.talentShow.sabotage;
        html += `<div style="margin-top:6px;padding:4px 8px;border-radius:4px;background:rgba(218,54,51,0.08);font-size:10px;color:#da3633">Sabotage: ${sab.saboteur} → ${sab.target} (${sab.type})</div>`;
      }
    }
```

- [ ] **Step 6: Add `isTalentShow` to the challenge tab button condition and the updateChalRecord skip list**

In the challenge tab button condition, add `|| ep.isTalentShow` alongside the other challenge flags.

Also add `'talent-show'` to `_chalType` derivation:
```javascript
const _chalType = ep.isDodgebrawl ? 'Dodgebrawl' : ... : ep.isTalentShow ? 'Talent Show' : _chalLabel;
```

- [ ] **Step 7: Commit**

```bash
git add simulator.html
git commit -m "feat: talent show text backlog, cold open, timeline tag, debug breakdown"
```

---

### Task 8: CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add to Key Engine Functions**

After `simulateDodgebrawl(ep)`:

```
- `simulateTalentShow(ep)` — talent show challenge (pre-merge, auditions + Chef-O-Meter scoring)
```

- [ ] **Step 2: Add to Core State**

After `gs._dodgebrawlHeat`:

```
- `gs._talentShowHeat` — temporary heat from talent show (sabotage, disaster)
```

- [ ] **Step 3: Add Talent Show section**

After the Dodgebrawl section:

```markdown
## Talent Show
- Schedulable pre-merge challenge (`talent-show` in TWIST_CATALOG, category `challenge`)
- All tribe members audition; captain (highest social+strategic) picks 3 to perform
- Audition score: `primaryStat * 0.35 + secondaryStat * 0.25 + social * 0.15 + temperament * 0.10 + random(0, 3.0)`
- 5 talent categories (physical/performanceArt/skill/daredevil/creative), 6 talents each, assigned by highest stat combo
- Each talent has 4 text variants: audition, performance, disaster, clutch
- Show score: fresh roll, mapped to Chef 0-9. Disaster: `(10-temperament)*0.03`. Clutch: `boldness*0.02` (lowest auditioner only).
- Sabotage: villain/schemer/mastermind, `strategic*0.03`, max 1 per game, targets opponent's best performer
- Audience reactions: 2-3 per act, archetype-driven (hero/villain/floater/etc.), keyed to high/mid/low score
- 2 camp events per tribe: standing ovation/unlikely hero/team support (positive), sabotage fallout/disaster/bitter rejection (negative)
- VP: `rpBuildTalentAuditions(ep)` (casual auditions) + `rpBuildTalentShowStage(ep)` (stage with Chef-O-Meter bars)
- Chef-O-Meter: 9 segments, green/orange/red fill with CSS animation
- Text backlog: `_textTalentShow(ep, ln, sec)`
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add Talent Show to CLAUDE.md"
```
