// The premiere (director.js, leg one): Don's welcome, every team introduced as it turns up, then his rules (the Home
// City openers). The show's rhythm (the user's premiere transcript, 2026-10-19): Don opens on a string of made-up facts
// about the city, then only labels each team ({relTag}: "best friends", "a married couple", "father and son"); the team
// sells itself to camera, one with an oddly specific detail, the other undercutting it, a punchline. A team with an
// identity is introduced by it (premiere-identities.js); a team without one by what the two of them are, here. In our
// own words. a and b are the team.
const don = say => ({ by: 'don', say });
const n = (id, ...lines) => ({ id, turns: lines.map(l => (typeof l === 'string' ? don(l) : l)) });
const say = (by, s) => ({ by, say: s });
const beat = s => ({ beat: s });
const r = (id, when, ...turns) => ({ id, when: { ...when, identity: null }, turns: turns.map(x => (typeof x === 'string' ? don(x) : x)) });
const g = (id, ...turns) => ({ id, turns: turns.map(x => (typeof x === 'string' ? don(x) : x)) });

export default {
  // Don opens the season, before anyone has arrived: the city, the show, himself
  'don-narrate.welcome': [
    n('nw.1', beat('Don stands on the steps of the old train station, the city tower behind him, and flashes the camera a perfect smile.'),
      "This is Home City! The oldest city in the world, if you don't check. Birthplace of the revolving door, and home of the angriest geese on the planet.",
      "Teams are arriving at this historic station to start a race around the world. I'm your host, Don, and this is the Ridonculous Race!"),
    n('nw.2', "Home City! Inventor of the traffic jam, holder of the world record for most umbrellas lost in one afternoon, and the city that named me its most handsome resident. I filled in the form myself.",
      "Teams of two are about to race around the world for one million dollars. I'm Don. Welcome to the Ridonculous Race!"),
    n('nw.3', beat('Don strolls along the station platform, pigeons scattering out of his way.'),
      "Welcome to Home City, where the tower is tall, the lake is cold, and the pigeons are, I'm told, protected by law.",
      "This is where the Ridonculous Race begins. Let's meet the teams who are about to regret signing up."),
    n('nw.4', "This is Home City. Home of the city tower, home of the world's largest doughnut, briefly, and home, today, of the start of a race around the world.",
      "I'm Don, and this is the Ridonculous Race! Here come our teams."),
  ],

  'team-intro.any': [
    // any team at all (a team nothing else fits)
    g('pr.g1', "{a} and {b}, {relTag}.",
      say('a', "We've trained for this every single day for a month."),
      say('b', "We walked to the shops and back. Twice."),
      say('a', "Briskly.")),
    g('pr.g2', "{a} and {b}. {relTag}.",
      say('b', "Nobody thinks we can win this."),
      say('a', "Our families think we'll be out first."),
      say('b', "We've printed that on a T-shirt. For motivation.")),
    g('pr.g3', "And {a} and {b}, {relTag}.",
      say('a', "I packed light."),
      say('b', "You packed four pillows."),
      say('a', "Light pillows.")),

    // a parent and their kid (aElder: a is the parent)
    r('pr.pc1', { rel: 'parent-child', aElder: true }, "{a} and {b}, {relTag}.",
      say('a', "We're more like best friends, really. I'm the fun one."),
      say('b', "You made us matching jackets."),
      say('a', "And you're wearing it! See? Fun.")),
    r('pr.pc2', { rel: 'parent-child', aElder: false }, "{a} and {b}, {relTag}.",
      say('a', "I'm doing this so my parent finally gets out of the house."),
      say('b', "I get out of the house."),
      say('a', "The garden doesn't count.")),
    // siblings
    r('pr.sb1', { rel: 'siblings' }, "{a} and {b}, {relTag}.",
      say('a', "I'm the older one, so I'm in charge."),
      say('b', "By four minutes."),
      say('a', "Four very important minutes.")),
    r('pr.sb2', { rel: 'siblings' }, "{a} and {b}. {relTag}, and, judging by the elbows, still fighting over the front seat.",
      say('b', "We've shared a room, a bike and a goldfish."),
      say('a', "The goldfish liked me better."),
      say('b', "The goldfish didn't know who you were.")),
    // cousins
    r('pr.cs1', { rel: 'cousins' }, "{a} and {b}, {relTag}.",
      say('a', "Every family wedding, we're the two who end up in the fountain."),
      say('b', "Every wedding."),
      say('a', "This race is the biggest fountain yet.")),
    r('pr.cs2', { rel: 'cousins' }, "{a} and {b}, {relTag}. The family sent them. I think to get rid of them.",
      say('b', "We won the family coin toss."),
      say('a', "It was best of nine. It got ugly. Grandma bit somebody.")),
    // a grandparent and grandchild (aElder: a is the grandparent)
    r('pr.gg1', { rel: 'grandparent-grandchild', aElder: true }, "{a} and {b}, {relTag}.",
      say('a', "I've been waiting eighty years for an adventure like this."),
      say('b', "You did a parachute jump on your birthday."),
      say('a', "That was a warm-up.")),
    r('pr.gg2', { rel: 'grandparent-grandchild', aElder: false }, "{a} and {b}, {relTag}. One of them is very fast. It isn't the young one.",
      say('a', "I thought I'd have to help my grandparent up the stairs."),
      say('b', "I lapped you on the stairs this morning."),
      say('a', "Twice. Don't put that on television.")),
    // married
    r('pr.mr1', { rel: 'married' }, "{a} and {b}, {relTag}.",
      say('a', "Twenty years of marriage. We can read each other's minds."),
      say('b', "What am I thinking right now?"),
      say('a', "...Lunch?"),
      say('b', "It's always lunch.")),
    r('pr.mr2', { rel: 'married' }, "{a} and {b}, {relTag}. Still married. For now.",
      say('b', "We've never once argued on holiday."),
      say('a', "That's because we've never been on holiday."),
      say('b', "And look how well it's gone.")),
    // dating
    r('pr.dt1', { rel: 'dating' }, beat('{a} and {b} walk in holding hands so tightly their fingers have gone white.'),
      "{a} and {b}, {relTag}. A very, very happy couple. You can let go now.",
      say('a', "We've been together three months, one week and four days."),
      say('b', "And nine hours.")),
    r('pr.dt2', { rel: 'dating' }, "{a} and {b}, {relTag}.",
      say('b', "We met in a lift that got stuck for six hours."),
      say('a', "Best six hours of my life."),
      say('b', "I was mostly hungry, but yes. Best six hours.")),
    // newly dating
    r('pr.nd1', { rel: 'newly-dating' }, "{a} and {b}, {relTag}. Very new. How new?",
      say('a', "Two weeks."),
      say('b', "We haven't had our first fight yet."),
      say('a', "We're saving it for somewhere scenic.")),
    r('pr.nd2', { rel: 'newly-dating' }, "{a} and {b}, {relTag}.",
      say('b', "I don't even know their middle name yet."),
      say('a', "I don't have a middle name."),
      say('b', "See? Already learning.")),
    // on and off
    r('pr.oo1', { rel: 'on-off' }, "{a} and {b}. {relTag}. Which one is it today?",
      say('a', "On."),
      say('b', "Off."),
      say('a', "We'll let you know at lunch.")),
    r('pr.oo2', { rel: 'on-off' }, "{a} and {b}, {relTag}. Currently, I'm told, on.",
      say('b', "We've broken up eleven times."),
      say('a', "Twelve. You forgot the airport."),
      say('b', "The airport was a misunderstanding.")),
    // exes
    r('pr.ex1', { rel: 'exes' }, beat('{a} and {b} get out of two different taxis and pretend not to see each other.'),
      "{a} and {b}. {relTag}. Together. On purpose. Somebody explain that to me later.",
      say('a', "It's strictly business."),
      say('b', "The business of beating everybody else and then never speaking again.")),
    r('pr.ex2', { rel: 'exes' }, "{a} and {b}, {relTag}.",
      say('b', "We were a terrible couple."),
      say('a', "But a great team."),
      say('b', "We'll find out which one we are on a plane.")),
    // once engaged
    r('pr.eg1', { rel: 'once-engaged' }, "{a} and {b}, {relTag}. There was a wedding planned. There was no wedding.",
      say('a', "We're still friends."),
      say('b', "We still share a dog."),
      say('a', "The dog prefers me. The dog was there.")),
    r('pr.eg2', { rel: 'once-engaged' }, "{a} and {b}, {relTag}.",
      say('b', "We had the cake. We had the band."),
      say('a', "We just didn't have the wedding."),
      say('b', "The cake was lovely. We ate it in the car park.")),
    // best friends
    r('pr.bf1', { rel: 'bffs' }, "{a} and {b}, {relTag}.",
      say('a', "We've been best friends since we were five."),
      say('b', "We've never had a single fight."),
      say('a', "Except about the sandwich."),
      say('b', "We don't talk about the sandwich.")),
    r('pr.bf2', { rel: 'bffs' }, beat('{a} and {b} do a handshake that has eleven separate parts and takes nearly a minute.'),
      "{a} and {b}, {relTag}. Is it done? Is the handshake done?",
      say('b', "There's a twelfth bit. It's still in development.")),
    // coworkers
    r('pr.cw1', { rel: 'coworkers' }, "{a} and {b}, {relTag}. They sit next to each other forty hours a week. Now they get all the other hours too.",
      say('a', "We're a great team at work."),
      say('b', "We once fixed the printer together."),
      say('a', "Nobody else has ever fixed the printer.")),
    r('pr.cw2', { rel: 'coworkers' }, "{a} and {b}, {relTag}.",
      say('b', "We've never seen each other outside the office."),
      say('a', "You look shorter."),
      say('b', "You look exactly the same. That's worse.")),
    // roommates
    r('pr.rm1', { rel: 'roommates' }, "{a} and {b}, {relTag}.",
      say('a', "We've lived together three years."),
      say('b', "And I've done the dishes for all three of them."),
      say('a', "You enjoy the dishes. I've seen you.")),
    r('pr.rm2', { rel: 'roommates' }, "{a} and {b}, {relTag}. They share a flat, a fridge, and a deep suspicion about who ate the cheese.",
      say('b', "It was you."),
      say('a', "It was the cat."),
      say('b', "We don't have a cat.")),
    // rivals
    r('pr.rv1', { rel: 'rivals' }, "{a} and {b}, {relTag}. Rivals, on the same team. I've already made popcorn.",
      say('a', "I've beaten them at everything since school."),
      say('b', "Name one thing."),
      say('a', "Being on time for this.")),
    r('pr.rv2', { rel: 'rivals' }, beat('{a} and {b} shake hands, and neither of them will let go first.'),
      "{a} and {b}, {relTag}. You can stop now. Somebody stop.",
      say('b', "I'll let go when they let go.")),
    // enemies
    r('pr.en1', { rel: 'enemies' }, "{a} and {b}, {relTag}. Their families made them come. It's for their own good, apparently.",
      say('a', "Our mothers lost a bet to each other. This is the punishment."),
      say('b', "Their punishment. We're just the delivery."),
      say('a', "Finally. Something we agree on.")),
    r('pr.en2', { rel: 'enemies' }, "{a} and {b}, {relTag}.",
      say('b', "We hate each other."),
      say('a', "Deeply."),
      say('b', "But we hate losing more.")),
    // reality-show vets
    r('pr.vt1', { rel: 'reality-vets' }, "{a} and {b}. {relTag}. We've all seen them before. Some of us more than we'd like.",
      say('a', "We've been on so many shows we've lost count."),
      say('b', "Nine."),
      say('a', "They count. I don't count. It's healthier.")),
    r('pr.vt2', { rel: 'reality-vets' }, "{a} and {b}, {relTag}. Back for more. Always back for more.",
      say('b', "We know where every camera is."),
      say('a', "That one. And that one. And the one in the plant."),
      "...There's a camera in the plant?"),
  ],
};
