# Social voices — design spec

Design spec, 2026-08-08. **Project 1 of 3** in the live-season social feed.

The franchise has an audience that has never been visible. This builds the voices
that audience speaks in — a cast of recurring fans, and the grammar of the two
places they post — so the engine that comes next has something to say.

---

## The three projects

The feed is too large for one spec. It slices in the order the work depends on:

| | Project | Delivers |
|---|---|---|
| **1** | **Social voices** (this spec) | the fan personas, the platform grammar, and a sampler to read them |
| 2 | The post engine | episode events → posts, with likes, tomatoes and replies, stored in a database |
| 3 | The live feed | the UI where messages keep arriving, published when an episode syncs |

Voice comes first because it shapes everything after it. An engine built against
placeholder voices would be rewritten once the voices were real.

## Why this exists

`gs.popularity` is written every episode, read by career fame, and **shown to
nobody**. There is no surface anywhere on the site where a viewer can see how the
audience received a player. The feed is that surface, and this project builds
what it is made of.

## What was researched, and what it changed

**ChatBCC** (`https://chatbcc.com/bigbrother`) is not a timeline. It is a group
chat: 56 Big Brother alumni act as **hosts** — Rob Cesternino, Janelle Pierzina,
Taylor Hale, Paul Abrahamian and others — with roughly 41,000 fans as members,
running live watch parties, gossip and prediction games.

That changed the design. The two streams are not one feed with two labels; they
are different rooms with different physics. A public timeline is a stadium. A
hosted group chat is a room where the hosts have played the game.

