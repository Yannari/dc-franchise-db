// ══════════════════════════════════════════════════════════════════════
// js/vp-tr/debug.js — the castle's record, unstyled and unwithheld
// ══════════════════════════════════════════════════════════════════════
//
// Every twist challenge in this repo ships a debug tab and so does the house;
// the castle's is the last screen it was missing. It is NOT one of the seven —
// `TRAITORS_SCREENS` is the running order a night has, and the transcript
// retranscribes that list, so a debug dump registered there would be printed
// into the season's prose. It is pushed by `buildVPScreens` behind the same
// `vp_debug` flag Total Drama's is, and nothing else reaches it.
//
// THE OBSERVER CONTRACT DOES NOT APPLY HERE AND THAT IS THE POINT. Every other
// screen in this directory withholds — the turret from a Faithful, a relic
// from somebody who was not there. This one answers "what is actually on the
// row", which is the question you open a debug tab to ask, and it says so at
// the top of the page so nobody mistakes it for a viewer's screen.
//
// EVERY FIELD READ HERE IS ONE `_recordEpisode` (js/tr/headless.js) WRITES,
// and a field that is absent renders as "nothing recorded" rather than
// throwing: a debug tab that can crash is a debug tab you cannot open on the
// episode that broke.
//
// Like every other file here it imports no engine state.

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const DBG_CSS = `
.trdbg{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  font-size:11.5px;line-height:1.55;color:#c9d1d9;max-width:1100px;margin:0 auto;
  padding:18px 20px 60px}
.trdbg h2{font-family:inherit;font-size:15px;color:#f0883e;letter-spacing:.06em;
  text-transform:uppercase;margin:0 0 4px}
.trdbg .trdbg-note{color:#8b949e;margin-bottom:16px}
.trdbg section{border:1px solid rgba(255,255,255,.09);border-radius:6px;
  padding:10px 12px;margin-bottom:10px;background:rgba(255,255,255,.02)}
.trdbg section > h3{margin:0 0 6px;font-size:11px;letter-spacing:.10em;
  text-transform:uppercase;color:#f0883e;font-family:inherit}
.trdbg table{border-collapse:collapse;width:100%}
.trdbg td,.trdbg th{padding:2px 8px 2px 0;text-align:left;vertical-align:top;
  border-bottom:1px solid rgba(255,255,255,.05)}
.trdbg th{color:#8b949e;font-weight:600}
.trdbg .k{color:#8b949e;padding-right:10px;white-space:nowrap}
.trdbg .none{color:#6e7681;font-style:italic}
.trdbg .ch-murder{color:#f85149}
.trdbg .ch-banishment{color:#58a6ff}
.trdbg .ch-banishment-revote{color:#79c0ff}
.trdbg .rcpt{color:#7ee787}
.trdbg .rcpt-off{color:#6e7681;text-decoration:line-through}
`;

/** A `key: value` block. Values are markup and are escaped by the caller. */
function _rows(pairs) {
  const live = pairs.filter(Boolean);
  if (!live.length) return '<div class="none">nothing recorded</div>';
  return '<table>' + live.map(([k, v]) =>
    `<tr><td class="k">${esc(k)}</td><td>${v}</td></tr>`).join('') + '</table>';
}

const _list = arr => (arr && arr.length)
  ? esc(arr.join(', ')) : '<span class="none">none</span>';

const _or = (v, empty) => (v == null || v === '')
  ? `<span class="none">${esc(empty)}</span>` : esc(v);

/**
 * Every ballot, both channels, unfiltered.
 *
 * `publicBallots()` is what a SCREEN uses and this is not one — the whole
 * value of a debug tab on a show with a private ballot channel is being able
 * to see the private one beside the public one and check they were separated.
 */
function _ballots(list) {
  if (!list || !list.length) return '<div class="none">no ballots</div>';
  return '<table><tr><th>voter</th><th>voted</th><th>channel</th></tr>'
    + list.map(b => `<tr><td>${esc(b.voter)}</td><td>${esc(b.voted)}</td>`
      + `<td class="ch-${esc(b.channel || 'vote')}">${esc(b.channel || 'vote')}</td></tr>`).join('')
    + '</table>';
}

