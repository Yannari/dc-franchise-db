# Camp Castaways — Re-Audit (v2, post-update)

**Date:** 2026-04-17
**File audited:** `js/chal/camp-castaways.js` (2033 lines, was 1718)
**Commits since v1:** `23b5bae` (VP three-mode identity), `bb181f0` `6a8d0bb` `593bdc5` (dedup), `282136e` (test).
**Overall verdict:** Every defect from v1 is addressed or closed. The challenge is now **functionally sound and on-par with siblings**. Remaining issues are smaller: some dead pools, a handful of tape-numbering inconsistencies, and one duplicate-reveal where the winner is announced twice. Balance is dramatically better.

---

## 1. v1 defects — status

| v1 finding | Status | Notes |
|---|---|---|
| 1A Broken `_ccReveal` | **FIXED** | Replaced with inline `_ccInlineReveal` (L1700–1707) using the Lucky-Hunt pattern. Assigns `vpCurrentScreen` directly, calls `renderVPScreen()`, preserves scroll via `.rp-main`. Correct. |
| 1B Dead `_fireWildlifeEvent` | **FIXED** | Removed. |
| 1C No-op line 478 | **FIXED** | Removed. |
| 1D Playback clobber | **FIXED** | Now `unshift` with `pop` cap (L1177–1180). |
| 1E Unused `total` param on reveal | **FIXED** | Reveal uses inline JS now; no longer relevant. |
| 2A Boldness dominance in Phase 4 | **FIXED** | Charge capped at +1.5 (was +2.0). Added: Navigator (intuition, L1111), Tactician (strategic, L1120), Negotiator (social, L1143), Finisher (endurance≥7, L1213), Reveal skeptic bonus for mental≥7 (L1201). Every primary stat now has a Phase-4 upside. |
| 2B War Party always fires | **FIXED** | 0.55 gate + Stealth Approach alternative for intuition players (L1063–1078). |
| 2C "Nearby" slice(0,3) | **FIXED** | Now uses `rafterGroup.filter(p !== rafter)` (L1015–1017). |
| 2D Discovery/WarPaint double-dip | **FIXED** | Discoverer excluded from war-paint cohort (L1064). |
| 2E goat archetype bucketing | **FIXED** | Comment confirms goat intentionally falls through to 'default' (L347). |
| 2F Mr. Coconut no cooldown | **FIXED** | `gs._lastCoconutEp` 2-episode gap per player (L961–976). |
| 2H Sleep-talk heat target | **FIXED** | Heat now targets the named groupmate, not the sleeper (L767–771). |
| 3A Three-mode identity not *felt* | **MOSTLY FIXED** | Added Monitor Wall frame (L1709–1714), mode-entry animations (L1573–1591), VHS replay panel (L1593–1606), `prefers-reduced-motion` (L1611–1615). It now has a shared narrative container. Remaining shortfall: tape numbering is inconsistent (see 4A below). |
| 3B Single VP push with same id | **FIXED** | Six screens pushed individually from vp-screens.js (L10280–10287) with distinct ids: `cc-flood`, `cc-group-<label>`, `cc-night`, `cc-regroup`, `cc-storm`, `cc-immunity`. |
| 3C Glitch transition stale | **PARTIALLY FIXED** | Still declared but no longer appears between screens (each `rpBuildCC*` is its own screen). Helper `_glitchTransition` (L1619) is now unused — dead code. |
| 3F Phase-0 timestamp math | **FIXED** | `_floodTs(i)` helper with proper modulo (L1719–1722). |
| 3E `typeof rpPortrait === 'function'` fragility | **UNCHANGED** | Still uses bare-name typeof. Not a regression; other challenges do the same. |

**13 of 14 substantive v1 defects closed.** One (3C) is a minor loose end.

---

## 2. New content added (positive observations)

