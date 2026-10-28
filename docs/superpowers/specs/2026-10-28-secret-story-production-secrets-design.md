# Secret Story — twist family 3: the production secrets play

2026-10-28. The user: "we should have gameplay for more types of production secret, a ton, so we don't have
much repetition, because these often come with secret gameplay". The catalogue
(`js/ss/casting.js PRODUCTION_SECRETS`, the S1–S7 list the user gave, plus the later seasons' roles from
`docs/research/secret-story-twists-s1-s14.md`) becomes roles with a job every week.

## The rule for all of them

A production secret is a role the Voice hands out. Each week its holders get the role's job (the Voice says
it in the confessional), do it or fail it (their stats, their bonds, luck), and are paid or punished. Doing it
leaves traces: the house's theories drift toward the truth ("they're a fake couple"), so the role is also the
easiest way to get your secret found. When the secret is found, the job stops. Engine:
`js/ss/production.js` `productionWeek(state, ctx, { house })`, one event per live role a week, effects for the
adapter. On screen: a scene of house life (the confessional brief, the moment, the result).

## The roles

| Role | From | The weekly job | Paid | The risk |
|---|---|---|---|---|
| The Voice's accomplice | S1 | the Voice's order: plant a false lead, get a housemate to buzz wrong, steer a nomination | $1,000 an order done | caught doing it: the house suspects the role |
| A fake couple (also the public's favourite fake couple) | S2, S4, S5, S13 | a public sign of love: a kiss, a date night, a fight and a make-up | $1,000 a week the act holds | a cold moment caught on camera feeds the theory |
| Fake siblings / the public's family | S6, S7 | act family: share a childhood memory, defend each other in a row | $1,000 a week | a story that doesn't match |
| The worst of enemies | S3 | a public fight every week, while being secretly allied | $1,000 a week | a moment of friendship seen |
| The chosen ones | S4 | a prediction from the Voice (who will be nominated) and, once, immunity | the information | being too well informed looks suspicious |
| The masters of the tunnels | S5 | listen through the walls (theories), and once, condemn a housemate to a nomination for life | the information, the power | a noise in the walls |
| The key / the access code to the house's secret | S5, S6 | carry a piece of the house's secret (`js/ss/final.js`): every week, a riddle clue; can sell it | a bonus if the house solves it with them | the hunters circle them |
| The couple's protector | S14 | keep a couple's secret safe: take the heat, deflect the theories | $1,000 a week the couple's secret holds | being seen as the couple's shield |
| The saboteur | S11 | plant false leads on the hunt for the house's secret | $1,000 a lead planted | a lead traced back |
| The internet's spy | S11 | film a private moment and hand it to the public: the country sees it | the public's favour | being caught filming |
| The oracle | S14 | a key and a hidden phone: one overheard conversation a week (a theory), and the hunt for the lock | a clue when the lock is found | the hidden room found |
| The guardians of transparency | S13 | name a liar every week; right, the liar's kitty pays | $1,500 right, $500 wrong | the house turns on accusers |

The Secret Box and the intruders are the hidden groups of family 1 (`js/ss/hidden-groups.js`); the masters
of the nominations and the thieves are season signatures (`js/ss/signatures.js`).

## Calls I made

- One production secret by default per cast of ten or more (already the case); the cast screen can cast more.
- The jobs never decide an elimination themselves: they move money, bonds, theories and the public.
- A role's weekly scene folds into house life, like the Voice's moments.
- No more than three roles work in a week, and a role works every other week at most (the longest-waiting
  first). Read on screen 2026-10-28: seven roles every week was seven missions in a row in one afternoon.
- A role's scene goes to the stretch of house life with the fewest of them, so the roles spread over the days.
- The couple's protector shields a REAL pair's secret, never another production role's act; with no couple in
  the house it has no week (and the cast screen never draws it alone).
- The accomplice's false lead lands: a done order swings the mark's theory to a wrong secret, so a real wrong
  buzz can follow.

## Measured (npm run audit:ss-spec, 30 seasons, two roles cast a season through the catalogue)

Production secrets found by a buzz 41.7% (all secrets 44.5%; personal 45.0%, voice-pair 37.8%). Weekly jobs
done: accomplice 6/9, the acted roles 28/36, the single information roles (key, code, oracle, saboteur, spy,
tunnels, guardians, chosen) nearly always. Engine errors 0, ledger mismatches 0, broken lines 0.
