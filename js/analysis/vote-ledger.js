// ══════════════════════════════════════════════════════════════════════
// analysis/vote-ledger.js — what the week's result actually cost
// ══════════════════════════════════════════════════════════════════════
//
// A LEAF. It reads one episode record and returns numbers; it knows nothing
// about the app, so the Control Room, the simulator and the AI payload can all
// use the same answer instead of three different ones.
//
// The analysis this exists for was written by hand and could not be produced by
// the machine, and the reason is worth stating exactly: the analyst was handed
// PROSE. A transcript says a player used a power and their target left, so the
// only causal story available is that the power did it. What it does not say is
// that ten of the thirteen voters were already going that way — and that
// sentence is the whole analysis:
//
//   "Ireland benefited from a consensus that existed beyond her."
//
// That fact is not an inference. It is arithmetic over `votingLog`, which has
// carried `stated` and `changed` per ballot the entire time and has never been
// shown to anything that draws conclusions.
//
// So this separates two questions a vote tally cannot tell apart:
//
//   DID YOU GET WHAT YOU WANTED — the outcome. Cheap to see, and the only thing
//   the screens have ever reported.
//   DID YOU HAVE TO DO ANYTHING — the influence. A majority that was already
//   there is not a move, however good the result looks.

const MOVED = new Set(['bloc', 'bandwagon', 'campaign']);

