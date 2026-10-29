// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/screens.js — a Big Brother week as a TV programme (Phase 2)
// ══════════════════════════════════════════════════════════════════════
//
// Spec 2026-10-01 §4.7, the Circle's pattern (js/vp-ci/screens.js): one screen
// per scene or ceremony from steps.js, one click per line, the script under
// the stage lighting up line by line, a sidebar that shows only what has
// played. The legacy screens this replaces are the week's core loop and its
// House Life; every TWIST screen the legacy builder draws is kept, placed after
// the part of the week it belongs to (spec decision D1).
//
// Switch back to the old screens: localStorage 'bb-classic-vp' = '1'.
import { bbWeekSteps, REPLACED, ANCHOR_OF, houseLifeMode } from './steps.js';
import { voiceTick, voiceSay, voicesOn, bbxVoices } from './voices.js';
import { bbVoiceLine, bbVoiceStop, bbVoicedLines } from './voicing.js';
import { stageHtml, camStyle, esc, escT, col, img, eyeSvg, SEASON_DIR } from './stage.js';
import { BBX_CSS, BBX_FONTS } from './style.js';
import { BBX_SUITE_CSS } from './style-suite.js';
import { BBX_CHAIN_CSS } from './style-chain.js';
import { BBX_HUNT_CSS } from './style-hunt.js';
import { BBX_PX_CSS } from './style-px.js';
import { BBX_DUO_CSS } from './style-duo.js';
import { BBX_CAMP_CSS } from './style-camp.js';
import { BBX_WILD_CSS } from './style-wild.js';
import { BBX_SPOWER_CSS } from './style-spower.js';
import { BBX_CAPSULE_CSS } from './style-capsule.js';
import { BBX_INTERRO_CSS } from './style-interro.js';
import { BBX_WHACK_CSS } from './style-whack.js';
import { bedFor, playStep } from './sound.js';
import { intelHtml, INTEL_CSS } from './intel.js';
import { BBX_COMP_CSS } from './comp-field.js';
import { SS_CSS, ssDossierOf, ssSideHtml } from './ss-hud.js';
import { titleScreen } from './titles.js';
import { ssTitleScreen } from './ss-titles.js';
import { ssPartOf, SS_PART_LABEL } from './ss-episode.js';
import { seasonId } from '../shows.js';
import { seasonFormat } from '../core.js';
import { liveGL } from '../vp-td-ep/glplate.js';
import { conversationsOf, nextConv, houseMapHtml, houseFeedHtml, HM_CSS } from './housemap.js';

// House Life plays as the house map by default (the user, 2026-10-13: "start the house map");
// the linear segment is one click away and remembered per viewer
const mapOn = () => { try { return localStorage.getItem('bb-map') !== 'linear'; } catch { return true; } };
const newMap = S => {
  // move-in night plays on the map too (the user, 2026-10-14: "arrival isn't in the map"): the stage, then each group's way in
  const convs = (S.kind === 'houselife' || S.kind === 'movein') && mapOn() ? conversationsOf(S) : [];
  return convs.length > 1 ? { convs, watched: new Set(), mode: 'map', level: 'island', window: null, zone: null, cur: null, end: null } : null;
};
const mapHtml = (uid, R) => {
  const S = R.screens[R.si];
  return R.map.mode === 'feed' ? houseFeedHtml(uid, S, R.map, R.map.zone, R.o?.season) : houseMapHtml(uid, S, R.map);
};

// where the Intel drawer is in the week: the screen's stretch start, and whether the screen has played out
const intelAt = R => { const S = R.screens?.[R.si]; return S ? { start: S.snapStart || null, atEnd: R.idx >= (S.steps?.length || 0) - 1 } : null; };
const reg = () => (typeof window !== 'undefined' ? (window._bbx ||= {}) : (globalThis._bbx ||= {}));

