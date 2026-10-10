// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/screens.js — a Total Drama episode on the stepped stage (spec 2026-10-06 §6)
// ══════════════════════════════════════════════════════════════════════
//
// tdStepScreens(ep, classic, o): the classic screen list in, the same list out with the camp
// screens (camp-pre-*, camp-post-*) and the Tribal (tribal + votes, and the Voting Plans the
// Intel drawer now carries) replaced by stepped screens IN THEIR SLOTS, under the classic ids,
// so everything that finds a screen by id still finds it. Anything the stepped stage does not
// cover yet keeps its classic screen. A Classic switch on every stepped screen lands on the same
// screen in the classic viewer (localStorage 'td-vp' = 'classic' to stay there).
import { tdCampScreen, tdTribalScreen, tdTribalStepped, tdDoubleTribalScreen, cleanText, placeScene, plateKey, placeName, venueOf, teamSpot } from './steps.js';
import { tdFinalTribalScreen, tdFinaleDecisionScreen, tdFanFinaleScreen, tdWinnerScreen } from './finale.js';
import { tdCampMap, tdIslandMap, hasMap, MAP_VENUES, openWindow, nextConv, lockedConv, PLACE_LABEL } from './map.js';
import { tdRiChoiceScreen, tdIslandLifeScreen, tdExileScreen, exileOf, tdRiDuelScreen } from './twists.js';
import { tdJuryHouseScreen, isJuryHouse } from './jury-house.js';
import { tdReturnScreen, tdEmissaryScoutScreen, tdEmissaryChoiceScreen, tdTiedDestiniesScreen, tiedDestiniesTribal } from './returns.js';
import { openVoteTribal, tdLateArrivalScreen, tdJuryEliminationScreen, tdSpiritIslandScreen, tdFanVoteScreen, tdAmbassadorsScreen } from './twists-more.js';
import { tdTwistBlocksScreen, tdMergeScreen, tdMiscTwistScreen, tdPreviouslyScreen } from './twist-screens.js';
import { tdArrivalScreen, hasArrivals } from './arrival.js';
import { tdAftermathScreen, hasAftermath } from './aftermath.js';
import { ledgerAt, worldKey, worldHtml, worldSound, castAt, tokHtml, hudHtml, dialogue, intelHtml, esc, avatar, shotOf } from './stage.js';
import { TDX_CSS, TDX_FONTS } from './style.js';
import { liveGL } from './glplate.js';
import { ambience, stopAmbience, sfx } from './sound.js';

const reg = () => (typeof window !== 'undefined' ? (window._tdx ||= {}) : (globalThis._tdx ||= {}));
export const tdSteppedOn = () => { try { return globalThis.localStorage?.getItem('td-vp') !== 'classic'; } catch { return true; } };

/** Each camp's members as the episode started (the record, never live gs). */
function membersOf(ep, camp) {
  return ep.campAccess?.groups?.[camp]?.members
    || (ep.tribesAtStart || []).find(t => t.name === camp)?.members
    || (ep.gsSnapshot?.tribes || []).find(t => t.name === camp)?.members
    || [];
}

export function tdStepScreens(ep, classic = [], o = {}) {
  const out = [];
  let tribalDone = false, aftermathDone = false, juryDone = false, juryElimDone = false;
  const finDone = new Set();
  // Tied Destinies is a double elimination at Tribal: announced, talked about, and the partner sent home too
  const tribal = openVoteTribal(tiedDestiniesTribal(tdTribalStepped(ep) ? tdTribalScreen(ep, o) : tdDoubleTribalScreen(ep, o), ep), ep);
  // the camp map (map.js) is the default camp view where the venue has one, one map per team at
  // every venue (the user, 2026-10-08: "I set up 2 teams" - folding a shared camp's teams into one
  // map read as the teams being gone). A shared camp is still drawn whole, with the other team in
  // it; a venue where teams live apart shows each team its own campsite. Anything the map cannot
  // hold plays the linear camp screen.
  const venue = venueOf(ep, o);
  const mapOn = o.campMap !== false && hasMap(venue);
  const mapped = new Map();
  for (const S of classic) {
    const m = /^camp-(pre|post)-(.+)$/.exec(S?.id || '');
    if (m && mapOn) {
      const key = `${m[1]}:${m[2]}`;
      if (!mapped.has(key)) {
        const camps = [m[2]];
        mapped.set(key, tdCampMap(ep, m[1], camps, o));
        if (mapped.get(key)) { out.push(mapShell(mapped.get(key), S, ep, o)); continue; }
      } else if (mapped.get(key)) continue;
    }
    if (m) {
      const scr = tdCampScreen(ep, m[2], m[1], membersOf(ep, m[2]), o);
      if (scr) { out.push(shell(scr, S, ep, o)); continue; }
    }
    // the finale (finale.js): the last morning at camp, the decision, the fan vote, Final Tribal and the
    // winner on the stage; the finale's races and the fire-making duel stay classic, like every challenge
    if (ep.isFinale) {
      const id = S?.id || '';
      const fin = (key, build) => { if (finDone.has(key)) return 'skip'; const x = (() => { try { return build(); } catch (err) { console.warn('TD finale screen fell back:', key, err); return null; } })(); if (!x) return null; finDone.add(key); out.push(shell(x, { ...S, id: x.id, label: x.label }, ep, o)); return 'done'; };
      let r = null;
      if (id === 'finale-camp') {
        const campK = Object.keys(ep.campEvents || {})[0];
        const scr = campK ? tdCampScreen(ep, campK, 'pre', membersOf(ep, campK), o) : null;
        if (scr) { out.push(shell(scr, S, ep, o)); continue; }
      }
      else if (['firemaking-decision', 'final-cut', 'kl-choice'].includes(id)) r = fin('decision', () => tdFinaleDecisionScreen(ep, o));
      else if (['fan-campaign', 'fan-vote-reveal'].includes(id)) r = fin('fan', () => tdFanFinaleScreen(ep, o));
      else if (['ftc', 'jury-vote'].includes(id)) r = fin('ftc', () => tdFinalTribalScreen(ep, o));
      else if (id === 'winner-ceremony') r = fin('winner', () => tdWinnerScreen(ep, o));
      if (r) continue;
    }
    // the Aftermath talk show: every classic segment screen becomes one show on the studio stage
    // (the Aftermayhem minigames keep their own screens)
    if (/^aftermath-(opening|iv-|truth|moment-|footage|fancall|fanvote|finalist-|discussion-|awards)/.test(S?.id || '') && hasAftermath(ep)) {
      if (aftermathDone) continue;
      const am = tdAftermathScreen(ep, o);
      if (am) { aftermathDone = true; out.push(shell(am, { ...S, id: 'aftermath-show', label: am.label }, ep, o)); continue; }
    }
    if (tribal && ['voting-plans', 'votes', 'surprise', 'voting-plans-2', 'votes-2'].includes(S.id)) continue;
    if (tribal && S.id === 'tribal' && !tribalDone) { tribalDone = true; out.push(shell(tribal, S, ep, o)); continue; }
    // the jury elimination twist: its three classic pages are one screen at the ceremony (twists-more.js)
    if (/^jury-(life|convenes|votes)$/.test(S?.id || '')) {
      if (juryElimDone) continue;
      const je = tdJuryEliminationScreen(ep, o);
      if (je) { juryElimDone = true; out.push(shell(je, { ...S, id: 'jury-elimination', label: je.label }, ep, o)); continue; }
    }
    // the Jury House interlude: its title card and its week are one screen on the motel's sets
    if (/^il-(title|life)$/.test(S?.id || '') && isJuryHouse(ep)) {
      if (juryDone) continue;
      const jh = tdJuryHouseScreen(ep, o);
      if (jh) { juryDone = true; out.push(shell(jh, { ...S, id: 'jury-house', label: jh.label }, ep, o)); continue; }
    }
    // Redemption / Rescue Island: the island's map (the user, 2026-10-09), its moments by place and time of day
    if (/^(ri-life|rescue-life)$/.test(S?.id || '')) {
      const im = (() => { try { return tdIslandMap(ep, S.id === 'rescue-life' && !!(ep.rescueIslandEvents || []).length, o); } catch (err) { console.warn('TD island map fell back:', err); return null; } })();
      if (im) { out.push(mapShell(im, S, ep, o)); continue; }
    }
    const isl = islandScreen(ep, S, o);
    if (isl) { out.push(shell(isl, S, ep, o)); continue; }
    // the twists with hand-built classic pages, each on the stage from its own record
    const misc = (() => { try { return tdMiscTwistScreen(ep, S?.id || '', o); } catch (err) { console.warn('TD twist screen fell back:', S?.id, err); return null; } })();
    if (misc === 'skip') continue;
    if (misc?.parts?.length) { misc.parts.forEach(m => out.push(shell(m, { ...S, id: m.id, label: m.label }, ep, o))); continue; }
    if (misc) { out.push(shell(misc, S, ep, o)); continue; }
    // any other twist page drawn from twist cards (Hero Duel, Kidnapping, Shared Immunity, The Feast...):
    // the same cards, played on the venue's stage
    if (S?.tdScenes?.length && !/^(camp-|tribal$|votes|voting-plans|challenge|relationships|aftermath|ratings|cold-open)/.test(S.id || '')) {
      const label = String(S.label || S.id).replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N} '’:&-]/gu, '').trim();
      const scr = tdTwistBlocksScreen(ep, [{ type: S.id, label, scenes: S.tdScenes }], o, { post: /^(post-|no-tribal)/.test(S.id) });
      if (scr) { out.push(shell({ ...scr, id: `tw-${S.id}` }, S, ep, o)); continue; }
    }
    out.push(S);
  }
  return out;
}

// The island twists (twists.js), in the classic screens' slots. 'rescue-life' is also the id some
// episode paths give the Redemption Island life screen, so the record says which island it is.
function islandScreen(ep, S, o) {
  const id = S?.id || '';
  if (id === 'cold-open' && hasArrivals(ep)) return tdArrivalScreen(ep, o);
  // every other episode opens on the host's recap of the last one (td/story/previously.js)
  if (id === 'cold-open' && ep.tdPreviously?.length) return tdPreviouslyScreen(ep, o);
  if (id === 'ri-choice') return tdRiChoiceScreen(ep, o);
  if (id === 'ri-life') return tdIslandLifeScreen(ep, false, o);
  if (id === 'ri-duel') return tdRiDuelScreen(ep, o);
  // the way back in, the emissary, Tied Destinies (returns.js)
  if (id === 'ri-return' || id === 'rescue-return') return tdReturnScreen(ep, o);
  if (id === 'emissary-scouting') return tdEmissaryScoutScreen(ep, o);
  if (id === 'emissary-choice') return tdEmissaryChoiceScreen(ep, o);
  if (id === 'tied-destinies') return tdTiedDestiniesScreen(ep, o);
  if (id === 'late-arrival') return tdLateArrivalScreen(ep, o);
  if (id === 'fan-vote') return tdFanVoteScreen(ep, o);
  if (id === 'spirit-island') return tdSpiritIslandScreen(ep, o);
  if (id === 'ambassadors') return tdAmbassadorsScreen(ep, o);
  if (id === 'twist' && !o.twistBlocks?.length && (ep.twists || []).some(t => (t.type === 'fan-vote-boot' || t.catalogId === 'fan-vote-boot') && t.fanVoteSaved)) return tdFanVoteScreen(ep, o);
  if (id === 'rescue-life') return tdIslandLifeScreen(ep, !!(ep.rescueIslandEvents || []).length, o);
  if (id === 'exile-island') return tdExileScreen(ep, exileOf(ep, false), o);
  if (id === 'exile-format') return tdExileScreen(ep, exileOf(ep, true), o);
  if (id === 'twist' && o.twistBlocks?.length) return tdTwistBlocksScreen(ep, o.twistBlocks, o);
  // the post-vote screen also carries an elimination card for a duel or a second life: classic there
  if (id === 'post-twist' && o.postBlocks?.length && !ep.exileDuelResult && !ep.fireMaking) return tdTwistBlocksScreen(ep, o.postBlocks, o, { post: true });
  if (id === 'merge' && o.merge) return tdMergeScreen(ep, o.merge, o);
  return null;
}

