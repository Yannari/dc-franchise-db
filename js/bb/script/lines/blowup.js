// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/blowup.js — a blow-up that says what it is about
// ══════════════════════════════════════════════════════════════════════
//
// The read of 2026-10-14: "Zee throws a cushion across the room." "It was supposed to make a point!"
// The point was never said. A blow-up (bb-events/social.js) now carries the grievance a holds against
// b, as a family (GRUDGE_KIND), and bb/script/write.js picks `talk.confront.about-<family>` when it
// exists. Each fight names its subject in its first two lines. a = the one who goes off, b = the one
// it is aimed at. In a shared room, in front of the house.

export default {
  'talk.confront.about-house': [
    { id: 'tb.h1', turns: [
      { beat: '{a} holds up a frying pan with last night’s dinner still welded to it.' },
      { by: 'a', say: "Whose is this? Actually, don't answer. I know whose it is." },
      { by: 'b', say: "I was going to do it." },
      { by: 'a', say: "You were going to do it yesterday. You were going to do it the day before." },
      { by: 'b', say: "It's a pan! Why are you shouting about a pan?" },
      { by: 'a', say: "Because I'm the one who ends up washing it! Every time!" },
    ] },
    { id: 'tb.h2', turns: [
      { by: 'a', say: "There's a wet towel on my bed. Again. That's your towel, {b}." },
      { by: 'b', say: "It was one towel." },
      { by: 'a', say: "It's never one towel with you. It's the towel and the cups and the shoes in the doorway." },
      { by: 'b', say: "Then move them!" },
      { by: 'a', say: "I'm not your mum!" },
    ] },
    { id: 'tb.h3', turns: [
      { by: 'a', say: "Somebody ate the last of the eggs. We're on slop till Friday and somebody ate the eggs." },
      { by: 'b', say: "I had two. Two eggs." },
      { by: 'a', say: "There were three left, {b}! For eleven people!" },
      { by: 'b', say: "Then put a sign on them!" },
    ] },
    { id: 'tb.h4', turns: [{ by: 'a', say: "Who used my mug and left it in the sink with the teabag still in it?" }, { by: 'b', say: "It's a mug. There are twelve mugs." }, { by: 'a', say: "And you used the one with my name on it!" }, { by: 'b', say: "I didn't read it!" }, { by: 'a', say: "It's in capital letters!" }] },
    { id: 'tb.h5', turns: [{ by: 'a', say: "The bathroom, {b}. Again. Hair in the sink, towels on the floor." }, { by: 'b', say: "Oh, here we go." }, { by: 'a', say: "Yes, here we go! I'm the one who cleaned it this morning!" }, { by: 'b', say: "Nobody asked you to." }, { by: 'a', say: "Somebody had to!" }] },
    { id: 'tb.h6', turns: [{ beat: "{a} drops a stack of dirty plates into the sink, hard." }, { by: 'a', say: "These are yours. All of them. From today." }, { by: 'b', say: "I was getting to them." }, { by: 'a', say: "You're always getting to them. You never get there." }, { by: 'b', say: "They're plates! Calm down!" }] },
  ],
  'talk.confront.about-humiliation': [
    { id: 'tb.u1', turns: [
      { by: 'a', say: "Say it again. The joke. The one about me. Say it now, while I'm standing here." },
      { by: 'b', say: "It was a joke. Everybody laughed." },
      { by: 'a', say: "Everybody laughed at me! That's the whole point!" },
      { by: 'b', say: "You're making this so much bigger than it was." },
      { by: 'a', say: "You made it big. In front of the whole kitchen." },
    ] },
    { id: 'tb.u2', turns: [
      { by: 'a', say: "Don't ever do an impression of me again. Ever." },
      { by: 'b', say: "Oh my god, it was funny!" },
      { by: 'a', say: "It was funny to you. You made me look stupid in front of people I'm trying to work with." },
      { by: 'b', say: "Maybe don't give me so much material." },
    ] },
    { id: 'tb.u3', turns: [{ by: 'a', say: "You laughed. When I fell in the comp, you laughed, in front of everybody." }, { by: 'b', say: "Everybody laughed! It was funny!" }, { by: 'a', say: "You were the loudest!" }, { by: 'b', say: "Then I'm a loud laugher. Sue me." }] },
    { id: 'tb.u4', turns: [{ by: 'a', say: "Tell everybody what you called me at dinner. Go on. Not everybody heard it." }, { by: 'b', say: "It was a joke, and you know it." }, { by: 'a', say: "Then say it again. Make everybody laugh again." }, { by: 'b', say: "...No." }, { by: 'a', say: "Thought not." }] },
    { id: 'tb.u5', turns: [{ by: 'a', say: "You told the whole kitchen I cried in the storage room." }, { by: 'b', say: "You did cry in the storage room." }, { by: 'a', say: "That's not the point! That was mine to tell!" }, { by: 'b', say: "There's no such thing as yours to tell in here." }] },
    { id: 'tb.u6', turns: [{ by: 'a', say: "I'm not a punchline, {b}. Stop using me as one." }, { by: 'b', say: "Oh my god. It's banter." }, { by: 'a', say: "It's banter when I'm laughing. Look at my face. Am I laughing?" }] },
  ],
  'talk.confront.about-lie': [
    { id: 'tb.l1', turns: [
      { by: 'a', say: "You told me you were voting with us. You looked at me and said it." },
      { by: 'b', say: "Keep your voice down." },
      { by: 'a', say: "No! You lied to my face, so you can hear this to your face!" },
      { by: 'b', say: "I didn't lie. Things changed." },
      { by: 'a', say: "Things changed after you'd already lied!" },
    ] },
    { id: 'tb.l2', turns: [
      { by: 'a', say: "Three people. Three people told me what you've been saying about me." },
      { by: 'b', say: "And you believe them over me?" },
      { by: 'a', say: "Yes! Because they all said the same thing!" },
      { by: 'b', say: "Then they all heard it wrong." },
    ] },
    { id: 'tb.l3', turns: [{ by: 'a', say: "You said you hadn't talked to anybody about the vote. I've just talked to three people you talked to." }, { by: 'b', say: "That's different." }, { by: 'a', say: "How is that different?" }, { by: 'b', say: "They came to me!" }] },
    { id: 'tb.l4', turns: [{ by: 'a', say: "Did you or did you not tell people I'm coming after them?" }, { by: 'b', say: "I said you might be." }, { by: 'a', say: "I'm not! I never was! Now half the house won't sit next to me!" }] },
    { id: 'tb.l5', turns: [{ by: 'a', say: "You've lied to me twice, and you're doing it again right now!" }, { by: 'b', say: "Name one time." }, { by: 'a', say: "The vote! You looked me in the eye and told me my name wasn't coming up!" }, { by: 'b', say: "That's not a lie, that's the game!" }] },
    { id: 'tb.l6', turns: [{ by: 'a', say: "I defended you. People told me you were lying, and I said no, not {b}." }, { by: 'b', say: "I know. And I appreciate that." }, { by: 'a', say: "Don't appreciate it! You were lying!" }] },
  ],
  'talk.confront.about-betrayal': [
    { id: 'tb.b1', turns: [
      { by: 'a', say: "I trusted you. I told you everything, and you took it straight to the other side." },
      { by: 'b', say: "It's a game. Everybody's playing it." },
      { by: 'a', say: "Don't. Don't say it's a game, like that makes it fine." },
      { by: 'b', say: "What do you want me to say?" },
      { by: 'a', say: "I want you to admit you sold me out!" },
    ] },
    { id: 'tb.b2', turns: [
      { by: 'a', say: "You were the one person I didn't check on. The one person." },
      { by: 'b', say: "I had to protect myself." },
      { by: 'a', say: "By going behind my back? With them?" },
      { by: 'b', say: "You'd have done the same." },
      { by: 'a', say: "No. I wouldn't. That's the difference between us." },
    ] },
    { id: 'tb.b3', turns: [{ by: 'a', say: "We had a plan. Our plan. And you took it straight to the other side of the house." }, { by: 'b', say: "I didn't take it anywhere." }, { by: 'a', say: "Then how do they know every word of it?" }, { by: 'b', say: "Maybe they guessed." }, { by: 'a', say: "Nobody guesses that well!" }] },
    { id: 'tb.b4', turns: [{ by: 'a', say: "I covered for you. Twice. And the first chance you got, you threw me under the bus." }, { by: 'b', say: "That's not how it happened." }, { by: 'a', say: "That's exactly how it happened, and everybody in here knows it." }] },
    { id: 'tb.b5', turns: [{ by: 'a', say: "Was any of it real? Any of it?" }, { by: 'b', say: "Of course it was real." }, { by: 'a', say: "Then why am I the last one to find out what you've been doing?" }, { by: 'b', say: "Because I knew you'd react like this!" }] },
    { id: 'tb.b6', turns: [{ by: 'a', say: "You picked them. Fine. Just don't come and sit with me at dinner like you didn't." }, { by: 'b', say: "I can sit where I want." }, { by: 'a', say: "Then go and sit with them!" }] },
  ],
  'talk.confront.about-vote': [
    { id: 'tb.v1', turns: [
      { by: 'a', say: "You put me on that block, and now you want to sit next to me at dinner like nothing happened?" },
      { by: 'b', say: "It was one week. You're still here." },
      { by: 'a', say: "No thanks to you!" },
      { by: 'b', say: "It wasn't personal." },
      { by: 'a', say: "It felt personal from the chair!" },
    ] },
    { id: 'tb.v2', turns: [
      { by: 'a', say: "Just say it. You voted against me. Say it out loud." },
      { by: 'b', say: "Votes are private." },
      { by: 'a', say: "That's a yes. That's always a yes." },
      { by: 'b', say: "Think what you want." },
    ] },
    { id: 'tb.v3', turns: [{ by: 'a', say: "You told me I had your vote. To my face. And then you wrote my name." }, { by: 'b', say: "Things changed." }, { by: 'a', say: "In one night?" }, { by: 'b', say: "In this house? Yes!" }] },
    { id: 'tb.v4', turns: [{ by: 'a', say: "I sat in that chair because of you, and now you want me to pass you the salt?" }, { by: 'b', say: "It's salt." }, { by: 'a', say: "It's not about the salt!" }] },
    { id: 'tb.v5', turns: [{ by: 'a', say: "You could have kept me off that block. You had every chance." }, { by: 'b', say: "And put somebody else up?" }, { by: 'a', say: "Yes! Anybody else!" }, { by: 'b', say: "That's not how it works, and you know it." }] },
    { id: 'tb.v6', turns: [{ by: 'a', say: "Everybody knows how you voted. You're the only one still pretending." }, { by: 'b', say: "I'm not pretending anything." }, { by: 'a', say: "Then say it! Say whose name you wrote!" }, { by: 'b', say: "It's none of your business!" }] },
  ],
  'talk.confront.about-promise': [
    { id: 'tb.p1', turns: [
      { by: 'a', say: "We shook on it. Do you remember that? You shook my hand." },
      { by: 'b', say: "That was weeks ago. Everything's different now." },
      { by: 'a', say: "A promise doesn't come with an expiry date!" },
      { by: 'b', say: "In here it does." },
    ] },
    { id: 'tb.p2', turns: [
      { by: 'a', say: "You promised me. Final two. Your words, not mine." },
      { by: 'b', say: "And I meant it when I said it." },
      { by: 'a', say: "And now?" },
      { by: 'b', say: "Now I have to look after my own game." },
      { by: 'a', say: "Then you never meant it!" },
    ] },
    { id: 'tb.p3', turns: [{ by: 'a', say: "You swore. You actually swore on your family." }, { by: 'b', say: "Don't bring my family into this." }, { by: 'a', say: "You brought them into it! When you swore!" }] },
    { id: 'tb.p4', turns: [{ by: 'a', say: "Remember what you said to me in the storage room? Because I do. Every word." }, { by: 'b', say: "That was before." }, { by: 'a', say: "Before what? Before it got inconvenient?" }] },
    { id: 'tb.p5', turns: [{ by: 'a', say: "I kept my side. I kept it when it cost me. You couldn't keep yours for a week." }, { by: 'b', say: "I didn't have a choice." }, { by: 'a', say: "You always have a choice!" }] },
    { id: 'tb.p6', turns: [{ by: 'a', say: "Your word means nothing. I want everybody in this room to hear that." }, { by: 'b', say: "Fine. Shout it. It doesn't make it true." }, { by: 'a', say: "I don't need to make it true. You already did." }] },
  ],
  'talk.confront.about-left-out': [
    { id: 'tb.o1', turns: [
      { by: 'a', say: "Everybody was in that room except me. I saw the door shut." },
      { by: 'b', say: "It wasn't a meeting. It was a chat." },
      { by: 'a', say: "About the vote! A chat about the vote, and nobody thought to get me?" },
      { by: 'b', say: "You weren't around!" },
      { by: 'a', say: "I was in the kitchen! It's ten feet away!" },
    ] },
    { id: 'tb.o2', turns: [
      { by: 'a', say: "Am I in this group or not? Because I keep finding out things last." },
      { by: 'b', say: "You're in it. Calm down." },
      { by: 'a', say: "Don't tell me to calm down while you're deciding things without me!" },
    ] },
    { id: 'tb.o3', turns: [{ by: 'a', say: "Why do I find out the plan from somebody who isn't even in it?" }, { by: 'b', say: "Because it changed fast." }, { by: 'a', say: "Not that fast. You had time to tell everybody else!" }] },
    { id: 'tb.o4', turns: [{ by: 'a', say: "You all went quiet when I walked in. Again." }, { by: 'b', say: "We were talking about food." }, { by: 'a', say: "For twenty minutes? About food?" }, { by: 'b', say: "...It was a big conversation." }] },
    { id: 'tb.o5', turns: [{ by: 'a', say: "I'm sick of being the last person to know things in this house." }, { by: 'b', say: "Then be around more!" }, { by: 'a', say: "I'm always around! You just never come and find me!" }] },
    { id: 'tb.o6', turns: [{ by: 'a', say: "Was there a meeting? Because everybody's acting like there was a meeting." }, { by: 'b', say: "There wasn't a meeting." }, { by: 'a', say: "Then why does everybody know the plan except me?" }] },
  ],
  'talk.confront.about-plan': [
    { id: 'tb.n1', turns: [
      { by: 'a', say: "I heard my name. Through the wall. You and your little plan." },
      { by: 'b', say: "You heard wrong." },
      { by: 'a', say: "I heard 'next week' and I heard my name. Tell me which part I got wrong." },
      { by: 'b', say: "You're being paranoid." },
      { by: 'a', say: "It's not paranoid if it's true!" },
    ] },
    { id: 'tb.n2', turns: [
      { by: 'a', say: "If you want me out, at least have the guts to say it where I can hear it." },
      { by: 'b', say: "Nobody said that." },
      { by: 'a', say: "You've said it to everybody but me!" },
    ] },
    { id: 'tb.n3', turns: [{ by: 'a', say: "My name's been in every whisper in this house, and every one of them started with you." }, { by: 'b', say: "That's paranoid." }, { by: 'a', say: "Three people told me! Three!" }] },
    { id: 'tb.n4', turns: [{ by: 'a', say: "You want me gone. Just say it. I'd respect you more if you just said it." }, { by: 'b', say: "Fine. I want you gone." }, { by: 'a', say: "...Thank you. Was that so hard?" }] },
    { id: 'tb.n5', turns: [{ by: 'a', say: "Is it true you're counting votes against me?" }, { by: 'b', say: "Who told you that?" }, { by: 'a', say: "That's not a no!" }, { by: 'b', say: "It's not a yes either!" }] },
    { id: 'tb.n6', turns: [{ by: 'a', say: "If you're coming after me, come after me. Stop sending other people to do it." }, { by: 'b', say: "I'm not sending anybody." }, { by: 'a', say: "Then why does everybody you talk to come and ask me the same question?" }] },
  ],
  'talk.confront.about-friction': [
    { id: 'tb.f1', turns: [
      { by: 'a', say: "Every single thing I say, you roll your eyes. Every single thing." },
      { by: 'b', say: "I didn't even—" },
      { by: 'a', say: "You just did it again!" },
      { by: 'b', say: "Then stop saying things worth rolling my eyes at!" },
    ] },
    { id: 'tb.f2', turns: [
      { by: 'a', say: "Can you not? For one day? Can you not have a comment about everything I do?" },
      { by: 'b', say: "I said your eggs were runny. That's not a comment, that's a fact." },
      { by: 'a', say: "It's every day! It's the eggs, it's my voice, it's how I fold a towel!" },
      { by: 'b', say: "Then fold it properly!" },
    ] },
    { id: 'tb.f3', turns: [
      { by: 'a', say: "I'm done. I've been biting my tongue since we walked in, and I'm done." },
      { by: 'b', say: "Biting your tongue? You've never bitten your tongue in your life." },
      { by: 'a', say: "You see? That! That's what I'm talking about!" },
    ] },
    { id: 'tb.f4', turns: [{ by: 'a', say: "Do you have to sigh every time I sit down?" }, { by: 'b', say: "I'm allowed to breathe." }, { by: 'a', say: "That wasn't breathing. That was a comment." }] },
    { id: 'tb.f5', turns: [{ by: 'a', say: "I'm sick of walking on eggshells around you." }, { by: 'b', say: "Nobody asked you to walk on anything." }, { by: 'a', say: "Every single conversation with you ends like this!" }, { by: 'b', say: "Then stop starting them!" }] },
    { id: 'tb.f6', turns: [{ by: 'a', say: "Morning, {b}." }, { by: 'b', say: "If you say so." }, { by: 'a', say: "See? That! Every morning! I say good morning and you make it a fight!" }] },
  ],
};
