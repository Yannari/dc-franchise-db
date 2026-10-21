// ══════════════════════════════════════════════════════════════════════
// ci/lines/pair-entry.js — two people, one profile: in together, out together
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-21: "dual profiles suppose to enter together and the person
// suppose to acknowledge theyre two i only see 1 person the goodbye dialogue and
// video too". A shared profile walked in and left as one voice. Now both of them
// speak when they move in and on their goodbye video, and the room, once the
// video plays, says out loud that it was two people.
//   profile.pair            day one, an honest pair: they introduce each other
//   profile.pair.catfish    day one, a pair behind a persona
//   arrival.pair            a pair walking in mid-season
//   goodbye.video.pair      the video, an honest pair with no relationship lines of its own
//   goodbye.video.catfish.pair  the video, a pair behind a persona
//   goodbye.react.pair      the room, finding out it was two people
// face and brain are the two of them ({a.face}, {a.brain}); {a} is the profile.
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });
const T = (...turns) => ({ turns: turns.map(([by, k, text]) => ({ by, [k]: text })) });
const B = (entry, beat) => ({ ...entry, beat });
const S = (entry, stage) => ({ ...entry, stage });

export const PAIR_ENTRY = {
  ...E('profile.pair', [
    S(T(['face', 'say', "Hi! I'm {a.face}."], ['brain', 'say', "And I'm {a.brain}. We're playing this whole thing together."], ['face', 'say', "One profile, two of us. Nobody gets to know that part."]),
      '{a.face} and {a.brain} squeeze through the apartment door at the same time.'),
    T(['brain', 'say', "Okay, introductions. I'm {a.brain}."], ['face', 'say', "I'm {a.face}, and I'm the face. Obviously."], ['brain', 'say', "I'm the one who keeps the face out of trouble."]),
    S(T(['face', 'say', "We're in! I'm {a.face}, this is {a.brain}."], ['brain', 'say', "Two people, one profile. The room is going to think we're one person."], ['face', 'say', "So we never, ever say 'we'."]),
      'Two people drop their bags in the doorway and look around the apartment.'),
    T(['brain', 'say', "Hi Circle. I'm {a.brain}, and this is {a.face}."], ['face', 'say', "We came in as a team. Every message goes past both of us."], ['brain', 'say', "Which means every message is going to be an argument."]),
    B(T(['face', 'say', "Hey! I'm {a.face}."], ['brain', 'say', "I'm {a.brain}. We share a profile, a couch and, apparently, one blanket."], ['face', 'say', "We'll work it out."]),
      '{a.brain} tosses a pillow at {a.face} before the door has even closed.'),
    T(['face', 'say', "I'm {a.face}. That's {a.brain}."], ['brain', 'say', "Hi. Two of us, one name on the screen."], ['face', 'say', "If one of us slips, the other one covers. That's the deal."]),
    T(['brain', 'say', "So it's me, {a.brain}..."], ['face', 'say', "...and me, {a.face}. Together we're one player."], ['brain', 'say', "Half the work each. Twice the drama."]),
    S(T(['face', 'say', "Okay, this place is nice. I'm {a.face}, by the way."], ['brain', 'say', "And I'm {a.brain}. We're going to pick a picture now and fight about it."]),
      '{a.face} and {a.brain} walk in together, already arguing over who gets the good side of the couch.'),
  ]),
  ...E('profile.pair.catfish', [
    S(T(['face', 'say', "I'm {a.face}."], ['brain', 'say', "I'm {a.brain}. And in here, the two of us are {a}."], ['face', 'say', "Nobody can know about either of us. Not one thing."]),
      '{a.face} and {a.brain} slip into the apartment together and close the door fast.'),
    T(['brain', 'say', "Hi, I'm {a.brain}, and this is {a.face}."], ['face', 'say', "And as far as the room is concerned, neither of us exists. Meet {a}."], ['brain', 'say', "Two people, one fake profile. What could go wrong?"]),
    T(['face', 'say', "So, I'm {a.face}..."], ['brain', 'say', "...and I'm {a.brain}, and we're playing as {a}."], ['face', 'say', "We studied {a} like a test. Age, job, everything."]),
    B(T(['brain', 'say', "Okay. I'm {a.brain}. That's {a.face}."], ['face', 'say', "We came in together, and we're playing as somebody else together. Hi, {a}."], ['brain', 'say', "If we get caught, we get caught twice."]),
      'Two people sit down in front of the screen and set up a profile that belongs to neither of them.'),
    T(['face', 'say', "Hi, Circle. I'm {a.face}."], ['brain', 'say', "I'm {a.brain}. We're a team, and our team is called {a}."], ['face', 'say', "Keep the story straight and we're fine."]),
  ]),
  ...E('arrival.pair', [
    S(T(['face', 'say', "Okay, we're in. I'm {a.face}."], ['brain', 'say', "And I'm {a.brain}. Everybody's had a head start, so we're going to have to be fast."]),
      '{a.face} and {a.brain} walk into the apartment side by side.'),
    T(['brain', 'say', "Hi! I'm {a.brain}, this is {a.face}."], ['face', 'say', "They have no idea there's two of us coming."], ['brain', 'say', "Let's keep it that way."]),
    B(T(['face', 'say', "New players! Two of them! Hi, I'm {a.face}."], ['brain', 'say', "I'm {a.brain}. The room is going to see one new face. They get two of us."]),
      '{a.brain} is already reading the Circle Chat over {a.face}\'s shoulder.'),
    T(['brain', 'say', "I'm {a.brain}."], ['face', 'say', "I'm {a.face}. We're the new profile, both of us."], ['brain', 'say', "Everybody in here already has friends. We just have each other."]),
    T(['face', 'say', "Hi Circle! It's {a.face}..."], ['brain', 'say', "...and {a.brain}. One profile. Two people who are going to win."]),
  ]),
  ...E('goodbye.video.pair', [
    B(T(['face', 'video', "Hi, Circle! I'm {a.face}."], ['brain', 'video', "And I'm {a.brain}. Surprise, there were two of us the whole time."], ['face', 'video', "Every message you got, we argued about first. We loved it anyway. Good luck!"]),
      'Two faces crowd into one camera frame.'),
    T(['brain', 'video', "Hey everybody. I'm {a.brain}..."], ['face', 'video', "...and I'm {a.face}. You've been talking to both of us."], ['brain', 'video', "We never said 'we' once. You're welcome."]),
    T(['face', 'video', "So, it was two of us. I'm {a.face}."], ['brain', 'video', "I'm {a.brain}. We did everything together in here, even get blocked."], ['face', 'video', "Good luck, everybody. From both of us."]),
    B(T(['brain', 'video', "Hi! It's {a.brain} and {a.face}."], ['face', 'video', "Yes, {a} was two people. We know. We're sorry. Kind of."], ['brain', 'video', "Go win this for us."]),
      '{a.face} waves into the camera; {a.brain} waves a second later.'),
    T(['face', 'video', "Circle, meet the real {a}. Both of us."], ['brain', 'video', "I'm {a.brain}, that's {a.face}. We had the best time."], ['face', 'video', "Be nice to each other. Bye!"]),
  ]),
  ...E('goodbye.video.catfish.pair', [
    B(T(['face', 'video', "Hi, Circle. Time to tell the truth. I'm {a.face}."], ['brain', 'video', "And I'm {a.brain}. {a} was us. Both of us, and neither of us."], ['face', 'video', "Everything we said about the game, we meant. Good luck."]),
      'Two people sit close together on the couch, facing the camera.'),
    T(['brain', 'video', "Surprise. There's no {a}."], ['face', 'video', "There's me, {a.face}, and there's {a.brain}. We played {a} together."], ['brain', 'video', "We're sorry about the pictures. Not about the friendships."]),
    T(['face', 'video', "Hey everybody. My name is {a.face}."], ['brain', 'video', "I'm {a.brain}. We built {a} together, and we played every message as a team."], ['face', 'video', "It got us further than either of us thought. Good luck."]),
    B(T(['brain', 'video', "So {a} doesn't exist. Hi. I'm {a.brain}."], ['face', 'video', "And I'm {a.face}. Two people, one fake profile."], ['brain', 'video', "Go easy on us at the finale."]),
      '{a.brain} takes a deep breath; {a.face} squeezes {a.brain}\'s hand.'),
    T(['face', 'video', "Circle, we owe you the truth. I'm {a.face}, and this is {a.brain}."], ['brain', 'video', "We played as {a}. It was a strategy, and it was the two of us the whole way."], ['face', 'video', "No regrets. Good luck, everybody."]),
  ]),
  ...E('goodbye.react.pair', [
    T(['a', 'react', "Two people?! {b} was two people the whole time?"]),
    T(['a', 'react', "Wait. Wait. {b.real}. Both of them. I was talking to two people!"]),
    B(T(['a', 'react', "No way. There were two of them behind {b}. That explains so much."]), '{a} points at the screen and looks around the empty apartment.'),
    T(['a', 'react', "I've been telling my secrets to two people. Two!"]),
    T(['a', 'react', "That's why {b} took so long to answer. They were arguing about it!"]),
    T(['a', 'react', "{b} was a team? I did not see that coming. At all."]),
    T(['a', 'react', "Two of them! Okay. Now I need to know which one I was talking to."]),
    B(T(['a', 'react', "Hold on. {b.real}? Both of them, on one profile?"]), '{a} stands up and sits right back down.'),
    T(['a', 'react', "So every message from {b} came from two people. That's genius. I hate it."]),
    T(['a', 'react', "There's TWO of them. I'm rereading every chat in my head right now."]),
  ]),
};
