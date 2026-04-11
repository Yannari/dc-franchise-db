# Up the Creek Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a schedulable pre-merge canoe race challenge with self-selected partners, 4 racing phases, portage encounters, fire-building competition, and paddle-burning mechanic.

**Architecture:** New `simulateUpTheCreek(ep)` handles partner selection, 4 phases, personal scoring, fire methods, and paddle consequence. VP screen `rpBuildUpTheCreek(ep)` has partner selection reveal + per-phase click-to-reveal with water/jungle/fire/sunset ambiance. Text backlog via `_textUpTheCreek(ep, ln, sec)`.

**Tech Stack:** Pure JS in `simulator.html`. No external dependencies.

---

### Task 1: TWIST_CATALOG + applyTwist + Episode Branch

**Files:**
- Modify: `simulator.html` — TWIST_CATALOG, applyTwist, simulateEpisode, updateChalRecord skip

- [ ] **Step 1: Add catalog entry**

After the sucky-outdoors entry, add:

```javascript
  { id:'up-the-creek', emoji:'🛶', name:'Up the Creek', category:'challenge', phase:'pre-merge', desc:'Canoe race to Boney Island and back. Pick your partner. Portage through danger. Build a fire. Race home. Partner chemistry matters.', engineType:'up-the-creek', minTribes:2, incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors'] },
```

Add `'up-the-creek'` to ALL other challenge twists' incompatible arrays (10 existing).

- [ ] **Step 2: Add applyTwist flag**

After `ep.isSuckyOutdoors = true;` block:

```javascript

  } else if (engineType === 'up-the-creek') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isUpTheCreek = true;
```

- [ ] **Step 3: Add episode branch**

After sucky outdoors branch:

```javascript
  } else if (ep.isUpTheCreek && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateUpTheCreek(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateUpTheCreek
```

- [ ] **Step 4: Add to updateChalRecord skip**

Add `&& !ep.isUpTheCreek` to the skip condition.

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: add Up the Creek to TWIST_CATALOG + applyTwist + episode branch"
```

---

### Task 2: Core Simulation — `simulateUpTheCreek(ep)`

**Files:**
- Modify: `simulator.html` — add function after `simulateSuckyOutdoors` ends (before `// ENGINE: PHOBIA FACTOR` at line ~10794)

This is the big task. Read the full spec at `docs/superpowers/specs/2026-04-11-up-the-creek-design.md`.

- [ ] **Step 1: Add the simulation function**

The function must implement:

**Phase 0 — Partner Selection:**
- Each tribe: sort members by boldness descending (boldest picks first)
- Each picker selects their highest `bond * 0.5 + (physical + endurance) * 0.1` tribemate from remaining unpicked
- Track scenarios: mutual, one-sided, rejected, last pick, showmance, rivals forced
- Pre-render reaction text (3-5 templates per scenario from the spec)
- Store: `canoePairs[tribeName] = [{ a, b, scenario, chemistry }]`, `soloCanoe[tribeName] = name || null`
- Bond/score consequences per scenario

**Phase 1 — Paddle to Boney Island (3-4 events per tribe):**
- Pair paddle speed: `bond * 0.15 + avg(physical + endurance) * 0.25 + random(0, 1.5)`
- Bond >= 2: +0.5 bonus. Bond <= -1: -0.5 penalty
- Solo canoe: `physical * 0.3 + endurance * 0.25`
- Events: fast pair, slow pair, argument, bonding, capsized, wildlife, solo struggle/impress, race between pairs
- Personal scores + bond changes per event

**Phase 2 — Portage (3-5 encounters per tribe):**
- All tribe together. Draw 3-5 random from 15-type pool
- Each encounter: stat-proportional check, personal scores, bond changes
- Track: injuries (for carrying events), wanderers

**Phase 3 — Build Fire:**
- Base fire score per tribe from best builder
- Bonus methods: lighter (villain/schemer/wildcard), homemade starter (chaos/wildcard, 50/50 risk), paddle burn (+fire but paddles gone), traditional, advice to enemy
- Fire winner gets +3.0 bonus for Phase 4
- Track `paddlesBurned[tribeName] = true` for Phase 4

