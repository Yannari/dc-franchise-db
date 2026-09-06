# Drag Race — design

Fourth show on the DC engine, after Total Drama, Big Brother and The Traitors.
Regular-season format only in this spec. All Stars is a second spec, written
after one regular season has been played end to end.

Inspiration: myrainboww's Drag Race Simulator (7 stats, one stat per challenge,
random roll, highest wins). This design keeps its bones — a week is a maxi
challenge, a runway, a verdict and a lip sync — and replaces every decision
with a system that can be wrong in the ways the real show is wrong.

Read `docs/ADDING-A-SHOW.md` before touching anything here. Every rule in it
applies; the parts specific to this show are named in §11.

---

## 0. The two decisions the manual asks for first

**Does it eliminate by vote, or by result?** By result, and by a *person*. A
panel ranks the week, the bottom two lip sync, the host alone decides who
leaves. There are no ballots in a regular season. The engine's core asset —
bonds, perceived bonds, a group vote — never touches the elimination. It
shapes everything around it instead (§7).

**Is a round a week or an episode?** An episode. Vocabulary: queen / queens,
Episode, maxi challenge, "sashayed away".

Consequence: a **third per-round export shape** (§9). Neither `votingHistory[]`
nor `weeks[]` can hold a placement grid. Amazing Race inherits it.

---

## 1. Decisions taken in brainstorming (2026-09-06)

| Question | Decision |
|---|---|
| Engine or standalone | Fourth show on the engine, full site integration |
| Cast | All-new queens for regular seasons; All Stars recasts them later |
| Star power | Hidden, derived from authored facts + a per-season roll, never shown |
| Week decision | Panel with taste, host with an agenda, explicit storyline tracker ("C") |
| Social layer | Full house ("B") first, then result hooks ("C") |
| Craft stats | acting (improv folded in), comedy, dance, design, runway, lipsync, singing |
| Judges | RuPaul + Michelle Visage permanent; Carson, Ross, Law, TS Madison, Jamal Sims rotating, chosen per episode; a guest per episode drawn from the franchise roster |
| Roles | Shift probability, never a hard ceiling |
| Runway | Depends on the challenge: design week = the designed look; Ball = three walks; makeover = the pair; else one themed runway |
| Lip sync | lipsync always heaviest, dance always present at lower weight, mood stat by song; real song titles/artists allowed as names |
| Exit call | Performance first, then a bounded host bend from track record, storyline, star power; a gag is always possible |
| Double shantay / sashay | Season checkboxes; earned by the lip sync, never rolled |
| Text | Written by Opus writing subagents; engine code separately |

---

## 2. Registry entry — `js/shows.js`

```js
'drag-race': {
  prefix: 'dr', name: 'Drag Race', short: 'DR', emoji: '👑', accent: '#ff2d95',
  words: {
    player: 'queen', players: 'queens', round: 'Episode',
    exit: 'sashayed away', challenge: 'maxi challenge',
    win: 'won the maxi challenge', audienceAward: 'Miss Congeniality',
    nominationLabel: null,             // no nominations, ever
    host: 'RuPaul',
  },
  exitVerbs: { lipsync: 'sashayed away', dq: 'disqualified',
               quit: 'withdrew', medical: 'left for medical reasons' },
  careerStats: [
    ['challengeWins', 'dr.wins'], ['highs', 'dr.highs'], ['lows', 'dr.lows'],
    ['bottoms', 'dr.bottoms'], ['lipsyncWins', 'dr.lipsyncWins'],
    ['congeniality', 'dr.congeniality'],
  ],
  audience: { strategy: 0.4, mess: 1.4, twist: 0.9, steamroll: 1.2 },
  polls: ['Who wins the next maxi challenge?', 'Who lip syncs next week?',
          'Who was robbed this week?', 'Who takes the crown?'],
}
```

`polls` and every label come from the entry; nothing in `js/social/adapter.js`
branches. A bare integer stays Total Drama; a season is `dr-1`.

---

## 3. The queen

A queen is a roster character. Every page, the wiki, the social feed, the life
layer and the Traitors alumni ledger (§14.14 of the manual) work on her because
of that. `name` is her drag name.

