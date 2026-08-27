# Task 5 report — wiring the three dead anti-repetition guards into content

**Status: COMPLETE.** `npx vitest run tests/tr-*.test.js` 256 → **264 green**;
`npm run audit:tr-castle` **5 green**. No band widened, no floor lowered, no
guard deleted. The 164 pinned (event, branch) pairs are unchanged — none
vanished, none appeared.

Base for every number below is `b1417720`, measured by copying `js/tr/castle/*.js`
aside, `git checkout -- js/tr/castle/`, measuring, and copying back. **No stash,
no `reset --hard`, no `git add -A`.**

---

## What shipped

`acts:` 2/98 → **19/98**. `oncePerSeason` 0 → **1**. `ev.cooldown` 0 → **3**.

Three tone profiles, from spec §5.4.3's own words, applied where the tone is
true rather than where it would be convenient:

| tone | spec words | profile | events |
|---|---|---|---|
| OPENING | "early: broad, social, thread-opening" | `{early:1.6, late:0.5}` | `callback-recognized`, `callback-no-history-envy`, `susp-misread-tell`; `callback-warns-newbies` at `{2, 0.4}`; `trust-circle-forms` `{1.4,1.2,0.5}`; `romance-comfort-after-loss-sparks` `{1.3,1.2,0.5}` |
| TESTING | "middle: testing, doubting, thread-advancing" | `{early:0.7, middle:1.4, late:0.8}` | `susp-noticed-inconsistency`, `testing-reverse-psychology`, `testing-ask-for-alibi-check`, `testing-double-check-story`; `cover-suspect-own-ally` `{0.6,1.5,0.7}` |
| CLOSING | "late: paranoid, surgical, thread-closing, counting arguments" | `{early:0.5, late:1.7}` | `grief-headcount`, `romance-protection-instinct`; `romance-strategic-optics` `{0.5,1.6}`; `grief-castle-in-view` `{0.6,1.5}`; `trust-settled-on-the-way-back` `{0.7,1.5}`; `romance-liability-exposed` `{0.4,2.5}`; `trust-late-checkin` widened from the pre-existing `{late:1.5}` to `{0.6,1.5}` |

`oncePerSeason` on **`grief-numb-to-it-now`**, under a stated rule: *the
sentence asserts something about the CASTLE crossing a line, not about the two
people in the scene.* A room goes numb once; a second pair discovering, in the
same season, that the empty chair has stopped registering makes the first
telling untrue. Deliberately NOT applied to `grief-empty-chair`,
`grief-headcount`, `grief-toast-to-them` or `romance-showmance-forms`, which are
about this victim / this morning / this couple and are meant to recur.

`ev.cooldown` on the three places the 2/3/5 defaults are wrong:
`susp-heard-in-the-corridor` `{player:5}` and `grief-shorter-column`
`{event:3, player:5}` — the pool's two runaway events (935 and 878 firings per
400 seasons, up to five in one) — and `susp-misread-tell` `{event:3}`, which I
added only after reading a dumped season (below).

---

## Tests, and the mutation that proves each

Two files. `tests/tr-castle.test.js` gets the DECLARATION rules (it is the file
that holds rules over the whole event pool); `tests/tr-castle-reachability.test.js`
gets the SEASON rules (it is the file that plays 400 seasons and, unlike
`tr-castle-audit.test.js`, is collected by `npm test`).

