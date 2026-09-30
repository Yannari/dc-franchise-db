// How a ratings night ends (Plan 3b). Data only.
// alert.<format> — a reads the Circle's alert out loud; b reacts.
// hangout.solo.* — a, a sole Influencer, alone in the apartment; c is the
// player being weighed (view) or the one they block (decide).
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });

export const FORMAT_LINES = {
  ...E('alert.sole', [
    { turns: [{ by: 'a', react: "'Tonight, only the top-rated Player will become an Influencer.' Only one?" },
      { by: 'b', react: 'One person. Deciding alone. That is terrifying.' }], beat: '{a} reads it twice to be sure.' },
    { turns: [{ by: 'a', react: "'There will be only one Influencer tonight.' Oh, that changes everything." },
      { by: 'b', say: 'No Hangout? No second opinion? Wow.' }] },
    { turns: [{ by: 'a', react: "'The top-rated Player will block alone.' Okay. Whoever that is, I feel for them." },
      { by: 'b', react: "Please don't be me. Actually, please be me." }], beat: '{b} hugs a pillow.' },
    { turns: [{ by: 'a', react: "'Only one Influencer.' So nobody to blame but yourself." },
      { by: 'b', say: 'Every person in this building is doing math right now.' }] },
  ]),
  // block.announce.solo.<reason> — a sole Influencer sends the name ({c}) alone.
  ...E('block.announce.solo.threat', [
    { turns: [{ by: 'a', send: "This was my call and only mine. You're too strong to leave in. I am blocking... {c}" }], beat: 'Every apartment waits on the dots.' },
    { turns: [{ by: 'a', send: "I had to think about who could beat me. I am blocking... {c}" }] },
    { turns: [{ by: 'a', send: "Nothing personal. It's the game, and I'm the one playing it tonight. I'm blocking... {c}" }] },
  ]),
  ...E('block.announce.solo.fake', [
    { turns: [{ by: 'a', send: "I have to trust my gut. And my gut says this person isn't real. I'm blocking... {c}" }], beat: 'Every apartment waits on the dots.' },
    { turns: [{ by: 'a', send: "If I'm wrong, I'll own it. I'm blocking... {c}" }] },
    { turns: [{ by: 'a', send: "Something never added up for me. I'm blocking... {c}" }] },
  ]),
  ...E('block.announce.solo.grudge', [
    { turns: [{ by: 'a', send: "You know what you did. I'm blocking... {c}" }], beat: 'Every apartment waits on the dots.' },
    { turns: [{ by: 'a', send: "Loyalty matters to me. I'm blocking... {c}" }] },
    { turns: [{ by: 'a', send: "I gave you a chance. I'm blocking... {c}" }] },
  ]),
  ...E('block.announce.solo.noBond', [
    { turns: [{ by: 'a', send: "I have to protect the people who have my back. I'm blocking... {c}" }], beat: 'Every apartment waits on the dots.' },
    { turns: [{ by: 'a', send: "We never really connected, and I'm sorry for that. I'm blocking... {c}" }] },
    { turns: [{ by: 'a', send: "This was the hardest decision I've made in here. I'm blocking... {c}" }] },
  ]),
  // a is the one and only Influencer tonight.
  ...E('result.sole', [
    { turns: [{ by: 'a', react: "First place. And that means... it's all on me." }], beat: '{a} stares at the screen, frozen.' },
    { turns: [{ by: 'a', react: "Top of the ratings. Sole Influencer. I wanted this. Did I want this?" }] },
    { turns: [{ by: 'a', react: "Me? Alone? Okay. Okay. Deep breaths." }], beat: '{a} fans {a.ref} with both hands.' },
    { turns: [{ by: 'a', react: "Number one. That feels amazing for exactly one second." },
      { by: 'a', say: 'Now I have to block somebody by myself.' }] },
  ]),
  ...E('hangout.solo.open', [
    { turns: [{ by: 'a', react: "'You are the sole Influencer.' Me. Just me. Okay." },
      { by: 'a', say: 'No one to talk it through with. It has to be my call.' }], beat: '{a} sits down slowly on the couch.' },
    { turns: [{ by: 'a', react: 'It\'s me. I have to do this alone.' },
      { by: 'a', say: 'Whatever happens next, everybody will know it was me.' }], beat: '{a} pulls the tablet onto {a.posAdj} knees.' },
    { turns: [{ by: 'a', react: "Sole Influencer. That's the best and worst news I've ever gotten." }], beat: '{a} laughs, then stops laughing.' },
    { turns: [{ by: 'a', say: 'Okay, Circle. Show me who is at risk.' },
      { by: 'a', react: 'Every single one of these faces is a person I talk to.' }], beat: '{a} scrolls through the names.' },
  ]),
  ...E('hangout.solo.view.threat.cut', [
    { turns: [{ by: 'a', say: '{c} is the strongest player in here. If I leave {c.obj} in, {c.sub} wins.' }] },
    { turns: [{ by: 'a', say: 'Everybody loves {c}. That is exactly the problem.' }], beat: '{a} taps {c}\'s picture.' },
    { turns: [{ by: 'a', say: "{c} would block me in a second if {c.sub} had this power. I know it." }] },
  ]),
  ...E('hangout.solo.view.fake.cut', [
    { turns: [{ by: 'a', say: "I don't think {c} is real. I haven't thought it since day one." }] },
    { turns: [{ by: 'a', say: 'Something about {c} has never added up for me.' }], beat: '{a} zooms in on {c}\'s profile picture.' },
    { turns: [{ by: 'a', say: "If {c} is a catfish and I leave {c.obj} in here, that's on me." }] },
  ]),
  ...E('hangout.solo.view.grudge.cut', [
    { turns: [{ by: 'a', say: "{c} came for me. I haven't forgotten." }] },
    { turns: [{ by: 'a', say: '{c} made this personal. Now I get to answer.' }], beat: '{a}\'s jaw sets.' },
    { turns: [{ by: 'a', say: "I tried with {c}. {c} didn't try back." }] },
  ]),
  ...E('hangout.solo.view.noBond.cut', [
    { turns: [{ by: 'a', say: "{c} and I barely talk. I don't owe {c.obj} anything." }] },
    { turns: [{ by: 'a', say: "I don't know {c}. And {c} never made the effort to know me." }] },
    { turns: [{ by: 'a', say: "Who's actually in my corner? Not {c}." }], beat: '{a} shrugs at the screen.' },
  ]),
  ...E('hangout.solo.view.noBond.keep', [
    { turns: [{ by: 'a', say: "{c} is safe with me. {c}'s always been good to me." }] },
    { turns: [{ by: 'a', say: "Not {c}. I couldn't do that to {c.obj}." }] },
    { turns: [{ by: 'a', say: "{c}? No. {c.Sub}'s not the one." }], beat: '{a} moves on to the next picture.' },
    { turns: [{ by: 'a', say: "I'd never forgive myself if I blocked {c}." }] },
    { turns: [{ by: 'a', say: "{c} stays. We made a promise, and I keep my promises." }] },
  ]),
  ...E('hangout.solo.decide', [
    { turns: [{ by: 'a', say: "It has to be {c}. I hate it. But it has to be {c}." }], beat: '{a} takes a long breath.' },
    { turns: [{ by: 'a', say: 'Okay. I know who it is. I knew all along.' }, { by: 'a', react: 'Sorry, {c}.' }] },
    { turns: [{ by: 'a', say: "Circle, I've made my decision. It's {c}." }], beat: '{a} sets the tablet down very carefully.' },
    { turns: [{ by: 'a', react: "{c}. Final answer. Don't overthink it." }, { by: 'a', say: 'I will overthink it for the rest of my life.' }] },
  ]),
};