**Layer 1 — the person.** The existing 9 stats and archetype, unchanged in
meaning. They are not used for judging. They drive the werk room: bonds,
alliances, camp events, social manipulation, romance, knowledge, aftermath.
`physical` and `endurance` are authored but unread, as `physical` is on a
Big Brother week with no comp.

**Layer 2 — the craft.** A show-scoped block on the roster record:

```js
drag: {
  acting: 1..10,   // scenes, commercials, Snatch Game, improv, hosting
  comedy: 1..10,   // roast, stand-up, Snatch Game, puppets, reading
  dance:  1..10,   // choreography, girl group, music video, lip sync
  design: 1..10,   // design challenge, the Ball's sewn look, makeover construction
  runway: 1..10,   // every runway walk, photoshoot, Ball presentation
  lipsync:1..10,   // lip sync for your life
  singing:1..10,   // Rusical, girl group, Rumix, singing challenge, live-vocal talent
  style: 'pageant'|'comedy'|'fashion'|'camp'|'club-kid'|'spooky'|'broadway'|'dancer'|'glamour'|'art',
  traits: ['padded','bearded','big-wigs','high-concept','seamstress','choreographer', ...], // 1–3
  voice: '...',    // persona voice for the writer and the entrance line
}
```

`style` drives narration, runway look descriptions, what the panel expects of
her, and which challenges she is "supposed" to nail (a fashion queen bombing
the design challenge is a beat; a comedy queen bombing it is Tuesday).

**Star power — hidden.** Computed once at season start into `gs.dr.star[name]`,
never displayed, never authored:

```
entertainment = mean(comedy, acting, lipsync)                 weight 0.35
personality   = f(social, boldness, archetype)                weight 0.30
                 villain/wildcard/chaos-agent/showmancer high, floater/goat low
age           = bump for < 24 and > 38, none in between       weight 0.15
body / look   = from demographics + traits (padded, big, tiny) weight 0.10
season roll   = noise(1.5)                                     weight 0.10
```

It biases the host's bend (§6) and the storyline tracker (§7). It never enters
the performance step. Stats are always proportional: `star * factor`, never
`if (star >= X)` for gameplay.

**Casting Studio.** A "Drag" panel on the character page for the block above.
One portrait per queen, show-scoped, through the existing portrait catalog.
Runway looks are generated text from style + traits + category. A look book
(a picture per runway) is out of scope.

---

## 4. Judges

`data/drag/judges.json` — seven authored judges, each with a portrait under
`assets/avatars/` (`rupaul.png` out of drag for the werk room,
`rupaul-drag.png` for the main stage; `michellevisage.png`, `carson.png`,
`ross.png`, `law.png`, `ts.png`, `jamal.png`), a voice, and a taste profile:

```js
{ id:'michelle', name:'Michelle Visage', permanent:true,
  taste: { challenge:0.45, runway:0.40, risk:0.05, polish:0.10 },
  styleBias: { pageant:+0.5, fashion:+0.3, 'club-kid':-0.2 },
  petPeeve: 'a hidden waist', softSpot: 'a live vocal' }
```

**Setup screen:** a tab per judge, sliders for the taste weights and style
biases, saved per season. Defaults are the authored profile.

**Per episode:** RuPaul and Michelle always; one rotating judge chosen in the
timeline; one guest chosen in the timeline from the franchise roster (any
alumni of any show). The guest's taste is **derived** from their stats:
`mental` → weight on polish and technique, `social` → warmth (fewer negative
lines), `boldness` → weight on risk, `strategic` → reads the game (comments on
track record), archetype villain → shady critique voice, hero → generous.

Judges remember. Each keeps a per-queen memory of prior verdicts, blow-ups at
the panel, and moments; it feeds §6.

---

## 5. The season and the episode

**Setup.** 12–14 queens (16 with a split premiere twist). One exit per episode
by default. Finale at top 4, 3 or 2 per the finale type.

