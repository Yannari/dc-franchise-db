# The Theme Explainer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Big Brother season theme explain itself, so a viewer is never lost about what the season is, who is narrating it, or what changed this week.

**Architecture:** Each theme gains a `primer` block in its descriptor — authored content, one per theme. The engine renders it and NEVER branches on a theme id. Three new surfaces read it: a premiere card at week 1, a standing band on House Life every week, and a screen the week the mood turns. A fourth change fixes a live bug where two of the four themes announce their twists in a third theme's words.

**Tech Stack:** ES modules, no build step. Vitest. No new dependencies.

## Global Constraints

From `docs/superpowers/specs/2026-08-15-bb-theme-explainer-design.md` and this project's non-negotiables.

- **Everything authored lives in the descriptor. The engine never branches on a theme id.** That is what let two themes ship with zero engine changes, and it is exactly what the current announcement code gets wrong.
- **Descriptor files never import `themes.js`** — circular, and ESM hoisting puts `BB_THEMES` in the temporal dead zone. The registry imports themes; never the reverse.
- **The Pit Boss may never say "the house."** Every other surface in this simulator uses that phrase for the roster, so the High Roller's antagonist says *the floor*, *the room*, *the edge*. An existing test sweeps its voice pools for the phrase — the primer must not reintroduce it.
- **No bare `Math.random()`** anywhere. Use `stableRng(...)` with the season salt, as `themeVoice` does. A bare call breaks the seeded-replay guards.
- **Serialization:** anything stored on `week` or `gs` must survive `JSON.stringify`. No Sets, no functions.
- **Mood is a fact about a week, not about the save.** `week.themeMood` is already stamped per week (`js/bb/week.js:1251`) for this reason. Every new surface reads the week's mood, never live state — reading live state made replays of week 2 show the escalated room.
- **Every act reaches all three writers.** `summariseWeek` in `js/bb-run.js`, `js/text-backlog.js`, and `js/vp-screens.js`. `tests/bb-act-coverage.test.js` is the guard. This project has shipped a silent transcript gap once per slice for eleven slices.
- **VP standard:** CSS/SVG primitives, never emoji. Painting rules stay scoped under `.rp-page` (`tests/bb-theme-vp.test.js` enforces it for every registered theme).
- **Test command:** name the affected files — `npx vitest run tests/<file>.test.js`. NEVER `npm test`; the full suite eats memory in this repo. **Never `git stash`** — the stash stack is shared with the user's other worktrees. Kill orphaned vitest workers after the final run.

---

## File Structure

| File | Responsibility |
|---|---|
| `js/bb/themes-temptation.js`, `themes-cora.js`, `themes-mystery.js`, `themes-high-rollers.js` | **Modify.** One `primer` block each — the authored content. |
| `tests/bb-theme-primers.test.js` | **Create.** A registry guard: every registered theme has a complete, well-formed primer. |
| `js/bb/themes.js` | **Modify.** `themeTwistAnnouncement` reads `primer.announce`; a new `themePrimer()` accessor; mood-turn detection. |
| `js/bb/week.js` | **Modify.** Emit the premiere act on week 1 and the turn act when the mood actually changes. |
| `js/vp-screens.js` | **Modify.** The premiere card, the turn screen, and `_bbThemeBand` beside the existing bands. |
| `js/bb-run.js`, `js/text-backlog.js` | **Modify.** Both new acts in both writers. |

---

### Task 1: The primers

**Files:**
- Modify: all four `js/bb/themes-*.js` descriptors
- Create: `tests/bb-theme-primers.test.js`
- Modify: `js/bb/themes.js` (add the `themePrimer()` accessor)

**Interfaces:**
- Produces: `primer` on every descriptor, and `themePrimer() -> primer|null` from `js/bb/themes.js`.

The shape, identical for all four:

```js
primer: {
  what:  'One paragraph — what this season is.',
  who:   'Who the antagonist is, and what it wants.',
  rules: ['A rule this season adds, in plain language.', '…'],   // 2-5 entries
  watch: 'What to watch for as it goes on.',
  register: { neutral: 'One line naming the opening register.',
              hostile: 'One line naming what it becomes.' },
  turn:  { headline: 'SHORT, UPPER CASE',
           body: 'What changed, and what it means from here.' },
  announce: ['…{detail}', '…{detail}', '…{detail}', '…{detail}'],  // 4+, each contains {detail}
}
```

