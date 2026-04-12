# Hell's Kitchen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a schedulable pre-merge cooking challenge with head chef selection, 3-course scoring, ~45 kitchen event types, deep consequence chains, and overdrive VP with cooking show aesthetics.

**Architecture:** New `simulateHellsKitchen(ep)` handles chef selection, course assignment, course-by-course cooking with interleaved events, host judging, winner determination. VP screen `rpBuildHellsKitchen(ep)` with plate slide animations, steam effects, score reveals. Text backlog via `_textHellsKitchen(ep, ln, sec)`.

**Tech Stack:** Pure JS in `simulator.html`. No external dependencies.

---

### Task 1: TWIST_CATALOG + applyTwist + Episode Branch

**Files:**
- Modify: `simulator.html` — TWIST_CATALOG, applyTwist, simulateEpisode, updateChalRecord skip

- [ ] **Step 1: Add catalog entry**

After paintball-hunt entry in TWIST_CATALOG, add:
```javascript
  { id:'hells-kitchen', emoji:'🔥', name:"Hell's Kitchen", category:'challenge', phase:'pre-merge', desc:'Cooking challenge. Head chef leads the team through 3 courses. Kitchen chaos, sabotage, and food fights determine who serves the best meal.', engineType:'hells-kitchen', minTribes:2, incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt'] },
```

Add `'hells-kitchen'` to ALL other challenge twists' incompatible arrays (12 existing).

- [ ] **Step 2: Add applyTwist flag**

After `ep.isPaintballHunt = true;` block:
```javascript
  } else if (engineType === 'hells-kitchen') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isHellsKitchen = true;
```

- [ ] **Step 3: Add episode branch**

After paintball hunt branch in simulateEpisode:
```javascript
  } else if (ep.isHellsKitchen && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateHellsKitchen(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateHellsKitchen
```

- [ ] **Step 4: Add to updateChalRecord skip**

Add `&& !ep.isHellsKitchen` to the skip condition.

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: add Hell's Kitchen to TWIST_CATALOG + applyTwist + episode branch"
```

---

### Task 2: Core Simulation — `simulateHellsKitchen(ep)`

**Files:**
- Modify: `simulator.html` — add function after `simulatePaintballHunt` ends (before `// ENGINE: PHOBIA FACTOR`)

The function must implement the full spec from `docs/superpowers/specs/2026-04-11-hells-kitchen-design.md`.

- [ ] **Step 1: Add the simulation function**

Insert between the closing `}` of `simulatePaintballHunt` and `// ENGINE: PHOBIA FACTOR`.

**Structure:**

