// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

let openPreview;

beforeEach(async () => {
  document.body.innerHTML = '<div id="st-editor"></div>';
  if (!openPreview) ({ _openPublishedProfilePreview: openPreview } = await import('../js/studio.js'));
});

const current = () => ({
  slug: 'bowie', name: 'Bowie', hometown: '', personality: 'My edited read',
  stats: { physical:5,endurance:5,mental:5,social:5,strategic:5,loyalty:5,boldness:5,intuition:5,temperament:5 },
  profileSources: {},
});

const published = () => ({
  ...current(), hometown: 'Toronto, Ontario', personality: 'Published read',
  profileSources: {
    hometown: [{ label: 'Official biography', kind: 'source-canon' }],
    personality: [{ label: 'Continuity bible', kind: 'simulator-continuity' }],
  },
});

describe('published profile preview', () => {
  it('fills blanks by default, protects authored fields, and applies without saving', () => {
    const applied = vi.fn();
    const saveSpy = vi.fn();
    openPreview(published(), { current: current(), onApply: applied, onSave: saveSpy });

    expect(document.querySelector('[data-profile-key="hometown"]').checked).toBe(true);
    expect(document.querySelector('[data-profile-key="personality"]').checked).toBe(false);
    document.querySelector('#st-profile-apply').click();

    expect(applied).toHaveBeenCalledWith(expect.objectContaining({
      hometown: 'Toronto, Ontario', personality: 'My edited read',
      profileSources: expect.objectContaining({ hometown: published().profileSources.hometown }),
    }));
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('cancels without applying', () => {
    const applied = vi.fn();
    openPreview(published(), { current: current(), onApply: applied });
    document.querySelector('#st-profile-cancel').click();
    expect(applied).not.toHaveBeenCalled();
    expect(document.querySelector('#st-profile-import')).toBeNull();
  });

  it('shows invalid provenance and leaves its field unchecked', () => {
    const bad = published();
    bad.profileSources.hometown[0].kind = 'rumour';
    openPreview(bad, { current: current(), onApply: vi.fn() });
    expect(document.querySelector('#st-profile-errors').textContent).toContain('kind is invalid');
    expect(document.querySelector('[data-profile-key="hometown"]').checked).toBe(false);
  });
});