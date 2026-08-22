// Who the villain of a season actually was.
//
// ── WHY THIS IS NOT A PROMPT ────────────────────────────────────────────
//
// The award was written by a model reading one paragraph of summary per
// episode, and it showed: the pick drifted toward whoever the summaries talked
// about most, which is the winner and whoever they were sleeping with. A
// villain is not a vibe. It is a list of things somebody DID to other people,
// and the record holds every one of them.
//
// So the ranking is computed and the model only writes the citation. Same
// split the rest of this project already uses for anything that must not
// contradict the record: the numbers are the skeleton, the prose is the skin.
//
// ── WHAT COUNTS ─────────────────────────────────────────────────────────
//
// Deeds, weighted by what they cost the person they were done to. The purest
// one on record is a BALLOT THAT MOVED: the export carries `stated` (what they
// said in the room) beside `evict` (what they actually wrote down), so a lie
// told to somebody's face is a fact in the file rather than an inference.
//
// THE ACTOR SCORES, NEVER THE VICTIM. Being blindsided, being cut, being
// nominated by somebody else: all zero. A season's most wronged person is not
// its villain, and the first version of every board like this makes them one.
//
// The screenplay counts too when it is to hand: `episodes` is optional, and a
// board built without it says so rather than pretending the beats were read.

/**
 * What each deed is worth.
 *
 * ── NEITHER HALF OUTRANKS THE OTHER ────────────────────────────────────
 *
 * Two kinds of villainy and they are peers. The GAME deeds — a ballot that
 * moved, an ally cut in a live vote, a veto turned on somebody else — and the
 * BEHAVIOUR — fights, manipulation, cruelty, which is what the screenplay
 * spends its time on. Score only the first and the board becomes a strategy
 * ranking, and the winner tops it more or less automatically because winning
 * means cutting people. Score only the second and it becomes a temper
 * measurement.
 *
 * So a season's villain can be the person who ran every week and cut everyone
 * they knew, or the person who spent thirteen weeks screaming at the house,
 * and either can top the board on their own evidence.
 *
 * Holding the power the week somebody went is still the smallest of them: it
 * is a deed, but it is also just Tuesday.
 */
export const WEIGHTS = {
  brokenWord: 4,        // said one name to their face, wrote down another
  villainScene: 4,      // fights, manipulation, cruelty — the screenplay's own read
  cutAnAlly: 3,         // voted out somebody who trusted them, in a live vote
  finalCut: 3,          // chose who did not get to sit at the end
  vetoAsWeapon: 3,      // won the veto and left somebody else in the chair
  decidingVote: 3,      // broke the tie that sent somebody home
  rivalry: 2,           // an open war with somebody, capped below
  ranTheWeek: 2,        // held the power the week somebody went
};
const RIVALRY_CAP = 4;

