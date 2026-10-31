// Somebody who is not in the room is named once, then "he", "she" or "they" (the user, 2026-10-31, of a kitchen talk
// that said "Ben" six lines running: "they're saying Ben's name too much, use pronouns").
import { describe, expect, it } from 'vitest';
import { players, setPlayers } from '../js/core.js';
import { topicPronouns, said } from '../js/bb/script/write.js';

const CAST = [
  { name: 'Ben', gender: 'm' }, { name: 'Michele', gender: 'f' }, { name: 'Ivyna', gender: 'f' },
  { name: 'Baxter', gender: 'm' }, { name: 'Sky', gender: 'nb' },
];

function withCast(fn) {
  const before = players.slice();
  setPlayers(CAST.map(p => ({ ...p })));
  try { return fn(); } finally { setPlayers(before); }
}
const say = (by, text) => ({ kind: 'say', by, text });

describe('a conversation about somebody who is not there', () => {
  it('says the name once, then the pronoun', () => withCast(() => {
    const out = topicPronouns([
      { kind: 'beat', by: null, text: "Kitchen. Ivyna is washing a mug that was Ben's favourite. Michele notices." },
      say('Michele', "That's Ben's mug."),
      say('Ivyna', "It was. I didn't want to just shove it in the cupboard."),
      say('Michele', 'Do you feel bad?'),
      say('Ivyna', 'About the vote? A bit. About the game? No.'),
      say('Michele', 'Ben will want to know why.'),
      say('Ivyna', "Then Ben can ask me at the end. If I'm there."),
      { kind: 'beat', by: null, text: 'And then, lower:' },
      say('Ivyna', 'Ben would want you to keep going.'),
      { kind: 'dr', by: 'Ivyna', text: 'I voted Ben out.' },
    ]).map(l => l.text);
    expect(out[1]).toBe("That's Ben's mug.");
    expect(out[5]).toBe('He will want to know why.');
    expect(out[6]).toBe("Then he can ask me at the end. If I'm there.");
    expect(out[8]).toBe('He would want you to keep going.');
    // a confessional is said to the camera: the name again
    expect(out[9]).toBe('I voted Ben out.');
  }));

  it('keeps the name when another person is named, called out, or joined to someone', () => withCast(() => {
    const keep = (lines) => topicPronouns(lines).map(l => l.text);
    expect(keep([say('Michele', 'Ben left.'), say('Ivyna', 'Ben and Baxter were close.')])[1]).toBe('Ben and Baxter were close.');
    expect(keep([say('Michele', 'Ben left.'), say('Ivyna', 'Ben, Sky and I had a deal.')])[1]).toBe('Ben, Sky and I had a deal.');
    // two people out of the room: no pronoun can say which
    expect(keep([say('Michele', 'Ben and Sky were a pair.'), say('Ivyna', 'Ben will be angry.')])[1]).toBe('Ben will be angry.');
  }));

  it('turns a "they" only where the verb does not change', () => withCast(() => {
    const t = (line) => topicPronouns([say('Michele', 'Sky is gone.'), say('Ivyna', line)])[1].text;
    expect(t('Sky would understand.')).toBe('They would understand.');
    expect(t('Sky is going to be angry.')).toBe('Sky is going to be angry.');
    expect(t("Sky's mug is still here.")).toBe('Their mug is still here.');
  }));

  it('in one confessional, the second sentence takes the pronoun', () => withCast(() => {
    expect(said('dr', 'I voted Ben out. Now Ben gets a vote on me.')).toBe('I voted Ben out. Now he gets a vote on me.');
  }));
});
