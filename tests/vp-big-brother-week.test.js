// The Big Brother visual player.
//
// Built on the shared Total Drama VP kit — rp-page, rpPortrait, the badge-pill
// scene card and _tvState click-to-reveal — rather than a private stylesheet,
// so a houseguest looks like a camper. These cover the two things that were
// actually wrong with it: it was unreachable, and it displayed almost none of
// what the engine produces.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns, threatScore } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { ordinal } from '../js/finale.js';
import { buildVPScreens, buildBBWeekScreens, bbfCamera, rpBuildBBDebug, rpBuildBBNominations, rpBuildBBEviction, _tvState } from '../js/vp-screens.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { seedGame } from './helpers/setup.js';

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
].map(([name, archetype, gender]) => ({ name, archetype, gender, sexuality: 'straight' }));

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  // vp-screens.js reads gs, players and seasonConfig as bare globals, which
  // main.js puts on window at boot. A test has to provide the same environment
  // or every portrait throws before it can draw.
  globalThis.gs = gs;
  globalThis.players = players;
  globalThis.seasonConfig = seasonConfig;
  // The shared builders reach for these as bare globals too — main.js puts the
  // whole module surface on window at boot.
  globalThis.pStats = pStats;
  globalThis.pronouns = pronouns;
  globalThis.threatScore = threatScore;
  globalThis.getBond = getBond;
  globalThis.getPerceivedBond = getPerceivedBond;
  globalThis.ordinal = ordinal;
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = [];
  gs.popularity = {};
  gs.showmances = [];
  gs.romanticSparks = [];
  seasonConfig.format = 'big-brother';
  seasonConfig.finaleSize = 3;
  seasonConfig.romance = 'enabled';
  // Reveal state is module-level and would leak between tests, so a screen
  // opened by one case would look already-revealed to the next.
  Object.keys(_tvState).filter(k => k.startsWith('bb_')).forEach(k => { delete _tvState[k]; });
}

const week = () => { reset(); return simulateBBEpisode(); };

// Scenes are hidden until revealed, which is the point of the player. Build
// once to create the reveal keys, open them all, then build again.
function revealed(ep) {
  buildBBWeekScreens(ep);
  Object.keys(_tvState).filter(k => k.startsWith('bb_')).forEach(k => { _tvState[k].idx = 99; });
  return buildBBWeekScreens(ep);
}

