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
import { HOSTS_BY_FORMAT } from '../quick-setup.js';
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

const GOOD = new Set(['strong', 'cross', 'right', 'sharp', 'true', 'on', 'good', 'win']);
const BAD = new Set(['weak', 'freeze', 'wrong', 'lost', 'out', 'bad', 'lose', 'stop', 'dull']);

function _toneOf(kind) { return GOOD.has(kind) ? 'good' : BAD.has(kind) ? 'bad' : 'steady'; }

function _view(ep) {
  const m = ep && ep.tr && ep.tr.mission;
  if (!m || !Array.isArray(m.phases) || m.phases.length < 3) return null;
  const cer = m.ceremony || {};
  const epNum = m.ep != null ? m.ep : (ep.num || 0);

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
    const sceneCards = (scenesByPhase[p.id] || []).map(s => ({
      phaseId: p.id, kind: s.behaviour || 'steady', tone: _behaviourTone(s.behaviour),
      who: [...(s.participants || [])],
      team: _teamOf(m, (s.participants || [])[0]),
      text: s.text, isSocial: true, behaviour: s.behaviour || null,
      conf: s.confessional ? { speaker: s.confessional.speaker, text: s.confessional.text } : null,
      fx: _fxLabels(s.effects || []),
      relic: (s.effects || []).some(e => e.kind === 'record' && e.field === 'leftTheRelay')
        || (s.effects || []).some(e => e.kind === 'shield'),
    }));
    return {
      id: p.id, name: p.name, setting: p.setting || '', stats: p.stats || [],
      teams: p.teams || [], cards: [...beatCards, ...sceneCards],
    };
  });

  return {
    epNum, id: m.id, name: m.name || 'The Mission',
    staging: cer.staging || '', hostBeats: cer.hostBeats || [], rulePoints: cer.rulePoints || [],
    phases,
    teams: (m.teams || []).map(t => ({ name: t.name, members: [...(t.members || [])], perf: t.perf })),
    bestTeam: m.bestTeam || null, tier: m.tier || 'solid', summary: m.summary || '',
    tally: m.tally || {}, shield: m.shield || null,
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
    const shield = (th.id === 'ash-vault' && b.kind === 'say'
      && /\bShield\b|kitchen flue|body short/.test(raw)) ? ' shield' : '';
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
  const label = names.join(' &amp; ') + (card.team ? ' &middot; ' + _esc(card.team) : '');
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
  return '<article class="' + p + '-card ' + th.cardClass(c) + '" id="' + id + '">'
    + th.icon(c, c._ph) + '<span class="' + p + '-tag">' + _esc(th.cardTag(c, c._ph)) + '</span>'
    + '<div class="' + p + '-who mb-wholine">' + _who(c) + '</div>'
    + '<div class="' + p + '-txt">' + _esc(c.text) + '</div>'
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

/** True when this record is a bespoke afternoon this file can draw. */
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
    window.__trBespoke[v.epNum] = { prefix: p, missionId: v.id, total, states };
    if (window.__trMission) delete window.__trMission[v.epNum]; // this ep is bespoke, not archetype
  }

  const call = fn => fn + "('mission'," + total + ',' + v.epNum + ')';
  const observerLine = observer === 'audience'
    ? 'the whole afternoon, told the way the country saw it'
    : 'the work, the teams and the money are public';

  const body = '<div class="' + p + '-body">'
    + '<header class="' + p + '-hero">'
    + '<div class="' + p + '-kicker">Mission &middot; Day ' + v.epNum + '</div>'
    + th.title(v)
    + '<p class="' + p + '-sub">' + _esc(th.sub(v)) + '</p>'
    + '<div class="' + p + '-meta">' + th.chips(v).map(c =>
      '<span class="' + p + '-chip' + (c.shield ? ' shield' : '') + '">' + _esc(c.text) + '</span>').join('') + '</div>'
    + _heroRoster(v, th)
    + '</header>'
    + '<div class="mb-observer"><span>Observer</span> ' + _esc(observer) + ' &mdash; ' + observerLine + '</div>'
    + '<div class="' + p + '-grid">'
    + '<main>'
    + _briefing(v, th)
    + phaseHtml.join('')
    + '<div class="' + p + '-summary" id="mb-summary-' + v.epNum + '"'
    + (st.idx >= total - 1 ? '' : ' style="opacity:.3"') + '>'
    + '<small>The afternoon &middot; ' + _esc(v.tier) + '</small>' + _esc(v.summary) + '</div>'
    + '</main>'
    + '<aside class="' + p + '-side">' + th.sidebar(v, st.idx + 1, states) + '</aside>'
    + '</div></div>';

  const controls = '<div class="' + p + '-controls">'
    + '<button class="' + p + '-btn" id="mb-next-' + v.epNum + '"'
    + (st.idx >= total - 1 ? ' disabled' : '') + ' onclick="' + call('trMissionRevealNext') + '">'
    + th.nextLabel + '</button>'
    + '<span class="' + p + '-counter" id="mb-counter-' + v.epNum + '">'
    + (st.idx + 1) + ' of ' + total + ' ' + th.revealedWord + '</span>'
    + '<button class="' + p + '-btn ghost" onclick="' + call('trMissionRevealAll') + '">' + th.allLabel + '</button>'
    + '</div>';

  const first = '<style>' + th.css + PORTRAIT_CSS + '</style>'
    + '<div class="' + p + '-root ' + p + '-scope" style="' + th.rootVars + '">'
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

function _reapply(epNum, idx, total, prefix) {
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
    try { THEME[store.missionId].paintSide(store.prefix, store.states, idx + 1); } catch { /* keep going */ }
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
  _reapply(epNum, st.idx, total);
  _scrollTo(epNum, st.idx);
}
export function bespokeRevealAll(total, epNum) {
  const st = _state(epNum, total);
  st.idx = total - 1;
  _reapply(epNum, st.idx, total);
}

// paint the sidebar once on first mount too (renderVPScreen inserts static HTML)
if (typeof window !== 'undefined') {
  window.__trBespokeMount = function (epNum) {
    const store = window.__trBespoke && window.__trBespoke[epNum];
    const st = _bespokeState['be-' + epNum];
    if (store && st) { try { THEME[store.missionId].paintSide(store.prefix, store.states, st.idx + 1); } catch { /* */ } }
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
.mb-scope{ -webkit-font-smoothing:antialiased; }
.mb-scope *{box-sizing:border-box}
.mb-scope [id^="mb-step-"][data-on="1"]{opacity:1 !important;transform:none !important}
.mb-observer{max-width:1100px;margin:0 auto;padding:10px 18px;font-size:11px;
  letter-spacing:.14em;text-transform:uppercase;opacity:.62}
.mb-observer span{opacity:.8;font-weight:700;margin-right:8px}
.mb-roster{display:flex;gap:18px;flex-wrap:wrap;margin-top:18px}
.mb-rteam{flex:1 1 220px;min-width:200px}
.mb-rname{font-size:12px;letter-spacing:.2em;text-transform:uppercase;opacity:.72;margin-bottom:7px}
.mb-rfaces{display:flex;flex-wrap:wrap;gap:5px}
.mb-rf .cv-av{width:30px;height:30px}
.mb-wholine{display:flex;align-items:center;gap:9px}
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