**Season timeline** (the existing twist scheduler, `format: 'drag-race'`):
per episode a maxi challenge from the full catalogue (§8), a mini challenge
checkbox (default on) with a pick, the rotating judge, the guest, the lip sync
song, and twists. Randomiser: category-aware pacing (two design weeks never
touch), the six tentpoles (Snatch Game, Ball, Girl Group, Makeover, Roast,
Rusical) guaranteed once each unless removed.

**Season checkboxes:** double shantay allowed, double sashay allowed, immunity
for early wins (seasons 1–5 style), triple lip sync on a bottom tie.

**Premiere types:** talent show · design challenge · runway-only · girl groups
· split premiere (two halves, two winners, merged at episode 3) · porkchop
premiere (a first-episode lip sync elimination). The premiere opens with
**arrivals**: an entrance line per queen generated from archetype, the 9 stats
and the drag block, and the room's reaction to it.

**Finale types:** top-4 tournament (two semis, one final) · top-3 tournament ·
top-2 one-on-one for the crown · performance-then-lip-sync (a final performance
ranks the finalists, the host picks two, they lip sync for the win). Winner and
runner-up, no jury. Miss Congeniality by `runAudienceVote`.

**The episode, in order.** Each numbered step is a VP screen and a text-backlog
block. Steps 7 and 11 are the same step; a challenge type declares which one
it plays in (`stage: 'pre'` or `'main'`).

1. **Cold open** — the werk room right after the exit: mirror message read,
   immediate reactions.
2. **Werk room, morning** — next day: last week discussed, a confrontation
   carried over from Untucked sometimes.
3. **Mini challenge** (optional) — the host arrives, announces, it runs. The
   result feeds the maxi: pick order, captaincy, first pick of characters.
4. **Maxi announcement** — the host arrives here if there was no mini.
5. **Challenge choice** — roles, pick order, Snatch Game characters, teams.
6. **Werk room + preparation / rehearsal** — social beats around the work,
   the host's walkthrough.
7. **Maxi challenge** — if `stage: 'pre'` (acting, Snatch Game, girl-group
   filming, commercial, makeover build, design build …).
8. **Werk room, elimination day** — runway prep, talk about the challenge,
   socialising, shade, drama.
9. **Main stage** — the host in drag, the panel and the guest introduced.
10. **Runway** — the category speech, one walk per queen (three for a Ball,
    the pair for a makeover, the designed look for a design week).
11. **Maxi challenge** — if `stage: 'main'` (Rusical, roast, stand-up, talent
    show, LaLaPaRUza, singing).
12. **Critiques** — safes called and dismissed, tops and bottoms critiqued.
13. **Untucked**.
14. **Results** — win, highs, lows, bottom two.
15. **Lip sync** — song, performance, the call, the exit line.
16. **Eliminated segment** — last words, the mirror message written.

Plus the **track record chart**, reachable from any episode (§10).

---

## 6. The decision engine

Three steps. Stats are what she does; the panel is how it is seen; the host
decides. Each step is recorded on the episode so the screen can show all three.

### 6.1 Performance (ground truth)

Per queen per challenge, from `js/dr/maxi.js`:

```
perf = blend(craft stats, type weights)       // 2–3 stats, weights sum to 1
     * roleRange(role)                        // widens/narrows variance; no cap
     + prep                                   // §8.3
     + chemistry(team)                        // mean perceived bond of the team, scaled
     + noise(2.5 + boldness * 0.2)            // boldness widens variance
     + nerves(trackRecord, temperament)       // recent bottoms → down, or up if temperament high
     + moment                                 // rare spike (≈ 1 in 12 perfs), recorded
```

Runway is scored separately: `runway * 0.6 + fit(category) * 0.25 + fit(style)
* 0.15`, plus `design` replacing `runway` weight when she sewed it.

### 6.2 Panel perception

Each judge `j` present that night:

```
view_j = taste_j.challenge * perf + taste_j.runway * runway
       + taste_j.risk * risk + taste_j.polish * polish
       + styleBias_j[style] + memory_j[queen]      // prior bottoms read as bottom again
       + noise(1.0)
```