/**
 * EVERY STATE WRITE A SCENE MADE TONIGHT, AND WHAT CAUSED IT.
 *
 * THIS IS THE ONLY PLACE A RECEIPT IS EVER RENDERED, and the constraint is not
 * stylistic. A receipt's sentence is machine vocabulary — `belief`, `+0.7`,
 * `source:` — and the whole point of a consequence is that the viewer meets it
 * as behaviour: Gabby raises the contradiction at the Round Table, and the
 * audience works out why. A viewer card reading
 *
 *   Gabby leaves with a contradiction she can repeat at the Round Table.
 *
 * has the same receipt behind it as the row printed here:
 *
 *   belief · Gabby → Julia +0.7 · source: contradicted her dinner timeline
 *
 * A row whose `applied` is false is a write the engine REFUSED — an observer
 * who did not accept the read, an arc id that was already closed, a fact on
 * the audience-only channel that reaches no contestant. Those are struck
 * through rather than hidden: a consequence the scene believed it had and did
 * not get is exactly the defect a debug tab exists to surface.
 */
function _receipts(list) {
  if (!list || !list.length) return '<div class="none">no scene changed anything on this row</div>';
  return '<table><tr><th>kind</th><th>who</th><th>amount</th><th>source</th>'
    + '<th>scene</th></tr>'
    + list.map(r => {
      const who = (r.players && r.players.length >= 2)
        ? `${r.players[0]} + ${r.players[1]}`
        : (r.observer && r.subject) ? `${r.observer} → ${r.subject}`
          : (r.observer || r.subject || '—');
      // A crowd moment carries BOTH a colour and the affection it paid, and
      // the two are not recoverable from each other: `cruel` and `selfish` are
      // different things to have done. A belief carries what the scene said it
      // was worth AND what the store actually took, which also differ on
      // almost every row.
      const amount = r.kind === 'crowd'
        ? `${r.value}${r.delta != null ? ` (${r.delta} affection)` : ''}`
        : r.belief != null
          ? `${r.belief}${r.confidence != null ? ` (landed ${r.confidence})` : ''}`
          : r.delta != null
            ? `${r.delta}${r.kind === 'doubt' && r.confidence != null ? ` (now ${r.confidence})` : ''}`
            : r.value != null ? String(r.value) : '';
      const cls = r.applied === false ? 'rcpt-off' : 'rcpt';
      return `<tr class="${cls}"><td>${esc(r.kind)}</td><td>${esc(who)}</td>`
        + `<td>${esc(amount)}</td><td>${esc(r.source)}`
        + (r.applied === false ? ` <span class="none">— refused: ${esc(r.blockedBy)}</span>` : '')
        + `</td><td>${_or(r.eventId || r.sceneId, 'unattributed')}</td></tr>`;
    }).join('')
    + '</table>';
}

