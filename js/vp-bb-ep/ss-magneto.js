// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-magneto.js — the prime's packages (the "magnétos")
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-28: "magnétos during the prime, those were really good, especially with their title
// screens". The real prime breaks its live segments with packages: the host throws to one ("let's look back
// at…"), a title card fills the screen, and the narrator tells one storyline of the week over the housemates'
// own moments, back to the studio for the reaction. Built here from the week's own acts, one storyline each
// (the hunt, love, a clash, a mission, the nominees' week), never more than three a night.

const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickBy = (arr, key) => arr[hash(key) % arr.length];
const money = n => `$${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
const listOf = xs => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const xs = n => (n <= 1 ? [50] : Array.from({ length: n }, (_, i) => Math.round(24 + (52 * i) / (n - 1))));
const at = (plate, set, room, who) => ({ set, plate, room, cam: 1, kicker: 'The week, on tape', cast: who.filter(Boolean).map((n, i, a) => [n, xs(a.length)[i]]) });
const STUDIO = { set: 'studio-wide', plate: 'ss-studio', room: 'The Prime Studio', cam: 1, kicker: 'Live · The Prime Studio', cast: [] };
import { tellAfter } from '../ss/tells.js';
import { secretAs } from './ss-words.js';

/** The week's storylines, as packages: { key, title, sub, lines: [{ t, scene, dr? }], back }. */
function storylines(row, noms) {
  const acts = row.acts || [];
  const week = row.num || 1;
  const out = [];
  // the hunt: a buzz, right or wrong
  const buzz = acts.filter(a => a?.type === 'ss-buzz' && a.outcome !== 'withdrawn');
  if (buzz.length) {
    const b = buzz.find(x => x.outcome === 'right') || buzz[0];
    const right = b.outcome === 'right';
    // (the whole hunt, as the week played it: the user, 2026-10-29, "this tape is super short for no reason")
    const tell = acts.filter(a => a?.type === 'ss-hunt').flatMap(a => a.moments || []).find(m => m.kind === 'tell' && m.who === b.by && m.about === b.target);
    const clue = acts.find(a => a?.type === 'ss-clue' && (a.holders || []).includes(b.target) && a.clue);
    const house = (row.houseAtStart || []).filter(n => n !== b.by && n !== b.target);
    const guess = b.guess ? secretAs(b.target, b.guess) : `${b.target} is hiding something big`;
    out.push({ key: 'hunt', title: right ? `${b.by} cracks ${b.target}` : `${b.by}'s gamble`, sub: 'The hunt', who: [b.by, b.target], sym: 'VS',
      lines: [
        { t: pickBy([`This week, ${b.by} couldn't stop watching ${b.target}.`, `For days, ${b.by} had only one name in mind: ${b.target}.`], `${week}|mh0`), scene: at('living-sofas', 'ceremony', 'Living Room', [b.by, b.target]) },
        ...(tell ? [{ t: `${b.target} ${tellAfter(tell.tell)}. And ${b.by} saw it.`, scene: at('patio', 'yard', 'The Garden', [b.target, b.by]) },
          { dr: b.by, t: pickBy([`Every time. Every single time. That's not a habit, that's a secret.`, `Nobody else noticed. I noticed.`], `${week}|mh1`), scene: at('confessional-close', 'dr', 'Confessional', [b.by]) }] : []),
        ...(clue ? [{ t: `Then the Voice put a clue on the table: ${clue.clue}.`, card: { text: clue.clue, state: 'clue', who: 'The clue' }, scene: at('living-sofas', 'ceremony', 'Living Room', [b.by, b.target, ...house.slice(0, 3)]) },
          { dr: b.by, t: pickBy([`The second I read that clue, I looked at ${b.target}. And ${b.target} looked away.`, `That clue sealed it for me.`], `${week}|mh2`), scene: at('confessional-close', 'dr', 'Confessional', [b.by]) }] : []),
        { dr: b.target, t: pickBy([`I could feel ${b.by} watching me. All week.`, `Everywhere I went, ${b.by} was there. Asking questions.`], `${week}|mh3`), scene: at('confessional-close', 'dr', 'Confessional', [b.target]) },
        { t: `So ${b.by} went to the confessional, alone, and pressed the buzzer.`, alarm: true, scene: at('confessional-close', 'dr', 'Confessional', [b.by]) },
        { dr: b.by, t: `I think ${guess}. I was sure of it. Completely sure.`, scene: at('confessional-close', 'dr', 'Confessional', [b.by]) },
        { t: pickBy([`Face to face on the confessional sofas, ${b.target} denied everything.`, `In the confessional, ${b.target} looked ${b.by} in the eye and said nothing. Nothing that helped.`], `${week}|mh4`), scene: at('confessional-showdown', 'dr', 'Confessional', [b.by, b.target]) },
        { outcome: true, t: right ? `And ${b.by} was right. ${b.target}'s secret was out, and ${money(b.took)} changed hands.` : `And ${b.by} was wrong. Five thousand dollars, gone, and ${b.target} knows exactly who came for them.`, scene: at('living-sofas', 'ceremony', 'Living Room', [b.by, b.target, ...house.slice(0, 4)]) },
        right ? { outcome: true, dr: b.target, t: pickBy([`Weeks of keeping it, and ${b.by} takes it in one afternoon. And my money.`, `I'm gutted. But I'll say it: well played, ${b.by}.`], `${week}|mh5`), scene: at('confessional-close', 'dr', 'Confessional', [b.target]) }
          : { outcome: true, dr: b.by, t: pickBy(['Wrong. In front of everybody. I want the ground to swallow me.', `Five thousand dollars to make ${b.target} my enemy. Great week.`], `${week}|mh5`), scene: at('confessional-close', 'dr', 'Confessional', [b.by]) },
        ...(house[0] ? [{ dr: house[0], t: pickBy([`After that, everybody in this house checks who's watching them.`, `That buzz changed the whole house. Nobody trusts anybody now.`], `${week}|mh6`), scene: at('confessional-close', 'dr', 'Confessional', [house[0]]) }] : []),
      ] });
  }
  // love: a kiss at the party
  const party = acts.find(a => a?.type === 'ss-party');
  const kiss = party && (party.moments || []).find(m => m.kind === 'kiss');
  if (kiss) {
    const [x, y] = kiss.who;
    const story = acts.filter(a => a?.type === 'ss-love' && [a.a, a.b].includes(x) && [a.a, a.b].includes(y));
    const jealous = (party.moments || []).find(m => m.kind === 'jealous');
    out.push({ key: 'love', title: `${x} and ${y}`, sub: 'Love in the House of Secrets', who: [x, y], sym: '♥',
      lines: [
        ...story.filter(a => a.kind === 'confession' && a.yes).map(() => ({ t: `One night by the pool, ${x} said it first. And ${y} said it back.`, scene: at('pool-loungers', 'yard', 'The Pool', [x, y]) })),
        { t: pickBy([`It started with a look, across the kitchen.`, `Nobody saw it coming. Except, maybe, the two of them.`], `${week}|ml0`), scene: at('kitchen-room', 'kitchen', 'Kitchen', [x, y]) },
        { t: `Then came ${String(party.name || 'the party').replace(/^The /, 'the ')}.`, scene: at('living-sofas', 'ceremony', 'Living Room', [x, y]) },
        { dr: x, t: pickBy([`I wasn't supposed to fall for anybody in here. That was the plan.`, `I don't know what this is yet. But I know I like it.`], `${week}|ml1`), scene: at('confessional-close', 'dr', 'Confessional', [x]) },
        { t: `And in front of the whole house, ${x} and ${y} kissed.`, scene: { ...at('pool-wide', 'yard', 'The Garden', [x, y]), party: true } },
        { dr: y, t: pickBy([`Everybody saw. I don't care. I'd do it again.`, `I've been trying to hide it for a week. Not any more.`], `${week}|ml2`), scene: at('confessional-close', 'dr', 'Confessional', [y]) },
        ...(jealous ? [{ t: `Not everybody was happy for them. ${jealous.who[0]} went to bed early.`, scene: at('bedroom-wide', 'bedroom', 'Bedroom', [jealous.who[0]]) }] : []),
        ...(story.some(a => a.kind === 'loveroom') ? [{ t: `And the Voice gave them a night in the Love Room.`, scene: at('hoh-suite', 'hoh', 'The Love Room', [x, y]) }] : []),
        { t: pickBy([`A new couple in the House of Secrets. And in this game, a couple is a target.`, `Love, in a house full of secrets. What could go wrong?`], `${week}|ml3`), scene: at('living-sofas', 'ceremony', 'Living Room', [x, y]) },
      ] });
  }
  // a clash: a fight at the party, or a sanction from the Voice
  const fight = party && (party.moments || []).find(m => m.kind === 'fight');
  const rule = acts.find(a => a?.type === 'ss-rule' && a.who);
  if (fight) {
    const [x, y] = fight.who;
    out.push({ key: 'clash', title: `${x} versus ${y}`, sub: 'The clash', who: [x, y], sym: 'VS',
      lines: [
        { t: pickBy([`Between ${x} and ${y}, it had been simmering for days.`, `${x} and ${y} had been avoiding each other all week.`], `${week}|mc0`), scene: at('kitchen-room', 'kitchen', 'Kitchen', [x, y]) },
        { t: `At ${String(party.name || 'the party').replace(/^The /, 'the ')}, it all came out.`, scene: at('living-sofas', 'ceremony', 'Living Room', [x, y]) },
        { dr: y, t: pickBy([`I've been biting my tongue since day one. Not any more.`, `${x} crossed a line. Simple as that.`], `${week}|mc1`), scene: at('confessional-close', 'dr', 'Confessional', [y]) },
        { dr: x, t: pickBy([`I said what everybody else was thinking. I'm not sorry.`, `Maybe I went too far. Maybe. ${y} still deserved it.`], `${week}|mc2`), scene: at('confessional-close', 'dr', 'Confessional', [x]) },
        { t: pickBy([`The next morning, ${x} and ${y} made breakfast without a word. The whole kitchen felt it.`, `Since that night, ${x} and ${y} have not been in the same room for more than a minute.`], `${week}|mc3`), scene: at('kitchen-room', 'kitchen', 'Kitchen', [x, y]) },
      ] });
  } else if (rule) {
    out.push({ key: 'clash', title: `${rule.who} and the Voice`, sub: 'The rules of the house',
      lines: [
        { t: `In the House of Secrets, the Voice hears everything.`, scene: at('living-screens', 'ceremony', 'Living Room', [rule.who]) },
        { t: rule.kind === 'reveal' ? `And this week, ${rule.who} said one sentence too many.` : rule.kind === 'contest' ? `And this week, ${rule.who} decided to argue with it.` : `And this week, ${rule.who} said a little too much.`, scene: at('living-sofas', 'ceremony', 'Living Room', [rule.who]) },
        { dr: rule.who, t: pickBy([`I know. I know. I just couldn't help myself.`, `Lesson learned. Expensive lesson, but learned.`], `${week}|mr`), scene: at('confessional-close', 'dr', 'Confessional', [rule.who]) },
      ] });
  }
  // the nominees' week
  if (noms.length) {
    out.push({ key: 'noms', title: noms.length === 2 ? `${noms[0]} or ${noms[1]}` : `${noms.length} in danger`, sub: "The nominees' week", who: noms.slice(), sym: noms.length === 2 ? 'OR' : '',
      lines: [
        { t: `When the Voice read out the names, ${listOf(noms)} knew the week would be long.`, scene: at('living-sofas', 'ceremony', 'Living Room', noms) },
        ...noms.slice(0, 2).map((n, i) => ({ dr: n, t: [`I'm trying to stay myself. That's all I can do now.`, `Every night I go to bed thinking it could be my last one in here.`, `I've got people out there. I hope they've got me too.`,
          `I keep looking at the camera and wondering who's watching.`, `I didn't sleep. I just lay there going over everything I've said this week.`, `Whatever happens, I don't want to leave on a bad day.`][(Number(week) * 2 + i) % 6], scene: at('confessional-close', 'dr', 'Confessional', [n]) })),
        { t: 'Tonight, the public decides.', scene: at('foyer', 'door', 'The Airlock', noms) },
      ] });
  }
  return out;
}

