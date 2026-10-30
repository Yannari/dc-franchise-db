// pm/talk/more/pull-story.js — a pull that is part of a story (pm/threads.js).
// The user, 2026-10-25: chats "go nowhere, they have no substance". A story's
// pull is ABOUT the story, so it has no tangent (no games, no questionnaire):
//   story graft  {a} is after {b}, who is with {pb}. Every line knows {pb} exists.
//   story spark  {a} and {b} are both single and into each other. What they
//                want, and whether it's each other.
// `end` is the engine's ending (flirt · kissed · promised · turned-down); the
// `turn` movement in pull.js says it. These fill why, answer, probe and dream.
export const PULL_STORY_PLANS = [
  { when: { story: 'graft', end: 'turned-down' }, plan: ['open', 'why', 'answer', 'turn', 'close'] },
  { when: { story: 'graft' }, plan: ['open', 'why', 'answer', 'probe', 'turn', 'close'] },
  { when: { story: 'spark' }, plan: ['open', 'why', 'answer', 'dream', 'probe?', 'turn', 'close'] },
];

export const PULL_STORY = {
  moves: {
    why: [
      { when: { story: 'graft', bTaken: true, taken: false }, turns: [
        ['a', "I'm just going to be honest with you, because I think you'd rather that than me dancing round it. I like you. I've liked you since I first saw you. And I know you're with {pb}, and I'm not here to cause trouble. I just didn't want to get to the end of this and wonder."],
        ['b', "Okay. Wow. I wasn't expecting you to just come out with it."],
        ['a', "I'm not very good at pretending."],
      ] },
      // The grafter has a partner of their own (user, season 1: "it doesn't even
      // acknowledge that Rafael is in an old couple, or Lucia").
      { when: { story: 'graft', bTaken: true, taken: true }, turns: [
        ['a', "I know how this looks. I'm with {pa}, you're with {pb}, and I'm sitting here anyway. But I can't keep pretending I don't feel something when I'm around you."],
        ['b', "What about {pa}?"],
        ['a', "I care about {pa}. I do. But caring about someone and feeling like this are two different things, and I've only just worked that out."],
      ] },
      { when: { story: 'graft', bTaken: true, taken: true, newCouple: false }, turns: [
        ['a', "Me and {pa} have been together a long time in here. Everyone thinks we're solid. And I've been sitting next to {pa} at the fire pit, thinking about you."],
        ['b', "You can't say that to me."],
        ['a', "I know. I'm saying it anyway, because I'd rather say it to you than lie to {pa} for another week."],
      ] },
      { when: { story: 'graft', bTaken: true }, turns: [
        ['a', "Can I ask you something straight? How are things with {pb}? Honestly. Not the version you give the villa."],
        ['b', "Why do you want to know?"],
        ['a', "Because I'm interested in you. And if it's going amazing, I'll back off. But if it's not, I want you to know there's someone here who'd like to get to know you."],
      ] },
      { when: { story: 'graft', bTaken: true, fresh: true, taken: false }, turns: [
        ['a', "I'll be honest. Before I even walked in, you were the one I wanted to talk to. And I know you're coupled up with {pb}, everyone made sure I knew that. But I'd be lying to myself if I didn't at least have one conversation with you."],
        ['b', "That's very forward."],
        ['a', "I haven't got time to be anything else. I've only just got here."],
      ] },
      { when: { story: 'spark' }, turns: [
        ['a', "I wanted to grab you because every time we end up in the same conversation, I come away wishing it had gone on longer. And it's never just us. There's always someone else in it."],
        ['b', "That's actually really sweet."],
        ['a', "So now it's just us. No one else. Let's see what happens."],
      ] },
      { when: { story: 'spark' }, turns: [
        ['a', "Okay. I'm going to say something and I might regret it. We're both single, we're both looking, and I think we keep looking at each other. Am I making that up?"],
        ['b', "No. You're not making that up."],
        ['a', "Good. Because that would have been really embarrassing."],
      ] },
    ],
    answer: [
      { when: { story: 'graft', bTaken: true, taken: false, bNewCouple: false, end: 'turned-down' }, turns: [
        ['b', "I appreciate you being honest, I really do. But I'm with {pb}, and I'm happy with {pb}. I'm not going to sit here and pretend there's a door open when there isn't. That wouldn't be fair on you, and it wouldn't be fair on {pb}."],
        ['a', "Okay. That's fair."],
      ] },
      { when: { story: 'graft', bTaken: true, bNewCouple: false, end: ['flirt', 'kissed', 'promised'] }, turns: [
        ['b', "It's… complicated. {pb} is lovely. Really lovely. But sometimes I sit there and I think, is this it? Is this the thing? And I don't know. I genuinely don't know."],
        ['a', "That's not a no."],
        ['b', "It's not a yes, either."],
      ] },
      { when: { story: 'graft', bTaken: true, bFirst: true, bNewCouple: false, taken: false, end: ['flirt', 'kissed', 'promised'] }, turns: [
        ['b', "I'm not going to lie and say I haven't noticed you. I have. I noticed you the second you walked in. But I've got {pb}, and I've built something with {pb}, and I can't just throw that away because someone new smiled at me."],
        ['a', "I'm not asking you to throw anything away. I'm asking for a chance to get to know you."],
      ] },
      { when: { story: 'graft', bTaken: true, bNewCouple: true, end: ['flirt', 'kissed', 'promised'] }, turns: [
        ['b', "I've been with {pb} for about five minutes. I don't even know what we are yet. And you pick now to tell me this?"],
        ['a', "Would you rather I'd waited until you did know?"],
        ['b', "…No. Probably not."],
      ] },
      { when: { story: 'graft', bTaken: true, bNewCouple: true, end: 'turned-down' }, turns: [
        ['b', "I only just coupled up with {pb}. I chose {pb}, and I want to see where it goes before I start looking anywhere else. I'm not doing that to {pb}."],
        ['a', "Okay. That's fair."],
      ] },
      { when: { story: 'graft', bTaken: true, taken: true, end: ['flirt', 'kissed', 'promised'] }, turns: [
        ['b', "I'm not going to pretend I haven't thought about it. But you've got {pa}. If we do this, it's not just {pb} who gets hurt. It's {pa} as well."],
        ['a', "I know. I've thought about nothing else."],
      ] },
      { when: { story: 'graft', bTaken: true, taken: true, end: ['flirt', 'kissed', 'promised'] }, turns: [
        ['b', "We're both coupled up. You know that, right? You've got {pa}, I've got {pb}, and we're sitting here like neither of them exists."],
        ['a', "I know they exist. That's why I've waited this long."],
        ['b', "And now?"],
        ['a', "Now I'd rather say it than spend another week pretending I'm not thinking it."],
      ] },
      { when: { story: 'graft', bTaken: true, taken: true, end: ['flirt', 'kissed', 'promised'] }, turns: [
        ['b', "What would {pa} say if {pa} could hear this?"],
        ['a', "Probably the same as {pb}. That's what scares me."],
        ['b', "Then why are we still sitting here?"],
        ['a', "Because neither of us has got up."],
      ] },
      { when: { story: 'graft', bTaken: true, taken: true, end: ['flirt', 'kissed', 'promised'] }, turns: [
        ['b', "I like talking to you. I'll say that much. I'm not saying anything else while {pb} is fifty feet away."],
        ['a', "That's more than I thought I'd get."],
      ] },
      { when: { story: 'graft', bTaken: true, taken: true, end: ['flirt', 'kissed', 'promised'] }, turns: [
        ['b', "This is a mess. You know that? Two couples, and we're the ones sat here making it a mess."],
        ['a', "I didn't plan it."],
        ['b', "Nobody plans it. That's how it ends up a mess."],
      ] },
      { when: { story: 'graft', bTaken: true, taken: true, end: 'turned-down' }, turns: [
        ['b', "Go back to {pa}. Honestly. You've got someone who likes you, and you're sitting here with me. That's not fair on {pa}, and it's not fair on me."],
        ['a', "Okay. That's fair."],
      ] },
      { when: { story: 'spark' }, turns: [
        ['b', "Honestly? I've been hoping you'd pull me. I didn't want to be the one to do it, in case I'd read it all wrong. But every time you laugh at something I say, I feel about ten feet tall."],
        ['a', "Ten feet?"],
        ['b', "At least ten."],
      ] },
      { when: { story: 'spark' }, turns: [
        ['b', "I like you too. I'm not very good at saying it, but I do. You're easy to be around. I don't have to perform with you. In here, that's rare."],
        ['a', "That might be the nicest thing anyone's said to me in here."],
      ] },
    ],
    probe: [
      { when: { story: 'graft', bTaken: true }, turns: [
        ['a', "Can I ask you one thing, and then I'll leave it? If {pb} wasn't in the picture, would you be sitting here with me?"],
        ['b', "That's not a fair question."],
        ['a', "It's the only question that matters, though, isn't it?"],
        ['b', "Maybe. Yes. I don't know. Stop looking at me like that."],
      ] },
      { when: { story: 'graft', bTaken: true, taken: true }, turns: [
        ['b', "Does {pa} know you're over here?"],
        ['a', "No."],
        ['b', "Then what are we doing? Because if {pa} finds out from somebody else, that's on both of us."],
      ] },
      { when: { story: 'graft', bTaken: true }, turns: [
        ['a', "What would {pb} say, if {pb} could hear this?"],
        ['b', "{pb} would hate it. {pb} would absolutely hate it."],
        ['a', "And how do you feel about it?"],
        ['b', "That's the problem. I don't hate it."],
      ] },
      { when: { story: 'spark' }, turns: [
        ['a', "What happens at the recoupling, then? Because I'm not going to play it cool and pretend I haven't thought about it."],
        ['b', "I've thought about it."],
        ['a', "And?"],
        ['b', "And I'm not saying. You'll have to wait like everyone else."],
      ] },
      { when: { story: 'spark' }, turns: [
        ['a', "Is there anyone else? You can tell me. I'd rather know now."],
        ['b', "There's nobody else I want to sit on a daybed with for two hours."],
        ['a', "That's a very specific answer."],
        ['b', "It's a very specific feeling."],
      ] },
    ],
    dream: [
      { when: { story: 'spark' }, turns: [
        ['a', "What are you actually looking for? Not in here. Out there. When this is all over."],
        ['b', "Someone who wants the same things. Someone who'll still be there when there aren't any cameras. I've had enough of people who are fun for a summer."],
        ['a', "Same. I'm done with fun for a summer. I want fun for a long time."],
        ['b', "That's a good way of putting it."],
      ] },
      { when: { story: 'spark' }, turns: [
        ['a', "Can I tell you what I'm scared of in here?"],
        ['b', "Go on."],
        ['a', "That I'll find someone I really like, and then someone new will walk down those steps, and it'll all just disappear. It's happened to people already. I've watched it."],
        ['b', "That's not going to happen with me. I'm not that person."],
        ['a', "Everyone says that."],
        ['b', "Then watch me."],
      ] },
    ],
  },
};
