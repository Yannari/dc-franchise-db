# Hawaiian Punch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Hawaiian Punch as a new finale format — a volcanic race challenge that determines the season winner without a jury vote.

**Architecture:** Simulation logic lives in `js/finale.js` (alongside koh-lanta, fire-making, etc.). VP builder functions live in `js/chal/hawaiian-punch.js`. Integration touches simulator.html (dropdown), cast-ui.js (finaleSize lock), vp-screens.js (screen registration), text-backlog.js (text output), main.js (module import), and the episode history push in finale.js.

**Tech Stack:** Vanilla ES modules, no build step. CSS-only VP animations. Browser-rendered HTML.

**Spec:** `docs/superpowers/specs/2026-05-18-hawaiian-punch-design.md`
**VP Mockup:** `Hawaiian Punch _standalone_.html` (visual source of truth)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `js/finale.js` | Modify | Simulation: tiebreaker duel + 4-phase volcano race + winner determination |
| `js/chal/hawaiian-punch.js` | Create | VP builder functions (rpBuild screens) + reveal handlers |
| `simulator.html` | Modify | Add dropdown option |
| `js/cast-ui.js` | Modify | finaleSize cap at 3, onFinaleFormatChange logic |
| `js/vp-screens.js` | Modify | Import VP builders, register screens in finale block |
| `js/text-backlog.js` | Modify | Add `_textHawaiianPunch()` for text backlog |
| `js/main.js` | Modify | Import hawaiian-punch module |
| `js/finale.js` (episode history) | Modify | Add hawaiian-punch fields to `gs.episodeHistory.push` |

---

### Task 1: UI Integration — Dropdown + finaleSize Lock

**Files:**
- Modify: `simulator.html:~2634` (add option after koh-lanta)
- Modify: `js/cast-ui.js:~671-681` (onFinaleFormatChange) and `js/cast-ui.js:~797-807` (render lock)

- [ ] **Step 1: Add dropdown option in simulator.html**

Find the finale format `<select>` and add hawaiian-punch after koh-lanta:

```html
<option value="koh-lanta">Koh-Lanta (F4 orienteering → F3 perch → F2 FTC)</option>
<option value="hawaiian-punch">Hawaiian Punch (Volcano Race — No Jury)</option>
```

- [ ] **Step 2: Update `onFinaleFormatChange()` in cast-ui.js**

In the `onFinaleFormatChange` function (~line 671), add hawaiian-punch to the format logic. Hawaiian Punch caps finaleSize at 3 (opposite of koh-lanta which forces 4):

```javascript
export function onFinaleFormatChange() {
  const format = document.getElementById('cfg-finale-format')?.value;
  const slider = document.getElementById('cfg-finale');
  const display = document.getElementById('finale-display');
  const needsF4 = format === 'fire-making' || format === 'koh-lanta';
  const capsF3 = format === 'hawaiian-punch';
  if (needsF4) {
    if (slider) { slider.value = 4; slider.disabled = true; slider.style.opacity = '0.4'; }
    const label = format === 'koh-lanta' ? 'koh-lanta' : 'fire-making';
    if (display) display.textContent = `4 (locked — ${label})`;
  } else if (capsF3) {
    if (slider) {
      if (parseInt(slider.value) > 3) slider.value = 3;
      slider.max = 3; slider.disabled = false; slider.style.opacity = '1';
    }
    if (display) display.textContent = `${slider?.value || 3} (max 3 — hawaiian-punch)`;
  } else {
    if (slider) { slider.max = 4; slider.disabled = false; slider.style.opacity = '1'; }
    // ... existing logic for display update
  }
  saveConfig();
}
```

- [ ] **Step 3: Update render lock in `renderSeasonConfig()` (~line 797)**

Add hawaiian-punch cap logic after the existing F4 lock block:

```javascript
// Apply finaleFormat lock on render (fire-making and koh-lanta force F4)
const _fmFormat = seasonConfig.finaleFormat;
const _needsF4 = _fmFormat === 'fire-making' || _fmFormat === 'koh-lanta';
const _capsF3 = _fmFormat === 'hawaiian-punch';
const _fmSlider = g('cfg-finale');
const _fmDisplay = document.getElementById('finale-display');
if (_needsF4) {
  if (_fmSlider) { _fmSlider.value = 4; _fmSlider.disabled = true; _fmSlider.style.opacity = '0.4'; }
  if (_fmDisplay) _fmDisplay.textContent = `4 (locked — ${_fmFormat})`;
} else if (_capsF3) {
  if (_fmSlider) {
    if (parseInt(_fmSlider.value) > 3) _fmSlider.value = 3;
    _fmSlider.max = 3; _fmSlider.disabled = false; _fmSlider.style.opacity = '1';
  }
  if (_fmDisplay) _fmDisplay.textContent = `${_fmSlider?.value || 3} (max 3 — hawaiian-punch)`;
} else {
  if (_fmSlider) { _fmSlider.max = 4; _fmSlider.disabled = false; _fmSlider.style.opacity = '1'; }
}
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html js/cast-ui.js
git commit -m "feat: add Hawaiian Punch to finale format dropdown with F3 cap"
```

---

### Task 2: Simulation — Tiebreaker Jousting Duel + Volcano Race

**Files:**
- Modify: `js/finale.js` (add hawaiian-punch block inside `simulateFinale()`)

This is the largest task. The simulation logic goes inside `simulateFinale()`, gated by `cfg.finaleFormat === 'hawaiian-punch'`.

- [ ] **Step 1: Add hawaiian-punch finaleSize cap at top of `simulateFinale()`**

After the existing fire-making/koh-lanta F4 force (line ~122), add:

```javascript
if (cfg.finaleFormat === 'hawaiian-punch' && cfg.finaleSize > 3) cfg.finaleSize = 3;
```

- [ ] **Step 2: Add hawaiian-punch to the F3 cut exclusion guard**

At line ~507, the `_needsF3Cut` condition has exclusions for `final-challenge`, `olympic-relay`, `koh-lanta`. Add `hawaiian-punch`:

```javascript
if (!ep.firemaking && !ep.klChoice && _needsF3Cut && players.length === 3 && cfg.finaleFormat !== 'final-challenge' && cfg.finaleFormat !== 'olympic-relay' && cfg.finaleFormat !== 'koh-lanta' && cfg.finaleFormat !== 'hawaiian-punch') {
```

- [ ] **Step 3: Add hawaiian-punch to the F4 cut exclusion guard**

At line ~548, add `hawaiian-punch`:

