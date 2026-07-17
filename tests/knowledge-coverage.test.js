// Tests for broadened knowledge fact recording (idol/advantage finds, throws).
import { describe, it, expect, beforeEach } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { recordAdvantageFinds, recordChallengeThrowKnowledge, recordPlantedLie } from '../js/knowledge-integration.js';
import { believes, knowsAbout, factId, getFact } from '../js/knowledge.js';

beforeEach(() => seedGame(['Ana', 'Bo', 'Cy'], { episode: 4, knowledge: {} }));

describe('knowledge coverage: advantage finds', () => {
  it('the finder knows they hold an idol/advantage; nobody else does', () => {
    const ep = { num: 4, idolFinds: [{ finder: 'Ana', type: 'idol' }, { finder: 'Bo', type: 'extraVote' }] };
    recordAdvantageFinds(ep, 4);
    const anaIdol = knowsAbout('Ana', 'idol', 'Ana', 4);
    expect(anaIdol).toBeTruthy();
    expect(anaIdol.valence).toBe('accurate');
    expect(anaIdol.effectiveConfidence).toBeGreaterThan(0.7);
    expect(anaIdol.sourceType).toBe('observed');
    // Bo's non-idol advantage lands under the 'advantage' type
    expect(knowsAbout('Bo', 'advantage', 'Bo', 4)).toBeTruthy();
    // outsiders are unaware
    expect(believes('Cy', factId('idol', 'Ana'), 4)).toBeNull();
    expect(believes('Bo', factId('idol', 'Ana'), 4)).toBeNull();
  });

  it('is a no-op with no finds', () => {
    expect(recordAdvantageFinds({ num: 4, idolFinds: [] }, 4)).toEqual([]);
    expect(recordAdvantageFinds({ num: 4 }, 4)).toEqual([]);
  });
});

describe('knowledge coverage: challenge throws', () => {
  it('only the detectors learn a detected throw', () => {
    const id = recordChallengeThrowKnowledge('Ana', 4, ['Bo']);
    expect(id).toBe(factId('throw', 'Ana', 4));
    const boBelief = believes('Bo', id, 4);
    expect(boBelief).toBeTruthy();
    expect(boBelief.sourceType).toBe('observed');
    // the thrower and non-witnesses don't have a belief seeded here
    expect(believes('Ana', id, 4)).toBeNull();
    expect(believes('Cy', id, 4)).toBeNull();
  });

  it('handles a numeric episode object in the fact id', () => {
    const id = recordChallengeThrowKnowledge('Cy', 7, ['Ana']);
    expect(id).toBe('throw:Cy:7');
  });
});

describe('knowledge coverage: planted lies', () => {
  it('a believed lie becomes a FALSE fact the victim swallows as accurate', () => {
    const id = recordPlantedLie({ liar: 'Bo', victim: 'Ana', accused: 'Cy', believed: true, ep: 4 });
    expect(getFact(id).truth).toBe(false);            // ground truth: it's a lie
    const b = believes('Ana', id, 4);
    expect(b.valence).toBe('accurate');               // ...but Ana is fooled
    expect(b.source).toBe('Bo');
  });

  it('a detected lie is marked false and pinned on the liar', () => {
    const id = recordPlantedLie({ liar: 'Bo', victim: 'Ana', accused: 'Cy', believed: false, ep: 4 });
    const b = believes('Ana', id, 4);
    expect(b.valence).toBe('false');                  // Ana saw through it
    expect(b.knowsOthersKnow).toContain('Bo');        // and knows Bo is the liar
  });
});
