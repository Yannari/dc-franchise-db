# Total Drama camp life as storylines — design

Status: approved direction (2026-10-07); real shows measured (§1b); building.

## 1. The problem, measured

A played 14-episode Wawanakwa season (seed 99, 16 campers, 622 camp events):

- **2.6 spoken lines and 16 words per event on average.** 159 events (26%) have no spoken line at all;
  only 5% run past six lines. A real Total Drama or Disventure Camp camp scene runs 20–40 lines.
- **Disconnected sketches.** Biggest families: crowd chatter 98, friendship 88, drama 71, camp life 52.
  Typical: "Who ate the berries? / Izzy has purple fingers." Nothing carries to the next episode.
- **Strategy is about 10%** (plan, deal, pitch, recruit together).
- **Context unused.** The picker can filter lines by archetype, all nine stats, age band, bond, alliance,
  showmance and kinship (js/td/script/facts.js), but most pools are generic, and no line can name
  what actually happened: who voted for whom, who threw the challenge, last week's betrayal.

The user (2026-10-07): "a full-on experience with drama, suspense, strategy… actual storylines, reality TV
storylines, not random events not connected… thoughtful, sometimes impactful… all different based on
stats, archetype, age, personality, team… personalised so I know it's deep enough to know what it's really
talking about."

## 1b. The real shows, measured (2026-10-07)

