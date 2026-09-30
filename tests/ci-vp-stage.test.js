// @vitest-environment jsdom
// ci-vp-stage.test.js — what the Circle stage draws at each step (Plan 5).
import { describe, expect, it } from 'vitest';
import { stageInner } from '../js/vp-ci/stage.js';

const row = {
  num: 3, day: 3,
  ci: {
    active: ['@maddie', '@bri', '@brody'],
    profiles: {
      '@maddie': { name: 'Maddie', people: ['Alejandro'], mode: 'catfish', face: null },
      '@bri': { name: 'Bridgette', people: ['Bridgette'], mode: 'honest', face: 'portrait:Bridgette' },
      '@brody': { name: 'Brody', people: ['Brody'], mode: 'honest', face: 'portrait:Brody' },
    },
  },
};
const chat = { stage: 'apt', kind: 'chat', title: 'Private chat', cast: ['@maddie', '@bri'], steps: [
  { who: '@maddie', part: 'say', text: "She's fishing about Brody." },
  { who: '@maddie', part: 'send', text: 'girl… between us? not fully #HeartOnMySleeve', spoken: 'Message: "girl… between us? not fully." Send.' },
  { who: '@bri', part: 'react', text: 'Not fully?! Okay.' },
  { who: null, part: 'stage', text: 'Bridgette stares at the screen.' },
] };
const dom = html => { const d = document.createElement('div'); d.innerHTML = html; return d; };

describe('the apartments', () => {
  it('at rest: the first apartment, no line yet', () => {
    const d = dom(stageInner(row, chat, -1));
    expect(d.querySelector('.civ-dlg')).toBeNull();
    expect(d.querySelector('.civ-bust').dataset.cam).toMatch(/ALEJANDRO/);
  });

  it('a catfish: the cam shows who is really there, the badge and the plate show the persona', () => {
    const d = dom(stageInner(row, chat, 0, true));
    expect(d.querySelector('.civ-bust').dataset.cam).toMatch(/ALEJANDRO/);
    expect(d.querySelector('.civ-catfish').textContent).toMatch(/Playing as "Maddie"/);
    expect(d.querySelector('.civ-plate').textContent).toMatch(/Alejandro.*as Maddie/);
    expect(d.querySelector('.civ-line').textContent).toMatch(/SAYS ALOUD.*fishing/);
  });

  it('a sent line: the dictation, the push, the send; the message lands on the TV at the next step', () => {
    const d = dom(stageInner(row, chat, 1, true));
    expect(d.querySelector('.civ-apt').className).toMatch(/push/);
    expect(d.querySelector('.civ-line').textContent).toMatch(/TO THE CIRCLE.*Message:/);
    expect(d.querySelector('.civ-box').dataset.type).toMatch(/not fully/);
    // the other apartment, next: a cut, a ping, and the message on its TV under the persona's name
    const e = dom(stageInner(row, chat, 2, true));
    expect(e.querySelector('.civ-bust').dataset.cam).toMatch(/BRIDGETTE/);
    expect(e.querySelector('.civ-wipe')).toBeTruthy();
    expect(e.querySelector('.civ-ping')).toBeTruthy();
    expect(e.querySelector('.civ-tvset .civ-msg .nm').textContent).toBe('Maddie');
    expect(e.querySelector('.civ-tvset .civ-ht').textContent).toBe('#HeartOnMySleeve');
  });

  it('a stage direction stays in the room of the last speaker, with no name plate', () => {
    const d = dom(stageInner(row, chat, 3, true));
    expect(d.querySelector('.civ-bust').dataset.cam).toMatch(/BRIDGETTE/);
    expect(d.querySelector('.civ-plate')).toBeNull();
    expect(d.querySelector('.civ-line.stage').textContent).toMatch(/stares/);
  });

  it('going back draws the same picture (no animation when not fresh)', () => {
    expect(stageInner(row, chat, 2, false)).not.toMatch(/civ-wipe run|civ-ping/);
  });
});