```javascript
if (!ep.firemaking && !ep.klChoice && cfg.finaleSize === 4 && players.length === 4 && cfg.finaleFormat !== 'final-challenge' && cfg.finaleFormat !== 'olympic-relay' && cfg.finaleFormat !== 'koh-lanta' && cfg.finaleFormat !== 'hawaiian-punch') {
```

- [ ] **Step 4: Add hawaiian-punch to bench assignment condition**

At line ~610, the `hasFinaleChallenge` variable gates bench assignments. Add hawaiian-punch:

```javascript
const hasFinaleChallenge = cfg.finaleFormat === 'final-challenge' || cfg.finaleFormat === 'olympic-relay' || cfg.finaleFormat === 'hawaiian-punch';
```

- [ ] **Step 5: Add hawaiian-punch to assistant selection condition**

At line ~618, add hawaiian-punch:

```javascript
if ((cfg.finaleFormat === 'final-challenge' || cfg.finaleFormat === 'olympic-relay' || cfg.finaleFormat === 'hawaiian-punch') && cfg.finaleAssistants && ep.benchAssignments) {
```

- [ ] **Step 6: Write the main hawaiian-punch simulation block**

Insert BEFORE the existing `if (cfg.finaleFormat === 'final-challenge' || cfg.finaleFormat === 'olympic-relay')` block (line ~625). This is the core simulation — tiebreaker + 4-phase volcano race. The full block is large, so here's the structure:

