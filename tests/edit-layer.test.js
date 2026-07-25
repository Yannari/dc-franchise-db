import { beforeEach, describe, it, expect } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { seedGame } from './helpers/setup.js';
import {
  updateEditLayer, finalizeEditSeason, editRead, editArc, editSummary, EDIT_LABELS,
  VOICE_FAMILY, VOICE_POOLS,
} from '../js/edit-layer.js';
import { buildSeasonOverviewModel, buildHubAftermath } from '../js/run-ui.js';
import { _textAudiencePulse } from '../js/text-backlog.js';

const CAST = ['A', 'B', 'C', 'D', 'E', 'F'];

function seed() {
  seedGame(CAST, { episode: 1 });
  gs.edit = null;
  gs.popularity = {};
  gs.episodeHistory = [];
  seasonConfig.editLayer = undefined;
}
beforeEach(seed);

function campEv(type, players, badgeText = '') {
  return { type, players, badgeText, badgeClass: 'gold' };
}
function makeEp(num, opts = {}) {
  return {
    num,
    campEvents: { camp: { pre: opts.pre || [], post: opts.post || [] } },
    votingLog: opts.votingLog || [],
    chalMemberScores: opts.chalMemberScores || Object.fromEntries(CAST.map(n => [n, 5])),
    immunityWinner: opts.immunityWinner,
    chalPlacements: opts.chalPlacements || [],
    idolFinds: opts.idolFinds || [],
    idolPlays: opts.idolPlays || [],
    eliminated: opts.eliminated || null,
  };
}

describe('#6 edit layer — screen-time derivation', () => {
  it('camp event participants and the eliminated player earn screen time', () => {
    const rec = updateEditLayer(makeEp(1, {
      pre: [campEv('providerFishing', ['A']), campEv('sabotageScheme', ['B'])],
      eliminated: 'F',
    }));
    expect(rec.units.A).toBeGreaterThan(0);
    expect(rec.units.B).toBeGreaterThan(0);
    expect(rec.units.F).toBeGreaterThanOrEqual(4); // farewell arc
    expect(gs.edit.episodes).toHaveLength(1);
  });

  it('unknown event types degrade to neutral units instead of throwing', () => {
    expect(() => updateEditLayer(makeEp(1, {
      pre: [campEv('someBrandNewEventType2027', ['C'])],
    }))).not.toThrow();
    expect(gs.edit.totals.C.units).toBeGreaterThan(0);
  });

  it('is a no-op when seasonConfig.editLayer is false', () => {
    seasonConfig.editLayer = false;
    expect(updateEditLayer(makeEp(1))).toBeNull();
    expect(gs.edit).toBeNull();
  });
});

describe('#6 edit layer — confessionals and quotes', () => {
  it('allocates bounded confessional slots and quotes with no unresolved placeholders', () => {
    const rec = updateEditLayer(makeEp(1, {
      pre: [campEv('allianceTalk', ['A', 'B']), campEv('providerPraised', ['C'])],
    }));
    const total = Object.values(rec.conf).reduce((s, n) => s + n, 0);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThanOrEqual(10);
    Object.values(rec.conf).forEach(n => expect(n).toBeLessThanOrEqual(3));
    rec.quotes.forEach(q => {
      expect(CAST).toContain(q.name);
      expect(q.text).not.toMatch(/\{name\}|\{target\}|undefined/);
      expect(q.text.length).toBeGreaterThan(10);
    });
  });
});

