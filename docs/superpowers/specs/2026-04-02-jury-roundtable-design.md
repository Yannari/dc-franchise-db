# Jury Roundtable — Lobbying & Bitter Cascade

**Date:** 2026-04-02
**Scope:** Add jury roundtable debate with lobbying mechanics to the jury-elimination twist. Extends the existing `rpBuildJuryLife` screen with a structured finalist-by-finalist debate where passionate jurors campaign for/against finalists and shift persuadable jurors' bonds.

**Inspiration:** Disventure Camp S4 jury episode — Isabel campaigns for Jade, jurors argue and push back, positions shift before the vote.

---

## Problem

The jury-elimination twist has `rpBuildJuryLife` which generates narrative flavor (grudges, rooting, processing), but the jury's deliberation is purely cosmetic. Bonds erode or grow per episode (-0.8 grudge, +0.5 rooting), but there's no active lobbying mechanic where one juror tries to convince others. The `applyFTCSwingVotes` system does lightweight ally influence (+0.2 bond) but only at FTC, not in the jury house.

The result: jurors feel like passive observers. In reality (and in DC), jury houses are political — people campaign, argue, and shift positions.

---

## Design

### Engine: simulateJuryRoundtable(ep)

Called during jury-elimination twist episodes, after jury life events are generated. Bond shifts carry forward into future episodes and eventually into FTC voting.

**Step 1 — Identify lobbyists (proportional activation):**
Any juror CAN lobby. Whether they speak up depends on bond strength + personality:
- **Lobby chance:** `abs(bond_with_strongest_finalist) * 0.08 + boldness * 0.03`
  - Bond 5, boldness 7 = 61%. Bond 2, boldness 3 = 25%. Stronger feelings + bolder personalities speak up more.
- **Agenda:** If highest bond with any active player is positive → champion that player. If lowest bond is negative and has larger magnitude → oppose that player.
- Each lobbyist has ONE agenda (one active player to champion or oppose).

"Finalists" at this point = `gs.activePlayers` (the people still in the game who could reach FTC).

**Step 2 — Identify persuadable jurors (proportional margin):**
Jurors whose top two active-player bond scores are close — swing votes without a locked-in preference.

- **Margin threshold:** `2.0 - juror_social * 0.08`
  - Social 10 = margin 1.2 (reads people well, harder to be "undecided"). Social 3 = margin 1.76 (more susceptible).
- Use bond to rank active players per juror. If gap between #1 and #2 is less than the juror's margin threshold, they're persuadable.
- Jurors who activated as lobbyists are NOT persuadable (they have fixed opinions).

**Step 3 — Lobbying rolls (all proportional):**
For each lobbyist, attempt to persuade each persuadable juror:

- **Persuasion chance:** `lobbyist_social * 0.04 + max(0, getBond(lobbyist, target_juror)) * 0.05`
  - Social skill matters. Lobbyist-juror relationship matters. Negative bond = no influence (capped at 0 via max).
- **Pushback resistance:** `abs(getBond(juror, discussed_finalist)) * 0.12 + juror_strategic * 0.03`
  - Strategic jurors harder to sway. Strong existing opinions harder to move. But nobody is immune.
  - If `Math.random() < resistance` → lobby fails, generate pushback event.
- **Bond shift on success (proportional to social):**
  - Champion lobby: `addBond(target_juror, championed_finalist, +(0.15 + lobbyist_social * 0.03))`
    - Social 3 = +0.24. Social 8 = +0.39. Social 10 = +0.45.
  - Bitter lobby: `addBond(target_juror, opposed_finalist, -(0.15 + lobbyist_social * 0.03))`
- **Cap:** Each persuadable juror can only be shifted ONCE per roundtable. First successful lobby wins.

**Step 4 — Generate discussion events per active player:**
For each active player being discussed, collect 2-3 events from jurors:
- Supporters (bond >= 2): argument-for quote
- Detractors (bond <= -2): argument-against quote
- Lobby results: who shifted, who pushed back
- Prioritize lobbyists and persuadable jurors for event generation. Fill remaining slots with general jury sentiment.

All quotes use `pronouns()`. Personality-driven tone variants:
- Bold/hothead jurors: aggressive, confrontational arguments
- Strategic jurors: analytical, game-focused arguments
- Social jurors: relationship-focused, emotional appeals
- Loyal jurors: honor-based arguments ("they played with integrity")

**Data saved:**
```javascript
ep.juryRoundtable = {
  activePlayers: [names],        // who was discussed
  lobbyists: [{
    juror,
    type: 'champion' | 'oppose',
    target: finalist_name,       // who they're campaigning for/against
    attempts: number,
    successes: number
  }],
  shifts: [{
    lobbyist,
    persuaded: juror_name,
    finalist,
    direction: 'for' | 'against',
    bondDelta: number
  }],
  pushbacks: [{
    lobbyist,
    resistedBy: juror_name,
    finalist,
    reason: string
  }],
  discussions: [{
    player: active_player_name,
    events: [{
      juror,
      type: 'support' | 'oppose' | 'lobbied' | 'pushback',
      text: string,
      badge: string,
      badgeClass: string,
      players: [juror, player]
    }]
  }]
}
```

---

### VP: Extended rpBuildJuryLife Screen

The existing `jury-life` screen gets a second section appended below the current jury house events.

**Section: "The Roundtable"**
- Divider/header: "JURY ROUNDTABLE" in uppercase
- Organized by active player (finalist candidate):
  - Active player portrait + name as section sub-header
  - 2-3 juror quote events below, each with:
    - Duo portrait (juror + active player being discussed)
    - Quote text
    - Badge:
      - Supporter: green "IN FAVOR"
      - Detractor: red "AGAINST"
      - Lobby success: gold "LOBBIED"
      - Pushback: red "PUSHED BACK"
- Closing summary: "The Verdict" — one-line summary of net shifts (e.g., "Jade gained 2 supporters. Logan lost 1.")

No interactivity — static narrative, scrollable, badge-driven. Same visual style as the existing jury life events above it.

---

### Bond Flow

```
Jury house life events (existing):
  - Bitter juror: addBond(juror, topVoter, -0.8)
  - Rooting juror: addBond(juror, friendInGame, +0.5)
  
Roundtable lobbying (new):
  - Successful champion lobby: addBond(persuaded_juror, finalist, +0.4)
  - Successful bitter lobby: addBond(persuaded_juror, finalist, -0.4)
  
All bond shifts persist into future episodes → affect FTC jury vote scoring
```

---

### Integration Points

- **Call site:** Inside the jury-elimination twist handler, after existing jury life generation. The roundtable fires in the same episode.
- **FTC impact:** No special handling needed. Bond shifts from lobbying naturally feed into `simulateJuryVote` and `projectJuryVotes` which are bond-based. A successful bitter campaign against a finalist lowers bonds → fewer jury votes for them at FTC.
- **Reunion:** `ep.juryRoundtable` data available for reunion screen to reference ("At the jury roundtable, Isabel lobbied hard for Jade...").

---

## Out of Scope

- Finale-phase roundtable (user decided against this)
- Per-episode light lobbying (user chose concentrated single-episode approach)
- Interactive reveal on VP screen (static narrative is sufficient)
- Counter-lobbying (lobbyist vs lobbyist arguments) — could be added later but not needed now