| test | mutation applied | result |
|---|---|---|
| `content actually declares all three anti-repetition guards, not just the engine` (tr-castle) | deleted the only `oncePerSeason: true,` from `js/tr/castle/grief.js` | **RED** (`oncePerSeason 0 < 1`) — also reddened the season rule below |
| `every declared 'acts' profile is well formed and actually tilts` (tr-castle) | `acts: { early: 0.5, late: 1.7 },` → `acts: { early: 1, middle: 1, late: 1 },` in grief.js | **RED** ("a flat profile is a no-op wearing the shape of a pacing decision") |
| `every 'cooldown' override is a PARTIAL over the three real scopes` (tr-castle) | `cooldown: { player: 5 },` → `cooldown: 5,` in suspicion.js | **RED** |
| `THE ONCE-PER-SEASON RULE` (reachability) | in `js/tr/events.js`, deleted `if (ev.oncePerSeason) return true;` from `_onCooldown` | **RED** — 8 of 400 seasons fire it twice. `tr-events.test.js`'s own unit went red too, which is the point: one is the engine, this is the game |
| `THE ACT-PACING RULE` (reachability) | in `js/tr/events.js`, `const actMult = ev.acts?.[ctx.act] ?? 1;` → `const actMult = 1;` | **RED** — geometric mean prints exactly `1.000x`, `0 of 19` moved |
| `no event fires again on the same PLAYER inside its player-scope cooldown` (reachability) | `const playerWindow = ev.cooldown?.player ?? PLAYER_COOLDOWN_EPS;` → `= 0;` | **RED** — and the EVENT-scope arm stayed GREEN, which is the isolation the unequal 2/3/5 defaults exist to give |
| `the two declared cooldown overrides are the reason a gap is wider than the default` | same `playerWindow = 0` mutation | **RED** |

Also added: a PAIR-scope arm of the cooldown sweep (the sweep checked event
scope only, so two of the three scopes had no season-level check at all).

### The act test needed a control arm, and this is why

The brief's literal test — "an act-tagged event's share of firings differs
between early and late" — is **unfailable against this pool**, and the reason is
the whole point of the declaration: a tag gets written where the tone already
belongs, so the event was already act-skewed by its own `weight()` before
anything was declared. `callback-recognized` reads 233/134/68 with no tag at
all, because you can only clock somebody from a previous season once. Flatten
every multiplier to 1 and that assertion stays green.

So the shipped test plays a **second 400 seasons on the same seeds with
`ev.acts` deleted from every event**, and measures the tag's contribution
against it — Plan 5's "measure against an uninformative control, never a base
rate", in-suite. Per tagged event: its share of its own WINDOW's firings in the
act its profile favours most over the act it favours least, Laplace-smoothed,
live arm over control arm.

```
=== ACT TILT vs ACTS-STRIPPED CONTROL (400 seasons each arm) ===
   0.950x  late>early     26 firings  romance-liability-exposed
   1.131x  late>early    620 firings  grief-headcount
   1.155x  late>early    115 firings  trust-settled-on-the-way-back
   1.276x  middle>early    7 firings  cover-suspect-own-ally
   1.288x  late>early    100 firings  grief-numb-to-it-now
   1.298x  late>early     48 firings  romance-protection-instinct
   1.448x  middle>early  201 firings  testing-reverse-psychology
   1.452x  early>late    355 firings  susp-misread-tell
   1.482x  late>early    140 firings  grief-castle-in-view
   1.559x  middle>early  379 firings  testing-ask-for-alibi-check
   1.620x  middle>early  274 firings  susp-noticed-inconsistency
   1.645x  late>early     99 firings  trust-late-checkin
   1.730x  middle>early  249 firings  testing-double-check-story
   1.861x  early>late    459 firings  callback-recognized
   2.103x  early>late    286 firings  callback-no-history-envy
   2.249x  early>late     25 firings  callback-warns-newbies
   2.282x  late>early     36 firings  romance-strategic-optics
   2.306x  early>late     19 firings  trust-circle-forms
   3.191x  early>late      8 firings  romance-comfort-after-loss-sparks
   geometric mean 1.613x; 18 of 19 tagged events moved >5%
```

Banded at `> 1.30` and `>= 75% of tagged events move`. Under the mutation both
arms are the same 400 seasons, so every gain is exactly 1.000.

The one that does not move, `romance-liability-exposed`, is state-gated to zero
`early` firings in **both** arms, so no multiplier on `early` can reach it. Said
out loud in the test rather than excluded quietly.

---

