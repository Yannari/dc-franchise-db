import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
const bad = []; p.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
await p.goto('http://127.0.0.1:8791/assets/audio/td/vo-test/listen.html'); await p.waitForTimeout(1500);
const files = await p.evaluate(() => [...document.querySelectorAll('button')].map(x => x.dataset.file));
const codes = await p.evaluate(async fs => Promise.all(fs.map(f => fetch(f).then(r => r.status))), files);
console.log(files.length, 'buttons;', codes.filter(c => c === 200).length, 'files load; errors', errs.length ? errs : 'none', bad);
await b.close();
