// The Ridonculous Race viewer, checked in a real browser at several window sizes:
//   * no avatar on the stage overlaps the dialogue bar (the bar sits under the picture)
//   * whoever is speaking is fully inside the picture
//   * the plate is alive: its motion canvas is running (or the CSS drift is), on every world screen
//   (serve the repo: python serve.py 8765)   node tools/rr-vp-check.mjs [seed] [teams] [eps]
import { chromium } from 'playwright';

const [seed = '8', teams = '12', epList = '2,5,9'] = process.argv.slice(2);
const base = process.env.RR_URL || 'http://127.0.0.1:8765/rr.html';
const SIZES = process.env.RR_SIZES ? JSON.parse(process.env.RR_SIZES) : [[1600, 1000], [1280, 760], [1024, 700], [820, 1180], [390, 844]];
const browser = await chromium.launch();
let bad = 0, checked = 0;
for (const [w, h] of SIZES) {
  for (const intel of ['0', '1']) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    for (const n of epList.split(',').map(Number)) {
      await page.goto(`${base}?seed=${seed}&teams=${teams}&ep=${n}&step=0&intel=${intel}`);
      await page.waitForFunction(() => window.__rr?.ep, null, { timeout: 60000 });
      const total = await page.evaluate(() => window.__rr.flat.length);
      // every 7th click through the episode, plus every mat and every confessional's first line
      const ks = await page.evaluate(() => window.__rr.flat.map((f, k) => {
        const s = window.__rr.ep.screens[f.si];
        return (k % 7 === 0 || s.mode === 'mat' || s.mode === 'act' || (s.kind === 'iv' && f.idx === 0)) ? k : -1;
      }).filter(k => k >= 0));
      for (const k of ks.slice(0, 120)) {
        const r = await page.evaluate(k => {
          window.__rr.step(k, false);
          for (const a of document.getAnimations()) { const t = a.effect?.getTiming?.(); if (t && t.iterations !== Infinity) { try { a.finish(); } catch { /* */ } } }
          const box = e => e.getBoundingClientRect();
          const vn = box(document.getElementById('rr-vn')), st = box(document.getElementById('rr-stage'));
          const out = [];
          // a wide shot: nobody under the bar. A close-up (steps.js planCamera): whoever it is on is whole, inside the
          // frame and clear of the bar; the people it is not on may be cut by the frame, as on television.
          const f0 = window.__rr.flat[k], cam = window.__rr.ep.screens[f0.si].steps[f0.idx].cam;
          const close = cam && cam.shot !== 'wide';
          const sel = close ? (cam.on || []).map(w => w === 'Don' || !/^t\d+$/.test(w) ? `#rr-stage .don[data-p="${w}"] img, #rr-stage .don[data-p="${w}"] svg` : `#rr-stage .tok[data-team="${w}"]:not([data-crowd]) .pair img, #rr-stage .swim[data-team="${w}"]:not([data-crowd]) img`).join(', ')
            : '#rr-stage .tok .pair img, #rr-stage .swim img, #rr-stage .don img, #rr-stage .don svg, #rr-stage .inset img, #rr-stage .iv .cf img';
          for (const e of sel ? document.querySelectorAll(sel) : []) {
            const b = box(e);
            if (!b.width) continue;
            const who = e.dataset.p || e.dataset.c || e.closest('[data-p]')?.dataset.p || '?';
            if (b.bottom > vn.top + 0.5 && b.top < vn.bottom && b.right > vn.left && b.left < vn.right) out.push(`overlaps the bar: ${who} (${Math.round(b.bottom - vn.top)}px)${close ? ' in a ' + cam.shot : ''}`);
            if (close && (b.left < st.left - 1 || b.right > st.right + 1 || b.top < st.top - 1 || b.bottom > st.bottom + 1)) out.push(`${cam.shot} cuts its subject ${who}`);
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
await page.goto(`${base}?seed=${seed}&teams=${teams}&ep=5&step=40`);
await page.waitForFunction(() => window.__rr?.ep, null, { timeout: 60000 });
await page.waitForTimeout(2500);
const gl = await page.evaluate(() => !!document.querySelector('#rr-gl canvas.tdx-gl.on'));
console.log(`checked ${checked} steps, ${bad} with a problem; motion shader running: ${gl}`);
await browser.close();
process.exit(bad || !gl ? 1 : 0);
