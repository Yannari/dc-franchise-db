// A paragraph of narration with quotations is split into lines, and each line goes to the person who said it.
// (the user, 2026-10-31, of the jury house: "why is he asking and answering his own question")
import { describe, it, expect } from 'vitest';
import { proseSteps } from '../js/vp-bb-ep/steps.js';

const says = steps => steps.filter(s => s.k === 'say').map(s => `${s.by}: ${s.t}`);

describe('proseSteps gives each quotation to its speaker', () => {
  it('a question, then an answer attributed after it', () => {
    const out = says(proseSteps(`"Okay. What's it like in there now?" Lacey asks. "It's Angelica's house," Ben says. "Nobody's watching her."`, ['Lacey', 'Ben', 'Angelica']));
    expect(out).toEqual([
      "Lacey: Okay. What's it like in there now?",
      "Ben: It's Angelica's house. Nobody's watching her.",
    ]);
  });

  it('the vote question, with the answer on its own', () => {
    const out = says(proseSteps(`"Who do you want to win?" Fatima asks. "Michele," Ben says. "Michele's won five competitions."`, ['Fatima', 'Ben', 'Michele']));
    expect(out).toEqual(['Fatima: Who do you want to win?', "Ben: Michele. Michele's won five competitions."]);
  });

  it('a line broken by its own attribution stays one line', () => {
    const out = says(proseSteps(`"Before we go any further," Hicks says, "let's look at week one."`, ['Hicks', 'Mia']));
    expect(out).toEqual(["Hicks: Before we go any further, let's look at week one."]);
  });

  it('somebody named after the attribution, as a new sentence, speaks next', () => {
    const out = says(proseSteps(`"Who's the one to beat?" Lacey asks. Ben doesn't have to think. "Angelica."`, ['Lacey', 'Ben', 'Angelica']));
    expect(out).toEqual(["Lacey: Who's the one to beat?", 'Ben: Angelica.']);
  });
});
