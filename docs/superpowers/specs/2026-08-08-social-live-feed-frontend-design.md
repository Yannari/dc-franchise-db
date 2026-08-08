# Birdie + ChatAlumni — live social frontend design spec

Design spec, 2026-08-08. **Project 3 of 3** in the live-season social feed.

Project 1 built the audience voices. Project 2 turns episode events into stored,
timestamped posts with popularity-derived engagement. Project 3 makes those posts
visible as two convincing social apps: **Birdie**, the public fandom timeline,
and **ChatAlumni**, a hosted room where influential former players compare notes.

## Canonical franchise state

This spec begins from the actual state of the franchise:

- **Total Drama is the established show:** 14 completed seasons supply its
  history, relationships, fame, grudges, records and alumni.
- **Big Brother has not aired its first season.** It has no prior season, no BB
  alumni and no historical BB social feed.
- Before BB1 airs, its social destination is an honest preseason state. It must
  not render fabricated weeks, fake BB alumni or a pretend archive.
- When BB1 begins, eligible Total Drama alumni may host cross-format coverage.
  Current BB contestants never post from outside the house.
- A BB player becomes a BB alumnus only after leaving/finishing the season, and
  enters future host selection only when a completed appearance exists.

The frontend is format-ready without pretending every registered format already
has history.

## The product in one picture

```text
                         THE AIRING SEASON
                                 │
                    episode events + popularity
                                 │
                      stored, timestamped posts
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
         BIRDIE                                CHATALUMNI
      public stadium                         hosted green room
              │                                     │
   fans, stans, haters,                   influential alumni hosts
   jokes, ratios, pile-ons                 comparing notes in public
              │                                     │
   likes · tomatoes · replies              likes · comments · polls
   quote posts · trends                     predictions · watch parties
```

Both apps share canonical events, player identity and episode time. They do not
share feed grammar, navigation, engagement vocabulary, density or visual brand.

## Research decisions

- Public timelines are individually addressable, quickly scanned and openly
  contested through replies and quote-posts.
- ChatBCC describes its main conversation as host-only: hosts hold the mic while
  members comment, react, answer polls, play predictions and join side channels.
  ChatAlumni adopts that physics without copying its interface or text.
- Live arrivals must never insert above a reader and destroy scroll position.
  They collect behind a “12 new posts” control until the reader reveals them.
- Endless history hides episode boundaries and harms keyboard access. Cursor
  pagination has both an automatic sentinel and a visible **Load earlier** action.

Patterns are studied; no real person's posts, proprietary assets or exact social
interface are reproduced.

## Product principles

1. **Familiar before clever.** Avatars, replies, unread dividers, permalinks and
   notification badges behave as users expect.
2. **Live, never disruptive.** Counts may update; feed rows never move the
   sentence somebody is reading.
3. **The show changes context, not the app.** Terminology, events, statistics and
   relevant hosts adapt. Birdie remains Birdie and ChatAlumni remains ChatAlumni.
4. **Stable identity creates reality.** Persistent handles, history, threads and
   exact game facts matter more than decorative follower counts.
5. **AI is featured, not foundational.** Procedural writing creates the crowd;
   AI adds rare, event-specific posts and never determines facts or outcomes.

## Entry and URL state

One route owns both products:

```text
social.html?show=total-drama&season=14&episode=7&app=birdie
social.html?show=total-drama&season=14&episode=7&app=chatalumni
social.html?show=big-brother&season=1&app=chatalumni   // preseason until BB1 airs
```

URL fields: `show`, `season`, optional `episode`, `app`, optional `post`, Birdie
`tab`, and ChatAlumni `channel`. Unknown values degrade to the closest valid
state. The site header gains one **Social** destination. Inside it, a prominent
two-position switch changes Birdie ↔ ChatAlumni without losing show/season/time.

Top-level navigation stays compact:

```text
Birdie:       For You · Latest · Following · Players
ChatAlumni:   Main Stage · Watch Party · Predictions · Hosts
```

## Shared shell

### Desktop

