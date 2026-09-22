# Perfect Match — design

Fifth show. A Love Island–style dating show: islanders couple up, recouple,
and are dumped; the public decides who stays and who wins. Brainstormed
2026-09-22. Read alongside `docs/ADDING-A-SHOW.md` — section references below
(§N) point there.

**The one rule the whole design serves:** the islanders decide **who is with
whom**; the public decides **who stays and who wins**. The villa never crowns
a winner, and the public never forces a recoupling.

---

## 1. Research (checked, not recalled)

Sources: Love Island wiki via `api.php?action=parse&prop=wikitext`
(UK Season 5 and US Season 6 pages, day by day), Wikipedia (UK and US
series), Capital XTRA's 2025 and 2026 cast pages (~75 islander profiles:
occupation, motivation, type, icks, self-description), press coverage of the
split-or-steal envelope.

What the format actually is:

- **First coupling** on day 1, one side picks. Late arrivals get a steal on day 2.
- **Recouplings** every 5–8 days, the picking side alternating. Anyone left
  single is dumped — decided by islanders, not the public.
- **Public votes** (favourite couple, or most compatible) produce the
  **bottom couples**; the villa usually finishes it: "the boys pick one girl,
  the girls pick one boy" (UK S5 d25), "the safe islanders pick a couple"
  (UK S5 d36), "only one of you can stay" (UK S5 d42), or the public dumps
  outright (US S6 d30).
- **Bombshells** date, then steal; the islander left behind is usually dumped
  at the next recoupling.
- **Casa Amor**: villa splits, new islanders arrive, each original secretly
  sticks or twists. Stuck-while-partner-twisted = single but safe; unpicked
  Casa islanders are dumped (UK S5: 12 arrived day 26, 6 dumped day 30 without
  ever coupling in the main villa).
- **Challenges carry no immunity.** They exist to expose (kiss rankings,
  "who is this tweet about", heart-rate, Movie Night).
- **The final is public-only.** UK S5: 48.82 / 25.56 / 18.21 / 7.4.
- **Split-or-steal envelope**: US still uses it; the UK dropped it after
  series 7. No UK winner ever stole.
- **Walks** happen (UK S5, Amy Hart, day 37).
- **Bombshells arrive with named targets** ("Type: Kavan, Simba, Samraj") —
  they watched the show.
