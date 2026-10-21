// The user, 2026-10-21: "how can i run 2 simulation at the same time like the calendar ask" -> "do that a season
// switcher between the season that i live rn". The strip over the Season Hub (js/season-switcher.js): one chip per
// season on air, in calendar order, and a click pauses one and resumes the other.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { seasonMeta, seasonSwitchHtml } from '../js/season-switcher.js';

const seasons = JSON.parse(readFileSync('seasons_database.json', 'utf8')).seasons.map(s => ({ ...s, format: s.format || 'total-drama' }));
const cast = n => Array.from({ length: n }, (_, i) => ({ name: 'P' + i }));
const played = n => ({ initialized: true, phase: 'pre-merge', episodeHistory: Array.from({ length: n }, (_, i) => ({ num: i + 1 })) });

describe('what a chip says about a season', () => {
  it('a Total Drama season six episodes in: its number, progress and calendar place', () => {
    const m = seasonMeta(played(6), { format: 'total-drama' }, cast(15), seasons);
    expect(m.format).toBe('total-drama');
    expect(m.started).toBe(true);
    expect(m.exported).toBe(false);
    expect(m.aired).toBe(6);
    expect(m.total).toBeGreaterThanOrEqual(6);
    expect(m.premiere).toBeLessThan(m.current);
  });
  it('a season whose premiere has not played is not on air yet', () => {
    expect(seasonMeta({ initialized: true, episodeHistory: [] }, { format: 'the-challenge' }, cast(24), seasons).started).toBe(false);
  });
  it('an exported season is marked as such', () => {
    const last = seasons.filter(s => s.format === 'total-drama').at(-1);
    expect(seasonMeta(played(3), { format: 'total-drama', seasonNumber: last.seasonNumber }, cast(15), seasons).exported).toBe(true);
  });
});

describe('the strip', () => {
  const td = { now: true, id: null, ...seasonMeta(played(6), { format: 'total-drama' }, cast(15), seasons) };
  const ch = { id: 'sabc', ...seasonMeta(played(2), { format: 'the-challenge' }, cast(24), seasons) };

  it('is not drawn for a lone season that has not started', () => {
    const fresh = { now: true, ...seasonMeta({ initialized: true, episodeHistory: [] }, { format: 'total-drama' }, cast(15), seasons) };
    expect(seasonSwitchHtml(fresh, [])).toBe('');
    expect(seasonSwitchHtml(null, [])).toBe('');
  });
  it('a lone season on air shows itself and the way to start another', () => {
    const html = seasonSwitchHtml(td, []);
    expect(html).toContain('is-now');
    expect(html).toContain('startAnotherLiveSeason()');
    expect(html).not.toContain('switchLiveSeason(');
  });
  it('a paused season is one click away, and the strip runs in calendar order', () => {
    const html = seasonSwitchHtml(td, [ch]);
    expect(html).toContain("switchLiveSeason('sabc')");
    expect(html).toContain("removeLiveSeason('sabc', event)");
    const first = td.premiere <= ch.premiere ? 'TD ' : 'CH ';
    const at = s => html.indexOf(`<b>${s}`);
    expect(at(first)).toBe(Math.min(at('TD '), at('CH ')));
  });
  it('the season playing now is never listed twice when it was paused before', () => {
    const html = seasonSwitchHtml({ ...td, id: 'sx' }, [{ ...td, id: 'sx', now: false }, ch]);
    expect(html.match(/<b>TD /g)).toHaveLength(1);
  });
  it('a season being set up beside a paused one of the same show is not given its number', () => {
    const fresh = { now: true, ...seasonMeta({ initialized: true, episodeHistory: [] }, { format: 'the-challenge' }, cast(24), seasons) };
    const html = seasonSwitchHtml(fresh, [ch]);
    expect(html.match(/<b>CH /g)).toHaveLength(1);
    expect(html).toContain('New season');
    expect(html).not.toContain('startAnotherLiveSeason()');
  });
  it('folded, it is one line of show icons and a paused season is still one click away', () => {
    const html = seasonSwitchHtml(td, [ch], { collapsed: true });
    expect(html).toContain('is-folded');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("switchLiveSeason('sabc')");
    expect(html).not.toContain('ssw-chip');
    expect(html).not.toContain('startAnotherLiveSeason()');
    expect(html).toContain(`TD ${td.number} · Ep 6`);
  });
  it('an exported season playing now offers no pause', () => {
    const done = { ...td, exported: true };
    expect(seasonSwitchHtml(done, [ch])).not.toContain('startAnotherLiveSeason()');
  });
});
