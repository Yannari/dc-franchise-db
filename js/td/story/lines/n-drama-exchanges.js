// Alternatives inside existing fight events. No new event rolls or invented prior incidents.
const a = (say, v) => ({ by: 'a', say, ...(v ? { v } : {}) });
const b = (say, v) => ({ by: 'b', say, ...(v ? { v } : {}) });
const c = (say, v) => ({ by: 'c', say, ...(v ? { v } : {}) });
const beat = text => ({ beat: text });
const conf = (by, text, v) => ({ by, conf: text, ...(v ? { v } : {}) });
export default {
  'long.drama.fight.erupt': [
    { id: 'ndx.erupt1', place: 'public', turns: [
      beat('{a} cuts across {b} before the conversation can move on.'),
      a("Don't tell me to calm down."), b("Then stop shouting over me."),
      a("I'm shouting because you won't listen!"), b("I was answering you. You interrupted."),
      a("Because you were making excuses."), b("You don't get to decide that before I say them."),
      a("Fine. Go on, then."), b("I don't want you ordering me around."),
      a("That's your whole problem?"), b("You're doing it right now."),
      beat('{a} opens {a.posAdj} mouth, then turns away with a frustrated shout.'),
      conf('b',"I tried answering, and I tried waiting. Neither worked, so next time I'm leaving.", { dry: "Apparently I was supposed to listen and agree. I managed half of that." }),
    ] },
    { id: 'ndx.erupt2', place: 'public', turns: [
      a("Say it to me, then. I'm right here."), b("I said I don't like the way you're talking to me."),
      a("And I don't like being corrected in front of everybody!"), b("Then why did you ask me to repeat it?"),
      c("Can we stop making this everybody's problem?", { warm: "You two need a minute away from each other.", dry: "Some of us were having a perfectly bad day without this." }),
      a("Stay out of it!"), b("Don't yell at {c.obj}."), a("I'm not talking to {c.obj}!"),
      b("Then look at me."), beat('{a} turns back toward {b}, still furious. {c} steps away from them.'),
      conf('a',"I know everyone heard that, and I'm still too angry to care.", { emotional: "I hated having everyone watch, but then I made it louder. Now they're definitely watching." }),
    ] },
  ],
  'long.drama.fight.snap': [
    { id: 'ndx.snap1', place: 'public', turns: [
      a("Can you let me finish one sentence?"), b("I was asking a question."),
      a("Then wait until I get to the end!"), beat('The sharpness in {a.posAdj} voice stops the conversation.'),
      b("You could've just said that."), a("I just did."),
      b("No. You yelled it, and you made sure everyone heard."),
      a("Okay, I shouldn't have yelled. I still want to finish."), b("Then finish. I'm listening."),
      beat('{a} resumes speaking, but {b} keeps more distance this time.'),
      conf('b',"{a} wants me to forget the shouting because it stopped. I haven't forgotten it."),
    ] },
    { id: 'ndx.snap2', place: 'public', turns: [
      b("You don't have to get defensive."), a("And you don't have to talk to me like I'm an idiot."),
      b("I didn't call you an idiot."), a("You slowed every word down. I understood you the first time."),
      b("Then why aren't you listening?"), a("Because understanding you doesn't mean agreeing with you!"),
      beat('{b} glances toward the people who have stopped to watch.'),
      b("We can talk about this later."), a("Talk to me properly, or don't bother."),
      conf('a',"I shouldn't have shouted, but I'm not going to pretend that tone was fine."),
    ] },
  ],
  'long.drama.fight.tense': [
    { id: 'ndx.tense1', place: 'public', turns: [
      a("Are you finished?"), b("With what?"), a("Correcting everything I say."),
      b("You asked what I thought."), a("I didn't ask you to take over."),
      b("You wanted my opinion until it wasn't yours."),
      beat('{a} lowers {a.posAdj} voice instead of looking away.'),
      a("If you've got something to say about me, say it."),
      b("I just did. You don't like being disagreed with."), a("And you don't know when to stop."),
      conf('b',"Neither of us raised our voice, but that wasn't a friendly conversation.", { dry: "We kept it polite enough that nobody could tell us to calm down. That didn't make it nicer." }),
    ] },
    { id: 'ndx.tense2', place: 'public', turns: [
      a("You can stop explaining now."), b("You said you didn't understand."),
      a("I understand. I don't believe you."), b("Then why did you ask?"),
      a("I wanted to hear what you'd say."), b("And you'd already decided it was wrong."),
      c("Are you actually trying to sort this out?", { warm: "You two need to decide whether you want an answer or an argument.", dry: "Just checking whether there's a point where this ends." }),
      a("We're talking."), b("No, we're done."), beat('{b} leaves before {a} can answer.'),
      conf('b',"I kept explaining because I thought {a} wanted to understand. That was my mistake."),
    ] },
  ],
  'long.drama.fight.rare': [
    { id: 'ndx.rare1', place: 'public', turns: [
      a("No. You don't get to speak to me like that."),
      b("I was joking."), a("I'm telling you I didn't like it."),
      b("Okay. You don't have to make a whole thing of it."),
      a("I said one sentence. You're the one arguing."),
      beat('{b} looks away. {a} stays where they are.'),
      b("Fine. I won't say it."), a("Good. That's all I asked."),
      conf('a',"I hate fighting, but I didn't want to laugh along and have {b} think I was fine with it."),
    ] },
    { id: 'ndx.rare3', place: 'public', turns: [
      b("Relax. Nobody's blaming you."), a("You were looking straight at me."),
      b("I was looking at everybody."), a("Then say what you mean to everybody."),
      b("Why are you getting so upset?"), a("Because you're trying to make me look stupid for answering you."),
      beat('{b} starts to speak, but {a} holds up a hand.'),
      a("You can disagree with me. Just stop laughing while you do it."),
      b("Fine."), a("Fine."),
      conf('a',"I wanted to let it go, but then {b} laughed. I couldn't sit there and laugh along."),
    ] },
    { id: 'ndx.rare2', place: 'public', turns: [
      a("Could you ask me instead of telling me?"), b("Does it really matter how I say it?"),
      a("Yes. I'm helping you because I want to."), b("Then help."),
      beat('{a} stops and faces {b}.'), a("Not if you're going to keep doing that."),
      b("You're refusing over one word?"), a("I'm refusing because you heard me and did it anyway."),
      beat('{b} has no immediate answer. {a} moves away.'),
      conf('a',"I wanted us to get along, but that doesn't mean {b} can order me around."),
    ] },
  ],
};