## Base vs head — the WHOLE distribution, not just what I touched

400 seeded seasons, identical fixture, identical seeds.

```
TOTALS   firings 18448 -> 19015  +3.1%
         threads opened 12086 -> 12348  +2.2%
         threads closed  1316 ->  1341  +1.9%
         beats          18282 -> 18863  +3.2%

WINDOW                              FAMILY
  dawn          3589 ->  3691  +2.8%   callback   1664 -> 1744  +4.8%
  morning       3172 ->  3252  +2.5%   testing    2360 -> 2432  +3.1%
  journey-out   3239 ->  3214  -0.8%   suspicion  4156 -> 4341  +4.5%
  night         2517 ->  2583  +2.6%   grief      4447 -> 4411  -0.8%
  evening       2631 ->  2834  +7.7%   cover      3231 -> 3396  +5.1%
  after-table   2083 ->  2189  +5.1%   trust      1707 -> 1785  +4.6%
  journey-back  1217 ->  1252  +2.9%   romance     883 ->  906  +2.6%

branches: 164 -> 164, none vanished, none appeared
rarest EVENT:  9 -> 7      rarest BRANCH: 5 -> 5
```

Per-event act split for everything tagged (base E/M/L → head E/M/L, total):

```
callback-recognized                233/134/68  -> 276/136/47    435 -> 459
callback-no-history-envy            135/97/40  -> 177/83/25     272 -> 285
callback-warns-newbies                 14/3/1  -> 20/5/1         18 ->  26
susp-misread-tell                    173/96/33 -> 216/97/30     302 -> 343
trust-circle-forms                      5/16/7 -> 4/14/1         28 ->  19
romance-comfort-after-loss-sparks        1/7/5 -> 1/7/0          13 ->   8
susp-noticed-inconsistency           78/139/48 -> 62/169/45     265 -> 276
testing-reverse-psychology            55/88/42 -> 48/120/35     185 -> 203
testing-ask-for-alibi-check          204/128/62 -> 157/155/68   394 -> 380
testing-double-check-story            139/88/34 -> 97/122/41    261 -> 260
cover-suspect-own-ally                   2/6/1 -> 1/5/1           9 ->   7
grief-headcount                     158/323/133 -> 147/331/139  614 -> 617
romance-strategic-optics               1/13/14 -> 0/14/19        28 ->  33
romance-protection-instinct            3/11/22 -> 3/17/27        36 ->  47
romance-liability-exposed               0/6/17 -> 0/8/15         23 ->  23
grief-castle-in-view                   26/73/36 -> 16/84/38     135 -> 138
trust-settled-on-the-way-back          33/52/30 -> 34/40/41     115 -> 115
trust-late-checkin                     19/36/44 -> 13/37/52      99 -> 102
grief-numb-to-it-now                    0/65/35 -> 0/67/35      100 -> 102   (0 double-firings, was 8)
susp-heard-in-the-corridor          414/384/137 -> 411/354/139  935 -> 904
grief-shorter-column                177/478/223 -> 169/361/172  878 -> 702
```

The tags land where they were pointed: `callback-recognized` loses a third of
its late firings, `testing-double-check-story` moves 42 firings out of early
into middle, `trust-late-checkin` and `romance-protection-instinct` gain late.

**The largest movement is not in anything I tagged, and that is the finding.**
`evening` is +7.7% and `after-table` +5.1% while I declared nothing in either.
Cause, attributed by measuring an acts-only arm (cooldowns reverted) against the
full head: **the acts multipliers alone move the total +2.3%.** They cannot
change eligibility, so they cannot in principle add firings — what they change
is *which* event gets drawn, which changes what is on cooldown next round,
which reroutes the whole seeded path. Per-event counts under 40 are then
effectively **resampled** by any content change at all, not perturbed by it.
Measured examples of that resampling in a single iteration:
`callback-different-show-different-person:redemption` 5 → 11 → 8;
`testing-loyalty-oath:refuses` 6 → 8 → 11 → 9.

