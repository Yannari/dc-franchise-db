// ══════════════════════════════════════════════════════════════════════
// td/script/lines/life.js — everyday camp life, with somebody there to see it
// ══════════════════════════════════════════════════════════════════════
//
// camp-events.js decides each moment. A moment that used to be one person alone (hard
// work, an injury, a superstition) now has a witness: {b}, the tribemate closest to {a}
// (by bond, no dice), who reacts. A moment the venue wrote (settings.js: the weather on
// this set, the animal at this camp) opens with the venue's own sentence as its stage
// direction; these lines are what the people in it say after.
//
// life.work.any         {a} does the chores nobody wants; {b} notices.
// life.hurt.any         {a} gets hurt; {b} helps.
// life.build.any        {a} fixed something for everyone (the venue says what); {b} reacts.
// life.charm.any        {a}'s lucky ritual; {b} asks about it.
// life.dream.<seer|home>  {a} tells {b} a dream: one that felt like a warning / about home.
// life.critter.any      an animal turned up (the venue says which); {a} and {b} react.
// life.atmos.any        the venue's moment ({a} and {b} in it); they talk after.
// life.weather.any      the weather turned (the venue says how); {a} and {b} deal with it.
// life.floater.any      {a} goes unnoticed, on purpose; {b} realises it.
// life.underdog.<driven|unseen>  {a} keeps going against the odds; {b} sees it.
// life.surprise.any     {a}, who nobody rated, is good at something; {b} is stunned.
// life.weird.<argue|bond|bold|shy>  Total Drama absurdity: {a} and {b} fight about
//                       something dumb / bond over it / {a} leans into it / {a} is mortified.
// life.mood.any         a quiet day; {a} and {b}.
// life.homesick.any     {a} misses home; {b} notices.
// life.favorite.any     the host plays favourites with {b}; {a} sees it.
// life.beast.<machine|strong|worker>  {a} trains like a monster; {b} watches, worried.
// life.wakeup.<clap|snap>  the host wakes camp up horribly: {a} claps back / {a} and {b} snap.
// hosted.slop.<bad|good>   Chef's food: {a} and {b} fight over it / suffer through it together.
// hosted.raid.<mean|fun>   after lights-out at the cabins: {a} raids {b}'s things / a night run.
// hosted.story.any      {a} tells {b} a story at the campfire.
// friend.drift.any      {a} quietly pulls away from {b}, a close friend.
// friend.rekindle.any   {a} and {b} find their way back to each other.
// friend.unbreakable.any  {a} and {b}, as close as it gets.
// friend.rideordie.any  {a} and {b} would go to the end for each other.
// Ids: 'lf.'.

