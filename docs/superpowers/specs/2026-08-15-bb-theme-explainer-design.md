# The theme explainer — a season that says what it is

Date: 2026-08-15
Status: **designed and approved, PARKED.** The user chose to build the High
Roller's games first. Build this immediately after.

## The problem, in the user's words

> "there should be screen explaining the theme and whats going on each week
> cause im just confused on whats the pit boss etc… please dont let the user be
> lost by the theme all of the themes not just one"

A theme currently only ever *speaks*: four one-liner mood beats a week
(`open`, `noms`, `veto`, `vote`) plus `finale` and `crown`. No screen anywhere
says what the season IS. Nothing introduces the antagonist, nothing states what
the format does differently, and **the mood turn — the biggest thing a theme
does — happens in total silence.** The room simply starts sounding different.

The `twist-announcement` screen the user was thinking of only fires when a
theme's arc books a *twist*, and it explains that twist, not the season.

Two known-open items from `project_bb_season_themes` are the same gap: "the
season is never NAMED in the backlog" and "the mood turn is not announced as an
event."

## The rule this design is built on

**Everything lives in the descriptor; the engine never branches on a theme id.**
That is what let CORA and the Mastermind ship with zero engine changes, and it
is what the current announcement code gets *wrong* — see §4.

Each theme gains a `primer` block:

```js
primer: {
  what:  'One paragraph — what this season is.',
  who:   'Who the antagonist is, and what it wants.',
  rules: ['The audience pays every houseguest, every week…', '…'],
  watch: 'What to watch for as it goes on.',
  register: { neutral: 'Hospitable — the floor is comping you.',
              hostile: 'Accounting — the markers are being called in.' },
  turn:  { headline: 'THE COMPS HAVE STOPPED',
           body: 'What changed, and what it means from here.' },
  announce: ['Houseguests, the floor has changed the terms of this week. {detail}', …],
}
```

## 1. The Premiere Card

One screen at week 1. The season's name and tagline, the antagonist introduced
by name and by nature, the rules this season adds in plain language, and what to
watch for. This is the screen that answers "what is a Pit Boss".

## 2. The Standing Band

On House Life every week, modelled on the existing `_bbPowerBand` and
`_bbChipBand`. Four short facts:

- who is running this season
- what register they are in **right now** (`primer.register[mood]`)
- what the theme has done so far
- what it has booked next

Derived from the arc and the schedule rather than authored per week, so it
cannot drift out of step with what actually happened.

**Weight note, raised with the user and unresolved:** on a High Roller's week
House Life would carry the power band, the chip band and this. If that reads as
heavy, this is the one to compress to a single line plus the register.

## 3. The Turn

Its own screen the week the mood flips: the headline, what changed, and the two
registers shown side by side. Today this is invisible.

## 4. The announcement voice — a live bug

`themeTwistAnnouncement` (`js/bb/themes.js:685`) hardcodes its phrasing:

```js
const pools = theme.id === 'machine-summer' ? [ …CORA lines… ] : [ …Den lines… ];
```

So **two of the four themes announce their twists in the Den's words** — a
Summer of Mystery season says "the Den has changed the terms of this week" over
a hotel, and High Roller's says it over a casino. This is precisely the
recurring bug class `CLAUDE.md` opens with: one show's vocabulary printed over
another's. Fix: read `primer.announce` from the descriptor.

## 5. Four primers

Temptation, Machine Summer, Mystery, High Roller's — each in its own
antagonist's voice. The Pit Boss's may never say "the house" (the roster owns
that phrase); it says *the floor*, *the room*, *the edge*.

## Both transcripts

The same content in text in `summariseWeek` and the backlog, so the season stops
being one that never names itself.

## Non-goals

- Total Drama. Themes are BB-only.
- Per-week authored copy. The band derives from state; only the primer is
  authored, once per theme.
