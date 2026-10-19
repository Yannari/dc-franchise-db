// The confessional after a check-in (leg.js interviewFloor, and any team the dice send to the interview room after the
// mat). Written 2026-10-19: these interviews were played and never aired, because no line was written for a check-in.
// Any team can get one, so nobody names a placing: it's how the leg felt, said the way people say it, not a joke.
const iv = (id, when, ...lines) => ({ id, when, turns: lines.map(([by, conf]) => ({ by, conf })) });
const MAT = { cause: 'don-place' };

export default {
  retire: [],
  pools: {
    'int-feeling.glad': [
      iv('mi.g1', MAT,
        ['a', "Every time we step on that mat, I think, okay, this is it, they're sending us home."],
        ['b', "And then they don't."],
        ['a', "And then they don't. I could get used to that."]),
      iv('mi.g2', MAT,
        ['b', "Honestly? I didn't think we'd still like each other this much by now."],
        ['a', "I did."],
        ['b', "You did not."],
        ['a', "I hoped. That's close."]),
      iv('mi.g3', MAT,
        ['a', "Don said our names, and I just breathed out. I didn't know I'd been holding it in all day."],
        ['b', "You weren't holding anything in. I could hear you breathing all day."],
        ['a', "Then I'm breathing out the rest of it now."]),
      iv('mi.g4', MAT,
        ['b', "Another leg done. I keep a list in my head of things I didn't think we could do."],
        ['a', "What's on it?"],
        ['b', "Most of today, actually."]),
    ],
    'int-feeling.hurt': [
      iv('mi.h1', MAT,
        ['a', "We made it, but it doesn't feel like it. It feels like we got away with something."],
        ['b', "We did get away with something."],
        ['a', "That's my point."]),
      iv('mi.h2', MAT,
        ['b', "We barely talked on the way in. We just got here, and that was it."],
        ['a', "I was tired."],
        ['b', "I know. So was I. That's what worries me."]),
      iv('mi.h3', MAT,
        ['a', "Everybody else ran onto that mat hugging. We just sort of arrived."],
        ['b', "Arriving is still arriving."],
        ['a', "It's not the same, though, is it?"]),
    ],
    'int-feeling.angry': [
      iv('mi.a1', MAT,
        ['a', "Checked in. Great. I'm still annoyed."],
        ['b', "About what?"],
        ['a', "You know about what."],
        ['b', "I genuinely don't."],
        ['a', "Then I'm annoyed about that, too."]),
      iv('mi.a2', MAT,
        ['b', "We should've been here an hour ago. An hour."],
        ['a', "We're here now."],
        ['b', "And we'd have been here an hour ago, which is my whole point."]),
      iv('mi.a3', MAT,
        ['a', "Don asked if we were okay, and we both said 'fine' at the exact same time."],
        ['b', "In the exact same voice."],
        ['a', "Nobody says 'fine' like that when they're fine."]),
    ],
  },
};
