// SCRATCH (not committed): record a TD venue's ambience in real time to webm
import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const page = await b.newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(2000);
for (const [name, spec, secs] of [
  ['island-beach-day', { scape: { venue: 'survival-island', night: false, open: true, shore: true, weather: 'sunny' } }, 20],
  ['island-night', { scape: { venue: 'survival-island', night: true, open: true, shore: true, weather: 'calm' } }, 12],
  ['camp-campfire-night', { fire: 2, scape: { venue: 'hosted-camp', night: true, open: true, shore: true, weather: 'calm' } }, 12],
]) {
  const b64 = await page.evaluate(async ({ spec, secs }) => {
    const { audio } = await import('./js/audio.js'), snd = await import('./js/vp-td-ep/sound.js');
    const ctx = new AudioContext(); await ctx.resume(); const dest = ctx.createMediaStreamDestination();
    audio.output = () => ({ ctx, dest }); audio._currentBed = null;
    const rec = new MediaRecorder(dest.stream); const chunks = []; rec.ondataavailable = e => chunks.push(e.data); rec.start();
    snd.ambience(spec);
    await new Promise(r => setTimeout(r, secs * 1000)); snd.stopAmbience(); rec.stop(); await new Promise(r => rec.onstop = r);
    const buf = new Uint8Array(await new Blob(chunks).arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 8192) s += String.fromCharCode(...buf.subarray(i, i + 8192)); await ctx.close(); return btoa(s);
  }, { spec, secs });
  fs.writeFileSync(`shots/voices/amb-${name}.webm`, Buffer.from(b64, 'base64')); console.log(name, Buffer.from(b64, 'base64').length, 'bytes');
}
console.log('errors', errs.length ? errs : 'none'); await b.close();
