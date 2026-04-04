# First Impressions Twist

## Overview

Episode 1 twist inspired by Survivor's first impressions and Disventure Camp 1. Each tribe votes someone out immediately based on gut reactions — no camp time, no strategy. The "eliminated" players are NOT eliminated — they swap tribes via round-robin. The normal episode (camp events, challenge, tribal) continues after the swap with the new tribe compositions.

## Twist Registration

```js
{ id:'first-impressions', emoji:'👀', name:'First Impressions',
  category:'team', phase:'pre-merge',
  desc:'Each tribe votes someone out on first impressions alone. The "eliminated" players swap tribes instead.',
  engineType:'first-impressions' }
```

- Category: `team` (same row as tribe-swap, abduction, etc.)
- Phase: `pre-merge` — designed for episode 1 but technically schedulable on any pre-merge episode
- Schedulable through the normal twist UI

## Engine: `executeFirstImpressions(ep, twistObj)`

Called from `applyTwist` when `engineType === 'first-impressions'`.

### Flow

1. **Guard:** `gs.phase !== 'pre-merge' || gs.tribes.length < 2` → return
2. **Per-tribe vote:** For each tribe, run `formAlliances` + `simulateVotes` using the full engine with current (near-zero episode 1) bonds. Each tribe produces one voted-out player.
3. **Round-robin swap:** Tribe 0's target → Tribe 1, Tribe 1's target → Tribe 2, ..., last tribe's target → Tribe 0.
4. **Bond consequences:**
   - Every voter who voted for the swapped player: **-2.0** bond
   - Non-voters in the old tribe: **+0.5** bond (they were on their side — creates cross-tribe loyalty thread)
   - Every member of the new tribe: **+1.0** bond (fresh start, sympathy)
5. **Emotional state:** Swapped player set to `uneasy`
6. **Update tribe rosters:** Remove swapped players from old tribes, add to new tribes
7. **Store results on `twistObj`:**
   ```js
   twistObj.firstImpressions = [
     { tribe: 'TribeName', votedOut: 'PlayerName', votes: { target: count, ... }, voters: ['name1','name2',...], sentTo: 'NewTribeName' },
     // ...one per tribe
   ]
   twistObj.newTribes = gs.tribes.map(t => ({ name: t.name, members: [...t.members] }))
   ```

### What It Does NOT Do

- Does not replace the challenge — the full episode continues after the swap
- Does not actually eliminate anyone — this is a mock elimination into a swap
- Does not skip camp events — camp events generate for the new tribe compositions

### Episode Flow After Twist

First Impressions vote → Swap → Camp events (pre) → Challenge → Camp events (post) → Tribal Council → Elimination

## Voter Knowledge

**Full knowledge.** The swapped player knows every name that voted for them. This is the core drama engine — they arrive at their new tribe with specific grudges and specific loyalties.

## 3+ Tribe Handling

Round-robin swap: Tribe 1's vote → Tribe 2, Tribe 2's → Tribe 3, Tribe 3's → Tribe 1. Each tribe votes out exactly one person and receives exactly one newcomer. Clean and symmetrical.

## VP Viewer: First Impressions Screen

Dedicated VP screen at the start of the episode, before camp events. Uses `_tvState[key]` interactive reveal pattern.

### Screen Structure

1. **Title card:** "FIRST IMPRESSIONS" with tribe names
2. **Per-tribe vote reveal:** Votes revealed one by one (same click-to-reveal pattern as tribal vote screen). Each click reveals one vote card. After all votes shown, the target is highlighted.
3. **Twist reveal:** Dramatic card — "But nobody is going home." Voted-out player shown with "SAVED" badge.
4. **Swap announcement:** Card per swapped player showing `Old Tribe → New Tribe` with arrow visual.
5. **Reaction text:** 1-2 narrative lines per swapped player using `pronouns(name)`.

### Reveal Sequence

- Click: Tribe 1 vote 1
- Click: Tribe 1 vote 2
- ...
- Click: Tribe 1 target revealed
- Click: "TWIST — they're not going home"
- Click: Tribe 2 vote 1
- ...
- Click: Tribe 2 target revealed
- Click: "TWIST"
- (Repeat for Tribe 3 if applicable)
- Click: Swap announcement — all swapped players shown with destinations

### Data Source

Reads from `ep.twists` → the twist object containing `firstImpressions` array with vote data and swap destinations.

## Camp Event Injection

After the swap, a narrative camp event is pushed into the new tribe's `pre` events.

### Text Variants

- "{name} walks into {newTribe} camp carrying nothing but a grudge. {pr.Sub} know{pr.sub==='they'?'':'s'} exactly who put {pr.obj} here."
- "{name} arrives at {newTribe}. New faces. Fresh start. But {pr.sub} {pr.sub==='they'?'haven\'t':'hasn\'t'} forgotten what {oldTribe} did."
- "The tribe watches {name} walk in. Nobody expected a new face this early. {name} doesn't explain — {pr.sub} just start{pr.sub==='they'?'':'s'} building shelter."
- "{name} drops {pr.pos} bag at {newTribe} and looks around. These people didn't vote {pr.obj} out. That's a start."

### Badge

`SWAPPED` with class `gold`

### Bond Consequence with Non-Voters

Old tribe members who did NOT vote for the swapped player get **+0.5** bond. This creates a cross-tribe loyalty thread that pays off at swap or merge — "you didn't vote me out, I remember that."
