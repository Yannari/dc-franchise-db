// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/journey.js — the Journey, as scenes
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-12: "build the journey in the stepped viewer". It played as the host's one-line twist
// announcement and narration. The engine (twists.js simulateJourney) decides everything: who each camp sends
// (and the argument over it, advantages.js pickNomineeWithDrama), whether two travellers make a deal or compete,
// the challenge and who wins it, a lone traveller's gamble, and what each comes back with (an advantage, nothing,
// or no vote at the next tribal). This plays it, like the Ambassadors (ambassadors.js): each camp choosing, the
// travellers meeting the host somewhere else, the deal or the challenge or the gamble, and the walk back.
import { placeScene, plateKey, VENUES, teamSpot, campSlot } from './steps.js';
import { voicer, P } from './voiced.js';

const bondOf = ep => { const s = ep.gsSnapshot?.bonds || {}; return (a, b) => s[a <= b ? `${a}||${b}` : `${b}||${a}`] ?? 0; };
const ADV = { extraVote: 'an extra vote', voteSteal: 'a vote steal', voteBlock: 'a vote block', safetyNoPower: 'Safety Without Power', soleVote: 'the sole vote' };
const advName = t => ADV[t] || 'an advantage';
const uniq = a => a.filter(Boolean).filter((n, i, x) => x.indexOf(n) === i);

