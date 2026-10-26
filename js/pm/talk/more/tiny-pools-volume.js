// pm/talk/more/tiny-pools-volume.js — pools of one to four entries that a
// season used up (the user, 2026-10-23: "also add the volume like u wanted to
// do to avoid repetitions"): the Hideaway vote's announcement, the "where are
// we" question, a jealous blowup's first words, a dry-voiced kiss, the clash
// row. Each line heard five times a season. Same facts as each kind's file.
const R = (...turns) => ({ turns });
const W = (when, ...turns) => ({ when, turns });
const S = (when, stage, ...turns) => ({ when, stage, turns });

export const TINY_POOLS = {
  'hideaway-vote': {
    moves: {
      pick: [
        R(['a', "We talked about it for ages, and we kept coming back to the same two. {c} and {d}."]),
        R(['b', "This one's for the couple who deserve a night off. {c} and {d}."]),
        R(['a', "We're giving it to {c} and {d}. If anyone needs a night away from all of us, it's them."]),
        R(['b', "Honestly, it was easy. {c} and {d}. Go and enjoy it."]),
        R(['a', "It's {c} and {d} from us. They've been through a lot. They've earned it."]),
      ],
    },
  },
  'keeping-open': {
    moves: {
      lead: [
        { stage: "{b} sits down next to {a} on the swing seat.", turns: [['b', "I need to ask you something, and I need a straight answer."]] },
        { stage: "{b} catches {a} at the kitchen counter.", turns: [['b', "Are we on the same page? Because I'm not sure we are."]] },
        R(['b', "People keep asking me about us, and I don't know what to tell them. What do I tell them?"]),
        R(['b', "Be honest with me. Are you still looking?"]),
        R(['b', "I've been wondering all day. Where do I stand with you?"]),
        { stage: "{b} pulls {a} away from the group.", turns: [['b', "Can we talk about us? Properly?"]] },
      ],
    },
  },
  blowup: {
    moves: {
      open: [
        S({ of: 'jealousy', cause: 'partner' }, "The daybeds. {b} has been sitting with {x} all afternoon, and {a} has had enough.", ['a', "Comfy, are we?"], ['b', "Very, thanks."], ['a', "Funny. You always seem to end up next to {x}."]),
        S({ of: 'jealousy', cause: 'partner' }, "By the pool. {x} is laughing at something {b} has just said, again.", ['a', "What's the joke? I'd love to hear it."], ['b', "It's not that funny."], ['a', "Then why is everyone laughing?"]),
        S({ of: 'jealousy', cause: 'partner' }, "The kitchen, after lunch. {a} doesn't wait for the plates to be cleared.", ['a', "Can I have a word? About {x}?"], ['b', "Here we go."]),
        S({ of: 'jealousy' }, "The terrace. {a} has been watching from across the garden, and finally comes over.", ['a', "Every time I look up, you're with {x}."], ['b', "It's a villa. I have to be somewhere."]),
        S({ of: 'jealousy' }, "By the swing seat, and {a} is already angry by the time {a} gets there.", ['a', "Is there something you want to tell me? About you and {x}?"], ['b', "No. Is there something you want to ask me?"]),
      ],
    },
  },
  kiss: {
    moves: {
      lead: [
        W({ reg: 'dry' }, ['a', "I'm going to kiss you now. Feel free to object."], ['b', "No objection."]),
        W({ reg: 'dry' }, ['b', "You're staring."], ['a', "I'm thinking about kissing you. It's a very serious decision."]),
        W({ reg: 'dry' }, ['a', "On a scale of one to ten, how much would you mind if I kissed you?"], ['b', "About a zero."]),
      ],
    },
  },
  argument: {
    moves: {
      start: [
        S({ cause: 'clash' }, "{a} and {b} end up next to each other at lunch, which was always going to go badly.", ['a', "Do you have to chew so loudly?"], ['b', "Do you have to breathe so loudly?"]),
        S({ cause: 'clash' }, "{a} and {b} disagree about the washing-up, and then about everything else.", ['b', "You never do your share."], ['a', "I do more than my share. I do yours."]),
        S({ cause: 'clash' }, "It starts on the daybeds, over who said what at the challenge.", ['a', "You made me look stupid out there."], ['b', "You didn't need my help."]),
        S({ cause: 'clash' }, "{a} and {b} have been circling each other all day, and it finally goes off.", ['b', "What is your problem with me?"], ['a', "Where do I start?"]),
      ],
    },
  },
};
