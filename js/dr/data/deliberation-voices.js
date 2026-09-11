// ══════════════════════════════════════════════════════════════════════
// dr/data/deliberation-voices.js — the panel arguing, with the room empty
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// THE MOST COMPUTED THING IN THE SHOW WAS THE LEAST SHOWN. The whole reason
// step 2 of the judging engine exists is that judges weigh different things:
// Law puts 0.55 on the runway and Ross puts 0.20, which is what lets a look
// queen and a comedy queen genuinely disagree about the same night, and what
// makes "she was robbed" possible at all.
//
// All of that is calculated every single week and then thrown away:
//
//   views[judgeId]      every judge's OWN private ranking of every queen
//   ranking[i].spread   how far apart the panel is about her, per queen
//   ranking[i].ranks    the actual different numbers they gave her
//   bend[i]             where the host overruled the panel, and by how much
//
// And the entire report on all of it was ONE narrator line, once a night:
// "One judge argues for the look, another argues for the performance." It
// does not say which judges, which queen, or which look. It is a description
// of a disagreement rather than the disagreement.
//
// So this is the scene where the panel actually has the argument, with the
// queens sent to the back and the names on the table.
//
// ── THE POOLS ─────────────────────────────────────────────────────────
//
//   ADVOCACY   4 taste dimensions × 2 stances.  What one judge argues, and why.
//   HOST_CALL  3 outcomes.                      What the host does about it.
//
// ── WHY TASTE DIMENSIONS ──────────────────────────────────────────────
//
// A judge's `taste` in js/dr/data/judges.js is four numbers that sum to one,
// and the largest is what she is really watching. That is her ARGUMENT. Law's
// is `runway`, so when Law defends a queen he is defending a look; Ross's is
// `challenge`, so when Ross defends the same queen he is defending a
// performance, and the two of them are not disagreeing about the queen at all
// — they are disagreeing about what the week was for.
//
// That is the sentence this file has to produce, and it is the one the old
// beat was gesturing at without the data.
//
// The engine picks, for each contested queen, the judge who ranked her HIGHEST
// and the judge who ranked her LOWEST — so the pairing is measured rather than
// assigned. What each of them argues FROM is the dimension the two of them are
// furthest apart on, not simply the one each watches most: RuPaul weights the
// challenge at 0.45 and Michelle at 0.40, so "largest weight" made both of
// them argue from the challenge and the scene printed two people agreeing
// about the premise while disagreeing about nothing. See `divergentTastes`.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// Fill the `lines` arrays. Change nothing else.
//
// THIRD PERSON, AND A CLOSED ROOM. Nobody is performing. The queens are in
// Untucked and cannot hear this, the cameras are on but the judges have
// stopped playing to them, and people who are warm on the main stage are
// blunt here. This is the only place in the show where a judge says what she
// actually thinks without softening it for the queen standing in front of her.
//
// Placeholders:
//   {a}  the queen being argued about.
//   {j}  the judge doing the arguing.
//   {e}  the OTHER judge — the one on the opposite side. Optional, and only
//        legal in ADVOCACY, where there genuinely is one.
//
// NAME THE THING SHE IS ARGUING FROM. A `runway` champion is defending a
// garment — the construction, the proportion, the idea. A `challenge`
// champion is defending what the queen DID in the challenge and does not much
// care what she wore. A line that would work for any of the four dimensions
// is the line this file exists to replace.
//
// Same rules as every other pool, all enforced by tests: no real people beyond
// the authored panel, this show's vocabulary only, never quote a stat by
// number, prose rather than captions.

/** A tier of lines: what it is for, then the lines themselves. */
const tier = (id, note, lines = []) => ({ id, note, lines });

/** The four things a judge can be watching. These are `taste` in judges.js. */
export const TASTE_IDS = ['challenge', 'runway', 'risk', 'polish'];

/**
 * HOW MANY VARIANTS. The argument fires twice per contested queen and the
 * engine argues about three of them, so six advocacy lines a night are drawn
 * from a pool of eight tiers — but they concentrate, because a panel of four
 * has at most four dominant dimensions and two judges often share one. Six
 * variants per tier keeps a night clean.
 */
