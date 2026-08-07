// Instant Eviction — the twist is the sequestration, not the missing veto.
//
// It shipped as `rules: { vetoCount: 0 }` and nothing else, which is the one
// part of it the wiki treats as incidental. The sentence that matters is "the
// newly crowned Head of Household is sequestered, where they must make their
// nominations without speaking to any of their fellow houseguests" — so what is
// asserted here is INFORMATION, not scheduling: that the door actually shuts,
// that the conversations a normal week is made of do not happen, and that being
// locked away costs them something they cannot take back.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const NAMES = ['Julia', 'Bowie', 'Wayne', 'Raj', 'Eli', 'Fern',
  'Gus', 'Hicks', 'Iris', 'Jae', 'Kit', 'Lex'];
const ARCH = ['mastermind', 'social-butterfly', 'challenge-beast', 'schemer', 'hero', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'perceptive-player'];
const CAST = NAMES.map((name, i) => ({ name, archetype: ARCH[i], gender: i % 2 ? 'f' : 'm',
  sexuality: 'straight', stats: spread(i + 1) }));

function house(twist = 'bb-instant-eviction') {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  globalThis.gs = gs; globalThis.players = players;
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'disabled' });
  seasonConfig.twistSchedule = twist ? [{ episode: 1, type: twist }] : [];
}

/** Play one instant-eviction week and hand back the act. */
function playWeek() {
  const ep = simulateBBEpisode();
  return { ep, act: (ep?.acts || []).find(a => a.type === 'instant-eviction') };
}

beforeEach(() => house());

describe('the locked door', () => {
  it('shuts on the Head of Household every time', () => {
    for (let i = 0; i < 8; i++) {
      house();
      const { act } = playWeek();
      expect(act, 'no instant eviction ran').toBeTruthy();
      expect(act.sequestered, 'the twist ran without sequestering anybody').toBeTruthy();
      expect(act.sequestered.hoh).toBe(act.hoh);
      expect(act.sequestered.where.length).toBeGreaterThan(3);
      // Never printed as "0 minutes" — the overnight version says so.
      expect(act.sequestered.clock).toMatch(/minutes|overnight/);
    }
  });

  it('does not shut on an ordinary week', () => {
    house(null);
    const ep = simulateBBEpisode();
    expect((ep.acts || []).some(a => a.type === 'instant-eviction')).toBe(false);
    expect(ep.sequestered ?? null).toBeNull();
  });

  it('takes the pawn conversation away, because there is nobody to have it with', () => {
    // A pawn is somebody who AGREED to sit there. You cannot ask through a
    // locked door, so a sequestered Head of Household runs two real targets —
    // the same reason an invisible one does.
    for (let i = 0; i < 8; i++) {
      house();
      const { ep } = playWeek();
      expect(ep.pawnAsk ?? null, 'somebody was asked to volunteer through a locked door').toBeNull();
    }
  });
});

describe('what it costs them', () => {
  it('lets the house hear the whole thing when the screen is left on', () => {
    // Topaz's version, and the best thing on the page: she reasoned out loud in
    // a locked room with the television still on downstairs.
    // The watched room is one of four, so this needs room to find one.
    let leaks = 0;
    for (let i = 0; i < 30 && leaks < 3; i++) {
      house();
      const { act } = playWeek();
      if (!act?.overheard) continue;
      leaks++;
      // Only ever in the room that is actually watched.
      expect(act.sequestered.watched).toBe(true);
      expect(act.overheard.text).toContain(act.hoh);
      expect(act.overheard.overheard.length).toBeGreaterThan(0);
      // The two people it was about hear it, and are told so.
      expect(act.overheard.reaction).toContain(act.overheard.overheard[0]);
      for (const named of act.overheard.overheard) {
        expect(act.nominees).toContain(named);
      }
    }
    expect(leaks, 'the house never once overheard the deliberation').toBeGreaterThan(0);
  });

  it('makes them wrong sometimes, and not every single week', () => {
    // Kevin's version: nominated in five minutes, talked round within the hour,
    // no ceremony to change anything at. Firing this on every week was the first
    // cut and it made the Head of Household permanently wrong rather than
    // occasionally caught out — thirteen weeks of regret in fourteen.
    let regrets = 0, weeks = 0;
    for (let i = 0; i < 16; i++) {
      house();
      const { act } = playWeek();
      if (!act) continue;
      weeks++;
      if (!act.regret) continue;
      regrets++;
      expect(act.nominees).not.toContain(act.regret.missed);
      expect(act.regret.cost).toContain(act.regret.missed);
    }
    expect(weeks).toBeGreaterThan(10);
    expect(regrets, 'the locked room never once cost them anything').toBeGreaterThan(0);
    expect(regrets, 'the Head of Household is wrong every single week').toBeLessThan(weeks);
  });
});

