# Total Drama: dialogue scenes and a stepped viewer

Date: 2026-10-06. Status: approved in conversation (approach A, phase order below).
Read with `docs/ADDING-A-SHOW.md` §17.2 and §18, and the Big Brother spec
`2026-10-01-bb-dialogue-viewer-design.md`, which this one follows.

## 1. Why

Total Drama's camp fires ~46 events an episode (seed 4242, real roster: 647 events,
~160 distinct types in one season; ~340 types defined). Almost every one is a
sentence of narration *about* a conversation, often ending on a knowing sting:

> Noah and Sierra made a final two deal. Whether it means anything is a question for later.

The game data underneath is rich (deals, pitches with who resisted and who leaked,
betrayals, endgame deals broken, showmances, vote plans). The words are missing.
The user wants episodes that play as fluent, plain-English conversation: strategy,
romance, drama. Challenge screens stay classic; everything else is rebuilt.

**Render, never invent (§18.3).** The viewer stages words the engine wrote, so the
dialogue lives in the engine and the record, and the text backlog prints the same.

## 2. Decisions (the user's)

| Decision | Choice |
|---|---|
| How dialogue is made | Engine scenes, converted family by family by airtime |
| What airs | Everything. Strategy, romance and drama as full scenes; flavour events as 1–2 line cutaways |
| Architecture | A: TD's own viewer (`js/vp-td-ep/`) and script layer (`js/td/script/`), on the shared picker. No shared kit with BB yet |
| Look | Blender-rendered spot backdrops, mockup approved first |
| Ceremony | The season's setting decides (§7): the vote is cast and counted as now, but staged as that setting's real ceremony |
| Voice | The show's own (§5.1), after reading TDI and Disventure Camp transcripts; the first plain pools were "a little too conversation" |

## 3. Phases

| Phase | Ships |
|---|---|
| 0 | Fix: gossip cards (`informationFlow`) filed under the wrong camp and the wrong phase |
| 1 | `js/td/script/` + the **strategy** families converted |
| 2 | Stepped viewer, default for TD, Classic switch; camp segments + cutaways; Tribal stepped. Mockups first |
| 3 | **Romance** families |
| 4 | **Drama** families |
| 5 | **Flavour** cutaways as short dialogue |
| 6 | Merge, twists, Rescue/Redemption Island, finale + FTC, aftermath — each its own set, mockup first |

## 4. Phase 0: the misfiled gossip cards

`episode.js` (~4513) takes `knowledgeEvents` from `simulateVotes` — gossip that
spread anywhere in the game — and pushes *all* of them as `informationFlow` cards
into the **tribal-going tribe's `pre`** camp feed. Seed 4242 ep 3: Gwen and Harold
(Gophers) appear in Bass's pre-challenge feed. Two wrongs: camp and phase.

Fix: file each card under the camp both people belong to (`merge` key when merged);
drop a card whose pair spans two camps (they could not have talked); push to `post`
(it happens after the challenge, during the scramble). Must still run before
`generateSummaryText`. Test: no `informationFlow` card lists a player outside its camp.

## 5. The script layer: `js/td/script/`

Mirrors `js/bb/script/`.

- **`scene.js`** — `makeScene(kind, who, data, seenBy, spot)`. The event decides
  everything (who, the ending, bonds, deals) and hands back a scene instead of a
  sentence. `witness(scene, name)` throws on a learner not in `seenBy`.
- **Spots** — `campfire · cabins · dock · mess-hall · beach · woods · confessional · boat`.
  Taken from the existing conversation-access location (`findConversationAccess`)
  when the event has one, else picked by the family before the words.
- **`facts.js`** — `TD_FACT_KEYS`: `ending, result, intent, reason, band, alliance,
  showmance, register, registerB, early, late, merged, tribal, immune, known, kin,
  spot, again, third, nice, villain`. A pool `when` may use only these (test-enforced).
  `register` (schemer/fiery/shy/sweet/competitor/cool/plain) is read from archetype
  and stats as BB's `registerOf` does; the picker weights a register line +4.
- **`write.js`** — `writeScene(scene, ctx, rng)` through `js/script/pick.js`.
  Ledger `gs.tdLineLedger`; clock `episode * 10 + phase` (pre 0, challenge 1,
  post 2, tribal 3). Lines are `{ kind: 'say' | 'conf' | 'beat', by, text }`;
  `conf` is a confessional. Returns `{ lines, text, lineId }`; `text` is the
  transcript and replaces the old sentence on the event, so classic screens and
  the backlog need no change. Episode 1 holds back past-tense lines (BB `noPast`).
  `writing.muted` (tests only) skips the pick.
- **Pools** — `js/td/script/lines/<family>.js`, keyed `<kind>.<ending>` with an
  optional `.any` merged in. Entry: `{ id, when?, turns: [{ by, say | conf | beat }] }`.
  Shape: one staging beat at most, 3–5 lines of real dialogue, end on an action.
  Speakers by role (`{a}`, `{b}`, `{c}`), people talked about via data (`{target}`),
  never a name in a pool. Ids unique across all pools (2-letter prefix per file).
