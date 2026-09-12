// ══════════════════════════════════════════════════════════════════════
// dr/judging.js — steps 2 and 3: how it was SEEN, and what was DONE about it
// ══════════════════════════════════════════════════════════════════════
//
// Step 2. Each judge takes the same performance and weighs it by their own
// taste, so a look queen and a comedy queen genuinely disagree about the same
// night. The merged ranking is what the panel thinks; the SPREAD across judges
// is recorded, because a week they disagree about is a week the host has room
// to move in.
//
// Step 3. The host reorders that ranking, within hard bounds. This is the part
// that has to be got exactly right in both directions: a host who can do
// anything is a random number generator with a name, and a host who can do
// nothing makes the panel the entire show. He can lean on a close call. He
// cannot crown somebody the panel put last.
import { noise } from './perform.js';

/**
 * Every judge's view of every queen, best first.
 *
 * `memory` is what each judge already thinks of her — a queen they have put in
 * the bottom twice reads as bottom-ish before she opens her mouth, which is
 * both true to the format and the thing that makes a redemption arc legible.
 */
export function judgeViews(panel, entries, memory = {}, rng = Math.random) {
  const out = {};
  for (const j of panel) {
    const mem = (memory && memory[j.id]) || {};
    const rows = entries.map(e => {
      const t = j.taste;
      /* ── ON A DESIGN NIGHT THE RUNWAY WEIGHT HAS NOWHERE OF ITS OWN TO GO ──
         A Ball, a Design challenge and a Runway challenge deliver ONE look, so
         `e.runway` is `e.perf` (see runwayIsChallenge in
         js/dr/data/challenges.js). Left alone, `t.challenge * perf +
         t.runway * perf` points 70% of a seat's weight at a single number and
         the panel stops being a second reading of the night — it becomes the
         challenge score with a rounding error, and the three-step rule in
         CLAUDE.md (what she did, what the panel thought, what the host
         decided) loses its middle step.
         So the runway weight goes to the two things that ARE still separate
         when the look is the challenge: whether she took a swing, and whether
         it is finished. Split between them in the proportion this judge
         already holds them, so a seat that never cared about risk does not
         start caring now. Total weight per judge is unchanged. */
      const fold = !!e.runwayIsChallenge;
      const rp = (t.risk + t.polish) || 1;
      const wChallenge = t.challenge;
      const wRunway = fold ? 0 : t.runway;
      const wRisk = t.risk + (fold ? t.runway * (t.risk / rp) : 0);
      const wPolish = t.polish + (fold ? t.runway * (t.polish / rp) : 0);
      const view = wChallenge * e.perf
        + wRunway * e.runway
        + wRisk * (e.risk * 10)
        + wPolish * (e.polish ?? 5)
        + ((j.styleBias || {})[e.style] || 0)
        + (mem[e.name] || 0)
        /* ── THE NIGHT SHE HAD IS NOT A TERM HERE ANY MORE ──
           `form` — one draw per queen for whether she was off tonight — used
           to be added to this sum, RAW, while every other input is scaled by
           the seat's taste weight first. A +/-2.5 wobble therefore competed
           against 0.4 x a challenge score, and measured across forty seasons
           it moved a queen MORE than the challenge did: 1.44 against the
           challenge's 1.00 and the runway's 0.76. A dice roll was the single
           largest determinant of who won the week, which is why a queen
           could be shown a 9.34 and called LOW while a 7.14 won the night.

           It lives in js/dr/week.js now, folded into `perf` before the panel
           ever sees it, at a size chosen so its pull on this sum is
           unchanged. Being off tonight is a fact about her PERFORMANCE, not
           an opinion four judges add to a performance that went fine — and
           putting it in the performance means the panel, the chart and the
           card on the challenge screen are all reading the same night. The
           reasoning, and the numbers on both sides of it, are in the comment
           there. */
        /* ── WHAT THEY ALREADY KNOW ABOUT HER, WHICH IS NORMALLY NOTHING ──
           A weekly panel judges the night. It does not get to say "but she
           won two challenges" — the show has already paid her for those, and
           letting a résumé into a weekly view would be the panel overruling
           its own earlier judgement a second time.
           A FINALE IS THE ONE NIGHT WHERE IT IS THE ACTUAL QUESTION. "Your
           track record" is said out loud on that stage, and the finale used
           to have no way to say it: the field was narrowed on a single
           showcase with `runway` and `polish` hardcoded to 5, so the queen
           with the best season was cut before the song a third of the time
           and the résumé term in the crown duel only ever applied to the two
           who had already survived her.
           Defaults to 0, so every ordinary week is unchanged. */
        + (e.resume || 0)
        /* ── WHAT SOMEBODY WHO WAS THERE TOLD THEM ──
           A few challenges are shot away from the main stage with a
           professional running the room — a director on the music video, and
           the acting and commercial challenges next. He is not on the panel
           and he does not score her; he REPORTS, which is what happens on the
           real show and is why "she was a dream on set" reaches the critiques
           at all.
           One small bounded term, because it must be able to tip a close call
           and must never decide a week: the day is evidence about the night,
           not a second verdict on it. Defaults to 0, so every challenge that
           has no such figure is untouched — see js/dr/chal/music-video.js,
           which is the only writer of it today. */
        /* FULL FOR THE ONE WHO WAS THERE, HALF FOR THE REST. The day is run
           by a member of the panel — Michelle directs the shoot and runs the
           booth — so this is not a report reaching the judges, it is one
           judge's own eyes and three colleagues taking her word for it. A flat
           term treated all four as if they had been on the set. */
        + (e.impression || 0)
          * (e.impressionFrom && j.id !== e.impressionFrom ? 0.5 : 1)
        + noise(rng, 1.0);
      return { name: e.name, view: Math.round(view * 100) / 100 };
    });
    // Ties broken by name so a re-run of the same seed gives the same board.
    rows.sort((a, b) => b.view - a.view || a.name.localeCompare(b.name));
    rows.forEach((r, i) => { r.rank = i + 1; });
    out[j.id] = rows;
  }
  return out;
}