/** Who left, read off the ballots rather than trusted from a field. */
function evicteeOf(log, record) {
  if (record?.evicted) return record.evicted;
  const tally = {};
  for (const b of log) if (b?.voted) tally[b.voted] = (tally[b.voted] || 0) + 1;
  return Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

/**
 * What moved a ballot, when something did.
 *
 * `blocMove` names the alliance that whipped it and `bandwagon` marks somebody
 * who went with the room late. A vote with neither, that still changed, was
 * moved by the campaign itself.
 */
function moverOf(ballot) {
  if (ballot.blocMove) return { how: 'bloc', by: ballot.blocMove };
  if (ballot.bandwagon) return { how: 'bandwagon', by: null };
  return { how: 'campaign', by: null };
}

/**
 * The week's vote, as arithmetic rather than as a story.
 *
 * @param record an episode record (Big Brother week or Total Drama episode)
 * @returns {object|null} null when the night had no vote to read
 */
export function voteLedger(record) {
  const log = Array.isArray(record?.votingLog) ? record.votingLog.filter(b => b?.voter && b?.voted) : [];
  if (!log.length) return null;

  const evictee = evicteeOf(log, record);
  if (!evictee) return null;

  const voters = log.length;
  // The number that actually decides it. Everything past it is surplus, and
  // surplus is the difference between a whipped vote and a landslide.
  const majority = Math.floor(voters / 2) + 1;

  const against = log.filter(b => b.voted === evictee);
  // NEVER MOVED. Not "voted this way" — voted this way without anybody having
  // to do anything about it, which is the only group that measures consensus.
  const unmoved = against.filter(b => !b.changed);
  const moved = against.filter(b => b.changed);
  // Said one thing and did another. A different fault from being moved: these
  // are the ones the room could not have counted.
  const flipped = log.filter(b => b.stated && b.stated !== b.voted);

  // How many of the moved votes the result actually needed. If the unmoved
  // already clear the line, the answer is none, and every move made that week
  // was spent on a margin.
  const decisive = Math.max(0, majority - unmoved.length);

  // Which groups arrived at this name on their own. `voteOperation.plans` is
  // each bloc's own plan, so two of them naming the same person is two
  // independent decisions rather than one instruction.
  const blocs = (record?.voteOperation?.plans || [])
    .filter(p => p && (p.target === evictee || p.evict === evictee))
    .map(p => ({ alliance: p.alliance || p.name || null, members: [...(p.members || [])] }));

  const hoh = record?.hoh || null;
  const hohTarget = record?.plan?.target || record?.plan?.backdoorTarget || null;

  return {
    evictee,
    hoh,
    voters,
    majority,
    votesAgainst: against.length,
    margin: `${against.length}-${voters - against.length}`,
    surplus: against.length - majority,

    // ── the two questions the tally cannot separate ──
    outcome: {
      // Did the Head of Household's own target leave?
      hohGotTarget: !!hohTarget && hohTarget === evictee,
      hohTarget,
      // Did the block survive intact, or did the week have to be rebuilt?
      renomWasNeeded: (record?.initialNominees || []).join('|') !== (record?.finalNominees || []).join('|'),
    },
    influence: {
      // The headline. A majority that was already there did not need a week.
      alreadyThere: unmoved.length,
      neededMoving: decisive,
      // Nobody had to be moved for this to happen.
      rodeConsensus: unmoved.length >= majority,
      movedVotes: moved.map(b => ({ voter: b.voter, ...moverOf(b) })),
      // Independent agreement, which is the strongest form of "this was not you".
      blocsThatAgreedIndependently: blocs,
    },
    // Said one thing, wrote another. The house's information problem, not the
    // Head of Household's.
    brokenWord: flipped.map(b => ({ voter: b.voter, said: b.stated, wrote: b.voted })),
  };
}

/**
 * One sentence a screen can print without an AI in the loop.
 *
 * Deliberately refuses to grade. "Ireland got what she wanted, but I don't think
 * she had a good HOH" and "her target went home ten to three, how bad could it
 * have been" are both true readings of the same week, and a line that picks one
 * is worse than a line that states what happened and lets the disagreement
 * stand.
 */
export function ledgerLine(ledger) {
  if (!ledger) return '';
  const { evictee, margin, influence: inf } = ledger;
  if (inf.rodeConsensus) {
    const blocs = inf.blocsThatAgreedIndependently;
    return `${evictee} left ${margin}, and ${inf.alreadyThere} of those votes never had to be moved`
      + `${blocs.length > 1 ? ` — ${blocs.length} groups arrived at the name separately` : ''}.`
      + ` The majority was ${ledger.majority}, so the week was decided before anybody worked on it.`;
  }
  if (!inf.movedVotes.length) {
    return `${evictee} left ${margin}, on a majority of ${ledger.majority}.`;
  }
  return `${evictee} left ${margin}. ${inf.alreadyThere} were already there and `
    + `${inf.movedVotes.length} moved, of which ${inf.neededMoving} were actually needed.`;
}

// ══════════════════════════════════════════════════════════════════════
// THE OTHER HALF: what the week did TO you
// ══════════════════════════════════════════════════════════════════════
//
// The vote ledger answers whether a result needed working for. It does not
// answer the question that made the hand-written analysis good:
//
//   "She entered the week as an invisible player with a secret power and left
//    as someone everyone now knows can make things happen."
//
// That is a position change, and it is in the record. Every episode carries
// `openingState` and `closingState` — bonds, perceived bonds, and `intentions`,
// which is who is hunting whom. So the house's opinion of somebody at the start
// of a week and at the end of it are both on disk, and nothing has ever
// subtracted one from the other.

const bondKey = (a, b) => [a, b].sort().join('||');

/** Everybody naming this person as a target, in one snapshot. */
function huntersOf(state, name) {
  const out = [];
  for (const [who, plan] of Object.entries(state?.intentions || {})) {
    if (who === name) continue;
    if ((plan?.targets || []).includes(name)) out.push(who);
  }
  return out;
}

/** How the room feels about them, summed over everybody else. */
function standingOf(state, name, house) {
  const bonds = state?.bonds || {};
  let total = 0;
  let counted = 0;
  for (const other of house) {
    if (other === name) continue;
    const v = Number(bonds[bondKey(name, other)]);
    if (Number.isFinite(v)) { total += v; counted++; }
  }
  return { total, counted };
}

/**
 * What a week cost the person who ran it.
 *
 * @param record an episode record with bookend snapshots
 * @param subject whose week to read; defaults to the Head of Household
 * @returns {object|null} null when the record has no bookends to compare
 */
export function positionLedger(record, subject = null) {
  const before = record?.openingState;
  const after = record?.closingState;
  const name = subject || record?.hoh || null;
  if (!before || !after || !name) return null;

  const house = [...new Set([
    ...Object.keys(before.intentions || {}),
    ...Object.keys(after.intentions || {}),
  ])];
  if (!house.length) return null;

  const huntedBefore = huntersOf(before, name);
  const huntedAfter = huntersOf(after, name);
  const newHunters = huntedAfter.filter(h => !huntedBefore.includes(h));
  const droppedHunters = huntedBefore.filter(h => !huntedAfter.includes(h));

  const standBefore = standingOf(before, name, house);
  const standAfter = standingOf(after, name, house);
  // Averaged, so a week that also shrank the house does not read as a collapse
  // in feeling. Fewer people is not the same as being liked less.
  const avgBefore = standBefore.counted ? standBefore.total / standBefore.counted : 0;
  const avgAfter = standAfter.counted ? standAfter.total / standAfter.counted : 0;

  return {
    subject: name,
    hunters: {
      before: huntedBefore.length,
      after: huntedAfter.length,
      gained: newHunters,
      lost: droppedHunters,
    },
    standing: {
      before: Math.round(avgBefore * 100) / 100,
      after: Math.round(avgAfter * 100) / 100,
      delta: Math.round((avgAfter - avgBefore) * 100) / 100,
    },
    // The summary the hand-written read reached for: more people pointing at
    // you than were pointing at you a week ago.
    moreVisible: newHunters.length > droppedHunters.length,
  };
}

/**
 * The three axes, as components rather than as a grade.
 *
 * OUTCOME, EXECUTION and POSITION were the axes a person used to describe a
 * week the machine called a masterclass — and the useful part was that they
 * disagreed with each other. So this returns what each one is made of and
 * refuses to collapse them into a verdict, because the disagreement is the
 * finding.
 */
export function weekLedger(record, subject = null) {
  const vote = voteLedger(record);
  const position = positionLedger(record, subject);
  if (!vote && !position) return null;

  const name = subject || record?.hoh || null;
  const allies = (record?.openingState?.alliances || [])
    .filter(a => (a.members || []).includes(name))
    .flatMap(a => a.members).filter(m => m !== name);
  const nominated = new Set([...(record?.initialNominees || []), ...(record?.finalNominees || [])]);

  return {
    subject: name,
    vote,
    position,
    outcome: vote ? {
      targetLeft: vote.outcome.hohGotTarget,
      margin: vote.margin,
      // Allies untouched is half of what "it went well" means and is never
      // reported anywhere.
      alliesNominated: allies.filter(a => nominated.has(a)),
    } : null,
    execution: vote ? {
      // Spent more than the result required.
      movesSpent: vote.influence.movedVotes.length,
      movesNeeded: vote.influence.neededMoving,
      // The room could not count on what it was told.
      brokenWord: vote.brokenWord.length,
      // A block that had to be rebuilt is a plan that did not survive contact.
      blockRebuilt: vote.outcome.renomWasNeeded,
    } : null,
  };
}

// ══════════════════════════════════════════════════════════════════════
// THE RELATIONSHIPS, WHICH ARE THE PART PEOPLE ACTUALLY WATCH
// ══════════════════════════════════════════════════════════════════════
//
// "The relationship between Stella and Tobias was really interesting to watch."
// Tobias made a final three promise in week one and voted her out in week two.
// Nothing on any screen said so — the vote card showed a name, the analysis
// called it a coalition decision, and the one fact that made it worth watching
// was never printed.
//
// It is all on the record. `bonds` gives what two people actually are to each
// other at both ends of the week; `perceivedBonds` is DIRECTIONAL, so it also
// holds the case where one of them thinks the friendship is worth more than the
// other does. Cross that with who voted for whom and the week's relationships
// stop being a list of names and become the things that happened between them.

const dirKey = (a, b) => `${a}→${b}`;

/** Every pair either snapshot has an opinion about. */
function pairsIn(...states) {
  const out = new Set();
  for (const st of states) {
    for (const k of Object.keys(st?.bonds || {})) out.add(k);
  }
  return [...out].map(k => k.split('||')).filter(p => p.length === 2);
}

/**
 * What happened between people this week.
 *
 * @param record an episode record with bookend snapshots and a vote
 * @param opts.minMove how far a bond has to travel to be worth reporting
 * @returns {object|null}
 */
export function relationshipLedger(record, { minMove = 1.5, limit = 4 } = {}) {
  const before = record?.openingState;
  const after = record?.closingState;
  if (!before || !after) return null;

  const bondBefore = before.bonds || {};
  const bondAfter = after.bonds || {};
  const alliancesBefore = before.alliances || [];
  const log = Array.isArray(record?.votingLog) ? record.votingLog : [];
  const evictee = record?.evicted || null;

  const sharedAlliance = (a, b) => (alliancesBefore
    .find(al => (al.members || []).includes(a) && (al.members || []).includes(b))?.name) || null;

  // ── the one the question was about ──
  //
  // Somebody wrote down the name of a person they were close to, or sworn to.
  // The bond is read from BEFORE the vote: what they were to each other when
  // the choice was made, not what the fallout left behind.
  const votedAgainstOwn = [];
  for (const b of log) {
    if (!b?.voter || !b?.voted) continue;
    const bond = Number(bondBefore[[b.voter, b.voted].sort().join('||')]) || 0;
    const alliance = sharedAlliance(b.voter, b.voted);
    if (bond < 3 && !alliance) continue;
    votedAgainstOwn.push({
      voter: b.voter, against: b.voted, bond: Math.round(bond * 10) / 10,
      alliance, left: b.voted === evictee,
    });
  }
  votedAgainstOwn.sort((x, y) => (y.bond + (y.alliance ? 3 : 0)) - (x.bond + (x.alliance ? 3 : 0)));

  // ── what moved, and how far ──
  const moves = [];
  for (const [a, b] of pairsIn(before, after)) {
    const k = [a, b].sort().join('||');
    const from = Number(bondBefore[k]) || 0;
    const to = Number(bondAfter[k]) || 0;
    const delta = to - from;
    if (Math.abs(delta) < minMove) continue;
    moves.push({ a, b, from: Math.round(from * 10) / 10, to: Math.round(to * 10) / 10,
      delta: Math.round(delta * 10) / 10, alliance: sharedAlliance(a, b) });
  }
  moves.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));

  // ── one of them is holding it tighter than the other ──
  //
  // `perceivedBonds` is directional, so the case where A believes the
  // friendship is worth more than B does is a fact rather than a reading. It is
  // also, reliably, the next thing to break.
  const lopsided = [];
  const pb = after.perceivedBonds || {};
  for (const [a, b] of pairsIn(after)) {
    const ab = Number(pb[dirKey(a, b)]?.perceived);
    const ba = Number(pb[dirKey(b, a)]?.perceived);
    if (!Number.isFinite(ab) || !Number.isFinite(ba)) continue;
    const gap = ab - ba;
    if (Math.abs(gap) < 2) continue;
    lopsided.push(gap > 0
      ? { believer: a, other: b, gap: Math.round(gap * 10) / 10 }
      : { believer: b, other: a, gap: Math.round(-gap * 10) / 10 });
  }
  lopsided.sort((x, y) => y.gap - x.gap);

  return {
    brokenPromises: votedAgainstOwn.slice(0, limit),
    closer: moves.filter(m => m.delta > 0).slice(0, limit),
    colder: moves.filter(m => m.delta < 0).slice(0, limit),
    oneSided: lopsided.slice(0, limit),
  };
}

/** Sentences a screen can print, in the register somebody would actually say. */
export function relationshipLines(rel) {
  if (!rel) return [];
  const out = [];
  for (const p of rel.brokenPromises) {
    out.push(p.alliance
      ? `${p.voter} wrote down ${p.against}'s name — they were in ${p.alliance} together`
        + `${p.left ? ', and it worked' : ', and it did not'}.`
      : `${p.voter} voted against ${p.against}, who they were a ${p.bond} with going in.`);
  }
  for (const m of rel.colder) {
    out.push(`${m.a} and ${m.b} came apart this week — ${m.from} to ${m.to}`
      + `${m.alliance ? `, inside ${m.alliance}` : ''}.`);
  }
  for (const m of rel.closer) {
    out.push(`${m.a} and ${m.b} got closer, ${m.from} to ${m.to}.`);
  }
  for (const l of rel.oneSided) {
    out.push(`${l.believer} thinks that friendship with ${l.other} is worth `
      + `${l.gap} more than ${l.other} does.`);
  }
  return out;
}