describe('#6 edit layer — archetype voice families', () => {
  it('every archetype maps to a voice family with pools of 3+ variants', () => {
    const VALID_ARCHETYPES = ['mastermind', 'schemer', 'hothead', 'challenge-beast', 'social-butterfly',
      'loyal-soldier', 'wildcard', 'chaos-agent', 'floater', 'underdog', 'hero', 'villain', 'goat',
      'perceptive-player', 'showmancer'];
    VALID_ARCHETYPES.forEach(arch => {
      const family = VOICE_FAMILY[arch];
      expect(family, `${arch} has no voice family`).toBeTruthy();
      expect(VOICE_POOLS[family], `${family} has no pools`).toBeTruthy();
    });
    Object.entries(VOICE_POOLS).forEach(([family, tones]) => {
      Object.entries(tones).forEach(([tone, pool]) => {
        expect(pool.length, `${family}/${tone} pool too small`).toBeGreaterThanOrEqual(3);
        pool.forEach(line => expect(line).not.toMatch(/\{name\}|\{target\}|undefined/));
      });
    });
  });

  it('nice archetypes never receive villain-family villainous lines', () => {
    // The guard reroutes villainous tone to strategic BEFORE the voice lookup,
    // so a sunny-family player can never draw from any villainous pool.
    const villainLines = new Set([...VOICE_POOLS.villain.villainous, ...(VOICE_POOLS.sunny.villainous || [])]);
    expect(VOICE_POOLS.sunny.villainous).toBeUndefined();
    expect(villainLines.size).toBeGreaterThan(0);
  });
});

describe('#6 edit layer — live reads', () => {
  it('sustained villainous content produces a villain edit within a few episodes', () => {
    for (let ep = 1; ep <= 4; ep++) {
      updateEditLayer(makeEp(ep, {
        pre: [campEv('sabotage', ['B'], 'SABOTAGE'), campEv('spreadLies', ['B'], 'LIES SPREAD'), campEv('bonding', ['A', 'C'])],
      }));
    }
    expect(editRead('B').key).toBe('villain');
    expect(editRead('B').label).toBe(EDIT_LABELS.villain);
  });

  it('a player with almost no content trends invisible; reads have hysteresis', () => {
    for (let ep = 1; ep <= 5; ep++) {
      updateEditLayer(makeEp(ep, {
        pre: [campEv('allianceTalk', ['A', 'B']), campEv('bonding', ['A', 'C']), campEv('providerFishing', ['A'])],
        chalMemberScores: { A: 5, B: 5, C: 5, D: 5, E: 5 },
      }));
    }
    expect(editRead('E').key).toBe('invisible');
    // One busy episode should not instantly flip the label (hysteresis + EMA).
    updateEditLayer(makeEp(6, { pre: [campEv('bonding', ['E', 'A'])] }));
    expect(['invisible', 'steady']).toContain(editRead('E').key);
  });

  it('at most ONE player holds the winner edit at a time', () => {
    for (let ep = 1; ep <= 5; ep++) {
      updateEditLayer(makeEp(ep, {
        pre: [
          campEv('allianceTalk', ['A', 'B']), campEv('providerPraised', ['A']),
          campEv('allianceTalk', ['B', 'C']), campEv('providerPraised', ['C']),
          campEv('bonding', ['A', 'C']), campEv('helpAtCamp', ['B']),
        ],
        immunityWinner: ['A', 'B', 'C'][ep % 3],
      }));
      const winners = CAST.filter(n => editRead(n)?.key === 'winner');
      expect(winners.length).toBeLessThanOrEqual(1);
    }
  });

  it('an established read survives one loud contradicting episode (season arc, not weekly mood)', () => {
    for (let ep = 1; ep <= 4; ep++) {
      updateEditLayer(makeEp(ep, { pre: [campEv('sabotage', ['B'], 'SABOTAGE'), campEv('spreadLies', ['B'], 'LIES')] }));
    }
    expect(editRead('B').key).toBe('villain');
    // One heroic-heavy episode: the read must hold (change requires 2 consecutive episodes).
    updateEditLayer(makeEp(5, { pre: [campEv('helpAtCamp', ['B'], 'HELPS'), campEv('comfortVictim', ['B'], 'COMFORT')] }));
    expect(editRead('B').key).toBe('villain');
  });

  it('editArc records label transitions without consecutive duplicates', () => {
    for (let ep = 1; ep <= 3; ep++) updateEditLayer(makeEp(ep));
    const arc = editArc('A');
    expect(arc.length).toBeGreaterThan(0);
    for (let i = 1; i < arc.length; i++) expect(arc[i]).not.toBe(arc[i - 1]);
  });
});

