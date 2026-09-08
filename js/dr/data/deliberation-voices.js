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

const taste = (id, note, champion, dismiss) => ({
  taste: id, note, tiers: [tier('champion', champion), tier('dismiss', dismiss)],
});

export const ADVOCACY = [
  taste('challenge',
    'SHE WATCHES WHAT THE QUEEN DID. The performance, the acting, the joke, the '
    + 'verse — the actual work of the week. A judge arguing from here will '
    + 'forgive a bad look for a good night and is unmoved by a beautiful queen '
    + 'who did nothing.',
    'The work was the best in the room and the rest is detail.',
    'She did not do the challenge, and everything else is decoration.'),
  taste('runway',
    'SHE WATCHES THE GARMENT. Construction, proportion, the idea and whether it '
    + 'survived contact with a body. A judge arguing from here can be entirely '
    + 'uninterested in how funny somebody was.',
    'The look is the best thing that walked and that is not nothing.',
    'The garment does not hold up, and a good night does not fix a bad seam.'),
  taste('risk',
    'SHE WATCHES THE NERVE. Did the queen try something that could have failed? '
    + 'A judge arguing from here would rather see an ambitious mess than a safe '
    + 'success, and says so.',
    'She went for something, and going for something is the whole job.',
    'She played it safe and safe is how you go home in fourth.'),
  taste('polish',
    'SHE WATCHES THE FINISH. Whether it was FINISHED — the paint, the seam, the '
    + 'timing, the thing that separates a professional from somebody having a '
    + 'go. A judge arguing from here is unimpressed by a good idea badly made.',
    'It was finished, and almost nothing on that stage tonight was.',
    'It is unfinished, and she knew it was unfinished when she walked out.'),
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
    + 'the panel is not weighing.'),
  host('dropped',
    'SHE MOVES A QUEEN DOWN. Harder to do and harder to say: the panel liked '
    + '{a} more than the host does, and the host is the one who decides.'),
  host('stood-by',
    'SHE LEAVES IT ALONE. The panel argued, the host listened, and the board '
    + 'they hand back is the board they were given — which is its own decision '
    + 'and should not read as an absence of one.'),
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
