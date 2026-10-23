// ══════════════════════════════════════════════════════════════════════
// pm/talk/intro.js — an islander's tape, before they ever see the villa
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-22: the old tapes "read too simple, like they're just
// reading a list" (one line per profile field). A tape is a person talking to
// camera: who they are, what they're like, their type as a thought, the thing
// that puts them off and why, why they're here. Facts come from the character
// file and the profile only ({age}, {job}, {town} when the file has them):
//   look · vibe · ick · interest   the profile's first of each
//   from       their dialect, only when it isn't the season's default
//   kinOf      twins · family · friends · ex, and -in when already inside
//   eyes       they've already picked someone out · pastEx: an ex they'd rather not see
//   intent · persona · reg         as everywhere
// One speaker, cut together: every movement is one turn of a few sentences.
import { build } from './build.js';
import { players } from '../../core.js';

const article = w => (/^[aeiou]/i.test(w) ? `an ${w}` : `a ${w}`);
const jobOf = p => {
  const o = String(p?.occupation || '').trim();
  if (!o) return null;
  return article(/^[A-Z]{2}/.test(o) ? o : o[0].toLowerCase() + o.slice(1));
};
const townOf = p => String(p?.hometown || '').split(',')[0].trim() || null;
const record = n => players.find(p => p.name === n);
const partOf = (ev, pool) => (ev.extra?.parts || []).find(([k]) => k === pool)?.[1] ?? null;