export const DELIBERATION_VARIANTS = { advocacy: 6, host: 4 };

// ══════════════════════════════════════════════════════════════════════
// POOL 1 — ONE JUDGE'S ARGUMENT, FROM WHAT SHE ACTUALLY WATCHES
// ══════════════════════════════════════════════════════════════════════

/**
 * One judge's two stances, from whatever shape the author used.
 *
 * VARARGS, because a helper that only takes NOTES cannot be filled — there is
 * nowhere for the lines to go, so anybody writing prose has to break out of
 * it, and the file stops parsing the moment they do. That happened to the
 * pick pool in maxi-voices.js. Notes, note-and-lines pairs, and already-built
 * tiers all work here, in stance order.
 */
const STANCES = ['champion', 'dismiss'];
const tiersFrom = (ids, args) => {
  const out = [];
  let i = 0;
  for (const id of ids) {
    const v = args[i];
    if (v && typeof v === 'object' && !Array.isArray(v)) { out.push(v); i += 1; continue; }
    if (Array.isArray(args[i + 1])) { out.push(tier(id, v, args[i + 1])); i += 2; continue; }
    out.push(tier(id, v));
    i += 1;
  }
  return out;
};

const taste = (id, note, ...rest) => ({
  taste: id, note, tiers: tiersFrom(STANCES, rest.flat()),
});

