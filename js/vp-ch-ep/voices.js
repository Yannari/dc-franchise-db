// ══════════════════════════════════════════════════════════════════════
// vp-ch-ep/voices.js — the house at the games: shouts, confessionals, TJ
// ══════════════════════════════════════════════════════════════════════
//
// The real show's daily and Arena are mostly voices (The Challenge: All Stars,
// s01e01 and e04 transcripts, read 2026-10-15): teammates shouting ("13 silver!
// Come on!", "Breathe, Jonna!"), the one struggling narrating it ("I'm feeling
// like I'm about to die... I'm 43 doing this"), somebody watching ("When I see
// Ace and LT hit the ground, all of the hair on my arms stands up"), TJ reading
// the rules out loud, debriefing everyone, calling the score, saying goodbye.
// Ours played the games in silence. These pools are those voices, picked by
// what the record says happened, said in the speaker's own voice
// (ch/script/write.js voicedLine), plain, and never the same line twice in a
// season's episode. Who speaks comes from the row's ties (a friend cheers, a
// rival comments): ch/season.js epRec.ties.
import { voicedLine } from '../ch/script/write.js';
import { pickBy, hashOf } from './games.js';

const V = (say, v = {}) => ({ say, v });

export const DAILY_VOICE = {
  // a friend or teammate shouting to somebody out in front
  go: [V('Come on, {a}! You\'ve got this!', { loud: ['GO, {a}! GO GO GO!'], soft: ['You\'re doing so good, {a}! Keep going!'] }),
    V('Let\'s go, {a}! Don\'t slow down!', { sharp: ['Don\'t let up, {a}! Finish it!'] }), V('You\'re right there, {a}! Keep going!')],
  // to somebody falling behind
  back: [V('Don\'t quit, {a}! Keep moving!', { loud: ['DON\'T STOP, {a}! COME ON!'], soft: ['You\'re okay, {a}! One more!'] }),
    V('Come on, {a}, dig deep!', { sharp: ['Get it together, {a}! Come on!'] }), V('Keep going, {a}! It\'s not over!')],
  // the kind of shout the game calls for
  verb: {
    swim: [V('Swim, {a}! Swim!'), V('Breathe, {a}! Breathe, then go!')],
    jump: [V('Keep climbing, {a}! Don\'t look down!'), V('Jump, {a}! Just go!')],
    pull: [V('Pull, {a}! Lean into it!'), V('Don\'t stop pulling, {a}!')],
    maze: [V('Keep moving, {a}! You\'ll find it!'), V('Try the other way, {a}!')],
    beam: [V('Slow down, {a}! Watch your feet!'), V('Small steps, {a}! Small steps!')],
    hang: [V('Hold on, {a}! Hold on!'), V('Don\'t let go, {a}! Not yet!')],
    quiz: [V('Think, {a}! You know this one!'), V('Stay on the platform, {a}!')],
    smash: [V('Hit it again, {a}! Hit it!'), V('Guard the tower, {a}!')],
    run: [V('Over the wall, {a}! Go!'), V('Pick it up, {a}! Run!')],
  },
  // the one out in front, to the camera
  lead: {
    swim: [V('I just put my head down and swam. I didn\'t look at anybody else.'), V('The water was freezing. I didn\'t care. I wanted that win.')],
    jump: [V('I didn\'t think about the height. I just kept climbing and jumping.'), V('Every time I jumped, my stomach dropped. I kept going anyway.')],
    pull: [V('Every step hurt. I leaned into that harness and I didn\'t stop.')],
    maze: [V('I found a rhythm in there. Left, right, station, next.')],
    beam: [V('I took it slow. Everybody rushing was falling in.')],
    hang: [V('My hands were burning. I just kept telling myself, ten more seconds.')],
    quiz: [V("I know this house. I've been paying attention since day one.")],
    smash: [V('I swung that ram like my life depended on it, because it kind of did.')],
    run: [V('I knew if I slowed down for one second, somebody would catch me.')],
    any: [V('Everything hurt, and I didn\'t care. I wanted that win.'), V('I knew if I slowed down for one second, somebody would catch me.')],
  },
  // the one falling behind, to the camera
  back: {
    swim: [V('The water is so cold I can barely breathe. I\'m trying, I really am.'), V('I keep swimming, and the buoy isn\'t getting any closer.')],
    jump: [V('I\'m halfway up that cliff and my legs are shaking. I\'m not okay.')],
    pull: [V('Every step it feels like the truck is pulling me backwards.')],
    maze: [V('Every turn is a dead end. I\'m losing my mind in there.')],
    beam: [V('I fell in again. Every time I fall, I have to start over, and I\'m running out of time.')],
    hang: [V('My arms are gone. I don\'t know how much longer I can hold on.')],
    quiz: [V('I knew that answer. I knew it, and I froze.')],
    smash: [V('Everybody came after our tower at once. We never stood a chance.')],
    run: [V('I\'m out of gas. My legs just stopped listening to me.')],
    any: [V('My body is done. I\'m trying, and it just won\'t do it.'), V('I can hear everybody yelling, and I can\'t go any faster.')],
  },
  // somebody watching the one out in front
  watchLead: [V('{a} is a machine. I don\'t know how anybody beats that.', { sharp: ['{a} is the one to beat. Everybody can see it now.'], soft: ['Watching {a} out there is honestly scary.'] }),
    V('{a} makes it look easy, and it is not easy.'), V('Everybody else out there is chasing {a} right now.')],
  // a friend watching the one falling behind
  watchBackFriend: [V('It\'s hard watching {a} struggle like that. I just want to jump in and help.'), V('Come on, {a}. I know you can do this.')],
  // a rival watching the one falling behind
  watchBackRival: [V('{a} is falling apart out there. I\'m not going to pretend I\'m sad about it.'), V('Look at {a}. That\'s the person who\'s been talking about me all week.')],
  // before it starts
  // somebody in the middle of the pack, to the camera
  mid: [V('I\'m not winning this, but I\'m not last either. Today that\'s enough.'), V('I just keep telling myself, don\'t be the one at the bottom.'),
    V('My arms are gone. I\'m running on nothing but spite right now.', { soft: ['My arms are gone. I just don\'t want to let anybody down.'] }),
    V('I looked over and saw who was behind me, and I found another gear.'), V('This is the part where you find out if you really want to be here.')],
  nerves: [V('I\'ve been dreading this all morning. I just don\'t want to be last.'), V('If I lose this, I\'m in danger at the vote. I can\'t lose this.'),
    V('My hands are already shaking, and TJ hasn\'t even said go.')],
};