**`voice-profiles.json` already holds 183 character voices** ("Alejandro —
smooth, charming, calculated manipulator… silky, flattering speech that hides a
knife"), and franchise-meta already tracks returnee reputation and grudges. So
the alumni stream needs **no invented voices at all** — an alumnus posts as
themselves, with their real history against people still playing. A large part of
this feature was already built and unused.

## Decisions taken

| | Decision |
|---|---|
| **Recurring fans, with history** | A named cast that comes back every season and remembers. Recognising a handle is what makes a feed feel alive; it also lets an opinion evolve mid-season. |
| **Procedural, not AI** | Composed from the library at runtime. A live feed needs a post every few seconds — an API round-trip per post cannot deliver that, costs money, and fails offline. |
| **Personal cruelty, not bigoted cruelty** | Fans can be vicious about looks, personality and gameplay. They may not attack race, sexuality, religion or disability. |
| **Engagement derived from popularity** | Likes and tomatoes come from `gs.popularity`, never from a random roll. This is the point of the feature. |
| **Alumni voices come from the existing profiles** | No second voice library for characters. |

### On the hostility line

The user asked for genuinely nasty, including personal attacks, and that is what
this builds: reality-TV fandom is cruel, and a sanitised feed would be a lie
about what these shows do to people.

The line is drawn at protected characteristics. The cast carries canonical
ethnicities and sexualities, and that is the point where "depicting a pile-on"
becomes "generating slurs about a gay character". Everything that makes fandom
brutal — being called fake, insufferable, a coward, a floater, the worst winner
in franchise history, ugly inside and out — survives the line intact.

This is enforced by a test, not by good intentions. See Testing.

## What this project delivers

- `js/social/personas.js` — the recurring cast of fan accounts
- `js/social/topics.js` — what they post about, and which simulator data each reads
- `js/social/platforms.js` — the grammar of the timeline and the group chat
- `js/social/sampler.js` — given a fake event, produce N posts to read

**The sampler is not optional.** A data file with no consumer is dead code, and
this codebase has shipped that repeatedly: an export path with no caller, a
`STEAL_LIMIT` that existed only in comments, a viewer announcement that never
fired. Without a way to read sample output, nothing here can be judged.

## The persona

```js
{
  handle: '@vetokween',
  name: 'jules',
  since: 4,                    // the season they started watching
  archetype: 'stan',           // stan | hater | analyst | livefeeder | casual | chaos
  loyalties: ['heather'],      // who they defend
  grudges: ['alejandro'],      // who they have never forgiven
  voice: {
    caps: 0.3,                 // 0..1, how often they shout
    emoji: 0.6,
    length: 'short',           // short | medium | long
    punctuation: 'none',       // none | normal | heavy
  },
  platforms: ['timeline'],     // timeline | chat | both
  volatility: 0.7,             // 0..1, how fast their opinion turns
}
```

**History is the feature.** A stan who has defended Heather since season 4 reacts
to her blindside differently from a first-timer, and `volatility` decides
whether they defend her, turn on the house, or turn on *her*. Loyalties and
grudges move during a season, so week 9 does not read like week 1.

All persona stats are used **proportionally** — `caps: 0.3` scales how often a
post shouts, never a threshold that flips at 0.5. This matches the simulator's
existing rule that stats multiply rather than gate.

### A fan holds two opinions of you, not one

`loyalties` and `grudges` above are the coarse version. The real model is two
independent axes per player:

```js
feelings: {
  heather: { affection: 0.8, gameRespect: -0.4 },   // love her, hate her game
  scott:   { affection: -0.6, gameRespect: 0.9 },   // can't stand him, he's playing a blinder
}
```

**This is the axis fandom actually runs on.** "I adore her but she is playing the
worst game I have ever seen" and "he is insufferable and he is going to win this"
are both extremely common posts, and neither is expressible with a single
like/dislike number. Collapsing them would make every fan a stan or a hater and
lose most of what a real audience sounds like.

The two axes move independently and from different causes. A brilliant blindside
raises `gameRespect` and may lower `affection`. Being kind to somebody having a
bad night raises `affection` and does nothing to `gameRespect`. Steamrolling the
season can raise `gameRespect` while draining `affection` from everyone watching,
which is exactly how a dominant winner becomes hated.

`loyalties` and `grudges` are derived from the extremes rather than stored twice.

## The two platforms

### The timeline

Public. Anyone posts. Short and fast.

- **Engagement:** likes, tomatoes, replies, quote-dunks, ratios.
- **Shapes:** hot take, dunk, stan defence, live reaction, tinfoil theory,
  pile-on reply.
- Hostility lives here.

> **@vetokween** · LMAOOO he had NO idea 💀 four weeks of "i control this house"
> for THIS

### The group chat

Alumni as hosts, fans as members, as ChatBCC actually works.

- **Engagement:** likes and comments. No ratios — it is a room, not a stadium.
- **Shapes:** host take, prediction, insider read, watch-party reaction,
  member question answered by a host.
- Warmer on the surface, often shadier underneath, because the hosts played this
  game and know these people.

> **Alejandro** · Called it Tuesday. Watch how she stopped saying his name in the
> kitchen — that's the tell. You stop mentioning the person you are about to cut.

**The same event must read differently in each room.** If it does not, the
library has failed, and a test says so rather than a reader noticing.

## What they post about

A fan feed that only discusses strategy is a podcast, not a fandom. The topics
below are taken from observed discourse in real reality-TV fandom, not invented —
see Research method for how they were gathered and what may be copied from them.

**Gameplay**
- strategy critique — that move made no sense, why would you take her to the end
- comp performance, and who is carrying whom
- blindside reaction
- prediction and bracket talk
- legacy takes — best winner, worst winner, where this ranks all-time
- **steamroll fatigue** — one side is running the season and it has stopped being
  a competition. Observed repeatedly when veterans hold early advantages.
- production critique — the twist is unfair, this is scripted, the game is rigged

**Social**
- **harassment defence** — the house is ganging up on somebody and the audience
  turns on the house. This is one of the strongest forces in real fandom.
- **edit critique** — production is framing somebody unfairly. Fans defended
  Taylor Hale on exactly this in Big Brother 24.
- bullying call-outs, and defending the target
- kindness noticed and rewarded
- personality-clash takes — these two were never going to work

**Romantic**
- shipping — two people who are not together and should be
- thirst — plain attraction, stated plainly
- showmance hate — get a room, she is carrying him, this is costing them the game
- **showmance concern** — when a pairing reads as coercive rather than romantic,
  fandom raises alarm rather than swooning. Observed in Big Brother 27 over
  love-bombing behaviour.

**Character**
- **love the person, hate their game** — and its mirror. The two-axis feelings
  model exists to produce these.
- meme-ing and comic relief appreciation
- favourite declarations, and the fights they start

**Meta**
- pile-on participation, ratios
- fandom infighting — stans against haters, one account against another

Each topic declares which simulator data it reads — showmances and romantic
sparks for the romantic topics, camp events and social manipulation for
harassment and bullying, `chalMemberScores` for comp talk, popularity for the
meta topics. A topic with no data source behind it is a topic that will never
fire, which is the failure this codebase has shipped repeatedly.

## Research method

The taxonomy above, the post shapes, and the register of each platform are drawn
from studying real fan and alumni posting: public reality-TV fandom on social
media, and ChatBCC's hosted-alumni format.

**Patterns are studied; text is not copied.** No real person's post is reproduced
in the library. What is taken is structure and register — how long a dunk runs,
where the caps land, how a defence is phrased, how a prediction is hedged — and
the strings are then written fresh. Lifting real posts would put real people's
words in the mouths of fictional accounts, and would make the library a copy
rather than a voice.

## Engagement numbers

Derived from `gs.popularity`, never rolled:

- A post defending an unpopular player gets ratioed.
- A dunk on a villain collects likes.
- A pile-on is visible as volume — many posts, stacking tomatoes on one name.

This is what finally makes popularity legible. It has been written every episode
and read only by career fame, which shows it to nobody.

## Built to be extended by somebody else

This library is meant to keep growing, and not only by whoever wrote it — Codex
is expected to add to it after this ships. That is a design constraint, not a
footnote:

- **Data, not code.** A persona, a topic and a post shape are plain objects.
  Adding a fan, a topic or a phrasing must never require touching the composer.
- **One file per concern**, so two contributors adding different things do not
  collide: `personas.js`, `platforms.js`, `topics.js`.
- **Every field documented where it is defined**, with its range and what it
  does. `volatility: 0.7` means nothing to a contributor who has to infer it from
  a call site.
- **The tests are the contract.** Persona integrity, the hostility denylist and
  the variety check all run over whatever is in the library, so a contribution
  that breaks the rules fails immediately rather than being caught in review —
  or not caught at all.
- **Additions are append-only by shape.** A new topic declares its data source
  and its post shapes; nothing existing has to change to accommodate it.

## Testing

- **Persona integrity** — handles unique, required fields present, and every
  `loyalties`/`grudges` entry naming a player who exists in the roster. A grudge
  against a misspelled name is a persona whose history silently never fires.
- **The hostility line** — a denylist over every string in the library, covering
  attacks on race, sexuality, religion and disability. Per the lesson this
  codebase keeps teaching, the test covers the CLASS, and a canary proves it
  catches a hostile string planted on purpose rather than only the instances that
  happen to have been written.
- **Variety** — 50 posts from one event: no duplicates, and more than one
  archetype represented.
- **Topic coverage** — every topic in the taxonomy can actually fire. A topic
  whose data source never produces a post is dead weight that reads as breadth
  in the file and appears nowhere on screen, which is the failure this codebase
  has shipped repeatedly: an export path with no caller, a viewer announcement
  that never fired, a `STEAL_LIMIT` that lived only in comments.
- **Both feelings axes are exercised** — the library can produce a "love them,
  hate their game" post and its mirror. If it cannot, the two-axis model is
  costing complexity and buying nothing.
- **Voice separation** — a timeline post and a chat post about the same event
  differ measurably in length and register.
- **History changes stance** — a persona's post about their favourite differs
  before and after that favourite is evicted.

## Out of scope

Deliberately left for projects 2 and 3:

- turning real episode events into posts (project 2)
- the database the posts are stored in (project 2)
- publishing on episode sync, and the live-arrival UI (project 3)
- moderation, reporting, or any player-facing interaction with the feed
- AI-written posts. The data is shaped so a later hybrid — procedural for the
  flood, one AI-written viral post for a finale or a blindside — needs no rework,
  the way `js/fame.js` left a read API for the simulator without wiring it.

## Open question, recorded not decided

`live_season` has no `format` column, so the overlay the feed will eventually
publish through is Total-Drama-shaped. Project 3 inherits that, and it overlaps
with sub-project E, which makes `current-season.html` format-aware. Whichever
runs first should generalise the overlay rather than both working around it.

---

## Carried into project 2 (recorded 2026-08-08, after project 1 shipped)

Project 1 is complete: `js/social/{personas,topics,platforms,phrasings,sampler}.js`
with `read-sample.mjs`, 32 tests across four files. What follows was found during
it and deliberately left, because it needs real episode data.

### Known-and-pinned, not broken

- **Engagement is inert for most players.** `crowdAffection` in `sampler.js`
  proxies crowd sentiment using the persona cast, because `gs.popularity` is
  unreachable from a pure module. The cast holds feelings about seven slugs; for
  every other player the crowd reads 0, so tomatoes are always 0 and likes are
  flat. **This is asserted by a test using `bridgette`**, together with a second
  test proving no persona holds a feeling about her — so the limitation cannot go
  vacuous. Swapping `crowdAffection` for real `gs.popularity` is project 2's job,
  and **that first test is expected to fail when you do it.** That is the signal,
  not a regression.

- **`volatility` turns no opinions.** It documents itself honestly now: it is a
  likes multiplier, nothing in project 1 mutates `feelings`, and a persona's post
  about a favourite reads identically before and after that favourite is evicted.
  The spec's "history changes stance" belongs to project 2, which has the episode
  data to move feelings with.

- **`IMPLIED_KINDS`** in the sampler is a workaround for an event kind a topic
  does not declare. The cleaner fix is adding `blindside` to that topic's
  `triggers` in `topics.js`.

### Real gaps, cheap to close

- **Only 4 of 12 personas post in the hosted chat**, which is the true ceiling on
  that room's variety — chat uniqueness sits at 0.86 against the timeline's 0.94.
  Adding chat-eligible personas is the highest-value contribution available and
  needs no code.

- **Pronoun agreement.** Some phrasings say "themselves" for every player
  ("Alejandro talked themselves into this"). The project has `pronouns(name)` in
  `js/players.js`; project 2 has the player data to use it.

- **The topic-coverage guard ignores slot filtering.** It proves a pool exists for
  every topic × shape × stream, but a pool whose every template needs a slot the
  event lacks would still pass and then produce nothing.

- **`composePost`'s empty-shapes throw is unreachable from `samplePosts`**, which
  pre-filters. It guards direct callers only — correct scope, worth knowing.

- **The committed variety test sweeps 60 seeds**; the 0.94/0.86 figures came from
  a 300-seed sweep. CI-reasonable, but the committed guarantee is the weaker one.