/** Mean rank across the panel, best first, with the disagreement recorded. */
export function panelRanking(views) {
  const byName = {};
  for (const id of Object.keys(views)) {
    for (const r of views[id]) (byName[r.name] ||= []).push(r.rank);
  }
  const rows = Object.entries(byName).map(([name, ranks]) => ({
    name,
    meanRank: ranks.reduce((a, b) => a + b, 0) / ranks.length,
    spread: Math.max(...ranks) - Math.min(...ranks),
    ranks,
  }));
  rows.sort((a, b) => a.meanRank - b.meanRank || a.name.localeCompare(b.name));
  rows.forEach((r, i) => { r.panelRank = i + 1; });
  return rows;
}

/** A week the judges do not agree about at the ends, where it matters. */
export function isSplitPanel(ranking) {
  const n = ranking.length;
  if (n < 4) return false;
  const ends = [...ranking.slice(0, 2), ...ranking.slice(-2)];
  return ends.some(r => r.spread >= Math.max(2, Math.floor(n / 4)));
}

/**
 * The host reorders the panel's ranking, within bounds.
 *
 *   bend = star*0.4 + storylineNeed*0.4 + trackPull*0.2      (star scaled 0..1)
 *
 * THE BOUNDS, and they hold for the whole cast simultaneously rather than one
 * queen at a time:
 *
 *   * nobody moves more than two places, or three on a split week;
 *   * a queen the panel put in its bottom two cannot win;
 *   * a queen the panel put first cannot end up in the bottom two.
 *
 * Implemented as a CONSTRAINED ASSIGNMENT rather than a sort-then-repair.
 * Sorting by preference and swapping violators back is the obvious approach
 * and it is wrong: a pile-up of bends can displace a queen by more than the
 * limit, and repairing by swapping can push the neighbour out of bounds in
 * turn and oscillate. Here each queen gets a window of legal positions, and
 * positions are filled in order, always taking a queen whose window is about
 * to close before one whose window stays open. The identity ranking is always
 * inside every window, so a legal answer always exists and this always finds
 * one.
 */
/**
 * How hard the host leans.
 *
 * MEASURED, not chosen. Two adjacent queens trade places only when their
 * desired positions cross, so this is the bar a case has to clear before he
 * touches the panel's order at all. Over 100 seasons at 13 queens:
 *
 *     0.45 → the host changes something on 21% of episodes
 *     0.50 → 33%          ← the spec's target
 *     0.60 → 50%
 *     0.70 → 66%
 *     0.80 → 75%
 *
 * AND A TENSION WORTH KNOWING ABOUT. The spec asks for two things at once —
 * a change on about one episode in three, and the occasional two-place move
 * that makes a robbery — and one continuous knob cannot deliver both: single
 * swaps arrive long before two-place jumps, so the strength that produces any
 * big moves (0.80+) has the host meddling three weeks in four. At 0.50 the
 * two-place move never happens.
 *
 * That is the correct state for now rather than a compromise, because the
 * input that is supposed to produce the dramatic cases is not wired yet.
 * `storylineNeed` is all zeros until Plan 3's arc tracker fills it, and it is
 * the term designed to be occasionally LARGE — the underdog who needs a win
 * this week, the fighter who has earned the benefit of a toss-up. Star power
 * and track record are mild and always-on by nature; they should nudge, not
 * overrule. When the tracker lands, re-measure both numbers together rather
 * than raising this constant to fake the tail.
 */
