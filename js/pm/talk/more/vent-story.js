// pm/talk/more/vent-story.js — the moan with its real reason (pm/threads.js doubt).
// `why` is what's behind {a} going off {pa}, and it LEADS: a doubt's confide
// says the reason, never a generic moan. {x} is who {a} has been looking at.
//   ick      something small switched it off
//   eyes     {a} keeps looking at {x}
//   behind   {pa} is further in than {a}, and {a} can't match it
//   cooling  it's just fading
export const VENT_STORY = {
  moves: {
    moan: [
      { when: { why: 'ick' }, turns: [
        ['a', "Something's happened and I hate it. You know when you really like someone, and then they do one tiny thing, and it's like a switch goes off? That. With {pa}. And now I can't stop noticing everything. The way {pa} eats. The way {pa} laughs. It's horrible, because none of it is {pa}'s fault."],
        ['b', "Oh no. The ick."],
        ['a', "The ick. Full ick. And I don't know if it's going to go away."],
      ] },
      { when: { why: 'ick' }, turns: [
        ['a', "Can I tell you something awful? I went to kiss {pa} this morning and I just didn't want to. Like, my whole body went, no thank you. And three days ago I couldn't keep my hands off {pa}."],
        ['b', "What changed?"],
        ['a', "I genuinely don't know. Nothing. Everything. Something small, and I can't get it out of my head."],
      ] },
      { when: { why: 'eyes' }, turns: [
        ['a', "I need to say this out loud to someone, and you have to promise it doesn't go any further. I can't stop looking at {x}. I'm with {pa}, I know I'm with {pa}, and I keep finding myself sitting wherever {x} is sitting."],
        ['b', "{x}? Since when?"],
        ['a', "Since a couple of days ago. And it's getting worse, not better."],
      ] },
      { when: { why: 'eyes' }, turns: [
        ['a', "I think my head's been turned. By {x}. Nothing's happened, I swear. But every time {x} talks to me, I forget {pa} is even in the room. And then I see {pa} looking at me, and I feel like the worst person in the villa."],
        ['b', "You're not the worst person in the villa."],
        ['a', "I'm in the top three."],
      ] },
      { when: { why: 'behind' }, turns: [
        ['a', "{pa} is so far ahead of me. {pa} is talking about the outside, about meeting each other's families, about how this is the real thing. And I'm sitting there nodding, and inside I'm going, I don't know yet. I don't know if I'll ever know."],
        ['b', "Have you told {pa} that?"],
        ['a', "How do you tell someone that? {pa} would be crushed."],
      ] },
      { when: { why: 'behind' }, turns: [
        ['a', "Last night {pa} said something really big to me. Really sweet. And I couldn't say it back. I just kissed {pa} so I didn't have to say anything. And {pa} didn't notice, and that's almost worse."],
        ['b', "Oh, that's a lot to carry."],
        ['a', "It's a lot. I don't want to hurt {pa}. I just can't fake something I don't feel yet."],
      ] },
      { when: { why: 'cooling' }, turns: [
        ['a', "I don't know what's wrong with me. {pa} is lovely. Like, objectively, a lovely person. Nothing has happened. I just don't feel it the way I did. It's like the colour's gone out of it."],
        ['b', "Maybe it's just the villa. Everyone dips."],
        ['a', "Maybe. But what if it isn't a dip? What if this is just what it is now?"],
      ] },
      { when: { why: 'cooling' }, turns: [
        ['a', "Me and {pa} are just a bit flat at the moment. We have the same chat every day. It's nice. It's fine. But fine isn't why I came in here."],
        ['b', "What did you come in here for?"],
        ['a', "Butterflies. And I haven't had a butterfly in about four days."],
      ] },
    ],
  },
};