// ── what this viewer has watched, kept across closing the viewer and a reload ──
// The user, 2026-10-24: "the episode keep returning to the first frame even after i skip" and "it
// should persist read conversations even after i close". Per episode: the screen it was on, and per
// screen the line reached and the house-map conversations watched. A per-viewer convenience in
// localStorage (a private window simply starts every episode from the top).
const WATCH_KEY = 'bb-watched';
const WATCH_MAX = 120;   // episodes kept; the oldest go first
const watchAll = () => { try { return JSON.parse(localStorage.getItem(WATCH_KEY) || '{}') || {}; } catch { return {}; } };
function watchSave(fp, fn) {
  if (!fp) return;
  try {
    const all = watchAll(); const e = all[fp] || { s: {} }; e.s ||= {};
    fn(e); e.t = Date.now(); all[fp] = e;
    const keys = Object.keys(all);
    if (keys.length > WATCH_MAX) keys.sort((a, b) => (all[a].t || 0) - (all[b].t || 0)).slice(0, keys.length - WATCH_MAX).forEach(k => delete all[k]);
    localStorage.setItem(WATCH_KEY, JSON.stringify(all));
  } catch { /* per-viewer convenience */ }
}
const remember = R => watchSave(R?.fp, e => { e.s[R.si] = { i: R.idx, w: R.map ? [...R.map.watched] : [] }; });
// An episode is the same episode while its screens are: a re-run season, or the other House Life
// view, is a different set of screens and starts from the top.
const hashOf = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);
const episodeKey = (row, steps) => {
  const sc = (typeof globalThis !== 'undefined' && globalThis.seasonConfig) || {};
  return `${seasonId(seasonFormat(sc), sc.seasonNumber || row.seasonNumber || 1)}|${row.num}|${hashOf(steps.map(S => `${S.id}:${S.steps?.length}:${S.steps?.[0]?.t || ''}`).join('|'))}`;
};
let lastBuilt = null;   // the Big Brother episode the viewer last built: its key and its screens' ids
/** The screen to open this episode on: where the viewer left it (vp-ui.js openVisualPlayer). */
export function bbxResumeAt(row) {
  if (!lastBuilt || lastBuilt.num !== row?.num) return null;
  const at = watchAll()[lastBuilt.fp]?.at;
  // an episode watched to its closing titles opens at the top again
  return at && lastBuilt.ids.includes(at) && at !== 'bb-closing' ? at : null;
}
// a screen kept from before: the line it reached, and the conversations watched on its map
function restoreInto(R, kept) {
  const n = R.screens[R.si]?.steps?.length || 0;
  const i = Math.max(-1, Math.min(n - 1, Number.isInteger(kept?.i) ? kept.i : -1));
  if (R.map) {
    const ks = new Set(R.map.convs.map(c => c.k));
    R.map.watched = new Set((kept?.w || []).filter(k => ks.has(k)));
    const c = i >= 0 ? R.map.convs.find(x => i >= x.from && i <= x.to) : null;
    // back inside the conversation it was left in; one already watched, or none, opens on the map
    if (c && !R.map.watched.has(c.k)) { Object.assign(R.map, { mode: 'play', cur: c.k, end: c.to }); R.idx = i; } else R.idx = -1;
  } else R.idx = i;
}
const SHELL_CSS = `
.bbx .bbx-feed{margin-top:14px;border-top:1px solid rgba(34,225,255,.25);padding-top:10px}
.bbx .bbx-feed-h{font:700 11px 'Chakra Petch',system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#22e1ff;margin:0 0 8px;cursor:pointer}

.bbx{--bbx-line:rgba(255,255,255,.12);color:#e8eefb;font-family:Archivo,system-ui,sans-serif;max-width:1180px;margin:0 auto}
.bbx .bbx-stage{position:relative;aspect-ratio:16/9;container-type:inline-size;overflow:hidden;border-radius:14px;background:#03050a;cursor:pointer;user-select:none;isolation:isolate;box-shadow:0 0 0 1px rgba(34,225,255,.18),0 30px 70px -20px rgba(0,20,60,.55)}
.bbx .bbx-ctrl{display:flex;gap:6px;align-items:center;margin:10px 0 0;flex-wrap:wrap}
.bbx .bbx-btn{border:1px solid var(--bbx-line);background:#0d1220;color:#e8eefb;border-radius:8px;padding:8px 12px;font:600 11px 'Chakra Petch',monospace;letter-spacing:1.3px;text-transform:uppercase;cursor:pointer}
.bbx .bbx-btn.main{background:#22e1ff;color:#001018;border-color:#22e1ff}
.bbx .bbx-btn.on{border-color:#22e1ff;color:#22e1ff}
.bbx .bbx-count{margin-left:auto;font:600 10.5px 'Chakra Petch',monospace;color:#7d89a3;letter-spacing:1.4px}
.bbx .bbx-under{display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:12px;margin-top:12px}
@media(max-width:900px){.bbx .bbx-under{grid-template-columns:minmax(0,1fr)}}
.bbx .bbx-script{border:1px solid var(--bbx-line);background:#0d1220;border-radius:10px;padding:12px 14px;max-height:240px;overflow:auto}
.bbx .bbx-ln{display:none;grid-template-columns:110px 1fr;gap:10px;font-size:13.5px;line-height:1.5;padding:3px 0;color:#9aa6c0}
.bbx .bbx-ln.vis{display:grid}.bbx .bbx-ln.now{color:#fff}
.bbx .bbx-who{font-weight:800;text-transform:uppercase;letter-spacing:.4px;font-size:12px;color:#fff}
.bbx .bbx-who.dr{color:#f5c542}.bbx .bbx-who.bb{color:#22e1ff}.bbx .bbx-who.cc{color:#7d89a3;font:600 10px 'Chakra Petch',monospace;letter-spacing:1.4px;padding-top:3px}
.bbx .bbx-empty{font-size:12.5px;color:#7d89a3;font-style:italic}
.bbx .bbx-side{display:flex;flex-direction:column;gap:10px}
.bbx .bbx-panel{border:1px solid var(--bbx-line);background:#0d1220;border-radius:10px;padding:11px 12px}
.bbx .bbx-panel h4{margin:0 0 8px;font:600 10px 'Chakra Petch',monospace;letter-spacing:2px;color:#7d89a3;text-transform:uppercase}
.bbx .bbx-row{display:flex;align-items:center;gap:8px;padding:3px 0;font-size:13px}
.bbx .bbx-row b{font-weight:800;text-transform:uppercase;font-size:12.5px}
.bbx .bbx-tag{margin-left:auto;font:700 9px 'Chakra Petch',monospace;letter-spacing:1.2px;padding:2px 6px;border-radius:4px;text-transform:uppercase}
.bbx .bbx-tag.hoh{background:#f5c542;color:#2a1d00}.bbx .bbx-tag.nom{background:#ff3355;color:#fff}.bbx .bbx-tag.veto{border:1px solid #d9a520;color:#d9a520}.bbx .bbx-tag.out{background:#1f2533;color:#7d89a3}
.bbx .bbx-mini{width:26px;height:26px;border-radius:7px;overflow:hidden;flex:none;position:relative;background:var(--c)}
.bbx .bbx-mini img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.bbx .bbx-pend{font-size:12px;color:#7d89a3;font-style:italic}
.bbx .bbx-btn.bbx-voices:not(.on){opacity:.5;text-decoration:line-through}
.bbx .bbx-jump{width:74px;margin-left:8px;padding:6px 8px;border-radius:7px;border:1px solid var(--bbx-line,#273049);background:#0d1220;color:#e8ecf6;font:600 12px 'Chakra Petch',monospace}
.bbx .bbx-ln{cursor:pointer}.bbx .bbx-ln:hover{background:rgba(34,225,255,.06)}
.bbx .bbx-tally{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}
.bbx .bbx-tal{font:600 12px Archivo,sans-serif;color:#c7d0e4;background:#151c2e;border-radius:6px;padding:3px 8px}
.bbx .bbx-tal b{font:700 15px 'Chakra Petch',monospace;color:#ff6b82;margin-right:3px}
.bbx .bbx-chain{font-size:11px;line-height:1.45;color:#9aa6c0;margin:0 0 6px 30px}
.bbx .bbx-chain i{color:#22e1ff;font-style:normal}
.bbx .bbx-why .bbx-wl{font-size:12.5px;line-height:1.45;color:#c7d0e4;padding:3px 0;border-bottom:1px solid rgba(125,137,163,.15)}
.bbx .bbx-why .bbx-wl:first-of-type{color:#fff;font-weight:600}
.bbx .bbx-why .bbx-wl:last-child{border-bottom:0}
#visual-player.bbx-tv .bbx .bbx-under{display:none}

/* ── the player (the user, 2026-10-15: "a media player for the screen we're in... auto mode with speed... don't
   remove the important buttons like Intel") ── */
.bbx .bbx-screen{position:relative}
.bbx .bbx-bar{display:flex;align-items:center;gap:6px;margin:8px 0 0;padding:6px 8px;border-radius:10px;background:#0b101c;border:1px solid var(--bbx-line)}
.bbx .bbx-bar button{flex:none;border:0;background:none;color:#dbe6f7;font:600 12px 'Chakra Petch',monospace;letter-spacing:1px;padding:6px 8px;border-radius:7px;cursor:pointer;line-height:1}
.bbx .bbx-bar button:hover{background:rgba(255,255,255,.08)}
.bbx .bbx-bar button.on{color:#22e1ff}
.bbx .bbx-bar .bbx-play{width:38px;height:32px;font-size:15px;background:#22e1ff;color:#001018}
.bbx .bbx-bar .bbx-play:hover{background:#5ee9ff}
.bbx .bbx-bar .bbx-play.on{color:#001018;background:#ffd166}
.bbx .bbx-bar .bbx-ico{font-size:18px;min-width:30px}
.bbx .bbx-track{position:relative;flex:1;min-width:80px;height:22px;display:flex;align-items:center}
.bbx .bbx-seek{width:100%;margin:0;accent-color:#22e1ff;cursor:pointer;position:relative;z-index:1;background:transparent}
.bbx .bbx-ticks{position:absolute;left:7px;right:7px;top:50%;height:10px;transform:translateY(-50%);pointer-events:none}
.bbx .bbx-ticks i{position:absolute;top:0;width:2px;height:10px;margin-left:-1px;background:rgba(255,209,102,.75);border-radius:1px}
.bbx .bbx-bar .bbx-play svg,.bbx .bbx-bar .bbx-ico svg{display:block;margin:0 auto}
.bbx .bbx-seek{height:22px}
.bbx .bbx-tip{position:absolute;bottom:26px;transform:translateX(-50%);background:#0b101c;border:1px solid #2b3a58;border-radius:8px;padding:5px 9px;white-space:nowrap;font:600 11px Archivo,sans-serif;color:#dbe6f7;pointer-events:none;opacity:0;transition:opacity .12s;z-index:4;box-shadow:0 8px 20px rgba(0,0,0,.45)}
.bbx .bbx-tip.on{opacity:1}
.bbx .bbx-tip b{font:700 11.5px 'Chakra Petch',monospace;color:#22e1ff;margin-right:7px}
.bbx .bbx-tip span{color:#c7d0e4}
.bbx .bbx-bar .bbx-count{font:600 11px 'Chakra Petch',monospace;color:#9fb0c6;min-width:64px;text-align:center}
.bbx .bbx-bar .bbx-voices:not(.on){opacity:.5;text-decoration:line-through}
.bbx .bbx-bar .bbx-mvol{flex:none;display:flex;align-items:center;gap:5px;padding:0 4px;color:#dbe6f7;font-size:13px;cursor:pointer}
.bbx .bbx-bar .bbx-mvol input{width:76px;margin:0;accent-color:#22e1ff;cursor:pointer}
.bbx .bbx-bar .bbx-mvol.zero span{opacity:.5;text-decoration:line-through}
.bbx .bbx-bar .bbi-btn.on{color:#22e1ff}
#visual-player.bbx-tv .bbx .bbx-screen{position:fixed;inset:0;z-index:2147483000;background:#000;display:flex;align-items:center;justify-content:center}
#visual-player.bbx-tv .bbx .bbx-stage{width:min(100vw,calc(100vh * 16 / 9));border-radius:0;box-shadow:none}
#visual-player.bbx-tv .bbx .bbx-bar{position:absolute;left:0;right:0;bottom:0;margin:0;border:0;border-radius:0;padding:34px 22px 16px;background:linear-gradient(transparent,rgba(0,0,0,.88));transition:opacity .35s}
#visual-player.bbx-tv .bbx .bbi{top:14px;right:14px;z-index:5}
#visual-player.bbx-tv.bbx-idle .bbx .bbx-bar{opacity:0;pointer-events:none}
#visual-player.bbx-tv.bbx-idle .bbx .bbx-screen{cursor:none}
#visual-player.bbx-tv.bbx-idle .bbx .bbx-stage{cursor:none}
`;

const mini = n => `<span class="bbx-mini" style="--c:${col(n)}">${img(n)}</span>`;

