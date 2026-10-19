// The two voices the six registers had no room for (the user, 2026-10-19: "we have so many more tags, do you think
// we would need more dialogues?"). Read off the roster's authored voices, 17 characters are silly (goofy, ditzy,
// food-obsessed, theatrical, chaotic) and 20 are shy (anxious, quiet), and neither sounds like any of the six:
//   goofy   silly, distracted, food on the brain, a little dramatic, gets lost halfway through a thought
//   shy     hesitant, apologetic, says less than they mean, "um", "sorry if that's weird"
// Data only, in the same shapes as registers.js and chat-voices.js; merged into their pools by key, so every moment
// that has the six voices has these two as well. Slots and facts are those of the pool each list joins.
const R = (key, byRegister, kind = 'say') => ({
  [key]: Object.entries(byRegister).flatMap(([register, lines]) => lines.map((line, i) => {
    const [text, beat, more] = Array.isArray(line) ? line : [line];
    return { id: `${key}.${register}${i + 1}`, when: { register, ...(more || {}) }, turns: [{ by: 'a', [kind]: text }], ...(beat ? { beat } : {}) };
  })),
});
const V = (key, byRegister) => ({
  [key]: Object.entries(byRegister).flatMap(([register, list]) => list.map((turns, i) => ({
    id: `${key}.v.${register}${i + 1}`, when: { register },
    turns: turns.map(([by, text, kind = 'send']) => ({ by, [kind]: text })),
  }))),
});

