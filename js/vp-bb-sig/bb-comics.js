/**
 * BB Comics — "The Comic Rack" Viewer's Pass screen.
 *
 * The competition is a wall of parody comic covers, one per houseguest, and a
 * zipline. So the screen is a comic shop: newsprint, Ben-Day dots, thick ink
 * outlines, and every houseguest's run drawn as the issue they starred in.
 * Each mistake is a MISPRINT sticker slapped on the cover and a note about the
 * zip back to the platform. A rack strip along the top fills with mini-covers
 * as runs reveal, sorted by time — but only among the runs the viewer has
 * actually seen, because a leaderboard that knows the future is a spoiler.
 *
 * Imports nothing. Everything it needs arrives in `u`:
 *   { tvState, reveal, avatar, esc, cat, ordinal }
 * The only interactivity is the shared inline-onclick reveal handler.
 */

// ── deterministic pickers ─────────────────────────────────────────────
//
// No Math.random anywhere in here. The same episode must draw the same
// covers every time the viewer walks back through it.

const _hash = str => {
  let h = 2166136261;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h | 0);
};
const _pick = (arr, seed) => arr[seed % arr.length];

// Fallback hero titles, only used if the competition did not hand one down.
const TITLE_PATTERNS = [
  n => `The Astonishing ${n}`,
  n => `The Uncanny ${n}`,
  n => `${n}: Sole Survivor`,
  n => `Tales of ${n}`,
  n => `The Immortal ${n}`,
  n => `${n} of the House`,
];

// The story arc printed under the logo — pure cover furniture, but it is the
// difference between a card and a comic.
const ARC_TITLES = [
  'THE ZIPLINE GAMBIT',
  'DEADLINE: THIRTY SECONDS',
  'CRISIS ON WALL THREE',
  'THE MEMORY WAR',
  'NOTHING BUT THE ORDER',
  'THE LONG WIRE HOME',
  'ONE PASS TO GET IT RIGHT',
  'RETURN OF THE RE-ZIP',
];

// Cover blurbs, split by how the run actually went. A clean run and a
// four-re-zip meltdown do not get to share a tagline.
const BLURB_CLEAN = [
  n => `"NOT ONE COVER OUT OF PLACE!"`,
  n => `"${String(n).toUpperCase()} NEVER LOOKS DOWN!"`,
  n => `"THE WALL NEVER STOOD A CHANCE!"`,
  n => `"PERFECT RECALL — AND THE BUZZER TO PROVE IT!"`,
  n => `"ONE PASS. ONE ORDER. NO SECOND TRIP!"`,
];
const BLURB_SLIP = [
  n => `"ONE COVER WRONG — AND THE WHOLE WIRE AGAIN!"`,
  n => `"CAN ${String(n).toUpperCase()} SURVIVE THE RE-ZIP?"`,
  n => `"THE ORDER BREAKS AT THE WORST POSSIBLE SLOT!"`,
  n => `"SO CLOSE — AND THEN THAT ONE COVER!"`,
  n => `"A SECOND TRIP NOBODY WANTED TO MAKE!"`,
];
const BLURB_MELT = [
  n => `"THE WALL WINS! ${String(n).toUpperCase()} FALLS APART!"`,
  n => `"HOW MANY TRIPS IS TOO MANY TRIPS?"`,
  n => `"THE CLOCK KEEPS GOING. SO DOES THE HARNESS."`,
  n => `"DISASTER ISSUE — COLLECT IT IF YOU DARE!"`,
  n => `"EVERY SLOT WRONG, EVERY TIME COSTLY!"`,
];

// The little corner flash on a cover — the bit that shouts a number at you.
const FLASHES = [
  d => `SPECIAL ${d.covers}-COVER ISSUE!`,
  d => `ALL-NEW! ALL-TIMED!`,
  d => `${d.time}s OF PURE ACTION!`,
  d => `COLLECTOR'S ITEM!`,
  d => `FIRST APPEARANCE!`,
];

// The narration box header, comic-caption style.
const CAPTIONS = [
  'MEANWHILE, ON THE PLATFORM...',
  'AND SO IT BEGINS...',
  'HIGH ABOVE THE YARD...',
  'THE HORN SOUNDS...',
  'ONE HOUSEGUEST. ONE WALL.',
  'BACK AT THE WIRE...',
];

// ── inline SVG furniture ──────────────────────────────────────────────

/** A 14-point comic burst, generated once. Deterministic trigonometry. */
const _STAR = (() => {
  const pts = [];
  const cx = 100, cy = 60, n = 14;
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const rx = (i % 2 ? 62 : 96), ry = (i % 2 ? 34 : 56);
    pts.push(`${(cx + Math.cos(a) * rx).toFixed(1)},${(cy + Math.sin(a) * ry).toFixed(1)}`);
  }
  return pts.join(' ');
})();

