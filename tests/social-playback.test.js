// Watching a night go by, and being able to stop.
//
// The live clock releases posts as the episode reaches them. Two things about
// it were wrong in the same place — the button and the bar:
//
//   PAUSE THREW THE EPISODE AWAY. The play handler passed `fromZero: true`
//   unconditionally, so pausing to read something and pressing play again
//   started the night over. That is the one thing a pause button must not do.
//
//   THE BAR WAS A PICTURE. `<progress>` shows where the episode is and cannot
//   be touched, so there was no way to go and look at minute twenty.
//
// social-page.js is a browser module that runs on load, so this reads the
// source rather than importing it: what is asserted is the wiring — which
// element type, which argument, which event — because those are exactly what
// was wrong.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const PAGE = fs.readFileSync('js/social-page.js', 'utf8');
const HTML = fs.readFileSync('social.html', 'utf8');

/** The body of a named function, for asserting on wiring rather than prose. */
const fnBody = (name, len = 420) => {
  // Declared either way in this file — `function x()` and `const x = …` — and a
  // helper that only knew one form returned an empty string, which passes a
  // `.not.toMatch` and fails a `.toMatch` for the wrong reason entirely.
  let at = PAGE.indexOf(`function ${name}(`);
  if (at === -1) at = PAGE.indexOf(`const ${name} =`);
  return at === -1 ? '' : PAGE.slice(at, at + len);
};
const seekFn = () => fnBody('seekTo', 380);

describe('the reader itself', () => {
  it('finds every function it claims to be reading', () => {
    // An empty string passes `.not.toMatch` and fails `.toMatch` for a reason
    // that has nothing to do with the code — this file is only worth anything
    // if it is actually looking at something.
    for (const name of ['seekTo', 'stopLive', 'startLive', 'paintLive', 'postRow',
      'clockBar', 'snippet']) {
      expect(fnBody(name), `${name} was never found`).not.toBe('');
    }
  });
});

describe('pause and play', () => {
  it('does not restart the episode when you press play again', () => {
    const handler = PAGE.slice(PAGE.indexOf("t.id === 'btn-live'"),
      PAGE.indexOf("t.id === 'btn-live'") + 420);
    // The bug, exactly: `startLive(true)` on every press.
    expect(handler, 'play still forces the episode back to zero')
      .not.toMatch(/startLive\(true\)/);
    // Resumes from the clock, and only starts over from the end.
    expect(handler).toMatch(/startLive\(S\.clock >= EPISODE_MS\)/);
  });

  it('still stops the timer when paused', () => {
    expect(PAGE).toMatch(/function stopLive\(\)[\s\S]{0,160}clearInterval/);
    expect(PAGE).toMatch(/if \(S\.live\) \{ stopLive\(\); render\(\); \}/);
  });

  it('leaves the clock where it stopped', () => {
    // `stopLive` must not touch S.clock — that is what makes resume possible.
    const fn = PAGE.slice(PAGE.indexOf('function stopLive()'),
      PAGE.indexOf('function stopLive()') + 200);
    expect(fn).not.toMatch(/S\.clock\s*=/);
  });
});

