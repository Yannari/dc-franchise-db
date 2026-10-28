# Secret Story — twist family 2: nomination and immunity powers, and themed primes

2026-10-28, after family 1 (`2026-10-28-secret-story-hidden-spaces-design.md`). From the S1–S14 catalogue
(`docs/research/secret-story-twists-s1-s14.md`). Three parts, each shipped on its own.

## What exists

The red phone already hands out the master of immunity, an extra vote against somebody, a nomination passed
on, money; the Voice's game gives immunity, a clue, money or a free buzz; dilemmas trade immunity and
nominations; the secret room (F1.1) blocks votes and doubles them; nominations d'office and immunities are
written by week in `state.rules.dOffice` and `state.nextImmune`. All of it acts BEFORE the house votes.
Nothing yet acts AFTER the result is read, which is where most of the real cards were played.

## F2.1 — the cards: powers held in hand (`js/ss/powers.js`)

A power is held by one housemate, kept secret, and played when it pays: `state.powers` =
`[{ id, kind, holder, week, from, used }]`. The kinds, each from a real season:

- **the Joker** (S4, S5, S6): after the nominees are read, cancel one nomination and put somebody else up;
- **the Switch** (S9, S13): if the holder, or the one they protect, is nominated, they come off and the holder
  names a replacement (conditional: unused if nobody it covers goes up);
- **the secret immunity** (S13's ring): played on yourself when your name is read;
- **the immunity thief** (S9, S12): take somebody's immunity this week, and keep it or hand it on;
- **the inverted card** (S5, S6): once, the house's nominations are turned around (F2.2's inverted week).

Where they come from: new red-phone messages (the Joker, the Switch), a new prize of the Voice's game (the
Joker), a prime dilemma's new option, and **the four rings** (S13, a prime segment: secret immunity, a
nomination, a bank exchange, the Switch, handed to four housemates). A holder plays the card by their
strategy, their bonds, and how it will look on air; unplayed cards expire after three weeks.

On screen: after the nominees are read in the living room, "Wait. The Voice has something to add." The card
is played live, the replaced housemate's face, the room's reaction.

## F2.2 — the week's nomination twist (`js/ss/nomination-twists.js`)

About one week in three from week two, the Voice changes how this week's nominations work, announced
before them (never the same two weeks running):

- **linked destinies** (S6, S11, S13, S14): housemates in pairs for the week; nominate one, both go up;
- **nomination for life** (S5, S11): one housemate is nominated every week until the Voice lifts it, or until
  somebody takes it from them (S11: Kamila took Laura's);
- **inverted nominations** (S5, S6): the house names the two it wants to SAVE; the least saved go up;
- **Immunity House against Nomination House** (S5, S6, S7): a duel splits the house in two; the immune half
  cannot be named; the other half nominates among itself;
- **the red room** (S6): a red door opens; whoever goes in is nominated, and drags one more in after them;
- **the exclusive nominator** (S3, S9): one housemate names the week's nominees alone.

## F2.3 — themed primes

The prime gets a theme most weeks, drawn against the last few, with its own title card when the studio
opens and the segments that make it:

- **the Red Phone prime**: it rings two or three times;
- **the Night of Dilemmas**: three dilemmas;
- **the Bridge of Sacrifices** (S5, S13): housemates cross a bridge one by one; on the bridge each is offered a
  sacrifice (money, a clue on their own secret, their immunity, a nomination for a friend) to let the next
  cross with a reward;
- **Truths Revealed**: the room of truths, and a secret the public knows said out loud to the house;
- **the Rings** (S13): the four power rings handed out.

## Calls I made

- At most one card is played a night, the strongest first; a card never saves somebody the public already
  has to vote on twice the same week.
- The week's nomination twist and the prime theme are drawn per week, weighted against repeats, and a
  season's draw (`ssDraw`) records which ones it used so the next season does not feel the same.
