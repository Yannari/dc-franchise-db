// A crush (scenes/crush.js, scenes/romance.js torch). Who a and b are:
//   pining          a is in love with b, a's partner; b has no idea
//   crush-jealous   b is drawn to somebody else in the race, and a minds
//   crush-out       a tells b; b's answer is b's own (yes, not now, not like that)
//   torch           a told somebody on another team and was turned down; a still carries it (c, d: their partners)
// A partner crush is on any relationship that isn't family (friends, coworkers, roommates, rivals): no line here says
// what kind. A line plays at a challenge, on the road and on the mat, so it names no place and no object.
export default {
  retire: [],
  pools: {
    // ── pining ──
    'pining.stares': [
      { id: 'cr.ps1', when: { at: 'task' }, turns: [
        { beat: '{b} is reading the tip out loud. {a} isn\'t listening to a word of it.' },
        { by: 'b', say: "Did you get all that?" },
        { by: 'a', say: "Yeah. Totally." },
        { by: 'b', say: "What did I just say?" },
        { by: 'a', say: "Something about going. We should go." },
        { by: 'a', conf: "I wasn't listening. I was looking at {b.obj}. I do that a lot, and I really need to stop." },
      ] },
      { id: 'cr.ps2', turns: [
        { by: 'b', say: "Why are you smiling like that?" },
        { by: 'a', say: "Like what?" },
        { by: 'b', say: "Like you know something I don't." },
        { by: 'a', say: "I'm just happy. That's all." },
        { by: 'a', conf: "I'm in love with {b.obj}. I have been for a long time. {b.Sub} has absolutely no idea, and I'd like to keep it that way. Mostly." },
        { by: 'b', say: "Weirdo. Come on." },
      ] },
      { id: 'cr.ps3', turns: [
        { by: 'b', say: "You've got something on your face." },
        { beat: '{b} reaches over and wipes it off with a thumb. {a} goes completely still.' },
        { by: 'b', say: "There. Gone." },
        { by: 'a', say: "Thanks." },
        { by: 'a', conf: "That was nothing to {b.obj}. That was nothing. I'm going to think about it for a week." },
        { by: 'b', say: "Are you okay? You've gone red." },
      ] },
    ],
    'pining.almost-says-it': [
      { id: 'cr.pa1', turns: [
        { by: 'a', say: "Can I tell you something?" },
        { by: 'b', say: "Sure. What?" },
        { by: 'a', say: "I've been wanting to say this for a really long time, and I..." },
        { by: 'b', say: "Hold on, I think we're supposed to go that way. Sorry. What were you saying?" },
        { by: 'a', say: "Nothing. It doesn't matter." },
        { by: 'a', conf: "I was so close. I had the words. Then {b.sub} looked away, and they were gone." },
      ] },
      { id: 'cr.pa2', turns: [
        { by: 'a', say: "Do you ever think about us?" },
        { by: 'b', say: "Us? What about us?" },
        { by: 'a', say: "I don't know. Just, like, what we are." },
        { by: 'b', say: "We're a team. A really good team." },
        { by: 'a', say: "Yeah. We are." },
        { by: 'a', conf: "A really good team. That's what I got. I'll take it, I guess. For now." },
      ] },
      { id: 'cr.pa3', turns: [
        { by: 'a', say: "Okay. I'm just going to say it." },
        { by: 'b', say: "Say what?" },
        { beat: '{a} opens {a.posAdj} mouth, and nothing comes out.' },
        { by: 'a', say: "That you're doing great. Today. You're doing really great." },
        { by: 'b', say: "Thanks. You too." },
        { by: 'a', conf: "That's not what I was going to say. That's not even close to what I was going to say." },
      ] },
    ],
    'pining.helps-too-much': [
      { id: 'cr.ph1', turns: [
        { by: 'a', say: "Let me do the next one. You take a break." },
        { by: 'b', say: "I'm fine. I can do it." },
        { by: 'a', say: "I know. I just want to." },
        { by: 'b', say: "You've done everything all day. You're going to wear yourself out." },
        { by: 'a', say: "I'm fine. Honestly." },
        { by: 'b', conf: "{a} has been so sweet today. I don't know what's gotten into {a.obj}. I'm not complaining." },
      ] },
      { id: 'cr.ph2', turns: [
        { by: 'a', say: "Are you hungry? Thirsty? Do you need to sit down?" },
        { by: 'b', say: "I'm okay. You keep asking me that." },
        { by: 'a', say: "I just want to make sure you're okay." },
        { by: 'b', say: "I'm okay. Are you okay?" },
        { by: 'a', say: "I'm great." },
        { by: 'a', conf: "If I can't tell {b.obj} how I feel, I can at least make sure {b.sub} has water. That's where I am." },
      ] },
      { id: 'cr.ph3', turns: [
        { by: 'b', say: "You didn't have to wait for me back there." },
        { by: 'a', say: "Of course I did." },
        { by: 'b', say: "We lost a few minutes." },
        { by: 'a', say: "I'd lose a lot more than a few minutes for you." },
        { by: 'b', say: "That's sweet. Weird, but sweet." },
        { by: 'a', conf: "Weird, but sweet. That's me. That's my whole life right now." },
      ] },
    ],

    // ── crush-jealous ── (b is drawn to somebody else in the race)
    'crush-jealous.swallows-it': [
      { id: 'cr.js1', turns: [
        { by: 'b', say: "Is it just me, or is there somebody really cute on one of the other teams?" },
        { by: 'a', say: "I hadn't noticed." },
        { by: 'b', say: "You must have noticed. Everybody's noticed." },
        { by: 'a', say: "Nope." },
        { by: 'a', conf: "I noticed. I noticed {b.sub} noticed. I'm going to smile and say nothing, because what else can I do?" },
        { by: 'b', say: "You're no fun." },
      ] },
      { id: 'cr.js2', turns: [
        { beat: '{b} is still smiling about somebody from another team, and {a} is very busy looking at the map.' },
        { by: 'b', say: "What do you think? Should I talk to them more?" },
        { by: 'a', say: "If you want to." },
        { by: 'b', say: "That's not an answer." },
        { by: 'a', say: "It's your life. Do what makes you happy." },
        { by: 'a', conf: "Do what makes you happy. I said that. Out loud. And I meant it, which is the worst part." },
      ] },
    ],
    'crush-jealous.snipes': [
      { id: 'cr.jn1', turns: [
        { by: 'b', say: "Did you see who was waving at me?" },
        { by: 'a', say: "Yeah. Can we focus on the race, maybe?" },
        { by: 'b', say: "Whoa. What's your problem?" },
        { by: 'a', say: "I don't have a problem. We just have a race to run." },
        { by: 'b', say: "Fine. Sorry." },
        { by: 'a', conf: "That wasn't fair of me. {b.Sub} didn't do anything wrong. I just can't stand watching it." },
      ] },
      { id: 'cr.jn2', turns: [
        { by: 'b', say: "You're in a mood." },
        { by: 'a', say: "I'm not in a mood." },
        { by: 'b', say: "You've been in a mood since we got here." },
        { by: 'a', say: "Maybe I'm tired of watching you flirt with half the race." },
        { by: 'b', say: "Half the race? It's one person. And what does it matter to you?" },
        { by: 'a', say: "It doesn't. Forget it." },
        { by: 'a', conf: "It matters. It matters a lot. That's the whole problem." },
      ] },
    ],
    'crush-jealous.tells-camera': [
      { id: 'cr.jt1', turns: [
        { by: 'a', conf: "So {b} has a crush on somebody from another team. Which is great. Love that for {b.obj}." },
        { by: 'a', conf: "I'm fine. I'm totally fine. I'm going to be fine at some point." },
        { by: 'b', say: "Who are you talking to?" },
        { by: 'a', say: "Nobody. Let's go." },
        { by: 'b', say: "You're being weird today." },
        { by: 'a', say: "I'm always weird. Come on." },
      ] },
      { id: 'cr.jt2', turns: [
        { by: 'b', say: "I think they like me back. Isn't that crazy?" },
        { by: 'a', say: "That's not crazy at all." },
        { by: 'b', say: "You think?" },
        { by: 'a', say: "Anybody would be lucky." },
        { by: 'a', conf: "Anybody would be lucky. I would be lucky. I'm standing right here, and {b.sub} can't see it." },
        { by: 'b', say: "You're the best, you know that?" },
      ] },
    ],

    // ── crush-out ── (a tells b)
    'crush-out.together': [
      { id: 'cr.ot1', turns: [
        { by: 'a', say: "I have to tell you something, and I need you to let me get all the way through it." },
        { by: 'b', say: "Okay. You're scaring me a bit." },
        { by: 'a', say: "I'm in love with you. I have been for a long time. I didn't want to ruin anything." },
        { beat: '{b} doesn\'t say anything for a long moment.' },
        { by: 'b', say: "You're not ruining anything. I think I've felt it too. I just didn't let myself think about it." },
        { by: 'a', say: "Really?" },
        { by: 'b', say: "Really." },
        { beat: 'They kiss.' },
        { by: 'a', conf: "I've wanted to say that for so long. And {b.sub} said it back. I don't think I'm going to stop smiling for the rest of the race." },
      ] },
      { id: 'cr.ot2', turns: [
        { by: 'a', say: "Can I be honest with you about something?" },
        { by: 'b', say: "Always." },
        { by: 'a', say: "I like you. Not as a teammate. I really like you." },
        { by: 'b', say: "Oh thank goodness." },
        { by: 'a', say: "What?" },
        { by: 'b', say: "I've been trying to work out how to tell you the same thing for days." },
        { by: 'b', conf: "We could have had this conversation a week ago. We're both idiots. Happy idiots, now." },
      ] },
      { id: 'cr.ot3', turns: [
        { by: 'a', say: "I don't want to make this weird." },
        { by: 'b', say: "Make what weird?" },
        { by: 'a', say: "I have feelings for you. Real ones." },
        { by: 'b', say: "Okay. Can I say something too?" },
        { by: 'a', say: "Please." },
        { by: 'b', say: "I do too. I didn't know it until right now, but I do." },
        { by: 'a', conf: "I thought I was going to lose my partner today. Instead I think I got a lot more than that." },
      ] },
    ],
    'crush-out.not-now': [
      { id: 'cr.on1', turns: [
        { by: 'a', say: "I need to tell you something. I have feelings for you. I have for a while." },
        { by: 'b', say: "Wow. Okay. I didn't see that coming." },
        { by: 'a', say: "You don't have to say anything." },
        { by: 'b', say: "I want to. I just don't know what I feel yet, and we're in the middle of all this." },
        { by: 'a', say: "That's fair." },
        { by: 'b', say: "Can we talk about it properly when this is over?" },
        { by: 'a', conf: "It's not a no. It's not a yes, either. But it's not a no, and I'll take that." },
      ] },
      { id: 'cr.on2', turns: [
        { by: 'a', say: "I like you. More than a friend." },
        { by: 'b', say: "I don't know what to say." },
        { by: 'a', say: "Say whatever you're thinking." },
        { by: 'b', say: "I'm thinking I care about you a lot, and I'm scared of getting it wrong." },
        { by: 'a', say: "So let's not get it wrong. Let's just race, and see." },
        { by: 'b', conf: "I've never thought about {a.obj} like that. Now I can't stop thinking about it. I need time." },
      ] },
    ],
    'crush-out.not-like-that': [
      { id: 'cr.ol1', turns: [
        { by: 'a', say: "I have to tell you something. I'm in love with you." },
        { beat: '{b} looks at {a} for a long moment, and {a} can see the answer before it comes.' },
        { by: 'b', say: "I'm so sorry. I love you, but not like that." },
        { by: 'a', say: "Okay." },
        { by: 'b', say: "Please don't hate me." },
        { by: 'a', say: "I don't. I could never hate you. I just need a minute." },
        { by: 'a', conf: "I knew. I think I always knew. I just needed to hear it so I could stop hoping." },
        { by: 'b', conf: "I don't want to lose {a.obj}. I really hope I haven't." },
      ] },
      { id: 'cr.ol2', turns: [
        { by: 'a', say: "Do you ever think we could be more than this?" },
        { by: 'b', say: "More than what?" },
        { by: 'a', say: "More than a team. I've wanted to ask you that for so long." },
        { by: 'b', say: "I don't feel that way. I'm sorry. I really am." },
        { by: 'a', say: "Don't be sorry. You can't help it." },
        { beat: 'They walk on side by side, and for the first time all race, neither of them knows what to say.' },
        { by: 'a', conf: "We still have to finish this together. I don't know how I'm going to look at {b.obj}." },
      ] },
    ],

    // ── torch ── (a was turned down by b, who is on another team)
    'torch.still-pining': [
      { id: 'cr.ts1', turns: [
        { beat: '{a} watches {b} from across the way, and doesn\'t look away fast enough.' },
        { by: 'c', say: "You're doing it again." },
        { by: 'a', say: "Doing what?" },
        { by: 'c', say: "Looking. {b.Sub} said no. You know {b.sub} said no." },
        { by: 'a', say: "I know. I'm just looking." },
        { by: 'a', conf: "{b.Sub} was really kind about it. That almost makes it worse. It would be easier if {b.sub} were mean." },
      ] },
      { id: 'cr.ts2', turns: [
        { by: 'b', say: "Hey. Are we okay?" },
        { by: 'a', say: "We're okay." },
        { by: 'b', say: "I just don't want it to be weird." },
        { by: 'a', say: "It's not weird. Good luck out there." },
        { beat: '{b} goes. {a} keeps smiling until {b.sub}\'s out of sight, and then stops.' },
        { by: 'a', conf: "It's weird. It's so weird. But {b.sub} doesn't need to know that." },
      ] },
    ],
    'torch.moves-on': [
      { id: 'cr.tm1', turns: [
        { by: 'c', say: "You seem better today." },
        { by: 'a', say: "I am, actually." },
        { by: 'c', say: "About {b}?" },
        { by: 'a', say: "About {b}. {b.Sub} said no, and that's okay. I'm here to race." },
        { by: 'c', say: "Look at you." },
        { by: 'a', conf: "I spent long enough feeling sorry for myself. I'm done being sad in front of a camera." },
      ] },
      { id: 'cr.tm2', turns: [
        { by: 'b', say: "I wanted to say sorry. About before." },
        { by: 'a', say: "You don't have to. You were honest. That's all I wanted." },
        { by: 'b', say: "Friends?" },
        { by: 'a', say: "Friends. Now get out of my way. I'm winning this leg." },
        { by: 'b', say: "We'll see about that." },
        { by: 'a', conf: "I feel lighter. I didn't think I would, but I do." },
      ] },
    ],
    'torch.watches-them': [
      { id: 'cr.tw1', turns: [
        { beat: '{b} laughs at something, close to somebody else, and {a} sees all of it.' },
        { by: 'c', say: "Don't look." },
        { by: 'a', say: "I'm not looking." },
        { by: 'c', say: "You're looking." },
        { by: 'a', say: "{b.Sub} looks happy. That's good. That's what I want for {b.obj}." },
        { by: 'a', conf: "That's what I'm supposed to say. Some days I even mean it." },
      ] },
      { id: 'cr.tw2', turns: [
        { by: 'c', say: "Are you okay? You've gone really quiet." },
        { by: 'a', say: "{b} is with somebody now." },
        { by: 'c', say: "I know. I'm sorry." },
        { by: 'a', say: "It's fine. It's not like I had a chance." },
        { by: 'c', say: "Come on. Let's beat both of them." },
        { by: 'a', conf: "Beating them would help. A little. Not a lot, but a little." },
      ] },
    ],
  },
};