```text
┌───────────────┬─────────────────────────────────┬──────────────────────┐
│ product rail  │        active feed              │ context rail         │
│ 224 / 72 px   │        620–680 px               │ 300 px               │
│               │                                 │ episode / trends     │
└───────────────┴─────────────────────────────────┴──────────────────────┘
```

- Maximum canvas 1260px; right rail disappears below 980px.
- No card mosaic: social content is temporal and belongs in one vertical stream.
- The center reading column does not resize when drawers open.

### Mobile

```text
┌────────────────────────────┐
│ Birdie       TD 14 · Ep 7  │
│ For You  Latest  Following │
├────────────────────────────┤
│         feed rows          │
├────────────────────────────┤
│ Home Search Alerts Profile │
└────────────────────────────┘
```

One edge-to-edge column, 16px content inset, sticky context header and four-action
bottom navigation. The product wordmark opens the app switcher. Threads become a
full-screen route on mobile. Every tap target is at least 44×44px.

### Show context

```text
🎬 TOTAL DRAMA 14 · EPISODE 7 · MERGE
📹 BIG BROTHER 1 · PRESEASON
📹 BIG BROTHER 1 · WEEK 3 · VETO NIGHT       // only after BB1 begins
```

A show adapter supplies vocabulary (`episode/week`, `eliminated/evicted`,
`challenge/competition`, `camp/house`) and event/stat renderers. A future show
adds one adapter rather than branches throughout both apps.

## Birdie

### Identity

Birdie is public, quick and combustible. Use paper-white/soft-slate surfaces,
near-black copy, one saturated sky-blue action colour, and tomato red only for
hostile engagement. Dark mode is charcoal rather than pure black. Its typographic
wordmark uses an original abstract wing/speech mark—never Twitter/X branding,
icons, spacing or type.

Body text is a highly legible neutral sans. Handles/timestamps are quieter;
engagement uses tabular numbers. The post body, not account chrome, is the anchor.

### Feed tabs

- **For You:** chronological inside the episode, with major/featured posts
  modestly promoted—never an opaque cross-season algorithm.
- **Latest:** strict event time.
- **Following:** accounts followed locally in v1; do not pretend a login exists.
- **Players:** active then eliminated player chips opening filtered timelines.

### Post anatomy

```text
┌──────────────────────────────────────────────────────────┐
│ avatar  display name  @handle · 2m       [FEATURED]    │
│         post body with linked player mentions           │
│                                                        │
│         TD14 · Episode 7 · Elimination                  │
│         reply 18  repost 34  like 603  tomato 7        │
└──────────────────────────────────────────────────────────┘
```

- Author opens the stable persona/alumni profile; player mention opens the
  canonical player page.
- Reply rows carry one connector and “Replying to @handle.”
- Tomatoes are an explicit fandom reaction, not moderation. Accessible action:
  “Throw tomato, 7 tomatoes.”
- Quote-post display is supported; real-user composition is out of scope until
  authentication and persistence exist.
- Episode context is subdued in the main feed and explicit in search/permalinks.

### Trends and audience pulse

Trends derive from post volume and velocity, never invented hashtags:

```text
TRENDING IN TOTAL DRAMA 14
1  Heather blindside       143 posts
2  Alejandro jury game      87 posts
3  Episode 7 challenge      54 posts

AUDIENCE PULSE
RISING        Heather     ↑ sharply
FALLING       Alejandro   ↓
MOST DIVIDED  Scott
```

Pulse translates popularity into relative movement without exposing simulator
internals. Exact scores belong only in a debug/details surface.

### Profiles

Fan profile: avatar, handle, archetype-flavoured bio, “Watching since Season 4,”
posts/replies/most-liked. Favourites and grudges emerge through history rather
than exposing the feelings table. Do not invent follower counts.

Alumni profile: portrait, fame stars/term, formats and seasons played, placements,
recent host posts, and link to the canonical player page.

## ChatAlumni

### Identity

