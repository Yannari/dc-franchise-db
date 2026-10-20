// The Ridonculous Race viewer, checked in a real browser at several window sizes:
//   * no avatar on the stage overlaps the dialogue bar (the bar sits under the picture), in any shot
//   * no avatar is cut by the frame's edge, in any shot: whoever a close-up cannot hold whole has faded out of it
//   * no two avatars overlap by more than a small margin (a crowded cabin, the teams behind a shot)
//   * no stamp, slam, rank, stage-direction card or Don Box tip card sits on a face
//   * nobody in the scene fades out of a shot (only the teams behind it may)
//   * whoever is speaking is fully inside the picture
//   * the plate is alive: its motion canvas is running (or the CSS drift is), on every world screen
//   (serve the repo: python serve.py 8765)   node tools/rr-vp-check.mjs [seed] [teams] [eps]
import { chromium } from 'playwright';

const [seed = '8', teams = '12', epList = '2,5,9'] = process.argv.slice(2);
const base = process.env.RR_URL || 'http://127.0.0.1:8765/rr.html';
// RR_PINS=2:coast-palace,3:geyser-island books those legs (rr.html ?pins=): a place being built plays only when booked
const PINS = process.env.RR_PINS ? '&pins=' + encodeURIComponent(process.env.RR_PINS) : '';
const SIZES = process.env.RR_SIZES ? JSON.parse(process.env.RR_SIZES) : [[1600, 1000], [1280, 760], [1024, 700], [820, 1180], [390, 844]];
const browser = await chromium.launch();
let bad = 0, checked = 0;
for (const [w, h] of SIZES) {
  for (const intel of ['0', '1']) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    for (const n of epList.split(',').map(Number)) {
      await page.goto(`${base}?seed=${seed}&teams=${teams}&ep=${n}&step=0&intel=${intel}${PINS}`);
      await page.waitForFunction(() => window.__rr?.ep, null, { timeout: 60000 });
      const total = await page.evaluate(() => window.__rr.flat.length);
      // every 7th click through the episode, plus every mat and every confessional's first line
      const ks = await page.evaluate(() => window.__rr.flat.map((f, k) => {
        const s = window.__rr.ep.screens[f.si];
        const t = s.steps[f.idx];
        return (k % 7 === 0 || t.part === 'tip' || s.mode === 'mat' || s.mode === 'act' || s.mode === 'cabin' || t.stamp || t.slam || t.part === 'beat' || (t.cam && t.cam.shot !== 'wide' && k % 2 === 0) || (s.kind === 'iv' && f.idx === 0)) ? k : -1;
      }).filter(k => k >= 0));
      for (const k of ks.slice(0, 160)) {
        const r = await page.evaluate(k => {
          window.__rr.step(k, false);
          for (const a of document.getAnimations()) { const t = a.effect?.getTiming?.(); if (t && t.iterations !== Infinity) { try { a.finish(); } catch { /* */ } } }
          const box = e => e.getBoundingClientRect();
          const vn = box(document.getElementById('rr-vn')), st = box(document.getElementById('rr-stage'));
          const out = [];
          // a wide shot: nobody under the bar. A close-up (steps.js planCamera): whoever it is on is whole, inside the
          // frame and clear of the bar; anybody else it would cut has faded out of it (steps.js planHide).
          const f0 = window.__rr.flat[k], cam = window.__rr.ep.screens[f0.si].steps[f0.idx].cam;
          const close = cam && cam.shot !== 'wide';
          const sel = close ? (cam.on || []).map(w => w === 'Don' || !/^t\d+$/.test(w) ? `#rr-stage .don[data-p="${w}"] > img, #rr-stage .don[data-p="${w}"] > svg` : `#rr-stage .tok[data-team="${w}"]:not([data-crowd]) .pair img, #rr-stage .swim[data-team="${w}"]:not([data-crowd]) img`).join(', ')
            : '#rr-stage .tok .pair img, #rr-stage .swim img, #rr-stage .don > img, #rr-stage .don > svg, #rr-stage .inset img, #rr-stage .iv .cf img';
          for (const e of sel ? document.querySelectorAll(sel) : []) {
            const b = box(e);
            if (!b.width) continue;
            const who = e.dataset.p || e.dataset.c || e.closest('[data-p]')?.dataset.p || '?';
            if (b.bottom > vn.top + 0.5 && b.top < vn.bottom && b.right > vn.left && b.left < vn.right) out.push(`overlaps the bar: ${who} (${Math.round(b.bottom - vn.top)}px)${close ? ' in a ' + cam.shot : ''}`);
            if (close && (b.left < st.left - 1 || b.right > st.right + 1 || b.top < st.top - 1 || b.bottom > st.bottom + 1)) out.push(`${cam.shot} cuts its subject ${who}`);
          }
          // every avatar the picture shows: whole or not at all, clear of the bar, not on another, no overlay on its face
          const seen = e => { for (let x = e; x && x.id !== 'rr-stage'; x = x.parentElement) { const cs = getComputedStyle(x); if (+cs.opacity < 0.05 || cs.visibility === 'hidden' || cs.display === 'none') return false; } return true; };
          const union = bs => ({ left: Math.min(...bs.map(b => b.left)), top: Math.min(...bs.map(b => b.top)), right: Math.max(...bs.map(b => b.right)), bottom: Math.max(...bs.map(b => b.bottom)) });
          const avatars = [];
          for (const e of document.querySelectorAll('#rr-world .tok, #rr-world .swim, #rr-world .don')) {
            if (!seen(e)) continue;
            const imgs = [...e.querySelectorAll(e.classList.contains('tok') ? '.pair img' : ':scope > img, :scope > svg')].filter(seen).map(box).filter(b => b.width);
            if (!imgs.length) continue;
            avatars.push({ e, who: (e.dataset.crowd ? 'behind ' : '') + (e.dataset.team || e.dataset.p || '?'), team: e.dataset.team, b: union(imgs) });
          }
          // only a team behind the scene may fade out of a shot: never one in it, nor Don, nor a local
          for (const e of document.querySelectorAll('#rr-world .offcam')) if (!e.dataset.crowd) out.push(`faded out of the shot though in the scene: ${e.dataset.team || e.dataset.p}`);
          const M = 1.5;                       // px: an idle bob or a talking bounce moves a face this much
          for (const a of avatars) {
            const b = a.b;
            const inside = b.left >= st.left - M && b.right <= st.right + M && b.top >= st.top - M && b.bottom <= st.bottom + M;
            const outside = b.right <= st.left || b.left >= st.right || b.bottom <= st.top || b.top >= st.bottom;
            if (!inside && !outside) out.push(`cut by the frame: ${a.who} [${[b.left - st.left, b.top - st.top, st.right - b.right, st.bottom - b.bottom].map(Math.round)}]${close ? ' in a ' + cam.shot : ''}`);
            if (!outside && b.bottom > vn.top + M && b.top < vn.bottom && b.right > vn.left && b.left < vn.right && vn.top < st.bottom - 1) out.push(`under the bar: ${a.who}${close ? ' in a ' + cam.shot : ''}`);
          }
          const area = b => Math.max(0, b.right - b.left) * Math.max(0, b.bottom - b.top);
          const meet = (a, b) => area({ left: Math.max(a.left, b.left), right: Math.min(a.right, b.right), top: Math.max(a.top, b.top), bottom: Math.min(a.bottom, b.bottom) });
          for (let i = 0; i < avatars.length; i++) for (let j = i + 1; j < avatars.length; j++) {
            const A = avatars[i], B = avatars[j];
            if (A.team && A.team === B.team && A.e.classList.contains('swim')) continue;      // a pair of swimmers is one team
            const o = meet(A.b, B.b) / Math.min(area(A.b), area(B.b));
            if (o > 0.1) out.push(`overlap ${Math.round(o * 100)}%: ${A.who} / ${B.who}`);
          }
          const overlays = [...document.querySelectorAll('#rr-stage .stamp, #rr-stage .slam .band, #rr-stage .slam > img, #rr-stage .tok .rank, #rr-stage .beatcard.on, #rr-stage .tipcard .card, #rr-stage .tipcard .in')].filter(seen);
          for (const o of overlays) {
            const ob = box(o);
            for (const a of avatars) {
              const m = meet(ob, a.b);
              if (m > 0.04 * area(a.b)) out.push(`${o.className.split(' ')[0]} "${(o.textContent || '').trim().slice(0, 16)}" on the face of ${a.who} (${Math.round(m / area(a.b) * 100)}%)`);
            }
          }
          const sp = document.querySelector('#rr-stage img.speaking');
          if (sp) { const b = box(sp); if (b.left < st.left - 1 || b.right > st.right + 1 || b.top < st.top - 1 || b.bottom > st.bottom + 1) out.push(`speaker cut by the frame: ${sp.dataset.p} [${[b.left - st.left, b.top - st.top, st.right - b.right, st.bottom - b.bottom].map(Math.round)}] ${sp.parentElement.className}|${sp.parentElement.parentElement.className} cam=${document.getElementById('rr-cam').style.transform}`); }
          const s = window.__rr.ep.screens[window.__rr.flat[k].si];
          if (s.kind === 'world' && !document.querySelector('#rr-world[class*="kb-"]')) out.push('plate not moving');
          return { out, id: s.id, seg: s.seg };
        }, k);
        checked++;
        if (r.out.length) { bad++; console.log(`${w}x${h} intel=${intel} ep${n} click ${k} ${r.id} ${r.seg}: ${r.out.join('; ')}`); }
      }
      void total;
    }
    await page.close();
  }
}
// and the plates do run their shader
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto(`${base}?seed=${seed}&teams=${teams}&ep=5&step=0${PINS}`);
await page.waitForFunction(() => window.__rr?.ep, null, { timeout: 60000 });
// a step on a plate with water or leaves (life-have.js): its canvas runs; a plate without stays the crisp painting
// (the first leg from 5 on, then back from 4, that has one: a leg may be all ice and rock, with nothing to move)
const findLife = () => page.evaluate(async () => {
  const { LIFE } = await import('./js/vp-rr-ep/life-have.js');
  const { plateUrl } = await import('./js/vp-rr-ep/plates.js');
  const r = window.__rr;
  return r.flat.findIndex(f => { const s = r.ep.screens[f.si]; return s.kind === 'world' && s.plate?.f && !s.plate.race && LIFE[plateUrl(s.plate.place || s.place, s.plate.f)]; });
});
let k = await findLife();
const legs = await page.evaluate(() => document.querySelectorAll('#rr-ep option').length);
for (const e of [...Array(legs).keys()].map(i => (i + 4) % legs)) {
  if (k >= 0) break;
  await page.evaluate(e => window.__rr.goto(e, 0), e);
  k = await findLife();
}
await page.evaluate(k => window.__rr.step(k, false), Math.max(0, k));
await page.waitForTimeout(2500);
const gl = k >= 0 && await page.evaluate(() => !!document.querySelector('#rr-gl canvas.rr-life.on'));
console.log(`checked ${checked} steps, ${bad} with a problem; motion shader running: ${gl}`);
await browser.close();
process.exit(bad || !gl ? 1 : 0);
