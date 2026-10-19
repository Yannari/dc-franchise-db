// Four more voices, so every authored one has a home (the user, 2026-10-19: "are you sure they fit the register?").
// Read against the roster, the eight registers still put the laid-back surfer bros in "formal", the confident
// quiet ones in "shy", the mean girls in "blunt" and the divas in "goofy". So:
//   chill   laid-back, easygoing, "dude", nothing is a big deal (Bridgette, Brody, Geoff, Rock, Sam)
//   catty   polished, condescending, a compliment with a knife in it (Heather, Amy, Chris, Blaineley)
//   diva    everything is about them, grand, dramatic, "darling" (Jacques, Nichelle, Max, Zachary, Felipe)
//   stoic   says very little and means all of it; calm, not nervous (B, Chase, MK, Hicks, Damien)
// Data only, the same shapes as registers.js and chat-voices.js, merged into their pools by key.
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

export const REGISTER_MORE2 = {
  ...R('rate.middle', {
    chill: ["{b}, middle. No stress, dude. Middle's a good place to hang out.", "Middle for {b}. We're cool. We're just not that cool yet."],
    catty: ["{b} goes in the middle. Which is generous, honestly.", "Middle, {b}. Not bad. Not memorable either."],
    diva: ["{b}, darling, the middle. Not everyone can be the star. I would know.", "Middle for {b}. The chorus is very important. Somebody has to stand behind me."],
    stoic: ["{b}. Middle.", "Middle. {b}. For now."],
  }),
  ...R('rate.affection.top', {
    chill: ["{b} first. Easy call, dude. {b.Sub}'s good people.", "Top spot, {b}. Good vibes only, and {b.sub} brings the good vibes."],
    catty: ["{b} first. Don't get excited, {b}. Everyone else is just worse.", "First place goes to {b}, the only one in here I can stand. Congratulations."],
    diva: ["{b}, first! My leading co-star! We were made for the same poster!", "First place is {b}. I don't give that out. I am usually first."],
    stoic: ["{b}. First.", "First is {b}. Earned it."],
  }),
  ...R('rate.affection.bottom', {
    chill: ["{b}, last. Sorry, man. It's not a hate thing. We just never clicked.", "Bottom for {b}. No beef. Just no vibe either."],
    catty: ["{b} last. Was there ever any doubt?", "Last place, {b}. I'd say I'm sorry, but we both know I'm not."],
    diva: ["{b}, last. You never once came to my show, darling.", "Bottom for {b}. Some people just don't appreciate a star."],
    stoic: ["{b}. Last.", "Last. {b}. Nothing there."],
  }),
  ...R('rate.threat.top', {
    chill: ["{b} first. Dude's a machine. Better to ride the wave than fight it.", ["First, {b}. If {b.sub}'s winning, I'm surfing behind {b.obj}.", null, { early: false }]],
    catty: ["{b} first. Keep your friends close and your threats closer. And smile at them.", ["{b} is winning, so {b} is first. For now. Enjoy it.", null, { early: false }]],
    diva: ["{b} first. Every great star needs a powerful friend. I'm being strategic, darling.", "First place, {b}. Power recognizes power."],
    stoic: ["{b} is the strongest. First.", "First. {b}. Better with {b.obj} than against."],
  }),
  ...R('rate.threat.bottom', {
    chill: ["{b} last. Nothing personal, bro. {b.Sub}'s just too good at this.", "Gotta put {b} at the bottom. It's the move. Sorry, dude."],
    catty: ["{b} last. Somebody had to knock {b.obj} down a peg. Happy to help.", ["{b} has been on top long enough. Last.", null, { early: false }]],
    diva: ["{b}, last. You were stealing my spotlight, and I simply cannot allow it.", "Bottom for {b}. There is only room for one lead in this production."],
    stoic: ["{b}. Too dangerous. Last.", "Last. {b}. It has to be."],
  }),
  ...R('rate.suspicion.bottom', {
    chill: ["{b}'s story is kind of wobbly, dude. Last. Just a feeling.", "Something's off with {b}. Not mad about it. Just last."],
    catty: ["{b} is a catfish, and not even a convincing one. Last.", "Last, {b}. I don't believe those pictures for a second."],
    diva: ["{b} is playing a role, darling, and I know acting when I see it. Last.", "Last for {b}. I can smell a performance a mile away. I invented performances."],
    stoic: ["{b}'s story doesn't hold. Last.", "Last. {b}. Not real."],
  }),
  ...R('result.middle', {
    chill: [["Middle? Cool. Middle's chill.", '{a} stretches out on the couch.'], ["Middle. Could be worse, could be better. Snack time.", '{a} shrugs and heads to the kitchen.']],
    catty: [["Middle. How generous of them.", '{a} examines {a.posAdj} nails.'], ["The middle. These people wouldn't know taste if it messaged them.", '{a} rolls {a.posAdj} eyes at the screen.']],
    diva: [["The MIDDLE? Me? Is the screen broken?", '{a} drapes {a.ref} across the couch.'], ["Middle. A star is never in the middle. Something has gone terribly wrong.", '{a} stares at {a.posAdj} reflection, wounded.']],
    stoic: [["Middle.", "{a} doesn't react."], ["Fine.", '{a} nods once.']],
  }, 'react'),
  ...R('result.bottom', {
    chill: [["Bottom. Huh. That's a bummer, dude.", '{a} lies back and stares at the ceiling.'], ["Bottom. Okay. Gotta reset the vibes.", '{a} takes a long, slow breath.']],
    catty: [["The bottom? Me? I'm going to remember every single one of them.", "{a}'s smile doesn't reach {a.posAdj} eyes."], ["Last. Cute. Very cute.", '{a} sets the tablet down very carefully.']],
    diva: [["Last?! This is a tragedy! A tragedy in five acts!", '{a} collapses onto the floor.'], ["They put me at the bottom. They will regret it. They will write songs about how much they regret it.", '{a} points dramatically at the screen.']],
    stoic: [["Bottom. Okay.", '{a} sits very still.'], ["Last. Noted.", "{a}'s jaw tightens, just a little."]],
  }, 'react'),
  ...R('ratings.done', {
    chill: [["Sent. Done. Nap time.", '{a} flops onto the bed.'], ["Ratings in. No stress. Whatever happens, happens.", '{a} puts on some music.']],
    catty: [["Sent. Some people are about to have a very bad night.", '{a} smiles to {a.ref}.'], ["Done. I was honest. Brutally, beautifully honest.", '{a} sips {a.posAdj} drink.']],
    diva: [["Sent! What a performance. I'd like to thank the Circle.", '{a} bows to the empty room.'], ["Done. Exhausting. Being this fair is exhausting.", '{a} lies down with a hand over {a.posAdj} forehead.']],
    stoic: [["Sent.", '{a} puts the tablet down.'], ["Done.", "{a} doesn't look at it again."]],
  }),
  ...R('block.wait', {
    chill: ["Whatever happens, man. It's all good. Okay, it's mostly good.", "Just breathe. Just breathe, dude."],
    catty: ["If it's me, at least they're showing some backbone. Finally.", "Go on. Type it. I'm not going anywhere."],
    diva: ["The suspense! The drama! I feel faint!", "If it's me, I'm going out like a legend."],
    stoic: ["...", "Just say it."],
  }, 'react'),
  ...R('block.react.relief', {
    chill: ["Not me. Phew. Sorry, {b}. Rough one, man.", "Oh, {b}. That's harsh, dude."],
    catty: ["{b}. Well. It was always going to be {b}.", "Not me. Of course not me. Bye, {b}."],
    diva: ["I survive! The audience gasps! {b}, I will never forget you!", "Not me. The show must go on, {b}. Without you, sadly."],
    stoic: ["{b}.", "Not me. Okay."],
  }, 'react'),
  ...R('block.after', {
    chill: ["That was heavy. I need a walk. Or a swim. Can I swim in here?", "Hope {b} lands somewhere good. No hard feelings, dude."],
    catty: ["{b} is gone and the Circle is already prettier.", "Some people just aren't built for this. {b} was one of them."],
    diva: ["What a scene. Somebody should film that. Oh, they did.", "I had to be the villain tonight. Every great story needs one, and every villain needs good lighting."],
    stoic: ["Done.", "{b} had to go."],
  }),
  ...R('block.react.self', {
    chill: ["Me? Whoa. Okay. That's a plot twist, dude.", ["Blocked. Huh. Okay. It was a good run.", '{a} laughs, a little sadly.']],
    catty: ["Me? They'll be sorry. Every single one of them.", ["Blocked. By these people. Unbelievable.", '{a} picks up {a.posAdj} bag with great dignity.']],
    diva: ["ME?! The star of this show?! This is an outrage!", ["Blocked. Fine. They can't afford me anyway.", '{a} throws a scarf over {a.posAdj} shoulder and stands.']],
    stoic: ["Me. Okay.", ["Blocked.", '{a} stands up without a word and picks up {a.posAdj} bag.']],
  }, 'react'),
  ...R('visit.wait', {
    chill: [["If {b} comes here, we'll just talk. It's cool. It's totally cool.", '{a} puts some chips in a bowl, just in case.'], ["Knock, knock, whoever. Door's open, dude.", '{a} lies on the couch with {a.posAdj} arms behind {a.posAdj} head.']],
    catty: [["If {b} comes here, {b.sub}'d better have something interesting to say.", '{a} checks {a.posAdj} reflection, unhurried.'], ["Let {b} come. I'll be gracious. Mostly.", '{a} sits up perfectly straight.']],
    diva: [["If {b} comes here, I'm ready. I was born ready. I'm in costume.", '{a} poses by the door.'], ["The knock! When will the knock come! I can't bear it!", '{a} paces in a long, dramatic circle.']],
    stoic: [["Let {b} come.", '{a} sits facing the door.'], ["Whatever happens.", "{a} doesn't move."]],
  }, 'react'),
  ...R('goodbye.guess', {
    chill: [["Okay, {b}. Let's hear it. Be nice, dude.", "{a} settles in with a bag of chips."], ["Goodbye video. This is gonna be a whole thing.", "{a} kicks back on the couch."]],
    catty: [["Let's see what {b} has to say. This should be fun.", "{a} leans forward with a small smile."], ["{b}'s goodbye. I hope it's long. I want to enjoy this.", "{a} pours {a.ref} a drink."]],
    diva: [["A farewell speech! The final act! I adore a farewell speech!", "{a} clutches a pillow to {a.posAdj} chest."], ["Let's see if {b} can deliver a line. Most people can't.", "{a} folds {a.posAdj} arms like a critic."]],
    stoic: [["Okay, {b}.", "{a} watches without blinking."], ["Let's see.", "{a} sits forward."]],
  }, 'react'),
  ...R('goodbye.react.surprised', {
    chill: [["Respect, {b}. That was classy, dude.", '{a} nods at the screen.'], ["Aw, {b}. Hang loose, man.", '{a} gives the screen a little shaka.']],
    catty: [["That was almost gracious. Almost.", '{a} raises an eyebrow.'], ["Bye, {b}. I'll miss you about as much as you'd expect.", '{a} waves without looking up.']],
    diva: [["Bravo! Bravo! {b} found {b.posAdj} light at the very end!", '{a} applauds, standing.'], ["That was moving. Not as moving as my exit will be, but moving.", '{a} dabs at one eye.']],
    stoic: [["Good exit.", '{a} nods once.'], ["Bye, {b}.", '{a} turns the screen off.']],
  }, 'react'),
  ...R('circle.react', {
    chill: ["{b} said that like it was nothing. Love that energy, dude.", "Okay, {b}'s chill. I like {b}."],
    catty: ["Oh, {b} thinks {b.sub}'s funny. Adorable.", "{b} really thought that was a good message."],
    diva: ["{b} is trying to steal my scene in the chat. I see you, {b}.", "Oh, {b}. Such a supporting character."],
    stoic: ["Hm. {b}.", "{b} means that."],
  }, 'react'),
  ...R('status.react', {
    chill: ["Nice post, {b}. Good vibes, dude.", "{b} posted. Cool. Liking it."],
    catty: ["{b} posted that on purpose. Bless.", "That filter is working very hard for {b}."],
    diva: ["{b}'s post is fine. Mine was better. Mine is always better.", "Oh, {b} posted. How brave. How very brave."],
    stoic: ["{b}. Okay.", "Smart post, {b}."],
  }, 'react'),
};

