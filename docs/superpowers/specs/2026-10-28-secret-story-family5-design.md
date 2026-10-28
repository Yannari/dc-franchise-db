# Secret Story — twist family 5: who is really talking, and the public deciding differently

2026-10-28. From the user's S1–S14 catalogue (`docs/research/secret-story-twists-s1-s14.md`).

## Who is really talking (`js/ss/deceptions.js`)

- **The false Voice (S12).** The Voice "retires" and a new voice takes the house for a week. Each housemate, alone,
  is asked for something about their life nobody in there knows. The trusting answer (a clue on their own secret
  goes on the wall for the house); the sharp ones (intuition, strategy; less loyalty) refuse. At the prime, the host:
  the real Voice never left; the doubters win $1,000 each.
- **Monsieur Robot (S4).** A robot moves in for a week with an eliminated housemate inside. Each housemate guesses
  (intuition, and how close they were to the one inside); the robot overhears the pair who like each other least.
  At the prime, unmasked: the right guesses win $1,000 each, and the robot repeats what it heard (that bond drops).

Once each a season at most, weeks three to eight. Tests force them with `state.forceDeception[wk]`.

## The public decides differently (`js/ss/public-votes.js`)

- **The house decides (S8).** The public names the bottom two; then every housemate, live, names the one who leaves
  (whom they keep least); a tie goes to the public's lowest. Once a season at most, from week three, three or more up.
- **The vote to eliminate (S13).** The public votes against: shares read from heat, less warmth and pity. The most
  disliked leaves, not the least loved. Once a season at most, from week four.
- **The ticket (S9, S14).** Late in the season (eight or fewer in the house), once: every housemate names the one they
  would keep (never themselves); the most named is immune at the next prime.

Never on the night of a fake elimination. Tests: `state.forceVoteMode[wk]`, `state.forceTicket[wk]`.
