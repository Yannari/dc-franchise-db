# The Circle — design

**Status:** design, awaiting review · **Date:** 2026-09-29 · **Show slug:** `the-circle` · **Prefix:** `ci`

The sixth show on the engine. Players live alone in separate apartments in one
building, never meet, and talk only through a voice-controlled social network
called The Circle. They can play as themselves, an edited version of
themselves, or somebody else entirely. Every few days they rank each other;
the top two become Influencers and block someone. At the end the players rank
each other one last time and the highest-rated player wins.

The goal is a **1:1 experience of the real show**: its rules, its rituals, its
rhythm and the way its players actually talk. Where this document describes a
mechanic, it says which real season it comes from. Where a mechanic is ours, it
says so.

---

## 0. What success looks like

- A season plays headless (`playCircleSeason`) and replays identically from its
  seed, the way Perfect Match and The Traitors do.
- Reading a season transcript (`npm run ci:transcript`) feels like reading the
  real show: people dictate messages, read them aloud, react in other
  apartments, hunt catfish, make pacts, break them, and get caught.
- Every ranking, save and block follows from what the players *believe*, and
  every belief follows from something they saw or were told on screen.
- Nothing a player does is cosmetic. A lie can spread, collide with another
  version of the story, get caught, cost trust, sink a rating and end a game.
- The screens look and move like the real Circle interface, pushed further
  into a game presentation (the approved mockup, §18).
- The English reads as natural speech: fluent, plain, specific, never a
  translation and never a quip for its own sake (§17.6).

---

## 1. Decisions already made (do not re-open)

These were settled with the user during the brainstorm on 2026-09-29.

| # | Decision | Why |
|---|---|---|
| 1 | **Own engine in its own game state** (`js/ci/`, `js/ci-run.js`), the Perfect Match / Traitors pattern. | Proven twice; cannot break the other shows; a hundred-season audit runs without a browser. Big Brother's week loop was rejected: it assumes competitions and ballots. |
| 2 | **Mixed cast.** Franchise alumni, new faces, or both, chosen per season in the Cast tab. | The user's choice. Alumni bring reputations and grudges; strangers bring the clean "nobody knows anyone" premise. |
| 3 | **Catfish faces come from `assets/guests/`** (84 faces), plus occasionally an alum's face. | The user's choice. The folder's prefixes (senior, vet, athlete, fan, crew) are Drag Race makeover roles, not descriptions — `senior-wally` and `vet-conrad` are young men — so the Circle keeps its own face catalogue (§4.6). |
| 4 | **The approved visual direction** is `circle-stage-v3` (§18). | The user: "seem really good … a little more personality in the apartment but I love it". |
| 5 | **Host:** a comic narrator-host in the spirit of Michelle Buteau. **Identity undecided.** Don (`don.png`) is a candidate the user may keep for a future Amazing Race. | The engine reads the host's name and portrait from one config slot (§17.4). Nothing is hard-coded. |
| 6 | **Relationships are keyed by profile, not person,** inside the season. | Bridgette trusts "Maddie". At the reveal that feeling converts into a feeling about the real player, and that is what reaches the franchise ledger (§5.4). |
| 7 | **Each player has a Profile Plan in Cast setup** (mode, cover, tells). Blank fields roll. | The user asked for covers to be authorable (§4.2). |
| 8 | **Honesty is decided fact by fact,** from what showing each fact costs in this game. | The user asked how "themselves, but with a different job" is decided (§4.3). |
| 9 | **Nice archetypes** may be Polished, Edited, or a *protective* catfish. Strategic catfishing, the Hacker, planted claims and canary traps are scheme-only. | Keeps the franchise's archetype rule while matching the real show, where plenty of kind people catfish (§4.4). |
| 10 | **Photos are uploaded inside the website,** not dropped into a folder. | The user: "I aspire to make my sim usable to everyone … people that don't have access to the local files" (§19.3). |

---

## 2. The real show, as source material

### 2.1 Where the facts come from

- **Episode transcripts:** all 90 US episodes (seasons 1–7) from Forever
  Dreaming, read as raw text. Three read end to end (1×01 *Hello, Circle*,
  1×02 *Face-to-Face*, 1×12 *Finale*); all 90 mined for rituals, system
  messages, dictation habits, visits, goodbye videos, saves and Hangout talks.
- **Per-season Wikipedia articles:** US 1–7 and UK 1–3, for rules, twists,
  blocking order and catfish identities.
- **The Circle fandom wiki:** influencer lists, the Inner Circle, burner
  profiles, the AI player, second chances.

The transcripts are gitignored research, not part of the build. The numbers
below were counted from them and are the calibration targets in §21.

### 2.2 The shape of a real season

| | US (Netflix) | UK (Channel 4) |
|---|---|---|
| Players, total | 10–14 | 15 |
| Days | 11–15 | 21–27 |
| Episodes | 12–13 | 18–22 |
| Starting players | 7–8 | 8–9 |
| Blockings | 6–8 | 10–12 |
| Finalists | 5 | 5 (4 in series 1) |
| First rating | often Day 1 (US 1, 4, 5) | Day 1–2 |
| Prize | $100k ($150k in US 4) | £50–100k |
| Viewer prize | Fan Favorite, $10k | Viewers' Champion (series 1–2 only) |

**Winners who catfished:** 5 of 10 (US 2 DeLeesa as "Trevor", US 6 Brandon as
"Olivia", US 7 Jojo as "Gianna", UK 1 Alex as "Kate", UK 3 Natalya as "Felix").
Catfish are roughly a third of a cast. A catfish is as likely to win as not,
and the engine must allow that.

### 2.3 Exact wording the Circle uses

The Circle speaks in short, formal system messages that the players read
aloud. These are the real phrasings (counted across 90 episodes) and the pool
starts from them:

- "Welcome to The Circle." · "You must now set up your profile." · "You should
  select one image from your private albums to become your first profile
  picture."
- "Please update your status." · "Circle Chat is now open." · "Circle Chat is
  now closed." · "X has invited you to a private chat." · "X has invited you to
  a group chat."
- "Players, it's time for the Ratings." · "You must rank your fellow Players
  from favorite to least favorite." · "Ratings complete." · "Players, the
  Ratings results are in."
- "As the most popular Players, X and Y are now The Circle Influencers." · "All
  other Players are at risk of being blocked." · "Influencers, you must now
  decide which at-risk Player you wish to block from The Circle." · "Please go
  up to the Hangout to discuss your decision."
- "The Influencers have made their decision." · "All Players must go to Circle
  Chat." · "X has been blocked from The Circle."
- "Before X leaves, they can meet one Player." · "Think about who you would
  like to meet." · "X is on their way to meet one of you now."
- "X has left a message for The Circle." (24 times — the single most common
  alert after the ratings.)
- "A new Player has entered The Circle." · "As the new Player, X cannot be
  blocked." · "There are no more new Players entering The Circle."
- "Players, you must now make your final ratings." · "Before the winner is
  revealed, you are invited to one last Circle Chat."

Every alert arrives with the **ALERT!** sting and players shouting "Alert!"
back at the screen. This happens several times an episode and is part of the
rhythm, not an exception.

### 2.4 How players talk to the Circle

Counted across the 90 transcripts: "Circle, message" 846 times, "send" 1,826,
"emoji" 1,473, "exclamation point" 337, "question mark" 274, "dot, dot, dot"
130, "hashtag" 133 (plus 1,940 written `#` tags), "LOL" 141.

