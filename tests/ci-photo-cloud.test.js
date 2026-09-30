// ci-photo-cloud.test.js — the Circle's catfish images in the cloud, the way
// the character gallery keeps its art (user, 2026-09-30: "do it now like the
// gallery in the profile player website"). Same R2 bucket, same Worker route,
// same token; its own folder, `circle-photos/<id>.<ext>`.
import { describe, expect, it, beforeEach, vi } from 'vitest';
import worker from '../worker/worker-studio.js';

function bucket() {
  const m = new Map();
  return {
    m,
    async get(k) { const o = m.get(k); return o ? { ...o, body: o.body, arrayBuffer: async () => o.body, size: o.body.byteLength, httpMetadata: o.httpMetadata, customMetadata: o.customMetadata || {} } : null; },
    async put(k, body, opts = {}) { m.set(k, { body: body instanceof ArrayBuffer ? body : await new Response(body).arrayBuffer(), httpMetadata: opts.httpMetadata, customMetadata: opts.customMetadata }); },
    async delete(k) { m.delete(k); },
    async list({ prefix = '' } = {}) { return { objects: [...m.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key, size: m.get(key).body.byteLength })), truncated: false }; },
  };
}
const env = () => ({ STUDIO_TOKEN: 'secret', ALLOWED_ORIGIN: '*', GALLERY: bucket() });
const req = (method, path, { token, body, type = 'image/jpeg' } = {}) => new Request(`https://w.example${path}`, {
  method, body, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': type, Origin: 'https://yannari.github.io' },
});
const bytes = n => new Uint8Array(n).fill(7).buffer;

describe('the Worker keeps a Circle photo like gallery art', () => {
  it('uploads with the token, and serves it to anyone', async () => {
    const e = env();
    const put = await worker.fetch(req('PUT', '/gallery/circle-photos/abc123def.jpg', { token: 'secret', body: bytes(40) }), e);
    expect(put.status).toBe(200);
    const get = await worker.fetch(req('GET', '/gallery/circle-photos/abc123def.jpg'), e);
    expect(get.status).toBe(200);
    expect(get.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect((await get.arrayBuffer()).byteLength).toBe(40);
  });

  it('refuses an upload without the token', async () => {
    const res = await worker.fetch(req('PUT', '/gallery/circle-photos/abc123def.jpg', { body: bytes(10) }), env());
    expect(res.status).toBe(401);
  });

  it('refuses any other shape of key under the folder', async () => {
    const e = env();
    for (const bad of ['/gallery/circle-photos/../x.jpg', '/gallery/circle-photos/ab.jpg', '/gallery/circle-photos/abc123def.exe',
      '/gallery/circle-photos/sub/abc123def.jpg', '/gallery/circle-photos/ABC123DEF.jpg']) {
      const res = await worker.fetch(req('PUT', bad, { token: 'secret', body: bytes(10) }), e);
      expect(res.status, bad).toBe(400);
    }
    expect(e.GALLERY.m.size).toBe(0);
  });

  it('deletes with the token, and the listing says what is there', async () => {
    const e = env();
    await worker.fetch(req('PUT', '/gallery/circle-photos/aaaa1111.jpg', { token: 'secret', body: bytes(5) }), e);
    await worker.fetch(req('PUT', '/gallery/circle-photos/bbbb2222.jpg', { token: 'secret', body: bytes(5) }), e);
    const del = await worker.fetch(req('DELETE', '/gallery/circle-photos/aaaa1111.jpg', { token: 'secret' }), e);
    expect(del.status).toBe(200);
    const list = await (await worker.fetch(req('GET', '/api/gallery/circle-photos'), e)).json();
    expect(list.images.map(i => i.file)).toEqual(['bbbb2222.jpg']);
  });

  it('a character\'s own gallery keys still work exactly as before', async () => {
    const e = env();
    const res = await worker.fetch(req('PUT', '/gallery/bowie/3.webp', { token: 'secret', body: bytes(5), type: 'image/webp' }), e);
    expect(res.status).toBe(200);
  });
});

import { _memoryPhotos, putPhoto, photoSrc, photoURL, backUpPhotos, cloudUrlOf } from '../js/ci/photo-store.js';
describe('the browser side: upload when it can, read from the cloud when it must', () => {
  beforeEach(() => { _memoryPhotos(); vi.restoreAllMocks(); globalThis.localStorage?.removeItem?.('studio_api_token'); });

  it('with a token, a new photo goes up to the bucket as well', async () => {
    const calls = [];
    vi.stubGlobal('fetch', async (u, o = {}) => { calls.push([String(u), o.method]); return new Response(JSON.stringify({ ok: true }), { status: 200 }); });
    const id = await putPhoto('data:image/jpeg;base64,/9j/AAAA', { token: 'secret' });
    expect(calls).toEqual([[cloudUrlOf(id), 'PUT']]);
    vi.unstubAllGlobals();
  });

  it('without a token it stays in this browser, and says so', async () => {
    const f = vi.fn(); vi.stubGlobal('fetch', f);
    await putPhoto('data:image/jpeg;base64,/9j/AAAA');
    expect(f).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('a photo this browser never had is read from the cloud', async () => {
    expect(photoSrc('photo:zzzz9999')).toBe(cloudUrlOf('zzzz9999'));
    expect(await photoURL('photo:zzzz9999')).toBe(cloudUrlOf('zzzz9999'));
  });

  it('back up: uploads every photo the season uses that the bucket does not have yet', async () => {
    const a = await putPhoto('data:image/jpeg;base64,/9j/AAAA');
    const b = await putPhoto('data:image/jpeg;base64,/9j/BBBB');
    const puts = [];
    vi.stubGlobal('fetch', async (u, o = {}) => {
      if (String(u).includes('/api/gallery/circle-photos')) return new Response(JSON.stringify({ ok: true, images: [{ file: `${a}.jpg` }] }), { status: 200 });
      puts.push(String(u)); return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const r = await backUpPhotos([`photo:${a}`, `photo:${b}`, 'portrait:Beth'], 'secret');
    expect(puts).toEqual([cloudUrlOf(b)]);
    expect(r).toEqual({ uploaded: 1, already: 1, failed: 0 });
    vi.unstubAllGlobals();
  });
});
