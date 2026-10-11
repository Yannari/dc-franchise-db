// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/coach-arrive.js — the coaches' entrance on day one
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-10: the coaches stepped off the boat as four of "twenty contestants", and Heather said
// "I'm here to win". Now the contestants arrive first (twists.js keeps coaches out of their order), and
// then the coaches come in together, as what they are: people the contestants have watched on TV. Each
// gets their card and the host's introduction from their real record (td/past.js), says something in
// their own voice, and somebody on the dock reacts: somebody who has history with them, a fan, or a
// skeptic. Then the host reads the rules, with the dock asking the questions anybody would ask, and
// each team meets its coaches. Words only: nothing here moves a bond.
import { famOf, P, listOf } from './voiced.js';
import { historyOf } from '../td/story/director.js';

const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
// the host's introduction for a coach with no record in the ledger: who they are on this show (their
// archetype), and otherwise one of the general ones, never the same one twice in a row of coaches
const INTRO = {
  villain: (n, p) => `${n}. Villain, legend, and the reason half of you have trust issues.`,
  mastermind: (n, p) => `${n}. The best strategist this show has ever seen, and ${p.sub} will tell you so.`,
  schemer: (n, p) => `${n}. If something's going on behind your back, ask ${n}. Actually, don't.`,
  hero: (n, p) => `${n}. Everybody's favourite, and probably the nicest person who's ever stood on this dock.`,
  'loyal-soldier': (n, p) => `${n}. The most loyal person you'll ever meet out here. Learn from that.`,
  'challenge-beast': (n, p) => `${n}. Built for challenges. You'll be training until you drop.`,
  'social-butterfly': (n, p) => `${n}. Friends with everybody. Nobody knows how.`,
  showmancer: (n, p) => `${n}. Heart on ${p.posAdj} sleeve, every single time. Try not to fall for the coach.`,
  hothead: (n, p) => `${n}. Please don't make ${p.obj} angry. I'm serious.`,
  'chaos-agent': (n, p) => `${n}. Wherever ${n} goes, something catches fire. Usually not for real.`,
  wildcard: (n, p) => `${n}. Nobody ever knows what ${p.sub} ${p.is} going to do next. Including ${n}.`,
  underdog: (n, p) => `${n}. Nobody ever bets on ${p.obj}. That's always a mistake.`,
  floater: (n, p) => `${n}. Somehow always still here. Nobody's quite sure how.`,
  goat: (n, p) => `${n}. A fan favourite. Mostly for reasons ${p.sub} didn't plan.`,
  'perceptive-player': (n, p) => `${n}. Notices everything. Including whatever you're hiding right now.`,
};
const GENERAL = [
  (n, p) => `${n}. If you've watched this show at all, you know exactly who this is.`,
  (n, p) => `Give it up for ${n}! Some of you grew up watching ${p.obj}. Don't make it weird.`,
  (n, p) => `${n}, everybody. A legend of this show, and ${p.sub} ${p.is} going to remind you of that daily.`,
];
const introOf = (n, arch, p, i) => (INTRO[arch] || GENERAL[i % GENERAL.length])(n, p);
const FANS = new Set(['underdog', 'goat', 'social-butterfly', 'showmancer', 'hero', 'loyal-soldier', 'floater']);

/**
 * Push the coaches' entrance onto an arrival screen's steps.
 * ctx: { ep, host, steps, here (contestants on the dock), scene(focus, extra), intro(name, extra), ride, players }
 */