// ── the shell around a stepped screen ─────────────────────────────────
function scriptHtml(scr) {
  return scr.steps.map((s, i) => {
    let t = '';
    if (s.k === 'scene') t = `<div class="tdx-ln sc" data-s="${i}">${esc(s.place)}${s.time ? ' · ' + esc(s.time) : ''}</div>`;
    else if (s.k === 'say') t = `<div class="tdx-ln" data-s="${i}"><b>${esc(s.by)}:</b> ${esc(s.text)}</div>`;
    else if (s.k === 'conf') t = `<div class="tdx-ln" data-s="${i}"><b>${esc(s.by)} (confessional):</b> ${esc(s.text)}</div>`;
    else if (s.k === 'beat') t = `<div class="tdx-ln d" data-s="${i}">(${esc(s.text)})</div>`;
    else if (s.k === 'title') t = `<div class="tdx-ln sc" data-s="${i}">${esc(s.kicker)}: ${esc(s.name)}</div>`;
    else if (s.k === 'ballot') t = `<div class="tdx-ln sc" data-s="${i}">${esc(s.voter)} votes: ${esc(s.voted)}</div>`;
    else if (s.k === 'intro') t = `<div class="tdx-ln sc" data-s="${i}">Contestant ${s.n}: ${esc(s.who)}${s.tag ? ' · ' + esc(s.tag) : ''}</div>`;
    else if (s.k === 'ballots') t = `<div class="tdx-ln d" data-s="${i}">(${esc(s.text)})</div>`;
    else if (s.k === 'power') t = `<div class="tdx-ln d" data-s="${i}">(${esc(s.by)} plays ${esc(s.the || s.name)}${s.on ? ` on ${esc(s.on)}` : ''}.)</div>`;
    else if (s.k === 'idol') t = `<div class="tdx-ln d" data-s="${i}">(${esc(s.by)} plays a Hidden Immunity Idol${s.for !== s.by ? ` for ${esc(s.for)}` : ''}.)</div>`;
    else if (s.k === 'safe') t = `<div class="tdx-ln" data-s="${i}"><b>${esc(scr.host || 'Chris')}:</b> ${esc(s.who)}${s.immune ? ', you won immunity' : ''}.</div>`;
    else if (s.k === 'read') t = `<div class="tdx-ln" data-s="${i}"><b>${esc(scr.host || 'Chris')}:</b> ${esc(s.line || `${s.vote}.${s.dead ? ' Does not count.' : ''}`)}</div>`;
    else if (s.k === 'out') t = `<div class="tdx-ln sc" data-s="${i}">${esc(s.who)} is ${s.island ? 'voted out' : 'eliminated'}</div>`;
    else if (s.k === 'found') t = `<div class="tdx-ln sc" data-s="${i}">${s.text ? esc(s.text) : `${esc(s.who)} finds the ${esc(s.label)}`}</div>`;
    return t.replace('class="tdx-ln', `onclick="tdxJump(this,${i})" class="tdx-ln`);
  }).join('');
}

function shell(scr, classicScreen, ep, o) {
  const uid = `tdx${esc(ep.num)}-${scr.id.replace(/[^\w-]/g, '')}`;
  reg()[uid] = { scr, idx: -1, auto: false, timer: null, typing: null, tab: null, o: { teamColor: scr.team && o.colorOf ? o.colorOf(scr.team) : '#4fb84a' } };
  const first = scr.steps.findIndex(s => s.k === 'scene');
  const peek = first >= 0 ? ledgerAt(scr, first) : null;
  const chap = scr.steps.filter(s => s.k === 'scene').length;
  // camp and the islands play the place's own sound, not the music bed (vp-ui.js reads data-ambient)
  const quiet = scr.kind === 'camp' || /^(ri-|rescue|exile)/.test(scr.id) ? ' data-ambient="none"' : '';
  const html = `<div class="tdx" data-uid="${uid}"${quiet}>
<style>${TDX_FONTS}${TDX_CSS}</style>
<div class="tdx-stage" id="tdx-st-${uid}" onclick="tdxNext('${uid}')" title="Click for the next line">
  <div class="tdx-world">${peek ? worldHtml(scr, peek) : ''}<div class="tdx-cast"></div><div class="tdx-fx"></div></div>
  <div class="tdx-hud"><div class="tdx-title fresh"><div class="band"></div><div class="inner"><div class="kicker">Episode ${esc(ep.num)}</div><div class="big">${esc(scr.label)}</div></div></div></div>
  <div class="tdx-dlg hidden"><div class="panel"></div><div class="tdx-cut"></div><div class="sub"></div><div class="name"></div><div class="say"></div><div class="nx"></div></div>
  <button type="button" class="tdx-ibtn" onclick="event.stopPropagation();tdxIntel('${uid}')"><i></i>Intel</button>
  <div class="tdx-intel" onclick="event.stopPropagation();tdxTab('${uid}',event)"></div>
  <div class="tdx-static"></div>
</div>
<div class="tdx-ctrl">
  <button type="button" class="tdx-btn" onclick="tdxReset('${uid}')">Restart</button>
  <button type="button" class="tdx-btn" onclick="tdxBack('${uid}')">◀ Back <kbd>←</kbd></button>
  <button type="button" class="tdx-btn go" onclick="tdxNext('${uid}')">Next ▶ <kbd>Space</kbd></button>
  <button type="button" class="tdx-btn" id="tdx-auto-${uid}" onclick="tdxAuto('${uid}')">Auto</button>
  <button type="button" class="tdx-btn" onclick="tdxAll('${uid}')">Skip ⏭</button>
  <div class="tdx-chap" id="tdx-chap-${uid}" onpointerdown="tdxSeek('${uid}',event)" title="Click or drag to go anywhere in the episode">${chapHtml(scr)}<span class="head"></span></div>
  <span class="tdx-count" id="tdx-count-${uid}">0 / ${scr.steps.length}</span>
  <button type="button" class="tdx-btn" onclick="tdxTv()">TV mode</button>
  <button type="button" class="tdx-btn" onclick="tdxSwitchViewer('classic')" title="Back to the classic screens">Classic</button>
</div>
<details class="tdx-script"><summary>Script</summary><div class="tdx-lines" id="tdx-lines-${uid}">${scriptHtml(scr)}</div></details>
</div>`;
  return { ...classicScreen, id: classicScreen.id, label: classicScreen.label, html, stepped: true };
}

