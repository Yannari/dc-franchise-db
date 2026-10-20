// Snow Peaks (LEGS.txt 33-SNOW-PEAKS), the World Tour's alpine leg as the frames show it: a cable car up the mountain;
// both partners grind a pile of meat into one giant sausage and ride it down the snow slope like a sled, round the
// mountain goats (All-In); then the partner who didn't do the last Botch or Watch slap-dances on dance pads that give a
// small shock for every wrong step (Botch or Watch); the Chill Zone at the bottom of the slope.
export default {
  id: 'snow-peaks', name: 'Snow Peaks', recap: 'sledding down a mountain on a giant sausage and slap-dancing on shocking pads',
  region: 'old-coast', map: { x: 51, y: 30 },
  arrive: 'airport', local: ['cable-car', 'foot'],
  stretches: [
    { id: 'cable-car', kind: 'travel', mode: 'cable-car', base: 30, cost: 15, plate: 'cable car over the peaks', label: 'Cable car up the mountain',
      mishaps: [['cable-car-stops', 20]], mishapRate: 0.1 },
    { id: 'sausage', called: 'the snow slope', kind: 'allin', types: ['hands', 'nerve'], base: 30, pass: 0.5, loopCost: 12, opens: 480, closes: 1080,
      plate: 'snow slope', label: 'All-In: the giant sausage',
      desc: "In a hut at the top of the slope, a mountain of meat waits beside a hand-cranked grinder. Both partners crank the meat through into one sausage skin until it's long enough for both of them to sit on, tie it off, and then ride it down the snow slope like a sled, steering round the mountain goats on the way. A sausage that splits, a crash into a goat or a fall off the back means climbing back up and grinding a new one. Both partners crossing the bottom line on their sausage earns the next tip." },
    { id: 'slap-dance', called: 'the dance pads', kind: 'botch', types: ['perform', 'nerve'], base: 20, pass: 0.45, loopCost: 6,
      teaser: 'Who has rhythm?', plate: 'dance pads on the snow', label: 'Botch or Watch: the slap dance',
      desc: "On a stage in the snow sit two light-up dance pads, and the partner who didn't do the last Botch or Watch steps onto one in lederhosen. The music starts, arrows flash on a screen, and they have to stamp the pads and slap their thighs and shoes to the beat of the mountain's traditional slap dance. Every wrong step gives a small electric buzz, and three misses in one song means starting the song again. The other partner can only watch. A whole song with fewer than three misses earns the next tip." },
    { id: 'mat', kind: 'mat', plate: 'slope finish banner', label: 'The Chill Zone' },
  ],
};
