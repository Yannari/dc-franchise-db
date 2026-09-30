// @vitest-environment jsdom
// ci-vp-arrive.test.js — Meet the players (user, 2026-09-30: "yes build it").
// A player walks in: the viewer meets who they really are (name, age, job,
// hometown, and their fame when they have any), hears their plan, and watches
// the profile the room will see get built on their TV. A reaction is somebody
// else's apartment looking at that PROFILE: they never see the real person.
import { describe, expect, it } from 'vitest';
import { circleScreens } from '../js/vp-ci/steps.js';
import { stageInner } from '../js/vp-ci/stage.js';

const row = {
  num: 1, day: 1,
  ci: {
    active: ['@kayla', '@dawn', '@alejandro'],
    profiles: {
      '@kayla': { name: 'Kayla', people: ['Riot'], mode: 'catfish', face: null, age: 22, job: 'college student', status: 'Single', reason: 'experimental', bio: 'Psych major, senior year.' },
      '@dawn': { name: 'Dawn', people: ['Dawn'], mode: 'honest', face: 'portrait:Dawn', age: 25, job: null, status: 'Single', reason: null, bio: null },
      '@alejandro': { name: 'Alejandro', people: ['Alejandro'], mode: 'polished', face: 'portrait:Alejandro', age: 27, job: 'model', status: 'Single', reason: null, bio: null },
    },
    cast: {
      Riot: { age: 39, job: 'tattoo artist', hometown: 'Detroit, Michigan', rep: 'none', stars: null },
      Dawn: { age: 25, job: null, hometown: null, rep: 'none', stars: null },
      Alejandro: { age: 27, job: 'model', hometown: 'Madrid', rep: 'celebrity', stars: 4.5 },
    },
    aired: [
      { id: 's1', kind: 'profiles', who: ['@kayla', '@dawn', '@alejandro'], script: { blocks: [
        { key: 'host.cold.first', lines: [{ who: 'host', kind: 'host', text: 'Welcome to the Circle!' }] },
        { key: 'profile.catfish', lines: [{ who: '@kayla', kind: 'say', text: 'So meet Kayla.' }], beat: 'Riot grins at the screen.' },
        { key: 'profile.honest', lines: [{ who: '@dawn', kind: 'say', text: "I'm playing as myself." }] },
        { key: 'profile.polished', lines: [{ who: '@alejandro', kind: 'say', text: 'Good lighting never hurt anybody.' }] },
      ] } },
      { id: 's2', kind: 'arrival', who: ['@kayla'], script: { blocks: [
        { key: 'arrival', lines: [{ who: '@kayla', kind: 'react', text: "I'm in the Circle!" }] },
        { key: 'arrival.react', lines: [{ who: '@dawn', kind: 'react', text: 'A new player. Great.' }] },
      ] } },
      { id: 's3', kind: 'pair-arrival', who: ['@kayla', '@dawn'], script: { blocks: [
        { key: 'pairarrival.chat', lines: [{ who: '@kayla', kind: 'send', text: 'hey partner' }] },
      ] } },
    ],
  },
};
const dom = html => { const d = document.createElement('div'); d.innerHTML = html; return d; };
const [profiles, arrival, pair] = circleScreens(row);

describe('the steps know whose arrival each line belongs to', () => {
  it('profiles and arrivals play on the arrival stage; two newcomers chatting play in the apartments', () => {
    expect(profiles.stage).toBe('arrive');
    expect(arrival.stage).toBe('arrive');
    expect(pair.stage).toBe('apt');
  });
  it('each line carries the player it introduces, and the first line of each player is their entrance', () => {
    expect(profiles.steps.map(s => s.about)).toEqual([null, '@kayla', '@kayla', '@dawn', '@alejandro']);
    expect(profiles.steps.map(s => !!s.entry)).toEqual([true, true, false, true, true]);
  });
  it('a reaction is about the newcomer, spoken by somebody else', () => {
    const react = arrival.steps[1];
    expect(react).toMatchObject({ who: '@dawn', about: '@kayla', entry: true });
  });
});

