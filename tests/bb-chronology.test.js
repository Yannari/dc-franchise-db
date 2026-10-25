// The week's chronology, held: what an aired house scene says has to be true at the point of the week it airs.
// The user, 2026-10-24: "I'm scared of the Block Buster... if I lose it, it's my fault" from somebody who had just
// won the veto (and would take themselves off at the meeting): "can u audit and fix the chronology of big brother
// simulator please". The audit played fourteen seasons and checked 6,000 scenes against the week's state, step by
// step (who is HOH, who is on the block now, who holds the veto, whether the meeting and the eviction happened):
//   - a nominee scene for the veto holder after the veto (the director's nominees never dropped them)
//   - a Block Buster week's house told the final two at the veto meeting, a live night early
//   - the veto talked about as still to come once it was played ("If you win the veto...", "Then win the veto")
// These rules stay: each is a sentence that can only be true at one point of the week.
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, players, seasonConfig, relationships, setPlayers, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { initGameState } from '../js/savestate.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Beth', 'Owen', 'Jo', 'Lindsay'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'hero', 'floater', 'challenge-beast', 'perceptive-player'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];

// said by somebody about themselves, true only on the block
const SELF_ON_BLOCK = /\b(I'm on the block|I am on the block|I'm nominated|if I lose the (Block Buster|veto)|I'm scared of the Block Buster|if I don't win the Block Buster|my only way off)\b/i;
const VETO_AHEAD = /\b(veto'?s tomorrow|the veto draw|win the veto|play(ing)? (for )?(the )?veto|picked for veto|if I win (the )?veto|the veto is tomorrow|until the veto)\b/i;
const REPLACEMENT_AHEAD = /\b(goes up after the veto|who goes up if|if the veto gets used)\b/i;
const NOMS_AHEAD = /\b(nominations (are )?tomorrow|putting me up (tomorrow|if)|before nominations)\b/i;

const seasons = [];
beforeAll(() => {
  for (const [cfg, seed] of [[{ bbSafetyMode: 'off' }, 33], [{ bbSafetyMode: 'off' }, 47], [{ bbSafetyMode: 'block-buster' }, 12], [{ bbSafetyMode: 'block-buster' }, 19]]) {
    setGs(null);
    setPlayers(NAMES.map((name, i) => ({ name, slug: name.toLowerCase(), gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
      stats: Object.fromEntries(KEYS.map((k, j) => [k, 1 + ((i * 7 + j * 3 + seed) % 10)])) })));
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', seasonNumber: 1, theme: 'none' }, cfg);
    seasonConfig.twistSchedule = []; initGameState(); globalThis.gs = gs;
    withSeededRandom(seed, () => { for (let i = 0; i < 6; i++) simulateBBEpisode(); });
    seasons.push(JSON.parse(JSON.stringify(gs.episodeHistory.filter(r => r.format === 'big-brother'))));
  }
}, 1200000);

describe('the chronology of a Big Brother week', () => {
  it('never airs a line that is untrue where it airs', () => {
    const bad = [];
    let lines = 0;
    for (const hist of seasons) {
      const gone = new Set();
      for (const row of hist) {
        const st = { hoh: false, noms: false, veto: false, cer: false, block: [] };
        const cerAct = row.acts.find(a => a?.type === 'veto-ceremony');
        for (const act of row.acts || []) {
          if (!act) continue;
          if (act.type === 'hoh') st.hoh = true;
          if (act.type === 'nominations') { st.noms = true; st.block = [...(row.initialNominees || [])]; }
          if (act.type === 'veto') st.veto = true;
          if (act.type === 'veto-ceremony') { st.cer = true; st.block = [...(row.blockBeforeSafety?.length ? row.blockBeforeSafety : row.finalNominees || st.block)]; }
          for (const sc of act.scenes || []) for (const l of sc.lines || []) {
            if (!l || l.kind === 'beat' || !l.by) continue;
            lines++;
            const t = String(l.text || '');
            const at = `wk${row.num} after ${act.type} ${sc.lineId || sc.step}: ${l.by}: ${t}`;
            if (gone.has(l.by)) bad.push(`evicted, and speaking. ${at}`);
            const holdsIt = st.veto && !st.cer && row.vetoWinner === l.by && cerAct?.saved === l.by;
            if (SELF_ON_BLOCK.test(t) && !/\bI wonder\b/.test(t) && (!st.noms || !st.block.includes(l.by) || holdsIt)) bad.push(`not on the block. ${at}`);
            if (st.veto && VETO_AHEAD.test(t)) bad.push(`the veto was played. ${at}`);
            if (st.cer && REPLACEMENT_AHEAD.test(t)) bad.push(`the meeting is over. ${at}`);
            if (st.noms && NOMS_AHEAD.test(t)) bad.push(`the nominations are done. ${at}`);
            for (const m of t.matchAll(/([A-Z][a-z]+) put me on the block in week (\d+)/g)) {
              const w = hist.find(r => r.num === Number(m[2]));
              const c = w?.acts?.find(x => x?.type === 'veto-ceremony');
              if (!(w && w.hoh === m[1] && ((w.initialNominees || []).includes(l.by) || c?.replacement === l.by))) bad.push(`not what happened in week ${m[2]}. ${at}`);
            }
          }
          if (act.type === 'eviction') [act.evicted, act.secondEvicted].filter(Boolean).forEach(n => gone.add(n));
        }
      }
    }
    expect(lines).toBeGreaterThan(1000);
    expect(bad).toEqual([]);
  });
});
