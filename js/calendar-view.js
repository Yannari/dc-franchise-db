// The franchise calendar — the Franchise Calendar tab on timeline.html
// (timeline.html#calendar). A new show needs nothing here: see
// docs/ADDING-A-SHOW.md §5.1.
//
// Every season of every show, one year at a time, Jan to Dec. Three questions
// at once: what is on now, what comes after it, and what aired in a given
// month of a given year.
//
// ── NO SECOND CLOCK ──
//
// Everything here is DERIVED from `airYear` + `airSlot` on the rows of
// seasons_database.json, through js/franchise-calendar.js — the same premiere
// rule the wiki prints episode dates with, so this tab cannot disagree with an
// infobox. A bar runs from the premiere to the finale, one episode a week on
// that show's night. Nothing is stored here and nothing is typed in.
//
// ── PROJECTED IS NOT SCHEDULED ──
//
// The ghost bars are `nextWindowFor` — the show's own rhythm continued, which
// is what the export writes when the next season arrives undated. They are
// drawn dashed and labelled "projected" everywhere, because a guess drawn like
// a fact is how a calendar starts lying.

import { SHOWS, DEFAULT_FORMAT } from './shows.js';
import {
  airKey, airLabel, latestAired, nextWindowFor, nextAllStarsWindow, episodeAirDates, airDateLabel, bookedWindow, DEFAULT_RUN, projectedRun,
} from './franchise-calendar.js';
import { readSavedGame, readLocks, liveSeason, setupSeason } from './air-watch.js';

const DAY = 86400000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NIGHTS = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];