/** Onomatopoeia as a shape, never as an emoji. */
const _burst = (word, fill, w = 132, tilt = -8) => `<svg class="sgx-burst" viewBox="0 0 200 120" width="${w}" height="${Math.round(w * 0.6)}" aria-hidden="true">
  <polygon points="${_STAR}" fill="${fill}" stroke="#141018" stroke-width="6" stroke-linejoin="round"/>
  <polygon points="${_STAR}" fill="none" stroke="#141018" stroke-width="1.5" stroke-linejoin="round" opacity="0.5" transform="scale(0.86) translate(16 9)"/>
  <text x="100" y="76" text-anchor="middle" transform="rotate(${tilt} 100 62)"
        font-family="Impact,'Arial Black',sans-serif" font-size="40" letter-spacing="1"
        fill="#141018">${word}</text>
</svg>`;

/** The zipline itself: a wire, a pulley and a dangling harness. */
const _ZIPLINE = `<svg class="sgx-zip" viewBox="0 0 220 60" width="150" height="41" aria-hidden="true">
  <line x1="4" y1="14" x2="216" y2="30" stroke="#141018" stroke-width="4" stroke-linecap="round"/>
  <circle cx="86" cy="20" r="11" fill="#ffcc00" stroke="#141018" stroke-width="4"/>
  <circle cx="86" cy="20" r="3" fill="#141018"/>
  <path d="M86 31 L78 46 M86 31 L94 46" stroke="#141018" stroke-width="4" stroke-linecap="round"/>
  <rect x="74" y="45" width="24" height="9" rx="3" fill="#00a8e8" stroke="#141018" stroke-width="4"/>
</svg>`;

/** A blank cover, for the wall before anybody has run it. */
const _BLANKCOVER = `<svg viewBox="0 0 40 56" width="26" height="36" aria-hidden="true">
  <rect x="2" y="2" width="36" height="52" rx="2" fill="#e3d5b6" stroke="#141018" stroke-width="3"/>
  <rect x="7" y="8" width="26" height="5" fill="#141018" opacity="0.35"/>
  <rect x="7" y="18" width="26" height="22" fill="#141018" opacity="0.14"/>
  <rect x="7" y="44" width="18" height="4" fill="#141018" opacity="0.3"/>
</svg>`;

// ── the screen ────────────────────────────────────────────────────────

