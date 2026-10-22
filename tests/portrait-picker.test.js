// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { setPortraitCatalog } from '../js/avatar-registry.js';
import { renderPortraitPicker, filterRoster, setFRANCHISE_ROSTER } from '../js/cast-ui.js';

const CATALOG = {
  schemaVersion: 1,
  players: {
    bowie: {
      defaults: { global: 'base', traitors: 'tr-castle' },
      portraits: [
        { id: 'base', show: 'global', label: 'Profile default', file: 'bowie.png' },
        { id: 'bb-1', show: 'big-brother', label: 'House look', file: 'bowie-bb.png' },
        { id: 'tr-castle', show: 'traitors', label: 'Castle outfit', file: 'bowie-tr.png' },
        { id: 'tr-gone', show: 'traitors', label: 'Lost art', file: 'bowie-gone.png' },
      ],
    },
    plain: { defaults: { global: 'base' }, portraits: [{ id: 'base', show: 'global', label: 'Profile default', file: 'plain.png' }] },
  },
};
beforeEach(() => setPortraitCatalog(CATALOG, ['bowie.png', 'bowie-bb.png', 'bowie-tr.png', 'plain.png']));

describe('renderPortraitPicker', () => {
  it('offers only this show plus global, show-specific first', () => {
    const html = renderPortraitPicker('bowie', 'tr-castle', 'traitors', 'Bowie');
    expect(html).toContain('Castle outfit');
    expect(html).toContain('Profile default');
    expect(html).not.toContain('House look');
    expect(html.indexOf('Castle outfit')).toBeLessThan(html.indexOf('Profile default'));
  });

  it('is a keyboard-navigable radio group with a per-option text label', () => {
    const html = renderPortraitPicker('bowie', 'tr-castle', 'traitors', 'Bowie');
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('type="radio"');
    expect(html).toContain('Bowie &#8212; The Traitors &#8212; Castle outfit'.replace(/&#8212;/g, '—'));
  });

  it('marks the selection with more than colour', () => {
    const html = renderPortraitPicker('bowie', 'tr-castle', 'traitors', 'Bowie');
    expect(html).toMatch(/value="tr-castle"[^>]*checked/);
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('portrait-opt-check');
  });

  it('disables a registered file that is not on disk and says so', () => {
    const html = renderPortraitPicker('bowie', 'tr-castle', 'traitors', 'Bowie');
    expect(html).toMatch(/value="tr-gone"[^>]*disabled/);
    expect(html).toContain('Missing file');
  });

  it('never lands the default selection on a missing file', () => {
    setPortraitCatalog(CATALOG, ['bowie.png', 'bowie-tr.png']);
    const html = renderPortraitPicker('bowie', 'tr-gone', 'traitors', 'Bowie');
    expect(html).toMatch(/value="tr-castle"[^>]*checked/);
  });

  it('explains itself when the player has nothing for this show', () => {
    const html = renderPortraitPicker('plain', null, 'traitors', 'Plain');
    expect(html).toContain('No The Traitors portrait yet');
    expect(html).toMatch(/value="base"[^>]*checked/);
  });

  it('has no per-show cap', () => {
    const big = JSON.parse(JSON.stringify(CATALOG));
    for (let i = 0; i < 12; i++) big.players.bowie.portraits.push({ id: `tr-x${i}`, show: 'traitors', label: `Look ${i}`, file: 'bowie-tr.png' });
    setPortraitCatalog(big, ['bowie.png', 'bowie-tr.png', 'bowie-bb.png', 'bowie-gone.png']);
    const html = renderPortraitPicker('bowie', 'tr-castle', 'traitors', 'Bowie');
    expect((html.match(/type="radio"/g) || []).length).toBe(15);
  });

  it('says so rather than crashing for somebody with no catalog entry', () => {
    expect(renderPortraitPicker('ghost', null, 'traitors', 'Ghost')).toContain('No registered portrait');
  });

  it('escapes a name so a label cannot inject markup', () => {
    const html = renderPortraitPicker('bowie', 'tr-castle', 'traitors', '<img onerror=1>');
    expect(html).not.toContain('<img onerror=1>');
    expect(html).toContain('&lt;img onerror=1&gt;');
  });
});

describe('the roster search badge', () => {
  // Arjun's second look was made in the casting studio for every show
  // ('global'), and the badge counted only show-specific looks: no "+1",
  // though the picker offered two.
  const badgeFor = (slug, name, format = 'total-drama') => {
    globalThis.seasonConfig = { format };   // cast-ui reads the page's global, not an import
    setPortraitCatalog({ schemaVersion: 1, players: {
      ...CATALOG.players,
      arjun: { defaults: { global: 'base' }, portraits: [
        { id: 'base', show: 'global', label: 'Profile default', file: 'arjun.png' },
        { id: 'look-1', show: 'global', label: 'Casual', file: 'arjun-look-1.png' },
      ] },
    } }, ['bowie.png', 'bowie-bb.png', 'bowie-tr.png', 'plain.png', 'arjun.png', 'arjun-look-1.png']);
    document.body.innerHTML = '<div id="roster-dropdown"></div>';
    setFRANCHISE_ROSTER([{ name, slug, archetype: 'floater' }]);
    filterRoster(name);
    return document.querySelector('#roster-dropdown .roster-item').textContent.match(/\+(\d+)/)?.[1] ?? null;
  };

  it('counts a look made for every show', () => expect(badgeFor('arjun', 'Arjun')).toBe('1'));
  it('counts this show\'s looks, not the profile default or a missing file', () => {
    expect(badgeFor('bowie', 'Bowie', 'traitors')).toBe('1');
    expect(badgeFor('bowie', 'Bowie', 'big-brother')).toBe('1');
  });
  it('shows nothing for a character with only the profile default', () => expect(badgeFor('plain', 'Plain')).toBe(null));
});
