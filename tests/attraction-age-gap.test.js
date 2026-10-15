// A romance never pairs somebody 60 or older with somebody 25 or younger, either way round (js/attraction.js tooFarApart;
// the user, 2026-10-14). No age set is no information.
import { it, expect } from 'vitest';
import { romanticallyCompatible as rc } from '../js/attraction.js';
const P = (age, gender = 'm') => ({ age, gender });
it('age gap', () => {
  expect(rc(P(62), P(22, 'f'))).toBe(false);
  expect(rc(P(22, 'f'), P(62))).toBe(false);
  expect(rc(P(60), P(25, 'f'))).toBe(false);
  expect(rc(P(59), P(22, 'f'))).toBe(true);
  expect(rc(P(60), P(26, 'f'))).toBe(true);
  expect(rc(P(undefined), P(22, 'f'))).toBe(true);
  expect(rc({ birthdate: '1950-01-01', gender: 'm' }, P(20, 'f'))).toBe(false);
});
