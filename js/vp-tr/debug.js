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

/** The debug screen for one castle row. */
export function rpBuildTraitorsDebug(epRecord) {
  const ep = epRecord || {};
  const tr = ep.tr || {};
  const c = tr.conclave;
  const t = tr.table;
  const m = tr.mission;
  const r = tr.recruitment;
  const eg = tr.endgame;

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
