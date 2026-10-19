// More of Don's narration between the scenes (one line each), for the bridges and the landings that still repeated
// after the volume pass (measured 2026-10-19). Slots come from the director: {team} {task} {prevTask} {flight}.
const don = say => ({ by: 'don', say });
const n = (id, line) => ({ id, turns: [don(line)] });

export default {
  'don-narrate.bridge': [
    n('nb2.1', "{team} reach {task}. Meanwhile, at {prevTask}, the back of the pack is having a very different day."),
    n('nb2.2', "And just like that, {team} are at {task}. Behind them, {prevTask} is still eating teams alive."),
    n('nb2.3', "{team} move on to {task}, while back at {prevTask}, things are getting messy. I love messy."),
    n('nb2.4', "Next stop for {team}: {task}. Last stop, for some of the teams still at {prevTask}? We'll see."),
    n('nb2.5', "While {team} race off to {task}, {prevTask} has a queue. A long, sweaty queue."),
    n('nb2.6', "{team} leave {prevTask} behind and head for {task}. Not everybody's that lucky."),
    n('nb2.7', "Out in front, {team} hit {task}. Way, way back at {prevTask}? Let's take a look. Ouch."),
    n('nb2.8', "{team} get to {task} looking good. The teams still at {prevTask} do not look good. Not at all."),
    n('nb2.9', "On to {task} for {team}. Back at {prevTask}, somebody's having a meltdown. Several somebodies."),
    n('nb2.10', "{team} make it to {task}, and the gap behind them is getting bigger by the minute."),
  ],
  'don-narrate.flight-landed': [
    n('nl2.1', "Flight number {flight} is on the ground, and the teams on it are already running."),
    n('nl2.2', "Here comes flight number {flight}. Those teams are behind, and they know it."),
    n('nl2.3', "Flight number {flight} has landed. Somebody's going to make up time. Somebody isn't."),
    n('nl2.4', "Wheels down for flight number {flight}. The race is back on for everyone on board."),
    n('nl2.5', "Flight number {flight} touches down. Time to see who slept on the plane, and who panicked."),
    n('nl2.6', "And flight number {flight} lands. Those teams are playing catch-up from the very first step."),
    n('nl2.7', "Flight number {flight} is here! Fashionably late. I respect that. The clock doesn't."),
    n('nl2.8', "Flight number {flight} lands, and every team on it sprints for the doors at once."),
    n('nl2.9', "Touchdown for flight number {flight}. The leaders are long gone. Good luck, everybody."),
    n('nl2.10', "Flight number {flight} has arrived, and the teams on it look like they need a coffee. Too bad."),
  ],
  'don-narrate.first-landed': [
    n('nf2.1', "Flight number one is down, and the race is on!"),
    n('nf2.2', "The first flight lands, and those teams are out of the airport before the bags are."),
    n('nf2.3', "Flight number one touches down. The early birds have landed. Now let's see them fly."),
    n('nf2.4', "First flight's on the ground! Cabs, maps and elbows. Go, go, go!"),
    n('nf2.5', "Flight number one has landed, and those teams have got a head start. Don't waste it."),
    n('nf2.6', "The first plane is down. Every team on it is racing for the exit, and for the lead."),
    n('nf2.7', "Wheels down for flight number one! The teams on it are already arguing about cabs."),
    n('nf2.8', "Flight number one lands. The best seats, the head start, and absolutely no excuses."),
  ],
};
