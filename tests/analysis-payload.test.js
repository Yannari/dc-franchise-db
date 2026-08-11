// The written analysis and the measured panels have to be reading the same week.
//
// Until now they were not. The panels compute off the ballots; the model was
// handed the transcript alone, so one half of the Control Room could say six
// votes never had to be moved while the other half called the week a
// masterclass — on the same screen, about the same night.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const worker = readFileSync('worker/worker-episode-live.js', 'utf8');
const page = readFileSync('current-season.html', 'utf8');

describe('the model is given the numbers, not just the prose', () => {
  it('sends the ledger with the analytics request', () => {
    expect(page).toMatch(/ledger: await _episodeLedger\(season, episode\)/);
    expect(page).toMatch(/async function _episodeLedger\(season, episode\)/);
    // The same three the panels draw, so they cannot diverge.
    expect(page).toMatch(/mod\.voteLedger\(record\)/);
    expect(page).toMatch(/mod\.weekLedger\(record\)/);
    expect(page).toMatch(/mod\.relationshipLedger\(record\)/);
  });

  it('stays silent for an episode that was pasted rather than simulated', () => {
    // No ballots to read. A guess here is the exact failure the ledger exists
    // to correct, so it sends nothing at all.
    const fn = page.slice(page.indexOf('async function _episodeLedger'),
      page.indexOf('const response = await fetch(EPISODE_WORKER_URL'));
    expect(fn).toMatch(/if \(!record\) return null;/);
    expect(fn).toMatch(/catch \(e\) \{ return null; \}/);
  });

  it('reaches the model as its own labelled section', () => {
    // Described in the instructions and never actually appended is the obvious
    // way to get this wrong, so the block is built and concatenated.
    expect(worker).toMatch(/MEASURED LEDGER \(arithmetic, not narration/);
    expect(worker).toMatch(/const analyticsInput = /);
    expect(worker, 'the primary path still sends the summary alone')
      .not.toMatch(/input: summaryText,/);
    expect(worker, 'the fallback reasons off less evidence than the primary')
      .not.toMatch(/content: summaryText \}\]/);
  });

  it('tells the model the numbers outrank the story', () => {
    expect(worker).toMatch(/THE LEDGER OUTRANKS THE PROSE/);
    // The specific correction: a majority already in place is not a move.
    expect(worker).toMatch(/rodeConsensus/);
    expect(worker).toMatch(/Do not describe a week as controlled, masterful or engineered/);
    // And that the axes may disagree, which is the whole finding.
    expect(worker).toMatch(/allowed to disagree/);
  });

  it('does not turn the prompt into a template-literal escape hatch', () => {
    // The instructions live inside a backtick string; a stray backtick in the
    // added text closed it and broke the whole worker.
    const block = worker.slice(worker.indexOf('- THE LEDGER OUTRANKS THE PROSE'),
      worker.indexOf('the transcript states it nowhere.'));
    expect(block).not.toContain('`');
  });
});


// ══════════════════════════════════════════════════════════════════════
// The ledger was on the page, and a source-grep test said so, and it was
// still not reaching the analysis: it had been added to the EPISODE WRITER's
// request. Two calls go to the same worker from this page, and only one of
// them feeds the Control Room. So these assert the FUNCTION, not the file.
// ══════════════════════════════════════════════════════════════════════
describe('the analysis call carries the season, not just tonight', () => {
  const page = readFileSync('current-season.html', 'utf8');
  /** callAI's body — the call the Control Room and Overview actually draw. */
  const callAI = (() => {
    const i = page.indexOf('async function callAI(season, episode, summaryText) {');
    expect(i, 'callAI is gone').toBeGreaterThan(-1);
    return page.slice(i, page.indexOf('async function loadCached', i));
  })();

  it('sends the ballots with the analysis, not only with the episode writer', () => {
    expect(callAI).toMatch(/_episodeLedger\(season, episode\)/);
    expect(callAI).toMatch(/body: JSON\.stringify\(\{ season, episode, summaryText, ledger, history \}\)/);
  });

  it('sends every episode before this one', () => {
    expect(callAI).toMatch(/_seasonHistory\(season, episode\)/);
    expect(page).toMatch(/async function _seasonHistory\(season, upto\)/);
  });

  it('stops at the episode being analysed, so it cannot cite itself', () => {
    const fn = page.slice(page.indexOf('async function _seasonHistory'),
      page.indexOf('async function _seasonHistory') + 2000);
    expect(fn, 'the loop includes the current episode').toMatch(/for \(let i = 1; i < upto; i\+\+\)/);
  });

  it('degrades to the old behaviour rather than failing the analysis', () => {
    // A season with nothing synced has no ledger and no history. That must
    // produce a thinner read, never a broken button.
    expect(callAI).toMatch(/\.catch\(\(\) => null\)/);
  });

  it('tells the model the history is comparative, not material to re-tell', () => {
    const worker = readFileSync('worker/worker-episode-live.js', 'utf8');
    expect(worker).toMatch(/generateAnalytics\(summaryText, season, episode, env, activeCast = null, ledger = null, history = null\)/);
    expect(worker).toMatch(/body\.ledger, body\.history/);
    expect(worker).toMatch(/THE SEASON SO FAR/);
    expect(worker).toMatch(/Do not re-tell earlier episodes/);
    expect(worker).toMatch(/A pattern is only a pattern if the record shows it/);
  });
});