**Phase 4 — Paddle Back (3-5 events per tribe):**
- Race score from pair speeds (same as Phase 1) + fire winner bonus
- If paddles burned: swimmer hero mechanic (`physical * 0.06 + endurance * 0.05`)
- 3-5 events from 13-type pool
- Total tribe score = sum of all 4 phases

**Winner/Loser:** Highest total wins. Tiebreaker: fire winner, then portage.

**Store:**
```javascript
ep.upTheCreek = {
  canoePairs, soloCanoe, phases: { partnerSelection, paddleOut, portage, buildFire, paddleBack },
  fireScores, paddlesBurned, swimmerHero, winner: winnerName, loser: loserName
};
ep.winner = winner; ep.loser = loser;
ep.challengeType = 'tribe';
ep.tribalPlayers = [...loser.members];
ep.challengeLabel = 'Up the Creek';
ep.challengeCategory = 'physical';
ep.chalMemberScores = personalScores;
updateChalRecord(ep);
```

**Camp events:** 2 positive + 1-2 negative per tribe.
**Heat:** Use `gs._upTheCreekHeat` for advice givers and canoe droppers.

**CRITICAL patterns:**
- `players.find(p => p.name === name)?.archetype` for archetype
- `pronouns(name).posAdj` before nouns
- All stat checks proportional — no thresholds
- Block nice archetypes from villain-only events
- Pre-render all text as strings
- 2-tribe bonus events (same `_bonusEvents` pattern as Sucky Outdoors)

- [ ] **Step 2: Add heat integration**

In computeHeat after sucky outdoors heat:
```javascript
  if (gs._upTheCreekHeat?.[name] && ((gs.episode || 0) + 1) < gs._upTheCreekHeat[name].expiresEp) heat += gs._upTheCreekHeat[name].amount;
```

- [ ] **Step 3: Add heat clearing**

After sucky outdoors heat clearing:
```javascript
    if (gs._upTheCreekHeat) {
      Object.keys(gs._upTheCreekHeat).forEach(k => {
        if (((gs.episode || 0) + 1) >= gs._upTheCreekHeat[k].expiresEp) delete gs._upTheCreekHeat[k];
      });
      if (!Object.keys(gs._upTheCreekHeat).length) delete gs._upTheCreekHeat;
    }
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: simulateUpTheCreek — 4-phase canoe race with partner selection + fire building"
```

---

### Task 3: Episode History + patchEpisodeHistory + Badges

**Files:**
- Modify: `simulator.html` — history push, patch, badge chains

- [ ] **Step 1: Add to episode history push**

After sucky outdoors fields:
```javascript
    isUpTheCreek:       ep.isUpTheCreek       || false,
    upTheCreek:         ep.upTheCreek         || null,
```

- [ ] **Step 2: Add to patchEpisodeHistory**

After sucky outdoors patch:
```javascript
  if (ep.isUpTheCreek) h.isUpTheCreek = true;
  if (!h.upTheCreek && ep.upTheCreek) h.upTheCreek = ep.upTheCreek;
```

- [ ] **Step 3: Add badge text entries**

