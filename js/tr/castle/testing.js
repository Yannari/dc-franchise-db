// ══════════════════════════════════════════════════════════════════════
// tr/castle/testing.js — asking for a commitment, then watching whether it
// holds
// ══════════════════════════════════════════════════════════════════════
//
// DISTINCT FROM trust.js ON PURPOSE. trust.js is about FORMING bonds — a
// confidence shared, a circle closing, an alliance warming. This family is
// about PROBING one that already exists: a deliberate, engineered test with
// a controlled variable, run BY one player ON another, to find out whether
// the other person is who they say they are. trust.js's own flagship
// ("will you vote with me tonight?") is the one place the two families
// already overlap in shape — a real ask with a real answer — and every
// event here is built the same way for the same reason: a probe is only a
// probe if the outcome is a genuine check against the TARGET's stats, never
// a coin the actor's own narration dresses up afterward.
//
// No belief writes. A test that comes back "failed" tells the tester
// something about the target's character, not their alignment — a loyal
// Faithful can fail a loyalty oath out of nerves, and a smooth Traitor can
// pass every single one of these. That gap between what a test measures and
// what the room WANTS it to measure is the whole reason this family reads
// as "frequently wrong" rather than as free evidence.
import { pStats } from '../../players.js';
import { addBond, getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { openThread, advanceThread, closeThread, findOpenThread, continueThread,
  advanceCiting } from '../threads.js';

const FAMILY = 'testing';

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

registerEvent({
  id: 'testing-small-dare',
  family: FAMILY,
  window: 'morning',
  // The second advancer in `testing|morning`.
  advancesThread: true,
  citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 1 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const compliant = rng() < Math.max(0.1, Math.min(0.9, st.loyalty / 10));
    const bondDelta = compliant ? 0.5 : -0.5;
    addBond(a, b, bondDelta);
    const line = compliant
      ? `${a} floated a small, pointless ask, and ${b} just went along with it — no questions.`
      : `${a} floated a small, pointless ask, and ${b} pushed back on it, which told ${a} something.`;
    const { thread, cited } = continueThread(FAMILY, [a, b], ctx.ep, line);
    return { branch: compliant ? 'complied' : 'refused', pair: [a, b], threadId: thread?.id, cited, bondDelta };
  },
});

registerEvent({
  id: 'testing-ask-for-alibi-check',
  family: FAMILY,
  window: 'dawn',
  // ADVANCES AND CITES (Plan 5 Task 2). `testing|dawn` held no advancer at
  // all, so a test opened at dawn could never be followed up at dawn. A
  // cross-check is definitionally a repeat: the second one is only worth
  // narrating against the first, which is what the citation supplies.
  advancesThread: true,
  citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    return 1.5;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const checksOut = rng() < Math.max(0.15, Math.min(0.9, st.temperament / 10));
    const bondDelta = checksOut ? 0.5 : -1;
    addBond(a, b, bondDelta);
    const line = checksOut
      ? `${a} quietly cross-checked ${b}'s story with a third person. It matched, clean.`
      : `${a} quietly cross-checked ${b}'s story with a third person. It didn't quite match.`;
    const { thread, cited } = continueThread(FAMILY, [a, b], ctx.ep, line);
    return { branch: checksOut ? 'checks-out' : 'inconsistent', pair: [a, b], threadId: thread?.id, cited, bondDelta };
  },
});

registerEvent({
  id: 'testing-loyalty-oath',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 2 ? 2 : 0;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const sincereScore = (st.loyalty / 10) * 0.5 + (st.boldness / 10) * 0.3 + 0.1;
    const reluctantScore = 0.35;
    const refusesScore = (1 - st.loyalty / 10) * 0.5 + (1 - st.boldness / 10) * 0.15;
    const total = sincereScore + reluctantScore + refusesScore;
    const roll = rng() * total;
    let branch;
    if (roll < sincereScore) branch = 'sincere';
    else if (roll < sincereScore + reluctantScore) branch = 'reluctant';
    else branch = 'refuses';

    const line = branch === 'sincere'
      ? `${a} asked ${b} to commit to it in front of the room, and ${b} did, without hesitating.`
      : branch === 'reluctant'
        ? `${b} said what ${a} wanted to hear, but it took visible effort to get there.`
        : `${b} flatly refused to make the commitment ${a} was asking for, publicly.`;
    const bondDelta = branch === 'sincere' ? 2 : branch === 'reluctant' ? 0 : -2;
    if (bondDelta) addBond(a, b, bondDelta);
    const existing = findOpenThread(FAMILY, [a, b]);
    const t = existing ? advanceThread(existing.id, ctx.ep, line) : openThread(FAMILY, [a, b], ctx.ep, line);
    return { branch, pair: [a, b], threadId: t?.id, bondDelta };
  },
});

