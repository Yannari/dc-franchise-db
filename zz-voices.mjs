// SCRATCH (not committed): render the TD voices to WAV through an OfflineAudioContext
import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch(); const page = await b.newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(2500);
const out = await page.evaluate(async () => {
  const { audio } = await import('./js/audio.js'), snd = await import('./js/vp-td-ep/sound.js');
  const roster = await (await fetch('franchise_roster.json')).json();
  const P = n => roster.players.find(p => p.name === n) || {};
  const V = (f, wave, bright, range, rate) => ({ f, wave, bright, range, rate });
  // the same rule as screens.js voiceOf, inlined (it is module-private)
  const ARCH = { hothead: ['sawtooth', 1.12, 1.05], villain: ['sawtooth', .92, .95], 'chaos-agent': ['sawtooth', 1.15, 1.2], 'challenge-beast': ['sawtooth', .9, 1], mastermind: ['square', .85, .9], schemer: ['square', .9, 1], 'perceptive-player': ['triangle', .95, .95], wildcard: ['square', 1.1, 1.15], 'social-butterfly': ['triangle', 1.12, 1.15], showmancer: ['triangle', 1.08, 1.05], hero: ['triangle', 1.02, 1], underdog: ['triangle', 1, 1.05], 'loyal-soldier': ['triangle', .95, .95], floater: ['sine', 1, 1], goat: ['sine', 1.05, 1.1] };
  const voice = (name, sub) => { let h = 2166136261; for (const ch of name) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); const r = k => ((h >>> k) & 255) / 255; const p = P(name);
    let f = sub === 'she' ? 240 : name === 'Chef' ? 88 : 125; f *= .88 + r(0) * .24; const [w, br, pace] = ARCH[p.archetype] || ['triangle', 1, 1]; const st = p.stats || {};
    return { arch: p.archetype, v: V(f, w, br * (.94 + r(8) * .12), .07 + (st.boldness ?? 5) / 10 * .16, (9 + (st.social ?? 5) / 10 * 3) * pace) }; };
  const wav = buf => { const d = buf.getChannelData(0), n = d.length, ab = new ArrayBuffer(44 + n * 2), v = new DataView(ab); const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, buf.sampleRate, true); v.setUint32(28, buf.sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    let peak = 0; for (let i = 0; i < n; i++) { const s = Math.max(-1, Math.min(1, d[i])); peak = Math.max(peak, Math.abs(s)); v.setInt16(44 + i * 2, s * 32767, true); }
    let b = ''; const u = new Uint8Array(ab); for (let i = 0; i < u.length; i += 8192) b += String.fromCharCode(...u.subarray(i, i + 8192)); return { b64: btoa(b), peak }; };
  const render = async (secs, fn) => { const ctx = new OfflineAudioContext(1, 44100 * secs, 44100); const g = ctx.createGain(); g.gain.value = 2.5; g.connect(ctx.destination); audio.output = () => ({ ctx, dest: g }); fn(); return wav(await ctx.startRendering()); };
  const res = {};
  const lines = [['Heather', 'she', "Ugh, seriously? You're voting with them now?"], ['Owen', 'he', "Oh man, I am SO hungry right now!"], ['Gwen', 'she', 'Whatever. I just want to get through tonight.'], ['Duncan', 'he', "Relax, princess. Nobody's going home but you."], ['Lindsay', 'she', 'Wait, which one is Tyler again?'], ['Chef', 'he', 'Get in line, maggots!']];
  for (const [n, sub, text] of lines) { const { v, arch } = voice(n, sub); res[`talk-${n}`] = { ...(await render(3.2, () => snd.babble(text, v, { loud: /!$/.test(text) }))), arch, f: Math.round(v.f), wave: v.wave }; }
  for (const k of ['surprised', 'shock', 'betray', 'angry', 'sad', 'guilty', 'relief', 'scared', 'laugh', 'cry']) res[`react-Heather-${k}`] = await render(1.4, () => snd.vocal(k, voice('Heather', 'she').v));
  for (const k of ['surprised', 'angry', 'laugh']) res[`react-Owen-${k}`] = await render(1.4, () => snd.vocal(k, voice('Owen', 'he').v));
  return res;
});
for (const [k, r] of Object.entries(out)) { fs.writeFileSync(`shots/voices/${k}.wav`, Buffer.from(r.b64, 'base64')); console.log(k.padEnd(24), 'peak', r.peak.toFixed(3), r.arch || '', r.f || '', r.wave || ''); }
console.log('errors', errs.length ? errs : 'none'); await b.close();