export function coachArrival(ctx) {
  const { ep, host, steps, here, scene, ride } = ctx;
  const coaches = ep.coachArrivals || [];
  if (!coaches.length) return [];
  const archOf = n => (ctx.players || []).find(p => p.name === n)?.archetype || null;
  const used = new Set();
  const spoke = {};
  // a line in the speaker's own way (sharp, dry, loud, soft, odd), never one already said today
  const V = (n, o, tag) => {
    const f = famOf(n);
    const opts = (o[f] && o[f].length) ? o[f] : (o.any || Object.values(o)[0] || []);
    const fresh = opts.filter(t => !used.has(t));
    const list = fresh.length ? fresh : opts;
    const t = list[hash(`${ep.num}|coach|${tag}|${n}`) % list.length];
    used.add(t); return t;
  };
  const say = (by, text, focus = [by], extra = {}) => { steps.push({ k: 'say', by, text, focus, loud: /!/.test(text), ...extra }); spoke[by] = (spoke[by] || 0) + 1; };
  const hostSay = (text, focus = [], extra = {}) => steps.push({ k: 'say', by: host, host: true, text, focus, ...extra });
  const beat = (text, focus = [], extra = {}) => steps.push({ k: 'beat', text, focus, ...extra });
  const conf = (by, text) => steps.push({ k: 'conf', by, text });
  // whoever on the dock has said least, among those who fit
  const quiet = (pool, salt) => [...pool].sort((x, y) => (spoke[x] || 0) - (spoke[y] || 0) || (hash(`${salt}|${x}`) - hash(`${salt}|${y}`)))[0] || null;
  const names = coaches.map(c => c.name);

  // ── they come in together ──
  scene([]);
  hostSay(`That's everybody. Well... everybody who's playing.`, [], { tense: true });
  const asker = quiet(here.filter(n => ['loud', 'odd', 'soft'].includes(famOf(n))), 'ask') || quiet(here, 'ask');
  if (asker) say(asker, V(asker, {
    loud: [`Wait, what does THAT mean?`, `Hold on. Who else is coming?!`],
    odd: [`Is it ghosts? Please say it's ghosts.`, `Ooh, a mystery guest. I love a mystery guest.`],
    soft: [`Um... is somebody else coming?`, `Wait, there's more people?`],
    any: [`Wait. Who else is coming?`],
  }, 'ask'), [asker]);
  beat(ride === 'yacht' ? `A speedboat comes in fast and cuts its engine at the end of the dock. ${listOf(names)} step off, and the dock goes quiet.`
    : `One more ride pulls in. ${listOf(names)} step out, and everybody waiting goes quiet.`,
  names, { act: { kind: 'ride', ride: ride || 'yacht', riders: ride === 'yacht' ? names : [] }, tense: true });
  hostSay(`This season, nobody does this alone. Every team gets ${coaches.length > 2 ? 'coaches' : 'a coach'}. People who stood exactly where you're standing, and made it further than most of you ever will.`, names);

  // ── each coach: the card, the host's introduction, their first words, and the dock ──
  const reacted = new Set();
  coaches.forEach((c, i) => {
    const n = c.name, p = P(n), past = c.past;
    scene([n], { act: { kind: 'arrive', who: [n], ride: 'walk' } });
    ctx.intro(n, { tag: 'Coach', n: i + 1, of: coaches.length, returnee: !!past, past: past || null });
    hostSay(!past ? introOf(n, c.archetype, p, i)
      : past.kind === 'won' ? `${n}. Won ${past.where}. Yes, that ${n}. Some of you have the poster.`
        : past.kind === 'final' ? `${n}. Made it all the way to the final of ${past.where}, and ${p.sub} still ${p.sub === 'they' ? 'think' : 'thinks'} about that vote.`
          : `${n}. ${past.placeWord} on ${past.where}, which, believe it or not, still beats most of you.`, [n]);
    say(n, V(n, {
      sharp: [`Let's get one thing straight. I'm not here to make friends. I'm here to make you less embarrassing.`, `Wow. So this is what they gave me to work with.`, `Don't clap. Just listen when I talk, and we'll get along fine.`, `I've seen better casts. I've also seen worse. Not many.`],
      loud: [`What's up, camp?! Who's ready to get yelled at?`, `Oh, I missed this place! I did NOT miss the food!`, `Okay, okay, okay! Coach is in the building!`, `Let's GO! I've been waiting all year for this!`],
      soft: [`Hi, everybody! I'm so excited to work with you. Seriously.`, `Okay, I'm a little nervous, which is funny, because I'm not even playing.`, `Hi! Don't worry, I'm the nice one. Probably.`, `I remember being where you are. It's scary. I'm here to help.`],
      dry: [`Hello. I'm told I'm a coach now. Nobody asked if I'm good at it.`, `You all look exactly as scared as I was. That's good. Scared listens.`, `I've done this before. Mostly I remember the food.`, `Hi. I'll learn your names eventually.`],
      odd: [`I brought a whistle. I don't know what it's for yet, but I brought it.`, `Hi! I've never coached anything before, except a hamster, and he did great.`, `Good news, everyone. I've read a book about coaching. Most of it.`, `Is it weird that I missed this place? It's weird, right?`],
      any: [`Hey, everybody. Let's have a good season.`],
    }, `hello${i}`), [n]);

    // somebody on the dock: shared history first, then a fan or a skeptic, in turn
    const hist = here.map(h => ({ h, x: historyOf(h, n) })).find(({ h, x }) => x.facts.hist !== 'none' && !reacted.has(h));
    if (hist) {
      const h = hist.h, k = hist.x.facts.hist;
      reacted.add(h);
      const ex = {
        wronged: [[h, `You. Of course they made you a coach.`], [n, `Nice to see you too. No hard feelings, right?`], [h, `Plenty of hard feelings.`]],
        wronger: [[n, `Well, well. Last time, you're the reason I went home.`], [h, `That was a long time ago.`], [n, `Not for me, it wasn't.`]],
        oldflame: [[h, `...Hi.`], [n, `Hi. Wow. Okay. This is going to be weird.`], [h, `It's fine. It's totally fine. It's fine.`]],
        oldcouple: [[h, `You didn't tell me you'd be here!`], [n, `I wasn't allowed to! Hi!`]],
        oldrivals: [[h, `Oh, great. Of all the people they could have picked.`], [n, `Missed you too.`]],
        oldallies: [[h, `Hey! It's been forever!`], [n, `Look at you, back for more! I'm proud of you.`]],
      }[k] || [[h, `Seriously? Nobody told me you'd be here.`], [n, `Surprise. Try not to embarrass me.`]];
      for (const [by, t] of ex) say(by, t, [by, by === n ? h : n], by === h ? { act: { kind: 'lean', who: [h, n] } } : {});
    } else if (i % 2 === 0) {
      const fan = quiet(here.filter(h => !reacted.has(h) && (FANS.has(archOf(h)) || ['soft', 'loud', 'odd'].includes(famOf(h)))), `fan${i}`) || quiet(here.filter(h => !reacted.has(h)), `fan${i}`);
      if (fan) {
        reacted.add(fan);
        say(fan, V(fan, {
          soft: [`Oh my gosh. I watched every episode of your season. Twice.`, `I can't believe it's really you. Hi. Sorry. Hi.`],
          loud: [`No WAY. You're actually here! You're actually real!`, `Are you kidding me?! I had your face on my lunchbox!`],
          odd: [`Can I touch your arm? Just to check you're real.`, `I named my goldfish after you. He died, but it was an honour.`],
          dry: [`Okay, I'll admit it. I was rooting for you. Don't tell anybody.`, `I'm not a fan. I've just seen every episode. That's different.`],
          sharp: [`I studied your game. I'll be honest, I'd have done a few things differently.`, `So you're the one I'm supposed to learn from. Okay. Teach me.`],
          any: [`I watched your season. All of it.`],
        }, `fan${i}`), [fan, n], { act: { kind: 'lean', who: [fan, n] } });
        say(n, V(n, {
          sharp: [`Of course you did. Stand up straight.`, `Obviously. Now stop staring at me.`],
          dry: [`Thank you. I think. That might have been a compliment.`, `That's nice. Please stop looking at me like that.`],
          loud: [`Okay, you're my favourite already!`, `See? Somebody here has taste!`],
          soft: [`Aw, really? That's so nice. Thank you.`, `Stop, you're going to make me cry on day one.`],
          odd: [`Aw. You're weird. I like you.`, `Thank you. I'll sign something later. Maybe your arm.`],
          any: [`Thanks. That means a lot.`],
        }, `fanback${i}`), [n, fan]);
      }
    } else {
      const sk = quiet(here.filter(h => !reacted.has(h) && ['sharp', 'dry'].includes(famOf(h))), `sk${i}`) || quiet(here.filter(h => !reacted.has(h)), `sk${i}`);
      if (sk) {
        reacted.add(sk);
        say(sk, V(sk, {
          sharp: [`So they get to boss us around, and they can't even lose? Great deal for them.`, `A coach. Wonderful. Another person telling me what to do.`],
          dry: [`Cool. A coach. I can't wait to be told I'm holding the paddle wrong.`, `So we get homework now. On a reality show.`],
          loud: [`Hold on, so they just get to boss us around now?!`, `Nobody said anything about a coach!`],
          soft: [`Um... what does a coach even do here?`, `Is a coach good or bad? I honestly can't tell.`],
          odd: [`Do coaches get their own cabin? Because I want to be a coach.`, `Does a coach get a whistle? I feel like I'd be good with a whistle.`],
          any: [`So what does a coach actually do?`],
        }, `sk${i}`), [sk, n]);
        // the soft and odd skeptics asked a question (what does a coach do?); the rest complained
        const asked = ['soft', 'odd'].includes(famOf(sk));
        say(n, asked ? V(n, {
          sharp: [`Make you good enough that I don't have to watch you lose.`, `Win. Through you. Any other questions?`],
          dry: [`Mostly I'm here to watch you make the mistakes I made.`, `Help you not go home first. That's the big one.`],
          loud: [`Oh, you'll see! You're going to LOVE it!`, `Everything! Training! Yelling! Mostly yelling!`],
          soft: [`I'm here to help, I promise. You'll see.`, `Help you not go home first. That's the big one.`],
          odd: [`Honestly? I'm still figuring that out too.`, `Snacks, mostly. And wisdom. But mostly snacks.`],
          any: [`You'll find out tomorrow.`],
        }, `skback${i}`) : V(n, {
          sharp: [`You'll find out. Probably the hard way.`, `I'll remember you said that.`],
          dry: [`Noted. You're first tomorrow.`, `Great attitude. You're going to be so much fun.`],
          loud: [`Oh, you are going to be FUN to coach!`, `Buddy, you have no idea what's coming!`],
          soft: [`I get it. Just give me one day, okay?`, `That's fair. Let me earn it.`],
          odd: [`That's the spirit! Wait, no, it isn't.`, `I like you. You're grumpy. We'll work on that.`],
          any: [`We'll see how you feel tomorrow.`],
        }, `skback${i}`), [n, sk]);
      }
    }
  });

  // ── the rules, with the dock asking what anybody would ask ──
  scene([...names.slice(0, 4)]);
  steps.push({ k: 'title', kicker: 'This season', name: 'The Coaches', faces: names.slice(0, 6) });
  hostSay(`Here's how it works. Every day, your coaches pick a few of you and train you. Get picked, and you get better. Don't get picked...`, names);
  hostSay(`...and you'll notice.`);
  const q1 = quiet(here.filter(h => ['loud', 'odd', 'soft'].includes(famOf(h))), 'q1') || quiet(here, 'q1');
  if (q1) say(q1, V(q1, { loud: [`Wait, do they compete too?!`], odd: [`Do they have to eat Chef's food too? Because that's the real test.`], soft: [`So do they do the challenges with us?`], any: [`Do they compete too?`] }, 'q1'), [q1]);
  hostSay(`Nope. No challenges, no immunity, and no vote. A coach doesn't get a ballot.`);
  const q2 = quiet(here.filter(h => h !== q1 && ['sharp', 'dry'].includes(famOf(h))), 'q2') || quiet(here.filter(h => h !== q1), 'q2');
  if (q2) say(q2, V(q2, { sharp: [`So what's stopping us from voting them out?`], dry: [`Can we vote them out? Asking for everybody.`], any: [`Can we vote them out?`] }, 'q2'), [q2]);
  hostSay(`Absolutely nothing! A coach can go home at the campfire like anybody else. And everything they taught you goes home with them.`, names, { tense: true });
  const brave = names.find(n => famOf(n) === 'sharp') || names.find(n => famOf(n) === 'loud') || names[0];
  say(brave, V(brave, { sharp: [`So be nice to me. It's in your interest.`], loud: [`So don't even THINK about it!`], soft: [`Please don't, though. I'm really nice.`], dry: [`So, you know. Think it through.`], odd: [`I'd haunt you. Just so you know.`], any: [`So maybe don't.`] }, 'brave'), [brave]);
  hostSay(`But the coaches on each team share one Save Card. If you vote a coach out, the card can save them. Every coach on that team has to sign it, though, and somebody else goes home instead.`, names);
  const q3 = quiet(here.filter(h => ![q1, q2].includes(h) && ['soft', 'loud', 'odd'].includes(famOf(h))), 'q3') || quiet(here.filter(h => ![q1, q2].includes(h)), 'q3');
  if (q3) { say(q3, V(q3, { soft: [`Somebody else? Like... one of us?`], loud: [`Wait, SOMEBODY ELSE goes home?!`], odd: [`Somebody else? Like a stunt double?`], any: [`Somebody else? One of us?`] }, 'q3'), [q3]); hostSay(`Like one of you!`); }
  hostSay(`And here's my favourite part. Any coach who's still standing at the merge stops being a coach... and starts playing.`, names, { tense: true });
  const q4 = quiet(here.filter(h => ![q1, q2, q3].includes(h) && ['sharp', 'dry'].includes(famOf(h))), 'q4') || quiet(here.filter(h => ![q1, q2, q3].includes(h)), 'q4');
  if (q4) { say(q4, V(q4, { sharp: [`So we're training our own competition. Brilliant.`], dry: [`So they teach us everything, and then they play against us. Cool. Love that.`], any: [`So we're training our own competition?`] }, 'q4'), [q4]); hostSay(`Isn't it great?`); }
  const quietCoaches = names.filter(n => famOf(n) !== 'sharp' && n !== brave);
  const cf = (quietCoaches.length ? quietCoaches : names)[hash(`${ep.num}|coachconf`) % (quietCoaches.length || names.length)];
  conf(cf, V(cf, {
    sharp: [`Teach them everything, keep one thing back. That's the whole job.`, `They think I'm here to help them. I'm here to reach the merge, and they're how I get there.`],
    dry: [`So I train them, they get better, and then I play against them. Great plan, everybody.`, `Coach first, player later. I'd like to know who came up with that, so I can thank them, or not.`],
    loud: [`I get to yell at people AND I might get to play? Best summer ever!`, `I'm going to be the best coach this show has ever seen. Also the loudest.`],
    soft: [`I really want to help these guys. And, okay, I'd also really like to make the merge.`, `I just want my team to do well. If I make the merge, that's a bonus. A really big bonus.`],
    odd: [`Coach by day, player by merge. Like a superhero, but with a whistle.`, `I've decided my coaching style is "mysterious". I'll figure out what that means tomorrow.`],
    any: [`I'm here to help them. And then I'm here to win.`],
  }, 'conf'));

  // ── each team meets its coaches ──
  for (const t of ep.tribesAtStart || []) {
    const mine = coaches.filter(c => c.tribe === t.name).map(c => c.name);
    if (!mine.length) continue;
    const team = (t.members || []).filter(m => here.includes(m));
    scene([...mine, ...team.slice(0, 3)]);
    hostSay(`${t.name}, say hello to your ${mine.length > 1 ? 'coaches' : 'coach'}: ${listOf(mine)}.`, mine);
    beat(`${listOf(mine)} ${mine.length > 1 ? 'walk' : `walk${P(mine[0]).s}`} over to the ${t.name}.`, [...mine, ...team.slice(0, 3)], { act: { kind: 'arrive', who: mine } });
    const first = mine[0];
    say(first, V(first, {
      sharp: [`First rule: when I talk, you listen. Second rule: see first rule.`, `Okay, here's the deal. I don't lose. So neither do you.`],
      dry: [`Okay. Let's see what we're working with. ...Oh no.`, `Hi, team. I'm going to need all of you to be better than you look.`],
      loud: [`Bring it in, team! We are going to CRUSH this!`, `This is MY team? Okay, I love it! Let's go!`],
      soft: [`Hi, team! I just want you to know I'm really glad I got you.`, `Hey, everybody. We're going to do great, I can feel it.`],
      odd: [`Hello, my little ducklings. Training starts tomorrow at dawn. Or noon. Noon is better.`, `I've already made up a team chant. It's mostly clapping.`],
      any: [`Hey, team. Let's get to work.`],
    }, `team-${t.name}`), [first, ...team.slice(0, 2)]);
    const r = quiet(team.filter(h => !reacted.has(h)), `tr-${t.name}`) || quiet(team, `tr-${t.name}`);
    if (r) {
      reacted.add(r);
      const warm = ['soft', 'loud', 'odd'].includes(famOf(r));
      say(r, warm ? V(r, {
        soft: [`I'm so glad we got you. Honestly.`, `Okay, I feel a lot better now.`],
        loud: [`YES! We got the good one!`, `We are SO winning this season!`],
        odd: [`Can the team chant have a dance? I have ideas.`, `I'm in. I don't know what I'm in, but I'm in.`],
        any: [`Okay. I'm in.`],
      }, `tr-${t.name}`) : V(r, {
        sharp: [`We'll see who ends up listening to who.`, `Sure. As long as you remember who's actually playing.`],
        dry: [`Can't wait. Truly.`, `Great. A coach. That'll be fun for everybody.`],
        any: [`We'll see.`],
      }, `tr-${t.name}`), [r, first]);
    }
    if (mine.length > 1) {
      const [a, b] = mine;
      say(a, V(a, {
        sharp: [`Stay out of my way, and we'll be fine.`, `Just so we're clear, I'm the head coach.`],
        dry: [`So which one of us is the good cop?`, `I assume we're splitting them down the middle.`],
        loud: [`Co-coaches! Let's GO!`, `You and me, partner! This is going to be amazing!`],
        soft: [`I'm really glad we're doing this together.`, `We're going to make a great team, I think.`],
        odd: [`Do we get matching whistles?`, `We should have a secret handshake. Coaches only.`],
        any: [`So, we're in this together.`],
      }, `pair-${t.name}`), [a, b]);
      // a sharp first coach staked a claim; anyone else offered to share
      say(b, famOf(a) === 'sharp' ? V(b, {
        sharp: [`Head coach? That's cute.`, `We'll see who they listen to.`],
        dry: [`Sure. You keep telling yourself that.`, `Great. I'll stay out of your way. Mostly.`],
        loud: [`Whoa, okay! Somebody's competitive!`, `Ha! You wish, buddy!`],
        soft: [`Oh. Okay. I kind of thought we'd do it together.`, `That's fine, I guess. I just want them to do well.`],
        odd: [`Can I be head coach on Tuesdays?`, `Fine, but I'm in charge of snacks.`],
        any: [`We'll see.`],
      }, `pair2-${t.name}`) : V(b, {
        sharp: [`Let's not get carried away.`, `Sure. Just don't slow me down.`],
        dry: [`Sure. Just don't expect a hug.`, `Fine by me. You take the loud ones.`],
        loud: [`YES! Let's go!`, `Oh, we are going to be SO good at this!`],
        soft: [`Me too. This is going to be fun.`, `Totally. Let's look after them.`],
        odd: [`Only if we get matching whistles.`, `I'll work on our handshake tonight.`],
        any: [`Sure. Let's do it.`],
      }, `pair2-${t.name}`), [b, a]);
      const ca = famOf(a), cb = famOf(b);
      if (ca === 'sharp' || cb === 'sharp') { const s = ca === 'sharp' ? a : b, o2 = s === a ? b : a;
        conf(s, V(s, { sharp: [`Two coaches, one team, one card. Only one of us is still here at the merge, and it's going to be me.`, `${o2} is very nice. That's going to be a problem for ${P(o2).obj}, not for me.`] }, `pconf-${t.name}`)); }
    }
  }
  return names;
}
