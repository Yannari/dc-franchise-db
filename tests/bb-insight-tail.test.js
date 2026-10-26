// The closing confessional's history tail is about the two people in the scene, so it only closes a scene about
// them (the user, 2026-10-25: "its like its mixing 2 different conversation": four on the loungers decided Angelica
// can't be trusted, and Baxter's confessional ended "Fatima and I didn't vote the same way in week three").
import { describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { addInsight } from '../js/bb/story/voice.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Baxter', 'Fatima', 'Ivyna', 'Paisley', 'Angelica', 'Vlad'];

function setup() {
  seedGame(NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: 'floater' })), { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(seasonConfig, { format: 'big-brother' });
  // week 3: Baxter and Fatima voted different ways
  gs.bb = { seasonSalt: 3, voiceUsed: {}, weeks: [{ num: 3, hoh: 'Vlad', acts: [{ type: 'eviction', ballots: [{ voter: 'Baxter', evict: 'Ivyna' }, { voter: 'Fatima', evict: 'Paisley' }] }] }] };
}
const scene = (lines, cast, id = 'sc-1') => ({ id, cast, lines: lines.map(([by, text, kind = 'say']) => ({ by, text, kind })) });
const tail = sc => sc.lines.at(-1).text.replace(/^We've decided Angelica is untrustworthy because she told us not to trust people\. Big Brother logic\.\s*/, '');

describe('the history tail', () => {
  it('does not close a scene about somebody else', () => {
    // twenty scenes, so the tail's own dice cannot hide it (it adds one three times in four)
    for (let i = 0; i < 20; i++) {
      setup();
      const sc = scene([['Fatima', 'Okay, is Angelica watching?'], ['Paisley', "No, Angelica's inside."], ['Fatima', 'Okay. So. Angelica told me something weird earlier.'], ['Ivyna', 'What?'],
        ['Fatima', "That we should all be 'careful who we trust'."], ['Baxter', "That's what people say when they're the one you shouldn't trust."],
        ['Paisley', "That's what everyone was going to say."], ['Baxter', "We've decided Angelica is untrustworthy because she told us not to trust people. Big Brother logic.", 'dr']],
      ['Ivyna', 'Fatima', 'Paisley', 'Baxter'], `sc-${i}`);
      addInsight(sc, 'target.gossip', 4);
      expect(tail(sc), `sc-${i}`).toBe('');
    }
  });

  it('still closes a scene between the two of them', () => {
    let added = 0;
    for (let i = 0; i < 20; i++) {
      setup();
      const sc = scene([['Baxter', 'Can I count on you this week?'], ['Fatima', 'You know you can.'], ['Baxter', 'I need to hear it.'], ['Fatima', 'You can.'],
        ['Baxter', 'I believe Fatima. Mostly.', 'dr']], ['Baxter', 'Fatima'], `sc-${i}`);
      addInsight(sc, 'target.lobby', 4);
      if (sc.lines.at(-1).text.length > 'I believe Fatima. Mostly.'.length) added++;
    }
    expect(added).toBeGreaterThan(5);
  });

  // the user, 2026-10-26, on "Michele went bright red... Michele and I keep voting the same way": "theres no correlation"
  it('does not close a flirtation on anything from the game', () => {
    for (let i = 0; i < 20; i++) {
      setup();
      const sc = scene([['Fatima', 'You look really nice today.'], ['Baxter', 'Oh. Thank you.'], ['Fatima', "I don't know why I said that out loud."], ['Baxter', "I'm glad you did."],
        ['Baxter', 'Fatima told me I looked nice. I am going to think about that all day.', 'dr']], ['Fatima', 'Baxter'], `sc-${i}`);
      addInsight(sc, 'showmance.spark', 4);
      expect(sc.lines.at(-1).text, `sc-${i}`).not.toMatch(/vot(e|ed|ing)|week|block|deal|alliance|veto/i);
    }
  });

  // read 2026-10-25: "You voted to keep Brightly, didn't you? ...Yes", closed by "We split our votes last week"
  it('does not close a scene already about the vote on how the two of them voted', () => {
    for (let i = 0; i < 20; i++) {
      setup();
      const sc = scene([['Fatima', "You voted to keep Ivyna, didn't you?"], ['Baxter', "I'm not saying."], ['Fatima', 'That means yes.'], ['Baxter', '...Yes.'],
        ['Fatima', 'Then keep it quiet.'], ['Fatima', 'Baxter is fine as long as nobody finds out.', 'dr']], ['Fatima', 'Baxter'], `sc-${i}`);
      addInsight(sc, 'target.lobby', 4);
      expect(sc.lines.at(-1).text, `sc-${i}`).not.toMatch(/vot(e|ed)|week three/i);
    }
  });
});
