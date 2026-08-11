// What each houseguest's season actually looked like, in numbers.
//
// The narrative writer used to be handed episode prose and one line of totals —
// "3 HOH wins, 2 vetoes, 4 votes against" — and asked for a documentary
// voiceover. So it wrote one. You cannot get an analyst's verdict out of a
// transcript, because the verdict is not in the transcript: it is in the
// pattern of who held power in which week, whose safety was won and whose was
// given, and who was in the room when the house decided.
//
// This computes that pattern locally so the model is asked to INTERPRET a
// record rather than to invent one. Everything here is derived from the week
// objects the engine already writes; nothing is guessed and nothing is scored.
// Judgement is the reader's job — this only establishes the facts a judgement
// has to survive.
//
// Read by the season export's narrative fill and by the Control Room's season
// analysis, so the two cannot drift into telling different stories about the
// same season.

/** Everybody named anywhere in the season, in the order they first appear. */
function castOf(weeks) {
  const seen = [];
  const add = n => { if (n && !seen.includes(n)) seen.push(n); };
  for (const w of weeks) {
    (w.houseAtStart || []).forEach(add);
    add(w.hoh); add(w.vetoWinner); add(w.evicted);
    (w.initialNominees || []).forEach(add);
    (w.finalNominees || []).forEach(add);
    (w.ballots || w.votingLog || []).forEach(b => add(b.voter));
  }
  return seen;
}

const ballotsOf = week => (week.ballots || week.votingLog || [])
  .map(b => ({ voter: b.voter, voted: b.voted ?? b.evict, changed: !!b.changed,
    stated: b.stated ?? b.promised ?? null }));

/**
 * Who the veto actually took off, if anyone.
 *
 * Not the difference between the two nominee lists — a Coup replaces the whole
 * block and a detonated Diamond takes somebody down on its own authority, and
 * counting those as veto saves credits the wrong person with the season's
 * biggest moves. The ceremony records what it did; ask it, and only fall back
 * to the diff for a week too old to have written it down.
 */
export function vetoSavedIn(week) {
  if (week.vetoUsed !== undefined) {
    if (!week.vetoUsed) return [];
    return week.vetoSavedAll || (week.vetoSaved ? [week.vetoSaved] : []);
  }
  const notTheVeto = new Set([...(week.coup?.removed || []),
    ...(week.diamondDetonation?.saved ? [week.diamondDetonation.saved] : [])]);
  return (week.finalNominees || []).length
    ? (week.initialNominees || []).filter(n =>
      !(week.finalNominees || []).includes(n) && !notTheVeto.has(n))
    : [];
}

/**
 * A houseguest's season, measured.
 *
 * The fields exist to answer questions a verdict needs and prose cannot:
 *
 *  · comp.needed vs comp.banked — the aggressive/selective split. A veto won
 *    with your own name on the block is a different act from one won from
 *    safety, and totals hide the difference completely.
 *  · block.asTarget / asPawn / asReplacement — three different games that all
 *    read as "was nominated" in a summary.
 *  · survived.byVeto vs survived.byVote — being pulled down is somebody else's
 *    decision; surviving the vote is your own social result.
 *  · voteAlignment — the share of evictions they voted with the house on. The
 *    best single proxy for whether somebody was actually in the room when it
 *    was decided, and the number that separates a floater from a hub.
 *  · blindsided — votes they were on the wrong side of, which is the same
 *    question asked from the other end.
 */