- [ ] **Step 1: Write the failing test**

Create `tests/bb-theme-primers.test.js`:

```javascript
// A theme that cannot explain itself is a theme the viewer is lost inside.
import { describe, expect, it } from 'vitest';
import { BB_THEMES, THEME_LIST } from '../js/bb/themes.js';

describe('every registered theme explains itself', () => {
  for (const id of THEME_LIST) {
    const theme = BB_THEMES[id];

    describe(id, () => {
      const p = () => theme.primer;

      it('has a primer', () => {
        expect(p()).toBeTruthy();
      });

      it('says what the season is, who is running it, and what to watch', () => {
        for (const field of ['what', 'who', 'watch']) {
          expect(typeof p()[field], `${field} is prose`).toBe('string');
          // Long enough to be an explanation rather than a label.
          expect(p()[field].length, `${field} is too short to explain anything`)
            .toBeGreaterThan(80);
        }
      });

      it('lists the rules this season adds', () => {
        expect(Array.isArray(p().rules)).toBe(true);
        expect(p().rules.length).toBeGreaterThanOrEqual(2);
        for (const r of p().rules) expect(r.length).toBeGreaterThan(20);
      });

      it('names both registers and the turn between them', () => {
        expect(p().register.neutral.length).toBeGreaterThan(10);
        expect(p().register.hostile.length).toBeGreaterThan(10);
        expect(p().turn.headline).toBe(p().turn.headline.toUpperCase());
        expect(p().turn.headline.length).toBeGreaterThan(3);
        expect(p().turn.body.length).toBeGreaterThan(40);
      });

      it('gives the antagonist its own words for announcing a rule', () => {
        expect(p().announce.length).toBeGreaterThanOrEqual(4);
        for (const line of p().announce) {
          expect(line, 'every announce line carries the rule').toContain('{detail}');
        }
      });

      it('never speaks in another theme\'s voice', () => {
        const mine = JSON.stringify(p()).toLowerCase();
        const others = THEME_LIST.filter(o => o !== id)
          .map(o => BB_THEMES[o].antagonist?.name)
          .filter(Boolean);
        for (const name of others) {
          expect(mine, `${id}'s primer names ${name}`).not.toContain(name.toLowerCase());
        }
      });
    });
  }

  it('never lets the High Roller\'s antagonist say "the house"', () => {
    // The roster owns that phrase. Every other surface in this simulator uses
    // it for the houseguests, so the Pit Boss says the floor, the room, the edge.
    const p = BB_THEMES['high-rollers'].primer;
    expect(JSON.stringify(p).toLowerCase()).not.toMatch(/\bthe house\b/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/bb-theme-primers.test.js`
Expected: FAIL — no theme has a `primer`.

- [ ] **Step 3: Write the four primers**

Read each descriptor's existing header comment first — every one of them already explains why its season is the way it is, in prose, to a reader. The primer is that explanation aimed at the VIEWER instead of the next engineer. Write each in its own antagonist's register; do not write four variations of one voice.

The four, and what each has to get across:

- **`summer-of-temptation`** — the Den. An offer a week, and somebody else pays for it. The turn: the offers stop being free.
- **`machine-summer`** — CORA, an AI that runs the house helpfully and then stops helping. The turn is a heel turn: the same voice, no longer on your side.
- **`summer-of-mystery`** — the Mastermind, an author inside the season who took the host on night one and comes back to run the endgame himself. The turn is an escalation in AUTHORITY, not mood.
- **`high-rollers`** — the Pit Boss, working the floor for The House. The season runs on money: the audience pays every week, it carries over, and the payout is announced so the room learns who the audience loves. The turn is not anger, it is accounting.

`rules` must be TRUE of what the engine does. Read each theme's `arc` and, for High Roller's, `js/bb/bb-bucks.js` and `js/bb/high-rollers-room.js`. Do not promise a mechanic the season does not run — a generated sentence the mechanics do not honour is this project's defining bug class and has cost three fix rounds on this very theme already.

Add to `js/bb/themes.js`:

```javascript
/** The season's own explanation of itself, or null when unthemed. */
export function themePrimer() {
  return currentTheme()?.primer || null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/bb-theme-primers.test.js tests/bb-themes.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/bb/themes-*.js js/bb/themes.js tests/bb-theme-primers.test.js
git commit -m "feat(bb): every theme can now say what it is"
```

---

### Task 2: The announcement voice — a live bug

**Files:**
- Modify: `js/bb/themes.js` (`themeTwistAnnouncement`, ~line 685)
- Test: `tests/bb-theme-primers.test.js` (extend)

`themeTwistAnnouncement` currently hardcodes its phrasing:

```javascript
const pools = theme.id === 'machine-summer' ? [ …CORA lines… ] : [ …Den lines… ];
```

So **two of the four themes announce their twists in the Den's words** — a Summer of Mystery season says "the Den has changed the terms of this week" over a hotel, and High Roller's says it over a casino. This is precisely the recurring bug class `CLAUDE.md` opens with: one show's vocabulary printed over another's.

- [ ] **Step 1: Write the failing test**

Append to `tests/bb-theme-primers.test.js` a test that, for every registered theme, calls `themeTwistAnnouncement` with a stub announcement and asserts the returned line is drawn from THAT theme's `primer.announce` — and specifically that a non-Den theme's line does not contain another theme's antagonist name.

You will need a themed season in `gs` for `currentTheme()` to resolve, and a matching entry in `seasonConfig.twistSchedule` tagged `source: 'theme'` for the ownership check inside the function — read the function first and set up exactly what it requires.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/bb-theme-primers.test.js`
Expected: FAIL — Mystery and High Roller's speak in the Den's words.

- [ ] **Step 3: Replace the hardcoded pools**

Draw from `theme.primer.announce`, interpolating `{detail}` with the existing `detail` string. Keep the existing seeding (`stableRng('theme-twist-announcement', …)`) and the existing ownership guard — this task changes WHERE the words come from and nothing else. A theme with no `announce` pool returns null rather than falling back to another theme's words.

- [ ] **Step 4: Verify**

Run: `npx vitest run tests/bb-theme-primers.test.js tests/bb-themes.test.js tests/bb-theme-temptation.test.js tests/bb-theme-machine.test.js tests/bb-theme-mystery.test.js`
Expected: PASS. The per-theme suites matter here — they may assert on the old hardcoded strings.

- [ ] **Step 5: Commit**

```bash
git add js/bb/themes.js tests/bb-theme-primers.test.js
git commit -m "fix(bb): a hotel no longer announces its twists in the Den's words"
```

---

### Task 3: The premiere card

**Files:**
- Modify: `js/bb/week.js` (emit the act on week 1), `js/vp-screens.js`, `js/bb-run.js`, `js/text-backlog.js`
- Test: `tests/bb-theme-primers.test.js` (extend), `tests/bb-act-coverage.test.js` (existing guard)

One screen at the season's first week: the theme's name and tagline, the antagonist introduced by name and nature (`who`), what the season is (`what`), the rules it adds (`rules`), and what to watch for (`watch`). **This is the screen that answers "what is a Pit Boss."**

The act: `{type: 'theme-primer', week: 1, themeId, name, tagline, primer, mood, players: [], beats: []}`.

Emit it in `js/bb/week.js` beside the existing theme handling (~line 1244, where `advanceThemeArc` runs and `week.themeMood` is stamped), gated on: a theme is installed, and this is the season's first week. Use the same calendar-week discipline the rest of the file uses — `week.themeWeek` is already computed there and is the right number to test, not `week.num`.

- [ ] **Step 1: Write the failing test** — a themed season emits exactly one `theme-primer` act, on week one only, and an unthemed season emits none.
- [ ] **Step 2: Run to verify it fails.**
- [ ] **Step 3: Emit the act, then handle it in all three writers.** Read the `bb-bucks` cases as the freshest precedent for all three; use each file's real helpers. The VP screen uses the current theme's palette tokens (`var(--bbx-key)` etc.) so it flips with the mood like every other screen — do NOT hardcode hexes, which cost a fix round on the room screen.
- [ ] **Step 4: Verify** — `npx vitest run tests/bb-theme-primers.test.js tests/bb-act-coverage.test.js tests/bb-theme-vp.test.js`
- [ ] **Step 5: Commit** — `feat(bb): a card that says what season you are watching`

---

### Task 4: The standing band

**Files:**
- Modify: `js/vp-screens.js` (add `_bbThemeBand`, draw it at the House Life site ~line 16652)
- Test: `tests/bb-theme-primers.test.js` (extend)

Four short facts, every week, modelled on the neighbouring `_bbPowerBand` and `_bbChipBand`:

1. who is running this season (antagonist name + theme name)
2. what register they are in **right now** — `primer.register[week's mood]`
3. what the theme has done so far
4. what it has booked next

Items 3 and 4 are DERIVED from the schedule, never authored: read the season's `twistSchedule` entries tagged `source: 'theme'` and split them on the current week. They cannot drift because nothing writes them by hand.

Return `''` when there is no theme, so an unthemed season renders exactly as it does today.

**Weight note, raised with the user and unresolved:** on a High Roller's week House Life now carries the power band, the chip band and this. If it reads heavy, this is the one to compress to a single line plus the register. Build it compact from the start.

**Privacy:** this band must never show a balance — that rule belongs to the chip band's data and is enforced by convention only.

- [ ] **Step 1: Write the failing test** — the band names the antagonist and the week's register; a week-2 replay of a season that turned hostile in week 6 shows the NEUTRAL register (it reads `week.themeMood`, not live state); an unthemed season renders no band.
- [ ] **Step 2: Run to verify it fails.**
- [ ] **Step 3: Build it.** Escape names with `_bbEsc`. Read the mood off the episode, never off `themeState()`.
- [ ] **Step 4: Verify** — `npx vitest run tests/bb-theme-primers.test.js tests/bb-theme-vp.test.js`
- [ ] **Step 5: Commit** — `feat(bb): a standing band saying where the season stands`

---

### Task 5: The turn

**Files:**
- Modify: `js/bb/themes.js` (report whether the mood actually changed), `js/bb/week.js`, `js/vp-screens.js`, `js/bb-run.js`, `js/text-backlog.js`
- Test: `tests/bb-theme-primers.test.js` (extend), `tests/bb-act-coverage.test.js`

Today the single most important thing a theme does is **invisible**. `advanceThemeArc` (`js/bb/themes.js:603`) calls `setThemeMood` silently; the room simply starts sounding different and nothing says why.

Give it a screen the week it happens: `primer.turn.headline`, `primer.turn.body`, and the two registers shown side by side so the change is legible.

The act: `{type: 'theme-turn', week, themeId, speaker, from, to, headline, body, registers: {from, to}, players: [], beats: []}`.

`advanceThemeArc` must report whether the mood CHANGED, not merely what it is — a theme whose arc books the same mood twice (High Roller's books `hostile` at both `frac: 0.55` and `fromEnd: 8`, deliberately) must announce the turn ONCE. Compare the mood before and after and emit only on a real transition.

- [ ] **Step 1: Write the failing test** — a themed season emits exactly ONE `theme-turn` act across a full season even though High Roller's arc carries two hostile anchors; the act's `from`/`to` are the real registers; an unthemed season emits none.
- [ ] **Step 2: Run to verify it fails.**
- [ ] **Step 3: Implement**, then handle the act in all three writers.
- [ ] **Step 4: Verify** — `npx vitest run tests/bb-theme-primers.test.js tests/bb-act-coverage.test.js tests/bb-themes.test.js tests/bb-theme-vp.test.js`
- [ ] **Step 5: Commit** — `feat(bb): the night the register changes says so`

---

## Self-review notes

- **Spec coverage:** §1 the premiere card → Task 3. §2 the standing band → Task 4. §3 the turn → Task 5. §4 the announcement bug → Task 2. §5 four primers → Task 1. "Both transcripts" → Tasks 3, 4 and 5, each guarded by `bb-act-coverage`.
- **Interface consistency:** `primer` and `themePrimer()` are defined in Task 1 and consumed by Tasks 2-5. Act type strings are `theme-primer` (Task 3) and `theme-turn` (Task 5), used under those names in the writers.
- **Ordering rationale:** Task 1 first because everything reads the primer; Task 2 second because it is small and fixes a bug live on `main` today.
- **Known soft spot:** Tasks 3-5 tell the implementer to match the neighbouring `bb-bucks` cases rather than quoting all three switch statements, because those files are large and their real helper names must be read from source. Each step names the file and the anchor.
