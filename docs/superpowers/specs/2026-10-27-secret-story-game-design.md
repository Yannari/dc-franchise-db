# Secret Story — the game (part 2 of 4)

Date: 2026-10-27. Status: design, awaiting the user's approval.
Part 1 (the show itself) is built: `docs/superpowers/specs/2026-10-27-secret-story-show-design.md`.
Research: `docs/research/secret-story-france.md` (all 14 French seasons) plus the
niche material gathered for this part (clue auctions, the freeze, the parties,
the launch nights), cited where used.

The user, 2026-10-27: "start part 2 … ask yourself how to build the game to be
1:1 with the show in every possible way … every possible conversation, even the
more niche, like how they should get clues, what to do in the parties, how to
structure the first prime". So this document is written as the questions a
season raises, each answered from the real show first and then said as what the
simulator does. Where the real show varied, the answer names the variants and
the twist catalog (§13) carries them.

The anti-goals from part 1 stand: it must FEEL like Secret Story, never be
boring to read, never shallow, the hunt must be the best thing in it, and it
must be "enough".

---

## 0. What the game is, in one paragraph

Fourteen to eighteen people move into the House of Secrets, each hiding a
secret and holding a $10,000 kitty. They live together for ten to fifteen
weeks under the Voice, who sets rules, missions, games and dilemmas. They hunt
each other's secrets: clues arrive through games, missions, dilemmas and slips,
suspicion grows, and a housemate who thinks they know presses the red buzzer in
the confessional, faces the target in a confrontation, and stakes $5,000:
right, they take the target's whole kitty; wrong, they lose the stake and the
house learns who they suspected. Every week the confessional nominates and on
the prime, the live weekly show, the public saves all but one. The hunt closes
at the semi-final. The public crowns the winner, who leaves with the cheque and
their kitty.

Big Brother's house engine keeps running underneath (the house, the roster, the
social engine, bonds, romance, comps, the stepped viewer). Secret Story
REPLACES its week spine: no Head of Household, no veto, no jury, no house vote.

---

## 1. The shape of a season

**How long?** Real seasons ran 8 to 15 weeks (most 10–14), 15–20 housemates.
The simulator: one elimination a prime, cast minus four weeks to the semi, one
semi-final week, one final week. 16 housemates → about 12 weeks. Double
eliminations and late arrivals are twists (§13), not the default.

**What is a week?** The classic rhythm, which every season kept in some form:

| day | what happens | source |
|---|---|---|
| Friday (night of the prime) | the PRIME: dilemmas, the red phone, visits in the airlock, the elimination | S1–S9 Friday, S10+ Thursday |
| Saturday–Sunday | the weekend: the Voice's game for clues or money, a party night, family messages | S11 weekend games |
| Monday | a mission handed out, house chores, the hunt | |
| Tuesday | NOMINATIONS in the confessional | "traditionnellement le mardi" |
| Wednesday | the nominees campaign; a clue game; the supérette | |
| Thursday | the eve of the prime: tension, last buzzes, mission deadlines | |

The simulator's week is these beats in this order (§21). The prime is the
week's climax, not its start: the week's acts lead TO it.

**When does the hunt end?** At the semi-final prime. Secrets still hidden are
revealed to the house then. A season setting (`ssKeepBonus`, the revival rule)
doubles the kitty of anybody who kept theirs to the semi.

---

## 2. Launch night (le prime de lancement)

