// ══════════════════════════════════════════════════════════════════════
// td/coach/scenes.js — the coaching twist's camp moments, as scenes
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-10: "check if the coach season is well made and deep enough in the stepped viewer,
// with a lot of dialogue, reactions, long conversations... each coach has their personality and voice".
// Read through the viewer, a coach season aired none of its 15-27 coach events an episode: each was one
// line of narration, and the director had no scene to air. The engine decides everything (coach-episode.js
// sessions and fallout, coach-deals.js, coach-status-events.js, the card talk); this writes each moment as
// a conversation, every line in the speaker's own way (voice families: sharp, dry, loud, soft, odd), and
// adds the one thing the engine never showed: the training session itself, per coach, from the session
// record (who was picked, the stat drilled, how much it took).
//
// writeCoachScene(ev, ctx) -> { kind, who, lines } | null. ctx: { ep, members, sessions, passed }.
// The coach is always role a. Words only: the engine already moved every bond.
import { gs, players } from '../../core.js';
import { famOf, P, listOf } from '../../vp-td-ep/voiced.js';
import { pastOf } from '../past.js';

const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

// what a session in each stat looks like, and the coach's instruction for it
const DRILL = {
  physical: { beats: [(c, ps) => `${c} has ${listOf(ps)} hauling logs up and down the beach.`, (c, ps) => `${c} makes ${listOf(ps)} carry water buckets up the hill, one in each hand.`, (c, ps) => `${c} has ${listOf(ps)} dragging a tree branch through the sand.`, (c, ps) => `${c} sets ${listOf(ps)} to lifting rocks at the edge of camp.`], say: [`Lift with your legs, not your back. Your back is not invited.`, `Again. Slower on the way down. The way down is where you get hurt.`, `Grip it like you mean it. That log can tell when you're scared.`] },
  endurance: { beats: [(c, ps) => `${c} has ${listOf(ps)} holding a plank in the sand while the sun comes up.`, (c, ps) => `${c} has ${listOf(ps)} running laps of the camp, again and again.`, (c, ps) => `${c} makes ${listOf(ps)} stand on one leg on a log for as long as they can.`, (c, ps) => `${c} has ${listOf(ps)} treading water off the dock.`], say: [`Don't drop. The second you drop, somebody else wins.`, `Your arms are lying to you. You've got way more in there.`, `Breathe. Count to ten. Then count to ten again.`] },
  mental: { beats: [(c, ps) => `${c} lays out a row of shells and stones on a log in front of ${listOf(ps)}.`, (c, ps) => `${c} quizzes ${listOf(ps)} with riddles, faster and faster.`, (c, ps) => `${c} has ${listOf(ps)} memorising the order of a pile of sticks.`, (c, ps) => `${c} scratches a puzzle into the dirt and makes ${listOf(ps)} solve it.`], say: [`Look for five seconds. Now close your eyes. What was third?`, `Don't guess. Think. Guessing is how you lose puzzles.`, `Again, but faster. Chris loves a puzzle with a timer.`] },
  social: { beats: [(c, ps) => `${c} sits ${listOf(ps)} down by the fire for what ${P(c).sub} keep${P(c).s} calling "people practice".`, (c, ps) => `${c} makes ${listOf(ps)} practise small talk on each other.`, (c, ps) => `${c} pretends to be the grumpiest person on the team, and ${listOf(ps)} have to win ${P(c).obj} over.`, (c, ps) => `${c} walks ${listOf(ps)} around camp, pointing out who talks to who.`], say: [`Okay, I'm the person you need on your side. Win me over. Go.`, `Stop talking about yourself. Ask me something.`, `Smile with your eyes. No, that's scary. Try again.`] },
  strategic: { beats: [(c, ps) => `${c} draws the whole team in the dirt with a stick, ${listOf(ps)} crouched beside ${P(c).obj}.`, (c, ps) => `${c} lines up pebbles for every person on the team and makes ${listOf(ps)} sort them into sides.`, (c, ps) => `${c} quizzes ${listOf(ps)} on who's with who, and who's on the outside.`, (c, ps) => `${c} walks ${listOf(ps)} through how the last vote happened, step by step.`], say: [`Who's on the bottom right now? Count it out loud.`, `If you had to vote someone out tomorrow, who, and who goes with you?`, `Everybody here is a number. Tell me which numbers you have.`] },
  loyalty: { beats: [(c, ps) => `${c} walks ${listOf(ps)} down the trail, away from camp, to talk about trust.`, (c, ps) => `${c} sits with ${listOf(ps)} on the dock and asks who they'd never vote for.`, (c, ps) => `${c} makes ${listOf(ps)} do trust falls off a stump.`, (c, ps) => `${c} sits ${listOf(ps)} down and asks them to name one person here they'd never betray.`], say: [`Who here would you never write down? Say it, and mean it.`, `A promise out here is worth exactly what you'll give up to keep it.`, `If you break your word once, people remember it for the whole game.`] },
  boldness: { beats: [(c, ps) => `${c} has ${listOf(ps)} standing on a stump, saying things out loud.`, (c, ps) => `${c} dares ${listOf(ps)} to jump off the end of the dock.`, (c, ps) => `${c} makes ${listOf(ps)} practise saying no to each other, loudly.`, (c, ps) => `${c} has ${listOf(ps)} walk up to the scariest person in camp and say hello.`], say: [`Louder. Like you're not scared of anyone here.`, `Say it again, and this time, look me in the eye.`, `Nobody remembers the person who almost said something.`] },
  intuition: { beats: [(c, ps) => `${c} sits with ${listOf(ps)} on the dock, watching the rest of the team.`, (c, ps) => `${c} has ${listOf(ps)} guess who's been talking to who this morning.`, (c, ps) => `${c} plays a lying game with ${listOf(ps)}: two truths and one lie, over and over.`, (c, ps) => `${c} and ${listOf(ps)} people-watch from the edge of camp.`], say: [`Watch. Who's lying right now? Trust your gut, not your ears.`, `See how they stopped talking when we sat down? That means something.`, `Don't listen to what people say. Watch where they stand.`] },
  temperament: { beats: [(c, ps) => `${c} spends a whole session trying to make ${listOf(ps)} lose ${ps.length > 1 ? 'their' : P(ps[0]).posAdj} temper on purpose.`, (c, ps) => `${c} pokes ${listOf(ps)} with a stick while they try to meditate.`, (c, ps) => `${c} reads ${listOf(ps)} every mean thing anyone's said about them this week.`, (c, ps) => `${c} makes ${listOf(ps)} sit perfectly still while ${P(c).sub} hum${P(c).s} the most annoying song ${P(c).sub} know${P(c).s}.`], say: [`I'm going to annoy you for five minutes. Don't react.`, `You flinched. Again. Out here, somebody will poke that every day.`, `Breathe in. Let it go. Nobody wins a fight they started at camp.`] },
};
const DRILL_WORD = { physical: 'strength', endurance: 'endurance', mental: 'puzzles', social: 'people', strategic: 'strategy', loyalty: 'trust', boldness: 'nerve', intuition: 'reading people', temperament: 'keeping cool' };

/** The writer for one camp: a season-wide memory of lines already used, so the twelfth session isn't the first. */
function writer(ctx, key) {
  gs._coachUsed ||= {};
  const used = gs._coachUsed;
  const lines = [];
  // a line with other names in it is still the same line (Heather's "X is my best shot" was new every week)
  const names = (players || []).map(p => p.name).filter(Boolean).sort((x, y) => y.length - x.length);
  const norm = t => names.reduce((u, n) => u.split(n).join('#'), String(t));
  // the least-used line first: a pool spent this week comes round evenly, not the same one every time
  const pickOf = (opts, tag) => {
    const least = Math.min(...opts.map(t => used[norm(t)] || 0));
    const list = opts.filter(t => (used[norm(t)] || 0) === least);
    const t = list[hash(`${ctx.ep?.num}|${key}|${tag}`) % list.length];
    used[norm(t)] = (used[norm(t)] || 0) + 1;
    return t;
  };
  const V = (n, o, tag) => {
    const f = famOf(n);
    return pickOf((o[f] && o[f].length) ? o[f] : (o.any || Object.values(o)[0] || []), `${tag}|${n}`);
  };
  return {
    lines, V, pick: pickOf,
    say: (by, text) => lines.push({ kind: 'say', by, text }),
    conf: (by, text) => lines.push({ kind: 'conf', by, text }),
    beat: text => lines.push({ kind: 'beat', text }),
  };
}
const other = (ctx, not, salt) => {
  const pool = (ctx.members || []).filter(m => !not.includes(m));
  return pool.length ? pool[hash(`${ctx.ep?.num}|${salt}`) % pool.length] : null;
};