```javascript
// ── HAWAIIAN PUNCH FINALE: tiebreaker joust → 4-phase volcano race → winner ──
if (cfg.finaleFormat === 'hawaiian-punch') {
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const _noise = range => (Math.random() * range * 2) - range;
  const _popDelta = (name, delta) => { if (!gs.popularity) gs.popularity = {}; gs.popularity[name] = (gs.popularity[name] || 0) + delta; };
  const active = [...finalists];
  const eliminated = [...(gs.eliminated || []), ...(gs.jury || [])];
  const peanutGallery = eliminated.filter(p => !finalists.includes(p));

  // ── TIEBREAKER: jousting fire dance duel (F3 only) ──
  if (active.length >= 3) {
    const immWinner = ep.immunityWinner;
    const duelists = active.filter(p => p !== immWinner);
    const [d1, d2] = duelists;
    const numExchanges = 3 + Math.floor(Math.random() * 3); // 3-5
    const exchanges = [];
    let d1Wins = 0, d2Wins = 0;
    let d1Consec = 0, d2Consec = 0;
    const socialEvents = [];

    for (let i = 0; i < numExchanges; i++) {
      const s1 = pStats(d1), s2 = pStats(d2);
      // Desperation rally: losing 2+ consecutive = boldness comeback bonus
      const d1Rally = d1Consec <= -2 ? s1.boldness * 0.15 : 0;
      const d2Rally = d2Consec <= -2 ? s2.boldness * 0.15 : 0;
      const score1 = s1.physical * 0.35 + s1.boldness * 0.3 + s1.endurance * 0.2 + s1.intuition * 0.15 + _noise(2.5) + d1Rally;
      const score2 = s2.physical * 0.35 + s2.boldness * 0.3 + s2.endurance * 0.2 + s2.intuition * 0.15 + _noise(2.5) + d2Rally;
      const winner = score1 >= score2 ? d1 : d2;
      if (winner === d1) { d1Wins++; d1Consec = Math.max(1, d1Consec + 1); d2Consec = Math.min(-1, d2Consec - 1); }
      else { d2Wins++; d2Consec = Math.max(1, d2Consec + 1); d1Consec = Math.min(-1, d1Consec - 1); }
      exchanges.push({ round: i + 1, scores: { [d1]: Math.round(score1 * 10) / 10, [d2]: Math.round(score2 * 10) / 10 }, winner, d1Rally: d1Rally > 0, d2Rally: d2Rally > 0 });

      // Social events between exchanges (1-2 guaranteed)
      const exSocial = [];
      // Guaranteed first event
      const eventPool = [];
      // Crowd Roar — peanut gallery member reacts
      if (peanutGallery.length > 0) {
        const crowd = _pick(peanutGallery);
        const crowdBondD1 = getBond(crowd, d1), crowdBondD2 = getBond(crowd, d2);
        const target = crowdBondD1 >= crowdBondD2 ? d1 : d2;
        const isCheer = getBond(crowd, target) >= 0;
        addBond(crowd, target, isCheer ? 0.5 : -0.5);
        exSocial.push({ type: 'crowd-roar', crowd, target, isCheer });
      }
      // Rival Fire — negative bond between duelists
      if (getBond(d1, d2) <= -1 && Math.random() < 0.5) {
        _popDelta(d1, 1); _popDelta(d2, 1);
        exSocial.push({ type: 'rival-fire', players: [d1, d2] });
      }
      // Showmance Tension
      const showmances = (gs.showmances || []).filter(sh => !sh.broken && (sh.pair.includes(d1) || sh.pair.includes(d2)));
      if (showmances.length > 0 && Math.random() < 0.4) {
        const sh = _pick(showmances);
        const inDuel = sh.pair.find(p => p === d1 || p === d2);
        addBond(sh.pair[0], sh.pair[1], 0.5);
        exSocial.push({ type: 'showmance-tension', showmance: sh, inDuel });
      }
      // Shark Sighting
      if (Math.random() < 0.3) {
        const s1b = pStats(d1).boldness, s2b = pStats(d2).boldness;
        const d1Flinch = s1b + _noise(1.5) < 5, d2Flinch = s2b + _noise(1.5) < 5;
        exSocial.push({ type: 'shark-sighting', flinch: { [d1]: d1Flinch, [d2]: d2Flinch } });
      }
      // Desperation Plea — trailing fighter
      if (i >= 1) {
        const trailing = d1Wins < d2Wins ? d1 : d2Wins < d1Wins ? d2 : null;
        if (trailing && Math.random() < 0.4) {
          const ts = pStats(trailing);
          const success = ts.social + _noise(2) > 5;
          exSocial.push({ type: 'desperation-plea', player: trailing, success });
        }
      }
      // Immunity Winner Reaction
      if (Math.random() < 0.3) {
        const immS = pStats(immWinner);
        const prefersD1 = getBond(immWinner, d1) < getBond(immWinner, d2); // prefers the one they think they can beat
        const isCalc = immS.strategic >= 6;
        if (isCalc) _popDelta(immWinner, -1);
        exSocial.push({ type: 'imm-reaction', immWinner, prefers: prefersD1 ? d1 : d2, isCalc });
      }

      socialEvents.push(exSocial.length > 0 ? exSocial : [{ type: 'crowd-roar', crowd: _pick(peanutGallery.length ? peanutGallery : active), target: winner, isCheer: true }]);
    }

    // Resolution — tied? sudden death
    let duelWinner, duelLoser;
    if (d1Wins === d2Wins) {
      const s1 = pStats(d1), s2 = pStats(d2);
      const sd1 = s1.physical * 0.35 + s1.boldness * 0.3 + s1.endurance * 0.2 + s1.intuition * 0.15 + _noise(4);
      const sd2 = s2.physical * 0.35 + s2.boldness * 0.3 + s2.endurance * 0.2 + s2.intuition * 0.15 + _noise(4);
      duelWinner = sd1 >= sd2 ? d1 : d2;
      duelLoser = duelWinner === d1 ? d2 : d1;
      exchanges.push({ round: numExchanges + 1, suddenDeath: true, scores: { [d1]: Math.round(sd1 * 10) / 10, [d2]: Math.round(sd2 * 10) / 10 }, winner: duelWinner });
    } else {
      duelWinner = d1Wins > d2Wins ? d1 : d2;
      duelLoser = duelWinner === d1 ? d2 : d1;
    }

    // Consequences
    addBond(duelWinner, immWinner, 1.0);
    _popDelta(duelWinner, 2);
    // Farewell bonds
    active.forEach(p => { if (p !== duelLoser) addBond(p, duelLoser, 0.5); });

    ep.hpTiebreaker = {
      immWinner, duelists: [d1, d2], exchanges, socialEvents,
      winner: duelWinner, loser: duelLoser,
      d1Wins, d2Wins, suddenDeath: d1Wins === d2Wins,
    };

    // Eliminate loser
    handleAdvantageInheritance(duelLoser, ep);
    gs.eliminated.push(duelLoser);
    gs.jury.push(duelLoser);
    gs.activePlayers = gs.activePlayers.filter(p => p !== duelLoser);
    finalists = finalists.filter(p => p !== duelLoser);
    ep.hpTiebreakerEliminated = duelLoser;

    // Camp event injection
    const campKey = gs.mergeName || 'merge';
    if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
    const postEvents = ep.campEvents[campKey].post || (ep.campEvents[campKey].post = []);
    postEvents.push({
      type: 'joust-aftermath', players: [duelWinner, duelLoser, immWinner],
      text: `The joust is over. ${duelLoser} is pulled from the water — battered, soaked, but alive. ${duelWinner} and ${immWinner} exchange a look. The volcano race awaits.`,
      badgeText: 'Joust', badgeClass: 'badge-danger',
    });
  }

  // ── VOLCANO RACE: 4 phases → winner ──
  const [racerA, racerB] = finalists.slice(0, 2);
  const assistants = ep.assistants || {};
  const benchAssign = ep.benchAssignments || {};
  const raceData = { phases: [], socialEvents: [], scores: { [racerA]: 0, [racerB]: 0 }, hazardLog: [] };

  // PHASE 1: BUILD THE DUMMY
  {
    const sA = pStats(racerA), sB = pStats(racerB);
    let scoreA = sA.mental * 0.3 + sA.strategic * 0.25 + sA.physical * 0.2 + sA.intuition * 0.25 + _noise(2.5);
    let scoreB = sB.mental * 0.3 + sB.strategic * 0.25 + sB.physical * 0.2 + sB.intuition * 0.25 + _noise(2.5);

    // Assistant boost
    if (assistants[racerA]) {
      const aS = pStats(assistants[racerA]);
      scoreA += (aS.mental + aS.physical) * 0.15;
    }
    if (assistants[racerB]) {
      const bS = pStats(assistants[racerB]);
      scoreB += (bS.mental + bS.physical) * 0.15;
    }

    const buildEvents = [];
    // Sabotage attempt — villain/schemer archetypes
    const villainArchetypes = ['villain', 'mastermind', 'schemer'];
    [racerA, racerB].forEach(racer => {
      const arch = players.find(p => p.name === racer)?.archetype || (window.players || []).find(p => p.name === racer)?.archetype;
      const opponent = racer === racerA ? racerB : racerA;
      if (villainArchetypes.includes(arch) && Math.random() < 0.4) {
        const rs = pStats(racer), os = pStats(opponent);
        const success = rs.strategic + _noise(2) > os.intuition + _noise(1.5);
        if (success) {
          if (racer === racerA) scoreB -= 1.0; else scoreA -= 1.0;
          buildEvents.push({ type: 'sabotage', saboteur: racer, target: opponent, success: true });
        } else {
          _popDelta(racer, -2); addBond(racer, opponent, -1.5);
          buildEvents.push({ type: 'sabotage', saboteur: racer, target: opponent, success: false });
        }
      }
    });

    // Assistant chemistry
    [racerA, racerB].forEach(racer => {
      const asst = assistants[racer];
      if (!asst) return;
      const bond = getBond(racer, asst);
      const bonus = bond >= 3 ? 0.3 : bond <= -1 ? -0.3 : 0;
      if (racer === racerA) scoreA += bonus; else scoreB += bonus;
      addBond(racer, asst, bonus > 0 ? 0.5 : -0.5);
      buildEvents.push({ type: 'assistant-chemistry', racer, assistant: asst, bond: Math.round(bond * 10) / 10, bonus });
    });

    // Dummy insult
    if (Math.random() < 0.5) {
      const mocker = Math.random() < 0.5 ? racerA : racerB;
      const target = mocker === racerA ? racerB : racerA;
      const ms = pStats(mocker), ts = pStats(target);
      const fireBack = ts.boldness + _noise(1.5) >= 5;
      if (fireBack) {
        _popDelta(mocker, 1); _popDelta(target, 1);
      } else {
        _popDelta(mocker, 1);
        if (target === racerA) scoreA -= 0.3; else scoreB -= 0.3;
      }
      buildEvents.push({ type: 'dummy-insult', mocker, target, fireBack });
    }

    // Bench rallying
    const benchA = (benchAssign[racerA] || []).length;
    const benchB = (benchAssign[racerB] || []).length;
    const benchDiff = benchA - benchB;
    const benchBonusA = Math.min(Math.max(benchDiff, 0) * 0.2, 0.6);
    const benchBonusB = Math.min(Math.max(-benchDiff, 0) * 0.2, 0.6);
    scoreA += benchBonusA; scoreB += benchBonusB;
    if (benchDiff !== 0) buildEvents.push({ type: 'bench-rally', [racerA]: benchA, [racerB]: benchB, bonusA: benchBonusA, bonusB: benchBonusB });

    const buildWinner = scoreA >= scoreB ? racerA : racerB;
    raceData.phases.push({ name: 'Build the Dummy', scores: { [racerA]: Math.round(scoreA * 10) / 10, [racerB]: Math.round(scoreB * 10) / 10 }, winner: buildWinner, events: buildEvents });
    raceData.scores[racerA] += scoreA;
    raceData.scores[racerB] += scoreB;
    raceData.socialEvents.push(...buildEvents);
  }

  // PHASE 2: UPHILL RACE
  {
    const sA = pStats(racerA), sB = pStats(racerB);
    let scoreA = sA.physical * 0.3 + sA.endurance * 0.35 + sA.boldness * 0.15 + sA.temperament * 0.2 + _noise(2.5);
    let scoreB = sB.physical * 0.3 + sB.endurance * 0.35 + sB.boldness * 0.15 + sB.temperament * 0.2 + _noise(2.5);

    // Phase 1 carry-over: build winner gets +2.0
    const buildWinner = raceData.phases[0].winner;
    if (buildWinner === racerA) scoreA += 2.0; else scoreB += 2.0;

    // Wheelbarrow advantage — higher-bond assistant gets it
    let wheelbarrowHolder = null;
    if (assistants[racerA] && assistants[racerB]) {
      const bondA = getBond(racerA, assistants[racerA]);
      const bondB = getBond(racerB, assistants[racerB]);
      wheelbarrowHolder = bondA >= bondB ? racerA : racerB;
      if (wheelbarrowHolder === racerA) scoreA += 1.5; else scoreB += 1.5;
    } else if (assistants[racerA]) {
      wheelbarrowHolder = racerA; scoreA += 1.5;
    } else if (assistants[racerB]) {
      wheelbarrowHolder = racerB; scoreB += 1.5;
    }

    const uphillEvents = [];
    // Stumble
    [racerA, racerB].forEach(racer => {
      const rs = pStats(racer);
      if (rs.endurance + _noise(2) < 5) {
        if (racer === racerA) scoreA -= 1.0; else scoreB -= 1.0;
        const opponent = racer === racerA ? racerB : racerA;
        const opS = pStats(opponent);
        const helps = opS.loyalty >= 7 && Math.random() < 0.3;
        if (helps) {
          addBond(opponent, racer, 2.0);
          if (opponent === racerA) scoreA -= 0.5; else scoreB -= 0.5;
          uphillEvents.push({ type: 'stumble', stumbler: racer, helper: opponent });
        } else {
          uphillEvents.push({ type: 'stumble', stumbler: racer, helper: null });
        }
      }
    });

    // Shortcut spotted
    [racerA, racerB].forEach(racer => {
      if (Math.random() < 0.4) {
        const rs = pStats(racer);
        const success = rs.intuition + _noise(2) >= 5;
        if (success) { if (racer === racerA) scoreA += 1.0; else scoreB += 1.0; }
        else { if (racer === racerA) scoreA -= 0.5; else scoreB -= 0.5; }
        uphillEvents.push({ type: 'shortcut', player: racer, success });
      }
    });

    // Taunt from above — leader taunts trailer
    const leader = (raceData.scores[racerA] + scoreA) >= (raceData.scores[racerB] + scoreB) ? racerA : racerB;
    const trailer = leader === racerA ? racerB : racerA;
    if (Math.random() < 0.5) {
      const ts = pStats(trailer);
      const keepsCool = ts.temperament + _noise(1.5) >= 6;
      if (keepsCool) {
        _popDelta(trailer, 1);
      } else {
        const physCheck = ts.physical + _noise(2) >= 5;
        if (physCheck) { if (trailer === racerA) scoreA += 1.0; else scoreB += 1.0; }
        else { if (trailer === racerA) scoreA -= 0.5; else scoreB -= 0.5; }
      }
      uphillEvents.push({ type: 'taunt', taunter: leader, target: trailer, keepsCool });
    }

    // Bench interference
    if (Math.random() < 0.5) {
      const helpTarget = Math.random() < 0.5 ? racerA : racerB;
      if (helpTarget === racerA) scoreA += 0.3; else scoreB += 0.3;
      uphillEvents.push({ type: 'bench-help', target: helpTarget, item: 'water bottle' });
    }
    if (Math.random() < 0.3) {
      const sabTarget = Math.random() < 0.5 ? racerA : racerB;
      const ts = pStats(sabTarget);
      const dodged = ts.intuition + _noise(1.5) >= 5;
      if (!dodged) { if (sabTarget === racerA) scoreA -= 0.3; else scoreB -= 0.3; }
      uphillEvents.push({ type: 'bench-sabotage', target: sabTarget, dodged, item: 'rock' });
    }

    raceData.phases.push({ name: 'Uphill Race', scores: { [racerA]: Math.round(scoreA * 10) / 10, [racerB]: Math.round(scoreB * 10) / 10 }, wheelbarrowHolder, events: uphillEvents });
    raceData.scores[racerA] += scoreA;
    raceData.scores[racerB] += scoreB;
    raceData.socialEvents.push(...uphillEvents);
    raceData.hazardLog.push({ name: 'Wheelbarrow', status: wheelbarrowHolder ? 'BROKEN' : 'N/A' });
  }

  // PHASE 3: LAVA RIVER CROSSING
  {
    const sA = pStats(racerA), sB = pStats(racerB);
    let scoreA = sA.mental * 0.3 + sA.intuition * 0.3 + sA.physical * 0.2 + sA.boldness * 0.2 + _noise(2.5);
    let scoreB = sB.mental * 0.3 + sB.intuition * 0.3 + sB.physical * 0.2 + sB.boldness * 0.2 + _noise(2.5);

    const trapTypes = ['piano', 'cage', 'boulder', 'net', 'anvil'];
    const numRopes = 4 + (Math.random() < 0.5 ? 1 : 0); // 4-5
    const ropeCuts = [];
    const lavaEvents = [];

    // Collect all helpers (assistants + bench members with 1 cut each)
    const helpersA = [assistants[racerA], ...(benchAssign[racerA] || []).slice(0, 1)].filter(Boolean);
    const helpersB = [assistants[racerB], ...(benchAssign[racerB] || []).slice(0, 1)].filter(Boolean);

    // Each helper gets 1 rope cut
    [...helpersA.map(h => ({ helper: h, side: racerA, target: racerB })), ...helpersB.map(h => ({ helper: h, side: racerB, target: racerA }))].forEach((cut, i) => {
      if (i >= numRopes) return;
      const trap = trapTypes[i % trapTypes.length];
      const mismatch = Math.random() < 0.3; // 30% chance hits own finalist
      const victim = mismatch ? cut.side : cut.target;
      const victimS = pStats(victim);

      // Dodge check
      const dodged = (victimS.intuition + victimS.boldness) / 2 + _noise(2) >= 5;
      let damage = 0;
      if (!dodged) {
        damage = trap === 'cage' ? -3.0 : -2.0;
        // Cage escape
        if (trap === 'cage' && victimS.physical >= 6) damage = -2.0; // escaped, reduced damage
        if (victim === racerA) scoreA += damage; else scoreB += damage;
        raceData.hazardLog.push({ name: trap === 'cage' ? 'Cage trap' : trap.charAt(0).toUpperCase() + trap.slice(1), status: mismatch ? 'BACKFIRE' : 'HIT' });
      } else {
        _popDelta(victim, 1);
        raceData.hazardLog.push({ name: trap.charAt(0).toUpperCase() + trap.slice(1), status: 'DODGED' });
      }
      ropeCuts.push({ helper: cut.helper, intendedTarget: cut.target, actualVictim: victim, trap, mismatch, dodged, damage });
    });

    // Distraction play
    if (Math.random() < 0.4) {
      const distTarget = Math.random() < 0.5 ? racerA : racerB;
      const targetS = pStats(distTarget);
      // Find a high-bond person to reference
      const highBondPerson = peanutGallery.find(p => getBond(distTarget, p) >= 3);
      if (highBondPerson) {
        const success = pStats(distTarget === racerA ? racerB : racerA).social + _noise(2) > targetS.mental + _noise(1.5);
        if (success) { if (distTarget === racerA) scoreA -= 1.5; else scoreB -= 1.5; }
        lavaEvents.push({ type: 'distraction', target: distTarget, reference: highBondPerson, success });
      }
    }

    // Counter-block between assistants
    if (assistants[racerA] && assistants[racerB] && Math.random() < 0.4) {
      const aS = pStats(assistants[racerA]), bS = pStats(assistants[racerB]);
      const aWins = aS.physical + _noise(2) >= bS.physical + _noise(2);
      lavaEvents.push({ type: 'counter-block', winner: aWins ? assistants[racerA] : assistants[racerB], protects: aWins ? racerA : racerB });
    }

    raceData.phases.push({ name: 'Lava River Crossing', scores: { [racerA]: Math.round(scoreA * 10) / 10, [racerB]: Math.round(scoreB * 10) / 10 }, ropeCuts, events: lavaEvents });
    raceData.scores[racerA] += scoreA;
    raceData.scores[racerB] += scoreB;
    raceData.socialEvents.push(...lavaEvents);
    raceData.hazardLog.push({ name: 'Lava river', status: 'CROSSED' });
  }

  // PHASE 4: SUMMIT SHOWDOWN
  {
    const cumulA = raceData.scores[racerA], cumulB = raceData.scores[racerB];
    const leader = cumulA >= cumulB ? racerA : racerB;
    const trailer = leader === racerA ? racerB : racerA;
    let summitFlip = false;
    let mindGamesData = null;

    const trailerS = pStats(trailer);
    const leaderS = pStats(leader);
    const trailerArch = (window.players || []).find(p => p.name === trailer)?.archetype;
    const bond = getBond(trailer, leader);
    const hasShowmance = (gs.showmances || []).some(sh => !sh.broken && sh.pair.includes(trailer) && sh.pair.includes(leader));

    // Mind games trigger conditions
    const canAttempt = trailerS.social >= 5 || hasShowmance || bond >= 4;

    if (canAttempt) {
      // Pick attack type by archetype
      let attackType, attackRoll, defenseRoll;
      const manipArchetypes = ['social-butterfly', 'showmancer', 'schemer'];
      const tauntArchetypes = ['hothead', 'villain', 'chaos-agent'];
      const pleadArchetypes = ['underdog', 'hero', 'loyal-soldier'];

      if (manipArchetypes.includes(trailerArch)) {
        attackType = 'emotional-manipulation';
        attackRoll = trailerS.social * 0.4 + trailerS.strategic * 0.3 + trailerS.boldness * 0.3 + _noise(3);
        defenseRoll = leaderS.mental * 0.4 + leaderS.intuition * 0.3 + leaderS.temperament * 0.3 + _noise(2);
      } else if (tauntArchetypes.includes(trailerArch)) {
        attackType = 'taunt-provocation';
        attackRoll = trailerS.boldness * 0.4 + trailerS.social * 0.3 + trailerS.strategic * 0.3 + _noise(3);
        defenseRoll = leaderS.temperament * 0.5 + leaderS.mental * 0.3 + leaderS.intuition * 0.2 + _noise(2);
      } else {
        attackType = 'desperate-plea';
        attackRoll = trailerS.social * 0.5 + trailerS.loyalty * 0.3 + trailerS.intuition * 0.2 + _noise(3);
        defenseRoll = leaderS.strategic * 0.4 + leaderS.boldness * 0.3 + leaderS.temperament * 0.3 + _noise(2);
      }

      // Showmance/high-bond vulnerability
      if (hasShowmance || bond >= 5) defenseRoll -= 2.0;

      summitFlip = attackRoll > defenseRoll;
      mindGamesData = { attackType, trailer, leader, attackRoll: Math.round(attackRoll * 10) / 10, defenseRoll: Math.round(defenseRoll * 10) / 10, hasShowmance, bond: Math.round(bond * 10) / 10, success: summitFlip };

      if (summitFlip) {
        _popDelta(trailer, 3); _popDelta(leader, -2);
      } else {
        _popDelta(trailer, -1); _popDelta(leader, 1);
      }
    } else {
      // No mind games — straight sprint
      const sprintA = pStats(racerA).physical * 0.3 + pStats(racerA).boldness * 0.4 + pStats(racerA).endurance * 0.3 + _noise(2);
      const sprintB = pStats(racerB).physical * 0.3 + pStats(racerB).boldness * 0.4 + pStats(racerB).endurance * 0.3 + _noise(2);
      raceData.scores[racerA] += sprintA;
      raceData.scores[racerB] += sprintB;
      mindGamesData = { attackType: 'none', noAttempt: true };
    }

    const raceWinner = summitFlip ? trailer : (raceData.scores[racerA] >= raceData.scores[racerB] ? racerA : racerB);
    raceData.phases.push({ name: 'Summit Showdown', leader, trailer, mindGames: mindGamesData, flip: summitFlip, winner: raceWinner });
    raceData.hazardLog.push({ name: 'Eruption', status: 'ONGOING' });
    raceData.winner = raceWinner;
  }

  // Eruption narrative
  raceData.eruption = { triggered: true, cause: 'pineapple-offering' };
  // Feral cameo easter egg
  const earlyElim = (gs.eliminated || []).find((p, i) => i === 0);
  if (earlyElim && Math.random() < 0.3) {
    raceData.feralCameo = earlyElim;
  }

  ep.hpRaceData = raceData;
  ep.winner = raceData.winner;
  ep.juryResult = null;
  gs.finaleResult = { winner: ep.winner, votes: null, reasoning: null, finalists, hawaiianPunch: true };
}
```

