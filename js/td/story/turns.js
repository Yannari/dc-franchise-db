// ══════════════════════════════════════════════════════════════════════
// td/story/turns.js — a relationship turns on something somebody did
// ══════════════════════════════════════════════════════════════════════
// The follow-ups (followups.js) bring an aired moment back and react to which way the bond moved. This says WHY
// it moved: an aired setup between two people, then a real action between the same two at a later challenge
// (chalmoments.js: the engine's own record of who saved, sabotaged, betrayed or taunted whom), and the scene
// they have about it. The user's example, 2026-10-12: Heather mocked Aubrey's astrology on camera; at a later
// challenge Aubrey helped Heather; Heather has to thank her ("You're not going to make me thank the planets?").
//
// Setups (recorded only from scenes that survived the final edit, like the follow-ups):
//   mock    b sneered at a's thing (kit.clash: the kit's `thing`), or taunted a at a challenge (chm.taunt)
//   clash   a and b had it out (drama fight/clash/dispute, chm.clash)
//   defend  a stood up for b (friend.defend)
//   helped  a saved or carried b at a challenge (chm.saved)
//   pact    a and b made a deal (chm.pact)
// Developments (both of them there, so both know): a later challenge's moment (chalmoments.js) or one of the
// engine's own camp events between the two of them, sorted into help (x helped y) and harm (x did it to y), each
// with what it was, in the words of the one it happened to ({deed}: "sat with me when I was falling apart",
// "took the credit for my work"). Only the receiver says {deed}; nobody describes their own good deed.
// The turns (pool turn.<case>.any; a is the one the scene is about, b the other):
//   mockhelp     the mocked one helped the mocker: a mocked, b helped
//   mockamends   the mocker helped the one they mocked: a mocked and helped, b was mocked
//   mockagain    the mocker did it again at the challenge: a mocked twice, b has had enough
//   clashhelp    one of two who fought helped the other: a was helped, b helped
//   helpback     a helped b once; now b helped a: a is the one who returned it, b the first helper
//   defendbetray a stood up for b; b sabotaged or betrayed a at the challenge
//   helpbetray   a saved b; b sabotaged or betrayed a
//   pactbetray   a and b had a deal; b sabotaged or betrayed a
//   amends       a wronged b (a lie, stolen credit, blame) and has now helped b
//   confidebetray a told b something real (a secret, a weak moment); now b has turned on a
// Setups also include an aired wrong (lie, stolen credit, blame: 'wronged') and aired help at camp (comfort,
// teaching, the mentor arc). Data: {remark} the exact line from the setup (said by the setup's speaker), {thing}
// the kit's thing when the setup was about it, {deed} the development in the receiver's words. Each setup pays
// off once; a camp has one turn an episode. Measured first: two-person challenge moments exist on 6 episodes in
// 84, so the challenge alone gave no turns in six seasons; the camp's own events are where most of what people do is.
import { onCommit } from './commit.js';
import { gs } from '../../core.js';
import { campFeed } from './feed.js';
import { chalMoments } from './chalmoments.js';
import { kitOf } from './kits.js';
import { writeStory } from './write.js';

const book = () => ((gs.tdStory ||= {}).turns ||= []);
const pairKey = (x, y) => [x, y].sort().join('|');

// what one person did for or to another, in the words of the one it happened to (camp-events.js and the
// challenges: players[0] did it, players[1] had it done to them)
const HELP = { comfort: 'sat with me when I was falling apart', phobiaComfort: 'talked me through it when I was terrified', phobiaSupport: 'cheered me on when I had to face my fear',
  protectiveInstinct: 'stood up for me when people were having a go at me', teachingMoment: 'took the time to show me how to do it properly',
  mentorBond: 'started teaching me how to get by out here', loyaltyProof: 'kept a promise when it would have been easier to break it',
  silentSolidarity: 'stuck by me when nobody else would', sharedMeal: 'split a meal with me when food was short' };
// (an apology is not help: "And that's why you came and apologised to me?" / "No, this is the apology" read as two)
const HARM = { prank: 'pranked me in front of everybody', lie: 'lied to my face', stolenCredit: 'took the credit for my work', blame: 'blamed me in front of everybody',
  phobiaBlame: 'blamed me for losing', intimidation: 'tried to scare me off', passiveAggressive: 'took little shots at me all day',
  dispute: 'got into it with me in front of everybody', fight: 'got into a fight with me', hotheadExplosion: 'blew up at me', leadershipClash: 'tried to boss me around',
  foodConflict: 'went after me over food' };
const CHAL = { saved: ['help', c => `pulled me through ${c}`], sabotage: ['harm', c => `sabotaged me at ${c}`], betray: ['harm', c => `turned on me at ${c}`], taunt: ['harm', c => `made fun of me in front of everybody at ${c}`] };

