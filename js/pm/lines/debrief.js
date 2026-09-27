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
    ['a', "{c} was nice to my face all week."], ['b', "I know. That's what I can't get over."],
    ['a', "I don't want to cry in front of everyone."], ['b', "Then don't. Just sit here with me for a bit."]],
    beat: '{a} cries a little anyway, and {b} stays.' },
  { id: 'dn.rb.02', when: C3({ of: 'robbed' }), stage: '{Where}. Nobody else is talking.', turns: [
    ['a', "Did you know? Be honest."], ['b', "No. I promise. I'd have told you."],
    ['a', "Then how did {c} know it would work?"], ['b', "{c} saw a chance and took it."],
    ['a', "I feel so stupid."], ['b', "You're not stupid. You trusted someone. That's not the same thing."]] },
  { id: 'dn.rb.03', when: C3({ of: 'robbed' }), turns: [
    ['b', "Are you okay?"], ['a', "No. Not really."], ['b', "What are you going to say to {c}?"],
    ['a', "Nothing. I'm not going to give {c} the satisfaction."], ['b', "Good."],
    ['a', "I'm trying to act like I'm fine. I'm not fine."], ['b', "You don't have to act like anything in here with me."]],
    beat: "{b} doesn't let go of {a.posAdj} hand for the rest of the night." },
  { id: 'dn.rb.04', when: C3({ of: 'robbed' }), stage: '{Where}, {a} is staring at the floor.', turns: [
    ['b', "You don't have to say anything."], ['a', "I thought we were solid."], ['b', "So did everyone."],
    ['a', "And then {c} stands up and says a name, and it's over."],
    ['b', "Tonight is over. You're still here."], ['a', "Can we just sit here for a bit?"], ['b', "As long as you want."]] },
  // ── stole: a did it, from c ──
  { id: 'dn.st.01', when: C3({ of: 'stole', taken: true }), stage: '{Where}, and {b} has been waiting to ask.', turns: [
    ['b', "So. Tonight."], ['a', "I know how it looked."], ['b', "It looked like you took {pa} from {c}."],
    ['a', "I followed my heart. I'm not going to say sorry for that."], ['b', "I'm not asking you to."],
    ['a', "Then what are you asking?"], ['b', "Whether you're sure."], ['a', "I'm sure. I think."]] },
  { id: 'dn.st.02', when: C3({ of: 'stole', taken: true }), turns: [
    ['a', "Is {c} okay?"], ['b', "What do you think?"], ['a', "I didn't do it to hurt anyone."],
    ['b', "I know. But you did."], ['a', "I'd still do it again."],
    ['b', "Then at least be honest with {c} about that."]], beat: "{a} nods, and doesn't go and find {c}." },
  { id: 'dn.st.03', when: C3({ of: 'stole', taken: true }), turns: [
    ['b', "A lot of people are annoyed with you."], ['a', "Are they?"], ['b', "Half the villa isn't speaking to you."],
    ['a', "I know. I'll deal with it."], ['b', "Is {pa} worth it?"], ['a', "Yes. I'm sure of it."],
    ['b', "Then I'm on your side. Just be kind to {c}."]] },
  { id: 'dn.st.04', when: C3({ of: 'stole', taken: true }), stage: '{Where}, {a} finally sits down.', turns: [
    ['a', "My hands are still shaking."], ['b', "You knew it would cause a row."],
    ['a', "I knew it was the right thing for me."], ['b', "{c} is heartbroken."],
    ['a', "I know. I'll talk to {c} tomorrow."], ['b', "Talk to {c} tonight, if you can."]] },
  // ── twisted-on: c came back from Casa with someone else ──
  { id: 'dn.to.01', when: C3({ of: 'twisted-on' }), stage: '{Where}. The others have gone quiet around {a}.', turns: [
    ['a', "I stuck. I actually stuck."], ['b', "I know. We all saw."], ['a', "And {c} walked in holding someone else's hand."],
    ['b', "I'm so sorry."], ['a', "Did you think {c} would do that?"], ['b', "No. Not for a second."],
    ['a', "Was I stupid to trust {c}?"], ['b', "No. You were loyal. That's a good thing."]] },
  { id: 'dn.to.02', when: C3({ of: 'twisted-on' }), turns: [
    ['b', "What do you need?"], ['a', "I need to know what I did wrong."], ['b', "Nothing. You did nothing wrong."],
    ['a', "Then why did {c} do it?"], ['b', "I don't know. But it wasn't because of anything you did."],
    ['a', "I missed {c} every day."], ['b', "I know you did."]], beat: 'Nobody says anything for a long time.' },
  { id: 'dn.to.03', when: C3({ of: 'twisted-on' }), turns: [
    ['a', "Everyone's being so nice to me, and it's making it worse."], ['b', "Do you want us to leave you alone?"],
    ['a', "No. Just talk about something else."], ['b', "Okay. Anything you want."],
    ['a', "Tell me {c} was wrong."], ['b', "{c} was wrong."]] },
  // ── twisted: a came back with someone new ──
  { id: 'dn.tw.01', when: C3({ of: 'twisted' }), turns: [
    ['b', "Have you spoken to {c} yet?"], ['a', "Not yet. I don't know what to say."], ['b', "Start with sorry."],
    ['a', "I'm not sorry I did it. I'm sorry how it happened."], ['b', "Then say that."],
    ['a', "Do you think I'm a bad person?"], ['b', "No. But you've hurt someone, and you have to own it."]] },
  { id: 'dn.tw.02', when: C3({ of: 'twisted' }), stage: '{Where}, {a} sits with {a.posAdj} head in {a.posAdj} hands.', turns: [
    ['a', "Did you see {c}'s face?"], ['b', "Everyone saw it."], ['a', "I felt sick walking in."],
    ['b', "But you still walked in with someone."], ['a', "Because I felt more over there in three days than I did here."],
    ['b', "Then {c} deserves to hear that from you. All of it."]] },
  { id: 'dn.tw.03', when: { of: 'twisted' }, turns: [
    ['b', "That was a lot."], ['a', "I know."], ['b', "Are you happy, at least?"],
    ['a', "I think so. I'm also scared."], ['b', "Of what?"], ['a', "Of everyone thinking I'm the bad guy."],
    ['b', "Then show them you're not."]] },
  { id: 'dn.tw.04', when: { of: 'twisted' }, stage: '{Where}, {a} is sitting on {a.posAdj} own, staring at nothing.', turns: [
    ['b', "You did what you felt. That's allowed."], ['a', "It doesn't feel allowed."],
    ['b', "Give it a few days."], ['a', "I don't think a few days is going to fix this."], ['b', "Maybe not. But it'll help."]] },
  { id: 'dn.tw.05', when: { of: 'twisted' }, turns: [
    ['a', "Everyone's looking at me like I've done something awful."], ['b', "You've done something big. That's not the same."],
    ['a', "It feels the same."], ['b', "It won't in a week."]] },
  { id: 'dn.tw.06', when: C3({ of: 'twisted' }), turns: [
    ['b', "Are you going to talk to {c}?"], ['a', "Tomorrow. I can't do it tonight."], ['b', "{c} is going to be up all night either way."],
    ['a', "I know. I just can't face it yet."]] },
  { id: 'dn.to.14', when: { of: 'twisted-on' }, turns: [
    ['b', "Come here."], ['a', "I'm fine."], ['b', "You're not. Come here."]], beat: '{a} lets {b} hug {a.obj}, and finally cries.' },
  { id: 'dn.to.15', when: { of: 'twisted-on' }, stage: '{Where}, {a} keeps picking things up and putting them down.', turns: [
    ['b', "What are you doing?"], ['a', "I don't know. Something."], ['b', "Sit down. You don't have to do anything tonight."]] },
  // ── miss: c has just gone home ──
  { id: 'dn.ms.01', when: C3({ of: 'miss' }), stage: '{Where}, {a} keeps looking at the space where {c} used to sit.', turns: [
    ['a', "It's so quiet without {c}."], ['b', "I know. I keep expecting {c} to walk back in."],
    ['a', "Me too."], ['b', "You'll see {c} when you're out."], ['a', "It's not the same."],
    ['b', "No. But {c} would want you to stay and make the most of it."], ['a', "I know. I'm going to try."]],
    beat: '{b} gives {a} a hug.' },
  { id: 'dn.ms.02', when: C3({ of: 'miss' }), turns: [
    ['b', "How are you doing?"], ['a', "I keep looking round for {c}."], ['b', "That's normal. It's only been a few hours."],
    ['a', "{c} was the one I told everything to."], ['b', "Then tell me instead. I'm here."],
    ['a', "Thank you."]] },
  { id: 'dn.ms.03', when: C3({ of: 'miss' }), turns: [
    ['a', "I didn't even get to say goodbye properly."], ['b', "You had a long hug."],
    ['a', "It didn't feel like enough."], ['b', "It never does."]],
    beat: '{b} puts an arm round {a} and leaves it there.' },
  { id: 'dn.ms.04', when: C3({ of: 'miss' }), stage: '{Where}, {a} is holding a top {c} left behind.', turns: [
    ['b', "Are you keeping that?"], ['a', "{c} will want it back."], ['b', "{c} will want you to have it."],
    ['a', "It still smells like {c}."], ['b', "Keep it, then. Give it back on the outside."]] },
  // ── blame: c voted a's partner or friend out ──
  { id: 'dn.bl.01', when: C3({ of: 'blame' }), stage: "{Where}, and {a} isn't keeping quiet about it.", turns: [
    ['a', "{c} looked me in the eye this morning."], ['b', "I know."], ['a', "And then stood up at the fire pit and did that."],
    ['b', "It was a vote. Somebody had to go."], ['a', "It didn't have to be them."],
    ['b', "Are you going to say something to {c}?"], ['a', "Yes. Tomorrow."]],
    beat: '{b} nods, and hopes it waits until tomorrow.' },
  { id: 'dn.bl.02', when: C3({ of: 'blame' }), turns: [
    ['b', "Don't do anything tonight."], ['a', "Why not?"], ['b', "Because you're angry, and you'll say something you can't take back."],
    ['a', "Maybe I want to."], ['b', "Sleep on it."],
    ['a', "I'll sleep on it. I'll still be angry in the morning."], ['b', "Then talk to {c} in the morning."]] },
  { id: 'dn.bl.03', when: C3({ of: 'blame' }), turns: [
    ['a', "I thought {c} was my friend."], ['b', "Maybe {c} thought it was the right call."],
    ['a', "Whose side are you on?"], ['b', "Yours. I'm just saying there might be a reason."],
    ['a', "There is. {c} wanted them gone."], ['b', "Okay. That's fair."]] },
  // ── next: a thinks they are next ──
  { id: 'dn.nx.01', when: { of: 'next' }, stage: '{Where}, {a} is counting on {a.posAdj} fingers.', turns: [
    ['b', "What are you doing?"], ['a', "Working out who's next."], ['b', "And?"], ['a', "It's me. I'm sure it's me."],
    ['b', "You don't know that."], ['a', "I'm single, I'm not a favourite, and nobody's looking at me."],
    ['b', "Then change that. You've got a few days."]] },
  { id: 'dn.nx.02', when: { of: 'next' }, turns: [
    ['a', "Can I be honest? That scared me."], ['b', "It scared everyone."], ['a', "No, really. I could be next."],
    ['b', "Then let's make sure you're not."], ['a', "How?"], ['b', "Get out there tomorrow and talk to everyone."],
    ['a', "I'm not good at that."], ['b', "You're better at it than going home."]] },
  { id: 'dn.nx.03', when: { of: 'next' }, turns: [
    ['b', "You've gone quiet."], ['a', "I'm just thinking."], ['b', "About the vote?"],
    ['a', "About how fast it happens. One minute you're here, and then you're packing."],
    ['b', "You're not packing."], ['a', "Not tonight."], ['b', "Come here."]] },
  // ── eyeing: a's partner could not stop looking at the bombshell c ──
  { id: 'dn.ey.01', when: C3({ of: 'eyeing', taken: true }), stage: "{Where}, {a} can't let it go.", turns: [
    ['a', "Did you see how {pa} looked at {c}?"], ['b', "I saw."], ['a', "I'm not imagining it?"],
    ['b', "No. But it was only a look."], ['a', "It's never only a look in here."],
    ['b', "Then talk to {pa} before you decide what it was."], ['a', "And if I don't like the answer?"],
    ['b', "Then at least you'll know."]] },
  { id: 'dn.ey.02', when: C3({ of: 'eyeing', taken: true }), turns: [
    ['b', "Are you worried about {c}?"], ['a', "I'm worried about {pa}."], ['b', "What did {pa} say?"],
    ['a', "Nothing. That's what worries me."], ['b', "Saying nothing isn't always bad."],
    ['a', "It is in here."]], beat: "{b} doesn't know what to say to that." },
  { id: 'dn.ey.03', when: C3({ of: 'eyeing', taken: true }), turns: [
    ['a', "Be honest with me. Is {c} {pa}'s type?"], ['b', "…A bit."], ['a', "A bit?"],
    ['b', "Quite a lot. But {pa} chose you."], ['a', "{pa} chose me before {c} walked in."],
    ['b', "Then give {pa} a reason to keep choosing you."]] },
  // ── bomb-threat: the bombshell c has come in for a's partner ──
  { id: 'dn.bt.01', when: C3({ of: 'bomb-threat', taken: true }), turns: [
    ['a', "{c} has come in for {pa}. I can tell."], ['b', "You don't know that."],
    ['a', "Did you see where {c} sat? Right next to {pa}."], ['b', "Okay, I did see that."],
    ['a', "So what do I do?"], ['b', "Nothing yet. See what {pa} does."]] },
  { id: 'dn.bt.02', when: C3({ of: 'bomb-threat', taken: true }), stage: '{Where}, {a} has been pacing.', turns: [
    ['b', "Sit down, please."], ['a', "{c} asked {pa} for a chat within ten minutes."],
    ['b', "People chat."], ['a', "Not like that, they don't."], ['b', "Do you trust {pa}?"],
    ['a', "I trust {pa}. I don't trust {c}."], ['b', "Then keep trusting {pa}."]] },
  { id: 'dn.bt.03', when: C3({ of: 'bomb-threat', taken: true }), turns: [
    ['a', "I'm going to stay calm about this."], ['b', "Are you?"], ['a', "I'm going to try."],
    ['b', "What's the worst that happens?"], ['a', "{pa} goes off with {c}, and I'm left on my own."],
    ['b', "And the best?"], ['a', "{pa} tells {c} to leave it."], ['b', "Hold on to that one."]] },
  // ── bomb-fancy: a fancies the bombshell c ──
  { id: 'dn.bf.01', when: C3({ of: 'bomb-fancy', taken: true }), turns: [
    ['a', "Can I tell you something?"], ['b', "Is it about {c}?"], ['a', "…How did you know?"],
    ['b', "You haven't stopped looking since {c} walked in."], ['a', "Is it that obvious?"],
    ['b', "To everyone. Including your partner, probably."]], beat: '{a} goes very red.' },
  { id: 'dn.bf.02', when: C3({ of: 'bomb-fancy', taken: true }), stage: '{Where}, {a} keeps {a.posAdj} voice down.', turns: [
    ['a', "Don't tell {pa}, but {c} is exactly my type."], ['b', "I'm not going to tell anyone."],
    ['a', "I'm happy with {pa}. I am."], ['b', "But?"], ['a', "But I want to get to know {c}. Just to be sure."],
    ['b', "Be careful. That's how it starts."]] },
  { id: 'dn.bf.03', when: C3({ of: 'bomb-fancy', taken: false }), turns: [
    ['a', "Right. {c}. That's the one."], ['b', "You've spoken to {c} for about thirty seconds."],
    ['a', "It was a good thirty seconds."], ['b', "What are you going to do?"],
    ['a', "Get up early and be the first one to say good morning."], ['b', "Good plan."]] },
  // ── picked / meh: a recoupling night ──
  { id: 'dn.pk.01', when: { of: 'picked', taken: true }, turns: [
    ['b', "You looked so relieved when {pa} said your name."], ['a', "I was. I've been worried for days."],
    ['b', "About what?"], ['a', "That {pa} would pick someone else."], ['b', "And now?"],
    ['a', "Now I can finally relax."]], beat: '{a} smiles properly for the first time all day.' },
  { id: 'dn.pk.02', when: { of: 'picked', taken: true }, stage: "{Where}, {a} can't stop grinning.", turns: [
    ['b', "Go on. Say it."], ['a', "Say what?"], ['b', "That you're happy."], ['a', "I'm happy."],
    ['b', "With {pa}."], ['a', "With {pa}. Really happy."], ['b', "Good. You deserve it."]] },
  { id: 'dn.pk.03', when: { of: 'picked', taken: true }, turns: [
    ['a', "I think this is it with {pa}."], ['b', "As in, really it?"], ['a', "I don't want to jinx it."],
    ['b', "You won't. I've seen how {pa} looks at you."], ['a', "How?"], ['b', "Like nobody else is here."]] },
  { id: 'dn.mh.01', when: { of: 'meh', taken: true }, turns: [
    ['b', "You don't look very happy with {pa}."], ['a', "It's fine."], ['b', "Fine?"],
    ['a', "{pa} is lovely. I just don't feel much."], ['b', "Then why did you go along with it?"],
    ['a', "Because it was that or go home."]], beat: "{b} nods, and doesn't say anything else." },
  { id: 'dn.mh.02', when: { of: 'meh', taken: true }, stage: '{Where}, {a} is picking at a nail.', turns: [
    ['a', "Can I tell you something, and you won't tell {pa}?"], ['b', "Of course."],
    ['a', "I'm not feeling it. I haven't been for days."], ['b', "Have you told {pa}?"],
    ['a', "How do you tell someone that?"], ['b', "Kindly. And soon."]] },
  { id: 'dn.mh.03', when: { of: 'meh', taken: true }, turns: [
    ['b', "Out of ten. You and {pa}."], ['a', "Honestly? A five."], ['b', "A five?"],
    ['a', "It was a six last week."], ['b', "So it's getting worse."], ['a', "I know."]] },
];

