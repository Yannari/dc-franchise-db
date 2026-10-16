// ══════════════════════════════════════════════════════════════════════
// vp-ch/screens.js — a Challenge episode on screen, until the stepped viewer
// ══════════════════════════════════════════════════════════════════════
//
// A readout, the way The Circle, Drag Race and Perfect Match shipped before
// their designed screens, with lines as the transcript writes them
// (js/ch/transcript.js), so the screen and the text backlog can never say
// different things.
//
// Big Brother's shape (vp-screens.js, House Life): the big moments each get a
// screen (the daily, the house vote, the call-out, the Arena, the walk back
// in, a quit or a disqualification, the final's set pieces), and the social
// scenes between two of them are ONE screen, Villa Life, each scene a block in
// it (user, 2026-10-14: "social events should stay in 1 screen, important
// events have their screens"). A stretch also ends where the day does. The
// stepped viewer (js/vp-ch-ep/, sub-project 5) replaces this.
import { episodeScenes } from '../ch/transcript.js';

// The moments that are the episode's spine; everything else is villa life.
export const OWN_SCREEN = new Set(['previously', 'daily', 'ceremony', 'callout', 'volunteer', 'arena', 'return',
  'quit', 'medical', 'disqualified', 'instant-elimination', 'final-start', 'overnight', 'overnight-sabotage',
  'overnight-quit', 'final-pact-help', 'final-pact-broken', 'champions',
  // the final, taking its time: every checkpoint, the totals, the goodbyes (ch/final.js)
  'final-cp', 'final-podium', 'final-congrats', 'final-lastword', 'overnight-talk']);

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function lineHtml(l) {
  if (l.kind === 'beat') return `<div class="ch-stage">${esc(l.text)}</div>`;
  if (l.kind === 'conf') return `<div class="ch-conf"><b>${esc(l.by)}</b> <span class="ch-tag">confessional</span> ${esc(l.text)}</div>`;
  const host = l.by === 'TJ' ? ' ch-host' : '';
  return `<div class="ch-say${host}"><b>${esc(l.by)}</b> ${esc(l.text)}</div>`;
}

/** The episode's screens as groups: a big moment alone, or a stretch of villa life. */
export function screenGroups(row) {
  const groups = [];
  for (const s of episodeScenes(row)) {
    const last = groups[groups.length - 1];
    if (!OWN_SCREEN.has(s.kind) && last?.life && last.section === s.section && last.day === s.day) { last.scenes.push(s); continue; }
    groups.push({ life: !OWN_SCREEN.has(s.kind), section: s.section, day: s.day, scenes: [s] });
  }
  return groups;
}

export function challengeVpScreens(row) {
  const groups = screenGroups(row);
  const week = row?.ch?.final ? 'The final' : row?.ch?.division === 'm' ? "Men's week" : row?.ch?.division === 'f' ? "Women's week" : 'Episode';
  const head = d => `<div class="rp-eyebrow">Episode ${esc(row.num)} · ${week}${d != null ? ` · Day ${esc(d)}` : ''}</div>`;
  if (!groups.length) {
    return [{ id: 'ch-daily-empty', label: 'The episode', html: `<div class="rp-page ch-page">${head(row?.day)}<div class="ch-stage">Nothing aired this episode.</div></div>` }];
  }
  return groups.map((g, i) => {
    if (!g.life) {
      const s = g.scenes[0];
      return { id: `ch-${g.section}-${i}`, label: s.title,
        html: `<div class="rp-page ch-page">${head(s.day)}<div class="rp-title">${esc(s.title)}${s.place ? ` <span class="ch-place">${esc(s.place)}</span>` : ''}</div>`
          + `<div class="ch-block">${s.lines.map(lineHtml).join('')}</div></div>` };
    }
    return { id: `ch-${g.section}-${i}`, label: 'Villa Life',
      html: `<div class="rp-page ch-page">${head(g.day)}<div class="rp-title">Villa Life</div>`
        + g.scenes.map(s => `<div class="ch-block ch-life"><div class="ch-life-head">${esc(s.title)}${s.place ? ` <span class="ch-place">${esc(s.place)}</span>` : ''}</div>`
          + s.lines.map(lineHtml).join('') + '</div>').join('')
        + '</div>' };
  });
}