export function rpBuildSigBBComics(ep, actType, u) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';
  if (comp.variant && comp.variant !== 'bb-comics') return '';

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const esc = u?.esc || (s => String(s == null ? '' : s));
  const avatar = u?.avatar || (() => '');
  const ordinal = u?.ordinal || (n => String(n));
  const tvState = u?.tvState || {};
  const revealFn = u?.reveal || (() => '');
  const catRaw = typeof u?.cat === 'function' ? u.cat(comp.category) : u?.cat;
  const cat = catRaw && catRaw.label ? catRaw
    : { label: String(comp.category || 'MENTAL').toUpperCase(), accent: '#e5195f' };

  const isHoh = actType === 'hoh';
  const stateKey = `bb_sig_comics_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];

  // Normalised results file per-player numbers under debug.scoreBreakdown; a
  // raw engine result carries them at the top level. Read both or every time
  // and re-zip count on this screen renders empty.
  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const winner = act.winner || (act.results || [])[0]?.name || '';
  const seedBase = _hash(`${ep.num}|${actType}`);

  // ── steps come from the beats, in the order the competition narrated them ──
  const steps = beats.map(b => {
    const who = (b.players || []).filter(Boolean);
    const solo = who.length === 1 ? who[0] : null;
    const badge = String(b.badgeText || '').toUpperCase();
    const bd = solo ? breakdown[solo] : null;
    let kind = 'note';
    if (badge.indexOf('WALL') >= 0) kind = 'wall';
    else if (badge === 'VETO' || badge === 'HOH') kind = 'veto';
    else if (badge.indexOf('MARGIN') >= 0) kind = 'margin';
    else if (solo && bd) kind = 'run';
    return { beat: b, kind, name: solo, who, bd, badge };
  });

  const total = steps.length;
  const revealed = Math.max(0, state.idx + 1);
  const done = state.idx >= total - 1;

  // ── the rack: revealed runs only, fastest first ──
  const shelf = steps
    .map((s, i) => ({ s, i }))
    .filter(x => x.s.kind === 'run' && x.i <= state.idx && x.s.bd)
    .map(x => ({ name: x.s.name, bd: x.s.bd }))
    .sort((a, b) => (a.bd.time ?? 999) - (b.bd.time ?? 999));

  const runCount = steps.filter(s => s.kind === 'run').length;

  const heroOf = name => {
    const bd = breakdown[name];
    if (bd && bd.hero) return bd.hero;
    return _pick(TITLE_PATTERNS, _hash(name) + seedBase)(name);
  };
  const arcOf = name => _pick(ARC_TITLES, _hash(`${name}arc`) + ep.num);
  const flashOf = (name, bd) => _pick(FLASHES, _hash(`${name}flash`) + ep.num)({
    covers: bd?.covers ?? '?', time: bd?.time ?? '?',
  });
  const blurbOf = (name, bd) => {
    const m = bd?.mistakes ?? 0;
    const pool = m === 0 ? BLURB_CLEAN : m >= 3 ? BLURB_MELT : BLURB_SLIP;
    return _pick(pool, _hash(`${name}blurb`) + ep.num)(name);
  };
  const captionOf = (name, i) => _pick(CAPTIONS, _hash(name) + i + ep.num);
  const priceOf = name => `${25 + (_hash(`${name}price`) % 51)}¢`;

  // ── explainer: the editor's note ──
  const weights = Object.entries(comp.stats || comp.debug?.formula || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 4);
  const satOut = (comp.excluded || []).filter(Boolean);

  const editorial = `<div class="sgx-ed">
    <div class="sgx-ed-flag">
      <span class="sgx-ed-cat">${esc(cat.label)}</span>
      <b>${esc(comp.name || 'BB Comics')}</b>
      <span class="sgx-ed-issue">ISSUE #${ep.num}</span>
    </div>
    ${comp.desc ? `<p class="sgx-ed-d">${esc(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="sgx-ed-w">
      ${weights.map(([k, w]) => `<span class="sgx-stat">
        <i>${esc(k)}</i>
        <span class="sgx-stat-bar"><b style="width:${Math.round(w * 100)}%"></b></span>
        <u>${Math.round(w * 100)}%</u></span>`).join('')}
    </div>` : ''}
    <div class="sgx-ed-f">
      <span>${(act.participants || act.results || []).length} on the rack</span>
      ${satOut.length ? `<span>Sat out — not printed: ${satOut.map(esc).join(', ')}${
        actType === 'hoh' && act.outgoingHoh ? ` · ${esc(act.outgoingHoh)} cannot defend the room` : ''}</span>` : ''}
      ${runCount ? `<span>${runCount} run${runCount === 1 ? '' : 's'} to press</span>` : ''}
    </div>
  </div>`;

  // ── the rack strip ──
  const rackHtml = `<div class="sgx-rack">
    <div class="sgx-rack-h">
      <span class="sgx-rack-t">THE RACK</span>
      <span class="sgx-rack-s">${shelf.length ? `Fastest of ${shelf.length} issue${shelf.length === 1 ? '' : 's'} in stock` : 'Nothing printed yet'}</span>
    </div>
    <div class="sgx-rack-b">
      ${shelf.length ? shelf.map((r, i) => `<div class="sgx-mini ${i === 0 ? 'is-top' : ''}">
        <span class="sgx-mini-rank">${esc(ordinal(i + 1))}</span>
        <span class="sgx-mini-art">${avatar(r.name, 34)}</span>
        <span class="sgx-mini-title">${esc(heroOf(r.name))}</span>
        <span class="sgx-mini-time">${esc(String(r.bd.time))}s</span>
        <span class="sgx-mini-mis">${r.bd.mistakes ? `${r.bd.mistakes} re-zip${r.bd.mistakes > 1 ? 's' : ''}` : 'clean'}</span>
      </div>`).join('')
      : `<div class="sgx-rack-empty">${_BLANKCOVER}${_BLANKCOVER}${_BLANKCOVER}${_BLANKCOVER}<span>the shelf is bare</span></div>`}
    </div>
  </div>`;

  // ── the cards ──
  const cardFor = (s, i) => {
    if (i > state.idx) {
      return `<div class="sgx-card sgx-pending"><span>${_BLANKCOVER}</span><b>UNPRINTED</b></div>`;
    }
    if (s.kind === 'wall') {
      const shown = (s.who || []).slice(0, 3);
      return `<article class="sgx-card sgx-wallcard">
        <div class="sgx-wall-h">${_ZIPLINE}<span>THE WALL OF COVERS</span></div>
        <div class="sgx-wall-strip">
          ${(act.participants || []).map(n => `<span class="sgx-wall-cover" title="${esc(heroOf(n))}">${_BLANKCOVER}</span>`).join('')
            || shown.map(() => `<span class="sgx-wall-cover">${_BLANKCOVER}</span>`).join('')}
        </div>
        <div class="sgx-cap"><b>THIRTY SECONDS</b>${esc(s.beat.text)}</div>
        ${shown.length ? `<div class="sgx-wall-faces">${shown.map(n => `<span class="sgx-face">${avatar(n, 30)}<i>${esc(heroOf(n))}</i></span>`).join('')}</div>` : ''}
      </article>`;
    }
    if (s.kind === 'margin') {
      return `<article class="sgx-card sgx-margin">
        <div class="sgx-margin-h">NEXT ISSUE — THE MARGIN</div>
        <div class="sgx-margin-b">
          ${(s.who || []).map(n => `<span class="sgx-face">${avatar(n, 40)}<i>${esc(n)}</i></span>`).join('<span class="sgx-vs">VS</span>')}
        </div>
        <p class="sgx-margin-t">${esc(s.beat.text)}</p>
      </article>`;
    }
    if (s.kind === 'veto') {
      const bd = breakdown[s.name] || {};
      return `<article class="sgx-card sgx-collector">
        <div class="sgx-foil"></div>
        <div class="sgx-col-band">ISSUE #1 &mdash; COLLECTOR'S EDITION</div>
        ${_coverBody({
          name: s.name, bd, hero: heroOf(s.name), arc: arcOf(s.name),
          blurb: blurbOf(s.name, bd), flash: `${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}!`,
          price: priceOf(s.name), esc, avatar, epNum: ep.num, gold: true,
        })}
        <div class="sgx-cap sgx-cap-gold"><b>SOLD OUT</b>${esc(s.beat.text)}</div>
        <div class="sgx-stamp">SIGNED BY THE ARTIST</div>
      </article>`;
    }
    if (s.kind === 'run') {
      const bd = s.bd || {};
      const mis = bd.mistakes || 0;
      const tone = mis === 0 ? 'is-clean' : mis >= 3 ? 'is-melt' : 'is-slip';
      const shout = mis === 0 ? _burst('ZIP!', '#ffcc00')
        : mis >= 3 ? _burst('WHIFF!', '#d92027')
        : _burst('SNAG!', '#00a8e8');
      return `<article class="sgx-card sgx-cover ${tone}">
        ${_coverBody({
          name: s.name, bd, hero: heroOf(s.name), arc: arcOf(s.name),
          blurb: blurbOf(s.name, bd), flash: flashOf(s.name, bd),
          price: priceOf(s.name), esc, avatar, epNum: ep.num, gold: false,
        })}
        <div class="sgx-shout">${shout}</div>
        ${mis ? `<div class="sgx-misprints">
          ${Array.from({ length: Math.min(mis, 6) }, (_, k) => `<span class="sgx-misprint">
            ${_burst('MISPRINT!', '#e5195f', 108, -6)}
            <i>Re-zip ${k + 1} &mdash; back to the platform, run it again.</i>
          </span>`).join('')}
        </div>` : ''}
        <div class="sgx-cap"><b>${esc(captionOf(s.name, i))}</b>${esc(s.beat.text)}</div>
        <div class="sgx-numbers">
          <span><u>TIME</u><b>${esc(String(bd.time ?? '?'))}s</b></span>
          <span><u>RE-ZIPS</u><b>${mis}</b></span>
          <span><u>COVERS</u><b>${esc(String(bd.covers ?? '?'))}</b></span>
          ${bd.threw ? '<span class="sgx-threw"><u>NOTE</u><b>THREW IT</b></span>' : ''}
        </div>
      </article>`;
    }
    // Anything the competition narrates that is not a run: a letters page.
    return `<article class="sgx-card sgx-note">
      <div class="sgx-note-h">FROM THE BULLPEN</div>
      ${s.who.length ? `<div class="sgx-note-faces">${s.who.map(n => avatar(n, 28)).join('')}</div>` : ''}
      <p>${esc(s.beat.text)}</p>
    </article>`;
  };

  const cards = steps.map(cardFor).join('');

  const closing = done && winner ? `<div class="sgx-closing">
    <span>${esc(heroOf(winner))} goes to press. Everybody else is back issues.</span>
  </div>` : '';

  const nextLabel = state.idx < 0 ? 'Open the box' : 'Next issue';

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigcomics">
  ${_CSS}
  <div class="sgx-wrap">
    <div class="sgx-masthead">
      <div class="sgx-logo">BB<span>COMICS</span></div>
      <div class="sgx-sub">THE COMIC RACK &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'} &middot; WEEK ${ep.num}</div>
      <div class="sgx-tagline">${esc(_pick(ARC_TITLES, seedBase))}</div>
    </div>
    ${editorial}
    ${rackHtml}
    <div class="sgx-stack">${cards}</div>
    ${closing}
    <div class="sgx-controls">
      ${done ? '<span class="sgx-done">Every issue is on the shelf.</span>' : `
        <button class="rp-btn" onclick="${revealFn(ep, stateKey, Math.min(state.idx + 1, total - 1))}">${nextLabel}</button>
        <button class="rp-btn rp-btn-ghost" onclick="${revealFn(ep, stateKey, total - 1)}">Print the whole run</button>`}
      <span class="sgx-count">${Math.min(total, revealed)} / ${total}</span>
    </div>
  </div>
</div>`;
}

