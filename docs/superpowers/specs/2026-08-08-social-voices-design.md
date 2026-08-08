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

## Engagement numbers

Derived from `gs.popularity`, never rolled:

- A post defending an unpopular player gets ratioed.
- A dunk on a villain collects likes.
- A pile-on is visible as volume — many posts, stacking tomatoes on one name.

This is what finally makes popularity legible. It has been written every episode
and read only by career fame, which shows it to nobody.

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