ChatAlumni is a warm green room beside the live stage: cream and ink surfaces,
deep bottle green for host authority and restrained warm gold for live/pinned
moments. It must not be Birdie with green buttons. Host portraits are larger,
names outrank timestamps, and consecutive messages form a conversation rather
than isolated cards. Avoid glass bubbles and excessive rounded containers.

### The 50+ alumni bench

ChatAlumni exposes **at least 50 influential former players** from Total Drama's
14-season history. It does not make 50 people speak simultaneously.

Eligibility:

1. At least one completed appearance before the airing season.
2. A valid slug in `players_database.json` and a voice in
   `voice-profiles.json`.
3. Not currently competing in the airing season.
4. For a show-specific alumni label, at least one completed appearance in that
   show. Thus BB has zero BB alumni before/through the start of BB1.

Influence reuses `computeFame`/`fameOf`, never a hand-maintained celebrity list:

```text
influence = fame score
          + same-show authority
          + recent appearance relevance
          + event expertise
          + relationship relevance
```

- Same-show authority matters, but cross-format icons remain eligible.
- Event expertise reads real history: competition records on challenge night,
  juror/finalist experience at a finale, returnee experience at a comeback.
- Relationship relevance raises prior allies, rivals, partners and grudges of
  current contestants.
- Fame supplies reach, not correctness. Influential alumni may disagree or have
  a bad read.

Selection layers keep it readable:

- 50+ eligible alumni in **Hosts**.
- 8–14 rotating hosts attached to the season.
- 4–7 active speakers in one episode/watch party.
- One host “holding the mic” at a time in live-space presentation.

For BB1, the preseason and early-season panel is drawn from influential Total
Drama alumni, clearly labelled as cross-format hosts. Evicted BB1 contestants do
not join mid-season unless the product deliberately supports exit-interview guest
spots; they become ordinary eligible BB alumni only after BB1 completes.

### Main Stage

Only alumni hosts create top-level messages. Members—including recurring fan
personas—may like, react, comment, submit questions and answer polls. They cannot
post into the main line.

```text
┌──────────────────────────────────────────────────────────┐
│ MAIN STAGE                       ● 4 hosts here          │
│ Pinned: Episode 7 watch party                            │
├──────────────────────────────────────────────────────────┤
│ [Alejandro]  9:04 PM                                    │
│ Called it Tuesday. The kitchen conversation was the     │
│ tell; Heather stopped asking who he wanted out.          │
│ ♥ 388     42 comments     Host replied                  │
│   └ two member-comment previews                          │
├──────────────────────────────────────────────────────────┤
│ [Courtney]  9:06 PM             FEATURED ANALYSIS      │
│ The vote is clean. The jury management is not...         │
└──────────────────────────────────────────────────────────┘
```

Consecutive messages from one host collapse repeat chrome while remaining
individually addressable. Date/event dividers align the conversation to the show.

### Channels

- **Main Stage:** curated host conversation; members comment beneath it.
- **Watch Party:** messages replay against episode `at_ms`; pausing pauses local
  arrivals.
- **Predictions:** structured winner/boot/challenge predictions. Once BB airs,
  its adapter supplies nomination, veto and eviction questions.
- **Hosts:** directory of all 50+ eligible alumni with fame, shows, expertise,
  current-room status and recent messages.

Open community channels are later scope. The project models simulated member
voices, not authenticated humans; it must not provide a composer that saves
nothing real.

### Host directory

```text
HOSTS  58                    [Search alumni]

ON THE MIC
Alejandro   ★★★★★ Celebrity   TD   Strategy

HOSTING THIS SEASON
Courtney    ★★★★ Star          TD   Jury management
Leshawna    ★★★★ Star          TD   Social game

ALL HOSTS
sort influence · filter show · filter expertise
```

Fame is calculated at read time because it decays and may lock. No copied
`isHost` or influence score is stored. Newly influential eligible alumni enter
the directory without a frontend edit.

### Predictions, polls and comments

Polls belong primarily to ChatAlumni. During Total Drama they ask boot, challenge,
merge and winner questions. Before BB1, only preseason cast/winner predictions
are valid; nomination/veto polls appear after those game events exist.