// ── the cover itself ──────────────────────────────────────────────────
//
// Shared by a run card and the collector's edition, because they are the same
// object printed at two different qualities.

function _coverBody({ name, bd, hero, arc, blurb, flash, price, esc, avatar, epNum, gold }) {
  return `<div class="sgx-cbody ${gold ? 'is-gold' : ''}">
    <div class="sgx-ctop">
      <span class="sgx-price">
        <b>${esc(price)}</b>
        <i>#${epNum}</i>
      </span>
      <span class="sgx-title">${esc(hero)}</span>
      <span class="sgx-approved">
        <em>APPROVED</em>
        <i>BY THE HOUSE</i>
      </span>
    </div>
    <div class="sgx-art">
      <span class="sgx-halftone"></span>
      <span class="sgx-rays"></span>
      <span class="sgx-portrait">${avatar(name, 96)}</span>
      <span class="sgx-flash">${esc(flash)}</span>
    </div>
    <div class="sgx-arc">${esc(arc)}</div>
    <div class="sgx-blurb">${esc(blurb)}</div>
  </div>`;
}

// ── styling ───────────────────────────────────────────────────────────

const _CSS = `<style>
.sigcomics{--sgx-news:#f3e9d2;--sgx-news2:#e6d8b6;--sgx-ink:#141018;--sgx-cy:#00a8e8;--sgx-mg:#e5195f;--sgx-ye:#ffcc00;--sgx-rd:#d92027;--sgx-gold:#c9a227;
  --sgx-disp:Impact,Haettenschweiler,'Arial Narrow Bold','Arial Black',sans-serif;
  --sgx-body:Georgia,'Iowan Old Style','Times New Roman',serif;}
.sigcomics .sgx-wrap{max-width:1100px;margin:0 auto;padding:0 4px 90px;color:var(--sgx-ink);}
.sigcomics .sgx-wrap *{box-sizing:border-box}

/* Ben-Day dot field, used everywhere newsprint shows through. */
.sigcomics .sgx-dots,
.sigcomics .sgx-ed,
.sigcomics .sgx-card,
.sigcomics .sgx-rack{
  background-color:var(--sgx-news);
  background-image:radial-gradient(circle at 1px 1px, rgba(20,16,24,0.18) 1px, transparent 1.7px);
  background-size:6px 6px;}

/* ── masthead ── */
.sigcomics .sgx-masthead{text-align:center;margin:2px 0 14px;padding:14px 10px 12px;
  border:5px solid var(--sgx-ink);border-radius:4px;background:var(--sgx-ye);
  background-image:repeating-linear-gradient(115deg, rgba(229,25,95,0.12) 0 14px, transparent 14px 30px);
  box-shadow:8px 8px 0 rgba(20,16,24,0.85);}
.sigcomics .sgx-logo{font-family:var(--sgx-disp);font-size:46px;line-height:0.9;letter-spacing:3px;color:var(--sgx-ink);
  text-shadow:4px 4px 0 var(--sgx-cy), 7px 7px 0 rgba(20,16,24,0.35);}
.sigcomics .sgx-logo span{color:var(--sgx-mg);text-shadow:4px 4px 0 var(--sgx-ink);margin-left:8px}
.sigcomics .sgx-sub{font-family:var(--sgx-disp);font-size:13px;letter-spacing:3px;margin-top:8px;color:var(--sgx-ink)}
.sigcomics .sgx-tagline{font-family:var(--sgx-body);font-style:italic;font-size:12px;margin-top:4px;color:rgba(20,16,24,0.75)}

/* ── editor's note ── */
.sigcomics .sgx-ed{border:4px solid var(--sgx-ink);border-radius:3px;padding:12px 14px;margin-bottom:14px;
  box-shadow:6px 6px 0 rgba(20,16,24,0.8);}
.sigcomics .sgx-ed-flag{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-family:var(--sgx-disp);
  font-size:20px;letter-spacing:2px}
.sigcomics .sgx-ed-cat{font-size:10px;letter-spacing:2px;padding:3px 8px;border:3px solid var(--sgx-ink);
  background:var(--sgx-cy);color:var(--sgx-ink)}
.sigcomics .sgx-ed-issue{margin-left:auto;font-size:11px;letter-spacing:2px;padding:3px 8px;
  border:3px solid var(--sgx-ink);background:var(--sgx-mg);color:#fff}
.sigcomics .sgx-ed-d{font-family:var(--sgx-body);font-size:13px;line-height:1.65;margin:10px 0 0;color:rgba(20,16,24,0.9)}
.sigcomics .sgx-ed-w{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
.sigcomics .sgx-stat{display:flex;align-items:center;gap:6px;font-family:var(--sgx-disp);font-size:11px;letter-spacing:1.5px;text-transform:uppercase}
.sigcomics .sgx-stat i{font-style:normal}
.sigcomics .sgx-stat u{text-decoration:none;opacity:0.7}
.sigcomics .sgx-stat-bar{display:inline-block;width:56px;height:9px;border:2px solid var(--sgx-ink);background:rgba(255,255,255,0.5)}
.sigcomics .sgx-stat-bar b{display:block;height:100%;background:var(--sgx-mg)}
.sigcomics .sgx-ed-f{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-family:var(--sgx-disp);
  font-size:10px;letter-spacing:2px;color:rgba(20,16,24,0.72);border-top:2px dashed rgba(20,16,24,0.35);padding-top:8px}

/* ── the rack ── */
.sigcomics .sgx-rack{border:4px solid var(--sgx-ink);border-radius:3px;padding:10px 12px 12px;margin-bottom:16px;
  box-shadow:6px 6px 0 rgba(20,16,24,0.8);}
.sigcomics .sgx-rack-h{display:flex;align-items:baseline;gap:10px;border-bottom:4px solid var(--sgx-ink);padding-bottom:6px;margin-bottom:10px}
.sigcomics .sgx-rack-t{font-family:var(--sgx-disp);font-size:22px;letter-spacing:3px}
.sigcomics .sgx-rack-s{font-family:var(--sgx-body);font-style:italic;font-size:11px;color:rgba(20,16,24,0.7)}
.sigcomics .sgx-rack-b{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px}
.sigcomics .sgx-mini{flex:0 0 auto;width:110px;border:3px solid var(--sgx-ink);background:var(--sgx-news2);
  padding:6px;display:flex;flex-direction:column;align-items:center;gap:3px;box-shadow:3px 3px 0 rgba(20,16,24,0.7)}
.sigcomics .sgx-mini.is-top{background:var(--sgx-ye);box-shadow:3px 3px 0 var(--sgx-mg)}
.sigcomics .sgx-mini-rank{font-family:var(--sgx-disp);font-size:14px;letter-spacing:1px}
.sigcomics .sgx-mini-art{filter:contrast(1.15) saturate(0.85)}
.sigcomics .sgx-mini-title{font-family:var(--sgx-disp);font-size:10px;letter-spacing:1px;text-align:center;line-height:1.2}
.sigcomics .sgx-mini-time{font-family:var(--sgx-disp);font-size:16px;letter-spacing:1px;color:var(--sgx-rd)}
.sigcomics .sgx-mini-mis{font-family:var(--sgx-body);font-size:9.5px;font-style:italic;opacity:0.75}
.sigcomics .sgx-rack-empty{display:flex;align-items:center;gap:6px;opacity:0.45;font-family:var(--sgx-body);font-style:italic;font-size:11px}

/* ── cards ── */
.sigcomics .sgx-stack{display:flex;flex-direction:column;gap:16px}
.sigcomics .sgx-card{position:relative;border:5px solid var(--sgx-ink);border-radius:3px;padding:12px;
  box-shadow:9px 9px 0 rgba(20,16,24,0.85);}
.sigcomics .sgx-pending{display:flex;align-items:center;justify-content:center;gap:10px;padding:16px;
  opacity:0.28;border-style:dashed;box-shadow:none;font-family:var(--sgx-disp);letter-spacing:3px;font-size:12px}

/* cover interior */
.sigcomics .sgx-cbody{border:4px solid var(--sgx-ink);background:var(--sgx-news2);padding:0 0 8px}
.sigcomics .sgx-ctop{display:flex;align-items:stretch;gap:0;border-bottom:4px solid var(--sgx-ink)}
.sigcomics .sgx-price{flex:0 0 auto;width:64px;border-right:4px solid var(--sgx-ink);background:var(--sgx-ye);
  display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px}
.sigcomics .sgx-price b{font-family:var(--sgx-disp);font-size:17px;letter-spacing:1px}
.sigcomics .sgx-price i{font-style:normal;font-family:var(--sgx-disp);font-size:10px;opacity:0.75}
.sigcomics .sgx-title{flex:1 1 auto;display:flex;align-items:center;justify-content:center;text-align:center;
  font-family:var(--sgx-disp);font-size:30px;letter-spacing:1.5px;line-height:1;padding:8px 6px;
  color:var(--sgx-ink);text-shadow:3px 3px 0 var(--sgx-ye), 5px 5px 0 rgba(20,16,24,0.28)}
.sigcomics .sgx-approved{flex:0 0 auto;width:72px;border-left:4px solid var(--sgx-ink);background:var(--sgx-cy);
  display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px;text-align:center}
.sigcomics .sgx-approved em{font-style:normal;font-family:var(--sgx-disp);font-size:11px;letter-spacing:1px}
.sigcomics .sgx-approved i{font-style:normal;font-family:var(--sgx-body);font-size:7.5px;letter-spacing:0.5px;line-height:1.1}

.sigcomics .sgx-art{position:relative;height:172px;overflow:hidden;border-bottom:4px solid var(--sgx-ink);
  background:linear-gradient(180deg,#ffe9a8 0%,#ffb4c8 55%,#bfe6ff 100%)}
.sigcomics .sgx-halftone{position:absolute;inset:0;
  background-image:radial-gradient(circle at 2px 2px, rgba(229,25,95,0.35) 1.6px, transparent 2.4px);
  background-size:9px 9px;animation:sgxHalf 5s ease-in-out infinite}
.sigcomics .sgx-rays{position:absolute;left:50%;top:50%;width:520px;height:520px;transform:translate(-50%,-50%);
  background:repeating-conic-gradient(from 0deg, rgba(255,255,255,0.55) 0deg 7deg, transparent 7deg 15deg);
  opacity:0.5;animation:sgxRays 6s ease-in-out infinite}
.sigcomics .sgx-portrait{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);
  border:5px solid var(--sgx-ink);border-radius:50%;background:var(--sgx-news);padding:3px;
  box-shadow:0 0 0 6px rgba(255,204,0,0.85), 6px 6px 0 rgba(20,16,24,0.5);
  filter:contrast(1.2) saturate(1.05);animation:sgxGlow 4.5s ease-in-out infinite}
/* The frame is a circle; the avatar inside it is a square image, so without
   clipping the portrait's corners poked out past the yellow ring. Both the
   wrapper and the image are rounded — rounding only the wrapper leaves the
   <img> square on top of it. */
.sigcomics .sgx-portrait .bb-av{display:block;border-radius:50%;overflow:hidden}
.sigcomics .sgx-portrait .bb-av img{border-radius:50%;display:block;width:100%;height:100%;object-fit:cover}
.sigcomics .sgx-flash{position:absolute;right:8px;top:8px;font-family:var(--sgx-disp);font-size:11px;letter-spacing:1.5px;
  padding:5px 8px;border:3px solid var(--sgx-ink);background:var(--sgx-rd);color:#fff;transform:rotate(6deg)}
.sigcomics .sgx-arc{font-family:var(--sgx-disp);font-size:12px;letter-spacing:3px;text-align:center;padding:6px 4px 2px;color:rgba(20,16,24,0.8)}
.sigcomics .sgx-blurb{font-family:var(--sgx-disp);font-size:15px;letter-spacing:1px;text-align:center;padding:2px 10px 4px;color:var(--sgx-mg)}

/* run tone */
.sigcomics .sgx-cover.is-clean{box-shadow:9px 9px 0 rgba(0,168,232,0.9)}
.sigcomics .sgx-cover.is-slip{box-shadow:9px 9px 0 rgba(20,16,24,0.85)}
.sigcomics .sgx-cover.is-melt{box-shadow:9px 9px 0 rgba(217,32,39,0.9)}

.sigcomics .sgx-shout{position:absolute;right:-10px;top:-16px;pointer-events:none;
  filter:drop-shadow(3px 3px 0 rgba(20,16,24,0.4));animation:sgxPulse 3.2s ease-in-out infinite}
.sigcomics .sgx-burst{display:block}

.sigcomics .sgx-misprints{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
.sigcomics .sgx-misprint{display:flex;align-items:center;gap:6px;max-width:340px;
  border:3px dashed var(--sgx-mg);background:rgba(229,25,95,0.08);padding:4px 8px}
.sigcomics .sgx-misprint i{font-style:italic;font-family:var(--sgx-body);font-size:11px;line-height:1.4}

.sigcomics .sgx-cap{margin-top:10px;border:3px solid var(--sgx-ink);background:var(--sgx-news);padding:9px 11px;
  font-family:var(--sgx-body);font-size:13px;line-height:1.65}
.sigcomics .sgx-cap b{display:block;font-family:var(--sgx-disp);font-size:11px;letter-spacing:2.5px;margin-bottom:5px;color:var(--sgx-rd)}
.sigcomics .sgx-cap-gold b{color:var(--sgx-gold)}

.sigcomics .sgx-numbers{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}
.sigcomics .sgx-numbers span{flex:0 0 auto;min-width:78px;border:3px solid var(--sgx-ink);background:var(--sgx-news);
  padding:5px 9px;display:flex;flex-direction:column;align-items:center}
.sigcomics .sgx-numbers u{text-decoration:none;font-family:var(--sgx-disp);font-size:9px;letter-spacing:2px;opacity:0.65}
.sigcomics .sgx-numbers b{font-family:var(--sgx-disp);font-size:19px;letter-spacing:1px}
.sigcomics .sgx-numbers .sgx-threw{background:var(--sgx-rd);color:#fff}

/* wall card */
.sigcomics .sgx-wallcard .sgx-wall-h{display:flex;align-items:center;gap:12px;font-family:var(--sgx-disp);
  font-size:24px;letter-spacing:3px;border-bottom:4px solid var(--sgx-ink);padding-bottom:8px;margin-bottom:10px}
.sigcomics .sgx-zip{flex:0 0 auto;animation:sgxWire 5s ease-in-out infinite}
.sigcomics .sgx-wall-strip{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;padding:8px;
  border:3px dashed rgba(20,16,24,0.4);background:rgba(255,255,255,0.28)}
.sigcomics .sgx-wall-faces{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px}
.sigcomics .sgx-face{display:flex;align-items:center;gap:6px;font-family:var(--sgx-disp);font-size:11px;letter-spacing:1px}
.sigcomics .sgx-face i{font-style:normal}

/* margin card */
.sigcomics .sgx-margin{background-color:var(--sgx-cy)!important}
.sigcomics .sgx-margin-h{font-family:var(--sgx-disp);font-size:20px;letter-spacing:3px;text-align:center;
  border-bottom:4px solid var(--sgx-ink);padding-bottom:6px;margin-bottom:10px}
.sigcomics .sgx-margin-b{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap}
.sigcomics .sgx-vs{font-family:var(--sgx-disp);font-size:24px;letter-spacing:2px;color:var(--sgx-rd)}
.sigcomics .sgx-margin-t{font-family:var(--sgx-body);font-size:13px;line-height:1.65;margin:10px 0 0;text-align:center}

/* note card */
.sigcomics .sgx-note-h{font-family:var(--sgx-disp);font-size:14px;letter-spacing:3px;margin-bottom:6px;color:var(--sgx-mg)}
.sigcomics .sgx-note p{font-family:var(--sgx-body);font-size:13px;line-height:1.65;margin:6px 0 0}
.sigcomics .sgx-note-faces{display:flex;gap:6px;flex-wrap:wrap}

/* collector's edition */
.sigcomics .sgx-collector{border-color:var(--sgx-gold);box-shadow:10px 10px 0 rgba(201,162,39,0.85);overflow:hidden}
.sigcomics .sgx-col-band{font-family:var(--sgx-disp);font-size:19px;letter-spacing:3px;text-align:center;
  background:var(--sgx-gold);color:var(--sgx-ink);border:4px solid var(--sgx-ink);padding:6px;margin-bottom:10px}
.sigcomics .sgx-collector .sgx-title{font-size:38px;text-shadow:3px 3px 0 #fff3bf, 6px 6px 0 rgba(20,16,24,0.35)}
.sigcomics .sgx-collector .sgx-art{height:210px;background:linear-gradient(180deg,#fff3bf 0%,#ffd76e 50%,#f0a500 100%)}
.sigcomics .sgx-foil{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.55) 46%, rgba(255,236,170,0.65) 52%, transparent 68%);
  opacity:0.55;animation:sgxFoil 6s ease-in-out infinite}
.sigcomics .sgx-stamp{margin-top:10px;text-align:center;font-family:var(--sgx-disp);font-size:12px;letter-spacing:3px;
  border:3px double var(--sgx-ink);padding:5px;color:var(--sgx-gold);background:rgba(20,16,24,0.9)}

.sigcomics .sgx-closing{margin-top:14px;text-align:center;font-family:var(--sgx-disp);font-size:14px;letter-spacing:2px;
  border:4px solid var(--sgx-ink);background:var(--sgx-ye);padding:10px;box-shadow:6px 6px 0 rgba(20,16,24,0.8)}

/* ── controls ── */
.sigcomics .sgx-controls{position:sticky;bottom:0;z-index:6;display:flex;gap:10px;justify-content:center;align-items:center;
  margin-top:16px;padding:10px;border:4px solid var(--sgx-ink);background:var(--sgx-news);
  background-image:radial-gradient(circle at 1px 1px, rgba(20,16,24,0.18) 1px, transparent 1.7px);background-size:6px 6px;
  box-shadow:0 -6px 0 rgba(20,16,24,0.25)}
.sigcomics .sgx-controls .rp-btn{font-family:var(--sgx-disp);letter-spacing:2px}
.sigcomics .sgx-count{font-family:var(--sgx-disp);font-size:13px;letter-spacing:2px;color:var(--sgx-ink)}
.sigcomics .sgx-done{font-family:var(--sgx-disp);font-size:13px;letter-spacing:2px;color:var(--sgx-mg)}

@keyframes sgxHalf{0%,100%{opacity:0.55}50%{opacity:0.9}}
@keyframes sgxRays{0%,100%{opacity:0.35}50%{opacity:0.62}}
@keyframes sgxGlow{0%,100%{filter:contrast(1.2) saturate(1.05) drop-shadow(0 0 0 rgba(229,25,95,0))}
  50%{filter:contrast(1.25) saturate(1.15) drop-shadow(0 0 12px rgba(229,25,95,0.6))}}
@keyframes sgxPulse{0%,100%{opacity:0.9}50%{opacity:1;filter:drop-shadow(3px 3px 0 rgba(20,16,24,0.4)) drop-shadow(0 0 9px rgba(255,204,0,0.8))}}
@keyframes sgxFoil{0%,100%{opacity:0.25}50%{opacity:0.7}}
@keyframes sgxWire{0%,100%{opacity:0.75}50%{opacity:1}}

@media(max-width:640px){
  .sigcomics .sgx-logo{font-size:34px}
  .sigcomics .sgx-title{font-size:22px}
  .sigcomics .sgx-collector .sgx-title{font-size:26px}
  .sigcomics .sgx-art{height:140px}
  .sigcomics .sgx-shout{right:-4px;top:-10px;transform:scale(0.75);transform-origin:top right}
}
@media(prefers-reduced-motion:reduce){
  .sigcomics .sgx-halftone,.sigcomics .sgx-rays,.sigcomics .sgx-portrait,
  .sigcomics .sgx-shout,.sigcomics .sgx-foil,.sigcomics .sgx-zip{animation:none!important}
  .sigcomics .sgx-portrait{filter:contrast(1.2) saturate(1.05)}
  .sigcomics .sgx-foil{opacity:0.4}
}
</style>`;
