// pm/lines/debrief.js — the night's debrief (pm/debrief.js), and the gossip
// that carries what was said in it. Data only. Casts are pm/debrief.js's;
// {Where}/{where} is the room ("Up on the terrace", "In the dressing room").
// These run long on purpose (user: "do we have longer conversation?"): a
// debrief is where the villa actually talks, so six to nine lines, often
// three voices.
const C3 = extra => ({ cast: 3, ...extra });

export const DEBRIEF = [
  // ── robbed: a's partner was stolen by c ──
  { id: 'dn.rb.01', when: C3({ of: 'robbed' }), stage: '{Where}, {b} sits down next to {a} and waits.', turns: [
    ['b', "Talk to me."], ['a', "I didn't see it coming. I really didn't."], ['b', "Nobody did."],
    ['a', "{c} was nice to my face all week."], ['b', "That's what gets me. All week."],
    ['a', "I'm not going to cry about it in here."], ['b', "You can if you want. I'll stand in front of you."]],
    beat: '{a} laughs, and then does cry, a little.' },
  { id: 'dn.rb.02', when: C3({ of: 'robbed' }), stage: '{Where}. Nobody else is talking.', turns: [
    ['a', "Did you know? Be honest."], ['b', "No. I promise. I'd have told you."],
    ['a', "Then how did {c} know it would work?"], ['b', "Because {c} saw a chance and took it."],
    ['a', "I feel so stupid."], ['b', "You're not stupid. You trusted people. That's not the same thing."]] },
  { id: 'dn.rb.03', when: C3({ of: 'robbed' }), turns: [
    ['b', "Are you okay?"], ['a', "No. Ask me tomorrow."], ['b', "What are you going to say to {c}?"],
    ['a', "Nothing. I'm not giving {c} the satisfaction."], ['b', "Good. Be the bigger person."],
    ['a', "I'm being the bigger person on the outside. On the inside I'm screaming."]],
    beat: '{b} does not let go of {a.posAdj} hand for the rest of the night.' },
  { id: 'dn.rb.04', when: C3({ of: 'robbed' }), stage: '{Where}, {a} is staring at the floor.', turns: [
    ['b', "You don't have to say anything."], ['a', "I thought we were solid."], ['b', "So did everyone."],
    ['a', "And then {c} stands up and says a name, and that's it. That's the end of it."],
    ['b', "It's not the end. It's the end of tonight."], ['a', "Can we just sit here for a bit?"], ['b', "As long as you want."]] },
  // ── stole: a did it, from c ──
  { id: 'dn.st.01', when: C3({ of: 'stole', taken: true }), stage: '{Where}, and {b} has been waiting to ask.', turns: [
    ['b', "So. Tonight."], ['a', "I know how it looked."], ['b', "It looked like you took {pa} from {c}."],
    ['a', "I followed my heart. I'm not going to apologise for that."], ['b', "I'm not asking you to apologise."],
    ['a', "Then what are you asking?"], ['b', "Whether it was worth it."], ['a', "Ask me in a week."]] },
  { id: 'dn.st.02', when: C3({ of: 'stole', taken: true }), turns: [
    ['a', "Is {c} okay?"], ['b', "What do you think?"], ['a', "I didn't do it to hurt anyone."],
    ['b', "I know. But you did."], ['a', "I'd do it again, though. That's the worst part."],
    ['b', "Then at least be honest with {c} about that."]], beat: '{a} nods, and does not go and find {c}.' },
  { id: 'dn.st.03', when: C3({ of: 'stole', taken: true }), turns: [
    ['b', "Well, you've made some enemies."], ['a', "Have I?"], ['b', "Half the villa isn't speaking to you."],
    ['a', "The half that matters is."], ['b', "{pa} better be worth it."], ['a', "{pa} is. I'm sure of it."],
    ['b', "Then I'm on your side. Just don't make me regret it."]] },
  { id: 'dn.st.04', when: C3({ of: 'stole', taken: true }), stage: '{Where}, {a} finally sits down.', turns: [
    ['a', "My hands are still shaking."], ['b', "Because you knew it was going to cause a war."],
    ['a', "Because I knew it was the right thing for me."], ['b', "{c} is heartbroken."],
    ['a', "I know. I'll talk to {c} tomorrow."], ['b', "Tomorrow might be too late."]] },
  // ── twisted-on: c came back from Casa with someone else ──
  { id: 'dn.to.01', when: C3({ of: 'twisted-on' }), stage: '{Where}. The others have gone quiet around {a}.', turns: [
    ['a', "I stuck. I actually stuck."], ['b', "I know. We all saw."], ['a', "And {c} walked in holding someone else's hand."],
    ['b', "I'm so sorry."], ['a', "Did you think {c} would do that?"], ['b', "No. Not for one second."],
    ['a', "Then I'm not mad for trusting {c}?"], ['b', "You're not mad. You're loyal. That's different."]] },
  { id: 'dn.to.02', when: C3({ of: 'twisted-on' }), turns: [
    ['b', "What do you need?"], ['a', "I need to know what I did wrong."], ['b', "Nothing. You did nothing wrong."],
    ['a', "Then why did {c} do it?"], ['b', "Because {c} got scared, or bored, or both. None of that is you."],
    ['a', "I kept a bed made up for {c}. Every night."], ['b', "I know you did."]], beat: 'Nobody in the room says anything for a long time.' },
  { id: 'dn.to.03', when: C3({ of: 'twisted-on' }), turns: [
    ['a', "Everyone's being so nice to me, and it's making it worse."], ['b', "Do you want us to be horrible?"],
    ['a', "Maybe a little bit."], ['b', "Fine. Your hair's a mess."], ['a', "Thank you."],
    ['b', "And {c} is an idiot."], ['a', "…Okay, that one helped."]] },
  // ── twisted: a came back with someone new ──
  { id: 'dn.tw.01', when: C3({ of: 'twisted' }), turns: [
    ['b', "Have you spoken to {c} yet?"], ['a', "Not yet. I don't know what to say."], ['b', "Start with sorry."],
    ['a', "I'm not sorry I did it. I'm sorry how it happened."], ['b', "Then say that."],
    ['a', "Do you think I'm a bad person?"], ['b', "I think you made a choice. Now you have to live with it."]] },
  { id: 'dn.tw.02', when: C3({ of: 'twisted' }), stage: '{Where}, {a} sits with {a.posAdj} head in {a.posAdj} hands.', turns: [
    ['a', "Did you see {c}'s face?"], ['b', "Everyone saw {c}'s face."], ['a', "I felt sick walking in."],
    ['b', "But you still walked in with someone."], ['a', "Because I felt more over there in three days than in weeks here."],
    ['b', "Then you owe {c} the truth. All of it."]] },
  { id: 'dn.tw.03', when: { of: 'twisted' }, turns: [
    ['b', "Well. That was a lot."], ['a', "I know."], ['b', "Are you happy, at least?"],
    ['a', "I think so. I'm also terrified."], ['b', "Of what?"], ['a', "Of being the villain for the rest of this."],
    ['b', "Then don't act like one from here on."]] },
  // ── miss: c has just gone home ──
  { id: 'dn.ms.01', when: C3({ of: 'miss' }), stage: '{Where}, the bed next to {a} is already made up.', turns: [
    ['a', "It's so quiet without {c}."], ['b', "It's been an hour."], ['a', "I know. It's still quiet."],
    ['b', "You'll talk to {c} when you're out."], ['a', "It's not the same."],
    ['b', "No. But {c} would want you to stay and win this."], ['a', "{c} would want me to stay and be annoying about it."]],
    beat: 'They both laugh, and it is the first laugh all night.' },
  { id: 'dn.ms.02', when: C3({ of: 'miss' }), turns: [
    ['b', "How are you doing?"], ['a', "I keep looking round for {c}."], ['b', "Me too, honestly."],
    ['a', "{c} was the one I told everything to."], ['b', "Then tell me instead. I'm not going anywhere."],
    ['a', "You don't know that."], ['b', "Then I'm not going anywhere tonight."]] },
  { id: 'dn.ms.03', when: C3({ of: 'miss' }), turns: [
    ['a', "I didn't even get to say goodbye properly."], ['b', "You hugged {c} for about ten minutes."],
    ['a', "That's not properly."], ['b', "What would properly have been?"], ['a', "Longer."]],
    beat: '{b} puts an arm round {a} and leaves it there.' },
  { id: 'dn.ms.04', when: C3({ of: 'miss' }), stage: '{Where}, {a} is holding the jumper {c} left behind.', turns: [
    ['b', "Are you keeping that?"], ['a', "{c} will want it back."], ['b', "{c} will want you to have it."],
    ['a', "It still smells like {c}."], ['b', "Okay. Now you're just being sad on purpose."],
    ['a', "A little bit."]] },
  // ── blame: c voted a's partner or friend out ──
  { id: 'dn.bl.01', when: C3({ of: 'blame' }), stage: '{Where}, and {a} is not quiet about it.', turns: [
    ['a', "{c} looked me in the eye this morning."], ['b', "I know."], ['a', "And then stood up at the fire pit and did that."],
    ['b', "It was a vote. Somebody had to go."], ['a', "It didn't have to be them."],
    ['b', "Are you going to say something to {c}?"], ['a', "Oh, I'm going to say a lot of things to {c}."]],
    beat: '{b} decides not to be in the room when that happens.' },
  { id: 'dn.bl.02', when: C3({ of: 'blame' }), turns: [
    ['b', "Don't do anything tonight."], ['a', "Why not?"], ['b', "Because you're angry, and you'll say something you mean."],
    ['a', "Good. I want to say something I mean."], ['b', "Sleep on it."],
    ['a', "I'll sleep on it. I'll still be angry in the morning."], ['b', "Then say it in the morning."]] },
  { id: 'dn.bl.03', when: C3({ of: 'blame' }), turns: [
    ['a', "I thought {c} was my friend."], ['b', "Maybe {c} thought it was the right call."],
    ['a', "Whose side are you on?"], ['b', "Yours. Always. I'm just saying there might be a reason."],
    ['a', "There's a reason. {c} wanted them gone."], ['b', "…Okay. That's fair."]] },
  // ── next: a thinks they are next ──
  { id: 'dn.nx.01', when: { of: 'next' }, stage: '{Where}, {a} is counting on {a.posAdj} fingers.', turns: [
    ['b', "What are you doing?"], ['a', "Working out who's next."], ['b', "And?"], ['a', "It's me. It's definitely me."],
    ['b', "You don't know that."], ['a', "I'm single, I'm not a favourite, and I haven't done anything."],
    ['b', "Then do something. You've got a few days."]] },
  { id: 'dn.nx.02', when: { of: 'next' }, turns: [
    ['a', "Can I be honest? That scared me."], ['b', "It scared everyone."], ['a', "No, but properly. I could be next."],
    ['b', "Then let's make sure you're not."], ['a', "How?"], ['b', "You get out there tomorrow and you graft. Chat to everyone."],
    ['a', "I hate grafting."], ['b', "You'll hate going home more."]] },
  { id: 'dn.nx.03', when: { of: 'next' }, turns: [
    ['b', "You've gone quiet."], ['a', "I'm just thinking."], ['b', "About the vote?"],
    ['a', "About how fast it happens. One minute you're here, and then you're packing."],
    ['b', "You're not packing."], ['a', "Not tonight."], ['b', "Not any night. Come here."]] },
  // ── eyeing: a's partner could not stop looking at the bombshell c ──
  { id: 'dn.ey.01', when: C3({ of: 'eyeing', taken: true }), stage: '{Where}, {a} is not letting it go.', turns: [
    ['a', "Did you see how {pa} looked at {c}?"], ['b', "I saw."], ['a', "I'm not imagining it?"],
    ['b', "You're not imagining it. But a look is a look."], ['a', "It's never just a look in here."],
    ['b', "Then talk to {pa} before you decide what it is."], ['a', "And if I don't like the answer?"],
    ['b', "Then at least you'll know."]] },
  { id: 'dn.ey.02', when: C3({ of: 'eyeing', taken: true }), turns: [
    ['b', "Are you worried about {c}?"], ['a', "I'm worried about {pa}."], ['b', "What did {pa} say?"],
    ['a', "Nothing. That's what worries me."], ['b', "Nothing isn't always bad."],
    ['a', "In here, nothing is always bad."]], beat: '{b} does not have an answer to that.' },
  { id: 'dn.ey.03', when: C3({ of: 'eyeing', taken: true }), turns: [
    ['a', "Be honest with me. Is {c} {pa}'s type?"], ['b', "…A bit."], ['a', "A bit?"],
    ['b', "Quite a lot. But {pa} chose you."], ['a', "{pa} chose me before {c} walked in."],
    ['b', "Then give {pa} a reason to keep choosing you."]] },
  // ── bomb-threat: the bombshell c has come in for a's partner ──
  { id: 'dn.bt.01', when: C3({ of: 'bomb-threat', taken: true }), turns: [
    ['a', "{c} has come in for {pa}. I just know it."], ['b', "You don't know that."],
    ['a', "Did you see where {c} sat? Right next to {pa}."], ['b', "Okay, I did see that."],
    ['a', "So what do I do?"], ['b', "Nothing yet. Let {c} make the first move, and let {pa} show you what happens."]] },
  { id: 'dn.bt.02', when: C3({ of: 'bomb-threat', taken: true }), stage: '{Where}, {a} has been pacing.', turns: [
    ['b', "Sit down. You're making me dizzy."], ['a', "{c} asked {pa} for a chat within about ten minutes."],
    ['b', "People chat."], ['a', "Not like that, they don't."], ['b', "Do you trust {pa}?"],
    ['a', "I trust {pa}. I don't trust {c}."], ['b', "Then keep trusting {pa}."]] },
  { id: 'dn.bt.03', when: C3({ of: 'bomb-threat', taken: true }), turns: [
    ['a', "I'm going to be calm about this."], ['b', "Are you?"], ['a', "No. But I'm going to look calm."],
    ['b', "What's the worst that happens?"], ['a', "{pa} goes off with {c} and I'm the one crying at the fire pit."],
    ['b', "And the best?"], ['a', "{pa} tells {c} to leave it."], ['b', "Hold on to the best one."]] },
  // ── bomb-fancy: a fancies the bombshell c ──
  { id: 'dn.bf.01', when: C3({ of: 'bomb-fancy', taken: true }), turns: [
    ['a', "Can I tell you something?"], ['b', "Is it about {c}?"], ['a', "…How did you know?"],
    ['b', "You haven't stopped looking since {c} walked in."], ['a', "Is it that obvious?"],
    ['b', "To everyone. Including whoever you're coupled with."]], beat: '{a} goes very red.' },
  { id: 'dn.bf.02', when: C3({ of: 'bomb-fancy', taken: true }), stage: '{Where}, {a} keeps {a.posAdj} voice down.', turns: [
    ['a', "Don't tell {pa}, but {c} is exactly my type."], ['b', "I'm not going to tell anyone."],
    ['a', "I'm happy with {pa}. I am."], ['b', "But?"], ['a', "But I want to get to know {c}. Just to be sure."],
    ['b', "That's how it starts, you know."]] },
  { id: 'dn.bf.03', when: C3({ of: 'bomb-fancy', taken: false }), turns: [
    ['a', "Right. {c}. That's the one."], ['b', "You've spoken to {c} for about thirty seconds."],
    ['a', "It was a good thirty seconds."], ['b', "What are you going to do?"],
    ['a', "Get up early, look nice, and be the first one to say good morning."], ['b', "Strong plan."]] },
  // ── picked / meh: a recoupling night ──
  { id: 'dn.pk.01', when: { of: 'picked', taken: true }, turns: [
    ['b', "You looked so relieved when {pa} said your name."], ['a', "I was. I've been worried for days."],
    ['b', "About what?"], ['a', "That {pa} would pick someone else."], ['b', "And now?"],
    ['a', "And now I can finally breathe."]], beat: '{a} smiles, properly, for the first time all day.' },
  { id: 'dn.pk.02', when: { of: 'picked', taken: true }, stage: '{Where}, {a} cannot stop grinning.', turns: [
    ['b', "Go on. Say it."], ['a', "Say what?"], ['b', "That you're happy."], ['a', "I'm happy."],
    ['b', "With {pa}."], ['a', "With {pa}. Really happy. Is that mad?"], ['b', "It's the least mad thing you've said all week."]] },
  { id: 'dn.pk.03', when: { of: 'picked', taken: true }, turns: [
    ['a', "I think this is it with {pa}."], ['b', "It? As in, it?"], ['a', "I don't want to jinx it."],
    ['b', "You've already jinxed it by saying it out loud."], ['a', "Then I'll say it quieter."]] },
  { id: 'dn.mh.01', when: { of: 'meh', taken: true }, turns: [
    ['b', "You don't look very happy with {pa}."], ['a', "It's fine."], ['b', "Fine?"],
    ['a', "{pa} is lovely. I just don't feel much."], ['b', "Then why did you go along with it?"],
    ['a', "Because it was that or go home."]], beat: '{b} nods slowly, and does not say what they are thinking.' },
  { id: 'dn.mh.02', when: { of: 'meh', taken: true }, stage: '{Where}, {a} is picking at a nail.', turns: [
    ['a', "Can I tell you something and you won't tell {pa}?"], ['b', "Of course."],
    ['a', "I'm not feeling it. I haven't been for days."], ['b', "Have you told {pa}?"],
    ['a', "How do you tell someone that?"], ['b', "Kindly. And soon."]] },
  { id: 'dn.mh.03', when: { of: 'meh', taken: true }, turns: [
    ['b', "Scale of one to ten. You and {pa}."], ['a', "Honestly? A five."], ['b', "A five after all this?"],
    ['a', "It was a six last week."], ['b', "That's going the wrong way."], ['a', "I know."]] },
];

