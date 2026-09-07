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
  const werk = (dr.scenes || []).filter(s => String(s.kind || '').startsWith('werk:'));
  if (!werk.length) return;
  const SLOT_NAME = {
    'cold-open': 'COLD OPEN', 'werk-morning': 'WERK ROOM — MORNING',
    prep: 'WERK ROOM — WORKING', 'werk-elim-day': 'WERK ROOM — ELIMINATION DAY',
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
      ln(`  [${who}] ${sc.data?.note || sc.kind}`);
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
    if (d.slot) bits.push(`slot ${d.slot}${d.slotKind === 'middle' ? '' : ` (${d.slotKind})`}`);
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
