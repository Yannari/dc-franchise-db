// Between the two partners: scenes of 6 to 12 lines for the story moments (an old wound, managing a partner, fear,
// getting lost, the weather, a bonding moment), quick hits for the judge. a is the one the moment is about (the one
// leading, the scared one, the one who brings it up), b the partner. Written again 2026-11-03 the way two people
// actually talk under pressure (the user: "they talk like a bad translation ... they dont talk like everyday real
// people"): no sketch, no punchline, no narrator joke in the beats; an old wound is something any two partners could
// have between them, said plainly.
const keys = (kind, endings) => [...endings.map(e => `${kind}.${e}`), `${kind}.any`];

export default {
  retire: [
    ...keys('manage-partner', ['bribe', 'reverse-psych', 'distract', 'token', 'cover-mouth']),
    ...keys('fear-through', ['talked-down', 'freezes', 'swap']),
    ...keys('old-wound', ['surfaces', 'told-calmly', 'explodes']),
    ...keys('bond-moment', ['laugh', 'memory', 'gratitude']),
    ...keys('weather', ['wait-it-out', 'push-on']),
    ...keys('which-way', ['right', 'argue-right', 'argue-wrong', 'ask-local']),
    ...keys('judge-yes', ['approved', 'grudging']),
  ],
  pools: {
    // ── managing a partner: getting them through a task that keeps going wrong ──
    'manage-partner.bribe': [
      { id: 'pa.mb-1', turns: [
        { beat: '{a} pulls a chocolate bar out of {a.posAdj} bag.' },
        { by: 'a', say: "See this? It's yours as soon as we're done." },
        { by: 'b', say: "Are you seriously bribing me right now?" },
        { by: 'a', say: "Yes. Is it working?" },
        { by: 'b', say: "...Maybe. What kind is it?" },
        { beat: '{b} goes back to it, a bit faster this time.' },
      ] },
      { id: 'pa.mb-2', turns: [
        { by: 'b', say: "I need a break. Five minutes. I can't feel my hands." },
        { by: 'a', say: "Okay, new deal. You finish this, and I'll carry your bag for the rest of the day." },
        { by: 'b', say: "The whole day?" },
        { by: 'a', say: "The whole day. I promise." },
        { by: 'b', say: "You're going to regret that. It's really heavy." },
        { beat: '{b} gets it on the next try. {a} picks up the bag and groans.' },
      ] },
    ],
    'manage-partner.reverse-psych': [
      { id: 'pa.mr-1', turns: [
        { by: 'a', say: "You know what, maybe this one's too hard for you. We can just take the penalty." },
        { by: 'b', say: "Too hard for me?" },
        { by: 'a', say: "It's fine. Not everybody can do everything." },
        { by: 'b', say: "Give me that. Stand back." },
        { beat: '{b} gets it on the next try, glaring at {a} the whole time.' },
        { by: 'b', say: "I know exactly what you just did." },
        { by: 'a', say: "And it worked." },
      ] },
      { id: 'pa.mr-2', turns: [
        { by: 'a', say: "Honestly, it's okay if you can't. I'll tell everyone back home you tried really hard." },
        { by: 'b', say: "You'll tell them I tried?" },
        { by: 'a', say: "Really hard. I'll say you really tried." },
        { by: 'b', say: "No way. Nobody's saying I 'tried'." },
        { beat: '{b} grits {b.posAdj} teeth and does it, faster than either of them expected.' },
        { by: 'a', say: "See? You didn't try. You did it." },
      ] },
    ],
    'manage-partner.distract': [
      { id: 'pa.md-1', turns: [
        { by: 'b', say: "I can't do this. It's too much. I can't, I can't." },
        { by: 'a', say: "Okay, talk to me. What's the first thing you're going to eat when we get home?" },
        { by: 'b', say: "What? Why are you asking me that right now?" },
        { by: 'a', say: "Just tell me. Keep going and tell me." },
        { by: 'b', say: "I don't know... lasagna. A huge plate of lasagna." },
        { beat: 'By the time {b} has finished talking about the lasagna, it\'s done.' },
        { by: 'a', say: "See? You did it. You didn't even notice." },
      ] },
      { id: 'pa.md-2', turns: [
        { by: 'a', say: "Tell me about the best holiday you've ever had." },
        { by: 'b', say: "Now? We're in the middle of this!" },
        { by: 'a', say: "Yes, now. Talk and do it at the same time." },
        { by: 'b', say: "Okay... the lake. When I was a kid. We had this little cabin, and the roof leaked." },
        { beat: 'Halfway through the story about the cabin, {b} realises it\'s finished.' },
        { by: 'b', say: "Wait. Did I just do it?" },
        { by: 'a', say: "You did it. Tell me the rest later." },
      ] },
    ],
    'manage-partner.token': [
      { id: 'pa.mt-1', turns: [
        { by: 'a', say: "Here. Wear my cap. It's my lucky one." },
        { by: 'b', say: "Since when do you have a lucky cap?" },
        { by: 'a', say: "Since right now. Just put it on." },
        { beat: '{b} puts it on. It\'s too big.' },
        { by: 'b', say: "This is so stupid." },
        { by: 'a', say: "I know. Do it anyway." },
        { beat: 'With the cap pushed back, {b} gets it first time, and doesn\'t give the cap back.' },
      ] },
      { id: 'pa.mt-2', turns: [
        { by: 'a', say: "Hold out your hand." },
        { by: 'b', say: "Why?" },
        { beat: '{a} presses a small, smooth stone into {b}\'s palm.' },
        { by: 'a', say: "I picked it up at the start, and I've had it in my pocket ever since. Hold on to it." },
        { by: 'b', say: "It's a rock." },
        { by: 'a', say: "It's a lucky rock. Hold it and go." },
        { beat: 'With the stone in one fist, {b} gets it on the next try.' },
      ] },
    ],
    'manage-partner.cover-mouth': [
      { id: 'pa.mc-1', turns: [
        { by: 'b', say: "Okay, so if we do it the other way, which I think we should, because—" },
        { beat: '{a} puts a hand over {b}\'s mouth.' },
        { by: 'a', say: "Stop talking. Just do it. Don't explain it, do it." },
        { by: 'b', say: "Mmf." },
        { beat: '{b} does it, without a word, and it works.' },
        { by: 'b', say: "That was really rude." },
        { by: 'a', say: "I know. Sorry. But we're through." },
      ] },
      { id: 'pa.mc-2', turns: [
        { by: 'b', say: "Wait, wait, should we think about this first? I feel like we should think about this." },
        { by: 'a', say: "We've been thinking about it for ten minutes." },
        { by: 'b', say: "I know, but what if—" },
        { beat: '{a} covers {b}\'s mouth with one hand and points with the other.' },
        { by: 'a', say: "Do it now. Think later." },
        { beat: 'It works. {b} gives {a} a long look, then a high five.' },
      ] },
    ],

    // ── fear: talking a partner through it ──
    'fear-through.talked-down': [
      { id: 'pa.ft-1', when: { fearDoes: 'rail' }, turns: [
        { beat: '{a} is gripping the rail with both hands and won\'t let go.' },
        { by: 'b', say: "Look at me. Don't look down, look at me. You're doing so good." },
        { by: 'a', say: "I'm not doing good. I'm holding a rail." },
        { by: 'b', say: "Okay. Now just let go with one hand." },
        { by: 'a', say: "Why would I do that? No. No way." },
        { by: 'b', say: "Because I'm right here. I'm not going anywhere. One hand." },
        { beat: 'One hand, then the other. Step by step, with {b} counting every one out loud, they make it across.' },
        { by: 'a', say: "Oh my God. Oh my God, I did it." },
      ] },
      { id: 'pa.ft-2', when: { fearDoes: ['rail', 'rope'] }, turns: [
        { by: 'a', say: "I can't. I'm going to fall. I know I'm going to fall." },
        // (the rail on the tower's deck or a rope: the clip is what holds them on both, 2026-10-22)
        { by: 'b', say: "You're not going to fall. You're clipped in. Look. You're attached." },
        { by: 'a', say: "What if the clip breaks?" },
        { by: 'b', say: "It's not going to break. It's built for this. Breathe." },
        { by: 'a', say: "I'm breathing. I'm breathing." },
        { by: 'b', say: "Okay. Now one step. Just one." },
        { beat: 'One step, then another. {a} makes it across without looking down once.' },
      ] },
    ],
    'fear-through.freezes': [
      { id: 'pa.ff-1', turns: [
        { by: 'b', say: "Okay. Your turn. You've got this." },
        { by: 'a', say: "I don't have this. I really don't." },
        { by: 'b', say: "Then take a minute. Take as long as you need." },
        { beat: 'One minute goes by. Then five. Then ten.' },
        { by: 'b', say: "How are you doing?" },
        { by: 'a', say: "I'm trying. I'm trying to make myself do it." },
        { beat: 'Fifteen minutes after it started, {a} finally moves.' },
      ] },
      { id: 'pa.ff-2', turns: [
        { beat: '{a} gets to the start, stops, and goes very pale.' },
        { by: 'a', say: "I need a second." },
        { by: 'b', say: "Take a second." },
        { by: 'a', say: "I think I need a lot of seconds." },
        { by: 'b', say: "That's okay. But every team that comes past us is a team ahead of us." },
        { by: 'a', say: "I know. I know. Just give me a minute." },
        { beat: 'It takes {a} almost fifteen minutes to go.' },
      ] },
    ],
    'fear-through.swap': [
      { id: 'pa.fs-1', turns: [
        { by: 'a', say: "I can't do the scary part. I'll do anything else, just not that." },
        { by: 'b', say: "Then let's swap. I'll do the scary part, you do the rest. Okay?" },
        { by: 'a', say: "You'd do that?" },
        { by: 'b', say: "I'm scared of it too. Just not as much as you." },
        { beat: 'They swap. {b} does the scary part, and {a} flies through the rest.' },
        { by: 'a', say: "Thank you. Seriously. I owe you." },
        { by: 'b', say: "You owe me big. Come on." },
      ] },
      { id: 'pa.fs-2', turns: [
        { by: 'b', say: "You're shaking. You're actually shaking." },
        { by: 'a', say: "I'm fine. I'm fine." },
        { by: 'b', say: "You're not fine. Give me the scary part. You do the bit at the end." },
        { by: 'a', say: "Are you sure?" },
        { by: 'b', say: "No. But give it to me before I change my mind." },
        { beat: 'They swap. It goes much better that way round.' },
      ] },
    ],

    // ── old wounds ──
    'old-wound.surfaces': [
      { id: 'pa.ws-1', turns: [
        { by: 'a', say: "You're laughing at me." },
        { by: 'b', say: "I'm not laughing at you. I'm just laughing." },
        { by: 'a', say: "You always laugh when I mess something up. You've done it for years." },
        { by: 'b', say: "That's not true." },
        { by: 'a', say: "It is true. And it really hurts, every time." },
        { by: 'b', say: "I didn't know it bothered you that much." },
        { by: 'a', say: "Well, it does. Can we just keep going?" },
        { beat: 'They keep going. {b} doesn\'t laugh again for the rest of the leg.' },
      ] },
      { id: 'pa.ws-2', when: { relFam: 'exes' }, turns: [
        { by: 'b', say: "You always do that. You walk ahead so you don't have to talk to me." },
        { by: 'a', say: "I'm walking at a normal speed." },
        { by: 'b', say: "You did it the whole time we were together. Every time we went anywhere." },
        { by: 'a', say: "That's not fair." },
        { by: 'b', say: "It's true, though. I always felt like I was chasing you." },
        { beat: '{a} slows down and walks next to {b} for a while.' },
        { by: 'a', say: "I didn't know you felt like that." },
      ] },
      { id: 'pa.ws-3', turns: [
        { by: 'b', say: "You're doing the thing where you don't ask me what I think." },
        { by: 'a', say: "I'm just trying to keep us moving." },
        { by: 'b', say: "You do it at home too. You just decide, and I find out after." },
        { by: 'a', say: "I don't do it on purpose." },
        { by: 'b', say: "I know you don't. But it still makes me feel like I don't matter." },
        { beat: 'They keep walking. At the next turn, {a} stops and asks {b} which way.' },
      ] },
    ],
    'old-wound.told-calmly': [
      { id: 'pa.wc-1', turns: [
        { by: 'a', say: "Can I tell you something I've never told you?" },
        { by: 'b', say: "Uh oh. Okay." },
        { by: 'a', say: "It's not bad. When I lost my job, you told everybody before I was ready." },
        { by: 'b', say: "I thought I was helping. I thought people would be nicer to you." },
        { by: 'a', say: "I know that now. But back then, I just felt like everybody was looking at me." },
        { by: 'b', say: "I'm sorry. I really didn't think about it like that." },
        { by: 'a', say: "It's okay. I just wanted you to know." },
      ] },
      { id: 'pa.wc-2', when: { relFam: 'family' }, turns: [
        { by: 'b', say: "Do you remember the year you were never home?" },
        { by: 'a', say: "I remember." },
        { by: 'b', say: "I used to wait up for you. Every weekend. I thought you'd come back." },
        { by: 'a', say: "I didn't know that." },
        { by: 'b', say: "I know you didn't. That's why I'm telling you." },
        { by: 'a', say: "I'm sorry. I'm really sorry." },
        { beat: '{a} puts an arm round {b}\'s shoulders, and they walk like that for a while.' },
      ] },
      { id: 'pa.wc-3', turns: [
        { by: 'b', say: "I need to tell you something, and I need you to not get defensive." },
        { by: 'a', say: "Okay. I'll try." },
        { by: 'b', say: "When you didn't come to my graduation, I told everybody you were sick. You weren't sick." },
        { by: 'a', say: "No. I wasn't. I was scared I'd say the wrong thing and ruin it for you." },
        { by: 'b', say: "You wouldn't have. I just wanted you there." },
        { beat: 'Neither of them says anything for a while. Then {a} nods.' },
        { by: 'a', say: "I'll be there for the next thing. Whatever it is. I promise." },
      ] },
    ],
    'old-wound.explodes': [
      { id: 'pa.we-1', turns: [
        { by: 'a', say: "This is exactly what you did on that camping trip." },
        { by: 'b', say: "Do not bring up the camping trip." },
        { by: 'a', say: "You said you knew the way, and we walked around in the dark for three hours." },
        { by: 'b', say: "And we found it, didn't we?" },
        { by: 'a', say: "At two in the morning! I was crying!" },
        { by: 'b', say: "You're always going to hold that against me, aren't you?" },
        { beat: 'People nearby turn to look. Neither of them notices.' },
        { by: 'a', say: "Yes! Because you're doing it again right now!" },
      ] },
      { id: 'pa.we-2', turns: [
        { by: 'b', say: "You always do this. You take over, and nobody else gets a say." },
        { by: 'a', say: "Somebody has to make a decision!" },
        { by: 'b', say: "You did it at every party. Every holiday. You plan it all and you never ask anybody." },
        { by: 'a', say: "Because if I don't do it, nobody does!" },
        { by: 'b', say: "Maybe because you never let us!" },
        { beat: 'It gets louder. A few people walking past stop and stare.' },
        { by: 'a', say: "Okay. Okay. We are not doing this here." },
      ] },
    ],

    // ── bonding ──
    'bond-moment.laugh': [
      { id: 'pa.bl-1', turns: [
        { beat: '{a} trips over nothing, and both of them start laughing.' },
        { by: 'b', say: "What was that? You tripped on nothing!" },
        { by: 'a', say: "The ground's uneven!" },
        { by: 'b', say: "The ground is completely flat!" },
        { beat: 'They laugh so hard they have to stop walking. It\'s the first time they\'ve laughed all day.' },
        { by: 'a', say: "Oh, I needed that. I really needed that." },
      ] },
      { id: 'pa.bl-2', turns: [
        { by: 'a', say: "Do you remember that voice you used to do? When we were younger?" },
        { by: 'b', say: "No. I'm not doing the voice. Not on TV." },
        { by: 'a', say: "Please. Just one sentence." },
        { by: 'b', say: "...Fine. One sentence." },
        { beat: '{b} does the voice, and they both crack up.' },
        { by: 'a', say: "It's still so good. Oh my God." },
      ] },
    ],
    'bond-moment.memory': [
      { id: 'pa.bm-1', turns: [
        { by: 'a', say: "This reminds me of that road trip. When the car broke down." },
        { by: 'b', say: "Oh my God. We sat on the side of the road all night, eating cereal out of the box." },
        { by: 'a', say: "Best night of that whole summer." },
        { by: 'b', say: "It really was." },
        { beat: 'They walk on, both smiling.' },
        { by: 'a', say: "Let's do it again when this is over. A road trip." },
      ] },
      { id: 'pa.bm-2', when: { relFam: 'romantic' }, turns: [
        { by: 'b', say: "Do you know what this smell reminds me of?" },
        { by: 'a', say: "The bakery near our old place?" },
        { by: 'b', say: "Yes! We used to wake up so early because of it." },
        { by: 'a', say: "And we'd go down and buy whatever was cheapest, because we were broke." },
        { by: 'b', say: "We were so broke. That was such a good time, though." },
        { beat: 'For a moment, they forget they\'re in a race at all.' },
      ] },
    ],
    'bond-moment.gratitude': [
      { id: 'pa.bg-1', turns: [
        { by: 'a', say: "Can I say something? And you're not allowed to make fun of me." },
        { by: 'b', say: "No promises." },
        { by: 'a', say: "You haven't once made me feel stupid this whole race. Even when I was being stupid." },
        { by: 'b', say: "You were stupid a lot, though." },
        { by: 'a', say: "I know. That's what I'm saying. Thank you." },
        { beat: '{b} doesn\'t say anything. {b.Sub} just bumps {a}\'s shoulder with {b.posAdj} own.' },
      ] },
      { id: 'pa.bg-2', turns: [
        { by: 'b', say: "Thank you, by the way." },
        { by: 'a', say: "For what?" },
        { by: 'b', say: "For not losing it with me today. I've been a lot, and you just kept going." },
        { by: 'a', say: "You haven't been that bad." },
        { by: 'b', say: "I've been pretty bad." },
        { by: 'a', say: "Okay, a little bad. It's fine. I mean it." },
      ] },
    ],

    // ── the weather ──
    'weather.wait-it-out': [
      { id: 'pa.ww-1', turns: [
        { beat: 'The sky goes dark, and the rain comes down so hard they can barely see.' },
        { by: 'a', say: "We wait. If we go out in that, we'll get lost and lose even more time." },
        { by: 'b', say: "What if everybody else is going right now?" },
        { by: 'a', say: "Then everybody else is getting lost. We wait." },
        { beat: 'They huddle under whatever cover they can find for half an hour. Then the rain stops.' },
        { by: 'b', say: "Okay. Okay, it's stopped. Go, go!" },
      ] },
      { id: 'pa.ww-2', turns: [
        { beat: 'Thunder. The whole sky lights up for a second.' },
        { by: 'b', say: "Nope. We're not going out in that. Sit down." },
        { by: 'a', say: "We'll lose an hour. Maybe more." },
        { by: 'b', say: "We'll lose a lot more than an hour if we get hit by lightning." },
        { by: 'a', say: "...Okay. Fair." },
        { beat: 'They sit and watch the storm, not saying much.' },
      ] },
    ],
    'weather.push-on': [
      { id: 'pa.wp-1', turns: [
        { beat: 'The wind picks up so hard it nearly pulls the tip out of {b}\'s hand.' },
        { by: 'b', say: "Everybody else is waiting this out. Maybe we should too." },
        { by: 'a', say: "That's exactly why we shouldn't. This is how we get ahead." },
        { by: 'b', say: "Or this is how we get blown off a hill." },
        { by: 'a', say: "Then stay low and walk fast. Come on." },
        { beat: 'They go. It\'s horrible, but they pass three teams sheltering in doorways.' },
        { by: 'b', say: "Okay. Fine. You were right." },
      ] },
      { id: 'pa.wp-2', turns: [
        { by: 'a', say: "It's just rain. We're already wet. Come on." },
        { by: 'b', say: "We're going to get soaked." },
        { by: 'a', say: "We're already soaked! Everybody else is hiding. This is our chance." },
        { by: 'b', say: "Okay. Okay, let's go." },
        { beat: 'They run through the downpour.' },
        { by: 'b', say: "I'm so wet. I'm so wet." },
        { by: 'a', say: "But we passed people! Keep going!" },
      ] },
    ],

    // ── getting there ──
    'which-way.right': [
      { id: 'pa.yr-1', turns: [
        { by: 'b', say: "Left or right?" },
        { by: 'a', say: "Right. There's a sign. Look." },
        { by: 'b', say: "Are you sure that sign's for us?" },
        { by: 'a', say: "It's the only sign. Come on." },
        { beat: 'They follow the sign. It goes exactly where they need to be.' },
        { by: 'b', say: "Okay. Good. Nice one." },
      ] },
      { id: 'pa.yr-2', turns: [
        { by: 'a', say: "I think it's this way." },
        { by: 'b', say: "You think, or you know? Because the last time you thought, we got really lost." },
        { by: 'a', say: "I know. Pretty much." },
        { beat: 'It is the right way.' },
        { by: 'a', say: "See? I told you." },
        { by: 'b', say: "Okay. You were right. Don't make a big deal of it." },
      ] },
    ],
    'which-way.argue-right': [
      { id: 'pa.ya-1', turns: [
        { by: 'b', say: "This isn't right. I'm sure we've walked past here before." },
        { by: 'a', say: "It's right. Trust me." },
        { by: 'b', say: "You said 'trust me' an hour ago and we got lost." },
        { by: 'a', say: "Well, this time I'm right." },
        { beat: 'Round the next corner is exactly where they need to be.' },
        { by: 'a', say: "Told you." },
        { by: 'b', say: "Don't." },
      ] },
      { id: 'pa.ya-2', turns: [
        { by: 'b', say: "Shouldn't we ask somebody?" },
        { by: 'a', say: "We don't need to. I can see it from here." },
        { by: 'b', say: "Where? I don't see anything." },
        { by: 'a', say: "Right there. Behind the trees." },
        { beat: 'It is right there, behind the trees.' },
        { by: 'b', say: "Okay. Good eyes." },
      ] },
    ],
    'which-way.argue-wrong': [
      { id: 'pa.yw-1', turns: [
        { by: 'b', say: "I think we should turn around." },
        { by: 'a', say: "We don't need to turn around. I know where I'm going." },
        { by: 'b', say: "You say that every time, and every time we end up turning around." },
        { by: 'a', say: "Not this time." },
        { beat: 'Twenty minutes later, they turn around.' },
        { by: 'b', say: "I'm not going to say anything." },
        { by: 'a', say: "Good. Don't." },
      ] },
      { id: 'pa.yw-2', turns: [
        { by: 'a', say: "Let's cut through here. It's shorter, I'm sure it's shorter." },
        { by: 'b', say: "We're already behind. We can't afford to get lost." },
        { by: 'a', say: "That's exactly why we need a shortcut." },
        { beat: 'The shortcut ends at a wall.' },
        { by: 'b', say: "It's a dead end. Great. Really great." },
        { by: 'a', say: "Okay, I see it. Let's go back." },
      ] },
    ],
    'which-way.ask-local': [
      { id: 'pa.yl-1', turns: [
        { by: 'a', say: "Excuse me, sorry, do you know where this is?" },
        { beat: 'The local looks at the tip, then points up a very steep hill.' },
        { by: 'b', say: "All the way up there?" },
        { by: 'a', say: "Thank you! Thank you so much." },
        { beat: 'They climb. It\'s the right way, but it takes everything they have.' },
        { by: 'b', say: "My legs. Oh my God, my legs." },
      ] },
      { id: 'pa.yl-2', turns: [
        { by: 'b', say: "Excuse me. Hi. Do you know which way this is?" },
        { beat: 'The local thinks about it for a long time, then points one way, then the other.' },
        { by: 'a', say: "Which one? This way or that way?" },
        { by: 'b', say: "Thank you. Thanks." },
        { beat: 'They pick one. It turns out to be the long way round.' },
        { by: 'a', say: "Next time, we ask two people." },
      ] },
    ],

    // ── the judge, a quick hit ──
    'judge-yes.approved': [
      { id: 'pa.ja-1', turns: [
        { by: 'a', say: "Is it good? Please say it's good." },
        { by: 'local', say: "It's good." },
        { by: 'a', say: "It's good! {b}, it's good!" },
        { by: 'b', say: "I heard! Grab the tip!" },
      ] },
      { id: 'pa.ja-2', turns: [
        { beat: '{local} looks at it for a long time, then hands over the tip without a word.' },
        { by: 'b', say: "Was that a yes? That was a yes." },
        { by: 'a', say: "Don't ask. Just go." },
      ] },
    ],
    'judge-yes.grudging': [
      { id: 'pa.jg-1', turns: [
        { by: 'local', say: "That's... fine. Fine. Here." },
        { by: 'a', say: "Just fine? I thought it looked really good." },
        { by: 'b', say: "Take the tip. Take the tip and go." },
      ] },
      { id: 'pa.jg-2', turns: [
        { beat: '{local} sighs, and nods.' },
        { by: 'b', say: "Was that a nod? I'm taking that as a nod." },
        { by: 'a', say: "That was a nod. Go!" },
      ] },
    ],
  },
};
