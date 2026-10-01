// ci-vp-chat.test.js: the chat on a Circle screen acts like a chat.
// User (2026-09-30): "the part of the screen with the chat should act like it".
// It used to redraw the last 4-5 messages on every click (older ones simply
// vanished), drew everyone on the same side, and the reaction pop-up sat on
// top of the newest message.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const src = readFileSync('js/vp-ci/stage.js', 'utf8');
const css = readFileSync('js/vp-ci/style.js', 'utf8');

describe('the chat', () => {
  it('keeps the whole thread (no window of the last few)', () => {
    expect(src).not.toMatch(/shown\.slice\(-/);
    expect(src).toMatch(/class="civ-thread"/);
  });
  it('draws the screen owner on the right, with a Seen / Delivered tick', () => {
    expect(src).toMatch(/mine \? 'mine' : ''/);
    expect(src).toMatch(/✓✓ Seen/);
    expect(css).toMatch(/\.civ-msg\.mine\{flex-direction:row-reverse\}/);
  });
  it('scrolls, keeps its place across a click, and glides to the newest message', () => {
    expect(css).toMatch(/\.civ-feed,\.civ-chatwin-feed\{overflow-y:auto/);
    expect(src).toMatch(/f\.scrollTop = was\[i\]/);
    expect(src).toMatch(/scrollTo\(\{ top: f\.scrollHeight/);
  });
  it('the aloud / reaction pop-up sits clear of the messages', () => {
    expect(css).toMatch(/\.civ-pip\{left:auto!important;right:1\.5%/);
  });
});
