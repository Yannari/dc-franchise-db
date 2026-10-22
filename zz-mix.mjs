// SCRATCH: measure the TD mix as played (ambience alone / under music / voices / effects), and record a sample
import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const page = await b.newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('response', x => { if (x.status() >= 400) errs.push(x.status() + ' ' + x.url()); });
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(2000);
const r = await page.evaluate(async () => {
  const { audio } = await import('./js/audio.js'), snd = await import('./js/vp-td-ep/sound.js');
  const ctx = new AudioContext(); await ctx.resume();
  const master = ctx.createGain(), an = ctx.createAnalyser(); an.fftSize = 4096; master.connect(an);
  const rec = ctx.createMediaStreamDestination(); master.connect(rec);
  audio.output = () => ({ ctx, dest: master });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const meter = async ms => { const d = new Float32Array(an.fftSize); let s = 0, n = 0, pk = 0; const end = performance.now() + ms; while (performance.now() < end) { an.getFloatTimeDomainData(d); for (const x of d) { s += x * x; n++; pk = Math.max(pk, Math.abs(x)); } await sleep(40); } return { rms: +(10 * Math.log10(s / n)).toFixed(1), peak: +(20 * Math.log10(pk)).toFixed(1) }; };
  const mr = new MediaRecorder(rec.stream), chunks = []; mr.ondataavailable = e => chunks.push(e.data); mr.start();
  const out = {};
  const camp = { fire: 0, scape: { venue: 'hosted-camp', night: false, open: true, shore: true, weather: 'calm' } };
  audio._currentBed = null; snd.ambience(camp); await sleep(2500); out.campAlone = await meter(3000);
  audio._currentBed = 'camp-day'; snd.ambience(camp); await sleep(1500); out.campUnderMusic = await meter(2500);
  audio._currentBed = null; snd.ambience(camp); await sleep(1500);
  const lines = [['high', 1.0, .085, "Ugh, seriously? You're voting with them now?"], ['low', .95, .08, "Relax. Nobody's going home but you."], ['mid', 1.08, .075, 'Wait, which one is Tyler again?']];
  for (const [reg, rate, gap, text] of lines) { snd.babble(text, { reg, rate, gap }); out['voice-' + reg] = await meter(900); await sleep(500); }
  for (const k of ['static', 'anvil', 'bonk', 'boat-horn' && 'horn', 'idol', 'cheer', 'scribble', 'slam']) { snd.sfx(k); out['sfx-' + k] = await meter(900); await sleep(300); }
  snd.ambience({ fire: 2, scape: { venue: 'hosted-camp', night: true, open: true, shore: true, weather: 'calm' } }); await sleep(2500); out.campfireNight = await meter(2500);
  snd.ambience({ scape: { venue: 'survival-island', night: false, open: true, shore: true, weather: 'sunny' } }); await sleep(2500); out.island = await meter(2500);
  snd.ambience({ rain: true, scape: { venue: 'hosted-camp', night: false, open: true, shore: false, weather: 'rain' } }); await sleep(2500); out.campRain = await meter(2500);
  snd.stopAmbience(); mr.stop(); await new Promise(r => mr.onstop = r);
  const buf = new Uint8Array(await new Blob(chunks).arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 8192) s += String.fromCharCode(...buf.subarray(i, i + 8192));
  return { out, webm: btoa(s) };
});
for (const [k, v] of Object.entries(r.out)) console.log(k.padEnd(18), 'rms', v.rms, ' peak', v.peak);
fs.writeFileSync('shots/voices/td-mix-sample.webm', Buffer.from(r.webm, 'base64'));
console.log('errors', errs.length ? errs : 'none'); await b.close();