**How did it run?** One by one, in the studio: a portrait video, the host, the
secret shown TO THE PUBLIC (the house never hears it), the walk down the red
carpet through the airlock into the house. The Voice greets them inside. Twists
land the same night: two candidates where only one enters, chosen by a ten
minute public vote (S5: Anthony 75%, Élisabeth 25%, the loser's secret revealed);
best friends where one must sacrifice herself at the door (S11); a fake couple
assigned in the studio (S11, Kamila and Benoît); a group sent to a hidden house
(S3 intruders, S6 Secret Box, S7, S8 Secret Zone, S10 Hotel, S13 Crystal House,
S14 Yacht); a housemate who enters the next day (S12); the whole cast tricked
into a fake house with a fake Voice (S12).

**What the simulator does, in order:**

1. **Cold open.** The Voice's line over the house at night: "They all have a
   secret. Their mission: to keep it, whatever it costs. But will they manage
   without being unmasked? And above all, never forget: trust no appearances."
2. **The host opens the prime** in the studio (host chosen per season, §23).
3. **Arrivals, in an order the randomizer picks so twists fall in the middle.**
   Each arrival: their portrait card (age, hometown, one line from their
   casting interview), THEIR SECRET SHOWN TO THE VIEWER with a "the house
   doesn't know" mark, the walk through the airlock, the house's reaction
   (recognitions from part 1 fire here: "wait… you're from Total Drama 3"),
   one or two first impressions (the existing first-impressions system).
4. **The night's twist(s)** from the season's draw (§13): e.g. two candidates
   for one place and a public vote; a shared secret assigned live; a group sent
   to the hidden house.
5. **The Voice's first address in the living room:** welcome, the kitty
   (10,000 each), the buzzer, the ten commandments read out, the warning that
   breaking the first commandment (never reveal your secret) costs everything.
6. **The first night** (house life: unpacking, first alliances, first flirts,
   first guesses out loud).
7. **Credits tease** of the first mission.

Launch night is an episode of its own (week 0); nobody is nominated or
eliminated on it unless the draw says so (the S5 door vote, an S12 day-four
elimination by the four who solved the house's secret).

---

## 3. The Voice

**Who is it?** An unseen male voice, dry, all-knowing, occasionally funny
("the Voice's terrible jokes" were a running segment, S7), never shouting. It
calls people to the confessional by name, imposes rules and punishments, hands
out missions and dilemmas, and announces results. In S12 the cast thought it had
been replaced by a woman's voice: that was the house's shared secret.

**What does it say, and when?** The Voice is a CHARACTER in the stepped viewer
with its own line pools (part 3 writes them), triggered by:

| moment | example line shape |
|---|---|
| morning | "Good morning, housemates. Day 23. The buzzer is where it always was." |
| summons | "Ana, please come to the confessional." |
| rule reminder | "The Voice reminds Ben of the seventh commandment." |
| punishment | "Because Cy spoke about the nominations, the house loses its hot water for 24 hours." |
| mission handout (private) | "Dee, the Voice has a mission for you." |
| game call | "Housemates, all of you to the garden. The Voice has prepared a game." |
| freeze | "FREEZE." (nobody may move; used before a visit, S8) |
| confrontation | "Ana, Ben has buzzed you. You have one minute to convince him he is wrong." |
| reveal | "Ana, tell the house your secret." |
| joke | a bad pun, rarely, at a calm moment |
| the turn | late season, the Voice says more of what it knows |

**The ten commandments** (read on launch night; the S5–S9 list):
1. Stop everything and fall silent when the Voice speaks.
2. Do what the Voice asks at once and never contest a decision.
3. Never interrupt the Voice.
4. Never refuse a secret or collective mission.
5. Never reveal the existence of your secret mission.
6. Justify your nominations clearly and honestly.
7. Never talk about nominations with each other.
8. Never reveal your secret to another housemate.
9. Only ask to speak to the Voice from the confessional.
10. Always call the Voice "the Voice".

A season may draw the revival list (respect, look after the house, never reveal
your vote) instead.

**Punishments, from least to most** (all real): the house loses hot water; the
house loses the shopping (supérette closed); a forfeit at the next game; money
taken from one kitty; a clue about the offender's secret revealed; an extra
vote against them at the next nominations; nominated d'office (automatically,
with the public alone deciding); kitty wiped AND nominated d'office (revealing
your own secret, or giving heavy clues); exclusion (violence, threats; the house
sometimes votes on the return).

