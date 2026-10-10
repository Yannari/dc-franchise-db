# First impressions review

Verified all four affected suites: 58 tests passed. The seeded audit covers 20 real-roster seasons; the JSON alongside this file contains every sampled scene and its bond effects.

Read the first 30 scenes for continuity and character behavior. Corrected kit follow-ups, preserved matching tease/reply exchanges before conflict, excluded openings assuming an overnight stay, darkness, fog or an exact team size, and fixed group-size wording. Checked every participant speaks, no repeated aired lines within a season, situation frequency, and kit coverage in automated tests.

## Writing pass (2026-10-10, second session)

The user's review of the first build (kit scenes one template, written phrasing, group extras with one
disconnected line, thin scenes) is addressed:
- `kitFirstPairScene` builds the whole scene from the two people: the solo opening (`alone`), the
  bit/tease/reply exchange, a question answered from a's own `home`/`want`, b's reaction and b's own
  answer (kit or archetype), then a's close; the clash keeps the tease/reply and escalates into `defend`.
  Kit scenes cast the pair only.
- `firstpair.js` rewritten: 13 clicked + 12 clashed situations to the §3 register, plus `contraband`
  (clicked) and `copycat` (clashed). No invented biography (no dead relatives, no children for adults).
- `firstgroups.js` rewritten: every extra seat changes the scene; four-person scenes are gated
  `fourth: true`; lines that answer the fourth person carry `when: { fourth: true }`.
- Rule found reading the output: a variant is picked by its speaker's voice, so a reply may only refer
  to what every version of the line before it says (no cross-speaker "Barry", "grandmother", "crust").
- Choppy share 1.7% / 1.0%; no history, outdoor or venue nouns; no "I'd like".