export const ADVOCACY = [
  taste('challenge',
    'SHE WATCHES WHAT THE QUEEN DID. The performance, the acting, the joke, the '
    + 'verse — the actual work of the week. A judge arguing from here will '
    + 'forgive a bad look for a good night and is unmoved by a beautiful queen '
    + 'who did nothing.',
    tier('champion', 'The work was the best in the room and the rest is detail.', [
      '{j} leans forward and says what {j} has been waiting to say since the challenge ended: {a} did the work tonight, and the work is what the week was about, and anybody who did not see it was watching the wrong thing.',
      '{j} makes the case from the challenge and the case is simple — {a} was the funniest, or the sharpest, or the most committed, and {j} does not much care what she was wearing while she did it.',
      '{j} argues for {a} from the performance and the argument is the performance itself — what {a} did on that stage, in the moment, when the challenge was happening, which is the part of the night that {e} is not talking about.',
      '{j} says it plainly: {a} did the best work in the challenge tonight and the runway is not the challenge. The challenge is the challenge and the garment is a garnish, and {j} is tired of watching queens get saved by a dress.',
      '{j} champions {a} on the strength of the challenge alone and does not apologise for it — the week had a task and {a} did it better than anybody else on that stage, and {j} thinks that should count for more than it is counting.',
      '{j} pushes back on {e} by naming what {a} actually did tonight: the line that landed, the choice that worked, the moment that carried the whole number — and asks whether any of that is less real because the look was not a ten.',
    ]),
    tier('dismiss', 'She did not do the challenge, and everything else is decoration.', [
      '{j} is blunt: {a} did not do the work tonight. The look was fine, the walk was fine, but the challenge is the reason they are all here and {a} did not show up for it.',
      '{j} dismisses {a} from the challenge and the dismissal is specific — not that {a} was bad, but that {a} was absent, standing on the stage without doing the thing the stage was there for.',
      '{j} shakes her head and says what the room is thinking: {a} looked beautiful and did nothing, and looking beautiful while doing nothing is not the same as doing something, no matter what {e} says about the garment.',
      '{j} argues against {a} from the performance and the argument is that there was no performance — {a} was present and prepared and none of it translated into work that {j} can point to and defend.',
      '{j} cuts through {e}\'s defence with a question: what did {a} actually do in the challenge? Not what did she wear, not how did she walk — what did she do? And if the answer takes too long, the answer is not enough.',
      '{j} says it without softening it: the challenge was the assignment and {a} did not complete the assignment, and a good runway is not extra credit — it is a different subject.',
    ])),
  taste('runway',
    'SHE WATCHES THE GARMENT. Construction, proportion, the idea and whether it '
    + 'survived contact with a body. A judge arguing from here can be entirely '
    + 'uninterested in how funny somebody was.',
    tier('champion', 'The look is the best thing that walked and that is not nothing.', [
      '{j} defends {a} from the runway and the defence is the garment itself — the construction, the proportion, the way the fabric moved when {a} hit the end of the stage, which is something {e} apparently did not notice.',
      '{j} points at {a}\'s look and makes the argument that the look makes: it is the best thing that walked tonight, it is built rather than bought, and {j} does not think the panel should pretend that is not worth something.',
      '{j} champions {a} on the strength of the garment and champions the garment on the strength of its construction — the seams, the silhouette, the idea that survived contact with a body, which is harder than {e} is giving it credit for.',
      '{j} leans into the runway argument and does not back down: {a}\'s look was the strongest on that stage tonight and a queen who can dress like that is a queen who understands something about this format that the challenge alone does not measure.',
      '{j} makes the case for {a}\'s runway and the case is visual — the proportion is right, the detail reads from the back row, and the whole thing was a choice rather than a costume, which is the distinction {j} keeps trying to explain to {e}.',
      '{j} says what {j} always says: the runway is half the show and {a}\'s runway was the best half of anybody\'s night, and dismissing that because the challenge was uneven is dismissing the thing that separates a drag queen from a performer.',
    ]),
    tier('dismiss', 'The garment does not hold up, and a good night does not fix a bad seam.', [
      '{j} is direct about it: {a}\'s look did not hold up. The construction was visible, the concept was unclear, and no amount of charm in the challenge fixes a garment that falls apart under a light.',
      '{j} dismisses {a} from the runway and the dismissal is about craft — not taste, not concept, but whether the thing on {a}\'s body was built by a person who knows how to build a garment, and {j} does not think it was.',
      '{j} shakes her head at {a}\'s look and says what a garment judge says: it is not finished, it is not proportioned, and it would not survive a second walk, and {e} defending the challenge does not change what {j}\'s eyes can see.',
      '{j} argues against {a} on the runway and the argument is the seam — one seam, visible from the panel, that tells {j} everything about how much time and how much skill went into the garment, and the answer to both is not enough.',
      '{j} says it flatly: the look was not good enough. The challenge was strong but the runway was weak, and {j} does not think a strong challenge buys a queen permission to walk out in something unfinished.',
      '{j} pushes back on {e} by asking a question {e} cannot answer from the challenge: would you wear it? Would you put that garment on a rack? Because {j} would not, and {j} thinks that matters.',
    ])),
  taste('risk',
    'SHE WATCHES THE NERVE. Did the queen try something that could have failed? '
    + 'A judge arguing from here would rather see an ambitious mess than a safe '
    + 'success, and says so.',
    tier('champion', 'She went for something, and going for something is the whole job.', [
      '{j} champions {a} on nerve alone and does not pretend the execution was flawless — {a} went for something that could have failed, and going for something that could have failed is the thing {j} is here to reward.',
      '{j} argues for {a} from the risk and the argument is about ambition: {a} tried a thing nobody else on that stage tried, and {j} would rather see a queen swing and miss than a queen who never picked up the bat.',
      '{j} defends {a} by naming what {a} risked — a choice that was visible, a commitment that could have gone wrong, a version of the assignment that nobody asked for and nobody expected — and says that the risk is the point.',
      '{j} leans forward and tells {e} that safe is not a compliment: {a} took a chance tonight and the chance did not fully land, but {j} would rather judge a queen who took the chance than a queen who delivered exactly what was expected and nothing more.',
      '{j} makes the case for {a} from nerve and the case is philosophical — this is a show about drag and drag is about risk, and {a} understood that tonight in a way that the queens {e} is defending did not.',
      '{j} champions {a} for going somewhere nobody else went, and the championing is deliberate — {j} knows the execution was imperfect and is arguing that imperfect execution of an ambitious idea outranks perfect execution of a boring one.',
    ]),
    tier('dismiss', 'She played it safe and safe is how you go home in fourth.', [
      '{j} dismisses {a} on nerve: everything {a} did tonight was correct and none of it was interesting, and {j} has seen enough safe queens to know that safe is a ceiling, not a floor.',
      '{j} argues against {a} from risk and the argument is about absence — {a} did not try anything that could have failed, which means {a} did not try anything that could have been great, and {j} thinks that is worse than failing.',
      '{j} says what {j} says every time a queen plays it safe: {a} delivered exactly what was expected, nothing surprised, nothing caught {j}\'s eye, and a queen who never surprises is a queen who has decided that adequate is enough.',
      '{j} is unimpressed by {a}\'s competence and says so: the work was fine, the look was fine, everything was fine, and fine is how you go home in fourth place while telling yourself you never did anything wrong.',
      '{j} pushes back on {e}\'s defence of {a} with a question about ambition: what did {a} risk tonight? What could have gone wrong? And if the answer is nothing, then {a} was not competing — {a} was surviving, and surviving is not the same thing.',
      '{j} dismisses {a} for coasting and the dismissal is specific: {a} had the skill to do more, the platform to do more, and the time to do more, and chose to do exactly enough, which {j} reads as a choice not to compete.',
    ])),
  taste('polish',
    'SHE WATCHES THE FINISH. Whether it was FINISHED — the paint, the seam, the '
    + 'timing, the thing that separates a professional from somebody having a '
    + 'go. A judge arguing from here is unimpressed by a good idea badly made.',
    tier('champion', 'It was finished, and almost nothing on that stage tonight was.', [
      '{j} champions {a} on polish and the championing is about professionalism: {a}\'s work was finished, her paint was right, her timing was clean, and in a room full of rough edges {j} thinks that deserves to be rewarded.',
      '{j} defends {a} from the finish and the defence is about the gap between {a} and everybody else — not in concept or in ambition but in execution, in the thing that separates a queen who had an idea from a queen who delivered one.',
      '{j} argues for {a} by pointing at what nobody else on that stage had: a complete package, top to bottom, where nothing was improvised and nothing was left to chance, and {j} thinks that discipline is worth more than {e} is giving it.',
      '{j} makes the case that {a}\'s polish is the story of the night: the paint was blended, the garment was pressed, the performance was timed to the second, and {j} is not going to apologise for rewarding a queen who came prepared.',
      '{j} leans into the finish and says what a polish judge says: {a} was the only queen tonight who looked like she had done this before, and looking like you have done this before is not a small thing on a stage full of queens who did not.',
      '{j} champions {a} on the detail that reads from the back row — the stitching, the hemline, the mug that did not move under the lights — and tells {e} that the detail is not a garnish, it is the work itself.',
    ]),
    tier('dismiss', 'It is unfinished, and she knew it was unfinished when she walked out.', [
      '{j} dismisses {a} on polish and the dismissal is clinical: the garment was not finished, the paint was not blended, and {a} walked out knowing it was not done and hoping nobody would look too closely, and {j} looked closely.',
      '{j} argues against {a} from the finish and the argument is about respect — respect for the stage, for the panel, for the craft itself, because a queen who walks out in something unfinished is a queen who has decided that the panel will not notice.',
      '{j} shakes her head and says what the garment says: it is not done. The concept is there, the ambition is there, and neither of those things is a substitute for a seam that holds and a hem that is straight.',
      '{j} is unimpressed by {a}\'s idea because {a}\'s idea is not what walked — what walked was a draft of an idea, unfinished and unblended, and {j} does not judge drafts, {j} judges garments.',
      '{j} dismisses {a} on the detail and the detail is damning: a visible seam, an unblended edge, a paint line that moved under the lights, and {e} defending the concept does not change what {j} can see with her own eyes.',
      '{j} says it without malice but without softening it: {a} ran out of time or ran out of skill, and either way the result is on the stage and the result is not finished, and {j} cannot call an unfinished thing a success.',
    ])),
];

