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
      { when: { story: 'graft', bTaken: true }, turns: [
        ['a', "I'm just going to be honest with you, because I think you'd rather that than me dancing round it. I like you. I've liked you since I first saw you. And I know you're with {pb}, and I'm not here to cause trouble. I just didn't want to get to the end of this and wonder."],
        ['b', "Okay. Wow. I wasn't expecting you to just come out with it."],
        ['a', "I'm not very good at pretending."],
      ] },
      { when: { story: 'graft', bTaken: true }, turns: [
        ['a', "Can I ask you something straight? How are things with {pb}? Honestly. Not the version you give the villa."],
        ['b', "Why do you want to know?"],
        ['a', "Because I'm interested in you. And if it's going amazing, I'll back off. But if it's not, I want you to know there's someone here who'd like to get to know you."],
      ] },
      { when: { story: 'graft', bTaken: true, fresh: true }, turns: [
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
      { when: { story: 'graft', bTaken: true, end: 'turned-down' }, turns: [
        ['b', "I appreciate you being honest, I really do. But I'm with {pb}, and I'm happy with {pb}. I'm not going to sit here and pretend there's a door open when there isn't. That wouldn't be fair on you, and it wouldn't be fair on {pb}."],
        ['a', "Okay. That's fair."],
      ] },
      { when: { story: 'graft', bTaken: true, end: ['flirt', 'kissed', 'promised'] }, turns: [
        ['b', "It's… complicated. {pb} is lovely. Really lovely. But sometimes I sit there and I think, is this it? Is this the thing? And I don't know. I genuinely don't know."],
        ['a', "That's not a no."],
        ['b', "It's not a yes, either."],
      ] },
      { when: { story: 'graft', bTaken: true, end: ['flirt', 'kissed', 'promised'] }, turns: [
        ['b', "I'm not going to lie and say I haven't noticed you. I have. I noticed you the second you walked in. But I've got {pb}, and I've built something with {pb}, and I can't just throw that away because someone new smiled at me."],
        ['a', "I'm not asking you to throw anything away. I'm asking for a chance to get to know you."],
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
