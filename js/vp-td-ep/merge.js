// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/merge.js — the merge, as the day two teams become one
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-10, on a merge that aired as the host's two lines and two short exchanges: "the merge
// too". This plays the day from the record: the two teams walking in from opposite sides, the host's
// news and what changes from here, old friends the teams split up finding each other again, two people
// who never got along now sharing a camp, somebody sizing up the biggest challenge threat, the strongest
// alliance counting its votes and eyeing a swing vote, the ones with no alliance looking for a lifeline,
// and the confessionals at the end of it. Every line in the speaker's voice. Words only.
import { voicer, P, listOf } from './voiced.js';

const bondOf = ep => { const s = ep.gsSnapshot?.bonds || {}; return (a, b) => s[a <= b ? `${a}||${b}` : `${b}||${a}`] ?? 0; };

/** steps after the merge's scene card. ctx: { ep, m (mergeData), host, places (who is on the set) } */
export function mergeDay({ ep, m, host, places }) {
  const V = voicer(`merge|${ep.num}`);
  const bond = bondOf(ep);
  const steps = [];
  const here = n => !!places[n];
  const say = (by, text, focus = [by], extra = {}) => { if (here(by)) steps.push({ k: 'say', by, text, focus: focus.filter(here), ...extra }); };
  const hostSay = (text, extra = {}) => steps.push({ k: 'say', by: host, host: true, text, focus: [], ...extra });
  const beat = (text, focus = [], extra = {}) => steps.push({ k: 'beat', text, focus: focus.filter(here), ...extra });
  const conf = (by, text) => steps.push({ k: 'conf', by, text });
  const all = (m.participants || []).filter(here);
  const hist = globalThis.gs?.episodeHistory || [];
  const prev = hist.find(h => h.num === ep.num - 1);
  const teams = (prev?.gsSnapshot?.tribes || prev?.tribesAtStart || []).filter(t => (t.members || []).some(n => all.includes(n)));
  const teamOf = n => teams.find(t => (t.members || []).includes(n))?.name || null;
  const wins = n => globalThis.gs?.chalRecord?.[n]?.wins || 0;
  const cross = [];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (teamOf(all[i]) && teamOf(all[j]) && teamOf(all[i]) !== teamOf(all[j])) cross.push([all[i], all[j], bond(all[i], all[j])]);

  // ── the news ──
  if (teams.length >= 2) beat(`${listOf(teams.map(t => t.name))} walk into camp from opposite sides. Some of them haven't seen each other since day one.`, all.slice(0, 6), { tense: true });
  hostSay(`Drop your buffs. From now on, you're one tribe.`);
  steps.push({ k: 'title', kicker: 'The merge', name: m.name || 'One tribe', faces: all.slice(0, 8),
    side: [{ tab: 'log', text: `${all.length} players: ${all.join(', ')}` }, ...(m.alliances || []).map(a => ({ tab: 'allies', name: a.name, who: a.members })),
      ...((m.bottom || []).length ? [{ tab: 'secrets', text: `On the bottom, with no alliance: ${m.bottom.join(', ')}` }] : [])] });
  hostSay(`${all.length} of you left. No more teams to hide behind, no more winning as a group. From here on, it's every player for themselves.`);
  hostSay(`And from now on, if you get voted out, you don't just go home. You sit on the jury and help decide who wins.`, { tense: true });
  beat(`Everybody looks around at everybody else.`, all.slice(0, 6));

  // ── reunions across the old line ──
  const reunion = cross.filter(x => x[2] >= 3).sort((x, y) => y[2] - x[2])[0];
  if (reunion) {
    const [a, b] = reunion;
    beat(`${a} spots ${b} across the camp and runs over.`, [a, b], { act: { kind: 'lean', who: [a, b] } });
    say(a, V(a, {
      soft: [`I missed you so much! You have no idea!`], loud: [`FINALLY! Get over here!`], sharp: [`Took them long enough to put us back together.`],
      dry: [`Oh, good. Someone here I actually like.`], odd: [`My long-lost friend! We meet again!`], any: [`It's so good to see you.`],
    }, 'reunion1'), [a, b]);
    say(b, V(b, {
      soft: [`Me too. It's been so weird without you.`], loud: [`I know! It's been forever!`], sharp: [`We're going to be very dangerous together. You know that, right?`],
      dry: [`You have no idea how boring my team was.`], odd: [`I wrote you letters. I didn't send them. But I wrote them.`], any: [`I missed you too.`],
    }, 'reunion2'), [b, a]);
    say(a, V(a, { any: [`We need to talk. Later. Not here.`], loud: [`Okay, we need to talk. Like, now. But quietly.`], dry: [`Later. Too many ears.`] }, 'reunion3'), [a, b]);
    const watcher = all.filter(n => n !== a && n !== b).sort((x, y) => bond(x, a) - bond(x, b))[0];
    if (watcher) {
      beat(`${watcher} watches them hug, and doesn't smile.`, [watcher]);
      conf(watcher, V(watcher, {
        sharp: [`${a} and ${b}, back together. That's a pair, and pairs go first.`], loud: [`${a} and ${b} are already glued together. That's a problem!`],
        soft: [`${a} and ${b} are so cute together. And that's exactly why they're scary.`], dry: [`A reunion. How sweet. How dangerous.`],
        odd: [`${a} and ${b} are a team now. A team of two. Within a team. Of everyone.`], any: [`${a} and ${b} are a pair. That's a threat.`],
      }, 'watch'));
    }
  }

  // ── two who never got along ──
  const rivals = cross.filter(x => x[2] <= -2).sort((x, y) => x[2] - y[2])[0] || null;
  const sameRival = !rivals ? all.flatMap((a, i) => all.slice(i + 1).map(b => [a, b, bond(a, b)])).filter(x => x[2] <= -3).sort((x, y) => x[2] - y[2])[0] : null;
  const rv = rivals || sameRival;
  if (rv) {
    const [a, b] = rv;
    beat(`${a} and ${b} end up reaching for the same water jug.`, [a, b], { tense: true });
    say(a, V(a, {
      sharp: [`Oh. It's you. I'd almost forgotten you were still here.`], loud: [`Great. Of all the people.`], soft: [`Oh... hi.`],
      dry: [`Wow. The merge really brings everybody together.`], odd: [`We meet again, my nemesis.`], any: [`It's you.`],
    }, 'rival1'), [a, b]);
    say(b, V(b, {
      sharp: [`Don't worry. I didn't forget about you.`], loud: [`Don't start with me today.`], soft: [`Can we just... not? Not today?`],
      dry: [`Lovely to see you too.`], odd: [`I'm going to pretend you're a tree.`], any: [`Don't start.`],
    }, 'rival2'), [b, a]);
    say(a, V(a, { any: [`I'm not starting anything. Yet.`], sharp: [`I don't start things. I finish them.`], loud: [`Oh, I'm not starting. You'll know when I start.`], soft: [`Fine. Okay. Fine.`] }, 'rival3'), [a, b]);
    beat(`The people around them go very quiet.`, all.filter(n => n !== a && n !== b).slice(0, 3));
  }

  // ── sizing up the threat ──
  const threat = [...all].sort((x, y) => wins(y) - wins(x))[0];
  if (threat && wins(threat) >= 2) {
    const sizers = all.filter(n => n !== threat && teamOf(n) && teamOf(n) !== teamOf(threat)).slice(0, 2);
    if (sizers.length === 2) {
      const [s1, s2] = sizers;
      say(s1, `Look at ${threat}. ${P(threat).Sub} won ${wins(threat) === 2 ? 'two' : wins(threat) === 3 ? 'three' : 'a lot of'} challenges for that team.`, [s1, s2, threat]);
      say(s2, V(s2, {
        sharp: [`Then ${threat} doesn't win the next one. Simple.`], loud: [`If ${threat} wins immunity now, we're all in trouble!`], soft: [`That's scary. What do we do about that?`],
        dry: [`So we vote ${P(threat).obj} out the first chance we get. Got it.`], odd: [`Can we hide ${threat}'s shoes? That's legal, right?`], any: [`Then we need to get ${P(threat).obj} out early.`],
      }, 'threat'), [s2, s1]);
      conf(threat, V(threat, {
        sharp: [`Everybody's looking at me like I'm the problem. Good. Let them look.`], loud: [`I know there's a target on me. I'll just have to keep winning.`],
        soft: [`I can feel everyone staring at me. I just want them to know I'm not a bad person.`], dry: [`Apparently winning challenges makes you unpopular. Who knew.`],
        odd: [`I'm the most wanted person here. I've never been the most wanted anything.`], any: [`I know I've got a target on my back.`],
      }, 'threat-conf'));
    }
  }

  // ── the strongest alliance counts its votes ──
  const top = (m.alliances || []).find(a => (a.members || []).filter(here).length >= 2);
  if (top) {
    const mem = top.members.filter(here);
    const [l1, l2] = mem;
    const swing = (m.bottom || []).find(n => here(n) && !mem.includes(n)) || all.find(n => !mem.includes(n));
    beat(`${top.name ? `${top.name}` : `${l1} and ${l2}`} slip away to the edge of camp.`, mem.slice(0, 3));
    say(l1, V(l1, {
      sharp: [`Count with me. There are ${mem.length} of us. That's not enough on its own.`], loud: [`Okay! If we stick together, we run this place!`],
      soft: [`As long as we stay together, we'll be okay. Right?`], dry: [`We have ${mem.length}. We need more.`], odd: [`Team meeting! Very secret! Shh!`], any: [`We need more numbers.`],
    }, 'ally1'), mem.slice(0, 3));
    if (swing) {
      say(l2, V(l2, {
        sharp: [`What about ${swing}? Nobody's claimed ${P(swing).obj} yet.`], loud: [`What about ${swing}? ${swing}'s on nobody's side!`], soft: [`Maybe ${swing}? ${P(swing).Sub} seem${P(swing).s} lonely.`],
        dry: [`${swing}. Nobody's talking to ${P(swing).obj}. That's an opening.`], odd: [`${swing}! I like ${swing}. ${swing} has good energy.`], any: [`What about ${swing}?`],
      }, 'ally2'), [l2, l1]);
      say(l1, V(l1, { any: [`Talk to ${swing} tonight. Before anybody else does.`], soft: [`Okay. Let's be nice to ${swing}. Really nice.`], loud: [`Yes! Go get ${swing}!`] }, 'ally3'), [l1, l2]);
      conf(swing, V(swing, {
        sharp: [`I've got no alliance and suddenly everybody wants to be my friend. Funny how that works.`], loud: [`I'm on my own, and honestly? That might be the best place to be right now.`],
        soft: [`I don't really have anyone out here. I just hope somebody wants me.`], dry: [`I'm the swing vote. I've never been this popular.`],
        odd: [`I'm a free agent! Like a basketball player. But worse at basketball.`], any: [`I'm on my own right now. That could go either way.`],
      }, 'swing'));
    }
  }

  // ── the bottom looks for a lifeline ──
  const low = (m.bottom || []).filter(here).slice(0, 2);
  if (low.length === 2) {
    const [b1, b2] = low;
    say(b1, V(b1, {
      sharp: [`They think we're the easy votes. Let's make them wrong.`], loud: [`We're on the bottom. I hate it. I really hate it.`], soft: [`I think we're on the outside. Both of us.`],
      dry: [`So. We're the ones nobody wanted. Cool.`], odd: [`Welcome to the bottom! Population: us.`], any: [`I think we're on the bottom.`],
    }, 'low1'), [b1, b2]);
    say(b2, V(b2, {
      sharp: [`Then we give them somebody bigger to look at.`], loud: [`Then we fight! Two votes is still two votes!`], soft: [`Then we stick together. At least we have each other.`],
      dry: [`The bottom's quiet. Nobody watches the bottom.`], odd: [`Then we become the top. From below. Somehow.`], any: [`Then we stick together.`],
    }, 'low2'), [b2, b1]);
  }

  // ── the end of the first day as one tribe ──
  const confident = (top?.members || []).find(here);
  if (confident) conf(confident, V(confident, {
    sharp: [`Everybody here thinks they have a plan. I'm the only one whose plan is going to work.`], loud: [`We've got the numbers. Let's go!`],
    soft: [`I'm scared, but I've got good people with me. I think we'll be okay.`], dry: [`The merge is where the real game starts. Fine by me.`],
    odd: [`Today I made a new tribe and lost an old one. Emotionally, I'm a buffet.`], any: [`I like where I stand.`],
  }, 'conf-top'));
  return steps;
}
