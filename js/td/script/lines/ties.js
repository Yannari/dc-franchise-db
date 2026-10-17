// ══════════════════════════════════════════════════════════════════════
// td/script/lines/ties.js — who came in attached: a couple, family, exes, somebody waiting at home
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-16: "do they actually acknowledge when they're in a relationship outside the game, when they're
// cheating on their partner in the game, or if their partner is in the game ... also enemies". The engine moments are
// camp-events.js (the WHO CAME IN ATTACHED block) and episode.js (the first day's arrivals); the ties are
// season-ties.js. {kinWord} is what {b} is to {a} ("girlfriend", "sister", "ex"); {home} is the partner at home and
// {homeWord} what they are ("boyfriend", "wife").
//
// tie.arrive.couple — day one: {a} and {b} walked in as a couple, and the camp finds out.
// tie.arrive.apart — day one: the couple was split across two teams; {a} to the camera about {b} over there.
// tie.arrive.home — day one: {a}, alone with the camera, about {home}, waiting at home.
// tie.home.<innocent|pointed> — {a} has somebody at home and is getting close to {c}; {b} says {home}'s name out loud.
//   'innocent': {b} just remembered; 'pointed': {b} means it to hurt.
// tie.guilt.<guilty|torn|shrug> — {a}, to the camera, about {home} and {b}: pulling back, not sure, or not sorry.
// tie.couple.<steady|strained|jealous|over|civil> — the couple who arrived together, later: still solid; the game
//   pulling at them; {a} has noticed {b} and {c}; broken up here and it's cold; broken up here and they're all right.
// tie.family.<protect|bicker> — family in the same camp: {a} looking out for {b}; the two of them at it like siblings.
// tie.exes.<snipe|thaw> — exes in the same camp: still sharp with each other; getting easier.
// Ids: 'ti.'.
const C = (id, ...lines) => ({ id, turns: lines.map(l => ({ by: 'a', conf: l })) });
const T = (id, when, turns) => ({ id, ...(when ? { when } : {}), turns });
const third = ending => ({ ending, third: true });

