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
  // ── every other show's deeds (2026-10-29: "do all the simulators save the villains of the season?" — two did) ──
  sabotage: 4,          // wrecked somebody else's chance on purpose: a sabotaged verse, a thrown daily, a race wrecked
  stole: 3,             // took what was somebody else's: a partner in the villa, a bit in the werk room
  deceived: 2,          // lived a lie at somebody: a Traitor banishing a Faithful, a catfish, a two-faced pull
  cruelty: 2,           // a scene that hurt somebody and turned the room against the one who did it
  calledOut: 2,         // chose an opponent for the elimination (The Challenge's call-out)
};
const RIVALRY_CAP = 4;
// A show that produces a small deed every episode would decide the board on volume alone: a queen who read somebody
// badly ten times is not three times the villain of one who sabotaged a verse.
const CAPS = { cruelty: 6, deceived: 6, villainScene: 5, calledOut: 4, sabotage: 4 };

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
    deeds: Object.fromEntries(Object.keys(WEIGHTS).map(k => [k, 0])),
    evidence: [],
  }]));
  const add = (name, deed, line) => {
    const row = score.get(name);
    if (!row || !(deed in WEIGHTS)) return;
    if (CAPS[deed] && row.deeds[deed] >= CAPS[deed]) return;
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
  // Every show after the first two writes these on the player instead (the life layer's fields, ADDING-A-SHOW §5):
  // names, not pair objects.
  for (const p of doc.placements || []) {
    for (const o of p.alliances || []) if (typeof o === 'string' && o !== p.name) { allies.get(p.name)?.add(o); allies.get(o)?.add(p.name); }
    for (const o of p.rivalries || []) if (typeof o === 'string' && o !== p.name) { rivals.get(p.name)?.add(o); rivals.get(o)?.add(p.name); }
  }
  // who cut whom, so a betrayal a vote already counted is not counted again off the player's own list
  const cut = new Set();

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
        cut.add(`${b.voter}>${r.out}`);
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

  // ── 5b. WHAT EVERY OTHER SHOW RECORDS ──────────────────────────────
  // Read off the document's own fields, never its show's name, so a show added later that writes the same fields is
  // read the same way.

  // A betrayal the record names outright (The Circle, The Challenge, the race write `betrayed` on the player).
  for (const p of doc.placements || []) {
    for (const v of p.betrayed || []) {
      if (typeof v !== 'string' || cut.has(`${p.name}>${v}`)) continue;
      cut.add(`${p.name}>${v}`);
      add(p.name, 'cutAnAlly', `Betrayed ${v}.`);
    }
  }

  // The Traitors: who wore the cloak which night. A Traitor is in the turret for every murder while they are in the
  // castle, and every Faithful they voted out at the round table was voted out by somebody pretending to be one.
  if (Array.isArray(doc.roleHistory) && doc.roleHistory.length) {
    const flips = [...doc.roleHistory].sort((a, b) => (a.ep || 0) - (b.ep || 0));
    const roleAt = (n, ep) => {
      let r = 'faithful';
      for (const f of flips) if (f.name === n && (f.ep || 0) <= ep) r = f.to;
      return r;
    };
    const outAt = new Map((doc.placements || []).map(p => [p.name, Number(p.exitEpisode) || Infinity]));
    for (const row of doc.votingHistory || []) {
      const ep = Number(row.episode) || 0;
      if (row.murdered && !row.murderBlocked) {
        for (const n of cast) {
          if (n !== row.murdered && roleAt(n, ep) === 'traitor' && (outAt.get(n) ?? Infinity) >= ep) {
            add(n, 'ranTheWeek', `In the turret the night ${row.murdered} was murdered (episode ${ep}).`);
          }
        }
      }
      for (const v of row.votes || []) {
        if (!v?.voter || v.target !== row.eliminated || roleAt(v.voter, ep) !== 'traitor') continue;
        if (roleAt(v.target, ep) === 'traitor') add(v.voter, 'cutAnAlly', `Voted out ${v.target}, a fellow Traitor, in episode ${ep}.`);
        else add(v.voter, 'deceived', `Sat at the round table as a Faithful and voted out ${v.target}, who really was one, in episode ${ep}.`);
      }
    }
  }

  // Drag Race: the edit each queen was given, week by week. Its villain arcs are the show's own read of her.
  for (const e of doc.dr?.episodes || []) {
    for (const p of e.placements || []) {
      if (!/^(Villain|Bitter Edit)$/.test(String(p.storyline || ''))) continue;
      const first = !(score.get(p.name)?.deeds.villainScene);
      add(p.name, 'villainScene', first ? `Cut as the villain of the season from episode ${e.episode}.` : '');
    }
  }

  // A choice of who leaves made by a named few (The Circle's Influencers) is theirs, and an ally blocked is a cut.
  for (const row of doc.votingHistory || []) {
    for (const x of row.exits || []) {
      if (!Array.isArray(x.by)) continue;
      for (const by of x.by) {
        if (!by || by === x.name) continue;
        if (allies.get(by)?.has(x.name) && !cut.has(`${by}>${x.name}`)) {
          cut.add(`${by}>${x.name}`);
          add(by, 'cutAnAlly', `Blocked ${x.name}, an ally, in episode ${row.episode}.`);
        } else add(by, 'ranTheWeek', `Blocked ${x.name} in episode ${row.episode}.`);
      }
    }
    // The Challenge: an opponent called into the elimination
    for (const c of row.callouts || []) {
      if (!c?.by || !c.opponent) continue;
      if (allies.get(c.by)?.has(c.opponent)) add(c.by, 'cutAnAlly', `Called ${c.opponent}, an ally, into the elimination in episode ${row.episode}.`);
      else add(c.by, 'calledOut', `Called ${c.opponent} into the elimination in episode ${row.episode}.`);
    }
    // Perfect Match: a partner taken at a recoupling
    for (const st of row.steals || []) {
      if (!st?.by || st.reclaim) continue;
      add(st.by, 'stole', `Took ${st.took} from ${st.from} in episode ${row.episode}.`);
    }
  }
  // The Circle: a whole season as somebody else
  for (const c of doc.catfish || []) {
    if (c?.name) add(c.name, 'deceived', `Played the season as ${c.playedAs || c.profile}, a profile that was not them.`);
  }
  for (const p of doc.placements || []) {
    // the race: a sabotage the leg recorded (no victim on the record)
    const sab = Number(p.rr?.sabotage) || 0;
    for (let i = 0; i < sab; i++) add(p.name, 'sabotage', i === 0 ? `Sabotaged another team ${sab === 1 ? 'once' : `${sab} times`}.` : '');
    // Perfect Match: the public's own word for them at the end
    if (p.pm?.label === 'villain') {
      add(p.name, 'villainScene', 'Ended the season as the public\'s villain.');
      add(p.name, 'villainScene', '');
    }
  }
  // What a show's exporter collected from its episodes (js/villain-deeds.js): one shape for every show.
  for (const d of doc.villainDeeds || []) if (d?.by && d.kind) add(d.by, d.kind, d.line || '');

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
  if ((doc.villainDeeds || []).length) sources.push('the episodes');
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

  return { board, read, sources: [...new Set(sources)] };
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

/**
 * The board on the document, the shape every exporter and the site share: `{ read, sources, board }`, or nothing when
 * nobody on the season did anything to anybody. For a show's exporter; Total Drama and Big Brother attach theirs in
 * stats-export.js with the edit totals.
 */
export function attachVillainBoard(doc, opts = {}) {
  try {
    const { board, read, sources } = villainBoard(doc, opts);
    if (board.length) doc.villainBoard = { read, sources, board };
  } catch { /* a board is an award, never a blocker */ }
  return doc;
}
