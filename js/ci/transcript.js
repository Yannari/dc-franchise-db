// ══════════════════════════════════════════════════════════════════════
// ci/transcript.js — a season, readable top to bottom
// ══════════════════════════════════════════════════════════════════════
//
// The main quality tool (ADDING-A-SHOW §16.1): every aired scene, both layers
// of every message — what the player says out loud and what arrives on the
// screen — every reaction, and the host. The first message of a block is
// shown dictated, as the real edit does; later ones show only the screen.
import { peopleOf } from './state.js';
import { hostName } from './script.js';

const TITLES = {
  profiles: 'Setting up the profiles', recognise: 'A face they know', status: 'Status update',
  likes: 'The Newsfeed', chat: 'Private chat', 'circle-chat': 'Circle Chat', arrival: 'A new Player',
  'after-party': 'The after-party', ratings: 'The Ratings', hangout: 'The Hangout',
  blocking: 'The blocking', visit: 'The visit', report: 'What the visit "said"', goodbye: 'The goodbye video',
  'final-ratings': 'The final ratings', meet: 'The finalists meet', reveal: 'The winner',
};

const realName = (state, h) => peopleOf(state, h).join(' and ');

export function speakerLabel(state, h) {
  if (h === 'host') return hostName().toUpperCase();
  const p = state.profiles[h];
  if (!p) return String(h).toUpperCase();
  const real = realName(state, h).toUpperCase();
  const shown = p.shown?.name;
  return shown && shown.toUpperCase() !== real ? `${real} (as ${shown})` : real;
}

const shownName = (state, h) => (state.profiles[h]?.shown?.name || realName(state, h)).toUpperCase();

export function blockText(state, block) {
  const out = [];
  let dictated = false;
  for (const l of block.lines) {
    const who = speakerLabel(state, l.who);
    if (l.kind === 'stage') out.push(`  [${l.text}]`);
    else if (l.kind === 'say') out.push(`  ${who}, aloud: "${l.text}"`);
    else if (l.kind === 'video') out.push(`  ${who} (on video): "${l.text}"`);
    else if (l.kind === 'react') out.push(`  ${who}: "${l.text}"`);
    else if (l.kind === 'host') out.push(`  ${hostName().toUpperCase()}: ${l.text}`);
    else if (l.kind === 'send') {
      if (!dictated) { out.push(`  ${who} dictates: ${l.spoken}`); dictated = true; }
      out.push(`      ▸ ${shownName(state, l.who)}: ${l.text}`);
    }
  }
  if (block.beat) out.push(`  — ${block.beat}`);
  return out;
}

export function dayText(state, row) {
  const out = [`═══ Day ${row.day} — ${row.slot} ═══`, ''];
  for (const s of row.ci.aired || []) {
    if (!s.script?.blocks?.length) continue;
    out.push(`── ${TITLES[s.kind] || s.kind}`);
    for (const b of s.script.blocks) out.push(...blockText(state, b), '');
  }
  return out.join('\n');
}

export function castText(state) {
  return Object.values(state.profiles).map(p => {
    const real = realName(state, p.handle);
    if (p.mode === 'catfish') return `  ${real} — playing as ${p.shown.name}, ${p.shown.age} (catfish, ${p.reason || 'no reason given'})`;
    if (p.mode === 'shared') return `  ${real} — sharing one profile as ${p.shown.name}`;
    if (p.mode === 'edited') return `  ${real} — as themselves, but edited (${p.edits.join(', ')})`;
    return `  ${real} — as themselves (${p.mode})`;
  }).join('\n');
}

export function seasonText(state, rows, result = null) {
  const parts = ['THE CIRCLE — a season', '', 'The players:', castText(state), ''];
  for (const r of rows) parts.push(dayText(state, r), '');
  if (result) {
    parts.push('Final placements:');
    for (const p of result.placements) parts.push(`  ${p.place}. ${speakerLabel(state, p.profile)} — ${p.avg}`);
    parts.push(`Fan Favorite: ${result.fanFavorite}`);
  }
  return parts.join('\n');
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function seasonHtml(state, rows, result = null) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>The Circle — transcript</title>
<style>body{background:#0b0e24;color:#e8ecff;font:15px/1.55 Georgia,serif;max-width:900px;margin:24px auto;padding:0 16px}
pre{white-space:pre-wrap;font:inherit}</style></head><body><pre>${esc(seasonText(state, rows, result))}</pre></body></html>`;
}
