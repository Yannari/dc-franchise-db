# The Ridonculous Race: the scene catalogue

Every kind of moment the race can air, from the 26 Ridonculous Race episodes (`ep N` below) and the Amazing Race's
rules and four seasons read leg by leg (`TAR`). Written 2026-10-18 after the user's point: "it's supposed to feel
realistic like the real show, but flow well, conversation", against a first engine plan that had six encounter
types. This file is the contract between the engine and the dialogue:

- **the engine** offers these moments, decides each one's ending, and applies its consequence;
- **the dialogue** writes each kind as whole exchanges (8–12 lines, each answering the one before), keyed
  `long.<kind>.<ending>`, gated on the facts listed here.

**Rules that hold for every row** (`CLAUDE.md`, the manual's §19):

- **Every moment changes something**: a bond, the mind (morale, stress, energy), time, money, a belief, a choice,
  a thread, popularity. Nothing purely cosmetic.
- **Nobody refers to what they didn't see.** `seenBy` is set by the engine.
- **The engine decides the ending first**, then the words describe it.
- **Nice archetypes never scheme or sabotage**; neutrals only with `strategic >= 6 && loyalty <= 4` (marked ⚑).
- **Group moments seat three or four people** when the place has them (a queue, a plane, a closed temple at
  night). Lines never count heads.

**Roles**: `a`, `b` = the team at the centre (or `a` alone); `c`, `d` = a second team; `x`, `y` = bystanders who
join; `h` = Don; `l` = a local (driver, judge, agent).

**Effects shorthand**:

| Effect | Meaning |
|---|---|
| bond ±n | between the two named |
| mor, str, nrg | morale, stress, energy |
| min ±n | minutes for that team |
| $ | money |
| bel | a belief recorded (who's ahead, who did it, who likes whom) |
| thr | a thread advanced (§ Threads) |
| pop | popularity |
| rv | rivalry rows |
| owe | a gratitude debt |
| lead | the team's leader flips |

---

## 1. The partners, at every stretch

The bulk of the show: what the two say while they do the race. The talk layer offers one or two of these at nearly
every stretch, chosen by the situation.

| Kind | When it fires | Endings → what changes | Lines need | From |
|---|---|---|---|---|
| `tip-read` | a tip is pulled | `clear` · `puzzled` (min +3–10, Travel/brains roll) · `misread` (min +15–30 later, found on the way) | the tip's title and task, who reads it | every ep |
| `decide-side` | an Either/Or board | `agree` · `overruled` (bond −0.5, the leader's pick) · `compromise` · `swayed-by-watching` (the side others struggle on) | both sides, what they saw | ep 5, 9, 15, 19; TAR every leg |
| `whose-botch` | a Botch teaser | `obvious` (alternation) · `volunteer` · `pushed` (bond −0.5, str +5) · `teaser-guess` (what they think the task is) | the teaser, last Botch | ep 3+, TAR |
| `which-way` | a navigation stretch | `right` · `argue-right` · `argue-wrong` (min +10–40, bond −1) · `ask-local` (→ §5) | the place, the map | ep 10, 12 |
| `transport-pick` | taxi or bus or walk | `taxi` ($) · `cheap` (min) · `split` (str +3) | money left | TAR |
| `plan-the-leg` | a plane, a bus, a wait | `strategy` (a decision recorded: target, task order) · `drift` (talk goes elsewhere: home, food) · `ignored` (one partner won't engage: Spud's "party harder") | leg wins, rank they believe | ep 10, 13 |
| `pep-talk` | a failed attempt, a fear | `works` (next attempt pass +0.08, mor +5) · `falls-flat` (str +4) · `backfires` (the snap chance doubled this stretch) | what failed | ep 16, 17 |
| `manage-partner` | a reluctant or slow partner | `bribe` (snacks) · `reverse-psych` (Ryan's "loser") · `distract` (talk about cold things) · `token` (a lucky hat) · `cover-mouth` (do it yourself) → the partner's next attempt pass +0.06–0.12 | the partner's quirk | ep 5, 8, 10, 16 |
| `fear-through` | a task on a type the person fears (bold/temperament low) | `talked-down` (attempt goes ahead, bond +1) · `freezes` (min +10–25) · `swap` (an All-In role swap, if allowed) | the fear, the height/water/animal | ep 1 (Devin), TAR |
| `refuse` | a costume, a helmet, a food that breaks a principle | `relents` (min +5–15) · `holds` (penalty or Either/Or switch) · `adapts` (Crimson colours the skirt black: min +10) | what, why it matters to them | ep 1, 8; vegans ep 5 |
| `embarrassed` | a public or silly task | `does-it` · `bargains` (Junior: "if you wear the skirt…") · `role-swap` | who might see (home, school) | ep 8 |
| `blame` | a fail, a penalty, a wrong turn | `accepted` · `deflected` (bond −1) · `blow-up` (→ snap) | what went wrong, whose call | ep 2, 5, 17 |
| `celebrate` | a pass, a lead, a leg win | `hug` (bond +0.5, mor +5) · `gloat-at-others` (→ §2 `gloat`) · `jinx` (Dwayne: "content even if we're eliminated"; a 10% travel mishap next stretch) | the place, the rank | ep 16, 24 |
| `old-wound` | stress high + a trigger (the task, a word) | `surfaces` (bond −1, thr `secret`) · `told-calmly` (bond +1) · `explodes` (→ snap) | the backstory, from the roster profile only | ep 7 (the Olympic drop), 8 (the trophies) |
| `money-worry` | money < next stretch's cost | `plan` (cheaper choices next leg) · `blame` · `beg-now` (→ §6) | $ left | TAR |
| `watching-botch` | the watcher at a Botch | `cheer` (botcher pass +0.04) · `coach-illegal` (⚑ or high stress; penalty if seen) · `nerves` (str +4) · `quiet` | the task, the attempts | every Botch |
| `silent-treatment` | after a snap or a fight, the next 1–3 stretches | `thaws` (→ makeup) · `holds` (teamwork −) · `breaks` (→ blow-up) | what they fought about | ep 9 (the Daters) |
| `makeup` | snapped, the next stretches | `apology` · `laugh-it-off` · `grand-gesture` (bond +1.5) | the snap | ep 7, 13, 17 |
| `breakup` | a dating team, bond ≤ −4, last or near last | `ends-it` (rel → exes, thr) · `not-yet` | the leg, the fights | ep 8 |
| `back-together` | exes, bond ≥ 4 | `kiss` (rel → dating, thr) · `almost` | the race behind them | ep 23 |
| `homesick` | morale low over several legs | `misses-home` (mor −5) · `partner-lifts` (bond +1, mor +8) · `wants-out` (→ §9 quit talk) | family ties (real ones only) | TAR, ep 13 (the call) |
| `call-home` | the reward | `joy` (mor +25) · `bad-news` (mor −20, thr: Shelley dumps Devin) | who's at home (family, `atHome`) | ep 13 |
| `bond-moment` | a quiet stretch, good bond | `laugh` · `memory` (how they met, from the roster) · `gratitude` (bond +1) | how they know each other | every ep |
| `separation` | partners split by a vehicle or a wrong turn | `regroup` (min +) · `different-rules` (each goes elsewhere; the mat needs both) | the place, the family rule | ep 12 |
| `leader-shift` | an injury, a crush, anger, a win | `takes-charge` (lead) · `gives-way` | why | ep 10, 15, 22, 24 |

## 2. Teams together (two teams at one place)

Offered by the clock whenever two teams overlap.

| Kind | When | Endings → what changes | From |
|---|---|---|---|
| `size-up` | first meeting this leg, a queue | `friendly` (bond +0.5) · `wary` · `dismissive` (bond −0.5) | ep 1, 2 |
| `small-talk` | a wait, both calm | `click` (bond +1) · `awkward` (Owen and the invisible LARPer) · `overshare` (a fact learned: bel) | ep 1, 8 |
| `queue-jump` | a capacity queue | `allowed` · `called-out` (bond −1, rv +1) · `fight` (min +5 both) | ep 6 (Taylor and Mickey), ep 5 |
| `alliance-pitch` | strategic ≥ 6 pitcher, a wait | `accepted` · `refused` (personality: "too cheerful") · `trial` (a probationary alliance) · `laughed-off` | ep 2, 6, 9, 11, 17 |
| `alliance-check` | allies meet | `solid` (bond +0.5) · `doubts` (bel: "would they sell us out?") · `test` (a small favour asked) | ep 21, 22 |
| `alliance-betrayal` ⚑ | an ally passes up help or sabotages | `discovered` (bond −3, rv +2, thr) · `hidden` (bel only for the betrayer) | ep 13, 21 |
| `deal` | one team needs something | `struck` (help ↔ alliance, a ride ↔ a promise; recorded) · `refused` | ep 10, 13 |
| `deal-broken` ⚑ | the deal's moment comes | `walk-away` (bond −3, rv +2, pop −2) | ep 13 (the cell) |
| `trash-talk` | rivals, or identity friction | `exchange` (rv +1, mor ±3) · `one-sided` · `escalates` (→ shove) | ep 3, 7, 25 |
| `gloat` | passing a rival, or at the mat | `rubbed-in` (target mor −5, rv +1) · `backfires` (the gloater trips: min +5) | ep 3, 21, 24 |
| `shove` ⚑ | rivals, temper low | `shove` (min +5–15 both, rv +2, penalty if seen) · `held-back` (a partner stops it) | ep 7 |
| `help-offer` | the other struggling | `accepted` (helper min +5–15, helped min −10–20, owe, bond +1.5, pop +2) · `refused` (pride: bond 0, str +3) · `rejected-rudely` (bond −1) | ep 4, 8, 9, 18 |
| `rescue` | danger (an animal, a fall, water) | `saves` (as above, ×2; thr `crush` possible) · `both-stuck` (the Surfers up the tree: both min +20) | ep 1, 9, 18 |
| `mentor` | an older/experienced person and a younger one | `advice` (bond +1, the mentee's next task +0.05) · `bad-advice` (Dwayne's breakdance) | ep 15 |
| `tug-of-war` | two teams want one object | `win` / `lose` (min ±5–15, rv +1) · `share` (bond +1) · `third-team-takes-it` | ep 8 (a ring), 25 (a map) |
| `collision` | two teams on the same path | `crash` (min +5–10 both; a tie at the mat in ep 6) · `apology` (bond +0.5) · `blame` (rv +1) | ep 6, 16, 19, 22 |
| `accusation` | a sabotage nobody saw clearly | `right` (rv +2) · `wrong` (the innocent team: bond −2, a new feud; the Cadets blame Devin) | ep 23 |
| `confront` | a sabotage that was seen | `denied` · `admitted` · `revenge-vowed` (thr `rivalry`) | ep 13, 22, 25 |
| `tag-along` | a separated racer, a lost team | `welcomed` (bond +1) · `awkward` (they argue in front of him) | ep 12 (Junior with the Daters) |
| `follow` | a team unsure of the way sees another | `follows-right` · `follows-wrong` (min +15–40 both; the Rivals misled by Owen's smell) | ep 3, 10 |
| `mock-the-struggle` | a team failing in front of another | `laugh` (rv +1, target str +5) · `sympathy` (bond +0.5) | ep 13 (Josée in the mud) |
| `console` | a team just eliminated, or devastated (Devin's call) | `kind` (bond +1) · `clumsy` | ep 13, 25 |

## 3. Group rooms (three or more teams)

Where the show's crowd scenes come from: the airport, the plane, a bus, a closed place at night, the queue, the mat.

| Kind | When | Endings → what changes | From |
|---|---|---|---|
| `airport-crowd` | 3+ teams at the airport | `scramble` (who gets the desk first: seat order by boldness/social) · `cooperate` (an alliance shares the agent) · `lie-about-flight` ⚑ (bel false for a rival) | ep 7, 24, 25; TAR |
| `plane-row` | a flight with 2+ teams | `seatmates-talk` (a pair from different teams: bond, bel) · `sleep-talk` (overheard: bel) · `plot` (two people plan something: matchmaking, a Boomerang) · `fear-of-flying` (a calming partner) | ep 2, 9, 10 |
| `bus-ride` | a shared bus or cart | `lead-lost` (the front team realises everyone's on it: mor −5) · `games` (charades: bond +0.5 all) · `squabble` | ep 5, 7, 8 |
| `closed-for-night` | a place that opens at a set hour | `campfire` (bonds +0.5 all present, bel) · `secret-meeting` (an alliance plans) · `cant-sleep` (nrg −) · `prank` ⚑ | TAR overnight rests |
| `queue-crowd` | 3+ at a capacity station | `banter` · `bottleneck-fury` (str +5 all) · `who-goes-next` (an order argument) | ep 1 (the elevator), 11 (saunas) |
| `watching-together` | teams waiting while one performs | `cheer-a-rival` (bond +1) · `heckle` (rv +1) · `learn-from-it` (copy the winner: next attempt +0.1, ep 11) | ep 11 |
| `mat-crowd` | teams already on the mat as another arrives | `applause` · `boos` (a villain) · `relief` (a friend survives) | ep 21, 23 |
| `superteam-pick` | an Intersection | `chosen` (bond +1, alliance signal) · `left-over` (mor −5) · `forced-with-enemies` (rv; Sanders: "hate the others more") | ep 21; TAR |

## 4. Romance and matchmaking

| Kind | When | Endings → what changes | From |
|---|---|---|---|
| `crush-noticed` | a third person with high intuition watches a crush | `radar` (bel: who likes whom; thr `crush`) · `teased` (the crusher str +5) | ep 8 (Kitty's love radar) |
| `crush-confided` | the crusher and a confidant (never the partner they love) | `coached` ("life is short, tell him") · `sworn-to-secrecy` | ep 8, 13 |
| `matchmaking` | two friends of a pair, both see it | `plot` (a set-up next leg) · `meddle-badly` (Owen blurts it out: the target mor −5) | ep 9, 10 |
| `flirt` | `romanticCompat`, different teams, a queue or a task | `returned` (spark +) · `missed` (oblivious) · `rebuffed` (mor −5) | ep 9, 10, 26 |
| `near-kiss` | spark high, a quiet moment | `interrupted` (by a team, a train, soot: thr stays open) · `kiss` (couple) | ep 15, 18, 23 |
| `confession-attempt` | thr `crush`, the crusher with courage (bold + stress) | `interrupted` (the most common ending: a taxi, a cell, a call) · `chickens-out` · `misheard` ("I love unibrows") · `said` (→ reaction) | ep 13, 22, 23 |
| `confession` | said | `mutual` (couple) · `not-now` (Emma: after the race) · `crushed` (mor −15) · `reversed` (the other just gave up: ep 19) | ep 16, 19, 24 |
| `jealousy` | one of a couple or crush sees the other close to someone | `sulk` (bond −1) · `scene` (a confrontation) · `pepper-in-eyes` (a self-inflicted mishap: min +) | ep 20, 21 |
| `romance-costs` | a couple or crush delays for the other | `waits-for-them` (min +10–30: Noah's sauna) · `lets-them-pass` (an alliance place handed over at the mat) · `focus-lost` (task pass −0.05; the partner takes charge) | ep 9, 11, 15 |
| `goodbye-kiss` | one of a cross-team couple is eliminated | `promise` ("meet me at the final") | ep 18 |

## 5. Locals, drivers, judges and agents

| Kind | When | Endings → what changes | From |
|---|---|---|---|
| `driver` | a taxi or hired car | `fast` (min −5) · `lost` (min +20–40) · `pressured` (asked to speed: radio turned up, or a speeding penalty) · `scenic-detour` · `helpful` (knows the place: min −10) | ep 3, 25; TAR |
| `ask-directions` | a navigation stretch | `right` · `wrong` (the cotton-candy vendor: min +20) · `language-gap` (min +5–15; people skill limits it) | ep 26; TAR |
| `agent` | an airline desk | `sweet-talked` (a better seat, or a rival's worse one ⚑) · `strict` · `intimidated` ⚑ (fails: Josée's tantrum) | ep 24, 25; TAR |
| `judge-no` | a judged task fails | `explains` (next attempt +0.05) · `stone-faced` (str +5) · `slaps` (Dwayne and the swan lady) | ep 5, 7, 11, 24 |
| `judge-yes` | a judged task passes | `approved` · `grudging` | every judged task |
| `local-rule` | a cultural rule (don't take the rock) | `respected` · `broken` (thr `curse`, bad luck for legs) | ep 8 |
| `local-help` | a local offers help unasked | `accepted` · `refused` (a rule) | TAR |
| `vendor` | buying something on the route | `haggle-win` ($ saved) · `ripped-off` ($) | TAR |
| `crowd-performance` | a task judged by a crowd (air guitar, a dance) | `bomb` (back of the line, mor −5) · `wins-them` (mor +10) | ep 11, 15 |

## 6. Money

| Kind | When | Endings → what changes | From |
|---|---|---|---|
| `beg` | money short where allowed | `generous` ($ + more) · `scraps` (just enough, min +) · `chased-off` (min +, mor −5) · `shamed` (pop ±: a sympathetic or a pushy beggar) | TAR |
| `sell` | something bought earlier, money short | `sold` ($) · `no-buyer` | TAR |
| `borrow` | an ally team with cash | `lent` (debt) · `refused` (bond −1) · `gift` (no debt, bond +2, pop +1) | TAR (teams giving money to a broke team) |
| `repay` | a debtor with money | `paid` (bond +1) · `dodged` (bond −2, a betrayal in the ledger after three legs) | — |
| `surrender` | the non-elimination penalty | `stripped` (Don takes the money or the bag; mor −15) · `defiant` (mor −5) | TAR |
| `spending-fight` | partners disagree on a cost | `saver-wins` (min +) · `spender-wins` ($) | TAR |
| `reward` | first at the mat | `prize-joy` (the reward) · `meh` (Don's small prize) | ep 9, 13 |

## 7. Information, deception and rumour

| Kind | When | Endings → what changes | From |
|---|---|---|---|
| `lie` ⚑ | a rival asks the way, the flight, the task | `believed` (bel false; min + for them) · `caught-out` (rv +2, pop −2) | TAR (teams may lie) |
| `share-info` | an ally asks | `shared` (a better flight, the right side; bond +1) · `held-back` (bel: "they know something") | TAR |
| `overheard` | a team near another's talk | `learns-plan` (bel; a Boomerang target, a crush) · `mishears` (bel wrong) | ep 10, 11 (the dare) |
| `secret-used` ⚑ | a team knows a weakness (Spud can't refuse a dare) | `exploited` (target min +, rv +1) · `fizzles` | ep 11 |
| `rumour` | after a Boomerang or sabotage | `guess-right` · `guess-wrong` (Josée credits the Goths: a wrong feud) | ep 17 |
| `spy` | a team watches another's task | `copies` (+0.08 next attempt) · `caught-spying` (rv +1) | ep 4, 11 |
| `bluff` | a rival asks "how far behind are we?" | `bluffed` (bel wrong both ways) · `honest` | TAR |

## 8. Sabotage and its aftermath ⚑

Only for the archetypes that may scheme. Every sabotage has witnesses or none, and a cost.

| Kind | When | Endings → what changes | From |
|---|---|---|---|
| `push` | rivals close | `knocked` (target min +10–30) · `seen` (penalty 60) · `backfires` (the pusher falls) | ep 7, 25 |
| `ram` | vehicles side by side | `ram` (both min +, a third team passes: ep 16) | ep 3, 16, 26 |
| `steal` | an object the target needs (a fossil, rabbits, a ball) | `taken` (target min +20–40) · `refused-at-mat` (Don: "no sharing", the victim starts over) · `caught` | ep 5, 14, 22 |
| `kidnap-pet` | a team's mascot or lucky object | `taken` (the target abandons the task to search: min +40–90) · `escapes` (the thieves pay: penalty) | ep 20 |
| `course-sabotage` | equipment the target will use (brakes, oil on an emu, an uncoupled carriage) | `works` (min +) · `penalised` (1 h) · `hurts-saboteur-too` | ep 22, 23, 24 |
| `fake-shortcut` | a lure (a painted albino rabbit) | `chased` (target min +30–60) · `seen-through` | ep 14 |
| `mind-game` | a lie meant to rattle (your partner's mad at you; the air is full of bacteria) | `rattled` (target str +15, a fail) · `steels-them` (the target bonds: Surfers ep 17) | ep 11, 17 |
| `admin-sabotage` | the ticket desk | `worse-seats` (rival seated by the toilets) · `later-flight-attempt` (fails if they arrive first) | ep 24, 25 |
| `free-ride` | another team's leftover result (a bucket of drool) | `used` (min −) · `called-out` (rv +1) | ep 18 |
| `revenge` | a team with a grudge and a chance | `paid-back` (rv +, the cycle) · `takes-high-road` (bond +, pop +2) | ep 13, 22, 26 |
| `comeuppance` | a saboteur's luck turns (Loki scares the burros) | `penalty` · `elimination-by-victims` (the bleachers cheer) | ep 20, 26 |
| `save-your-enemy` | an enemy in real danger | `saves` (bond +1, rv −1, pop +3; "so we can beat them ourselves") | ep 25 |

## 9. Body, fear and limits

| Kind | When | Endings → what changes | From |
|---|---|---|---|
| `injury` | a roll on physical tasks (×1.5 adversity identity) | `minor` (min +) · `carried` (the partner carries: nrg −20 the carrier, bond +1) · `serious` (→ medevac) | ep 1, 2, 22, 24 |
| `illness` | food, heat, altitude, spice | `pushes-through` (nrg −) · `blind-from-spice` (the partner drags them: min +) | ep 1, 2, 23 |
| `exhaustion` | energy < 15 | `collapse` (min +20) · `second-wind` (boldness) | TAR |
| `gross-out` | a stomach task | `keeps-it-down` · `vomits` (loop) · `chain-reaction` (others nearby gag: str +) | ep 2, 5, 10 |
| `phobia` | a task on someone's fear (claustrophobia, heights, flying) | `panic-break` (Josée bursts the bars: an accidental win) · `freezes` · `overcomes` (mor +10) | ep 2, 13, 22 |
| `quit-talk` | stress high, a task failed many times | `talked-back` (bond +1) · `quits-task` (4 h penalty) · `quits-race` (out; Don's verdict) | TAR; ep 11 (the Goths) |
| `delayed-reaction` | a quirk that lands later (Spud's pain) | `kicks-in` (min ±) | ep 6, 14 |

## 10. The place itself

| Kind | When | Endings → what changes | From |
|---|---|---|---|
| `arrival-awe` | first sight of a place | `wonder` (mor +5) · `dread` (str +5: the Goths and sunshine) · `homecoming` (an identity's place: the Goths at the castle) | ep 7, 8 |
| `identity-moment` | a task on the team's identity | `in-their-element` (the Ice Dancers' tango; others call it unfair: bond −0.5 with them) · `out-of-element` (mor −5) | ep 15, 24 |
| `cultural-task` | a task with meaning (a ritual, a gift) | `moved` (mor +10, bond +1) · `disrespectful` (a local offended: min +, pop −2) | ep 8, 12; TAR (the orphanage) |
| `souvenir` | a team takes something | `kept` (thr `curse` or a lucky charm) · `left` | ep 8 |
| `identity-crisis` | an identity stripped away (the makeup melts) | `hide` (paper bags) · `quit-and-unquit` · `accept` (bond +2) | ep 11 |
| `weather` | wind, storm, heat | `wait-it-out` (paraglide or hike: TAR) · `push-on` (risk) | TAR, ep 10 |

## 11. Don

| Kind | When | Endings | From |
|---|---|---|---|
| `don-opener` | each place | "X! Home of A, B, and something that annoys me" | every ep |
| `don-demo` | each task | the gag (a shark lunges, a crab pinches) | ep 4, 6 |
| `don-rule` | a twist's first appearance | the rule, said once | ep 13, 21 |
| `don-place` | each team on the mat | `plain` · `bored` · `scared-of-them` · `penalty-reveal` ("you're the fourth team… however") | every ep |
| `don-fakeout` | the last team on a non-elimination leg | `relief` · `fury` (Laurie attacks Don) · `breakup-interrupted` | ep 5, 8, 12 |
| `don-elim` | the last team | `accepts` · `argues` (Gerry's foot) · `tantrum` | every elim |
| `don-arrives` | a team too far behind | by helicopter, on foot, at the stage | ep 4, 11, 18 |
| `don-ruling` | a dispute (a stolen fossil, a self-Boomerang) | `no-sharing` · `allowed` · `threat` ("try that again and you're out") | ep 5, 17, 18 |

## 12. The twists, as scenes

| Kind | When | Endings → what changes | From |
|---|---|---|---|
| `boomerang-found` | a tip with a Boomerang | `gleeful` · `torn` (a friend is the obvious target) | ep 13 |
| `boomerang-decide` | the holder at the board | `target-rival` · `target-threat` · `standoff` (two holders: "rip them on three", neither does) · `self-boomerang` (spite) · `wasted` | ep 13, 17 |
| `boomerang-hit` | the target learns | `fury` (rv +2) · `guess-who` (→ rumour) | ep 13, 17 |
| `boomerang-vote` | the vote at the start | each ballot with a reason; the target's reaction | TAR 29 |
| `yield` | a team yielded | `waits` (the hourglass), `courtesy-of` reveal | TAR |
| `express-give` | a second pass to give away | `to-an-ally` (alliance signal) · `to-the-weakest` (pity) | TAR 22–24 |
| `zip-it` | an optional task | `takes-it` · `beaten-to-it` (time wasted) | ep 21; TAR |
| `speed-bump` | the penalty task | `humiliating` · `quick` | TAR |
| `save-used` | the last team plays it | `saved` (the next-to-last goes out) | TAR 25 |
| `medevac-choice` | the injured team picks a returner | `repays-kindness` (the team they owe) | ep 24 |

## 13. Interviews

Both partners together in front of the map, unless the subject is private.

| Kind | When | Endings |
|---|---|---|
| `int-feeling` | after any big moment | the feeling and its reason, never a retelling |
| `int-contradict` | partners differ on something they just did | "I'm not too competitive." / "Yes, you are." |
| `int-about-team` | another team mattered this leg | respect, fear, a grudge, a crush |
| `int-secret` | a crush on the partner, a plan the partner doesn't know | solo |
| `int-strategy` | a decision (Boomerang, alliance) | the reason |
| `int-backstory` | a fact from the roster profile, once | how they met, why they're racing |
| `int-exit` | eliminated | what they got from it; warm, a last small joke |
| `int-bleachers` | the finale | who they root for, their take |

---

## Threads: what makes the season flow

A thread is a storyline the engine carries across legs. It has a state, it chooses which scene comes next, and it
ends. Each thread is opened by a scene above and advanced by others.

| Thread | Steps (each a scene kind) | Ends |
|---|---|---|
| `crush` | crush-noticed → crush-confided → flirt / near-kiss → confession-attempt (interrupted, often more than once) → confession | a couple, a no, a reversal, a goodbye kiss |
| `rivalry` | trash-talk → gloat → shove/ram → sabotage → confront → revenge … | a truce (save-your-enemy), a comeuppance, an elimination |
| `debt` | help-offer/rescue (owe) → repay or the chance to repay (let them pass, medevac-choice) | repaid, or remembered in the ledger |
| `secret` | old-wound surfaces → told → healed (bond +2) or broken | — |
| `curse` | local-rule broken / souvenir → bad legs → told by someone who knows → returned (a side trip) | luck back, a villain turn |
| `team-bond` | for teams that start with low bonds (stepbrothers, exes, rivals): blame → shared fail → common ground → bond-moment | a real team, or a split |
| `alliance` | pitch → check → test → betrayal or loyalty to the end | the ledger |
| `villain` | sabotage succeeds → victims' grudges → int-exit wishes → comeuppance | the bleachers |
| `underdog` | last → non-elim save → a climb | a final, or a proud exit |
| `breakup` | snaps → breakup → silent treatment → back-together or not | — |
| `broke` | money-worry → beg → borrow → repay | recovery |
| `injury` | injury → carried → recovery or medevac | — |
| `leader` | leader-shift events → a settled leader, or a partnership of equals | — |

**How a thread chooses the next scene.** At each stretch the talk layer asks every open thread involving the
people there whether it has a next step ready (its trigger true). Threads waiting longest and closest to their end
are preferred, so a crush that's been interrupted twice gets its confession before the season ends, and a rivalry
that's been building gets its payoff.

## Flow: how the moments become a show

1. **Every stretch and every wait offers talk.** At each stretch the partners get one moment from §1 (or a
   thread's step). At each overlap, two teams get a §2 moment. At each wait (a plane, a bus, a closed place, a queue)
   the people present get a §3 room.
2. **Whole exchanges.** A moment is 8–12 lines where each answers the one before. Some end interrupted, and an
   interruption leaves its thread open.
3. **Chains.** A moment can cause the next one: a gloat → a shove → a confront; a rescue → a crush noticed; a lost
   taxi → blame → a snap. The engine records the cause, and the director airs them in order.
4. **Pacing caps** (the manual's §19.2 step 4, adapted):
   - the same two people at most three moments per leg;
   - one blow-up per team per leg;
   - one romance beat per person per leg;
   - no warm scene between two teams on the leg one sabotaged the other.
5. **Every team at every task** is seen (the user's rule), so even a quiet team gets its task moments; the talk
   layer makes sure each team gets at least two partner moments a leg.
