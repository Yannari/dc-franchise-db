# TDI-Style Dock Arrival Cold Open — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Episode 1 gets a Total Drama Island-style arrival sequence where players arrive one by one at the dock with archetype-based dialogue, replacing the normal Cold Open.

**Architecture:** `generateDockArrivals(ep)` creates the arrival data during ep1 simulation. `rpBuildColdOpen` detects ep1 + dockArrivals and renders the arrival VP. Per-player `isReturnee` toggle in cast builder. Dialogue pools are inline constants.

**Tech Stack:** Vanilla JS in `simulator.html`

---

### Task 1: Cast Builder — `isReturnee` Toggle

**Files:**
- Modify: `simulator.html:843` (after archetype desc div, before stats divider)
- Modify: `simulator.html:2250` (submitPlayer — save the flag)
- Modify: `simulator.html:2266` (editPlayer — restore the flag)
- Modify: `simulator.html:2296` (resetForm — clear the flag)

- [ ] **Step 1: Add checkbox HTML to the form panel**

After line 843 (`<div class="archetype-desc" id="archetype-desc"></div>`) and before line 844 (`</div>`), insert:

```html
          <label style="display:flex;align-items:center;gap:6px;margin-top:8px;cursor:pointer">
            <input type="checkbox" id="f-returnee" style="width:14px;height:14px">
            <span style="font-size:12px;color:var(--muted)">Returning Player</span>
          </label>
```

- [ ] **Step 2: Save `isReturnee` in submitPlayer**

In `submitPlayer()` (line ~2260), after `archetype: document.getElementById('f-archetype').value, stats: getStats(),`, add:

```javascript
    isReturnee: document.getElementById('f-returnee')?.checked || false,
```

- [ ] **Step 3: Restore `isReturnee` in editPlayer**

In `editPlayer()` (line ~2274), after the sexuality line, add:

```javascript
  const retEl = document.getElementById('f-returnee'); if (retEl) retEl.checked = p.isReturnee || false;
```

- [ ] **Step 4: Clear `isReturnee` in resetForm**

In `resetForm()` (line ~2300), after the sexuality line, add:

```javascript
  const retEl = document.getElementById('f-returnee'); if (retEl) retEl.checked = false;
```

- [ ] **Step 5: Show returnee badge on cast card**

In `renderCard()` (line ~2674), after the archetype-tag span, add:

```javascript
          ${p.isReturnee ? '<span class="archetype-tag" style="background:rgba(245,158,11,0.15);color:#f59e0b">Returning</span>' : ''}
```

- [ ] **Step 6: Commit**

```bash
git add simulator.html
git commit -m "feat: add isReturnee toggle to cast builder"
```

---

### Task 2: Dialogue Pools — Constants

**Files:**
- Modify: `simulator.html` — insert new constants block before `generateDockArrivals` function (Task 3)

- [ ] **Step 1: Add all dialogue pool constants**

Insert before `generateDockArrivals` (which will be added in Task 3). Find `function executeFirstImpressions` (line ~11156) and insert BEFORE it. This is a large block — all the dialogue data.