// ── the player bar ──
// Where each scene of the screen starts: a House Life screen's conversations, else its scene markers.
function sceneStarts(S) {
  const steps = S?.steps || [];
  let at = [];
  try { at = (S.kind === 'houselife' || S.kind === 'movein') ? conversationsOf(S).map(c => c.from) : []; } catch { at = []; }
  if (!at.length) at = steps.map((st, i) => (st.scene ? i : -1)).filter(i => i > 0);
  return [...new Set(at)].filter(i => i >= 0 && i < steps.length).sort((a, b) => a - b);
}
const SPEEDS = [0.75, 1, 1.5, 2];
const speedOf = () => { try { const v = Number(localStorage.getItem('bb-speed')); return SPEEDS.includes(v) ? v : 1; } catch { return 1; } };
const speedLabel = v => `${v}×`;
// a press on the bar never takes the keyboard's focus (Space must stay play/pause, not "press that button again")
const svg = (d, w = 16) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" aria-hidden="true" fill="currentColor">${d}</svg>`;
const ICON = {
  play: svg('<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/>', 18),
  pause: svg('<rect x="5.5" y="4" width="4.5" height="16" rx="1.2"/><rect x="14" y="4" width="4.5" height="16" rx="1.2"/>', 18),
  prevScene: svg('<rect x="4" y="5" width="2.6" height="14" rx="1"/><path d="M20 5.6v12.8a.9.9 0 0 1-1.4.75L8.9 12.75a.9.9 0 0 1 0-1.5l9.7-6.4a.9.9 0 0 1 1.4.75z"/>'),
  nextScene: svg('<rect x="17.4" y="5" width="2.6" height="14" rx="1"/><path d="M4 5.6v12.8a.9.9 0 0 0 1.4.75l9.7-6.4a.9.9 0 0 0 0-1.5L5.4 4.85A.9.9 0 0 0 4 5.6z"/>'),
  back: svg('<path d="M15.5 5.5 8.5 12l7 6.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'),
  next: svg('<path d="M8.5 5.5 15.5 12l-7 6.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'),
  full: svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
};
function barHtml(uid, S, R) {
  const n = S.steps.length;
  const ticks = sceneStarts(S).map(i => `<i style="left:${n > 1 ? (i / (n - 1)) * 100 : 0}%"></i>`).join('');
  const b = (cls, act, title, label, id = '') => `<button type="button" class="${cls}"${id ? ` id="${id}"` : ''} onclick="${act}" title="${title}">${label}</button>`;
  // a press on a button never takes the keyboard's focus (Space stays play/pause); the seek bar keeps its own
  // press, or it cannot be dragged (the user, 2026-10-15: "I can't click or pull it to a specific frame")
  return `<div class="bbx-bar" onclick="event.stopPropagation()" onmousedown="if(!event.target.closest('.bbx-track,.bbx-mvol'))event.preventDefault()">
    ${b('bbx-ico', `bbxScene('${uid}',-1)`, 'Previous scene (Shift+←)', ICON.prevScene)}
    ${b('bbx-ico', `bbxBack('${uid}')`, 'Back one line (←)', ICON.back)}
    ${b('bbx-play', `bbxAuto('${uid}')`, 'Play / pause (Space)', ICON.play, `bbx-auto-${uid}`)}
    ${b('bbx-ico', `bbxNext('${uid}')`, 'Next line (→)', ICON.next)}
    ${b('bbx-ico', `bbxScene('${uid}',1)`, 'Next scene (Shift+→)', ICON.nextScene)}
    <div class="bbx-track" onmousemove="bbxSeekHover('${uid}', event)" onmouseleave="bbxSeekTip('${uid}', null)"><input type="range" class="bbx-seek" id="bbx-seek-${uid}" min="0" max="${n}" value="0" step="1" aria-label="Line of this screen" oninput="bbxSeek('${uid}', this.value, false)" onpointerup="bbxSeek('${uid}', this.value, true)" onchange="bbxSeek('${uid}', this.value, true)" onkeydown="event.stopPropagation()"><div class="bbx-ticks">${ticks}</div><div class="bbx-tip" id="bbx-tip-${uid}"></div></div>
    <span class="bbx-count" id="bbx-count-${uid}">0 / ${n}</span>
    ${b('', `bbxSpeed('${uid}')`, 'Auto speed', speedLabel(R?.speed || speedOf()), `bbx-speed-${uid}`)}
    ${b(`bbx-voices ${voicesOn() ? 'on' : ''}`, 'bbxVoices()', "The houseguests' voices, and the room sound when there is no music", '🔊 Voices')}
    ${musicSlider()}
    ${b('bbi-btn', `bbxIntel('${uid}')`, "What the house doesn't know: bonds, alliances, deals, and what they're thinking (i)", 'Intel', `bbi-btn-${uid}`)}
    ${R?.map ? b('', `bbxMapExit('${uid}')`, 'The house map (M)', 'Map') : ''}
    ${b('bbx-ico', 'bbxTv()', 'Fullscreen TV (F)', ICON.full)}
  </div>`;
}
// The music's own level, under the voices (the user, 2026-10-24: "a way to low music without lowering the
// voices"): it moves only the music channel (audio.setMusicLevel), so voices, stings and the room keep theirs.
const musicLevel = () => { try { const v = window.audio?.getMusicLevel?.(); return typeof v === 'number' ? v : 1; } catch { return 1; } };
function musicSlider() {
  const v = Math.round(musicLevel() * 100);
  return `<label class="bbx-mvol${v ? '' : ' zero'}" title="Music volume (the voices stay as they are)"><span>🎵</span><input type="range" min="0" max="100" step="1" value="${v}" aria-label="Music volume" oninput="bbxMusicLevel(this.value)" onchange="bbxMusicLevel(this.value);this.blur()" onkeydown="event.stopPropagation()"></label>`;
}
export function bbxMusicLevel(v) {
  const lvl = Math.max(0, Math.min(100, Number(v) || 0)) / 100;
  try { window.audio?.setMusicLevel?.(lvl); } catch { /* sound never breaks the bar */ }
  if (typeof document === 'undefined') return;
  document.querySelectorAll('.bbx-mvol').forEach(l => {
    l.classList.toggle('zero', !lvl);
    const inp = l.querySelector('input'); if (inp && inp !== document.activeElement) inp.value = String(Math.round(lvl * 100));
  });
  // the opening and closing titles are music too
  /** @type {NodeListOf<HTMLVideoElement>} */ (document.querySelectorAll('.bbt video')).forEach(el => { try { el.volume = Math.max(0, Math.min(1, (window.audio?.getVolume?.() ?? 0.7) * lvl)); } catch { /* defaults */ } });
}
// the bar follows the step: the play button, the seek bar, the count
function barSync(uid, R) {
  if (typeof document === 'undefined' || !R) return;
  const S = R.screens[R.si];
  const play = document.getElementById(`bbx-auto-${uid}`);
  if (play && play.dataset.st !== (R.auto ? 'pause' : 'play')) { play.innerHTML = R.auto ? ICON.pause : ICON.play; play.dataset.st = R.auto ? 'pause' : 'play'; play.classList.toggle('on', !!R.auto); play.title = R.auto ? 'Pause (Space)' : 'Play (Space)'; }
  const seek = /** @type {HTMLInputElement} */ (document.getElementById(`bbx-seek-${uid}`));
  if (seek && !R.seeking) seek.value = String(Math.max(0, R.idx + 1));
  const sp = document.getElementById(`bbx-speed-${uid}`);
  if (sp) sp.textContent = speedLabel(R.speed || 1);
  void S;
}

function scriptHtml(S) {
  return S.steps.map((st, i) => {
    const who = st.k === 'beat' ? '<span class="bbx-who cc">[ CC ]</span>'
      : st.k === 'bb' ? '<span class="bbx-who bb">Big Brother</span>'
        : st.k === 'voice' ? `<span class="bbx-who bb" style="color:${esc(st.vc || '#f0c040')}">${esc(st.by)}</span>`
        : st.k === 'dr' ? `<span class="bbx-who dr">${esc(st.by)} · DR</span>`
          : `<span class="bbx-who">${esc(st.by)}${st.k === 'host' ? ' (live)' : ''}</span>`;
    const line = st.k === 'beat' ? `<i>${escT(st.t)}</i>` : st.k === 'bb' ? escT(st.t) : `"${escT(st.t)}"`;
    return `<div class="bbx-ln" data-s="${i}" onclick="bbxJumpFromLine(this, ${i})" title="Jump here">${who}<span>${line}</span></div>`;
  }).join('') || '<div class="bbx-empty">Nothing aired here.</div>';
}

// The vote as it stands, which the house cannot see: a count per nominee, and every ballot
// with the chain behind it (the user, 2026-10-06: "wanted Brightly → The Outwit Club asked
// Brightly → told the house Brightly → casts Brightly helps me understand what's going on").
function voteHtml(L, row) {
  const count = {};
  for (const [, e] of L.ballots) count[e] = (count[e] || 0) + 1;
  const tally = Object.entries(count).sort((a, b) => b[1] - a[1]).map(([n, k]) => `<span class="bbx-tal"><b>${k}</b> ${esc(n)}</span>`).join('');
  const rows = L.ballots.map(([v, e, chain]) => `${row(v, `evict ${esc(e)}`, 'nom')}${chain?.length ? `<div class="bbx-chain">${chain.map(esc).join(' <i>→</i> ')}</div>` : ''}`).join('');
  return `<div class="bbx-panel"><h4>The vote · the house can't see this</h4><div class="bbx-tally">${tally}</div>${rows}</div>`;
}
function sideHtml(L, S, R = null) {
  // a Secret Story week: its own words, and the dossier of secrets as of this week (vp-bb-ep/ss-hud.js)
  if (R?.o?.season === 'secret-story') {
    if (R.ssDossier === undefined) R.ssDossier = ssDossierOf(globalThis.gs?.episodeHistory || [], R.num || 0);
    return ssSideHtml(L, S, R.ssDossier, mini);
  }
  const row = (n, tag, cls) => `<div class="bbx-row">${mini(n)}<b>${esc(n)}</b><span class="bbx-tag ${cls}">${tag}</span></div>`;
  return `<div class="bbx-panel"><h4>Week ${esc(S.week)}</h4>
      ${L.hoh ? row(L.hoh, 'HOH', 'hoh') : '<div class="bbx-pend">No Head of Household yet.</div>'}
      ${L.nom.map(n => row(n, L.out.includes(n) ? 'Evicted' : 'Nominated', L.out.includes(n) ? 'out' : 'nom')).join('')}
      ${L.veto ? row(L.veto, 'Veto', 'veto') : ''}</div>
    ${S.kind === 'chain' ? `<div class="bbx-panel"><h4>Chain of Safety</h4>${L.safe.length
      ? L.safe.map((n, i) => row(n, `Safe · ${i + 1}`, 'hoh')).join('') : '<div class="bbx-pend">Nobody is safe yet.</div>'}${(L.leftover || []).map(n => row(n, 'Not chosen', 'nom')).join('')}</div>` : ''}
    ${S.kind === 'suite' ? `<div class="bbx-panel"><h4>Safety Suite · ${L.shut ? 'closed' : 'open'}</h4>${L.spent.length
      ? L.spent.filter(n => !(S.rail?.spent || []).includes(n)).map(n => row(n, L.plus === n ? 'Plus one' : L.safe.includes(n) ? 'Safe' : L.stamps[n] === 'short' ? 'Short' : L.stamps[n] === 'slow' ? 'Too slow' : 'Pass spent', L.safe.includes(n) ? 'hoh' : 'out')).join('')
      : ''}${L.held.map(n => row(n, 'Held', 'veto')).join('')}${L.plus && !L.spent.includes(L.plus) ? row(L.plus, `Plus one${L.bill ? ' · ' + esc(L.bill.toLowerCase()) : ''}`, 'hoh') : ''}${!L.spent.length && !L.held.length ? '<div class="bbx-pend">Nobody has swiped yet.</div>' : ''}</div>` : ''}
    ${L.vetoPlay.length ? `<div class="bbx-panel"><h4>Veto players</h4>${[...new Set(L.vetoPlay)].map(n => row(n, 'Plays', '')).join('')}</div>` : ''}
    ${S.kind === 'jury-q' ? `<div class="bbx-panel"><h4>WHERE THE JURY IS</h4>${Object.keys(L.stances || {}).length
      ? Object.values(L.stances).map(([j, stance, asked]) => row(j, `${esc(stance)} on ${esc(asked)}`, '')).join('')
      : '<div class="bbx-pend">Nobody has asked a question yet.</div>'}</div>` : ''}
    ${L.ballots.length ? voteHtml(L, row) : ''}
    ${L.why?.length ? `<div class="bbx-panel bbx-why"><h4>Inside their heads</h4>${L.why.map(w => `<div class="bbx-wl">${esc(w)}</div>`).join('')}<div class="bbx-pend" style="margin-top:6px;font-size:10.5px">Bonds and alliances as the week ends.</div></div>` : ''}`;
}