Output per judge: a ranking and one critique line in the judge's voice,
positive or negative. Panel ranking = mean rank; **disagreement** =
spread of the four rankings, recorded. A "split panel" week is one where the
top or bottom two differ across judges.

### 6.3 Host bend

The host reorders the panel ranking within bounds:

```
bend[queen] = star * 0.4 + storylineNeed(queen) * 0.4 + trackRecordPull * 0.2
```

`trackRecordPull`: positive for "safe N weeks running, needs a moment",
negative for "third bottom, the panel has to send her home". Bounds: a queen
whose panel rank is in the bottom two cannot win; a queen the panel placed
first cannot be in the bottom two; bend can move a queen at most two places on
a non-split week, three on a split week. The screen shows panel rank beside
final rank. Twice bent downward across a season = the **robbed queen**
storyline (§7).

### 6.4 Calling the week

Cast ≥ 12: 3 up / 3 down. 9–11: 2 up / 3 down. ≤ 8: 2 / 2. Ties at the top
with two clear firsts: double win. Immunity (checkbox) removes a queen from
the bottom and pulls the next one in. Triple lip sync (checkbox) on a bottom
tie.

### 6.5 Reactions

Each critiqued queen: `expected` (her own read of her performance, from
`intuition` and star power) minus `received` (final rank), through
`temperament` and archetype → one of: crash out, blow up (talks back; judges
remember), tears, joy, sadness, relief, I-don't-care. A reaction is a scene
with consequences: bonds with anyone named, popularity, storyline beat.

### 6.6 Critique twists (schedulable)

"Who should go home and why" — each queen names someone; the choice reads
perceived bonds (protects a sister, names a rival, names herself if `loyalty`
high and she is in the bottom). Rate-a-queen — every queen ranks every queen;
aggregated and read aloud; feeds Untucked heavily. Both are recorded as
beliefs, never as facts.

### 6.7 Lip sync

`data/drag/songs.json` — songs with `title`, `artist`, `tempo`
(ballad|mid|dance|uptempo), `mood` (sad|fierce|funny|sexy|rage), `hook`
(breakdown|key-change|spoken|dance-break|none). Chosen per episode or rolled.

```
ls = lipsync * 0.45
   + dance * (0.15 + 0.15 * isUptempo)
   + moodStat * 0.20            // acting on sad, comedy on funny, boldness on fierce/rage/sexy
   + stunt(boldness) * 0.10     // the split, the reveal — can also fail
   + confidence(lipsyncRecord)  // prior wins up, fresh crash-out down
   + noise(2.5)
```

Narrated in beats (verse, chorus, the hook, the ending), with the crowd, the
judges' faces and the other queen's reaction.

**The call.** `gap = ls_a - ls_b`. Then the host bend from §6.3 applies at
half weight (a top queen usually survives a bottom queen; a gag stays
possible). Clear result → shantay / sashay. Both above a high bar, gap small,
box on → double shantay. Both below a low bar, box on → double sashay. Rare by
construction: measured target ≤ 1 per 3 seasons each.

**Exits.** `lipsync` (the default), `dq`, `quit` (a very-low-`temperament`
queen after a blow-up week), `medical` (rare, twist-scheduled). Each on
`exits[]` with its registry verb.

---

## 7. The storyline tracker

`js/dr/storylines.js`. Assigned at season start from stats, star power and
bonds; recorded per episode in `ep.dr.storylines[]`; read by the host bend,
the assignment step, the VP, the aftermath, the edit layer and the writer.

| Storyline | Assigned from | Wants |
|---|---|---|
| frontrunner | highest craft mean × star | early wins, a mid-season stumble |
| underdog | low star, mid craft | a win around episode 6 |
| villain | villain/schemer archetype, low loyalty | conflict in every Untucked, a late fall |
| the fighter | earned: 2 lip sync wins | the bend favours her on a toss-up bottom |
| the rivalry | lowest perceived bond pair with both high star | both in the same team challenge, both in one bottom |
| the sister pair | highest bond pair | a shared team win, one sending the other home |
| the robbed queen | earned: bent downward twice | the community grid shows it |

