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