- **Exes in the villa** happen (2025: Emma Munro entered as Harry Cooksley's ex).

---

## 2. Identity — `js/shows.js`

| Key | Value |
|---|---|
| slug | `perfect-match` |
| prefix | `pm` (`pm-1`, `pm_episode_s1_e1`, `data/seasons/pm-1-data.json`) |
| name / short | Perfect Match / PM |
| venue | The Villa |
| runnableFlag | `_pmRunnable`, set at the bottom of `js/pm-run.js` |
| roundsPath | `episodeHistory` (one row per episode, stamped `format`; villa state on `gs.pm`) |
| roundShape | `ballots` (see §13) |
| hasJury | `false` |
| words | player `islander`, players `islanders`, round `Episode`, exit `dumped`, exitAction `dump`, second exit verb `walked`, quietRound `A normal day in the villa`, `audienceAward` `Fan Favourite Islander`, `fanWords` (recoupling, bombshell, casa, graft, mugged, firepit, text, dumped, villa, ick) |
| audience | romance and mess high, strategy low — set after the first played season, per §2.5 |
| careerStats | couplings, times stolen, public votes survived, final placement — only fields the engine really writes |

**Host: Dior** (inspired by Ariana Madix). Portrait `assets/avatars/dior.jpg`
(the path is a HOST literal, which the portrait guard
allows). Her own voice, never borrowed catchphrases. Runs every coupling,
dumping and the final, and makes surprise appearances for big twists.

**Narrator:** a British comic voiceover alongside Dior, in the spirit of Iain
Stirling — dry, sarcastic, fond of the islanders while mocking them, and
never mean about anyone the show is treating as a victim. An original
character with his own lines, not borrowed catchphrases. His name is an
author setting. He only ever describes what is on screen (no knowledge the
edit lacks).

**Texts** ("I got a text!") are anonymous, as on the real show.

---

## 3. The season

Default cast **22**: 10 starters, 5–6 bombshells, 6–8 Casa Amor. A **20**
variant drops the double bombshell (ep 6) and one recoupling (6 Casa, about
32 days). Option: an unpicked Casa islander (one night on screen) can return
as a starter or bombshell in a later season.

**16 episodes: 15 in the villa plus the reunion.** Each covers 2–3 days and
ends on a moment.

| Ep | Days | Big moment | Exits |
|---|---|---|---|
| 1 | 1–2 | Arrivals, first coupling, day-2 steal | 0 |
| 2 | 3–5 | First recoupling | 1 |
| 3 | 6–8 | Bombshell dates, heart-rate challenge | 0 |
| 4 | 9–11 | Recoupling | 1 |
| 5 | 12–14 | First public vote → villa decides | 2 |
| 6 | 15–17 | Double bombshell | 0 |
| 7 | 18–20 | Recoupling | 1 |
| 8 | 21–23 | Casa Amor opens | 0 |
| 9 | 24–26 | Casa nights | 0 |
| 10 | 27–28 | Stick or twist | 4 |
| 11 | 29–31 | Fallout, the photos | 0 |
| 12 | 32–34 | Public vote | 2 |
| 13 | 35–37 | Last bombshell, last recoupling | 1 |
| 14 | 38–40 | Families visit, semi-final vote | 2 |
| 15 | 41–43 | Final: declarations, final vote, split-or-steal | 4 couples ranked |
| 16 | — | Reunion | — |

Public votes land at 5, 12, 14 and 15, so popularity decides more and more as
the season goes on. Constants that depend on season length (per-episode caps,
first-impression window) are stated per episode and re-measured on the 20
variant (§11.5 F).

---

## 4. An episode

About **100 events** per episode, shown in clusters (one chat or one couple's
morning per click; "reveal all" per screen). Each event is 1–2 sentences —
density comes from the number of events, not padding.

| Screen | ~Events | What fills it |
|---|---|---|
| Previously / cold open | — | Last episode's text resolved |
| Morning | 12 | Each couple waking up; the couple board (solid / wobbling / mugged off) |
| Villa day | 40 | Chats, pulls, sunbed gossip, grafting, group-chat texts, friendships, feuds |
| The day's event | 18 | A challenge couple by couple, a date, or a bombshell entrance |
| Evening / terrace | 23 | Drinks, kisses, arguments, "can I borrow you?", the bedroom debrief |
| Firepit + the text | 7 | Recoupling or dumping reveal; the cliffhanger |
| Dumping (when there is one) | own screen | see §10 |

**Confessionals are cutaways, not a screen.** About 1 in 4 events carries a
beach-hut reaction from one of its participants. The gap between the firepit
line and the hut line is where the drama comes from. A confessional is
sourced only from what the speaker knows (§11.5 D).

Every screen uses the pinned animated stage from day one (§6.5), and every
twist-style screen has a live sidebar gated by `_tvState`.

---

## 5. Islanders

### 5.1 No new stats

A per-show player field costs nine links (§8.1) and Drag Race shipped five of
them broken. Everything the villa needs reads from the nine shared stats:

| Love trait | From |
|---|---|
| Flirting / pulling power | `social` + `boldness` |
| Staying faithful | `loyalty` |
| Falls fast vs guarded | `loyalty` vs `strategic` |
| Spots a liar | `intuition` |
| Jealousy that becomes a blow-up | low `temperament` + `boldness` |
| Plays to camera | `boldness` + `social` |
| Challenges only | `physical`, `endurance`, `mental` |

All proportional (`stat × factor`); thresholds only select text.

### 5.2 Villa persona (derived, overridable)

A narration label, derived from stats; an author-set `persona` wins. Not a
franchise archetype.

| Persona | From |
|---|---|
| Fuckboy / Player | high social + boldness, low loyalty |
| Hopeless Romantic | high loyalty, low strategic |
| The Mug | high loyalty, low intuition |
| The Checklist | high loyalty + strategic, low temperament |
| Bombshell | high social + boldness, arrived late |
| Game Player | high strategic, low loyalty |
| Messy | low temperament, high boldness |
| Girl's Girl / Boy's Boy | high loyalty + social |
| Villa Clown | high social + boldness, high temperament |
| Wallflower | low social + boldness |

Rows are tested in table order and the first match wins, so a combination
that fits two rows (Theo: Fuckboy and Villa Clown) takes the earlier one.
"Also a Mug" is a secondary tag any persona can carry when `intuition` is low.

### 5.3 Archetypes

Franchise archetype rules apply unchanged. Nice archetypes never scheme,
sabotage or engineer drama; neutral need `strategic >= 6 && loyalty <= 4`.
Archetypes also nudge love, proportionally: `showmancer` falls faster,
`villain`/`schemer` couple strategically more, `loyal-soldier` sticks at Casa
more.

### 5.4 Cast setup fields (the Perfect Match tab)

Per islander, per season. Every field **rolls if left blank**. Stored on the
season's cast, not the roster; fields that prove to be character facts
(looks, interests) move to the roster after the first played season, paying
§8.1 once.

- **Intent** (one): `love` · `settle-down` · `first-love` · `fresh-start` ·
  `fun` · `stir` · `fame` · `win` · `money`. Everyone *says* love in their
  intro; the public infers the real intent from what airs. `stir` only lets
  scheme-eligible archetypes engineer drama; a nice archetype with `stir`
  just flirts boldly.
- **Type on paper**: 0–3 **look tags** (`tall`, `short`, `muscular`, `slim`,
  `dad-bod`, `blonde`, `brunette`, `dark-hair`, `redhead`, `tattoos`,
  `great-smile`, `pretty-boy`/`pretty-girl`, `rugged`, `accent`, `glam`,
  `natural`; nothing race-coded) plus 1–2 **vibes** (`funny`, `confident`,
  `emotionally-mature`, `fiery`, `ambitious`, `family-oriented`,
  `protective`, `bubbly`, `chill`, `competitive`, `mysterious`), each vibe
  read from the other islander's stats.
- **Own look tags**: what the portrait shows, so others' types can match.
- **Icks** (1–2): vibes that put them off (`nonchalant`, `cocky`, `loud`,
  `people-pleaser`, `attention-seeker`, `chaser`, `no-manners`, …) — plus
  event icks that fire in play ("I got the ick").
- **Interests** (2–4): `fitness`, `football`, `other-sport`, `dance`,
  `music`, `fashion`, `beauty`, `travel`, `languages`, `family`, `animals`,
  `outdoors`, `partying`, `career`, `education`, `performing`,
  `social-media`, `wellness`, `food`, `gaming`, `faith`, `pop-culture`. One
  can be marked a **bonus interest** in a partner.
- **Eyes on** (bombshells): named targets; if blank, filled from **aired**
  footage (§7).
- **Ex**: an optional islander. Seeds through `js/franchise-meta.js`,
  widened to accept authored pre-show relationships — never a private
  constants table (§8.2, §11.5 Q).

### 5.5 Worked examples

**Priya** — mixed heritage (African American mother, Sri Lankan father),
aspiring lawyer, here for a husband; uses her looks; loses people by
demanding perfection. `strategic 8, mental 8, boldness 7, loyalty 7,
social 6, intuition 6, temperament 3, physical 5, endurance 5`. Archetype
`perceptive-player`. Persona The Checklist. Intent `settle-down`, vibe
`ambitious`, ick `nonchalant`. Plays out: big first-day attraction;
interviews partners; a partner's slip becomes a firepit argument; friendships
wear down; either "she knew what she wanted" (Divisive → Loved) or a Villain
edit; splits the envelope.

**Theo** — country ranch hand, cowboy hat in the portrait, womanizer, clueless
about others' intentions, here for girls not a wife, loves animals.
`boldness 8, social 7, physical 7, endurance 7, temperament 7, mental 4,
strategic 3, loyalty 2, intuition 2`. Archetype `wildcard` (below the
scheming bar: he two-times from carelessness). Persona Fuckboy who is also a
Mug. Intent `fun`, interests `animals`, `outdoors`, bonus interest `animals`.
Plays out: grafts on the side at once; gets used by a Game Player and never
clocks it; twists at Casa; Loveable Rogue or Villain depending on whom he
mugs off; one slow-burn path with an animal-loving, loyal girl.

---

## 6. Relationships

The show is its relationships, so this is the biggest system in it. The user's
rule: **relationships are not always bilateral.** Romance at 8 with friendship
at −2 (the Sims "romance 80, friendship −20"), friends and never anything
more, a one-way crush, a hidden crush, and somebody pretending to feel what
they don't, all have to be expressible and all have to drive play.

### 6.1 One store, widened — never a second one

`js/relationships.js` already holds **directional, multidimensional**
relationships: one record per ORDERED pair (`A→B` is not `B→A`) with
`affection`, `trust`, `strategicRespect`, `fear`, `obligation`, `resentment`
and `attraction`. Perfect Match reads and writes that store. It does not keep
a private attraction table (ADDING-A-SHOW §11.5 Q). It widens the store by one
dimension:

- **`love`** (0–10): having fallen for somebody, as against fancying them.
  Grows slowly from time together, only where there is attraction to grow
  from; does not decay on its own; drops on betrayal. It is added to
  `RELATIONSHIP_DIMENSIONS`, defaults to 0, and changes nothing for the other
  shows.

What each dimension means in the villa:

| Dimension | Villa meaning |
|---|---|
| `attraction` | the spark — "my type on paper", set on meeting (§6.2) |
| `love` | falling for them |
| `affection` | friendship, −10…+10 |
| `trust` | "is this real?" |
| `resentment` | being mugged off, grudges |
| `obligation` | owing them (they saved you at a recoupling) |
| `strategicRespect`, `fear` | the game players' view of each other |

**Romance** = `max(0.9 × attraction, 0.5 × attraction + 0.6 × love)`, 0–10,
is the one number a reader sees as the romance bar: a crush is mostly spark,
and falling for someone lifts it past what the spark gives. Friendship is
`affection`.

The engine must not call `decayRelationshipDimensions` on a villa season
without deciding it wants that: its 10% per episode fade of `attraction` was
written for camps where attraction is incidental.

### 6.2 Attraction on meeting

Set when two islanders first share the villa, one direction at a time, gated
by `romanticCompat`: type-on-paper match (look tags + vibes read from the
other's stats) + a seeded **spark** + shared interests (+ bonus interest) −
icks. Afterwards it moves only through events (a kiss, an ick, a glow-up).
Connection is `affection` and `love`, grown by time together. The gap between
the spark and the connection is the show:

| Spark | Connection | On TV |
|---|---|---|
| High | Low | The bombshell who turns heads and goes nowhere |
| Low | High | The slow burn the public loves |
| High | High | The couple that wins |
| Low | Low | Couple for survival; the public can smell it |

### 6.3 Three layers per direction: feels, shows, believes

| Layer | What it is | Where it lives | Who sees it |
|---|---|---|---|
| **Feels** | what A truly feels for B | `js/relationships.js` | the reader; the public only through aired beach huts |
| **Shows** | the romance A acts out toward B | `gs.pm.shows["A→B"]`, absent = honest | everyone in the room |
| **Believes** | what B thinks A feels | `gs.pm.believes["B:A→B"]` | B alone |

Belief moves every episode toward what A shows, plus a leak of the truth
scaled by B's `intuition` (and dulled by A's `social`); gossip, the photos,
Movie Night and a confession set it to the truth. Every decision an islander
makes reads **their own feelings** and **their beliefs about the other
person** — never the other person's true feelings (§7).

### 6.4 The relationships this produces

Derived from the three layers, both directions, and whether the pair is
coupled. The labels are narration, so thresholds are allowed here:

| Label | Shape | Real example |
|---|---|---|
| Head over heels | coupled, romance high both ways | |
| All in — alone / Not feeling it | coupled, one high, one low | Curtis and Amy (UK S5): "not a physical attraction" |
| Couple for survival | coupled, low both ways, openly | |
| Faking it | shown romance far above felt | the "is it real?" question over most finals |
| Hidden crush | romance high, shown low | Rob's secret crush on JaNa (US S6) |
| Fancies but can't stand | romance high, friendship negative | |
| Mutual spark | uncoupled, high both ways | |
| One-way crush | high one way, low the other | |
| Friend-zoning | friendship high, romance ~0, the other's romance high | |
| Just friends | friendship high both ways, no romance | |
| Can't stand / rivals | friendship strongly negative, or both after one person | |
| Exes | an authored `ex` (§5.4), seeded through `franchise-meta.js` | Emma Munro and Harry Cooksley (2025) |

### 6.5 Who may do what

- **Hiding a crush is not scheming.** Any archetype may show less than they
  feel: out of loyalty to their couple, or because the one they fancy is a
  friend's partner (girl code). Hiding costs them nothing but slows the crush.
- **Faking feelings is a scheme**, so it needs a scheme-eligible islander
  (villain, mastermind, schemer, or a neutral with `strategic >= 6 &&
  loyalty <= 4`): shown romance well above felt, to stay coupled through a
  recoupling or for fame or money.
- **Emotional manipulation** is two scheme events, both on that same gate:
  **love-bombing** (a burst of shown romance that raises the target's belief
  and love faster than the truth deserves) and **gaslighting** (when the
  target confronts them with the truth, they turn it back on the target —
  "you're being paranoid" — pulling the target's belief back up while the
  target's `trust` falls). The model is Adam and Rosie (UK S4), where Women's
  Aid named the gaslighting. On air it is a major moment and a heavy approval
  cost; nobody nice ever does it.
- **The beach hut airs the truth.** A hut line is the Feels layer. So the
  public often knows somebody is faking before their partner does, and the
  approval ledger pays for it — which is what makes the reunion reel land.

### 6.6 What the reader sees

- The **heart map**: couples, one-way crushes as arrows sized by strength,
  hidden crushes as dotted purple arrows, secret flirting, rivals, couples on
  the rocks.
- The **relationship viewer**: pick any islander (from a face row or the heart
  map) to list everybody they have a story with, strongest first — romance and
  friendship bars in both directions, a label each way, and a line wherever
  somebody shows something they don't feel or believes something untrue.
- The **Debug** tab (its own screen): public mood, airtime, and the one-way
  romance and friendship grids.

Mockup: `mockup/mockup-pm-vp-v2.html`.

### 6.7 The ladder: what we are to each other

Sources: US S8's label debate (Yahoo), "closed off" explained (Tyla), the
Molly/Zach toast (UK S10), Amy's "half-boyfriend" (UK S5).

The real show climbs a ladder, and most rungs are **one person's
declaration**, not a pair's:

| Step | Who sets it | What it promises | Real example |
|---|---|---|---|
| `coupled` | the firepit | nothing — a pairing | every day 1 |
| `cracking-on` | each, by behaviour | interest, no promise | |
| `open` ("getting to know people") | each, aloud | "my head can still be turned" | |
| `closed-off` | ONE person, unilaterally | "I won't look at anyone new" — not a promise from the other | Molly told Kady she and Zach were closed off; Zach denied it |
| `exclusive` | an ask and a yes | only each other | Zach asked Kayda (US S8) |
| `official` | a boyfriend/girlfriend ask, with a gesture | the villa's marriage | Bryce asked Trinity (US S8) |

Plus two milestones that ride beside the ladder: the first **"I love you"**
(said, and either returned or left hanging) and a **Hideaway** night.

Each side has its own step **and a belief about the other's**. When they
disagree it is a *situationship*, and it surfaces as a scene: the toast that
outs a status, "I thought we were closed off", "we never said we were
exclusive".

**Moving up** is proportional: romance both ways, love, trust, days together,
and who they are — high `loyalty` climbs faster; `fun`/`stir` intents slower;
anxious attachment (§6.8) closes off early and asks early; avoidant waits and
may decline. An ask can be declined ("I'm not there yet"), which hurts in
proportion to the asker's love. **Moving down** happens too: after Casa or a
turned head, "I need to open myself back up" — a major moment for a partner
still closed off.

**Jealousy depends on the rung you believe you're on.** A partner grafting
while you believe they are `open` stings by how much you love them; while
you believe they're `closed-off`, `exclusive` or `official`, it is a
betrayal, with resentment and a trust collapse scaled up the ladder. And "we
said we were open" is a real defence the islanders use.

**The villa reads the ladder.** At villa dumpings islanders protect strong
couples ("you don't split a real couple"), so `exclusive` and `official`
couples draw fewer dumping votes; grafting on them breaks girl code (§6.9);
bombshells aim at open couples. The public rewards an official ask
(approval, and belief in the couple).

### 6.8 Emotions: how they feel, day to day

Sources: therapy and psychology write-ups on the villa (time distortion, sleep
loss, comparison, loss aversion); attachment and jealousy research (cognitive,
emotional and behavioural jealousy by attachment style); rebound research;
Amy Hart's walk (UK S5).

The villa is built to speed attachment up and turn feelings up, and the
engine simulates both. Every islander carries an **emotional state**. It's
season state, not stats (§5.1), and every value moves only on things that
islander witnessed, was told, or believes (§7):

| Feeling | Rises with | Falls with | Drives |
|---|---|---|---|
| `security` in their couple | reassurance, climbing the ladder, being picked | believed straying, a rival's arrival, a status mismatch | reassurance-seeking, overthinking, jealousy |
| `jealousy` (acute, per rival) | a witnessed or reported flirt with their partner, scaled by the ladder | reassurance, time | confrontation, sulking, retaliation |
| `confidence` | being picked, pulled for chats, chosen in challenges, a date | being pied, left single, not picked, a bombshell choosing someone else | boldness in pulls and steals |
| `loneliness` | being single, friends dumped, the partner at Casa | a new connection, a close friend | rebounds, walking out |
| `guilt` | grafting while `closed-off` or higher; Casa | confessing | confessing, or defensiveness and gaslighting (schemers only) |
| `heartbreak` | dumped by a partner, a partner who twisted | time, a rebound | withdrawing, walking, a rebound |
| `stress` | the season going on, sleep loss, conflicts, at-risk nights | quiet days, wins | every feeling above running hotter |

**Time runs fast.** Each villa day counts for more than an outside day
(§6.3's love growth scales with days together), and `stress` builds over the
season: it lowers effective `temperament`, so the same slight lands harder in
week five than in week one.

**Attachment, from the nine stats** (continuous, never a category; the label
is narration):
- *anxiety* rises with high `loyalty` and low `temperament`;
- *avoidance* rises with low `loyalty` and high `strategic`;
- *secure* is low on both.

It shapes jealousy the way the research found it:
- **Secure** islanders barely feel it until a threat is confirmed, then feel
  it fully.
- **Anxious** islanders feel it early and often, with intrusive thoughts
  (overthinking in the beach hut), checking up and reassurance-seeking.
- **Avoidant** islanders feel less, but answer a threat by making their
  partner jealous (a pull staged in sight of them) and with revenge.

**How a feeling comes out** is its own choice, proportional to `temperament`,
`boldness` and attachment. Jealousy can come out as:
- a confrontation at the firepit;
- a sulk in the bedroom;
- a retaliatory flirt, to make them jealous back;
- a reassurance chat;
- or nothing visible at all, which then leaks into the beach hut.

**Heartbreak and exits.** A heartbroken islander who has to watch the ex
crack on can **walk** (Amy Hart). A partner of someone dumped, with high love
and loyalty, can walk **in solidarity**. Deep loneliness with high stress can
become **homesickness** and a walk. A **rebound** is likely after
heartbreak, and it restores confidence: people who rebounded fast reported
better self-esteem.

### 6.9 Friends and the villa as a group

- **Confidants.** Each islander's closest trusted friend is who hears their
  secrets and whose opinion moves them: "the girls don't rate him" lowers
  attraction and trust; a friend backing the couple raises security. A
  **family visit** works the same way at one remove (Kyra's father's doubts
  shook her, UK).
- **Girl code / the boys' code.** Grafting on a friend's partner, or on an
  `exclusive`/`official` couple, costs friendship across the grafter's
  circle, and the villa splits into sides. Alliances form "for protection".
- **Peer pressure.** At Casa, friends who twist make twisting likelier ("it's
  a lads' holiday"); friends who stay loyal make sticking likelier.
- **Double standards.** How harshly the villa judges an act depends on how
  much it likes the actor: gossip about a friend is softened, about a rival
  sharpened. At Movie Night that gets called out ("double standard"). The
  public sees both sides.
- **The villa's rituals** exist to surface truth and feeling, and each is an
  engine event with consequences:
  - the **heart-rate challenge** airs who really fancies whom, so a hidden
    crush can be caught on a monitor;
  - **Snog, Marry, Pie** and anonymous **notes** make private opinions
    public;
  - **Movie Night** plays unaired clips to the villa;
  - **Meet the families**;
  - the **Hideaway**;
  - **final dates** and **declarations**.

---

## 7. Three levels of knowing

| Who | Sees |
|---|---|
| **The reader** | Every event. Unaired events carry a **"didn't air"** badge |
| **The public** | Aired events only |
| **The islanders** | What they witnessed, were told, or were shown |

Islanders decide from **their own feelings and their beliefs about the other
person** (§6.3), never the other person's true feelings, and **never read
approval or fame**. Public opinion reaches the villa only as Dior's
announcements ("the fewest votes"). **Bombshells** are the one exception: they
watched the aired episodes, so their eyes-on list and first reads may use
aired facts — and only aired facts, only at arrival. Guard-tested.

Revelation channels (Movie Night, the photos, gossip, a bombshell tip-off,
the reunion) move an event from hidden to known for the relevant level; a
revealed event airs in the episode it surfaces.

---

## 8. Popularity

Reuses the Traitors two-ledger pattern (`js/tr/crowd.js`, §14.8) and
`js/audience.js` for any comparable reading (§8). No second audience ranker.

- **Approval** −100…+100: decides votes. Written into `gs.popularity`
  (scaled ×2 against Total Drama — this show is sold on the vote).
- **Fame** ≥ 0, never decreases: **screen time**, any tone. Kept on its own
  ledger. A villain with a huge edit is very famous; a sweetheart nobody
  filmed is not.
- **Followers** (what the islander leaves with) are derived, not a third
  ledger: `followers ∝ fame × (1 + 0.6 × approval / 100)`, so the multiplier
  runs 0.4 (hated) to 1.6 (adored). With equal screen time the loved islander
  gains the most, but a heavily aired villain still out-gains a quiet
  favourite — hate-follows are real, brand deals are not. Career pages read
  followers; the post-show life layer can read approval for which offers
  arrive.
- **Only aired events write either ledger.** Each event type has a weight;
  per-event approval moves 0.3–1.5, major moments 4–8. Drama earns fame on
  its own and approval when magnetic (the villain-wins case, UK series 8).
- **Per-episode cap ±12**, with inertia (EMA). **First-impression window**:
  an islander's first 3 episodes cap at ±24. **Major moment** (caught
  cheating on camera, a public dumping of a partner, an on-screen betrayal, a
  big declaration, standing up for someone bullied, a bombshell entrance, a
  late revelation) lifts that episode to ±35. Loved → Villain takes at least
  two episodes.
- **Labels** with two-episode hysteresis: Fan Favourite ≥ +60, Loved +25…+60,
  Liked +5…+25, Invisible −5…+5, Divisive −25…−5, Disliked −60…−25,
  Villain < −60.
- **Couple score** = 0.65 × higher partner's approval + 0.35 × lower +
  **belief** (does the public buy it: aired loyalty up, aired straying down,
  sympathy to whoever is mugged off). One star can carry a hated partner
  (+70 / −50 → +28 before belief); belief can still sink a carried couple.
- **Individual votes** ("only one of you", favourite bombshell) read
  individual approval.
- **Vote shares**: softmax over couple scores with seeded noise; revealed
  bottom-up on screen; full table at the final.

**The rule change this show owns.** §8 says nothing in the engine may read
the crowd ledgers back, because Traitors writes them from ground truth. Here
the public vote *is* the engine reading them. Allowed because (a) the ledgers
are written from aired events only, and (b) only the public-vote step and a
bombshell's arrival read them. No islander decision reads them. §8 gets a
paragraph saying so, and a source guard asserts the reader list.

---

## 9. Decisions

### 9.1 Recoupling
The picking group chooses one at a time; the picked has no say; if two pick
the same islander, that islander decides. Chooser scores each compatible
islander on perceived connection (weighted by `love`/`settle-down`),
attraction (`fun`/`stir`), safety ("will they stick with me", `strategic`,
`win`) and a stay-put bonus for the current partner (`loyalty`). Steals
allowed (major moment for both). Single at the end = dumped, unless a twist
night. **Reveal order shuffled** and measured against the chance line (§11.5 P).

### 9.2 Villa dumpings
Public produces the bottom couples; one of four formats finishes: boys pick
a girl / girls pick a boy, safe islanders pick a couple, only one of you
stays, public dumps outright. Villa votes are ballots on perceived bonds,
friendship groups and threat to one's own couple. Only scheme-eligible
archetypes may say one name and vote another.

### 9.3 Bombshells
Dates, then a steal by attraction + eyes-on, weighed by the chance of a yes
(a rejected date is its own scene). Stealing from a Fan Favourite couple is a
major moment and costs approval.

### 9.4 Casa Amor
Secret stick-or-twist per original islander, proportional to best Casa
attraction − connection with partner, + `fun`/`stir`, − `loyalty`, +
**fear** (low trust → "they'll twist anyway"). Casa nights produce hidden
events (shared bed, pool kiss), some aired. The return reveal is the season's
biggest major moment.

### 9.5 Walking out
Rare. Connection collapse after a steal or Casa, low `temperament`, nobody
left they fancy. Exit `walked` on `exits[]`; earns sympathy.

### 9.6 The final
Declarations sourced from real connection (intuition shapes how honest they
sound) → public-only vote → optional split-or-steal (steal chance from
`money` intent, low `loyalty`, low connection; measured, since the real UK
rate is zero).

---

## 10. The dumping scene

Its own screen, not a line. The five items below are **phases**, each
carrying as many events as the night produces (a big dumping runs to
20–30 events), with confessional cutaways throughout.

1. **Build-up** — Dior's pause, at-risk couples standing, faces lit one at a
   time; order carries no result.
2. **Verdict** — who is dumped, and **who voted for whom** on villa-decided
   nights, revealed in front of everyone.
3. **Reaction** — the partner left behind (heartbroken / relieved / "I'll
   wait for you"), confrontations with the voters, sides forming.
4. **Goodbye** — hugs, the walk out, last words (sympathy moment).
5. **Fallout** — back in the villa: blame, the newly single panicking.

Every beat moves bonds; the ballots reveal is a grudge source.

---

## 11. The reunion (episode 16)

The payoff of the aired/unaired gap: a **"what they didn't show you"** reel
(hidden events aired for the first time, each moving approval and fame),
couple status months later, a Casa secret surfacing on stage. Reuses the Big
Brother reunion's betrayal-ledger reading.

---

## 12. The Perfect Match tab

**Cast builder:** per-islander intent, type (look tags + vibes), own look
tags, icks, interests, bonus interest, eyes-on, ex, persona override — each
with "roll".

**During a season:** couple board, attraction/connection grid, approval and
fame over time, labels, aired vs unaired ledger. Gated to the current
episode and read from per-episode snapshots, never live state (§11.5 B).

---

## 13. Export

Reuse `votingHistory[]` with channels, the Traitors pattern (§5), avoiding a
fourth round shape and the six `season_ref.html` branches:

- `recoupling` — each pick is a ballot for a partner
- `public` — bottom couples with vote shares
- `villa` — dumping ballots
- `casa` — stick/twist, revealed after the fact

Exits on `exits[]` with verbs `dumped` / `walked` via `exitVerbs()`. Co-winners:
the winning couple are both `placement: 1` (§14.6, `seasonWinners`); the
final's percentages are prose, not `winner.vote` (§14.6). Every reader of a
ballot channel must learn the new channels (§14.1); public surfaces must not
treat `recoupling` picks as votes against anyone.

---

## 14. Architecture

- `js/pm/*` engine modules + `js/pm-run.js` (`playPerfectMatchSeason`, runnable
  flag). Dispatch in `run-ui.js` in **both** places (§2).
- State in `gs.pm`; rounds at `pm.episodes`; `gs.episodeHistory` rows
  stamped `format: 'perfect-match'` with `{ num, eliminated, exits }` (§8).
- **Per-episode rng streams** (`streamFor(seed, salt)`) from day one; the
  engine returns what it ran; aired episodes freeze; ↺ re-runs, never re-airs
  (§11.5 M, N, O).
- Reuses: bonds + perceived bonds, `romanticCompat`, `addBond`, edit-layer
  tone taxonomy (`classifyEventTone`), `js/audience.js`, the crowd two-ledger
  pattern, `franchise-meta.js` (widened for exes).
- Calls `updateEditLayer` per episode and `finalizeEditSeason` at the end
  (§15: drag forgot).
- `CONFIG_SCOPE` entries only for controls the engine reads (§3); twists
  carry `format: 'perfect-match'` (§4).
- Screens: per-show VP screens, pinned stage kit (§6.5), stage profile +
  sets in `js/stage-shows.js` (§12), social pack `js/social/packs/perfect-match.js`
  (§14.10), ratings `readSignals` wired after the first played season (§2.5).
- Every store shared code writes (`gs._pendingDepartures`,
  `gs._pendingExpulsions`, `gs.allianceDissolutions`) has a consumer or is
  not written (§11.5 A).

---

## 15. Audit and guards

`npm run audit:pm-spec` — written **before** polish (§15). A hundred
seasons, every rate beside its chance line:

1. Share of seasons with ≥ 1 Fan Favourite and ≥ 1 Villain — measured at
   episode 8 AND episode 12. **Measured 2026-09-22, 100 seasons, at the
   shipped scene gain of 5.0: ep 8 → 33%, ep 12 → 70% (a fan favourite 99%,
   a villain 70%).** The spec first asked for most seasons by episode 8;
   approval only accrues from aired scenes, and this show's biggest moments
   (Casa, the photos) land at 8–11, so episode 12 is the honest bar. End-of-
   season labels spread across all seven tiers with no saturation.
2. No label jumps more than two tiers in one episode without a major moment.
3. About a quarter of the cast still Invisible at any point.
4. Fame and approval not in lockstep (famous-and-hated islanders exist).
5. Carried couples survive public votes above chance.
6. Last recoupling picker decides the dumping vs `1/n`; first/last revealed
   bottom couple vs the result.
7. Casa twist rate by loyalty band; photos surface at least one hidden event
   most seasons.
8. Split-or-steal steal rate (should be low).
9. Every screen's rendered text measured (claimed-but-empty screens, §15).
10. Events per episode ≈ 100; no line repeats within a season.
11. Relationship variety: per season, how many pairs ever carry each §6.4
    label (hidden crush, faking it, one-sided couple, friend-zoning, just
    friends, fancies-but-can't-stand). Every label should appear in most
    seasons; a label at zero is a system that runs and reaches no screen.
12. Faking and manipulation only ever come from scheme-eligible islanders
    (rule: 0 violations).
13. The ladder: per season, couples reaching each step; asks declined;
    status mismatches surfaced; steps back down. Every rung should be
    reached in most seasons, `official` in a minority.
14. Emotions: jealousy episodes by attachment band (anxious > secure before
    a threat is confirmed; secure ≈ anxious after), how each came out
    (confront / sulk / retaliate / reassure / hidden), walks by cause
    (heartbreak / solidarity / homesick), rebounds after heartbreak.
15. Stress rises across the season (mean stress in week 5 above week 1).

Guards: vocabulary both directions (§14.10), ledger reader list (§8 rule
change), islander decisions never read approval/fame, bombshell reads aired
only, reveal-order spoilers, stage at rest shows nothing, replay freezes aired
episodes. Each verified by breaking the thing it guards (§11.5 J).

---

## 16. Order of work (§10)

1. Registry entry. 2. Duplication sweep (§13 commands + the guard).
3. `CONFIG_SCOPE` + the Perfect Match cast tab. 4. Engine behind the flag,
dispatched in both places, with the audit. 5. Export. 6. Publish one season.
7. Screens against that season. 8. Ratings signals. 9. Franchise carry-over
(exes, returning Casa islanders). 10. AI fills last.

## 17. Out of scope for v1

Are You The One mode (later, on this engine via the registry-entry pattern),
All Stars, Love Island Games, the aftersun companion show, roster-level
promotion of cast fields (after the first played season).
