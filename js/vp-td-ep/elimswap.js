// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/elimswap.js — the Elimination Swap, played as the night it is
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-10, on a swap that aired as five lines of narration: "where are the dialogues; it
// needs to be deep, dramatic, filled with suspense". The engine (episode.js) decides it: the one voted
// out (the swapper) moves to the other team and sends one of them back (pickedPlayer). This plays it:
// the twist landing at the fire, the people who wrote the name realising it didn't work, the swapper
// walking into the other camp at night and choosing, under everyone's eyes, who leaves; the one picked
// walking into the camp that just voted somebody out. Words only.
import { placeScene, plateKey, VENUES, teamSpot, campSlot } from './steps.js';
import { voicer, P } from './voiced.js';

const bondOf = ep => { const s = ep.gsSnapshot?.bonds || {}; return (a, b) => s[a <= b ? `${a}||${b}` : `${b}||${a}`] ?? 0; };

/** The steps after the vote is read. ctx: { ep, host, venue } */
export function swapNight({ ep, host, venue }) {
  const { swapper: S, fromTribe: F, toTribe: T, pickedPlayer: K } = ep.swapResult || {};
  if (!S || !T) return [];
  const V = voicer(`swap|${ep.num}`);
  const bond = bondOf(ep);
  const steps = [];
  const say = (by, text, focus = [by], extra = {}) => steps.push({ k: 'say', by, text, focus, ...extra });
  const hostSay = (text, focus = [], extra = {}) => steps.push({ k: 'say', by: host, host: true, text, focus, ...extra });
  const beat = (text, focus = [], extra = {}) => steps.push({ k: 'beat', text, focus, ...extra });
  const conf = (by, text) => steps.push({ k: 'conf', by, text });
  const sp = P(S);

  // who wrote the name, who led it, who stood by them
  const log = ep.votingLog || [];
  const voters = log.filter(v => v.voted === S && v.voter !== S).map(v => v.voter);
  const lead = (ep.tribalStory?.booth || []).find(b => b.role === 'lead' && b.voted === S)?.voter || voters[0] || null;
  const tribal = (ep.tribalPlayers || []).filter(n => n !== S);
  const friend = tribal.filter(n => !voters.includes(n)).sort((x, y) => bond(S, y) - bond(S, x))[0] || null;
  // the team they walk into, as it was before they arrived
  const after = (ep.gsSnapshot?.tribes || []).find(t => t.name === T)?.members || [];
  const dest = [...new Set([...after.filter(n => n !== S), ...(K ? [K] : [])])];
  const others = dest.filter(n => n !== K);
  const kFriend = K ? others.slice().sort((x, y) => bond(K, y) - bond(K, x))[0] : null;
  const pleader = others.filter(n => n !== kFriend).sort((x, y) => bond(S, y) - bond(S, x))[0] || null;

  // ── at the fire: the twist lands ──
  hostSay(`${S}, before you grab your torch... I've got some news.`, [S]);
  beat(`Nobody moves.`, tribal.slice(0, 4), { tense: true });
  hostSay(`You're not going home tonight.`, [S], { tense: true });
  beat(`A gasp goes around the fire.`, [S, ...voters.slice(0, 3)]);
  say(S, V(S, {
    sharp: [`I'm sorry. Say that again.`, `...You're serious.`], loud: [`WAIT. WHAT?!`, `No way. NO WAY!`],
    soft: [`What? I... what?`, `Oh my gosh. Are you serious?`], dry: [`I'm going to need you to explain that.`, `Huh. Okay. That's new.`],
    odd: [`I knew it! I didn't know it. But I knew it!`, `Is this a dream? Somebody pinch me. Not hard.`], any: [`What?`],
  }, 'shock'), [S], { shock: true });
  if (lead) say(lead, V(lead, {
    sharp: [`You've got to be kidding me.`, `That's not how this works.`], loud: [`Are you serious right now?!`, `That's not fair!`],
    soft: [`Oh no.`, `Oh, this is bad.`], dry: [`Of course.`, `Great. Love that.`], odd: [`Plot twist!`, `I did not see that coming. At all.`], any: [`You're kidding.`],
  }, 'lead'), [lead]);
  hostSay(`This is an Elimination Swap. ${S}, you're moving to ${T}. Tonight, you walk into their camp, and you pick one of them to come here and take your place.`, [S]);
  steps.push({ k: 'title', kicker: 'Elimination Swap', name: `${S} joins ${T}`, faces: [S, ...(K ? [K] : [])], tone: 'fire' });
  if (lead) {
    say(S, V(S, {
      sharp: [`${lead}. You wrote my name. I want you to know I'll remember that.`, `Enjoy the rest of your night, ${lead}. I know I will.`],
      loud: [`${lead}, I know it was you! And guess what? I'm still here!`, `${lead}! You and me, we're not done!`],
      soft: [`I trusted some of you. I really did. That's the part that hurts.`, `${lead}... I thought we were okay.`],
      dry: [`Well. That was awkward for everybody.`, `${lead}, I'd say no hard feelings, but I'd be lying.`],
      odd: [`Bye, everybody! I'll write! I won't write.`, `${lead}, I'm going to think about you every time I eat. Not in a good way.`],
      any: [`${lead}. I'll remember this.`],
    }, 'confront'), [S, lead]);
    say(lead, V(lead, {
      sharp: [`Enjoy your new team.`, `It was a vote, ${S}. Don't make it a vendetta.`], loud: [`It wasn't personal!`, `Hey, it was the numbers, okay?!`],
      soft: [`I'm sorry. It was just the numbers. I swear.`, `I didn't want to. I hope you know that.`], dry: [`Good luck over there.`, `It was nice knowing you. Briefly.`],
      odd: [`Send us a postcard!`, `Don't forget us! Actually, maybe forget us.`], any: [`Good luck over there.`],
    }, 'lead-back'), [lead, S]);
  }
  if (friend) {
    beat(`${friend} gets up and hugs ${S} before ${sp.sub} can leave.`, [friend, S]);
    say(friend, V(friend, {
      soft: [`This is so unfair. I'll see you at the merge, okay?`], loud: [`This is garbage! You're still with me, okay?`], sharp: [`Go over there and win. Then come back for them.`],
      dry: [`See you at the merge. Don't make friends without me.`], odd: [`I'll miss you! I'll name a coconut after you!`], any: [`I'll see you at the merge.`],
    }, 'friend'), [friend, S]);
    say(S, V(S, { any: [`Count on it.`], soft: [`I'm counting on it.`], loud: [`You'd better!`] }, 'friend-back'), [S, friend]);
  }

  // ── the other camp, that night: the choice ──
  const Vn = VENUES[venue] || VENUES['hosted-camp'];
  const slot = campSlot(ep, T, venue);
  const key = plateKey(venue, teamSpot(venue, Vn.public, slot), 'night') || plateKey(venue, Vn.public, 'night');
  if (key && dest.length) {
    const seen = [S, ...dest].slice(0, 9);
    steps.push({ k: 'scene', spot: Vn.public, tod: 'night', plate: key, place: `${T} Camp`, time: '10:30 PM', card: false, cut: true, focus: [S], bg: [], places: placeScene(key, seen, []), act: { kind: 'arrive', who: [S] } });
    beat(`${T} is still awake when ${S} walks into their camp with a torch.`, [S, ...dest.slice(0, 3)], { tense: true });
    const asker = pleader || others[0] || K;
    if (asker) say(asker, V(asker, {
      sharp: [`What are you doing here?`, `Shouldn't you be on a boat right now?`], loud: [`Whoa! What are YOU doing here?!`], soft: [`Oh! Are you okay? What happened?`],
      dry: [`That's not where the boat is.`], odd: [`Are you a ghost? Blink twice if you're a ghost.`], any: [`What are you doing here?`],
    }, 'ask'), [asker, S]);
    say(S, V(S, {
      sharp: [`I got voted out. Except I didn't. I'm on your team now, and one of you is going over there.`],
      loud: [`Long story! I got voted out, but I'm not out! I'm on your team! And one of you has to go over there!`],
      soft: [`I got voted out, but there's a twist. I'm on your team now. And... I have to send one of you to my old team. I'm sorry.`],
      dry: [`Short version: I'm on your team now, and one of you isn't.`],
      odd: [`Surprise! I'm your new teammate! The bad news is, one of you is my old teammate now.`],
      any: [`I'm on your team now. And one of you has to go to mine.`],
    }, 'explain'), [S, ...dest.slice(0, 3)]);
    beat(`Nobody says anything for a second. Then everybody starts talking at once.`, dest.slice(0, 4));
    if (pleader) say(pleader, V(pleader, {
      sharp: [`You'll want me here. I'm the one who actually knows how this team works.`], loud: [`Don't pick me! I win challenges! You need me!`],
      soft: [`Please don't pick me. I just started to feel like I belong here.`], dry: [`Before you decide, I'd like to point out I'm very useful.`],
      odd: [`Pick me! No, wait, don't pick me. I panicked.`], any: [`Please don't pick me.`],
    }, 'plead'), [pleader, S]);
    beat(`${S} looks at every one of them, one at a time.`, [S, ...dest.slice(0, 4)], { tense: true });
    if (K) {
      const why = bond(S, K) < 0 ? 'enemy' : 'stranger';
      say(S, why === 'enemy' ? V(S, {
        sharp: [`${K}. We both know why.`], loud: [`${K}. Sorry, not sorry.`], soft: [`${K}. I'm sorry. We just never got along.`],
        dry: [`${K}. I think you saw that coming.`], odd: [`${K}! It's you! Don't be mad. Be a little mad.`], any: [`${K}. It's you.`],
      }, 'pick') : V(S, {
        sharp: [`${K}. I don't know you, and tonight that makes it easy.`], loud: [`${K}. Sorry! I don't know you! That's literally it!`],
        soft: [`${K}. I'm so sorry. I don't know you yet, and I had to pick somebody.`], dry: [`${K}. Nothing personal. I just don't know you.`],
        odd: [`${K}. I closed my eyes and pointed. Well, not really. But that's how it felt.`], any: [`${K}. It's you.`],
      }, 'pick'), [S, K], { tense: true });
      say(K, V(K, {
        sharp: [`Seriously? You've been here five minutes.`], loud: [`ME?! Why me?!`], soft: [`...Okay. Okay. I'll go.`],
        dry: [`Of course it's me.`], odd: [`Do I at least get to keep my bed? No? Okay.`], any: [`Me? Really?`],
      }, 'picked'), [K], { shock: true });
      if (kFriend) {
        say(kFriend, V(kFriend, {
          sharp: [`You can't just walk in here and do that.`], loud: [`That's not fair! You don't even know us!`], soft: [`No... ${K}, I'm so sorry.`],
          dry: [`Welcome to the team. Great first impression.`], odd: [`I hate this twist. I hate it with my whole body.`], any: [`That's not fair.`],
        }, 'kfriend'), [kFriend, S]);
        say(S, V(S, { any: [`I didn't make the rules. I just had to follow them.`], sharp: [`Take it up with the host. I just played the card I was dealt.`], soft: [`I know. I'm sorry. I really am.`] }, 'rules'), [S, kFriend]);
      }
      beat(`${K} picks up ${P(K).posAdj} bag and walks out into the dark, toward ${F}.`, [K], { act: { kind: 'depart', who: [K] } });
      // the camp that just voted somebody out
      const fslot = campSlot(ep, F, venue);
      const fkey = plateKey(venue, teamSpot(venue, Vn.public, fslot), 'night') || key;
      const home = tribal.slice(0, 6);
      steps.push({ k: 'scene', spot: Vn.public, tod: 'night', plate: fkey, place: `${F} Camp`, time: '11:00 PM', card: false, cut: true, focus: [K], bg: [], places: placeScene(fkey, [K, ...home].slice(0, 9), []), act: { kind: 'arrive', who: [K] } });
      say(K, V(K, {
        sharp: [`So. I'm your new teammate. Try to contain your excitement.`], loud: [`Hi! Apparently I live here now!`], soft: [`Hi... so, I guess I'm on your team now.`],
        dry: [`Hello. I'm the replacement.`], odd: [`Greetings, new family!`], any: [`Hi. I'm on your team now.`],
      }, 'arrive'), [K, ...home.slice(0, 3)]);
      const greeter = lead || home[0];
      if (greeter) {
        say(greeter, V(greeter, {
          sharp: [`Welcome. Fair warning: we just voted out the person you replaced.`], loud: [`Welcome! So, uh, we kind of just voted out the person who picked you.`],
          soft: [`Welcome. We're... still processing tonight, sorry.`], dry: [`Welcome. Don't take the vibe personally.`], odd: [`Welcome! Nobody here is weird. Except all of us.`], any: [`Welcome.`],
        }, 'greet'), [greeter, K]);
        say(K, V(K, { any: [`Yeah. I heard. That's really comforting.`], sharp: [`I heard. I'll be watching my back.`], soft: [`Oh. Okay. Good to know.`], loud: [`Yeah, I heard! Great start!`] }, 'greet-back'), [K, greeter]);
      }
      conf(K, V(K, {
        sharp: [`This morning I was safe. Tonight I'm on a team that votes people out the second they get comfortable. I'll adjust.`],
        loud: [`I didn't do anything! I was just sitting there! And now I'm over here!`],
        soft: [`I didn't even get to say goodbye properly. I just have to start over.`],
        dry: [`${S} picked me because ${sp.sub} didn't know me. That's the worst reason I've ever been picked for anything.`],
        odd: [`New team, new me. Same me, actually. But in a new place.`],
        any: [`I have to start over from nothing.`],
      }, 'k-conf'));
    }
  }
  conf(S, V(S, {
    sharp: [`They voted me out, and I'm still in the game. Every single one of them is going to regret that.`],
    loud: [`I got voted out and I'm STILL HERE! Somebody up there likes me!`],
    soft: [`I got a second chance tonight. I'm not wasting it.`],
    dry: [`I got voted out tonight, and somehow I'm still here. ${lead || 'Some people'} must be thrilled.`],
    odd: [`Voted out and voted back in, kind of, in one night. I need a nap.`],
    any: [`I got voted out and I'm still here.`],
  }, 's-conf'));
  if (lead) conf(lead, V(lead, {
    sharp: [`We got rid of ${S}, and ${S} got rid of nobody. Now ${sp.sub}'s on the other team, and ${sp.sub} remember${sp.s} everything.`],
    loud: [`We did everything right and it didn't even matter! ${S} is still in this!`],
    soft: [`I feel sick. ${S} is going to hate me now, and ${sp.sub}'s still in the game.`],
    dry: [`We voted ${S} out. ${S} is still here. I'm not sure what we accomplished.`],
    odd: [`We voted ${S} off and ${sp.sub} came back like a boomerang. A very angry boomerang.`],
    any: [`${S} is still in the game. That's bad for me.`],
  }, 'lead-conf'));
  return steps;
}
