// ══════════════════════════════════════════════════════════════════════
// vp-dr/summary.js — the provisional episode screen
// ══════════════════════════════════════════════════════════════════════
//
// THIS IS NOT THE VIEWING PARTY. Plan 5 builds that: sixteen screens with
// their own atmosphere, click-to-reveal, a live sidebar and the track record
// chart. This file exists because without it a drag episode cannot be OPENED
// at all — `buildVPScreens` fell through to the Total Drama path, which reads
// tribes and a Tribal Council off a row that has neither, and threw.
//
// So this is deliberately plain: a table of what the engine decided, in the
// order it decided it. It is here to make the show hand-testable between Plan
// 1 and Plan 5, and it is styled to look like a readout rather than a finished
// screen precisely so nobody mistakes it for one and leaves it in place.
//
// What it shows is the one thing worth watching while the engine is being
// built: the panel's ranking beside the host's final one, so a bend is visible
// as a moving row.
import { transcriptHeaderLines } from '../transcript-header.js';
import { _note, _portrait } from './style.js';
import { showWords } from '../shows.js';
import { dragScreensRevealed } from './screens.js';
import { judgeById } from '../dr/judges.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const RESULT_COLOR = {
  WIN: '#f2c14e', HIGH: '#7dd3fc', SAFE: '#8b949e', LOW: '#fb923c',
  BTM: '#f85149', ELIM: '#7f1d1d', WINNER: '#ff2d95', FINALIST: '#c084fc',
};

function resultFor(row, name) {
  const c = row.dr?.call;
  if (!c) return '';
  if ((row.exits || []).some(x => x.name === name)) return 'ELIM';
  if (c.win?.includes(name)) return 'WIN';
  if (c.high?.includes(name)) return 'HIGH';
  if (c.low?.includes(name)) return 'LOW';
  if (c.bottom?.includes(name)) return 'BTM';
  return 'SAFE';
}

/* ══════════════════════════════════════════════════════════════════
   FAN PULSE, and the arcs the season is telling
   ══════════════════════════════════════════════════════════════════

   Two things this show computed all season and drew nowhere.

   POPULARITY is written by nearly every scene -- defending somebody in the
   werk room pays, throwing a friend under the bus costs -- and it lived only
   on the season state, so no episode could show it and nobody could see why
   a queen the edit loved was doing well. The tiers are Total Drama's, because
   the ledger is the same ledger and two shows disagreeing about what 12
   means would be worse than either scale being wrong.

   STORYLINES are the arcs cast at the start and advanced by beats. `alive`
   is whether the arc is still running; `flipped` is an arc that turned into
   its opposite, which is the most interesting thing that can happen to one
   and had no reader at all. */
const POP_TIERS = [
  [12, 'LOVED', '#7CE7B0'], [7, 'FAN FAVOURITE', '#7CE7B0'], [3, 'RISING', '#FFC83D'],
  [0.0001, 'STEADY', '#8b949e'], [-0.0001, 'INVISIBLE', '#6e7681'],
  [-5, 'FADING', '#f0883e'], [-10, 'UNPOPULAR', '#FF6B8A'],
];
const popTier = v => (POP_TIERS.find(([at]) => v >= at) || [0, 'HATED', '#f85149']).slice(1);

