// ══════════════════════════════════════════════════════════════════════
// vp-ci/parts.js — what every Circle stage draws with (Plan 5)
// ══════════════════════════════════════════════════════════════════════
//
// Faces, ring colours, names (the profile's and the real person's), the
// apartments' themes, captions and the profile card. js/vp-ci/stage.js and
// js/vp-ci/moments.js both import from here, never from each other.
import { faceOf } from './steps.js';
import { photoSrc } from '../ci/photo-store.js';
import { playerAvatarUrl } from '../players.js';

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const hashify = t => esc(t).replace(/#(\w+)/g, '<span class="civ-ht">#$1</span>');

// ── faces and colours ──────────────────────────────────────────────────
export function faceUrl(face) {
  if (!face) return '';
  if (face.startsWith('photo:')) return photoSrc(face) || '';
  if (face.startsWith('portrait:')) {
    const name = face.slice(9);
    try { return playerAvatarUrl((typeof window !== 'undefined' && window.players || []).find(p => p.name === name) || name) || ''; } catch { return ''; }
  }
  return '';
}
export const RINGS = ['#2f7bff', '#ff4fb4', '#3fd88f', '#ffd23f', '#b35cff', '#ff9f2f', '#3fd8ff', '#ff6b6b', '#8fe36b', '#c28bff', '#ffa3d7', '#5ee0c8', '#ffb84f'];
export const ringOf = (row, h) => RINGS[Math.max(0, Object.keys(row.ci.profiles || {}).indexOf(h)) % RINGS.length];
export const nameOf = (row, h) => row.ci.profiles?.[h]?.name || String(h || '').replace(/^@/, '');
export const realOf = (row, h) => (row.ci.profiles?.[h]?.people || []).join(' & ') || nameOf(row, h);
export const isCatfish = (row, h) => row.ci.profiles?.[h]?.mode === 'catfish';
export const bg = url => (url ? ` style="background-image:url('${esc(url)}')"` : '');
/** One style attribute for a ring colour and a photo (two style attributes and the browser drops the photo). */
export const ringBg = (ring, url) => ` style="--ring:${ring}${url ? `;background-image:url('${esc(url)}')` : ''}"`;
export function avatar(row, h, cls = 'civ-av') {
  const url = faceUrl(faceOf(row, h, 'profile'));
  return `<div class="${cls}" style="--ring:${ringOf(row, h)}${url ? `;background-image:url('${esc(url)}')` : ''}">${url ? '' : esc(nameOf(row, h)[0] || '?')}</div>`;
}

// ── the apartments: built from the player (spec 18.2), light and colour only
export const THEMES = {
  palm: { wall: 'linear-gradient(#1f5a58,#163f3e)', pat: 'radial-gradient(circle at 20% 30%,rgba(255,255,255,.04) 0 18%,transparent 19%) 0 0/60px 60px', dado: 'rgba(10,30,30,.5)', p1: 'linear-gradient(#ff8a4c 0 30%,#ff5e6c 30% 55%,#8a3a8a 55% 75%,#2b1a3a 75%)', p2: 'linear-gradient(135deg,#e24a3a,#f5a84a)', lamp: '#ffb86b', bias: '#3fd8ff' },
  deco: { wall: 'linear-gradient(#e6a9b0,#c98590)', pat: 'radial-gradient(circle at 50% 100%,transparent 0 40%,rgba(160,110,40,.35) 41% 44%,transparent 45%) 0 0/48px 26px', dado: 'rgba(120,50,70,.35)', p1: 'linear-gradient(160deg,#2b2350,#8b5cff 60%,#ff4fb4)', p2: 'linear-gradient(#ffd9a0,#ff9a8a)', lamp: '#ffd0a0', bias: '#ff4fb4' },
  stripe: { wall: 'repeating-linear-gradient(90deg,#1a1f45 0 22px,#151a3a 22px 44px)', pat: '', dado: 'rgba(0,0,0,.35)', p1: 'linear-gradient(#ffcf3f,#ff7a3f)', p2: 'linear-gradient(135deg,#3fd8ff,#2f7bff)', lamp: '#8fb0ff', bias: '#8b5cff' },
  jungle: { wall: 'linear-gradient(#244a2c,#18321e)', pat: 'repeating-radial-gradient(ellipse at 0 0,rgba(210,180,90,.14) 0 2px,transparent 3px 20px) 0 0/80px 80px', dado: 'rgba(10,25,12,.5)', p1: 'linear-gradient(#f5e6c0,#d9b86a)', p2: 'linear-gradient(#ff6b6b,#ffb36b)', lamp: '#ffe08a', bias: '#3fd88f' },
  citrus: { wall: 'linear-gradient(#ffb43a,#f08a1e)', pat: 'radial-gradient(circle,rgba(255,255,255,.18) 0 3px,transparent 4px) 0 0/28px 28px', dado: 'rgba(160,70,0,.35)', p1: 'linear-gradient(135deg,#2f7bff,#3fd8ff)', p2: 'linear-gradient(#ff4fb4,#8b5cff)', lamp: '#fff2b0', bias: '#ffd23f' },
  lav: { wall: 'linear-gradient(#8a7ad0,#6a5ab0)', pat: 'repeating-linear-gradient(45deg,rgba(255,255,255,.06) 0 10px,transparent 10px 20px)', dado: 'rgba(40,20,90,.4)', p1: 'linear-gradient(#fff,#cfe0ff)', p2: 'linear-gradient(135deg,#ff4fb4,#ffd23f)', lamp: '#e0d0ff', bias: '#b35cff' },
};
// A villain's room reads moody, a social butterfly's loud (spec 18.2).
export const BY_ARCHETYPE = { villain: 'stripe', mastermind: 'stripe', schemer: 'lav', 'social-butterfly': 'citrus', showmancer: 'deco',
  hero: 'jungle', 'loyal-soldier': 'palm', underdog: 'palm', goat: 'jungle', floater: 'deco', wildcard: 'lav', 'chaos-agent': 'citrus',
  hothead: 'stripe', 'challenge-beast': 'jungle', 'perceptive-player': 'palm' };
export const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
export function themeFor(name) {
  const p = (typeof window !== 'undefined' && window.players || []).find(x => x.name === name);
  const key = BY_ARCHETYPE[p?.archetype] || Object.keys(THEMES)[hash(name) % 6];
  return THEMES[key];
}
export const aptNo = (row, h) => Math.max(0, Object.keys(row.ci.profiles || {}).indexOf(h)) + 1;

// ── the twelve rendered apartments (tools/blender/circle-apartments.py) ─
// The engine moves each player into a room (ci/state.js moveIn); a season
// saved before that falls back to the apartment number.
export const ROOMS = ['beach', 'arcade', 'glam', 'boho', 'sports', 'music', 'library', 'artist', 'space', 'diner', 'loft', 'zen'];
export function roomOf(row, h) {
  const r = row.ci.profiles?.[h]?.room;
  return ROOMS[(r ?? aptNo(row, h) - 1) % ROOMS.length];
}
export const roomImg = (row, h, open = false) => `assets/sets/circle/apt/${roomOf(row, h)}${open ? '-open' : ''}.webp`;
// Where the door, its number plate and the TV screen sit in every render, in
// percent of the frame (geo() in the build script measures them from the camera).
export const ROOM_GEO = { door: [10.9, 14.84, 13.25, 50.65], plate: [15.28, 16.61, 4.01, 4.27], tv: [40.69, 10.68, 33.26, 33.26] };
export const geoStyle = ([l, t, w, h]) => `left:${l}%;top:${t}%;width:${w}%;height:${h}%`;
export const starsText = n => (n > 0 ? '★'.repeat(Math.floor(n)) + (n % 1 >= 0.5 ? '½' : '') : '');
export const facts = (...xs) => xs.filter(x => x != null && x !== '').map(esc).join(' · ');
export function captionHtml(st, fresh, cls = '') {
  if (st.host) return `<div class="civ-cap host ${cls}${fresh ? ' new' : ''}"><b>THE CIRCLE</b>${hashify(st.text)}</div>`;
  return `<div class="civ-cap ${cls}${fresh ? ' new' : ''}">${esc(st.text)}</div>`;
}
export function profileCard(row, h, label = 'PROFILE') {
  const p = row.ci.profiles[h];
  const url = faceUrl(faceOf(row, h, 'profile'));
  return `<div class="civ-pcard" style="--ring:${ringOf(row, h)}"><div class="hd">${esc(label)}</div>
    <div class="ph"${bg(url)}>${url ? '' : esc(nameOf(row, h)[0] || '?')}</div>
    <div class="nm">${esc(nameOf(row, h).toUpperCase())}</div>
    <div class="fx">${facts(p.age, p.status)}</div>${p.job ? `<div class="jb">${esc(p.job)}</div>` : ''}
    ${p.bio ? `<div class="bio">“${esc(p.bio)}”</div>` : ''}</div>`;
}

// ── shared pieces ──────────────────────────────────────────────────────
export const CHIP = { say: 'SAYS ALOUD', react: 'REACTS', send: 'SENT', post: 'POSTED', video: 'ON VIDEO' };
export function dlg(row, st, fresh, cls = '') {
  if (!st) return '';
  if (st.host) return captionHtml(st, fresh, 'foot');
  if (!st.who) return `<div class="civ-dlg ${cls}${fresh ? ' new' : ''}"><div class="civ-line stage">${esc(st.text)}</div></div>`;
  const plate = `<div class="civ-plate">${esc(realOf(row, st.who))}${isCatfish(row, st.who) ? ` <i>· as ${esc(nameOf(row, st.who))}</i>` : ''}</div>`;
  // The Hangout is private: a message there goes to the other Influencer.
  const body = st.part === 'send' ? `<span class="civ-chip cmd">${/^hangout\./.test(st.key || '') ? 'IN THE HANGOUT' : 'TO THE CIRCLE'}</span><span class="civ-cmd">${hashify(st.text)}</span>`
    : `<span class="civ-chip say">${CHIP[st.part] || 'SAYS'}</span>${hashify(st.text)}`;
  return `<div class="civ-dlg ${cls}${fresh ? ' new' : ''}">${plate}<div class="civ-line">${body}</div></div>`;
}
/** The real person on their apartment camera. */
export function cam(row, h, cls = '', label = null) {
  if (!h) return '';
  const url = faceUrl(faceOf(row, h, 'cam'));
  const real = realOf(row, h);
  return `<div class="civ-mcam ${cls}" data-cam="${esc(label ?? `CAM ${aptNo(row, h)} · ${real.toUpperCase()}`)}" style="--glow:${ringOf(row, h)}${url ? `;background-image:url('${esc(url)}')` : ''}">${url ? '' : esc(real[0] || '?')}</div>`;
}
/** A profile as the room sees it: photo and name. */
export function tile(row, h, cls = '', badge = '') {
  const url = faceUrl(faceOf(row, h, 'profile'));
  return `<div class="civ-mtile ${cls}" data-h="${esc(h)}" style="--ring:${ringOf(row, h)}"><div class="ph"${bg(url)}>${url ? '' : esc(nameOf(row, h)[0] || '?')}</div>
    <div class="n">${esc(nameOf(row, h).toUpperCase())}</div>${badge}</div>`;
}
export const where = text => `<div class="civ-where">${esc(text)}</div>`;
export const upTo = (screen, idx) => screen.steps.slice(0, idx + 1);
/** The last one who spoke, up to this step (a stage direction keeps the camera where it was). */
export function speakerAt(screen, idx) {
  for (let i = idx; i >= 0; i--) if (screen.steps[i]?.who) return screen.steps[i].who;
  return null;
}
export const bgUi = '<div class="civ-uibg"></div><div class="civ-aurora" style="left:58%;top:-18%;width:52%;aspect-ratio:1"></div>';