// ══════════════════════════════════════════════════════════════════════
// PAINT — keyed updates: the set rebuilds only when the scene changes, people never blink out
// ══════════════════════════════════════════════════════════════════════
const blip = { n: 0 };
function sync(uid) {
  const R = reg()[uid];
  const root = typeof document !== 'undefined' ? document.querySelector(`.tdx[data-uid="${uid}"]`) : null;
  if (R && root && root.dataset.idx == null) { R.idx = -1; stopAuto(R); R.wk = null; R.sceneAt = null; if (R.isMap) { R.mode = 'map'; R.scr = null; } }
  return R;
}
// the rides into an arrival: the show's own vehicles (the user's cut-outs, 2026-10-08) and, for the
// jet, the tram and the canoe, a flat drawing. A ride can carry people (the yacht's deck).
const SPRITE = { bus: 1, helicopter: 1, boat: 1, yacht: 1 };
const DECK = { yacht: [[.2, .3], [.3, .29], [.4, .3], [.62, .17], [.7, .17]], boat: [[.22, .47], [.32, .47], [.75, .5]], bus: [], helicopter: [] };
function rideHtml(kind, riders = []) {
  if (!SPRITE[kind]) return RIDE[kind] || '';
  const deck = (DECK[kind] || []).slice(0, riders.length);
  return `<div class="veh"><img src="assets/sets/td/sprites/rides/${kind}.webp" alt="">${kind === 'helicopter' ? '<i class="rotor"></i><i class="rotor tail"></i>' : ''}`
    + deck.map(([x, y], i) => `<img class="rider" style="left:${x * 100}%;top:${y * 100}%;--i:${i}" src="${esc(avatar(riders[i]))}" alt="">`).join('') + '</div>';
}
// a vehicle that pulls up and stops exactly where the user's frame paints it (the Lame-o-sine at the
// end of the red carpet, Stawaki's clown boat at the end of the pier), in % of the frame; it stands
// among the people (behind whoever is nearer the camera) and smokes from its exhaust
const PARK = { limo: { l: 28.5, t: 49, w: 47.25, z: 60, from: 'L', smoke: [.03, .8] }, clownboat: { l: 24.75, t: -1.6, w: 75.7, z: 70, from: 'R', smoke: null } };
function parked(castEl, kind, cls) {
  const P = PARK[kind], d = document.createElement('div');
  d.className = `tdx-park ${kind} ${cls}`; d.style.cssText = `left:${P.l}%;top:${P.t}%;width:${P.w}%;z-index:${P.z}`;
  d.innerHTML = `<img src="assets/sets/td/sprites/rides/${kind}.webp" alt="">`;
  castEl.querySelectorAll(`.tdx-park.${kind}`).forEach(x => x.remove());
  castEl.appendChild(d); return d;
}
function smoke(fxEl, d, P, ms) {
  if (!P.smoke) return;
  const end = Date.now() + ms;
  const tick = () => { if (!d.isConnected || Date.now() > end) return; const f = fxEl.getBoundingClientRect(), r = d.getBoundingClientRect();
    if (f.width) fxAt(fxEl, 'tdx-puff', (r.left + r.width * P.smoke[0] - f.left) / f.width * 100, (r.top + r.height * P.smoke[1] - f.top) / f.height * 100, '', 1800);
    setTimeout(tick, 120); };
  tick();
}
const ANVIL = '<svg viewBox="0 0 120 80"><path d="M14 10h92v14c-14 2-22 8-24 18h-44c-2-10-10-16-24-18z" fill="#4a4f5c" stroke="#111" stroke-width="5"/><path d="M38 42h44l8 26H30z" fill="#3a3e48" stroke="#111" stroke-width="5"/><path d="M22 70h76v8H22z" fill="#2a2d35" stroke="#111" stroke-width="4"/><path d="M20 14h70" stroke="#8a90a0" stroke-width="4"/></svg>';
const PHONE = '<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="27" fill="#2fbf71" stroke="#111" stroke-width="4"/><path d="M19 17c3-3 6-3 8 0l3 5c1 2 0 4-2 5l-2 1c2 5 5 8 10 10l1-2c1-2 3-3 5-2l5 3c3 2 3 5 0 8-3 3-7 4-11 2-9-4-16-11-20-20-2-4-1-7 3-10z" fill="#fff"/></svg>';
const RIDE_SFX = { limo: 'engine', clownboat: 'motor', bus: 'engine', helicopter: 'rotor', boat: 'motor', yacht: 'motor', jet: 'jetroar', tram: 'engine', canoe: 'splash' };
const RIDE = {
  jet: '<svg viewBox="0 0 320 120"><path d="M20 62q0-20 30-22h220q30 2 44 22-14 20-44 22H50q-30-2-30-22z" fill="#2c2c34" stroke="#111" stroke-width="4"/><path d="M60 40l-26-34h28l40 34z" fill="#2c2c34" stroke="#111" stroke-width="4"/><path d="M150 70l-30 40h40l40-40z" fill="#1c1c22" stroke="#111" stroke-width="4"/><circle cx="64" cy="22" r="10" fill="#e8a23a"/>' + Array.from({ length: 8 }, (_, i) => `<rect x="${110 + i * 22}" y="54" width="12" height="9" rx="2" fill="#7ac8e8"/>`).join('') + '<circle cx="110" cy="96" r="9" fill="#222"/><circle cx="230" cy="96" r="9" fill="#222"/></svg>',
  tram: '<svg viewBox="0 0 260 110"><rect x="10" y="20" width="110" height="56" rx="10" fill="#f2c83a" stroke="#2a2a3a" stroke-width="4"/><rect x="130" y="30" width="120" height="46" rx="8" fill="#f2c83a" stroke="#2a2a3a" stroke-width="4"/><path d="M14 20h102M134 30h112" stroke="#d33a3a" stroke-width="8"/><circle cx="40" cy="86" r="11" fill="#222"/><circle cx="96" cy="86" r="11" fill="#222"/><circle cx="160" cy="86" r="11" fill="#222"/><circle cx="222" cy="86" r="11" fill="#222"/></svg>',
  canoe: '<svg viewBox="0 0 200 60"><path d="M6 24q94 34 188 0q-10 26-94 28Q16 50 6 24z" fill="#a8622e" stroke="#3a1e0a" stroke-width="4"/><path d="M30 30h140" stroke="#e8c070" stroke-width="5"/><path d="M150 6l-34 44" stroke="#6a3a18" stroke-width="5"/></svg>',
};
// the speaker's team as it stood that episode (merged: the merged tribe), and its colour
function teamOfSpeaker(epNum, name) {
  const ep = (window.gs?.episodeHistory || []).find(e => e.num === +epNum);
  const t = (ep?.tribesAtStart || []).find(x => (x.members || []).includes(name));
  const tname = t?.name || (window.players || []).find(x => x.name === name)?.tribe;
  if (!tname) return null;
  let color = '#4fb84a'; try { color = window.tribeColor ? window.tribeColor(tname) : color; } catch { /* default */ }
  return { name: tname, color };
}
function paint(uid, fresh) {
  const R = reg()[uid];
  if (!R || typeof document === 'undefined') return;
  const root = document.querySelector(`.tdx[data-uid="${uid}"]`);
  const st = document.getElementById(`tdx-st-${uid}`);
  if (!root || !st) return;
  root.dataset.idx = String(R.idx);
  const scr = R.scr, L = ledgerAt(scr, R.idx), s = L.step || {};
  clearInterval(R.typing);
  const world = st.querySelector('.tdx-world'), cast = st.querySelector('.tdx-cast'), fx = st.querySelector('.tdx-fx');
  // the set: rebuilt only on a new place (or into and out of the confessional)
  const wk = worldKey(scr, L) + (L.conf ? '' : '#' + scr.steps.indexOf(L.scene));
  const newWorld = R.wk !== wk;
  if (newWorld) {
    const wasConf = R.wk && R.wk.includes('/confessional');
    R.wk = wk;
    world.innerHTML = `${worldHtml(scr, L)}<div class="tdx-cast"></div><div class="tdx-fx"></div>`;
    liveGL(world);
    if (fresh && (L.conf || wasConf)) { const bz = st.querySelector('.tdx-static'); bz.classList.remove('burst'); void bz.offsetWidth; bz.classList.add('burst'); sfx('static'); }
    else if (fresh && L.scene?.cut) sfx('whoosh');
  }
  const castEl = world.querySelector('.tdx-cast'), fxEl = world.querySelector('.tdx-fx');
  // the people: keyed by name, updated in place
  const toks = castAt(scr, L);
  const have = new Map([...castEl.children].map(el => [el.dataset.n, el]));
  for (const t of toks) {
    const tmp = document.createElement('div'); tmp.innerHTML = tokHtml(t, fresh); const el = tmp.firstElementChild;
    const old = have.get(t.n);
    if (old) { old.className = el.className; old.setAttribute('style', el.getAttribute('style')); old.querySelector('.body').innerHTML = el.querySelector('.body').innerHTML; have.delete(t.n); }
    else castEl.appendChild(el);
  }
  for (const el of have.values()) if (!el.classList.contains('tdx-park')) el.remove();
  // a vehicle already standing in the shot (the Lame-o-sine before it pulls away, the boat at the pier)
  const pk = L.step?.parked || L.scene?.parked;
  if (pk && PARK[pk] && !castEl.querySelector(`.tdx-park.${pk}`)) parked(castEl, pk, '');
  // the camera: in on the conversation, leaning toward whoever talks; wide for the set itself
  const shot = shotOf(scr, L, toks);
  if (shot.k > 1) {
    st.classList.add('push');
    world.style.transform = `translate(${(shot.x * 100).toFixed(2)}%, ${(shot.y * 100).toFixed(2)}%) scale(${shot.k})`;
    for (const el of castEl.children) el.classList.toggle('offshot', !shot.who.includes(el.dataset.n));
  } else {
    st.classList.remove('push'); world.style.transform = '';
    for (const el of castEl.children) el.classList.remove('offshot');
  }
  st.classList.toggle('tense', L.tense);
  // the HUD
  st.querySelector('.tdx-hud').innerHTML = hudHtml(scr, L, fresh, R.o);
  // the line
  const d = dialogue(scr, L);
  const dlg = st.querySelector('.tdx-dlg');
  dlg.className = `tdx-dlg${/hidden/.test(d.cls) || !d.text ? ' hidden' : ''}${L.conf ? ' conf' : ''}`;
  if (R.o.teamColor) dlg.style.setProperty('--tc', R.o.teamColor);
  const cut = dlg.querySelector('.tdx-cut');
  const cutWho = d.cut || d.hostCut || (s.k === 'conf' ? null : null);
  dlg.style.setProperty('--cut', cutWho ? '15%' : '0%');
  if (cutWho) { const src = avatar(cutWho, !!d.hostCut); if (cut.dataset.who !== cutWho) { cut.innerHTML = `<img src="${esc(src)}" alt="">`; cut.dataset.who = cutWho; if (fresh) { cut.classList.remove('fresh'); void cut.offsetWidth; cut.classList.add('fresh'); } } cut.style.display = ''; }
  else { cut.style.display = 'none'; cut.dataset.who = ''; }
  const nm = dlg.querySelector('.name'); nm.className = `name ${d.cls.replace('hidden', '')}`; nm.textContent = d.name || '';
  // who is talking: their team (in its colour) on every line; in a confessional, the lower third, with
  // age and job the first episode they are introduced
  const sub = dlg.querySelector('.sub'), who = (s.k === 'say' || s.k === 'conf') && !s.host ? s.by : null;
  const team = who ? teamOfSpeaker(scr.ep, who) : null;
  if (team) { dlg.style.setProperty('--tc', team.color); dlg.style.setProperty('--stc', team.color); }
  if (!sub) { /* a box built without the lower third: nothing to show */ }
  else if (who && L.conf && team) {
    const p = (window.players || []).find(x => x.name === who) || {};
    const intro = +scr.ep === 1 ? [p.age ? `${p.age}` : '', p.occupation || ''].filter(Boolean) : [];
    // the caption under them this episode, and how it's shot (td/story/captions.js)
    const extra = [s.cap ? `<span class="cap">${esc(s.cap)}</span>` : '', s.stage ? `<i class="stg">(${esc(s.stage)})</i>` : ''].join('');
    sub.innerHTML = `<b>${esc(team.name)}</b>${intro.map(t => `<span>${esc(t)}</span>`).join('')}${extra}`; sub.classList.add('on');
  } else { sub.classList.remove('on'); sub.innerHTML = ''; }
  const say = dlg.querySelector('.say'); say.className = `say${d.cls.includes('dir') ? ' dir' : ''}${d.quote ? ' quote' : ''}`;
  const names = Object.keys(L.scene?.places || {});
  const lit = text => esc(text).replace(names.length ? new RegExp(`\\b(${names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'g') : /^\b$/, '<span class="hn">$1</span>')
    .replace(/\b(alliance|vote|votes|idol|immunity|marshmallow|elimination|tonight|blindside|final two)\b/gi, '<span class="hg">$1</span>');
  const badge = d.badge ? `<span class="badge">${esc(d.badge.text)}</span>` : '';
  if (!fresh || !d.text || d.text.length < 44) { say.innerHTML = badge + lit(d.text || ''); if (fresh) { say.classList.remove('punch'); void say.offsetWidth; say.classList.add('punch'); } }
  else {
    let n = 0, wait = 0; const full = d.text;
    R.typing = setInterval(() => {
      if (wait > 0) { wait--; return; }
      n += full.length > 160 ? 3 : 2;
      say.innerHTML = badge + esc(full.slice(0, n)) + '<span class="caret"></span>';
      if ((blip.n++ % 2) === 0 && !d.cls.includes('dir')) sfx('blip');
      const ch = full[Math.min(n, full.length) - 1];
      if (/[.!?…]/.test(ch) && n < full.length) wait = 9; else if (/[,;:—]/.test(ch) && n < full.length) wait = 4;
      if (n >= full.length) { clearInterval(R.typing); say.innerHTML = badge + lit(full); }
    }, 16);
  }
  if (fresh && s.loud) { dlg.classList.remove('loud'); void dlg.offsetWidth; dlg.classList.add('loud'); }
  // what happens, animated
  if (fresh) act(st, castEl, fxEl, scr, L, s, toks);
  // Intel
  const intel = st.querySelector('.tdx-intel');
  intel.innerHTML = intelHtml(scr, L, R.tab, fresh, R.relWho);
  st.querySelector('.tdx-ibtn').classList.toggle('new', fresh && L.side.some(x => x.at === R.idx) && !st.classList.contains('intel-open'));
  // the script, the counter, the chapters
  document.getElementById(`tdx-lines-${uid}`)?.querySelectorAll('[data-s]').forEach(ln => { const i = +ln.dataset.s; ln.classList.toggle('vis', i <= R.idx); ln.classList.toggle('now', i === R.idx); });
  const cnt = document.getElementById(`tdx-count-${uid}`); if (cnt) cnt.textContent = `${Math.max(0, R.idx + 1)} / ${scr.steps.length}`;
  const starts = scr.steps.map((x, i) => (x.k === 'scene' ? i : -1)).filter(i => i >= 0); starts.push(scr.steps.length);
  const chEl = document.getElementById(`tdx-chap-${uid}`);
  chEl?.querySelectorAll('i').forEach(seg => { const b = seg.firstElementChild, a = +seg.dataset.a, z = +seg.dataset.z; b.style.width = (R.idx >= z ? 100 : R.idx < a ? 0 : ((R.idx - a + 1) / (z - a)) * 100) + '%'; });
  const head = chEl?.querySelector('.head'); if (head) head.style.left = `${(Math.max(0, R.idx + 1) / scr.steps.length) * 100}%`;
  // the place's sound
  ambience(worldSound(scr, L));
}

// the mark over a face at the reading: drawn, not typed (shock, a sweat drop, an anger vein, the side-eye of a betrayal)
const FEEL_MARK = {
  shock: '<svg viewBox="0 0 24 24"><path d="M9 2h6l-1.4 13h-3.2z" fill="#ff5a4f" stroke="#1a0e02" stroke-width="1.4"/><circle cx="12" cy="20" r="2.3" fill="#ff5a4f" stroke="#1a0e02" stroke-width="1.4"/></svg>',
  surprised: '<svg viewBox="0 0 24 24"><path d="M10.2 3h3.6l-.9 11h-1.8z" fill="#ffd34d" stroke="#1a0e02" stroke-width="1.3"/><circle cx="12" cy="19" r="2" fill="#ffd34d" stroke="#1a0e02" stroke-width="1.3"/></svg>',
  scared: '<svg viewBox="0 0 24 24"><path d="M12 2C9 8 6.5 11 6.5 15a5.5 5.5 0 0 0 11 0C17.5 11 15 8 12 2z" fill="#9ad8ff" stroke="#1a0e02" stroke-width="1.4"/><path d="M9.5 15.5a2.6 2.6 0 0 0 2 2.3" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/></svg>',
  angry: '<svg viewBox="0 0 24 24"><g fill="none" stroke="#e0473f" stroke-width="2.8" stroke-linecap="round"><path d="M4 9c3 0 5-2 5-5"/><path d="M20 9c-3 0-5-2-5-5"/><path d="M4 15c3 0 5 2 5 5"/><path d="M20 15c-3 0-5 2-5 5"/></g></svg>',
  betray: '<svg viewBox="0 0 24 24"><path d="M4 12c3-5 13-5 16 0-3 5-13 5-16 0z" fill="#fff" stroke="#1a0e02" stroke-width="1.4"/><circle cx="9" cy="12" r="2.6" fill="#b56cff" stroke="#1a0e02" stroke-width="1"/></svg>',
  guilty: '<svg viewBox="0 0 24 24"><path d="M5 9h14M7 14c3 2 7 2 10 0" fill="none" stroke="#c8ccd8" stroke-width="2.2" stroke-linecap="round"/></svg>',
  relief: '<svg viewBox="0 0 24 24"><g fill="none" stroke="#bfe8ff" stroke-width="2.2" stroke-linecap="round"><path d="M3 10c4-2 7 2 11 0s5-1 7 0"/><path d="M5 15c3-1.5 6 1.5 9 0s4-1 5 0"/></g></svg>',
};
const FEEL_SFX = { shock: 'shock', betray: 'shock', angry: 'slap', surprised: 'pop' };
const tokAt = (castEl, n) => [...castEl.children].find(el => el.dataset.n === n);
const centre = (st, el) => { const f = st.querySelector('.tdx-world').getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: (r.left + r.width / 2 - f.left) / f.width * 100, y: (r.top - f.top) / f.height * 100, h: r.height / f.height * 100 }; };
function fxAt(fxEl, cls, x, y, html = '', life = 2400) { const d = document.createElement('div'); d.className = cls; d.style.left = x + '%'; d.style.top = y + '%'; d.innerHTML = html; fxEl.appendChild(d); setTimeout(() => d.remove(), life); return d; }

function act(st, castEl, fxEl, scr, L, s, toks) {
  const speaker = s.k === 'say' ? s.by : null;
  if (speaker) tokAt(castEl, speaker)?.classList.add('pop');
  // a shock: the line lands like a reveal ("What? No."): the speaker jolts, "!?" over them, the stab
  if (s.shock && speaker) { const el = tokAt(castEl, speaker); if (el) { el.classList.add('shake'); const c = centre(st, el); fxAt(fxEl, 'tdx-pop shock', c.x, Math.max(c.y - 4, 10), '!?'); } const w = st.querySelector('.tdx-world'); if (w) { w.classList.remove('jolt'); void w.offsetWidth; w.classList.add('jolt'); } sfx('shock'); }
  else if (s.loud && speaker) { const el = tokAt(castEl, speaker); if (el) { const c = centre(st, el); for (let k = 0; k < 3; k++) setTimeout(() => fxAt(fxEl, 'tdx-ring', c.x, c.y + c.h / 2), k * 140); sfx('boing'); } }
  // the faces at the reading (steps.js voteReaction): a mark over each face that feels something
  if (s.feel) for (const [n, f] of Object.entries(s.feel)) {
    const el = tokAt(castEl, n); if (!el || !FEEL_MARK[f]) continue;
    const c = centre(st, el);
    fxAt(fxEl, 'tdx-mark', c.x + c.h * 0.18, Math.max(c.y - 2, 8), FEEL_MARK[f], 1700);
    if (f === 'sad' || f === 'guilty') for (let k = 0; k < (f === 'sad' ? 3 : 1); k++) setTimeout(() => fxAt(fxEl, 'tdx-tear', c.x + (k % 2 ? 1.2 : -1.2), c.y + c.h * .25, '', 1400), 300 + k * 280);
    if (FEEL_SFX[f]) sfx(FEEL_SFX[f]);
  }
  const a = s.act;
  if (s.gain) { const el = tokAt(castEl, s.gain.who); if (el) { const c = centre(st, el); setTimeout(() => fxAt(fxEl, `tdx-gain${s.gain.up ? '' : ' down'}`, c.x, Math.max(c.y - 2, 8), `${esc(s.gain.stat)} ${s.gain.up ? '▲' : '▼'}`, 2200), 500); setTimeout(() => sfx(s.gain.up ? 'pop' : 'slap'), 500); } }
  if (a) {
    const who = (a.who || []).filter(n => tokAt(castEl, n));
    if (a.kind === 'laugh') who.forEach(n => tokAt(castEl, n).classList.add('laugh'));
    if (a.kind === 'shake') { who.forEach(n => tokAt(castEl, n).classList.add('shake')); const el = tokAt(castEl, who[who.length - 1] || ''); if (el) { const c = centre(st, el); fxAt(fxEl, 'tdx-pop', c.x, Math.max(c.y - 4, 10), 'WHAM!'); } sfx('slap'); }
    if (a.kind === 'storm' && who[0]) { tokAt(castEl, who[0]).classList.add('storm'); sfx('slam'); const c = centre(st, tokAt(castEl, who[0])); fxAt(fxEl, 'tdx-pop', c.x, Math.max(c.y - 4, 10), 'SLAM!'); }
    if (a.kind === 'shout' && who[0]) { const c = centre(st, tokAt(castEl, who[0])); for (let k = 0; k < 3; k++) setTimeout(() => fxAt(fxEl, 'tdx-ring', c.x, c.y + c.h / 2), k * 140); sfx('boing'); }
    // a group ride: the bus, the helicopters, the jet, the tram crosses the set (arrival.js)
    if (a.kind === 'ride') { const R = rideHtml(a.ride, a.riders || []); if (R) { fxAt(fxEl, `tdx-ride big ${a.ride}`, 50, a.ride === 'helicopter' ? 40 : a.y || 72, R, 4600);
      sfx(RIDE_SFX[a.ride] || 'whoosh'); if (a.ride === 'yacht' || a.ride === 'boat') setTimeout(() => sfx('horn'), 1500); } }
    if (a.kind === 'arrive') who.forEach(n => { const el = tokAt(castEl, n); el.classList.remove('arrive'); void el.offsetWidth; el.classList.add('arrive'); sfx('whoosh');
      // what brought them: a boat or canoe glides in and pulls away, a bus pulls up, or they just walk in
      if (a.ride && a.ride !== 'walk' && el) { const c = centre(st, el); fxAt(fxEl, `tdx-ride ${a.ride}`, c.x, c.y + c.h * .9, rideHtml(a.ride), 2600); sfx(RIDE_SFX[a.ride] || 'whoosh'); } else if (el) el.classList.add('walkin'); });
    if (a.kind === 'train') who.forEach(n => tokAt(castEl, n).classList.add('train'));
    if (a.kind === 'gust') { who.forEach(n => tokAt(castEl, n).classList.add('shake')); sfx('thunder'); const fl = fxAt(fxEl, 'tdx-bolt', 50, 0, '', 900); fl.style.left = '0'; }
    if (a.kind === 'hurt' && who[0]) { tokAt(castEl, who[0]).classList.add('shake'); const c = centre(st, tokAt(castEl, who[0])); fxAt(fxEl, 'tdx-pop', c.x, Math.max(c.y - 4, 10), 'OW!'); sfx('slap'); }
    // a head-to-head (contest.js): each of them doing THE challenge, the one ahead steadier, and what
    // the challenge throws off (sparks at a fire, chips off a rope, water, puzzle pieces, dust)
    if (a.kind === 'contest') {
      const FX = { fire: ['tdx-spark', 6], chop: ['tdx-chip', 4], carry: ['tdx-drop', 4], puzzle: ['tdx-qmark', 2], push: ['tdx-dust', 3], race: ['tdx-dust', 3], climb: ['tdx-dust', 2], balance: ['', 0], hold: ['', 0] };
      const [cls, n] = FX[a.style] || ['', 0];
      who.forEach((name, j) => {
        const el = tokAt(castEl, name);
        el.classList.add('vs', `vs-${a.style}`);
        el.classList.toggle('vs-lead', name === a.lead);
        el.style.setProperty('--vsd', `${(j % 2 ? -1 : 1)}`);
        if (!cls) return;
        const c = centre(st, el);
        for (let k = 0; k < n; k++) setTimeout(() => { const d = fxAt(fxEl, cls, c.x + (Math.random() - .5) * c.h * .5, c.y + c.h * (cls === 'tdx-qmark' ? -.55 : .42), cls === 'tdx-qmark' ? '?' : '', 1300); d.style.setProperty('--dx', `${(Math.random() - .5) * 6}cqw`); }, k * 160 + j * 80);
      });
      const SND = { fire: 'hiss', chop: 'slap', carry: 'splash', puzzle: 'pop', push: 'boing', race: 'boing', climb: 'pop' };
      if (SND[a.style] && s.k === 'beat') sfx(SND[a.style]);
    }
    if (a.kind === 'roundwin') {
      who.forEach(n => { const el = tokAt(castEl, n); el.classList.remove('vs', 'sad'); el.classList.add('cheer'); const c = centre(st, el); fxAt(fxEl, 'tdx-pop', c.x, Math.max(c.y - 4, 10), 'YES!'); });
      (a.lose || []).forEach(n => { const el = tokAt(castEl, n); if (el) { el.classList.remove('vs', 'vs-lead'); el.classList.add('sad'); } });
      sfx('cheer');
    }
    if (a.kind === 'cry') who.forEach(n => { const el = tokAt(castEl, n); el.classList.add('sad'); const c = centre(st, el); for (let k = 0; k < 4; k++) setTimeout(() => fxAt(fxEl, 'tdx-tear', c.x + (k % 2 ? 1.2 : -1.2), c.y + c.h * .25, '', 1400), k * 260); });
    if (a.kind === 'fire') who.forEach(n => { const el = tokAt(castEl, n); el.classList.add('fired'); const c = centre(st, el); fxAt(fxEl, 'tdx-aura', c.x, c.y + c.h / 2, '', 2400); sfx('title'); });
    if (a.kind === 'rest') who.forEach(n => tokAt(castEl, n).classList.add('act-nap'));
    if (a.kind === 'search' && who[0]) { const el = tokAt(castEl, who[0]); el.classList.add('search'); for (let k = 0; k < 5; k++) setTimeout(() => { const c = centre(st, el); fxAt(fxEl, 'tdx-dust', c.x, c.y + c.h * .95, '', 900); sfx('slip'); }, 300 + k * 520); }
    // One Final Choice: walk to the torch and lift it (the flame comes along), or turn away from it
    if (a.kind === 'torch' && who[0]) { const el = tokAt(castEl, who[0]); if (el) {
      if (a.take) { el.style.left = `${a.tu * 100}%`; setTimeout(() => { el.classList.add('carry'); sfx('torch'); }, 1100); setTimeout(() => el.classList.add('pathR'), 2200); }
      else { el.style.left = `${(a.tu - .12) * 100}%`; setTimeout(() => { el.classList.add('pathL'); sfx('empty'); }, 1500); } } }
    // the exit car or boat pulls up to its painted spot, or pulls away from it
    if ((a.kind === 'park' || a.kind === 'depart') && PARK[a.ride]) { const P = PARK[a.ride], go = a.kind === 'depart';
      const was = go ? castEl.querySelector(`.tdx-park.${a.ride}`) : null;
      const d = was ? (was.classList.add('out'), was) : parked(castEl, a.ride, go ? 'out' : `in${P.from}`); smoke(fxEl, d, P, go ? 4600 : 3800);
      sfx(RIDE_SFX[a.ride]); if (a.ride === 'clownboat') setTimeout(() => sfx('horn'), go ? 100 : 2600); }
    // the walk to the car, seen from behind it: smaller with every step, then in through the door
    if (a.kind === 'approach' && who[0]) { const el = tokAt(castEl, who[0]); if (el) { const h0 = parseFloat(el.style.height), w0 = parseFloat(el.style.width);
      el.classList.add('going'); el.style.transition = 'left 3s linear,top 3s linear,height 3s linear,width 3s linear,opacity .6s linear 2.7s';
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.left = `${a.tu * 100}%`; el.style.top = `${a.tv * 100}%`; el.style.height = `${a.th}%`; el.style.width = `${(w0 * a.th / h0).toFixed(2)}%`; el.style.opacity = '0'; }));
      setTimeout(() => sfx('slam'), 3200); } }
    // a jump off the pier down into the boat
    if (a.kind === 'hop' && who[0]) { const el = tokAt(castEl, who[0]); if (el) { el.style.transition = 'left .9s ease-out,top .9s cubic-bezier(.3,-1.4,.6,1),opacity .4s linear .9s';
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.left = `${a.tu * 100}%`; el.style.top = `${a.tv * 100}%`; el.style.opacity = '0'; }));
      sfx('boing'); setTimeout(() => sfx('drop'), 900); } }
    // the Summit: up to the pedestal, and the gift's name over it
    if (a.kind === 'pick' && who[0]) { const el = tokAt(castEl, who[0]); if (el) { el.style.left = `${a.tu * 100}%`;
      setTimeout(() => { const c = centre(st, el); fxAt(fxEl, 'tdx-pop', c.x, Math.max(c.y - 4, 10), esc(a.label || ''), 2600); sfx('title'); }, 900); } }
    // the Aftermath: an anvil for a lie, a stamp for the truth, the tape rolling, the phone ringing
    if (a.kind === 'anvil' && who[0]) { const el = tokAt(castEl, who[0]); if (el) { const c = centre(st, el); fxAt(fxEl, 'tdx-anvil', c.x, c.y, ANVIL, 2200); setTimeout(() => { el.classList.add('shake'); fxAt(fxEl, 'tdx-pop', c.x, Math.max(c.y - 2, 8), 'CLANG!'); sfx('slam'); }, 520); } }
    if (a.kind === 'truth' && who[0]) { const el = tokAt(castEl, who[0]); if (el) { const c = centre(st, el); fxAt(fxEl, 'tdx-stamp', c.x, c.y + c.h * .45, 'TRUTH', 2400); sfx('safe'); } }
    if (a.kind === 'tape') { fxAt(fxEl, 'tdx-tape', 0, 0, '<i></i><b>PLAY ▶</b>', 2600); sfx('static'); }
    if (a.kind === 'phone') { fxAt(fxEl, 'tdx-phone', 86, 18, PHONE, 1800); sfx('blip'); setTimeout(() => sfx('blip'), 220); }
    // stepping down off the bus: a little drop and settle, the door's hiss
    if (a.kind === 'step' && who[0]) { const el = tokAt(castEl, who[0]); if (el) { el.classList.remove('stepoff'); void el.offsetWidth; el.classList.add('stepoff'); } sfx('hiss'); }
    // the last step aboard the Boat of Losers: walk off toward the boat, the horn, the motor
    if (a.kind === 'board' && who[0]) { const el = tokAt(castEl, who[0]); if (el) setTimeout(() => el.classList.add('board'), 600); setTimeout(() => sfx('horn'), 1400); setTimeout(() => sfx('motor'), 2200); }
    // the Drop of Shame (World Tour): to the hatch, a run, and out into the sky
    if (a.kind === 'jump' && who[0]) { const el = tokAt(castEl, who[0]); if (el) { el.style.left = `${a.tu * 100}%`; setTimeout(() => { el.classList.add('jump'); sfx('whoosh'); sfx('wind'); }, 1300); } }
    // and the parachute opens
    if (a.kind === 'chute' && who[0]) { const el = tokAt(castEl, who[0]); if (el) { el.classList.add('chute'); setTimeout(() => sfx('pop'), 700); } sfx('wind'); }
    if (a.kind === 'path' && who[0]) { const el = tokAt(castEl, who[0]); setTimeout(() => el.classList.add(a.dir === 'L' ? 'pathL' : 'pathR'), 250); sfx(a.lit ? 'torch' : 'snuff'); }
    if ((a.kind === 'lean' || a.kind === 'hug' || a.kind === 'kiss') && who.length >= 1) {
      const pair = who.length >= 2 ? who.slice(0, 2) : [who[0], toks.find(t => t.n !== who[0] && !t.bg && !t.host)?.n].filter(Boolean);
      if (pair.length === 2) {
        const [l, r] = pair.map(n => ({ n, el: tokAt(castEl, n) })).filter(x => x.el).sort((x, y) => centre(st, x.el).x - centre(st, y.el).x);
        if (l && r) { l.el.classList.add('leanR'); r.el.classList.add('leanL');
          if (a.kind === 'kiss' || a.kind === 'hug') { const c1 = centre(st, l.el), c2 = centre(st, r.el); fxAt(fxEl, 'tdx-heart', (c1.x + c2.x) / 2, Math.min(c1.y, c2.y), '<svg viewBox="0 0 24 22"><path d="M12 21s-9-6-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 12-9 12z" fill="#ff5a7a" stroke="#1a0e14" stroke-width="1.5"/></svg>'); sfx('heart'); } }
      }
    }
  }
  if (s.k === 'title') { sfx(s.shock ? 'shock' : s.sting ? 'sting' : 'title'); if (s.shock) { const w = st.querySelector('.tdx-world'); if (w) { w.classList.remove('jolt'); void w.offsetWidth; w.classList.add('jolt'); } } }
  if (s.k === 'ballot') { sfx('slip'); if (s.venue === 'world-tour') setTimeout(() => sfx('slam'), 1150); else { sfx('scribble'); setTimeout(() => sfx('drop'), 2700); } }
  if (s.k === 'ballots') sfx('slip');
  if (s.k === 'idol' || s.k === 'power') sfx('idol');
  if (s.applause) sfx(s.applause === 'boo' ? 'boo' : s.applause === 'big' ? 'cheer' : 'applause');
  if (s.k === 'out') sfx('out');
  if (s.k === 'found') sfx(s.item ? 'idol' : 'empty');
  if (s.k === 'title' && s.vs) sfx('thunder');
  if (s.k === 'intro') { sfx('title'); setTimeout(() => sfx('pop'), 450); }
  if (s.k === 'read') { fxAt(fxEl, `tdx-voteslip${s.dead ? ' dead' : ''}`, 50, 30, esc(s.vote), 1800); sfx('slip'); }
  if (s.k === 'safe') {
    const host = toks.find(t => t.host); const to = tokAt(castEl, s.who);
    if (to) {
      const from = host ? { x: host.u * 100, y: host.v * 100 - host.h * .6 } : { x: 64, y: 46 };
      const c = centre(st, to);
      const d = document.createElement('div'); d.className = 'tdx-toss'; fxEl.appendChild(d);
      sfx('whoosh');
      const anim = d.animate([{ left: from.x + '%', top: from.y + '%', transform: 'rotate(0)' }, { left: (from.x + c.x) / 2 + '%', top: Math.min(from.y, c.y) - 22 + '%', transform: 'rotate(260deg)', offset: .5 }, { left: c.x + '%', top: c.y + '%', transform: 'rotate(520deg)' }], { duration: s.last ? 1100 : 700, easing: 'cubic-bezier(.3,.6,.4,1)' });
      anim.onfinish = () => { d.remove(); sfx(s.last ? 'safe' : 'pop'); if (s.last) fxAt(fxEl, 'tdx-pop', c.x, c.y - 4, 'SAFE!'); };
    }
  }
  if (s.k === 'beat' && s.walk) { const el = tokAt(castEl, s.walk); if (el) setTimeout(() => el.classList.add('walk'), 300); }
}


// ══════════════════════════════════════════════════════════════════════
// THE CAMP MAP — camp as a place you explore (map.js decides what is where; this draws it)
// ══════════════════════════════════════════════════════════════════════
// Three modes on one stage: 'map' (the whole camp from above, a pin on every place with who is
// there and what is being said), 'zone' (inside one place: the people, a bubble over each
// conversation), 'talk' (one conversation, played by paint() exactly like a linear camp screen).
// Next always walks the conversations in story order; the clock moves on when a time window's
// key conversations have been watched.
const VENUE_PUBLIC = { redemption: 'skull-beach', 'hosted-camp': 'communal-grounds', 'survival-island': 'campfire', 'film-lot': 'studio-backlot', 'world-tour': 'economy', carnival: 'campsite' };
const VENUE_NAME = { redemption: 'Boney Island', 'hosted-camp': 'Camp Wawanakwa', 'survival-island': 'Soluna Island', 'film-lot': 'The Film Lot', 'world-tour': 'The Jumbo Jet', carnival: 'Stawaki' };
const ICON_BUBBLE = '<svg viewBox="0 0 24 24"><path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="currentColor"/></svg>';
const ICON_STAR = '<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" fill="currentColor"/></svg>';
const ICON_TICK = '<svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2.4" fill="none"/></svg>';

function mapShell(map, S, ep, o) {
  const uid = `tdm${esc(ep.num)}-${map.phase}-${map.camps.join('').replace(/[^\w-]/g, '').slice(0, 24)}`;
  const colors = Object.fromEntries(map.camps.map(c => [c, o.colorOf ? o.colorOf(c) : '#4fb84a']));
  // which conversations this viewer has watched, keyed by what the conversations ARE: a season run
  // again under the same name (a replay, a re-simulation) never inherits the last run's ticks
  // (the user, 2026-10-08: "some conversations appeared to be already read before I opened them")
  let fp = 0; for (const ch of map.convs.map(c => `${c.title}|${c.camp}|${c.place}|${(c.who || []).join(",")}`).join('~')) fp = (fp * 31 + ch.charCodeAt(0)) | 0;
  const seenKey = `tdm:${o.seasonName || ''}:${ep.num}:${map.phase}:${map.camps.join(',')}:${(fp >>> 0).toString(36)}`;
  let seen = new Set();
  try { seen = new Set(JSON.parse(globalThis.localStorage?.getItem(seenKey) || '[]')); } catch { /* per-viewer convenience */ }
  reg()[uid] = { isMap: true, map, ep: ep.num, mode: 'map', win: 0, zone: null, place: null, seen, seenKey, colors, story: false,
    scr: null, idx: -1, cur: null, auto: false, timer: null, typing: null, tab: null, wk: null, o: { teamColor: '#4fb84a' } };
  const label = map.title || `${map.phase === 'pre' ? 'Camp · Morning' : 'Camp · After the challenge'}`;
  const html = `<div class="tdx tdm-root" data-uid="${uid}" data-ambient="none">
<style>${TDX_FONTS}${TDX_CSS}${TDM_CSS}</style>
<div class="tdx-stage tdm-on" id="tdx-st-${uid}" onclick="tdmStage('${uid}')">
  <div class="tdx-world"></div>
  <div class="tdx-hud"><div class="tdx-title fresh"><div class="band"></div><div class="inner"><div class="kicker">Episode ${esc(ep.num)}</div><div class="big">${esc(label)}</div></div></div></div>
  <div class="tdx-dlg hidden"><div class="panel"></div><div class="tdx-cut"></div><div class="sub"></div><div class="name"></div><div class="say"></div><div class="nx"></div></div>
  <div class="tdm" id="tdm-${uid}" onclick="event.stopPropagation()"></div>
  <button type="button" class="tdx-ibtn" onclick="event.stopPropagation();tdxIntel('${uid}')"><i></i>Intel</button>
  <div class="tdx-intel" onclick="event.stopPropagation();tdxTab('${uid}',event)"></div>
  <div class="tdx-static"></div>
</div>
<div class="tdx-ctrl">
  <button type="button" class="tdx-btn" onclick="tdmMap('${uid}')">${map.title ? 'Island map' : 'Camp map'}</button>
  <button type="button" class="tdx-btn" onclick="tdxBack('${uid}')">◀ Back <kbd>←</kbd></button>
  <button type="button" class="tdx-btn go" onclick="tdxNext('${uid}')">Next ▶ <kbd>Space</kbd></button>
  <button type="button" class="tdx-btn" id="tdx-auto-${uid}" onclick="tdxAuto('${uid}')">Auto</button>
  <span class="tdx-count" id="tdm-count-${uid}">0 / ${map.convs.length} watched</span>
  <button type="button" class="tdx-btn" onclick="tdxTv()">TV mode</button>
  <button type="button" class="tdx-btn" onclick="tdxSwitchViewer('classic')" title="Back to the classic screens">Classic</button>
</div>
<details class="tdx-script"><summary>Script</summary><div class="tdx-lines" id="tdx-lines-${uid}"><div class="tdx-ln d">Open a conversation on the map to read its script.</div></div></details>
</div>`;
  // the sidebar names the screen: a shared camp's map is every team's, so it carries no team name
  const named = map.title ? S.label : map.camps.length > 1 ? (map.phase === 'pre' ? 'Camp' : 'Camp — After the challenge') : S.label;
  return { ...S, id: S.id, label: named, title: named, html, stepped: true, campMap: true };
}

const faceImg = (R, n, cls = '') => `<img class="${cls}" src="${esc(avatar(n))}" alt="${esc(n)}" title="${esc(n)}" style="--tc:${esc(R.colors[R.map.teamOf[n]] || '#c8c8c8')}">`;

function mapPaint(uid, fresh) {
  const R = reg()[uid];
  if (!R || typeof document === 'undefined') return;
  const root = document.querySelector(`.tdx[data-uid="${uid}"]`), st = document.getElementById(`tdx-st-${uid}`);
  if (!root || !st) return;
  root.dataset.idx = '0';
  clearInterval(R.typing);
  const M = R.map, open = openWindow(M, R.seen);
  if (R.win > open) R.win = open;
  const W = M.windows[R.win] || M.windows[0];
  const tod = W.night ? 'night' : 'day';
  const world = st.querySelector('.tdx-world'), layer = st.querySelector('.tdm');
  st.classList.remove('push', 'intel-open'); world.style.transform = ''; world.style.transformOrigin = '';
  st.classList.add('tdm-on'); layer.hidden = false;
  st.querySelector('.tdx-dlg').className = 'tdx-dlg hidden';
  const scr0 = { venue: M.venue, ep: R.ep, kind: 'camp', steps: [] };
  let plate, place, people = [], toks = '';
  const here = M.convs.filter(c => c.window === W.id && (R.mode !== 'zone' || c.zone === R.zone));
  if (R.mode === 'zone') {
    const placesHere = [...new Set(here.map(c => c.place))];
    place = R.place && placesHere.includes(R.place) ? R.place : (placesHere[0] || R.zone);
    const shown = place === 'confessional' ? (VENUE_PUBLIC[M.venue] || 'communal-grounds') : place;
    plate = plateKey(M.venue, teamSpot(M.venue, shown, M.slot), tod) || plateKey(M.venue, shown, tod) || plateKey(M.venue, VENUE_PUBLIC[M.venue] || 'communal-grounds', tod);
    const inPlace = here.filter(c => c.place === place);
    const talking = [...new Set(inPlace.flatMap(c => c.who))];
    const idle = (W.idle[R.zone] || []).filter(n => !talking.includes(n));
    people = [...talking, ...idle].slice(0, 9);
    const places = placeScene(plate, people.slice(0, 9), []);
    // a crowded room (a small galley at breakfast) draws everyone smaller, so faces do not stack
    const crowd = people.length > 6 ? 0.72 : people.length > 4 ? 0.86 : 1;
    R.crowd = crowd;
    toks = people.filter(n => places[n]).map(n => {
      const pl = places[n];
      return tokHtml({ n, u: pl.u, v: pl.v, h: Math.max(Math.min(pl.s * 125, 32), 15) * crowd, bg: !talking.includes(n), dim: !talking.includes(n) }, fresh);
    }).join('');
    R.place = place;
    R.places = places;
  } else {
    plate = plateKey(M.venue, 'map', tod);
  }
  const L = { scene: { plate, spot: R.mode === 'zone' ? place : 'map', place: R.mode === 'zone' ? (M.zones[R.zone]?.label || placeName(place)) : M.title ? M.title : (M.camps.length !== 1 || M.camps[0] === 'merge' ? (VENUE_NAME[M.venue] || 'Camp') : MAP_VENUES[M.venue]?.shared ? `${VENUE_NAME[M.venue] || 'Camp'} — ${M.camps[0]}` : `${M.camps[0]} Camp`), time: W.time }, safe: [], side: [], step: {}, conf: null };
  world.innerHTML = `${worldHtml(scr0, L)}<div class="tdx-cast">${toks}</div><div class="tdx-fx"></div>`;
  st.querySelector('.tdx-hud').innerHTML = hudHtml(scr0, L, fresh, {});
  layer.innerHTML = clockHtml(uid, R, open) + (R.mode === 'zone' ? zoneHtml(uid, R, here) : pinsHtml(uid, R, W)) + listHtml(uid, R, here);
  // the whole day's count, and how many of those are still to come in later windows (the user, 2026-10-08:
  // "it says 5 to watch but I only get key conversations": the rest open later in the day)
  const later = M.convs.filter(c => M.windows.findIndex(w => w.id === c.window) > R.win && !R.seen.has(c.i)).length;
  const cnt = document.getElementById(`tdm-count-${uid}`); if (cnt) cnt.textContent = `${R.seen.size} / ${M.convs.length} watched today${later ? ` · ${later} later in the day` : ''}`;
  ambience(worldSound(scr0, L));
}

function clockHtml(uid, R, open) {
  const M = R.map, W = M.windows[R.win];
  const keyLeft = M.convs.filter(c => c.window === W.id && c.key && !R.seen.has(c.i)).length;
  const tabs = M.windows.map((w, i) => {
    const locked = i > open;
    return `<button type="button" class="tdm-win${i === R.win ? ' on' : ''}${locked ? ' locked' : ''}" ${locked ? 'disabled title="Watch this window\'s key conversations first"' : `onclick="tdmWin('${uid}',${i})"`}>${locked ? `<i>${ICON_LOCK}</i>` : ''}<b>${esc(w.label)}</b><span>${esc(w.time)}</span></button>`;
  }).join('');
  const later = R.win < M.windows.length - 1 && !keyLeft
    ? `<button type="button" class="tdm-later" onclick="tdmWin('${uid}',${R.win + 1})">Later ⏩</button>`
    : keyLeft ? `<span class="tdm-left" title="Watch these to unlock the next part of the day"><i>${ICON_STAR}</i>${keyLeft} key conversation${keyLeft > 1 ? 's' : ''} left to unlock ${M.windows[R.win + 1]?.label || 'the rest of the day'}</span>` : '';
  return `<div class="tdm-clock">${tabs}${later}</div>`;
}

// Pins whose labels would overlap are lifted on taller stems, nearest (lowest on screen) first,
// so every place stays readable however crowded the middle of camp is. Sizes in % of the stage.
function pinLayout(items) {
  const placed = [], H = 6.6;
  for (const it of [...items].sort((a, b) => b.v - a.v)) {
    let stem = 2.6;
    const box = st => ({ x0: it.u - it.w / 2, x1: it.u + it.w / 2, y0: it.v - st - H, y1: it.v - st });
    const hit = b => placed.some(p => b.x0 < p.x1 + 1.2 && b.x1 > p.x0 - 1.2 && b.y0 < p.y1 + 1.0 && b.y1 > p.y0 - 1.0);
    while (hit(box(stem)) && stem < 40) stem += 1.6;
    placed.push(box(stem)); it.stem = stem;
  }
  return items;
}

function pinsHtml(uid, R, W) {
  const M = R.map;
  const items = pinLayout(Object.entries(M.zones).map(([z, Z]) => {
    const convs = M.convs.filter(c => c.window === W.id && c.zone === z);
    const people = [...new Set([...convs.flatMap(c => c.who), ...(W.idle[z] || [])])];
    const w = (people.length ? Math.min(people.length, 5) * 1.55 + 1.2 : 0) + Z.label.length * .62 + 3 + (convs.length ? 3 : 0);
    return { z, u: Z.u * 100, v: Z.v * 100, w };
  }));
  const stemOf = Object.fromEntries(items.map(it => [it.z, it.stem]));
  // a card near the edge of the frame slides inward over its stem, so its label is never cut off
  const leftOf = Object.fromEntries(items.map(it => [it.z, Math.min(Math.max(it.u, it.w / 2 + 0.6), 99.4 - it.w / 2)]));
  // two layers: every stem and dot first, every card over them, so a stem never runs across a card
  // and a click on a card always reaches that card's place
  const stems = [], cards = [];
  Object.entries(M.zones).forEach(([z, Z]) => {
    const convs = M.convs.filter(c => c.window === W.id && c.zone === z);
    const people = [...new Set([...convs.flatMap(c => c.who), ...(W.idle[z] || [])])];
    const left = convs.filter(c => !R.seen.has(c.i)), keyLeft = left.filter(c => c.key);
    const state = Z.rival ? 'rival' : !convs.length ? (people.length ? 'idle' : 'empty') : !left.length ? 'done' : keyLeft.length ? 'key' : 'talk';
    const badge = Z.rival ? `<span class="tdm-ct done"><i>${ICON_LOCK}</i></span>` : !convs.length ? '' : !left.length ? `<span class="tdm-ct done"><i>${ICON_TICK}</i></span>`
      : `<span class="tdm-ct"><i>${keyLeft.length ? ICON_STAR : ICON_BUBBLE}</i>${left.length}</span>`;
    const faces = people.slice(0, 5).map(n => faceImg(R, n)).join('') + (people.length > 5 ? `<em>+${people.length - 5}</em>` : '');
    const u = (Z.u * 100).toFixed(2), v = Z.v * 100, top = (v - stemOf[z]).toFixed(2);
    stems.push(`<i class="tdm-stem ${state}" style="left:${u}%;top:${top}%;height:${stemOf[z].toFixed(2)}%"></i><i class="tdm-dot ${state}" style="left:${u}%;top:${v.toFixed(2)}%"></i>`);
    cards.push(`<button type="button" class="tdm-pin ${state}" style="left:${leftOf[z].toFixed(2)}%;top:${top}%" ${Z.rival ? `disabled title="Another team's camp: they live apart"` : `onclick="tdmZone('${uid}','${z}')"`} ${state === 'empty' ? 'tabindex="-1"' : ''} aria-label="${esc(Z.label)}">
      <span class="tdm-card">${faces ? `<span class="tdm-faces">${faces}</span>` : ''}<span class="tdm-lbl">${esc(Z.label)}</span>${badge}</span></button>`);
  });
  return `<div class="tdm-stems">${stems.join('')}</div>${cards.join('')}`;
}

function zoneHtml(uid, R, here) {
  const M = R.map;
  const placesHere = [...new Set(here.map(c => c.place))];
  const tabs = placesHere.length > 1 ? `<div class="tdm-places">${placesHere.map(p => `<button type="button" class="${p === R.place ? 'on' : ''}" onclick="tdmPlace('${uid}','${p}')">${esc(PLACE_LABEL[p] || placeName(p))}</button>`).join('')}</div>` : '';
  // each bubble over one of its own speakers, a speaker no other bubble has taken when there is one;
  // a bubble that would overlap another is lifted until it clears, nearest first (as the map pins are)
  const taken = new Set(), boxes = [];
  const bubbles = here.filter(c => c.place === R.place).map(c => {
    const anchor = c.who.find(n => R.places?.[n] && !taken.has(n)) || c.who.find(n => R.places?.[n]);
    if (anchor) taken.add(anchor);
    const pl = anchor ? R.places[anchor] : { u: .5, v: .5, s: .2 };
    const h = Math.max(Math.min(pl.s * 125, 32), 15) * (R.crowd || 1) / 100;
    const u = pl.u * 100, w = c.title.length * .62 + 4.2;
    let top = (pl.v - h - .035) * 100;
    const hit = t => boxes.some(b => u - w / 2 < b.x1 + .6 && u + w / 2 > b.x0 - .6 && t - 4.2 < b.y1 + .4 && t > b.y0 - .4);
    while (hit(top) && top > 8) top -= 2.2;
    boxes.push({ x0: u - w / 2, x1: u + w / 2, y0: top - 4.2, y1: top });
    const st = R.seen.has(c.i) ? 'done' : c.key ? 'key' : 'talk';
    const lock = lockedConv(M, R.seen, c);
    return `<button type="button" class="tdm-bub ${st}${lock ? ' locked' : ''}" style="left:${u.toFixed(2)}%;top:${top.toFixed(2)}%" ${lock ? 'disabled title="Watch the earlier part of this story first"' : `onclick="tdmPlay('${uid}',${c.i})"`}>
      <i>${lock ? ICON_LOCK : st === 'done' ? ICON_TICK : st === 'key' ? ICON_STAR : ICON_BUBBLE}</i><span>${esc(c.title)}</span></button>`;
  }).join('');
  return `<button type="button" class="tdm-back" onclick="tdmMap('${uid}')">◀ ${M.title ? 'Island map' : 'Camp map'}</button>${tabs}${bubbles}`;
}

function listHtml(uid, R, here) {
  if (!here.length) return `<div class="tdm-list empty"><span>${R.mode === 'zone' ? 'Nobody is talking here right now.' : 'Nothing is happening at camp right now.'}</span></div>`;
  const M = R.map;
  return `<div class="tdm-list">${here.map(c => {
    const st = R.seen.has(c.i) ? 'done' : c.key ? 'key' : 'talk';
    const lock = lockedConv(M, R.seen, c);
    return `<button type="button" class="tdm-item ${st}${lock ? ' locked' : ''}" ${lock ? 'disabled title="Watch the earlier part of this story first"' : `onclick="tdmPlay('${uid}',${c.i})"`}><span class="tdm-faces">${c.who.slice(0, 3).map(n => faceImg(R, n)).join('')}</span>
      <span class="tdm-txt"><b>${esc(c.title)}</b><span>${esc(M.zones[c.zone]?.label || placeName(c.place))}${c.place !== c.zone && PLACE_LABEL[c.place] ? ' · ' + esc(PLACE_LABEL[c.place]) : ''}</span></span><i>${st === 'done' ? ICON_TICK : st === 'key' ? ICON_STAR : ICON_BUBBLE}</i></button>`;
  }).join('')}</div>`;
}

function markSeen(uid, R, i) {
  R.seen.add(i);
  try { globalThis.localStorage?.setItem(R.seenKey, JSON.stringify([...R.seen])); } catch { /* per-viewer convenience */ }
}

export function tdmZone(uid, zone) {
  const R = reg()[uid]; if (!R) return;
  const st = document.getElementById(`tdx-st-${uid}`), world = st?.querySelector('.tdx-world'), Z = R.map.zones[zone];
  R.mode = 'zone'; R.zone = zone; R.place = null; R.story = false;
  if (world && Z && world.animate) {
    world.style.transformOrigin = `${(Z.u * 100).toFixed(1)}% ${(Z.v * 100).toFixed(1)}%`;
    st.querySelector('.tdm').hidden = true;
    sfx('whoosh');
    const a = world.animate([{ transform: 'scale(1)', filter: 'blur(0)' }, { transform: 'scale(3.2)', filter: 'blur(3px)' }], { duration: 520, easing: 'cubic-bezier(.5,0,.75,.4)' });
    a.onfinish = () => { mapPaint(uid, true); world.animate([{ opacity: .2, transform: 'scale(1.06)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' }); };
  } else mapPaint(uid, true);
}
export function tdmPlace(uid, place) { const R = reg()[uid]; if (!R) return; R.place = place; mapPaint(uid, true); }
export function tdmMap(uid) {
  const R = reg()[uid]; if (!R) return; stopAuto(R);
  R.mode = 'map'; R.zone = null; R.scr = null; R.story = false;
  mapPaint(uid, true);
}
export function tdmWin(uid, i) {
  const R = reg()[uid]; if (!R) return;
  const open = openWindow(R.map, R.seen);
  if (i > open) return;
  R.win = Math.max(0, Math.min(i, R.map.windows.length - 1));
  if (R.mode === 'talk') R.mode = 'map';
  sfx('title');
  mapPaint(uid, true);
}
export function tdmPlay(uid, i, story = false) {
  const R = reg()[uid]; if (!R) return;
  const c = R.map.convs[i]; if (!c) return;
  if (!story && lockedConv(R.map, R.seen, c)) return;
  const st = document.getElementById(`tdx-st-${uid}`);
  R.mode = 'talk'; R.cur = i; R.zone = c.zone; R.place = c.place; R.story = story;
  R.win = Math.max(R.win, R.map.windows.findIndex(w => w.id === c.window));
  R.scr = c.screen; R.idx = 0; R.wk = null; R.o = { teamColor: R.colors[c.camp] || '#4fb84a' };
  const lines = document.getElementById(`tdx-lines-${uid}`); if (lines) lines.innerHTML = scriptHtml(R.scr);
  if (st) { st.classList.remove('tdm-on'); st.querySelector('.tdm').hidden = true; }
  paint(uid, true);
}
export function tdmStage(uid) { const R = reg()[uid]; if (R?.mode === 'talk') tdxNext(uid); }

// the end of a conversation: back to the place it happened, or on to the next one when walking the story
function tdmDone(uid, R) {
  markSeen(uid, R, R.cur);
  const c = R.map.convs[R.cur];
  if (R.story || R.auto) {
    const nx = nextConv(R.map, R.seen);
    if (nx) { tdmPlay(uid, nx.i, true); return; }
    R.mode = 'map'; R.scr = null; mapPaint(uid, true); return;
  }
  R.mode = 'zone'; R.zone = c.zone; R.place = c.place; R.scr = null;
  mapPaint(uid, true);
}
// Next on the map or in a place: the next conversation in story order; when all are watched, on to the next screen
function tdmNext(uid, R) {
  if (R.mode === 'talk') {
    if (R.idx < R.scr.steps.length - 1) { R.idx++; paint(uid, true); return; }
    tdmDone(uid, R); return;
  }
  const nx = nextConv(R.map, R.seen);
  if (nx) { tdmPlay(uid, nx.i, true); return; }
  if (typeof window !== 'undefined' && typeof window.vpNext === 'function') window.vpNext();
}
function tdmBack(uid, R) {
  if (R.mode === 'talk') {
    if (R.idx > 0) { R.idx--; paint(uid, false); return; }
    R.mode = 'zone'; R.scr = null; mapPaint(uid, false); return;
  }
  if (R.mode === 'zone') { tdmMap(uid); return; }
  if (typeof window !== 'undefined' && typeof window.vpPrev === 'function') window.vpPrev();
}

const TDM_CSS = `
.tdx .tdm{position:absolute;inset:0;z-index:12;pointer-events:none;font-family:Nunito,system-ui,sans-serif}
.tdx .tdm>*{pointer-events:auto}
.tdx .tdx-stage.tdm-on{cursor:default}
.tdx .tdx-stage.tdm-on .tdx-ibtn{display:none}
.tdx .tdm-pin{position:absolute;transform:translate(-50%,-100%);border:0;background:none;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 8px rgba(0,0,0,.4));transition:transform .2s}
.tdx .tdm-pin:hover,.tdx .tdm-pin:focus-visible{transform:translate(-50%,-104%) scale(1.06);outline:none;z-index:5}
.tdx .tdm-pin.empty{opacity:.55;pointer-events:none}
.tdx .tdm-pin.rival{opacity:.72;cursor:default;filter:grayscale(.5) drop-shadow(0 4px 8px rgba(0,0,0,.4))}.tdx .tdm-pin.rival:hover{transform:translate(-50%,-100%)}
.tdx .tdm-card{display:flex;align-items:center;gap:.45cqw;background:rgba(14,16,26,.9);border-radius:99px;padding:.35cqw .7cqw .35cqw .35cqw;border:2px solid rgba(255,255,255,.12)}
.tdx .tdm-pin.key .tdm-card{border-color:#ffc23a;animation:tdmPulse 1.6s ease-in-out infinite}
.tdx .tdm-pin.done .tdm-card{border-color:#4fb84a}
@keyframes tdmPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,194,58,.0)}50%{box-shadow:0 0 0 .5cqw rgba(255,194,58,.28)}}
.tdx .tdm-faces{display:flex}
.tdx .tdm-faces img{width:2.1cqw;height:2.1cqw;border-radius:50%;object-fit:cover;background:#fff;border:2px solid var(--tc);margin-left:-.6cqw}
.tdx .tdm-faces img:first-child{margin-left:0}
.tdx .tdm-faces em{font:800 .8cqw/1 Nunito;color:#fff;margin-left:.3cqw;font-style:normal}
.tdx .tdm-lbl{font:400 1.1cqw/1 'Lilita One',sans-serif;letter-spacing:.03em;color:#fff;white-space:nowrap}
.tdx .tdm-ct{display:flex;align-items:center;gap:.2cqw;font:900 .9cqw/1 Nunito;color:#1a1408;background:#ffc23a;border-radius:99px;padding:.2cqw .45cqw}
.tdx .tdm-pin.talk .tdm-ct{background:#2ec4c4}
.tdx .tdm-ct.done{background:#4fb84a;color:#fff}
.tdx .tdm-ct i,.tdx .tdm-bub i,.tdx .tdm-item>i,.tdx .tdm-left i,.tdx .tdm-win i{display:inline-flex;width:1cqw;height:1cqw}
.tdx .tdm-ct svg,.tdx .tdm-bub svg,.tdx .tdm-item>i svg,.tdx .tdm-left svg,.tdx .tdm-win svg{width:100%;height:100%}
.tdx .tdm-stems{position:absolute;inset:0;pointer-events:none}
.tdx .tdm-stem{position:absolute;width:2px;transform:translateX(-50%);background:rgba(255,255,255,.85)}
.tdx .tdm-stem.empty,.tdx .tdm-dot.empty{opacity:.5}
.tdx .tdm-pin:hover{z-index:5}
.tdx .tdm-list{scrollbar-width:none}.tdx .tdm-list::-webkit-scrollbar{display:none}
.tdx .tdm-dot{position:absolute;width:.8cqw;height:.8cqw;transform:translate(-50%,-50%);border-radius:50%;background:#fff;border:2px solid rgba(14,16,26,.9)}
.tdx .tdm-clock{position:absolute;left:50%;top:1.6cqw;transform:translateX(-50%);display:flex;gap:.4cqw;align-items:center;background:rgba(14,16,26,.86);border-radius:12px;padding:.4cqw;max-width:62%;flex-wrap:wrap;justify-content:center}
.tdx .tdm-win{border:0;background:none;color:#a9adbd;border-radius:9px;padding:.4cqw .7cqw;display:flex;flex-direction:column;align-items:flex-start;gap:.15cqw;cursor:pointer;font:inherit}
.tdx .tdm-win b{font:400 1cqw/1 'Lilita One',sans-serif;letter-spacing:.03em;color:inherit}
.tdx .tdm-win span{font:800 .75cqw/1 Nunito;opacity:.8}
.tdx .tdm-win.on{background:#ff8a1f;color:#1a1008}
.tdx .tdm-win.locked{cursor:not-allowed;opacity:.45;flex-direction:row;align-items:center}
.tdx .tdm-bub.locked,.tdx .tdm-item.locked{cursor:not-allowed;opacity:.5;filter:grayscale(.6)}
.tdx .tdm-later{border:0;background:#2ec4c4;color:#08201f;border-radius:9px;padding:.55cqw .8cqw;font:900 .85cqw/1 Nunito;cursor:pointer}
.tdx .tdm-left{display:flex;align-items:center;gap:.3cqw;color:#ffc23a;font:800 .85cqw/1 Nunito;padding:0 .5cqw}
.tdx .tdm-list{position:absolute;left:2%;right:2%;bottom:2.2%;display:flex;gap:.6cqw;overflow-x:auto;padding:.3cqw;scrollbar-width:none}
.tdx .tdm-list.empty{justify-content:center}
.tdx .tdm-list.empty span{background:rgba(14,16,26,.86);color:#a9adbd;border-radius:10px;padding:.7cqw 1.1cqw;font:700 .95cqw/1 Nunito}
.tdx .tdm-item{flex:none;display:flex;align-items:center;gap:.6cqw;background:rgba(14,16,26,.9);border:2px solid rgba(255,255,255,.1);border-radius:12px;padding:.5cqw .8cqw .5cqw .5cqw;cursor:pointer;color:#f4f1ea;text-align:left;font:inherit}
.tdx .tdm-item:hover,.tdx .tdm-item:focus-visible{border-color:#ff8a1f;outline:none}
.tdx .tdm-item.key{border-color:rgba(255,194,58,.75)}
.tdx .tdm-item.done{opacity:.6}
.tdx .tdm-item .tdm-faces img{width:2.4cqw;height:2.4cqw}
.tdx .tdm-txt{display:flex;flex-direction:column;gap:.2cqw}
.tdx .tdm-txt b{font:400 1cqw/1.1 'Lilita One',sans-serif;letter-spacing:.02em}
.tdx .tdm-txt span{font:700 .78cqw/1 Nunito;color:#a9adbd}
.tdx .tdm-item>i{color:#2ec4c4}.tdx .tdm-item.key>i{color:#ffc23a}.tdx .tdm-item.done>i{color:#4fb84a}
.tdx .tdm-back{position:absolute;left:2.2%;top:calc(4% + 5.6cqw);border:0;background:rgba(14,16,26,.9);color:#fff;border-radius:99px;padding:.55cqw 1cqw;font:900 .85cqw/1 Nunito;letter-spacing:.06em;cursor:pointer}
.tdx .tdm-places{position:absolute;left:50%;top:6.8cqw;transform:translateX(-50%);display:flex;gap:.3cqw;background:rgba(14,16,26,.86);border-radius:99px;padding:.3cqw}
.tdx .tdm-places button{border:0;background:none;color:#a9adbd;border-radius:99px;padding:.45cqw .9cqw;font:900 .85cqw/1 Nunito;cursor:pointer}
.tdx .tdm-places button.on{background:#ffc23a;color:#1a1408}
.tdx .tdm-bub{position:absolute;transform:translate(-50%,-100%);display:flex;align-items:center;gap:.35cqw;border:0;background:#fff;color:#141620;border-radius:12px;padding:.45cqw .75cqw;font:400 .95cqw/1 'Lilita One',sans-serif;letter-spacing:.02em;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.35);animation:tdmBob 2.4s ease-in-out infinite;white-space:nowrap}
.tdx .tdm-bub::after{content:'';position:absolute;left:50%;bottom:-.55cqw;transform:translateX(-50%);border:.6cqw solid transparent;border-top-color:#fff;border-bottom:0}
.tdx .tdm-bub.key{background:#ffc23a}.tdx .tdm-bub.key::after{border-top-color:#ffc23a}
.tdx .tdm-bub.done{background:#cfe9c8;animation:none;opacity:.8}.tdx .tdm-bub.done::after{border-top-color:#cfe9c8}
.tdx .tdm-bub:hover,.tdx .tdm-bub:focus-visible{outline:2px solid #ff8a1f;outline-offset:2px}
@keyframes tdmBob{0%,100%{margin-top:0}50%{margin-top:-.4cqw}}
@media (prefers-reduced-motion:reduce){.tdx .tdm-bub,.tdx .tdm-pin.key .tdm-card{animation:none}}
`;

// ══════════════════════════════════════════════════════════════════════
// CONTROLS
// ══════════════════════════════════════════════════════════════════════
export function tdxNext(uid) {
  const R = sync(uid); if (!R) return;
  if (R.isMap) { tdmNext(uid, R); return; }
  if (R.idx >= R.scr.steps.length - 1) {
    const wasAuto = R.auto; stopAuto(R);
    if (typeof window !== 'undefined' && typeof window.vpNext === 'function') {
      window.vpNext();
      if (wasAuto) setTimeout(() => { const nx = document.querySelector('.tdx[data-uid]'); if (nx && nx.dataset.uid !== uid) tdxAuto(nx.dataset.uid); }, 700);
    }
    return;
  }
  R.idx++; paint(uid, true);
}
export function tdxBack(uid) {
  const R = sync(uid); if (!R) return; stopAuto(R);
  if (R.isMap) { tdmBack(uid, R); return; }
  if (R.idx <= 0) { if (typeof window !== 'undefined' && typeof window.vpPrev === 'function') window.vpPrev(); return; }
  R.idx--; paint(uid, false);
}
export function tdxAll(uid) { const R = sync(uid); if (!R || (R.isMap && R.mode !== 'talk')) return; stopAuto(R); R.idx = R.scr.steps.length - 1; paint(uid, false); }
export function tdxReset(uid) { const R = sync(uid); if (!R) return; if (R.isMap) { tdmMap(uid); return; } stopAuto(R); R.idx = 0; R.wk = null; paint(uid, true); }
export function tdxJump(el, i) { const root = el.closest('.tdx[data-uid]'); if (!root) return; const R = sync(root.dataset.uid); if (!R || (R.isMap && R.mode !== 'talk')) return; stopAuto(R); R.idx = i; paint(root.dataset.uid, false); }
// the play bar: one segment per scene, as long as the scene is; press anywhere (or drag) to go there
function chapHtml(scr) {
  const starts = scr.steps.map((x, i) => (x.k === 'scene' ? i : -1)).filter(i => i >= 0);
  if (!starts.length || starts[0] !== 0) starts.unshift(0);
  return starts.map((a, k) => { const z = starts[k + 1] ?? scr.steps.length, s = scr.steps[a];
    return `<i data-a="${a}" data-z="${z}" style="flex:${z - a}" title="${esc(s?.place || s?.label || '')}"><b></b></i>`; }).join('');
}
export function tdxSeek(uid, e) {
  const R = sync(uid); if (!R || (R.isMap && R.mode !== 'talk')) return;
  const bar = e.currentTarget; e.preventDefault(); stopAuto(R);
  const to = ev => {
    const segs = [...bar.querySelectorAll('i')]; if (!segs.length) return;
    const x = ev.clientX;
    let seg = segs.find(s => { const r = s.getBoundingClientRect(); return x >= r.left && x <= r.right + 3; });
    if (!seg) seg = x < segs[0].getBoundingClientRect().left ? segs[0] : segs[segs.length - 1];
    const r = seg.getBoundingClientRect(), a = +seg.dataset.a, z = +seg.dataset.z;
    const f = Math.min(1, Math.max(0, (x - r.left) / Math.max(r.width, 1)));
    const i = Math.min(R.scr.steps.length - 1, a + Math.floor(f * (z - a)));
    if (i !== R.idx) { R.idx = i; paint(uid, false); }
  };
  to(e);
  const move = ev => to(ev), up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
}
export function tdxIntel(uid) { const st = document.getElementById(`tdx-st-${uid}`); if (!st) return; st.classList.toggle('intel-open'); st.querySelector('.tdx-ibtn')?.classList.remove('new'); }
export function tdxTab(uid, e) { if (e.target.closest('[data-close]')) { tdxIntel(uid); return; } const pick = e.target.closest('[data-rel]'); const b = pick || e.target.closest('[data-tab]'); if (!b) return; const R = reg()[uid]; if (!R) return; if (pick) R.relWho = pick.dataset.rel; else R.tab = b.dataset.tab; const st = document.getElementById(`tdx-st-${uid}`); st.querySelector('.tdx-intel').innerHTML = intelHtml(R.scr, ledgerAt(R.scr, R.idx), R.tab, false, R.relWho); }
const holdFor = s => Math.min(9000, 1700 + String(s?.text || '').length * 40) + (['title', 'idol', 'out', 'found', 'intro'].includes(s?.k) ? 2400 : 0) + (s?.k === 'ballot' ? 2600 : 0) + (s?.tense ? 1200 : 0) + (s?.k === 'scene' ? 900 : 0) + (s?.k === 'safe' && s.last ? 1800 : 0);
function stopAuto(R) { R.auto = false; clearTimeout(R.timer); }
export function tdxAuto(uid) {
  const R = sync(uid); if (!R) return;
  R.auto = !R.auto;
  document.getElementById(`tdx-auto-${uid}`)?.classList.toggle('on', R.auto);
  const tick = () => { if (!R.auto) return; tdxNext(uid); if (R.auto) R.timer = setTimeout(tick, holdFor(R.scr?.steps?.[R.idx])); };
  if (R.auto) R.timer = setTimeout(tick, 400); else clearTimeout(R.timer);
}
export function tdxTv() {
  const p = typeof document !== 'undefined' ? document.getElementById('visual-player') : null;
  if (!p) return;
  const on = p.classList.toggle('tdx-tv');
  try { if (on && p.requestFullscreen && !document.fullscreenElement) p.requestFullscreen().catch(() => {}); if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch { /* fullscreen refused */ }
  // leaving fullscreen (Esc) leaves TV mode too
  if (on && !p._tvExit) { p._tvExit = true; document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) p.classList.remove('tdx-tv'); }); }
}
/** Switch between the stepped viewer and the classic screens, staying on the same screen. */
export function tdxSwitchViewer(which) {
  try { localStorage.setItem('td-vp', which === 'stepped' ? 'stepped' : 'classic'); } catch { /* per-viewer convenience */ }
  try {
    const before = window.vpScreens || [], at = window.vpCurrentScreen || 0, cur = before[at] || {};
    const frac = before.length > 1 ? at / (before.length - 1) : 0;
    const ep = window.vpEpNum ?? window._vpEpNum;
    const rec = (window.gs?.episodeHistory || []).find(e => e.num === ep);
    if (!rec || typeof window.buildVPScreens !== 'function') { location.reload(); return; }
    window.buildVPScreens(rec);
    const now = window.vpScreens || [];
    let i = now.findIndex(s => s.id && s.id === cur.id);
    if (i < 0 && cur.id === 'votes') i = now.findIndex(s => s.id === 'tribal');
    if (i < 0) i = Math.round(frac * Math.max(0, now.length - 1));
    if (typeof window.vpGoTo === 'function') window.vpGoTo(Math.max(0, i)); else { window.vpCurrentScreen = Math.max(0, i); window.renderVPScreen?.(); }
  } catch { location.reload(); }
}
/** The classic screens' way back to the stepped viewer. */
export const TDX_SWITCH = `<div style="display:flex;justify-content:flex-end;margin:0 0 8px"><button type="button" onclick="tdxSwitchViewer('stepped')" style="border:1px solid #ff8a1f;background:#171a24;color:#ff8a1f;border-radius:8px;padding:7px 12px;font:800 11px Nunito,system-ui,sans-serif;letter-spacing:1px;cursor:pointer">▶ STEPPED VIEWER</button></div>`;

if (typeof window !== 'undefined') Object.assign(window, { tdxNext, tdxBack, tdxAll, tdxReset, tdxJump, tdxSeek, tdxIntel, tdxTab, tdxAuto, tdxTv, tdxSwitchViewer, tdmZone, tdmPlace, tdmMap, tdmWin, tdmPlay, tdmStage });
if (typeof document !== 'undefined') {
  // a stepped screen opens on its first scene; leaving it stops its sound and its Auto
  document.addEventListener('vp:screen', () => {
    setTimeout(() => {
      const root = document.querySelector('.tdx[data-uid]');
      for (const [uid, R] of Object.entries(reg())) if (R && (!root || root.dataset.uid !== uid)) { stopAuto(R); clearInterval(R.typing); }
      if (!root) { stopAmbience(); return; }
      const R = sync(root.dataset.uid);
      if (R && R.idx < 0) { R.idx = 0; if (R.isMap) mapPaint(root.dataset.uid, true); else paint(root.dataset.uid, true); }
    }, 0);
  });
  document.addEventListener('vp:close', () => { for (const R of Object.values(reg())) if (R) { stopAuto(R); clearInterval(R.typing); } stopAmbience(); });
  document.addEventListener('keydown', e => {
    const root = document.querySelector('.tdx[data-uid]');
    if (!root || /input|textarea|select/i.test(e.target?.tagName || '')) return;
    if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); e.stopImmediatePropagation(); tdxNext(root.dataset.uid); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopImmediatePropagation(); tdxBack(root.dataset.uid); }
    else if (e.key === 'i') tdxIntel(root.dataset.uid);
    // Esc closes Intel first (a second Esc leaves TV mode)
    else if (e.key === 'Escape' && document.getElementById(`tdx-st-${root.dataset.uid}`)?.classList.contains('intel-open')) { e.preventDefault(); e.stopImmediatePropagation(); tdxIntel(root.dataset.uid); }
  }, true);
}
