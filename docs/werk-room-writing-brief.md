# Werk Room Writing Brief

Prompt to paste — point the writer at the repo file and `js/dr/data/werk-events.js` alongside it:

---

You are writing the werk room scenes for a Drag Race simulator. The engine is finished; your job is the prose and only the prose.

Open `js/dr/data/werk-events.js`. It has 62 events, each fully specified — id, slot, cast, eligibility, consequences — except its `lines` array. Fill in `lines`. Change nothing else: ids, slots, `when` and `effects` are referenced by the engine and tests. Each event has a note saying exactly what happens in that scene. Write that scene.

**The register**, which is the part that matters. Thirteen queens getting ready in a room of mirrors and sewing machines. Funny first — they're performers, and they perform for each other even when nobody's watching. Shade and warmth in the same breath: they read each other for filth and then fix each other's zippers. Sincerity lands hard because it's rare, so when someone drops the act, don't decorate it — short sentences, let it sit. It is not a strategy game: no vote, no numbers, no alliances. Cut anything that sounds like a house of schemers. The stakes are: am I good at this, does the room like me, will I still be here next week. Specific beats general — "she fixed the bodice at the shoulder" beats "she helped with the outfit." Describe behaviour and let the reader draw the conclusion.

**Hard rules**, all enforced by tests: `{a}` is the queen the scene is about, `{b}` the other one in a pair — never write a name. Never use `{b}` in a `cast: 'solo'` event — there's no second queen, so the line becomes permanently unusable; this exact mistake made half of a previous show's pool unreachable. No real people (no real queens, artists or cities). This show's words only — she's a queen, she sashays away, it's a maxi challenge; never "houseguest", "tribe", "eviction", "veto", and never "competition". Never quote a stat by number. Four variants minimum per event, genuinely different beats — the test rejects four rewordings that open the same way. Prose, not captions.

Four events are already written — `sewing-rescue`, `reading-for-filth`, `comforting`, `the-empty-station`. Match that length and density.

Check with `npx vitest run tests/dr-werk-events.test.js`. It names what's still unwritten and fails with the event id if a line breaks a rule. Work in batches of ten and run it after each.
