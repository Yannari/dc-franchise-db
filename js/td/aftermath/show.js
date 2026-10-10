// ══════════════════════════════════════════════════════════════════════
// td/aftermath/show.js — the Total Drama Aftermath, written as the show is
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-10, with the TDA Aftermath transcript: "we want something this level", on the
// show's own sets (the main lounge, the interview couch, the Peanut Gallery's couches, the doorway
// the guests walk in through, the green room backstage). The show is hosted by two famous alumni
// (hosts.js), not the main host, and it runs the way the real one does:
//
//   the open (the hosts' banter, a heckle from the gallery) · the Peanut Gallery roll call · for each
//   guest: sometimes a peek at them backstage, a clip package of their season, a joke bio, the
//   walk-in, the interview (a jab at the hosts, the vote, a host letting slip what the guest never
//   knew, the gallery cutting in, one question from the viewers), Truth or Hammer for the guests with
//   something to hide · "Team X or Team Y", the debate that turns into the hosts' own argument · a
//   word from the sponsor · That's Gonna Leave a Mark · the fans · the sign-off.
//
// Everything said is true of the record: who voted for whom, the bonds, the challenge scores, the
// showmances, the secrets the engine's Truth-or-Anvil found (aftermath.js decides who lies). Nobody
// names a betrayal before it is out: a guest learns who voted them out when a host lets it slip, and
// only from then on can they bring it up (gs.aftermathKnown). The words are this module's; the
// decisions are the engine's, and the consequences are applied here once, when the show is built.
//
// Every line comes in the five ways people talk (td/story/voice-family.js: sharp, dry, loud, soft,
// odd), and each speaker, guest or host, says it their own way. A slot never gives the same line
// twice in a season (gs.aftermathLines). Pre-rendered strings only.
import { gs, seasonConfig, players } from '../../core.js';
import { getBond, addBond } from '../../bonds.js';
import { pronouns } from '../../players.js';
import { familyOf } from '../story/voice-family.js';
import { pickAftermathHosts } from './hosts.js';

const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const num = n => WORD[n] || String(n);
const Cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const list = a => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const MEAN = new Set(['villain', 'mastermind', 'schemer']);
const rosterRow = n => players.find(p => p.name === n) || ((typeof globalThis !== 'undefined' && Array.isArray(globalThis.FRANCHISE_ROSTER)) ? globalThis.FRANCHISE_ROSTER.find(p => p?.name === n) : null) || null;
const niceness = n => { const a = rosterRow(n)?.archetype; return (NICE.has(a) ? 1 : 0) - (MEAN.has(a) ? 1 : 0); };

// viewers who write in: usernames, never a real name
const HANDLES = ['MarshmallowQueen77', 'Gluepunks350', 'IslandWatcher22', 'CampfireKid09', 'LoserBoatFan', 'DramaLlama4Life', 'SnowGirl88', 'ChallengeNerd101', 'NoSleepTilFinale', 'ConfessionalCam', 'TeamUnderdog12', 'SuperfanSam'];
// the sponsor, read by the show's co-host
const SPONSOR = [
  w => `This episode of the Aftermath is brought to you by ${w}'s Roadkill Café, where Sundays are bring your own meat. You hit it, we cook it.`,
  w => `This Aftermath is brought to you by ${w}'s Survival Snacks. Guaranteed to keep you alive. Mostly.`,
  w => `This segment is brought to you by ${w}'s Boot Camp for Toddlers. Drop and give me twenty, sweetie. Now!`,
  w => `This Aftermath is brought to you by ${w}'s Mystery Meat Hut, where every meal is a surprise, even to the kitchen.`,
  w => `This episode is brought to you by ${w}'s Discount Dentistry. If it still hurts, you're not biting hard enough.`,
  w => `This Aftermath is brought to you by ${w}'s Laundry Service. We wash it, we fold it, we lose one sock. Every time.`,
];

/**
 * Builds the show into ep.aftermath.show = { hosts, blocks } and applies its consequences.
 * A block is one shot on one set: { set, seats: { name: slot }, title?, shot?, clip?, lines: [{ by, text } | { beat, act?, applause?, tense? }] }.
 */
