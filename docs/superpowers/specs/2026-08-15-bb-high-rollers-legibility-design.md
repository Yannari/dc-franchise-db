# High Roller's, legibility — the standings, the side bet, and saying what things are for

Date: 2026-08-15
Status: design, approved

## The problem, in the user's words

> "the explanation are not very good the way you write are not cleared i did not
> understand what was the money really for until the casino thingy and even that
> i wasnt sure what was going on till in the casino what was the point why would
> you want to spin also im not sure what everyone has week by week cause theres
> not a table saying the money of every active houseguest also money is useless
> till mid-season?"

Four complaints. Three are writing failures; one is a design hole.

1. **The money's purpose is never stated plainly.** The primer says a back room
   "will sell you something" — it never says what, or what that thing does.
2. **The point of the spin is never stated at all.** The Roulette reads as a slot
   machine. Nothing says what winning it does to the week.
3. **There is no standings table.** The viewer cannot see who is holding what.
4. **Money does nothing until the room opens** — a final eleven, which on a cast
   of twenty is week ten. Ten weeks of a number going up.

## 1. The chip standings

A table on House Life: every active houseguest, their balance, and the change
this week, ordered by who is holding most.

**Viewer-facing only.** The privacy rule stays exactly as it was for the HOUSE —
no in-world line and no transcript may state a balance, and houseguests still
cannot see each other's. What changes is that the *viewer* is no longer treated
as a houseguest. The precedent is already in the file: `_bbPowerBand` shows the
viewer a secret power and labels it "NOBODY KNOWS". This is that, for money.

It also answers, at a glance, the question the whole theme runs on: who can
afford the room when it next opens.

## 2. The side bet

**Invented, not canon.** BB23 had no side bets. It exists to fill a hole canon
left because the broadcast only paid out for three weeks; this simulator pays
every week from week one, so without it the first half of the season is a number
going up and nothing else. Flagged explicitly because the standing rule on this
project is not to substitute near-neighbours for real mechanics — this is not a
substitute for a canon device, it is a new device with no canon counterpart.

Each week, before the eviction vote, a houseguest may stake a small amount on who
they think is going home.

- **Public that you bet; private what you staked and on whom.** The same rule the
  room door already uses — walking to the rail is something the room sees, your
  hand is not.
- **Correct pays; wrong is gone. The floor keeps an edge**, so a bet is on
  average a losing move. That is the point, and it is the theme's own thesis:
  the owner never loses.
- **It is a read mechanic.** A houseguest who knows where the votes actually are
  bets well. One who believes they are in the majority and is not loses their
  room money finding out.
- **It bites socially.** A sharp houseguest can work out who backed their
  eviction, and takes it personally — a bond consequence, so the bet is not a
  purely arithmetic event. (Every event in this project must have a gameplay
  consequence; money alone is not enough.)

**The tension it creates, which is the reason to build it:** every buck gambled
in July is a buck that cannot buy a spin in September. Money is live from week
one and the room still matters.

**The balance constraint, load-bearing:** bets must not print money. The economy
was tuned so that a season's income buys roughly one purchase (see the economy
model in `2026-08-15-bb-high-rollers-theme-design.md`); a positive-expectation
bet would undo that tuning silently. The house edge must keep expected value
negative, and the plan must MEASURE the season-end distribution rather than
assume it.

## 3. The explanations, rewritten

- **The primer** leads with the concrete purchase and its effect: you are saving
  for one thing, here is what it buys, here is what it does to the block.
- **The room** states the pitch before anybody pays: win this and you take
  somebody off the block, and a wheel — not you — decides who replaces them.
- **The Roulette** answers "why would you want to spin": it saves you or your
  ally; it takes the HOH's week away from them; and because nobody chose the
  replacement, nobody can pin it on you.

The wording rule from the last slice still binds: the copy must describe what the
engine really does, on all three branches (spent / void / no chair), and must not
say "safe for the week".

## Non-goals

- Making balances visible to the houseguests. The in-world rule is unchanged.
- Moving the room's canon house sizes. The arc and the mood turn are anchored to
  a final eleven.
- Retuning the tiers or prices. 26/20/14 and 125 stand; the side bet must fit
  inside them.
