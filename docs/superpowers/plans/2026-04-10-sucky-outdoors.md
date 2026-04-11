# The Sucky Outdoors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a schedulable pre-merge overnight survival challenge with 5 phases, personal scoring, lost player mechanics, and ambiance-shifting VP screen.

**Architecture:** New `simulateSuckyOutdoors(ep)` generates events across 5 phases (hike, camp, nightfall, night, morning race). Each event awards personal scores → `chalMemberScores`. VP screen `rpBuildSuckyOutdoors(ep)` has per-phase click-to-reveal with background ambiance shifting from dawn→dusk→deepnight→dawn. Lost player mechanic can auto-lose the challenge.

**Tech Stack:** Pure JS in `simulator.html`. No external dependencies.

---

### Task 1: TWIST_CATALOG + applyTwist + Episode Branch

**Files:**
- Modify: `simulator.html` — TWIST_CATALOG (~line 1636), applyTwist (~line 15026), simulateEpisode challenge branch (~line 26225), updateChalRecord skip list

- [ ] **Step 1: Add catalog entry**

After the talent-show entry in TWIST_CATALOG, add:

```javascript
  { id:'sucky-outdoors', emoji:'🏕️', name:'The Sucky Outdoors', category:'challenge', phase:'pre-merge', desc:'Overnight survival in the woods. Five phases of drama. First tribe back in the morning wins. Getting lost can cost your team everything.', engineType:'sucky-outdoors', minTribes:2, incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show'] },
```

Also add `'sucky-outdoors'` to ALL other challenge twists' incompatible arrays (9 existing twists).

- [ ] **Step 2: Add applyTwist flag**

After `ep.isTalentShow = true;` block, add:

```javascript

  } else if (engineType === 'sucky-outdoors') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isSuckyOutdoors = true;
```

- [ ] **Step 3: Add episode branch**

After the talent show branch in simulateEpisode (`simulateTalentShow(ep);`), add:

```javascript
  } else if (ep.isSuckyOutdoors && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateSuckyOutdoors(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateSuckyOutdoors
```

- [ ] **Step 4: Add to updateChalRecord skip list**

