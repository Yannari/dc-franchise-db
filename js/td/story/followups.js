// Follow-ups are grounded in final aired speech, never inferred from unseen events.
import { onCommit } from './commit.js';
import { gs, seasonConfig } from '../../core.js';
import { getBond } from '../../bonds.js';
import { romanticCompat } from '../../players.js';
import { campFeed } from './feed.js';
const romanticPair = (a,b) => seasonConfig.romance !== 'disabled' && romanticCompat(a,b)
  && (gs.showmances || []).some(sh => sh.phase !== 'broken-up' && [a,b].every(n => sh.players.includes(n)));
const book = () => ((gs.tdStory ||= {}).followups ||= []);
export function recordFollowups(ep, camp, out) {
  const pending = book();
  const view = { ...ep, campStory: { ...(ep.campStory || {}), [camp]: out } };
  for (const phase of ['pre', 'post']) for (const [index, item] of campFeed(view, camp, phase).entries()) {
    const kind = item?.scene?.kind;
    // Only a callback that survived the final edit can become the next chapter.
    if (/^follow\.(clash|rivalry|romance)$/.test(kind || '')) {
      const t = pending.find(t => t.id === item.scene.data?.followupId);
      const speech = (item.lines || []).filter(l => l.kind === 'say' && l.by === t?.a);
      const line = speech.find(l => !l.text.includes(t?.remark)) || speech[0];
      if (t && t.chapter === 1 && line && t.ep < ep.num) {
        t.done = false; t.ep = ep.num; t.remark = line.text;
        t.sourceId = JSON.stringify([ep.num,camp,phase,index,kind]);
        t.lastBond = getBond(t.a,t.b);
      }
      continue;
    }
    const defense = kind === 'friend.defend';
    const clash = /^(drama\.(fight|clash|dispute)|crowd\.clash)$/.test(kind || '');
    const romance = /^romance\.(spark|honeymoon|rekindle|flirt)$/.test(kind || '');
    if (!defense && !clash && !romance) continue;
    const { a, b, c } = item.scene.who || {};
    const spoken = (item.lines || []).filter(l => l.kind === 'say' && l.by);
    // The target hears a private defense directly; a clash needs a real third speaker.
    const required = clash ? [a,b,c] : [a,b];
    if (required.some(n => !n) || new Set(required).size !== required.length || !required.every(n => spoken.some(l => l.by === n))) continue;
    const id = JSON.stringify([ep.num, camp, phase, index, kind]);
    if (pending.some(t => t.id === id)) continue;
    const topic = defense ? 'defense' : romance ? 'romance' : 'clash';
    if (romance && !romanticPair(a,b)) continue;
    // The latest incident replaces an older, unaddressed version of the same issue.
    for (const old of pending) if (!old.done && old.kind === topic && [old.a,old.b].every(n => [a,b].includes(n))) old.done = true;
    pending.push({ id, kind: topic, a, b, c, ep: ep.num, camp, phase,
      remark: spoken.filter(l => l.by === a).sort((x,y) => y.text.length - x.text.length)[0].text, done: false });
  }
  // a callback the edit had no room for keeps one more episode, then it has gone stale (the pacing plan: two episodes)
  gs.tdStory.followups = pending.filter(t => ep.num - t.ep <= 2);
}
export function followupScene(ep, camp, members, phase, next, write, factsForWho) {
  if (phase !== 'pre') return null;
  const pending = book().filter(t => !t.done && ep.num > t.ep && ep.num - t.ep <= 2
    && members.includes(t.a) && members.includes(t.b) && (t.kind !== 'clash' || members.includes(t.c)));
  pending.sort((x,y) => x.ep - y.ep || x.id.localeCompare(y.id));
  for (const t of pending) {
    if (t.kind === 'romance' && !romanticPair(t.a,t.b)) continue;
    if (t.chapter && Math.abs(getBond(t.a,t.b) - t.lastBond) < 1) continue;
    const who = t.kind === 'defense' ? { a: t.b, b: t.a } : t.kind === 'clash' ? { a: t.a, b: t.b, c: t.c } : { a: t.a, b: t.b };
    const bond = getBond(who.a, who.b);
    // The first response reflects their relationship; a later chapter reflects its change.
    const warmer = t.chapter ? bond > t.lastBond : bond >= 0;
    const outcome = t.kind !== 'clash' ? (warmer ? 'warm' : 'guarded') : (warmer ? 'mend' : 'tense');
    const chapter = (t.chapter || 0) + 1;
    const kind = t.kind === 'clash' && chapter === 2 ? 'rivalry' : t.kind;
    const data = { remark: t.remark, sourceEp: t.ep, sourceId: t.sourceId || t.id, followupId: t.id, chapter };
    const w = write('follow.' + kind, outcome, who, data,
      { ...factsForWho(who), pair: true, third: !!who.c, prev: t.kind },
      { ep: ep.num, camp, phase, n: next(), place: t.kind === 'clash' ? 'public' : 'secret', unique: true });
    if (!w) continue;
    const fx = t.kind !== 'clash' ? [[who.a,who.b,outcome === 'warm' ? 0.75 : -0.25]]
      : [[who.a,who.b,outcome === 'mend' ? 0.5 : -0.5], [who.a,who.c,0.25], [who.b,who.c,0.25]];
    return { at: 0.58, item: onCommit({ story: true, kind: 'follow.' + kind, storyType: 'arc', step: outcome,
      players: Object.values(who), lines: w.lines, text: w.text, lineId: w.lineId,
      scene: { kind: 'follow.' + kind, who, data, spot: w.spot ? { ...w.spot, window: 'afternoon' } : null },
      badgeText: t.kind === 'defense' ? 'After the Defense' : t.kind === 'romance' ? 'Between Us' : chapter === 2 ? 'Where We Stand' : 'Unfinished Argument', badgeClass: outcome === 'warm' || outcome === 'mend' ? 'green' : 'red',
      why: [t.kind === 'romance' ? t.a + ' and ' + t.b + ' heard each other in an aired romance scene.' : t.kind === 'defense' ? t.a + ' defended ' + t.b + ' in an aired conversation.' : t.c + ' was present for the argument between ' + t.a + ' and ' + t.b + '.'], fx }, () => { t.done = true; t.chapter = chapter; }) };
  }
  return null;
}