/**
 * The night's packages, as screens (up to three), each thrown to by the host and back to the studio.
 * @returns {Record<string, any>} key -> screen
 */
export function ssMagnetoScreens(act, ctx, host) {
  const row = ctx.row || {};
  const noms = act.nominees || [];
  const packs = storylines(row, noms).slice(0, 3);
  const out = {};
  packs.forEach((p, i) => {
    const k = `${ctx.week}|mag|${p.key}`;
    /** @type {any[]} */ const steps = [
      { k: 'host', by: host, scene: STUDIO, t: pickBy([`Let's look back at what happened this week. ${p.sub}.`, `Before we go on, a look back at the week. ${p.sub}.`, `Let's take a look at the tape.`], `${k}|in`) },
      { k: 'beat', t: p.title, magneto: { title: p.title, sub: p.sub, n: i + 1, who: p.who || [], sym: p.sym || '' }, scene: p.lines[0].scene },
    ];
    // (`outcome`: the buzz's answer, cut by steps.js when that answer is held for later on the prime)
    for (const l of p.lines) steps.push({ ...(l.dr ? { k: 'dr', by: l.dr, t: l.t, scene: l.scene } : { k: 'beat', t: l.t, scene: l.scene, ...(l.card ? { card: l.card } : {}), ...(l.alarm ? { alarm: true } : {}) }), ...(l.outcome ? { outcome: true } : {}) });
    steps.push({ k: 'beat', scene: STUDIO, t: pickBy(['Back in the studio, the crowd is on its feet.', 'The lights come back up on the studio. A long "ooooh" from the crowd.', 'Back live. The couch is shaking its head.'], `${k}|out`) },
      // (the host's word after a tape turns over through the season: one line eight times read as a jingle)
      { k: 'host', by: host, t: ['What a week. And it is not over yet.', "Well. I don't think anybody in that house will forget that one.", "You saw it, at home. And tonight, you'll decide what happens next.",
        "I watched that three times this afternoon. It doesn't get easier.", "And they still have to live together after that.", "Nobody saw that coming. Except you, maybe.",
        "Remember that when the lines open tonight.", "That's the House of Secrets for you."][((ctx.week || 0) * 3 + i) % 8] });
    out[p.key] = { id: `bb-ss-prime-mag-${p.key}-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: 'LIVE', ...STUDIO, sceneful: true,
      kicker: 'Live · The Prime Studio', title: p.title, label: `Tape: ${p.sub}`, sub: p.sub, steps };
  });
  return out;
}