// The four slots are the four quarters: franchise-calendar.js starts winter in
// January, spring in April, summer in July and fall in October.
const SVG = {
  winter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/><path d="M9.6 3.9 12 6l2.4-2.1M9.6 20.1 12 18l2.4 2.1M4.3 10.4l3-1-.6-3.1M19.7 13.6l-3 1 .6 3.1M4.3 13.6l3 1-.6 3.1M19.7 10.4l-3-1 .6-3.1"/></svg>',
  spring: '<svg viewBox="0 0 24 24"><g fill="currentColor">'
    + [0, 72, 144, 216, 288].map(a => `<ellipse cx="12" cy="6.6" rx="3.3" ry="5" transform="rotate(${a} 12 12)" opacity=".92"/>`).join('')
    + '</g><circle cx="12" cy="12" r="2.5" fill="#fff3b0"/></svg>',
  summer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.4" fill="currentColor"/>'
    + [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M12 2.2v2.6" transform="rotate(${a} 12 12)"/>`).join('')
    + '</svg>',
  fall: '<svg viewBox="0 0 24 24"><path d="M4.5 19.5C4.5 10.6 10.4 4.5 20 4.5c0 9.4-6.1 15-15.5 15z" fill="currentColor"/><path d="M4.5 19.5 14.5 9.5M9 15h3.6M11.6 12.4V9" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.3" stroke-linecap="round"/></svg>',
};
// What drifts across each quarter's header.
const BIT = {
  winter: '<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M5 .8v8.4M1.4 2.9l7.2 4.2M1.4 7.1l7.2-4.2"/></svg>',
  spring: '<svg viewBox="0 0 10 10"><ellipse cx="5" cy="5" rx="2.4" ry="4.2" fill="currentColor"/></svg>',
  summer: '<svg viewBox="0 0 10 10"><path d="M5 0 6.1 3.9 10 5 6.1 6.1 5 10 3.9 6.1 0 5 3.9 3.9z" fill="currentColor"/></svg>',
  fall: '<svg viewBox="0 0 10 10"><path d="M1 9C1 4.2 4.2 1 9 1c0 4.8-3.2 8-8 8z" fill="currentColor"/></svg>',
};
const QUARTERS = [
  { slot: 'winter', label: 'Winter', months: 'Jan – Mar' },
  { slot: 'spring', label: 'Spring', months: 'Apr – Jun' },
  { slot: 'summer', label: 'Summer', months: 'Jul – Sep' },
  { slot: 'fall', label: 'Fall', months: 'Oct – Dec' },
];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const yStart = y => Date.UTC(y, 0, 1);
const yEnd = y => Date.UTC(y + 1, 0, 1);
const shortDate = d => `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;

// ── THE DATA ─────────────────────────────────────────────────────────

async function loadSeasons() {
  try {
    const doc = await fetch('seasons_database.json').then(r => (r.ok ? r.json() : null));
    if (Array.isArray(doc?.seasons)) return doc.seasons;
  } catch {}
  // Offline or opened from disk: the copy this page keeps in localStorage.
  try { return JSON.parse(localStorage.getItem('seasons_database') || 'null')?.seasons || []; } catch { return []; }
}

/** "Carnival of Chaos" out of "Total Drama: Carnival of Chaos" — the lane already says the show. */
function subtitleOf(title, show) {
  const t = String(title || '').trim();
  const name = show?.name || '';
  if (name && t.toLowerCase().startsWith(name.toLowerCase())) {
    const rest = t.slice(name.length).replace(/^[\s:·\-–—]+/, '').trim();
    return /^\d+$/.test(rest) ? '' : rest.replace(/^\d+\s*[:·\-–—]\s*/, '');
  }
  return t;
}

/** Why an unaired season is drawn this long, said in the detail panel. */
const lengthWhy = r => !r.lengthGuessed ? ''
  : r.lengthBasis === 'cast' && r.cast ? ` (from its ${r.cast}-person cast)`
    : r.lengthBasis === 'typical' ? ' (the show’s usual length)'
      : r.lengthBasis === 'last' ? ' (as long as the last one)' : '';

/** The simulator's setup when there is no saved game to read it from. */
function readConfig() {
  try { return JSON.parse(localStorage.getItem('simulator_config') || 'null'); } catch { return null; }
}

/** One season as a run of weekly dates, or null when it has no window. */
function runOf(season, projected = false, key = null) {
  const format = season.format || DEFAULT_FORMAT;
  const show = SHOWS[format] || { name: format, short: '?', emoji: '📺', accent: '#9b6dff', prefix: '?' };
  const count = Number(season.episodeCount) > 0 ? Number(season.episodeCount) : DEFAULT_RUN;
  const dates = episodeAirDates(season, count, format);
  if (!dates.length) return null;
  const ref = season.seasonId || (show.prefix === 'td' ? season.seasonNumber : `${show.prefix}-${season.seasonNumber}`);
  return {
    season, format, show, count, projected, ref,
    key: key || (projected ? `next-${format}` : String(ref)),
    start: dates[0],
    finale: dates[dates.length - 1],
    // An All Stars season is counted on its own: "DR AS1", not "DR 4".
    short: season.allStars && show.allStars
      ? `${show.short} ${show.allStars.short}${season.asNumber || ''}`
      : `${show.short} ${season.seasonNumber}`,
    sub: subtitleOf(season.title, show),
  };
}

/** What a not-yet-exported bar is: being played, started, possible or projected. */
const tagOf = r => (r.live ? 'playing now' : r.started ? 'started' : r.possible ? 'possible' : 'projected');

/**
 * `live` is the season in the simulator (air-watch.js liveSeason) and `locks`
 * the windows of seasons that have started; both sit on their show's next bar
 * instead of the rule's guess.
 */
function buildModel(seasons, { live = null, setup = null, locks = {} } = {}) {
  const dated = seasons.filter(s => airKey(s) != null);
  // Each aired All Stars learns which one it was, in air order.
  const starCount = {};
  const numbered = dated.slice().sort((a, b) => airKey(a) - airKey(b)).map(s => {
    if (!s.allStars) return s;
    const f = s.format || DEFAULT_FORMAT;
    starCount[f] = (starCount[f] || 0) + 1;
    return { ...s, asNumber: starCount[f] };
  });
  const runs = numbered.map(s => runOf(s)).filter(Boolean)
    .sort((a, b) => a.start - b.start || a.finale - b.finale);

  // Each show's next season, continued from its own rhythm.
  const ghosts = [];
  for (const [format, show] of Object.entries(SHOWS)) {
    const mine = dated.filter(s => (s.format || DEFAULT_FORMAT) === format);
    // A show with nothing aired still has a first season to place when it has
    // home quarters; without them there is no rhythm to continue.
    if (!mine.length && !show.airSlots?.length) continue;
    const last = mine.slice().sort((a, b) => airKey(a) - airKey(b)).pop();
    const n = last ? (Number(last.seasonNumber) || mine.length) + 1 : 1;
    const playing = live && live.format === format && live.number === n ? live : null;
    const lock = locks[`${format}#${n}`] || null;
    const w = playing?.window || lock || nextWindowFor(dated.map(s => ({ ...s, format: s.format || DEFAULT_FORMAT })), format, { number: n });
    if (!w) continue;
    // How long it runs: played (its queue), from the cast set up for it, or the
    // show's usual length — never just the last season's (franchise-calendar.js projectedRun).
    const cast = playing?.cast || (setup && setup.format === format && setup.number === n ? setup.castSize : null);
    const guess = playing && playing.basis === 'played' ? { count: playing.total, basis: 'played' }
      : playing ? { count: playing.total, basis: playing.basis, cast } : projectedRun(format, mine, cast);
    const run = runOf({
      format, seasonNumber: n, title: `${show.name} ${n}`,
      airYear: w.airYear, airSlot: w.airSlot, episodeCount: guess.count,
    }, true);
    if (run) {
      run.lengthGuessed = guess.basis !== 'played';
      run.lengthBasis = guess.basis;
      run.cast = guess.cast || cast || null;
      run.live = !!playing;
      run.aired = playing?.aired || 0;
      run.started = !!(lock || playing?.locked);
      const b = bookedWindow(format, n);
      run.booked = !!b && b.airYear === w.airYear && b.airSlot === w.airSlot;
      ghosts.push(run);
    }

    // ALL STARS — possible, on its own quarter. Before the first one, the
    // flagship seasons it waits on are drawn too (the `bridge`), so the bar
    // does not float in a year with nothing before it.
    const as = nextAllStarsWindow(dated.map(s => ({ ...s, format: s.format || DEFAULT_FORMAT })), format);
    if (!as) continue;
    let k = n;
    for (const b of as.bridge) {
      if (b.airYear === w.airYear && b.airSlot === w.airSlot) continue;
      k++;
      const bridge = runOf({
        format, seasonNumber: k, title: `${show.name} ${k}`,
        airYear: b.airYear, airSlot: b.airSlot, episodeCount: projectedRun(format, mine).count,
      }, true, `next-${format}-${k}`);
      if (bridge) { bridge.lengthGuessed = true; bridge.lengthBasis = projectedRun(format, mine).basis; ghosts.push(bridge); }
    }
    const lastStar = mine.filter(s => s.allStars).sort((a, b) => airKey(a) - airKey(b)).pop();
    const count = lastStar?.episodeCount || projectedRun(format, mine).count;
    const star = runOf({
      format, allStars: true, asNumber: as.number, seasonNumber: as.number,
      title: `${show.name} ${show.allStars.label} ${as.number}`,
      airYear: as.airYear, airSlot: as.airSlot, episodeCount: count,
    }, true, `next-${format}-as`);
    if (star) { star.lengthGuessed = true; star.lengthBasis = lastStar ? 'last' : projectedRun(format, mine).basis; star.possible = true; ghosts.push(star); }
  }
  ghosts.sort((a, b) => a.start - b.start);

  const nowSeason = latestAired(dated);
  const nowRun = nowSeason ? runs.find(r => r.season === nowSeason || (nowSeason.seasonId && r.season.seasonId === nowSeason.seasonId)) : null;
  const all = [...runs, ...ghosts];
  const years = all.flatMap(r => [r.start.getUTCFullYear(), r.finale.getUTCFullYear()]);
  const unplaced = Object.entries(SHOWS)
    .filter(([format]) => !dated.some(s => (s.format || DEFAULT_FORMAT) === format) && !ghosts.some(g => g.format === format))
    .map(([format, show]) => ({ format, show }));

  return {
    runs, ghosts, all, nowRun, unplaced,
    now: nowRun ? nowRun.finale : null,
    minYear: years.length ? Math.min(...years) : new Date().getUTCFullYear(),
    maxYear: years.length ? Math.max(...years) : new Date().getUTCFullYear(),
  };
}

// ── THE VIEW ─────────────────────────────────────────────────────────

const state = { model: null, year: null, selected: null, root: null, built: false };

