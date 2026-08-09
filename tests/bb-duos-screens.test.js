// The Duos twist, on screen.
//
// A SEPARATE FILE FROM THE MECHANICS ON PURPOSE. The mechanics tests pass
// whether or not anything is ever drawn — and that is exactly how the Twin
// Twist shipped with ten changeovers a season and nothing visible anywhere,
// because its swap was passed to a screen that never rendered it.
//
// So this plays a real season with the twist on and asserts that the acts it
// produces reach `buildVPScreens` and come back as HTML with the right words in
// it. Every assertion is on rendered output rather than on the act.
import { beforeAll, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, setRelationships } from '../js/core.js';
import { pStats, pronouns } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
].map(([name, archetype, gender]) => ({ name, archetype, gender, sexuality: 'straight' }));

// The cast, built in pairs — see tests/bb-duos.test.js for why the twist
// refuses to run without this.
const DUO_RELS = [
  { a: 'A', b: 'B', kin: 'siblings' },
  { a: 'C', b: 'D', kin: 'exes' },
  { a: 'E', b: 'F', kin: 'married' },
  { a: 'G', b: 'H', kin: 'old-friends' },
  { a: 'I', b: 'J', kin: 'colleagues' },
  { a: 'K', b: 'L', kin: 'cousins' },
].map((r, i) => ({ ...r, id: `duo-rel-${i}`, type: 'ally', bond: 3 }));

let screensByLabel = new Map();
let acts = [];

beforeAll(() => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = [];
  gs.jury = [];
  gs.popularity = {};
  setRelationships(DUO_RELS.map(r => ({ ...r })));
  Object.assign(seasonConfig, {
    format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbDuos: 'on', bbDuosKeyAt: 10,
  });

  withSeededRandom(5, () => {
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 30) simulateBBEpisode();
  });

  acts = (gs.bb.weeks || []).flatMap(w => w.acts || []).filter(Boolean);

  // Render every episode the season produced and index the screens by label.
  for (const [i, ep] of (gs.episodeHistory || []).entries()) {
    // Twist screens are click-to-reveal and every one starts at idx -1, so a
    // freshly built screen is a stack of "?" placeholders with none of its
    // prose in it. Build once to populate _tvState, wind every counter to the
    // end, build again -- that is the HTML a viewer actually sees, and the only
    // version worth asserting about.
    let built = [];
    try {
      buildVPScreens(ep, i + 1);
      for (const k of Object.keys(_tvState)) {
        const st = _tvState[k];
        if (st && typeof st === 'object' && 'idx' in st) st.idx = 9999;
      }
      built = buildVPScreens(ep, i + 1) || [];
    } catch { built = []; }
    for (const sc of built) {
      if (!sc?.label) continue;
      if (!screensByLabel.has(sc.label)) screensByLabel.set(sc.label, []);
      screensByLabel.get(sc.label).push(sc);
    }
  }
});

const screensFor = label => screensByLabel.get(label) || [];

describe('the season produced the acts', () => {
  it('paired the house and announced it', () => {
    expect(acts.filter(a => a.type === 'duos-open').length).toBe(1);
  });

  it('handed out at least one key', () => {
    expect(acts.filter(a => a.type === 'duos-key').length).toBeGreaterThan(0);
  });
});

