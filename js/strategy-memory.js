// Persistent, contestant-specific memories of strategically meaningful events.
// Plain objects keep old saves compatible without custom serialization.
import { gs } from './core.js';

const MAX_MEMORIES_PER_PLAYER = 24;

function memoryStore() {
  if (!gs.strategicMemories || typeof gs.strategicMemories !== 'object') gs.strategicMemories = {};
  return gs.strategicMemories;
}

export function rememberStrategy(observer, subject, type, ep, severity = 1, details = {}) {
  if (!observer || !subject || observer === subject) return null;
  const store = memoryStore();
  const memories = store[observer] || (store[observer] = []);
  const existing = memories.find(m => m.subject === subject && m.type === type && m.ep === ep);
  if (existing) {
    existing.severity = Math.max(existing.severity || 0, severity);
    existing.details = { ...(existing.details || {}), ...details };
    return existing;
  }
  const memory = { subject, type, ep, severity, details };
  memories.push(memory);
  if (memories.length > MAX_MEMORIES_PER_PLAYER) memories.splice(0, memories.length - MAX_MEMORIES_PER_PLAYER);
  return memory;
}

export function memoriesAbout(observer, subject) {
  return (gs.strategicMemories?.[observer] || []).filter(m => m.subject === subject);
}

export function strategicMemoryScore(observer, subject, currentEp = (gs.episode || 0) + 1) {
  return memoriesAbout(observer, subject).reduce((score, memory) => {
    const age = Math.max(0, currentEp - (memory.ep || currentEp));
    const direction = memory.type === 'worked-with-me' ? -0.45 : 1;
    return score + (memory.severity || 1) * Math.pow(0.82, age) * direction;
  }, 0);
}

export function strongestStrategicMemory(observer, subject, currentEp = (gs.episode || 0) + 1) {
  return memoriesAbout(observer, subject)
    .map(memory => ({ ...memory, weight: (memory.severity || 1) * Math.pow(0.82, Math.max(0, currentEp - (memory.ep || currentEp))) }))
    .sort((a, b) => b.weight - a.weight)[0] || null;
}

export function strategicMemoryReason(observer, subject) {
  const memory = strongestStrategicMemory(observer, subject);
  if (!memory) return null;
  const ep = memory.ep ? ` in episode ${memory.ep}` : '';
  if (memory.type === 'voted-for-me') return `${subject} wrote ${observer}'s name down${ep} — ${observer} hasn't forgotten`;
  if (memory.type === 'eliminated-ally') {
    const ally = memory.details?.ally;
    return `${subject} helped eliminate ${ally || `${observer}'s ally`}${ep} — this vote is the consequence`;
  }
  if (memory.type === 'alliance-betrayal') return `${subject} broke an alliance promise${ep} — too dangerous to trust again`;
  return `past history with ${subject} made this target impossible to ignore`;
}
