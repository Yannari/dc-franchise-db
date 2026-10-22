// SCRATCH: measure the loudness of every TD audio file and the music beds
import { chromium } from 'playwright';
import fs from 'fs';
const files = [...['amb', 'sfx', 'voice'].flatMap(d => fs.readdirSync(`assets/audio/td/${d}`).map(f => `assets/audio/td/${d}/${f}`)),
  ...['camp-day', 'camp-night', 'tribal', 'challenge', 'aftermath', 'victory'].map(b => `assets/audio/bed-${b}.mp3`)];
const b = await chromium.launch(); const page = await b.newPage();
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(1500);
const r = await page.evaluate(async files => {
  const ctx = new OfflineAudioContext(2, 44100, 44100), out = {};
  for (const f of files) {
    const buf = await ctx.decodeAudioData(await (await fetch(f)).arrayBuffer());
    let sum = 0, peak = 0, n = 0; const win = 4410, wins = [];
    for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) { const x = d[i]; sum += x * x; n++; if (Math.abs(x) > peak) peak = Math.abs(x); } }
    const d0 = buf.getChannelData(0); for (let i = 0; i + win < d0.length; i += win) { let s = 0; for (let j = 0; j < win; j++) s += d0[i + j] ** 2; wins.push(Math.sqrt(s / win)); }
    wins.sort((a, b) => a - b); const loud = wins[Math.floor(wins.length * .95)] || 0;
    out[f] = { dur: +buf.duration.toFixed(2), rms: +(20 * Math.log10(Math.sqrt(sum / n))).toFixed(1), p95: +(20 * Math.log10(loud)).toFixed(1), peak: +(20 * Math.log10(peak)).toFixed(1) };
  }
  return out;
}, files);
for (const [f, v] of Object.entries(r)) console.log(f.replace('assets/audio/', '').padEnd(28), `dur ${String(v.dur).padStart(6)}  rms ${v.rms}  loud95 ${v.p95}  peak ${v.peak}`);
fs.writeFileSync('shots/td-loudness.json', JSON.stringify(r, null, 1)); await b.close();