export function playerRecord(name, weeks) {
  const rec = {
    name,
    weeksPlayed: 0,
    comp: { hoh: 0, veto: 0, needed: 0, banked: 0, weeksInPower: [] },
    // ── THE BLOCK BUSTER IS ITS OWN RECORD ────────────────────────────
    //
    // It was folded into nothing at all here: a houseguest who took the arena
    // three weeks running had a résumé that said no competition wins and three
    // trips to the block, which reads as somebody who kept getting lucky. It
    // is the opposite — they won their way off, in front of the house, every
    // time. `played` is how often they were IN one, so the wins mean
    // something; `streak` is the consecutive run, because "again and again" is
    // the whole story of that kind of season and a total cannot say it.
    blockBuster: { won: 0, played: 0, streak: 0, weeks: [] },
    block: { total: 0, asTarget: 0, asPawn: 0, asReplacement: 0, weeks: [] },
    survived: { byVeto: 0, byVote: 0, bySafety: 0, closestMargin: null },
    votes: { cast: 0, withHouse: 0, against: 0, changedMind: 0, brokePromise: 0 },
    blindsided: 0,
    votesReceived: 0,
    evictedWeek: null,
    evictedBy: null,
  };

  for (const week of weeks) {
    const roster = week.houseAtStart || [];
    if (roster.length && !roster.includes(name)) continue;
    rec.weeksPlayed++;

    const initial = week.initialNominees || [];
    const final = week.finalNominees || [];
    const saved = vetoSavedIn(week);
    const onBlock = initial.includes(name) || final.includes(name);
    const inDanger = onBlock || week.plan?.target === name;

    if (week.hoh === name) { rec.comp.hoh++; rec.comp.weeksInPower.push(week.num); }
    if (week.vetoWinner === name) {
      rec.comp.veto++;
      // Won it when it mattered, or won it from safety.
      if (inDanger) rec.comp.needed++; else rec.comp.banked++;
    }
    if (week.hoh === name && !inDanger) rec.comp.banked++;
    else if (week.hoh === name) rec.comp.needed++;

    // In the arena, and out of it. Read before the block bookkeeping, because
    // the Block Buster empties a chair before eviction night and the final
    // nominees no longer contain whoever won their way out.
    const inArena = (week.blockBeforeSafety || []).includes(name);
    if (inArena) {
      rec.blockBuster.played++;
      if (week.safetyWinner === name) {
        rec.blockBuster.won++;
        rec.blockBuster.weeks.push(week.num);
        rec.survived.bySafety++;
      }
    }

    if (onBlock || inArena) {
      rec.block.total++;
      rec.block.weeks.push(week.num);
      if (week.plan?.target === name) rec.block.asTarget++;
      else if (week.plan?.pawn === name) rec.block.asPawn++;
      else if (!initial.includes(name) && final.includes(name)) rec.block.asReplacement++;
      else rec.block.asTarget++;    // up without being the named pawn
      if (saved.includes(name)) rec.survived.byVeto++;
      else if (final.includes(name) && week.evicted !== name) {
        rec.survived.byVote++;
        const against = (week.votes || {})[name] || 0;
        const total = ballotsOf(week).length;
        const margin = total - against * 2;
        if (rec.survived.closestMargin === null || margin < rec.survived.closestMargin) {
          rec.survived.closestMargin = margin;
        }
      }
    }

    const ballots = ballotsOf(week);
    const mine = ballots.find(b => b.voter === name);
    if (mine) {
      rec.votes.cast++;
      if (mine.voted === week.evicted) rec.votes.withHouse++;
      else {
        rec.votes.against++;
        // On the losing side of a vote they did not see coming: they were not
        // in the room. A vote they changed themselves does not count — they
        // were in the room, they simply lost.
        if (!mine.changed) rec.blindsided++;
      }
      if (mine.changed) rec.votes.changedMind++;
      if (mine.stated && mine.stated !== mine.voted) rec.votes.brokePromise++;
    }

    rec.votesReceived += (week.votes || {})[name] || 0;

    if (week.evicted === name) {
      rec.evictedWeek = week.num;
      rec.evictedBy = ballots.filter(b => b.voted === name).map(b => b.voter);
    }
  }

  // The longest run of consecutive weeks they saved themselves. Somebody who
  // did it in weeks 3, 4 and 5 is a different houseguest from somebody who did
  // it in weeks 2, 6 and 9, and a total of three cannot tell them apart.
  let run = 0;
  for (let i = 0; i < rec.blockBuster.weeks.length; i++) {
    run = (i && rec.blockBuster.weeks[i] === rec.blockBuster.weeks[i - 1] + 1) ? run + 1 : 1;
    if (run > rec.blockBuster.streak) rec.blockBuster.streak = run;
  }

  rec.voteAlignment = rec.votes.cast ? rec.votes.withHouse / rec.votes.cast : null;
  return rec;
}

/**
 * How much of the house each houseguest was inside.
 *
 * Alliance membership alone says very little — everybody is in something. The
 * useful shape is how many DISTINCT groups claimed somebody, because a person
 * in three groups is either the hub of the season or about to be caught, and
 * the two look identical on a membership list.
 */
export function allianceReach(name, alliances = []) {
  const mine = (alliances || []).filter(a => (a.members || []).includes(name));
  const partners = new Set();
  for (const a of mine) for (const m of a.members || []) if (m !== name) partners.add(m);
  return { groups: mine.length, names: mine.map(a => a.name), reach: partners.size };
}

/**
 * The season as a record, ready to be handed to a writer or a reader.
 *
 * `weeks` are the engine's week objects. `opts.finalists` is the finishing
 * order best-first when the season is over, `opts.alliances` the named groups,
 * and `opts.juryVotes` a { [name]: count } for finale night.
 */