const slugOf = n => String(n || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

/**
 * The board, best villain first.
 *
 * `doc` is a published season document. `episodes` is optional — an array of
 * transcripts, each `{ episode, acts|beats }` — and when present every beat
 * the tone classifier calls villainous scores for the player it names FIRST,
 * which is the actor-first convention the whole engine writes with.
 *
 * Returns `{ board, read, sources }`:
 *   board   — [{ name, slug, score, deeds, evidence[] }], highest first
 *   read    — the one-line summary a page can print above it
 *   sources — what was actually read, so a caller can say so
 */
export function villainBoard(doc, { episodes = null, classify = null, editTotals = null } = {}) {
  const cast = (doc?.placements || []).map(p => p.name).filter(Boolean);
  if (!cast.length) return { board: [], read: '', sources: [] };

  const score = new Map(cast.map(n => [n, {
    name: n,
    slug: (doc.placements.find(p => p.name === n) || {}).playerSlug || slugOf(n),
    score: 0,
    deeds: { brokenWord: 0, cutAnAlly: 0, ranTheWeek: 0, decidingVote: 0,
      vetoAsWeapon: 0, finalCut: 0, villainScene: 0, rivalry: 0 },
    evidence: [],
  }]));
  const add = (name, deed, line) => {
    const row = score.get(name);
    if (!row) return;
    row.deeds[deed] += 1;
    row.score += WEIGHTS[deed] || 0;
    if (line) row.evidence.push(line);
  };

  // ── WHO WAS WITH WHOM ───────────────────────────────────────────────
  //
  // An alliance is a list of members and a season carries several, so "were
  // these two aligned" is a set question rather than a pair one. Deliberately
  // NOT time-bounded: an alliance the record does not date is still the reason
  // a vote against a member reads as a betrayal.
  const allies = new Map(cast.map(n => [n, new Set()]));
  for (const a of doc.alliances || []) {
    const members = a.members || a.players || [];
    for (const x of members) for (const y of members) if (x !== y) allies.get(x)?.add(y);
  }
  const rivals = new Map(cast.map(n => [n, new Set()]));
  for (const r of doc.rivalries || []) {
    const [x, y] = r.players || [];
    if (x && y) { rivals.get(x)?.add(y); rivals.get(y)?.add(x); }
  }

  const rounds = (doc.weeks || []).length
    ? doc.weeks.map(w => ({
      label: `week ${w.week}`,
      hoh: w.hoh,
      veto: w.vetoWinner,
      opened: w.initialNominees || [],
      postVeto: w.blockBeforeSafety || w.finalNominees || [],
      out: w.evicted,
      ballots: w.ballots || [],
      votes: w.votes || {},
      tieBreak: w.tieBreak || w.tieBreakVote || null,
      finale: !!w.finale,
    }))
    : (doc.votingHistory || []).map(r => ({
      label: `episode ${r.episode}`,
      hoh: r.immunityWinner || r.winner || null,
      veto: null,
      opened: [],
      postVeto: [],
      out: r.eliminated,
      ballots: (r.votes || []).map(v => ({ voter: v.voter, evict: v.target })),
      votes: (r.votes || []).reduce((acc, v) => {
        if (v.target) acc[v.target] = (acc[v.target] || 0) + 1;
        return acc;
      }, {}),
      tieBreak: null,
      finale: false,
    }));

  for (const r of rounds) {
    if (!r.out) continue;
    /* ── VOTING WITH A UNANIMOUS HOUSE IS NOT A BETRAYAL ──────────────
       The first board had somebody second on the strength of five allies
       "cut", every one of them a 10-0 vote where the room had already
       decided and their name on the ballot changed nothing. A deed needs a
       choice: the vote has to have been live — the other nominee took at
       least one vote — or the voter has to have moved onto the target
       themselves. Anything else is arithmetic. */
    const tallies = Object.values(r.votes || {}).filter(n => Number.isFinite(n) && n > 0);
    const contested = tallies.length > 1;

    // 1. A ballot that moved. The strongest thing in the file.
    for (const b of r.ballots) {
      if (!b?.voter) continue;
      if (b.stated && b.stated !== b.evict) {
        add(b.voter, 'brokenWord',
          `Told the room ${b.stated} and wrote down ${b.evict} in ${r.label}.`);
      } else if (b.changed) {
        add(b.voter, 'brokenWord', `Moved their vote onto ${b.evict} in ${r.label}.`);
      }
      // 2. Voting out somebody they were aligned with.
      const chose = contested || b.changed || (b.stated && b.stated !== b.evict);
      if (chose && b.evict === r.out && allies.get(b.voter)?.has(r.out)) {
        add(b.voter, 'cutAnAlly', `Voted out ${r.out}, who they were aligned with, in ${r.label}.`);
      }
    }

    // 3. Running the week it happened in. The house's own power, used.
    if (r.hoh && r.hoh !== r.out) {
      if (r.finale) {
        add(r.hoh, 'finalCut', `Cut ${r.out} at the final three and chose who to sit beside.`);
      } else {
        add(r.hoh, 'ranTheWeek', `Held the power in ${r.label}; ${r.out} went home.`);
      }
    }

    // 4. The deciding vote.
    const tb = r.tieBreak;
    if (tb?.voter && tb.voter !== r.out) {
      add(tb.voter, 'decidingVote', `Broke the tie in ${r.label} and sent ${r.out} home.`);
    }

    // 5. A veto that moved the block onto somebody else. Saving yourself is
    //    survival; putting a third person in the chair is a decision about them.
    if (r.veto && !r.opened.includes(r.veto) && r.postVeto.length) {
      const fresh = r.postVeto.filter(n => !r.opened.includes(n));
      for (const n of fresh) {
        add(r.veto, 'vetoAsWeapon', `Won the veto in ${r.label} and left ${n} in the chair.`);
      }
    }
  }

  // 6. THE FIGHTS. An on-record feud is two people who could not be in a room
  //    together, and it is the most visible villainy a season produces —
  //    capped only so a cast that pairs everybody off cannot decide the board
  //    on how many people somebody annoyed.
  for (const [name, set] of rivals) {
    for (const other of [...set].slice(0, RIVALRY_CAP)) {
      add(name, 'rivalry', `Openly at war with ${other}.`);
    }
  }

  // 7. THE SCREENPLAY, when it is to hand.
  //
  // Every beat the engine writes names its players actor-first, and the tone
  // classifier already sorts them — the edit layer has been reading exactly
  // this to decide who is getting a villain edit. Here it decides nothing on
  // its own; it is one more deed with a weight.
  const sources = ['the record'];
  if (Array.isArray(episodes) && episodes.length && typeof classify === 'function') {
    sources.push('the episodes');
    for (const ep of episodes) {
      const beats = [];
      for (const act of ep?.acts || []) for (const b of act?.beats || []) beats.push(b);
      for (const b of ep?.beats || []) beats.push(b);
      for (const b of beats) {
        if (classify(b) !== 'villainous') continue;
        const actor = (b.players || [])[0];
        if (!actor || !score.has(actor)) continue;
        add(actor, 'villainScene',
          b.badgeText ? `${b.badgeText} — episode ${ep.episode ?? ep.num ?? '?'}.` : '');
      }
    }
  }

  /* ── 8. THE EDIT, WHICH IS THE SCREENPLAY BY ANOTHER ROUTE ──────────
     `gs.edit.totals` is per-player screen time split by TONE, and every unit
     of it was classified off the same beats the episodes are written from —
     the edit layer has been reading exactly this to decide who is getting a
     villain edit. So a season exported with its edit totals gets the
     screenplay's half of the answer without needing the transcripts to hand,
     which matters because the transcripts live in a browser database and the
     export does not.

     Scored as a SHARE, not a count: villainous units are only interesting
     next to how much airtime somebody got at all. A player whose screen time
     is a third villainy is being played as a villain; a player with twice as
     many units and a tenth of them villainous is not. */
  if (editTotals && typeof editTotals === 'object') {
    sources.push('the edit');
    for (const [name, t] of Object.entries(editTotals)) {
      const units = Number(t?.units) || 0;
      const bad = Number(t?.tones?.villainous) || 0;
      if (!units || !bad) continue;
      const share = bad / units;
      // One scene per whole 12% of a villainous edit, capped at five — enough
      // for the behaviour half to win the board on its own when it deserves
      // to, not enough for it to swamp what somebody actually did.
      const scenes = Math.min(5, Math.floor(share / 0.12));
      for (let i = 0; i < scenes; i++) {
        add(name, 'villainScene', i === 0
          ? `${Math.round(share * 100)}% of their screen time was the show playing them as the aggressor.`
          : '');
      }
    }
  }

  const board = [...score.values()]
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  const [gold, silver] = board;
  const read = gold
    ? `${gold.name} did the most to other people this season${silver
      ? `, and ${silver.name} was not far behind` : ''}.`
    : 'Nobody on this season did anything to anybody.';

  return { board, read, sources };
}

/**
 * The board as the award shape the season document already uses.
 *
 * The model still writes `description`; this fills in WHO, and hands over the
 * evidence it is allowed to write from.
 */
export function villainAward(doc, opts = {}) {
  const { board } = villainBoard(doc, opts);
  const entry = row => (row ? {
    name: row.name, playerSlug: row.slug, score: row.score,
    evidence: row.evidence.slice(0, 6),
  } : null);
  return { gold: entry(board[0]), silver: entry(board[1]), board: board.map(entry) };
}
