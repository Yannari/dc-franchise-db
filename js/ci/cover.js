// ci/cover.js — keeping a persona up (Plan 3a+ Task 15).
//
// A catfish is supposed to come across a certain way: the sweet cowgirl, the
// gym bro, the pastry chef. The strain of keeping that up is how far it sits
// from the real person, on three axes:
//   style   the persona's register against the person's own (register.js)
//   age     playing younger costs more than playing older: slang and
//           references move fast, and an older player has to guess them
//   smarts  a sharp player dumbing down leaks precision; faking expertise
//           leaks ignorance, and that costs more
// No gender axis: what cracks is style, age and smarts (the body slip in
// slips.js is lived experience, not a way of typing).
// Social, mental and intuition ease it, and so does preparation (setup.prep,
// 0..1: "coached by her grandson before she went in"). It wears on as the
// season goes. A cover that cracks is a voice slip; the scene it cracks in
// is typed in the person's own register (script.js via shownRegister).
import { clamp, S, peopleOf } from './state.js';
import { registerOf, registerOfPerson } from './register.js';
import { jobOf } from './persona-data.js';

// What a job sounds like, and how much it knows. Unlisted jobs fall back to age.
const JOBS = [
  [/doctor|surgeon|lawyer|attorney|professor|scientist|engineer|pharmacist|accountant|stenographer/, 'formal', 8],
  [/teacher|librarian|manager|nurse practitioner|consultant/, 'formal', 7],
  [/trainer|coach|athlete|gym|fitness|wrestler|dj|promoter/, 'hype', 5],
  [/nurse|nanny|social worker|caregiver|therapist|chef|baker|pastry|rodeo|barrel|ranch|farm/, 'warm', 6],
  [/model|bartender|dancer|influencer|actor|actress|singer|stylist|showgirl/, 'flirty', 5],
  [/student|gamer|intern|barista/, 'dry', 5],
  [/sales|realtor|landscaper|mechanic|contractor|security|police|firefighter/, 'blunt', 5],
];

/** What a persona is supposed to sound like: { register, smarts }. */
export function personaStyle(persona = {}) {
  // A picked job (ci/persona-data.js) says it outright; a typed one is read
  // by its words; the author's own choice of style wins over both.
  const picked = jobOf(persona);
  const job = String(persona.job || '').toLowerCase();
  const hit = picked ? [null, picked.register, picked.smarts] : JOBS.find(([re]) => re.test(job));
  const age = persona.age ?? 28;
  const register = persona.register || persona.chatVoice?.register
    || (hit ? hit[1] : age < 25 ? 'hype' : age < 40 ? 'warm' : 'formal');
  return { register, smarts: hit ? hit[2] : age >= 40 ? 6 : 5 };
}

// Registers on two axes (energy, polish): the distance is how far a person
// has to travel to type like somebody else.
const PLACE = { hype: [1, 0.2], flirty: [0.7, 0.3], warm: [0.5, 0.5], blunt: [0.6, 0.4], dry: [0.1, 0.3], formal: [0.2, 1] };
export const registerDistance = (a, b) => Math.abs(PLACE[a][0] - PLACE[b][0]) + Math.abs(PLACE[a][1] - PLACE[b][1]);

export const COVER = { younger: 0.35, older: 0.2, dumbDown: 0.5, fakeUp: 0.9, wear: 40, ease: 0.8, prep: 0.3 };

const hasCover = (state, h) => state.profiles[h]?.mode === 'catfish';
const personaOf = (state, h) => ({ ...(state.profiles[h].shown || {}), chatVoice: state.profiles[h].personaVoice || null });

/** The three gaps, before skill and time. */
export function coverParts(state, h) {
  if (!hasCover(state, h)) return { style: 0, age: 0, smarts: 0 };
  const real = state.people[peopleOf(state, h)[0]];
  const want = personaStyle(personaOf(state, h));
  const style = registerDistance(registerOfPerson(real), want.register);
  const dAge = (real.age ?? 28) - (state.profiles[h].shown?.age ?? real.age ?? 28);
  const age = dAge > 0 ? dAge / 10 * COVER.younger : -dAge / 10 * COVER.older;
  const m = S(state, h, 'mental');
  const smarts = m > want.smarts ? (m - want.smarts) / 10 * COVER.dumbDown : (want.smarts - m) / 10 * COVER.fakeUp;
  return { style, age, smarts };
}

/** How well the person can hold a voice that isn't theirs (0..0.9). */
export function coverAbility(state, h) {
  const prep = Math.max(...peopleOf(state, h).map(n => state.people[n]?.prep ?? 0), 0);
  const skill = (S(state, h, 'social') * 0.4 + S(state, h, 'mental') * 0.3 + S(state, h, 'intuition') * 0.3) / 10;
  return clamp(skill * COVER.ease + prep * COVER.prep, 0, 0.9);
}

/** The strain of keeping the persona up today: 0 for anybody with no cover. */
export function coverStrain(state, h) {
  if (!hasCover(state, h)) return 0;
  const p = coverParts(state, h);
  return (p.style + p.age + p.smarts) * (1 - coverAbility(state, h)) * (1 + (state.day ?? 1) / COVER.wear);
}

/** Did the cover crack in this scene (a voice slip by h)? */
export const cracked = (state, h, scene) => !!scene?.data?.slips?.some(x => x.by === h && x.kind === 'voice' && !x.misread);

/** The register a profile's messages show in a scene: the persona's while the
 *  cover holds, the person's own where it cracks. */
export function shownRegister(state, h, scene, who = null) {
  if (!hasCover(state, h) || cracked(state, h, scene)) return registerOf(state, h, who);
  return personaStyle(personaOf(state, h)).register;
}

/** Whose authored voice types: the persona's while the cover holds. */
export function shownVoice(state, h, scene, person) {
  if (hasCover(state, h) && !cracked(state, h, scene)) return state.profiles[h].personaVoice || null;
  return person ? state.people[person]?.chatVoice || null : null;
}

/** Which way a cover cracks, for the words: the real voice pulls the persona
 *  stiff / sloppy (polish), loud / flat (energy), or dated / young (age).
 *  'off' is a voice that just doesn't sound like the profile (a pair). */
export function crackOf(state, h) {
  if (!hasCover(state, h)) return 'off';
  const own = PLACE[registerOfPerson(state.people[peopleOf(state, h)[0]])];
  const want = PLACE[personaStyle(personaOf(state, h)).register];
  const de = own[0] - want[0], dp = own[1] - want[1];
  if (dp >= 0.3 && dp >= Math.abs(de)) return 'stiff';
  if (Math.abs(de) >= 0.3) return de > 0 ? 'loud' : 'flat';
  if (dp <= -0.3) return 'sloppy';
  const dAge = (state.people[peopleOf(state, h)[0]].age ?? 28) - (state.profiles[h].shown?.age ?? 28);
  return dAge >= 10 ? 'dated' : dAge <= -10 ? 'young' : 'off';
}
