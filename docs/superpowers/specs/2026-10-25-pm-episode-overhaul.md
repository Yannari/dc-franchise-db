# Perfect Match: the episode overhaul (2026-10-25)

The user, after reading episode 8 of PM1: "the dialogue go nowhere, they have no substance,
they're not well written at all, they're merging multiple random things with no setup, no real
impact and no cause, no consequences, there's no storyline, it doesn't play like the real show
(check transcript), the music and sfx are not enough, it's visually quite boring, I don't want to
have to skip through the episode, I need to be entertained." And: "make sure the episode is still
big enough … we need substance."

## 1. What a real episode is (read, not remembered)

Two full episodes read end to end (Love Island USA S3E21 on Forever Dreaming; USA S2E9 on
subslikescript). Both have the same shape:

- **Cold open.** "Previously on…" (6-8 clips), then "Tonight…" (3-4 teasers cut before they land),
  then the narrator says where every couple stands.
- **A spine.** One event the episode is about: a date, a text, a bombshell, a challenge, a vote.
  Everything else is its ripples.
- **3-4 storylines, intercut.** S3E21: a happy couple's date → "be my girlfriend"; a boy torn
  between two girls; a boy ending it with his partner over a new girl; two bombshells arriving.
  ~25 scenes in all.
- **Every scene is caused by an earlier one, and causes the next.** Charlie pulls Alana *because*
  he felt played → he tells Cashay he's not sure → she walks off → the girls rally in the
  bedroom → the next morning she clears the air with Alana → then has it out with Charlie.
- **The villa reacts.** Girls' chats and boys' chats split off after anything big; somebody
  watches a pull from the daybeds; a friend gives tough love. News travels.
- **The narrator links.** He recaps the cause as a joke ("after feeling played by Cash, he forms a
  personal best four-word sentence"), and reads the morning's mess as a list.
- **Long talks.** 30-60 lines, rambling, honest, about one thing.
- **Texture is small and serves the stories.** A birthday toast, a mosquito bite inside a chat.
- **A cliffhanger, then "Next time".** The new boys hidden in the beds. "Who are they?"

## 2. What ours is (episode 8 of PM1, measured)

- 123 engine events, 96 aired, 25 of them one-line notes the viewer still clicks.
- The day is a weighted random draw (`events.js generateEpisodeEvents`, PHASE_BUDGETS 12/40/18/23):
  a chat, a kiss, an ick, two comedy bits, an argument "over nothing", a pull, three friendships…
  each cast fresh, none caused by the last.
- The storyline systems (triangle, rivalry, game, arcs) exist, but their beats are appended after
  the evening (phases `triangle`, `rivals`) and drown in the soup.
- Big moments go nowhere: "Ayesha tells Lucia that Rafael kissed Zara" → Lucia goes inside → no
  follow-up all episode. Characters contradict themselves within the hour.
- Conversations are assembled from context-free movements (catch-up, tangent, a questionnaire:
  "What's your go-to dance move?"), written for volume, so most lines are about nothing.
- The stage is a CSS gradient beach with two portrait cards; only the fire pit and the hut are
  painted sets.

## 3. The design

### 3.1 Storylines decide the day (engine: `js/pm/threads.js`)

A **thread** is a question the villa is living with, carried across episodes until it is answered:

| type | the question | its beats, in order |
|---|---|---|
| `graft` | Will T stay loyal to P, now C is after them? | C tells a friend they fancy T → C pulls T → P (and a friend) watch it → P and T talk ("what was that?") → T decides (a turn-down, a second pull, a step on the ladder, the recoupling) |
| `doubt` | Is A going off P? | A confides in a friend → P notices A is off → "where's your head at?" → A's answer (reassure, honest, keeping it open) |
| `secret` | Will P find out what X did? | the witness carries it ("do I tell her?") → the telling → the confrontation → the fallout |
| `progress` | Are A and B the real thing? | a moment of theirs → the villa teases them → the ask → the villa celebrates |
| systems | triangle, rivalry, game, arcs, feud, blow-up, breakdown | their own beats, now registered as threads so they intercut and get reactions |

`state.threads` keeps each one's stage. Every episode the showrunner keeps the threads still open
(they must move on), opens new ones from the state (a bombshell's crush, a cooling partner, a
secret with a witness), and picks the episode's **headline threads** (3-4, by heat, at least one
happy one). Each headline thread plays one to three beats this episode, at the parts of the day
those beats belong to. A thread that is resolved closes, and says how.

