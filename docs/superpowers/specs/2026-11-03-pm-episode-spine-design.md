# Perfect Match: the episode spine (2026-11-03)

## Why

The user, 2026-11-03: Perfect Match "is not at the level of Big Brother or
Ridonculous Race or even Total Drama … boring and repetitive … no real
storyline … too cut … the dialogue level is rough, the continuity is bad, the
logic is lacking", and the viewer is not on par with the other stepped viewers.
Are You The One is parked behind this: it will run on this engine.

Four overhauls in two weeks (dialogue 10-22, threads 10-25, stretch 10-30,
reunion 10-31) fixed lines and repetition. The lines now read plainly. What a
read of seed 41 found is structural:

| measure (`npm run audit:pm-spine`, 4 seeds) | now | real LI hour (USA S8E12) |
|---|---|---|
| aired scenes an episode | ~54 | ~15-20 |
| spoken lines a scene | ~4 | 20-60 turns |
| lines in the episode's own stories (A/B) | ~37% | most of the hour |
| crush acted on with nothing on screen before | ~45% | a crush is built, or the kiss is the reveal |
| scenes there for the laugh | ~1 | a light couple + group gossip all hour |

and, read: scenes contradicting what aired earlier the same day (Jess dumped in
the morning kisses Jordan "I'm proud of us" at the challenge; Tasha laughs at a
kiss the line before said "everyone is looking at Tasha"; the same hut line twice
in one challenge).

## Root causes found in the code

1. **Air order is not write order.** `villaDayEvents` writes the morning, day,
   challenge and evening; `runVillaDay` then writes the ladder, feelings,
   advice, rituals, triangles, rivalries, game players, arcs, fights, enemies and
   breakdowns, and `phasesOf` sorts them back into the morning and the day.
   A scene's words read `state._today` — what was *written* before it, not what
   *aired* before it.
2. **Everything runs at once.** Eleven systems each draw their own scenes on
   their own dice; the stretch plan (pm/stretch.js) only cuts some side stories
   from air. Texture fills the rest.
3. **Interest costs nothing.** A challenge kiss or a pull can be "I've wanted to
   kiss X for days" with nothing on screen before it.
4. **Nothing is there to be fun.** Comedy is a one-line note that rarely airs.

## Goals

- An episode follows its A and B stories from every side; the rest of the villa
  is a few scenes, and one light runner (setup, escalation, payoff) for laughs.
- Every scene's words know everything that aired before it that day.
- Interest is shown before it is acted on, or the act is played as the reveal.
- Fewer, longer scenes. Lines an episode stay ~300 (user, 2026-10-30).
- Every episode ends on something unanswered.

**Non-goals:** changing who couples with whom by fiat (recoupling.js desire()
stays the decider); new stats; a snarky narrator (feedback-pm-plain-feelings:
the narrator states what is happening); the viewer's look (second project, after
this reads well).

**Anti-goals:** a cosmetic scene (every runner beat has a consequence); a
character knowing what they did not see; lines with quips or tangents.

## The build, in order (each step measured by the spine audit, then a read)

1. Write order = air order: rituals in their slot, the night systems write as
   the late evening, the Hideaway breakfast in the morning.
2. The logic classes found by reading (partner checks after a split, watcher
   reactions that ignore the kiss they watched, a shut-down after a comfort).
3. Story-first day: texture cut on days with a plan; advice, feelings and side
   scenes for the plan's people, mostly.
4. Shown interest: a ledger of who has shown interest in whom on screen; an
   unset crush plays as a surprise reveal and starts a story, never "for days".
5. The light runner: one comic thread an episode from outside the A/B cast, three
   beats, each with a consequence.
6. Longer scenes for the story kinds that carry an episode (pull, where-head,
   watching, doubt-end, graft-shut, group-chat).
7. Hooks from the A story.

Then: read seasons (seeds 41, 7, 12) episode by episode and fix by class until it
reads like an episode of the show; then the viewer.

**Calls made without the user (check these):** narrator stays plain; the light
runner is islander comedy (pranks, bets, the Hideaway gossip), not narration;
unaired notes stay in the viewer's raw footage but the edit makes fewer of them.