describe('the Big Brother visual player', () => {
  beforeEach(reset);

  // It shipped unreachable: nothing imported its builders, so every Big
  // Brother week replayed as nothing at all.
  it('is what buildVPScreens returns for a Big Brother week', () => {
    const ep = week();
    const screens = buildVPScreens(gs.episodeHistory[0]);
    expect(screens.length).toBeGreaterThan(8);
    expect(screens.every(s => s.html && s.label)).toBe(true);
    expect(screens.some(s => s.id === 'bb-error')).toBe(false);
    expect(ep.format).toBe('big-brother');
  });

  it('runs the episode in the order the show does', () => {
    const screens = buildBBWeekScreens(week());
    const ids = screens.map(s => s.id);
    // Cold open, then life and ceremony alternating, ending on the eviction.
    expect(ids[0]).toBe('bb-cold');
    // The eviction is the last act; the shared vote, alliance and
    // relationship sections follow it as appendices.
    expect(ids).toContain('bb-evict');
    // House Status is a bookend rather than part of the spine — there is one
    // before the week and one after it, so both are filtered out here. Only
    // 'bb-overview' used to be, which went unnoticed because the screen was
    // throwing on a bare-global `bKey` and neither of them was being built.
    const appendix = ['bb-interview', 'bb-votes', 'bb-alliances', 'bb-rels', 'bb-debug'];
    // Asserted structurally rather than as a fixed list. House life is its own
    // act, campaigning is house life too, and how many stretches a week has
    // depends on how many people are still in it — so pinning the exact
    // sequence made the test a statement about cast size.
    const spine = ids.filter(id => !id.startsWith('bb-overview') && !appendix.includes(id));
    expect(spine[0]).toBe('bb-cold');
    expect(spine.at(-1)).toBe('bb-evict');
    // The set pieces happen in the order the week runs them...
    const ceremonies = spine.filter(id => !id.startsWith('bb-house') && id !== 'bb-camp');
    // The veto draw is its own stop, immediately before the competition it
    // decides — six play and three of them find out there.
    expect(ceremonies).toEqual(['bb-cold', 'bb-hoh', 'bb-noms', 'bb-vdraw', 'bb-veto', 'bb-cer', 'bb-evict']);
    // ...with stretches of house life between them, and no campaign screen:
    // campaigning belongs in the feed with everything else that happens in a
    // bedroom at two in the morning.
    expect(ids, 'the campaign still has a screen of its own').not.toContain('bb-camp');
    expect(spine.filter(id => id.startsWith('bb-house')).length).toBeGreaterThanOrEqual(4);
  });

  it('introduces the cast one at a time on move-in day', () => {
    const ep = week();
    const first = buildBBWeekScreens(ep)[0].html;
    expect(first).toContain('MOVE-IN DAY');
    // Before anybody arrives the wall is empty frames and the door is shut.
    expect(first).toContain('Open the door');
    expect(first).toContain('0 / ' + CAST.length);
    // Once everybody is in, every houseguest has been introduced by name.
    // Once everybody is in, the wall carries the whole cast and the spotlight
    // is on whoever walked in last.
    const all = revealed(ep)[0].html;
    expect(all).toContain('HOUSEGUEST ' + CAST.length);
    for (const p of CAST) expect(all).toContain(p.name);
    expect(all).toContain('THE DOOR LOCKS');
    expect(all).toContain('rp-portrait');
  });

  it('shows the competition by name, not just its winner', () => {
    const ep = week();
    const comps = (ep.acts || []).map(a => a.competition).filter(Boolean);
    const html = revealed(ep).map(s => s.html).join('');
    expect(comps.length).toBeGreaterThan(0);
    for (const comp of comps) {
      expect(html).toContain(comp.name);
      // and what happened in it, not only the result
      expect(comp.beats.some(b => html.includes(b.text.slice(0, 30)))).toBe(true);
    }
  });

  it('gives house life its own screens', () => {
    const ep = week();
    const screens = revealed(ep);
    const lifeScreens = screens.filter(s => s.id.startsWith('bb-house'));
    expect(lifeScreens.length).toBeGreaterThanOrEqual(4);
    const beats = (ep.acts || []).flatMap(a => a.socialBeats || []);
    const lifeHtml = lifeScreens.map(s => s.html).join('');
    expect(beats.length).toBeGreaterThan(0);
    // The events the engine generated actually appear somewhere in the player.
    const all = screens.map(s => s.html).join('');
    const shown = beats.filter(b => all.includes(b.text.slice(0, 30))).length;
    expect(shown / beats.length).toBeGreaterThan(0.8);
    expect(lifeHtml).toContain('HOUSE LIFE');
  });

  it('uses the shared visual player kit rather than a private one', () => {
    const html = buildBBWeekScreens(week()).map(s => s.html).join('');
    expect(html).toContain('rp-page');
    expect(html).toContain('rp-portrait');
    expect(html).toContain('rp-eyebrow');
    expect(html).not.toContain('bbvp-');
  });

  it('hides what has not been revealed yet', () => {
    const html = buildBBWeekScreens(week()).map(s => s.html).join('');
    // Unrevealed scenes render as dimmed placeholders, as in Total Drama.
    expect(html).toContain('opacity:0.12');
    expect(html).toContain('Reveal next');
  });

  it('replays every week of a finished season without error', () => {
    reset();
    let guard = 0;
    while (gs.activePlayers.length > 3 && guard++ < 30) simulateBBEpisode();
    expect(gs.episodeHistory.length).toBeGreaterThan(5);
    for (const record of gs.episodeHistory) {
      const screens = buildVPScreens(record);
      expect(screens.some(s => s.id === 'bb-error'), `week ${record.num} failed to build`).toBe(false);
      expect(screens.length).toBeGreaterThan(8);
    }
  });
});

