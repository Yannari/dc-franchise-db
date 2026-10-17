// A whole season of The Challenge as it airs, written to a file to READ
// (manual §16.1: the single most productive tool on a show).
//   CH_SEED=n npm run ch:transcript   → transcripts/ch-season-<seed>.txt
import { it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeCast } from './helpers/ch-cast.js';

const SPOT = { villa: 'The villa', kitchen: 'Kitchen', gym: 'Gym', 'hot-tub': 'Hot tub', bedroom: 'Bedroom', beach: 'Beach',
  pool: 'Pool deck', confessional: 'Confessional', arena: 'The Arena', final: 'The final', party: 'Night out',
  private: 'Somewhere quiet', public: 'The villa', challenge: 'The daily', deliberation: 'Deliberation' };

it('writes a season to read', () => {
  const seed = Number(process.env.CH_SEED) || 1;
  const { cast, names, background } = challengeCast(24, seed);
  // CH_PAIRS=rivals|ties|fresh-meat|pick plays a Pairs season (CH_SHAPE=same for men's and women's pairs)
  const pairing = process.env.CH_PAIRS || null;
  if (pairing === 'fresh-meat') {
    const m = names.filter(n => background[n].gender === 'm'), f = names.filter(n => background[n].gender === 'f');
    for (const [i, n] of m.entries()) background[n].rookie = i < 6;
    for (const [i, n] of f.entries()) background[n].rookie = i >= 6;
  }
  setPlayers(cast);
  const r = playChallengeSeason({ cast: names, background, seed, options: pairing ? { pairs: { pairing, shape: process.env.CH_SHAPE || 'mixed' } } : {} });
  airSeason(r.state);
  const out = [];
  const missing = {};
  for (const e of [...r.episodes, r.state.finalEp]) {
    out.push(`\n==================== EPISODE ${e.ep}${e.final ? ' — THE FINAL' : e.division === 'all' ? '' : ` — ${e.division === 'm' ? "men's" : "women's"} week` } ====================`);
    let day = null, n = 0;
    for (const a of e.aired || []) {
      if (a.day !== day) { day = a.day; out.push(`\n— Day ${day} —`); }
      if (a.kind === 'previously') { out.push(`\n-- PREVIOUSLY ON THE CHALLENGE`); out.push(a.script.text); continue; }
      if (a.kind === 'ceremony') {
        out.push(`\n-- ${++n}. THE VOTE [Deliberation]`);
        for (const c of a.ceremony) out.push(c.script ? c.script.text : `   (${c.kind}: ${c.voter} -> ${c.target}, ${c.why} — no lines yet)`);
        continue;
      }
      out.push(`\n-- ${++n}. ${a.kind} [${SPOT[a.scene.spot] || a.scene.spot || '?'}] (${a.scene.who.slice(0, 4).join(', ')})`);
      if (a.script) out.push(a.script.text);
      else { out.push('   (no lines yet)'); missing[a.kind] = (missing[a.kind] || 0) + 1; }
    }
  }
  out.push(`\nCHAMPIONS: ${r.champions.join(' & ')}`);
  // The season's stories: every storyline with three or more chapters on screen, chapter by chapter.
  out.push('\nSTORYLINES ON SCREEN (3+ aired chapters):');
  for (const l of (r.state.story?.lines || []).filter(l => !['life', 'spine'].includes(l.type))) {
    const aired = l.steps.filter(s => s.aired);
    if (aired.length < 3) continue;
    out.push(`  ${l.type} ${l.key} [${l.status}]: ${aired.map(s => `ep${s.ep} ${s.step}${s.outcome !== 'any' ? '/' + s.outcome : ''}`).join(' → ')}`);
  }
  out.push(`\nNo lines yet: ${Object.entries(missing).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  mkdirSync('transcripts', { recursive: true });
  writeFileSync(`transcripts/ch-season-${pairing ? pairing + "-" : ""}${seed}.txt`, out.join('\n'));
});
