// Private chats, part two: fishing for information, comparing notes,
// planting suspicion, claiming credit, making up, confronting, confessing,
// and testing whether someone is real. Data only.
//
// {c} is a third player, filled ONLY from a claim this chat carried (the
// engine decides what was said). An entry that names {c} must declare the
// claim kind it depends on in `when`. Entries without `when` name nobody.
export const CHAT_B = {
  'chat.pump.warm': [
    { id: 'chat.pump.warm.01', turns: [
      { by: 'a', say: "{b} was in the middle of everything last night. {b.Sub} knows something.", send: "Okay spill. What was last night like for you?" },
      { by: 'b', react: "Oh, {a} wants the tea.", send: "Intense lol. I'm still processing honestly" },
      { by: 'a', send: "I bet. You can tell me anything, you know that" },
      { by: 'b', send: "I know {e:heart} Just be careful who you trust right now" },
    ], beat: '{a} leans closer to the screen as if it will say more.' },
    { id: 'chat.pump.warm.02', when: { claim: 'targeting' }, turns: [
      { by: 'a', send: "Be honest with me. Is anybody coming after me?" },
      { by: 'b', react: "Do I tell {a.obj}? I have to.", send: "I wasn't gonna say anything but... {c} has your name in {c.posAdj} mouth" },
      { by: 'a', react: "I knew it.", send: "I KNEW it. Thank you for telling me {e:pray}" },
      { by: 'b', send: "Don't say it came from me" },
    ], beat: '{a} gets up and paces the length of the living room.' },
    { id: 'chat.pump.warm.03', when: { claim: 'distrusts' }, turns: [
      { by: 'a', send: "What's the word on me right now? You can be honest" },
      { by: 'b', react: "This is gonna hurt.", send: "Honestly? {c} doesn't fully trust you. I heard it straight up" },
      { by: 'a', react: "Wow. Okay.", send: "Wow. I really thought {c} and I were good" },
      { by: 'b', send: "I know. I'm sorry {e:sad}" },
    ], beat: '{a} sits in silence for a moment, then writes a name on the notepad.' },
    { id: 'chat.pump.warm.04', when: { claim: 'catfish' }, turns: [
      { by: 'a', send: "Okay I have to ask. Who do you think isn't real in here?" },
      { by: 'b', react: "Oh, I have a list of one.", send: "I'm not 100% but... {c}. Something doesn't add up" },
      { by: 'a', react: "Not just me, then.", send: "I was thinking the same thing {e:eyes}" },
    ], beat: '{a} and {b} both close the chat and open the same profile.' },
    { id: 'chat.pump.warm.05', when: { claim: 'ally' }, turns: [
      { by: 'a', send: "Who's close with who right now? I feel like I'm missing something" },
      { by: 'b', send: "I'm pretty sure {c} has a group chat going. You didn't hear it from me" },
      { by: 'a', react: "A group chat. Without me.", send: "Noted. Thank you {e:detective}" },
    ], beat: '{a} leaves the chat and says "of course they do" to nobody.' },
    { id: 'chat.pump.warm.06', turns: [
      { by: 'a', say: "{b} talks to everybody. If anyone knows what's going on, it's {b}.", send: "Okay be honest. What's everybody saying in here?" },
      { by: 'b', react: "Should I tell {a.obj}? Okay, a little.", send: "Lol a lot. People are starting to pick sides" },
      { by: 'a', send: "And which side am I on?" },
      { by: 'b', send: "Mine {e:wink} That's all you need to know" },
    ], beat: '{a} laughs, then writes "sides" on the notepad.' },
    { id: 'chat.pump.warm.07', turns: [
      { by: 'a', send: "Real question. Am I safe right now?" },
      { by: 'b', react: "Aw. {a} is worried.", send: "With me? Always. With everybody else? I'd keep talking to people" },
      { by: 'a', send: "Okay. That's honest. Thank you {e:pray}" },
    ], beat: '{a} opens a new chat as soon as this one closes.' },
  ],
  'chat.pump.neutral': [
    { id: 'chat.pump.neutral.01', turns: [
      { by: 'a', send: "So what did you think of everything last night?" },
      { by: 'b', react: "I'm not giving that away.", send: "It was a lot. I'm keeping my head down lol" },
      { by: 'a', send: "Smart. Me too" },
    ], beat: '{a} taps a pen against {a.posAdj} teeth, not satisfied.' },
    { id: 'chat.pump.neutral.02', turns: [
      { by: 'a', say: "Let's see what {b} knows.", send: "Did anyone say anything about me? Just curious" },
      { by: 'b', send: "Not that I heard! You're good I think" },
      { by: 'a', say: "'I think.' Great." },
    ], beat: '{a} closes the chat and rereads {a.posAdj} last three conversations.' },
    { id: 'chat.pump.neutral.03', turns: [
      { by: 'a', send: "You seem to know what's going on in here. What's the vibe?" },
      { by: 'b', send: "Honestly everybody is being nice to everybody. It's scary lol" },
      { by: 'a', send: "Too nice {e:eyes}" },
    ], beat: 'Both of them look at the Circle Chat for a long time after.' },
    { id: 'chat.pump.neutral.04', turns: [
      { by: 'a', send: "Okay, spill. Who are you closest with in here?" },
      { by: 'b', react: "Nice try.", send: "Everybody! I'm a people person lol" },
      { by: 'a', say: "That's a non-answer if I ever heard one." },
    ] },
    { id: 'chat.pump.neutral.05', turns: [
      { by: 'a', send: "Have you heard anything interesting today?" },
      { by: 'b', send: "Not really. Quiet day for me" },
      { by: 'a', react: "Quiet day. In The Circle. Sure." },
    ], beat: '{a} makes a note to ask someone else.' },
    { id: 'chat.pump.neutral.06', turns: [
      { by: 'a', send: "Who do you think is running this place right now?" },
      { by: 'b', send: "Honestly I can't tell. That's what worries me" },
      { by: 'a', send: "Same. Keep me posted" },
    ] },
  ],
  'chat.pump.cold': [
    { id: 'chat.pump.cold.01', turns: [
      { by: 'a', send: "So what happened last night? You can tell me" },
      { by: 'b', react: "Why would I tell {a.obj}?", send: "I'd rather not talk about it, sorry" },
    ], beat: '{a} leaves the chat empty-handed.' },
    { id: 'chat.pump.cold.02', turns: [
      { by: 'a', send: "Anything I should know about? Anyone coming for me?" },
      { by: 'b', react: "I'm not your spy.", send: "I don't really get involved in that stuff" },
      { by: 'a', send: "Okay, no worries" },
    ], beat: '{b} shakes {b.posAdj} head and goes back to the TV.' },
    { id: 'chat.pump.cold.03', turns: [
      { by: 'a', say: "{b} knows something. {b.Sub} has to.", send: "Hey, did you hear anything interesting today?" },
      { by: 'b', send: "Nope. Nothing" },
    ], beat: '{a} leaves the chat, frowning.' },
  ],
  'chat.compare.warm': [
    { id: 'chat.compare.warm.01', turns: [
      { by: 'a', say: "Somebody's telling two different stories. Let's figure out who.", send: "Can we compare notes? I'm hearing things that don't match" },
      { by: 'b', react: "Oh, same.", send: "Yes. I've been wanting to ask you the same thing" },
      { by: 'a', send: "Tell me what you heard and I'll tell you what I heard" },
      { by: 'b', send: "Okay. Wow. That's NOT what I was told {e:shock}" },
    ], beat: 'In two apartments, two people say the same word out loud: "Liar."' },
    { id: 'chat.compare.warm.02', turns: [
      { by: 'a', send: "I think someone's playing both of us" },
      { by: 'b', react: "Tell me everything.", send: "Say more. Because I think you're right" },
      { by: 'a', send: "The story I got doesn't match yours at all" },
      { by: 'b', send: "Then somebody is lying and it isn't us {t:CaughtOut}" },
    ], beat: '{a} and {b} leave the chat on the same side.' },
    { id: 'chat.compare.warm.03', turns: [
      { by: 'a', send: "Real talk. What have you been told about me?" },
      { by: 'b', send: "Honestly? Stuff I didn't believe. You?" },
      { by: 'a', send: "Same about you. Somebody wants us fighting" },
      { by: 'b', react: "Not today.", send: "Not happening {e:muscle}" },
    ], beat: '{b} nods firmly at the screen.' },
  ],
  'chat.compare.neutral': [
    { id: 'chat.compare.neutral.01', turns: [
      { by: 'a', send: "Can I ask you something? Did you hear anything weird about me?" },
      { by: 'b', send: "Maybe a little. I didn't know what to believe" },
      { by: 'a', send: "Well, now you've heard it from me. It's not true" },
    ], beat: '{b} reads it and does not reply.' },
    { id: 'chat.compare.neutral.02', turns: [
      { by: 'a', send: "Someone's stirring the pot. Just so you know" },
      { by: 'b', send: "Honestly everybody is lol" },
      { by: 'a', send: "Fair. Just be careful" },
    ], beat: 'The chat closes with nothing settled.' },
    { id: 'chat.compare.neutral.03', turns: [
      { by: 'a', say: "Something's not adding up. Let me check with {b}.", send: "What's your read on everything right now?" },
      { by: 'b', send: "Confused. Very confused lol" },
      { by: 'a', send: "Same. Let's both keep our eyes open" },
    ], beat: '{a} writes three question marks on the notepad.' },
  ],
  'chat.compare.cold': [
    { id: 'chat.compare.cold.01', turns: [
      { by: 'a', send: "I heard something about you and I want to hear your side" },
      { by: 'b', react: "My side? Of what?", send: "I don't know what you heard but I'm not doing this" },
    ], beat: '{b} leaves the chat. {a} is left looking at an empty screen.' },
    { id: 'chat.compare.cold.02', turns: [
      { by: 'a', send: "Can we compare what we've heard?" },
      { by: 'b', send: "I think you've already made up your mind about me" },
      { by: 'a', send: "That's not true" },
      { by: 'b', send: "Okay. Talk later" },
    ], beat: '{a} sits very still on the couch.' },
    { id: 'chat.compare.cold.03', turns: [
      { by: 'a', send: "Somebody's lying and I want to know who" },
      { by: 'b', react: "Is {a.sub} accusing me?", send: "Well it's not me, so good luck" },
    ], beat: 'Both of them leave the chat angry.' },
  ],
  'chat.plant.warm': [
    { id: 'chat.plant.warm.01', when: { claim: 'catfish' }, turns: [
      { by: 'a', say: "Plant the seed. Just a little one.", send: "Can I tell you something and you keep it between us?" },
      { by: 'b', react: "Ooh.", send: "Of course. What's up?" },
      { by: 'a', send: "I don't think {c} is who {c.sub} says {c.sub} is. Just a feeling" },
      { by: 'b', react: "I didn't even think about that.", send: "Wait... now I can't unsee it {e:eyes}" },
    ], beat: '{a} leaves the chat and smiles at the screen.' },
    { id: 'chat.plant.warm.02', when: { claim: 'distrusts' }, turns: [
      { by: 'a', say: "{b} needs to hear this. Whether it's true is a different question.", send: "I have to warn you. {c} was talking about you and it wasn't nice" },
      { by: 'b', react: "Excuse me?", send: "Are you serious?? What did {c.sub} say?" },
      { by: 'a', send: "Just that {c.sub} doesn't trust you. I thought you should know" },
      { by: 'b', send: "Thank you. Seriously {e:pray}" },
    ], beat: '{a} closes the chat and leans back, satisfied.' },
    { id: 'chat.plant.warm.03', when: { claim: 'catfish' }, turns: [
      { by: 'a', send: "Have you noticed how perfect {c}'s messages are? Like too perfect" },
      { by: 'b', react: "Now that you say it.", send: "Oh my God. Yes. Nobody is that nice" },
      { by: 'a', send: "Just saying. Keep your eyes open {e:detective}" },
    ], beat: '{b} opens the profile and studies the photos.' },
    { id: 'chat.plant.warm.04', turns: [
      { by: 'a', say: "Keep it vague. Vague is safe.", send: "Just be careful who you trust in here. That's all I'll say" },
      { by: 'b', react: "Okay, now I'm scared.", send: "Wait what does that mean?? Who?" },
      { by: 'a', send: "Can't say yet. Just watch who's being extra nice" },
    ], beat: '{b} spends the next ten minutes staring at the Circle Chat.' },
    { id: 'chat.plant.warm.05', turns: [
      { by: 'a', say: "Just enough to make {b.obj} think. Not enough to trace back to me.", send: "Can I say something? Not everybody in here is who they seem" },
      { by: 'b', react: "Oh, I love this.", send: "Tell me EVERYTHING" },
      { by: 'a', send: "I can't yet. But I will. Just trust me for now {e:detective}" },
      { by: 'b', send: "Okay. I trust you" },
    ], beat: '{a} leaves the chat and smiles at the screen.' },
    { id: 'chat.plant.warm.06', turns: [
      { by: 'a', send: "You're one of the only real ones in here, so I'm telling you. Watch who's being nice to everybody" },
      { by: 'b', react: "Wait. Is that about me?", send: "Okay you're making me paranoid lol. But thank you" },
      { by: 'a', send: "That's my job {e:wink}" },
    ], beat: '{b} scrolls back through the Circle Chat, slowly.' },
  ],
  'chat.plant.neutral': [
    { id: 'chat.plant.neutral.01', when: { claim: 'catfish' }, turns: [
      { by: 'a', send: "Do you think {c} is real? I'm not sure" },
      { by: 'b', react: "Hmm. Maybe.", send: "I haven't thought about it. Why?" },
      { by: 'a', send: "Just a vibe. Forget I said it" },
    ], beat: '{b} opens the Newsfeed and scrolls back through the old posts.' },
    { id: 'chat.plant.neutral.02', when: { claim: 'distrusts' }, turns: [
      { by: 'a', send: "I don't think {c} is a fan of yours, just saying" },
      { by: 'b', send: "Hm. Okay. I'll keep that in mind" },
    ], beat: '{b} looks unconvinced, but writes something down anyway.' },
    { id: 'chat.plant.neutral.03', turns: [
      { by: 'a', send: "Some people in here aren't being real. Just so you know" },
      { by: 'b', send: "Some people in here say that about everyone lol" },
      { by: 'a', say: "Hm. {b.Sub}'s sharper than I thought." },
    ], beat: '{a} leaves the chat.' },
    { id: 'chat.plant.neutral.04', turns: [
      { by: 'a', say: "Say it like it's nothing.", send: "Not everybody's playing fair in here. I'm just saying" },
      { by: 'b', send: "Okay. Anybody specific?" },
      { by: 'a', send: "Not yet. Keep your eyes open" },
    ], beat: '{b} shrugs and closes the chat.' },
    { id: 'chat.plant.neutral.05', turns: [
      { by: 'a', send: "Have you noticed who's been quiet lately? Quiet people worry me" },
      { by: 'b', send: "Lol I'm quiet sometimes" },
      { by: 'a', send: "Not you. You're fine {e:laugh}" },
    ], beat: '{b} laughs, but checks the Circle Chat anyway.' },
  ],
  'chat.plant.cold': [
    { id: 'chat.plant.cold.01', when: { claim: 'catfish' }, turns: [
      { by: 'a', send: "I think {c} might be a catfish" },
      { by: 'b', react: "Why is {a.sub} telling me this?", send: "Why are you telling me that? {c} has been nothing but nice to me" },
      { by: 'a', send: "Just a thought" },
    ], beat: '{b} leaves the chat and trusts {a} a little less.' },
    { id: 'chat.plant.cold.02', when: { claim: 'distrusts' }, turns: [
      { by: 'a', send: "{c} was talking about you. Not in a good way" },
      { by: 'b', react: "Nope. Not buying it.", send: "I'll hear that from {c} myself, thanks" },
    ], beat: '{a} bites {a.posAdj} lip and closes the chat.' },
    { id: 'chat.plant.cold.03', turns: [
      { by: 'a', send: "You should watch your back in here" },
      { by: 'b', send: "Is that a threat or advice? lol" },
      { by: 'a', send: "Advice. Obviously" },
      { by: 'b', send: "Okay. Noted." },
    ], beat: '{b} closes the chat and says, out loud, "That was weird."' },
    { id: 'chat.plant.cold.04', turns: [
      { by: 'a', send: "Just so you know, people are talking about you" },
      { by: 'b', react: "Here we go.", send: "People talk about everybody. What's your point?" },
      { by: 'a', send: "No point. Just looking out for you" },
    ], beat: '{b} closes the chat and says "sure you are" to the empty room.' },
    { id: 'chat.plant.cold.05', turns: [
      { by: 'a', say: "Scare {b.obj} a little. Just a little.", send: "I heard some things about you today. Not good things" },
      { by: 'b', send: "From who?" },
      { by: 'a', send: "Can't say" },
      { by: 'b', send: "Then I can't care. Bye {e:wave}" },
    ], leaves: true, beat: '{a} stares at the screen after {b} leaves the chat.' },
  ],
  'chat.credit.warm': [
    { id: 'chat.credit.warm.01', when: { lie: true }, turns: [
      { by: 'a', say: "I didn't save {b}. But {b.sub} doesn't need to know that.", send: "Just so you know, I had your back in there last night" },
      { by: 'b', react: "Wait, really?", send: "Oh my God. Thank you. I owe you one" },
      { by: 'a', send: "That's what friends are for {e:pray}" },
    ], beat: '{a} leaves the chat and laughs, quietly.' },
    { id: 'chat.credit.warm.02', when: { lie: false }, turns: [
      { by: 'a', send: "I want you to know I fought for you in the Hangout" },
      { by: 'b', react: "Somebody actually fought for me.", send: "I don't even know what to say. Thank you" },
      { by: 'a', send: "You'd do the same for me. I know it" },
      { by: 'b', send: "I would. 100% {e:heart}" },
    ], beat: '{b} wipes {b.posAdj} eyes and laughs at {b.ref} for crying.' },
    { id: 'chat.credit.warm.03', turns: [
      { by: 'a', send: "You were never going anywhere last night. I made sure of it" },
      { by: 'b', send: "You're a real one {e:crown} I won't forget this" },
    ], beat: '{b} says "I won’t" again, to the empty room.' },
    { id: 'chat.credit.warm.04', turns: [
      { by: 'a', send: "I just want you to know, your name never came out of my mouth last night" },
      { by: 'b', react: "Okay, that feels good.", send: "That means a lot. Seriously" },
      { by: 'a', send: "We look out for each other {e:handshake}" },
    ], beat: '{b} smiles at the screen for a long time.' },
    { id: 'chat.credit.warm.05', turns: [
      { by: 'a', say: "Remind {b} who {b.posAdj} friends are.", send: "Last night was scary. I'm glad you're still here" },
      { by: 'b', send: "Me too!! And I'm glad you're here too {e:heart}" },
      { by: 'a', send: "We're not going anywhere" },
    ], beat: '{a} gives the screen a little nod.' },
  ],
  'chat.credit.neutral': [
    { id: 'chat.credit.neutral.01', turns: [
      { by: 'a', send: "Just so you know, I had your back last night" },
      { by: 'b', react: "Did {a.sub}, though?", send: "Thanks, I appreciate that" },
    ], beat: '{b} closes the chat and frowns at the ceiling.' },
    { id: 'chat.credit.neutral.02', turns: [
      { by: 'a', send: "You were safe with me in the Hangout, don't worry" },
      { by: 'b', send: "Good to know!" },
      { by: 'a', say: "'Good to know.' Not 'thank you.' Hm." },
    ], beat: '{a} leaves the chat.' },
    { id: 'chat.credit.neutral.03', turns: [
      { by: 'a', send: "I didn't let them block you. Just saying" },
      { by: 'b', send: "Okay. Thank you" },
    ], beat: 'The chat ends there.' },
  ],
  'chat.credit.cold': [
    { id: 'chat.credit.cold.01', turns: [
      { by: 'a', send: "I had your back in the Hangout last night" },
      { by: 'b', react: "Sure you did.", send: "Sure you did lol" },
      { by: 'a', send: "I did. I really did" },
    ], beat: '{b} leaves the chat without another word.' },
    { id: 'chat.credit.cold.02', turns: [
      { by: 'a', send: "You're welcome for last night by the way {e:wink}" },
      { by: 'b', react: "Wow.", send: "I didn't ask you to do anything for me" },
    ], beat: '{a} stares at the reply, and nobody types anything else.' },
    { id: 'chat.credit.cold.03', turns: [
      { by: 'a', send: "I kept you safe last night. Remember that" },
      { by: 'b', send: "Sounds like you want something" },
      { by: 'a', send: "Just loyalty" },
      { by: 'b', send: "Loyalty goes both ways" },
    ], beat: 'The chat closes on that.' },
  ],
  'chat.repair.warm': [
    { id: 'chat.repair.warm.01', turns: [
      { by: 'a', say: "I don't want this thing with {b} hanging over me.", send: "Can we talk? I feel like things got weird between us" },
      { by: 'b', react: "Okay. I've been wanting that too.", send: "Yeah. I'd like that" },
      { by: 'a', send: "Whatever happened, I'm sorry for my part in it" },
      { by: 'b', send: "Me too. Clean slate?" },
      { by: 'a', send: "Clean slate {e:heart}" },
    ], beat: '{a} lets out a long breath.' },
    { id: 'chat.repair.warm.02', turns: [
      { by: 'a', send: "I don't want us to be enemies in here" },
      { by: 'b', send: "Honestly I don't either. It's exhausting" },
      { by: 'a', send: "So let's not be {e:hug}" },
    ], beat: '{b} smiles for the first time today.' },
    { id: 'chat.repair.warm.03', turns: [
      { by: 'a', send: "Hey. I owe you an apology" },
      { by: 'b', react: "Didn't see that coming.", send: "I appreciate that more than you know" },
    ], beat: 'Both of them feel lighter when the chat closes.' },
  ],
  'chat.repair.neutral': [
    { id: 'chat.repair.neutral.01', turns: [
      { by: 'a', send: "Can we reset? I don't want bad energy" },
      { by: 'b', send: "We can try" },
    ], beat: '{a} nods and closes the chat.' },
    { id: 'chat.repair.neutral.02', turns: [
      { by: 'a', send: "I'm sorry if I came off wrong before" },
      { by: 'b', send: "It's fine. It's a weird game" },
    ], beat: 'The chat ends politely.' },
    { id: 'chat.repair.neutral.03', turns: [
      { by: 'a', send: "Are we good?" },
      { by: 'b', send: "We're okay. Let's leave it there" },
    ], beat: '{a} closes the chat, still frowning.' },
  ],
  'chat.repair.cold': [
    { id: 'chat.repair.cold.01', turns: [
      { by: 'a', send: "Can we start over?" },
      { by: 'b', react: "Now {a.sub} wants to start over.", send: "I don't think so. Not right now" },
    ], beat: '{a} leaves the chat.' },
    { id: 'chat.repair.cold.02', turns: [
      { by: 'a', send: "I'm sorry. Really" },
      { by: 'b', send: "Sorry doesn't fix it" },
    ], beat: 'The chat closes.' },
    { id: 'chat.repair.cold.03', turns: [
      { by: 'a', send: "I want to fix things between us" },
      { by: 'b', send: "Then you should have thought about that before" },
    ], beat: '{a} sits with {a.posAdj} head in {a.posAdj} hands.' },
  ],
  'chat.confront.warm': [
    { id: 'chat.confront.warm.01', turns: [
      { by: 'a', say: "I'm not letting this slide.", send: "I have to be honest. Something you did really bothered me" },
      { by: 'b', react: "Okay. Let's hear it.", send: "Okay. Tell me. I'd rather know" },
      { by: 'a', send: "I felt played. That's all" },
      { by: 'b', send: "That's fair. I'm sorry. That wasn't my intention" },
    ], beat: '{a} relaxes back into the couch.' },
    { id: 'chat.confront.warm.02', turns: [
      { by: 'a', send: "We need to clear the air" },
      { by: 'b', send: "Agreed. Go ahead" },
      { by: 'a', send: "I don't like how things went. But I want us to be good" },
      { by: 'b', send: "Same. Thank you for coming to me directly" },
    ], beat: 'Both of them are calmer when the chat closes.' },
    { id: 'chat.confront.warm.03', turns: [
      { by: 'a', send: "Straight up, are we good or not?" },
      { by: 'b', send: "We are. I promise" },
    ], beat: '{a} decides to believe it.' },
  ],
  'chat.confront.neutral': [
    { id: 'chat.confront.neutral.01', turns: [
      { by: 'a', send: "I'm not gonna lie, I'm upset with you" },
      { by: 'b', send: "I hear you. I don't think I did anything wrong though" },
      { by: 'a', send: "Well, we see it differently" },
    ], beat: 'Both of them leave the chat at the same time.' },
    { id: 'chat.confront.neutral.02', turns: [
      { by: 'a', send: "Why do I feel like you're playing me?" },
      { by: 'b', send: "I'm not. I promise" },
    ], beat: '{a} closes the chat and goes back to the stove.' },
    { id: 'chat.confront.neutral.03', turns: [
      { by: 'a', send: "Be honest. Do you have a problem with me?" },
      { by: 'b', send: "No problem. Just playing the game" },
    ], beat: '"Just playing the game," {a} repeats, flatly.' },
  ],
  'chat.confront.cold': [
    { id: 'chat.confront.cold.01', turns: [
      { by: 'a', say: "Enough. I'm saying it.", send: "I know what you're doing and I don't like it" },
      { by: 'b', react: "Excuse me?", send: "You don't know anything about what I'm doing" },
      { by: 'a', send: "I know enough" },
    ], beat: '{b} leaves the chat. {a} throws a cushion across the room.' },
    { id: 'chat.confront.cold.02', turns: [
      { by: 'a', send: "Are you seriously going to act like everything is fine?" },
      { by: 'b', send: "Everything IS fine. You're making this a thing" },
      { by: 'a', send: "Wow" },
    ], beat: 'Both of them are furious, in two apartments, at the same time.' },
    { id: 'chat.confront.cold.03', turns: [
      { by: 'a', send: "I don't trust you. I wanted you to hear it from me" },
      { by: 'b', send: "Well now I know. Thanks" },
    ], beat: '{a} leaves the chat and does not open it again.' },
  ],
  'chat.confess.warm': [
    { id: 'chat.confess.warm.01', turns: [
      { by: 'a', say: "I can't keep lying to {b}. Not {b.obj}.", send: "I need to tell you something and I need you to not hate me" },
      { by: 'b', react: "Oh no. Okay.", send: "I could never hate you. What is it?" },
      { by: 'a', send: "I'm not exactly who my profile says. The pictures aren't me. Everything I said to you was real though" },
      { by: 'b', react: "Wow. Okay. Breathe.", send: "Thank you for telling me. I believe you meant it {e:heart}" },
    ], beat: '{a} puts {a.posAdj} hands over {a.posAdj} face and cries with relief.' },
    { id: 'chat.confess.warm.02', turns: [
      { by: 'a', send: "You've been so real with me. I owe you the same" },
      { by: 'b', send: "You can tell me anything" },
      { by: 'a', send: "I'm playing as someone else. I'm still me in every conversation we've had" },
      { by: 'b', send: "That's a lot. But I'm glad it was you I was talking to" },
    ], beat: '{b} reads the message three times before closing the chat.' },
    { id: 'chat.confess.warm.03', turns: [
      { by: 'a', send: "Can I trust you with the biggest secret in here?" },
      { by: 'b', send: "Always. Tell me" },
      { by: 'a', send: "My profile isn't really me. I'm sorry I didn't say it sooner" },
      { by: 'b', send: "It's okay. Your secret's safe {e:pray}" },
    ], beat: '{a} lies back on the couch and exhales.' },
  ],
  'chat.confess.neutral': [
    { id: 'chat.confess.neutral.01', turns: [
      { by: 'a', send: "I have to be honest. My profile isn't really me" },
      { by: 'b', react: "Oh.", send: "Okay. I need a minute to process that" },
    ], beat: '{b} stares at the screen for a long time.' },
    { id: 'chat.confess.neutral.02', turns: [
      { by: 'a', send: "I'm not who you think I am. But the person talking to you is real" },
      { by: 'b', send: "I don't know how to feel about that yet" },
      { by: 'a', send: "That's fair" },
    ], beat: 'The chat stays open a while before {b} leaves it.' },
    { id: 'chat.confess.neutral.03', turns: [
      { by: 'a', send: "I'm playing as someone else. I wanted you to hear it from me" },
      { by: 'b', send: "Okay. Thank you for telling me, I guess" },
    ], beat: '{a} sits back and stares at the ceiling.' },
  ],
  'chat.confess.cold': [
    { id: 'chat.confess.cold.01', turns: [
      { by: 'a', send: "I need to come clean. I'm not the person in my pictures" },
      { by: 'b', react: "Are you kidding me?", send: "So everything was fake??" },
      { by: 'a', send: "Not everything. The conversations were real" },
      { by: 'b', send: "I don't know that anymore" },
    ], beat: '{b} leaves the chat. {a} does not move from the couch for a long time.' },
    { id: 'chat.confess.cold.02', turns: [
      { by: 'a', send: "I'm not who I said I was. I'm sorry" },
      { by: 'b', send: "Wow. I trusted you" },
    ], beat: '{a} puts {a.posAdj} face in {a.posAdj} hands.' },
    { id: 'chat.confess.cold.03', turns: [
      { by: 'a', send: "My profile isn't me. I had to tell someone" },
      { by: 'b', send: "Why me? Why now?" },
      { by: 'a', send: "Because I trust you" },
      { by: 'b', send: "Then you should have told me day one" },
    ], beat: '{b} leaves the chat angry.' },
  ],
  'chat.probe.pass': [
    { id: 'chat.probe.pass.01', turns: [
      { by: 'a', say: "Some quick trivia to see if {b.sub}'s really {b}.", send: "Okay random question. What was the last thing you cooked before you came in here?" },
      { by: 'b', react: "Oh, that's easy.", send: "Spaghetti. Badly. I burned the garlic lol" },
      { by: 'a', say: "Specific. Burned garlic. That's a real person.", send: "Lol same thing happens to me every time" },
    ], beat: '{a} crosses a question mark off the notepad.' },
    { id: 'chat.probe.pass.02', turns: [
      { by: 'a', say: "Let's see if {b} knows {b.posAdj} own life.", send: "What's your go-to karaoke song? No thinking" },
      { by: 'b', send: "Don't Stop Believin'. Every time. Don't judge me" },
      { by: 'a', react: "That came out fast. That's real.", send: "No judgment. That's a classic {e:clap}" },
    ], beat: '{a} nods slowly at the screen.' },
    { id: 'chat.probe.pass.03', turns: [
      { by: 'a', send: "Tell me about your hometown. What's the one place everybody goes?" },
      { by: 'b', send: "There's this diner that's open all night. Everybody ends up there" },
      { by: 'a', react: "That's too specific to be made up.", send: "Okay I need to go there one day" },
    ], beat: '{a} leans back, a little more at ease.' },
    { id: 'chat.probe.pass.04', when: { suspects: true }, turns: [
      { by: 'a', say: "I've had a weird feeling about {b}. Time to test it.", send: "How old were you when you got your first phone?" },
      { by: 'b', send: "Like 12? It had a slide-out keyboard lol" },
      { by: 'a', say: "Right age for that. Maybe I was wrong.", send: "The slide-out keyboard!! I miss those" },
    ], beat: '{a} crosses a name off the notepad, then writes it back in, smaller.' },
  ],
  'chat.probe.dodge': [
    { id: 'chat.probe.dodge.01', turns: [
      { by: 'a', say: "Let's see how {b} handles this one.", send: "What did you study in school? I feel like you told me but I forgot" },
      { by: 'b', react: "Oh no. I don't have an answer for that.", send: "Lol it's boring, I don't even like talking about it. What about you?" },
      { by: 'a', say: "{b.Sub} changed the subject. {b.Sub} changed the subject.", send: "Business. Now you!" },
      { by: 'b', send: "Honestly a bit of everything lol" },
    ], beat: '{a} writes "dodged" on the notepad and underlines it.' },
    { id: 'chat.probe.dodge.02', turns: [
      { by: 'a', send: "Who's the person behind you in your third picture?" },
      { by: 'b', react: "Why is {a.sub} asking about that picture?", send: "Omg random friend from a party lol, why?" },
      { by: 'a', say: "'Random friend.' In one of your only three pictures." },
    ], beat: '{a} zooms into the photo on the big screen.' },
    { id: 'chat.probe.dodge.03', turns: [
      { by: 'a', say: "If {b.sub}'s real, {b.sub}'ll know this.", send: "What was your first job?" },
      { by: 'b', react: "Stay calm. Be vague.", send: "Retail lol. The worst. Let's not talk about it {e:laugh}" },
      { by: 'a', send: "Lol fair" },
    ], beat: '{b} lets out a breath {b.sub} did not know {b.sub} was holding.' },
  ],
  'chat.probe.fail': [
    { id: 'chat.probe.fail.01', turns: [
      { by: 'a', say: "This is a simple question. If {b.sub}'s real, it's easy.", send: "Okay quick one. What's your favorite thing about where you live?" },
      { by: 'b', react: "Oh no. I didn't think about that one.", send: "Hmm, the people? And the weather lol" },
      { by: 'a', react: "The weather. That's what you'd say about anywhere.", send: "The weather lol. Okay" },
    ], beat: '{a} writes a name at the top of the notepad and circles it twice.' },
    { id: 'chat.probe.fail.02', turns: [
      { by: 'a', send: "You said you've been doing your job for years. What's the hardest part of it?" },
      { by: 'b', react: "I didn't write down that part.", send: "Um honestly all of it lol. It's a lot" },
      { by: 'a', say: "'All of it.' That is not an answer from someone who does that job." },
    ], beat: '{a} sits back and folds {a.posAdj} arms.' },
    { id: 'chat.probe.fail.03', turns: [
      { by: 'a', send: "What year did you graduate?" },
      { by: 'b', react: "Do the math. Do the math.", send: "Uh like 2016? Or 17. Time is weird in here lol" },
      { by: 'a', say: "You don't forget the year you graduated.", send: "Lol okay" },
    ], beat: '{b} closes the chat and whispers "stupid, stupid, stupid."' },
    { id: 'chat.probe.fail.04', turns: [
      { by: 'a', say: "Let's try the easiest question in the world.", send: "What's your go-to order at a coffee shop?" },
      { by: 'b', react: "What would I even order? Think.", send: "Just like a regular coffee? Whatever they have lol" },
      { by: 'a', say: "Nobody who looks like that picture orders 'whatever they have.'" },
    ], beat: '{a} opens the profile picture and stares at it for a long time.' },
  ],
};
