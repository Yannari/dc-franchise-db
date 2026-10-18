# The Ridonculous Race: the eighth show

2026-10-18. Designed with the user over one long brainstorming session, after a leg mockup
(`mockup/mockup-rr-leg.html`) and an episode-by-episode read of both shows. Where this file says "the user", it
quotes or paraphrases them. Decisions marked **(my call)** were left to me ("complete for me"); the list at the end
gathers them so they can be checked.

Read first, in this order:

- `docs/ADDING-A-SHOW.md`: §0, §8.2–8.3, §16.9, §17.8, §18 (with §18.4) and §19;
- `docs/ridonculous-race-research.md`: what both shows do, leg by leg;
- `docs/ridonculous-race-identities.md`: the 54 identities, the 12 task types and their stat blends;
- `docs/ridonculous-race-decisions.md`: the running list of the user's decisions;
- `docs/ridonculous-race-scenes.md`: **the scene catalogue**, every kind of moment the race can air, from both
  shows, in 13 families, with its endings, consequences and threads: the contract between engine and dialogue;
- `docs/superpowers/specs/2026-10-14-the-challenge-design.md`: the closest show in build, and the pattern this
  spec follows.

This spec doesn't repeat them. It says where the Ridonculous Race follows them and where it differs.

## 0. What kind of show it is (§0 of the manual)

- **It eliminates by result, not by vote.** The last team onto the mat leaves, unless the leg is a
  non-elimination one. `roundShape: 'placements'`: every leg ranks every team.
- **A round is a leg**, one episode (a Superleg airs over two, ending the first on "to be continued"). Teams are
  **eliminated**. There is no jury.
- **A new kind of show for this engine** (the user: "kinda a different type of show than what we've done yet"):
  - **teams are in different places doing different things at the same time**, and they cross paths;
  - the game is decided by **time**: a clock per team, gaps that open and close.
  - Its dialogue is type A (§19.1), events fired by an engine with a director choosing what airs. The difference is
    the director: it **cuts between places on one shared clock** instead of walking one camp through its day.
- **Its own engine in its own `gs`**: `js/rr/`, headless, like The Challenge. §8.3 applies in full: read the past
  through `carriedFor`, write the ledger through `recordBuiltSeason`, and copy the bonds back.

## 1. Identity

