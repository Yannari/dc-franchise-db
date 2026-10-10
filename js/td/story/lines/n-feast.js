// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-feast.js — the feast and the loved ones, as the people in them talk
// ══════════════════════════════════════════════════════════════════════
//
// td/story/twist.js feast / loved (twists.js decides what happened and its bond changes):
//   twist.feast.table     everybody at one table; a, b, c (and d) are the loudest, most social
//   twist.feast.deal      a and b, from different sides, start a deal over dinner
//   twist.feast.connect   a and b find something real in common
//   twist.feast.clash     a says something that lands wrong with b, and it goes downhill
//   twist.feast.leak      a, too comfortable, lets something slip; b hears it ({thing}: the
//                         advantage a holds, when it was one; otherwise who a wants out)
//   twist.feast.sizeup    a watches b, the biggest threat at the table, work the room
//   twist.loved.standout  a, hit hardest by seeing family, with the closest person they have here (b,
//                         may be missing)
// Ids: 'nfe.'.

export default {
  'twist.feast.table': [
    { id: 'nfe.t1', turns: [
      { beat: "The whole cast sits down at one long table, piled with more food than any of them have seen in days." },
      { by: 'a', say: "Oh my god. Real food. Actual real food.", v: { loud: "REAL FOOD! Everybody, look at this!", dry: "Well, it's not rice, so it's already the best meal of my life.", food: "I'm going to eat everything on this table, and I'm not even sorry." } },
      { by: 'b', say: "Nobody talk to me for ten minutes, I'm busy.", v: { warm: "This is so nice, we should all be eating together like this every night.", schemer: "Everybody's going to be relaxed tonight, so I'm going to listen a lot more than I talk." } },
      { by: 'c', say: "Pass the bread before {a} eats all of it." },
      { by: 'a', say: "Too late." },
      { by: 'd', opt: true, say: "I forgot what it feels like to be full. I think I'm going to cry.", v: { tough: "Okay, this is good. I'll admit it, this is really good.", teen: "This is literally the best day of my life, no joke." } },
    ] },
    { id: 'nfe.t2', turns: [
      { beat: "For once, both sides sit side by side, and for the first few minutes nobody says a word, they just eat." },
      { by: 'b', say: "So... this is weird, right? Eating with the other team?" },
      { by: 'a', say: "It's only weird if we talk about the game, so let's not.", v: { schemer: "It's only weird if you make it weird. I'm having a great time.", blunt: "It's food. I don't care who I'm sitting next to." } },
      { by: 'c', say: "Deal. Nobody says the word vote for the rest of the night." },
      { by: 'b', say: "Vote." },
      { by: 'c', say: "Oh, come on." },
      { by: 'c', conf: "Everybody's laughing tonight, but I promise you, half this table is working, and the other half is too full to notice." },
    ] },
    { id: 'nfe.t3', when: { voice: ['loud', 'theatrical', 'goofy', 'chaotic'] }, turns: [
      { by: 'a', say: "Okay, toast! Everybody raise your cups!" },
      { by: 'b', say: "To what?" },
      { by: 'a', say: "To not starving, and to one whole night where nobody talks about tribal!" },
      { by: 'c', say: "I'll drink to that." },
      { by: 'a', conf: "One night where nobody's fighting. I'll take it, because tomorrow we're all back to stabbing each other." },
    ] },
  ],
  'twist.feast.deal': [
    { id: 'nfe.d1', turns: [
      { by: 'a', say: "Can I be honest with you? I didn't expect to like you this much.", v: { schemer: "I've been watching you all dinner, and I think you and I want the same thing.", blunt: "You're smart. I can tell. So let's talk." } },
      { by: 'b', say: "Same, honestly. Your team talks about you like you're dangerous." },
      { by: 'a', say: "Mine talks about you the same way, so maybe we should be dangerous together." },
      { by: 'b', say: "After the merge?" },
      { by: 'a', say: "After the merge. You and me, and nobody else has to know yet." },
      { by: 'b', conf: "I came to dinner for the food, and I'm leaving with a deal with somebody from the other side, which is way better than food." },
    ] },
    { id: 'nfe.d2', when: { voice: ['warm', 'earnest', 'anxious'] }, turns: [
      { by: 'b', say: "If we merge, can we look out for each other? I don't really know anybody on your side." },
      { by: 'a', say: "Yeah, I'd like that. You seem like a good person." },
      { by: 'b', say: "So do you. That's kind of rare here." },
      { by: 'a', say: "Then let's make it simple. If either of us hears our name, we tell the other one." },
      { by: 'b', say: "Deal. And if we both hear the same name?" },
      { by: 'a', say: "Then we've got our first vote together." },
      { by: 'a', conf: "{b} and I just made a deal over dessert. I really hope it lasts, because I think {b} means it." },
    ] },
  ],
  'twist.feast.connect': [
    { id: 'nfe.c1', turns: [
      { by: 'a', say: "Wait, you too? I thought I was the only one.", v: { teen: "Wait, no way, you too? That's insane!", grown: "Really? I didn't think anybody here would know what that's like." } },
      { by: 'b', say: "No, I swear. My whole family is exactly like that." },
      { by: 'a', say: "This is the first real conversation I've had since we got here." },
      { by: 'b', say: "Same. Everybody here only talks about the game." },
      { by: 'a', conf: "I didn't expect to find a real friend tonight, and I'm a little scared of what that means when it's time to vote." },
    ] },
    { id: 'nfe.c2', when: { voice: ['dry', 'calm', 'schemer', 'quiet'] }, turns: [
      { by: 'b', say: "You're a lot funnier than you let on, you know that?" },
      { by: 'a', say: "Don't tell anybody. I have a reputation." },
      { by: 'b', say: "Your secret's safe with me. But seriously, why hide it?" },
      { by: 'a', say: "Because people trust the quiet one. Nobody trusts the funny one." },
      { by: 'b', say: "I trust the funny one." },
      { by: 'a', say: "Then you're either very nice or very bad at this game." },
      { by: 'a', conf: "I don't usually let people in, but {b} got me laughing tonight, and that doesn't happen a lot." },
    ] },
  ],
  'twist.feast.clash': [
    { id: 'nfe.x1', turns: [
      { by: 'a', say: "I'm just saying, some people have been playing a lot harder than others.", v: { cruel: "I'm just saying, some people are only here because nobody's bothered to vote them out yet.", loud: "I'm just SAYING, some people haven't done anything this whole game!" } },
      { by: 'b', say: "Who are you talking about?" },
      { by: 'a', say: "If you're asking, it's probably you." },
      { beat: "The whole table goes quiet." },
      { by: 'b', say: "Wow. Okay. Enjoy your dinner.", v: { tough: "Say that again. I dare you.", emotional: "Why would you say that? We were all having a nice time." } },
      { by: 'b', conf: "We had one nice night, and {a} still couldn't keep {a.posAdj} mouth shut." },
    ] },
    { id: 'nfe.x2', turns: [
      { by: 'b', say: "Do you remember what you said about me at tribal?" },
      { by: 'a', say: "Really? You want to do this now?" },
      { by: 'b', say: "You brought it up first." },
      { by: 'a', say: "I didn't bring up anything, I asked for the salt." },
      { by: 'a', conf: "I don't know what {b}'s problem is, but it's {b}'s problem, not mine, and I'm not letting {b} ruin my dinner." },
    ] },
  ],
  'twist.feast.leak': [
    { id: 'nfe.l1', when: { thing: true }, turns: [
      { by: 'a', say: "Honestly, I'm not even worried about the next vote.", v: { loud: "I am SO not worried about the next vote, trust me.", anxious: "I'm a little less worried now, that's all, for... reasons." } },
      { by: 'b', say: "Really? Why not?" },
      { by: 'a', say: "Let's just say I've got a backup plan." },
      { by: 'b', say: "Huh. Good for you." },
      { by: 'b', conf: "Nobody says they've got a backup plan unless they have something in their bag, and I'm pretty sure {a} is sitting on the {thing}." },
    ] },
    { id: 'nfe.l2', when: { thing: true }, turns: [
      { beat: "{a} keeps one hand on {a.posAdj} bag the whole meal." },
      { by: 'b', say: "What's in the bag? You keep touching it." },
      { by: 'a', say: "Nothing! Just my stuff." },
      { by: 'b', say: "Your stuff must be really interesting, then." },
      { by: 'a', say: "It's a very interesting toothbrush. Can we talk about the food?" },
      { by: 'b', say: "Sure. Let's talk about the food." },
      { by: 'b', conf: "{a} touched that bag every time anybody said the word vote, so yeah, I'd bet anything the {thing} is in there." },
    ] },
    { id: 'nfe.l3', when: { thing: false }, turns: [
      { by: 'a', say: "If it were up to me, honestly, the next one gone would be...", v: { cruel: "If it were up to me, we'd get rid of the dead weight first, and everybody knows who that is." } },
      { by: 'a', say: "Actually, forget it. I'm too full to think." },
      { by: 'b', say: "No, go on, who?" },
      { by: 'a', say: "Nobody. Forget I said anything." },
      { by: 'b', conf: "{a} almost said a name and then stopped, but I saw exactly who {a.sub} looked at, and that's all I needed." },
    ] },
    { id: 'nfe.l4', when: { thing: false }, turns: [
      { by: 'b', conf: "{a} has had a few drinks, and {a} won't stop talking about who's at the top of {a.posAdj} list." },
      { by: 'b', conf: "I'm not saying a word. I'm just listening, and I'm remembering every single thing." },
    ] },
  ],
  'twist.feast.sizeup': [
    { id: 'nfe.s1', turns: [
      { beat: "{b} moves down the table, laughing with everybody. {a} watches." },
      { by: 'a', conf: "I've never been this close to {b} before, and now I get it. Everybody likes {b}, and that's exactly the problem." },
      { by: 'a', conf: "If {b} makes it to the merge, {b} is going to be really hard to beat.", v: { anxious: "If {b} makes it to the merge with everybody liking {b} like this, I don't know how any of us beat {b}.", competitive: "{b} is the one to beat, and I'm going to be the one who does it." } },
    ] },
    { id: 'nfe.s2', turns: [
      { by: 'a', say: "So you're the famous {b}." },
      { by: 'b', say: "Famous? What have you heard?" },
      { by: 'a', say: "Only good things, which is kind of the scary part." },
      { by: 'b', say: "I'll take that as a compliment." },
      { by: 'a', conf: "{b} is charming, and smart, and everyone at this table would do anything for {b}, and that's why {b} has to go." },
    ] },
  ],
  'twist.loved.standout': [
    { id: 'nfe.lv1', when: { pair: true }, turns: [
      { beat: "Long after the visit is over, {a} is still wiping {a.posAdj} eyes. {b} sits down beside {a.obj}." },
      { by: 'b', say: "Hey. You okay?" },
      { by: 'a', say: "I'm fine. I just didn't know how much I missed them until I saw them.", v: { tough: "I'm fine, I'm fine. It just hit me harder than I thought it would.", quiet: "...Yeah. I just miss them.", teen: "I'm okay, I just really, really miss my family, like, so much." } },
      { by: 'b', say: "That makes sense. You've been holding that in for a long time.", v: { warm: "Come here. It's okay to miss them, it means you love them.", dry: "Yeah, that'll do it. Take all the time you need.", tough: "Hey, that's nothing to be embarrassed about. Get it out." } },
      { by: 'a', say: "Thanks. I'm really glad you're here." },
      { by: 'a', conf: "Seeing my family reminded me why I'm doing this, and {b} sat with me the whole time, and I won't forget that." },
    ] },
    { id: 'nfe.lv2', when: { pair: true }, turns: [
      { by: 'a', say: "They said everybody back home is watching, that they're all proud of me." },
      { by: 'b', say: "They should be. You're doing amazing." },
      { by: 'a', say: "Then I can't go home yet. I have to make it far for them." },
      { by: 'b', say: "You will. You've already made it further than a lot of people." },
      { by: 'a', say: "Further isn't far enough. I want them to see me at the end." },
      { by: 'b', say: "Then let's get you to the end." },
      { by: 'b', conf: "I've never seen {a} like that. It made me want to protect {a.obj}, which is a dangerous thing to feel in this game." },
    ] },
    { id: 'nfe.lv3', turns: [
      { by: 'a', conf: "I held it together for the whole visit, and the second they left, I broke down." },
      { by: 'a', conf: "I'm not here just for me anymore. I'm here for them, and that changes everything.", v: { schemer: "I'm not going to let that get in my head, but it's going to make me work twice as hard.", grown: "I've got people at home who need me to do well, and I'm not going to let them down." } },
    ] },
  ],
};
