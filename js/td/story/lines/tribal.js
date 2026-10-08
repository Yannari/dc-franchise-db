// ══════════════════════════════════════════════════════════════════════
// td/story/lines/tribal.js — the reading, the last words, and after
// ══════════════════════════════════════════════════════════════════════
//
// td/story/tribal.js. Measured on the shows (spec §1b): a blindside gets a confrontation
// right there ("You know what you did." / "What the hell are you talking about?!" / "Hope
// you can respect a game move."); the boot says goodbye to their person, or takes a parting
// shot; then one or two confessionals from the people who did it, or a friend swearing revenge.
//
//   reveal.<blindside|expected>  a = the one going home; b = someone who voted for a and was
//     closest to a (blindside) or a's closest person still here (expected); c = another.
//     count: true where the votes are read out (the boot sees the tally); false at a
//     marshmallow / Gilded Chris / barf bag ceremony (the boot only learns it's them).
//   exit.<friend|shot|alone>  a = the one going home; b = their closest person ('friend') or
//     the person they blame ('shot'); 'alone': a has nobody to say goodbye to.
//   after.<architect|friend|guilty>  a confessional after the boot: 'architect' (a voted for
//     {lastBoot}, the plan worked), 'friend' (a was {lastBoot}'s closest and didn't see it),
//     'guilty' (a was close to {lastBoot} and voted for {lastBoot.obj} anyway).
// {lastBoot} is the person who just went home. {item} is the venue's ceremony item.