// ══════════════════════════════════════════════════════════════════════
// POOL 2 — WHAT THE HOST DOES ABOUT IT
// ══════════════════════════════════════════════════════════════════════
//
// The host does not sit in the panel's ranking; `hostBend` reorders it, and
// that reorder is the single most consequential decision of the night. It has
// been recorded on every row since the judging engine was written and shown
// only as a small badge on the results screen — never spoken, never argued
// for, and never in the room where it happens.
//
// She does not explain herself in the terms the panel is using. The judges are
// arguing about a garment and a performance; she is thinking about a season.

const host = (id, note, lines = []) => ({ id, note, lines });

export const HOST_CALL = [
  host('lifted',
    'SHE MOVES A QUEEN UP, past where the panel put her. {a} is the queen, and '
    + 'the host is overruling people who have just spent ten minutes explaining '
    + 'why she should be lower. She does not argue the craft — she has a reason '
    + 'the panel is not weighing.', [
      'The host listens to the panel and then moves {a} up, past the position the judges agreed on, and does not explain the move in terms any of them were using — the host is thinking about a season, not a single night.',
      'The host overrules the panel on {a} and the overruling is quiet: no argument, no rebuttal, just a name moved higher on the board by the one person in the room who does not have to justify it to the others.',
      'The host lifts {a} past where the panel placed her, and the lift is the kind of decision that only the host can make — not about the challenge, not about the runway, but about something the host has been watching that the judges have not.',
      'The host moves {a} up and the judges look at the board and look at the host and the host does not offer a reason, because the reason is not about tonight — it is about what the host sees in {a} that the panel has not weighed yet.',
    ]),
  host('dropped',
    'SHE MOVES A QUEEN DOWN. Harder to do and harder to say: the panel liked '
    + '{a} more than the host does, and the host is the one who decides.', [
      'The host moves {a} down, past where the panel put her, and the room gets quieter because a drop is harder than a lift — the panel liked {a} more and the host is saying the panel is wrong.',
      'The host lowers {a} on the board and does not argue the craft — the judges made their case and the host heard it and is overruling it anyway, because the host weighs things the panel does not discuss.',
      'The host drops {a} past the position the judges defended, and the drop is the hardest call in the room — it means the host watched the same night the panel watched and reached a different conclusion, and the host\'s conclusion is the one that counts.',
      'The host moves {a} down and the move is decisive: the panel argued for her and the host listened and the host disagrees, and disagreeing with a panel that just spent ten minutes defending a queen is a decision the host does not make lightly.',
    ]),
  host('stood-by',
    'SHE LEAVES IT ALONE. The panel argued, the host listened, and the board '
    + 'they hand back is the board they were given — which is its own decision '
    + 'and should not read as an absence of one.', [
      'The host looks at the board the panel built and leaves it where it is, which is not indecision — it is the host agreeing with the argument, or at least agreeing enough not to overrule it, and agreement from the host is its own kind of verdict.',
      'The host listens to the panel argue and when the arguing is over the board stays where it is, and the staying is a choice — the host could have moved a name and chose not to, and choosing not to is as deliberate as choosing to.',
      'The panel finishes and the host lets the board stand, and the standing is the call — not a default, not an absence of opinion, but a decision that the panel got it right tonight, or close enough to right that the host will not intervene.',
      'The host heard the arguments from both sides and the board does not change, which the judges read as agreement and which the host reads as something closer to patience — the board is close enough tonight, and the host saves the corrections for nights when it is not.',
      'The judges watch the host for a sign and the sign they get is a shrug so small it barely moves her shoulders — the shrug of a woman who was ready to fight for a different order and decided it was not worth the argument tonight.',
      'The panel finishes arguing and the host leaves the board alone. \"I agree,\" she says, and the agreement is brief and final.',
      'One judge opens her mouth to make one more argument and the host raises a finger — just one — and the judge stops. The finger says the deliberation is over and the order stands.',
      'The board stays where the panel put it. The host does not explain why — she does not need to. The panel made a case and the case held.',
      'The host surveys the board and lets it stand. \"Bring back my girls,\" she says, and the board she hands back is the board she was given.',
    ]),
];

