// ══════════════════════════════════════════════════════════════════════
// villain-deeds.js — what each show's episodes say somebody did to somebody
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-29: "do all the simulators save the villains of the season?" Two did. js/villain-score.js ranks
// a season from its published document, and most of what makes somebody a villain on the other shows (a sabotaged
// verse, a rookie hazed, a partner stolen, a two-faced pull) lives in the episodes, not the document. Each exporter
// hands its rows here and publishes the result as `doc.villainDeeds`: `{ by, kind, line }`, kind one of the board's
// WEIGHTS, by the ACTOR (the board scores the one who did it, never the one it was done to).
//
// PURE: rows in, deeds out. "House of Villains" is the reason to keep the record honest (the user: "it would be
// useful when doing house of villains later").

/** Keep the deeds on the document, when there are any. */
export function withDeeds(doc, deeds) {
  if (Array.isArray(deeds) && deeds.length) doc.villainDeeds = deeds;
  return doc;
}

// ── Drag Race: the werk room, Untucked and the challenges ─────────────
// Named deeds first; then any scene that cost the queen who started it the room AND the audience at once, which is
// what the show's own effects say a mean moment is (a read that landed wrong, a fight in Untucked, the loud one).
const DR_NAMED = {
  sabotage: ['sabotage', (b, n, e) => `Sabotaged ${b}'s ${e.data?.craft || 'performance'} in episode ${n}.`],
  'stole-a-bit': ['stole', (b, n) => `Stole ${b}'s bit in episode ${n}.`],
  dump: ['sabotage', (b, n) => `Left ${b} carrying the work in episode ${n}.`],
  'spotlight-hog': ['cruelty', (b, n) => `Took the spotlight off ${b} in episode ${n}.`],
};
const DR_NOT_A_SCENE = /^(mini|reaction|cold|walkthrough|save|legacy|campaign|history|contest|booth|live-vocal)/;
export function dragDeeds(rows = []) {
  const out = [];
  for (const r of rows) {
    const n = r?.num ?? r?.dr?.ep ?? '?';
    for (const e of r?.dr?.events || []) {
      const [a, b] = e?.players || [];
      if (!a) continue;
      const named = DR_NAMED[e.type];
      if (named) { if (b) out.push({ by: a, kind: named[0], line: named[1](b, n, e) }); continue; }
      if (DR_NOT_A_SCENE.test(String(e.type || ''))) continue;
      const hurt = (e.bond || []).find(x => Array.isArray(x) && x[2] < 0 && (x[0] === a || x[1] === a));
      if (!hurt || !((Number(e.pop?.[a]) || 0) < 0)) continue;
      const victim = hurt[0] === a ? hurt[1] : hurt[0];
      const where = String(e.type).startsWith('untucked') ? 'in Untucked' : 'in the werk room';
      out.push({ by: a, kind: 'cruelty', line: `Went after ${victim} ${where} in episode ${n}.` });
    }
  }
  return out;
}

// ── The Challenge: the scenes the house aired ─────────────────────────
// `who` is actor first (ch/state.js addScene), so the first name did it to the second.
const CH_DEEDS = {
  mock: ['cruelty', (b, n) => `Mocked ${b} after the daily in episode ${n}.`],
  gloat: ['cruelty', (b, n) => `Gloated at ${b} after the vote in episode ${n}.`],
  'rookie-hazing': ['cruelty', (b, n) => `Hazed ${b}, a rookie, in episode ${n}.`],
  'vet-dismisses': ['cruelty', (b, n) => `Wrote ${b} off as a rookie in episode ${n}.`],
  'trash-talk': ['cruelty', (b, n) => `Trash-talked ${b} in episode ${n}.`],
  'kitchen-blowup': ['cruelty', (b, n) => `Blew up at ${b} in the kitchen in episode ${n}.`],
  'fight-physical': ['cruelty', (b, n) => `Got physical with ${b} in episode ${n}.`],
  'party-callout': ['cruelty', (b, n) => `Called ${b} out in front of a party in episode ${n}.`],
  'floater-callout': ['cruelty', (b, n) => `Called ${b} a floater to the whole house in episode ${n}.`],
  'leverage-threat': ['cruelty', (b, n) => `Threatened ${b} for a vote in episode ${n}.`],
  'overnight-sabotage': ['sabotage', (b, n) => `Sabotaged ${b} overnight in the final.`],
  throw: ['sabotage', (b, n) => `Threw a daily in episode ${n}.`],
  'scheme-lie': ['deceived', (b, n) => `Lied to the house about ${b} in episode ${n}.`],
  'deal-broken': ['deceived', (b, n) => `Broke a deal with ${b} in episode ${n}.`],
};
export function challengeDeeds(rows = []) {
  const out = [];
  for (const r of rows) {
    const n = r?.num ?? '?';
    for (const s of r?.ch?.aired || []) {
      const d = CH_DEEDS[s?.kind];
      const [a, b] = s?.who || [];
      if (!d || !a || (!b && s.kind !== 'throw')) continue;
      out.push({ by: a, kind: d[0], line: d[1](b, n) });
    }
  }
  return out;
}

// ── Perfect Match: the villa ──────────────────────────────────────────
export function perfectMatchDeeds(rows = []) {
  const out = [];
  const labelled = new Set();
  for (const r of rows) {
    const n = r?.num ?? '?';
    // the public's own read of them, week by week (pm/ledger.js labels)
    for (const [name, label] of Object.entries(r?.pm?.labels || {})) {
      if (label !== 'villain') continue;
      out.push({ by: name, kind: 'villainScene', line: labelled.has(name) ? '' : `Seen by the public as the villain from episode ${n}.` });
      labelled.add(name);
    }
    for (const e of r?.pm?.events || []) {
      const players = e?.players || [];
      if (e?.hut?.stance === 'two-faced' && e.hut.who) {
        const other = players.find(p => p !== e.hut.who);
        if (other) out.push({ by: e.hut.who, kind: 'deceived', line: `Told ${other} one thing and the hut another in episode ${n}.` });
      }
      if (e?.kind === 'argument' && players[0] && players[1] && (Number(e.pop?.[players[0]]?.approval) || 0) < 0) {
        out.push({ by: players[0], kind: 'cruelty', line: `Picked a fight with ${players[1]} in episode ${n}.` });
      }
    }
  }
  return out;
}
