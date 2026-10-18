# The Ridonculous Race — the writers' brief

You are writing the spoken scenes of **The Ridonculous Race**, a simulator's version of the Total Drama
spin-off (itself a parody of The Amazing Race). The engine has already played the race and decided
everything: who read the tip, who froze on the cliff, who blamed whom, how it ended. **You write how it
sounded.** The user's standard: *"I want to feel like I'm watching the real show."* If one line makes a
reader stop and think "what are they talking about?" or "nobody talks like that", it is a bug.

Read before you write a line:
- `docs/td-dialogue-style.md` — the house style (short; read all of it).
- `docs/ridonculous-race-research.md` Part 2 — what the real show's scenes are made of (start at
  "The shape of a leg"; read "What happens inside a team" and "The writing" twice).
- `docs/ridonculous-race-scenes.md` — your kinds' rows: when they happen, how each ending changes things.
- `js/rr/scenes/<family>.js` — your kinds as the engine plays them: the endings and what each one does
  (`fx`). The ending you are writing **already happened**; write it as it happened.
- `js/rr/script/lines/partners.js` and `don.js` — two small example pools in the format.

## What the show sounds like

- **Two people who know each other too well, under pressure.** Siblings, exes, a father and son, best
  friends, a couple. Every partner scene is about the task in front of them AND about the two of them.
  The comedy is situational: the contradiction between partners ("I'm not too competitive." / "Yes, you
  are."), the habit one of them can't drop, the thing they are clearly not saying.
- **Something is always going on underneath**: they are running, reading, paddling, eating a terrible
  stew, stuck in a taxi. Lines happen during the action; a beat can say what they're doing.
- **Nobody agrees in two lines.** A plan gets questioned, a pick gets pushed back on, someone asks why.
- **Interviews** (`conf`) are the two of them talking to camera, short: the feeling and its reason, or one
  piece of backstory. A confessional can contradict what they just said out loud. That's the point of it.
- **Don** is dry, bored, self-absorbed and a little mean. Never an announcer, never excited for them.

## The user's rules (non-negotiable)

1. **Human, plain spoken English.** Contractions, people trailing off ("I just... okay."), restarting,
   hedging ("I mean", "honestly"). Join thoughts with *and / but / so / because*. Not strings of short
   sentences: "I'm scared. This is high. I can't." reads like a robot.
2. **No clever lines.** No quips, no one-liners written for an audience, no aphorisms ("Trust is a
   currency."), no metaphors nobody says out loud, no sitcom ping-pong of zingers. A joke is allowed only
   if it comes from the character and the situation and lands on first read.
3. **Each line answers the line before it.** Read your exchange top to bottom as a conversation. If a
   reply would make sense after anything, it's not a reply.
4. **Name the subject.** Never "I know what you did" or "about earlier" without saying what. Say the thing:
   "you went left when the sign said right".
5. **Only what they know.** A team didn't see what happened at a place they weren't. Don't mention other
   teams' positions as facts ("we're in third"): teams don't know their place until the mat. "I think we're
   behind" is fine.
6. **Strong characterization.** The base line is plain; the character comes through the voice variants
   (below) and through what they choose to say.
7. **No real places.** No country or city names. No real brands.
8. **No vote words.** This show has no vote: never "vote", "ballot", "tribal", "jury", "evicted",
   "nominated", "immunity", "the Arena". People are "out", "eliminated", "going home".
9. **No head counts in group scenes** ("you three", "the four of us"): a room's size varies.
10. **Nobody says their own name.** `a` never says `{a}`.

## The format

A pool file is a JS module: `export default { '<kind>.<ending>': [entries], '<kind>.any': [entries] }`.
`.any` is used for every ending; an ending's own pool is merged with `.any` when both exist.

```js
{ id: 'ww.3', when: { relFam: 'exes' },          // optional: only when these facts hold
  turns: [
    { beat: '{a} and {b} stop at a fork in the jungle path.' },
    { by: 'a', say: "It's left. I'm pretty sure it's left.",
      v: { sharp: "It's left. Obviously.", dry: "Left. Probably.", loud: "LEFT! It's left!",
           soft: "I think it's left? I'm pretty sure.", odd: "It's left. I have a feeling about left.",
           'rel:exes': "It's left. And before you say anything, yes, I'm sure this time." },
      keep: ['left'] },                            // words the next line depends on: every variant keeps them
    { by: 'b', say: "You said that at the last fork, and we went in a circle." },
    { by: 'a', conf: "We did not go in a circle. We went in a loop. It's different." },
  ] }
```

- `id`: unique across the whole show. Use your file's prefix (given in your assignment) + a number.
- `by`: `a`, `b` (the team), `c`, `d` (the other team, in two-team scenes), `don`, `local`.
- A turn has exactly one of `say` (out loud), `conf` (interview), `beat` (a short stage direction, present
  tense, no dialogue in it).
- **Slots** you may use: `{a}` `{b}` `{c}` `{d}` (names), pronouns `{a.sub}` (he/she/they), `{a.obj}`,
  `{a.posAdj}` (his/her/their, before a noun), `{a.pos}` (standalone), `{a.ref}`, capitalised `{a.Sub}`
  etc.; `{team}` `{teamB}` (team names), `{identity}` `{identityB}` (the team identity, e.g. "Surfers";
  only when the team has one), `{partner}`, `{place}`, `{side}` (the Either/Or side's name, only once
  chosen), `{teaser}` (the hint on a Botch or Watch board, e.g. "Who's ready to get wet?"), `{reward}`,
  `{penalty}`, `{amount}`, `{placing}` (at the mat: "first", "third"…).
  An entry whose slot is empty in a scene is simply never picked, so every pool also needs entries with
  no slot beyond `{a}` `{b}`.
- **`when`** (on an entry or a turn) may use only these facts: `ending`, `phase` (early/mid/late), `early`,
  `late`, `band` (how a and b get on: enemies/cold/neutral/friends), `bandX` (between two teams), `allied`,
  `rival`, `couple`, `rel` (siblings, exes, dating, married, parent-child, bffs, cousins,
  grandparent-grandchild, newly-dating, on-off, once-engaged, coworkers, roommates, rivals, enemies,
  reality-vets), `relFam` (family/romantic/exes/friends/rivals), `identity`, `identityB`, `idGood`, `idBad`
  (the task is one their identity is good/bad at), `behind`, `ahead` (where they *think* they are),
  `broke`, `snapped` (not speaking), and for the OTHER team in a two-team scene: `relB`, `relFamB`, `brokeB`,
  `failsB` (0, 1, 'many'); `weOwe` (a's team owes c's: a deal c's team helped with, a loan) — `rel:` variants on
  `c`/`d` lines follow the other team's relationship; `tod` (night/morning/day/evening), `stretchKind`
  (travel/either/botch/allin/mat/board), `taskType` (the task's main type: water, heights, nerve, stomach,
  perform, brains, hands, strength, search, people, patience, travel — so a line can say "eat it" or
  "jump"), `mode` (how they travel on this stretch: flight, taxi, foot, drive, camel, boat, bus),
  `matPlace` (at the mat: first, top, mid, bottom, last), `why` (why a lead changed: injury, snap, crush,
  win), `rule` (the twist Don explains in don-rule: boomerang, yield, boomerang-vote), `byVote` (a team sent back
  because everybody picked it, in boomerang-hit), `mishap` (what went wrong on the road in a travel-mishap: flat-tyre, lost-driver, wrong-way), `aElder` (a is a generation older than b — the parent or grandparent — true/false; unknown when
  absent, so gate "when you were little" lines on it), `fails` (0, 1, 'many'), `place`, `cause`,
  `threadStep`, `register`/`registerB` (how a/b talk: sharp/dry/loud/soft/odd). A value can be a list:
  `{ tod: ['night', 'evening'] }`.
- **Voice variants `v`**: on every spoken line that carries character, write all five families —
  `sharp` (cutting, proud, scheming), `dry` (flat, calm, deadpan), `loud` (blunt, shouty, competitive),
  `soft` (warm, earnest, anxious), `odd` (goofy, theatrical, a bit off) — each a full line that means the
  same thing and still answers the line before. A variant may be a list of two or three takes.
  Where the relationship changes how it's said (a fight, comfort, blame, a joke between them), add
  `'rel:family'`, `'rel:romantic'`, `'rel:exes'`, `'rel:friends'`, `'rel:rivals'` versions: siblings
  bicker like siblings, exes like exes. A variant must not drop who or what the line is about (a gate
  deletes variants that lose the subject, become shouted fragments, or shrink below half the line).
- **Identity hook** `id`: `{ by: 'a', id: 'good', say: "fallback line" }` lets the team's identity speak
  its own line (Surfers on water, Goths at a carnival). Hooks: `good`, `bad`, `win`, `struggle`, `lose`,
  `quit`, `arrive`. The `say` must work when the team has no identity. Use sparingly: one per entry at most.
- **`opt: true`** on a turn: said only if its speaker exists in this scene.

## Who `a` and `b` are (team moments)

`a` is the one the moment is about; `b` is the partner. For the moments a leader drives (reading the tip,
choosing a side, the route, the transport, planning, a pep talk, managing the partner, money worries,
celebrating) `a` is the team's leader. For fear, refusing, embarrassment, an old wound, homesickness, an
injury, `a` is the one it happens to. In a Botch or Watch, `a` is the one doing it (`whose-botch`), except
`pushed` where `a` is the partner who pushed `b` into it; in `watching-botch` `a` is the one watching.

## Who's who in the other kinds of scene

- **Two teams** (`cast: 'teams'`): `a` acted (the one who trash-talks, pitches the alliance, offers help,
  shoves), `b` is `a`'s partner, `c` is the one on the other team `a` deals with, `d` is `c`'s partner.
  `{team}` is a's team, `{teamB}` c's. The two teams just met at the same stretch; they only know what they
  see there and what happened between them before (`allied`, `rival`, `bandX`).
- **Romance** (family 4): `a` and `b` are the two people with the crush, on DIFFERENT teams; `c` is a's
  partner, `d` is b's partner, present but optional (`opt: true` on their turns). `{crush}` = b.
- **Rooms** (`cast: 'group'`): `a` to `f` are the people seated together (on a plane row, in a queue, at a
  closed gate, watching a task, at the mat), from different teams, in seat order; a scene can have as few
  as two of them, so turns for `c`–`f` are `opt: true`. Never count heads.
- **Locals** (`cast: 'local'`): `a`, `b` the team; `by: 'local'` speaks as their role ("The driver", "The
  judge", "The ticket agent", "The vendor"), never with a name; `{local}` is that role word.
- **Don** (`by: 'don'`): `a`, `b` the team he speaks to when there is one.
- **Interviews** (family 13): `a`, `b` are the two partners side by side in front of the map (only `a` in a
  secret one). An interview follows a moment that aired: `cause` is that moment's kind and `causeEnding`
  its ending — gate on them so the interview is about the right thing, and never retell the scene: say
  the feeling and the reason, in a sentence or two each, and let the partner contradict.
- **The system's own moments** (`attempt-fail`, `quit-task`, `helped-botch`, `allin-alone`,
  `travel-mishap`, `found-flight`, `same-flight`, `express-used`, `yield-found`, `yield-decide`, and the
  director's `task-start`, `task-try`, `task-done`): `a`, `b` the team (`a` is the one doing a solo task).

## How much

- Every pool you own: **3 to 5 entries per ending**, at least **2 with no `when`**. Write `.any` entries
  where the ending doesn't change the words much, and ending pools where it does (it usually does).
- Length by moment: a quick task beat or a tip read is **3–5 turns**; a fight, a crush, a make-up, a
  confession is **6–12**. Never more than 12.
- Vary the shape: not every entry opens with a beat, not every entry ends on a confessional.
- Use `when` to write for specific relationships and situations (exes, a parent and child, late in the
  season, at night) — those entries are how scenes feel specific. Keep at least 2 general ones per pool.

## Check every entry against these (the bug classes other shows shipped)

- Something that never aired ("after what happened yesterday" — what happened?).
- No subject ("she just did something amazing" — what?).
- Wrong time or place (a "breakfast" line in a scene that could be at night; "on the beach" at an airport).
  Keep lines setting-neutral unless you gate them with `stretchKind`/`tod`.
- A reply that doesn't answer; a variant that drops the word the reply picks up (use `keep`).
- Knowing too much (a team naming another team's result they didn't see).
- A line that assumes a relationship the two don't have ("I've known you since we were kids" between
  coworkers): gate it on `rel`/`relFam`.
- Too clever, or too dumb (a "nerdy" voice dropping "statistically" into everything).
- One person playing both parts; someone talking to a person who isn't there.

## When you're done

Run `npx vitest run tests/rr-dialogue.test.js`. Fix every failure that names one of your ids (other
writers are working at the same time: ignore failures in their files). Then read your file once more top
to bottom as a viewer would, out loud in your head, and fix anything that sounds written rather than said.
Report: the kinds and endings you covered, how many entries, anything in the engine's endings that you
found hard to write truthfully.
