// ══════════════════════════════════════════════════════════════════════
// pm/talk/more/just-friends-final.js — a couple of friends at the final
// ══════════════════════════════════════════════════════════════════════
//
// Two who called it off as friends (pm/just-friends.js) and reached the final
// anyway, coupled for safety: their date, their (short) film and their
// declarations are about a friendship, never a love story. The engine marks
// them `mates` on the date and `of: 'just-friends'` on the rest (moments.js
// final, journey.js finalDate). Every slot has its own entry, so nothing
// romantic is drawn in their place.
const M = { of: ['sunset', 'yacht', 'picnic', 'rooftop'], mates: true };
const J = { of: 'just-friends' };
const JD = { of: 'just-friends', mates: true };

export const FINAL_DATE_MATES = {
  moves: {
    arrive: [
      { when: M, stage: "A table for two, candles, the works. {a} and {b} take one look at it and start laughing.", turns: [
        ['a', "They know we're just friends, right?"],
        ['b', "Somebody didn't get the memo. Sit down. Enjoy the free dinner."],
      ] },
      { when: M, stage: "{a} and {b} arrive at the last date of the summer, together, as friends.", turns: [
        ['b', "Well. Here we are. The least romantic final date in history."],
        ['a', "Speak for yourself. I've brought my best shirt."],
      ] },
    ],
    talk: [
      { when: M, turns: [
        ['a', "Can I say something without it getting weird?"],
        ['b', "That depends what it is."],
        ['a', "I'm glad it was you I ended up in here with. Not as a couple. Just, I'm glad it was you."],
        ['b', "That's not weird. That's nice. Don't make it weird now."],
      ] },
      { when: M, turns: [
        ['b', "Did you ever think, when we called it off, that we'd end up at the final together?"],
        ['a', "Not for a second. I thought you'd never speak to me again."],
        ['b', "I nearly didn't. You're very hard to stay angry at."],
      ] },
    ],
    future: [
      { when: M, turns: [
        ['a', "When we're out, you're coming to my birthday. That's not optional."],
        ['b', "Only if I get to bring whoever I'm dating by then."],
        ['a', "Deal. I'll vet them."],
      ] },
    ],
    land: [
      { when: M, turns: [['a', "To us. The friends who made the final."]], beat: "They clink glasses, and for once, nobody is pretending." },
      { when: M, turns: [], beat: "{b} steals the last of {a}'s dessert, and {a} lets {b.obj}." },
    ],
  },
};

export const JOURNEY_OPEN_MATES = {
  moves: {
    screen: [
      { when: J, stage: "A screen lights up with their names. Their film is short, and most of it is the two of them laughing.", turns: [
        ['b', "Oh, they've kept the bit where we called it off."],
        ['a', "Of course they have. It's the best bit."],
      ] },
    ],
  },
};

export const JOURNEY_END_MATES = {
  moves: {
    say: [
      { when: JD, turns: [['b', "We were rubbish as a couple, weren't we?"], ['a', "Terrible. Best thing we ever did was stop."], ['b', "And here we are anyway."]] },
      { when: JD, turns: [['a', "I didn't get a love story out of this place."], ['b', "No. You got me instead."], ['a', "Yeah. That'll do."]] },
    ],
    land: [
      { when: JD, turns: [], beat: "{a} puts an arm round {b}'s shoulders, the way you would with your oldest friend." },
    ],
  },
};

export const DECLARATION_MATES = {
  moves: {
    story: [
      { when: { ...JD, said: true }, turns: [
        ['a', "{b}, everyone here knows we're not a love story. We tried, and it wasn't there, and I was the one who said it. You could have hated me for that. You didn't. You became my best friend in this villa instead. I came here looking for love, and I'm leaving with a friend for life. I'll take that."],
      ] },
      { when: { ...JD, said: false }, turns: [
        ['a', "{b}, when you told me we were better as friends, I didn't want to hear it. I was hurt, and I thought that was the end of us. It wasn't. It was the start of the best friendship I've made in here. You were right, and I'm only a little bit annoyed about it."],
      ] },
      { when: JD, turns: [
        ['a', "I'm not going to stand here and pretend. We're friends. That's what we are, and that's what we're going to be when we walk out. But I want everyone to know that I couldn't have got through this summer without you."],
      ] },
    ],
    feel: [
      { when: JD, turns: [['a', "You're the first person I look for when something happens in here. Good or bad. You're the one I want to tell."]] },
      { when: JD, turns: [['a', "You've been the person I talk to at two in the morning. The one who tells me when I'm being an idiot. The one who never once made it awkward, even when it should have been."]] },
    ],
    future: [
      { when: JD, turns: [['a', "When this is all over, I'm still going to be ringing you about everything. You know that, right?"]] },
      { when: JD, turns: [['a', "Out there, you're stuck with me. Birthdays, bad days, all of it. Whoever you end up with will have to put up with me too."]] },
    ],
    land: [
      { when: JD, turns: [['b', "Stop it. You're going to make me cry, and it's not even that kind of speech."]], beat: "The fire pit laughs, and {b} hugs {a} anyway." },
      { when: JD, turns: [], beat: "{b} gives {a} a thumbs up, then gives in and hugs {a.obj}." },
    ],
  },
};