function css() {
  if (document.getElementById('fc-style')) return;
  const st = document.createElement('style');
  st.id = 'fc-style';
  st.textContent = `
.fc{--fc-winter:#9bdcff;--fc-spring:#ff9fd0;--fc-summer:#ffc94a;--fc-fall:#ff8a3d;
  --fc-ink:#f5f0ff;--fc-dim:rgba(245,240,255,.58);--fc-line:rgba(255,255,255,.09);
  color:var(--fc-ink);position:relative}
.fc-head{display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap;align-items:flex-end;margin:4px 0 16px}
.fc-eyebrow{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--fc-dim);font-weight:700}
.fc-yearline{display:flex;align-items:center;gap:10px;margin:4px 0 6px}
.fc-arrow{width:38px;height:38px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);
  color:#fff;font-size:20px;line-height:1;cursor:pointer;transition:transform .2s,background .2s,opacity .2s}
.fc-arrow:hover:not(:disabled){background:rgba(155,109,255,.28);transform:scale(1.08)}
.fc-arrow:disabled{opacity:.25;cursor:default}
.fc-year{margin:0;font-size:clamp(40px,6vw,64px);line-height:1;font-weight:900;letter-spacing:-.02em;overflow:hidden;
  background:linear-gradient(100deg,#fff 0%,#e7d9ff 35%,#ff9fd0 70%,#ffc94a 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
  font-variant-numeric:tabular-nums;padding:2px 2px 4px}
.fc-year span{display:inline-block}
.fc-deck{font-size:13px;color:var(--fc-dim);max-width:520px;line-height:1.45}
.fc-cards{display:flex;gap:10px;flex-wrap:wrap}
.fc-card{min-width:210px;max-width:290px;padding:12px 14px;border-radius:14px;border:1px solid var(--fc-line);
  background:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.015));cursor:pointer;position:relative;overflow:hidden;
  transition:transform .25s,border-color .25s}
.fc-card:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.22)}
.fc-card::before{content:"";position:absolute;inset:0 auto 0 0;width:3px;background:var(--ac,#9b6dff);box-shadow:0 0 14px var(--ac,#9b6dff)}
.fc-card small{display:block;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--fc-dim);font-weight:800}
.fc-card b{display:block;font-size:15px;margin:3px 0 2px}
.fc-card span{font-size:12px;color:var(--fc-dim)}
.fc-card.now small::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:#4ade80;margin-right:6px;
  box-shadow:0 0 0 0 rgba(74,222,128,.7);animation:fcPing 1.8s infinite;vertical-align:1px}

.fc-years{display:flex;gap:6px;overflow-x:auto;padding:4px 2px 10px;margin-bottom:6px;scrollbar-width:thin}
.fc-pill{flex:0 0 auto;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:var(--fc-dim);
  border-radius:12px;padding:7px 11px 6px;cursor:pointer;font-weight:800;font-size:13px;font-variant-numeric:tabular-nums;
  transition:all .25s;display:flex;flex-direction:column;align-items:center;gap:4px}
.fc-pill i{display:flex;gap:3px;min-height:6px}
.fc-pill i em{width:6px;height:6px;border-radius:50%;background:var(--c);box-shadow:0 0 6px var(--c)}
.fc-pill i em.ghost{background:transparent;border:1px dashed var(--c);box-shadow:none;width:4px;height:4px}
.fc-pill:hover{color:#fff;border-color:rgba(255,255,255,.25)}
.fc-pill.on{color:#fff;background:linear-gradient(135deg,rgba(125,76,255,.45),rgba(255,76,230,.28));border-color:rgba(255,159,208,.55);
  box-shadow:0 6px 22px rgba(125,76,255,.35);transform:translateY(-1px)}
.fc-pill.has-now{position:relative}
.fc-pill.has-now::after{content:"NOW";position:absolute;top:-7px;right:-6px;font-size:8px;letter-spacing:.08em;background:#4ade80;color:#06240f;
  border-radius:6px;padding:1px 4px;font-weight:900}

.fc-board-wrap{overflow-x:auto;border-radius:16px;border:1px solid var(--fc-line);background:rgba(8,5,16,.45)}
.fc-board{min-width:760px;display:grid;grid-template-columns:132px 1fr;position:relative}
.fc-board.in-next{animation:fcInNext .55s cubic-bezier(.2,.8,.2,1)}
.fc-board.in-prev{animation:fcInPrev .55s cubic-bezier(.2,.8,.2,1)}
.fc-gutter{border-right:1px solid var(--fc-line)}
.fc-corner{height:86px;display:flex;align-items:flex-end;padding:0 12px 10px;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--fc-dim);font-weight:800}
.fc-lanelabel{height:58px;display:flex;align-items:center;gap:8px;padding:0 12px;border-top:1px solid var(--fc-line);font-weight:800;font-size:13px;
  animation:fcFade .5s both}
.fc-lanelabel .em{font-size:18px;filter:drop-shadow(0 0 8px var(--ac))}
.fc-lanelabel.mine{background:linear-gradient(90deg,color-mix(in srgb,var(--ac) 22%,transparent),transparent)}
.fc-lanelabel.mine::after{content:"this show";font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--fc-dim);margin-left:auto}
.fc-time{position:relative}
.fc-q{position:absolute;top:0;bottom:0;width:25%;pointer-events:none}
.fc-q.winter{left:0;background:linear-gradient(180deg,rgba(155,220,255,.16),rgba(155,220,255,.035) 40%,rgba(155,220,255,.02))}
.fc-q.spring{left:25%;background:linear-gradient(180deg,rgba(255,159,208,.15),rgba(134,239,172,.035) 40%,rgba(134,239,172,.02))}
.fc-q.summer{left:50%;background:linear-gradient(180deg,rgba(255,201,74,.16),rgba(255,201,74,.035) 40%,rgba(255,201,74,.02))}
.fc-q.fall{left:75%;background:linear-gradient(180deg,rgba(255,138,61,.17),rgba(255,138,61,.04) 40%,rgba(255,138,61,.02))}
.fc-q + .fc-q{border-left:1px solid rgba(255,255,255,.07)}
.fc-qrow{display:grid;grid-template-columns:repeat(4,1fr);height:52px;position:relative}
.fc-qh{position:relative;overflow:hidden;display:flex;align-items:center;gap:9px;padding:0 12px}
.fc-qh .ico{width:24px;height:24px;flex:0 0 auto;filter:drop-shadow(0 0 8px currentColor)}
.fc-qh.winter{color:var(--fc-winter)} .fc-qh.spring{color:var(--fc-spring)} .fc-qh.summer{color:var(--fc-summer)} .fc-qh.fall{color:var(--fc-fall)}
.fc-qh.summer .ico{animation:fcSpin 18s linear infinite}
.fc-qh.spring .ico{animation:fcBloom 4s ease-in-out infinite}
.fc-qh.winter .ico{animation:fcSway 6s ease-in-out infinite}
.fc-qh.fall .ico{animation:fcSway 5s ease-in-out infinite}
.fc-qh b{font-size:14px;letter-spacing:.04em;position:relative;z-index:1}
.fc-qh small{font-size:10.5px;color:var(--fc-dim);position:relative;z-index:1}
.fc-bit{position:absolute;top:-12px;width:8px;height:8px;opacity:0;pointer-events:none}
.fc-bit svg{width:100%;height:100%;display:block}
.fc-qh.winter .fc-bit{animation:fcSnow 5.5s linear infinite}
.fc-qh.spring .fc-bit{animation:fcPetal 6.5s ease-in-out infinite}
.fc-qh.summer .fc-bit{top:auto;bottom:-10px;animation:fcRise 4.5s ease-in infinite}
.fc-qh.fall .fc-bit{animation:fcLeaf 6s ease-in-out infinite}
.fc-mrow{display:grid;grid-template-columns:repeat(12,1fr);height:33px;border-top:1px solid var(--fc-line)}
.fc-m{display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:700;color:var(--fc-dim);letter-spacing:.06em;
  animation:fcDrop .5s both}
.fc-m.cur{color:#fff;text-shadow:0 0 10px rgba(255,255,255,.5)}
.fc-lane{position:relative;height:58px;border-top:1px solid var(--fc-line)}
.fc-mgrid{position:absolute;inset:86px 0 0 0;display:grid;grid-template-columns:repeat(12,1fr);pointer-events:none}
.fc-mgrid i{border-left:1px dashed rgba(255,255,255,.045)}
.fc-mgrid i:first-child{border-left:0}

.fc-bar{position:absolute;top:10px;height:38px;border-radius:11px;cursor:pointer;display:flex;align-items:center;gap:8px;padding:0 10px;
  white-space:nowrap;overflow:hidden;color:#fff;font-size:12.5px;border:1px solid color-mix(in srgb,var(--ac) 70%,#fff 10%);
  background:linear-gradient(100deg,color-mix(in srgb,var(--ac) 88%,#000 0%),color-mix(in srgb,var(--ac) 55%,#1a0f2e));
  box-shadow:0 6px 20px color-mix(in srgb,var(--ac) 35%,transparent),inset 0 1px 0 rgba(255,255,255,.25);
  transform-origin:left center;animation:fcGrow .8s cubic-bezier(.2,.9,.25,1) both;
  transition:transform .25s,box-shadow .25s,filter .25s}
.fc-bar::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(90deg,transparent 0 calc(var(--wk) - 2px),rgba(255,255,255,.16) calc(var(--wk) - 2px) var(--wk));
  mask:linear-gradient(180deg,transparent 0 62%,#000 62%)}
.fc-bar::after{content:"";position:absolute;top:0;bottom:0;width:40%;left:-45%;pointer-events:none;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.45),transparent);animation:fcShine 1.1s .55s ease-out both}
.fc-bar:hover::after{animation:fcShine .9s ease-out}
.fc-bar:hover{transform:translateY(-2px) scale(1.012);filter:brightness(1.12);z-index:3;
  box-shadow:0 10px 28px color-mix(in srgb,var(--ac) 55%,transparent),inset 0 1px 0 rgba(255,255,255,.3)}
.fc-bar.sel{outline:2px solid #fff;outline-offset:2px;z-index:4}
.fc-bar b{font-weight:900;letter-spacing:.02em;position:relative}
.fc-bar span{opacity:.88;overflow:hidden;text-overflow:ellipsis;position:relative}
.fc-bar .crown{margin-left:auto;font-size:11px;opacity:.9;position:relative}
.fc-bar.from-prev{border-top-left-radius:2px;border-bottom-left-radius:2px;border-left:3px dashed rgba(255,255,255,.55)}
.fc-bar.to-next{border-top-right-radius:2px;border-bottom-right-radius:2px;border-right:3px dashed rgba(255,255,255,.55)}
.fc-bar.ghost{background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--ac) 20%,transparent) 0 8px,color-mix(in srgb,var(--ac) 9%,transparent) 8px 16px);
  border:1.5px dashed color-mix(in srgb,var(--ac) 80%,#fff 10%);box-shadow:none;color:color-mix(in srgb,var(--ac) 40%,#fff)}
.fc-bar.ghost::before{display:none}
.fc-bar.ghost .tag{font-size:9px;letter-spacing:.12em;text-transform:uppercase;border:1px solid currentColor;border-radius:5px;padding:1px 4px;font-weight:800}
.fc-bar.ghost.live{border-style:solid;border-color:#4ade80;color:#fff}
.fc-bar.ghost.live .tag{background:#4ade80;color:#052e16;border-color:#4ade80}
.fc-bar.is-now{box-shadow:0 0 0 2px rgba(74,222,128,.75),0 8px 26px color-mix(in srgb,var(--ac) 50%,transparent)}

.fc-nowline{position:absolute;top:52px;bottom:0;width:2px;margin-left:-1px;z-index:5;pointer-events:none;
  background:linear-gradient(180deg,#4ade80,rgba(74,222,128,.15));box-shadow:0 0 12px #4ade80;animation:fcFade .6s .7s both}
.fc-nowline::before{content:"NOW";position:absolute;top:-1px;left:50%;transform:translate(-50%,-100%);background:#4ade80;color:#052e16;
  font-size:9.5px;font-weight:900;letter-spacing:.1em;padding:2px 6px;border-radius:6px;box-shadow:0 0 14px rgba(74,222,128,.7)}
.fc-nowline::after{content:"";position:absolute;bottom:-4px;left:50%;width:10px;height:10px;margin-left:-5px;border-radius:50%;background:#4ade80;
  animation:fcPing 1.8s infinite}
.fc-empty{grid-column:1/-1;padding:38px 20px;text-align:center;color:var(--fc-dim);border-top:1px solid var(--fc-line);font-size:14px}

.fc-detail{margin-top:14px;min-height:20px}
.fc-dcard{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;padding:16px 18px;border-radius:16px;
  border:1px solid color-mix(in srgb,var(--ac) 45%,transparent);
  background:radial-gradient(120% 140% at 0% 0%,color-mix(in srgb,var(--ac) 22%,transparent),rgba(255,255,255,.02) 60%);
  animation:fcPop .45s cubic-bezier(.2,.9,.25,1.2) both}
.fc-dcard .big{font-size:40px;filter:drop-shadow(0 0 14px var(--ac))}
.fc-dcard small{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--fc-dim);font-weight:800}
.fc-dcard h4{margin:2px 0 4px;font-size:20px}
.fc-dcard p{margin:0;font-size:13px;color:var(--fc-dim);line-height:1.5}
.fc-dcard p b{color:var(--fc-ink)}
.fc-nb{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.fc-nb button{font-size:12px;border-radius:9px;border:1px solid var(--fc-line);background:rgba(255,255,255,.05);color:var(--fc-ink);padding:5px 9px;cursor:pointer}
.fc-nb button:hover{border-color:rgba(255,255,255,.3)}
.fc-open{white-space:nowrap;text-decoration:none;color:#fff;font-weight:800;font-size:13px;padding:9px 13px;border-radius:11px;
  background:linear-gradient(135deg,color-mix(in srgb,var(--ac) 80%,#000),color-mix(in srgb,var(--ac) 45%,#1a0f2e));border:1px solid rgba(255,255,255,.18)}
.fc-hint{font-size:12.5px;color:var(--fc-dim);text-align:center;padding:8px}

.fc-chrono{margin-top:22px}
.fc-sec{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--fc-dim);font-weight:800;margin:0 0 10px}
.fc-track{overflow-x:auto;padding:30px 24px 14px;border-radius:16px;border:1px solid var(--fc-line);background:rgba(8,5,16,.35);scrollbar-width:thin}
.fc-rail{display:flex;align-items:flex-start;gap:0;position:relative;width:max-content}
.fc-rail::before{content:"";position:absolute;left:20px;right:20px;top:21px;height:2px;
  background:linear-gradient(90deg,#7d4cff,#ff4ce6,#ffc94a);transform-origin:left;animation:fcGrow 1.4s cubic-bezier(.3,.8,.2,1) both;opacity:.6}
.fc-node{position:relative;width:76px;flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;
  background:none;border:0;color:var(--fc-ink);padding:0;animation:fcNode .5s cubic-bezier(.2,.9,.3,1.4) both}
.fc-node .dot{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-size:19px;position:relative;z-index:1;
  background:radial-gradient(circle at 35% 30%,color-mix(in srgb,var(--ac) 70%,#fff 20%),var(--ac) 60%,color-mix(in srgb,var(--ac) 60%,#000));
  box-shadow:0 0 0 3px rgba(8,5,16,.9),0 0 16px color-mix(in srgb,var(--ac) 60%,transparent);transition:transform .25s}
.fc-node:hover .dot{transform:scale(1.14)}
.fc-node b{font-size:12px;font-weight:900}
.fc-node small{font-size:10px;color:var(--fc-dim);text-align:center;line-height:1.25}
.fc-node.ghost .dot{background:rgba(8,5,16,.9);border:2px dashed var(--ac);box-shadow:0 0 0 3px rgba(8,5,16,.9);filter:saturate(.7)}
.fc-node.ghost b,.fc-node.ghost small{opacity:.7}
.fc-node.is-now .dot{box-shadow:0 0 0 3px rgba(8,5,16,.9),0 0 0 6px #4ade80,0 0 24px #4ade80}
.fc-node.is-now::before{content:"NOW";position:absolute;top:-24px;font-size:9px;font-weight:900;letter-spacing:.1em;background:#4ade80;color:#052e16;padding:2px 6px;border-radius:6px}
.fc-node.sel .dot{transform:scale(1.18);box-shadow:0 0 0 3px rgba(8,5,16,.9),0 0 0 5px #fff,0 0 22px var(--ac)}
.fc-ymark{flex:0 0 auto;align-self:stretch;display:flex;flex-direction:column;align-items:center;padding:0 6px;position:relative;z-index:1}
.fc-ymark span{font-size:11px;font-weight:900;color:#fff;background:rgba(125,76,255,.35);border:1px solid rgba(155,109,255,.55);border-radius:8px;padding:3px 7px;margin-top:11px}
.fc-unplaced{margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:12.5px;color:var(--fc-dim)}
.fc-chip{border:1px dashed color-mix(in srgb,var(--ac) 70%,transparent);border-radius:999px;padding:4px 10px;color:var(--fc-ink)}

@keyframes fcGrow{from{transform:scaleX(0);opacity:.3}to{transform:scaleX(1);opacity:1}}
@keyframes fcShine{from{left:-45%}to{left:110%}}
@keyframes fcFade{from{opacity:0}to{opacity:1}}
@keyframes fcDrop{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
@keyframes fcPop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
@keyframes fcNode{from{opacity:0;transform:translateY(14px) scale(.6)}to{opacity:1;transform:none}}
@keyframes fcInNext{from{opacity:0;transform:translateX(42px);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}
@keyframes fcInPrev{from{opacity:0;transform:translateX(-42px);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}
@keyframes fcRollUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}
@keyframes fcRollDown{from{transform:translateY(-100%);opacity:0}to{transform:none;opacity:1}}
@keyframes fcPing{0%{box-shadow:0 0 0 0 rgba(74,222,128,.7)}70%{box-shadow:0 0 0 9px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}
@keyframes fcSpin{to{transform:rotate(360deg)}}
@keyframes fcBloom{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.12) rotate(14deg)}}
@keyframes fcSway{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(10deg)}}
@keyframes fcSnow{0%{opacity:0;transform:translate(0,0) rotate(0)}15%{opacity:.85}100%{opacity:0;transform:translate(10px,70px) rotate(180deg)}}
@keyframes fcPetal{0%{opacity:0;transform:translate(0,0) rotate(0)}15%{opacity:.85}50%{transform:translate(18px,34px) rotate(160deg)}100%{opacity:0;transform:translate(-6px,72px) rotate(320deg)}}
@keyframes fcRise{0%{opacity:0;transform:translateY(0) scale(.5)}30%{opacity:.9}100%{opacity:0;transform:translateY(-64px) scale(1.1)}}
@keyframes fcLeaf{0%{opacity:0;transform:translate(0,0) rotate(0)}15%{opacity:.9}35%{transform:translate(-14px,24px) rotate(-70deg)}65%{transform:translate(12px,46px) rotate(60deg)}100%{opacity:0;transform:translate(-4px,74px) rotate(200deg)}}
@media (max-width: 640px){
  .fc-dcard{grid-template-columns:1fr;gap:10px}
  .fc-dcard .big{font-size:30px}
  .fc-open{justify-self:start}
  .fc-card{max-width:none;flex:1 1 100%}
  .fc-board{grid-template-columns:104px 1fr}
}
@media (prefers-reduced-motion: reduce){
  .fc *,.fc *::before,.fc *::after{animation:none !important;transition:none !important}
}`;
  document.head.appendChild(st);
}