// ── Task 3: the other Hangout formats ─────────────────────────────────
// alert.* as above. ratings.hidden — a, when the results are not shown.
// result.secret / result.super — a learns in private that it is them.
// save.announce — a (Influencer) saves b in the Circle Chat; save.react — a
// (saved) about b (the saver); save.passed — a (not saved) about b (the
// saver). offer.open — a reads the offer, b is the other Influencer;
// offer.yes / offer.no — a's answer about b; offer.betrayed — a (blocked)
// about b (who took it); offer.declined — a and b both said no.
// block.announce.secret — the Circle names c; block.announce.offer — a
// (who took the offer) and c (blocked). block.inperson.walk / .tell — a is
// the Super Influencer, c or b the blocked player; .door — a is the
// blocked player, b the Super Influencer at the door.
export const FORMAT_LINES_2 = {
  ...E('alert.trio', [
    { turns: [{ by: 'a', react: "'Tonight, the top three Players will become Influencers.' Three?" },
      { by: 'b', react: 'Three people have to agree? Good luck with that.' }] },
    { turns: [{ by: 'a', react: "'There will be three Influencers tonight.' Okay. More people, more politics." },
      { by: 'b', say: 'Two of them can outvote the third. Somebody is getting overruled.' }] },
    { turns: [{ by: 'a', react: "Three Influencers. So it's a vote now." }, { by: 'b', react: 'Please let me be one of the three.' }],
      beat: '{b} crosses {b.posAdj} fingers.' },
  ]),
  ...E('alert.save-first', [
    { turns: [{ by: 'a', react: "'Before the Influencers block, each of them must save one Player.' In public?" },
      { by: 'b', react: "So we're about to find out who everybody's real friend is." }] },
    { turns: [{ by: 'a', react: "'Each Influencer will save one Player in the Circle Chat.' Oh, this is going to hurt somebody." },
      { by: 'b', say: 'If I am not saved, I will know exactly what that means.' }] },
    { turns: [{ by: 'a', react: 'A public save. Everybody sees who picks who.' }, { by: 'b', react: 'That is so much pressure. I love it.' }],
      beat: '{b} pulls {b.posAdj} knees up to {b.posAdj} chest.' },
  ]),
  ...E('alert.secret', [
    { turns: [{ by: 'a', react: "'Tonight, the results will not be shown.' Wait, what?" },
      { by: 'b', react: "So the Influencers could be anybody. They could be the person I'm talking to." }] },
    { turns: [{ by: 'a', react: "'The Influencers will remain secret.' Oh, that's evil." },
      { by: 'b', say: "Everybody's going to be lying about where they placed." }] },
    { turns: [{ by: 'a', react: 'Secret Influencers. Nobody will know who did it.' }, { by: 'b', react: 'Which means everybody will guess.' }],
      beat: '{b} narrows {b.posAdj} eyes at the screen.' },
  ]),
  ...E('alert.super', [
    { turns: [{ by: 'a', react: "'Tonight there will be one Super Influencer.' Super?" },
      { by: 'b', react: "One person. Total power. And we don't even get to see the results." }] },
    { turns: [{ by: 'a', react: "'The Super Influencer will block in person.' In person? At your door?" },
      { by: 'b', say: 'Imagine opening your door and it is the person who blocked you.' }] },
    { turns: [{ by: 'a', react: 'A Super Influencer. Nobody knows who, or who they are coming for.' },
      { by: 'b', react: 'Every knock is going to give me a heart attack.' }], beat: '{b} checks that the door is locked.' },
  ]),
  ...E('alert.mutual', [
    { turns: [{ by: 'a', react: "'The Influencers may choose to block each other.' Each other?" },
      { by: 'b', react: 'This is how friendships end.' }] },
    { turns: [{ by: 'a', react: "'Each Influencer can block their fellow Influencer.' In front of everyone?" },
      { by: 'b', say: 'Nobody would actually do that. Right? Right?' }] },
    { turns: [{ by: 'a', react: 'The Influencers can turn on each other. Oh, I cannot wait.' },
      { by: 'b', react: 'I am getting snacks for this.' }], beat: '{b} runs to the kitchen.' },
  ]),
  ...E('ratings.hidden', [
    { turns: [{ by: 'a', react: "No results? I don't even know if I'm safe." }], beat: '{a} stares at the blank screen.' },
    { turns: [{ by: 'a', react: 'I have never wanted to see a number this badly.' }] },
    { turns: [{ by: 'a', react: 'Top? Bottom? Middle? I have no idea. None.' }], beat: '{a} paces the length of the apartment.' },
    { turns: [{ by: 'a', say: "Whoever the Influencers are, they're sitting there right now knowing it. And I don't." }] },
    { turns: [{ by: 'a', react: 'This is the worst kind of waiting. The blind kind.' }] },
    { turns: [{ by: 'a', react: "If I'm an Influencer, I would know by now. Right?" }], beat: '{a} refreshes the screen.' },
    { turns: [{ by: 'a', say: 'Everybody in this building is pretending to be calm right now.' }] },
    { turns: [{ by: 'a', react: "I'm going to act normal. What does normal look like? I forget." }], beat: '{a} sits down, stands up, sits down.' },
  ]),
  ...E('result.secret', [
    { turns: [{ by: 'a', react: "'You are an Influencer. Nobody else knows.' Oh my God." },
      { by: 'a', say: 'Poker face. Poker face.' }], beat: '{a} covers {a.posAdj} mouth with both hands.' },
    { turns: [{ by: 'a', react: 'Me? Secretly? Okay. Tell nobody. Not even the plants.' }] },
    { turns: [{ by: 'a', react: 'An Influencer, and nobody will ever know it was me. That is so much power.' }],
      beat: '{a} smiles at the screen very slowly.' },
  ]),
  ...E('result.super', [
    { turns: [{ by: 'a', react: "'You are the Super Influencer.' Me? Alone?" },
      { by: 'a', say: 'And I have to go to their door. I have to say it to their face.' }], beat: '{a} sits down on the floor.' },
    { turns: [{ by: 'a', react: 'Super Influencer. Oh no. Oh yes. Oh no.' }] },
    { turns: [{ by: 'a', react: "Nobody knows it's me. And tonight I walk into somebody's apartment and end their game." }],
      beat: '{a} looks at the door for a long moment.' },
  ]),
  ...E('save.announce', [
    { turns: [{ by: 'a', send: "I'm saving {b}. You've had my back from day one." }], beat: 'Every apartment reads it at once.' },
    { turns: [{ by: 'a', say: 'Only one choice for me.', send: 'My save goes to {b}. No hesitation.' }] },
    { turns: [{ by: 'a', send: "{b}, you're safe with me tonight. I hope you know why." }] },
    { turns: [{ by: 'a', send: 'This was easy. I am saving {b}.' }], beat: '{a} sends it before {a.sub} can second-guess it.' },
  ]),
  ...E('save.react', [
    { turns: [{ by: 'a', react: "{b} saved me. In front of everybody. I'm going to cry." }] },
    { turns: [{ by: 'a', react: 'Safe! {b}, I owe you. I owe you big.' }], beat: '{a} jumps up and down on the couch.' },
    { turns: [{ by: 'a', react: '{b} picked me. That tells me everything I need to know.' }] },
    { turns: [{ by: 'a', react: 'Oh, thank God. Thank you, {b}. Thank you, thank you.' }], beat: '{a} presses both hands to {a.posAdj} heart.' },
  ]),
  ...E('save.passed', [
    { turns: [{ by: 'a', react: "{b} didn't pick me. Okay. Noted." }], beat: '{a} sets the tablet down very carefully.' },
    { turns: [{ by: 'a', react: 'I really thought {b} would save me. I really did.' }] },
    { turns: [{ by: 'a', react: "So that's where I stand with {b}. Good to know." }] },
    { turns: [{ by: 'a', react: 'Everybody just watched {b} choose someone over me.' }], beat: "{a}'s smile doesn't reach {a.posAdj} eyes." },
  ]),
  // save.wait — a, still unsaved, as b saves somebody else.
  ...E('save.wait', [
    { turns: [{ by: 'a', react: 'Save me. Somebody. Please.' }], beat: '{a} refreshes the chat over and over.' },
    { turns: [{ by: 'a', react: "Not me again. Okay. There's still time." }] },
    { turns: [{ by: 'a', react: 'Every name that is not mine makes the list shorter.' }], beat: '{a} counts the names left on {a.posAdj} fingers.' },
    { turns: [{ by: 'a', react: '{b}, look at me. Look at me. Please.' }] },
    { turns: [{ by: 'a', react: "I'm still here. I'm still unsaved. Breathe." }], beat: '{a} hugs a cushion to {a.posAdj} chest.' },
    { turns: [{ by: 'a', say: 'If I am the last one, I am going to scream.' }] },
  ]),
  ...E('offer.open', [
    { turns: [{ by: 'a', react: "'Would you like to block your fellow Influencer?' Oh, this is cruel." },
      { by: 'b', react: 'They are asking me too. Of course they are.' }] },
    { turns: [{ by: 'a', react: "I could end {b}'s game right now. With one word." },
      { by: 'b', say: "If {a} says yes, I'm gone. If I say yes, {a} is gone." }] },
    { turns: [{ by: 'a', react: 'The Circle is asking if I want to block {b}. It is actually asking.' }], beat: '{a} laughs, then does not.' },
  ]),
  ...E('offer.yes', [
    { turns: [{ by: 'a', say: "It's a game. {b} would do the same to me." }, { by: 'a', react: 'Circle, yes.' }], beat: '{a} does not look away from the screen.' },
    { turns: [{ by: 'a', say: 'I will never get a cleaner shot at {b}.' }, { by: 'a', react: 'Yes. Send it.' }] },
    { turns: [{ by: 'a', say: 'Sorry, {b}. This is how I win.' }], beat: '{a} presses the button fast.' },
  ]),
  ...E('offer.no', [
    { turns: [{ by: 'a', say: 'No. Never. {b} is my person.' }] },
    { turns: [{ by: 'a', say: "I'm not doing that to {b}. That's not who I am." }], beat: '{a} shakes {a.posAdj} head at the screen.' },
    { turns: [{ by: 'a', say: 'Circle, no. And I hope {b} says no too.' }] },
    { turns: [{ by: 'a', react: 'No. I could never look {b} in the eye again.' }] },
  ]),
  ...E('offer.betrayed', [
    { turns: [{ by: 'a', react: '{b} said yes? {b} said yes?' }, { by: 'a', say: 'I said no. I said no for {b}.' }],
      beat: '{a} stares at the screen, a hand over {a.posAdj} mouth.' },
    { turns: [{ by: 'a', react: 'Wow. {b}. Wow.' }, { by: 'a', say: 'Everybody just saw who {b} really is.' }] },
    { turns: [{ by: 'a', react: 'I trusted {b} with everything. And {b} took the first chance to get rid of me.' }],
      beat: '{a} sinks down onto the floor.' },
  ]),
  ...E('offer.declined', [
    { turns: [{ by: 'a', react: '{b} said no too. Oh, thank God.' }, { by: 'b', react: '{a} said no. We are good. We are so good.' }] },
    { turns: [{ by: 'a', react: 'Neither of us took it. That means something.' }, { by: 'b', say: 'Now we go and block somebody else, together.' }] },
    { turns: [{ by: 'a', react: 'Both no. Both loyal.' }, { by: 'b', react: 'I knew {a} would say no. I knew it.' }],
      beat: '{a} and {b} both let out a breath in separate apartments.' },
  ]),
  ...E('block.announce.secret', [
    { turns: [{ by: 'host', say: 'The secret Influencers have made their decision. {c} has been blocked.' }], beat: 'Every apartment goes quiet.' },
    { turns: [{ by: 'host', say: 'Players, {c} has been blocked from The Circle. The Influencers remain secret.' }] },
    { turns: [{ by: 'host', say: 'Somebody in this building just blocked {c}, and nobody knows who.' }], beat: 'Every apartment waits for a name that never comes.' },
  ]),
  ...E('block.announce.offer', [
    { turns: [{ by: 'a', send: 'I had the chance, and I took it. I am blocking... {c}' }], beat: 'Every apartment waits on the dots.' },
    { turns: [{ by: 'a', send: "It's the game. I'm sorry, {c}. I'm blocking you." }] },
    { turns: [{ by: 'a', send: 'This is the hardest thing I have done in here. I am blocking... {c}' }] },
  ]),
  // hangout.open.trio — a, b and c, the three Influencers. trio.agree — a
  // and b (and the third) settle on c together; trio.outvoted — a's side wins,
  // b is overruled, c is blocked.
  ...E('hangout.open.trio', [
    { turns: [{ by: 'a', send: 'Three of us. Okay. This is going to be a conversation.' }, { by: 'b', send: 'Majority rules, right?' },
      { by: 'c', send: 'Majority rules. Let\'s go one by one' }] },
    { turns: [{ by: 'a', react: "'Influencers, you will now meet in the Hangout.' All three of us." },
      { by: 'b', send: 'Hi both! This is so weird' }, { by: 'c', send: 'Weird is one word for it lol' }] },
    { turns: [{ by: 'a', send: 'Before anything. Two of us can outvote the third. Let\'s not let it get ugly' },
      { by: 'b', send: 'Agreed' }, { by: 'c', send: "Agreed. Let's just be honest" }] },
  ]),
  ...E('hangout.trio.agree', [
    { turns: [{ by: 'a', send: 'So we all agree. It\'s {c}.' }, { by: 'b', send: 'All three of us. That makes it easier' }],
      beat: 'In three apartments, three people let out a breath.' },
    { turns: [{ by: 'a', send: "Unanimous. {c}." }, { by: 'b', send: 'Unanimous' }] },
    { turns: [{ by: 'a', send: "Nobody's arguing? Okay. It's {c}." }, { by: 'b', send: "I'm not arguing. It's {c}" }] },
  ]),
  ...E('hangout.trio.outvoted', [
    { turns: [{ by: 'a', send: "It's two against one. It's {c}. I'm sorry." }, { by: 'b', send: "Fine. For the record, I said no" }],
      beat: '{b} sits back from the screen, arms folded.' },
    { turns: [{ by: 'a', send: "Majority says {c}." }, { by: 'b', say: "I just got outvoted. In my own Hangout." }] },
    { turns: [{ by: 'b', send: "I don't love it. But I get it" }, { by: 'a', send: "Thank you. It's {c}" },
      { by: 'b', react: 'I will remember this.' }] },
  ]),
  // visit.inperson.bye — a, the Super Influencer, leaves b's apartment;
  // visit.inperson.after — a (blocked) alone after, b (the one who came).
  ...E('visit.inperson.bye', [
    { turns: [{ by: 'a', say: "I should go. I'm so sorry." }, { by: 'b', say: 'Go. Win it. Make it worth it.' }], beat: '{a} hugs {b} one more time at the door.' },
    { turns: [{ by: 'a', say: 'Thank you for not hating me.' }, { by: 'b', say: "Give it a day. Then I won't." }], beat: 'They both laugh, and {a} goes.' },
    { turns: [{ by: 'a', say: 'I have to go back now.' }, { by: 'b', say: 'I know. Close the door gently.' }], beat: '{a} closes the door behind {a.obj}.' },
  ]),
  ...E('visit.inperson.after', [
    { turns: [{ by: 'a', react: "{b} came all the way here to do it. I respect that. I hate it, but I respect it." }],
      beat: '{a} sits down on the couch where {b} just was.' },
    { turns: [{ by: 'a', react: 'That was the strangest goodbye of my life.' }], beat: '{a} stares at the closed door.' },
    { turns: [{ by: 'a', react: 'Okay. Pack your bag. It\'s over.' }], beat: '{a} starts folding clothes very slowly.' },
  ]),
  ...E('block.inperson.walk', [
    { turns: [{ by: 'a', say: "I have to go to {c}'s door. I have to say it to {c.posAdj} face." }], beat: '{a} takes a long breath and opens the door.' },
    { turns: [{ by: 'a', say: "Every step down this hallway, I'm changing my mind and changing it back." }],
      beat: '{a} walks slowly past door after door.' },
    { turns: [{ by: 'a', say: 'Okay. This is it. {c} has no idea.' }], beat: '{a} stops outside a door and raises a hand to knock.' },
  ]),
  ...E('block.inperson.door', [
    { turns: [{ by: 'a', react: 'Somebody is at my door. Oh no. Oh no.' }], beat: '{a} opens the door and freezes.' },
    { turns: [{ by: 'a', react: "Hi. You're... you're the Super Influencer?" }, { by: 'b', say: 'Can I come in?' }] },
    { turns: [{ by: 'a', react: "It's you. It's really you." }, { by: 'b', say: "I'm so sorry. I had to do this in person." }] },
  ]),
  ...E('block.inperson.tell', [
    { turns: [{ by: 'a', say: "I'm the Super Influencer, and I came to tell you myself. I'm blocking you." }, { by: 'b', react: 'Me. Okay. Okay.' }] },
    { turns: [{ by: 'a', say: "I didn't want you to find out from a screen. It's you tonight." }, { by: 'b', react: 'Thank you for coming. I think.' }] },
    { turns: [{ by: 'a', say: 'This is the worst part of the whole game. I have to block you.' }, { by: 'b', say: 'Can I at least give you a hug?' }],
      beat: 'They hug in the doorway for a long time.' },
  ]),
};

