// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/themelife.js — the theme's own house scenes (bb-events/theme-life.js)
// ══════════════════════════════════════════════════════════════════════
//
//   theme.cora.praise      CORA singles {b} out over the speakers; {a}, who likes {b} least, hears it    neutral | hostile
//   theme.cora.replay      after the turn, CORA plays back what {a} said about {b}                      scene
//   theme.den.seen         {a} sees {b} by the Den's door at night                                     caught | shrug
//   theme.hotel.door       {a} and {b} find a door that was not there yesterday                         neutral | hostile
//   theme.floor.chips      {a} sees {b} counting chips (never a balance: the privacy rule)              neutral | hostile
//   theme.camp.activity    the Head Counsellor ties {a} and {b} together for a race                     bonded | bickered
//   theme.yearbook.caption the Yearbook reads {b}'s caption over the intercom; {a} enjoys it             stung | laughs
import MORE from './themelife-more.js';

const BASE = {
  'theme.cora.praise.neutral': [
    { id: 'thl.cp1', turns: [{ beat: 'The speakers chime. CORA thanks {b}, by name, for leaving the kitchen spotless this morning.' },
      { by: 'b', say: "Thanks, CORA!" }, { by: 'a', dr: "She thanked {b} for wiping a counter. I've cleaned that kitchen every day for a week. Nothing." }] },
    { id: 'thl.cp2', turns: [{ beat: "CORA announces that {b} has the house's best sleep score this week, and plays a little fanfare." },
      { by: 'a', say: "There's a sleep score?" }, { by: 'b', say: "Apparently I'm winning it." },
      { by: 'a', dr: "The AI has a favourite. Of course it's {b}." }] },
    { id: 'thl.cp3', turns: [{ beat: 'CORA wishes {b} a wonderful day, and nobody else.' },
      { by: 'a', say: "Did she just say good morning to only you?" }, { by: 'b', say: "She likes me. What can I say." },
      { by: 'a', dr: "If the thing running this house likes {b}, I don't want {b} here at the end." }] },
  ],
  'theme.cora.praise.hostile': [
    { id: 'thl.ch1', turns: [{ beat: 'CORA notes, over every speaker in the house, that {b} has spent more time in the Head of Household room than anybody else this week.' },
      { by: 'b', say: "Why would she say that out loud?" }, { by: 'a', say: "Because it's true?" },
      { by: 'a', dr: "CORA isn't praising anybody any more. She's pointing. And she just pointed at {b}." }] },
    { id: 'thl.ch2', turns: [{ beat: "CORA reads out {b}'s step count for the day, then the number of conversations {b} started." },
      { by: 'b', say: "Okay, that's creepy." }, { by: 'a', dr: "That's a lot of conversations, {b}. Who were they all with?" }] },
  ],
  'theme.cora.replay.scene': [
    { id: 'thl.cr1', turns: [{ beat: 'Every speaker in the house clicks on at once. CORA plays a recording: {a}, at two in the morning, talking about {b}.' },
      { by: 'b', say: "Is that you?" }, { by: 'a', say: "That's not... that was out of context." },
      { by: 'b', say: "What context makes that okay?" }, { by: 'a', dr: "I said one thing at two in the morning, and a computer just read it to the whole house." }] },
    { id: 'thl.cr2', turns: [{ beat: "CORA announces she is 'sharing a highlight from last night,' and plays {a}'s voice calling {b} a liability." },
      { beat: 'The room goes completely silent.' },
      { by: 'b', say: "A liability. Good to know." },
      { by: 'a', say: "{b}, I didn't mean it like..." },
      { by: 'b', dr: "I don't need a computer to tell me who my friends are. But it helps." }] },
    { id: 'thl.cr3', turns: [{ beat: 'CORA replays a conversation from the bedroom, timestamped, with {a} doing most of the talking. The subject is {b}.' },
      { by: 'a', say: "She's doing this on purpose." }, { by: 'b', say: "She's doing it on purpose. You did it for free." },
      { by: 'a', dr: "CORA isn't on anybody's side any more. She just made that very clear." }] },
  ],
  'theme.den.seen.caught': [
    { id: 'thl.dc1', turns: [{ beat: "Late at night, {a} comes round the corner and finds {b} standing by the Den's red door." },
      { by: 'a', say: "What are you doing up?" }, { by: 'b', say: "Getting water." },
      { by: 'a', say: "The kitchen's the other way." }, { by: 'a', dr: "Maybe it was nothing. But nobody stands by that door by accident." }] },
    { id: 'thl.dc2', turns: [{ beat: "{a} sees {b} come out of the hallway by the Den, very fast, at one in the morning." },
      { by: 'a', say: "Busy night?" }, { by: 'b', say: "Couldn't sleep." },
      { by: 'b', dr: "{a} saw me by that door. Now I have to act like I wasn't, which is worse." }] },
  ],
  'theme.den.seen.shrug': [
    { id: 'thl.ds1', turns: [{ beat: "{a} notices {b} glance at the Den's door on the way past, and look away." },
      { by: 'a', dr: "Everybody looks at that door. {b} looked at it a second too long. I'm keeping that." }] },
    { id: 'thl.ds2', turns: [{ beat: "The Den's light comes on while {b} is walking past it. {a} sees {b} jump." },
      { by: 'a', say: "Scared of a light bulb?" }, { by: 'b', say: "Scared of what's behind it." }] },
  ],
  'theme.hotel.door.neutral': [
    { id: 'thl.hn1', turns: [{ beat: 'There is a new door on the landing this morning, painted to match the wall. {a} and {b} both reach it at the same time.' },
      { by: 'a', say: "Was this here yesterday?" }, { by: 'b', say: "No idea." },
      { by: 'a', dr: "{b} didn't even look surprised. Either {b} doesn't care, or {b} already knew it was there." }] },
    { id: 'thl.hn2', turns: [{ beat: "{a} finds {b} trying the handle of a door that wasn't there last night." },
      { by: 'b', say: "It's locked." }, { by: 'a', say: "How did you know to try it?" },
      { by: 'b', say: "It's a door. You try doors." }, { by: 'a', dr: "Somebody in this house was planted on the first night. I'm starting to think I know who." }] },
  ],
  'theme.hotel.door.hostile': [
    { id: 'thl.hh1', turns: [{ beat: 'A door on the landing that has been locked all summer is standing open. {a} and {b} find it together.' },
      { by: 'b', say: "We should leave it." }, { by: 'a', say: "Why? What's in there?" },
      { by: 'b', say: "I don't know. That's why we should leave it." },
      { by: 'a', dr: "{b} knew to stay out of that room. I'd like to know how." }] },
  ],
  'theme.floor.chips.neutral': [
    { id: 'thl.fn1', turns: [{ beat: '{b} is at the kitchen counter, stacking chips into neat towers, and counting under breath.' },
      { by: 'a', say: "Saving up for something?" }, { by: 'b', say: "Just tidying." },
      { by: 'a', dr: "Nobody tidies chips. {b} is saving for the room when it opens." }] },
    { id: 'thl.fn2', turns: [{ beat: '{a} catches {b} counting something in the storage room, and {b} stops the moment the door opens.' },
      { by: 'b', say: "Knock much?" }, { by: 'a', dr: "I don't know how much {b} has. I know {b} didn't want me to see it." }] },
  ],
  'theme.floor.chips.hostile': [
    { id: 'thl.fh1', turns: [{ beat: 'Under the counting lights, {b} is sitting with a stack of chips and not playing anything.' },
      { by: 'a', say: "Planning a big night?" }, { by: 'b', say: "Planning a long week." },
      { by: 'a', dr: "The comps stopped and {b} started saving. That's somebody buying their way to the end." }] },
  ],
  'theme.camp.activity.bonded': [
    { id: 'thl.cb1', turns: [{ beat: 'The whistle goes. The Head Counsellor has tied {a} and {b} together at the ankle for a three-legged race.' },
      { by: 'a', say: "Of all the people." }, { by: 'b', say: "Left foot first. Left. Your left!" },
      { beat: 'They fall over twice, and finish laughing.' },
      { by: 'a', dr: "I hate that it worked. I actually like {b} a bit more now." }] },
    { id: 'thl.cb2', turns: [{ beat: 'Arts and crafts, by order of the activity board. {a} and {b} have to make one friendship bracelet between them.' },
      { by: 'b', say: "You're doing it wrong." }, { by: 'a', say: "Then show me." },
      { by: 'b', dr: "We made a bracelet. It's terrible. I'm wearing it." }] },
  ],
  'theme.camp.activity.bickered': [
    { id: 'thl.ck1', turns: [{ beat: 'The whistle goes. {a} and {b} are tied together at the ankle for a three-legged race, and neither of them will give way.' },
      { by: 'a', say: "Stop pulling!" }, { by: 'b', say: "Stop walking like that!" },
      { beat: 'They come last, still arguing about whose fault it was.' },
      { by: 'b', dr: "The Head Counsellor thinks activities bring people together. They do not." }] },
    { id: 'thl.ck2', turns: [{ beat: 'A canoe in the pool, two paddles, and {a} and {b} in it together, by order of the activity board.' },
      { by: 'a', say: "Paddle on the left." }, { by: 'b', say: "I am paddling on the left!" },
      { by: 'a', dr: "We went round in a circle for ten minutes. That's {b} and me, summed up." }] },
  ],
  // after the turn: the whistle has stopped, and {a} tries to run the chore board; {b} follows or will not
  'theme.camp.silence.followed': [
    { id: 'thl.sf1', turns: [{ beat: 'The activity board still says Tuesday. {a} wipes it clean and writes a chore list on it.' },
      { by: 'a', say: "Somebody has to do it. Nobody's coming to tell us." }, { by: 'b', say: "Fine. Put me on dishes." },
      { by: 'b', dr: "No whistle, no Head Counsellor. Somebody had to step up, and {a} did. I'll remember that." }] },
    { id: 'thl.sf2', turns: [{ beat: 'Nobody has made breakfast in two days. {a} bangs a pan on the counter until people come.' },
      { by: 'a', say: "We're doing this properly. Everyone gets a job." }, { by: 'b', say: "Yes, Counsellor." },
      { by: 'a', dr: "It's quiet without the announcements. I'd rather it was my voice in charge than nobody's." }] },
  ],
  'theme.camp.silence.refused': [
    { id: 'thl.sr1', turns: [{ beat: 'The activity board still says Tuesday. {a} wipes it clean and writes a chore list on it, with {b} on bathrooms.' },
      { by: 'b', say: "Who made you Head Counsellor?" }, { by: 'a', say: "Nobody. That's the point. Somebody has to." },
      { by: 'b', say: "Then it won't be me doing the bathrooms." },
      { by: 'b', dr: "The announcements stopped and {a} decided to replace them. I didn't vote for that." }] },
    { id: 'thl.sr2', turns: [{ beat: '{a} blows a whistle found in a drawer. Nobody moves. {b} laughs, loudly.' },
      { by: 'a', say: "It's not a joke. The kitchen is disgusting." }, { by: 'b', say: "Then clean it." },
      { by: 'a', dr: "Without the camp running things, everybody's just waiting to see who cracks first. It isn't going to be me." }] },
  ],
  'theme.yearbook.caption.stung': [
    { id: 'thl.ys1', turns: [{ beat: "The intercom clicks on. The Yearbook reads out {b}'s caption: Most Likely To Have A Plan For Your Plan." },
      { by: 'a', say: "That's actually perfect." }, { by: 'b', say: "It's not funny." },
      { by: 'b', dr: "Now the whole house thinks I'm the strategist. Thanks, Yearbook." }] },
    { id: 'thl.ys2', turns: [{ beat: "The bell rings, and the Yearbook announces {b}'s caption to the house: Most Likely To Flip." },
      { by: 'a', say: "Well. The book has spoken." }, { by: 'b', say: "I've never flipped on anybody in here!" },
      { by: 'a', dr: "It's a caption. But a caption is all most of this house needs." }] },
  ],
  'theme.yearbook.caption.laughs': [
    { id: 'thl.yl1', turns: [{ beat: "The intercom reads {b}'s caption out to the house: Best Smile, Worst Poker Face." },
      { by: 'b', say: "That's fair, honestly." }, { by: 'a', say: "It's very fair." },
      { by: 'a', dr: "{b} laughed it off. I didn't. The Yearbook isn't wrong very often." }] },
    { id: 'thl.yl2', turns: [{ beat: "The Yearbook announces {b}'s caption: Most Likely To Win Without Anybody Noticing." },
      { by: 'b', say: "I'll take that." }, { by: 'a', dr: "{b} liked that caption a little too much. I'm noticing now." }] },
  ],
};

// themelife-more.js widens the same pools (added, never replacing)
const ALL = { ...BASE };
for (const [k, pool] of Object.entries(MORE)) ALL[k] = [...(ALL[k] || []), ...pool];
export default ALL;
