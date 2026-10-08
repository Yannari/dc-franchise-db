// ══════════════════════════════════════════════════════════════════════
// js/vp-td-ep/aftermath.js — the Total Drama Aftermath, played on the studio stage
// ══════════════════════════════════════════════════════════════════════
// The engine already wrote the show (aftermath.js generateAftermathShow → ep.aftermath: the
// interviews, Truth or Anvil, the moments, the unseen footage, the fan call, and at the reunion the
// finalists, the discussion topics and the awards). This screen stages it in the studio: the host
// on the left couch, each guest walking out to the hot seat on the right, the Peanut Gallery (the
// voted-out already interviewed) on the couches behind them and at the sides of the stage, growing
// as the show goes on. Nothing here decides anything; it says what the engine wrote, in order.
import { plateKey, cleanText } from './steps.js';

// strip the quotes the engine wraps every spoken line in
const said = t => cleanText(String(t || '').trim().replace(/^"([\s\S]*)"$/, '$1').replace(/^“([\s\S]*)”$/, '$1'));
// "Chris: \"...\"" → { by, text }
const tagged = (t, host) => { const m = String(t || '').match(/^([A-Z][\w' .-]{1,30}):\s*([\s\S]+)$/); return m ? { by: m[1], text: said(m[2]) } : { by: host, text: said(t) }; };

// the studio, in the frame's own pixels (1600x900): the host's couch, the hot seat, a second seat
// for a confrontation, and where the gallery sits (the back couches, the centre couch) or stands
const AT = (x, y, o = {}) => ({ u: x / 1600, v: y / 900, ...o });
const HOST = AT(600, 548, { s: .15, sit: true, host: true });
const HOT = AT(1050, 548, { s: .15, sit: true });
const HOT2 = AT(1140, 548, { s: .15, sit: true });
const GALLERY = [AT(785, 522, { s: .14, sit: true }), AT(865, 522, { s: .14, sit: true }), AT(445, 505, { s: .13, sit: true }), AT(1215, 492, { s: .13, sit: true }),
  AT(330, 600, { s: .2 }), AT(1290, 600, { s: .2 }), AT(250, 600, { s: .2 }), AT(1370, 600, { s: .2 }), AT(170, 600, { s: .2 }), AT(1450, 600, { s: .2 })];

export function hasAftermath(ep) { return !!ep?.aftermath && ((ep.aftermath.interviews || []).length || (ep.aftermath.reunionDiscussion || []).length); }

export function tdAftermathScreen(ep, o = {}) {
  if (!hasAftermath(ep)) return null;
  const a = ep.aftermath;
  const plate = plateKey('islands', 'aftermath-studio', 'day');
  if (!plate) return null;
  const host = o.host || 'Chris';
  const steps = [];
  const gallery = [...(a.peanutGallery || [])];
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
      card: first, cut: false, focus: guests, bg: [], places, host, aftermath: true, ...extra });
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