// ── Task 4: public formats ─────────────────────────────────────────────
// alert.* as above. block.announce.unsaved / .vote — the Circle names c.
// block.announce.statement — a (top-rated) and c, the name a said that
// morning. plead.open — a and b, the last two. plead.pitch — a pleads to b
// (an Influencer). plead.listen — a (an Influencer) after hearing b.
// vote.open — a and b, the lowest two. vote.cast — a votes to block b.
// vote.result — a (blocked) about the tally. statement.open — a reads the
// rule, b reacts. statement.say — a names b. statement.named — a (named)
// about b (who named them).
export const FORMAT_LINES_3 = {
  ...E('alert.save-two', [
    { turns: [{ by: 'a', react: "'The Influencers will save Players one at a time in the Circle Chat.' In public?" },
      { by: 'b', react: 'And whoever is left at the end is gone. Oh, that is brutal.' }] },
    { turns: [{ by: 'a', react: "'There will be no Hangout tonight.' Then how do they block?" },
      { by: 'b', say: 'By saving everybody else. One by one. Out loud.' }] },
    { turns: [{ by: 'a', react: 'A public save, over and over, until one person is left.' }, { by: 'b', react: 'Please do not let that person be me.' }],
      beat: '{b} grips the edge of the couch.' },
  ]),
  ...E('alert.plead', [
    { turns: [{ by: 'a', react: "'The last two unsaved Players will plead their case face to face.' Face to face?" },
      { by: 'b', react: 'So if you end up in the last two, you have to beg. On camera.' }] },
    { turns: [{ by: 'a', react: "'The Influencers will save Players until two remain.' And then?" },
      { by: 'b', say: 'And then those two fight for it. Out loud.' }] },
    { turns: [{ by: 'a', react: 'Saves, then pleading. This is a talent show now.' }, { by: 'b', react: 'I need to practice a speech. Just in case.' }],
      beat: '{b} starts mouthing words at the mirror.' },
  ]),
  ...E('alert.room-vote', [
    { turns: [{ by: 'a', react: "'The two lowest-rated Players will face a vote.' A vote? By who?" },
      { by: 'b', react: 'By all of us. In public. Oh no.' }] },
    { turns: [{ by: 'a', react: "'Every Player will vote in the Circle Chat.' So everybody sees everybody's vote." },
      { by: 'b', say: 'There is no hiding tonight.' }] },
    { turns: [{ by: 'a', react: 'The lowest two, and the whole room decides.' }, { by: 'b', react: 'I hope I am voting, not being voted on.' }],
      beat: '{b} crosses {b.posAdj} fingers on both hands.' },
  ]),
  ...E('alert.forced', [
    { turns: [{ by: 'a', react: "'Before the ratings, every Player must say who they would block.' Out loud?" },
      { by: 'b', react: 'In front of everyone? Before we even rate?' }] },
    { turns: [{ by: 'a', react: "'The top-rated Player's choice will be blocked.' So what you say right now could actually happen." },
      { by: 'b', say: 'Choose your words very carefully, everybody.' }] },
    { turns: [{ by: 'a', react: 'We have to name somebody. Right now. Publicly.' }, { by: 'b', react: 'This is how you make enemies in one sentence.' }],
      beat: '{b} puts the tablet face down on the couch.' },
  ]),
  ...E('block.announce.unsaved', [
    { turns: [{ by: 'host', say: 'Every Player has been saved except one. {c}, you have been blocked.' }], beat: 'Every apartment goes quiet.' },
    { turns: [{ by: 'host', say: "The last name standing is {c}. {c} has been blocked from The Circle." }] },
    { turns: [{ by: 'host', say: 'Nobody saved {c}. {c} is blocked.' }], beat: '{c} sits alone with the empty chat.' },
  ]),
  ...E('block.announce.vote', [
    { turns: [{ by: 'host', say: 'The votes are in. {c} has been blocked from The Circle.' }], beat: 'Every apartment goes quiet.' },
    { turns: [{ by: 'host', say: 'The room has decided. {c} is blocked.' }] },
    { turns: [{ by: 'host', say: 'With the most votes, {c} has been blocked.' }], beat: '{c} reads the names of everyone who voted.' },
  ]),
  ...E('block.announce.statement', [
    { turns: [{ by: 'a', send: 'I said it this morning, and I meant it. I am blocking... {c}' }], beat: 'Every apartment waits on the dots.' },
    { turns: [{ by: 'a', send: "{c}, you heard me say it. I'm sorry. It's you." }] },
    { turns: [{ by: 'a', send: 'I named you before any of this, {c}. I have to stand by it.' }] },
  ]),
  ...E('plead.open', [
    { turns: [{ by: 'a', react: "It's me and {b}. The last two. Okay." }, { by: 'b', react: 'Me and {a}. One of us goes home tonight.' }],
      beat: 'Two screens light up with two faces.' },
    { turns: [{ by: 'a', say: "Unsaved. I have to talk my way out of this." }, { by: 'b', say: 'Deep breath. Say it from the heart.' }] },
    { turns: [{ by: 'a', react: 'Face to face. I have to look at them while I beg.' }, { by: 'b', react: "Whatever {a} says, I have to say it better." }] },
  ]),
  ...E('plead.pitch', [
    { turns: [{ by: 'a', say: "{b}, I know I haven't been the loudest in here. But I'm loyal, and I'll prove it." }], beat: '{a} looks straight into the camera.' },
    { turns: [{ by: 'a', say: "Keep me, and I will never forget it. That's a promise, {b}." }] },
    { turns: [{ by: 'a', say: "I came here to play. Let me keep playing, {b}. Please." }], beat: "{a}'s voice cracks on the last word." },
    { turns: [{ by: 'a', say: "{b}, I have been rooting for you from the start. I'm asking you to root for me now." }] },
  ]),
  ...E('plead.listen', [
    { turns: [{ by: 'a', react: "{b} just made that really hard. Really hard." }] },
    { turns: [{ by: 'a', react: 'That was... actually good. Okay. {b} is in this.' }], beat: '{a} sits back, arms folded.' },
    { turns: [{ by: 'a', react: "I believed every word {b} said. That's the problem." }] },
  ]),
  ...E('vote.open', [
    { turns: [{ by: 'a', react: "The lowest two. Me and {b}. In front of everybody." }, { by: 'b', react: 'Please, please, please.' }],
      beat: 'In two apartments, two people stop breathing.' },
    { turns: [{ by: 'a', react: "It's me and {b}. And now everyone gets to choose." }, { by: 'b', say: "I've never been this scared of a group chat." }] },
    { turns: [{ by: 'a', react: 'Lowest two. Of course.' }, { by: 'b', react: "Okay. It's a vote. Votes can surprise you." }] },
  ]),
  ...E('vote.cast', [
    { turns: [{ by: 'a', send: 'I vote to block {b}. I\'m sorry.' }] },
    { turns: [{ by: 'a', say: "Here goes. Everyone's going to see this.", send: 'My vote is {b}.' }] },
    { turns: [{ by: 'a', send: '{b}. Nothing personal.' }] },
    { turns: [{ by: 'a', send: 'This is so hard. {b}.' }], beat: '{a} sends it and immediately looks away.' },
    { turns: [{ by: 'a', say: "I'm going with my gut.", send: 'Voting {b}.' }] },
    { turns: [{ by: 'a', send: 'I have to go with {b}. I hope you understand.' }] },
    { turns: [{ by: 'a', send: 'Strategy says {b}. My heart says sorry.' }] },
    { turns: [{ by: 'a', send: 'My vote goes to {b}.' }], beat: '{a} pushes the tablet away across the coffee table.' },
  ]),
  ...E('vote.result', [
    { turns: [{ by: 'a', react: 'I saw every single name. I will remember every single name.' }], beat: '{a} scrolls back up through the votes.' },
    { turns: [{ by: 'a', react: 'So that is how the room really feels about me.' }] },
    { turns: [{ by: 'a', react: 'Wow. Okay. I know exactly who voted for me.' }], beat: '{a} sits very still.' },
  ]),
  ...E('statement.open', [
    { turns: [{ by: 'a', react: "'Every Player must now say who they would block.' Right now?" }, { by: 'b', react: 'Right now. In the chat. Oh no.' }] },
    { turns: [{ by: 'a', react: "Okay. Everybody names somebody. Everybody sees it." }, { by: 'b', say: "There's no nice way to do this." }] },
    { turns: [{ by: 'a', react: 'We all have to name someone before the ratings.' }, { by: 'b', react: "So whoever I name is going to rank me last. Great." }] },
  ]),
  ...E('statement.say', [
    { turns: [{ by: 'a', send: "If I had to block someone, it would be {b}." }] },
    { turns: [{ by: 'a', say: 'Just say it. Rip the bandage off.', send: '{b}. Sorry. It had to be somebody.' }] },
    { turns: [{ by: 'a', send: "I'd block {b}. We just haven't clicked." }] },
    { turns: [{ by: 'a', send: "My answer is {b}. Please don't hate me." }] },
    { turns: [{ by: 'a', send: "{b}. It's strategy, not personal." }] },
    { turns: [{ by: 'a', say: "Why did I agree to be on this show?", send: 'I would block {b}.' }] },
    { turns: [{ by: 'a', send: "Honestly? {b}. You're a threat." }] },
    { turns: [{ by: 'a', send: '{b}, and I think you know why.' }] },
    { turns: [{ by: 'a', send: "I'd have to say {b}. I don't know you well enough yet." }] },
    { turns: [{ by: 'a', send: "It's {b} for me." }], beat: '{a} sends it and winces.' },
    { turns: [{ by: 'a', say: 'Okay. Deep breath.', send: '{b}.' }] },
    { turns: [{ by: 'a', send: "Sorry, {b}. You're my answer." }] },
    { turns: [{ by: 'a', send: 'I choose {b}. Nothing against you as a person.' }] },
    { turns: [{ by: 'a', send: 'My pick is {b}.' }], beat: '{a} stares at the message after sending it.' },
  ]),
  ...E('statement.named', [
    { turns: [{ by: 'a', react: '{b} said my name. Out loud. Before the ratings.' }], beat: '{a} sets {a.posAdj} jaw.' },
    { turns: [{ by: 'a', react: 'Okay, {b}. I heard you. Now watch where I rank you.' }] },
    { turns: [{ by: 'a', react: '{b}? I thought we were fine.' }] },
    { turns: [{ by: 'a', react: 'That is a lot of people saying my name.' }], beat: '{a} pulls a blanket over {a.posAdj} head.' },
  ]),
};

