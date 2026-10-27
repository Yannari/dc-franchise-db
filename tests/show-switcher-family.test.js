// A spin-off sits under its show as a tab, not as another top-level button.
// Plan: docs/superpowers/plans/2026-10-27-drag-race-all-stars-own-show.md (Task 7)
import { beforeEach, describe, expect, it } from 'vitest';
import { mountShowSwitcher, rememberShow } from '../js/show-switcher.js';
import { SHOWS } from '../js/shows.js';

const AS = 'drag-race-all-stars';
const setUrl = search => window.history.replaceState({}, '', '/seasons.html' + search);
const top = el => [...el.querySelectorAll('.show-sw > .show-sw-btn')];
const tabs = el => [...el.querySelectorAll('.show-sw-sub .show-sw-btn')];
const pressed = list => list.filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.show);

describe('the family toggle', () => {
  let el; let seen;
  const mount = (formats = Object.keys(SHOWS)) => {
    el = document.createElement('div'); seen = [];
    return mountShowSwitcher(el, { formats, onChange: f => seen.push(f) });
  };
  beforeEach(() => { setUrl(''); rememberShow('all'); });

  it('draws one button per family', () => {
    mount();
    const buttons = top(el);
    // Every spin-off folded into its family (All Stars, Secret Story), + All.
    const families = new Set(Object.keys(SHOWS).map(f => SHOWS[f].family || f));
    expect(buttons).toHaveLength(families.size + 1);
    expect(buttons.filter(b => /Drag Race/.test(b.textContent))).toHaveLength(1);
    expect(tabs(el)).toHaveLength(0);
  });

  it('opens on the flagship with a tab row', () => {
    const api = mount();
    top(el).find(b => /Drag Race/.test(b.textContent)).click();
    expect(api.current()).toBe('drag-race');
    expect(tabs(el).map(b => b.textContent.trim())).toEqual(['Drag Race', 'All Stars']);
    expect(pressed(tabs(el))).toEqual(['drag-race']);
  });

  it('switches to All Stars from its tab', () => {
    mount();
    top(el).find(b => /Drag Race/.test(b.textContent)).click();
    tabs(el).find(b => b.dataset.show === AS).click();
    expect(new URLSearchParams(window.location.search).get('show')).toBe(AS);
    expect(seen.at(-1)).toBe(AS);
    expect(pressed(top(el))).toHaveLength(1);
    expect(pressed(tabs(el))).toEqual([AS]);
  });

  it('a remembered spin-off on a page without it falls back to its flagship', () => {
    rememberShow(AS);
    const api = mount(['total-drama', 'drag-race']);
    expect(api.current()).toBe('drag-race');
  });

  it('a family of one draws no tab row', () => {
    mount();
    top(el).find(b => b.dataset.show === 'traitors').click();
    expect(tabs(el)).toHaveLength(0);
  });
});

describe('Secret Story under Big Brother', () => {
  it('opens a Big Brother | Secret Story tab row', () => {
    setUrl(''); rememberShow('all');
    const el = document.createElement('div'); const seen = [];
    mountShowSwitcher(el, { formats: Object.keys(SHOWS), onChange: f => seen.push(f) });
    top(el).find(b => b.dataset.show === 'big-brother').click();
    expect(tabs(el).map(b => b.textContent.trim())).toEqual(['Big Brother', 'Secret Story']);
    tabs(el).find(b => b.dataset.show === 'secret-story').click();
    expect(seen.at(-1)).toBe('secret-story');
  });
});
