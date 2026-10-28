// ══════════════════════════════════════════════════════════════════════
// ss-spec-audit.test.js — thirty Secret Story seasons, every rate printed
// ══════════════════════════════════════════════════════════════════════
//
// Run it and READ it: npm run audit:ss-spec. Facts are captured INSIDE the
// loop while each season is live (ADDING-A-SHOW §11.5: after the loop, gs is
// the last season). Hard checks only for what must never happen; the rates are
// for reading beside the real show's (docs/research/secret-story-france.md).
import { describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, runBBFinale } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { publicRead, support } from '../js/ss/public.js';
import { expectedTotal, actualTotal } from '../js/ss/kitty.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const SEASONS = Number(process.env.SS_SEASONS) || 30;
const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Duncan', 'Gwen'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'hothead', 'villain', 'underdog', 'goat', 'wildcard', 'chaos-agent', 'loyal-soldier', 'perceptive-player'];
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : 'n/a');
const mean = a => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : 'n/a');
const bump = (m, k) => { m[k] = (m[k] || 0) + 1; };

describe('Secret Story spec audit', () => {
  it(`measures ${SEASONS} seasons`, () => {
    const m = { found: [], secrets: [], buzzes: [], wrong: 0, right: 0, withdrawn: 0, fakes: 0, fakeBack: 0, roles: {}, unmasked: 0, unmaskWeek: [],
      riddleSolved: 0, riddleSold: 0, winnerRead: {}, winnerTop: 0, firstOutUnseen: 0, firstOuts: 0, parties: [], storeShut: 0, errors: [],
      badText: [], ledger: 0, weeks: [], signatures: {}, primeClicks: [], launchClicks: [],
      // twist families 1 and 2: the secret room's dilemmas, the cards, the week's nomination twists
      roomDilemmas: [], cardsGiven: [], cardsPlayed: {}, weekTwists: {}, twistWeeks: 0, nomWeeks: 0, fakeKinds: {}, primeThemes: {}, themedPrimes: 0, primes: 0 };
    for (let s = 1; s <= SEASONS; s++) {
      const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[(i + s) % ARCH.length] }));
      seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
      Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
      Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 4, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined, ssSecretRoom: undefined, ssSignature: undefined });
      withSeededRandom(1000 + s * 17, () => { let n = 0; while ((gs.activePlayers || []).length > 4 && n < 26) { if (!simulateBBEpisode()) break; n++; } runBBFinale(); });
      const st = gs.bb.secretStory;
      const rows = gs.episodeHistory || [];
      m.weeks.push(rows.length);
      m.secrets.push(st.secrets.length);
      m.found.push(st.secrets.filter(x => x.found && x.foundBy).length);
      m.buzzes.push(st.buzzes.length);
      for (const b of st.buzzes) b.outcome === 'right' ? m.right++ : b.outcome === 'wrong' ? m.wrong++ : m.withdrawn++;
      if ((st.hidden || []).length) { m.fakes++; if (st.hidden.every(h => h.back)) m.fakeBack++; }
      for (const h of st.hidden || []) bump(m.fakeKinds, `${h.kind || 'verdict'}/${h.role || 'watch'}`);
      m.roomDilemmas.push((st.roomDilemmas || []).length);
      m.cardsGiven.push((st.powers || []).length);
      for (const p of (st.powers || []).filter(x => x.used)) bump(m.cardsPlayed, p.kind);
      for (const t of Object.values(st.weekTwists || {})) if (t?.kind) { bump(m.weekTwists, t.kind); m.twistWeeks++; }
      m.nomWeeks += rows.filter(r => (r.acts || []).some(a => a.secretStory)).length;
      for (const p of st.primes || []) { m.primes++; if (p.theme) { m.themedPrimes++; bump(m.primeThemes, p.theme); } }
      bump(m.signatures, st.draw?.signature || 'none');
      if (st.role) { bump(m.roles, st.role.id); if (st.role.exposedWeek) { m.unmasked++; m.unmaskWeek.push(st.role.exposedWeek); } }
      if (st.houseSecret?.solvedBy) { m.riddleSolved++; if (st.houseSecret.sold) m.riddleSold++; }
      const w = gs.bb.finale?.winner;
      if (w) {
        bump(m.winnerRead, publicRead(st, w).label);
        const fin = rows.find(r => r.isFinale)?.houseAtStart || [];
        if (fin.length && fin.slice().sort((a, b) => support(st, b) - support(st, a))[0] === w) m.winnerTop++;
      }
      const afters = rows.flatMap(r => (r.acts || []).filter(a => a.type === 'ss-after' && !a.fake)).slice(0, 3);
      // (how the country saw them as they left: the After Secret read is of the house WITHOUT them)
      for (const a of afters) { m.firstOuts++; if (a.read?.key === 'unseen') m.firstOutUnseen++; }
      m.parties.push(rows.reduce((n, r) => n + (r.acts || []).filter(a => a.type === 'ss-party').length, 0));
      m.storeShut += rows.reduce((n, r) => n + (r.acts || []).filter(a => a.type === 'ss-superette' && a.closed).length, 0);
      for (const r of rows) if (r._ssError) m.errors.push(...r._ssError);
      for (const wk of gs.bb.weeks || []) if (wk?._ssError) m.errors.push(...wk._ssError);
      if (actualTotal(st) !== expectedTotal(st)) m.ledger++;
      // every week's Secret Story screens: nothing broken, no other show's words
      for (const r of rows) {
        const ss = bbWeekSteps(r, { host: 'Josh' }).filter(x => /^bb-ss-/.test(x.id || ''));
        const prime = ss.filter(x => /^bb-ss-(prime|after)/.test(x.id));
        if (prime.length) m.primeClicks.push(prime.reduce((n, x) => n + x.steps.length, 0));
        const launch = ss.filter(x => /^bb-ss-(launch|secrets)/.test(x.id));
        if (launch.length) m.launchClicks.push(launch.reduce((n, x) => n + x.steps.length, 0));
        for (const x of ss) for (const step of x.steps) {
          const t = String(step.t || '');
          if (/\bundefined\b|\bNaN\b|\[object|houseguest|Head of Household|\bveto\b|\bjury\b|evicted/i.test(t)) m.badText.push(`${x.id}: ${t.slice(0, 140)}`);
        }
      }
    }
    const out = [
      `seasons ${SEASONS}, weeks per season ${mean(m.weeks)}`,
      `secrets found by a buzz: ${pct(m.found.reduce((a, b) => a + b, 0), m.secrets.reduce((a, b) => a + b, 0))} (the real show: about half or more)`,
      `buzzes per season ${mean(m.buzzes)}; right ${m.right}, wrong ${m.wrong}, withdrawn ${m.withdrawn}`,
      `signatures ${JSON.stringify(m.signatures)}; roles unmasked ${pct(m.unmasked, Object.values(m.roles).reduce((a, b) => a + b, 0))}, mean week ${mean(m.unmaskWeek)}`,
      `fake eliminations ${pct(m.fakes, SEASONS)} (the draw: about 70%), all came back ${pct(m.fakeBack, m.fakes)}`,
      `secret of the house solved ${pct(m.riddleSolved, SEASONS)}, the place sold ${pct(m.riddleSold, m.riddleSolved)}`,
      `the winner was the finalist with the biggest fan base ${pct(m.winnerTop, SEASONS)}; winners read as ${JSON.stringify(m.winnerRead)}`,
      `the first three out were the barely seen ${pct(m.firstOutUnseen, m.firstOuts)}`,
      `parties per season ${mean(m.parties)}; store shut ${m.storeShut} times`,
      `prime clicks per week ${mean(m.primeClicks)}; launch night clicks ${mean(m.launchClicks)}`,
      `fake eliminations by kind/role ${JSON.stringify(m.fakeKinds)}`,
      `secret-room dilemmas per season ${mean(m.roomDilemmas)}; cards handed out per season ${mean(m.cardsGiven)}, played ${JSON.stringify(m.cardsPlayed)}`,
      `themed primes ${pct(m.themedPrimes, m.primes)} ${JSON.stringify(m.primeThemes)}`,
      `weeks with a nomination twist ${pct(m.twistWeeks, m.nomWeeks)} (the design: about a third from week two) ${JSON.stringify(m.weekTwists)}`,
      `engine errors ${m.errors.length}; ledger mismatches ${m.ledger}; broken or wrong-show lines ${m.badText.length}`,
      ...[...new Set(m.badText)].slice(0, 12).map(x => `  ${x}`),
      ...[...new Set(m.errors)].slice(0, 6).map(x => `  ERROR ${x}`),
    ];
    if (process.env.OUT) writeFileSync(process.env.OUT, out.join('\n') + '\n');
    // eslint-disable-next-line no-console
    console.log('\n' + out.join('\n'));
    expect(m.errors).toEqual([]);
    expect(m.ledger).toBe(0);
    expect(m.badText).toEqual([]);
  }, 1800000);
});