describe('the Control Room reads a trend', () => {
  const page = readFileSync('current-season.html', 'utf8');

  it('compares against the episode before, not only the latest', () => {
    expect(page).toMatch(/const priorObs = records\.length > 1/);
    expect(page).toMatch(/window\._crTrend/);
  });

  it('matches rows on the key the observations actually use', () => {
    // `player`, not `name`. Matching the wrong one returns null for everybody
    // and renders as "nothing has moved all season".
    expect(page).toMatch(/\(r\?\.player \?\? r\?\.name\) === who/);
  });

  it('shows the direction on the row', () => {
    expect(page).toMatch(/cr-trend up/);
    expect(page).toMatch(/cr-trend down/);
    expect(page).toMatch(/cr-streak/);
  });
});


// ══════════════════════════════════════════════════════════════════════
// The layout. Ten equal cards could not carry an analysis: an argument is
// a claim followed by its evidence, and equal weight says neither is which.
// ══════════════════════════════════════════════════════════════════════
describe('the episode page leads with a claim', () => {
  const page = readFileSync('current-season.html', 'utf8');
  const worker = readFileSync('worker/worker-episode-live.js', 'utf8');

  it('asks the model for an assertion, not a description', () => {
    expect(worker).toMatch(/verdict: \{/);
    expect(worker).toMatch(/It must be an assertion, not a description/);
    expect(worker).toMatch(/"narrativeSummary", "verdict", "decisionPoints",/);
  });

  it('asks for the alternative that existed at the time', () => {
    expect(worker).toMatch(/decisionPoints: \{/);
    expect(worker).toMatch(/JUDGED ON WHAT WAS KNOWABLE THEN/);
    expect(worker).toMatch(/an option that ACTUALLY EXISTED at that moment/);
    // The permission that stops it inventing a mistake to blame.
    expect(worker.replace(/\s+/g, ' ')).toMatch(/some nights are lost by other people playing well/);
  });

  it('renders the claim at the top of the page', () => {
    expect(page).toMatch(/id="cardVerdictClaim"/);
    expect(page).toMatch(/class="ep-claim"/);
    expect(page).toMatch(/function renderVerdict\(analytics\)/);
  });

  it('still says something for an episode analysed before the verdict existed', () => {
    // A cached season must not render an empty headline.
    const fn = page.slice(page.indexOf('function renderVerdict'), page.indexOf('function renderDecisions'));
    expect(fn).toMatch(/episodeImpact\?\.turningPoint/);
    expect(fn).toMatch(/regenerate to get the argued read/i);
  });

  it('draws the vote instead of printing the tally', () => {
    expect(page).toMatch(/class="vb-bar"/);
    expect(page).toMatch(/vb-major/);
    for (const seg of ['vb-locked', 'vb-moved', 'vb-surplus', 'vb-against']) {
      expect(page).toContain(seg);
    }
  });

  it('shows chose, alternative and verdict side by side', () => {
    expect(page).toMatch(/function renderDecisions\(analytics\)/);
    expect(page).toMatch(/<b>Chose<\/b>/);
    expect(page).toMatch(/<b>Alternative<\/b>/);
    expect(page).toMatch(/<b>Verdict<\/b>/);
  });

  it('dropped the equal-weight grid it replaced', () => {
    const view = page.slice(page.indexOf('id="viewOverview"'), page.indexOf('<!-- GAMEPLAY PAGE -->'));
    expect(view, 'the old cards-grid is still there').not.toMatch(/class="cards-grid/);
    expect(view).toMatch(/class="ep-spine"/);
  });
});

describe('the Control Room shows a board', () => {
  const page = readFileSync('current-season.html', 'utf8');

  it('draws who can actually produce votes', () => {
    expect(page).toMatch(/id="crFactions"/);
    expect(page).toMatch(/cr-fac-votes/);
  });

  it('counts only the living, and strikes the rest rather than hiding them', () => {
    const block = page.slice(page.indexOf('const factionsEl'), page.indexOf('alliancesEl.innerHTML = alliances.length'));
    expect(block).toMatch(/live = members\.filter\(n => !eliminated\.has/);
    expect(block).toMatch(/'gone'/);
  });

  it('marks the member who is not solid', () => {
    const block = page.slice(page.indexOf('const factionsEl'), page.indexOf('alliancesEl.innerHTML = alliances.length'));
    expect(block).toMatch(/shaky/);
    expect(block).toMatch(/not solid/);
  });
});


// ══════════════════════════════════════════════════════════════════════
// `_episodeLedger is not defined`.
//
// It was declared inside generateEpisodeAI, and callAI lives in a different
// construct entirely, so the analysis call could not see it. Every earlier
// test here asserted the CALL was written — which it was. None of them
// asserted the function was reachable from where it is called, and that is
// the only thing that was ever wrong.
//
// So this one measures brace depth: both helpers have to sit at the top
// level of the script block, where every caller can reach them.
// ══════════════════════════════════════════════════════════════════════
describe('the helpers are reachable from both callers', () => {
  const page = readFileSync('current-season.html', 'utf8');
  const lines = page.split('\n');

  /** Brace depth per line inside the main script block, strings stripped. */
  const depths = (() => {
    const open = lines.findIndex((l, i) => i > 700 && /^\s*<script>\s*$/.test(l));
    const close = lines.findIndex((l, i) => i > open && /<\/script>/.test(l));
    const out = {};
    let depth = 0, inBlockComment = false;
    for (let i = open + 1; i < close; i++) {
      let l = lines[i];
      if (inBlockComment) {
        const e = l.indexOf('*/');
        if (e < 0) { out[i + 1] = depth; continue; }
        l = l.slice(e + 2); inBlockComment = false;
      }
      l = l.replace(/\/\*[\s\S]*?\*\//g, '');
      if (l.includes('/*')) { inBlockComment = true; l = l.slice(0, l.indexOf('/*')); }
      out[i + 1] = depth;
      // Walked character by character rather than stripped with regexes: a
      // brace inside a string or a line comment is not a brace, and the
      // escape-heavy patterns that would express that are exactly the thing
      // most likely to be mangled on the way into this file.
      let quote = null, esc = false;
      for (let c = 0; c < l.length; c++) {
        const ch = l[c];
        if (quote) {
          if (esc) { esc = false; continue; }
          if (ch === '\\') { esc = true; continue; }
          if (ch === quote) quote = null;
          continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
        if (ch === '/' && l[c + 1] === '/') break;   // rest of the line is a comment
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
      }
    }
    return out;
  })();

  const lineOf = needle => lines.findIndex(l => l.includes(needle)) + 1;

  it('declares both at the top of the script, not inside another function', () => {
    for (const fn of ['async function _episodeLedger(', 'async function _seasonHistory(']) {
      const n = lineOf(fn);
      expect(n, `${fn} is missing`).toBeGreaterThan(0);
      expect(depths[n], `${fn} is nested inside another function, so only that `
        + `function can call it — this is exactly the bug`).toBe(0);
    }
  });

  it('keeps their own dependencies reachable from there', () => {
    // Moving them out is only safe while what they call is at least as visible.
    for (const dep of ['function _sKey(', 'function _csGet(']) {
      expect(depths[lineOf(dep)], `${dep} is nested, so the helpers cannot use it`).toBe(0);
    }
  });

  it('is called from two different places, which is why scope matters', () => {
    const calls = [...page.matchAll(/_episodeLedger\(season, episode\)/g)].length;
    expect(calls, 'both the analysis and the episode writer should use it')
      .toBeGreaterThanOrEqual(2);
  });
});
