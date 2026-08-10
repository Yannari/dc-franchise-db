// Syncing an episode to the site has to say which show it is.
//
// Reported: "Sync episode to site" came back with *Total Drama 1 is already
// published as a finished season* while a Big Brother season was loaded. The
// snapshot carried a season NUMBER and nothing else, and the Worker falls back
// to Total Drama for a payload with no format — so a Big Brother sync was filed
// as Total Drama, and its collision check ran against Total Drama's finished
// seasons, which is where the placeholder it collided with actually lived.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { SHOWS, DEFAULT_FORMAT } from '../js/shows.js';

const client = readFileSync('js/stats-export.js', 'utf8');
const worker = readFileSync('worker/worker-studio.js', 'utf8');

describe('the airing season knows which show it is', () => {
  it('stamps the format onto the snapshot the site receives', () => {
    expect(client, 'the live snapshot still carries only a season number')
      .toMatch(/format: seasonFormat\(typeof seasonConfig !== 'undefined' \? seasonConfig : null\)/);
  });

  it('takes it from the season, not from a constant', () => {
    // Both season-document pipelines hardcode their format — one to Total Drama
    // and one to Big Brother — because each is only ever reached for its own
    // show. The LIVE sync has no such split: one function, either show.
    const snapshot = client.slice(client.indexOf('export function extractLiveSeasonSnapshot'),
      client.indexOf('export async function syncLiveEpisode'));
    expect(snapshot).toMatch(/format: seasonFormat\(/);
    expect(snapshot, 'the airing season is pinned to one show').not.toMatch(/format: DEFAULT_FORMAT/);
    expect(snapshot).not.toMatch(/format: 'big-brother'/);
  });

  it('is the field the Worker actually reads', () => {
    // `SHOWS[payload.format] ? payload.format : DEFAULT_FORMAT` — the fallback
    // that turned a missing field into Total Drama.
    expect(worker).toMatch(/const fmt = SHOWS\[payload\.format\] \? payload\.format : DEFAULT_FORMAT;/);
    expect(worker).toMatch(/SELECT title FROM seasons WHERE format = \? AND season_number = \?/);
  });

  it('has a show for every format the registry knows', () => {
    for (const f of Object.keys(SHOWS)) expect(SHOWS[f].name).toBeTruthy();
    expect(SHOWS[DEFAULT_FORMAT]).toBeTruthy();
  });
});