// The camera bank is a control, not a legend.
//
// A week runs to about a hundred and thirty beats and reading all of them
// top to bottom is a chore. Picking up one camera and watching one room is
// how the feeds are actually used, and it costs no vertical space to offer.
describe('camera tabs', () => {
  it('filters the feed to one room', () => {
    reset();
    let ep = null;
    for (let i = 0; i < 2; i++) ep = simulateBBEpisode();

    const screen = buildBBWeekScreens(ep).find(s => s.id.startsWith('bb-house-'));
    document.body.innerHTML = screen.html;

    const bank = document.querySelector('.bbf-bank');
    const key = bank.id.replace('bbf-bank-', '');
    const blocks = [...document.querySelectorAll('[data-bbf-room]')];
    const tabs = [...document.querySelectorAll('[data-bbf-tab]')];

    expect(blocks.length, 'no room blocks').toBeGreaterThan(1);
    expect(tabs.length, 'no tabs').toBe(blocks.length + 1);        // + ALL
    expect(tabs[0].className, 'ALL is not lit at rest').toContain('is-on');
    expect(blocks.every(b => b.style.display !== 'none'), 'something is hidden at rest').toBe(true);

    const pick = blocks[1].dataset.bbfRoom;
    bbfCamera(key, pick);
    const shown = blocks.filter(b => b.style.display !== 'none');
    expect(shown.length, 'picking a camera did not filter').toBe(1);
    expect(shown[0].dataset.bbfRoom).toBe(pick);
    expect(document.querySelector(`[data-bbf-tab="${pick}"]`).className).toContain('is-on');
    expect(tabs[0].className, 'ALL stayed lit').not.toContain('is-on');
    const note = document.getElementById(`bbf-bankn-${key}`).textContent;
    expect(note, 'the count did not follow the camera').toContain('only');

    bbfCamera(key, 'all');
    expect(blocks.every(b => b.style.display !== 'none'), 'ALL did not restore the feed').toBe(true);

    // The chosen camera survives a rebuild of the same screen.
    bbfCamera(key, pick);
    const again = buildBBWeekScreens(ep).find(s => s.id === screen.id);
    document.body.innerHTML = again.html;
    const after = [...document.querySelectorAll('[data-bbf-room]')].filter(b => b.style.display !== 'none');
    expect(after.length, 'the camera reset when the screen was rebuilt').toBe(1);
  }, 240000);
});

// The debug screen, which is the same screen Total Drama has.
//
// It lives behind a localStorage flag, so nothing routine renders it and a tab
// can break — or quietly render nothing at all — for a long time before
// anybody notices.
describe('the debug screen', () => {
  const TABS = ['week', 'threats', 'comps', 'plans', 'deals', 'votes', 'bonds', 'stats', 'beats'];

  it('renders every tab without holes', () => {
    reset();
    let ep = null;
    for (let i = 0; i < 3; i++) ep = simulateBBEpisode();
    for (const tab of TABS) {
      localStorage.setItem('vp_bbdebug_tab', tab);
      const html = rpBuildBBDebug(ep);
      expect(html, `${tab} rendered nothing`).toContain('DEBUG DATA');
      // A tab that renders only its own chrome is an empty tab.
      expect(html.length, `${tab} has no content`).toBeGreaterThan(6000);
      expect(/undefined|NaN/.test(html), `${tab} printed undefined or NaN`).toBe(false);
      // Every tab is reachable from every other tab.
      for (const other of TABS) expect(html).toContain(`'vp_bbdebug_tab','${other}'`);
    }
    localStorage.removeItem('vp_bbdebug_tab');
  }, 240000);

  it('is wired to the screen the tabs navigate to', () => {
    reset();
    const ep = simulateBBEpisode();
    localStorage.setItem('vp_debug', 'true');
    const screens = buildVPScreens(gs.episodeHistory[0]);
    localStorage.removeItem('vp_debug');
    const debug = screens.find(s => s.id === 'bb-debug');
    expect(debug, 'the debug screen is not in the player at all').toBeTruthy();
    // The tab buttons and the episode nav both look the screen up by this id.
    expect(debug.html).toContain("s.id==='bb-debug'");
    expect(ep.num).toBe(1);
  }, 240000);
});

