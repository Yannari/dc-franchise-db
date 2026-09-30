// ══════════════════════════════════════════════════════════════════════
// vp-ci/screens.js — a Circle episode on screen, until Plan 5 (Plan 4)
// ══════════════════════════════════════════════════════════════════════
//
// A readout, deliberately, the way Drag Race and Perfect Match shipped before
// their designed screens: every aired scene of the day becomes one screen,
// its lines as the transcript writes them (js/ci/transcript.js), so the
// screen and the text backlog can never say different things. Plan 5 replaces
// this with the approved stages (spec §18).
import { episodeScenes } from '../ci/transcript.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// A transcript line, dressed by what it is: a message on screen, a line said
// aloud, a stage direction, the host.
function lineHtml(line) {
  const t = line.replace(/^\s+/, '');
  if (t.startsWith('▸ ')) return `<div class="ci-msg">${esc(t.slice(2))}</div>`;
  if (t.startsWith('[') || t.startsWith('— ')) return `<div class="ci-stage">${esc(t.replace(/^\[|\]$/g, '').replace(/^— /, ''))}</div>`;
  return `<div class="ci-say">${esc(t)}</div>`;
}

export function circleVpScreens(row) {
  const scenes = episodeScenes(row);
  const head = `<div class="rp-eyebrow">Episode ${esc(row.num)} · Day ${esc(row.day)}</div>`;
  if (!scenes.length) {
    return [{ id: 'ci-empty', label: 'The day', html: `<div class="rp-page">${head}<div class="ci-stage">A quiet day in The Circle.</div></div>` }];
  }
  return scenes.map((s, i) => ({
    id: `ci-${s.id || i}`,
    label: s.title,
    html: `<div class="rp-page ci-page">${head}<div class="rp-title">${esc(s.title)}</div>`
      + s.blocks.map(b => `<div class="ci-block">${b.map(lineHtml).join('')}</div>`).join('')
      + '</div>',
  }));
}
