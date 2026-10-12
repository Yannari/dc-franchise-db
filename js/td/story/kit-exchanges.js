// Authored alternatives for existing kit moments, not extra camp events.
// Exact source matching prevents a saved/edited kit from inheriting somebody else's scene.
import KITS, { HAND_KITS } from './kits/index.js';
import { voiceOf } from './voice.js';

const say = (by, text) => ({ by, say: text, v: Object.fromEntries(['sharp','dry','loud','soft','odd'].map(k => [k, text])) });
const beat = text => ({ beat: text });
const conf = (by, text) => ({ ...say(by, text), say: undefined, conf: text });
const dialogue = rows => rows.map(([by, text]) => say(by, text));
const hard = name => voiceOf(name).some(t => ['cruel','schemer','proud','blunt','dry','bossy'].includes(t));
const matches = (name, index, line) => {
  const original = HAND_KITS[name], current = KITS[name];
  return original && current && current.thing === original.thing && line === original.bit[index] && current.bit.includes(line);
};

// Each branch follows the opening rather than appending a generic joke to any topic.
const BITS = {
  Aubrey: { index: 1,
    dry: [['b',"I wasn't watching the clock."],['a','Your parents might know.'],['b','You want me to track down my birth records for this?'],['a','I want you to stop acting like I asked for a blood sample.']],
    curious: [['b','Why?'],['a',"I'm trying to work out your rising sign."],['b',"Couldn't you just ask me about myself?"],['a','Fine. What are you like?'],['b',"I don't think anyone can answer that objectively."],['a','And you wonder why I asked for the time.']],
    warm: [['b',"I don't know. Does that mean you can't do mine?"],['a','Not the whole chart, but we can start with your birthday.'],['b',"Okay, but you have to explain it. Don't just tell me I'm doomed."],['a',"Deal. And you can tell me if I get you wrong."],['b',"You're actually going to let me?"],['a',"I'm going to try. Don't sound so surprised."]],
    group: [['b','No idea.'],['c','Do mine.'],['a',"I'm talking to {b}."],['c',"{b} doesn't want it done. I'm helping."],['b',"For once, {c} is right."],['a','Okay, {c}. What time?'],['c',"I don't know. Can't you tell by looking at me?"],['b','This should be good.']],
    end: {
      dry: "It was one question. {b} could've just said no.",
      curious: "{b} wants me to ask questions instead of making guesses. Fine, but those questions aren't as easy to answer.",
      warm: "{b} didn't understand it, but wanted me to explain. That's all I was asking for.",
      group: "Neither of them knew what time they were born, but somehow I was the difficult one."
    } },
  Julia: { index: 0,
    dry: [['b','We have cameras. You could just talk to one.'],['a',"Not from this angle. Come over here."],['b',"I'm comfortable over here."],['a',"You'd look better over here."],['b',"And there goes my interest in helping."]],
    curious: [['b','What would you actually post?'],['a','Something about getting away from everything and reconnecting.'],['b',"You just said you wanted your phone."],['a',"To share the reconnecting."],['b',"Right. Wouldn't want to experience it privately."]],
    warm: [['b',"You can tell me. I'll pretend I'm your followers."],['a','Okay. Welcome back, you guys.'],['b','Hi, Julia!'],['a',"Don't interrupt the introduction."],['b',"Sorry. I'm new to being an audience."],['a',"You're doing great. Just a little quieter."]],
    group: [['b',"You know we're already on television, right?"],['a',"Yes, and I'd like to look good on it."],['c',"You're blocking the rest of us."],['a',"You can move."],['b',"So can you."],['c',"There's room next to me."],['a',"Fine. But I'm taking this side."],['b',"There. A whole negotiation over sunlight."]],
    end: {
      dry: "I asked {b} to move a little. Apparently that was too much.",
      curious: "Yes, I want to get away from everything. I also want people to see how well I'm doing it.",
      warm: "{b} volunteered to be my audience. Honestly, I've had less cooperative ones.",
      group: "We had an entire argument over where to sit. At least I got the side I wanted."
    } },
  Millie: { index: 1,
    dry: [['b','Am I in it?'],['a','Yes, but you can ask not to be.'],['b','Then leave me out.'],['a','Okay.'],['b',"That was easier than I expected."],['a',"I'm trying to talk to people, too. It's going slower."]],
    curious: [['b','Do we get to read what you write?'],['a',"It isn't finished."],['b',"Neither are we. You're still taking notes."],['a',"That's fair. You can read your part."],['b',"And correct it?"],['a',"You can argue with it. I feel like you're going to."]],
    warm: [['b','You could ask us things instead.'],['a',"I never know where to start."],['b',"You could start with me. What do you want to know?"],['a',"What do people usually get wrong about you?"],['b',"Okay, that's a big first question."],['a',"Sorry. Favorite food?"],['b',"Let's do that one."]],
    group: [['b','What did you write about me?'],['a',"I haven't finished your part."],['c',"Why does {b} get a part? How much have you written about me?"],['a',"This wasn't supposed to become a competition."],['b',"You're ranking us?"],['a',"No! And I'm putting the notebook away now."],['c',"Wait. Just tell me if mine's longer."]],
    end: "I wanted to understand everyone better. I probably should've asked whether they wanted to be studied." },
  Lake: { index: 0,
    dry: [['b','Which one is the queen?'],['a','That shell.'],['b',"And that one's a bishop?"],['a','Yes.'],['b',"I'm going to lose because I can't identify my army."],['a',"I'll remind you. I want to win at chess, not shells."]],
    curious: [['b','Can you teach me?'],['a','Of course. Pick a side.'],['b',"The one that'll win."],['a',"That depends on what you do."],['b',"I was hoping you'd handle that part, too."],['a',"First lesson. You have to move your own pieces."]],
    warm: [['b',"I'm terrible at chess."],['a',"We can play slowly."],['b',"Will you tell me before I do something stupid?"],['a',"I'll ask if you're sure."],['b',"You're going to be asking that a lot."],['a',"That's okay. We have time."]],
    group: [['b','Can I play?'],['a','Pick a side.'],['c',"I'll help {b}."],['a',"Two against one?"],['b',"You made the board. You have experience."],['c',"Move that one."],['b',"That's hers."],['a',"I'm happy with the teams now."]],
    end: "I thought nobody would want to play. It was nice being wrong about that." },
  Dunia: { index: 2,
    dry: [['b',"I'd rather you asked how I feel."],['a','Okay. How do you feel?'],['b','Thirsty.'],['a',"So we agree on the water."],['b',"Let's leave it there."]],
    curious: [['b','What does grey mean to you?'],['a',"Like you're worn out. Not that something's wrong with you."],['b',"Oh. I thought you were about to tell me something terrible."],['a',"No, I'm checking on you."],['b',"You could lead with that."],['a',"Fair. Do you want some water?"]],
    warm: [['b',"I'm tired, actually."],['a','Do you want to sit with me for a minute?'],['b',"As long as I don't have to be interesting."],['a',"You don't. We can just sit."],['b',"That sounds pretty good."]],
    group: [['b',"What's wrong with grey?"],['a',"Nothing. I said not bad grey."],['c',"I'm wearing grey."],['a',"I'm not talking about your clothes."],['b',"Can we all just have some water?"],['a',"Yes. That's what I was trying to say."]],
    end: {
      dry: "{b} wanted me to ask instead of reading the energy. We did agree on getting some water.",
      curious: "I was checking on {b}, but it sounded like a warning. I'll explain that better next time.",
      warm: "{b} needed somewhere to sit without having to entertain anyone. I can do that.",
      group: "I wasn't criticizing anybody. Next time I'll just start by offering the water."
    } },
  Gabby: { index: 2,
    dry: [['b',"You're asking us to keep a secret from your cats?"],['a',"They'd be upset."],['b',"I'm not planning to meet them."],['a',"You might. We could stay friends."],['b',"Okay. If I meet the cats, I won't say anything."],['a',"Thank you. That means you're invited."]],
    curious: [['b','Why the goat?'],['a',"I like being around him. He doesn't pretend he likes you when he doesn't."],['b',"And the cats do?"],['a',"The cats like me when I'm feeding them."],['b',"That's still a relationship."],['a',"Exactly. You understand."]],
    warm: [['b',"I want to hear about all of them."],['a','Really? It might take a while.'],['b',"We're not going anywhere."],['a',"Okay, but stop me if I talk too much."],['b',"You don't have to apologize before you start."],['a',"Okay. Then I'm starting with the goat."]],
    group: [['b','Why does the goat win?'],['c',"Don't make her rank them. The cats are already losing."],['a',"I love the cats!"],['b',"But not as much."],['a',"You're both being very difficult about a private family matter."],['c',"Sorry. Your cats won't hear it from us."],['a',"Good. Now, does anyone want to hear about the ferret?"]],
    end: "I miss them. Talking about them helped, and {b} actually stayed to listen." },
  Bruno: { index: 0,
    dry: [['b','Are you volunteering to organize us?'],['a','If it would help.'],['b',"What if we don't follow it?"],['a',"Then I'll change the schedule."],['b',"You're going to be very busy."],['a',"That's most of my job."]],
    curious: [['b','What would you change?'],['a',"We could stop waiting until everyone's hungry to decide who's doing what."],['b',"Okay. What do you need from me?"],['a',"You actually want to help?"],['b',"You asked."],['a',"Right. Sorry. Yes. Let's work it out."]],
    warm: [['b',"You don't have to do everybody's work."],['a',"I know. I just like being useful."],['b',"Then give me something to do, too."],['a',"Okay. You can help me split it up."],['b',"Including something for you that isn't everything."],['a',"I'll try."]],
    group: [['b',"Fine. What's my job?"],['a',"We haven't made the schedule yet."],['c',"I want the easy one."],['b',"So do I."],['a',"This is why the schedule's a mess."],['c',"You said you could fix it."],['a',"I might have spoken too soon."]],
    end: {
      dry: "{b} thinks nobody will follow the schedule. I'd still rather offer to help than sit around complaining.",
      curious: "It felt good when {b} asked what I needed. Usually I'm the one asking.",
      warm: "{b} offered to help me instead of letting me take on everything. I needed that reminder.",
      group: "They both wanted the easy job before I'd even made the schedule. This might take a while."
    } },
  Gwen: { index: 0,
    dry: [['b',"You could try enjoying it."],['a',"You could try letting me complain."],['b',"Fair. How long do you need?"],['a',"Until it goes down."],['b',"I'll check back later."]],
    curious: [['b','What would you rather be doing?'],['a','Drawing. Somewhere quiet.'],['b',"Am I ruining the quiet?"],['a',"Not yet."],['b',"I'll take that."],['a',"You probably should."]],
    warm: [['b','Want to sit somewhere shadier?'],['a',"You don't have to move because I complained."],['b',"I want to sit down, too."],['a','Okay.'],['b',"I'll even let you complain some more."],['a',"Careful. That's a big offer."]],
    group: [['b',"You don't like anything, do you?"],['a',"I like the shade."],['c',"There's some over here."],['a','See? Helpful.'],['b',"I was making conversation."],['a',"So was I. Mine got us somewhere to sit."]],
    end: {
      dry: "I don't need to be talked into enjoying sunshine. Just let me complain.",
      curious: "{b} asked what I'd rather be doing, then actually listened. I can work with that.",
      warm: "{b} didn't try to cheer me up. We just found somewhere to sit.",
      group: "We found somewhere to sit, and I didn't have to pretend I loved the weather. Good enough."
    } },
};

