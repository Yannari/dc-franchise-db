// Voice versions, batch 5a: the private chats, typed (the morning debrief after a goodbye message, a blocking or the
// Ratings; asking for an alliance). An opener the reply answers, so every version keeps its meaning and a question
// stays a question. Typed the way the voice types (batch4b.js). No brand names anywhere.
export const VOICES = [
  // ── after a goodbye message that named somebody: agreeing with it ─────
  ['chat.debrief.warning.agree.warm.01', "Okay, I'm just going to say it. I think {c} got called out for a reason", {
    hype: "Okay I'm just gonna SAY it!! {c} got called out for a REASON", dry: "ok i'm just going to say it. {c} got called out for a reason", blunt: "{c} got called out for a reason",
    goofy: "Okay I'm just going to say it!! Deep breath. {c} got called out for a reason {e:eyes}", shy: "Okay, I'm just going to say it. I think maybe {c} got called out for a reason", chill: "ok I'm just gonna say it. I think {c} got called out for a reason",
    catty: "Okay, I'll say it. {c} got called out for a reason. Finally someone did", diva: "I'll just say it, darling. {c} was called out for a reason", stoic: "{c} was called out for a reason" }],
  ['chat.debrief.warning.agree.warm.02', "That goodbye made me rethink a few chats I've had with {c}", {
    hype: "That goodbye made me RETHINK a few chats I've had with {c}!!", dry: "that goodbye made me rethink a few chats i've had with {c}. several, actually", blunt: "That goodbye made me rethink {c}",
    goofy: "That goodbye made me rethink a few chats I've had with {c}. I'm rereading them in my head. Dramatically", shy: "That goodbye made me rethink a few chats I've had with {c}", chill: "that goodbye made me rethink a few chats I've had with {c}",
    catty: "That goodbye made me rethink a few chats I've had with {c}. I always had a feeling", diva: "That goodbye made me revisit every scene I've had with {c}, darling", stoic: "Rethinking {c}" }],
  ['chat.debrief.warning.agree.warm.03', "So. That goodbye message about {c}", {
    hype: "SO. That goodbye message about {c}!! {e:eyes}", dry: "so. that goodbye message about {c}", blunt: "That goodbye about {c}",
    goofy: "So. That goodbye message about {c}. I have so many thoughts. Like a popcorn machine {e:eyes}", shy: "So. That goodbye message about {c}...", chill: "so. that goodbye message about {c}",
    catty: "So. That goodbye message about {c}. Delicious", diva: "So, darling. That goodbye about {c}", stoic: "That goodbye. {c}" }],
  ['chat.debrief.warning.agree.warm.04', "Do you believe what {c} got called in that video?", {
    hype: "Do you BELIEVE what {c} got called in that video??", dry: "do you believe what {c} got called in that video", blunt: "Do you believe what that video said about {c}?",
    goofy: "Do you believe what {c} got called in that video?? My jaw is still on the floor", shy: "Do you believe what {c} got called in that video?", chill: "do you believe what {c} got called in that video?",
    catty: "Do you believe what {c} got called in that video? Because I do", diva: "Do you believe what that video called {c}, darling?", stoic: "Believe what it said about {c}?" }],
  ['chat.debrief.warning.agree.warm.05', "Okay be honest. What did you think when {c} came up in that video?", {
    hype: "Okay be HONEST!! What did you think when {c} came up in that video??", dry: "ok be honest. what did you think when {c} came up in that video", blunt: "Honest. What did you think when {c} came up?",
    goofy: "Okay be honest!! What did you think when {c} came up in that video? I gasped. Out loud. At a wall", shy: "Okay, be honest. What did you think when {c} came up in that video?", chill: "ok be honest. what'd you think when {c} came up in that video?",
    catty: "Be honest. What did you think when {c} came up in that video? I know what I thought", diva: "Be honest, darling. What did you think when {c} came up?", stoic: "When {c} came up. Thoughts?" }],
  ['chat.debrief.warning.agree.warm.06', "Goodbye messages don't lie. Somebody's last chance to warn us went to {c}", {
    hype: "Goodbye messages DON'T LIE!! Somebody's LAST chance to warn us went to {c}", dry: "goodbye messages don't lie. somebody's last chance to warn us went to {c}. that means something", blunt: "Goodbyes don't lie. The last warning was {c}",
    goofy: "Goodbye messages don't lie!! Somebody's last chance to warn us went to {c}. That's like a message in a bottle", shy: "Goodbye messages don't lie. That was a last word, and it was a warning about {c}", chill: "goodbye messages don't lie. somebody's last warning went to {c}",
    catty: "Goodbye messages don't lie. Somebody's last chance to warn us went to {c}. Telling", diva: "Goodbyes don't lie, darling. The final warning went to {c}", stoic: "Goodbyes don't lie. {c}" }],
  ['chat.debrief.warning.agree.warm.07', "That video was a wake-up call about {c}", {
    hype: "That video was a WAKE-UP CALL about {c}!!", dry: "that video was a wake-up call about {c}. i was already awake", blunt: "That video was a wake-up call on {c}",
    goofy: "That video was a wake-up call about {c}!! Like an alarm clock. A loud one", shy: "That video was kind of a wake-up call about {c}", chill: "that video was a wake-up call about {c}",
    catty: "That video was a wake-up call about {c}. For some of us. I was already up", diva: "That video was a wake-up call about {c}, darling", stoic: "Wake-up call on {c}" }],
  ['chat.debrief.warning.agree.cold.01', "That goodbye made a lot of sense about {c}, didn't it?", {
    hype: "That goodbye made a LOT of sense about {c}, didn't it??", dry: "that goodbye made a lot of sense about {c}. didn't it", blunt: "That goodbye made sense about {c}, right?",
    goofy: "That goodbye made a lot of sense about {c}, didn't it? Like a puzzle clicking together", shy: "That goodbye kind of made sense about {c}, didn't it?", chill: "that goodbye made a lot of sense about {c}, didn't it?",
    catty: "That goodbye made a lot of sense about {c}, didn't it? More than {c} would like", diva: "That goodbye made rather a lot of sense about {c}, didn't it, darling?", stoic: "Made sense about {c}?" }],
  ['chat.debrief.warning.agree.cold.02', "So we all agree {c} is a catfish now, right?", {
    hype: "So we ALL agree {c} is a CATFISH now, right??", dry: "so we all agree {c} is a catfish now. right", blunt: "We agree {c} is a catfish?",
    goofy: "So we all agree {c} is a catfish now, right? Glub glub {e:eyes}", shy: "So do we all agree {c} is a catfish now?", chill: "so we all agree {c}'s a catfish now, right?",
    catty: "So we all agree {c} is a catfish now, right? Some of us knew already", diva: "So we're all agreed {c} is a catfish, darling?", stoic: "{c}. Catfish. Agreed?" }],
  ['chat.debrief.warning.agree.cold.03', "Kind of feels like that video exposed {c}", {
    hype: "Kind of FEELS like that video EXPOSED {c}!!", dry: "kind of feels like that video exposed {c}", blunt: "That video exposed {c}",
    goofy: "Kind of feels like that video exposed {c}. Like turning on the kitchen light at night", shy: "It kind of feels like that video exposed {c}", chill: "kinda feels like that video exposed {c}",
    catty: "Kind of feels like that video exposed {c}. Took long enough", diva: "That video rather exposed {c}, darling", stoic: "That video exposed {c}" }],
  ['chat.debrief.warning.agree.cold.04', "I'm keeping my distance from {c} after that message", {
    hype: "I'm KEEPING MY DISTANCE from {c} after that message!!", dry: "keeping my distance from {c} after that message. a lot of distance", blunt: "Keeping my distance from {c}",
    goofy: "I'm keeping my distance from {c} after that message. Like, ten couches of distance", shy: "I think I'm going to keep my distance from {c} after that message", chill: "keeping my distance from {c} after that message",
    catty: "I'm keeping my distance from {c} after that message. Wise people will too", diva: "I'm keeping my distance from {c} after that, darling", stoic: "Distance from {c}" }],
  ['chat.debrief.warning.agree.cold.05', "Did that goodbye change how you see {c}?", {
    hype: "Did that goodbye CHANGE how you see {c}??", dry: "did that goodbye change how you see {c}", blunt: "That goodbye change how you see {c}?",
    goofy: "Did that goodbye change how you see {c}? Like new glasses?", shy: "Did that goodbye change how you see {c}?", chill: "did that goodbye change how you see {c}?",
    catty: "Did that goodbye change how you see {c}? It should", diva: "Did that goodbye change how you see {c}, darling?", stoic: "Changed how you see {c}?" }],
  // ── doubting it ───────────────────────────────────────────────────────
  ['chat.debrief.warning.doubt.warm.01', "I really hope people don't freeze out {c} after that video", {
    hype: "I REALLY hope people don't freeze out {c} after that video!!", dry: "i really hope people don't freeze out {c} after that video. they will, but i hope not", blunt: "I hope nobody freezes out {c}",
    goofy: "I really hope people don't freeze out {c} after that video. {c} is not a popsicle", shy: "I really hope people don't freeze out {c} after that video", chill: "really hope people don't freeze out {c} after that video",
    catty: "I really hope people don't freeze out {c} after that video. Sheep, the lot of them", diva: "I do hope they don't freeze out {c} after that video, darling", stoic: "Don't freeze out {c}" }],
  ['chat.debrief.warning.doubt.warm.02', "Can we talk about how unfair that goodbye was to {c}?", {
    hype: "Can we TALK about how UNFAIR that goodbye was to {c}??", dry: "can we talk about how unfair that goodbye was to {c}", blunt: "That goodbye was unfair to {c}. Agree?",
    goofy: "Can we talk about how unfair that goodbye was to {c}? I'm grumpy about it. Grrr", shy: "Can we talk about how unfair that goodbye was to {c}?", chill: "can we talk about how unfair that goodbye was to {c}?",
    catty: "Can we talk about how unfair that goodbye was to {c}? Petty, honestly", diva: "Can we discuss how unfair that goodbye was to {c}, darling?", stoic: "That goodbye was unfair to {c}" }],
  ['chat.debrief.warning.doubt.warm.03', "Honestly that message about {c} felt like sour grapes", {
    hype: "Honestly that message about {c} felt like SOUR GRAPES!!", dry: "honestly that message about {c} felt like sour grapes", blunt: "That message about {c} was sour grapes",
    goofy: "Honestly that message about {c} felt like sour grapes. Very sour. Lemon grapes", shy: "Honestly, that message about {c} felt a bit like sour grapes", chill: "honestly that message about {c} felt like sour grapes",
    catty: "Honestly that message about {c} was pure sour grapes. Bitter exit", diva: "That message about {c} was sour grapes, darling", stoic: "Sour grapes" }],
  ['chat.debrief.warning.doubt.warm.04', "I don't buy that goodbye message at all", {
    hype: "I do NOT buy that goodbye message AT ALL!!", dry: "i don't buy that goodbye message at all. not even on sale", blunt: "I don't buy that goodbye",
    goofy: "I don't buy that goodbye message at all!! Not for a dollar. Not for a cookie", shy: "I don't really buy that goodbye message", chill: "don't buy that goodbye message at all",
    catty: "I don't buy that goodbye message at all. Desperate", diva: "I don't believe a word of that goodbye, darling", stoic: "Don't buy it" }],
  ['chat.debrief.warning.doubt.warm.05', "Is it just me or was that goodbye a little petty?", {
    hype: "Is it just ME or was that goodbye a LITTLE petty??", dry: "is it just me or was that goodbye a little petty", blunt: "That goodbye was petty, right?",
    goofy: "Is it just me or was that goodbye a little petty? Like a toddler who lost at cards", shy: "Is it just me, or was that goodbye a little petty?", chill: "is it just me or was that goodbye kinda petty?",
    catty: "Is it just me or was that goodbye a little petty? Very petty", diva: "Is it just me, darling, or was that goodbye petty?", stoic: "Petty goodbye?" }],
  ['chat.debrief.warning.doubt.warm.06', "I've talked to {c} every day. That's not a catfish", {
    hype: "I've talked to {c} EVERY DAY!! That's NOT a catfish", dry: "i've talked to {c} every day. that's not a catfish", blunt: "I talk to {c} daily. Not a catfish",
    goofy: "I've talked to {c} every day!! That's not a catfish. That's a person. I checked", shy: "I've talked to {c} every day. I really don't think that's a catfish", chill: "I've talked to {c} every day. that's not a catfish",
    catty: "I've talked to {c} every day. That's not a catfish. I'd know", diva: "I've spoken to {c} every day, darling. That's no catfish", stoic: "I talk to {c} daily. Real" }],
  ['chat.debrief.warning.doubt.cold.01', "I feel bad for {c} after that goodbye", {
    hype: "I feel SO bad for {c} after that goodbye!!", dry: "i feel bad for {c} after that goodbye", blunt: "Feel bad for {c}",
    goofy: "I feel bad for {c} after that goodbye. Somebody send {c} a hug. A big one", shy: "I feel bad for {c} after that goodbye", chill: "feel bad for {c} after that goodbye",
    catty: "I feel bad for {c} after that goodbye. A little", diva: "I feel terrible for {c} after that goodbye, darling", stoic: "Bad for {c}" }],
  ['chat.debrief.warning.doubt.cold.02', "That goodbye about {c} was so unfair, right?", {
    hype: "That goodbye about {c} was SO unfair, right??", dry: "that goodbye about {c} was unfair. right", blunt: "That goodbye was unfair to {c}, right?",
    goofy: "That goodbye about {c} was so unfair, right? Like cutting in line", shy: "That goodbye about {c} was really unfair, right?", chill: "that goodbye about {c} was so unfair, right?",
    catty: "That goodbye about {c} was so unfair, right? Sore loser", diva: "That goodbye about {c} was terribly unfair, wasn't it, darling?", stoic: "Unfair to {c}?" }],
  ['chat.debrief.warning.doubt.cold.03', "I really don't think {c} is a catfish", {
    hype: "I REALLY don't think {c} is a catfish!!", dry: "i really don't think {c} is a catfish", blunt: "{c} isn't a catfish",
    goofy: "I really don't think {c} is a catfish!! {c} is barely even a goldfish", shy: "I really don't think {c} is a catfish", chill: "really don't think {c}'s a catfish",
    catty: "I really don't think {c} is a catfish. {c} isn't clever enough", diva: "I truly don't believe {c} is a catfish, darling", stoic: "{c} isn't a catfish" }],
  ['chat.debrief.warning.doubt.cold.04', "Let's not turn on {c} because of one video", {
    hype: "Let's NOT turn on {c} because of ONE video!!", dry: "let's not turn on {c} because of one video. one", blunt: "Don't turn on {c} over one video",
    goofy: "Let's not turn on {c} because of one video!! One video! It wasn't even a long one", shy: "Let's not turn on {c} because of one video", chill: "let's not turn on {c} because of one video",
    catty: "Let's not turn on {c} because of one video. Let's at least wait for proof", diva: "Let's not turn on {c} over one video, darling", stoic: "Not over one video" }],
  ['chat.debrief.warning.doubt.cold.05', "I'm defending {c} on this one", {
    hype: "I'm DEFENDING {c} on this one!!", dry: "i'm defending {c} on this one. don't get used to it", blunt: "I'm defending {c}",
    goofy: "I'm defending {c} on this one!! I'm a lawyer now. A pretend one", shy: "I'm going to defend {c} on this one", chill: "I'm defending {c} on this one",
    catty: "I'm defending {c} on this one. Somebody has to", diva: "I'm defending {c} on this one, darling", stoic: "Defending {c}" }],
  ['chat.debrief.warning.neutral.01', "Thoughts on the {c} part of that goodbye?", {
    hype: "THOUGHTS on the {c} part of that goodbye?? {e:eyes}", dry: "thoughts on the {c} part of that goodbye", blunt: "Thoughts on the {c} part?",
    goofy: "Thoughts on the {c} part of that goodbye? I have like nine {e:eyes}", shy: "What are your thoughts on the {c} part of that goodbye?", chill: "thoughts on the {c} part of that goodbye?",
    catty: "Thoughts on the {c} part of that goodbye? I have several", diva: "Thoughts on the {c} part of that goodbye, darling?", stoic: "The {c} part. Thoughts?" }],
  ['chat.debrief.warning.neutral.02', "That video. {c}. Discuss {e:eyes}", {
    hype: "That VIDEO. {c}. DISCUSS!! {e:eyes} {e:eyes}", dry: "that video. {c}. discuss", blunt: "That video. {c}. Go",
    goofy: "That video. {c}. Discuss {e:eyes} I brought snacks", shy: "That video. {c}. Can we discuss? {e:eyes}", chill: "that video. {c}. discuss {e:eyes}",
    catty: "That video. {c}. Discuss {e:side}", diva: "That video, darling. {c}. Discuss {e:eyes}", stoic: "That video. {c}" }],
  ['chat.debrief.warning.neutral.03', "Are you gonna treat {c} any different after that?", {
    hype: "Are you gonna treat {c} any DIFFERENT after that??", dry: "are you going to treat {c} any different after that", blunt: "Treating {c} different now?",
    goofy: "Are you gonna treat {c} any different after that? Like with oven mitts?", shy: "Are you going to treat {c} any differently after that?", chill: "you gonna treat {c} any different after that?",
    catty: "Are you going to treat {c} any differently after that? I am", diva: "Will you treat {c} differently now, darling?", stoic: "Treating {c} differently?" }],
  ['chat.debrief.warning.neutral.04', "Do you think there was anything to what was said about {c}?", {
    hype: "Do you think there was ANYTHING to what was said about {c}??", dry: "do you think there was anything to what was said about {c}", blunt: "Anything to what was said about {c}?",
    goofy: "Do you think there was anything to what was said about {c}? Anything at all? A crumb?", shy: "Do you think there was anything to what was said about {c}?", chill: "think there was anything to what was said about {c}?",
    catty: "Do you think there was anything to what was said about {c}? Because I do", diva: "Is there any truth to what was said about {c}, darling?", stoic: "Truth to it about {c}?" }],
  // ── after a blocking ──────────────────────────────────────────────────
  ['chat.debrief.blocked.warm.01', "I can't believe {c} is gone", {
    hype: "I CAN'T BELIEVE {c} is gone!!", dry: "i can't believe {c} is gone", blunt: "{c}'s gone. Can't believe it",
    goofy: "I can't believe {c} is gone!! It's like losing a sock in the dryer", shy: "I can't believe {c} is gone", chill: "can't believe {c}'s gone",
    catty: "I can't believe {c} is gone. Actually, I can", diva: "I can't believe {c} is gone, darling", stoic: "{c}'s gone" }],
  ['chat.debrief.blocked.warm.02', "That blocking hurt. {c} didn't deserve that", {
    hype: "That blocking HURT!! {c} did NOT deserve that", dry: "that blocking hurt. {c} didn't deserve that", blunt: "That hurt. {c} didn't deserve it",
    goofy: "That blocking hurt!! {c} didn't deserve that. Ouch. My heart has a bruise", shy: "That blocking hurt. {c} didn't deserve that", chill: "that blocking hurt. {c} didn't deserve that",
    catty: "That blocking hurt. {c} didn't deserve that. Somebody did, though", diva: "That blocking wounded me, darling. {c} didn't deserve it", stoic: "{c} didn't deserve that" }],
  ['chat.debrief.blocked.warm.03', "Okay real talk. Why do you think it was {c}?", {
    hype: "Okay REAL TALK!! Why do you think it was {c}??", dry: "ok real talk. why do you think it was {c}", blunt: "Why {c}?",
    goofy: "Okay real talk!! Why do you think it was {c}? I've got theories. Bad ones", shy: "Okay, real talk. Why do you think it was {c}?", chill: "ok real talk. why do you think it was {c}?",
    catty: "Okay real talk. Why do you think it was {c}? I have a guess", diva: "Real talk, darling. Why do you think it was {c}?", stoic: "Why {c}?" }],
  ['chat.debrief.blocked.warm.04', "We need to remember who had the power last night", {
    hype: "We NEED to remember who had the POWER last night!!", dry: "we need to remember who had the power last night. i'm writing it down", blunt: "Remember who had the power last night",
    goofy: "We need to remember who had the power last night!! Tie a string on your finger", shy: "I think we need to remember who had the power last night", chill: "we gotta remember who had the power last night",
    catty: "We need to remember who had the power last night. I won't forget", diva: "We must remember who held the power last night, darling", stoic: "Remember who had power" }],
  ['chat.debrief.blocked.warm.05', "I miss {c} already. Is that crazy? We never even met", {
    hype: "I MISS {c} already!! Is that CRAZY?? We never even MET", dry: "i miss {c} already. is that crazy. we never even met", blunt: "Miss {c}. Never even met",
    goofy: "I miss {c} already!! Is that crazy? We never even met! I miss a profile picture", shy: "I miss {c} already. Is that crazy? We never even met", chill: "miss {c} already. is that crazy? we never even met",
    catty: "I miss {c} already. Is that crazy? We never even met. Don't tell anyone", diva: "I miss {c} already, darling. We never met, and still", stoic: "Miss {c}. Never met" }],
  ['chat.debrief.blocked.neutral.01', "Crazy morning huh. {c}, gone", {
    hype: "CRAZY morning huh!! {c}, GONE", dry: "crazy morning huh. {c}. gone", blunt: "Crazy morning. {c} gone",
    goofy: "Crazy morning huh. {c}, gone. Poof. Like a magician's assistant", shy: "Crazy morning, huh. {c}, gone", chill: "crazy morning huh. {c}, gone",
    catty: "Crazy morning huh. {c}, gone. Didn't see that coming. Did you?", diva: "What a morning, darling. {c}, gone", stoic: "{c}. Gone" }],
  ['chat.debrief.blocked.neutral.02', "Did you see {c} getting blocked coming?", {
    hype: "Did you SEE {c} getting blocked COMING??", dry: "did you see {c} getting blocked coming", blunt: "See {c}'s blocking coming?",
    goofy: "Did you see {c} getting blocked coming? I didn't. I never see anything coming", shy: "Did you see {c} getting blocked coming?", chill: "did you see {c} getting blocked coming?",
    catty: "Did you see {c} getting blocked coming? I did", diva: "Did you see {c}'s blocking coming, darling?", stoic: "See it coming?" }],
  ['chat.debrief.blocked.neutral.03', "So who do you think is next after {c}?", {
    hype: "So WHO do you think is NEXT after {c}??", dry: "so who do you think is next after {c}", blunt: "Who's next after {c}?",
    goofy: "So who do you think is next after {c}? Not me. Please not me", shy: "So who do you think is next after {c}?", chill: "so who's next after {c}, you think?",
    catty: "So who do you think is next after {c}? I have a list", diva: "Who's next after {c}, darling?", stoic: "Who's next?" }],
  ['chat.debrief.blocked.neutral.04', "Weird energy in here without {c}", {
    hype: "WEIRD energy in here without {c}!!", dry: "weird energy in here without {c}", blunt: "Weird without {c}",
    goofy: "Weird energy in here without {c}. Like a party with no cake", shy: "It's weird in here without {c}", chill: "weird energy in here without {c}",
    catty: "Weird energy in here without {c}. Quieter, at least", diva: "Strange energy without {c}, darling", stoic: "Weird without {c}" }],
  ['chat.debrief.blocked.cold.01', "Still can't believe they blocked {c}", {
    hype: "STILL can't believe they blocked {c}!!", dry: "still can't believe they blocked {c}", blunt: "Can't believe they blocked {c}",
    goofy: "Still can't believe they blocked {c}!! I'm still blinking about it", shy: "I still can't believe they blocked {c}", chill: "still can't believe they blocked {c}",
    catty: "Still can't believe they blocked {c}. Bold move", diva: "I still can't believe they blocked {c}, darling", stoic: "They blocked {c}" }],
  ['chat.debrief.blocked.cold.02', "We lost a good one this morning", {
    hype: "We lost a GOOD ONE this morning!!", dry: "we lost a good one this morning", blunt: "Lost a good one",
    goofy: "We lost a good one this morning. A really good one. The best one, maybe", shy: "We lost a good one this morning", chill: "lost a good one this morning",
    catty: "We lost a good one this morning. One of the few", diva: "We lost a good one this morning, darling", stoic: "Lost a good one" }],
  ['chat.debrief.blocked.cold.03', "How are you feeling about {c} going home?", {
    hype: "How are you FEELING about {c} going home??", dry: "how are you feeling about {c} going home", blunt: "How do you feel about {c} going?",
    goofy: "How are you feeling about {c} going home? I'm feeling a lot. Mostly snacky", shy: "How are you feeling about {c} going home?", chill: "how you feeling about {c} going home?",
    catty: "How are you feeling about {c} going home? Honestly", diva: "How do you feel about {c} going home, darling?", stoic: "{c} going home. How are you?" }],
  ['chat.debrief.blocked.cold.04', "{c} was my friend in here, so this one hurts", {
    hype: "{c} was my FRIEND in here, so this one HURTS!!", dry: "{c} was my friend in here. so this one hurts", blunt: "{c} was my friend. This hurts",
    goofy: "{c} was my friend in here, so this one hurts. Like stubbing my toe on my heart", shy: "{c} was my friend in here, so this one really hurts", chill: "{c} was my friend in here, so this one hurts",
    catty: "{c} was my friend in here, so this one hurts. And I'll remember who did it", diva: "{c} was my friend, darling. This one hurts", stoic: "{c} was my friend. It hurts" }],
  // ── after the Ratings ─────────────────────────────────────────────────
  ['chat.debrief.ratings.warm.01', "Can we talk about {c} being first?", {
    hype: "Can we TALK about {c} being FIRST??", dry: "can we talk about {c} being first", blunt: "Let's talk about {c} being first",
    goofy: "Can we talk about {c} being first? First! Like a gold medal!", shy: "Can we talk about {c} being first?", chill: "can we talk about {c} being first?",
    catty: "Can we talk about {c} being first? Because I have questions", diva: "Can we discuss {c} being first, darling?", stoic: "{c} first. Talk?" }],
  ['chat.debrief.ratings.warm.02', "{c} came first last night. Did that surprise you?", {
    hype: "{c} came FIRST last night!! Did that SURPRISE you??", dry: "{c} came first last night. did that surprise you", blunt: "{c} first. Surprised?",
    goofy: "{c} came first last night!! Did that surprise you? I did a double take. A triple take", shy: "{c} came first last night. Did that surprise you?", chill: "{c} came first last night. did that surprise you?",
    catty: "{c} came first last night. Did that surprise you? It surprised me", diva: "{c} came first last night, darling. Surprised?", stoic: "{c} first. Surprised?" }],
  ['chat.debrief.ratings.warm.03', "Being first in this game is a target, right?", {
    hype: "Being FIRST in this game is a TARGET, right??", dry: "being first in this game is a target. right", blunt: "First is a target, right?",
    goofy: "Being first in this game is a target, right? Like a big bullseye with a crown on it", shy: "Being first in this game is kind of a target, right?", chill: "being first in this game is a target, right?",
    catty: "Being first in this game is a target, right? Good to know", diva: "Being first is a target, isn't it, darling?", stoic: "First is a target?" }],
  ['chat.debrief.ratings.warm.04', "Okay so how is {c} first? What am I missing?", {
    hype: "Okay so HOW is {c} FIRST?? What am I MISSING??", dry: "ok so how is {c} first. what am i missing", blunt: "How is {c} first?",
    goofy: "Okay so how is {c} first? What am I missing? Did I fall asleep for a week?", shy: "Okay, so how is {c} first? What am I missing?", chill: "ok so how's {c} first? what am I missing?",
    catty: "Okay so how is {c} first? What am I missing? Honestly", diva: "How is {c} first, darling? What have I missed?", stoic: "How is {c} first?" }],
  ['chat.debrief.ratings.neutral.01', "{c} first, huh?", {
    hype: "{c} FIRST, huh??", dry: "{c} first, huh", blunt: "{c} first",
    goofy: "{c} first, huh? Who saw that coming? Not me", shy: "{c} first, huh?", chill: "{c} first, huh?",
    catty: "{c} first, huh? Interesting", diva: "{c} first, darling?", stoic: "{c} first" }],
  ['chat.debrief.ratings.neutral.02', "What did you think of the ratings last night?", {
    hype: "What did you THINK of the ratings last night??", dry: "what did you think of the ratings last night", blunt: "Thoughts on the ratings?",
    goofy: "What did you think of the ratings last night? I'm still recovering", shy: "What did you think of the ratings last night?", chill: "what'd you think of the ratings last night?",
    catty: "What did you think of the ratings last night? Some surprises", diva: "What did you think of last night's ratings, darling?", stoic: "The ratings. Thoughts?" }],
  ['chat.debrief.ratings.neutral.03', "Does {c} being first worry you at all?", {
    hype: "Does {c} being FIRST worry you at ALL??", dry: "does {c} being first worry you at all", blunt: "{c} first worry you?",
    goofy: "Does {c} being first worry you at all? It worries my tummy", shy: "Does {c} being first worry you at all?", chill: "does {c} being first worry you at all?",
    catty: "Does {c} being first worry you at all? It should", diva: "Does {c} being first worry you, darling?", stoic: "{c} first. Worried?" }],
  ['chat.debrief.ratings.neutral.04', "Where did you end up last night? I was in the middle", {
    hype: "Where did you END UP last night?? I was in the MIDDLE", dry: "where did you end up last night. i was in the middle. as usual", blunt: "Where'd you end up? I was middle",
    goofy: "Where did you end up last night? I was in the middle. Like the cream in a cookie", shy: "Where did you end up last night? I was in the middle", chill: "where'd you end up last night? I was in the middle",
    catty: "Where did you end up last night? I was in the middle. For now", diva: "Where did you land last night, darling? I was in the middle", stoic: "Where'd you place? Middle for me" }],
  ['chat.debrief.ratings.cold.01', "{c} first again. Kind of suspicious, no?", {
    hype: "{c} first AGAIN!! Kind of SUSPICIOUS, no??", dry: "{c} first again. kind of suspicious. no", blunt: "{c} first again. Suspicious?",
    goofy: "{c} first again. Kind of suspicious, no? I'm squinting {e:eyes}", shy: "{c} first again. Kind of suspicious, isn't it?", chill: "{c} first again. kinda suspicious, no?",
    catty: "{c} first again. Kind of suspicious, no? {e:side}", diva: "{c} first again, darling. Rather suspicious, no?", stoic: "{c} first again. Suspicious" }],
  ['chat.debrief.ratings.cold.02', "Somebody needs to slow {c} down", {
    hype: "SOMEBODY needs to SLOW {c} DOWN!!", dry: "somebody needs to slow {c} down", blunt: "Someone needs to slow {c} down",
    goofy: "Somebody needs to slow {c} down!! Put a speed bump in front of {c}", shy: "Somebody probably needs to slow {c} down", chill: "somebody needs to slow {c} down",
    catty: "Somebody needs to slow {c} down. Might as well be us", diva: "Someone must slow {c} down, darling", stoic: "Slow {c} down" }],
  ['chat.debrief.ratings.cold.03', "Don't you think {c} has too many friends in here?", {
    hype: "Don't you think {c} has TOO MANY friends in here??", dry: "don't you think {c} has too many friends in here", blunt: "{c} has too many friends, right?",
    goofy: "Don't you think {c} has too many friends in here? Like a dog at a park", shy: "Don't you think {c} has a lot of friends in here?", chill: "don't you think {c} has too many friends in here?",
    catty: "Don't you think {c} has too many friends in here? Suspiciously many", diva: "Doesn't {c} have rather too many friends, darling?", stoic: "{c}. Too many friends?" }],
  ['chat.debrief.ratings.cold.04', "Not to be shady but how is {c} number one?", {
    hype: "Not to be SHADY but HOW is {c} number one??", dry: "not to be shady but how is {c} number one", blunt: "How is {c} number one?",
    goofy: "Not to be shady but how is {c} number one? I'm a sunny person. But how?", shy: "Not to be shady, but how is {c} number one?", chill: "not to be shady but how's {c} number one?",
    catty: "Not to be shady but how is {c} number one? Okay, a little shady {e:side}", diva: "Not to be shady, darling, but how is {c} number one?", stoic: "How is {c} number one?" }],
  // ── asking for an alliance ────────────────────────────────────────────
  ['chat.ally.warm.01', "I'm gonna be real with you. I trust you, and I don't trust a lot of people in here", {
    hype: "I'm gonna be REAL with you!! I TRUST you, and I don't trust a LOT of people in here", dry: "i'm going to be real with you. i trust you. i don't trust a lot of people in here", blunt: "I trust you. I don't trust many in here",
    goofy: "I'm gonna be real with you!! I trust you. I don't trust a lot of people in here. I don't even trust my toaster", shy: "I'm going to be real with you. I trust you, and I don't trust a lot of people in here", chill: "gonna be real with you. I trust you, and I don't trust a lot of people in here",
    catty: "I'm going to be real with you. I trust you. I don't trust anyone else in here", diva: "Let me be real with you, darling. I trust you. Few others", stoic: "I trust you. Few others" }],
  ['chat.ally.warm.02', "Can I be honest? I think we'd be really strong together in this game", {
    hype: "Can I be HONEST?? I think we'd be REALLY strong together in this game {e:muscle}", dry: "can i be honest. i think we'd be really strong together in this game", blunt: "We'd be strong together",
    goofy: "Can I be honest? I think we'd be really strong together in this game. Like peanut butter and jelly", shy: "Can I be honest? I think we'd be really strong together in this game", chill: "can I be honest? I think we'd be really strong together in this game",
    catty: "Can I be honest? We'd be really strong together in this game. Stronger than all of them", diva: "May I be honest, darling? We'd be formidable together", stoic: "We'd be strong together" }],
  ['chat.ally.warm.03', "Okay I think it's time. You and me, officially {e:crown}", {
    hype: "Okay I think it's TIME!! You and me, OFFICIALLY {e:crown} {e:fire}", dry: "ok i think it's time. you and me. officially", blunt: "It's time. You and me. Officially",
    goofy: "Okay I think it's time!! You and me, officially {e:crown} I'll get us matching friendship bracelets", shy: "Okay, I think it's time. You and me, officially? {e:crown}", chill: "ok I think it's time. you and me, officially {e:crown}",
    catty: "Okay I think it's time. You and me, officially. The rest can watch {e:crown}", diva: "It's time, darling. You and me, officially {e:crown}", stoic: "It's time. Us. Officially" }],
  ['chat.ally.warm.04', "I need to know who's actually in my corner in here. Are you?", {
    hype: "I NEED to know who's ACTUALLY in my corner in here!! Are YOU??", dry: "i need to know who's actually in my corner in here. are you", blunt: "Are you in my corner?",
    goofy: "I need to know who's actually in my corner in here!! My corner is very cozy. Are you in it?", shy: "I need to know who's actually in my corner in here. Are you?", chill: "need to know who's actually in my corner in here. are you?",
    catty: "I need to know who's actually in my corner in here. Are you? Think carefully", diva: "I need to know who's truly in my corner, darling. Are you?", stoic: "Are you in my corner?" }],
  ['chat.ally.warm.w01', "Real question. If it comes down to it, are you with me?", {
    hype: "REAL QUESTION!! If it comes down to it, are you WITH me??", dry: "real question. if it comes down to it, are you with me", blunt: "If it comes down to it, you with me?",
    goofy: "Real question!! If it comes down to it, are you with me? Like a sidekick? A cool sidekick?", shy: "Real question. If it comes down to it, are you with me?", chill: "real question. if it comes down to it, you with me?",
    catty: "Real question. If it comes down to it, are you with me? Don't lie", diva: "A real question, darling. When it comes down to it, are you with me?", stoic: "When it counts, with me?" }],
  ['chat.ally.warm.w02', "I don't want to just be friends in here. I want us to be a team", {
    hype: "I don't want to JUST be friends in here!! I want us to be a TEAM {e:muscle}", dry: "i don't want to just be friends in here. i want us to be a team", blunt: "Not just friends. A team",
    goofy: "I don't want to just be friends in here!! I want us to be a team. With a mascot", shy: "I don't want to just be friends in here. I'd like us to be a team", chill: "don't wanna just be friends in here. want us to be a team",
    catty: "I don't want to just be friends in here. Friends get blocked. Teams don't", diva: "Not merely friends, darling. A team", stoic: "Not friends. A team" }],
  ['chat.ally.warm.w03', "I trust you more than anybody in here. Is that crazy?", {
    hype: "I trust you MORE than ANYBODY in here!! Is that CRAZY??", dry: "i trust you more than anybody in here. is that crazy", blunt: "I trust you most. Crazy?",
    goofy: "I trust you more than anybody in here!! Is that crazy? I'm a little crazy. But is that?", shy: "I trust you more than anybody in here. Is that crazy?", chill: "I trust you more than anybody in here. is that crazy?",
    catty: "I trust you more than anybody in here. Is that crazy? Don't make it crazy", diva: "I trust you above everyone, darling. Is that mad?", stoic: "I trust you most. Crazy?" }],
  ['chat.ally.warm.w04', "People are starting to pick sides. I want to be on yours", {
    hype: "People are starting to PICK SIDES!! I want to be on YOURS", dry: "people are starting to pick sides. i want to be on yours", blunt: "People are picking sides. I want yours",
    goofy: "People are starting to pick sides!! I want to be on yours. It looks like the fun side", shy: "People are starting to pick sides. I'd like to be on yours", chill: "people are starting to pick sides. want to be on yours",
    catty: "People are starting to pick sides. I want to be on yours. It's the winning one", diva: "Sides are being chosen, darling. I choose yours", stoic: "Sides forming. Yours" }],
  ['chat.ally.warm.w05', "If one of us gets power, we keep the other one safe. Yes?", {
    hype: "If ONE of us gets power, we keep the OTHER one safe!! YES??", dry: "if one of us gets power, we keep the other one safe. yes", blunt: "One of us gets power, the other's safe. Yes?",
    goofy: "If one of us gets power, we keep the other one safe!! Yes? Pinky promise?", shy: "If one of us gets power, we keep the other one safe. Yes?", chill: "if one of us gets power, we keep the other safe. yes?",
    catty: "If one of us gets power, we keep the other one safe. Yes? I mean it", diva: "If one of us takes power, darling, the other is safe. Yes?", stoic: "Power means the other's safe. Yes?" }],
  ['chat.ally.warm.w06', "I think we should have each other's backs. Officially", {
    hype: "I think we should have each other's BACKS!! OFFICIALLY {e:handshake}", dry: "i think we should have each other's backs. officially", blunt: "Each other's backs. Officially",
    goofy: "I think we should have each other's backs!! Officially. With a handshake. A secret one {e:handshake}", shy: "I think we should have each other's backs. Officially?", chill: "think we should have each other's backs. officially",
    catty: "I think we should have each other's backs. Officially. Nobody else will", diva: "Let's have each other's backs, darling. Officially {e:handshake}", stoic: "Each other's backs. Official" }],
  ['chat.ally.neutral.01', "I think we should work together in this game. What do you think?", {
    hype: "I think we should WORK TOGETHER in this game!! What do you THINK??", dry: "i think we should work together in this game. what do you think", blunt: "We should work together. Thoughts?",
    goofy: "I think we should work together in this game!! What do you think? Say yes. Or think about it. Then say yes", shy: "I think maybe we should work together in this game. What do you think?", chill: "think we should work together in this game. what do you think?",
    catty: "I think we should work together in this game. What do you think? Choose wisely", diva: "I think we should join forces, darling. What do you think?", stoic: "Work together?" }],
  ['chat.ally.neutral.02', "If you ever need someone in your corner, I'm here", {
    hype: "If you EVER need someone in your corner, I'm HERE!!", dry: "if you ever need someone in your corner, i'm here. lurking", blunt: "Need someone in your corner, I'm here",
    goofy: "If you ever need someone in your corner, I'm here!! I'm already in the corner. It's cozy", shy: "If you ever need someone in your corner, I'm here", chill: "if you ever need someone in your corner, I'm here",
    catty: "If you ever need someone in your corner, I'm here. Remember that", diva: "Should you ever need someone in your corner, darling, I'm here", stoic: "I'm in your corner" }],
  ['chat.ally.neutral.03', "Real talk, who are you closest to in here?", {
    hype: "REAL TALK!! Who are you CLOSEST to in here??", dry: "real talk. who are you closest to in here", blunt: "Who are you closest to?",
    goofy: "Real talk!! Who are you closest to in here? Besides your couch", shy: "Real talk, who are you closest to in here?", chill: "real talk, who you closest to in here?",
    catty: "Real talk, who are you closest to in here? Be honest", diva: "Real talk, darling. Who are you closest to?", stoic: "Who are you closest to?" }],
  ['chat.ally.cold.01', "I think you and I should be a team in here", {
    hype: "I think you and I should be a TEAM in here!!", dry: "i think you and i should be a team in here", blunt: "You and me should be a team",
    goofy: "I think you and I should be a team in here!! Team Us. Team You-and-Me", shy: "I think maybe you and I should be a team in here", chill: "I think you and I should be a team in here",
    catty: "I think you and I should be a team in here. We'd be the best one", diva: "You and I should be a team, darling", stoic: "We should be a team" }],
  ['chat.ally.cold.02', "Do you want to work together? I think we'd be unstoppable", {
    hype: "Do you want to WORK TOGETHER?? We'd be UNSTOPPABLE {e:fire}", dry: "do you want to work together. i think we'd be unstoppable. or hard to stop", blunt: "Work together? We'd be unstoppable",
    goofy: "Do you want to work together? I think we'd be unstoppable!! Like a runaway shopping cart", shy: "Do you want to work together? I think we could be unstoppable", chill: "wanna work together? think we'd be unstoppable",
    catty: "Do you want to work together? We'd be unstoppable. They'd never know what hit them", diva: "Shall we work together, darling? We'd be unstoppable", stoic: "Work together? Unstoppable" }],
  ['chat.ally.cold.03', "Hey, would you want to have each other's backs?", {
    hype: "HEY!! Would you want to have each other's BACKS??", dry: "hey. would you want to have each other's backs", blunt: "Want to have each other's backs?",
    goofy: "Hey!! Would you want to have each other's backs? I have a very good back", shy: "Hey, would you want to have each other's backs?", chill: "hey, wanna have each other's backs?",
    catty: "Hey. Would you want to have each other's backs? Think about it", diva: "Hello, darling. Shall we have each other's backs?", stoic: "Each other's backs?" }],
];
