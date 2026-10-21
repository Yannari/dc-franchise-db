// The voting chart: who wrote whose name, every episode, on one grid.
//
// It used to be its own page and its own nav tab (voting-analytics.html), with
// seasons 1-9 typed into the HTML by hand and 10+ built from each season's
// votingHistory. The user, 2026-10-21: move it off the nav and into the
// season's Vote History tab — and only Total Drama has one, because only Total
// Drama's record holds ballot-by-ballot votes.
//
// Seasons 1-9 come from data/vote-charts.json (the hand-written tables, moved
// out of the page with their finale columns intact); a later season is built
// from its own `votingHistory`. Pure: returns HTML, reads nothing.

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const same = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

/**
 * Who won, plural. A season can end with several (season 8 has two players on
 * placement 1; The Traitors splits the pot), and the singular `winner` field is
 * then null. Never "whoever placements happens to list first".
 */
export function winnersOf(placements, data) {
  const winners = placements.filter(p => p.placement === 1).map(p => p.name);
  const winner = (winners.length ? winners : [data?.winner?.name].filter(Boolean))
    .join(' & ');
  return { winners, winner };
}

/** The chart for one season as { callout, head: [[cell]], rows: [{c, cells}] }, or null. */
export function chartFor(seasonNumber, data, staticCharts = null) {
  const fixed = staticCharts?.seasons?.[String(seasonNumber)];
  if (fixed) return fixed;
  const vh = Array.isArray(data?.votingHistory) ? data.votingHistory : [];
  if (!vh.length) return null;
  const placements = [...(data.placements || [])].sort((a, b) => (a.placement || 99) - (b.placement || 99));
  const eps = [...vh].sort((a, b) => (a.episode || 0) - (b.episode || 0));
  const { winners, winner } = winnersOf(placements, data);
  return {
    callout: `${data.castSize || placements.length} players • ${eps.length} voting episodes • `
      + `Winner${winners.length > 1 ? 's' : ''}: ${winner}`,
    head: [
      [{ t: 'Rank', c: 'rank-col', rs: 2 }, { t: 'Castaway', c: 'player-name', rs: 2 },
        ...eps.map(e => ({ t: `Episode ${e.episode}` }))],
      eps.map(e => ({ t: e.eliminated || 'N/A', c: 'eliminated' })),
    ],
    rows: placements.map(p => ({
      c: p.placement === 1 ? 'winner-row' : '',
      cells: [{ t: String(p.placement ?? ''), c: 'rank-col' }, { t: p.name, c: 'player-name' },
        ...eps.map(e => ({ t: (e.votes || []).find(v => same(v.voter, p.name))?.target || '—' }))],
    })),
  };
}

/**
 * The grid as HTML. A vote cast for the person who went home that night is
 * marked, so a column reads as the majority and its holdouts at a glance; a
 * castaway's name opens their page when the season knows their slug.
 */
export function voteChartHtml(chart, { slugOf = () => null } = {}) {
  if (!chart) return '';
  const top = chart.head[0] || [];
  const elim = chart.head[1] || [];
  // The second header row starts after the two rowspan columns.
  const lead = top.filter(c => c.rs === 2).length;
  const bootAt = i => elim[i - lead]?.t;
  const th = c => `<th${c.c ? ` class="${esc(c.c)}"` : ''}${c.rs ? ` rowspan="${c.rs}"` : ''}>${esc(c.t)}</th>`;
  const row = r => `<tr${r.c ? ` class="${esc(r.c)}"` : ''}>${r.cells.map((c, i) => {
    if (c.c === 'player-name') {
      const slug = slugOf(c.t);
      return `<td class="player-name">${slug ? `<a href="player.html?player=${encodeURIComponent(slug)}">${esc(c.t)}</a>` : esc(c.t)}</td>`;
    }
    if (c.c) return `<td class="${esc(c.c)}">${esc(c.t)}</td>`;
    const boot = bootAt(i);
    const hit = c.t && c.t !== '—' && boot && same(boot.replace(/:.*/, ''), c.t);
    return `<td${hit ? ' class="hit"' : ''}>${esc(c.t)}</td>`;
  }).join('')}</tr>`;
  return `<div class="vc">
    ${chart.callout ? `<div class="vc-callout">${esc(chart.callout)}</div>` : ''}
    <div class="vc-hint">Scroll sideways for every episode${elim.some(c => /finale|winner/.test(c.c || '')) ? ' and the finale' : ''} ·
      <span class="vc-key hit">voted for who left</span></div>
    <div class="vc-wrap"><table class="vc-table">
      <thead>${chart.head.map(r => `<tr>${r.map(th).join('')}</tr>`).join('')}</thead>
      <tbody>${chart.rows.map(row).join('')}</tbody>
    </table></div>
  </div>`;
}