// ── Task 5: removals ───────────────────────────────────────────────────
// alert.instant / alert.double as above; block.announce.instant — the
// Circle names c, the lowest-rated, blocked at once.
export const FORMAT_LINES_4 = {
  ...E('alert.instant', [
    { turns: [{ by: 'a', react: "'The lowest-rated Player will be blocked immediately.' Immediately?" },
      { by: 'b', react: 'No Hangout. No Influencers. Just the number.' }] },
    { turns: [{ by: 'a', react: "'There will be no Influencers tonight.' Then who blocks?" },
      { by: 'b', say: 'The ratings do. Whoever comes last is gone.' }] },
    { turns: [{ by: 'a', react: 'An instant block. The ratings are the whole thing tonight.' },
      { by: 'b', react: 'Every single rank matters. Every single one.' }], beat: '{b} rereads the rule twice.' },
  ]),
  ...E('alert.double', [
    { turns: [{ by: 'a', react: "'Tonight, two Players will be blocked.' Two?" },
      { by: 'b', react: 'Two people go home tonight. Two.' }] },
    { turns: [{ by: 'a', react: "'This will be a double blocking.' Oh no. Oh no, no, no." },
      { by: 'b', say: 'Nobody is safe tonight. Nobody.' }] },
    { turns: [{ by: 'a', react: 'A double blocking. The building is about to get a lot quieter.' },
      { by: 'b', react: 'I need to sit down for this.' }], beat: '{b} sits down on the floor.' },
  ]),
  ...E('block.announce.instant', [
    { turns: [{ by: 'host', say: 'The lowest-rated Player tonight is {c}. {c}, you have been blocked immediately.' }], beat: 'Every apartment goes quiet.' },
    { turns: [{ by: 'host', say: 'With the lowest rating, {c} has been blocked from The Circle, effective now.' }] },
    { turns: [{ by: 'host', say: '{c}, you finished last in the ratings. You are blocked.' }], beat: '{c} reads it, and then reads it again.' },
  ]),
};

