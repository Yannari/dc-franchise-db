// pm/talk/more/group-chat-spark.js — two singles, and the friends who want details.
// The spark storyline (pm/threads.js): {a} and {x} are both single, had a long
// chat yesterday, and the villa has noticed. Nothing is decided: the
// recoupling does that.
export const GROUP_CHAT_SPARK = {
  moves: {
    gather: [
      { when: { subj: 'spark' }, stage: "{a} sits down on the daybed with a cup of tea, and the others turn to look at {a.obj} all at once.", turns: [
        ['a', "What?"],
        ['b', "Don't what us. You know what."],
      ] },
    ],
    tell: [
      { when: { subj: 'spark' }, turns: [
        ['b', "So. You and {x}. That chat yesterday went on for about two hours."],
        ['a', "It was not two hours."],
        ['b', "I timed it. I had nothing else to do. Two hours and eleven minutes."],
        ['a', "Okay, fine. It was a good chat. We just didn't run out of things to say. That's never happened to me in here."],
      ] },
      { when: { subj: 'spark' }, turns: [
        ['a', "Can I say something without you all screaming?"],
        ['b', "No promises."],
        ['a', "I really like {x}. Like, really like {x.obj}. We were talking yesterday and I kept forgetting there were cameras. I kept forgetting there was anyone else in the villa."],
        ['b', "Oh, that's it. That's the one. That's the sign."],
      ] },
      { when: { subj: 'spark' }, turns: [
        ['b', "Right, everyone has seen it, so you might as well tell us. What's going on with {x}?"],
        ['a', "Nothing's going on. We're both single, we get on, we had a chat."],
        ['b', "A chat where you were both doing the head tilt."],
        ['a', "I don't do a head tilt."],
        ['b', "You're doing it right now. Just saying the name."],
      ] },
    ],
    react: [
      { when: { subj: 'spark' }, turns: [
        ['b', "I love it. I genuinely love it. You've been so lovely to everyone in here, and it's about time somebody was lovely back. You deserve this."],
        ['a', "It's one chat."],
        ['b', "It's a start."],
      ] },
      { when: { subj: 'spark' }, turns: [
        ['b', "Just be careful. I'm not saying {x} isn't nice. I'm saying the recoupling is coming, and you don't want to be the one left standing because you put all your eggs in one basket."],
        ['a', "So what, I should talk to other people too?"],
        ['b', "I'm saying have a back-up. Everyone in here has a back-up."],
      ] },
      { when: { subj: 'spark' }, turns: [
        ['b', "Has {x} said anything? Like, about the recoupling?"],
        ['a', "Not in so many words. But I don't think {x} was having that chat to be polite."],
        ['b', "No. Nobody has a two-hour chat to be polite."],
      ] },
    ],
    react2: [
      { when: { subj: 'spark', cast: [3, 4] }, turns: [
        ['c', "I'm calling it now. You two are going to be the ones everyone talks about at the reunion."],
        ['a', "Don't. You'll jinx it."],
        ['c', "I don't jinx. I predict."],
      ] },
    ],
    verdict: [
      { when: { subj: 'spark' }, turns: [
        ['a', "I'm going to pull {x} again today. Just to be sure it wasn't a fluke."],
        ['b', "It wasn't a fluke. But go on. Go and be sure."],
      ] },
      { when: { subj: 'spark' }, turns: [
        ['a', "Okay, I'm not going to overthink it. I'm going to let it happen and see where it goes."],
        ['b', "That's the healthiest thing anyone's said in this villa all week."],
      ] },
    ],
    close: [
      { when: { subj: 'spark' }, turns: [], beat: "Across the garden, {x} looks over at the daybed at exactly the wrong moment, and the whole group bursts out laughing." },
    ],
  },
};
