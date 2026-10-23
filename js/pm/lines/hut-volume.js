// pm/lines/hut-volume.js — more beach-hut lines for the scenes that cut away
// most (the user, 2026-10-22: "address the repeats by increasing the volume
// of the dialogue ALOT"). Same rules as hut.js: {a} speaks, {b} is the other
// one in the scene, `role` is the speaker's place in it; honest says what they
// feel, two-faced is somebody hiding something, and never says what.
const B = { withB: true };
const K = (kind, more = {}) => ({ kind, ...more });

export const HUT_VOLUME = {
  honest: [
    { id: 'hutv.pull.h1', when: K('pull', { ...B, role: 0 }), turns: [['a', "I've been wanting to talk to {b} properly for days. I finally did it. My heart was going the whole time."]] },
    { id: 'hutv.pull.h2', when: K('pull', { ...B, role: 0 }), turns: [['a', "I don't know where it goes with {b}. I just know I'd have kicked myself if I never asked."]] },
    { id: 'hutv.pull.h3', when: K('pull', { ...B, role: 0, rebuffed: false }), turns: [['a', "{b} laughed at my jokes. All of them. Even the bad one. That's either kindness or something else, and I'm hoping it's something else."]] },
    { id: 'hutv.pull.h4', when: K('pull', { ...B, role: 1, rebuffed: false }), turns: [['a', "When {b} asked me for a chat, I thought it would be five minutes. It was nearly an hour. I didn't notice."]] },
    { id: 'hutv.pull.h5', when: K('pull', { ...B, role: 1, rebuffed: false }), turns: [['a', "{b} surprised me today. In a good way. I'm going to be thinking about that chat all evening."]] },
    { id: 'hutv.pull.h6', when: K('pull', { ...B, role: 1, rebuffed: true }), turns: [['a', "I had to be honest with {b}. It's not there for me. I'd rather say it now than let it drag on."]] },
    { id: 'hutv.pull.h7', when: K('pull', { ...B, role: 0, rebuffed: true }), turns: [['a', "{b} let me down gently. Very gently. It's still a let-down. I'm going to go and eat something."]] },
    { id: 'hutv.pull.h8', when: K('pull', { ...B, role: 0, taken: true }), turns: [['a', "I know how that looked. I'm coupled up, and I'm off on the swing seats with someone else. I'm not proud of it. I'm not sorry either."]] },
    { id: 'hutv.chat.h1', when: K('chat', B), turns: [['a', "Every time I talk to {b}, I find out something new. Today it was that {b} hates the sea. Who hates the sea?"]] },
    { id: 'hutv.chat.h2', when: K('chat', B), turns: [['a', "Me and {b} could talk about absolutely nothing for hours. We just did. It was brilliant."]] },
    { id: 'hutv.chat.h3', when: K('chat', B), turns: [['a', "I like how calm I feel around {b}. In here, calm is rare. I'm holding on to it."]] },
    { id: 'hutv.chat.h4', when: K('chat', { ...B, late: true }), turns: [['a', "We've been together long enough now that the chats are just easy. No effort. That's how I know it's real."]] },
    { id: 'hutv.deep.h1', when: K('deep-chat', B), turns: [['a', "That was a big chat. I said things to {b} I've never said out loud. I feel a bit wobbly, but in a good way."]] },
    { id: 'hutv.deep.h2', when: K('deep-chat', { ...B, role: 1 }), turns: [['a', "{b} told me something really personal today, and I could see how hard it was. I just want to look after {b} now."]] },
    { id: 'hutv.kiss.h1', when: K('kiss', B), turns: [['a', "I'm not going to pretend I'm not smiling. Look at me. I can't stop. It's ridiculous."]] },
    { id: 'hutv.kiss.h2', when: K('kiss', B), turns: [['a', "Kissing {b} is honestly the best bit of my day. Every day. Is that soppy? It's soppy."]] },
    { id: 'hutv.loyalty.h1', when: K('loyalty', { ...B, role: 0 }), turns: [['a', "I could see {b} was hurt. I hate that. But I'm not going to lead anyone on to be polite."]] },
    { id: 'hutv.loyalty.h2', when: K('loyalty', { ...B, role: 1 }), turns: [['a', "{b} turned me down. Kindly. I respect it. I'm also going to sit in the shade and feel sorry for myself for a bit."]] },
    { id: 'hutv.friend.h1', when: K('friendship', B), turns: [['a', "{b} is honestly the person keeping me sane in here. I don't say that enough. I'm saying it now."]] },
    { id: 'hutv.friend.h2', when: K('friendship', B), turns: [['a', "We did nothing all afternoon, me and {b}. Absolutely nothing. Best afternoon I've had."]] },
    { id: 'hutv.friend.h3', when: K('friendship', B), turns: [['a', "There's no drama with {b}. Ever. In this villa, that's worth more than anything."]] },
    { id: 'hutv.comedy.h1', when: K('comedy'), turns: [['a', "If I've made one person laugh today, I've done my job. I've made about six. Promotion, please."]] },
  ],
  'two-faced': [
    { id: 'hutv.pull.t1', when: K('pull', { ...B, role: 0 }), turns: [['a', "I told myself it was just a chat. I'm going to keep telling myself that until it sounds true."]] },
    { id: 'hutv.pull.t2', when: K('pull', { ...B, role: 0 }), turns: [['a', "If anyone asks what we talked about, the answer is the weather. It was not the weather."]] },
    { id: 'hutv.pull.t3', when: K('pull', { ...B, role: 1 }), turns: [['a', "I don't know what {b} is playing at. I don't know what I'm playing at either, if I'm honest."]] },
    { id: 'hutv.pull.t4', when: K('pull', { ...B, role: 1 }), turns: [['a', "I should have stopped that chat ten minutes in. I didn't. I'm not going to think too hard about why."]] },
    { id: 'hutv.pull.t5', when: K('pull', { ...B, role: 0, taken: true }), turns: [['a', "My partner thinks I was in the kitchen. I was in the kitchen. For a bit. Then I wasn't."]] },
    { id: 'hutv.chat.t1', when: K('chat', B), turns: [['a', "{b} kept saying how lucky we are. I kept saying yes. I'm not sure who I was saying it for."]] },
    { id: 'hutv.chat.t2', when: K('chat', B), turns: [['a', "It's hard to relax on a sunbed when you've got something on your mind. I'm very tense for someone lying down."]] },
    { id: 'hutv.chat.t3', when: K('chat', B), turns: [['a', "{b} asked me what I'd been up to today. I said not much. That was a lie."]] },
    { id: 'hutv.chat.t4', when: K('chat', B), turns: [['a', "Everything's fine with {b}. On the surface. Underneath, there's a bit I'm keeping to myself."]] },
    { id: 'hutv.deep.t1', when: K('deep-chat', B), turns: [['a', "{b} opened up so much today. And I sat there with my own secret, nodding. That's going to keep me up tonight."]] },
    { id: 'hutv.deep.t2', when: K('deep-chat', B), turns: [['a', "{b} said honesty is the most important thing to {b}. I agreed very loudly."]] },
    { id: 'hutv.kiss.t1', when: K('kiss', B), turns: [['a', "That kiss was nice. I just wish I could stop thinking about earlier while it was happening."]] },
    { id: 'hutv.kiss.t2', when: K('kiss', B), turns: [['a', "{b} kissed me like everything's fine. I kissed back like everything's fine. Everything's mostly fine."]] },
    { id: 'hutv.kiss.t3', when: K('kiss', B), turns: [['a', "I'm going to make it up to {b}. {b} doesn't know there's anything to make up for. That's the point."]] },
    { id: 'hutv.loyalty.t1', when: K('loyalty', { ...B, role: 0 }), turns: [['a', "Everyone saw me say no to {b}. Good. I needed everyone to see that today."]] },
    { id: 'hutv.loyalty.t2', when: K('loyalty', { ...B, role: 0 }), turns: [['a', "Saying no to {b} was the easy bit. The hard bit's what I'm not saying to anyone."]] },
    { id: 'hutv.loyalty.t3', when: K('loyalty', { ...B, role: 1 }), turns: [['a', "{b} said no. Fine. I've got other things to worry about. Things nobody knows about. Yet."]] },
    { id: 'hutv.friend.t1', when: K('friendship', B), turns: [['a', "{b} keeps saying I can tell {b} anything. I really can't. Not this."]] },
    { id: 'hutv.friend.t2', when: K('friendship', B), turns: [['a', "We had a laugh, me and {b}. I was laughing on the outside and doing maths on the inside."]] },
    { id: 'hutv.friend.t3', when: K('friendship', B), turns: [['a', "If {b} ever finds out, I'll lose my best friend in here. So {b} won't find out."]] },
    { id: 'hutv.friend.t4', when: K('friendship', B), turns: [['a', "I'm a good friend to {b}. I am. I'm just a good friend with one thing missing from the story."]] },
    { id: 'hutv.friend.t5', when: K('friendship', { ...B, taken: true }), turns: [['a', "{b} asked how it's going with my partner. I said brilliant. I said it a bit too quickly."]] },
    { id: 'hutv.friend.t6', when: K('friendship', B), turns: [['a', "{b} trusts me completely. I wish I deserved it a bit more this week."]] },
    { id: 'hutv.comedy.t1', when: K('comedy'), turns: [['a', "Nobody suspects the funny one. That's the whole point of being the funny one."]] },
    { id: 'hutv.comedy.t2', when: K('comedy'), turns: [['a', "I've been making jokes all day. The more I joke, the fewer questions. I've got a lot of jokes left."]] },
    { id: 'hutv.gossip.t1', when: K('gossip', { ...B, role: 0 }), turns: [['a', "I told {b} what I saw. I didn't tell {b} everything I know. Some things are mine."]] },
    { id: 'hutv.gossip.t2', when: K('gossip', { role: 2 }), turns: [['a', "Everyone's talking about me. Fine. As long as they're talking about the thing they know, and not the thing they don't."]] },
  ],
};