// goodbye.video.close — a, on video, before the screen goes dark: what they
// learned, and good luck (spec 11.2 steps 5-6).
export const GOODBYE_CLOSE = {
  ...E('goodbye.video.close', [
    { turns: [{ by: 'a', video: "Trust your gut in there. Mine was right more than I let it be. Good luck, everybody." }] },
    { turns: [{ by: 'a', video: 'Play hard, but be nice to each other. It is still just people in there. Good luck.' }] },
    { turns: [{ by: 'a', video: 'Somebody in there is not who they say they are. Be careful. Good luck.' }] },
    { turns: [{ by: 'a', video: "I don't regret a single message. Okay, maybe one. Good luck, everybody." }], beat: '{a} laughs and waves at the camera.' },
    { turns: [{ by: 'a', video: 'Talk to everybody. That is the whole game. Good luck.' }] },
    { turns: [{ by: 'a', video: "I'm going to miss this weird little building. Win it for me." }], beat: '{a} blows a kiss at the camera.' },
    { turns: [{ by: 'a', video: 'Keep your friends close and your ratings closer. Good luck, Circle.' }] },
    { turns: [{ by: 'a', video: 'To everybody still in there: make it count. Good luck.' }] },
    { turns: [{ by: 'a', video: 'Be yourself in there. It is harder than it sounds. Good luck, everybody.' }] },
    { turns: [{ by: 'a', video: "That's it from me. Circle, it's been real. Mostly." }], beat: '{a} gives a little salute before the screen goes dark.' },
  ]),
};