function _fanPulse(dr, ep) {
  const pop = dr.popularity || {};
  const living = new Set(dr.living || []);
  const names = Object.keys(pop);
  if (!names.length) {
    return '<div style="opacity:.6;font-size:12px">No fan ledger on this episode.</div>';
  }
  const rows = names.map(n => ({ n, v: Number(pop[n]) || 0, out: !living.has(n) }))
    .sort((a, b) => b.v - a.v);
  const max = Math.max(1, ...rows.map(r => Math.abs(r.v)));
  return `<table style="width:100%;border-collapse:collapse;font-size:12px">
    ${rows.map((r, i) => {
    const [label, colour] = popTier(r.v);
    const w = (Math.abs(r.v) / max) * 100;
    return `<tr style="${r.out ? 'opacity:.45;' : ''}border-bottom:1px solid rgba(255,255,255,.06)">
      <td style="padding:3px 6px;color:#6e7681;width:22px;text-align:right">${i + 1}</td>
      <td style="padding:3px 2px 3px 6px;width:26px">${_portrait(r.n, ep, { size: 22 })}</td>
      <td style="padding:3px 6px;font-weight:600">${esc(r.n)}${r.out ? ' <span style="opacity:.6">(out)</span>' : ''}</td>
      <td style="padding:3px 6px;color:${colour};font-size:10px;letter-spacing:.08em">${label}</td>
      <td style="padding:3px 6px;width:45%">
        <span style="display:block;height:7px;background:rgba(255,255,255,.07);border-radius:3px">
          <i style="display:block;height:100%;width:${w.toFixed(0)}%;border-radius:3px;
            background:${r.v < 0 ? '#f85149' : colour}"></i></span></td>
      <td style="padding:3px 6px;text-align:right;font-variant-numeric:tabular-nums">${r.v.toFixed(1)}</td>
    </tr>`;
  }).join('')}
  </table>
  <div style="opacity:.55;font-size:11px;margin-top:6px">Every scene writes this:
    defending somebody pays, selling somebody out costs. Negative is not
    invisible &#8212; it is disliked, which on this show is still an edit.</div>`;
}

function _storylines(dr, ep) {
  const arcs = dr.storylines || [];
  if (!arcs.length) return '<div style="opacity:.6;font-size:12px">No arcs cast yet.</div>';
  const living = dr.living || [];

  /* ── BY QUEEN, AND TOLD ARCS FIRST ────────────────────────────────
     The first version listed all twenty-three arcs flat, and most of them
     had ZERO BEATS -- an arc that was cast at the start and has never
     actually happened on screen. Ivy came out carrying "frontrunner",
     "fashion", "narrator" and "representation", three of which the season
     has never told, which answers the question "what storyline is she on"
     with a shrug.
     So: grouped by the queen it is about, because that is the question, and
     an arc with beats is printed ahead of one without. `beats` is the count
     of times the season has actually said it. */
  const mine = n => arcs.filter(a => (a.players || []).includes(n) && a.alive)
    .sort((x, y) => y.beats - x.beats);
  const pill = a => `<span style="display:inline-block;padding:1px 7px;margin:0 4px 3px 0;
    border-radius:9px;font-size:10.5px;
    background:${a.beats ? 'rgba(255,106,219,.16)' : 'rgba(255,255,255,.05)'};
    color:${a.beats ? '#FF6ADB' : '#6e7681'}"
    title="${a.beats ? `${a.beats} beat${a.beats === 1 ? '' : 's'} so far` : 'cast, never told'}"
    >${esc(a.arc)}${a.beats ? ` \u00b7${a.beats}` : ''}${a.flipped ? ` \u2192${esc(a.flipped)}` : ''}</span>`;

  const rows = living.map(n => {
    const list = mine(n);
    const told = list.filter(a => a.beats > 0);
    return `<tr style="border-bottom:1px solid rgba(255,255,255,.06)">
      <td style="padding:4px 2px 4px 6px;width:24px;vertical-align:top">${_portrait(n, ep, { size: 20 })}</td>
      <td style="padding:4px 6px;font-weight:600;white-space:nowrap;vertical-align:top">${esc(n)}</td>
      <td style="padding:4px 6px">${list.length ? list.map(pill).join('')
    : '<span style="opacity:.45;font-size:11px">no arc</span>'}
        ${told.length ? '' : '<span style="opacity:.45;font-size:10px"> \u2014 nothing told yet</span>'}</td>
    </tr>`;
  }).join('');

  const done = arcs.filter(a => !a.alive);
  return `<table style="width:100%;border-collapse:collapse;font-size:12px">${rows}</table>
    <div style="opacity:.55;font-size:11px;margin-top:7px">Bright = the season has
      actually told it, with the number of beats. Grey = cast and never used.
      ${'\u2192'} marks an arc that turned into its opposite.</div>
    ${done.length ? `<div style="opacity:.55;font-size:11px;margin-top:8px">Finished:
      ${esc(done.map(a => `${a.arc} (${(a.players || []).join(', ')})`).join(' \u00b7 '))}</div>` : ''}`;
}

