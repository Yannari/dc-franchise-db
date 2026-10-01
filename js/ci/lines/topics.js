// Small talk about a real life (ci/topics.js). Data only. A bond chat that
// is about something: a asks about b's life (the topic comes from b's
// profile: a persona's job and details, a player's own job and hometown), b
// answers from it, and they find something. `chat.topic.fake`: b is a catfish
// (or edited their job) and wings a life they don't have; only the asides
// show it. {topic} is the topic in words ("night shifts"), {town} b's hometown.
const T = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });

export const TOPIC_LINES = {
  ...T('chat.topic.hospital', [
    { turns: [
      { by: 'a', send: "Okay I have to ask. What's the craziest thing you've seen at the hospital?" },
      { by: 'b', send: "Honestly? A guy came in with a TV remote stuck somewhere I will not be typing {e:grimace}" },
      { by: 'a', react: "Oh no. Oh, I love this person.", send: "I need the rest of this story immediately {e:laugh}" },
    ] },
    { turns: [
      { by: 'a', say: "Ask about work. People love talking about work.", send: "Do you ever get to sit down on a shift or is it go go go?" },
      { by: 'b', send: "Sit down?? I eat standing up. At 3am. Out of a vending machine" },
      { by: 'a', send: "You're a superhero and nobody pays you enough {e:pray}" },
    ] },
    { turns: [
      { by: 'a', send: "My mom was a nurse. I know what that job takes out of you" },
      { by: 'b', react: "Oh. Okay, that hit.", send: "Tell your mom a stranger in the Circle says thank you {e:heart}" },
      { by: 'a', react: "A real one. {b} is a real one." },
    ] },
  ]),
  ...T('chat.topic.night-shifts', [
    { turns: [
      { by: 'a', send: "Night shift people, how are you even awake right now?" },
      { by: 'b', send: "My body thinks it's 2am every day of my life. This is normal for me {e:laugh}" },
      { by: 'a', send: "Respect. I'm asleep by 10 and proud of it" },
    ] },
    { turns: [
      { by: 'a', send: "What's the weirdest part of working nights?" },
      { by: 'b', send: "Grocery shopping at 7am with the retirees. We're a team now. They know my name" },
      { by: 'a', react: "That's adorable.", send: "I need a sitcom about this {e:laugh}" },
    ] },
    { turns: [
      { by: 'a', send: "Do you actually sleep during the day or just lie there?" },
      { by: 'b', send: "Blackout curtains, white noise, a fan and prayers {e:pray}" },
      { by: 'a', send: "A whole ritual. I respect a ritual" },
    ] },
  ]),
  ...T('chat.topic.childcare', [
    { turns: [
      { by: 'a', send: "Working with kids all day must mean you have the patience of a saint" },
      { by: 'b', send: "Or I just learned to say 'we don't lick the window' very calmly {e:laugh}" },
      { by: 'a', react: "I'm dying.", send: "That's a life skill honestly" },
    ] },
    { turns: [
      { by: 'a', send: "Best thing a kid ever said to you?" },
      { by: 'b', send: "A four year old told me I looked tired. Then offered me half a cracker. Kindest thing anyone's done for me" },
      { by: 'a', send: "Stop that's so wholesome {e:heart}" },
    ] },
    { turns: [
      { by: 'a', say: "Somebody who looks after kids for a living. That's trust, right there.", send: "So you're basically a professional hugger?" },
      { by: 'b', send: "Professional hugger, snack dealer and referee {e:laugh}" },
    ] },
  ]),
  ...T('chat.topic.gym', [
    { turns: [
      { by: 'a', send: "Be honest. How many push-ups have you done in that apartment already" },
      { by: 'b', send: "Counting today? Like 200. The couch is my bench now {e:muscle}" },
      { by: 'a', react: "Two hundred. I've done zero. I'll do one later. Maybe." },
    ] },
    { turns: [
      { by: 'a', send: "Okay gym question. Leg day, love it or hate it?" },
      { by: 'b', send: "Love it. People who skip leg day are the real catfish {e:side}" },
      { by: 'a', send: "Lmaooo that's going on a shirt" },
    ] },
    { turns: [
      { by: 'a', send: "I need a workout plan for this apartment. Coach me" },
      { by: 'b', send: "Stairs to the loft x20. Chair dips. Plank during every Circle Chat" },
      { by: 'a', react: "Plank during Circle Chat. That's evil.", send: "You're a menace. I'm in {e:fire}" },
    ] },
  ]),
  ...T('chat.topic.bar', [
    { turns: [
      { by: 'a', send: "Bartender question. What's the drink that tells you someone's trouble?" },
      { by: 'b', send: "Anyone who orders a round of shots before they've taken their coat off {e:eyes}" },
      { by: 'a', send: "Noted. I'll keep my coat on" },
    ] },
    { turns: [
      { by: 'a', send: "Worst pickup line you've ever seen at the bar?" },
      { by: 'b', send: "Guy asked a girl if she believed in love at first sight or should he order another drink and walk by again" },
      { by: 'a', react: "That's terrible. I'm stealing it.", send: "I'm crying {e:laugh}" },
    ] },
    { turns: [
      { by: 'a', send: "Make me your signature drink. Describe it" },
      { by: 'b', send: "Tequila, grapefruit, a little spicy. It's called The Blocking {e:fire}" },
      { by: 'a', send: "Okay that's actually fire" },
    ] },
  ]),
  ...T('chat.topic.music', [
    { turns: [
      { by: 'a', send: "Okay what's the song that's been stuck in your head in here?" },
      { by: 'b', send: "Honestly the Circle notification sound. It lives in my brain now {e:mind}" },
      { by: 'a', react: "Same. Oh my God, same." },
    ] },
    { turns: [
      { by: 'a', send: "Music people always have a guilty pleasure. What's yours?" },
      { by: 'b', send: "Early 2000s boy bands and I will not be taking questions" },
      { by: 'a', send: "Nooo that's elite taste actually {e:clap}" },
    ] },
    { turns: [
      { by: 'a', send: "If this whole experience had a soundtrack what song opens it" },
      { by: 'b', send: "Something dramatic. Strings. A choir. Maybe a gong {e:laugh}" },
      { by: 'a', react: "A gong. Yes. For every blocking." },
    ] },
  ]),
  ...T('chat.topic.school', [
    { turns: [
      { by: 'a', send: "Teachers are secretly the funniest people. Tell me a classroom story" },
      { by: 'b', send: "A kid turned in homework with 'my dog ate it' written on it. The dog did not eat it. It was the whole homework" },
      { by: 'a', send: "Honestly that kid is a genius {e:laugh}" },
    ] },
    { turns: [
      { by: 'a', say: "A teacher. Organized, patient. Or pretending to be.", send: "Do you give out grades in real life too? What's my grade so far" },
      { by: 'b', send: "Solid B plus. Participation is great. Extra credit available {e:wink}" },
      { by: 'a', send: "What do I have to do for an A" },
    ] },
    { turns: [
      { by: 'a', send: "Being in here must feel like summer break for you" },
      { by: 'b', send: "It's the first time in years nobody's asked me if they can go to the bathroom {e:laugh}" },
    ] },
  ]),
  ...T('chat.topic.law', [
    { turns: [
      { by: 'a', send: "So as a lawyer, is this whole game basically a cross examination for you" },
      { by: 'b', send: "Every Circle Chat is a deposition and I am taking notes {e:eyes}" },
      { by: 'a', react: "Great. Terrifying. Great." },
    ] },
    { turns: [
      { by: 'a', send: "Do people ask you for free legal advice constantly?" },
      { by: 'b', send: "At every wedding. Every single one. Yes your uncle can sue the neighbor. No he shouldn't" },
      { by: 'a', send: "Lmao I was about to ask you something" },
    ] },
    { turns: [
      { by: 'a', send: "Honest question. Can you tell when somebody's lying in here?" },
      { by: 'b', send: "Usually. People over-explain when they're lying. Just saying {e:side}" },
      { by: 'a', say: "Don't over-explain. Do not over-explain.", send: "Good to know. Short answers only from now on lol" },
    ] },
  ]),
  ...T('chat.topic.firehouse', [
    { turns: [
      { by: 'a', send: "Firefighter question. Is the firehouse chili thing real?" },
      { by: 'b', send: "Very real. There are rivalries. There have been tears {e:fire}" },
      { by: 'a', send: "I need your recipe when we're out of here" },
    ] },
    { turns: [
      { by: 'a', send: "What's it like being the person running in when everyone's running out?" },
      { by: 'b', send: "You don't think about it. You just go. Then you shake a little in the truck after" },
      { by: 'a', react: "Okay. That's real.", send: "Thank you for doing that. Seriously {e:pray}" },
    ] },
    { turns: [
      { by: 'a', send: "Do you ever get calls that are just a cat in a tree" },
      { by: 'b', send: "Once. It was a raccoon. It was not grateful {e:laugh}" },
    ] },
  ]),
  ...T('chat.topic.real-estate', [
    { turns: [
      { by: 'a', send: "Okay realtor, rate your apartment in here. Would you sell it?" },
      { by: 'b', send: "Open concept, great lighting, zero privacy, a TV that yells at you. Priced to move {e:laugh}" },
      { by: 'a', send: "I'd buy it. I'd pay extra for the yelling" },
    ] },
    { turns: [
      { by: 'a', send: "Weirdest thing you've found in a home you were showing?" },
      { by: 'b', send: "A room full of mannequins. Dressed. For the holidays {e:shock}" },
      { by: 'a', react: "Absolutely not.", send: "I'm never buying a home again" },
    ] },
    { turns: [
      { by: 'a', send: "Is selling homes kind of like playing the Circle? Make people like you fast" },
      { by: 'b', send: "It's exactly like this. Smile, compliment the kitchen, close the deal {e:side}" },
      { by: 'a', say: "Close the deal. Noted. Watch the realtor." },
    ] },
  ]),
  ...T('chat.topic.garage', [
    { turns: [
      { by: 'a', send: "Car person question. What's the most ridiculous thing someone brought into the shop?" },
      { by: 'b', send: "Lady said her car was making a noise. It was a phone. Under the seat. Ringing" },
      { by: 'a', send: "I would have charged her anyway {e:laugh}" },
    ] },
    { turns: [
      { by: 'a', send: "Be honest, I need a mechanic I trust after this. You taking clients?" },
      { by: 'b', send: "For you? Friends and family rate {e:handshake}" },
      { by: 'a', react: "Friends and family. We're family now." },
    ] },
    { turns: [
      { by: 'a', send: "What's your dream car?" },
      { by: 'b', send: "An old pickup. Restored. Loud. Nothing digital in it at all" },
      { by: 'a', send: "Honestly after this place, nothing digital sounds amazing" },
    ] },
  ]),
  ...T('chat.topic.campus', [
    { turns: [
      { by: 'a', send: "College question. Dining hall food or ramen in your room?" },
      { by: 'b', send: "Ramen. Every night. I'm a cup noodle connoisseur {e:laugh}" },
      { by: 'a', send: "The Circle kitchen must feel like a five star restaurant then" },
    ] },
    { turns: [
      { by: 'a', send: "What are you even studying? I feel like I never asked" },
      { by: 'b', send: "Honestly half the time I'm not sure either. But I'm passing" },
      { by: 'a', react: "Relatable.", send: "Passing is the goal. Love that" },
    ] },
    { turns: [
      { by: 'a', send: "Is this better or worse than finals week" },
      { by: 'b', send: "Worse. At least in finals you know who's trying to fail you {e:eyes}" },
    ] },
  ]),
  ...T('chat.topic.modeling', [
    { turns: [
      { by: 'a', send: "Okay model, what's the secret to a good profile pic? Asking for everyone in here" },
      { by: 'b', send: "Chin down, eyes up, think about something you love. Like pizza {e:laugh}" },
      { by: 'a', send: "I'm thinking about pizza right now and I look incredible" },
    ] },
    { turns: [
      { by: 'a', send: "Is modeling as glamorous as it looks or is it mostly standing in the cold" },
      { by: 'b', send: "Mostly cold. Mostly waiting. Swimsuits in January {e:grimace}" },
      { by: 'a', send: "Nobody talks about the January swimsuits" },
    ] },
    { turns: [
      { by: 'a', send: "Do people assume stuff about you because of the job?" },
      { by: 'b', send: "All the time. They think I'm shallow. I read. A lot. Just saying" },
      { by: 'a', react: "Okay. There's more to {b} than the pictures." },
    ] },
  ]),
  ...T('chat.topic.kids', [
    { turns: [
      { by: 'a', send: "How are your kids doing without you? Is somebody spoiling them" },
      { by: 'b', send: "Grandma. They're living their best life. I'm probably replaced {e:laugh}" },
      { by: 'a', send: "Nobody replaces a parent. They'll lose it when you're back {e:heart}" },
    ] },
    { turns: [
      { by: 'a', say: "Ask about the kids. Parents light up about the kids.", send: "Tell me something funny your kids did recently" },
      { by: 'b', send: "My youngest told the whole grocery store I snore like a truck. The WHOLE store" },
      { by: 'a', react: "The whole store. Iconic." },
    ] },
    { turns: [
      { by: 'a', send: "Do you miss them a lot in here?" },
      { by: 'b', send: "Every morning. That's why I'm playing this hard {e:pray}" },
      { by: 'a', react: "That's why {b} is here. Okay. I get it." },
    ] },
  ]),
  ...T('chat.topic.dog', [
    { turns: [
      { by: 'a', send: "I saw the dog on your profile. I need a full description right now" },
      { by: 'b', send: "Big, dumb, perfect. Scared of the vacuum. Loves everybody {e:heart}" },
      { by: 'a', send: "That's the best person in your family then" },
    ] },
    { turns: [
      { by: 'a', send: "Dog people are the best people, change my mind" },
      { by: 'b', send: "Can't. Won't. My dog is my therapist {e:laugh}" },
      { by: 'a', react: "Dog people. My people." },
    ] },
    { turns: [
      { by: 'a', send: "Who's watching your dog while you're in here?" },
      { by: 'b', send: "My sister. She sends me pictures every day. Oh wait. She can't. I'm dying inside {e:cry}" },
    ] },
  ]),
  ...T('chat.topic.church', [
    { turns: [
      { by: 'a', send: "Do you have a church family back home?" },
      { by: 'b', send: "The best one. They're definitely praying for me to not get blocked {e:pray}" },
      { by: 'a', send: "Honestly I'll take any prayers I can get in here" },
    ] },
    { turns: [
      { by: 'a', send: "Is it hard staying yourself in a game like this?" },
      { by: 'b', send: "Sometimes. I just try to treat people how I'd want to be treated. Even here" },
      { by: 'a', react: "That's rare in this building." },
    ] },
    { turns: [
      { by: 'a', send: "Okay but do you sing in the choir or no" },
      { by: 'b', send: "I sing LOUDLY. Whether I'm IN the choir is up for debate {e:laugh}" },
    ] },
  ]),
  ...T('chat.topic.college-sports', [
    { turns: [
      { by: 'a', send: "Athlete question. What's your pregame ritual?" },
      { by: 'b', send: "Same playlist, same breakfast, left shoe first. Every time {e:muscle}" },
      { by: 'a', send: "Do you have a pre-ratings ritual now too lol" },
    ] },
    { turns: [
      { by: 'a', send: "Be honest, is the Circle more stressful than a big game?" },
      { by: 'b', send: "A game you can see the other team. In here everybody's on your team until they're not {e:eyes}" },
      { by: 'a', react: "That's the smartest thing anyone's said all week." },
    ] },
    { turns: [
      { by: 'a', send: "What's the trash talk like in your sport" },
      { by: 'b', send: "Brutal. Nothing prepared me for Circle Chat passive aggression though" },
    ] },
  ]),
  ...T('chat.topic.gaming', [
    { turns: [
      { by: 'a', send: "Gamer check. What are you playing when you get out of here" },
      { by: 'b', send: "Anything with a save button. I need to reload a few days in here {e:laugh}" },
      { by: 'a', send: "LOL if only. I'd reload my last Circle Chat" },
    ] },
    { turns: [
      { by: 'a', send: "Is this basically a strategy game for you" },
      { by: 'b', send: "Multiplayer, no respawns, everybody's lying. Yeah. It's my genre {e:cool}" },
      { by: 'a', react: "No respawns. Great. Love that for me." },
    ] },
    { turns: [
      { by: 'a', send: "Do people in chat ever figure out who you are from your streams?" },
      { by: 'b', send: "Not in here. In here I'm just a person who types too fast" },
    ] },
  ]),
  ...T('chat.topic.hometown', [
    { turns: [
      { by: 'a', send: "Wait you're from {town}? What's the one thing I have to eat there" },
      { by: 'b', send: "There's this little place near where I grew up. Get the pancakes. Trust me {e:pray}" },
      { by: 'a', send: "Okay it's decided. We're going to {town} when this is over" },
    ] },
    { turns: [
      { by: 'a', send: "What's {town} like? I've never been" },
      { by: 'b', send: "Honestly? Loud, friendly, and everybody thinks they're the best cook in the family {e:laugh}" },
      { by: 'a', react: "Honestly? That sounds nice." },
    ] },
    { turns: [
      { by: 'a', send: "Does {town} know you're in here? Is the whole place watching?" },
      { by: 'b', send: "Oh they're watching. My aunt has already told everyone. There will be a banner" },
      { by: 'a', send: "A BANNER {e:party}" },
    ] },
  ]),
  // Life in the Circle itself: true for everybody, the thing every real
  // Circle chat drifts to when there is nothing else.
  ...T('chat.topic.circle-life', [
    { turns: [
      { by: 'a', send: "Real question. What are you eating in there? I've had cereal for dinner twice" },
      { by: 'b', send: "I made pasta and burned the pasta. I didn't know you could burn pasta {e:grimace}" },
      { by: 'a', react: "You can't. {b} found a way." },
    ] },
    { turns: [
      { by: 'a', send: "How are you sleeping? Because I'm not" },
      { by: 'b', send: "I wake up every time the fridge hums. I thought it was an alert {e:laugh}" },
      { by: 'a', send: "The fridge ALERT {e:laugh} I'm crying" },
    ] },
    { turns: [
      { by: 'a', send: "First thing you're doing when you get out of here?" },
      { by: 'b', send: "Hug my people. Then a cheeseburger. Then sleep for a week" },
      { by: 'a', send: "That's the correct order honestly" },
    ] },
    { turns: [
      { by: 'a', send: "What do you do all day when there's no chat? I've reorganized my closet three times" },
      { by: 'b', send: "I talk to my plant. The plant's name is Gary. Gary is a good listener {e:laugh}" },
      { by: 'a', react: "Gary. The plant is called Gary.", send: "Tell Gary I said hi" },
    ] },
    { turns: [
      { by: 'a', send: "Do you ever forget there are cameras and then remember and panic" },
      { by: 'b', send: "Constantly. I sang in the shower today. Loudly. I'm so sorry America {e:grimace}" },
      { by: 'a', send: "America needed that honestly" },
    ] },
    { turns: [
      { by: 'a', send: "What do you miss most? Not people. Like a thing" },
      { by: 'b', send: "My own bed. And being able to Google something. Anything" },
      { by: 'a', react: "Googling. Yes. I argued with myself about a movie today and nobody could settle it." },
    ] },
    { turns: [
      { by: 'a', send: "Okay rank the apartment. What's the best part" },
      { by: 'b', send: "The couch. I've basically moved into the couch. The bed is jealous" },
      { by: 'a', send: "The couch is the real MVP" },
    ] },
    { turns: [
      { by: 'a', send: "Be honest, have you talked to yourself out loud yet" },
      { by: 'b', send: "I narrate my own life now. 'Walks to the kitchen. Makes toast.' It's bad" },
      { by: 'a', react: "Okay, same. That's just the Circle." },
    ] },
    { when: { early: false }, turns: [
      { by: 'a', send: "What was the last game like on your end? I was screaming at my TV" },
      { by: 'b', send: "I was standing on my couch. I don't even know why I was standing" },
      { by: 'a', send: "The Circle makes you do things {e:laugh}" },
    ] },
    { turns: [
      { by: 'a', send: "Do you have a routine in there yet? I feel like I'm losing track of days" },
      { by: 'b', send: "Coffee, workout, stare at the screen, panic, lunch, panic, chat. Repeat" },
      { by: 'a', send: "That's literally my schedule too {e:sweat}" },
    ] },
  ]),
  // What the profile says about their love life (the status everyone can see).
  ...T('chat.topic.single', [
    { turns: [
      { by: 'a', send: "Wait your profile says single. How is that possible??" },
      { by: 'b', send: "Honestly? Bad taste in people. I'm working on it {e:laugh}" },
      { by: 'a', send: "Well you're in the right place to meet people. Kind of" },
    ] },
    { turns: [
      { by: 'a', send: "Okay single person question. Worst date you've ever been on?" },
      { by: 'b', send: "They brought their mom. To the date. She ordered for both of us" },
      { by: 'a', react: "They brought their MOM.", send: "Absolutely not. I'm screaming" },
    ] },
    { turns: [
      { by: 'a', send: "What's your type? Asking for the building" },
      { by: 'b', send: "Funny. Kind. Can cook. Laughs at my jokes even when they're bad {e:smile}" },
      { by: 'a', send: "Half of the Circle just sat up straighter" },
    ] },
  ]),
  ...T('chat.topic.taken', [
    { turns: [
      { by: 'a', send: "Your profile says you're taken. Is your person watching right now?" },
      { by: 'b', send: "Oh definitely. Probably yelling at the TV every time I flirt with anyone lol" },
      { by: 'a', send: "Tell them I'm harmless {e:halo}" },
    ] },
    { turns: [
      { by: 'a', send: "How did you two meet? I love a story" },
      { by: 'b', send: "At a gas station. I dropped my coffee on them. They still stuck around {e:heart}" },
      { by: 'a', react: "Stop. That's a movie." },
    ] },
    { turns: [
      { by: 'a', send: "Is it hard being away from them?" },
      { by: 'b', send: "Harder than I thought. I keep turning around to tell them something" },
      { by: 'a', send: "That's really sweet honestly {e:heart}" },
    ] },
  ]),
  ...T('chat.topic.complicated', [
    { turns: [
      { by: 'a', send: "Okay 'it's complicated' is the most interesting status in here. Explain" },
      { by: 'b', send: "Let's just say there's a person, there's a history, and there's a group chat about it {e:grimace}" },
      { by: 'a', react: "A group chat about it. Oh, I need all of it." },
    ] },
    { turns: [
      { by: 'a', send: "Is complicated a good complicated or a bad complicated" },
      { by: 'b', send: "Yes {e:laugh}" },
      { by: 'a', send: "Say less. I understand completely" },
    ] },
    { turns: [
      { by: 'a', send: "Does your complicated person know you're in here?" },
      { by: 'b', send: "They know. They're definitely watching. I'm being on my best behavior {e:halo}" },
      { by: 'a', react: "Best behavior. In the Circle. Good luck with that." },
    ] },
  ]),
  // b is winging a life they don't have: the persona's job, not theirs. a
  // never catches it in these lines (a slip is the engine's call).
  ...T('chat.topic.fake', [
    { turns: [
      { by: 'a', send: "Okay tell me about {topic}. I'm genuinely curious" },
      { by: 'b', react: "{topic}. Sure. What do I know about {topic}? Nothing. Okay.", send: "Honestly it's a lot. Long days. But I love it" },
      { by: 'a', send: "That's awesome. You can tell you love it" },
      { by: 'b', react: "Can you? Great. Because I can't." },
    ] },
    { turns: [
      { by: 'a', send: "What's the hardest part of {topic}? Nobody ever asks" },
      { by: 'b', say: "Keep it vague. Vague is safe.", send: "Probably just staying positive when things get crazy, you know?" },
      { by: 'a', send: "Facts. That's true for anything" },
    ] },
    { turns: [
      { by: 'a', send: "I feel like I don't know anything about {topic}. Teach me something" },
      { by: 'b', react: "Teach? Teach what?", send: "Lol I'm off the clock in here! No shop talk {e:wink}" },
      { by: 'a', send: "Fair enough haha" },
      { by: 'b', react: "Dodged. Barely." },
    ], beat: '{b} lets out a long breath at the screen.' },
    { turns: [
      { by: 'a', send: "Random but how did you end up doing what you do?" },
      { by: 'b', say: "I did my research for this. Use it.", send: "Kind of fell into it honestly. Then I realized I was good at it" },
      { by: 'a', send: "Love that. Best way to find your thing" },
    ] },
    { turns: [
      { by: 'a', send: "Is {topic} as hard as people say?" },
      { by: 'b', send: "Harder. But the people make it worth it {e:heart}" },
      { by: 'b', react: "The people make it worth it? What does that even mean? It doesn't matter. It sounded good." },
    ] },
    { turns: [
      { by: 'a', send: "My cousin keeps saying she wants to do what you do! Small world" },
      { by: 'b', react: "Please don't ask me what your cousin does. Please don't.", send: "Wait really? That's so cool!" },
      { by: 'a', send: "Yeah you two would get along" },
    ] },
    { turns: [
      { by: 'a', send: "Okay what does a normal work day look like for you" },
      { by: 'b', say: "Normal day. Normal day. Coffee. Everybody has coffee.", send: "Coffee first. Then it's nonstop till I get home {e:laugh}" },
      { by: 'a', send: "Coffee first is the only way" },
    ] },
    { turns: [
      { by: 'a', send: "I need a work story. The weirder the better" },
      { by: 'b', react: "A story. Make up a story. Make up a good one.", send: "Honestly I'd need a whole night for that one lol. Ask me at the finale {e:wink}" },
      { by: 'a', send: "Holding you to that" },
    ] },
  ]),
};