**Who breaks rules, and why?** Behaviour, not dice: temperament low and
boldness high → talks about nominations, contests the Voice; a showmance in the
first week → couples blurt "we're together" (S2's Caroline and Nicolas);
loyalty to a partner + a lot to drink at a party → tells the partner the secret
(S3 Jonathan and Maija); temperament very low + a fight → violence → exclusion
(S3, S4, S6, S8). Each slip is a scene with consequences, never cosmetic.

---

## 4. Secrets and what the house knows

**Where is a secret held?** In the knowledge model (`js/knowledge.js`), as the
part 1 research found it was built for: each secret is a ground-truth fact
`recordFact({ type: 'secret', subject: holder, payload: { text, kind } })`, and
`VALIDITY.secret = 99` (a secret never goes stale). Suspicion IS belief: a
housemate's belief about what X's secret is, with a confidence. A WRONG theory
is a belief in a fact with `truth: false` (e.g. "Ana was a stripper") — the
model already holds false facts.

**What is a clue?** One of four kinds, every one stored as an object on the
secret (part 1 wrote 3–5 per secret):

| kind | real examples | how it lands |
|---|---|---|
| object | a fern, a leopard scarf, a cube with "J", a padlock, a pierced book (S11, S14) | shown on the clue table in the living room, everyone sees it |
| word | "Serrure", "Nuit", "QI", "passé" (S5, S10) | written on a card |
| sound | a cassette with a song or a crowd cheering (S11) | played in the living room |
| image | subliminal video on the house screen (S6) | flashed on the screen |

A clue raises EVERY viewer's belief in the TRUE secret a little, and raises
most the belief of whoever is good at reading it (`mental` + `intuition`), and
whoever already suspected something close. Each clue is a `learn()` at the
'public' tier for the object itself and a 'deduced' step for what it means, so a
clue never hands certainty.

**How do clues arrive? Every channel the show used:**

| channel | how often | who chooses the target |
|---|---|---|
| the Voice's weekend game (team or solo) | most weeks | the winners pick whose clue |
| a quiz or blind test | some weeks | the winners |
| the clue auction (S5: $100 to $24,000; S14 again) | a twist, once or twice a season | the highest bidder; the holder can bid to PROTECT their own clue |
| a mission's reward or a failed mission's penalty | per mission | penalty: a clue on the failer's OWN secret goes public |
| the bridge / garden of sacrifices on the prime | twist | the holder chooses: sacrifice something (money, a visit, an immunity, a vote against) or the clue goes public |
| the red phone | some primes | "protect your clue for $5,000" / "plant a fake clue" |
| a slip (tells) | any day | nobody chooses: the holder's behaviour leaks a tell to whoever is watching |
| the house's own secret puzzle (a code in the rooms) | twist | solving it |
| a buzz confrontation | per buzz | the defender's nerves can leak a tell |
| a duo's or rival's challenge (S11: find each other's or a clue goes) | twist | forced pairs |

**Fake clues** are real (S10: Sarah planted "QI" for $5,000; S11 Kamila bought
a fake clue for $1). A fake clue is a `learn()` of a false fact; the house can
be misled, which is half the fun.

**What is a tell?** Part 1 wrote one or two per secret ("goes quiet whenever
anybody mentions flying"). On any day, a housemate who spends time near the
holder and is perceptive may notice it (`intuition`); the holder's `temperament`
and `strategic` hide it. A tell is a private `learn()` at 'observed' strength
toward the secret's KIND, not its text (you notice the fear of flying, not "I
survived a plane crash").

**How do housemates hunt?** They talk. The existing house-life engine already
puts people in rooms together; the hunt adds topics: comparing theories
("I think Cy is somebody's child"), pooling clues with allies (the knowledge
model's `propagate` between people who talk), interrogating a suspect, baiting
a buzz with a fake ("let them think I'm the medium"). Allies who share clues
are a real strategy (S6 duos, S10 Fanny and Julien).

---

## 5. The buzz

**The flow, exactly as the show did it:**

1. **The press.** In the confessional, the housemate presses the red buzzer.
   An alarm sounds through the house; everyone knows SOMEBODY buzzed, not who
   or on whom (until the confrontation).
2. **The confrontation** (la confrontation), the same day, in private, the
   Voice present: the buzzer says what they think the secret is; the target
   must defend themselves WITHOUT revealing anything. This is a scene: the
   target's bluff (`strategic`, `temperament`, `social`) against the buzzer's
   read (`intuition`, `mental`). It can move the buzzer's confidence either way.
3. **Withdraw or confirm.** After the confrontation the buzzer may back out
   (free) or confirm and stake $5,000 (they need at least 5,000 in the
   kitty: S11 the Voice left Barbara at $4,999 as a joke).
4. **The reveal**, later, in front of the whole house in the living room, by
   the target ("Ana, tell the house your secret") or a video from the Voice.
5. **Right:** the buzzer takes the target's ENTIRE kitty; the secret is out
   (the target stays in the game). **Half right** (half a two-part secret,
   S1's "police officer AND stripper"): half the kitty. **Wrong:** the stake
   goes to the target, the secret stays hidden, and the whole house now knows
   who suspected whom and what they guessed.

**Free buzzes** (a reward: "the investigator of the week", a game, a sacrifice);
**buzz sales** (S5: buzzes at half stake, $2,500, to restart a slow hunt);
**buzz bans** (a dilemma's price: "you may not buzz this week").

**When does an AI housemate buzz?** When their confidence in one specific
theory about one specific person crosses a bar that falls with `boldness`, and
rises with how much their kitty matters to them (a big kitty buzzes later), and
falls as the semi-final nears (last chance). A housemate with a free buzz uses it
earlier and wider. Nobody buzzes their own partner in a shared secret.

**After a buzz** (the consequences the show always had): the target resents the
buzzer (bond), the target's allies too; a wrong buzz makes the buzzer look
paranoid to the house and to the public (popularity −) and points everyone at
what the buzzer guessed (so the house discusses it, which can lead others to
the right answer); a right buzz makes the buzzer rich, a target for
nominations, and a hero or a villain to the public depending on whom they
buzzed (a friend's secret = betrayal).

**Revealing your own secret** (commandment 8), in any way, even to one person
in private, or giving clues so heavy the Voice judges it a reveal: kitty to
zero and nominated d'office (S2: exclusion instead, a season setting). A shared
secret blurted by one costs BOTH (S4: Robin told Anthony; Robin and Benoît
nominated together, the public saved them as a pair).

---

## 6. The kitty

**Where does money come from and go?**

| in | out |
|---|---|
| $10,000 on night one | a wrong buzz ($5,000 to the target) |
| a right buzz (the target's whole kitty) | a found secret (the whole kitty to the finder) |
| missions ($2,000 to $30,000) | punishments (money taken) |
| dilemmas (sell a visit, a place in the final, an immunity) | dilemmas (pay to protect a clue, to save a friend) |
| the red phone | the red phone ("give $2,000 to the person you hate most") |
| the Voice's games | clue auctions |
| the S12 thieves: stealing from others, coins hidden in the house | |

**Pooled kitty** (twist: S4, S5, S6 all money in one pot; group choices raise or
lower it; disagreement costs it) and **clan kitties** (S6, S11).

**At the end:** at the semi-final the kitties are VALIDATED (frozen). The winner
receives the cheque ($100,000, the S8+ amount) plus their own kitty; the other
finalists keep theirs. Money is always conserved except for mission rewards,
Voice money and validated cheques (the sum is checked by a test, as v1 already
does for the buzz).

---

## 7. Missions

**What kinds are there?** Every real mission was one of these:

| family | real examples | how success is judged |
|---|---|---|
| fake relationship | fake couple (S2 winner), fake siblings (S6 winner), fake mother and son (S8), fake exes (S11), fake fiancés (S6) | the house believes it: the knowledge model's belief in the false fact, across the house, at the deadline |
| seduction / jealousy | "seduce Morgane to test Ayem's jealousy" (S5), "make the house think you fell for one of three men" (S11) | the target's bond / romance state + the third party's reaction |
| deception | fake pregnancy (S4), "you are in contact with outside" (S4 black phone), a fake new housemate who is really the public (S6), the Voice's accomplice (S1) | house belief |
| manipulation | get X nominated, make X lose a game, plant a rumour, give a fake immunity card that is really a nomination (S8, S10, S11) | the event happens |
| endurance / forfeit | cry once a week, serve somebody with a bell (S11 Tanya), wear a costume | done or not |
| the big mission | the season's signature (the intruders, the impostors, the masters of the nominations, the house thieves) | §13 |

**How are missions given?** The Voice calls the housemate to the confessional
(or the secret room) privately. The mission has a deadline (usually the next
prime), a reward, and often a failure cost (a clue on their own secret goes
public, S10). Partners are told; the target is not. Commandment 5: revealing a
mission is a rule break.

**Who gets which mission?** Fit, as the show cast them: seduction missions to
`showmancer`/high `social`; deception to high `strategic`/`boldness`; nice
archetypes get no sabotage missions (franchise rule) but may get fake-couple,
deception-for-fun and kindness missions. The user loosened Big Brother's rule
(memory, 2026-10-23): strategic nice players may lie when asked; never sabotage.

**What does the house see?** Odd behaviour (the knowledge model: a mission
behaviour is a tell for "X has a mission"); suspicion of the mission can lead to
a buzz on the wrong secret (S11: Kamila buzzed Alain and Laura's fake-ex story:
they won the mission). A mission is revealed at the prime, success or not.

---

## 8. Nominations

**Who nominates whom?** The season's rule (part 1): **gendered** (one sex
nominates two of the other, alternating weeks), **mixed** (everybody nominates
two), or **open** (anyone, any number of times, sometimes in the prime live).
Each voter names two in the confessional and must justify each (commandment 6;
the reason is a line, part 3). The two most named are nominated; a tie for the
second place puts three up or goes to a second round (both happened).

**Who else is nominated?** Nominated d'office: rule breakers, the red phone's
victims, dilemma prices, powers (a nominate-one card, a Master of the House, the
masters of the nominations, nomination à vie). Several d'office nominees can
replace the house's nominations entirely that week (S3, S9).

**Who is safe?** Immunity from the Voice's game, a dilemma, a card, a place in
the final, the hidden house's residents (they cannot be nominated while hidden),
linked pairs (S13: one immune, both immune).

**Is there a weekly immunity competition?** NOT in the classic seasons: immunity
came from the Voice's games and dilemmas, irregularly. The revival had a weekly
**Master of the House** game (immune + nominates one directly, S12). v1 ran a
weekly immunity comp, which the classic seasons never did. The simulator: the
season's draw chooses `classic` (no weekly comp; the Voice's weekend game
sometimes carries an immunity) or `revival` (Master of the House every week).

**How do AI housemates choose?** Not Big Brother's "who can I get the votes to
remove". Here: (1) who suspects ME (protect my secret); (2) who is closest to my
secret by the clues; (3) opposite-sex rule; (4) bonds and feuds; (5) who the
public loves (nominating a favourite is pointless and unpopular); (6) missions
("get X nominated"). Mode-gated in `js/bb/strategy.js` so Big Brother's targeting
is untouched (the part 1 research's warning).

---

## 9. The public

**What does the public vote on?** To SAVE a nominee (the lowest share leaves),
the final (the highest share wins), and twists: who enters on launch night, who
goes to the secret room, a pair for the secret room (S6), whether a rule-breaker
stays.

**What does the public like?** The engine's audience model already exists
(`engagement()`, demographics, popularity, the edit layer). Secret Story
weights (part 1's registry `audience`): mess 1.15, showmance 1.2, blindside 1.1.
Specific to this show: a secret the viewer finds moving (survived something,
family) earns sympathy; a right buzz on a stranger is admired, on a friend is
punished; a wrong buzz is mocked; a successful mission is admired; violence is
punished; a big character is kept; a returning famous face starts with a small
head start (part 1).

**How are results shown?** As the show did, percentages to save, announced in
the airlock one nominee at a time ("Ana… you're staying with us"), the last two
side by side. The share is never 0 (part 1's v1 floor).

---

## 10. The prime (the weekly live show)

**What happens in a prime, in order?** From S4–S11 and S13–S14:

1. **Recap** of the week (the stepped viewer's previously-on).
2. **The host opens; the nominees go to the airlock.**
3. **The night's theme** (S8 named every prime: "the house drops the mask",
   "plays with fire", "travels in time", "faces the truth"; S11 "the garden of
   sacrifices", "the prime of truths", "the return of the red phone"). The
   randomizer names the prime from what happens in it.
4. **Segments**, two to five of them, drawn from the season's tools and the
   week's state (§11–§13): dilemmas at the bar of privileges, the red phone,
   the bridge of sacrifices, the room of truths (what others said about you, on
   tape), a visit or a message from family through the airlock glass, an ex or
   an eliminated housemate in the airlock for a confrontation, a mission
   revealed, a buzz revealed, a new arrival, the move to the secret room, an
   auction, the secret of the house.
5. **The elimination.** Shares announced in the airlock; the one leaving says
   goodbye and walks the red carpet into the studio; a short interview with the
   host (what they think of the house; their secret revealed to the house if it
   was never found — or kept, a season setting).
6. **Tease** for the week.

Every segment is a VP-visible act with consequences; the prime is the most
"game show" screen in the show and the one part 4 must make spectacular.

---

## 11. Dilemmas

**What is a dilemma?** An offer from the Voice with a price, to one housemate,
often in front of the others, with a clock. Real ones: give your place in the
final for $15,000; triple your friend's kitty and divide your rival's; see your
mother but your partner loses an immunity; simulate a break-up for $15,000;
accept that all the nasty things you said are shown; protect your clue or
nominate your friend; keep the bell (everyone serves you) or reveal a clue.

**How does the simulator build one?** A dilemma is
`{ to, offer, price, alternative, audience, deadline }` where offer/price are
drawn from typed pieces — money (±), a clue (own: protect/reveal; other's:
gain), an immunity, a nomination (self/other), a visit (family message, the
airlock), a power (free buzz, double vote), a place in the final, a public
humiliation (tapes shown) — and the price always lands on something the person
cares about (bond-weighted: "your best friend loses…"). The choice is the
person's, from their stats, bonds, kitty and what they protect; it is a scene.

---

## 12. The red phone

**How does it ring?** During a prime (most often) or any day of a week (S6, S11
"the master of the control tower can ring it at any time"). Whoever answers
first gets the message (S5: nobody before the fifth ring → everybody
nominated). Answering is a choice (boldness): the greedy and the curious run;
the careful hang back.

**What can it say?** (every one real)

| message | effect |
|---|---|
| "You are nominated d'office" | nominated |
| "…but you may give the nomination to somebody" | transfer (bonds) |
| "Choose who gets an extra vote against them" | a vote |
| "You win money" / "You give money to the person you hate most" | kitty |
| "You are eliminated" (fake → the secret room) | the secret-room twist |
| "Divide your kitty by a number between 2 and 5" (S6) | kitty |
| "Name who you trust most / least" | the answer is a choice with consequences |
| "Plant a fake clue on your secret" | fake clue |
| "You become the master of immunity" | a power |
| a dilemma | §11 |

---

## 13. Twists, signatures and the randomizer

**What is in the catalog?** Two layers (agreed in part 1). Each entry: id, name,
what it is, the seasons it comes from, the PLACEMENT window (launch night /
weeks 1–3 / mid / back half / semi), how it ENDS, what state it writes, and its
screens.

**Signature twists** (one per season, the season's identity):

| id | from | in one line |
|---|---|---|
| intruders | S3 | a group hides in a second house reached by a tunnel, swaps in later |
| antechamber | S4 | three "sacrificed" at the door watch the house and must name who sacrificed them |
| labyrinth | S5 | two masters of the tunnels spy on the house and name somebody nominated for life |
| secret-box | S6 | three watch from a tinted cube in the living room; find one secret to take that person's place |
| seven-rooms | S7 | seven secret rooms behind an elevator, seven mysteries, the common secret of the house |
| impostors | S8 | four play eight people from a hidden zone |
| neighbours | S9/S11 | a small second house with trapdoors into the main one |
| hotel | S10 | a hidden hotel next door; the house must find six faces among two hundred portraits |
| campus | S11 | a control tower with secret doors; new students arrive mid-season knowing everybody's secrets |
| fake-house | S12 | night one in a fake house with a fake Voice; finding out is the shared secret |
| crystal-house | S13 | a glass house: the main house must guess how many live there |
| yacht | S14 | two clans who can watch each other; one invents fake identities for the other |
| thieves | S12 | a pair starts at zero and must steal from the kitties |
| masters | S7 | a secret pair adds a nominee every week until discovered |
| common-secret | S7 | one secret shared by the whole house; nobody finds it → all nominated |

**Recurring tools** (any season, any number): the red phone, the black phone,
the secret room (fake elimination), the immunity house vs the nomination
house, nomination for life, the joker / switch card, the inverted nomination,
the fake immunity card, the bridge of sacrifices, the clue auction, the room of
truths / lie detector / thermal camera, the secret of the house (riddle → a
place in the final), the place in the final with its sell-out dilemma, pooled
kitty, clans, the supérette, the Love Room, alumni guests with powers (S13
rings: immunity, nomination, switch, kitty swap), Miss / Mister Secret, the
Golden Secrets ceremony, the freeze, family visits, the 24-hour return of the
eliminated in the final week.

**The randomizer.** Draws the season's signature (fits the house theme from
part 1: campus ↔ campus, crystal-house ↔ glass house…), then 6–10 tools with
counts, and places each in its window, never two big twists in one week. Then
it scores the draw against every past Secret Story season in the franchise
ledger (`seasonsDb` rows carry the draw): same signature, same tool set, same
weeks, same prime themes → a sameness score; above a ceiling it redraws. The
user may lock or remove any piece in the setup (the Format Designer, as Big
Brother's themes do).

---

## 14. Hidden people: the secret room and the second house

**One mechanic underneath them all:** a set of housemates who are `hidden`
(in the game, not in the house). Hidden people: watch the house (they get the
'observed' tier on what happens in the rooms they can see: all of it for a
secret room, some for a second house), cannot be nominated, may nominate (or not)
by the twist's rule, and RETURN with a scene (the house's shock: "you were
eliminated!"). This is the Big Brother Twin Twist bug class (`active === false`
while still playing): one shared helper with tests, not a flag per twist.

**The fake elimination:** a public vote that looks like an elimination; the
"eliminated" walks into the secret room instead of the studio; the house mourns;
they return days later, often with a power (nominate live on the prime, S5, S6).

---

## 15. House life, games and parties

**What do they do all day?** The existing Big Brother house life (part 3 will
rewrite it for this show): cooking, chores, the garden, sunbathing, sport,
gossip, flirting — plus the hunt's own scenes: theorising, interrogating,
watching a suspect, a near-slip, protecting a partner's secret, baiting.

**The Voice's games** (weekend and midweek; for clues, money, immunities, a
free buzz): a quiz (general knowledge), a blind test, a physical game in the
garden or arena, a gross-out eating trial, a dare (dip your head in a bowl to
find a card, S11), the "sexy ménage" (cleaning the house in costume for points,
S6–S11), a treasure hunt in the house, a team game by clans or sexes. They use
Big Brother's comp roster where it fits; the rest are new Secret Story games.

**The supérette:** the shopping, 90 seconds when the Voice opens it; a twist
can swap the trolleys between teams (S10). A punishment can close it.

**Parties** (the Voice throws one most weekends; real themes: pink and white,
samba, fantasies (costumes), garden party, karaoke, Indian night, Halloween,
a birthday). A party is a HOUSE-LIFE NIGHT with its own rules:
- everyone dresses to the theme (a line each; the theme is the screen's look);
- drinks are rationed but present: `temperament` and inhibition drop a little,
  so confessions, flirts, kisses and fights are likelier;
- a SLIP is likelier: somebody says too much about their secret (a tell to the
  room, or a full reveal → the commandment 8 penalty);
- the Voice often hides a mission inside a party ("make X dance with you",
  "get the house to toast to you");
- showmances advance; jealousy fires; a feud can explode;
- the night ends with a quiet aftermath scene (who slept where, who cried).

**Ceremonies:** Miss / Mister Secret elections (the house votes; the winner wins
a clue or a privilege, S10–S11), the Golden Secrets awards (the house awards
each other: best liar, best couple…, S6, S10), birthdays (the Voice's gifts that
can be poisoned, S11).

**Family:** letters, videos and calls the Voice offers or withholds (dilemma
currency); in the semi-final week, families visit one evening each.

---

## 16. Romance and fake romance

Secret Story is a romance-heavy show (the public weights showmance 1.2). Real
couples (part 1's real ties), showmances (the existing romance engine, which
caps four), FAKE couples (missions), jealousy missions, the Love Room as a
reward (S5, S6), a fake wedding (S4), break-ups simulated for money (S4, S5).
Rules: a fake couple must look real to the house (knowledge belief) while each
member may have real feelings for somebody else (S6 Nadège and Thomas's
storyline); the romance engine's `romanticCompat` still gates every real spark.

---

## 17. Clans

From the middle of the season the house splits (S5–S11): the simulator forms
clans from bonds and nomination patterns (the existing bloc detection), names
them (a twist can make them choose a name and a chief, S6 "Le Carré d'As" vs
"La Fratrie"), and uses them for team games, clan kitties and clan
nominations. A clan war week is a tool.

---

## 18. The semi-final and the final

**The secret of the house:** a riddle hidden in the house all season (the
mona lisa paintings, numbers in every room, a tattoo, S4–S7, S13). Clues to it
come through the season; whoever solves it in the semi-final week wins a place
in the final, then usually faces the Voice's dilemma: sell it ($15,000 –
$50,000) or keep it.

**Semi-final week:** the hunt's last chance; families visit; the last
dilemmas reshuffle kitties; at the semi prime the kitties are validated and the
surviving secrets revealed; one to three leave (to four finalists).

**Final week:** every eliminated housemate returns for 24 hours, a few each day
(from S3 on); the excluded never return. The final prime: the finalists'
journeys, the public's shares, last place to first, last season's winner hands
over the cheque.

---

## 19. How AI housemates play Secret Story

What each housemate weighs every day (mode-gated beside Big Brother's
strategy):
- **protect my secret:** avoid tells (stay away from the topic), deflect, lie
  when asked (archetype rules), seed a fake theory about myself, keep my
  partner close;
- **hunt:** gather clues, share with trusted allies, test theories in
  conversation, decide when to buzz (§5), avoid buzzing a friend;
- **money:** kitty as a score; greed (`strategic` − `loyalty`) decides dilemmas;
- **the public:** look good (popularity awareness grows over the season;
  feedback from the airlock and the room of truths);
- **nominations:** §8;
- **missions:** do them, or fail them when they hurt a friend;
- **romance:** as the engine does.

Archetypes keep the franchise rules: villains and schemers lie, sabotage and
plant fakes; nice archetypes never sabotage (they may keep a secret and lie
when fished, the user's 2026-10-23 loosening); neutrals need strategic ≥ 6 and
loyalty ≤ 4 to scheme.

---

## 20. What the viewer must SHOW (handed to part 4)

Every act in §2–§18 is a VP-visible act with its own screen or scene (the
franchise rule: every mechanic gets a VP-visible event). The signature screens
part 4 must make spectacular: the launch night arrivals with the secret card,
the buzzer alarm, the confrontation, the reveal in the living room, the clue
table, the red phone ringing, the prime's segments, the airlock verdict, the
secret room's wall of screens, the secrets board. The plates for them are
being made now (§24).

---

## 21. How it fits the engine

**Files** (new, `js/ss/`): `voice.js` (the Voice's events and rules),
`hunt.js` (clues, tells, suspicion on the knowledge model, the buzz flow),
`kitty.js` (the ledger), `missions.js`, `dilemmas.js`, `phone.js`,
`prime.js` (the prime's running order), `twists.js` (the catalog and the
randomizer), `hidden.js` (secret room / second house), `parties.js` and
`games.js` (house life and the Voice's games), `nominations.js` (replacing v1's),
`public.js` (the vote, shares, sympathy), `ai.js` (the strategy layer). v1's
`js/bb/secret-story.js` becomes a thin adapter.

**The week spine** (`js/bb/week.js`): when the show is Secret Story the week
runs §1's beats instead of HOH → nominations → veto → eviction, mode-gated so a
Big Brother week is byte-for-byte unchanged (a test plays a seeded Big Brother
season before and after and compares). The prime is the week's last act.

**State** (`gs.bb.secretStory`, plain JSON for saves): secrets, clues shown,
buzz log, kitty ledger, missions, dilemmas, phone log, hidden set, clans, the
season draw, the house secret, prime log.

**Exports** extend part 1's `ss` block: buzzes, missions won, dilemmas taken,
clues earned, times nominated d'office, kitty history, prime segments.

---

## 22. How it is checked

- **Measured targets from the real seasons** (the audit, like `audit:dr-spec`):
  share of secrets found by the buzzer before the semi (real: about half to
  most; S13 found 6 of 11), wrong buzzes per right one, kitty spread at the
  semi (one or two rich, several near zero, S4 top $100,077), missions per
  season, d'office nominations per season, exclusions (0–3), the public's
  winner share (33–73%).
- **The season read:** play seasons off the real roster and read every screen
  for the bug classes (§11.5 of ADDING-A-SHOW): a mechanic that reaches no
  screen, a speech that knows what the character cannot, a buzz on a secret
  already found, money appearing from nowhere.
- **The sameness score** between seeded seasons stays under its ceiling.

---

## 23. Decided by the user (2026-10-27)

1. **The host: a NEW host**, not Big Brother's Valeria; who exactly is still
   open (the user floated "Dior"). Until then the prime's host is a registry
   placeholder (`HOSTS_BY_FORMAT['secret-story']`) so nothing is written
   around a name that may change. Note for the choice: Dior is also a fashion
   brand, and the franchise keeps brand names out (memory, 2026-10-22).
2. **English everywhere**, to keep the immersion: "the Voice", "the prime",
   "the airlock", "the secret room", "the confessional", "the kitty", "the
   buzzer", "the House of Secrets". No French terms on screen.
3. **Money in dollars.** Kitty $10,000, buzz stake $5,000, the winner's cheque
   **$100,000** (my pick between the two real amounts, the modern one), plus
   their kitty. Real-season amounts quoted in this document are converted 1:1.

## 24. The plates (part 4, started now at the user's request)

14 AI-edit jobs are ready in `C:\Users\yanna\Downloads\SecretStory-plates\to-edit`,
in the Reality Resort workflow: `edit-this.png` (a Total Drama-style house plate:
the camera to keep), `1-set-*` (photos of the real Secret Story house, 2007–2026,
from the Big Brother fandom wiki and Commons: what is in the room), `2-style-*`
(official Total Drama backgrounds: how to draw it), `prompt.txt`. Rooms: living
room, confessional (with the red buzzer), kitchen, girls' and boys' bedrooms,
bathroom, garden and pool, airlock, secret room, wall of secrets, supérette,
prime studio, games arena, and a prop sheet (buzzer, red and black phones, the
eye, the clue chest, cards, the kitty display, the portrait, the crystal ball).
Results go to `..\usable`.

**More cameras (2026-10-27).** The user: "only 1 view of each room thats not a
lot". 58 more jobs, one per resort camera, in `to-edit/<room>-views/`, each with
`0-match-*` (the room's finished main view) so every angle keeps one decor.

**The show's own lettering.** The user, 2026-10-27: "use the secret story fonts
(later in the stepped viewer for example name in confessional use that font)".
Part 4 gives Secret Story its typefaces: the name plate in the confessional, the
prime's title cards, the Voice's lines, the kitty board and After Secret all in
the show's lettering (a free, licensed match to the logo and on-screen graphics
of the real seasons, loaded from Google Fonts or shipped in `assets/fonts/`),
never Big Brother's.

## 25. The prime is a full episode (built, M6)

The user, 2026-10-27: "prime are full episode so theyre not sometimes with 30
click like real full episodes". `js/ss/prime.js` plays the night; the viewer
airs it as its own run of screens, 90–130 clicks: the opening (the host, the
night's name, the week told back, the money), the airlock (each nominee's week,
the host's question from why the house named them, a friend's word, ten seconds
to the public), live in the house (the host talks to whoever the week happened
to), the segments (missions revealed, one or two dilemmas from
`js/ss/dilemmas.js`, the red phone, the room of truths, a family visit), the
verdict read in the airlock, the walk to the studio and the interview (the
secret the house never found is told, its partner exposed, the ones who were
right say so), then After Secret with Josh and Blaineley (the theories the
viewers can see, the money, the public's favourite, Blaineley's prediction).
Every segment moves bonds or the public before the lines close.

## 26. The public (built, M7)

The user, 2026-10-27: "popularity is the most important part of the game ...
not too simple ... sometimes even a villain could be popular, more popular than
someone nobody cares about ... popularity can come from multiple things, even
pity". `js/ss/public.js` keeps seven running numbers per housemate:

| axis | fed by | why (source) |
|---|---|---|
| seen | every aired beat, every act | you cannot love who you never see (parasocial attachment needs screen time); relative to the house, so a quiet housemate stays quiet all season |
| warmth | comforting, choosing the heart in a dilemma, a right buzz on a stranger | likeability |
| pity | nominated by many, buzzed, betrayed, the room of truths, a moving secret told | the underdog; S2's daughter kept with 85% the week her mother left. Wears thin on its own |
| fun | fights, bold buzzes, missions pulled off, deals taken, the red phone | viewers rate entertainment over realism; it builds a devoted core even for a villain |
| real | caught being two-faced (−), buzzing a friend (−) | audiences prize authentic moments; lying FOR the game is the premise, to hurt is not |
| arc | romance, a fake couple's story, a visit from home | fake couples and siblings won S2, S4, S6: the country votes for a story; it barely decays |
| heat | cruelty, greed on air, d'office, fights | some heat is fuel; too much with nothing warm underneath turns the country |

The vote SAVES, so it reads the size of a FAN BASE (`support`): recognition ×
(casual fans from warmth, pity and arc minus what heat drives away, plus a
devoted core from entertainment) × authenticity. A villain the country watches
outlasts a housemate nobody noticed; a warm one beats both. The week's headlines
decay, the arc stays. The engine's own popularity number still moves (other
screens read it) and the public reads its changes lightly.

Decisions weigh how they LOOK, more as the season goes and for the socially
sharp (`awareness`): nominating the country's favourite is a wasted vote,
buzzing a friend or a favourite on air needs more certainty, a dilemma tilts
toward the heart. After Secret reads the country to the viewers: its favourite
and why, the one it loves to hate, the one it never sees.

Measured over six seasons: 24 sweethearts, 19 love-to-hate villains, 10 big
characters by the end; a villain survived four public votes in a row on his fan
base; the barely-seen went early.