// ── Task 6: antivirus ──────────────────────────────────────────────────
// antivirus.open — a and b, the newcomers holding it. antivirus.pass — a
// passes it to b. antivirus.got — a (safe now) about b (who passed it).
// antivirus.left — a, the one who never got it. block.announce.antivirus —
// the Circle names c.
export const ANTIVIRUS_LINES = {
  ...E('alert.antivirus', [
    { turns: [{ by: 'a', react: "'There has been a data breach.' A what?" },
      { by: 'b', react: "'Only Players with the antivirus will be safe.' Okay, now I'm scared." }] },
    { turns: [{ by: 'a', react: "'The newest Players hold the antivirus.' The new people? They barely know us." },
      { by: 'b', say: 'So the people who just walked in decide who stays. Great.' }] },
    { turns: [{ by: 'a', react: "'Whoever does not receive the antivirus will be blocked.'" },
      { by: 'b', react: 'Pass it to me. Somebody. Anybody.' }], beat: '{b} stares at the screen, willing it to light up.' },
  ]),
  ...E('antivirus.open', [
    { turns: [{ by: 'a', react: "I'm holding the antivirus? Me? I've been here five minutes." },
      { by: 'b', react: 'Every single person in this building is about to be very nice to us.' }] },
    { turns: [{ by: 'a', say: 'No pressure. Just deciding who gets to stay.' }, { by: 'b', say: "Choose with your gut. That's all we have." }] },
    { turns: [{ by: 'a', react: 'Okay. Who has been good to me so far?' }, { by: 'b', react: "I know exactly who I'm sending it to." }],
      beat: 'Two new apartments, two people scrolling the same list.' },
  ]),
  ...E('antivirus.pass', [
    { turns: [{ by: 'a', send: "Sending the antivirus to {b}. You're safe." }] },
    { turns: [{ by: 'a', say: 'This one is easy.', send: '{b}, antivirus is yours.' }] },
    { turns: [{ by: 'a', send: 'Passing it to {b}. You looked out for me. I look out for you.' }] },
    { turns: [{ by: 'a', send: "{b}. You're protected." }], beat: '{a} sends it and leans back.' },
    { turns: [{ by: 'a', send: 'My antivirus goes to {b}.' }] },
    { turns: [{ by: 'a', say: "Okay. Don't overthink it.", send: 'Antivirus to {b}.' }] },
    { turns: [{ by: 'a', send: '{b}, you are safe. Now pass it on.' }] },
    { turns: [{ by: 'a', send: 'Sending it to {b}. I hope that means something to you.' }] },
  ]),
  ...E('antivirus.got', [
    { turns: [{ by: 'a', react: "{b} sent it to me! I'm safe! I'm safe!" }], beat: '{a} jumps up off the couch.' },
    { turns: [{ by: 'a', react: 'Oh thank God. Thank you, {b}. I will never forget that.' }] },
    { turns: [{ by: 'a', react: "I'm safe. And now I have to choose. Oh no." }], beat: "{a}'s relief lasts about a second." },
    { turns: [{ by: 'a', react: '{b} picked me. Okay. Who do I pick?' }] },
    { turns: [{ by: 'a', react: 'Safe. Breathing again. Okay.' }], beat: '{a} presses a hand to {a.posAdj} chest.' },
  ]),
  ...E('antivirus.left', [
    { turns: [{ by: 'a', react: "Nobody sent it to me. Nobody." }], beat: '{a} stares at the list, every name but {a.posAdj} own.' },
    { turns: [{ by: 'a', react: "I'm the last one. I'm the only one without it." }] },
    { turns: [{ by: 'a', react: 'Every single person had a chance to pick me. And nobody did.' }], beat: '{a} sets the tablet down.' },
  ]),
  // block.react.numbers — a reacts to b being blocked by the ratings alone.
  ...E('block.react.numbers', [
    { turns: [{ by: 'a', react: 'Nobody even chose. The numbers just did it.' }], beat: '{a} stares at the screen.' },
    { turns: [{ by: 'a', react: 'That is so cold. No Hangout, no speeches, just gone.' }] },
    { turns: [{ by: 'a', react: "{b} didn't even get to plead. That's brutal." }] },
    { turns: [{ by: 'a', say: 'So every rank I gave tonight actually mattered. Every one.' }], beat: '{a} sits down slowly.' },
    { turns: [{ by: 'a', react: 'We all did that. All of us. Together.' }] },
    { turns: [{ by: 'a', react: "Last place, and that's it? Wow. Bye, {b}." }] },
  ]),
  // block.react.unsaved — a, after b was the only one nobody saved.
  ...E('block.react.unsaved', [
    { turns: [{ by: 'a', react: 'Everybody got saved except {b}. That is so rough.' }], beat: '{a} puts the tablet down.' },
    { turns: [{ by: 'a', react: "I watched {b}'s name sit there, save after save. I couldn't breathe for {b.obj}." }] },
    { turns: [{ by: 'a', react: 'Last one standing. The worst place to be standing.' }] },
    { turns: [{ by: 'a', say: 'Every save was a choice not to save {b}. We all watched it happen.' }] },
    { turns: [{ by: 'a', react: 'Poor {b}. Nobody picked {b.obj}. Not one person.' }], beat: '{a} shakes {a.posAdj} head slowly.' },
  ]),
  ...E('block.announce.antivirus', [
    { turns: [{ by: 'host', say: '{c} did not receive the antivirus. {c}, you have been blocked.' }], beat: 'Every apartment goes quiet.' },
    { turns: [{ by: 'host', say: 'Every Player is protected except one. {c} has been blocked from The Circle.' }] },
    { turns: [{ by: 'host', say: 'Without the antivirus, {c} is blocked.' }], beat: '{c} reads it alone.' },
  ]),
};