/** After the final edit: every aired setup this camp showed today, for a later episode to pay off. */
export function recordTurns(ep, camp, out) {
  const list = book();
  const view = { ...ep, campStory: { ...(ep.campStory || {}), [camp]: out } };
  const said = (item, who) => (item.lines || []).filter(l => l.kind === 'say' && l.by === who).map(l => l.text);
  for (const phase of ['pre', 'post']) for (const [i, item] of campFeed(view, camp, phase).entries()) {
    const k = item?.kind || '', sk = item?.scene?.kind || '', ty = item?.type || '';
    const { a, b } = item?.scene?.who || {};
    if (!a || !b || a === b) continue;
    let s = null;
    if (k === 'kit.clash') s = { kind: 'mock', by: b, to: a, thing: kitOf(a)?.thing || null, remark: said(item, b)[0] };
    else if (k === 'chm.taunt' || ['prank', 'passiveAggressive', 'intimidation'].includes(ty)) s = { kind: 'mock', by: a, to: b, remark: said(item, a)[0] };
    else if (['lie', 'stolenCredit', 'blame', 'phobiaBlame'].includes(ty)) s = { kind: 'wronged', by: a, to: b, remark: said(item, a)[0] };
    else if (/friend\.defend|loyal\.defend/.test(sk) || ty === 'protectiveInstinct') s = { kind: 'defend', by: a, to: b, remark: said(item, a)[0] };
    else if (k === 'chm.saved' || /^arc\.mentor\./.test(k) || ['comfort', 'phobiaComfort', 'phobiaSupport', 'teachingMoment', 'mentorBond'].includes(ty))
      s = { kind: 'helped', by: a, to: b, remark: said(item, b)[0] || said(item, a)[0] };
    else if (k === 'chm.pact') s = { kind: 'pact', by: a, to: b, remark: said(item, a)[0] };
    // a told b something real (camp-events.js: secretShared, vulnerability; a kit's deep scene)
    else if (k === 'kit.deep' || ['secretShared', 'vulnerability'].includes(ty)) s = { kind: 'confide', by: a, to: b, remark: said(item, a)[0] };
    else if (k === 'chm.clash' || /^(drama\.(fight|clash|dispute))/.test(sk)) s = { kind: 'clash', by: a, to: b, remark: said(item, a)[0] };
    if (!s || !s.remark) continue;
    const id = JSON.stringify([ep.num, camp, phase, i, k]);
    if (list.some(t => t.id === id)) continue;
    // the newest setup between the same two people, of the same kind, replaces an older one not yet paid off
    for (const old of list) if (!old.done && old.kind === s.kind && pairKey(old.by, old.to) === pairKey(s.by, s.to)) old.done = true;
    list.push({ ...s, id, ep: ep.num, camp, done: false });
  }
  gs.tdStory.turns = list.filter(t => ep.num - t.ep <= 5);
}

/**
 * What two people of this camp did for or to each other, today and in the last three episodes, newest first:
 * [{ kind: 'help'|'harm', by, to, deed, ep, chal }]. Each episode's challenge moments (chalmoments.js) and every
 * camp's events (the two may have been on another team then). Only today's turn airs, but the thing it is about
 * may have happened since the setup on a day the two of them had no scene together.
 */
function developments(ep, members, chalOf, phase = 'post') {
  const out = [];
  const eps = [ep, ...[...(gs.episodeHistory || [])].filter(h => h.num < ep.num && ep.num - h.num <= 3).reverse()];
  for (const e of eps) {
    const add = (kind, by, to, deed, chal = false) => { if (by && to && by !== to && members.includes(by) && members.includes(to)) out.push({ kind, by, to, deed, chal: chal && e === ep, ep: e.num }); };
    const today = e === ep;
    // (the morning hasn't had its challenge or its afternoon yet)
    if (!(today && phase === 'pre')) for (const m of chalMoments(e)) if (m.players.length >= 2 && CHAL[m.kind]) add(CHAL[m.kind][0], m.players[0], m.players[1], CHAL[m.kind][1](today ? chalOf(e) : (e.challengeLabel || 'a challenge')), true);
    for (const c of Object.values(e.campEvents || {})) for (const ev of [...(c?.pre || []), ...(today && phase === 'pre' ? [] : c?.post || [])]) {
      const [x, y] = ev?.players || [];
      if (HELP[ev?.type]) add('help', x, y, HELP[ev.type]);
      else if (HARM[ev?.type]) add('harm', x, y, HARM[ev.type]);
    }
  }
  return out;
}