```javascript
// ══════════════════════════════════════════════════════════════════════
// DOCK ARRIVAL — DIALOGUE POOLS
// ══════════════════════════════════════════════════════════════════════

const DOCK_ARRIVAL_TIERS = {
  chill: ['floater','loyal-soldier','social-butterfly','showmancer','underdog'],
  intense: ['hero','challenge-beast','perceptive-player','mastermind'],
  volatile: ['villain','hothead','chaos-agent','schemer','wildcard','goat'],
};

const DOCK_HOST_LINES = {
  villain: [
    (n,pr,h) => `"Watch your backs, everyone. ${n} just arrived."`,
    (n,pr,h) => `"Oh, this should be interesting. Everyone, meet ${n}."`,
    (n,pr,h) => `"${n} is here. And no, ${pr.sub} ${pr.sub==='they'?"don't":"doesn't"} play nice."`,
    (n,pr,h) => `"Ladies and gentlemen... trouble just docked."`,
    (n,pr,h) => `"I'd say play nice, ${n}, but we both know that's not happening."`,
  ],
  hero: [
    (n,pr,h) => `"Give it up for ${n}!"`,
    (n,pr,h) => `"${n} is here. Finally, someone the audience can root for."`,
    (n,pr,h) => `"The golden child has arrived. Welcome, ${n}."`,
    (n,pr,h) => `"${n}! The one everyone wants on their team."`,
  ],
  schemer: [
    (n,pr,h) => `"${n}, welcome. Try not to scheme too hard on day one."`,
    (n,pr,h) => `"${n} is here. ${pr.Sub} already ${pr.sub==='they'?'look':'looks'} like ${pr.sub}'${pr.sub==='they'?"re":"s"} planning something."`,
    (n,pr,h) => `"Everyone smile at ${n}. ${pr.Sub}'${pr.sub==='they'?"re":"s"} definitely smiling at you."`,
    (n,pr,h) => `"Welcome, ${n}. I'm sure your intentions are pure."`,
  ],
  mastermind: [
    (n,pr,h) => `"${n} just arrived. ${pr.Sub}'${pr.sub==='they'?"re":"s"} already three moves ahead."`,
    (n,pr,h) => `"Welcome, ${n}. Try to enjoy the game, not just win it."`,
    (n,pr,h) => `"${n} is here. I can practically hear the gears turning."`,
    (n,pr,h) => `"Everyone, this is ${n}. The smartest person here just got competition."`,
  ],
  hothead: [
    (n,pr,h) => `"${n} is here, and ${pr.sub} already ${pr.sub==='they'?'look':'looks'} annoyed."`,
    (n,pr,h) => `"Welcome, ${n}. Deep breaths, we just started."`,
    (n,pr,h) => `"${n}! Try not to break anything on day one."`,
    (n,pr,h) => `"Aaaaand the temperature on the dock just went up. ${n}, everyone."`,
  ],
  'chaos-agent': [
    (n,pr,h) => `"Brace yourselves. ${n} just arrived."`,
    (n,pr,h) => `"${n} is here. Lock up the supplies."`,
    (n,pr,h) => `"Welcome, ${n}. I'm already nervous."`,
    (n,pr,h) => `"Everyone, meet ${n}. No, I can't predict what happens next either."`,
  ],
  'loyal-soldier': [
    (n,pr,h) => `"${n}! Good to have you here."`,
    (n,pr,h) => `"Welcome, ${n}. Solid, dependable — exactly what a team needs."`,
    (n,pr,h) => `"${n} is here. Someone you want in your corner."`,
    (n,pr,h) => `"Give it up for ${n}. The kind of player who keeps their word."`,
  ],
  'social-butterfly': [
    (n,pr,h) => `"${n} is here, and ${pr.sub}'${pr.sub==='they'?"re":"s"} already making friends."`,
    (n,pr,h) => `"Everyone's new best friend just arrived. Welcome, ${n}."`,
    (n,pr,h) => `"${n}! I give it five minutes before ${pr.sub} ${pr.sub==='they'?'know':'knows'} everyone's name."`,
    (n,pr,h) => `"Welcome, ${n}. The social game starts now."`,
  ],
  showmancer: [
    (n,pr,h) => `"${n} is here. Try to focus, people."`,
    (n,pr,h) => `"Welcome, ${n}. I see some heads turning already."`,
    (n,pr,h) => `"${n} just arrived. This should complicate things."`,
    (n,pr,h) => `"Ladies and gentlemen, ${n}. Hearts will be broken."`,
  ],
  'challenge-beast': [
    (n,pr,h) => `"${n} is here. The challenges just got a lot more interesting."`,
    (n,pr,h) => `"Welcome, ${n}. You look like you could win every single one of these."`,
    (n,pr,h) => `"${n}! Built for this. Literally."`,
    (n,pr,h) => `"Everyone, meet your biggest challenge threat. ${n}, welcome."`,
  ],
  floater: [
    (n,pr,h) => `"${n}, welcome to the island."`,
    (n,pr,h) => `"And here's ${n}. Flying under the radar already."`,
    (n,pr,h) => `"${n} is here. Quiet entrance — noted."`,
    (n,pr,h) => `"Welcome, ${n}. Sometimes the quiet ones go the furthest."`,
  ],
  wildcard: [
    (n,pr,h) => `"${n} just docked. Your guess is as good as mine."`,
    (n,pr,h) => `"Welcome, ${n}. I genuinely don't know what to expect from you."`,
    (n,pr,h) => `"${n} is here. Even the producers aren't sure what's going to happen."`,
    (n,pr,h) => `"Everyone, this is ${n}. Expect the unexpected."`,
  ],
  'perceptive-player': [
    (n,pr,h) => `"${n} is here. ${pr.Sub}'${pr.sub==='they'?"re":"s"} already reading everyone."`,
    (n,pr,h) => `"Welcome, ${n}. Nothing gets past this one."`,
    (n,pr,h) => `"${n} just arrived. ${pr.Sub} probably already ${pr.sub==='they'?'know':'knows'} who's lying."`,
    (n,pr,h) => `"Everyone, meet ${n}. The human lie detector."`,
  ],
  underdog: [
    (n,pr,h) => `"${n} is here. Don't count ${pr.obj} out."`,
    (n,pr,h) => `"Welcome, ${n}. The underdog story starts now."`,
    (n,pr,h) => `"${n}! Small in stature, big in heart."`,
    (n,pr,h) => `"Everyone, this is ${n}. ${pr.Sub}'ll surprise you."`,
  ],
  goat: [
    (n,pr,h) => `"${n}, welcome!"`,
    (n,pr,h) => `"And here's ${n}. Welcome to the island."`,
    (n,pr,h) => `"${n} is here. Let's see what ${pr.sub} ${pr.sub==='they'?'bring':'brings'} to the table."`,
    (n,pr,h) => `"Welcome, ${n}. Make yourself at home."`,
  ],
};

const DOCK_STAT_FLAVOR = [
  { stat: 'physical', min: 8, fn: (n,pr) => `"${n} just stepped off the boat looking like ${pr.sub} could flip it over."` },
  { stat: 'strategic', min: 8, fn: (n,pr) => `"${n} is here. I give it ten minutes before ${pr.sub} ${pr.sub==='they'?'have':'has'} a plan."` },
  { stat: 'social', min: 8, fn: (n,pr) => `"${n} just arrived, and somehow half the dock already likes ${pr.obj}."` },
  { stat: 'endurance', min: 8, fn: (n,pr) => `"${n} is here. Good luck outlasting this one."` },
  { stat: 'mental', min: 8, fn: (n,pr) => `"${n} just docked. The smartest person on this island might have just arrived."` },
  { stat: 'boldness', min: 8, fn: (n,pr) => `"${n} is here. ${pr.Sub} ${pr.sub==='they'?"don't":"doesn't"} do subtle."` },
  { stat: 'intuition', min: 8, fn: (n,pr) => `"${n} is here. ${pr.Sub} can read a room before ${pr.sub} even ${pr.sub==='they'?'walk':'walks'} into it."` },
  { stat: 'temperament', min: -1, max: 3, fn: (n,pr) => `"${n} just arrived. Let's hope nobody makes ${pr.obj} angry."` },
];

const DOCK_PLAYER_LINES = {
  villain: [
    `"Cute camp. I give it a week before I run this place."`,
    `"So this is the competition? This'll be easier than I thought."`,
    `"Already see a few people I can work with. And a few I'll enjoy watching leave."`,
    `"Don't worry, everyone. I'll be nice. For now."`,
    `"Everyone here is a pawn. They just don't know it yet."`,
  ],
  hero: [
    `"Hey everyone! This is going to be amazing."`,
    `"Camp looks rough, but that's half the fun, right?"`,
    `"I'm here to compete, make friends, and do this the right way."`,
    `"Whatever this place throws at us, we handle it together."`,
    `"Let's go! I've been waiting for this."`,
  ],
  schemer: [
    `"Nice to meet everyone. I mean that. Mostly."`,
    `"This camp has potential. Just needs the right person pulling the strings."`,
    `"I'm already thinking three steps ahead. Can't help it."`,
    `"Everyone looks so trusting. That's... useful."`,
    `"The alliances start now. In my head, at least."`,
  ],
  mastermind: [
    `"Interesting. I've already identified four potential alliance structures."`,
    `"The game started the moment I stepped off that boat."`,
    `"Camp's fine. The people are what matter. And I'm watching."`,
    `"Let's not pretend this isn't a chess match. I'm ready."`,
    `"Everyone's playing checkers. I brought a chess set."`,
  ],
  hothead: [
    `"This place better have food because I'm already in a mood."`,
    `"If anyone tries anything, they'll hear about it. Loudly."`,
    `"I'm not here to make friends. I'm here to win."`,
    `"Someone already looked at me wrong. We're gonna have problems."`,
    `"Alright. Let's get this over with."`,
  ],
  'chaos-agent': [
    `"This place is a dump. I LOVE it."`,
    `"So when do things start getting weird? Because I'm ready."`,
    `"Everyone looks so serious. That's gonna change."`,
    `"I brought fireworks. Not metaphorical ones."`,
    `"Rules? Sure, I'll learn them. Then break them."`,
  ],
  'loyal-soldier': [
    `"Hey, good to be here. Let's do this."`,
    `"Camp looks solid. I've seen worse."`,
    `"Just point me to my team and I'm ready to work."`,
    `"I'm here to compete hard and keep my word. Simple as that."`,
    `"Tell me what needs doing and I'll do it."`,
  ],
  'social-butterfly': [
    `"Oh my gosh, hi everyone! This is SO exciting!"`,
    `"I already love this place. And all of you. Seriously."`,
    `"I've been looking forward to this for months. Let's be friends!"`,
    `"This camp is giving me summer camp vibes and I am HERE for it."`,
    `"I want to know everyone's name by dinner."`,
  ],
  showmancer: [
    `"Well, hello everyone."`,
    `"I see some interesting people here. Very interesting."`,
    `"I'm here for the experience. Whatever happens... happens."`,
    `"Nice camp. Better company, though."`,
    `"This could be a very memorable summer."`,
  ],
  'challenge-beast': [
    `"Where's the gym? Kidding. Sort of."`,
    `"This place looks tough. Good. I like tough."`,
    `"I've been training for this. Bring on the challenges."`,
    `"If there's a physical challenge on day one, I'm winning it."`,
    `"Point me at a challenge. Any challenge."`,
  ],
  floater: [
    `"Hey. Cool. So... where do I put my stuff?"`,
    `"This seems fine."`,
    `"Not bad. I can work with this."`,
    `"I'm just gonna hang back and see how this plays out."`,
    `"Yeah, I'm here. Don't mind me."`,
  ],
  wildcard: [
    `"Is that a raccoon? I love raccoons."`,
    `"I don't really have a plan. Plans are boring."`,
    `"Whatever everyone else is doing, I'm probably doing the opposite."`,
    `"This camp smells weird. I'm into it."`,
    `"I have no idea what I'm doing and I've never felt more alive."`,
  ],
  'perceptive-player': [
    `"Interesting group. I can already tell who's faking it."`,
    `"I've been watching everyone from the boat. Already have notes."`,
    `"Camp's fine. The real game is the people. And they're fascinating."`,
    `"Three people here are already lying. It's been five minutes."`,
    `"I see everything. I just don't say everything."`,
  ],
  underdog: [
    `"I know I don't look like much. That's the point."`,
    `"Everyone always underestimates me. That's fine. Keep doing it."`,
    `"This place is rough. Perfect. I'm used to rough."`,
    `"Hi everyone. Remember my face — you're going to see a lot of it."`,
    `"Nobody expects me to win. Good."`,
  ],
  goat: [
    `"Wow, this is a real camp! With trees and everything!"`,
    `"Hi! Is this where we sleep? It's so... outdoorsy."`,
    `"I just want to have fun and not get voted out first. Is that too much to ask?"`,
    `"Everyone seems really intense. Am I supposed to be intense too?"`,
    `"So excited to be here! Where's the bathroom?"`,
  ],
};

const DOCK_RETURNEE_LINES = {
  villain: [
    `"Miss me? No? Good. That means I did my job last time."`,
    `"I'm back. And I remember every name that wrote mine down."`,
    `"Round two. This time they know what I am — and they still can't stop me."`,
    `"The villain returns. Try to act surprised."`,
  ],
  hero: [
    `"Unfinished business. That's why I'm here."`,
    `"Last time I played with honor. This time I play smarter AND with honor."`,
    `"I'm back, and I'm not leaving until I finish what I started."`,
    `"Being back feels right. This time I know what I'm up against."`,
  ],
  schemer: [
    `"They really invited me back? Their mistake."`,
    `"Last time was practice. This is the real game."`,
    `"I learned a lot last time. Mostly what NOT to get caught doing."`,
    `"Back for round two. New plans, same brain."`,
  ],
  mastermind: [
    `"I've replayed every move from last time. I know exactly what went wrong."`,
    `"Back with a better playbook. Let's see if anyone can keep up."`,
    `"Experience is the ultimate advantage. And I've got plenty."`,
    `"I've had time to think. That should scare everyone."`,
  ],
  hothead: [
    `"Yeah, I'm back. And I'm still angry about how last time went."`,
    `"Same camp, same game. Different me. Maybe. We'll see."`,
    `"They told me to stay calm this time. I'll try. No promises."`,
    `"Last time I let my temper get me. This time... okay, it might still get me."`,
  ],
  'chaos-agent': [
    `"You thought last time was chaotic? Buckle up."`,
    `"I'm baaack! Did you miss the chaos? I missed the chaos."`,
    `"Round two of me is going to be so much worse for everyone. I can't wait."`,
    `"They invited me back KNOWING what I did last time. I respect that."`,
  ],
  'loyal-soldier': [
    `"Back again. Same player, same values. Let's go."`,
    `"I kept my word last time and I'll keep it this time too."`,
    `"Being back feels like coming home. Weird, smelly home. But home."`,
    `"I know this game now. Loyalty still wins. I'll prove it."`,
  ],
  'social-butterfly': [
    `"Oh my gosh, I'm BACK! I missed this place!"`,
    `"New people to meet! Well, not new, but we get to start over, right?"`,
    `"Last time was amazing. This time is going to be BETTER."`,
    `"I already know everyone and I already love everyone. Let's GO."`,
  ],
  showmancer: [
    `"Back for more. And yes, I'm single. In case anyone's wondering."`,
    `"Last time the romance distracted me. This time... well, we'll see."`,
    `"I'm here to play, not to fall in love again. Probably."`,
    `"Same dock, same butterflies. Some things don't change."`,
  ],
  'challenge-beast': [
    `"I've been training since the day I left. Nobody's beating me this time."`,
    `"Back and stronger. The challenges don't scare me. The people might."`,
    `"Last time I relied on winning. This time I've got a social game too. Sort of."`,
    `"Round two. Let's see if anyone can keep up."`,
  ],
  floater: [
    `"Yep, I'm back. Surprised? Most people are."`,
    `"Last time I flew under the radar. This time... probably the same thing."`,
    `"Nobody expected me to come back. That's kind of my whole thing."`,
    `"Back again. Still here. Still quiet. Still dangerous."`,
  ],
  wildcard: [
    `"They let me come back! That's either brave or stupid."`,
    `"Round two! I have no idea what I'm doing and that's the plan!"`,
    `"Last time was a wild ride. This time I brought snacks."`,
    `"Back and even more unpredictable. You're welcome."`,
  ],
  'perceptive-player': [
    `"I know everyone's game this time. That's a problem — for them."`,
    `"Back with better reads. Last time I saw everything. This time I'll use it."`,
    `"Everyone's tells are exactly the same. This should be fun."`,
    `"I've been watching from home. I know who's fake. All of them."`,
  ],
  underdog: [
    `"I wasn't supposed to make it last time. I wasn't supposed to come back. Yet here I am."`,
    `"They counted me out once. They'll do it again. And I'll prove them wrong again."`,
    `"Back with something to prove. Same as always."`,
    `"The underdog returns. Honestly, this is my favorite role."`,
  ],
  goat: [
    `"I'm back! I actually got invited back! Can you believe it?"`,
    `"Last time I didn't really know what was going on. Now I kind of do!"`,
    `"Everyone told me I'd never come back. WELL HERE I AM."`,
    `"I'm so excited. Is it weird that I'm excited? I don't care, I'm excited."`,
  ],
};

const DOCK_CHEMISTRY_PAIRS = [
  { newArch: ['villain'], reactArch: ['hero'], chemType: 'tension', lines: [
    (name,pr,reactor,rPr) => `${reactor} crosses ${rPr.posAdj} arms and says nothing. The look says everything.`,
    (name,pr,reactor,rPr) => `${reactor} watches ${name} step off the boat. ${rPr.Sub} already ${rPr.sub==='they'?"don't":"doesn't"} trust ${pr.obj}.`,
    (name,pr,reactor,rPr) => `"Great," ${reactor} mutters. "This should be fun."`,
  ]},
  { newArch: ['hero'], reactArch: ['villain'], chemType: 'sizing-up', lines: [
    (name,pr,reactor,rPr) => `${reactor} smirks. "Oh, we've got a Boy Scout."`,
    (name,pr,reactor,rPr) => `${reactor} looks ${name} up and down. Competition.`,
    (name,pr,reactor,rPr) => `Something flickers behind ${reactor}'s eyes. This one could be a problem.`,
  ]},
  { newArch: ['hothead'], reactArch: ['floater','social-butterfly','loyal-soldier','goat','underdog'], chemType: 'intimidation', lines: [
    (name,pr,reactor,rPr) => `${reactor} takes a small step back. Just instinct.`,
    (name,pr,reactor,rPr) => `The dock gets quieter when ${name} arrives. ${reactor} notices.`,
    (name,pr,reactor,rPr) => `${reactor} glances at ${name} and decides to stand somewhere else.`,
  ]},
  { newArch: ['showmancer'], reactArch: ['social-butterfly','showmancer','hero'], chemType: 'attraction', lines: [
    (name,pr,reactor,rPr) => `${reactor} does a double take. Tries to play it cool. Fails.`,
    (name,pr,reactor,rPr) => `${reactor} suddenly becomes very interested in fixing ${rPr.posAdj} hair.`,
    (name,pr,reactor,rPr) => `Something about ${name} catches ${reactor}'s attention. ${rPr.Sub} ${rPr.sub==='they'?"don't":"doesn't"} look away fast enough.`,
  ]},
  { newArch: ['chaos-agent'], reactArch: ['loyal-soldier','perceptive-player'], chemType: 'dread', lines: [
    (name,pr,reactor,rPr) => `${reactor} watches ${name} arrive and gets a bad feeling about this.`,
    (name,pr,reactor,rPr) => `"Oh no," ${reactor} says quietly. ${rPr.Sub} can already tell.`,
    (name,pr,reactor,rPr) => `${reactor} and ${name} make eye contact. It's instantly clear they're going to have problems.`,
  ]},
  { newArch: ['challenge-beast'], reactArch: ['challenge-beast','hero'], chemType: 'rivalry', lines: [
    (name,pr,reactor,rPr) => `${reactor} sizes up ${name}. Finally, some real competition.`,
    (name,pr,reactor,rPr) => `${reactor} stands a little taller when ${name} steps onto the dock.`,
    (name,pr,reactor,rPr) => `Two athletes. One dock. ${reactor} and ${name} exchange a nod. Game on.`,
  ]},
  { newArch: ['goat'], reactArch: ['villain','schemer'], chemType: 'predatory', lines: [
    (name,pr,reactor,rPr) => `${reactor}'s eyes light up. Not in a nice way.`,
    (name,pr,reactor,rPr) => `${reactor} watches ${name} fumble off the boat and smiles. Perfect.`,
    (name,pr,reactor,rPr) => `${reactor} just found ${rPr.posAdj} new best friend. ${name} has no idea.`,
  ]},
  { newArch: ['underdog'], reactArch: ['hero','loyal-soldier'], chemType: 'encouragement', lines: [
    (name,pr,reactor,rPr) => `${reactor} gives ${name} a genuine smile. "Welcome."`,
    (name,pr,reactor,rPr) => `${reactor} nods at ${name}. Sees something the others don't.`,
    (name,pr,reactor,rPr) => `"Hey, glad you're here," ${reactor} says to ${name}. And means it.`,
  ]},
  { newArch: ['mastermind'], reactArch: ['mastermind','perceptive-player'], chemType: 'recognition', lines: [
    (name,pr,reactor,rPr) => `${reactor} and ${name} lock eyes. They both know what the other is.`,
    (name,pr,reactor,rPr) => `${reactor} nods once at ${name}. Respect. And concern.`,
    (name,pr,reactor,rPr) => `Two people in this game just realized they can't fool each other.`,
  ]},
  { newArch: ['wildcard'], reactArch: ['perceptive-player','mastermind'], chemType: 'curiosity', lines: [
    (name,pr,reactor,rPr) => `${reactor} can't quite figure ${name} out. That almost never happens.`,
    (name,pr,reactor,rPr) => `${reactor} tilts ${rPr.posAdj} head. ${name} is... different.`,
    (name,pr,reactor,rPr) => `${reactor} watches ${name} carefully. No read yet. Interesting.`,
  ]},
];
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add dock arrival dialogue pool constants"
```

---

### Task 3: Engine — `generateDockArrivals(ep)`

**Files:**
- Modify: `simulator.html` — insert new function right after the dialogue pool constants (before `executeFirstImpressions`)

- [ ] **Step 1: Add the generateDockArrivals function**

Insert right after the `DOCK_CHEMISTRY_PAIRS` constant, before `function executeFirstImpressions`:

```javascript
function generateDockArrivals(ep) {
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const host = seasonConfig.host || 'Chris';
  const allPlayers = [...players];
  if (!allPlayers.length) return;

  // ── Step 1: Group players by energy tier ──
  const tierGroups = { chill: [], intense: [], volatile: [] };
  allPlayers.forEach(p => {
    const arch = p.archetype || 'floater';
    const tier = Object.entries(DOCK_ARRIVAL_TIERS).find(([,archs]) => archs.includes(arch));
    tierGroups[tier ? tier[0] : 'chill'].push(p);
  });
  // Shuffle each tier
  Object.values(tierGroups).forEach(arr => arr.sort(() => Math.random() - 0.5));

  // ── Step 2: Pull first (chill) and last (volatile) ──
  const first = tierGroups.chill.length ? tierGroups.chill.shift() : tierGroups.intense.shift() || tierGroups.volatile.shift();
  const last = tierGroups.volatile.length ? tierGroups.volatile.pop() : tierGroups.intense.pop() || tierGroups.chill.pop();

  // ── Step 3: Alternate tiers for the middle ──
  const tierOrder = ['chill', 'volatile', 'intense'];
  const middle = [];
  let tIdx = 0;
  const total = tierGroups.chill.length + tierGroups.intense.length + tierGroups.volatile.length;
  for (let i = 0; i < total; i++) {
    // Try each tier in rotation until one has players
    for (let tries = 0; tries < 3; tries++) {
      const tier = tierOrder[(tIdx + tries) % 3];
      if (tierGroups[tier].length) {
        middle.push(tierGroups[tier].shift());
        tIdx = (tIdx + tries + 1) % 3;
        break;
      }
    }
  }

  const ordered = [first, ...middle, last].filter(Boolean);

  // ── Step 4: Generate dialogue for each arrival ──
  const arrivals = [];
  const onDock = []; // players already arrived

  ordered.forEach((p, i) => {
    const arch = p.archetype || 'floater';
    const pr = pronouns(p.name);
    const s = pStats(p.name);

    // Host line: 40% chance of stat flavor override
    let hostLine, statFlavor = null;
    const topStat = DOCK_STAT_FLAVOR.find(sf => {
      if (sf.stat === 'temperament') return s.temperament <= (sf.max || 3);
      return s[sf.stat] >= sf.min;
    });
    if (topStat && Math.random() < 0.40) {
      hostLine = topStat.fn(p.name, pr);
      statFlavor = topStat.stat;
    } else {
      const pool = DOCK_HOST_LINES[arch] || DOCK_HOST_LINES.floater;
      hostLine = _pick(pool)(p.name, pr, host);
    }

    // Player reaction line
    const isReturnee = p.isReturnee || false;
    const playerPool = isReturnee
      ? (DOCK_RETURNEE_LINES[arch] || DOCK_RETURNEE_LINES.floater)
      : (DOCK_PLAYER_LINES[arch] || DOCK_PLAYER_LINES.floater);
    const playerLine = _pick(playerPool);

    // Dock reaction (30-40%): check chemistry pairs with players on dock
    let dockReaction = null;
    if (onDock.length >= 1) {
      const matchingPairs = DOCK_CHEMISTRY_PAIRS.filter(cp => cp.newArch.includes(arch));
      if (matchingPairs.length) {
        for (const pair of matchingPairs) {
          const reactor = onDock.find(d => pair.reactArch.includes(d.archetype || 'floater'));
          if (reactor && Math.random() < 0.60) {
            const rPr = pronouns(reactor.name);
            const reactionText = _pick(pair.lines)(p.name, pr, reactor.name, rPr);
            dockReaction = { reactor: reactor.name, text: reactionText, chemType: pair.chemType };
            break;
          }
        }
      }
    }

    arrivals.push({
      name: p.name, order: i, archetype: arch, isReturnee,
      hostLine, playerLine, dockReaction, statFlavor,
    });

    onDock.push(p);
  });

  ep.dockArrivals = arrivals;
}
```

- [ ] **Step 2: Wire into episode 1 simulation**

Find `executeFirstImpressions(ep, twistObj);` (line ~11412). Insert BEFORE it:

```javascript
    // Generate dock arrival data for Episode 1 VP
    if ((gs.episode || 0) === 0) generateDockArrivals(ep);