| Field | Value |
|---|---|
| slug | `ridonculous-race` (already the manual's worked example) |
| prefix | `rr` (`rr-1`, `rr_episode_s1_e1`); checked free in `js/shows.js` on 2026-10-18 |
| name | The Ridonculous Race |
| host | **Don**, the show's own host, already in the franchise |
| `historyFromLedger` | `true` |
| `hasJury` | `false` |
| `roundShape` | `'placements'` |
| words | racer(s), team(s), Leg, `exit: 'eliminated'`, Chill Zone, Don Box, Travel Tip |
| calendar | fall, beside Total Drama and The Challenge; a Wednesday (pencilled 2026-10-17; goes in §5.1's table with the entry) |
| `careerStats` | leg wins, penalties, times last (survived), money begged |

**Don's voice** (research Part 2): a dry, self-absorbed host, never an announcer.
- He opens each place with "X! Home of A, B, and something that annoys me."
- "Don't care." "No sharing." "Kidding."
- The fake-out: "…is what I'd say if this weren't a non-elimination leg."
- Openly bored by some teams and scared of others. He hates themed Don Boxes and likes one.
- He never explains a rule twice in the same words.

**The look**: the logo's (stained-glass globe, black band, blue neon edge, orange letters), the Don Box, the Travel
Tip and the Chill Zone mat, all from the user's cut-outs.

## 2. The cast and the setup

- **Teams of two, built in the Casting Room** by drag and drop, in the same Pairs view The Challenge uses (a pair is
  two cards' Partner fields).
- **Per team**:
  - a **relationship**: parent and child, siblings, cousins, married, dating, newly dating, on and off, exes, once
    engaged, BFFs, grandparent and grandchild, coworkers, roommates, rivals, enemies, reality-show vets;
  - optionally an **identity** (54 built in, or custom), with a team name the user types.
  - A family team can have an identity; a team can also have none ("Father & Son").
- **Per person**: archetype and voice as usual.
- **Bonds inside the team**: friendship or romance, set in the Relationships tab.
  - Romance only between people who aren't family, and it can be one-sided (Carrie → Devin).
  - Family comes from the family-ties layer, never invented.
- **Default cast: 12 teams (my call)**, adjustable from 6 to 18 (the real show ran 18; the Amazing Race 11–12).
- **Alumni and new faces**: anyone who has played another show walks in with their history (`carriedFor`). A
  reality-show-vet team gets that relationship automatically when both partners have played before.
- **The route** is set on the Season Timeline: one place per leg, from the place library (§5).
  - **Randomize** books a route (distance-sensible, no place twice, the finale city last) and books what it draws (§17.4).
  - A **Surprise twists** switch, as on The Circle: off means only what's on the timeline happens.

## 3. The season's shape

**Length.**
- Eliminations = teams − 3: the final leg starts with three teams, and its midpoint cuts one.
- **Non-elimination legs ≈ a third of the elimination legs (my call; the real show had 11 of 26, the Amazing Race
  about 3 of 12)**: never the first leg, never the last two.
- 12 teams: 9 elimination legs + 3 non-elimination + the final = 13 legs.
- Two or three **double-length legs** (Superleg) are possible twists.
- Anything "per unit of time" (injuries, quits, fights) is scaled by the leg's hours, never by the leg (§16.3).

**One leg, in order** (research Part 2, "the shape of a leg"):

1. **The start.**
   - Teams leave last leg's mat **in arrival order, with the real gaps**: departure = arrival + the rest period.
   - Each team pulls a Travel Tip from the Don Box with **the leg's money** (§4).
   - The first leg opens at a starting line with Don's introductions (two lines a team) and the rules speech.
     An optional **Starting Line Task** gives the last team a Hazard.
2. **Travel**, where the gap mostly evaporates (§5.2): flights in batches, charters with sign-up sheets, shared
   buses, helicopters that wait for six, places that open at a set hour.
3. **The tasks**: two to four, chained so one task's outcome can feed the next. The real show's Either/Or, Botch
   or Watch and All-In, plus short Route Info tasks (carry it, find it, deliver it) that give the place its flavour.
   Each task loops until a local approves.
4. **The last stretch** to the mat: a wrong way, a footrace, a collision, a sweet moment at the wrong time.
5. **The Chill Zone**:
   - Don greets each team with a place.
   - A penalised team waits beside the mat with the clock running.
   - The last team is eliminated, or faked out on a non-elimination leg.
   - The first team wins the leg's reward.

**Non-elimination legs** (the user: "add money with begging and penalties"): the last team keeps racing with a
penalty, drawn per season from the real eras (my call to offer them all; the author can pin one):
- **surrender all money** (and no money at the next start);
- **surrender money and possessions** (the bag, everything but the passport);
- **Speed Bump**: an extra task next leg, shown with their faces at a stand;
- **marked for elimination**: 30 minutes added at the next mat unless they win the leg;
- **departure-time penalty**: start the next leg later.

**Other exits**:
- **Don goes to a team** too far behind to finish (by helicopter, on foot, to the stage); the exit happens there,
  as the user asked ("the game just stops for them").
- A **quit**: a Botch they can't do, a partner who has had enough.
- A **medevac**: the injured team **picks which eliminated team returns**, and picks the team that was kind to them
  (research ep 24). It's a twist the author can turn off.
- A **double elimination**, revealed after the first.
- A **tie on the mat**, broken by the last foot down, or by last leg's order.

**The finale** (both shows):
1. A flight to the finale city.
2. Tasks across the city.
3. A **midpoint Chill Zone** (a bronze mat): the last team there is out, in third.
4. A **memory task about the season**: put the season's places, tips or Don Boxes in order.
5. A last search (the briefcase and its combination).
6. A **footrace onto the stage**, where every eliminated team waits in the bleachers, each with a short interview
   (who they root for, their take), and Don crowns the winners.

## 4. Money

A cash envelope at every start (my call on the amounts: a stipend per leg from $0 to $300, sized to the leg's
travel, with one or two **zero-money legs** a season). Flights go on the show's card (economy only); everything else
costs cash: taxis, buses, trains, boats, food, a phone, a guide, a map.

| | |
|---|---|
| **Spending** | proportional to choices: a taxi is faster and costs; a bus is slower and cheap; walking is free. A team that wastes money (a lost taxi meter, shopping, a bribe that doesn't work) has less later |
| **Running out** | **begging** (People skill, boldness, the local mood; never at airports, which the real rules forbid), **selling** what they bought, **borrowing** from another team (bond and debt), **working** a small task for a local. Each is a scene, and each costs time |
| **Penalties** | non-elimination penalties take money or possessions (§3); a fine at the mat for some infractions (my call: a flight above economy costs 24 hours in the real rules; here it's that or a money fine, the author picks) |
| **Rewards** | cash, first class on the next flight, a phone call home, an Express Pass, a Save; the real show's rewards were small and rare, the Amazing Race's big; **one leg in three has a reward (my call)** |
| **Debts** | money lent between teams is remembered; paying it back or not is a bond event, and a story |
| **Spoilers** | the side panel shows each team's cash as of the step played |

Season 7 of the Amazing Race was won by a team that had lost everything on the leg before. That has to be
possible here.

## 5. The world, the places and the route

### 5.1 Places

**An invented world** (the World Tour rule): no real country or city names, in narration, tips or screens. The
places are the zones from the plate hunt: 41 places in `Downloads/RidonculousRace-frames/done/`, each with its own
plates, cut-outs and leg spec (`LEGS.txt`). Each place in the library carries:
- **its plates**, every one of them, each a stretch of the route (the user: "use it if it can help make the
  challenge more interesting and long");
- **its marks** on each plate (where teams stand, sit, swim, where Don stands, where the Don Box goes) and a water
  mask (`wet.js`), so nobody stands in the sea;
- **its tasks** (Either/Or sides, Botch or Watch, All-In, Route Info), each with its task types, a description in
  the four-part rule (`CLAUDE.md`: set-up, mechanic, what goes wrong, win condition), its loop and its judge;
- **its props** (the user's cut-outs: the royal guard at the twin-tower bridge, the log raft, the pineapple, the
  statue);
- **its travel**: how teams arrive (airport, harbour, station, helipad) and the local transport (taxis, tuk-tuks,
  jeeps, boats, camels);
- **its hours**: what opens when (the equaliser);
- **its sound**: ambience and music (§9.6);
- **its Don lines**: the "Home of…" opener and a gag at each task.

### 5.2 Travel, the equaliser engine

Every leg has at least one moment where the gap resets or shrinks (research Part 3). The kinds:

| Kind | How it works |
|---|---|
| **Flight batches** | the show fixes two or three flights with seat limits; arrival order takes the seats; a later flight can land first (a layover) |
| **Booking** | on some legs teams book their own flights: Travel skill finds the better connection; a team that finds it alone gets ahead, a team that shares it builds an alliance, a team that lies about it makes an enemy |
| **Charters and sign-ups** | departure times hidden in sand, on trees, on tambourines; a choice once made can't be changed |
| **Capacity** | a bus that carries everyone; a truck for three teams; a helicopter that waits for six; one ledge, one elevator, two teams per sauna, four workstations |
| **Hours of operation** | the next place opens at 8; whoever arrives at night waits with whoever arrives at dawn |
| **Ground travel** | taxis (the driver's skill and honesty are luck; Travel and People limit the damage), self-drive (navigation), on foot, the local transport; following another team is a strategic gamble |
| **Accidents** | a burst tyre, a storm, a slow pilot: rare, and they hit whichever batch they hit |

The waits are **social rooms**: the airport, the plane, the queue at the sauna, the night outside a closed temple.
That's where alliances are pitched, crushes noticed, strategy talked, lies told.

### 5.3 The world map

The user's map with real continent shapes, each place pinned where it sits. The route animates between legs: the
plane cut-out flies the path, and the next pin drops. A real "Previously" recap opens each leg (the mockup's map
intro is only a stand-in; the user wants a real one).

## 6. The race engine: one clock, many places

This is what makes the show different, and it is the engine's core.

**A leg is a timeline.** Each team has a clock (minutes since the leg's start) and a position: a route stretch, a
task, a queue or a vehicle. The engine moves every team forward stretch by stretch, in the order their clocks
reach the next event, so the world is always consistent:
- if two teams are at the same place at the same minute, they meet;
- a team that leaves a place before another arrives never sees it.

**A stretch takes time from**:
- the task's stat blend (identities doc), times the **identity** nudge (×1.12 good, ×0.88 bad);
- **teamwork**: the pair's bond and relationship, on tasks that need both;
- **energy and morale** (§7.3);
- **temperament as spread, not level**, in pressure tasks (the Big Brother library's rule);
- **luck**: a roll for the attempt, a travel event;
- **loops**: a failed attempt costs its time and starts again, until a local approves.

**The talk layer.** The race is mostly people talking while they do things (the user: "it's supposed to feel
realistic like the real show, but flow well, conversation"). So beside the mechanics, every stretch, every overlap
and every wait offers moments from the scene catalogue (`docs/ridonculous-race-scenes.md`):
- the partners get one or two at nearly every stretch (reading the tip, deciding, arguing about the way, a pep
  talk, a snap, money worries, an old wound);
- two teams at one place get a between-teams moment;
- a wait (a plane, a bus, a queue, a place closed for the night) becomes a room where three or four people talk.
Each moment's ending is decided by the engine and changes something. **Threads** (a crush, a rivalry, a debt, a
secret, a curse, a team learning to work together, an alliance, a villain's run, an underdog's climb) carry across
legs and choose the next moment, so storylines build and pay off. A moment can cause the next (a gloat, a shove, a
confrontation), and pacing caps keep any pair or kind from crowding a leg.

**Encounters are computed, not scripted.** Whenever two or more teams overlap at a place, the engine offers them
an encounter, and the encounter decides something (§7.4). The airport, the plane, the queue, the task site, the
road (a taxi alongside), the mat.

**What teams know.** Each team knows only what it has seen: who was ahead at the last place, who was on the same
flight, who passed them on the road. That **perceived position** drives every strategic choice: whether to help,
whether to sabotage, whom to Boomerang, whether to panic. A team can believe it's last and be wrong (research ep 4).

**Headless and seeded.** A leg plays from a seed. Every random draw has a stream, so the words never move a result,
and a replayed leg plays the same.

## 7. What decides the race

All of it is proportional (`stat * factor`, never a threshold), runs on **perceived** bonds, uses the nine stats
only, and keeps the archetype rules unchanged: nice archetypes never scheme or sabotage; neutrals only with
`strategic >= 6 && loyalty <= 4`.

### 7.1 The tasks

- **Either/Or** (Detour, most legs): a team picks a side from what it believes it's good at, then by **watching**:
  - teams already struggling on one side;
  - the contrarian pick (the Goths pick the side nobody is doing);
  - an identity quirk (the squeegee sound).
  Switching is free, except for the time it takes.
- **Botch or Watch** (Roadblock): the **teaser is read before the pick** ("Who's got a strong stomach?").
  - Partners **must alternate** (the real show's rule; it also keeps the count even, so the Amazing Race's cap is
    not needed). Doing two in a row is a penalty.
  - A **Random Botch** decides who by the tip, and breaks the alternation.
  - The watcher can only cheer; helping is a penalty (caught or not, by who sees it).
  - **Quitting** costs 4 hours.
- **All-In**: both must do it; one partner doing it alone is a penalty.
- **Route Info tasks**: carry, find, deliver, ride; the place's signature.
- **Superteam** (Intersection): teams pair up with whoever is there (or wait for someone), and **who chooses whom is
  an alliance signal**.
- **Head-to-Head**: a queue of duels; the loser waits for the next team; the last one is penalised.
- **Memory tasks** in the finale.

**What happens at a task**: the clutch and the choke, an injury, a refusal ("the helmet will ruin my hair"), a
loop, a judge saying no, an identity making it easy (the Ice Dancers' tango) and the others calling it unfair.

### 7.2 Inside a team

- **The stress loop** (identities doc, "temperament off the task"):
  - under pressure (lost, last, a task failed twice) a volatile partner snaps;
  - the bond drops, and tasks that need both get slower until they make up;
  - exes snap fastest; a parent swallows it for the kid.
- **Leadership shifts** on events: an injury, a crush, anger, a win. The pair has a leader, and it can flip.
- **Managing your partner**: a bribe (snacks), reverse psychology, a distraction, a pep talk, a lucky hat. Each is a
  scene with an effect.
- **Separation**: two partners lose each other and follow different rules; the mat needs both.
- **Quitting** in an interview, and un-quitting.
- **Breakups and makeups** inside a team (the Daters), and **the sweet moment that costs the race** (stopping short
  of the mat to say they're back together).

### 7.3 The mind

The Challenge's meters, shortened for a race: **energy** (drained by tasks and travel, restored at the Chill Zone
rest), **morale** (wins, losses, homesickness), **stress** (time pressure, being lost, a partner's snap), and
**feelings with a target** (a grudge, a debt, a crush), remembered across legs.

### 7.4 Between teams (encounters)

The mechanics below are the core; the full set of moments between teams, with their endings and consequences, is
families 2, 3, 4, 7 and 8 of the scene catalogue.

Each one decides something, and each one has a consequence (`CLAUDE.md`: no cosmetic events):

| Encounter | What it decides |
|---|---|
| **Help** | carrying someone out of danger, sharing a cab, a spare ring, a hand at a jump. **It costs the helper time** and creates a debt that's remembered and can be repaid legs later (the Surfers chosen to return) |
| **Deals** | help for an alliance, information for a seat, a ride for a promise; deals can be broken, and breaking one is a betrayal in the ledger |
| **Alliances** | formed in the moment (a rescue, a shared queue), trial ones, forced ones (Superteam), refused ones (personality); members hand each other places at the mat and stop short of sacrificing themselves; they break near the end |
| **Information** | a team shares or hides the better flight, lies about a direction, follows another team; free to lie (the real rules) |
| **Sabotage** | only for the archetypes that may scheme; physical (a push, a ram, an oar), theft (a fossil, a ball, a pet), course sabotage (brakes, an oiled emu, a fake shortcut), mind games (a taunt, a lie, a secret used), admin (seats by the toilets, a later flight); **caught by witnesses or Don, it's a penalty**, and it often costs the saboteur too or hands the win to a third team |
| **Rivalries** | feuds escalate leg by leg (Ice Dancers and Cadets) and show up on screen as the trigger for sabotage and Boomerangs |
| **Romance** | across teams: a crush, a near kiss, jealousy, a triangle (Carrie holding Ryan's hand); through `romanticCompat` and the showmance cap; it costs focus and places, and third parties carry it (Kitty's love radar) |
| **Taunts and talk** | in queues, at the airport, on the plane; each moves a bond and sometimes a choice |

### 7.5 The race's own twists

Booked on the timeline or drawn (Surprise twists):

| Twist | How it works here |
|---|---|
| **Boomerang** (U-Turn) | at a marked Don Box, a team that holds one sends another team back to redo the last task. Found on a tip (the Ridonculous way) or offered to every team at the board (the Amazing Race way). **Chosen** from perceived position, threat and grudges, with the user's earlier approved variant: a **Boomerang Vote**, where every team votes at the start of the leg and the most-voted team is hit (Amazing Race 29). A Blind version hides who. It can be wasted (the target already passed, or skipped the task) |
| **Yield** | stop a team for a sand-glass's time |
| **Zip-It Ticket** (Fast Forward) | one team skips to the Chill Zone; earned by an optional task (or a hidden item inside a task, like the branded catfish) |
| **Express Pass** | skip one task; a second pass must be given to another team, and the choice is an alliance signal |
| **Speed Bump** | the non-elimination penalty above |
| **Save** | survive one last-place finish |
| **Switchback** | a famous task from an earlier leg or season returns |
| **Starting Line Task / Hazard** | a task before the first flight; last gets a Hazard |
| **Scramble** | several tasks, any order |
| **Partner Swap** | partners trade teams for a leg |
| **Double elimination**, **Superleg** (no mat at the halfway point), **No-Rest Leg** | as in research Part 3 |
| **Medevac and Return** | §3 |

Each twist explains itself on screen the first time it appears (a rule the viewer is never told is a bug, §16.4).

### 7.6 Penalties, read out by Don

A fixed table (my call, the Amazing Race's, read in Don's voice):

| Infraction | Penalty |
|---|---|
| Not following the tip, minor | 15 min |
| Standard infractions | 30 min |
| Wrong transport | 30 min + any time gained |
| Helping on a Botch, one partner skipping an All-In | 30 min |
| Caught sabotaging course equipment or another team | 1 h |
| Quitting a Botch | 4 h |
| Skipping an Either/Or | 6 h |
| A flight above economy | 24 h, or the money fine |

Served beside the mat; a last-place team's penalty isn't served on an elimination leg; on a non-elimination leg it
carries into the next start.

### 7.7 Popularity

Every heroic, villainous, cowardly or selfless moment moves `gs.popularity` (`CLAUDE.md`): a rescue, a
sabotage caught, a quit, a refusal, a rival helped.

## 8. Dialogue (type A with a race director, §19)

**The scene catalogue** (`docs/ridonculous-race-scenes.md`) is what the dialogue writes: about 140 kinds in 13
families (the partners; teams together; group rooms; romance and matchmaking; locals, drivers and judges; money;
information and deception; sabotage; body, fear and limits; the place itself; Don; the twists; interviews), plus
the threads. Each kind is written as whole exchanges of 8–12 lines, keyed `long.<kind>.<ending>`, gated on the
facts the catalogue lists; an `interrupted` ending leaves its thread open.

**Every event is a scene** (`makeScene(kind, who, data, seenBy, spot)`), and **nobody refers to something they didn't
see**. This matters more here than on any show: teams in different places literally didn't see each other. The words
are written after the leg is played, from the record.

**The writing rules**, the user's:
- human dialogue; strong characterization;
- **no clever lines in the stepped viewer**;
- lines answer the line before;
- Don dry, not an announcer.
What carries over from the real show is the situation comedy, each character's habit, and the **contradictions
between partners** ("I'm not too competitive." "Yes, you are.").

**The voice layers**: the person's voice tags (Total Drama's 22), then the **team identity's voice lines** (identities
doc: voice lines and specific lines kept apart, so a custom identity borrows only the voice), then the relationship
(how siblings fight is not how exes fight).

| Moment | Scenes |
|---|---|
| The start | Don's introductions; teams sizing each other up; old faces from other shows; the rules speech |
| The Don Box | reading the tip aloud (a short title, then the instruction); Don's demo at the task with a small gag |
| Travel | the airport (booking, lies, alliances pitched), the plane (strategy, crushes, sleep talk), the taxi (the driver, the argument about the way), the wait at a closed place |
| Tasks | the pick ("Whose turn is it?" "Yours."), the attempt, the loop, the judge, clutch and choke, help and sabotage, the watcher cheering |
| Money | begging, selling, borrowing, the debt |
| Interviews | both partners together in front of the map, contradicting each other; solo for a secret (§9.4) |
| The mat | Don's place, the penalty, the reward, the fake-out, the elimination, the exit interview (warm, what they got from it) |
| The finale | the bleachers, the memory task, the footrace, the winners' speech |

**The director** (ported from Total Drama's, rebuilt for one clock): candidates offered as must / due / story /
colour, against a leg budget; **every team seen at every task** (the user's rule; §9.2); storylines with causes;
every same-day guard in §19.2 step 4. Pools keyed `long.<kind>.<ending>`, a facts whitelist, `placeOk` against the
place and the hour, the repetition rules, the voice layer, the phrasebook.

**The rest of the episode**: a real "Previously", "Next time", and a text backlog equal to what the viewer plays.

## 9. The viewer (`js/vp-rr-ep/`, §18.4 step by step)

The mockup (`mockup/mockup-rr-leg.html`) is the skeleton the user approved the direction of, and its feedback is
the rules.

### 9.1 The shape

- A **linear stepped viewer**, a visual novel: one click is one line, with avatar icons only (no full-body
  sprites).
- No map of events to pick from (the user: "it's more linear in that sense").
- Intel, the full-screen player, and going back to an earlier step, as on the other shows; some parts can be their
  own screens (the route map, the standings, the finale).
- `steps.js` is pure: a played leg in, screens out. The stage paints step N; only the newest step animates.

### 9.2 The cut

The director's order is the clock's order, cut between places, with time cards ("50 MINUTES LATER"):
- the first batch racing while the next flight is in the air;
- two teams converging on the same ledge from different routes;
- one team's errand in another place, intercut with the race.

**Every team is seen doing every task**, with no fast-forward for late teams; a team too far behind sees its
leg end where it stands.

**Suspense in a close race**:
- the order is not given away before the mat;
- the close teams are intercut;
- the footrace is staged;
- Don pauses before the placement;
- the standings in the side panel show only what has aired.

### 9.3 The stage

- **Camera**: wide for action; a close-up only where a line earns it; teams **sized and placed for what they're doing**
  (seated two to a row in a plane; a scene switch rather than shrinking people); nobody talks from off screen.
- **Motion**: idle motion on every avatar, a talk bounce on the speaker.
- **Every action animated**: a hop across stones, a swim with splashes, a raft down a river, a statue built, a cab
  ramming a cab.
- **Props**: the user's cut-outs at their marks (the Don Box on the sand, never in the water).
- **Plates**: every plate of the place in use, with **alive plates** everywhere (Total Drama's motion-map shader:
  water, wind, fire, leaves).
- **Slams** in the logo's look: the title card per place, BOOMERANG, PENALTY, NON-ELIMINATION, ELIMINATED, the
  winners.

### 9.4 The confessional

As the show shoots it (research, cap 9445906):
- both partners side by side in front of the dark teal world map, a compass rose bottom left;
- a green name bar ("Emma & Kitty / Sisters") on the team's first confessional of the episode;
- solo when the subject demands it (a crush on the partner).
The current backdrop is the user's map recoloured; a clean confessional plate is an edit-folder job.

### 9.5 The side panel (Intel)

What the viewer knows that the teams don't, each fact from the step where it's public, recorded when it happened,
never read live:
- where every team is and its clock;
- money;
- the pair's bond and who leads;
- grudges, debts and alliances;
- who holds a Boomerang and why they'd use it;
- the perceived position each team believes in.

### 9.6 Sound

The user's rule for this show: the sound depends on the place (Hawaiian music and waves on an island, crowd noise in a city).
- Recordings the user downloads, with a shopping list per place from me.
- Ambience per plate, music only where the moment earns it.
- A sting for the Don Box, the Boomerang, the mat.
- Mix: music > voices > ambience.

### 9.7 Tests and a look

The §18.4 tests:
- steps;
- staging;
- the ground (nobody in the water);
- nothing before its step;
- **every team appears at every task**;
- **the order isn't on screen before the mat**.
Then Playwright screenshots of every scene kind.

## 10. Modules

**Engine, `js/rr/`:**

| Module | Job |
|---|---|
| `state.js` | teams, partners, relationship, identity, money, the mind meters, the season record |
| `format.js` | the season's rules as data (penalties, Botch rules, non-elimination penalties, rewards) |
| `schedule.js` | legs from cast size, non-elimination legs, double legs, the finale; the Season Timeline is tested equal to it |
| `places.js` + `places/` | the place library: plates, marks, tasks, props, travel, hours, sound, Don's lines |
| `route.js` | the season's route (booked or drawn) |
| `clock.js` | the leg's timeline: teams moved stretch by stretch on one clock, overlaps found |
| `travel.js` | batches, booking, charters, capacity, hours, ground travel, travel events |
| `money.js` | stipends, spending, begging, selling, borrowing, debts, penalties, rewards |
| `tasks.js` + `tasks/` | Either/Or, Botch or Watch, All-In, Route Info, Superteam, Head-to-Head, memory; blends, loops, judges |
| `team.js` | the stress loop, leadership, partner management, separation, quits |
| `mind.js` | energy, morale, stress, targeted feelings |
| `encounters.js` | help, deals, alliances, information, sabotage, rivalries, romance, taunts |
| `knowledge.js` use | perceived positions and beliefs, on the shared layer |
| `twists.js` | Boomerang (and its vote), Yield, Zip-It, Express Pass, Speed Bump, Save, Switchback, Scramble, Partner Swap |
| `chill.js` | the mat: placements, penalties, rewards, eliminations, fake-outs, medevac and return |
| `final.js` | the finale |
| `season.js` | plays a season headless |
| `ledger-record.js`, `export.js` | the franchise record and the export (§5 of the manual) |

**Dialogue**: `js/rr/script/` and `js/rr/story/`, per the §19.6 checklist, from The Challenge's port.

**Site layer**:
- `js/rr-run.js`: the run tab, with the §8.3 read and write and the copy-back.
- `js/rr-cast-ui.js`: setup, using The Challenge's Pairs view plus the relationship, identity and team name fields.
- `js/vp-rr-ep/`: the viewer.
- The registry entry, the identity maps (§9), `CONFIG_SCOPE`, the ratings signals (§2.5, only after a season is
  played).

## 11. The art (already well under way)

- **Plates**: the user's edits in `Downloads/RidonculousRace-frames/done/` (41 places; three to go: geyser island,
  carnival rainforest, haunted castle), through the pipeline: ESRGAN 2560×1440, marks, water masks, motion maps.
- **Props**: the user's cut-outs per place, plus race-wide pieces (the Don Box and its open version, the tip, the
  gold tip, the Boomerang, the mat, the plane, the logo).
- **Still to make**: a clean confessional plate (an edit folder), the bronze midpoint mat, the finale stage and
  bleachers, the Yield and Boomerang boards, the penalty clock.
- **Map**: the user's world map, with pins and routes.
- **Sound**: §9.6.

## 12. Tests and the audit

- **`npm run audit:rr-spec`**: a hundred seasons, every rate beside its chance line. An outcome rate is a read-out,
  not a target (§17.5). It measures:
  - leg wins per team, and how often the strongest team wins the season (the real shows: rarely);
  - the gap at each mat, and how often travel closes it;
  - close finishes;
  - penalties;
  - sabotage attempts and the share caught;
  - Boomerang targets;
  - begging and zero-money teams;
  - quits, medevacs, returns;
  - non-elimination saves;
  - alliance lifespans.
- **The transcript tool**, then reading three whole seasons before any screen (§16.1).
- **Engine rules**:
  - nobody knows what they didn't see;
  - nice archetypes never sabotage;
  - the mat needs both partners;
  - Botch alternation holds;
  - every outcome on screen is the engine's.
- **Dialogue**: the §19.4 table against every new pool; repetition measured per kind.
- **The ledger**: the season writes its record; the next show reads it.

### First audit, 2026-10-18 (100 seasons, 12 teams, four places)

The hard rules held throughout: no sabotage by a nice archetype, no Botch alternation broken, a winner every
season, every scene with a recorded effect. What the first runs showed, and what was done about it:

- **55 catalogue kinds never fired.** The talk layer offered only the partner family at a stretch (locals, money,
  body and place had no door); Don's opener, demo and ruling were never emitted; `leaderCheck` was never called;
  `size-up` read "first meeting" after the meeting was recorded; console, goodbye kiss and the exit interview had
  no moment; rooms opened only on a hold, never at a task or the mat. All fixed, pinned by `tests/rr-reach.test.js`.
  Nine still never fire, every one for want of place data the library brings (perform tasks, split tasks, a bus,
  a superteam, a Zip-It task) or a second Express Pass.
- **Begging was unreachable** (a broke team walked every taxi), and **Either/Or switches were 0** (the test
  compared a fresh attempt against a full one). Now 0.9 begs and 3.3 switches a season.
- **Romance never paid off**: a thread step weighed its own small `when` (a flirt at 0.06), the crush thread put
  the near-kiss before the confession and closed on the kiss, and the chained confession was refused by the
  romance cap. Now 7 confessions in 100 seasons, 1.3 interrupted attempts before each.
- **Read-outs, not fixed** (rates, not broken mechanisms):
  - **Domination is the known-hot number.** The top team takes 7.4 of 13 legs (chance 3.7) and the team with
    the most leg wins wins the season 55% of the time (chance 33%). Opening hours (a team that reaches a place
    before it opens waits at its door) brought it down from 8.3 and 60%. What remains is skill elasticity:
    a task's time scales with `5 / level` and its pass chance with `0.08 × (level − 5)`, so a level-7 team is
    1.75 times faster than a level-4 team on every task. It is a design decision until three seasons have been
    read.
  - The mean gap at the mat is 4.5 hours; 1.3 teams a season are eliminated where Don finds them.
  - A team saved on a non-elimination leg goes out the next leg 47–67% of the time, by penalty.
  - About one blow-up per team every four legs; exes the most (0.39 a leg), grandparents the least (0.19).
  - 9.3 sabotage attempts a season, 12% caught; Boomerangs aimed at teams 2.5/10 apart in perceived rank.

## 13. Sub-projects, in order

Too large for one plan. Each gets its own plan and ends with something that runs.

1. **Engine, headless, and its spec audit**: the clock, travel, money, tasks, team, encounters, **the scene
   catalogue as data, the talk layer, the threads, a plain transcript of every scene**, twists, the mat, the
   finale, `season.js`, `audit:rr-spec`. Starts with four places from the library, enough for a season.
2. **Dialogue**, straight after the engine (the user: dialogue is part of the core system): the script and story
   port, the pools for every catalogue kind, the voice layers, three seasons read. Written against the catalogue,
   so the engine's scenes are its fixed contract.
3. **The place library**: all 41 places as data (tasks in the four-part rule, travel, hours, Don's lines), from
   `LEGS.txt` and the research.
4. **Run tab and setup**: the registry entry, the Pairs setup with relationship, identity and name, the identity maps,
   the ledger read and write.
5. **Art**: plates through the pipeline, marks and masks, the remaining props, the confessional plate, the sound list.
6. **Viewer**: from the mockup to the stepped viewer, place by place.
7. **Export, screens and ratings**, after a season has been played.

## My calls, to check

1. 12 teams by default (6–18).
2. Non-elimination legs about a third of the elimination legs, never the first or the last two.
3. All five real non-elimination penalties offered, drawn per season unless pinned.
4. Money from $0 to $300 a leg, one or two zero-money legs; a reward on one leg in three.
5. Botch or Watch must alternate (Ridonculous) and the teaser is read before the pick (Amazing Race).
6. The Boomerang is chosen by the team that holds it, plus the Boomerang Vote variant the user approved earlier.
7. Penalties as the Amazing Race's fixed table, read by Don.
8. Sabotage allowed for the archetypes that may scheme, penalised when caught, as the Ridonculous Race did; the
   Amazing Race forbids it, and the user asked for sabotage.
9. The Express Pass, Save, Yield and Zip-It Ticket all exist as twists, each rare.
10. The finale: a midpoint bronze mat, a memory task about the season, the footrace onto a stage with every team
    watching.
