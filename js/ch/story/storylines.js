// ══════════════════════════════════════════════════════════════════════
// ch/story/storylines.js — what each scene is a chapter of
// ══════════════════════════════════════════════════════════════════════
//
// Big Brother's storylines (js/bb/story/storylines.js) for The Challenge. The
// engine's scenes decide everything; this file only says what each one MEANS
// as a story, so the director can air a chapter whose cause the viewer has
// seen, or say that cause plainly at the top of the scene. Words only: nothing
// here reads or writes the game.
//
// A storyline is { id, type, key, people, steps: [{ step, outcome, scene,
// ep, day, aired }], status }. Types:
//
//   feud       two people who cannot stand each other: friction (the kitchen,
//              the bunk, a prank that started a war, trash talk), an
//              argument (receipts, a grudge from another show, blame after a
//              daily), a blow-up (a fight at a party, the night before the
//              Arena), and the end (an apology accepted, or the Arena)
//   alliance   a named group: formed, grown, a meeting, a betrayal, a member
//              out, outed in front of the room, ended
//   showmance  a pair: spark, flirt, together, a date, the house annoyed,
//              jealousy, the breakup
//   hunt       somebody coming for somebody: overheard, a threat, a planted
//              lie, a volunteer naming them, the call-out
//   rookies    the vets and the new threats
//   life       self-contained comedy and feeling: needs no cause
//
// The Arena and the vote are the spine and always air; they are filed too, so
// a feud that ENDS in the Arena is told as one story.

const F = (type, step, outcome = 'any') => ({ type, step, outcome });

function rule(sc) {
  const k = sc.kind, d = sc.data || {};
  switch (k) {
    // ── feud ──
    case 'kitchen-blowup': case 'bunk-war': case 'trash-talk': case 'show-banter':
      return k === 'show-banter' && d.ok ? F('life', 'banter') : F('feud', 'friction');
    case 'prank': return d.laughs ? F('life', 'prank') : F('feud', 'friction', 'prank');
    case 'receipts': return d.apology ? F('feud', 'apology', 'accepted') : F('feud', 'argument', 'vote');
    case 'old-show-grudge': return d.settled ? F('feud', 'apology', 'accepted') : F('feud', 'argument', 'history');
    case 'floater-callout': return F('feud', 'argument', 'floater');
    case 'gossip-backfire': return d.tells ? F('feud', 'argument', 'gossip') : null;
    case 'partner-blame': case 'team-blame': return F('feud', 'argument', 'blame');
    case 'rookie-hazing': return d.plays ? F('rookies', 'hazing', 'plays') : F('feud', 'friction', 'hazing');
    case 'fight': return F('feud', 'blowup');
    case 'fight-physical': return F('feud', 'blowup', 'physical');
    case 'arena-eve-confront': return F('feud', 'blowup', 'eve');
    case 'apology': return F('feud', 'apology', d.accepted ? 'accepted' : 'refused');
    // ── alliance ──
    case 'alliance-form': return F('alliance', 'formed');
    case 'alliance-grow': return F('alliance', 'grown');
    case 'meeting': return F('alliance', 'meeting');
    case 'recruit': return d.answer === 'accepted' ? F('alliance', 'recruit') : F('hunt', 'recruit', d.answer);
    case 'alliance-betrayal': return F('alliance', 'betrayal', d.how);
    case 'alliance-leave': return F('alliance', 'leave', d.why);
    case 'alliance-end': return F('alliance', 'end', d.why);
    case 'alliance-merge': return F('alliance', 'merge');
    case 'alliance-switch': return F('alliance', 'grown', 'switch');
    case 'outing': return F('alliance', 'outed');
    case 'meeting-spotted': return F('alliance', 'spotted');
    case 'loyalty-test': return F('alliance', 'test', d.leaks ? 'leaks' : 'holds');
    case 'rookie-uprising': return F('rookies', 'uprising');
    // ── showmance ──
    case 'spark': return F('showmance', 'spark');
    case 'flirt': return d.back ? F('showmance', 'spark', 'flirt') : F('life', 'rebuffed');
    case 'showmance': return F('showmance', 'together');
    case 'beach-date': return F('showmance', 'date');
    case 'pda': return F('showmance', 'house');
    case 'jealousy': return F('showmance', 'jealous');
    case 'breakup': return F('showmance', 'breakup');
    case 'ex-in-the-house': return F('showmance', d.rekindle ? 'spark' : 'cold', 'ex');
    case 'home-gossip': return d.couple ? F('showmance', 'house', 'home') : F('showmance', 'spark', 'home');
    case 'home-guilt': return d.ends ? F('showmance', 'breakup', 'home') : F('showmance', 'together', 'home');
    // ── hunt ──
    case 'overheard': return F('hunt', 'overheard');
    case 'leverage-threat': return F('hunt', 'threat');
    case 'scheme-lie': return F('hunt', 'lie', d.believed ? 'believed' : 'seen');
    case 'volunteer': return F('hunt', 'volunteer');
    case 'plea': return F('hunt', 'plea', d.moved ? 'moved' : 'held');
    case 'counter-pitch': return F('hunt', 'counter', d.moved?.length ? 'moved' : 'held');
    case 'spare-deal': return F('hunt', 'spare', d.answer);
    case 'empty-threat': return F('hunt', 'empty');
    case 'tribunal-pitch': return F('hunt', 'tribunal', d.mode);
    case 'tribunal-verdict': return F('hunt', 'sent-in');
    // ── rookies ──
    case 'vet-dismisses': return F('rookies', 'dismissed');
    case 'vet-mentors-rookie': return F('rookies', 'mentor');
    // ── the spine, filed so a story can end there ──
    case 'callout': return F('spine', 'callout', d.reason);
    case 'arena': return F('spine', 'arena');
    // ── life ──
    case 'kitchen-disaster': case 'gym-flex': case 'hot-tub-truths': case 'tj-at-breakfast':
    case 'homesick': case 'psyche': case 'call-home': case 'daily-clutch': case 'daily-choke': case 'home-talk':
    case 'picked-last': case 'partner-carried': case 'throw': case 'throw-caught': case 'deal':
    case 'ride-to-the-final': case 'arena-eve-pep': case 'arena-eve-alone': case 'party':
    case 'partner-draw': case 'partner-pick':
      return F('life', k);
    default: return null;
  }
}

