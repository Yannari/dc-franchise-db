# Secret Story — twist family 1: hidden spaces and fake eliminations

2026-10-28. The user picked this family first from the S1–S14 catalogue
(`docs/research/secret-story-twists-s1-s14.md`): "not shallow gameplay, it'll take time". Three parts, built
and shipped in this order, each playable on its own.

## What exists (part 2, M9)

`js/ss/hidden.js`: one fake elimination a season (about 7 in 10), one person, one week. The verdict is read
as usual, the house says goodbye, the "eliminated" climbs to the attic. Up there they watch every screen
(theories jump) and hear who mourned and who was glad. They come back on the next prime with immunity and
one housemate nominated by their hand. A hidden housemate is off the house list and off the eliminated
list (the Twin Twist bug class: in the game, not in the house).

## F1.1 — the secret room as the Voice's room of dilemmas (the days)

The user: "the secret room is mostly used during the prime or the dailies when they need to spice up the
game: dilemmas to get clues, block X's nomination vote, nominations d'office, reveal these videos to
someone, let Y see his family for X amount of your kitty".

- Most weeks the Voice calls one housemate, alone, to the secret room (the attic desk plate) and offers a
  trade where the price is paid by somebody else, or by their own kitty. Taken or refused, it airs.
- The trades (`js/ss/secret-room.js`, each from a real season):
  - **a clue for a vote**: a clue on the secret of your choice; in exchange, a housemate you name loses
    their nomination vote this week (S9, S13: blocked votes);
  - **the money and the d'office**: $3,000 for your kitty if you nominate somebody d'office, now (S5, S8);
  - **the tapes**: watch what somebody really said about you, for $1,000 of your kitty (S2, S14);
  - **somebody else's family**: a housemate you love gets a visit from home, paid from your kitty (S4–S11);
  - **the double vote**: two votes at this week's nominations, for $1,500 (S1, S14);
  - **the immunity and the friend**: you are immune this week, and your closest friend is nominated (S3, S8).
- Who says yes is decided by the person (loyalty, strategy, boldness, the kitty they hold, the bonds at
  stake, how much they weigh how it will look). A refusal has its own consequence (the public, a bond).
- New engine rules: **blocked votes** and **double votes** at the nominations (`castNominations`
  `blocked`, `double`), written in `state.rules` by week.

## F1.2 — fake eliminations, every way the show did them

The secret room tool goes from on/off to **off, once, twice** a season. Each fake elimination draws:

- **how it happens**:
  - **the verdict** (the existing one: the public's lowest share);
  - **a double**: two nominees "leave" together and go up together (S1, S2, S7), only on a week with
    three or more nominees;
  - **a voluntary departure**: the Voice asks a housemate to announce they are leaving the game; they pack,
    cry, hug everybody, walk out the door, and climb the stairs (S6, S7). Nobody is voted out that week;
  - **an elimination power**: the Voice hands one housemate the power to eliminate somebody on the prime;
    the "eliminated" goes up, and the one who chose has to live with the house's reaction (S5, S9, S12);
- **how long**: one or two weeks (S1 two days, S2 a week, S6 two weeks);
- **what they do up there**:
  - **watch** (as now);
  - **the master of the nominations from above**: at the next nominations they add one nominee, or swap
    one out, from the secret room (S5, S6, S7, S12);
  - **remote control, with an accomplice**: one housemate in the house is told (the closest bond). The
    accomplice keeps the act going (the fake grief), carries out the hidden one's small orders for money,
    and may slip (temperament) and give it away (S8, S12);
- **how they come back**: on the prime, to the house's shock, with immunity, and with the nominee their
  role gave them; a pair comes back together.

## F1.3 — the hidden groups (season signatures)

One engine for every "they started somewhere else" signature, the real variants:

| Signature | Season | The space | Their goal | How they come in |
|---|---|---|---|---|
| The Intruders | S3 | a second house through a tunnel | stay unseen, spy, steal clues | swapped in, one by one |
| The Antechamber | S4 | a room at the door | name the Chosen Ones | their places at stake |
| The Secret Box | S6 | a tinted cube in the living room | find one secret each | the secret found opens the box |
| The Impostors | S8 | a zone under the house | persuade the house to let them in, four playing eight | the house votes them in |
| The Hotel | S10 | a hotel next door | stay unidentified among 200 portraits | the hunt, or the week ends |
| The Control Tower | S11 | a tower above the house | watch and influence | a fake eviction joins them |
| The Crystal House | S13 | a glass house | be rescued by the main house's vote | the rescue vote |
| The Yacht | S14 | a yacht at the pier | tell real housemates from avatars | the investigation |

Common lifecycle: placed at launch (their arrival is in the launch, to the hidden space), off the house list,
watching (theories), a weekly goal with a result, powers that fit the space (immunity, a nominee), and the
entry. Built after F1.1 and F1.2, with the plates below.

## The plates this family needs

The secret room has its plates (`ss-attic`, `ss-attic-stairs`, `ss-attic-desk`). F1.1 and F1.2 use them,
and the dilemma tunnel. F1.3 needs a set per hidden space; job folders go to
`Downloads/SecretStory-plates/to-edit-family1/<space>/` (an edit-this base plate, the brief, references),
the same way as the house's plates, and the user makes them:

- the Secret Box: the living room with the tinted cube; the inside of the cube looking out;
- the Control Tower: the room of screens above the house;
- the intruders' house (the tunnel, the small second house);
- the hotel of secrets (a lobby, a corridor of doors, the portrait gallery);
- the Crystal House (glass walls, the main house visible through them);
- the yacht (deck, cabin);
- the antechamber (a small room behind the front door).

Until a plate exists, a space plays in the closest built one (the attic, the vault), so nothing waits on art.

## Calls I made (the user can overturn any of them)

- One secret-room dilemma most weeks (about 60%), never two the same in a row; prime dilemmas stay as they are.
- Fake eliminations: off 25%, once 55%, twice 20% of seasons; the kinds are weighted verdict 40%, double
  20%, voluntary 20%, power 20%.
- The accomplice slips at most once, and a slip makes the house suspicious rather than telling it.
