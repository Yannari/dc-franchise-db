// ══════════════════════════════════════════════════════════════════════
// td/story/witness.js — the people watching a fight take a side, and it stays taken
// ══════════════════════════════════════════════════════════════════════
// The user's plan, 2026-10-12, step 2: "give group scenes lasting consequences: keep the central pair, but let
// actual witnesses take sides, reconsider someone, or carry tension into another conversation". Measured first:
// of 1067 aired scenes between two people or more, 294 had anybody else in them, and most of those were friendly
// (a running joke, a game, a win); a conflict in front of others aired about ten times a season, because most
// fights air between the two of them alone. So the witnesses are added to the conflict itself, every public one.
//
// Decide, then write (the rule the drag judging and The Circle follow): for each public conflict that survived
// the edit, the people at camp who care most about either side watch it, and each one's stance is decided from
// what they feel, proportionally (bonds, then temperament against boldness for whether they speak up at all):
//   side     c backs one of them           (witness.side: a is the one c backs, b the one c goes against)
//   turned   c backs one of them against somebody c likes   (witness.turned, same roles)
//   out      c stays out of it              (witness.out: a and b the two fighting)
// Their lines go in before the scene's closing confessional. Then it lasts:
//   - the bonds move (backing someone: closer to them, further from the other; staying out: a little further from both)
//   - the stance is recorded (gs.tdStory.witness), and the next morning the one they went against can have it out
//     with them (witness.after.<side|turned|out>: a is the one who was let down, b the witness), once a camp
//   - it becomes a setup for turns.js (a fight between the witness and the one they went against), so a later
//     real act between them pays it off
import { onCommit } from './commit.js';
import { gs } from '../../core.js';
import { getBond, addBond } from '../../bonds.js';
import { pStats as pStatsOf } from '../../players.js';
import { stableRng } from '../../script/rng.js';

const CONFLICT = /^(long\.)?(drama\.(fight|clash|dispute|explode|bomb|dig|intimidate|prank|jealous|nemesis)|crowd\.clash|blame\.loss|credit\.callout|fallout\.blame)/;
const CONFLICT_TYPE = new Set(['fight', 'dispute', 'hotheadExplosion', 'leadershipClash', 'blame', 'passiveAggressive', 'intimidation', 'prank', 'jealousy', 'nemesis', 'stolenCreditConfrontation']);
// (a row over food is mostly played for laughs: a witness taking it seriously reads wrong, so it is left out)
// one of them is doing it to the other (a jab, a threat, a prank, saying it out loud): a witness stands up for the one
// on the receiving end (witness.defend, a the target, b the one doing it) or goes along with it (witness.join, a the
// one doing it, b the target), not 'are you okay, you're upset' to the one who started it
const ONE_SIDED = /^(long\.)?drama\.(dig|intimidate|prank|bomb)|^(passiveAggressive|intimidation|prank|socialBomb)$/;
// (stirring sets two other people on each other: three parts already, and nobody watching is on anybody's side yet)
// a moment the two had alone is nobody else's business
const PRIVATE = /\b(pulls? .{1,30} (aside|away)|away from the others|out of earshot|nobody else (is|was) around|alone (with|together)|whisper|keeps? (his|her|their) voice down|lowers? (his|her|their) voice)/i;
const ROLES = ['c', 'd', 'e', 'f'];
const book = () => ((gs.tdStory ||= {}).witness ||= []);

/** Where c stands between a and b: 'a' | 'b' | 'out', and whether it means going against a friend. */
export function stanceOf(c, a, b, key) {
  const s = pStatsOf(c) || {};
  const jitter = (stableRng('td-witness', key, c, a, b)() - 0.5) * 1.5;
  const lean = getBond(c, a) - getBond(c, b) + jitter;
  // the calm hold back and the bold speak up: the same feelings take more to say out loud for a calm person
  const bar = Math.max(0.4, 1.2 + ((s.temperament ?? 5) - (s.boldness ?? 5)) * 0.12);
  if (Math.abs(lean) < bar) return { side: 'out', turned: false };
  const side = lean > 0 ? 'a' : 'b', against = side === 'a' ? b : a;
  return { side, turned: getBond(c, against) >= 2 };
}

/**
 * After the final edit: every public conflict this camp aired today gets its witnesses. Mutates the aired scenes
 * (their lines and who), applies the bonds on the live episode, and records the stances.
 */
// fight scenes that end with nobody hurt (director.js has the same list for the room's reaction)
const CALM_ENDS = new Set(['ndo.hh4']);

