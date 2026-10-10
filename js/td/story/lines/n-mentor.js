// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-mentor.js — a mentor arc across three episodes: the offer, the practice, the payoff
// ══════════════════════════════════════════════════════════════════════
// The user's Disventure Camp read, 2026-10-10: Anastasia teaches Rosa to make fire over two episodes, and
// it's Rosa's pride, not the fire, that the scenes are about ("I don't need to be shown. I know how!").
// director.js runs it: a (the mentor, good at {skill}) and b (struggling with it), one arc at a time.
//   arc.mentor.offer     b fails at it; a offers; b's pride says no, then yes
//   arc.mentor.practice  a lesson, a little trust
//   arc.mentor.done      b does it alone (or still can't, and says so)

export default {
  'arc.mentor.offer': [
    { id: 'nmt.o1', turns: [
      { beat: "{b} has been trying at {skill} for twenty minutes, and it is not going well." },
      { by: 'a', say: "Here, let me show you how to do it." },
      { by: 'b', say: "I don't need to be shown. I know how." },
      { by: 'a', say: "You obviously don't know, and that's okay. Nobody's born knowing." },
      { by: 'b', say: "...Fine. But only because I'm sick of looking stupid in front of everybody." },
      { by: 'a', say: "That's all I need. Tomorrow morning, then." },
      { by: 'b', conf: "I hate being taught things. I really hate it. But {a} didn't make me feel stupid, and that's rare." },
    ] },
    { id: 'nmt.o2', turns: [
      { by: 'a', say: "Can I be honest? You're doing {skill} completely wrong." },
      { by: 'b', say: "Thanks. Really helpful." },
      { by: 'a', say: "I mean it nicely, you're close. You're just missing one thing, and I could show you." },
      { by: 'b', say: "Why would you help me? We're not even close." },
      { by: 'a', say: "Because watching you struggle is painful for both of us." },
      { by: 'b', say: "...Okay, tomorrow, before anyone's up, so nobody sees." },
      { by: 'a', conf: "{b} acts like asking for help is losing. I used to be exactly the same. It made everything harder than it needed to be." },
    ] },
    { id: 'nmt.o3', turns: [
      { beat: "{b} gives up on {skill} and throws the whole thing down. {a} picks it back up." },
      { by: 'a', say: "Don't quit on it. You were nearly there." },
      { by: 'b', say: "I was nowhere near there, and everybody saw." },
      { by: 'a', say: "Nobody's watching now. Come on, I'll go through it with you, one step at a time." },
      { by: 'b', say: "Why do you even care?" },
      { by: 'a', say: "Because somebody once did it for me, and I never forgot it." },
      { by: 'b', say: "...Okay. One step at a time." },
      { by: 'b', conf: "I wanted to be the kind of person who doesn't need help. Turns out I'm the kind of person who needs a little." },
    ] },
  ],
  'arc.mentor.practice': [
    { id: 'nmt.p1', turns: [
      { beat: "{a} and {b} are up before everybody else, practising {skill} where nobody can see." },
      { by: 'a', say: "Slower, you're rushing it. It's not a race." },
      { by: 'b', say: "Everything here is a race." },
      { by: 'a', say: "Not this. Breathe, and do it again." },
      { by: 'b', say: "...Like that?" },
      { by: 'a', say: "Like that. See, you're better at this than you think." },
      { by: 'b', conf: "I'm not even mad about getting up early. {a} is a good teacher. Don't tell {a.obj} I said that." },
    ] },
    { id: 'nmt.p2', turns: [
      { by: 'b', say: "Why are you being so nice to me? Honestly, what's the catch?" },
      { by: 'a', say: "There's no catch. I spent a long time doing everything alone, by my own choice, and it made everything harder." },
      { by: 'b', say: "So I'm your charity case." },
      { by: 'a', say: "You're my student, and there's a difference. Now, again, from the start." },
      { by: 'b', say: "Again? Fine, again." },
      { by: 'a', conf: "{b} keeps waiting for me to ask for something back. I'm not going to. That's the whole point." },
    ] },
  ],
  'arc.mentor.done': [
    { id: 'nmt.d1', turns: [
      { beat: "{b} works at {skill} alone, while {a} pretends not to watch from across camp." },
      { by: 'b', say: "I did it, I actually did it! {a}, look!" },
      { by: 'a', say: "I see it. See, that wasn't so hard, was it?" },
      { by: 'b', say: "It was very hard. Thank you, really, thank you." },
      { by: 'a', say: "You don't have to thank me. You did it." },
      { by: 'b', conf: "Even though I've been out here the longest, I still wanted to prove I can do things on my own. Turns out I can. With a little help." },
      { by: 'a', conf: "I didn't know {b} cared that much about it. I'm glad I helped. More than I expected to be." },
    ] },
    { id: 'nmt.d2', turns: [
      { by: 'b', say: "Don't watch. I'm going to do it by myself this time." },
      { by: 'a', say: "I'm not watching. I'm looking at a tree." },
      { beat: "{b} gets it on the first try. {a} absolutely watched." },
      { by: 'b', say: "First try! Did you see that? You definitely saw that." },
      { by: 'a', say: "I was looking at a tree. But yes, I saw it." },
      { by: 'b', conf: "{a} taught me {skill}, and somewhere in there I think {a} also taught me it's okay to need somebody. Gross. But true." },
    ] },
  ],
};