// The people a storyline is about, in the order its id uses.
function keyOf(type, sc, state) {
  const [a, b] = sc.who;
  const pair = [a, b].filter(Boolean).sort().join('|');
  switch (type) {
    case 'feud': case 'showmance': return pair;
    case 'alliance': {
      const id = sc.data?.alliance ?? state.alliances.find(x => x.members.includes(a) && x.members.includes(b))?.id;
      return id != null ? `al:${id}` : `pair:${pair}`;
    }
    case 'hunt': return `${a}>${b || sc.data?.target || '?'}`;
    case 'rookies': return 'rookies';
    case 'spine': return pair;
    default: return `${sc.kind}:${a}`;
  }
}

export function classify(sc, state) {
  const r = rule(sc);
  if (!r) return null;
  return { ...r, key: keyOf(r.type, sc, state) };
}

// Steps that answer an earlier one, and which earlier steps count as the cause.
export const NEEDS = {
  'feud.argument': ['friction', 'argument', 'blowup'],
  'feud.blowup': ['friction', 'argument', 'blowup'],
  'feud.apology': ['friction', 'argument', 'blowup'],
  'alliance.meeting': ['formed', 'grown', 'recruit'],
  'alliance.betrayal': ['formed', 'grown', 'meeting', 'recruit'],
  'alliance.leave': ['formed', 'grown', 'meeting', 'betrayal'],
  'alliance.end': ['formed', 'grown', 'meeting', 'betrayal', 'leave'],
  'alliance.outed': null,
  'alliance.merge': ['formed', 'grown', 'meeting'],
  'showmance.together': ['spark'],
  'showmance.date': ['together'],
  'showmance.house': ['together', 'date'],
  'showmance.jealous': ['together', 'date', 'spark'],
  'showmance.breakup': ['together', 'date', 'jealous'],
  'rookies.uprising': null,
};

export function book(state) {
  return (state.story ||= { lines: [], filed: {} });
}

// File one scene into its storyline (once). Returns { line, step } or null.
export function file(state, sc) {
  const b = book(state);
  if (b.filed[sc.id]) return b.filed[sc.id];
  const c = classify(sc, state);
  if (!c) return null;
  const id = `${c.type}:${c.key}`;
  let line = b.lines.find(l => l.id === id && l.status !== 'closed');
  if (!line) {
    line = { id, type: c.type, key: c.key, people: [], steps: [], status: 'live', since: sc.ep };
    b.lines.push(line);
  }
  for (const n of sc.who.slice(0, 3)) if (n && !line.people.includes(n)) line.people.push(n);
  const step = { step: c.step, outcome: c.outcome, scene: sc.id, kind: sc.kind, ep: sc.ep, day: sc.day, aired: false };
  line.steps.push(step);
  if ((c.type === 'feud' && c.step === 'apology' && c.outcome === 'accepted') || (c.type === 'showmance' && c.step === 'breakup')
    || (c.type === 'alliance' && c.step === 'end')) line.status = 'closed';
  b.filed[sc.id] = { line, step };
  return b.filed[sc.id];
}

// The earlier step this one answers: the step, null (needs none), or false
// (needs one and none exists before it).
export function causeOf(line, step) {
  const want = NEEDS[`${line.type}.${step.step}`];
  if (!want) return null;
  const before = line.steps.slice(0, line.steps.indexOf(step));
  return [...before].reverse().find(s => want.includes(s.step)) || false;
}

// How long a storyline has been running, in aired chapters: the director
// favours the next chapter of a story the viewer is already following.
export const airedChapters = line => line.steps.filter(s => s.aired).length;