- [ ] **Step 7: Add hawaiian-punch fields to episode history push**

In the `gs.episodeHistory.push({...})` block (~line 747-787), add after the koh-lanta fields:

```javascript
    // Hawaiian Punch finale
    hpTiebreaker: ep.hpTiebreaker || null,
    hpTiebreakerEliminated: ep.hpTiebreakerEliminated || null,
    hpRaceData: ep.hpRaceData || null,
```

- [ ] **Step 8: Add hawaiian-punch to the finale immunity VP guard in vp-screens.js**

At line ~10524, add hawaiian-punch to the exclusion list for the generic finale immunity screen — hawaiian-punch has its own immunity screen flow:

```javascript
if (ep.isFinale && ep.challengeType && ep.immunityWinner && (seasonConfig.finaleSize >= 3 || seasonConfig.firemaking) && seasonConfig.finaleFormat !== 'final-challenge' && seasonConfig.finaleFormat !== 'olympic-relay' && seasonConfig.finaleFormat !== 'koh-lanta' && seasonConfig.finaleFormat !== 'hawaiian-punch') {
```

- [ ] **Step 9: Commit**

```bash
git add js/finale.js js/vp-screens.js
git commit -m "feat: add Hawaiian Punch simulation — tiebreaker duel + 4-phase volcano race"
```

