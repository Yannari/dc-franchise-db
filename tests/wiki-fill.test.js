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

  it('reads a wrapped speech as one line, not a line and a stage direction', () => {
    // The writer hard-wraps. Read literally, half of what somebody said
    // becomes scenery, and a "verbatim" quote is only its first line.
    const beats = readTranscript(`[SCENE: HALL]
Caleb: there is a version
of tonight where nobody knew.
`);
    const caleb = beats.filter(b => b.who === 'Caleb');
    expect(caleb.length).toBe(1);
    expect(caleb[0].text).toBe('there is a version of tonight where nobody knew.');
    expect(beats.some(b => b.kind === 'stage' && /of tonight/.test(b.text))).toBe(false);
  });

  it('still reads a stage direction that follows a finished line', () => {
    const beats = readTranscript(`[SCENE: HALL]
Caleb: Fine.
He steps down off the counter.
`);
    expect(beats.find(b => /steps down/.test(b.text)).kind).toBe('stage');
    expect(beats.find(b => b.who === 'Caleb').text).toBe('Fine.');
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

// ── the season's own history ────────────────────────────────────────────
//
// The derived Game history is true and thin: it can say who was evicted and
// by how many, never how the week got there. These are the pieces that let
// the episodes tell that half without contradicting the record.
import { episodeDigest, gameHistoryPayload, roundLedger } from '../js/wiki-fill.js';

const LONG = `
[SCENE: LIVING ROOM — NIGHT]
Caleb stands on the counter to reach the vote box, and the room goes quiet.
Caleb: I want to be very clear about something, because there is a version
of tonight where everybody in this room pretends they did not know.
Ireland: Mm.
Joel: Sure.
Ireland: Yep.
[CONFESSIONAL: Ireland]
Ireland: He is on the counter. There is a chair right there and he is on the counter.
`;

describe('cutting an episode down to a week', () => {
  it('keeps the scene, the stage direction and the speech, drops the grunts', () => {
    const d = episodeDigest(LONG, { cap: 500 });
    expect(d).toMatch(/SCENE: LIVING ROOM/);
    expect(d).toMatch(/stands on the counter/);
    expect(d).toMatch(/very clear about something/);
    expect(d).not.toMatch(/Mm\./);
  });

  it('keeps what survives in the order it happened', () => {
    const d = episodeDigest(LONG, { cap: 4000 });
    expect(d.indexOf('LIVING ROOM')).toBeLessThan(d.indexOf('very clear'));
    expect(d.indexOf('very clear')).toBeLessThan(d.indexOf('There is a chair'));
  });

  it('marks a confessional, because it is somebody explaining their own week', () => {
    expect(episodeDigest(LONG, { cap: 4000 })).toMatch(/Ireland: \(to camera\)/);
  });

  it('stays inside its budget', () => {
    expect(episodeDigest(LONG, { cap: 200 }).length).toBeLessThanOrEqual(200);
  });
});

describe('the round ledger', () => {
  /* WITH ITS FORMAT ON IT, the way every published document carries one.
     `roundLedger` used to name the round by SNIFFING WHICH ARRAY IT FOUND —
     `weeks ? 'Week' : 'Episode'` — which makes any third show that also
     exports `votingHistory` a Total Drama season. It asks the registry now,
     and a fixture that leaves the format off is asserting the bare-integer
     rule (no format means Total Drama), not Big Brother. */
  const BB = { format: 'big-brother',
    weeks: [{ week: 1, hoh: 'Caleb', initialNominees: ['Joel', 'Ireland'],
    vetoWinner: 'Ireland', finalNominees: ['Joel', 'Wayne'],
    votes: { Joel: 6, Wayne: 3 }, evicted: 'Joel' }] };
  const TD = { votingHistory: [{ episode: 1, winner: 'Riya', eliminated: 'Dylan',
    votes: { Dylan: 5, Riya: 1 } }] };

  it('reads a Big Brother week', () => {
    const [w] = roundLedger(BB);
    expect(w.word).toBe('Week');
    expect(w.gone).toBe('Joel');
    expect(w.facts.join(' | ')).toMatch(/Caleb won Head of Household/);
    expect(w.facts.join(' | ')).toMatch(/Ireland won the veto/);
  });

  it('reads a Total Drama round from the same call', () => {
    const [r] = roundLedger(TD);
    expect(r.word).toBe('Episode');
    expect(r.gone).toBe('Dylan');
    // No nominations anywhere in a camp's record.
    expect(r.facts.join(' | ')).not.toMatch(/nominated|Head of Household/);
    expect(r.facts.join(' | ')).toMatch(/Riya won the challenge/);
  });

  it('asks about a round whose episode was never generated', () => {
    const rounds = gameHistoryPayload(BB, []);
    expect(rounds.length).toBe(1);
    expect(rounds[0].episode).toBe('');
    expect(rounds[0].facts.length).toBeGreaterThan(0);
  });

  it('attaches an episode to the round that carries its number', () => {
    const rounds = gameHistoryPayload(BB, [{ episode: 1, transcript: LONG }]);
    expect(rounds[0].episode).toMatch(/LIVING ROOM/);
  });
});
