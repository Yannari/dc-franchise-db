# Secret Affair Design Spec

**Date:** 2026-04-08
**Status:** Approved
**Extends:** Showmance system (`gs.showmances`), Love Triangle system (`gs.loveTriangles`)

## Problem

The showmance system has no hidden romance mechanic. Love triangles are public drama — everyone sees it. There's no equivalent of a secret affair where a player in a showmance secretly pursues someone else, hides it from their partner, and faces explosive consequences when caught. Showmance betrayal (voting out partner) also lacks Aftermath weight.

## Solution

New `gs.affairs[]` array tracking secret romances. Same trigger as one-sided triangle (bond >= 4 + romanticCompat) but personality determines the path: low-loyalty/villain types go secret (affair), honest types go public (triangle). Four exposure tiers build over episodes. Full Aftermath integration across all segments. Triangle and showmance betrayal Aftermath content also upgraded.

---

## Data Structure

```javascript
gs.affairs = [{
  cheater: 'B',              // player in showmance who's cheating
  partner: 'A',              // the showmance partner (doesn't know)
  secretPartner: 'C',        // the person they're secretly seeing
  formedEp: 7,
  episodesActive: 0,
  showmanceRef: ['B', 'A'],  // which showmance is being cheated on
  exposure: 'hidden',        // hidden → rumors → caught → exposed
  rumorSources: [],          // players who suspect
  caughtBy: null,            // player who caught them flirting
  caughtTold: false,         // did the catcher tell the partner?
  complicit: false,          // did C know B was in a showmance?
  resolved: false,
  resolution: null           // { type: 'exposed'|'eliminated', ep, chose, leftFor }
}]
```

---

## Formation

**Trigger:** Same as one-sided triangle — player C has bond >= 4 with B + `romanticCompat(B, C)` + B is in active showmance with A.

**Personality fork** (added to `checkLoveTriangleFormation`):
- `loyalty <= 5` OR archetype is `villain`/`schemer`/`chaos-agent`/`showmancer` → **affair** (secret path)
- Otherwise → **triangle** (public path, existing system)

Same trio can never have both an affair AND a triangle. Different trios can coexist.

**Complicit check** — When affair forms, roll whether C knows B is in a showmance:
`Math.random() < intuition * 0.08 + getBond(C, A) * 0.05`
If C knows and still pursues → `complicit: true` (both penalized on exposure).

**Probability:** Same as one-sided triangle: `Math.min(0.30, bond * 0.06)`, ride-or-die 0.15x.

---

## Exposure Tiers

### Tier 1 — Hidden (default)
- Secret bond growth: `addBond(cheater, secretPartner, +0.2)` per episode
- `affairSecret` camp event fires 30% of episodes (subtle hint for VP viewer)
- Detection base chance starts at 10%, grows +6% per episode active
- Per nearby player detection roll: `(intuition * 0.05 + mental * 0.02) * episodesActive * 0.3`
- If any player passes → moves to **Rumors**, that player added to `rumorSources`

### Tier 2 — Rumors
- 1-3 tribemates suspect. Camp events: whispered conversations, side-eyes
- Each rumor source may tell the partner each episode: `loyalty * 0.06 + getBond(source, partner) * 0.04`
- If someone tells → skip to **Exposed**
- Additional players can still detect via intuition → join `rumorSources`
- If nobody tells after 2 episodes of rumors → one confronts cheater directly → **Caught**

### Tier 3 — Caught
- A tribemate directly witnessed a private moment
- `caughtBy` set. Camp event: awkward encounter, cheater scrambles
- Catcher decides to tell or stay silent:
  - Tell chance: `(loyalty * 0.07 + getBond(catcher, partner) * 0.05) - (getBond(catcher, cheater) * 0.03)`
  - If tells → **Exposed**
  - If silent → leverage. `addBond(cheater, catcher, -0.5)`. Catcher has power over cheater.
  - Silent catchers crack: 40% chance per episode to tell anyway

### Tier 4 — Exposed
- Partner finds out. Full confrontation camp event.
- Three-way fallout (see Resolution below)

### Pressure Cooker
Detection chance grows +6% per episode. By episode 6-7 of the affair, exposure is near-guaranteed. Nobody gets away with it forever.

---