describe('and every one of them reached a screen', () => {
  it('draws the pairing on the house announcement screen', () => {
    const [screen] = screensFor('Duos: Announcement');
    expect(screen, 'the announcement never became a screen').toBeTruthy();
    expect(screen.html).toContain('DYNAMIC DUOS');
    // THE HOUSE'S OWN ANNOUNCEMENT SCREEN. Same wall, same eye, same sofas as
    // every other public rule — a twist that announces itself differently from
    // every other twist reads as a different programme.
    expect(screen.html, 'not built as the standard announcement').toContain('bbta-wall');
    expect(screen.html, 'the wall screen has no eye on it').toContain('bbta-screenframe');
    expect(screen.html).toContain('THE ANNOUNCEMENT');
    expect(screen.html).toContain('THE VOICE OF BIG BROTHER');
    expect(screen.html, 'the chain between two duo halves is the one new mark').toContain('bbduo-chain');

    const open = acts.find(a => a.type === 'duos-open');
    for (const [a, b] of open.pairs.slice(0, 3)) {
      expect(screen.html, `the pair ${a} & ${b} is missing`).toContain(a);
      expect(screen.html).toContain(b);
    }
  });

  it('says HOW each duo knows each other, in the cast’s own words', () => {
    // The reason bond-score pairing had to go: "these two get on quite well"
    // is not something a host can read out.
    const screen = screensFor('Duos: Announcement')[0];
    const open = acts.find(a => a.type === 'duos-open');
    expect(open.kin, 'the announcement carries no relation labels').toBeTruthy();
    expect(open.kin.some(k => /sibling|exes|married|cousin|friend|worked/i.test(k))).toBe(true);
    // Drawn on the pill in caps, the way every other announcement pill is.
    expect(screen.html.toUpperCase()).toContain(open.kin[0].toUpperCase());
  });

  it('draws the key, naming the holder and the partner who went', () => {
    const list = screensFor('Duos: Golden Key');
    expect(list.length, 'a key was handed out and never drawn').toBeGreaterThan(0);
    const key = acts.find(a => a.type === 'duos-key');
    const html = list.map(s => s.html).join('');
    expect(html).toContain('GOLDEN KEY');
    expect(html).toContain(key.holder);
    expect(html).toContain(key.partner);
  });

  it('says what the key costs, not only what it gives', () => {
    // Safety is the obvious half. "Competing for nothing at all until then" is
    // the half that makes it a decision rather than a gift.
    const html = screensFor('Duos: Golden Key').map(s => s.html).join('');
    expect(html).toMatch(/competing for nothing/i);
  });
});

