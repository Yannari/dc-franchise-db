// The premiere's second beat for a team that races as an identity (director.js, after its introduction): what the two
// of them are to each other, in an interview, the way the show's first morning shows a mother managing her daughter, a
// sister keeping the other one focused, two stepbrothers who were made to come. By relationship; aElder says which of
// a parent-child or grandparent-grandchild team is the elder. In our own words. a and b are the team.
const conf = (by, s) => ({ by, conf: s });
const d = (id, when, ...turns) => ({ id, when, turns });

export default {
  'team-dynamic.any': [
    // any team
    d('pd.g1', undefined, conf('a', "We know each other really well. Maybe too well."), conf('b', "We're about to find out which one it is."), conf('a', "Probably too well.")),
    d('pd.g2', undefined, conf('b', "We've never spent this much time together."), conf('a', "We've also never had a million dollars on the line."), conf('b', "Both of those are going to be interesting.")),
    // a parent and their kid
    d('pd.pc1', { rel: 'parent-child', aElder: true }, conf('a', "I just want us to have a nice time together."), conf('b', "I just want to win."), conf('a', "We can do both! We can do both, can't we?")),
    d('pd.pc2', { rel: 'parent-child', aElder: false }, conf('a', "My parent signed us up without asking me."), conf('b', "You'd have said no."), conf('a', "Exactly.")),
    // siblings
    d('pd.sb1', { rel: 'siblings' }, conf('a', "I'm the sensible one. I've always been the sensible one."), conf('b', "That's what the boring one always says."), conf('a', "Somebody has to keep you alive.")),
    d('pd.sb2', { rel: 'siblings' }, conf('b', "We fought every day growing up."), conf('a', "We still fight every day."), conf('b', "But now we fight on the same side. Mostly.")),
    // cousins
    d('pd.cs1', { rel: 'cousins' }, conf('a', "We only see each other at weddings and funerals."), conf('b', "This is much more fun than both of those."), conf('a', "So far.")),
    d('pd.cs2', { rel: 'cousins' }, conf('b', "We were always the troublemakers at family parties."), conf('a', "Now we get to cause trouble all around the world."), conf('b', "Grandma's going to be so proud. Or so embarrassed.")),
    // a grandparent and grandchild
    d('pd.gg1', { rel: 'grandparent-grandchild', aElder: true }, conf('a', "Everybody thinks I'm going to slow this one down."), conf('b', "You beat me up the stairs this morning."), conf('a', "And I'll do it again.")),
    d('pd.gg2', { rel: 'grandparent-grandchild', aElder: false }, conf('a', "My grandparent is the toughest person I know."), conf('b', "And the oldest. Don't forget the oldest."), conf('a', "I wasn't going to say it.")),
    // married
    d('pd.mr1', { rel: 'married' }, conf('a', "We've been married a long time. We have a system."), conf('b', "The system is I do it and you watch."), conf('a', "That's a very good system.")),
    d('pd.mr2', { rel: 'married' }, conf('b', "We've never once got lost on a holiday."), conf('a', "That's because you never let me hold the map."), conf('b', "And look how well that's worked out.")),
    // dating
    d('pd.dt1', { rel: 'dating' }, conf('a', "We're so in love. It's going to be our secret weapon."), conf('b', "Or our biggest weakness."), conf('a', "Why would you say that on camera?")),
    d('pd.dt2', { rel: 'dating' }, conf('b', "We've been together a few months. This is a big test."), conf('a', "A big, round-the-world test."), conf('b', "No pressure.")),
    // newly dating
    d('pd.nd1', { rel: 'newly-dating' }, conf('a', "We've only been dating a couple of weeks."), conf('b', "Two and a half."), conf('a', "Is a race around the world a normal third date? I don't think it is.")),
    d('pd.nd2', { rel: 'newly-dating' }, conf('b', "I still get nervous around them. Is that bad?"), conf('a', "I think it's cute."), conf('b', "You're not supposed to hear these.")),
    // on and off
    d('pd.oo1', { rel: 'on-off' }, conf('a', "We're on. Right now we're on."), conf('b', "For now."), conf('a', "See? That's the attitude that keeps breaking us up.")),
    d('pd.oo2', { rel: 'on-off' }, conf('b', "Every time we break up, we get back together stronger."), conf('a', "And every time we get back together, we break up louder."), conf('b', "It's a cycle. A very loud cycle.")),
    // exes
    d('pd.ex1', { rel: 'exes' }, conf('a', "We broke up last year. It was mutual."), conf('b', "It was not mutual."), conf('a', "It was mostly mutual.")),
    d('pd.ex2', { rel: 'exes' }, conf('b', "We were terrible at dating, but we were always a good team."), conf('a', "Speak for yourself."), conf('b', "See? Already a team. Already arguing.")),
    // once engaged
    d('pd.eg1', { rel: 'once-engaged' }, conf('a', "We were going to get married."), conf('b', "We're not going to talk about it."), conf('a', "We're not going to talk about it.")),
    d('pd.eg2', { rel: 'once-engaged' }, conf('b', "Calling off the wedding was the right thing to do."), conf('a', "We still split the cake. Very fairly."), conf('b', "This race is the honeymoon we never had. Without the honey. Or the moon.")),
    // best friends
    d('pd.bf1', { rel: 'bffs' }, conf('a', "My best friend knows everything about me."), conf('b', "Everything."), conf('a', "Well. Nearly everything.")),
    d('pd.bf2', { rel: 'bffs' }, conf('b', "We've been best friends since we were six."), conf('a', "We've had one fight. About a sandwich."), conf('b', "It was my sandwich.")),
    // coworkers
    d('pd.cw1', { rel: 'coworkers' }, conf('a', "At work, we're a great team. I hope that carries over."), conf('b', "At work, I can close my office door."), conf('a', "We don't have doors. We have cubicles.")),
    d('pd.cw2', { rel: 'coworkers' }, conf('b', "We get on great. For nine hours a day."), conf('a', "We've never tested the other fifteen."), conf('b', "We're about to.")),
    // roommates
    d('pd.rm1', { rel: 'roommates' }, conf('a', "We share everything. Rent, food, the bathroom."), conf('b', "The bathroom is a problem."), conf('a', "The bathroom has always been a problem.")),
    d('pd.rm2', { rel: 'roommates' }, conf('b', "Living together is easy. It's the dishes that kill you."), conf('a', "There are no dishes on a race."), conf('b', "There will be something. There's always something.")),
    // rivals
    d('pd.rv1', { rel: 'rivals' }, conf('a', "We've been competing with each other for years."), conf('b', "And I've won most of the time."), conf('a', "That is a lie, and the scoreboard at home proves it.")),
    d('pd.rv2', { rel: 'rivals' }, conf('b', "Teaming up with my biggest rival? It's either genius or a disaster."), conf('a', "Genius. Obviously."), conf('b', "You would say that.")),
    // enemies
    d('pd.en1', { rel: 'enemies' }, conf('a', "We don't like each other. At all."), conf('b', "Finally, something we agree on."), conf('a', "Don't get used to it.")),
    d('pd.en2', { rel: 'enemies' }, conf('b', "Our families think this race will make us friends."), conf('a', "Our families are wrong about a lot of things."), conf('b', "That's the second thing we agree on. This is getting worrying.")),
    // reality-show vets
    d('pd.vt1', { rel: 'reality-vets' }, conf('a', "We've both been on TV before. We know the drill."), conf('b', "We know where the cameras are, and we know when to cry."), conf('a', "Not that we'd ever cry on purpose.")),
    d('pd.vt2', { rel: 'reality-vets' }, conf('b', "People already know who we are. That's a target on our backs."), conf('a', "It's also a lot of fans."), conf('b', "Fans don't help you up a tower.")),
  ],
};
