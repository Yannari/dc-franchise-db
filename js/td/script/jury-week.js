// ══════════════════════════════════════════════════════════════════════
// td/script/jury-week.js — the Jury House week as an episode, not a list
// ══════════════════════════════════════════════════════════════════════
//
// The user (2026-10-09): "there's no storyline and all the events are one-liners. I want to know
// what's happening. Disventure Camp's Panel of Peers is our goal." That episode is built from a few
// BLOCKS, each a place and a time with most of the motel in it, and the storylines run through
// them: a morning activity everyone is dragged into (water aerobics) with three or four threads at
// once; an afternoon where they split up into pairs and the real conversations happen; an evening
// game where the threads come back changed; the roundtable; and the last night, where things get
// resolved and it ends on a laugh.
//
// The engine (rescue-island.js generateInterludeLife) decided every storyline and applied every
// consequence; td/script/jury.js wrote each decision as a scene. This orders those scenes into the
// blocks and writes the THREADS (the same storylines seen in passing during the group activities,
// lines/jury.js 'jury.a.*' and 'jury.c.*'). A thread is a glimpse, but it moves its relationship a
// little, the way being stuck in the same class or game does.
import { addBond, getBond } from '../../bonds.js';
import { scriptJury } from './jury.js';

const byBadge = (beats, badge) => beats.filter(b => b.badge === badge);
const one = (beats, badge) => beats.find(b => b.badge === badge) || null;

/**
 * Build ep.interlude.blocks from the interlude's scripted acts. ctx: { ep, residents, active, statOf(n) }.
 * Each block: { id, title, time, tod, set?, frame?, threads?, scenes, confs }.
 */