/** The two panels, as one block the summary can drop in. */
export function _dragPulseAndArcs(row) {
  const dr = (row && row.dr) || {};
  // `_portrait` reads the show and the episode off this, the same shape every
  // other screen in this directory hands it.
  const ep = { num: (row && row.num) || dr.ep || 0, format: 'drag-race', dr };
  const box = (title, body) => `<section style="border:1px solid rgba(255,255,255,.09);
    border-radius:8px;padding:12px 14px;margin:0 0 12px;background:rgba(255,255,255,.02)">
    <h3 style="margin:0 0 8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;
      color:#FF6ADB">${title}</h3>${body}</section>`;
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0"
    class="dr-dbg-cols">
    ${box('Fan pulse', _fanPulse(dr, ep))}
    ${box('Storylines', _storylines(dr, ep))}
  </div>
  <style>@media(max-width:900px){.dr-dbg-cols{grid-template-columns:1fr}}</style>`;
}

export function rpBuildDragSummary(row) {
  const dr = row.dr || {};
  const w = showWords('drag-race');
  const bend = dr.bend || [];
  const call = dr.call || {};

  const head = `
    <div style="max-width:1100px;margin:0 auto;padding:16px;font-family:system-ui,sans-serif;color:#cdd6f4">
      <div style="border:1px dashed rgba(255,45,149,.5);border-radius:6px;padding:8px 12px;margin-bottom:14px;
                  background:rgba(255,45,149,.07);font-size:12px;line-height:1.5">
        <b style="color:#ff2d95">Engine readout.</b>
        What the engine decided, in the order it decided it — the numbers under
        the episode rather than the episode. The viewing party itself is every
        other screen in this deck; this one is for reading a season while
        working on it, and it is the only screen here that withholds nothing.
      </div>
      <h2 style="margin:0 0 4px;font-size:20px">Episode ${esc(dr.ep ?? row.num)}</h2>
      <div style="color:#8b949e;font-size:13px;margin-bottom:14px">
        ${esc(dr.challenge?.name || '—')}
        ${dr.mini ? ` · mini: ${esc(dr.mini.name)} (won by ${esc(dr.mini.winner)})` : ''}
        ${dr.judges?.length ? ` · panel: ${esc(dr.judges.map(id => judgeById(id)?.name || id).join(', '))}` : ''}
      </div>`;

  // Drawn before anything episode-shaped, so they are on the finale row too:
  // the fan ledger and the arcs are season-long and a finale is where they
  // both pay off.
  const pulse = _dragPulseAndArcs(row);

  if (dr.finale) {
    const f = dr.finale;
    return `${head}${pulse}
      <h3 style="font-size:15px;margin:16px 0 6px">The finale — ${esc(f.type)}</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        ${f.rounds.map(r => `<tr>
          <td style="padding:4px 8px;border-bottom:1px solid #30363d">${esc(r.a)} vs ${esc(r.b)}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #30363d;color:#8b949e">${esc(r.song)}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #30363d;color:#f2c14e">${esc(r.winner)} wins</td>
        </tr>`).join('')}
      </table>
      <h3 style="font-size:15px;margin:16px 0 6px">Placements</h3>
      <ol style="font-size:13px;line-height:1.7">
        ${f.placements.map(n => `<li>${esc(n)}</li>`).join('')}
      </ol>
      <p style="margin-top:14px;font-size:15px;color:#ff2d95"><b>${esc(f.winner)}</b> is crowned.</p>
    </div>`;
  }

  const rows = bend.map(b => {
    const res = resultFor(row, b.name);
    const moved = b.finalRank - b.panelRank;
    const arrow = moved === 0 ? '' : moved < 0 ? `▲ ${-moved}` : `▼ ${moved}`;
    return `<tr>
      <td style="padding:4px 8px;border-bottom:1px solid #30363d">${esc(b.name)}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #30363d;text-align:center;color:#8b949e">${b.panelRank}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #30363d;text-align:center">${b.finalRank}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #30363d;text-align:center;color:${moved < 0 ? '#4ade80' : '#fb923c'}">${arrow}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #30363d;color:${RESULT_COLOR[res] || '#8b949e'}"><b>${res}</b></td>
      <td style="padding:4px 8px;border-bottom:1px solid #30363d;text-align:center;color:#8b949e">
        ${(dr.performances?.[b.name]?.perf ?? '—')}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #30363d;color:#8b949e">${esc(dr.reactions?.[b.name] || '')}</td>
    </tr>`;
  }).join('');

  const ls = dr.lipsync;
  return `${head}${pulse}
    <h3 style="font-size:15px;margin:16px 0 6px">The panel, and what the host did with it</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <tr style="color:#8b949e;font-size:11px;letter-spacing:.5px">
        <th style="text-align:left;padding:4px 8px">${esc(w.player).toUpperCase()}</th>
        <th style="padding:4px 8px">PANEL</th><th style="padding:4px 8px">FINAL</th>
        <th style="padding:4px 8px">MOVED</th><th style="text-align:left;padding:4px 8px">CALL</th>
        <th style="padding:4px 8px">PERF</th><th style="text-align:left;padding:4px 8px">REACTION</th>
      </tr>
      ${rows}
    </table>
    ${dr.panel?.split ? '<p style="font-size:12px;color:#60a5fa;margin-top:8px">The judges did not agree at the ends — a split panel, so the host had more room.</p>' : ''}
    ${ls ? `
      <h3 style="font-size:15px;margin:16px 0 6px">Lip sync</h3>
      <p style="font-size:13px">
        ${esc(ls.queens.join(' vs '))} — <i>${esc(ls.song)}</i> by ${esc(ls.artist)}<br>
        <span style="color:#8b949e">${esc(ls.queens[0])} ${ls.scores[ls.queens[0]]} · ${esc(ls.queens[1])} ${ls.scores[ls.queens[1]]}</span><br>
        <b style="color:#ff2d95">${ls.call === 'double-shantay' ? 'Double shantay — both stay.'
          : ls.call === 'double-sashay' ? 'Double sashay — both go.'
            : `${esc(ls.winner)} stays.`}</b>
      </p>` : ''}
    ${(row.exits || []).length ? `<p style="font-size:14px;margin-top:12px">
        ${row.exits.map(x => `${esc(x.name)} ${esc(x.verb)}.`).join(' ')}</p>` : ''}
    <p style="font-size:12px;color:#8b949e;margin-top:12px">
      ${(dr.living || []).length} ${esc(w.players)} left: ${esc((dr.living || []).join(', '))}</p>
  </div>`;
}

/**
 * The same facts as text, for the transcript.
 *
 * Plan 3 replaces this with prose written from the scene pools; until then a
 * transcript that states what happened is more useful than one that throws.
 */
/**
 * The episode, retranscribed from THE SCREENS THE VIEWER SEES.
 *
 * Not a second walk of the scene list. The castle learned this the expensive
 * way: two readers of the same episode drift, and the transcript quietly
 * stops mentioning a screen nobody remembered to add to the second copy. So
 * this renders `dragScreensRevealed` — the same registry the viewing party
 * builds from, fully opened on a shadow row — and strips the HTML.
 *
 * A screen added to js/vp-dr/screens.js therefore appears here without this
 * function being touched, and a screen that is not there appears in neither.
 */
export function generateDragSummaryText(row) {
  const dr = row.dr || {};
  const L = [];
  const ln = s => L.push(s);

  ln(`DRAG RACE — EPISODE ${dr.ep ?? row.num}`);
  ln('='.repeat(46));
  ln('');

  /* ── THE BLOCK THE CONTROL ROOM READS ─────────────────────────────
     current-season.html learns the cast, the roster and the eliminations from
     `=== HEADER ===` blocks and from nothing else. This show emitted none of
     them, so a synced drag season arrived with no queens attached to it.
     The roster comes off the ROW, not off `gs`: a transcript is written for
     one episode and a re-read row is not the live state. */
  for (const line of transcriptHeaderLines(row, {
    format: 'drag-race',
    title: dr.challenge?.name || '',
    active: [...(dr.living || [])],
    /* WHO HAS GONE, AS OF TONIGHT. There is no `out` list on the row -- the
       season keeps one but does not ship it -- so it comes from the two
       fields that ARE here: everybody the record knows, minus everybody still
       standing. Derived per-episode, which is what a transcript wants: a
       replayed episode 4 must list episode 4's departures, not the season's. */
    eliminated: Object.keys(dr.record || {})
      .filter(n => !(dr.living || []).includes(n)),
    phase: dr.finale ? 'finale' : 'competition',
  })) ln(line);

  const screens = dragScreensRevealed(row);
  if (screens.length) {
    for (const sc of screens) {
      // The chart is a grid; a stripped table is a wall of unreadable words,
      // and the season page draws the real one.
      if (sc.id === 'dr-chart') continue;
      /* THE SHOWROOM IS INTERACTIVE, so stripping its HTML transcribes ONE
         queen. It renders `buildForQueen(first, ...)` and swaps every other
         queen in on a click, which means twelve of thirteen exist only as
         JavaScript and a reader of the transcript meets the room through
         whoever happened to be first in the list. Written out in full below
         instead — the same allies, rivals and drag family the screen draws,
         for everybody. */
      if (sc.id === 'dr-rel') { _textShowroom(dr, ln); continue; }
      ln(sc.label.toUpperCase());
      ln('-'.repeat(sc.label.length));
      /* ONE BEAT, ONE PARAGRAPH. The screens already mark each revealable
         beat as a `dr-step`, so the transcript breaks on that boundary
         rather than on whitespace: collapsing everything ran four cards
         into one paragraph, and collapsing nothing left a blank line per
         empty span. The markup already knows where the beats are. */
      const clean = html => String(html)
        .replace(/<style[\s\S]*?<\/style>/g, '')
        .replace(/<!--dr-chrome-->[\s\S]*?<!--\/dr-chrome-->/g, '')
        .replace(/<[^>]+>/g, ' ')
        /* THE WHOLE TYPOGRAPHIC SET, not the ones that had leaked so far.
           This was an allowlist of five, so every new screen that wrote a
           curly quote shipped the entity into the transcript verbatim — the
           smackdown's song titles and the runway's "Tonight's category is"
           each found it separately. */
        .replace(/&(times|minus|rsaquo|lsaquo|nbsp|lt|gt|quot|apos|rsquo|lsquo|ldquo|rdquo|mdash|ndash|middot|hellip|deg|amp);/g,
          (_m, n) => ({
            times: 'x', minus: '-', rsaquo: '>', lsaquo: '<', nbsp: ' ',
            lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’',
            lsquo: '‘', ldquo: '“', rdquo: '”',
            mdash: '—', ndash: '–', hellip: '…', deg: '°',
            // Fifteen of these reached the transcript. Every screen that separates
            // two facts on one line reaches for it and the decoder had never heard of it.
            middot: '·',
            amp: '&',
          }[n]))
        .replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(Number(d)))
        .replace(/\s+/g, ' ')
        .trim();

      const body = String(sc.html)
        .replace(/<style[\s\S]*?<\/style>/g, '')
        .replace(/<!--dr-chrome-->[\s\S]*?<!--\/dr-chrome-->/g, '');
      const chunks = body.split(/<div class="dr-step[^"]*"/);
      /* CHUNK ZERO IS NOT A STEP AND IT IS NOT NOTHING. This used to be
         `chunks.slice(1)`, which threw away everything before the first
         revealable card — and on the crowning screen that is the bracket, the
         sash, the crown and the finishing order, the one thing a finale is
         for. It went unnoticed while the finale had no step-shaped scenes to
         split on: with one chunk the whole body was kept, and the day the
         finale grew prose the lead silently vanished from every transcript.
         The bug is general, not the finale's — any screen carrying both a
         structured lead and revealable steps lost the lead. */
      const head = chunks.length > 1 ? [chunks[0]] : [];
      // The split eats the opening `<div class="dr-step…` and leaves the rest
      // of that tag on the front of the chunk, which the tag stripper cannot
      // see because its `<` is gone. Take it off first — but only on the
      // chunks that actually had one.
      const tail = chunks.length > 1
        ? chunks.slice(1).map(c => c.replace(/^[^>]*>/, ''))
        : [body];
      const blocks = [...head, ...tail].map(clean).filter(Boolean);
      for (const b of blocks) ln(`  ${b}`);
      ln('');
    }
    return L.join('\n');
  }

  // ── THE FALLBACK, for a row the registry finds no screens on ──
  // A season played before the screens existed still has to read as
  // something, and an empty transcript is worse than a plain one.
  const w = showWords('drag-race');
  ln('(Engine readout — no screens matched this row.)');
  ln('');

  if (dr.finale) {
    ln(`THE FINALE — ${dr.finale.type}`);
    for (const r of dr.finale.rounds) ln(`  ${r.a} vs ${r.b} — "${r.song}" · ${r.winner} wins`);
    ln('');
    ln('PLACEMENTS');
    dr.finale.placements.forEach((n, i) => ln(`  ${i + 1}. ${n}`));
    ln('');
    ln(`  ${dr.finale.winner} is crowned.`);
    return L.join('\n');
  }

  ln(`${w.challenge}: ${dr.challenge?.name || '—'}`);
  if (dr.mini) ln(`Mini challenge: ${dr.mini.name} — ${dr.mini.winner} wins ${dr.mini.buys}`);
  if (dr.judges?.length) ln(`On the panel: ${dr.judges.map(id => judgeById(id)?.name || id).join(', ')}`);
  if (dr.runway?.category) ln(`Runway category: ${dr.runway.category}`);

  // What the challenge actually did. Without this the maxi engine is invisible
  // — the readout would print a challenge name and a rank and nothing that
  // happened in between, which is not something anybody can check by reading.
  _textWerkRoom(dr, ln);
  _textAssignment(dr, ln);
  _textEvents(dr, ln);

  ln('');
  ln('PANEL RANK -> FINAL RANK');
  for (const b of dr.bend || []) {
    const moved = b.finalRank - b.panelRank;
    ln(`  ${String(b.panelRank).padStart(2)} -> ${String(b.finalRank).padStart(2)}  ${b.name}`
      + `${moved ? `  (${moved < 0 ? 'up' : 'down'} ${Math.abs(moved)})` : ''}`
      + `${dr.reactions?.[b.name] ? `  [${dr.reactions[b.name]}]` : ''}`);
  }
  ln('');
  const c = dr.call || {};
  if (c.win?.length) ln(`  Winner: ${c.win.join(' and ')}`);
  if (c.high?.length) ln(`  High: ${c.high.join(', ')}`);
  if (c.safe?.length) ln(`  Safe: ${c.safe.join(', ')}`);
  if (c.low?.length) ln(`  Low: ${c.low.join(', ')}`);
  if (c.bottom?.length) ln(`  Bottom two: ${c.bottom.join(' and ')}`);

  if (dr.lipsync) {
    const ls = dr.lipsync;
    ln('');
    ln(`LIP SYNC — "${ls.song}" by ${ls.artist}`);
    ln(`  ${ls.queens.map(n => `${n} ${ls.scores[n]}`).join('  ·  ')}`);
    ln(`  ${ls.call === 'double-shantay' ? 'Both stay.'
      : ls.call === 'double-sashay' ? 'Both go.' : `${ls.winner} stays.`}`);
  }

  if ((row.exits || []).length) {
    ln('');
    for (const x of row.exits) ln(`  ${x.name} — ${x.verb}.`);
  }
  ln('');
  ln(`  ${(dr.living || []).length} ${w.players} left: ${(dr.living || []).join(', ')}`);
  return L.join('\n');
}

