// A played Perfect Match season, written out to read.
//
//     npm run pm:transcript              seed 7
//     PM_SEED=12 npm run pm:transcript   any other seed
//
// Writes transcripts/pm-season-<seed>.html (gitignored) and prints the path.
// It uses js/pm/transcript.js — the SAME renderer as the simulator's episode
// screens and text backlog — so what you read here is what the show shows.
import { it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';
import { DIALECTS } from '../js/pm/lines/dialect.js';
import { PM_TRANSCRIPT_CSS, PM_MOMENT_TITLE, episodeHeaderHtml, phasesOf, _sceneHtml } from '../js/pm/transcript.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Readable stand-ins for the synthetic cast (alternating f/m, as pm-cast makes them).
const F = ['Priya', 'Amber', 'Chloe', 'Jess', 'Mia', 'Tasha', 'Ellie', 'Nadia', 'Sophie', 'Leah', 'Keisha'];
const M = ['Theo', 'Jordan', 'Callum', 'Ryan', 'Marcus', 'Josh', 'Kai', 'Liam', 'Dan', 'Reece', 'Elliot'];
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

it('writes a season transcript', () => {
  const seed = Number(process.env.PM_SEED) || 7;
  const cast = makeIslanders(22, seed).map((p, i) => ({ ...p, name: (i % 2 === 0 ? F : M)[Math.floor(i / 2)] }));
  setPlayers(cast);
  const names = cast.map(p => p.name);
  // A mixed villa, so the dialects can be heard side by side. Casa Amor's
  // arrivals come from abroad, as they do on the show.
  const HOME = ['uk', 'us', 'scot', 'au', 'ie', 'essex', 'ca', 'geordie', 'nz', 'za', 'uk', 'us', 'uk', 'au', 'scot', 'uk'];
  const ABROAD = ['es', 'it', 'fr', 'br', 'de', 'es'];
  const setup = roleSetup(names);
  names.forEach((n, i) => { setup[n].dialect = setup[n].role === 'casa' ? ABROAD[i % ABROAD.length] : HOME[i % HOME.length]; });
  const { rows } = playPerfectMatchSeason({ cast: names, setup, seed });
  const castList = names.map(n => `${esc(n)} <span class="pm-sub">${DIALECTS[setup[n].dialect].label}</span>`).join(' · ');

  const eps = rows.map((r, i) => `<details${r.num === 1 ? ' open' : ''}><summary>Episode ${r.num} — ${
    esc(PM_MOMENT_TITLE[r.moment] || 'A day in the villa')} <span class="pm-sub">${r.pm.events.length} scenes</span></summary>
    ${episodeHeaderHtml(r, rows[i - 1] || null)}
    ${phasesOf(r).map(([, evs, label]) => `<h3>${esc(label)}</h3>${evs.map(_sceneHtml).join('')}`).join('')}
  </details>`).join('\n');

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Perfect Match — season ${seed}</title>
<style>
body{background:#fff8f5;margin:0}@media (prefers-color-scheme:dark){body{background:#1a1216}}
${PM_TRANSCRIPT_CSS}
.pm-tx details{border:1px solid var(--pm-line);border-radius:12px;margin:10px 0;padding:6px 16px}
.pm-tx summary{font:600 17px system-ui,sans-serif;cursor:pointer;padding:8px 0}
.pm-tx h1{font:600 28px system-ui,sans-serif;color:var(--pm-pink);margin:16px 0 4px}
.pm-tx h3{font:600 12px system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--pm-pink);margin:22px 0 6px}
</style></head><body><div class="pm-tx">
<h1>Perfect Match — season ${seed}</h1>
<p class="pm-sub">${castList}</p>
<p class="pm-sub">Synthetic cast, first names for reading. Faded scenes didn't air: the public never saw them, so they change nothing with the public.</p>
<p class="pm-sub"><b>How the public moves.</b> Every scene that airs gives each islander in it approval (▲ ▼). A bad look — starting a row, pulling someone who's taken, a two-faced beach hut, being caught out — costs approval; a good one earns it. At the end of each episode the approval is added up and capped, so nobody goes from loved to hated in one night unless something big happens. Approval decides the public vote.</p>
${eps}
</div></body></html>`;

  const out = resolve(ROOT, 'transcripts', `pm-season-${seed}.html`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  process.stdout.write(`\n  transcript: ${out}\n\n`);
});
