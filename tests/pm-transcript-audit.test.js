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
  return `<div class="scene${e.aired ? '' : ' hidden'}"><div class="meta">${esc(e.kind)} ${aired}<span class="id">${esc(s.id)}</span></div>${lines}${hut}</div>`;
}

it('writes a season transcript', () => {
  const seed = Number(process.env.PM_SEED) || 7;
  const cast = makeIslanders(22, seed).map((p, i) => ({ ...p, name: (i % 2 === 0 ? F : M)[Math.floor(i / 2)] }));
  setPlayers(cast);
  const names = cast.map(p => p.name);
  const { rows } = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed });

  const eps = rows.map(r => {
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
.scene{border-top:1px solid var(--line);padding:10px 0}.scene.hidden{opacity:.6}
.meta{font:12px system-ui,sans-serif;color:var(--soft);margin-bottom:4px}.id{float:right;opacity:.6}
.stage,.beat{font-style:italic;color:var(--soft);margin:4px 0}.line{margin:3px 0}
.hut{background:var(--hut);border-radius:8px;padding:6px 10px;margin:8px 0 2px 18px;font-size:15px}.hut.two-faced{background:var(--hut2)}
.hut p{margin:2px 0}.tag{font:11px system-ui,sans-serif;color:var(--soft);display:block}.tag.unaired{display:inline;color:var(--pink);margin-left:6px}
</style></head><body>
<h1>Perfect Match — season ${seed}</h1>
<p class="sub">Synthetic cast, first names for reading. Faded scenes didn't air: the public never saw them. The id on the right is the script that was used.</p>
${eps}
</body></html>`;

  const out = resolve(ROOT, 'transcripts', `pm-season-${seed}.html`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  process.stdout.write(`\n  transcript: ${out}\n\n`);
});