export default {
  'tie.arrive.couple': [
    T('ti.ac1', null, [
      { beat: "{a} and {b} are standing so close together that people start looking at them." },
      { by: 'b', say: "Should we just tell them?" },
      { by: 'a', say: "Fine. Everybody, this is {b}. My {kinWord}. We came here together." },
      { by: 'a', conf: "We were going to keep it quiet for a week. We lasted about an hour." },
    ]),
    T('ti.ac2', null, [
      { by: 'a', conf: "Yes, {b} is my {kinWord}. No, we didn't ask to be put together. Yes, everybody already knows." },
      { by: 'b', conf: "Being a couple in a game where people vote each other out is not the smartest thing we've ever done." },
    ]),
    T('ti.ac3', null, [
      { by: 'b', say: "You're doing the thing with your face." },
      { by: 'a', say: "What thing?" },
      { by: 'b', say: "The thing where everyone can tell we're together." },
      { by: 'a', conf: "{b} is my {kinWord}, and apparently I'm terrible at hiding it. We're going to have to work on that." },
    ]),
    T('ti.ac4', null, [
      { by: 'a', conf: "Coming in with my {kinWord} is the best thing and the worst thing about being here." },
      { by: 'a', conf: "The best thing is I've got somebody I trust completely. The worst thing is everybody else knows that too." },
    ]),
    T('ti.ac5', null, [
      { beat: "{b} sits down next to {a} and leans on {a.posAdj} shoulder without thinking about it." },
      { by: 'a', say: "We said we'd be subtle." },
      { by: 'b', say: "This is subtle. You should see me when I'm not trying." },
      { by: 'b', conf: "{a} is my {kinWord}. If people want to come after us for that, let them try." },
    ]),
    T('ti.ac6', null, [
      { by: 'a', conf: "Me and {b} have a deal. Out here, we're two players. We don't save each other, we don't fight for each other." },
      { by: 'b', conf: "We have that deal, and neither of us believes it for a second." },
    ]),
  ],

  'tie.arrive.apart': [
    C('ti.aa1', "My {kinWord}, {b}, is on the other side. We came here together and they split us up in the first five minutes."),
    C('ti.aa2', "I can see {b} from here. I'm not allowed to go over there. This is the longest distance I've ever been from my {kinWord}."),
    C('ti.aa3', "{b} and I talked about this. If they put us apart, we play our own games. That was easy to say at home."),
    C('ti.aa4', "Being apart from {b} might be the best thing for my game. It's definitely the worst thing for me."),
    C('ti.aa5', "Everybody over there is going to find out {b} is my {kinWord}. I just hope they don't hold it against {b}."),
    C('ti.aa6', "I'll see {b} at the challenges. I'm going to try very hard not to wave. I'm probably going to wave."),
  ],

  'tie.arrive.home': [
    C('ti.ah1', "I've got a {homeWord} back home, {home}. I'm not here to find anybody. I'm here to win, and then go home to {home}."),
    C('ti.ah2', "{home} said, \"Don't do anything stupid.\" I said, \"Like what?\" and {home} just gave me a look.", "I know exactly what that look meant."),
    C('ti.ah3', "Everybody asks if I'm single. I'm not. My {homeWord}, {home}, is watching every second of this, so I'm going to behave."),
    C('ti.ah4', "I miss {home} already, which is embarrassing, because it's been about four hours."),
    C('ti.ah5', "The hardest part isn't the game. It's not being able to tell {home} about my day. I'm saving it all up."),
    C('ti.ah6', "I told {home} I'd win this for both of us. So now I kind of have to."),
  ],

  'tie.home.any': [
    T('ti.hi1', third('innocent'), [
      { beat: "{a} and {c} are sitting a little closer together than they need to when {b} wanders over." },
      { by: 'b', say: "Wait, {a}, don't you have a {homeWord}? {home}, right?" },
      { by: 'a', say: "I, yes. I do." },
      { by: 'b', conf: "I wasn't trying to start anything. I just remembered, out loud, in front of everybody." },
    ]),
    T('ti.hi2', third('innocent'), [
      { by: 'b', say: "How's {home} doing, by the way? Do you miss {home}?" },
      { beat: "{c} goes very quiet." },
      { by: 'a', say: "Yeah. Of course I do." },
      { by: 'a', conf: "{b} didn't mean anything by it. But {c} heard it, and now I have to think about it." },
    ]),
    T('ti.hi3', third('innocent'), [
      { by: 'b', say: "You two are so cute. Wait. {a}, aren't you with somebody? Your {homeWord}?" },
      { by: 'a', say: "{home}. Yes." },
      { by: 'b', say: "Oh. Right. Sorry, I forgot." },
      { by: 'c', conf: "I knew about {home}. I just didn't need {b} saying it with everybody listening." },
    ]),
    T('ti.hp1', third('pointed'), [
      { by: 'b', say: "{c}, has {a} mentioned {home} yet? {a.posAdj} {homeWord}? The one waiting at home?" },
      { by: 'a', say: "That's not your business." },
      { by: 'b', say: "It's going to be everybody's business when this airs." },
      { by: 'b', conf: "I'm not the bad guy here. I just think {home} deserves to know what's going on." },
    ]),
    T('ti.hp2', third('pointed'), [
      { by: 'b', say: "Say hi to {home} for us, {a}. Oh wait, you can't, {home} is at home watching you flirt with {c}." },
      { beat: "Everybody nearby suddenly finds something else to look at." },
      { by: 'a', conf: "{b} wants me rattled. It worked. I hate that it worked." },
    ]),
    T('ti.hp3', third('pointed'), [
      { by: 'b', say: "Funny how {a} never talks about {home} when {c} is around." },
      { by: 'c', say: "Who's {home}?" },
      { by: 'b', say: "Ask {a}." },
      { by: 'b', conf: "If {a} won't be honest with {c}, I'll do it for {a}. You're welcome." },
    ]),
  ],

  'tie.guilt.any': [
    T('ti.gg1', { ending: 'guilty' }, [{ by: 'a', conf: "{home} is going to watch this. I keep thinking about that." }, { by: 'a', conf: "I need to put some space between me and {b}, starting now." }]),
    T('ti.gg2', { ending: 'guilty' }, [{ by: 'a', conf: "Nothing happened with {b}. But I can feel it getting closer to something, and I have a {homeWord}." }, { by: 'a', conf: "So I'm going to be a good friend to {b}, and that's all I'm going to be." }]),
    T('ti.gg3', { ending: 'guilty' }, [{ by: 'a', conf: "I talked to {b} for two hours last night and didn't think about {home} once. That scared me." }]),
    T('ti.gt1', { ending: 'torn' }, [{ by: 'a', conf: "I'm not doing anything wrong. I'm just talking to {b} a lot." }, { by: 'a', conf: "And if {home} was doing this with somebody, I'd be furious. So I don't know what that makes me." }]),
    T('ti.gt2', { ending: 'torn' }, [{ by: 'a', conf: "{b} gets me in a way that's hard to explain, and I love {home}. Both of those are true, and I hate it." }]),
    T('ti.gt3', { ending: 'torn' }, [{ by: 'a', conf: "Every time I'm about to say something to {b} that I shouldn't, I think of {home}'s face." }, { by: 'a', conf: "It works most of the time." }]),
    T('ti.gs1', { ending: 'shrug' }, [{ by: 'a', conf: "{home} knows what this show is. What happens out here stays out here. Mostly." }]),
    T('ti.gs2', { ending: 'shrug' }, [{ by: 'a', conf: "Is it a big deal that I've got a {homeWord}? It's a game. {b} is part of my game. {home} will get it." }, { by: 'a', conf: "Probably." }]),
    T('ti.gs3', { ending: 'shrug' }, [{ by: 'a', conf: "People keep bringing up {home} like it's going to make me feel bad. I'm out here and {home} isn't. That's just how it is." }]),
  ],

  'tie.couple.any': [
    T('ti.cs1', { ending: 'steady' }, [
      { beat: "{a} saves {b} the last of the water without saying a word about it." },
      { by: 'b', say: "You didn't have to do that." },
      { by: 'a', say: "You're my {kinWord}. Of course I did." },
      { by: 'b', conf: "Everybody out here is scared of being alone. I'm the only one who isn't, and it's because of {a}." },
    ]),
    T('ti.cs2', { ending: 'steady' }, [
      { by: 'a', say: "People keep looking at us like we're a problem." },
      { by: 'b', say: "We are a problem. We're two votes that never split." },
      { by: 'a', say: "When you put it like that, it sounds kind of great." },
      { by: 'a', conf: "Coming here with {b} means I'm never the one sitting by myself. I'll take that." },
    ]),
    T('ti.cs3', { ending: 'steady' }, [
      { by: 'b', say: "If they split us up, promise me you'll keep going." },
      { by: 'a', say: "Nobody's splitting anybody up." },
      { by: 'b', say: "Promise me anyway." },
      { by: 'a', say: "Fine. I promise. Now stop being dramatic." },
    ]),
    T('ti.cr1', { ending: 'strained' }, [
      { by: 'b', say: "You keep making decisions for both of us without asking me." },
      { by: 'a', say: "Because there's no time to ask! Things move fast out here." },
      { by: 'b', say: "Then make them move slower. I'm your {kinWord}, not your backup vote." },
      { by: 'a', conf: "The game is getting between me and {b}, and I don't know how to stop it." },
    ]),
    T('ti.cr2', { ending: 'strained' }, [
      { by: 'a', say: "Are we okay?" },
      { by: 'b', say: "We're fine. I'm just tired of everybody looking at us like a target." },
      { by: 'a', conf: "{b} said fine. {b} never says fine unless something is wrong." },
    ]),
    T('ti.cr3', { ending: 'strained' }, [
      { by: 'b', conf: "Back home, me and {a} never fight. Out here, we've had three arguments since breakfast." },
      { by: 'b', conf: "It's not about us. It's the game. I just hope we still like each other when this is over." },
    ]),
    T('ti.cj1', third('jealous'), [
      { by: 'a', say: "So what's going on with you and {c}?" },
      { by: 'b', say: "Nothing. We're friends." },
      { by: 'a', say: "You came here with me, {b}. You don't get to have that kind of friend." },
      { by: 'a', conf: "Everybody's seen it. I'm the last one to say it out loud, and I'm the one it's happening to." },
    ]),
    T('ti.cj2', third('jealous'), [
      { beat: "{a} watches {b} laugh at something {c} said, a little too long." },
      { by: 'a', conf: "{b} is my {kinWord}. We walked in here together. And now I'm watching {b} with {c} like I'm not even here." },
    ]),
    T('ti.cj3', third('jealous'), [
      { by: 'c', say: "Hey, {b}, you coming?" },
      { by: 'a', say: "Coming where?" },
      { by: 'b', say: "Just for a walk. It's not a big deal." },
      { by: 'a', conf: "It's a walk. It's always just a walk. I'm starting to hate walks." },
    ]),
    T('ti.co1', { ending: 'over' }, [
      { beat: "{a} and {b} end up on the same job and don't look at each other once." },
      { by: 'a', say: "Can you pass that?" },
      { by: 'b', say: "Sure." },
      { by: 'a', conf: "We came here as a couple. Now we're two people who used to know each other really well. It's the worst." },
    ]),
    T('ti.co2', { ending: 'over' }, [
      { by: 'b', conf: "I keep forgetting we broke up. Then I see {a} and I remember all over again." },
    ]),
    T('ti.co3', { ending: 'over' }, [
      { by: 'b', say: "You don't have to leave every time I sit down." },
      { by: 'a', say: "I'm not leaving because of you." },
      { by: 'b', say: "You're doing it right now." },
      { by: 'b', conf: "I came here with {a}. I'm going to leave without {a}, one way or another." },
    ]),
    T('ti.cv1', { ending: 'civil' }, [
      { by: 'a', say: "So. Are we friends now?" },
      { by: 'b', say: "I think we are. It's weird, but I think we are." },
      { by: 'a', conf: "Breaking up out here should have been a disaster. Instead it's the most honest {b} and I have been in months." },
    ]),
    T('ti.cv2', { ending: 'civil' }, [
      { by: 'b', say: "For the record, I'm still on your side. In the game, I mean." },
      { by: 'a', say: "I know. Me too." },
      { by: 'b', conf: "We weren't good at being a couple out here. We're actually pretty good at being allies." },
    ]),
    T('ti.cv3', { ending: 'civil' }, [
      { by: 'a', conf: "People expected me and {b} to tear each other apart after the break-up. We didn't. We're fine." },
      { by: 'a', conf: "Mostly fine. Fine enough to vote together, anyway." },
    ]),
  ],

  'tie.family.any': [
    T('ti.fp1', { ending: 'protect' }, [
      { by: 'a', say: "Who's been saying your name?" },
      { by: 'b', say: "Nobody. Relax." },
      { by: 'a', say: "Somebody has. I can tell when you're lying, I've known you your whole life." },
      { by: 'a', conf: "You come after my {kinWord}, you come after me. That's not a strategy. That's just family." },
    ]),
    T('ti.fp2', { ending: 'protect' }, [
      { by: 'a', conf: "Everybody thinks I'm playing my own game. I'm not. I'm playing to get my {kinWord} as far as I can." },
      { by: 'a', conf: "If one of us has to go first, it's going to be me." },
    ]),
    T('ti.fp3', { ending: 'protect' }, [
      { by: 'b', say: "You don't have to keep checking on me." },
      { by: 'a', say: "I'm not checking on you. I'm checking on everybody near you." },
      { by: 'b', conf: "My {kinWord} thinks I can't look after myself. My {kinWord} might be right, but I'm not saying that." },
    ]),
    T('ti.fb1', { ending: 'bicker' }, [
      { by: 'b', say: "You always do this. You always have to be in charge." },
      { by: 'a', say: "Because somebody in this family has to be!" },
      { by: 'b', conf: "Out here everybody's a stranger except {a}, and {a} is the one who drives me the most crazy." },
    ]),
    T('ti.fb2', { ending: 'bicker' }, [
      { by: 'a', say: "Stop telling people stories about me when I was little." },
      { by: 'b', say: "They're good stories." },
      { by: 'a', say: "They're humiliating stories." },
      { by: 'a', conf: "I love my {kinWord}. But I'm going to strangle my {kinWord}." },
    ]),
    T('ti.fb3', { ending: 'bicker' }, [
      { by: 'a', conf: "Being here with my {kinWord} is like every family holiday, except it lasts weeks and there's a vote at the end." },
    ]),
  ],

  'tie.exes.any': [
    T('ti.es1', { ending: 'snipe' }, [
      { by: 'b', say: "Oh, you're helping now? That's new." },
      { by: 'a', say: "I always helped. You just never noticed." },
      { by: 'b', say: "Here we go." },
      { by: 'a', conf: "I thought I was over it. Then {b} opened {b.posAdj} mouth." },
    ]),
    T('ti.es2', { ending: 'snipe' }, [
      { by: 'a', conf: "Everybody wants to know why {b} and I broke up. Give it a few more days. They'll see." },
    ]),
    T('ti.es3', { ending: 'snipe' }, [
      { by: 'a', say: "Can you not sit right there?" },
      { by: 'b', say: "It's a free country." },
      { by: 'a', say: "It's a free country, and you picked the one spot next to me." },
      { by: 'b', conf: "I didn't pick it to annoy {a}. That was just a bonus." },
    ]),
    T('ti.et1', { ending: 'thaw' }, [
      { by: 'b', say: "That was actually really nice, what you did earlier." },
      { by: 'a', say: "Don't sound so surprised." },
      { by: 'b', say: "I'm a little surprised." },
      { by: 'a', conf: "{b} and I are exes. Out here, that's starting to matter less than I thought it would." },
    ]),
    T('ti.et2', { ending: 'thaw' }, [
      { by: 'a', conf: "I came in thinking {b} would be my biggest problem. Turns out {b} might be the one person here who knows I'm not a bad person." },
    ]),
    T('ti.et3', { ending: 'thaw' }, [
      { by: 'b', say: "Truce?" },
      { by: 'a', say: "For now." },
      { by: 'b', say: "That's the nicest thing you've said to me in a year." },
      { by: 'b', conf: "My ex and I are getting along. Nobody tell my friends back home, they won't believe it." },
    ]),
  ],
};

/** {home} and {homeWord} come with every partner-at-home scene, {kinWord} with every tie (camp-events.js, episode.js). */
export const GUARANTEED = {
  'tie.arrive.couple': ['kinWord'],
  'tie.arrive.apart': ['kinWord'],
  'tie.arrive.home': ['home', 'homeWord'],
  'tie.home.any': ['home', 'homeWord'],
  'tie.guilt.any': ['home', 'homeWord'],
  'tie.couple.any': ['kinWord'],
  'tie.family.any': ['kinWord'],
  'tie.exes.any': ['kinWord'],
};
