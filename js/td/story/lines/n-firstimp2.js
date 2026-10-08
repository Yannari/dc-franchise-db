// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-firstimp2.js — more First Impressions booth lines (n-firstimp.js has the header)
// ══════════════════════════════════════════════════════════════════════
// A tribe of eight writes eight lines in one sitting: every read needs enough that none repeats.
// Ids: 'nfj.'.

export default {
  'fi.booth.nothing': [
    { id: 'nfj.n1', turns: [{ by: 'a', conf: "I'm writing {target}, and if {target} is a great person, then I'm really sorry, because I just met everybody this morning.", v: { teen: "Okay, so, {target}. I literally don't know anyone. This is so random." } }] },
    { id: 'nfj.n2', turns: [{ by: 'a', conf: "Honestly, I picked {target} because I had to pick somebody, and {target} was standing closest to the fire.", v: { dry: "{target}. Why? Because the pen needed a name, and that was the first one that came to mind." } }] },
    { id: 'nfj.n3', turns: [{ by: 'a', conf: "I don't love this. I'm writing {target}, and I'm going to pretend I thought about it way harder than I did." }] },
    { id: 'nfj.n4', when: { voice: ['warm', 'earnest', 'anxious', 'emotional'] }, turns: [{ by: 'a', conf: "I hate this so much. {target}, I'm sorry, it's nothing you did, I just had to write somebody's name." }] },
  ],
  'fi.booth.enemy': [
    { id: 'nfj.e1', turns: [{ by: 'a', conf: "{target} rolled {target.posAdj} eyes at me on the boat over. I saw it. So, {target}.", v: { dry: "{target} rolled {target.posAdj} eyes at me before we'd even landed, so I'm returning the favour." } }] },
    { id: 'nfj.e2', turns: [{ by: 'a', conf: "I knew within five minutes that {target} and I were going to have a problem, so I'm fixing it now." }] },
    { id: 'nfj.e3', when: { voice: ['tough', 'blunt', 'loud', 'competitive'] }, turns: [{ by: 'a', conf: "I don't like {target}. I'm not going to make up a reason. I just don't." }] },
  ],
  'fi.booth.calculated': [
    { id: 'nfj.c1', turns: [{ by: 'a', conf: "{target} asked me who I was close to already. On day one. That's not small talk, that's homework." }] },
    { id: 'nfj.c2', turns: [{ by: 'a', conf: "{target} was nice to every single person here within an hour, and I'm sorry, but nobody is that nice for free.", v: { warm: "{target} has been so nice to everybody, and I want to believe it, but it felt a little rehearsed." } }] },
    { id: 'nfj.c3', turns: [{ by: 'a', conf: "I watched {target} watching everybody else, and I know that look, because I do it too. That's why it's {target}." }] },
  ],
  'fi.booth.threat': [
    { id: 'nfj.t1', turns: [{ by: 'a', conf: "{target} carried two bags off the boat like they weighed nothing. I'm not waiting to see what {target} can do in a challenge.", v: { anxious: "{target} is so strong it's honestly scary, and I'd rather not be the one standing next to {target} at the end." } }] },
    { id: 'nfj.t2', turns: [{ by: 'a', conf: "{target} is smart, strong and likeable. That's the person who wins this thing, so it's {target}." }] },
    { id: 'nfj.t3', turns: [{ by: 'a', conf: "Everybody's going to want {target} on their side by next week, so I'm getting rid of {target} before that happens." }] },
  ],
  'fi.booth.outsider': [
    { id: 'nfj.o1', turns: [{ by: 'a', conf: "{target} spent most of the afternoon sitting off by {target.ref}, so I don't think anybody's going to miss {target.obj}.", v: { warm: "I wish I'd talked to {target} more today, I really do, but I didn't, and neither did anybody else." } }] },
    { id: 'nfj.o2', turns: [{ by: 'a', conf: "I couldn't tell you a single thing about {target}, and I think that's exactly why everybody's writing {target}." }] },
    { id: 'nfj.o3', turns: [{ by: 'a', conf: "{target} hasn't said ten words to me today. That's not a crime, but it's not helping {target} either." }] },
  ],
  'fi.booth.gut': [
    { id: 'nfj.g1', turns: [{ by: 'a', conf: "I can't explain it, and I don't have to. Something about {target} just feels wrong.", v: { anxious: "I keep getting this weird feeling about {target}, and I'd rather trust it than be sorry later." } }] },
    { id: 'nfj.g2', turns: [{ by: 'a', conf: "{target} smiles a lot, but the smile never gets to {target.posAdj} eyes. I noticed that the first time we spoke." }] },
    { id: 'nfj.g3', turns: [{ by: 'a', conf: "I read people for a living, pretty much, and {target} is hiding something. I don't know what, but I know it's there." }] },
  ],
  'fi.booth.loud': [
    { id: 'nfj.l1', turns: [{ by: 'a', conf: "{target} told the whole group {target.posAdj} life story before lunch, and then told it again, so I'm writing {target}.", v: { dry: "{target} has an opinion on everything, and I've heard all of them already. It's been six hours." } }] },
    { id: 'nfj.l2', turns: [{ by: 'a', conf: "{target} walked in like {target.sub} already owned the place. Somebody had to humble {target.obj}, and it might as well be all of us." }] },
    { id: 'nfj.l3', when: { voice: ['quiet', 'calm', 'anxious'] }, turns: [{ by: 'a', conf: "{target} is just so loud. I need a little peace and quiet, and {target} is not peace and quiet." }] },
  ],
};