/** The debug screen for one castle row. */
export function rpBuildTraitorsDebug(epRecord) {
  const ep = epRecord || {};
  const tr = ep.tr || {};
  const c = tr.conclave;
  const t = tr.table;
  const m = tr.mission;
  const r = tr.recruitment;
  const eg = tr.endgame;
  const day = tr.castle;
  const sel = tr.selection;
  const bel = tr.beliefs;
  const receipts = tr.receipts;

  const exits = (ep.exits || []).length
    ? '<table><tr><th>name</th><th>verb</th><th>channel</th></tr>'
      + ep.exits.map(x => `<tr><td>${esc(x.name)}</td><td>${esc(x.verb)}</td>`
        + `<td class="ch-${esc(x.channel)}">${esc(x.channel)}</td></tr>`).join('')
      + '</table>'
    : '<div class="none">nobody left this episode</div>';

  // `tr.powers` is `{ shields: [], daggers: [] }` — two ledgers rather than one
  // list, because only one of the two can stop a murder.
  const relics = [
    ...((tr.powers && tr.powers.shields) || []).map(x => ['shield', x]),
    ...((tr.powers && tr.powers.daggers) || []).map(x => ['dagger', x]),
  ];
  const powers = relics.length
    ? '<table><tr><th>relic</th><th>ep</th><th>holder</th><th>visibility</th>'
      + '<th>outcome</th><th>witnesses</th></tr>'
      + relics.map(([kind, p]) => `<tr><td>${esc(kind)}</td><td>${esc(p.ep)}</td>`
        + `<td>${esc(p.holder)}</td><td>${esc(p.visibility)}</td>`
        + `<td>${esc(p.outcome || 'held')}</td>`
        + `<td>${esc((p.witnesses || []).join(', ') || 'nobody')}</td></tr>`).join('')
      + '</table>'
    : '<div class="none">no relic has been awarded yet</div>';

  return `<style>${DBG_CSS}</style>
  <div class="rp-page trdbg">
    <h2>Castle record — episode ${esc(tr.ep != null ? tr.ep : ep.num)}</h2>
    <div class="trdbg-note">Everything on the row, withheld from nobody. This is not a
      viewer's screen: the seven screens apply the observer contract and this one
      deliberately does not.</div>

    <section><h3>Row</h3>${_rows([
      ['format', esc(ep.format)],
      ['num (the visual player’s key)', esc(ep.num)],
      ['tr.ep (the season’s own number)', esc(tr.ep)],
      ['eliminated (the public vote alone)', _or(ep.eliminated, 'nobody')],
      ['pot', `${esc(tr.pot)} of ${esc(tr.potCeiling)}`],
      ['living', _list(tr.living)],
      ['cast, in seating order', _list(tr.cast)],
      ['gone before tonight', (tr.goneBefore || []).length
        ? esc(tr.goneBefore.map(g => `${g.name} (${g.channel}, ep ${g.ep})`).join(', '))
        : '<span class="none">nobody</span>'],
      ['downstairs beats', esc((tr.downstairs || []).length)],
    ])}</section>

    <section><h3>The selection</h3>${sel ? _rows([
      ['the rank, as it stood', _list(sel.line)],
      ['chosen, in draw order', _list(sel.chosen)],
      ['tapped, in walk order', esc((sel.taps || [])
        .map(t => `${t.name} at ${t.at + 1}`).join(', '))],
      ['in the turret', _list(sel.turret)],
    ]) : '<div class="none">not the first night — the rank was formed once</div>'}</section>

    <section><h3>Exits</h3>${exits}</section>

    <section><h3>Relics</h3>${powers}</section>

    <section><h3>The morning</h3>${tr.dawn ? _rows([
      ['the night it reports', _or(tr.dawn.ofEp, 'episode one — an arrival, not a body')],
      ['what happened', (tr.dawn.lastNight || []).length
        ? esc(tr.dawn.lastNight.map(x => `${x.name} — ${x.verb} (${x.channel})`).join('; '))
        : '<span class="none">nobody left</span>'],
      ['pot at the time', esc(tr.dawn.pot)],
      ['a name was chosen and a relic ate it', esc(String(!!tr.dawn.blocked))],
    ]) : '<div class="none">no cold open on this row</div>'}</section>

    <section><h3>The afternoon</h3>${m ? _rows([
      ['mission', `${esc(m.name)} <span class="k">(${esc(m.id)})</span>`],
      ['teams', (m.teams || []).length
        ? esc(m.teams.map(x => `${x.name}: ${(x.members || []).join(', ')} — ${x.perf}`).join('  |  '))
        : '<span class="none">none</span>'],
      ['quality / tier', `${esc(m.quality)} / ${esc(m.tier)}`],
      ['best team', _or(m.bestTeam, 'none')],
      ['gross / earned / pot after', `${esc(m.gross)} / ${esc(m.earned)} / ${esc(m.potAfter)}`],
      ['relic', m.relic
        ? esc(`${m.relic.kind} — `
          + (m.relic.found ? `found by ${m.relic.searcher}` : `${m.relic.searcher} searched and missed`)
          + `; seen by ${(m.relic.witnesses || []).join(', ') || 'nobody'}`)
        : '<span class="none">nothing was down there</span>'],
    ]) : '<div class="none">no mission this afternoon</div>'}</section>

    <section><h3>The round table</h3>${t ? _rows([
      ['an endgame table', esc(String(!!t.endgame))],
      ['seated', _list(t.seated)],
      ['chosen', _or(t.chosen, 'nobody')],
      // Ground truth. Absent on an endgame table by construction — spec 8 says
      // nothing is revealed there, and the record never carries it.
      ['what they turned out to be', _or(t.chosenAlignment, 'not revealed')],
      ['revotes', (t.revotes || []).length
        ? esc(t.revotes.map(x => `${(x.tied || []).join(' / ')} — ${x.count} ballots`).join('; '))
        : '<span class="none">none</span>'],
      ['ballots, every channel', _ballots(t.votes)],
    ]) : '<div class="none">no table on this row</div>'}</section>

    <section><h3>The conclave</h3>${c ? _rows([
      ['variant', esc(c.variant)],
      ['turret', _list(c.turret)],
      ['target', _or(c.target, 'nobody')],
      ['stopped by a relic', esc(String(!!c.blocked))],
      ['decided by', `${_or(c.decidedBy, 'nobody in particular')} — ${esc(c.reason || '')}`],
      ['argued for', (c.argued || []).length
        ? esc(c.argued.map(a => `${a.traitor} → ${a.target} (${a.conviction})`).join('; '))
        : '<span class="none">nobody had a name</span>'],
      ['ballots', _ballots(c.ballots)],
    ]) : '<div class="none">the pact did not meet, or met and did not kill</div>'}</section>

    <section><h3>The offer</h3>${r ? _rows([
      ['asked', esc(r.target)],
      ['by', _or(r.recruiter, 'the pact')],
      ['mode', esc(r.mode)],
      ['accepted', esc(String(!!r.accepted))],
      ['and if refused', _or(r.executed, 'nothing — a note can be thrown away')],
    ]) : '<div class="none">no offer this night</div>'}</section>

    <section><h3>Why anything is different — the scene receipts</h3>${_receipts(receipts)}</section>

    <section><h3>Episode length &mdash; what was budgeted and what fired</h3>${
      (day && day.density)
        ? '<table><tr><th>phase</th><th>budget</th><th>scenes</th><th>spent</th></tr>'
          + (day.density.budgets || []).map(b => {
            const got = ((day.phases || []).find(p => p.id === b.id)?.scenes || []).length;
            // A phase that fired FEWER scenes than its floor is the pool
            // running out, not a budget choice -- the thing that caps
            // Extended. Flagged so a reader can see which stretch of the day
            // had nothing eligible left rather than inferring it.
            const short = got < b.min;
            return `<tr><td>${esc(b.label)}</td><td>${esc(b.min)}-${esc(b.max)}</td>`
              + `<td>${esc(got)}</td><td>${short
                ? '<span class="none">pool ran dry</span>' : 'as budgeted'}</td></tr>`;
          }).join('')
          + `<tr><td><b>total</b></td><td>${esc((day.density.budgets || [])
            .reduce((a, b) => a + b.min, 0))}-${esc((day.density.budgets || [])
            .reduce((a, b) => a + b.max, 0))}</td><td><b>${esc((day.phases || [])
            .reduce((a, p) => a + (p.scenes || []).length, 0))}</b></td><td>`
          + `${esc(day.density.id)} &times;${esc(day.density.factor)}</td></tr>`
          + '</table>'
        : '<div class="none">no density on this record</div>'}</section>

    <section><h3>The castle day</h3>${(day && (day.scenes || []).length)
      ? '<table><tr><th>hour</th><th>family</th><th>event</th><th>who</th>'
        + '<th>thread</th><th>beat</th><th>cites</th><th>closed</th></tr>'
        + day.scenes.map(x => `<tr><td>${esc(x.window)}</td><td>${esc(x.family)}</td>`
          + `<td>${esc(x.eventId)}${x.branch ? ':' + esc(x.branch) : ''}</td>`
          + `<td>${esc((x.people || []).join(', ') || (x.actors || []).join(', '))}</td>`
          + `<td>${esc(x.threadId)}</td>`
          + `<td>${esc(x.beatNo)}${x.priorDays.length ? ' (days ' + esc(x.priorDays.join(',')) + ')' : ''}</td>`
          + `<td>${x.citedDays.length ? esc(x.citedDays.join(',')) : '<span class="none">-</span>'}</td>`
          + `<td>${x.closedNow ? esc(x.outcome + ' [' + x.sense + ']') : '<span class="none">-</span>'}</td>`
          + '</tr>').join('')
        + '</table>'
      : '<div class="none">the castle wrote nothing down today</div>'}</section>

    <section><h3>What the castle believes</h3>${bel ? _rows([
      ['the ceiling an inference can never beat', esc(bel.ceiling)],
      ['candidates', _list(bel.living)],
      ['flips so far', (bel.flips || []).length
        ? esc(bel.flips.map(f => `${f.name} (ep ${f.ep}, ${f.via})`).join('; '))
        : '<span class="none">nobody has been turned</span>'],
      ['the collective, Faithful observers only', (bel.castle || []).length
        ? '<table><tr><th>name</th><th>accusers</th><th>weight</th><th>strongest</th>'
          + '<th>dismissed by</th><th>truth</th></tr>'
          + bel.castle.map(r => `<tr><td>${esc(r.name)}</td><td>${esc(r.accusers)}</td>`
            + `<td>${esc(r.weight)}</td><td>${esc(r.top)}</td><td>${esc(r.cleared)}</td>`
            + `<td>${esc((bel.truth || {})[r.name])}</td></tr>`).join('')
          + '</table>'
        : '<span class="none">not one read between them</span>'],
      ['every board, every entry', (bel.boards || []).length
        ? '<table><tr><th>observer</th><th>about</th><th>score</th><th>confidence</th>'
          + '<th>tier</th><th>valence</th><th>learned</th><th>certain</th><th>why</th></tr>'
          + bel.boards.map(b => b.entries.map(e =>
            `<tr><td>${esc(b.observer)}</td><td>${esc(e.name)}</td><td>${esc(e.score)}</td>`
            + `<td>${esc(e.confidence)}</td><td>${esc(e.sourceType)}</td>`
            + `<td>${esc(e.valence)}</td><td>${esc(e.learnedEp)}</td>`
            + `<td>${esc(String(!!e.certain))}</td><td>${esc(e.why)}</td></tr>`).join('')).join('')
          + '</table>'
        : '<span class="none">nobody holds a belief about anybody</span>'],
    ]) : '<div class="none">no board on this row — an endgame table reveals nothing</div>'}</section>

    <section><h3>The endgame</h3>${eg ? _rows([
      ['from / to', `${esc(eg.from)} → ${esc(eg.endEp)}`],
      ['the asks', (eg.asks || []).length
        ? esc(eg.asks.map(a => `ep ${a.ep}: ${a.banish} of ${(a.living || []).length} said banish`
          + (a.unanimous ? ' — unanimous, and the money is settled' : '')).join('; '))
        : '<span class="none">none</span>'],
      ['the extra tables', (eg.tables || []).length
        ? esc(eg.tables.map(x => `ep ${x.ep}: ${x.chosen || 'nobody'}`).join('; '))
        : '<span class="none">none — the first ask was unanimous</span>'],
      ['takers', _list(eg.takers)],
      ['losers', _list(eg.losers)],
      ['pot / each share', `${esc(eg.pot)} / ${esc(eg.share)}`],
      ['how it reads', _or(eg.line, 'no line')],
    ]) : '<div class="none">this is not the last row the season wrote</div>'}</section>
  </div>`;
}
