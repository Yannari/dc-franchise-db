// Rock North (LEGS.txt 12-ROCK-NORTH), 1:1 with the real show's "I Love Ridonc & Roll": a cab to the spa resort; ten
// minutes in a sauna at its highest heat, fully clothed, two teams to a sauna (the Goths' makeup melted, somebody poured
// a bucket over themselves that turned out to be sweat); across the half-frozen river to the Don Box (one partner rode
// across on the other); a cab downtown; Botch or Watch, air guitar in front of a crowd until the appeal meter fills (stage
// fright, a fan who called a goth preppy, a performance that ended with a lighter); the Chill Zone backstage.
export default {
  id: 'rock-north', name: 'Rock North', recap: 'sweating it out in a sauna, swimming a frozen river and rocking out on air guitar',
  region: 'north', map: { x: 54, y: 14 },
  arrive: 'airport', local: ['taxi', 'foot'],
  stretches: [
    { id: 'spa-cab', kind: 'travel', mode: 'taxi', base: 30, cost: 30, plate: 'snowy road, cabs', label: 'Cab to the spa' },
    // (two huts, two teams each, 2026-10-22: a team sits in its own hut, with the team on that hut's other bench or
    // alone; `roomStages` are the stages inside it, where only the teams of one hut meet)
    { id: 'sauna', called: 'the sauna', kind: 'allin', types: ['patience'], base: 14, pass: 0.65, loopCost: 10, capacity: 4, rooms: 2,
      roomStages: ['the-heat', 'the-melt'], opens: 420, closes: 1320,
      plate: 'sauna hut, sauna interior', label: 'All-In: sweat it out',
      // in at the hut door, coats on; the first minutes of the heat (someone steps out: the ten minutes start again); the
      // last minutes, melting (out again); the timer ringing
      stages: [{ id: 'sauna-door', share: 0.3, risk: 0 }, { id: 'the-heat', share: 1, risk: 0.6 }, { id: 'the-melt', share: 1, risk: 1 },
        { id: 'timer-rings', share: 0.2, risk: 0 }],
      desc: "At the spa, wooden sauna huts sit by the river, each big enough for two teams at once. Both partners must sit inside at the highest heat for ten full minutes, fully clothed, coats and all. Anyone who can't take it and steps out before the time is up sends the team back to the start of the ten minutes, and a team that arrives to find both benches full has to wait its turn outside in the snow. When the timer rings, the team runs straight for the river." },
    { id: 'ice-river', called: 'the river', kind: 'allin', types: ['water', 'nerve'], base: 15, pass: 0.7, loopCost: 10,
      plate: 'ice floes on the river', label: 'All-In: the frozen river',
      // steaming on the bank (won't step on); floe to floe (one tips: in the water, back to the near side); swimming the
      // last gap (too cold: back); the Don Box on the far bank
      stages: [{ id: 'river-bank', share: 0.3, risk: 0.2 }, { id: 'floe-hop', share: 1.2, risk: 1 }, { id: 'the-gap', share: 0.6, risk: 0.6 },
        { id: 'far-bank-box', share: 0.3, risk: 0 }],
      desc: "Straight out of the sauna, still steaming, both partners must cross the half-frozen river to the Don Box on the far bank, hopping from ice floe to ice floe or swimming the gaps in between. A floe that tips throws you into water so cold it takes your breath away, and a partner who goes in has to climb back out on the near side and start again. Both partners must reach the far bank to take the next tip." },
    { id: 'town-cab', kind: 'travel', mode: 'taxi', base: 25, cost: 20, plate: 'town street', label: 'Cab downtown' },
    { id: 'air-guitar', called: 'the concert', kind: 'botch', types: ['perform'], base: 12, pass: 0.45, loopCost: 6,
      teaser: 'Who wants to be a rock star?', plate: 'outdoor stage, crowd', label: 'Botch or Watch: air guitar',
      // nerves backstage (stage fright); the riff (boos); the meter nearly full (short: wait for the next song); the meter
      // tops out. a plays, b watches from the wings
      stages: [{ id: 'backstage', share: 0.4, risk: 0.3 }, { id: 'the-riff', share: 1, risk: 0.8 }, { id: 'the-meter', share: 0.6, risk: 1 },
        { id: 'encore', share: 0.3, risk: 0 }],
      desc: "On an outdoor stage in front of a real crowd of local rock fans, the partner who didn't do the last Botch or Watch must play air guitar to a blasting song. A giant appeal meter beside the stage rises with the crowd's cheers and falls with their boos, and a performance that doesn't fill it to the top means waiting for the next song and starting again. When the meter tops out, the team heads backstage to the Chill Zone." },
    { id: 'mat', kind: 'mat', plate: 'backstage room', label: 'The Chill Zone' },
  ],
};
