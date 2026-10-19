// Voice versions, batch 3c: the games said aloud, part three (agree or disagree). Same rules as batch1.js. No brand
// names anywhere.
export const VOICES = [
  // ── the statement on the screen ───────────────────────────────────────
  ['game.statement.prompt.01', "Next one. '{q}'", {
    hype: "NEXT one! '{q}'", dry: "Next one. '{q}' Oh good.", blunt: "Next. '{q}'",
    goofy: "Next one! '{q}' Ooh! Ooh! Ooh!", shy: "Next one. '{q}'", chill: "Next one, dude. '{q}'",
    catty: "Next one. '{q}' Let's see who lies.", diva: "Next one, darling. '{q}'", stoic: "Next. '{q}'" }],
  ['game.statement.prompt.02', "'{q}' Oh, this one's gonna split the room.", {
    hype: "'{q}' OH! This one's gonna SPLIT the room!", dry: "'{q}' Oh, this one's going to split the room.", blunt: "'{q}' This splits the room.",
    goofy: "'{q}' Oh! This one's gonna split the room! Like a banana split! A room split!", shy: "'{q}' Oh. This one's going to split the room.", chill: "'{q}' This one's gonna split the room, dude.",
    catty: "'{q}' Oh, this one's going to split the room. Good.", diva: "'{q}' This one will divide the cast, darling.", stoic: "'{q}' This splits us." }],
  ['game.statement.prompt.03', "'{q}' Okay, that's a real question.", {
    hype: "'{q}' OKAY! That's a REAL question!", dry: "'{q}' Okay. That's a real question.", blunt: "'{q}' Real question.",
    goofy: "'{q}' Okay! That's a real question! A grown-up question!", shy: "'{q}' Okay. That's a real question.", chill: "'{q}' That's a real question, dude.",
    catty: "'{q}' Okay, that's a real question. Somebody's going to squirm.", diva: "'{q}' A serious question, darling.", stoic: "'{q}' Real question." }],
  ['game.statement.prompt.04', "'{q}' Easy. Too easy. Suspiciously easy.", {
    hype: "'{q}' EASY! TOO easy! SUSPICIOUSLY easy!", dry: "'{q}' Easy. Too easy. Suspiciously easy.", blunt: "'{q}' Too easy.",
    goofy: "'{q}' Easy! Too easy! Suspiciously easy! Is it a trap? It's a trap!", shy: "'{q}' That seems easy. Maybe too easy.", chill: "'{q}' Easy. Too easy, dude.",
    catty: "'{q}' Easy. Too easy. Somebody will still get it wrong.", diva: "'{q}' Too easy, darling. Suspicious.", stoic: "'{q}' Too easy." }],
  ['game.statement.prompt.05', "Oh no. '{q}' Why would they ask that?", {
    hype: "OH NO! '{q}' WHY would they ask that?!", dry: "Oh no. '{q}' Why would they ask that.", blunt: "'{q}' Why ask that?",
    goofy: "Oh no! '{q}' Why would they ask that? Who hurt them?", shy: "Oh no. '{q}' Why would they ask that?", chill: "Oh no. '{q}' Why would they ask that, dude?",
    catty: "Oh no. '{q}' Why would they ask that? Oh, I love it.", diva: "Oh no, darling. '{q}' Why would they?", stoic: "'{q}' Why ask that?" }],
  ['game.statement.prompt.07', "'{q}' I have to think about this.", {
    hype: "'{q}' I HAVE to think about this!", dry: "'{q}' I have to think about this. Ugh.", blunt: "'{q}' Thinking.",
    goofy: "'{q}' I have to think about this! Thinking face! Hmmmm!", shy: "'{q}' I have to think about this.", chill: "'{q}' Gotta think about this, dude.",
    catty: "'{q}' I have to think about this. What answer looks best?", diva: "'{q}' I must ponder this, darling.", stoic: "'{q}' Thinking." }],
  // ── my answer ─────────────────────────────────────────────────────────
  ['game.statement.agree.01', "{ans}. Easy.", {
    hype: "{ans}! EASY!", dry: "{ans}. Easy.", blunt: "{ans}.",
    goofy: "{ans}! Easy! Easy cheesy!", shy: "{ans}. That's easy.", chill: "{ans}. Easy, dude.",
    catty: "{ans}. Easy. Obviously.", diva: "{ans}, darling. Easy.", stoic: "{ans}." }],
  ['game.statement.agree.02', "Is that a trick? No. {ans}.", {
    hype: "Is that a TRICK?! No! {ans}!", dry: "Is that a trick. No. {ans}.", blunt: "Not a trick. {ans}.",
    goofy: "Is that a trick? No! I checked! {ans}!", shy: "Is that a trick? No. {ans}.", chill: "Is that a trick? Nah. {ans}, dude.",
    catty: "Is that a trick? No. {ans}. They can't trick me.", diva: "A trick, darling? No. {ans}.", stoic: "No trick. {ans}." }],
  ['game.statement.agree.03', "Circle, mark '{ans}.' And I'm not ashamed.", {
    hype: "Circle, mark '{ans}.' And I'm NOT ashamed!", dry: "Circle, mark '{ans}.' Not ashamed. Mostly.", blunt: "Circle, mark '{ans}.' Not ashamed.",
    goofy: "Circle, mark '{ans}.' And I'm not ashamed! I'm proud! Kind of!", shy: "Circle, mark '{ans}.' I'm not ashamed.", chill: "Circle, mark '{ans}.' Not ashamed, dude.",
    catty: "Circle, mark '{ans}.' And I'm not ashamed. Why would I be?", diva: "Circle, mark '{ans}.' Unashamed, darling.", stoic: "Circle, mark '{ans}.'" }],
  ['game.statement.agree.04', "Honestly? {ans}.", {
    hype: "HONESTLY?! {ans}!", dry: "Honestly. {ans}.", blunt: "{ans}. Honestly.",
    goofy: "Honestly? {ans}! Honest-ly!", shy: "Honestly? {ans}.", chill: "Honestly? {ans}, dude.",
    catty: "Honestly? {ans}.", diva: "Honestly, darling? {ans}.", stoic: "{ans}." }],
  ['game.statement.agree.05', "Who wouldn't say that? {ans}.", {
    hype: "Who WOULDN'T say that?! {ans}!", dry: "Who wouldn't say that. {ans}.", blunt: "Who wouldn't? {ans}.",
    goofy: "Who wouldn't say that? {ans}! Everybody! Right? Right?", shy: "Who wouldn't say that? {ans}.", chill: "Who wouldn't say that, dude? {ans}.",
    catty: "Who wouldn't say that? {ans}. Somebody will, though.", diva: "Who wouldn't, darling? {ans}.", stoic: "{ans}. Obviously." }],
  ['game.statement.agree.06', "Do I answer honestly or do I answer smart? Honestly.", {
    hype: "Do I answer HONESTLY or SMART?! HONESTLY!", dry: "Honest or smart. Honest. I'll regret it.", blunt: "Honest or smart? Honest.",
    goofy: "Do I answer honestly or do I answer smart? Honestly! Smart is too hard!", shy: "Do I answer honestly or smart? Honestly.", chill: "Honest or smart, dude? Honest.",
    catty: "Do I answer honestly or do I answer smart? Both, if you're me.", diva: "Honest or clever, darling? Honest.", stoic: "Honest." }],
  ['game.statement.agree.07', "Absolutely. {ans}.", {
    hype: "ABSOLUTELY! {ans}!", dry: "Absolutely. {ans}.", blunt: "{ans}. Absolutely.",
    goofy: "Absolutely! {ans}! Absolutely absolutely!", shy: "Absolutely. {ans}.", chill: "Absolutely, dude. {ans}.",
    catty: "Absolutely. {ans}.", diva: "Absolutely, darling. {ans}.", stoic: "{ans}." }],
  ['game.statement.agree.08', "I'm gonna regret this. {ans}.", {
    hype: "I'm gonna REGRET this! {ans}!", dry: "I'm going to regret this. {ans}.", blunt: "Gonna regret it. {ans}.",
    goofy: "I'm gonna regret this! {ans}! Regret incoming!", shy: "I'm going to regret this. {ans}.", chill: "Gonna regret this, dude. {ans}.",
    catty: "I'm going to regret this. {ans}. No, I won't.", diva: "I'll regret this, darling. {ans}.", stoic: "{ans}. I'll regret it." }],
  ['game.statement.disagree.01', "Absolutely not. {ans}.", {
    hype: "ABSOLUTELY NOT! {ans}!", dry: "Absolutely not. {ans}.", blunt: "No. {ans}.",
    goofy: "Absolutely not! {ans}! Nope! Nopity nope!", shy: "Absolutely not. {ans}.", chill: "Absolutely not, dude. {ans}.",
    catty: "Absolutely not. {ans}. Who would?", diva: "Absolutely not, darling. {ans}.", stoic: "No. {ans}." }],
  ['game.statement.disagree.02', "Hell no. What? {ans}.", {
    hype: "HECK NO! WHAT?! {ans}!", dry: "No. What. {ans}.", blunt: "Hell no. {ans}.",
    goofy: "Heck no! What? {ans}! What kind of question is that?", shy: "No. What? {ans}.", chill: "Heck no, dude. What? {ans}.",
    catty: "Hell no. What? {ans}. Obviously.", diva: "Heavens, no, darling! {ans}.", stoic: "No. {ans}." }],
  ['game.statement.disagree.03', "No, no, no. Circle, mark '{ans}.'", {
    hype: "NO, NO, NO! Circle, mark '{ans}.'", dry: "No, no, no. Circle, mark '{ans}.'", blunt: "No. Circle, mark '{ans}.'",
    goofy: "No, no, no! Circle, mark '{ans}.' Quick! Before I change my mind!", shy: "No, no, no. Circle, mark '{ans}.'", chill: "No, no, no. Circle, mark '{ans}.'",
    catty: "No, no, no. Circle, mark '{ans}.' Next.", diva: "No, no, no, darling. Circle, mark '{ans}.'", stoic: "Circle, mark '{ans}.'" }],
  ['game.statement.disagree.04', "I was raised better than that. {ans}.", {
    hype: "I was RAISED better than that! {ans}!", dry: "I was raised better than that. Allegedly. {ans}.", blunt: "Raised better. {ans}.",
    goofy: "I was raised better than that! By very nice people! {ans}!", shy: "I was raised better than that. {ans}.", chill: "I was raised better than that, dude. {ans}.",
    catty: "I was raised better than that. Unlike some people. {ans}.", diva: "I was raised better than that, darling. {ans}.", stoic: "Raised better. {ans}." }],
  ['game.statement.disagree.05', "If I say yes, somebody's gonna judge me.", {
    hype: "If I say YES, somebody's gonna JUDGE me!", dry: "If I say yes, somebody's going to judge me. Somebody already is.", blunt: "Say yes and I get judged.",
    goofy: "If I say yes, somebody's gonna judge me! With a tiny gavel!", shy: "If I say yes, somebody's going to judge me.", chill: "If I say yes, someone's gonna judge me, dude.",
    catty: "If I say yes, somebody's going to judge me. Let them.", diva: "If I say yes, darling, they'll judge me.", stoic: "Say yes, get judged." }],
  ['game.statement.disagree.06', "Nope. Not me. {ans}.", {
    hype: "NOPE! NOT ME! {ans}!", dry: "Nope. Not me. {ans}.", blunt: "Not me. {ans}.",
    goofy: "Nope! Not me! Never me! {ans}!", shy: "Nope. Not me. {ans}.", chill: "Nope, not me, dude. {ans}.",
    catty: "Nope. Not me. {ans}. I have standards.", diva: "Not me, darling. {ans}.", stoic: "Not me. {ans}." }],
  ['game.statement.disagree.07', "{ans}. That's my answer.", {
    hype: "{ans}! That's MY answer!", dry: "{ans}. That's my answer.", blunt: "{ans}.",
    goofy: "{ans}! That's my answer! My only answer!", shy: "{ans}. That's my answer.", chill: "{ans}. That's my answer, dude.",
    catty: "{ans}. That's my answer.", diva: "{ans}, darling. My answer.", stoic: "{ans}." }],
  ['game.statement.disagree.08', "{ans}, and I'm not changing it.", {
    hype: "{ans}! And I'm NOT changing it!", dry: "{ans}. Not changing it.", blunt: "{ans}. Final.",
    goofy: "{ans}! And I'm not changing it! It's glued down!", shy: "{ans}. And I'm not changing it.", chill: "{ans}, dude. Not changing it.",
    catty: "{ans}, and I'm not changing it.", diva: "{ans}, darling. Unchangeable.", stoic: "{ans}. Final." }],
  // ── the results ───────────────────────────────────────────────────────
  ['game.statement.results.01', "Okay, let's see who said what.", {
    hype: "OKAY! Let's see who said WHAT!", dry: "Okay. Let's see who said what.", blunt: "Who said what.",
    goofy: "Okay! Let's see who said what! The moment of truth! Again!", shy: "Okay. Let's see who said what.", chill: "Okay, let's see who said what, dude.",
    catty: "Okay, let's see who said what. And who lied.", diva: "Let's see who said what, darling.", stoic: "Who said what." }],
  ['game.statement.results.02', "Circle, show me the answers. Come on, come on.", {
    hype: "Circle, SHOW me the answers! COME ON, COME ON!", dry: "Circle, show me the answers. Come on.", blunt: "Circle, the answers.",
    goofy: "Circle, show me the answers! Come on, come on! I'm bouncing!", shy: "Circle, show me the answers. Come on.", chill: "Circle, show me the answers. Come on, dude.",
    catty: "Circle, show me the answers. Come on. I've been patient.", diva: "Circle, the answers, darling! Come on!", stoic: "Circle, the answers." }],
  ['game.statement.results.03', "The answers are in. Oh, this is good.", {
    hype: "The answers are IN! Oh, this is GOOD!", dry: "The answers are in. Oh, this is good.", blunt: "Answers are in. Good.",
    goofy: "The answers are in! Oh, this is good! This is so good! Juicy!", shy: "The answers are in. Oh, this is good.", chill: "Answers are in, dude. This is good.",
    catty: "The answers are in. Oh, this is good. Very good.", diva: "The answers are in, darling. Delicious.", stoic: "Answers are in." }],
  ['game.statement.results.04', "Everybody said the same thing? Boring! I love you all, but boring.", {
    hype: "EVERYBODY said the same thing?! BORING! I love you ALL, but BORING!", dry: "Everybody said the same thing. Boring. I love you all. Boring.", blunt: "Everyone said the same. Boring.",
    goofy: "Everybody said the same thing? Boring! I love you all, but boring! Like plain toast!", shy: "Everybody said the same thing? That's kind of boring. I love you all, though.", chill: "Everybody said the same thing, dude? Boring. Love you all, but boring.",
    catty: "Everybody said the same thing? Boring. Predictable, all of you.", diva: "Everyone said the same thing, darling? A dull chorus.", stoic: "Same answer. Boring." }],
  ['game.statement.results.05', "It's split right down the middle. Oh, this is gonna start something.", {
    hype: "It's SPLIT right down the middle! Oh, this is gonna START something!", dry: "Split down the middle. This is going to start something.", blunt: "Split down the middle. Trouble.",
    goofy: "It's split right down the middle! Oh, this is gonna start something! Pick a side! Pick a side!", shy: "It's split right down the middle. This is going to start something.", chill: "Split right down the middle, dude. This'll start something.",
    catty: "It's split right down the middle. Oh, this is going to start something. Good.", diva: "Split down the middle, darling. Drama ahead.", stoic: "Split. Trouble." }],
  ['game.statement.results.06', "Everybody agrees except one. Just one.", {
    hype: "EVERYBODY agrees except ONE! Just ONE!", dry: "Everybody agrees except one. Just one.", blunt: "All but one.",
    goofy: "Everybody agrees except one! Just one! The rebel!", shy: "Everybody agrees except one. Just one.", chill: "Everyone agrees except one, dude. Just one.",
    catty: "Everybody agrees except one. Just one. Interesting.", diva: "Everyone but one, darling. A soloist.", stoic: "All but one." }],
  ['game.statement.results.07', "I'm shocked how many people answered like that.", {
    hype: "I'm SHOCKED how many people answered like that!", dry: "Shocked how many people answered like that.", blunt: "A lot of people said that. Shocking.",
    goofy: "I'm shocked how many people answered like that! My jaw is on the carpet!", shy: "I'm shocked how many people answered like that.", chill: "Shocked how many people answered like that, dude.",
    catty: "I'm shocked how many people answered like that. Actually, I'm not.", diva: "I'm shocked, darling. So many of them!", stoic: "Shocking." }],
  ['game.statement.results.08', "The whole Circle said the same thing. Okay, we're all normal.", {
    hype: "The WHOLE Circle said the same thing! Okay! We're all NORMAL!", dry: "The whole Circle said the same thing. We're all normal. Allegedly.", blunt: "Whole Circle agreed. We're normal.",
    goofy: "The whole Circle said the same thing! Okay! We're all normal! Normal-ish!", shy: "The whole Circle said the same thing. Okay. We're all normal.", chill: "Whole Circle said the same thing, dude. We're all normal.",
    catty: "The whole Circle said the same thing. Okay. We're all normal. Or all liars.", diva: "The whole Circle agrees, darling. How ordinary.", stoic: "All the same. Normal." }],
  // ── somebody stood alone ──────────────────────────────────────────────
  ['game.statement.lone.01', "Wait. {b} is the only one who answered that way?", {
    hype: "WAIT! {b} is the ONLY one who answered that way?!", dry: "Wait. {b} is the only one who answered that way.", blunt: "{b}'s the only one?",
    goofy: "Wait! {b} is the only one who answered that way? {b}! Why!", shy: "Wait. {b} is the only one who answered that way?", chill: "Wait, {b}'s the only one who answered that way, dude?",
    catty: "Wait. {b} is the only one who answered that way? Of course.", diva: "Wait, darling. {b} alone answered that way?", stoic: "Only {b}?" }],
  ['game.statement.lone.02', "Everybody else said the same thing, and then there's {b}.", {
    hype: "EVERYBODY else said the same thing! And then there's {b}!", dry: "Everybody said the same thing. And then there's {b}.", blunt: "Everyone agreed. Then {b}.",
    goofy: "Everybody else said the same thing! And then there's {b}! Hi, {b}!", shy: "Everybody else said the same thing. And then there's {b}.", chill: "Everyone said the same thing, dude. Then there's {b}.",
    catty: "Everybody else said the same thing, and then there's {b}. There's always {b}.", diva: "Everyone in unison, darling. And then {b}.", stoic: "Everyone. Then {b}." }],
  ['game.statement.lone.03', "Only {b}? Why is {b} the only one?", {
    hype: "ONLY {b}?! WHY is {b} the only one?!", dry: "Only {b}. Why is {b} the only one.", blunt: "Only {b}. Why?",
    goofy: "Only {b}? Why is {b} the only one? Is {b} from another planet?", shy: "Only {b}? Why is {b} the only one?", chill: "Only {b}, dude? Why?",
    catty: "Only {b}? Why is {b} the only one? I have theories.", diva: "Only {b}, darling? Why?", stoic: "Only {b}. Why?" }],
  ['game.statement.lone.04', "{b}, you're on your own with that one, honey.", {
    hype: "{b}! You're on your OWN with that one, honey!", dry: "{b}, you're on your own with that one.", blunt: "{b}, you're alone on that.",
    goofy: "{b}, you're on your own with that one, honey! All alone! In a canoe!", shy: "{b}, you're kind of on your own with that one.", chill: "{b}, you're on your own with that one, dude.",
    catty: "{b}, you're on your own with that one, honey. Enjoy it.", diva: "{b}, darling, you're on your own with that one.", stoic: "{b}. Alone on that." }],
  ['game.statement.lone.05', "Of course it's {b}. One more thing that doesn't fit.", {
    hype: "Of COURSE it's {b}! One MORE thing that doesn't fit!", dry: "Of course it's {b}. One more thing that doesn't fit.", blunt: "{b}. Another thing that doesn't fit.",
    goofy: "Of course it's {b}! One more thing that doesn't fit! Like a puzzle piece from another puzzle!", shy: "Of course it's {b}. One more thing that doesn't fit.", chill: "Of course it's {b}, dude. Another thing that doesn't fit.",
    catty: "Of course it's {b}. One more thing that doesn't fit. I'm counting.", diva: "Of course it's {b}, darling. Another piece out of place.", stoic: "{b}. Another thing that doesn't fit." }],
  ['game.statement.lone.06', "I'm shocked {b} said that. I'm shocked.", {
    hype: "I'm SHOCKED {b} said that! SHOCKED!", dry: "I'm shocked {b} said that. Shocked.", blunt: "Shocked {b} said that.",
    goofy: "I'm shocked {b} said that! I'm shocked! My hair is standing up!", shy: "I'm shocked {b} said that.", chill: "Shocked {b} said that, dude.",
    catty: "I'm shocked {b} said that. Not really.", diva: "I'm shocked, darling. {b} said that?", stoic: "{b} said that. Shocked." }],
  ['game.statement.surprise.01', "{b} said '{ans}'? I thought I knew {b}.", {
    hype: "{b} said '{ans}'?! I THOUGHT I knew {b}!", dry: "{b} said '{ans}.' I thought I knew {b}.", blunt: "{b} said '{ans}'? Thought I knew {b}.",
    goofy: "{b} said '{ans}'? I thought I knew {b}! Who are you, {b}?", shy: "{b} said '{ans}'? I thought I knew {b}.", chill: "{b} said '{ans}', dude? Thought I knew {b}.",
    catty: "{b} said '{ans}'? I thought I knew {b}. Apparently not.", diva: "{b} said '{ans}', darling? I thought I knew {b}.", stoic: "{b} said '{ans}'. Thought I knew {b}." }],
  ['game.statement.surprise.02', "Wait. {b} and I didn't answer the same? We always agree.", {
    hype: "WAIT! {b} and I DIDN'T answer the same?! We ALWAYS agree!", dry: "Wait. {b} and I didn't answer the same. We always agree.", blunt: "{b} and I disagreed? We always agree.",
    goofy: "Wait! {b} and I didn't answer the same? We always agree! We're twins! Not anymore!", shy: "Wait. {b} and I didn't answer the same? We always agree.", chill: "Wait, {b} and I didn't answer the same, dude? We always agree.",
    catty: "Wait. {b} and I didn't answer the same? {b} must have misread it.", diva: "Wait, darling. {b} and I differ? We always agree.", stoic: "{b} and I disagreed. We never do." }],
  ['game.statement.surprise.03', "Hm. {b} surprised me with that one.", {
    hype: "Hm! {b} SURPRISED me with that one!", dry: "Hm. {b} surprised me with that one.", blunt: "{b} surprised me.",
    goofy: "Hm! {b} surprised me with that one! Surprise, me! From {b}!", shy: "Hm. {b} surprised me with that one.", chill: "{b} surprised me with that one, dude.",
    catty: "Hm. {b} surprised me with that one. I'll remember it.", diva: "{b} surprised me, darling.", stoic: "{b} surprised me." }],
  ['game.statement.surprise.04', "Not {b}! Come on, {b}.", {
    hype: "NOT {b}! Come ON, {b}!", dry: "Not {b}. Come on, {b}.", blunt: "Not {b}. Come on.",
    goofy: "Not {b}! Come on, {b}! I believed in you!", shy: "Not {b}. Come on, {b}.", chill: "Not {b}! Come on, dude.",
    catty: "Not {b}! Come on, {b}. Disappointing.", diva: "Not {b}, darling! Come on.", stoic: "Not {b}." }],
  ['game.statement.surprise.05', "Okay, {b} and I need to talk about this later.", {
    hype: "Okay! {b} and I NEED to talk about this later!", dry: "{b} and I need to talk about this later. At length.", blunt: "{b} and I need to talk.",
    goofy: "Okay! {b} and I need to talk about this later! I'm making a list of questions!", shy: "Okay. {b} and I should talk about this later.", chill: "{b} and I need to talk about this later, dude.",
    catty: "Okay, {b} and I need to talk about this later. {b} has some explaining to do.", diva: "{b} and I need a word later, darling.", stoic: "{b} and I will talk." }],
  // ── what the game showed ──────────────────────────────────────────────
  ['game.statement.conclusion.01', "I learned more about {b} in ten minutes than in two days.", {
    hype: "I learned MORE about {b} in TEN MINUTES than in TWO DAYS!", dry: "Learned more about {b} in ten minutes than in two days.", blunt: "Ten minutes. Learned more about {b} than in two days.",
    goofy: "I learned more about {b} in ten minutes than in two days! Speed learning!", shy: "I learned more about {b} in ten minutes than in two days.", chill: "Learned more about {b} in ten minutes than in two days, dude.",
    catty: "I learned more about {b} in ten minutes than in two days. Very useful.", diva: "Ten minutes, darling, and I know {b} better than in two days.", stoic: "Learned a lot about {b}." }],
  ['game.statement.conclusion.02', "That game was fun. And a little too honest.", {
    hype: "That game was FUN! And a LITTLE too honest!", dry: "That game was fun. And a little too honest.", blunt: "Fun. Too honest.",
    goofy: "That game was fun! And a little too honest! I said things! Out loud!", shy: "That game was fun. And a little too honest.", chill: "That game was fun, dude. A little too honest.",
    catty: "That game was fun. A little too honest. For some people.", diva: "That game was fun, darling. Perhaps too honest.", stoic: "Fun. Too honest." }],
  ['game.statement.conclusion.03', "{b}'s answers are all I can think about right now.", {
    hype: "{b}'s answers are ALL I can think about right now!", dry: "{b}'s answers are all I can think about.", blunt: "Can't stop thinking about {b}'s answers.",
    goofy: "{b}'s answers are all I can think about right now! They're stuck in my head! Like a song!", shy: "{b}'s answers are all I can think about right now.", chill: "{b}'s answers are all I can think about, dude.",
    catty: "{b}'s answers are all I can think about right now. Every single one.", diva: "{b}'s answers consume me, darling.", stoic: "Thinking about {b}'s answers." }],
  ['game.statement.conclusion.04', "{b} was on their own again and again. That's raising some flags in my head.", {
    hype: "{b} stood ALONE again and AGAIN! That's raising FLAGS!", dry: "{b} stood alone again and again. That's raising flags.", blunt: "{b} stood alone again and again. Red flags.",
    goofy: "{b} stood alone again and again! That's raising flags in my head! Little red flags! Waving!", shy: "{b} stood alone again and again. That's raising some flags for me.", chill: "{b} stood alone again and again, dude. Raising some flags.",
    catty: "{b} stood alone again and again. That's raising flags. Lots of them.", diva: "{b} stood alone again and again, darling. Flags are raised.", stoic: "{b} alone again. Flags." }],
  ['game.statement.conclusion.05', "Everybody's answers matched their profiles. Except {b}'s.", {
    hype: "EVERYBODY'S answers matched their profiles! EXCEPT {b}'s!", dry: "Everybody's answers matched their profiles. Except {b}'s.", blunt: "Everyone matched their profile. Not {b}.",
    goofy: "Everybody's answers matched their profiles! Except {b}'s! {b}, what's going on?", shy: "Everybody's answers matched their profiles. Except {b}'s.", chill: "Everyone matched their profiles, dude. Except {b}.",
    catty: "Everybody's answers matched their profiles. Except {b}'s. Interesting.", diva: "Everyone stayed in character, darling. Except {b}.", stoic: "All matched. Not {b}." }],
  ['game.statement.conclusion.06', "Honestly, {b} is my kind of person. Same answers, same energy.", {
    hype: "Honestly, {b} is MY kind of person! Same answers, SAME ENERGY!", dry: "{b} is my kind of person. Same answers. Same energy.", blunt: "{b}'s my kind of person. Same answers.",
    goofy: "Honestly, {b} is my kind of person! Same answers, same energy! Same brain!", shy: "Honestly, {b} is my kind of person. Same answers, same energy.", chill: "{b}'s my kind of person, dude. Same answers, same energy.",
    catty: "Honestly, {b} is my kind of person. Same answers. Good taste.", diva: "{b} is my kind of person, darling. Same energy.", stoic: "{b}'s my kind. Same answers." }],
  ['game.statement.conclusion.07', "Games like that are how you find out who's real. Noted, {b}.", {
    hype: "Games like that are how you find out who's REAL! NOTED, {b}!", dry: "Games like that are how you find out who's real. Noted, {b}.", blunt: "That's how you find out who's real. Noted, {b}.",
    goofy: "Games like that are how you find out who's real! Noted, {b}! I wrote it on my hand!", shy: "Games like that are how you find out who's real. Noted, {b}.", chill: "That's how you find out who's real, dude. Noted, {b}.",
    catty: "Games like that are how you find out who's real. Noted, {b}. Very noted.", diva: "That's how you find who's real, darling. Noted, {b}.", stoic: "That's how you find who's real. Noted, {b}." }],
];
