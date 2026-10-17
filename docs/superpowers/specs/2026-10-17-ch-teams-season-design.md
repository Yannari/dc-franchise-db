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
