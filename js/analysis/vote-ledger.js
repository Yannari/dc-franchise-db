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
