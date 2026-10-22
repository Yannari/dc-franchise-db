// Geyser Island (LEGS.txt 06-GEYSER-ISLAND), 1:1 with the real show's "Bjorken Telephone": a bus to the park; a
// broken telephone across a field of geysers (Don says a phrase in the local language on a speaker box, the team runs
// through the steam and repeats it to a local, word for word); a helicopter to the national park; an Either/Or, eat
// the traditional feast or dig a fossil out of the ice cave, and bring the platter or the fossil to the Chill Zone.
export default {
  id: 'geyser-island', name: 'Geyser Island', recap: 'mangling a phrase across a field of geysers and eating things nobody should eat',
  region: 'north', map: { x: 42, y: 18 },
  arrive: 'airport', local: ['bus', 'helicopter', 'foot'],
  stretches: [
    { id: 'park-bus', kind: 'travel', mode: 'bus', base: 45, cost: 15, plate: 'bus on the mountain road', label: 'Bus to the park',
      mishaps: [['bus-breaks-down', 25]], mishapRate: 0.1 },
    { id: 'telephone', judge: true, called: 'the geyser field', kind: 'allin', types: ['brains', 'people'], base: 20, pass: 0.5, loopCost: 10, opens: 480, closes: 1140,
      plate: 'geyser field', label: 'All-In: broken telephone',
      // Don's phrase on the speaker box (they can't even say it to each other); the run through the geysers (soaked, the
      // words knocked out of their heads); the phrase to the local (one word wrong: back to the speaker); the tip
      stages: [{ id: 'the-speaker', share: 0.5, risk: 0.3 }, { id: 'the-geysers', share: 1.2, risk: 0.6 }, { id: 'the-local', share: 0.6, risk: 1 },
        { id: 'phrase-tip', share: 0.3, risk: 0 }],
      desc: "At the edge of a field of geysers, a speaker box plays Don saying one long phrase in the local language, and both partners listen as many times as they like. Then they run through the field, past vents that blast steam and scalding water without warning, to a local waiting on the far side, and repeat the phrase to them word for word. Get one word wrong, or forget it on the way, and the local shakes their head, and the team runs back through the geysers to listen again. Say it right and the local hands over the next tip." },
    { id: 'helicopter', kind: 'travel', mode: 'helicopter', base: 30, cost: 0, plate: 'helipad', label: 'Helicopter to the national park' },
    { id: 'feast-fossil', called: 'the canyon', kind: 'either', opens: 480, closes: 1200, plate: 'canyon river hut + ice cave', label: 'Feast or Fossil',
      desc: "Two ways to the next tip in the canyon. Feast means sitting down at the river hut and eating a whole traditional meal: fermented shark, sheep's head, sour ram's testicles and a shot of something that burns, every bite of every dish. Fossil means going into the ice cave with a pick and chipping a fossil out of the frozen wall without cracking it. Leaving food on the plate or breaking the fossil means another plate or another dig, and teams may switch sides. Bring the empty platter or the fossil to the Chill Zone.",
      sides: [
        // one dish at a time, every bite (left on the plate, or back up: a fresh plate of it)
        { id: 'feast', label: 'Feast', types: ['stomach'], base: 20, pass: 0.55, loopCost: 10, refuse: { identities: ['vegans'] },
          stages: [{ id: 'the-shark', share: 0.8, risk: 0.8 }, { id: 'sheeps-head', share: 0.8, risk: 0.8 }, { id: 'the-ram', share: 0.8, risk: 1 },
            { id: 'the-shot', share: 0.4, risk: 0.4 }, { id: 'clean-plate', share: 0.3, risk: 0 }] },
        // into the ice cave; finding the fossil in the wall; chipping it free (cracked: find another); lifting it out of the
        // ice (dropped); out of the cave with it
        { id: 'fossil', label: 'Fossil', types: ['search', 'patience'], base: 35, pass: 0.6, loopCost: 12,
          stages: [{ id: 'ice-cave', share: 0.4, risk: 0 }, { id: 'find-fossil', share: 0.8, risk: 0.3 }, { id: 'chip', share: 1.5, risk: 1 },
            { id: 'lift-out', share: 0.4, risk: 0.5 }, { id: 'fossil-out', share: 0.3, risk: 0 }] },
      ] },
    { id: 'mat', kind: 'mat', plate: 'rock wall', label: 'The Chill Zone' },
  ],
};