describe('meet the players', () => {
  it('before the first line: the title card, and nobody introduced yet', () => {
    const d = dom(stageInner(row, profiles, -1));
    expect(d.querySelector('.civ-arrive').textContent).toMatch(/MEET THE PLAYERS/);
    expect(d.querySelectorAll('.civ-roll .on')).toHaveLength(0);
  });

  it('the host opens it over the title card', () => {
    const d = dom(stageInner(row, profiles, 0, true));
    expect(d.querySelector('.civ-cap.host').textContent).toMatch(/Welcome/);
    expect(d.querySelector('.civ-id')).toBeNull();
  });

  it('a catfish walks in: the real person, their plan, and the persona built on the TV', () => {
    const d = dom(stageInner(row, profiles, 1, true));
    const id = d.querySelector('.civ-id').textContent;
    expect(id).toMatch(/Riot/);
    expect(id).toMatch(/39/);
    expect(id).toMatch(/tattoo artist/);
    expect(id).toMatch(/Detroit, Michigan/);
    expect(d.querySelector('.civ-fame')).toBeNull();                // nobody knows Riot
    const plan = d.querySelector('.civ-planchip').textContent;
    expect(plan).toMatch(/CATFISH/);
    expect(plan).toMatch(/Kayla, 22, college student/);
    expect(d.querySelector('.civ-why').textContent).toMatch(/see how the room treats somebody else/);
    const card = d.querySelector('.civ-pcard').textContent;
    expect(card).toMatch(/KAYLA/);
    expect(card).toMatch(/22/);
    expect(card).toMatch(/Single/);
    expect(card).toMatch(/Psych major/);
    expect(card).not.toMatch(/Riot/);                                 // the profile never shows the real person
    expect(d.querySelector('.civ-arrive').classList.contains('build')).toBe(true);
    expect(d.querySelector('.civ-line').textContent).toMatch(/So meet Kayla/);
  });

  it('the second line of the same player: the same card, not built again', () => {
    const d = dom(stageInner(row, profiles, 2, true));
    expect(d.querySelector('.civ-id').textContent).toMatch(/Riot/);
    expect(d.querySelector('.civ-arrive').classList.contains('build')).toBe(false);
    expect(d.querySelector('.civ-line').textContent).toMatch(/grins/);
  });

  it('playing as themselves says so', () => {
    const d = dom(stageInner(row, profiles, 3, true));
    expect(d.querySelector('.civ-planchip').textContent).toMatch(/AS THEMSELVES/);
    expect(d.querySelector('.civ-why')).toBeNull();
  });

  it('a celebrity: the fame on their card, in stars and a word', () => {
    const d = dom(stageInner(row, profiles, 4, true));
    const fame = d.querySelector('.civ-fame').textContent;
    expect(fame).toMatch(/CELEBRITY/);
    expect(fame).toMatch(/★★★★½/);
    expect(d.querySelector('.civ-planchip').textContent).toMatch(/AS THEMSELVES/);
  });

  it('an edited profile: the viewer is told what was changed, and the card shows the changed facts', () => {
    const edited = structuredClone(row);
    Object.assign(edited.ci.profiles['@dawn'], { mode: 'edited', edits: ['age', 'status', 'fame'], age: 23 });
    const d = dom(stageInner(edited, profiles, 3, true));
    expect(d.querySelector('.civ-planchip').textContent).toMatch(/A FEW THINGS CHANGED/);
    expect(d.querySelector('.civ-why').textContent).toMatch(/age, relationship status\. Left their TV past off it\./);
    expect(d.querySelector('.civ-id').textContent).toMatch(/25/);       // who she is
    expect(d.querySelector('.civ-pcard').textContent).toMatch(/23/);    // what the room sees
  });

  it('the roll fills as they are introduced', () => {
    const d = dom(stageInner(row, profiles, 4));
    expect(d.querySelectorAll('.civ-roll .on')).toHaveLength(3);
    expect(d.querySelector('.civ-roll .cur')).not.toBeNull();
  });
});

describe('a new player, seen from another apartment', () => {
  it('the reaction: the watcher on camera, the newcomer as the PROFILE on their TV', () => {
    const d = dom(stageInner(row, arrival, 1, true));
    expect(d.querySelector('.civ-watch').dataset.cam).toMatch(/DAWN/);
    expect(d.querySelector('.civ-pcard').textContent).toMatch(/KAYLA/);
    expect(d.querySelector('.civ-arrive').textContent).not.toMatch(/Riot|tattoo/);
    expect(d.querySelector('.civ-line').textContent).toMatch(/A new player/);
    expect(d.querySelector('.civ-arrive').textContent).toMatch(/A NEW PLAYER/);
  });
});

describe('the text backlog says what the arrival screen says', () => {
  it('each player is introduced before their lines: who they are, their fame, their plan', async () => {
    const { episodeText } = await import('../js/ci/transcript.js');
    const t = episodeText(row);
    expect(t).toMatch(/MEET RIOT: 39, tattoo artist, from Detroit, Michigan\. Playing as Kayla, 22, college student: a catfish \(experimental\)\./);
    expect(t).toMatch(/MEET DAWN: 25\. Playing as themselves\./);
    expect(t).toMatch(/MEET ALEJANDRO: 27, model, from Madrid\. A celebrity \(★★★★½\)\. Playing as themselves, best photos only\./);
    expect(t.indexOf('MEET RIOT')).toBeLessThan(t.indexOf('So meet Kayla'));
    // the reaction is not a second introduction
    expect(t.match(/MEET RIOT/g)).toHaveLength(2);   // the profiles, and her own arrival
  });
});

describe('a face they know', () => {
  it('the watcher is in their apartment, and the face they know is on their TV', () => {
    const r = structuredClone(row);
    r.ci.aired = [{ id: 'r1', kind: 'recognise', who: ['@dawn'], about: '@alejandro', script: { blocks: [
      { key: 'recognise.celebrity', lines: [{ who: '@dawn', kind: 'react', text: "That's Alejandro." }] }] } }];
    const [sc] = circleScreens(r);
    expect(sc.stage).toBe('apt');
    expect(sc.cast).toContain('@alejandro');
    const d = dom(stageInner(r, sc, 0, true));
    expect(d.querySelector('.civ-bust').dataset.cam).toMatch(/DAWN/);
    expect(d.querySelector('.civ-tvset .civ-pcard').textContent).toMatch(/ALEJANDRO/);
  });
});