## Resolution (Exposure)

**Cheater chooses** — same formula as triangle ultimatum:
- Bond comparison (cheater→partner vs cheater→secretPartner): 40%
- Loyalty stat x relationship length: 30%
- Strategic value: 20%
- Random: 10%

**If cheater stays with partner:**
- Affair ends, showmance survives damaged
- `addBond(cheater, partner, -2.0)` (trust broken but trying)
- `addBond(cheater, secretPartner, -1.5)` (cut off the secret partner)
- Secret partner reacts based on complicit flag

**If cheater leaves partner for secret:**
- Showmance breaks up (`phase: 'broken-up'`, `breakupVoter: cheater`)
- New showmance forms with secret partner (if cap allows)
- `addBond(cheater, partner, -4.0)` (devastating)
- `addBond(secretPartner, partner, -2.0)` (collateral)

**Partner reaction** (personality-driven):
- High loyalty: bond crashes harder (x1.3 multiplier), +2.0 heat targeting cheater
- High strategic + low loyalty: moderate crash, pivots to alliances
- Villain: may weaponize the knowledge, reduced crash

**Secret partner reaction:**
- Complicit (knew about showmance): accepts cheater's choice either way, lower bond crash
- Didn't know: feels used if cheater stays with partner → `addBond(secretPartner, cheater, -2.0)`, feels validated if cheater chooses them

---

## Popularity

**Cheater:**
- Exposure: -4 like
- If stays with partner after caught: -2 like
- If leaves partner for secret: -3 like, +4 drama
- Per tier escalation: +2 drama

**Betrayed Partner:**
- Exposure: +3 like, +3 underdog
- If cheater stays: +1 like
- If cheater leaves them: +2 like, +4 underdog

**Secret Partner:**
- Complicit: -2 like, +2 drama
- Didn't know: +1 like, +1 underdog
- Cheater chooses them: +2 drama

**Catcher:**
- Told partner: +1 like
- Stayed silent: -1 like, +1 drama

---

## Camp Events

| Type | Badge | Color | Tier | Consequence |
|---|---|---|---|---|
| `affairSecret` | 🤫 Secret Meeting | gold | hidden | cheater-secret bond +0.2 |
| `affairRumor` | 👀 Rumors | gold | rumors | rumor source guilt bond +0.1 with partner |
| `affairCaught` | 😳 Caught | red | caught | cheater-catcher bond -0.5 |
| `affairSilent` | 🤐 Keeping Quiet | gold | caught (silent) | catcher leverage |
| `affairExposed` | 💔 EXPOSED | red | exposed | full bond crash, confrontation |
| `affairChoice` | 💔 Chose [name] | red/green | exposed | cheater picks |

8+ text variants per type. All events push to `ep.campEvents[tribeName].post` and `ep.affairEvents[]`.

---

## Aftermath Integration

### Truth or Anvil — new contradiction type `'affair'` (drama 9)

**Cheater:** "You were in a showmance with [partner]. You told [them] it was real. But the cameras caught you with [secret]. Every. Single. Night. So — truth or anvil. Was any of it real?"

**Betrayed partner:** "You trusted [cheater]. The whole tribe knew before you did. How does that feel to hear right now?"

**Secret partner (complicit):** "You knew [cheater] was with [partner]. You didn't care. Own it or deny it."

