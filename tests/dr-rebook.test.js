// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-rebook.test.js — a challenge pinned mid-season actually runs
// ══════════════════════════════════════════════════════════════════════
//
// The bug this file exists for, in the words it was reported in: "lipsync lala
// is getting forced to me, I'm not sure why, when my episode clearly picked the
// ball in the dropdown". A drag season decides its WHOLE running order on the
// first press of Simulate Episode and queues the finished nights, so a pin made
// after episode one aired changed nothing — the dropdown went pink and the week
// it named had been booked minutes earlier.
//
// Two properties have to hold together, and one without the other is worse than
// neither: the pin must take effect on the week it names, AND the weeks already
// watched must come back byte-identical. A re-book that quietly re-runs episode
// two is the "episodes that never happened" corruption in a new hat.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import * as core from '../js/core.js';
import { playDragSeason } from '../js/dr/season.js';
import { streamFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const DRAG = ['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing'];
const CAST = Array.from({ length: 12 }, (_, i) => ({
  name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'wildcard', age: 25,
  stats: Object.fromEntries(STATS.map((s, j) => [s, 3 + ((i * 7 + j * 3) % 7)])),
  drag: Object.fromEntries(DRAG.map((s, j) => [s, 3 + ((i * 5 + j * 4) % 7)])),
}));

// What a night looked like, in enough detail that a re-run of it would show.
const sig = row => JSON.stringify({
  num: row.num,
  maxi: row.dr?.challenge?.id,
  guest: row.dr?.guest?.name || null,
  song: row.dr?.songTitle || null,
  runway: row.dr?.runway?.[0]?.category || null,
  win: row.dr?.call?.win,
  out: (row.exits || []).map(x => x.name),
  living: row.dr?.living,
  scenes: (row.dr?.scenes || []).length,
});

describe('the season dice', () => {
  it('gives every episode a stream of its own, well away from its neighbours', () => {
    // Consecutive salts off one seed must not open on nearly the same number:
    // that is the LCG defect documented in js/dr/rng.js, and deriving a week's
    // dice as `rngFor(seed + episode)` would walk straight into it.
    const firsts = Array.from({ length: 12 }, (_, e) => streamFor(4711, 5000 + e)());
    const spread = Math.max(...firsts) - Math.min(...firsts);
    expect(spread).toBeGreaterThan(0.6);
    // And it is a function of the pair, not of the order it was asked in.
    expect(streamFor(4711, 5003)()).toBe(firsts[3]);
  });
});

describe('re-booking a season already in progress', () => {
  const play = pins => playDragSeason({
    cast: CAST, seed: 4711, config: { drSchedule: pins, drFinale: 'top4' },
  });

  it('runs the pinned challenge on the week it was pinned to', () => {
    const pinned = play([{ episode: 5, maxiId: 'ball' }]);
    expect(pinned.rows[4].dr.challenge.id).toBe('ball');
  });

  it('replays the weeks already watched byte-for-byte when they are frozen', () => {
    /* THE WHOLE FIX RESTS ON THIS. `playDragSeason` hands back the row it
       actually ran each night; js/dr-run.js keeps them on `gs._drSchedule` and
       feeds the aired ones back as pins. If they did not replay identically,
       re-booking the future would rewrite the past. */
    const first = play([]);
    const airedFour = first.schedule.filter(r => r.episode <= 4);
    const rebooked = play([...airedFour, { episode: 5, maxiId: 'ball' }]);

    for (let i = 0; i < 4; i++) {
      expect(sig(rebooked.rows[i]), `episode ${i + 1}`).toBe(sig(first.rows[i]));
    }
    expect(rebooked.rows[4].dr.challenge.id).toBe('ball');
  });

  it('records a schedule row for every episode it played', () => {
    const season = play([]);
    const ordinary = season.rows.filter(r => !r.dr?.finale);
    expect(season.schedule.map(r => r.episode))
      .toEqual(ordinary.map(r => r.num));
    for (const r of season.schedule) expect(r.maxiId).toBeTruthy();
  });
});

describe('re-running one night', () => {
  const play = (pins, reroll) => playDragSeason({
    cast: CAST, seed: 4711,
    config: { drSchedule: pins, drFinale: 'top4', drReroll: reroll || null },
  });

  it('turns the dice from the episode it was pressed on, and nowhere before it', () => {
    /* The whole promise of the button, and the reason it can be allowed to
       exist at all: "Episodes N–M will be replaced with new results" has to
       mean episodes 1..N-1 are NOT. */
    const first = play([]);
    const frozen = first.schedule.filter(r => r.episode <= 3);
    const again = play(frozen, { from: 4, nonce: 1 });

    for (let i = 0; i < 3; i++) {
      expect(sig(again.rows[i]), `episode ${i + 1}`).toBe(sig(first.rows[i]));
    }
    expect(sig(again.rows[3])).not.toBe(sig(first.rows[3]));
  });

  it('gives a different night every time it is pressed', () => {
    // A re-run that came back identical would not be a re-run.
    const base = play([]);
    const frozen = base.schedule.filter(r => r.episode <= 3);
    const seen = new Set([sig(base.rows[3])]);
    for (const nonce of [1, 2, 3]) seen.add(sig(play(frozen, { from: 4, nonce }).rows[3]));
    expect(seen.size).toBe(4);
  });

  it('leaves a season with no reroll exactly where it was', () => {
    expect(sig(play([]).rows[3])).toBe(sig(play([], null).rows[3]));
  });
});

describe('js/dr-run.js', () => {
  let dr;

  beforeEach(async () => {
    core.setPlayers(CAST.map(p => ({ ...p })));
    core.setSeasonConfig({
      ...core.defaultConfig(), format: 'drag-race', seasonNumber: 3,
      drFinale: 'top4', drSchedule: [], twistSchedule: [],
    });
    core.setGs({ episodeHistory: [], eliminated: [], popularity: {}, phase: 'stage', _drSeed: 4711 });
    dr = await import('../js/dr-run.js');
  });

  it('is a drag season, and the first press books the whole running order', () => {
    expect(dr.isDragSeason()).toBe(true);
    const one = dr.simulateDragEpisode();
    expect(one).toBeTruthy();
    expect(core.gs._drSchedule.length).toBeGreaterThan(4);
    expect(dr.dragEpisodesAired()).toBe(1);
  });

  it('a pin made after episode one still reaches the week it names', () => {
    const one = dr.simulateDragEpisode();
    const airedSig = sig(one);

    // What the timeline does when the Ball is chosen for episode five.
    core.seasonConfig.drSchedule = [{ episode: 5, maxiId: 'ball' }];
    expect(dr.invalidateDragQueue()).toBe(true);

    const rest = [];
    for (let i = 0; i < 4; i++) rest.push(dr.simulateDragEpisode());

    // The night already watched is the night already watched.
    expect(sig(core.gs.episodeHistory[0])).toBe(airedSig);
    // And episode five runs what was asked for.
    expect(rest[3].num).toBe(5);
    expect(rest[3].dr.challenge.id).toBe('ball');
  });

  it('and does nothing at all without the invalidation — the control arm', () => {
    /* WITHOUT THIS THE TEST ABOVE IS UNFAILABLE. If the scheduler happened to
       book the Ball on episode five by itself, that test would pass against the
       bug it was written for. This is the same season with the same pin and no
       `invalidateDragQueue`, which is exactly the code that shipped: the queue
       decided in the first press wins, and the pin is furniture. */
    dr.simulateDragEpisode();
    core.seasonConfig.drSchedule = [{ episode: 5, maxiId: 'ball' }];
    const rest = [];
    for (let i = 0; i < 4; i++) rest.push(dr.simulateDragEpisode());
    expect(rest[3].num).toBe(5);
    expect(rest[3].dr.challenge.id).not.toBe('ball');
  });

  /* ── PRESSING ↺ GOES THROUGH A CHECKPOINT, AND THE TEST HAS TO TOO ──
     The first version of this test rolled the season back by truncating
     `episodeHistory` in place, which left `gs._drReroll` sitting there — so it
     passed against the bug it was written for. `replayEpisode` does not do
     that: it replaces `gs` with a deep clone of the checkpoint, which rolls the
     re-run counter back with everything else, and THEN re-saves that checkpoint
     from the restored state. Anything the re-run writes after that line is
     written somewhere the next press rolls over. Modelled exactly here. */
  const pressReplay = (cp, epNum) => {
    core.setGs(JSON.parse(JSON.stringify(cp)));      // gs = checkpoint
    const ok = dr.rerunDragEpisode(epNum);           // must come BEFORE the re-save
    const resaved = JSON.parse(JSON.stringify(core.gs));
    return { ok, cp: resaved, row: dr.simulateDragEpisode() };
  };

  it('a re-run drops the queue and names the night it starts from', () => {
    dr.simulateDragEpisode();
    dr.simulateDragEpisode();
    let cp3 = JSON.parse(JSON.stringify(core.gs));   // the checkpoint for episode 3
    const original = dr.simulateDragEpisode();
    expect(original.num).toBe(3);

    core.seasonConfig.drSchedule = [{ episode: 3, maxiId: 'girl-group' }];
    const first = pressReplay(cp3, 3);
    expect(first.ok).toBe(true);
    expect(first.cp._drReroll).toEqual({ from: 3, nonce: 1 });
    expect(first.row.num).toBe(3);
    expect(first.row.dr.challenge.id).toBe('girl-group');
  });

  it('gives a different night on every press, not the same one forever', () => {
    dr.simulateDragEpisode();
    dr.simulateDragEpisode();
    let cp3 = JSON.parse(JSON.stringify(core.gs));

    const seen = new Set([sig(dr.simulateDragEpisode())]);
    for (const expected of [1, 2, 3]) {
      const press = pressReplay(cp3, 3);
      expect(press.cp._drReroll.nonce, `press ${expected}`).toBe(expected);
      seen.add(sig(press.row));
      cp3 = press.cp;                                // what the next press restores
    }
    expect(seen.size, 'a press came back as a night already seen').toBe(4);
  });

  it('the episodes before a re-run are untouched by it', () => {
    const aired = [dr.simulateDragEpisode(), dr.simulateDragEpisode()].map(sig);
    const cp3 = JSON.parse(JSON.stringify(core.gs));
    dr.simulateDragEpisode();
    const press = pressReplay(cp3, 3);
    expect(press.row.num).toBe(3);
    expect(core.gs.episodeHistory.slice(0, 2).map(sig)).toEqual(aired);
  });

  /* THE TEST ABOVE MODELS `replayEpisode`'s SEQUENCE; THIS ONE CHECKS IT IS
     STILL THAT SEQUENCE. Modelling a caller is how a guard ends up green while
     the caller it stands for is wrong — the ordering is the entire bug, and it
     lives in run-ui.js rather than in anything the model can reach. */
  it('run-ui bumps the re-run counter before it re-saves the checkpoint', () => {
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..',
      'js', 'run-ui.js'), 'utf8');
    const body = src.slice(src.indexOf('export function replayEpisode'));
    const bump = body.indexOf('rerunDragEpisode(epNum)');
    const save = body.indexOf('_saveEpisodeCheckpoint()');
    expect(bump, 'replayEpisode no longer calls rerunDragEpisode').toBeGreaterThan(-1);
    expect(save, 'replayEpisode no longer re-saves the checkpoint').toBeGreaterThan(-1);
    expect(bump, 'the counter is bumped after the re-save, so it rolls back')
      .toBeLessThan(save);
  });

  /* ── A MISSING RUNNING ORDER IS REBUILT, NOT REFUSED ──
     These two used to assert the opposite: a season with no `_drSchedule` was
     refused outright, by both buttons. That was right while continuing a
     season meant REPLAYING it — a replay needs to know what every aired week
     was booked with or it produces a different season under a history that
     has already gone out.
     Continuing RESUMES now. It picks the season up from the state the last
     aired week carried and replays nothing, so the running order can be
     rebuilt from the rows themselves (`repairOldDragSeason`) and the season
     carries on from where it stood.
     The refusal was not free. `_drSchedule` goes missing on every ordinary
     save: `playDragSeason` returns the weeks it PLAYED, a resume plays only
     the weeks from the resume point on, and that array was assigned over the
     record wholesale — so one reload was enough to lose every aired week.
     From then on the season said it could not be re-booked, `invalidateDragQueue`
     truncated nothing, and the booking that survived out-ranked the author's
     pin for ever. Reported as "I changed episode 13 to Stand-Up and the result
     is always Talent Show". See tests/dr-pin-survives-resume.test.js. */
  it('rebuilds a missing running order and re-runs anyway', () => {
    dr.simulateDragEpisode();
    delete core.gs._drSchedule;
    expect(dr.dragScheduleRecorded(), 'the record is there after all').toBe(false);
    expect(dr.rerunDragEpisode(1), 'a season that can resume was refused').toBe(true);
    // And the record it rebuilt is the season that actually aired.
    expect(dr.dragScheduleRecorded()).toBe(true);
  });

  it('rebuilds a missing running order and re-books anyway', () => {
    dr.simulateDragEpisode();
    delete core.gs._drSchedule;          // what one reload leaves behind
    expect(dr.dragScheduleRecorded()).toBe(false);
    expect(dr.invalidateDragQueue(), 'the pin was silently dropped').toBe(true);
    expect(dr.dragScheduleRecorded()).toBe(true);
  });

  it('still refuses a season that cannot be picked up at all', () => {
    /* The guard is not vacuous. A last row with nobody standing on it is a
       season neither `dr.state` nor `_stateFromHistory` can resume from, and
       that one is still refused rather than rebuilt on a guess. */
    dr.simulateDragEpisode();
    delete core.gs._drSchedule;
    delete core.gs._drInitBonds;
    const last = core.gs.episodeHistory[core.gs.episodeHistory.length - 1];
    delete last.dr.state;
    last.dr.living = [];
    expect(dr.invalidateDragQueue()).toBe(false);
    expect(dr.dragScheduleRecorded()).toBe(false);
  });
});