registerEvent({
  id: 'testing-reverse-psychology',
  family: FAMILY,
  window: 'after-table',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 0 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const staysCalm = rng() < Math.max(0.1, Math.min(0.9, st.temperament / 10));
    const bondDelta = staysCalm ? 0.5 : -1;
    addBond(a, b, bondDelta);
    const line = staysCalm
      ? `${a} pretended to distrust ${b} just to see the reaction. ${b} just laughed it off.`
      : `${a} pretended to distrust ${b} just to see the reaction, and ${b} got visibly rattled.`;
    const t = openThread(FAMILY, [a, b], ctx.ep, line);
    return { branch: staysCalm ? 'stayed-calm' : 'got-rattled', pair: [a, b], threadId: t?.id, bondDelta };
  },
});

registerEvent({
  id: 'testing-hypothetical-loyalty-question',
  family: FAMILY,
  window: 'evening',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 3) return 0;
    return 1.5;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const reassures = rng() < Math.max(0.15, Math.min(0.9, st.loyalty / 10));
    const bondDelta = reassures ? 1 : -0.5;
    addBond(a, b, bondDelta);
    const line = reassures
      ? `${a} asked ${b} what they'd do if ${a} got banished next. ${b}'s answer landed as sincere.`
      : `${a} asked ${b} what they'd do if ${a} got banished next. ${b} hedged, and ${a} noticed the hedge.`;
    const t = openThread(FAMILY, [a, b], ctx.ep, line);
    return { branch: reassures ? 'reassured' : 'hedged', pair: [a, b], threadId: t?.id, bondDelta };
  },
});

registerEvent({
  id: 'testing-double-check-story',
  family: FAMILY,
  window: 'morning',
  // ADVANCES AND CITES (Plan 5 Task 2). `testing|morning` held no advancer
  // either. "Walk me through your morning AGAIN" is the single most literal
  // citation in the pool — the whole event is somebody re-asking a question
  // they already asked, and the day they first asked it is the point.
  advancesThread: true,
  citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return 1;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const consistent = rng() < Math.max(0.15, Math.min(0.9, st.temperament / 10 * 0.6 + 0.3));
    const bondDelta = consistent ? 0 : -1;
    if (bondDelta) addBond(a, b, bondDelta);
    const line = consistent
      ? `${a} asked ${b} to walk through their morning again. It matched, word for word.`
      : `${a} asked ${b} to walk through their morning again, and it came out different the second time.`;
    const { thread, cited } = continueThread(FAMILY, [a, b], ctx.ep, line);
    return { branch: consistent ? 'consistent' : 'inconsistent', pair: [a, b], threadId: thread?.id, cited, bondDelta };
  },
});

registerEvent({
  id: 'testing-silence-test',
  family: FAMILY,
  window: 'dawn',
  // The second advancer in `testing|dawn` — see the note on the pair cooldown
  // above susp-whisper-about-absent.
  advancesThread: true,
  citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 1 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const chases = rng() < Math.max(0.1, Math.min(0.9, st.social / 10 * 0.5 + st.loyalty / 10 * 0.4));
    const bondDelta = chases ? 1 : -1;
    addBond(a, b, bondDelta);
    const line = chases
      ? `${a} went quiet on purpose to see if ${b} would chase it. ${b} did, almost immediately.`
      : `${a} went quiet on purpose to see if ${b} would chase it. ${b} let it be quiet right back.`;
    const { thread, cited } = continueThread(FAMILY, [a, b], ctx.ep, line);
    return { branch: chases ? 'chased' : 'let-it-go', pair: [a, b], threadId: thread?.id, cited, bondDelta };
  },
});

registerEvent({
  id: 'testing-cold-read-check',
  family: FAMILY,
  window: 'evening',
  rare: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a] = ctx.actors;
    return pStats(a).intuition >= 7 ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const others = ctx.living.filter(n => n !== a && n !== b);
    const target = pick(rng, others.length ? others : [b]);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      `${a} dropped a leading line about ${target} into the conversation, purely to watch what crossed ${b}'s face.`);
    addBond(a, b, 0);
    return { branch: 'cold-read', pair: [a, b], target, threadId: t?.id };
  },
});

registerEvent({
  id: 'testing-follow-through-check',
  family: FAMILY,
  window: 'after-table',
  advancesThread: true,
  // CITES (Plan 5 Task 2). "Whatever they'd been asked before" is a sentence
  // with a hole in it where the day should be.
  citesResidue: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return findOpenThread(FAMILY, [a, b]) ? 2 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]);
    addBond(a, b, 0.5);
    const { thread, cited } = advanceCiting(t, ctx.ep, `${a} kept quietly checking whether ${b} was still holding up to whatever they'd been asked before.`);
    return { branch: 'followed-through', pair: [a, b], threadId: thread?.id, cited, bondDelta: 0.5 };
  },
});