- **Phase 1** hugely expanded: per-archetype confessionals (9 buckets, L142–183), survival activity beats (L457–489, gates by top stat), water gathering (L659–671), pair bonding (L673–686), intel share (L1022–1031).
- **Phase 2** expanded: snoring, quiet moment, late-night strategy whisper, night fright, conspiracy theory, dawn watch (L884–959). Each has distinct archetype/stat targeting.
- **Phase 3** expanded: strategy consolidation (L1051–1059), stealth-approach alternative to war party (L1070–1077), cross-group shared suffering cap (L1033–1049).
- **VP**: monitor-wall frame, mode-entry animations, VHS replay panel with sepia/hue-rotate tint and tracking animation, reduced-motion fallback.
- **Reveal-all button** on every screen (L1746, 1783, 1828, 1862, 1908, 1949) — good UX.

The file is materially better than v1. Everything below is finish-level.

---

## 3. 🔴 New bugs (not present in v1)

### 3A. Duplicate winner reveal — `timeline.push({type:'immunityReveal', phase:4, ...})` at L1233

The immunity-reveal event is pushed into `timeline` with `phase: 4`. `_buildStormScreen` filters `e.phase === 4` (L1874) and renders every Phase-4 event. So the Storm surveillance screen will display the "🏆 IMMUNITY goes to X" card at the end. Then the *next* screen (`cc-immunity`) announces the same winner again on the Broadcast screen.

**User experience:** winner reveal → walk of shame → winner reveal again. Anti-climactic.

**Fix:** either (a) give `immunityReveal` a distinct phase (`phase: 5`) and filter it out of `_buildStormScreen`, or (b) don't push it to `timeline` at all — let `_buildImmunityScreen` synthesize the broadcast card from `cc.immunityWinner`.

### 3B. `_buildColdOpen` signature mismatch — L1970

```js
return `<style>${CC_STYLES}</style><div class="rp-page">`
  + _buildColdOpen(cc, ep, stateKey, 'cc-flood', tapeTotal) + `</div>`;
```

`_buildColdOpen(cc, ep, stateKey, screenId)` only accepts 4 params (L1724). The 5th arg `tapeTotal` is silently ignored. Inside the builder, line 1732 hardcodes `_monitorWall('sv', 'PHASE 0 — THE FLOOD', 1, 6)` — fixed `6` regardless of group count.

**Consequence:** with 3 groups, `tapeTotal` should be 8, but Flood always shows "TAPE 1/6". Other screens show the correct dynamic total → Flood's "1/6" contradicts, say, Group A's "2/6" which is fine, but Night's "4/5" when there are 2 groups → the user sees "1/6 → 2/5 → 3/5 → 4/5 → ..." — the denominator jumps.

**Fix:** add `tapeTotal` param to `_buildColdOpen`; replace hardcoded `6` with `tapeTotal`.

### 3C. Tape-numbering arithmetic is inconsistent across screens

Walking through with `nGroups = 2`:

| Screen | `tapeNum` formula | `tapeTotal` formula | Shown |
|---|---|---|---|
| Flood | hardcoded 1 | hardcoded 6 | 1/6 |
| Group A | `2 + groupIdx` = 2 | `3 + nGroups` = 5 | 2/5 |
| Group B | 3 | 5 | 3/5 |
| Night | `2 + nGroups` = 4 | `3 + nGroups` = 5 | 4/5 |
| Regroup | `3 + nGroups` = 5 | `3 + nGroups` = 5 | 5/5 |
| Storm | `4 + nGroups` = 6 | `5 + nGroups` = 7 | 6/7 |
| Immunity | `5 + nGroups` = 7 | `5 + nGroups` = 7 | 7/7 |

The denominator goes **6 → 5 → 5 → 5 → 5 → 7 → 7**. User sees "the tape got longer" at Storm.

**Correct total:** `5 + nGroups` (flood + N groups + night + regroup + storm + immunity = N+5).

**Fix:** all screens should use `tapeTotal = 5 + nGroups`. Fix each per-screen `rpBuildCC*` wrapper.

### 3D. `CONFESSIONAL_TEXTS.mastermind` is unreachable — L147

```js
const bucket = VILLAIN_ARCHETYPES.includes(arch) ? 'villain'
  : arch === 'mastermind' ? 'mastermind'
```