export const CHAT_MORE2 = {
  ...V('chat.bond.warm', {
    chill: [
      [['a', "Duuude. You're like the most relaxed person in here. I respect it {e:fire}"], ['b', "Lol thanks, you too"], ['a', "Chill gang. Forever"]],
      [['a', "Just wanted to say you're good people. That's it. No big thing {e:smile}"], ['b', "Aw that's a nice thing to hear"], ['a', "It's true, dude"]],
    ],
    catty: [
      [['a', "I'll be honest, you're one of the only people in here worth talking to. Don't let it go to your head"], ['b', "Lol I'll try"], ['a', "Good. I don't hand out compliments. Frame it"]],
      [['a', "Everyone in that chat is exhausting. You're not. That's rare, and I noticed {e:eyes}"], ['b', "Okay I'll take that"], ['a', "You should. It won't happen often"]],
    ],
    diva: [
      [['a', "Darling. You are a light in this dreary little Circle. I had to tell you {e:sparkle}"], ['b', "Omg stop, you're too much"], ['a', "I am exactly the right amount. And so are you {e:heart}"]],
      [['a', "If this were a movie, you'd be my best friend who gets an award for supporting me. A big award {e:crown}"], ['b', "Lol I'll take the award"], ['a', "You've earned it, darling"]],
    ],
    stoic: [
      [['a', "You're solid. I trust that"], ['b', "Thank you, that means a lot"], ['a', "Meant it"]],
      [['a', "You don't fake anything. I noticed"], ['b', "Thanks. You don't either"], ['a', "Good. Talk soon"]],
    ],
  }),
  ...V('chat.bond.neutral', {
    chill: [
      [['a', "Hey dude, what's up? Just vibing over here"], ['b', "Same honestly lol"], ['a', "Nice. Vibe on"]],
      [['a', "Quick hey. How's your day going? Mine's mellow"], ['b', "Pretty mellow too"], ['a', "Mellow is the best kind of day {e:smile}"]],
    ],
    catty: [
      [['a', "Hi. I'm told we should talk more. So. Talk"], ['b', "Lol okay, hi"], ['a', "That's a start. A small one"]],
      [['a', "I wanted to see if you were as interesting as your profile. I haven't decided yet"], ['b', "Lol rude"], ['a', "Honest. There's a difference"]],
    ],
    diva: [
      [['a', "Hello, darling! I'm making the rounds. Everybody gets a little sparkle today {e:sparkle}"], ['b', "Lol thank you for the sparkle"], ['a', "You're very welcome"]],
      [['a', "I've been rehearsing my Circle Chat entrance all morning. Thoughts on dramatic pauses?"], ['b', "More is more lol"], ['a', "Finally, someone who understands"]],
    ],
    stoic: [
      [['a', "Hey. Checking in"], ['b', "Hey! All good here"], ['a', "Good"]],
      [['a', "We should talk more"], ['b', "Yeah, for sure"], ['a', "Later then"]],
    ],
  }),
  ...V('chat.bond.cold', {
    chill: [
      [['a', "Hey, we good? Feels like there's a weird vibe. Just checking, dude"], ['b', "We're fine"], ['a', "Cool cool. Door's open whenever"]],
      [['a', "Not trying to make it a thing. Just saying hey"], ['b', "Hey"], ['a', "Alright. Later, man"]],
    ],
    catty: [
      [['a', "I see you've been ignoring me. Bold choice"], ['b', "I haven't been ignoring you"], ['a', "Mm. Sure you haven't"]],
      [['a', "I'm reaching out to be polite. Don't make me regret it"], ['b', "Okay?"], ['a', "Charming as always"]],
    ],
    diva: [
      [['a', "Darling, the silence between us is deafening. Speak to me!"], ['b', "Lol I'm here. Just busy"], ['a', "Busy. Nobody is too busy for me. But fine"]],
      [['a', "I've decided to forgive you for whatever this coldness is. You're welcome"], ['b', "I didn't do anything"], ['a', "Then it's even easier to forgive"]],
    ],
    stoic: [
      [['a', "We have a problem?"], ['b', "No"], ['a', "Okay"]],
      [['a', "Hey"], ['b', "Hi"], ['a', "That's fine"]],
    ],
  }),
  ...V('chat.checkin.warm', {
    chill: [
      [['a', "Hey, saw the ratings. Don't sweat it, dude. It's one night"], ['b', "Thanks. I needed that"], ['a', "Anytime. Deep breaths"]],
      [['a', "You good? Rough day. Wanna just talk about nothing for a bit?"], ['b', "Yes please"], ['a', "Okay. So. Favorite cereal. Go"]],
    ],
    catty: [
      [['a', "The ratings were ridiculous. You deserved better than those people gave you"], ['b', "Wow, thank you"], ['a', "Don't thank me. Just be better than them. It's not hard"]],
      [['a', "I heard you were upset. Don't give them the satisfaction"], ['b', "I'm trying"], ['a', "Try harder. Chin up. They're not worth it"]],
    ],
    diva: [
      [['a', "Darling, I saw what they did to you in the ratings. A crime. A crime against art {e:heart}"], ['b', "Lol it wasn't that bad"], ['a', "It was a TRAGEDY and I'll grieve for both of us"]],
      [['a', "Every great star has a bad night. Mine are legendary. Yours will be too {e:sparkle}"], ['b', "That actually helps lol"], ['a', "Of course it does. I'm wise"]],
    ],
    stoic: [
      [['a', "Saw the ratings. You okay?"], ['b', "Not really"], ['a', "You will be. I'm here"]],
      [['a', "Don't listen to the numbers"], ['b', "Thanks. Really"], ['a', "Mean it"]],
    ],
  }),
  ...V('chat.ally.warm', {
    chill: [
      [['a', "Dude. You and me. Let's look out for each other. No drama, just good vibes {e:handshake}"], ['b', "I'm in"], ['a', "Sweet. Chill alliance. Best kind"]],
      [['a', "I trust you, man. Wanna ride this out together?"], ['b', "Yes, definitely"], ['a', "Awesome. We got this"]],
    ],
    catty: [
      [['a', "Let's be smart. You and I protect each other, and everyone else can fend for themselves"], ['b', "Deal"], ['a', "Lovely. I knew you had taste"]],
      [['a', "I don't trust anyone in here. You're the closest thing to an exception. Alliance?"], ['b', "Wow, okay. Yes"], ['a', "Good. Don't make me look foolish"]],
    ],
    diva: [
      [['a', "Darling, I'm casting you as my co-star. Together we will dominate this Circle {e:crown}"], ['b', "Lol I accept the role"], ['a', "Wonderful. Rehearsals start immediately"]],
      [['a', "A partnership! A pact! A duet for the ages! Say yes {e:sparkle}"], ['b', "Yes!"], ['a', "The crowd goes wild"]],
    ],
    stoic: [
      [['a', "You and me. We look out for each other"], ['b', "Deal"], ['a', "Good"]],
      [['a', "I trust you. That's rare. Alliance?"], ['b', "Yes"], ['a', "Done"]],
    ],
  }),
  ...V('chat.flirt.warm', {
    chill: [
      [['a', "Not gonna lie, talking to you is like the best part of my day, dude {e:smile}"], ['b', "Okay that's cute"], ['a', "You're cute. I'm just chill about it"]],
      [['a', "When we're out of here, we're going somewhere sunny. You and me. No pressure {e:wink}"], ['b', "I'd like that"], ['a', "Sweet. It's a date. Like, a chill date"]],
    ],
    catty: [
      [['a', "I don't usually like anybody. You're very annoying, because I like you {e:wink}"], ['b', "Lol is that a compliment"], ['a', "From me? It's a love letter"]],
      [['a', "Everyone in here is a disappointment except you. Don't ruin it"], ['b', "I won't, promise"], ['a', "Good. I'd hate to have to stop liking you"]],
    ],
    diva: [
      [['a', "Darling, you are the romance subplot I didn't know this season needed {e:hearteyes}"], ['b', "Omg stop"], ['a', "I will not stop. This is my love song"]],
      [['a', "When we finally meet, I'm going to walk in slowly, in perfect light. Prepare yourself {e:kiss}"], ['b', "Lol I'm preparing"], ['a', "Prepare harder"]],
    ],
    stoic: [
      [['a', "I like you. Thought you should know"], ['b', "Oh. I like you too"], ['a', "Good"]],
      [['a', "Dinner. After this. You and me"], ['b', "Yes. I'd love that"], ['a', "Then it's settled"]],
    ],
  }),
  ...V('chat.flirt.neutral', {
    chill: [
      [['a', "Your profile pic is pretty rad, just saying {e:fire}"], ['b', "Haha thanks"], ['a', "No worries"]],
      [['a', "Is it weird I smile when you message? Probably not weird. It's fine"], ['b', "Lol not weird"], ['a', "Cool"]],
    ],
    catty: [
      [['a', "Your picture is acceptable. More than acceptable. Don't tell anyone I said that"], ['b', "Lol your secret's safe"], ['a', "It had better be"]],
      [['a', "Are you flirting with everyone, or am I special?"], ['b', "Maybe you're special"], ['a', "Correct answer"]],
    ],
    diva: [
      [['a', "Darling, that picture? Cinematic. Have you considered a career in film? {e:sparkle}"], ['b', "Lol no"], ['a', "Consider it"]],
      [['a', "I've decided you're the most charming person in here. After me, of course"], ['b', "Of course lol"], ['a', "I'm glad we understand each other"]],
    ],
    stoic: [
      [['a', "You're attractive"], ['b', "Oh! Thank you"], ['a', "Just true"]],
      [['a', "I like how you talk"], ['b', "That's sweet"], ['a', "It is"]],
    ],
  }),
  ...V('chat.pitch.warm', {
    chill: [
      [['a', "Hey, ratings tonight. If you could keep me up there, that'd be rad. I got you too, dude"], ['b', "I got you"], ['a', "Sweet. Easy"]],
      [['a', "No pressure, but I'd love to make it to tomorrow. Top of your list?"], ['b', "Yeah, for sure"], ['a', "Awesome. You're the best, man"]],
    ],
    catty: [
      [['a', "I'll keep this short. Rate me high tonight and I'll remember it. Rate me low and I'll remember that too"], ['b', "Lol noted. You're high"], ['a', "Smart"]],
      [['a', "We both know who the real threats are. Keep me safe, and I'll make sure they aren't"], ['b', "Deal"], ['a', "Pleasure doing business"]],
    ],
    diva: [
      [['a', "Darling, tonight I need you to put me where I belong. At the top. Obviously {e:crown}"], ['b', "Lol I will"], ['a', "You have excellent judgement"]],
      [['a', "If I'm blocked tonight, this Circle loses its only star. Think of the fans. Rate me high {e:pray}"], ['b', "I'll think of the fans"], ['a', "The fans thank you"]],
    ],
    stoic: [
      [['a', "Ratings tonight. Keep me high. I'll do the same"], ['b', "Deal"], ['a', "Thanks"]],
      [['a', "I need you tonight. Top three?"], ['b', "Yes"], ['a', "Same for you"]],
    ],
  }),
};