// Gossip that carries a debrief: [a, b, c] — a heard it, b is c's partner, c said it.
export const HEARD = [
  { id: 'gs.hd.01', when: { knows: true, heard: true }, turns: [['a', "I don't want to cause trouble, but I heard what {c} said about you last night."], ['b', "What did {c} say?"], ['a', "That {c} isn't really feeling it."]], beat: '{b} stares at {a}, and then across the lawn at {c}.' },
  { id: 'gs.hd.02', when: { knows: true, heard: true }, turns: [['a', "Can I tell you something? It's about {c}."], ['b', "Go on."], ['a', "{c} was talking about you in the debrief. It wasn't nice."], ['b', "Not nice how?"], ['a', "Not sure about you. Not sure at all."]] },
  { id: 'gs.hd.03', when: { knows: true, heard: true }, turns: [['a', "I feel awful telling you this."], ['b', "Then why are you?"], ['a', "Because I'd want to know. {c} said {c} has got eyes for someone else."], ['b', "Who?"]], beat: '{a} does not say, which is worse.' },
  { id: 'gs.hd.04', when: { knows: true, heard: true }, turns: [['a', "You know what {c} said on the terrace?"], ['b', "Nothing good, by your face."], ['a', "That it's a five with you. Maybe less."]], beat: '{b} laughs, and then does not.' },
  { id: 'gs.hd.05', when: { knows: true, heard: true }, turns: [['a', "I was there when {c} said it. I'm not making it up."], ['b', "Said what?"], ['a', "That {c} would go for someone else if {c} could."], ['b', "{c} said that? To you?"], ['a', "To all of us."]] },
];

