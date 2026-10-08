# Total Drama camp life as storylines — design

Status: draft for review (2026-10-07). Nothing here is built yet.

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

A story scene is **12–30 lines** in beats:

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
- **"State of the Game" screen**, openable at any point in an episode:
  relationships web, alliances (members, how solid), active storylines with their last step,
  a "previously on" list of the key events so far. Only what has aired so far (no spoilers).

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

1. **Name + team tags** on speakers and confessionals (small, visible).
2. **State of the Game screen** (reads data the engine already has).
3. **Storylines + director for TD**: port js/bb/story/storylines.js and director.js to TD's camp events
   (js/camp-events.js already emits alliance, romance, rivalry, threat, idol events), measured by
   "share of camp scenes that belong to a storyline" and "storylines with 3+ steps per season".
4. **Story-scene pools**: alliance, rivalry, showmance and bottom first (the highest-stakes), written
   per register with game-fact slots, against transcripts; each scene 12–30 lines.
5. **Measure and read**: lines per scene, repeats (<1% per season), and printed full seasons read
   end to end before calling it done.

## 5. Open questions for the user

- Scene count: fewer, fuller scenes (about 6–10 per camp per episode) instead of many tiny ones. OK?
- Should the "State of the Game" screen be a tab beside the camp map, or a button on every screen?
