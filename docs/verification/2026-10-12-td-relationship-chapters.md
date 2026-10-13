# TD romance and rivalry chapters

Date: 2026-10-12.

The existing aired-speech follow-up ledger now remembers mutual romance scenes for compatible, existing showmances. A clash or romance can have two later callbacks: the second waits for an independent bond change of at least one point after the first callback's final episode state. Its mood follows the direction of that change, rather than the absolute bond. This threshold selects narration; it does not replace proportional gameplay checks.

Only a callback present in the final camp feed can supply a second chapter. Its exact spoken remark and feed location become the next source. Rivalries retain the original third speaker; romance callbacks stay with the two partners. Existing eligibility, three-episode expiry, live-episode guards, consequences, shared VP/text rendering, and JSON serialization remain in use. No new couples are created. Disabled romance, incompatibility, and a broken-up couple prevent romance callbacks.

Sixteen new exchanges cover affection, guarded romance, improving rivalries, and renewed friction, with four variants per category. Review corrected speaker attribution, confessional perspectives, contractions, and an unsupported claim that an agreement was the pair's first. The conversations refer to their actual recorded words without inventing kit objects, vote knowledge, or other campers' opinions.

Verification includes all variants across five venues; real-cast season reach and exact source speech; three-scene rivalry and romance progression; witness absence; save/load; the callback's own effects failing to trigger another chapter; deterioration while a bond remains positive; breakups and disabled romance; a proposed callback omitted from the final edit; live bond consequences; exact VP/text speech parity for defense and romance; and historical replay safety.

The final command runs all 22 tracked tests/td-*.test.js files plus tests/imports-are-committed.test.js with Vitest and four workers. This is scoped Total Drama verification, not a repository-wide all-show test run.

Final result: **23 files passed, 201 tests passed**, exit code 0. Staged diff whitespace validation passed.
