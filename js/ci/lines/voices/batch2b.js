// Voice versions, batch 2b: reacting aloud to Circle Chat and to the Newsfeed (the user, 2026-10-19: out-loud lines
// first). Same rules as batch1.js. No brand names anywhere.
export const VOICES = [
  // ── Circle Chat, reacted to in the apartment ──────────────────────────
  ['circle.react.m01', "Oh, {b} is feeling brave.", {
    hype: "Oh, {b} is feeling BRAVE today!", dry: "Oh. {b} is feeling brave. How nice for {b.obj}.", blunt: "{b} is feeling brave. Bold move.",
    goofy: "Oh, {b} is feeling brave! Like a squirrel crossing a highway!", shy: "Oh. {b} is being really brave in there.", chill: "Whoa, {b}'s feeling brave, dude.",
    catty: "Oh, {b} is feeling brave. Adorable.", diva: "Oh, {b} is feeling brave, darling. A daring little cameo.", stoic: "{b}. Brave." }],
  ['circle.react.m02', "{b} with the energy. I see you.", {
    hype: "{b} with the ENERGY! I SEE you!", dry: "{b} with the energy. I see you. Squinting, but I see you.", blunt: "{b} with the energy. Noted.",
    goofy: "{b} with the energy! Like a puppy that found a stick!", shy: "{b} has so much energy. I see you, {b}.", chill: "{b} bringing the energy, dude. Love it.",
    catty: "{b} with the energy. Somebody had a lot of coffee.", diva: "{b} with the energy! A supporting player with ambition, darling.", stoic: "{b}. Energy." }],
  ['circle.react.m03', "That's the most {b} message ever typed.", {
    hype: "That's the MOST {b} message EVER!", dry: "That's the most {b} message ever typed. Award pending.", blunt: "That's exactly what {b} would say.",
    goofy: "That's the most {b} message ever! If {b} was a message, it would be that message!", shy: "That's so {b}.", chill: "That's such a {b} message, dude.",
    catty: "That's the most {b} message ever typed. Not a compliment.", diva: "That message is pure {b}, darling. A signature move.", stoic: "Very {b}." }],
  ['circle.react.m04', "Wait. Is {b} being serious right now?", {
    hype: "WAIT! Is {b} being SERIOUS right now?!", dry: "Wait. Is {b} serious. I genuinely can't tell.", blunt: "Is {b} serious?",
    goofy: "Wait! Is {b} being serious? Or is that a joke? I'm so confused! I'm always confused!", shy: "Wait, is {b} being serious? I can't tell.", chill: "Wait, is {b} for real right now, dude?",
    catty: "Wait. Is {b} actually serious? Oh, {b}.", diva: "Wait, darling. Is {b} being serious? How dramatic.", stoic: "{b}'s serious?" }],
  ['circle.react.m05', "Okay, {b}. Tell us how you really feel.", {
    hype: "Okay, {b}! Tell us how you REALLY feel!", dry: "Okay, {b}. Tell us how you really feel. Please don't.", blunt: "{b}, just say it.",
    goofy: "Okay, {b}! Tell us how you really feel! With interpretive dance!", shy: "Wow, {b}. That's a lot of feelings.", chill: "Alright, {b}. Tell us how you really feel, dude.",
    catty: "Okay, {b}. Tell us how you really feel. We're all dying to know.", diva: "Okay, {b}. Bare your soul, darling. The stage is yours. Briefly.", stoic: "{b}. Say it." }],
  ['circle.react.m06', "{b} always knows what to say in here. Always.", {
    hype: "{b} ALWAYS knows what to say! ALWAYS!", dry: "{b} always knows what to say. It's a little suspicious.", blunt: "{b} always knows what to say.",
    goofy: "{b} always knows what to say! I always know what to eat! We all have gifts!", shy: "{b} always knows what to say. I wish I did.", chill: "{b} always knows what to say, dude.",
    catty: "{b} always knows what to say. Practiced, I assume.", diva: "{b} always knows the line, darling. A natural.", stoic: "{b} knows what to say." }],
  ['circle.react.m07', "Hm. {b} is trying a little too hard.", {
    hype: "Hm! {b} is trying a little TOO hard!", dry: "Hm. {b} is trying a bit too hard. Bless.", blunt: "{b} is trying too hard.",
    goofy: "Hm. {b} is trying a little too hard. Like me at a karaoke night!", shy: "Hm. {b} might be trying a little too hard.", chill: "{b}'s trying a little hard, dude. Relax.",
    catty: "Hm. {b} is trying so hard. It's exhausting to watch.", diva: "Hm. {b} is overacting, darling.", stoic: "{b}. Trying too hard." }],
  ['circle.react.m08', "{b}, I love you, but read the room.", {
    hype: "{b}! I love you! But READ THE ROOM!", dry: "{b}, I love you. Read the room. Please.", blunt: "{b}, read the room.",
    goofy: "{b}, I love you, but read the room! The room is a whole book! Read it!", shy: "{b}, I like you, but maybe read the room a little.", chill: "{b}, love you, dude, but read the room.",
    catty: "{b}, I love you. But read the room, sweetheart.", diva: "{b}, darling, I adore you. Read the room.", stoic: "{b}. Read the room." }],
  ['circle.react.m09', "Somebody screenshot what {b} just said. Oh wait, we can't.", {
    hype: "Somebody screenshot what {b} said! Oh wait! We CAN'T!", dry: "Somebody screenshot that. Oh. We can't. Tragic.", blunt: "I'd screenshot that if I could.",
    goofy: "Somebody screenshot what {b} said! We can't! I'll just remember it forever!", shy: "I wish I could save what {b} just said.", chill: "Somebody screenshot that. Oh, we can't. Classic.",
    catty: "I wish I could screenshot that. For evidence.", diva: "Someone preserve that line, darling! For the archives!", stoic: "Wish I could save that." }],
  ['circle.react.m10', "I'm laughing. {b} got me with that one.", {
    hype: "I'm LAUGHING! {b} GOT me!", dry: "I laughed. {b} got me. Don't tell anyone.", blunt: "{b} got me. I laughed.",
    goofy: "I'm laughing so hard I snorted! {b} got me!", shy: "I'm laughing. {b} really got me with that.", chill: "Okay, I'm laughing. {b} got me, dude.",
    catty: "I laughed. {b} got me. Annoying.", diva: "I'm laughing, darling! {b} landed that joke!", stoic: "{b} got me. I laughed." }],
  ['circle.react.01', "Of course {b} said that. Of course.", {
    hype: "Of COURSE {b} said that! Of course!", dry: "Of course {b} said that. Of course.", blunt: "Typical {b}.",
    goofy: "Of course {b} said that! Of course! Like a cat knocking a glass off a table!", shy: "Of course {b} said that.", chill: "Of course {b} said that, dude.",
    catty: "Of course {b} said that. Predictable.", diva: "Of course {b} said that, darling. So on brand.", stoic: "Of course." }],
  ['circle.react.02', "I did not expect that from {b}.", {
    hype: "I did NOT expect that from {b}!", dry: "Did not expect that from {b}. Surprised. Mildly.", blunt: "Didn't expect that from {b}.",
    goofy: "I did not expect that from {b}! My jaw is on the floor! I'm picking it up!", shy: "I didn't expect that from {b}.", chill: "Didn't see that coming from {b}, dude.",
    catty: "I did not expect that from {b}. {b} has layers. Thin ones.", diva: "A plot twist from {b}, darling! I didn't see it coming.", stoic: "Didn't expect that." }],
  ['circle.react.03', "Okay, {b} is trying way too hard today.", {
    hype: "Okay! {b} is trying WAY too hard today!", dry: "{b} is trying way too hard today. It's a lot.", blunt: "{b} is trying too hard today.",
    goofy: "{b} is trying way too hard today! Like a balloon trying to be a cloud!", shy: "{b} is trying really hard today.", chill: "{b}'s trying way too hard today, dude.",
    catty: "{b} is trying way too hard today. Sad, really.", diva: "{b} is overacting today, darling. Tone it down.", stoic: "{b}. Too hard today." }],
  ['circle.react.04', "I love {b}'s energy in the group chat.", {
    hype: "I LOVE {b}'s energy in the group chat!", dry: "I like {b}'s energy in the chat. Don't tell {b}.", blunt: "I like {b}'s energy in the chat.",
    goofy: "I love {b}'s energy in the chat! Like sprinkles on a grumpy cupcake!", shy: "I really love {b}'s energy in the chat.", chill: "{b}'s energy in the chat is great, dude.",
    catty: "I love {b}'s energy. One of the few I can stand.", diva: "I adore {b}'s energy in the chat, darling. Nearly a star.", stoic: "Good energy, {b}." }],
  ['circle.react.05', "Every time {b} posts, I roll my eyes. Every time.", {
    hype: "Every time {b} posts, I ROLL my eyes! EVERY TIME!", dry: "Every time {b} posts, I roll my eyes. They're getting a workout.", blunt: "{b} posts, I roll my eyes. Every time.",
    goofy: "Every time {b} posts, I roll my eyes! My eyes are getting dizzy!", shy: "Every time {b} posts, I kind of roll my eyes. Is that bad?", chill: "Every time {b} posts, I roll my eyes, dude.",
    catty: "Every time {b} posts, I roll my eyes. It's become a reflex.", diva: "Every time {b} posts, I roll my eyes, darling. Dramatically.", stoic: "{b} posts. I roll my eyes." }],
  ['circle.react.06', "Hm. {b} is being extra nice today. Why?", {
    hype: "Hm! {b} is being EXTRA nice today! WHY?!", dry: "{b} is being extra nice today. Why. What does {b} want.", blunt: "{b}'s extra nice today. Why?",
    goofy: "Hm! {b} is being extra nice today! Did {b} eat a happy pill? Is that a thing?", shy: "Hm. {b} is being really nice today. I wonder why.", chill: "{b}'s extra nice today, dude. What's up with that?",
    catty: "{b} is being extra nice today. Somebody wants something.", diva: "{b} is extra sweet today, darling. What's the motive?", stoic: "{b}. Extra nice. Why?" }],
  ['circle.react.07', "{b} always has something to say in there.", {
    hype: "{b} ALWAYS has something to say in there!", dry: "{b} always has something to say. Always. Every time.", blunt: "{b} always has something to say.",
    goofy: "{b} always has something to say! Like a parrot! A lovely parrot!", shy: "{b} always has something to say. I wish I did.", chill: "{b} always has something to say, dude.",
    catty: "{b} always has something to say. Not always something good.", diva: "{b} always has a line, darling. Not always a good one.", stoic: "{b} always talks." }],
  ['circle.react.08', "I'm not saying anything in there. I'm just watching.", {
    hype: "I'm not saying ANYTHING! Just WATCHING!", dry: "I'm not saying anything. I'm watching. It's my cardio.", blunt: "I'm not talking. I'm watching.",
    goofy: "I'm not saying anything! I'm just watching! Like a cat in a window!", shy: "I'm not saying anything in there. I'm just watching.", chill: "Not saying anything, dude. Just watching.",
    catty: "I'm not saying anything. I'm taking notes.", diva: "I'm not saying a word, darling. A star knows when to be silent.", stoic: "Watching." }],
  ['circle.react.09', "That's the most {b} message I've ever read.", {
    hype: "That's the MOST {b} message I've EVER read!", dry: "That's the most {b} message I've ever read. And I've read them all.", blunt: "That's so {b}.",
    goofy: "That's the most {b} message ever! I want to frame it! I don't have a frame!", shy: "That's such a {b} message.", chill: "Most {b} message ever, dude.",
    catty: "That's the most {b} message I've ever read. Unfortunately.", diva: "The most {b} message ever written, darling.", stoic: "Very {b}." }],
  ['circle.react.w01', "{b} always knows what to say in there. That's either sweet or scary.", {
    hype: "{b} ALWAYS knows what to say! That's either sweet or SCARY!", dry: "{b} always knows what to say. Sweet or scary. Leaning scary.", blunt: "{b} always knows what to say. Sweet or scary.",
    goofy: "{b} always knows what to say! Sweet or scary? Sweet-scary! Like candy corn!", shy: "{b} always knows what to say. That's either sweet or a little scary.", chill: "{b} always knows what to say, dude. Sweet or scary.",
    catty: "{b} always knows what to say. That's scary, not sweet.", diva: "{b} always has the perfect line, darling. Sweet or sinister.", stoic: "{b} knows what to say. Sweet or scary." }],
  ['circle.react.w02', "Okay, {b}. I see you.", {
    hype: "Okay, {b}! I SEE YOU!", dry: "Okay, {b}. I see you. Barely, but I see you.", blunt: "I see you, {b}.",
    goofy: "Okay, {b}! I see you! I'm waving! You can't see me waving!", shy: "Okay, {b}. I see you.", chill: "Okay, {b}. I see you, dude.",
    catty: "Okay, {b}. I see you. I see everything.", diva: "Okay, {b}. I see you, darling.", stoic: "I see you, {b}." }],
  ['circle.react.w03', "{b} sounds happy today. Good for {b}.", {
    hype: "{b} sounds SO happy today! Good for {b}!", dry: "{b} sounds happy today. Good for {b}. Somebody should be.", blunt: "{b} sounds happy. Good.",
    goofy: "{b} sounds happy today! Good for {b}! Happy {b}! Happy me!", shy: "{b} sounds really happy today. That's nice.", chill: "{b} sounds happy today, dude. Good for {b}.",
    catty: "{b} sounds happy today. Good for {b}. Enjoy it while it lasts.", diva: "{b} sounds radiant today, darling. Good for {b}.", stoic: "{b}'s happy. Good." }],
  ['circle.react.w04', "I wanna know what {b} really meant by that.", {
    hype: "I WANNA know what {b} REALLY meant by that!", dry: "I want to know what {b} actually meant by that. Translation needed.", blunt: "What did {b} mean by that?",
    goofy: "I want to know what {b} really meant! Is it a code? I love codes!", shy: "I really want to know what {b} meant by that.", chill: "What did {b} mean by that, dude?",
    catty: "I want to know exactly what {b} meant by that. I have a guess.", diva: "What did {b} really mean, darling? The subtext!", stoic: "What did {b} mean?" }],
  ['circle.react.w05', "{b} is the glue of that group chat. Honestly.", {
    hype: "{b} is the GLUE of that group chat! Honestly!", dry: "{b} is the glue of that chat. Honestly. Weird but true.", blunt: "{b} holds that chat together.",
    goofy: "{b} is the glue of that group chat! The sparkly glue! The good kind!", shy: "{b} is kind of the glue of that group chat.", chill: "{b}'s the glue of that chat, dude.",
    catty: "{b} is the glue of that chat. Somebody has to be.", diva: "{b} holds the ensemble together, darling.", stoic: "{b} holds it together." }],
  ['circle.react.w06', "Hm. That's a very careful message, {b}.", {
    hype: "Hm! That's a VERY careful message, {b}!", dry: "Hm. Very careful message, {b}. Every word measured.", blunt: "That's a careful message, {b}.",
    goofy: "Hm! That's a very careful message, {b}! Like walking on eggs! Tiny eggs!", shy: "That's a really careful message, {b}.", chill: "That's a careful message, {b}, dude.",
    catty: "Hm. That's a very careful message, {b}. What are you hiding?", diva: "A carefully staged message, {b}, darling.", stoic: "Careful message, {b}." }],
  ['circle.react.w07', "Every time {b} posts, the whole chat perks up.", {
    hype: "Every time {b} posts, the WHOLE chat perks up!", dry: "Every time {b} posts, the chat perks up. Must be nice.", blunt: "{b} posts, the chat perks up.",
    goofy: "Every time {b} posts, the chat perks up! Like flowers in the sun!", shy: "Every time {b} posts, the chat gets happier.", chill: "Every time {b} posts, the chat perks up, dude.",
    catty: "Every time {b} posts, the whole chat perks up. Followers.", diva: "Every time {b} posts, the audience perks up, darling. Hm.", stoic: "{b} posts. Chat perks up." }],
  ['circle.react.w08', "I'm keeping my mouth shut and my eyes on {b}.", {
    hype: "Keeping my mouth SHUT and my eyes on {b}!", dry: "Mouth shut. Eyes on {b}. Very spy of me.", blunt: "Mouth shut. Eyes on {b}.",
    goofy: "I'm keeping my mouth shut and my eyes on {b}! Like a detective! With a little hat!", shy: "I'm just going to stay quiet and watch {b}.", chill: "Keeping quiet, dude. Eyes on {b}.",
    catty: "I'm keeping my mouth shut and my eyes on {b}. For now.", diva: "Silent, darling. All eyes on {b}.", stoic: "Quiet. Watching {b}." }],
  ['circle.react.w09', "Of course {b} was first to answer. Of course.", {
    hype: "Of COURSE {b} was first to answer!", dry: "Of course {b} answered first. Of course.", blunt: "{b} answered first. Of course.",
    goofy: "Of course {b} was first to answer! {b} is the fastest typer in the west!", shy: "Of course {b} was first to answer.", chill: "Of course {b} answered first, dude.",
    catty: "Of course {b} was first to answer. Desperate.", diva: "Of course {b} was first, darling. Eager to be seen.", stoic: "{b} first. Of course." }],
  // ── a low status, before posting ──────────────────────────────────────
  ['status.low.m02', "Be honest, but not too honest.", {
    hype: "Be honest! But not TOO honest!", dry: "Be honest. But not too honest. Nobody likes too honest.", blunt: "Be honest. Not too honest.",
    goofy: "Be honest! But not too honest! Like a fortune cookie!", shy: "Be honest. But not too honest. Okay. I can do this.", chill: "Be honest, but not too honest, dude.",
    catty: "Be honest. But not too honest. They can't handle it.", diva: "Honest, darling, but not too honest. Mystery sells.", stoic: "Honest. Not too honest." }],
  ['status.low.m05', "Post something real. Just once.", {
    hype: "Post something REAL! Just ONCE!", dry: "Post something real. Just once. Revolutionary.", blunt: "Post something real. Once.",
    goofy: "Post something real! Just once! A real thing! Not a picture of my lunch!", shy: "Maybe I should post something real. Just once.", chill: "Post something real, man. Just once.",
    catty: "Post something real. Show them how it's done.", diva: "Post something real, darling. A moment of truth.", stoic: "Something real. Once." }],
  ['status.low.m09', "Don't look weak. Just look human.", {
    hype: "Don't look WEAK! Just look HUMAN!", dry: "Don't look weak. Look human. Same thing, mostly.", blunt: "Not weak. Human.",
    goofy: "Don't look weak! Look human! I'm mostly human! Some days!", shy: "Don't look weak. Just look human. I can do that.", chill: "Don't look weak, just human. Easy.",
    catty: "Don't look weak. Never look weak.", diva: "Not weak, darling. Vulnerable. There's a difference.", stoic: "Human. Not weak." }],
  ['status.low.01', "I don't want to fake happy today.", {
    hype: "I don't want to FAKE happy today!", dry: "I don't want to fake happy today. Too much effort.", blunt: "Not faking happy today.",
    goofy: "I don't want to fake happy today! My happy face is tired!", shy: "I don't want to fake being happy today.", chill: "Not faking happy today, dude.",
    catty: "I don't fake happy. Not today.", diva: "No fake smiles today, darling. Today, the truth.", stoic: "Not faking it today." }],
  ['status.low.03', "They put me at the bottom. Fine. Watch me climb.", {
    hype: "They put me at the BOTTOM?! Fine! WATCH ME CLIMB!", dry: "Bottom. Fine. I'll climb. Slowly. With complaints.", blunt: "Bottom. Fine. I'll climb.",
    goofy: "They put me at the bottom! Fine! I'll climb like a little mountain goat!", shy: "They put me at the bottom. Okay. I'll try to climb.", chill: "Bottom, huh? Fine. I'll climb, dude.",
    catty: "They put me at the bottom. They'll regret it.", diva: "The bottom? Darling, every great comeback starts here.", stoic: "Bottom. I'll climb." }],
  ['status.low.06', "I'm so tired of being in my own head.", {
    hype: "I'm SO tired of being in my own head!", dry: "I'm tired of being in my own head. It's crowded.", blunt: "Tired of my own head.",
    goofy: "I'm so tired of being in my own head! It's messy in there! Snack wrappers everywhere!", shy: "I'm so tired of being in my own head.", chill: "So tired of being in my own head, dude.",
    catty: "I'm tired of being in my own head. It's the only good company in here, though.", diva: "I'm weary of my own thoughts, darling. Such a lonely stage.", stoic: "Tired of my own head." }],
  ['status.low.08', "Honest post. People like honest.", {
    hype: "Honest post! People LOVE honest!", dry: "Honest post. People like honest. Allegedly.", blunt: "Honest post.",
    goofy: "Honest post! People like honest! And puppies! But I don't have a puppy!", shy: "An honest post. People like honest, right?", chill: "Honest post. People dig honest.",
    catty: "Honest post. People like honest. They say.", diva: "An honest post, darling. Raw. Authentic.", stoic: "Honest post." }],
  // ── the Newsfeed, reacted to ──────────────────────────────────────────
  ['status.react.m01', "Aw, {b}. I needed that today.", {
    hype: "Aw, {b}! I NEEDED that today!", dry: "Aw, {b}. I needed that. Don't tell anyone.", blunt: "{b}, I needed that.",
    goofy: "Aw, {b}! I needed that today! Like a hug from a cartoon bear!", shy: "Aw, {b}. I really needed that today.", chill: "Aw, {b}. Needed that today, dude.",
    catty: "Aw, {b}. I needed that. Surprisingly.", diva: "Aw, {b}. Exactly the scene I needed today, darling.", stoic: "Needed that, {b}." }],
  ['status.react.m02', "{b} always posts at the perfect time.", {
    hype: "{b} ALWAYS posts at the PERFECT time!", dry: "{b} always posts at the perfect time. Suspiciously perfect.", blunt: "{b}'s timing is perfect.",
    goofy: "{b} always posts at the perfect time! Like a pizza arriving just as you get hungry!", shy: "{b} always posts at the perfect time.", chill: "{b}'s timing is always perfect, dude.",
    catty: "{b} always posts at the perfect time. Planned, obviously.", diva: "{b}'s timing is impeccable, darling.", stoic: "{b}. Good timing." }],
  ['status.react.m03', "That's a very {b} status. I love it.", {
    hype: "That's SUCH a {b} status! I LOVE it!", dry: "Very {b} status. I love it. Quietly.", blunt: "Very {b}. I like it.",
    goofy: "That's a very {b} status! I love it! I love it like a sandwich!", shy: "That's such a {b} status. I love it.", chill: "Very {b} status, dude. Love it.",
    catty: "That's a very {b} status. I almost love it.", diva: "A very {b} status, darling. I adore it.", stoic: "Very {b}. Good." }],
  ['status.react.m04', "Is {b} okay? That felt like a lot.", {
    hype: "Is {b} OKAY?! That was a LOT!", dry: "Is {b} okay. That felt like a lot.", blunt: "Is {b} okay? That was a lot.",
    goofy: "Is {b} okay? That felt like a lot! Somebody send {b} a muffin!", shy: "Is {b} okay? That felt like a lot.", chill: "Is {b} okay, dude? That felt like a lot.",
    catty: "Is {b} okay? That was a lot. Even for {b}.", diva: "Is {b} alright, darling? That was quite the monologue.", stoic: "{b} okay? That was a lot." }],
  ['status.react.m05', "Circle, like {b}'s status. Obviously.", {
    hype: "Circle, like {b}'s status! OBVIOUSLY!", dry: "Circle, like {b}'s status. Obviously. I'm not a monster.", blunt: "Circle, like it.",
    goofy: "Circle, like {b}'s status! Obviously! Double like if you can!", shy: "Circle, like {b}'s status, please.", chill: "Circle, like {b}'s status. Obviously, dude.",
    catty: "Circle, like {b}'s status. Obviously. I'm generous.", diva: "Circle, like {b}'s status. A gift from the star.", stoic: "Like it." }],
  ['status.react.01', "Aw, look at {b}. I love that.", {
    hype: "Aw, look at {b}! I LOVE that!", dry: "Aw. Look at {b}. I love that. Moving on.", blunt: "Look at {b}. I love that.",
    goofy: "Aw, look at {b}! I love that! I love it like I love cereal!", shy: "Aw, look at {b}. I really love that.", chill: "Aw, look at {b}. Love that, dude.",
    catty: "Aw, look at {b}. I love that. I do.", diva: "Aw, look at {b}, darling. Adorable.", stoic: "{b}. Love that." }],
  ['status.react.02', "Oh, please. {b} is putting on a show.", {
    hype: "Oh, PLEASE! {b} is putting on a SHOW!", dry: "Oh, please. {b} is putting on a show. A matinee.", blunt: "{b} is putting on a show.",
    goofy: "Oh, please! {b} is putting on a show! Where's my popcorn?", shy: "Hm. I think {b} is putting on a bit of a show.", chill: "Oh, please. {b}'s putting on a show, dude.",
    catty: "Oh, please. {b} is putting on a show. A bad one.", diva: "Oh, please, darling. {b} is performing. And not well.", stoic: "{b}. Putting on a show." }],
  ['status.react.03', "Okay, that's cute. I'll give {b.obj} that.", {
    hype: "Okay, that's CUTE! I'll give {b.obj} that!", dry: "Okay. That's cute. I'll give {b.obj} that. Begrudgingly.", blunt: "That's cute. Fair.",
    goofy: "Okay, that's cute! I'll give {b.obj} that! And a gold star!", shy: "Okay, that's really cute.", chill: "Okay, that's cute. I'll give {b.obj} that, dude.",
    catty: "Okay, that's cute. I'll give {b.obj} that. Just this once.", diva: "Okay, that's charming, darling. I'll allow it.", stoic: "Cute. Fair." }],
  ['status.react.04', "Interesting. Very interesting. Circle, like {b}'s status.", {
    hype: "Interesting! VERY interesting! Circle, like it!", dry: "Interesting. Very interesting. Circle, like it. Hm.", blunt: "Interesting. Circle, like it.",
    goofy: "Interesting! Very interesting! Circle, like it! I don't know why it's interesting! Like it!", shy: "Interesting. Circle, like {b}'s status, please.", chill: "Interesting, dude. Circle, like it.",
    catty: "Interesting. Very interesting. Circle, like it. Strategically.", diva: "Intriguing, darling. Circle, like it.", stoic: "Interesting. Like it." }],
  ['status.react.05', "Hm. What's {b} trying to say with that?", {
    hype: "Hm! What is {b} trying to SAY with that?!", dry: "Hm. What is {b} trying to say. Subtitles, please.", blunt: "What's {b} trying to say?",
    goofy: "Hm! What's {b} trying to say? Is it about pancakes? I hope it's about pancakes!", shy: "Hm. What is {b} trying to say?", chill: "What's {b} trying to say with that, dude?",
    catty: "Hm. What's {b} trying to say? Nothing nice, I suspect.", diva: "What's the subtext, {b}, darling?", stoic: "What's {b} saying?" }],
  ['status.react.06', "That doesn't sound like a real person. That sounds like a greeting card.", {
    hype: "That doesn't sound like a REAL person! That's a GREETING CARD!", dry: "That doesn't sound like a person. That sounds like a greeting card. A cheap one.", blunt: "That's not a real person. That's a greeting card.",
    goofy: "That doesn't sound like a real person! That sounds like a greeting card! With a kitten on it!", shy: "That doesn't sound like a real person. It sounds like a greeting card.", chill: "That doesn't sound real, dude. Sounds like a greeting card.",
    catty: "That's not a real person. That's a greeting card with a profile picture.", diva: "That's not a person, darling. That's a greeting card.", stoic: "Not a real person. A greeting card." }],
  ['status.react.07', "Ha. Same, {b}. Same.", {
    hype: "HA! SAME, {b}! SAME!", dry: "Ha. Same, {b}. Same.", blunt: "Same, {b}.",
    goofy: "Ha! Same, {b}! Same! We're the same person! Twins!", shy: "Ha. Same, {b}.", chill: "Ha. Same, {b}. Same, dude.",
    catty: "Ha. Same, {b}. For once.", diva: "Ha. Same, darling. Same.", stoic: "Same." }],
  ['status.react.08', "{b} is always so positive. How?", {
    hype: "{b} is ALWAYS so positive! HOW?!", dry: "{b} is always so positive. How. Teach me. Actually, don't.", blunt: "How is {b} always so positive?",
    goofy: "{b} is always so positive! How? Is {b} solar powered?", shy: "{b} is always so positive. How does {b} do it?", chill: "{b}'s always so positive, dude. How?",
    catty: "{b} is always so positive. It's exhausting.", diva: "{b} is always so radiant, darling. How?", stoic: "{b}. Always positive. How?" }],
  ['status.react.09', "Circle, like {b}'s status. See? I'm nice.", {
    hype: "Circle, like {b}'s status! See?! I'm NICE!", dry: "Circle, like {b}'s status. See. I'm nice. Write it down.", blunt: "Circle, like it. I'm nice.",
    goofy: "Circle, like {b}'s status! See? I'm nice! So nice! Nicest person in the building!", shy: "Circle, like {b}'s status. I'm trying to be nice.", chill: "Circle, like it. See? I'm nice, dude.",
    catty: "Circle, like {b}'s status. See? I can be nice.", diva: "Circle, like it, darling. See? Gracious.", stoic: "Like it. I'm nice." }],
  ['status.react.10', "Okay, {b}. We get it. You're having a great time.", {
    hype: "Okay, {b}! We GET it! You're having a GREAT time!", dry: "Okay, {b}. We get it. Great time. Wonderful.", blunt: "We get it, {b}.",
    goofy: "Okay, {b}! We get it! You're having the best time! Like a dog in a car!", shy: "Okay, {b}. We know you're having a great time.", chill: "Okay, {b}. We get it, dude. Great time.",
    catty: "Okay, {b}. We get it. You're having a great time. Must be nice.", diva: "Yes, {b}, darling. We get it. Bliss.", stoic: "We get it, {b}." }],
  ['status.react.11', "That is the most {b} thing I've ever read.", {
    hype: "That is the MOST {b} thing I've EVER read!", dry: "That is the most {b} thing I've ever read. Congratulations, {b}.", blunt: "Most {b} thing ever.",
    goofy: "That's the most {b} thing ever! I want it on a T-shirt!", shy: "That's the most {b} thing I've read.", chill: "Most {b} thing ever, dude.",
    catty: "That's the most {b} thing I've ever read. Sadly.", diva: "The most {b} thing ever written, darling.", stoic: "Very {b}." }],
  ['status.react.12', "Aw. I needed that today.", {
    hype: "Aw! I NEEDED that today!", dry: "Aw. Needed that today. Don't tell anyone.", blunt: "Needed that.",
    goofy: "Aw! I needed that today! Like a cookie after a long day!", shy: "Aw. I really needed that today.", chill: "Aw. Needed that today, dude.",
    catty: "Aw. I needed that today. Fine.", diva: "Aw. Just what I needed today, darling.", stoic: "Needed that." }],
  ['status.react.13', "Circle, like it. No, wait. Unlike. No. Like it.", {
    hype: "Circle, LIKE IT! No! UNLIKE! No! LIKE IT!", dry: "Circle, like it. No. Unlike. No. Like it. I hate this.", blunt: "Like it. No. Yes. Like it.",
    goofy: "Circle, like it! No, wait! Unlike! No! Like it! I'm a mess!", shy: "Circle, like it. Um, no, unlike. No. Like it. Sorry.", chill: "Like it. No, unlike. Ugh. Like it, dude.",
    catty: "Circle, like it. No. Unlike. No. Like it. I don't want anyone thinking I care.", diva: "Like it! No! Unlike! Darling, I can't decide! Like it!", stoic: "Like it. No. Yes. Like." }],
  ['status.react.14', "Who posts this early? {b}, that's who.", {
    hype: "Who posts this EARLY? {b}! That's who!", dry: "Who posts this early. {b}. Naturally.", blunt: "Who posts this early? {b}.",
    goofy: "Who posts this early? {b}! Like a rooster with a phone!", shy: "Who posts this early? {b}, I guess.", chill: "Who posts this early, dude? {b}, that's who.",
    catty: "Who posts this early? {b}. Of course.", diva: "Who posts at dawn, darling? {b}. Eager.", stoic: "Early post. {b}." }],
  ['status.react.15', "Hm. Not sure how I feel about that one.", {
    hype: "Hm! Not SURE how I feel about that one!", dry: "Hm. Not sure how I feel about that one. Undecided. Leaning no.", blunt: "Not sure about that one.",
    goofy: "Hm! Not sure how I feel about that one! My feelings are confused!", shy: "Hm. I'm not sure how I feel about that one.", chill: "Not sure how I feel about that one, dude.",
    catty: "Hm. Not sure how I feel about that one. Not good, I think.", diva: "Hm. I'm not sure about that one, darling.", stoic: "Not sure about that." }],
  ['status.react.16', "I love that for {b.obj}.", {
    hype: "I LOVE that for {b.obj}!", dry: "I love that for {b.obj}. Really.", blunt: "Love that for {b.obj}.",
    goofy: "I love that for {b.obj}! I love it so much I'm doing a little dance!", shy: "I really love that for {b.obj}.", chill: "Love that for {b.obj}, dude.",
    catty: "I love that for {b.obj}. Genuinely.", diva: "I adore that for {b.obj}, darling.", stoic: "Good for {b.obj}." }],
  ['status.react.17', "Ha! That got me.", {
    hype: "HA! That GOT me!", dry: "Ha. That got me. Rare.", blunt: "Ha. Got me.",
    goofy: "Ha! That got me! I laughed so hard I fell off the couch!", shy: "Ha. That got me.", chill: "Ha! That got me, dude.",
    catty: "Ha. That got me. Annoyingly.", diva: "Ha! That got me, darling!", stoic: "Ha. Got me." }],
  ['status.react.18', "Is that a dig at somebody? It feels like a dig.", {
    hype: "Is that a DIG at somebody?! It FEELS like a dig!", dry: "Is that a dig at somebody. It feels like a dig. A small one.", blunt: "That's a dig.",
    goofy: "Is that a dig at somebody? It feels like a dig! Like a little shovel!", shy: "Is that a dig at somebody? It kind of feels like one.", chill: "Is that a dig at someone, dude?",
    catty: "That's a dig. Not a good one, but a dig.", diva: "Is that a dig, darling? How deliciously petty.", stoic: "A dig." }],
  ['status.react.19', "That's my {b}! Circle, like it.", {
    hype: "That's MY {b}! Circle, LIKE IT!", dry: "That's my {b}. Circle, like it. Obviously.", blunt: "That's my {b}. Like it.",
    goofy: "That's my {b}! Circle, like it! Like it a hundred times!", shy: "That's my {b}. Circle, please like it.", chill: "That's my {b}! Circle, like it, dude.",
    catty: "That's my {b}. Circle, like it.", diva: "That's my {b}, darling! Circle, like it!", stoic: "My {b}. Like it." }],
  ['status.react.20', "Of course {b} posted that. Of course.", {
    hype: "Of COURSE {b} posted that! Of COURSE!", dry: "Of course {b} posted that. Of course.", blunt: "Of course {b} did.",
    goofy: "Of course {b} posted that! Of course! Like a cat bringing you a sock!", shy: "Of course {b} posted that.", chill: "Of course {b} posted that, dude.",
    catty: "Of course {b} posted that. So predictable.", diva: "Of course {b} posted that, darling. Desperate.", stoic: "Of course." }],
  ['status.react.21', "No one is that happy in the morning. No one.", {
    hype: "NO ONE is that happy in the morning! NO ONE!", dry: "No one is that happy in the morning. No one. It's not natural.", blunt: "Nobody's that happy in the morning.",
    goofy: "No one is that happy in the morning! Except birds! And birds don't post!", shy: "Nobody is that happy in the morning.", chill: "No one's that happy in the morning, dude.",
    catty: "No one is that happy in the morning. No one who's being honest.", diva: "No one is that radiant in the morning, darling. Except me.", stoic: "Nobody's that happy that early." }],
  ['status.react.22', "Aw, {b}. Hang in there.", {
    hype: "Aw, {b}! HANG IN THERE!", dry: "Aw, {b}. Hang in there. We all are.", blunt: "Hang in there, {b}.",
    goofy: "Aw, {b}! Hang in there! Like a kitten on a poster!", shy: "Aw, {b}. Please hang in there.", chill: "Hang in there, {b}. You got this, dude.",
    catty: "Aw, {b}. Hang in there. It gets better. Maybe.", diva: "Aw, {b}. Hang in there, darling.", stoic: "Hang in there, {b}." }],
  ['status.react.23', "Somebody should check on {b}. Maybe me.", {
    hype: "Somebody should check on {b}! Maybe ME!", dry: "Somebody should check on {b}. Fine. Me.", blunt: "Someone should check on {b}. Me.",
    goofy: "Somebody should check on {b}! Maybe me! I'll bring snacks!", shy: "Somebody should check on {b}. Maybe I will.", chill: "Somebody should check on {b}. Maybe me, dude.",
    catty: "Somebody should check on {b}. I suppose it'll be me.", diva: "Somebody should check on {b}, darling. Perhaps the star.", stoic: "I'll check on {b}." }],
  ['status.react.24', "Oof. I felt that one.", {
    hype: "OOF! I felt that one!", dry: "Oof. Felt that. Deeply.", blunt: "Oof. Felt that.",
    goofy: "Oof! I felt that one! Right in the snack zone!", shy: "Oof. I felt that one.", chill: "Oof. Felt that one, dude.",
    catty: "Oof. Felt that. Didn't like it.", diva: "Oof. I felt that in my soul, darling.", stoic: "Felt that." }],
  ['status.react.25', "No. Not {b}. {b} deserves a good day.", {
    hype: "NO! Not {b}! {b} deserves a GOOD day!", dry: "No. Not {b}. {b} deserves a good day. Somebody does.", blunt: "Not {b}. {b} deserves a good day.",
    goofy: "No! Not {b}! {b} deserves a good day! With balloons!", shy: "No. Not {b}. {b} deserves a good day.", chill: "No, not {b}, dude. {b} deserves a good day.",
    catty: "No. Not {b}. {b} deserves better than this place.", diva: "No, not {b}, darling. {b} deserves a standing ovation.", stoic: "Not {b}. {b} deserves better." }],
  ['status.react.26', "A sad post. Interesting timing.", {
    hype: "A SAD post?! Interesting TIMING!", dry: "A sad post. Interesting timing. Very interesting.", blunt: "Sad post. Convenient timing.",
    goofy: "A sad post! Interesting timing! Like crying at a birthday party!", shy: "A sad post. That's interesting timing.", chill: "Sad post, dude. Interesting timing.",
    catty: "A sad post. Right before the ratings. Interesting.", diva: "A sad post, darling. Perfectly timed for sympathy.", stoic: "Sad post. Interesting timing." }],
];