export const BEND_STRENGTH = 0.50;

export function hostBend(ranking, { star = {}, storylineNeed = {}, trackPull = {}, split = false } = {}) {
  const n = ranking.length;
  if (!n) return [];
  const maxMove = split ? 3 : 2;

  // ── STAR POWER IS RELATIVE, AND THIS IS WHY ───────────────────────
  //
  // Read raw, `star` is 0..10 and its term is therefore always positive: it
  // lifted every queen at once and cancelled out. Measured over 100 seasons
  // with the uncentred version, the host moved 0.02 queens per episode and
  // never once moved anybody two places — step 3 of the engine was doing
  // nothing at all and the "robbed" badge could not fire.
  //
  // What matters is not how big a star she is but how big a star she is
  // COMPARED TO THE ROOM SHE IS IN, which is also the truer statement: being
  // the most watchable queen left is what earns the benefit of the doubt, and
  // that changes as the cast shrinks around her.
  // Measured against the cast's OWN SPREAD rather than a fixed divisor, and
  // that detail is the difference between this working and not. Star power is
  // a weighted mean of five terms, so it regresses hard: across 520 queens it
  // ran from 2.9 to 7.8 with the middle eighty percent inside 4.3–6.6. Divided
  // by a constant 5 that became a bend of ±0.16, and since two adjacent queens
  // must differ by more than 1/maxMove to trade places, nobody ever moved.
  //
  // Dividing by the standard deviation of the room makes it a z-score: the
  // most watchable queen of THIS cast gets the full allowance whether the
  // season is full of personalities or full of wallpaper, which is also the
  // truer statement about how a favourite emerges.
  const stars = ranking.map(r => star[r.name] || 0);
  const meanStar = stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : 0;
  const variance = stars.length
    ? stars.reduce((s, v) => s + (v - meanStar) ** 2, 0) / stars.length : 0;
  const sdStar = Math.sqrt(variance) || 1;
  const relStar = name => Math.max(-1, Math.min(1, ((star[name] || 0) - meanStar) / sdStar));

  const rows = ranking.map(r => {
    const bend = relStar(r.name) * 0.4
      + (storylineNeed[r.name] || 0) * 0.4
      + (trackPull[r.name] || 0) * 0.2;
    return {
      name: r.name,
      panelRank: r.panelRank,
      bend: Math.round(bend * 1000) / 1000,
      // Where he would put her if nothing else were in the way.
      //
      // BEND_STRENGTH is what decides how often he intervenes at all. Two
      // adjacent queens trade places only when their desired positions cross,
      // which needs their bends to differ by more than 1/(maxMove*strength) —
      // so the constant is not a volume knob on a continuous effect, it is the
      // bar a case has to clear before the host touches the panel's order.
      // Tuned against the spec's two targets and re-measured over 100 seasons.
      desired: r.panelRank - bend * maxMove * BEND_STRENGTH,
    };
  });

  // Each queen's legal window, tightened by the two special rules.
  for (const r of rows) {
    r.lo = Math.max(1, r.panelRank - maxMove);
    r.hi = Math.min(n, r.panelRank + maxMove);
    if (n >= 3) {
      if (r.panelRank >= n - 1) r.lo = Math.max(r.lo, 2);        // cannot be crowned
      if (r.panelRank === 1) r.hi = Math.min(r.hi, n - 2);       // cannot be in the bottom two
    }
  }

  const unplaced = new Set(rows);
  const placed = [];
  for (let pos = 1; pos <= n; pos++) {
    const legal = [...unplaced].filter(r => r.lo <= pos && pos <= r.hi);
    // Anybody whose window closes at this position must be placed now or the
    // arrangement becomes impossible. Among those, and otherwise among all the
    // legal ones, the host takes whoever he most wanted here.
    const forced = legal.filter(r => r.hi === pos);
    const pool = forced.length ? forced : legal;
    // `pool` is never empty: the identity assignment is legal for every queen,
    // so the queen whose panelRank is `pos` is always available or already
    // placed at an earlier position.
    const pick = pool.reduce((best, r) =>
      (r.desired < best.desired || (r.desired === best.desired && r.panelRank < best.panelRank) ? r : best),
    pool[0]);
    pick.finalRank = pos;
    unplaced.delete(pick);
    placed.push(pick);
  }

  return placed.map(({ name, panelRank, finalRank, bend }) => ({ name, panelRank, finalRank, bend }));
}

