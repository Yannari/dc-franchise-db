// pm/lines/day/ick-close.js — what happens after {a} gets the ick. Data only.
//
// An ick played as one or two lines and stopped. Now the scene carries on,
// by what the engine decided (pm/events.js ENDINGS.ick):
//
//   said  {a} tells {b}, and {b} is hurt by it
//   kept  {a} keeps it to {a.ref}, and {b} half notices
//
// Cast [a, b], a couple: {a} went off {b}. Written to follow ANY ick opener —
// never names what the habit was, since the opener already showed it.
export const ICK_CLOSE = {
  'ick-close': [
    // said: out loud, and it stings
    { id: 'ikc.s.01', when: { of: 'said' }, turns: [['b', "What's that face for?"], ['a', "Honestly? That put me off a bit."], ['b', "Put you off?"], ['a', "Just a bit. Sorry."]], beat: '{b} goes quiet.' },
    { id: 'ikc.s.02', when: { of: 'said' }, turns: [['a', "Can I be honest with you?"], ['b', "Go on."], ['a', "That's a bit of an ick for me."], ['b', "Wow. Okay."]] },
    { id: 'ikc.s.03', when: { of: 'said' }, turns: [['b', "Why are you looking at me like that?"], ['a', "I'm not going to lie to you. I didn't like that."], ['b', "It's just who I am."], ['a', "I know. That's the problem."]], beat: "{b} gets up, and doesn't come back for a while." },
    { id: 'ikc.s.04', when: { of: 'said' }, turns: [['a', "Please never do that again."], ['b', "I was only messing about."], ['a', "I know. Still. Never again."], ['b', "Noted."]] },
    { id: 'ikc.s.05', when: { of: 'said' }, turns: [['b', "Are you actually annoyed?"], ['a', "Not annoyed. Just… it's a bit much."], ['b', "I'm a bit much?"], ['a', "That's not what I said."]] },
    { id: 'ikc.s.06', when: { of: 'said' }, turns: [['a', "Sorry, I have to say it. That's the ick."], ['b', "You can't just say that."], ['a', "I just did."]], beat: "{b} laughs, but it's clear it hurt." },
    { id: 'ikc.s.07', when: { of: 'said' }, turns: [['b', "What did I do?"], ['a', "Nothing. Well. That."], ['b', "I didn't know that bothered you."], ['a', "Neither did I, until just now."]] },
    { id: 'ikc.s.08', when: { of: 'said' }, turns: [['a', "I need you to stop."], ['b', "Stop what?"], ['a', "Everything you're doing right now."], ['b', "Right. Okay. I'll just sit here, then."]] },
    { id: 'ikc.s.09', when: { of: 'said' }, turns: [['b', "You've gone all funny with me."], ['a', "I'm fine. I just didn't love that."], ['b', "Should I be worried?"], ['a', "No. Maybe. I don't know."]] },
    { id: 'ikc.s.10', when: { of: 'said' }, turns: [['a', "Okay, that's a red flag."], ['b', "It's a joke!"], ['a', "It's a red flag."]], beat: '{b} looks hurt, and tries to laugh it off.' },

    // kept: to themselves, and it shows anyway
    { id: 'ikc.k.01', when: { of: 'kept' }, turns: [['b', "What?"], ['a', "Nothing."], ['b', "You've gone quiet."], ['a', "I'm just tired."]] },
    { id: 'ikc.k.02', when: { of: 'kept' }, turns: [['b', "Are you okay?"], ['a', "Yeah. Fine. Do you want a drink?"]], beat: '{a} goes to get one, and stays in the kitchen for a while.' },
    { id: 'ikc.k.03', when: { of: 'kept' }, turns: [['b', "Come here, then."], ['a', "In a minute."]], beat: "{a} doesn't come." },
    { id: 'ikc.k.04', when: { of: 'kept' }, turns: [['b', "You'd tell me if something was wrong, wouldn't you?"], ['a', "Of course I would."], ['b', "Okay."]] },
    { id: 'ikc.k.05', when: { of: 'kept' }, turns: [['b', "Did I say something?"], ['a', "No, no. You're fine."], ['b', "You're sure?"], ['a', "I'm sure."]], beat: "{a} doesn't look at {b} for the rest of it." },
    { id: 'ikc.k.06', when: { of: 'kept' }, turns: [['a', "I'm going to go and see the others for a bit."], ['b', "Oh. Okay. Want me to come?"], ['a', "No, you stay. I won't be long."]] },
    { id: 'ikc.k.07', when: { of: 'kept' }, turns: [['b', "Why are you laughing?"], ['a', "I'm not. It's nothing."], ['b', "It's not nothing."], ['a', "Honestly. Leave it."]] },
    { id: 'ikc.k.08', when: { of: 'kept' }, turns: [['b', "Do you still want to sit together at dinner?"], ['a', "…Yeah. Yeah, of course."]], beat: '{b} smiles. {a} tries to.' },
    { id: 'ikc.k.09', when: { of: 'kept' }, turns: [['b', "You've moved."], ['a', "Have I?"], ['b', "You were right next to me."], ['a', "It's hot. I'm just hot."]] },
    { id: 'ikc.k.10', when: { of: 'kept' }, turns: [['b', "Kiss?"], ['a', "Later."], ['b', "Later?"], ['a', "Everyone's watching."]] },
  ],
};