- **Written when it fires**, so facts read the camp as it stood.
- **Zero displacement** — a converted event keeps a bare `Math.random()` draw where
  its old `_pick` was; words use `stableRng(seasonSalt, ep, eventIndex)`.

**The event shape after conversion:** `{ type, players, badgeText, badgeClass,
scene, lines, text, spot }` — `players`/badge untouched (spotlight and tests count them).

### 5.1 The voice (user, 2026-10-06)

The first pools were plain, polite two-person exchanges ("Final two?" "Final
two." "Thank you. I mean it."). The user: "a little too conversation — look up
Total Drama / Disventure Camp transcripts". From TDI *Who Can You Trust?* and
Disventure Camp 5, every pool follows:

- **An activity under the scene.** Strategy happens while doing something
  (breakfast, fishing, chores, a game), from the scene's spot.
- **Reasons, from real game facts.** A line that gives a reason names what the
  engine knows: a rival (`{rival}`, a's worst bond in camp), a challenge threat
  (`{threat}`), the last boot (`{lastBoot}`), a friend (`{friend}`). Computed
  into scene data at fire time (`td/script/context.js`), never invented.
- **Pushback.** Nobody agrees in two lines.
- **Attitude in the characters' own plain words** (sass, insults, comebacks).
  The narration stays plain; the humour belongs to the speaker.
- **Real idioms only.** "Owen thinks with his stomach", never an invented
  shortcut like "Owen thinks the challenge is a buffet" (user).
- **The confessional lands one sharp thought or reveal.**
- 5–8 lines a scene. No therapy-speak.

### Phase 1 families (strategy)

`informationFlow, sideDeal, infoTrade, votePitch, votePitchFailed, strategicApproach,
scramble, gamePlanProbe, gamePlanConfessional, bigMoveThoughts, tdStrategy,
endgameDealBroken, endgameDealDissolved, conflictingDeals, allianceForm,
allianceRecruit, allianceRefusal, allianceCrack, allianceExpelled, allianceDissolved,
betrayalReckoning, betrayalDenial, secretFlip, doubt, misattribution, rideOrDie,
loyaltyTest, loyaltyTestCaught, schemerManipulates, mastermindOrchestrates,
mergeScramble`. Order inside the phase: by fires-per-season (dump count).

## 6. The viewer: `js/vp-td-ep/`

Same shape as `js/vp-bb-ep/`, own files and look.

- `steps.js` — pure: record in, screens out, each a list of steps (one line, one
  stage direction or one reveal). Stage, script and side panel read the same list.
- `stage.js` — `stageHtml(screens, si, idx, fresh)` paints step N; only the newest
  step animates. `ledgerAt()` folds what is true at step N (immunity, alliances as
  of now, votes cast, votes read). Never `scrollIntoView`.
- `screens.js` — Next / Back / All / Restart / jump-to-line / auto / TV mode; a
  **Classic** switch on every screen landing on the same screen (by id, then by part
  of the episode, then by fraction). localStorage `td-vp`='classic' to stay classic.
- `style.js`, `sound.js`, `titles.js`.
- Wired in `buildVPScreens`: TD episodes build the stepped list; classic screens not
  replaced keep their slot (BB's `REPLACED` pattern + slot map).

### Running order

1. **Previously on / cold open** — Chris recaps last episode's real events; ends on
   "Coming up…" that never gives away an outcome.
2. **Camp, pre-challenge** — one screen per tribe, a segment cutting spot to spot.
   Each cut opens on a time card (`DAY 4 · 7:12 AM — THE DOCK`); the clock never runs
   backwards. Scenes in full; flavour as cutaways between them. Setups air before
   payoffs (recruiting before the naming; a spark before the kiss).
3. **Challenge** — the classic screen in its slot.
4. **Camp, post-challenge** — the winners briefly, the losers' scramble in full.
5. **Tribal Council** (§7).
6. **After the vote** — walk-off; RI / Rescue and Tribal-replacing twists stay classic.
7. **Relationship web** (what moved), then **Debug** last.

### The stage

- Up to three faces in focus; others present smaller and dimmer.
- Confessionals cut to a close-up in the confession-cam frame, as a pull quote.
- Every action animated, read from stage directions (`actionOf`): shout = rings; hug
  or kiss = lean in (kiss pops a heart); storm off = slide out; tears; shove = shake;
  whisper = lean; laugh = bounce.
- Text pace: a short line punches in; a long one types and breathes at commas. On
  completion, names and game words light up.
- Title cards: alliance formed (name + founders in the scene), showmance official,
  betrayal, merge, idol found.

### Side panel — what the camp cannot see

Alliances as of this step; each player's vote plan and why (from the step it is
decided); bonds of the people on screen; crushes and showmances; secrets (idols
held, fake deals); the Camp log. Gated by the steps played. Facts recorded when they
happen (`bondsAt` on the scene), never read live from `gs` — a replayed episode
must show its own week's bonds (§11.5 V).

### Sound

Silent by default. Existing beds `bed-camp-day`, `bed-camp-night`, `bed-tribal`,
`bed-challenge`, `bed-victory` play only under fights, plans, romance, the challenge
and Tribal. A step can ask for `bed: 'none'`.

### Look

Blender-rendered spot backdrops (camp, cabins, dock, mess hall, beach, woods,
confessional, tribal fire), time-of-day lighting from `stage-sets-island.js`.
Mockups in `mockup/` approved before stage code: (1) camp scene + cutaway +
confessional; (2) Tribal. Both themes. 1100×900, 946×720, 400×800.

## 7. Tribal Council

**The ceremony is the setting's.** The vote is the same machine; how it is
staged is the season's setting (`currentSetting()`): `hosted-camp` —
marshmallows, the Dock of Shame, the Boat of Losers; `film-lot` — the awards
statuettes, the Walk of Shame, the Lame-o-sine; `world-tour`, `carnival` and
`survival-island` each their own (torches for a survival island). Each is
checked against the show's wiki before it is built (user 2026-10-06: "season
setting decides").

**Written at simulation time.** `buildTribalQA` leaves `vp-screens.js` for
`js/td/script/tribal.js` and runs in `episode.js` once the vote is decided; saved as
`ep.tribalScript`. Classic Tribal, backlog and viewer all read it. Selection logic
kept (top target, spearhead, swing voter, immunity holder, showmance pair); words
rewritten as exchanges, one follow-up from Chris allowed. The old "consequence"
commentary becomes a side-panel read.

Running order (verify against the Survivor wiki before building):
1. Arrival, torches; Chris on the challenge loss.
2. Q&A — 3–5 exchanges, one line per click; reactions on loud lines.
3. The vote — voters to the booth in turn; a few speak to camera (betrayal, flip,
   reluctant vote, showmance voting apart), words from `votingLog.reason` /
   `planBreak`. No ballot on screen before it is read.
4. Idols — `ep.idolPlays`: play, misplay, Safety Without Power, Shot in the Dark.
5. The read — one vote per click, tally under the urn; the deciding vote held alone.
6. Ties, revotes, rock draws — deadlock card, revote, rocks one by one.
7. The snuff — "the tribe has spoken"; the booted player's existing final words.

Classic (Phase 6), in their slot: double Tribal, Emissary, Exile duel, Chain of
Command, Slasher Night, Sudden Death, Triple Dog Dare, other Tribal replacements.
The Voting Plans screen is retired from the stepped viewer (all of it is in the side
panel, step-gated) and stays in Classic.

## 8. Testing and reading

Engine:
- **Zero displacement** — scratch baseline: 5 seeded real-roster seasons recording
  per episode immunity, boot, each camp event `type:players:badge`, each ballot.
  ALL IDENTICAL after every batch. Never committed; deleted by exact name.
- **`tests/td-script.test.js`** — pool keys real; `when` keys whitelisted; unique
  ids; no names in pools; no `{x.sub} has/is`; no narration-only entries; no past
  claims on episode 1; CLEVER denylist (ported from `pm-lines.test.js`, grown per read).
- **Knowledge** — `witness()`; `{target}` needs `known`; a reference to an earlier
  scene between two people is gated on a history fact from the record.
- **Done measure** — count of camp events with `text` and no `lines`, per type; each
  phase drives its families to zero.

Viewer:
- Every step of every screen of real seasons rendered; fail on a result before its
  step, or a reaction to something not on screen.
- Transcript = screen: backlog prints `tdStepTranscript` in the same order;
  `backlog-coverage` passes.
- Airing audit per event kind; vote machinery and romance ≥70%.
- Render completeness (longest line of each pool shown); every cue/bed exists;
  record round-trips through JSON.

Reading: after each batch, dump a seeded real-roster season and read it aloud —
plain English, cause on screen, no stings, no decoding. Screenshot harness for the
stage at the three sizes, both themes.

Out of scope: challenge screens; a shared stepped-viewer kit with BB; voices.

## 9. Build checklist

- [x] P0 gossip-card fix + test
- [x] P1 `js/td/script/` (scene, facts, write, context, lines/index) + td-script test
- [x] P1 baseline harness; convert strategy families in batches; read each dump
  (done 2026-10-06: 53% of a season's camp events speak; every strategy family except the
  merge announcements, which go with the Phase 6 merge set. Mechanisms added on the way:
  `withSceneCtx` for the camp generator, `scriptEventParts` for scenes in parts, `pendingScene`
  for modules below td/script (players.js, bonds.js), `afterVote` for beats the viewer must air
  after Tribal, `GUARANTEED` per pool file. Engine bugs fixed: gossip cards, ghost deal events,
  wrong-tribe suspect, recruit/refusal/dissolution/expulsion/reputation misfiled across tribes,
  a dozen event types with no badge or no players.)
- [ ] P2 Blender spots; mockups (camp, Tribal) approved
- [ ] P2 `js/vp-td-ep/` steps/stage/screens/style/sound/titles; wiring + Classic switch
- [ ] P2 Tribal script into the record; stepped Tribal
- [ ] P2 viewer tests, airing audit, screenshot pass
- [ ] P3 romance · P4 drama · P5 flavour · P6 merge/twists/RI/finale/aftermath
- [ ] ADDING-A-SHOW §18 updated with what TD taught