/**
 * The Showroom, for every queen rather than the one the screen opens on.
 *
 * `js/vp-dr/relationships.js` draws a tab per queen and fills the panel from a
 * click handler, so the rendered HTML only ever contains the first. The room's
 * shape — who is close to whom, who cannot stand whom, who is somebody's drag
 * daughter — is the thing this show's werk room runs on, and a transcript that
 * cannot tell you any of it is missing the half that explains the votes.
 *
 * Bonds are symmetric, so each pair is stated from both sides deliberately:
 * this is read one queen at a time, and making the reader hold a table in
 * their head to answer "who likes her" is how you get a section nobody reads.
 */
function _textShowroom(dr, ln) {
  const living = dr.living || [];
  const bonds = dr.bonds || [];
  const families = dr.families || [];
  if (!living.length) return;

  ln('THE SHOWROOM');
  ln('-'.repeat('THE SHOWROOM'.length));

  // Family first: a drag mother is a fact about the pair, not a temperature.
  const famOf = {};
  for (const f of families) {
    for (const m of (f.members || [])) {
      const role = (f.roles && f.roles[m]) || 'family';
      const kin = (f.members || []).filter(x => x !== m);
      if (kin.length) (famOf[m] ||= []).push(`${role} to ${kin.join(', ')}`);
    }
  }

  let said = 0;
  for (const n of living) {
    const pairs = [];
    for (const [a, b, v] of bonds) {
      if (!v) continue;
      const other = a === n ? b : (b === n ? a : null);
      if (!other || !living.includes(other)) continue;
      pairs.push({ other, v });
    }
    const allies = pairs.filter(p => p.v > 0).sort((x, y) => y.v - x.v);
    const rivals = pairs.filter(p => p.v < 0).sort((x, y) => x.v - y.v);
    const fam = famOf[n] || [];
    if (!allies.length && !rivals.length && !fam.length) continue;

    said++;
    ln('');
    ln(`  ${n}`);
    if (allies.length) {
      ln(`    close to: ${allies.map(p => `${p.other} (+${p.v})`).join(', ')}`);
    }
    if (rivals.length) {
      ln(`    at odds with: ${rivals.map(p => `${p.other} (${p.v})`).join(', ')}`);
    }
    for (const line of fam) ln(`    ${line}`);
  }

  // A room where nobody has met anybody is a real state — the premiere — and
  // saying so is better than an empty heading.
  if (!said) ln('  Nobody has formed an opinion of anybody yet.');
  ln('');
}

