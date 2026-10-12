// Follow-ups are grounded in final aired speech, never inferred from unseen events.
import { gs } from '../../core.js';
import { getBond } from '../../bonds.js';
import { campFeed } from './feed.js';
const book = () => ((gs.tdStory ||= {}).followups ||= []);
export function recordFollowups(ep, camp, out) {
  const pending = book();
  const view = { ...ep, campStory: { ...(ep.campStory || {}), [camp]: out } };
  for (const phase of ['pre', 'post']) for (const [index, item] of campFeed(view, camp, phase).entries()) {
    const kind = item?.scene?.kind;
    const defense = kind === 'friend.defend';
    const clash = /^(drama\.(fight|clash|dispute)|crowd\.clash)$/.test(kind || '');
    if (!defense && !clash) continue;
    const { a, b, c } = item.scene.who || {};
    const spoken = (item.lines || []).filter(l => l.kind === 'say' && l.by);
    // The target hears a private defense directly; a clash needs a real third speaker.
    const required = defense ? [a,b] : [a,b,c];
    if (required.some(n => !n) || new Set(required).size !== required.length || !required.every(n => spoken.some(l => l.by === n))) continue;
    const id = JSON.stringify([ep.num, camp, phase, index, kind]);
    if (pending.some(t => t.id === id)) continue;
    const topic = defense ? 'defense' : 'clash';
    // The latest incident replaces an older, unaddressed version of the same issue.
    for (const old of pending) if (!old.done && old.kind === topic && [old.a,old.b].every(n => [a,b].includes(n))) old.done = true;
    pending.push({ id, kind: topic, a, b, c, ep: ep.num, camp, phase,
      remark: spoken.filter(l => l.by === a).sort((x,y) => y.text.length - x.text.length)[0].text, done: false });
  }
  gs.tdStory.followups = pending.filter(t => ep.num - t.ep <= 3);
}
export function followupScene(ep, camp, members, phase, next, write, factsForWho) {
  if (phase !== 'pre') return null;
  const pending = book().filter(t => !t.done && ep.num > t.ep && ep.num - t.ep <= 3
    && members.includes(t.a) && members.includes(t.b) && (t.kind !== 'clash' || members.includes(t.c)));
  pending.sort((x,y) => x.ep - y.ep || x.id.localeCompare(y.id));
  for (const t of pending) {
    const who = t.kind === 'defense' ? { a: t.b, b: t.a } : { a: t.a, b: t.b, c: t.c };
    const bond = getBond(who.a, who.b);
    const outcome = t.kind === 'defense' ? (bond >= 0 ? 'warm' : 'guarded') : (bond >= 0 ? 'mend' : 'tense');
    const data = { remark: t.remark, sourceEp: t.ep, sourceId: t.id };
    const w = write('follow.' + t.kind, outcome, who, data,
      { ...factsForWho(who), pair: true, third: !!who.c, prev: t.kind },
      { ep: ep.num, camp, phase, n: next(), place: t.kind === 'defense' ? 'secret' : 'public', unique: true });
    if (!w) continue;
    t.done = true;
    const fx = t.kind === 'defense' ? [[who.a,who.b,outcome === 'warm' ? 0.75 : -0.25]]
      : [[who.a,who.b,outcome === 'mend' ? 0.5 : -0.5], [who.a,who.c,0.25], [who.b,who.c,0.25]];
    return { at: 0.58, item: { story: true, kind: 'follow.' + t.kind, storyType: 'arc', step: outcome,
      players: Object.values(who), lines: w.lines, text: w.text, lineId: w.lineId,
      scene: { kind: 'follow.' + t.kind, who, data, spot: w.spot ? { ...w.spot, window: 'afternoon' } : null },
      badgeText: t.kind === 'defense' ? 'After the Defense' : 'Unfinished Argument', badgeClass: outcome === 'warm' || outcome === 'mend' ? 'green' : 'red',
      why: [t.kind === 'defense' ? t.a + ' defended ' + t.b + ' in an aired conversation.' : t.c + ' was present for the argument between ' + t.a + ' and ' + t.b + '.'], fx } };
  }
  return null;
}
