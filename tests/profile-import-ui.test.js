// @vitest-environment jsdom
//
// The fill preview. There used to be two buttons here — one loading the saved
// roster, one fetching the wiki — and comparing their field lists showed the
// wiki could offer nothing the roster could not. The choice was never about
// coverage, it was about where a value came from, which is a property of a
// row. So they merged, and these are the guarantees that had to survive the
// merge: blanks come ticked, anything already written does not, bad provenance
// disables its own row, and nothing reaches the draft without Apply.
import { beforeEach, describe, expect, it, vi } from 'vitest';

let openPreview;

beforeEach(async () => {
  document.body.innerHTML = '<div id="st-editor"></div>';
  if (!openPreview) ({ _openProfileFillPreview: openPreview } = await import('../js/studio.js'));
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

const roster = profile => ({ origin: 'roster', label: 'Saved profile', profile });
const open = (opts = {}) => openPreview(current(), { current: current(), ...opts });
const box = key => document.querySelector(`[data-profile-key="${key}"]`);

describe('one source', () => {
  it('fills blanks by default, protects authored fields, and applies without saving', () => {
    const applied = vi.fn();
    const saveSpy = vi.fn();
    const preview = open({ onApply: applied, onSave: saveSpy });
    preview.addSource(roster(published()));

    expect(box('hometown').checked, 'a blank arrives ticked').toBe(true);
    expect(box('personality').checked, 'prose already written does not').toBe(false);
    document.querySelector('#st-profile-apply').click();

    expect(applied).toHaveBeenCalledWith(expect.objectContaining({
      hometown: 'Toronto, Ontario', personality: 'My edited read',
      profileSources: expect.objectContaining({ hometown: published().profileSources.hometown }),
    }));
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('cancels without applying', () => {
    const applied = vi.fn();
    open({ onApply: applied }).addSource(roster(published()));
    document.querySelector('#st-profile-cancel').click();
    expect(applied).not.toHaveBeenCalled();
    expect(document.querySelector('#st-profile-import')).toBeNull();
  });

  it('shows invalid provenance and leaves its field unchecked', () => {
    const bad = published();
    bad.profileSources.hometown[0].kind = 'rumour';
    open({ onApply: vi.fn() }).addSource(roster(bad));
    expect(document.querySelector('#st-profile-errors').textContent).toContain('kind is invalid');
    expect(box('hometown').checked).toBe(false);
  });

  it('opens on nothing without falling over', () => {
    // The dialog opens before the wiki answers, and a character with no saved
    // profile has nothing in it at all until then.
    open({ onApply: vi.fn() });
    expect(document.querySelector('#st-profile-import')).not.toBeNull();
    expect(document.querySelector('.st-empty')).not.toBeNull();
  });
});

describe('a second source arriving late', () => {
  const wiki = () => ({
    slug: 'bowie', hometown: 'Ottawa', occupation: 'Theatre kid',
    profileSources: {
      hometown: [{ label: 'Total Drama Wiki', kind: 'source-canon', quote: 'grew up in Ottawa' }],
      occupation: [{ label: 'Read from the article', kind: 'interpretation' }],
    },
  });

  it('turns a disagreement into a choice rather than picking for you', () => {
    const preview = open({ onApply: vi.fn() });
    preview.addSource(roster(published()));
    preview.addSource({ origin: 'wiki', label: 'Total Drama Wiki', profile: wiki() });

    const radios = document.querySelectorAll('input[name="pick-hometown"]');
    expect(radios.length, 'two answers, two options').toBe(2);
    expect([...radios].map(r => r.value)).toEqual(['Toronto, Ontario', 'Ottawa']);
    expect(radios[0].checked, 'the first source offering it holds the default').toBe(true);
  });

  it('applies the answer that was actually picked, with its own citation', () => {
    const applied = vi.fn();
    const preview = open({ onApply: applied });
    preview.addSource(roster(published()));
    preview.addSource({ origin: 'wiki', label: 'Total Drama Wiki', profile: wiki() });

    document.querySelectorAll('input[name="pick-hometown"]')[1].checked = true;
    document.querySelector('#st-profile-apply').click();

    const out = applied.mock.calls[0][0];
    expect(out.hometown).toBe('Ottawa');
    expect(out.profileSources.hometown[0].quote).toBe('grew up in Ottawa');
  });

  it('keeps ticks and choices made before it arrived', () => {
    const preview = open({ onApply: vi.fn() });
    preview.addSource(roster(published()));

    // The reader unticks a blank they do not want, then the wiki lands.
    box('hometown').checked = false;
    preview.addSource({ origin: 'wiki', label: 'Total Drama Wiki', profile: wiki() });

    expect(box('hometown').checked, 're-rendering must not undo a decision').toBe(false);
    expect(box('occupation').checked, 'a newly offered blank still arrives ticked').toBe(true);
  });

  it('offers a field only the late source knows about', () => {
    const preview = open({ onApply: vi.fn() });
    preview.addSource(roster(published()));
    expect(box('occupation')).toBeNull();
    preview.addSource({ origin: 'wiki', label: 'Total Drama Wiki', profile: wiki() });
    expect(box('occupation')).not.toBeNull();
  });
});