```javascript
function simulateHellsKitchen(ep) {
  const tribes = gs.tribes;
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const host = seasonConfig.host || 'Chris';

  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });

  const allMembers = tribes.flatMap(t => t.members);
  const tribeOf = {};
  tribes.forEach(t => t.members.forEach(m => { tribeOf[m] = t.name; }));

  // ── DISH POOLS ──
  const APPETIZER_POOL = [
    { name: 'Bruschetta', desc: 'Toasted bread, fresh tomatoes, basil. Simple but easy to mess up.' },
    { name: 'Shrimp Cocktail', desc: 'Chilled shrimp with cocktail sauce. Timing is everything.' },
    { name: 'Caesar Salad', desc: 'Romaine, croutons, parmesan. The dressing makes or breaks it.' },
    { name: 'Spring Rolls', desc: 'Rice paper, vegetables, dipping sauce. Delicate work.' },
    { name: 'Caprese Skewers', desc: 'Mozzarella, tomato, basil on sticks. Presentation matters.' },
    { name: 'Stuffed Mushrooms', desc: 'Mushroom caps with herbed filling. Oven timing critical.' },
    { name: 'Soup du Jour', desc: "Chef's choice soup. Wide variance — could be brilliant or terrible." },
    { name: 'Charcuterie Board', desc: 'Cured meats, cheeses, crackers. Assembly art.' },
    { name: 'Deviled Eggs', desc: 'Classic but judged harshly if bland. Spice game matters.' },
    { name: 'Ceviche', desc: 'Raw fish cured in citrus. Bold choice. High risk, high reward.' },
    { name: 'French Onion Soup', desc: 'Caramelized onions, gruyère, crusty bread. Takes patience.' },
    { name: 'Crab Cakes', desc: 'Pan-seared crab patties. Expensive ingredients, pressure not to waste them.' },
    { name: 'Tartare', desc: 'Raw beef, capers, egg yolk. Intimidating. Judges love it or hate it.' },
    { name: 'Gyoza', desc: 'Pan-fried dumplings. Folding technique separates good from great.' },
    { name: 'Antipasto Platter', desc: 'Italian meats, olives, roasted peppers. The classic.' },
  ];
  const MAIN_POOL = [
    { name: 'Spaghetti Bolognese', desc: 'Pasta with meat sauce. Comfort food. Hard to make memorable.' },
    { name: 'Grilled Salmon', desc: 'Cedar-planked salmon with lemon. Don\'t overcook it.' },
    { name: 'Beef Wellington', desc: 'Tenderloin in puff pastry. The ultimate test — soggy bottom = death.' },
    { name: 'Chicken Parmesan', desc: 'Breaded chicken, marinara, mozzarella. Crowd pleaser.' },
    { name: 'Lamb Chops', desc: 'Herb-crusted, pan-seared. Temperature is everything.' },
    { name: 'Stir-Fry', desc: 'Wok-fired vegetables and protein. Speed cooking.' },
    { name: 'Risotto', desc: 'Arborio rice, constant stirring. Patience challenge.' },
    { name: 'BBQ Ribs', desc: 'Slow-cooked, sauce-glazed. Time-intensive but impressive.' },
    { name: 'Fish Tacos', desc: 'Grilled fish, slaw, lime crema. Fresh and fast.' },
    { name: 'Pad Thai', desc: 'Rice noodles, tamarind sauce, peanuts. Balance of flavors.' },
    { name: 'Roast Chicken', desc: 'Whole bird, roasted vegetables. Simple but the host judges harshly.' },
    { name: 'Lasagna', desc: 'Layered pasta, meat sauce, béchamel. Architecture matters.' },
    { name: 'Surf & Turf', desc: 'Steak and lobster tail. Luxury dish, two things to cook perfectly.' },
    { name: 'Curry', desc: 'Spiced stew with rice. Flavor depth is the test.' },
    { name: 'Pork Tenderloin', desc: 'Herb-rubbed, pan-seared, oven-finished. Resting time matters.' },
  ];
  const DESSERT_POOL = [
    { name: 'Crème Brûlée', desc: 'Custard with caramelized sugar top. Torch required — fire risk.' },
    { name: 'Chocolate Lava Cake', desc: 'Molten center, timing critical. 30 seconds too long = solid disappointment.' },
    { name: 'Flambé Bananas Foster', desc: 'Bananas in rum sauce, lit on fire. Could explode.' },
    { name: 'Tiramisu', desc: 'Layers of mascarpone, espresso-soaked ladyfingers. No-bake but complex.' },
    { name: 'Apple Pie', desc: 'Classic. Lattice crust separates amateurs from pros.' },
    { name: 'Cheesecake', desc: 'New York style. Dense, creamy, needs time to set.' },
    { name: 'Panna Cotta', desc: 'Italian custard with berry coulis. Wobble factor — did it set?' },
    { name: 'Soufflé', desc: 'Risen egg dish. Collapses if you look at it wrong. Highest variance dessert.' },
    { name: 'Tarte Tatin', desc: 'Upside-down apple tart. The flip is the moment of truth.' },
    { name: 'Profiteroles', desc: 'Choux pastry puffs with chocolate. Assembly line work.' },
    { name: 'Macarons', desc: 'French almond cookies. Notoriously difficult. Bragging rights if pulled off.' },
    { name: 'Brownies', desc: 'Easy to make, hard to make special. The host expects more.' },
    { name: 'Fruit Tart', desc: 'Pastry cream, fresh fruit, glaze. Presentation is 80% of the score.' },
    { name: 'Baked Alaska', desc: 'Ice cream inside meringue, torched. Another fire risk.' },
    { name: 'Churros', desc: 'Fried dough, chocolate sauce. Fun but is it "fine dining"?' },
    { name: 'Éclairs', desc: 'Choux pastry, cream filled, chocolate topped. Piping technique matters.' },
  ];

  // ── HOST REACTION POOLS ──
  const HOST_REACTIONS = {
    disaster: [
      `${host} takes one bite and immediately spits it into a napkin.`,
      `${host} stares at the plate for a long time. Then pushes it away without a word.`,
      `${host} gags. Actually gags. The kitchen goes silent.`,
      `"What... is this?" ${host} asks. Nobody answers.`,
      `${host} takes the plate and dumps it directly in the trash.`,
    ],
    bad: [
      `${host} grimaces. "I've had better from a vending machine."`,
      `${host} finishes the bite but clearly wishes they hadn't.`,
      `"It's... food. Technically," ${host} says.`,
      `${host} takes two bites and sets down the fork. That's all they need.`,
    ],
    mediocre: [
      `${host} shrugs. "It's fine. Just... fine."`,
      `"Not bad, not great. Middle of the road," ${host} says.`,
      `${host} eats it without complaint, which might be the worst review of all.`,
      `"I've had worse. I've also had much better."`,
    ],
    good: [
      `${host} nods approvingly. "Now you're cooking."`,
      `"Okay, I see you," ${host} says with a half-smile.`,
      `${host} finishes the entire plate. That says everything.`,
      `"This is solid. Real solid," ${host} says, reaching for more.`,
    ],
    excellent: [
      `${host} stops mid-bite. Closes their eyes. "Yeah. That's the one."`,
      `"Where has THIS been all season?" ${host} says.`,
      `${host} actually applauds. The tribe doesn't know how to react.`,
    ],
    chefsKiss: [
      `${host} stands up. Slow clap. "That is restaurant-quality."`,
      `"I would pay money for this," ${host} says. Nobody has ever heard that before.`,
      `${host} kisses their fingers. Chef's kiss. The tribe erupts.`,
    ],
  };

  // 1. HEAD CHEF SELECTION (leadership formula)
  // 2. COURSE ASSIGNMENT (chef assigns pairs)
  // 3. PER-COURSE COOKING LOOP (appetizer → main → dessert)
  //    a. Events fire during cooking (4-7 per course)
  //    b. Course score calculated from pair stats + bond + chef bonus + event modifiers
  //    c. Score mapped to 1-10 host rating
  // 4. WINNER DETERMINATION (highest total across 3 courses)
  // 5. PERSONAL SCORING → chalMemberScores
  // 6. CAMP EVENTS (2 pos + 1-2 neg per tribe)
  // 7. HEAT INTEGRATION (gs._cookingHeat)
  // 8. STORE ep.hellsKitchen data

  // ── Full implementation of all mechanics from spec ──
  // Key patterns:
  // - players.find(p => p.name === name)?.archetype for archetype
  // - pronouns(name).posAdj before nouns
  // - ALL proportional — no thresholds for gameplay
  // - Camp events MUST have players: [] array
  // - _challengeRomanceSpark for food fight flirt
  // - _checkShowmanceChalMoment for protective instinct
  // - seasonConfig.romance guard on romance checks
  // - updateChalRecord(ep) at the end
  // - Pre-render all text as strings
  // - Timeline: interleave events and course results, shuffle at sim time, store in timeline array
  // - FF chains (sabotage → caught → reaction) stay in order (same pattern as paintball)

  // ... FULL IMPLEMENTATION HERE ...
  // The subagent implementing this task should write the complete function
  // following all patterns from existing challenges (especially simulatePaintballHunt).
  // The spec at docs/superpowers/specs/2026-04-11-hells-kitchen-design.md has every detail.
}
```

**Key implementation details the subagent MUST follow:**

- **Chef selection:** `leadershipScore = strategic * 0.04 + social * 0.03 + boldness * 0.03 + random(0, 0.15)`. Highest per tribe becomes chef.
- **Chef style:** Derived from `players.find(p => p.name === name)?.archetype`. Map: villain/schemer → 'tyrant', hero/loyal-soldier → 'motivator', mastermind → 'delegator', social-butterfly/showmancer → 'hype', chaos-agent/hothead → 'chaos', wildcard → 'improviser', default → 'standard'.
- **Pair assignment:** Chef assigns 2 players per course. Mental+intuition for appetizer/dessert, physical+endurance for main. Tyrant assigns enemies to hardest course. Delegator optimizes.
- **Course score formula:** `baseCookScore = (cookA.intuition * 0.04 + cookB.mental * 0.04 + (cookA.social + cookB.social) * 0.01 + random(0, 0.2))` plus chef bonus, bond modifier, event modifiers.
- **Score → rating:** < 0.20 → 1-2, 0.20-0.35 → 3-4, 0.35-0.50 → 5-6, 0.50-0.65 → 7-8, 0.65-0.80 → 9, > 0.80 → 10.
- **Events:** 4-7 per course. Each event has deep consequences (bond changes, heat, romance triggers, score modifiers). All events must have `players: []` array and `badgeText`/`badgeClass`.
- **~45 event types** as defined in the spec. Each needs 3-5 text variants.
- **Timeline:** Build interleaved timeline of events + course results at sim time. Shuffle non-chain items. Keep sabotage chains in order. Store in `ep.hellsKitchen.timeline`.
- **Winner:** Highest total host rating. Tiebreak: dessert. MVP: highest personal score on winning team.
- **ep.winner/ep.loser** must be tribe OBJECTS (not strings). Filter tribalPlayers by gs.activePlayers.
- **ep.safeTribes** for 3+ tribes.

- [ ] **Step 2: Add heat integration**

In computeHeat after paintball heat line:
```javascript
  if (gs._cookingHeat?.[name] && ((gs.episode || 0) + 1) < gs._cookingHeat[name].expiresEp) heat += gs._cookingHeat[name].amount;