// ══════════════════════════════════════════════════════════════════════
// The challenge's own working, in plain text
// ══════════════════════════════════════════════════════════════════════
//
// Provisional, like the rest of this file: Plan 3 turns all of it into prose.
// Until then it is the only way to READ what the maxi engine did, and reading
// the output is how every prose and balance bug in this project has been
// found. A screen that prints a challenge name and a final rank with nothing
// in between cannot be checked by anybody.

/**
 * The room, scene by scene.
 *
 * A scene with its lines written prints the prose. One still waiting on a
 * writer prints its NOTE in brackets, so a half-written pool reads as a
 * storyboard rather than as a blank — and so the gap is visible every time
 * somebody dumps a season instead of only when a test is run.
 */
function _textWerkRoom(dr, ln) {
  // Every narrated scene, not just the werk room: the stage, Untucked and the
  // challenge phases all emit prose now, and a readout that showed one pool
  // out of four would be lying about what the episode contains.
  // EVERY narrated kind. This filter is the third place a pool has been
  // written, generated correctly and shown to nobody because the readout did
  // not know its prefix — so it matches the whole family rather than a list
  // that has to be remembered.
  const werk = (dr.scenes || [])
    .filter(s => /^(werk|stage|untucked|chal|perform|maxi):/.test(String(s.kind || '')));
  if (!werk.length) return;
  const SLOT_NAME = {
    'cold-open': 'COLD OPEN', 'werk-morning': 'WERK ROOM — MORNING',
    'maxi-announce': 'THE ANNOUNCEMENT', mini: 'MINI CHALLENGE',
    choice: 'THE DIVISION', prep: 'WERK ROOM — WORKING',
    'maxi-pre': 'THE CHALLENGE', 'werk-elim-day': 'WERK ROOM — ELIMINATION DAY',
    'main-stage': 'MAIN STAGE', runway: 'THE RUNWAY', 'maxi-main': 'THE CHALLENGE',
    critiques: 'CRITIQUES', untucked: 'UNTUCKED', results: 'RESULTS',
    lipsync: 'LIP SYNC FOR YOUR LIFE', exit: 'THE EXIT',
  };
  let current = null;
  for (const sc of werk) {
    if (sc.step !== current) {
      current = sc.step;
      ln('');
      ln(SLOT_NAME[sc.step] || String(sc.step).toUpperCase());
    }
    const who = (sc.data?.players || []).join(' & ');
    if (sc.text) {
      ln(`  ${sc.text}`);
    } else {
      ln(`  [${who}] ${_note(sc) || sc.kind}`);
    }
  }
}