function quarterHeaders() {
  return QUARTERS.map(q => {
    const bits = Array.from({ length: 7 }, (_, i) => {
      const left = 8 + ((i * 37 + 11) % 86);
      const delay = ((i * 1.37) % 6).toFixed(2);
      const size = 6 + (i % 3) * 2;
      return `<i class="fc-bit" style="left:${left}%;width:${size}px;height:${size}px;animation-delay:${delay}s">${BIT[q.slot]}</i>`;
    }).join('');
    return `<div class="fc-qh ${q.slot}">${bits}<span class="ico">${SVG[q.slot]}</span><b>${q.label}</b><small>${q.months}</small></div>`;
  }).join('');
}

function pct(t, y) { return ((t - yStart(y)) / (yEnd(y) - yStart(y))) * 100; }

function lanesFor(year) {
  const { all } = state.model;
  const a = yStart(year);
  const b = yEnd(year);
  const visible = all.filter(r => r.start.getTime() < b && r.finale.getTime() + DAY > a);
  const lanes = [];
  for (const format of Object.keys(SHOWS)) {
    const mine = visible.filter(r => r.format === format).sort((x, y) => x.start - y.start);
    if (!mine.length) continue;
    // A show can overlap itself (a long fall season into a winter one), so it
    // gets as many rows as it needs rather than drawing one bar over another.
    const rows = [];
    for (const r of mine) {
      const row = rows.find(rr => rr[rr.length - 1].finale.getTime() + 7 * DAY <= r.start.getTime());
      if (row) row.push(r); else rows.push([r]);
    }
    rows.forEach((row, i) => lanes.push({ format, show: SHOWS[format], runs: row, first: i === 0 }));
  }
  return lanes;
}