export function buildJuryWeek(J, ctx) {
  const beats = (J.acts || []).flatMap(a => a.beats || []);
  const residents = J.residents || [];
  const used = new Set();
  const take = b => { if (b && !used.has(b)) { used.add(b); return b; } return null; };
  const takeAll = list => list.map(take).filter(Boolean);
  const stat = (n, k) => { try { return +(ctx.statOf?.(n)?.[k] ?? 5); } catch { return 5; } };
  const thread = (badge, players, extra = {}) => {
    const b = { badge, cls: 'gold', player: players[0], player2: players[1] || null, players, text: '', bondDelta: 0, ...extra };
    scriptJury(b, ctx);
    return b.lines?.length ? b : null;
  };

  const wounds = one(beats, 'OLD WOUNDS'), outside = one(beats, 'ON THE OUTSIDE'), seat = one(beats, 'A SEAT AT THE TABLE');
  const strange = one(beats, 'STRANGE BEDFELLOWS'), looms = one(beats, 'THE VOTE LOOMS');
  const groups = byBadge(beats, 'MOTEL LIFE'), nights = byBadge(beats, 'ONE LAST NIGHT');
  const confs = byBadge(beats, 'CONFESSIONAL');

  // ── 1. checking in: whoever just got here ─────────────────────────
  const arrive = { id: 'arrive', title: 'Checking In', time: 'Morning', tod: 'day', scenes: takeAll(byBadge(beats, 'NEW ARRIVAL')) };

  // ── 2. the morning activity: the activities director's water aerobics, with the threads ──
  // the class is led by whoever is boldest; the frame is the engine's own group scene when it was
  // the aerobics, and is written now otherwise (three of the motel, the leader first)
  let frame = groups.find(b => b.jkey === 'jury.group.aerobics') || null;
  if (frame) take(frame);
  else {
    // the leader is nobody the week's storylines are about (the outsider does not run the class)
    const story = new Set([...(wounds?.players || []), ...(outside?.players || [])]);
    const lead = [...residents].filter(n => !story.has(n)).sort((a, b) => (stat(b, 'boldness') + stat(b, 'social')) - (stat(a, 'boldness') + stat(a, 'social')))[0];
    const others = residents.filter(n => n !== lead && !story.has(n));
    if (lead && others.length >= 2) frame = thread('MOTEL LIFE', [lead, others[0], others[1]], { ending: 'aerobics' });
  }
  const morningThreads = [];
  if (wounds?.players?.length === 2) {
    const t = thread('ACTIVITY GRUDGE', wounds.players);
    if (t) { morningThreads.push(t); addBond(wounds.players[0], wounds.players[1], -0.2); }
  }
  if (looms) {
    const a = looms.players[0];
    const fin = [...(ctx.active || [])].sort((x, y) => getBond(a, y) - getBond(a, x))[0];
    const b = residents.filter(n => n !== a && !(wounds?.players || []).includes(n)).sort((x, y) => getBond(a, y) - getBond(a, x))[0];
    const t = fin && b ? thread('ACTIVITY LOBBY', [a, b], { fin }) : null;
    if (t) morningThreads.push(t);
  }
  const busy = new Set([...(wounds?.players || []), ...(outside?.players || []), ...(looms?.players || [])]);
  let pal = null;
  for (let i = 0; i < residents.length && !pal; i++) for (let j = i + 1; j < residents.length; j++) {
    const x = residents[i], y = residents[j];
    if (busy.has(x) || busy.has(y) || getBond(x, y) < 2) continue;
    pal = [x, y]; break;
  }
  if (pal) { const t = thread('ACTIVITY BANTER', pal); if (t) { morningThreads.push(t); addBond(pal[0], pal[1], 0.3); } }
  if (outside) { const t = thread('ACTIVITY OUTSIDER', outside.players); if (t) morningThreads.push(t); }
  take(wounds); take(outside); take(looms);
  const morning = { id: 'activity', title: 'Water Aerobics', time: '10:00 AM', tod: 'day', set: 'jury-pool', frame, threads: morningThreads, scenes: [], confs: confs.slice(0, 1) };

  // ── 3. the afternoon: everyone splits up, and the real conversations happen ──
  const afternoon = { id: 'pairs', title: 'The Long Afternoon', time: 'During the day', tod: 'day',
    scenes: takeAll([one(beats, 'IT BOILS OVER'), seat, strange, one(beats, "CAN'T LET GO"), ...byBadge(beats, 'COMMON GROUND'), ...byBadge(beats, 'GAME TALK')].filter(Boolean)),
    confs: confs.slice(1, 2) };
  // one quiet moment alone, from whoever has not been seen yet
  const seenSoFar = new Set([...arrive.scenes, ...afternoon.scenes, ...morningThreads, frame].filter(Boolean).flatMap(b => b.players || []));
  const solo = beats.find(b => !used.has(b) && /^(PROCESSING|ROOTING|WATCHING|RESTLESS|SETTLING IN)$/.test(b.badge) && !seenSoFar.has(b.players?.[0]));
  if (take(solo)) afternoon.scenes.push(solo);

  // ── 4. the evening game: bingo (or cards, or the guitar), the threads changed ──
  const guitar = groups.find(b => !used.has(b) && /music/.test(b.jkey || ''));
  if (take(guitar)) afternoon.scenes.push(guitar);
  let game = groups.find(b => !used.has(b) && /bingo/.test(b.jkey || '')) || null;
  if (game) take(game);
  else {
    const caller = [...residents].sort((a, b) => stat(b, 'social') - stat(a, 'social'))[1] || residents[0];
    const rest = residents.filter(n => n !== caller && !(outside?.players || []).includes(n));
    if (caller && rest.length >= 2) game = thread('MOTEL LIFE', [caller, rest[rest.length - 1], rest[0]], { ending: 'bingo' });
  }
  const eveningThreads = [];
  if (wounds?.players?.length === 2) { const t = thread('GAME GRUDGE', wounds.players); if (t) { eveningThreads.push(t); addBond(wounds.players[0], wounds.players[1], 0.3); } }
  if (seat?.players?.length === 2) { const t = thread('GAME OUTSIDER', [seat.players[1], seat.players[0]]); if (t) { eveningThreads.push(t); addBond(seat.players[0], seat.players[1], 0.3); } }
  if (strange?.players?.length === 2) { const t = thread('GAME FRIENDS', strange.players); if (t) { eveningThreads.push(t); addBond(strange.players[0], strange.players[1], 0.3); } }
  const evening = { id: 'game', title: 'Bingo Night', time: '7:00 PM', tod: 'night', set: 'jury-bingo', frame: game, threads: eveningThreads, scenes: [], confs: [] };

  // ── 5. the roundtable, 6. the last night: things resolve, and it ends on a laugh ──
  const last = { id: 'last', title: 'The Last Night', time: 'The last night', tod: 'night',
    scenes: takeAll(['THE RECKONING', 'BURIED IT', 'BELONGING', 'THE GRUDGE VOTE', 'THICK AS THIEVES'].map(x => one(beats, x)).filter(Boolean)),
    end: take(nights[0]) || null, confs: confs.slice(2, 3) };
  const late = beats.find(b => !used.has(b) && /^(ROOTING|WATCHING|PROCESSING)$/.test(b.badge));
  if (take(late)) last.scenes.splice(Math.min(2, last.scenes.length), 0, late);

  return [arrive, morning, afternoon, evening, { id: 'roundtable', title: 'The Roundtable' }, last].filter(b => b.id === 'roundtable' || b.frame || (b.scenes || []).length || b.end);
}