export function seasonRecord(weeks = [], { finalists = [], alliances = [], juryVotes = {} } = {}) {
  const list = (weeks || []).filter(Boolean);
  const players = castOf(list).map(name => {
    const rec = playerRecord(name, list);
    const place = finalists.indexOf(name);
    return {
      ...rec,
      placement: place === -1 ? null : place + 1,
      alliance: allianceReach(name, alliances),
      juryVotes: juryVotes[name] || 0,
    };
  });

  // The house's own shape, which individual records cannot show: how often the
  // week went the way the person in power wanted it to.
  let hohHeldPlan = 0;
  let hohLostPlan = 0;
  for (const w of list) {
    if (!w.evicted || !w.plan?.target) continue;
    if (w.evicted === w.plan.target) hohHeldPlan++; else hohLostPlan++;
  }

  return {
    weeks: list.length,
    players: players.sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99)),
    house: {
      hohHeldPlan,
      hohLostPlan,
      // A season where the plan usually survives is a season decided by who won
      // Thursday; one where it usually does not is decided in the bedrooms.
      decidedBy: hohHeldPlan + hohLostPlan === 0 ? 'unknown'
        : hohHeldPlan > hohLostPlan ? 'competitions' : 'the room',
    },
  };
}

/**
 * One houseguest's record as a line an LLM can read without parsing JSON.
 *
 * Deliberately dense and deliberately neutral: it states what happened and
 * makes no claim about whether it was good, because the whole point is that
 * the judgement gets made against the numbers rather than instead of them.
 */
export function recordLine(rec) {
  if (!rec) return '';
  const parts = [];
  parts.push(`${rec.placement ? `#${rec.placement}` : '--'} ${rec.name}`);
  parts.push(`${rec.weeksPlayed}w`);
  const comp = [];
  if (rec.comp.hoh) comp.push(`${rec.comp.hoh} HOH`);
  if (rec.comp.veto) comp.push(`${rec.comp.veto} veto`);
  // Counted apart from HOH and veto on purpose. Those are won from safety or
  // for safety; this one is won WITH YOUR NAME ALREADY ON THE WALL, minutes
  // before a vote that was going to remove you. Folding them together loses
  // the only competition record in this game that is also a survival record.
  if (rec.blockBuster?.won) comp.push(`${rec.blockBuster.won} Block Buster`);
  parts.push(comp.length ? comp.join(' + ') : 'no comp wins');
  if (rec.blockBuster?.won) {
    parts.push(rec.blockBuster.streak > 1
      ? `saved themselves ${rec.blockBuster.won}x in the arena, ${rec.blockBuster.streak} weeks running`
      : `saved themselves in the arena ${rec.blockBuster.won}x of ${rec.blockBuster.played}`);
  } else if (rec.blockBuster?.played) {
    parts.push(`in the arena ${rec.blockBuster.played}x and never won it`);
  }
  if (rec.comp.needed) parts.push(`${rec.comp.needed} won under threat`);
  if (rec.block.total) {
    const how = [];
    if (rec.block.asTarget) how.push(`${rec.block.asTarget} as the target`);
    if (rec.block.asPawn) how.push(`${rec.block.asPawn} as a pawn`);
    if (rec.block.asReplacement) how.push(`${rec.block.asReplacement} as the renom`);
    parts.push(`on the block ${rec.block.total}x (${how.join(', ')})`);
    if (rec.survived.byVeto) parts.push(`pulled down ${rec.survived.byVeto}x`);
    if (rec.survived.byVote) parts.push(`survived the vote ${rec.survived.byVote}x`);
  }
  if (rec.voteAlignment !== null) {
    parts.push(`voted with the house ${Math.round(rec.voteAlignment * 100)}% (${rec.votes.withHouse}/${rec.votes.cast})`);
  }
  if (rec.blindsided) parts.push(`blindsided ${rec.blindsided}x`);
  if (rec.alliance?.groups) parts.push(`${rec.alliance.groups} group(s), ${rec.alliance.reach} people`);
  if (rec.juryVotes) parts.push(`${rec.juryVotes} jury votes`);
  if (rec.evictedWeek) parts.push(`out week ${rec.evictedWeek}`);
  return parts.join(' · ');
}

/** The whole season as readable lines, best finish first. */
export function recordLines(season) {
  if (!season?.players?.length) return '';
  const head = `The house: ${season.weeks} weeks, the plan held ${season.house.hohHeldPlan} times `
    + `and broke ${season.house.hohLostPlan} — this season was decided by ${season.house.decidedBy}.`;
  return [head, '', ...season.players.map(recordLine)].join('\n');
}