---

## Concerns

**1. The branch floor at 4 is inside the noise of any content change.** With
164 branches, a dozen of them expecting 5–10 firings per 400 seasons, Poisson
alone puts several within one draw of the floor on every change, and the
rerouting above resamples them rather than nudging them. During this task
`romance-liability-exposed:exposes` read 8 (base), 7, 4 and 5 across four
iterations of the same content decisions. **It ships at 5.** I did not tune to
rescue it — but I did choose `{early:0.4, late:2.5}` over a first-drafted
`{early:0.5, late:1.6}` for that event, and the honest reason is half tone (its
measured split is 0/6/17, so the stronger tag is the more truthful one) and half
that the weaker tag left the floor at exactly 4. Flagging it rather than burying
it. **Task 6 should consider whether a floor keyed to 400 fixed seeds is the
right instrument for a branch whose expectation is 6.**

**2. `cover-suspect-own-ally` is now the pool's rarest event at 7 (from 9).**
It is a `rare` flagship gated on two Traitors who know each other being drawn
together in `evening`, the most crowded window. This is the shape Plan 5 says
needs a second door, not a bigger weight, and I did not give it one — that is
new content and out of this brief. It is above the floor of 4 and it is worth
somebody's attention.

**3. Half this pool writes a CONSTANT, and that is the real repetition
problem.** Found by dumping seasons and reading them, not by any assertion.
`susp-misread-tell`, `callback-recognized`, `callback-no-history-envy`,
`susp-pattern-tracking`, `grief-someone-cries-alone`, `cover-preemptive-alibi`
and others call no `pick()` at all: every firing is the same sentence with
different names. Seed 3 printed `susp-misread-tell`'s single line in episodes
1, 4, 8 and 10 — four identical sentences in one castle, and my early tag had
just raised its volume. That is what the third cooldown override is for
(`{event: 3}`), which takes its worst season from four firings to three; the
pool-wide worst verbatim repeat is 3 at base and 3 at head. **The real fix is
line pools, it is a large content job, and it is not this task's.**

**4. The round budget question is still open.** `startRoundBudget`'s fixed 4–8
draws for a 98-event pool is what makes every change zero-sum and every small
count chaotic. Task 6 already owns this; this task is more evidence for it.

---

## Prose I actually read

Five seasons dumped in full (seeds 3, 17, 41, 88, 205), read before and again
after the last change. Two things looked broken and were not, one was:

- Seed 41 ep 1 folds `callback-recognized` and `callback-no-history-envy` into
  the same pair-thread: *"Beardo and Bridgette clocked each other from a previous
  season…"* then *"Beardo sat outside a conversation full of names and seasons
  they had no part of…"*. Reads as a contradiction. It is not: the second
  event's gate is that the INSIDER shares history with a THIRD person, so Beardo
  genuinely has no part of that season. I nearly "fixed" a true sentence. Left
  alone.
- Seed 3 ep 4 opens a grief thread at dawn (`grief-numb-to-it-now`) and buries
  it on the road home the same day (`grief-castle-in-view:buried`) — *"They left
  it out there on the road. Chet and Bowie came back through the gate lighter
  than they went out."* Works.
- Seed 3's four identical `susp-misread-tell` sentences — the one real defect,
  and the reason for the third cooldown override. See concern 3.

Late acts now read differently from early ones. Seed 205 episodes 1–3 are
`callback-recognized`, `callback-no-history-envy`, `testing-double-check-story`,
`testing-who-you-walk-with`, `callback-different-show-different-person`; episodes
8+ are `testing-decoy-secret`, `callback-history-confrontation`,
`grief-headcount`, `susp-let-it-go-on-the-road-back`.

`callback-recognized` still lands at episode 8 in seed 205 — *"clocked each
other from a previous season before either one said a word about it"* is a
stretch that late, and the tag has taken it from 68 late firings to 47 rather
than to zero. Reported, not banded.