export function buildAftermathShow(ep, a) {
  if (!a || a.show) return a?.show || null;
  const hist = gs.episodeHistory || [];
  const cast = [...new Set([...(gs.activePlayers || []), ...(gs.eliminated || []), ...hist.flatMap(h => [h.eliminated, h.firstEliminated]).filter(Boolean), ...players.map(p => p.name)])];
  if (!gs.aftermathHosts?.length) gs.aftermathHosts = pickAftermathHosts(cast, seasonConfig?.name || 'season');
  const [HA, HB] = gs.aftermathHosts.map(h => h.name);
  if (!HA || !HB) return null;
  const credit = n => gs.aftermathHosts.find(h => h.name === n)?.credit || null;
  const host = seasonConfig?.host || 'Chris';
  const chef = seasonConfig?.cohostName || 'Chef';
  const key = `am|${ep.num}|${a.number}`;
  const fam = n => { try { return familyOf(n) || 'plain'; } catch { return 'plain'; } };
  // the season's memory of which line each slot has given, so nobody hears the same one twice
  const mem = new Set(gs.aftermathLines || []);
  // (a slot that has given every line starts over, never with the one it gave last)
  const last = gs.aftermathLast || (gs.aftermathLast = {});
  const choose = (opts, slot) => {
    const n = opts.length, s = hash(`${key}|${slot}`) % n;
    let free = [...Array(n).keys()].filter(j => !mem.has(`${slot}#${j}`));
    if (!free.length) { for (let j = 0; j < n; j++) mem.delete(`${slot}#${j}`); free = [...Array(n).keys()].filter(j => n === 1 || j !== last[slot]); }
    const j = free.includes(s) ? s : free[s % free.length];
    mem.add(`${slot}#${j}`); last[slot] = j;
    return opts[j];
  };
  // a line in the speaker's own way: { sharp, dry, loud, soft, odd, any } → their family's lines
  const V = (n, tag, o) => { const f = fam(n); const k = o[f] ? f : o.any ? 'any' : Object.keys(o)[0]; return choose(o[k], `${tag}|${k}`); };
  const pick = (opts, slot) => choose(opts, slot);
  const pr = n => pronouns(n);
  const has = n => (pr(n).sub === 'they' ? 'have' : 'has');
  const is = n => (pr(n).sub === 'they' ? 'are' : 'is');
  const bond = (x, y) => getBond(x, y);
  const pop = n => gs.popularity?.[n] || 0;
  if (!gs.popularity) gs.popularity = {};
  // who knows who voted them out, and who it was (a host let it slip, at this Aftermath or an earlier one)
  const known = (gs.aftermathKnown && !Array.isArray(gs.aftermathKnown)) ? gs.aftermathKnown : (gs.aftermathKnown = {});

  const blocks = [];
  let B = null;
  const shot = (set, seats = {}, extra = {}) => { B = { set, seats, lines: [], ...extra }; blocks.push(B); return B; };
  const say = (by, text, extra = {}) => { if (by && text) B.lines.push({ by, text, ...extra }); };
  const beat = (text, extra = {}) => { if (text) B.lines.push({ beat: text, ...extra }); };

  // who is on the couches: everyone already interviewed, growing as the night goes on
  const gallery = [...new Set(a.peanutGallery || [])];
  const wideSeats = (guest = null) => {
    const s = { [HA]: 'hA', [HB]: 'hB' };
    if (guest) s[guest] = 'g';
    gallery.filter(n => n !== guest).slice(-4).forEach((n, i) => { s[n] = ['L0', 'L1', 'R0', 'R1'][i]; });
    return s;
  };
  const gallerySeats = (front = []) => {
    const s = {};
    const order = [...front.filter(n => gallery.includes(n)), ...gallery.filter(n => !front.includes(n))];
    order.slice(0, 8).forEach((n, i) => { s[n] = `G${i}`; });
    return s;
  };

  // ── the facts of each guest's game ──
  const elimOf = n => hist.find(h => h.eliminated === n || h.firstEliminated === n || h.tiedDestinies?.eliminatedPartner === n || h.ambassadorData?.ambassadorEliminated === n) || null;
  const firstElimNum = Math.min(...hist.filter(h => h.eliminated || h.firstEliminated).map(h => h.num), 999);
  const camps = h => Object.entries(h?.campStory || {}).flatMap(([camp, c]) => [...(c.pre || []), ...(c.post || [])].map(x => (x && x.kind ? { ...x, camp, ep: h.num } : null))).filter(Boolean);
  const factsOf = n => {
    const e = elimOf(n);
    const voters = (e?.votingLog || []).filter(v => v.voted === n).map(v => v.voter).filter(v => v && v !== n);
    const how = e?.tiedDestinies?.eliminatedPartner === n ? 'tied' : e?.ambassadorData?.ambassadorEliminated === n && e.eliminated !== n ? 'ambassador' : voters.length ? 'vote' : 'other';
    // the friend who voted them out: a voter they trusted
    const traitor = voters.filter(v => bond(n, v) >= 2.5).sort((x, y) => bond(n, y) - bond(n, x))[0] || null;
    const wins = gs.chalRecord?.[n]?.wins || 0;
    const sm = (gs.showmances || []).find(s => (s.players || []).includes(n));
    const partner = sm ? sm.players.find(p => p !== n) : null;
    const brokeUp = !!(sm && (sm.breakupEp || sm.phase === 'broken-up'));
    const idol = hist.some(h => (h.idolPlays || []).some(p => p.player === n));
    const alliance = (gs.namedAlliances || []).find(x => (x.members || []).includes(n))?.name || null;
    const others = cast.filter(x => x !== n);
    const rival = others.slice().sort((x, y) => bond(n, x) - bond(n, y))[0];
    const friend = others.slice().sort((x, y) => bond(n, y) - bond(n, x))[0];
    const days = e ? e.num : null;
    // where we last saw them, for the clip package: a challenge they starred in, a camp scene, the vote
    let star = null;
    for (const h of hist) {
      if (e && h.num > e.num) break;
      const sc = h.chalMemberScores || {};
      const ranked = Object.keys(sc).sort((p, q) => (sc[q] || 0) - (sc[p] || 0));
      if (ranked[0] === n) star = { ep: h.num, chal: true, players: [n], label: h.challengeLabel || null };
    }
    const scenes = hist.filter(h => !e || h.num <= e.num).flatMap(camps).filter(x => (x.players || []).includes(n));
    const best = (partner && scenes.find(x => /romance|spark|showmance|flirt/.test(x.kind) && x.players.includes(partner))) || scenes.find(x => /ally|alliance/.test(x.kind)) || scenes[Math.floor(scenes.length / 2)] || null;
    const first = scenes[0] || null;
    const shotOf = x => (x ? { ep: x.ep, players: x.players.filter(Boolean).slice(0, 3), spot: x.scene?.spot?.id || null, camp: x.camp } : null);
    const bootShot = e ? { ep: e.num, tribal: true, players: [n, ...voters.slice(0, 2)] } : null;
    return { n, e, voters, votes: voters.length, how, traitor, wins, partner, brokeUp, idol, alliance, rival, friend, days, star,
      firstShot: shotOf(first), campShot: shotOf(best), bootShot, firstOut: !!e && e.num === firstElimNum && how === 'vote', pop: pop(n) };
  };
  // how the guest is feeling tonight, from what happened to them
  const moodOf = f => (f.traitor ? 'betrayed' : f.firstOut ? 'first' : f.pop >= 3 ? 'loved' : f.pop <= -2 ? 'booed' : 'fine');

  // ═══ THE OPEN ═══
  const first = (a.number || 1) === 1;
  shot('stage-wide', wideSeats(), { title: { kicker: a.isReunion ? 'Live' : `Aftermath ${a.number || ''}`.trim(), name: a.isReunion ? 'The Reunion' : 'Total Drama Aftermath' } });
  if (a.isReunion) say(HA, V(HA, 'hello-r', {
    loud: [`Welcome to the Total Drama Reunion! Everybody's here, and I mean EVERYBODY!`], soft: [`Hi, everyone! Welcome to the Total Drama Reunion. The whole cast, together again. I might cry.`],
    sharp: [`Welcome to the Reunion. One winner, a lot of losers, and one couch big enough for all of them.`], dry: [`Welcome to the Reunion, where everyone who hated each other sits on the same couch.`],
    odd: [`Welcome to the Reunion! It's like a family dinner, if the family voted each other out!`], any: [`Welcome to the Total Drama Reunion!`],
  }));
  else say(HA, first ? V(HA, 'hello', {
    loud: [`What is up, everybody?! Welcome to the brand-new, totally live Total Drama Aftermath!`],
    soft: [`Hi, everyone! Welcome to the very first Total Drama Aftermath! We're coming to you live, and we're so happy you're here.`],
    sharp: [`Welcome to the Total Drama Aftermath. Yes, it's live. Yes, I'm hosting. Try to keep up.`],
    dry: [`Hello, and welcome to the Total Drama Aftermath, the show where people who lost talk about losing for an hour.`],
    odd: [`Welcome, welcome, welcome to the Total Drama Aftermath! Live! In color! With snacks!`],
    any: [`Welcome to the Total Drama Aftermath! We're coming to you live to dish on everything that's happened out there.`],
  }) : V(HA, 'hello2', {
    loud: [`We're back, baby! Welcome to another Total Drama Aftermath!`, `It's Aftermath time, everybody! Make some noise!`, `Hello again, everybody! The Aftermath is back, and it's louder than ever!`],
    soft: [`Hi, everyone! Welcome back to the Total Drama Aftermath! We missed you.`, `Welcome back to the Aftermath! It's so good to see all of you again.`, `Hi again! Welcome back to the Total Drama Aftermath. Get comfy, it's a big one.`],
    sharp: [`Welcome back to the Total Drama Aftermath. More losers, more drama, same fabulous host.`, `The Aftermath is back. Try to contain yourselves.`, `Welcome back to the Total Drama Aftermath. Somebody has to keep this show watchable.`],
    dry: [`Welcome back to the Total Drama Aftermath. Yes, more people got voted off. That's sort of the format.`, `Hello again. The Aftermath is back, and so are a few more people who lost.`, `Welcome back to the Aftermath, where the couches fill up a little more every time.`],
    odd: [`Guess who's back? Us! Welcome back to the Total Drama Aftermath!`, `The Aftermath is back! I brought a cake! I ate the cake! Welcome!`, `Welcome back to the Aftermath! I missed you all so much I practiced this line in the mirror!`],
    any: [`Welcome back to the Total Drama Aftermath!`],
  }));
  beat(`The audience cheers.`, { applause: 'big' });
  const credLine = n => {
    const c = credit(n);
    return !c ? V(n, 'nocredit', {
      sharp: [`You know me. Everybody knows me.`], soft: [`You might remember me from a few seasons back. Hi again!`], loud: [`You know me! You love me!`],
      dry: [`You might remember me from getting voted off on national television.`], odd: [`You might remember me from the time I was on this show!`], any: [`You might remember me from a few seasons back.`],
    }) : c.winner ? V(n, 'winner', {
      sharp: [`Winner of ${c.season}, in case anyone forgot. They didn't.`], soft: [`I won ${c.season}, which still feels kind of unreal.`], loud: [`Winner of ${c.season}, baby!`],
      dry: [`I won ${c.season}. I'll be bringing that up a lot tonight.`], odd: [`I won ${c.season}! I still have the trophy. I sleep next to it.`], any: [`I won ${c.season}.`],
    }) : c.finalist ? V(n, 'finalist', {
      sharp: [`I made the final of ${c.season}, which is more than anyone on those couches can say.`], soft: [`I made it all the way to the final of ${c.season}! So close.`], loud: [`I made the final of ${c.season}! Almost had it!`],
      dry: [`I came this close to winning ${c.season}. We don't talk about it.`], odd: [`I was a finalist on ${c.season}! I don't remember most of it.`], any: [`I made the final of ${c.season}.`],
    }) : V(n, 'played', {
      sharp: [`You know me from ${c.season}. I was robbed.`], soft: [`You might remember me from ${c.season}!`], loud: [`${c.season}, remember me? Of course you do!`],
      dry: [`You might remember me from ${c.season}, where I did not win.`], odd: [`I was on ${c.season}! It was a whole thing!`], any: [`You might remember me from ${c.season}.`],
    });
  };
  if (first) {
    say(HB, `I'm ${HB}. ${credLine(HB)}`);
    say(HA, `And I'm ${HA}. ${credLine(HA)}`);
    say(HB, V(HB, 'why', {
      loud: [`They asked the fans who they wanted to see again, and here we are, hosting our own show!`],
      soft: [`When they asked us to host, I said yes before they even finished the question.`],
      sharp: [`They needed two people the audience actually likes. So they called me. And ${HA}.`],
      dry: [`The producers called. We had nothing else going on. That's the whole story.`],
      odd: [`They told me there'd be a buffet. There is no buffet. But I'm still here!`],
      any: [`We got our own show, and this is way more fun than getting yelled at by ${host}.`],
    }));
    say(HA, V(HA, 'answer', {
      sharp: [`By "the audience likes," ${HB} means me.`],
      loud: [`Best job ever. No challenges, no ${chef}, and a couch!`],
      soft: [`And we get to hang out with all of you, which is the best part.`],
      dry: [`In fairness, the couch is very nice.`],
      odd: [`I brought my own buffet. It's in my pockets.`],
      any: [`Right. So let's get into it.`],
    }));
  } else {
    say(HB, V(HB, 'back', {
      loud: [`I'm ${HB}, she's ${HA}, and we've got a packed couch tonight!`.replace(/she's/, `${pr(HA).sub === 'she' ? "she's" : pr(HA).sub === 'he' ? "he's" : "they're"}`), `${HA} and ${HB}, back on the couch! Let's do this!`, `We've got new guests, new drama, and the same two hosts you love!`],
      soft: [`I'm ${HB}, and that's ${HA}, and we've got so many people to catch up with tonight.`, `It's so nice to be back. We've got a lot of guests tonight.`, `I'm ${HB}! We have so much to talk about tonight.`],
      sharp: [`I'm ${HB}. ${HA}'s here too. Let's not waste time.`, `I'm ${HB}, and tonight, nobody on that couch is safe.`, `Same hosts, new victims. I'm ${HB}.`],
      dry: [`I'm ${HB}. ${HA}'s here. The couch is fuller than last time. That's the show.`, `I'm ${HB}. We have more guests, which means more people to disappoint.`, `I'm ${HB}, and yes, I'm still doing this.`],
      odd: [`I'm ${HB}! ${HA} is also ${HA}! Wait. You know what I mean.`, `Hi! It's me, ${HB}! And that's ${HA}! Still!`, `I'm ${HB}, and I've been practicing my host face. This is it.`],
      any: [`I'm ${HB}, that's ${HA}, and we've got a lot to get through tonight.`],
    }));
  }
  say(HA, pick([`So, what did everyone think of the season so far?`, `How are we feeling about the season so far?`, `Has this season been crazy, or what?`, `Who's ready to talk about the season?`], 'season'));
  beat(`The audience cheers.`, { applause: 'big' });
  // a heckle from the couches, from whoever is sorest and least shy about it
  const heckler = gallery.filter(n => ['sharp', 'loud', 'dry', 'odd'].includes(fam(n))).sort((x, y) => pop(x) - pop(y))[hash(key) % Math.max(1, Math.min(2, gallery.length))] || null;
  if (heckler) {
    const hd = factsOf(heckler).days || 1;
    say(heckler, V(heckler, 'heckle', {
      sharp: [`Speak for yourselves.`, `Oh, it's been wonderful. For the people still in it.`, `I'd love it more if I were still in it.`],
      loud: [`Yeah, great season! For the ones who didn't get voted off!`, `Boo! I mean, yay! I mean, boo!`, `It'd be better if I was still out there!`],
      dry: [`Loved it. I was there for ${num(hd)} ${hd === 1 ? 'episode' : 'episodes'}.`, `Riveting. Ask me how I'd know.`, `It's been great. From this couch. Where I live now.`],
      odd: [`I liked the part where I was in it!`, `I give it a seven! Out of a hundred!`, `I watched every episode twice! Mostly mine!`],
    }));
    say(HB, V(HB, 'heckled', {
      sharp: [`Noted, ${heckler}. Nobody asked.`, `Thank you, ${heckler}. Moving on.`, `Somebody's still bitter. Hi, ${heckler}.`],
      dry: [`Thank you for that review, ${heckler}.`, `We'll put that on the poster, ${heckler}.`, `Great feedback, ${heckler}. Truly.`],
      loud: [`Ha! Glad you're here too, ${heckler}! Give it up for ${heckler}, everybody!`, `That's the spirit, ${heckler}! Sort of!`, `${heckler}, everybody! Still fired up!`],
      soft: [`Aw, glad you're still here with us, ${heckler}! Everybody, ${heckler}!`, `We love you anyway, ${heckler}!`, `Aw. Big hug, ${heckler}.`],
      odd: [`We love a critic! ${heckler}, everybody!`, `${heckler} has spoken!`, `Write that down! ${heckler} said it!`],
      any: [`Thanks for reminding us you're here, ${heckler}. ${heckler}, everybody!`],
    }));
    beat(`Scattered applause for ${heckler}.`, { applause: 'small' });
  }

  // ═══ THE PEANUT GALLERY ═══
  if (gallery.length >= 2) {
    shot('gallery-side', gallerySeats(), { title: { kicker: 'Live', name: 'The Peanut Gallery' } });
    say(HB, pick([`We've brought back everybody who's been sent home so far!`, `And of course, the Peanut Gallery is here!`, `Let's say hi to the Peanut Gallery!`, `The Peanut Gallery is back, and it's bigger than ever!`], 'galopen'));
    say(HA, V(HA, 'gallery', {
      sharp: [`They lost. But they're still on television, so congratulations to them, I guess.`, `Every one of them thought they'd win. Look at them now.`, `The couch of broken dreams. Say hi, everybody.`],
      soft: [`They might be out of the game, but they're not out of our hearts.`, `We love every single one of them. Even the grumpy ones.`, `It's so nice having everyone back together.`],
      loud: [`They might be losers, but not on this couch!`, `Make some noise for the gallery!`, `The best seats in the house!`],
      dry: [`They're out of the game, but legally they still have to sit there.`, `It's like a waiting room, but for nothing.`, `The couches are getting crowded. That's how you know the game is working.`],
      odd: [`They're out of the game, but in the gallery! It rhymes. Almost.`, `It's like a family reunion, but everyone voted each other off!`, `I love them all! I've named a cushion after each of them!`],
      any: [`They might be out of the game, but they're not out of the show.`],
    }));
    const done = new Set();
    let turn = 0;
    for (const n of gallery.slice(0, 6)) {
      if (done.has(n)) continue;
      done.add(n);
      const hostNow = turn++ % 2 ? HA : HB;
      // two best friends in the gallery come as a set
      const bff = gallery.find(m => m !== n && !done.has(m) && bond(n, m) >= 5);
      if (bff) {
        done.add(bff);
        say(hostNow, `And ${n} and ${bff}!`);
        say(n, V(n, 'bff1', { any: [`We are so excited to be here!`, `Hi! We're here! Together!`, `We came as a pair! Obviously!`] }), { loud: true });
        say(bff, V(bff, 'bff2', { sharp: [`Together. Again. Obviously.`, `Where else would we sit?`, `Yes, we're still friends. Deal with it.`], dry: [`We're contractually inseparable.`, `We share a couch now. It's very serious.`, `Still friends. Somehow.`], any: [`Together again! It's like it was meant to be!`, `Best friends on the best couch!`, `We even dressed alike! Kind of!`] }));
        continue;
      }
      const f = factsOf(n);
      say(hostNow, pick([`We've got ${n}!`, `There's ${n}!`, `And ${n}, everybody!`, `Say hi, ${n}!`, `Look who it is! ${n}!`, `${n}'s here!`], `galhost${turn % 3}`));
      if (known[n]) { f.traitor = known[n]; }
      if (known[n] && !a.isReunion) say(n, V(n, 'galbitter', {
        sharp: [`Thrilled to be here. Really. Ask ${f.traitor} how thrilled I am.`, `Hi. ${f.traitor}, if you're watching, I'm still here. And I still know.`, `I'm doing great, ${f.traitor}. Thanks for asking. You didn't.`],
        loud: [`Oh, I'm here. And ${f.traitor} had better be watching.`, `${f.traitor}! I see you on that screen! I'm still mad!`, `Still here! Still mad at ${f.traitor}!`],
        dry: [`Hi. I'm the one ${f.traitor} said was safe.`, `Hello. Still not over ${f.traitor}. Moving on.`, `Hi. Yes, I'm still thinking about ${f.traitor}. Next.`],
        soft: [`Hi, everybody. I'm fine. Totally fine. Mostly fine.`, `Hi! I'm doing better. I'm not ready to talk about ${f.traitor} yet.`, `Hi. I'm okay. I've been working on forgiving ${f.traitor}. It's hard.`],
        odd: [`Hi! Is ${f.traitor} watching? Hi, ${f.traitor}! I see you!`, `Hi! I made a list of people I'm mad at. ${f.traitor} is on page one!`, `Hello! I'm keeping an eye on ${f.traitor}. From here. Forever.`],
      }));
      else say(n, V(n, 'galhappy', {
        sharp: [`I'm only here because my contract says so.`, `Try not to stare. I know it's hard.`, `Yes, it's me. You're welcome.`],
        loud: [`Woo! Let's go!`, `Gallery in the house!`, `What's up, everybody?! Best seat in the house!`],
        dry: [`Hello. I've been sitting here for twenty minutes. The couch is nice.`, `Hi. I'm here. That's my whole update.`, `Hello. I've made peace with this couch.`],
        soft: [`Hi, everybody! It's so good to see you all!`, `Hi! I missed everyone so much!`, `Hi! I'm just happy to be here, honestly.`],
        odd: [`Hi, Mom! I'm on TV again!`, `Hello! I've been practicing my wave. How was that?`, `Hi! I'm sitting! On a couch! On television!`],
      }));
    }
    if (gallery.length > 6) say(HA, pick([`And everyone else back there! Give them a hand!`, `And the rest of the gang, everybody!`, `And the whole back row! Love you guys!`], 'galrest'));
    beat(`The audience applauds the gallery.`, { applause: 'small' });
  }

  // ═══ THE GUESTS ═══
  const ivs = (a.interviews || []).filter(iv => !iv.isActive).sort((x, y) => (x.elimEpNum || 0) - (y.elimEpNum || 0));
  const toa = new Map((a.truthOrAnvil || []).map(t => [t.player, t]));
  // Truth or Hammer for at most two guests a night: the ones with the juiciest secrets, liars first
  const hammered = new Set(ivs.map(iv => toa.get(iv.player)).filter(t => t && t.setup && t.secretType !== 'clean').sort((x, y) => (x.toldTruth ? 1 : 0) - (y.toldTruth ? 1 : 0)).slice(0, 2).map(t => t.player));
  if (!hammered.size && ivs[0] && toa.get(ivs[0].player)) hammered.add(ivs[0].player);
  // one viewer question a night, to the guest it fits best; the rest get a question of their own kind
  const facts = new Map(ivs.map(iv => [iv.player, factsOf(iv.player)]));
  // the backstage camera, for at most two guests: whoever is hurting most, and one more
  const backstage = new Set(ivs.map(iv => iv.player).sort((x, y) => (facts.get(y).traitor ? 1 : 0) - (facts.get(x).traitor ? 1 : 0)).slice(0, Math.min(2, ivs.length)));
  let hammerShown = false, debateDone = false, revealed = 0, viewerAsked = false;
  const QKINDS = ['best', 'regret', 'rival', 'love', 'predict'];

  const debate = () => {
    if (debateDone) return;
    debateDone = true;
    // the season's hottest argument: a showmance that broke up, else the worst feud in the cast
    const pool = cast.filter(n => (gs.activePlayers || []).includes(n) || gallery.includes(n));
    const sm = (gs.showmances || []).find(s => (s.players || []).every(p => cast.includes(p)) && s.breakupEp) || (gs.showmances || []).find(s => (s.players || []).every(p => pool.includes(p)));
    let X, Y, topic;
    if (sm) { [X, Y] = sm.players; topic = sm.breakupEp ? 'breakup' : 'couple'; } else {
      let worst = null;
      for (let i = 0; i < pool.length; i++) for (let j = i + 1; j < pool.length; j++) { const b = bond(pool[i], pool[j]); if (b <= -2 && (!worst || b < worst.b)) worst = { x: pool[i], y: pool[j], b }; }
      if (!worst) return;
      X = worst.x; Y = worst.y; topic = 'feud';
    }
    // a fight the show has already had is old news
    const settled = gs.aftermathDebated || (gs.aftermathDebated = []);
    const pairKey = [X, Y].sort().join('|');
    if (settled.includes(pairKey)) return;
    settled.push(pairKey);
    // the hosts land on opposite sides: the nicer host with the nicer player
    const [sideA, sideB] = (niceness(HA) >= niceness(HB)) === (niceness(X) >= niceness(Y)) ? [X, Y] : [Y, X];
    shot('stage-wide', wideSeats(), { title: { kicker: 'The big debate', name: `Team ${X} or Team ${Y}?` } });
    say(HA, topic === 'breakup' ? `Okay, we have to talk about ${X} and ${Y}. That breakup was brutal, and honestly? It was all ${sideB}'s fault.`
      : topic === 'couple' ? `Okay, we have to talk about ${X} and ${Y}. And honestly? ${sideA} could do so much better.`
      : `Okay, we have to talk about ${X} and ${Y}, because those two cannot stand each other. And honestly? It's ${sideB}'s fault.`);
    say(HB, V(HB, 'disagree', {
      sharp: [`Whoa. Back up. ${sideB} didn't do anything ${sideA} didn't do first.`, `Excuse me? Have you met ${sideA}?`, `That is the worst take I've heard all year.`],
      loud: [`What?! No way! ${sideB} is the only one out there making any sense!`, `Are you kidding me?! ${sideA} is the problem!`, `Nope! Wrong! Team ${sideB}, all the way!`],
      soft: [`I don't know, I kind of get where ${sideB} is coming from.`, `I think ${sideB} was just really hurt, honestly.`, `I mean, ${sideA} wasn't exactly perfect either.`],
      dry: [`Respectfully, ${sideA} is not the victim here.`, `I've watched the tapes. It's ${sideA}.`, `Bold take. Wrong, but bold.`],
      odd: [`Counterpoint: ${sideB} is awesome. That's my whole argument.`, `I'm Team ${sideB}! I've always been Team ${sideB}! Since about a minute ago!`, `Objection! Team ${sideB}!`],
      any: [`Whoa, back up. It wasn't ${sideB}'s fault.`],
    }));
    beat(`The audience gasps.`, { tense: true });
    say(HA, V(HA, 'push', {
      sharp: [`Are you seriously defending ${sideB} on live television?`, `Wow. I didn't know you had such bad taste.`, `Of course you'd take ${sideB}'s side.`],
      loud: [`You are NOT taking ${sideB}'s side right now!`, `Unbelievable! On our own show!`, `Oh, come ON!`],
      soft: [`Wait, you really think that? After everything ${sideB} did?`, `How can you say that? Did you see ${sideA}'s face?`, `I just... I can't believe you'd say that.`],
      dry: [`Interesting. Wrong, but interesting.`, `Okay. Agree to disagree. Mostly disagree.`, `I'll pretend you didn't say that.`],
      odd: [`I can't believe you'd betray me like this. On our own show!`, `Traitor! On my own couch!`, `I'm telling everybody you said that!`],
      any: [`You can't be serious.`],
    }));
    // it spills over: the hosts end up arguing about themselves
    const heat = ['sharp', 'loud'].includes(fam(HA)) || ['sharp', 'loud'].includes(fam(HB));
    if (heat) {
      say(HB, V(HB, 'spill', { any: [`Maybe you should go be on Team ${sideA}, then, since you like ${pr(sideA).obj} so much!`, `You know what? You and ${sideA} would get along great.`, `Wow. Okay. Tell us how you really feel.`], dry: [`You've brought up ${sideA} four times tonight. Just saying.`, `You seem very invested in ${sideA}.`, `Should I leave you two alone?`], soft: [`Maybe you're taking this a little personally?`, `Why are you getting so upset?`, `Hey, it's just a debate.`] }));
      say(HA, V(HA, 'spill2', { any: [`Maybe I will!`, `Maybe I would!`, `Oh, I will.`], sharp: [`Maybe I will. At least ${sideA} has taste.`, `At least ${sideA} listens to me.`, `Please. You're just jealous.`], dry: [`I'm not going to dignify that.`, `Wow. Okay.`, `Noted, ${HB}.`], soft: [`That's not fair, and you know it.`, `Okay, that hurt a little.`, `Why would you say that?`] }));
      beat(`The gallery goes "Ooooh."`);
    }
    // the gallery picks: by who they like more, else by who they'd side with by nature
    shot('gallery-side', gallerySeats([X, Y]));
    for (const who of [X, Y]) if (gallery.includes(who)) {
      const other = who === X ? Y : X;
      say(who, V(who, 'subject', {
        sharp: [`I'm sitting right here, you know. And for the record, ${other} started it.`], loud: [`Hello?! I'm RIGHT HERE! And it was ${other}!`], soft: [`Um, I'm right here. And it really wasn't all my fault.`],
        dry: [`Love being discussed like I'm not on this couch.`], odd: [`Hi! It's me! The topic! Team me, please!`],
      }));
      break;
    }
    say(HB, `Let's ask the gallery. Hands up for Team ${X}!`);
    const leanOf = n => { const d = bond(n, X) - bond(n, Y); if (Math.abs(d) >= .5) return d > 0 ? X : Y; const nd = niceness(n) * (niceness(X) - niceness(Y)); if (nd) return nd > 0 ? X : Y; return hash(`${key}|lean|${n}`) % 2 ? X : Y; };
    const voters = gallery.filter(n => n !== X && n !== Y);
    const forX = voters.filter(n => leanOf(n) === X), forY = voters.filter(n => leanOf(n) === Y);
    const hands = arr => (arr.length ? `${arr.length > 4 ? `${arr.slice(0, 4).join(', ')} and ${num(arr.length - 4)} more` : list(arr)} put ${arr.length === 1 ? 'a hand' : 'their hands'} up.` : `Not one hand.`);
    beat(hands(forX));
    say(HA, `And Team ${Y}?`);
    beat(hands(forY));
    // two of them on opposite sides go at it
    const p = forX[0], q = forY[0];
    if (p && q) {
      say(p, V(p, 'sideX', { sharp: [`${Y} is a fake, and everybody on this couch knows it.`], loud: [`${X} all the way! ${Y} had it coming!`], soft: [`I just think ${X} got treated really unfairly.`], dry: [`I've met ${Y}. Team ${X}.`], odd: [`Team ${X}! I'd make a shirt if they let me!`] }));
      say(q, V(q, 'sideY', { sharp: [`Please. ${X} played everyone, and you fell for it.`], loud: [`Are you kidding?! ${X} started it!`], soft: [`That's not what happened, though. ${Y} was hurt too.`], dry: [`Bold opinion from someone who lasted less time than ${Y}.`], odd: [`Team ${Y}! Because I said so!`] }));
      addBond(p, q, -0.5);
    }
    // the side with more hands wins the room
    const won = forX.length > forY.length ? X : forY.length > forX.length ? Y : null;
    if (won) { const lost = won === X ? Y : X; gs.popularity[won] = (gs.popularity[won] || 0) + 1; gs.popularity[lost] = (gs.popularity[lost] || 0) - 0.5; }
    beat(won ? `The room is with ${won}, ${Math.max(forX.length, forY.length)} to ${Math.min(forX.length, forY.length)}.` : `The gallery is split right down the middle.`);
    // the break, before anyone throws anything
    shot('stage-wide', wideSeats());
    if (heat) {
      say(HB, pick([`Fine. Whatever.`, `Fine.`, `Okay. Fine.`], 'whatever'));
      say(HA, V(HA, 'break', { any: [`I think we need a break.`, `Let's take a break.`, `And we'll be right back.`], loud: [`We're taking a break! Right now!`, `Commercial! Now!`, `Break time! Everybody breathe!`], dry: [`And on that note, a commercial.`, `This seems like a good time for an ad.`, `Let's go to a break before somebody says something else.`] }));
    } else say(HA, `Okay. We'll settle this after the break.`);
    shot('green-close', { [chef]: 'C1' }, { title: { kicker: 'A word from our sponsor', name: chef } });
    say(chef, pick(SPONSOR, 'sponsor')(chef));
    shot('stage-wide', wideSeats());
    say(HB, heat ? pick([`We're back! We got a little sidetracked, but we're good now. Right, ${HA}?`, `And we're back! Everybody calm? Great. ${HA}?`, `We're back, and we've talked, and we're fine. Right, ${HA}?`], 'backheat') : pick([`And we're back!`, `Welcome back!`, `We're back, everybody!`], 'back'));
    if (heat) say(HA, V(HA, 'fine', { any: [`Fine.`, `Sure.`, `Totally.`], sharp: [`Perfectly fine. Wonderful, even.`, `Never better.`, `Delightful.`], soft: [`We're good. We're totally good.`, `We hugged it out. Mostly.`, `Yep! All good!`], loud: [`FINE.`, `We're GREAT.`, `Yep! Totally! Fine!`] }));
  };

  ivs.forEach((iv, gi) => {
    const g = iv.player;
    const f = facts.get(g);
    const mood = moodOf(f);
    const leadHost = gi % 2 ? HB : HA, otherHost = gi % 2 ? HA : HB;

    // backstage: the guest waiting in the green room, on the backstage camera
    if (backstage.has(g)) {
      shot('green-wide', { [g]: 'S1' }, { title: { kicker: 'Backstage', name: 'The green room' } });
      say(leadHost, pick([`Before we bring out our next guest, let's check in on ${g} backstage.`, `Should we check on ${g} first? Let's go to the backstage camera.`, `Let's see how ${g} is doing back there.`], 'bs'));
      if (mood === 'betrayed') {
        // (they don't know yet who did it: that comes out on the couch)
        say(g, V(g, 'green-hurt', {
          soft: [`Oh! Is the camera on? I'm okay. I'm okay. I'm just really glad there are snacks back here.`, `Hi. Sorry. I'm fine. I just keep thinking I was safe.`, `Is it on? Okay. I'm not crying. These are allergies.`],
          sharp: [`Is that thing on? Good. Whoever wrote my name down, I hope you're enjoying the game.`, `I've been back here an hour figuring out who did it. I'm very close.`, `Don't look at me like that. I'm perfectly fine. Furious, but fine.`],
          loud: [`Is this on? Whoever voted me out, I'm gonna find out who you are!`, `I want names! Somebody back here owes me names!`, `I'm not mad! I'm REALLY not mad! Okay, I'm a little mad!`],
          dry: [`I've been back here for an hour, trying to work out who flipped. It's going great.`, `I thought I was safe. That's the whole update.`, `There's a mirror back here. I've been asking it who did it. It won't say.`],
          odd: [`I've eaten every cookie in this room. It's how I deal with betrayal.`, `I've been talking to the plant back here. It's the only one I trust now.`, `I've decided I'm not upset. I've decided that six times.`],
        }));
        if (fam(g) === 'soft') beat(`${g} hugs a throw pillow and stares at the floor.`);
      } else say(g, V(g, 'green', {
        soft: [`Hi! I'm so nervous. Is my hair okay? Don't answer that.`, `Oh! Hi! I didn't know it was on. Hi, everyone!`, `I'm so excited. And a little scared. Mostly excited!`],
        sharp: [`I've been waiting back here for twenty minutes. Are you two bringing me out, or do I have to host this myself?`, `Is this the green room? It's beige.`, `Let's get this over with. My good side is the left.`],
        loud: [`Let's go, let's go, let's GO! Bring me out there!`, `Is it my turn yet?! I'm ready!`, `Pump up the crowd! I'm coming out!`],
        dry: [`This green room has better food than the entire island. I'm in no hurry.`, `They gave me a water bottle with my name on it. Spelled wrong.`, `I'm ready. I think. Hard to tell.`],
        odd: [`I've tried every snack back here. Ranked them, too. The pretzels win.`, `I practiced my entrance seventeen times. You're going to love number twelve.`, `Is the couch out there comfier than this one? I've got opinions about couches now.`],
      }));
    }
    shot('stage-wide', wideSeats());
    say(otherHost, V(otherHost, 'roll', {
      any: [`Before ${g} comes out, let's take a look back.`, `Let's take a look at ${g}'s time on the show.`, `First, let's see how ${g} got here.`],
      loud: [`Roll the tape!`, `Let's see the highlights! Go!`, `Okay! ${g}'s season, everybody! Hit it!`],
      dry: [`Let's look at the tape first. ${mood === 'betrayed' ? "It's a rough one." : "It's a good one."}`, `Here's the footage. I've seen it. Brace yourselves.`, `A quick look back. Very quick, in some cases.`],
      soft: [`Aw, let's look at ${g}'s season first.`, `Let's look back at ${g}'s time on the show.`, `Okay, here's ${g}'s story.`],
    }));

    // the clip package: the season as it happened to them
    const clip = [];
    const early = f.days != null && f.days <= 2;
    clip.push({ by: leadHost, shot: f.firstShot || f.campShot || f.star, text: early ? pick([`${g}'s time on the show may have been short...`, `${g} wasn't out there for long...`, `${g} barely had time to unpack...`], 'c1e') : pick([`${g} made it ${num(f.days || 0)} episodes on the show.`, `${g} lasted ${num(f.days || 0)} episodes out there, and every one of them was eventful.`, `${num(f.days || 0)} episodes. That's how long ${g} survived.`, `From day one, ${g} was hard to miss.`], 'c1') });
    if (f.wins >= 2) clip.push({ by: otherHost, shot: f.star || f.campShot, text: pick([`${g} won ${num(f.wins)} challenges, and made sure everybody knew it.`, `${num(f.wins)} challenge wins. Not bad at all.`, `In the challenges, ${g} was a monster. ${Cap(num(f.wins))} wins.`], 'c2w') });
    else if (f.partner) clip.push({ by: otherHost, shot: f.campShot, text: f.brokeUp ? pick([`${g} fell hard for ${f.partner}. And then it all fell apart.`, `${g} and ${f.partner}. It was cute, until it wasn't.`, `Then came ${f.partner}. And then, well, the breakup.`], 'c2b') : pick([`${g} fell hard for ${f.partner}. Look at those two.`, `And then there was ${f.partner}. Aw.`, `${g} and ${f.partner}. Everybody saw it coming except them.`], 'c2l') });
    else if (f.idol) clip.push({ by: otherHost, shot: f.bootShot, text: pick([`${g} found an idol and played it, and the whole vote went quiet.`, `${g} had an idol, and used it.`, `Remember the idol? ${g} does.`], 'c2i') });
    else if (f.alliance) clip.push({ by: otherHost, shot: f.campShot, text: pick([`${g} helped build ${f.alliance} and swore it would go all the way.`, `${f.alliance}. ${g}'s pride and joy.`, `${g} put everything into ${f.alliance}.`], 'c2a') });
    else clip.push({ by: otherHost, shot: f.campShot, text: early ? pick([`But it was a wild ride.`, `But what a ride.`, `But boy, did it count.`], 'c2e') : pick([`And it was a wild ride.`, `And there were ups and downs. Mostly downs.`, `And it was never boring.`, `There was drama. There was always drama.`], 'c2') });
    if (f.how === 'vote') clip.push({ by: leadHost, shot: f.bootShot, text: f.traitor ? pick([`In the end, ${num(f.votes)} ${f.votes === 1 ? 'vote' : 'votes'} sent ${g} home, and one of them came from someone ${pr(g).sub} trusted.`, `${Cap(num(f.votes))} ${f.votes === 1 ? 'vote' : 'votes'}, and one of them should never have been there.`, `When the votes came in, ${g} got a nasty surprise.`], 'c3t') : pick([`Ultimately, ${num(f.votes)} ${f.votes === 1 ? 'vote' : 'votes'} sent ${g} home${f.voters[0] ? `, and ${f.voters[0]} wrote one of them` : ''}.`, `And then the votes came in. ${Cap(num(f.votes))} of them.`, `In the end, the votes didn't go ${g}'s way.`], 'c3') });
    else if (f.how === 'tied') clip.push({ by: leadHost, shot: f.bootShot, text: `And then a twist tied ${g}'s fate to somebody else's, and ${pr(g).sub} went home without a single vote against ${pr(g).obj}.` });
    else clip.push({ by: leadHost, shot: f.bootShot, text: `And then, just like that, ${g}'s game was over.` });
    const react = V(otherHost, 'clipreact', {
      soft: [`Aw. Poor ${g}.`, `That's so sad. I'm sad now.`, `Oh, that one hurts to watch.`], sharp: [`Watch the face when the votes come in. I love this part.`, `Oof. Should have seen it coming.`, `And that's what happens.`],
      loud: [`Oof! Brutal!`, `No way! I forgot about that!`, `Ouch! Play it again!`], dry: [`In fairness, I saw that coming from space.`, `Classic.`, `And that's television.`], odd: [`I've watched that clip forty times. It gets me every time.`, `I cried. I always cry.`, `Ooh, this is my favorite part!`],
    });
    clip.forEach((c, i) => {
      shot('clip', {}, { shot: c.shot || null, clip: true, ...(i === 0 ? { title: { kicker: 'A look back', name: `${g}'s season` } } : {}) });
      say(c.by, c.text);
      if (i === clip.length - 1) say(otherHost, react);
    });

    // the walk-in, with a bio of things that are true (and nothing the guest doesn't know yet)
    shot('doorway', { [g]: 'walk' });
    const bio = [
      f.wins >= 1 && `won ${num(f.wins)} ${f.wins === 1 ? 'challenge' : 'challenges'}`,
      f.partner && (f.brokeUp ? `survived a breakup with ${f.partner}` : `fell for ${f.partner}`),
      f.idol && `played an idol`,
      f.alliance && `helped start ${f.alliance}`,
      f.firstOut && `was the first one out`,
      f.votes >= 4 && `took ${num(f.votes)} votes in one night`,
      f.traitor && `never saw it coming`,
    ].filter(Boolean).slice(0, 3);
    say(leadHost, bio.length ? `Our ${gi ? 'next' : 'first'} guest ${list(bio)}. Please welcome ${g}!` : `Our ${gi ? 'next' : 'first'} guest is here! Please welcome ${g}!`);
    const cheer = f.pop >= 3 || iv.crowdReaction === 'wild' || iv.crowdReaction === 'warm', boo = f.pop <= -2 || iv.crowdReaction === 'boos';
    beat(cheer ? `The crowd goes wild as ${g} walks out.` : boo ? `A few boos as ${g} walks out.` : `Polite applause as ${g} walks out.`, { applause: cheer ? 'big' : boo ? 'boo' : 'small', act: 'arrive' });
    say(g, V(g, 'enter', {
      loud: [`Yeah! I'm on TV! Hi, everybody!`, `What's up, Aftermath?!`, `I'm here! Let's go!`],
      soft: [`Hi! Oh my gosh, hi! Thank you!`, `Wow. Okay. Hi, everyone.`, `Thank you! Thank you so much!`],
      sharp: [`Hold the applause. Actually, no. Keep going.`, `Finally. The interview I deserve.`, `Yes, yes. I know.`],
      dry: [`Hello. I'm told this is the good part.`, `Hi. I'll be sitting now.`, `Thank you. That was more clapping than I expected.`],
      odd: [`I'm here! I'm on the couch! I'm on the TV couch!`, `Hello, studio! I brought nothing!`, `Hi! Is this my chair? It's lovely!`],
    }));

    // the interview
    shot('couch-front', { [HA]: 'hA', [g]: 'g', [HB]: 'hB' }, { title: { kicker: 'In the hot seat', name: g } });
    say(leadHost, f.firstOut ? `So, ${g}. How did it feel to be the first one voted off the show?` : f.how === 'vote' ? pick([`So, ${g}. How does it feel to be out of the game?`, `${g}! How are you holding up?`, `So, ${g}. Talk to us. How are you feeling?`], 'q1') : `So, ${g}. What a way to go. How are you feeling?`);
    const hostCred = credit(leadHost);
    if (['sharp', 'loud', 'odd'].includes(fam(g)) && hostCred && !hostCred.winner && hash(`${key}|jab|${g}`) % 2) {
      say(g, V(g, 'jab', { sharp: [`I don't know, ${leadHost}. How did it feel for you? You'd know.`], loud: [`You tell me! You lost too!`], odd: [`How did it feel for YOU, ${leadHost}? Was it humiliating? Sobering?`] }));
      beat(`The audience gasps, then laughs.`, { applause: 'small' });
      say(leadHost, V(leadHost, 'jabback', { any: [`Hey, I'm supposed to be asking the questions!`], sharp: [`Cute. I'm asking the questions, thank you.`], dry: [`Okay. That's fair. Moving on.`], soft: [`Ouch. Okay, that's fair.`] }));
    }
    say(g, V(g, `ans-${mood}`, ({
      betrayed: { soft: [`Honestly? I'm still a little in shock. I thought I was safe.`, `It hurts. I really thought I had people out there.`, `Not great, honestly. I trusted the wrong people.`], sharp: [`Humiliating. Thanks for asking.`, `Like a mistake. Theirs, not mine.`, `Annoyed. Mostly at whoever lied to my face.`], loud: [`Terrible! I got played and I didn't even see it!`, `Bad! Real bad! Somebody lied to me!`, `How do you think?! I got blindsided!`], dry: [`Like getting hit by a bus I was told was a ride home.`, `Like finding out the floor was never there.`, `About as good as you'd expect.`], odd: [`Like a surprise party, except the surprise was that I'm going home.`, `Like losing at musical chairs, but with my life.`, `Weird! Mostly weird! A little betrayed!`] },
      first: { soft: [`It hurt. Being first is the worst. But I'm okay, I promise.`, `Honestly, it stung. I barely got started.`], sharp: [`Being first is a statement. They were scared of me.`, `They knew I was a threat. Obviously.`], loud: [`Awful! I barely got to unpack!`, `First?! Me?! Still not over it!`], dry: [`It was efficient. I'll give them that.`, `Quick. Very quick.`], odd: [`I like to think I set the bar. Very low. On purpose.`, `Someone had to go first! I volunteered! I didn't, actually.`] },
      loved: { soft: [`Honestly? Kind of amazing, with all of you cheering like that.`, `With all of you here? Pretty great, honestly.`, `Better than I thought it would! Thank you all!`], sharp: [`Fine. The fans clearly know who the real winner is.`, `Better, now that people are being sensible.`, `The fans get it. The players didn't.`], loud: [`With a crowd like this? Pretty awesome!`, `Listen to them! Amazing!`, `I feel like a winner right now!`], dry: [`Better now that people are clapping.`, `Surprisingly okay.`, `I'll take the applause. Thank you.`], odd: [`Like being a celebrity, but poorer!`, `Like a rock star! A rock star who lost!`, `Like a superhero! A retired one!`] },
      booed: { soft: [`Um, the boos aren't helping, but I'm okay.`, `I know not everybody liked me out there. I get it.`], sharp: [`Boo all you want. I played the game.`, `Go ahead. I'll wait.`], loud: [`Boo me! I don't care! I'd do it all again!`, `Bring it on! I can take it!`], dry: [`The booing's a nice touch.`, `I've had warmer welcomes. Not many.`], odd: [`I'm choosing to hear those boos as cheers.`, `Thank you! I think!`] },
      fine: { soft: [`Honestly? I'm okay. I gave it everything I had.`, `I'm good! I'm proud of how I played.`, `A little sad, but mostly happy I got to do it.`], sharp: [`I've been better. I've also been worse. Mostly better.`, `Fine. Out, but fine.`, `I'd rather be playing. Obviously.`], loud: [`Out of the game, not out of the fight!`, `Pumped to be here! Bummed to be out!`, `Great! I mean, I'm out! But great!`], dry: [`It's quieter. I miss being shouted at, a little.`, `I'm okay. I sleep in a real bed now.`, `About as well as you'd think.`], odd: [`It feels like losing, but with better snacks.`, `I've been home a week and I still wake up on the floor out of habit.`, `Great! I've been telling everyone I won. Don't tell them.`] },
    })[mood]));

    // the slip-up: a host says out loud the thing nobody told the guest
    if (f.traitor && !known[g] && revealed < 2) {
      revealed++;
      known[g] = f.traitor;
      say(otherHost, pick([`I mean, once ${f.traitor} voted with them, it was over anyway.`, `Well, sure, but with ${f.traitor} writing your name down, what were you going to do?`, `To be fair, ${f.traitor} switched on you, so it was over anyway.`], 'slip'));
      beat(`The audience gasps.`, { tense: true });
      say(g, V(g, 'reveal', {
        soft: [`Wait. What? ${f.traitor} voted for me? No. No, ${pr(f.traitor).sub} promised.`, `${f.traitor}? But we were friends. We were really friends.`], sharp: [`Excuse me? ${f.traitor} did what?`, `I'm sorry. Say that name again.`],
        loud: [`WHAT?! ${f.traitor} voted me out?! Are you kidding me?!`, `${f.traitor}?! ${f.traitor} did that?!`], dry: [`Huh. ${f.traitor}. Of course it was ${f.traitor}.`, `Oh. So that's who it was.`],
        odd: [`${f.traitor}? MY ${f.traitor}? The one I gave half my dessert to?`, `${f.traitor}? No! ${f.traitor} borrowed my sunscreen!`],
      }), { loud: fam(g) === 'loud' });
      say(leadHost, V(leadHost, 'oops', { any: [`Whoa. Did nobody tell ${pr(g).obj}?`], sharp: [`Oh, wow. You really didn't know.`], soft: [`Oh no. Nobody told you. I'm so sorry.`], loud: [`Dude! Nobody told ${pr(g).obj}?!`] }));
      say(otherHost, V(otherHost, 'oops2', { any: [`How was I supposed to know?!`], sharp: [`It's not my job to tell people things.`], dry: [`In my defense, it was on television.`], soft: [`I thought everyone knew! I'm so sorry!`] }));
      say(g, V(g, 'reveal2', {
        soft: [`I helped ${pr(f.traitor).obj}. I really helped ${pr(f.traitor).obj}.`, `I need a minute. Sorry. I just need a minute.`], sharp: [`Fine. ${f.traitor} wants to play like that? Noted.`, `Okay. I'll remember that. I remember everything.`],
        loud: [`${f.traitor}, when I see you, you're gonna hear about this!`, `Oh, ${f.traitor} is in SO much trouble!`], dry: [`Great. Love finding out on live TV.`, `Well. That explains the look ${pr(f.traitor).sub} gave me.`],
        odd: [`Okay. I'm writing ${f.traitor} a very long letter. A very angry letter.`, `I'm adding ${f.traitor} to my list. It's a short list. It's a mean list.`],
      }));
      addBond(g, f.traitor, -2.5);
      gs.popularity[f.traitor] = (gs.popularity[f.traitor] || 0) - 1;
    } else if (f.how === 'vote') {
      say(otherHost, pick([`${Cap(num(f.votes))} ${f.votes === 1 ? 'vote' : 'votes'}. Did you see it coming?`, `Walk us through the vote. Did you know?`, `When did you know it was you?`], 'q2'));
      say(g, V(g, 'saw', {
        soft: [`Not at all. I thought ${f.friend || 'everyone'} had my back.`, `No. I really thought it was going to be someone else.`, `Kind of? I just hoped I was wrong.`],
        sharp: [`Of course I did. I just didn't think they'd have the nerve.`, `I knew. I was outnumbered, not outplayed.`, `The second I sat down. Everyone was too polite.`],
        loud: [`No! Nobody tells you anything out there!`, `I had NO idea! None!`, `Sort of! But I still fought it!`],
        dry: [`I had a feeling. It was the way nobody would look at me.`, `When they all stopped talking as I walked up. Subtle.`, `Roughly two seconds before it happened.`],
        odd: [`I saw something coming. I just thought it was coming for someone else.`, `I had a dream about it! I thought it was just a dream!`, `Nope! I was busy thinking about lunch!`],
      }));
    }

    // the gallery cuts in
    const cutIn = gallery.filter(n => n !== g).sort((x, y) => Math.abs(bond(y, g)) - Math.abs(bond(x, g)))[0];
    if (cutIn && Math.abs(bond(cutIn, g)) >= 3) {
      const hate = bond(cutIn, g) < 0;
      shot('gallery-side', gallerySeats([cutIn]));
      say(cutIn, hate ? V(cutIn, 'cutin-', { sharp: [`Oh, please. You had it coming.`, `Some of us aren't surprised.`], loud: [`Boo! You were a nightmare out there!`, `Don't believe a word of it!`], dry: [`Should've seen it coming, honestly.`, `I was there. It wasn't like that.`], soft: [`I'm sorry, but you weren't always nice to people.`, `That's not exactly how I remember it.`], odd: [`I'm on Team Somebody Else!`, `Objection! I don't know what to, but objection!`] })
        : V(cutIn, 'cutin+', { sharp: [`For the record, ${g} deserved way better.`, `Whoever voted ${g} out made a mistake.`], loud: [`${g} got robbed!`, `Woo! ${g}!`], dry: [`For what it's worth, ${g} was one of the good ones.`, `${g} was the only one out there who made sense.`], soft: [`We love you, ${g}!`, `You did so great, ${g}!`], odd: [`${g}! You're my favorite! Don't tell anyone!`, `${g}! Wave at me! Please!`] }));
      shot('couch-front', { [HA]: 'hA', [g]: 'g', [HB]: 'hB' });
      say(g, hate ? V(g, 'cutback-', { sharp: [`Says the person who's been on that couch longer than I was in the game.`, `Nobody asked the gallery.`], loud: [`Nobody asked you, ${cutIn}!`, `Oh, here we go!`], dry: [`Thank you, ${cutIn}. Very helpful.`, `Noted, ${cutIn}.`], soft: [`That's... fair, I guess.`, `I'm sorry you feel that way.`], odd: [`I love you too, ${cutIn}.`, `Thank you for your input, ${cutIn}!`] })
        : V(g, 'cutback+', { any: [`Thank you, ${cutIn}!`, `${cutIn}! Love you!`], sharp: [`Finally, someone with sense.`, `See? ${cutIn} gets it.`], soft: [`Aw, thank you, ${cutIn}!`, `That means a lot, ${cutIn}.`] }));
      addBond(cutIn, g, hate ? -0.5 : 0.5);
    }

    // one more question: a viewer's, once a night; otherwise the hosts' own, a different kind each time
    const qActive = (gs.activePlayers || []).filter(n => n !== g);
    const fave = qActive.slice().sort((x, y) => bond(g, y) - bond(g, x))[0];
    const enemy = qActive.slice().sort((x, y) => bond(g, x) - bond(g, y))[0];
    const kinds = QKINDS.filter(k => (k !== 'rival' || (enemy && bond(g, enemy) <= -2)) && (k !== 'love' || (f.partner && !f.brokeUp)) && (k !== 'predict' || fave) && (k !== 'best' || f.wins || f.alliance || f.partner));
    const kind = kinds[(gi + hash(key)) % Math.max(1, kinds.length)] || 'regret';
    const asker = !viewerAsked && (kind === 'rival' || kind === 'love' || gi === ivs.length - 1) ? pick(HANDLES, 'handle') : null;
    if (asker) viewerAsked = true;
    const q = {
      best: f.wins ? `What was the best moment of your season? Those ${f.wins === 1 ? 'challenge win' : `${num(f.wins)} challenge wins`}?` : f.partner ? `What was the best part of your season? Was it ${f.partner}?` : `What was the best part of being in ${f.alliance}?`,
      regret: pick([`If you could go back and change one thing, what would it be?`, `What's the one move you wish you'd made?`, `Any regrets?`, `Looking back, what would you do differently?`], 'qregret'),
      rival: `${g}, are you still mad at ${enemy}?`,
      love: `Are you and ${f.partner} still together?`,
      predict: pick([`Who do you think is going to win it all?`, `Who's your pick to win?`, `Who takes it all, in your opinion?`], 'qpredict'),
    }[kind];
    say(leadHost, asker ? `Let's hear from a viewer! ${asker} asks, "${q}"` : q);
    if (kind === 'best') say(g, f.wins ? V(g, 'best-w', { soft: [`The wins, for sure. My team hugging me after. That was everything.`], sharp: [`Winning. Obviously. Carrying people is exhausting, but it's satisfying.`], loud: [`Winning! Every single time! Best feeling ever!`], dry: [`The wins. Mostly because people stopped yelling at me for a day.`], odd: [`Winning! And the little dance I did after! You didn't see the dance? Shame.`] })
      : f.partner ? V(g, 'best-l', { soft: [`${f.partner}. It was always ${f.partner}.`], sharp: [`Fine. Yes. It was ${f.partner}. Don't make it a thing.`], loud: [`${f.partner}! Obviously!`], dry: [`${f.partner}. Don't tell ${pr(f.partner).obj} I said that.`], odd: [`${f.partner}! And the snacks! Mostly ${f.partner}!`] })
      : V(g, 'best-a', { soft: [`Having people I could count on. For a while, anyway.`], sharp: [`Running ${f.alliance}. Somebody had to.`], loud: [`${f.alliance}! We were unstoppable! Until we weren't!`], dry: [`${f.alliance} was good while it lasted. Which wasn't long.`], odd: [`The secret handshake! We had a secret handshake!`] }));
    else if (kind === 'regret') say(g, V(g, 'regret', {
      soft: [`I'd trust my gut more. It was telling me something and I didn't listen.`, `I'd talk to more people. I stayed too close to my friends.`, `Honestly? I'd be a little braver.`],
      sharp: [`Nothing. Well, one thing. I'd have gone after them first.`, `I'd have stopped being so patient with people.`, `I'd have made the move a week earlier.`],
      loud: [`I'd go harder! Every challenge, every vote!`, `I'd say what I was thinking sooner! Even louder!`, `Nothing! Okay, one thing! I'd have yelled less! Maybe!`],
      dry: [`I'd pack more socks.`, `I'd have spent less time in the confessional and more time at camp.`, `I'd have read the room. The room was hostile.`],
      odd: [`I'd bring a lucky charm. A real one, not a rock.`, `I'd have hidden somewhere better during that one challenge.`, `I'd do it all exactly the same! Except the part where I lost!`],
    }));
    else if (kind === 'rival') say(g, V(g, 'enemy', { soft: [`Mad? No. Hurt? A little. Okay, a lot.`], sharp: [`Mad implies I think about ${enemy}. I don't. Ever. At all.`], loud: [`YES! Next question!`], dry: [`Still? I haven't started being done with it.`], odd: [`I'm not mad. I'm writing a song about it. It's very mad.`] }));
    else if (kind === 'love') say(g, V(g, 'together', { soft: [`We are! I miss ${pr(f.partner).obj} so much.`], sharp: [`Obviously. ${f.partner} has excellent taste.`], loud: [`You bet we are! ${f.partner}, I love you!`], dry: [`As far as I know. ${Cap(pr(f.partner).sub)} ${has(f.partner) === 'have' ? "haven't" : "hasn't"} said otherwise.`], odd: [`We're together! It's official! I made it official this morning!`] }));
    else say(g, V(g, 'win', { soft: [`${fave}, I really hope. ${Cap(pr(fave).sub)} deserve${pr(fave).sub === 'they' ? '' : 's'} it.`], sharp: [`${fave}, if ${pr(fave).sub} ${has(fave)} any sense. Which is a big if.`], loud: [`${fave}! Go, ${fave}!`], dry: [`${fave}. Mostly because everyone else is worse.`], odd: [`${fave}! I'm calling it now, on live TV!`] }));

    // Truth or Hammer, for the guests with something to hide
    const t = toa.get(g);
    if (t && hammered.has(g)) {
      shot('couch-front', { [HA]: 'hA', [g]: 'g', [HB]: 'hB' }, { title: { kicker: 'Segment', name: 'Truth or Hammer' }, hammer: true });
      if (!hammerShown && !gs.aftermathHammer) {
        hammerShown = true;
        gs.aftermathHammer = true;
        say(otherHost, `I think it's time we play a fun little game called Truth or Hammer!`);
        beat(`The audience cheers.`, { applause: 'big' });
        say(otherHost, `Here's how it works. We ask you a question, and if you lie, a giant hammer swings down and knocks you right out of your chair.`);
        say(g, V(g, 'hammer?', { soft: [`Um. Is it a real hammer?`], sharp: [`You wouldn't dare.`], loud: [`Bring it on!`], dry: [`That seems like a liability issue.`], odd: [`If my conscience doesn't get me, the hammer will!`] }));
        say(leadHost, `Should we give it a test run?`);
        beat(`The hammer swings down... and misses ${g} by an inch.`, { act: 'hammer-miss' });
        say(g, V(g, 'missed', { any: [`Ha! Missed me!`], soft: [`Oh my gosh. Oh my gosh, okay.`], sharp: [`Is that all you've got?`], dry: [`Great. Now I'm awake.`] }));
      } else {
        hammerShown = true;
        say(leadHost, pick([`You know what time it is. Truth or Hammer!`, `Time for Truth or Hammer! You know the rules. Lie, and the hammer comes down.`, `Let's play Truth or Hammer!`, `Okay, ${g}. Truth or Hammer. Ready?`], 'hammer2h'));
        beat(`The hammer creaks into position above the couch.`, { tense: true });
        say(g, V(g, 'hammer2', { soft: [`Oh no. Please be gentle.`], sharp: [`Ask. I have nothing to hide.`], loud: [`Do your worst!`], dry: [`I watched the last one. I'm ready.`], odd: [`I've been practicing my honest face!`] }));
      }
      if (t.secretType === 'clean' || !t.setup) {
        say(otherHost, `Easy one. Did you ever cry in the confessional?`);
        say(g, V(g, 'cry', { soft: [`Every day. Sometimes twice.`], sharp: [`Once. Allergies.`], loud: [`Okay, ONE time!`], dry: [`Define cry.`], odd: [`Only when I watched my own confessionals back.`] }));
        beat(`The hammer stays up. The truth.`);
      } else {
        say(otherHost, `${t.setup.replace(/\s+$/, '')} True or false?`);
        const aff = (t.affectedPlayers || []).find(n => gallery.includes(n));
        if (t.toldTruth) {
          say(g, V(g, 'truth', { soft: [`...Yeah. It's true. I'm not proud of it.`], sharp: [`True. And I'd do it again.`], loud: [`Yeah, okay?! I did it! It's a game!`], dry: [`True. Next question.`], odd: [`True! I'm an open book! A slightly guilty book!`] }));
          beat(`The hammer stays up. The truth.`);
          if (aff) say(aff, V(aff, 'truthhurt', { any: [`I knew it. I KNEW it.`], soft: [`Wow. Okay.`], sharp: [`Noted.`], dry: [`Called it.`] }));
        } else {
          say(g, V(g, 'lie', { soft: [`What? No! I would never!`], sharp: [`That's not how it happened, and you know it.`], loud: [`False! Totally false!`], dry: [`That's taken out of context.`], odd: [`Lies! Slander! I wasn't even there!`] }));
          beat(`The hammer swings down and knocks ${g} clean off the couch!`, { act: 'hammer', applause: 'big' });
          if (aff) say(aff, V(aff, 'liehurt', { any: [`I knew it!`], loud: [`HA! Liar!`], sharp: [`And there it is.`], soft: [`I can't believe you lied about that.`] }));
          say(g, V(g, 'hit', { soft: [`Ow. Okay. Okay, it was true.`], sharp: [`Fine. It was true. Happy?`], loud: [`OW! Fine! It was me!`], dry: [`I'd like to change my answer.`], odd: [`Worth it!`] }));
        }
      }
    }

    // to the gallery
    say(leadHost, pick([`${g}, everybody!`, `Give it up for ${g}!`, `${g}, ladies and gentlemen!`, `Thanks, ${g}! Everybody, ${g}!`], 'out'));
    beat(`${g} takes a seat in the Peanut Gallery.`, { applause: 'small' });
    if (!gallery.includes(g)) gallery.push(g);
    // the debate lands after the first guest, like the show's own
    if (gi === 0) debate();
  });
  debate();

  // ═══ THAT'S GONNA LEAVE A MARK ═══
  const flops = [];
  for (const h of hist) {
    if (h.num <= (gs.aftermathMarkEp || 0)) continue;
    const sc = h.chalMemberScores || {};
    const ranked = Object.keys(sc).sort((p, q) => (sc[p] || 0) - (sc[q] || 0));
    if (ranked[0] && (h.challengeLabel || '').trim()) flops.push({ n: ranked[0], ep: h.num, chal: h.challengeLabel });
  }
  const marks = flops.filter((x, i) => flops.findIndex(y => y.n === x.n) === i).slice(-3);
  if (marks.length) {
    gs.aftermathMarkEp = Math.max(...marks.map(m => m.ep));
    shot('stage-wide', wideSeats());
    say(HB, pick([`Speaking of getting hurt, it's time for everybody's favorite segment...`, `And now, the segment you've all been waiting for...`, `You know what time it is...`], 'markopen'));
    say(HA, `That's Gonna Leave a Mark!`, { loud: true });
    beat(`The audience cheers.`, { applause: 'big' });
    marks.forEach((m, i) => {
      shot('clip', {}, { shot: { ep: m.ep, chal: true, players: [m.n] }, clip: true, ...(i === 0 ? { title: { kicker: 'Segment', name: "That's Gonna Leave a Mark" } } : {}) });
      say(i % 2 ? HA : HB, pick([`Here's ${m.n} at ${m.chal}, finishing dead last. Watch this. Ooh!`, `${m.n}, ${m.chal}. Dead last, and somehow the replay is even worse than it sounds.`, `And here's ${m.n} giving ${m.chal} everything. Which, in this case, was not enough.`, `${m.chal}. ${m.n}. I don't even know what to call that.`, `Let's go to ${m.chal}, where ${m.n} had a very, very bad day.`], 'mark'));
      say(i % 2 ? HB : HA, i === marks.length - 1 ? `Now THAT's gonna leave a mark!` : pick([`Oof.`, `I can't watch. Play it again.`, `That one hurt me.`, `Ow. Just, ow.`], 'markr'));
      if (gallery.includes(m.n)) say(m.n, V(m.n, 'mark', { soft: [`Why would you show that?!`, `Please stop playing that.`], sharp: [`Thank you. For that.`, `Was that necessary?`], loud: [`That was rigged and you know it!`, `Hey! I was injured!`], dry: [`Great. Love reliving it.`, `My finest hour.`], odd: [`I'd like a copy of that, please.`, `Can we see it in slow motion?`] }));
    });
  }

  // ═══ THE FANS ═══
  if (a.fanCall?.exchanges?.length) {
    const fc = a.fanCall;
    shot('stage-wide', wideSeats(), { title: { kicker: 'On webcam', name: fc.fanName || 'A fan' } });
    say(HA, pick([`We've got a fan on webcam! ${fc.fanName || 'Hi'}, you're on the Aftermath!`, `Time to check in on our webcams! ${fc.fanName || 'Hello'}, you're live!`, `We've got ${fc.fanName || 'a fan'} on the line!`], 'webcam'));
    for (const x of fc.exchanges) {
      // (the engine's lines can carry a stage direction in brackets: never read aloud)
      const clean = t => String(t || '').replace(/\[[^\]]*\]\s*/g, '').replace(/^"|"$/g, '').trim();
      beat(`${fc.fanName || 'The fan'}: "${clean(x.q)}"`, { act: 'webcam' });
      if (fc.target && clean(x.a)) say(fc.target, clean(x.a));
    }
    say(HB, pick([`Thanks, ${fc.fanName || 'buddy'}!`, `Love the fans! Thanks, ${fc.fanName || 'buddy'}!`, `Okay! Thank you, ${fc.fanName || 'buddy'}!`], 'webcambye'));
  }
  if (a.fanVote?.results?.length) {
    shot('stage-wide', wideSeats(), { title: { kicker: 'The fans have voted', name: 'Who comes back?' } });
    say(HB, `The fans have voted, and one of the people on that couch is getting back in the game.`);
    [...a.fanVote.results].reverse().forEach(r => beat(`${r.name}: ${r.pct}% of the vote.`, { tense: r.name === a.fanVote.winner }));
    say(HA, `${a.fanVote.winner}, you're going back in!`);
    beat(`The studio erupts.`, { applause: 'big' });
  }

  // ═══ THE REUNION: the winner, the runner-up, the jury, the season's feud and its betrayal, the awards ═══
  // (written from the finale's own record: who won, the jury's votes and why, who led which boot,
  // the storylines; never the engine's interview templates)
  if (a.isReunion) {
    const W = ep.winner || null;
    const fins = [...new Set([...(ep.finaleFinalists || []), ...(gs.activePlayers || [])])].filter(Boolean);
    const jv = ep.juryResult?.votes || {};
    const why = ep.juryResult?.reasoning || [];
    const ledBoots = n => hist.filter(h => (h.tribalStory?.booth || []).some(b => b.voter === n && b.role === 'lead' && b.voted === h.eliminated)).map(h => ({ boot: h.eliminated, ep: h.num, blind: !!h.tribalStory?.blindside }));
    const wins = n => gs.chalRecord?.[n]?.wins || 0;
    if (W) {
      shot('couch-front', { [HA]: 'hA', [W]: 'g', [HB]: 'hB' }, { title: { kicker: 'The winner', name: W } });
      say(HA, pick([`And now, the one you've all been waiting for. Our winner, ${W}!`, `Please welcome the winner of this season, ${W}!`, `And here they are, the last one standing. ${W}!`], 'rwin'));
      beat(`The studio is on its feet for ${W}.`, { applause: 'big', act: 'arrive' });
      const myVotes = jv[W] || 0, total = Object.values(jv).reduce((x, y) => x + y, 0);
      say(HB, total ? `${Cap(num(myVotes))} out of ${num(total)} jury votes. ${W}, how does it feel?` : `${W}, you won the whole thing. How does it feel?`);
      say(W, V(W, 'rwin-feel', {
        soft: [`Honestly? I still don't believe it. I keep waiting for somebody to tell me it was a mistake.`, `I cried for about three days. Happy crying. Mostly.`],
        sharp: [`Exactly how I knew it would feel. Earned.`, `Like the right result. I said it on day one, and nobody listened.`],
        loud: [`AMAZING! I'm still screaming! Inside! And sometimes outside!`, `Unreal! I won! Me! I WON!`],
        dry: [`Good. Very good. I've been sleeping in a real bed, which helps.`, `Better than losing. I've checked.`],
        odd: [`Like eating the biggest cake in the world, and then finding a second cake.`, `I bought a hat with the money. Just one hat. For now.`],
      }));
      const led = ledBoots(W);
      const big = led.find(x => x.blind) || led[led.length - 1];
      say(HA, big ? `Let's talk about episode ${num(big.ep)}. You took out ${big.boot}. Was that the move that won it?` : wins(W) >= 2 ? `${Cap(num(wins(W)))} challenge wins. Was it the challenges that won it for you?` : `You flew under the radar for most of this game. Was that the plan all along?`);
      say(W, big ? V(W, 'rwin-move', { soft: [`It was the hardest vote I ever cast. ${big.boot} was my friend. But yes.`], sharp: [`Obviously. ${big.boot} was the biggest threat out there, and I handled it.`], loud: [`YES! That night, I knew! I just knew!`], dry: [`That and a lot of quiet conversations nobody saw.`], odd: [`I like to think it was my charm. But it was probably that.`] })
        : wins(W) >= 2 ? V(W, 'rwin-chal', { soft: [`They kept me safe when I needed it most.`], sharp: [`When they can't vote you out, they have to watch you win.`], loud: [`Can't vote me out if I keep winning!`], dry: [`It helps when nobody can write your name down.`], odd: [`I'm just really good at running into things!`] })
        : V(W, 'rwin-radar', { soft: [`I just tried to be a good person out there, and somehow it worked.`], sharp: [`Of course. Let them fight each other. I'll be over here, winning.`], loud: [`Plan? I had no plan! But it worked!`], dry: [`If nobody's looking at you, nobody's voting for you.`], odd: [`I was hiding in plain sight. Mostly in the bushes.`] }));
      // the runner-up: how close it was, and the vote they thought they had
      const runner = fins.filter(n => n !== W).sort((x, y) => (jv[y] || 0) - (jv[x] || 0))[0];
      if (runner) {
        shot('couch-front', { [HA]: 'hA', [runner]: 'g', [HB]: 'hB' }, { title: { kicker: 'Runner-up', name: runner } });
        say(HB, `And our runner-up, ${runner}!`);
        beat(`Big applause for ${runner}.`, { applause: 'big' });
        say(HA, (jv[runner] || 0) ? `${Cap(num(jv[runner]))} ${jv[runner] === 1 ? 'vote' : 'votes'}. So close. What happened?` : `${runner}, you made it all the way to the end. What happened?`);
        const gap = Math.max(1, (jv[W] || 0) - (jv[runner] || 0));
        say(runner, V(runner, 'ru', {
          soft: [`I don't know. I think they just liked ${W} more. And that's okay. It really is.`, `I gave it everything. It just wasn't enough at the end.`],
          sharp: [`The jury got it wrong. I'll be polite about it, but they got it wrong.`, `A bitter jury happened.`],
          loud: [`I got robbed! On national television!`, `I was RIGHT there! RIGHT THERE!`],
          dry: [`About ${num(gap)} ${gap === 1 ? 'vote' : 'votes'} happened.`, `${W} happened.`],
          odd: [`I think the jury mixed up our names. That's my theory and I'm sticking to it.`, `I was distracted by how nice the final set was.`],
        }));
        // the juror they were sure of, who wasn't sure of them
        const turned = why.filter(r => r.votedFor === W && bond(runner, r.juror) >= 3).map(r => r.juror)[0];
        if (turned) {
          say(HB, `Was there a vote you were counting on?`);
          say(runner, V(runner, 'ru-who', { soft: [`${turned}. I really thought ${turned} was with me.`], sharp: [`${turned}. And ${turned} knows exactly why I'm saying that.`], loud: [`${turned}! I thought we were friends!`], dry: [`${turned}. That one stung.`], odd: [`${turned}! I even let ${pr(turned).obj} borrow my good pillow!`] }));
          if (!gallery.includes(turned)) gallery.push(turned);
          shot('gallery-side', gallerySeats([turned]));
          say(turned, V(turned, 'juror', { soft: [`I'm sorry, ${runner}. I just thought ${W} played the better game. It wasn't personal.`], sharp: [`I voted for the best game. Friendship doesn't win a million dollars.`], loud: [`It was a hard call! I agonized! For like a whole minute!`], dry: [`I voted for the game, not the friendship.`], odd: [`I flipped a coin. Kidding! Mostly kidding.`] }));
          addBond(runner, turned, -0.5);
        }
      }
      // the jury: one who voted against the winner says why
      const against = why.filter(r => r.votedFor !== W && r.juror && !fins.includes(r.juror)).map(r => r.juror)[0];
      if (against) {
        if (!gallery.includes(against)) gallery.push(against);
        shot('gallery-side', gallerySeats([against]), { title: { kicker: 'The jury speaks', name: `Why not ${W}?` } });
        say(HA, `${against}, you didn't vote for ${W}. Why not?`);
        const led2 = led.find(x => x.boot === against);
        say(against, led2 ? V(against, 'jagainst-me', { any: [`${W} voted me out in episode ${num(led2.ep)}, and then wanted my vote. That's not how it works.`], soft: [`${W} sent me home. I tried to let it go. I couldn't.`], loud: [`${W} took me out! And then asked for my vote?! No!`] })
          : V(against, 'jagainst', { soft: [`I just felt ${W} didn't own ${pr(W).posAdj} game at the end.`], sharp: [`${W} got carried. Someone had to say it.`], loud: [`Because I didn't want to! Next question!`], dry: [`I voted for the game I respected more. Simple.`], odd: [`I was voting for vibes. ${W} had bad vibes.`] }));
        say(W, V(W, 'jreply', { soft: [`That's fair. I'm still grateful you were on that jury.`], sharp: [`And yet, here I am. With the money.`], loud: [`Still won, though!`], dry: [`Noted. Also, I won.`], odd: [`I'll send you a postcard from my yacht!`] }));
        beat(`The gallery goes "Ooooh."`);
      }
    }
    // the season's longest feud, face to face
    const feud = (gs.tdStory?.lines || []).filter(l => l.type === 'rivalry' && l.people.length >= 2).sort((x, y) => y.steps.length - x.steps.length)[0];
    if (feud && feud.steps.length >= 2) {
      const [fx, fy] = feud.people;
      [fx, fy].forEach(n => { if (!gallery.includes(n)) gallery.push(n); });
      shot('gallery-side', gallerySeats([fx, fy]), { title: { kicker: 'The reunion', name: `${fx} vs. ${fy}` } });
      say(HB, `Okay. ${fx}. ${fy}. You two have been at it since episode ${num(feud.since || feud.steps[0].ep)}. Is there anything left to say?`);
      say(fx, V(fx, 'feud1', { soft: [`I just wish it hadn't gotten so ugly. I don't even remember how it started.`], sharp: [`Plenty. But I'll keep it short. ${fy} was the worst part of my summer.`], loud: [`Oh, there's a LOT left to say!`], dry: [`I think we've covered it. Repeatedly. On camera.`], odd: [`I wrote a speech! It's eleven pages!`] }));
      say(fy, V(fy, 'feud2', { soft: [`For what it's worth, I'm sorry about how I talked to you.`], sharp: [`Funny. I was going to say the same thing about you.`], loud: [`You started it, and you know it!`], dry: [`Please don't read the speech.`], odd: [`I also wrote a speech! Mine has drawings!`] }));
      say(HA, `So, can you two make peace? Right here, right now?`);
      if (bond(fx, fy) > -3) { beat(`${fx} and ${fy} look at each other. Then, slowly, they shake hands.`, { applause: 'big' }); addBond(fx, fy, 1); }
      else { say(fx, V(fx, 'nopeace', { any: [`No.`], soft: [`Maybe someday. Not today.`], loud: [`Absolutely not!`], dry: [`Let's not get carried away.`] })); beat(`The gallery groans.`); }
    }
    // the betrayal that never got settled
    const kn = Object.entries(gs.aftermathKnown || {}).find(([g2, t2]) => t2 && g2 !== W);
    if (kn) {
      const [vic, trt] = kn;
      [vic, trt].forEach(n => { if (!gallery.includes(n)) gallery.push(n); });
      shot('gallery-side', gallerySeats([vic, trt]), { title: { kicker: 'Unfinished business', name: `${vic} and ${trt}` } });
      say(HA, `${vic}, the last time you were on this show, you found out ${trt} voted you out. ${trt} is sitting right there.`);
      say(vic, V(vic, 'betr1', { soft: [`I know. I've been looking at the floor all night so I don't have to look at you, ${trt}.`], sharp: [`I'm aware. I've been aware for weeks.`], loud: [`Oh, I KNOW! I saw ${pr(trt).obj} the second I walked in!`], dry: [`Yes. We've been avoiding eye contact professionally.`], odd: [`I brought a sign! It says "${trt}, why?"`] }));
      say(trt, V(trt, 'betr2', { soft: [`I'm so sorry. I hated doing it. I still think about it.`], sharp: [`It was the right move. I'd make it again. I'm sorry it hurt.`], loud: [`It was a GAME! I said I was sorry! Didn't I?`], dry: [`In my defense, it worked.`], odd: [`I'm sorry! I made you a friendship bracelet! It's a little late!`] }));
      beat(bond(vic, trt) > -2 ? `${vic} thinks about it, and nods.` : `${vic} doesn't say anything. ${Cap(pr(vic).sub)} ${pr(vic).sub === 'they' ? "don't" : "doesn't"} have to.`);
    }
    // the couples
    const sm = (gs.showmances || []).find(s => (s.players || []).length === 2);
    if (sm) {
      const [p1, p2] = sm.players;
      [p1, p2].forEach(n => { if (!gallery.includes(n)) gallery.push(n); });
      shot('gallery-side', gallerySeats([p1, p2]));
      say(HB, `And the question everybody's been asking. ${p1}, ${p2}. Are you two still together?`);
      if (sm.breakupEp) { say(p1, V(p1, 'sm-no', { soft: [`No. But we're okay. I think.`], sharp: [`No. And I'm thriving.`], loud: [`NOPE!`], dry: [`That would be a no.`], odd: [`We're on a break! A permanent one!`] })); say(p2, V(p2, 'sm-no2', { any: [`Yeah. We're good, though.`], sharp: [`Moving on.`], soft: [`It was really special while it lasted.`] })); }
      else { say(p1, V(p1, 'sm-yes', { soft: [`We are! Six weeks and counting.`], sharp: [`Obviously.`], loud: [`YES! Look at us!`], dry: [`Against all odds, yes.`], odd: [`We're getting matching sweaters!`] })); beat(`The audience goes "Awww."`, { applause: 'small' }); }
    }
    if ((a.awards || []).length) {
      shot('stage-wide', wideSeats(), { title: { kicker: 'The reunion', name: 'The awards' } });
      say(HB, pick([`And now, the awards nobody asked for!`, `It's awards time! Try to act surprised.`], 'awopen'));
      a.awards.forEach((aw, i) => {
        beat(`${aw.title}...`, { tense: true });
        say(i % 2 ? HB : HA, `${aw.winner}!`);
        beat(`Applause for ${aw.winner}.`, { applause: 'big' });
        if (typeof aw.winner === 'string' && cast.includes(aw.winner)) say(aw.winner, V(aw.winner, `award${i % 3}`, { soft: [`Oh my gosh, thank you!`, `I don't know what to say!`, `This means so much!`], sharp: [`Finally, some recognition.`, `Deserved.`, `I'll put it with the others.`], loud: [`YES! Let's GO!`, `I WON SOMETHING!`, `Woo! Thank you!`], dry: [`Thank you. I'll treasure it for about a week.`, `Wow. Okay. Thanks.`, `I'd like to thank nobody.`], odd: [`I'm going to sleep with this under my pillow!`, `Is it edible? It looks edible.`, `I'd like to thank my mom, my dog, and my lucky socks.`] }));
      });
    }
  }

  // ═══ THE SIGN-OFF ═══
  shot('stage-wide', wideSeats());
  say(HA, a.isReunion ? `And that's the season! Thank you, everybody, for an unforgettable summer.` : pick([`That's all the time we've got!`, `And that's our show!`, `That's it for this Aftermath!`], 'close'));
  if (a.isReunion) say(HB, V(HB, 'bye-r', { any: [`See you next season, everybody!`], loud: [`That's a wrap! See you next season! Woo!`], dry: [`See you next season. Same couch, probably.`], soft: [`We love you all. See you next season!`] }));
  else say(HB, V(HB, 'bye', { any: [`Don't forget to join ${host} next time for the most dramatic episode yet of Total Drama!`, `Join ${host} next time on Total Drama!`], loud: [`Join ${host} next time on Total! Drama! Woo!`, `See you next time! Total Drama!`], dry: [`Join ${host} next time on Total Drama. We'll be here, on the couch.`, `Join ${host} next time. We'll be right here.`] }));
  if (blocks.some(b => b.lines.some(l => l.act === 'hammer'))) say(HA, pick([`And can somebody please put that hammer away?`, `Somebody get that hammer off the stage!`], 'hammerbye'));
  beat(`The audience cheers as the lights go down.`, { applause: 'big' });

  gs.aftermathLines = [...mem];
  return { hosts: gs.aftermathHosts.map(h => ({ ...h })), blocks };
}
