// ══════════════════════════════════════════════════════════════════════
// dr/badges.js — the pills on an episode card
// ══════════════════════════════════════════════════════════════════════
//
// Every badge reads the RECORD, never live state, so a card drawn for episode
// four says what episode four was. `when` is given the stored row and must
// tolerate any shape of it — an older save, a finale with no call, a night
// where the lip sync never happened — because a badge that throws takes the
// whole episode list down with it.
//
// These are the show's headlines, not a summary: a viewer scanning the season
// should be able to see where the wins, the shocks and the robberies were.
export const DR_BADGES = [
  {
    id: 'win', text: 'Win', color: '#f2c14e',
    when: r => !!(r?.dr?.call?.win?.length),
  },
  {
    id: 'double-shantay', text: 'Double shantay', color: '#4ade80',
    when: r => r?.dr?.lipsync?.call === 'double-shantay',
  },
  {
    id: 'double-sashay', text: 'Double sashay', color: '#f85149',
    when: r => r?.dr?.lipsync?.call === 'double-sashay',
  },
  {
    id: 'moment', text: 'Moment', color: '#c084fc',
    when: r => Object.values(r?.dr?.performances || {}).some(p => p?.moment),
  },
  {
    id: 'split-panel', text: 'Split panel', color: '#60a5fa',
    when: r => !!r?.dr?.panel?.split,
  },
  {
    // The host moved somebody two places or more against the panel. This is
    // the badge the format exists for: it marks the nights a viewer would
    // argue about.
    id: 'robbed', text: 'Robbed', color: '#fb923c',
    when: r => (r?.dr?.bend || []).some(b => b.finalRank - b.panelRank >= 2),
  },
  {
    id: 'finale', text: 'Finale', color: '#ff2d95',
    when: r => !!r?.dr?.finale,
  },
];

export function dragBadges(row) {
  const pill = (text, color) =>
    `<span class="ep-hist-tag" style="background:${color}22;color:${color}">${text}</span>`;
  let out = '';
  for (const b of DR_BADGES) {
    let on = false;
    // A badge must never be able to break the episode list.
    try { on = !!b.when(row); } catch { on = false; }
    if (on) out += pill(b.text, b.color);
  }
  return out;
}
