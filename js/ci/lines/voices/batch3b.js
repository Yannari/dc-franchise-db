// Voice versions, batch 3b: the games said aloud, part two (guess who wrote it; the team trivia). Same rules as
// batch1.js. No brand names anywhere.
export const VOICES = [
  // ── guess who wrote it: the prompt and the answer sent ────────────────
  ['game.guess.submit.01', "'{q}' Okay. Mine is: '{x}' Nobody's guessing that.", {
    hype: "'{q}' OKAY! Mine is: '{x}' NOBODY'S guessing that!", dry: "'{q}' Mine is: '{x}' Nobody's guessing that. Nobody would want to.", blunt: "'{q}' Mine: '{x}' Nobody'll guess it.",
    goofy: "'{q}' Okay! Mine is: '{x}' Nobody's guessing that! I'm a mystery! A mystery in socks!", shy: "'{q}' Okay. Mine is: '{x}' I don't think anyone will guess that.", chill: "'{q}' Mine is: '{x}' Nobody's guessing that.",
    catty: "'{q}' Mine is: '{x}' Nobody's guessing that. They don't know me.", diva: "'{q}' Mine, darling: '{x}' Nobody will guess.", stoic: "'{q}' '{x}' Nobody'll guess." }],
  ['game.guess.submit.02', "'{q}' Do I tell the truth? I tell the truth. '{x}'", {
    hype: "'{q}' Do I tell the TRUTH? I tell the TRUTH! '{x}'", dry: "'{q}' Do I tell the truth. Fine. The truth. '{x}'", blunt: "'{q}' The truth. '{x}'",
    goofy: "'{q}' Do I tell the truth? I tell the truth! Truth time! '{x}'", shy: "'{q}' Do I tell the truth? Okay. I'll tell the truth. '{x}'", chill: "'{q}' Truth? Yeah, truth. '{x}'",
    catty: "'{q}' Do I tell the truth? Sure. Why not. '{x}'", diva: "'{q}' The truth, darling. Always. '{x}'", stoic: "'{q}' Truth. '{x}'" }],
  ['game.guess.submit.03', "'{x}' Send. They're never gonna know it's me.", {
    hype: "'{x}' SEND! They're NEVER gonna know it's me!", dry: "'{x}' Send. They'll never know it's me. Probably.", blunt: "'{x}' Send. They won't know.",
    goofy: "'{x}' Send! They're never gonna know it's me! I'm a secret agent!", shy: "'{x}' Send. I don't think they'll know it's me.", chill: "'{x}' Send. They'll never know it's me.",
    catty: "'{x}' Send. They're never going to know it's me. They're not that smart.", diva: "'{x}' Send, darling. They'll never know.", stoic: "'{x}' Send." }],
  ['game.guess.submit.04', "Careful. What would my profile say? '{x}' That works.", {
    hype: "CAREFUL! What would my PROFILE say? '{x}' That WORKS!", dry: "Careful. What would my profile say. '{x}' That works.", blunt: "What would my profile say? '{x}' Works.",
    goofy: "Careful! What would my profile say? '{x}' That works! Good job, fake me!", shy: "Careful. What would my profile say? '{x}' Okay. That works.", chill: "Careful. What would my profile say? '{x}' Works.",
    catty: "Careful. What would my profile say? '{x}' That works. Flawless.", diva: "Stay in character, darling. '{x}' That works.", stoic: "What would the profile say? '{x}' Works." }],
  ['game.guess.submit.05', "'{q}' This is so embarrassing. '{x}'", {
    hype: "'{q}' This is SO embarrassing! '{x}'", dry: "'{q}' This is embarrassing. '{x}'", blunt: "'{q}' Embarrassing. '{x}'",
    goofy: "'{q}' This is so embarrassing! I'm blushing! '{x}'", shy: "'{q}' Oh, this is so embarrassing. '{x}'", chill: "'{q}' This is so embarrassing, dude. '{x}'",
    catty: "'{q}' This is embarrassing. For them, when they read it. '{x}'", diva: "'{q}' How mortifying, darling. '{x}'", stoic: "'{q}' Embarrassing. '{x}'" }],
  ['game.guess.prompt.01', "Next category. '{q}'", {
    hype: "NEXT category! '{q}'", dry: "Next category. '{q}' Oh good.", blunt: "Next. '{q}'",
    goofy: "Next category! '{q}' Ooh! Ooh!", shy: "Next category. '{q}'", chill: "Next category, man. '{q}'",
    catty: "Next category. '{q}' This should be revealing.", diva: "Next category, darling. '{q}'", stoic: "Next. '{q}'" }],
  ['game.guess.prompt.02', "'{q}' Oh, these are gonna be good.", {
    hype: "'{q}' OH, these are gonna be GOOD!", dry: "'{q}' Oh, these are going to be good.", blunt: "'{q}' These'll be good.",
    goofy: "'{q}' Oh, these are gonna be good! I'm getting popcorn! Imaginary popcorn!", shy: "'{q}' Oh. These are going to be good.", chill: "'{q}' These are gonna be good.",
    catty: "'{q}' Oh, these are going to be good. Somebody's going to embarrass themselves.", diva: "'{q}' Oh, darling, these will be delicious.", stoic: "'{q}' These'll be good." }],
  ['game.guess.prompt.03', "'{q}' I need to see everybody's answers right now.", {
    hype: "'{q}' I NEED to see everybody's answers RIGHT NOW!", dry: "'{q}' I need to see everybody's answers. Now.", blunt: "'{q}' Show me the answers.",
    goofy: "'{q}' I need to see everybody's answers right now! Right now! Is it now yet?", shy: "'{q}' I really want to see everybody's answers.", chill: "'{q}' Need to see everyone's answers.",
    catty: "'{q}' I need to see everybody's answers right now. All of them.", diva: "'{q}' Show me every answer, darling. Now.", stoic: "'{q}' Show me the answers." }],
  ['game.guess.prompt.04', "'{q}' This is where somebody slips up.", {
    hype: "'{q}' THIS is where somebody SLIPS UP!", dry: "'{q}' This is where somebody slips up. Watch.", blunt: "'{q}' Somebody slips up here.",
    goofy: "'{q}' This is where somebody slips up! Like on a banana peel!", shy: "'{q}' This is where somebody might slip up.", chill: "'{q}' This is where somebody slips up.",
    catty: "'{q}' This is where somebody slips up. I'll be watching.", diva: "'{q}' This is where a mask slips, darling.", stoic: "'{q}' Someone slips up here." }],
  // ── an answer on the screen ───────────────────────────────────────────
  ['game.guess.fact.01', "'{x}' Okay, who wrote that?", {
    hype: "'{x}' OKAY! WHO wrote that?!", dry: "'{x}' Okay. Who wrote that.", blunt: "'{x}' Who wrote that?",
    goofy: "'{x}' Okay! Who wrote that? Raise your hand! Nobody can see your hand!", shy: "'{x}' Okay. Who wrote that?", chill: "'{x}' Who wrote that?",
    catty: "'{x}' Okay. Who wrote that? Confess.", diva: "'{x}' Who wrote that, darling?", stoic: "'{x}' Who?" }],
  ['game.guess.fact.02', "'{x}' That's wild. That's so wild.", {
    hype: "'{x}' That's WILD! That's SO WILD!", dry: "'{x}' That's wild. Very wild.", blunt: "'{x}' Wild.",
    goofy: "'{x}' That's wild! So wild! Wild like a jungle!", shy: "'{x}' That's wild. That's so wild.", chill: "'{x}' That's wild, dude. So wild.",
    catty: "'{x}' That's wild. Somebody's been hiding things.", diva: "'{x}' How wild, darling!", stoic: "'{x}' Wild." }],
  ['game.guess.fact.03', "'{x}' I have a feeling. I have a strong feeling.", {
    hype: "'{x}' I have a FEELING! A STRONG feeling!", dry: "'{x}' I have a feeling. A strong one.", blunt: "'{x}' I have a feeling.",
    goofy: "'{x}' I have a feeling! A strong feeling! It's in my tummy!", shy: "'{x}' I have a feeling. A pretty strong feeling.", chill: "'{x}' I've got a feeling. A strong one.",
    catty: "'{x}' I have a feeling. And I'm usually right.", diva: "'{x}' I have a feeling, darling. A powerful one.", stoic: "'{x}' I have a feeling." }],
  ['game.guess.fact.04', "'{x}' Somebody in here is full of surprises.", {
    hype: "'{x}' SOMEBODY in here is FULL of surprises!", dry: "'{x}' Somebody in here is full of surprises.", blunt: "'{x}' Somebody's full of surprises.",
    goofy: "'{x}' Somebody in here is full of surprises! Like a jack-in-the-box!", shy: "'{x}' Somebody in here is full of surprises.", chill: "'{x}' Somebody's full of surprises.",
    catty: "'{x}' Somebody in here is full of surprises. And full of other things.", diva: "'{x}' Someone is full of surprises, darling.", stoic: "'{x}' Full of surprises." }],
  ['game.guess.fact.05', "'{x}' Ha! I love that.", {
    hype: "'{x}' HA! I LOVE that!", dry: "'{x}' Ha. I love that.", blunt: "'{x}' Love that.",
    goofy: "'{x}' Ha! I love that! I love it so much!", shy: "'{x}' Ha. I love that.", chill: "'{x}' Ha! Love that.",
    catty: "'{x}' Ha. I love that. Against my will.", diva: "'{x}' Ha! I adore that, darling.", stoic: "'{x}' Love that." }],
  ['game.guess.fact.06', "'{x}' That has to be a joke. That can't be real.", {
    hype: "'{x}' That HAS to be a joke! That CAN'T be real!", dry: "'{x}' That has to be a joke. It can't be real.", blunt: "'{x}' That's a joke. Can't be real.",
    goofy: "'{x}' That has to be a joke! That can't be real! Unless it is! Then wow!", shy: "'{x}' That has to be a joke. That can't be real.", chill: "'{x}' That's gotta be a joke.",
    catty: "'{x}' That has to be a joke. Or a lie.", diva: "'{x}' A joke, surely, darling. That can't be real.", stoic: "'{x}' Can't be real." }],
  ['game.guess.fact.07', "'{x}' I love whoever wrote that.", {
    hype: "'{x}' I LOVE whoever wrote that!", dry: "'{x}' I love whoever wrote that.", blunt: "'{x}' Love whoever wrote that.",
    goofy: "'{x}' I love whoever wrote that! I want to be best friends!", shy: "'{x}' I love whoever wrote that.", chill: "'{x}' Love whoever wrote that, man.",
    catty: "'{x}' I love whoever wrote that. Finally, somebody interesting.", diva: "'{x}' I adore whoever wrote that, darling.", stoic: "'{x}' I like whoever wrote that." }],
  ['game.guess.fact.08', "'{x}' That's either the most honest person in here or the biggest liar.", {
    hype: "'{x}' That's either the MOST honest person in here or the BIGGEST liar!", dry: "'{x}' Either the most honest person in here or the biggest liar. Fifty-fifty.", blunt: "'{x}' Most honest or biggest liar.",
    goofy: "'{x}' That's either the most honest person in here or the biggest liar! Or both! Is that possible?", shy: "'{x}' That's either the most honest person here or the biggest liar.", chill: "'{x}' That's either the most honest person here or the biggest liar, dude.",
    catty: "'{x}' That's either the most honest person in here or the biggest liar. My money's on liar.", diva: "'{x}' The most honest soul or the greatest liar, darling.", stoic: "'{x}' Honest or a liar." }],
  ['game.guess.fact.09', "'{x}' I have three guesses, and they're all wrong.", {
    hype: "'{x}' I have THREE guesses! And they're ALL WRONG!", dry: "'{x}' I have three guesses. All wrong.", blunt: "'{x}' Three guesses. All wrong.",
    goofy: "'{x}' I have three guesses! And they're all wrong! I can feel it! Wrong, wrong, wrong!", shy: "'{x}' I have three guesses. And they're probably all wrong.", chill: "'{x}' Three guesses. All wrong.",
    catty: "'{x}' I have three guesses. One of them is right.", diva: "'{x}' Three guesses, darling. All wrong, no doubt.", stoic: "'{x}' Three guesses. All wrong." }],
  ['game.guess.fact.10', "'{x}' Who? Who is this?", {
    hype: "'{x}' WHO?! WHO is this?!", dry: "'{x}' Who. Who is this.", blunt: "'{x}' Who is this?",
    goofy: "'{x}' Who? Who is this? Hello? Who?", shy: "'{x}' Who? Who is this?", chill: "'{x}' Who is this?",
    catty: "'{x}' Who? Who is this? Show yourself.", diva: "'{x}' Who is this, darling?", stoic: "'{x}' Who?" }],
  ['game.guess.fact.11', "'{x}' Oh, I know exactly who that is. I think.", {
    hype: "'{x}' OH! I know EXACTLY who that is! I THINK!", dry: "'{x}' Oh, I know exactly who that is. I think.", blunt: "'{x}' I know who that is. Maybe.",
    goofy: "'{x}' Oh! I know exactly who that is! I think! Maybe! No!", shy: "'{x}' Oh. I think I know who that is.", chill: "'{x}' I know who that is. I think.",
    catty: "'{x}' Oh, I know exactly who that is.", diva: "'{x}' I know exactly who that is, darling. I think.", stoic: "'{x}' I know who that is." }],
  // ── the guess ─────────────────────────────────────────────────────────
  ['game.guess.guessed.right.01', "That's {b}. I know it's {b}.", {
    hype: "That's {b}! I KNOW it's {b}!", dry: "That's {b}. I know it's {b}.", blunt: "It's {b}.",
    goofy: "That's {b}! I know it's {b}! My {b} sense is tingling!", shy: "That's {b}. I'm pretty sure it's {b}.", chill: "That's {b}. I know it.",
    catty: "That's {b}. I know it's {b}.", diva: "That's {b}, darling. I know it.", stoic: "{b}." }],
  ['game.guess.guessed.right.02', "Circle, I'm guessing {b}. Final answer.", {
    hype: "Circle, I'm guessing {b}! FINAL ANSWER!", dry: "Circle, guessing {b}. Final answer.", blunt: "Circle, {b}. Final.",
    goofy: "Circle, I'm guessing {b}! Final answer! Lock it in! Lock it in with a big lock!", shy: "Circle, I'm guessing {b}. Final answer.", chill: "Circle, guessing {b}. Final answer.",
    catty: "Circle, I'm guessing {b}. Final answer.", diva: "Circle, {b}, darling. Final answer.", stoic: "{b}. Final." }],
  ['game.guess.guessed.right.03', "That sounds exactly like {b}.", {
    hype: "That sounds EXACTLY like {b}!", dry: "That sounds exactly like {b}.", blunt: "Sounds like {b}.",
    goofy: "That sounds exactly like {b}! I can hear {b} saying it! In a funny voice!", shy: "That sounds exactly like {b}.", chill: "Sounds exactly like {b}, dude.",
    catty: "That sounds exactly like {b}. Unfortunately.", diva: "That sounds exactly like {b}, darling.", stoic: "Sounds like {b}." }],
  ['game.guess.guessed.right.04', "Easy. {b}. We talk every day.", {
    hype: "EASY! {b}! We talk EVERY DAY!", dry: "Easy. {b}. We talk every day.", blunt: "{b}. We talk every day.",
    goofy: "Easy! {b}! We talk every day! We're basically the same person!", shy: "Easy. {b}. We talk every day.", chill: "Easy. {b}. We talk every day.",
    catty: "Easy. {b}. We talk every day. I know {b} better than {b} does.", diva: "Easy, darling. {b}. We talk every day.", stoic: "{b}. We talk daily." }],
  ['game.guess.guessed.right.05', "{b}. It sounds exactly like something {b} would say.", {
    hype: "{b}! It sounds EXACTLY like something {b} would say!", dry: "{b}. Sounds exactly like something {b} would say.", blunt: "{b}. That's a {b} thing to say.",
    goofy: "{b}! It sounds exactly like something {b} would say! Word for word! Probably!", shy: "{b}. It sounds just like something {b} would say.", chill: "{b}. Sounds exactly like {b}.",
    catty: "{b}. It sounds exactly like something {b} would say. Sadly.", diva: "{b}, darling. Pure {b}.", stoic: "{b}. Sounds like {b}." }],
  ['game.guess.guessed.right.06', "I'm going with {b}. {b} told me something like that once.", {
    hype: "I'm going with {b}! {b} TOLD me something like that once!", dry: "Going with {b}. {b} told me something like that once.", blunt: "{b}. {b} told me once.",
    goofy: "I'm going with {b}! {b} told me something like that once! I have a good memory! Sometimes!", shy: "I'm going with {b}. {b} told me something like that once.", chill: "Going with {b}, man. {b} told me something like that.",
    catty: "I'm going with {b}. {b} told me something like that once. People tell me things.", diva: "I'm going with {b}, darling. {b} confided in me once.", stoic: "{b}. {b} told me once." }],
  ['game.guess.guessed.right.07', "That's {b}. I'd bet my apartment on it.", {
    hype: "That's {b}! I'd bet my APARTMENT on it!", dry: "That's {b}. I'd bet my apartment on it. It's a nice apartment.", blunt: "{b}. I'd bet on it.",
    goofy: "That's {b}! I'd bet my apartment on it! And the fridge! The fridge is the best part!", shy: "That's {b}. I'd bet my apartment on it.", chill: "That's {b}. I'd bet my apartment on it.",
    catty: "That's {b}. I'd bet my apartment on it.", diva: "That's {b}, darling. I'd stake my apartment on it.", stoic: "{b}. Certain." }],
  ['game.guess.guessed.right.08', "Circle, {b}. And I'm not changing it.", {
    hype: "Circle, {b}! And I'm NOT changing it!", dry: "Circle, {b}. Not changing it.", blunt: "Circle, {b}. Final.",
    goofy: "Circle, {b}! And I'm not changing it! Not even a little!", shy: "Circle, {b}. And I'm not changing it.", chill: "Circle, {b}. Not changing it.",
    catty: "Circle, {b}. And I'm not changing it.", diva: "Circle, {b}, darling. Unchanging.", stoic: "{b}. Not changing it." }],
  ['game.guess.guessed.right.09', "It's {b}. Nobody else in here would write that.", {
    hype: "It's {b}! NOBODY else in here would write that!", dry: "It's {b}. Nobody else would write that.", blunt: "{b}. Nobody else would.",
    goofy: "It's {b}! Nobody else in here would write that! It's too {b}!", shy: "It's {b}. Nobody else in here would write that.", chill: "It's {b}, dude. Nobody else would write that.",
    catty: "It's {b}. Nobody else in here would write that. Nobody else would admit it.", diva: "It's {b}, darling. Nobody else would dare.", stoic: "{b}. Nobody else would." }],
  ['game.guess.guessed.right.10', "{b}. That's too specific to be anybody else.", {
    hype: "{b}! That's TOO specific to be anybody else!", dry: "{b}. Too specific to be anybody else.", blunt: "{b}. Too specific.",
    goofy: "{b}! That's too specific to be anybody else! It's like a fingerprint!", shy: "{b}. That's too specific to be anybody else.", chill: "{b}. Too specific to be anybody else.",
    catty: "{b}. That's too specific to be anybody else.", diva: "{b}, darling. Too specific to be anyone else.", stoic: "{b}. Too specific." }],
  ['game.guess.guessed.wrong.01', "I have no idea. I'm guessing somebody else.", {
    hype: "I have NO idea! I'm guessing somebody ELSE!", dry: "No idea. Guessing somebody else.", blunt: "No idea. Someone else.",
    goofy: "I have no idea! I'm guessing somebody else! Somebody! Anybody!", shy: "I have no idea. I'll guess somebody else.", chill: "No idea. Guessing somebody else.",
    catty: "I have no idea. I'm guessing somebody else. Doesn't matter.", diva: "No idea, darling. Someone else.", stoic: "No idea." }],
  ['game.guess.guessed.wrong.02', "That's not anybody I know in here. I'll take a wild guess.", {
    hype: "That's NOT anybody I know! I'll take a WILD guess!", dry: "That's nobody I know in here. Wild guess, then.", blunt: "Don't know who. Wild guess.",
    goofy: "That's not anybody I know in here! I'll take a wild guess! A very wild guess! A jungle guess!", shy: "That's not anybody I know in here. I'll just take a wild guess.", chill: "Not anyone I know. Wild guess.",
    catty: "That's not anybody I know in here. Somebody's been hiding. Wild guess.", diva: "A stranger, darling. A wild guess, then.", stoic: "Don't know. Wild guess." }],
  ['game.guess.guessed.wrong.03', "I was so sure. I was so sure, and I was so wrong.", {
    hype: "I was SO sure! SO sure! And SO wrong!", dry: "I was so sure. So sure. So wrong.", blunt: "So sure. So wrong.",
    goofy: "I was so sure! I was so sure! And I was so wrong! Wrong-o!", shy: "I was so sure. And I was so wrong.", chill: "Was so sure. So wrong.",
    catty: "I was so sure. And I was wrong. That never happens.", diva: "So sure, darling. So wrong.", stoic: "Sure. Wrong." }],
  ['game.guess.guessed.wrong.04', "Circle, I'm going with my gut. My gut is usually right.", {
    hype: "Circle, I'm going with my GUT! My gut is USUALLY right!", dry: "Circle, going with my gut. My gut is usually right. Usually.", blunt: "Going with my gut.",
    goofy: "Circle, I'm going with my gut! My gut is usually right! My gut is a genius!", shy: "Circle, I'll go with my gut. It's usually right.", chill: "Circle, going with my gut.",
    catty: "Circle, I'm going with my gut. My gut is always right.", diva: "Circle, my instincts, darling. They rarely fail.", stoic: "Going with my gut." }],
  ['game.guess.guessed.wrong.05', "I'm stumped. I'll just pick a name.", {
    hype: "I'm STUMPED! I'll just pick a NAME!", dry: "Stumped. I'll pick a name.", blunt: "Stumped. Picking a name.",
    goofy: "I'm stumped! I'll just pick a name! Eeny, meeny, miny, moe!", shy: "I'm stumped. I'll just pick a name.", chill: "I'm stumped, dude. Picking a name.",
    catty: "I'm stumped. I'll pick a name. Somebody suspicious.", diva: "Stumped, darling. I'll pick a name.", stoic: "Stumped. Picking one." }],
  ['game.guess.guessed.wrong.06', "I'm guessing the person I think is most likely. I'm probably wrong.", {
    hype: "I'm guessing the MOST likely person! I'm PROBABLY wrong!", dry: "Guessing the most likely person. Probably wrong.", blunt: "Most likely person. Probably wrong.",
    goofy: "I'm guessing the person I think is most likely! I'm probably wrong! I'm a professional at wrong!", shy: "I'm guessing whoever's most likely. I'm probably wrong.", chill: "Guessing the most likely person, man. Probably wrong.",
    catty: "I'm guessing the most likely person. I'm rarely wrong.", diva: "I'll guess the most likely, darling. Probably wrong.", stoic: "Most likely person." }],
  ['game.guess.guessed.wrong.07', "This is so hard. Everybody could have written that.", {
    hype: "This is SO hard! EVERYBODY could have written that!", dry: "So hard. Anybody could've written that.", blunt: "Hard. Anyone could've written it.",
    goofy: "This is so hard! Everybody could have written that! Even me! Did I write it? No!", shy: "This is so hard. Anybody could have written that.", chill: "So hard. Anyone could've written that.",
    catty: "This is so hard. They're all so boring, anybody could have written that.", diva: "So difficult, darling. Anyone could have written it.", stoic: "Hard. Anyone could have." }],
  ['game.guess.guessed.wrong.08', "I thought I knew everybody by now. I don't.", {
    hype: "I THOUGHT I knew everybody by now! I DON'T!", dry: "Thought I knew everybody by now. I don't.", blunt: "Thought I knew everyone. I don't.",
    goofy: "I thought I knew everybody by now! I don't! I don't know anybody! Who am I?", shy: "I thought I knew everybody by now. I don't.", chill: "Thought I knew everyone by now. I don't.",
    catty: "I thought I knew everybody by now. Some of them have been hiding.", diva: "I thought I knew the cast by now, darling. I don't.", stoic: "Thought I knew them. Don't." }],
  ['game.guess.guessed.wrong.09', "Wrong. I'm wrong. I can feel myself being wrong.", {
    hype: "WRONG! I'm WRONG! I can FEEL myself being wrong!", dry: "Wrong. I'm wrong. I can feel it.", blunt: "I'm wrong. I can feel it.",
    goofy: "Wrong! I'm wrong! I can feel myself being wrong! It feels squishy!", shy: "I'm wrong. I can feel myself being wrong.", chill: "Wrong. I can feel it.",
    catty: "Wrong. I'm wrong. Don't tell anyone.", diva: "Wrong, darling. I can feel it.", stoic: "Wrong." }],
  ['game.guess.guessed.wrong.10', "Circle, I'm guessing. Just guessing. No idea.", {
    hype: "Circle, I'm GUESSING! Just GUESSING! NO IDEA!", dry: "Circle, I'm guessing. Just guessing. No idea.", blunt: "Circle, guessing. No idea.",
    goofy: "Circle, I'm guessing! Just guessing! No idea! None! Zero ideas!", shy: "Circle, I'm just guessing. I have no idea.", chill: "Circle, just guessing. No idea.",
    catty: "Circle, I'm guessing. Somebody's been sneaky.", diva: "Circle, a guess, darling. No idea.", stoic: "Guessing." }],
  // ── whose it was ──────────────────────────────────────────────────────
  ['game.guess.owner.01', "That was me! Nobody guessed it was me!", {
    hype: "That was ME! NOBODY guessed it was me!", dry: "That was me. Nobody guessed. Huh.", blunt: "That was me. Nobody guessed.",
    goofy: "That was me! Nobody guessed it was me! I'm a master of disguise!", shy: "That was me. Nobody guessed it was me.", chill: "That was me, dude! Nobody guessed!",
    catty: "That was me. Nobody guessed. They don't know me at all.", diva: "That was me, darling! Nobody guessed!", stoic: "Me. Nobody guessed." }],
  ['game.guess.owner.02', "Yes, that was mine. Don't judge me.", {
    hype: "YES, that was MINE! Don't JUDGE me!", dry: "Yes, that was mine. Don't judge me. Too late.", blunt: "Mine. Don't judge.",
    goofy: "Yes, that was mine! Don't judge me! Okay, judge me a little!", shy: "Yes, that was mine. Please don't judge me.", chill: "Yeah, that was mine. Don't judge.",
    catty: "Yes, that was mine. Judge me. I dare you.", diva: "Yes, darling, that was mine. Don't judge.", stoic: "Mine. Don't judge." }],
  ['game.guess.owner.03', "'{x}' That's me. I stand by it.", {
    hype: "'{x}' That's ME! I STAND by it!", dry: "'{x}' That's me. I stand by it.", blunt: "'{x}' Me. I stand by it.",
    goofy: "'{x}' That's me! I stand by it! I'm standing! Look!", shy: "'{x}' That's me. I stand by it.", chill: "'{x}' That's me. I stand by it.",
    catty: "'{x}' That's me. I stand by it. Proudly.", diva: "'{x}' That's me, darling. I stand by it.", stoic: "'{x}' Me. I stand by it." }],
  ['game.guess.owner.04', "They got me. How did they get me?", {
    hype: "They GOT me! HOW did they get me?!", dry: "They got me. How. How did they get me.", blunt: "They got me. How?",
    goofy: "They got me! How did they get me? Are they psychic? Are they reading my diary?", shy: "They got me. How did they get me?", chill: "They got me. How?",
    catty: "They got me. How did they get me? Somebody's been paying attention.", diva: "They got me, darling! How?", stoic: "They got me. How?" }],
  ['game.guess.owner.05', "Yep, that one's mine. Was that too much? Was that too real for my profile?", {
    hype: "Yep, that's MINE! Was that too MUCH?! Too REAL for my profile?!", dry: "Yep, mine. Too much? Too real for my profile? Probably.", blunt: "Mine. Too real for my profile?",
    goofy: "Yep, that one's mine! Was that too much? Was that too real for my profile? Uh oh!", shy: "Yep, that's mine. Was that too much? Too real for my profile?", chill: "Yep, that's mine. Was that too real for my profile?",
    catty: "Yep, that's mine. Too real for my profile? They won't notice.", diva: "Yes, mine, darling. Too real for my character?", stoic: "Mine. Too real for the profile?" }],
  ['game.guess.owner.06', "That's mine. Oh no. That doesn't sound like somebody my age. Does it?", {
    hype: "That's MINE! Oh NO! That doesn't sound like somebody my AGE! Does it?!", dry: "That's mine. Oh no. That doesn't sound like somebody my age. Does it.", blunt: "Mine. Doesn't sound like my age. Does it?",
    goofy: "That's mine! Oh no! That doesn't sound like somebody my age! Does it? It does not!", shy: "That's mine. Oh no. That doesn't sound like somebody my age. Does it?", chill: "That's mine. Oh no. Doesn't sound like my age, does it, man?",
    catty: "That's mine. That doesn't sound like somebody my age. They'll never notice.", diva: "That's mine, darling. Oh no. Not age-appropriate for my character.", stoic: "Mine. Wrong age. Does it show?" }],
  ['game.guess.owner.07', "That's mine, and I regret nothing.", {
    hype: "That's MINE! And I regret NOTHING!", dry: "That's mine. I regret nothing. Mostly.", blunt: "Mine. No regrets.",
    goofy: "That's mine! And I regret nothing! Okay, one thing! But not that!", shy: "That's mine. And I don't regret it.", chill: "That's mine, dude. No regrets.",
    catty: "That's mine, and I regret nothing.", diva: "Mine, darling. I regret nothing.", stoic: "Mine. No regrets." }],
  ['game.guess.owner.08', "Guilty. That was me.", {
    hype: "GUILTY! That was ME!", dry: "Guilty. That was me.", blunt: "Guilty.",
    goofy: "Guilty! That was me! Put me in fun jail!", shy: "Guilty. That was me.", chill: "Guilty. That was me.",
    catty: "Guilty. That was me. And?", diva: "Guilty, darling. That was me.", stoic: "Guilty." }],
  ['game.guess.owner.09', "They finally know something real about me.", {
    hype: "They FINALLY know something REAL about me!", dry: "They finally know something real about me. Strange feeling.", blunt: "They know something real now.",
    goofy: "They finally know something real about me! It's a big day! Somebody bake a cake!", shy: "They finally know something real about me.", chill: "They finally know something real about me.",
    catty: "They finally know something real about me. Just one thing.", diva: "They finally know something real about me, darling.", stoic: "They know something real now." }],
  ['game.guess.owner.10', "Surprise! It was me all along.", {
    hype: "SURPRISE! It was ME all along!", dry: "Surprise. It was me. All along.", blunt: "It was me.",
    goofy: "Surprise! It was me all along! Ta-da! Jazz hands!", shy: "Surprise. It was me.", chill: "Surprise. It was me.",
    catty: "Surprise. It was me all along. Obviously.", diva: "Surprise, darling! It was me all along!", stoic: "It was me." }],
  ['game.guess.owner.11', "Yep. Me. Moving on.", {
    hype: "YEP! ME! MOVING ON!", dry: "Yep. Me. Moving on.", blunt: "Me. Moving on.",
    goofy: "Yep! Me! Moving on! Nothing to see here! Shoo!", shy: "Yep. That was me. Moving on.", chill: "Yep, me. Moving on.",
    catty: "Yep. Me. Moving on.", diva: "Yes, darling. Me. Moving on.", stoic: "Me. Moving on." }],
  ['game.guess.owner.12', "That's me, and I'm a little embarrassed now.", {
    hype: "That's ME! And I'm a LITTLE embarrassed now!", dry: "That's me. A little embarrassed now.", blunt: "That's me. Embarrassed.",
    goofy: "That's me! And I'm a little embarrassed now! My cheeks are hot! Like toast!", shy: "That's me. And I'm a little embarrassed now.", chill: "That's me. Kinda embarrassed now.",
    catty: "That's me. I'm not embarrassed. Much.", diva: "That's me, darling. Slightly mortified.", stoic: "Me. Embarrassed." }],
  ['game.guess.conclusion.01', "{b} surprised me in that game. More than once.", {
    hype: "{b} SURPRISED me in that game! More than ONCE!", dry: "{b} surprised me in that game. More than once.", blunt: "{b} surprised me. More than once.",
    goofy: "{b} surprised me in that game! More than once! {b} is a box of surprises!", shy: "{b} surprised me in that game. More than once.", chill: "{b} surprised me in that game, dude. More than once.",
    catty: "{b} surprised me in that game. More than once. I'm keeping notes.", diva: "{b} surprised me, darling. More than once.", stoic: "{b} surprised me." }],
  ['game.guess.conclusion.02', "I feel like I know everybody a little better now. Especially {b}.", {
    hype: "I know EVERYBODY a little better now! ESPECIALLY {b}!", dry: "I know everybody a little better now. Especially {b}.", blunt: "Know everyone better. Especially {b}.",
    goofy: "I feel like I know everybody a little better now! Especially {b}! We're practically cousins!", shy: "I feel like I know everybody a little better now. Especially {b}.", chill: "Know everyone a little better now. Especially {b}.",
    catty: "I know everybody a little better now. Especially {b}. That's useful.", diva: "I know the cast better now, darling. Especially {b}.", stoic: "Know them better. Especially {b}." }],
  ['game.guess.conclusion.03', "Nobody could place {b}'s answers. Nobody. That's interesting.", {
    hype: "NOBODY could place {b}'s answers! NOBODY! That's INTERESTING!", dry: "Nobody could place {b}'s answers. Nobody. Interesting.", blunt: "Nobody placed {b}'s answers. Interesting.",
    goofy: "Nobody could place {b}'s answers! Nobody! That's interesting! {b} is a mystery box!", shy: "Nobody could place {b}'s answers. That's interesting.", chill: "Nobody could place {b}'s answers. Interesting.",
    catty: "Nobody could place {b}'s answers. Nobody. That's very interesting.", diva: "Nobody could place {b}, darling. Intriguing.", stoic: "Nobody placed {b}'s. Interesting." }],
  ['game.guess.conclusion.04', "{b}'s answer does not match that profile. At all.", {
    hype: "{b}'s answer does NOT match that profile! AT ALL!", dry: "{b}'s answer does not match that profile. At all.", blunt: "{b}'s answer doesn't match the profile.",
    goofy: "{b}'s answer does not match that profile! At all! Like socks that don't match!", shy: "{b}'s answer doesn't really match that profile.", chill: "{b}'s answer doesn't match that profile, man. At all.",
    catty: "{b}'s answer does not match that profile. At all. Interesting.", diva: "{b}'s answer doesn't match the character, darling.", stoic: "{b}'s answer doesn't match." }],
  ['game.guess.conclusion.05', "Who is {b}, really? That answer made me wonder.", {
    hype: "Who IS {b}, REALLY?! That answer made me WONDER!", dry: "Who is {b}, really. That answer made me wonder.", blunt: "Who is {b}? That answer was off.",
    goofy: "Who is {b}, really? That answer made me wonder! Is {b} three raccoons?", shy: "Who is {b}, really? That answer made me wonder.", chill: "Who's {b}, really? Made me wonder.",
    catty: "Who is {b}, really? That answer made me wonder. And I'll find out.", diva: "Who is {b}, really, darling? That answer gave me pause.", stoic: "Who is {b}?" }],
  // ── the team trivia: captains and the draft ───────────────────────────
  ['game.team.captains.01', "'You will be leading one of the teams as their Team Captain.' Oh my gosh, I'm gonna be a great captain!", {
    hype: "'You will be leading one of the teams as their Team Captain.' OH MY GOSH! I'm gonna be a GREAT captain!", dry: "'You will be leading one of the teams as their Team Captain.' Oh. Okay. I'll be a fine captain.", blunt: "'You will be leading one of the teams as their Team Captain.' Good. I'll lead.",
    goofy: "'You will be leading one of the teams as their Team Captain.' Oh my gosh! I'm gonna be a great captain! Aye aye!", shy: "'You will be leading one of the teams as their Team Captain.' Oh. Me? Okay. I'll try to be a good captain.", chill: "'You will be leading one of the teams as their Team Captain.' Oh, nice. I'll be a good captain.",
    catty: "'You will be leading one of the teams as their Team Captain.' Finally, somebody with taste in charge.", diva: "'You will be leading one of the teams as their Team Captain.' A leading role, darling!", stoic: "'You will be leading one of the teams as their Team Captain.' Okay." }],
  ['game.team.captains.02', "A captain! Me? Okay, pressure.", {
    hype: "A CAPTAIN! ME?! Okay, PRESSURE!", dry: "A captain. Me. Okay. Pressure.", blunt: "Captain. Me. Pressure.",
    goofy: "A captain! Me? Okay, pressure! I'm sweating! Is it hot in here?", shy: "A captain? Me? Okay. That's a lot of pressure.", chill: "A captain? Me, dude? Okay, pressure.",
    catty: "A captain. Me. Of course.", diva: "A captain? Me, darling? The pressure!", stoic: "Captain. Pressure." }],
  ['game.team.captains.03', "I get to pick my own team? Oh, I'm picking smart.", {
    hype: "I get to pick my OWN team?! I'm picking SMART!", dry: "I pick my own team. I'm picking smart. Revolutionary.", blunt: "My own team. Picking smart.",
    goofy: "I get to pick my own team? Oh, I'm picking smart! The smartest! Nerds assemble!", shy: "I get to pick my own team? Okay. I'll try to pick smart.", chill: "I get to pick my own team? Picking smart.",
    catty: "I get to pick my own team? Oh, I'm picking smart. Not like the other captain.", diva: "I choose my own cast, darling? I'll pick wisely.", stoic: "My team. Picking smart." }],
  ['game.team.captains.04', "'The other Captain is also a new Player who joined today.' I've been here twelve minutes!", {
    hype: "'The other Captain is also a new Player who joined today.' I've been here TWELVE MINUTES!", dry: "'The other Captain is also a new Player who joined today.' I've been here twelve minutes. Great.", blunt: "'The other Captain is also a new Player who joined today.' Twelve minutes in.",
    goofy: "'The other Captain is also a new Player who joined today.' I've been here twelve minutes! I haven't found the bathroom!", shy: "'The other Captain is also a new Player who joined today.' I've only been here twelve minutes.", chill: "'The other Captain is also a new Player who joined today.' Twelve minutes in.",
    catty: "'The other Captain is also a new Player who joined today.' Twelve minutes in. And already in charge.", diva: "'The other Captain is also a new Player who joined today.' Twelve minutes and I'm leading, darling!", stoic: "'The other Captain is also a new Player who joined today.' Twelve minutes." }],
  ['game.team.scout.want.01', "Circle, take me to {b}'s profile. That's a confident smile. That's a 'I know trivia' smile.", {
    hype: "Circle, take me to {b}'s profile! That's a CONFIDENT smile! That's an 'I know trivia' smile!", dry: "Circle, {b}'s profile. Confident smile. An 'I know trivia' smile. Hopefully.", blunt: "Circle, {b}'s profile. That's a trivia smile.",
    goofy: "Circle, take me to {b}'s profile! That's a confident smile! That's an 'I know trivia' smile! And an 'I know snacks' smile!", shy: "Circle, take me to {b}'s profile. That's a confident smile. Like {b} knows trivia.", chill: "Circle, {b}'s profile. That's a confident smile. Trivia smile.",
    catty: "Circle, {b}'s profile. Confident smile. Let's hope there's something behind it.", diva: "Circle, {b}'s profile, darling. A confident smile. A trivia smile.", stoic: "Circle, {b}'s profile. Confident. Smart." }],
  ['game.team.scout.want.02', "{b} seems smart. I want {b} on my team, not against me.", {
    hype: "{b} seems SMART! I want {b} on my TEAM, not AGAINST me!", dry: "{b} seems smart. On my team, not against me.", blunt: "{b}'s smart. On my team.",
    goofy: "{b} seems smart! I want {b} on my team! Not against me! Never against me!", shy: "{b} seems smart. I'd rather have {b} on my team.", chill: "{b} seems smart. Want {b} on my team.",
    catty: "{b} seems smart. Better on my team than against me.", diva: "{b} seems smart, darling. I want {b} beside me.", stoic: "{b}'s smart. My team." }],
  ['game.team.scout.want.03', "{b} looks like someone who reads. I need a reader.", {
    hype: "{b} looks like someone who READS! I NEED a reader!", dry: "{b} looks like a reader. I need a reader.", blunt: "{b} reads. I need that.",
    goofy: "{b} looks like someone who reads! I need a reader! I mostly read cereal boxes!", shy: "{b} looks like someone who reads. I need a reader.", chill: "{b} looks like a reader. Need one.",
    catty: "{b} looks like someone who reads. Unlike most of these profiles.", diva: "{b} looks well-read, darling. I need that.", stoic: "{b} reads. Need that." }],
  ['game.team.scout.want.04', "I kind of want {b}. {b} could bring the team together.", {
    hype: "I kind of WANT {b}! {b} could bring the team TOGETHER!", dry: "I kind of want {b}. {b} could bring the team together.", blunt: "I want {b}. Team player.",
    goofy: "I kind of want {b}! {b} could bring the team together! Like a group hug!", shy: "I kind of want {b}. {b} could bring the team together.", chill: "Kinda want {b}, dude. {b} could bring the team together.",
    catty: "I kind of want {b}. Somebody has to keep the team from bickering.", diva: "I want {b}, darling. A unifying presence.", stoic: "{b}. Brings the team together." }],
  ['game.team.scout.want.05', "{b}'s profile says 'always learning.' I like always learning.", {
    hype: "{b}'s profile says 'always learning.' I LOVE always learning!", dry: "{b}'s profile says 'always learning.' I like always learning.", blunt: "{b}'s profile says 'always learning.' Good.",
    goofy: "{b}'s profile says 'always learning.' I like always learning! I'm always learning too! Mostly about snacks!", shy: "{b}'s profile says 'always learning.' I like that.", chill: "{b}'s profile says 'always learning.' I like that, man.",
    catty: "{b}'s profile says 'always learning.' Let's hope {b} has learned something.", diva: "{b}'s profile says 'always learning,' darling. I like that.", stoic: "{b}'s profile says 'always learning.' Good." }],
  ['game.team.scout.want.06', "{b}. Smart eyes. I want smart eyes.", {
    hype: "{b}! SMART EYES! I want SMART EYES!", dry: "{b}. Smart eyes. I want smart eyes.", blunt: "{b}. Smart eyes. Want them.",
    goofy: "{b}! Smart eyes! I want smart eyes! Mine are snack eyes!", shy: "{b}. Smart eyes. I want smart eyes.", chill: "{b}. Smart eyes. Want those.",
    catty: "{b}. Smart eyes. Rare in here.", diva: "{b}, darling. Intelligent eyes.", stoic: "{b}. Smart eyes." }],
  ['game.team.scout.pass.01', "{b}? Looks like {b} is trying a little hard. I don't know.", {
    hype: "{b}?! Looks like {b} is trying a LITTLE hard! I don't KNOW!", dry: "{b}. Looks like {b} is trying a bit hard. I don't know.", blunt: "{b}'s trying too hard. Not sure.",
    goofy: "{b}? Looks like {b} is trying a little hard! I don't know! Maybe {b} needs a nap!", shy: "{b}? Looks like {b} might be trying a little hard. I don't know.", chill: "{b}? Trying a little hard. Not sure.",
    catty: "{b}? Looks like {b} is trying a little hard. Desperation isn't a skill.", diva: "{b}? Trying a little hard, darling.", stoic: "{b}. Trying hard. Not sure." }],
  ['game.team.scout.pass.02', "I'm not feeling {b} for trivia. Sorry, {b}.", {
    hype: "I'm NOT feeling {b} for trivia! SORRY, {b}!", dry: "Not feeling {b} for trivia. Sorry, {b}.", blunt: "Not {b}. Sorry.",
    goofy: "I'm not feeling {b} for trivia! Sorry, {b}! Maybe for charades!", shy: "I'm not really feeling {b} for trivia. Sorry, {b}.", chill: "Not feeling {b} for trivia. Sorry, {b}.",
    catty: "I'm not feeling {b} for trivia. Sorry, {b}. Not really.", diva: "Not {b} for trivia, darling. Sorry, {b}.", stoic: "Not {b}. Sorry." }],
  ['game.team.scout.pass.03', "{b} would be fun. But fun doesn't win trivia.", {
    hype: "{b} would be FUN! But fun doesn't WIN trivia!", dry: "{b} would be fun. Fun doesn't win trivia.", blunt: "{b}'s fun. Fun doesn't win.",
    goofy: "{b} would be fun! But fun doesn't win trivia! Fun wins my heart though!", shy: "{b} would be fun. But fun doesn't win trivia.", chill: "{b}'d be fun. But fun doesn't win trivia.",
    catty: "{b} would be fun. Fun doesn't win trivia.", diva: "{b} would be fun, darling. But fun doesn't win.", stoic: "{b}'s fun. Fun doesn't win." }],
  ['game.team.scout.pass.04', "Hm. {b}. Maybe later. Maybe much later.", {
    hype: "Hm! {b}! Maybe LATER! Maybe MUCH later!", dry: "Hm. {b}. Maybe later. Much later.", blunt: "{b}. Later.",
    goofy: "Hm! {b}! Maybe later! Maybe much later! Maybe next year!", shy: "Hm. {b}. Maybe later.", chill: "{b}. Maybe later, dude. Much later.",
    catty: "Hm. {b}. Maybe later. Maybe never.", diva: "{b}, darling. Perhaps later. Much later.", stoic: "{b}. Later." }],
  ['game.team.scout.pass.05', "{b} seems sweet. Sweet doesn't know trivia.", {
    hype: "{b} seems SWEET! Sweet doesn't KNOW trivia!", dry: "{b} seems sweet. Sweet doesn't know trivia.", blunt: "{b}'s sweet. Doesn't mean smart.",
    goofy: "{b} seems sweet! Sweet doesn't know trivia! Sweet knows cupcakes!", shy: "{b} seems sweet. But sweet doesn't win trivia.", chill: "{b} seems sweet. Sweet doesn't know trivia.",
    catty: "{b} seems sweet. Sweet doesn't know trivia.", diva: "{b} seems sweet, darling. Sweet isn't trivia.", stoic: "{b}'s sweet. Not trivia." }],
  ['game.team.scout.pass.06', "{b}'s profile is all selfies. Pass. For now.", {
    hype: "{b}'s profile is ALL selfies! PASS! For now!", dry: "{b}'s profile is all selfies. Pass. For now.", blunt: "All selfies. Pass.",
    goofy: "{b}'s profile is all selfies! Pass! For now! Nice selfies though!", shy: "{b}'s profile is all selfies. I'll pass. For now.", chill: "{b}'s profile is all selfies. Pass for now.",
    catty: "{b}'s profile is all selfies. Pass. Forever.", diva: "{b}'s profile is all selfies, darling. Pass. For now.", stoic: "All selfies. Pass." }],
  ['game.team.picks.01', "Next pick. {b}.", {
    hype: "NEXT pick! {b}!", dry: "Next pick. {b}.", blunt: "{b}.",
    goofy: "Next pick! {b}! Come on down!", shy: "Next pick. {b}.", chill: "Next pick. {b}.",
    catty: "Next pick. {b}.", diva: "Next pick, darling. {b}.", stoic: "{b}." }],
  ['game.team.picks.02', "I'll take {b}. {b} gets it.", {
    hype: "I'll take {b}! {b} GETS it!", dry: "I'll take {b}. {b} gets it.", blunt: "{b}. {b} gets it.",
    goofy: "I'll take {b}! {b} gets it! {b} gets everything!", shy: "I'll take {b}. {b} gets it.", chill: "I'll take {b}. {b} gets it.",
    catty: "I'll take {b}. {b} gets it. Unlike some.", diva: "I'll take {b}, darling. {b} understands.", stoic: "{b}. Gets it." }],
  ['game.team.picks.03', "{b}, you're with me. Don't let me down.", {
    hype: "{b}! You're WITH me! Don't let me DOWN!", dry: "{b}, you're with me. Don't let me down.", blunt: "{b}, with me. Don't let me down.",
    goofy: "{b}, you're with me! Don't let me down! Or do! No, don't!", shy: "{b}, you're with me. Please don't let me down.", chill: "{b}, you're with me, man. Don't let me down.",
    catty: "{b}, you're with me. Don't let me down. I'll remember.", diva: "{b}, darling, you're with me. Don't disappoint.", stoic: "{b}. With me. Don't let me down." }],
  ['game.team.picks.04', "Okay, {b}. Welcome to the team.", {
    hype: "Okay, {b}! WELCOME to the team!", dry: "Okay, {b}. Welcome to the team.", blunt: "{b}. Welcome.",
    goofy: "Okay, {b}! Welcome to the team! We have jackets! We don't have jackets!", shy: "Okay, {b}. Welcome to the team.", chill: "Okay, {b}. Welcome to the team, dude.",
    catty: "Okay, {b}. Welcome to the team. Don't embarrass us.", diva: "Welcome to the ensemble, {b}, darling.", stoic: "{b}. Welcome." }],
  ['game.team.last.01', "Last? Picked last. Wow.", {
    hype: "LAST?! Picked LAST! WOW!", dry: "Last. Picked last. Wow.", blunt: "Picked last. Wow.",
    goofy: "Last? Picked last! Wow! Just like gym class!", shy: "Last? I was picked last. Wow.", chill: "Picked last. Wow.",
    catty: "Last? Picked last. They'll regret that.", diva: "Last, darling? Picked last? Wow.", stoic: "Picked last." }],
  ['game.team.last.02', "I'm the last one. Cool. Cool, cool.", {
    hype: "I'm the LAST one! COOL! Cool, COOL!", dry: "I'm the last one. Cool. Cool, cool.", blunt: "Last one. Cool.",
    goofy: "I'm the last one! Cool! Cool, cool! I'm saving the best for last!", shy: "I'm the last one. Cool. Cool, cool.", chill: "Last one. Cool. Cool, cool.",
    catty: "I'm the last one. Cool. Noted.", diva: "The last one, darling. Cool. Cool.", stoic: "Last one." }],
  ['game.team.last.03', "Everybody got picked and then me. Noted, {b}.", {
    hype: "EVERYBODY got picked and then ME! NOTED, {b}!", dry: "Everybody got picked. Then me. Noted, {b}.", blunt: "Everyone, then me. Noted, {b}.",
    goofy: "Everybody got picked and then me! Noted, {b}! I'm writing it on my hand!", shy: "Everybody got picked and then me. Noted, {b}.", chill: "Everyone got picked, then me. Noted, {b}.",
    catty: "Everybody got picked and then me. Noted, {b}. Very noted.", diva: "Everyone, then me. Noted, {b}, darling.", stoic: "Then me. Noted, {b}." }],
  ['game.team.last.04', "Picked last. Fine. I'll be the one who wins it for them.", {
    hype: "Picked LAST?! FINE! I'll be the one who WINS it for them!", dry: "Picked last. Fine. I'll win it for them. Watch.", blunt: "Picked last. I'll win it for them.",
    goofy: "Picked last! Fine! I'll be the one who wins it for them! Underdog power!", shy: "Picked last. Okay. Maybe I'll be the one who wins it for them.", chill: "Picked last. Fine. I'll win it for them.",
    catty: "Picked last. Fine. I'll be the one who wins it for them. And they'll know it.", diva: "Picked last, darling? Fine. I'll steal the show.", stoic: "Picked last. I'll win it." }],
  // ── the team trivia: the questions ────────────────────────────────────
  ['game.team.question.right.01', "'{q}' Oh, I know this. {x}!", {
    hype: "'{q}' OH! I KNOW this! {x}!", dry: "'{q}' Oh. I know this. {x}.", blunt: "'{q}' {x}.",
    goofy: "'{q}' Oh! I know this! I know this! {x}!", shy: "'{q}' Oh, I think I know this. {x}.", chill: "'{q}' Oh, I know this. {x}!",
    catty: "'{q}' Oh, I know this. {x}. Obviously.", diva: "'{q}' Oh, I know this, darling! {x}!", stoic: "'{q}' {x}." }],
  ['game.team.question.right.02', "'{q}' Easy. {x}.", {
    hype: "'{q}' EASY! {x}!", dry: "'{q}' Easy. {x}.", blunt: "'{q}' {x}. Easy.",
    goofy: "'{q}' Easy! {x}! Easy peasy lemon squeezy!", shy: "'{q}' Easy. {x}.", chill: "'{q}' Easy, dude. {x}.",
    catty: "'{q}' Easy. {x}. Who doesn't know that?", diva: "'{q}' Easy, darling. {x}.", stoic: "'{q}' {x}." }],
  ['game.team.question.right.03', "'{q}' Is it… {x}? It's {x}.", {
    hype: "'{q}' Is it… {x}?! It's {x}!", dry: "'{q}' Is it… {x}. It's {x}.", blunt: "'{q}' {x}. It's {x}.",
    goofy: "'{q}' Is it… {x}? It's {x}! Ding ding ding!", shy: "'{q}' Is it… {x}? I think it's {x}.", chill: "'{q}' Is it… {x}? Yeah, it's {x}.",
    catty: "'{q}' Is it… {x}? It's {x}. Of course.", diva: "'{q}' Is it… {x}? It's {x}, darling.", stoic: "'{q}' {x}." }],
  ['game.team.question.right.04', "'{q}' {x}. Next question.", {
    hype: "'{q}' {x}! NEXT QUESTION!", dry: "'{q}' {x}. Next question.", blunt: "'{q}' {x}. Next.",
    goofy: "'{q}' {x}! Next question! Bring it on!", shy: "'{q}' {x}. Next question.", chill: "'{q}' {x}. Next question.",
    catty: "'{q}' {x}. Next question. Something harder, please.", diva: "'{q}' {x}, darling. Next.", stoic: "'{q}' {x}. Next." }],
  ['game.team.question.right.05', "'{q}' {x}. I knew that when I was eight.", {
    hype: "'{q}' {x}! I knew that when I was EIGHT!", dry: "'{q}' {x}. I knew that when I was eight.", blunt: "'{q}' {x}. Knew it at eight.",
    goofy: "'{q}' {x}! I knew that when I was eight! I peaked at eight!", shy: "'{q}' {x}. I think I knew that when I was eight.", chill: "'{q}' {x}. Knew that when I was eight, man.",
    catty: "'{q}' {x}. I knew that when I was eight. Some of you still don't.", diva: "'{q}' {x}, darling. I knew that at eight.", stoic: "'{q}' {x}. Knew it at eight." }],
  ['game.team.question.right.06', "'{q}' Oh, oh! {x}!", {
    hype: "'{q}' OH! OH! {x}!", dry: "'{q}' Oh. Oh. {x}.", blunt: "'{q}' {x}!",
    goofy: "'{q}' Oh, oh! Ooh! {x}! Pick me!", shy: "'{q}' Oh! {x}!", chill: "'{q}' Oh, oh! {x}!",
    catty: "'{q}' Oh, oh! {x}! Obviously!", diva: "'{q}' Oh, oh! {x}, darling!", stoic: "'{q}' {x}." }],
  ['game.team.question.right.07', "'{q}' {x}, final answer.", {
    hype: "'{q}' {x}! FINAL ANSWER!", dry: "'{q}' {x}. Final answer.", blunt: "'{q}' {x}. Final.",
    goofy: "'{q}' {x}! Final answer! Super final!", shy: "'{q}' {x}. Final answer.", chill: "'{q}' {x}, final answer.",
    catty: "'{q}' {x}. Final answer.", diva: "'{q}' {x}, darling. Final answer.", stoic: "'{q}' {x}. Final." }],
  ['game.team.question.right.08', "'{q}' I got this. {x}.", {
    hype: "'{q}' I GOT this! {x}!", dry: "'{q}' I've got this. {x}.", blunt: "'{q}' Got it. {x}.",
    goofy: "'{q}' I got this! {x}! I totally got this!", shy: "'{q}' I think I've got this. {x}.", chill: "'{q}' I got this, dude. {x}.",
    catty: "'{q}' I've got this. {x}. Step aside.", diva: "'{q}' I've got this, darling. {x}.", stoic: "'{q}' {x}." }],
  ['game.team.question.right.09', "'{q}' Easy money. {x}.", {
    hype: "'{q}' EASY MONEY! {x}!", dry: "'{q}' Easy money. {x}.", blunt: "'{q}' {x}. Easy.",
    goofy: "'{q}' Easy money! {x}! Cha-ching!", shy: "'{q}' Easy. {x}.", chill: "'{q}' Easy money. {x}.",
    catty: "'{q}' Easy money. {x}.", diva: "'{q}' Easy money, darling. {x}.", stoic: "'{q}' {x}." }],
  ['game.team.question.wrong.01', "'{q}' Oh no. Um. {x}?", {
    hype: "'{q}' OH NO! UM! {x}?!", dry: "'{q}' Oh no. Um. {x}.", blunt: "'{q}' Um. {x}?",
    goofy: "'{q}' Oh no! Um! Uh! {x}? Is that a thing?", shy: "'{q}' Oh no. Um. {x}?", chill: "'{q}' Oh no. Uh, {x}?",
    catty: "'{q}' Oh no. Um. {x}? Who writes these questions?", diva: "'{q}' Oh no, darling. Um. {x}?", stoic: "'{q}' {x}?" }],
  ['game.team.question.wrong.02', "'{q}' {x}. I'm sure. I'm so sure.", {
    hype: "'{q}' {x}! I'm SURE! I'm SO sure!", dry: "'{q}' {x}. I'm sure. So sure.", blunt: "'{q}' {x}. I'm sure.",
    goofy: "'{q}' {x}! I'm sure! I'm so sure! I've never been more sure! I'm a little unsure!", shy: "'{q}' {x}. I'm pretty sure.", chill: "'{q}' {x}. I'm sure. So sure.",
    catty: "'{q}' {x}. I'm sure. I'm never wrong.", diva: "'{q}' {x}, darling. I'm certain.", stoic: "'{q}' {x}. Sure." }],
  ['game.team.question.wrong.03', "'{q}' I don't know this. {x}? Please?", {
    hype: "'{q}' I DON'T know this! {x}?! PLEASE?!", dry: "'{q}' I don't know this. {x}. Please.", blunt: "'{q}' Don't know. {x}?",
    goofy: "'{q}' I don't know this! {x}? Please? Pretty please? With sprinkles?", shy: "'{q}' I don't know this. {x}? Please?", chill: "'{q}' Don't know this. {x}? Please?",
    catty: "'{q}' I don't know this. Nobody should know this. {x}?", diva: "'{q}' I don't know this, darling. {x}? Please?", stoic: "'{q}' Don't know. {x}." }],
  ['game.team.question.wrong.05', "'{q}' Uh. {x}?", {
    hype: "'{q}' UH! {x}?!", dry: "'{q}' Uh. {x}.", blunt: "'{q}' {x}?",
    goofy: "'{q}' Uh! Um! {x}? Maybe?", shy: "'{q}' Uh. {x}?", chill: "'{q}' Uh, {x}?",
    catty: "'{q}' Uh. {x}? Fine.", diva: "'{q}' Uh, darling. {x}?", stoic: "'{q}' {x}?" }],
  ['game.team.question.wrong.06', "'{q}' {x}. It's {x}. It has to be.", {
    hype: "'{q}' {x}! It's {x}! It HAS to be!", dry: "'{q}' {x}. It's {x}. It has to be.", blunt: "'{q}' {x}. Has to be.",
    goofy: "'{q}' {x}! It's {x}! It has to be! Please be {x}!", shy: "'{q}' {x}. I think it's {x}. It has to be.", chill: "'{q}' {x}, dude. Has to be.",
    catty: "'{q}' {x}. It's {x}. It has to be.", diva: "'{q}' {x}, darling. It must be.", stoic: "'{q}' {x}. Has to be." }],
  ['game.team.question.wrong.07', "'{q}' I panicked. {x}.", {
    hype: "'{q}' I PANICKED! {x}!", dry: "'{q}' I panicked. {x}.", blunt: "'{q}' Panicked. {x}.",
    goofy: "'{q}' I panicked! {x}! My brain left the building!", shy: "'{q}' I panicked. {x}.", chill: "'{q}' I panicked, man. {x}.",
    catty: "'{q}' I panicked. {x}. It happens to the best of us.", diva: "'{q}' I panicked, darling. {x}.", stoic: "'{q}' Panicked. {x}." }],
  ['game.team.question.wrong.09', "'{q}' Oh, I should know this. {x}?", {
    hype: "'{q}' OH! I SHOULD know this! {x}?!", dry: "'{q}' I should know this. {x}.", blunt: "'{q}' Should know this. {x}?",
    goofy: "'{q}' Oh! I should know this! I knew it yesterday! {x}?", shy: "'{q}' Oh, I should know this. {x}?", chill: "'{q}' Should know this. {x}?",
    catty: "'{q}' I should know this. {x}?", diva: "'{q}' I should know this, darling. {x}?", stoic: "'{q}' Should know. {x}?" }],
  // ── the team trivia: the room while it plays ──────────────────────────
  ['game.team.trash.03', "Captain {b}. My rival for the night.", {
    hype: "Captain {b}! My RIVAL for the night!", dry: "Captain {b}. My rival for the night. How exciting.", blunt: "Captain {b}. My rival tonight.",
    goofy: "Captain {b}! My rival for the night! Dun dun dun!", shy: "Captain {b}. My rival for the night.", chill: "Captain {b}. My rival tonight.",
    catty: "Captain {b}. My rival for the night. Poor {b}.", diva: "Captain {b}, darling. My rival for the evening.", stoic: "Captain {b}. Rival." }],
  ['game.team.banter.01', "Of course {b} knew that. Of course.", {
    hype: "Of COURSE {b} knew that! Of COURSE!", dry: "Of course {b} knew that. Of course.", blunt: "Of course {b} knew.",
    goofy: "Of course {b} knew that! Of course! {b} knows everything! It's annoying!", shy: "Of course {b} knew that.", chill: "Of course {b} knew that.",
    catty: "Of course {b} knew that. Show-off.", diva: "Of course {b} knew, darling. Of course.", stoic: "Of course." }],
  ['game.team.banter.02', "Lucky guess, {b}. That was a lucky guess.", {
    hype: "LUCKY guess, {b}! That was a LUCKY guess!", dry: "Lucky guess, {b}. Very lucky.", blunt: "Lucky guess, {b}.",
    goofy: "Lucky guess, {b}! That was a lucky guess! I'm checking {b}'s pockets for clovers!", shy: "That was a lucky guess, {b}.", chill: "Lucky guess, {b}.",
    catty: "Lucky guess, {b}. That's all it was.", diva: "A lucky guess, {b}, darling.", stoic: "Lucky guess." }],
  ['game.team.banter.03', "Thank you, {b}! Keep missing, {b}!", {
    hype: "THANK YOU, {b}! KEEP MISSING, {b}!", dry: "Thank you, {b}. Keep missing. Please.", blunt: "Thanks, {b}. Keep missing.",
    goofy: "Thank you, {b}! Keep missing, {b}! You're my favorite opponent!", shy: "Thank you, {b}. Keep missing.", chill: "Thanks, {b}! Keep missing, dude!",
    catty: "Thank you, {b}! Keep missing, {b}! You're doing great.", diva: "Thank you, {b}, darling! Keep missing!", stoic: "Thanks, {b}. Keep missing." }],
  ['game.team.banter.04', "Oh no, {b}. Oh no.", {
    hype: "Oh NO, {b}! OH NO!", dry: "Oh no, {b}. Oh no.", blunt: "Oh no, {b}.",
    goofy: "Oh no, {b}! Oh no! Oh no no no!", shy: "Oh no, {b}.", chill: "Oh no, {b}. Oh no.",
    catty: "Oh no, {b}. Oh no. Anyway.", diva: "Oh no, {b}, darling. Oh no.", stoic: "Oh no." }],
  ['game.team.banter.05', "Okay, this is getting close. Too close.", {
    hype: "Okay! This is getting CLOSE! TOO close!", dry: "This is getting close. Too close.", blunt: "Too close.",
    goofy: "Okay! This is getting close! Too close! My nails! I'm chewing my nails!", shy: "Okay. This is getting close. Too close.", chill: "Getting close. Too close.",
    catty: "This is getting close. Too close. Somebody on my team needs to wake up.", diva: "It's getting close, darling. Too close.", stoic: "Close. Too close." }],
  ['game.team.banter.06', "We need this next one. We need it.", {
    hype: "We NEED this next one! We NEED it!", dry: "We need this next one. We need it.", blunt: "Need this one.",
    goofy: "We need this next one! We need it! Come on, brain! Come on!", shy: "We need this next one. We really need it.", chill: "We need this next one.",
    catty: "We need this next one. Don't let me down.", diva: "We need this one, darling. We need it.", stoic: "Need this one." }],
  ['game.team.banter.07', "I knew that one! Why didn't they ask me that one?", {
    hype: "I KNEW that one! WHY didn't they ask ME?!", dry: "I knew that one. Why didn't they ask me.", blunt: "Knew that. Should've asked me.",
    goofy: "I knew that one! Why didn't they ask me? I was waving! Nobody saw!", shy: "I knew that one. I wish they'd asked me.", chill: "I knew that one! Why didn't they ask me?",
    catty: "I knew that one. Why didn't they ask me? Amateurs.", diva: "I knew that one, darling! Why not ask me?", stoic: "Knew that one." }],
  ['game.team.banter.08', "How are they doing this? How?", {
    hype: "HOW are they doing this?! HOW?!", dry: "How are they doing this. How.", blunt: "How are they doing this?",
    goofy: "How are they doing this? How? Do they have a cheat sheet? Is it on their arm?", shy: "How are they doing this?", chill: "How are they doing this, man?",
    catty: "How are they doing this? Somebody's been studying.", diva: "How are they doing this, darling?", stoic: "How?" }],
  ['game.team.banter.09', "That one was mine. That was my question!", {
    hype: "That one was MINE! That was MY question!", dry: "That one was mine. My question.", blunt: "That was my question.",
    goofy: "That one was mine! That was my question! They stole my question!", shy: "That one was mine. That was my question.", chill: "That one was mine, dude! My question!",
    catty: "That one was mine. That was my question. Robbed.", diva: "That was my question, darling! Mine!", stoic: "My question." }],
  ['game.team.banter.10', "They're cheating. They're not cheating. But they might be.", {
    hype: "They're CHEATING! They're NOT cheating! But they MIGHT be!", dry: "They're cheating. They're not. They might be.", blunt: "They might be cheating.",
    goofy: "They're cheating! They're not cheating! But they might be! I'm watching! I can't see them!", shy: "Are they cheating? They're not. They might be.", chill: "They're cheating. Not really. Maybe.",
    catty: "They're cheating. They're not cheating. But they might be. I'd believe it.", diva: "They're cheating, darling! Probably not. But maybe.", stoic: "Cheating? Maybe." }],
  ['game.team.banter.11', "Okay, I'm nervous now.", {
    hype: "Okay! I'm NERVOUS now!", dry: "Okay. Nervous now.", blunt: "I'm nervous now.",
    goofy: "Okay! I'm nervous now! My knee is bouncing! Both knees!", shy: "Okay. I'm nervous now.", chill: "Okay, I'm nervous now.",
    catty: "Okay, I'm nervous now. That's new.", diva: "Okay, darling. Now I'm nervous.", stoic: "Nervous now." }],
  ['game.team.banter.12', "We're still in this. We're still in this!", {
    hype: "We're STILL IN THIS! We're STILL IN THIS!", dry: "We're still in this. Somehow.", blunt: "Still in this.",
    goofy: "We're still in this! We're still in this! Go team! Go us!", shy: "We're still in this. We're still in this.", chill: "Still in this! Still in it!",
    catty: "We're still in this. No thanks to some of you.", diva: "We're still in this, darling!", stoic: "Still in it." }],
  ['game.team.banter.13', "Somebody on my team knows this. Somebody. Please.", {
    hype: "SOMEBODY on my team knows this! SOMEBODY! PLEASE!", dry: "Somebody on my team knows this. Somebody. Please.", blunt: "Someone on my team knows this. Please.",
    goofy: "Somebody on my team knows this! Somebody! Please! Anybody! Hello?", shy: "Somebody on my team knows this. Please.", chill: "Somebody on my team knows this. Please.",
    catty: "Somebody on my team knows this. Somebody. I picked you for a reason.", diva: "Someone on my team knows this, darling. Please.", stoic: "Someone knows this. Please." }],
  ['game.team.result.01', "We won! We won!", {
    hype: "WE WON! WE WON!", dry: "We won. We won. Wow.", blunt: "We won.",
    goofy: "We won! We won! Victory dance! Everybody! Even you!", shy: "We won. We actually won!", chill: "We won! We won!",
    catty: "We won. Of course we won.", diva: "We won, darling! We won!", stoic: "We won." }],
  ['game.team.result.02', "Teamwork makes the dream work!", {
    hype: "TEAMWORK makes the DREAM work!", dry: "Teamwork makes the dream work. I said it. I'm sorry.", blunt: "Teamwork. It works.",
    goofy: "Teamwork makes the dream work! And the dream is snacks!", shy: "Teamwork makes the dream work.", chill: "Teamwork makes the dream work, dude!",
    catty: "Teamwork makes the dream work. My work, mostly.", diva: "Teamwork, darling! The dream works!", stoic: "Teamwork." }],
  ['game.team.result.03', "Winning is so good! Oh my God!", {
    hype: "Winning is SO GOOD! OH MY GOD!", dry: "Winning is good. Oh my God. Very good.", blunt: "Winning is good.",
    goofy: "Winning is so good! Oh my gosh! Better than pancakes! Almost!", shy: "Winning is so good. Oh my gosh.", chill: "Winning is so good! Oh man!",
    catty: "Winning is so good. I could get used to this.", diva: "Winning is divine, darling! Oh my God!", stoic: "Winning is good." }],
  ['game.team.result.04', "That's my team! That's my team!", {
    hype: "That's MY TEAM! That's MY TEAM!", dry: "That's my team. That's my team.", blunt: "My team.",
    goofy: "That's my team! That's my team! I love my team! I love every single one!", shy: "That's my team. That's my team!", chill: "That's my team! My team!",
    catty: "That's my team. I picked them. You're welcome.", diva: "That's my team, darling! My team!", stoic: "My team." }],
];