/** Returns a whole exchange for supported, unchanged kit material; otherwise use the original kit. */
export function kitExchange(a, b, opening, third = null) {
  const spec = BITS[a];
  if (!spec || !matches(a, spec.index, opening)) return null;
  const group = third && third !== a && third !== b;
  // Exact partner voices for the examples; everyone else uses their existing authored voice tags.
  const style = b === 'Millie' ? 'curious' : hard(b) ? 'dry' : 'warm';
  const rows = group ? spec.group : spec[style];
  const who = { a, b, ...(group ? { c: third } : {}) };
  return { id: 'exchange:' + a + ':' + spec.index + ':' + (group ? 'group' : style), who,
    turns: [say('a', opening), ...dialogue(rows), conf('a', typeof spec.end === 'string' ? spec.end : spec.end[group ? 'group' : style])],
    fx: group ? [[a, third, 0.25], [b, third, 0.25]] : [] };
}

// A dig is already an engine event with a negative bond consequence. These alternatives keep it a
// public insult, make its subject the active kit, and let the target answer instead of only absorbing it.
const DIGS = {
  Julia: { index: 0, rows: [
    ['a',"Do you ever talk to us without checking where the camera is?"],['b',"Do you ever talk to me without trying to sound above it all?"],
    ['a',"I'm asking because you keep looking over my shoulder."],['b',"Maybe I'm looking for a better conversation."],
    ['a',"Try having one without an audience."],['b',"You started this in front of everyone."],['a',"And you finally looked at me. There we go."]],
    witness: ['c',"You can both stop looking at us. We're not judging this."] },
  Millie: { index: 1, rows: [
    ['a',"Are you taking notes, or are you going to join the conversation?"],['b',"I can do both."],['a',"Then say something. To us."],
    ['b',"Fine. You're being rude."],['a',"See? You didn't need to write that down first."],['b',"And you didn't need everyone watching to ask me a question."]],
    witness: ['c',"Let her answer without interrupting, then."] },
  Aubrey: { index: 1, rows: [
    ['a',"You've decided what I'm like before I've even answered you."],['b',"Then tell me what I got wrong."],
    ['a',"You don't get to announce who I am and make me argue my way out of it."],['b',"It was a question."],
    ['a',"Then wait for the answer."],['b',"Fine. I'm listening."],['a',"You could've started there."]],
    witness: ['c',"Let {a.obj} finish. You asked."] },
  Bruno: { index: 0, rows: [
    ['a',"Nobody hired you to manage us."],['b',"I was offering to help."],['a',"You're offering to tell everybody what to do."],
    ['b',"You can say no without making me look stupid."],['a',"Okay. No."],['b',"Fine. Next time, start with that."]],
    witness: ['c',"It was an offer. You didn't have to take it."] },
};
export function kitDigEntry(kind, who) {
  if (kind !== 'drama.dig') return null;
  const spec = DIGS[who.b], k = KITS[who.b];
  if (!spec || !matches(who.b, spec.index, k?.bit?.[spec.index])) return null;
  // The speaker must actually have a cutting voice; a friendly character isn't assigned this insult.
  if (!hard(who.a)) return null;
  const turns = [beat('{a} turns toward {b}, speaking loudly enough for the others to hear.'), ...dialogue(spec.rows)];
  if (who.c) turns.push(say(...spec.witness));
  turns.push(conf('b',"{a} could've said that to me alone. Doing it in front of everyone was a choice."));
  return { id: 'kit-dig:' + who.b, place: 'public', turns };
}

