// ══════════════════════════════════════════════════════════════════════
// td/story/director-debug.js — the Debug screen's Director tab
// ══════════════════════════════════════════════════════════════════════
// Every scene a camp's systems proposed for the episode, and why it aired or didn't (director.js selectScenes; the
// log is ep.tdDirectorLog[camp][phase], one compact string a proposal: "+reason|source|tier|kind|who|spoken turns").
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const REASON = {
  must: 'always airs', due: 'a payoff that is due', story: 'the day\'s story', colour: 'colour, with room', room: 'room left over',
  'same-scene': 'the same scene already airs today', claimed: 'that person\'s bit, or that pair\'s payoff, already airs today',
  budget: 'no room left in the day', deferred: 'no room even for a payoff (still due, uncommitted)',
  'dialogue-budget': 'the day already has enough talk', 'deferred-dialogue': 'too much talk today (still due, uncommitted)',
};

/** One row of the log, parsed. */
export function parseDirectorRow(s) {
  const [head, src, tier, kind, who, turns] = String(s).split('|');
  return { aired: head[0] === '+', reason: head.slice(1), src, tier: tier.replace(/\+$/, ''), extra: /\+$/.test(tier), kind, who: who ? who.split(',') : [], turns: +turns || 0 };
}

export function directorLogHtml(log) {
  if (!log || !Object.keys(log).length) return '<div style="color:#8b949e">No director log on this episode (it was played before the shared budget).</div>';
  let html = '';
  for (const [camp, day] of Object.entries(log)) {
    const rows = ['pre', 'post'].flatMap(ph => (day[ph] || []).map(s => ({ ph, ...parseDirectorRow(s) })));
    const aired = rows.filter(r => r.aired), dropped = rows.filter(r => !r.aired);
    const turns = aired.reduce((t, r) => t + r.turns, 0);
    html += `<div style="margin-bottom:16px;padding:10px;background:rgba(87,166,232,0.06);border:1px solid rgba(87,166,232,0.18);border-radius:8px">
      <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#57a6e8;margin-bottom:6px">${esc(camp).toUpperCase()} · ${aired.length} AIRED OF ${rows.length} PROPOSED · ${turns} SPOKEN TURNS</div>
      <div style="font-size:10px;color:#8b949e;margin-bottom:8px">Before the late passes (somebody nobody heard from, a defence's setup, the moments that always air), which can add a few.</div>`;
    for (const ph of ['pre', 'post']) {
      const list = rows.filter(r => r.ph === ph);
      if (!list.length) continue;
      html += `<div style="font-size:10px;font-weight:800;letter-spacing:1px;color:#c9d1d9;margin:8px 0 4px">${ph === 'pre' ? 'MORNING' : 'AFTER THE CHALLENGE'}</div>`;
      for (const r of list) {
        const col = r.aired ? '#3fb950' : /^deferred/.test(r.reason) ? '#d29922' : '#f85149';
        html += `<div style="display:flex;gap:8px;font-size:10px;padding:2px 0;border-left:3px solid ${col};padding-left:6px;margin-bottom:2px;opacity:${r.aired ? 1 : 0.75}">
          <span style="min-width:74px;color:${col}">${r.aired ? 'AIRED' : 'DROPPED'}</span>
          <span style="min-width:150px;color:#c9d1d9">${esc(r.kind)}</span>
          <span style="min-width:120px;color:#8b949e">${esc(r.src)} · ${esc(r.tier)}${r.extra ? ' (extra)' : ''}</span>
          <span style="min-width:150px;color:#c9d1d9">${esc(r.who.join(', '))}</span>
          <span style="min-width:40px;color:#8b949e">${r.turns}t</span>
          <span style="flex:1;color:#8b949e">${esc(REASON[r.reason] || r.reason)}</span></div>`;
      }
    }
    if (dropped.length) {
      const by = {};
      for (const r of dropped) by[r.reason] = (by[r.reason] || 0) + 1;
      html += `<div style="font-size:10px;color:#8b949e;margin-top:6px">Dropped: ${Object.entries(by).map(([k, v]) => `${v} ${esc(REASON[k] || k)}`).join(' · ')}</div>`;
    }
    html += '</div>';
  }
  return html;
}