---

### Task 3: Text Backlog

**Files:**
- Modify: `js/text-backlog.js` — add `_textHawaiianPunch()` and call it from `generateSummaryText()`

- [ ] **Step 1: Add `_textHawaiianPunch()` function**

Add after `_textOlympicRelay` (~line 1628):

```javascript
// ── FINALE: HAWAIIAN PUNCH ──
export function _textHawaiianPunch(ep, ln, sec) {
  // Tiebreaker
  if (ep.hpTiebreaker) {
    const tb = ep.hpTiebreaker;
    sec('JOUSTING TIEBREAKER');
    ln(`${tb.immWinner} is safe with immunity. ${tb.duelists[0]} and ${tb.duelists[1]} duel for the final spot.`);
    ln('');
    tb.exchanges.forEach(ex => {
      if (ex.suddenDeath) {
        ln(`SUDDEN DEATH: ${ex.winner} wins the deciding exchange!`);
      } else {
        ln(`Exchange ${ex.round}: ${ex.winner} wins (${Object.entries(ex.scores).map(([n,s]) => `${n}: ${s}`).join(' vs ')})`);
        if (ex.d1Rally) ln(`  ${tb.duelists[0]} rallies from behind!`);
        if (ex.d2Rally) ln(`  ${tb.duelists[1]} rallies from behind!`);
      }
    });
    ln('');
    ln(`Result: ${tb.winner} advances (${tb.d1Wins}-${tb.d2Wins}). ${tb.loser} is knocked into the water and eliminated.`);
  }

  // Volcano race
  if (ep.hpRaceData) {
    const rd = ep.hpRaceData;
    sec('HAWAIIAN PUNCH — VOLCANO RACE');
    const racers = Object.keys(rd.scores);
    ln(`Finalists: ${racers.join(' vs ')}`);
    ln('');

    rd.phases.forEach(phase => {
      ln(`--- ${phase.name} ---`);
      if (phase.scores) {
        Object.entries(phase.scores).forEach(([name, score]) => ln(`  ${name}: ${score}`));
      }
      if (phase.winner && phase.name !== 'Summit Showdown') ln(`  Phase winner: ${phase.winner}`);
      if (phase.wheelbarrowHolder) ln(`  Wheelbarrow: ${phase.wheelbarrowHolder} (breaks at lava river)`);

      // Events
      (phase.events || []).forEach(ev => {
        if (ev.type === 'sabotage') ln(`  SABOTAGE: ${ev.saboteur} ${ev.success ? 'sabotages' : 'fails to sabotage'} ${ev.target}'s dummy`);
        if (ev.type === 'stumble') ln(`  ${ev.stumbler} stumbles!${ev.helper ? ` ${ev.helper} helps them up.` : ''}`);
        if (ev.type === 'shortcut') ln(`  ${ev.player} spots a shortcut — ${ev.success ? 'takes it!' : 'dead end!'}`);
        if (ev.type === 'taunt') ln(`  ${ev.taunter} taunts ${ev.target}. ${ev.keepsCool ? 'They keep their cool.' : 'They lose their cool!'}`);
      });

      // Rope cuts
      if (phase.ropeCuts) {
        phase.ropeCuts.forEach(rc => {
          const backfire = rc.mismatch ? ' (BACKFIRE — hit own finalist!)' : '';
          ln(`  Rope cut: ${rc.helper} drops ${rc.trap} on ${rc.actualVictim}${backfire} — ${rc.dodged ? 'DODGED' : `HIT (${rc.damage})`}`);
        });
      }

      // Summit
      if (phase.mindGames) {
        const mg = phase.mindGames;
        if (mg.noAttempt) {
          ln(`  No mind games — straight sprint to the rim.`);
        } else {
          ln(`  MIND GAMES: ${mg.trailer} attempts ${mg.attackType} on ${mg.leader}`);
          ln(`  Attack: ${mg.attackRoll} vs Defense: ${mg.defenseRoll}${mg.hasShowmance ? ' (showmance vulnerability!)' : ''}`);
          ln(`  Result: ${mg.success ? `SUCCESS — ${mg.trailer} FLIPS the race!` : `FAILED — ${mg.leader} stays focused.`}`);
        }
      }
      ln('');
    });

    ln(`WINNER: ${rd.winner} throws their dummy into the volcano!`);
    if (rd.feralCameo) ln(`...and ${rd.feralCameo} emerges from the volcano, snatching the prize money!`);

    // Hazard log
    if (rd.hazardLog?.length) {
      ln('');
      ln('HAZARD LOG:');
      rd.hazardLog.forEach(h => ln(`  ${h.name}: ${h.status}`));
    }
  }
}
```

- [ ] **Step 2: Call from `generateSummaryText()`**

Find the finale text calls block (~line 2303) and add:

```javascript
  _textHawaiianPunch(ep, ln, sec);