function seasonOf(row) { return SEASON_DIR[row.themeId] || 'default'; }

/**
 * The week's VP screens. `legacy` is buildBBWeekScreens(row): its core-loop
 * and House Life screens are replaced; its twist screens are kept, after the
 * part of the week they follow.
 */
export function bbStepScreens(row, legacy = [], { host = 'Valeria', priorEvicted: everOut = [], plea = null, intro = null, firstRead = null } = {}) {
  // Evicted is not forever: somebody a Battle Back or a Camp Comeback put back in the house starts this week in it,
  // in colour on the opening and the memory wall (the user, 2026-10-28: "battle back should update the intro and the
  // memory wall, the one coming back is still grey")
  const backIn = new Set(row.houseAtStart || []);
  const priorEvicted = everOut.filter(n => !backIn.has(n));
  const steps = bbWeekSteps(row, { host, priorEvicted, plea, intro, firstRead });
  const houseLife = steps.some(S => S.kind === 'houselife');
  if (!steps.length) return legacy;
  // (ssKey: the season the viewer's own Secret Story kitty belongs to, vp-bb-ep/ss-hud.js)
  const o = { season: seasonOf(row), host, ssKey: seasonOf(row) === 'secret-story' ? seasonId(seasonFormat(globalThis.seasonConfig || {}), (globalThis.seasonConfig || {}).seasonNumber || row.seasonNumber || 1) : null };
  const fp = episodeKey(row, steps);
  // A Secret Story week airs as its own episodes (the user, 2026-10-28: "the prime being the same episode as the
  // others makes them super long"): launch night (week one), the days, the prime. One plays at a time.
  const ssParts = o.season === 'secret-story' ? [...new Set(steps.map(S => ssPartOf(S)))].filter(p => SS_PART_LABEL[p]) : [];
  const ssPart = ssParts.length ? (ssParts.includes(ssPartNow(row.num)) ? ssPartNow(row.num) : ssParts[0]) : null;
  const kept = watchAll()[fp]?.s || {};
  // Twist and House Life screens, by the part of the week they followed in the old running
  // order. Counted by OCCURRENCE: on a double or triple eviction the first cycle's eviction
  // is a different place from the second's, and filing both under "after the eviction"
  // stacked every cycle's House Life together at the end of the night.
  // the same counting over the stepped screens: each screen's key, and where each key ends
  const keyOf = [];
  {
    const occ = {}; let type = 'start'; let key = 'start#0';
    for (const S of steps) {
      if (S.kind !== 'scene' && S.kind !== 'houselife' && S.anchor && S.anchor !== type) { occ[S.anchor] = (occ[S.anchor] || 0) + 1; type = S.anchor; key = `${S.anchor}#${occ[S.anchor]}`; }
      keyOf.push(key);
    }
  }
  // The stretches that have a House Life segment: their classic House Life screens go INSIDE it.
  const segKeys = new Set(steps.map((S, i) => (S.kind === 'houselife' ? keyOf[i] : null)).filter(Boolean));
  const houseOf = {};
  const after = { 'start#0': [] };
  {
    const occ = {}; let type = 'start'; let key = 'start#0';
    for (const L of legacy) {
      const a = ANCHOR_OF(L.id);
      if (a) { if (a !== type) { occ[a] = (occ[a] || 0) + 1; type = a; key = `${a}#${occ[a]}`; after[key] ||= []; } continue; }
      if (REPLACED.test(L.id)) continue;
      // (Big Brother's House Status boards count HOHs, vetoes and nominations: a Secret Story house has none of them)
      if (o.season === 'secret-story' && /^bb-overview(-after)?$/.test(L.id)) continue;
      // In the House Life view the segment IS the stretch's house life, so the classic House
      // Life screen (the full record, the powers band, the payout, the season's register) goes
      // inside it, under the stage, instead of airing beside it as a second House Life screen.
      if (houseLife && /^bb-house-\d+(-\d+)?$/.test(L.id) && segKeys.has(key)) { (houseOf[key] ||= []).push(L); continue; }
      // A Secret Story week is rearranged (the prime's house life moves after it), so a stretch can lose its segment:
      // its record goes inside the last segment instead of airing as a classic screen after the verdict (the user,
      // 2026-10-28: "why do we have a classic viewer house life after the verdict")
      if (houseLife && o.season === 'secret-story' && /^bb-house-\d+(-\d+)?$/.test(L.id)) { const last = [...segKeys].at(-1); (houseOf[last] ||= []).push(L); continue; }
      after[key].push(L);
    }
  }
  const lastAt = {};
  keyOf.forEach((k, i) => { lastAt[k] = i; });
  // A twist's classic screen whose act left a slot goes exactly there.
  const slotMatch = type => {
    const keys = [type, type.replace(/-/g, '')];
    return L => keys.some(k => L.id === `bb-${k}` || L.id.startsWith(`bb-${k}-`) || L.id.startsWith(`bb-${k}`) && /^\d*$/.test(L.id.slice(3 + k.length)));
  };
  const taken = new Set();
  const forSlots = slots => (slots || []).flatMap(t => legacy.filter(L => !taken.has(L) && !REPLACED.test(L.id) && slotMatch(t)(L)))
    .filter(L => (taken.has(L) ? false : (taken.add(L), true)));
  const lead = forSlots(/** @type {any} */ (steps).leadingSlots);
  const slotted = steps.map(S => forSlots(S.slotsAfter));
  const boards = legacy.filter(L => steps.some(S => S.legacy && S.legacy.test(L.id)));
  for (const k of Object.keys(after)) after[k] = after[k].filter(L => !taken.has(L) && !boards.includes(L));
  const placed = new Set();
  const out = [...lead];
  if (lastAt['start#0'] === undefined) { out.push(...after['start#0']); placed.add('start#0'); }
  // The core screens keep the classic ids (bb-hoh, bb-noms, bb-cer, bb-evict...): the
  // navigator's chapters and everything that finds a screen by id still find it. A second
  // cycle's copy (a double eviction) gets the classic suffix.
  const seenIds = {};
  const ids = steps.map(S => {
    if (S.kind === 'scene' || S.kind === 'houselife' || !/v\d*$/.test(S.id)) return S.id;   // a scene, a House Life segment, or an id already final
    const base = S.id.replace(/-v\d*$/, '').replace(/v$/, '');
    seenIds[base] = (seenIds[base] || 0) + 1;
    return seenIds[base] === 1 ? base : `${base}-${seenIds[base]}`;
  });
  steps.forEach((S, si) => {
    const board = S.legacy ? legacy.find(L => !taken.has(L) && S.legacy.test(L.id)) : null;
    const flushKey = () => {
      const k = keyOf[si];
      if (lastAt[k] === si && !placed.has(k)) { out.push(...(after[k] || [])); placed.add(k); }
    };
    if (board) {
      taken.add(board); out.push(board); out.push(...slotted[si]); flushKey();
      return;
    }
    const uid = `bbx${esc(row.num)}-${si}`;
    reg()[uid] = { uid, screens: steps, si, idx: -1, o, auto: false, timer: null, map: newMap(S), num: row.num, tab: 'heads', who: null, lastL: null, speed: speedOf(), fp };
    const R0 = reg()[uid];
    if (kept[si]) restoreInto(R0, kept[si]);
    // which of the week's lines have a voice actor's clip (vp-bb-ep/voicing.js), asked before the first line
    if (si === 0) bbVoicedLines(row.num);
    // a House Life segment holds its stretch's classic House Life screens (and takes the first one's id)
    const feed = S.kind === 'houselife' ? (houseOf[keyOf[si]] || []).splice(0) : [];
    // the stepped screen sets the music, not the record underneath it
    // Folded away by default: the episode is the scenes above. This is the record of
    // everything else that happened in the house this stretch, off camera.
    const feedHtml = feed.length ? `<details class="bbx-feed"><summary class="bbx-feed-h">Off camera this stretch · the full record</summary>${feed.map(L => String(L.html).replace(/\sdata-ambient="[^"]*"/g, '')).join('')}</details>` : '';
    out.push({
      id: feed[0]?.id || ids[si],
      label: S.label || S.title,
      html: `<div class="bbx" data-uid="${uid}" data-ambient="${bedFor(S)}"><style>${BBX_FONTS}${BBX_CSS}${BBX_SUITE_CSS}${BBX_CHAIN_CSS}${BBX_HUNT_CSS}${BBX_PX_CSS}${BBX_DUO_CSS}${BBX_CAMP_CSS}${BBX_WILD_CSS}${BBX_SPOWER_CSS}${BBX_CAPSULE_CSS}${BBX_INTERRO_CSS}${BBX_WHACK_CSS}${HM_CSS}${SHELL_CSS}${INTEL_CSS}${BBX_COMP_CSS}${o.season === 'secret-story' ? SS_CSS : ''}</style>
  <div class="bbx-screen" id="bbx-scr-${uid}">
  <div class="bbx-stage stage" id="bbx-st-${uid}" onclick="bbxNext('${uid}')" title="Click for the next line">${R0.map ? mapHtml(uid, R0) : stageHtml(steps, si, -1, false, o).html}</div>
  <div class="bbi" id="bbi-${uid}" onclick="event.stopPropagation();bbxIntelClick('${uid}', event)"></div>
  ${barHtml(uid, S, R0)}
  </div>
  <img alt="" hidden src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" onload="bbxLive('${uid}')">
  <div class="bbx-ctrl">
    <button type="button" class="bbx-btn" onclick="bbxAll('${uid}')">Reveal all</button>
    <button type="button" class="bbx-btn" onclick="bbxReset('${uid}')">Restart</button>
    ${ssParts.length > 1 ? ssParts.map(p => `<button type="button" class="bbx-btn ${p === ssPart ? 'on' : ''}" onclick="bbxSsPart(${Number(row.num) || 0}, '${p}')" title="Play this part of the week as its own episode">${SS_PART_LABEL[p]}</button>`).join('') : ''}
    <button type="button" class="bbx-btn" onclick="bbxSwitchViewer('classic')" title="Back to the classic screens">Classic</button>
    ${S.kind === 'houselife' ? `<button type="button" class="bbx-btn ${mapOn() ? 'on' : ''}" onclick="bbxMapMode()" title="House Life as the house map you explore, or as one segment in story order">${mapOn() ? 'Linear view' : 'House map'}</button>` : ''}
    <button type="button" class="bbx-btn" onclick="bbxHouseLife()" title="House life as one segment per stretch, or one scene per screen">${houseLifeMode() === 'scenes' ? 'House Life view' : 'Scenes view'}</button>
    <input class="bbx-jump" type="number" min="1" max="${S.steps.length}" placeholder="Go to" title="Jump to a step: type its number and press Enter" onkeydown="if(event.key==='Enter')bbxJump('${uid}', this.value)">
  </div>
  <div class="bbx-under"><div class="bbx-script" id="bbx-script-${uid}">${scriptHtml(S)}</div>
    <aside class="bbx-side" id="bbx-side-${uid}">${sideHtml({ hoh: null, nom: [], veto: null, out: [], vetoPlay: [], ballots: [], stances: {}, spent: [], held: [], safe: [], stamps: {}, plus: null, bill: null, shut: false, chain: [], snubs: [], leftover: [] }, S)}</aside></div>
  ${feedHtml}
</div>`,
    });
    out.push(...slotted[si]);
    // the twist and House Life screens that followed this part of the week, once it has aired
    flushKey();
  });
  for (const k of Object.keys(houseOf)) if (houseOf[k].length) { (after[k] ||= []).push(...houseOf[k]); if (placed.has(k)) out.push(...houseOf[k]); }
  // A part of the classic week with no stepped screen of its own (a cycle with no draw):
  // its screens go after the last stepped screen of the same kind that came before it.
  for (const k of Object.keys(after)) if (!placed.has(k) && after[k].length) {
    const [type, n] = k.split('#');
    let host = null;
    for (let m = Number(n) - 1; m >= 0 && !host; m--) if (placed.has(`${type}#${m}`)) host = `${type}#${m}`;
    const at = host ? out.lastIndexOf(after[host].at(-1) ?? null) : -1;
    if (at >= 0) out.splice(at + 1, 0, ...after[k]); else out.push(...after[k]);
    placed.add(k);
  }
  // a Secret Story week: only the part being watched (a classic screen goes with the stepped screen before it)
  let ssNext = null;
  if (ssPart) {
    let cur = ssParts[0];
    const keep = out.filter(x => { if (x?.html?.includes('class="bbx"') || /^bb-ss-/.test(x?.id || '')) { const m = /data-uid="(bbx[^"]+)"/.exec(x.html || ''); const S = m ? reg()[m[1]] : null; cur = ssPartOf(S ? S.screens[S.si] : x.id); } return cur === ssPart; });
    out.length = 0; out.push(...keep);
    ssNext = ssParts[ssParts.indexOf(ssPart) + 1] || null;
  }
  // Every episode opens on the titles and closes on the closing (vp-bb-ep/titles.js),
  // both rendered in Blender with this season's cast, both skippable.
  const sc = (typeof globalThis !== 'undefined' && globalThis.seasonConfig) || {};
  const key = seasonId(seasonFormat(sc), sc.seasonNumber || row.seasonNumber || 1);
  // the people who have been in the house by the start of this episode, evicted or not: never a
  // Rivals latecomer before they walk in, never the twin nobody knows exists
  const lateNow = new Set((row.acts || []).find(a => a?.type === 'rivals-open')?.arrived || []);
  const been = [...new Set([...(everOut || []), ...(row.houseAtStart || row.house || [])])].filter(n => !lateNow.has(n));
  const castNow = (() => { try { return ((globalThis.players || []).map(p => p?.name).filter(Boolean)); } catch { return []; } })();
  const cast = been.length ? been : castNow;
  const seasonTitle = sc.seasonName || sc.title || '';
  // the opening greys out whoever had already gone before this episode; the closing, whoever has
  // gone by the end of it (the user, 2026-10-06: "closing should grey out the eliminated")
  const goneBefore = [...(priorEvicted || [])];
  // ...and whoever came back during it is in colour again by the closing
  const cameBack = new Set(steps.flatMap(S => (S.steps || []).flatMap(st => [st.bkBack, st.campBack])).filter(Boolean));
  // the record names them 'eliminated' (and 'alsoEliminated', 'extraEvictions' on a double); the
  // eviction act carries them too
  const goneNow = [row.eliminated, row.alsoEliminated, row.evicted, row.secondEvicted, ...(row.extraEvictions || []).map(x => x?.evicted),
    ...(row.acts || []).filter(a => a && /evict/.test(a.type || '')).map(a => a.evicted)];
  // (tonight's evictee too, when the Battle Back that night sent them straight back in)
  const goneAfter = [...new Set([...goneBefore, ...goneNow].filter(x => typeof x === 'string' && !cameBack.has(x)))];
  // (Secret Story opens on its own sequence: vp-bb-ep/ss-titles.js)
  const titled = o.season === 'secret-story' ? (k, g) => ssTitleScreen(k, cast, seasonTitle, g) : (k, g) => titleScreen(k, key, cast, seasonTitle, g);
  // (Secret Story: the days open on "Previously…" and then the generic; the prime opens on its own live generic)
  if (ssPart === 'prime') { /* the studio's own opening */ }
  else if (ssPart && /^bb-ss-previously/.test(out[0]?.id || '')) out.splice(1, 0, titled('intro', goneBefore));
  else out.unshift(titled('intro', goneBefore));
  out.push(titled('outro', ssPart && ssPart !== 'prime' ? goneBefore : goneAfter));
  if (ssNext) out.push({ id: `bb-ss-next-${ssNext}`, label: `Up next: ${SS_PART_LABEL[ssNext]}`, html: ssNextCard(row.num, ssNext) });
  // the Debug screen is not part of the episode: it goes after the closing, never before it
  for (let i = out.length - 2; i >= 0; i--) if (/debug/.test(out[i]?.id || '')) out.push(...out.splice(i, 1));
  lastBuilt = { fp, num: row.num, ids: out.map(x => x?.id).filter(Boolean) };
  // a classic screen kept inside the stepped week (a twist) still has the way to the classic viewer
  const SWITCH = `<div style="display:flex;justify-content:flex-end;margin:0 0 8px"><button type="button" class="bbx-switch" onclick="bbxSwitchViewer('classic')" style="border:1px solid #22e1ff;background:#0d1220;color:#22e1ff;border-radius:8px;padding:7px 12px;font:600 11px monospace;letter-spacing:1px;cursor:pointer">CLASSIC VIEWER</button></div>`;
  return out.map(x => (x && typeof x.html === 'string' && !x.html.includes('class="bbx"') && !x.html.includes('bbxSwitchViewer') && !/^bb-(titles|closing)$/.test(x.id || '') ? { ...x, html: SWITCH + x.html } : x));
}

// ── the reveal ─────────────────────────────────────────────────────────
function sync(uid) {
  const S = reg()[uid];
  const root = typeof document !== 'undefined' ? document.querySelector(`.bbx[data-uid="${uid}"]`) : null;
  // A screen drawn again (the viewer came back to it, or reopened the episode) shows where it was
  // left, not the top: it used to start over here, and the next click played its first line again.
  if (S && root && root.dataset.idx == null) { stopAuto(S); paint(uid, false); }
  return S;
}
function paint(uid, fresh) {
  const R = reg()[uid];
  if (!R || typeof document === 'undefined') return;
  const root = document.querySelector(`.bbx[data-uid="${uid}"]`);
  if (root) root.dataset.idx = String(R.idx);
  const el = document.getElementById(`bbx-st-${uid}`);
  if (!el) return;
  clearInterval(R.typing);
  remember(R);
  // the house map and a room's feed are drawn instead of the stage
  if (R.map && R.map.mode !== 'play') {
    el.innerHTML = mapHtml(uid, R);
    el.className = 'bbx-stage stage onmap';
    liveGL(el);       // the island's sea and palms
    const count = document.getElementById(`bbx-count-${uid}`);
    if (count) count.textContent = `${R.map.watched.size} / ${R.map.convs.length} feeds`;
    barSync(uid, R);
    return;
  }
  const out = stageHtml(R.screens, R.si, R.idx, fresh, R.o);
  // out of a conversation and back to the map at any point (the user, 2026-10-14: "I can't easily get out
  // of a conversation and go to the map")
  el.innerHTML = out.html + (R.map ? `<button type="button" class="hm-exit" title="Back to the map (M)" onclick="event.stopPropagation();bbxMapExit('${uid}')">◀ Map</button>` : '');
  el.className = `bbx-stage ${out.cls}`;
  liveGL(el);       // a Reality Resort plate moves by its motion map (water, palms, lights)
  const cam = el.querySelector('.cam');
  if (cam && fresh) requestAnimationFrame(() => requestAnimationFrame(() => cam.setAttribute('style', camStyle(out.cam))));
  const S = R.screens[R.si];
  const script = document.getElementById(`bbx-script-${uid}`);
  script?.querySelectorAll('[data-s]').forEach(ln => {
    const i = Number(ln.dataset.s);
    ln.classList.toggle('vis', i <= R.idx); ln.classList.toggle('now', i === R.idx);
  });
  if (fresh && script) { const ln = /** @type {HTMLElement} */ (script.querySelector(`[data-s="${R.idx}"]`)); if (ln) script.scrollTop = ln.offsetTop - script.offsetTop - 40; }
  const side = document.getElementById(`bbx-side-${uid}`);
  if (side) side.innerHTML = sideHtml(out.ledger, S, R);
  // the Intel drawer follows the step; a new thought in their heads lights its button while it is shut
  const whyNow = (out.ledger?.why || []).join('|');
  if (fresh && whyNow && whyNow !== (R.lastL?.why || []).join('|') && !root?.classList.contains('intel-open')) document.getElementById(`bbi-btn-${uid}`)?.classList.add('new');
  R.lastL = out.ledger;
  if (root?.classList.contains('intel-open')) { const ib = document.getElementById(`bbi-${uid}`); if (ib) ib.innerHTML = intelHtml(R.num, R.lastL, R.tab, R.who, R.screens?.[R.si]?.snap || null, intelAt(R)); }
  const count = document.getElementById(`bbx-count-${uid}`);
  if (count) count.textContent = `${Math.max(0, R.idx + 1)} / ${S.steps.length}`;
  barSync(uid, R);
  // the music turns and the stings land on a click, never on Reveal all or a repaint
  if (fresh && R.idx >= 0) playStep(S, R.idx);
  // The line arrives at the pace it is said (the user, 2026-10-06: "not stimulating enough with
  // the text"): a short line lands at once, with a punch; a long one types at speaking pace and
  // breathes at its commas and full stops. When it is all there, the names and the words of
  // the game light up (stage.js emph).
  const tx = el.querySelector('.tx[data-full]');
  // Big Brother and a season's own voice (The Mastermind...) are not typed out: their line is the speaker panel, so
  // their clip is asked for here (the user, 2026-10-25: "i still cant hear the mastermind"; it only ever played for
  // a typed line, so the house's voices stayed silent with their clips in the bucket)
  if (fresh && !tx) {
    const cur = R.screens[R.si]?.steps?.[R.idx] || {};
    if (!(voicesOn() && (cur.k === 'bb' || cur.k === 'voice') && bbVoiceLine(R.num, cur))) bbVoiceStop();
  }
  if (fresh && tx && !tx.textContent) {
    const un = v => v.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const full = un(tx.dataset.full);
    const done = () => { tx.innerHTML = un(tx.dataset.emph || '') || tx.textContent; tx.classList.add('lit'); };
    const cur = R.screens[R.si]?.steps?.[R.idx] || {};
    // the voice actor's clip when this line has one (vp-bb-ep/voicing.js), else the blips
    const acted = voicesOn() && bbVoiceLine(R.num, cur);
    if (full.length <= 34) { el.querySelector('.l3')?.classList.add('snap'); done(); if (!acted) voiceSay(cur.by, cur.k, full); }
    else {
      let n = 0, wait = 0;
      R.typing = setInterval(() => {
        if (wait > 0) { wait--; return; }
        n += Math.max(1, Math.round((full.length > 160 ? 3 : 2) * (R.speed || 1)));
        tx.textContent = full.slice(0, n);
        if (!acted) voiceTick(cur.by, cur.k, full, n - (n % 3 === 0 ? 0 : n % 3));
        const ch = full[Math.min(n, full.length) - 1];
        if (/[.!?…]/.test(ch) && n < full.length) wait = 9;
        else if (/[,;:—]/.test(ch) && n < full.length) wait = 4;
        if (n >= full.length) { clearInterval(R.typing); done(); }
      }, 16);
    }
  }
}
/** The first paint is a string the viewer inserts: once it is in the page, the plate starts moving. */
export function bbxLive(uid) {
  const el = typeof document !== 'undefined' && document.getElementById(`bbx-st-${uid}`);
  if (el) liveGL(el);
}
// ── the house map: a conversation at a time, in any order the clock allows ──
// The camera flies (the user, 2026-10-13: "do the fly-in"): from the island into the resort, from
// the house into a room, from a room into its conversation. The map zooms on the place picked, then
// the next view lands with a push. Off for reduced motion and for scripted runs (window._bbxFast).
const ISLAND_ZONES = new Set(['resort', 'beach', 'westdock', 'eastdock', 'clearing', 'npond', 'epond', 'lagoon', 'volcano', 'jury', 'villa', 'studio']);
function land(el, cls = 'arrive') {
  el.classList.remove('arrive', 'leave'); void el.offsetWidth; el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 900);
}
function fly(uid, R, zone, then) {
  const el = typeof document !== 'undefined' ? document.getElementById(`bbx-st-${uid}`) : null;
  const hm = el?.querySelector('.hm');
  const still = (typeof window !== 'undefined' && (window._bbxFast || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
  // on the island, a room of the house is reached through the resort
  const target = hm && zone ? (hm.classList.contains('hm-island') && !ISLAND_ZONES.has(zone) ? 'resort' : zone) : null;
  const box = target ? hm.querySelector(`.hm-room[data-z="${target}"]`) : null;
  if (!el || !box || still || R.flying) { then(); if (el && !still) land(el); return; }
  const H = hm.getBoundingClientRect(), B = box.getBoundingClientRect();
  hm.style.transformOrigin = `${((B.left + B.width / 2 - H.left) / H.width) * 100}% ${((B.top + B.height / 2 - H.top) / H.height) * 100}%`;
  hm.style.setProperty('--fz', Math.min(6, Math.max(1.8, Math.min(H.width / B.width, H.height / B.height) * 0.8)).toFixed(2));
  R.flying = true;
  requestAnimationFrame(() => hm.classList.add('hm-fly'));
  setTimeout(() => { R.flying = false; then(); land(el); }, 560);
}
function mapPlay(uid, R, c) {
  Object.assign(R.map, { mode: 'play', cur: c.k, end: c.to });
  R.idx = c.from; paint(uid, true);
}
function mapDone(uid, R) {
  if (R.map.cur != null) R.map.watched.add(R.map.cur);
  Object.assign(R.map, { mode: 'map', cur: null, end: null, window: null });
  paint(uid, false);
}
export function bbxMapPlay(uid, k) {
  const R = sync(uid); if (!R?.map) return;
  const c = R.map.convs[k]; if (c) fly(uid, R, R.map.mode === 'map' ? c.zone : null, () => mapPlay(uid, R, c));
}
export function bbxMapRoom(uid, zone) { const R = sync(uid); if (!R?.map) return; fly(uid, R, zone, () => { Object.assign(R.map, { mode: 'feed', zone }); paint(uid, false); }); }
/** Leave the conversation playing for the map; it counts as watched only if it was seen to its end. */
export function bbxMapExit(uid) {
  const R = sync(uid); if (!R?.map || R.map.mode !== 'play') return;
  stopAuto(R);
  if (R.map.cur != null && R.idx >= R.map.end) R.map.watched.add(R.map.cur);
  Object.assign(R.map, { mode: 'map', cur: null, end: null, window: null });
  paint(uid, false);
  const el = typeof document !== 'undefined' && document.getElementById(`bbx-st-${uid}`);
  if (el && !(typeof window !== 'undefined' && window._bbxFast)) land(el, 'leave');
}
export function bbxMapBack(uid) { const R = sync(uid); if (!R?.map) return; Object.assign(R.map, { mode: 'map', zone: null }); paint(uid, false); }
export function bbxMapLevel(uid, level) {
  const R = sync(uid); if (!R?.map) return;
  const go = () => { Object.assign(R.map, { mode: 'map', level, zone: null }); paint(uid, false); };
  // into the resort the camera dives; back out to the island it pulls away
  if (level === 'house' && R.map.mode === 'map') fly(uid, R, 'resort', go);
  else { go(); const el = typeof document !== 'undefined' && document.getElementById(`bbx-st-${uid}`); if (el && !(typeof window !== 'undefined' && window._bbxFast)) land(el, 'leave'); }
}
export function bbxMapWindow(uid, w) { const R = sync(uid); if (!R?.map) return; R.map.window = w; paint(uid, false); }
export function bbxMapMode() {
  try { localStorage.setItem('bb-map', mapOn() ? 'linear' : 'map'); } catch { /* per-viewer convenience */ }
  bbxHouseLife(true);
}
export function bbxNext(uid) {
  const R = sync(uid); if (!R) return;
  const S = R.screens[R.si];
  if (R.map) {
    // inside a conversation: its next line, and at its last line straight into the next conversation
    // in story order (the user, 2026-10-14: "next button should just play the linear way so i dont
    // have to return to the map everytimes"); after the last one, the next screen
    if (R.map.mode === 'play' && R.idx < R.map.end) { R.idx++; paint(uid, true); return; }
    if (R.map.mode === 'play' && R.map.cur != null) {
      R.map.watched.add(R.map.cur);
      const nx = nextConv(R.map.convs, R.map.watched);
      if (nx) { Object.assign(R.map, { window: null }); mapPlay(uid, R, nx); return; }
      mapDone(uid, R);
      const wasAuto = R.auto; stopAuto(R);
      if (typeof window !== 'undefined' && typeof window.vpNext === 'function') {
        window.vpNext();
        if (wasAuto) setTimeout(() => { const el = document.querySelector('.bbx[data-uid]'); if (el && el.dataset.uid !== uid) bbxAuto(el.dataset.uid); }, 700);
      }
      return;
    }
    // on the house: the next conversation in story order whose time has come
    const c = R.map.mode !== 'play' ? nextConv(R.map.convs, R.map.watched) : null;
    if (c) { if (R.flying) return; fly(uid, R, R.map.mode === 'map' ? c.zone : null, () => mapPlay(uid, R, c)); return; }
  }
  if (R.idx >= S.steps.length - 1 || (R.map && R.map.mode !== 'play')) {
    const wasAuto = R.auto; stopAuto(R);
    if (typeof window !== 'undefined' && typeof window.vpNext === 'function') {
      window.vpNext();
      if (wasAuto) setTimeout(() => { const nx = document.querySelector('.bbx[data-uid]'); if (nx && nx.dataset.uid !== uid) bbxAuto(nx.dataset.uid); }, 700);
    }
    return;
  }
  R.idx++; paint(uid, true);
}
export function bbxBack(uid) {
  const R = sync(uid); if (!R) return;
  // on the map, Back is the map before: a room's feed goes back to the plan, the house to the island
  // (the user, 2026-10-14: "back button should get to the previous map too")
  if (R.map && R.map.mode !== 'play') {
    if (R.map.mode === 'feed') bbxMapBack(uid);
    else if (R.map.level === 'house') bbxMapLevel(uid, 'island');
    return;
  }
  if (R.idx < 0) return; stopAuto(R);
  // inside a conversation, from its first line Back plays on backwards into the conversation before (the user,
  // 2026-10-15: "in house life I can't advance forward, backward"); the Map button and M leave for the map
  if (R.map?.mode === 'play' && R.map.cur != null && R.idx <= R.map.convs[R.map.cur].from) {
    if (R.idx <= 0) { bbxMapExit(uid); return; }
    R.idx--; mapLinear(R, R.idx); paint(uid, false); return;
  }
  R.idx--; paint(uid, false);
}
// Reveal all, Go to and a script line keep their linear meaning: they play from that step
const mapLinear = (R, idx) => {
  if (!R.map) return;
  const c = R.map.convs.find(x => idx >= x.from && idx <= x.to);
  Object.assign(R.map, { mode: 'play', cur: c ? c.k : null, end: c ? c.to : R.screens[R.si].steps.length - 1 });
};
export function bbxAll(uid) {
  const R = sync(uid); if (!R) return; stopAuto(R);
  R.idx = R.screens[R.si].steps.length - 1;
  if (R.map) { R.map.convs.forEach(c => R.map.watched.add(c.k)); Object.assign(R.map, { mode: 'play', cur: null, end: R.idx }); }
  paint(uid, false);
}
/** Jump to step n (1-based) of this screen, as if it had just been reached. */
export function bbxJump(uid, n) {
  const R = sync(uid); if (!R) return;
  const S = R.screens[R.si];
  const k = Math.max(0, Math.min(S.steps.length, Math.round(Number(n) || 0)));
  stopAuto(R); R.idx = k - 1;
  if (R.map) { if (k > 0) mapLinear(R, R.idx); else Object.assign(R.map, { mode: 'map', cur: null, end: null }); }
  paint(uid, k > 0);
}
/** The seek bar: while it is dragged the stage follows without typing or sound; let go, the line plays. */
export function bbxSeek(uid, v, done) {
  const R = sync(uid); if (!R) return;
  const S = R.screens[R.si];
  const k = Math.max(0, Math.min(S.steps.length, Math.round(Number(v) || 0)));
  // let go is said twice (the pointer, then the change): the second time there is nothing left to do
  if (done && !R.seeking && R.idx === k - 1) { bbxSeekTip(uid, null); return; }
  // seeking is said BEFORE Auto stops: stopping redraws the bar, and it would put the handle back where it was
  R.seeking = !done;
  stopAuto(R);
  R.idx = k - 1;
  if (R.map) { if (k > 0) mapLinear(R, R.idx); else Object.assign(R.map, { mode: 'map', cur: null, end: null }); }
  paint(uid, !!done && k > 0);
  bbxSeekTip(uid, done ? null : k);
  // let go, the keyboard is the viewer's again (Space plays, the arrows step)
  if (done && typeof document !== 'undefined') document.getElementById(`bbx-seek-${uid}`)?.blur();
}
/** The line at the pointer over the seek bar, said in its bubble. */
export function bbxSeekHover(uid, e) {
  const R = reg()[uid]; if (!R || R.seeking) { if (R?.seeking) bbxSeekTip(uid, R.idx + 1); return; }
  const seek = document.getElementById(`bbx-seek-${uid}`); if (!seek) return;
  const r = seek.getBoundingClientRect();
  const n = R.screens[R.si].steps.length;
  bbxSeekTip(uid, Math.max(0, Math.min(n, Math.round(((e.clientX - r.left - 7) / Math.max(1, r.width - 14)) * n))));
}
export function bbxSeekTip(uid, k) {
  const tip = typeof document !== 'undefined' && document.getElementById(`bbx-tip-${uid}`);
  if (!tip) return;
  const R = reg()[uid];
  if (k == null || !R) { tip.classList.remove('on'); return; }
  const S = R.screens[R.si], n = S.steps.length;
  const st = k > 0 ? S.steps[k - 1] : null;
  const who = !st ? 'Start' : st.k === 'beat' ? '' : st.k === 'bb' ? 'Big Brother' : st.k === 'dr' ? `${st.by} · DR` : (st.by || '');
  const text = String(st?.t || '').replace(/\s+/g, ' ');
  tip.innerHTML = `<b>${k} / ${n}</b>${st ? `<span>${who ? `${esc(who)}: ` : ''}${esc(text.length > 46 ? `${text.slice(0, 44)}…` : text)}</span>` : ''}`;
  const seek = document.getElementById(`bbx-seek-${uid}`);
  const w = seek ? seek.getBoundingClientRect().width : 0;
  tip.style.left = `${7 + (n ? k / n : 0) * Math.max(0, w - 14)}px`;
  tip.classList.add('on');
}
/** A line of the script, clicked: jump to it. */
export function bbxJumpFromLine(el, i) {
  const root = el.closest('.bbx[data-uid]');
  if (root) bbxJump(root.dataset.uid, i + 1);
}
export function bbxReset(uid) { const R = sync(uid); if (!R) return; stopAuto(R); R.idx = -1; if (R.map) R.map = newMap(R.screens[R.si]); paint(uid, false); }
// Opened again, a screen kept from before is drawn where it was left; and the episode remembers
// which screen it is on.
if (typeof document !== 'undefined') document.addEventListener('vp:screen', e => {
  const id = /** @type {CustomEvent} */ (e)?.detail?.id;
  if (lastBuilt && id && lastBuilt.ids.includes(id)) watchSave(lastBuilt.fp, w => { w.at = id; });
  document.querySelectorAll('#vp-screen-content .bbx[data-uid]').forEach(root => {
    const R = reg()[root.dataset.uid];
    if (root.dataset.idx == null && R && (R.idx >= 0 || R.map?.watched?.size)) sync(root.dataset.uid);
  });
});
// a reveal holds the screen longer: the room needs a beat with the name
const holdFor = st => Math.min(9000, 1600 + String(st?.t || '').length * 40) + (st?.big ? 2600 : 0) + (st?.tense ? 1200 : 0) + (st?.scene?.slate ? 600 : 0);
function stopAuto(R) { R.auto = false; clearTimeout(R.timer); if (R.uid) barSync(R.uid, R); }
export function bbxAuto(uid) {
  const R = sync(uid); if (!R) return;
  R.auto = !R.auto;
  barSync(uid, R);
  const tick = () => {
    if (!R.auto) return;
    bbxNext(uid);
    const st = R.screens[R.si].steps[R.idx];
    if (R.auto) R.timer = setTimeout(tick, holdFor(st) / (R.speed || 1));
  };
  if (R.auto) R.timer = setTimeout(tick, 400); else clearTimeout(R.timer);
}
/** Auto's pace: 0.75×, 1×, 1.5×, 2×, remembered for the viewer. */
export function bbxSpeed(uid) {
  const R = reg()[uid]; if (!R) return;
  R.speed = SPEEDS[(SPEEDS.indexOf(R.speed || 1) + 1) % SPEEDS.length];
  try { localStorage.setItem('bb-speed', String(R.speed)); } catch { /* per-viewer convenience */ }
  barSync(uid, R);
}
/** The previous or next scene of this screen (a conversation, in House Life), never another screen. */
export function bbxScene(uid, dir) {
  const R = sync(uid); if (!R) return;
  const S = R.screens[R.si];
  const at = sceneStarts(S);
  // on the map nothing has played yet (idx -1): the next scene is the first one
  const cur = R.map && R.map.mode !== 'play' ? -1 : Math.max(0, R.idx);
  let to;
  if (dir < 0) {
    // from the middle of a scene, back to its start; from its start, the one before
    const before = at.filter(i => i < cur);
    const start = [...at].reverse().find(i => i <= cur);
    to = start != null && start < cur && cur - start > 1 ? start : before.length ? before[before.length - 1] : 0;
  } else {
    to = cur < 0 ? (at[0] ?? 0) : at.find(i => i > cur);
    if (to == null) to = S.steps.length - 1;
  }
  bbxJump(uid, to + 1);
}
export function bbxTv() {
  const p = typeof document !== 'undefined' ? document.getElementById('visual-player') : null;
  if (!p) return;
  const on = p.classList.toggle('bbx-tv');
  try {
    if (on && p.requestFullscreen && !document.fullscreenElement) p.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  } catch { /* fullscreen refused: the bigger stage still applies */ }
  p.classList.remove('bbx-idle');
  if (on) tvWake();
  // leaving fullscreen (Esc) leaves TV mode too
  if (!p._bbxTvExit) {
    p._bbxTvExit = true;
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) p.classList.remove('bbx-tv', 'bbx-idle'); });
    document.addEventListener('mousemove', tvWake, { passive: true });
  }
}
// In TV mode the bar and the cursor go after two and a half seconds of a still mouse, and come back on a move
let tvTimer = null;
function tvWake() {
  const p = typeof document !== 'undefined' ? document.getElementById('visual-player') : null;
  if (!p || !p.classList.contains('bbx-tv')) return;
  p.classList.remove('bbx-idle');
  clearTimeout(tvTimer);
  // (with Intel open the bar stays, and the count starts again once it is shut)
  tvTimer = setTimeout(() => { if (!p.classList.contains('bbx-tv')) return; if (p.querySelector('.bbx.intel-open')) tvWake(); else p.classList.add('bbx-idle'); }, 2500);
}
/** Switch between the stepped viewer and the classic screens, and redraw this week. */
/** Flip house life between one segment per stretch and one scene per screen, and redraw. */
// ── Secret Story: the part of the week being watched ──
/** @type {Record<string, string>} */
const ssPartState = {};
function ssPartNow(num) { return ssPartState[String(num)] || null; }
/** Plays another part of a Secret Story week (launch night, the days, the prime) as its own episode. */
export function bbxSsPart(num, part) {
  ssPartState[String(num)] = part;
  try {
    const ep = window.vpEpNum ?? window._vpEpNum ?? num;
    if (typeof window.openVisualPlayer === 'function') { window.openVisualPlayer(ep); if (typeof window.vpGoTo === 'function') window.vpGoTo(0); }
  } catch { /* the viewer is not open */ }
}
/** The card at the end of a part: what comes next, and the way to it. */
function ssNextCard(num, part) {
  const blurb = { daily: 'The days in the House of Secrets: the hunt, the Voice, the nominations.', prime: 'Live from the studio: the kitties, the dilemmas, and the verdict of the public.' }[part] || '';
  return `<div class="sst-next" style="position:relative;aspect-ratio:16/9;max-width:1200px;margin:0 auto;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
    background:radial-gradient(ellipse at 50% 40%,#c8137a 0%,#5b0d4f 40%,#2b0d3f 70%,#0d0414 100%);color:#fff;font-family:'SSAachen',system-ui,sans-serif;text-align:center;padding:24px" data-ambient="none">
    <style>@font-face{font-family:'SSAachen';src:url('assets/fonts/Aachen-Bold.otf') format('opentype');font-weight:100 900}</style>
    <img src="assets/sets/bb/secret-story/props/eye.webp" alt="" style="width:14%;filter:drop-shadow(0 0 24px rgba(255,62,165,.8))">
    <div style="font-size:clamp(14px,1.6vw,20px);letter-spacing:.35em;opacity:.85">UP NEXT</div>
    <div style="font-size:clamp(30px,5vw,64px);font-weight:700;text-shadow:3px 3px 0 #c8137a">${esc(SS_PART_LABEL[part] || part)}</div>
    <div style="max-width:52ch;font-size:clamp(13px,1.4vw,18px);opacity:.9;font-family:system-ui,sans-serif">${esc(blurb)}</div>
    <button type="button" onclick="bbxSsPart(${Number(num) || 0}, '${part}')" style="font:700 18px 'SSAachen',sans-serif;padding:12px 26px;border-radius:999px;border:3px solid #fff;background:#ff3ea5;color:#fff;cursor:pointer;box-shadow:0 0 24px rgba(255,62,165,.7)">Watch ${esc(SS_PART_LABEL[part] || part)} ▶</button>
  </div>`;
}

