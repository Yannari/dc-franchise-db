// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-final.js — the last confessional: their whole game, on the way out
// ══════════════════════════════════════════════════════════════════════
// director.js, after the walk out. a has just been voted out. Endings: how the reading landed
// (blindside, surprised, expected; any). Facts, all true of a's season: lostAlly ({lostAlly}, the
// last close friend voted out before a), blame ({blame}, who a has reason to think ran it),
// flipped (a broke from an alliance at some vote), won (a won immunity at least once), late (seven
// or fewer left). One confessional, three or four sentences, in a's own voice: the honest look back
// the shows close an exit on. Ids: 'nfn.'.

const C = (id, conf, when, v) => ({ id, ...(when ? { when } : {}), turns: [{ by: 'a', conf, ...(v ? { v } : {}) }] });

export default {
  'exit.final.any': [
    C('nfn.a1', "After losing {lostAlly}, I knew I had an uphill battle. I tried to find new people, and I thought I had. Am I disappointed? Sure, a lot. But I'm not ashamed of how I played.", { lostAlly: true },
      { tough: "Once {lostAlly} went, I was on my own, and I knew it. I fought anyway. I'd rather go out fighting than hang around being nobody's vote.", emotional: "When {lostAlly} left, a part of my game left too. I tried so hard to keep going. I'm going to miss everyone, even the ones who just did this to me." }),
    C('nfn.a2', "I never broke a promise in this game, not once. Maybe that's why I'm going home. I'd still rather lose like this than win by lying to people who trusted me.", { flipped: false },
      { schemer: "I kept my word the whole way through, which, honestly, might have been the mistake. Next time, if there's a next time, I'm going to be a lot less nice.", dry: "I kept every promise I made, and look where it got me. A boat ride and a lot of time to think about it." }),
    C('nfn.a3', "I made some moves I'm not proud of. I flipped when I had to, and I told myself it was just the game. Tonight it came back around, and I guess that's fair.", { flipped: true },
      { cruel: "I flipped on people, and I'd do it again. The only thing I'd change is doing it to the right people sooner.", warm: "I turned on people I cared about, and I'm going to have to look them in the eye after this. That's going to be harder than going home." }),
    C('nfn.a4', "I won when it mattered, and I still go home. That's the thing nobody tells you. Winning makes you safe for one night and a target for every night after.", { won: true },
      { competitive: "I beat all of them out there. I just couldn't beat them in here. I'm not sure which one counts more.", goofy: "I won a challenge! On camera! Nobody can take that away from me. They just took everything else." }),
    C('nfn.a5', "Coming this far wasn't luck. I got further than a lot of people thought I would, and I'm proud of every single day of it. I just ran out of days.", { late: true }),
    C('nfn.a6', "I don't know if I played well. I know I played like me. I made friends, I made a few people mad, and I'm leaving with my head up.", null,
      { anxious: "I was scared the whole time, honestly. Every vote, every night. But I kept showing up, and that's the part I'm going to remember.", proud: "I don't regret a single thing. Not one. Whoever wins this, they had to get past me first." }),
  ],
  'exit.final.blindside': [
    C('nfn.b1', "I trusted the wrong people. That's the whole story, really. I'm not going to pretend it doesn't hurt, because it really, really does.", null,
      { tough: "I trusted people who smiled at me, and that's a lesson learned. I'm not going to cry about it on camera, maybe just a little in the boat.", dry: "Well, I didn't see that one coming, which is the point of a blindside, I suppose. Well played, everybody, and I hate all of you a little." }),
    C('nfn.b2', "{blame} looked me in the eye all day and never gave anything away. I have to respect that, even while it's ruining my night.", { blame: true }),
  ],
  'exit.final.surprised': [
    C('nfn.s1', "I genuinely didn't hear my name once today. Either I wasn't paying attention, or they were really, really good. I'm going to spend the whole boat ride trying to work out which.", null),
    C('nfn.s2', "I walked into the vote worried about somebody else. That's the part that gets me. I was planning for tomorrow, and they'd already decided I wouldn't have one.", null,
      { warm: "I spent today worrying about everybody but me. I guess I should've saved a little of that worry for myself." }),
  ],
  'exit.final.expected': [
    C('nfn.e1', "I knew it was coming, and I did everything I could. Sometimes everything you can isn't enough. I'm sad, but I'm not surprised.", null,
      { tough: "I saw it coming a mile away and fought it all day anyway. That's all you can do. I'm going home with a clear conscience." }),
    C('nfn.e2', "I knew it was {blame}'s plan from the start. I just couldn't find enough people to stop it. Next time, I'm finding them sooner.", { blame: true }),
  ],
};
