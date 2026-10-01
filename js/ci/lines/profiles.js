// Day one: setting up a profile. Then newcomers, and a face someone knows.
// Data only. In `profile.*`, a is the player choosing their photo and bio;
// {a} is the name on the profile.
export const PROFILES = {
  'profile.honest': [
    { id: 'profile.honest.01', turns: [
      { by: 'a', react: "'You must now set up your profile.' Okay. Let's do this." },
      { by: 'a', say: "Circle, take me to my private albums. I want one where I'm smiling. No filter. This is me." },
    ], beat: '{a} picks a photo and sits back, satisfied.' },
    { id: 'profile.honest.02', turns: [
      { by: 'a', say: "I'm playing as myself. What you see is what you get. Circle, save that as my bio." },
    ] },
    { id: 'profile.honest.03', turns: [
      { by: 'a', say: "First impressions are everything. Not the gym one. Not the party one. That one. The normal one." },
    ], beat: '{a} points at the screen.' },
    { id: 'profile.honest.04', turns: [
      { by: 'a', say: "Relationship status: single. Very single. Circle, add a laughing emoji." },
    ] },
    { id: 'profile.honest.05', turns: [
      { by: 'a', say: "This picture is from last week. No makeup, no angles. If they like me, they like the real me." },
    ] },
    { id: 'profile.honest.06', turns: [
      { by: 'a', say: "Circle, write: 'What you see is what you get. Ask me anything.' Send that as my bio." },
    ], beat: '{a} reads the bio back out loud, twice.' },
    { id: 'profile.honest.07', turns: [
      { by: 'a', react: "My hair's a mess in this one. Whatever. That's my hair." },
    ] },
    { id: 'profile.honest.08', turns: [
      { by: 'a', say: "I'm not going to pretend in here. I'd forget what I said by Tuesday anyway." },
    ] },
    { id: 'profile.honest.09', turns: [
      { by: 'a', say: "Circle, use the one where I'm laughing. That's what I look like most of the time." },
    ], beat: '{a} smiles at the photo for a long moment.' },
    { id: 'profile.honest.10', turns: [
      { by: 'a', say: "Honest profile, honest game. Let's see how far that gets me." },
    ] },
  ],
  'profile.polished': [
    { id: 'profile.polished.01', turns: [
      { by: 'a', say: "It's me, just the best version of me. Good lighting never hurt anybody." },
    ], beat: '{a} flips through the album twice before choosing.' },
    { id: 'profile.polished.02', turns: [
      { by: 'a', say: "I'm not using the party pictures. I don't want anyone seeing me as a threat on day one." },
    ] },
    { id: 'profile.polished.03', turns: [
      { by: 'a', say: "Circle, open the picture on the top left. That's the one. That's cute, but it's not trying too hard." },
    ] },
    { id: 'profile.polished.04', turns: [
      { by: 'a', say: "Circle, show me the vacation album. No. The other vacation album. There. That's the one." },
    ], beat: '{a} zooms in, zooms out, and zooms in again.' },
    { id: 'profile.polished.05', turns: [
      { by: 'a', say: "It's still me. It's just me on a really, really good day." },
    ] },
    { id: 'profile.polished.06', turns: [
      { by: 'a', say: "This one. I look like I just heard the best news of my life. Perfect." },
    ], beat: '{a} blows a kiss at the screen.' },
    { id: 'profile.polished.07', turns: [
      { by: 'a', say: "Bio. Something fun but not too much. Circle, write: 'Here for a good time and good people.' Smiley face." },
    ] },
    { id: 'profile.polished.08', turns: [
      { by: 'a', say: "No selfies from the bathroom. Nobody trusts a bathroom selfie." },
    ] },
    { id: 'profile.polished.09', turns: [
      { by: 'a', react: "Okay, these pictures are from a wedding. I look great. That's the one." },
    ], beat: '{a} nods slowly, very pleased.' },
    { id: 'profile.polished.10', turns: [
      { by: 'a', say: "Circle, crop that one a little tighter. Perfect. Just my face, looking happy." },
    ] },
    { id: 'profile.polished.11', turns: [
      { by: 'a', say: "The trick is to look friendly but a little mysterious. Circle, that one. Friendly. Mysterious." },
    ] },
  ],
  'profile.edited': [
    { id: 'profile.edited.01', turns: [
      { by: 'a', say: "It's my face. It's my name. I'm just leaving out one or two things. Everybody does that online." },
    ] },
    { id: 'profile.edited.02', turns: [
      { by: 'a', say: "Circle, change my job. Nobody needs to know what I actually do for a living. Not in here." },
    ], beat: '{a} watches the new job title appear on the profile.' },
    { id: 'profile.edited.03', turns: [
      { by: 'a', say: "If they knew the real number, they'd treat me differently. So the number changes." },
    ] },
    { id: 'profile.edited.04', turns: [
      { by: 'a', say: "Everything on this profile is true. Almost everything. Circle, save it before I change my mind." },
    ] },
    { id: 'profile.edited.05', turns: [
      { by: 'a', say: "A small change. Tiny. Nobody's going to ask me about it. Probably." },
    ], beat: '{a} chews on a thumbnail.' },
    { id: 'profile.edited.06', turns: [
      { by: 'a', say: "It's still my face. I just want them to meet me before they meet that part of me." },
    ] },
  ],
  'profile.catfish': [
    { id: 'profile.catfish.01', when: { reasonKind: 'strategic' }, turns: [
      { by: 'a', say: "Online, the pretty ones get more likes. I did my research. So in here, I'm {a}." },
    ], beat: '{a.real} grins at the new profile on the screen.' },
    { id: 'profile.catfish.02', when: { reasonKind: 'protective' }, turns: [
      { by: 'a', say: "All my life people have judged me before they got to know me. In here they don't get to. In here, I'm {a}." },
    ] },
    { id: 'profile.catfish.03', when: { reasonKind: 'family' }, turns: [
      { by: 'a', say: "I'm playing as someone I love. I know everything about {a.obj}. I can do this." },
    ] },
    { id: 'profile.catfish.04', when: { reasonKind: 'experimental' }, turns: [
      { by: 'a', say: "I want to see if people treat me differently when they think I'm someone else. So meet {a}." },
    ] },
    { id: 'profile.catfish.05', turns: [
      { by: 'a', say: "Circle, add the photo in the blue top to my profile. Hello, {a}. Nobody in here knows me, and I'm keeping it that way." },
    ] },
    { id: 'profile.catfish.06', turns: [
      { by: 'a', say: "I have my notes. Age, job, hometown. If I slip once, I'm done. So I don't slip." },
    ], beat: '{a.real} taps a folded piece of paper on the table.' },
    { id: 'profile.catfish.07', turns: [
      { by: 'a', say: "{a} is sweet, {a} is fun, and {a} is never, ever gonna get caught." },
    ] },
  ],
  'profile.shared': [
    { id: 'profile.shared.01', turns: [
      { by: 'a', say: "Two of us, one profile. We already can't agree on the picture." },
    ], beat: 'Two people argue quietly over which picture to use, then pick the first one they looked at.' },
    { id: 'profile.shared.02', turns: [
      { by: 'a', say: "One of us does the talking, one of us does the thinking. We'll figure out who's who later." },
    ] },
    { id: 'profile.shared.03', turns: [
      { by: 'a', say: "They'll think we're one person. That's the plan. Don't say 'we.' Ever." },
    ] },
  ],
  'recognise': [
    { id: 'recognise.01', turns: [
      { by: 'a', react: "Wait. Wait, wait, wait. I know that face. I KNOW that face." },
      { by: 'a', say: "That's not {b}. I've been in a game with the person in that picture." },
    ], beat: '{a.real} stands up from the couch.' },
    { id: 'recognise.02', turns: [
      { by: 'a', react: "No way. No way. That picture is someone I know." },
      { by: 'a', say: "Whoever is playing {b} just made a big mistake." },
    ] },
    { id: 'recognise.03', turns: [
      { by: 'a', react: "Circle, enlarge that photo. Oh, I know exactly who that is. And it isn't {b}." },
    ], beat: '{a.real} laughs out loud, alone in the apartment.' },
  ],
  // A famous face, recognised (season.js recogniseFame). a = who recognises,
  // b = the famous player's profile. They know the face, not the plan.
  'recognise.celebrity': [
    { id: 'recognise.celebrity.01', turns: [
      { by: 'a', react: "Wait. Wait. Circle, open {b}'s profile. Oh my God. That's actually {b}." },
      { by: 'a', say: "I've seen {b.obj} on TV. Everybody's seen {b.obj} on TV. How is {b.sub} in here?" },
    ], beat: '{a.real} stands up from the couch and sits back down again.' },
    { id: 'recognise.celebrity.02', turns: [
      { by: 'a', react: "No. No way. That's {b}. Like, the {b}." },
      { by: 'a', say: "Okay, be cool. Be normal. Do not message {b.obj} like a fan." },
    ] },
    { id: 'recognise.celebrity.03', turns: [
      { by: 'a', react: "I know that face. That's {b}. Everybody in America knows that face." },
      { by: 'a', say: "{b.Sub} has fans. Fans vote. That's a problem for the rest of us." },
    ], beat: '{a.real} leans in until {a.posAdj} nose nearly touches the screen.' },
  ],
  'recognise.villain': [
    { id: 'recognise.villain.01', turns: [
      { by: 'a', react: "Hold on. I know {b}. I watched {b.obj} lie to everybody on TV." },
      { by: 'a', say: "I bet half these people have no idea what {b.sub} did. I do." },
    ], beat: '{a.real} crosses {a.posAdj} arms.' },
    { id: 'recognise.villain.02', turns: [
      { by: 'a', react: "Oh, it's {b}. Of course it's {b}." },
      { by: 'a', say: "Whatever {b.sub} says to you, {b.sub} doesn't mean it. I've seen the show." },
    ] },
    { id: 'recognise.villain.03', turns: [
      { by: 'a', react: "Circle, open {b}'s profile. Yep. That's the one everybody hated." },
      { by: 'a', say: "Keep {b.obj} close. Closer than {b.sub} keeps me." },
    ] },
  ],
  'recognise.tv': [
    { id: 'recognise.tv.01', turns: [
      { by: 'a', react: "Wait, I've seen {b} before. On TV. I'm sure of it." },
      { by: 'a', say: "{b.Sub} knows how these games work. That makes {b.obj} dangerous." },
    ] },
    { id: 'recognise.tv.02', turns: [
      { by: 'a', react: "Hey, that's {b}! I watched {b.posAdj} season." },
      { by: 'a', say: "Honestly? I kind of loved {b.obj}. That's gonna make this hard." },
    ], beat: '{a.real} smiles at the screen in spite of {a.ref}.' },
    { id: 'recognise.tv.03', turns: [
      { by: 'a', react: "I know that face from somewhere. Circle, enlarge the photo." },
      { by: 'a', say: "Yeah. {b} has done this before. {b.Sub} has a head start on all of us." },
    ] },
  ],
  'arrival': [
    { id: 'arrival.01', turns: [
      { by: 'a', react: "Oh my God. Okay. I'm in the Circle. I'm actually in the Circle." },
      { by: 'a', say: "Everybody in here already knows each other. I need to find my people fast." },
    ] },
    { id: 'arrival.02', turns: [
      { by: 'a', say: "They don't know I'm watching. Circle, show me the chat. Let's see who's who." },
    ], beat: '{a.real} pulls a chair right up to the screen.' },
    { id: 'arrival.03', turns: [
      { by: 'a', say: "New kid energy. Be friendly. Be fun. Don't trust anybody yet." },
    ] },
    { id: 'arrival.04', turns: [
      { by: 'a', react: "'A new Player has entered the Circle.' That's me! That's me!" },
    ], beat: '{a.real} does a little dance in the doorway.' },
  ],
  'arrival.react': [
    { id: 'arrival.react.01', turns: [
      { by: 'a', react: "'A new Player has entered the Circle'? Now? Who is it?" },
      { by: 'a', say: "Okay. {b}. I need to get to {b.obj} before everybody else does." },
    ] },
    { id: 'arrival.react.02', turns: [
      { by: 'a', react: "A new player. Great. Just when I figured this place out." },
    ] },
    { id: 'arrival.react.03', turns: [
      { by: 'a', react: "Oh, {b} looks fun. Or {b} looks like a threat. One of the two." },
    ] },
    { id: 'arrival.react.04', turns: [
      { by: 'a', react: "New people are safe at the next blocking. So {b} is safe and I'm not. Great." },
    ] },
  ],
  'afterparty': [
    { id: 'afterparty.01', turns: [
      { by: 'a', say: "I watched the whole party. {b} is the one I want to know.", send: "Hey {b}! I'm new, and I picked you for my after-party {e:party}" },
      { by: 'b', react: "Me? Oh my God, me!", send: "Wait, me?? I'm honored!! Welcome in {e:heart}" },
      { by: 'a', send: "You seemed like the realest one in there" },
      { by: 'b', send: "Well now I have to live up to that lol" },
    ], beat: '{b} does a spin in the kitchen.' },
    { id: 'afterparty.02', turns: [
      { by: 'a', send: "Hi!! I've been secretly watching you all and you made me laugh the most {e:laugh}" },
      { by: 'b', react: "Secretly watching? That's terrifying. I love it.", send: "Omg you were watching?? Okay what did I say" },
      { by: 'a', send: "Nothing bad I promise. You're my first friend in here" },
      { by: 'b', send: "First friend. I'll take it {e:hug}" },
    ] },
    { id: 'afterparty.03', turns: [
      { by: 'a', say: "Pick someone who'll help me. Somebody everybody likes.", send: "So I hear you're the one to know in here {e:eyes}" },
      { by: 'b', react: "Somebody's been talking about me.", send: "Lol I don't know about that. But hi!!" },
      { by: 'a', send: "Hi! Show me around?" },
      { by: 'b', send: "Rule one: trust nobody. Rule two: except me {e:wink}" },
    ], beat: '{a.real} writes down rule one and rule two on a notepad.' },
  ],
};
