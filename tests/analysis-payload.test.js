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