// ══════════════════════════════════════════════════════════════════════
// The other mode, on screen
// ══════════════════════════════════════════════════════════════════════
//
// A second season, played with the Golden Key switched off, because the two
// modes produce entirely different acts and the pairs-only one is the mode
// where the twist has to keep proving it is still running eight weeks in.
describe('a pairs-only season', () => {
  const byLabel = new Map();
  let pairActs = [];

  beforeAll(() => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.episodeHistory = [];
    gs.jury = [];
    gs.popularity = {};
    setRelationships(DUO_RELS.map(r => ({ ...r })));
    Object.assign(seasonConfig, {
      format: 'big-brother', finaleSize: 3, jurySize: 7,
      bbDuos: 'pairs', bbDuosKeyAt: 10,
    });

    withSeededRandom(17, () => {
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 30) simulateBBEpisode();
    });

    pairActs = (gs.bb.weeks || []).flatMap(w => w.acts || []).filter(Boolean);
    for (const [i, ep] of (gs.episodeHistory || []).entries()) {
      // Twist screens are click-to-reveal and every one starts at idx -1, so a
      // freshly built screen is a stack of "?" placeholders with none of its
      // prose in it. Build once to populate _tvState, wind every counter to the
      // end, build again -- that is the HTML a viewer actually sees, and the only
      // version worth asserting about.
      let built = [];
      try {
        buildVPScreens(ep, i + 1);
        for (const k of Object.keys(_tvState)) {
          const st = _tvState[k];
          if (st && typeof st === 'object' && 'idx' in st) st.idx = 9999;
        }
        built = buildVPScreens(ep, i + 1) || [];
      } catch { built = []; }
      for (const sc of built) {
        if (!sc?.label) continue;
        if (!byLabel.has(sc.label)) byLabel.set(sc.label, []);
        byLabel.get(sc.label).push(sc);
      }
    }
  });

  const html = label => (byLabel.get(label) || []).map(s => s.html).join('');

  it('hands out no keys and draws no key screens', () => {
    expect(pairActs.filter(a => a.type === 'duos-key')).toHaveLength(0);
    expect(byLabel.get('Duos: Golden Key') || []).toHaveLength(0);
  });

  it('chains orphans together, on screen, with both names', () => {
    const repairs = pairActs.filter(a => a.type === 'duos-repair');
    expect(repairs.length, 'nobody was ever re-paired').toBeGreaterThan(0);
    const drawn = html('Duos: Re-Paired');
    expect(drawn, 'a re-pairing happened and was never drawn').toContain('RE-PAIRED');
    for (const [a, b] of repairs[0].pairs) {
      expect(drawn).toContain(a);
      expect(drawn).toContain(b);
    }
  });

  it('keeps saying something about the pairs, in House Life with the rest of it', () => {
    // The failure this exists for: a season twist that fires at nominations
    // and is invisible for the other six days reads as a twist doing nothing.
    //
    // But it does NOT get its own stop in the viewing party. Three lines about
    // who is carrying whom are the same kind of texture as every other camp
    // beat, and putting them in a separate room — under a printed roster of
    // every pair in the house — fragmented the week. They go in the feed.
    const weeks = (gs.bb.weeks || []).filter(w => w.duosLife);
    expect(weeks.length, 'the twist went quiet for the whole season').toBeGreaterThan(1);

    const folded = weeks.filter(w => (w.acts || []).some(a =>
      a.type === 'house' && (a.socialBeats || []).some(b =>
        (w.duosLife.beats || []).some(d => d.text === b.text))));
    expect(folded.length, 'the duo beats never reached House Life').toBeGreaterThan(1);

    // And they are on the page, wherever House Life renders.
    const anyText = weeks[0].duosLife.beats[0].text;
    const allHtml = [...byLabel.values()].flat().map(sc => sc.html).join(' ');
    expect(allHtml, 'a duo beat was written and never drawn').toContain(anyText.slice(0, 40));
  });

  it('tells the house on night one that there are no keys', () => {
    const open = pairActs.find(a => a.type === 'duos-open');
    expect(open.goldenKey).toBe(false);
    expect(html('Duos: Announcement')).toMatch(/no Golden Keys/i);
  });
});

describe('the twist looks like the rest of the programme', () => {
  it('draws every duos screen in the house column', () => {
    // The regression this exists for: a bespoke shell with its own background
    // and no max-width, running edge to edge while every other screen in the
    // viewing party sits in a 760px '.rp-page' column. It read as a different
    // product, and nothing in the suite noticed.
    const labels = [...screensByLabel.keys()].filter(l => l.startsWith('Duos:'));
    expect(labels.length, 'no duos screens were drawn at all').toBeGreaterThan(2);
    for (const label of labels) {
      for (const sc of screensByLabel.get(label)) {
        expect(sc.html, `${label} is not drawn in the house column`).toContain('rp-page');
        expect(sc.html, `${label} invented its own shell`).not.toContain('class="bbduo"');
      }
    }
  });

  it('uses the house card for anything the house is told', () => {
    const key = (screensByLabel.get('Duos: Golden Key') || [])[0];
    expect(key, 'no key screen to check').toBeTruthy();
    expect(key.html).toContain('bbns-card');
    expect(key.html, 'the chain is the one mark that belongs to this twist').toContain('bbduo-chain');
  });
});

describe('the ceremony knows it nominated a duo', () => {
  it('says it is nominating a DUO, not two people', () => {
    const cer = (screensByLabel.get('Nomination Ceremony') || []).map(x => x.html).join('');
    expect(cer.length, 'no nomination ceremony was drawn').toBeGreaterThan(0);
    expect(cer, 'the ceremony read as an ordinary one').toMatch(/nominate a DUO/);
  });

  it('does not invent a grievance against the half nobody chose', () => {
    // The most twist-erasing line on the screen: the Head of Household gave
    // TWO separate personal reasons for a block they only decided once,
    // presenting a forced nomination as a decision, every week, all season.
    // Said either as its own card (a one-duo block) or inside the duo's WHY
    // card (two duos). What matters is that it is said at all.
    const cer = (screensByLabel.get('Nomination Ceremony') || []).map(x => x.html).join('');
    expect(cer).toMatch(/is who I came for, and/);
    expect(cer).toMatch(/not going\s+to stand here and invent something|NOT A DECISION/);
  });
});