Each want is a bounded request to the assignment and bend steps (never more
than the §6.3 bounds). Storylines die or flip on events: the villain who
apologises, the frontrunner who bombs Snatch Game, and the tracker writes the
flip as a beat.

### 7.1 The full arc catalogue (user, 2026-09-06)

The seven arcs above are the ENGINE's families. The catalogue the user wants is
fifteen families, each with named variants — the vocabulary the community
actually uses about an edit. A family decides what the arc wants; the variant
is flavour chosen from her stats, her drag style and what happens to her.

| Family | Variants |
|---|---|
| Winner / Front-runner | Winner's Edit, Front-runner, Challenge Beast, Professional |
| Underdog / Growth | Underdog, Dark Horse, Personal Growth, Transformation |
| Robbed / Unfulfilled | Robbed Queen, Early Outsider, Finalist Without a Crown, Perennial Bridesmaid |
| Villain / Rivalry | Villain, Fierce Competitor, Rivalry Arc, Bitter Edit |
| Hero / Congeniality | Hero, Fan Favorite, Congeniality Edit |
| Narrator / Personality | Narrator, Comedy Queen, Emotional Queen |
| Fashion / Aesthetic | Fashion Queen, Look Queen, Club Kid, Alternative Queen |
| Performance | Lip-Sync Assassin, Lip-Sync Diva |
| Pageant / Traditional | Pageant Queen, Professional |
| Weakness | One-Trick Pony, Fashion Disaster, Safe Queen |
| Filler / Low-Visibility | Filler Queen, Safe Queen |
| Representation / Personal | Representation Story, Family Story, Emotional Queen |
| Relationship | Friendship Arc, Romance/Showmance, Rivalry |
| Redemption / Returnee | Redemption Queen, RuDemption Queen, Comeback Queen |
| Shock / Twist | Shock Elimination, Comeback Queen |

**THE HARD SPLIT, and the reason the catalogue is safe to grow this far.** An
arc is either an AGENDA or a LABEL, and only agendas touch `storylineNeed`:

* **Agenda arcs** ask the host's bend for something — Front-runner, Underdog,
  Villain, Fighter, Rivalry, Sisters, Redemption. Bounded as in §6.3.
* **Label arcs** ask for NOTHING and are pure description: Robbed, Fashion
  Queen, Pageant Queen, Narrator, Filler, Safe Queen, One-Trick Pony,
  Representation, Shock. They are derived from what she IS and what already
  happened, and they exist for the VP, the aftermath and the writer.

Fifteen families all lobbying the bend would be fifteen thumbs on the scale and
the season would stop being a contest. Most of this catalogue is label.

**Two variants are gated on machinery that does not exist yet.** Redemption /
Returnee and Comeback Queen need a returnee, which is the All Stars format —
they are defined here and stay unassignable until it exists, rather than being
faked on a first-run cast.

**Naming:** the community's term for the Robbed family's fourth variant is a
real queen's name. This universe has no real people (the same rule that makes
the Snatch Game characters archetypes and keeps World Tour from naming a
country), so it is written here as *Perennial Bridesmaid*.

---

## 8. The maxi challenge engine

### 8.1 Files

`js/dr/maxi.js` — the spine. `js/dr/chal/<type>.js` — one file per type,
exporting `meta`, `assign`, `prepare`, `perform`, `critiqueHooks`, VP screens
and text. Every type gets every mechanism below by going through the spine.

```js
export const meta = {
  id:'snatch-game', name:'Snatch Game', tentpole:true, stage:'pre',
  format:'solo', blend:{ comedy:0.5, acting:0.4, runway:0.1 },
  runway:'themed', assignment:'draft', roles:'characters',
  chalStyle:'comedy', minCast:6,
};
```

### 8.2 Format and assignment

Formats: `solo`, `pairs`, `teams`, `cast` (whole cast: Rusical, girl group),
`partnered` (makeover: pit crew, family members, or eliminated queens as an
option). Assignment: mini winner picks / captains, a draft in an order, host
assigns, random. Roles carry `range` (how far a role can swing, both ways) and
`spotlight` (how much a role is seen). Conflicts are scenes: same Snatch Game
character → first pick keeps it, second falls to a backup at a penalty and a
grudge; a captain who dumps a rival onto the other team pays in bonds.