After sucky outdoors badges, add all Up the Creek event types:
```javascript
                     : evt.type === 'utcPartnerPick'       ? (evt.badgeText || evt.badge || 'PARTNER PICK')
                     : evt.type === 'utcRejected'          ? (evt.badgeText || evt.badge || 'REJECTED')
                     : evt.type === 'utcSoloPaddler'       ? (evt.badgeText || evt.badge || 'SOLO CANOE')
                     : evt.type === 'utcFastPair'          ? (evt.badgeText || evt.badge || 'FAST PAIR')
                     : evt.type === 'utcSlowPair'          ? (evt.badgeText || evt.badge || 'SLOW PAIR')
                     : evt.type === 'utcCapsized'          ? (evt.badgeText || evt.badge || 'CAPSIZED')
                     : evt.type === 'utcWildlife'          ? (evt.badgeText || evt.badge || 'WILDLIFE')
                     : evt.type === 'utcQuicksand'         ? (evt.badgeText || evt.badge || 'QUICKSAND')
                     : evt.type === 'utcInjury'            ? (evt.badgeText || evt.badge || 'INJURY')
                     : evt.type === 'utcShortcut'          ? (evt.badgeText || evt.badge || 'SHORTCUT')
                     : evt.type === 'utcDroppedCanoe'      ? (evt.badgeText || evt.badge || 'DROPPED')
                     : evt.type === 'utcLighter'           ? (evt.badgeText || evt.badge || 'LIGHTER')
                     : evt.type === 'utcFireStarter'       ? (evt.badgeText || evt.badge || 'FIRE STARTER')
                     : evt.type === 'utcPaddleBurn'        ? (evt.badgeText || evt.badge || 'PADDLES BURNED')
                     : evt.type === 'utcAdviceGiver'       ? (evt.badgeText || evt.badge || 'HELPED THE ENEMY')
                     : evt.type === 'utcSwimmerHero'       ? (evt.badgeText || evt.badge || 'SWIMMER HERO')
                     : evt.type === 'utcSprintFinish'      ? (evt.badgeText || evt.badge || 'SPRINT FINISH')
                     : evt.type === 'utcPhotoFinish'       ? (evt.badgeText || evt.badge || 'PHOTO FINISH')
                     : evt.type === 'utcCheating'          ? (evt.badgeText || evt.badge || 'CHEATING')
                     : evt.type === 'utcMotivational'      ? (evt.badgeText || evt.badge || 'RALLY CRY')
```

- [ ] **Step 4: Add badge class entries**

