// pm/talk/more/hotspot-volume.js — the last lines heard six to nine times a
// season after round seven (the user, 2026-10-22: "address the repeats by
// increasing the volume of the dialogue ALOT"): the triangle's choice (two
// entries), the heart-rate answer, Snog Marry Pie's call, the blowup's charge,
// the loyal recoupling speech, the advice's question and the Casa bed. Same
// facts as each kind's own file: a recoupling speech never says the name; a
// heart-rate answer is the partner's (`coupled`), a coupled islander's slip
// (`taken`) or a single's; a charge says its own grievance (`of`).
const R = (...turns) => ({ turns });
const W = (when, ...turns) => ({ when, turns });
const S = (stage, ...turns) => ({ stage, turns });
const BW = (when, beat) => ({ when, turns: [], beat });
const BEAT = beat => ({ turns: [], beat });

export const HOTSPOT_VOLUME = {
  'triangle-choice': {
    moves: {
      moment: [
        { when: { of: 'pick' }, stage: "{a} has made up {a.posAdj} mind, and it's {b}. {c} hears it like everyone else does.", turns: [] },
        { when: { of: 'pick' }, stage: "After days of back and forth, {a} walks over to {b} and sits down. Everyone knows what it means.", turns: [] },
        { when: { of: 'default' }, stage: "It's {a} and {b} now, because {c} walked away before {a} could decide.", turns: [] },
      ],
      talk: [
        W({ of: 'pick' }, ['b', "So that's it? It's me?"], ['a', "It's you. It was always going to be you. I just took the long way round."]),
        W({ of: 'pick' }, ['b', "I was so scared you'd pick {c}."], ['a', "I know. I'm sorry I made you wait."], ['b', "Don't do it again."]),
        W({ of: 'pick' }, ['a', "I needed to be sure before I said anything. I'm sure now."], ['b', "Promise?"], ['a', "Promise."]),
        W({ of: 'pick' }, ['b', "What changed?"], ['a', "Nothing changed. I just stopped being scared of saying it."]),
        W({ of: 'pick' }, ['b', "You're not going to wake up tomorrow and change your mind?"], ['a', "Not tomorrow. Not ever. I'm done thinking."]),
        W({ of: 'default' }, ['b', "I'm not your second choice, am I?"], ['a', "You're my choice. That's what matters."], ['b', "That's what you'd say either way."]),
        W({ of: 'default' }, ['b', "If {c} came back tomorrow, what would you do?"], ['a', "I don't know. I don't want to find out."]),
        W({ of: 'default' }, ['a', "I know how this looks."], ['b', "It looks like {c} made your mind up for you."], ['a', "Maybe. I'm still glad it's you."]),
      ],
      land: [
        BEAT("{c} goes inside and doesn't come back out for the rest of the evening."),
        BEAT("{a} and {b} sit close, but there's a gap between them that wasn't there before."),
        BEAT("Someone brings {c} a drink. {c} says thanks and doesn't touch it."),
      ],
    },
  },
  'heart-rate': {
    moves: {
      spike: [
        { when: { coupled: true }, stage: "{b} hasn't even started yet, and {a}'s heart rate is already climbing.", turns: [] },
        { when: { coupled: true }, stage: "When it's {b}'s turn, {a}'s monitor goes off the scale, and {a} doesn't even try to hide it.", turns: [] },
        { when: { coupled: false, taken: true }, stage: "{a}'s number goes highest for {b}, and somewhere at the back, {pa} sees it.", turns: [] },
        { when: { coupled: false, taken: false }, stage: "{a}'s monitor jumps for {b}, and the whole villa notices before {a} does.", turns: [] },
      ],
      answer: [
        W({ coupled: true }, ['b', "Is that for me?"], ['a', "Who else would it be for?"]),
        W({ coupled: true }, ['a', "I'm not embarrassed. I'd do it again. I'd do it every day."], ['b', "You'd need a new heart."]),
        W({ coupled: true }, ['b', "That's the nicest number anyone's ever given me."], ['a', "It's not a number. It's a confession."]),
        W({ coupled: false, taken: true }, ['a', "I was hot. It's very hot today. Is it hot? It feels hot."]),
        W({ coupled: false, taken: true }, ['a', "Those machines aren't even accurate. Everyone knows that."], ['b', "Do they?"], ['a', "They do now."]),
        W({ coupled: false, taken: true }, ['b', "Should I be flattered?"], ['a', "You should be quiet. Please."]),
        W({ coupled: false, taken: true }, ['a', "I'd just run up the stairs. That's all it was. Stairs."], ['b', "There aren't any stairs."]),
        W({ coupled: false, taken: false }, ['a', "Right. Okay. I suppose that's out there now."], ['b', "I suppose it is."]),
        W({ coupled: false, taken: false }, ['b', "Me? Really?"], ['a', "Don't make me say it twice. The machine said it once already."]),
        W({ coupled: false, taken: false }, ['a', "I was going to tell you. I was going to find a nice way. The machine got there first."]),
      ],
      land: [
        BW({ coupled: true }, "{a} and {b} share a look that makes half the villa go 'aww'."),
        BW({ coupled: false, taken: true }, "{pa} folds {pa.posAdj} arms and watches the rest of the challenge in silence."),
        BW({ coupled: false, taken: true }, "{a} doesn't look at {pa} for the rest of the afternoon."),
        BW({ coupled: false, taken: false }, "{b} looks over at {a}, and smiles, and {a} goes even redder."),
      ],
    },
  },
  'snog-marry-pie': {
    moves: {
      call: [
        W({ full: true }, ['a', "Okay. Snog... {b}. Marry... {c}. And I'm so sorry, but pie... {d}."], ['d', "Why me?"], ['a', "Someone has to get the pie!"]),
        W({ full: true }, ['a', "Marry {c}, because I'm not stupid. Snog {b}, because I'm not dead. And pie {d}, because {d} can take it."]),
        W({ full: true }, ['a', "This is so hard. Fine. Snog {b}. Marry {c}. And the pie..."], ['a', "Sorry, {d}. You'll understand when you're older."]),
        W({ full: true }, ['a', "I'm going to marry {c}. I'm going to snog {b}. And {d}, this pie is with love. A lot of love. And a lot of cream."]),
        W({ full: true }, ['a', "Snog {b}, obviously, have you seen {b}? Marry {c}, obviously, have you met {c}? And pie..."], ['d', "Don't say it."], ['a', "{d}."]),
        W({ full: true, taken: true }, ['a', "Marry {c}. I have to say that, or I'm sleeping on the daybed. Snog {b}. And pie, {d}, sorry."]),
        W({ full: false }, ['a', "I don't want to do this. I'm just going to pie the first person I see."]),
        W({ full: false }, ['a', "Can I pass? No? Fine. Somebody's getting a pie, and I'm not saying why."]),
      ],
    },
  },
  blowup: {
    moves: {
      charge: [
        W({ of: 'jealousy' }, ['a', "Every time I look over, you're there. Next to {x}. Laughing at things that aren't funny. Do you think I can't see?"]),
        W({ of: 'jealousy' }, ['a', "I don't care what you say it is. I know what it looks like with you and {x}, and so does everyone else."]),
        W({ of: 'jealousy' }, ['a', "You've spent more time with {x} today than I have. Explain that to me. Go on."]),
        W({ of: 'history' }, ['a', "It's been like this since the first week. Every little thing I do, you've got something to say about it. I'm done pretending it doesn't bother me."]),
        W({ of: 'history' }, ['a', "I've tried being nice. I've tried ignoring you. Nothing works. So now I'm trying honest."]),
        W({ of: 'told' }, ['a', "I told you that in confidence. Do you know what confidence means? It means it stays with you."]),
        W({ of: 'told' }, ['a', "Everyone knew before I did. Everyone. Because you couldn't keep your mouth shut for one day."]),
        W({ of: 'vote', cause: 'gone' }, ['a', "You sent {x} home. You looked {x} in the eye that morning, and then you said the name. How do you sleep?"]),
        W({ of: 'vote' }, ['a', "Out of everyone in this villa, you picked my best friend. You knew what that would do to me."]),
        W({ of: 'steal' }, ['a', "I trusted you with how I felt. And you used it. You used it against me."]),
        W({ of: 'steal', cause: 'took' }, ['a', "You didn't even wait. Not one day. You just took {x}."]),
      ],
      defend: [
        W({ of: 'jealousy' }, ['b', "I'm not doing anything wrong. {x} is my friend. I'm allowed to have friends."], ['a', "Friends. Right."]),
        W({ of: 'history' }, ['b', "You've had it in for me from the start. Don't pretend this is new."], ['a', "And whose fault is that?"]),
        W({ of: 'told' }, ['b', "I didn't think it was that big a deal."], ['a', "It was a big deal to me. That should have been enough."]),
        W({ of: 'vote', cause: 'gone' }, ['b', "We all had to pick someone. You'd have done the same."], ['a', "I'd never have picked {x}. Never."]),
        W({ of: 'steal' }, ['b', "It's not like you were together together."], ['a', "That's not the point, and you know it."]),
        R(['b', "Are you finished?"], ['a', "Not even close."]),
      ],
    },
  },
  'recouple-pick': {
    moves: {
      speech: [
        W({ reason: 'loyalty' }, ['a', "I've had my head turned a couple of times in here, I'll admit that. But it never stays turned. It always comes back to the same person. So I'm not going to make this complicated."]),
        W({ reason: 'loyalty' }, ['a', "Some people come into this villa and change their mind every week. I'm not one of them. The person I'm picking already knows it's them."]),
        W({ reason: 'loyalty' }, ['a', "I don't need a speech for this one. I've made my decision every day since we coupled up. Tonight's no different."]),
        W({ reason: 'loyalty' }, ['a', "It's been tested, it's been talked about, and it's still standing. I'm picking the person I picked last time, and I'll pick them next time as well."]),
        W({ reason: 'loyalty' }, ['a', "Everyone keeps asking me if I'm sure. I'm sure. I've been sure for days. This person's got my loyalty, and they've earned it."]),
        W({ reason: 'loyalty', reg: 'dry' }, ['a', "I'll keep this short, because it's not a surprise. Same person. Same answer. Sorry to anyone who was hoping for drama."]),
        W({ reason: 'loyalty', reg: 'big' }, ['a', "I'm not going to stand here and pretend there's any doubt, because there isn't. I'm picking my person. I've been picking my person since day one."]),
        W({ reason: 'connection' }, ['a', "This person gets me. On the good days and the bad days. I don't have to pretend with them, and in here, that's everything."]),
        W({ reason: 'connection' }, ['a', "I've had a lot of chats in this villa. The best ones have all been with the same person. So I'm picking them."]),
        W({ reason: 'connection' }, ['a', "The person I'm picking is the first one I look for in a crowded room. Every time. Without thinking about it."]),
        W({ reason: 'attraction' }, ['a', "I'm not going to overthink this. There's someone in here I can't stop looking at, and I'd be lying if I picked anyone else."]),
        W({ reason: 'attraction' }, ['a', "We haven't had loads of time together, but every bit of time we've had, I've wanted more. That has to count for something."]),
        W({ reason: 'safety' }, ['a', "The person I'm picking is someone I feel comfortable with. I'm not going to pretend it's fireworks yet. But it's honest, and it's a start."]),
        W({ reason: 'safety' }, ['a', "This person has been really kind to me. I want to give us a real chance, away from all the noise."]),
      ],
    },
  },
  advice: {
    moves: {
      ask: [
        R(['b', "Can I ask you something about {c}? And you have to tell me the truth."], ['a', "I always tell you the truth."], ['b', "That's why I'm asking you."]),
        R(['b', "Everyone keeps telling me {c} is great. Do you think {c} is great?"]),
        R(['b', "I trust your judgement more than mine right now. What do you make of {c}?"]),
        R(['b', "If you were me, would you stay with {c}?"], ['a', "Are you asking me as your friend or as a judge?"], ['b', "Both."]),
        R(['b', "Tell me what you see when you look at me and {c}. Don't be nice. Be right."]),
        R(['b', "I've been thinking about {c} all day, and I can't tell if that's good or bad. What do you think?"]),
      ],
    },
  },
  'bed-share': {
    moves: {
      talk: [
        R(['b', "Are you asleep?"], ['a', "No."], ['b', "Me neither. Talk to me."]),
        R(['a', "This is the weirdest sleepover I've ever been to."], ['b', "It's not a sleepover."], ['a', "What is it, then?"], ['b', "I don't know yet."]),
        R(['b', "Do you think anyone back in the villa is doing this?"], ['a', "Doing what?"], ['b', "Lying awake, wondering."]),
        R(['a', "I keep thinking about {pa}."], ['b', "Do you want me to move?"], ['a', "No. That's the problem."]),
        R(['b', "If you weren't coupled up, would you be lying this close?"], ['a', "Closer, probably."]),
        R(['a', "Promise me something. Whatever happens tonight, it stays between us."], ['b', "Nothing's going to happen."], ['a', "Promise anyway."]),
      ],
    },
  },
};