Team results: winning team by mean, individuals within it; the losing team
supplies most of the bottom, a standout on the losing team can still land high.

### 8.3 Preparation

```
prep = blend(craft) * 0.4 + mental * 0.03 + strategic * 0.02 + time
     + help(bonded queens) - sabotage(villain "advice")
     + walkthrough(hostFeedback, intuition, boldness)
```

The walkthrough is per type (what the host asks about a roast is not what she
asks about a look), gives feedback that is right or wrong for the queen, and
`intuition` decides if she reads it right, `boldness` if she changes course.
Ignoring good feedback and taking bad feedback are both narrated and both cost.
The room's social state bites: nobody helps the queen nobody likes in a design
week.

### 8.4 Consequences

Every event writes bonds, popularity (`gs.popularity`, never ranked by), track
record (`gs.dr.record[name][]`), and a storyline beat. A team loss produces
blame in Untucked. Nothing is cosmetic.

### 8.5 The catalogue

From the fan wiki's eighteen types, each with named variants and failure modes
("forgot the words", "the glue gun", "stepped on her scene partner"):

Acting · Ball (three looks; two from the closet on `runway`, one sewn on
`design`) · Choreography · Commercial · Design (the designed look is the
runway) · Girl Group (verse + choreo + rehearsal; spotlight-hog) · Improv
(under `acting`) · Lip Sync challenge / LaLaPaRUza (a bracket) · Makeover (the
partner has stats; family resemblance scored) · Music Video · Photoshoot ·
Rumix · Runway challenge · Rusical (lead vs ensemble range, live vocal vs
recording) · Singing · Snatch Game (turn-based, host reactions, dying on
stage) · Stand-Up / Roast (order matters: first and last slots; jokes about
the panel) · Talent Show (each queen's talent picked from her stats: live
vocal if `singing` high, comedy set, dance number, burlesque, lip sync, a
stunt on `boldness`).

Mini challenges: reading, puppets, quick drag, photoshoot, and the rest of the
wiki's list; each declares what its win buys in the maxi.

---

## 9. Export — the third round shape

```js
episodes: [{
  num, challenge:{ id, name, format }, mini:{ id, winner } | null,
  judges:[ids], guest:{ name, playerSlug },
  placements:[{ name, playerSlug, result:'WIN'|'HIGH'|'SAFE'|'LOW'|'BTM'|'ELIM'|'OUT',
                panelRank, finalRank, storyline }],
  lipsync:{ song, artist, queens:[a,b], winner, call:'shantay'|'double-shantay'|'double-sashay' },
  exits:[{ name, playerSlug, channel:'lipsync'|'dq'|'quit'|'medical' }],
  eliminated: null,          // the VOTE field: this show has none. Readers use exits[].
}]
```

`roundLedger()` in `js/wiki-fill.js`, the season page's Wiki tab (six
branches), the voting grid and `js/social/live.js` learn the shape. A guard
asserts every reader of `weeks`/`votingHistory` handles `episodes`. Register
a builder with `registerSeasonExporter('drag-race', build)` that **refuses**
while incomplete. `placements[]`, `winner{}`, `twists[]`, `seasonId` per the
manual. Every appearance stamped `format: 'drag-race'`.

The ledger for The Traitors (§14.14) receives: placement, wins/highs/lows/
bottoms, lip sync record, exit channel, relationship history. No jury record,
no vote record — missing concept, not zero.

---

## 10. Screens

**VP** — `js/vp-dr/`, one screen per §5 step, click-to-reveal, its own visual
identity (main stage lights, werk room mirrors, the Untucked lounge), the
in-drag host portrait on stage and the out-of-drag one in the werk room.

**The track record chart** — the show's signature screen. Queens as rows,
episodes as columns, cells coloured WIN / HIGH / SAFE / LOW / BTM / ELIM with
the community's conventions (gold for a lip sync win, the finalist band, Miss
Congeniality). In the VP it fills episode by episode and never spoils ahead
(`_tvState` gated). The finished grid renders on the season page, in the
character article's infobox block, and in the aftermath. **One builder, three
readers.** Hover a cell: challenge name, panel rank vs final rank, storyline
beat.