```

- [ ] **Step 3: Add heat clearing**

After paintball heat clearing block:
```javascript
    if (gs._cookingHeat) {
      Object.keys(gs._cookingHeat).forEach(k => {
        if (((gs.episode || 0) + 1) >= gs._cookingHeat[k].expiresEp) delete gs._cookingHeat[k];
      });
      if (!Object.keys(gs._cookingHeat).length) delete gs._cookingHeat;
    }
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: simulateHellsKitchen — 3-course cooking with 45+ event types"
```

---

### Task 3: Episode History + patchEpisodeHistory + Badges

**Files:**
- Modify: `simulator.html` — history push, patch, badge chains

- [ ] **Step 1: Add to episode history push**

After paintball fields:
```javascript
    isHellsKitchen:     ep.isHellsKitchen     || false,
    hellsKitchen:       ep.hellsKitchen        || null,
```

- [ ] **Step 2: Add to patchEpisodeHistory**

After paintball patch:
```javascript
  if (ep.isHellsKitchen) h.isHellsKitchen = true;
  if (!h.hellsKitchen && ep.hellsKitchen) h.hellsKitchen = ep.hellsKitchen;
```

- [ ] **Step 3: Add badge text entries**

All Hell's Kitchen event types. The exact type names will match what the subagent used in Task 2. Expected types include:
`hkFlambe`, `hkFoodGobbler`, `hkIngredientDrop`, `hkKitchenFire`, `hkAllergicReaction`, `hkKnifeSlip`, `hkSpillDisaster`, `hkOvenMalfunction`, `hkRawFoodScare`, `hkWrongRecipe`, `hkTyrantChef`, `hkChefRebellion`, `hkChefMeltdown`, `hkMotivationalChef`, `hkChefFavorites`, `hkMicromanager`, `hkChefDelegation`, `hkQuietLeader`, `hkChefEgo`, `hkChefShowdown`, `hkFoodFight`, `hkTasteWar`, `hkChoppingComp`, `hkDishStealing`, `hkComfortCooking`, `hkTooManyCooks`, `hkPresentationDisaster`, `hkCopycatAccusation`, `hkPerfectPairing`, `hkNaturalTalent`, `hkPlatingArtist`, `hkTeamRally`, `hkTasteTesterHero`, `hkSousChefClutch`, `hkCrowdPleaser`, `hkKitchenDance`, `hkMentorMoment`, `hkSecretRecipe`, `hkGarnishSave`, `hkEfficientPrep`, `hkEncouragement`, `hkFlavorBreakthrough`, `hkUnderdogCook`, `hkTeamworkMontage`, `hkCleanStation`, `hkIngredientTheft`, `hkSpiceBomb`, `hkDistractionPlay`, `hkKitchenSpy`, `hkTrashTalk`, `hkCookingSpark`, `hkFoodFightFlirt`, `hkProtectiveInstinct`, `hkMVPChef`, `hkSousChefHero`, `hkUnderdogHero`, `hkKitchenCouple`, `hkDisasterCulprit`, `hkFridgeLock`, `hkSaboteurExposed`, `hkGobbleShame`, `hkTyrantBacklash`, `hkCourseResult`

- [ ] **Step 4: Add badge class entries**

Gold for positive (talent, clutch, MVP, etc.), red for negative (disaster, sabotage, gobbler), empty for neutral.

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: Hell's Kitchen episode history, patchEpisodeHistory, 55+ badge types"
```

