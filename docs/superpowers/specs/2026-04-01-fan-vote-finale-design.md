# Fan Vote Finale — Design Spec

## Overview

A new finale format where **fans crown the winner** based on accumulated popularity, bypassing the jury vote entirely. The jury exists narratively (they react, commentate) but don't cast deciding votes. This is the audience's game.

Requires `popularityEnabled: true` in season config.

## Format Constraints

- Supports **F2 and F3** fan vote
- If `finaleSize === 4`, run immunity challenge + one Decision to cut to F3, then Fan Campaign with F3
- If `finaleSize === 3`, run immunity challenge + one Decision to cut to F2, then Fan Campaign with F2
- If `finaleSize === 2`, skip immunity challenge entirely — go straight to Fan Campaign with F2
- Incompatible with `fire-making` and `koh-lanta` (those force F4 with their own elimination paths)

## Engine Flow

### Step 1: Immunity Challenge (F3/F4 only)

Standard `simulateIndividualChallenge`. Skipped entirely when `finaleSize === 2`.

### Step 2: The Decision(s) — cut down to F2

Uses existing cut logic — one cut per path:
- F4 → immunity winner cuts 1 → F3 fan vote
- F3 → immunity winner cuts 1 → F2 fan vote
- F2 → skip (already at F2)

Same `ep.finalCut` data structure. Reuses `rpBuildFinalCut` VP screen.

### Step 3: Fan Campaign

Replaces FTC. Finalists pitch to the audience in a broadcast-style production.

**Data generated: `ep.fanCampaign`**

```js
ep.fanCampaign = {
  finalists: ['Alex', 'Blake'],  // or 3 for F3 (from finaleSize 4)
  phases: [
    // Phase per finalist: speech → jury reacts → audience settles
    {
      finalist: 'Alex',
      style: 'bold',        // derived from highest stat among social/boldness/strategic
      speech: '...',         // personality-driven text
      pulseReaction: 'surging' | 'steady' | 'mixed' | 'cooling',
      fanReactions: [        // 2-3 social media style reactions
        { text: 'KING', sentiment: 'positive' },
        { text: 'overrated', sentiment: 'negative' },
      ],
      juryReactions: [       // 1-2 jurors react TO THIS finalist's speech
        { juror: 'Jordan', text: '...', bond: 4.2 },
      ],
    },
    {
      finalist: 'Blake',
      style: 'strategic',
      speech: '...',
      pulseReaction: 'steady',
      fanReactions: [ ... ],
      juryReactions: [
        { juror: 'Morgan', text: '...', bond: -2.1 },
      ],
    },
  ],
};
```

