// @vitest-environment jsdom
// A race's couples from life events (the user, 2026-11-03: "chase and nichelle are married but it just put
// reality-tv show vets"). The life log loads after the simulator opens (main.js); the Pairs view read the cast before
// it arrived, remembered the answer with no couples in it, and kept it.
import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import { setPlayers } from '../js/core.js';
import { raceTeams } from '../js/rr-run.js';

const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
const raw = JSON.parse(fs.readFileSync('life_events.json', 'utf8'));
const log = (Array.isArray(raw) ? raw : raw.events || []).filter(e => e.status === 'approved');
const seasons = JSON.parse(fs.readFileSync('seasons_database.json', 'utf8')).seasons || [];
const card = (n, partner) => ({ ...roster.find(p => p.name === n), chPartner: partner });

afterEach(() => { delete window.__lifeLog; delete window.__lifeSeasons; });

describe('rr: couples from their life', () => {
  it('reads the cast again once the life log arrives: married in life is married on the race', () => {
    globalThis.FRANCHISE_ROSTER = roster;
    setPlayers([card('Chase', 'Nichelle'), card('Nichelle', 'Chase')]);
    delete window.__lifeLog;
    const before = raceTeams()[0];
    expect(before.rel).not.toBe('married');
    window.__lifeLog = log;
    window.__lifeSeasons = seasons;
    const after = raceTeams()[0];
    expect(after.rel).toBe('married');
    expect(after.history?.from).toBe('life');
  });
});