describe('the house is told', () => {
  it('announces the rule, in a register that fits a rule nobody can win', () => {
    const contract = BB_TWIST_CONTRACTS['bb-instant-eviction'];
    expect(contract.announcement, 'the twist was never announced at all').toBeTruthy();
    expect(contract.announcement.reactions).toBe('dread');

    house();
    const { ep } = playWeek();
    const ann = (ep.acts || []).find(a => a.type === 'twist-announcement');
    expect(ann).toBeTruthy();
    expect((ann.announced || []).map(a => a.name)).toContain('Instant Eviction');
    // The default reactions are written for a POWER. Nobody hopes to win an
    // eviction with no veto attached to it.
    const said = (ann.socialBeats || []).map(b => b.text).join(' ');
    expect(said).not.toMatch(/I hope I win it/);
    expect(said).toMatch(/no veto|before dinner|nothing to ask|no afternoon/i);
  });

  it('gets its own gathering when another twist lands the same week', () => {
    // Two rules read out at one meeting produced ONE reaction — whichever
    // register won — so a week that opened with both the Saboteur and this said
    // "well, it's one of you" and nobody mentioned that somebody was going home
    // that night with no veto to stop it. The second rule was on the screen, in
    // the transcript, and had happened to nobody.
    house();
    seasonConfig.bbSaboteur = 'random';
    seasonConfig.bbSaboteurBankWeek = 6;
    const ep = simulateBBEpisode();
    delete seasonConfig.bbSaboteur;

    const anns = (ep.acts || []).filter(a => a.type === 'twist-announcement');
    expect(anns.length, 'two rules were read out at one meeting').toBe(2);
    // One rule each, and each with its own reaction.
    for (const a of anns) expect((a.announced || []).length).toBe(1);
    const registers = anns.map(a => (a.socialBeats || []).map(b => b.badgeText).join('|'));
    expect(registers[0]).not.toBe(registers[1]);
    // The one about a person in the room, and the one about a rule nobody wins.
    expect(registers.join(' ')).toMatch(/COUNTING THE ROOM/);
    expect(registers.join(' ')).toMatch(/NO TIME TO WORK/);

    gs.episodeHistory = [ep];
    buildVPScreens(ep);
    Object.keys(_tvState).forEach(k => { if (_tvState[k]) _tvState[k].idx = 99; });
    const screens = (buildVPScreens(ep) || []).filter(x => /bb-twist/.test(x.id));
    expect(screens.length).toBe(2);
    // Distinct ids, or the viewing party cannot tell the two tabs apart.
    expect(screens[0].id).not.toBe(screens[1].id);
    // "<Twist>: Announcement" — a twist that also runs weekly screens has to
    // read as one family down the tab strip.
    expect(screens.map(x => x.label)).toContain('Instant Eviction: Announcement');
  });

  it('reaches the screen and the page, sequestration and all', () => {
    house();
    const { ep, act } = playWeek();
    const text = generateSummaryText(ep) || '';
    expect(text).toContain('INSTANT EVICTION');
    expect(text).toContain(act.sequestered.where);
    if (act.overheard) expect(text).toContain(act.overheard.text.slice(0, 40));
    if (act.regret) expect(text).toContain(act.regret.missed);

    gs.episodeHistory = [ep];
    buildVPScreens(ep);
    Object.keys(_tvState).forEach(k => { if (_tvState[k]) _tvState[k].idx = 99; });
    const screen = (buildVPScreens(ep) || []).find(s => s.id === 'bb-instant');
    expect(screen, 'the twist has no screen').toBeTruthy();
    expect(screen.html).toContain(act.sequestered.where);
    expect(screen.html).not.toMatch(/undefined|NaN|\[object Object\]/);
  });
});
