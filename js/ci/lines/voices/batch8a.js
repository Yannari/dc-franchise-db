// Voice versions, batch 8a (the user, 2026-10-20: "yes do the voice versions for the big moments"): the most-aired
// new lines of the Ratings, the blocking, the visit and the goodbye video (lines/fresh-moments.js), in eleven voices.
// Each is [entry id, the turn's text as written, { register: what they say }], matched exactly (lines/index.js).
// Warm and flirty keep the line as written. A voice is different words, not the same words shouted or lower-cased:
//   hype   loud, fast, all in      dry     deadpan, understated      blunt   short, no padding
//   goofy  silly, off on a tangent shy     hesitant, small           chill   unbothered, easy
//   calm   composed, measured      catty   polished, a little cruel  diva    grand, about themselves
//   stoic  almost no words         formal  full, correct sentences
export const VOICES = [
  // ── waiting for the Ratings ───────────────────────────────────────────
  ['ratings.wait.f01', "Please be good. Please be good. Please be good.", {
    hype: "Come on, come on! Give me something good!", dry: "Please be good. I'm aware begging the TV is a new low.",
    blunt: "Just be good.", goofy: "Please be good. I'll be so good. I'll eat vegetables. Probably.",
    shy: "Um... please be okay. Please just be okay.", chill: "Be good to me, Circle. That's all I ask.",
    calm: "Whatever it is, I'll handle it. I'd still like it to be good.", catty: "It had better be good. I've been charming all week.",
    diva: "The Circle wouldn't dare disappoint me. Would it?", stoic: "Here it comes.", formal: "I really do hope this goes well." }],
  ['ratings.wait.f02', "I'm going to throw up. Not really. Maybe really.", {
    hype: "My stomach is doing backflips! Actual backflips!", dry: "I'm going to be sick. Fun little side effect of this game.",
    blunt: "I feel sick.", goofy: "My stomach is doing a whole dance routine. It's got choreography.",
    shy: "I feel a little sick. Is that normal? I think that's normal.", chill: "Stomach's a bit off. It'll pass.",
    calm: "My stomach's in knots. Breathe in, breathe out.", catty: "I feel ill, and I refuse to let anybody see it.",
    diva: "My nerves are simply not built for this kind of suspense.", stoic: "Nerves. Fine.", formal: "I'm feeling rather unwell, to be honest." }],
  ['ratings.wait.f03', "Okay, Circle. Rip the band-aid off.", {
    hype: "Just show me! Show me right now!", dry: "Go on, Circle. Ruin my evening.",
    blunt: "Show me. Now.", goofy: "Rip it off, Circle! Fast! Like a sticker on a new phone!",
    shy: "Okay. I'm ready. I'm not ready. Okay, show me.", chill: "Alright, Circle. Let's see it.",
    calm: "Go ahead, Circle. I'm ready.", catty: "Let's get this over with. I have better things to do. I don't, but still.",
    diva: "Reveal it, Circle. I've waited long enough.", stoic: "Show me.", formal: "Please, Circle. Let's see the results." }],
  ['ratings.wait.f04', "Why does it always take this long?", {
    hype: "Why is this taking FOREVER?", dry: "Love how they make us wait. Very healthy.",
    blunt: "Hurry up.", goofy: "I've aged three years waiting for this. I'm a grandparent now.",
    shy: "Is it always this slow? It feels so slow.", chill: "Takes as long as it takes, I guess.",
    calm: "It always feels longer than it is.", catty: "The suspense is so unnecessary. Truly.",
    diva: "They're building the tension for my moment. I understand.", stoic: "Slow.", formal: "I wish this didn't take quite so long." }],
  ['ratings.wait.f05', "Whatever it says, I'm still a good person. Right? Right.", {
    hype: "Whatever it says, I'm still awesome! Right? RIGHT!", dry: "Whatever it says, I'm still a good person. Allegedly.",
    blunt: "Whatever it says, I know who I am.", goofy: "Whatever it says, my plants still love me. That's what matters.",
    shy: "Whatever happens, I tried. I really tried.", chill: "Whatever it says, I'm still me. That's fine.",
    calm: "A number doesn't decide who I am.", catty: "Whatever it says, I'm still better company than half this building.",
    diva: "Whatever it says, history will be kind to me.", stoic: "Doesn't change who I am.", formal: "Whatever the result, I've conducted myself well." }],
  ['ratings.wait.f06', "I can't sit still. I can't stand still. I'm just going to hover.", {
    hype: "I can't stop moving! I'm bouncing off the walls!", dry: "Can't sit, can't stand. Hovering. That's where I'm at.",
    blunt: "I can't sit still.", goofy: "I'm pacing so much I've worn a path in the rug.",
    shy: "I keep standing up and sitting down. Sorry, couch.", chill: "Bit restless. Just gonna walk it off.",
    calm: "I'll stand for this one. It helps.", catty: "I refuse to fidget. I'm fidgeting.",
    diva: "I need to pace. Great performers always pace.", stoic: "Restless.", formal: "I'm finding it very difficult to sit still." }],

  // ── the rankings sent ─────────────────────────────────────────────────
  ['ratings.done.f01', "Sent. I can't take it back now.", {
    hype: "Sent! Locked in! No take-backs!", dry: "Sent. Can't undo it. Love that for everybody.",
    blunt: "Sent. Done.", goofy: "Sent! It's out in the world now, like a balloon I let go of.",
    shy: "I sent it. Oh no. I really sent it.", chill: "Sent. No sweat.",
    calm: "Sent. I stand by it.", catty: "Sent. Some people are going to be very surprised.",
    diva: "Sent. My verdict is final.", stoic: "Sent.", formal: "My rankings are submitted. There's no changing them now." }],
  ['ratings.done.f02', "That's done. I need to lie down.", {
    hype: "Done! Now I need to scream into a pillow!", dry: "Done. I'll be lying face down for the next hour.",
    blunt: "Done. Lying down.", goofy: "Done! I'm going to lie down and become one with the couch.",
    shy: "Okay. That's done. I need a minute. Maybe ten.", chill: "Done. Nap time.",
    calm: "That's done. I'll rest now.", catty: "Done, and I didn't even break a sweat. I'm lying down anyway.",
    diva: "That was exhausting. I need a dramatic lie-down.", stoic: "Done. Resting.", formal: "That's finished. I think I'll rest for a while." }],
  ['ratings.done.f03', "Okay. I said what I said. Now I wait.", {
    hype: "I said it! I meant it! Now we wait!", dry: "I said what I said. Now the fun part. The waiting.",
    blunt: "Said it. Waiting.", goofy: "I said what I said, and some of it was even in order.",
    shy: "I said it. I hope that was okay.", chill: "Said my piece. Now we chill.",
    calm: "I've said my piece. The rest isn't up to me.", catty: "I said what I said, and I'd say it again.",
    diva: "I have spoken. Let the Circle tremble.", stoic: "Waiting.", formal: "I've made my choices. Now we wait for the results." }],
  ['ratings.done.f04', "Done. My heart's going a mile a minute.", {
    hype: "Done! My heart is going crazy right now!", dry: "Done. My heart's racing. Good for it.",
    blunt: "Done. Heart's pounding.", goofy: "Done! My heart is running a marathon without me.",
    shy: "Done... my heart is beating really fast.", chill: "Done. Heart's racing a bit. It's cool.",
    calm: "Done. Let the heartbeat settle.", catty: "Done. My heart's racing. Nobody needs to know that.",
    diva: "Done. My heart beats only for the drama.", stoic: "Done.", formal: "That's done, and my heart is racing." }],
  ['ratings.done.f05', "I hope everybody's as honest with me as I just was with them.", {
    hype: "I was honest! Now everybody be honest back!", dry: "I was honest. I'm sure everybody else was too. Sure.",
    blunt: "I was honest. They'd better be.", goofy: "I was so honest, I'm practically a lie detector.",
    shy: "I tried to be honest. I hope they were too.", chill: "I kept it real. Hope they did too.",
    calm: "I was honest. That's all I can control.", catty: "I was honest. That makes one of us in here.",
    diva: "My honesty is a gift. I hope they appreciate it.", stoic: "I was honest.", formal: "I was entirely honest. I hope that's returned." }],
  ['ratings.done.f06', "Rankings sent. If anybody finds out, I'm in trouble.", {
    hype: "Sent! And nobody can ever see that list! Ever!", dry: "Rankings sent. Nobody can ever find out. Easy.",
    blunt: "Sent. Nobody finds out.", goofy: "Rankings sent. I'm taking that list to my grave. My cozy grave.",
    shy: "Sent. Please nobody ever find out. Please.", chill: "Sent. What happens in the Ratings stays in the Ratings.",
    calm: "Sent. It stays between me and the Circle.", catty: "Sent. A few people would be very upset. Oh well.",
    diva: "Sent. That list is classified, darling.", stoic: "Sent. Private.", formal: "Rankings submitted. I'd rather nobody ever saw them." }],

  // ── the results: high, and low ────────────────────────────────────────
  ['result.top.f01', "So close! Okay. Close is good. Close is safe.", {
    hype: "So close! I'll take it! I'll take it!", dry: "So close. Close is fine. Close is a lifestyle.",
    blunt: "Close. Good enough.", goofy: "So close! Like almost catching the bus. But I'm safe on the sidewalk.",
    shy: "Oh. That's really close. I'm okay with close.", chill: "Close. Safe. Works for me.",
    calm: "Close to the top. That's a good place to be.", catty: "Close. They clearly couldn't quite admit how much they like me.",
    diva: "So close. Next time, the crown is mine.", stoic: "Close. Safe.", formal: "That's very close. I'm quite pleased with that." }],
  ['result.top.f02', "Up there! Not quite at the top, but up there!", {
    hype: "Up there! Look at me go!", dry: "Up there. Not the top. Still, nice to be liked, apparently.",
    blunt: "High. Good.", goofy: "Up there! I'm basically on the top shelf with the good cereal.",
    shy: "Up there? Me? Really?", chill: "Up there. Nice.",
    calm: "Up near the top. I'm grateful for that.", catty: "Up there, where I belong.",
    diva: "Up there. As expected. Almost as expected.", stoic: "High.", formal: "Near the top. That's a very good result." }],
  ['result.top.f03', "Near the top and not an Influencer. Honestly? Perfect.", {
    hype: "Near the top and no target on my back! Perfect!", dry: "Near the top, no power, no blame. Ideal.",
    blunt: "High, and no target. Perfect.", goofy: "Near the top, no responsibilities. That's my favorite kind of anything.",
    shy: "Near the top, and I don't have to decide anything. That's a relief.", chill: "Up high, no pressure. Best spot there is.",
    calm: "High enough to be safe, with nothing to decide. That's ideal.", catty: "Liked, but not responsible for anything. Exactly how I like it.",
    diva: "Adored, without the burden of the crown. Tonight, that suits me.", stoic: "Safe. No target.", formal: "A high placing without the pressure of being an Influencer. That's ideal." }],
  ['result.top.f04', "People like me. Not enough to make me an Influencer. But they like me.", {
    hype: "People LIKE me! They actually like me!", dry: "People like me. Just not that much. Noted.",
    blunt: "They like me. Good.", goofy: "People like me! Not love. Like. I'll grow on them, like a mushroom.",
    shy: "People actually like me? That's... really nice.", chill: "People dig me. Cool.",
    calm: "People like me. That means a lot.", catty: "They like me. Some of them just won't say it out loud.",
    diva: "They adore me. They're simply shy about it.", stoic: "They like me.", formal: "It's nice to know people think well of me." }],
  ['result.top.f05', "High up, no target. I'll take that every single time.", {
    hype: "High up and safe! Every time! Every single time!", dry: "High, and nobody's aiming at me. Rare. Enjoying it.",
    blunt: "High. No target. I'll take it.", goofy: "High up, no target. I'm a kite. A very safe kite.",
    shy: "High up, and nobody's coming after me. I think.", chill: "High up, flying under the radar. Love it.",
    calm: "High up and out of the line of fire. I'll take that gladly.", catty: "High up, untouchable. As it should be.",
    diva: "High above it all. Where I belong.", stoic: "High. Safe.", formal: "A high placing and no target. That suits me very well." }],
  ['result.top.f06', "Okay, that's a good night. That's a really good night.", {
    hype: "That's a GREAT night! Best night yet!", dry: "That's a good night. I almost don't know what to do with it.",
    blunt: "Good night.", goofy: "That's such a good night I'm making a celebratory sandwich.",
    shy: "That's a good night. A really good one. Wow.", chill: "Good night. Real good night.",
    calm: "That's a good night. I'll enjoy it.", catty: "A good night. Some people won't be saying that.",
    diva: "A triumphant night. As I deserve.", stoic: "Good night.", formal: "That's a very good night indeed." }],
  ['result.bottom.f01', "The bottom? Me? After all those chats?", {
    hype: "The BOTTOM? Me? After everything?", dry: "The bottom. All those chats, and this is what I get.",
    blunt: "The bottom? After all that?", goofy: "The bottom? I sent so many messages. I sent emojis!",
    shy: "Me? At the bottom? I thought people liked me...", chill: "The bottom? Huh. Didn't see that one.",
    calm: "The bottom. I thought those chats meant more than that.", catty: "The bottom. So the chats were just people being polite. Charming.",
    diva: "The bottom? Me? There's been a terrible mistake.", stoic: "The bottom.", formal: "The bottom? I really didn't expect that after all those conversations." }],
  ['result.bottom.f03', "Down there. Okay. I didn't see that coming at all.", {
    hype: "Down THERE? Where did that come from?", dry: "Down there. Didn't see it coming. Should have.",
    blunt: "Didn't see that coming.", goofy: "Down there. Did not see that coming. I need glasses for this game.",
    shy: "Oh. Down there. I really didn't expect that.", chill: "Down low. Didn't see that coming.",
    calm: "Down there. That's a surprise. Let me think about it.", catty: "Down there. Somebody's been very busy behind my back.",
    diva: "Down there? The audacity of these people.", stoic: "Unexpected.", formal: "I'm near the bottom. That was not what I expected at all." }],
  ['result.bottom.f04', "The bottom. Somebody in here is lying to me. Maybe a lot of somebodies.", {
    hype: "Somebody is LYING to me! And I'm going to find out who!", dry: "The bottom. Lovely to know so many people lie well.",
    blunt: "Somebody's lying to me.", goofy: "The bottom. Somebody's been fibbing. Maybe everybody. A fib party.",
    shy: "Somebody's not being honest with me. I don't know who.", chill: "Somebody's been fronting. That's cool. I'll figure it out.",
    calm: "Somebody hasn't been honest with me. I'll find out who.", catty: "So the sweet messages were lies. How original.",
    diva: "Betrayal. Every great story needs some.", stoic: "Someone lied.", formal: "Clearly somebody here hasn't been truthful with me." }],
  ['result.bottom.f06', "Wow. Okay. So that's what people think of me.", {
    hype: "Wow! That's what they think of me? Seriously?", dry: "So that's what people think of me. Good to have it in writing.",
    blunt: "So that's what they think.", goofy: "So that's what people think of me. Rude. Accurate? No. Rude.",
    shy: "So that's what they think of me. Okay. That hurts.", chill: "So that's how they see me. Alright.",
    calm: "So that's how people see me. It's worth knowing.", catty: "So that's what they think. Their taste is the problem.",
    diva: "So that's what they think. They'll regret it.", stoic: "Noted.", formal: "So this is how people see me. That's difficult to hear." }],
  ['result.bottom.f07', "The bottom. Great. Love that for me.", {
    hype: "The bottom?! No! Not tonight!", dry: "The bottom. Great. Really thriving.",
    blunt: "The bottom. Great.", goofy: "The bottom. My favorite part of the sandwich. Not really.",
    shy: "The bottom. I knew it. I kind of knew it.", chill: "The bottom. Eh. It happens.",
    calm: "The bottom. Alright. I'll work with it.", catty: "The bottom. How tasteless of everybody.",
    diva: "The bottom. A tragedy in one act.", stoic: "The bottom.", formal: "The bottom. That's very disappointing." }],
  ['result.bottom.f08', "No. Not down there. Please not down there.", {
    hype: "No! No, no, no! Not down there!", dry: "No. Not there. Anywhere but there.",
    blunt: "Not down there.", goofy: "No! Not down there! It's dark and scary down there!",
    shy: "No... please not down there.", chill: "Aw, not down there.",
    calm: "Not down there. Okay. Breathe.", catty: "Down there? With them? Absolutely not.",
    diva: "Not down there! I'm built for the top!", stoic: "No.", formal: "Please, not down there." }],

  // ── the blocking ──────────────────────────────────────────────────────
  ['block.typing.f01', "Okay. I have to type a name now. I hate this part.", {
    hype: "Okay! Time to type the name! I hate this! I hate it!", dry: "Time to type a name. My favorite part. Not.",
    blunt: "Typing the name. Hate this.", goofy: "I have to type a name. My fingers are on strike.",
    shy: "I have to type it now. I really don't want to.", chill: "Gotta type the name. Rough part of the gig.",
    calm: "It's time to type the name. Let's do it with care.", catty: "Time to type a name. Somebody's evening is about to be ruined.",
    diva: "And now, the moment. The weight of it all falls on me.", stoic: "Typing the name.", formal: "I have to type the name now. I'm dreading it." }],
  ['block.typing.f02', "Every word I type, somebody is reading with their heart in their throat.", {
    hype: "Everybody's freaking out right now! Every word counts!", dry: "Every word, somebody is reading and panicking. No pressure.",
    blunt: "Everybody's reading every word.", goofy: "Every word, somebody's heart is doing jumping jacks.",
    shy: "Everybody is so scared right now. I can feel it.", chill: "Everybody's sweating every word. I get it.",
    calm: "Every word matters right now. Somebody's hanging on each one.", catty: "Every word I type, somebody's falling apart. It's a lot of power.",
    diva: "Every word I type, the whole Circle holds its breath.", stoic: "Every word counts.", formal: "Everyone is reading every word very closely." }],
  ['block.typing.f03', "Be kind. Be quick. Be kind.", {
    hype: "Be nice! Be fast! Be nice!", dry: "Be kind. Be quick. Try not to be a monster.",
    blunt: "Kind and quick.", goofy: "Be kind. Be quick. Be a nice little message.",
    shy: "Just be kind. Please be kind.", chill: "Keep it kind. Keep it quick.",
    calm: "Kind first. Then quick.", catty: "Be kind. They'll still hate us.",
    diva: "Gracious, swift, unforgettable. That's how it's done.", stoic: "Kind. Quick.", formal: "Be kind, and keep it brief." }],
  ['block.typing.f04', "This is the hardest message I'll send in here.", {
    hype: "This is the hardest message EVER!", dry: "Hardest message I'll send in here. And I've sent some.",
    blunt: "Hardest message yet.", goofy: "This is harder than texting my ex. And that was hard.",
    shy: "This is so hard. The hardest thing yet.", chill: "Toughest message I'll send. No doubt.",
    calm: "This is the hardest message I'll send. I'll take my time.", catty: "The hardest message. For them, mostly.",
    diva: "The most difficult message of my career.", stoic: "Hardest one.", formal: "This is undoubtedly the hardest message I'll send here." }],
  ['block.typing.f05', "I'm going to make them wait. Not because I want to. Because I'm scared.", {
    hype: "I'm stalling! I'm scared! I'm totally stalling!", dry: "I'm making them wait. Not drama. Cowardice. Honest cowardice.",
    blunt: "I'm stalling. I'm scared.", goofy: "I'm going to make them wait. I'm scared, and also I forgot how to spell.",
    shy: "I'm making them wait. I'm just so scared to say it.", chill: "Taking my time. Not gonna lie, I'm nervous.",
    calm: "I'll take a moment. Nobody needs to rush this.", catty: "I'll let them wait a little. Suspense is good for people.",
    diva: "Every great reveal needs a pause.", stoic: "Wait.", formal: "I'm delaying a little. Honestly, it's nerves." }],
  ['block.typing.f06', "Okay, Circle. Let's do this. I'm sorry, everybody.", {
    hype: "Okay, Circle! Here we go! Sorry, everybody!", dry: "Okay, Circle. Let's ruin somebody's night. Sorry, everybody.",
    blunt: "Let's do it. Sorry.", goofy: "Okay, Circle. Here goes. Sorry, everybody. Sorry, lamp.",
    shy: "Okay. Here goes. I'm so sorry, everybody.", chill: "Alright, Circle. Let's do it. Sorry, folks.",
    calm: "Alright, Circle. I'm ready. I'm sorry, everybody.", catty: "Let's do this. Try not to take it personally, everybody.",
    diva: "Circle, let the moment begin. Forgive me, everybody.", stoic: "Go. Sorry.", formal: "Alright, Circle. Let's proceed. My apologies, everybody." }],
  ['block.fear.dots.f01', "The dots. Why is it always the dots?", {
    hype: "The DOTS! I can't handle the dots!", dry: "The dots. The Circle's favorite form of torture.",
    blunt: "I hate the dots.", goofy: "The dots! Three little dots and my whole life flashes before my eyes.",
    shy: "Oh no. The dots. I can't look at the dots.", chill: "The dots, man. Every time.",
    calm: "The dots. Just breathe.", catty: "The dots. So dramatic. I love it and I hate it.",
    diva: "Those dots are holding my entire fate.", stoic: "The dots.", formal: "The waiting is unbearable." }],
  ['block.fear.dots.f02', "Type faster! Type faster!", {
    hype: "TYPE! FASTER! Please!", dry: "Faster would be nice. Just a thought.",
    blunt: "Type faster.", goofy: "Type faster! Use both hands! Use your elbows!",
    shy: "Please type faster. Please.", chill: "Come on, speed it up a little.",
    calm: "Come on. Just say it.", catty: "Type faster. Some of us have nerves.",
    diva: "Hurry! My heart cannot take it!", stoic: "Faster.", formal: "Please, just finish the message." }],
  ['block.fear.dots.f03', "I can't look. Tell me when it's done.", {
    hype: "I can't look! I CAN'T look! Tell me!", dry: "I'm not looking. Somebody narrate it for me.",
    blunt: "Not looking. Tell me after.", goofy: "I can't look. I'm hiding behind this pillow. It's a good pillow.",
    shy: "I can't watch. I really can't.", chill: "I'll just look away for this part.",
    calm: "I'll close my eyes for this part.", catty: "I'm not looking. I refuse to give it the satisfaction.",
    diva: "I cannot bear to watch my own fate.", stoic: "Not watching.", formal: "I can't bring myself to watch this." }],
  ['block.fear.dots.f04', "Somebody is typing my name. Or not my name. Please not my name.", {
    hype: "Don't type my name! Don't you dare!", dry: "Somebody's typing a name. Odds aren't great for anybody.",
    blunt: "Not my name.", goofy: "Somebody's typing my name. Or a different name. A worse name. Please a worse name.",
    shy: "Please don't be my name. Please.", chill: "Please be somebody else's name.",
    calm: "Whatever name it is, I'll be alright.", catty: "If it's my name, they've made a very big mistake.",
    diva: "Surely not my name. Surely.", stoic: "Not me.", formal: "I very much hope it isn't my name." }],
  ['block.fear.dots.f05', "Those three dots are going to give me a heart attack.", {
    hype: "Those dots are killing me! Literally killing me!", dry: "Three dots. Three. And my heart's quitting.",
    blunt: "These dots are killing me.", goofy: "Three dots. Three tiny dots. Taking years off my life.",
    shy: "Those dots are making my heart race so much.", chill: "Those dots are stressing me out a little.",
    calm: "My heart's racing. It's just dots. Breathe.", catty: "Three dots. The most stressful punctuation ever invented.",
    diva: "Those dots are a crime against my nerves.", stoic: "Dots.", formal: "The waiting is almost too much to bear." }],
  ['block.fear.dots.f06', "They're making us wait on purpose. They have to be.", {
    hype: "They're doing this on purpose! I know it!", dry: "They're making us wait on purpose. Very kind of them.",
    blunt: "They're stalling on purpose.", goofy: "They're doing it on purpose. They're probably eating a snack.",
    shy: "Are they doing this on purpose? It feels like it.", chill: "Bet they're taking their sweet time on purpose.",
    calm: "They're taking their time. I understand why.", catty: "They're enjoying this. I would be too.",
    diva: "They're building suspense. I respect the craft.", stoic: "On purpose.", formal: "I suspect they're making us wait deliberately." }],
  ['block.react.relief.f01', "Not me! Oh, I'm so sorry, {b}. But not me!", {
    hype: "NOT ME! Oh, I'm so sorry, {b}! But not me!", dry: "Not me. Sorry, {b}. Really. But not me.",
    blunt: "Not me. Sorry, {b}.", goofy: "Not me! Sorry, {b}! I'll eat a cookie in your honor!",
    shy: "It's not me. I'm so sorry, {b}. I really am.", chill: "Not me. Sorry, {b}. That's rough.",
    calm: "It isn't me. I'm sorry, {b}.", catty: "Not me, obviously. Sorry, {b}.",
    diva: "I survive! Farewell, {b}.", stoic: "Not me. Sorry, {b}.", formal: "It isn't me. I'm very sorry, {b}." }],
  ['block.react.relief.f02', "I can breathe again. Poor {b}, though.", {
    hype: "I can breathe! I can BREATHE! Poor {b}, though!", dry: "Breathing again. Poor {b}. Truly.",
    blunt: "I can breathe. Poor {b}.", goofy: "I can breathe again! My lungs say thank you! Poor {b}, though.",
    shy: "I can breathe again. But poor {b}.", chill: "Okay, breathing again. Poor {b}, man.",
    calm: "I can breathe again. I feel for {b}.", catty: "I can breathe. {b} saw it coming, surely.",
    diva: "I breathe once more. Poor, poor {b}.", stoic: "Breathing. Poor {b}.", formal: "I can breathe again. I do feel for {b}." }],
  ['block.react.relief.f03', "Safe. I'm safe. {b}, you didn't deserve that.", {
    hype: "Safe! I'm SAFE! {b}, you didn't deserve that!", dry: "Safe. {b} didn't deserve that. Few people do.",
    blunt: "I'm safe. {b} didn't deserve it.", goofy: "Safe! Safe as a sandwich in a lunchbox. {b} deserved better.",
    shy: "I'm safe. {b} didn't deserve that, though.", chill: "Safe. {b} deserved better, though.",
    calm: "I'm safe. {b} deserved better than that.", catty: "Safe. And {b} deserved better. Mostly.",
    diva: "I endure. {b}, you deserved a grander exit.", stoic: "Safe. {b} deserved better.", formal: "I'm safe. {b} certainly didn't deserve that." }],
  ['block.react.relief.f04', "Oh, {b}. That's rough. I'm so glad it wasn't me, and I hate that I'm glad.", {
    hype: "Oh, {b}! That's so rough! I'm glad it wasn't me and I hate it!", dry: "Oh, {b}. Rough. I'm glad it wasn't me. I'm not proud of that.",
    blunt: "Rough, {b}. Glad it wasn't me.", goofy: "Oh, {b}. That's rough. I'm glad it's not me, and I feel like a bad person about it.",
    shy: "Oh, {b}. I'm glad it wasn't me, and I feel so bad that I'm glad.", chill: "Oh, {b}. That's rough. Glad it wasn't me, though.",
    calm: "Oh, {b}. I'm relieved for me and sad for you.", catty: "Poor {b}. Better {b} than me. I said what I said.",
    diva: "Oh, {b}. A tragic exit. Thank heavens it wasn't mine.", stoic: "Rough, {b}.", formal: "Oh, {b}. I'm relieved it wasn't me, and I feel guilty about that." }],
  ['block.react.relief.f05', "I'm still here! I'm still here! Bye, {b}.", {
    hype: "I'm still HERE! Still in the game! Bye, {b}!", dry: "Still here. Apparently. Bye, {b}.",
    blunt: "Still here. Bye, {b}.", goofy: "Still here! I'm like a stubborn houseplant! Bye, {b}!",
    shy: "I'm still here. Bye, {b}.", chill: "Still here. Later, {b}.",
    calm: "I'm still here. Goodbye, {b}.", catty: "Still here, of course. Bye, {b}.",
    diva: "I remain! Goodbye, {b}.", stoic: "Still here. Bye, {b}.", formal: "I'm still in the game. Goodbye, {b}." }],
  ['block.react.relief.f06', "{b}. Wow. I really thought it was going to be me.", {
    hype: "{b}?! Wow! I was SO sure it was me!", dry: "{b}. Huh. I had my bags packed in my head.",
    blunt: "{b}. I thought it was me.", goofy: "{b}? I was sure it was me. I already said goodbye to my pillow.",
    shy: "{b}... I really thought it would be me.", chill: "{b}, huh? Thought it was gonna be me.",
    calm: "{b}. I was certain it would be me.", catty: "{b}. I thought they'd have the nerve to pick me.",
    diva: "{b}? I'd already prepared my farewell speech.", stoic: "{b}. Thought it was me.", formal: "{b}. I honestly thought it would be me." }],

  // ── the visit ─────────────────────────────────────────────────────────
  ['visit.wait.catfish.f01', "If {b} walks in here, my cover is gone. Just gone.", {
    hype: "If {b} walks in, it's OVER! Totally over!", dry: "If {b} walks in, my whole act is over. Fun.",
    blunt: "{b} walks in, I'm done.", goofy: "If {b} walks in, my cover's blown. Like a dandelion. Poof.",
    shy: "If {b} walks in... everybody will know. Oh no.", chill: "If {b} walks in, the gig's up.",
    calm: "If {b} comes in here, the truth comes out. I have to be ready for that.", catty: "If {b} walks in, I'll have to be very charming very fast.",
    diva: "If {b} walks in, my masterpiece is ruined.", stoic: "If {b} comes, it's over.", formal: "If {b} comes in here, my identity will be revealed." }],
  ['visit.wait.catfish.f02', "I have nowhere to hide in this apartment. I checked.", {
    hype: "There's nowhere to hide! I looked everywhere!", dry: "No hiding spots. I checked. Twice.",
    blunt: "Nowhere to hide.", goofy: "No hiding spots. I tried the fridge. Too cold.",
    shy: "There's nowhere to hide in here. I looked.", chill: "Nowhere to hide. Gonna have to face it.",
    calm: "There's nowhere to hide. So I won't.", catty: "No hiding spots. Not that I'd hide. Fine, I looked.",
    diva: "There's nowhere to hide, and a star never hides anyway.", stoic: "Nowhere to hide.", formal: "There's simply nowhere to hide in this apartment." }],
  ['visit.wait.catfish.f03', "Not me, {b}. Please, not me. I'm not who you think.", {
    hype: "Not me, {b}! Please not me! I'm not who you think!", dry: "Not me, {b}. You'd be very confused.",
    blunt: "Not me, {b}. I'm not who you think.", goofy: "Not me, {b}! I'm a very different person in real life. Shorter, probably.",
    shy: "Please not me, {b}. I'm not who you think I am.", chill: "Not me, {b}. You'd be surprised.",
    calm: "Please, not me, {b}. You'd find someone you don't know.", catty: "Not me, {b}. You couldn't handle the truth.",
    diva: "Not me, {b}! The reveal isn't ready!", stoic: "Not me, {b}.", formal: "Please don't choose me, {b}. I'm not who you believe I am." }],
  ['visit.wait.catfish.f04', "If that door opens, I have about two seconds to explain everything.", {
    hype: "If that door opens, I've got two seconds! Two!", dry: "Door opens, I get two seconds to explain a whole fake life.",
    blunt: "Door opens, I explain fast.", goofy: "If that door opens, I need a two-second speech. I have a two-word speech.",
    shy: "If the door opens, I won't even know what to say.", chill: "If that door opens, I'll just have to talk fast.",
    calm: "If that door opens, I'll explain everything honestly.", catty: "If that door opens, I'll need my most convincing smile.",
    diva: "If that door opens, I'll give the performance of my life.", stoic: "Door opens, I explain.", formal: "If the door opens, I'll have very little time to explain." }],
  ['visit.wait.catfish.f05', "I've practiced what I'd say if {b} found me. It doesn't sound good.", {
    hype: "I practiced what I'd say to {b}! It's terrible!", dry: "I've rehearsed my apology to {b}. It needs work.",
    blunt: "I practiced for {b}. It's bad.", goofy: "I practiced my speech for {b}. It's mostly just 'surprise!'",
    shy: "I practiced what to say to {b}. I still don't know.", chill: "Practiced what I'd tell {b}. Still sounds rough.",
    calm: "I know what I'd say to {b}. I just hope it's enough.", catty: "I practiced for {b}. It's very persuasive. Mostly.",
    diva: "My speech for {b} is ready. It's moving. It's devastating.", stoic: "Practiced. Not good.", formal: "I've prepared what I'd say to {b}. It doesn't sound convincing." }],
  ['visit.wait.catfish.f06', "{b} is going to knock and see a total stranger.", {
    hype: "{b} is going to see a total stranger! That's insane!", dry: "{b} knocks, finds a stranger. That'll be a fun chat.",
    blunt: "{b} will see a stranger.", goofy: "{b} is going to knock and see a total stranger. Hi, I'm the stranger.",
    shy: "{b} won't even know who I am.", chill: "{b} is gonna knock and see somebody new. Wild.",
    calm: "{b} would be meeting someone they've never seen. I'd owe them the truth.", catty: "{b} would see a stranger. A better-looking one, honestly.",
    diva: "{b} would meet the real star of this story.", stoic: "{b} sees a stranger.", formal: "{b} would find a complete stranger behind this door." }],

  // ── the goodbye video ─────────────────────────────────────────────────
  ['goodbye.guess.f01', "Okay, {b}. Be nice. Please be nice.", {
    hype: "Come on, {b}! Be nice! Please be nice!", dry: "Okay, {b}. Be nice. Wishful thinking.",
    blunt: "Be nice, {b}.", goofy: "Be nice, {b}. I've always been nice to you. I sent you a heart once.",
    shy: "Please be nice, {b}. Please.", chill: "Be cool, {b}. Keep it nice.",
    calm: "Be kind, {b}. I hope you will be.", catty: "Be nice, {b}. Or at least be interesting.",
    diva: "Be gracious, {b}. Follow my example.", stoic: "Be nice, {b}.", formal: "I really hope you'll be kind, {b}." }],
  ['goodbye.guess.f02', "I'm scared of what {b} is going to say.", {
    hype: "I'm terrified of what {b} is about to say!", dry: "Can't wait to hear what {b} really thought. Can wait, actually.",
    blunt: "I'm worried about what {b} says.", goofy: "I'm scared of what {b} will say. I'm hiding behind a cushion fort.",
    shy: "I'm really nervous about what {b} will say.", chill: "Bit nervous about what {b}'s gonna say.",
    calm: "Whatever {b} says, I'll listen.", catty: "I'm curious what {b} will say. Nervous? Never.",
    diva: "What will {b} say about me? This is my moment too.", stoic: "Nervous.", formal: "I'm rather anxious about what {b} is going to say." }],
  ['goodbye.guess.f03', "Here we go. {b} gets the last word.", {
    hype: "Here it is! {b}'s last word!", dry: "Here we go. {b} gets the last word. Hope it's a good one.",
    blunt: "{b}'s last word.", goofy: "Here we go. {b}'s last word. I hope it's a fun word.",
    shy: "Here it is. {b}'s last word.", chill: "Here we go. {b}'s turn.",
    calm: "Here it is. {b} gets to speak freely now.", catty: "Here comes {b}'s last word. Let's see if it's worth it.",
    diva: "{b} takes the stage one final time.", stoic: "{b}'s turn.", formal: "Here we go. {b} has the last word." }],
  ['goodbye.guess.f04', "If {b} says my name, I'm hiding under the blanket.", {
    hype: "If {b} says my name, I'm diving under the blanket!", dry: "If {b} says my name, I'm moving into the blanket. Permanently.",
    blunt: "{b} says my name, I hide.", goofy: "If {b} says my name, I'm becoming a blanket burrito.",
    shy: "If {b} says my name, I'm hiding. Forever.", chill: "If {b} calls me out, I'm going under the blanket.",
    calm: "If {b} says my name, I'll take it on the chin.", catty: "If {b} says my name, I'll pretend I didn't hear it.",
    diva: "If {b} says my name, it will be the most quoted line of the night.", stoic: "If {b} names me, fine.", formal: "If {b} mentions me, I may need to hide." }],
  ['goodbye.guess.f05', "I hope {b} goes out with some grace.", {
    hype: "Go out strong, {b}! Go out classy!", dry: "Hoping {b} goes out with grace. Hoping.",
    blunt: "Grace, {b}. Please.", goofy: "I hope {b} goes out with grace. Like a swan. Not a goose.",
    shy: "I hope {b} leaves on a nice note.", chill: "Hope {b} goes out cool.",
    calm: "I hope {b} leaves with dignity.", catty: "I hope {b} manages some grace. Fingers crossed.",
    diva: "One must always exit with grace. I hope {b} knows that.", stoic: "Grace, {b}.", formal: "I hope {b} leaves gracefully." }],
  ['goodbye.guess.f06', "{b} knows things. This could be bad.", {
    hype: "{b} knows stuff! This could be really bad!", dry: "{b} knows things. Excellent. Can't wait.",
    blunt: "{b} knows things. Bad.", goofy: "{b} knows things. Things I said. Things I typed at two in the morning.",
    shy: "{b} knows a lot. I'm worried.", chill: "{b} knows some stuff. Could get spicy.",
    calm: "{b} knows a lot. Let's see what {b} chooses to share.", catty: "{b} knows things. How delicious. As long as it's not about me.",
    diva: "{b} knows secrets. This could be the scandal of the season.", stoic: "{b} knows things.", formal: "{b} knows quite a lot. This could be difficult." }],
  ['goodbye.react.surprised.f01', "Wow. That was not the video I was expecting.", {
    hype: "Whoa! That was NOT what I expected!", dry: "Well. That was not the video I had planned for.",
    blunt: "Didn't expect that.", goofy: "That was not the video I expected. I expected cats.",
    shy: "Oh. That wasn't what I thought it would be.", chill: "Huh. Didn't see that video coming.",
    calm: "That wasn't what I expected. I'll think about it.", catty: "Well. That was a choice.",
    diva: "What a twist. I almost wish I'd written it.", stoic: "Unexpected.", formal: "That wasn't the video I expected at all." }],
  ['goodbye.react.surprised.f02', "{b} was so much more emotional than I thought.", {
    hype: "{b} got so emotional! I wasn't ready!", dry: "{b} had feelings. Who knew.",
    blunt: "{b} was emotional.", goofy: "{b} was so emotional. Now I'm emotional. Pass the tissues.",
    shy: "{b} was really emotional. It made me sad.", chill: "{b} got real emotional. That's cool.",
    calm: "{b} let us see how much it meant. That took courage.", catty: "{b} was very emotional. Quite the performance.",
    diva: "{b} poured their heart out. A beautiful scene.", stoic: "{b} felt it.", formal: "{b} was far more emotional than I expected." }],
  ['goodbye.react.surprised.f03', "That was classy. {b} really went out with class.", {
    hype: "That was SO classy! {b} nailed it!", dry: "Classy. {b} went out with class. Rare in here.",
    blunt: "Classy exit, {b}.", goofy: "That was classy. {b} left like a butler in a movie.",
    shy: "That was really classy of {b}.", chill: "Classy move, {b}. Respect.",
    calm: "That was gracious. {b} left the right way.", catty: "Classy. I didn't think {b} had it in them. Good for {b}.",
    diva: "A classy exit. {b} learned from the best.", stoic: "Classy.", formal: "That was very classy of {b}." }],
  ['goodbye.react.surprised.f04', "Okay, I was not ready for that.", {
    hype: "I was NOT ready for that!", dry: "Not ready for that. Nobody warned me.",
    blunt: "Wasn't ready.", goofy: "I was not ready. I was in the middle of a snack.",
    shy: "I wasn't ready for that at all.", chill: "Whoa. Wasn't ready for that.",
    calm: "I wasn't ready for that. Give me a moment.", catty: "Well, I wasn't ready for that. Rude.",
    diva: "Nobody prepared me for that. I need a moment.", stoic: "Wasn't ready.", formal: "I wasn't prepared for that." }],
  ['goodbye.react.surprised.f05', "{b} just made me cry and I barely knew {b}.", {
    hype: "I'm crying! Over {b}! I barely knew {b}!", dry: "Crying over {b}. I barely knew {b}. Embarrassing.",
    blunt: "I'm crying over {b}.", goofy: "{b} made me cry. I barely knew {b}. My face is a waterfall.",
    shy: "{b} made me cry... and I barely even knew {b}.", chill: "{b} got me. Didn't even know {b} that well.",
    calm: "{b} moved me. I wish I'd known {b} better.", catty: "{b} made me cry. Don't tell anybody.",
    diva: "{b} brought me to tears. I'm an artist. We feel things.", stoic: "{b} got to me.", formal: "{b} moved me to tears, and I barely knew {b}." }],
  ['goodbye.react.surprised.f06', "Oh, that was so sweet. Why did that have to be so sweet?", {
    hype: "That was SO sweet! Why was it so sweet?", dry: "That was sweet. I hate how sweet that was.",
    blunt: "That was sweet.", goofy: "That was so sweet I need to brush my teeth.",
    shy: "That was so sweet. It made me feel things.", chill: "That was sweet. Real sweet.",
    calm: "That was a sweet goodbye. I'm glad it ended that way.", catty: "Sweet. A little too sweet, honestly.",
    diva: "Sweet. Touching. Almost as touching as mine will be.", stoic: "Sweet.", formal: "That was a very sweet message." }],
  ['goodbye.after.f01', "It's going to be so quiet without {b}.", {
    hype: "It's gonna be SO quiet without {b}!", dry: "Quieter without {b}. Not sure I like quiet.",
    blunt: "Quiet without {b}.", goofy: "So quiet without {b}. I'll have to talk to my toaster more.",
    shy: "It's going to be so quiet without {b}.", chill: "Gonna be quiet without {b}.",
    calm: "It'll be quieter without {b}. I'll miss that voice.", catty: "Quieter without {b}. Some people will be relieved.",
    diva: "The Circle loses some of its sparkle without {b}.", stoic: "Quiet now.", formal: "It will be much quieter without {b}." }],
  ['goodbye.after.f02', "I'll see {b} on the outside. I'll make sure of it.", {
    hype: "I'm finding {b} on the outside! Count on it!", dry: "I'll find {b} on the outside. That's a threat. A friendly one.",
    blunt: "I'll see {b} outside.", goofy: "I'll see {b} on the outside. We'll get tacos. A lot of tacos.",
    shy: "I hope I see {b} on the outside.", chill: "Gonna link up with {b} on the outside.",
    calm: "I'll see {b} when this is over. I'll make sure of it.", catty: "I'll see {b} on the outside. Maybe.",
    diva: "{b} will be at my after-party. Front row.", stoic: "I'll find {b}.", formal: "I'll make a point of seeing {b} afterwards." }],
  ['goodbye.after.f03', "That video is going to stay with me.", {
    hype: "That video! I'm never forgetting that video!", dry: "That video's going to haunt me for a bit.",
    blunt: "That one stays with me.", goofy: "That video is stuck in my head like a song.",
    shy: "I don't think I'll forget that video.", chill: "That video's gonna stick with me.",
    calm: "That video will stay with me for a while.", catty: "That video will stay with me. Annoyingly.",
    diva: "That video will live in my memory forever.", stoic: "I'll remember that.", formal: "I won't forget that video." }],
  ['goodbye.after.f04', "Okay. {b} is gone. Everything shifts now.", {
    hype: "{b} is gone! Everything just changed!", dry: "{b}'s gone. Everything shifts. Exciting.",
    blunt: "{b}'s gone. Everything changes.", goofy: "{b} is gone, and the whole game just tilted like a wobbly table.",
    shy: "{b} is gone. Everything feels different.", chill: "{b}'s gone. Gotta roll with it.",
    calm: "{b} is gone. Let's see where things settle.", catty: "{b} is gone. Now it gets interesting.",
    diva: "{b} has left the stage. A new act begins.", stoic: "{b}'s gone. Adjust.", formal: "{b} has left. Everything will change now." }],
  ['goodbye.after.f05', "I didn't think I'd get this emotional over somebody I've never met.", {
    hype: "I'm so emotional, and I've never even met them!", dry: "Emotional over somebody I've never met. That's the Circle for you.",
    blunt: "Never met them. Still emotional.", goofy: "I've never met them, and I'm crying into a bowl of cereal.",
    shy: "I've never even met them. Why am I this sad?", chill: "Never even met them. Still hits.",
    calm: "I've never met them, but it still matters.", catty: "Emotional over a stranger. This place has broken me.",
    diva: "Such emotion over a stranger. My heart is simply too big.", stoic: "Never met them. Still hurts.", formal: "I'm surprised how emotional I am about someone I've never met." }],
  ['goodbye.after.f06', "I'm going to play the rest of this for {b}.", {
    hype: "I'm playing the rest of this for {b}! Let's go!", dry: "I'm playing for {b} now. No pressure on me at all.",
    blunt: "I play for {b} now.", goofy: "I'm playing for {b} now. I'll even wear {b}'s favorite socks. If I knew them.",
    shy: "I'm going to try my best. For {b}.", chill: "Playing the rest for {b}.",
    calm: "I'll play the rest of this for {b}.", catty: "I'll win this for {b}. And for me, mostly.",
    diva: "Every move I make from now on is dedicated to {b}.", stoic: "For {b}.", formal: "I'll play the rest of this game for {b}." }],
];
