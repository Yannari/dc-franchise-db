// ══════════════════════════════════════════════════════════════════════
// THE WEEK, ALREADY IN THE SHAPE THE WRITER NEEDS IT
// ══════════════════════════════════════════════════════════════════════
//
// The pipeline used to hand the model a transcript in the simulator's own
// shape and ask it to produce a document in a completely different one. So
// most of what it spent its output on was RESTRUCTURING — moving the same
// facts from one arrangement into another — and every one of those moves was
// a chance to get something wrong. That is where the wrong Head of Household
// came from, and the veto winner listed as a nominee.
//
// This emits the target document with the facts already in it, and marks the
// slots that genuinely need writing. The model stops rebuilding and starts
// writing, which is cheaper and much harder to get wrong: it cannot name the
// wrong HOH when the line above already says who won.
//
// THREE KINDS OF CONTENT, and knowing which is which is the whole design:
//
//   MEASURED   — who won, who went up, every ballot. Emitted as fact. The
//                model is told it may not change these.
//   WRITTEN    — the house's own beats. Already prose, already good, and
//                already the right voice. Carried VERBATIM, because asking a
//                model to re-word them costs tokens and loses detail.
//   TO WRITE   — the room's reaction, the argument, the jokes, the hook.
//                Marked [AI: ...] and left empty.
//
// Nothing is dropped on the way through. Every act in the week lands in some
// section, and an act nobody mapped lands under house life rather than
// vanishing — the same rule the transcript follows.
import { gs, players } from './core.js';

const strip = v => String(v ?? '')
  .replace(/<[^>]*>/g, '')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');

/**
 * Which section of the finished document an act belongs under.
 *
 * Bucketed by PHASE rather than mapped act by act. There are roughly fifty act
 * types and the list grows with every twist; a per-type map would be a new
 * silent hole every time somebody adds one. Anything unrecognised falls to the
 * house-life bucket for wherever it sits in the week, which is where an
 * unmapped act belongs anyway.
 */
const SECTION_OF = {
  hoh: 'hoh',
  'rivals-hoh': 'hoh',
  'battle-of-the-block': 'hoh',
  nominations: 'noms',
  veto: 'veto',
  'veto-ceremony': 'vetoCeremony',
  'mystery-veto': 'veto',
  'second-veto': 'vetoCeremony',
  campaign: 'campaign',
  eviction: 'eviction',
  'instant-eviction': 'eviction',
  'no-eviction': 'eviction',
  departure: 'eviction',
  'jury-house': 'jury',
};

/** The order the finished document runs in. */
const ORDER = ['open', 'hoh', 'afterHoh', 'noms', 'afterNoms', 'veto',
  'vetoCeremony', 'onBlock', 'campaign', 'blockBuster', 'eviction', 'jury'];

const HEADING = {
  open: '## THE WEEK OPENS',
  hoh: '## HEAD OF HOUSEHOLD',
  afterHoh: '## HOUSE LIFE — the Head of Household is decided',
  noms: '## NOMINATION CEREMONY',
  afterNoms: '## HOUSE LIFE — before the veto',
  veto: '## POWER OF VETO',
  vetoCeremony: '## VETO CEREMONY',
  onBlock: '## HOUSE LIFE — the block is set',
  campaign: '## CAMPAIGNING',
  blockBuster: '## THE BLOCK BUSTER',
  eviction: '## EVICTION NIGHT',
  jury: '## THE JURY HOUSE',
};

/** House-life acts land in whichever stretch of the week they happened in. */
function bucketFor(actType, seen) {
  const known = SECTION_OF[actType];
  if (known) return known;
  if (actType === 'safety' || actType === 'block-buster') return 'blockBuster';
  // Unmapped: the stretch we are currently standing in.
  if (seen.has('eviction')) return 'eviction';
  if (seen.has('vetoCeremony')) return 'onBlock';
  if (seen.has('veto')) return 'onBlock';
  if (seen.has('noms')) return 'afterNoms';
  if (seen.has('hoh')) return 'afterHoh';
  return 'open';
}

/**
 * One week, as the document the writer is asked to finish.
 *
 * @param ep an episode record — a Big Brother week
 * @returns the structured text, or '' when there is nothing to build from
 */