```javascript
                     : evt.type === 'utcPartnerPick' || evt.type === 'utcFastPair' || evt.type === 'utcShortcut' || evt.type === 'utcLighter' || evt.type === 'utcFireStarter' || evt.type === 'utcSwimmerHero' || evt.type === 'utcSprintFinish' || evt.type === 'utcMotivational' || evt.type === 'utcSoloPaddler' ? 'gold'
                     : evt.type === 'utcRejected' || evt.type === 'utcSlowPair' || evt.type === 'utcCapsized' || evt.type === 'utcDroppedCanoe' || evt.type === 'utcPaddleBurn' || evt.type === 'utcAdviceGiver' || evt.type === 'utcCheating' || evt.type === 'utcInjury' ? 'red'
                     : evt.type === 'utcWildlife' || evt.type === 'utcQuicksand' || evt.type === 'utcPhotoFinish' ? ''
```

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: up the creek episode history, patchEpisodeHistory, badges"
```

---

### Task 4: VP Screen — `rpBuildUpTheCreek(ep)`

**Files:**
- Modify: `simulator.html` — add function before rpBuildDodgebrawl, register in buildVPScreens

- [ ] **Step 1: Add the VP function**

Place before `rpBuildSuckyOutdoors` or `rpBuildDodgebrawl`.

**Structure:** 5 reveals total (partner selection + 4 phases).

**Reveal 0 — Partner Selection:**
- Click-to-reveal each pair forming within each tribe
- Tribe headers with color
- Each pair: Portrait A → Portrait B with scenario badge + reaction text
- Solo canoe: dramatic solo card
- Showmance: heart badge

**Ambiance per phase:**
- Partner Selection: Dock morning — `linear-gradient(180deg, #0a1a2a 0%, #051525 100%)`, accent `#58a6ff`
- Phase 1 (Paddle Out): Water blue — same bg, accent `#58a6ff`
- Phase 2 (Portage): Jungle green — `linear-gradient(180deg, #0a2a0a 0%, #051a05 100%)`, accent `#3fb950`
- Phase 3 (Build Fire): Amber — `linear-gradient(180deg, #2a1a0a 0%, #1a0f05 100%)`, accent `#f0a500`
- Phase 4 (Paddle Back): Sunset — `linear-gradient(180deg, #2a1508 0%, #1a0c04 100%)`, accent `#e06030`

**Events grouped by tribe** (same pattern as Sucky Outdoors).

**Fire phase:** Show fire scores per tribe with bar + bonus method badge.

**Paddle burned:** Dramatic card showing paddles in flames + swimmer hero moment if applicable.

**Final:** Winner card + race scores.

- [ ] **Step 2: Register in buildVPScreens**

After sucky outdoors:
```javascript
  } else if (ep.isUpTheCreek && ep.upTheCreek) {
    vpScreens.push({ id:'up-the-creek', label:'Up the Creek', html: rpBuildUpTheCreek(ep) });
```

- [ ] **Step 3: Exclude from generic twist screen**

Add `&& t.type !== 'up-the-creek'` to rpBuildPreTwist filter.

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: up the creek VP screen — partner selection + 4-phase canoe race"
```

---

### Task 5: Text Backlog + Cold Open + Timeline Tag + Debug

**Files:**
- Modify: `simulator.html` — multiple locations

- [ ] **Step 1: Add text backlog**

After `_textSuckyOutdoors`, add:

```javascript
function _textUpTheCreek(ep, ln, sec) {
  if (!ep.isUpTheCreek || !ep.upTheCreek) return;
  const utc = ep.upTheCreek;
  sec('UP THE CREEK');
  ln('Canoe race to Boney Island and back.');
  // Partner selection
  if (utc.canoePairs) {
    Object.entries(utc.canoePairs).forEach(([tribe, pairs]) => {
      ln(`${tribe} canoe pairs:`);
      pairs.forEach(p => ln(`  ${p.a} + ${p.b} (${p.scenario})`));
      if (utc.soloCanoe?.[tribe]) ln(`  ${utc.soloCanoe[tribe]} — solo canoe`);
    });
  }
  ['partnerSelection', 'paddleOut', 'portage', 'buildFire', 'paddleBack'].forEach(phase => {
    const events = utc.phases?.[phase] || [];
    if (!events.length) return;
    const labels = { partnerSelection: 'PARTNERS', paddleOut: 'PADDLE OUT', portage: 'PORTAGE', buildFire: 'BUILD FIRE', paddleBack: 'PADDLE BACK' };
    ln('');
    ln(`── ${labels[phase] || phase} ──`);
    events.forEach(evt => {
      const scores = Object.entries(evt.personalScores || {}).map(([n, d]) => `${n}:${d > 0 ? '+' : ''}${d.toFixed(1)}`).join(', ');
      ln(`  [${evt.badge || evt.type}] ${evt.text}${scores ? ` (${scores})` : ''}`);
    });
  });
  if (utc.paddlesBurned) Object.entries(utc.paddlesBurned).forEach(([t, burned]) => { if (burned) ln(`${t}: PADDLES BURNED`); });
  if (utc.swimmerHero) ln(`SWIMMER HERO: ${utc.swimmerHero}`);
  ln(`Winner: ${utc.winner}. ${utc.loser} goes to tribal.`);
}
```

Wire into generateSummaryText after `_textSuckyOutdoors`:
```javascript
  _textUpTheCreek(ep, ln, sec);
```

- [ ] **Step 2: Add cold open recap**

After sucky outdoors cold open:
```javascript
    if (prevEp.isUpTheCreek && prevEp.upTheCreek) {
      const _utc = prevEp.upTheCreek;
      html += `<div class="vp-card" style="border-color:rgba(88,166,255,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#58a6ff;margin-bottom:4px">UP THE CREEK</div>
        <div style="font-size:12px;color:#8b949e">${_utc.winner} won the canoe race.${_utc.swimmerHero ? ` ${_utc.swimmerHero} swam the tribe home.` : ''}${Object.values(_utc.paddlesBurned || {}).some(v => v) ? ' Someone burned the paddles.' : ''}</div>
      </div>`;
    }
```

- [ ] **Step 3: Add timeline tag**

After `soTag`:
```javascript
    const utcTag = ep.isUpTheCreek ? `<span class="ep-hist-tag" style="background:rgba(88,166,255,0.15);color:#58a6ff">Up the Creek</span>` : '';
```

Add `${utcTag}` to the tag rendering line.

- [ ] **Step 4: Add debug breakdown**

In debug challenge tab after sucky outdoors breakdown:
```javascript
    if (ep.upTheCreek?.phases) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#f0883e;margin:16px 0 8px">Up the Creek — Phase Summary</div>`;
      const utc = ep.upTheCreek;
      if (utc.canoePairs) {
        Object.entries(utc.canoePairs).forEach(([tribe, pairs]) => {
          const tc = tribeColor(tribe);
          html += `<div style="font-size:10px;font-weight:700;color:${tc};margin-top:6px">${tribe} Pairs</div>`;
          pairs.forEach(p => html += `<div style="font-size:9px;color:#6e7681">${p.a} + ${p.b} (${p.scenario}, chemistry: ${(p.chemistry||0).toFixed(1)})</div>`);
          if (utc.soloCanoe?.[tribe]) html += `<div style="font-size:9px;color:#f85149">${utc.soloCanoe[tribe]} — solo</div>`;
        });
      }
      ['paddleOut', 'portage', 'buildFire', 'paddleBack'].forEach(phase => {
        const events = utc.phases?.[phase] || [];
        const labels = { paddleOut: 'Paddle Out', portage: 'Portage', buildFire: 'Build Fire', paddleBack: 'Paddle Back' };
        html += `<div style="font-size:10px;font-weight:700;color:#8b949e;margin-top:6px">${labels[phase]} (${events.length} events)</div>`;
        events.forEach(evt => {
          const scores = Object.entries(evt.personalScores || {}).map(([n, d]) => `${n}:${d > 0 ? '+' : ''}${d.toFixed(1)}`).join(', ');
          html += `<div style="font-size:9px;padding:1px 0;color:#6e7681">[${evt.badge || evt.type}] ${evt.text.substring(0, 80)}${evt.text.length > 80 ? '...' : ''}${scores ? ` <span style="color:#8b949e">(${scores})</span>` : ''}</div>`;
        });
      });
      if (utc.fireScores) {
        html += `<div style="font-size:10px;font-weight:700;color:#8b949e;margin-top:6px">Fire Scores</div>`;
        Object.entries(utc.fireScores).forEach(([tribe, score]) => {
          const tc = tribeColor(tribe);
          html += `<div style="font-size:9px;color:${tc}">${tribe}: ${score.toFixed(1)}${utc.paddlesBurned?.[tribe] ? ' (PADDLES BURNED)' : ''}</div>`;
        });
      }
    }
