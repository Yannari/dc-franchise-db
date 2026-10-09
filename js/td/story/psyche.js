// ══════════════════════════════════════════════════════════════════════
// td/story/psyche.js — what each person wants, what they're afraid of
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-08: "we're lacking events to understand their psyche". Each player gets one
// need for the season, read once from who they are (archetype, a return, age) and kept on
// gs.tdStory.psyche: what drives them and what scares them. Each episode the director gives one
// person per camp a scene about it (the C-story), tied to what just happened to them:
//   moment 'votes'  their name came up at the last vote, and they survived it
//   moment 'lost'   their ally ({lastBoot}) went home at the last vote
//   moment 'bottom' nobody here is really close to them
//   moment 'quiet'  nothing in particular; they think out loud
// psy.<need>: a (the person), b (who they confide in, or nobody: a confessional).
// Needs: belong, prove, control, protect, temper, redemption, home.
// Words only: nothing here changes the game.
import { gs, players } from '../../core.js';
import { getBond } from '../../bonds.js';
import { lastTribalOf } from './record.js';
import { ageOf } from '../script/facts.js';

const BY_ARCH = {
  hero: 'protect', 'loyal-soldier': 'protect',
  underdog: 'prove', goat: 'prove', 'challenge-beast': 'prove',
  'social-butterfly': 'belong', showmancer: 'belong', floater: 'belong', wildcard: 'belong',
  mastermind: 'control', schemer: 'control', villain: 'control', 'perceptive-player': 'control',
  hothead: 'temper', 'chaos-agent': 'temper',
};

/** The season-long need of `name` (set once, then kept). */
export function needOf(name) {
  const book = ((gs.tdStory ||= {}).psyche ||= {});
  if (book[name]) return book[name];
  const p = (players || []).find(x => x.name === name) || {};
  const age = ageOf(name);
  const need = p.isReturnee || p.returnee ? 'redemption' : age != null && age >= 35 ? 'home' : BY_ARCH[p.archetype] || 'belong';
  book[name] = need;
  return need;
}

/** What just happened to them, in the terms a psyche scene uses. */
export function momentOf(name, epNum, members) {
  const lt = lastTribalOf(name, epNum);
  // grieving the friend who left, never when you wrote their name (read in a played season: Nichelle
  // explained coldly why she voted Spud out, then 'I don't know who I am here without Spud')
  if (lt && lt.gap === 1 && lt.boot !== name && !lt.votedBoot && getBond(name, lt.boot) >= 3) return { moment: 'lost', lastBoot: lt.boot };
  if (lt && lt.gap === 1 && lt.against > 0) return { moment: 'votes' };
  const best = Math.max(-10, ...members.filter(m => m !== name).map(m => getBond(name, m)));
  if (best <= 1) return { moment: 'bottom' };
  return { moment: 'quiet' };
}

/** Who gets the C-story at this camp this episode: whoever is under the most pressure and hasn't had one lately. */
export function psycheCast(ep, members) {
  const seen = ((gs.tdStory ||= {}).psySeen ||= {});
  const weight = { lost: 4, votes: 3, bottom: 2, quiet: 0 };
  const ranked = members.map(name => {
    const m = momentOf(name, ep.num, members);
    const since = ep.num - (seen[name] ?? -99);
    return { name, ...m, score: weight[m.moment] + (since >= 4 ? 2 : since >= 2 ? 0.5 : -5) + ((ep.num * 13 + name.length * 7) % 5) * 0.1 };
  }).sort((x, y) => y.score - x.score || x.name.localeCompare(y.name));
  return ranked[0] || null;
}