// ── the session itself (new: the engine's session record, as the morning it was) ──
// how the coach runs it, by how it's going (the gains the engine rolled)
const RUN = {
  good: {
    sharp: [`Better. See? You're not hopeless.`, `That's it. Remember that feeling.`, `Good. Now do it without looking so surprised.`, `Finally. That's what I've been waiting for.`],
    loud: [`YES! That's it! Now do it ten more times!`, `THERE it is! Did you feel that?!`, `Oh, that was GOOD! Again, again!`, `Look at you go!`],
    soft: [`That's it! You're doing so well.`, `See? I knew you could do it.`, `Oh, that was really good. Seriously.`, `Yes! That's exactly right.`],
    dry: [`Huh. That was actually good. Don't tell anyone I said that.`, `Well. That was better than I expected.`, `I'm almost impressed. Almost.`, `Okay. That counts.`],
    odd: [`Good! Now do it like a cat would.`, `Beautiful. I'm getting chills. Or I'm cold.`, `Yes! You've unlocked something. I don't know what.`, `That was poetry. Sweaty poetry.`],
  },
  slow: {
    sharp: [`Again. And this time, look like you actually want it.`, `Slower. You're rushing, and it shows.`, `No. Think first, then move.`, `Closer. Not close. Closer.`],
    loud: [`Come on! Faster! I can't hear you trying!`, `Almost! ALMOST! Go again!`, `Don't stop now! Keep going!`, `More! Give me more!`],
    soft: [`It's okay, everybody's bad at this at first. Again?`, `You're getting there. Take your time.`, `Nearly! Let's try one more.`, `Don't worry, it took me ages too.`],
    dry: [`Okay. Let's pretend that didn't happen and go again.`, `That was a start. A small one.`, `We'll get there. Eventually. Possibly.`, `I've seen worse. Not today, but I have.`],
    odd: [`Do it again, but this time think about soup.`, `Close! Now pretend you're a much cooler person.`, `Again! But with more feeling. Any feeling.`, `Try it with your tongue out. It helps. Probably.`],
  },
  bad: {
    sharp: [`That was embarrassing. Do it again before anybody sees.`, `What was that? No. Again.`, `I didn't get this far by doing things halfway.`, `Stop. Start over. Properly this time.`],
    loud: [`Whoa, whoa, whoa! Stop! Okay, again!`, `NO! The other way! The OTHER way!`, `Okay, that went badly! Let's go again!`, `Oof! Shake it off! Again!`],
    soft: [`Oh no. Okay, let's slow it down a bit.`, `That's okay! Let's try it a different way.`, `Are you okay? Let's take it slower.`, `Hmm. Maybe I explained it wrong.`],
    dry: [`That was worse. Impressive, honestly.`, `Interesting. Wrong, but interesting.`, `I don't think that's how gravity works.`, `Let's never do that exactly like that again.`],
    odd: [`Pretend it owes you money.`, `That was bold. Wrong, but bold.`, `Hmm. Have you tried being better at it?`, `I felt that one in my soul. Not in a good way.`],
  },
};
// each trainee, by how it went for them
const TOOK = {
  good: {
    sharp: [`Fine. That actually helps. Don't let it go to your head.`, `Okay. I see what you're doing. It works.`, `That's useful. I'm keeping that.`, `Right. Got it. Next.`],
    loud: [`Oh! OH! I get it now!`, `Wait, that worked?! Do that again!`, `I'm a GENIUS! Well, you are. But also me!`, `That felt AMAZING!`],
    soft: [`Oh wow. That actually makes so much sense.`, `I did it! Did you see? I actually did it!`, `Thank you. Really. That helped so much.`, `I can't believe that worked!`],
    dry: [`Huh. That's annoyingly useful.`, `Okay, I'll admit that worked. Once.`, `Well. I hate that that helped.`, `Fine. I've learned something. Against my will.`],
    odd: [`I feel like a whole new person. A slightly sweatier one.`, `I think I just levelled up.`, `I can see colours I couldn't see before.`, `My body finally understands me.`],
  },
  slow: {
    sharp: [`This is harder than you make it look.`, `I'll get it. Just not today.`, `Give me a second. I'm close.`, `Stop watching me. It's putting me off.`],
    loud: [`My arms are on FIRE!`, `How is this so HARD?!`, `I'm trying! I'm TRYING!`, `Okay, okay, one more time!`],
    soft: [`I'm trying, I promise. It's just a lot.`, `Can we take a break? A tiny one?`, `Sorry. I'll get it, I swear.`, `I think I'm getting a bit better?`],
    dry: [`I'm learning so much about my limits.`, `Great. Another thing I'm bad at.`, `Progress. Allegedly.`, `I've been better. I've also been worse. Today, I'm in between.`],
    odd: [`My body is saying no, but my heart is saying also no.`, `I think I pulled something. Maybe my soul.`, `Is it supposed to hurt in my ears?`, `I'm doing great. I'm lying, but I'm doing it.`],
  },
  bad: {
    sharp: [`Are you sure this is right? Because it feels wrong.`, `That's not how you did it on TV.`, `This isn't working, and you know it.`, `I'm getting worse. How am I getting worse?`],
    loud: [`This is NOT working!`, `Are you SURE this is how it goes?!`, `I think you're making me WORSE!`, `Ow! OW! Okay, no!`],
    soft: [`Um... I think I'm doing it wrong. Or you are?`, `Sorry, is it supposed to feel like this?`, `I don't think this is helping. Sorry.`, `Can we try something else, maybe?`],
    dry: [`I'm fairly sure this is making me worse.`, `Quick question. Have you ever done this before?`, `I've unlearned something. I'm not sure what.`, `This is the opposite of coaching.`],
    odd: [`I think I just unlearned something.`, `My hands forgot how to be hands.`, `I have become worse. I feel it in my knees.`, `Is this a prank? Is Chris filming this?`],
  },
};
const CLOSE = {
  sharp: [`That's enough for today. Same time tomorrow, and don't be late.`, `Better. Not good. Better.`, `We're done. Think about what you did wrong.`, `Tomorrow, we fix the rest.`],
  loud: [`That's what I'm TALKING about! Same time tomorrow!`, `Okay, okay, take five! You earned it!`, `Great session, team! Hands in! ...Okay, nobody's doing hands.`, `Water break! Then we go AGAIN tomorrow!`],
  soft: [`Great work today. Seriously. Go get some water.`, `That's enough for now. I'm proud of you.`, `You did really well. Same time tomorrow?`, `Okay, rest up. You earned it.`],
  dry: [`We'll call that progress. Loosely.`, `Okay, that's enough. I've seen enough. In every sense.`, `Session over. Nobody died. That's a win.`, `Same time tomorrow. Bring a better attitude. Mine, ideally.`],
  odd: [`Session over. Go and drink some water. Or lake.`, `And that's training! Nobody tell Chef we used his log.`, `Class dismissed. I'm going to go stare at the sea.`, `Tomorrow we do it blindfolded. Maybe. I'll decide tonight.`],
};
// somebody left out, watching: the first days, and once it's a pattern ({c} the coach, {d} the days)
const WATCH = {
  early: {
    sharp: [`I'm not saying I wanted to be picked. I'm saying I noticed.`, `{c} picked them over me. Interesting choice.`, `Fine. I'll learn it by watching. I learn faster than they do anyway.`, `I'll remember who got picked first. That's all.`],
    loud: [`Hello? I'm right here! I want to get better too!`, `Why does nobody ever pick ME?`, `I would have been SO good at that!`, `I'm standing right there! Waving! Nothing!`],
    soft: [`It's fine. Maybe tomorrow. I hope it's tomorrow.`, `I'd have loved a session. I didn't want to ask.`, `I'm happy for them. I just wish it was me too.`, `I don't want to make a fuss. I'd just like a turn.`],
    dry: [`Love watching other people get better. Truly my favourite thing.`, `I'll just stand here and absorb it, I guess.`, `I've decided I didn't want a session anyway. Healthy.`, `Watching from the cheap seats. Great view.`],
    odd: [`I'm learning by watching. Mostly I'm learning that I'm hungry.`, `I'm here in spirit. And in body. Just not in the session.`, `I've started a session of my own. It's me and a crab.`, `I'm practising in my head. In my head, I'm amazing.`],
  },
  late: {
    sharp: [`That's {d} days in a row {c} has looked straight past me. I'm keeping count, even if {c} isn't.`, `Every morning, same faces. I know what that means, and so does everybody watching.`, `{c} has decided I don't matter. That's going to be a very expensive mistake.`, `Day {d}. I've stopped asking. I've started planning.`],
    loud: [`{d} DAYS! {d} days of {c} acting like I'm invisible!`, `I am RIGHT HERE! Every single morning!`, `Is there a sign on my back? Does it say "don't train this one"?`, `That's it! I'm done being nice about this!`],
    soft: [`I keep telling myself it's not personal. It's getting really hard to believe that.`, `I've stopped waiting to be picked. That's the sad part.`, `Day {d}. I still say good morning to {c}. {c} still doesn't pick me.`, `I'm starting to think {c} just doesn't like me.`],
    dry: [`I've decided I'm self-taught now. It's going great.`, `At this point I'm just here to watch other people get better.`, `Day {d} of the {c} fan club. Membership: everybody but me.`, `I'm thinking of charging {c} for watching. I've seen every session.`],
    odd: [`I've started training with a rock. The rock believes in me.`, `If nobody picks me tomorrow, I'm coaching myself. I'll be great at it.`, `Day {d}. I've started cheering for myself. Somebody has to.`, `I've named my imaginary coach. He's much nicer than {c}.`],
  },
};
// the coach on who they chose ({p} the first one picked)
const PICKED = {
  sharp: [`I pick the ones who can win me something. Everybody else can watch.`, `I don't have time for everyone. I have time for the ones worth it.`, `{p} is my best shot at a team that wins. That's not favouritism, that's maths.`, `People think coaching is about being fair. It's about being right.`, `I can see who'll be useful at the merge. I'm training them now.`, `The ones I skip will hate me. The ones I train will owe me. I'll take that trade.`],
  loud: [`I've got my favourites, and I don't care who knows it!`, `{p} is going to be a MONSTER by the merge. I can feel it!`, `Coaching is the best! Who knew?!`, `I yelled for an hour and I've never been happier!`, `If my team doesn't win the next challenge, I'll eat my whistle!`, `I picked the ones who yell back. That's how I know they care!`],
  soft: [`I wish I could train everybody. I really do. There's just not enough of me.`, `I hope the others know it's not personal. I'll get to them.`, `{p} tries so hard. It makes me want to try harder too.`, `I keep worrying I'm picking wrong. Everybody deserves a turn.`, `Watching {p} get it today made my whole week.`, `I just want my team to be okay. That's all I want.`],
  dry: [`Everybody else gets my thoughts and prayers.`, `Turns out coaching is mostly watching people do things badly, then nicely asking them to stop.`, `I picked the ones who listen. That narrowed it down a lot.`, `I've taught {p} everything I know. It took about ten minutes.`, `Coaching is easy. You just say "again" until something happens.`, `I'm not playing favourites. I'm just very clearly playing favourites.`],
  odd: [`I chose them by which way the wind was blowing. Also, they're good.`, `My coaching style is "vibes". The vibes are strong today.`, `I think {p} is my best friend now. {p} doesn't know it yet.`, `I wrote everybody's names on leaves and picked the shiniest ones.`, `I had a dream I was a great coach. Today, I'm making it come true.`, `If I squint, my team looks like champions. I squint a lot.`],
};

