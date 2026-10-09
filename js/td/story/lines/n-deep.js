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
  // a wrote {cover} last night because {leader} said to, and {lastBoot} went home instead
  'deep.liedto.any': [
    { id: 'ndp.l1', turns: [
      { by: 'a', conf: "I've been lying awake going over it. {leader} told me {cover}. I wrote {cover}. And {lastBoot} went home, which means everybody else knew something I didn't." },
      { by: 'a', conf: "So either I'm not as trusted as I thought, or I'm exactly as trusted as they need me to be. I don't know which one makes me angrier." },
    ] },
    { id: 'ndp.l2', when: { voice: ['warm', 'earnest', 'emotional', 'anxious'] }, turns: [
      { by: 'a', conf: "I really thought {leader} and I were good. I'd have done anything {leader} asked. Turns out {leader} didn't want to ask, just to tell me something that wasn't true." },
      { by: 'a', conf: "I'm not going to make a scene. I'm just never going to take {leader}'s word for anything again without checking it twice." },
    ] },
    { id: 'ndp.l3', when: { voice: ['tough', 'loud', 'blunt', 'competitive', 'cruel'] }, turns: [
      { by: 'a', conf: "{leader} looked me in the face and gave me a fake name. Me. Like I'm some kind of spare vote you hand a script to." },
      { by: 'a', conf: "Fine. Lesson learned. {leader} wants to play it like that, then I know exactly how to play {leader}." },
    ] },
    { id: 'ndp.l4', when: { voice: ['schemer', 'calm', 'dry'] }, turns: [
      { by: 'a', conf: "I got played last night. I'll admit it. {leader} gave me {cover} and kept the real name for the people who mattered more." },
      { by: 'a', conf: "The thing about being lied to is you learn exactly what the liar thinks of you. Now I know. That's useful." },
    ] },
  ],
  // nobody here is close to a, and hasn't been for days
  'deep.alone.any': [
    { id: 'ndp.a1', turns: [
      { by: 'a', conf: "I talk to everybody here. I eat with everybody, I help with everything. And if you asked any of them who I'm closest to, I don't think they'd have an answer." },
      { by: 'a', conf: "I don't think I would either. That's the scary part. In this game, nobody fights for the person who belongs to nobody." },
    ] },
    { id: 'ndp.a2', when: { voice: ['warm', 'earnest', 'emotional', 'anxious'] }, turns: [
      { by: 'a', conf: "Everybody here has a person. You can see it at dinner, who sits with who, who saves a seat. Nobody saves me a seat." },
      { by: 'a', conf: "I'm not saying that so people feel sorry for me. I'm saying it because I need to fix it, fast, before somebody notices I'm the easy vote." },
    ] },
    { id: 'ndp.a3', when: { voice: ['tough', 'proud', 'dry', 'calm'] }, turns: [
      { by: 'a', conf: "I came out here to play my own game, and I've been doing that. Nobody owns my vote. That's on purpose." },
      { by: 'a', conf: "But on purpose or not, it means nobody's going to stop my name from being written. I might need to pick a side before the sides pick me." },
    ] },
    { id: 'ndp.a4', when: { age: 'teen' }, turns: [
      { by: 'a', conf: "Okay, so it's kind of like the first week of school, except it never stops being the first week of school." },
      { by: 'a', conf: "Everybody's got their group already. I keep waiting to be invited into one. I think I might have to just walk up and sit down." },
    ] },
  ],
  // a is the vote everybody needs tonight: {pitcher} asked for it, on {target}; yes: a said yes
  'deep.swing.any': [
    { id: 'ndp.s5', when: { yes: true, voice: ['warm', 'earnest', 'anxious', 'emotional'] }, turns: [
      { by: 'a', conf: "I told {pitcher} yes, and {pitcher} hugged me. Actually hugged me. Nobody's hugged me out here in days." },
      { by: 'a', conf: "I really hope I said yes for the right reasons and not just because somebody finally wanted me for something." },
    ] },
    { id: 'ndp.s6', when: { yes: false, voice: ['tough', 'proud', 'blunt', 'competitive'] }, turns: [
      { by: 'a', conf: "{pitcher} wanted my vote on {target}, and I said no to {pitcher}'s face. I don't do what I'm told just because somebody asks nicely." },
      { by: 'a', conf: "If that makes me a target, fine. At least it'll be for something I actually did." },
    ] },
    { id: 'ndp.s7', when: { age: 'teen' }, turns: [
      { by: 'a', conf: "So basically I'm the deciding vote tonight, which is insane, because last week I couldn't even decide what to eat for breakfast." },
      { by: 'a', conf: "Everybody keeps being really nice to me, and I know it's only because of tonight, and I'm kind of enjoying it anyway." },
    ] },
    { id: 'ndp.s8', when: { age: ['thirties', 'older'] }, turns: [
      { by: 'a', conf: "I've sat in enough meetings to know what it looks like when everybody suddenly wants your opinion. They don't want my opinion. They want my vote." },
      { by: 'a', conf: "That's fine. I'll give it to whoever I think I can trust at the end, and I'll make sure they know they owe me." },
    ] },
    { id: 'ndp.s1', when: { yes: true }, turns: [
      { by: 'a', conf: "{pitcher} asked me straight out tonight, and I said yes. Part of me thinks that's the smartest thing I've done all game." },
      { by: 'a', conf: "The other part keeps asking what happens to me when the people I just said no to work out it was me." },
    ] },
    { id: 'ndp.s2', when: { yes: false }, turns: [
      { by: 'a', conf: "{pitcher} asked me for my vote, and I said no. Being the person everybody needs feels great for about five minutes." },
      { by: 'a', conf: "Then you realise every side you turn down remembers it. I just made somebody in this camp an enemy, and I'm not even sure who yet." },
    ] },
    { id: 'ndp.s3', turns: [
      { by: 'a', conf: "Everybody wants my vote tonight. That's either really good for me or really, really bad, and I won't know which until the votes are read." },
      { by: 'a', conf: "My whole game is in one piece of paper. No pressure. None at all. I'm totally fine." },
    ] },
    { id: 'ndp.s4', when: { voice: ['schemer', 'calm', 'dry'] }, turns: [
      { by: 'a', conf: "Being the swing vote isn't about tonight. It's about who owes me tomorrow." },
      { by: 'a', conf: "Whatever I write, somebody leaves tonight thinking they were saved by me, and somebody else thinks they were betrayed. I'd like the first group to be the bigger one." },
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