Beats are ordinary engine events (`pull`, `vent`, `gossip`, `told-confront`, `reassurance`,
`exclusive-ask`…) cast by the thread instead of by the dice, carrying `extra.thread`
`{ id, type, beat }` and `extra.cause` (the event they follow). Their effects are the kinds' own:
the thread decides who and why, the kind decides what it does. What happened (a pull turned down,
a kiss, a lie) decides the thread's next beat.

### 3.2 Consequences travel (the reactions)

After any aired beat that matters (a pull with someone coupled, a kiss, a row, a telling, a
confrontation, an ask, a steal, a dumping) the villa reacts within the same part of the day or the
next:

- **`group-chat`** (new kind): the one it happened to, with two or three friends of their side —
  the girls on the daybeds, the boys on the terrace. They tell it, the friends take a side.
  Consequences: bonds among them, and the listeners' opinion of whoever it was about; and they
  KNOW now (a secret told in a group chat has more witnesses, so it can travel on).
- **`watching`** (new kind): a partner and a friend see a pull happen from across the villa.
  Consequences: jealousy, stress; a confrontation becomes likely.
- **`bed-chat`** (new kind): lights out, a couple in bed going over the day's thread.
- **The beach hut** on every beat of a headline thread.

### 3.3 Texture is small

The random everyday draw shrinks to a few slots a day (breakfast, the gym, the kitchen), and
prefers people in the episode's threads, talking about them. No pull, kiss or row out of nowhere:
those belong to threads. One-line "notes" stop being clicks in the viewer: several play as one
montage step, or only in the deep-dive transcript.

### 3.4 The episode as the show cuts it

- **Order**: cold open → morning (last night's fallout) → day (thread beats intercut, a thread's
  beats in order) → the challenge → evening → lights out → the night's moment → the debrief.
  The systems' beats join the day and evening instead of trailing after them.
- **Cold open**: "Previously on Perfect Match" (clips of last episode's big beats, from what
  aired) and "Tonight…" (this episode's headline beats, cut before they land).
- **The narrator**: the couples as they stand at the top; a link before each headline beat that
  says its cause; the morning's mess list.
- **A cliffhanger**: the episode ends on the first beat of the next night's moment (the text, the
  bombshell's silhouette), then "Next time".

### 3.5 The writing

Every thread beat is written about its subject: names, what happened, what's at stake, from the
cause and the people's feelings. Long (20-40 lines for headline beats), plain spoken English,
rambling and honest (docs/pm-dialogue-style.md), each line answering the last. Group chats are
told from what the teller saw. No questionnaires, no tangents for their own sake.

### 3.6 The viewer

- Painted villa sets (Blender, the PM toon recipe of `tools/blender/pm-firepit.py`): daybeds by the
  pool, the kitchen, the lawn and swing seats, the roof terrace, the bedroom (lights on, lights
  out), the dressing room, the gym, the Hideaway, Casa Amor; day and night where they need it.
  Each scene is staged where its words put it.
- Staging: the people in the scene on the set, a camera that cuts between a two-shot and the
  speaker, reactions on the listeners, title cards for a thread's turning points, the phone for
  every text.
- Music under every headline beat by its mood (romance, tension, heartbreak, comedy, suspense),
  stings on the turns, sound effects for what happens on screen.

## 4. Order of work

1. Threads + reactions + smaller texture (engine), with a season-read dump.
2. The writing for every new beat and kind.
3. The episode's order, cold open, narrator links, cliffhanger.
4. Calibration: `npm run audit:pm-spec` (villains, labels, four-couple finals) back in range.
5. The viewer: sets, staging, cards.
6. Music and sound.
7. Season reads (§19.3 of ADDING-A-SHOW) until an episode reads like the show.

PM1 (the user's live season) keeps playing from its saved queue; all of this reaches new seasons
and re-run episodes.