describe('the scrub bar', () => {
  it('is a control, not a picture', () => {
    expect(PAGE, 'the bar is still a <progress> and cannot be dragged')
      .toMatch(/<input type="range" id="clock-bar"/);
    expect(PAGE).toMatch(/max="\$\{EPISODE_MS\}"/);
  });

  it('is wired to the event a range input actually fires', () => {
    // The delegated click handler never sees a drag.
    expect(PAGE).toMatch(/addEventListener\('input'[\s\S]{0,220}clock-bar[\s\S]{0,80}seekTo/);
  });

  it('treats everything before the new time as already read', () => {
    // Dragging to minute twenty and being told there are four hundred new
    // posts is not what the handle means.
    const fn = seekFn();
    expect(fn).toMatch(/S\.seen = visible\(\)\.length/);
    // And it cannot be dragged off either end of the episode.
    expect(fn).toMatch(/Math\.max\(0, Math\.min\(EPISODE_MS/);
  });

  it('pauses when you take hold of it', () => {
    // Somebody who grabs the handle has stopped watching and started looking.
    // Leaving the clock running means the thing they dragged to has already
    // moved on by the time they let go.
    const fn = seekFn();
    expect(fn, 'scrubbing does not stop the clock').toMatch(/stopLive\(\)/);
    // And it stops BEFORE the clock is moved, so the tick cannot overwrite it.
    expect(fn.indexOf('stopLive()')).toBeLessThan(fn.indexOf('S.clock = to'));
  });

  it('does not fight the reader while the clock is running', () => {
    // The tick writes the handle back every second; during a drag that would
    // pull it out of the reader's hand.
    const fn = PAGE.slice(PAGE.indexOf('function paintLive()'),
      PAGE.indexOf('function paintLive()') + 700);
    expect(fn).toMatch(/activeElement !== bar/);
    expect(fn).toMatch(/:active/);
  });

  it('is big enough to grab and visible enough to find', () => {
    expect(HTML).toMatch(/\.clock-scrub\{[^}]*height:26px/);
    expect(HTML).toMatch(/clock-scrub::-webkit-slider-thumb\{[^}]*width:20px/);
    expect(HTML).toMatch(/clock-scrub::-moz-range-thumb\{[^}]*width:20px/);
    // Keyboard users get the handle too, and can see where it is.
    expect(HTML).toMatch(/\.clock-scrub:focus-visible/);
    expect(PAGE).toMatch(/aria-valuetext/);
  });
});

describe('the transport works while paused', () => {
  it('does not start playing when you pick a speed', () => {
    // A paused player whose transport controls restart it is one you cannot
    // set up before watching. It used to call `startLive(false)` on any speed.
    const at = PAGE.indexOf("t.dataset.speed === 'instant'");
    const handler = PAGE.slice(at, at + 520);
    expect(handler, 'choosing a speed still un-pauses').not.toMatch(/startLive\(/);
    expect(handler).toMatch(/S\.speed = Number\(t\.dataset\.speed\)/);
  });

  it('keeps the bar on the page whether or not it is running', () => {
    // The scrubber is part of the clock bar, which renders in both states —
    // a transport that disappears when you pause is not a transport.
    const bar = fnBody('clockBar', 900);
    expect(bar).toMatch(/id="clock-bar"/);
    expect(bar).toMatch(/S\.live \? '⏸ Pause' : '▶ Watch Live'/);
  });
});

describe('a reply says what it is answering', () => {
  it('makes the handle a link to the post being replied to', () => {
    // "Replying to @somebody" was dead text, so a reply named a post the
    // reader had no way to reach — the one thing every timeline gives you.
    const row = fnBody('postRow', 1600);
    expect(row).toMatch(/Replying to <a href="#" data-thread="\$\{esc\(parent\.id\)\}"/);
  });

  it('quotes enough of the parent to recognise it', () => {
    const row = fnBody('postRow', 1600);
    expect(row).toMatch(/class="quoted"/);
    expect(row).toMatch(/snippet\(parent\.text\)/);
    // Reachable by keyboard, and announced as what it is.
    expect(row).toMatch(/tabindex="0"/);
    expect(row).toMatch(/role="link"/);
  });

  it('keeps the quote short, so the reply stays the card you are reading', () => {
    const fn = fnBody('snippet', 260);
    expect(fn).toMatch(/max = 96/);
    expect(fn, 'a cut-off quote must not end mid-word').toMatch(/replace\(/);
  });

  it('is wired to open that conversation', () => {
    expect(PAGE).toMatch(/\[data-thread\]/);
    const at = PAGE.indexOf('if (t.dataset.thread)');
    expect(at, 'nothing handles the link').toBeGreaterThan(-1);
    const handler = PAGE.slice(at, at + 420);
    expect(handler).toMatch(/S\.thread = t\.dataset\.thread/);
    // Opening a conversation is not the moment to still be filtered to one
    // account or one houseguest.
    expect(handler).toMatch(/S\.persona = null/);
    expect(handler).toMatch(/S\.subject = null/);
  });

  it('is styled as something you can press', () => {
    expect(HTML).toMatch(/\.quoted\{[^}]*cursor:pointer/);
    expect(HTML).toMatch(/\.quoted:focus-visible/);
    expect(HTML).toMatch(/\.replying a\{/);
  });
});