export function witnessConflicts(ep, camp, out, members, write, factsForWho, live) {
  let n = 7300;
  // the scenes themselves, not campFeed's view of them (it copies an engine moment that carries a storyline tag, and
  // lines added to a copy would never air while the bonds they cost still moved)
  const block = ep.campEvents?.[camp] || {};
  const itemOf = (phase, it) => it?.story ? it : it?.ref != null ? (Array.isArray(block) ? (phase === 'pre' ? block : []) : block[phase] || [])[it.ref] : null;
  const isConflict = item => { const sk = item?.scene?.kind || '', k = item?.kind || '', ty = item?.type || ''; return CONFLICT.test(sk) || CONFLICT.test(k) || CONFLICT_TYPE.has(ty); };
  // the pairs who fought today: nobody backs somebody who went after them that same day (read 2026-10-14, carnival:
  // Logan told Benji he was the slowest and split a log at him in the morning, and in the afternoon Benji "walks over
  // and stands next to Logan without being asked")
  const pk = (x, y) => [x, y].sort().join('|');
  const fought = new Set();
  for (const phase of ['pre', 'post']) for (const it of out[phase] || []) {
    const item = itemOf(phase, it), w = item?.scene?.who || {};
    if (item && isConflict(item) && w.a && w.b) fought.add(pk(w.a, w.b));
  }
  for (const phase of ['pre', 'post']) for (const it of out[phase] || []) {
    const item = itemOf(phase, it);
    if (!item) continue;
    const sk = item?.scene?.kind || '', k = item?.kind || '', ty = item?.type || '';
    if (!isConflict(item)) continue;
    const who = item.scene?.who || {};
    const { a, b } = who;
    const lines = item.lines || [];
    if (!a || !b || a === b || !lines.length || item._witnessed) continue;
    // (a row that ended friendly has nothing to take sides in: "Even me?" "Not you, you're fine", then "Do you actually
    // enjoy this?" from somebody watching, read 2026-10-14)
    if (CALM_ENDS.has(item.lineId)) continue;
    if (lines.some(l => l.kind === 'beat' && PRIVATE.test(l.text || ''))) continue;
    item._witnessed = true;
    const inScene = new Set(Object.values(who).filter(Boolean));
    const spoke = new Set(lines.filter(l => l.by && l.kind !== 'beat').map(l => l.by));
    const key = `${ep.num}|${camp}|${phase}|${a}|${b}`;
    // somebody already in it (a fight pulls in b's closest friend, director.js PULL 'side') has taken b's side
    if (/^(long\.)?drama\.(fight|bomb|dig|clash|explode)/.test(sk)) for (const r of ROLES) if (who[r] && spoke.has(who[r])) record(ep, camp, who[r], a, b, { side: 'b', turned: getBond(who[r], a) >= 2 }, live, sk || ty, null);
    // the others who care: the strongest feelings about either of them, one or two
    const care = x => Math.max(Math.abs(getBond(x, a)), Math.abs(getBond(x, b)));
    // (nobody who already has a line in it: they are in it already)
    const pool0 = members.filter(x => !inScene.has(x) && !spoke.has(x));
    const first = pool0.filter(x => care(x) >= 2).sort((x, y) => care(y) - care(x) || x.localeCompare(y))[0];
    // ...and on a big one, somebody who likes them both, caught in the middle
    const torn = /explode|bomb|crowd|fight/.test(sk + k) ? pool0.filter(x => x !== first && Math.min(getBond(x, a), getBond(x, b)) >= 1)
      .sort((x, y) => Math.min(getBond(y, a), getBond(y, b)) - Math.min(getBond(x, a), getBond(x, b)) || x.localeCompare(y))[0] : null;
    // one more voice at most when somebody already in the scene took a side
    // (counting everybody who has spoken besides the two of them, the room's reaction included: read 2026-10-14, a fight
    // with a defender, an 'Am I crazy?' and a 'Tell him' stacked on it, four voices piling in)
    const others = [...spoke].filter(x => x !== a && x !== b).length;
    const already = ROLES.some(r => who[r] && spoke.has(who[r])) || others > 0;
    const watchers = [first, torn].filter(Boolean).slice(0, already ? 1 : 2);
    const oneSided = ONE_SIDED.test(sk) || ONE_SIDED.test(ty);
    const added = [];
    for (const c of watchers) {
      let st = stanceOf(c, a, b, key);
      if (st.side !== 'out' && fought.has(pk(c, st.side === 'a' ? a : b))) st = { side: 'out', turned: false };
      const backs = st.side === 'a' ? a : b, vs = st.side === 'a' ? b : a;
      const roles = st.side === 'out' ? { a, b, c } : { a: backs, b: vs, c };
      // a is the one doing it in a one-sided moment: backing a is joining in, backing b is standing up for b
      const pool = st.side === 'out' ? 'witness.out' : oneSided ? (st.side === 'a' ? 'witness.join' : 'witness.defend') : st.turned ? 'witness.turned' : 'witness.side';
      // (said where the scene already is: no set-up line of its own, which moved a row to the mess hall halfway through)
      const w = write(pool, 'any', roles, {}, { ...factsForWho(roles), third: true, pair: true }, { ep: ep.num, camp, phase, n: n++, place: 'public', unique: 'soft', noSetup: true });
      if (!w) continue;
      added.push(...w.lines.filter(l => l.kind !== 'beat' || l.text));
      const slot = ROLES.find(r => !item.scene.who[r]);
      if (slot) item.scene.who[slot] = c;
      // (everybody who speaks in a scene is one of its people: the viewer stages them and the backlog names them)
      if (Array.isArray(item.players) && !item.players.includes(c)) item.players.push(c);
      record(ep, camp, c, a, b, st, live, sk || ty, w.lines.find(l => l.by === c && l.kind === 'say')?.text || null);
      (item.effects ||= []).push(...fxOf(c, a, b, st).map(([x, y, d]) => ({ a: x, b: y, d })));
    }
    if (!added.length) continue;
    // in before the closing confessionals: the room reacts while it is still happening
    // ...and before either of them walks out: a line answered after "storms off" is somebody talking to an empty path
    let at = lines.length;
    while (at > 0 && lines[at - 1].kind === 'conf') at--;
    const exit = lines.findIndex((l, i) => i < at && l.kind === 'beat' && /\b(storms?|stomps?|walks?|marches?|stalks?) (off|away)\b|\bleaves\b|\bturns? (on (his|her|their) heel|and walks)/i.test(l.text || ''));
    if (exit > 0) at = exit;
    item.lines = [...lines.slice(0, at), ...added, ...lines.slice(at)];
    item.text = item.lines.map(l => l.text).join(' ');
  }
}