export const TJ_VOICE = {
  // TJ from the side during a daily: {a} is in front, {b} is the one he is calling to
  call: ['{a} is out in front! {b}, you have to move!', 'Look at {a} go! Everybody else, this is not over yet!', '{b}, you\'re running out of time!',
    'This is close! {a}, don\'t slow down now!', 'Come on, people! {a} is pulling away from you!'],
  rules: ['Alright, listen up. Here\'s how it works.', 'Okay, everybody. Here\'s the deal.'],
  debrief: ['Good job, everybody. That was a tough one. {w}, that was a dominating performance.', 'Alright, everybody, bring it in. Some of you looked like you were born for that. {w}, that was all you.'],
  next: ['{w}, you\'re safe at the vote. Everybody else, go back to the villa and figure out who\'s going into the Arena. {week}', '{w}, nobody can vote for you this week. As for the rest of you, go home and decide who\'s going in. {week}'],
  arenaWelcome: ['Welcome to the Arena, everybody!', 'Alright, everybody. Welcome to the Arena.'],
  arenaRecap: ['{a}, {n} people said your name at the vote. Come on down.', '{a}, you got {n} votes last night. Come on down.'],
  arenaVolunteer: ['{a}, you volunteered to come in here. Come on down.'],
  score: ['That\'s {s}, {w}. {l}, you have to win this one to stay in the game.', 'That\'s {s}, {w}. {l}, you need this next one.'],
  scoreTie: ['We\'re tied, {s}. Next one wins it.'],
  winner: ['{w}, congratulations. You\'re still in this game. Go ahead and rejoin the group.', '{w}, you get to go back to the villa. Go on, rejoin the group.'],
  farewell: ['{l}, you fought hard tonight, and everybody here respects that. But this ends your time on The Challenge.', '{l}, I\'m sorry, buddy. You gave it everything you had. This ends your time on The Challenge.'],
  signoff: ['Now you see what\'s at stake out here. I\'ll see you guys real soon.', 'Good night, everybody. Get some sleep. You\'re going to need it.'],
};

export const ARENA_VOICE = {
  shout: [V('Come on, {a}! Dig deep!', { loud: ['LET\'S GO, {a}! LET\'S GO!'] }), V('Don\'t let go, {a}!'), V('Finish it, {a}!'), V('Get up, {a}! Get up!'), V('You\'ve got this, {a}!')],
  stand: [V('Watching {a} and {b} go at it, I get chills. This is real now.'), V('{a} is fighting for {a.posAdj} life down there.'),
    V('Every time {a} hits the ground, the whole stand flinches.'), V('I voted for this, and now I can\'t watch.')],
  bye: [V('We love you, {l}!'), V('Bye, {l}! You did so good!')],
  out: [V('I gave it everything I had. I\'m proud of how I went out, even if it wasn\'t enough.', { soft: ['I\'m sad, but I\'m proud of myself. I really fought.'], sharp: ['I lost. That\'s it. I\'m not going to make excuses.'] }),
    V('I\'m going home. I\'m going to miss these people more than I thought I would.')],
};

// Somebody's line, in their own voice, never a line this episode has already used.
export function speak(pool, speaker, slots, seed, used) {
  const list = pool || [];
  if (!list.length) return null;
  const start = hashOf(seed) % list.length;
  for (let i = 0; i < list.length; i++) {
    const turn = list[(start + i) % list.length];
    const raw = speaker && speaker !== 'TJ' ? voicedLine(turn, speaker, { rng: () => (hashOf(`${seed}|${i}`) % 1000) / 1000 }).text : turn.say;
    if (used.has(raw)) continue;
    used.add(raw);
    return raw.replace(/\{(\w+)(?:\.(\w+))?\}/g, (m, k, part) => {
      const v = slots[k];
      if (v == null) return m;
      if (part && slots.pron?.[v]) return slots.pron[v][part] ?? m;
      return v;
    });
  }
  return null;
}
export const tjLine = (key, slots, seed, used) => {
  const list = TJ_VOICE[key] || [];
  const order = list.map((_, i) => list[(hashOf(seed) + i) % list.length]);
  const pick = order.find(t => !used.has(t)) || order[0];
  if (!pick) return null;
  used.add(pick);
  return pick.replace(/\{(\w+)\}/g, (m, k) => (slots[k] != null ? slots[k] : m)).replace(/\s+$/, '');
};