function barHtml(r, year, i) {
  const a = yStart(year);
  const b = yEnd(year);
  const s = Math.max(r.start.getTime(), a);
  const e = Math.min(r.finale.getTime() + DAY, b);
  const left = pct(s, year);
  const width = Math.max(1.2, pct(e, year) - left);
  const weeks = Math.max(1, (e - s) / (7 * DAY));
  const cls = ['fc-bar'];
  if (r.start.getTime() < a) cls.push('from-prev');
  if (r.finale.getTime() + DAY > b) cls.push('to-next');
  if (r.projected) cls.push('ghost');
  if (r.live || r.started) cls.push('live');
  if (state.model.nowRun === r) cls.push('is-now');
  if (state.selected === r.key) cls.push('sel');
  // A bar clipped to a few weeks at the edge of a year has room for its label
  // and nothing else; the title and winner are in the tooltip and the card.
  const roomy = width >= 14;
  const winner = roomy && !r.projected && r.season.winner?.name ? `<span class="crown">👑 ${esc(r.season.winner.name)}</span>` : '';
  const sub = width >= 11 && r.sub ? `<span>${esc(r.sub)}</span>` : '';
  const tip = `${r.short}${r.sub ? ' · ' + r.sub : ''} — ${airDateLabel(r.start)} to ${airDateLabel(r.finale)}${r.projected ? ` (${tagOf(r)})` : ''}`;
  return `<button type="button" class="${cls.join(' ')}" data-key="${esc(r.key)}" title="${esc(tip)}"
    style="left:${left}%;width:${width}%;--ac:${r.show.accent};--wk:calc(100% / ${weeks.toFixed(2)});animation-delay:${120 + i * 90}ms">
    <b>${esc(r.short)}</b>${r.projected ? (width >= 8 ? `<span class="tag">${tagOf(r)}</span>` : '') : sub}${winner}</button>`;
}

