// ══════════════════════════════════════════════════════════════════════
// tests/dr-reunion.test.js — the season, argued about by the people in it
// ══════════════════════════════════════════════════════════════════════
//
// The reunion is the only episode that reads the WHOLE season rather than the
// row in front of it, which is why it was deferred out of the plan that built
// the weekly screens. The thing it must never become is a format: a fixed
// running order of five confrontations, produced whether or not the season
// had them.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { reunionTopics } from '../js/dr/reunion.js';
import { REUNION_LINES } from '../js/dr/data/reunion-beats.js';
import { dragScreens } from '../js/vp-dr/screens.js';
import { generateDragSummaryText } from '../js/vp-dr/summary.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'schemer'];

function cast(n, seed) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
    archetype: ARCH[i % ARCH.length], age: 22 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

function season(seed, config = {}) {
  const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
  return playDragSeason({
    cast: cast(12, 9 + seed), seed, config: { drReunion: true, ...config },
    bond: (a, b) => bonds[key(a, b)] || 0,
    addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
    popDelta: () => {},
  });
}

describe('the reunion', () => {
  it('has no unwritten pools', () => {
    // A pool is lines, or question-and-answer items ({ q, a }) and
    // line-and-reply items ({ a, b }) that keep a reply with what it answers.
    const words = it => (typeof it === 'string' ? [it]
      : [it.q, ...(Array.isArray(it.a) ? it.a : [it.a]), ...(it.b || [])].filter(x => x != null));
    for (const [key, items] of Object.entries(REUNION_LINES)) {
      expect(items.length, `${key} is empty`).toBeGreaterThanOrEqual(1);
      for (const it of items) {
        for (const l of words(it)) expect(String(l).trim(), `${key} has a blank line`).not.toBe('');
        if (typeof it !== 'string' && it.q) expect(it.a.length, `${key}: a question with no answer`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('is opt-in and comes after the crowning, eliminating nobody', () => {
    const off = season(3, { drReunion: false });
    expect(off.rows.some(r => r.dr.reunion), 'a reunion appeared unasked').toBe(false);

    const on = season(3);
    const i = on.rows.findIndex(r => r.dr.reunion);
    expect(i, 'no reunion').toBeGreaterThan(-1);
    expect(on.rows[i].exits.length, 'the reunion sent somebody home').toBe(0);
    // AFTER the crowning (the user's call): the winner sits in her crown.
    expect(on.rows[i - 1]?.dr?.finale, 'the reunion does not follow the finale').toBeTruthy();
    expect(i, 'the reunion is not the last episode').toBe(on.rows.length - 1);
  });

  /* THE SEASON, NOT EIGHT CARDS. Every queen who did not win gets the hot
     seat, in the order they went home, and the lines quote the season's own
     facts — the song she went home to, the challenge she won. */
  it('seats every queen but the winner, and quotes what actually happened', () => {
    for (let s = 0; s < 6; s++) {
      const out = season(s);
      const ru = out.rows.find(r => r.dr.reunion);
      // A seat of her own, or a place in the first-ones-out segment.
      const seats = ru.dr.scenes.filter(sc => sc.data?.speaker === 'segment'
        && (sc.data?.seg === 'seat' || sc.data?.seg === 'early'))
        .flatMap(sc => (sc.data.seg === 'early' ? sc.data.players : [sc.data.players[0]]));
      const winners = out.winners || [out.winner];
      const expected = out.state.castOrder.filter(n => !winners.includes(n));
      expect([...seats].sort(), `seed ${s}`).toEqual([...expected].sort());
      expect(ru.dr.scenes.length, `seed ${s}: a superficial reunion`).toBeGreaterThan(40);
      // A queen with a seat of her own is asked about her exit: its song or
      // its episode. The first ones out share a quick segment, where the
      // question can be about the fans or the day after.
      const text = ru.dr.scenes.map(sc => sc.text).join(' ');
      const own = new Set(ru.dr.scenes.filter(sc => sc.data?.seg === 'seat' && sc.data?.speaker === 'segment')
        .map(sc => sc.data.players[0]));
      for (const row of out.rows.filter(r => r.dr?.lipsync && (r.exits || []).length && !r.dr.finale)) {
        for (const x of row.exits) {
          const name = typeof x === 'string' ? x : x?.name;
          if (!own.has(name)) continue;
          const seat = ru.dr.scenes.filter(sc => sc.data?.seg === 'seat' && sc.data?.players?.[0] === name).map(sc => sc.text).join(' ');
          const named = (row.dr.lipsync.song && seat.includes(row.dr.lipsync.song)) || new RegExp(`episode ${row.num}\\b`, 'i').test(seat);
          expect(named, `seed ${s}: ${name}'s seat never mentions her exit`).toBe(true);
        }
      }
      expect(text).not.toMatch(/\{[a-z]+\}/);   // no unfilled placeholder
    }
  });

  /* THE TEST THAT SEPARATES A MEMORY FROM A FORMAT. Every topic has to come
     out of the season: a reunion that always produced the same five
     confrontations would be a running order, not a reading. */
  it('derives every topic, and quiet seasons get fewer', () => {
    const counts = new Set();
    const kinds = {};
    for (let s = 0; s < 30; s++) {
      const out = season(s);
      const ru = out.rows.find(r => r.dr.reunion);
      const t = ru.dr.reunion.topics;
      counts.add(t.length);
      for (const x of t) kinds[x.kind] = (kinds[x.kind] || 0) + 1;
      // Nothing is invented: every topic names queens who were in this cast.
      for (const x of t) {
        for (const n of x.players) expect(out.state.castOrder).toContain(n);
      }
    }
    expect(counts.size, 'every season produced exactly the same number of topics')
      .toBeGreaterThan(1);
    // And every topic must be REACHABLE, or it is prose nothing draws.
    for (const id of ['feud', 'shock-exit', 'the-invisible', 'the-friendship',
      'the-frontrunner', 'congeniality']) {
      expect(kinds[id], `${id} never fired in 30 seasons`).toBeGreaterThan(0);
    }
  });

  it('the feud is a pair who actually shared scenes', () => {
    // A low bond between two queens who never appeared together is not a
    // feud, whatever the graph says — they have never been in a room.
    for (let s = 0; s < 15; s++) {
      const out = season(s);
      const ru = out.rows.find(r => r.dr.reunion);
      const feud = ru.dr.reunion.topics.find(t => t.kind === 'feud');
      if (!feud) continue;
      expect(feud.data.shared, `seed ${s}: a feud between strangers`).toBeGreaterThan(0);
      expect(feud.data.bond).toBeLessThanOrEqual(-3);
    }
  });

  it('the winner never also takes Miss Congeniality', () => {
    // The vote runs before the crowning so it can be announced at the
    // reunion, which means it cannot exclude a winner nobody knows yet.
    for (let s = 0; s < 25; s++) {
      const out = season(s);
      expect(out.congeniality, `seed ${s}`).toBeTruthy();
      expect(out.congeniality, `seed ${s}: crowned and sashed`).not.toBe(out.winner);
    }
  });

  it('draws a screen, and the arguments change the room', () => {
    const out = season(4);
    const ru = out.rows.find(r => r.dr.reunion);
    const screens = dragScreens(ru);
    expect(screens.map(s => s.label)).toContain('The Reunion');
    const html = screens.find(s => s.label === 'The Reunion').html;
    for (const sc of ru.dr.scenes) {
      if (!sc.text) continue;
      // A segment's title card draws its title and subtitle as two lines.
      if (sc.data?.speaker === 'segment') {
        expect(html, `${sc.kind}'s title is not on the screen`).toContain(sc.data.title);
        continue;
      }
      // A number or an award is a plate: its label and its queen.
      if (sc.data?.speaker === 'stat' || sc.data?.speaker === 'award') {
        expect(html).toContain(sc.data.stat || sc.data.award);
        expect(html).toContain(sc.data.players[0]);
        continue;
      }
      const run = sc.text.split(/["'“”’]/).sort((a, b) => b.length - a.length)[0].trim();
      expect(html, `${sc.kind} is on the row and not on the screen`).toContain(run);
    }
  });

  /* THE TRANSCRIPT IS THE SCREEN, retold: every spoken line of the reunion
     must reach the text backlog too. */
  it('reaches the transcript, every spoken line of it', () => {
    const out = season(2);
    const ru = out.rows.find(r => r.dr.reunion);
    const text = generateDragSummaryText(ru);
    const spoken = ru.dr.scenes.filter(sc => ['host', 'queen', 'room'].includes(sc.data?.speaker));
    expect(spoken.length).toBeGreaterThan(30);
    for (const sc of spoken) {
      const run = sc.text.split(/["'“”’]/).sort((a, b) => b.length - a.length)[0].trim();
      expect(text, `${sc.data.key} is not in the transcript`).toContain(run);
    }
  });

  /* NOT A FORM. The first full reunion asked every queen the same five
     questions from five-line pools, repeated lines, and answered questions
     nobody asked ("What have the fans been saying?" — "Panic."). */
  it('never says a line twice, and never leaves a question hanging', () => {
    // A question the host asks a QUEEN must be followed by a queen speaking.
    const questions = /^(early-qa|seat-exit-qa|seat-finalist-qa|seat-receipt-host|seat-high-host|seat-look-host|seat-robbed-host|seat-villain-host|seat-survivor-host|seat-frontrunner-host|seat-quiet-host|winner-host|winner-journey-host|winner-runnerup-host)$/;
    for (let s = 0; s < 12; s++) {
      const out = season(s);
      const sc = out.rows.find(r => r.dr.reunion).dr.scenes.filter(x => x.text && x.data?.speaker !== 'segment');
      const seen = new Set();
      for (const x of sc) {
        if (x.data.speaker === 'stat' || x.data.speaker === 'award') continue;
        expect(seen.has(x.text), `seed ${s}: said twice: ${x.text.slice(0, 60)}`).toBe(false);
        seen.add(x.text);
      }
      sc.forEach((x, i) => {
        if (x.data.speaker !== 'host' || !questions.test(x.data.key)) return;
        expect(sc[i + 1]?.data?.speaker, `seed ${s}: unanswered: ${x.text.slice(0, 70)}`).toBe('queen');
      });
      // The seats are not all one kind.
      const kinds = new Set(sc.filter(x => x.data.seg === 'seat' && x.data.speaker === 'host').map(x => x.data.key));
      expect(kinds.size, `seed ${s}: every seat asked the same thing`).toBeGreaterThan(3);
    }
  });

  /* THE STAGE CUTS TO WHOEVER IS TALKING. One speaker at a time: on every
     step the two-shot at the top shows that step's line and its speaker. */
  it('puts every speaker on the stage on her own step', () => {
    const out = season(5);
    const ru = out.rows.find(r => r.dr.reunion);
    const html = dragScreens(ru).find(s => s.label === 'The Reunion').html;
    document.body.innerHTML = html;
    const steps = ru.dr.scenes.filter(sc => sc.kind !== 'reunion-open');
    const cut = window._drRevealExtra.reunion;
    steps.forEach((sc, i) => {
      if (sc.data?.speaker !== 'queen') return;
      cut(i);
      const shot = document.getElementById('ru-shot');
      const who = sc.data.speakerName || sc.data.players[0];
      expect(shot.querySelector('.ru-sp b')?.textContent, `step ${i}`).toBe(who);
      const run = sc.text.split(/["'“”’]/).sort((a, b) => b.length - a.length)[0].trim();
      expect(shot.textContent, `step ${i}: the line is not on the stage`).toContain(run);
    });
  });
});