function fxOf(c, a, b, st) {
  if (st.side === 'out') return [[c, a, -0.2], [c, b, -0.2]];
  const backs = st.side === 'a' ? a : b, vs = st.side === 'a' ? b : a;
  return [[c, backs, 0.6], [c, vs, st.turned ? -1 : -0.6]];
}

function record(ep, camp, c, a, b, st, live, kind, remark) {
  const list = book();
  const backs = st.side === 'out' ? null : st.side === 'a' ? a : b;
  const vs = st.side === 'out' ? null : st.side === 'a' ? b : a;
  list.push({ ep: ep.num, camp, by: c, a, b, side: st.side, backs, vs, turned: !!st.turned, kind, done: false });
  if (live) for (const [x, y, d] of fxOf(c, a, b, st)) addBond(x, y, d);
  // a later real act between the witness and the one they went against pays it off (turns.js: a fight between them)
  if (vs && remark) ((gs.tdStory ||= {}).turns ||= []).push({ kind: 'clash', by: c, to: vs, remark, id: JSON.stringify(['witness', ep.num, camp, c, vs]), ep: ep.num, camp, done: false });
  gs.tdStory.witness = list.filter(x => ep.num - x.ep <= 4);
}

/**
 * The morning after: the one a witness went against (or, staying out, the one who needed somebody) has it out with
 * them. One a camp, from the last episode's stances, both still here. Returns the director's list item or null.
 */
export function witnessAfter(ep, camp, members, next, write, factsForWho) {
  const due = book().filter(x => !x.done && x.ep === ep.num - 1 && members.includes(x.by)
    && (x.side === 'out' ? [x.a, x.b].some(p => members.includes(p)) : members.includes(x.vs)));
  due.sort((p, q) => (q.turned ? 1 : 0) - (p.turned ? 1 : 0) || (p.side === 'out' ? 1 : 0) - (q.side === 'out' ? 1 : 0) || p.by.localeCompare(q.by));
  for (const x of due) {
    // staying out lets down whichever of the two was getting the worst of it: the one closer to the witness
    const hurt = x.side === 'out' ? [x.a, x.b].filter(p => members.includes(p)).sort((p, q) => getBond(x.by, q) - getBond(x.by, p) || p.localeCompare(q))[0] : x.vs;
    const other = x.side === 'out' ? (hurt === x.a ? x.b : x.a) : x.backs;
    const who = { a: hurt, b: x.by, ...(other && members.includes(other) ? { c: other } : {}) };
    const ending = x.side === 'out' ? 'out' : x.turned ? 'turned' : 'side';
    const w = write(`witness.after.${ending}`, 'any', { a: hurt, b: x.by }, other ? { other } : {}, { ...factsForWho({ a: hurt, b: x.by }), pair: true, otherHere: !!who.c },
      { ep: ep.num, camp, phase: 'pre', n: next(), place: 'aside', unique: 'soft' });
    if (!w) continue;
    const d = ending === 'out' ? -0.25 : ending === 'turned' ? -0.75 : -0.5;
    return { at: 0.42, item: onCommit({ story: true, kind: `witness.after.${ending}`, storyType: 'arc', step: ending, players: [hurt, x.by], lines: w.lines, text: w.text, lineId: w.lineId,
      scene: { kind: 'witness.after', who: { a: hurt, b: x.by }, data: other ? { other } : {}, spot: w.spot ? { ...w.spot, window: 'morning' } : null },
      badgeText: ending === 'out' ? 'You Said Nothing' : 'You Took a Side', badgeClass: 'red',
      why: [ending === 'out' ? `${x.by} watched ${x.a} and ${x.b} go at each other at episode ${x.ep} and stayed out of it.` : `${x.by} backed ${x.backs} against ${x.vs} at episode ${x.ep}${x.turned ? ', and they had been friends' : ''}.`],
      fx: [[hurt, x.by, d]] }, () => { x.done = true; }) };
  }
  return null;
}
