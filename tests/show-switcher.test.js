// tests/show-switcher.test.js
// The switcher owns which show you are looking at. It must never hold its own
// list of shows — the formats come from whatever data the page loaded, so a
// third show appears without editing this module.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL, currentShow, mountShowSwitcher, orderFormats,
  rememberShow, rememberedShow } from '../js/show-switcher.js';

function setUrl(search) {
  window.history.replaceState({}, '', '/seasons.html' + search);
}

describe('reading the show from the URL', () => {
  beforeEach(() => setUrl(''));

  it('shows everything when nothing is asked for', () => {
    expect(currentShow()).toBe(ALL);
    setUrl('?show=all');
    expect(currentShow()).toBe(ALL);
  });

  it('reads a real format', () => {
    setUrl('?show=big-brother');
    expect(currentShow()).toBe('big-brother');
  });

  it('degrades a stale or nonsense link instead of erroring', () => {
    // A link from before a show was renamed must still open the page.
    setUrl('?show=wrestling');
    expect(currentShow()).toBe(ALL);
    setUrl('?show=');
    expect(currentShow()).toBe(ALL);
  });
});

describe('ordering the shows', () => {
  it('puts the default format first, then the rest as given', () => {
    expect(orderFormats(['big-brother', 'total-drama'])).toEqual(['total-drama', 'big-brother']);
    expect(orderFormats(['big-brother'])).toEqual(['big-brother']);
  });

  it('keeps an unknown format rather than dropping it', () => {
    // A season in a format the registry has not learned yet must still be
    // reachable — dropping it would hide seasons with no error anywhere.
    expect(orderFormats(['wrestling', 'total-drama'])).toEqual(['total-drama', 'wrestling']);
  });
});

describe('the control', () => {
  let el;
  beforeEach(() => { setUrl(''); el = document.createElement('div'); document.body.appendChild(el); });
  afterEach(() => el.remove());

  it('offers every format it was given, plus All', () => {
    mountShowSwitcher(el, { formats: ['total-drama', 'big-brother'], onChange: () => {} });
    const values = [...el.querySelectorAll('[data-show]')].map(b => b.dataset.show);
    expect(values).toEqual([ALL, 'total-drama', 'big-brother']);
    // Labels come from the registry, not from this module.
    expect(el.textContent).toContain('Total Drama');
    expect(el.textContent).toContain('Big Brother');
  });

  it('offers nothing to switch to when there is only one show', () => {
    // A franchise with one show should not show a switcher at all.
    mountShowSwitcher(el, { formats: ['total-drama'], onChange: () => {} });
    expect(el.querySelectorAll('[data-show]')).toHaveLength(0);
  });

  it('reports and changes the current show, and puts it in the URL', () => {
    const onChange = vi.fn();
    const sw = mountShowSwitcher(el, { formats: ['total-drama', 'big-brother'], onChange });
    expect(sw.current()).toBe(ALL);

    sw.set('big-brother');
    expect(sw.current()).toBe('big-brother');
    expect(window.location.search).toBe('?show=big-brother');
    expect(onChange).toHaveBeenCalledWith('big-brother');

    // Back to everything drops the parameter rather than writing ?show=all.
    sw.set(ALL);
    expect(window.location.search).toBe('');
  });

  it('marks which one is selected', () => {
    setUrl('?show=big-brother');
    mountShowSwitcher(el, { formats: ['total-drama', 'big-brother'], onChange: () => {} });
    const on = [...el.querySelectorAll('[data-show]')].filter(b => b.getAttribute('aria-pressed') === 'true');
    expect(on).toHaveLength(1);
    expect(on[0].dataset.show).toBe('big-brother');
  });

  it('re-renders when the browser goes back', () => {
    const onChange = vi.fn();
    mountShowSwitcher(el, { formats: ['total-drama', 'big-brother'], onChange });
    setUrl('?show=total-drama');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(onChange).toHaveBeenCalledWith('total-drama');
  });
});

describe('remembering the show across pages', () => {
  beforeEach(() => { setUrl(''); window.sessionStorage.clear(); });
  afterEach(() => window.sessionStorage.clear());

  it('starts on everything, however many times you visit', () => {
    // sessionStorage, not localStorage, on purpose: a chosen show follows you
    // for the tab, then a fresh visit starts at All. Persisting forever would
    // mean somebody who set it last week returns to a site with half the
    // franchise missing and no memory of hiding it.
    expect(currentShow()).toBe(ALL);
  });

  it('carries a choice to a page with no ?show= in its URL', () => {
    rememberShow('big-brother');
    setUrl('');                                  // navigated to a bare page
    expect(currentShow()).toBe('big-brother');
  });

  it('lets the URL beat the memory, so shared links show what the sender saw', () => {
    rememberShow('big-brother');
    setUrl('?show=total-drama');
    expect(currentShow()).toBe('total-drama');
  });

  it('treats ?show=all as an explicit choice, not an absent one', () => {
    // Without this you could never get back to every show without closing the
    // tab: the memory would keep answering for a URL that says "all".
    rememberShow('big-brother');
    setUrl('?show=all');
    expect(currentShow()).toBe(ALL);
  });

  it('forgets when you go back to all shows', () => {
    rememberShow('big-brother');
    rememberShow(ALL);
    expect(rememberedShow()).toBe(null);
    setUrl('');
    expect(currentShow()).toBe(ALL);
  });

  it('ignores a remembered show the registry does not recognise', () => {
    window.sessionStorage.setItem('dc_show', 'wrestling');
    expect(rememberedShow()).toBe(null);
    expect(currentShow()).toBe(ALL);
  });

  it('records the choice when the control is used', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const sw = mountShowSwitcher(el, { formats: ['total-drama', 'big-brother'], onChange: () => {} });
    sw.set('big-brother');
    expect(rememberedShow()).toBe('big-brother');
    sw.set(ALL);
    expect(rememberedShow()).toBe(null);
    el.remove();
  });
});
