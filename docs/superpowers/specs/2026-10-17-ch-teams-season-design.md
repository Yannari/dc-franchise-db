# The Challenge — the Teams season

2026-10-17. The second season mode after Pairs (2026-10-17-ch-pairs-season-design.md). The user approved the shape
("go for it"). Sources (Wikipedia, read 2026-10-17): Battle of the Seasons (8 teams of 4 from the same original show;
the Power Team sends a team to the Arena), Invasion of the Champions (Champions vs Underdogs; the teams are dismantled
for the final), War of the Worlds 2 (two big teams; the losing team nominates one of its own by a public vote; the
winners' Tribunal picks the second player from either team; an Arena winner may switch teams; a team final, the
winners split the money equally).

## What it is

Every player belongs to a team. Dailies are team against team (the team's average). The winning team is safe. The
losing team votes one of its own into the Arena, out loud, in front of everybody: turning on your own teammates is the
drama. The winning team picks the opponent from any other team. The Arena is one on one; a winner who was voted in by
their own team may switch to another team. Partway through the teams break up and it is every player for themselves
(or, as a setup option, the final is team against team and the winning team splits the money).

## Setup (`options.teams`)

| Field | Key | Values | Default |
|---|---|---|---|
| Season mode | `chMode` | solo · pairs · **teams** | solo |
| How the teams are made | `chTeaming` | `shows` (by original show) · `champions` (past champions vs everybody) · `vets` (vets vs rookies) · `draft` (captains pick) | shows |
| How many | `chTeamCount` | `2` (two big teams) · `small` (teams of about four) | 2 |
| The end | `chTeamEnd` | `breakup` (teams break up before the final) · `team-final` | breakup |

My calls: the losing team's vote is the only way in (no house vote alongside it); the winners pick the opponent by
their own team vote; the break-up comes when the house is down to the finalists plus four; Redemption House and the
Tribunal format stay available only after the break-up (they are solo rules).

## Engine (`js/ch/teams.js`, `js/ch/team-week.js`)

- `state.teams = [{ id, name, members, captain, how }]`, `state.teamOf[name]`. Made after the arrivals.
  - shows: one team per original show (small) or the shows packed into two teams (2); a show with one player joins
    the smallest team. champions: past champions (the ledger; else the strongest third) vs the rest. vets: vets vs
    rookies, topped up to even. draft: the most respected (then strongest) players captain and pick in turn.
  - The captain: the most respected, else the boldest.
- Daily: every daily in teams; a daily with no teams version is played alone and scored on the team average. The
  winning team is safe; the last team is the one that votes.
- The vote: the losing team, the week's division (a gendered season). Its members deliberate (meetings, pleas) and
  vote out loud for a teammate. No member of the division on that team: the next team up. No team can: the house votes.
- The pick: the winning team votes, out loud, for the opponent: anybody of the division outside the winning team
  except the one voted in. The reason is said (a threat, a grudge, the easy one, breaking a team).
- The Arena: one on one, as now. A winner voted in by their own team may switch to another team (more likely the more
  of their team voted for them, the less loyal and the bolder they are). A team left with one player folds into the
  smallest other team.
- Break-up (`breakup`): the house at finalists + 4: TJ ends the teams; the season continues as a solo season.
- Team final (`team-final`): the final runs as now; each team is placed on its members' average; the best team's
  members are the champions and split the champion money equally.
- Storylines: team huddle (the captain rallies a losing team), the last stand (a team down to its last three knows
  it is next), poaching (somebody courts a player from another team to switch), a team rift (a teammate's alliance
  across the line), the switcher meeting their old team, team pride (the old shows).

## Words, viewer, export

New scenes have lines in `lines/teams.js`; scenes whose solo words would be wrong read `'<kind>~teams.<ending>'`
(write.js, like `~pairs`). The viewer gives each team a colour band (the pairs mechanism), the vote card says which
team votes, the winning team's pick has its own card, the team switch and the break-up are big moments, and Intel has
a Teams tab. The export writes each placement's team, the teams, and the switches.

## Tests

`tests/ch-teams.test.js`: every active player on exactly one team until the break-up; only the losing team's members
vote and only for a teammate; the opponent is never on the winning team; a switch moves the player; a team of one
folds; after the break-up nobody has a team; a team final crowns the whole best team. Audit block: switches per
season, the break-up episode, how often a team votes in its own strongest player.

## As built (2026-10-17)

Commits adb4a6ce (engine), 25fb21db (dialogue), 6b03af79 (setup, rows, record), 7a5af920 (viewer), 6a8d6540 (wording).

**What differs from the design above, and why (my calls):**
- **The call-out stays with the one voted in.** The design had the winning team pick the opponent. Reading the first
  transcripts, every deal, threat, meeting and spare-deal the house already plays is about a call-out ("if I get voted
  in, I'm calling out X"), so a winners' pick made a season of promises nobody could keep. The one voted in calls out
  from anybody of the division *not on the winning team*; into the winning team only when nobody else is left.
- **A team vote takes no volunteers** (`deliberate(..., { noVolunteer })`): the team decides.
- **A team final shields a team down to its last two** from voting and from the call-out, so there are teams left to
  reach it (seed 6, a draft season: the weaker team was ground down to nothing and the final was solo). When nobody
  else can go, the *winning* team votes one of its own in (`vote.winners`), never its captain.
- **No winning team's vote ever sends in the captain**; a division with nobody on the losing team moves the week to the
  other division (seed 11: four weeks with no Arena before this).
- **The Tribunal and partner weeks are off in a Teams season** (setup hides them; `challengeOptions` and
  `playChallengeSeason` force them off).
- A past **champion** is anybody the franchise ledger has seen win a season of any show (`challengeBackground`).

**Where the words come from:** `lines/teams.js`. `write.js keyFor` reads `<kind>~teams` pools while the teams stand
(`snap.teams`, taken when the scene happened; the vote carries `vote.team`, because episodes are written after the
season, when the teams may be long broken). `roles.js TEAM_ROLES` for the daily, the ceremony's opening, the team
final's champions. A switch names its captains by part (`joinCaptain`/`leaveCaptain`) so a captain already gone leaves
the part empty rather than handing the welcome to the captain being left.

**Bug classes the read found** (every one from a transcript, none from a red test): a welcome line given to the wrong
captain; a reply aired with nobody to answer it (tie it with `opt: '<role>'`); one person listed twice in a scene's
cast; "The The Underdogs" (team names that start with The); "the house has spoken" / "the house voted me in" over a
week only one team voted.

**Tools:** `CH_TEAMS=shows|champions|vets|draft [CH_COUNT=small] [CH_END=team-final] CH_SEED=n npm run ch:transcript`
writes `transcripts/ch-season-teams-<how>-<seed>.txt`. Tests: `tests/ch-teams.test.js` (rules),
`tests/ch-teams-run.test.js` (from the run tab), a Teams season in `tests/ch-vp-steps.test.js` (the viewer).