Synthetic totals are labelled **simulated audience** in an info sheet and derive
from popularity/sentiment. Future real visitor votes must display separately;
real and simulated totals are never silently combined.

Main chat has no tomatoes or ratios. Two member comments preview beneath a host
message. A host response gets `HOST REPLIED`. Thread sorting is **Top** or
**Newest**, with two rendered levels; deeper replies flatten with “replying to.”

## Live behavior

### Catch Up and Watch Live

**Catch Up** is the default for a completed episode. **Watch Live** replays
`at_ms` against the episode clock:

```text
▶ Watch Live     18:42 / 42:00     7 messages waiting
```

- Speeds: 1×, 2×, 5×, Instant. Speed changes delay, never order.
- Seeking forward releases everything through the target into the waiting queue.
- Seeking backward never duplicates already seen posts.
- Switching Birdie ↔ ChatAlumni preserves the episode clock.
- Before BB1 airs there is no fake clock; the preseason page says when content
  begins and shows only legitimate cast discussion/predictions.

### New arrivals and connection

```text
             ┌─────────────────┐
             │  12 new posts ↓ │
             └─────────────────┘
```

At the live edge, a small number of rows may append naturally. Away from it,
never move the page: increment the pill. Returning to a hidden tab shows “While
you were away” with counts by app.

Connection states are explicit: `LIVE`, `RECONNECTING`, `CAUGHT UP`, `REPLAY`,
and `PRESEASON`. An interruption keeps visible posts. Cursor reconnect requests
everything after the last sequence. Polling while the tab is visible is a valid
fallback; UI components do not depend on transport.

## AI featured posts

AI enrichment runs only for major canonical events and is failure-safe:

```text
major event ─┬─ procedural crowd ───────────────────────┐
             └─ featured job                           │
                   ↓                                   │
             structured facts                         │
                   ↓                                   │
             AI draft in an existing voice            │
                   ↓                                   │
       schema · fact · hostility · duplicate checks   │
                   ↓ pass                    fail ─ discard
             stored featured post ─────────────────────┘
```

Eligible events: blindside, betrayal, finale, jury result, record performance,
major edit/harassment controversy, reunion revelation or showmance rupture.
Ordinary episodes may have none; maximum 1–3 featured posts per episode.

The model receives facts, not mutable game state:

```js
{
  task: 'featured-post',
  app: 'chatalumni',
  event: { kind, format, season, episode, subject, actor, at },
  facts: [
    { type: 'vote', tally: '5-2' },
    { type: 'deal-broken', breaker: 'alejandro', victim: 'heather' }
  ],
  author: { slug, voiceProfile, history, feelings, fame },
  recentPosts: ['...'],
  constraints: { minWords: 25, maxWords: 85, mayInventFacts: false }
}
```

Validators:

1. Schema and exact allowed author identity.
2. Every player/numeric/game claim resolves to supplied facts.
3. Project 1 protected-characteristic hostility denylist.
4. Similarity rejection against recent posts and author history.
5. Platform register: Birdie short; ChatAlumni analytical/conversational.
6. No active contestant posts externally; no alumnus claims experience they do
   not have.

AI posts carry restrained `FEATURED POST`/`FEATURED ANALYSIS` labels and an info
action: “Generated from this episode's recorded events and checked against its
game facts.” The author is the in-world account, not a robot identity. No sparkle
gradient or AI avatar.

Storage provenance:

```text
source          procedural | ai-featured
feature_reason  blindside | finale | betrayal | ...
fact_hash       canonical input hash
model_version   operational only, not public chrome
```

If AI is disabled, late or rejected, the procedural feed remains complete. The
frontend never reserves a skeleton for a post that may not arrive.

## Frontend contract and real-time architecture

```js
{
  id, format, season, episode, stream,
  handle, author, authorSlug,
  topic, kind, subject, body, atMs,
  replyTo, likes, tomatoes,
  source: 'procedural', featureReason: null,
  sequence: 184,
  context: { showName, episodeLabel, eventLabel }
}
```

