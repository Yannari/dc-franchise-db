// ══════════════════════════════════════════════════════════════════════
// tr-host-explanations.test.js — was the viewer told the rule BEFORE the
// rule did something to somebody
// ══════════════════════════════════════════════════════════════════════
//
// THE DEFECT THIS WAS WRITTEN AGAINST, and it was found by rendering the
// screen and reading it rather than by any assertion in this suite:
//
//   A blocked murder — the Traitors write a name, the name is holding a
//   shield, nobody dies — rendered to the audience as "Something between that
//   room and this one ate it." That is a mood line standing where an
//   explanation should be. A viewer meeting their first blocked murder was
//   never told a shield exists, never told it was spent, and never told the
//   castle is not going to find out. The format's single strongest deduction
//   event read as the show declining to explain itself.
//
// The premiere briefing already had the right shape for the STANDING rules:
// every spoken beat carries a `ruleId` and `rulePoints` maps the id to the
// beat index (js/tr/headless.js), and js/tr/missions/contract.js refuses to
// build a mission whose host never explains `reward`. Nothing carried that
// contract into the middle of a season, which is exactly where the rules a
// viewer has not met yet all live.
//
// WHAT IS ASSERTED HERE, and why each arm is shaped the way it is:
//
//   1. THE PREMIERE REALLY CARRIES ITS RULES. The briefing is prose, and prose
//      gets edited; a rule quietly dropped from the speech would leave the
//      registry claiming it was explained. Structural, off `rulePoints`.
//
//   2. NOTHING HAPPENS BEFORE IT IS EXPLAINED. Plays real seasons, walks the
//      episodes in order, and for every rule the episode actually invoked
//      (`rulesInPlay`, read off the episode record) asserts the explanation
//      landed at or before that episode. This is the ordering arm, and it is
//      the one that would have caught the defect above: a surprise rule whose
//      screen never states it has no explaining episode at all.
//
//   3. THE VIEWER IS TOLD, NOT THE FUNCTION IS CALLED. The surprise arms
//      search the RENDERED HTML for the concepts the rule turns on, through
//      `buildVPScreens` rather than by calling a builder directly — calling
//      the builder directly proves a function returns a string, which is what
//      every unreachable screen in this repo also did. It also means a screen
//      that explains itself in its own prose (the Armoury does) passes without
//      being made to route through a helper it does not need.
//
//   4. AN AUDIENCE-ONLY EXPLANATION STAYS AUDIENCE-ONLY. The blocked-murder
//      reminder says a murder was attempted. The castle never learns that. A
//      reminder leaking into a player's stream would hand a player the best
//      deduction in the format for free, so the same observer contract that
//      governs facts governs explanations of facts.
//
// FILENAME: deliberately not `*-audit.test.js` — vitest.config.js excludes
// that pattern from `npm test`, and this project has shipped guards into that
// hole before. Collection verified with `npx vitest list`.
import { describe, expect, it } from 'vitest';
import { gs, setPlayers, seasonConfig } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { buildVPScreens } from '../js/vp-screens.js';
import { TR_RULES, PREMIERE_RULES, SURPRISE_RULES, rulesInPlay, ruleReminder }
  from '../js/tr-rules.js';
import { rpBuildColdOpen } from '../js/vp-tr/cold-open.js';
import { exitVerbs, roundExits } from '../js/shows.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);

// WHO IS ACTUALLY NOT AT THIS TABLE, derived exactly the way the screen
// derives it (js/vp-tr/cold-open.js `_view`): the previous night's exits,
// filtered to the ones that left by the NIGHT verb.
//
// The first version of this helper read `dawn.victims`, which does not exist.
// Every morning therefore looked quiet, the guard's premise was false on every
// row, and it reported the first death morning it met as a defect. A guard
// whose subject is a misspelling is a guard that fails for the wrong reason —
// and had the pool bug still been live, this arm would have "caught" it while
// pointing at an innocent episode.
const TR_SHOW = 'traitors';
function nightGone(tr) {
  const [vote, night] = exitVerbs(TR_SHOW);
  const nv = night || vote || 'out';
  const ex = (tr && tr.dawn && tr.dawn.lastNight) || [];
  return roundExits({ exits: ex.map(x => ({ ...x })) }, TR_SHOW).filter(x => x.verb === nv);
}

/** Strip the stylesheet: a CSS rule is not the screen telling anybody anything. */
const body = h => String(h == null ? '' : h).replace(/<style>[\s\S]*?<\/style>/g, '');

