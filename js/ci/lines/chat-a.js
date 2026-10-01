// Private chats, part one: getting to know someone, flirting, checking in,
// alliances and rating deals. Data only. Speakers a (opened the chat) and b.
// `say` is out loud in the apartment (the audience hears it); `send` is what
// arrives on the screen; `react` is b reading it and reacting out loud.
export const CHAT_A = {
  'chat.bond.warm': [
    { id: 'chat.bond.warm.01', turns: [
      { by: 'a', say: "I haven't really talked to {b} yet. Let's fix that.", send: "Hey {b}! Figured it's time we actually talked {e:smile}" },
      { by: 'b', react: "Oh, I like that. Straight to it.", send: "Yes!! I was literally about to message you {e:laugh}" },
      { by: 'a', send: "Great minds. So what do you do when you're not locked in an apartment?" },
      { by: 'b', send: "Honestly? Gym, work, my dog. Pretty simple life {e:heart}" },
    ], beat: '{a} nods at the screen and types a long reply about {a.posAdj} own dog.' },
    { id: 'chat.bond.warm.02', turns: [
      { by: 'a', send: "Okay random question. What's the first thing you'd eat when you get out of here?" },
      { by: 'b', react: "Oh, this is easy.", send: "Tacos. No question. Maybe three orders {e:fire}" },
      { by: 'a', react: "Three orders. I respect that.", send: "Okay you're my kind of person {e:laugh} {t:TacoTuesday}" },
    ], beat: '{b} laughs out loud in the empty apartment.' },
    { id: 'chat.bond.warm.03', stage: '{a} is on the couch with a bowl of cereal.', turns: [
      { by: 'a', say: "{b} seems cool. I want at least one person in here I can just talk to.", send: "Hey {b}! How's your day going in there?" },
      { by: 'b', react: "Aw, that's sweet.", send: "It's good! Just made coffee and I'm talking to my plants lol" },
      { by: 'a', send: "Same except the plant is a cereal bowl {e:laugh} Glad you're in here" },
      { by: 'b', send: "Me too. Let's keep talking {e:heart}" },
    ], beat: '{a} leaves the chat and finishes the cereal standing up.' },
    { id: 'chat.bond.warm.04', turns: [
      { by: 'a', send: "Tell me something about you nobody would guess from your profile {e:eyes}" },
      { by: 'b', react: "Ooh. Okay. Let me think.", send: "I cry at every single dog movie. Every one." },
      { by: 'a', react: "Oh my God, same.", send: "STOP. I'm the same. We can never watch one together {e:cry}" },
    ], beat: '{b} puts a hand over {b.posAdj} heart and grins at the screen.' },
    { id: 'chat.bond.warm.05', turns: [
      { by: 'a', say: "I feel like {b} is actually real. I need more people like that.", send: "Hey! I just wanted to say I really like your vibe in the group chat" },
      { by: 'b', react: "Wait, that's so nice.", send: "Thank you!! Honestly I was so nervous in there {e:sweat}" },
      { by: 'a', send: "You couldn't tell at all. You were one of the only ones being normal" },
      { by: 'b', send: "Lol I'll take normal {e:laugh} {t:RealOnes}" },
    ], beat: '{a} gives the screen a thumbs up.' },
    { id: 'chat.bond.warm.06', turns: [
      { by: 'a', send: "Okay I need to know. Morning person or night person?" },
      { by: 'b', send: "Night. Always night. I'm up way too late" },
      { by: 'a', react: "Of course.", send: "Knew it. We'd be the two still awake at every party {e:party}" },
      { by: 'b', react: "That's actually true.", send: "Last ones standing {e:muscle}" },
    ], beat: '{a} turns the lamp down and keeps typing.' },
    { id: 'chat.bond.warm.07', when: { mood: 'lonely' }, turns: [
      { by: 'a', say: "I just need to talk to somebody. Being alone in here is getting to me.", send: "Hey {b}. Can I be honest? It's weird not seeing anyone all day" },
      { by: 'b', react: "Oh, I get that.", send: "Oh 100%. I talked to my toaster this morning. Out loud." },
      { by: 'a', react: "I'm not the only one.", send: "Okay that made me feel so much better {e:laugh} Thank you" },
      { by: 'b', send: "Anytime. Message me whenever it gets quiet {e:hug}" },
    ], beat: '{a} sits back on the couch, and some of the tension goes out of {a.posAdj} shoulders.' },
    { id: 'chat.bond.warm.08', when: { newcomer: true }, turns: [
      { by: 'a', say: "{b} just got here. First impressions are everything, so let me be the friendly one.", send: "Welcome in {b}!! How are you feeling?" },
      { by: 'b', react: "Somebody reached out already. Okay.", send: "Honestly a little overwhelmed but excited!!" },
      { by: 'a', send: "That's normal. Everybody's nice once you get to know them. Mostly {e:wink}" },
      { by: 'b', send: "Lol noted. Thank you for saying hi {e:heart}" },
    ], beat: '{b} writes something on the notepad next to the couch.' },
    { id: 'chat.bond.warm.09', when: { catfish: true }, turns: [
      { by: 'a', say: "Stay in character. What would {a} actually say here?", send: "Hiii {b}! Just checking in on my favorite person {e:sparkle}" },
      { by: 'b', react: "Favorite person. Okay, I'll take it.", send: "Stop, you're gonna make me blush {e:smile}" },
      { by: 'a', say: "Good. That sounded like {a}.", send: "Good! Blushing is healthy {e:laugh}" },
    ], beat: '{a} lets out a long breath once the chat closes.' },
    { id: 'chat.bond.warm.10', turns: [
      { by: 'a', send: "Where are you from? I'm trying to guess from your profile" },
      { by: 'b', send: "Guess first!" },
      { by: 'a', send: "Somewhere warm. You have summer energy" },
      { by: 'b', react: "Ha. Close enough.", send: "Close enough lol. I live like an hour from the ocean {e:sun}" },
    ], beat: '{a} pumps a fist at the screen.' },
    { id: 'chat.bond.warm.11', when: { known: true }, turns: [
      { by: 'a', say: "{b} is becoming one of my people in here.", send: "Hey you. Just checking in on you again {e:smile}" },
      { by: 'b', react: "{a} again. I love that.", send: "You're the only one who actually does that. Thank you" },
      { by: 'a', send: "Always. We look out for each other {t:CircleFam}" },
    ], beat: '{b} reads it again before closing the chat.' },
    { id: 'chat.bond.warm.12', turns: [
      { by: 'a', send: "What are you doing right now? Honest answer" },
      { by: 'b', react: "Honest answer.", send: "Face mask. Couch. Talking to you {e:laugh}" },
      { by: 'a', send: "Perfect day honestly {t:SelfCare}" },
    ], beat: '{b} holds a cucumber slice in place with one hand and types with the other.' },
  ],
  'chat.bond.neutral': [
    { id: 'chat.bond.neutral.01', turns: [
      { by: 'a', send: "Hey {b}, just saying hi! How's it going?" },
      { by: 'b', react: "Okay. Short and sweet.", send: "Hey! It's going good, thanks. You?" },
      { by: 'a', send: "Good! Talk later {e:smile}" },
    ], beat: '{b} goes back to the stove.' },
    { id: 'chat.bond.neutral.02', turns: [
      { by: 'a', say: "I don't know much about {b}. This is a start.", send: "Hey! We haven't talked much yet. What's your deal?" },
      { by: 'b', react: "My deal?", send: "Lol no deal. Just here to meet people" },
      { by: 'a', say: "That's not really an answer.", send: "Fair enough. Well, nice to meet you" },
    ], beat: '{a} leaves the chat and looks at the profile for a while.' },
    { id: 'chat.bond.neutral.03', turns: [
      { by: 'a', send: "Hey {b}, what did you think of the group chat earlier?" },
      { by: 'b', react: "Careful, careful.", send: "It was fun! A lot of energy in there" },
      { by: 'a', send: "Ha yeah. It was a lot" },
      { by: 'b', send: "Anyway, I gotta go make lunch. Talk soon!" },
    ], beat: '{a} shrugs and closes the chat.' },
    { id: 'chat.bond.neutral.04', turns: [
      { by: 'a', send: "Hi!! Just wanted to say you seem really nice {e:smile}" },
      { by: 'b', react: "Nice. Okay.", send: "Thank you! You too" },
      { by: 'a', say: "That was fine. Just fine." },
    ], beat: '{a} goes back to folding laundry.' },
    { id: 'chat.bond.neutral.05', turns: [
      { by: 'a', send: "So how are you finding it in here so far?" },
      { by: 'b', send: "It's definitely different lol. I'm still figuring it out" },
      { by: 'a', send: "Same. It's a weird way to meet people" },
      { by: 'b', send: "Very weird. Okay, talk later!" },
    ], beat: '{b} switches the screen to the Newsfeed.' },
    { id: 'chat.bond.neutral.06', when: { suspects: true }, turns: [
      { by: 'a', say: "I'm keeping this light. I'm not sure about {b} yet.", send: "Hey! How's your day?" },
      { by: 'b', send: "Good! Kinda boring honestly lol" },
      { by: 'a', say: "Boring. Sure.", send: "Same here. Talk soon" },
    ], beat: '{a} narrows {a.posAdj} eyes at the screen, then leaves the chat.' },
    { id: 'chat.bond.neutral.07', turns: [
      { by: 'a', send: "Hey! Random question. Morning person or night person?" },
      { by: 'b', send: "Night person for sure. You?" },
      { by: 'a', send: "Morning. So we'll never be awake at the same time lol" },
    ], beat: '{b} laughs, then goes back to making dinner.' },
    { id: 'chat.bond.neutral.08', turns: [
      { by: 'a', say: "Just say hi. Nothing crazy.", send: "Hi {b}! Just checking in. How's your day?" },
      { by: 'b', send: "Pretty chill! Just vibing. Yours?" },
      { by: 'a', send: "Same honestly. Okay, talk soon!" },
    ] },
    { id: 'chat.bond.neutral.09', turns: [
      { by: 'a', send: "Okay I need to know. What are you eating in there? I'm so bored of my food" },
      { by: 'b', send: "Lol cereal. For dinner. Don't judge" },
      { by: 'a', send: "No judgment. Respect {e:clap}" },
    ] },
    { id: 'chat.bond.neutral.10', turns: [
      { by: 'a', send: "Hey, we should talk more. I feel like I barely know you" },
      { by: 'b', react: "Hm. Okay.", send: "Totally! Ask me anything" },
      { by: 'a', send: "Okay. Favorite movie?" },
      { by: 'b', send: "Anything scary. The scarier the better" },
    ], beat: '{a} writes "scary movies" on the notepad.' },
  ],
  'chat.bond.cold': [
    { id: 'chat.bond.cold.01', turns: [
      { by: 'a', send: "Hey {b}! What's up?" },
      { by: 'b', react: "Oh. It's {a}.", send: "Not much" },
      { by: 'a', send: "Okay cool. Just saying hi" },
    ], beat: '{a} stares at the two words on the screen, then leaves the chat.' },
    { id: 'chat.bond.cold.02', turns: [
      { by: 'a', send: "Hey!! I feel like we haven't really vibed yet. Wanna fix that?" },
      { by: 'b', react: "Why now, though?", send: "Lol maybe. I'm kinda busy right now" },
      { by: 'a', say: "Busy doing what? We're in apartments.", send: "No worries! Another time" },
    ], beat: '{a} leaves the chat and says nothing for a while.' },
    { id: 'chat.bond.cold.03', turns: [
      { by: 'a', send: "Hey, just checking in. How's it going?" },
      { by: 'b', react: "I'm not doing this right now.", send: "Fine thanks. Gotta go" },
    ], beat: '{b} leaves the chat before {a} can answer.' },
    { id: 'chat.bond.cold.04', when: { rivals: true }, turns: [
      { by: 'a', say: "I don't like {b}. But I don't need {b.obj} to know that yet.", send: "Hey {b}. How are things?" },
      { by: 'b', react: "Interesting.", send: "Things are fine. How are things with you?" },
      { by: 'a', send: "Fine. Just saying hi" },
    ], beat: 'Neither of them types anything else. {a} leaves first.' },
  ],
  'chat.flirt.warm': [
    { id: 'chat.flirt.warm.01', turns: [
      { by: 'a', say: "Okay. I'm shooting my shot.", send: "So word on the street is you've been thinking about me {e:eyes}" },
      { by: 'b', react: "Oh my God. Who said that?", send: "Lol what street is this?? {e:laugh}" },
      { by: 'a', send: "The only street in here. Mine {e:wink}" },
      { by: 'b', react: "Okay, that was smooth.", send: "Okay that was smooth, I'll give you that {e:hearteyes}" },
    ], beat: '{b} covers {b.posAdj} face with a pillow and laughs into it.' },
    { id: 'chat.flirt.warm.02', turns: [
      { by: 'a', send: "Not gonna lie, your picture had me stop scrolling {e:fire}" },
      { by: 'b', react: "Stop.", send: "Stoppp. You're sweet {e:smile}" },
      { by: 'a', send: "Just being honest. It's a problem I have" },
      { by: 'b', send: "It's a good problem {e:wink}" },
    ], beat: '{a} leans back on the couch, very pleased with {a.ref}.' },
    { id: 'chat.flirt.warm.03', turns: [
      { by: 'a', send: "If we were out right now, where would I be taking you?" },
      { by: 'b', react: "Ooh, okay.", send: "Somewhere with good food and bad music. I'm easy {e:laugh}" },
      { by: 'a', send: "Say less. Tacos and karaoke. It's a date" },
      { by: 'b', send: "It's a date {e:hearteyes} {t:FirstDate}" },
    ], beat: '{b} does a small spin in the kitchen after closing the chat.' },
    { id: 'chat.flirt.warm.04', when: { known: true }, turns: [
      { by: 'a', say: "I'm not gonna lie, I look forward to talking to {b} every day.", send: "Hi you {e:smile}" },
      { by: 'b', react: "Hi you. Oh no, I'm smiling.", send: "Hi you {e:smile} I was hoping you'd message" },
      { by: 'a', send: "I was hoping you were hoping {e:wink}" },
    ], beat: '{b} hugs a cushion and reads the whole chat again from the top.' },
    { id: 'chat.flirt.warm.05', when: { catfish: true }, turns: [
      { by: 'a', say: "Flirt as {a}. Keep it light. Don't overdo it.", send: "Can I say something? You're kind of my favorite person to talk to in here {e:sparkle}" },
      { by: 'b', react: "Wait. Really?", send: "Wait really?? That's so cute. You're mine too" },
      { by: 'a', say: "This is working. I feel a little bad. A little.", send: "Good {e:hearteyes}" },
    ], beat: '{a} closes the chat and sits very still for a moment.' },
    { id: 'chat.flirt.warm.06', turns: [
      { by: 'a', send: "Okay be honest. Would you go on a date with me when we get out?" },
      { by: 'b', react: "Straight to it!", send: "Honestly? Yes. I would {e:hearteyes}" },
      { by: 'a', send: "Okay good because I already picked the restaurant {e:laugh}" },
    ], beat: '{a} jumps up from the couch and does a lap of the living room.' },
    { id: 'chat.flirt.warm.07', turns: [
      { by: 'a', send: "I think about our chats more than I should {e:hearteyes}" },
      { by: 'b', react: "Oh my God. Okay, me too.", send: "Same. It's a problem honestly {e:laugh}" },
      { by: 'a', send: "A good problem" },
    ], beat: '{b} spins around once in the desk chair.' },
    { id: 'chat.flirt.warm.08', turns: [
      { by: 'a', say: "Say it. Just say it.", send: "Not gonna lie, you're my favorite notification" },
      { by: 'b', react: "Stop. Stop it.", send: "Okay that is the cutest thing anyone has said to me in here {e:heart}" },
    ] },
    { id: 'chat.flirt.warm.09', turns: [
      { by: 'a', send: "When we get out of here, first date is on me" },
      { by: 'b', send: "It's a date. Literally {e:kiss}" },
    ], beat: '{a} throws a pillow in the air and does not catch it.' },
  ],
  'chat.flirt.neutral': [
    { id: 'chat.flirt.neutral.01', turns: [
      { by: 'a', send: "Not gonna lie, you're really cute {e:smile}" },
      { by: 'b', react: "Okay. Let's keep this friendly.", send: "Aw thank you! You're sweet" },
      { by: 'a', say: "Sweet. That's not a no, but it's not a yes." },
    ], beat: '{a} scratches the back of {a.posAdj} neck and leaves the chat.' },
    { id: 'chat.flirt.neutral.02', turns: [
      { by: 'a', send: "So are you single single, or like, single in here?" },
      { by: 'b', react: "Hmm. Careful.", send: "Lol I'm here to make friends and win {e:laugh}" },
      { by: 'a', send: "Fair. Can't blame me for asking {e:wink}" },
      { by: 'b', send: "Never {e:smile}" },
    ], beat: '{b} laughs, then goes quiet and looks at the screen for a while.' },
    { id: 'chat.flirt.neutral.03', turns: [
      { by: 'a', send: "You have the best smile in the whole Circle, just saying" },
      { by: 'b', send: "Haha thank you!! Everyone's smile is nice in here" },
      { by: 'a', say: "That's a friend-zone if I've ever heard one." },
    ], beat: '{a} lies back on the couch and stares at the ceiling.' },
    { id: 'chat.flirt.neutral.04', when: { flirty: true }, turns: [
      { by: 'a', say: "I think {b} likes me. I think.", send: "I keep smiling at your messages. Is that weird?" },
      { by: 'b', react: "Oh no. Is this a thing?", send: "Not weird! Smiling is good lol" },
      { by: 'a', send: "Okay good. I'll keep doing it then" },
    ], beat: '{b} closes the chat and bites {b.posAdj} lip, thinking.' },
    { id: 'chat.flirt.neutral.05', turns: [
      { by: 'a', say: "Just a little bit of flirting. A little.", send: "Can I say your profile picture is kind of distracting {e:hearteyes}" },
      { by: 'b', react: "Ha. Okay.", send: "Lol thank you. I'll try to be less distracting" },
      { by: 'a', say: "That's a polite no. I know a polite no." },
    ], beat: '{a} laughs at the screen and shakes {a.posAdj} head.' },
    { id: 'chat.flirt.neutral.06', turns: [
      { by: 'a', send: "What's your idea of a perfect first date?" },
      { by: 'b', react: "Is this a question or a pitch?", send: "Tacos and a long walk. Nothing big" },
      { by: 'a', send: "I can do tacos {e:wink}" },
      { by: 'b', send: "Everybody can do tacos lol" },
    ], beat: '{b} closes the chat, smiling a little anyway.' },
    { id: 'chat.flirt.neutral.07', turns: [
      { by: 'a', send: "Okay I have to ask. Do you have a type?" },
      { by: 'b', react: "Careful. Don't give it away.", send: "Honestly? Kind and funny. That's it" },
      { by: 'a', say: "Kind and funny. I'm both. Right? I'm both." },
    ] },
    { id: 'chat.flirt.neutral.08', turns: [
      { by: 'a', send: "Hey you {e:smile} Just wanted to say hi before the chaos starts" },
      { by: 'b', send: "Hi! That's sweet. Okay, bracing for chaos" },
    ], beat: '{a} wishes the reply had a winky face in it.' },
  ],
  'chat.flirt.cold': [
    { id: 'chat.flirt.cold.01', turns: [
      { by: 'a', send: "Hey gorgeous {e:wink}" },
      { by: 'b', react: "Gorgeous? We've barely talked.", send: "Lol hi. Let's maybe start with a conversation?" },
      { by: 'a', send: "Fair enough, my bad {e:sweat}" },
    ], beat: '{a} puts {a.posAdj} head in {a.posAdj} hands.' },
    { id: 'chat.flirt.cold.02', turns: [
      { by: 'a', send: "I think we'd be really cute together not gonna lie" },
      { by: 'b', react: "Absolutely not.", send: "I appreciate it but I'm not really looking for that in here" },
      { by: 'a', send: "Totally get it. Friends then {e:smile}" },
      { by: 'b', send: "Friends {e:smile}" },
    ], beat: '{b} rolls {b.posAdj} eyes at the screen and shuts the chat.' },
    { id: 'chat.flirt.cold.03', turns: [
      { by: 'a', say: "Let's see if {b} is interested.", send: "So when do I get to take you out? {e:eyes}" },
      { by: 'b', react: "Way too fast.", send: "Lol when we're both out of here, as friends, maybe" },
    ], leaves: true, beat: '{b} leaves the chat before {a} can reply.' },
    { id: 'chat.flirt.cold.04', turns: [
      { by: 'a', send: "Not gonna lie, I've been thinking about you all day {e:hearteyes}" },
      { by: 'b', react: "All day? We've talked twice.", send: "Haha that's sweet. Let's slow down a little though" },
      { by: 'a', send: "Slow is good. Slow is fine {e:sweat}" },
    ], beat: '{a} drops {a.posAdj} face onto a pillow.' },
    { id: 'chat.flirt.cold.05', turns: [
      { by: 'a', send: "Is it weird that you're my favorite person in here already? {e:wink}" },
      { by: 'b', react: "It's a little weird.", send: "Lol you don't know me yet" },
      { by: 'a', send: "Then let me get to know you" },
      { by: 'b', send: "Let's start with friends and see" },
    ] },
    { id: 'chat.flirt.cold.06', turns: [
      { by: 'a', say: "Go big or go home.", send: "So are we a thing yet or" },
      { by: 'b', react: "We are not a thing.", send: "Lol we are absolutely not a thing" },
      { by: 'a', send: "Noted. Retreating {e:laugh}" },
    ], beat: '{b} shakes {b.posAdj} head and closes the chat.' },
    { id: 'chat.flirt.cold.07', turns: [
      { by: 'a', send: "Your profile picture is my new favorite thing {e:fire}" },
      { by: 'b', react: "Okay. That's a lot.", send: "Thanks lol. What else is new?" },
      { by: 'a', send: "Nothing. That was it" },
    ], beat: '{a} stares at the screen, regretting everything.' },
    { id: 'chat.flirt.cold.08', turns: [
      { by: 'a', send: "Real question. Single? {e:eyes}" },
      { by: 'b', react: "Straight to it.", send: "I'm here to play the game, not to date. Sorry!" },
      { by: 'a', send: "Respect. Game it is" },
    ] },
  ],
  'chat.checkin.warm': [
    { id: 'chat.checkin.warm.01', turns: [
      { by: 'a', say: "{b} had a rough night. I want to make sure {b.sub}'s okay.", send: "Hey. How are you holding up after last night? {e:hug}" },
      { by: 'b', react: "Somebody actually asked.", send: "Honestly not great. That rating hurt" },
      { by: 'a', send: "It's one rating. People still don't know you yet. They will" },
      { by: 'b', send: "Thank you. I really needed to hear that {e:heart}" },
    ], beat: '{b} wipes {b.posAdj} eyes with a sleeve and leaves the chat smiling.' },
    { id: 'chat.checkin.warm.02', turns: [
      { by: 'a', send: "Just wanted to say I'm really glad you're still here {e:heart}" },
      { by: 'b', react: "Aw. Okay, I needed that.", send: "Me too. Last night was scary lol" },
      { by: 'a', send: "Scary is right. We got this though {t:StillStanding}" },
    ], beat: '{b} reads the hashtag out loud twice.' },
    { id: 'chat.checkin.warm.03', when: { hurt: true }, turns: [
      { by: 'a', say: "I know how {b} feels. I was down there too.", send: "Being at the bottom sucks. You okay?" },
      { by: 'b', react: "At least I'm not alone down here.", send: "I'm okay. It's nice to know someone gets it" },
      { by: 'a', send: "We climb together {e:muscle}" },
    ], beat: '{a} goes back to making toast.' },
    { id: 'chat.checkin.warm.04', turns: [
      { by: 'a', send: "Morning! Just checking on you. Did you sleep at all?" },
      { by: 'b', send: "Like two hours lol. My brain wouldn't turn off" },
      { by: 'a', send: "Same honestly. Coffee and a good day. That's the plan" },
      { by: 'b', react: "I like this plan.", send: "Deal {e:sun}" },
    ], beat: '{b} pours a second cup of coffee.' },
    { id: 'chat.checkin.warm.05', turns: [
      { by: 'a', send: "Hey you. Saw the ratings. I just want you to know I've got you {e:heart}" },
      { by: 'b', react: "Okay. That helps.", send: "That means so much right now. Thank you" },
      { by: 'a', send: "We're gonna get you back up there" },
    ], beat: '{b} holds a hand over {b.posAdj} heart.' },
    { id: 'chat.checkin.warm.06', turns: [
      { by: 'a', say: "{b} needs a friend today.", send: "How are you feeling this morning? For real" },
      { by: 'b', send: "For real? Kind of low. But better now that you asked" },
      { by: 'a', send: "Good. I'm here whenever you need to talk {e:hug}" },
    ] },
  ],
  'chat.checkin.neutral': [
    { id: 'chat.checkin.neutral.01', turns: [
      { by: 'a', send: "Hey, you doing okay after last night?" },
      { by: 'b', react: "Why is {a} checking on me?", send: "Yeah I'm fine, thanks for asking" },
      { by: 'a', send: "Okay good. Just checking" },
    ], beat: '{b} looks at the screen for a moment, then closes the chat.' },
    { id: 'chat.checkin.neutral.02', turns: [
      { by: 'a', send: "Hope you're okay today {e:hug}" },
      { by: 'b', send: "Thanks! I'm alright" },
    ], beat: '{a} leaves the chat and heads for the shower.' },
    { id: 'chat.checkin.neutral.03', turns: [
      { by: 'a', say: "I should check on {b}. It'll look good if nothing else.", send: "Hey, how are you feeling?" },
      { by: 'b', send: "I'm good. Just taking it one day at a time" },
      { by: 'a', send: "That's all we can do" },
    ], beat: 'Neither of them adds anything, and the chat closes.' },
  ],
  'chat.checkin.cold': [
    { id: 'chat.checkin.cold.01', turns: [
      { by: 'a', send: "Hey, are you okay after the ratings?" },
      { by: 'b', react: "Don't pretend you care.", send: "I'm fine. You don't have to check on me" },
      { by: 'a', send: "I just wanted to be nice" },
      { by: 'b', send: "Okay. Thanks." },
    ], beat: '{a} stares at the period at the end of the message.' },
    { id: 'chat.checkin.cold.02', turns: [
      { by: 'a', send: "Checking in on you {e:hug}" },
      { by: 'b', react: "Now you're checking in.", send: "Where was this yesterday?" },
      { by: 'a', send: "That's fair. I'm sorry" },
    ], beat: '{b} leaves the chat without answering.' },
    { id: 'chat.checkin.cold.03', turns: [
      { by: 'a', send: "Hey. Rough day?" },
      { by: 'b', send: "I'd rather not talk right now" },
    ], beat: '{a} nods at the screen and closes the chat.' },
  ],
  'chat.ally.warm': [
    { id: 'chat.ally.warm.01', turns: [
      { by: 'a', say: "{b} and I think alike. I want {b.obj} on my side before somebody else gets there.", send: "I'm gonna be real with you. I trust you, and I don't trust a lot of people in here" },
      { by: 'b', react: "Okay. Where is this going?", send: "I feel the same. What are you thinking?" },
      { by: 'a', send: "You and me. We look out for each other. All the way to the end" },
      { by: 'b', react: "Yes. Yes, yes, yes.", send: "I'm in. All the way {t:RideOrDie}" },
    ], beat: '{a} jumps up and punches the air.' },
    { id: 'chat.ally.warm.02', turns: [
      { by: 'a', send: "Can I be honest? I think we'd be really strong together in this game" },
      { by: 'b', send: "Honestly I've been thinking the same thing" },
      { by: 'a', send: "So let's do it. We protect each other if either of us is Influencer" },
      { by: 'b', send: "Deal. Nobody else needs to know {e:detective}" },
    ], beat: '{b} closes the chat and says "I have an ally" to the empty room.' },
    { id: 'chat.ally.warm.03', when: { friends: true }, turns: [
      { by: 'a', say: "We're already close. Let's make it official.", send: "Okay I think it's time. You and me, officially {e:crown}" },
      { by: 'b', react: "Officially. I love that.", send: "Officially official {e:laugh} I've got you no matter what" },
      { by: 'a', send: "No matter what {e:heart}" },
    ], beat: '{a} writes something on the notepad by the couch and underlines it twice.' },
    { id: 'chat.ally.warm.04', turns: [
      { by: 'a', send: "I need to know who's actually in my corner in here. Are you?" },
      { by: 'b', react: "That's a serious question.", send: "Yes. I am. Are you in mine?" },
      { by: 'a', send: "Always. Let's keep this between us" },
    ], beat: '{b} nods slowly at the screen.' },
  ],
  'chat.ally.neutral': [
    { id: 'chat.ally.neutral.01', turns: [
      { by: 'a', send: "I think we should work together in this game. What do you think?" },
      { by: 'b', react: "Hmm. Too early.", send: "I like you a lot. I just don't want to lock anything in yet" },
      { by: 'a', send: "Totally fair. The offer's there" },
    ], beat: '{a} taps the table with one finger, thinking.' },
    { id: 'chat.ally.neutral.02', turns: [
      { by: 'a', send: "If you ever need someone in your corner, I'm here" },
      { by: 'b', send: "Thank you! Same to you" },
      { by: 'a', say: "Same to you. That could mean anything." },
    ], beat: '{a} leaves the chat and looks at {b}’s profile again.' },
    { id: 'chat.ally.neutral.03', turns: [
      { by: 'a', say: "Let's see if {b} bites.", send: "Real talk, who are you closest to in here?" },
      { by: 'b', react: "Why does {a} want to know that?", send: "Honestly I'm trying to get to know everyone equally" },
      { by: 'a', send: "Smart. Me too" },
    ], beat: 'Both of them leave the chat without another word.' },
  ],
  'chat.ally.cold': [
    { id: 'chat.ally.cold.01', turns: [
      { by: 'a', send: "I think you and I should be a team in here" },
      { by: 'b', react: "No. Not with {a}.", send: "I appreciate that, but I'm playing my own game" },
      { by: 'a', send: "Okay. Good luck then" },
    ], beat: '{a} closes the chat and stands up.' },
    { id: 'chat.ally.cold.02', turns: [
      { by: 'a', send: "Do you want to work together? I think we'd be unstoppable" },
      { by: 'b', react: "Unstoppable. Right.", send: "I'm good, thanks. I don't really do alliances" },
    ], beat: '{a} stares at the reply, then gets up and starts cleaning the kitchen.' },
    { id: 'chat.ally.cold.03', turns: [
      { by: 'a', say: "I need numbers. {b} could be one.", send: "Hey, would you want to have each other's backs?" },
      { by: 'b', send: "Lol we barely know each other" },
      { by: 'a', send: "That's fair. Maybe later" },
    ], beat: '{b} shakes {b.posAdj} head and leaves the chat.' },
  ],
  'chat.pitch.warm': [
    { id: 'chat.pitch.warm.01', turns: [
      { by: 'a', say: "The ratings are coming. I need guaranteed points.", send: "Okay real talk. Ratings are soon. You're my number one. Am I yours?" },
      { by: 'b', react: "Okay, straight to business.", send: "Yes! You're my number one" },
      { by: 'a', send: "Perfect. Top spot for each other. Deal?" },
      { by: 'b', send: "Deal {e:handshake}" },
    ], beat: '{a} leaves the chat and says "one" out loud, counting.' },
    { id: 'chat.pitch.warm.02', turns: [
      { by: 'a', send: "I'm putting you first in the ratings. I just wanted you to know" },
      { by: 'b', react: "Oh wow. Okay.", send: "Wait really? You're first for me too" },
      { by: 'a', send: "Then we're good {e:heart} {t:TopTwo}" },
    ], beat: '{b} squeals and falls sideways onto the couch.' },
    { id: 'chat.pitch.warm.03', turns: [
      { by: 'a', say: "One vote I can count on is better than five maybes.", send: "Can I count on you tonight? Because you can count on me" },
      { by: 'b', send: "You can count on me. First place, done" },
    ], beat: '{a} nods and closes the chat.' },
    { id: 'chat.pitch.warm.04', turns: [
      { by: 'a', say: "If we both put each other first, one of us is probably an Influencer.", send: "Wanna make a deal for the ratings?" },
      { by: 'b', send: "I'm listening {e:eyes}" },
      { by: 'a', send: "We both put each other first. Nobody else knows" },
      { by: 'b', react: "Smart.", send: "Done. Our secret {e:detective}" },
    ], beat: '{a} rubs {a.posAdj} hands together.' },
  ],
  'chat.pitch.neutral': [
    { id: 'chat.pitch.neutral.01', turns: [
      { by: 'a', send: "Ratings soon! You're definitely high up for me" },
      { by: 'b', react: "High up. Not first.", send: "Aw thank you! You're high for me too" },
    ], beat: 'Both of them close the chat and go quiet.' },
    { id: 'chat.pitch.neutral.02', turns: [
      { by: 'a', send: "Would you put me first if I put you first?" },
      { by: 'b', react: "I don't make promises before ratings.", send: "I'm gonna go with my gut when the time comes, but you're up there" },
      { by: 'a', send: "Fair. Me too" },
    ], beat: '{a} frowns at the screen.' },
    { id: 'chat.pitch.neutral.03', turns: [
      { by: 'a', send: "Where am I on your list? Asking for a friend {e:laugh}" },
      { by: 'b', send: "Lol top half for sure" },
      { by: 'a', say: "Top half. That's a lot of room." },
    ], beat: '{a} leaves the chat and chews on a pen.' },
  ],
  'chat.pitch.cold': [
    { id: 'chat.pitch.cold.01', turns: [
      { by: 'a', send: "I'll put you first if you put me first" },
      { by: 'b', react: "That's not how I play.", send: "I don't really do rating deals, sorry" },
    ], beat: '{a} sighs and leaves the chat.' },
    { id: 'chat.pitch.cold.02', turns: [
      { by: 'a', send: "Ratings deal? Top spot for each other?" },
      { by: 'b', send: "I think you're asking a lot of people that lol" },
      { by: 'a', send: "Just you, I promise" },
      { by: 'b', send: "Mhm. We'll see" },
    ], beat: '{b} leaves the chat first.' },
    { id: 'chat.pitch.cold.03', turns: [
      { by: 'a', say: "Let's see if {b} will trade spots.", send: "Hey, want to help each other out in the ratings?" },
      { by: 'b', send: "I'll rate how I feel. That's all I can say" },
    ], beat: '{a} crosses a name off the notepad by the couch.' },
  ],
};
