// ══════════════════════════════════════════════════════════════════════
// vp-tr/mission-bespoke.js — the four bespoke afternoons, drawn
// ══════════════════════════════════════════════════════════════════════
//
// Task 8, stage 2. js/vp-tr/mission.js draws the seven ARCHETYPE afternoons —
// a stat pair, two teams, a tier of prose. A bespoke afternoon
// (js/tr/missions/) is a television episode: a full briefing, three phases on
// three stat pairs, a per-player record, scenes with confessionals, a running
// tally. Four of them exist and each is its OWN WORLD — a tidal sandbar, a
// freezing observatory, a counting room in daylight, a burnt wing full of ash —
// and the four approved mockups (mockup-tr-*.html) are the visual source of
// truth this file reproduces.
//
// ── ONE FRAMEWORK, FOUR THEMES ────────────────────────────────────────
//
// Adding a fifth mission must be cheap (Task 8 coordinator ruling), so the
// PLUMBING is shared and only the LOOK is per-mission. `rpBuildBespokeMission`
// reads the record, builds the hero / briefing / phases / summary / controls
// and the reveal machinery ONCE; a `THEME` entry keyed by the mission id
// supplies the palette, the fonts, the atmosphere, the card vocabulary and the
// one organising primitive that belongs to that world (the tide gauge, the
// orrery, the ledger, the wing in section). A new mission is: its
// js/tr/missions/<id>.js, a THEME entry here, and its registry line in
// js/tr/missions/index.js. No new screen entry, no text-backlog edit, no
// episode-history edit — the registry in js/vp-tr/screens.js dispatches every
// afternoon through the one `tr-mission` screen, and the transcript
// retranscribes whatever this file renders.
//
// ── DISPATCH ──────────────────────────────────────────────────────────
//
// js/vp-tr/mission.js's `rpBuildMission` calls `isBespokeMissionRec()` and
// hands a bespoke record here; `trMissionRevealNext/All` there detect a bespoke
// screen (by `window.__trBespoke[epNum]`) and delegate to the reveal functions
// below. One screen entry, one revealer name, two builders behind it.
//
// ── AVATARS ───────────────────────────────────────────────────────────
//
// A user requirement: every player the afternoon names carries a face. The
// established portrait is `_portrait()` (js/vp-tr/conclave.js), reused here so a
// missing avatar degrades to initials gracefully. Faces appear on the two team
// rosters under the hero, on every phase card's name line (per-player state and
// phase results), and on every scene's participants (the fallout). The mockups
// predate this requirement and show no faces; the rosters and the card faces
// are the one place this builder deliberately adds to them.
import { players, seasonConfig } from '../core.js';
import { HOSTS_BY_FORMAT } from '../shows.js';
import { _portrait } from './conclave.js';
import { PORTRAIT_CSS, TR_NAV_TOP } from './style.js';