**Setup** — the timeline (maxi picker, mini on/off + pick, rotating judge,
guest, song, twists), the judges panel (tab per judge), the cast screen with
the drag block on each card. **Run tab** — episode badges in the show's
colours.

**Aftermath and edit layer** — a drag adapter: screen time, storyline arcs,
moments, finale awards. **AI writer** — its own episode prompt in the show's
vocabulary, fed by the storyline tracker.

---

## 11. What the manual requires, applied

- Registry first (§2), `CONFIG_SCOPE` next: every control the engine reads and
  nothing else. No tribes, no idols, no nominations, no have-nots.
- Runnable flag `window._drRunnable` in `js/dr-run.js`; dispatched in both
  `simulateNext()` and the replay path.
- `gs.episodeHistory[]` written every episode with `format:'drag-race'`,
  `{ num, eliminated:null, exits }`, so `audienceStanding` works and
  `gs.popularity` is never ranked by.
- One popularity ledger is enough: the audience knows nothing the cast does
  not (no secret role). Star power is hidden from the *cast's* screens but is
  not a secret the audience holds against anyone.
- Stores the shared Total Drama code writes (`gs._pendingDepartures`,
  `gs._pendingExpulsions`, `gs.allianceDissolutions`) get a consumer in the
  werk room loop or are not written.
- Every screen with previous/next reads the episode's snapshot, never live
  state.
- Every sentence a character says is sourced from what she can see:
  relationship before plan, knowledge before both.
- Vocabulary guard runs both directions by existing; `EXCLUSIVE` gains the
  drag nouns (werk room, runway, lip sync, sashay, shantay, maxi, Untucked).
- `readSignals` in `js/ratings.js` wired only after a season is played and the
  signals printed.

---

## 12. Files

```
js/shows.js                 registry entry
js/dr/                      season.js week.js maxi.js judging.js lipsync.js
                            storylines.js star.js social.js export.js
js/dr/chal/*.js             one per maxi type
js/dr-run.js                runnable flag + dispatch
js/vp-dr/*.js               screens + the chart builder
data/drag/                  judges.json songs.json challenges.json minis.json
data/dr-events/             werk room, Untucked, critique-reaction pools
assets/avatars/             judge portraits (as named in §4)
tests/dr-*.test.js          §13
```

Branch `drag-race`, worktree `worktree-drag-race`, never merged mid-build.

---

## 13. Build order and measurements

Order (manual §10): registry + vocabulary → `CONFIG_SCOPE` + setup screens →
queen model + Studio panel → engine behind the flag, one type at a time
(acting, then the six tentpoles, then the rest) → judging + lip sync →
storylines → social pools (Opus writing subagents) → export → **play one
season end to end** → VP + the chart → ratings signals → the writer prompt.

Headless seasons in the existing audit harness from the first engine commit.
The spec is met when, over 100 seasons:

| Measurement | Target |
|---|---|
| Best craft-mean queen wins | 40–60% of seasons |
| Panel ranking ≠ final ranking (any place) | ~1 episode in 3 |
| Host bend beyond one place | ≤ 1 episode in 5 |
| Every storyline reaches its second beat | ≥ 70% of seasons |
| Double shantay / double sashay (boxes on) | ≤ 1 per 3 seasons each |
| A queen surviving 3+ lip syncs | happens, < 1 per 2 seasons |
| Ratings signals pinned at 0 or 1 | none |
| Screens rendering on replay | all 16 + the chart, every episode |
| Vocabulary leak either direction | 0 |
| Popularity vs placement, per style tag | no group beyond −0.6 |

Every guard is proved by putting the bug back and watching it fail.

---

## 14. Out of scope

All Stars formats (lipstick vote, Lip Sync Assassins, non-elimination stars,
brackets); the look book; international variants; guest judges with history
against a queen; Golden Beaver / chocolate bar twists (an All Stars-era
addition, second spec).