Find `!ep.isTalentShow` in the updateChalRecord skip condition, add `&& !ep.isSuckyOutdoors`.

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: add Sucky Outdoors to TWIST_CATALOG + applyTwist + episode branch"
```

---

### Task 2: Core Simulation — `simulateSuckyOutdoors(ep)`

**Files:**
- Modify: `simulator.html` — add function after `simulateTalentShow` ends (before PHOBIA FACTOR)

This is the big task. The function runs 5 phases, each generating events with personal scores and bond effects. Read the spec at `docs/superpowers/specs/2026-04-10-sucky-outdoors-design.md` for the full event pools.

- [ ] **Step 1: Add the simulation function**

The function should:

1. **Setup:** Build tribeMembers, select navigator per tribe, init personal scores
2. **Phase 1 (Announcement + Hike):** 3-4 events per tribe from the hike pool
3. **Phase 2 (Setup Camp):** 3-4 events per tribe, calculate camp quality
4. **Phase 3 (Nightfall):** 4-5 events per tribe from the social pool
5. **Phase 4 (The Night):** 3-4 events per tribe, severity scales with camp quality, lost player check
6. **Phase 5 (Morning Race):** Calculate race scores, apply lost player penalties, determine winner
7. **Store:** Set ep fields (winner, loser, chalMemberScores, etc.)

**Key patterns:**
- `players.find(p => p.name === name)?.archetype` for archetype (NOT `pStats().archetype`)
- `pronouns(name)` returns `{sub, obj, pos, posAdj, ref, Sub, Obj, PosAdj}` — use `posAdj` before nouns
- All stat checks proportional — NO thresholds for gameplay effects
- Block nice archetypes (`hero, loyal, loyal-soldier, protector, social-butterfly, showmancer`) from pranks/scheming
- Pre-render all text as strings (functions don't survive JSON serialization)
- Each event: `{ type, phase, players: [], text, personalScores: {name: delta}, bondChanges: [{from, to, delta}], badge, badgeClass }`

**Navigator selection:**
```javascript
const navigator = t.members.slice().sort((a, b) => {
  const sA = pStats(a), sB = pStats(b);
  return (sB.mental * 0.5 + sB.strategic * 0.3 + sB.intuition * 0.2) - (sA.mental * 0.5 + sA.strategic * 0.3 + sA.intuition * 0.2);
})[0];
```

**Camp quality:**
```javascript
const campQuality = t.members.reduce((sum, m) => { const s = pStats(m); return sum + s.endurance + s.mental; }, 0) / (t.members.length * 2);
```

**Lost player check (Phase 4):**
```javascript
// Proportional: low intuition + low mental = higher chance. Wanderers from Phase 1 get boost.
const lostChance = (10 - s.intuition) * 0.02 + (10 - s.mental) * 0.015 + (wanderedOff ? 0.1 : 0);
```

**Morning race score:**
```javascript
const raceScore = t.members.filter(m => !lostPlayers.includes(m)).reduce((sum, m) => {
  const s = pStats(m);
  return sum + s.physical * 0.04 + s.endurance * 0.03;
}, 0);
// Lost player penalty
const penalty = lostPlayers.filter(m => t.members.includes(m)).length * 5.0;
```

**Auto-loss check:**
```javascript
// If lost players arrive after all other tribes finish
const lostDelay = Math.max(...tribeMembers.filter(tm => /* has lost members */).map(/* delay calc */));
// If any tribe has 0 lost players, their race finishes instantly — compare
```

**Store data:**
```javascript
ep.suckyOutdoors = {
  phases: { announcement: [...], setupCamp: [...], nightfall: [...], theNight: [...], morningRace: [...] },
  navigators: { tribeName: name },
  campQuality: { tribeName: score },
  lostPlayers: [{ name, tribe, lostInPhase, returnDelay }],
  survivalScores: { tribeName: total },
  winner: winnerName, loser: loserName,
};
ep.winner = winner; ep.loser = loser;
ep.challengeType = 'tribe';
ep.tribalPlayers = [...loser.members];
ep.challengeLabel = 'The Sucky Outdoors';
ep.challengeCategory = 'endurance';
ep.challengeDesc = 'Overnight survival. First tribe back in the morning wins.';
ep.chalMemberScores = personalScores; // only includes participating players
updateChalRecord(ep);
```

**Heat for lost players:**
```javascript
if (!gs._suckyOutdoorsHeat) gs._suckyOutdoorsHeat = {};
lostPlayers.forEach(lp => {
  gs._suckyOutdoorsHeat[lp.name] = { amount: 2.0, expiresEp: ((gs.episode || 0) + 1) + 2 };
});
```

**Camp events:** Push 2 camp events per tribe (1 positive, 1 negative) same pattern as dodgebrawl/talent show.

- [ ] **Step 2: Add heat integration**

In computeHeat, after the talent show heat check, add:
```javascript
  if (gs._suckyOutdoorsHeat?.[name] && ((gs.episode || 0) + 1) < gs._suckyOutdoorsHeat[name].expiresEp) heat += gs._suckyOutdoorsHeat[name].amount;
```

- [ ] **Step 3: Add heat clearing**

After the talent show heat clearing block, add:
```javascript
    if (gs._suckyOutdoorsHeat) {
      Object.keys(gs._suckyOutdoorsHeat).forEach(k => {
        if (((gs.episode || 0) + 1) >= gs._suckyOutdoorsHeat[k].expiresEp) delete gs._suckyOutdoorsHeat[k];
      });
      if (!Object.keys(gs._suckyOutdoorsHeat).length) delete gs._suckyOutdoorsHeat;
    }
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: simulateSuckyOutdoors — 5-phase overnight survival with personal scoring"
```

---

### Task 3: Episode History + patchEpisodeHistory + Badges

**Files:**
- Modify: `simulator.html` — episode history push, patchEpisodeHistory, badge chains

- [ ] **Step 1: Add to episode history push**

After talent show fields in the standard history push, add:
```javascript
    isSuckyOutdoors:    ep.isSuckyOutdoors    || false,
    suckyOutdoors:      ep.suckyOutdoors      || null,
```

- [ ] **Step 2: Add to patchEpisodeHistory**

After talent show patch lines, add:
```javascript
  if (ep.isSuckyOutdoors) h.isSuckyOutdoors = true;
  if (!h.suckyOutdoors && ep.suckyOutdoors) h.suckyOutdoors = ep.suckyOutdoors;
