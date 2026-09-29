// ══════════════════════════════════════════════════════════════════════
// ci/games-data.js — the game library (spec §13.2), data only
// ══════════════════════════════════════════════════════════════════════
//
// Every game here is a real one from the US seasons. `rules` is the Circle's
// own wording, as a player reads it aloud off the screen — copied from the
// transcripts where the episode has it (1×01 Ice Breaker, 1×03 Ask Me
// Anything, 1×04 Nailed It, 1×07 Trivia Night, 1×08 Portrait Mode, 1×10 State
// Your Case, 1×11 Most Likely, 2×10 Democracy Day, 3×04 Honest Reviews, 5×02
// Talk Flirty to Me, 5×04 Single Pringles, 6×08 Circle Scenarios…), written
// in the same voice where it does not. One engine per `family` plays them
// (js/ci/games.js).
//
// Left out on purpose: Who Dis? and Kray Pop, which run on real celebrities
// and real pop culture — nothing in this universe to quiz on.
//
// Prompt shapes: statement {id, text, stat, lean ±1 — agreeing leans on stat;
// the game's `say` is the two answer words, spoken aloud};
// name {id, text, tone good|bad|funny}; guess {id, text — a fact every player
// answers about themselves}; team {id, text — a category}; make {id, text,
// stats, about — the work portrays another player}.

export const FAMILIES = ['statement', 'name', 'ask', 'guess', 'make', 'photo', 'team', 'gift', 'rival', 'flirt'];
export const PURPOSES = ['bond', 'learn', 'catfish', 'divide'];
export const PRIZES = ['party', 'photo', 'video', 'immunity', 'gift', 'none'];

const st = (id, text, stat, lean) => ({ id, text, stat, lean });
const nm = (id, text, tone) => ({ id, text, tone });
const q = (id, text) => ({ id, text });

