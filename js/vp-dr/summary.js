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
import { showWords } from '../shows.js';
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

export function rpBuildDragSummary(row) {
  const dr = row.dr || {};
  const w = showWords('drag-race');
  const bend = dr.bend || [];
  const call = dr.call || {};

  const head = `
    <div style="max-width:1100px;margin:0 auto;padding:16px;font-family:system-ui,sans-serif;color:#cdd6f4">
      <div style="border:1px dashed rgba(255,45,149,.5);border-radius:6px;padding:8px 12px;margin-bottom:14px;
                  background:rgba(255,45,149,.07);font-size:12px;line-height:1.5">
        <b style="color:#ff2d95">Engine readout — not the finished screen.</b>
        The viewing party proper is Plan 5. This shows what the engine decided,
        so a season can be read while it is being built.
      </div>
      <h2 style="margin:0 0 4px;font-size:20px">Episode ${esc(dr.ep ?? row.num)}</h2>
      <div style="color:#8b949e;font-size:13px;margin-bottom:14px">
        ${esc(dr.challenge?.name || '—')}
        ${dr.mini ? ` · mini: ${esc(dr.mini.name)} (won by ${esc(dr.mini.winner)})` : ''}
        ${dr.judges?.length ? ` · panel: ${esc(dr.judges.map(id => judgeById(id)?.name || id).join(', '))}` : ''}
      </div>`;

  if (dr.finale) {
    const f = dr.finale;
    return `${head}
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
  return `${head}
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
export function generateDragSummaryText(row) {
  const dr = row.dr || {};
  const w = showWords('drag-race');
  const L = [];
  const ln = s => L.push(s);

  ln(`DRAG RACE — EPISODE ${dr.ep ?? row.num}`);
  ln('='.repeat(46));
  ln('(Engine readout. The written episode is Plan 3.)');
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