```

- [ ] **Step 3: Add badge text entries**

After talent show badge text entries, add all Sucky Outdoors event types:
```javascript
                     : evt.type === 'soNavigator'          ? (evt.badgeText || evt.badge || 'NAVIGATOR')
                     : evt.type === 'soShelter'            ? (evt.badgeText || evt.badge || 'SHELTER BUILT')
                     : evt.type === 'soFire'               ? (evt.badgeText || evt.badge || 'FIRE STARTED')
                     : evt.type === 'soProvider'            ? (evt.badgeText || evt.badge || 'PROVIDER')
                     : evt.type === 'soGhostStory'          ? (evt.badgeText || evt.badge || 'GHOST STORY')
                     : evt.type === 'soFireside'            ? (evt.badgeText || evt.badge || 'FIRESIDE')
                     : evt.type === 'soPrank'               ? (evt.badgeText || evt.badge || 'PRANK')
                     : evt.type === 'soBear'                ? (evt.badgeText || evt.badge || 'BEAR ENCOUNTER')
                     : evt.type === 'soLost'                ? (evt.badgeText || evt.badge || 'LOST')
                     : evt.type === 'soCostTribe'           ? (evt.badgeText || evt.badge || 'COST THE TRIBE')
                     : evt.type === 'soShortcut'            ? (evt.badgeText || evt.badge || 'SHORTCUT')
                     : evt.type === 'soCarried'             ? (evt.badgeText || evt.badge || 'CARRIED')
                     : evt.type === 'soSlacker'             ? (evt.badgeText || evt.badge || 'SLACKER')
                     : evt.type === 'soWanderedOff'         ? (evt.badgeText || evt.badge || 'WANDERED OFF')
                     : evt.type === 'soRainstorm'           ? (evt.badgeText || evt.badge || 'RAINSTORM')
                     : evt.type === 'soTentFire'            ? (evt.badgeText || evt.badge || 'TENT FIRE')
                     : evt.type === 'soStargazing'          ? (evt.badgeText || evt.badge || 'STARGAZING')
                     : evt.type === 'soCuddling'            ? (evt.badgeText || evt.badge || 'CUDDLING')
                     : evt.type === 'soScheme'              ? (evt.badgeText || evt.badge || 'SCHEMING')
```

- [ ] **Step 4: Add badge class entries**

After talent show badge class entries:
```javascript
                     : evt.type === 'soNavigator' || evt.type === 'soShelter' || evt.type === 'soFire' || evt.type === 'soProvider' || evt.type === 'soFireside' || evt.type === 'soShortcut' || evt.type === 'soCarried' || evt.type === 'soStargazing' ? 'gold'
                     : evt.type === 'soLost' || evt.type === 'soCostTribe' || evt.type === 'soSlacker' || evt.type === 'soPrank' || evt.type === 'soTentFire' || evt.type === 'soRainstorm' || evt.type === 'soWanderedOff' ? 'red'
                     : evt.type === 'soGhostStory' || evt.type === 'soBear' || evt.type === 'soCuddling' || evt.type === 'soScheme' ? 'gold'
```

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: sucky outdoors episode history, patchEpisodeHistory, badges"
```

---

### Task 4: VP Screen — `rpBuildSuckyOutdoors(ep)`

**Files:**
- Modify: `simulator.html` — add function before rpBuildDodgebrawl, register in buildVPScreens

- [ ] **Step 1: Add the VP function**

Place before `rpBuildDodgebrawl`. The VP renders 5 phases as click-to-reveal sections.

**Ambiance progression per phase:**
- Phase 1 (Announcement + Hike): `tod-dawn` — bright, morning, green/gold tones. Background: `linear-gradient(180deg, #1a2a1a 0%, #0f1a0f 100%)`. Accent: `#3fb950` (forest green).
- Phase 2 (Setup Camp): `tod-dusk` — late afternoon, orange/amber. Background: `linear-gradient(180deg, #2a1a0a 0%, #1a0f05 100%)`. Accent: `#f0a500` (campfire amber).
- Phase 3 (Nightfall): transition to dark — deep blue/purple. Background: `linear-gradient(180deg, #0a0a2a 0%, #050515 100%)`. Accent: `#8b5cf6` (twilight purple).
- Phase 4 (The Night): `tod-deepnight` — pitch dark, red accents for danger. Background: `linear-gradient(180deg, #0a0508 0%, #050305 100%)`. Accent: `#f85149` (danger red).
- Phase 5 (Morning Race): back to dawn — golden sunrise. Background: `linear-gradient(180deg, #2a2a0a 0%, #1a1a05 100%)`. Accent: `#f0a500` (sunrise gold).

