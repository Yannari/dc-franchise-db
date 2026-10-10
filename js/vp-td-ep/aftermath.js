// ══════════════════════════════════════════════════════════════════════
// js/vp-td-ep/aftermath.js — the Total Drama Aftermath, played on the studio stage
// ══════════════════════════════════════════════════════════════════════
// The engine already wrote the show (aftermath.js generateAftermathShow → ep.aftermath: the
// interviews, Truth or Anvil, the moments, the unseen footage, the fan call, and at the reunion the
// finalists, the discussion topics and the awards). This screen stages it in the studio: the host
// on the left couch, each guest walking out to the hot seat on the right, the Peanut Gallery (the
// voted-out already interviewed) on the couches behind them and at the sides of the stage, growing
// as the show goes on. Nothing here decides anything; it says what the engine wrote, in order.
import { plateKey, cleanText, venueOf } from './steps.js';
import { throwbackScene } from './twist-screens.js';

// strip the quotes the engine wraps every spoken line in
const said = t => cleanText(String(t || '').trim().replace(/^"([\s\S]*)"$/, '$1').replace(/^“([\s\S]*)”$/, '$1'));
// "Chris: \"...\"" → { by, text }
const tagged = (t, host) => { const m = String(t || '').match(/^([A-Z][\w' .-]{1,30}):\s*([\s\S]+)$/); return m ? { by: m[1], text: said(m[2]) } : { by: host, text: said(t) }; };

// the studio, in the frame's own pixels (1600x900): the host's couch, the hot seat, a second seat
// for a confrontation, and where the gallery sits (the back couches, the centre couch) or stands
const AT = (x, y, o = {}) => ({ u: x / 1600, v: y / 900, ...o });
// seated tokens are anchored on the seat cushion and sized to the couch (the user, 2026-10-09: "they're
// not even in the chair, the avatars are too big"): ~11% of the frame on the front couches, smaller further back
const HOST = AT(560, 562, { s: .1, sit: true, host: true, h: 12 });
const HOT = AT(1030, 560, { s: .1, sit: true, h: 12 });
const HOT2 = AT(1125, 560, { s: .1, sit: true, h: 12 });
const GALLERY = [
  // the centre couch, then the two back couches, then the stage wings (standing)
  AT(770, 528, { s: .09, sit: true, h: 10.5 }), AT(862, 528, { s: .09, sit: true, h: 10.5 }),
  AT(470, 500, { s: .08, sit: true, h: 9.5 }), AT(590, 500, { s: .08, sit: true, h: 9.5 }), AT(1120, 494, { s: .08, sit: true, h: 9.5 }), AT(1205, 494, { s: .08, sit: true, h: 9.5 }),
  AT(300, 640, { s: .1, h: 12 }), AT(1300, 640, { s: .1, h: 12 }), AT(220, 645, { s: .1, h: 12 }), AT(1380, 645, { s: .1, h: 12 }),
  AT(140, 650, { s: .1, h: 12 }), AT(1460, 650, { s: .1, h: 12 }), AT(380, 636, { s: .1, h: 12 }), AT(1220, 636, { s: .1, h: 12 }),
];

export function hasAftermath(ep) { return !!ep?.aftermath && ((ep.aftermath.interviews || []).length || (ep.aftermath.reunionDiscussion || []).length); }

// ── the show as td/aftermath/show.js wrote it (the user, 2026-10-10: "something this level"), on the
// studio's own sets: the lounge, the interview couch, the Peanut Gallery's couches, the doorway, the
// green room. Seats in each frame's own pixels (1600x900), the seated anchored on the cushion. ──
const SEATS = {
  'stage-wide': { hA: [600, 528, 17], g: [780, 528, 17], hB: [960, 528, 17], L0: [110, 545, 16], L1: [245, 545, 16], R0: [1290, 525, 16], R1: [1440, 525, 16] },
  'couch-front': { hA: [450, 600, 23], g: [800, 600, 23], hB: [1150, 600, 23] },
  'gallery-side': { G0: [140, 585, 21], G1: [330, 585, 21], G2: [830, 600, 21], G3: [1020, 600, 21], G4: [1210, 600, 21], G5: [1400, 600, 21], G6: [1290, 425, 15], G7: [1480, 425, 15] },
  'doorway': { walk: [720, 740, 28] },
  'green-wide': { S0: [690, 605, 15], S1: [820, 605, 15], S2: [960, 605, 15] },
  'green-close': { C0: [480, 650, 24], C1: [800, 650, 24], C2: [1120, 650, 24] },
};
const SET_PLACE = { 'stage-wide': 'Total Drama Aftermath', 'couch-front': 'The hot seat', 'gallery-side': 'The Peanut Gallery', doorway: 'The stage door', 'green-wide': 'The green room', 'green-close': 'The green room' };
function showScreen(ep, a, o) {
  const show = a.show;
  const [HA, HB] = (show.hosts || []).map(h => h.name);
  const venue = venueOf(ep, o);
  const hist = o.history || globalThis.gs?.episodeHistory || [];
  const steps = [];
  let guest = null;
  for (const b of show.blocks || []) {
    if (b.clip) {
      // a look back: the season's own place, as old footage
      if (b.shot) steps.push({ ...throwbackScene(b.shot, venue, hist.find(h => h.num === b.shot.ep) || ep, 'Flashback'), noWx: true });
    } else {
      const plate = plateKey('aftermath', b.set, 'day');
      if (!plate) continue;
      const places = {};
      guest = null;
      for (const [n, slot] of Object.entries(b.seats || {})) {
        const at = SEATS[b.set]?.[slot]; if (!at) continue;
        const stand = b.set === 'doorway';
        places[n] = AT(at[0], at[1], { s: at[2] / 100, h: at[2], ...(stand ? {} : { sit: true }), ...(n === HA || n === HB ? { host: true } : {}) });
        if (slot === 'g' || slot === 'walk') guest = n;
      }
      const speakers = [...new Set(b.lines.filter(l => l.by).map(l => l.by))];
      steps.push({ k: 'scene', spot: b.set, tod: 'day', plate, place: SET_PLACE[b.set] || 'Total Drama Aftermath', time: 'Live', card: !steps.some(x => x.k === 'scene'), cut: false, still: true, noWx: true,
        focus: speakers.filter(n => places[n]).slice(0, 3), bg: [], places, host: HA, aftermath: true, wide: true });   // (each set is already its own camera angle: no zoom)
    }
    if (b.title) steps.push({ k: 'title', kicker: b.title.kicker, name: b.title.name, faces: [...new Set(b.lines.filter(l => l.by).map(l => l.by))].slice(0, 6), ...(b.hammer ? { tone: 'fire' } : {}) });
    for (const l of b.lines) {
      if (l.beat) {
        const act = l.act === 'arrive' && guest ? { kind: 'arrive', who: [guest], ride: 'walk' } : (l.act === 'hammer' || l.act === 'hammer-miss') && guest ? { kind: l.act, who: [guest] } : l.act === 'webcam' ? { kind: 'phone' } : null;
        steps.push({ k: 'beat', text: cleanText(l.beat), focus: guest && /hammer|walks out/.test(l.beat) ? [guest] : [], ...(act ? { act } : {}), ...(l.applause ? { applause: l.applause } : {}), ...(l.tense ? { tense: true } : {}) });
      } else {
        const host = l.by === HA || l.by === HB;
        steps.push({ k: 'say', by: l.by, text: cleanText(l.text), focus: [l.by], ...(host ? { host: true } : {}), ...(l.loud ? { loud: true } : {}) });
      }
    }
  }
  return { id: 'aftermath-show', kind: 'aftermath', venue: 'aftermath', ep: ep.num, label: a.isReunion ? 'The Reunion' : 'Aftermath', host: HA, steps };
}

export function tdAftermathScreen(ep, o = {}) {
  if (!hasAftermath(ep)) return null;
  const a = ep.aftermath;
  if (a.show?.blocks?.length && plateKey('aftermath', 'stage-wide', 'day')) return showScreen(ep, a, o);
  const plate = plateKey('islands', 'aftermath-studio', 'day');
  if (!plate) return null;
  const host = o.host || 'Chris';
  const steps = [];
  // the engine's list can name someone twice (screenshot, 2026-10-09: Seraphine in two seats)
  const gallery = [...new Set(a.peanutGallery || [])];
  const say = (text, extra = {}) => { const t = said(text); if (t) steps.push({ k: 'say', by: host, host: true, text: t, ...extra }); };
  // a line as the engine wrote it can carry its own stage directions between the quotes
  // ("Trent. Let's talk." Chris leans forward. "I have the receipts."): the speech is said, the rest is staged
  const line = (by, text, extra = {}) => {
    const raw = String(text || '').trim();
    const parts = /"/.test(raw.replace(/^"|"$/g, '')) ? [...raw.matchAll(/"([^"]+)"|([^"]+)/g)].map(m => (m[1] ? { q: m[1] } : { n: m[2] })) : [{ q: raw }];
    for (const pt of parts) {
      const t = cleanText(String(pt.q ?? pt.n).trim()); if (!t || /^[\s.,;:—-]+$/.test(t)) continue;
      if (pt.n != null) steps.push({ k: 'beat', text: t, focus: by === host ? [] : [by] });
      else steps.push(by === host ? { k: 'say', by, host: true, text: said(t), ...extra } : { k: 'say', by, text: said(t), focus: [by], ...extra });
    }
  };
  // the set as it stands: who is on the hot seat(s), everyone else already done in the gallery
  const set = (guests = [], extra = {}) => {
    const places = { [host]: HOST };
    guests.slice(0, 2).forEach((g, i) => { places[g] = i ? HOT2 : HOT; });
    gallery.filter(n => !guests.includes(n)).slice(0, GALLERY.length).forEach((n, i) => { places[n] = GALLERY[i]; });
    const first = !steps.some(s => s.k === 'scene');
    steps.push({ k: 'scene', spot: 'aftermath-studio', tod: 'day', plate, place: a.isReunion ? 'The Reunion' : 'Total Drama Aftermath', time: 'Live',
      card: first, cut: false, focus: guests, bg: [], places, host, aftermath: true, ...(guests.length ? {} : { wide: true }), ...extra });
  };
  const toGallery = n => { if (n && !gallery.includes(n)) gallery.push(n); };

  // the opening
  set([]);
  say(a.isReunion ? `Welcome to the reunion! One season, every player, and a lot to talk about.` : `Welcome to the Total Drama Aftermath! I'm ${host}, and tonight we talk to the people who got sent home.`);
  steps.push({ k: 'title', kicker: a.isReunion ? 'Live' : `Aftermath ${a.number || ''}`.trim(), name: a.isReunion ? 'The Reunion' : 'Total Drama Aftermath', faces: [...gallery, ...(a.interviewees || [])].slice(0, 8) });
  if (gallery.length) steps.push({ k: 'beat', text: `The Peanut Gallery is in its seats: ${gallery.join(', ')}.`, focus: [], side: [{ tab: 'log', text: `In the gallery: ${gallery.join(', ')}` }] });

  // the interviews: the voted-out first, the finalists at the reunion after
  const ivs = [...(a.interviews || []).filter(iv => !iv.isActive).sort((x, y) => (x.elimEpNum || 0) - (y.elimEpNum || 0)), ...(a.isReunion ? (a.interviews || []).filter(iv => iv.isActive) : [])];
  for (const iv of ivs) {
    const p = iv.player;
    const winner = a.isReunion && iv.isActive && p === ep.winner;
    say(winner ? `And now, the one you've all been waiting for. Our winner: ${p}!` : iv.isActive ? `Next, a finalist. Give it up for ${p}!` : `Our next guest${iv.elimEpNum ? ` went home in episode ${iv.elimEpNum}` : ''}. Give it up for ${p}!`);
    set([p], { act: { kind: 'arrive', who: [p], ride: 'walk' } });
    const cheer = iv.crowdReaction === 'cheers' || iv.crowdReaction === 'standing' || (iv.pop || 0) >= .7, boo = iv.crowdReaction === 'boos' || (iv.pop || 0) <= .25;
    steps.push({ k: 'beat', text: cheer ? `The crowd goes wild for ${p}.` : boo ? `A few boos as ${p} sits down.` : `Polite applause as ${p} takes the hot seat.`, focus: [p], applause: cheer ? 'big' : boo ? 'boo' : 'small',
      side: iv.voters?.length ? [{ tab: 'log', text: `${p}: voted out${iv.elimEpNum ? ` in episode ${iv.elimEpNum}` : ''} by ${iv.voters.join(', ')}.` }] : [] });
    steps.push({ k: 'title', kicker: winner ? 'The winner' : iv.isActive ? 'Finalist' : 'In the hot seat', name: p, faces: [p] });
    if (iv.entranceQuote) line(p, iv.entranceQuote, { loud: /!/.test(iv.entranceQuote) });
    for (const q of iv.questions || []) { line(host, q.q, { focus: [p] }); line(p, q.a); }
    if (iv.lastWords) { steps.push({ k: 'beat', text: `One last thing before ${p} joins the gallery.`, focus: [p] }); line(p, iv.lastWords); }
    toGallery(p);
  }

  // Truth or Anvil: a secret, the receipts, and an anvil for a lie
  if ((a.truthOrAnvil || []).length) {
    set([]);
    say(`Time for everybody's favourite segment. Truth... or Anvil!`);
    steps.push({ k: 'title', kicker: 'Segment', name: 'Truth or Anvil', faces: a.truthOrAnvil.map(t => t.player).slice(0, 6), tone: 'fire' });
    for (const t of a.truthOrAnvil) {
      set([t.player]);
      for (const d of t.dialogue || []) line(d.speaker === host || !d.speaker ? host : d.speaker, d.text, d.speaker && d.speaker !== host ? {} : { focus: [t.player] });
      steps.push({ k: 'beat', text: t.toldTruth ? `The truth. The anvil stays up.` : `A lie. The anvil drops.`, focus: [t.player], act: { kind: t.toldTruth ? 'truth' : 'anvil', who: [t.player] },
        side: [t.evidence && { tab: 'secrets', text: cleanText(t.evidence) }, t.consequence && { tab: 'secrets', text: cleanText(t.consequence) }].filter(Boolean) });
    }
  }

  // the moments the show is remembered for
  for (const m of a.aftermathMoments || []) {
    if (m.type === 'host_roast') {
      set([]);
      if (m.text) { const tg = tagged(m.text.split(/\s(?=The gallery)/)[0], host); line(tg.by, tg.text); }
      steps.push({ k: 'title', kicker: 'Before we go', name: 'The players still out there', faces: (m.players || []).slice(0, 8) });
      for (const r of m.roasts || []) line(host, r);
      continue;
    }
    const who = (m.players || []).filter(n => gallery.includes(n));
    set(who.slice(0, 2));
    steps.push({ k: 'title', kicker: 'Live', name: { confrontation: 'A confrontation', gallery_eruption: 'The gallery erupts', emotional: 'A moment', standing_ovation: 'A standing ovation' }[m.type] || 'A moment', faces: who.slice(0, 4) });
    for (const piece of String(m.text || '').split(/(?<=[.!?])\s+(?=[A-Z"])/).filter(Boolean)) {
      const q = piece.match(/^"([\s\S]+)"$/);
      steps.push(q ? { k: 'say', by: host, host: true, text: said(piece) } : { k: 'beat', text: cleanText(piece), focus: who.slice(0, 2), ...(m.type === 'standing_ovation' ? { applause: 'big' } : {}) });
    }
    if (m.dialogue) for (const d of m.dialogue) line(d.speaker || host, d.text);
  }

  // unseen footage: the tape the players never saw
  if ((a.unseenFootage || []).length) {
    set([]);
    say(`And now, some footage that never made it to air.`);
    steps.push({ k: 'title', kicker: 'Never before seen', name: 'Unseen Footage', faces: [...new Set(a.unseenFootage.flatMap(f => f.players || []))].slice(0, 6) });
    for (const f of a.unseenFootage) steps.push({ k: 'beat', text: cleanText(f.description), focus: [], act: { kind: 'tape' }, side: [{ tab: 'secrets', text: cleanText(f.description) }] });
    steps.push({ k: 'beat', text: `The gallery turns to look at each other.`, focus: [] });
  }

  // the fan call
  if (a.fanCall?.exchanges?.length) {
    const fc = a.fanCall;
    set(fc.target ? [fc.target] : []);
    say(`We've got a fan on the line! ${fc.fanName || 'Caller'}, you're on the Aftermath.`);
    steps.push({ k: 'title', kicker: 'On the line', name: `Fan call: ${fc.fanName || 'a caller'}`, faces: fc.target ? [fc.target] : [] });
    for (const x of fc.exchanges) {
      steps.push({ k: 'beat', text: `${fc.fanName || 'The caller'}: “${said(x.q)}”`, focus: fc.target ? [fc.target] : [], act: { kind: 'phone' } });
      if (fc.target) line(fc.target, x.a);
    }
    for (const r of fc.hostReactions || []) { const tg = tagged(r, host); line(tg.by, tg.text); }
  }

  // the fans' vote: who comes back
  if (a.fanVote?.results?.length) {
    set([]);
    say(`The fans have voted. One of these players gets back in the game.`);
    steps.push({ k: 'title', kicker: 'The fans have voted', name: 'Fan Vote', faces: a.fanVote.results.map(r => r.name).slice(0, 8) });
    [...a.fanVote.results].reverse().forEach(r => steps.push({ k: 'beat', text: `${r.name}: ${r.pct}% of the vote.`, focus: [r.name].filter(n => gallery.includes(n)), tense: r.name === a.fanVote.winner }));
    say(`${a.fanVote.winner}, you're back in the game!`, { focus: [a.fanVote.winner] });
    steps.push({ k: 'title', kicker: 'Returning', name: a.fanVote.winner, faces: [a.fanVote.winner], tone: 'fire' });
  }

  // the reunion: the topics everyone has an opinion on, then the awards
  for (const topic of a.reunionDiscussion || []) {
    const speakers = [...new Set((topic.lines || []).map(l => l.speaker).filter(n => n && n !== host))];
    speakers.forEach(toGallery);
    set(speakers.slice(0, 2));
    steps.push({ k: 'title', kicker: 'The reunion', name: topic.title, faces: speakers.slice(0, 4) });
    for (const l of topic.lines || []) line(l.speaker === host || !l.speaker ? host : l.speaker, l.text);
  }
  if ((a.awards || []).length) {
    set([]);
    say(`And now, the awards nobody asked for. The Gilded Chrises!`);
    for (const aw of a.awards) {
      steps.push({ k: 'beat', text: `${aw.title}...`, focus: [], tense: true });
      steps.push({ k: 'title', kicker: aw.title, name: String(aw.winner), faces: typeof aw.winner === 'string' ? [aw.winner] : [], side: [{ tab: 'log', text: `${aw.title}: ${aw.winner}. ${cleanText(aw.description || '')}` }], applause: 'big' });
    }
    if (a.seasonRating) say(`My rating for this season: ${a.seasonRating.score} out of 10. ${a.seasonRating.comment}`);
  }

  set([]);
  say(a.isReunion ? `That's the season. Goodnight, everybody!` : `That's all for this Aftermath. Stay dramatic!`, { applause: 'big' });
  return { id: 'aftermath-show', kind: 'aftermath', venue: 'islands', ep: ep.num, label: a.isReunion ? 'The Reunion' : 'Aftermath', host, steps };
}