// which setup a development pays off, and who plays a and b (s the setup, d the development)
const MATCH = [
  ['mock', 'help', (s, d) => d.by === s.to && d.to === s.by, 'mockhelp', s => s.by, s => s.to],
  ['mock', 'help', (s, d) => d.by === s.by && d.to === s.to, 'mockamends', s => s.by, s => s.to],
  ['mock', 'harm', (s, d) => d.by === s.by && d.to === s.to, 'mockagain', s => s.by, s => s.to],
  ['wronged', 'help', (s, d) => d.by === s.by && d.to === s.to, 'amends', s => s.by, s => s.to],
  ['wronged', 'harm', (s, d) => d.by === s.by && d.to === s.to, 'mockagain', s => s.by, s => s.to],
  ['clash', 'help', (s, d) => pairKey(d.by, d.to) === pairKey(s.by, s.to), 'clashhelp', (s, d) => d.to, (s, d) => d.by],
  ['helped', 'help', (s, d) => d.by === s.to && d.to === s.by, 'helpback', s => s.to, s => s.by],
  ['defend', 'help', (s, d) => d.by === s.to && d.to === s.by, 'helpback', s => s.to, s => s.by],
  ['defend', 'harm', (s, d) => d.by === s.to && d.to === s.by, 'defendbetray', s => s.by, s => s.to],
  ['helped', 'harm', (s, d) => d.by === s.to && d.to === s.by, 'helpbetray', s => s.by, s => s.to],
  ['pact', 'harm', (s, d) => pairKey(d.by, d.to) === pairKey(s.by, s.to), 'pactbetray', (s, d) => d.to, (s, d) => d.by],
  ['confide', 'harm', (s, d) => d.by === s.to && d.to === s.by, 'confidebetray', s => s.by, s => s.to],
  // the one who started the fight started another (they said {remark}, so it is theirs to hear back)
  ['clash', 'harm', (s, d) => d.by === s.by && d.to === s.to, 'mockagain', s => s.by, s => s.to],
];
const BADGE = { mockhelp: ['Owe You One', 'green'], mockamends: ['Making Amends', 'green'], amends: ['Making Amends', 'green'], mockagain: ['Again?', 'red'], clashhelp: ['Truce?', 'green'],
  helpback: ['Even', 'green'], confidebetray: ['I Trusted You', 'red'], defendbetray: ['After Everything', 'red'], helpbetray: ['After Everything', 'red'], pactbetray: ['The Deal Is Off', 'red'] };
// the conversation's own consequence (the act itself already moved the bond)
const FX = { mockhelp: 1, mockamends: 0.75, amends: 0.75, mockagain: -1, clashhelp: 1, helpback: 1, confidebetray: -1.5, defendbetray: -1.5, helpbetray: -1.5, pactbetray: -2 };
const QUOTED = new Set(['mock', 'wronged', 'defend', 'clash']);
const SETUP_WORD = { mock: 'mocked', wronged: 'wronged', clash: 'fought with', helped: 'helped', defend: 'stood up for', pact: 'made a deal with', confide: 'confided in' };

/**
 * The turn this camp's day set up, if any: an aired setup from an earlier episode, and something one of the two
 * did to the other today. Returns the director's list item ({ at, item }) or null.
 */
export function turnScene(ep, camp, members, chal, next, factsForWho, phase = 'post', busy = new Set(), write = writeStory) {
  // (a pair already in a developing story today, a follow-up or an arc, waits: one chapter between two people a day)
  const open = book().filter(t => !t.done && t.ep < ep.num && members.includes(t.by) && members.includes(t.to) && !busy.has(pairKey(t.by, t.to)));
  if (!open.length) return null;
  for (const d of developments(ep, members, e => (e === ep ? chal : null) || e.challengeLabel || 'the challenge', phase)) {
    for (const [sk, dk, fits, kase, A, B] of MATCH) {
      if (d.kind !== dk) continue;
      // (the development came after the setup: a thing done before the mockery doesn't answer it)
      const s = open.filter(t => t.kind === sk && t.ep < d.ep && fits(t, d)).sort((p, q) => q.ep - p.ep)[0];
      if (!s) continue;
      const a = A(s, d), b = B(s, d);
      if (!a || !b || a === b) continue;
      const who = { a, b };
      // the remembered line is quoted back only when it is the point (the sneer, the defence, the lie, the fight) and
      // short enough to say again; read in played seasons: "You told me “I'm fine.”. Remember?"
      const quote = QUOTED.has(s.kind) && s.remark && s.remark.length <= 70 ? s.remark.trim().replace(/\.$/, '') : null;
      const data = { deed: d.deed, ...(quote ? { remark: quote } : {}), ...(s.thing ? { thing: s.thing } : {}) };
      const w = write(`turn.${kase}`, 'any', who, data, { ...factsForWho(who), pair: true, thing: !!s.thing, remark: !!quote },
        { ep: ep.num, camp, phase, n: next(), place: 'aside', unique: 'soft' });
      if (!w) continue;
      const [badge, cls] = BADGE[kase];
      // (one that happened at the challenge is part of the challenge talk; one from camp is the day's own story)
      return { at: d.chal ? 0.24 : 0.5, item: onCommit({ story: true, kind: `${d.chal ? 'chm.' : ''}turn.${kase}`, storyType: d.chal ? 'challenge' : 'arc', step: kase, players: [a, b], lines: w.lines, text: w.text, lineId: w.lineId,
        scene: { kind: 'turn', who, data, spot: w.spot ? { ...w.spot, window: 'afternoon' } : null }, badgeText: badge, badgeClass: cls,
        why: [`${s.by} ${SETUP_WORD[s.kind]} ${s.to}${s.thing ? ` (${s.thing})` : ''} on camera at episode ${s.ep}; ${d.ep === ep.num ? 'today' : `at episode ${d.ep}`} ${d.by} ${d.kind === 'help' ? 'helped' : 'turned on'} ${d.to}: "${d.deed}".`],
        fx: [[a, b, FX[kase]]] }, () => { s.done = true; }) };
    }
  }
  return null;
}
