// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-deep.js — the confessionals where somebody argues with themselves
// ══════════════════════════════════════════════════════════════════════
// director.js, before the vote talk (the user, from Disventure Camp: "I don't want to hurt Topaz,
// but if I hold back, I'm only hurting myself. Everyone else is playing to win, why shouldn't I?
// ...Right?"). Two moments the engine makes true:
//   deep.betray  a is close to {friend} (bond 3+) and is writing {friend}'s name tonight. a doesn't
//                know how the night ends, only what a is going to write.
//   deep.win     a won immunity at the merge, and the camp isn't glad a did.
// Two confessional beats, in a's own voice, ending unsure. Ids: 'ndp.'.

export default {
  'deep.betray.any': [
    { id: 'ndp.b1', turns: [
      { by: 'a', conf: "I don't want to hurt {friend}. I really don't. {friend} is one of the only people here I actually look forward to seeing in the morning." },
      { by: 'a', conf: "But if I hold back tonight, I'm only hurting myself. Everybody else is playing to win. Why shouldn't I? ...Right?" },
    ] },
    { id: 'ndp.b2', when: { voice: ['warm', 'earnest', 'emotional', 'anxious'] }, turns: [
      { by: 'a', conf: "I keep picturing {friend}'s face when the votes get read. I keep trying to stop picturing it, and I can't." },
      { by: 'a', conf: "Everybody says it's just a game. Then why does it feel like I'm about to do something I'll have to apologise for for the rest of my life?" },
    ] },
    { id: 'ndp.b3', when: { voice: ['schemer', 'calm', 'dry', 'cruel'] }, turns: [
      { by: 'a', conf: "{friend} is my friend. That's true. It's also true that {friend} is standing exactly where I need to be standing in two weeks." },
      { by: 'a', conf: "I can feel bad about it later. I've even scheduled it: tomorrow morning, for ten minutes, I'll feel terrible. Tonight, I write the name." },
    ] },
    { id: 'ndp.b4', when: { voice: ['tough', 'competitive', 'loud', 'proud'] }, turns: [
      { by: 'a', conf: "I didn't come here to make friends, and then I made one anyway, and it was {friend}. Great timing." },
      { by: 'a', conf: "If I'm going to win this, I have to be able to do the hard things. This is the hard thing. I just didn't think it would feel this heavy." },
    ] },
    { id: 'ndp.b5', when: { age: 'teen' }, turns: [
      { by: 'a', conf: "Okay, so I'm writing {friend}'s name tonight, and I feel so sick about it that I didn't even finish my food." },
      { by: 'a', conf: "{friend} is going to hate me. Or maybe {friend} would do the same thing to me. I don't know which one would be worse." },
    ] },
    { id: 'ndp.b6', when: { age: ['thirties', 'older'] }, turns: [
      { by: 'a', conf: "At my age, you'd think I'd be better at this. I've had to make hard calls before. None of them involved writing a friend's name on a piece of paper." },
      { by: 'a', conf: "I'm doing it because it's the right move for my game. I just hope {friend} understands that, eventually. Maybe in a few years." },
    ] },
  ],
  'deep.win.any': [
    { id: 'ndp.w5', when: { again: true }, turns: [
      { by: 'a', conf: "That's another win, and another silence. I'm starting to get used to the sound of nobody clapping." },
      { by: 'a', conf: "Every time I win, the camp gets a little quieter around me. One of these nights I'm going to lose, and they'll all be ready." },
    ] },
    { id: 'ndp.w6', when: { again: true }, turns: [
      { by: 'a', conf: "I keep winning, and they keep looking at me like I've done something wrong." },
      { by: 'a', conf: "Maybe I have. Maybe being good at this is the thing you're not supposed to do out here. Too late to stop now." },
    ] },
    { id: 'ndp.w1', turns: [
      { by: 'a', conf: "I won, I actually won, and when I turned around, nobody was clapping, not one person." },
      { by: 'a', conf: "I guess that's what happens when you're the one everybody's scared of. If this is what it takes to stay, then fine. I'll take it." },
    ] },
    { id: 'ndp.w2', when: { voice: ['warm', 'earnest', 'emotional', 'anxious'] }, turns: [
      { by: 'a', conf: "Winning was supposed to feel good. It did, for about three seconds, and then I saw everybody's faces." },
      { by: 'a', conf: "They weren't happy for me. They were doing maths. I'm safe tonight, and I've never felt more alone out here." },
    ] },
    { id: 'ndp.w3', when: { voice: ['tough', 'competitive', 'proud', 'cruel'] }, turns: [
      { by: 'a', conf: "Did you see their faces? Not a single smile. They wanted me to lose so badly, and I beat every one of them anyway." },
      { by: 'a', conf: "Let them be mad. Mad people make mistakes. I'm going to keep winning until they run out of nights to get rid of me." },
    ] },
    { id: 'ndp.w4', when: { voice: ['schemer', 'calm', 'dry'] }, turns: [
      { by: 'a', conf: "Nobody congratulated me. That told me more than any conversation today. I'm the name they all wanted, and now they need a second choice." },
      { by: 'a', conf: "Which means tonight, somebody else is in danger because of me. I should probably find out who, and make them a friend." },
    ] },
  ],
};