export function bbxHouseLife(keep = false) {
  if (keep !== true) try { localStorage.setItem('bb-houselife', houseLifeMode() === 'scenes' ? 'segments' : 'scenes'); } catch { /* per-viewer convenience */ }
  try {
    const ep = window.vpEpNum ?? window._vpEpNum;
    if (typeof window.openVisualPlayer === 'function' && ep != null) window.openVisualPlayer(ep);
    else location.reload();
  } catch { location.reload(); }
}
// The user, 2026-10-06: "switching to classic takes me to the first screen". The switch keeps
// the place: the screen you were on by id (the stepped core screens keep the classic ids), or
// failing that the same part of the week (its anchor), or failing that the same fraction of it.
const baseId = id => String(id || '').replace(/-v(\d*)$/, '').replace(/(-\d+)$/, '');
export function bbxSwitchViewer(which) {
  try { localStorage.setItem('bb-vp', which === 'stepped' ? 'stepped' : 'classic'); } catch { /* per-viewer convenience */ }
  try {
    const before = window.vpScreens || [];
    const at = window.vpCurrentScreen || 0;
    const cur = before[at] || {};
    const frac = before.length > 1 ? at / (before.length - 1) : 0;
    const ep = window.vpEpNum ?? window._vpEpNum;
    if (typeof window.openVisualPlayer !== 'function' || ep == null) { location.reload(); return; }
    window.openVisualPlayer(ep);
    const now = window.vpScreens || [];
    let i = now.findIndex(s => s.id && s.id === cur.id);
    if (i < 0) i = now.findIndex(s => baseId(s.id) && baseId(s.id) === baseId(cur.id));
    if (i < 0 && cur.anchor) i = now.findIndex(s => s.anchor === cur.anchor);
    if (i < 0) i = Math.round(frac * Math.max(0, now.length - 1));
    if (i > 0 && typeof window.vpGoTo === 'function') window.vpGoTo(i);
  } catch { location.reload(); }
}
// ── the Intel drawer (vp-bb-ep/intel.js) ──
export function bbxIntel(uid) {
  const R = reg()[uid]; if (!R || typeof document === 'undefined') return;
  const root = document.querySelector(`.bbx[data-uid="${uid}"]`); if (!root) return;
  const open = root.classList.toggle('intel-open');
  document.getElementById(`bbi-btn-${uid}`)?.classList.remove('new');
  document.getElementById(`bbi-btn-${uid}`)?.classList.toggle('on', open);
  if (open) { const ib = document.getElementById(`bbi-${uid}`); if (ib) ib.innerHTML = intelHtml(R.num, R.lastL, R.tab, R.who, R.screens?.[R.si]?.snap || null, intelAt(R)); }
}
export function bbxIntelClick(uid, e) {
  const R = reg()[uid]; if (!R) return;
  const t = e?.target;
  if (t?.closest?.('[data-close]')) { bbxIntel(uid); return; }
  const tab = t?.closest?.('[data-tab]')?.dataset.tab, who = t?.closest?.('[data-who]')?.dataset.who;
  if (!tab && !who) return;
  if (tab) R.tab = tab;
  if (who) R.who = who;
  const ib = document.getElementById(`bbi-${uid}`); if (ib) ib.innerHTML = intelHtml(R.num, R.lastL, R.tab, R.who, R.screens?.[R.si]?.snap || null, intelAt(R));
}
if (typeof document !== 'undefined') document.addEventListener('keydown', e => {
  const root = document.querySelector('.bbx[data-uid]');
  if (!root || e.ctrlKey || e.metaKey || e.altKey || /input|textarea|select/i.test(/** @type {HTMLElement} */ (e.target)?.tagName || '')) return;
  const vp = document.getElementById('visual-player');
  const shown = !vp || vp.style.display !== 'none';
  const uid = root.dataset.uid;
  if (shown && e.key === ' ') { e.preventDefault(); bbxAuto(uid); tvWake(); return; }
  if (shown && e.key === 'ArrowRight') { e.preventDefault(); if (e.shiftKey) bbxScene(uid, 1); else bbxNext(uid); tvWake(); return; }
  if (shown && e.key === 'ArrowLeft') { e.preventDefault(); if (e.shiftKey) bbxScene(uid, -1); else bbxBack(uid); tvWake(); return; }
  if (shown && (e.key === 'l' || e.key === 'L')) { bbxScene(uid, 1); return; }
  if (shown && (e.key === 'j' || e.key === 'J')) { bbxScene(uid, -1); return; }
  if (shown && (e.key === 'f' || e.key === 'F')) { bbxTv(); return; }
  if (e.key === 'i' || e.key === 'I') { bbxIntel(root.dataset.uid); tvWake(); }
  else if (e.key === 'm' || e.key === 'M') { bbxMapExit(root.dataset.uid); tvWake(); }
  else if (e.key === 'Escape' && root.classList.contains('intel-open')) { e.preventDefault(); e.stopImmediatePropagation(); bbxIntel(root.dataset.uid); }
});

if (typeof window !== 'undefined') Object.assign(window, { bbxSeek, bbxSeekHover, bbxSeekTip, bbxSpeed, bbxScene, bbxIntel, bbxIntelClick, bbxLive, bbxMapExit, bbxMapLevel, bbxMapPlay, bbxMapRoom, bbxMapBack, bbxMapWindow, bbxMapMode, bbxNext, bbxBack, bbxAll, bbxReset, bbxAuto, bbxTv, bbxSwitchViewer, bbxHouseLife, bbxSsPart, bbxVoices, bbxMusicLevel, bbxJump, bbxJumpFromLine, bbxResumeAt });
// Closing the Viewing Party only hides it: stop every Auto run and the line typing out,
// or Auto keeps clicking through the week (and its music) behind a closed window.
if (typeof document !== 'undefined') document.addEventListener('vp:close', () => {
  for (const R of Object.values(reg())) { if (R) { stopAuto(R); clearInterval(R.typing); } }
});
void eyeSvg;