**Secret partner (didn't know):** "You got played too. [Cheater] told you [they were] single. Finding out on national TV — what went through your head?"

**Catcher who stayed silent:** "You SAW them together. You said nothing. [Partner] was right there. Why?"

### Interviews — affair-specific

**Cheater:** "Walk us through the timeline. When did the showmance stop being real and the affair start? Did you ever plan to tell [partner]?"

**Betrayed partner:** "When did you first suspect something? Or did you truly not see it coming?"

**Secret partner (complicit):** "You knew [cheater] was with [partner] the whole time. At any point did you think about walking away?"

**Secret partner (didn't know):** "When did you find out you were the other [man/woman/person]? What was that moment like?"

**Catcher who told:** "You're the one who blew it up. Do you regret telling [partner], or would you do it again?"

**Catcher who stayed silent:** "You watched it happen and said nothing. If you could go back, would you tell [partner]?"

### Fan Call — new category `'affair'` (5-6 templates)

- Superfan: "The secret affair was the biggest twist of the season — and it wasn't even planned by production."
- Drama fan: "Who's the real villain here — the cheater or the person who kept quiet?"
- Hater (to cheater): "You had someone who trusted you and you threw it away. Was the game worth it?"
- Hater (to complicit): "Homewrecker is a strong word. But if the shoe fits..."
- Supporter (to betrayed): "The whole fanbase is behind you. You deserved better."

### Unseen Footage — type `'affair'` (drama 9)

- Main clip: "What the cameras caught after everyone fell asleep... [cheater] and [secret] on the beach. The showmance with [partner]? A lie. This is the real story."
- Silent catcher clip (drama 7): "[Catcher] saw everything. Watched [cheater] walk back to [partner] like nothing happened. And said nothing."
- Hidden affair revealed post-elimination: If cheater eliminated while still hidden, the Aftermath reveals it as unseen footage. The audience finds out even if the partner never did.

### Host Roast — new templates

- Cheater: "had a showmance AND a secret affair. Most people can't manage one relationship out here and [name] is running a franchise."
- Betrayed partner: "trusted [cheater]. Which is like trusting a snake to watch your eggs. But [they] looked so sincere!"
- Secret partner: "the other [man/woman/person]. Every reality show needs one. [name] delivered."
- Catcher: "knew about the affair and said nothing. That's not loyalty — that's a front-row seat to the best show on the island."

---

## Triangle Aftermath Upgrade

Triangle interviews added (currently missing):

- Center: "Two people. One choice. Walk us through what was going through your head when you realized you were caught between [suitorA] and [suitorC]."
- Center (if chose): "You chose [chosen]. Do you think [rejected] will ever forgive you?"
- Rejected: "You watched [center] choose someone else. On a scale of one to devastated — where did you land?"
- Rejected (villain/schemer): "You got rejected and then went on a warpath. Was that strategy or was it personal?"
- Chosen: "You won. But the whole tribe watched [rejected] fall apart. Did you feel guilty — even for a second?"
- Suitor (organic resolution): "[Center] just... drifted away from you. No fight, no ultimatum. Is that better or worse than being told?"
- Third-party observer: "The love triangle tore the tribe apart. You had to pick a side. Was that harder than any tribal council?"

---

## Showmance Betrayal Aftermath Upgrade

Voting out your own showmance partner gets beefed up:

**Truth or Anvil** — dedicated setup (drama 8): "You voted out the person you were sleeping next to every night. Look [them] in the eye and explain."

**Interview:** "You wrote [partner]'s name down. After everything. Was there even a moment of hesitation?"

**Fan Call:** "You voted out your showmance partner. The fanbase has one word for that and it's not 'strategic.'"

**Confrontation camp event:** Fires the episode AFTER betrayal if betrayed partner is on RI/jury and cheater is still active. "word gets back" moment.

---

## Edge Cases

- **Affair + Triangle mutual exclusion:** Same trio can't have both. Personality fork decides path. Different trios can coexist.
- **Affair + Mole:** Affair provides suspicion cover (-0.15 resistance boost, same as triangle). Mole can sabotage affair bonds.
- **Affair + elimination:** Any of the 3 eliminated → resolves as `type: 'eliminated'`. If cheater eliminated while hidden → Aftermath reveals it.
- **Affair + tribe swap:** Separated cheater+secret → freezes. Cheater alone with secret (partner separated) → detection +15% spike.
- **Affair → new showmance:** If cheater leaves partner for secret, old showmance breaks up, new one forms (within cap of 2).
- **Max 1 active affair at a time** per cheater. A player can't run two affairs simultaneously.

## Serialization

- `gs.affairs` is plain objects, no Sets — survives `JSON.stringify`
- `patchEpisodeHistory` copies `ep.affairEvents` and `ep.affairExposure`
- gsSnapshot serialization clones the array
- `initGameState` adds `affairs: []`

## Debug Tab

- Affairs section in Romance tab: cheater, partner, secret partner, exposure tier, complicit flag, rumor sources, caught by, episodes active
- Romance Event Log gets: AFFAIR FORMED, AFFAIR RUMORS, AFFAIR CAUGHT, AFFAIR EXPOSED, AFFAIR CHOICE
