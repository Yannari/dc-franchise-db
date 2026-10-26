// ══════════════════════════════════════════════════════════════════════
// pm/talk/confront.js — having it out, after a telling (pm/events.js haveItOut)
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-23: "the gossiping a lot but nothing ever come from it its
// like really empty". A telling now always reaches the one it was about.
//   told-confront [a, b, c]  {a} was told, {b} is who it was about, {c} told
//                            {a} (talked about, never in the room). {x} is who
//                            {b} was with, behind `hasWith`.
// What it was is the secret's own kind (`sec`): pull · kiss · bed · promise ·
// said. Everything else is the engine's:
//   `channel`  straight ({a} storms over) · calm ({a} sits {b} down) · held ({b} asks what's wrong)
//   `of`       {b}'s answer: owns · small · denies · blames (turns on {c})
//   `believed` {a} takes {b}'s word over {c}'s
//   `verdict`  forgive · warning · done
//   `nth`      first · again ({a} has had it out with {b} over a telling before)
//   `closedOff` {a} had closed off for {b}, going in
//   `light` a mild one; `dayOne` mild and from somebody's first day ("early days")
// {a} never names {c} first: only {b}'s guess does, in a blame.
//   open     how it starts
//   put      what {a} has heard
//   answer   {b}'s answer
//   push     {a} presses (never when {a} believes {b})
//   verdict  what {a} decides
//   land     how they leave it
import { build } from './build.js';

const W = (when, ...turns) => ({ when, turns });
const S = (when, stage, ...turns) => ({ when, stage, turns });
const B = (when, beat) => ({ when, turns: [], beat });
// A light secret is a mild one from somebody's first day (events.js DAY_ONE):
// only then is it "early days" (read, 2026-10-23: said on episode three).
const dayOne = (state, s) => !!s && [s.who, s.with].some(n => n && (state.ledger?.firstEp?.[n] ?? -1) === s.ep);
const secretOf = (state, ev) => (state.secrets || []).find(s => s.id === ev.extra?.secret) || null;