// The Newsfeed: the way they type, noticed (voice-noticed.js style.<register>.<tone>)
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, turns: [{ by: 'a', react: x }] })) });
export const NOTICED_MORE2 = {
  ...E('style.chill.charmed', ["{b} types like {b.sub}'s lying in a hammock. I love it.", "Nothing gets to {b}. I want whatever {b.sub}'s having.", "{b} said 'no worries' and I actually stopped worrying."]),
  ...E('style.chill.annoyed', ["{b}, the vote is tomorrow. 'It's all good' is not a plan.", "Everything is 'chill' with {b}. Nothing is chill. We're in the Circle.", "Does {b} ever care about anything?"]),
  ...E('style.catty.charmed', ["{b} is mean in the most elegant way. I'm taking notes.", "Every message from {b} is a little bit of a knife, and I'm here for it.", "{b} can insult you so politely you say thank you."]),
  ...E('style.catty.annoyed', ["{b} says 'bless' like it's a weapon.", "Every compliment from {b} comes with a little cut.", "I can hear the eye-roll in {b}'s messages."]),
  ...E('style.diva.charmed', ["{b} turns every message into a show. Honestly? Iconic.", "{b} called me darling and I've never felt more famous.", "Even {b}'s typos have star power."]),
  ...E('style.diva.annoyed', ["Every message from {b} is about {b}.", "{b}, it's a group chat, not your one-person show.", "If {b} says 'darling' one more time."]),
  ...E('style.stoic.charmed', ["{b} says four words and they're the right four words.", "{b} doesn't waste a single word. I respect that so much.", "When {b} talks, everyone listens. Because {b} hardly ever does."]),
  ...E('style.stoic.annoyed', ["I sent {b} a paragraph and got 'Okay.' back.", "Getting {b} to talk is like getting blood from a stone.", "{b}, more than two words. Please. I'm begging."]),
};
