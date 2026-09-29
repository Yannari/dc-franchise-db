// Slips: the moment a cover shows (spec §7.7). Data only.
// a = the one who slipped, b = the one reading. `noticed` entries end with b
// suspicious; `missed` entries end with b none the wiser and a relieved.
// A slip is about the gap between the persona and the person — what they
// would know, their age and register, a message too polished to be real —
// never a stereotype about who "sounds like" a man or a woman.
export const SLIPS = {
  'slip.knowledge.noticed': [
    { id: 'slip.knowledge.noticed.01', turns: [
      { by: 'a', send: "Honestly my job is pretty chill, I mostly just do whatever lol" },
      { by: 'b', react: "Whatever? That's not a job. That's a dodge." },
    ], beat: '{b} writes something down.' },
    { id: 'slip.knowledge.noticed.02', turns: [
      { by: 'a', say: "I don't actually know how that works. Just sound confident.", send: "Oh yeah I know all about that. It's super easy" },
      { by: 'b', react: "Super easy? No, it's not. Anyone who's done it knows that." },
    ], beat: '{b} narrows {b.posAdj} eyes at the screen.' },
    { id: 'slip.knowledge.noticed.03', turns: [
      { by: 'a', send: "Wait what's that? I've never heard of it" },
      { by: 'b', react: "{a.Sub}'s never heard of it? It's in {a.posAdj} own bio." },
    ], beat: '{b} opens the profile and reads the bio out loud, slowly.' },
    { id: 'slip.knowledge.noticed.04', turns: [
      { by: 'a', send: "My hometown is honestly just a normal town lol, nothing special" },
      { by: 'b', react: "Everybody has something to say about their hometown. Everybody." },
    ], beat: '{b} taps {b.posAdj} chin, thinking.' },
  ],
  'slip.knowledge.missed': [
    { id: 'slip.knowledge.missed.01', turns: [
      { by: 'a', send: "Lol I don't even remember, it was so long ago" },
      { by: 'a', say: "That was close. I have no idea what the answer is." },
    ], beat: '{b} has already moved on to the next message.' },
    { id: 'slip.knowledge.missed.02', turns: [
      { by: 'a', say: "Oh no, I don't know anything about that. Change the subject.", send: "Anyway! What are you having for dinner?" },
      { by: 'b', react: "Ooh, good question.", send: "Pasta. Always pasta" },
    ], beat: '{a} puts a hand on {a.posAdj} chest and breathes out.' },
    { id: 'slip.knowledge.missed.03', turns: [
      { by: 'a', send: "It's hard to explain, you'd have to see it" },
      { by: 'a', say: "Nice. Vague. Keep it vague." },
    ], beat: '{a} nods at {a.ref} in the mirror.' },
  ],
  'slip.body.noticed': [
    { id: 'slip.body.noticed.01', turns: [
      { by: 'a', send: "Ugh my back is killing me today, getting old lol" },
      { by: 'b', react: "Getting old? {a.Sub}'s supposed to be in {a.posAdj} twenties." },
    ], beat: '{b} opens the profile and checks the age.' },
    { id: 'slip.body.noticed.02', turns: [
      { by: 'a', send: "I'm so tall that everything in here is too low for me lol" },
      { by: 'b', react: "Tall? Every picture of {a.obj} looks tiny." },
    ], beat: '{b} zooms in on a photo on the big screen.' },
    { id: 'slip.body.noticed.03', turns: [
      { by: 'a', send: "Just got out of the shower, my hair takes like two minutes to dry lol" },
      { by: 'b', react: "Two minutes. With that hair in the picture? No way." },
    ], beat: '{b} looks at the profile picture for a long time.' },
  ],
  'slip.body.missed': [
    { id: 'slip.body.missed.01', turns: [
      { by: 'a', say: "Why did I say that? That doesn't fit the pictures at all.", send: "Lol ignore me I'm tired" },
      { by: 'b', send: "Get some sleep!! {e:heart}" },
    ], beat: '{a} lies face down on the couch.' },
    { id: 'slip.body.missed.02', turns: [
      { by: 'a', send: "My knees are not what they used to be lol" },
      { by: 'b', react: "Ha. Same, and I'm young.", send: "Lol same honestly" },
    ], beat: '{a} relaxes when the reply comes back.' },
    { id: 'slip.body.missed.03', turns: [
      { by: 'a', say: "Careful. The picture is shorter than me. Much shorter." },
      { by: 'a', send: "Anyway what are you up to tonight?" },
      { by: 'b', send: "Nothing lol. Probably a face mask" },
    ], beat: '{a} sits up straighter, then slouches again.' },
  ],
  'slip.voice.noticed': [
    { id: 'slip.voice.noticed.01', turns: [
      { by: 'a', send: "That is simply delightful news. I'm so pleased for you" },
      { by: 'b', react: "Simply delightful? Who talks like that at that age?" },
    ], beat: '{b} reads it out loud in a very formal voice.' },
    { id: 'slip.voice.noticed.02', turns: [
      { by: 'a', send: "Lol that's so random, I remember when we had to rewind tapes" },
      { by: 'b', react: "Rewind tapes? How old is {a.sub}, really?" },
    ], beat: '{b} starts doing math on {b.posAdj} fingers.' },
    { id: 'slip.voice.noticed.03', turns: [
      { by: 'a', send: "No cap that's lowkey bussin fr fr" },
      { by: 'b', react: "Okay, that's somebody trying way too hard to sound young." },
    ], beat: '{b} laughs, then stops laughing.' },
  ],
  'slip.voice.missed': [
    { id: 'slip.voice.missed.01', turns: [
      { by: 'a', say: "Would a twenty-three-year-old say that? I don't know. Send it.", send: "That's so cool!! Love that for you" },
      { by: 'b', send: "Thank you!! {e:heart}" },
    ], beat: '{a} gives {a.ref} a nod.' },
    { id: 'slip.voice.missed.02', turns: [
      { by: 'a', say: "Too many emojis? Not enough? I have no idea anymore." },
      { by: 'a', send: "Omg yes {e:laugh} {e:laugh}" },
    ], beat: '{a} deletes one emoji, puts it back, and sends.' },
    { id: 'slip.voice.missed.03', turns: [
      { by: 'a', send: "Well that's just swell" },
      { by: 'a', say: "Swell. I said swell. Nobody says swell. Did {b.sub} notice?" },
    ], beat: '{b} is already typing about something else.' },
  ],
  'slip.tooPerfect.noticed': [
    { id: 'slip.tooPerfect.noticed.01', turns: [
      { by: 'a', send: "I just believe everyone deserves kindness and I try to lead with love every single day {e:heart}" },
      { by: 'b', react: "Every single day. Nobody is that nice. Nobody." },
    ], beat: '{b} makes a face at the screen.' },
    { id: 'slip.tooPerfect.noticed.02', turns: [
      { by: 'a', send: "I volunteer, I run every morning, and I call my mom every night {e:smile}" },
      { by: 'b', react: "That is too good to be true." },
    ], beat: '{b} says it again, slower: "Too good to be true."' },
    { id: 'slip.tooPerfect.noticed.03', turns: [
      { by: 'a', send: "Honestly I've never had a bad day in my life, I'm just blessed" },
      { by: 'b', react: "Never had a bad day. Okay. Sure." },
    ], beat: '{b} leans back and crosses {b.posAdj} arms.' },
  ],
  'slip.tooPerfect.missed': [
    { id: 'slip.tooPerfect.missed.01', turns: [
      { by: 'a', send: "I just want everyone in here to feel loved {e:sparkle}" },
      { by: 'b', react: "Aw. That's sweet.", send: "Aw you're sweet" },
    ], beat: '{a} smiles at the screen.' },
    { id: 'slip.tooPerfect.missed.02', turns: [
      { by: 'a', say: "Too much? Maybe too much. Send it anyway.", send: "You deserve the world honestly" },
      { by: 'b', send: "Stop you're making me blush lol" },
    ], beat: '{a} relaxes.' },
    { id: 'slip.tooPerfect.missed.03', turns: [
      { by: 'a', send: "I'm grateful for every single one of you in here" },
      { by: 'b', send: "Same!! {e:heart}" },
    ], beat: '{a} smiles at the screen.' },
  ],
  'slip.overreach.noticed': [
    { id: 'slip.overreach.noticed.01', turns: [
      { by: 'a', send: "I'm literally crying right now, you mean so much to me" },
      { by: 'b', react: "Crying? We've talked twice." },
    ], beat: '{b} scrolls back up through the chat to count.' },
    { id: 'slip.overreach.noticed.02', turns: [
      { by: 'a', send: "I would honestly do anything for you in this game" },
      { by: 'b', react: "Anything? That's a lot for day three. What does {a.sub} want?" },
    ], beat: '{b} writes something down.' },
    { id: 'slip.overreach.noticed.03', turns: [
      { by: 'a', send: "I can't stop thinking about the blocking, I'm devastated" },
      { by: 'b', react: "Devastated? {a.Sub} barely talked to them." },
    ], beat: '{b} closes the chat with one eyebrow up.' },
  ],
  'slip.overreach.missed': [
    { id: 'slip.overreach.missed.01', turns: [
      { by: 'a', send: "You're like family to me already" },
      { by: 'b', react: "Aw. Okay.", send: "Aw that's sweet" },
    ], beat: '{a} nods, pleased.' },
    { id: 'slip.overreach.missed.02', turns: [
      { by: 'a', say: "Too much. That was too much.", send: "Lol sorry I'm emotional today" },
      { by: 'b', send: "Same honestly, it's this place" },
    ], beat: '{a} breathes out.' },
    { id: 'slip.overreach.missed.03', turns: [
      { by: 'a', send: "I'd take a bullet for you in here {e:heart}" },
      { by: 'b', send: "Lol hopefully it doesn't come to that" },
    ], beat: '{a} laughs, relieved.' },
  ],
  'slip.name.noticed': [
    { id: 'slip.name.noticed.01', turns: [
      { by: 'a', send: "We think you're really cool btw" },
      { by: 'b', react: "We? Who is 'we'?" },
    ], beat: '{b} reads it three times.' },
    { id: 'slip.name.noticed.02', turns: [
      { by: 'a', send: "Lol my friends call me something totally different, it's a long story" },
      { by: 'b', react: "Something totally different. Like what? Like {a.posAdj} real name?" },
    ], beat: '{b} opens the profile and stares at the name.' },
    { id: 'slip.name.noticed.03', turns: [
      { by: 'a', send: "Sorry, typo, I meant to say I" },
      { by: 'b', react: "What did {a.sub} type before the typo?" },
    ], beat: '{b} scrolls back up, but the message is gone.' },
  ],
  'slip.name.missed': [
    { id: 'slip.name.missed.01', turns: [
      { by: 'a', say: "Don't say 'we.' Don't say 'we.' It's 'I.'", send: "I think you're great" },
      { by: 'b', send: "Aw thanks!" },
    ], beat: '{a} lets out a breath.' },
    { id: 'slip.name.missed.02', turns: [
      { by: 'a', send: "Lol we- I mean I love that" },
      { by: 'b', send: "Haha love it too" },
    ], beat: '{a} covers {a.posAdj} mouth with both hands.' },
    { id: 'slip.name.missed.03', turns: [
      { by: 'a', say: "I almost signed off with my real name. Almost." },
      { by: 'a', send: "Talk later!" },
    ], beat: '{a} leans back and stares at the ceiling.' },
  ],
  'slip.misread': [
    { id: 'slip.misread.01', turns: [
      { by: 'a', send: "Honestly I'm just here to be myself and have fun" },
      { by: 'b', react: "That's exactly what a catfish would say." },
    ], beat: '{b} squints at the screen.' },
    { id: 'slip.misread.02', turns: [
      { by: 'a', send: "Lol I'm so boring, I just work and go to the gym" },
      { by: 'b', react: "Boring on purpose. That feels rehearsed." },
    ], beat: '{b} writes something down.' },
    { id: 'slip.misread.03', turns: [
      { by: 'a', send: "Everyone in here is so nice {e:smile}" },
      { by: 'b', react: "Too nice. Something about {a.obj} feels off." },
    ], beat: '{b} opens the profile and studies it.' },
    { id: 'slip.misread.04', turns: [
      { by: 'a', send: "I don't really post much online, I'm not a social media person" },
      { by: 'b', react: "Not a social media person, on a social media show. Hm." },
    ], beat: '{b} taps a finger on the table.' },
    { id: 'slip.misread.05', turns: [
      { by: 'a', send: "My weekend is usually just brunch and a long walk {e:smile}" },
      { by: 'b', react: "Brunch and a long walk. That's a dating profile, not a person." },
    ], beat: '{b} makes a face at the screen.' },
    { id: 'slip.misread.06', turns: [
      { by: 'a', send: "I just want everybody in here to get along honestly" },
      { by: 'b', react: "Everybody gets along? Nobody actually wants that." },
    ], beat: '{b} scrolls back up to read it again.' },
    { id: 'slip.misread.07', turns: [
      { by: 'a', send: "I'm an open book, ask me anything lol" },
      { by: 'b', react: "Only people with something to hide say that." },
    ], beat: '{b} writes a question mark on the notepad.' },
    { id: 'slip.misread.08', turns: [
      { by: 'a', send: "Sorry for the late reply, I was in the shower lol" },
      { by: 'b', react: "Stalling. That's what that is." },
    ], beat: '{b} narrows {b.posAdj} eyes.' },
  ],
};