Players **dictate punctuation and emoji out loud**: "Message: 'Hey, girls, hey.
I wanted to start this chat just to get to know all of you. Girls who stick
together are pretty girls.' Emoji heart, and send." They read incoming messages
aloud in a flat voice, then react. They change their mind mid-sentence ("Or get
rid of the 'man', sounds weird. Send."). They say "Circle, take me to…",
"Circle, open…", "Circle, like X's profile", "Circle, leave private chat".

The most-used emoji are hearts (274), laughing faces (93+59), fire (73), eyes,
heart-eyes, crying, the devil and the wink. The most-used hashtags are group
identities (#CircleFam, #GirlGang, #GirlPower, #BroCode, #CircleSisters,
#CircleHusband / #CircleWife), loyalty claims (#IGotYou, #GotYourBack,
#RideOrDie, #RealRecognizeReal) and in-jokes that belong to one pair.

### 2.5 The rhythm of an episode

From 1×01 and 1×02, which are typical:

1. The narrator-host opens cold with a joke about last night.
2. **Morning:** players wake, the host roasts them, a status-update prompt
   arrives, statuses are posted and read aloud in other apartments, likes are
   counted ("Oh, wow. I got three.").
3. **Private chats** in quick succession, cross-cut: each message is read and
   reacted to in the receiving apartment, and often gossiped about in a third.
4. **Group chat** drama: someone starts a named group ("Skinny Queens"),
   someone else takes offence at the name.
5. **A game** from the Circle, with a prize (a party, a photo, a video from
   home) and a consequence (answers are public).
6. **Evening:** a party, a ratings alert, or both.
7. **Ratings night:** each player ranks aloud with a reason per position; the
   results are revealed in **pairs from the bottom** ("Seventh and eighth…
   fifth and sixth…"); top two go to the Hangout.
8. **Hangout:** the influencers walk through the at-risk players **one by
   one, pros and cons**, while the at-risk players stew in Circle Chat.
9. **Blocking:** announced in Circle Chat with suspense ("The Player we
   decided to block is, dot, dot, dot"), then BLOCKED.
10. **Visit:** every apartment panics; the door opens; a face-to-face scene.
11. The episode ends on a cliffhanger alert.

Between these beats there is **apartment life**: cooking, working out, skin
care, dancing alone, talking to a stuffed toy, a kitchen fire (US 6, Myles was
banned from cooking). The host narrates over it. It is a large share of the
show's charm and it is also the texture that makes the isolation believable.

---

## 3. Architecture

### 3.1 Files

```
js/shows.js                 registry entry (§3.2)
js/ci-run.js                bridge to the run tab: setup → engine → commit, franchise read/write
js/ci/season.js             playCircleSeason({cast, setup, seed, bookings}) — the loop
js/ci/schedule.js           days → episodes, which days rate, block, arrive, party
js/ci/rng.js                named streams (per day, per scene, per line) so a line can't move a result
js/ci/profiles.js           profile plans, covers, honesty per fact, face catalogue lookups
js/ci/faces.js              the face catalogue data (§4.6)
js/ci/beliefs.js            what each player believes about each profile (§5)
js/ci/mind.js               emotions: loneliness, paranoia, stress, guilt, elation (§5.5)
js/ci/claims.js             claims, secrecy, provenance, leak chains, collisions (§7.5)
js/ci/chat.js               who opens which chat and why; the day's invite budget (§7.3)
js/ci/conversation.js       a chat as turns: intent → opener → replies → ending (§7.4)
js/ci/slips.js              catfish slips, probes, dodges, theories (§7.7)
js/ci/ratings.js            ballots, styles, pacts, reveal order, inference (§8)
js/ci/hangout.js            influencer deliberation (§9)
js/ci/formats.js            the blocking formats (§10), each a function of the ratings row
js/ci/blocking.js           announcement, visit, goodbye video (§11)
js/ci/arrivals.js           newcomers and their entry formats (§12)
js/ci/games.js              the game library (§13)
js/ci/parties.js            parties and apartment life (§13.4)
js/ci/powers.js             Joker, Hacker, burner, clone, antivirus, disrupter… (§14)
js/ci/finale.js             final day, meet-up, studio, reveal, Fan Favourite (§15)
js/ci/public.js             approval, fame, what aired (§16)
js/ci/script.js             scene scripts from facts (§17)
js/ci/lines/*.js            the line pools
js/ci/transcript.js         npm run ci:transcript
js/ci/export.js             votingHistory rows, appearances, ledger record (§20)
js/vp-ci/*.js               stage, screens, apartments, Circle UI (§18)
js/ci-cast-ui.js            Profile Plan on the cast cards, Photos panel (§19)
```

`js/pm/circle.js` already exists and means Perfect Match's friend circle. The
new engine lives only under `js/ci/` and never imports from `js/pm/` except
through the shared modules listed in §3.4.

### 3.2 The registry entry (draft)

```js
'the-circle': {
  prefix: 'ci', name: 'The Circle', short: 'CI', emoji: '⭕', accent: '#3fd8ff',
  venue: { label: 'The Circle', icon: '⭕' },
  runnableFlag: '_ciRunnable',
  historyFromLedger: true,
  rosterPlace: 'APARTMENTS',
  hasJury: false,
  roundsPath: 'episodeHistory',
  roundShape: 'ballots',            // ratings are ballots; no new shape, no new season_ref branch
  words: {
    player: 'player', players: 'players', round: 'Episode',
    exit: 'blocked', exitAction: 'block', exitWalk: 'left',
    challenge: 'game', comp: 'game', comps: 'games won',
    milestone: 'the final ratings',
    audienceAward: 'Fan Favorite',
    fanWords: ['ratings', 'influencer', 'blocked', 'catfish', 'Circle Chat',
               'the Hangout', 'newsfeed', 'hashtag', 'alert'],
    host: null,                     // §17.4 — the user has not chosen yet
    seasonComplete: 'The final ratings are in.',
    noExitLine: 'Nobody was blocked',
    quietRound: 'A quiet day in The Circle',
  },
  careerStats: [
    ['ci.influencerTimes', 'totalInfluencerTimes'],
    ['ci.firstPlaces', 'totalFirstPlaceRatings'],
    ['ci.blocksMade', 'totalBlocksMade'],
    ['ci.catfishSeasons', 'totalCatfishSeasons'],
  ],
  audience: { strategy: 1.2, mess: 1.2, twist: 1.3, steamroll: 0.9 },  // calibrate after play (§20.2)
},
```

### 3.3 Game state

`playCircleSeason` opens with its own `setGs({...})`, so it reads the franchise
through `js/franchise-carry.js` `carriedFor(people, cfg)` and writes through
`recordBuiltSeason` (ADDING-A-SHOW §8.3). The ledger record is built while the
inner `gs` is live, before the outer one is restored. `bonds`, `popularity` and
`relationshipDimensions` are copied back the way `pm-run.js _commit` does, but
**converted from profiles to people first** (§5.4).

Every random draw uses a named stream: `day:<n>`, `chat:<day>:<i>`,
`rating:<day>:<voter>`, `hangout:<day>`, `line:<sceneId>`. The writing layer has
its own streams, so no line can change a result. Replaying an aired episode
re-plays it; "Re-run" re-deals it with a new salt (ADDING-A-SHOW §11.5 N, O).

### 3.4 What it reuses, and what it must not duplicate

| Reuse | For |
|---|---|
| `js/relationships.js` | the only relationship store (keyed by profile handle during the season) |
| `js/franchise-carry.js`, `js/franchise-meta.js` | reading past seasons, writing this one |
| `js/avatar-registry.js` | every portrait and photo URL (§19.3) |
| `js/audio.js` | sound, through the shared engine |
| `TWIST_CATALOG` + the Season Timeline | blocking formats, games, powers (§10, §14) |
| Perfect Match's public model (approval + fame) | Fan Favorite (§16) — imported, not copied |

Beliefs, claims and emotions are new because no show has had them in this
form. They are not a second copy of anything; §11.5 Q is the rule to check
against before any new store is added.

---

## 4. Identity: people, profiles and covers

### 4.1 Three layers

1. **Truth** — who really plays a profile: one person, two people (a shared
   profile), or the AI. Real name, age, gender, sexuality, job, relationship
   status, children, hometown, alum history, archetype, the nine stats.
2. **Profile** — what everyone sees: handle, profile photo, extra photos,
   age, relationship status, bio, status updates, texting voice. A profile can
   be cloned, swapped, gifted, shared by two newcomers or given to a blocked
   player's second life.
3. **Beliefs** — each player's private picture of each profile (§5.2).

Players only ever read layer 2 and their own layer 3. Only the engine, the
audience and the Debug drawer see layer 1.

### 4.2 The Profile Plan (Cast setup)

Each player's card in the Cast tab gets a **Profile Plan** section. Every
field is optional; a blank field rolls when the season is built, and the roll
is shown back on the card so the author can keep or change it.

| Field | Values | Notes |
|---|---|---|
| Mode | Honest · Polished · Edited · Catfish · Shared · AI | §4.3 |
| Handle | text | a catfish's persona name; blank = the player's own first name |
| Face | face-catalogue id, an alum, or own portrait | §4.6, §4.7 |
| Age shown | number | |
| Job shown | text | |
| Relationship status shown | Single · Taken · Married · "It's complicated" · Solo · Very single | real bios used "Solo" and "Single. Very single." |
| Hometown shown | text | |
| Bio | text | blank = written from the persona (§17) |
| Reason | text + a reason kind | e.g. "playing as my girlfriend, she's more photogenic"; drives the visit and the goodbye video |
| Tells | list | what the cover must never touch: "doesn't know golf", "has never had a period", "doesn't know Adele" |
| Partner | another cast member | for Shared: who shares the apartment |

A **reason kind** is one of: *strategic* (hot girls get more likes — US 1
Seaburn's own words), *protective* (judged for how I look — US 1 Karyn,
"Would you have talked to me if I looked like this on my default?"),
*experimental* (a man showing emotion as a woman — Seaburn again at the
finale), *family* (playing as my mum, my dad, my sister — US 4 Parker as "Paul",
John as "Carol"; US 3 Sophia as "Isabella"), *celebrity* (§14.9) and
*second chance* (§14.7).

### 4.3 How a player decides what to show

Honesty is not one switch. For each true fact, the engine weighs **what showing
it costs in this game** against **what hiding it costs**:

- *Cost of showing* — how far the fact sets the player apart from the room and
  how that reads: a doctor reads as a threat and a know-it-all, and age is the fact
  most often changed (UK 1 Jennifer took six years off), a model reads as fake (US 1 Alana was
  blocked first for "not being who she says she is" — she was real), an older
  player reads as out of step (UK 1 Mairead, 57, played at 32; US 7 Deb, 54,
  played at 26), a parent can read as a mother figure or as not "in it"
  (UK 1 Genelle hid her motherhood), an alum carries their reputation.
- *Cost of hiding* — slip risk grows with the size of the lie; the burden grows
  with `loyalty` (an honest person carries a lie heavily — US 1 Seaburn: "it
  was terrible, and I felt the strain"); `strategic` lowers the slip risk.

All terms are proportional to stats (`stat * factor`). The result is a
per-fact plan: keep, soften, or change. The mode is a summary of that plan:

- **Honest** — nothing changed.
- **Polished** — nothing false; best photo, a bio that plays down one side
  (US 1 Alana held back the bikini photos "because I don't want girls to see me
  as a threat").
- **Edited** — one to three facts changed: job (US 5 Marvin, a chemical
  engineer, played a personal trainer; US 7 Kevin claimed to be a lifeguard),
  age, relationship status (US 1 Antonio: "Change relationship status to
  single, because I'm just trying to get them to like me"), sexuality (UK 1
  Freddie played straight), hidden alum fame.
- **Catfish** — a different face, usually a different name.
- **Shared** — two people, one profile (§14.8).
- **AI** — a profile played by the engine's own bot (§14.10).

A player's plan is chosen before Day 1 and can **move during the season**: a
catfish can confess (US 1 Sean sent her real photo to three players on Day 8,
then changed all her photos on Day 9); an honest player can start hiding
something they said too early.

### 4.4 The archetype rule, applied

The franchise rule stands: nice archetypes (hero, loyal-soldier,
social-butterfly, showmancer, underdog, goat) never scheme; neutral archetypes
may scheme only with `strategic >= 6 && loyalty <= 4`.

On this show:

- **Anyone** may be Honest, Polished or Edited, and anyone may be a
  **protective** or **family** catfish. None of those is a scheme; the lie is
  about the self, not a weapon against another player.
- **Scheme-only:** a *strategic* catfish, the Hacker's impersonation, planting
  a claim the speaker knows is false about a third player, a canary trap, a
  fake visit report (US 7 Madelyn), throwing a game on purpose.

### 4.5 Texting voice

Every profile has a **texting voice**, derived from the persona (age, region,
personality, archetype) and overridable in setup:

- emoji density and favourites; hashtag habit (none / sign-off / every line);
- capitals ("All caps. 'Babe, what? OMFG.'"), punctuation spoken or skipped,
  "LOL" vs "laugh out loud" vs "LMFAO";
- pet names ("girl", "bro", "babe", "sis", "my guy", "honey");
- length (one-liners vs paragraphs), and how fast they reply.

A catfish must write in the **persona's** voice, not their own. The distance
between the two is a slip source (§7.7). Voices are **never** built on gender
or ethnic stereotypes. What differs between voices is age, register, region
and personality, and the slip is "doesn't sound like someone who does what she
says she does", not "doesn't sound like a woman". The real show's players did
make gendered guesses ("That doesn't sound like something a man would say" —
US 2); players in the sim may *believe* that, and be wrong, but the engine never
uses it as a rule.

### 4.6 The face catalogue

`js/ci/faces.js` tags every face in `assets/guests/` by **what it shows**, not
by its folder prefix:

```js
{ id: 'fan-maddie', file: 'assets/guests/fan-maddie.png',
  presents: 'woman', age: [20, 28], vibe: ['bookish', 'warm'], look: 'glasses, long dark braids' }
```

The first pass is drafted by looking at all 84 images. The user corrects it in
the file, and the file carries a comment saying the folder prefixes are
makeover roles. A catfish's face is chosen to fit the persona's age and look,
never at random. The `look` line feeds photo prompts (§19.3) and descriptions
in lines ("the one with the braids").

### 4.7 Alumni on this show

- **Playing as themselves**, an alum arrives with their franchise record.
  Anyone who shared a season with them, or anyone the ledger links to them,
  **recognises them on sight**: "Is that Heather? From *that* season?" The
  ledger's grudges and friendships are live from Day 1.
- **Playing as a catfish**, an alum is hiding that record. Their texting voice
  and their stories still leak it: a returnee who keeps "just knowing" how
  ratings work is a slip.
- **Borrowing an alum's face** (the catfish uses an alum who is *not* in this
  season): anyone who has seen that alum before can recognise the face. A
  recognition is a big, certain belief ("That's not a 23-year-old student from
  Leeds. That's Bridgette.") and it spreads as a claim like any other.

---

## 5. What players believe and feel

### 5.1 Relationships

The shared store `js/relationships.js` holds the eight directional dimensions
(`affection`, `trust`, `strategicRespect`, `fear`, `obligation`, `resentment`,
`attraction`, `love`). During a season the keys are **profile handles**
(`@maddie→@bridgette`), because players relate to profiles. `love` stays at 0
unless a romance runs (romance is possible — US 1 Joey and Miranda kissed at a
visit; US 7 Darian and Jadejha too).

### 5.2 Beliefs

`js/ci/beliefs.js` keeps, for each observer and each other profile:

| Belief | Range | Moved by |
|---|---|---|
| `real` | 0–1, "this profile is who it says it is" | slips noticed, probes passed/failed, theories heard, recognition, photos, goodbye videos |
| `guessOf` | who they think is behind it, if they suspect | "I think Rebecca's a dude"; "I think Carol's a younger guy" |
| `threat` | 0–10 | ratings positions seen, influencer count, how many people talk about them |
| `likesMe` | −10..10 | what they said to me, what I heard they said about me, pacts kept |
| `alliesOf` | set | group chats they know about, what they've been told |
| `saidAboutMe` | list of claims with sources | §7.5 |
| `ratedMe` | guessed position | inferred from results (§8.6) |

Beliefs are **only** moved by events the observer witnessed or was told. A
test re-derives every belief change from the scene record (§11.5 D:
a character who knows more than they should).

### 5.3 The hyperpersonal effect

Research on text-only communication (Walther's "hyperpersonal" model) finds
that people who only text each other become close faster than people who meet,
and idealise each other: the sender picks their best self, the receiver fills
the gaps with their hopes. The engine models this with two numbers per
direction:

- **Warmth gain** from a good chat is higher than in a face-to-face house.
- **Idealisation** — the gap between the persona the reader imagines and the
  real person — grows with every warm chat.

At the reveal (visit, goodbye video, finale meet), idealisation decides how
hard it lands. US 1 Shubham on Seaburn: "It hurt me. It did … Rebecca, for me,
was like the sister." Then: "But talking to Seaburn, I knew he came from the
heart 100%." Whether it turns to betrayal or to respect depends on the reader's
temperament and on whether the *words* were true even if the face was not
(§5.4).

### 5.4 Converting profiles to people at the reveal

When a profile's truth becomes known to a player (visit, goodbye video, finale
meet, recognition), their feelings toward the profile are converted into
feelings toward the real person:

- **Words true, face false** (the protective catfish): affection mostly
  carries over, trust dips and recovers, `strategicRespect` rises. "The
  connection was real."
- **Words false** (the strategic catfish who lied about who they liked, not
  just who they were): trust collapses into `resentment`.
- **Flirted with under false pretences**: a separate, sharper hit, scaled by
  `attraction` and idealisation.

The converted values are what the franchise ledger records. A catfish who
fooled you carries into your next season as a grudge or as respect, depending
on who you are.

### 5.5 Emotions

`js/ci/mind.js` keeps a small set of states per player, changed by events and
drifting back toward a baseline set by stats:

| State | Rises with | Falls with | Shows up as |
|---|---|---|---|
| **loneliness** | each day alone, quiet days, being left out of a group chat | warm chats, parties, a video from home | talking to objects, oversharing, attaching fast |
| **paranoia** | bad ratings, being talked about, a goodbye video naming you, isolation | being saved, kept pacts, a real friend's reassurance | reading neutral messages as hostile, probing, pre-emptive strikes |
| **stress** | ratings nights, being at risk, a probe you can't answer | being safe, sleep | "I'm sweating", mistakes, short replies |
| **guilt** | lying to someone who is kind to you; blocking a friend | confessing; being forgiven | softer messages to the victim; confession chance |
| **elation** | becoming Influencer, a high rating, a new friend | time | overconfidence, bold moves |
| **homesickness** | days, family mentions | a video from home (a real prize, US 1) | crying, big-hearted messages |

Stats set how fast each moves (temperament damps swings, intuition feeds
paranoia's accuracy, boldness turns paranoia into action rather than
freezing). Emotions change what players choose (§7.3) and what they say
(§17), never directly who wins.

---

## 6. The day and the season

### 6.1 A Circle day

The engine runs **days**. Each day is a list of **blocks** in fixed order:

1. **Morning** — wake-up scenes, the status-update prompt, statuses posted,
   Newsfeed read, likes counted.
2. **Chats I** — private and group chats (§7).
3. **The Circle's event** — a game, a power, an arrival, a twist, or nothing.
4. **Chats II** — reactions to the event.
5. **Evening** — a party, a ratings night, a Hangout, a blocking, a visit, or
   a quiet night of apartment life.
6. **Night** — one or two late chats, a cliffhanger alert on big days.

Scene counts are targets, not caps: **70–110 beats an episode**, where a beat
is one spoken or sent line or one reaction. Perfect Match settled that number
with the user ("8–12 is nothing").

### 6.2 Days, episodes and the season template

An episode usually covers one day; big days (a rating plus a blocking plus a
visit) end on the alert and carry over into the next episode's cold open, as
the real show does (1×01 ends on "Alana is on her way to meet one of you now").

The schedule is **built from the cast**, like Perfect Match's
(`buildSchedule`), and the author can set the length. The default template for
13 players (8 at the start), from the US seasons:

| Day | What happens |
|---|---|
| 1 | arrivals, profiles, first ratings on first impressions, first Circle Chat, first blocking (US 1, US 4, US 5) |
| 2 | status updates, a game, a party; newcomer #1 secretly watches |
| 3 | ratings, blocking, visit |
| 4 | goodbye video, a game, newcomers #2 and #3 |
| 5 | ratings, blocking, visit |
| 6 | a twist or power day |
| 7 | ratings, blocking, visit; "There are no more new Players entering The Circle." |
| 8 | goodbye video, a game with a video from home as the prize |
| 9 | ratings, a double blocking |
| 10 | a game, a party |
| 11 | ratings, a super or secret influencer |
| 12 | the feast, family calls, the last Circle Chat, the final ratings |
| 13 | the finalists meet, the studio, the reveal |

Newcomers arrive only in the first two-thirds (wiki: "Over the first two-thirds
of the season, following most blockings, one or more new players will
typically enter"). The template is held equal to `buildSchedule(...)` by a
test, and tests look days up by slot (`d.slot === 'rating2'`), never by number
(ADDING-A-SHOW §16.3).

### 6.3 Per-time rates scale with days

Anything that is "per unit of time" (a confession chance, a slip, a romance
spark, loneliness) is scaled by the day, never per episode, so a longer season
does not wear lines thinner or double a rate (§11.5 F).

---

## 7. Messages, chats and how a lie spreads

### 7.1 The message

A message is the unit of the show. It records:

```js
{ id, day, chat,                       // which chat it went into
  from: '@maddie', by: ['Alejandro'],  // the profile, and who really typed it
  said: '…',                           // what the player said out loud while writing (audience only)
  sent: '…',                           // what arrived on everyone's screen
  drafts: ['…'],                       // anything deleted before sending ("Actually, Circle, delete that")
  claims: [claimId, …],                // §7.5
  intent: 'probe',                     // §7.3
  tone: 'warm' | 'flirty' | 'cold' | 'hurt' | 'joking' | 'formal',
  tags: ['#HeartOnMySleeve'], emoji: ['grimace'],
  readBy: { '@bridgette': { reaction: 'suspicious', said: '"Not fully"?! Okay…' } } }
```

`said` and `sent` are both shown. The distance between them is the show.
`readBy` holds the **reaction in each receiving apartment**, because the real
show cuts to the reader more often than to the sender.

### 7.2 Kinds of chat

| Chat | Who | Rules |
|---|---|---|
| **Circle Chat** | everyone | opened and closed by the Circle ("Circle Chat is now open"); often has a prompt; everyone is watched by everyone |
| **Private chat** | two profiles | opened by invite; "X has invited you to a private chat"; either can leave |
| **Group chat** | 3+ | named by its founder ("Skinny Queens", "Trifactor", "Messy Queens"); the name itself is a claim about who belongs |
| **Influencer Chat** | the influencers, in the Hangout | §9 |
| **Joker / Inner Circle chat** | a power holder and newcomers | §14 |
| **Newsfeed** | everyone, read-only posts | status updates, likes, goodbye videos, game results |

Players do not know about group chats they are not in unless someone tells
them. Being told "we have a girls' chat" when you were not invited is a hurt
the engine tracks.

### 7.3 Who opens which chat, and why

Each block gives each player a small budget of chat openings (2–4, fewer on
ratings nights). Players choose **intents** by utility, from their goals,
beliefs and emotions:

| Intent | Real example |
|---|---|
| **bond** — get to know someone | 1×01 Chris, Sammie |
| **ally** — propose working together | 1×01 Shubham to Rebecca: "work together in an alliance till the end. What do you think?" |
| **flirt** | 1×01 Joey to Alana: "word on the street is you are crushin' on me hard right now" |
| **probe** — test if they're real | 1×01 Alana: "how do I know you're real?"; 4×08 Bru's golf question |
| **pump** — fish for information | 1×02 Chris to Sammie: "did Alana come visit you last night?" |
| **compare notes** | the Hacker undone in US 5 when Sam and Chaz compared |
| **plant** — seed suspicion about a third player | 1×01 Rebecca: "I think Mercedeze could be fake" |
| **claim credit** — say you saved someone | 1×02 Antonio to Mercedeze: "I had your back in there" (a lie) |
| **repair** — fix a damaged bond | 1×02 Joey to Antonio: "Let's fix that" |
| **confront** | 1×02 Joey: "are you feeling like a complete d*ck right now?" |
| **cover** — a catfish keeping their story straight | 3×12 "I need to make sure I don't slip up" |
| **confess** — reveal a truth to a few | 1×08 Sean told three players she used fake photos |
| **pitch** — a ratings plan or a target | 7×06 "Rachel", Madelyn, "Gianna" plan to rank "Andy" last |
| **check in** — after a blocking or a bad rating | 1×02 "How are you holding up after last night?" |
| **canary** — tell two suspects different fake secrets (scheme-only) | ours; the real players did the informal version |

Who a player chooses to talk to is itself information: players notice who
reached out to them and who did not ("Antonio didn't even bring up anything
about last night … They're jerks."), and newcomers are courted in a race
(US 6: players compete to message the new arrivals first).

### 7.4 A conversation

A chat is a sequence of turns, each one a message. It is built as:

1. **Opener** from the intent, written in the sender's texting voice.
2. **Read-aloud and reaction** in the receiver's apartment.
3. **Reply** chosen from the receiver's beliefs and goals, which may not match
   the opener's intent (a flirt answered with a friend-zone; a probe answered
   with a dodge).
4. Two to eight turns, each with the same read-and-react loop.
5. An **ending** decided by the engine *before* any words are chosen
   (the Perfect Match lesson, `ENDINGS`): agreement, a pact, a stand-off, a
   friendly exit ("Night night." "Night night."), a walk-out ("Leave chat"),
   a cliff-hanger ("I have to ask you something. Dot, dot, dot.").

The outcome of every chat is recorded as consequences (bond, trust, a claim, a
pact, an emotion) **before** its lines are written, and the lines must agree
with it (ADDING-A-SHOW §16.4, "engine outcome vs words").

### 7.5 Claims

A claim is a small fact asserted in a message:

```js
{ id, about: '@brody', kind: 'distrusts', holder: '@maddie', value: true,
  truth: false,                       // the engine knows; the players do not
  secrecy: 'between us' | 'our chat' | 'public',
  source: { said: '@maddie', to: '@bridgette', day: 6 },
  chain: [ … ]                        // every hop it has taken since
}
```

Claim kinds: *likes / distrusts / is targeting X*, *is a catfish / is real*,
*is really a man / woman / older / younger*, *is in an alliance with*, *rated
me low*, *saved me*, *blocked X*, *said X about you*, *is the Joker / Hacker*,
*has a partner outside*, *the visit said…* and more.

A reader believes a claim in proportion to their trust in the source, the
claim's fit with what they already believe, and their paranoia.

### 7.6 Leak chains and collisions

Each time a player learns a claim about a third player they decide whether to
pass it on: to the target (to win their favour), to an ally (to warn them), or
to nobody. The weight is loyalty to the source, gain from the target, and how
juicy it is. **The source travels with it**: "Mercedeze said Antonio isn't
even a factor." The original speaker can be quoted to the person they were
talking about, and often is.

A **collision** happens when a player holds two versions of one story. It
produces a compare-notes chat or a confrontation, and it usually ends with one
of the sources losing trust. 1×02 is a clean example: Antonio told Mercedeze
"the final two was between you and Alana, and I chose Alana", meaning to earn
credit, and Karyn worked out from it that Sammie had set her up.

### 7.7 Slips, probes, dodges and theories

**A slip** is a moment where a cover shows. Kinds, each with a real example:

- *Knowledge gap* — 4×08 Alex as "Nathan", a golfer who didn't know what an
  eagle is; 1×12 Seaburn not knowing who Adele was; 2×08 Jack as "Emily" not
  knowing her own makeup brand.
- *Body gap* — 1×12 Seaburn: period cramps "on my left side".
- *Voice gap* — a persona writing out of their age or register.
- *Too perfect* — the most common suspicion in the corpus: "too good to be
  true" (16 times), "too perfect", "almost too perfect". A persona with no
  flaws raises suspicion by itself.
- *Emotional overreach* — 1×12 "Crying over a guy you just met?"
- *Name drop* — 3×13 "Ashley let 'Daddy Nick' slip in the chat."

Slip risk per message rises with how specific the topic is, stress, a party
drink, and how far the persona is from the player; it falls with `strategic`,
`mental` and preparation ("I took so many notes"). Whether the reader
*notices* depends on their `intuition` and how closely they are paying
attention to that profile.

**A probe** is a deliberate test: a question only the real persona could
answer ("Some quick trivia to see if it's really you"), a request for a
specific photo, or a trap question about a detail they said earlier. The
target answers, **dodges** ("My family loves to golf. We live near a lot of
golf courses.") or fails. A dodge is itself evidence, and the asker says so
out loud: "If he tries to distract … it's like, no, you don't forget that."

**A theory** is a belief that has gathered enough evidence to be said aloud
("Rebecca's a dude", "Carol is a younger guy"). A theory is a claim. It
spreads. It can be wrong: US 1 Alana was blocked on a theory that she was fake
and turned out to be exactly who she said she was.

### 7.8 Status updates, likes and the Newsfeed

Every morning: "Please update your status." Statuses are short, voice-driven
and revealing: a Bible verse with a halo emoji, a joke about last night's
blocking ("Rest in peace to our dead homie"), a sympathy bid ("Woke up this
morning with a stomachache"). Other players **read them aloud and judge them**,
and statuses are one of the main places a player's image is built.

Players like profiles and count likes ("Oh, I got four, yes! I didn't even
think I had four friends in this game."). Likes are a cheap, public signal of
alignment and are tracked.

### 7.9 Hashtags and in-jokes

Hashtags carry three things: identity (#GirlGang, #BroCode), loyalty
(#IGotYou, #RideOrDie) and in-jokes that belong to a pair or a group
(#TresFuego, #KnightInFreshJordans, #YeahBuddy). An in-joke is **earned**: a
pair can only use theirs after the scene that created it, and it is recorded as
a fact (§17.5). Couple labels (#CircleHusband / #CircleWife, "Gusband" and
"Wifey" in US 5) mark close pairs and are how the Hacker was caught in US 5 —
the impersonator didn't know the pet names.

---

## 8. The ratings

### 8.1 Ballots

"Players, it's time for the Ratings." Each eligible player ranks every other
eligible profile from favourite to least favourite. The default is a full
ranking (US, UK 2–3). **Star ratings** (1–5 stars, averaged, UK 1) are a
season option.

A voter's order is built from proportional terms on their beliefs about each
target:

```
score(target) = affection·a + trust·t + obligation·o + pactsKept·p
              + predictedInfluencerValue·v      // "will they save me?"
              − perceivedThreat·h − suspicion·s − resentment·r
              + noise
```

The weights are set per **rating style**, which comes from personality:

| Style | Who | What it does |
|---|---|---|
| **heart** | high loyalty | friends first, in order of warmth |
| **strategist** | high strategic | buries rivals, keeps real threats in the *middle* so the aim is hidden, lifts allies who will save them |
| **fair** | high temperament, low boldness | tries to rank "who played well", worried about looking petty |
| **safe** | high paranoia this week | ranks to avoid anyone who might be an influencer holding a grudge |
| **gut** | low strategic, high intuition | first impressions, catfish suspicion weighs heavily |

Styles are tendencies, not boxes: a heart voter still buries someone they
think is a catfish.

### 8.2 The ranking scene

Each voter ranks **aloud, one position at a time, with a reason** — this is
one of the most-watched scenes on the real show (1×01: "Circle, please put
Alana in first position. She's my favorite. She's blonde. I sound shallow.").
The reasons come from the terms that decided the position. Then "Circle,
submit my Ratings." "Ratings complete."

### 8.3 Pacts

"Put me first and I'll put you first." A rating pact is a claim with a
promise. Keeping or breaking it is decided by the ballot, and it can only be
*inferred* by the other side (§8.6).

### 8.4 The reveal

"Players, the Ratings results are in." Positions are revealed on the Circle
screen **from the bottom, two at a time** (1×01: "Seventh and eighth … fifth
and sixth … fourth … third"), and then the top two are named Influencers. Each
reveal step has reactions in every apartment: relief, fury, "I wanted to be in
the middle", "now everyone's gonna gun for me".

Some formats hide the results entirely (super influencer, instant block
without a reveal — US 4 Ep 12); some reveal only the bottom.

### 8.5 Rules at the edges

- **Ties at the top** make extra influencers: three in UK 1 Ep 6 (Freddie and
  Genelle tied for second), two joint firsts in US 1 Ep 3.
- **Newcomers** — a season option: *cannot rate and cannot be rated* (US 1),
  *rate but cannot be rated* (US 2 onward, the default), or *fully eligible*
  (UK 1 Ep 10).
- **A player who walks** before the results still has their ballot counted
  (UK 1, Genelle).
- **Final ratings tie:** won by whoever had the most first-place rankings over
  the whole season (UK 3, Natalya over Manrika).

### 8.6 Inference

Ballots are secret. After a reveal each player **infers** who ranked them
where, from their own position, the pacts they had, and what people said:

> "I came fifth. Four of them told me I was their number one. That means at
> least two of them lied."

The inference is a belief with a confidence and it can be wrong. It moves
`likesMe` and `trust`, and it drives the next day's confrontations and
compare-notes chats. This is where rating betrayals become story.

### 8.7 What is stored

Every ballot, in full, per rating. It feeds the Debug drawer, the wiki, the
betrayal ledger, the ratings reader and the next season (§20).

---

## 9. Influencers and the Hangout

### 9.1 Becoming influencer

"As the most popular Players, X and Y are now The Circle Influencers." Being
made influencer raises `elation`, lowers `paranoia` and puts a target on your
back, which the players say out loud ("Now everyone's gonna gun for me").
Influencers have immunity for that blocking.

### 9.2 The Hangout

"Please go up to the Hangout to discuss your decision." The influencers walk
up to a room with snacks and a drink ("Is this a martini?"), toast each other,
and talk through the Influencer Chat on facing screens.

The deliberation follows the shape seen in every season:

1. **Toast and nerves** — "Cheers, sis."
2. **Walk the list** — one at-risk player at a time, each influencer gives
   pros and cons (1×01 Sammie: "My pros for Chris is that he seems personable
   … He's definitely someone I want to keep"). What they **send** and what they
   **say aloud** differ: "If I had to block someone I didn't like, it would be
   Chris. But Chris isn't a threat right now, so we have to be strategic."
3. **Narrow to two**.
4. **Negotiate** — each influencer has a private ranked list of who they'd
   block. Offers alternate: agree; protect an ally; trade ("save mine now,
   yours next time"); push a threat; sacrifice a weak link; dig in. Who gives
   way depends on boldness, temperament, obligation and how the two feel about
   each other. The influencer who goes along notices it ("I'm the Influencer
   influencing the Influencer").
5. **A pact** is common here (1×01: "I'll do it on one condition. We protect
   each other.").
6. **Who announces** — one of them volunteers or is volunteered.

Both influencers' **reasons** are recorded, because they come back: the
announcement quotes one, the visit asks for it, and the goodbye video answers
it.

### 9.3 Meanwhile

The at-risk players are in Circle Chat, and the real show cuts to them between
Hangout turns: nerves ("Girl, I am shaking in my space boots"), pleas, a
resignation that's really a bid for sympathy ("I think I'm the one going …
Best of luck with this game"), and private "please" messages where the format
allows them.

### 9.4 The announcement

"The Influencers have made their decision." "All Players must go to Circle
Chat." The announcing influencer types slowly with suspense built into the
message ("The reason we picked this Player is because … we don't think they
are who they say they are." "The Player we decided to block is, dot, dot,
dot."). Every apartment reacts; the blocked player's reaction gets the longest
shot. "X has been blocked from The Circle." Their tile goes dark on every
screen.

---

## 10. Blocking formats

Every format is a `TWIST_CATALOG` entry (`category: 'blocking'`, `ciFormat`,
`ciSlots`) booked on the Season Timeline, the way Perfect Match books its
dumping formats. Seasons draw them by slot; the author can pick any. Each is
told to the players by the Circle in its own words, on screen, before it
happens (ADDING-A-SHOW §16.4, "a rule the viewer is never told").

| Format | How it works | Source |
|---|---|---|
| **Standard** | top two influencers block one in the Hangout | every season |
| **Sole influencer** | the top player alone | US 3 Ep 1, UK 3 Ep 1 |
| **Three-way tie** | three influencers must agree | UK 1 Ep 6 |
| **Save two each** | influencers save two each in Circle Chat, in front of everyone; the unsaved player is blocked | US 1 Ep 7 |
| **Save then plead** | influencers save two each; the last two plead face to face; influencers block one | US 4 Ep 10 |
| **Save one first** | each influencer saves one before the Hangout; they block from the rest | US 5 Ep 4, US 2 (Terilisha and Savannah) |
| **Antivirus** | the newcomers hold antivirus and pass it on; each receiver passes it again; whoever never gets it is blocked (the season chart marks it SAVED FIRST … SIXTH) | US 4 Ep 8–9 |
| **Instant block** | the lowest-rated is blocked at once, sometimes with no visit | US 1 Ep 9 (Bill), UK 1 Ep 10, 17 |
| **Double block** | instant then influencer; each influencer blocks one; or the bottom two go at once | US 1 Ep 9, US 3 Ep 9, US 2 Ep 8 |
| **Super influencer** | the top player alone; ratings hidden; may have to block in person, or visit the blocked player's apartment | US 1 Ep 10 (Joey), US 4 Ep 12, US 7 Ep 12 |
| **Secret influencers** | influencers act without anyone knowing who they are | US 3 Ep 10, 12 |
| **Public super influencer** | the audience picks the super influencer (§16) | UK 2 Ep 17 |
| **Room vote** | the bottom two are named; everyone else votes in public | UK 1 Ep 15 |
| **Forced statement** | before the ratings, everyone must say publicly who they would block; the top-rated's statement becomes the block | US 5 Ep 1 |
| **Most Human** | players rank each other from most to least human; the top player blocks alone | US 6 Ep 3 (with the AI twist, §14.10) |
| **Ride or Die** | secret compatibility pairs share a fate; the lowest pair must choose who sacrifices | US 6 Ep 7–9 |
| **Block each other** | the influencers are offered the chance to block each other first | UK 3 Ep 16 (they declined) |
| **Secret mission** | one player must get a named target blocked, or be blocked themselves | UK 3 Ep 8 |
| **Egg twist** | two anonymous newcomers; the room votes which one stays; the other is blocked at once | UK 2 Ep 16 |
| **No blocking** | a disrupter power or immunity cancels it | US 7 Ep 1 |

The formats obey the same pacing rules as Perfect Match's: a season must be
able to lose the players it needs to on the nights it has (ADDING-A-SHOW
§16.3), and formats that remove two players need the season to have room for
them.

---

## 11. After the block

### 11.1 The visit

"Before X leaves, they can meet one Player." "Think about who you would like to
meet."

The blocked player **thinks aloud about the candidates** (every season does
this scene): the friend who stood by them, the influencer who blocked them, the
one they think is a catfish, the one they owe an apology to. The choice is
made by motive weights:

| Motive | Weight grows with |
|---|---|
| **friend** — say goodbye | affection |
| **answers** — "why did you block me?" | resentment toward an influencer |
| **truth** — see if they're real | suspicion |
| **apology** | guilt |
| **warning** — hand over a secret or a power | loyalty, a power to give |

Some formats set the rule instead: "You must meet the player you think
deserves to win" (US 2 Ep 4).

"X is on their way to meet one of you now." **Every apartment reacts** —
getting dressed, cleaning up, rehearsing blame ("If she came in here pissed
off, I'm just gonna say it was Sammie's fault"), and the catfish most of all
("This could be the moment that we get figured out"). The door opens on one of
them.

The visit is a real face-to-face scene with its own beats:

1. **Recognition** — "Are you Mercedeze?" / "You're real!" / "My man!" (two
   catfish meeting — US 1 Alex and Seaburn).
2. **The question** — "Why did you block me?" / "Are you real?" / "Who is
   Mercedeze?"
3. **The explanation** — a catfish explains why, in their reason kind's words
   ("Would you have talked to me if I looked like this on my default?").
4. **Real name and age.**
5. **Exchange** — the blocked player hands over what they know: who they think
   is fake, who said what. Sometimes a power (US 2: Savannah gave Courtney the
   Inner Circle; US 3: Calvin gave Nick a burner profile).
6. **Goodbye** — a hug, sometimes a kiss (US 1 Miranda and Joey; US 7 Darian
   and Jadejha).

The visited player now holds **private true knowledge**. They choose whether
to share it, keep it, or **lie about it**. US 7 Madelyn told the room that
Heather had named someone disloyal during her visit; it was invented, and it
steered the next blocking. A visit report is a claim like any other.

The visit is skipped when a format says so (US 1 Bill, instant block).

### 11.2 The goodbye video

The next day: "X has left a message for The Circle." The scene has a fixed
shape, taken from every goodbye in the corpus:

1. **Guessing before playing** — "It's gotta be a guy. It has to be a guy."
2. "Circle, play X's video message."
3. **Greeting and reveal** — "Hey, everybody, it's Alana here … I'm definitely
   who I said I was." / "It's me, Mercedeze. Well, it's me, Karyn."
4. **Why** — the reason kind, in the player's voice.
5. **Grievance, lesson or warning** — "the real snake was not taken out of the
   game … if someone tells you that they have your back, I wouldn't believe
   them" (US 2 Savannah); "I think a lot of it was phony" (US 1 Bill).
6. **Good luck.**
7. **Reactions in every apartment** — guilt ("This has got me feeling bad"),
   vindication ("I knew it!"), fear of what was said.

The warning is a **claim with the goodbye's weight behind it**. If it names a
player, that player has a bad next day. Every goodbye reveals the truth to
everyone, so every player's beliefs about that profile convert (§5.4).

---

## 12. Newcomers

### 12.1 When

After most blockings in the first two-thirds of the season. "A new Player has
entered The Circle." A newcomer is immune at their first blocking; whether
they rate or are rated follows the season's newcomer rule (§8.5). The last
arrival day ends with "There are no more new Players entering The Circle."

### 12.2 How they arrive

Each is an entry format on the timeline:

| Entry | Source |
|---|---|
| **Snoop and choose** — build a profile, secretly watch Circle Chat during a party, invite one player to a private after-party | US 1 Ep 2 (Miranda) |
| **Date with one of three** — pick one of three players for a dinner date and a gift | US 1 Ep 5 ("Adam" chose "Rebecca", sent a giant teddy bear) |
| **Invite one by one** | US 3 Ep 6 (James) |
| **Race to message** — the others compete to reach the newcomer first | US 6 Ep 6 |
| **Throw a party** — each newcomer throws a mandatory party; who attends which is noticed | US 4 Ep 7 |
| **Lurk silently** — the newcomer watches a game before anyone knows they exist | US 7 Ep 2 |
| **Chosen by the influencers** from two or more offered profiles | US 4 Ep 1, US 6 Ep 1 |
| **Chosen by the public** | UK 2 Ep 4 |
| **Arrive as a pair** — two newcomers get a private chat before joining | US 3 Ep 3 ("Isabella" and "Jackson") |

### 12.3 Newcomers and originals

Newcomers start with no bonds and a lot of attention. Originals court them for
votes. A newcomer bloc is possible and dangerous: US 5's "Newbie Revolution"
(Sasha tried to unite the newcomers) got its founder blocked next, because the
originals had already bonded. The engine lets a newcomer try it and lets the
room punish it.

---

## 13. Games, parties and apartment life

### 13.1 What a game is for

The show's creative director, Tim Harcourt: "some games were really good for
bonding them, some were really good for them learning about each other, some
were good for testing who's a catfish, some could have been more divisive."
Every game here carries one of those four **purposes**, a **prize**, and a
**consequence**. Answers are public ("of course, we want everyone in
everyone's business, so they'll all know how each other voted" — the host,
1×01).

Prizes on the real show: a party, a new profile photo, a video message from
home, immunity, the power to pick a newcomer, a gift to another player, extra
followers. Consequences: answers become claims, suspicion lands on someone, a
team bonds, a rival is named in public.

### 13.2 The game library

All of these are real games from the transcripts and season articles. Each
becomes one entry in `js/ci/games.js`, with rules the Circle reads out, the
scoring and the consequence.

| Game | Purpose | How it works | Source |
|---|---|---|---|
| **Ice Breaker** | learn | agree / disagree with statements; everyone sees who said what | US 1 Ep 1 |
| **Who Dis?** | bond | describe a celebrity without naming them; everyone guesses; the better the room does, the better the prize | US 1 Ep 2 |
| **Ask Me Anything** | learn / divide | anonymous questions posted publicly, answered by the player asked | US 1 Ep 3 |
| **Nailed It / Failed It** | bond | 30 minutes to copy a cake; voted on | US 1 Ep 4 |
| **Hashtag This** | learn | post a photo; the others give it a hashtag | US 1 Ep 5 |
| **Trivia Night** | bond | two captains pick teams; winners get a video from home | US 1 Ep 7 |
| **Portrait Mode** | divide | paint an assigned player in 30 minutes; revealed | US 1 Ep 8 |
| **State Your Case** | divide | name your biggest rival and say why you deserve to win over them; they reply | US 1 Ep 10 |
| **Most Likely** | divide | "most likely to…" statements answered with names, in the open | US 1 Ep 11 |
| **Says Who** | catfish test | anonymous facts; guess whose they are | US 2 Ep 1 |
| **Poetry Slam** | divide | the at-risk players write a poem in 15 minutes to be saved | US 2 Ep 2 |
| **Truth or Dare** | divide | at "Circle Fest"; truths are public | US 2 Ep 3, US 5 Ep 3 |
| **Two Faced** | learn | post a naughty and a nice photo with hashtags | US 2 Ep 5 |
| **Batter Up** | bond | make an animal out of pancakes | US 2 Ep 6 |
| **Glammequins** | bond | decorate a mannequin head; judged | US 2 Ep 7 |
| **Don't @ Me** | catfish test | anonymous questions to named players; knowledge gaps show | US 2 Ep 8 |
| **Geek Chic Quiz** | bond | team trivia | US 2 Ep 9 |
| **Democracy Day** | divide | vote who gets a gift | US 2 Ep 10 |
| **The Circle Awards** | divide | vote for category winners, then an after-party | US 2 Ep 11 |
| **This Is Me** | learn | tell the story behind a photo | US 3 |
| **Flashback Photos & Quiz** | learn | childhood photos and questions; a party invite as the prize | US 3 |
| **Honest Reviews** | divide | anonymous reviews of each player | US 3 |
| **Head to Head** | divide | diss-track battle between two players | US 3 |
| **Bake for Your Bestie** | bond | bake for your closest Circle friend; reveals who picked whom | US 3 |
| **Circle of Fortune** | learn | a spinning wheel of questions | US 3 |
| **Circle Yearbook** | divide | vote categories (Class Hottie, MVP…) | US 3 |
| **Been There Done That** | learn | yes / no on experiences | US 4 Ep 1 |
| **Roast** | divide | roast each other; a guest comic reads them | US 4 Ep 6 |
| **Paint the Player** | divide | paint another player; two painted the influencers as snakes | US 4 Ep 11 |
| **Who Are You?** | learn | multiple-choice questions about themselves | US 5 Ep 1 |
| **Talk Flirty to Me** | bond | flirting game; ends in a virtual date | US 5 Ep 2 |
| **Single Pringles** | learn | write a dating profile for another player | US 5 Ep 4 |
| **Let's Get Quizzical** | bond | two teams choose categories | US 5 Ep 7 |
| **For Real For Real** | learn | yes / no on moral questions | US 6 Ep 1 |
| **Rap It Up** | divide | write a rap about another player | US 6 Ep 2 |
| **I'm Only Human** | catfish test | tell a joke, read an emotion, solve a problem; ranks who is human | US 6 Ep 3 |
| **Poor-Traits** | divide | anonymous portraits of each player's worst trait | US 6 Ep 5 |
| **It's Personal** | bond | anonymous either/or answers; matching pairs become secret Ride or Dies | US 6 Ep 7 |
| **Circle Scenarios** | divide | most/least likely to end up in a situation | US 6 Ep 8 |
| **Naughty and Nice** | divide | two photos, voted naughtiest and nicest | US 6 Ep 9 |
| **Oh, We Are Going There** | divide | anonymous hard questions | US 6 Ep 10 |
| **Night of Endless Heartbreak** | divide | send one gift; the givers are revealed | US 6 Ep 11 |
| **Risky Quizness** | learn | yes / no on risky things you've done | US 7 Ep 1 |
| **Throwback Thirsty** | bond | post your steamiest old photo; emoji reactions | US 7 Ep 2 |
| **Kray Pop** | catfish test | pop-culture quiz; wrong answers named | US 7 Ep 3 |
| **Make Out, Marry, Murder** | divide | pick one player for each, anonymously | US 7 Ep 5 |
| **Wild Cards** | divide | give each player a tarot card with a stereotype ("tea spiller", "gentle catfish") | US 7 Ep 6 |
| **G.O.A.T.** | divide | paint another player as a goat with a superlative | US 7 Ep 8 |
| **#CircleAMA** | divide | hard anonymous questions to each player | US 7 Ep 9 |
| **Pick 3** | learn | pick the three things you can't live without | US 7 Ep 10 |
| **It's Giving Awards** | divide | anonymous award votes | US 7 Ep 12 |

The two "paint" games are one engine with a different result; so are the four
award / yearbook / superlative games. Quizzes that need real-world trivia
(Who Dis?, Kray Pop) draw from a small **in-universe** pool, never real
celebrities or real places, the same rule as World Tour's challenges.

### 13.3 How a game plays out

A game is a set of rounds; each round has the Circle's prompt, each player's
**answer said aloud and then sent**, reactions in other apartments, and a
**consequence per answer** (a claim, a suspicion, a bond, a laugh). 1×01 Ice
Breaker shows the pattern: "It's okay to pee in the shower" — Sammie agrees,
the rest disagree, and three players conclude out loud that Sammie might be a
man. The game ends with the prize alert and the prize scenes (choosing a new
photo from private albums, a party, a video from home).

### 13.4 Parties

Parties are themed nights with props delivered to every apartment ("We got
pizza. Yeah, buddy!", glasses, wigs, glitter). Players dance alone, play games
in Circle Chat (Never Have I Ever in US 1 Ep 2), post party photos and judge
each other's. Real themes: welcome party, 90s party, glam party, Circle Fest,
wedding party, zombie pep rally, camping trip, "Animal Instincts".

Party effects: guard down (slip risk up, flirting up, leaks up, more honest
answers), loneliness down, a newcomer often watching.

### 13.5 Apartment life

Between chats the real show fills time with players alone: cooking badly,
working out on a small treadmill, long skincare routines, talking to a stuffed
animal, singing, a kitchen fire. These scenes:

- make isolation visible (loneliness goes up on quiet days, and it shows);
- give the host most of their jokes;
- are always tied to the player's persona and stats, never generic, and never
  about something the player could not plausibly be doing.

Each player has a small set of **habits** drawn from their profile (a skincare
routine, a workout, cooking, reading, praying, a toy they talk to), which recur
across the season so the audience learns them.

### 13.6 Video messages from home

A prize and a late-season ritual (US 1, US 4, US 6, US 7): a short message from
a family member or a partner. It sharply drops loneliness and homesickness and
often loosens a catfish's cover ("Hey, babe" to camera, a partner the profile
said did not exist).

---

## 14. Powers and twists

Each is a `TWIST_CATALOG` entry with its full lifecycle: how it is handed out,
when it is revealed to the room, what it can do, how it ends.

### 14.1 The Joker / the Inner Circle (US 2)

Given by a blocked player at the visit. The holder goes to a secret room,
plays a second, anonymous profile ("The Joker"), meets the next newcomers
**before** anyone else, and picks one of the next influencers. The newcomers
may work out who the Joker is (US 2: Khat did, and told Mitchell).

### 14.2 The Hacker (US 5)

Given the same way. The holder impersonates one player in one private chat,
saying whatever they like as that player. The room is told afterwards that
"there has been a Hacker". Undone by compare-notes chats and by private
details the hacker didn't know (US 5: pet names).

### 14.3 The burner profile (US 3)

A blocked player gifts someone a second profile. The holder plays both. The
burner is deactivated the moment its owner is exposed (US 3: "Vince").

### 14.4 The clone (US 3, UK 3)

Blocked players take the name and photos of an existing profile. The room
votes which one is real; the one voted fake is blocked. The room can get it
wrong: US 3 voted out the original Michelle.

### 14.5 Antivirus / Data Breach (US 4)

See §10. The newcomers pass antivirus; it spreads by choice; whoever never gets
it is blocked. Every pass is public and becomes a loyalty record.

### 14.6 Disrupter Mode (US 7)

"First to respond" alerts. The first player to reply wins an unknown effect:
immunity that cancels a blocking, invitations to a newcomer's party, a profile
swap until the next blocking, or the right to name one influencer. Being
first rewards attention, not popularity.

### 14.7 Second chance / shared return (US 2, US 5, UK 2)

Two blocked players are offered a way back as one new shared profile ("John",
a 64-year-old psychic; "Jennifer", a 51-year-old dog trainer; "Joyce", picked
by the public). They play as a pair from one apartment (§14.8).

### 14.8 Shared profiles

Two people, one apartment, one keyboard: Ed & Tammy (son and mother, US 1),
the Capra sisters (US 3), Jamie & Millie (father and daughter, UK 3), the
twins (UK 2), second-chance pairs. Every decision is a **negotiation between
two people**, and they argue out loud about what to send. The shared
profile's messages are a blend of both voices; its slips come from either.
On the stage they get two portraits (§18.3).

### 14.9 The celebrity profile (US 4, UK 2)

A famous player plays in secret with a mission. US 4: the Spice Girls played
"Jared"; if the room did not identify them the prize went up by $50,000. UK 2:
Richard Madeley played "Judy" with the task of becoming the most unpopular
player. On this engine the celebrity is **a franchise legend** — a past winner
from another show — playing secretly, not competing for the win. The room
votes on who it is; the prize and the ratings take the consequence.

### 14.10 The AI player (US 6)

A profile played by the engine's own bot ("Max" in US 6: trained on past
episodes, profile of a 26-year-old veterinary intern with a dog photo). It is
written with its real strengths and weaknesses from the transcript: very good
at hashtags, refuses to be mean ("a moral code"), cannot flirt, gets stuck on
very human questions ("what did you have for breakfast"). It comes with the
**Most Human** rating (§10) and leaves when exposed.

### 14.11 Ride or Die (US 6)

"It's Personal" answers make secret compatibility pairs. A pair shares a fate:
if one is blocked, so is the other, unless one sacrifices themselves. Later,
the top player's Ride or Die becomes a secret second influencer. The pairs
dissolve before the final.

### 14.12 The profile swap (US 7)

Two players swap profiles until the next blocking, each playing the other's
persona to everyone else.

### 14.13 Immunity to give away (UK 2)

A departing or rewarded player gives immunity to someone for the next
blocking. Who they choose is public.

### 14.14 Missions

Secret tasks with a reward or a penalty: get a named player blocked or be
blocked (UK 3); win followers in a team mission (US 5); stay undetected
(§14.9).

---

## 15. The finale

The final day, in the order the real finales use:

1. **Goodbye videos** from the last blocking.
2. **The feast** and **family calls or videos** (US 4, US 6, US 7).
3. **The last Circle Chat**: "Before the winner is revealed, you are invited to
   one last Circle Chat." Players toast, thank, and campaign one last time.
4. **The final ratings.** "Players, you must now make your final ratings."
   Each finalist ranks aloud, and decides — in the words of the US 3 article —
   whether to vote "strategically or with their hearts". The ballot model
   (§8.1) adds a **"deserves it"** term for the finale: how well each player
   played, as the voter sees it.
5. **The meet.** Finalists arrive one by one in a room where the others are
   already waiting. Each arrival is a reveal with its own reactions ("Thank God
   you're real"; "I'm so glad you're a catfish"; a catfish explaining why;
   "the connection was real"). Each pair that was close gets a short scene.
6. **The toast.**
7. **The studio.** The host with the blocked players on the couches, asking
   them about the game; then each finalist is called up, interviewed, shown a
   **"receipts" tape** of their best and worst moments from the season (real
   scenes pulled from the record, the way Perfect Match builds its couple
   films), and asked what they would do with the money.
8. **The reveal.** "In fifth place…" — from fifth to first, each with a Circle
   beep. The winner is the highest average. A tie is broken by the most
   first-place rankings across the whole season (UK 3).
9. **Fan Favorite**, from the public (§16).

Receipts are built from what aired and must quote the player's own lines.
Slips make the best receipts (1×12: "the worst cramps … left side", "Honey,
that's Adele").

---

## 16. The audience

The public model is Perfect Match's: **approval** (−100..100, what the public
thinks of you) and **fame** (how much you've been on screen, never falls).
Both move only on what **aired**. The Circle-specific inputs:

- being funny in your apartment, and being warm to someone in trouble;
- catfishing — the public likes a protective catfish more than a strategic one,
  and likes a catfish who owns it at the reveal;
- a public betrayal (breaking a pact that the audience saw), a false visit
  report, a cruel game answer;
- being wrongly suspected and blocked (sympathy — US 1 Alana);
- screen time as a newcomer.

**Fan Favorite** is the audience's pick at the finale. In seasons that use
them, the public can also **choose a newcomer**, **choose the super
influencer** or **decide a second chance** (UK 2).

Players never read public approval. Their decisions read beliefs only
(`tests/ci-ledger-readers.test.js` enforces this, the same guard Perfect Match
has).

---

## 17. The writing layer

### 17.1 Scripts, not templates

Lines are **scene scripts** picked by facts, rendered by `js/ci/script.js` from
its own rng stream: a line of staging at most, then real dialogue. Speakers are
slots (`{a}`, `{b}`, `{handle}`); names are never written into a pool.

### 17.2 The two layers of every message

Every message scene renders both:

- what the player **says aloud** while writing (their real voice, their real
  plan — shown to the audience);
- what they **send** (the persona's voice — shown on the screen), including the
  dictation ritual ("Message: … dot, dot, dot … send").

Readers get their own line: the message **read aloud** in the receiving
apartment, then the reaction.

### 17.3 Cross-cutting

A message rarely plays alone. The script can cut to **two or three other
apartments** for reactions to one message, one status, one ratings step or one
goodbye video, the way the real show does. The number of reactions is a
per-scene budget so a big moment gets more and a small one gets none.

### 17.4 The host

A comic narrator-host (the user's choice, identity undecided — one config
slot: name, portrait, voice notes). The host:

- opens every episode cold, introduces the day, and bridges scenes ("Meanwhile,
  Shooby's ready to private chat one of the boys");
- talks over apartment life with jokes **from the situation** ("As Chris's
  poster becomes the straightest thing in his apartment…", "He's not gonna put
  that in his mouth, is he?");
- runs the studio finale.

About one host line every four to six beats, never over a serious moment
(a blocking reaction, a confession, a breakdown).

### 17.5 Facts that gate lines

Lines may only say what the record supports:

- `known` (they have talked before), `metDays`, `sharedChat`, `inJoke`
  (an earned hashtag), `pact`, `savedMe`, `blockedFriend`, `visitedBy`,
  `sawGoodbye`, `suspects`, `recognised`.
- A line about an earlier moment is gated on the fact for it (ADDING-A-SHOW
  §16.4, "invented past"). "Remember the pancakes?" only after Batter Up.
- A player can only mention a claim they hold, and only quote someone who
  said it to them (§11.5 D).
- A catfish's *sent* lines are in the persona's voice and must not use the
  real player's facts; their *said* lines are their own.

### 17.6 English: the rules every pool is checked against

These come from the user's corrections on earlier shows and from the
transcripts.

1. **Dialogue, not description of dialogue.** Write the words people say.
2. **Fluent, not clever.** Real players talk plainly: "Honestly?", "I'm not
   gonna lie", "Girl, no shade", "Let's fix that." No meme constructions, no
   epigrams, no sting at the end of every scene. A beat says what someone does
   next.
3. **The idiom must be right.** Read every line aloud. A near-miss idiom ("Don't
   tell how should I feel") is worse than a plain sentence.
4. **No jokes that need decoding.** If a reader has to work out what a line
   means, say the plain thing.
5. **Every question gets an answer** in the scene, or a reason it doesn't.
6. **Nothing the engine did not decide.** The words follow the recorded
   outcome.
7. **Real texting, really spoken.** Punctuation and emoji are dictated the way
   players do it ("question mark", "heart emoji", "hashtag…"), and the sent
   text shows the result.
8. **American English by default** (the Netflix seasons are the model), with a
   UK-season option; regional words go through the speaker's dialect slots, as
   on Perfect Match.
9. **No slurs, no stereotypes as mechanics.** Players may say rude, funny,
   human things; the engine never builds a rule on gender, race or sexuality.

`tests/ci-lines.test.js` carries a CLEVER list, a regional-word guard, an
other-show vocabulary guard ("house", "villa", "tribe" are other shows'
words) and a pronoun guard, the same guards Perfect Match's pools pass.

### 17.7 Volume and repetition

Target pools (first pass): chats ~600 scenes across intents, ratings reasons
~250, Hangout ~150, visits ~120, goodbye videos ~80, status updates ~300,
apartment life ~200, games ~15 per game, host ~400. Repetition is measured
per kind (plays per season, distinct lines used, worst repeat of one line) and
the guard halves a line's weight for each earlier use.

---

## 18. The screens

### 18.1 The approved direction

`circle-stage-v3` (brainstorm mockup, 2026-09-29) is the reference: the real
Circle interface (icon rail, glass message cards with ringed avatars and bold
uppercase names, blue glowing hashtags, a participant grid, the white input
bar and the paper-plane send button) on a navy-to-violet gradient behind the
aurora ring; ALERT! with a ring that draws itself, a shockwave, a flash and an
RGB glitch; the whole building lighting up apartment by apartment; players as
apartment-cam cards; the says-aloud / sends dialogue box; the camera pushing
toward the TV while a player dictates; the send beam; the colour wipe between
apartments. It will be committed to `mockup/mockup-ci-stage.html`.

### 18.2 Apartments with personality

The user asked for more personality in the apartments. Each apartment is built
**from its player**:

- **Palette and pattern** from archetype and stats (a villain's room reads
  moody, a social butterfly's reads loud).
- **A neon sign** with the player's own hashtag or catchphrase, lit once they
  have one.
- **A photo wall** of their profile photos; it grows when they earn a new one.
- **Their habits** show up as props of light and colour: a gym corner glow, a
  kitchen strip light, a reading lamp.
- **Mood lighting** reacts to the game: dimmer after a bad rating, party
  lights on party nights, a red wash when they are at risk.
- **A catfish's apartment shows both lives**: the room carries the real
  person's decor while the TV shows the persona.
- **Shared apartments** show two cam cards.

All scenery is built from light, colour and pattern, never drawn objects (the
user's standing rule). Real light and dark themes with a toggle.

### 18.3 Stage kinds

| Stage | Used for |
|---|---|
| **Apartment (VN)** | private chats, reactions, apartment life, dictation |
| **Circle UI, full screen** | Circle Chat, group chats, the Newsfeed, games' public boards |
| **Split / cross-cut** | a message landing, a status read in three rooms, the goodbye video reactions |
| **ALERT** | every alert, with the building cascade on big ones |
| **Ratings** | each voter's ranking screen, then the reveal from the bottom in pairs, portraits flying into slots, the influencer crown |
| **Hangout** | two influencers facing each other on screens, drinks, pros and cons cards |
| **Blocked** | the BLOCKED screen, the tile going dark in every grid |
| **Visit** | a real room: the door, the face-to-face scene (the only time two players share a frame before the final) |
| **Goodbye video** | the video on each TV, with guesses before and reactions after |
| **Game board** | per game |
| **Party** | party lights, props, the dance, party photos judged |
| **Finale meet** | arrivals one by one |
| **Studio** | the host, the couches, the receipts tape, the reveal |

One click is one spoken or sent line. Every screen has the live sidebar
(relationships and suspicions visible; audience numbers in the Debug drawer),
gated by the reveal state so it never spoils ahead (ADDING-A-SHOW §6.5). Sound
goes through `js/audio.js`: the ALERT sting, message chimes, typing, the
ratings drumroll, the BLOCKED sound, party music from the user's library.

---

## 19. Setup and the Circle tab

### 19.1 Cast tab

The cast cards gain the **Profile Plan** (§4.2), with a dice button per field
and a preview of the persona's profile as the other players will see it.
Alumni cards show who in the cast would recognise them.

### 19.2 Season options

Length (auto from cast, or set), newcomer rule (§8.5), rating style (ranking
or stars), catfish share (how many blank plans roll Catfish), finalists
(4 or 5), Fan Favorite on/off, US or UK language. Blocking formats, games,
powers and arrivals are **Season Timeline cards**, never a separate picker
(the user's rule from Perfect Match: "there's already a schedule system,
adapt it").

### 19.3 The Photos panel

Photos are uploaded **inside the website** so anyone on GitHub Pages can use
it:

1. Setup lists **every photo slot** the season needs: each profile's first
   photo, the photos they will earn (per game prize and party), goodbye-video
   stills, the finale meet. Each slot shows **who, what the photo should show,
   and a ready-made prompt** built from the persona and the face catalogue's
   `look` ("Maddie, 23, glasses and long dark braids, mirror selfie in a
   bookshop, warm light"), with a copy button.
2. The user drops images **onto a slot**, or drops **a batch** anywhere: files
   named by slot number (`07-maddie-profile.png`) go to their slot; the rest
   can be dragged where they belong.
3. Images are square-cropped and shrunk in the browser (the Casting Studio's
   pipeline) and stored in IndexedDB under the season.
4. **Export season pack** writes the photos into the season file, so another
   person can import it and see the same faces. The owner can also publish a
   pack through the Studio cloud backend.
5. **Empty slots fall back** to the face catalogue or the portrait. A season
   never waits on art.

All photo URLs go through `js/avatar-registry.js`.

---

## 20. On the rest of the site

### 20.1 Export

`votingHistory[]` rows, stamped `format: 'the-circle'`, one per rating:

```js
{ episode, day, format: 'the-circle', slot: 'rating3',
  houseAtStart: ['@maddie', …], people: { '@maddie': 'Alejandro', … },
  ballots: [{ voter: '@maddie', order: ['@bridgette', …] }],
  results: [{ profile: '@bridgette', avg: 1.8, place: 1 }, …],
  influencers: ['@bridgette', '@brody'], formatId: 'save-two-each',
  saves: [{ by: '@bridgette', saved: '@heather', order: 1 }],
  eliminated: 'Alejandro', exits: [{ name: 'Alejandro', profile: '@maddie', verb: 'blocked', channel: 'influencers' }],
  visit: { by: 'Alejandro', to: 'Bridgette', revealed: ['@maddie'] } }
```

`roundShape: 'ballots'`, so no new shape and no new `season_ref.html` branch;
the normalisers learn the `ballots` / `results` fields.

### 20.2 The ratings reader

A `signals: 'circle'` entry in `js/ratings.js`: rating betrayals, catfish
reveals, the visit, the goodbye warning, twists. Wired only after a season has
been played (ADDING-A-SHOW §2.5), then calibrated.

### 20.3 Social pack, wiki, awards

A Circle social pack (`js/social/packs/the-circle*.js`) — fans react to what
aired, in this show's words (the recurring bug class in `CLAUDE.md` is one show's
vocabulary printed over another). Wiki and awards read the export. Career stats
from the registry.

### 20.4 The franchise ledger

Written through `recordBuiltSeason` with **people, not profiles** (§5.4):
alliances, betrayals (a broken rating pact the victim inferred, a block of a
friend), catfish reveals (with the reader's converted feeling), romances,
visits.

---

## 21. Tools and calibration

### 21.1 `npm run audit:ci-spec`

A hundred seasons, each measurement printed beside its real-show target:

| Measurement | Target (from §2) |
|---|---|
| players per season / blockings / days | 10–14 / 6–8 / 11–15 (US template) |
| catfish share of the cast | ~⅓ |
| catfish winners | ~50% of seasons (5 of 10 real) |
| catfish caught before the final (by visit, goodbye or confession) | most, not all |
| players who were influencer 3+ times | some (US 1 Shubham: 4) |
| wrong theories that got a real player blocked | happens (US 1 Alana) |
| rating betrayals inferred / confronted | several a season |
| visits that reveal a catfish | a meaningful share |
| newcomers who reach the final | some (US 4 "Imani" arrived on Day 7 and came second) |
| lines: plays vs distinct vs worst repeat, per kind | §17.7 |

### 21.2 `npm run ci:transcript`

`CI_SEED=n CI_CAST=13 npm run ci:transcript` → `transcripts/ci-season-<seed>.txt`
(gitignored): every scene, both message layers, every reaction, the host,
every ballot. **Reading one full season after every large change** is the main
quality tool, the lesson of the fifth show (ADDING-A-SHOW §16.1).

---

## 22. Build order

Each plan leaves the site working.

1. **Plan 1 — engine.** Registry entry, setup scope, runnable flag, dispatch;
   profiles, beliefs, claims, chats, ratings, Hangout, standard blocking,
   visit, goodbye, newcomers, finale; `audit:ci-spec`.
2. **Plan 2 — writing.** Scripts, dictation, voices, host, cross-cuts,
   facts, all pools, repetition guard; `ci:transcript`. Read a season.
3. **Plan 3 — the game library and twists.** Games, parties, apartment life,
   all blocking formats, powers, arrivals as timeline cards.
4. **Plan 4 — the Circle tab.** Profile Plans, face catalogue, Photos panel,
   season options.
5. **Plan 5 — screens.** Stage kinds, apartments with personality, sound.
6. **Plan 6 — the site.** Export, ratings reader, social pack, wiki, ledger.

---

## 23. Open questions

1. **The host's identity** — name, portrait, voice notes. The user may keep Don
   for a future Amazing Race.
2. **The face catalogue** — drafted by Claude from the 84 images; needs the
   user's corrections.
3. **Default language** — US (Netflix model) is proposed; a UK option is in
   §19.2.