/** How the night was handed out: parts, teams, characters, materials. */
function _textAssignment(dr, ln) {
  const a = dr.assignment;
  const perf = dr.performances || {};
  if (!a) return;

  if (a.teams?.length > 1) {
    ln('');
    ln('TEAMS');
    a.teams.forEach((t, i) => ln(`  ${i + 1}. ${t.join(', ')}`));
  }

  // Only worth a block when the queens differ. A night where everybody is
  // 'standard' with no pick to report has nothing to say here.
  const rows = Object.keys(perf).map(n => {
    const d = perf[n].detail || {};
    const bits = [];
    if (perf[n].role && perf[n].role !== 'standard') bits.push(perf[n].role);
    if (d.part) bits.push(d.part);
    if (d.character) bits.push(`as ${d.character}`);
    if (d.talent) bits.push(d.talent);
    if (d.material) bits.push(d.material);
    if (d.partner) bits.push(`makes over ${d.partner}`);
    // `slotKind` is the ROAST's shape. The singing challenge has a slot with
    // no kind, and printing the field regardless rendered "slot 1 (undefined)"
    // for every queen — caught by the placeholder guard, not by reading.
    if (d.slot) {
      bits.push(`slot ${d.slot}`
        + (d.slotKind && d.slotKind !== 'middle' ? ` (${d.slotKind})` : ''));
    }
    if (d.live) bits.push('sings LIVE');
    if (typeof d.wins === 'number') bits.push(`${d.wins}W ${d.losses}L`);
    const pick = a.picks?.[n];
    if (pick?.penalty) {
      bits.push(`${pick.depth === 1 ? 'second choice' : `choice ${pick.depth + 1}`}, -${pick.penalty}`);
    }
    if (pick?.ducked) bits.push('ducked the lead');
    return bits.length ? `  ${n.padEnd(16)} ${bits.join(' · ')}` : null;
  }).filter(Boolean);

  if (rows.length) {
    ln('');
    ln('THE ASSIGNMENT');
    for (const r of rows) ln(r);
  }

  if (dr.challenge?.id === 'ball') {
    const any = Object.values(perf).find(p => p.detail?.looks);
    if (any) {
      ln('');
      ln(`THE BALL — ${any.detail.theme}`);
      for (const [n, p] of Object.entries(perf)) {
        const looks = (p.detail?.looks || [])
          .map(l => `${l.label} ${l.score}${l.sewn ? ' (sewn)' : ''}`).join('  ·  ');
        if (looks) ln(`  ${n.padEnd(16)} ${looks}`);
      }
    }
  }
}

/** Everything the werk room and the challenge did to the room. */
function _textEvents(dr, ln) {
  const evs = dr.events || [];
  if (!evs.length) return;
  ln('');
  ln('WHAT HAPPENED');
  for (const e of evs) {
    // The walkthrough fires for every queen every week by design; listing
    // thirteen of them would bury the events that are actually stories.
    if (e.type === 'walkthrough') continue;
    const who = (e.players || []).join(' & ');
    const pop = Object.entries(e.pop || {})
      .map(([n, d]) => `${n} ${d > 0 ? '+' : ''}${d}`).join(', ');
    ln(`  ${e.type.padEnd(22)} ${who}${pop ? `   [pop ${pop}]` : ''}`);
  }
  const walked = evs.filter(e => e.type === 'walkthrough');
  const took = walked.filter(e => e.data?.took).length;
  if (walked.length) {
    ln(`  ${'walkthrough'.padEnd(22)} ${took} of ${walked.length} took the host's note`);
  }
}