---

### Task 4: VP Screen — `rpBuildHellsKitchen(ep)` (Overdrive)

**Files:**
- Modify: `simulator.html` — add function before rpBuildSuckyOutdoors, register in buildVPScreens

- [ ] **Step 1: Add CSS keyframes**

In the `<style>` block after paintball keyframes:
```css
@keyframes flamePulse {
  0%, 100% { text-shadow: 0 0 10px rgba(255,100,0,0.3); }
  50% { text-shadow: 0 0 20px rgba(255,100,0,0.6), 0 0 40px rgba(255,50,0,0.2); }
}
@keyframes steamRise {
  0% { opacity: 0.6; transform: translateY(0) scaleX(1); }
  100% { opacity: 0; transform: translateY(-30px) scaleX(1.5); }
}
@keyframes scoreReveal {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes plateSlide {
  0% { transform: translateX(-30px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
```

- [ ] **Step 2: Add the VP function**

`rpBuildHellsKitchen(ep)` — follows same patterns as `rpBuildPaintballHunt(ep)`:
- `_tvState[stateKey]` with `idx: -1` for click-to-reveal
- Save/restore scrollTop on reveal clicks
- Use `pb-sm` portrait class for compact layouts
- Use `ep.hellsKitchen.timeline` for step rendering (stable, no re-shuffle)