ChatAlumni adds `authorType`, `channel`, `parentId`, `commentCount` and
`hostReplied`. Components consume plain records and never import simulator state,
calculate fame, select hosts or generate writing.

Cursor endpoints:

```text
GET /api/social/feed?format=total-drama&season=14&episode=7
    &app=birdie&tab=latest&before=<cursor>&limit=30
GET /api/social/posts/<id>
GET /api/social/posts/<id>/thread
GET /api/social/hosts?format=total-drama&season=14
GET /api/social/trends?format=total-drama&season=14&episode=7
GET /api/social/stream?...                 WebSocket/SSE transport
```

Reads are public. Future human writes require authentication, rate limiting and
origin/CSRF protection before their controls are enabled.

One real-time coordinator per `(format, season)` owns connections, episode clock,
unread sequence and broadcast. D1 stays the durable post source. Hibernatable
WebSockets suit production; stored-array replay/polling suits local development.

## Components

Shared: `SocialShell`, `AppSwitcher`, `SeasonContextChip`, `EpisodePicker`,
`ConnectionBadge`, `NewItemsPill`, `PlayerMention`, `Avatar`, `EngagementNumber`,
`FeedErrorBoundary`, `EmptyEpisodeState`.

Birdie: `BirdieNav`, `TimelineTabs`, `PostRow`, `ReplyConnector`,
`FeaturedPostLabel`, `TrendsPanel`, `AudiencePulse`, `PersonaProfile`.

ChatAlumni: `ChatNav`, `ChannelHeader`, `HostMessage`, `HostCluster`,
`CommentPreview`, `PredictionCard`, `WatchClock`, `HostDirectory`,
`AlumniProfileSheet`.

## States that must be designed

### Big Brother before season one

This state is prominent rather than an empty-feed error:

```text
BIG BROTHER 1
The house has not opened yet.

Birdie: preseason cast talk and predictions begin when a roster is announced.
ChatAlumni: 6 Total Drama icons are booked to cover the new format.

[Meet the cross-format hosts]  [Return to Total Drama 14]
```

There is no “Previous BB seasons,” BB alumni filter, archived BB thread or Week 1
content until those records genuinely exist.

### Other states

- **Before a TD season airs:** host roster preview and valid preseason questions.
- **Episode not aired:** scheduled/locked state, distinct from a parsing failure.
- **No recognised events:** explain that the episode generated no feed moments.
- **Publish failure:** keep prior content, name the failure and offer retry.
- **No eligible alumni:** explain why and offer Birdie; never fill Main Stage with
  fan personas.
- **Replayed episode:** invalidated permalink becomes a tombstone explaining that
  its source episode was replaced.
- **Finished season:** live controls become archive controls. This requires the
  feed to be published before live rows are cleared; otherwise state plainly that
  archives are not retained.

## Accessibility

- WCAG AA contrast; gold, trend arrows and popularity never carry meaning alone.
- Semantic `<article>` per Birdie post; ordered message log for ChatAlumni.
- Correct tabs pattern and visible feed heading.
- One polite live-region summary (“12 new Birdie posts”), never one announcement
  per arrival; engagement counters update silently.
- Focus stays on New Items after insertion with a jump to the first new row.
- Actions expose label, state and count: “Like, 603 likes.”
- Avatars are decorative when adjacent text already names the author.
- Reduced motion removes movement without removing unread state.
- Infinite loading always has keyboard-operable **Load earlier** and a reachable
  footer.
- AI provenance is equally available visually and to assistive technology.
- Embedded media, if added, is captioned and never autoplays with sound.

## Motion and performance

Motion communicates state only: a single ease-out for New Items, immediate
pressed confirmation for reactions, a short app-header transition, and a 6px
message arrival disabled under reduced motion. No pulsing loops, notification
sound by default, glass effects or decorative feed motion.

- First response renders 20–30 posts; JavaScript enhances live behavior.
- Do not virtualise until measurement proves it necessary; virtualisation can
  break focus, find-in-page and variable-height threads.
- Reserve avatar dimensions and lazy-load offscreen portraits.
- Batch arrivals/counter updates.
- Keep a bounded Watch Live DOM with an explicit Earlier Posts boundary rather
  than silently deleting read content.

