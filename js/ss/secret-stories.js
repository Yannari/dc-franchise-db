// ══════════════════════════════════════════════════════════════════════
// ss/secret-stories.js — what a secret means, in the host's words
// ══════════════════════════════════════════════════════════════════════
//
// The list of secrets used to follow every secret with a clue the Voice had hidden in the house; the user, 2026-10-29:
// "the clue is useless replace by an explanation of the secret (u can use template for custom secret)", "and more
// detailed for implement secret". So every secret in the pool (ss/secret-pool.js) has its own explanation, written
// for the host to say on launch night, and a secret the user wrote picks one by its kind.
//
// Never says whose it is, nor a pronoun that would give it away: "somebody", "this housemate", "they".

/** The pool's secrets, by id: two or three sentences, what happened and why it is hard to keep. */
export const SECRET_STORIES = {
  // ── survived ──
  'plane-crash': 'A plane went down, and this housemate walked away from it. Most of the people on board were not so lucky, and they still think about that every time they hear an engine.',
  avalanche: 'Four hours under the snow, in the dark, not knowing whether anybody was coming. A rescue dog found them, and they say the first breath after that was the best one of their life.',
  shark: 'A shark took a bite out of this housemate in the middle of a wave. A few months later they were back on the board, in the same water.',
  lightning: 'Struck once is rare. Struck twice is almost impossible, and this housemate has the scars from both times to prove it.',
  coma: 'A whole year asleep. When they woke up, the world had moved on without them, and they had to learn how to walk again.',
  fire: 'The building was on fire, and this housemate went back in, more than once, to carry the neighbours out. They have never once called themselves a hero.',
  desert: 'Three days lost in the desert, with almost no water and nobody looking in the right place. They found their own way out.',
  // ── talent ──
  chess: 'This housemate is a chess grandmaster: one of the best players in the country, years of tournaments behind them. In there, nobody would ever guess.',
  memory: 'Pick any date from their life, and this housemate can tell you what day of the week it was, what they ate and what the weather was like. It is a real condition, and very few people in the world have it.',
  voice: 'Any voice they hear, they can copy perfectly after a few seconds. Which is going to make it very hard for them not to do it in there.',
  pickpocket: 'A watch, a ring, a wallet: this housemate can take it off you without you feeling a thing. They learned it as a stage act, and they have never once used it for real.',
  ventriloquist: 'This housemate can talk without moving their lips, well enough to do it on stage. One slip in that house, and everybody will be looking for where the voice came from.',
  opera: 'Behind closed doors, this housemate sings opera, properly trained, at a professional level. Imagine trying not to sing in the shower for a whole summer.',
  knives: 'Every night, in a travelling show, this housemate throws knives at a target, with a real person standing in front of it. They have never missed.',
  dice: 'This housemate counts cards so well that a casino banned them for life. Any game in that house with cards in it is going to be a test.',
  // ── record ──
  marathon: 'This housemate holds a record for running backwards, over a very long distance. It took years of training, and they are very proud of it.',
  eating: 'In competitions, this housemate eats more, and faster, than anybody else. They have the trophies. They also have to pretend they are not hungry at dinner.',
  'arm-wrestling': 'This housemate is the national champion at arm-wrestling. Every time somebody in there challenges anybody, they will have to lose on purpose.',
  spelling: 'As a child, this housemate won the national spelling contest, in front of the cameras. They have spent years hoping nobody remembers.',
  'youngest-pilot': 'At sixteen, before most people can drive, this housemate was flying a plane on their own. They are still a pilot today.',
  'dance-title': 'This housemate is a world champion, in a dance so rare that almost nobody in the house will have heard of it. Which might be the only thing protecting it.',
  quiz: 'This housemate won a quiz on television, with a big prize, and told nobody, not even their friends. In there, they will have to keep pretending not to know the answers.',
  // ── job ──
  undertaker: 'This housemate works with the dead, every day: preparing them, and looking after the families who come to say goodbye. People tend to step back when they hear it, so they stopped telling people.',
  bodyguard: 'For years, this housemate stood next to a very famous person, everywhere they went. They saw everything, and they are still not allowed to talk about most of it.',
  detective: 'This housemate is a private detective. Following people, watching them, finding out what they are hiding: in a house full of secrets, they are very much at home.',
  'lion-tamer': 'In a circus, this housemate worked in the cage with the lions, every single night. After that, a house full of strangers should not scare them much.',
  nun: 'This housemate spent three years living in a convent, praying, working and keeping silent. Then they walked out, and started a completely different life.',
  'magician-assistant': 'For two years, every night, this housemate climbed into a box on a stage and got sawn in half by a magician. They know exactly how the trick works, and they will never tell.',
  'stunt-double': 'When an actor falls off a roof or crashes a car in an action film, sometimes it is really this housemate. They have broken a few bones doing it.',
  perfume: 'This housemate creates perfumes for a living. A real professional nose: they can name almost any smell in the room. Including the ones the others would rather they did not.',
  'spy-school': 'This housemate used to teach people how to lie, and how to spot a liar. Which makes them very dangerous in that house, if anybody finds out.',
  // ── body ──
  'twelve-fingers': 'This housemate was born with six fingers on each hand. The extra ones were removed when they were a baby, and the scars are still there if you look.',
  transplant: 'The heart beating in this housemate\'s chest used to belong to somebody else. Without that stranger, they would not be here tonight.',
  'no-pain': 'This housemate cannot feel pain. It sounds like a superpower; it is actually dangerous, because they never know when they are hurt.',
  reconstructed: 'After a serious accident, half of this housemate\'s face had to be rebuilt by surgeons. You would never know it, and that is exactly how they want it.',
  'one-kidney': 'This housemate gave one of their kidneys to their brother, to save his life. They have one left, and no regrets at all.',
  'colour-blind': 'This housemate sees the world without colours: everything is in shades of grey. They have learned to guess very well, so nobody has ever noticed.',
  // ── family ──
  swapped: 'At the hospital, the day they were born, this housemate went home with the wrong family. They only found out years later.',
  'sixteen-siblings': 'This housemate is the eldest of sixteen brothers and sisters, and practically raised half of them. A house full of strangers will feel like home.',
  'lost-twin': 'Until they were twenty, this housemate had no idea they had a twin. Then one day, somebody with their face knocked on the door.',
  royal: 'Royal blood runs in this housemate\'s family: there is a crown, a few generations back, and the papers to prove it.',
  'famous-parent': 'This housemate\'s father is a famous athlete, a name everybody in that house would know. They have spent their whole life wanting to be known for something else.',
  'adopted-by-circus': 'This housemate grew up in a circus family, on the road, a different town every week. A house with walls that stay put is the strange part for them.',
  // ── past ──
  'child-star': 'As a child, this housemate was in a soap opera, every evening on television. Some people in that house may well have watched them grow up without knowing it.',
  prison: 'This housemate was born in a prison, where their mother was serving her sentence, and spent their first years there.',
  homeless: 'For a whole year, this housemate lived in their car, with everything they owned on the back seat. Nobody around them knew.',
  cult: 'This housemate grew up inside a cult, cut off from the world, and one night they found the courage to run. They have been rebuilding their life ever since.',
  'rich-to-zero': 'At twenty, this housemate was a millionaire. By twenty-two, every cent was gone. They know exactly how fast money disappears.',
  'former-monk': 'For one whole year, this housemate did not say a single word: a year of total silence, by choice. In a house where everybody talks all day, that is quite a past.',
  // ── belief ──
  ghosts: 'This housemate hunts ghosts for a living: haunted houses, night after night, cameras and recorders running. They take it very seriously.',
  medium: 'This housemate says they can talk to the dead, and people come from all over to sit with them. Whatever you believe, they believe it completely.',
  aliens: 'This housemate is convinced they were taken by aliens one night, and brought back hours later with no memory of where they had been.',
  sleepwalker: 'This housemate sleepwalks, and has done some very strange things asleep: cooked a meal, gone out to the street, even driven. Everybody sharing a bedroom with them is about to find out.',
  lucky: 'This housemate has won the lottery, not once, but twice. Of all the secrets in that house, this might be the one people would most like to be true.',
  // ── love ──
  'married-ten': 'This housemate has been married five times already. Five weddings, five divorces, and they still believe in love.',
  'love-letters': 'Every day for ten years, this housemate has written a love letter to the same person. Not one has ever been sent.',
  'engaged-tv': 'This housemate proposed on live television, on one knee, in front of the whole country. The answer was no.',
  arranged: 'This housemate is engaged to somebody they have never met, chosen by their family. The wedding is already planned, and they will meet on the day.',
  // ── money ──
  treasure: 'Digging in their garden, this housemate hit a box full of old gold coins: a real buried treasure. They have kept it very quiet ever since.',
  heir: 'There is a fortune waiting for this housemate, on one condition: they have to stay single until they are thirty. Romance in that house could cost them everything.',
  'gave-away': 'This housemate won a lot of money, and gave every last cent of it away. In a game where everybody fights for their kitty, that tells you a lot.',
};

