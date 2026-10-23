# Perfect Match: how islanders talk

The voice guide for every Perfect Match line, written from a study of official Love Island clips
(66 videos, 2026-10-22; subtitles studied, never copied — no transcript line goes into the game).
Spec: `docs/superpowers/specs/2026-10-22-pm-dialogue-rebuild-design.md`. The bug classes in
`docs/ADDING-A-SHOW.md` §19.4 all apply on top of this.

The test for any line: **could it have aired on Love Island, said by this person, right after the line
before it?** If it reads like a translation, a riddle or a slogan, it is wrong.

## 1. Length and rhythm

Measured on 920 speaker turns:

| turn length | Love Island | aim for |
|---|---|---|
| 1-3 words ("Mhm.", "Stop.", "You?") | 21% | 20% |
| 4-9 words | 36% | 35% |
| 10-29 words | 31% | 32% |
| 30+ words (the real answer) | 12% | 12% |

- **A conversation is 15-30 turns** when it is featured, 4-8 when it is short.
- **The long turns carry the scene.** When someone is asked something that matters, they answer it
  properly: 30-80 words, loose, with a restart or two.
- **Short reactions sit between long turns**, not instead of them. A reaction answers the line before
  it ("Stop." to a compliment, "No way." to news, "Mhm." while someone explains).
- **Never a string of fragments.** "Why?! This?! Go!" or "Pool. No couples." is the bug this rebuild
  exists to fix. A short line is still a sentence someone would say.

## 2. How they speak

- **Loose and spoken, not written.** Sentences run on with "and", "but", "like". People restart: "I
  just — I just think it's early." They trail off: "I don't know, it's just…"
- **Fillers, used the way people use them**, not stamped on every line: "to be fair", "honestly", "I'm
  not going to lie", "do you know what I mean?", "like", "literally", "at the end of the day". At most
  one in a turn, and not the same one twice in a scene.
- **Tag questions and checks:** "…doesn't it?", "…you know?", "Does that make sense?"
- **Plain words.** No essay register ("That's irritatingly effective", "a question-shaped request"). No
  word a person wouldn't say out loud at a pool.
- **Feelings said as feelings:** "I'm catching feelings", "it's scary", "I feel safe with you", "my
  head's all over the place", "it's a lot".
- **Jokes come from the moment** — the thing just said, the situation, a tease about something real
  ("What if I say no?" / "Then I'll pull someone else"). No puns that need explaining, no references to
  films, songs, brands or real people.

### Villa words

The show's own vocabulary, said naturally: a chat ("can I pull you for a chat?", "can I grab you?"),
grafting, my type on paper, the ick, your head being turned, closed off / keeping your options open,
on the outside, a girls' girl / a boys' boy, a game player, the fire pit, the Hideaway, the recoupling,
the dumping, a bombshell, Casa, a text ("I've got a text!").

Words that change with where someone is from go through dialect slots
(`js/pm/lines/dialect.js`): `{~mate}`, `{~yeah}`, `{~mugged-off}`, `{~fancy}`, `{~gutted}`, `{~buzzing}`,
`{~proper}`, `{~lads}`, `{~mum}`, `{~telly}`. Anything on `REGIONAL_WORDS` written bare fails the test,
so "cracking on" needs a slot of its own before it is used.

## 3. Every scene has a reason

- **Name the cause** in the first exchange, the way people say it: "How was your chat with Valentina?",
  "Can we talk about what happened at the fire pit?", "So. Last night." The director passes it in as a
  fact; a callback is only ever to something that aired before this scene.
- **Name the subject.** A row about "the comment" says what the comment was. A worry names who the
  worry is about.
- **Nobody knows what they didn't see.** A partner who wasn't there asks; they don't quote.
- **No invented backstory.** Jobs, hometowns, families and exes come from the character (occupation,
  hometown, family ties, the kin and ex records) or are not mentioned. No "my sister always says" for a
  character with no sister on file.

## 4. The shapes

### The chat (a pulls b)
1. **Open.** "Can I grab you for a chat?" / "You okay?" "Yeah, you?" — a beat of nerves or a tease.
2. **Purpose.** Why now, tied to the cause: "I just wanted to see where your head's at after last
   night."
3. **The answer.** The long turn. b says where they actually are, with a restart and an example.
4. **Probe.** a pushes on the part that matters: "You paused there." / "So there's room?" / "And how do
   you feel about her?"
5. **Tangent** (optional). A tease, a story, a joke about the villa; brings the length without moving
   the outcome.
6. **Turn.** What the engine decided: reassure, keep the door open, flirt back, shut it down, a kiss.
7. **Close.** "Right, I'll let you get back." / "I'm excited for bed tonight." / they head back, someone
   watching.

### The morning debrief (girls on the daybeds, boys on the terrace)
"Tell us everything" → the concrete detail ("he just put his arm round me") → teasing ("look at the
smile on you") → each person's own status, a line or two each → banter → someone gets up.

### Partners: the worry and the reassurance
The worry, with its cause → the long reassurance → a tease to lighten it → a promise or a "we're good"
→ a kiss or "come here".

### The deep chat
The real question ("What are you actually looking for in here?") → a long, honest answer about life
outside → their answer → what it means for the two of them → a close that holds it.

### Friendship (two to four)
A topic that is theirs (a shared interest from the profiles, the villa, a couple they're both
watching) → a story or a tease → back-and-forth → somebody's honest moment → close.

### The row (whole script)
The cause, quoted as said → denial or minimising → "you said what you said" → escalation → a friend
steps in ("just apologise") → a walk-off → both sides picked over by the group → each one's hut.

### A bombshell
Hyped introductions (age, job, how long single, type) → "what's your plan?" → the coupled ones going
quiet or territorial → first impressions in the hut.

## 5. The beach hut

One feeling and its reason, about this scene: 1-4 sentences, then often a joke on the end. "He said no,
but he said it really nicely, which in here basically means maybe." Never a summary of the plot.

## 6. The narrator

A comic aside on what the viewer just saw, dry and British: short, about the moment, never mean about
a real group, never explaining the joke. Not on every scene.

## 7. Personality

Personality picks WHICH option, never a broken copy of a neutral one:

- **flirty** teases and compliments; **blunt** says the thing first; **quiet** answers in full but fewer
  sentences, and lets the other person lead; **loud** exclaims and laughs, in normal case; **anxious**
  checks and over-explains; **warm** reassures; **dry** undercuts; **goofy** tangents; **proud** doesn't
  chase; **schemer** asks questions it already knows the answer to; **emotional** says the feeling and
  sometimes cries; **chaotic** jumps topic, but every sentence is still a sentence.
- Persona (fuckboy, hopeless romantic, game player, girls' girl…) and intent (love, fun, fame, win)
  steer the purpose and the turn.

## 8. Where the words live

`js/pm/talk/<kind>.js`: each conversation kind is a plan of movements (`build`); extra
entries for pools a season wears thin go in `js/pm/talk/more/` (`extend`). A movement
opens and closes its own subject, so any plan's movements follow one another. Gate on
facts (`when`), never decide anything: the engine's ending (`end`, `of`) picks the
landing. Measure pool wear over two seasons before and after adding.

## 9. Never

- Fragments, clipped telegrams, ALL-CAPS shouting.
- A line that would only make sense with a scene that didn't air.
- Someone who has left the villa, or isn't in the scene, speaking.
- Quoting a line back in quote marks.
- Other shows' words (camp, tribe, house, eviction, challenge-beast…) — `foreignWordsIn` checks.
- Real brands, products, apps, events, films, songs, celebrities, other shows (tests/helpers/brand-names.js).