// ── deterministic picking, escaping, money ────────────────────────────
function _hash(s) {
  let h = 2166136261; const str = String(s);
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function _pick(pool, key) { return (!pool || !pool.length) ? '' : pool[_hash(key) % pool.length]; }
const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const _money = n => '&pound;' + Number(n || 0).toLocaleString('en-GB');
const _cap = s => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

function _slugOf(name) {
  const p = (players || []).find(x => x && x.name === name);
  return (p && p.slug) || String(name || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
/** A face. Neutral (no conclave lamp) — these screens are outdoors and in daylight. */
function _av(name, size) { return _portrait(_slugOf(name), name, size || 30); }

/**
 * THE CONFIGURED HOST, RESOLVED FROM THE REGISTRY. The ceremony stores every
 * host beat as "the host" (never a literal name — see contract.js), and the
 * screen substitutes the season's own, exactly as the archetype mission screen
 * and the conclave do. This is where "the host" becomes a person.
 */
function _host() {
  const list = HOSTS_BY_FORMAT[TR] || [];
  const want = seasonConfig && seasonConfig.host;
  const hit = list.find(h => h.value === want) || list[0] || { value: 'host', label: 'the host' };
  return { name: hit.label || 'the host',
    slug: String(hit.value || 'host').toLowerCase().replace(/[^a-z0-9]+/g, '-') };
}
function _hostName() { return _host().name; }
/** The host, with a face, exactly as the archetype mission screen carries them. */
function _hostAv(size) { const h = _host(); return _portrait(h.slug, h.name, size || 40); }
/** Put the host's name in for the placeholder, keeping sentence capitalisation. */
function _nameHost(text, name) {
  return String(text || '')
    .replace(/\bThe host\b/g, name)
    .replace(/\bthe host\b/g, name);
}
const TR = 'traitors';

// ══════════════════════════════════════════════════════════════════════
// THE VIEW — pull everything the screen needs off the episode row
// ══════════════════════════════════════════════════════════════════════
//
// Off `ep.tr.mission`, which `_recordEpisode` (js/tr/headless.js) snapshots per
// row — never off `gs`, which a screen must not reach into (it holds the
// season's whole log). The steps are the phase CARDS: every beat, plus every
// scene, in phase order. A beat whose only witness is its own player and which
// a scene already tells in full (the freeze, the miscount) is SUPPRESSED in
// favour of the richer scene — the same collapse the mockups make.

/** The record fields a Shield search writes, one per mission. */
const SHIELD_FIELDS = new Set(['leftTheRelay', 'askedForMoreTime', 'wentForTheFont',
  'setTheHiddenRing', 'tookTheAgentsOffer', 'wentForAShield', 'unpickedTheHare', 'tookTheGambit', 'wonTheKneeling', 'tookTheSword', 'laidTheFirstLily']);

const GOOD = new Set(['strong', 'cross', 'right', 'sharp', 'true', 'on', 'good', 'win']);
const BAD = new Set(['weak', 'freeze', 'wrong', 'lost', 'out', 'bad', 'lose', 'stop', 'dull']);

function _toneOf(kind) { return GOOD.has(kind) ? 'good' : BAD.has(kind) ? 'bad' : 'steady'; }

// ── SAID ON THE COURSE (2026-09-30) ───────────────────────────────────
//
// The user: "we needed more dialogue in mission anyway". A beat was a
// narrated action ("B swapped two letters and lost the raven") and nobody
// said a word about it. Now a teammate reacts out loud to a good or bad
// moment, and the player answers — as a PAIR, so the answer fits what was
// said. Only ever a member of the SAME team, and only about what just
// happened in front of them. {p} is the player.
const BANTER = {
  good: [
    ['Yes! Go on, {p}!', 'Don’t jinx it.'],
    ['How did you do that?', 'Honestly? No idea.'],
    ['{p}, you absolute genius.', 'Say that again at the Round Table.'],
    ['That’s it. That’s the one.', 'Told you I’d get one.'],
  ],
  bad: [
    ['{p}! What was that?', 'I know. I know!'],
    ['It’s fine. It’s fine. Next one.', 'Sorry. I thought I had it.'],
    ['Come on, {p}, that one was easy!', 'Then you do it.'],
    ['Don’t worry about it. Go again.', 'Thank you. Right. Again.'],
    ['Were you even looking?', 'It moved, I swear it moved.'],
  ],
};
// EACH AFTERNOON ITS OWN WORDS. A line has to be about the thing in front of
// them — "the whole leg's come off" at the wicker beasts, "you've turned it the
// wrong way" at the orrery — or it reads as nonsense under a beat about a
// dinner toast. The generic pool above is the fallback for an afternoon that
// has none here.
const BANTER_BY = {
  'ash-vault': {
    good: [['That’s holding. Don’t touch it.', 'I wasn’t going to.'], ['Steady hands, {p}. Keep going.', 'Stop talking to me, I’m concentrating.'], ['You’ve done this before.', 'Never. Don’t tell anyone.']],
    bad: [['{p}, the whole thing just moved!', 'I know! I felt it!'], ['Careful! That beam isn’t safe.', 'Now you tell me.'], ['Slow down. Nobody’s racing us.', 'The clock is.']],
  },
  'beacon-lighting': {
    good: [['It’s lit! {p}, it’s lit!', 'Row, then! Next one!'], ['Keep the raft straight, {p}. That’s it.', 'My arms are on fire.'], ['That’s another one. We can do this.', 'Don’t count yet.']],
    bad: [['You’re drifting, {p}! Left, left!', 'Which left?'], ['It went out. It actually went out.', 'The wind took it, not me.'], ['{p}, you’re soaked.', 'The loch won that one.']],
  },
  'buried-alive': {
    good: [['Keep digging, {p}, I can hear them!', 'I can see the lid!'], ['Faster than I thought you’d be.', 'Nobody’s staying down there on my watch.'], ['That’s it, get them out.', 'Grab an arm. Pull.']],
    bad: [['Wrong plot, {p}! That’s the wrong plot!', 'They all look the same in the dark!'], ['{p}, you’re digging in circles.', 'The ground keeps caving in!'], ['Come on, they’re running out of air.', 'I’m going as fast as I can.']],
  },
  'church-match': {
    good: [['You knew exactly what they’d say.', 'I listen more than people think.'], ['That’s a match, {p}!', 'Told you I know them.'], ['How did you get that?', 'Lucky guess. Mostly.']],
    bad: [['{p}, you don’t know them at all.', 'Apparently not.'], ['That wasn’t even close.', 'I thought I had them worked out.'], ['Really? That’s what you went with?', 'In my head it made sense.']],
  },
  'drowned-causeway': {
    good: [['Go, {p}! The tide’s behind you!', 'Don’t wait for me!'], ['You made that look easy.', 'It was not easy.'], ['That’s the marker. Grab it!', 'Got it! Go, go!']],
    bad: [['{p}, the water’s coming in!', 'I can see that!'], ['You’ve dropped it. It’s gone under.', 'I had it, and then I didn’t.'], ['Come back, it’s too deep!', 'Not without the marker!']],
  },
  funeral: {
    good: [['That was beautiful, {p}.', 'Somebody had to say it properly.'], ['Hold your end, {p}. Steady.', 'I’ve got it. Just walk.'], ['You kept it together.', 'Only just.']],
    bad: [['{p}, watch the coffin!', 'I’ve got it, I’ve got it!'], ['Did you just laugh? At a funeral?', 'Nerves. It’s nerves.'], ['You missed your moment.', 'Nobody told me there was a moment.']],
  },
  'long-account': {
    good: [['That column adds up. {p}, it adds up!', 'Check it again anyway.'], ['You found it. The missing entry.', 'It was hiding in plain sight.'], ['How are you this fast with numbers?', 'Years of splitting bills.']],
    bad: [['{p}, that total’s wrong.', 'Then you add it up.'], ['You’ve skipped a page.', 'The pages are stuck together!'], ['We’ve been through that book twice.', 'Third time lucky.']],
  },
  'nightjar-orrery': {
    good: [['That’s the alignment! {p}, look!', 'Don’t touch it. Nobody breathe.'], ['You read the sky better than the book.', 'The book’s wrong. The sky isn’t.'], ['It clicked. It actually clicked.', 'I told you the third ring moved.']],
    bad: [['{p}, you’ve turned it the wrong way.', 'It said clockwise!'], ['Now nothing lines up.', 'Give me a second. I can fix it.'], ['My hands are frozen. Are yours?', 'I can’t feel the brass any more.']],
  },
  roulette: {
    good: [['Well played, {p}.', 'It was the wheel, not me.'], ['I’d follow you into any bet.', 'Careful. I might hold you to that.'], ['You kept your nerve.', 'Somebody had to.']],
    bad: [['{p}, that was our money.', 'It was the table’s decision, not mine.'], ['Hold your nerve, {p}.', 'I am holding it. It’s just shaking.'], ['You’ve gone very quiet.', 'Just watching the wheel.']],
  },
  'traitors-chess': {
    good: [['Good move, {p}.', 'I saw it three turns ago.'], ['That’s check. That’s actually check.', 'Don’t celebrate yet.'], ['You’re better at this than you look.', 'Everyone says that.']],
    bad: [['{p}, you’ve left me wide open!', 'I didn’t see the bishop!'], ['Why would you move there?', 'It looked safe from where I was standing.'], ['That’s me off the board, then. Thanks, {p}.', 'Sorry! I’m sorry!']],
  },
  'traitors-monument': {
    good: [['You cracked it, {p}!', 'It’s just dots, once you see it.'], ['How did you know that?', 'I just listened to the question.'], ['Read it again, slower. Yes!', 'Right first time.']],
    bad: [['{p}, that’s the wrong figure!', 'The code said the eye!'], ['You answered too fast.', 'I was sure. I was so sure.'], ['We lost that one because of you.', 'Then you answer the next one.']],
  },
  'wicker-beasts': {
    good: [['It’s standing! {p}, it’s standing!', 'Don’t breathe on it.'], ['Tie it off there. Perfect.', 'My fingers are shredded.'], ['That antler looks incredible.', 'It looks like a coat hanger, but thank you.']],
    bad: [['{p}, the whole leg’s come off!', 'It was loose before I touched it!'], ['That’s not how willow bends.', 'It is now.'], ['Careful, you’re pulling the frame down!', 'It’s pulling me!']],
  },
};
function _banter(m, card, key, used) {
  if (card.isSocial || (card.tone !== 'good' && card.tone !== 'bad')) return null;
  const p = card.who[0];
  const team = (m.teams || []).find(t => t.name === card.team);
  const mates = team ? (team.members || []).filter(n => n !== p) : [];
  if (!mates.length) return null;
  const by = mates[_hash(key + '|by') % mates.length];
  const pool = (BANTER_BY[m.id] || BANTER)[card.tone];
  let i = _hash(key) % pool.length;
  for (let d = 0; d < pool.length && used.has(pool[i][0]); d++) i = (i + 1) % pool.length;
  used.add(pool[i][0]);
  const fill = t => t.replace(/\{p\}/g, p);
  return [{ who: by, text: fill(pool[i][0]) }, { who: p, text: fill(pool[i][1]) }];
}

function _view(ep) {
  const m = ep && ep.tr && ep.tr.mission;
  if (!m || !Array.isArray(m.phases) || m.phases.length < 3) return null;
  const cer = m.ceremony || {};
  // THE REVEAL KEY IS THE ROW'S `num`, NOT THE RECORD'S DAY. The transcript
  // (js/vp-tr/screens.js `traitorsScreensRevealed`) renumbers a copy of the row
  // so it can reveal everything without touching the live screen; keying on
  // `m.ep` sent that reveal-all to the live key, and every mission opened fully
  // revealed with Next disabled. `day` is the record's own, for display.
  const day = m.ep != null ? m.ep : (ep.num || 0);
  const epNum = ep.num != null ? ep.num : day;

  const scenesByPhase = {};
  for (const s of (m.scenes || [])) {
    (scenesByPhase[s.phase] = scenesByPhase[s.phase] || []).push(s);
  }
  // players a sole-participant scene speaks for — suppress their plain beat
  const soloScenePlayers = {};
  for (const s of (m.scenes || [])) {
    if ((s.participants || []).length === 1) {
      (soloScenePlayers[s.phase] = soloScenePlayers[s.phase] || new Set()).add(s.participants[0]);
    }
  }

  const banterUsed = new Set();
  const phases = m.phases.map(p => {
    const suppress = soloScenePlayers[p.id] || new Set();
    // CURATED THE WAY THE MOCKUP IS. A phase has a beat for every living player;
    // an 18-player shoring would print eighteen near-identical cards. The
    // approved mockup shows a REPRESENTATIVE HANDFUL — the standouts, one or two
    // steady, and every social scene — so the card stream is capped to the same
    // density: the most notable beats first (anybody who did well or badly),
    // then a steady or two for the middle, at most five per phase. The team
    // scores and the sidebar are computed from the WHOLE field regardless, so
    // the money is never curated — only how many faces the stream stops on.
    const eligible = (p.beats || []).filter(b => !suppress.has(b.player))
      .map(b => ({ phaseId: p.id, kind: b.kind, tone: _toneOf(b.kind),
        who: [b.player], team: b.team, text: b.text, isSocial: false }));
    const notable = eligible.filter(b => b.tone !== 'steady');
    const steady = eligible.filter(b => b.tone === 'steady');
    const beatCards = [...notable.slice(0, 4), ...steady.slice(0, 2)].slice(0, 5);
    beatCards.forEach((c, k) => { c.said = _banter(m, c, 'mb|' + (m.id || '') + '|' + day + '|' + p.id + '|' + k, banterUsed); });
    const sceneCards = (scenesByPhase[p.id] || []).map(s => ({
      phaseId: p.id, kind: s.behaviour || 'steady', tone: _behaviourTone(s.behaviour),
      who: [...(s.participants || [])],
      team: _teamOf(m, (s.participants || [])[0]),
      text: s.text, isSocial: true, behaviour: s.behaviour || null,
      conf: s.confessional ? { speaker: s.confessional.speaker, text: s.confessional.text } : null,
      fx: _fxLabels(s.effects || []),
      relic: (s.effects || []).some(e => e.kind === 'record' && SHIELD_FIELDS.has(e.field))
        || (s.effects || []).some(e => e.kind === 'shield'),
    }));
    return {
      id: p.id, name: p.name, setting: p.setting || '', stats: p.stats || [],
      teams: p.teams || [], cards: [...beatCards, ...sceneCards],
    };
  });

  return {
    epNum, day, id: m.id, name: m.name || 'The Mission',
    staging: cer.staging || '', hostBeats: cer.hostBeats || [], rulePoints: cer.rulePoints || [],
    phases,
    teams: (m.teams || []).map(t => ({ name: t.name, members: [...(t.members || [])], perf: t.perf,
      buried: Array.isArray(t.buried) ? [...t.buried] : [] })),
    bestTeam: m.bestTeam || null, tier: m.tier || 'solid', summary: m.summary || '',
    // THE ROW CARRIES THE SHIELD AS `relic` (js/tr/headless.js
    // `_missionRecord`); `m.shield` exists only on a live record. Reading only
    // `shield` left the Ash Vault's flue box saying nobody had gone up it after
    // the reveal that showed somebody had.
    tally: m.tally || {},
    shield: m.shield || (m.relic && m.relic.kind === 'shield' ? m.relic : null),
    potBefore: typeof m.potBefore === 'number' ? m.potBefore : Math.max(0, (m.potAfter || 0) - (m.earned || 0)),
    earned: Number(m.earned || 0), potAfter: Number(m.potAfter || 0),
  };
}

function _teamOf(m, name) {
  const t = (m.teams || []).find(x => (x.members || []).includes(name));
  return t ? t.name : '';
}
function _behaviourTone(b) {
  if (b === 'heroic' || b === 'impressive') return 'good';
  if (b === 'selfish' || b === 'cowardly' || b === 'suspicious') return 'bad';
  return 'steady';
}

/**
 * Human labels for a scene's declared effects — DISPLAY ONLY. Two visually
 * distinct kinds come back, and the split is deliberate:
 *
 *  - WIRED effects (`bond`, `crowd`, `suspicion`, `claim`, `shield`) are the
 *    ones `js/tr/missions/apply.js` actually writes through the scene API. They
 *    carry a signed number or an arrow — a real, applied consequence — and
 *    render as the numeric chip the mockup shows.
 *  - NOTE effects (`record`, `reputation`) are declared by the mission but
 *    `apply.js` DELIBERATELY DROPS them: there is no reputation store and
 *    `record`'s only reader is its own prose. Rendering them in the same numeric
 *    chip made a viewer read a dead line as a live one — "reputation · sharpness
 *    +0.6" looked exactly like the wired bond/crowd deltas beside it. They now
 *    come back `note:true`, WITHOUT any numeric delta, and the renderer styles
 *    them as a plainly descriptive aside so they can never be mistaken for a
 *    consequence the engine applied.
 */
function _fxLabels(effects) {
  const out = [];
  for (const e of effects) {
    if (e.kind === 'bond') out.push({ note: false, html: `bond ${e.players[0]} &harr; ${e.players[1]} ${_signed(e.delta)}` });
    else if (e.kind === 'crowd') out.push({ note: false, html: `crowd &middot; ${e.name} ${e.colour} &times;${e.mult}` });
    else if (e.kind === 'suspicion') out.push({ note: false, html: 'suspicion ' + _signed(e.delta) });
    else if (e.kind === 'claim') out.push({ note: false, html: `claim &middot; ${e.claimant} &rarr; ${e.about}` });
    else if (e.kind === 'shield') out.push({ note: false, html: 'shield &middot; ' + _esc(e.source || 'found in the flue') });
    else if (e.kind === 'record') out.push({ note: true, html: 'noted &middot; ' + _esc(_recordNote(e)) });
    else if (e.kind === 'reputation') out.push({ note: true, html: 'noted &middot; ' + _esc(_reputationNote(e)) });
  }
  return out;
}
function _signed(n) { const v = Math.round(Number(n) * 100) / 100; return (v >= 0 ? '+' : '') + v; }
/** A `record` effect as delta-free words — never a number that reads as applied. */
function _recordNote(e) {
  const f = e.field || '';
  if (f === 'settlementCount' && e.value && typeof e.value === 'object')
    return `${e.value.holds} held, ${e.value.takes} took, no names read`;
  const words = f.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  if (e.value === true || e.value == null) return words;
  return `${words} (${e.value})`;
}
/** A `reputation` effect as a delta-free descriptive aside, keyed by axis+direction. */
function _reputationNote(e) {
  const up = Number(e.delta) >= 0;
  if (e.axis === 'nerve') return up ? 'nerve held under it' : 'nerve went';
  if (e.axis === 'sharpness') return up ? 'read as the sharp one' : 'looked off the pace';
  return `${e.axis || 'form'} ${up ? 'up' : 'down'}`;
}

// ══════════════════════════════════════════════════════════════════════
// SHARED BUILDERS — hero, roster, briefing, phases, cards, summary
// ══════════════════════════════════════════════════════════════════════

function _heroRoster(v, th) {
  return '<div class="mb-roster">' + v.teams.map((t, i) =>
    '<div class="mb-rteam" data-side="' + i + '">'
    + '<div class="mb-rname">' + _esc(t.name) + '</div>'
    + '<div class="mb-rfaces">' + t.members.map(n =>
      '<span class="mb-rf" title="' + _esc(n) + '">' + _av(n, 30) + '</span>').join('')
    + '</div></div>').join('') + '</div>';
}

function _briefing(v, th) {
  const p = th.prefix;
  const host = _hostName();
  const beats = v.hostBeats.map(b => {
    const cls = b.kind === 'say' ? 'say' : 'do';
    const raw = b.kind === 'say' ? b.text : (b.action || b.text || '');
    const text = _nameHost(raw, host);
    const shield = (th.shieldBeat && b.kind === 'say' && th.shieldBeat.test(raw)) ? ' shield' : '';
    return '<div class="' + p + '-beat ' + cls + shield + '"><p>' + _esc(text) + '</p></div>';
  }).join('');
  const rules = v.rulePoints.map(r =>
    '<span class="' + p + '-rule"><b>' + _esc(r.id) + '</b> beat ' + ((r.explainedByBeat | 0) + 1) + '</span>').join('');
  return '<section class="' + p + '-brief' + (th.sheetBrief ? ' ' + p + '-sheet' : '') + '">'
    + '<div class="mb-hosthead"><span class="mb-hostav">' + _hostAv(46) + '</span>'
    + '<div><h2>The Briefing</h2>'
    + '<div class="mb-hostname">' + _esc(host) + ' &middot; your host</div></div></div>'
    + '<p class="' + p + '-staging">' + _esc(v.staging) + '</p>'
    + beats
    + '<div class="' + p + '-rules">' + rules + '</div>'
    + '</section>';
}

/** The card who-line, with faces. */
function _who(card) {
  const names = card.who;
  const faces = names.map(n => _av(n, 28)).join('');
  // A WHOLE TEAM IS A TEAM. Ten names chained with ampersands wrapped under
  // the card's tag and printed "SUSPICIOUS" across "Gerry & Izzy"; past three
  // names the faces say who, and the label says how many.
  const who = names.length > 3
    ? (card.team ? _esc(card.team) + ' &middot; ' : '') + names.length + ' of them'
    : names.length === 3 ? _esc(names[0]) + ', ' + _esc(names[1]) + ' &amp; ' + _esc(names[2])
      : names.map(_esc).join(' &amp; ');
  const label = who + (card.team && names.length <= 3 ? ' &middot; ' + _esc(card.team) : '');
  return '<span class="mb-avs">' + faces + '</span><span class="mb-nm">' + label + '</span>';
}

/** The default card DOM (causeway / orrery / ash all share it). A theme with a
 *  genuinely different card (the ledger's ruled entry) supplies `renderCard`. */
function _defaultCard(v, c, id, th) {
  const p = th.prefix;
  const conf = c.conf
    ? '<div class="' + p + '-conf"><small>' + _esc(c.conf.speaker) + ' &middot; confessional</small>'
      + _esc(c.conf.text) + '</div>' : '';
  const fx = (c.fx && c.fx.length)
    ? '<div class="' + p + '-fx">' + c.fx.map(f =>
        '<span' + (f.note ? ' class="mb-fx-note"' : '') + '>' + f.html + '</span>').join('') + '</div>' : '';
  const relic = (c.relic && !th.ownShield) ? ' mb-relic' : '';
  return '<article class="' + p + '-card ' + th.cardClass(c) + relic + '" id="' + id + '">'
    + th.icon(c, c._ph) + '<span class="' + p + '-tag">' + _esc(th.cardTag(c, c._ph)) + '</span>'
    + '<div class="' + p + '-who mb-wholine">' + _who(c) + '</div>'
    + '<div class="' + p + '-txt">' + _esc(c.text) + '</div>'
    + (c.said || []).map(x => '<div class="mb-said"><cite>' + _esc(x.who) + '</cite> '
      + '<span class="mb-said-txt">&ldquo;' + _esc(x.text) + '&rdquo;</span></div>').join('')
    + conf + fx + '</article>';
}

function _phaseSection(v, ph, th, startIdx) {
  const p = th.prefix;
  let i = startIdx;
  const cards = ph.cards.map((c, k) => {
    c._ph = ph;
    const id = 'mb-step-' + v.epNum + '-' + (i + k);
    return th.renderCard ? th.renderCard(v, c, id, th) : _defaultCard(v, c, id, th);
  }).join('');
  const stats = ph.stats.map(s => '<i class="' + p + '-stat">' + _esc(s) + '</i>').join('');
  return {
    html: '<section class="' + p + '-phase" data-phase="' + _esc(ph.id) + '">'
      + '<div class="' + p + '-phase-head">'
      + th.phaseNum(ROMAN[ph._num] || ph._num, ph)
      + '<span class="' + p + '-phase-name">' + _esc(ph.name) + '</span>'
      + '<span class="' + p + '-phase-stats">' + stats + '</span></div>'
      + '<p class="' + p + '-setting">' + _esc(ph.setting) + '</p>'
      + cards + '</section>',
    count: ph.cards.length,
  };
}

// ══════════════════════════════════════════════════════════════════════
// THE SCREEN
// ══════════════════════════════════════════════════════════════════════

const THEME = {};   // filled at the bottom

// ── THE SHARED SHIELD BOX ─────────────────────────────────────────────
// For the themes that do not draw their own (the causeway, the orrery, the
// counting room). Sealed until the card that shows somebody going for it.
function _shieldStates(v, total) {
  let relicAt = -1, i = 0;
  for (const p of v.phases) for (const c of p.cards) { if (c.relic && relicAt < 0) relicAt = i; i++; }
  const sh = v.shield || null;
  const out = [];
  for (let n = 0; n <= total; n++) {
    const seen = !!sh && sh.searcher && relicAt >= 0 && n > relicAt;
    const offered = !sh || sh.offered !== false;
    out.push({
      lit: seen && !!sh.found,
      seen,
      val: !offered ? 'not on offer today'
        : !seen ? 'still where the host left it'
          : sh.found ? sh.holder + ' has it' : sh.searcher + ' went for it and came back empty',
      cost: seen ? ('cost the team ' + _money(sh.cost || 0).replace('&pound;', '£')
        + (sh.found ? ' · seen by ' + (sh.witnesses || []).length : '')) : '',
      holder: seen && sh.found ? sh.holder : null,
    });
  }
  return out;
}
function _shieldBox(v, s) {
  const e = v.epNum;
  return '<div class="mb-shield' + (s && s.lit ? ' on' : '') + '" id="mb-shield-' + e + '">'
    + '<div class="mb-shield-l">The Shield</div>'
    + '<div class="mb-shield-h" id="mb-shield-h-' + e + '"' + (s && s.holder ? '' : ' hidden') + '>'
    + (v.shield && v.shield.holder ? _av(v.shield.holder, 40) : '') + '</div>'
    + '<div class="mb-shield-v" id="mb-shield-v-' + e + '">' + _esc(s ? s.val : '') + '</div>'
    + '<div class="mb-shield-c" id="mb-shield-c-' + e + '">' + _esc(s ? s.cost : '') + '</div></div>';
}
function _paintShield(e, s) {
  if (!s) return;
  const box = document.getElementById('mb-shield-' + e);
  if (box) box.classList.toggle('on', s.lit);
  const h = document.getElementById('mb-shield-h-' + e);
  if (h) h.hidden = !s.holder;
  const v = document.getElementById('mb-shield-v-' + e);
  if (v) v.textContent = s.val;
  const c = document.getElementById('mb-shield-c-' + e);
  if (c) c.textContent = s.cost;
}

/** True when this record is a bespoke afternoon this file can draw. */
/** For the watch-it-played stage (mission-bespoke-stage.js): the page's own
 *  view — the same curated cards, banter and confessionals — and its theme. */
export function bespokeStageData(ep) {
  const v = _view(ep);
  if (!v) return null;
  const th = THEME[v.id] || null;
  const h = _host();
  // THE THEME'S OWN SET, at rest: the scene each afternoon's page already draws
  // (the loch, the causeway, the church), lifted out of its strip so the stage
  // plays in the right place rather than on a generic field
  let scene = null;
  try {
    if (th && th.stage && th.sideStates) {
      const total = v.phases.reduce((a, p) => a + p.cards.length, 0) + v.phases.length + 2;
      const html = th.stage(v, th.sideStates(v, total), 0);
      const a = html.indexOf('<svg class="ms-scene"'), b = html.indexOf('<div class="ms-layer');
      if (a >= 0 && b > a) scene = html.slice(a, b);
    }
  } catch { scene = null; }
  return { v, title: th && th.title ? th.title(v) : null, host: { name: h.name, slug: h.slug }, scene };
}

export function isBespokeMissionRec(m) { return !!(m && m.id && THEME[m.id]); }

const _bespokeState = {};
function _state(epNum, total) {
  const k = 'be-' + epNum;
  if (!_bespokeState[k]) _bespokeState[k] = { idx: -1, total };
  _bespokeState[k].total = total;
  if (_bespokeState[k].idx > total - 1) _bespokeState[k].idx = total - 1;
  return _bespokeState[k];
}

export function rpBuildBespokeMission(ep, observer = 'audience') {
  const v = _view(ep);
  if (!v) return '';
  const th = THEME[v.id];
  const p = th.prefix;

  // number the phases and lay out the cards as a single reveal stream
  v.phases.forEach((ph, n) => { ph._num = n + 1; });
  let idx = 0;
  const phaseHtml = [];
  for (const ph of v.phases) {
    const built = _phaseSection(v, ph, th, idx);
    phaseHtml.push(built.html);
    idx += built.count;
  }
  const total = idx;
  const st = _state(v.epNum, total);

  // per-step sidebar snapshots, computed here (plain data) and read by the
  // reveal handler — the mockup's own pattern, derived from the record.
  const states = th.sideStates(v, total);
  if (typeof window !== 'undefined') {
    window.__trBespoke = window.__trBespoke || {};
    window.__trBespoke[v.epNum] = { prefix: p, missionId: v.id, total, states,
      shieldStates: th.ownShield ? null : _shieldStates(v, total), epNum: v.epNum };
    if (window.__trMission) delete window.__trMission[v.epNum]; // this ep is bespoke, not archetype
  }

  const call = fn => fn + "('mission'," + total + ',' + v.epNum + ')';
  const observerLine = observer === 'audience'
    ? 'the whole afternoon, told the way the country saw it'
    : 'the work, the teams and the money are public';

  const body = '<div class="' + p + '-body">'
    + '<header class="' + p + '-hero">'
    + '<div class="' + p + '-kicker">Mission &middot; Day ' + v.day + '</div>'
    + th.title(v)
    + '<p class="' + p + '-sub">' + _esc(th.sub(v)) + '</p>'
    + '<div class="' + p + '-meta">' + th.chips(v).map(c =>
      '<span class="' + p + '-chip' + (c.shield ? ' shield' : '') + '">' + _esc(c.text) + '</span>').join('') + '</div>'
    + _heroRoster(v, th)
    + '</header>'
    + '<div class="mb-observer"><span>Observer</span> ' + _esc(observer) + ' &mdash; ' + observerLine + '</div>'
    // A STAGE, for a theme that has one: a full-width animated scene above the
    // cards, driven by the same per-step states as the sidebar.
    + (th.stage ? th.stage(v, states, st.idx + 1) : '')
    + '<div class="' + p + '-grid">'
    + '<main>'
    + _briefing(v, th)
    + phaseHtml.join('')
    + '<div class="' + p + '-summary" id="mb-summary-' + v.epNum + '"'
    + (st.idx >= total - 1 ? '' : ' style="opacity:.3"') + '>'
    + '<small>The afternoon &middot; ' + _esc(v.tier) + '</small>' + _esc(v.summary) + '</div>'
    + '</main>'
    + '<aside class="' + p + '-side">' + th.sidebar(v, st.idx + 1, states)
    + (th.ownShield ? '' : _shieldBox(v, _shieldStates(v, total)[st.idx + 1]))
    + '</aside>'
    + '</div></div>';

  const controls = '<div class="' + p + '-controls">'
    + '<button class="' + p + '-btn" id="mb-next-' + v.epNum + '"'
    + (st.idx >= total - 1 ? ' disabled' : '') + ' onclick="' + call('trMissionRevealNext') + '">'
    + th.nextLabel + '</button>'
    + '<span class="' + p + '-counter" id="mb-counter-' + v.epNum + '">'
    + (st.idx + 1) + ' of ' + total + ' ' + th.revealedWord + '</span>'
    + '<button class="' + p + '-btn ghost" onclick="' + call('trMissionRevealAll') + '">' + th.allLabel + '</button>'
    + '</div>';

  // AN @import COUNTS ONLY AT THE TOP OF A STYLESHEET. Every theme's font
  // import sat after COMMON_CSS and was silently dropped, so no bespoke
  // mission ever drew in its own face. Hoisted here for all of them.
  // (The URLs themselves contain semicolons — `wght@500;700` — so the match
  // runs to the closing parenthesis, not the first `;`.)
  const IMPORT = /@import\s+url\([^)]*\)\s*;/g;
  const imports = (th.css.match(IMPORT) || []).join('');
  const first = '<style>' + imports + th.css.replace(IMPORT, '') + PORTRAIT_CSS + '</style>'
    // `mb-scope` is what COMMON_CSS keys the first-paint `data-on` rule to.
    // Without it a re-drawn screen showed every revealed card at opacity 0.
    + '<div class="' + p + '-root ' + p + '-scope mb-scope" style="' + th.rootVars + '">'
    + '<div class="' + p + '-shell" id="mb-shell-' + v.epNum + '">'
    + '<div class="' + p + '-scenery" aria-hidden="true">' + th.atmosphere() + '</div>'
    + body + '</div>' + controls + '</div>';

  // reflect the reveal state the viewer's copy is keeping onto the first paint
  return _paintInto(first, v.epNum, st.idx, total, p);
}

/** Add the `.on` class to every card up to `idx` in the markup string (first paint). */
function _paintInto(html, epNum, idx, total, p) {
  let out = html;
  for (let i = 0; i <= idx && i < total; i++) {
    out = out.replace('id="mb-step-' + epNum + '-' + i + '"',
      'id="mb-step-' + epNum + '-' + i + '" data-on="1"');
  }
  // data-on -> the theme card `on` class, applied by CSS attribute selector so
  // no per-theme class name is baked here
  return out;
}

// ══════════════════════════════════════════════════════════════════════
// REVEAL — DOM-only, dispatched from js/vp-tr/mission.js
// ══════════════════════════════════════════════════════════════════════

// `mode` tells a staged theme how to paint: 'next' plays the step's
// animation, 'all' and 'mount' land on the end state.
function _reapply(epNum, idx, total, mode = 'all') {
  const scroller = document.querySelector('.rp-main');
  const top = scroller ? scroller.scrollTop : 0;
  for (let i = 0; i < total; i++) {
    const el = document.getElementById('mb-step-' + epNum + '-' + i);
    if (el) el.classList.toggle('on', i <= idx);
  }
  const counter = document.getElementById('mb-counter-' + epNum);
  const store = (typeof window !== 'undefined' && window.__trBespoke && window.__trBespoke[epNum]) || null;
  const word = store ? (THEME[store.missionId].revealedWord) : 'revealed';
  if (counter) counter.textContent = Math.min(idx + 1, total) + ' of ' + total + ' ' + word;
  const next = document.getElementById('mb-next-' + epNum);
  if (next) next.disabled = idx >= total - 1;
  const summary = document.getElementById('mb-summary-' + epNum);
  if (summary) summary.style.opacity = idx >= total - 1 ? '1' : '.3';
  if (store) {
    try { THEME[store.missionId].paintSide(store.prefix, store.states, idx + 1, mode); } catch { /* keep going */ }
    if (store.shieldStates) _paintShield(epNum, store.shieldStates[Math.min(idx + 1, total)]);
  }
  if (scroller) scroller.scrollTop = top;
}

function _scrollTo(epNum, i) {
  const el = document.getElementById('mb-step-' + epNum + '-' + i);
  if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function bespokeRevealNext(total, epNum) {
  const st = _state(epNum, total);
  if (st.idx >= total - 1) return;
  st.idx++;
  _reapply(epNum, st.idx, total, 'next');
  _scrollTo(epNum, st.idx);
}
export function bespokeRevealAll(total, epNum) {
  const st = _state(epNum, total);
  st.idx = total - 1;
  _reapply(epNum, st.idx, total, 'all');
}

// paint the sidebar once on first mount too (renderVPScreen inserts static HTML)
if (typeof window !== 'undefined') {
  window.__trBespokeMount = function (epNum) {
    const store = window.__trBespoke && window.__trBespoke[epNum];
    const st = _bespokeState['be-' + epNum];
    if (store && st) {
      try { THEME[store.missionId].paintSide(store.prefix, store.states, st.idx + 1, 'mount'); } catch { /* */ }
      if (store.shieldStates) _paintShield(epNum, store.shieldStates[st.idx + 1]);
    }
  };
}

// ══════════════════════════════════════════════════════════════════════
// SHARED CSS FRAGMENTS
// ══════════════════════════════════════════════════════════════════════
//
// Everything below is per-theme, lifted from the approved mockups and adapted
// for the VP frame: the standalone page's fixed viewport atmosphere becomes an
// absolute layer inside a `max-width:1100px` shell (the pattern every other
// traitors screen uses), the page's own 46px nav stub is dropped because the VP
// already draws one, and the sticky sidebar / fixed controls clear it via
// TR_NAV_TOP. The card `.on` reveal class, the reduced-motion fallback, the
// briefing beats, the phase cards and the summary are structurally identical to
// the mockup.

const NAV = TR_NAV_TOP;

/** Bits every theme shares: the root scope, roster, observer strip, card faces. */
const COMMON_CSS = `
.mb-said{display:flex;gap:8px;align-items:baseline;margin:7px 0 0;font-size:.95em;line-height:1.4}
.mb-said cite{flex:none;font-style:normal;font-weight:700;font-size:.72em;letter-spacing:.14em;text-transform:uppercase;opacity:.75}
.mb-said-txt{font-style:italic}
.mb-scope{ -webkit-font-smoothing:antialiased; }
.mb-scope *{box-sizing:border-box}
.mb-scope [id^="mb-step-"][data-on="1"]{opacity:1 !important;transform:none !important;filter:none !important}
.mb-observer{max-width:1100px;margin:0 auto;padding:10px 18px;font-size:11px;
  letter-spacing:.14em;text-transform:uppercase;opacity:.62}
.mb-observer span{opacity:.8;font-weight:700;margin-right:8px}
.mb-roster{display:flex;gap:18px;flex-wrap:wrap;margin-top:18px}
.mb-rteam{flex:1 1 220px;min-width:200px}
.mb-rname{font-size:12px;letter-spacing:.2em;text-transform:uppercase;opacity:.72;margin-bottom:7px}
.mb-rfaces{display:flex;flex-wrap:wrap;gap:5px}
.mb-rf .cv-av{width:30px;height:30px}
.mb-wholine{display:flex;align-items:center;gap:9px;padding-right:96px;flex-wrap:wrap}
.mb-avs{display:inline-flex;align-items:center}
.mb-avs .cv-av{width:26px;height:26px;margin-left:-6px}
.mb-avs .cv-av:first-child{margin-left:0}
.mb-nm{}
.mb-hosthead{display:flex;align-items:center;gap:13px;margin-bottom:6px}
.mb-hosthead h2{margin:0 !important}
.mb-hostav .cv-av{width:46px;height:46px}
.mb-hostname{font-size:11px;letter-spacing:.18em;text-transform:uppercase;opacity:.7;margin-top:3px}
/* Dropped-effect notes (record / reputation): apply.js never writes these, so
   they must NOT read as one of the bordered, uppercase, numeric chips beside
   them. Stripped of border, caps and letter-spacing, set in italic lower-case
   prose — an authored aside, unmistakably not an applied consequence. */
.mb-shield{margin-top:12px;padding:12px 14px;border:1px dashed rgba(233,198,91,.35);background:rgba(0,0,0,.35);
  text-align:center;transition:all .5s;font-family:inherit}
.mb-shield-l{font-size:10.5px;letter-spacing:.26em;text-transform:uppercase;opacity:.7}
.mb-shield-v{margin-top:5px;font-size:15px;opacity:.75}
.mb-shield-c{margin-top:5px;font-size:11.5px;letter-spacing:.05em;opacity:.6}
.mb-shield-h{display:flex;justify-content:center;margin-top:8px}
.mb-shield-h[hidden]{display:none}
.mb-shield-h .cv-av{width:44px;height:44px;box-shadow:0 0 14px rgba(233,198,91,.5)}
.mb-shield.on{border:1px solid #e9c65b;box-shadow:0 0 20px rgba(233,198,91,.18)}
.mb-shield.on .mb-shield-l,.mb-shield.on .mb-shield-v{color:#e9c65b;opacity:1}
.mb-relic{outline:1px solid rgba(233,198,91,.75);box-shadow:0 0 22px rgba(233,198,91,.16) !important}
.mb-fx-note{border:none !important;text-transform:none !important;letter-spacing:normal !important;
  font-style:italic;opacity:.6;padding:2px 0 !important}
`;

// The four theme definitions live in ./mission-bespoke-themes.js content,
// inlined here to keep the whole afternoon in one module.
import { THEMES } from './mission-bespoke-themes.js';
for (const t of THEMES) {
  t.css = COMMON_CSS + t.css;
  THEME[t.id] = t;
}