export const REGISTER_MORE = {
  // ── Ratings (said aloud to the Circle) ────────────────────────────────
  ...R('rate.middle', {
    goofy: ["{b}, you're the filling in my sandwich cookie. That's a compliment. The middle is the best part.", "Middle for {b}! Wait, is the middle good? Circle, is the middle good? Okay. Middle."],
    shy: ["Um. {b} in the middle, please. Sorry, {b}. I just don't know you very well yet.", "I'll put {b} in the middle. Is that okay? It's okay. Middle."],
  }),
  ...R('rate.affection.top', {
    goofy: ["{b} first! {b} is my emotional support person in here. Also my snack buddy, in my head.", "Number one is {b}! I'd give {b.obj} the last slice of pizza. That's how you know it's real."],
    shy: ["Can I put {b} first? I'd like to put {b} first. {b.Sub} was nice to me when I didn't know anyone.", "First place is {b}. I hope {b.sub} knows that. I'm too nervous to say it to {b.posAdj} face."],
  }),
  ...R('rate.affection.bottom', {
    goofy: ["{b}, last place. I'm so sorry. If it helps, my fridge is also at the bottom of my list. It never talks to me either.", "Bottom is {b}. Nothing personal! We just never had a moment. Not even a little snack moment."],
    shy: ["I feel bad doing this. {b} goes last. Sorry. Really, sorry.", "Um. Last place is {b}. We never talked. That's probably my fault too."],
  }),
  ...R('rate.threat.top', {
    goofy: ["{b} is a beast! You keep the beast fed and happy! First place, beast!", ["{b} first, because if {b} is winning, I want to be on the winning bus. Honk honk.", null, { early: false }]],
    shy: ["{b} first. {b} is really good at this, and I'd rather be on {b.posAdj} side than in {b.posAdj} way.", ["Is it bad that I'm scared of {b}? First place. To be safe.", null, { early: false }]],
  }),
  ...R('rate.threat.bottom', {
    goofy: ["{b}, you're too good! It's a tragedy! Last place! Somebody cue the sad violin!", "I have to do it. {b} goes last. Like taking the last cookie off a plate. It hurts me too."],
    shy: [["I don't want to, but {b} is winning. Last place. I'm sorry, {b}.", null, { early: false }], "{b} last. I'm not brave, but this seems like the brave thing to do."],
  }),
  ...R('rate.suspicion.bottom', {
    goofy: ["{b} is giving me catfish. Like, actual fish. I can smell it through the screen. Last.", "Something about {b} is weird, and I'm the weird one in here, so that's saying something. Last."],
    shy: ["I don't want to accuse anybody. But {b} doesn't feel real to me. Last. Sorry.", "Um. {b}'s story keeps changing. I noticed. Last place."],
  }),
  // ── Ratings results (reacting to the screen) ──────────────────────────
  ...R('result.middle', {
    goofy: [["Middle! Like a sandwich! I'm the good part of the sandwich!", '{a} makes a sandwich, to celebrate.'], ["Middle? Okay. Middle is basically top if you squint.", '{a} squints at the screen.']],
    shy: [["Middle. That's... that's actually fine. That's more than I thought.", '{a} lets out a breath {a.sub} was holding.'], ["Oh. Middle. Okay. Nobody hates me. I think.", '{a} pulls {a.posAdj} knees up to {a.posAdj} chest.']],
  }, 'react'),
  ...R('result.bottom', {
    goofy: [["The bottom?! Me?! I need a snack. I need, like, four snacks.", '{a} opens every cupboard in the kitchen.'], ["This is a tragedy in three acts and I'm in all of them!", '{a} collapses dramatically onto the couch.']],
    shy: [["The bottom. I knew it. I talk too little.", '{a} goes very quiet.'], ["I'm at the bottom. I'm sorry. I don't even know who I'm saying sorry to.", '{a} hides {a.posAdj} face in a cushion.']],
  }, 'react'),
  ...R('ratings.done', {
    goofy: [["Sent! I think! Did it send? It sent. Woo!", '{a} does a little dance with a spoon.'], ["Done! I'm celebrating with cereal. Breakfast for dinner. Rules don't apply tonight.", '{a} pours a bowl to the very top.']],
    shy: [["Sent. Oh, I hope nobody finds out what I put.", '{a} hugs a pillow.'], ["Done. I changed it four times. It's done now. No more changing.", '{a} sets the tablet down very carefully.']],
  }),

  // ── The blocking ───────────────────────────────────────────────────────
  ...R('block.wait', {
    goofy: ["The dots! The dots are my enemy! Type faster, dots!", "If it's me, I'm taking the fruit bowl with me. It's coming with me. It's mine now."],
    shy: ["Please not me. Please not me. Sorry, everyone else.", "I can't watch. Somebody tell me when it's over."],
  }, 'react'),
  ...R('block.react.relief', {
    goofy: ["Not me! I live! {b}, I'll eat a cookie in your honor.", "I'm safe! Oh no, {b}. I'm so sorry. I'm also so happy. Is that allowed?"],
    shy: ["Oh. It's {b}. I'm sorry, {b}. And I'm sorry I'm relieved.", "Not me. Okay. {b}, I hope you're okay."],
  }, 'react'),
  ...R('block.after', {
    goofy: ["Okay, that was dramatic. I need a nap. Or a parade. One of those.", "We did it. We blocked someone. I feel like the villain in a cartoon, with the little moustache."],
    shy: ["I hope {b} doesn't hate me. I really hope {b} doesn't hate me.", "I did it. I still feel shaky. I'm going to sit down."],
  }),
  ...R('block.react.self', {
    goofy: ["Me?! But I didn't even finish my yogurt!", ["Me. Blocked. This is the saddest episode of my life and I've seen every episode of my life.", '{a} falls backwards onto the bed.']],
    shy: ["Me. Okay. I should have talked more.", ["It's me. I knew it would be me. It's okay. It's okay.", '{a} sits very still for a long time.']],
  }, 'react'),

  // ── The visit ──────────────────────────────────────────────────────────
  ...R('visit.wait', {
    goofy: [["If {b} comes here, I'm offering {b.obj} a snack. You can't be mad at somebody holding a snack.", '{a} arranges crackers on a plate in the shape of a heart.'], ["Is that the door? That's the fridge. Why does the fridge make that noise?", '{a} jumps at every sound in the apartment.']],
    shy: [["If {b} comes here I won't know what to say. I'll say hello. Hello is a start.", '{a} practises saying hello to the door.'], ["Please don't come here, {b}. I mean, you can. But please don't.", '{a} sits as far from the door as the couch allows.']],
  }, 'react'),

  // ── The goodbye video ──────────────────────────────────────────────────
  ...R('goodbye.guess', {
    goofy: [["Popcorn's ready! {b}'s goodbye is the movie of the night!", "{a} settles in with an enormous bowl of popcorn."], ["Okay, {b}, make it dramatic. I want tears. I want a song.", "{a} wraps {a.ref} in a blanket like a burrito."]],
    shy: [["I hope {b} doesn't say my name. I hope {b} doesn't say anything mean.", "{a} watches through {a.posAdj} fingers."], ["Okay. Let's see. I'm nervous for {b}.", "{a} perches on the very edge of the couch."]],
  }, 'react'),
  ...R('goodbye.react.surprised', {
    goofy: [["Bye, {b}! That was beautiful! I'm crying into my popcorn!", '{a} sniffles and keeps eating.'], ["That was the best goodbye ever. Ten out of ten. I'd watch it again.", "{a} gives the screen a standing ovation, alone."]],
    shy: [["That was really nice of {b}. I didn't expect that.", '{a} smiles, just a little.'], ["Bye, {b}. I'm going to miss you, I think. I didn't get to say.", '{a} waves a small wave at the screen.']],
  }, 'react'),

  // ── Circle Chat and the Newsfeed ──────────────────────────────────────
  ...R('circle.react', {
    goofy: ["{b} said that and my brain did a little cartwheel.", "Wait, what did {b} say? I was thinking about pancakes. Scroll up."],
    shy: ["I wish I could say things like {b} does.", "{b} is so brave in the chat."],
  }, 'react'),
  ...R('status.react', {
    goofy: ["{b}'s post is the funniest thing I've seen all day, and I watched a bird walk into a window.", "Ooh, {b} posted! Liking it twice! Can you like twice? I'm trying."],
    shy: ["That's a nice post. I'll like it. Quietly.", "I want to comment on {b}'s post. I'm not going to. But I want to."],
  }, 'react'),
};