const K = (kind, more = {}) => ({ kind, ...more });
export const DEBRIEF_HUT = {
  honest: [
    { id: 'hut.dn.h1', when: K('debrief', { of: 'robbed', role: 0 }), turns: [['a', "Tonight hurt. I'm not going to pretend it didn't."]] },
    { id: 'hut.dn.h2', when: K('debrief', { of: 'stole', role: 0 }), turns: [['a', "I know half the villa hates me right now. I'd still do it again."]] },
    { id: 'hut.dn.h3', when: K('debrief', { of: 'twisted-on', role: 0 }), turns: [['a', "I stuck. I'd stick again. That's who I am, and I'm proud of it."]] },
    { id: 'hut.dn.h4', when: K('debrief', { of: 'miss', role: 0 }), turns: [['a', "The villa feels smaller tonight. I miss them already."]] },
    { id: 'hut.dn.h5', when: K('debrief', { of: 'blame', role: 0 }), turns: [['a', "I will be having a word. Maybe several words."]] },
    { id: 'hut.dn.h6', when: K('debrief', { of: 'next', role: 0 }), turns: [['a', "Every dumping, I think it's going to be me. One day I'll be right."]] },
    { id: 'hut.dn.h7', when: K('debrief', { of: 'eyeing', role: 0 }), turns: [['a', "I saw that look. I'm going to keep my eyes open."]] },
    { id: 'hut.dn.h8', when: K('debrief', { of: 'picked', role: 0 }), turns: [['a', "When my name got called, I actually felt my legs go."]] },
    { id: 'hut.dn.h9', when: K('debrief', { role: 1 }), turns: [['a', "I love a debrief. You find out who really thinks what."]] },
  ],
  'two-faced': [
    { id: 'hut.dn.t1', when: K('debrief', { of: 'meh', role: 0 }), turns: [['a', "I shouldn't have said that in front of everyone. In here, nothing stays in the room."]] },
    { id: 'hut.dn.t2', when: K('debrief', { of: 'bomb-fancy', role: 0 }), turns: [['a', "I told one person. In this villa, that's the same as telling everyone."]] },
    { id: 'hut.dn.t3', when: K('debrief', { of: 'stole', role: 0 }), turns: [['a', "I said sorry to everyone's face. I'm not actually sorry."]] },
  ],
};