The user asked to "check with real episodes and measure what's really necessary — I don't want to feel like
some character gets totally forgotten". Source: 44 Disventure Camp transcripts (disventurecamp.fandom.com,
all of DC4 and DC5) and 38 Total Drama transcripts (TDI complete plus 11 TDA episodes, from
totaldramaislandtranscript.wordpress.com). A camp scene is a stretch between scene breaks with no host speaking
(so challenges and ceremonies don't count). The sim figures come from 3 played seeded seasons
(`tests/zz-td-story-measure.test.js`, scratch).

| | Total Drama | Disventure Camp | Sim today |
|---|---|---|---|
| Camp scenes per episode (both camps) | 9.5 | 7.5 | ~60 (31 per camp) |
| Spoken lines per camp scene: median | 4 | 8 | 3 |
| p75 / p90 | 8 / 13 | 13 / 18 | 4 / 4 |
| Scenes with 10+ lines | 18% | 44% | 1% |
| Scenes with 3+ speakers | 41% | 51% | 19% |
| Scenes with no spoken line | n/a | n/a | 27% |
| Confessionals per episode | 8.5 | 10 | (per event) |
| Living campers with no camp scene in an episode | 61% (TDI) | 45–50% | 0% |
| Living campers who say nothing all episode | 42% (TDI) | 20–22% | 0% |
| Longest run of episodes with no camp scene | 15–21 (Ezekiel, Tyler) | 9–12 (Alessio, Ernesto) | 0 |

**What it means.** The sim's total volume is close to the real shows'. What's wrong is the shape: it has about
six times as many scenes, each a third as long, and it gives everybody a little every week. The real shows
spend their time on a few long, connected scenes. They also forget people, and forgetting people is the one
thing the user does not want copied. Targets:

- **10–16 camp scenes per episode** across both camps, with lengths spread as in §2.2.
- **Nobody forgotten.** Every living camper gets at least one spoken line every episode (in a group scene, a
  reaction or a confessional). Nobody goes more than one episode without a real scene of their own, so
  quiet players get a storyline step, such as *On the bottom* or *Underdog*, instead of being dropped.
- **Group scenes.** About half of scenes have 3 or more people.

**The elimination segment, measured.** In a DC elimination, 3 of 7 voters are shown in the booth, and each
gives a reason in their own voice ("I hate to do this to a teammate, but I need to keep the heat off
myself."). Then comes the reading, a confrontation when it's a blindside ("You know what you did." / "What the
hell are you talking about?!"), last words, and 2 confessionals afterwards from the people who did it. Each
DC elimination has 16–33 camper lines; a TDI marshmallow ceremony plus the Dock of Shame has 10–15. Today the
sim's booth uses five stock lines ("Nothing personal.", "It's just the game."), and it has no reactions, no
last words and nothing after the boot (`js/vp-td-ep/steps.js` `tdTribalScreen`), even though every ballot
already carries the engine's reason (`v.reason`).

## 2. What we build

### 2.1 Storylines (ported from Big Brother, js/bb/story)

The engine already decides everything (alliances, bonds, showmances, votes, idols). A **storyline** is a
season-long thread that the scenes it produces belong to. Each has a type, its people, and steps:

| Type | Steps (each one a scene, in order, only when the game made it true) |
|---|---|
| Alliance | pitch → formed → first test → doubt → crack → betrayal or reaffirmed |
| Rivalry | friction → argument → escalation (challenge or chore) → blow-up → truce or cold war |
| Showmance | spark → flirt → first move → official → jealousy / strategic doubt → break-up or ride-or-die |
| On the bottom | noticed → paranoia → scramble (pitch, idol hunt) → saved or blindsided |
| Friendship | unlikely pair → bonding moment → loyalty tested → payoff |
| Underdog | written off → small win → rising → targeted for it |
| Villain arc | first scheme → caught or not → exposed → fallout |

Each episode a **director** chooses 3–5 active storylines to air (most dramatic first, tied to what the
engine just did) and gives each one a scene. Unconnected one-off moments stay, but they become the
texture between story scenes, not the whole show.

### 2.2 Scenes, not snippets

Lengths follow §1b (the real shows), not a flat 12–30: about a third short (2–4 lines), a third
medium (5–9), a third long (10–19), and a few big ones (20+) per season for the turning points. A
long story scene has these beats:

1. **Activity**: what they are doing (chores, fishing, getting ready, the challenge aftermath).
2. **Setup**: the reason this conversation happens now, from the game (the vote, the challenge, last episode).
3. **Pressure**: what one of them wants; the other's pushback.
4. **Turn**: a reveal, a lie, a confession, a joke that lands wrong, someone walking in.
5. **Button**: a last line, then a confessional from someone in it (sometimes one who saw it).

### 2.3 Every line knows who is talking and what happened

Two inputs to every line:

- **Who**: register (schemer, fiery, shy, sweet, competitor, cool, plain), archetype, the stats as
  behaviour (bold says it to their face, high intuition notices the lie, low temperament snaps, high
  loyalty refuses), age band (a 30-year-old talks differently from a 16-year-old), team, bond with the
  other person, and their track record (voted with the majority twice, won two challenges, was nearly out).
- **What**: the game's own facts, named: `{lastBoot}`, `{votedFor}`, `{chalLoser}`, `{chalHero}`,
  `{idolHolder}` (only to whoever knows), `{betrayer}`, `{showmancePartner}`, `{daysInGame}`, a team's win and
  loss streak. A line may only say what its speaker could know (no reading other people's secrets).

A line pool for one story beat holds variants written per register, with stat and age gates on top, so
a schemer pitching a vote, a sweet underdog pitching the same vote and a hothead pitching it all sound
like themselves.

### 2.4 Voice

Written against real Total Drama and Disventure Camp transcripts (the DC wiki transcripts category is
fetchable): plain spoken English, people interrupting and trailing off, sarcasm that lands on the first
read, short honest confessionals. No narration about a conversation. No surreal one-liners.

### 2.5 Watching it

- **Name and team on every speaker**: the dialogue panel and the confessional show name and a team
  tag in the team's colour.
- **No separate "State of the Game" screen**: the camp overview already covers it (user, 2026-10-07).
  Instead, a **live side panel**: relationship and alliance figures that move the moment a
  conversation ends, so you can see what a scene changed, and a **"what they're thinking"** line
  per speaker for what the dialogue doesn't say outright (the engine's real reason: who they're
  targeting, whether they believed the pitch). Only what has aired so far.

## 3. A worked example (illustrative names: a schemer, a sweet goat, a perceptive loner)

**Episode 3, after the Gophers lose. Alliance: pitch.** Heather (schemer, strategic 9, social 6)
needs one vote; Lindsay (goat, sweet, loyalty 8) is close with Beth; Gwen (perceptive, intuition 8) watches.

> *The Gophers' cabin. Lindsay is braiding friendship bracelets on the porch.*
> **Heather:** Those are cute. Who's that one for?
> **Lindsay:** Beth! And this one's for… um, I didn't decide yet.
> **Heather:** You know what I noticed today? Beth dropped the puzzle piece. Twice.
> **Lindsay:** She said her hands were sweaty.
> **Heather:** Totally. And Cody fell in the lake. And Noah didn't even run. You don't think it's weird
> nobody's talking about who actually lost it for us?
> **Lindsay:** I didn't think anyone lost it. I thought we just… lost.
> **Heather:** That's so sweet. That's exactly why I want you in an alliance with me.
> **Lindsay:** An alliance! Like on TV?
> **Heather:** Exactly like on TV. You, me, and we vote together tonight. Noah.
> **Lindsay:** Not Beth, right?
> **Heather:** Lindsay. Would I ever?
> *Gwen walks past with a water bucket, slowing down just enough.*
> **Gwen (confessional):** Heather "doesn't do friends", but she's suddenly into bracelets. Yeah. Someone's about to get played.
> **Lindsay (confessional):** I'm in an alliance! I'm gonna make Heather a bracelet. A purple one, because she's so… purple.

**Episode 5. Alliance: first test.** Noah is gone. Heather wants Beth next. The line knows Lindsay
voted Noah on episode 3 and that Beth is her closest bond.

> **Heather:** So. Tonight.
> **Lindsay:** Is it Cody? I think it should be Cody, he keeps calling me "Lindsey" with an E.
> **Heather:** It's Beth.
> **Lindsay:** …You said "would I ever".
> **Heather:** And I meant it, at the time. Things change. She's been talking to Gwen.
> **Lindsay:** Beth talks to everybody, that's her whole thing!
> **Heather:** Lindsay. Me or her. Pick.
> **Lindsay (confessional):** Okay, I'm not smart like Heather. But I know what "would I ever" means. It means never.

**Episode 5, later. The turn.** Lindsay's loyalty (8) beats Heather's pull: she tells Beth. (Decided by
the engine's vote, not by the text; the scene renders what the engine made happen.)

> **Beth:** She said ME?
> **Lindsay:** I'm so sorry. I kept telling her you're my best friend on the whole island.
> **Beth:** You're mine too. *(beat)* Okay. Okay. So what do we do?
> **Lindsay:** I don't know. I've never been in an alliance before. I've never been in an un-alliance either.
> **Gwen (from the doorway):** I'll take that as my cue. Hi. You two want to keep Heather from running this team? Because so do I.

Three episodes, one storyline, with each line traceable to a stat, an archetype, a bond or a vote.

## 4. Build order

The user chose dialogue first (2026-10-07).

1. **Storylines + director for TD**: port js/bb/story/storylines.js and director.js to TD's camp events
   (js/camp-events.js already emits alliance, romance, rivalry, threat, idol events), measured by
   "share of camp scenes that belong to a storyline" and "storylines with 3+ steps per season".
2. **Story-scene pools**: alliance, rivalry, showmance and bottom first (the highest-stakes), written
   per register with game-fact slots, against transcripts; lengths as in §2.2.
3. **The elimination segment** (§7.1).
4. **Name + team tags**, then the **live panel** (§2.5).
5. **Measure and read**: lines per scene, repeats (<1% per season), and printed full seasons read
   end to end before calling it done.

## 5. Answered (2026-10-07)

- Scene count: measure the real shows (done, §1b). Fewer, longer scenes, and nobody forgotten.
- State of the Game: dropped; a live panel instead (§2.5).
- Order: dialogue first.

## 7. The user's issue list (2026-10-07; outside this spec's first build unless noted)

1. **The elimination segment is bland** (built here, step 3). The voting booth says nothing worth hearing,
   there are no last words, and nobody reacts after an elimination. "It's just bland, and it's like that in
   so many places. That's why it feels amateurish and not 1:1 realistic with the source material." Target:
   §1b, what a DC or TDI elimination contains.
2. **Bland in many other places**: the same complaint covers every screen that is not camp life. Audit
   each one against the transcripts the way §1b does, one screen at a time.
3. **Live relationship and alliance panel and "what they're thinking"** (§2.5).

## 6. Handoff notes (for whoever builds this)

The backgrounds/viewer work continues in parallel in `js/vp-td-ep/` (stage.js, glplate.js, style.js,
marks.js) and `tools/td-camp/`. Stay out of those except where §2.5 needs the dialogue panel
(`js/vp-td-ep/screens.js` `.tdx-dlg`, `stage.js` `dialogue()`), and pull before touching them.

### Where things live
- **Camp events (what happens)**: `js/camp-events.js` (`generateCampEventsForGroup`), social politics
  and schemes in `js/social-manipulation.js`, alliances `js/alliances.js`, romance `js/romance.js`.
  Every camp event must keep its gameplay consequence (CLAUDE.md "Camp Events Must Have Consequences").
- **How a scene is written**: `js/td/script/scene.js` (a decided scene: kind, who, data),
  `js/td/script/write.js` (`writeScene`: picks an entry and fills `{a}` `{b}` `{c}` and data slots),
  `js/td/script/facts.js` (`factsFor`: what a line's `when` may filter on; `registerOf`),
  `js/td/script/context.js`, line pools in `js/td/script/lines/*.js` (index.js maps scene kinds to pools).
- **The picker**: `js/script/pick.js` (shared with Big Brother and The Circle; its repetition rules are
  hard-won, read the comments; a speaker never says the same line twice in a season).
- **Big Brother's storyline system to port**: `js/bb/story/storylines.js` (classify a beat into a
  storyline step), `director.js` (choose what airs), `write.js`, `register.js`, `voice.js`; its spec is
  `docs/superpowers/specs/2026-10-05-bb-house-storylines-design.md`.
- **The viewer that shows camp scenes**: `js/vp-td-ep/steps.js` (`tdCampScreen`, staging),
  `js/vp-td-ep/map.js` (camp map, conversation bubbles), `js/vp-td-ep/screens.js`.

### Rules that bite (from CLAUDE.md and the user's feedback)
- Valid stats and archetypes only (CLAUDE.md lists them). Nice archetypes never scheme.
- The text never decides an outcome: a scene renders what the engine already did.
- A line only says what its speaker could know. Never write a name into a pool; use slots.
- Plain, fluent spoken English; jokes land on the first read; no narration about a conversation.
- Pronouns via `pronouns(name)`; never guess a gender in a line.

### How to measure (do this before calling anything done)
- A season harness: `tests/helpers/season-harness.js` (`runOneSeason`, `seededRun`). The measurement in
  §1 came from a 14-episode seeded season counting `ep.campEvents` lines per event, words, and scene
  families; repeat it after each step and print a whole season's camp transcript and read it.
- Targets: scene lengths and coverage as in §1b (10–16 camp scenes an episode, every living camper speaks every episode); share of camp scenes in a storyline > 60%; at least 4 storylines
  with 3+ steps per season; same-exchange repeats < 1% per season.
- Existing tests to keep green: `tests/td-vp-steps.test.js`, `td-camp-map`, `td-camera-staging`,
  `td-twist-screens`, `td-island-script`, `camp-access`, and the picker's own tests
  (`grep -l "script/pick" tests/*.test.js`).

### Sources for voice
- Disventure Camp transcripts: disventurecamp.fandom.com `Category:Disventure Camp 4: Carnival of Chaos
  transcripts` (and DC5), via api.php with header `User-Agent: curl/8.0`.
- Total Drama: totaldrama.fandom.com episode pages, same API trick.