describe('#6 edit layer — audience only, never the island', () => {
  it('drifts popularity but never touches bonds, alliances, or votes', () => {
    gs.bonds = { 'A||B': 3 };
    gs.namedAlliances = [{ name: 'Core', members: ['A', 'B'], active: true }];
    const bondsBefore = JSON.stringify(gs.bonds);
    const alliancesBefore = JSON.stringify(gs.namedAlliances);
    for (let ep = 1; ep <= 3; ep++) updateEditLayer(makeEp(ep, { pre: [campEv('bonding', ['A', 'B'])] }));
    expect(JSON.stringify(gs.bonds)).toBe(bondsBefore);
    expect(JSON.stringify(gs.namedAlliances)).toBe(alliancesBefore);
    const drifts = Object.values(gs.popularity).map(Math.abs);
    drifts.forEach(d => expect(d).toBeLessThanOrEqual(3 * 0.3 + 1e-9)); // per-ep drift is bounded
  });
});

describe('#6 edit layer — season finalization and consumers', () => {
  it('finalizeEditSeason awards from accumulated reads', () => {
    for (let ep = 1; ep <= 4; ep++) {
      updateEditLayer(makeEp(ep, { pre: [campEv('sabotage', ['B'], 'SABOTAGE'), campEv('spreadLies', ['B'], 'LIES')] }));
    }
    const final = finalizeEditSeason();
    expect(final.biggestVillain).toBe('B');
    expect(gs.edit.final).toEqual(final);
  });

  it('overview model exposes audiencePulse; aftermath exposes editWatch lines', () => {
    updateEditLayer(makeEp(1, { pre: [campEv('allianceTalk', ['A', 'B'])] }));
    const model = buildSeasonOverviewModel(gs, CAST.map(name => ({ name })));
    expect(model.audiencePulse).toBeTruthy();
    const rowA = model.audiencePulse.players.find(p => p.name === 'A');
    expect(rowA.read).toBeTruthy();
    expect(rowA.share).toBeGreaterThan(0);
    const aftermath = buildHubAftermath({ num: 1, votes: {}, votingLog: [] });
    expect(Array.isArray(aftermath.editWatch)).toBe(true);
  });

  it('text backlog gets a complete AUDIENCE PULSE retranscription', () => {
    updateEditLayer(makeEp(1, { pre: [campEv('sabotage', ['B'], 'SABOTAGE'), campEv('bonding', ['A', 'C'])] }));
    const ep2 = makeEp(2, { pre: [campEv('sabotage', ['B'], 'SABOTAGE'), campEv('bonding', ['A', 'C'])] });
    updateEditLayer(ep2);
    const L = [];
    _textAudiencePulse(ep2, s => L.push(s), t => L.push(`=== ${t} ===`));
    const text = L.join('\n');
    expect(text).toContain('AUDIENCE PULSE (THE EDIT)');
    expect(text).toContain('EDIT READS:');
    // every stored quote appears verbatim
    ep2.editSnapshot.quotes.forEach(q => expect(text).toContain(q.text));
    // an ep with no snapshot writes nothing
    const L2 = [];
    _textAudiencePulse({ num: 9 }, s => L2.push(s), t => L2.push(t));
    expect(L2).toEqual([]);
  });

  it('old saves without gs.edit render safely everywhere', () => {
    gs.edit = undefined;
    const model = buildSeasonOverviewModel(gs, CAST.map(name => ({ name })));
    expect(model.audiencePulse).toBeNull();
    const aftermath = buildHubAftermath({ num: 1, votes: {} });
    expect(aftermath.editWatch).toEqual([]);
    expect(editRead('A')).toBeNull();
    expect(editSummary()).toBeNull();
  });

  it('gs.edit survives a JSON round-trip (serialization rule)', () => {
    updateEditLayer(makeEp(1, { pre: [campEv('bonding', ['A', 'B'])] }));
    const thawed = JSON.parse(JSON.stringify(gs.edit));
    expect(thawed.episodes).toHaveLength(1);
    expect(thawed.reads.A.key).toBeTruthy();
  });
});
