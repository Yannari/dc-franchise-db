// Character kits (td/story/kits/*.js): each one belongs to somebody in the roster, its bit, tease and reply
// line up (bit[i] / tease[i] / reply[i] are one exchange), and nothing in it is a slot the writer can't
// fill. The user, 2026-10-10: "more like a real Disventure Camp episode": the kits are what make a scene
// about the people in it.
import { it, expect } from 'vitest';
import fs from 'fs';
import KITS from '../js/td/story/kits/index.js';

const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players.map(p => p.name);
const PARTS = ['bit', 'tease', 'reply', 'home', 'want', 'conf', 'askHome', 'askWant'];

it('every kit is somebody in the roster', () => {
  expect(Object.keys(KITS).filter(n => !roster.includes(n))).toEqual([]);
});
it('a bit, its tease and its reply line up', () => {
  for (const [n, k] of Object.entries(KITS)) {
    expect(k.bit.length, n).toBe(k.tease.length);
    expect(k.bit.length, n).toBe(k.reply.length);
  }
});
it('has every part, and only the slots the writer fills', () => {
  for (const [n, k] of Object.entries(KITS)) for (const p of PARTS) {
    expect(Array.isArray(k[p]) && k[p].length > 0, `${n}.${p}`).toBe(true);
    for (const line of k[p]) for (const m of String(line).matchAll(/\{([\w.]+)\}/g)) expect(['a', 'b', 'a.obj', 'b.obj', 'a.sub', 'b.sub'], `${n}.${p}: ${line}`).toContain(m[1]);
  }
});

// Shared ground (kits-ground.js; the user, 2026-10-10: "do we also have bond by backstory?" and "stay true to
// the character always"): every hand-written kit says what its character's life has in it, in the fixed
// vocabulary only, read from the profile, so two people can find out they share something.
import GROUNDS, { GROUND } from '../js/td/story/kits/kits-ground.js';
import { sharedGround } from '../js/td/story/kits.js';
it('gives every kit its shared ground, in the vocabulary', () => {
  expect(Object.keys(KITS).filter(n => !GROUNDS[n])).toEqual([]);
  for (const [n, g] of Object.entries(GROUNDS)) {
    expect(roster, n).toContain(n);
    for (const t of g.ground) expect(GROUND[t], `${n}: ${t}`).toBeTruthy();
  }
});
it('finds what two people share, from the kits and the roster', () => {
  globalThis.FRANCHISE_ROSTER = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
  // both helped raise younger siblings (Hasan: the oldest of four; Jules: after his father left)
  expect(sharedGround('Hasan', 'Jules').map(x => x.tag)).toContain('raised-siblings');
  // twins, from the same city
  const tw = sharedGround('Harriett', 'Jane').map(x => x.tag);
  expect(tw).toContain('twin');
  expect(tw).toContain('same-hometown');
  // both from Sao Paulo, written two ways in the roster ("São Paulo", "Sao paulo")
  expect(sharedGround('Felipe', 'James').map(x => x.tag)).toContain('same-hometown');
  expect(sharedGround('Hasan', 'Hasan')).toEqual([]);
});