**Interactive reveal (VP):** The screen advances phase by phase on click, like a live broadcast:
1. Click → Finalist 1 spotlight appears (portrait, name, "THE PITCH" badge)
2. Click → Speech text fades in, pulse meter bars animate upward (CSS height transitions), fan reaction pills pop in with staggered delays (opacity 0→1, 200ms apart)
3. Click → Jury reaction to THIS speech slides in from below (juror portrait + quote)
4. Click → Finalist 2 spotlight (finalist 1's section stays but dims)
5. Click → Speech + pulse + fan reactions animate in
6. Click → Jury reaction to finalist 2
7. (If F3: repeat for finalist 3)
8. Final state: all phases visible, all meters settled, "PROCEED TO THE VOTE" button appears

Uses `_tvState['fan-campaign']` pattern with `fanCampaignAdvance(key)` / `fanCampaignRevealAll(key)` functions.

**Speech generation** — personality-driven, one per finalist:
- **Bold** (`boldness` highest): aggressive, owns their game, confrontational
- **Social** (`social` highest): emotional, talks about relationships, gratitude
- **Strategic** (`strategic` highest): breaks down their resume, move by move
- Each style has 3-4 variants, selected via hash-based `_pick`
- Speeches must NOT be interchangeable — they reference the finalist's actual game:
  archetype, betrayal count, big moves, key alliances, showmance history

**Pulse reaction** — based on popularity rank:
- Highest popularity → `'surging'`
- Middle (F3) → `'steady'`
- Lowest → `'mixed'` or `'cooling'`

**Fan reactions** — 2-3 short social-media-style blurbs per finalist. Mix of positive and negative. Higher popularity = more positive ratio. Generated from pools of reaction templates keyed to the finalist's archetype and game history (e.g. villain gets "love to hate you" reactions, hero gets "deserves it" reactions, betrayer gets "snake" reactions).

**Jury reactions** — each juror reacts to ONE specific finalist (no juror reacts twice). Selection: pick the juror with the strongest bond (positive OR negative) with that finalist. Commentary is relationship-specific:
- **High positive bond (≥ 3)**: endorsement referencing their shared history ("We were allies from day one. Everything Alex said up there is true.")
- **High negative bond (≤ -2)**: bitter critique referencing what happened between them ("Alex talks about loyalty? Ask me how that loyalty felt when the votes came out.")
- **Moderate bond (-1 to 2)**: analytical take on the finalist's game, not personal ("Alex played hard. Whether that's enough — the fans will decide.")
- Each juror has 3-4 template variants per bond tier to avoid repetition across seasons

### Step 4: Fan Vote Scoring

**Formula:**

```js
score = popularity * 1.0           // accumulated all season — dominant factor
      + campaignBoost              // speech quality swing
      + Math.random() * 1.5        // vote variance
```

**Campaign boost** (the speech's impact on undecided fans):
```js
campaignBoost = social * 0.3 + boldness * 0.2 + strategic * 0.1
```

Range: ~0.5 (stat 1s) to ~6.0 (stat 10s). Enough to flip a close race (~10% gap) but not override a dominant fan favorite.

**Output: `ep.fanVoteResult`**

```js
ep.fanVoteResult = {
  scores: { 'Alex': 892, 'Blake': 734 },           // raw scores
  percentages: { 'Alex': 55, 'Blake': 45 },         // display percentages
  rankings: ['Alex', 'Blake'],                       // sorted best to worst
  winner: 'Alex',
  margin: 'comfortable' | 'razor-thin' | 'landslide', // for narrative flavor
  // Per-finalist breakdown for VP display
  breakdown: [
    { name: 'Alex', popularity: 847, campaignBoost: 38.2, totalScore: 892, pct: 55 },
    { name: 'Blake', popularity: 698, campaignBoost: 29.1, totalScore: 734, pct: 45 },
  ],
};
```

**Margin categories:**
- `landslide`: winner has 60%+ of total
- `comfortable`: winner has 52-60%
- `razor-thin`: winner has 50-52%

### Step 5: Winner Assignment

```js
ep.winner = ep.fanVoteResult.winner;
gs.finaleResult = { winner: ep.winner, votes: null, reasoning: null, finalists, fanVote: true };
```

No `ep.juryResult` — this format has no jury vote. The `fanVote: true` flag distinguishes this in downstream code.

## VP Screens

### Screen Order (fan-vote finale)

```
The Last Morning → (Final Immunity, if F3+) → (The Decision, if cut needed) →
Fan Campaign → The Fan Vote → Winner Ceremony → Reunion → Statistics
```

### VP: Fan Campaign (`rpBuildFanCampaign`)

Broadcast-style production screen. Theme: gold/warm with TV production energy.

**Layout:**
1. **Header**: "LIVE FROM TRIBAL COUNCIL" eyebrow + "THE FAN CAMPAIGN" title
2. **Finalist spotlights** — one card per finalist, shown sequentially:
   - Portrait (xl size)
   - Speech text (italic, personality-driven)
   - Audience Pulse meter (animated bar chart, 7 bars, heights based on pulse reaction)
   - Fan reaction pills (colored bubbles: positive=gold/blue, negative=red/grey)
3. **Jury Commentary** — 2-3 juror quotes in a subtle panel at the bottom
4. **Jury bench** — small portraits of all jurors watching, with subtle expressions

Color palette:
- Gold `#e3b341` for positive reactions and winner energy
- Blue `#58a6ff` for neutral/analytical
- Red `#da3633` for negative reactions
- Dark background matching existing VP dark theme

### VP: The Fan Vote (`rpBuildFanVoteReveal`)

The climax. Interactive reveal, bigger and more dramatic than Second Chance Vote.

**Layout — two modes based on finalist count:**

**F2 (head-to-head):**
1. Two large finalist portraits facing each other
2. Central percentage display: starts hidden, fills in as revealed
3. "REVEAL" button — each click fills in ~10% of the vote
4. Percentage bars grow from center outward (left for finalist A, right for finalist B)
5. When fully revealed: winner's side explodes with gold, loser fades
6. Margin badge: "LANDSLIDE" / "RAZOR-THIN" / "COMFORTABLE"

**F3 (three-way):**
1. Three finalist portraits in a row
2. Vertical percentage bars below each portrait
3. "REVEAL" button — each click fills in a chunk of votes
4. Bars grow upward simultaneously
5. Lead changes visible as bars cross each other
6. Winner crowned when fully revealed

**Both modes:**
- "See all results" button to skip the interactive reveal
- Winner section appears after full reveal with confetti-ready styling
- Shows final percentages + popularity breakdown
- Gold theme consistent with fan-vote branding

**Interactive state:** Uses `_tvState[key]` pattern (same as vote cards):
- `fanVoteRevealNext(key)` — reveals next chunk
- `fanVoteRevealAll(key)` — shows everything

### VP: Winner Ceremony

Reuses existing `rpBuildWinnerCeremony` — but with fan-vote flavor:
- "THE FANS HAVE SPOKEN" instead of "THE JURY HAS SPOKEN"
- Winner confessional references the fan vote
- Same confetti/trophy treatment

### VP: Reunion

Existing `rpBuildReunion` works as-is. Fan vote data feeds into statistics.

## Episode History Fields

Added to `gs.episodeHistory.push(...)`:

```js
fanCampaign: ep.fanCampaign || null,
fanVoteResult: ep.fanVoteResult || null,
```

## Config

```js
seasonConfig.finaleFormat = 'fan-vote';
// Requires: seasonConfig.popularityEnabled = true
// Auto-adjusts: finaleSize capped at 3 (if set to 4, cuts to 3 via Decision)
```

UI dropdown already has the option: `<option value="fan-vote">Fan Vote Finale</option>` (line 1061).

Validation: fan-vote option is **greyed out / disabled** in the finale format dropdown when `popularityEnabled` is false. Same pattern as twist incompatibility (greyed out with tooltip). If someone loads a save where fan-vote was set but popularity got disabled, fallback to traditional jury.

### Hidden Popularity Mode

New config: `seasonConfig.hidePopularity` (boolean, default false).

When enabled:
- Popularity system still runs internally (`gs.popularity` tracks scores as normal)
- The popularity leaderboard/ranking display is **hidden** from the VP and UI during the season
- Fan vote finale result is a genuine surprise — you don't know who's popular until the vote reveal
- The Fan Campaign screen still shows pulse reactions and fan reactions (those are generated from popularity but don't show raw numbers)
- Only the Fan Vote Reveal screen shows actual percentages (the payoff)

UI: checkbox next to the popularity toggle — "Hide rankings (no spoilers)" — only visible/enabled when `popularityEnabled` is true.

## Edge Cases

- **Popularity tied**: random variance (`Math.random() * 1.5`) breaks ties naturally
- **No popularity data** (all zeros): campaign boost becomes the deciding factor — highest social/boldness/strategic wins
- **F4 with fan-vote**: one cut (F4→F3), fan campaign runs with F3
- **F3 with fan-vote**: one cut (F3→F2), fan campaign runs with F2
- **finaleSize === 2**: no immunity, no cut, straight to fan campaign
- **Fan vote with RI/Rescue**: compatible (those systems handle mid-game returns, not finale format)

## Summary Text

`generateFinaleSummaryText` needs a fan-vote branch:
- "Fan Vote Finale: [finalists]. [Winner] won the fan vote with [X]% of the audience vote ([margin])."

## What This Does NOT Include

- No jury vote at all — fans decide everything
- No bench assignments (those are final-challenge format only)
- No finale grand challenge (that's final-challenge format only)
- No FTC swing votes (no jury vote to swing)
