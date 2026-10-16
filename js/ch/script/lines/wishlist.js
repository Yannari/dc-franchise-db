// Who they would pick, and who they never would (js/ch/wishlist.js).
//   arena-wishlist  a = somebody at risk this week; b = their friend; {target} = the one they fear; {alt} = their pick
//   wishlist-leak   a = the one named as the easy pick, who heard; b = the one who said it; {target} = the one feared
export default {
  'arena-wishlist.any': [
    { id: 'aw.1', turns: [
      { beat: '{a} and {b} are lying on the loungers, talking quietly.' },
      { by: 'b', say: "If they vote you in this week, who are you taking?" },
      { by: 'a', say: "Not {target}. Absolutely not {target}. I've seen what {target} does in that Arena." },
      { by: 'b', say: "So who, then?" },
      { by: 'a', say: "{alt}. I'd beat {alt} in almost anything they could throw at us." },
      { by: 'b', say: "Does {alt} know that?" },
      { by: 'a', say: "{alt} is about to find out, if they say my name." },
      { by: 'a', conf: "Everybody says they'd call out the strongest person. Nobody actually does. I want to go home with money, not with a story about how brave I was." },
    ] },
    { id: 'aw.2', turns: [
      { by: 'a', say: "Can I tell you something, and it stays between us?" },
      { by: 'b', say: "Always." },
      { by: 'a', say: "If I go in, I'm calling out {alt}. I've already decided." },
      { by: 'b', say: "Why {alt}?" },
      { by: 'a', say: "Because the other option is {target}, and I'd rather not get on a plane this week." },
      { by: 'b', say: "That's honest, at least." },
      { by: 'b', conf: "{a} just told me the whole plan. I hope {a} told me because {a} trusts me, and not because {a} thinks I won't repeat it." },
    ] },
    { id: 'aw.3', turns: [
      { beat: '{a} is counting names on {a.posAdj} fingers in the gym. {b} wanders over.' },
      { by: 'b', say: "What are you doing?" },
      { by: 'a', say: "Working out who I can beat. {target} is a no. {target} is a hard no." },
      { by: 'b', say: "And?" },
      { by: 'a', say: "And {alt} is a yes. A big yes." },
      { by: 'b', say: "You know if that gets out, {alt} is going to be furious." },
      { by: 'a', say: "Then it doesn't get out." },
      { by: 'a', conf: "Nobody wants to draw {target}. The trick is making sure the house sends somebody else in first, and if it's me, I know exactly where I'm pointing." },
    ] },
    { id: 'aw.4', turns: [
      { by: 'b', say: "You're scared of {target}, aren't you?" },
      { by: 'a', say: "Everybody's scared of {target}. I'm just the only one who admits it." },
      { by: 'b', say: "So if it's you?" },
      { by: 'a', say: "Then it's {alt}, and I sleep fine." },
      { by: 'b', conf: "{a} has already picked a name. I just hope {a} never has to say it." },
    ] },
  ],
  'wishlist-leak.any': [
    { id: 'wl.1', turns: [
      { beat: '{a} finds {b} by the pool and does not bother sitting down.' },
      { by: 'a', say: "I hear you've been planning my Arena." },
      { by: 'b', say: "I don't know what you're talking about." },
      { by: 'a', say: "Yes, you do. You'd never pick {target}, but you'd pick me, because I'm easy. Is that right?" },
      { by: 'b', say: "Who told you that?" },
      { by: 'a', say: "Does it matter? It's true, isn't it?" },
      { by: 'a', conf: "{b} thinks I'm the easy one. Fine. Let's see how easy I am at the vote." },
    ] },
    { id: 'wl.2', turns: [
      { by: 'a', say: "So I'm your easy win? That's what I am to you?" },
      { by: 'b', say: "It wasn't like that." },
      { by: 'a', say: "Then what was it like? Because what I heard is that you're scared of {target} and you're coming for me instead." },
      { by: 'b', say: "I was talking to a friend. It was supposed to stay between us." },
      { by: 'a', say: "Well, it didn't. And now I know where I stand." },
      { by: 'b', conf: "Somebody I trusted repeated every word. Now {a} wants me gone, and I can't even blame {a} for it." },
    ] },
    { id: 'wl.3', turns: [
      { beat: 'Word travels fast in the villa. {a} walks straight into the kitchen.' },
      { by: 'a', say: "Don't worry, {b}. I'll make it easy for you. I'll be the one saying your name at the vote." },
      { by: 'b', say: "Wait, what?" },
      { by: 'a', say: "You'd rather fight me than {target}. I heard. So let's make sure you get the chance." },
      { by: 'a', conf: "If I'm good enough to be {b}'s first pick, I'm good enough to send {b} in there first." },
    ] },
  ],
};
