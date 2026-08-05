// America's Nominee: where the screen sits, and what it looks like.
//
// TWO reported problems, one of them a real spoiler.
//
// The engine seats the third chair while it is still working out the block, so
// the act lands BEFORE the nominations act — and the visual player draws
// screens in act order. That meant the twist named a houseguest on the block
// before the ceremony had turned a single key.
//
// And the screen itself drew abstract chairs with text names on them. This is
// the format whose entire iconography is a wall of photographs turning red;
// the one screen about a photograph nobody can account for should have faces
// on it.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { rpBuildBBAmericasNominee } from '../js/vp-bb-americas-nominee.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer'][i % 4],
}));

function house(twists = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = twists;
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.showmances = []; gs.namedAlliances = []; gs.jury = [];
  gs.episode = 0;
}
afterAll(() => { seasonConfig.twistSchedule = []; delete seasonConfig.format; });

function playIt() {
  for (let seed = 1; seed <= 25; seed++) {
    house([{ id: 't1', episode: 1, type: 'bb-americas-nominee' }]);
    const ep = withSeededRandom(seed * 7, () => simulateBBEpisode());
    if ((ep.acts || []).some(a => a.type === 'americas-nominee')) return ep;
  }
  return null;
}

describe('it does not spoil the ceremony it belongs to', () => {
  it('draws after the nomination ceremony, not before it', () => {
    const ep = playIt();
    expect(ep, 'no America\u2019s Nominee week in 25 seeds').toBeTruthy();

    // The act really does come first — that is the engine's ordering, and the
    // fix is in the screen builder rather than in the week.
    const acts = (ep.acts || []).map(a => a.type);
    expect(acts.indexOf('americas-nominee'),
      'the engine stopped seating the third chair early; this guard can be simplified')
      .toBeLessThan(acts.indexOf('nominations'));

    const labels = (buildVPScreens(ep) || []).map(s => s.label);
    const twist = labels.indexOf("America's Nominee");
    const noms = labels.indexOf('Nomination Ceremony');
    expect(twist, 'the twist screen vanished').toBeGreaterThan(-1);
    expect(noms).toBeGreaterThan(-1);
    expect(twist, 'the third nominee was named before the ceremony turned a key')
      .toBeGreaterThan(noms);
  });
});

describe('it looks like Big Brother', () => {
  it('puts real faces on the wall', () => {
    const ep = playIt();
    const act = (ep.acts || []).find(a => a.type === 'americas-nominee');
    const deps = {
      tvState: _tvState, reveal: (e, k, i) => `_r('${k}',${i})`,
      esc: v => String(v ?? ''), avatar: n => `<img data-hg="${n}">`,
    };
    rpBuildBBAmericasNominee(ep, act, deps);
    const key = Object.keys(_tvState).find(k => k.includes('an'));
    if (key) _tvState[key].idx = 99;
    const html = rpBuildBBAmericasNominee(ep, act, deps);

    expect(html, 'no avatars on a screen about a photograph').toMatch(/data-hg=/);
    expect(html).toContain(act.nominee);
    // The wall, not three abstract chairs with text in them.
    expect(html).toMatch(/bban-wall/);
    expect(html).toMatch(/bban-frame/);
    // The nameplate under the third photograph is redacted — that IS the twist.
    expect(html).toMatch(/bban-redact/);
  });
});