```

- [ ] **Step 5: Add `isUpTheCreek` to challenge tab button condition and `_chalType`**

Add `|| ep.isUpTheCreek` to button condition. Add `ep.isUpTheCreek ? 'Up the Creek' :` to `_chalType`.

- [ ] **Step 6: Commit**

```bash
git add simulator.html
git commit -m "feat: up the creek text backlog, cold open, timeline tag, debug breakdown"
```

---

### Task 6: CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add to Key Engine Functions**

After `simulateSuckyOutdoors`:
```
- `simulateUpTheCreek(ep)` — canoe race challenge (pre-merge, 4 phases, partner selection)
```

- [ ] **Step 2: Add to Core State**

After `gs._suckyOutdoorsHeat`:
```
- `gs._upTheCreekHeat` — temporary heat from up the creek (advice givers, canoe droppers)
```

- [ ] **Step 3: Add section**

After Sucky Outdoors section:
```markdown
## Up the Creek
- Schedulable pre-merge challenge (`up-the-creek` in TWIST_CATALOG, category `challenge`)
- 4-phase canoe race: paddle out, portage (15 encounter types), build fire (5 methods), paddle back (13 events)
- Self-selected canoe partners: boldest picks first, bond + physical drives choices
- Partner chemistry: bond affects paddle speed (+0.5 at bond >= 2, -0.5 at bond <= -1)
- Fire methods: lighter (villain), homemade starter (chaos, 50/50 risk), paddle burn (+fire, -paddles), traditional, advice to enemy
- Paddles burned → Phase 4 requires swimmer hero (`physical*0.06 + endurance*0.05`)
- VP: `rpBuildUpTheCreek(ep)` — partner selection reveal + 4-phase with water/jungle/fire/sunset ambiance
- Text backlog: `_textUpTheCreek(ep, ln, sec)`
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add Up the Creek to CLAUDE.md"
```