`VILLAIN_ARCHETYPES = ['villain', 'mastermind', 'schemer']` (L8) — so `mastermind` matches the first ternary and returns `'villain'`. The `mastermind` branch is dead. The pool `CONFESSIONAL_TEXTS.mastermind` (two functions, L147–150) is never read.

**Fix:** either move the mastermind check above the VILLAIN_ARCHETYPES check, or delete the pool.

### 3E. `CONFESSIONAL_TEXTS.loyal` is unreachable — L163

No branch in the confessional bucket ternary maps to `'loyal'`. `loyal-soldier` goes into `hero` (L447 via `['hero','loyal-soldier']`). The pool at L163–166 is dead.

**Fix:** add `arch === 'loyal-soldier' ? 'loyal'` branch (before the hero check) or delete the pool.

### 3F. `evt.callbackType` read but never written — L1898, L1902

```js
if (evt.isPlayback && evt.origEventText) {
  html += `...⏪ VHS RECALL — ${(evt.callbackType || 'FOOTAGE').toUpperCase()}...`;
```

The playback event is created at L1194:
```js
timeline.push({ type: 'stormEvent', subtype: 'playback', ..., flagType: flag.type, reactionType: flag.reactionType, origEventText: origEvent?.text || flag.text });
```

No `callbackType` field is set. The label always prints "VHS RECALL — FOOTAGE". Either plumb `callbackType: flag.type` through or rename the read to `evt.flagType`.

---

## 4. 🟠 Design / polish issues (smaller than v1)

### 4A. Endurance bonus spams duplicate cards — L1213–1218

