// pm/lines/journey.js — the narrator over each chapter of a finalist couple's
// film (pm/journey.js). Data only. The date, the film's open and end, and
// the two of them watching are pm/talk/journey.js.
//   journey-clip  [a, b, (c)]  one chapter. `of`: night-one · met · date-met · coupled ·
//                 first-kiss · date · row · tested · casa · photos · split · back · at-risk ·
//                 love · challenge · enemies · friends · crush · fought · found · second.
//                 {day} the day it happened; {quote}/{quoteWho} a line from it (`hasQuote`);
//                 {about} (c) the third person in it, for tested.
// Every chapter is something that happened and aired: these lines narrate it
// and never add to it.
export const JOURNEY_LINES = {
  'journey-clip': [
    { id: "jc.n1", when: { of: "night-one", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. The very first night. Nobody knew anybody, and everybody was pretending they did."]] },
    { id: "jc.n2", when: { of: "night-one" }, stage: "The footage: night one, the fire pit, and two strangers.", turns: [["narrator", "It started on day {day}, before either of them had even worked out where the bathroom was."]] },
    { id: "jc.n3", when: { of: "night-one", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Night one. {a} and {b}. Nobody watching would have put money on it."]] },
    { id: "jc.m1", when: { of: "met", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. The first time {a} and {b} really spoke. Neither of them remembers what about."]] },
    { id: "jc.m2", when: { of: "met" }, stage: "The footage: {a} and {b}, still strangers.", turns: [["narrator", "It began, like most things in the villa, with a chat. Day {day}. It was not, by anyone's standards, a long chat."]] },
    { id: "jc.m3", when: { of: "met", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. They didn't know it yet. Everyone else had a fair idea."]] },
    { id: "jc.dm1", when: { of: "date-met", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. A new arrival, a date, and an awful lot of nervous laughing."]] },
    { id: "jc.dm2", when: { of: "date-met" }, stage: "The footage: their very first date.", turns: [["narrator", "It began on a date, on day {day}, with a great deal of nervous laughing on both sides."]] },
    { id: "jc.c1", when: { of: "coupled", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}, at the fire pit. The moment they became a couple. Officially, anyway."]] },
    { id: "jc.c2", when: { of: "coupled" }, stage: "The footage: the fire pit, and a name read out.", turns: [["narrator", "On day {day}, they coupled up. Officially, if not yet seriously. That came later."]] },
    { id: "jc.c3", when: { of: "coupled", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. A choice at the fire pit, and two people trying very hard not to grin."]] },
    { id: "jc.k1", when: { of: "first-kiss", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. The first kiss. Everybody nearby is very busy looking at something else."]] },
    { id: "jc.k2", when: { of: "first-kiss" }, stage: "The footage: {a} and {b}, and their first kiss.", turns: [["narrator", "Day {day}. The first kiss. It took them long enough. The whole villa had been waiting."]] },
    { id: "jc.k3", when: { of: "first-kiss", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "And then, on day {day}, it finally happened. Several islanders would like it noted that they called it."]] },
    { id: "jc.d1", when: { of: "date", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. A date, just the two of them, and nobody to interrupt."]] },
    { id: "jc.d2", when: { of: "date" }, stage: "The footage: the two of them, alone at last.", turns: [["narrator", "Day {day}. Some time away from everyone else. They spent most of it talking about everyone else."]] },
    { id: "jc.r1", when: { of: "row", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "It wasn't all sunshine. Day {day}. It was, for about an hour, quite a lot of thunder."]] },
    { id: "jc.r2", when: { of: "row" }, stage: "The footage: raised voices, and the two of them on opposite sides of the garden.", turns: [["narrator", "Day {day}. Their first real argument, and the whole villa suddenly needed to be somewhere else."]] },
    { id: "jc.r3", when: { of: "row", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. Things got heated, and not in the way the villa usually means."]] },
    { id: "jc.t1", when: { of: "tested" }, stage: "The footage: {about}, and a conversation somebody was not happy about.", turns: [["narrator", "Day {day}. Then {about} got involved, and things got complicated."]] },
    { id: "jc.t2", when: { of: "tested", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. A test, with {about} right in the middle of it."]] },
    { id: "jc.t3", when: { of: "tested", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. Not everybody in the villa kept their eyes to themselves."]] },
    { id: "jc.ca1", when: { of: "casa" }, stage: "The footage: the Casa Amor recoupling, and the gate opening.", turns: [["narrator", "Day {day}. Casa Amor. The biggest test of the summer, and nobody revised."]] },
    { id: "jc.ca2", when: { of: "casa", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. The moment everyone had been waiting for, and some had been dreading."]] },
    { id: "jc.p1", when: { of: "photos" }, stage: "The footage: a photo, held up at the fire pit.", turns: [["narrator", "Day {day}. The photos from Casa. Never has a piece of paper caused so much trouble."]] },
    { id: "jc.p2", when: { of: "photos", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. The photo nobody wanted to see, and everybody did."]] },
    { id: "jc.s1", when: { of: "split", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. It looked, to everyone including them, like it was over."]] },
    { id: "jc.s2", when: { of: "split" }, stage: "The footage: the two of them, apart.", turns: [["narrator", "On day {day}, they called it a day. For a while."]] },
    { id: "jc.b1", when: { of: "back", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "But on day {day}, they found their way back. Slowly, and then all at once."]] },
    { id: "jc.b2", when: { of: "back" }, stage: "The footage: the two of them, together again.", turns: [["narrator", "Day {day}. Second chances. The villa had opinions. They didn't listen."]] },
    { id: "jc.ar1", when: { of: "at-risk" }, stage: "The footage: the fire pit, and two names read out.", turns: [["narrator", "Day {day}. At risk, at the fire pit, holding hands hard enough to hurt."]] },
    { id: "jc.ar2", when: { of: "at-risk", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. The night they very nearly went home."]] },
    { id: "jc.l1", when: { of: "love", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. The big one. Three words, and a very long pause before the answer."]] },
    { id: "jc.l2", when: { of: "love" }, stage: "The footage: the two of them, somewhere quiet.", turns: [["narrator", "Day {day}. The words everybody had been waiting for, said somewhere quiet, for once."]] },
    { id: "jc.l3", when: { of: "love", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "And on day {day}, somebody finally said it out loud."]] },
    { id: "jc.ch1", when: { of: "challenge", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. Not every moment was romantic. Some of them were a challenge, in every sense."]] },
    { id: "jc.ch2", when: { of: "challenge" }, stage: "The footage: a challenge, and the two of them in the middle of it.", turns: [["narrator", "Day {day}. Challenge day. Dignity, as ever, was the first casualty."]] },
    { id: "jc.en1", when: { of: "enemies", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. Before any of it, they could barely stand to be on the same lawn."]] },
    { id: "jc.en2", when: { of: "enemies" }, stage: "The footage: the two of them, face to face, and nobody backing down.", turns: [["narrator", "Day {day}. Not the start anyone would choose for a love story. It's the one they got."]] },
    { id: "jc.en3", when: { of: "enemies", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. If you'd said then they'd end up together, they'd both have walked out."]] },
    { id: "jc.fr1", when: { of: "friends", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. Just friends. That's what they said. That's what everybody says."]] },
    { id: "jc.fr2", when: { of: "friends" }, stage: "The footage: the two of them laughing together, weeks before anything happened.", turns: [["narrator", "Day {day}. Before anything else, they were friends. Very close friends. Suspiciously close."]] },
    { id: "jc.fr3", when: { of: "friends", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. The villa could see it long before they could."]] },
    { id: "jc.cr1", when: { of: "crush", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. One of them already knew. The other one had absolutely no idea."]] },
    { id: "jc.cr2", when: { of: "crush" }, stage: "The footage: one of them trying, the other not quite there yet.", turns: [["narrator", "Day {day}. It wasn't mutual. Not yet. Somebody was going to have to be patient."]] },
    { id: "jc.cr3", when: { of: "crush", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. It took one of them a while to catch up. They got there."]] },
    { id: "jc.fo1", when: { of: "fought", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. Two people wanted the same person. Only one of them got picked."]] },
    { id: "jc.fo2", when: { of: "fought" }, stage: "The footage: the recoupling, and a choice between two.", turns: [["narrator", "Day {day}. The recoupling where it was decided, and somebody was left standing."]] },
    { id: "jc.fd1", when: { of: "found", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. After all the nights left on the bench, somebody finally chose."]] },
    { id: "jc.fd2", when: { of: "found" }, stage: "The footage: the moment it finally happened.", turns: [["narrator", "Day {day}. Not anyone's first choice. Until, suddenly, they were."]] },
    { id: "jc.sc1", when: { of: "second", hasQuote: true }, stage: "{quoteWho}: \"{quote}\"", turns: [["narrator", "Day {day}. They'd done this before, and it hadn't worked. They decided to try again anyway."]] },
    { id: "jc.sc2", when: { of: "second" }, stage: "The footage: two exes, and a second chance.", turns: [["narrator", "Day {day}. Round two. The villa was not sure. They were."]] },
  ],
};