export const GAMES = [
  // ── statement: agree / disagree, yes / no — every answer shown ─────────
  { id: 'ice-breaker', say: ['Agree', 'Disagree'], name: 'Ice Breaker', family: 'statement', purpose: 'learn', prize: 'none', source: 'US 1 Ep 1',
    rules: ['All Players will be shown a series of statements. You must decide if you agree or disagree with each statement.'],
    prompts: [
      st('shower', "It's okay to pee in the shower.", 'boldness', 1),
      st('money', 'Money can buy you happiness.', 'strategic', 1),
      st('first-date', "It's okay to kiss on a first date.", 'boldness', 1),
      st('truth', 'You should always tell your partner the truth, even if it hurts.', 'loyalty', 1),
      st('ex', "It's okay to date your best friend's ex.", 'loyalty', -1),
      st('phone', "It's okay to look through your partner's phone.", 'intuition', 1),
      st('split', 'The person who asks should pay for the first date.', 'temperament', 1),
    ] },
  { id: 'been-there', say: ['Yes', 'No'], name: 'Been There Done That', family: 'statement', purpose: 'learn', prize: 'none', source: 'US 4 Ep 1',
    rules: ['Players will be shown a series of experiences. You must answer whether or not you have been there and done that.'],
    prompts: [
      st('skinny-dip', 'I have been skinny-dipping.', 'boldness', 1),
      st('ghosted', 'I have ghosted someone.', 'temperament', -1),
      st('cried-movie', 'I have cried at a movie.', 'social', 1),
      st('fake-name', 'I have given someone a fake name.', 'strategic', 1),
      st('bar-fight', 'I have been in a bar fight.', 'temperament', -1),
      st('marathon', 'I have run a marathon.', 'endurance', 1),
    ] },
  { id: 'for-real', say: ['Yes', 'No'], name: 'For Real For Real', family: 'statement', purpose: 'learn', prize: 'none', source: 'US 6 Ep 1',
    rules: ['Players will be asked a series of questions. You must answer yes or no, for real for real.'],
    prompts: [
      st('unfriend', 'Would you unfriend someone who got canceled?', 'loyalty', -1),
      st('secret', 'If your friend confessed to you that they were cheating, would you keep their secret?', 'loyalty', 1),
      st('read-texts', "Would you read your partner's texts if they left their phone unlocked?", 'intuition', 1),
      st('lie-age', 'Would you lie about your age to get a date?', 'strategic', 1),
      st('return-wallet', 'If you found a wallet full of cash, would you return it?', 'loyalty', 1),
      st('regift', 'Would you regift a present?', 'strategic', 1),
    ] },
  { id: 'risky-quizness', say: ['Yes', 'No'], name: 'Risky Quizness', family: 'statement', purpose: 'learn', prize: 'none', source: 'US 7 Ep 1',
    rules: ["It's time for Risky Quizness. You must answer yes or no to each question about the risky things you've done."],
    prompts: [
      st('jump', 'Have you ever jumped out of a plane?', 'boldness', 1),
      st('quit', 'Have you ever quit a job on the spot?', 'temperament', -1),
      st('tattoo', 'Have you ever gotten a tattoo you regret?', 'boldness', 1),
      st('sneak', 'Have you ever snuck into a concert?', 'strategic', 1),
      st('crush', 'Have you ever confessed a crush to a friend?', 'social', 1),
      st('dare', 'Have you ever done a dare you regretted?', 'boldness', 1),
    ] },
  { id: 'pick-3', say: ['Yes', 'No'], name: 'Pick 3', family: 'statement', purpose: 'learn', prize: 'none', source: 'US 7 Ep 10',
    rules: ["Players, you must pick the three things you can't live without. For each one, say whether it makes your list."],
    prompts: [
      st('phone', 'My phone.', 'social', 1),
      st('family', 'My family.', 'loyalty', 1),
      st('gym', 'The gym.', 'physical', 1),
      st('coffee', 'Coffee.', 'endurance', -1),
      st('music', 'Music.', 'boldness', 1),
      st('faith', 'My faith.', 'loyalty', 1),
    ] },

  // ── name: say the player who fits, in the open ─────────────────────────
  { id: 'most-likely', name: 'Most Likely', family: 'name', purpose: 'divide', prize: 'none', source: 'US 1 Ep 11',
    rules: ["As Players near the end of The Circle, it's time to play Most Likely.", 'You must decide which Player you think fits each statement.'],
    prompts: [
      nm('zombie', 'Most likely to die in a zombie apocalypse.', 'funny'),
      nm('president', 'Most likely to run for President.', 'good'),
      nm('friends', 'Most likely to remain friends with you.', 'good'),
      nm('two-faced', 'Most likely to say one thing and do another.', 'bad'),
      nm('famous', 'Most likely to be famous one day.', 'good'),
      nm('reality', 'Most likely to be on another reality show.', 'funny'),
    ] },
  { id: 'circle-scenarios', name: 'Circle Scenarios', family: 'name', purpose: 'divide', prize: 'none', source: 'US 6 Ep 8',
    rules: ['Players will be given a series of scenarios. You must say which Player is most likely to end up in each one.'],
    prompts: [
      nm('love', 'Which Player is most likely to fall in love at first sight?', 'good'),
      nm('ghost', 'Which Player is most likely to ghost someone?', 'bad'),
      nm('win', 'Which Player is most likely to win The Circle?', 'good'),
      nm('lie', 'Which Player is most likely to lie to your face?', 'bad'),
      nm('late', 'Which Player is most likely to show up late to their own wedding?', 'funny'),
      nm('secret', 'Which Player is most likely to keep your secret?', 'good'),
    ] },
  { id: 'yearbook', name: 'Circle Yearbook', family: 'name', purpose: 'divide', prize: 'party', source: 'US 3 Ep 11',
    rules: ["It's time for the Circle Yearbook. You must vote for the Player who best fits each category."],
    prompts: [
      nm('hottie', 'Class Hottie.', 'good'),
      nm('mvp', 'Most Valuable Player.', 'good'),
      nm('clown', 'Class Clown.', 'funny'),
      nm('drama', 'Most Dramatic Player.', 'bad'),
      nm('flirt', 'Biggest Flirt.', 'funny'),
      nm('snake', 'Most Likely to Stab You in the Back.', 'bad'),
    ] },
  { id: 'circle-awards', name: 'The Circle Awards', family: 'name', purpose: 'divide', prize: 'party', source: 'US 2 Ep 11',
    rules: ['Time to get glammed up. Your outfits are at the door!', 'It is time to cast your votes.'],
    prompts: [
      nm('sexiest', 'Sexiest Player Award.', 'good'),
      nm('funniest', 'Funniest Player Award.', 'funny'),
      nm('shady', 'Shadiest Player Award.', 'bad'),
      nm('loyal', 'Most Loyal Player Award.', 'good'),
      nm('messiest', 'Messiest Player Award.', 'bad'),
      nm('mvp', 'Best Game Player Award.', 'good'),
    ] },
  { id: 'giving-awards', name: 'It\'s Giving Awards', family: 'name', purpose: 'divide', prize: 'none', source: 'US 7 Ep 12',
    rules: ["It's time for the It's Giving Awards. Your votes are anonymous, but the winners will be revealed to everyone."],
    prompts: [
      nm('main', 'Most likely to take over every conversation.', 'funny'),
      nm('realest', 'The realest Player in The Circle.', 'good'),
      nm('fake', 'The most fake Player in The Circle.', 'bad'),
      nm('glow', 'The biggest glow-up since day one.', 'good'),
      nm('villain', 'The biggest villain in The Circle.', 'bad'),
    ] },
  { id: 'make-out-marry', name: 'Make Out, Marry, Murder', family: 'name', purpose: 'divide', prize: 'none', source: 'US 7 Ep 5',
    rules: ['Make Out, Marry, Murder. You must pick one Player for each. Your choices are anonymous.'],
    prompts: [
      nm('make-out', 'Make out.', 'good'),
      nm('marry', 'Marry.', 'good'),
      nm('murder', 'And the one who has to go.', 'bad'),
      nm('friend', 'And one to keep as a friend forever.', 'good'),
    ] },
  { id: 'naughty-nice', name: 'Naughty and Nice', family: 'name', purpose: 'divide', prize: 'photo', source: 'US 6 Ep 9',
    rules: ['Players have posted a naughty photo and a nice photo. Everyone will then vote for the naughtiest and the nicest Player.'],
    prompts: [
      nm('naughtiest', 'The naughtiest Player.', 'funny'),
      nm('nicest', 'The nicest Player.', 'good'),
      nm('secret-naughty', 'The Player who is secretly the naughtiest.', 'bad'),
      nm('angel', 'The Player who is actually an angel.', 'good'),
    ] },
  { id: 'wild-cards', name: 'Wild Cards', family: 'name', purpose: 'divide', prize: 'none', source: 'US 7 Ep 6',
    rules: ['Each Player will be dealt a deck of Wild Cards. You must give each card to the Player you think it describes.'],
    prompts: [
      nm('tea', 'The Tea Spiller.', 'bad'),
      nm('gentle-catfish', 'The Gentle Catfish.', 'bad'),
      nm('mom', 'The Circle Mom.', 'good'),
      nm('hopeless', 'The Hopeless Romantic.', 'funny'),
      nm('mastermind', 'The Mastermind.', 'bad'),
    ] },

  // ── ask: anonymous questions, answered in public ───────────────────────
  { id: 'ama', anonymous: true, name: 'Ask Me Anything', family: 'ask', purpose: 'catfish', prize: 'none', source: 'US 1 Ep 3',
    rules: ["This is your chance to send one Player a question without them knowing it's from you."] },
  { id: 'dont-at-me', anonymous: true, name: "Don't @ Me", family: 'ask', purpose: 'catfish', prize: 'none', source: 'US 2 Ep 8',
    rules: ["It's time for Don't @ Me. You will each send an anonymous question to another Player, who must answer it in front of everyone."] },
  { id: 'going-there', anonymous: true, name: 'Oh, We Are Going There', family: 'ask', purpose: 'divide', prize: 'none', source: 'US 6 Ep 10',
    rules: ['Players will be asked the hard questions. Your questions are anonymous, and your answers are not.'] },
  { id: 'circle-ama', anonymous: true, name: '#CircleAMA', family: 'ask', purpose: 'divide', prize: 'none', source: 'US 7 Ep 9',
    rules: ["It's time for #CircleAMA. Each Player will receive anonymous questions from the rest of The Circle, and must answer them publicly."] },
  { id: 'honest-reviews', anonymous: true, name: 'Honest Reviews', family: 'ask', purpose: 'divide', prize: 'none', source: 'US 3 Ep 4',
    rules: ['This will give you the opportunity to be truly honest.', 'You must write an anonymous review of another Player. They will be able to reply.'] },
  { id: 'circle-of-fortune', name: 'Circle of Fortune', family: 'ask', purpose: 'learn', prize: 'none', source: 'US 3 Ep 9',
    rules: ['Players will take turns spinning the Circle of Fortune. Wherever the wheel lands, you must answer the question for everyone to see.'] },
  { id: 'truth-or-dare', name: 'Truth or Dare', family: 'ask', purpose: 'divide', prize: 'party', source: 'US 2 Ep 3',
    rules: ['Welcome to Circle Fest! Tonight, Players will play Truth or Dare. Every truth will be shared with the whole Circle.'] },

  // ── guess: whose answer is it? ────────────────────────────────────────
  { id: 'says-who', name: 'Says Who?', family: 'guess', purpose: 'catfish', prize: 'none', source: 'US 2 Ep 1',
    rules: ['Players will see a series of facts about each other, without names. You must guess who said each one.', 'Congratulations. You have completed Says Who? You should now all know each other a little better.'],
    prompts: [
      q('secret-talent', 'My secret talent is…'),
      q('worst-date', 'The worst date I ever went on…'),
      q('first-job', 'My first job was…'),
      q('embarrassing', 'The most embarrassing thing that ever happened to me…'),
      q('scared', 'The thing I am most scared of is…'),
    ] },
  { id: 'who-are-you', name: 'Who Are You?', family: 'guess', purpose: 'catfish', prize: 'none', source: 'US 5 Ep 1',
    rules: ['In Who Are You?, Players will be asked a series of multiple-choice questions about themselves. Everyone will see the answers.'],
    prompts: [
      q('weekend', 'Your perfect weekend is…'),
      q('dance', 'On the dance floor, you are…'),
      q('breakup', 'After a breakup, you…'),
      q('morning', 'Your morning routine takes…'),
      q('text', 'When you get a text, you reply…'),
    ] },
  { id: 'flashback', name: 'Flashback Photos & Quiz', family: 'guess', purpose: 'learn', prize: 'party', source: 'US 3 Ep 3',
    rules: ['Players have shared their childhood photos. You must guess which Player is in each photo. The winner will be invited to a party.'],
    prompts: [
      q('baby', 'A baby photo.'),
      q('school', 'A school picture.'),
      q('prom', 'A prom photo.'),
      q('halloween', 'A Halloween costume.'),
      q('birthday', 'A birthday party.'),
    ] },
  { id: 'only-human', name: "I'm Only Human", family: 'guess', purpose: 'catfish', prize: 'none', source: 'US 6 Ep 3',
    rules: ['Players, you must tell a joke, read an emotion and solve a problem. Then you will rank each other from most to least human.'],
    prompts: [
      q('joke', 'Tell The Circle a joke.'),
      q('emotion', 'What emotion is this face showing?'),
      q('problem', 'Your friend is upset and will not say why. What do you do?'),
      q('breakfast', 'What did you have for breakfast?'),
    ] },

  // ── make: make something, post it, the likes judge ─────────────────────
  { id: 'nailed-it', name: 'Nailed It / Failed It', family: 'make', purpose: 'bond', prize: 'photo', source: 'US 1 Ep 4',
    rules: ["Welcome to today's game. Players must put their cake-making skills to the test.", 'You have 30 minutes to recreate this colorful masterpiece.', 'The cake that gets the most likes will earn their baker a special prize.', 'Everything you need has been delivered to your door. Your time starts now!'],
    prompts: [{ id: 'cake', text: 'Copy the cake.', stats: ['temperament', 'physical'], about: false }] },
  { id: 'batter-up', name: 'Batter Up', family: 'make', purpose: 'bond', prize: 'party', source: 'US 2 Ep 6',
    rules: ['Players, you must make an animal out of pancakes. Don\'t flip out! Your time starts now.'],
    prompts: [{ id: 'pancake', text: 'A pancake animal.', stats: ['temperament', 'boldness'], about: false }] },
  { id: 'glammequins', name: 'Glammequins', family: 'make', purpose: 'bond', prize: 'photo', source: 'US 2 Ep 7',
    rules: ['Each Player has been sent a mannequin head. You must give it a makeover. The best glammequin wins.'],
    prompts: [{ id: 'mannequin', text: 'A mannequin makeover.', stats: ['social', 'boldness'], about: false }] },
  { id: 'portrait-mode', name: 'Portrait Mode', family: 'make', purpose: 'divide', prize: 'none', source: 'US 1 Ep 8',
    rules: ['Players will have 30 minutes to paint a portrait of another Player. All materials have been delivered to your door.', 'Your time is up. You should now upload your photo.'],
    prompts: [{ id: 'portrait', text: 'A portrait of another Player.', stats: ['mental', 'temperament'], about: true }] },
  { id: 'paint-the-player', name: 'Paint the Player', family: 'make', purpose: 'divide', prize: 'none', source: 'US 4 Ep 11',
    rules: ["It's time to test your artistic abilities in a game of Portrait Mode.", 'You will have 30 minutes to paint a portrait of another Player. Your portraits will remain anonymous. Your time starts now!'],
    prompts: [{ id: 'portrait', text: 'An anonymous portrait of another Player.', stats: ['mental', 'boldness'], about: true }] },
  { id: 'goat', name: 'G.O.A.T.', family: 'make', purpose: 'divide', prize: 'none', source: 'US 7 Ep 8',
    rules: ['You must paint another Player as a goat, and give them a superlative to go with it.'],
    prompts: [{ id: 'goat', text: 'Another Player, as a goat.', stats: ['mental', 'boldness'], about: true }] },
  { id: 'poor-traits', name: 'Poor-Traits', family: 'make', purpose: 'divide', prize: 'none', source: 'US 6 Ep 5',
    rules: ["Each Player must paint an anonymous portrait of another Player's worst trait."],
    prompts: [{ id: 'worst', text: "Another Player's worst trait.", stats: ['mental', 'strategic'], about: true }] },
  { id: 'rap-it-up', name: 'Rap It Up', family: 'make', purpose: 'divide', prize: 'none', source: 'US 6 Ep 2',
    rules: ['Players, you must write a rap about another Player, and perform it for The Circle.'],
    prompts: [{ id: 'rap', text: 'A rap about another Player.', stats: ['boldness', 'social'], about: true }] },
  { id: 'poetry-slam', name: 'Poetry Slam', family: 'make', purpose: 'divide', prize: 'immunity', source: 'US 2 Ep 2',
    rules: ['The Players at risk have 15 minutes to write a poem. The best poem will keep its author safe.'],
    prompts: [{ id: 'poem', text: 'A poem to be saved.', stats: ['mental', 'social'], about: false }] },
  { id: 'head-to-head', name: 'Head to Head', family: 'make', purpose: 'divide', prize: 'immunity', source: 'US 3 Ep 5',
    rules: ['Players will go head to head: each writes a diss track about another Player, and The Circle will vote for the best one.'],
    prompts: [{ id: 'diss', text: 'A diss track about the other Player.', stats: ['boldness', 'mental'], about: true }] },
  { id: 'roast', name: 'Roast', family: 'make', purpose: 'divide', prize: 'none', source: 'US 4 Ep 6',
    rules: ['Tonight, The Circle is holding a roast. You must write a roast joke about another Player. The best one wins.'],
    prompts: [{ id: 'roast', text: 'A roast joke about another Player.', stats: ['boldness', 'social'], about: true }] },
  { id: 'single-pringles', name: 'Single Pringles', family: 'make', purpose: 'learn', prize: 'none', source: 'US 5 Ep 4',
    rules: ['The Circle is going to give you all a brand-new dating profile page.', 'You will be making a dating profile for another Player. Your dating profiles are now going live.'],
    prompts: [{ id: 'dating', text: 'A dating profile for another Player.', stats: ['social', 'intuition'], about: true }] },

  // ── photo: post it, the room reacts ───────────────────────────────────
  { id: 'hashtag-this', name: 'Hashtag This', family: 'photo', purpose: 'learn', prize: 'none', source: 'US 1 Ep 5',
    rules: ['Players must post a photo to the Newsfeed. The rest of The Circle will give it a hashtag.'] },
  { id: 'two-faced', name: 'Two Faced', family: 'photo', purpose: 'learn', prize: 'none', source: 'US 2 Ep 5',
    rules: ['Players must post two photos: a naughty one and a nice one, with a hashtag for each.'] },
  { id: 'throwback-thirsty', name: 'Throwback Thirsty', family: 'photo', purpose: 'bond', prize: 'none', source: 'US 7 Ep 2',
    rules: ["It's Throwback Thirsty. Post your steamiest old photo, and the other Players will react with an emoji."] },
  { id: 'this-is-me', name: 'This Is Me', family: 'photo', purpose: 'learn', prize: 'none', source: 'US 3 Ep 2',
    rules: ['Players must share a photo that means something to them, and tell the story behind it.'] },

  // ── team: captains pick, teams compete ────────────────────────────────
  { id: 'trivia-night', name: 'Trivia Night', family: 'team', purpose: 'bond', prize: 'video', source: 'US 1 Ep 7',
    rules: ['Tonight, you will meet your fellow Players at The Circle Trivia Night.', 'Shortly, you will split into two teams where you will compete to answer trivia questions.', 'The winning team members will receive a very special prize.'],
    prompts: [q('movies', 'Movie night.'), q('food', 'Food and drink.'), q('animals', 'Animals.'),
      q('science', 'Science class.'), q('music', 'Music.'), q('home', 'Around the home.')] },
  { id: 'geek-chic', name: 'Geek Chic Quiz', family: 'team', purpose: 'bond', prize: 'party', source: 'US 2 Ep 9',
    rules: ["It's time for the Geek Chic Quiz. Two teams will answer questions on science, math and more."],
    prompts: [q('space', 'Space.'), q('math', 'Math.'), q('words', 'Spelling.'), q('body', 'The human body.'), q('maps', 'Maps.')] },
  { id: 'quizzical', name: "Let's Get Quizzical", family: 'team', purpose: 'bond', prize: 'video', source: 'US 5 Ep 7',
    rules: ['You should collect your team outfits now.', 'Each team will choose a category, and one Player will answer each question.'],
    prompts: [q('medicine', 'Medicine.'), q('sports', 'Sports.'), q('cooking', 'Cooking.'), q('history', 'History.'), q('words', 'Words.')] },

  // ── gift: pick one Player, and everyone finds out ─────────────────────
  { id: 'endless-heartbreak', name: 'Night of Endless Heartbreak', family: 'gift', purpose: 'divide', prize: 'none', source: 'US 6 Ep 11',
    rules: ['The Circle is having a big night in. Each Player may send one gift to another Player.', "It's only polite to send a thank-you note when you receive a gift."] },
  { id: 'bake-bestie', name: 'Bake for Your Bestie', family: 'gift', purpose: 'bond', prize: 'none', source: 'US 3 Ep 8',
    rules: ['Bake for Your Bestie! Players, you have 20 minutes to bake a cake for your closest friend in The Circle.'] },
  { id: 'democracy-day', name: 'Democracy Day', family: 'gift', purpose: 'divide', prize: 'none', source: 'US 2 Ep 10',
    rules: ['Players, it is time for your first democratic decision.', 'You will now vote for the Player you wish to bestow a great gift upon.'] },

  // ── rival: name them, in front of everyone ────────────────────────────
  { id: 'state-your-case', name: 'State Your Case', family: 'rival', purpose: 'divide', prize: 'none', source: 'US 1 Ep 10',
    rules: ['There are no more new Players entering The Circle. The winner of The Circle is among you.', 'You must compose a message to explain why you deserve to win over your biggest rival in The Circle.'] },

  // ── flirt: the pickup lines, and a date ───────────────────────────────
  { id: 'talk-flirty', name: 'Talk Flirty to Me', family: 'flirt', purpose: 'bond', prize: 'none', source: 'US 5 Ep 2',
    rules: ['Today you will be putting your flirtiest foot forward to impress your fellow Players.', 'Whoever impresses the most with their pickup line will go on a date in the Hangout.'] },
];

