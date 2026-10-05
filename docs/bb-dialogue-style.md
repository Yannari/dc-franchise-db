# How Big Brother houseguests talk — the style guide for house scenes

Every scene pool in `js/bb/story/lines/` is written against this page. It is
built from real transcripts, read 2026-10-05 (Big Brother 22, episodes 20–22,
subslikescript.com). The rules are what those people actually did, not what
reads neatly. Spec: `docs/superpowers/specs/2026-10-05-bb-house-storylines-design.md`.

The user's standing rules sit on top:
- plain, fluent English;
- jokes that land on first read;
- real spoken dialogue, not narration about a conversation;
- nobody says what they could not know;
- no invented family or pets.

## 1. What real house talk does

**Short turns, most of the time.** Most strategy lines are one to eight words.

> "So we're keeping Ian?" / "Yeah." / "Are you sure?" / "Yeah." / "He said yeah." / "Really?" / "Yes." / "I don't know. I'm not buying this."

**People make each other say it again.** Nobody takes a yes the first time.

> "You swear, David?" / "I'm done. It's done." / "Okay."
> "Did you flip your vote?" / "I didn't... I did what I told you." / "You voted to keep Ian?" / "You know, yeah." / "Okay."

The "Okay." that ends that exchange means *I don't believe you*. The line does not say so.

**Repetition is emphasis.**

> "Lock them. Keep them locked. Lock them."
> "I'm going to kill him." / "I know." / "I'm going to kill him."
> "I'm tired. I'm tired."

**Specifics, not feelings-words.** Vote counts, names, who shook on what, when.

> "These votes were supposed to be 4-4. But now it's 5-3. Guess who is on the 3? Me."
> "You just need four." / "I'll talk to David. And that's four."

People rarely name a feeling neatly ("I feel betrayed"). They show it: "What in the actual hell is wrong with you?", "Idiot. Stupid idiot."

**Fillers and hedges** are how real people buy time:
- "I mean";
- "like";
- "literally";
- "you know";
- "to be blatantly honest with you";
- "at the end of the day";
- "I'm just saying";
- "obviously".

Use them sparingly and by character: a calm strategist hedges, a hothead does not.

**Affection is often a mock insult.**

> "You're going to make me cry. You are the worst. I hate you so much."

**A conversation has a purpose, and a procedure to start it.**

> "Can I talk to you?" / "You want to talk?" / "Yeah."
> "I was going to come find you." / "Find me?" / "Yes." / "Okay, don't be mad at me."

Small talk often opens a serious talk: "Hi, baby. You look pretty in this orange." / "Thanks." / "Do you understand why I said what I said?"

**Pushback is about logic.**

> "So why are we going to backdoor him, Memphis? No, come on."
> "Everyone is a threat. At this point, everyone is a threat, man."

**Hyperbole and self-mockery** are how people handle bad news.

> "I'm on the block for the fourth time. I am a block professional. I'm certified."
> "My chances of staying are 50-50. It literally is a toss of a coin."

**Scenes chain through people.** "Okay, I'm going to talk to Memphis" → the Memphis talk → "I'm so annoyed with Memphis." / "Why?" / "Did you hear what he wants to do?" What one person learns, the next scene carries.

## 2. The Diary Room

The confessional carries what a scene cannot say out loud:
- **The why:** "I need two people that I have an excuse to put up there."
- **The gap between said and meant:** "I'm trying to hint to Kevin he's not my target."
- **The cause, when it was off camera:** "Millie made a joke about my job last night. In front of everybody."
- **A read on somebody:** "David's credit score is negative 3,000."

A confessional is spoken, in the first person, to a camera. It is still a person
talking, not a summary: "Do I believe Millie? Kind of. Do I trust Millie? No."

## 3. A rhythm per kind of scene

**Strategy check / vote count.** Clipped, confirming, counting. 8–14 lines. Names and numbers in every other line.

**Big argument.** 12–30 lines. It starts low ("Can I say something?") and escalates:
- grievances listed, with names and times;
- interruptions: a line cut off with "—", and the next speaker starting with "—";
- people answering the thing they *wanted* to hear, not what was said;
- the room reacting: someone leaves, someone says "Okay, okay";
- someone walking out mid-line, and a parting shot.

The loser of the argument often goes quiet rather than conceding.

**Declaration / heart-to-heart.** Slow:
- one person finally says a long, halting, honest thing ("Okay. So. I came in here with a plan…");
- pauses written as stage directions;
- the other does not answer straight away;
- a joke breaks the tension;
- it should use the pair's own history (a moment the viewer saw).

**Pitch.** One long turn laying out the plan in concrete steps, then the listener's careful, short questions: "And if Hicks wins?" / "Then we're both fine." / "Says who?"

**Breakdown / homesick / goodbye.** Long fragmented turns that trail off and restart:

> "My meter is running low. I can't keep doing this. I just... I have this moment where... being in here, I'm losing... I'm losing me."

The comforter says less, and nothing clever: "Hey. Hey. Come here."

**Banter / bits.** Rapid. Each line builds on the joke of the one before, and others join. It ends on a laugh or a groan, never an explanation of the joke.

**Group meeting.** Four or five voices. One person tries to run it; side comments; someone keeps asking the obvious question; someone leaves early.

## 4. Things this page forbids

- **Tidy, complete sentences that name a feeling** ("It was about your job, and it was cheap."). Say the thing the way a person under pressure would.
- **Lines that explain a joke, or "clever" lines that need a second read.**
- **Every line the same length.** Real scenes mix one-word replies with long turns.
- **The same opener in every scene of a kind.** Not every confrontation starts "Can I talk to you?"
- **A past nobody had.** "Yesterday", "this week", "your vote" only when the record says so.
- **A speaker naming a thing they did not see.**
- **Writing a name into a pool.** Names come from the slots: `{a}`, `{b}`, `{c}`, `{target}`.
