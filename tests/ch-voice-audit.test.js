// ══════════════════════════════════════════════════════════════════════
// ch-voice-audit.test.js — did the person who said it say it in their voice?
// ══════════════════════════════════════════════════════════════════════
//
// The honest metric (Total Drama's voice overhaul, 2026-10-09): of every line a
// cast member says on screen, how many came out in a variant for one of THEIR
// tags — not "how many lines have any variant". Then the work list: the turns
// that air most often without the speaker's voice, and which voices they miss.
//
//   npm run audit:ch-voice            (CH_VOICE_SEEDS=1,2,3 to choose; TOP=40)
// Validate on seeds you did not write against.
import { it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { voiceOf } from '../js/td/story/voice.js';
import { challengeCast } from './helpers/ch-cast.js';

const SEEDS = (process.env.CH_VOICE_SEEDS || '101,202,303,404').split(',').map(Number);
const TOP = Number(process.env.TOP) || 40;

it('measures voice coverage on aired lines', () => {
  let spoken = 0, hit = 0;
  const turns = {};
  const tagsInCast = {};
  for (const seed of SEEDS) {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed });
    airSeason(r.state);
    for (const n of names) for (const t of voiceOf(n).slice(0, 3)) tagsInCast[t] = (tagsInCast[t] || 0) + 1;
    const lines = [];
    for (const e of [...r.episodes, r.state.finalEp]) for (const a of e.aired || []) {
      if (a.script) lines.push(...a.script.lines);
      for (const c of a.ceremony || []) if (c.script) lines.push(...c.script.lines);
    }
    for (const l of lines) {
      if (l.kind === 'beat' || !l.by || l.by === 'TJ') continue;
      spoken++;
      if (l.voice) { hit++; continue; }
      const t = (turns[l.turn] ||= { aired: 0, missing: {} });
      t.aired++;
      const top = voiceOf(l.by)[0] || 'none';
      t.missing[top] = (t.missing[top] || 0) + 1;
    }
  }
  const out = [];
  out.push(`seeds ${SEEDS.join(',')}: ${spoken} spoken cast lines, ${hit} in the speaker's voice = ${(100 * hit / spoken).toFixed(1)}%`);
  out.push(`lead voices in these casts (top 3 tags each): ${Object.entries(tagsInCast).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  out.push(`turns airing most without the speaker's voice:`);
  for (const [id, t] of Object.entries(turns).sort((a, b) => b[1].aired - a[1].aired).slice(0, TOP)) {
    out.push(`  ${id.padEnd(12)} ${String(t.aired).padStart(4)}  ${Object.entries(t.missing).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  }
  console.log('\n' + out.join('\n'));
});
