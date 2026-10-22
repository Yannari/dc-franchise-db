// SCRATCH: the Studio's Speaking voice box, with the writer and the save faked (nothing leaves the machine)
import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
let writerBody = null, saveBody = null;
await p.route(/./, async r => {
  const req = r.request(); const pd = req.postData() || '';
  if (req.method() === 'POST' && pd.includes('"speaking-voice"')) { writerBody = JSON.parse(pd); return r.fulfill({ json: { ok: true, speakingVoice: 'Adult woman in her early twenties, TEST VOICE.' } }); }
  if (req.method() === 'POST' && /\/api\/character/.test(req.url())) { saveBody = JSON.parse(pd); return r.fulfill({ json: { ok: true, slug: 'heather' } }); }
  return r.continue();
});
p.on('dialog', d => d.accept());
await p.goto('http://127.0.0.1:8791/simulator.html'); await p.waitForTimeout(2500);
await p.evaluate(() => window.studioEnter()); await p.waitForTimeout(1500);
await p.click('.st-card[data-slug="heather"]'); await p.waitForTimeout(1200);
const box = await p.$('#st-f-speaking'); console.log('box present:', !!box);
await p.click('summary:has-text("Speaking voice")');
await p.click('#st-sv-write'); await p.waitForTimeout(1200);
console.log('box after write:', await p.inputValue('#st-f-speaking'));
console.log('note:', await p.textContent('#st-sv-note'));
console.log('writer got person', writerBody?.person?.name, 'gender', writerBody?.person?.gender, '| others', writerBody?.others?.length);
const save = await p.$('button:has-text("Save character")'); if (save) { await save.click(); await p.waitForTimeout(2000); }
console.log('save sent speakingVoice:', saveBody ? JSON.stringify(saveBody.speakingVoice) : '(no network save: local only)');
await p.click('.st-card[data-slug="owen"]'); await p.waitForTimeout(1000);
await p.click('.st-card[data-slug="heather"]'); await p.waitForTimeout(1200);
console.log('after save and reopen:', await p.inputValue('#st-f-speaking'));
await p.click('.st-card[data-slug="owen"]'); await p.waitForTimeout(1000);
await p.click('summary:has-text("Speaking voice")'); await p.click('#st-sv-write'); await p.waitForTimeout(1200);
console.log('Owen write sent others:', JSON.stringify(writerBody?.others?.map(o => o.name)));
console.log('errors', errs.length ? errs : 'none');
await b.close();