Each phase has:
- Phase title header with icon + ambient color
- Per-event cards with portraits, narrative text, personal score badge (+X / -X)
- Lost player events: dramatic full-width red card with LOST badge
- Morning race: tribe race bars showing relative scores

Use `_tvState['so_${ep.num}']` pattern with `idx: -1`. 5 total reveals (one per phase). NEXT / REVEAL ALL sticky buttons.

**Phase headers:**
```
🥾 ANNOUNCEMENT + HIKE
🏕️ SETUP CAMP  
🌙 NIGHTFALL
🌑 THE NIGHT
🌅 MORNING RACE
```

**Final result:** Winner card with tribe color + final scores. COST THE TRIBE card if lost players caused an auto-loss.

- [ ] **Step 2: Register in buildVPScreens**

After talent show VP registration, add:
```javascript
  } else if (ep.isSuckyOutdoors && ep.suckyOutdoors) {
    vpScreens.push({ id:'sucky-outdoors', label:'The Sucky Outdoors', html: rpBuildSuckyOutdoors(ep) });
```

- [ ] **Step 3: Exclude from generic twist screen**

Add `&& t.type !== 'sucky-outdoors'` to the rpBuildPreTwist filter.

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: sucky outdoors VP screen — 5-phase ambiance-shifting click-to-reveal"
```

---

### Task 5: Text Backlog + Cold Open + Timeline Tag + Debug

**Files:**
- Modify: `simulator.html` — multiple locations

- [ ] **Step 1: Add text backlog function**

After `_textTalentShow`, add:

```javascript
function _textSuckyOutdoors(ep, ln, sec) {
  if (!ep.isSuckyOutdoors || !ep.suckyOutdoors) return;
  const so = ep.suckyOutdoors;
  sec('THE SUCKY OUTDOORS');
  ln('Overnight survival challenge — first tribe back in the morning wins.');
  Object.entries(so.navigators || {}).forEach(([tribe, nav]) => ln(`${tribe} navigator: ${nav}`));
  ['announcement', 'setupCamp', 'nightfall', 'theNight', 'morningRace'].forEach(phase => {
    const events = so.phases?.[phase] || [];
    if (!events.length) return;
    const labels = { announcement: 'HIKE', setupCamp: 'CAMP SETUP', nightfall: 'NIGHTFALL', theNight: 'THE NIGHT', morningRace: 'MORNING RACE' };
    ln('');
    ln(`── ${labels[phase] || phase} ──`);
    events.forEach(evt => {
      const scores = Object.entries(evt.personalScores || {}).map(([n, d]) => `${n}:${d > 0 ? '+' : ''}${d.toFixed(1)}`).join(', ');
      ln(`  [${evt.badge || evt.type}] ${evt.text}${scores ? ` (${scores})` : ''}`);
    });
  });
  if (so.lostPlayers?.length) {
    ln('');
    ln('LOST PLAYERS:');
    so.lostPlayers.forEach(lp => ln(`  ${lp.name} (${lp.tribe}) — lost in ${lp.lostInPhase}`));
  }
  Object.entries(so.campQuality || {}).forEach(([tribe, q]) => ln(`${tribe} camp quality: ${q.toFixed(1)}`));
  ln(`Winner: ${so.winner}. ${so.loser} goes to tribal.`);
}
```

Wire into generateSummaryText after `_textTalentShow(ep, ln, sec);`:
```javascript
  _textSuckyOutdoors(ep, ln, sec);
```

- [ ] **Step 2: Add cold open recap**

After talent show cold open recap, add:
```javascript
    if (prevEp.isSuckyOutdoors && prevEp.suckyOutdoors) {
      const _so = prevEp.suckyOutdoors;
      html += `<div class="vp-card" style="border-color:rgba(63,185,80,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#3fb950;margin-bottom:4px">THE SUCKY OUTDOORS</div>
        <div style="font-size:12px;color:#8b949e">${_so.winner} survived the night and returned first.${_so.lostPlayers?.length ? ` ${_so.lostPlayers.map(lp => lp.name).join(' & ')} got lost.` : ''}</div>
      </div>`;
    }