```

After `_textOlympicRelay(ep, ln, sec);`

- [ ] **Step 3: Add import if `_textHawaiianPunch` is exported from text-backlog.js itself**

Since the function is defined in text-backlog.js and called within the same file, no import needed.

- [ ] **Step 4: Commit**

```bash
git add js/text-backlog.js
git commit -m "feat: add Hawaiian Punch text backlog"
```

---

### Task 4: Finale Summary Text

**Files:**
- Modify: `js/finale.js` — add hawaiian-punch section to `generateFinaleSummaryText()`

- [ ] **Step 1: Add hawaiian-punch text to `generateFinaleSummaryText()`**

Find the function (~line 793). After the existing `if (cfg.finaleFormat === 'fan-vote' && ep.fanVoteResult)` block and before the `final-challenge`/`olympic-relay` section, add:

```javascript
  // Hawaiian Punch finale
  if (cfg.finaleFormat === 'hawaiian-punch' && ep.hpRaceData) {
    if (ep.hpTiebreaker) {
      sec('JOUSTING TIEBREAKER');
      const tb = ep.hpTiebreaker;
      ln(`${tb.duelists[0]} and ${tb.duelists[1]} face off in a jousting fire dance duel over shark-infested water.`);
      ln(`After ${tb.exchanges.length} exchanges, ${tb.winner} prevails${tb.suddenDeath ? ' in sudden death' : ` (${tb.d1Wins}-${tb.d2Wins})`}.`);
      ln(`${tb.loser} is knocked into the water and eliminated.`);
    }

    sec('VOLCANO RACE');
    const rd = ep.hpRaceData;
    const racers = Object.keys(rd.scores);
    ln(`${racers[0]} vs ${racers[1]} — build a dummy, race it up the volcano, throw it in the crater.`);
    ln('');
    rd.phases.forEach(phase => {
      if (phase.scores) ln(`${phase.name}: ${Object.entries(phase.scores).map(([n,s]) => `${n} ${s}`).join(' | ')}`);
      if (phase.mindGames && !phase.mindGames.noAttempt) {
        ln(`  Mind games: ${phase.mindGames.trailer} uses ${phase.mindGames.attackType} — ${phase.mindGames.success ? 'SUCCESS! Race flipped!' : 'Failed.'}`);
      }
    });
    ln('');
    ln(`${rd.winner} throws their dummy into the volcano and wins the season!`);
    if (rd.feralCameo) ln(`${rd.feralCameo} steals the prize money from inside the volcano!`);
  }