export function generateBBStructuredText(ep) {
  if (!ep) return '';
  const L = [];
  const ln = s => L.push(strip(s));
  const blank = () => { if (L[L.length - 1] !== '') L.push(''); };
  const slot = what => { ln(`[AI: ${what}]`); };

  const acts = Array.isArray(ep.acts) ? ep.acts : [];
  // The FULL original cast, from the roster rather than from gs — `gs.players`
  // does not exist, and reading it fell through to the live house, which drops
  // everybody already evicted. The parsers read this block to build the season,
  // so a short list here quietly loses people from the whole database.
  const cast = (players || []).map(p => p?.name).filter(Boolean);
  const allNames = cast.length ? cast
    : [...new Set([...(ep.houseAtStart || []), ...(gs?.activePlayers || []),
      ...(gs?.eliminated || [])])];
  const evicted = [...(gs?.eliminated || [])];
  const stillIn = (gs?.activePlayers || ep.houseAtStart || []).filter(Boolean);

  // ── the block the parsers read ──
  ln('=== META ===');
  ln(`SEASON: Big Brother (Season ${gs?.seasonNumber ?? ep.season ?? 'Unknown'})`);
  ln(`WEEK ${ep.num} - "[AI: episode title]"`);
  blank();
  ln('=== CAST (ALL) ===');
  allNames.forEach(n => ln(n));
  blank();
  ln('=== STILL IN THE HOUSE ===');
  stillIn.forEach(n => ln(n));
  blank();
  ln('=== EVICTED ===');
  evicted.forEach(n => ln(n));
  blank();
  const jury = (gs?.jury || []).filter(Boolean);
  if (jury.length) { ln('=== JURY ==='); jury.forEach(n => ln(n)); blank(); }

  // ── the marker that keeps the pipeline honest ──
  //
  // The enhance step used to decide whether to run by sniffing for narrative
  // headers, so a pre-formatted document would have looked finished and the
  // model would silently never have been called. Detection is a deliberate
  // flag now rather than a guess about shape.
  ln('=== SOURCE: SIMULATOR-STRUCTURED ===');
  ln('Facts below are measured and must not be changed: competition winners,');
  ln('nominees, every ballot, who was evicted. Lines in [AI: ...] are yours to');
  ln('write and should be replaced entirely, brackets and all.');
  blank();
  ln('---');
  blank();

  // ── sort the week into its sections ──
  const sections = Object.fromEntries(ORDER.map(k => [k, []]));
  const seen = new Set();
  for (const act of acts) {
    const bucket = bucketFor(act?.type, seen);
    seen.add(bucket);
    sections[bucket].push(act);
  }

  const beatsOf = act => {
    const out = [];
    (act?.beats || []).forEach(b => { if (b?.text) out.push(strip(b.text)); });
    (act?.socialBeats || []).forEach(b => {
      if (!b?.text) return;
      const badge = b.badgeText ? `[${strip(b.badgeText)}] ` : '';
      out.push(`${badge}${strip(b.text)}`);
    });
    return out;
  };

  for (const key of ORDER) {
    const list = sections[key];
    // Ceremonies always print, because their absence is itself information;
    // house-life stretches print only when something happened in them.
    const alwaysPrint = ['open', 'hoh', 'noms', 'veto', 'vetoCeremony', 'eviction'];
    if (!list.length && !alwaysPrint.includes(key)) continue;

    blank();
    ln(HEADING[key]);
    blank();

    if (key === 'open') {
      slot('4-6 sentences — where the house stands walking into this week, '
        + 'and what is unresolved from the last one');
      blank();
    }

    if (key === 'hoh') {
      const act = list.find(a => a.type === 'hoh') || list[0];
      if (act?.competition) {
        ln(`**Competition:** ${strip(act.competition.name)}`
          + (act.competition.category ? ` — ${strip(act.competition.category)}` : ''));
        if (act.competition.desc) ln(`**How it works:** ${strip(act.competition.desc)}`);
      }
      if (act?.secret) {
        ln('**Winner:** SEALED — the house does not know who holds power.');
        ln(`(Viewer only, never write this into the house's mouth: ${act.winner}.)`);
      } else if (ep.hoh || act?.winner) {
        ln(`**Winner:** ${ep.hoh || act.winner} wins Head of Household.`);
      }
      const order = (act?.results || []).map(r => r?.name).filter(Boolean);
      if (order.length) ln(`**Finishing order:** ${order.join(', ')}`);
      (act?.results || []).filter(r => r?.threw).forEach(r =>
        ln(`${r.name} threw it deliberately.`));
      blank();
      beatsOf(act || {}).forEach(t => ln(t));
      list.filter(a => a !== act).forEach(a => beatsOf(a).forEach(t => ln(t)));
      blank();
      slot("the room's reaction to who just took power, and who did not go upstairs");
      blank();
      continue;
    }

    if (key === 'noms') {
      const noms = ep.initialNominees || [];
      if (noms.length) ln(`**Nominated:** ${noms.join(', ')}`);
      const act = list.find(a => a.type === 'nominations');
      if (act?.reason) ln(`**Reason given:** ${strip(act.reason)}`);
      if (ep.plan?.target) ln(`**Actually aiming at:** ${ep.plan.target}`);
      if (ep.plan?.pawn) ln(`**Meant as a pawn:** ${ep.plan.pawn}`);
      blank();
      list.forEach(a => beatsOf(a).forEach(t => ln(t)));
      blank();
      slot('why each name, and the difference between the reason said out loud '
        + 'and the real one');
      blank();
      continue;
    }

    if (key === 'veto') {
      const act = list.find(a => a.type === 'veto') || list[0];
      if (act?.players?.length) {
        ln('**The draw:**');
        act.players.forEach(n => ln(`- ${n}`));
      }
      if (act?.competition) {
        ln(`**Competition:** ${strip(act.competition.name)}`
          + (act.competition.category ? ` — ${strip(act.competition.category)}` : ''));
        if (act.competition.desc) ln(`**How it works:** ${strip(act.competition.desc)}`);
      }
      if (ep.vetoWinner) ln(`**Winner:** ${ep.vetoWinner} wins the Power of Veto.`);
      blank();
      list.forEach(a => beatsOf(a).forEach(t => ln(t)));
      blank();
      slot('the lobbying afterwards — who reached the veto holder first, and who did not bother');
      blank();
      continue;
    }

    if (key === 'vetoCeremony') {
      // The measured truth, not the difference between two nominee lists.
      if (ep.vetoUsed === true) {
        const saved = (ep.vetoSavedAll || []).length
          ? ep.vetoSavedAll : [ep.vetoSaved].filter(Boolean);
        ln(`**Veto used:** ${ep.vetoWinner || 'The veto holder'} saves ${saved.join(' and ') || 'a nominee'}.`);
        if (ep.vetoReplacement) ln(`**Replacement nominee:** ${ep.vetoReplacement}`);
      } else if (ep.vetoUsed === false) {
        ln('**Veto not used.** The medallion goes back in its box and the block does not move.');
      }
      if ((ep.finalNominees || []).length) {
        ln(`**Facing the vote:** ${ep.finalNominees.join(' and ')}`);
      }
      blank();
      list.forEach(a => beatsOf(a).forEach(t => ln(t)));
      blank();
      slot('what the decision cost the person who made it');
      blank();
      continue;
    }

    if (key === 'eviction') {
      const ballots = ep.votingLog || [];
      if (ballots.length) {
        ln('**The vote:**');
        ln('');
        ln('| Voter | Vote |');
        ln('|-------|------|');
        ballots.forEach(b => ln(`| ${b.voter} | ${b.voted} |`));
        ln('');
      }
      if (ep.eliminated) {
        const against = ballots.filter(b => b.voted === ep.eliminated).length;
        const rest = ballots.length - against;
        ln(`**Result:** ${ep.eliminated} is evicted ${against}-${rest}.`);
        const flips = ballots.filter(b => b.changed).length;
        if (flips) ln(`${flips} vote${flips === 1 ? '' : 's'} changed after the ceremony.`);
      } else {
        ln('**Result:** nobody was evicted this week.');
      }
      blank();
      list.forEach(a => beatsOf(a).forEach(t => ln(t)));
      blank();
      slot('the two final pleas, and whether the room bought either of them');
      blank();
      continue;
    }

    // House life, the campaign, the Block Buster, the jury house: the beats
    // are already written and already the right voice. Carried verbatim.
    list.forEach(a => {
      const written = beatsOf(a);
      if (!written.length) return;
      if (a.type && !SECTION_OF[a.type]) ln(`### ${String(a.type).replace(/-/g, ' ').toUpperCase()}`);
      written.forEach(t => ln(t));
      blank();
    });
  }

  // ── the sections nobody can derive ──
  blank();
  ln('## WHY THIS VOTE HAPPENED');
  blank();
  slot('the surface reason, then the real structure underneath it — which bloc '
    + 'needed it, who was protecting whom, and what the evicted houseguest misread');
  blank();
  ln('## STRATEGIC ANALYSIS');
  blank();
  slot('4-6 houseguests the week actually moved. For each: what they did, what '
    + 'they want that they cannot say out loud, and what is building');
  blank();
  ln('## CURRENT GAME STATUS');
  blank();
  if ((ep.allianceBoard || []).length) {
    for (const b of ep.allianceBoard) {
      ln(`**${strip(b.name || 'an unnamed group')}** — ${(b.members || []).length} votes, `
        + `average hold ${Number(b.average || 0).toFixed(1)}`);
      (b.members || []).forEach(m => ln(`- ${m.name}: ${strip(m.reason || '')}`));
      if (b.weakest) ln(`- the crack: ${b.weakest.name}, ${strip(b.weakest.reason || '')}`);
      blank();
    }
  }
  slot('a one-line role for every remaining houseguest — Hub, Shield, Threat, '
    + 'Operator, Wildcard, Outsider — and why');
  blank();
  ln('## ONGOING STORYLINES');
  blank();
  if ((ep.planChanges || []).filter(c => c.reason).length) {
    ln('Measured this week — plans that moved and why:');
    ep.planChanges.filter(c => c.reason).slice(0, 12)
      .forEach(c => ln(`- ${c.owner}: ${strip(c.reason)}`));
    blank();
  }
  slot('3-5 threads. For each: the situation, what each person in it feels, and '
    + 'the specific thing that will make it explode');
  blank();
  ln('## COMEDY BEATS');
  blank();
  slot('3-5 moments played for laughs, drawn from what actually happened above');
  blank();
  ln('## COLD OPEN HOOK');
  blank();
  slot('the scene next week opens on');
  blank();
  ln('## NEXT EPISODE QUESTIONS');
  blank();
  slot('4-5 questions this week actually raised');

  return L.join('\n');
}
