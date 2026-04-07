# Aftermath Show — Design Spec

**Date:** 2026-04-07
**Status:** Approved
**Type:** Optional season feature + schedulable twist

---

## Overview

A Total Drama-inspired talk show that fires as bonus VP screens at the end of regular episodes. Chris interviews recently eliminated players, exposes secrets, shows unseen footage, takes fan calls, and (optionally) hosts the fan vote for a returning player. The Aftermath has its own distinct visual identity — a studio set with purple/gold theming, audience reactions, dramatic reveals, and TV production flair. The finale episode gets a special Reunion show with season awards.

---

## Config

- `cfg-aftermath`: `'disabled'` (default) | `'enabled'`
- When enabled: auto-fires every 3 episodes (tracked via `gs.lastAftermathEp`)
- Also schedulable manually via Episode Format Designer as `aftermath` twist
- Manual scheduling resets the auto-timer
- Finale episode ALWAYS gets an Aftermath if enabled (the Reunion)

---

## Visual Identity

The Aftermath has its OWN aesthetic — visually distinct from regular episode screens.

### Color Palette
- **Primary:** Deep purple (#6366f1) + gold (#f59e0b)
- **Background:** Dark studio backdrop (#0c0a1a) with subtle spotlight gradient
- **Accent:** Hot pink (#ec4899) for drama moments, green (#10b981) for positive reactions
- **Text:** Warm white (#f5f0e8) — softer than the regular VP white

### Studio Feel
- All screens use a custom `tod-studio` class with the purple/dark background
- Subtle spotlight effect: radial gradient from center-top (simulates stage lighting)
- Gold trim borders on cards and sections
- "LIVE" indicator in corner of interview screens
- Applause/reaction cues rendered as styled text banners

### Typography
- Title cards use oversized display font with glow: `text-shadow: 0 0 20px rgba(99,102,241,0.6)`
- Interview dialogue in slightly larger font than normal VP text
- Host quotes in gold italic
- Gallery reactions in smaller muted text with emoji

---

## Episode Flow

The Aftermath fires AFTER the regular episode is complete — after votes, after elimination, after all post-tribal content. It appears as a group of screens in the VP sidebar under a purple "AFTERMATH" label.

---

## Segments

### 1. Opening Sequence

**VP Screen: "Aftermath: Opening"**

- **Title Card:** "TOTAL DRAMA AFTERMATH" in large display font with purple glow animation
- Subtitle: "LIVE from the Aftermath Studio"
- Episode counter: "Aftermath #X"
- **Host intro:** Chris portrait (large) with a witty one-liner about the season so far
  - Generated from game state: drama level, recent blindsides, alliance status
  - "Welcome back to the Aftermath! Things have gotten UGLY out there. Let's talk about it."
  - "Three more players gone. The jury's getting crowded. Let's hear from them."
- **Montage recap:** Grid of ALL eliminated players so far with placement numbers
  - Portraits in elimination order, small, with a subtle gray overlay
  - Most recent eliminees highlighted in gold (tonight's guests)
- **Guest announcement:** "Tonight's guests:" with dramatic portrait reveals
  - Each guest portrait slides in (CSS animation: `slideInLeft 0.5s`)
  - Name + archetype + "Eliminated Episode X" under each

### 2. Peanut Gallery

**Section within Opening screen (not separate screen)**

- **Bleacher layout:** 2-3 rows of small portraits representing previously interviewed eliminees
- Empty on first Aftermath, grows each time
- Each portrait has a subtle name tooltip on hover
- **Reaction system:** During interviews (later screens), gallery reactions appear as floating text:
  - Bond >= 3 with guest: "Respect." / "Miss you out there."
  - Bond <= -3 with guest: "Good riddance." / "About time." / "Still bitter."
  - Neutral: silent (no reaction rendered)
- Gallery members only get full speaking moments when:
  - Current guest mentions them by name
  - Truth or Anvil reveal involves them
  - Bond <= -3 with guest (drama erupts — gallery member stands up and fires back)
  - Unseen footage features them

### 3. Interviews (1 screen per recent eliminee)

**VP Screen: "Aftermath: [Name]" — one per guest**

This is the MAIN content of the Aftermath. Each interview is a full dramatic screen.

**Entrance:**
- Guest portrait enters with CSS slide animation
- Name + archetype + placement displayed large
- **Crowd reaction** based on popularity:
  - popularity >= 8: "The crowd goes WILD. Standing ovation." (green text, applause emoji)
  - popularity 3-7: "Warm welcome from the studio." (neutral)
  - popularity 0-2: "Polite applause. The energy says enough." (muted)
  - popularity <= -1: "Boos from the gallery. [Name] doesn't flinch." (red text)
- **Entrance quote** based on elimination type:
  - Blindsided: archetype-driven reaction (villain = defiant, hero = gracious, hothead = furious)
  - Betrayed by ally: "I trusted the wrong person. That's on me." / "They'll regret it."
  - Voted out fairly: "I knew it was coming. I just couldn't stop it."
  - Mole victim (undiscovered): "Something was off out there. I still can't explain it."
  - Exile duel loser: "I fought for it. That's all I can say."

**Interview Questions (4 per guest, generated from game data):**

Each question is a click-to-reveal card. Click shows the question, click again shows the answer.

1. **"Who do you blame?"**
   - Answer driven by: voters who wrote their name, alliance betrayers, bond data
   - Pulls from `ep.votingLog` of their elimination episode
   - Example: "Zoey. She looked me in the eye at camp and said we were good. Then she wrote my name."

2. **"What was your biggest mistake?"**
   - Answer driven by: archetype tendencies, behavioral record (betrayals, overplays, missed opportunities)
   - Strategic players: "I waited too long to make my move."
   - Social players: "I trusted too many people."
   - Challenge beasts: "I should've thrown a challenge earlier."

3. **"Who's going to win?"**
   - Answer driven by: highest bond among remaining active players
   - "If [ally] plays it right, they've got this. Nobody sees them coming."

4. **"Any last words for the tribe?"**
   - Archetype-driven closing statement
   - Villain: "They haven't seen the last of me." (even though they have)
   - Hero: "Play with integrity. That's all that matters."
   - Hothead: "I hope they all turn on each other."

**Gallery reactions** appear between questions as small floating text from gallery members who have opinions.

### 4. Truth or Anvil

**VP Screen: "Aftermath: Truth or Anvil"**

- **Title card:** "TRUTH... OR ANVIL" in huge bold text with dramatic pause styling
- Covers 1-2 interviewees (the most dramatic ones)

**For each subject:**
- Chris asks about a SECRET — pulled from actual game data:
  - Secret alliance membership (dissolved alliances, `gs.namedAlliances` inactive)
  - Idol knowledge they had (who they knew had idols)
  - Side deals they made (`gs.sideDeals` involving them)
  - Who they REALLY trusted vs who they pretended to trust (`perceivedBonds` gaps)
  - Mole sabotage they witnessed but didn't understand (if Mole active)

- **The question is revealed** (click to continue)
- **Truth or Lie decision:** `loyalty * 0.08 + temperament * 0.03`
  - Loyalty 9: ~85% truth
  - Loyalty 3: ~35% truth
  - Villains/schemers almost always lie

- **If TRUTH:**
  - Green "TRUTH" badge with confirmation
  - The secret is revealed in a dramatic card
  - **Consequences listed:** "This changes things for [active player]"
  - Next episode: bond damage / trust breaks based on what was revealed
  - Gallery reactions: gasps, shock, "I KNEW IT"

- **If LIE:**
  - Red "ANVIL!" text drops in (CSS animation: `dropIn 0.3s`)
  - Chris: "Actually, let's look at the tape."
  - **Never-before-seen footage** exposes the lie
  - The REAL truth is shown
  - Gallery: laughing, pointing, "Caught!"
  - Same consequences as truth but with added embarrassment

### 5. Never-Before-Seen Footage

**VP Screen: "Aftermath: Unseen Footage"**

- **Title card:** "UNSEEN FOOTAGE" with filmstrip border effect (CSS: repeating gold/dark bands on sides)
- "What the tribe never saw..."

**2-3 clips per Aftermath, selected for maximum drama:**

Each clip is a card with:
- Filmstrip border styling
- Episode number badge
- The hidden moment described
- Players involved with portraits
- "CLASSIFIED" red stamp for Mole-related clips

**Clip sources (pulled from episode history data):**
- Mole sabotage acts (`sabotageLog`) — "In episode 7, [Mole] fabricated a conflict between [X] and [Y]. Nobody knew."
- Secret idol finds that weren't shared
- Behind-the-scenes deal-making (`sideDeals` that were genuine: false)
- Perceived bond gaps — "What [X] didn't know: [Y] thought they were allies. They weren't."
- Volunteer exile duel moments — "Before the duel, [X] told the camera exactly why they wanted [Y] gone."
- Alliance betrayal planning — moments where someone decided to betray before doing it

**Selection priority:** most dramatic clips first. Score each potential clip by: bond magnitude involved, number of active players affected, recency.

### 6. Fan Call

**VP Screen: "Aftermath: Fan Call"**

- **Video call UI styling:**
  - Small "webcam" frame in corner with a generated fan name
  - "LIVE CALL" indicator
  - Chat bubble styling for the question
  - Full portrait of the interviewee answering

- **Fan name:** randomly generated from a pool of names
- **Question directed at** the most dramatic interviewee (highest popularity OR most controversial elimination)
- **Question types:**
  - "Who's playing the best game right now?" → answer based on threat scores
  - "Do you regret trusting [X]?" → bond-driven answer
  - "What would you do differently?" → archetype-driven reflection
  - "Who do you want to see go next?" → highest negative bond among active players
  - "Was it worth it?" (for players who made bold moves) → boldness-driven answer

- **Answer is a full dialogue paragraph** — not a one-liner. 2-3 sentences reflecting the player's actual game experience.

### 7. Fan Vote (conditional — only when Second Chance active)

**VP Screen: "Aftermath: Fan Vote"**

Only appears when `second-chance` twist is scheduled for the NEXT episode.

- **Title card:** "THE FANS HAVE VOTED" with gold glow
- **All eligible eliminated players** shown with portraits + popularity scores
- **Click-to-reveal format:** results from bottom to top
  - Each reveal shows: portrait, name, vote percentage, popularity score
  - Bottom reveals are quick, middle builds tension
  - Winner revealed LAST with dramatic gold border + "RETURNING TO THE GAME" badge
- **Winner reaction:** generated quote about coming back
  - "They're not ready for what I'm bringing back."
  - "Unfinished business."

---

## Finale Aftermath: THE REUNION

When the Aftermath fires on the **finale episode** (or last episode), it's the big one.

**VP Screen: "TOTAL DRAMA AFTERMATH: THE REUNION"**

### Unique Reunion Elements:

**All players on stage** — no peanut gallery split. Everyone gets a portrait in the main layout.

**Winner in the Hot Seat:**
- The season winner gets the first interview
- Special questions: "When did you know you could win?", "Who was your toughest opponent?", "What's next?"

**Runner-up Reaction:**
- The finalist(s) who lost get a response moment
- Gracious or bitter based on bond with winner + jury margin

**Season Awards (click-to-reveal, one by one):**

1. **Best Blindside** — the vote with the biggest gap between target's confidence and actual votes received. Pulls from episode history: player who was most "comfortable" (playerState emotional = 'comfortable') when eliminated.

2. **Biggest Betrayal** — the alliance betrayal with the highest bond damage. Pulls from `allianceBetrayed` events, sorted by bond delta.

3. **Best Alliance** — the named alliance that lasted longest and had the most coordinated votes. Pulls from `namedAlliances` — longest `active` period with fewest betrayals.

4. **Most Dramatic Moment** — the event with the highest combined popularity delta. Pulls from `popularityArcs` — the single episode event that caused the biggest fan reaction.

5. **Fan Favorite** — already computed by the popularity system. Shown here with their popularity arc graph.

6. **Best Move** — the player with the most big moves (`playerStates.bigMoves`). Or the single move that had the biggest game impact.

Each award is a card with:
- Award name in gold
- Winner portrait (large)
- Description of what they did
- "Presented by Chris McLean" footer

**Season Highlight Reel:**
- One key moment per episode, listed in order
- Click each to expand: what happened, who was involved, why it mattered
- Pulls from episode history: eliminations, idol plays, alliance formations, Mole reveals, duel results

**Chris's Season Rating:**
- Final moment: Chris rates the season 1-10
- Rating based on: drama score (fights + betrayals + blindsides), close votes, idol plays, twist activations
- "This season? I give it a [X] out of 10. [Comment]."
- Comments: 10 = "Best season EVER.", 7-9 = "Solid. The fans will talk.", 4-6 = "Had its moments.", 1-3 = "We'll do better next time."

---

## State

```
gs.lastAftermathEp = number;  // last episode that had an Aftermath
gs.aftermathHistory = [];     // [{ ep, interviewees, galleryMembers }]

ep.aftermath = {
  number: 1,                    // Aftermath #
  interviewees: ['Name1', 'Name2', 'Name3'],
  peanutGallery: ['Name4', 'Name5'],
  interviews: [{
    player: 'Name',
    blame: 'Name',
    mistake: 'text',
    prediction: 'Name',
    lastWords: 'text',
    crowdReaction: 'wild' | 'warm' | 'polite' | 'boos',
    entranceQuote: 'text'
  }],
  truthOrAnvil: [{
    player: 'Name',
    secret: 'text',
    secretType: 'alliance' | 'idol' | 'deal' | 'bond' | 'mole',
    toldTruth: true/false,
    consequence: 'text',
    affectedPlayers: ['Name']
  }],
  unseenFootage: [{
    sourceEp: number,
    type: 'mole' | 'idol' | 'deal' | 'betrayal' | 'perception',
    description: 'text',
    players: ['Name1', 'Name2'],
    classified: false
  }],
  fanCall: {
    fanName: 'text',
    target: 'Name',
    question: 'text',
    answer: 'text'
  },
  fanVote: null | {
    results: [{ name, pct, popularity }],
    winner: 'Name'
  },
  isReunion: false,
  awards: null | [{
    id: 'bestBlindside',
    title: 'Best Blindside',
    winner: 'Name',
    description: 'text',
    sourceEp: number
  }],
  seasonRating: null | { score: number, comment: 'text' }
}
```

---

## VP Screens (Sidebar)

Regular screens render first, then:

```
  ── AFTERMATH #X ──
  Opening
  Interview — [Name1]
  Interview — [Name2]
  Interview — [Name3]
  Truth or Anvil
  Unseen Footage
  Fan Call
  Fan Vote          (only if second-chance active)

  ── AFTERMATH: THE REUNION ──    (finale only)
  The Reunion
  Winner Interview
  Season Awards
  Highlight Reel
  Season Rating
```

Purple accent dot on each sidebar label. Group label "AFTERMATH" in purple.

---

## CSS Classes

```css
.tod-studio {
  background: linear-gradient(180deg, #1a1035 0%, #0c0a1a 40%, #0d0b1e 100%);
}
.aftermath-title {
  font-family: var(--font-display);
  color: #f59e0b;
  text-shadow: 0 0 20px rgba(99,102,241,0.6), 0 0 40px rgba(245,158,11,0.3);
  letter-spacing: 3px;
}
.aftermath-card {
  border: 1px solid rgba(245,158,11,0.2);
  background: rgba(99,102,241,0.04);
  border-radius: 10px;
}
.aftermath-filmstrip {
  border-left: 4px solid #f59e0b;
  border-right: 4px solid #f59e0b;
  background: rgba(0,0,0,0.3);
}
.aftermath-crowd-wild { color: #10b981; }
.aftermath-crowd-boos { color: #ef4444; }
.aftermath-anvil { animation: dropIn 0.3s ease-out; color: #ef4444; font-size: 32px; }
.aftermath-classified { 
  position: relative;
}
.aftermath-classified::after {
  content: 'CLASSIFIED';
  position: absolute; top: 8px; right: 8px;
  background: rgba(239,68,68,0.9); color: white;
  padding: 2px 8px; border-radius: 3px; font-size: 9px;
  font-weight: 800; letter-spacing: 2px;
  transform: rotate(5deg);
}
```

---

## Interactivity

- **Interview questions:** click to reveal question, click again for answer
- **Truth or Anvil:** click to reveal secret, click for truth/lie result
- **Unseen Footage:** filmstrip cards are click-to-expand
- **Fan Vote:** bottom-to-top reveal (same pattern as challenge reveal)
- **Season Awards:** click-to-reveal one by one
- **Gallery reactions:** appear with `fadeIn` animation during interviews

---

## Engine Integration

| System | Change |
|--------|--------|
| Config UI | `cfg-aftermath` toggle in settings |
| `saveConfig` / `renderConfig` | Persist aftermath setting |
| `defaultConfig` | `aftermath: 'disabled'` |
| `simulateEpisode` | Check auto-fire timer, call `generateAftermathShow(ep)` |
| `generateAftermathShow(ep)` | NEW — builds all segment data from game history |
| `patchEpisodeHistory` | Save `ep.aftermath` |
| `buildVPScreens` | Add aftermath screens after regular episode screens |
| `rpBuildAftermathOpening(ep)` | NEW — opening + peanut gallery |
| `rpBuildAftermathInterview(ep, interview)` | NEW — per-interviewee screen |
| `rpBuildAftermathTruth(ep)` | NEW — truth or anvil |
| `rpBuildAftermathFootage(ep)` | NEW — unseen footage |
| `rpBuildAftermathFanCall(ep)` | NEW — video guest |
| `rpBuildAftermathFanVote(ep)` | NEW — fan vote (conditional) |
| `rpBuildAftermathReunion(ep)` | NEW — finale reunion |
| `rpBuildAftermathAwards(ep)` | NEW — season awards |
| `_textAftermath(ep, ln, sec)` | NEW — text backlog formatter |
| `second-chance` twist | Reworked: fan vote moves to Aftermath if enabled |
| CSS | New `.tod-studio`, `.aftermath-*` classes |
| Twist catalog | `aftermath` entry for manual scheduling |

---

## Consequences That Flow Into Next Episode

- Truth or Anvil truths: bond damage / trust breaks as camp events
- Unseen footage reveals: active players learn things (adjusts perceived bonds, heat)
- Fan Call answers: small popularity shifts
- Fan Vote winner: returns to the game at episode start

---

## Text Backlog

`_textAftermath(ep, ln, sec)` covering:
- Interviewee list, crowd reactions
- Each interview: blame, mistake, prediction, last words
- Truth or Anvil: secret + result + consequence
- Unseen footage descriptions
- Fan call Q&A
- Fan vote results (if active)
- Reunion: awards, season rating, highlight reel

---

## Scope Notes

- The Aftermath is bonus content — it never replaces the regular episode
- First Aftermath has empty gallery. Gallery grows each time.
- Finale Aftermath is the Reunion — different format, all players on stage
- If `second-chance` is scheduled, the fan vote moves from the twist to the Aftermath
- Aftermath consequences affect the NEXT episode, not the current one
- Compatible with all other twists (Mole, Tied Destinies, Exile Duel, etc.)
- The Reunion fires after the winner is announced — it's a look-back, not a jury deliberation