```

- [ ] **Step 2: Commit**

```bash
git add js/finale.js
git commit -m "feat: add Hawaiian Punch to finale summary text"
```

---

### Task 5: VP Builder Shell — `js/chal/hawaiian-punch.js`

**Files:**
- Create: `js/chal/hawaiian-punch.js`

This creates the VP builder file with the shell wrapper, CSS, and title card screen. The mockup (`Hawaiian Punch _standalone_.html`) is the visual source of truth. This task creates the foundation; Tasks 6-9 add individual screens.

- [ ] **Step 1: Create the VP builder file with CSS shell + title card**

Create `js/chal/hawaiian-punch.js` with:
- Imports from core modules
- `_hpShell(content, ep, phaseCls)` — shell wrapper with all CSS (matching mockup: navy `#0a1929` bg, volcanic red accents, ember particles, moon, LIVE pill, SEASON FINALE badge, PUNCH.TV branding, tab nav, sticky controls)
- `_hpIcon(type)` — CSS-only icons (fire, tiki, lava, skull, volcano, coconut, shark, rope, dummy)
- `_tvState` setup for reveal system
- `rpBuildHPTitleCard(ep)` — title card matching mockup (volcano SVG backdrop, "HAWAIIAN PUNCH" in Impact, "FINALE OF THE SEASON" subtitle, finalist intro cards with stat bars)
- Export `hpRevealNext`, `hpRevealAll` reveal handlers

The file will be large (1500+ lines for full VP). Start with shell + title card, add screens in subsequent tasks.

```javascript
import { gs, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond } from '../bonds.js';

const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

// ... shell, icons, title card, reveal handlers
```

Due to the size of this file, the implementing agent should:
1. Open the mockup in a browser for visual reference
2. Match the exact color palette, fonts, layout, and components from the mockup
3. Use CSS prefix `hp-` for all classes
4. Build the title card screen first, verify against mockup

- [ ] **Step 2: Commit**

```bash
git add js/chal/hawaiian-punch.js
git commit -m "feat: add Hawaiian Punch VP shell + title card"
```

---

### Task 6: VP Screens — Tiebreaker + Joust

**Files:**
- Modify: `js/chal/hawaiian-punch.js`

- [ ] **Step 1: Add tiebreaker/joust VP screens**

Add to `hawaiian-punch.js`:
- `rpBuildHPTiebreaker(ep)` — the "01 TIEBREAKER" tab. Shows immunity winner safe, introduces the two duelists. Arena setup narrative.
- `rpBuildHPJoust(ep)` — the "02 JOUST" tab. Click-to-reveal exchanges with scores. Social event cards between exchanges (styled with teal accent for social, red for combat). Shark fin CSS animation in background. Resolution + elimination narrative.

Each exchange is a reveal step. Social events between exchanges are sub-steps. Use `_reapplyVisibility` pattern.

- [ ] **Step 2: Commit**

```bash
git add js/chal/hawaiian-punch.js
git commit -m "feat: add Hawaiian Punch tiebreaker + joust VP screens"
```

---

### Task 7: VP Screens — Volcano Race (Build + Uphill + Lava + Summit)

**Files:**
- Modify: `js/chal/hawaiian-punch.js`

- [ ] **Step 1: Add volcano race VP screens**

