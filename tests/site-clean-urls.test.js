// Clean addresses: blindsidenetwork.com/timeline serves timeline.html, the
// address bar drops .html, and every .html spelling keeps answering.
import { describe, it, expect } from 'vitest';
import { currentPage, cleanHref, servesCleanUrls, cleanAddress } from '../js/site-header.js';
import site from '../worker/site.js';

const loc = (href) => new URL(href);

describe('site header', () => {
  it('reads a clean address as the page of the same name', () => {
    expect(currentPage('/timeline')).toBe('timeline.html');
    expect(currentPage('/')).toBe('index.html');
    expect(currentPage('/dc-franchise-db/player.html')).toBe('player.html');
  });

  it('cleans hrefs, and never turns the index into an empty href', () => {
    expect(cleanHref('timeline.html')).toBe('timeline');
    expect(cleanHref('player.html?player=owen')).toBe('player?player=owen');
    expect(cleanHref('index.html')).toBe('./');
  });

  it('only cleans where the server answers the clean spelling', () => {
    expect(servesCleanUrls(loc('https://blindsidenetwork.com/timeline.html'))).toBe(true);
    expect(servesCleanUrls(loc('https://yannari.github.io/dc-franchise-db/'))).toBe(true);
    expect(servesCleanUrls(loc('http://localhost:8080/timeline.html'))).toBe(false);
    expect(servesCleanUrls(loc('file:///C:/site/timeline.html'))).toBe(false);
  });

  it('rewrites the address bar, keeping query and hash', () => {
    const calls = [];
    const hist = { state: null, replaceState: (_s, _t, url) => calls.push(url) };
    cleanAddress(loc('https://blindsidenetwork.com/player.html?player=owen#seasons'), hist);
    cleanAddress(loc('https://blindsidenetwork.com/index.html'), hist);
    cleanAddress(loc('https://yannari.github.io/dc-franchise-db/index.html'), hist);
    cleanAddress(loc('https://blindsidenetwork.com/timeline'), hist);         // already clean
    cleanAddress(loc('http://localhost:8080/timeline.html'), hist);           // local: left alone
    expect(calls).toEqual(['/player?player=owen#seasons', '/', '/dc-franchise-db/']);
  });
});

describe('worker/site.js', () => {
  const files = new Set(['/index.html', '/timeline.html', '/seasons/index.html']);
  const env = {
    ASSETS: { fetch: async (req) => {
      const path = new URL(req.url ?? req).pathname;
      return new Response(files.has(path) ? path : 'missing', { status: files.has(path) ? 200 : 404 });
    } },
  };
  const get = async (url) => {
    const res = await site.fetch(new Request(url), env);
    return { status: res.status, body: res.status === 200 ? await res.text() : null, to: res.headers.get('location') };
  };

  it('serves a clean address from its .html', async () => {
    expect(await get('https://blindsidenetwork.com/timeline')).toMatchObject({ status: 200, body: '/timeline.html' });
    expect(await get('https://blindsidenetwork.com/')).toMatchObject({ status: 200, body: '/index.html' });
    expect(await get('https://blindsidenetwork.com/seasons/')).toMatchObject({ status: 200, body: '/seasons/index.html' });
  });

  it('sends www to the one home', async () => {
    expect(await get('https://www.blindsidenetwork.com/timeline?x=1'))
      .toMatchObject({ status: 301, to: 'https://blindsidenetwork.com/timeline?x=1' });
  });

  it('a real miss stays a miss', async () => {
    expect((await get('https://blindsidenetwork.com/nope')).status).toBe(404);
    expect((await get('https://blindsidenetwork.com/nope.png')).status).toBe(404);
  });
});