// Parties (spec §13.4): themes from the real seasons; props arrive at the door.
export const PARTY_THEMES = [
  { id: 'welcome', name: 'Welcome Party', props: ['party hats', 'a pizza', 'glow sticks'] },
  { id: 'nineties', name: '90s Party', props: ['a windbreaker', 'butterfly clips', 'a boom box'] },
  { id: 'glam', name: 'Glam Party', props: ['a sequin jacket', 'a feather boa', 'a glitter kit'] },
  { id: 'circle-fest', name: 'Circle Fest', props: ['a flower crown', 'fringe', 'face paint'] },
  { id: 'wedding', name: 'Wedding Party', props: ['a veil', 'a bow tie', 'a small cake'] },
  { id: 'zombie', name: 'Zombie Pep Rally', props: ['pom-poms', 'fake blood', 'a letterman jacket'] },
  { id: 'camping', name: 'Camping Trip', props: ['a sleeping bag', 'marshmallows', 'a flashlight'] },
  { id: 'animal', name: 'Animal Instincts', props: ['cat ears', 'a leopard print scarf', 'a tail'] },
  { id: 'disco', name: 'Disco Night', props: ['a disco ball', 'platform shoes', 'a wig'] },
];

// Never Have I Ever, played in the party's Circle Chat (1×02). An admission
// is public; `stat` is what makes someone likelier to have done it.
export const NEVER_HAVE_I_EVER = [
  { id: 'public', text: 'Never have I ever kissed someone in public.', stat: 'boldness' },
  { id: 'first-date', text: 'Never have I ever kissed someone on the first date.', stat: 'boldness' },
  { id: 'lied-age', text: 'Never have I ever lied about my age.', stat: 'strategic' },
  { id: 'fake-sick', text: 'Never have I ever called in sick when I was not sick.', stat: 'strategic' },
  { id: 'slid-dms', text: 'Never have I ever slid into a stranger\'s DMs.', stat: 'boldness' },
  { id: 'cried-work', text: 'Never have I ever cried at work.', stat: 'social' },
  { id: 'ex-back', text: 'Never have I ever gotten back together with an ex.', stat: 'loyalty' },
  { id: 'stalked', text: 'Never have I ever looked up an ex online at two in the morning.', stat: 'intuition' },
  { id: 'dared', text: 'Never have I ever done something on a dare I would not do sober.', stat: 'boldness' },
  { id: 'crush-friend', text: 'Never have I ever had a crush on a friend\'s partner.', stat: 'temperament' },
  { id: 'fight', text: 'Never have I ever been kicked out of a party.', stat: 'boldness' },
  { id: 'fake-number', text: 'Never have I ever given someone a fake number.', stat: 'strategic' },
];
