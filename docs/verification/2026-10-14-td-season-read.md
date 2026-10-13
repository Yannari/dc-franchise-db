# TD: the season read (story step 5) — 2026-10-14

The user, 2026-10-14: "the conversation are the biggest issue they often dont feel like im reading/listening to total
drama or even that they're speaking in fluent english sometimes i have no idea what they're talking about sometimes
its too clever sometimes too dumb". And earlier: the Save Card is played before the votes are written, and Chris tells
the saved coach to grab a torch.

## How

Two played seasons dumped line by line (hosted camp seed 1729, World Tour seed 2026, 16 players each), read against
two Disventure Camp transcripts (Elephant in the Corner, Hell of a Deal) and the earlier TDI read. Every fix came from
a line read in context; a pool scanner (tools/td-voice-scan.mjs) was built and found to be no measure of this.

## What was wrong, and what changed (commits 06a0b043, 8d931c56, 60b9f6b1, e1dcebd2 and this one)

- **Essay register.** One batch of pools (2026-10-12) talked like an essay about a conversation: "Very generous of the
  romance department", "Those are compatible", "That's irritatingly effective", "Don't make {b} audition to be a
  teammate". Rewritten in the show's voice: every follow-up (32), the social exchanges (25), the losing team's blame
  and regroup (20), stiff lines in n-chal and n-group4, and the nerdy voice's "statistically" dropped into ordinary lines.
- **No idea what they're talking about.** Kit callbacks were two halves picked separately ("We should ask what it
  means to Bowie" / "Good idea. Better than guessing.") and asked about traits as topics ("how quiet she is"); now whole
  four-line talks, topics only. Follow-ups read an old line back in quote marks; now "the other day". A fight about "the
  strongest person here" named nobody; it names the challenge's best now. "I heard one name. Twice." is gone.
- **The wrong person.** Defending phrases filled {to} with the attacker while meaning the victim ("Yelling at Julia" to
  Julia, who was yelling). A recap clip came from somebody Chris never named; a recap sentence ran "Heather broke ranks,
  and Aubrey paid for it, and rounded up the votes". A chained scene sent off somebody who was never there.
- **Facts the scene didn't have.** "They always end up writing the same name" before that team had voted (needs a real
  bloc vote now); "two against five" answered "That's basically even" ('behind' now); a friend writing your name "knew"
  you'd be gone tomorrow; a pitch aired after the plan it contradicts (pitches air in the scramble now).
- **Where and when.** A beat naming the dock staged at the river (a named place is where it is staged now); spin the
  bottle "around the fire" in the morning (night scenes move to the evening); "Good morning to you too" in the
  afternoon; on the World Tour jet: every kit scene was written for the camp (no venue was passed), the mentor taught
  "making fire", "the shade", "same rock", "the other side of camp".
- **The Save Card** is called once the votes are written, before the read; the island's "grab your torch" goes to the
  replacement, not the coach the card saved.
- Smaller: stock set-up fillers, "maths" (Canadian show: math), three pets named Gerald, Chris's "keep the boat
  running", "Nobody here is not hungry", an exit reply that assumed what the goodbye said.

## Measured (the 40-season matrix, docs/superpowers/audits/2026-10-14-td-season-read)

| | Romance step | After the read |
|---|---|---|
| Runs reproducible | 40 / 40 | 40 / 40 |
| Scenes a camp-day | 22.7 | 22.7 |
| Spoken / confessional lines a day | 123.8 / 28.2 | 122.3 / 28.0 |
| Vote / kit / follow-up / drama scenes | 3209 / 1976 / 341 / 70 | 3183 / 1861 / 331 / 74 |

Nothing the read gated starved the day; kits fall a little (the jet's outdoor bits, trait callbacks).

## Verification

TD, coach, backlog, continuity and season-hub suites (54 files) green after each part; the Save Card checked on a
played card night, both endings.
