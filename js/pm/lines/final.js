// pm/lines/final.js — the host at the final and the reunion (pm/moments.js). Data only.
//   final-recoupling [a, b]      the last recoupling before the final
//   final-open       []          the final opens. `of`: envelope · plain
//   final-two        [a, b, c, d] the last two couples, a & b and c & d, in an order that gives nothing away
//   final-drum       []          the host holds the name
//   final-winners    [a, b, …]   the winners
//   final-result     [a, b]      a couple's place. `of`: first · second · third · fourth
//   reunion-open     []          the reunion opens
//   reunion-winners  [a, b]      the winners, on the sofa
//   reunion-close    []          the reunion ends
//   reveal           [a, b, (c)] the reunion airs what nobody saw; {exchange} is the clip's own words
export const FINAL_LINES = {
  'final-recoupling': [
    { id: "final-recoupling.01", stage: "A text arrives at the fire pit, and {a} reads it out.", turns: [["a", "Islanders, tonight is the final recoupling. Anyone left single at the end of it will be dumped from the island. #LastChance"], ["b", "Final? As in, the last one ever?"]], beat: "Nobody on the benches says anything for a moment." },
    { id: "final-recoupling.02", turns: [["dior", "Islanders, tonight is the final recoupling. Whoever you're coupled with tonight is who you'll stay with until the end."], ["dior", "And anyone who is not picked will be dumped from the island."]], beat: "{a} and {b} look at each other." },
    { id: "final-recoupling.03", stage: "The islanders walk down to the fire pit for the last recoupling of the summer.", turns: [["a", "This is it. After tonight, whoever we're with is who we go to the end with."], ["b", "No pressure, then."]] },
  ],
  'final-open': [
    { id: "fo.1", stage: "The final couples stand at the fire pit, hand in hand, for the last time.", turns: [["dior", "Islanders, this is it. The final."], ["dior", "The public have been voting for the couple they want to crown their Perfect Match. I have the results here, and I'll read them out from the bottom."]], beat: "Somebody on the end is shaking." },
    { id: "fo.2", stage: "The villa is lit up for the last night. The couples stand in a line, holding on to each other.", turns: [["dior", "Good evening, and welcome to the final."], ["dior", "Over the last few days, the public have been deciding who wins. Only one couple can take the title."]] },
    { id: "fo.e", when: { of: "envelope" }, stage: "The final couples stand at the fire pit, hand in hand.", turns: [["dior", "Islanders, the public have voted, and tonight one couple will be crowned the winners."], ["dior", "And the winners will face one last decision, in an envelope."]], beat: "Every couple squeezes hands a little tighter." },
  ],
  'final-two': [
    { id: "ft.1", turns: [["dior", "Which leaves two couples."], ["dior", "{a} and {b}. {c} and {d}."], ["dior", "{a}, what would it mean to win this?"], ["a", "Everything. But I've already got what I came in for."], ["dior", "{c}?"], ["c", "Whatever happens tonight, I'm leaving with {d}."]], beat: "The two couples look at each other along the line." },
    { id: "ft.2", stage: "Only two couples are left standing at the front of the fire pit.", turns: [["dior", "Two couples left. In a moment, one of you will be crowned the winners."], ["dior", "{b}, how are you feeling?"], ["b", "Sick. Honestly, I feel sick."], ["dior", "{c}?"], ["c", "I just want to know. I can't take the waiting."]], beat: "{a} has not let go of {b.posAdj} hand." },
    { id: "ft.3", turns: [["dior", "{a} and {b}. {c} and {d}. You've come a long way to be standing here."], ["a", "Whatever happens, well done, you two."], ["c", "You too. You deserve it as much as we do."]], beat: "The two couples hug across the gap, then step back into line." },
    { id: "ft.4", turns: [["narrator", "Two couples. All those recouplings and dumpings, and it comes down to this."], ["dior", "{b}, {c}, is there anything you want to say before I read it?"], ["b", "Just thank you to everyone who voted for us."], ["c", "Same. Thank you, everyone."]] },
  ],
  'final-drum': [
    { id: "fd.1", stage: "The host opens the card and takes a long look at it.", turns: [["dior", "I'm going to read out the couple in second place. The other couple will be your winners."], ["narrator", "Nobody at the fire pit is breathing."]] },
    { id: "fd.2", stage: "The music drops away. The host looks from one couple to the other.", turns: [["dior", "I'm going to read out your runners-up first. Which means the other couple are your winners."]], beat: "Both couples grip each other a little tighter." },
    { id: "fd.3", turns: [["dior", "The public have voted."], ["dior", "And the couple in second place are…"]], beat: "A long, long pause." },
  ],
  'final-winners': [
    { id: "fw.en", when: { of: "enemies" }, stage: "Confetti comes down over the fire pit.", turns: [["narrator", "At the start, these two could not stand each other. Tonight, the country picked them over everyone."], ["a", "If you'd told me this in the first week, I'd have laughed."], ["b", "So would I. I'm glad I was wrong about you."], ["dior", "Congratulations, you two. You're this year's Perfect Match."]], beat: "{c} and {d} are the first ones over to hug them." },
    { id: "fw.sc", when: { of: "second-chance" }, stage: "Confetti comes down over the fire pit.", turns: [["narrator", "They were given a second chance, and they took it."], ["a", "We nearly lost this."], ["b", "We didn't, though. We're here."], ["dior", "Congratulations, {a} and {b}. You're this year's Perfect Match."]], beat: "{c} hugs them both, and {d} joins in." },
    { id: "fw.ud", when: { of: "underdog" }, stage: "The rest of the villa piles in from every side.", turns: [["narrator", "For a long time, nobody gave these two a chance. The public did."], ["a", "Nobody thought we'd get here."], ["b", "We did, though."], ["c", "Come here, you two. You deserve this."]], beat: "The whole fire pit is on its feet." },
    { id: "fw.wb", when: { of: "way-back" }, stage: "Confetti comes down over the fire pit.", turns: [["narrator", "They broke up in this villa, and found their way back to each other. Now they've won it."], ["b", "I'm so glad we found our way back."], ["a", "So am I. I'm never letting that happen again."], ["dior", "Congratulations. You're this year's Perfect Match."]] },
    { id: "fw.ff", when: { of: "fought-for" }, stage: "Everyone is on their feet, and the music comes up.", turns: [["narrator", "Somebody tried to come between them, and they held on. Tonight, it paid off."], ["a", "I'd go through all of it again for you."], ["b", "You won't have to."], ["c", "Well done, both of you. Honestly."]], beat: "{c} and {d} hug them, and the other couples pile in." },
    { id: "fw.fh", when: { of: "fell-harder" }, stage: "Confetti comes down over the fire pit.", turns: [["narrator", "One of them fell first. The other one fell harder. And the public fell for both of them."], ["b", "I got there in the end."], ["a", "You did. And look where it got us."], ["dior", "Congratulations, you two. You're this year's Perfect Match."]] },
    { id: "fw.rk", when: { of: "rocky" }, stage: "Confetti is still coming down when the others reach them.", turns: [["narrator", "It was never easy for these two. They argued, they made up, and they never gave up on each other."], ["a", "We had some bad days in here."], ["b", "And we got through every one of them."], ["dior", "Congratulations. You're this year's Perfect Match."]], beat: "{c} and {d} are the first ones over." },
    { id: "fw.sv", when: { of: "survivors" }, stage: "Confetti comes down over the fire pit.", turns: [["narrator", "They were at risk more than once. They survived every time, and now they've won."], ["a", "We were nearly dumped. More than once."], ["b", "And now look at us."], ["c", "You earned it. Well done."]] },
    { id: "fw.hd", when: { of: "held" }, stage: "The others run to the front of the fire pit all at once.", turns: [["narrator", "Casa Amor tested them, and they both stayed loyal. Tonight, that paid off."], ["a", "I never doubted you. Not once."], ["b", "I never doubted you either."], ["dior", "Congratulations, {a} and {b}. You're this year's Perfect Match."]], beat: "{c} and {d} come over and hug them both." },
    { id: "fw.cm", when: { of: "casa-made" }, stage: "Confetti comes down over the fire pit.", turns: [["narrator", "They met halfway through, when Casa Amor turned the villa upside down. Now they've won the whole thing."], ["a", "Halfway through, and we still won it."], ["b", "I'd do every day of it again."], ["dior", "Congratulations. You're this year's Perfect Match."]] },
    { id: "fw.lt", when: { of: "late" }, stage: "Somebody starts a chant, and the whole fire pit joins in.", turns: [["narrator", "They got together late, and they made every day count."], ["b", "We didn't have long in here together."], ["a", "Long enough. I knew."], ["c", "Come here. Well done, you two."]] },
    { id: "fw.fr", when: { of: "friends" }, stage: "Confetti comes down over the fire pit.", turns: [["narrator", "They were friends first. Tonight, they're the winners."], ["a", "You were my best friend in here before anything else."], ["b", "I still am."], ["dior", "Congratulations, you two. You're this year's Perfect Match."]] },
    { id: "fw.sb", when: { of: "slow-burn" }, stage: "The lights over the villa come up, all at once.", turns: [["narrator", "It took them a long time to get here. It was worth the wait."], ["b", "It took us ages, didn't it?"], ["a", "It did. I wouldn't change any of it."], ["dior", "Congratulations. You're this year's Perfect Match."]], beat: "{c} and {d} are the first ones over to hug them." },
    { id: "fw.jf", when: { of: "just-friends" }, stage: "Confetti comes down over the fire pit, and two friends stand in the middle of it, laughing.", turns: [["narrator", "They came looking for love and found a friendship instead. The public loved them for it."], ["a", "Best friends. Winners. I'll take both."]] },
    { id: "fw.st", when: { of: "steady" }, stage: "Confetti comes down over the fire pit.", turns: [["narrator", "From the start, these two were steady. The public loved them for it."], ["a", "Thank you, everyone. Thank you so much."], ["b", "I can't believe it's us."], ["c", "I can. Well done, both of you."]] },
    { id: "fw.st2", when: { of: "steady" }, stage: "The two of them are still holding on to each other when the others get there.", turns: [["a", "I can't stop shaking."], ["b", "Me neither. We did it."], ["dior", "You did. Congratulations, you're this year's Perfect Match."], ["c", "Come here, you two."]], beat: "{c} and {d} hug them both, and the rest of the villa piles in." },
  ],
  'final-result': [
    { id: "fr.4.m1", when: { of: "fourth", mates: true }, turns: [["dior", "In fourth place, it's {a} and {b}."], ["a", "Honestly? Fair."], ["b", "We were never going to win as two friends."]] },
    { id: "fr.3.m1", when: { of: "third", mates: true }, turns: [["dior", "In third place… {a} and {b}."], ["b", "Third, as friends. I'll take that."]], beat: "They high-five, and the fire pit cheers anyway." },
    { id: "fr.2.m1", when: { of: "second", mates: true }, turns: [["dior", "Our runners-up are… {a} and {b}."], ["a", "Runners-up, and we're not even a couple. That's a story."]] },
    { id: "fr.1.m1", when: { of: "first", mates: true }, turns: [["dior", "The winners of Perfect Match are… {a} and {b}!"], ["a", "Us? We're not even together!"], ["b", "The public have spoken. Don't argue with them."]] },
    { id: "fr.4.01", when: { of: "fourth" }, turns: [["dior", "In fourth place, it's {a} and {b}."]], beat: "They hug each other, and then everybody else." },
    { id: "fr.4.02", when: { of: "fourth" }, turns: [["dior", "The couple in fourth place… {a} and {b}."], ["a", "Honestly, just being in the final is enough."]] },
    { id: "fr.4.03", when: { of: "fourth" }, turns: [["dior", "{a} and {b}, you're in fourth place."], ["b", "We'll take it. We're going home together."]] },
    { id: "fr.4.04", when: { of: "fourth" }, turns: [["dior", "In fourth place… {a} and {b}."]], beat: "{a} looks disappointed for about a second, then kisses {b}." },
    { id: "fr.3.01", when: { of: "third" }, turns: [["dior", "In third place, it's {a} and {b}."], ["a", "Third! That's not bad at all."]] },
    { id: "fr.3.02", when: { of: "third" }, turns: [["dior", "The couple in third place is… {a} and {b}."]], beat: "{b} squeezes {a.posAdj} hand, and they both smile." },
    { id: "fr.3.03", when: { of: "third" }, turns: [["dior", "{a} and {b}. You're in third place."], ["b", "Thank you to everyone who voted for us."]] },
    { id: "fr.3.04", when: { of: "third" }, turns: [["dior", "In third place… {a} and {b}."], ["a", "I'm disappointed and I'm happy at the same time."]] },
    { id: "fr.2.01", when: { of: "second" }, turns: [["dior", "Which means our runners-up are… {a} and {b}."]], beat: "The other couple is already screaming." },
    { id: "fr.2.02", when: { of: "second" }, turns: [["dior", "In second place… {a} and {b}."], ["a", "That's okay. That's okay. Well done, you two."]] },
    { id: "fr.2.03", when: { of: "second" }, turns: [["dior", "Our runners-up… {a} and {b}."], ["b", "We came so close."], ["a", "We did. And I've still got you."]] },
    { id: "fr.2.04", when: { of: "second" }, turns: [["dior", "{a} and {b}, you're our runners-up."]], beat: "{a} hugs the winners first, before anyone else can." },
    { id: "fr.1.01", when: { of: "first" }, turns: [["dior", "The winners of Perfect Match are… {a} and {b}!"]], beat: "The fire pit erupts. {a} lifts {b} right off the ground." },
    { id: "fr.1.02", when: { of: "first" }, turns: [["dior", "The couple the public voted to win is… {a} and {b}!"], ["a", "No. No way. Are you serious?"], ["b", "We won! We actually won!"]] },
    { id: "fr.1.03", when: { of: "first" }, turns: [["dior", "{a}, {b}. You're the winners."]], beat: "{b} bursts into tears. {a} is laughing and crying at the same time." },
    { id: "fr.1.04", when: { of: "first" }, turns: [["dior", "And the winners are… {a} and {b}!"], ["b", "I can't believe it. I can't believe it's us."], ["a", "Believe it."]] },
    { id: "fr.1.05", when: { of: "first", late: true }, turns: [["dior", "After everything, the winners of Perfect Match are {a} and {b}!"], ["a", "I came in here for this. For you."]], beat: "Fireworks go off over the villa." },
  ],
  'reunion-open': [
    { id: "ru.o1", stage: "A studio full of lights and a live audience. The islanders fill the sofas.", turns: [["dior", "Welcome to the Perfect Match reunion! Every islander from this season is here, and trust me, some of you are not going to enjoy tonight."]], beat: "The audience cheers. A few islanders laugh nervously." },
    { id: "ru.o2", stage: "The whole cast, together again for the first time since the villa.", turns: [["dior", "Good evening, and welcome back! We've got the couples, we've got the exes, and we've got the footage you never saw."]] },
  ],
  'reunion-winners': [
    { id: "ru.w1", when: { of: "together" }, turns: [["dior", "Let's start with our winners. {a}, {b}, how is life outside the villa?"], ["a", "Honestly? Better than in there. We don't have to share a bedroom with twenty people."], ["b", "Nineteen."]] },
    { id: "ru.w2", when: { of: "together" }, turns: [["dior", "{a} and {b}, our Perfect Match. Are you still going strong?"], ["b", "Stronger."], ["a", "We're looking at flats."]], beat: "The studio cheers." },
    { id: "ru.w3", when: { of: "apart" }, turns: [["dior", "{a}, {b}, our winners. I have to ask. How are things?"], ["a", "It's been a lot."], ["b", "We're taking it one day at a time."]], beat: "The studio goes quiet for a second." },
  ],
  'reunion-close': [
    { id: "ru.c1", turns: [["dior", "That's all we have time for. Thank you to every one of our islanders, and to all of you for watching."], ["dior", "Goodnight, and see you in the villa next time."]] },
    { id: "ru.c2", turns: [["dior", "What a season. Thank you for watching, and thank you to our islanders for letting us in. Goodnight!"]], beat: "The whole studio is on its feet." },
  ],
  reveal: [
    { id: "rv.pull1", when: { hasQuote: true, what: "pull", cast: 3, of: "scandal" }, stage: "The clip: {a} pulling {b} aside, while {a} was coupled up with {c}. {exchange}", turns: [["dior", "{c}, did you know about this?"], ["c", "I do now."]], beat: "The studio gasps." },
    { id: "rv.pull2", when: { hasQuote: true, what: "pull", cast: 3 }, stage: "{a} and {b}, deep in conversation, while {c} was somewhere else. {exchange}", turns: [["dior", "{a}. Would you like to explain?"], ["a", "It was just a chat."], ["c", "It didn't look like just a chat."]], beat: "The audience goes \"ooh\"." },
    { id: "rv.pull3", when: { hasQuote: true, what: "pull", cast: 3, of: "scandal" }, stage: "The clip: {a} and {b}, talking quietly, away from everyone else. {exchange}", turns: [["c", "Where was I when this happened?"], ["dior", "Somewhere else in the villa, {c}."]], beat: "The studio laughs, and then gasps." },
    { id: "rv.pull4", when: { hasQuote: true, what: "pull", cast: 3 }, stage: "A chat that didn't make it to air: {a} and {b}, while {c} had no idea. {exchange}", turns: [["dior", "{a}, you went very quiet."], ["a", "I don't know what to say."], ["c", "Try the truth."]], beat: "The audience goes \"ooh\"." },
    { id: "rv.pull5", when: { hasQuote: true, what: "pull" }, stage: "The clip: {a} pulling {b} for a chat nobody at home got to see. {exchange}", turns: [["dior", "{b}, what was going through your head?"], ["b", "Honestly? I wasn't thinking at all."]], beat: "The studio laughs." },
    { id: "rv.kiss1", when: { hasQuote: true, what: "kiss", cast: 3 }, stage: "The clip: {a} and {b}, kissing, when {c} was nowhere near. {exchange}", turns: [["c", "Wow."], ["dior", "{a}, the floor is yours."], ["a", "I don't have anything good to say."]], beat: "The studio gasps, loudly." },
    { id: "rv.kiss2", when: { hasQuote: true, what: "kiss", cast: 3 }, stage: "Somewhere {a} thought nobody was filming: {a} and {b}. {exchange}", turns: [["dior", "{c}, I'm so sorry you had to find out like this."], ["c", "Don't be. Better now than never."]], beat: "Somebody in the front row puts a hand over their mouth." },
    { id: "rv.bed1", when: { hasQuote: true, what: "bed", cast: 3 }, stage: "Casa Amor, lights out. {a} and {b} in the same bed, and {c} back at the main villa. {exchange}", turns: [["dior", "{a}, that is not what you told us at the fire pit."], ["a", "I know. I know."]], beat: "The studio gasps." },
    { id: "rv.bed2", when: { hasQuote: true, what: "bed" }, stage: "Casa Amor, after dark: {a} and {b}, whispering under the covers. {exchange}", turns: [["dior", "{b}, do you remember this?"], ["b", "Vividly."]], beat: "The studio gasps, then laughs." },
    { id: "rv.said1", when: { hasQuote: true, what: "said", cast: 3 }, stage: "The clip: {a}, telling {b} what {a} really thought of {c}. {exchange}", turns: [["c", "So that's what you said when I wasn't there."], ["a", "I was having a bad day."]], beat: "The studio winces." },
    { id: "rv.said2", when: { hasQuote: true, what: "said", cast: 3 }, stage: "{a}, talking to {b} about {c}, when {c} wasn't there to hear it. {exchange}", turns: [["dior", "{c}, how does that feel to hear?"], ["c", "Honestly? About how you'd think."]], beat: "The studio gasps." },
    { id: "rv.prom1", when: { hasQuote: true, what: "promise", cast: 3 }, stage: "The clip: {a} making plans for the outside with {b}, while coupled up with {c}. {exchange}", turns: [["c", "Plans. For the outside. Lovely."], ["a", "It wasn't like that."]], beat: "The studio gasps." },
    { id: "rv.arg1", when: { hasQuote: true, what: "argument" }, stage: "The clip: a row between {a} and {b} that never made it to air. {exchange}", turns: [["dior", "Do you two want to talk about that?"], ["b", "Not really."]], beat: "The studio laughs." },
    { id: "rv.ick1", when: { hasQuote: true, what: "ick" }, stage: "The clip: the moment {a} went off {b}. {exchange}", turns: [["b", "Is that the moment?"], ["a", "That was the moment."]], beat: "The whole studio winces." },
    { id: "rv.head1", when: { hasQuote: true, what: "head-turned" }, stage: "The clip: {a}, watching {b}, and not being subtle about it. {exchange}", turns: [["dior", "{a}, you were staring."], ["a", "I was looking. There's a difference."]], beat: "The studio laughs." },
    { id: "reveal.01", when: { hasQuote: true, of: "scandal", withB: true }, stage: "A moment between {a} and {b} that never made it to air. {exchange}", turns: [["dior", "{a}, we have to talk about this one."], ["a", "I knew you were going to show that."]], beat: "The studio gasps." },
    { id: "reveal.05", when: { hasQuote: true, of: "scandal", withB: true }, stage: "The screen behind the host lights up: {a} and {b}, in a scene nobody at home saw. {exchange}", turns: [["dior", "This never aired. Let's change that."], ["a", "Oh no."]], beat: "The audience gasps anyway." },
    { id: "reveal.03", when: { hasQuote: true, of: "mild" }, stage: "A clip of {a} that never aired. {exchange}", turns: [["dior", "{a}. Would you like to explain?"], ["a", "Honestly? No."]], beat: "The studio laughs, and {a} does too, eventually." },
    { id: "reveal.07", when: { hasQuote: true, of: "mild" }, stage: "The clip plays on the big screen. {exchange}", turns: [["a", "Can we skip this one?"], ["dior", "Absolutely not."]], beat: "The studio is laughing now." },
    { id: "reveal.12", when: { hasQuote: true, of: "scandal" }, stage: "A clip of {a} that never made it to air. {exchange}", turns: [["dior", "{a}, we have to talk about this one."], ["a", "I knew you were going to show that."]], beat: "The studio gasps." },
    { id: "reveal.09", stage: "A clip nobody saw plays on the big screen.", turns: [["dior", "{a}, we have to talk about this one."], ["a", "I knew you were going to show that."]] },
  ],
};