```

Also, for seasons without first-impressions twist, dock arrivals should still fire on ep1. Find where `simulateEpisode` or the main episode flow starts. Search for the episode initialization that runs camp events. The safest place is to also call it early in the episode if ep.num === 1 and no first-impressions twist is scheduled.

Find the line where camp events are generated for pre-challenge (around `generateCampEvents(ep, 'pre')`). Before that call, add:

```javascript
  // Generate dock arrivals for Episode 1 (if not already generated by first-impressions twist)
  if ((gs.episode || 0) === 0 && !ep.dockArrivals) generateDockArrivals(ep);
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: add generateDockArrivals engine function"
```

---

### Task 4: VP — Arrival Sequence in rpBuildColdOpen

**Files:**
- Modify: `simulator.html:34339` (rpBuildColdOpen — add ep1 detection and arrival rendering)

- [ ] **Step 1: Add ep1 arrival branch at the top of rpBuildColdOpen**

At the very beginning of `rpBuildColdOpen(ep)`, after the function declaration (line 34339), insert before line 34340:

```javascript
  // ── Episode 1: Dock Arrival Sequence ──
  if (ep.num === 1 && ep.dockArrivals?.length) {
    return _rpBuildDockArrival(ep);
  }
```

- [ ] **Step 2: Add the `_rpBuildDockArrival` function**

Insert immediately before `rpBuildColdOpen`:

```javascript
function _rpBuildDockArrival(ep) {
  const arrivals = ep.dockArrivals;
  const host = seasonConfig.host || 'Chris';
  const seasonName = seasonConfig.name || 'Total Drama';
  const stateKey = `dock_arrivals_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const allRevealed = state.idx >= arrivals.length - 1;
  const _daReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){buildVPScreens(ep);renderVPScreen();}`;

  // Detect season composition
  const returneeCount = arrivals.filter(a => a.isReturnee).length;
  const newbieCount = arrivals.length - returneeCount;
  const isAllReturnees = newbieCount === 0;
  const isMixed = returneeCount > 0 && newbieCount > 0;

  const hostMonologue = isAllReturnees
    ? `"They've played before. They've been voted out, blindsided, betrayed. And they all came back for more. I'm ${host}, and this is ${seasonName} — All Stars. ${arrivals.length} returning players. One winner. Let's see who learned from their mistakes... and who's about to make new ones."`
    : isMixed
    ? `"Tonight, ${returneeCount} returning player${returneeCount>1?'s':''} face${returneeCount===1?'s':''} off against ${newbieCount} brand new competitor${newbieCount>1?'s':''}. The veterans think they know this game. The rookies think they can beat it. I'm ${host}, and this is ${seasonName}. Let's find out who's right."`
    : `"Yo! We're coming at you live from Camp Wawanakwa! I'm your host, ${host}. ${arrivals.length} players have signed up to spend eight weeks at this crummy old summer camp. They'll compete in challenges, vote each other out at tribal council, and the last one standing wins the prize. Every moment will be caught on camera. Who will crumble? Who will rise? Find out right here on... ${seasonName}!"`;

  let html = `<div class="rp-page tod-dawn">
    <div class="rp-co-eyebrow">${seasonName}</div>
    <div style="font-family:var(--font-display);font-size:32px;letter-spacing:3px;text-align:center;color:var(--accent-gold);text-shadow:0 0 20px var(--accent-gold);margin:10px 0 6px;animation:scrollDrop 0.5s var(--ease-broadcast) both">THE ARRIVAL</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:20px">${arrivals.length} players. One island. No idea what they signed up for.</div>
    <div style="padding:14px;background:rgba(227,179,65,0.06);border:1px solid rgba(227,179,65,0.15);border-radius:10px;text-align:center;margin-bottom:20px">
      <div style="font-size:10px;color:#f0a500;font-weight:700;letter-spacing:1px;margin-bottom:4px">${host.toUpperCase()}</div>
      <div style="font-size:13px;color:#e6edf3;line-height:1.7;font-style:italic">${hostMonologue}</div>
    </div>`;

  // Arrival cards — revealed sequentially
  arrivals.forEach((a, i) => {
    const isVisible = i <= state.idx;
    if (!isVisible) {
      html += `<div id="dock-arr-${i}" style="padding:10px;margin-bottom:6px;border:1px solid var(--border);border-radius:8px;opacity:0.12;text-align:center;font-size:11px;color:var(--muted)">Arrival #${i + 1} — ?</div>`;
      return;
    }
    const returnBadge = a.isReturnee ? `<span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f59e0b;background:rgba(245,158,11,0.12);padding:2px 6px;border-radius:3px;margin-left:6px">RETURNING</span>` : '';
    html += `<div id="dock-arr-${i}" class="vp-card" style="border-color:rgba(227,179,65,0.12);margin-bottom:8px;animation:scrollDrop 0.3s var(--ease-broadcast) both">
      <div style="display:flex;align-items:flex-start;gap:12px">
        ${rpPortrait(a.name, 'md')}
        <div style="flex:1">
          <div style="font-family:var(--font-display);font-size:15px;color:#e6edf3;margin-bottom:2px">${a.name}${returnBadge}</div>
          <div style="font-size:10px;color:#8b949e;margin-bottom:6px">${ARCHETYPE_NAMES[a.archetype] || a.archetype}</div>
          <div style="font-size:11px;color:#f0a500;font-style:italic;margin-bottom:4px">${host}: ${a.hostLine}</div>
          <div style="font-size:13px;color:#e6edf3;line-height:1.6">${a.name}: ${a.playerLine}</div>
          ${a.dockReaction ? `<div style="font-size:12px;color:#8b949e;font-style:italic;margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.04)">${a.dockReaction.text}</div>` : ''}
        </div>
      </div>
    </div>`;
  });

  // Reveal controls
  if (!allRevealed) {
    html += `<div style="text-align:center;margin-top:16px">
      <button class="rp-btn" onclick="${_daReveal(state.idx + 1)}">NEXT ARRIVAL (${state.idx + 2}/${arrivals.length})</button>
      <button class="rp-btn" style="margin-left:8px;opacity:0.6" onclick="${_daReveal(arrivals.length - 1)}">Reveal All</button>
    </div>`;
  } else {
    // Group photo + tribe assignment
    html += `<div style="text-align:center;margin-top:20px;padding:16px;border:1px solid rgba(227,179,65,0.15);border-radius:10px;background:rgba(227,179,65,0.04)">
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f0a500;margin-bottom:10px">GROUP PHOTO</div>
      <div style="font-size:12px;color:#8b949e;font-style:italic;margin-bottom:12px">"Everybody on the dock! ...try not to break it this time."</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${arrivals.map(a => rpPortrait(a.name, 'sm')).join('')}</div>
    </div>`;

    // Tribe assignment
    const tribes = ep.tribesAtStart || gs.tribes || [];
    if (tribes.length >= 2) {
      html += `<div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06)">
        <div style="font-family:var(--font-display);font-size:18px;letter-spacing:2px;text-align:center;color:#e6edf3;margin-bottom:12px">THE TEAMS</div>`;
      tribes.forEach(t => {
        const tc = tribeColor(t.name);
        html += `<div style="margin-bottom:12px">
          <div style="font-size:14px;font-weight:700;color:${tc};text-align:center;margin-bottom:6px">${t.name}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${(t.members||[]).map(m => rpPortrait(m, 'sm')).join('')}</div>
        </div>`;
      });
      html += `</div>`;
    }
  }

  html += `</div>`;
  return html;
}
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: add dock arrival VP rendering in rpBuildColdOpen"
```

---

### Task 5: Episode History + Text Backlog

**Files:**
- Modify: `simulator.html` — patchEpisodeHistory (line ~30588)
- Modify: `simulator.html` — add `_textDockArrivals` function
- Modify: `simulator.html` — wire into `generateSummaryText`

- [ ] **Step 1: Add to patchEpisodeHistory**

In `patchEpisodeHistory(ep)`, after the `tribesAtStart` line (line ~30626), add:

```javascript
  if (!h.dockArrivals && ep.dockArrivals) h.dockArrivals = ep.dockArrivals;