// The nomination ceremony.
//
// The screens are the set piece: one big panel per nomination, blank with a
// question mark until its key turns, the memory wall alongside, and the Head of
// Household justifying each name separately rather than giving one blanket
// speech. Before any of that it printed the target, the pawn and the backdoor
// plan in a panel above the whole thing.
describe('the nomination ceremony', () => {
  const read = html => ({
    lit: (html.match(/bbns-screen is-on/g) || []).length,
    blank: (html.match(/bbns-q/g) || []).length,
    keys: (html.match(/bbns-kh is-turned/g) || []).length,
    walled: (html.match(/bbns-cell[^"]*is-nom/g) || []).length,
    // The reason cards specifically. Counting gold pills also counted any
    // ceremony beat that happens to carry a gold badge.
    reasons: (html.match(/bbns-card is-reason/g) || []).length,
  });
  const at = (ep, idx) => {
    _tvState[`bb_noms_${ep.num}`] = { idx };
    return rpBuildBBNominations(ep);
  };

  it('opens on blank screens and gives nothing away', () => {
    reset();
    const ep = simulateBBEpisode();
    const act = (ep.acts || []).find(a => a.type === 'nominations');
    const noms = act.nominees || [];
    const html = at(ep, -1);
    expect(html, 'the ceremony announces the private plan above itself').not.toContain('private intent');
    const st = read(html);
    expect(st.blank, 'there is not a blank screen per nomination').toBe(noms.length);
    expect(st.lit, 'a screen was already showing somebody').toBe(0);
    expect(st.keys, 'a key was already turned').toBe(0);
    for (const n of noms) {
      expect(html, `${n} is named before a key is turned`).not.toContain(`<strong>${n}</strong>`);
    }
  }, 240000);

  it('turns one key, lights one screen, and justifies that name', () => {
    reset();
    const ep = simulateBBEpisode();
    const act = (ep.acts || []).find(a => a.type === 'nominations');
    const noms = act.nominees || [];
    expect(noms.length).toBeGreaterThan(1);

    const opening = at(ep, 0);
    expect(opening).toContain('This is the nomination ceremony');
    expect(read(opening).lit, 'the opening line already lit a screen').toBe(0);

    // Each nominee gets a key step then a reason step.
    for (let i = 0; i < noms.length; i++) {
      const keyHtml = at(ep, 1 + i * 2);
      const k = read(keyHtml);
      expect(k.keys, `key ${i + 1} did not turn`).toBe(i + 1);
      expect(k.lit, `${i + 1} keys turned but ${k.lit} screens are lit`).toBe(i + 1);
      expect(k.walled, 'the wall did not follow the screens').toBe(i + 1);
      expect(keyHtml).toContain(noms[i]);

      const reasonHtml = at(ep, 2 + i * 2);
      expect(read(reasonHtml).reasons, `${noms[i]} was nominated without a reason`).toBe(i + 1);
      expect(reasonHtml, 'the reason does not name who it is about')
        .toContain(`WHY ${noms[i].toUpperCase()}`);

      // Nominees still to come remain hidden.
      for (let j = i + 1; j < noms.length; j++) {
        expect(reasonHtml, `${noms[j]} appeared before their key`)
          .not.toContain(`<strong>${noms[j]}</strong>`);
      }
    }
  }, 240000);

  it('justifies every nominee separately, not once for all of them', () => {
    reset();
    const ep = simulateBBEpisode();
    const noms = ((ep.acts || []).find(a => a.type === 'nominations').nominees) || [];
    const html = at(ep, 99);
    expect(read(html).reasons, 'the Head of Household did not explain each name')
      .toBe(noms.length);
    for (const n of noms) expect(html).toContain(`WHY ${n.toUpperCase()}`);
    expect(html).toContain('Nominations are complete');
    expect(read(html).lit, 'not every screen is lit at the end').toBe(noms.length);
  }, 240000);

  it('pins the stage and the controls so the page does not move', () => {
    reset();
    const ep = simulateBBEpisode();
    const html = at(ep, 2);
    expect(html).toContain('bbns-stage');
    expect(html).toContain('bbns-controls');
    expect(html).toContain('MEMORY WALL');
  }, 240000);
});

// The count going in.
//
// Total Drama shows a vote as a set of plans before it shows it as a result:
// who each person is voting for, how firmly, and how many votes they THINK
// they have. A house went straight to reading ballots, so a blindside arrived
// with no setup and read as an accident rather than as somebody being wrong.
describe('vote planning before the eviction', () => {
  it('opens on the count, before a single ballot', () => {
    reset();
    let ep = null;
    for (let i = 0; i < 2; i++) ep = simulateBBEpisode();
    _tvState[`bb_evict_${ep.num}`] = { idx: -1 };
    const html = rpBuildBBEviction(ep);
    expect(html).toContain('THE COUNT GOING IN');
    // A row per voter and a side per nominee.
    const voters = ((ep.acts || []).find(a => a.type === 'eviction')?.ballots || []).length;
    expect((html.match(/class="bbct-row"/g) || []).length).toBe(voters);
    expect((html.match(/bbct-side /g) || []).length).toBe(2);
    expect(/undefined|NaN/.test(html)).toBe(false);
  }, 240000);

  it('holds the reckoning back until the votes are read', () => {
    reset();
    let ep = null, guard = 0;
    // Find a week where somebody actually misread the room.
    while (guard++ < 8 && !(ep?.votePlans || []).some(p => p.wrong)) ep = simulateBBEpisode();
    if (!(ep?.votePlans || []).some(p => p.wrong)) return;

    _tvState[`bb_evict_${ep.num}`] = { idx: -1 };
    expect(rpBuildBBEviction(ep), 'the answer is on screen before the question')
      .not.toContain('WHO HAD IT WRONG');
    _tvState[`bb_evict_${ep.num}`] = { idx: 99 };
    expect(rpBuildBBEviction(ep), 'somebody misread the room and it was never said')
      .toContain('WHO HAD IT WRONG');
  }, 240000);

  it('counts what a houseguest believes, not what is true', () => {
    reset();
    let ep = null;
    for (let i = 0; i < 3; i++) ep = simulateBBEpisode();
    const plans = ep.votePlans || [];
    expect(plans.length).toBeGreaterThan(0);
    for (const p of plans) {
      // A belief is a count of real voters, and the truth is recorded beside it.
      expect(p.believed).toBeGreaterThanOrEqual(0);
      expect(p.believed).toBeLessThanOrEqual(plans.length);
      expect(p.truth).toBe(plans.filter(q => q.target === p.target).length);
      expect(p.wrong).toBe((p.believed >= p.majority) !== (p.truth >= p.majority));
    }
    // If everybody always read the room correctly there would be no blindside
    // in the format at all — but a single quiet week where the count is
    // obvious to everybody is legitimate, so this is asked of a season.
    let misread = 0, seen = 0;
    for (let i = 0; i < 4; i++) {
      const week = simulateBBEpisode();
      for (const p of week.votePlans || []) { seen++; if (p.believed !== p.truth) misread++; }
    }
    expect(seen).toBeGreaterThan(0);
    expect(misread, 'nobody in an entire season ever misread the room').toBeGreaterThan(0);
  }, 240000);
});
