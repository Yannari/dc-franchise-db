import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1300, height: 420 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.goto('http://127.0.0.1:8797/simulator.html'); await page.waitForTimeout(2500);
await page.evaluate(async () => {
  const st = await import('./js/vp-td-ep/stage.js'); const sty = await import('./js/vp-td-ep/style.js');
  const css = sty.TDX_CSS;
  if (css) { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }
  document.body.innerHTML = '<div style="display:flex;gap:10px;padding:10px;background:#111">' + ['day', 'night'].map(tod => `<div class="tdx" style="position:relative;width:620px;height:349px;overflow:hidden"><div class="tdx-world" style="position:absolute;inset:0">${st.worldHtml({ venue: 'survival-island', ep: 3 }, { scene: { tod, plate: 'survival-island/shelter-t1-day', time: tod === 'night' ? '7:00 PM' : '4:00 PM', still: true } })}</div><b style="position:absolute;left:8px;top:6px;color:#fff;font:700 14px system-ui;text-shadow:0 1px 3px #000">${tod === 'night' ? '7:00 PM (new night wash)' : '4:00 PM (day)'}</b></div>`).join('') + '</div>';
});
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shots/wash.png' });
console.log('css injected:', await page.evaluate(() => !!document.querySelector('style')?.textContent.includes('wash')), 'errors', errs.length ? errs : 'none'); await b.close();
