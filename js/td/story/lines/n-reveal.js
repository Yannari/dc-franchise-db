// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-reveal.js — the last name read: the one going home never saw it coming
// ══════════════════════════════════════════════════════════════════════
// td/story/tribal.js reveal: 'surprised' is a boot nobody warned (no word reached them, no
// counter-move of their own) and no close friend's vote made it a blindside. a is the boot; b the
// person a is closest to (bVoted: 'boot' when b wrote a's name, 'other' when not); c someone else.
// Nobody here knows who wrote what beyond their own vote. Ids: 'nrv.'.

export default {
  'reveal.surprised': [
    { id: 'nrv.s1', turns: [
      { by: 'a', say: "Wait, it's me?", v: { loud: "WAIT, ME?!", dry: "Huh, so it's me. Okay then.", anxious: "Me? No, that can't be right." } },
      { by: 'a', say: "I didn't hear my name once today. Not once." },
      { by: 'b', say: "None of us did. I swear.", when: { bVoted: 'other' } },
      { by: 'b', say: "I'm sorry. It was just how the numbers fell.", when: { bVoted: 'boot' } },
      { by: 'a', conf: "I walked in here thinking about who else was going home. It never even crossed my mind that it was me." },
    ] },
    { id: 'nrv.s2', turns: [
      { beat: "{a} laughs, waiting for somebody to say it's a joke. Nobody does." },
      { by: 'a', say: "Okay. So we're really doing this." },
      { by: 'c', say: "I'm sorry, {a}.", opt: true },
      { by: 'a', say: "Don't be sorry. Just tell me when it happened, because I missed it." },
    ] },
    { id: 'nrv.s3', when: { voice: ['loud', 'tough', 'competitive', 'blunt'] }, turns: [
      { by: 'a', say: "Are you serious right now? Who decided this?" },
      { beat: "Nobody looks up." },
      { by: 'a', say: "Nobody's going to own it? That's great, that's really great." },
      { by: 'b', say: "{a}, sit down for a second.", when: { bVoted: 'other' } },
      { by: 'a', say: "I'm not sitting down. I'm leaving, apparently." },
    ] },
    { id: 'nrv.s4', when: { voice: ['warm', 'earnest', 'emotional', 'anxious'] }, turns: [
      { by: 'a', say: "Oh, okay, it's me." },
      { beat: "{a}'s eyes fill up before {a} can stop them." },
      { by: 'a', say: "Sorry. I just... I really didn't think it was me." },
      { by: 'b', say: "Hey. Come here.", v: { tough: "Don't apologise. You've got nothing to be sorry for." } },
      { by: 'a', conf: "I thought I had friends in there. I still think I do. I just think they had other friends too." },
    ] },
    { id: 'nrv.s5', when: { voice: ['dry', 'calm', 'schemer'] }, turns: [
      { by: 'a', say: "Well. I'd like to say I saw that coming, but I really didn't." },
      { by: 'b', say: "None of us told you because none of us knew.", when: { bVoted: 'other' } },
      { by: 'b', say: "If it helps, it wasn't anything you did.", when: { bVoted: 'boot' } },
      { by: 'a', say: "It doesn't help. But thanks." },
      { by: 'a', conf: "Somebody ran a very quiet vote tonight. I'd be impressed if I wasn't the one going home." },
    ] },
    { id: 'nrv.s6', when: { voice: ['goofy', 'chaotic', 'theatrical'] }, turns: [
      { by: 'a', say: "Me? Me?! I was going to win this thing!" },
      { by: 'c', say: "You were never going to win this thing.", opt: true },
      { by: 'a', say: "Okay, rude, but I was at least going to last another week!" },
      { by: 'b', say: "We'll eat something in your honour." },
      { by: 'a', conf: "I had a whole plan for tomorrow. It involved a coconut. Now nobody will ever know." },
    ] },
    { id: 'nrv.s7', when: { age: 'teen' }, turns: [
      { by: 'a', say: "Wait, what? That's literally so unfair." },
      { by: 'a', say: "I was being so nice to everyone!" },
      { by: 'b', say: "You were. That's not why.", when: { bVoted: 'other' } },
      { by: 'a', say: "Then why?" },
      { beat: "Nobody has an answer that would make it better." },
    ] },
    { id: 'nrv.s8', when: { voice: ['proud', 'cruel'] }, turns: [
      { by: 'a', say: "Fine, wow, okay. That's fine." },
      { by: 'a', say: "Just so everybody knows, you didn't beat me. You just got there first." },
      { by: 'c', say: "Okay, {a}.", opt: true },
      { by: 'a', conf: "Not one of them had the nerve to tell me to my face. Remember that when you're watching this at home." },
    ] },
  ],
};