describe('eviction night explains the duo count', () => {
  it('draws the two sides added up, on the night it decides', () => {
    // A houseguest leaving on fewer votes than somebody still sitting in the
    // other chairs is the POINT of seating two duos — and it reads as a bug
    // unless the screen shows the arithmetic that produced it.
    const weeks = (gs.bb.weeks || []).filter(w => w.duoVote);
    if (!weeks.length) return;   // one-duo season; covered in the mechanics file
    const html = (screensByLabel.get('Eviction Night') || []).map(sc => sc.html).join('');
    expect(html, 'the duo count never became a card').toContain('COUNTED BY DUO');
    expect(html).toContain('voted for a side');
  });
});

describe('a two-duo ceremony reads as two duos', () => {
  it('turns the keys in pairs and says so', () => {
    // The report this exists for: four names read out one at a time, each with
    // a reason of their own — two houseguests handed the SAME line about their
    // resume, and a fourth told they were a pawn, for a block the Head of
    // Household decided twice. They did not nominate four people.
    const html = (screensByLabel.get('Nomination Ceremony') || []).map(x => x.html).join('');
    const anyFour = (gs.bb.weeks || []).some(w => (w.duoBlocks || []).length === 2);
    if (!anyFour) return;
    expect(html, 'still read as four separate nominations').toMatch(/nominate TWO DUOS/);
    expect(html, 'the keys were not turned in pairs').toMatch(/keys together/);
    expect(html).toMatch(/come up on\s+the wall side by side/);
  });

  it('gives one reason per duo, not one per houseguest', () => {
    const html = (screensByLabel.get('Nomination Ceremony') || []).map(x => x.html).join('');
    const anyFour = (gs.bb.weeks || []).some(w => (w.duoBlocks || []).length === 2);
    if (!anyFour) return;
    // Two duos means two WHY cards, not four.
    const whys = (html.match(/WHY [A-Z]/g) || []).length;
    const cers = (screensByLabel.get('Nomination Ceremony') || []).length;
    expect(whys).toBeLessThanOrEqual(cers * 2);
    expect(html, 'nobody was told they are collateral').toMatch(/is who I came for, and you are/);
  });
});

describe('the veto ceremony shows a pair coming down', () => {
  it('stamps BOTH halves, not just the name on the medallion', () => {
    // Reported: the screen stamped one face for a decision that moved four
    // people, which tells the viewer the partner is still on that block.
    const weeks = (gs.bb.weeks || []).filter(w => w.duoVetoSwap);
    if (!weeks.length) return;
    const html = (screensByLabel.get('Veto Ceremony') || []).map(sc => sc.html).join('');
    expect(html, 'no veto ceremony was drawn').not.toBe('');
    expect(html, 'the partner was not marked safe').toContain('DOWN WITH THEM');
    expect(html, 'the replacement pair was drawn as a single stand-in').toContain('REPLACEMENT DUO');
    expect(html, 'the meeting never said the rule out loud').toMatch(/the rule takes the pair/);
  });

  it('draws every name the ceremony moved', () => {
    const week = (gs.bb.weeks || []).find(w => w.duoVetoSwap);
    if (!week) return;
    const html = (screensByLabel.get('Veto Ceremony') || []).map(sc => sc.html).join('');
    for (const n of [...week.duoVetoSwap.down, ...week.duoVetoSwap.up]) {
      expect(html, `${n} was moved by the veto and never drawn`).toContain(n);
    }
  });
});