```js
activePlayers.forEach(name => {
  if (pStats(name).endurance >= 7) {
    personalScores[name] += 0.8;
    timeline.push({ ... text: `Chris grudgingly notes ${name}'s consistent performance. "Fine. You earned it."`, ... });
  }
});
```

If 4 players have endurance ≥ 7, Phase 4 gets four identical "Chris grudgingly notes…" cards in a row. Flat.

**Fix:** aggregate into a single card — `"Chris grudgingly nods at A, B, C, D for keeping pace."` — or vary the text per player.

### 4B. `badges` dict initialized but never populated — L410, L1257

`const badges = {};` declared, passed to `ep.campCastaways.badges` unchanged. Either populate it (index badges by event type for fast VP lookup) or delete it.

### 4C. Dead helper `_glitchTransition` — L1619–1625

After splitting into six screens, no caller invokes `_glitchTransition`. Delete.

### 4D. Unused color palette constants — L1372–1383

`SV_BG`, `SV_GREEN`, … `BC_ALERT` — 12 constants declared, zero references. All colors are hardcoded inside `CC_STYLES`. Delete or actually use them (via `style=""` overrides).

### 4E. Legacy `rpBuildCampCastaways` alias — L2031

```js
export function rpBuildCampCastaways(ep) { return rpBuildCCFlood(ep); }
```

Imported in vp-screens.js L9 but never called (the six split exports are used instead). Delete the import and delete this alias, OR remove from vp-screens.js import list. One line either way.

### 4F. Vestigial `eventCount`/`fired` budget — L436, L492, L519, L547, L633, L649, L660, L675, L709, L722

Phase 1 computes `eventCount = Math.max(10, group.length * 2 + 4)` then guards many sub-sections with `fired < eventCount`. However:
- Confessionals + survival activities (L440–489) bypass the guard ("always fire — no fired guard").
- `eventCount ≥ 10` for any 2+-person group, while total guarded sections max out at ~7. The guard never triggers.

**Either** remove the budget entirely (cleaner) **or** lower `eventCount` so it actually shapes output. Currently it's a vestigial scaffold.

### 4G. CSS re-injected per screen

Each `rpBuildCC*` prepends `<style>${CC_STYLES}</style>`. Six copies of ~15KB CSS per VP load. Other challenges may do the same, but at this file's size the duplication is notable.

**Fix:** single shared `<style>` in one place (e.g. the first screen only) + use a `document.getElementById('cc-styles')` guard. Or accept as-is — browsers dedupe-parse identical stylesheets.

### 4H. Monitor Wall phase labels on Group screens say "PHASE 1 — GROUP A" but the body also says "PHASE 1 — SCATTERED" two lines down (L1766–1768). Redundant. Minor.

### 4I. Immunity reveal score bar uses fixed range — L1691

```js
const barPct = Math.max(5, Math.min(100, ((evt.score + 5) / 20) * 100));
```

Assumes scores fit roughly in [-5, +15]. With the expanded Phase 1–3 content and new bonuses, top scores can exceed +15 (seen in testing? verify). If a player hits +18, the bar still caps at 100%. Acceptable — but consider normalizing to the actual score range instead of a fixed [-5, 15].

### 4J. Mental skeptic bonus overshoots vs Reveal narrative — L1201–1210

Every non-mental-≥7 player gets −0.3 at the Reveal. Combined with the new Phase-4 stat-spread bonuses, low-mental players take a stacking penalty (they already missed skeptic + maybe navigator + maybe tactician). With Reveal's −0.3 + Mr. Coconut's -2.0 available to the same archetypes, a low-mental/low-temperament player can dig a −3 hole before counting anything else.

Watch the score distribution in testing to make sure bottom-of-pack players aren't deterministic.

---

## 5. 🟢 What works well

- Mode-entry animations (cc-sv-enter, cc-diary-enter, cc-bc-enter) give each mode a distinct *arrival*.
- VHS replay panel visually cites the earlier diary moment — this is the callback the v1 Phase 4 was missing.
- Monitor Wall frame with mode label + phase label + tape counter gives a persistent "Producer's Monitor Wall" container — the three-mode journey now reads as one show.
- `prefers-reduced-motion` correctly collapses all mode animations.
- Archetype-aware confessionals give every cast member a distinct voice in Phase 1.
- Phase-4 stat-spread bonuses (Navigator/Tactician/Negotiator/Finisher/Skeptic) make boldness one stat among many.
- Mr. Coconut cooldown prevents repeat-target syndrome.
- `_tvState` correctly shared via `window._tvState = vpScreensMod._tvState` in main.js (L139). The inline reveal handler pattern is identical to Lucky Hunt.

---

## 6. Line-number quick reference (v2)

| Concern | Severity | Lines |
|---|---|---|
| Duplicate winner reveal (Storm + Immunity) | 🔴 high | L1233, L1874 |
| `_buildColdOpen` tape-total hardcoded | 🔴 high | L1732, L1970 |
| Tape denominator inconsistency | 🔴 med | L1969, L1981, L1993, L2004, L2015, L2026 |
| Unreachable mastermind confessionals | 🔴 low | L147, L444 |
| Unreachable loyal confessionals | 🔴 low | L163 |
| `callbackType` never set | 🔴 low | L1194, L1898, L1902 |
| Endurance bonus card spam | 🟠 low | L1213–1218 |
| Unused `badges` dict | 🟠 trivial | L410, L1257 |
| Dead `_glitchTransition` | 🟠 trivial | L1619 |
| Unused color constants | 🟠 trivial | L1372–1383 |
| Legacy alias + import | 🟠 trivial | L2031, vp-screens.js:9 |
| Vestigial `eventCount` budget | 🟠 low | L436 + guards |
| CSS duplicated per screen | 🟡 perf | each `rpBuildCC*` |

---

## 7. Recommendation

**Ship Layer 1' — post-update correctness fixes (~1hr):**

1. Move `immunityReveal` off `phase: 4` (or strip from timeline entirely) to end the double-reveal.
2. Thread `tapeTotal` through `_buildColdOpen` + make every per-screen wrapper use `tapeTotal = 5 + nGroups`.
3. Fix or delete unreachable `mastermind` / `loyal` confessional pools.
4. Set `callbackType: flag.type` on playback events OR rename the read.
5. Delete: `_glitchTransition`, unused color constants, `badges` dict, `rpBuildCampCastaways` alias + import.

After that, the challenge is honestly in a good place. Layer 2 (balance fine-tuning — 4A, 4J — requires simulating a season and measuring) can wait until you've played a few episodes and have data.

The three-mode identity is working now. Don't touch it further unless the tape-numbering fix reveals something else.