## Acceptance tests

### Product separation

- One blindside renders as public posts/replies in Birdie and host-only messages
  with member comments in ChatAlumni.
- Fan personas never author ChatAlumni top-level messages.
- Birdie never renders ChatAlumni comment/prediction chrome.

### Alumni and chronology

- At least 50 voice-backed eligible Total Drama alumni appear in Hosts.
- Active players are excluded and fame ordering derives from `computeFame`.
- No manual celebrity list exists; adding a newly famous alumnus needs no UI edit.
- Episode panels use relationship/expertise relevance and cap at seven speakers.
- Before BB1, eligible BB alumni count is exactly zero.
- BB1 preseason uses honestly labelled cross-format TD hosts.
- A BB contestant gains no BB alumni status until a completed BB appearance is
  published.

### Show adaptation

- TD uses episode/elimination/challenge/camp vocabulary.
- BB preseason contains no week-specific content.
- Once supplied an aired BB fixture, the same UI uses week/eviction/HOH-veto/house
  vocabulary without a separate frontend.
- Switching shows preserves app choice but resets invalid episode/channel state.
- Unknown future formats render generic labels rather than crash.

### Live and AI

- Arrivals never change scroll position away from the live edge.
- Reconnect resumes after sequence without duplication.
- App switching preserves Watch Live time; backward seek does not replay unread.
- AI failure leaves a complete procedural feed and no loading hole.
- Invented player/tally/deal claims fail validation.
- At most three AI posts appear per episode with provenance visible.
- Hostility validation applies to ingested AI output.

### Accessibility and visuals

- Keyboard navigation works at 200% zoom and 320px width.
- Reduced motion, absent IntersectionObserver and absent WebSocket all retain full
  functionality.
- Visual regression: both apps desktop/mobile; thread; host directory; featured
  AI post; unread pill; reconnect; TD archive; BB preseason; no-feed state.

## Delivery slices

1. **Believable archives:** shared route, Birdie feed/thread, ChatAlumni Main
   Stage, derived 50+ Hosts directory, static cursor pagination and BB preseason.
2. **Live replay:** Watch Live clock, unread queue, reconnect cursor and transport
   adapter. Local replay/polling first, production WebSocket second.
3. **Participation surfaces:** simulated predictions/polls, comment previews,
   local following and notifications. Human writes wait for auth/abuse controls.
4. **AI featured posts:** background job, structured facts, validators,
   provenance and feature-flag rollout. Procedural output remains control/fallback.

## Explicitly out of scope

- Human accounts, DMs or unrestricted user posting.
- Copying another social product's brand/assets.
- AI game events, outcomes, engagement totals or player history.
- AI posts for every event.
- Fake Big Brother history or alumni before BB1 completes.
- Multiple concurrently airing seasons until chronology has real air dates.
- Advertising, subscriptions and creator monetisation.

## Open implementation decisions

1. **Archive policy:** `social_posts` currently clears with the live season. A
   static feed must publish before clearing if archives are promised.
2. **Transport:** Durable Object WebSockets are the production target;
   replay/polling stays the fallback/test transport.
3. **Real reactions:** without auth, visible interaction is simulated. Anonymous
   writes must not be accepted and merged silently.
4. **AI provider:** provider-neutral fact/validation/provenance contracts remain
   stable regardless of model.
5. **50-host audit:** if the current player/voice intersection is below 50, add
   voice coverage. Never weaken eligibility or invent placeholders.

## Research references

- ChatBCC App Store product description: host-only main chat with member
  comments, reactions, live spaces, trivia and predictions.
  `https://apps.apple.com/us/app/chatbcc/id6740636919`
- Cloudflare real-time architecture: Durable Objects coordinate shared state and
  WebSockets while queues handle background event processing.
  `https://developers.cloudflare.com/use-cases/web-apps/real-time/`
- Cloudflare hibernatable WebSockets guidance.
  `https://developers.cloudflare.com/durable-objects/best-practices/websockets/`