describe('the Circle, full screen', () => {
  const group = { stage: 'ui', kind: 'circle-chat', title: 'Circle Chat', cast: ['@maddie', '@bri', '@brody'], steps: [
    { who: null, host: true, part: 'host', text: 'Circle Chat is open.' },
    { who: '@bri', part: 'send', text: 'Who else just got the ALERT?? #RatingsDay' },
    { who: '@brody', part: 'say', text: 'I am not ready for this.' },
    { who: '@maddie', part: 'send', text: 'Shaking. #NoFakeVibes' },
  ] };
  it('messages pile up in the feed; the newest types, then springs in', () => {
    const d = dom(stageInner(row, group, 3, true));
    expect([...d.querySelectorAll('.civ-feed .civ-msg .nm')].map(x => x.textContent)).toEqual(['Bridgette', 'Maddie']);
    expect(d.querySelector('.civ-feed .civ-typing')).toBeTruthy();
    expect(d.querySelector('.civ-tile.talk .n').textContent).toBe('MADDIE');
  });
  it('the host is a caption; a line said aloud is the speaker\'s cam, picture in picture', () => {
    expect(dom(stageInner(row, group, 0, true)).querySelector('.civ-cap.host').textContent).toMatch(/Circle Chat is open/);
    const d = dom(stageInner(row, group, 2, true));
    expect(d.querySelector('.civ-pip .bub').textContent).toMatch(/BRODY SAYS ALOUD.*not ready/);
  });
});

describe('ALERT', () => {
  const alert = { stage: 'alert', kind: 'alert', title: 'An alert', cast: [], steps: [{ who: null, host: true, part: 'host', text: 'The ratings are now open.' }] };
  it('slams in on its first line, and the building lights up behind it', () => {
    const d = dom(stageInner(row, alert, 0, true));
    expect(d.querySelector('.civ-alert').className).toMatch(/go/);
    expect(d.querySelectorAll('.civ-building .civ-win')).toHaveLength(3);
    expect(d.querySelector('.civ-alertSub').textContent).toMatch(/ratings are now open/);
  });
});

describe('you always know where you are', () => {
  it('a private chat keeps its window on screen: who it is between, and the thread so far', () => {
    const d = dom(stageInner(row, chat, 2, true));
    const win = d.querySelector('.civ-chatwin');
    expect(win.querySelector('.civ-chatwin-hd').textContent).toMatch(/PRIVATE CHAT.*Maddie.*Bridgette/);
    expect(win.querySelectorAll('.civ-msg')).toHaveLength(1);
    // a line said aloud before anything was sent: the window is there, empty, and says so
    expect(dom(stageInner(row, chat, 0, true)).querySelector('.civ-chatwin').textContent).toMatch(/No messages yet/);
  });
  it('every screen says what it is in the corner', () => {
    expect(dom(stageInner(row, chat, 0)).querySelector('.civ-where').textContent).toMatch(/PRIVATE CHAT/);
    const group = { stage: 'ui', kind: 'circle-chat', title: 'Circle Chat', cast: ['@maddie', '@bri'], steps: [{ who: '@bri', part: 'send', text: 'hi' }] };
    expect(dom(stageInner(row, group, 0)).querySelector('.civ-where').textContent).toMatch(/CIRCLE CHAT/);
    const life = { stage: 'apt', kind: 'life', title: 'Alone in the apartment', cast: ['@bri'], steps: [{ who: '@bri', part: 'say', text: 'I miss my dog.' }] };
    const d = dom(stageInner(row, life, 0));
    expect(d.querySelector('.civ-where').textContent).toMatch(/IN THE APARTMENT/);
    expect(d.querySelector('.civ-chatwin')).toBeNull();
  });
  it('Next is on the stage itself', () => {
    expect(dom(stageInner(row, chat, 0)).querySelector('.civ-nextbtn')).toBeNull(); // drawn by the screen, not the stage
  });
});
