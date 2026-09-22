// A played Perfect Match season, written out to read.
//
//     npm run pm:transcript              seed 7
//     PM_SEED=12 npm run pm:transcript   any other seed
//
// Writes transcripts/pm-season-<seed>.html (gitignored) and prints the path.
// There are no Perfect Match screens yet (Plan 5); this is how to read what
// the villa actually said. Every scene is shown, aired or not — the reader
// sees what the public didn't.
import { it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';
import { DIALECTS } from '../js/pm/lines/dialect.js';
import { SCENE_GAIN } from '../js/pm/ledger.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Readable stand-ins for the synthetic cast (alternating f/m, as pm-cast makes them).
const F = ['Priya', 'Amber', 'Chloe', 'Jess', 'Mia', 'Tasha', 'Ellie', 'Nadia', 'Sophie', 'Leah', 'Keisha'];
const M = ['Theo', 'Jordan', 'Callum', 'Ryan', 'Marcus', 'Josh', 'Kai', 'Liam', 'Dan', 'Reece', 'Elliot'];

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const TITLE = { 'first-coupling': 'The first coupling', bombshell: 'A bombshell arrives', recoupling: 'Recoupling',
  'public-vote': 'Public vote', 'casa-open': 'Casa Amor opens', 'casa-nights': 'Casa Amor', 'stick-or-twist': 'Stick or twist',
  photos: 'The photos', 'semi-final': 'Semi-final', final: 'The final', reunion: 'Reunion' };

function scene(e) {
  const s = e.script;
  const lines = [
    s.stage ? `<p class="stage">${esc(s.stage)}</p>` : '',
    ...s.lines.map(l => `<p class="line"><b>${esc(l.who)}:</b> “${esc(l.text)}”</p>`),
    s.beat ? `<p class="beat">${esc(s.beat)}</p>` : '',
  ].join('');
  const hut = e.hut ? `<div class="hut ${e.hut.stance}"><span class="tag">beach hut · ${esc(e.hut.stance)}</span>${
    e.hut.script.lines.map(l => `<p><b>${esc(l.who)}:</b> “${esc(l.text)}”</p>`).join('')}</div>` : '';
  const aired = e.aired ? '' : '<span class="tag unaired">didn\'t air</span>';
  // What the public made of it. Only an aired scene counts; these numbers are
  // before the episode's caps (spec §8), which the episode header shows after.
  const moves = Object.entries(e.pop || {}).map(([who, p]) => {
    const ap = Math.round((p.approval || 0) * SCENE_GAIN * 10) / 10;
    const cls = ap > 0 ? 'up' : ap < 0 ? 'down' : 'flat';
    return `<span class="${cls}">${esc(who)} ${ap > 0 ? '▲ +' + ap : ap < 0 ? '▼ ' + ap : '±0'}</span>`
      + (p.fame ? ` <span class="air">airtime +${Math.round(p.fame * 10) / 10}</span>` : '');
  }).join(' · ');
  const pop = e.aired
    ? (moves ? `<div class="pop">public: ${moves}${e.major?.length ? ' <span class="major">major moment</span>' : ''}</div>` : '')
    : '<div class="pop">not seen by the public: no effect</div>';
  return `<div class="scene${e.aired ? '' : ' hidden'}"><div class="meta">${esc(e.kind)} ${aired}<span class="id">${esc(s.id)}</span></div>${lines}${hut}${pop}</div>`;
}

it('writes a season transcript', () => {
  const seed = Number(process.env.PM_SEED) || 7;
  const cast = makeIslanders(22, seed).map((p, i) => ({ ...p, name: (i % 2 === 0 ? F : M)[Math.floor(i / 2)] }));
  setPlayers(cast);
  const names = cast.map(p => p.name);
  // A mixed villa, so the dialects can be heard side by side (cast setup's
  // "where they're from"; blank would take the season default, UK).
  // Casa Amor's arrivals come from abroad, as they do on the show.
  const HOME = ['uk', 'us', 'scot', 'au', 'ie', 'essex', 'ca', 'geordie', 'nz', 'za', 'uk', 'us', 'uk', 'au', 'scot', 'uk'];
  const ABROAD = ['es', 'it', 'fr', 'br', 'de', 'es'];
  const setup = roleSetup(names);
  names.forEach((n, i) => { setup[n].dialect = setup[n].role === 'casa' ? ABROAD[i % ABROAD.length] : HOME[i % HOME.length]; });
  const { rows } = playPerfectMatchSeason({ cast: names, setup, seed });
  const castList = names.map(n => `${esc(n)} <span class="from">${DIALECTS[setup[n].dialect].label}</span>`).join(' · ');

  const eps = rows.map((r, i) => {
    // Who rose and fell with the public this episode, after the caps.
    const before = i ? rows[i - 1].pm.approval || {} : {};
    const after = r.pm.approval || {};
    const labelsBefore = i ? rows[i - 1].pm.labels || {} : {};
    const shifts = Object.keys(after).map(n => [n, Math.round((after[n] - (before[n] || 0)) * 10) / 10])
      .filter(([, d]) => d).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 8);
    const labelMoves = Object.entries(r.pm.labels || {}).filter(([n, l]) => labelsBefore[n] && labelsBefore[n] !== l)
      .map(([n, l]) => `${esc(n)}: ${esc(labelsBefore[n])} → <b>${esc(l)}</b>`);
    const publicLine = shifts.length ? `<p class="public"><b>With the public:</b> ${shifts.map(([n, d]) =>
      `<span class="${d > 0 ? 'up' : 'down'}">${esc(n)} ${d > 0 ? '+' : ''}${d}</span>`).join(' · ')}${
      labelMoves.length ? `<br><b>Now seen as:</b> ${labelMoves.join(' · ')}` : ''}</p>` : '';
    const byPhase = [];
    for (const e of r.pm.events) {
      if (!byPhase.length || byPhase[byPhase.length - 1][0] !== e.phase) byPhase.push([e.phase, []]);
      byPhase[byPhase.length - 1][1].push(e);
    }
    const couples = r.pm.couples.map(c => c.join(' & ')).join(' · ');
    const exits = r.exits.map(x => `${x.name} (${x.verb})`).join(', ');
    return `<details${r.num === 1 ? ' open' : ''}><summary>Episode ${r.num} — ${esc(TITLE[r.moment] || r.moment || 'Villa day')}
      <span class="count">${r.pm.events.length} scenes</span></summary>
      <p class="couples"><b>Couples:</b> ${esc(couples) || '—'}${exits ? `<br><b>Left:</b> ${esc(exits)}` : ''}</p>
      ${publicLine}
      ${byPhase.map(([ph, evs]) => `<h3>${esc(ph)}</h3>${evs.map(scene).join('')}`).join('')}
    </details>`;
  }).join('\n');

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Perfect Match — season ${seed}</title>
<style>
:root{--bg:#fff8f5;--ink:#2b1d24;--soft:#7a6470;--card:#ffffff;--line:#f0dde4;--pink:#e0467c;--hut:#fff1d6;--hut2:#ffe0e0}
@media (prefers-color-scheme:dark){:root{--bg:#1a1216;--ink:#f6e9ee;--soft:#b39aa6;--card:#241a1f;--line:#3a2a31;--pink:#ff6f9f;--hut:#3a3020;--hut2:#3d2226}}
body{background:var(--bg);color:var(--ink);font:16px/1.55 Georgia,serif;max-width:760px;margin:0 auto;padding:24px 16px 80px}
h1{font:600 28px system-ui,sans-serif;color:var(--pink);margin:0 0 4px}.sub{color:var(--soft);margin:0 0 20px;font-family:system-ui,sans-serif;font-size:14px}
details{background:var(--card);border:1px solid var(--line);border-radius:12px;margin:10px 0;padding:6px 16px}
summary{font:600 17px system-ui,sans-serif;cursor:pointer;padding:8px 0}.count{color:var(--soft);font-weight:400;font-size:13px;margin-left:8px}
h3{font:600 12px system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--pink);margin:22px 0 6px}
.couples{font:14px system-ui,sans-serif;color:var(--soft)}
.cast{font:14px/1.9 system-ui,sans-serif;margin:0 0 8px}.from{color:var(--soft);font-size:12px}
.pop,.public{font:12px system-ui,sans-serif;color:var(--soft);margin:6px 0 0}.public{font-size:13px;margin:4px 0 10px}
.up{color:#1f9d55}.down{color:#d64545}.flat{color:var(--soft)}.air{opacity:.8}
.major{background:var(--pink);color:#fff;border-radius:4px;padding:0 5px;margin-left:4px}
.scene{border-top:1px solid var(--line);padding:10px 0}.scene.hidden{opacity:.6}
.meta{font:12px system-ui,sans-serif;color:var(--soft);margin-bottom:4px}.id{float:right;opacity:.6}
.stage,.beat{font-style:italic;color:var(--soft);margin:4px 0}.line{margin:3px 0}
.hut{background:var(--hut);border-radius:8px;padding:6px 10px;margin:8px 0 2px 18px;font-size:15px}.hut.two-faced{background:var(--hut2)}
.hut p{margin:2px 0}.tag{font:11px system-ui,sans-serif;color:var(--soft);display:block}.tag.unaired{display:inline;color:var(--pink);margin-left:6px}
</style></head><body>
<h1>Perfect Match — season ${seed}</h1>
<p class="cast">${castList}</p>
<p class="sub">Synthetic cast, first names for reading. Faded scenes didn't air: the public never saw them, so they change nothing with the public. The id on the right is the script that was used.</p>
<p class="sub"><b>How the public moves.</b> Every scene that airs gives each islander in it approval (▲ ▼) and airtime. A bad look — starting a row, pulling someone who's taken, a two-faced beach hut, being caught out — costs approval; a good one — turning a pull down, making the villa laugh, being the one who got lied to — earns it. Airtime only goes up. At the end of each episode an islander's approval is added up and capped: 12 in a normal week, 24 in their first, 35 when a major moment lifts the cap. So nobody goes from loved to hated in one night unless something big happens. Approval decides the public vote; airtime becomes followers.</p>
${eps}
</body></html>`;

  const out = resolve(ROOT, 'transcripts', `pm-season-${seed}.html`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  process.stdout.write(`\n  transcript: ${out}\n\n`);
});