function boardHtml(year) {
  const lanes = lanesFor(year);
  const now = state.model.now;
  const nowIn = now && now.getUTCFullYear() === year;
  const mine = window.__SHOWS?.current || null;
  const months = MONTHS.map((m, i) => `<div class="fc-m${nowIn && now.getUTCMonth() === i ? ' cur' : ''}" style="animation-delay:${i * 35}ms">${m}</div>`).join('');
  let n = 0;
  const gutter = lanes.map((l, i) => `<div class="fc-lanelabel${l.format === mine ? ' mine' : ''}" style="--ac:${l.show.accent};animation-delay:${i * 70}ms">`
    + (l.first ? `<span class="em">${l.show.emoji}</span><span>${esc(l.show.name)}</span>` : '') + '</div>').join('');
  const rows = lanes.map(l => `<div class="fc-lane">${l.runs.map(r => barHtml(r, year, n++)).join('')}</div>`).join('');
  return `<div class="fc-gutter"><div class="fc-corner">${lanes.length ? 'Show' : ''}</div>${gutter}</div>
    <div class="fc-time">
      ${QUARTERS.map(q => `<div class="fc-q ${q.slot}"></div>`).join('')}
      <div class="fc-mgrid">${MONTHS.map(() => '<i></i>').join('')}</div>
      <div class="fc-qrow">${quarterHeaders()}</div>
      <div class="fc-mrow">${months}</div>
      ${rows}
      ${nowIn ? `<div class="fc-nowline" style="left:${pct(now.getTime(), year)}%" title="Now — the ${esc(airDateLabel(now))} finale of ${esc(state.model.nowRun.short)}"></div>` : ''}
    </div>
    ${lanes.length ? '' : `<div class="fc-empty">Nothing aired in ${year}.</div>`}`;
}