const WORK = [
  { id: 'lf.w1', turns: [
    { beat: '{a} is up before everyone else, hauling water and stacking wood without a word.' },
    { by: 'b', say: "Do you ever sleep?" },
    { by: 'a', say: "After." },
    { by: 'b', conf: "Nobody asked {a} to do it. Everybody noticed." },
  ] },
  { id: 'lf.w2', turns: [
    { by: 'b', say: "You fixed the thing everyone was complaining about." },
    { by: 'a', say: "Someone had to." },
    { by: 'b', say: "We've been complaining for three days." },
    { by: 'a', say: "Exactly." },
  ] },
  { id: 'lf.w3', when: { loyal: true }, turns: [
    { by: 'a', conf: "I don't do the chores to look good. I do them because if everyone waits for someone else, nothing gets done." },
    { by: 'b', say: "Need a hand?" },
    { by: 'a', say: "Always." },
  ] },
  { id: 'lf.w4', turns: [
    { beat: '{a} takes the jobs nobody else will touch. Again.' },
    { by: 'b', say: "You know nobody's grading this, right?" },
    { by: 'a', say: "I'm grading it." },
  ] },
  { id: 'lf.w5', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Done. What's next?" },
    { by: 'b', say: "That was supposed to take all morning." },
    { by: 'a', say: "Then I've got the whole afternoon." },
  ] },
  { id: 'lf.w6', when: { register: 'schemer' }, turns: [
    { by: 'b', say: "You're working hard today." },
    { by: 'a', say: "I'm working visibly today. There's a difference." },
    { by: 'a', conf: "Nobody votes out the person who keeps them fed. That's not kindness. That's insurance." },
  ] },
  { id: 'lf.w7', when: { age: 'older' }, turns: [
    { by: 'b', say: "Let me get that for you." },
    { by: 'a', say: "I've been carrying heavier things than this since before you were born." },
    { by: 'b', conf: "{a} out-worked all of us today. All of us. I'm embarrassed." },
  ] },
  { id: 'lf.w8', turns: [
    { beat: '{a} covers the whole camp\'s chores. Twice.' },
    { by: 'b', conf: "{a} didn't brag about it once. That's why I trust {a}." },
  ] },
  { id: 'lf.w9', when: { register: 'sweet' }, turns: [
    { by: 'b', say: "You did my water run." },
    { by: 'a', say: "You looked tired." },
    { by: 'b', say: "You look tired too." },
    { by: 'a', say: "Yeah, but I'm used to it." },
  ] },
  { id: 'lf.w10', turns: [
    { by: 'b', say: "Why do you always do the worst jobs?" },
    { by: 'a', say: "Because then I never have to argue about who does them." },
  ] },
];
const HURT = [
  { id: 'lf.h1', turns: [
    { beat: '{a} goes down hard, clutching {a.posAdj} ankle.' },
    { by: 'b', say: "Don't move. Let me look." },
    { by: 'a', say: "It's fine. It's totally fine." },
    { by: 'b', say: "It's purple." },
    { by: 'a', conf: "Everybody's looking at me differently now. Like a weak link. I hate it." },
  ] },
  { id: 'lf.h2', turns: [
    { by: 'b', say: "Lean on me." },
    { by: 'a', say: "I can walk." },
    { by: 'b', say: "You can limp. Lean on me." },
    { by: 'b', conf: "{a} won't be the same in the next challenge. Everybody knows it. Nobody says it." },
  ] },
  { id: 'lf.h3', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "It's nothing. I can still compete." },
    { by: 'b', say: "You can't even stand." },
    { by: 'a', say: "I'll compete sitting down." },
  ] },
  { id: 'lf.h4', turns: [
    { beat: "{a} collapses after a long day in the sun. {b} gets there first." },
    { by: 'b', say: "Drink this. Slowly." },
    { by: 'a', say: "Thanks." },
    { by: 'a', conf: "Nobody's going to want me on their side now. I can feel it already." },
  ] },
  { id: 'lf.h5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Stupid rock! Who put that rock there?!" },
    { by: 'b', say: "Nature, probably." },
    { by: 'a', say: "Then nature can get voted out!" },
  ] },
  { id: 'lf.h6', turns: [
    { by: 'b', say: "That looks bad." },
    { by: 'a', say: "Don't say that so loud. People will hear." },
    { by: 'b', say: "Everybody already heard you scream." },
  ] },
  { id: 'lf.h7', when: { age: 'older' }, turns: [
    { by: 'a', say: "Twenty years ago I'd have walked that off." },
    { by: 'b', say: "And now?" },
    { by: 'a', say: "Now I'm going to sit down for a while and complain about it." },
  ] },
  { id: 'lf.h8', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I'm sorry. I'm going to be useless for a few days." },
    { by: 'b', say: "You're not useless. You're hurt. Different thing." },
  ] },
];
const BUILD = [
  { id: 'lf.bd1', turns: [
    { by: 'b', say: "Did you do all this?" },
    { by: 'a', say: "Took all afternoon." },
    { by: 'b', say: "It's amazing." },
    { by: 'b', conf: "{a} made this place a little less miserable. I'm not voting for someone who does that." },
  ] },
  { id: 'lf.bd2', turns: [
    { by: 'b', say: "You know nobody's going to thank you for this." },
    { by: 'a', say: "You just did, sort of." },
  ] },
  { id: 'lf.bd3', when: { strong: true }, turns: [
    { by: 'b', say: "How did you even lift that?" },
    { by: 'a', say: "With my arms." },
    { by: 'b', conf: "{a} hauled more in an hour than the rest of us did all week." },
  ] },
  { id: 'lf.bd4', turns: [
    { by: 'a', say: "Try it out. Go on." },
    { by: 'b', say: "Okay, that's actually so much better." },
    { by: 'a', conf: "If everyone's comfortable, nobody's in a bad mood. If nobody's in a bad mood, nobody's looking for someone to blame." },
  ] },
  { id: 'lf.bd5', when: { register: 'schemer' }, turns: [
    { by: 'b', say: "That's really generous of you." },
    { by: 'a', say: "I'm a generous person." },
    { by: 'a', conf: "I'm a person who remembers that people vote with their stomachs and their backs." },
  ] },
  { id: 'lf.bd6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I just wanted it to feel a little more like home." },
    { by: 'b', say: "It does now." },
  ] },
  { id: 'lf.bd7', turns: [
    { by: 'b', say: "Need help?" },
    { by: 'a', say: "Nope. Just finished." },
    { by: 'b', say: "Of course you did." },
  ] },
  { id: 'lf.bd8', when: { age: 'older' }, turns: [
    { by: 'b', say: "Where did you learn to do this?" },
    { by: 'a', say: "Forty years of things breaking at the worst time." },
  ] },
];
const CHARM = [
  { id: 'lf.c1', turns: [
    { beat: '{a} taps a smooth rock three times before every challenge.' },
    { by: 'b', say: "What's with the rock?" },
    { by: 'a', say: "It's lucky." },
    { by: 'b', say: "We lost last time." },
    { by: 'a', say: "Not as badly as we could have." },
  ] },
  { id: 'lf.c2', turns: [
    { by: 'b', say: "Why won't you eat before a challenge?" },
    { by: 'a', say: "Last time I did, I fell off the thing." },
    { by: 'b', say: "That was because of the thing. Not the food." },
    { by: 'a', say: "We don't know that." },
  ] },
  { id: 'lf.c3', turns: [
    { by: 'a', say: "Don't step on that line. It's bad luck." },
    { by: 'b', say: "It's a line in the sand." },
    { by: 'a', say: "And now it's a bad luck line in the sand." },
  ] },
  { id: 'lf.c4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Who touched my lucky sock?!" },
    { by: 'b', say: "Nobody wants your sock." },
    { by: 'a', say: "Then why is it on the WRONG ROCK?" },
  ] },
  { id: 'lf.c5', when: { sharp: true }, turns: [
    { by: 'a', say: "Something bad's going to happen today. I can feel it." },
    { by: 'b', say: "You said that yesterday." },
    { by: 'a', say: "And something bad happened yesterday." },
    { by: 'b', conf: "I hate that {a} is usually right." },
  ] },
  { id: 'lf.c6', turns: [
    { by: 'b', say: "You've been wearing that shirt for five days." },
    { by: 'a', say: "We haven't lost in five days." },
    { by: 'b', say: "Wash it after we lose, then." },
  ] },
  { id: 'lf.c7', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I wished on a shell this morning. For all of us." },
    { by: 'b', say: "What did you wish for?" },
    { by: 'a', say: "If I tell you, it won't come true." },
  ] },
  { id: 'lf.c8', turns: [
    { beat: '{a} spins around twice before stepping onto the path every morning.' },
    { by: 'b', conf: "Nobody asks about it anymore. We just wait for {a} to spin." },
  ] },
];
const DREAM_SEER = [
  { id: 'lf.ds1', turns: [
    { by: 'a', say: "I dreamed about who's going home next." },
    { by: 'b', say: "Who?" },
    { by: 'a', say: "I'm not saying." },
    { by: 'b', conf: "Nobody laughed. {a}'s reads have been too right for that." },
  ] },
  { id: 'lf.ds2', turns: [
    { by: 'a', say: "Last night I dreamed the challenge was in the water. Then it was." },
    { by: 'b', say: "That's creepy." },
    { by: 'a', say: "That's useful." },
  ] },
  { id: 'lf.ds3', turns: [
    { by: 'b', say: "What did you dream about?" },
    { by: 'a', say: "A snake. Wearing a crown. Sitting right here at the fire." },
    { by: 'b', say: "That's oddly specific." },
    { by: 'a', conf: "I know who the snake is. I'm not telling {b} yet." },
  ] },
  { id: 'lf.ds4', when: { register: 'cool' }, turns: [
    { by: 'a', say: "I had a dream I was the last one here. Everyone else was gone." },
    { by: 'b', say: "Was it a good dream?" },
    { by: 'a', say: "It was a quiet dream." },
  ] },
  { id: 'lf.ds5', turns: [
    { by: 'a', say: "Don't trust the quiet ones today. I dreamed about it." },
    { by: 'b', say: "Am I a quiet one?" },
    { by: 'a', say: "Today? Very." },
  ] },
  { id: 'lf.ds6', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I dreamed you and I made it to the end." },
    { by: 'b', say: "Really?" },
    { by: 'a', conf: "I didn't dream that. I said it to see {b}'s face. {b} liked it. Noted." },
  ] },
];
const DREAM_HOME = [
  { id: 'lf.dh1', turns: [
    { by: 'a', say: "I dreamed I was home. In my own bed. Somebody was making breakfast." },
    { by: 'b', say: "Stop. You're going to make me cry." },
    { by: 'a', say: "There were pancakes." },
    { by: 'b', say: "I'm crying." },
  ] },
  { id: 'lf.dh2', turns: [
    { by: 'a', say: "I had a dream about my old school last night. Everyone was there." },
    { by: 'b', say: "Was I there?" },
    { by: 'a', say: "You were the principal." },
    { by: 'b', say: "Was I a good principal?" },
  ] },
  { id: 'lf.dh3', turns: [
    { beat: '{a} tells the whole story of a dream about home over breakfast. Half the camp tears up.' },
    { by: 'b', conf: "I didn't want to hear about home. Now I can't stop thinking about it." },
  ] },
  { id: 'lf.dh4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I dreamed about a cheeseburger and woke up so angry." },
    { by: 'b', say: "At the burger?" },
    { by: 'a', say: "At REALITY." },
  ] },
  { id: 'lf.dh5', when: { home: true }, turns: [
    { by: 'a', say: "I dreamed I was back in {home}. Just walking around." },
    { by: 'b', say: "What was it like?" },
    { by: 'a', say: "Normal. I miss normal." },
  ] },
  { id: 'lf.dh6', turns: [
    { by: 'b', say: "You were laughing in your sleep last night." },
    { by: 'a', say: "Was I? I dreamed a dog was my dentist." },
    { by: 'b', say: "Was he a good dentist?" },
  ] },
];
const CRITTER = [
  { id: 'lf.cr1', turns: [
    { by: 'b', say: "Did you see that?!" },
    { by: 'a', say: "I'm going to pretend I didn't." },
    { by: 'b', conf: "We're adults. We screamed. Both of us." },
  ] },
  { id: 'lf.cr2', turns: [
    { by: 'a', say: "Is it gone?" },
    { by: 'b', say: "I think so." },
    { by: 'a', say: "Check again." },
    { by: 'b', say: "You check again!" },
  ] },
  { id: 'lf.cr3', turns: [
    { by: 'a', say: "I'm naming it." },
    { by: 'b', say: "You can't name it. It's wild." },
    { by: 'a', say: "Its name is Gerald now." },
  ] },
  { id: 'lf.cr4', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Aw, it's just scared. Like us." },
    { by: 'b', say: "It stole our food." },
    { by: 'a', say: "Scared and hungry. Like us." },
  ] },
  { id: 'lf.cr5', when: { bold: true }, turns: [
    { by: 'b', say: "Don't touch it!" },
    { by: 'a', say: "Too late." },
    { by: 'b', conf: "{a} has no fear. {a} also has no sense. Those might be the same thing." },
  ] },
  { id: 'lf.cr6', turns: [
    { by: 'b', say: "It's a sign." },
    { by: 'a', say: "Of what?" },
    { by: 'b', say: "I don't know yet. But it's definitely a sign." },
  ] },
];
const ATMOS = [
  { id: 'lf.at1', turns: [
    { by: 'a', say: "Okay, that was actually fun." },
    { by: 'b', say: "Don't tell anyone. We have reputations." },
  ] },
  { id: 'lf.at2', turns: [
    { by: 'b', say: "Best afternoon we've had out here." },
    { by: 'a', say: "Low bar." },
    { by: 'b', say: "Still counts." },
  ] },
  { id: 'lf.at3', turns: [
    { by: 'a', say: "Same time tomorrow?" },
    { by: 'b', say: "If we're both still here." },
    { by: 'a', conf: "That's the thing about this game. Every good moment comes with an \"if\"." },
  ] },
  { id: 'lf.at4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "Spending an afternoon with {b} doing nothing was the most useful thing I did all day. People trust who they waste time with." },
  ] },
  { id: 'lf.at5', turns: [
    { by: 'b', conf: "For a whole hour I forgot this was a game. Then I remembered. Still, an hour." },
  ] },
  { id: 'lf.at6', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "I'm keeping score." },
    { by: 'b', say: "Of what?" },
    { by: 'a', say: "Everything. You're losing." },
  ] },
  { id: 'lf.at7', turns: [
    { by: 'a', say: "We should do that again." },
    { by: 'b', say: "We should definitely not do that again." },
    { by: 'a', say: "We're doing it again." },
  ] },
  { id: 'lf.at8', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I'm glad it was you I did that with." },
    { by: 'b', say: "Me too. Weirdly." },
  ] },
];
const WEATHER = [
  { id: 'lf.we1', turns: [
    { by: 'b', say: "Is it ever going to stop?" },
    { by: 'a', say: "Eventually. Probably. Maybe." },
    { by: 'b', conf: "Everyone's in a bad mood. Bad moods vote." },
  ] },
  { id: 'lf.we2', turns: [
    { by: 'a', say: "Scoot over. It's warmer by you." },
    { by: 'b', say: "Is that a compliment?" },
    { by: 'a', say: "It's a survival strategy." },
  ] },
  { id: 'lf.we3', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I hate this! I hate ALL of this!" },
    { by: 'b', say: "The weather can't hear you." },
    { by: 'a', say: "Then I'll yell LOUDER!" },
  ] },
  { id: 'lf.we4', turns: [
    { by: 'b', say: "At least we're miserable together." },
    { by: 'a', say: "That's the nicest thing anyone's said all week." },
  ] },
  { id: 'lf.we5', when: { register: 'cool' }, turns: [
    { beat: '{b} is huddled next to {a}, shivering.' },
    { by: 'a', conf: "Bad weather makes people talk. People who are cold and bored say things they shouldn't. I'm listening." },
  ] },
  { id: 'lf.we6', turns: [
    { by: 'a', say: "This is the worst day." },
    { by: 'b', say: "You said that yesterday." },
    { by: 'a', say: "And I was right then too." },
  ] },
  { id: 'lf.we7', when: { age: 'older' }, turns: [
    { by: 'b', say: "How are you not complaining?" },
    { by: 'a', say: "I've been through worse weather on my way to work." },
  ] },
  { id: 'lf.we8', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Want to share my blanket?" },
    { by: 'b', say: "You have a blanket?" },
    { by: 'a', say: "Well. Half a blanket. You can have the other half." },
  ] },
];
const FLOATER = [
  { id: 'lf.fl1', turns: [
    { by: 'b', say: "Wait, were you here the whole time?" },
    { by: 'a', say: "The whole time." },
    { by: 'b', conf: "People say everything in front of {a}. They forget {a} is there. I almost did too." },
  ] },
  { id: 'lf.fl2', turns: [
    { beat: "{b} talks strategy right in front of {a}, like {a} isn't there." },
    { by: 'a', conf: "Nobody thinks I'm a threat. Nobody's even thinking about me. That's the plan. Everybody forgets the plan is a plan." },
  ] },
  { id: 'lf.fl3', turns: [
    { by: 'b', say: "What do you think about the vote?" },
    { by: 'a', say: "Whatever you think." },
    { by: 'b', conf: "{a} always agrees. With everyone. I'm starting to wonder if that's a strategy." },
  ] },
  { id: 'lf.fl4', when: { register: 'schemer' }, turns: [
    { beat: '{b} walks right past {a} without a glance.' },
    { by: 'a', conf: "I've been invisible for ten days. Do you know what people tell you when they forget you're listening? Everything." },
  ] },
  { id: 'lf.fl5', turns: [
    { by: 'b', say: "I feel like I haven't seen you all day." },
    { by: 'a', say: "I've been right here." },
    { by: 'b', say: "Huh." },
  ] },
  { id: 'lf.fl6', when: { register: 'shy' }, turns: [
    { beat: '{b} is chatting away, not noticing {a} at all.' },
    { by: 'a', conf: "Being quiet is easy for me. It's just now, it's also working." },
  ] },
];
const UNDERDOG_DRIVEN = [
  { id: 'lf.ud1', turns: [
    { by: 'b', say: "How are you still going?" },
    { by: 'a', say: "Because everybody expects me not to." },
    { by: 'a', conf: "I have no business still being here. I know that. That's exactly what keeps me going." },
  ] },
  { id: 'lf.ud2', turns: [
    { by: 'a', say: "I'm not the strongest. I'm not the smartest. But I'll still be here tomorrow." },
    { by: 'b', say: "That's kind of inspiring." },
    { by: 'a', say: "It's kind of all I've got." },
  ] },
  { id: 'lf.ud3', when: { age: 'teen' }, turns: [
    { by: 'b', say: "Everyone thought you'd be first out." },
    { by: 'a', say: "Everyone was wrong." },
  ] },
  { id: 'lf.ud4', turns: [
    { by: 'b', conf: "{a} keeps showing up. Every day. Every challenge. Never the best. Never gives up. I'm starting to really respect that." },
  ] },
  { id: 'lf.ud5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I'm just happy to still be here." },
    { by: 'b', say: "You keep saying that." },
    { by: 'a', say: "I keep being here." },
  ] },
  { id: 'lf.ud6', turns: [
    { by: 'a', say: "Nobody's ever bet on me. Not once." },
    { by: 'b', say: "I'd bet on you." },
    { by: 'a', conf: "That's the first time anyone's said that to me. In my life." },
  ] },
];
const UNDERDOG_UNSEEN = [
  { id: 'lf.uu1', turns: [
    { by: 'b', conf: "{a} doesn't fit the profile of someone who makes it far. {a} is still here. Still helping. Still invisible on everyone's threat list." },
  ] },
  { id: 'lf.uu2', turns: [
    { by: 'a', say: "Need help with that?" },
    { by: 'b', say: "Oh. I didn't see you there." },
    { by: 'a', say: "Nobody does." },
  ] },
  { id: 'lf.uu3', turns: [
    { beat: '{b} hands everyone water and skips {a} without thinking.' },
    { by: 'a', conf: "Everybody writes me off. That's fine. Write me off all the way to the end." },
  ] },
  { id: 'lf.uu4', when: { register: 'shy' }, turns: [
    { by: 'b', say: "You've been really helpful today." },
    { by: 'a', say: "Oh. Thanks. I didn't think anyone noticed." },
    { by: 'b', say: "I noticed." },
  ] },
  { id: 'lf.uu5', turns: [
    { by: 'b', say: "How have you lasted this long?" },
    { by: 'a', say: "By being the person nobody's worried about." },
  ] },
  { id: 'lf.uu6', when: { age: 'older' }, turns: [
    { beat: "{b} offers to carry {a}'s things, again, without being asked." },
    { by: 'a', conf: "They see someone my age and think I'm here for the vacation. Let them think it." },
  ] },
];
const SURPRISE = [
  { id: 'lf.su1', turns: [
    { beat: "{a} solves the thing everyone's been arguing about how to fix, in about thirty seconds." },
    { by: 'b', say: "How did you do that?" },
    { by: 'a', say: "You just twist it." },
    { by: 'b', conf: "Everybody underestimated {a}. Including me. That's a mistake I'm going to fix." },
  ] },
  { id: 'lf.su2', turns: [
    { by: 'b', say: "Since when can you do that?" },
    { by: 'a', say: "Since always. Nobody asked." },
  ] },
  { id: 'lf.su3', when: { register: 'shy' }, turns: [
    { by: 'b', say: "That was incredible!" },
    { by: 'a', say: "It was just a knot." },
    { by: 'b', say: "It was an INCREDIBLE knot." },
  ] },
  { id: 'lf.su4', turns: [
    { by: 'b', conf: "Everyone's doing a quiet recount of who they thought {a} was. Me first." },
  ] },
  { id: 'lf.su5', when: { register: 'schemer' }, turns: [
    { by: 'b', say: "You've been hiding that this whole time?" },
    { by: 'a', say: "Hiding is a strong word. Saving." },
  ] },
  { id: 'lf.su6', turns: [
    { beat: "{a} hauls more than {a.posAdj} own weight across camp without a word, drops it, and goes back for more." },
    { by: 'b', say: "Okay. Who ARE you?" },
  ] },
];
const WEIRD_ARGUE = [
  { id: 'lf.wa1', turns: [
    { by: 'a', say: "A hot dog is a sandwich." },
    { by: 'b', say: "It is absolutely not a sandwich." },
    { by: 'a', say: "Bread. Filling. Sandwich." },
    { beat: 'Within ten minutes the whole camp has picked a side.' },
    { by: 'b', conf: "This is going to decide the vote. I'm serious." },
  ] },
  { id: 'lf.wa2', turns: [
    { by: 'b', say: "There is no way a seagull could carry a coconut." },
    { by: 'a', say: "A big seagull could." },
    { by: 'b', say: "There's no such thing as a big seagull!" },
    { by: 'a', say: "Have you SEEN the seagulls here?" },
  ] },
  { id: 'lf.wa3', turns: [
    { by: 'a', say: "You're folding your clothes wrong." },
    { by: 'b', say: "There's no wrong way to fold a shirt." },
    { by: 'a', say: "And yet." },
    { by: 'b', conf: "We stopped talking over a shirt. A SHIRT." },
  ] },
  { id: 'lf.wa4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Cereal is a soup!" },
    { by: 'b', say: "Take that back!" },
    { by: 'a', say: "NEVER!" },
    { beat: 'The camp splits into two very loud camps.' },
  ] },
  { id: 'lf.wa5', turns: [
    { by: 'b', say: "The moon is not following us." },
    { by: 'a', say: "Then why is it always THERE?" },
    { by: 'b', conf: "I lost an hour of my life to the moon argument. I'll never get it back." },
  ] },
  { id: 'lf.wa6', turns: [
    { by: 'a', say: "Water is wet." },
    { by: 'b', say: "Water makes things wet. It isn't wet itself." },
    { by: 'a', say: "That's the dumbest thing I've ever heard." },
    { by: 'b', say: "Then why are you so upset?" },
  ] },
];
const WEIRD_BOND = [
  { id: 'lf.wb1', turns: [
    { by: 'a', say: "Want to see if we can teach a crab to dance?" },
    { by: 'b', say: "Obviously." },
    { beat: 'Two hours later, the crab has not learned to dance. {a} and {b} have learned they are best friends.' },
  ] },
  { id: 'lf.wb2', turns: [
    { by: 'b', say: "Why are we building a tiny chair?" },
    { by: 'a', say: "For a tiny guest." },
    { by: 'b', say: "What tiny guest?" },
    { by: 'a', say: "We'll know when they arrive." },
  ] },
  { id: 'lf.wb3', turns: [
    { by: 'a', say: "Let's give every tree a name." },
    { by: 'b', say: "There are hundreds of trees." },
    { by: 'a', say: "Then we'd better start." },
    { by: 'b', conf: "We named forty trees. Everyone thinks we've lost it. It was the best day I've had out here." },
  ] },
  { id: 'lf.wb4', turns: [
    { by: 'b', say: "Is that a rock wearing sunglasses?" },
    { by: 'a', say: "His name is Rocky. He's our new teammate." },
    { by: 'b', say: "Does Rocky get a vote?" },
    { by: 'a', say: "Rocky gets two." },
  ] },
  { id: 'lf.wb5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Scream contest. Into the ocean. Loudest wins." },
    { by: 'b', say: "Why?" },
    { by: 'a', say: "Because we're losing our minds and it's free." },
    { beat: 'They scream. It helps. The others think they are insane.' },
  ] },
  { id: 'lf.wb6', turns: [
    { by: 'a', say: "Okay, you be the host. I'll be the challenge." },
    { by: 'b', say: "How can you be a challenge?" },
    { beat: '{a} demonstrates. {b} cannot stop laughing.' },
  ] },
];
const WEIRD_BOLD = [
  { id: 'lf.wo1', turns: [
    { beat: '{a} trips, falls into the water fully clothed, stands up, and takes a bow.' },
    { by: 'b', say: "Ten out of ten." },
    { by: 'a', say: "Thank you. I'll be here all season." },
  ] },
  { id: 'lf.wo2', turns: [
    { by: 'a', say: "Morning, everyone! I've decided to talk like a pirate today." },
    { by: 'b', say: "Why?" },
    { by: 'a', say: "ARR. Because." },
    { by: 'b', conf: "{a} talked like a pirate all day. By dinner half of us were doing it too." },
  ] },
  { id: 'lf.wo3', turns: [
    { beat: 'A bird steals {a}\'s food right out of {a.posAdj} hand. {a} chases it, shouting threats.' },
    { by: 'b', say: "You lost to a bird." },
    { by: 'a', say: "I made a statement to a bird." },
  ] },
  { id: 'lf.wo4', turns: [
    { by: 'a', say: "Okay, I just got stuck in a tree. Help. But also, look how high I got." },
    { by: 'b', say: "How did you get up there?" },
    { by: 'a', say: "Confidence." },
  ] },
  { id: 'lf.wo5', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "I just lost a race to a crab. Rematch. Right now." },
    { by: 'b', say: "It went into the water." },
    { by: 'a', say: "Coward!" },
  ] },
  { id: 'lf.wo6', turns: [
    { beat: "{a}'s pants rip in front of the entire camp. {a} doesn't even flinch." },
    { by: 'a', say: "Air conditioning." },
    { by: 'b', conf: "Anyone else would have died of embarrassment. {a} turned it into a bit. Respect." },
  ] },
];
const WEIRD_SHY = [
  { id: 'lf.wy1', turns: [
    { beat: "{a} trips over nothing in front of everyone and goes bright red." },
    { by: 'b', say: "You okay?" },
    { by: 'a', say: "Please stop looking at me." },
    { by: 'a', conf: "I want to dig a hole and live in it. Forever." },
  ] },
  { id: 'lf.wy2', turns: [
    { by: 'b', say: "Did you just talk to that tree?" },
    { by: 'a', say: "No." },
    { by: 'b', say: "You said \"excuse me\" to a tree." },
    { by: 'a', say: "It was in my way." },
  ] },
  { id: 'lf.wy3', turns: [
    { beat: '{a} waves back at someone who was waving at somebody else.' },
    { by: 'b', say: "Oh, no." },
    { by: 'a', conf: "I'm never waving at anyone ever again." },
  ] },
  { id: 'lf.wy4', turns: [
    { beat: "{a}'s stomach growls so loud during a quiet moment that everyone turns." },
    { by: 'a', say: "That wasn't me." },
    { by: 'b', say: "It was a little bit you." },
  ] },
  { id: 'lf.wy5', when: { age: 'teen' }, turns: [
    { by: 'a', say: "Can we pretend that didn't happen?" },
    { by: 'b', say: "What didn't happen?" },
    { by: 'a', say: "Thank you." },
  ] },
  { id: 'lf.wy6', turns: [
    { by: 'b', say: "You called the host \"Mom\"." },
    { by: 'a', say: "I did not." },
    { by: 'b', say: "You absolutely did. Everyone heard." },
    { by: 'a', conf: "I called the host Mom. I'm leaving the game. Not literally. Emotionally." },
  ] },
];
const MOOD = [
  { id: 'lf.mo1', turns: [
    { beat: 'Nobody makes a move today. {a} and {b} hang back and talk about nothing.' },
    { by: 'b', say: "Feels weird, doesn't it? A day with no drama." },
    { by: 'a', say: "Don't jinx it." },
  ] },
  { id: 'lf.mo2', turns: [
    { beat: "{a} and {b} exchange a look across camp that says everything the game won't let them say out loud." },
    { by: 'a', conf: "Some days you just need one person who gets it. Today that was {b}." },
  ] },
  { id: 'lf.mo3', turns: [
    { by: 'a', say: "Everyone's so quiet today." },
    { by: 'b', say: "Calm before the storm." },
    { by: 'a', say: "You had to say storm." },
  ] },
  { id: 'lf.mo4', turns: [
    { by: 'b', say: "What are you thinking about?" },
    { by: 'a', say: "Nothing. For once. It's nice." },
  ] },
  { id: 'lf.mo5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Quiet days make me nervous." },
    { by: 'b', say: "Why?" },
    { by: 'a', say: "Because somebody's planning something. And it isn't me." },
  ] },
  { id: 'lf.mo6', turns: [
    { beat: 'There is a moment at sunset when the game disappears. For everybody, briefly.' },
    { by: 'b', say: "This is nice." },
    { by: 'a', say: "Yeah. It won't last." },
    { by: 'b', say: "Let it last a minute." },
  ] },
];
const HOMESICK = [
  { id: 'lf.hs1', turns: [
    { beat: '{a} stares at the fire for a long time without saying anything.' },
    { by: 'b', say: "You okay?" },
    { by: 'a', say: "Just thinking about home." },
    { by: 'b', conf: "{a} didn't want to talk about it. So I just sat there. Sometimes that's enough." },
  ] },
  { id: 'lf.hs2', turns: [
    { by: 'a', say: "I'm fine. Really. I'm fine." },
    { by: 'b', say: "You've said fine four times." },
    { by: 'a', say: "I'm really fine." },
    { by: 'b', say: "Five." },
  ] },
  { id: 'lf.hs3', when: { home: true }, turns: [
    { by: 'a', say: "This time of year in {home}, everything smells like rain." },
    { by: 'b', say: "You miss it." },
    { by: 'a', say: "Every single day." },
  ] },
  { id: 'lf.hs4', when: { age: 'teen' }, turns: [
    { by: 'a', say: "Is it weird that I miss my room? Like, specifically my room?" },
    { by: 'b', say: "Not weird. I miss my bathroom." },
    { by: 'a', say: "Okay, that's weirder." },
  ] },
  { id: 'lf.hs5', when: { age: 'older' }, turns: [
    { by: 'a', conf: "I've got people at home who depend on me. Every day I'm here, I wonder if I made the right choice." },
    { by: 'b', say: "Hey. You okay?" },
    { by: 'a', say: "Getting there." },
  ] },
  { id: 'lf.hs6', turns: [
    { by: 'a', say: "Can I tell you something dumb? I miss my own pillow." },
    { by: 'b', say: "That's not dumb. That's the smartest thing anyone's said out here." },
  ] },
  { id: 'lf.hs7', when: { register: 'fiery' }, turns: [
    { by: 'b', say: "You're quiet today." },
    { by: 'a', say: "I'm homesick, okay? Happy now?" },
    { by: 'b', say: "No. I'm sorry." },
    { by: 'a', say: "...Thanks." },
  ] },
  { id: 'lf.hs8', turns: [
    { by: 'a', say: "What day is it, even?" },
    { by: 'b', say: "I genuinely don't know." },
    { by: 'a', conf: "I lost track of the days. That's when it hit me how far from home I am." },
  ] },
];
const FAVORITE = [
  { id: 'lf.fv1', turns: [
    { beat: 'The host singles {b} out for praise again, and slips {b.obj} an extra snack on camera.' },
    { by: 'a', say: "Must be nice." },
    { by: 'b', say: "What?" },
    { by: 'a', say: "Nothing. Enjoy your snack." },
    { by: 'a', conf: "The host has a favourite. It's {b}. I'm not forgetting it." },
  ] },
  { id: 'lf.fv2', turns: [
    { by: 'a', say: "The host knows your name. Mine, the host calls \"you, there\"." },
    { by: 'b', say: "That's not my fault." },
    { by: 'a', say: "Isn't it?" },
  ] },
  { id: 'lf.fv3', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Oh, so {b} gets the good blanket? Of COURSE {b} does!" },
    { by: 'b', say: "I didn't ask for it!" },
    { by: 'a', say: "You didn't say no!" },
  ] },
  { id: 'lf.fv4', turns: [
    { by: 'b', conf: "The host keeps being nice to me on camera. Everybody hates me for it. I didn't do anything." },
    { by: 'a', say: "Teacher's pet." },
  ] },
  { id: 'lf.fv5', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "The audience loves {b}. The host loves {b}. That's two reasons to make sure the jury never sees {b} at the end." },
  ] },
  { id: 'lf.fv6', turns: [
    { by: 'a', say: "Did the host just high-five you?" },
    { by: 'b', say: "It was a low five." },
    { by: 'a', say: "Still a five." },
  ] },
];
const BEAST_MACHINE = [
  { id: 'lf.bm1', turns: [
    { beat: '{a} runs the length of camp. Twice. Then does the chores. Then runs it again.' },
    { by: 'b', say: "Is {a} even human?" },
    { by: 'b', conf: "I counted how many challenges {a} would have won by now. All of them. That's a problem." },
  ] },
  { id: 'lf.bm2', turns: [
    { by: 'b', say: "Do you ever stop?" },
    { by: 'a', say: "Stopping is for people who want to lose." },
    { by: 'b', conf: "{a} is preparing for something. We can all feel it." },
  ] },
  { id: 'lf.bm3', turns: [
    { by: 'a', say: "Four hundred push-ups. Who's next?" },
    { by: 'b', say: "Nobody. Nobody is next." },
  ] },
  { id: 'lf.bm4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "COME ON! AGAIN!" },
    { by: 'b', say: "Who is {a} yelling at?" },
    { beat: '{a} is yelling at {a.ref}. Mid pull-up.' },
  ] },
  { id: 'lf.bm5', turns: [
    { by: 'b', conf: "Watching {a} train is like watching a storm form on the horizon. You know it's coming for you eventually." },
  ] },
  { id: 'lf.bm6', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Want to train with me?" },
    { by: 'b', say: "I want to live." },
    { by: 'a', conf: "The more they fear me, the less they want to vote with me. Hm. Should I train less? No." },
  ] },
];
const BEAST_STRONG = [
  { id: 'lf.bs1', turns: [
    { by: 'b', say: "Those were warm-ups?" },
    { by: 'a', say: "Light ones." },
    { by: 'b', conf: "The rest of us can barely keep up with {a}'s warm-ups. I'm trying not to show it." },
  ] },
  { id: 'lf.bs2', turns: [
    { beat: '{a} works longer than everyone and shows no sign of being tired.' },
    { by: 'b', conf: "Challenge threat. A real one. I'm writing it down in my head." },
  ] },
  { id: 'lf.bs3', turns: [
    { by: 'a', say: "Want me to take that?" },
    { by: 'b', say: "I've got it." },
    { by: 'a', say: "You're shaking." },
    { by: 'b', say: "I've mostly got it." },
  ] },
  { id: 'lf.bs4', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Next challenge, I'm carrying this whole camp." },
    { by: 'b', say: "Please don't say that out loud." },
    { by: 'a', say: "Why not? It's true." },
  ] },
  { id: 'lf.bs5', turns: [
    { by: 'b', say: "How are you not tired?" },
    { by: 'a', say: "I am tired. I just don't stop." },
  ] },
  { id: 'lf.bs6', when: { age: 'older' }, turns: [
    { by: 'b', conf: "{a} is older than most of us and fitter than all of us. That's embarrassing for all of us." },
  ] },
];
const BEAST_WORKER = [
  { id: 'lf.bw1', turns: [
    { by: 'b', say: "That was supposed to take all day." },
    { by: 'a', say: "It's done." },
    { by: 'b', conf: "{a} doesn't train. {a} just works. Same result. The rest of us are noticing." },
  ] },
  { id: 'lf.bw2', turns: [
    { beat: '{a} takes the hardest job at camp without hesitating.' },
    { by: 'b', say: "You don't have to do the heavy stuff every time." },
    { by: 'a', say: "Somebody does." },
  ] },
  { id: 'lf.bw3', turns: [
    { by: 'b', say: "You'd be good at challenges if you tried." },
    { by: 'a', say: "Who says I'm not trying?" },
    { by: 'b', conf: "Oh no. {a} has been trying this whole time." },
  ] },
  { id: 'lf.bw4', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I just like being useful." },
    { by: 'b', say: "You're the most useful person here." },
    { by: 'a', say: "Don't tell anyone. They'll make me do more." },
  ] },
  { id: 'lf.bw5', turns: [
    { by: 'b', conf: "Every day {a} quietly does the hard stuff. One day everybody's going to realise {a} is a threat. I just did." },
  ] },
  { id: 'lf.bw6', turns: [
    { by: 'a', say: "Pass me the other log." },
    { by: 'b', say: "You're already carrying two." },
    { by: 'a', say: "Three is a better number." },
  ] },
];
const WAKEUP_CLAP = [
  { id: 'lf.wc1', turns: [
    { beat: 'An airhorn blasts through camp at five in the morning, courtesy of the host. Everyone groans.' },
    { by: 'a', say: "Wow. A five a.m. airhorn. Did you come up with that yourself, or did you need help?" },
    { by: 'b', say: "{a}!" },
    { beat: 'The whole camp is howling. The host retreats.' },
  ] },
  { id: 'lf.wc2', turns: [
    { beat: "The host announces a pointless dawn chore. {a} does it, while doing a perfect impression of the host." },
    { by: 'a', say: "\"Rise and shine, campers! Pain is fun!\"" },
    { by: 'b', conf: "Even the host almost laughed. Almost." },
  ] },
  { id: 'lf.wc3', turns: [
    { beat: 'A bucket of cold water hits the whole camp at dawn.' },
    { by: 'a', say: "Thank you. I was hoping to be colder." },
    { by: 'b', conf: "{a} turned the worst wake-up of the season into the funniest moment of the week. With one sentence." },
  ] },
  { id: 'lf.wc4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Some of us were SLEEPING! You know, the thing humans DO?" },
    { by: 'b', say: "You tell 'em!" },
    { by: 'a', say: "I AM telling them!" },
  ] },
  { id: 'lf.wc5', turns: [
    { by: 'a', say: "Mandatory sunrise exercise? Sure. Everyone, follow me. Arms up. Now arms out. Now point at the host." },
    { beat: 'The whole camp points at the host.' },
    { by: 'b', conf: "Best morning of the season. Started at five a.m. somehow." },
  ] },
  { id: 'lf.wc6', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "You know, if you wanted our attention, you could've just asked nicely." },
    { by: 'b', conf: "{a} roasted the host before breakfast and somehow everyone likes {a} more now. How?" },
  ] },
];
const WAKEUP_SNAP = [
  { id: 'lf.wn1', turns: [
    { beat: "The host's dawn airhorn leaves the whole camp raw and sleepless." },
    { by: 'a', say: "Move. You're in my way." },
    { by: 'b', say: "I'm literally standing still." },
    { by: 'a', say: "Then stand still somewhere else." },
    { by: 'b', conf: "Neither of us meant it. Both of us will remember it." },
  ] },
  { id: 'lf.wn2', turns: [
    { by: 'b', say: "It was your turn to deal with the mess." },
    { by: 'a', say: "It was absolutely not my turn." },
    { beat: 'They bicker all through breakfast. Nobody can remember whose turn it was.' },
  ] },
  { id: 'lf.wn3', turns: [
    { by: 'a', say: "Why are you so loud in the morning?" },
    { by: 'b', say: "I said good morning." },
    { by: 'a', say: "Loudly." },
  ] },
  { id: 'lf.wn4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "If ONE more thing goes wrong today—" },
    { by: 'b', say: "You'll what?" },
    { by: 'a', say: "Don't push me!" },
  ] },
  { id: 'lf.wn5', turns: [
    { beat: 'The host makes them take down camp and put it back up, "for time". {a} and {b} are too tired to be kind.' },
    { by: 'b', say: "You're holding it upside down." },
    { by: 'a', say: "YOU'RE upside down." },
  ] },
  { id: 'lf.wn6', turns: [
    { by: 'a', say: "Sorry. I'm just tired." },
    { by: 'b', say: "We're all tired." },
    { by: 'a', say: "Then why am I the only one apologising?" },
  ] },
];
const SLOP_BAD = [
  { id: 'hs.sb1', turns: [
    { beat: 'Chef ladles out something gray. It moves, slightly.' },
    { by: 'a', say: "I'm not eating that." },
    { by: 'b', say: "Oh, don't be so dramatic." },
    { by: 'a', say: "IT MOVED." },
    { by: 'b', conf: "We had a whole fight about who was being dramatic. Over Chef's food. The food won." },
  ] },
  { id: 'hs.sb2', turns: [
    { by: 'a', say: "You took the only edible scoop." },
    { by: 'b', say: "There was no edible scoop." },
    { by: 'a', say: "There was one. And it's in your bowl." },
  ] },
  { id: 'hs.sb3', turns: [
    { beat: 'Chef bangs the ladle. "Eat or starve."' },
    { by: 'a', say: "Here. You eat mine." },
    { by: 'b', say: "I don't want yours!" },
    { by: 'a', say: "Nobody wants mine!" },
  ] },
  { id: 'hs.sb4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "You laughed when I gagged!" },
    { by: 'b', say: "You gagged really loudly!" },
    { by: 'a', say: "Because it's CHEF'S SURPRISE!" },
  ] },
  { id: 'hs.sb5', turns: [
    { by: 'b', say: "You're so spoiled. It's just protein." },
    { by: 'a', say: "Protein of WHAT?" },
    { beat: "Neither of them speaks to the other for the rest of dinner." },
  ] },
  { id: 'hs.sb6', turns: [
    { by: 'a', say: "Swap with me." },
    { by: 'b', say: "No way. Yours has a hair in it." },
    { by: 'a', say: "Yours has a TOOTH in it." },
  ] },
];
const SLOP_GOOD = [
  { id: 'hs.sg1', turns: [
    { beat: "Chef's dinner is genuinely inedible. {a} and {b} eat it anyway, crying-laughing." },
    { by: 'b', say: "This is the worst thing I have ever put in my mouth." },
    { by: 'a', say: "Second bowl?" },
    { by: 'b', say: "Obviously." },
  ] },
  { id: 'hs.sg2', turns: [
    { by: 'a', say: "Dare you to finish it." },
    { by: 'b', say: "Dare you to finish yours first." },
    { beat: 'They both finish. They both regret it. A friendship is forged in nausea.' },
  ] },
  { id: 'hs.sg3', turns: [
    { by: 'a', say: "Okay, rank it against every bad meal you've ever had." },
    { by: 'b', say: "Bottom three." },
    { by: 'a', say: "Bottom ONE." },
    { by: 'b', conf: "We ranked Chef's cooking until the fire went out. Best night I've had here." },
  ] },
  { id: 'hs.sg4', turns: [
    { by: 'b', say: "Half of the one roll Chef didn't burn?" },
    { by: 'a', say: "You'd share that with me?" },
    { by: 'b', say: "It's a very small roll. Don't make it emotional." },
  ] },
  { id: 'hs.sg5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I think it's... chicken?" },
    { by: 'b', say: "It's blue." },
    { by: 'a', say: "Blue chicken. Sure." },
  ] },
  { id: 'hs.sg6', turns: [
    { by: 'a', say: "Chef, compliments to the... actually, never mind." },
    { by: 'b', say: "Run." },
    { beat: '{a} and {b} flee the mess hall, laughing.' },
  ] },
];
const RAID_MEAN = [
  { id: 'hs.rm1', turns: [
    { beat: "{a} slips into the cabin while {b} is out and pockets {b}'s stash of snacks." },
    { by: 'b', say: "Where are my snacks?" },
    { by: 'a', say: "What snacks?" },
    { by: 'b', conf: "Empty wrappers by {a}'s bunk. I know exactly who." },
  ] },
  { id: 'hs.rm2', turns: [
    { beat: "{a} short-sheets {b}'s bunk and hides {b}'s things around camp, \"as a joke\"." },
    { by: 'b', say: "This isn't funny." },
    { by: 'a', say: "It's a little funny." },
    { by: 'b', say: "It's not funny AT ALL." },
  ] },
  { id: 'hs.rm3', turns: [
    { beat: "{a} rifles through {b}'s bag looking for an idol. Finds nothing. Leaves a mess." },
    { by: 'b', say: "Somebody went through my stuff." },
    { by: 'a', say: "Weird. Raccoons, probably." },
    { by: 'b', conf: "Raccoons don't fold things back wrong. {a} does." },
  ] },
  { id: 'hs.rm4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "I didn't find anything in {b}'s bag. But now I know what {b} doesn't have. That's almost as good." },
  ] },
  { id: 'hs.rm5', turns: [
    { by: 'b', say: "Did you touch my bunk?" },
    { by: 'a', say: "Why would I touch your bunk?" },
    { by: 'b', say: "Because it's soaking wet." },
    { by: 'a', say: "Must be a leak." },
  ] },
  { id: 'hs.rm6', turns: [
    { by: 'a', conf: "Was it petty? Yes. Did {b} deserve it? Also yes. Will {b} figure out it was me? Probably. Worth it." },
  ] },
];
const RAID_FUN = [
  { id: 'hs.rf1', turns: [
    { beat: '{a} and {b} sneak to the mess hall after lights-out for a midnight snack raid.' },
    { by: 'a', say: "Shh! Chef's still up!" },
    { by: 'b', say: "You shh!" },
    { beat: 'They get away clean with a jar of pickles, giggling all the way back to the cabin.' },
  ] },
  { id: 'hs.rf2', turns: [
    { by: 'a', say: "I dare you to prank the other cabin." },
    { by: 'b', say: "Only if you come with me." },
    { beat: 'They pull it off together and swear each other to secrecy.' },
  ] },
  { id: 'hs.rf3', turns: [
    { beat: '{a} and {b} whisper across the bunks long after lights-out.' },
    { by: 'b', say: "Are you awake?" },
    { by: 'a', say: "No." },
    { by: 'b', say: "Okay, so anyway—" },
  ] },
  { id: 'hs.rf4', turns: [
    { by: 'a', say: "Pillow fort. Right now." },
    { by: 'b', say: "We have two pillows." },
    { by: 'a', say: "Then it's a small fort." },
  ] },
  { id: 'hs.rf5', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Race you to the dock and back. In the dark." },
    { by: 'b', say: "We'll get caught." },
    { by: 'a', say: "Not if we're fast." },
  ] },
  { id: 'hs.rf6', turns: [
    { by: 'b', conf: "We stayed up until three talking about nothing. That's when I knew {a} was my person in this game." },
  ] },
];
const STORY = [
  { id: 'hs.st1', turns: [
    { by: 'a', say: "Want to hear a ghost story?" },
    { by: 'b', say: "Not really." },
    { by: 'a', say: "Too bad. It happened at this exact camp." },
    { beat: 'By the end, {b} is sitting much closer to {a} than before.' },
  ] },
  { id: 'hs.st2', turns: [
    { beat: '{a} leads a campfire singalong. {b} is the first to join.' },
    { by: 'b', conf: "By the end the whole camp was howling. Best night in a while." },
  ] },
  { id: 'hs.st3', turns: [
    { by: 'a', say: "Okay, the worst thing that ever happened to me at summer camp." },
    { by: 'b', say: "Is it worse than this?" },
    { by: 'a', say: "It involved a canoe and a goose." },
    { by: 'b', say: "Go on." },
  ] },
  { id: 'hs.st4', turns: [
    { beat: '{a} and {b} stay at the dying campfire after everyone else turns in, talking about home.' },
    { by: 'a', conf: "The fire was almost out before either of us moved." },
  ] },
  { id: 'hs.st5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Once upon a time there was a camper who trusted everybody." },
    { by: 'b', say: "What happened to them?" },
    { by: 'a', say: "They went home first." },
    { by: 'b', conf: "That wasn't a story. That was a warning." },
  ] },
  { id: 'hs.st6', turns: [
    { by: 'b', say: "That's not how the story ends." },
    { by: 'a', say: "It's my story." },
    { by: 'b', say: "You said the hook-handed guy was the hero." },
    { by: 'a', say: "Twist ending." },
  ] },
];
const DRIFT = [
  { id: 'lf.dr1', turns: [
    { by: 'b', say: "Are we good?" },
    { by: 'a', say: "Yeah. Of course." },
    { by: 'b', conf: "{a} said yes too fast. I know what too fast means by now." },
  ] },
  { id: 'lf.dr2', turns: [
    { beat: "{a} doesn't save {b} a seat at the fire. Small thing. Huge signal." },
    { by: 'b', conf: "I sat somewhere else and pretended not to care. I cared." },
  ] },
  { id: 'lf.dr3', turns: [
    { by: 'b', say: "You've been talking to everyone except me lately." },
    { by: 'a', say: "I've been busy." },
    { by: 'b', say: "With who?" },
    { by: 'a', say: "Just busy." },
  ] },
  { id: 'lf.dr4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "I love {b}. But I can't win sitting next to {b}. So I'm moving. Slowly. So it doesn't hurt as much." },
  ] },
  { id: 'lf.dr5', turns: [
    { by: 'b', say: "I heard what you said about me." },
    { by: 'a', say: "It wasn't bad." },
    { by: 'b', say: "It wasn't anything. That's worse." },
  ] },
  { id: 'lf.dr6', turns: [
    { beat: "{a} starts treating {b} like everyone else. That's the part that hurts." },
    { by: 'b', conf: "No fight. No reason. Just… less. Every day a little less." },
  ] },
  { id: 'lf.dr7', when: { register: 'sweet' }, turns: [
    { by: 'b', say: "Did I do something wrong?" },
    { by: 'a', say: "No. Nothing. It's the game." },
    { by: 'b', say: "It's always the game." },
  ] },
  { id: 'lf.dr8', turns: [
    { by: 'b', say: "We used to plan everything together." },
    { by: 'a', say: "Things change." },
    { by: 'b', conf: "{a} made a plan without me. I found out from someone else. That's the betrayal: not being told." },
  ] },
];
const REKINDLE = [
  { id: 'lf.rk1', turns: [
    { beat: '{a} sits down next to {b} for the first time in days.' },
    { by: 'a', say: "Hey." },
    { by: 'b', say: "Hey." },
    { beat: 'Neither says anything for a while. Then {a} starts talking about home, and {b} listens.' },
  ] },
  { id: 'lf.rk2', turns: [
    { by: 'a', say: "I know we've had our issues. I'm just saying we don't have to keep doing this." },
    { by: 'b', say: "Doing what?" },
    { by: 'a', say: "Not talking." },
    { by: 'b', conf: "I didn't walk away. That's new for us." },
  ] },
  { id: 'lf.rk3', turns: [
    { by: 'a', say: "Nice move today." },
    { by: 'b', say: "From you? After everything?" },
    { by: 'a', say: "Two words. Don't make it a speech." },
  ] },
  { id: 'lf.rk4', turns: [
    { beat: "Rain drives everyone under the same cover. {a} and {b} end up side by side. Neither moves." },
    { by: 'b', conf: "By morning, the cold between us had thawed. Just slightly. Enough." },
  ] },
  { id: 'lf.rk5', turns: [
    { by: 'b', say: "That's not what happened. {a} didn't do that." },
    { by: 'a', conf: "{b} defended me. Not warmly. But {b} did it. I heard about it later. I won't forget." },
  ] },
  { id: 'lf.rk6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I'm sick of being mad at you." },
    { by: 'b', say: "Same." },
    { by: 'a', say: "So stop being annoying." },
    { by: 'b', say: "You first." },
  ] },
];
const UNBREAKABLE = [
  { id: 'lf.ub1', turns: [
    { beat: '{a} and {b} finish a job in half the time it took anyone else, without a single word.' },
    { by: 'b', conf: "We've been in sync since day one. Everybody knows it. Nobody can compete with it." },
  ] },
  { id: 'lf.ub2', turns: [
    { beat: 'The camp debates the plan. {b} looks at {a}. {a} nods. That settles it.' },
    { by: 'a', conf: "We don't need to talk anymore. We just know." },
  ] },
  { id: 'lf.ub3', turns: [
    { by: 'a', say: "You and me. Whatever happens." },
    { by: 'b', say: "You keep saying that." },
    { by: 'a', say: "I keep meaning it." },
  ] },
  { id: 'lf.ub4', turns: [
    { by: 'b', say: "If they come for you, they come for me." },
    { by: 'a', say: "That makes us a target." },
    { by: 'b', say: "Then we're a target together." },
  ] },
  { id: 'lf.ub5', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "I trust nobody in this game. Except {b}. Don't tell anyone. It would ruin my reputation." },
  ] },
  { id: 'lf.ub6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I don't know what I'd do out here without you." },
    { by: 'b', say: "Starve, probably." },
    { by: 'a', say: "Definitely starve." },
  ] },
];
const RIDE_OR_DIE = [
  { id: 'lf.rd1', turns: [
    { beat: '{a} and {b} talk across camp with just a look. The others have noticed and can\'t decode it.' },
    { by: 'b', conf: "{a} is the only person in this game I trust completely. That's either going to save me or sink me. I'm okay with both." },
  ] },
  { id: 'lf.rd2', turns: [
    { by: 'a', say: "Final two. You and me. I'm not asking. I'm telling." },
    { by: 'b', say: "Is that a proposal?" },
    { by: 'a', say: "It's a promise." },
  ] },
  { id: 'lf.rd3', turns: [
    { by: 'b', say: "Somebody asked me if I'd vote for you." },
    { by: 'a', say: "And?" },
    { by: 'b', say: "I laughed in their face." },
  ] },
  { id: 'lf.rd4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Anybody who says {b}'s name deals with me." },
    { by: 'b', say: "You can't say that out loud." },
    { by: 'a', say: "I just did. Twice." },
  ] },
  { id: 'lf.rd5', turns: [
    { by: 'a', say: "If it comes down to me or you, I'm voting for me." },
    { by: 'b', say: "Fair." },
    { by: 'a', say: "Kidding. It's you. It's always you." },
  ] },
  { id: 'lf.rd6', when: { loyal: true }, turns: [
    { by: 'a', conf: "I'd go home before I'd vote for {b}. Write that down. I mean every word." },
  ] },
  { id: 'lf.rd7', turns: [
    { beat: "{a} saves {b} the good spot at the fire. {b} saves {a} the bigger half of the fish. Nobody else gets either." },
    { by: 'b', conf: "That's how you know. Nobody has to say it." },
  ] },
  { id: 'lf.rd8', when: { register: 'schemer' }, turns: [
    { beat: "{b} catches {a}'s eye across the fire and nods." },
    { by: 'a', conf: "Everyone thinks a pair is a weakness. A pair that never breaks is the strongest thing in this game." },
  ] },
  { id: 'lf.rd9', turns: [
    { by: 'b', say: "Do you trust me?" },
    { by: 'a', say: "With my life." },
    { by: 'b', say: "With your vote?" },
    { by: 'a', say: "That's more serious. Yes." },
  ] },
  { id: 'lf.rd10', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Promise me we'll still be friends after this." },
    { by: 'b', say: "Promise. And during." },
  ] },
  { id: 'lf.rd11', turns: [
    { by: 'a', say: "They're trying to split us up." },
    { by: 'b', say: "Let them try." },
    { by: 'b', conf: "Every time someone tries to come between us, we get closer. It's honestly getting annoying for them." },
  ] },
  { id: 'lf.rd12', when: { age: 'older' }, turns: [
    { by: 'a', conf: "I've had friends for thirty years who I trust less than {b}. Three weeks. That's all it took." },
  ] },
];