// which of the three nomination arguments it was (advantages.js pickNomineeWithDrama writes them as narration)
function dramaKind(ev, nominee) {
  const t = String(ev?.text || '');
  const other = (ev?.mentioned || []).find(n => n !== nominee) || null;
  if (/ready to go|wanted the same thing|put their name forward/.test(t)) return { kind: 'rival', other };
  if (/first to suggest|pushed hardest|volunteered .*'s name/.test(t)) return { kind: 'pushed', other };
  if (/volunteered to go|said they'd do it|nobody else stepped up/.test(t)) return { kind: 'volunteer', other };
  return other ? { kind: 'rival', other } : null;
}

/** steps for the whole Journey. ctx: { ep, host, venue, neutral (plate key) } */
export function journeyDay({ ep, host, venue, neutral }) {
  const J = ep.journey;
  if (!J?.travelers?.length) return [];
  const V = voicer(`jrn|${ep.num}`);
  const bond = bondOf(ep);
  const steps = [];
  const say = (by, text, focus = [by], extra = {}) => steps.push({ k: 'say', by, text, focus, ...extra });
  const hostSay = (text, focus = [], extra = {}) => steps.push({ k: 'say', by: host, host: true, text, focus, ...extra });
  const beat = (text, focus = [], extra = {}) => steps.push({ k: 'beat', text, focus, ...extra });
  const conf = (by, text) => steps.push({ k: 'conf', by, text });
  const Vn = VENUES[venue] || VENUES['hosted-camp'];
  const tribes = (ep.tribesAtStart?.length ? ep.tribesAtStart : ep.gsSnapshot?.tribes || []).map(t => ({ name: t.name, members: (t.members || []).filter(Boolean) }));
  const merged = J.travelers.length && (J.nominationDrama || []).some(d => d.tribe === 'merge') || tribes.length < 2;
  const campOf = n => merged ? null : tribes.find(t => t.members.includes(n))?.name || null;
  const campKey = (tribe, tod) => (tribe ? plateKey(venue, teamSpot(venue, Vn.public, campSlot(ep, tribe, venue)), tod) : null) || plateKey(venue, Vn.public, tod);
  const result = n => (J.results || []).find(r => r.name === n) || { name: n, result: 'safe' };
  const T = J.travelers;
  const deal = (J.results || []).some(r => r.dealMade);
  const compete = T.length >= 2 && !deal;

  // ── each camp chooses who goes ──
  const groups = merged ? [{ tribe: null, who: T }] : uniq(T.map(campOf)).map(tr => ({ tribe: tr, who: T.filter(n => campOf(n) === tr) }));
  for (const g of groups) {
    const mates = merged ? (ep.gsSnapshot?.activePlayers || []).filter(n => !T.includes(n)) : (tribes.find(t => t.name === g.tribe)?.members || []).filter(n => !T.includes(n));
    const key = campKey(g.tribe, 'day');
    if (!key) continue;
    const A = g.who[0];
    const dr = (J.nominationDrama || []).find(d => d.player === A);
    const dk = dr ? dramaKind(dr.event, A) : null;
    // who says the name: the one who pushed it, else A's closest teammate, and never the one who wanted to go instead
    const backer = (dk?.kind === 'pushed' ? dk.other : null) || mates.filter(n => !(dk?.kind === 'rival' && n === dk.other)).sort((x, y) => bond(A, y) - bond(A, x))[0];
    const cast = uniq([A, backer, dk?.other, ...mates]).slice(0, 8);
    steps.push({ k: 'scene', spot: Vn.public, tod: 'day', plate: key, place: g.tribe ? `${g.tribe} Camp` : 'Camp', time: 'Morning',
      card: !steps.some(x => x.k === 'scene'), cut: steps.some(x => x.k === 'scene'), focus: uniq([A, backer]), bg: [], places: placeScene(key, cast, []) });
    beat(merged
      ? `A note at camp: ${T.length > 1 ? `${T.length === 2 ? 'two' : T.length} of you` : 'one of you'} goes on a journey today. Nobody knows what's waiting at the other end.`
      : `A note at camp: one person from each team goes on a journey today. Nobody knows what's waiting at the other end.`, mates.slice(0, 3), { tense: true });
    if (dk?.kind === 'volunteer') {
      say(A, V(A, {
        sharp: [`I'll go. Somebody has to, and I'd rather it was someone who knows what they're doing.`], loud: [`I'll go! Nobody else is jumping up, so I'm going!`],
        soft: [`I can go, if nobody else wants to.`], dry: [`Fine. I'll take the mystery walk.`], odd: [`I volunteer. I've always wanted to go on a quest.`], any: [`I'll go.`],
      }, `vol-${g.tribe}`), [A]);
      if (dk.other) say(dk.other, V(dk.other, {
        sharp: [`Thanks, ${A}. That's one I owe you.`], loud: [`${A}! You're a hero!`], soft: [`Thank you, ${A}. Really.`], dry: [`Brave. Or hungry for a change of scenery.`],
        odd: [`${A} answers the call. I'll write a song about it.`], any: [`Thanks, ${A}.`],
      }, `vol2-${g.tribe}`), [dk.other, A]);
    } else {
      if (backer) say(backer, V(backer, {
        sharp: [`${A} should go. ${A} reads people better than any of us.`, `Send ${A}. Whatever it is, ${A} won't panic.`], loud: [`${A}! It has to be ${A}!`, `Send ${A}! ${A} can handle anything!`],
        soft: [`I think ${A} should go. ${A} always knows what to say.`], dry: [`${A}. Obviously. The rest of us would just get lost.`],
        odd: [`${A} has journey energy. I can tell.`], any: [`It should be ${A}.`],
      }, `nom-${g.tribe}`), [backer, A]);
      if (dk?.kind === 'rival') {
        say(dk.other, V(dk.other, {
          sharp: [`I was going to go. Just so everyone knows.`], loud: [`Wait, I wanted to go!`], soft: [`Oh. I kind of wanted to go, but that's fine.`],
          dry: [`Sure. I'll stay here and guard the sand.`], odd: [`I had my journey shoes on and everything.`], any: [`I wanted to go.`],
        }, `rival-${g.tribe}`), [dk.other, A]);
      }
      say(A, V(A, {
        sharp: [`Fine. I'll go. Whatever it is, I'll come back with something.`], loud: [`Let's go! I'm coming back with something big!`],
        soft: [`Okay. I'll go. Wish me luck.`], dry: [`Great. A mystery. My favourite.`], odd: [`I accept. Tell the sand I'll miss it.`], any: [`Okay. I'll go.`],
      }, `accept-${g.tribe}`), [A]);
      if (dk?.kind === 'pushed' && dk.other) conf(A, V(A, {
        sharp: [`${dk.other} said my name before anybody else could. I noticed. I always notice.`], loud: [`${dk.other} was REALLY keen to get me out of camp. Why?`],
        soft: [`${dk.other} suggested me so fast. I don't want to think the worst, but...`], dry: [`${dk.other} couldn't get my name out quick enough. Interesting.`],
        odd: [`${dk.other} wanted me gone very quickly. Like a magician making a rabbit disappear.`], any: [`${dk.other} pushed hard for me to go. I'll remember that.`],
      }, `pushed-${g.tribe}`));
      if (dk?.kind === 'rival') conf(dk.other, V(dk.other, {
        sharp: [`They picked ${A} over me. Fine. I'll remember who decided that.`], loud: [`I wanted that! Whatever's out there, it should've been mine!`],
        soft: [`It's fine. It's totally fine. I just thought they'd pick me.`], dry: [`I'm not bitter. I'm just going to sit here, not bitter, for a while.`],
        odd: [`The journey chose ${A}. The journey has bad taste.`], any: [`I should've been the one to go.`],
      }, `rivalconf-${g.tribe}`));
    }
    for (const B of g.who.slice(1)) say(B, V(B, { any: [`And I'm going too, apparently.`], loud: [`Me too! Road trip!`], dry: [`And me. Lucky me.`] }, `also-${B}`), [B]);
  }

  // ── the journey itself ──
  const where = neutral || plateKey(venue, Vn.public, 'day');
  steps.push({ k: 'scene', spot: 'journey', tod: 'day', plate: where, place: 'The Journey', time: 'Midday', card: false, cut: true, focus: T, bg: [], places: placeScene(where, T, [], { host }), host, act: { kind: 'arrive', who: T } });
  steps.push({ k: 'title', kicker: 'Twist', name: 'The Journey', faces: T, vs: compete && T.length === 2 });
  hostSay(T.length > 1 ? `Welcome, travellers. You came a long way, and you're not going back the same.` : `Welcome, ${T[0]}. You came a long way, and you're not going back the same.`, T);

  if (T.length >= 2) {
    const [a, b] = T;
    hostSay(`Here's the offer. Compete, and the winner takes something back that'll help them in this game, and the loser loses their vote at their next tribal. Or shake hands right now: nobody wins anything, nobody loses anything.`, T, { tense: true });
    if (deal) {
      say(a, V(a, {
        sharp: [`I'll shake. Neither of us needs to go home without a vote.`], loud: [`Deal! Let's not do this to each other!`], soft: [`Can we just... both go home safe? Please?`],
        dry: [`I'd rather not lose my vote today. Shake?`], odd: [`Let's be friends instead of enemies. Friends with votes.`], any: [`Let's make a deal.`],
      }, 'deal-a'), [a, b]);
      say(b, V(b, {
        sharp: [`Deal. But I won't forget I could have beaten you.`], loud: [`Deal! Bring it in!`], soft: [`Yes. Deal. Thank you.`],
        dry: [`Fine. Nobody wins. My favourite outcome.`], odd: [`Deal. Let us seal it with a very serious handshake.`], any: [`Deal.`],
      }, 'deal-b'), [b, a]);
      beat(`${a} and ${b} shake hands.`, [a, b], { act: { kind: 'hug', who: [a, b] } });
      steps.push({ k: 'title', kicker: 'They make a deal', name: 'Nobody loses', faces: T, side: [{ tab: 'log', text: `${T.join(' and ')} shake hands: both keep their vote, nobody wins anything.` }] });
      hostSay(`Wow. Boring. Safe, but boring. Off you go.`, T);
      conf(a, V(a, {
        sharp: [`${b} and I just made a deal on the spot. That's the start of something. Or a very useful lie.`], loud: [`We shook on it! I feel like we're best friends now!`],
        soft: [`I trusted ${b} and ${b} trusted me. That's worth more than any advantage.`], dry: [`Nobody won, nobody lost. Honestly, best day I've had out here.`],
        odd: [`${b} and I have a bond now. A handshake bond. The strongest kind.`], any: [`${b} and I made a deal. I hope it holds.`],
      }, 'deal-conf'));
    } else {
      say(a, V(a, {
        sharp: [`We're competing. I didn't come all this way to walk back with nothing.`], loud: [`No way! Let's DO this!`], soft: [`I don't really want to, but... I think we have to compete.`],
        dry: [`Compete. I like my vote, but I like winning more.`], odd: [`To battle! Politely.`], any: [`Let's compete.`],
      }, 'comp-a'), [a, b]);
      say(b, V(b, {
        sharp: [`Fine. Don't cry when you lose your vote.`], loud: [`You're ON!`], soft: [`Okay. No hard feelings, whatever happens?`],
        dry: [`Great. Nothing says friendship like taking someone's vote.`], odd: [`May the best traveller win. It's me.`], any: [`Fine. Let's go.`],
      }, 'comp-b'), [b, a]);
      steps.push({ k: 'title', kicker: 'The challenge', name: J.challengeLabel || 'The Challenge', faces: T, vs: T.length === 2 });
      hostSay(`Today's challenge: ${J.challengeLabel || 'a duel'}. Winner takes the prize, loser loses the vote.`, T);
      if (J.challengeDesc) beat(J.challengeDesc, T);   // written in the past tense: what they did, as narration
      const win = (J.results || []).find(r => r.result !== 'lostVote')?.name || J.winner;
      const lose = T.filter(n => n !== win);
      const mental = J.challengeStat === 'mental';
      beat(mental ? `${T.join(' and ')} go at it in silence. Nobody looks up.` : `${T.join(' and ')} go at it. Both of them are breathing hard inside a minute.`, T, { tense: true, act: { kind: 'vs', who: T, style: mental ? 'puzzle' : 'hold' } });
      beat(mental ? `${lose[0]} hesitates for a second. That's all it takes.` : `${lose[0]} starts to slip.`, lose, { tense: true });
      steps.push({ k: 'title', kicker: 'Wins the journey', name: win, faces: [win], act: { kind: 'roundwin', who: [win], lose } });
      const wr = result(win);
      if (wr.result === 'advantage') {
        hostSay(`${win}, you win ${advName(wr.type)}. Use it well. Or don't. It's more fun for me if you don't.`, [win], { side: [{ tab: 'log', text: `${win} wins ${advName(wr.type)}.` }] });
      } else hostSay(`${win}, you win. And the prize is... keeping your vote. Sometimes that's enough.`, [win]);
      for (const L of lose) {
        hostSay(`${L}, at your next tribal, you don't get a vote.`, [L], { tense: true, side: [{ tab: 'log', text: `${L} loses their vote at the next tribal.` }] });
        say(L, V(L, {
          sharp: [`Fine. I'll find another way to matter.`], loud: [`NO! Are you serious?!`], soft: [`Oh no. Okay. That's... okay.`],
          dry: [`Great. I came all this way to lose something.`], odd: [`My vote is gone. Like a balloon. Floating away.`], any: [`I can't believe I lost my vote.`],
        }, `lose-${L}`), [L], { shock: true });
      }
      conf(win, wr.result === 'advantage' ? V(win, {
        sharp: [`I've got ${advName(wr.type)} in my pocket, and nobody at camp needs to know.`], loud: [`I WON! And I've got ${advName(wr.type)}! This changes everything!`],
        soft: [`I won something. I'm still shaking. Now I just have to not tell anyone.`], dry: [`${advName(wr.type)[0].toUpperCase() + advName(wr.type).slice(1)}. Nice. I'll be keeping that to myself.`],
        odd: [`I won a magic item. I mean an advantage. Same thing.`], any: [`I won ${advName(wr.type)}. Nobody needs to know.`],
      }, 'win-conf') : V(win, { any: [`I won. Nothing to show for it, but at least I've still got my vote.`] }, 'win-conf2'));
    }
  } else {
    // one traveller: the gamble
    const A = T[0], r = result(A);
    hostSay(`Here's your choice. Walk back with nothing, or take a risk. Two urns. One holds something that'll help you in this game. The other costs you your vote at your next tribal.`, [A], { tense: true });
    say(A, V(A, {
      sharp: [`I didn't come all this way to walk back empty-handed. I'm taking the risk.`], loud: [`Give me the urns! I'm feeling lucky!`],
      soft: [`I'm scared. But I think I have to try.`], dry: [`I'll gamble. My luck's been terrible, so it's due.`], odd: [`The urns are calling me. I must answer.`], any: [`I'll take the risk.`],
    }, 'gamble'), [A]);
    beat(`${A} reaches into an urn.`, [A], { tense: true });
    if (r.result === 'advantage') {
      steps.push({ k: 'title', kicker: 'The gamble pays off', name: A, faces: [A], side: [{ tab: 'log', text: `${A} wins ${advName(r.type)}.` }] });
      hostSay(`${A}, you just won ${advName(r.type)}.`, [A]);
      conf(A, V(A, {
        sharp: [`I bet on myself and it paid off. Now I've got ${advName(r.type)} and a secret.`], loud: [`I WON! I can't believe I won!`],
        soft: [`I nearly didn't do it. I'm so glad I did.`], dry: [`Turns out gambling is great. Who knew.`], odd: [`The urn was kind to me. I'll write to it.`], any: [`I won ${advName(r.type)}.`],
      }, 'gamble-win'));
    } else if (r.result === 'safe') {
      steps.push({ k: 'title', kicker: 'Nothing lost', name: A, faces: [A] });
      hostSay(`Empty. You win nothing, and you lose nothing. Off you go.`, [A]);
      conf(A, V(A, { any: [`Nothing. I risked my vote for nothing. I'll take it, I guess.`], dry: [`I gambled and the house shrugged. Fine.`] }, 'gamble-none'));
    } else {
      steps.push({ k: 'title', kicker: 'The gamble backfires', name: A, faces: [A], tone: 'out', side: [{ tab: 'log', text: `${A} loses their vote at the next tribal.` }] });
      hostSay(`Ooh. ${A}, at your next tribal, you don't get a vote.`, [A], { tense: true });
      say(A, V(A, {
        sharp: [`Of course. Of course it was the bad one.`], loud: [`NO! Why did I do that?!`], soft: [`Oh no. I shouldn't have done that.`],
        dry: [`Great. Gambling. Never again.`], odd: [`The urn has betrayed me.`], any: [`I lost my vote.`],
      }, 'gamble-lose'), [A], { shock: true });
    }
  }

  // ── back at camp with the news ──
  for (const g of groups) {
    const key = campKey(g.tribe, 'day');
    if (!key) continue;
    const mates = merged ? (ep.gsSnapshot?.activePlayers || []).filter(n => !T.includes(n)) : (tribes.find(t => t.name === g.tribe)?.members || []).filter(n => !T.includes(n));
    for (const A of g.who) {
      const r = result(A);
      const ask = mates.slice().sort((x, y) => bond(A, y) - bond(A, x))[0];
      if (!ask) continue;
      steps.push({ k: 'scene', spot: Vn.public, tod: 'day', plate: key, place: g.tribe ? `${g.tribe} Camp` : 'Camp', time: 'Late afternoon', card: false, cut: true,
        focus: [A, ask], bg: [], places: placeScene(key, uniq([A, ask, ...mates]).slice(0, 8), []), act: { kind: 'arrive', who: [A] } });
      say(ask, V(ask, {
        sharp: [`So? What was out there?`], loud: [`You're back! What happened?!`], soft: [`Are you okay? What happened?`], dry: [`Well? Did you find treasure?`],
        odd: [`Tell me everything. Were there dragons?`], any: [`What happened out there?`],
      }, `askback-${A}`), [ask, A]);
      if (r.result === 'lostVote') say(A, V(A, {
        sharp: [`I lost my vote. Don't make a thing of it.`], loud: [`I lost my vote! At tribal! I can't vote!`], soft: [`I... lost my vote. I'm so sorry.`],
        dry: [`I lost my vote. So that was a fun day.`], odd: [`My vote is on a journey now. Without me.`], any: [`I lost my vote.`],
      }, `back-lost-${A}`), [A, ask]);
      else if (r.result === 'advantage') {
        say(A, V(A, {
          sharp: [`A long walk and a lot of sand. Nothing worth talking about.`], loud: [`Oh, you know! Walking! So much walking!`], soft: [`Not much, honestly. Just a really long walk.`],
          dry: [`Scenery. Very scenic. That's it.`], odd: [`I saw a crab. We had a moment. That's all.`], any: [`Nothing much. Just a long walk.`],
        }, `back-adv-${A}`), [A, ask]);
        conf(ask, V(ask, { any: [`${A} came back way too relaxed for someone who did nothing all day.`], dry: [`"Nothing much." Sure.`], soft: [`I believe ${A}. Mostly. I think.`] }, `doubt-${A}`));
      } else say(A, V(A, {
        sharp: [`Nothing happened. I kept my vote. That's the story.`], loud: [`Nothing! I'm safe and I'm STARVING!`], soft: [`I'm fine. Nothing happened, really.`],
        dry: [`I walked there, I walked back. Riveting.`], odd: [`Nothing. The journey was the friends we made. There were no friends.`], any: [`Nothing happened. I'm fine.`],
      }, `back-safe-${A}`), [A, ask]);
    }
  }
  return steps;
}
