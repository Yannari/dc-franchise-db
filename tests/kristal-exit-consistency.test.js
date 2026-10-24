// An exit interview is one person talking for an hour. Each rule below is a
// contradiction found reading real episodes (user, 2026-10-24: "fix kristal
// talk"): Sabrina naming Kyle "the only honest person in there" and then
// picking him to win "not because Kyle deserves it"; Skye calling Ayesha her
// person and then naming Ayesha as next in trouble; "Whose edit is kinder
// than they deserve?" answered "Ayesha won't last".
import { describe, it, expect } from 'vitest';
import { composeExit, warmOf, exitPicks } from '../js/kristal-exit.js';
import { FAN_FIT } from '../js/kristal-exit-lines.js';

const names = ['Ana', 'Bo', 'Cy', 'Dee', 'Eli', 'Fay', 'Gus', 'Hal', 'Ivy'];
const moods = ['bitter', 'denial', 'gutted', 'gracious', 'relieved', 'elated'];
const kinds = ['first-boot', 'blindside', 'seen-it-coming', 'backdoor', 'walked', 'showmance', 'double'];
const stances = ['blame', 'respect', 'drag', 'warn', 'praise', 'miss'];
const POSITIVE = new Set(['praise', 'respect', 'miss']);

function* interviews(n, seed = 99) {
  let s = seed;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const pickN = (a, k) => [...a].sort(() => r() - 0.5).slice(0, k);
  for (let i = 0; i < n; i++) {
    const still = pickN(names, 6);
    const named = pickN(names, 3).map(who => ({ who, stance: stances[Math.floor(r() * 6)], still: still.includes(who), heat: 1 }));
    const rec = { id: `x-w${i}-Zed`, guest: 'Zed', week: 1 + Math.floor(r() * 8), kind: kinds[Math.floor(r() * kinds.length)],
      mood: moods[Math.floor(r() * 6)], placement: 3 + Math.floor(r() * 10), named, stillIn: still,
      rivals: r() < 0.5 ? [still[0]] : [], allies: r() < 0.5 ? [still[1]] : [], prediction: still[2],
      segments: pickN(['fan-mail', 'rank-them', 'message-in', 'who-next'], 3), reception: ['warm', 'mixed', 'cold'][Math.floor(r() * 3)] };
    yield { rec, t: composeExit({ id: `kt-test-${i}`, record: rec, guestName: 'Zed', season: { format: 'big-brother' } }, { words: { round: 'Week' } }) };
  }
}
const all = [...interviews(300)];

describe('an exit interview agrees with itself', () => {
  it('asks and answers every exchange, and never says one answer twice in the hour', () => {
    for (const { t } of all) {
      for (const x of t.exchanges) { expect(x.q, x.topic).toBeTruthy(); expect(x.a, x.topic).toBeTruthy(); }
      const as = t.exchanges.map(x => x.a);
      expect(new Set(as).size).toBe(as.length);
    }
  });

  it('answers an open "Who…?" with the name', () => {
    for (const { t } of all) for (const x of t.exchanges) {
      if (x.topic !== 'named' || !x.who || !/^(who|whose)\b/i.test(x.q)) continue;
      expect(x.a, `${x.q} -> ${x.a}`).toMatch(new RegExp(`^(Just |It was |Probably |And |Put it on |Honestly, |I’d trust |I respect |I lived with |I never fully trusted |I’d keep an eye on |Watch )?${x.who}`));
    }
  });

  it('never names somebody it praised as next to go, and says "the only one" of one person only', () => {
    for (const { rec, t } of all) {
      const warm = warmOf(rec);
      const praised = rec.named.filter(n => POSITIVE.has(n.stance)).length;
      for (const x of t.exchanges) {
        if (x.topic === 'who-next') expect(warm.has(x.who), x.a).toBe(false);
        if (x.topic === 'named' && praised > 1) expect(x.a).not.toMatch(/\bonly (honest )?(one|person|nice thing)\b|\bthe one person\b|\beveryone else\b/i);
      }
    }
  });

  it('picks a friend to win warmly, never "and I hate saying it"', () => {
    for (const { rec, t } of all) {
      const p = t.exchanges.find(x => x.topic === 'the-prediction');
      if (p && warmOf(rec).has(p.who)) expect(p.a).not.toMatch(/hate saying|not because .* deserves/i);
    }
  });

  it('does not claim weeks with people the guest left in week one or two', () => {
    for (const { rec, t } of all) if (rec.week < 3) for (const x of t.exchanges) if (x.topic === 'named') expect(x.a).not.toMatch(/\bweeks\b/i);
  });

  it('answers a listener question with an answer to it', () => {
    for (const { t } of all) {
      const x = t.exchanges.find(e => e.topic === 'fan-mail');
      if (!x) continue;
      const fit = FAN_FIT.find(f => f.when.test(x.q));
      if (fit) expect(Object.values(fit.a).flat()).toContain(x.a);
      else expect(x.a).not.toMatch(/too safe|first week/i);
    }
  });

  it('agrees with the picks On Air quotes', () => {
    for (const { rec, t } of all.slice(0, 60)) {
      const picks = exitPicks(rec, `kt-test-${rec.id.match(/w(\d+)/)[1]}`);
      const next = t.exchanges.find(x => x.topic === 'who-next');
      if (next) expect(next.who).toBe(picks.next);
    }
  });
});