// ══════════════════════════════════════════════════════════════════════
// LOOKUP
// ══════════════════════════════════════════════════════════════════════

/**
 * What this judge is really watching — the largest of her four taste weights.
 *
 * Ties break in TASTE_IDS order rather than at random, so the same judge
 * argues from the same place every week. A judge whose taste is genuinely
 * flat is a judge with no argument, and the order at least makes her
 * consistent about it.
 */
export function dominantTaste(judge) {
  const t = (judge && judge.taste) || {};
  let best = null;
  let bestV = -Infinity;
  for (const k of TASTE_IDS) {
    const v = Number(t[k]);
    if (Number.isFinite(v) && v > bestV) { bestV = v; best = k; }
  }
  return best || 'challenge';
}

/**
 * WHERE TWO JUDGES ACTUALLY DIFFER, which is not the same as what each of
 * them watches most.
 *
 * The first version gave each judge her own dominant taste and it produced
 * "Michelle defends Q10 on the challenge, RuPaul buries Q10 on the challenge"
 * — because RuPaul weights `challenge` at 0.45 and Michelle at 0.40, so the
 * largest weight is the same one for both of them and the scene had two
 * people arguing from the same premise. That is not a disagreement, it is a
 * contradiction.
 *
 * The disagreement is the dimension they are FURTHEST APART on, and the side
 * each takes falls out of which of them weights it higher. Law at 0.55 on the
 * runway against Ross at 0.20 is the argument; that they both also care about
 * the challenge is what they have in common, not what they are fighting over.
 *
 * Returns the taste each of the two speaks from. They may be the same when
 * two judges have identical tastes, which is a panel with nothing to say and
 * the caller can drop the scene.
 */
