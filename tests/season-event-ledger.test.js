import { describe, expect, it } from 'vitest';
import {
  buildEpisodeRecord, createLedger, extractRecordedEvents, upsertEpisode, validateLedger, ledgerStats,
  setEventReview, editEvent, addManualEvent,
} from '../js/season-event-ledger.js';

const cast = ['Bowie', 'Axel', 'Caleb', 'MK'];
const summary = `Episode 4: "Fault Lines"
=== CHALLENGE ===
Caleb wins individual immunity.
=== ALLIANCE FALLOUT ===
- Bowie and MK stop trusting Axel after the plan leaks.
=== THE VOTES ===
Bowie → Axel
MK voted for Axel
Axel → Bowie
=== ADVANTAGES ===
Caleb plays an idol for Bowie.
=== ELIMINATED (PERMANENT) ===
Axel`;

describe('canonical season event ledger', () => {
  it('extracts recorded facts with source evidence and canonical actors', () => {
    const events = extractRecordedEvents({ season:2, episode:4, summaryText:summary, cast });
    expect(events.filter(e => e.type === 'vote.cast')).toHaveLength(3);
    expect(events.find(e => e.type === 'challenge.win')?.actors).toEqual(['Caleb']);
    expect(events.find(e => e.type === 'advantage.action')?.targets).toEqual(['Bowie']);
    expect(events.find(e => e.type === 'elimination')?.targets).toEqual(['Axel']);
    expect(events.every(e => e.provenance.kind === 'recorded' && e.provenance.excerpt)).toBe(true);
  });

  it('keeps AI assessments distinct from recorded facts', () => {
    const record = buildEpisodeRecord({
      season:2, episode:4, summaryText:summary, cast, eliminated:['Axel'],
      analytics:{ bestMove:{ player:'Bowie', reason:'Redirected the vote.' }, biggestRisk:{ player:'MK', reason:'Lost trust.' },
        votingBlocs:[{ name:'Three', members:['Bowie','MK'], target:'Axel', strength:70, notes:'Temporary vote.' }] },
    });
    expect(record.events.some(e => e.type === 'assessment.best-move' && e.provenance.kind === 'ai-inferred')).toBe(true);
    expect(record.events.filter(e => e.provenance.kind === 'recorded').length).toBe(record.counts.recorded);
    expect(record.counts.inferred).toBe(3);
  });

  it('replaces a regenerated episode instead of double-counting it', () => {
    const first = buildEpisodeRecord({ season:2, episode:4, summaryText:summary, cast });
    const revised = buildEpisodeRecord({ season:2, episode:4, summaryText:summary.replace('Bowie → Axel', 'Bowie → MK'), cast });
    let ledger = upsertEpisode(createLedger(2), first);
    ledger = upsertEpisode(ledger, revised);
    expect(Object.keys(ledger.episodes)).toEqual(['4']);
    expect(ledgerStats(ledger).events).toBe(revised.events.length);
    expect(ledger.episodes['4'].summaryHash).toBe(revised.summaryHash);
  });

  it('validates version, ids, and provenance', () => {
    const record = buildEpisodeRecord({ season:2, episode:4, summaryText:summary, cast });
    const ledger = upsertEpisode(createLedger(2), record);
    expect(validateLedger(ledger)).toMatchObject({ valid:true, errors:[] });
    ledger.episodes['4'].events[0].provenance = {};
    expect(validateLedger(ledger).valid).toBe(false);
  });

  it('confirms, rejects, corrects, and manually adds events without losing provenance', () => {
    const record = buildEpisodeRecord({ season:2, episode:4, summaryText:summary, cast });
    let ledger = upsertEpisode(createLedger(2), record);
    const vote = ledger.episodes['4'].events.find(e => e.type === 'vote.cast');
    ledger = setEventReview(ledger, 4, vote.id, 'rejected', 'The parchment was misread.');
    expect(ledger.episodes['4'].events.find(e => e.id === vote.id).review.status).toBe('rejected');
    ledger = editEvent(ledger, 4, vote.id, { targets:['MK'], description:'Bowie voted for MK.', note:'Corrected from footage.' });
    const corrected = ledger.episodes['4'].events.find(e => e.id === vote.id);
    expect(corrected).toMatchObject({ targets:['MK'], review:{ status:'confirmed' }, provenance:{ kind:'manual', source:'review' } });
    expect(corrected.provenance.original.targets).toEqual(['Axel']);
    ledger = addManualEvent(ledger, 4, { type:'alliance.formed', phase:'camp', actors:['Bowie','MK'], description:'Bowie and MK formalized a final two.' });
    expect(ledger.episodes['4'].events.at(-1)).toMatchObject({ type:'alliance.formed', provenance:{ kind:'manual' }, review:{ status:'confirmed' } });
    const regenerated = buildEpisodeRecord({ season:2, episode:4, summaryText:summary, cast });
    ledger = upsertEpisode(ledger, regenerated);
    expect(ledger.episodes['4'].events.find(e => e.id === vote.id)).toMatchObject({ targets:['MK'], provenance:{ source:'review' } });
    expect(ledger.episodes['4'].events.some(e => e.type === 'alliance.formed')).toBe(true);
  });
});