export default {
  'life.work.any': WORK, 'life.hurt.any': HURT, 'life.build.any': BUILD, 'life.charm.any': CHARM,
  'life.dream.seer': DREAM_SEER, 'life.dream.home': DREAM_HOME, 'life.critter.any': CRITTER, 'life.atmos.any': ATMOS,
  'life.weather.any': WEATHER, 'life.floater.any': FLOATER, 'life.underdog.driven': UNDERDOG_DRIVEN, 'life.underdog.unseen': UNDERDOG_UNSEEN,
  'life.surprise.any': SURPRISE, 'life.weird.argue': WEIRD_ARGUE, 'life.weird.bond': WEIRD_BOND, 'life.weird.bold': WEIRD_BOLD,
  'life.weird.shy': WEIRD_SHY, 'life.mood.any': MOOD, 'life.homesick.any': HOMESICK, 'life.favorite.any': FAVORITE,
  'life.beast.machine': BEAST_MACHINE, 'life.beast.strong': BEAST_STRONG, 'life.beast.worker': BEAST_WORKER,
  'life.wakeup.clap': WAKEUP_CLAP, 'life.wakeup.snap': WAKEUP_SNAP,
  'hosted.slop.bad': SLOP_BAD, 'hosted.slop.good': SLOP_GOOD, 'hosted.raid.mean': RAID_MEAN, 'hosted.raid.fun': RAID_FUN,
  'hosted.story.any': STORY,
  'friend.drift.any': DRIFT, 'friend.rekindle.any': REKINDLE, 'friend.unbreakable.any': UNBREAKABLE, 'friend.rideordie.any': RIDE_OR_DIE,
};
