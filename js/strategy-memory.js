// Persistent, contestant-specific memories of strategically meaningful events.
// Plain objects keep old saves compatible without custom serialization.
import { gs } from './core.js';

const MAX_MEMORIES_PER_PLAYER = 24;

// ── Which memories count FOR somebody instead of against them ──
//
// The score used to treat exactly one type ('worked-with-me') as positive and
// everything else as a reason to target its subject — and a quarter of all
// stored memories were pro-social: kindnesses, shared hardship, debts, the
// person who sat on the block when asked. Being saved by somebody was making
// people MORE likely to nominate them. Anything on this list counts the other
// way; everything else remains what a strategic memory mostly is — a receipt.
const PRO_SOCIAL = new Set([
  'worked-with-me', 'kindness', 'shared-hardship', 'emotional-support',
  'told-me-something-real', 'went-up-for-them', 'sat-when-asked', 'debt',
  'final-plea-saved-me', 'acted-on-the-debt', 'my-person', 'confidence',
  'we-said-what-this-is', 'promise', 'protected-them-quietly', 'comfort',
]);
const directionOf = type => (PRO_SOCIAL.has(type) ? -0.45 : 1);

// ── How fast a memory fades: texture fades, scars stay ──
//
// A flat 0.82 per episode meant a severity-3 betrayal was down to a fifth of
// itself by the endgame — the exact opposite of "I'm on that jury now, and I
// remember everything." Decay scales with how much the moment mattered: a
// severity-1 note is mostly gone in three weeks, a severity-3 betrayal still
// carries more than half its weight eight episodes later.
const decayFor = severity => Math.min(0.96, 0.8 + (severity || 1) * 0.045);
const weightOf = (memory, currentEp) => {
  const age = Math.max(0, currentEp - (memory.ep || currentEp));
  return (memory.severity || 1) * Math.pow(decayFor(memory.severity), age);
};

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
  // Forget the LEAST important thing, never merely the oldest. FIFO eviction
  // destroyed about a hundred betrayal-class memories per measured season —
  // a week-two blindside pushed out of a full head by three weeks of small
  // talk — and ninety percent of the cast lives at this cap, so the eviction
  // policy IS the memory model. Weight is severity times its own decay, so a
  // faded old note loses to a fresh scar, and a deep old scar beats fresh
  // texture, which is how remembering actually works.
  if (memories.length > MAX_MEMORIES_PER_PLAYER) {
    const now = (gs.episode || 0) + 1;
    let lowest = 0;
    for (let i = 1; i < memories.length; i++) {
      if (weightOf(memories[i], now) < weightOf(memories[lowest], now)) lowest = i;
    }
    memories.splice(lowest, 1);
  }
  return memory;
}

export function memoriesAbout(observer, subject) {
  return (gs.strategicMemories?.[observer] || []).filter(m => m.subject === subject);
}

export function strategicMemoryScore(observer, subject, currentEp = (gs.episode || 0) + 1) {
  return memoriesAbout(observer, subject).reduce((score, memory) =>
    score + weightOf(memory, currentEp) * directionOf(memory.type), 0);
}

export function strongestStrategicMemory(observer, subject, currentEp = (gs.episode || 0) + 1) {
  // "The single thing most held AGAINST somebody" — pro-social memories are
  // excluded, or the worst thing anyone remembered about a friend was the
  // friendship itself.
  return memoriesAbout(observer, subject)
    .filter(memory => directionOf(memory.type) > 0)
    .map(memory => ({ ...memory, weight: weightOf(memory, currentEp) }))
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
