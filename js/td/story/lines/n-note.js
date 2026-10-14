// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-note.js — somebody watching takes it in
// ══════════════════════════════════════════════════════════════════════
// director.js longScene: a public moment with the camp in earshot. a watched it; b did it; c was on
// the other end. The confessional is what a feels and what a will do with it, not a retelling of
// what the viewer just saw (the user, 2026-10-08: "over-explainy instead of talking about his
// emotions"). Families: credit (b claimed a vote), brag (b showed off), power (b, a villain,
// said who runs things), fight (any row in front of camp). Ids: 'nnt.'.

export default {
  'public.note.credit.any': [
    { id: 'nnt.c1', turns: [{ by: 'a', conf: "I'd keep that kind of thing to myself, personally. But thank you, {b}, because now I know exactly who to worry about at the next vote." }] },
    { id: 'nnt.c2', turns: [{ by: 'a', conf: "I love it when people tell me things for free. I didn't even have to ask. I'm writing it down in my head right next to {b}'s name." }] },
    { id: 'nnt.c3', when: { voice: ['warm', 'earnest', 'anxious'] }, turns: [{ by: 'a', conf: "That made me so uncomfortable. I just wanted to eat my breakfast, and now I know way more about how votes get made here than I wanted to." }] },
  ],
  'public.note.brag.any': [
    { id: 'nnt.b1', turns: [{ by: 'a', conf: "Every time {b} talks like that, I get a little bit happier. Confident people are so much easier to vote out than careful ones." }] },
    { id: 'nnt.b2', when: { voice: ['dry', 'calm', 'schemer'] }, turns: [{ by: 'a', conf: "I don't need to say anything. {b} is doing all my campaigning for me." }] },
    { id: 'nnt.b3', when: { voice: ['warm', 'goofy', 'earnest'] }, turns: [{ by: 'a', conf: "I kind of feel bad for {b}. Somebody should tell {b.obj} to stop, but honestly, it's not going to be me." }] },
  ],
  'public.note.power.any': [
    { id: 'nnt.p1', turns: [{ by: 'a', conf: "My stomach dropped a little, because {b} isn't wrong. And if {b} isn't wrong, then all of us have a really big problem." }] },
    { id: 'nnt.p2', when: { voice: ['tough', 'competitive', 'proud'] }, turns: [{ by: 'a', conf: "I'm not scared of {b}. I'm a little annoyed at how many people here are, and I'm going to start finding them." }] },
    { id: 'nnt.p3', when: { voice: ['schemer', 'calm', 'dry'] }, turns: [{ by: 'a', conf: "That's the kind of thing you say when you think nobody can touch you. I've seen how that ends. I'd like to be there for it." }] },
  ],
  'public.note.fight.any': [
    // (more of them, read 2026-10-14: one or two versions aired in five or six episodes of one season)
    { id: 'nnt.f5', turns: [{ by: 'a', conf: "I've never seen {b} like that before. I'm going to remember it." }] },
    { id: 'nnt.f6', turns: [{ by: 'a', conf: "{b} and {c} can't stand each other, and now the whole camp knows it. That changes things." }] },
    { id: 'nnt.f7', when: { voice: ['dry', 'calm', 'schemer'] }, turns: [{ by: 'a', conf: "Two people fighting means two people too busy to look at me. I'll take it." }] },
    { id: 'nnt.f8', when: { voice: ['warm', 'anxious', 'earnest', 'emotional'] }, turns: [{ by: 'a', conf: "I really hope they sort it out. Watching people you like go at each other is the worst." }] },
    { id: 'nnt.f9', when: { voice: ['goofy', 'chaotic', 'loud'] }, turns: [{ by: 'a', conf: "I didn't move. I didn't blink. I barely breathed. Best thing I've seen all week." }] },
    { id: 'nnt.f10', turns: [{ by: 'a', conf: "Everybody's going to pick a side after that. I just need to make sure I pick the right one." }] },
    { id: 'nnt.f1', turns: [{ by: 'a', conf: "I just stood there wishing I was literally anywhere else. And then I started thinking about which side I'd want to be on, and I didn't love the answer." }] },
    { id: 'nnt.f2', when: { voice: ['dry', 'calm', 'schemer'] }, turns: [{ by: 'a', conf: "Nothing tells you more about people than watching them fight. I learned more in two minutes than in all the small talk put together." }] },
    { id: 'nnt.f3', when: { voice: ['warm', 'anxious', 'earnest', 'emotional'] }, turns: [{ by: 'a', conf: "I hate it when it gets like that. My heart was going so fast. I just want everybody to be okay, and I know that's not how this game works." }] },
    { id: 'nnt.f4', when: { voice: ['goofy', 'chaotic', 'loud'] }, turns: [{ by: 'a', conf: "Honestly? Best entertainment we've had all week. I'm not proud of it. I'd watch it again, though." }] },
  ],
};