function yearsHtml() {
  const { minYear, maxYear, all, now } = state.model;
  const out = [];
  for (let y = minYear; y <= maxYear; y++) {
    const dots = all.filter(r => r.start.getUTCFullYear() === y)
      .map(r => `<em class="${r.projected ? 'ghost' : ''}" style="--c:${r.show.accent}"></em>`).join('');
    const isNow = now && now.getUTCFullYear() === y;
    out.push(`<button type="button" class="fc-pill${y === state.year ? ' on' : ''}${isNow ? ' has-now' : ''}" data-year="${y}">${y}<i>${dots}</i></button>`);
  }
  return out.join('');
}

function neighbours(r) {
  const order = state.model.all;
  const i = order.indexOf(r);
  return { prev: i > 0 ? order[i - 1] : null, next: i >= 0 && i < order.length - 1 ? order[i + 1] : null };
}

function detailHtml() {
  const r = state.model.all.find(x => x.key === state.selected);
  if (!r) return '<div class="fc-hint">Click any season to see when it ran and what came before and after it.</div>';
  const { prev, next } = neighbours(r);
  const night = NIGHTS[r.show.airNight ?? 5] || '';
  const isNow = state.model.nowRun === r;
  const status = r.live ? `Playing now · ${r.aired} of ${r.count} episodes aired · not exported yet`
    : r.started ? 'Started · its date is fixed · not exported yet'
      : r.possible ? 'Possible · not scheduled yet' : r.projected ? 'Projected · not scheduled yet' : isNow ? 'Latest to air · the franchise is here' : 'Aired';
  const stars = r.show.allStars;
  const which = r.season.allStars && stars ? `${stars.label} ${r.season.asNumber || ''}` : `Season ${r.season.seasonNumber}`;
  const starSlots = (stars?.airSlots || []).map(s => s[0].toUpperCase() + s.slice(1)).join(' and ');
  const winner = r.season.winner?.name
    ? ` · Won by <b>${esc(r.season.winner.name)}</b>${r.season.winner.runnerUp ? ` over ${esc(r.season.winner.runnerUp)}` : ''}` : '';
  const home = (r.show.airSlots || []).map(s => s[0].toUpperCase() + s.slice(1)).join(' and ');
  const booked = r.booked ? "<p>Kept in 2027 by the one-time exception: it was on the calendar before the rule that a season can't premiere before the latest finale.</p>" : '';
  const why = !r.projected ? ''
    : r.live ? `<p>Being played in the simulator. Its date is fixed once it has aired an episode, so exporting another season first won't move it. It's scheduled for real once it's exported.</p>${booked}`
    : r.started ? `<p>Started in the simulator and saved; its date was fixed when it started. It's scheduled for real once it's exported.</p>${booked}`
    : r.possible
      ? `<p>A possible ${esc(r.show.name)} ${esc(stars.label)}. ${r.season.asNumber === 1
        ? `The first can follow ${esc(r.show.name)} ${esc(stars.after)}, in ${esc(starSlots)}`
        : `One a year, in ${esc(starSlots)}`}, after that winter's season has crowned its winner. It isn't scheduled; play it and it lands here.</p>`
    : r.season.seasonNumber === 1
      ? `<p>Not played yet. ${esc(r.show.name)} airs in ${esc(home || 'its slot')}, and never before the latest finale, so its first season lands here unless something else is exported first. The episode count is a placeholder until then.</p>${booked}`
      : `<p>Where the next season lands${home ? ` (${esc(r.show.name)} airs in ${esc(home)})` : ' if the show keeps its rhythm'}, never before the latest finale: the same rule the export uses to date a new season. It isn't scheduled yet.</p>${booked}`;
  const nb = (label, x) => x ? `<button type="button" data-key="${esc(x.key)}">${label} ${x.show.emoji} ${esc(x.short)}${x.projected ? ` (${tagOf(x)})` : ''}</button>` : '';
  const open = r.projected ? '' : `<a class="fc-open" href="season_ref.html?season=${encodeURIComponent(r.ref)}">Open season →</a>`;
  return `<div class="fc-dcard" style="--ac:${r.show.accent}">
    <div class="big">${r.show.emoji}</div>
    <div>
      <small>${esc(r.show.name)} · ${esc(which)} · ${status}</small>
      <h4>${esc(r.season.title || r.short)}</h4>
      <p><b>${esc(airLabel(r.season))}</b> · ${esc(airDateLabel(r.start))} → ${esc(airDateLabel(r.finale))} · ${r.lengthGuessed ? '~' : ''}${r.count} episodes${lengthWhy(r)} on ${night}${winner}</p>
      ${why}
      <div class="fc-nb">${nb('← Before:', prev)}${nb('After:', next)}</div>
    </div>
    ${open}
  </div>`;
}

function chronoHtml() {
  let lastYear = null;
  const out = [];
  state.model.all.forEach((r, i) => {
    const y = r.start.getUTCFullYear();
    if (y !== lastYear) { out.push(`<div class="fc-ymark"><span>${y}</span></div>`); lastYear = y; }
    const cls = ['fc-node'];
    if (r.projected) cls.push('ghost');
    if (state.model.nowRun === r) cls.push('is-now');
    if (state.selected === r.key) cls.push('sel');
    out.push(`<button type="button" class="${cls.join(' ')}" data-key="${esc(r.key)}" style="--ac:${r.show.accent};animation-delay:${Math.min(i * 45, 1200)}ms"
      title="${esc(r.season.title || r.short)}"><span class="dot">${r.show.emoji}</span><b>${esc(r.short)}</b>
      <small>${esc(airLabel(r.season))}${r.projected ? `<br>${tagOf(r)}` : ''}</small></button>`);
  });
  return `<div class="fc-rail">${out.join('')}</div>`;
}

function cardsHtml() {
  const { nowRun, ghosts } = state.model;
  // The earliest projected premiere, even one that lands before the current
  // season's finale: shows overlap, and the next to start is still next.
  const upNext = ghosts[0];
  const card = (cls, r, label, line) => r ? `<div class="fc-card ${cls}" data-key="${esc(r.key)}" style="--ac:${r.show.accent}">
    <small>${label}</small><b>${r.show.emoji} ${esc(r.season.title || r.short)}</b><span>${line}</span></div>` : '';
  return card('now', nowRun, 'Now', nowRun ? `${esc(airLabel(nowRun.season))} · finale ${esc(airDateLabel(nowRun.finale))}` : '')
    + card('next', upNext, upNext ? `Up next · ${tagOf(upNext)}` : '', upNext ? `${esc(airLabel(upNext.season))} · premieres ${esc(shortDate(upNext.start))}` : '');
}