**Page structure:**
1. Header — "HELL'S KITCHEN" with `flamePulse`, warm orange/red theme
2. Chef selection cards per tribe (portrait, apron emoji, style text)
3. Course assignment grid
4. Timeline (click-to-reveal): interleaved events + course result cards
5. Final scoreboard (side-by-side totals)
6. MVP spotlight card

**Course result cards:**
- Dish name + description
- Cook pair portraits
- `plateSlide` animation
- Steam effect div
- Score number with `scoreReveal` animation
- Host reaction text
- Score color: green (7+), yellow (4-6), red (1-3)

**Event cards:**
- Color-coded borders (green=positive, red=disaster, orange=drama, purple=sabotage, pink=romance)
- Player portraits
- Event text with emoji

- [ ] **Step 3: Register in buildVPScreens**

After paintball-hunt registration:
```javascript
  } else if (ep.isHellsKitchen && ep.hellsKitchen) {
    vpScreens.push({ id:'hells-kitchen', label:"Hell's Kitchen", html: rpBuildHellsKitchen(ep) });
```

- [ ] **Step 4: Exclude from generic twist screen**

Add `&& t.type !== 'hells-kitchen'` to rpBuildPreTwist filter.

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: Hell's Kitchen VP overdrive — cooking show aesthetics, score reveals"
```

---

### Task 5: Text Backlog + Cold Open + Timeline Tag + Debug

**Files:**
- Modify: `simulator.html` — multiple locations

- [ ] **Step 1: Add text backlog**

After `_textPaintballHunt`:
```javascript
function _textHellsKitchen(ep, ln, sec) {
  if (!ep.isHellsKitchen || !ep.hellsKitchen) return;
  const hk = ep.hellsKitchen;
  sec("HELL'S KITCHEN");
  ln('Three-course cooking challenge. Host judges each course 1-10.');
  // Chef selection
  Object.entries(hk.chefs || {}).forEach(([tribe, chef]) => {
    ln(`${tribe} head chef: ${chef.name} (${chef.style})`);
  });
  // Course assignments + scores
  ['appetizer', 'main', 'dessert'].forEach(course => {
    ln('');
    ln(`── ${course.toUpperCase()} ──`);
    Object.entries(hk.assignments || {}).forEach(([tribe, assignments]) => {
      const pair = assignments[course];
      const dish = hk.dishes?.[tribe]?.[course] || '?';
      const score = hk.courseScores?.[tribe]?.[course];
      ln(`  ${tribe}: ${pair?.join(' & ') || '?'} — ${dish} → ${score?.rating || '?'}/10`);
    });
  });
  // Events
  (hk.events || []).forEach(evt => {
    ln(`  [${evt.badge || evt.badgeText || evt.type}] ${evt.text}`);
  });
  ln(`Winner: ${hk.winner}. ${hk.loser} goes to tribal.`);
  if (hk.mvp) ln(`MVP: ${hk.mvp}`);
}
```

Wire into generateSummaryText after `_textPaintballHunt`:
```javascript
  _textHellsKitchen(ep, ln, sec);