export const CHAT_MORE = {
  ...V('chat.bond.warm', {
    goofy: [
      [['a', "Okay important question. If you were a sandwich, what kind of sandwich would you be? I need to know {e:laugh}"], ['b', "Lol what? Grilled cheese I guess"], ['a', "I KNEW it. Warm, cheesy, everybody loves you. Called it {e:heart}"]],
      [['a', "I just told my plant about you. It thinks you're great. The plant has never been wrong {e:sparkle}"], ['b', "Tell the plant I said thank you"], ['a', "The plant says you're welcome {e:smile}"]],
    ],
    shy: [
      [['a', "Hi. Sorry if this is random. I just wanted to say I like talking to you"], ['b', "That's not random at all! I like talking to you too"], ['a', "Oh. Okay. Good. That's really good {e:smile}"]],
      [['a', "Um, I don't usually say this kind of thing. But you make it less scary in here"], ['b', "Aw. You make it less scary for me too"], ['a', "Okay. I'm going to go smile at the wall now {e:heart}"]],
    ],
  }),
  ...V('chat.bond.neutral', {
    goofy: [
      [['a', "Hiiii! I just ate a whole bag of grapes and I feel unstoppable. How are you??"], ['b', "Lol I'm good. Less grapes though"], ['a', "Tragic. I'll send you grapes in my heart {e:laugh}"]],
      [['a', "Quick update from my apartment: the couch has a lump. I've named it Gerald. Hi {e:smile}"], ['b', "Hi to you and Gerald"], ['a', "Gerald says hi back. He's shy"]],
    ],
    shy: [
      [['a', "Hey. Is it okay if I just say hi?"], ['b', "Of course! Hi!"], ['a', "Hi. Okay. That's all. Have a good day {e:smile}"]],
      [['a', "Sorry, I don't really know what to say. I just didn't want you to think I was ignoring you"], ['b', "Lol I didn't think that. Hi"], ['a', "Oh good. Hi"]],
    ],
  }),
  ...V('chat.bond.cold', {
    goofy: [
      [['a', "Hey! Want to hear a joke? Why did the tomato blush? Because it saw the salad dressing {e:laugh}"], ['b', "...okay"], ['a', "Tough room. I'll workshop it"]],
      [['a', "I feel like we got off on the wrong foot. Can we get on the right foot? I have two, I'll share"], ['b', "Haha maybe"], ['a', "Maybe! That's a foot in the door! Get it! Foot!"]],
    ],
    shy: [
      [['a', "Hi. I know we don't talk much. I just wanted to try"], ['b', "Oh. Hey"], ['a', "Okay. Sorry to bother you"]],
      [['a', "Um, did I do something wrong? You seemed upset with me"], ['b', "No, I'm fine"], ['a', "Okay. Sorry. I'll leave you alone"]],
    ],
  }),
  ...V('chat.checkin.warm', {
    goofy: [
      [['a', "Ratings were rude. I've decided to be offended on your behalf. I've already eaten a cookie about it"], ['b', "Lol that actually helps"], ['a', "Want me to eat another one for you? I will {e:muscle}"]],
      [['a', "Emergency cheer-up message! You're amazing! You're like a golden retriever with a phone! {e:sparkle}"], ['b', "Okay that made me laugh"], ['a', "Did it work? It worked {e:party}"]],
    ],
    shy: [
      [['a', "Hey. I saw the ratings. Are you okay? You don't have to answer"], ['b', "Not really. Thank you for asking"], ['a', "Okay. I'm here. I'm not good at saying it, but I am"]],
      [['a', "I don't know if this helps, but I think you're great. Sorry, that's all I've got"], ['b', "It helps a lot actually"], ['a', "Oh. Good. I'm glad {e:heart}"]],
    ],
  }),
  ...V('chat.ally.warm', {
    goofy: [
      [['a', "Okay, idea. You and me. Team. We need a name. Team Pancake? Team Pancake {e:fire}"], ['b', "Lol I'm in. Team Pancake"], ['a', "TEAM PANCAKE IS UNSTOPPABLE. Syrup handshake {e:handshake}"]],
      [['a', "I trust you more than I trust my microwave, and my microwave and I go way back. Alliance? {e:pray}"], ['b', "High praise. Yes"], ['a', "Best day of my life. Top five. Top three"]],
    ],
    shy: [
      [['a', "Can I ask you something? Would you want to look out for each other? It's okay if not"], ['b', "Yes! I'd love that"], ['a', "Oh. Okay. Wow. Thank you {e:heart}"]],
      [['a', "I don't trust a lot of people in here. But I think I trust you. Is that weird"], ['b', "Not weird. I trust you too"], ['a', "Okay. Then we're a team. Quietly {e:handshake}"]],
    ],
  }),
  ...V('chat.flirt.warm', {
    goofy: [
      [['a', "You are the human version of a warm cookie. That's the nicest thing I know how to say {e:hearteyes}"], ['b', "Okay that's adorable"], ['a', "I'm adorable? No, YOU'RE adorable. Okay now we're both adorable"]],
      [['a', "When we meet I'm going to do a dramatic slow-motion run at you. Just warning you now {e:laugh}"], ['b', "Lol I'll run back"], ['a', "We'll collide in the middle. It'll be beautiful {e:heart}"]],
    ],
    shy: [
      [['a', "I think about you a lot. Sorry. That's a lot to say"], ['b', "It's not too much. I think about you too"], ['a', "Oh. Okay. I'm blushing at a screen"]],
      [['a', "Um. Would you maybe want to get dinner? After? If that's okay"], ['b', "I'd really like that"], ['a', "Okay. I'm going to go lie down now {e:smile}"]],
    ],
  }),
  ...V('chat.flirt.neutral', {
    goofy: [
      [['a', "Your profile picture made me drop my spoon. Just so you know. There's yogurt everywhere {e:laugh}"], ['b', "Lol sorry about the yogurt"], ['a', "Worth it"]],
      [['a', "Are you a snack? Because, um. That's the end of the joke. I forgot the rest {e:wink}"], ['b', "Haha it still worked"], ['a', "Nailed it"]],
    ],
    shy: [
      [['a', "I think you're really cute. Okay. I said it"], ['b', "Aw. Thank you"], ['a', "I'm going to pretend I didn't send that"]],
      [['a', "Sorry if this is too much, but your smile in your picture is really nice"], ['b', "Not too much at all lol"], ['a', "Okay. Good. Bye {e:smile}"]],
    ],
  }),
  ...V('chat.pitch.warm', {
    goofy: [
      [['a', "Ratings tonight! If you rate me high, I'll name my next sandwich after you {e:crown}"], ['b', "Lol deal"], ['a', "The Legendary Sandwich. It's going to be huge"]],
      [['a', "I'm begging. Dramatically. On my knees on the kitchen floor. Please rate me high tonight {e:pray}"], ['b', "Get up lol, I've got you"], ['a', "My knees thank you. I thank you"]],
    ],
    shy: [
      [['a', "Sorry to ask. I'm really scared about tonight. Could you maybe keep me high?"], ['b', "Of course I will"], ['a', "Thank you. I'll put you high too. I promise {e:pray}"]],
      [['a', "I don't like asking. But I don't want to go home yet. Will you help me tonight?"], ['b', "Yes. You're safe with me"], ['a', "Okay. Thank you. Really {e:heart}"]],
    ],
  }),
};
