// Secret Base Desert (LEGS.txt 40-SECRET-BASE-DESERT), the World Tour's secret-base leg as the frames show it: a pickup
// out across the desert; both partners sneak into the base past the soldiers, the warning signs and the buzzing fences
// without being caught (All-In); then they find an alien artifact somewhere in the hangar and carry it back out to the
// fence without a scratch on it (All-In); the Chill Zone is out in the night desert.
export default {
  id: 'secret-base-desert', name: 'Secret Base Desert', recap: 'sneaking into a secret base and stealing back an alien artifact',
  region: 'north', map: { x: 12, y: 38 },
  // a place being built: playable when booked, never drawn or offered until its lines, plates and music are in
  draft: true,
  arrive: 'airport', local: ['drive', 'foot'],
  stretches: [
    { id: 'desert-pickup', kind: 'travel', mode: 'drive', base: 45, cost: 20, plate: 'empty desert highway', label: 'Drive into the desert',
      mishaps: [['engine-overheats', 20]], mishapRate: 0.1 },
    { id: 'sneak-in', called: 'the base fence', kind: 'allin', types: ['nerve', 'brains'], base: 30, pass: 0.5, loopCost: 10, opens: 600, closes: 1380,
      plate: 'base fence + hangar', label: 'All-In: sneak in',
      desc: "Around the secret base runs a high fence that buzzes, a field full of warning signs and soldiers walking the perimeter with searchlights. Both partners have to get from the road to the hangar door without being seen, crawling, hiding and timing every move between the sweeps of the lights. Being spotted, touching the fence or setting off an alarm gets them marched back out to the road to start again. Both partners reaching the hangar door unseen earns the next tip." },
    { id: 'artifact', called: 'the hangar', kind: 'allin', types: ['search', 'hands'], base: 30, pass: 0.5, loopCost: 12, opens: 600, closes: 1380,
      plate: 'hangar interior', label: 'All-In: the alien artifact',
      desc: "Inside the hangar, among crates, strange machines and things under sheets, is a glowing alien artifact, and both partners have to find it and carry it back out past the guards to the fence, where an agent in dark glasses is waiting. It is heavy, fragile and very hard to hold. A dropped artifact, a crack in it, or being caught on the way out means putting it back and trying again. The artifact handed over without a scratch earns the next tip." },
    { id: 'mat', kind: 'mat', plate: 'night desert Chill Zone', label: 'The Chill Zone' },
  ],
};
