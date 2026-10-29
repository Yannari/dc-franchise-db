// The cast screen's Secrets tab (js/ss/setup-panel.js), the user, 2026-10-28:
//   "where is the secret we are a couple / married... a duo secret can be personal" — a Shared secrets section, and a
//     real tie drawn for most casts;
//   "when you create a secret, does it stick in the dropdown or does it go?" — it sticks: Written by you.
import { describe, expect, it, beforeEach } from 'vitest';
import { seasonConfig, players, setPlayers } from '../js/core.js';
import { ensureSsCast, ssSecretsBoardHTML, ssWriteSave, ssChoose, ownSecrets, ssDuoRemove, ssDuoDraw } from '../js/ss/setup-panel.js';

const NAMES = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi', 'Gus', 'Hal', 'Ivy', 'Jo', 'Kai', 'Lu'];
const cast = () => NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: 'floater', stats: {} }));
const withRandom = (r, fn) => { const was = Math.random; Math.random = () => r; try { return fn(); } finally { Math.random = was; } };

beforeEach(() => {
  setPlayers(cast());
  Object.assign(seasonConfig, { format: 'secret-story', ssSecrets: {}, ssProductionDrawn: 'x', ssDuoDrawn: undefined, ssRecognitionsCast: undefined });
  localStorage.removeItem('ss-own-secrets');
});

describe('the shared secrets', () => {
  it('a cast gets a real tie three times in four, drawn once and kept', () => {
    withRandom(0.1, () => ensureSsCast());
    const tied = Object.entries(seasonConfig.ssSecrets).filter(([, e]) => e?.pair);
    expect(tied.length).toBe(2);
    const [[a, ea], [b, eb]] = tied;
    expect(ea.pair).toBe(b);
    expect(eb.pair).toBe(a);
    expect(ea.text).toBe(eb.text);
    // (drawn once: the same cast is not drawn for again)
    const before = JSON.stringify(seasonConfig.ssSecrets);
    withRandom(0.1, () => ensureSsCast());
    expect(JSON.stringify(seasonConfig.ssSecrets)).toBe(before);
    // and some casts have none
    seasonConfig.ssSecrets = {}; seasonConfig.ssDuoDrawn = undefined;
    withRandom(0.9, () => ensureSsCast());
    expect(Object.values(seasonConfig.ssSecrets).some(e => e?.pair)).toBe(false);
  });
  it('shows on the board, and taking one away gives both their own secrets back', () => {
    withRandom(0.1, () => ensureSsCast());
    const html = ssSecretsBoardHTML();
    expect(html).toContain('Shared secrets');
    expect(html).toContain('New shared secret');
    const [a] = Object.entries(seasonConfig.ssSecrets).find(([, e]) => e?.pair);
    const b = seasonConfig.ssSecrets[a].pair;
    ssDuoRemove(a);
    expect(seasonConfig.ssSecrets[a]?.pair).toBeUndefined();
    expect(seasonConfig.ssSecrets[b]?.pair).toBeUndefined();
    expect(seasonConfig.ssSecrets[a]?.text).toBeTruthy();
    ssDuoDraw();
    expect(Object.values(seasonConfig.ssSecrets).filter(e => e?.pair).length).toBe(2);
  });
});

describe('a secret you wrote', () => {
  it('stays in the Choose list, for anybody, in this season and the next', () => {
    ensureSsCast();
    document.body.innerHTML = '<input id="ss-write-text-Ana" value="I have climbed a volcano"><select id="ss-write-kind-Ana"><option value="exploit" selected>x</option></select>';
    ssWriteSave('Ana');
    expect(seasonConfig.ssSecrets.Ana.text).toBe('I have climbed a volcano');
    expect(ownSecrets().map(x => x.text)).toContain('I have climbed a volcano');
    // (while Ana keeps it, nobody else is offered it; Ana still sees it)
    expect(ssSecretsBoardHTML().split('Written by you').length - 1).toBe(1);
    // given to somebody else instead
    ssWriteSave('Ana');
    seasonConfig.ssSecrets.Ana = { source: 'pool', text: 'something else' };
    expect(ssSecretsBoardHTML()).toContain('Written by you');
    ssChoose('Ben', 'own:0');
    expect(seasonConfig.ssSecrets.Ben).toMatchObject({ source: 'own', text: 'I have climbed a volcano' });
  });
});