export const TOLD_CONFRONT = build('told-confront', {
  tiered: false,
  facts: (state, ev) => {
    const s = secretOf(state, ev);
    return { hasWith: !!s?.with, casa: !!s?.casa, light: (s?.severity ?? 1) < 0.6, dayOne: (s?.severity ?? 1) < 0.6 && dayOne(state, s), closedOff: !!ev.extra?.wasClosed };
  },
  slots: (state, ev) => {
    const s = secretOf(state, ev);
    return s?.with ? { x: s.with } : {};
  },
  plans: {
    featured: ['open', 'put', 'answer', 'push?', 'verdict', 'land'],
    short: ['open', 'answer', 'verdict'],
  },
  moves: {
    open: [
      // Straight from the telling: {a} goes and finds {b}.
      S({ channel: 'straight' }, "{a} comes straight across the lawn to {b} and doesn't sit down.", ['a', "Can I have a word? Now, please."], ['b', "Okay. What's happened?"], ['a', "You tell me."]),
      S({ channel: 'straight' }, "{a} finds {b} by the pool, laughing with the others. The laughing stops.", ['a', "Up. We're talking."], ['b', "Here?"], ['a', "Not here. Away from everyone."]),
      S({ channel: 'straight' }, "{a} finds {b} in the dressing room and shuts the door.", ['b', "What's wrong with you?"], ['a', "Me? Nothing's wrong with me. Sit down."]),
      S({ channel: 'straight' }, "{a} marches up to the daybeds, and the others suddenly find somewhere else to be.", ['b', "Whoa. What's that face for?"], ['a', "Don't. Don't do the innocent face. Not with me."]),
      S({ channel: 'straight', reg: 'big' }, "{a} storms over to {b}, and half the villa turns round to watch.", ['a', "Have you got something you want to tell me? Because now would be a really good time."], ['b', "What are you on about?"]),
      S({ channel: 'straight', reg: 'sharp' }, "{a} sits down opposite {b} on the terrace, arms folded.", ['a', "I'm going to ask you one question, and I want a straight answer."], ['b', "Go on."]),
      S({ channel: 'straight', reg: 'nervy' }, "{a} walks up to {b} and stops, as if {a} hasn't worked out the first line yet.", ['a', "I need to talk to you. I'm really trying not to shout."], ['b', "Okay. You're scaring me a bit."]),
      S({ channel: 'straight' }, "{a} takes {b} by the hand and walks {b.obj} off the sunbed, not gently.", ['b', "Ow. Where are we going?"], ['a', "Somewhere nobody else can hear this."]),
      S({ channel: 'straight', reg: 'dry' }, "{a} walks over to {b} with a face like thunder.", ['b', "Is it something I said?"], ['a', "Funny you should ask."]),
      // Sat with it first: {a} chooses the moment.
      S({ channel: 'calm' }, "A while later, {a} asks {b} for a word on the swing seat.", ['a', "Sit down a minute. I want to talk to you about something, and I want to do it calmly."], ['b', "That sounds bad."]),
      S({ channel: 'calm' }, "{a} waits until {b} is on {b.posAdj} own in the kitchen, then goes over.", ['a', "Have you got five minutes?"], ['b', "For you? Always."], ['a', "Let's see if you still say that in five minutes."]),
      S({ channel: 'calm' }, "{a} finds {b} on the terrace and sits down next to {b.obj}, not quite touching.", ['b', "You're very quiet."], ['a', "I'm working out how to say this."]),
      S({ channel: 'calm' }, "{a} sits {b} down on the beanbags, away from the others.", ['a', "I've heard something. I'm not going to scream. I just want to hear it from you."], ['b', "Heard what?"]),
      S({ channel: 'calm', reg: 'soft' }, "{a} sits next to {b} on the daybed and takes a long breath.", ['a', "I need to ask you something, and I need you to be honest with me, even if it's bad."], ['b', "Of course. What is it?"]),
      S({ channel: 'calm', reg: 'dry' }, "{a} hands {b} a drink and sits down.", ['a', "You might want that."], ['b', "Why does this feel like a trap?"]),
      S({ channel: 'calm' }, "{a} catches {b}'s eye across the lawn and nods towards the swing seat.", ['b', "What's up?"], ['a', "Sit with me. We need to talk about something."]),
      S({ channel: 'calm', reg: 'sharp' }, "{a} sits down opposite {b} at the kitchen table.", ['a', "I'll keep this short, because I'm not in the mood for a long one."], ['b', "Okay."]),
      // Kept it in: {b} is the one who asks.
      S({ channel: 'held' }, "{a} has gone very quiet, and {b} has noticed.", ['b', "Are you okay? You've barely looked at me."], ['a', "I'm fine."], ['b', "You're not fine. What's going on?"]),
      S({ channel: 'held' }, "{b} sits down next to {a} on the daybed. {a} shifts away, just slightly.", ['b', "What was that?"], ['a', "What was what?"], ['b', "You moved. Have I done something?"], ['a', "Have you?"]),
      S({ channel: 'held' }, "{b} catches {a} on the way past and holds onto {a.posAdj} hand.", ['b', "Hey. Where are you going? Talk to me."], ['a', "I don't really want to talk right now."], ['b', "Well, I do. What's wrong?"]),
      W({ channel: 'held' }, ['b', "You've been funny with me since earlier. Just say it, whatever it is."], ['a', "You really want me to say it?"], ['b', "Yes."]),
      S({ channel: 'held' }, "{b} finds {a} sitting alone by the pool.", ['b', "There you are. I've been looking everywhere for you."], ['a', "I needed a minute."], ['b', "Away from me?"], ['a', "Yes. Away from you."]),
      W({ channel: 'held', bReg: 'nervy' }, ['b', "Is this about me? It's about me, isn't it? I can tell. Just tell me."], ['a', "Sit down."]),
      S({ channel: 'held' }, "{b} brings {a} a cup of tea. {a} doesn't take it.", ['b', "Okay. Now I know something's wrong."], ['a', "Put it down. We need to talk."]),
      W({ channel: 'held', bReg: 'dry' }, ['b', "On a scale of one to ten, how much trouble am I in?"], ['a', "I haven't decided yet."]),
    ],

    put: [
      W({ sec: 'pull', hasWith: true }, ['a', "I've heard you've been having chats with {x}. Long ones. Close ones. Is that right?"]),
      W({ sec: 'pull', hasWith: true }, ['a', "Somebody saw you with {x}. Sitting really close, laughing at everything. And then you came back to me like nothing had happened."], ['b', "Okay, wait."]),
      W({ sec: 'pull', hasWith: true }, ['a', "You pulled {x} for a chat. While we're coupled up. And I had to hear about it from someone else."]),
      W({ sec: 'pull', hasWith: true, dayOne: true }, ['a', "I know it was early days. I know everyone was talking to everyone. But I've heard you and {x} were a lot more than friendly."]),
      W({ sec: 'pull', hasWith: true, closedOff: true }, ['a', "I closed myself off for you. I turned people away for you. And then I find out you've been off chatting to {x}?"]),
      W({ sec: 'kiss', hasWith: true }, ['a', "You kissed {x}. Don't look at me like that. I know you did."]),
      W({ sec: 'kiss', hasWith: true }, ['a', "I've been told you kissed {x}. So I'm asking you. Did you?"]),
      W({ sec: 'kiss', hasWith: true }, ['a', "You kissed {x}, and then you came and sat with me and held my hand. Do you know how that feels?"], ['b', "Let me explain."]),
      W({ sec: 'bed', hasWith: true }, ['a', "You shared a bed with {x}. A bed. And I'm the last person in this villa to find out."]),
      W({ sec: 'bed', hasWith: true }, ['a', "I've heard you and {x} were in the same bed, whispering. Tell me I've got that wrong."]),
      W({ sec: 'promise', hasWith: true }, ['a', "Apparently you've been making plans with {x}. For the outside. Dinners, weekends away. Was I in any of those plans?"]),
      W({ sec: 'promise', hasWith: true }, ['a', "You told {x} you'd take {x} out when this is all over. You've never said that to me. Not once."]),
      W({ sec: 'said' }, ['a', "I've heard what you've been saying about me. That you're not feeling it. That you're just going along with it."]),
      W({ sec: 'said' }, ['a', "Apparently you've been talking about me. About us. And not in a nice way."], ['b', "Who said that?"], ['a', "That's not the question I'm asking."]),
      W({ sec: 'said', heard: true }, ['a', "I've heard what you said about me when I wasn't there. Every word of it."]),
      W({ hasWith: true }, ['a', "It's about you and {x}. I know. So don't make me drag it out of you."]),
      W({ hasWith: true }, ['a', "So. You and {x}. When were you going to mention that?"]),
      W({}, ['a', "I know what's been going on. I'm not stupid, and I'm not going to pretend I don't know."]),
      W({ nth: 'again' }, ['a', "Here we are again. Somebody else coming up to me, telling me what you've been up to."]),
      W({ nth: 'again' }, ['a', "This isn't the first time someone's had to come to me about you. It isn't even close."], ['b', "I know how it looks."]),
    ],

    answer: [
      // Owns it.
      W({ of: 'owns' }, ['b', "It's true. I'm not going to lie to you. I did it, and I've felt sick about it ever since."], ['a', "Then why didn't you tell me?"], ['b', "Because I knew you'd look at me exactly like you're looking at me now."]),
      W({ of: 'owns' }, ['b', "Yeah. I did. I'm sorry. I should have come to you first, before anyone else could."], ['a', "Yes. You should have."]),
      W({ of: 'owns', sec: 'kiss', hasWith: true }, ['b', "I kissed {x}. It happened, and I can't take it back. I wish I could."], ['a', "Do you? Or do you just wish I hadn't found out?"]),
      W({ of: 'owns', sec: 'pull', hasWith: true }, ['b', "I did have a chat with {x}. I'm not going to pretend I didn't. And I'm not going to pretend it was nothing, either. You deserve better than that."]),
      W({ of: 'owns', sec: 'said' }, ['b', "I said it. I was having a bad day, and I said things I shouldn't have. That's not an excuse. I'm sorry."], ['a', "Did you mean it?"], ['b', "Not the way it sounded."]),
      W({ of: 'owns', sec: 'bed', hasWith: true }, ['b', "I did. I shared a bed with {x}, and I knew it was wrong the whole time."]),
      W({ of: 'owns', sec: 'promise', hasWith: true }, ['b', "I said those things to {x}. I got carried away. I'm sorry you had to hear it from somebody else."]),
      W({ of: 'owns', bReg: 'soft' }, ['b', "I'm so sorry. I really am. I've been dreading this conversation, and I deserve every bit of it."]),
      W({ of: 'owns', bReg: 'sharp' }, ['b', "Yes. It's true. I'm not going to make excuses. Say whatever you need to say."]),
      // Plays it down.
      W({ of: 'small', sec: 'pull' }, ['b', "It was a chat. That's it. Everyone chats to everyone in here. You chat to people."], ['a', "Not like that, I don't."]),
      W({ of: 'small', sec: 'pull' }, ['b', "We were talking, in front of everyone. If I was going to do something behind your back, would I do it where everyone could see?"], ['a', "Somebody did see."]),
      W({ of: 'small', sec: 'kiss' }, ['b', "It was one kiss. It didn't mean anything. I swear it didn't mean anything."], ['a', "Then why did you do it?"]),
      W({ of: 'small', sec: 'bed' }, ['b', "We slept. That's all. You're making it into something it isn't."], ['a', "Am I?"]),
      W({ of: 'small', sec: 'said' }, ['b', "I was venting. Everyone vents. It doesn't mean anything."], ['a', "It means something to me."]),
      W({ of: 'small', sec: 'promise' }, ['b', "People say all sorts of things in here. It was just talk. It's not like I booked a table."], ['a', "That's not funny."]),
      W({ of: 'small', dayOne: true }, ['b', "That was when everyone was talking to everyone. It didn't mean anything then, and it doesn't now."], ['a', "It meant something to me."]),
      W({ of: 'small' }, ['b', "Honestly, it's not as big as it sounds. Whoever told you has made it into a much bigger thing."], ['a', "Then make it smaller. Tell me exactly what happened."]),
      W({ of: 'small' }, ['b', "Okay, it happened. But it was nothing. I promise you, it was nothing."], ['a', "Nothing doesn't usually need a promise."]),
      // Denies it.
      W({ of: 'denies' }, ['b', "That didn't happen. I don't know who told you that, but it didn't happen."], ['a', "So they made it up?"], ['b', "I don't know what they saw, but it wasn't that."]),
      W({ of: 'denies' }, ['b', "No. No way. I haven't done anything. Who's saying this?"], ['a', "Does it matter?"], ['b', "Yes, it matters, because they're lying."]),
      W({ of: 'denies', sec: 'kiss' }, ['b', "I didn't kiss anyone. I swear on my life. I haven't kissed anyone in this villa but you."]),
      W({ of: 'denies', sec: 'said' }, ['b', "I never said that. I'd never say that about you. You know me."]),
      W({ of: 'denies' }, ['b', "Look at me. Look at me. Do I look like I'm lying to you?"], ['a', "I don't know any more. That's the problem."]),
      W({ of: 'denies' }, ['b', "You'd honestly believe someone else over me? After everything?"], ['a', "I don't know what to believe."]),
      W({ of: 'denies', bReg: 'sharp' }, ['b', "No. Whatever you've heard, it's wrong. Next question."], ['a', "There isn't a next question. That was the only one."]),
      W({ of: 'denies', bReg: 'big' }, ['b', "Are you serious? Are you actually serious right now? This is ridiculous. I haven't done anything."]),
      // Turns on the one who told.
      W({ of: 'blames' }, ['b', "Who told you? It was {c}, wasn't it?"], ['a', "It doesn't matter who it was."], ['b', "It matters to me. {c} has wanted us apart from the start."]),
      W({ of: 'blames' }, ['b', "Let me guess. {c}. Of course it was {c}. {c} loves this kind of thing."]),
      W({ of: 'blames' }, ['b', "Have you ever asked yourself why {c} is so interested in us? Because I have."]),
      W({ of: 'blames' }, ['b', "{c} came running to you, didn't {c}? What's in it for {c}? Think about that before you think about me."]),
      W({ of: 'blames' }, ['b', "So {c} says something, and that's it, I'm guilty? You're going to take {c}'s word over mine?"], ['a', "I'm asking you, aren't I?"]),
      W({ of: 'blames', hasWith: true }, ['b', "{c} has been watching me, waiting for something to run to you with. And you've fallen for it."]),
      W({ of: 'blames', bReg: 'sharp' }, ['b', "I'm not discussing anything until you tell me why you're listening to {c}."]),
      W({ of: 'blames' }, ['b', "You know what {c} is like. Everyone knows what {c} is like. And you're doing exactly what {c} wanted."]),
    ],

    push: [
      W({ believed: false, of: 'owns' }, ['a', "How long were you going to let me walk round thinking everything was fine?"], ['b', "I don't know. I didn't think that far ahead."]),
      W({ believed: false, of: 'owns' }, ['a', "Do you know what hurts? Not even what you did. That I had to find out from somebody else."], ['b', "I know."]),
      W({ believed: false, of: 'small' }, ['a', "If it was nothing, why did I have to hear it from someone else?"], ['b', "Because it was nothing. You don't announce nothing."]),
      W({ believed: false, of: 'small' }, ['a', "Don't make me feel stupid for asking. I'm not stupid."], ['b', "I know you're not."]),
      W({ believed: false, of: 'denies' }, ['a', "Someone saw you. Someone with no reason at all to lie to me."], ['b', "Everybody's got a reason in here."]),
      W({ believed: false, of: 'denies' }, ['a', "I'm going to give you one more chance to tell me the truth."], ['b', "I've told you the truth."]),
      W({ believed: false, of: 'blames' }, ['a', "Don't turn this round. This isn't about who told me. It's about what you did."], ['b', "It's about both."]),
      W({ believed: false, of: 'blames' }, ['a', "I'm not talking about {c}. I'm talking about you, and you keep changing the subject."]),
      W({ believed: false }, ['a', "I trusted you. I told everyone in here how sure I was about us."], ['b', "I know. I know you did."]),
      W({ believed: false }, ['a', "Other people knew before I did. Do you understand that? I was the last one."], ['b', "I'm sorry."]),
      W({ believed: false, closedOff: true }, ['a', "I closed myself off for you. Do you understand what that means? I stopped looking. I stopped even thinking about anyone else."], ['b', "I know what it means."]),
      W({ believed: false, nth: 'again' }, ['a', "We've already had one of these conversations. I didn't think we'd ever need another one."], ['b', "Neither did I."]),
    ],

    verdict: [
      // Forgiven.
      W({ verdict: 'forgive', believed: false }, ['a', "I'm not going anywhere. Not yet. But that's it. No more secrets. If there's something, you come to me."], ['b', "I will. I promise."]),
      W({ verdict: 'forgive', believed: false }, ['a', "Okay. I believe you're sorry. I'm still hurt, but I'd rather be hurt with you than without you."], ['b', "I don't deserve that."], ['a', "No. But you've got it."]),
      W({ verdict: 'forgive', believed: false }, ['a', "I want this to work. I do. So we start again, from right now. Clean."], ['b', "From right now."]),
      W({ verdict: 'forgive', of: 'owns' }, ['a', "Thank you for not lying to me. That's the only reason I'm still sitting here."], ['b', "I wasn't going to lie to you."]),
      W({ verdict: 'forgive', of: 'small', believed: false }, ['a', "Fine. But next time, you tell me first, before somebody else gets the chance."], ['b', "Deal."]),
      W({ verdict: 'forgive', dayOne: true, believed: false }, ['a', "Okay. It was early days. I'll let it go. Just don't make me regret it."], ['b', "You won't."]),
      W({ verdict: 'forgive', reg: 'soft' }, ['a', "Come here. I'm still upset with you. But come here."]),
      W({ verdict: 'forgive', feels: 'strong' }, ['a', "I like you too much to throw this away over one thing. Don't make me wish I had."], ['b', "I won't. I swear I won't."]),
      W({ verdict: 'forgive', believed: true }, ['a', "Okay. Okay, I believe you. I'm sorry I came at you like that."], ['b', "Don't be sorry. I'd want to know too."]),
      W({ verdict: 'forgive', believed: true, of: 'blames' }, ['a', "I don't know why {c} would make that up. But I believe you."], ['b', "Thank you."]),
      W({ verdict: 'forgive', believed: true }, ['a', "I believe you. I don't know what {c} thought {c} saw, but I believe you."]),
      W({ verdict: 'forgive', believed: true, of: 'denies' }, ['a', "Then somebody's lying to me, and I'd rather it wasn't you."], ['b', "It isn't me."]),
      // On a warning.
      W({ verdict: 'warning' }, ['a', "This is it. Your one chance. If I hear one more thing, from anyone, we're done. I mean it."], ['b', "You won't. I promise."]),
      W({ verdict: 'warning' }, ['a', "I'm not ending it. But I'm watching now. Every chat, every look. I'm watching."], ['b', "That's fair."]),
      W({ verdict: 'warning' }, ['a', "I don't trust you right now. I want to. I don't. You're going to have to earn it back."], ['b', "Then I'll earn it."]),
      W({ verdict: 'warning', nth: 'again' }, ['a', "Two strikes. I'm not doing a third."], ['b', "There won't be a third."]),
      W({ verdict: 'warning', of: 'denies' }, ['a', "I don't know if I believe you. So I'm going to wait and see. And if it turns out you're lying to me, that's it."], ['b', "I'm not lying."]),
      W({ verdict: 'warning', reg: 'sharp' }, ['a', "Last chance. That's all you get from me."], ['b', "Understood."]),
      W({ verdict: 'warning', of: 'blames' }, ['a', "Maybe {c} has got an agenda. Maybe not. Either way, you've got some work to do."]),
      W({ verdict: 'warning', of: 'owns' }, ['a', "I'm glad you told me the truth. It doesn't fix it. But I'm glad."], ['b', "What happens now?"], ['a', "Now you show me."]),
      // Done.
      W({ verdict: 'done' }, ['a', "I'm done. I can't do this. I can't sit next to you and wonder what you're doing every time I go inside."], ['b', "Please don't say that."], ['a', "I've said it."]),
      W({ verdict: 'done' }, ['a', "We're finished. I mean it. Don't come and find me later."], ['b', "You don't mean that."], ['a', "Watch me."]),
      W({ verdict: 'done' }, ['a', "You've made your choice. Now I'm making mine."], ['b', "What does that mean?"], ['a', "It means I'm done."]),
      W({ verdict: 'done', closedOff: true }, ['a', "I closed myself off for you. Well, not any more. I'm open, and you're not my problem."]),
      W({ verdict: 'done', nth: 'again' }, ['a', "That's twice. I gave you a chance, and you did it again. I'm done."]),
      W({ verdict: 'done', of: 'denies' }, ['a', "You looked me in the eye and lied to me. That's worse than whatever you did. We're done."]),
      W({ verdict: 'done', of: 'blames' }, ['a', "You couldn't even say sorry. You went straight for {c}. That tells me everything. I'm done."]),
      W({ verdict: 'done', of: 'owns' }, ['a', "Thank you for being honest. I mean it. But I can't get past this. I'm done."], ['b', "I understand."]),
      W({ verdict: 'done', reg: 'big' }, ['a', "No. No more. I'm not doing this any more. We're done, and I don't care who hears it."]),
      W({ verdict: 'done', of: 'small' }, ['a', "You think it's small. That's the problem. To me it isn't. I'm done."]),
    ],

    land: [
      B({ verdict: 'forgive', believed: false }, "{a} pulls {b} into a hug. Neither of them says anything for a long time."),
      B({ verdict: 'forgive', believed: false }, "They sit there a while longer, close, but not quite as close as before."),
      B({ verdict: 'forgive' }, "{b} reaches for {a}'s hand. After a second, {a} lets {b.obj} take it."),
      B({ verdict: 'forgive', believed: true }, "{a} hugs {b}. Whatever {c} thought {c} saw, {a} has picked a side."),
      B({ verdict: 'forgive', believed: true }, "{a} sits back down next to {b}. When {c} walks past, {a} doesn't look up."),
      B({ verdict: 'warning' }, "{a} gets up first. {b} watches {a.obj} go."),
      B({ verdict: 'warning' }, "{a} walks back to the others alone."),
      B({ verdict: 'warning' }, "They go back to the others together, a step apart."),
      B({ verdict: 'done' }, "{a} gets up and walks away. {b} doesn't follow."),
      B({ verdict: 'done' }, "{a} goes inside. {b} sits with {b.posAdj} head in {b.posAdj} hands."),
      B({ verdict: 'done' }, "The whole villa heard that last part. Nobody looks up."),
      B({ verdict: 'done', phase: 'evening' }, "{a} takes a pillow and goes to find somewhere else to sleep."),
      B({ verdict: 'done' }, "{b} calls after {a}. {a} keeps walking."),
    ],
  },

  notes: [
    { stage: "{a} has it out with {b} about what {c} said." },
    { when: { hasWith: true }, stage: "{a} asks {b} about {x}, and doesn't like the answer." },
  ],
});