```

- [ ] **Step 2: Add `_textDockArrivals` function**

Insert before `_textFirstImpressions` (which was added earlier this session):

```javascript
function _textDockArrivals(ep, ln, sec) {
  if (!ep.dockArrivals?.length) return;
  sec('THE ARRIVAL');
  const host = seasonConfig.host || 'Chris';
  ep.dockArrivals.forEach(a => {
    ln(`[${host}] ${a.hostLine}`);
    ln(`[${a.name}] ${a.playerLine}`);
    if (a.dockReaction) ln(`  ${a.dockReaction.text}`);
  });
}
```

- [ ] **Step 3: Wire into generateSummaryText**

In `generateSummaryText`, add `_textDockArrivals(ep, ln, sec);` BEFORE `_textFirstImpressions(ep, ln, sec);`:

```javascript
  _textDockArrivals(ep, ln, sec);
  _textFirstImpressions(ep, ln, sec);
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: add dock arrivals to episode history and text backlog"
```

---

### Task 6: Verification

- [ ] **Step 1: Search for consistency**

```bash
grep -n "dockArrivals\|dockArrival\|generateDockArrivals\|_rpBuildDockArrival\|DOCK_ARRIVAL\|DOCK_HOST\|DOCK_PLAYER\|DOCK_RETURNEE\|DOCK_CHEMISTRY\|DOCK_STAT\|f-returnee\|isReturnee" simulator.html | head -40
```

Expected: entries across cast builder, constants, engine, VP, history, and text backlog.

- [ ] **Step 2: Open in browser, verify no JS errors**

Open `simulator.html` in browser, open DevTools console, check for parse errors.

- [ ] **Step 3: Test with a season**

1. Add a cast in Cast Builder. Mark 2-3 players as "Returning Player".
2. Initialize season. Run Episode 1.
3. Check VP: Cold Open should show "THE ARRIVAL" with sequential reveal.
4. Verify: host monologue detects mixed season. Returnee badges appear. Dock reactions fire on some arrivals.
5. Check text backlog includes THE ARRIVAL section.

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: TDI-style dock arrival cold open — complete"
```