// ── FLAGSHIP: the decoy secret — a four-way fork on the TARGET's own
// loyalty, temperament, social, and intuition ────────────────────────────
//
// The actor plants a piece of fabricated "secret" information with a single
// target and does nothing else — the test is entirely about what the
// target does with it next:
//   KEPT-QUIET          — high loyalty + temperament. It never resurfaces
//                         anywhere. Real trust confirmed; bond gain, and
//                         the thread closes clean.
//   REPEATED-INNOCENTLY  — high social, otherwise unremarkable: the target
//                         just isn't built to sit on information, no malice
//                         in it. Moderate bond hit; thread advances instead
//                         of closing, because the leak is now itself a
//                         live fact the tester has to manage.
//   REPEATED-MALICIOUSLY — high strategic + low loyalty: the target used
//                         the "secret" as currency. Heavy bond damage, and
//                         the thread closes with an outcome that marks the
//                         target as an active risk, not just a leaky one.
//   CAUGHT-THE-TEST       — high intuition: the target clocks that they
//                         were being tested and says so, outright. Damages
//                         the TESTER's own credibility instead of the
//                         target's — a genuinely different kind of failure,
//                         with the bond hit landing on the tester's side of
//                         the ledger via a small negative to the actor
//                         (modeled as a symmetric bond change, since the
//                         only bond value this engine tracks is symmetric,
//                         but the residue explicitly says whose failure it
//                         was).
const DECOY_LINES = {
  keptQuiet: [
    '{a} planted a fake secret with {b} and it never went anywhere. Not a whisper.',
    '{b} sat on the planted secret completely. It was a clean pass.',
  ],
  innocent: [
    '{b} repeated the planted secret to somebody else within the day — no malice, just couldn\'t help it.',
    'The fake secret got out through {b}, and {b} clearly hadn\'t meant for it to.',
  ],
  malicious: [
    '{b} took the planted secret and spent it deliberately, for something they wanted.',
    '{b} traded {a}\'s "secret" for leverage the moment it was useful.',
  ],
  caughtTest: [
    '{b} looked {a} dead in the eye and said "you\'re testing me, aren\'t you?" — and {a} had no good answer.',
    '{b} saw straight through the plant, and made sure {a} knew they had.',
  ],
};

registerEvent({
  id: 'testing-decoy-secret',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return getBond(a, b) >= 0 ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const [a, b] = ctx.actors;
    const st = pStats(b);
    const keptScore = (st.loyalty / 10) * 0.5 + (st.temperament / 10) * 0.3 + 0.1;
    const innocentScore = (st.social / 10) * 0.5 + 0.15;
    const maliciousScore = (st.strategic / 10) * 0.5 + (1 - st.loyalty / 10) * 0.4;
    const caughtScore = (st.intuition / 10) * 0.6;
    const total = keptScore + innocentScore + maliciousScore + caughtScore;
    const roll = rng() * total;
    let branch;
    if (roll < keptScore) branch = 'keptQuiet';
    else if (roll < keptScore + innocentScore) branch = 'innocent';
    else if (roll < keptScore + innocentScore + maliciousScore) branch = 'malicious';
    else branch = 'caughtTest';

    const line = pick(rng, DECOY_LINES[branch]).replace('{a}', a).replace('{b}', b);
    const existing = findOpenThread(FAMILY, [a, b]);
    let bondDelta;
    let threadId;
    if (branch === 'keptQuiet') {
      bondDelta = 2;
      addBond(a, b, bondDelta);
      if (existing) { closeThread(existing.id, ctx.ep, 'passed-clean'); threadId = existing.id; }
      else threadId = openThread(FAMILY, [a, b], ctx.ep, line)?.id;
    } else if (branch === 'innocent') {
      bondDelta = -1;
      addBond(a, b, bondDelta);
      const t = existing ? advanceThread(existing.id, ctx.ep, line) : openThread(FAMILY, [a, b], ctx.ep, line);
      threadId = t?.id;
    } else if (branch === 'malicious') {
      bondDelta = -3;
      addBond(a, b, bondDelta);
      if (existing) { closeThread(existing.id, ctx.ep, 'failed-maliciously'); threadId = existing.id; }
      else threadId = openThread(FAMILY, [a, b], ctx.ep, line)?.id;
    } else {
      bondDelta = -1;
      addBond(a, b, bondDelta);
      if (existing) { closeThread(existing.id, ctx.ep, 'test-exposed'); threadId = existing.id; }
      else threadId = openThread(FAMILY, [a, b], ctx.ep, line)?.id;
    }
    return { branch, pair: [a, b], threadId, bondDelta };
  },
});
