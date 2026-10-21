// Glass Tower Gulf (LEGS.txt 10-GLASS-TOWER-GULF), 1:1 with the real show's "Hello and Dubai": an Either/Or at the
// sail-shaped glass hotel, wash a whole column of its windows from a platform hanging off the side (Squeegee), or return
// a serve from the toughest tennis launcher in the world on the rooftop court (Serve); a taxi to the gold market and the
// Chill Zone.
export default {
  id: 'glass-tower-gulf', name: 'Glass Tower Gulf', recap: 'washing a skyscraper from the outside and losing at tennis to a machine',
  region: 'desert', map: { x: 63, y: 42 },
  arrive: 'airport', local: ['taxi', 'foot'],
  stretches: [
    { id: 'tower-taxi', kind: 'travel', mode: 'taxi', base: 35, cost: 30, plate: 'desert highway, skyline', label: 'Taxi to the glass tower',
      mishaps: [['sandstorm', 20]], mishapRate: 0.08 },
    { id: 'squeegee-serve', called: 'the glass tower', kind: 'either', opens: 480, closes: 1260, plate: 'window platform + rooftop court', label: 'Squeegee or Serve',
      desc: "At the sail-shaped glass tower, a Don Box offers two ways to the next tip. Squeegee means riding a window-cleaning platform down the outside of the tower and washing an entire column of windows until every pane shines, while it sways in the wind hundreds of metres up. Serve means stepping onto the rooftop tennis court and returning a ball fired by the toughest tennis launcher in the world, inside the lines. A streaky window gets a second wash and a ball that goes out gets another serve, and teams may switch. A clean column or a winning return earns the next tip.",
      sides: [
        // harnessed in at the roof's edge (won't step over); the platform drops, swaying; the wash (streaks: wash it again);
        // pane after pane down the whole column; back up on the roof for the tip
        { id: 'squeegee', label: 'Squeegee', types: ['heights', 'patience'], base: 40, pass: 0.7, loopCost: 10,
          stages: [{ id: 'harness-up', share: 0.4, risk: 0.3 }, { id: 'the-drop', share: 0.5, risk: 0.3 }, { id: 'wash', share: 1.5, risk: 1 },
            { id: 'the-column', share: 0.8, risk: 0.5 }, { id: 'squeegee-tip', share: 0.3, risk: 0 }] },
        // a racket each on the rooftop court; the launcher's serve (an ace, untouched); the return (out); the tip
        { id: 'serve', label: 'Serve', types: ['hands', 'nerve'], base: 15, pass: 0.4, loopCost: 6,
          stages: [{ id: 'racket-up', share: 0.3, risk: 0 }, { id: 'the-serve', share: 1, risk: 1 }, { id: 'the-return', share: 0.6, risk: 0.8 },
            { id: 'serve-tip', share: 0.3, risk: 0 }] },
      ] },
    { id: 'market-taxi', kind: 'travel', mode: 'taxi', base: 25, cost: 20, plate: 'gold market street', label: 'Taxi to the gold market',
      mishaps: [['wrong-market', 20]], mishapRate: 0.1 },
    { id: 'mat', kind: 'mat', plate: 'gold market facade', label: 'The Chill Zone' },
  ],
};