// Romance borrows only an explicitly authored, unchanged kit topic. No inferred powers or props.
const ROMANCE = {
  "Aubrey": [
    [
      "a",
      "Before you ask, I am not deciding whether I like you from a chart."
    ],
    [
      "b",
      "Good. I would hate to lose to a birth certificate."
    ],
    [
      "a",
      "I still want to know your birth time."
    ],
    [
      "b",
      "Of course you do. What happens if I cannot find out?"
    ],
    [
      "a",
      "You could just keep talking to me. I do like doing that."
    ],
    [
      "b",
      "That sounds much less administrative. I can manage that."
    ]
  ],
  "Millie": [
    [
      "b",
      "If this conversation goes in the notebook, I want a chance to correct the record."
    ],
    [
      "a",
      "What record?"
    ],
    [
      "b",
      "The part where I am apparently very smooth around you."
    ],
    [
      "a",
      "You think that is what I have written?"
    ],
    [
      "b",
      "I was hoping. What would help my case?"
    ],
    [
      "a",
      "Talking to me without trying to impress me."
    ],
    [
      "b",
      "Great. That has been going very well, accidentally."
    ]
  ],
  "Lake": [
    [
      "a",
      "Do you want to play chess with me?"
    ],
    [
      "b",
      "Yes, but I need to know whether being charming earns me any extra turns."
    ],
    [
      "a",
      "No. You can be charming on your own turn."
    ],
    [
      "b",
      "That is a lot of pressure. I was hoping to spread it out."
    ],
    [
      "a",
      "You can also just talk to me. I will still want to play with you."
    ],
    [
      "b",
      "Okay. That actually helps more than an extra turn."
    ]
  ],
  "Bruno": [
    [
      "b",
      "Does your schedule include any time to just sit with me?"
    ],
    [
      "a",
      "It could. How long?"
    ],
    [
      "b",
      "I was trying to be spontaneous. You are making me submit a proposal."
    ],
    [
      "a",
      "I am asking because I want to make time."
    ],
    [
      "b",
      "Oh. Then as long as you want."
    ],
    [
      "a",
      "That is a terrible unit of measurement. It is also a good answer."
    ]
  ]
};
export function kitRomanceEntry(kind, ending, who) {
  if (!['romance.flirt', 'romance.moment', 'romance.honeymoon'].includes(kind) || !who.a || !who.b || who.c) return null;
  if (kind === 'romance.moment' && !['couple', 'crush'].includes(ending)) return null;
  const spec = BITS[who.a], rows = ROMANCE[who.a];
  if (!rows || !spec || !matches(who.a, spec.index, HAND_KITS[who.a]?.bit?.[spec.index])) return null;
  const close = {
    Aubrey: "{b} thought the chart was a test. I wanted a reason to keep talking. Apparently I could have just said that.",
    Millie: "{b} wanted to know what I thought, and actually waited for an answer. I liked that more than the attempt to impress me.",
    Lake: "{b} was worried about being interesting enough. I invited {b.obj} because I wanted the company, not a performance.",
    Bruno: "{b} thought asking how long meant I was making it complicated. I wanted to know how much time I could set aside. I should explain that before I ask for numbers."
  };
  return { id: 'kit-romance:' + who.a, place: 'aside', turns: [...dialogue(rows), conf('a', close[who.a]) ] };
}