function setYear(year, dir = 0) {
  const { minYear, maxYear } = state.model;
  year = Math.max(minYear, Math.min(maxYear, year));
  if (year === state.year && dir) return;
  state.year = year;
  const root = state.root;
  const yr = root.querySelector('.fc-year');
  yr.innerHTML = `<span style="animation:${dir > 0 ? 'fcRollUp' : dir < 0 ? 'fcRollDown' : 'fcFade'} .45s cubic-bezier(.2,.8,.2,1)">${year}</span>`;
  root.querySelector('[data-step="-1"]').disabled = year <= minYear;
  root.querySelector('[data-step="1"]').disabled = year >= maxYear;
  root.querySelector('.fc-years').innerHTML = yearsHtml();
  const board = root.querySelector('.fc-board');
  board.innerHTML = boardHtml(year);
  board.classList.remove('in-next', 'in-prev');
  if (dir && !reduced()) { void board.offsetWidth; board.classList.add(dir > 0 ? 'in-next' : 'in-prev'); }
  root.querySelector(`.fc-pill[data-year="${year}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced() ? 'auto' : 'smooth' });
}

function select(key, { jump = true, scrollRail = true } = {}) {
  const r = state.model.all.find(x => x.key === key);
  if (!r) return;
  state.selected = key;
  const y = r.start.getUTCFullYear();
  if (jump && y !== state.year) setYear(y, y > state.year ? 1 : -1);
  else state.root.querySelectorAll('.fc-bar').forEach(b => b.classList.toggle('sel', b.dataset.key === key));
  state.root.querySelectorAll('.fc-node').forEach(n => n.classList.toggle('sel', n.dataset.key === key));
  state.root.querySelector('.fc-detail').innerHTML = detailHtml();
  if (scrollRail) centreNode(key);
}

function centreNode(key) {
  const track = state.root.querySelector('.fc-track');
  const node = track?.querySelector(`.fc-node[data-key="${CSS.escape(key)}"]`);
  if (!node || !track.clientWidth) return;
  track.scrollTo({ left: node.offsetLeft - track.clientWidth / 2 + node.offsetWidth / 2, behavior: reduced() ? 'auto' : 'smooth' });
}

function build(root) {
  const { unplaced } = state.model;
  root.innerHTML = `<div class="fc">
    <header class="fc-head">
      <div>
        <div class="fc-eyebrow">Franchise calendar</div>
        <div class="fc-yearline">
          <button type="button" class="fc-arrow" data-step="-1" aria-label="Previous year">‹</button>
          <h3 class="fc-year" aria-live="polite"></h3>
          <button type="button" class="fc-arrow" data-step="1" aria-label="Next year">›</button>
        </div>
        <div class="fc-deck">Every show on one calendar. Each bar runs from premiere to finale, one episode a week on the night that show airs. Dashed bars are projected, not scheduled.</div>
      </div>
      <div class="fc-cards">${cardsHtml()}</div>
    </header>
    <nav class="fc-years" aria-label="Years"></nav>
    <div class="fc-board-wrap"><div class="fc-board"></div></div>
    <div class="fc-detail"></div>
    <section class="fc-chrono">
      <div class="fc-sec">Every season, in the order it aired</div>
      <div class="fc-track">${chronoHtml()}</div>
    </section>
    ${unplaced.length ? `<div class="fc-unplaced"><span>Not on the calendar yet:</span>${unplaced.map(u =>
      `<span class="fc-chip" style="--ac:${u.show.accent}">${u.show.emoji} ${esc(u.show.name)}</span>`).join('')}</div>` : ''}
  </div>`;

  root.addEventListener('click', e => {
    const step = e.target.closest('[data-step]');
    if (step) return setYear(state.year + Number(step.dataset.step), Number(step.dataset.step));
    const pill = e.target.closest('[data-year]');
    if (pill) { const y = Number(pill.dataset.year); return setYear(y, Math.sign(y - state.year)); }
    const keyed = e.target.closest('[data-key]');
    if (keyed) select(keyed.dataset.key);
  });
  document.addEventListener('keydown', e => {
    if (root.closest('.hidden') || !root.offsetParent) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
    if (e.key === 'ArrowLeft') setYear(state.year - 1, -1);
    if (e.key === 'ArrowRight') setYear(state.year + 1, 1);
  });
}

/**
 * Draw the calendar into `root`. Safe to call on every tab open: the first call
 * loads and builds, later ones replay the year's entrance.
 */
export async function mountCalendar(root) {
  if (!root) return;
  css();
  state.root = root;
  if (!state.built) {
    state.built = true;
    root.innerHTML = '<div class="fc-hint">Loading the franchise calendar…</div>';
    const seasons = await loadSeasons();
    // The season in the simulator, and the ones started and saved: their bars
    // sit at the date they fixed, tagged, instead of the rule's guess.
    const saved = await readSavedGame().catch(() => null);
    const rows = seasons.map(s => ({ ...s, format: s.format || DEFAULT_FORMAT }));
    const live = saved ? liveSeason(saved.gs, saved.cfg, rows) : null;
    // A season cast but not started yet: its bar runs as long as its cast.
    const setup = setupSeason(saved?.gs || null, saved?.cfg || readConfig(), rows);
    state.model = buildModel(seasons, { live, setup, locks: readLocks() });
    if (!state.model.all.length) {
      root.innerHTML = '<div class="fc-hint">No season has an air date yet. Add <code>airYear</code> and <code>airSlot</code> to seasons_database.json.</div>';
      return;
    }
    build(root);
    state.selected = state.model.nowRun?.key || null;
    setYear((state.model.now || state.model.all[0].start).getUTCFullYear());
    root.querySelector('.fc-detail').innerHTML = detailHtml();
    requestAnimationFrame(() => state.selected && centreNode(state.selected));
    return;
  }
  if (state.model?.all.length) setYear(state.year);
}
