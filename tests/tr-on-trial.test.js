// ══════════════════════════════════════════════════════════════════════
// tests/tr-on-trial.test.js — the list that hangs over a whole day
// ══════════════════════════════════════════════════════════════════════
//
// The twist was rebuilt to the wiki's rule after it was reported as "i still
// dont understand what on trial twist do", which was the correct reading of
// what it had been: a private one-night footnote whose only trace was a single
// audience-only sentence the next morning. It is two nights now — write the
// list, live the day under it, collect off it — and these arms are written
// against the three things that makes true and the old one never did:
//
//   1. THE NAMING NIGHT KILLS NOBODY. Everyone not on the list is safe.
//   2. THE COLLECTION IS CONFINED TO THE LIST. Whoever dies was written down
//      the night before, even when the room banished the name the pact wanted.
//   3. IT IS PUBLIC. The castle is told at breakfast, the Round Table knows,
//      and a PLAYER observer is shown the same thing the audience is.
//
// Every arm pins the night: the shape is opt-in, and what is measured here is
// what it does, not how often the catalogue offers it.
import { describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { rpBuildConclave } from '../js/vp-tr/conclave.js';
import { rpBuildColdOpen } from '../js/vp-tr/cold-open.js';
import { rpBuildRoundTable } from '../js/vp-tr/round-table.js';
import { buildTrialList, TRIAL_COVER_P } from '../js/tr/on-trial.js';
import { VARIANT_LINES } from '../js/tr/murder-variants.js';
import { alignmentAt } from '../js/tr/roles.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);

function play(seed, schedule = { 4: 'on-trial' }) {
  setPlayers(ROSTER);
  setGs({});
  playTraitorsSeason({ cast: CAST, traitorCount: 3, seed, murderSchedule: schedule });
  const rounds = gs.tr.rounds || [];
  return {
    rounds,
    trials: gs.tr.trials || [],
    named: rounds.find(r => r.variantData?.phase === 'named') || null,
    took: rounds.find(r => r.variantData?.phase === 'taken') || null,
    rows: gs.episodeHistory || [],
  };
}

function sweep(n, schedule) {
  const out = [];
  for (let seed = 1; seed <= n; seed++) {
    const s = play(seed, schedule);
    if (s.named) out.push({ seed, ...s });
  }
  return out;
}

describe('on trial', () => {
  it('is off unless the author asks for it', () => {
    setPlayers(ROSTER);
    setGs({});
    playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 9 });
    expect((gs.tr.rounds || []).some(r => r.variant === 'on-trial')).toBe(false);
    expect((gs.tr.trials || []).length).toBe(0);
  });

  // ── 1. THE REPRIEVE ──────────────────────────────────────────────────
  it('writes three or four names and murders nobody that night', () => {
    const runs = sweep(15);
    expect(runs.length).toBeGreaterThan(10);
    for (const { named } of runs) {
      const d = named.variantData;
      expect(d.names.length).toBeGreaterThanOrEqual(3);
      expect(d.names.length).toBeLessThanOrEqual(4);
      expect(new Set(d.names).size).toBe(d.names.length);
      expect(d.names).toContain(d.aim);
      // THE WHOLE POINT OF THE NIGHT.
      expect(named.murdered, 'somebody died on a naming night').toBeFalsy();
      expect(named.murderTarget, 'a naming night recorded a murder target').toBeFalsy();
    }
  });

  it('runs both list sizes, so neither pool is written for nothing', () => {
    const sizes = {};
    for (const { named } of sweep(30)) {
      sizes[named.variantData.names.length] = (sizes[named.variantData.names.length] || 0) + 1;
    }
    expect(sizes[3], 'no three-name list in 30 seeds').toBeGreaterThan(3);
    expect(sizes[4], 'no four-name list in 30 seeds').toBeGreaterThan(3);
  });

  // ── 2. THE COLLECTION ────────────────────────────────────────────────
  it('collects off its own list the next night, and never off anybody else', () => {
    let checked = 0;
    for (const { named, took, trials } of sweep(25)) {
      if (!took) continue;
      checked++;
      const d = took.variantData;
      expect(took.ep, 'the list was collected on the wrong night')
        .toBe(named.ep + (d.namedEp === named.ep ? 1 : 1));
      expect(d.names).toEqual(named.variantData.names);
      // THE RULE. Whoever died tonight was written down last night.
      expect(d.names, 'the pact murdered somebody who was never on the list')
        .toContain(took.murdered || took.murderTarget);
      expect(trials.some(t => t.outcome === 'taken' || t.outcome === 'blocked')).toBe(true);
    }
    expect(checked, 'no collection in 25 seeds').toBeGreaterThan(10);
  });

  it('is forced to settle for another name when the room takes the one it wanted', () => {
    let settled = 0, kept = 0;
    for (const { took } of sweep(40)) {
      if (!took) continue;
      const d = took.variantData;
      if (d.kept) { kept++; continue; }
      settled++;
      // The name they wrote the list around is gone, or at least is not the
      // one they ended up with — and the one they took was on the list.
      expect(d.taken).not.toBe(d.aim);
      expect(d.names).toContain(d.taken);
    }
    // Measured at roughly half and half: a day is long enough that the room
    // takes the pact's first choice away from them about as often as not,
    // which is the reprieve doing its job.
    expect(kept, 'the pact never kept its first choice').toBeGreaterThan(3);
    expect(settled, 'the day never took a name off the list').toBeGreaterThan(3);
  });

  it('never leaves a list standing at the end of a season', () => {
    // A list written and never collected is the twist promising a body it does
    // not deliver. It used to happen 22 times in 60 seasons, because a
    // recruitment or the deal could eat the collection night; the obligation
    // rolls forward now and lapses only if the season genuinely runs out.
    let lapsed = 0, total = 0;
    for (const { trials } of sweep(30, { 3: 'on-trial', 7: 'on-trial' })) {
      for (const t of trials) { total++; if (t.outcome === 'lapsed') lapsed++; }
      expect(gs.tr.onTrial ? gs.tr.onTrial.done : true,
        'a list was still standing when the season ended').toBe(true);
    }
    expect(total).toBeGreaterThan(20);
    expect(lapsed / total, 'lists are still evaporating').toBeLessThan(0.1);
  });

  it('a pinned shape on the collection night is moved, not eaten', () => {
    let seen = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const { rounds } = play(seed, { 4: 'on-trial', 5: 'dungeon' });
      const moved = (gs.tr.shapesMoved || []).filter(m => /list/.test(m.why));
      for (const m of moved) {
        seen++;
        expect(m.shape).toBe('dungeon');
        expect(m.from).toBe(5);
        // It ran the next night, or it was recorded as not having run.
        if (m.ran) expect(rounds.find(r => r.ep === m.to).variant).toBe('dungeon');
      }
    }
    expect(seen, 'the trial never displaced a pinned shape in 20 seeds').toBeGreaterThan(3);
  });

  // ── 3. IT IS PUBLIC ──────────────────────────────────────────────────
  it('tells the castle the names at breakfast, players included', () => {
    let checked = 0;
    for (const { named, rows } of sweep(12)) {
      const morning = rows.find(e => Number(e.num) === named.ep + 1);
      if (!morning) continue;
      checked++;
      const names = named.variantData.names;
      const audience = rpBuildColdOpen(morning, 'audience');
      expect(audience).toContain('On trial');
      for (const n of names) expect(audience).toContain(n);
      // A PLAYER SEES THE SAME THING. This is the only murder-shape fact in
      // the format that is not withheld from the castle, and the screen has
      // to honour that or the twist is private again.
      const watcher = (morning.tr.living || []).find(n => !names.includes(n));
      const player = rpBuildColdOpen(morning, `player:${watcher}`);
      expect(player).toContain('On trial');
      for (const n of names) expect(player).toContain(n);
    }
    expect(checked).toBeGreaterThan(8);
  });

  it('the Round Table knows it is sitting under a list', () => {
    let checked = 0;
    for (const { named, took, rows } of sweep(15)) {
      if (!took) continue;
      const day = rows.find(e => Number(e.num) === took.ep);
      if (!day || !day.tr.table) continue;
      checked++;
      const html = rpBuildRoundTable(day, 'audience');
      expect(html).toMatch(/Of You (Are|Is) On The List/);
      // And it says what a banishment does to it, in the show's own word.
      expect(html).toContain('is a name the pact cannot use');
    }
    expect(checked, 'no table sat under a list in 15 seeds').toBeGreaterThan(8);
  });

  it('draws the list on both nights and seals nothing on the first', () => {
    const run = sweep(15).find(r => r.took);
    expect(run).toBeTruthy();
    const namedRow = run.rows.find(e => Number(e.num) === run.named.ep);
    const tookRow = run.rows.find(e => Number(e.num) === run.took.ep);

    const a = rpBuildConclave(namedRow, 'audience');
    expect(a).toContain('ls-stage');
    expect(a).toMatch(/Three Names|Four Names/);
    expect(a).toContain('Nobody Dies Tonight');
    // NO LETTER AND NO WAX CARD. Both are about a body and there is not one —
    // the screen used to seal a name on a night nobody was chosen. The
    // SIDEBAR still mentions the wax, and correctly: "The wax is not lit."
    expect(a).not.toContain('The wax</div>');
    expect(a).not.toContain('cv-card-title">Sealed<');
    for (const n of run.named.variantData.names) expect(a).toContain(n);

    const b = rpBuildConclave(tookRow, 'audience');
    expect(b).toContain('ls-stage');
    expect(b).toContain('The List, One Day On');
    expect(b).toContain('The wax</div>');
    expect(b).toContain('cv-card-title">Sealed<');
  });

  it('never prints an alignment beside a name on the list', () => {
    for (const { named, rows } of sweep(10)) {
      const row = rows.find(e => Number(e.num) === named.ep);
      const html = rpBuildConclave(row, 'audience');
      const card = html.slice(html.indexOf('The list'), html.indexOf('The list') + 4000);
      for (const n of named.variantData.names) {
        if (alignmentAt(n, named.ep) !== 'traitor') continue;
        expect(new RegExp(n + '[^<]{0,80}(Traitor|traitor)').test(card),
          `${n} is named as a Traitor on the list card`).toBe(false);
      }
    }
  });

  // ── THE PROSE AND THE PIECES ─────────────────────────────────────────
  it('takes its sentence from the pool that matches the night', () => {
    const seen = new Set();
    for (const { named, took } of sweep(30)) {
      const size = named.variantData.names.length;
      expect(named.variantLineKey).toBe(size > 3 ? 'on-trial-named-four' : 'on-trial-named');
      seen.add(named.variantLineKey);
      if (!took) continue;
      expect(took.variantLineKey).toBe(took.variantData.kept ? 'on-trial-taken' : 'on-trial-settled');
      seen.add(took.variantLineKey);
      for (const key of [named.variantLineKey, took.variantLineKey]) {
        expect(VARIANT_LINES[key], `${key} is not a pool`).toBeTruthy();
      }
    }
    expect([...seen].sort()).toEqual(['on-trial-named', 'on-trial-named-four',
      'on-trial-settled', 'on-trial-taken']);
  });

  it('writes one of its own onto the list often enough to matter, and not always', () => {
    let cover = 0, total = 0;
    for (const { named, seed } of sweep(40)) {
      total++;
      if (!named.variantData.cover) continue;
      cover++;
      play(seed);
      expect(alignmentAt(named.variantData.cover, named.ep),
        'the cover name was not a Traitor').toBe('traitor');
    }
    expect(total).toBeGreaterThan(25);
    // The wiki's "The Traitors may put themselves on trial also", priced at
    // TRIAL_COVER_P. Wide bands: what matters is that both cases happen.
    expect(cover / total).toBeGreaterThan(TRIAL_COVER_P * 0.4);
    expect(cover / total).toBeLessThan(TRIAL_COVER_P * 1.8);
  });

  it('the list builder never invents a name', () => {
    setPlayers(ROSTER);
    setGs({ activePlayers: CAST.slice(0, 9), bonds: {} });
    gs.tr = { rounds: [], alignment: {} };
    for (let ep = 2; ep <= 40; ep++) {
      const { names, cover } = buildTrialList(ep, CAST[0], [CAST[1]]);
      expect(names.length).toBeGreaterThanOrEqual(3);
      expect(names).toContain(CAST[0]);
      for (const n of names) expect(CAST.slice(0, 9)).toContain(n);
      if (cover) expect(cover).toBe(CAST[1]);
    }
  });
});
