import { gs, players } from './core.js';
import { META_WEIGHTS } from './franchise-meta.js';

function ledger() {
  if (!gs.advantageIntel || typeof gs.advantageIntel !== 'object') gs.advantageIntel = {};
  return gs.advantageIntel;
}

export function recordIdolIntel(knower, holder, { source = 'observation', confidence = 0.8, truth = 'unknown', ep = null } = {}) {
  if (!knower || !holder) return null;
  const key = `idol:${holder}`;
  const entries = ledger()[key] || (ledger()[key] = []);
  const existing = entries.find(x => x.knower === knower);
  const next = { knower, holder, source, confidence: Math.max(0, Math.min(1, confidence)), truth, ep: ep ?? ((gs.episode || 0) + 1) };
  if (existing) Object.assign(existing, next, { confidence: Math.max(existing.confidence || 0, next.confidence) });
  else entries.push(next);
  return next;
}

export function idolIntelFor(holder, people = []) {
  const currentEp = (gs.episode || 0) + 1;
  const activeIdol = (gs.advantages || []).some(a => a.holder === holder && a.type === 'idol' && !a.used && !a.fake);
  const publicReveal = Object.values(gs.publicKnowledge || {}).some(k => k?.type === 'idol' && k.player === holder);
  const entries = [...(ledger()[`idol:${holder}`] || [])];
  if (publicReveal) people.forEach(knower => { if (!entries.some(x => x.knower === knower)) entries.push({ knower, holder, source:'public reveal', confidence:1, truth:'confirmed', ep:currentEp }); });
  const legacyKnown = gs.knownIdolHoldersThisEp?.has?.(holder) || gs.knownIdolHoldersPersistent?.has?.(holder);
  if (legacyKnown && !entries.some(x => people.includes(x.knower)) && people.length) {
    const knower = [...people].sort((a, b) => {
      const pa = players.find(p => p.name === a)?.stats || {}, pb = players.find(p => p.name === b)?.stats || {};
      return ((pb.strategic || 5) + (pb.intuition || 5)) - ((pa.strategic || 5) + (pa.intuition || 5));
    })[0];
    entries.push({ knower, holder, source:'unattributed camp rumor', confidence:0.68, truth:activeIdol ? 'true' : 'stale', ep:currentEp });
  }
  return entries.filter(x => people.includes(x.knower)).map(x => ({ ...x, age: Math.max(0, currentEp - (x.ep || currentEp)), effectiveConfidence: Math.max(0, (x.confidence || 0) - Math.max(0, currentEp - (x.ep || currentEp)) * 0.08) }));
}

export function allianceIdolRead(holder, members = []) {
  const entries = idolIntelFor(holder, members).sort((a,b) => b.effectiveConfidence - a.effectiveConfidence);
  const confirmed = entries.filter(x => x.effectiveConfidence >= 0.85 && !['false','stale'].includes(x.truth));
  const suspected = entries.filter(x => x.effectiveConfidence >= 0.55 && x.truth !== 'false');
  return { entries, informed: entries.map(x => x.knower), confirmedBy: confirmed.map(x => x.knower), suspectedBy: suspected.map(x => x.knower), confirmed: !!confirmed.length, suspected: !!suspected.length, bestConfidence: entries[0]?.effectiveConfidence || 0 };
}

export function pruneIdolIntel() {
  const data = ledger();
  Object.keys(data).forEach(key => {
    if (!key.startsWith('idol:')) return;
    const holder = key.slice(5);
    if (!(gs.advantages || []).some(a => a.holder === holder && a.type === 'idol' && !a.used)) delete data[key];
  });
}

export function assessIdolExposure(holder, tribalPlayers = [], roll = Math.random) {
  const s = players.find(p => p.name === holder)?.stats || {};
  const emotional = gs.playerStates?.[holder]?.emotional || 'comfortable';
  const entries = idolIntelFor(holder, tribalPlayers.filter(p => p !== holder));
  const publicExposure = entries.some(x => x.source === 'public reveal');
  const actualSignal = publicExposure ? 1 : Math.min(1, entries.reduce((sum, x) => sum + x.effectiveConfidence * 0.22, 0));
  const readSkill = ((s.strategic || 5) + (s.intuition || 5)) / 20;
  const emotionalAlarm = emotional === 'paranoid' ? 0.32 : emotional === 'desperate' ? 0.22 : emotional === 'uneasy' ? 0.1 : 0;
  const calmPenalty = emotional === 'comfortable' && (s.intuition || 5) < 6 ? 0.12 : 0;
  // Learned-behavior: idol-paranoid OBSERVERS scrutinize harder, raising the exposure read. Holder's own profile is never read (1.0 when meta-less).
  const _metaSus = 1 + Math.max(0, ...entries.map(e => gs.franchiseMeta?.profiles?.[e.knower]?.idolParanoia || 0)) * META_WEIGHTS.idolParanoiaSuspicion;
  const perceivedRisk = Math.max(0, Math.min(1, (actualSignal * (0.35 + readSkill * 0.65) + emotionalAlarm - calmPenalty) * _metaSus));
  const notices = publicExposure || roll() < perceivedRisk;
  const falseAlarm = entries.length === 0 && notices;
  const missesExposure = entries.length > 0 && !notices;
  const suspects = entries.slice().sort((a,b) => b.effectiveConfidence - a.effectiveConfidence).map(x => x.knower);
  const counterTarget = notices && !falseAlarm && (s.strategic || 5) >= 6 ? suspects[0] || null : null;
  const mode = falseAlarm ? 'panic' : notices && counterTarget ? 'countermove' : notices ? 'defensive' : missesExposure ? 'unaware' : 'calm';
  return { holder, emotional, informedPlayers: entries.map(x => x.knower), sources: entries.map(x => ({ knower:x.knower, source:x.source, confidence:x.effectiveConfidence })),
    actualSignal, perceivedRisk, notices, falseAlarm, missesExposure, counterTarget, mode, readSkill };
}