```

- [ ] **Step 2: Add cold open recap**

After paintball hunt cold open:
```javascript
    if (prevEp.isHellsKitchen && prevEp.hellsKitchen) {
      const _hk = prevEp.hellsKitchen;
      const _hkTotal = tribe => ['appetizer','main','dessert'].reduce((s,c) => s + (_hk.courseScores?.[tribe]?.[c]?.rating || 0), 0);
      html += `<div class="vp-card" style="border-color:rgba(249,115,22,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f97316;margin-bottom:4px">HELL'S KITCHEN</div>
        <div style="font-size:12px;color:#8b949e">${_hk.winner} won ${_hkTotal(_hk.winner)}-${_hkTotal(_hk.loser)}.${_hk.mvp ? ` MVP: ${_hk.mvp}.` : ''}${_hk.fridgeLock ? ` ${_hk.fridgeLock.victim} was locked in the fridge!` : ''}</div>
      </div>`;
    }
```

- [ ] **Step 3: Add timeline tag**

After paintball tag:
```javascript
    const hkTag = ep.isHellsKitchen ? `<span class="ep-hist-tag" style="background:rgba(249,115,22,0.15);color:#f97316">Hell's Kitchen</span>` : '';
```

Add `${hkTag}` to tag rendering.

- [ ] **Step 4: Add debug breakdown**

In debug challenge tab after paintball breakdown:
```javascript
    if (ep.hellsKitchen) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#f97316;margin:16px 0 8px">Hell's Kitchen — Summary</div>`;
      const hk = ep.hellsKitchen;
      // Chef info
      Object.entries(hk.chefs || {}).forEach(([tribe, chef]) => {
        const tc = tribeColor(tribe);
        html += `<div style="font-size:10px;color:${tc};font-weight:700;margin-top:4px">${tribe} Chef: ${chef.name} (${chef.style})</div>`;
      });
      // Course scores
      ['appetizer', 'main', 'dessert'].forEach(course => {
        html += `<div style="font-size:10px;font-weight:700;color:#8b949e;margin-top:6px">${course.toUpperCase()}</div>`;
        Object.entries(hk.courseScores || {}).forEach(([tribe, scores]) => {
          const s = scores[course];
          const col = (s?.rating || 0) >= 7 ? '#3fb950' : (s?.rating || 0) >= 4 ? '#f0a500' : '#f85149';
          html += `<div style="font-size:9px;color:${col}">${tribe}: ${hk.dishes?.[tribe]?.[course] || '?'} → ${s?.rating || '?'}/10 (raw: ${(s?.raw || 0).toFixed(3)})</div>`;
        });
      });
      // Events
      (hk.events || []).forEach(evt => {
        html += `<div style="font-size:9px;color:#484f58">[${evt.badge||evt.badgeText||evt.type}] ${(evt.text||'').substring(0,80)}</div>`;
      });
      html += `<div style="font-size:9px;color:#8b949e;margin-top:4px">Winner: ${hk.winner} | Loser: ${hk.loser}${hk.mvp ? ' | MVP: ' + hk.mvp : ''}</div>`;
    }
```

- [ ] **Step 5: Add `isHellsKitchen` to challenge tab button condition and `_chalType`**

Add `|| ep.isHellsKitchen` to button condition.
Add `ep.isHellsKitchen ? "Hell's Kitchen" :` to `_chalType`.

- [ ] **Step 6: Commit**

```bash
git add simulator.html
git commit -m "feat: Hell's Kitchen text backlog, cold open, timeline tag, debug breakdown"
```

---

### Task 6: CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add to challenge table**

After paintball-hunt row:
```
| `hells-kitchen` | Hell's Kitchen | 3-course cooking, head chef, kitchen chaos, sabotage, food fights | Cooking show + score reveals |
```

- [ ] **Step 2: Add to heat list**

Add `gs._cookingHeat` to the temporary heat line.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add Hell's Kitchen to CLAUDE.md"
```

---

## Self-Review

**Spec coverage check:**
- Chef selection (leadership formula) → Task 2
- Chef style from archetype → Task 2
- Course assignment (pair stats) → Task 2
- Course scoring formula → Task 2
- Score → host rating mapping → Task 2
- Dish pools (45+ dishes) → Task 2
- Host reaction text pools → Task 2
- ~45 event types with deep consequences → Task 2
- Event text variety (3-5 per type) → Task 2
- Timeline interleaving (stable, sim-time) → Task 2
- Winner determination + tiebreak → Task 2
- Personal scoring → Task 2
- Camp events → Task 2
- Heat integration → Task 2
- VP overdrive with animations → Task 4
- Episode history + badges → Task 3
- Text backlog → Task 5
- Cold open recap → Task 5
- Timeline tag → Task 5
- Debug tab → Task 5
- CLAUDE.md → Task 6
- TWIST_CATALOG + applyTwist → Task 1

**No gaps found.** All spec sections covered.