/** A secret the user wrote: by its kind, the secret said back in a sentence of the host's. */
const BY_KIND = {
  survived: ['Somebody in that house came very close to not being here at all. They do not talk about it, and they have never let it define them.',
    'That is a real story of survival. Whoever it is in there, they came through something most people never have to face.'],
  talent: ['Somebody in there has spent years getting very good at this, and almost nobody who knows them has ever seen it.',
    'It is a real gift, and its owner has kept it hidden for a long time. In that house, hiding it will be harder.'],
  record: ['That took years of work, and whoever it is would much rather you met them first, and found out later.',
    'A title like that, they earned the hard way. In there, they cannot let it show.'],
  job: ['That is what somebody in there does for a living, and they have learned that the moment people hear it, they look at them differently.',
    'It is a real job, and a proud one. In that house, it is a secret.'],
  body: ['You would never know it, looking at them. It is part of who they are, and they would like the others to meet the rest first.',
    'It took them a long time to be at peace with it. They just do not want it to be the first thing anybody knows.'],
  family: ['It is their family\'s story as much as theirs, and it explains a lot about who they are today.',
    'A family story like that, you do not tell to strangers. Not until you trust them.'],
  past: ['That was another life. They are not the same person now, but it made them who they are.',
    'They have left that part of their life behind. The question is whether the house will let them.'],
  belief: ['People laugh at first. Then they hear the whole story, and they stop laughing.',
    'Whatever you think of it, the person hiding this one believes in it completely.'],
  love: ['A love story like that is the hardest kind of secret to keep, because the heart always gives it away.',
    'It is the most romantic thing that ever happened to them, and the most complicated.'],
  money: ['Money changes the way people look at you, overnight. That is exactly why this one stays hidden.',
    'In a game where everybody fights over a kitty, a secret about money is a dangerous one to carry.'],
};

/** What the host says about a secret after reading it out (`i` rotates the kind's sentences). */
export function secretExplained(secret, i = 0) {
  const own = secret?.poolId && SECRET_STORIES[secret.poolId];
  if (own) return own;
  const pool = BY_KIND[secret?.secretKind] || BY_KIND[secret?.kind] || BY_KIND.past;
  return pool[((i % pool.length) + pool.length) % pool.length];
}