// Gossip that carries a debrief: [a, b, c] — a heard it, b is c's partner, c said it.
export const HEARD = [
  { id: 'gs.hd.01', when: { knows: true, heard: true }, turns: [['a', "I don't want to cause trouble, but I heard what {c} said about you last night."], ['b', "What did {c} say?"], ['a', "That {c} isn't really feeling it."]], beat: '{b} stares at {a}, and then across the lawn at {c}.' },
  { id: 'gs.hd.02', when: { knows: true, heard: true }, turns: [['a', "Can I tell you something? It's about {c}."], ['b', "Go on."], ['a', "{c} was talking about you in the debrief. It wasn't nice."], ['b', "Not nice how?"], ['a', "Not sure about you. Not sure at all."]] },
  { id: 'gs.hd.03', when: { knows: true, heard: true }, turns: [['a', "I feel awful telling you this."], ['b', "Then why are you?"], ['a', "Because I'd want to know. {c} said {c} has got eyes for someone else."], ['b', "Who?"]], beat: "{a} won't say." },
  { id: 'gs.hd.04', when: { knows: true, heard: true }, turns: [['a', "You know what {c} said on the terrace?"], ['b', "Nothing good, by your face."], ['a', "That it's a five with you. Maybe less."]], beat: '{b} laughs, and then stops.' },
  { id: 'gs.hd.05', when: { knows: true, heard: true }, turns: [['a', "I was there when {c} said it. I'm not making it up."], ['b', "Said what?"], ['a', "That {c} would go for someone else if {c} could."], ['b', "{c} said that? To you?"], ['a', "To all of us."]] },
];

const K = (kind, more = {}) => ({ kind, ...more });
export const DEBRIEF_HUT = {
  honest: [
    { id: 'hut.dn.h1', when: K('debrief', { of: 'robbed', role: 0 }), turns: [['a', "Tonight hurt. I'm not going to pretend it didn't."]] },
    { id: 'hut.dn.h2', when: K('debrief', { of: 'stole', role: 0 }), turns: [['a', "I know half the villa hates me right now. I'd still do it again."]] },
    { id: 'hut.dn.h3', when: K('debrief', { of: 'twisted-on', role: 0 }), turns: [['a', "I stuck. I'd stick again. That's who I am, and I'm proud of it."]] },
    { id: 'hut.dn.h4', when: K('debrief', { of: 'miss', role: 0 }), turns: [['a', "The villa feels smaller tonight. I miss {c} already."]] },
    { id: 'hut.dn.h5', when: K('debrief', { of: 'blame', role: 0 }), turns: [['a', "I'm going to have a word with {c} tomorrow. I'm not letting it go."]] },
    { id: 'hut.dn.h6', when: K('debrief', { of: 'next', role: 0 }), turns: [['a', "Every dumping, I think it's going to be me. I need to do more to stay."]] },
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
