// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-thr2.js — what the challenge left between two people, carried on
// ══════════════════════════════════════════════════════════════════════
// td/story/threads.js (header there). Before the challenge, an episode or more after it started.
//   thr.rescue.*   b saved a at {chal}: a owes b. 1 it comes up, 2 it's still there, mend / war / fade
//   thr.wronged.*  b sabotaged or ditched a at {chal} (how: sabotage / betray), and a saw it
//   thr.rivals.*   a and b went at each other at {chal} (how: clash / taunt)
//   vp.recall.history  a, running tonight's plan on {target}, to the camera: the old wound ({moment})
// ago: 'recent' or 'while'. The engine moved the bonds; this is what it sounds like. Ids: 'nt2.'.

export default {
  // ── a owes b for {chal} ──
  'thr.rescue.1': [
    { id: 'nt2.r1', turns: [
      { beat: "{a} brings two cups of water over to where {b} is sitting and hands one across." },
      { by: 'b', say: "What's this for?" },
      { by: 'a', say: "I never actually said thank you. For {chal}." },
      { by: 'b', say: "You don't have to thank me for that." },
      { by: 'a', say: "I do, though. If you hadn't come back for me, I'd have been done. Everybody else kept going." },
      { by: 'b', say: "I wasn't going to leave you out there." },
      { by: 'a', say: "I know, and that's the part I keep thinking about, because most people here would have." },
      { by: 'b', say: "Then I guess you know who your people are now." },
      { by: 'a', conf: "I owe {b}. I don't really know what that means in this game yet, but I know I'm not going to be the one who forgets it." },
    ] },
    { id: 'nt2.r2', when: { voice: ['tough', 'proud', 'competitive'] }, turns: [
      { by: 'a', say: "Can we talk about {chal} for a second?" },
      { by: 'b', say: "What about it?" },
      { by: 'a', say: "You helped me. I didn't need it, for the record, but you helped me." },
      { by: 'b', say: "You absolutely needed it." },
      { by: 'a', say: "...Fine, I needed it, and I really don't like owing people." },
      { by: 'b', say: "So don't think of it as owing. Think of it as being on the same side." },
      { by: 'a', say: "Same side. Okay, I can work with that." },
      { by: 'a', conf: "I hate being in anybody's debt, so the fastest way out of it is to pay {b} back. And the only currency out here is a vote." },
    ] },
  ],
  'thr.rescue.2': [
    { id: 'nt2.r3', turns: [
      { by: 'b', say: "You've been weird with me since {chal}." },
      { by: 'a', say: "Weird how?" },
      { by: 'b', say: "Like you're waiting for me to ask for something." },
      { by: 'a', say: "Aren't you going to?" },
      { by: 'b', say: "I didn't help you so I could collect on it later." },
      { by: 'a', say: "Everybody here wants something. I'd just rather know what it is." },
      { by: 'b', say: "Okay. Then what I want is for you to stop treating me like a bank." },
      { by: 'a', conf: "I keep waiting for {b} to cash it in, and {b} keeps not doing it. Either {b} is a really good person, or {b} is saving it for something huge." },
    ] },
  ],
  'thr.rescue.mend': [
    { id: 'nt2.r4', turns: [
      { beat: "{a} and {b} have been working side by side all morning, finishing each other's jobs without being asked." },
      { by: 'b', say: "We're a good team, you know." },
      { by: 'a', say: "Ever since {chal}. Funny how that works." },
      { by: 'b', say: "Not funny. Lucky." },
      { by: 'a', say: "Then let's keep being lucky. You and me, as far as this goes." },
      { by: 'b', say: "As far as this goes." },
      { by: 'b', conf: "One moment at a challenge, and now {a} is the person I'd trust with my vote. That's how this game works. It's never the big speeches." },
    ] },
  ],
  'thr.rescue.war': [
    { id: 'nt2.r5', turns: [
      { by: 'b', say: "I saved you at {chal}, and this is how you repay me?" },
      { by: 'a', say: "I never asked you to save me." },
      { by: 'b', say: "You didn't have to ask. I did it anyway, and now you're talking to people about me." },
      { by: 'a', say: "Owing you doesn't mean I agree with everything you do." },
      { by: 'b', say: "No. It just means you should have told me to my face." },
      { by: 'a', conf: "Yes, {b} helped me. That was then. I'm not going to wreck my own game over one good deed." },
    ] },
  ],
  'thr.rescue.fade': [
    { id: 'nt2.r6', turns: [
      { by: 'a', conf: "Every so often I remember {b} pulling me through {chal}. Then I remember it's been a while, and we've barely talked since. I don't know what happened there." },
      { by: 'a', conf: "I should fix that. I should probably fix that before somebody else notices it's broken." },
    ] },
  ],

  // ── b did a wrong at {chal} ──
  'thr.wronged.1': [
    { id: 'nt2.w1', when: { how: 'sabotage' }, turns: [
      { beat: "{a} waits until the others have gone down to the water, then sits right next to {b}." },
      { by: 'a', say: "So are we just never going to talk about {chal}?" },
      { by: 'b', say: "What about it?" },
      { by: 'a', say: "You messed with me on purpose, and I watched you do it." },
      { by: 'b', say: "It's a competition. People get in each other's way.", v: { schemer: "If you can't keep up with a little interference, that's not my problem.", warm: "Okay, yes, I'm sorry. I panicked, and it was stupid." } },
      { by: 'a', say: "Getting in somebody's way isn't the same as making them lose." },
      { by: 'b', say: "Then what do you want me to say?" },
      { by: 'a', say: "Nothing. I just wanted to see if you'd lie about it, and now I know." },
      { by: 'a', conf: "I've had {chal} on my mind for days. I'm not going to scream about it. I'm just going to make sure it costs {b} something." },
    ] },
    { id: 'nt2.w2', when: { how: 'betray' }, turns: [
      { by: 'a', say: "You left me back there. At {chal}." },
      { by: 'b', say: "I had to make a choice. I made it." },
      { by: 'a', say: "You made it in about half a second, and you didn't even look back." },
      { by: 'b', say: "Would you have waited for me?" },
      { beat: "{a} opens {a.posAdj} mouth, then closes it again." },
      { by: 'b', say: "That's what I thought." },
      { by: 'a', say: "I would have. That's the difference between us, and that's why I'm not going to forget it." },
      { by: 'a', conf: "Everybody thinks {chal} was about winning. For me it was about finding out who {b} really is." },
    ] },
  ],
  'thr.wronged.2': [
    { id: 'nt2.w3', turns: [
      { by: 'b', say: "Are you ever going to stop looking at me like that?" },
      { by: 'a', say: "Like what?" },
      { by: 'b', say: "Like I'm the reason you didn't win {chal}." },
      { by: 'a', say: "You are the reason I didn't win {chal}." },
      { by: 'b', say: "It was days ago." },
      { by: 'a', say: "And I still think about it every time you smile at me." },
      { by: 'b', conf: "{a} is holding a grudge, and grudges turn into votes. I either fix this, or I get rid of it." },
    ] },
  ],
  'thr.wronged.mend': [
    { id: 'nt2.w4', turns: [
      { by: 'b', say: "Hey, about {chal}. I owe you an apology, and I've been too proud to give it." },
      { by: 'a', say: "...Okay. I'm listening." },
      { by: 'b', say: "I was scared of losing, and I took it out on you. That wasn't fair." },
      { by: 'a', say: "No, it wasn't." },
      { by: 'b', say: "So, I'm sorry. Really." },
      { by: 'a', say: "Thank you. I didn't think I'd ever hear that." },
      { by: 'a', conf: "{b} said sorry, and meant it. I'm not going to forget {chal}, but I can stop holding it over {b.posAdj} head." },
    ] },
  ],
  'thr.wronged.war': [
    { id: 'nt2.w5', turns: [
      { beat: "{a} doesn't even wait for {b} to sit down." },
      { by: 'a', say: "You know what? I'm done pretending {chal} didn't happen." },
      { by: 'b', say: "Here we go." },
      { by: 'a', say: "Yeah, here we go. You cheated me, you lied about it, and now you're acting like we're friends." },
      { by: 'b', say: "I never said we were friends." },
      { by: 'a', say: "Good. Because we're not, and everybody's going to know why." },
      { by: 'b', conf: "{a} has wanted a fight with me since {chal}, so fine, now {a} has one." },
    ] },
  ],
  'thr.wronged.fade': [
    { id: 'nt2.w6', turns: [
      { by: 'a', conf: "I used to be angry at {b} about {chal}. Now I mostly just don't trust {b}, which is quieter, but honestly, it's worse." },
    ] },
  ],

  // ── a and b went at each other at {chal} ──
  'thr.rivals.1': [
    { id: 'nt2.v1', turns: [
      { beat: "{a} and {b} both reach for the last clean bowl at breakfast at the same time." },
      { by: 'b', say: "Seriously?" },
      { by: 'a', say: "I was here first." },
      { by: 'b', say: "Like you were first at {chal}? Oh, wait." },
      { by: 'a', say: "Are you still on that? You lost your temper, not me." },
      { by: 'b', say: "I lost my temper because you wouldn't shut up for two seconds." },
      { by: 'c', say: "Can you two please fight about something that isn't a bowl?", opt: true },
      { by: 'a', conf: "Ever since {chal}, {b} and I can't be in the same place without it turning into something. I'm not even sure what we're fighting about anymore." },
    ] },
    { id: 'nt2.v2', when: { how: 'taunt' }, turns: [
      { by: 'a', say: "Still talking, huh?" },
      { by: 'b', say: "Somebody has to. You certainly didn't have much to say after {chal}." },
      { by: 'a', say: "That's because I was busy watching you celebrate like you'd won the whole game." },
      { by: 'b', say: "I won something. You should try it sometime." },
      { by: 'a', say: "Enjoy it. You've told everybody here exactly how much you want to beat me. That makes you easy to read." },
      { by: 'b', conf: "{a} wants to get under my skin. It's working, a little. I just can't let {a} see it's working." },
    ] },
  ],
  'thr.rivals.2': [
    { id: 'nt2.v3', turns: [
      { by: 'b', say: "You know everybody's sick of us, right?" },
      { by: 'a', say: "Then stop starting it." },
      { by: 'b', say: "I don't start it. I finish it." },
      { by: 'a', say: "That's what every person who starts it says." },
      { by: 'b', say: "Look, I'm not going to pretend I like you after {chal}. But we're on the same team today." },
      { by: 'a', say: "Today." },
      { by: 'b', say: "Today. Tomorrow you can go back to being annoying." },
      { by: 'a', conf: "{b} and I agreed to a truce for one day. I give it until lunch." },
    ] },
  ],
  'thr.rivals.mend': [
    { id: 'nt2.v4', turns: [
      { by: 'a', say: "Can I say something weird? You were kind of right at {chal}." },
      { by: 'b', say: "Wait, what?" },
      { by: 'a', say: "Don't make me say it twice." },
      { by: 'b', say: "No, no, I need to hear it twice. I need to remember this forever." },
      { by: 'a', say: "You were right, and I was being a pain. There, are you happy?" },
      { by: 'b', say: "Very. And for what it's worth, I was being a pain too." },
      { by: 'b', conf: "Me and {a} went from wanting to strangle each other to actually laughing. I didn't see that coming at all." },
    ] },
  ],
  'thr.rivals.war': [
    { id: 'nt2.v5', turns: [
      { beat: "It starts with a look across the fire and goes downhill fast." },
      { by: 'a', say: "Say whatever it is you want to say." },
      { by: 'b', say: "Fine. You've been a nightmare since {chal}, and I'm not the only one who thinks so." },
      { by: 'a', say: "Oh, you've been talking about me? Who to?" },
      { by: 'b', say: "Everybody who'll listen." },
      { by: 'a', say: "Then I hope everybody who'll listen likes you, because you just made it a vote." },
      { by: 'c', say: "Okay, okay, both of you, enough.", opt: true },
      { by: 'a', conf: "This stopped being about {chal} a long time ago. Now it's about which one of us goes home first." },
    ] },
  ],
  'thr.rivals.fade': [
    { id: 'nt2.v6', turns: [
      { by: 'a', conf: "{b} and I haven't had a go at each other in days. I think we both just got tired. Or one of us is waiting for the right moment." },
    ] },
  ],

  // ── the plan's leader, to the camera: the old wound ──
  'vp.recall.history': [
    { id: 'nt2.h1', turns: [{ by: 'a', conf: "People think tonight came out of nowhere. It didn't. I've been carrying {moment} around for days, and tonight I get to put it down." }] },
    { id: 'nt2.h2', turns: [{ by: 'a', conf: "{target} probably forgot all about {moment}, but I didn't, not for one second." }] },
    { id: 'nt2.h3', when: { voice: ['calm', 'dry', 'schemer'] }, turns: [{ by: 'a', conf: "I don't do anything in the heat of the moment. I waited. {moment} was days ago, and I've been waiting ever since." }] },
    { id: 'nt2.h4', when: { voice: ['loud', 'tough', 'competitive'] }, turns: [{ by: 'a', conf: "Remember {moment}? Because I do, every single day, and tonight {target} finds out how much." }] },
    { id: 'nt2.h5', when: { voice: ['warm', 'earnest', 'emotional'] }, turns: [{ by: 'a', conf: "I tried to let {moment} go. I really did. I just couldn't, and I'm tired of pretending I could." }] },
  ],
};