/**
 * Win / high / safe / low / bottom, sized by how many are left.
 *
 * A twelve-queen room gets three called up and three called down; a final six
 * gets two and two, because calling six of eight queens forward is not a
 * critique, it is a group photo.
 */
export function callWeek(finalRanking, {
  castSize, immune = [],
  // How many the panel names as the bottom. Two is the ordinary week — the
  // pair who lip sync. A format that announces a bottom THREE and then saves
  // one of them passes 3, which is what `atRisk` is for.
  bottomNamed = 2,
  // Team-judged challenges (girl group, rusical): the winning team is safe as
  // a block — its best queen takes WIN, the rest HIGH — and only the losing
  // team provides the bottom.  `teams` is the array of name-arrays from the
  // challenge module, `bestTeam` is the index of the winning one.
  teamJudged = false, teams = null, bestTeam = null,
  /* The week's own stream. Given one, the size of the stage is drawn from the
     real show's distribution rather than fixed at its mean -- see
     `drawFrom` below. Absent, every night is the mean night. */
  rng = null,
} = {}) {
  /* ── TEAM-JUDGED PATH ──────────────────────────────────────────────
     Winning team: ranked among themselves — best = WIN, rest = HIGH.
     Losing team:  ranked among themselves — worst 2 = BTM2, next = LOW,
                   rest = SAFE.  Immunity still applies inside the losing
                   team.  The host bend already ran on the full ranking, so
                   finalRank is authoritative; we just partition it. */
  /* HOW MANY ARE CALLED UP, decided once for both paths. It used to live
     below the team branch, so a team night never saw it — see the cap on the
     winning team a few lines down. */
  /* ── AND HOW BIG THE STAGE IS TONIGHT ──
     The counts above are means. The real show does not hit its mean every
     week -- measured over the same 87 nights, by
     tools/dr-real-critique-size.py:

       queens called up   1: 5%   2: 23%   3: 45%   4: 18%   5+: 8%
       marked LOW         0: 25%  1: 54%   2: 16%   3: 5%

     Three up and one low is the ordinary night and it is not even half of
     them. A night where the panel had four people it wanted to talk to, or
     none it wanted to warn, is normal -- and a simulator that produces the
     mean every single week reads as a formula, which is the complaint this
     answers.

     THE BOTTOM IS NOT ROLLED. How many queens are in danger is a format
     decision the season already books -- an ordinary week, a bottom three, a
     double, a week where nobody goes home -- and rolling it here would take
     that decision away from the schedule and make a re-run unreproducible.
     Only the top and the LOW vary, which is where the real show's variation
     actually lives.

     Drawn from the week's own stream, so the same seed and the same episode
     produce the same stage however many times the season is rebuilt. A caller
     that passes no rng gets the mean night every time, which is what every
     test and every headless season wants. */
  const drawFrom = table => {
    if (!rng) return null;
    const total = table.reduce((t, [, w]) => t + w, 0);
    let roll = rng() * total;
    for (const [value, weight] of table) {
      roll -= weight;
      if (roll <= 0) return value;
    }
    return table[table.length - 1][0];
  };
  /* ── THE TOTAL IS DRAWN, THEN SPLIT ──
     The first version of this drew the top and the LOW independently from
     their own distributions. Each was right on its own and the PAIR was not:
     independent tails compound, so a big top and a big low landed together
     more often than they ever do, and an eleven-queen room could put nine on
     the stage and dismiss two.

     The night's size is one decision. Drawn from the real total and then
     split into a top and a low, so the shape of a night can vary without the
     size of it drifting past what the show does. */
  const SPOKEN_TABLE = [[3, 3], [4, 13], [5, 23], [6, 34], [7, 16], [8, 7], [9, 2], [10, 1]];
  const LOW_TABLE = [[0, 25], [1, 54], [2, 16], [3, 5]];

  /* ── MEASURED AGAINST THE REAL SHOW, NOT GUESSED ──
     tools/dr-real-critique-size.py reads the progress tables of seasons 9-16
     and counts, per night, how many queens were NOT safe against how many
     were left. 87 nights:

       room   13    12    11    10     9     8     7     6     5     4
       mean  5.9   5.8   6.2   5.6   5.9   6.6   6.3   5.4   4.7   3.8

     It is FLAT at about six from thirteen queens down to six, and only falls
     at five. The real show does not shrink the top of the stage as the cast
     shrinks -- it keeps calling three up and three down until there is nobody
     left to dismiss.

     This used to step at twelve (`size >= 12 ? 3 : ...`), so a single
     elimination taking a room from twelve to eleven turned a six-critique
     night into a five-critique one with nothing about the challenge changed.
     Holding three until six puts every room from 6 to 14 at six critiqued,
     inside the measured range for every one of those sizes. */
  const upFor = size => (size >= 6 ? 3 : size >= 5 ? 2 : 1);

  if (teamJudged && teams && bestTeam != null && teams.length > 1) {
    const winTeam = new Set(teams[bestTeam] || []);
    const byRank = [...finalRanking].sort((a, b) => a.finalRank - b.finalRank);
    const winners = byRank.filter(r => winTeam.has(r.name));
    const losers  = byRank.filter(r => !winTeam.has(r.name));

    /* ── THE WHOLE WINNING TEAM USED TO BE CALLED UP ──
       `high` was `winners.slice(1)` — every queen on the winning team bar the
       one taking WIN. On a twelve-queen night in two teams of six that is nine
       queens critiqued and three safe, where an ordinary week at the same cast
       size critiques six and sends six off. Three teams of four gave seven and
       five. The comment on the ordinary path says what the night is supposed
       to be in as many words: "Six queens are critiqued on an ordinary night."

       The winning team is not a reason to critique more people. It decides WHO
       is at the top, not how many the stage has room for — and a queen on the
       winning team who is not one of them is safe, which is what the show does
       with her.
       Same `up` as an ordinary week, so a team night and a solo night dismiss
       the same number of queens. */
    const room = castSize || finalRanking.length;
    const down0 = Math.max(2, bottomNamed);
    const drawn = drawFrom(SPOKEN_TABLE);
    const spokenFor = drawn === null ? upFor(room) + 1 + down0
      : Math.max(down0 + 2, Math.min(drawn, room >= 9 ? room - 1 : room));
    const lowWanted = Math.max(0, Math.min(drawFrom(LOW_TABLE) ?? 1,
      spokenFor - down0 - 1));
    const up = Math.max(1, spokenFor - down0 - lowWanted);
    const called = winners.slice(0, Math.max(1, up));
    const win  = called.length ? [called[0].name] : [];
    const high = called.slice(1).map(r => r.name);
    // The rest of the winning team: safe, and told so with everybody else.
    const winSafe = winners.slice(called.length).map(r => r.name);

    const loserNames = losers.map(r => r.name);
    const loserEligible = loserNames.filter(nm => !immune.includes(nm));
    const down = Math.max(2, bottomNamed);
    const bottomBlock = loserEligible.slice(-down);
    const bottom = bottomBlock.slice(-2);
    const atRisk = bottomBlock.slice(0, -2);
    const lowCount = Math.max(0, Math.min(lowWanted, loserEligible.length - down));
    const low = down < loserEligible.length
      ? loserEligible.slice(Math.max(0, loserEligible.length - down - lowCount),
        loserEligible.length - down)
      : [];
    const spoken = new Set([...bottomBlock, ...low]);
    const safe = [...winSafe, ...loserNames.filter(nm => !spoken.has(nm))];

    return { win, high, safe, low, atRisk, bottom, teamJudged: true };
  }

  const n = castSize || finalRanking.length;
  // How many are called up. It drops to ONE at four or fewer, and that is not
  // cosmetic: with three queens left, calling two of them forward leaves a
  // single queen to be the bottom, no lip sync is possible and the season
  // cannot reach a final two. One win and two lip syncing is also what the
  // format actually does that late.
  /* Drawn when the caller gave a stream, the mean otherwise -- and clamped so
     the stage always fits: at least one queen at the top, and never so many
     that the bottom has nobody left to be in it. */
  const down0 = Math.max(2, bottomNamed);
  /* ── HOW MANY ARE KEPT BACK TONIGHT ──
     The drawn total, less the queens the FORMAT puts in danger, is what is
     left to share between the top and the LOW.
     Floor of two at the top so there is a win and somebody beside her; and
     the real show left at least one queen to dismiss in every room of nine or
     more, so this does too — a night that keeps everybody back is not a
     critique, it is a group photo. */
  const spokenFor = (() => {
    const drawn = drawFrom(SPOKEN_TABLE);
    if (drawn === null) return upFor(n) + 1 + down0;   // the mean night
    const roof = n >= 9 ? n - 1 : n;
    return Math.max(down0 + 2, Math.min(drawn, roof));
  })();
  const lowWanted = Math.max(0, Math.min(drawFrom(LOW_TABLE) ?? 1,
    spokenFor - down0 - 1));
  const up = Math.max(1, spokenFor - down0 - lowWanted);
  /* TWO IN THE BOTTOM BLOCK, NOT THREE. The show calls a top and a bottom
     forward and sends everybody else off before a word is said, and the block
     it calls is the pair who lip sync. This returned three, which put a third
     queen on stage in danger every week and made BTM — named in the bottom
     and then saved — the ordinary case rather than the rare one it is.
     `atRisk` still exists and still works, because a bottom-three night is a
     real format the chart records; it is just not what an ordinary week is,
     so it is asked for with `bottomNamed` rather than arriving by default. */
  const down = Math.max(2, bottomNamed);

  const order = [...finalRanking].sort((a, b) => a.finalRank - b.finalRank).map(r => r.name);
  const top = order.slice(0, up);
  const rest = order.slice(up);

  // Immunity keeps her out of the bottom block and pulls the next queen in.
  // It cannot cost her a win she already had: the top is taken first.
  const eligible = rest.filter(nm => !immune.includes(nm));

  /* ── THE ANNOUNCED BOTTOM IS NOT THE LIP SYNC ─────────────────────
     The community's own chart has both and they are different facts —
     checked against the season 16 source, where {{BTM|tomato|2}} appears ten
     times and a plain {{BTM}} once:

       BTM2   the bottom TWO: she lip synced, and survived it
       BTM    named in the bottom, and saved before the lip sync
       LOW    safe, but the panel had a note

     This function used to return three groups, and the middle one was called
     `low` while meaning "in the announced bottom and not lip syncing" — which
     is BTM's meaning under LOW's name, and left BTM with no way to happen at
     all. So the block splits properly now: the panel names `down` queens as
     the bottom, the last two of them lip sync, and anybody else it named is
     saved on the stage. LOW becomes what it actually is — the queens just
     ABOVE that block, critiqued and safe. */
  const bottomBlock = eligible.slice(-down);
  const bottom = bottomBlock.slice(-2);          // lip sync → BTM2
  const atRisk = bottomBlock.slice(0, -2);       // named, then saved → BTM

  // How many are critiqued without being in danger. It follows `up`, because
  // a night that calls three queens forward is a night with room for notes.
  /* AND ONE LOW. Six queens are critiqued on an ordinary night — three at
     the top, three at the bottom — which is one win, two high, one low and
     the two who lip sync. Two lows made it seven and diluted a stage whose
     whole tension is that being on it means something. */
  const lowCount = Math.max(0, Math.min(lowWanted, eligible.length - down));
  const low = down < eligible.length
    ? eligible.slice(Math.max(0, eligible.length - down - lowCount), eligible.length - down)
    : [];

  const spoken = new Set([...bottomBlock, ...low]);
  const safe = rest.filter(nm => !spoken.has(nm));

  return { win: top.slice(0, 1), high: top.slice(1), safe, low, atRisk, bottom };
}

/**
 * What the panel carries into next week.
 *
 * Decays first, then records tonight, so an old verdict fades rather than
 * following a queen for the whole season. Twelve quiet weeks take a −1 to
 * effectively nothing.
 */
export function judgeMemoryAfter(memory, panel, call) {
  const out = {};
  for (const j of panel) {
    const prev = (memory && memory[j.id]) || {};
    const m = {};
    for (const [k, v] of Object.entries(prev)) m[k] = v * 0.7;
    for (const nm of call.bottom || []) m[nm] = (m[nm] || 0) - 0.4;
    // Named in the bottom and saved still costs her, at half the weight: the
    // panel said it out loud, it just did not end in a lip sync.
    for (const nm of call.atRisk || []) m[nm] = (m[nm] || 0) - 0.2;
    for (const nm of call.win || []) m[nm] = (m[nm] || 0) + 0.3;
    out[j.id] = m;
  }
  return out;
}