Add to `hawaiian-punch.js`:
- `rpBuildHPVolcanoRace(ep)` — the "03 VOLCANO RACE" tab. Covers Build, Uphill, and Lava Crossing phases. Each phase gets a section header. Events are reveal steps. Phase-specific background shifts (amber→green→red). Rope-cutting system visualized with trap icons. Sidebar shows live score tracker (volcano cross-section with racer markers).
- `rpBuildHPSummit(ep)` — the "04 SUMMIT" tab. Summit arrival, mind games attempt (if any), dummy throw, winner declaration. Screen shake CSS on mind games success. Volcano eruption narrative.

- [ ] **Step 2: Commit**

```bash
git add js/chal/hawaiian-punch.js
git commit -m "feat: add Hawaiian Punch volcano race + summit VP screens"
```

---

### Task 8: VP Screens — Endings + Sidebar

**Files:**
- Modify: `js/chal/hawaiian-punch.js`

- [ ] **Step 1: Add endings screen + sidebar**

Add to `hawaiian-punch.js`:
- `rpBuildHPEndings(ep)` — the "05 ENDINGS" tab. Collapsible sections from mockup: FINAL THREE (dot avatars), PEANUT GALLERY (colored dots with count), HAZARD LOG (table with status pills), PRIZE STATUS ($1M with recovery bar), NEXT EPISODE teaser.
- `_buildHPSidebar(screenKey)` — live-updating sidebar called from reveal handlers. Volcano cross-section with racer progress markers. Phase labels. Score tallies gated by `_tvState`. Eruption meter.
- `_updateHPSidebar(screenKey)` — innerHTML replacement by ID, called from both `hpRevealNext` and `hpRevealAll`.

- [ ] **Step 2: Commit**

```bash
git add js/chal/hawaiian-punch.js
git commit -m "feat: add Hawaiian Punch endings + sidebar VP screens"
```

---

### Task 9: VP Screen Registration + Module Import

**Files:**
- Modify: `js/vp-screens.js` (~line 11550, finale-specific block)
- Modify: `js/main.js` (import + module spread)

- [ ] **Step 1: Import VP builders in vp-screens.js**

At the top of `vp-screens.js`, add the import alongside other challenge imports:

```javascript
import { rpBuildHPTitleCard, rpBuildHPTiebreaker, rpBuildHPJoust, rpBuildHPVolcanoRace, rpBuildHPSummit, rpBuildHPEndings, hpRevealNext, hpRevealAll } from './chal/hawaiian-punch.js';
```

- [ ] **Step 2: Register screens in the finale block**

In the `if (ep.isFinale)` block (~line 11550), add after the koh-lanta screens and before the fire-making screens:

```javascript
    // Hawaiian Punch: tiebreaker → joust → volcano race → summit → endings
    if (ep.hpRaceData) {
      vpScreens.push({ id: 'hp-title', label: 'Hawaiian Punch', html: rpBuildHPTitleCard(ep) });
      if (ep.hpTiebreaker) {
        vpScreens.push({ id: 'hp-tiebreaker', label: 'Tiebreaker', html: rpBuildHPTiebreaker(ep) });
        vpScreens.push({ id: 'hp-joust', label: 'The Joust', html: rpBuildHPJoust(ep) });
      }
      vpScreens.push({ id: 'hp-volcano', label: 'Volcano Race', html: rpBuildHPVolcanoRace(ep) });
      vpScreens.push({ id: 'hp-summit', label: 'Summit', html: rpBuildHPSummit(ep) });
      vpScreens.push({ id: 'hp-endings', label: 'Endings', html: rpBuildHPEndings(ep) });
    }
```

- [ ] **Step 3: Add module import in main.js**

Add import after the last challenge import (~line 76):

```javascript
import * as hawaiianPunchMod from './chal/hawaiian-punch.js';
```

Add to the module spread array (~line 167):

```javascript
truthOrSharkMod, rockTheDockMod, tropicalTakedownMod, midnightManhuntMod, greecesPiecesMod, hangarBlackMod, hawaiianPunchMod, aftermayhemMod, socialManipMod, campEventsMod, twistsMod, rescueIslandMod,
```

- [ ] **Step 4: Commit**

```bash
git add js/vp-screens.js js/main.js
git commit -m "feat: register Hawaiian Punch VP screens + module import"
```

---

### Task 10: Final Integration + Smoke Test

**Files:**
- All previously modified files (verification only)

- [ ] **Step 1: Open the simulator in browser**

Navigate to `simulator.html`. Go to Season Setup tab → Season Structure section → Finale Format dropdown. Verify "Hawaiian Punch (Volcano Race — No Jury)" appears.

- [ ] **Step 2: Test finaleSize lock**

Select Hawaiian Punch from dropdown. Verify:
- finaleSize slider caps at 3 (cannot go to 4)
- Display shows "max 3 — hawaiian-punch"
- Switching to another format restores slider to max 4

- [ ] **Step 3: Run a season with Hawaiian Punch finale**

Configure a season with Hawaiian Punch format, finaleSize=3. Run through to finale. Verify:
- Tiebreaker fires (3 players → jousting duel → 1 eliminated)
- Volcano race runs (4 phases with events)
- Winner is determined by race outcome, not jury
- VP screens render without JS errors
- Text backlog includes Hawaiian Punch sections
- Episode history has hpTiebreaker + hpRaceData fields

- [ ] **Step 4: Run a season with F2 entry**

Configure with finaleSize=2. Verify tiebreaker is skipped, volcano race runs directly with 2 finalists.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: Hawaiian Punch integration fixes from smoke test"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All spec sections mapped to tasks — tiebreaker (T2), 4 volcano phases (T2), bench/assistant (T2 steps 4-5), VP (T5-T8), text backlog (T3), finale summary (T4), UI dropdown (T1), episode history (T2 step 7), guard conditions (T2 steps 2-3-8)
- [x] **Placeholder scan:** No TBD/TODO. Task 5 intentionally leaves VP code to the implementing agent (the mockup is the spec, and the file is too large to inline in the plan). All other tasks have concrete code.
- [x] **Type consistency:** `ep.hpTiebreaker`, `ep.hpRaceData`, `ep.hpTiebreakerEliminated` used consistently across finale.js, text-backlog.js, vp-screens.js, and hawaiian-punch.js.
- [x] **Function names:** `rpBuildHPTitleCard`, `rpBuildHPTiebreaker`, `rpBuildHPJoust`, `rpBuildHPVolcanoRace`, `rpBuildHPSummit`, `rpBuildHPEndings`, `hpRevealNext`, `hpRevealAll` — consistent across definition (T5-T8) and import (T9).
