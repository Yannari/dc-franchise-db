// @vitest-environment jsdom
// Text-backlog coverage regression. The vote-pitch camp events (votePitch/
// votePitchFailed/pitchAllianceFallout) were once injected AFTER generateSummaryText,
// so they existed in the VP but never reached the text backlog. This asserts EVERY
// camp event that carries text renders verbatim in the episode's summaryText.
import { describe, it, expect } from 'vitest';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';

describe('text backlog — camp event coverage', () => {
  it('every camp event with text appears in summaryText (incl. vote pitches)', () => {
    let totalEvents = 0, rendered = 0, sawVotePitch = false;
    const missing = [];
    seededRun(() => {
      for (let s = 0; s < 3; s++) {
        runOneSeason({ advantages: { idol: { enabled: true } } });
        (core.gs.episodeHistory || []).forEach((h, i) => {
          const txt = (h.summaryText || '').replace(/\s+/g, ' ');
          const isTwist = ![undefined, '', 'tribe', 'team', 'individual', 'mixed'].includes(h.challengeType);
          Object.values(h.campEvents || {}).forEach(phase => {
            if (Array.isArray(phase)) return;
            ['pre', 'post'].forEach(ph => (phase[ph] || []).forEach(ev => {
              if (!ev || !ev.text || (isTwist && ev.tag)) return;
              if (ev.type === 'votePitch' || ev.type === 'votePitchFailed') sawVotePitch = true;
              totalEvents++;
              const needle = ev.text.replace(/\s+/g, ' ').trim().slice(0, 40);
              if (needle && txt.includes(needle)) rendered++;
              else missing.push(`s${s} ep${i + 1} ${ev.type || '?'}: "${needle}"`);
            }));
          });
        });
      }
    });
    if (missing.length) console.log('MISSING FROM BACKLOG:', missing.slice(0, 10).join(' || '));
    expect(totalEvents).toBeGreaterThan(50);
    expect(sawVotePitch).toBe(true);   // the exact events that regressed must actually occur in the sample
    expect(missing).toEqual([]);       // and every camp event must render in the backlog
  }, 180000);
});