export const INTRO = build('intro', {
  tiered: false,
  facts: (state, ev) => {
    const a = ev.players[0], p = state.profiles[a] || {}, r = record(a);
    return {
      look: p.type?.looks?.[0] || null, vibe: p.type?.vibes?.[0] || null,
      ick: p.icks?.[0] || null, interest: p.interests?.[0] || null,
      from: p.dialect && p.dialect !== (state.dialect || 'uk') ? p.dialect : null,
      kinOf: partOf(ev, 'intro-kin'), eyes: !!p.eyesOn?.length, pastEx: !!p.ex && !partOf(ev, 'intro-kin'),
      hasAge: !!r?.age, hasJob: !!jobOf(r), hasTown: !!townOf(r),
    };
  },
  slots: (state, ev) => {
    const r = record(ev.players[0]);
    return { age: r?.age ? String(r.age) : null, job: jobOf(r), town: townOf(r) };
  },
  plans: {
    featured: [
      { when: { kinOf: ['twins', 'family', 'friends', 'ex', 'twins-in', 'family-in', 'friends-in', 'ex-in'] }, plan: ['hello', 'me', 'kin', 'type', 'vibe?', 'close'] },
      { when: { eyes: true }, plan: ['hello', 'me', 'type', 'eyes', 'close'] },
      { when: { pastEx: true }, plan: ['hello', 'me', 'type', 'ick?', 'past', 'close'] },
      { plan: ['hello', 'me', 'extra?', 'type', 'vibe?', 'ick', 'close'] },
    ],
    short: ['hello', 'type', 'close'],
  },
  moves: {
    hello: [
      { when: { hasAge: true, hasJob: true, hasTown: true }, stage: "Meet {a}.", turns: [['a', "Hiya! I'm {a}, I'm {age}, I'm {job}, and I'm from {town}. And I am so ready for this, you have no idea."]] },
      { when: { hasAge: true, hasJob: true, hasTown: true }, stage: "Meet {a}.", turns: [['a', "So, I'm {a}. I'm {age}, I'm from {town}, and I work as {job}, which I love, but I'd love it a lot more if I had someone to come home to and moan about it with."]] },
      { when: { hasJob: true, hasTown: true }, stage: "Meet {a}.", turns: [['a', "Hi, I'm {a}! I'm {job} from {town}, and my friends have basically pushed me into doing this, so if it goes wrong, it's their fault."]] },
      { when: { hasAge: true, hasTown: true }, stage: "Meet {a}.", turns: [['a', "I'm {a}, I'm {age}, and I'm from {town}. And no, I didn't think I'd ever be the kind of person who does something like this either."]] },
      { when: { hasAge: true, hasJob: true }, stage: "Meet {a}.", turns: [['a', "Hello! I'm {a}, I'm {age}, and I'm {job}. People always say they wouldn't have guessed that, and I never know if that's a compliment."]] },
      { when: { hasJob: true }, stage: "Meet {a}.", turns: [['a', "I'm {a}, I'm {job}, and I've never done anything like this in my life. My hands are actually shaking. Look."]] },
      { when: { hasTown: true }, stage: "Meet {a}.", turns: [['a', "Hi, I'm {a}, and I'm from {town}. Everyone back home is going to be watching this, so, hi, everyone. Please be nice."]] },
      { stage: "Meet {a}.", turns: [['a', "Hiya, I'm {a}. I've been told to just be myself, so you're about to get a lot of me. Sorry in advance."]] },
      { when: { reg: 'nervy', hasJob: false }, stage: "Meet {a}.", turns: [['a', "Hi. Sorry. I'm {a}. I've practised this about twenty times in the car, and I've forgotten every word of it, so we're just going to see how it goes."]] },
      { when: { reg: 'big', hasJob: false }, stage: "Meet {a}.", turns: [['a', "Hello! I'm {a}, and I'm going to be the loudest person in that villa. I'm not even sorry. Someone has to be, and it might as well be me."]] },
      { when: { reg: 'dry', hasJob: false }, stage: "Meet {a}.", turns: [['a', "I'm {a}. I'm told I come across as quite serious. I'm not. I've just got one of those faces."]] },
      { when: { reg: 'sharp', hasJob: false }, stage: "Meet {a}.", turns: [['a', "I'm {a}. I don't really do small talk, so I'll keep this short: I know what I want, and I'm going in there to get it."]] },
    ],

    me: [
      { when: { persona: 'fuckboy', intent: ['fun', 'stir', 'fame', 'money', 'win'] }, turns: [['a', "My friends would say I'm a nightmare. A charming nightmare, but a nightmare. I've never really done serious. I get bored. I'm not proud of it, but I'm not going to pretend in here either."]] },
      { when: { persona: 'hopeless-romantic', intent: ['love', 'settle-down', 'first-love', 'fresh-start'] }, turns: [['a', "I'm a massive romantic. I cry at weddings, I cry at adverts, I cry at weddings in adverts. I believe in love at first sight, and everyone tells me that's why I keep getting hurt, and I still believe in it."]] },
      { when: { persona: 'checklist', intent: ['love', 'settle-down', 'first-love', 'fresh-start'] }, turns: [['a', "I know exactly what I want. I've basically got a list. Kind, honest, ambitious, good with my family. People say I'm too picky. I say I just know my worth."]] },
      { when: { persona: 'game-player', intent: ['fun', 'stir', 'fame', 'money', 'win'] }, turns: [['a', "I'm not going to lie, I've watched every series of this, and I've seen what works. I'm not saying I've got a strategy. I'm saying I've got a plan, and there's a difference."]] },
      { when: { persona: 'messy' }, turns: [['a', "I'll be honest, I'm a lot. I say what I think, usually before I've thought it. Drama follows me around, and I'm not always sure if I'm running from it or towards it."]] },
      { when: { persona: 'girls-girl' }, turns: [['a', "My friends are everything to me. I'm the one who holds your hair back, the one who tells you they're not worth it, the one who turns up with snacks at midnight. I'll be the same in there."]] },
      { when: { persona: 'villa-clown' }, turns: [['a', "I'm the funny one. In every group I've ever been in, I'm the funny one. Which is great, until you want someone to take you seriously, and they're still laughing at the last thing you said."]] },
      { when: { persona: 'wallflower' }, turns: [['a', "I'm quite shy, honestly, until I get to know you. Then I don't shut up. So if I'm quiet in the first few days, just give me a minute. It's worth the wait. I think."]] },
      { when: { persona: 'bombshell' }, turns: [['a', "I like to make an entrance. I'm not going to walk in there and sit quietly in the corner, that's just not me. If there's someone I want, they'll know about it by lunchtime."]] },
      { turns: [['a', "What am I like? My friends would say I'm loyal, a bit too honest, and terrible at hiding what I'm feeling. You'll always know where you stand with me, whether you want to or not."]] },
      { turns: [['a', "I'm an open book, honestly. I'm the friend people ring at two in the morning. I'll always pick up. I just wish someone would do the same for me for once."]] },
      { when: { reg: 'soft' }, turns: [['a', "I'm a softie. Everyone thinks I'm really together, and on the outside I am, but give me a sad film and I'm gone. I just want someone I can be soft with."]] },
      { when: { reg: 'flirty' }, turns: [['a', "I'm a flirt. I know I am. I can't help it, it just comes out. Waiters, bus drivers, it doesn't matter. In there, I'm going to have to be very careful who I point it at."]] },
      { when: { reg: 'big' }, turns: [['a', "I'm loud, I'm extra, I'm always the last one dancing. I've been told I'm too much. I've decided that's other people's problem."]] },
      { when: { reg: 'dry' }, turns: [['a', "People take a while to work me out. I say things with a straight face, and they don't know if I'm joking. Usually I am. Sometimes I'm not. That's half the fun."]] },
      { when: { reg: 'sharp' }, turns: [['a', "I'm competitive about everything. Board games, quizzes, who can carry the most shopping bags. I don't like losing, and I don't plan on losing in there."]] },
      { when: { reg: 'nervy' }, turns: [['a', "I'm an overthinker. If someone takes ten minutes to text me back, I've already decided they hate me. I know it's mad. I'm working on it. I'm hoping this helps. Or it might make it so much worse."]] },
    ],

    extra: [
      { when: { interest: 'fitness' }, turns: [['a', "The gym is my happy place. Six days a week, every week, and on the seventh I think about the gym. I'd love someone who'll train with me, or at least someone who doesn't mind me getting up at six."]] },
      { when: { interest: 'football' }, turns: [['a', "Football's my life. I've supported the same team since I could walk. If whoever I end up with doesn't watch it, they're going to learn, because Saturdays are not up for discussion."]] },
      { when: { interest: 'other-sport' }, turns: [['a', "I play sport every weekend, have done since I was a kid. I'm used to being part of a team, having people's backs. I'm hoping that comes in handy in there."]] },
      { when: { interest: 'dance' }, turns: [['a', "I dance everywhere. Kitchens, clubs, the queue at the shop. If there's music on, I'm moving. If I can find someone who'll dance with me, that's half the battle won."]] },
      { when: { interest: 'music' }, turns: [['a', "Music is everything to me. I've always got something playing. I'm also going to sing in that villa, quite badly, and everyone's just going to have to deal with it."]] },
      { when: { interest: 'fashion' }, turns: [['a', "I love clothes. I've packed so much I had to sit on my suitcase to close it. I'll be changing about five times a day, and I'll be judging everyone's outfits, lovingly."]] },
      { when: { interest: 'beauty' }, turns: [['a', "My skincare routine is longer than most people's whole morning. I'll have the entire villa doing face masks by the end of the first week, boys included."]] },
      { when: { interest: 'travel' }, turns: [['a', "I've travelled loads, and the best bits were always the people I met. I'd love to find someone who'll book a last-minute flight with me just because it's cheap."]] },
      { when: { interest: 'languages' }, turns: [['a', "I speak a few languages, which mostly means I can say sorry in a lot of different ways. Very useful in my last relationship."]] },
      { when: { interest: 'family' }, turns: [['a', "I come from a big, loud family, and I'm close to every single one of them. Whoever I end up with has to be able to handle a Sunday dinner with all of us. It's not for the weak."]] },
      { when: { interest: 'animals' }, turns: [['a', "I love animals more than most people, honestly. If you don't like dogs, I'm not sure we can be friends, let alone anything else."]] },
      { when: { interest: 'outdoors' }, turns: [['a', "Give me a hill and a pair of walking boots and I'm happy. The villa's going to be a bit posh for me. I'll probably end up sleeping on the lawn."]] },
      { when: { interest: 'partying' }, turns: [['a', "I love a night out. I'm always the one who says just one drink, and then it's four in the morning and I'm teaching strangers a dance routine."]] },
      { when: { interest: 'career' }, turns: [['a', "I work really hard. I've built everything I've got myself, and I'm proud of it. I just realised I've spent so long on my career that I forgot to have a life. So here I am, having one."]] },
      { when: { interest: 'education' }, turns: [['a', "I've just finished studying, and this is the first summer in years I've not had a deadline. I'm a bit of a geek, honestly. I'll probably end up explaining something nobody asked about."]] },
      { when: { interest: 'performing' }, turns: [['a', "I've been performing since I was tiny. Put me on a stage and I come alive. Which means if I cry in there, you'll never know if it's real. It will be. Probably."]] },
      { when: { interest: 'social-media' }, turns: [['a', "I post everything. If I eat it, it's online. Not having my phone for weeks is honestly the scariest part of this for me. Scarier than the recouplings."]] },
      { when: { interest: 'wellness' }, turns: [['a', "I'm big on looking after my head. I meditate every morning, I journal, the lot. I think I'm going to need every bit of that in there."]] },
      { when: { interest: 'food' }, turns: [['a', "I love food. Cooking it, eating it, talking about it. If you're with me, you'll never go hungry, and that's a promise. That villa kitchen is going to be mine."]] },
      { when: { interest: 'gaming' }, turns: [['a', "I'm a gamer, and I'm not ashamed of it. This is the longest I've been away from a screen in years. Beat me at something, and honestly, I'll probably marry you."]] },
      { when: { interest: 'faith' }, turns: [['a', "My faith is a big part of who I am. It keeps me grounded, and I'd want someone who respects that, even if it's not their thing."]] },
      { when: { interest: 'pop-culture' }, turns: [['a', "I've watched every series of this show. I know how it works. I know what not to do. Whether I actually manage not to do it is a different question."]] },
      { when: { from: ['scot'] }, turns: [['a', "I'm Scottish, so you'll hear me before you see me. And I'll be telling everyone in there it's warmer at home, which it absolutely isn't."]] },
      { when: { from: ['geordie'] }, turns: [['a', "I'm a Geordie, so nobody's going to understand a word I'm saying for the first week, and I'm completely fine with that."]] },
      { when: { from: ['ie'] }, turns: [['a', "I'm Irish, so I can talk to anyone about anything for hours. Whoever ends up with me is going to need a lot of patience and very good hearing."]] },
      { when: { from: ['us', 'ca'] }, turns: [['a', "I've come a long way for this, and I've already been told I say everything wrong. I don't care. I'm going to say it louder."]] },
      { when: { from: ['au', 'nz'] }, turns: [['a', "I've flown across the world for this, so it had better be worth it. And no, I'm not scared of the spiders. I'm more scared of the recouplings."]] },
      { when: { from: ['za'] }, turns: [['a', "Everyone always asks about my accent, so go on, get it out of the way. I've grown up in the sun, so I'm used to the heat. Not the drama, though."]] },
      { when: { from: ['esl', 'es', 'it', 'fr', 'br', 'de'] }, turns: [['a', "English isn't my first language, so if I say something strange in there, just go with it. Sometimes I mean it, and sometimes I'm just translating badly."]] },
    ],

    type: [
      { when: { look: 'tall' }, turns: [['a', "My type on paper? Tall. Really tall. I like having to look up at someone. I know it's shallow, but I've tried going for shorter people, and it just doesn't do the same thing to me."]] },
      { when: { look: 'tall' }, turns: [['a', "I've got one rule, and it's height. I want to stand on my tiptoes to kiss someone. Everything else, I'm flexible on. Height, I'm not."]] },
      { when: { look: 'short' }, turns: [['a', "Everyone says they want tall. I don't. I like someone I can look in the eye. Really tall people make me nervous. It's like talking to a lamppost."]] },
      { when: { look: 'short' }, turns: [['a', "Honestly, I prefer someone my size. Small and confident is the best combination there is. They've always got the most to prove, and I love that."]] },
      { when: { look: 'muscular' }, turns: [['a', "I'm not going to lie, I go for someone who clearly lives in the gym. Arms are the first thing I notice. I'm not ashamed of it. If you've got shoulders like a door frame, I'm listening."]] },
      { when: { look: 'muscular' }, turns: [['a', "My type is basically someone who could carry me up the stairs if they had to. Not that they'd need to. But it's nice to know they could."]] },
      { when: { look: 'slim' }, turns: [['a', "I usually go for someone slim and sporty, someone who'll come on a run with me on a Sunday morning, or at least pretend to want to."]] },
      { when: { look: 'slim' }, turns: [['a', "I like someone lean who looks after themselves. Good cheekbones. A bit sharp-looking. I don't know why. It's just what catches my eye every time."]] },
      { when: { look: 'dad-bod' }, turns: [['a', "Give me a bit of a dad bod any day of the week. I don't trust a six-pack. I want someone who enjoys their food and is nice to fall asleep on."]] },
      { when: { look: 'dad-bod' }, turns: [['a', "Abs are overrated. Honestly. I want someone cuddly, someone who'll share a takeaway with me and not count the calories."]] },
      { when: { look: 'blonde' }, turns: [['a', "Every single person I've ever been with has been blonde. I don't plan it. It just happens. My friends think it's hilarious."]] },
      { when: { look: 'blonde' }, turns: [['a', "Put a blonde in front of me and I go to pieces. Blonde hair, a nice tan, a big smile. That's the dream."]] },
      { when: { look: 'brunette' }, turns: [['a', "I always end up with brunettes. Long dark hair gets me every time. My friends say I'm the most predictable person they know."]] },
      { when: { look: 'brunette' }, turns: [['a', "Brown hair, brown eyes, warm colours. I don't know why, but that's always the person I end up talking to all night."]] },
      { when: { look: 'dark-hair' }, turns: [['a', "Dark hair, dark eyes, a bit of stubble if they can grow it. That's my weakness. Anyone like that walks into a room, and I've stopped listening to whoever I was talking to."]] },
      { when: { look: 'dark-hair' }, turns: [['a', "I go for dark hair and a serious face. Someone who looks like they're thinking something they're not going to tell you. I find that very hard to resist."]] },
      { when: { look: 'redhead' }, turns: [['a', "Redheads. I've always had a thing for them. Every crush I had at school had red hair. Still true, I'm afraid."]] },
      { when: { look: 'redhead' }, turns: [['a', "Ginger hair and freckles is the cutest thing in the world, and I will fight anyone who says otherwise."]] },
      { when: { look: 'tattoos' }, turns: [['a', "Tattoos. The more the better, honestly. Every one's got a story, and I want to hear every single one of them, even the embarrassing ones. Especially the embarrassing ones."]] },
      { when: { look: 'tattoos' }, turns: [['a', "A sleeve of tattoos and I'm gone. I've got a couple myself, and I like someone who isn't scared of a bit of ink."]] },
      { when: { look: 'great-smile' }, turns: [['a', "The first thing I notice is a smile. If you've got a good one, I'm done for. Someone who smiles with their whole face, and laughs with their whole body. That's it for me."]] },
      { when: { look: 'great-smile' }, turns: [['a', "I know it sounds weird, but teeth. A good smile is everything. You can tell so much about someone from how they smile when they think nobody's looking."]] },
      { when: { look: 'pretty-boy' }, turns: [['a', "I like them a bit pretty. Nice skin, good hair, smells amazing. Someone who takes longer to get ready than I do, and isn't embarrassed about it."]] },
      { when: { look: 'pretty-girl' }, turns: [['a', "I go for someone really put-together. Hair done, nails done, the full look. I love someone who makes an effort. It makes me want to make one too."]] },
      { when: { look: 'rugged' }, turns: [['a', "I like someone a bit rough around the edges. Messy hair, a couple of scars, looks like they could fix a car. Too polished and I get bored."]] },
      { when: { look: 'rugged' }, turns: [['a', "My type looks like they've just come back from a week of camping. A beard, a bit scruffy, completely unbothered. I love it."]] },
      { when: { look: 'accent' }, turns: [['a', "An accent gets me every time. It doesn't even matter which one. If you talk differently to me, I'll listen to anything you say, even if it's rubbish."]] },
      { when: { look: 'glam' }, turns: [['a', "I love someone who makes an effort. Full glam, every day, heels by the pool. The more effort someone puts in, the more I'm into it."]] },
      { when: { look: 'natural' }, turns: [['a', "I prefer someone natural. No filters, no fuss. Someone who looks good first thing in the morning with their hair everywhere. That's the one."]] },
      { turns: [['a', "My type on paper? Honestly, I don't really have one. I've been with all sorts. It's more about how someone makes me feel than what they look like. Mostly. Okay, a bit about what they look like."]] },
    ],

    vibe: [
      { when: { vibe: 'funny' }, turns: [['a', "But what really gets me is someone who makes me laugh. Properly laugh, until I can't breathe. If you can do that, you're already halfway there with me."]] },
      { when: { vibe: 'confident' }, turns: [['a', "But more than anything, I want someone confident. Someone who walks over and talks to me first. I'm tired of always being the one who makes the move."]] },
      { when: { vibe: 'emotionally-mature' }, turns: [['a', "What I actually want, though, is someone who can talk about their feelings. Someone who says sorry when they're wrong. It's rarer than it should be, honestly."]] },
      { when: { vibe: 'fiery' }, turns: [['a', "And I like a bit of fire. I don't want someone who agrees with everything I say. I want someone who'll argue back, and then make up with me after."]] },
      { when: { vibe: 'ambitious' }, turns: [['a', "But what really matters is drive. I want someone with a plan. I've got one, and I need someone who's going to match it, not hold me back."]] },
      { when: { vibe: 'family-oriented' }, turns: [['a', "And they've got to be close to their family. If they love their family, they'll love mine, and that's the real test. My family will vet them, trust me."]] },
      { when: { vibe: 'protective' }, turns: [['a', "But honestly, I just want to feel safe with someone. Someone who'd stand up for me in a room full of people without me having to ask."]] },
      { when: { vibe: 'bubbly' }, turns: [['a', "And I want someone who lights up a room. Good energy. Someone who's always up for it, happy, loud, fun. Life's too short for moody."]] },
      { when: { vibe: 'chill' }, turns: [['a', "But mostly I want someone calm. I've got enough going on in my own head. I need someone I can just sit with, and it's easy."]] },
      { when: { vibe: 'competitive' }, turns: [['a', "And I like someone competitive. If we're playing a board game, I want a fight. If you let me win at anything, honestly, it's over."]] },
      { when: { vibe: 'mysterious' }, turns: [['a', "But what really pulls me in is someone I can't quite work out. The quiet one in the corner. The ones I can't read are the ones I can't stop thinking about."]] },
    ],

    ick: [
      { when: { ick: 'nonchalant' }, turns: [['a', "My biggest ick? Someone who acts like they don't care. Just care! Text back! If you play it cool with me, I'll assume you're not interested, and I'll move on, and then it's your loss."]] },
      { when: { ick: 'cocky' }, turns: [['a', "My ick is arrogance. Confident is great. Cocky, and I'm out. If you talk about yourself for ten minutes straight on a first date, I've already planned my excuse to leave."]] },
      { when: { ick: 'loud' }, turns: [['a', "I can't do someone who's loud just for attention. If you're shouting across the room so everyone looks at you, I've already gone. Be loud with me, not at everyone."]] },
      { when: { ick: 'people-pleaser' }, turns: [['a', "I don't want someone who agrees with everything I say. Have an opinion! If you tell everyone what they want to hear, how am I ever supposed to trust you?"]] },
      { when: { ick: 'attention-seeker' }, turns: [['a', "My ick is someone who's always checking who's watching. If you need the whole room looking at you all the time, it isn't me you want. It's an audience."]] },
      { when: { ick: 'chaser' }, turns: [['a', "I hate being chased. Give me space, and I'll come to you. Text me twenty times in a day and I'm not replying to any of them. I need to miss you a little bit."]] },
      { when: { ick: 'no-manners' }, turns: [['a', "Manners. That's my thing. Please, thank you, hold the door. If you're rude to someone serving you, that's it, we're done, I don't care what you look like."]] },
      { turns: [['a', "My ick? Someone who's fake. I can spot it a mile off. If you're one thing to my face and another behind my back, I'll find out. I always find out."]] },
    ],

    kin: [
      { when: { kinOf: 'twins' }, turns: [['a', "And I'm not doing this on my own. My twin is going in with me. People always ask if twins can feel what the other one's feeling. We're about to find out, in front of the whole country."]] },
      { when: { kinOf: 'family' }, turns: [['a', "Someone from my family is going in too, which is either going to be the best thing ever or a complete disaster. Probably both. Family comes first, though. Even in there."]] },
      { when: { kinOf: 'friends' }, turns: [['a', "The good news is, my best friend is going in with me. The bad news is, they know every single one of my secrets. So I'm going to have to be very nice to them."]] },
      { when: { kinOf: 'twins-in' }, turns: [['a', "My twin has been in there for days, and has no idea I'm coming. I cannot wait to see that face. Well. My face, technically."]] },
      { when: { kinOf: 'family-in' }, turns: [['a', "Someone from my family is already in that villa, and they have no idea I'm about to walk in. I've been watching from home, and honestly, I've got some notes."]] },
      { when: { kinOf: 'friends-in' }, turns: [['a', "My best friend is already in there. They're going to scream when they see me. And then they're going to panic, because they know exactly what I'm like."]] },
      { when: { kinOf: 'ex-in' }, turns: [['a', "And I know exactly who's in that villa. One of them used to be mine. Let's just say there's some unfinished business. Or finished business. We'll find out."]] },
      { when: { kinOf: 'ex' }, turns: [['a', "Oh, and my ex is going in too. I'm fine about it. I'm completely fine. I'm absolutely, totally fine about it."]] },
    ],

    eyes: [
      { turns: [['a', "And I'll be honest, I've seen who's in there, and there's already one person I really want to meet. I'm not saying who. But they're going to find out pretty quickly."]] },
      { turns: [['a', "I already know who I'm going for. They just don't know it yet. I've been thinking about it the whole way here, and I'm not walking in there to be polite."]] },
    ],

    past: [
      { turns: [['a', "And I've got some history I'm hoping stays in the past. My last relationship didn't end well. If I never have to see them again, that's fine by me. I'm here for something new."]] },
      { turns: [['a', "There's someone from my past I'm hoping I never have to explain myself to. Let's just leave it there. New start. Clean slate. That's the plan."]] },
    ],

    close: [
      { when: { intent: 'love' }, turns: [['a', "I'm here to fall in love. Properly. I'm done with situationships and messages that go nowhere. I want the real thing, and I think it might be in that villa."]] },
      { when: { intent: 'love' }, turns: [['a', "I've never had a relationship that lasted more than a few months, and I want to change that. I'm ready. I'm actually ready this time. Let's go."]] },
      { when: { intent: 'settle-down' }, turns: [['a', "All my friends are settling down, and I'm the last one left. I want what they've got. Someone to come home to. I'm ready to stop looking."]] },
      { when: { intent: 'first-love' }, turns: [['a', "I've never been in love. Not once. Everyone talks about it like it's the best thing in the world, and I'd really like to know what they mean."]] },
      { when: { intent: 'fresh-start' }, turns: [['a', "I've had a rough year, if I'm honest. I'm doing this for me. A fresh start, a bit of sun, and maybe, if I'm lucky, someone who's worth it."]] },
      { when: { intent: 'fun' }, turns: [['a', "I'm not going in there looking for a husband or a wife. I'm going in to have the best summer of my life. If I find someone along the way, brilliant. If not, I've had a laugh."]] },
      { when: { intent: 'stir' }, turns: [['a', "I'm not going in there to sit quietly. If there's a couple that isn't working, I'll be the first to point it out. Someone's got to keep things interesting."]] },
      { when: { intent: ['fame', 'money'] }, turns: [['a', "Of course I want to find someone. But I'm not going to lie, I'd like everyone at home to know my name by the end of it as well. Is that so bad?"]] },
      { when: { intent: 'win' }, turns: [['a', "I'm competitive, and I'm going in there to win. Love's lovely. But I'm going to the final, and whoever's next to me had better keep up."]] },
      { turns: [['a', "So yeah. That's me. I'm ready. I think. Let's go and find out."]] },
      { when: { reg: 'big' }, turns: [['a', "Villa, I'm coming for you! Somebody get the drinks in!"]] },
      { when: { reg: 'nervy' }, turns: [['a', "Okay. I'm going to go now before I change my mind. Wish me luck. Actually, wish me a lot of luck."]] },
    ],
  },
});
