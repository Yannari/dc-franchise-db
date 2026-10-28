# Secret Story — twist family 4: the split

2026-10-28. From the user's S1–S14 catalogue (`docs/research/secret-story-twists-s1-s14.md`): S4's second house
"that split couples and alliances", S9's clan-based nominations, S11's Eagles against Tigers, S12's Pink Bears
against the main house. The one-week clan war (`js/ss/house-events.js`) and the one-week Immunity House against
Nomination House (`js/ss/nomination-twists.js`) stay; this is the split that lasts.

## The rule

A split is an era of two weeks (three on a long season). The Voice announces it in the living room and reads the
sides. Engine: `js/ss/split.js` — `startSplit`, `splitWeek`, `endSplit`; state on `state.split`. Forcing for tests:
`state.forceSplit[wk] = 'second-house' | 'clans' | 'bears'`.

| Form | Who goes where | Lives |
|---|---|---|
| The second house (S4) | the Voice parts the closest pairs on purpose, then balances the sides | apart |
| The clans (S9, S11) | the two strongest characters who like each other least captain and draft, by friendship | together |
| The bears (S12) | three or four, the least settled in the house, move to the other house | apart |

Every week of the era, before the nominations:
- **The duel.** One game, scored on the AVERAGE of each side (never the sum), from the game's own stats. The winners
  are immune this week (`state.nextImmune`) and win $500 each. The nominations come from the losing side.
- **Life on each side.** Within a side, a few pairs grow closer. Apart, the friendships across the wall fade.
- **The window** (apart, once an era): the two closest who were parted talk through the glass.
- **The traitor's offer** (once an era, half the time): the Voice offers the member of the losing side who is least
  attached to it $3,000 to change sides. Taken: the money, the move, and the old side remembers.
- **The reunion** at the end of the era: the wall comes down; the pairs who were parted find each other.

No week-twist (family 2) runs during a split. A season whose house theme is the Arena ("a wall splits the House of
Secrets in two") always has one, from week two; otherwise about half of the seasons, weeks two to six, nine or more
in the house.

On screen (`js/vp-bb-ep/ss-split.js`): the announcement and the sides read out (the parted pairs' faces), the duel
in the games arena, the window, the offer, the reunion. The other house plays on a stand-in plate until the user's
plate job (Downloads/SecretStory-plates/to-edit-family4) is done.
