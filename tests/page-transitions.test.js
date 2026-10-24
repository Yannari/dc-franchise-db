// The slide between network pages, and the portrait that flies into a player.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { playerOf, PORTRAIT_VT } from '../js/page-transitions.js';

describe('playerOf', () => {
  it('reads the player from both addresses the site serves', () => {
    expect(playerOf('player.html?player=heather')).toBe('heather');
    expect(playerOf('/player?player=bb-sabrina')).toBe('bb-sabrina');
    expect(playerOf('https://blindsidenetwork.com/player?player=x')).toBe('x');
  });
  it('is null for every other page', () => {
    expect(playerOf('players.html?player=x')).toBe(null);
    expect(playerOf('devotees.html')).toBe(null);
    expect(playerOf('/season_ref?season=2')).toBe(null);
  });
});

describe('who opts in', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  it('the network stylesheet turns them on, and only without reduced motion', () => {
    const block = css.slice(css.indexOf('PAGE TRANSITIONS'));
    expect(block).toMatch(/prefers-reduced-motion: no-preference[\s\S]*@view-transition \{ navigation: auto; \}/);
    expect(block).toContain(`#pp-hero-portrait { view-transition-name: ${PORTRAIT_VT}; }`);
  });
  it('the simulator never does: it does not load the network stylesheet', () => {
    // Two apps animating into each other would make a 6 MB page wait on a fade.
    expect(fs.readFileSync('simulator.html', 'utf8')).not.toMatch(/href="styles\.css"/);
    expect(fs.readFileSync('css/simulator.css', 'utf8')).not.toMatch(/@view-transition/);
  });
});