function season(seed, cfg) {
  setPlayers(ROSTER);
  if (cfg) Object.assign(seasonConfig, cfg);
  else seasonConfig.trShieldSource = 'mission';
  const s = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
  return { season: s, episodes: (gs.episodeHistory || []).map(e => ({ ...e })) };
}

// Seeds chosen to reach the rare branches: a blocked murder happens in roughly
// one season in twenty, so a three-seed sweep would measure nothing. The
// Armoury is optional by construction and only plays when the author opened
// it, so one run does.
const RUNS = [];
for (let seed = 1; seed <= 24; seed++) RUNS.push(season(seed));
RUNS.push(season(8, { trShieldSource: 'armoury', trArmourySize: 4 }));

/** Everything the audience sees this episode, as one searchable string. */
function audienceHtml(ep) {
  let out = '';
  for (const s of buildVPScreens(ep)) out += body(s.html) + '\n';
  return out;
}

// ── 1. the premiere carries the rules it claims to carry ──────────────
describe('the standing rules are explained at the premiere', () => {
  it('every premiere rule is a spoken beat with a rule point behind it', () => {
    const prem = RUNS[0].episodes
      .map(e => e.tr && e.tr.arrival && e.tr.arrival.rules).find(Boolean);
    expect(prem, 'no played season produced a premiere briefing').toBeTruthy();
    const ids = (prem.rulePoints || []).map(p => p.id);
    for (const id of PREMIERE_RULES) {
      // `faithfuls-banish` is said on the gravel at the Selection rather than
      // on the flags at the briefing; both are before night one, which is the
      // property that matters, so either ceremony satisfies it.
      if (id === 'faithfuls-banish') continue;
      expect(ids, `the briefing never explains \`${id}\``).toContain(id);
      const p = prem.rulePoints.find(x => x.id === id);
      const beat = prem.hostBeats[p.explainedByBeat];
      expect(beat, `\`${id}\` points at a beat that is not there`).toBeTruthy();
      expect(beat.ruleId, `\`${id}\` points at the beat that explains ${beat.ruleId}`)
        .toBe(id);
      expect(String(beat.text).length,
        `\`${id}\` is explained in ${beat.text.length} characters`).toBeGreaterThan(60);
    }
  });

  it('the registry and the briefing agree about what a rule says', () => {
    for (const id of Object.keys(TR_RULES)) {
      const r = TR_RULES[id];
      expect(r.reminder.length, `\`${id}\` has no usable reminder`).toBeGreaterThan(40);
      expect(r.fullRules.length, `\`${id}\` has no usable fullRules`).toBeGreaterThan(60);
      expect(r.trigger.length, `\`${id}\` has no trigger`).toBeGreaterThan(10);
      expect(['all', 'audience'], `\`${id}\` has an unknown visibility`)
        .toContain(r.observerVisibility);
      expect(['premiere', 'first-occurrence'], `\`${id}\` is explained nowhere`)
        .toContain(r.explainedAt);
    }
  });
});

// ── 2. and 3. nothing happens before the viewer is told what it is ────
//
// The concepts each surprise rule turns on. Not the wording — the wording is
// allowed to be rewritten, and a guard that pins prose is a guard that gets
// deleted the first time somebody improves a sentence. What is pinned is that
// the two facts a viewer cannot deduce for themselves are both on the screen.
const SURPRISE_CONCEPTS = {
  'murder-blocked-by-shield': [/shield/i, /block|fail|stopp?ed/i],
  'recruitment-note': [/note|anonymous|unsigned/i, /refus/i],
  'recruitment-ultimatum': [/refus/i, /removed|killed|not return|be removed/i],
  'armoury-shield': [/shield/i, /door/i],
};

