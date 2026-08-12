// Cutting one person's thread out of a season.
//
// The article's Personality section was reading the voice profile — how a
// character TALKS, written so the episode generator has a voice to write in —
// because nothing that knew how they PLAYED was ever shown to it. The
// screenplay knows, and the screenplay never left the browser.
//
// What matters here is the slicing, because that is what decides whether the
// model gets a season or a first week.
import { describe, expect, it } from 'vitest';
import { readTranscript, sliceCastThreads, threadsToPrompt } from '../js/wiki-fill.js';

const EP = (n, body) => ({ episode: n, transcript: body });

const S1 = `
[SCENE: BEDROOM — MORNING]
The lights are on. Joel is getting dressed. Ireland is still in bed.
Joel: Morning.
Ireland: Mm.
Joel: Couldn't sleep anymore.
Ireland: You were snoring.
Joel: Lies.
[CONFESSIONAL: Ireland]
Ireland: I am not a morning person and this house has a lot of mornings in it.
[SCENE: KITCHEN]
Amberly stands in the kitchen, counting on her fingers.
Amberly: That's six, y'all.
Don: Amberly left ten votes to two.
`;

describe('reading a transcript', () => {
  it('separates a confessional from a conversation', () => {
    const beats = readTranscript(S1);
    const conf = beats.filter(b => b.kind === 'confessional');
    expect(conf.length).toBe(1);
    expect(conf[0].who).toBe('Ireland');
    expect(conf[0].text).toMatch(/not a morning person/);
    // And the line before it, in a scene, is not a confessional.
    expect(beats.find(b => b.text === 'Mm.').kind).toBe('dialogue');
  });

  it('keeps stage directions, which is what people DID', () => {
    const stage = readTranscript(S1).filter(b => b.kind === 'stage');
    expect(stage.some(s => /counting on her fingers/.test(s.text))).toBe(true);
  });
});

describe('slicing the cast', () => {
  const cast = ['Ireland', 'Joel', 'Amberly'];

  it('gives every houseguest their own thread in one pass', () => {
    const threads = sliceCastThreads([EP(4, S1)], cast);
    expect(threads.map(t => t.name).sort()).toEqual(['Amberly', 'Ireland', 'Joel']);
    const ireland = threads.find(t => t.name === 'Ireland');
    expect(ireland.confessionals.length).toBe(1);
    expect(ireland.lines.map(l => l.text)).toContain('You were snoring.');
  });

  it('ignores anybody who is not in the cast', () => {
    // The host talks constantly and is not a houseguest.
    const threads = sliceCastThreads([EP(4, S1)], cast);
    expect(threads.some(t => t.name === 'Don')).toBe(false);
  });

  it('credits a stage direction to whoever it names', () => {
    const amberly = sliceCastThreads([EP(4, S1)], cast).find(t => t.name === 'Amberly');
    expect(amberly.mentions.some(m => /counting on her fingers/.test(m.text))).toBe(true);
  });

  // The whole reason the slice exists.
  it('samples the WHOLE season, not the front of it', () => {
    const eps = [];
    for (let n = 1; n <= 12; n++) {
      eps.push(EP(n, `[SCENE: ROOM]\nIreland: line from episode ${n}.\n`));
    }
    const ireland = sliceCastThreads(eps, ['Ireland'], { linePerPlayer: 4 }).find(t => t.name === 'Ireland');
    expect(ireland.lines.length).toBe(4);
    const episodes = ireland.lines.map(l => l.ep);
    // First and last thirds are both represented — a truncation would give
    // 1,2,3,4 and characterise everybody by their first week.
    expect(Math.min(...episodes)).toBeLessThanOrEqual(2);
    expect(Math.max(...episodes)).toBeGreaterThanOrEqual(9);
  });

  it('says how much it cut from, so a quiet player is not read as missing data', () => {
    const eps = [];
    for (let n = 1; n <= 30; n++) eps.push(EP(n, `[SCENE: ROOM]\nJoel: ${n}.\n`));
    const joel = sliceCastThreads(eps, ['Joel'], { linePerPlayer: 5 }).find(t => t.name === 'Joel');
    expect(joel.lines.length).toBe(5);
    expect(joel.totals.lines).toBe(30);
  });

  it('marks somebody who never spoke rather than dropping them', () => {
    const threads = sliceCastThreads([EP(1, '[SCENE: ROOM]\nJoel: Hello.\n')], ['Joel', 'Silent']);
    const silent = threads.find(t => t.name === 'Silent');
    expect(silent).toBeTruthy();
    expect(threadsToPrompt([silent])).toMatch(/barely spoke on camera/);
  });
});

describe('the payload', () => {
  it('leads with confessionals, which are the densest thing in the file', () => {
    const threads = sliceCastThreads([EP(4, S1)], ['Ireland']);
    const text = threadsToPrompt(threads);
    expect(text.indexOf('CONFESSIONALS')).toBeLessThan(text.indexOf('IN THE HOUSE'));
    expect(text).toContain('### Ireland');
    expect(text).toContain('(ep4)');
  });
});
