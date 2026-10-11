// Every part the Studio's Camp kit can write must survive the studio worker's save (worker/worker-studio.js
// kitToJson keeps only the parts it knows). Shared ground was added to the Studio and never to that list,
// so every save dropped it and the next publish wrote the roster without it (the user, 2026-10-11: "I
// filled shared ground right before and all that is gone", Sami and Ara).
import { describe, it, expect } from 'vitest';
import fs from 'fs';

const studio = fs.readFileSync('js/studio.js', 'utf8');
const worker = fs.readFileSync('worker/worker-studio.js', 'utf8');
// the worker's cleaner, run as written (the worker file has no imports to resolve)
const body = worker.slice(worker.indexOf('const KIT_LISTS'), worker.indexOf('function rosterRowToJson'));
const kitToJson = new Function('ValidationError', `${body}; return kitToJson;`)(class extends Error {});

describe('a Studio kit survives the save', () => {
  it('keeps every part the Camp kit editor writes', () => {
    // the parts: KIT_TEXT's keys, the bit rows, and the single fields (_kitOut)
    const text = [...studio.slice(studio.indexOf('const KIT_TEXT'), studio.indexOf('function _emptyKit')).matchAll(/\['(\w+)',/g)].map(m => m[1]);
    const single = [...studio.slice(studio.indexOf('function _kitOut'), studio.indexOf('const _kitCount')).matchAll(/out\.(\w+) =/g)].map(m => m[1]);
    expect(text.length).toBeGreaterThan(5);
    expect(single).toEqual(expect.arrayContaining(['thing', 'alone', 'ground']));
    const kit = { bit: ['a bit'], tease: ['a tease'], reply: ['a reply'], ground: ['artist', 'pets'] };
    for (const k of text) kit[k] = [`a ${k} line`];
    for (const k of single) if (!(k in kit)) kit[k] = `a ${k}`;
    const saved = JSON.parse(kitToJson(kit));
    for (const k of Object.keys(kit)) expect(saved, `the save drops "${k}"`).toHaveProperty(k);
    expect(saved.ground).toEqual(['artist', 'pets']);
  });
});
