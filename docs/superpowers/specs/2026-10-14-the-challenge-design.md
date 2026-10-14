# The Challenge: the seventh show

2026-10-14. Designed with the user in one brainstorming session, after re-ranking the shows still to build
(`docs/ADDING-A-SHOW.md` §20: The Challenge first). Every decision below was the user's or approved by them;
where this file says "the user", it quotes or paraphrases them.

Read `docs/ADDING-A-SHOW.md` first, in this order: §0, §8.2–8.3, §16.9 and §17.8, §18 (with §18.4, Total
Drama's viewer recipe), §19 (dialogue). This spec does not repeat them; it says where The Challenge follows them
and where it differs.

## 0. What kind of show it is (§0 of the manual)

- **It eliminates by vote AND by result.** The house votes someone into the Arena (a real ballot every
  episode), and a head-to-head duel decides who leaves. `roundShape: 'ballots'`.
- **A round is an episode** (a cycle of a few days). Players are **eliminated**. No jury.
- **Dialogue type A** (§19.1): a house with a vote. Its words come from a story layer ported from Big Brother's
  (`js/bb/story`, the working port named in §19.6), plus Total Drama's pieces Big Brother lacks.
- **Its own engine in its own `gs`** (approach A, chosen over a Big Brother mode and over importing Big
  Brother's modules): `js/ch/`, headless, like The Traitors, Perfect Match and The Circle. Nothing in Big
  Brother or Total Drama changes. §8.3 applies in full.

## 1. Identity

| Field | Value |
|---|---|
| slug | `the-challenge` |
| prefix | `ch` (`ch-1`, `ch_episode_s1_e1`); checked free on 2026-10-14 |
| name | The Challenge |
| host | **TJ Maxx** (portrait: the user's `Downloads/TJ.png`, Total Drama style, sunglasses, neck tattoo, a "Fuego" tank top) |
| `historyFromLedger` | `true` |
| `hasJury` | `false` |
| `roundShape` | `'ballots'` |
| words | player(s), Episode, `exit: 'eliminated'`, `exitAction: 'eliminate'`, the daily challenge, the Arena, elimination beast |

**TJ Maxx's voice.** A wacky MTV-2000s host in the mould of Guy Fieri and Rob Dyrdek: loud, hyped, slang, a
nickname for everybody, over-the-top introductions to every elimination, delighted by chaos and wipeouts. Under
the noise he respects fighters and has an outraged bit for quitters. Every line is original: no catchphrase is
borrowed from a real host.

**The look of the whole show is Total Drama's cartoon style**, like TJ's portrait and the roster avatars.

## 2. The cast

- **24 by default** (12 men, 12 women), adjustable.
- **Alumni by default, rookies on purpose.** Anyone who has played a season of any show comes in with their
  history (the franchise ledger, `carriedFor`). A roster character who has never played can be cast and is billed
  as a **rookie**, so a vets-and-rookies season works.
- **Divisions.** The season is gendered by default (men's and women's weeks, two champions). A non-binary
  character (6 on the roster on 2026-10-14) picks a division at casting, and the cast screen shows it. A season
  option makes it gender-blind (anyone against anyone, one champion); it is one field in the format.
- Casting stays manual (§14.14): the ledger supplies context, it never chooses the cast.

## 3. The season's shape

**One episode is a cycle of a few days in the villa:**

1. **House days.** Politics on the map: arrivals, alliances, grudges carried in from other shows.
2. **The daily challenge.** Solo, pairs (partner weeks) or teams; each scores a stat blend. The winners (or the
   winning pair or team) are **immune**.
3. **Deliberation.** The house argues and campaigns in front of everyone.
4. **The vote.** The week belongs to one division, alternating, a coin toss for the first. Everybody votes
   **out loud** for a non-immune player of that division. Most votes goes into the Arena; the daily winners
   break a tie.
5. **The call-out.** The player voted in names their opponent from the non-immune players of the same division.
6. **The Arena.** A one-on-one duel from the elimination library, drawn AFTER the call-out (as on the real
   show). The loser leaves with TJ's goodbye; the winner returns to the house.

**Exits outside the vote:** a quit (and TJ's contempt for it), a medical removal, a disqualification for
violence. All three are real and frequent on the show.

**Length.** About 16–18 episodes for 24. Double eliminations come late, so the final has about 6–8 finalists
balanced between the divisions; when one division runs low, later weeks lean toward the larger one. Anything
"per unit of time" (quits, fights, injuries) is scaled by days, never by episodes (§16.3).

**The final, over two days.** Day 1: a race through checkpoints (physical, puzzle, endurance stations); last
place at the first checkpoint faces an **instant elimination**; then the **overnight stage**, a test of
endurance and temperament where people can quit. Day 2: the last legs; time or points decide. Two champions (a
man and a woman), or one in a gender-blind season. Every finalist gets a placement for the ledger.

**Format as data** (`format.js`): who is immune, who nominates, who votes, how the opponent is chosen, the
division rotation, the tiebreak. The first build ships one format ("vote and call-out"). Tribunal, last place
goes in, chain of safety, Red Skulls and pairs seasons are later formats, not new code.

**Later (season options or twists, not in the first build):** a redemption house (the eliminated compete to
return, like Total Drama's Rescue Island), arrivals mid-season, the Purge, the other formats, the prize pot and
the winner's split, champions as Arena gatekeepers.

Real-show sources for the rules: Wikipedia's *Battle for a New Champion*, *Spies, Lies & Allies*, *Total
Madness*, *Vets & New Threats*. Check the fandom wiki again before building any mechanic (§16.9 step 3), and
write the source into the code comment.

## 4. What decides the game

All of it is proportional (`stat * factor`, never a threshold for gameplay) and runs on **perceived** bonds, so
a player can misread the house. Stats are the nine valid ones only. Archetype rules hold unchanged: nice
archetypes never scheme, sabotage or throw; neutrals only with `strategic >= 6 && loyalty <= 4`.

### 4.1 The house vote

Each voter scores every eligible player of the week's division:

- **threat** (how dangerous they look in dailies and the Arena), weighted by the voter's `strategic`;
- **bond** (perceived friendship pulls away, weighted by `loyalty`; grudges, including history from other
  shows, push toward);
- **the bloc** (an alliance's agreed target pulls, by `loyalty`);
- **free-ride heat** (never been in the Arena);
- **fear of the call-out** (voting in someone who resents you is dangerous);
- **will they lose?** (a beast voted in just removes whoever they call out; strategic voters prefer someone likely
  to lose, or someone whose call-out will hit their enemies);
- **the final** (as the season goes on, who could beat me in the final outweighs who is weakest today).

The vote is **open and in order**: later voters see the count so far (a bandwagon, a swing vote deciding in the
moment, last-second flips). Each ballot costs something in public: voting against a friend hurts the bond, and
the person voted in remembers every name. Each ballot is stored with its chain (wanted → asked → told the house →
cast) for the side panel and the dialogue.

### 4.2 The call-out

The player voted in scores each eligible opponent on four reasons: **survive** (the odds of beating them in an
average Arena game), **grudge** (a bad bond, or *they voted for me*), **prove it** (their strength times
`boldness`, plus hunger for respect), **avoid the beast** (a penalty on a strong Arena record). Allies are
almost never called out, unless the player is highly strategic with low loyalty. The pick is weighted-random;
the strongest reason is recorded so the speech matches it.

### 4.3 The Arena

The game is drawn after the call-out. The result: each player's stat blend for that game, a little momentum
from respect, **energy** and **confidence** (§4.5), and luck, through a logistic win probability. Each game
records its rounds as beats for the viewer.

### 4.4 Respect and the power alliance

**Respect** per person. Up: an Arena win (most), a daily win, surviving a vote, volunteering and winning. Down:
quitting (most, and TJ says so), losing after volunteering, getting caught throwing, never going in (the
free-ride accusation grows with the season). Respect feeds threat in the vote and avoidance in the call-out.

**The power alliance.** Alliances form from bond clusters around strategic leaders (The Traitors'
`tr/alliances.js` blocs, adapted). Each cycle the leader proposes a target at deliberation; each member weighs
it. An alliance cracks when the target is a member's friend, or when an ally votes for or calls out another
ally: flips, and a "the house against the alliance" storyline.

### 4.5 The mind (emotions as state)

Meters that move every day and feed every decision proportionally:

- **Energy**: dailies, the Arena, nights out and poor sleep drain it; rest restores it. It scales performance (a
  beast after three eliminations in a row comes in tired).
- **Confidence**: wins up, losses and being voted in down. Under pressure, low `temperament` with low confidence
  **chokes**; high `boldness` gives **clutch**.
- **Paranoia**: votes against you, whispers overheard, allies talking without you. A paranoid player makes
  pre-emptive moves; a paranoid leader turns on the alliance.
- **Morale and homesickness**: grow over a long season (faster for low `endurance` and `temperament`), drop after
  a loss or a breakup. They drive "I want to go home" scenes and the **quit** risk.
- **Feelings with a target, remembered**: anger at whoever voted you in (a **revenge list** kept until settled
  in a vote or a call-out), gratitude and **debts** (they saved me, picked me, broke the tie for me), guilt after
  voting a friend in, humiliation after a public loss, jealousy in a romance.

Each player also carries Total Drama's psyche need for the season (`td/story/psyche.js`: belong, prove,
control, protect, temper, redemption, home).

### 4.6 The game theory of an open vote

- **Leverage threats** at deliberation ("put me in and I'm calling **you** out"); credible from a strong Arena
  record and high `boldness`, sometimes a bluff.
- **Insurance deals** ("I won't vote you; you won't call me out"), stored; breaking one is a betrayal and goes
  into the ledger.
- **Shields**: strategists keep a bigger threat around to hide behind, and are exposed when the shield goes.
- **Partner picks as signals**: choosing a partner announces an alliance; being picked last, or not at all, shows
  your standing and stings.

### 4.7 The social structure of a crossover house

- **Original-show loyalty**: on day one, people from the same show start with a pull toward each other (the
  Total Drama people, the Big Brother people, the villa types). The cliques dissolving is a storyline.
- **Vets and rookies**: vets treat rookies as numbers; rookies trade votes for safety; mistreated, they can rise
  together.
- **Reputation brought in**: a known liar on The Traitors starts with less trust; a famous betrayer is watched.
  From the ledger only, never invented.
- **The house power ranking**: who people come to, who sets the target. Measured, it moves, shown in the panel.
- **TJ's opinion**: respect for fighters, contempt for quitters and floaters; it colours his lines.

Beliefs (who is with whom, what someone is planning) live on `js/knowledge.js`, the layer The Traitors'
deduction is built on: a claim has a source and a confidence, and a read-skill roll sees through lies.

### 4.8 The other systems (each fires as an event with consequences)

- **Volunteering**: a strong player volunteers into the Arena to take out a target. It can backfire.
- **Throwing the daily**: to avoid looking like a threat, or to sink a partner. Throwing is a scheme, so only
  the archetypes allowed to scheme do it (villains always; neutrals with `strategic >= 6 && loyalty <= 4`).
  Others can catch it (`intuition`), and it costs trust and respect.
- **Party nights**: about one a cycle. Drinking raises conflict risk, scaled by `temperament`. A fight can turn
  physical, and a physical fight is a **disqualification**: TJ comes in and sends someone home.
- **Showmances and couples**: through `romanticCompat` and the franchise's romance rules (the cap on active
  showmances). Couples protect each other in the vote; a breakup becomes vote material.
- **Partner weeks**: some dailies in pairs, drawn or chosen; eliminations stay individual.
- **Rewards**: a call home or letters (family ties), morale up, homesickness eased.
- **Quits and medicals**: from the mind meters and from injuries in dailies and the Arena.

## 5. Dialogue (type A, §19)

**Every event is a scene** (`makeScene(kind, who, data, seenBy, spot)`) with real consequences, and nobody
refers to something they did not see. The words are written after the episode is played, from the record,
never from live state.

**House life**, adapted from Total Drama and Big Brother: deals, pitches, gossip, alliances forming and
cracking, reads, threats, confessionals, the psyche storyline, witnesses, apologies, romance from spark to
breakup.

**New to The Challenge:**

| Moment | Scenes |
|---|---|
| Day one | the walk-in; people from the same show recognise each other; old grudges and exes meet again; vets size up rookies |
| Partners | the draw or the pick, picked last, stuck with a rival |
| The daily | clutch, choking, injuries, trash talk, help, throwing and getting caught; winners celebrate, losers scramble |
| Rewards | the call home, the letters |
| Deliberation | the big group scene: campaigns, leverage threats, outing an alliance, pleading, flips |
| The vote | read aloud in order, each name and reason, the swing vote's hesitation |
| Volunteering | "Put me in", the room, the target finding out |
| The call-out | one speech per reason |
| The Arena | TJ's introduction; the game explained in four parts (setup, mechanic, what goes wrong, how to win, as `CLAUDE.md`'s challenge rule asks); rounds as beats; the exit; TJ's goodbye; **the return to the house**, the winner facing everyone who voted them in |
| Party night | drinking games, flirting, fights, TJ's disqualification |
| Quits and medicals | the talk with TJ, the confessional, the house |
| The final | checkpoints, alliances ending, the overnight (breakdowns, quits), the winner's speech, TJ crowning the champions |

**Director**, ported from Total Drama's (`td/story/director.js`): candidates offered as must / due / story /
colour against a day budget; the morning after an elimination (the house wakes up one short); storylines with
causes; every same-day guard in §19.2 step 4.

**Writer**: pools keyed `long.<kind>.<ending>`; a facts whitelist; the voice layer (Total Drama's 22 tags and
overlays); the phrasebook; set-up lines; `placeOk` against the villa's places and the time of day.

**The rest of the episode**: "previously on", "coming up", and a text backlog equal to what the viewer plays.

**Port**: `js/ch/script/` and `js/ch/story/` per the §19.6 checklist, from Big Brother's `js/bb/story` as the
base, plus Total Drama's psyche, witness, setup, previously, phrase and voice families.

## 6. Modules

**Engine, `js/ch/`:**

| Module | Job |
|---|---|
| `state.js` | cast, divisions, vet or rookie, each person's season record (dailies won, Arena wins and losses, times voted in, respect), the mind meters |
| `format.js` | the season's rules as data |
| `schedule.js` | the calendar: days per episode, episodes from cast size, late doubles, the final. The Season Timeline is tested equal to it (§17.4) |
| `dailies.js` + `dailies/` | the daily challenge library: blends, solo, pairs, teams, partner weeks, throwing |
| `arena.js` + `arena/` | the elimination games: blends and beats |
| `alliances.js` | the power alliance and voting blocs |
| `vote.js` | the open, ordered house vote, each ballot with its chain |
| `callout.js` | the opponent and the reason |
| `respect.js` | respect, the Arena record, free-ride heat, volunteering |
| `mind.js` | energy, confidence, paranoia, morale, targeted feelings, debts, the revenge list |
| `party.js` | nights out, fights, disqualifications |
| `romance.js` | showmances, couples in the vote, breakups |
| `exits.js` | quits and medicals |
| `final.js` | the two-day final |
| `season.js` | plays a season headless |
| `ledger-record.js` | the season's franchise record, in `franchise-meta.js deriveSeasonRecord`'s shape |
| `export.js` | the export, after a season has been played (§5 of the manual) |

**Dialogue**: `js/ch/script/`, `js/ch/story/` (§5 above).

**Site layer:**
- `js/ch-run.js`: the run tab. Reads history through `carriedFor`, builds the ledger record while the inner
  `gs` is live, writes it through `recordBuiltSeason`, copies `bonds`, `popularity` and
  `relationshipDimensions` back to the outer `gs` (§8.3, as `ci-run.js` does).
- `js/ch-cast-ui.js`: setup, with the division picker and vet or rookie badges.
- `js/vp-ch-ep/`: the stepped viewer (§8 below).
- the registry entry, the identity maps (§9 of the manual), `CONFIG_SCOPE`, ratings signals (§2.5, only after a
  season is played).

**Shared, unchanged**: `pStats`, `pronouns`, `romanticCompat`, bonds on the inner `gs`, `js/knowledge.js`.

## 7. The art

**The setting** is an invented tropical island, **Blue Lagoon** (the user's name): the villa on a cliff over the sea, the Arena
in a jungle clearing or an old quarry, the daily challenge sites around the coast, the final across the
interior and a mountain.

**The maps** (an island map and a villa map, Total Drama's camp-map grammar, the villa level adapted from Big
Brother's house map `js/vp-bb-ep/housemap.js`):
1. I draw an SVG layout of each, with every zone in its place.
2. The user gives the AI that layout plus Total Drama frames as a style guide; it paints the map in the art style.
3. Zone marks go on top, as on Total Drama's maps.

**The plates**, day and night, in three steps:
1. **Hunt**: the user's links (miguellima1999's and gaby-sunflower's DeviantArt Total Drama backgrounds, the
   Total Drama Do-Over wiki's backgrounds page; fetch fandom with curl and a browser user agent) and the
   official Total Drama frames already used.
2. **AI fill and edit** (the user's decision: found plates are AI-edited by them, and anything with no source
   is AI-made): a prompt folder per place from me, with style references.
3. **Match**: everything through Total Drama's pipeline (`tools/td-camp/traced/places.json` → `clean.py`:
   ESRGAN, people cut, motion map → `glplate.js`), so found and made plates read as one show.

| Area | Places |
|---|---|
| The villa | exterior, common room (deliberation), kitchen, pool deck and hot tub, bedrooms, gym, confessional |
| Out of the villa | party night (a beach bar or club), daily challenge sites (a water course, a cliff, a beach field) |
| The Arena | the signature set |
| The final | the trail, the mountain, the overnight camp |

Every plate gets marks (seats, standing spots, TJ's place) and a water mask (the pool and the sea; `wet.js`,
`keepDry`).

**The visual identity: MTV-2000s extreme sports**, everywhere, original (nothing copied from the real show's
branding). The user: "a true visual identity in everything, from the fonts to the ambience to the bg to the map
to the music".

| Element | Direction |
|---|---|
| Fonts | heavy condensed display (Anton or Bebas Neue style), a spray-paint or marker hand for TJ's tags and nicknames, a stencil for the Arena; Google Fonts only |
| Palette | black and charcoal, fire orange and red (the Fuego tank), sweat and mud textures, caution yellow |
| Slams | physical, never only text: CALLED OUT sprayed as a stencil on a wall (a spray hiss); ELIMINATED stamped and torn like a poster; DISQUALIFIED across the screen in caution tape; QUIT as a red card; CHAMPIONS in flaming chrome |
| Interface | duct-tape labels, distressed edges, 2000s glitch transitions and chrome, still readable |
| Ambience | waves and wind at the villa, insects and fire at the Arena, bass through the walls on party night, silence before the vote |
| Music | an MTV-2000s rock bed and Arena stings: the user's recordings, found with help from a search of the show's soundtrack and sound |
| Effects | shared effects reused from the other shows (crowd, whooshes, impacts, water); the signature sounds (the Arena horn, the slams, TJ's stings) are the show's own |

## 8. The viewer (`js/vp-ch-ep/`, §18.4 step by step)

1. **Research, then mockups**, after the art exists: the real broadcast's Arena introduction, deliberation, vote
   and final in one table (like `VENUES`); static HTML mockups of the villa map, deliberation, the vote, the Arena
   and the final, approved by the user before any stage code.
2. **Plates and marks** (§7).
3. **Events are scenes with words** before the stage draws them; an unscripted event airs as a cutaway with the
   engine's own sentence, never invented words.
4. **`steps.js` is pure**: house days, the daily, deliberation, the vote, the call-out, the Arena, the return to
   the house, party night, exits, the final. One placement per scene, never per click.
5. **The stage** paints step N; HD plates for close shots; the motion shader (the pool shimmers, the palms move);
   every action animated; the slams of §7.
6. **The Arena stage**: the two players on the game's apparatus in SVG (the pole, the hall, the puzzle board), the
   round tally, TJ at the centre, the house at the rail reacting (friends cheering, enemies taunting).
7. **The vote**: read in order; the tally counts only the votes already read; the swing vote holds the frame;
   wide, one push-in.
8. **The villa as a map**, the default house view: nested zones, faces per part of the day, speech bubbles, the
   clock gated on starred conversations, Next in story order.
9. **The side panel**: in their heads (the meters, the revenge list, the debts), the vote's chains, alliances and
   the power ranking, respect and Arena records, history from other shows. Each fact from the step where it is
   public, recorded when it happened, never read live.
10. **Sound**: per §7; music only where the moment earns it.
11. **The transcript equals the screen.**

## 9. Tests and the audit

- **`npm run audit:ch-spec`**: a hundred seasons, every rate beside its chance line. The call-out reason spread;
  the beast's win rate; quits, disqualifications and medicals per season; division balance at the final; the
  power alliance's lifespan; swing-vote flips; how fast original-show cliques dissolve; homesick quits. An
  outcome rate is a read-out, not a target (§17.5): fix a broken mechanism, never tune toward a number.
- **The transcript tool**, then reading three whole seasons before any screen (§16.1).
- **Engine rules**: nobody votes for themselves; the call-out stays inside the division and excludes the immune;
  nice archetypes never scheme or throw; every outcome on screen is the one the engine decided.
- **Dialogue**: the §19.4 bug-class table against every new pool; repetition measured per kind.
- **Viewer**: the §18.4 tests (steps, staging, ground, the map, nothing before its step), then Playwright
  screenshots.
- **The ledger**: the season writes its record, and the next show reads it back.

## 10. Sub-projects, in order

This is too large for one plan. Each sub-project gets its own plan, and each ends with something that runs.

1. **Engine, headless, and its spec audit** (§3, §4, §6 engine modules, `season.js`, `audit:ch-spec`). The first
   plan.
2. **Dialogue** (§5): the script and story port, the pools, the transcript tool, three seasons read.
3. **Run tab and setup** (`ch-run.js`, `ch-cast-ui.js`, the registry entry, the identity maps, the ledger read
   and write).
4. **Art** (§7): the island and villa layouts, the plate hunt, the AI prompt folders, the pipeline, the music
   search.
5. **Viewer** (§8): mockups first, then the build.
6. **Export, screens and ratings**, only after a season has been played (§10 of the manual).