function session(ev, ctx) {
  const c = ev.coach, ps = ev.trainees.map(t => t.name), stat = ev.stat;
  const d = DRILL[stat] || DRILL.physical;
  const W = writer(ctx, `session|${c}`);
  const avg = ev.trainees.reduce((t, x) => t + (Number(x.gain) || 0), 0) / Math.max(1, ev.trainees.length);
  const tier = g => (g >= 0.35 ? 'good' : g >= 0 ? 'slow' : 'bad');
  W.beat(W.pick(d.beats.map(f => f(c, ps)), 'set'));
  W.say(c, W.pick(d.say, `drill|${stat}`));
  W.beat(W.pick([`${listOf(ps)} give${ps.length > 1 ? '' : P(ps[0]).s} it a go.`, `${listOf(ps)} try it.`, `${c} watches ${listOf(ps)} try it, arms folded.`, `${listOf(ps)} go for it.`], 'try'));
  W.say(c, W.V(c, RUN[tier(avg)], 'run'));
  ev.trainees.forEach((t, i) => {
    const n = t.name, g = Number(t.gain) || 0;
    W.say(n, W.V(n, TOOK[tier(g)], `took${i}`));
    if (g < 0) W.say(c, W.V(c, { sharp: [`Trust me. It works.`, `It works. You're just doing it badly.`], loud: [`Trust me! It works! Probably!`, `Keep going! It'll click!`], soft: [`Oh. Okay, let's try it a different way.`, `Sorry! Let me show you again.`], dry: [`It worked for me. Once.`, `Hm. It looked better in my head.`], odd: [`It's supposed to feel weird. That's how you know.`, `Trust the process. I don't, but you should.`], any: [`Trust me.`] }, `badback${i}`));
  });
  W.say(c, W.V(c, CLOSE, 'close'));
  // somebody left out, watching (the more sessions they've missed, the less quietly)
  const left = (ctx.passed || []).filter(p => p.coach === c).map(p => p.contestant).filter(n => !ps.includes(n));
  const watcher = left.sort((x, y) => (gs._coachPassStreak?.[y] || 0) - (gs._coachPassStreak?.[x] || 0) || x.localeCompare(y))[0];
  if (watcher) {
    const streak = gs._coachPassStreak?.[watcher] || 1;
    W.beat(`${watcher} watches from the side, not training.`);
    const fill = t => t.replace(/\{c\}/g, c).replace(/\{d\}/g, String(streak));
    const pool = WATCH[streak >= 3 ? 'late' : 'early'];
    W.conf(watcher, fill(W.V(watcher, pool, 'watch')));
  }
  W.conf(c, W.V(c, PICKED, 'picked').replace(/\{p\}/g, ps[0]));
  return { kind: 'coach.session', who: { a: c, b: ps[0], ...(ps[1] ? { c: ps[1] } : {}) }, lines: W.lines };
}

