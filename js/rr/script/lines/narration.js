// Don narrating the episode (story/director.js narrate), the way the real show does it (episode 3, the user's goal
// transcript): the departure order, the flights, a bridge between the leaders and the rest, the bottom of the leg.
// Slots: {winners} ("the Podcasters, Cameron and Riya"), {count} (a number in words), {gap} ("an hour and a half"),
// {flight} ("two"), {team} ("the Goths"), {task} and {prevTask} ("the spice corner", "the restaurant").
const don = (...lines) => ({ turns: lines.map(say => ({ by: 'don', say })) });
const ids = (prefix, list) => list.map((e, i) => ({ id: `${prefix}.${i + 1}`, ...e }));

export default {
  'don-narrate.depart': ids('nd', [
    don("Yesterday's Chill Zone is today's starting line. Teams leave in the order they arrived, starting with yesterday's winners, {winners}."),
    don("Last leg's finish line is this leg's starting line. Teams head out in the order they came in, which means {winners} are first out the door.", "Everybody else gets to watch them leave. Motivating."),
    don("The Chill Zone is now a starting line. That's called recycling.", "Teams leave in the order they finished, led by {winners}."),
  ]),
  'don-narrate.flight-wait': ids('nw', [
    don("{count} teams wait at the airport for flight number two, which doesn't leave for {gap}. The first flight is already in the air, and it's not waiting for anybody."),
    don("Flight number one is gone, and {count} teams are stuck at the gate for flight number two, which leaves in {gap}.", "I'd be nervous. I'm not, because I'm not in the race."),
    don("The first flight is up, up and away. The next one leaves in {gap}, so {count} teams get to sit at the gate and think about their choices."),
  ]),
  'don-narrate.first-landed': ids('nf', [
    don("Flight number one has landed, and the race for first place is on."),
    don("Flight number one is on the ground, and those teams take off like they stole something."),
    don("The first flight touches down. Doors open, teams out, and it's a stampede."),
  ]),
  'don-narrate.flight-landed': ids('nl', [
    don("This just in: flight number {flight} has landed."),
    don("Flight number {flight} touches down, and those teams have a lot of catching up to do."),
    don("And there's flight number {flight}. Better late than never. Well, better early, but this'll do."),
  ]),
  'don-narrate.bridge': ids('nb', [
    don("As {team} reach {task}, the teams at the back are still stuck at {prevTask}."),
    don("Up front, {team} have already made it to {task}. Back at {prevTask}, not everybody is having a good time."),
    don("On to {task} go {team}, while the stragglers are still at {prevTask}, getting a lot of screen time for all the wrong reasons."),
    don("While {team} head into {task}, some teams haven't even finished at {prevTask}. See what I did there? No? Fine."),
  ]),
  'don-narrate.last-stretch': ids('ns', [
    don("Most of the teams are safe at the Chill Zone, but the last {count} are battling to not come in last."),
    don("{count} teams are still out there, and one of them is going home.", "Not that I'm counting. I'm totally counting."),
    don("Down to the last {count} teams, and one of them is about to take a very long walk."),
  ]),
};