describe('every rule is explained at or before the episode it governs', () => {
  it('the surprise rules state themselves on the screen that first runs them', () => {
    const reached = new Set();
    for (const run of RUNS) {
      const explained = new Set();
      for (const ep of run.episodes) {
        if (!ep.tr) continue;
        const html = audienceHtml(ep);
        for (const id of rulesInPlay(ep.tr)) {
          if (!SURPRISE_RULES.includes(id)) continue;
          reached.add(id);
          const wants = SURPRISE_CONCEPTS[id] || [];
          for (const re of wants) {
            expect(re.test(html),
              `ep ${ep.num}: \`${id}\` happened and the screen never says ${re}`).toBe(true);
          }
          explained.add(id);
        }
      }
    }
    // THE ARM THAT KEEPS THE ARM ABOVE HONEST. Every assertion in the loop is
    // vacuously true on a sweep where the branch never fires, which is how a
    // rare-event guard passes for years against the bug it was written for.
    for (const id of SURPRISE_RULES) {
      expect(reached.has(id), `no season in this sweep ever reached \`${id}\``).toBe(true);
    }
  });

  it('a rule never governs an episode earlier than the one that explains it', () => {
    for (const run of RUNS) {
      // The premiere rules are explained in episode one, before any night has
      // been played, so their explaining index is 0 by construction. The
      // surprises are explained by the episode that runs them, which is the
      // same index — the point of the arm is that neither may be LATER.
      const firstUse = {};
      const firstExplained = {};
      run.episodes.forEach((ep, i) => {
        if (!ep.tr) return;
        if (ep.tr.arrival && ep.tr.arrival.rules) {
          for (const p of ep.tr.arrival.rules.rulePoints || []) {
            if (firstExplained[p.id] === undefined) firstExplained[p.id] = i;
          }
        }
        if (ep.tr.selection) {
          for (const p of ep.tr.selection.rulePoints || []) {
            if (firstExplained[p.id] === undefined) firstExplained[p.id] = i;
          }
        }
        for (const id of rulesInPlay(ep.tr)) {
          if (firstUse[id] === undefined) firstUse[id] = i;
          if (SURPRISE_RULES.includes(id) && firstExplained[id] === undefined) {
            firstExplained[id] = i;      // the screen that runs it explains it
          }
        }
      });
      for (const id of Object.keys(firstUse)) {
        expect(firstExplained[id],
          `\`${id}\` governed episode ${firstUse[id] + 1} and is explained nowhere`)
          .toBeDefined();
        expect(firstExplained[id],
          `\`${id}\` is explained at episode ${firstExplained[id] + 1} but first `
          + `governs episode ${firstUse[id] + 1}`).toBeLessThanOrEqual(firstUse[id]);
      }
    }
  });
});

// ── 4. an audience-only explanation stays audience-only ───────────────
describe('the observer contract governs explanations too', () => {
  it('ruleReminder refuses an audience-only rule to a player', () => {
    expect(TR_RULES['murder-blocked-by-shield'].observerVisibility).toBe('audience');
    expect(ruleReminder('murder-blocked-by-shield', 'audience')).toBeTruthy();
    expect(ruleReminder('murder-blocked-by-shield', 'player:Anyone')).toBeNull();
    // A public rule is public to both.
    expect(ruleReminder('recruitment-note', 'player:Anyone')).toBeTruthy();
  });

  it('no player watching a blocked morning is told a murder was attempted', () => {
    let seen = 0;
    for (const run of RUNS) {
      for (const ep of run.episodes) {
        if (!ep.tr || !ep.tr.dawn || !ep.tr.dawn.blocked) continue;
        seen++;
        const aud = body(rpBuildColdOpen(ep, 'audience'));
        expect(aud, 'the audience is not told a shield blocked it').toMatch(/shield/i);
        for (const who of (ep.tr.living || []).slice(0, 6)) {
          const mine = body(rpBuildColdOpen(ep, 'player:' + who));
          expect(/shield/i.test(mine),
            `${who} was told a shield blocked a murder they never heard about`).toBe(false);
          expect(/murder failed|blocked/i.test(mine),
            `${who} was told the murder failed`).toBe(false);
        }
      }
    }
    expect(seen, 'no season in this sweep produced a blocked murder').toBeGreaterThan(0);
  });
});

// ── the morning card may not assert a death that did not happen ───────
//
// Found by rendering 40 seasons of cold opens and grepping them: the day card
// is pushed on EVERY morning and drew from one four-line pool, three of whose
// lines asserted a body ('one fewer player', 'a new murder to investigate',
// 'the victim confirmed'). A blocked morning — every chair full — closed on
// 'the morning closes with the victim confirmed'. Day one escaped only because
// episode one keys to the same variant every season.
describe('the morning card knows whether anybody actually died', () => {
  it('never reports a victim on a morning with nobody missing', () => {
    const DEATHY = /one fewer player|a new murder to investigate|the victim confirmed/i;
    let quiet = 0;
    for (const run of RUNS) {
      for (const ep of run.episodes) {
        if (!ep.tr || !ep.tr.dawn) continue;
        if (nightGone(ep.tr).length) continue;
        quiet++;
        const html = body(rpBuildColdOpen(ep, 'audience'));
        expect(DEATHY.test(html),
          `ep ${ep.num}: nobody died and the screen says ${(html.match(DEATHY) || [])[0]}`)
          .toBe(false);
      }
    }
    expect(quiet, 'no morning in this sweep was a quiet one').toBeGreaterThan(0);
  });
});