// ── the engine's coach events ──
const WRITE = {
  coachBreakthrough(ev, ctx) {
    const [c, n] = ev.players; const stat = ev.stat;
    const W = writer(ctx, `bt|${c}|${n}`); const x = other(ctx, [c, n], `bt${n}`);
    W.beat(`${n} tries the thing from this morning's session, in front of everybody, and it works.`);
    if (x) W.say(x, W.V(x, { sharp: [`Since when can you do that?`, `Okay. Who taught you that?`, `Where did that come from?`], loud: [`WHOA! Since when?!`, `Do it again! Do it again!`, `No WAY! How?!`], soft: [`That was amazing! How did you do that?`, `Wow! You've been practising!`, `Oh my gosh, that was so good!`], dry: [`Well. That's new.`, `I'm both impressed and a little threatened.`, `Who are you, and what did you do with the old one?`], odd: [`Was that magic? That looked like magic.`, `I think I just saw a miracle.`, `Teach me. Teach me immediately.`], any: [`Since when can you do that?`] }, 'x'));
    W.say(n, W.V(n, { sharp: [`Since this morning. ${c} knows what ${P(c).sub}'${P(c).sub === 'they' ? 're' : 's'} doing.`, `${c}. Don't tell anyone.`, `${c} showed me. I made it better.`], loud: [`${c} taught me! This morning! I'm unstoppable!`, `It was ${c}! ${c} is a GENIUS!`, `I've got a coach now! Look out!`], soft: [`${c} showed me this morning. I can't believe it worked.`, `It was all ${c}, honestly. I just listened.`, `I didn't think I could do it either!`], dry: [`${c}. Apparently I'm teachable. Who knew.`, `A coach and a lot of shouting. Mostly the shouting.`, `It turns out practice works. Disappointing, really.`], odd: [`${c} and I have a special bond now. It's mostly sweat.`, `I ate a lucky leaf. Also, ${c} helped.`, `The secret is ${c}. And believing in yourself. Mostly ${c}.`], any: [`${c} showed me this morning.`] }, 'n'));
    W.say(c, W.V(c, { sharp: [`Told you. Now do it when it counts.`, `Good. Don't get cocky.`, `That's one. Now do it every time.`], loud: [`THAT'S MY STUDENT!`, `Did everybody see that? That was ME! Well, mostly you.`, `YES! Somebody write that down!`], soft: [`I'm so proud of you. Seriously.`, `See? I told you you could do it.`, `That made my whole day.`], dry: [`I'd say I'm surprised, but I'm a great coach.`, `See what happens when you listen?`, `I'll accept your thanks in snacks.`], odd: [`I'm going to cry. I'm not going to cry. I'm crying a little.`, `My child. My beautiful, sweaty child.`, `I knew it. I had a feeling in my elbow.`], any: [`Told you.`] }, 'c'));
    if (x) W.say(x, W.V(x, { sharp: [`Fine. Then I want a session too.`], loud: [`${c}! Train ME next!`], soft: [`Do you think ${c} would help me too?`], dry: [`I'll be putting my name down for tomorrow, then.`], odd: [`I want to be magic too.`], any: [`I want a session too.`] }, 'x2'));
    else W.say(n, `Same time tomorrow?`);
    W.conf(n, W.V(n, { sharp: [`Everybody here just found out I'm better than they thought. I'm fine with that.`], soft: [`${c} saw something in me nobody else did. I don't want to let ${P(c).obj} down.`], loud: [`That felt AMAZING. I want to feel that every single day!`], dry: [`One good session and suddenly people look at me differently. I'll take it.`], odd: [`I'm a whole new ${DRILL_WORD[stat] || 'person'} person now.`], any: [`I actually got better. I can feel it.`] }, 'conf'));
    return { kind: 'coach.breakthrough', who: { a: c, b: n, ...(x ? { c: x } : {}) }, lines: W.lines };
  },
  coachDefended(ev, ctx) {
    const [d, c, sk] = ev.players;
    const W = writer(ctx, `def|${d}|${c}`);
    W.say(sk, W.V(sk, { sharp: [`Our coach couldn't coach a fish to swim.`, `Is it just me, or is ${c} kind of useless?`, `${c} was good on TV. Out here, not so much.`], loud: [`What is ${c} even DOING all day?`, `I could do ${c}'s job! I could do it LYING DOWN!`, `Does ${c} do anything, or just yell?`], dry: [`I've learned a lot from ${c}. Mostly what not to do.`, `${c}'s coaching has a lot of confidence and not much else.`, `I'd rate ${c} two stars. One for showing up.`], soft: [`I don't really get what ${c} is doing, honestly.`, `I'm not sure ${c}'s sessions are helping anyone.`, `Is it bad that I don't think ${c} is very good at this?`], odd: [`I think ${c} is a hologram. Has anyone touched ${P(c).obj}?`, `${c}'s coaching is like a weather forecast. Mostly wrong.`, `I'd trust a seagull to coach us before ${c}.`], any: [`What does ${c} even do?`] }, 'sk'));
    W.say(d, W.V(d, { sharp: [`Say that again. To ${P(c).posAdj} face.`, `You're wrong, and you know you're wrong.`], loud: [`Hey! Back off! ${c} is GOOD!`], soft: [`That's not fair. ${c} works really hard for us.`, `Please don't talk about ${P(c).obj} like that.`], dry: [`Funny. ${c} made me twice as good, and you're still you.`], odd: [`You take that back, or I'm telling.`], any: [`Leave ${c} alone. ${P(c).Sub} ${P(c).is} good.`] }, 'd'));
    W.say(sk, W.V(sk, { sharp: [`Wow. Somebody's teacher's pet.`], dry: [`Okay. Didn't know it was a fan club.`], loud: [`Whoa! Okay! Sorry!`], soft: [`Sorry. I didn't mean it like that.`], odd: [`Fine. I take it back. I'm keeping some of it.`], any: [`Okay, okay.`] }, 'sk2'));
    W.say(d, W.V(d, { sharp: [`Then keep your opinions to yourself.`, `Say it again when ${c} is standing here.`], dry: [`Just saying what's true.`, `I'm not a fan. I'm just better than I was.`], loud: [`Yeah, well, back off!`, `Good! Because ${c} is GOOD!`], soft: [`It's okay. Just give ${P(c).obj} a chance.`, `Thanks. Just be nice, okay?`], odd: [`I'll allow it.`, `Apology accepted. Partly.`], any: [`Just give ${P(c).obj} a chance.`] }, 'd2'));
    W.conf(c, W.V(c, { sharp: [`I heard all of that. ${d} just got a lot more of my time.`], soft: [`${d} stood up for me. I'm not going to forget that.`], loud: [`${d} had my BACK! That's my guy! That's my person!`], dry: [`It's nice having somebody on my side. It's rare.`], odd: [`I have a bodyguard now. I didn't even have to pay.`], any: [`${d} stood up for me. That means a lot.`] }, 'cc'));
    return { kind: 'coach.defended', who: { a: c, b: d, c: sk }, lines: W.lines };
  },
  coachProtegeBond(ev, ctx) {
    const [a, b] = ev.players;
    const W = writer(ctx, `pb|${a}|${b}`);
    W.beat(`After training, ${a} and ${b} compare what they each got shown.`);
    W.say(a, W.V(a, { sharp: [`What did you get today? Mine was useful. Annoyingly.`, `Let's compare. I want to know what I'm missing.`, `What did yours show you? I'll tell you mine if it's good.`], loud: [`Okay, show me yours and I'll show you mine! Training, I mean!`, `How was yours?! Mine was INTENSE!`, `Let's swap! Teach me everything!`], soft: [`How did your session go? Mine was hard, but good.`, `Do you want to practise together later?`, `I'm still a bit sore. How about you?`], dry: [`So. What did they teach you? Mine was mostly yelling.`, `Compare notes? I've got exactly one note.`, `How was your torture? Mine was educational.`], odd: [`I learned a secret technique. Want to trade secret techniques?`, `I think I learned something. Help me find out what.`, `Let's be training buddies. Like a montage.`], any: [`What did you get today?`] }, 'a'));
    W.say(b, W.V(b, { sharp: [`Plenty. Show me yours first.`], loud: [`Oh, it was SO good! Watch this!`], soft: [`Mine was really good! Here, I'll show you.`], dry: [`A lot of standing still while being told I was wrong.`], odd: [`I'll trade you. But mine's better.`], any: [`Here, I'll show you.`] }, 'b'));
    W.beat(`They show each other, badly at first, then better.`);
    W.say(a, `Okay, if we both know both, we're twice as useful.`);
    W.say(b, W.V(b, { sharp: [`And twice as hard to get rid of.`], loud: [`Team within a team! I love it!`], soft: [`I like that. Let's keep doing this.`], dry: [`Look at us. Being useful.`], odd: [`We're basically a training montage now.`], any: [`Deal.`] }, 'b2'));
    W.conf(a, W.pick([`${b} and I are getting better faster than anybody, because we share. Nobody else here thought of that.`, `Two people training together beat one person training alone. ${b} gets it.`, `${b} is the only one here I'd share my sessions with. That has to mean something.`], 'pbconf'));
    return { kind: 'coach.protege', who: { a, b }, coach: (ctx.sessions || []).find(x => x.contestant === a)?.coach || null, lines: W.lines };
  },
  coachPassedOverNotices(ev, ctx) {
    const [n, ...cs] = ev.players; const c = cs[0];
    const streak = gs._coachPassStreak?.[n] || 1;
    const unanimous = /NOBODY/.test(ev.badgeText || ''); const loud = streak >= 3 || unanimous;
    const W = writer(ctx, `po|${n}`);
    if (loud && c) {
      const cold = famOf(c) === 'sharp';
      W.beat(W.pick([`${n} walks right up to ${c}.`, `${n} waits until ${c} is alone, then goes straight over.`, `${n} catches ${c} on the way back from the water.`], 'come'));
      W.say(n, W.V(n, {
        sharp: [`Am I invisible, or do you just not rate me?`, `Be honest. Am I on your list at all?`, `${streak} days. I'd like to know what I did.`, `Do you have a problem with me, or just a problem picking me?`],
        loud: [`Okay, what's the deal? ${streak} days, and not ONE session!`, `Seriously! What do I have to do to get picked?!`, `Hey! Remember me? I'm on your team!`, `Is it me? Is it something I SAID?`],
        soft: [`Can I ask you something? Is there a reason you never pick me?`, `I don't want to be annoying, but... could I have a session sometime?`, `Did I do something wrong? You never pick me.`, `I'd really like to get better. Could you help me?`],
        dry: [`I've been doing the drills from the sidelines. I'm basically your best student.`, `Quick question. Am I on the team, or just near it?`, `Just checking you know my name.`, `I've watched every session. I could run them by now.`],
        odd: [`Do I need to wear a sign? I'll make a sign.`, `Is there a waiting list? Can I be on it?`, `I've been practising alone. I'd prefer a person.`, `Do coaches take bribes? I have a shell.`],
        any: [`Why do you never pick me?`],
      }, 'ask'));
      if (cold) {
        W.say(c, W.pick([`Show me something worth picking, and I'll pick you.`, `I train who's worth training. Prove you are.`, `When you're worth my time, you'll get it.`, `Win something, and we'll talk.`], 'brush'));
        W.say(n, W.V(n, {
          sharp: [`Fine. Watch me.`, `I'll prove it. Then you'll wish you'd picked me first.`], loud: [`Oh, I'll PROVE it, all right!`, `Wow! Okay! Challenge accepted!`],
          soft: [`Oh. Okay. I'll try harder.`, `That's... that's really harsh.`], dry: [`Great. Motivational.`, `Inspiring. Truly.`], odd: [`I'll prove it so hard you'll need a nap.`, `Okay. I'll be worth it by Tuesday.`], any: [`Fine. I'll prove it.`],
        }, 'back'));
        W.say(c, W.pick([`Good. I'll be watching.`, `We'll see.`, `Then stop talking and start.`, `I hope so. For your sake.`], 'end'));
      } else {
        W.say(c, W.V(c, {
          loud: [`Whoa, okay! You'll get your turn, I swear!`, `You're RIGHT! Tomorrow! First thing!`], soft: [`Oh no, I'm so sorry. It's not personal, I promise.`, `You're right. I've been unfair. Tomorrow, okay?`],
          dry: [`You're on the list. Near the bottom, but on it.`, `Fair. Tomorrow. Try not to make me regret it.`], odd: [`I've been saving you. For a special occasion.`, `Tomorrow. I'll bring my good whistle.`], any: [`You'll get your turn tomorrow.`],
        }, 'promise'));
        W.say(n, W.V(n, {
          sharp: [`Right. I'll remember that.`, `I'll hold you to that.`], loud: [`You'd BETTER mean that!`, `Tomorrow! You said it! Everyone heard!`],
          soft: [`Okay. I hope so.`, `Really? Thank you.`], dry: [`Can't wait.`, `I'll believe it when I'm sweating.`], odd: [`I'll hold you to it. I'll hold you, too, if you want.`, `I'll be there before the sun is.`], any: [`We'll see.`],
        }, 'n2'));
        W.say(c, W.V(c, {
          loud: [`I mean it! First thing!`, `Pinky promise!`], soft: [`I do mean it. I'm sorry it took you asking.`, `I promise. Really.`],
          dry: [`I'll pencil you in. In pen, even.`, `It's in my head. Which is where I keep my calendar.`], odd: [`Tomorrow. Wear something you can sweat in.`, `Tomorrow. Bring snacks.`], any: [`Tomorrow. I promise.`],
        }, 'c2'));
      }
      W.conf(n, W.V(n, {
        sharp: [`${c} won't train me, which is fine. I'll just remember it when ${c} needs a vote off this team.`, `Every day ${c} skips me is a day I remember.`],
        soft: [`It hurts more than I thought it would. Everybody else gets better, and I just watch.`, `I just want to be good enough to be picked.`],
        loud: [`If ${c} won't make me better, I'll make myself better, and then I'll make ${c} regret it!`, `I said it to ${c}'s face! Finally!`],
        dry: [`Every coach needs somebody to ignore. Lucky me.`, `I asked nicely. Next time, I won't ask.`],
        odd: [`I'm writing a list of everybody who hasn't trained me. It's one name. It's ${c}.`, `I'll get my session. Or I'll start my own team.`],
        any: [`I'll remember this.`],
      }, 'nc'));
    } else {
      const f = other(ctx, [n, ...cs], `po${n}`);
      if (!f) return null;
      W.friend = f;
      W.say(n, W.V(n, { sharp: [`Did you notice who ${c || 'the coach'} picked?`], loud: [`Not me. Is that a coincidence? Is that a COINCIDENCE?`], soft: [`I didn't get picked. It's fine. It's fine.`], dry: [`Another lovely morning of not being trained.`], odd: [`I got left out. I'm starting to think it's my hair.`], any: [`I wasn't picked.`] }, 'n'));
      W.say(f, W.V(f, { sharp: [`Everyone noticed. That's kind of the point.`], loud: [`That's so unfair!`], soft: [`Aw. You'll get picked soon, I'm sure.`], dry: [`It's not you. Well, maybe it's you a little.`], odd: [`Want me to train you? I don't know anything, but I'm loud.`], any: [`You'll get your turn.`] }, 'f'));
      W.say(n, W.V(n, { sharp: [`I'm not waiting for my turn.`], loud: [`I'd better!`], soft: [`I hope so.`], dry: [`I'm not holding my breath.`], odd: [`Yes. Train me. Be loud at me.`], any: [`I hope so.`] }, 'n2'));
      W.say(f, W.V(f, { sharp: [`Then don't. Go and ask.`], loud: [`Go tell ${c || 'them'}! Right now!`], soft: [`Maybe just ask? I bet ${c ? P(c).sub : 'they'}'d say yes.`], dry: [`Or ask. Asking is also an option.`], odd: [`I'll be your coach. Lesson one: snacks.`], any: [`Just ask.`] }, 'f2'));
      W.conf(n, W.V(n, { sharp: [`I see who's getting built up. I also see who isn't. Good to know where I stand.`], soft: [`I'm trying not to take it personally. I'm taking it a little personally.`], loud: [`It's DAY ONE of me being annoyed about this. There will be more days.`], dry: [`I'm being saved for later, apparently. Like leftovers.`], odd: [`Nobody picks me, but I'm still having a great time. Mostly.`], any: [`I'm noticing who gets picked.`] }, 'nc'));
    }
    return { kind: 'coach.passed', who: loud && c ? { a: c, b: n } : { a: n, b: W.friend }, coach: c, lines: W.lines };
  },
  coachCompareNotes(ev, ctx) {
    const [t, s] = ev.players;
    const W = writer(ctx, `cn|${t}|${s}`);
    W.say(s, W.V(s, { sharp: [`So what was today's lesson? I'd love to know what I'm missing.`], loud: [`Okay, so what did you learn today? Tell me EVERYTHING.`], soft: [`How was training? You looked like you were getting really good.`], dry: [`How was your private lesson? I watched from the cheap seats.`], odd: [`Tell me the secret. I won't tell anyone. Except maybe a bird.`], any: [`What did you learn today?`] }, 's'));
    W.say(t, W.V(t, { sharp: [`Nothing you'd get without the session.`], loud: [`It was SO good! Sorry, I mean, it was fine.`], soft: [`It was good. I'm sorry you didn't get to go.`], dry: [`Mostly how to be picked. It's a skill.`], odd: [`It was magic. I'm not allowed to talk about it.`], any: [`It was good.`] }, 't'));
    W.say(s, W.V(s, { sharp: [`Wow. Okay. Good to know.`], loud: [`Wow! Thanks a LOT!`], soft: [`Oh. Okay. That's fine.`], dry: [`Cool. Love that for you.`], odd: [`I'll learn it from the bird, then.`], any: [`Right.`] }, 's2'));
    W.say(t, W.V(t, { sharp: [`Don't make it a thing.`], loud: [`Okay, that came out wrong!`], soft: [`Sorry. I didn't mean it like that.`], dry: [`That sounded worse out loud.`], odd: [`I take back the magic part.`], any: [`I didn't mean it like that.`] }, 't2'));
    W.conf(s, W.V(s, { sharp: [`${t} gets the sessions and the attitude. That's going to cost ${P(t).obj} at a vote.`], soft: [`${t} didn't mean it like that. I don't think. It still hurt.`], loud: [`${t} gets a coach AND gets to brag about it? No.`], dry: [`I asked one question, and now I know exactly who the favourite is.`], odd: [`${t} won't share. I'm putting ${P(t).obj} on my list.`], any: [`Now I know who the favourite is.`] }, 'sc'));
    return { kind: 'coach.compare', who: { a: t, b: s }, coach: (ctx.sessions || []).find(x => x.contestant === t)?.coach || null, lines: W.lines };
  },
  coachPoachedProtege(ev, ctx) {
    const [n, c, o] = ev.players;
    const W = writer(ctx, `pp|${n}|${o}`);
    W.beat(`${n} is barely back from ${c}'s session when ${o} catches ${P(n).obj} on the way to the water.`);
    W.say(o, W.V(o, { sharp: [`${c} has you doing it wrong, you know. Come find me later.`], loud: [`Hey! Want to see how it's REALLY done?`], soft: [`I just wanted to say, my door's open too. If you ever want help.`], dry: [`I see ${c} is still teaching that. Interesting.`], odd: [`I have a better drill. It involves a coconut.`], any: [`Come find me later. I can help.`] }, 'o'));
    W.say(n, W.V(n, { sharp: [`I've got a coach.`], loud: [`Wait, are you allowed to do that?`], soft: [`Oh. Um. That's really nice, but...`], dry: [`I'm already being yelled at by one coach. I'm full.`], odd: [`Two coaches? Is that like having two dads?`], any: [`I've already got a coach.`] }, 'n'));
    W.say(o, W.V(o, { sharp: [`For now.`], loud: [`Just think about it!`], soft: [`No pressure. Really.`], dry: [`Offer stands.`], odd: [`The coconut will wait for you.`], any: [`Think about it.`] }, 'o2'));
    W.say(n, W.V(n, { sharp: [`I'll think about it.`], loud: [`I'll THINK about it! Maybe!`], soft: [`Okay. Thank you. I guess.`], dry: [`Noted. Filed. Ignored, probably.`], odd: [`I'm allergic to coconuts. But okay.`], any: [`I'll think about it.`] }, 'n2'));
    W.beat(`${c} is watching from across camp.`);
    W.conf(n, W.V(n, { sharp: [`Two coaches, both want me. That's leverage. I just have to not get crushed between them.`], soft: [`Now I feel bad either way. I didn't ask for any of this.`], loud: [`Everybody wants a piece of me! It's stressful AND flattering!`], dry: [`Apparently I'm a custody battle now.`], odd: [`I'm very popular with coaches. Nobody else, just coaches.`], any: [`Now two coaches want me. That's a problem.`] }, 'nc'));
    return { kind: 'coach.poach', who: { a: o, b: n, c }, lines: W.lines };
  },
  coachBadAdvice(ev, ctx) {
    const [n, c] = ev.players;
    const W = writer(ctx, `ba|${n}`); const x = other(ctx, [n, c], `ba${n}`);
    W.beat(`${n} tries what ${c} taught ${P(n).obj}, in front of everybody, and it goes badly wrong.`);
    if (x) W.say(x, W.V(x, { sharp: [`What was that supposed to be?`], loud: [`Oh no! Are you okay?!`], soft: [`Are you okay? That looked like it hurt.`], dry: [`Well, that was a choice.`], odd: [`Ten out of ten for commitment. Zero for everything else.`], any: [`What was that?`] }, 'x'));
    W.say(n, W.V(n, { sharp: [`Ask ${c}. It was ${P(c).posAdj} idea.`], loud: [`That's what ${c} told me to do!`], soft: [`I did it exactly how ${c} said. I swear.`], dry: [`I was following expert advice.`], odd: [`My coach said that would work. My coach lied.`], any: [`That's what ${c} told me to do.`] }, 'n'));
    W.say(c, W.V(c, { sharp: [`You did it wrong.`, `That's not what I said, and you know it.`], loud: [`Whoa, whoa! That's not what I meant!`], soft: [`Oh no. I'm so sorry. I explained it badly.`], dry: [`In my defence, it worked for me once.`], odd: [`It was supposed to go the other way. Mostly.`], any: [`That's not what I meant.`] }, 'c'));
    W.say(n, W.V(n, { sharp: [`Sure. My fault.`], loud: [`It was EXACTLY what you meant!`], soft: [`It's okay. Can we just not do that one again?`], dry: [`Great. Very helpful.`], odd: [`I'm going to go lie in the lake for a bit.`], any: [`Great.`] }, 'n2'));
    W.say(c, W.V(c, { sharp: [`Tomorrow, we do it properly.`], loud: [`We'll fix it! Tomorrow! I promise!`], soft: [`Of course. I'm really sorry.`], dry: [`Agreed. Let's never speak of it.`], odd: [`Deal. That one's banned now.`], any: [`We'll fix it tomorrow.`] }, 'c2'));
    W.conf(n, W.V(n, { sharp: [`${c} made me look stupid in front of the whole team. I won't trust a drill from ${P(c).obj} again.`], soft: [`Everybody saw. I wanted to disappear.`], loud: [`I have NEVER been so embarrassed in my whole life!`], dry: [`Lesson learned. Not the one ${c} meant.`], odd: [`That's going in the blooper reel. I'm the blooper reel.`], any: [`Everybody saw that.`] }, 'nc'));
    return { kind: 'coach.badadvice', who: { a: c, b: n, ...(x ? { c: x } : {}) }, lines: W.lines };
  },
  coachGivesAdvantage(ev, ctx) {
    const [c, n] = ev.players;
    const W = writer(ctx, `ga|${c}|${n}`);
    W.beat(`${c} waits until nobody is looking, then presses something into ${n}'s hand.`);
    W.say(c, W.V(c, { sharp: [`Don't say anything. Don't look at it. Just put it in your pocket.`], loud: [`Shh! Take this! Don't tell anyone! Okay, go!`], soft: [`I can't use this. You can. Please be careful with it.`], dry: [`I found this. I can't play it. You can. Try not to waste it.`], odd: [`This is a gift. From me. To you. Don't eat it.`], any: [`I can't use this. You can.`] }, 'c'));
    W.say(n, W.V(n, { sharp: [`Why me?`], loud: [`Are you SERIOUS?!`], soft: [`Why are you giving this to me?`], dry: [`Is this a test?`], odd: [`Is it a bomb? It feels like a bomb.`], any: [`Why me?`] }, 'n'));
    W.say(c, W.V(c, { sharp: [`Because your name is going around, and I need you here.`], loud: [`Because you need it more than anybody!`], soft: [`Because I don't want to watch you go home.`], dry: [`Because I've seen the votes coming, and you haven't.`], odd: [`Because you're my favourite. Don't tell the others.`], any: [`Because you need it.`] }, 'c2'));
    W.say(n, W.V(n, { sharp: [`I won't waste it.`], loud: [`I won't let you down! I SWEAR!`], soft: [`Thank you. I don't know what to say.`], dry: [`I'll try not to lose it in the lake.`], odd: [`I'll guard it with my life. And my sock.`], any: [`Thank you. I won't waste it.`] }, 'n2'));
    W.conf(c, W.V(c, { sharp: [`It's not charity. If ${n} stays, ${P(n).sub} owe${P(n).s} me, and I'm going to need that.`], soft: [`I couldn't use it anyway. I'd rather it saved somebody I care about.`], loud: [`That was the most exciting thing I've done all season, and I didn't even get to keep it!`], dry: [`An advantage I can't play is just a rock. At least now it's a useful rock.`], odd: [`I feel like Santa. A strategic Santa.`], any: [`${n} needed it more than me.`] }, 'cc'));
    return { kind: 'coach.gift', who: { a: c, b: n }, lines: W.lines };
  },
  coachCardTalk(ev, ctx) {
    const [c, o] = ev.players; const b = ev.badgeText || '';
    const W = writer(ctx, `ct|${c}|${o}`);
    if (/SHOWN/.test(b)) {
      W.beat(`${c} pulls ${o} aside and shows ${P(o).obj} the Save Card.`);
      W.say(c, `I'm the only coach on this team, so I don't need anybody's signature. Just so you know it's real.`);
      W.say(o, W.V(o, { sharp: [`Why are you showing me this?`], loud: [`Whoa! So you're basically unvotable?`], soft: [`So if they vote you out, somebody else goes instead?`], dry: [`So you're telling me who to tell.`], odd: [`It's shiny. Can I hold it?`], any: [`Why show me?`] }, 'o'));
      W.say(c, W.V(c, { sharp: [`Because a card nobody knows about doesn't scare anybody.`], loud: [`Because I want everybody to know it's real! Tell your friends!`], soft: [`I just want people to know. So nobody wastes a vote.`], dry: [`Because people should know it exists. Pass it on.`], odd: [`Because a secret card is no fun. Tell everybody.`], any: [`So you can tell people.`] }, 'c'));
      W.say(o, W.V(o, { sharp: [`Fine. I'll make sure the right people hear.`], loud: [`Oh, EVERYBODY is going to know!`], soft: [`Okay. I'll tell a couple of people.`], dry: [`Consider it leaked.`], odd: [`I'll whisper it to the whole camp.`], any: [`I'll pass it on.`] }, 'o2'));
    } else {
      const yes = /IS PROMISED/.test(b);
      W.beat(`${c} catches ${o} alone, away from the team.`);
      W.say(c, W.V(c, { sharp: [`If they come for me, you sign the card. Yes or no.`, `I need to know where you stand on the card. Now, not at the vote.`, `If my name comes up, you sign. I'd do it for you. Would you do it for me?`], loud: [`Okay, real talk. If they vote me out, you'll sign, right? RIGHT?`, `The card! If it's me, you sign! Promise me!`, `We're a team, right? So if it's me, you sign!`], soft: [`Can I ask you a favour? If my name comes up, would you sign the card for me?`, `I hate asking this. But if they vote me out, would you sign?`, `I'd sign for you, no question. Would you sign for me?`], dry: [`Hypothetically. If they vote me out. You sign?`, `Let's talk about the card, before we have to.`, `Quick question about the card. It's a big one.`], odd: [`If I'm about to be voted out, will you sign the card? I'd do it for you. Probably.`, `Let's make a pact. The card pact. You sign for me, I sign for you.`, `If they come for me, will you be my hero? With a pen?`], any: [`If they come for me, will you sign the card?`] }, 'c'));
      if (yes) {
        W.say(o, W.V(o, { sharp: [`Fine. But you owe me.`], loud: [`Of course! We're a team!`], soft: [`Of course I would. You'd do the same for me.`], dry: [`Yes. Don't make me regret it.`], odd: [`Yes. I'll sign it with a little heart.`], any: [`Yes.`] }, 'o'));
        W.say(c, `Thank you. I mean it.`);
        W.say(o, `Just don't make me use it.`);
        W.conf(c, W.pick([`${o} said yes before I even finished asking. I hope ${P(o).sub} mean${P(o).s} it, because that card is all I've got.`, `One signature. That's all I need, and ${o} just promised it. Now I just have to trust ${P(o).obj}.`, `${o} said yes. Out here, a yes is worth exactly as much as the person saying it.`], 'cardyes'));
      } else {
        W.say(o, W.V(o, { sharp: [`That depends on who goes home instead.`], loud: [`Uh... can I get back to you on that?`], soft: [`I... I really don't know. I'm sorry.`], dry: [`I'd have to think about it. For a long time.`], odd: [`Maybe. Depends on my mood that night.`], any: [`I don't know.`] }, 'o'));
        W.say(c, W.V(c, { sharp: [`That's a no, then.`], loud: [`Are you KIDDING me?`], soft: [`Oh. Okay. I understand.`], dry: [`Good to know.`], odd: [`That's not a yes. I know a yes.`], any: [`Right.`] }, 'c2'));
        W.say(o, `It's not a no. It's just not a yes yet.`);
        W.conf(c, W.pick([`I asked for one signature, and I got a maybe. Out here, a maybe is a no.`, `If they come for me, ${o} might just let me go. I need to stop that from happening.`, `${o} didn't say yes. I'll remember that the next time ${P(o).sub} need${P(o).s} something from me.`], 'cardno'));
      }
    }
    return { kind: 'coach.card', who: { a: c, b: o }, lines: W.lines };
  },
  coachStarstruck(ev, ctx) {
    const [f, c] = ev.players;
    const W = writer(ctx, `ss|${f}|${c}`);
    W.say(f, W.V(f, { sharp: [`I studied your whole season. Every move. Can I ask you about one of them?`, `I've watched you play. I have questions.`, `You know I learned half my game from watching you?`], loud: [`Okay, I HAVE to ask. What was it like? All of it?`, `I can't stop staring at you! Is that weird? It's weird!`, `My friends back home are going to FREAK when I tell them I met you!`], soft: [`Sorry, I know it's weird. I just still can't believe I'm talking to you.`, `I watched you every week. You were my favourite.`, `Can I tell you something? You're the reason I applied.`], dry: [`I'm being normal about this. I'm not being normal about this.`, `I'd like to say something cool. Nothing's coming.`, `Okay. Deep breath. Hi. I'm a fan.`], odd: [`Can I have a hair? For science.`, `I made a little statue of you once. Out of mashed potato.`, `You're even taller in real life. Or I'm shorter. One of those.`], any: [`I can't believe I'm talking to you.`] }, 'f'));
    W.say(c, W.V(c, { sharp: [`Ask. Quickly.`], loud: [`Ha! It was the BEST! Ask me anything!`], soft: [`Aw, that's sweet. I'm just a person, I promise.`], dry: [`Sure. I'll pretend I remember.`], odd: [`Go on, then. I love questions. I hate answers.`], any: [`Ask me anything.`] }, 'c'));
    W.say(f, `What were you thinking, the night it all changed for you?`);
    W.say(c, W.V(c, { sharp: [`That everybody else was too scared to do what I was about to do.`], loud: [`Honestly? I was thinking about lunch.`], soft: [`That I was terrified, and I did it anyway.`], dry: [`"Please work." That's it. That's the whole strategy.`], odd: [`I don't remember. I think I blacked out from the excitement.`], any: [`That I had to try something.`] }, 'c2'));
    W.conf(f, W.V(f, { sharp: [`I'm going to learn everything ${c} knows, and then I'm going to use it better.`], soft: [`I talked to ${c} like a normal person. Mostly. I only shook a little.`], loud: [`I talked to ${c}! I TALKED to ${c}! Best day ever!`], dry: [`I was cool about it. I was not cool about it.`], odd: [`I'm never washing this hand. ${c} didn't touch it, but still.`], any: [`I can't believe ${c} talked to me.`] }, 'fc'));
    return { kind: 'coach.starstruck', who: { a: c, b: f }, lines: W.lines };
  },
  coachUnimpressed(ev, ctx) {
    const [n, c] = ev.players;
    const W = writer(ctx, `un|${n}|${c}`);
    W.say(c, W.V(c, { sharp: [`When I give a note, I'd like you to actually listen.`], loud: [`Hey! Are you even listening to me?`], soft: [`Did that make sense? You looked a bit far away.`], dry: [`You're doing the face again. The "who is this person" face.`], odd: [`You seem distracted. Is it my whistle?`], any: [`Are you listening?`] }, 'c'));
    W.say(n, W.V(n, { sharp: [`I heard you, ${c}. You're a person who played a game once. So am I, now.`], loud: [`I heard you! I just don't care!`], soft: [`Sorry. I just don't think being famous makes you right.`], dry: [`I'm listening, ${c}. I'm just not impressed.`], odd: [`I'm not starstruck. I've seen stars. They're far away and mostly gas.`], any: [`I heard you. I'm just not impressed.`] }, 'n'));
    W.say(c, W.V(c, { sharp: [`Noted.`], loud: [`WOW. Okay.`], soft: [`Oh. Okay.`], dry: [`Refreshing. Rude, but refreshing.`], odd: [`Fair. I am mostly gas.`], any: [`Okay then.`] }, 'c2'));
    W.say(n, W.V(n, { sharp: [`Good. Then we understand each other.`], loud: [`Yeah! Okay!`], soft: [`I'm not trying to be mean. I promise.`], dry: [`Glad we cleared that up.`], odd: [`Glad we had this talk.`], any: [`Good.`] }, 'n2'));
    W.conf(n, W.V(n, { sharp: [`Everybody else is falling over themselves for ${c}. Somebody has to treat ${P(c).obj} like a normal person.`], soft: [`I don't want a celebrity. I want a coach.`], loud: [`Everybody acts like ${c} is a superstar! ${P(c).Sub} ${P(c).is} just a person who yells!`], dry: [`I watched ${P(c).posAdj} season. I wasn't a fan then, either.`], odd: [`I'll be impressed when ${c} can do a backflip.`], any: [`I'm not impressed by ${c}.`] }, 'nc'));
    return { kind: 'coach.unimpressed', who: { a: c, b: n }, lines: W.lines };
  },
  coachPullsRank(ev, ctx) {
    const [c, n] = ev.players; const worked = !/BADLY/.test(ev.badgeText || '');
    const W = writer(ctx, `pr|${c}|${n}`);
    W.say(n, W.V(n, { sharp: [`That's not how it works out here.`], loud: [`No way! That's completely wrong!`], soft: [`Are you sure? I don't think that's right.`], dry: [`Respectfully, that's a terrible idea.`], odd: [`I've decided I disagree.`], any: [`That's not right.`] }, 'n'));
    W.say(c, W.V(c, { sharp: [`I made it to the end doing it my way. Where did your way get you?`], loud: [`Buddy, I've DONE this! I know what I'm talking about!`], soft: [`I'm not trying to boss you, but I've been through this before.`], dry: [`I've done this before. On television. You may have seen it.`], odd: [`Trust me. I've been on TV. TV people know things.`], any: [`I've done this before. Trust me.`] }, 'c'));
    if (worked) { W.say(n, W.V(n, { sharp: [`...Fine. Your way.`], loud: [`Okay, okay! Fine!`], soft: [`Okay. You're right. Sorry.`], dry: [`Annoyingly, that's a good point.`], odd: [`The TV argument wins again.`], any: [`Fine.`] }, 'n2')); W.say(c, `Thank you. That's all I wanted.`); W.conf(c, `Sometimes you have to remind people why you're the coach. It worked, and everybody saw it work.`); }
    else { W.say(n, W.V(n, { sharp: [`This isn't your season anymore. It's mine.`], loud: [`Oh my gosh! Not the TV thing again!`], soft: [`I know. But this time it's different. It's us.`], dry: [`Yes, we've all heard. Several times.`], odd: [`Your season is over. This is a new season. With new mistakes.`], any: [`This isn't your season.`] }, 'n2')); W.say(c, `Fine. Do it your way. Don't come crying to me.`); W.conf(n, `If ${c} brings up ${P(c).posAdj} season one more time, I'm going to throw my shoe at ${P(c).obj}.`); }
    return { kind: 'coach.rank', who: { a: c, b: n }, lines: W.lines };
  },
  coachShineWearsOff(ev, ctx) {
    const [f, c] = ev.players;
    const W = writer(ctx, `sw|${f}|${c}`);
    W.beat(`${c} is arguing with the fire, and losing.`);
    W.say(c, W.V(c, { sharp: [`Why won't this stupid thing light?`], loud: [`LIGHT! Why won't you LIGHT!`], soft: [`Come on, little fire, please?`], dry: [`I've won challenges. I can't win against wet wood.`], odd: [`Fire, I believe in you. Why don't you believe in me?`], any: [`Why won't this light?`] }, 'c'));
    W.say(f, `You know you're blowing on it wrong, right?`);
    W.say(c, `I am not blowing on it wrong.`);
    W.beat(`It goes out.`);
    W.say(f, `Want me to try?`);
    W.say(c, `...Fine.`);
    W.conf(f, W.V(f, { sharp: [`On TV, ${c} looked like a genius. Out here, ${P(c).sub} can't even light a fire. Good to know.`], soft: [`I used to think ${c} was perfect. ${P(c).Sub}'${P(c).sub === 'they' ? 're' : 's'} not. I think I like ${P(c).obj} more now, honestly.`], loud: [`My hero can't light a FIRE! My whole childhood is a lie!`], dry: [`I'm glad I met ${c}. It's cured me of ever meeting anyone else famous.`], odd: [`${c} is just a person. A person who's bad at fire.`], any: [`${c} is just a person after all.`] }, 'fc'));
    return { kind: 'coach.shine', who: { a: c, b: f }, lines: W.lines };
  },
  coachNoBallotWeightless(ev, ctx) {
    const [r, c] = ev.players;
    const W = writer(ctx, `nb|${r}|${c}`); const x = other(ctx, [r, c], `nb${r}`);
    if (x) W.say(x, `${c} promised to look out for me. That's good, right?`);
    W.say(r, W.V(r, { sharp: [`${c} can promise you anything. ${P(c).Sub} ${P(c).has} no vote to break.`], loud: [`Wait. ${c} doesn't even have a VOTE. ${P(c).PosAdj} promise is worth nothing!`], soft: [`I don't want to be mean, but... ${c} can't actually vote. So what does the promise mean?`], dry: [`It's a promise from somebody who can't vote. It's basically a nice thought.`], odd: [`A promise with no vote is like a sandwich with no bread. It's just a feeling.`], any: [`${c} doesn't have a vote. What's the promise worth?`] }, 'r'));
    if (x) { W.say(x, `...Oh. I didn't think about that.`); W.say(r, `Nobody does. That's why it works on everybody.`); }
    else { W.say(r, `So I'm not counting on a word ${c} says until ${P(c).sub} can back it up with a vote.`); W.say(r, `Which, for the record, is never.`); }
    W.conf(r, W.V(r, { sharp: [`Everybody keeps trusting ${c}. ${c} has nothing to lose, and that's exactly why I don't.`], soft: [`I like ${c}. I just think people are trusting a promise nobody can keep.`], loud: [`I can't be the only one who's figured this out!`], dry: [`The safest person to promise you something is somebody who can't break it. Or keep it.`], odd: [`I've cracked the code. The code is that coaches can't vote.`], any: [`${c} can't keep a promise without a vote.`] }, 'rc'));
    return { kind: 'coach.noballot', who: { a: c, b: r, ...(x ? { c: x } : {}) }, lines: W.lines };
  },
  coachSaysTheUnsayable(ev, ctx) {
    const [c, t] = ev.players;
    const W = writer(ctx, `su|${c}|${t}`); const x = other(ctx, [c, t], `su${t}`);
    W.beat(`The whole team is around the fire when ${c} just says it.`);
    W.say(c, W.V(c, { sharp: [`${t}, you're the weakest person on this team, and everybody here knows it.`], loud: [`Okay, somebody has to say it! ${t}, you're dragging us down!`], soft: [`I'm sorry, ${t}, but I have to be honest with you. You're struggling, and everybody can see it.`], dry: [`${t}, nobody's going to say this, so I will. You're the problem.`], odd: [`${t}, I had a dream that you cost us a challenge, and then you did.`], any: [`${t}, you're the weakest one here, and everybody knows it.`] }, 'c'));
    W.beat(`Nobody moves.`);
    W.say(t, W.V(t, { sharp: [`Easy to say when you can't get voted for it.`], loud: [`Are you SERIOUS right now?!`], soft: [`Wow. Okay. That really hurts.`], dry: [`Great team-building exercise. Really.`], odd: [`I'll have you know I'm very strong on the inside.`], any: [`Are you serious?`] }, 't'));
    W.say(c, W.V(c, { sharp: [`It's true, and you know it.`], loud: [`I'm just saying what everybody's thinking!`], soft: [`I'm sorry. I really am. Somebody had to say it.`], dry: [`I'm not the one who has to vote. You lot are.`], odd: [`I stand by the dream.`], any: [`It's true, though.`] }, 'c2'));
    if (x) W.say(x, `Okay, can we all just... eat?`); else W.say(t, `Wow. Good talk.`);
    if (x) W.conf(x, `${c} said what everybody's been thinking. That's what happens when you give somebody no vote and no filter.`);
    W.conf(c, W.V(c, { sharp: [`I don't have a vote to protect. That means I can say what nobody else will.`], soft: [`I felt awful saying it. But somebody had to.`], loud: [`Was it mean? Yes! Was it true? Also yes!`], dry: [`Being a coach is great. You can say anything, and nobody can vote for you over it. Yet.`], odd: [`I have no filter. I lost it on day two.`], any: [`Somebody had to say it.`] }, 'cc'));
    return { kind: 'coach.unsayable', who: { a: c, b: t, ...(x ? { c: x } : {}) }, lines: W.lines };
  },
  coachCardFlinch(ev, ctx) {
    const [n, c] = ev.players; const x = other(ctx, [n, c], `cf${n}`);
    if (!x) return null;
    const W = writer(ctx, `cf|${n}|${c}`);
    W.beat(`${x} floats ${c}'s name. ${n} shuts it down fast.`);
    W.say(x, `What if we just get rid of ${c}? One less person telling us what to do.`);
    W.say(n, W.V(n, { sharp: [`And then the card saves ${P(c).obj}, and one of us goes home instead. Think.`], loud: [`No way! The card! Did you forget about the card?!`], soft: [`Please don't. The card would save ${P(c).obj}, and then it's one of us.`], dry: [`Great plan. Then the card kicks in, and we lose somebody we actually need.`], odd: [`The card is like a boomerang. You throw it at ${c}, and it hits you.`], any: [`The card would save ${P(c).obj}. Then it's one of us.`] }, 'n'));
    W.say(x, `...I forgot about the card.`);
    W.say(n, `Everybody forgets about the card. Until it's used.`);
    W.conf(n, `As long as that card is out there, going after a coach is the easiest way to lose one of your own.`);
    return { kind: 'coach.flinch', who: { a: n, b: x }, coach: c, lines: W.lines };
  },
  coachCardFlush(ev, ctx) {
    const [n, c] = ev.players; const x = other(ctx, [n, c], `cx${n}`);
    if (!x) return null;
    const W = writer(ctx, `cx|${n}|${c}`);
    W.say(n, W.V(n, { sharp: [`We go after ${c}. Right now. Make ${P(c).obj} burn the card.`], loud: [`I say we vote ${c}! Burn that card!`], dry: [`Hear me out. We aim at ${c}, and make the card go away.`], soft: [`I think we should vote for ${c}. Just to use up the card.`], odd: [`Let's vote for ${c}. For science.`], any: [`We should go after ${c}, and make ${P(c).obj} use the card.`] }, 'n'));
    W.say(x, `And lose one of us when it saves ${P(c).obj}?`);
    W.say(n, `Once. And then the card's gone, and the next shot is clean.`);
    W.say(x, W.V(x, { sharp: [`That's cold.`], loud: [`That's insane!`], soft: [`That's really risky.`], dry: [`That's either brilliant or terrible.`], odd: [`I love it. I hate it. I love it.`], any: [`That's risky.`] }, 'x'));
    W.conf(n, `Everybody's scared of that card. I'm not. I want it gone, and the only way it goes is if somebody makes them use it.`);
    return { kind: 'coach.flush', who: { a: n, b: x }, coach: c, lines: W.lines };
  },
  coachIdleAdvantage(ev, ctx) {
    const [c, f] = ev.players;
    const W = writer(ctx, `ia|${c}`);
    W.beat(`${c} turns something over in ${P(c).posAdj} hands, alone on the dock.`);
    W.conf(c, W.V(c, { sharp: [`I can't play it until the merge. I could give it away. I'm not giving it away.`], loud: [`I have a POWER, and I can't USE it! This is torture!`], soft: [`I keep thinking about giving it to ${f}. I just... might need it myself later.`], dry: [`I'm holding the most useful thing on this island, and it does nothing for me. Classic.`], odd: [`It's my little secret friend. We don't do anything. We just hang out.`], any: [`I can't use it yet, and I can't give it away yet.`] }, 'c'));
    if (f && f !== c) { W.say(f, `What are you doing out here?`); W.say(c, `Nothing. Thinking.`); W.say(f, `About what?`); W.say(c, `The merge. It's all I think about.`); W.conf(f, `${c} is hiding something. I don't know what, but ${P(c).sub} put it away the second I walked up.`); }
    else W.conf(c, `If anybody finds out I've got it, I'm the first coach on the block. So nobody finds out.`);
    return { kind: 'coach.idle', who: { a: c, ...(f && f !== c ? { b: f } : {}) }, lines: W.lines };
  },
  coachPlayingForTheMerge(ev, ctx) {
    const [c, n] = ev.players;
    const W = writer(ctx, `pm|${c}`);
    W.say(n, `Do you ever wish you were playing?`);
    W.say(c, W.V(c, { sharp: [`I am playing. I'm just playing for the merge.`], loud: [`Every single day! But I will be! At the merge!`], soft: [`Honestly? A little. But I'll get my turn, if I make the merge.`], dry: [`I'm playing a different game. It's called "don't get voted out by your own students".`], odd: [`I'm playing in my head. I'm winning in my head.`], any: [`I will be. At the merge.`] }, 'c'));
    W.say(n, `And then you're one of us.`);
    W.say(c, W.V(c, { sharp: [`Then I'm one of you, with everything I learned watching you.`], loud: [`And then you'd better watch out!`], soft: [`Then I hope we're on the same side.`], dry: [`Then I'm your problem. Sorry in advance.`], odd: [`Then I'm everybody's problem. It'll be fun.`], any: [`Then I'm one of you.`] }, 'c2'));
    W.conf(c, W.V(c, { sharp: [`Everybody else is playing for the next vote. I'm playing for the merge. That makes me the only one with a plan.`], soft: [`I can't think about the merge too much. I'll get my hopes up.`], loud: [`Merge, merge, merge! That's all I think about! Also lunch!`], dry: [`Every coach says they're here to help. Every coach is also counting the days to the merge.`], odd: [`I've started counting down to the merge on a stick. The stick is very long.`], any: [`I'm playing for the merge.`] }, 'cc'));
    return { kind: 'coach.merge', who: { a: c, b: n }, lines: W.lines };
  },
  coachOwnSeason(ev, ctx) {
    const [h, c] = ev.players; const past = pastOf(c, true);
    const W = writer(ctx, `os|${h}|${c}`);
    W.say(h, past ? `So how does it feel, coming back here after ${past.where}?` : `So. Want to talk about how your season ended?`);
    W.say(c, W.V(c, { sharp: [`No.`], loud: [`Nope! Next question!`], soft: [`Not really, no.`], dry: [`I'd rather eat Chef's cooking.`], odd: [`Which season? I don't remember any season.`], any: [`No.`] }, 'c'));
    W.say(h, past?.by ? `Because I remember ${past.by}. Everybody remembers ${past.by}.` : `Because I remember. Everybody remembers.`);
    W.say(c, W.V(c, { sharp: [`Then you remember I made it further than you will.`], loud: [`Okay! Wow! We're doing this now!`], soft: [`It still hurts, you know. It really does.`], dry: [`Great. So do I. Every night.`], odd: [`I remember it differently. In my version, I won.`], any: [`I remember too.`] }, 'c2'));
    W.conf(h, `Every coach has a weak spot. ${c}'s is the end of ${P(c).posAdj} own season.`);
    return { kind: 'coach.past', who: { a: c, b: h }, lines: W.lines };
  },
  // ── coach against coach (coach-deals.js) ──
  coachNonAggression(ev, ctx) {
    const [a, b] = ev.players;
    const W = writer(ctx, `na|${a}|${b}`);
    W.beat(`${a} and ${b} meet behind the cabins, away from the team.`);
    W.say(a, W.V(a, { sharp: [`You stay out of my people, and I'll stay out of yours.`], loud: [`Truce! Your players are yours, mine are mine!`], soft: [`Can we agree not to fight over the same people? It's bad for them.`], dry: [`Let's not fight over the same players. It's embarrassing for both of us.`], odd: [`I propose a peace treaty. With snacks.`], any: [`Stay out of my players, and I'll stay out of yours.`] }, 'a'));
    W.say(b, W.V(b, { sharp: [`Deal. For now.`], loud: [`Deal! Shake on it!`], soft: [`That's fair. Deal.`], dry: [`Fine. It's a truce.`], odd: [`Deal. Where are the snacks?`], any: [`Deal.`] }, 'b'));
    W.say(a, `And if one of us breaks it?`);
    W.say(b, `Then the other one tells everybody. Fair?`);
    W.conf(a, `${b} and I don't have to like each other. We just have to stop stepping on each other's toes.`);
    return { kind: 'coach.truce', who: { a, b }, lines: W.lines };
  },
  coachTrade(ev, ctx) {
    const [a, b, x, y] = ev.players;
    const W = writer(ctx, `tr|${a}|${b}`);
    W.say(a, x && y ? `You take ${x}. I take ${y}. Everybody stops pretending they're not working on the same people.` : `Let's split them. You work with yours, I work with mine.`);
    W.say(b, W.V(b, { sharp: [`What do I get out of it?`], loud: [`Ooh! A trade! I love a trade!`], soft: [`Is that fair to them, though?`], dry: [`So we're dividing people up like snacks.`], odd: [`Can I also have a hat?`], any: [`What do I get?`] }, 'b'));
    W.say(a, `A team that listens to you, and one less fight with me.`);
    W.say(b, `Fine. Done.`);
    W.conf(b, `It's not a gift. It's a trade. ${a} gets something too, and I'm going to work out what.`);
    return { kind: 'coach.trade', who: { a, b }, lines: W.lines };
  },
  coachTheFall(ev, ctx) {
    const [f, s] = ev.players;
    const W = writer(ctx, `fa|${f}|${s}`);
    W.beat(`${f} finds ${s}. ${f} knows ${P(f).posAdj} name is out there.`);
    W.say(f, `If they get me, take my people. Don't let them get picked off because they trained with me.`);
    W.say(s, W.V(s, { sharp: [`And what do I get?`], loud: [`Whoa, don't talk like that!`], soft: [`Of course. I'll look after them. I promise.`], dry: [`That's very dramatic. Yes.`], odd: [`Like a will? Do I get your whistle?`], any: [`I'll look after them.`] }, 's'));
    W.say(f, `Just promise.`);
    W.say(s, `I promise.`);
    W.conf(f, `I might not be here tomorrow. If I'm not, at least my people won't be on their own.`);
    return { kind: 'coach.fall', who: { a: f, b: s }, lines: W.lines };
  },
  coachDealRejected(ev, ctx) {
    const [p, r] = ev.players;
    const W = writer(ctx, `dr|${p}|${r}`);
    W.say(p, `We should work together. Two coaches, one plan. Nobody beats that.`);
    W.say(r, W.V(r, { sharp: [`No. I don't need you.`], loud: [`Ha! No way!`], soft: [`I'm sorry. I don't think so. Not right now.`], dry: [`I'm good, thanks.`], odd: [`I'm going to say no, but in a nice way. No.`], any: [`No, thanks.`] }, 'r'));
    W.say(p, `You'll change your mind.`);
    W.say(r, `I really won't.`);
    W.conf(r, `${p} wants a partner. I want ${P(p).obj} out of my way. Those aren't the same thing.`);
    return { kind: 'coach.rejected', who: { a: p, b: r }, lines: W.lines };
  },
  coachDealBroken(ev, ctx) {
    const [b, v] = ev.players;
    const W = writer(ctx, `db|${b}|${v}`);
    W.beat(`${v} finds out what ${b} did, and goes straight to ${P(b).obj}.`);
    W.say(v, W.V(v, { sharp: [`We had a deal.`], loud: [`We had a DEAL!`], soft: [`I thought we had a deal. I really thought we did.`], dry: [`So the deal was more of a suggestion.`], odd: [`You broke our deal. And my heart. Mostly the deal.`], any: [`We had a deal.`] }, 'v'));
    W.say(b, W.V(b, { sharp: [`Things changed.`], loud: [`I had to! Things changed!`], soft: [`I'm sorry. I didn't have a choice.`], dry: [`Deals out here have a shelf life.`], odd: [`The deal expired. Like milk.`], any: [`Things changed.`] }, 'b'));
    W.say(v, `Things didn't change. You did.`);
    W.say(b, `Maybe. It's still a game.`);
    W.conf(v, `I won't make that mistake twice. Not with ${b}.`);
    return { kind: 'coach.broken', who: { a: b, b: v }, lines: W.lines };
  },
};

/** The scene for one coach event (or the session record), or null. */
export function writeCoachScene(ev, ctx) {
  try {
    if (ev.type === 'coachSession') return session(ev, ctx);
    const w = WRITE[ev.type];
    return w ? w(ev, ctx) : null;
  } catch (e) {
    if (typeof process !== 'undefined' && process.env?.VITEST) throw e;
    return null;
  }
}