// ── Task 7: arrivals ───────────────────────────────────────────────────
// date.pick — a (newcomer) chooses b for the date. date.chat — a and b on
// the date. date.gift — a sends b a gift. date.passed — a (offered, not
// chosen) about b (newcomer). invites.first / .next — a (newcomer) invites
// b. invites.last — a (never invited) about b (newcomer). race.win — a got
// to b (newcomer) first; race.lose — a was too slow for b. newparty.throw —
// a (newcomer) plans it; newparty.guest — a (guest) at b's party;
// newparty.left — a (not invited) about b's party. lurk.watch — a
// (newcomer) watching unseen; lurk.reveal — a finds out b was watching.
// chosen.offer — a (Influencer) looks at the two profiles; chosen.pick — a
// lets b in; chosen.thanks — a (newcomer) about b (Influencer).
// pairarrival.chat — a and b, two newcomers, before anyone else.
export const ARRIVAL_LINES = {
  ...E('date.pick', [
    { turns: [{ by: 'a', react: "'Choose one Player to take on a date.' Three options. Okay." }, { by: 'a', say: "{b}. It has to be {b}." }] },
    { turns: [{ by: 'a', say: 'Everybody says {b} is the one to know. So, {b}.' }], beat: '{a} taps {b}\'s picture.' },
    { turns: [{ by: 'a', react: 'A date? On my first day? Fine. {b}.' }] },
  ]),
  ...E('date.chat', [
    { turns: [{ by: 'a', send: 'So this is our date. Candlelight emoji. Very classy' }, { by: 'b', send: 'I dressed up for this, just so you know' },
      { by: 'a', send: 'Honestly? Best first date I have had in months' }] },
    { turns: [{ by: 'a', send: "I picked you because everyone says you're the real deal" }, { by: 'b', send: "Well, now I have to live up to that" },
      { by: 'a', send: "You're doing great so far {e:wink}" }] },
    { turns: [{ by: 'b', send: 'So why me? Honest answer' }, { by: 'a', send: 'Your profile made me smile. That is it. That is the reason' },
      { by: 'b', send: 'Okay that is actually really sweet' }] },
  ]),
  ...E('date.gift', [
    { turns: [{ by: 'b', react: 'There is a box at my door. A gift? From {a}?' }], beat: '{b} tears the wrapping off.' },
    { turns: [{ by: 'b', react: "{a} sent me a teddy bear the size of the couch. I'm keeping it forever." }] },
    { turns: [{ by: 'b', react: 'A gift! Nobody has sent me anything in here. Thank you, {a}.' }], beat: '{b} hugs the box.' },
  ]),
  ...E('date.passed', [
    { turns: [{ by: 'a', react: 'I was one of the three. And {b} picked someone else.' }] },
    { turns: [{ by: 'a', react: "So close. Okay. {b} doesn't know what {b.sub}'s missing." }], beat: '{a} flops back on the couch.' },
    { turns: [{ by: 'a', react: 'Passed over by the new person on day one. Cool. Cool cool.' }] },
  ]),
  ...E('invites.first', [
    { turns: [{ by: 'a', send: 'Hi {b}! You are my very first chat in here' }, { by: 'b', send: "First? I'm honored" },
      { by: 'a', send: 'You should be {e:laugh}' }] },
    { turns: [{ by: 'a', say: 'Start with the one everyone likes.', send: "Hey {b}! I'm new. Show me the ropes?" }, { by: 'b', send: 'Rule one: talk to me first. Oh wait, you did' }] },
    { turns: [{ by: 'a', send: "{b}, I've heard a lot about you. All good things" }, { by: 'b', send: "Only good things? I'll take it" }] },
  ]),
  ...E('invites.next', [
    { turns: [{ by: 'a', send: 'Hi {b}! Your turn. How are you?' }, { by: 'b', send: "Good! Glad I made the list" }] },
    { turns: [{ by: 'a', send: 'Hey {b}, just wanted to say hi properly' }, { by: 'b', send: 'Hi properly! Welcome in' }] },
    { turns: [{ by: 'a', send: "{b}! Okay, tell me one thing I need to know about this place" }, { by: 'b', send: 'Everyone is nice. Nobody is safe' }] },
    { turns: [{ by: 'a', send: 'Hi {b}. Quick hello before I lose track of everyone' }, { by: 'b', send: "Lol it's a lot. You'll figure it out" }] },
  ]),
  ...E('invites.last', [
    { turns: [{ by: 'a', react: '{b} invited four people. Not me. I am not taking that personally. I am taking it very personally.' }] },
    { turns: [{ by: 'a', react: 'Still waiting for my invite from {b}. Still waiting.' }], beat: '{a} refreshes the screen.' },
    { turns: [{ by: 'a', react: "Everybody got a chat with {b} except me. Noted." }] },
  ]),
  ...E('race.win', [
    { turns: [{ by: 'a', react: 'First! I got to {b} first!' }, { by: 'a', send: 'Hey {b}! Welcome! I was the fastest, just so you know' },
      { by: 'b', send: 'I saw! That was impressive' }], beat: '{a} throws both arms in the air.' },
    { turns: [{ by: 'a', say: 'Type, type, type!', send: 'Hi {b}!!' }, { by: 'b', send: 'You were so fast lol. Hi!' }] },
    { turns: [{ by: 'a', react: 'Nobody types faster than me. Nobody.' }, { by: 'a', send: 'Welcome {b}! You are stuck with me now' },
      { by: 'b', send: "Happily stuck. Hi!" }] },
  ]),
  ...E('race.lose', [
    { turns: [{ by: 'a', react: 'Too slow. Somebody beat me to {b}. Of course.' }], beat: '{a} drops the tablet onto the couch.' },
    { turns: [{ by: 'a', react: 'I was typing! I was typing!' }] },
    { turns: [{ by: 'a', react: "Second place in a race to say hi. That's a new low." }] },
  ]),
  ...E('newparty.throw', [
    { turns: [{ by: 'a', react: "'You must throw a party tonight.' On my first night? No pressure." },
      { by: 'a', say: "Okay. Who's on the list and who isn't. This is going to hurt somebody." }], beat: '{a} pulls up the list of names.' },
    { turns: [{ by: 'a', say: 'Party at mine! Invite-only. Sorry, everybody else.' }] },
    { turns: [{ by: 'a', react: 'My first move in this game is deciding who is NOT invited. Great.' }] },
  ]),
  ...E('newparty.guest', [
    { turns: [{ by: 'a', react: "I'm invited to {b}'s party! The new person likes me!" }], beat: '{a} puts on {a.posAdj} best shirt.' },
    { turns: [{ by: 'a', send: "{b}, best party in the building. It's not close" }, { by: 'b', send: 'Glad you came!' }] },
    { turns: [{ by: 'a', react: 'Invite-only, and I made the list. Look at me.' }] },
  ]),
  ...E('newparty.left', [
    { turns: [{ by: 'a', react: '{b} is throwing a party and I am not invited. Cool. I have my own party. With my plant.' }] },
    { turns: [{ by: 'a', react: "Half the building is at {b}'s party. I'm in the other half." }], beat: '{a} can hear the music through the wall.' },
    { turns: [{ by: 'a', react: "{b} doesn't even know me yet and I'm already off the list." }] },
  ]),
  ...E('lurk.watch', [
    { turns: [{ by: 'a', react: "They have no idea I'm here. None." }, { by: 'a', say: 'Okay. Who is running this place?' }], beat: '{a} leans in close to the screen.' },
    { turns: [{ by: 'a', say: 'I can see everything and nobody can see me. I love this.' }] },
    { turns: [{ by: 'a', say: "Taking notes. Who's strong, who's struggling, who's lying." }], beat: '{a} writes names on a notepad.' },
  ]),
  ...E('lurk.reveal', [
    { turns: [{ by: 'a', react: '{b} was watching us this whole time? That is creepy. That is genius.' }] },
    { turns: [{ by: 'a', react: 'Wait. {b} saw everything? Everything we said?' }], beat: '{a} scrolls back through the day, horrified.' },
    { turns: [{ by: 'a', react: 'So {b} walks in already knowing everything. Great. Love that.' }] },
  ]),
  ...E('chosen.offer', [
    { turns: [{ by: 'a', react: "'Influencers, choose which new Player will enter.' Two profiles. One spot." }], beat: '{a} looks from one picture to the other.' },
    { turns: [{ by: 'a', say: 'I get to decide who comes in? That is so much power for a Tuesday.' }] },
    { turns: [{ by: 'a', react: 'Two new faces. Whoever I pick is going to owe me.' }] },
  ]),
  ...E('chosen.pick', [
    { turns: [{ by: 'a', say: '{b}. Something about that profile. {b} gets in.' }] },
    { turns: [{ by: 'a', say: "I'm letting {b} in. I hope {b} remembers who did." }], beat: '{a} presses the button.' },
    { turns: [{ by: 'a', say: 'It has to be {b}. Final answer.' }] },
  ]),
  ...E('chosen.thanks', [
    { turns: [{ by: 'a', send: 'I heard you picked me to come in. Thank you {b}' }, { by: 'b', send: 'Of course! I had a good feeling about you' }] },
    { turns: [{ by: 'a', react: '{b} chose me. I am going to remember that.' }] },
    { turns: [{ by: 'a', send: "{b}! You're the reason I'm here. I owe you" }, { by: 'b', send: "Don't make me regret it lol" }] },
  ]),
  ...E('pairarrival.chat', [
    { turns: [{ by: 'a', send: 'Hi! Are you new too?' }, { by: 'b', send: 'Brand new. We should stick together' },
      { by: 'a', send: 'Deal. Two new people, one plan' }] },
    { turns: [{ by: 'a', send: 'Okay, before we go in there. You and me?' }, { by: 'b', send: "You and me. Nobody's splitting us up" },
      { by: 'a', send: "Let's go meet everybody" }], beat: 'Two new apartments, two people taking a deep breath.' },
    { turns: [{ by: 'b', send: 'So we walk in already allies. That is a cheat code' }, { by: 'a', send: "Don't tell anyone" },
      { by: 'b', send: 'My lips are sealed {e:wink}' }] },
  ]),
};
