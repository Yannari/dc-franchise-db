// ══════════════════════════════════════════════════════════════════════
// dr/rate.js — Rate-a-Queen
// ══════════════════════════════════════════════════════════════════════
//
// The twist where the QUEENS decide the top and the bottom and the panel sits
// it out. Season 16 ran it, season 17 ran a revised version, and it is part of
// a longer drift in the franchise toward taking the call away from the judges
// and handing it to the room.
//
// ── THE COUNTING IS THE SHOW'S, NOT INVENTED HERE ─────────────────────
//
// Each queen ranks the OTHERS, best to worst, and the ballots are added with
// a Borda count: with N queens on a ballot the top of it scores N, the next
// N-1, down to 1 for the bottom. Highest total is the top of the week.
//
// Nobody ranks herself. That is the rule on the show and it is also what
// makes the twist work — a queen cannot vote herself safe, she can only push
// somebody else down, which is where all the mess comes from.
//
// ── WHY THE BALLOTS ARE NOT HONEST ────────────────────────────────────
//
// A ballot is what she SAYS, and three things pull it away from what she saw:
//
//   · she has to have seen it — a queen with low intuition genuinely
//     misreads the room, and that is noise, not strategy;
//   · she has friends — a bond tilts a ballot a place or two without anyone
//     deciding to cheat;
//   · and some of them are playing. A strategic queen with little loyalty
//     ranks a THREAT below where she knows that queen belongs, because the
//     twist hands her a weapon and the show is full of people who use it.
//
// The third is gated on archetype the same way scheming is everywhere else in
// this engine: villains, masterminds and schemers always; nice archetypes
// never; everybody else in proportion to strategic and against loyalty. A
// room of heroes produces an almost honest board, and it should.
//
// ── NOT THE SAME THING AS rateAQueen IN js/dr/critiques.js ────────────
//
// That one already existed and is a different beat under a confusingly
// similar name: a mutual scoring session that runs AFTER the call has been
// made, fires "rated highest" and "rated lowest" events and moves popularity.
// It changes how the room feels about somebody; it does not change who wins.
//
// This one replaces the panel's board and decides the week. Hence rateBoard
// rather than a second rateAQueen — the two were imported into the same file
// and the later import silently shadowed the earlier one.

/** Villain-ish always, nice never, the rest proportional. */
const NEVER = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const ALWAYS = new Set(['villain', 'mastermind', 'schemer']);

/** How hard this queen plays her ballot, 0 to 1. */
export function ballotSelfishness(player) {
  const arch = player?.archetype || '';
  if (NEVER.has(arch)) return 0;
  const s = Number(player?.stats?.strategic);
  const l = Number(player?.stats?.loyalty);
  const strategic = Number.isFinite(s) ? s : 5;
  const loyalty = Number.isFinite(l) ? l : 5;
  if (ALWAYS.has(arch)) return Math.max(0.45, (strategic / 10) * ((10 - loyalty) / 10) + 0.25);
  return (strategic / 10) * ((10 - loyalty) / 10);
}

/**
 * One queen's ballot: the others, best to worst, as she calls it.
 *
 * `truth` is the honest order of the night — the performance scores — and
 * everything here is a distortion of it rather than a separate opinion, which
 * is the honest model: she watched the same show everybody else did.
 */
export function ballotFor(voter, others, { truth, players = {}, bond = () => 0, rng = Math.random }) {
  const me = players[voter] || null;
  const eyes = Number(me?.stats?.intuition);
  const intuition = Number.isFinite(eyes) ? eyes : 5;
  // A sharp queen sees the night nearly as it was; a blunt one guesses.
  const blur = (10 - intuition) / 5;
  const play = ballotSelfishness(me);

  /* ── THE THREAT IS A TARGET, NOT A GRADIENT ──
     The first version subtracted play * (truth - 5) from every queen, which
     reads like strategy and is arithmetically useless: mark = truth * k + c
     is MONOTONE in truth, so it compressed the board and could not reorder a
     single pair. Measured, and this is what gave it away — with an all
     villain, all mastermind, all schemer cast the room still agreed with the
     best performance of the night 11 times out of 12. A twist that changes
     nothing.
     A queen does not mark everybody down a little. She marks down the one or
     two she most has to beat, and leaves the rest alone — so the penalty is
     concentrated on the top of the night, which is what actually buries a
     frontrunner when enough ballots agree about who she is. */
  const rivals = [...others].sort((x, y) => (truth[y] || 0) - (truth[x] || 0));
  const target = new Map();
  if (rivals[0]) target.set(rivals[0], 2.6);
  if (rivals[1]) target.set(rivals[1], 1.3);

  const scored = others.map(n => {
    const seen = (truth[n] || 0) + (rng() - 0.5) * blur;
    const friend = bond(voter, n) / 10;
    const threat = play * (target.get(n) || 0);
    return { name: n, mark: seen + friend * 0.9 - threat };
  });

  scored.sort((a, b) => b.mark - a.mark || a.name.localeCompare(b.name));
  return scored.map(x => x.name);
}

/**
 * The board, as the room voted it.
 *
 * Returns the SAME SHAPE `panelRanking` returns, so it drops into `hostBend`
 * and `callWeek` without either of them knowing the panel sat this one out.
 * `ranks` carries every ballot position she was given, so the spread — and
 * therefore a split — still means what it means everywhere else: the queens
 * disagreeing about her rather than the judges.
 */
export function rateBoard({ living = [], truth = {}, players = {}, bond = () => 0, rng = Math.random }) {
  const field = [...living];
  if (field.length < 3) return null;

  const ballots = {};
  const points = Object.fromEntries(field.map(n => [n, 0]));
  const placings = Object.fromEntries(field.map(n => [n, []]));

  for (const voter of field) {
    const others = field.filter(n => n !== voter);
    const ballot = ballotFor(voter, others, { truth, players, bond, rng });
    ballots[voter] = ballot;
    // Borda: the top of a ballot of N scores N, the bottom scores 1.
    ballot.forEach((n, i) => {
      points[n] += ballot.length - i;
      placings[n].push(i + 1);
    });
  }

  const rows = field.map(name => ({
    name,
    points: points[name],
    ranks: placings[name],
    meanRank: placings[name].length
      ? placings[name].reduce((a, b) => a + b, 0) / placings[name].length : 0,
    spread: placings[name].length
      ? Math.max(...placings[name]) - Math.min(...placings[name]) : 0,
  }));

  // Highest Borda total first. The tiebreak is the mean placing, then the
  // name, so a rerun of the same season gives the same board.
  rows.sort((a, b) => b.points - a.points || a.meanRank - b.meanRank
    || a.name.localeCompare(b.name));
  rows.forEach((r, i) => { r.panelRank = i + 1; });

  return { ranking: rows, ballots };
}