export function divergentTastes(a, b) {
  const ta = (a && a.taste) || {};
  const tb = (b && b.taste) || {};
  let best = null;
  let gap = -Infinity;
  for (const k of TASTE_IDS) {
    const d = Math.abs((Number(ta[k]) || 0) - (Number(tb[k]) || 0));
    if (d > gap) { gap = d; best = k; }
  }
  if (!best || gap <= 0) {
    return { forTaste: dominantTaste(a), againstTaste: dominantTaste(b), gap: 0 };
  }
  // Whoever weights the contested dimension higher argues FROM it; the other
  // argues from whatever she is watching instead.
  const aHigher = (Number(ta[best]) || 0) >= (Number(tb[best]) || 0);
  return {
    forTaste: aHigher ? best : dominantTaste(a),
    againstTaste: aHigher ? dominantTaste(b) : best,
    gap,
  };
}

/** One judge's argument, or null — the usual fallback contract. */
export function advocacyLinesFor(tasteId, stance) {
  const a = ADVOCACY.find(x => x.taste === tasteId);
  const t = a && a.tiers.find(y => y.id === stance);
  return t && t.lines.length ? t.lines : null;
}

/** The host's call, or null. */
export function hostCallLinesFor(outcome) {
  const h = HOST_CALL.find(x => x.id === outcome);
  return h && h.lines.length ? h.lines : null;
}

/** Every tier still short of its variant count. */
export function unwrittenDeliberationVoices() {
  const out = [];
  for (const a of ADVOCACY) {
    for (const t of a.tiers) {
      if (t.lines.length < DELIBERATION_VARIANTS.advocacy) {
        out.push(`advocacy:${a.taste}/${t.id} (${t.lines.length}/${DELIBERATION_VARIANTS.advocacy})`);
      }
    }
  }
  for (const h of HOST_CALL) {
    if (h.lines.length < DELIBERATION_VARIANTS.host) {
      out.push(`host:${h.id} (${h.lines.length}/${DELIBERATION_VARIANTS.host})`);
    }
  }
  return out;
}

/** How many tiers exist, for the progress report. */
export function deliberationTierCount() {
  return ADVOCACY.reduce((n, a) => n + a.tiers.length, 0) + HOST_CALL.length;
}
