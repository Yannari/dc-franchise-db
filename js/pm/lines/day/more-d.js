// pm/lines/day/more-d.js — the pools a season ran dry of. Data only.
//
// Read in season 41 (26 islanders): the same line twice in one episode, 36
// times, every one of them a pool with fewer entries than the scenes it
// plays — Heart Rate gives every islander a scene, the families and the notes
// every couple, night one every arrival, a making-up chat every row. Each
// entry here keeps its pool's cast and facts (see the pools' own headers).

export const MORE_D = {
  // heart-rate [a, b]: a's monitor spikes for b. coupled: b is a's partner;
  // taken: a is coupled and b is not the partner ({pa}).
  'heart-rate': [
    { id: 'hr3.01', when: { coupled: true }, stage: "{a}'s number climbs and climbs while {b} dances.", turns: [['a', "Sorry, have you seen {b}?"]], beat: '{b} takes a bow.' },
    { id: 'hr3.02', when: { coupled: true }, stage: "The screen shows {a}'s highest reading of the afternoon, and it's for {b}.", turns: [['b', "Good. I'd have been worried."], ['a', "You'd have been more than worried."]] },
    { id: 'hr3.03', when: { coupled: true }, stage: "{b} does one little spin, and {a}'s monitor goes straight up.", turns: [['a', "One spin. That's all it took."]] },
    { id: 'hr3.04', when: { coupled: true }, stage: "{a}'s reading for {b} is the highest in the villa.", turns: [['a', "Put that on a T-shirt."], ['b', "I'm going to frame it."]] },
    { id: 'hr3.05', when: { coupled: true }, stage: "Everyone waits to see who {a}'s heart goes for. It's {b}.", turns: [['a', "Were you worried?"], ['b', "A bit, if I'm honest."]] },
    { id: 'hr3.06', when: { coupled: false, taken: true }, stage: "{a}'s monitor goes higher for {b} than it did for {pa}.", turns: [['a', "I was nervous. It was nerves."]], beat: "{pa} doesn't say a word for the rest of the challenge." },
    { id: 'hr3.07', when: { coupled: false, taken: true }, stage: "The whole villa turns to look at {pa} as {a}'s reading for {b} comes up.", turns: [['a', "Can everyone stop looking at {pa} like that?"]], beat: '{pa} folds {pa.posAdj} arms.' },
    { id: 'hr3.08', when: { coupled: false, taken: true }, stage: "{a}'s heart rate jumps for {b}, and {b} looks just as surprised.", turns: [['a', "That's not what it looks like."]], beat: 'It is exactly what it looks like.' },
    { id: 'hr3.12', when: { coupled: false, taken: true }, stage: "{a}'s number climbs for {b}, and keeps climbing. {pa} watches it happen.", turns: [['a', "I think it's broken."]], beat: '{pa} stares at the screen and says nothing.' },
    { id: 'hr3.13', when: { coupled: false, taken: true }, stage: "The screen puts {b}'s name next to {a}'s highest reading.", turns: [['a', "Okay, I can explain that."]], beat: "{pa} waits. {a} doesn't explain it." },
    { id: 'hr3.14', when: { coupled: false, taken: true }, stage: "{a}'s monitor barely moves for {pa}, and jumps for {b}.", turns: [['a', "I'm just really comfortable with you. That's a good thing!"]], beat: '{pa} is not sure it is.' },
    { id: 'hr3.15', when: { coupled: false, taken: true }, stage: "Everyone is watching {pa} when {a}'s reading for {b} comes up.", turns: [['a', "Nobody say anything."]], beat: 'Nobody has to.' },
    { id: 'hr3.16', when: { coupled: false, taken: true }, stage: "{b} walks past {a}, and {a}'s heart rate doubles.", turns: [['a', "I'd had a lot of coffee."]], beat: 'Nobody believes that, least of all {pa}.' },
    { id: 'hr3.09', when: { coupled: false, taken: false }, stage: "{a}'s monitor makes the decision for {a}: it's {b}.", turns: [['a', "Well. I suppose that's settled, then."]] },
    { id: 'hr3.10', when: { coupled: false, taken: false }, stage: '{a} was trying to play it cool. The screen says {b}.', turns: [['a', "So much for playing it cool."]] },
    { id: 'hr3.11', when: { coupled: false, taken: false }, stage: "{b} walks over to {a}, and the reading climbs with every step.", turns: [['b', "Is that me?"], ['a', "Don't."]] },
  ],
  // families [a, b]: a's family meet b, a's partner. verdict: good · bad · unsure.
  families: [
    { id: 'fm2.01', when: { verdict: 'good' }, stage: "{a}'s family watch {a} and {b} together for five minutes and start planning a wedding.", turns: [['a', "Please ignore them."], ['b', "No, I'm loving this."]] },
    { id: 'fm2.02', when: { verdict: 'good' }, stage: "{a}'s mother hugs {b} for longer than anyone.", turns: [['b', "I think your {~mum} likes me."], ['a', "My {~mum} loves you. I'm a bit jealous."]] },
    { id: 'fm2.03', when: { verdict: 'good' }, stage: "{a}'s family take {b} aside, and come back smiling.", turns: [['a', "What did they say?"], ['b', "That I have to look after you."]] },
    { id: 'fm2.04', when: { verdict: 'bad' }, stage: "{a}'s family have watched every episode. It shows.", turns: [['a', "They want me to be careful."], ['b', "Careful of me?"], ['a', "Careful, full stop."]] },
    { id: 'fm2.05', when: { verdict: 'bad' }, stage: "{a}'s dad shakes {b}'s hand and doesn't smile.", turns: [['b', "Well, that was terrifying."], ['a', "He's like that with everyone. Mostly."]] },
    { id: 'fm2.06', when: { verdict: 'bad' }, stage: "{a}'s family ask {b} a lot of questions, and don't seem to like the answers.", turns: [['b', "I don't think I passed."], ['a', "It's not a test."], ['b', "It felt like one."]] },
    { id: 'fm2.07', when: { verdict: 'unsure' }, stage: "{a}'s family are friendly with {b}, but careful.", turns: [['b', "Did I do okay?"], ['a', "You did fine. They just want to get to know you."]] },
    { id: 'fm2.08', when: { verdict: 'unsure' }, stage: "{a}'s family spend the whole visit asking {a} questions, and hardly any of {b}.", turns: [['b', "They barely spoke to me."], ['a', "They'll get there."]] },
    { id: 'fm2.09', when: { verdict: 'unsure' }, stage: "One of {a}'s family gives {b} a long look across the terrace.", turns: [['b', "What was that look?"], ['a', "That's just how they look. I think."]] },
    { id: 'fm2.10', when: { verdict: 'good' }, stage: "{a}'s family bring a photo album, and {b} is delighted.", turns: [['a', "Please put that away."], ['b', "Absolutely not. Look at your little face."]] },
    { id: 'fm2.11', when: { verdict: 'good' }, turns: [['b', "Your family are lovely."], ['a', "They said the same about you. Word for word."]], beat: '{a} is grinning.' },
    { id: 'fm2.12', when: { verdict: 'good' }, stage: "{a}'s family have one question for {b}, and it is about the wedding.", turns: [['b', "We haven't even left the villa yet."], ['a', "That's never stopped them."]] },
    { id: 'fm2.13', when: { verdict: 'good' }, stage: "By the end of the visit, {a}'s family are calling {b} by a nickname.", turns: [['a', "They don't do that with anyone."], ['b', "I'll take it."]] },
    { id: 'fm2.14', when: { verdict: 'good' }, turns: [['a', "I've never seen them like that with anyone I've brought home."], ['b', "I'm not just anyone."], ['a', "No. You're not."]] },
    { id: 'fm2.15', when: { verdict: 'bad' }, turns: [['b', "They hate me."], ['a', "They don't hate you. They just don't know you yet."], ['b', "That sounds worse."]] },
    { id: 'fm2.16', when: { verdict: 'bad' }, stage: "{a}'s family keep bringing up something {b} said on the show.", turns: [['b', "I knew that would come back."], ['a', "They'll get over it. Eventually."]] },
    { id: 'fm2.17', when: { verdict: 'unsure' }, turns: [['a', "I think they liked you. I think."], ['b', "That's two 'I thinks'."]] },
    { id: 'fm2.18', when: { verdict: 'unsure' }, stage: "{a}'s family are warm with {b}, and quiet about the future.", turns: [['b', "They didn't say much."], ['a', "They never do. It's a good sign. Probably."]] },
  ],
  // notes [a, b]: a wrote an anonymous note about b. guessed: whether b knows it was a.
  notes: [
    { id: 'nt3.01', when: { guessed: false }, stage: "A note is read out saying {b} is scared of being on {b.posAdj} own.", turns: [['b', "That's not fair. That's not even true."]], beat: '{a} studies the floor.' },
    { id: 'nt3.02', when: { guessed: false }, stage: "The note about {b} says {b} can't make up {b.posAdj} mind about anyone.", turns: [['b', "That's rich. Who wrote that?"]], beat: 'Nobody owns up, and {a} least of all.' },
    { id: 'nt3.03', when: { guessed: false }, stage: 'The note says {b} is still thinking about someone else.', turns: [['b', "Whoever wrote that doesn't know me at all."]], beat: '{a} keeps very quiet.' },
    { id: 'nt3.04', when: { guessed: false }, stage: 'The note is short. It says {b} needs to grow up.', turns: [['b', "Grow up? I'm the only adult in this villa."]] },
    { id: 'nt3.05', when: { guessed: true }, stage: 'A note says {b} is only in it to win.', turns: [['b', "{a}. That has your name all over it."], ['a', "Prove it."]] },
    { id: 'nt3.06', when: { guessed: true }, stage: 'The note about {b} is read out, and {b} turns straight round to {a}.', turns: [['b', "Really?"], ['a', "It wasn't me."]], beat: 'It was.' },
  ],
  // first-arrival [a, b] of 'arrive': a walks in; b is already there.
  'first-arrival': [
    { id: 'fa2.01', when: { of: 'arrive', cast: 2 }, stage: '{a} walks into the villa, and {b} jumps up off the daybed.', turns: [['b', "Another one! Come here."], ['a', "Hi! I'm {a}."]] },
    { id: 'fa2.02', when: { of: 'arrive', cast: 2 }, stage: '{a} comes down the steps, and {b} gives a little wave.', turns: [['a', "Is it always this hot?"], ['b', "I've been here an hour, so I've got no idea."]] },
    { id: 'fa2.03', when: { of: 'arrive', cast: 2 }, stage: '{a} walks in, and {b} is the first one over.', turns: [['b', "I love your outfit."], ['a', "Thank you! I changed three times."]] },
    { id: 'fa2.04', when: { of: 'arrive', cast: 2 }, stage: '{a} arrives with a suitcase in each hand, and {b} goes to help.', turns: [['a', "I packed for a year."], ['b', "You might need it."]] },
    { id: 'fa2.05', when: { of: 'arrive', cast: 2 }, stage: '{a} stops at the bottom of the steps to take it all in. {b} laughs.', turns: [['b', "I did exactly the same thing."], ['a', "It's so much bigger than it looks on TV."]] },
  ],
  // recouple-pick [a, b] justMet: one of them walked in today (season 41: Dan,
  // a bombshell of a few hours, picked Keisha with "We've had our ups and
  // downs, but I've never doubted how I feel"). bTaken: b is with {pb}.
  'recouple-pick': [
    { id: 'rpj.01', when: { justMet: true }, turns: [['a', "We've only just met, but I want to see where this goes. {b}."]] },
    { id: 'rpj.02', when: { justMet: true }, turns: [['a', "It's early, I know. But there's something there. {b}."]] },
    { id: 'rpj.03', when: { justMet: true }, turns: [['a', "One conversation, and I'm already curious. {b}, I'm picking you."]] },
    { id: 'rpj.04', when: { justMet: true }, turns: [['a', "I don't know you very well yet. I'd like to. {b}."]] },
    { id: 'rpj.05', when: { justMet: true }, stage: "{a} doesn't take long.", turns: [['a', "{b}. Let's get to know each other properly."]] },
    { id: 'rpj.06', when: { justMet: true, bTaken: true }, turns: [['a', "I know you're with {pb}. I'm picking you anyway, {b}."]], beat: '{pb} stares at the floor.' },
    { id: 'rpj.07', when: { justMet: true, bTaken: true }, turns: [['a', "Sorry, {pb}. I came in here for {b}, and I'm not going to pretend I didn't."]] },
  ],
  // ex-ballot [a, b]: a dumped islander, back for the semi-final, votes against
  // b's couple (season 41: eight exes, and two of them said the same line).
  'ex-ballot': [
    { id: 'exb2.01', turns: [['a', "I'll keep it short. {b}'s couple."]], beat: '{b} closes {b.posAdj} eyes.' },
    { id: 'exb2.02', turns: [['a', "I thought about this all the way here. I'm voting for {b}'s couple to go."]] },
    { id: 'exb2.03', turns: [['a', "In here it's hard to see. Out there it's obvious. {b}'s couple."]] },
    { id: 'exb2.04', turns: [['a', "Nothing personal, {b}. I just don't see it lasting."]] },
    { id: 'exb2.05', stage: '{a} takes a long breath before saying the name.', turns: [['a', "{b}. Sorry."]] },
    { id: 'exb2.06', turns: [['a', "I've got nothing against {b}. But I've got to be honest, and that's who I'm voting for."]] },
  ],
  // deep-chat [a, b] rowedToday: making up after today's row.
  'deep-chat': [
    { id: 'dc.up3', when: { rowedToday: true }, turns: [['a', "I didn't like how today went."], ['b', "Neither did I."], ['a', "Can we start again?"], ['b', "Yes. Please."]] },
    { id: 'dc.up4', when: { rowedToday: true }, turns: [['a', "I've been thinking about what I said earlier."], ['b', "And?"], ['a', "And I shouldn't have said it like that."], ['b', "Thank you."]] },
    { id: 'dc.up5', when: { rowedToday: true }, turns: [['b', "Are we okay?"], ['a', "We're okay. I hate falling out with you."], ['b', "Me too."]] },
    { id: 'dc.up6', when: { rowedToday: true }, stage: '{a} finds {b} on the terrace, after the row.', turns: [['a', "I'm sorry I snapped."], ['b', "I'm sorry I pushed."]], beat: 'They sit together for a while without saying anything.' },
    { id: 'dc.up7', when: { rowedToday: true }, turns: [['a', "Can I have a cuddle, or are we still arguing?"], ['b', "We can do both."]] },
  ],
  // dump-buildup [a, b], channel public: one of the couples the public put at risk.
  'dump-buildup': [
    { id: 'db2.01', when: { channel: 'public' }, turns: [['dior', "Islanders, the votes are in. {a} and {b}, you're one of the couples with the fewest votes."]] },
    { id: 'db2.02', when: { channel: 'public' }, stage: 'The host looks along the benches before she says the names.', turns: [['dior', "{a}. {b}. The public didn't vote for you enough tonight."]], beat: '{a} reaches for {b.posAdj} hand.' },
    { id: 'db2.03', when: { channel: 'public' }, turns: [['dior', "{a} and {b}, could you please stand up?"]], beat: 'They stand together at the front of the fire pit.' },
  ],
  // debrief [a, b, c] of 'twisted-on': a stuck at Casa, and c came back with someone new.
  debrief: [
    { id: 'dn.to.04', when: { cast: 3, of: 'twisted-on' }, turns: [['b', "Do you want to talk about it?"], ['a', "Not really. Yes. I don't know."], ['b', "Take your time."], ['a', "I really thought {c} would stick."]] },
    { id: 'dn.to.05', when: { cast: 3, of: 'twisted-on' }, turns: [['a', "Everyone keeps asking me if I'm okay."], ['b', "Are you?"], ['a', "No. But I will be."]] },
  ],
};
