// The two reading tabs on life.html: History and Couples.
//
// The inbox is for deciding. These are for looking things up afterwards — what
// has happened to everybody, what has happened to one person, and who is with
// whom — so they read only what is CANON: the approved rows of the log as last
// saved, never a tick that has not been committed. A box ticked in the inbox is
// an intention, and a history page that showed it would be showing a guess.
//
// Nothing here writes. Relationship positions come from `stateOf`, the same
// replay a wiki page uses, so this tab cannot disagree with a character's page
// about who they are married to.

import { TRACKS, kindOf, significanceOf, lineFor, order, stateOf, involves } from './life-events.js';
import { airLabel } from './franchise-calendar.js';

const esc = t => String(t ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const SIGS = ['major', 'notable', 'minor'];

/** The relationship positions, closest first — the order the Couples tab lists them in. */
const STAGES = [
  ['married', 'Married', '💍'],
  ['engaged', 'Engaged', '💎'],
  ['living-together', 'Living together', '🏠'],
  ['public', 'Together, public', '📸'],
  ['dating', 'Dating', '💕'],
  ['separated', 'Separated', '💔'],
];
const STAGE_LABEL = Object.fromEntries(STAGES.map(([k, l]) => [k, l]));
const ENDINGS = { 'broke-up': 'Broke up', 'quietly-ended': 'Drifted apart', divorced: 'Divorced' };
const REL_KINDS = new Set(['dating', 'went-public', 'moved-in', 'engaged', 'wedding', 'separated']);

let D = null;            // { events, names, genders, seasons, rank, face }
const hist = { who: '', sigs: new Set(['major']), track: 'all', season: 'all', newest: true };
const cpl = { who: '', stages: new Set(STAGES.map(s => s[0]).concat('ended')) };

const canon = () => D.events.filter(e => e && e.status === 'approved');
const nameOf = slug => D.names[slug] || slug || '?';
const seasonOf = id => D.seasons.find(s => s.seasonId === id) || null;
/** "TD 14" — a card has no room for "Total Drama Coaches VS New Blood: The Season of…". */
const shortSeason = id => String(id || '').replace('-', ' ').toUpperCase();
const seasonLabel = id => { const s = seasonOf(id); return s ? (s.title || id) : (id || 'Unplaced'); };
/** Keep the address in step with the person on screen, so it can be shared or reloaded. */
const syncHash = (tab, who) => { try { history.replaceState(null, '', `#${tab}${who ? '/' + encodeURIComponent(who) : ''}`); } catch {} };
const playerHref = slug => `player.html?player=${encodeURIComponent(slug)}`;

/** A typed name back to a slug: exact name, exact slug, then the one name that starts with it. */
function slugFor(text) {
  const q = String(text || '').trim().toLowerCase();
  if (!q) return '';
  const all = Object.entries(D.names);
  const hit = all.find(([s, n]) => String(n).toLowerCase() === q) || all.find(([s]) => s === q);
  if (hit) return hit[0];
  const starts = all.filter(([, n]) => String(n).toLowerCase().startsWith(q));
  return starts.length === 1 ? starts[0][0] : '';
}

/** Everybody the log or the roster knows, for the name pickers. */
function datalist(id) {
  const slugs = new Set(Object.keys(D.names));
  for (const e of canon()) { if (e.player) slugs.add(e.player); if (e.whom) slugs.add(e.whom); }
  return `<datalist id="${id}">${[...slugs].map(nameOf).sort((a, b) => a.localeCompare(b))
    .map(n => `<option value="${esc(n)}">`).join('')}</datalist>`;
}

/** "Married to Lindsay", "Single", "2 children" — where somebody stands now. */
function standing(slug) {
  const st = stateOf(slug, canon(), { seasonRank: D.rank });
  const bits = [];
  const r = st.relationship;
  if (r.stage && r.stage !== 'single' && r.with) {
    const label = { married: 'Married to', engaged: 'Engaged to', 'living-together': 'Living with',
      public: 'Together with', dating: 'Dating', separated: 'Separated from' }[r.stage] || 'With';
    bits.push(`${label} <a href="#history" data-who="${esc(r.with)}">${esc(nameOf(r.with))}</a>`);
  } else bits.push('Single');
  if (st.children) bits.push(`${st.children} child${st.children === 1 ? '' : 'ren'}`);
  if (st.terminal === 'death') bits.push('<strong>Deceased</strong>');
  if (st.terminal === 'left-franchise') bits.push('<strong>Left the franchise</strong>');
  return bits.join(' · ');
}

// ── HISTORY ──────────────────────────────────────────────────────────

function histRows() {
  const who = hist.who;
  return canon()
    .filter(e => (!who || involves(e, who))
      && hist.sigs.has(significanceOf(e.kind))
      && (hist.track === 'all' || kindOf(e.kind)?.track === hist.track)
      && (hist.season === 'all' || e.afterSeason === hist.season))
    .sort(order(D.rank));
}

function histEvent(e) {
  const sig = significanceOf(e.kind);
  const def = kindOf(e.kind);
  const line = e.headline || lineFor(e, D.names, hist.who || e.player, D.genders);
  const people = [e.player, e.whom].filter(Boolean)
    .map(s => `<a href="#history" data-who="${esc(s)}">${esc(nameOf(s))}</a>`).join(' + ');
  return `<div class="lb-ev">
    <div class="who">${D.face(e.player)}${e.whom ? D.face(e.whom) : ''}</div>
    <span class="sig ${sig}">${sig}</span>
    <div>
      <div class="ev-line">${esc(line)}${e.detail ? `<span class="detail">${esc(e.detail)}</span>` : ''}</div>
      <div class="ev-meta">${people} · ${esc(def ? TRACKS[def.track] || def.track : 'unknown')}</div>
    </div>
  </div>`;
}

function renderHistory(root) {
  syncHash('history', hist.who);
  const rows = histRows();
  const gaps = new Map();
  for (const e of rows) {
    const k = e.afterSeason || '(unplaced)';
    if (!gaps.has(k)) gaps.set(k, []);
    gaps.get(k).push(e);
  }
  const blocks = [...gaps.entries()];
  if (hist.newest) blocks.reverse();
  const inScope = canon().filter(e => !hist.who || involves(e, hist.who));
  const chip = sg => `<button class="sig-chip ${sg}" data-hsig="${sg}" aria-pressed="${hist.sigs.has(sg)}">${sg} ${
    inScope.filter(e => significanceOf(e.kind) === sg).length}</button>`;
  const usedTracks = [...new Set(canon().map(e => kindOf(e.kind)?.track).filter(Boolean))];
  const seasonsUsed = [...new Set(canon().map(e => e.afterSeason).filter(Boolean))]
    .sort((a, b) => (D.rank.get(b) ?? 0) - (D.rank.get(a) ?? 0));

  const person = hist.who ? `<div class="lb-person">
      <img class="lb-big" src="assets/avatars/${encodeURIComponent(hist.who)}.png" alt="" onerror="this.style.visibility='hidden'">
      <div>
        <div class="lb-pname">${esc(nameOf(hist.who))}</div>
        <div class="lb-pstate">${standing(hist.who)}</div>
        <div class="lb-plinks"><a href="${playerHref(hist.who)}">Player page →</a>
          <a href="#couples" data-cwho="${esc(hist.who)}">Their relationships →</a></div>
      </div>
      <button class="mini" data-clear-who>Show everybody</button>
    </div>` : '';

  root.innerHTML = `
    <p class="lb-intro">Everything that has been approved and saved, by off-season. Search a name to see one person's whole life between seasons.</p>
    <div class="bar lb-tools">
      <input type="search" id="lb-who" list="lb-names" placeholder="Search a person…" value="${esc(hist.who ? nameOf(hist.who) : '')}" autocomplete="off">
      ${datalist('lb-names')}
      <select id="lb-track"><option value="all">Every kind of event</option>${usedTracks.map(t =>
        `<option value="${t}"${hist.track === t ? ' selected' : ''}>${esc(TRACKS[t] || t)}</option>`).join('')}</select>
      <select id="lb-season"><option value="all">Every off-season</option>${seasonsUsed.map(id =>
        `<option value="${esc(id)}"${hist.season === id ? ' selected' : ''}>After ${esc(seasonLabel(id))}</option>`).join('')}</select>
      <button class="mini" id="lb-order">${hist.newest ? 'Newest first' : 'Oldest first'}</button>
    </div>
    <div class="bar views sigs lb-sigs">${SIGS.map(chip).join('')}<span class="count">${rows.length} event${rows.length === 1 ? '' : 's'}</span></div>
    ${person}
    ${blocks.length ? blocks.map(([sid, list]) => {
      const s = seasonOf(sid);
      return `<section class="gap"><div class="gap-head"><span>After ${esc(seasonLabel(sid))}</span>
        <span class="when">${esc(s ? airLabel(s) : '')}</span></div>${list.map(histEvent).join('')}</section>`;
    }).join('') : `<div class="empty">${hist.who
      ? `Nothing approved for ${esc(nameOf(hist.who))} at ${esc([...hist.sigs].join(' or '))}.<br>Turn another weight on above.`
      : 'Nothing approved matches these filters yet.'}</div>`}`;

  const who = root.querySelector('#lb-who');
  const pick = () => {
    const slug = slugFor(who.value);
    if (!who.value.trim()) { hist.who = ''; renderHistory(root); return; }
    if (!slug || slug === hist.who) return;
    hist.who = slug;
    // One person's page wants their whole life, not only the headlines.
    hist.sigs = new Set(SIGS);
    renderHistory(root);
    root.querySelector('#lb-who')?.focus();
  };
  who.addEventListener('change', pick);
  who.addEventListener('keydown', ev => { if (ev.key === 'Enter') pick(); });
  who.addEventListener('search', () => { if (!who.value) { hist.who = ''; renderHistory(root); } });
  root.querySelector('#lb-track').onchange = ev => { hist.track = ev.target.value; renderHistory(root); };
  root.querySelector('#lb-season').onchange = ev => { hist.season = ev.target.value; renderHistory(root); };
  root.querySelector('#lb-order').onclick = () => { hist.newest = !hist.newest; renderHistory(root); };
  root.querySelector('[data-clear-who]')?.addEventListener('click', () => {
    hist.who = ''; hist.sigs = new Set(['major']); renderHistory(root);
  });
  root.querySelectorAll('[data-hsig]').forEach(el => {
    el.onclick = () => {
      const sg = el.dataset.hsig;
      if (hist.sigs.has(sg)) hist.sigs.delete(sg); else hist.sigs.add(sg);
      if (!hist.sigs.size) hist.sigs = new Set([sg]);
      renderHistory(root);
    };
  });
}

// ── COUPLES ──────────────────────────────────────────────────────────

/**
 * Every pair that is together now, plus every pair that was and ended.
 *
 * Read per person through stateOf and folded into pairs, so a couple appears
 * once however many of its two members the log mentions. Where the two sides
 * disagree the closer stage wins — an inconsistency the inbox's audit is for,
 * not something to show as two couples.
 */
function couples() {
  const ev = canon();
  const slugs = new Set(Object.keys(D.names));
  for (const e of ev) { if (e.player) slugs.add(e.player); if (e.whom) slugs.add(e.whom); }
  const rankOf = st => STAGES.findIndex(s => s[0] === st);
  const now = new Map();
  for (const slug of slugs) {
    const r = stateOf(slug, ev, { seasonRank: D.rank }).relationship;
    if (!r.with || r.stage === 'single' || rankOf(r.stage) < 0) continue;
    const key = [slug, r.with].sort().join('|');
    const had = now.get(key);
    if (!had || rankOf(r.stage) < rankOf(had.stage)) now.set(key, { a: slug, b: r.with, stage: r.stage });
  }
  const pairEvents = (a, b) => ev.filter(e => e.whom && [e.player, e.whom].sort().join('|') === [a, b].sort().join('|'))
    .sort(order(D.rank));
  for (const c of now.values()) {
    const mine = pairEvents(c.a, c.b);
    const first = mine.find(e => REL_KINDS.has(e.kind));
    const at = mine.filter(e => kindOf(e.kind)?.stage === c.stage).pop();
    c.since = at?.afterSeason || null;
    c.began = first?.afterSeason || null;
    c.authored = !mine.length;
    c.steps = mine.filter(e => kindOf(e.kind)?.track === 'relationship');
  }
  // ENDED: a pair whose last relationship row is an ending and who are not
  // back together now.
  const ended = new Map();
  for (const e of ev) {
    if (!ENDINGS[e.kind] || !e.whom) continue;
    const key = [e.player, e.whom].sort().join('|');
    if (now.has(key)) continue;
    const last = pairEvents(e.player, e.whom).filter(x => kindOf(x.kind)?.track === 'relationship').pop();
    if (last && ENDINGS[last.kind]) {
      const mine = pairEvents(e.player, e.whom);
      ended.set(key, { a: e.player, b: e.whom, stage: 'ended', how: ENDINGS[last.kind], since: last.afterSeason,
        began: mine.find(x => REL_KINDS.has(x.kind))?.afterSeason || null,
        steps: mine.filter(x => kindOf(x.kind)?.track === 'relationship') });
    }
  }
  return { now: [...now.values()], ended: [...ended.values()] };
}

function coupleCard(c) {
  const label = c.stage === 'ended' ? c.how : STAGE_LABEL[c.stage];
  const when = c.authored ? 'Set on the character — before the franchise'
    : [c.began ? `Together since after ${esc(shortSeason(c.began))}` : '',
      c.stage === 'ended' && c.since ? `ended after ${esc(shortSeason(c.since))}`
        : c.since && c.since !== c.began ? `${esc(label.toLowerCase())} after ${esc(shortSeason(c.since))}` : '']
      .filter(Boolean).join(' · ');
  const steps = (c.steps || []).map(e => `<li>${esc(lineFor(e, D.names, c.a, D.genders))} <span>after ${esc(shortSeason(e.afterSeason))}</span></li>`).join('');
  return `<div class="lb-couple${c.stage === 'ended' ? ' ended' : ''}">
    <div class="lb-faces">${D.face(c.a)}${D.face(c.b)}</div>
    <div class="lb-cbody">
      <div class="lb-cnames"><a href="#history" data-who="${esc(c.a)}">${esc(nameOf(c.a))}</a>
        <span>&amp;</span> <a href="#history" data-who="${esc(c.b)}">${esc(nameOf(c.b))}</a></div>
      <div class="ev-meta">${when}</div>
      ${steps ? `<details><summary>How they got here</summary><ul>${steps}</ul></details>` : ''}
    </div>
  </div>`;
}

function renderCouples(root) {
  syncHash('couples', cpl.who);
  const { now, ended } = couples();
  const who = cpl.who;
  const hasWho = c => !who || c.a === who || c.b === who;
  const groups = STAGES.map(([k, l, icon]) => [k, l, icon, now.filter(c => c.stage === k && hasWho(c))])
    .concat([['ended', 'Past couples', '🥀', ended.filter(hasWho)]]);
  const total = groups.reduce((n, g) => n + (cpl.stages.has(g[0]) ? g[3].length : 0), 0);
  const solo = who ? stateOf(who, canon(), { seasonRank: D.rank }).relationship : null;

  root.innerHTML = `
    <p class="lb-intro">Who is with whom right now, from every approved event and every couple set on a character. Search a name to see everybody they have been with.</p>
    <div class="bar lb-tools">
      <input type="search" id="lc-who" list="lc-names" placeholder="Search a person…" value="${esc(who ? nameOf(who) : '')}" autocomplete="off">
      ${datalist('lc-names')}
      <span class="count">${total} couple${total === 1 ? '' : 's'}</span>
    </div>
    <div class="bar views lb-stages">${groups.map(([k, l, icon, list]) =>
      `<button data-stage="${k}" aria-pressed="${cpl.stages.has(k)}">${icon} ${esc(l)} ${list.length}</button>`).join('')}</div>
    ${who && solo && (solo.stage === 'single' || !solo.with) && !groups.some(g => g[3].length && g[0] !== 'ended')
      ? `<p class="lb-note">${esc(nameOf(who))} is single right now.</p>` : ''}
    ${groups.filter(([k, , , list]) => cpl.stages.has(k) && list.length).map(([k, l, icon, list]) => `
      <section class="lb-group"><h3>${icon} ${esc(l)} <span>${list.length}</span></h3>
        <div class="lb-grid">${list.sort((x, y) => nameOf(x.a).localeCompare(nameOf(y.a))).map(coupleCard).join('')}</div>
      </section>`).join('') || `<div class="empty">${who ? `No couples with ${esc(nameOf(who))} in the lists shown.` : 'No couples in the lists shown.'}</div>`}`;

  const input = root.querySelector('#lc-who');
  const pick = () => {
    if (!input.value.trim()) { cpl.who = ''; renderCouples(root); return; }
    const slug = slugFor(input.value);
    if (!slug || slug === cpl.who) return;
    cpl.who = slug;
    renderCouples(root);
    root.querySelector('#lc-who')?.focus();
  };
  input.addEventListener('change', pick);
  input.addEventListener('keydown', ev => { if (ev.key === 'Enter') pick(); });
  input.addEventListener('search', () => { if (!input.value) { cpl.who = ''; renderCouples(root); } });
  root.querySelectorAll('[data-stage]').forEach(el => {
    el.onclick = () => {
      const k = el.dataset.stage;
      if (cpl.stages.has(k)) cpl.stages.delete(k); else cpl.stages.add(k);
      if (!cpl.stages.size) cpl.stages = new Set([k]);
      renderCouples(root);
    };
  });
}

// ── MOUNTING ─────────────────────────────────────────────────────────

/** Give the tabs the data. Called once on load and again after every commit. */
export function setBrowseData(data) { D = data; }

/** Draw a tab. `who` jumps straight to one person. */
export function showHistory(root, who = null) { if (who != null) hist.who = who; if (who) hist.sigs = new Set(SIGS); renderHistory(root); }
export function showCouples(root, who = null) { if (who != null) cpl.who = who; renderCouples(root); }