```

- [ ] **Step 3: Add timeline tag**

After `tsTag`, add:
```javascript
    const soTag = ep.isSuckyOutdoors ? `<span class="ep-hist-tag" style="background:rgba(63,185,80,0.15);color:#3fb950">Sucky Outdoors</span>` : '';
```

Add `${soTag}` to the tag rendering line.

- [ ] **Step 4: Add debug Challenge tab breakdown**

In the debug challenge tab, after talent show breakdown, add:
```javascript
    if (ep.suckyOutdoors?.phases) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#f0883e;margin:16px 0 8px">Sucky Outdoors — Phase Summary</div>`;
      const so = ep.suckyOutdoors;
      Object.entries(so.phases).forEach(([phase, events]) => {
        const labels = { announcement: 'Hike', setupCamp: 'Camp Setup', nightfall: 'Nightfall', theNight: 'The Night', morningRace: 'Morning Race' };
        html += `<div style="font-size:10px;font-weight:700;color:#8b949e;margin-top:6px">${labels[phase] || phase} (${events.length} events)</div>`;
        events.forEach(evt => {
          html += `<div style="font-size:9px;padding:1px 0;color:#6e7681">[${evt.badge || evt.type}] ${evt.text.substring(0, 80)}${evt.text.length > 80 ? '...' : ''}</div>`;
        });
      });
      if (so.lostPlayers?.length) {
        html += `<div style="margin-top:6px;padding:4px 8px;border-radius:4px;background:rgba(248,81,73,0.08);font-size:10px;color:#f85149">Lost: ${so.lostPlayers.map(lp => `${lp.name} (${lp.tribe})`).join(', ')}</div>`;
      }
      Object.entries(so.campQuality || {}).forEach(([tribe, q]) => {
        html += `<div style="font-size:9px;color:#6e7681">${tribe} camp quality: ${q.toFixed(1)}</div>`;
      });
    }
```

- [ ] **Step 5: Add `isSuckyOutdoors` to challenge tab button condition and `_chalType`**

Add `|| ep.isSuckyOutdoors` to the tab button condition.

Add to `_chalType`: `ep.isSuckyOutdoors ? 'Sucky Outdoors' :` in the ternary chain.

- [ ] **Step 6: Commit**

```bash
git add simulator.html
git commit -m "feat: sucky outdoors text backlog, cold open, timeline tag, debug breakdown"
```

---

### Task 6: CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add to Key Engine Functions**

After `simulateTalentShow`:
```
- `simulateSuckyOutdoors(ep)` — overnight survival challenge (pre-merge, 5 phases, personal scoring)
```

- [ ] **Step 2: Add to Core State**

After `gs._talentShowHeat`:
```
- `gs._suckyOutdoorsHeat` — temporary heat from sucky outdoors (lost players)
```

- [ ] **Step 3: Add section**

After Talent Show section:
```markdown
## The Sucky Outdoors
- Schedulable pre-merge challenge (`sucky-outdoors` in TWIST_CATALOG, category `challenge`)
- 5-phase overnight survival: announcement+hike, camp setup, nightfall, the night, morning race
- Navigator per tribe: highest `mental * 0.5 + strategic * 0.3 + intuition * 0.2`
- Camp quality: avg `(endurance + mental) / 2` — affects Phase 4 severity
- 14-19 events per tribe. Each event awards personal survival score.
- Lost player mechanic: `(10-intuition)*0.02 + (10-mental)*0.015`. Lost = -3.0 score, -5.0 tribe penalty, +2.0 heat.
- Auto-loss: if lost members arrive after all other tribes finish → tribe auto-loses regardless of score.
- Lost pair: bond >= 3 both lost → +0.3 bond (survived together), tribe penalty doubles.
- VP: `rpBuildSuckyOutdoors(ep)` — 5-phase click-to-reveal with ambiance progression (dawn→dusk→night→dawn)
- Text backlog: `_textSuckyOutdoors(ep, ln, sec)`
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add Sucky Outdoors to CLAUDE.md"
```