export default {
  'reveal.blindside': [
    { id: 'tr.rb1', when: { count: true }, turns: [
      { by: 'a', say: "What? No. No, that's— who?" },
      { by: 'a', say: "{b}? Did you write my name?" },
      { by: 'b', say: "Hope you can respect a game move." },
      { by: 'a', say: "A game move? I trusted you!" },
      { by: 'b', say: "That's why it worked." },
    ] },
    { id: 'tr.rb2', when: { count: true, register: 'fiery' }, turns: [
      { by: 'a', say: "Are you KIDDING me?!" },
      { by: 'a', say: "Who was it? Say it to my face. Somebody say it!" },
      { by: 'b', say: "Nobody owes you that." },
      { by: 'a', say: "Oh, it was you. Of course it was you." },
      { by: 'c', say: "Just go. Please." },
    ] },
    { id: 'tr.rb3', when: { count: true, register: ['sweet', 'shy'] }, turns: [
      { by: 'a', say: "Oh." },
      { by: 'a', say: "Oh, okay. I didn't— okay." },
      { by: 'b', say: "I'm sorry." },
      { by: 'a', say: "I thought we were okay. I really thought we were okay." },
      { beat: "{b} looks at the ground." },
    ] },
    { id: 'tr.rb4', when: { count: true, register: ['schemer', 'cool', 'competitor'] }, turns: [
      { by: 'a', say: "Well. That's impressive." },
      { by: 'a', say: "{b}. I didn't think you had it in you." },
      { by: 'b', say: "Neither did you. That's the point." },
      { by: 'a', say: "Enjoy it. It won't last." },
    ] },
    { id: 'tr.rb5', when: { count: true, register: 'plain' }, turns: [
      { by: 'a', say: "Wow. Okay. Didn't see that coming." },
      { by: 'b', say: "That was the idea." },
      { by: 'a', say: "Yeah. I got that." },
      { by: 'c', say: "Good game, honestly." },
      { by: 'a', say: "Don't." },
    ] },
    { id: 'tr.rb6', when: { count: false }, turns: [
      { by: 'a', say: "Wait. Me? It's me?" },
      { by: 'a', say: "{b}, did you know about this?" },
      { by: 'b', say: "{a}, I—" },
      { by: 'a', say: "You knew. Wow." },
    ] },
    { id: 'tr.rb7', when: { count: false, register: 'fiery' }, turns: [
      { by: 'a', say: "This is a joke, right? Somebody tell me this is a joke!" },
      { by: 'a', say: "Fine. FINE. Whoever did this, you'd better win, because I'm going to be cheering for literally anyone else." },
      { by: 'b', say: "Bye, {a}." },
    ] },
    { id: 'tr.rb8', when: { count: false, register: ['sweet', 'shy', 'plain'] }, turns: [
      { by: 'a', say: "Oh. That's... me. Okay." },
      { by: 'c', say: "I'm so sorry." },
      { by: 'a', say: "It's fine. It's not fine. But it's fine." },
    ] },
    { id: 'tr.rb9', when: { count: false, register: ['schemer', 'cool', 'competitor'] }, turns: [
      { by: 'a', say: "Huh." },
      { by: 'a', say: "Well played. Whoever you are. And I have a pretty good guess." },
      { beat: "{a} looks straight at {b}. {b} doesn't look back." },
    ] },
  ],
  'reveal.expected': [
    { id: 'tr.re1', turns: [
      { by: 'a', say: "Yeah. I figured." },
      { by: 'b', say: "I'm sorry." },
      { by: 'a', say: "Don't be. I'd have done the same thing." },
    ] },
    { id: 'tr.re2', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "Whatever. You're all going to miss me when you lose the next one." },
      { by: 'c', say: "Probably not." },
      { by: 'a', say: "Watch." },
    ] },
    { id: 'tr.re3', when: { register: ['sweet', 'shy'] }, turns: [
      { by: 'a', say: "I knew it. I knew it was going to be me." },
      { by: 'b', say: "You did so well, though." },
      { by: 'a', say: "Not well enough." },
    ] },
    { id: 'tr.re4', when: { register: ['schemer', 'cool'] }, turns: [
      { by: 'a', say: "Of course. Take the smartest person out first." },
      { by: 'c', say: "Wow. Humble." },
      { by: 'a', say: "Humble is for people who stay." },
    ] },
    { id: 'tr.re5', when: { register: ['competitor', 'plain'] }, turns: [
      { by: 'a', say: "Yeah. I saw it coming." },
      { by: 'a', say: "Good luck, everybody. Win the next one." },
    ] },
  ],

  'exit.friend': [
    { id: 'tr.ef1', when: { bVoted: 'other' }, turns: [
      { by: 'b', say: "{a}! Wait!" },
      { by: 'a', say: "Hey. It's okay." },
      { by: 'b', say: "It's not okay. I didn't know. I swear I didn't know." },
      { by: 'a', say: "I believe you. Now go win this thing. For both of us." },
      { by: 'b', say: "I will. I promise." },
    ] },
    { id: 'tr.ef2', when: { register: ['sweet', 'shy'] }, turns: [
      { by: 'a', say: "Hug. Now. Before I cry." },
      { by: 'b', say: "You're already crying." },
      { by: 'a', say: "Then hug faster." },
      { beat: "They hug for a long time." },
      { by: 'a', say: "Don't let them push you around, okay? Promise me." },
      { by: 'b', say: "I promise." },
    ] },
    { id: 'tr.ef3', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "Listen to me. Whoever did this, you make them pay." },
      { by: 'b', say: "I will." },
      { by: 'a', say: "And win. Win so hard they cry about it." },
      { by: 'b', say: "That's the plan." },
    ] },
    { id: 'tr.ef4', when: { register: ['schemer', 'cool', 'competitor', 'plain'] }, turns: [
      { by: 'a', say: "You're on your own now. Be smarter than I was." },
      { by: 'b', say: "You were smart." },
      { by: 'a', say: "Not smart enough to still be here. Don't trust anyone who smiles at breakfast." },
      { by: 'b', say: "Noted." },
    ] },
    { id: 'tr.ef5', turns: [
      { by: 'b', say: "This sucks. This really, really sucks." },
      { by: 'a', say: "Yeah. It does." },
      { by: 'b', say: "I don't know what I'm going to do without you." },
      { by: 'a', say: "You're going to keep going. That's what you're going to do. And when you win, you're splitting the money with me." },
      { by: 'b', say: "Deal." },
    ] },
  ],
  'exit.shot': [
    { id: 'tr.es1', turns: [
      { by: 'a', say: "Hey, {b}! Enjoy it while it lasts. Everybody here knows exactly what you are now." },
    ] },
    { id: 'tr.es2', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "And {b}? I hope you go next! I hope you go next and I'm watching!" },
      { by: 'b', say: "Bye!" },
    ] },
    { id: 'tr.es3', when: { register: ['schemer', 'cool'] }, turns: [
      { by: 'a', say: "{b}. You're next. You just don't know it yet." },
      { by: 'b', say: "Is that a threat?" },
      { by: 'a', say: "It's a forecast." },
    ] },
    { id: 'tr.es4', when: { register: ['sweet', 'shy', 'plain', 'competitor'] }, turns: [
      { by: 'a', say: "I hope it was worth it, {b}." },
      { beat: "{b} doesn't answer." },
    ] },
  ],
  'exit.alone': [
    { id: 'tr.ea1', turns: [{ by: 'a', conf: "I came here to win, and I didn't. But I'm not leaving with my head down. I'm leaving with stories." }] },
    { id: 'tr.ea2', when: { register: 'fiery' }, turns: [{ by: 'a', conf: "They got me. Fine. They'll be sorry when they're losing every challenge without me." }] },
    { id: 'tr.ea3', when: { register: ['sweet', 'shy'] }, turns: [{ by: 'a', conf: "I'm sad. But I'm kind of proud too. I didn't think I'd last this long." }] },
    { id: 'tr.ea4', when: { register: ['schemer', 'cool'] }, turns: [{ by: 'a', conf: "I played them. Then they played me. Honestly? Respect." }] },
    { id: 'tr.ea5', when: { register: ['competitor', 'plain'] }, turns: [{ by: 'a', conf: "I gave it everything. It just wasn't my day." }] },
  ],

  'after.architect': [
    { id: 'tr.aa1', turns: [{ by: 'a', conf: "{lastBoot} never saw it coming. That's the best kind of vote there is." }] },
    { id: 'tr.aa2', when: { register: ['schemer', 'cool'] }, turns: [{ by: 'a', conf: "Everybody thinks the vote just happened. Votes don't just happen. I made that one happen." }] },
    { id: 'tr.aa3', when: { register: ['sweet', 'shy', 'plain'] }, turns: [{ by: 'a', conf: "I feel bad about {lastBoot}. I do. But I'm still here, and that's the job." }] },
    { id: 'tr.aa4', when: { register: ['fiery', 'competitor'] }, turns: [{ by: 'a', conf: "One down. And I'm not done." }] },
    { id: 'tr.aa5', turns: [{ by: 'a', conf: "Tonight went exactly how we planned. That almost never happens. I'm going to enjoy it for about five minutes." }] },
    { id: 'tr.aa6', when: { merged: true }, turns: [{ by: 'a', conf: "{lastBoot} was a threat. Now {lastBoot} is gone, and I'm still here. I'll take that trade every time." }] },
  ],
  'after.friend': [
    { id: 'tr.af1', turns: [{ by: 'a', conf: "They took {lastBoot} from me without even telling me. Okay. Now I know who I'm playing against." }] },
    { id: 'tr.af2', when: { register: 'fiery' }, turns: [{ by: 'a', conf: "Whoever did this just made the biggest mistake of their game. I'm coming for every single one of them." }] },
    { id: 'tr.af3', when: { register: ['sweet', 'shy'] }, turns: [{ by: 'a', conf: "I don't have {lastBoot} anymore. I don't really have anybody. I'm scared. But I'm not giving up." }] },
    { id: 'tr.af4', when: { register: ['schemer', 'cool'] }, turns: [{ by: 'a', conf: "I'm not going to cry about {lastBoot}. I'm going to find out who did it, and I'm going to be very, very patient." }] },
    { id: 'tr.af5', when: { register: ['competitor', 'plain'] }, turns: [{ by: 'a', conf: "{lastBoot} going home is on me. I should have seen it. I won't miss the next one." }] },
  ],
  'after.guilty': [
    { id: 'tr.ag1', turns: [{ by: 'a', conf: "I looked {lastBoot} in the eye tonight and wrote {lastBoot.posAdj} name down. I'm going to be thinking about that for a while." }] },
    { id: 'tr.ag2', when: { register: ['schemer', 'cool'] }, turns: [{ by: 'a', conf: "{lastBoot} was my friend. {lastBoot} was also in my way. Only one of those things matters out here." }] },
    { id: 'tr.ag3', when: { register: ['sweet', 'shy', 'plain'] }, turns: [{ by: 'a', conf: "I voted for {lastBoot}. I had to. I keep telling myself I had to." }] },
  ],
};
