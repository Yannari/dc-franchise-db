// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-recall.js — the plan's leader, to the camera: where tonight started
// ══════════════════════════════════════════════════════════════════════
// director.js causeOf: the moment between the leader (a) and {target} that aired earlier today
// (a fight, a lie caught, a slacker called out, a grudge), said once the plan is set. {moment} is
// that moment with its time ("that fight this morning"). Endings: caught, fight, blame, rival.
// Ids: 'nrc.'.

export default {
  'vp.recall.caught': [
    { id: 'nrc.k5', turns: [{ by: 'a', conf: "{target} thought nobody noticed {moment}. I noticed, and now so does everybody else I talked to today." }] },
    { id: 'nrc.k1', turns: [{ by: 'a', conf: "I was willing to work with {target}. Then came {moment}, and that was the end of it. You don't get to do that to me and stay." }] },
    { id: 'nrc.k2', turns: [{ by: 'a', conf: "Everybody keeps asking me why {target}. Honestly, after {moment}, I'm surprised anybody has to ask." }] },
    { id: 'nrc.k3', when: { voice: ['schemer', 'calm', 'dry'] }, turns: [{ by: 'a', conf: "I don't hold grudges. I just remember things, and I remember {moment} very clearly." }] },
    { id: 'nrc.k4', when: { voice: ['warm', 'earnest', 'emotional'] }, turns: [{ by: 'a', conf: "I really trusted {target}, and {moment} hurt more than I let anybody see. So no, I'm not feeling guilty about tonight." }] },
  ],
  'vp.recall.fight': [
    { id: 'nrc.f6', turns: [{ by: 'a', conf: "Before {moment}, I didn't have a plan for tonight. Now I do, and {target} is the whole plan." }] },
    { id: 'nrc.f7', turns: [{ by: 'a', conf: "I could live with losing a challenge. What I can't live with is another day like {moment}, so {target} has to go." }] },
    { id: 'nrc.f8', when: { voice: ['dry','calm'] }, turns: [{ by: 'a', conf: "Everybody saw {moment}. Nobody's going to be shocked when they read {target}'s name tonight." }] },
    { id: 'nrc.f9', when: { voice: ['teen','goofy','chaotic'] }, turns: [{ by: 'a', conf: "Honestly, I'm still mad about {moment}, and the best part of being mad is that I get a vote." }] },
    { id: 'nrc.f10', when: { voice: ['grown'] }, turns: [{ by: 'a', conf: "I've been around long enough to know you don't keep somebody you can't share a camp with. After {moment}, that's {target}." }] },
    { id: 'nrc.f1', turns: [{ by: 'a', conf: "I started counting votes about five minutes after {moment}, and I haven't stopped since." }] },
    { id: 'nrc.f2', turns: [{ by: 'a', conf: "People think tonight is about strategy. Some of it is. Most of it is {moment}, and I'm fine admitting that." }] },
    { id: 'nrc.f3', when: { voice: ['loud', 'tough', 'competitive'] }, turns: [{ by: 'a', conf: "After {moment}? Yeah, {target}'s going. I've been waiting all day to write that name." }] },
    { id: 'nrc.f4', when: { voice: ['calm', 'dry', 'schemer'] }, turns: [{ by: 'a', conf: "I didn't say a word to {target} after {moment}. I didn't need to. I just went and found the votes." }] },
    { id: 'nrc.f5', when: { voice: ['anxious', 'warm'] }, turns: [{ by: 'a', conf: "I hate fighting with people, and {moment} made me feel sick all day. I'd rather just not have to live with {target} anymore." }] },
  ],
  'vp.recall.blame': [
    { id: 'nrc.b4', turns: [{ by: 'a', conf: "I don't mind carrying people, but after {moment}, I'd at least like to carry somebody who says thank you." }] },
    { id: 'nrc.b1', turns: [{ by: 'a', conf: "I keep thinking about {moment}. We carried {target} all day, and {target} acted like we owed {target} something." }] },
    { id: 'nrc.b2', turns: [{ by: 'a', conf: "It's not personal. Well, it's a little personal. After {moment}, I'm done picking up {target}'s slack." }] },
    { id: 'nrc.b3', when: { voice: ['loud', 'tough', 'competitive'] }, turns: [{ by: 'a', conf: "We lose because of people like {target}, and after {moment}, everybody finally sees it too." }] },
  ],
  'vp.recall.rival': [
    { id: 'nrc.r4', turns: [{ by: 'a', conf: "I didn't go looking for a reason to vote {target} out. Then came {moment}, and now I don't have to look anymore." }] },
    { id: 'nrc.r5', turns: [{ by: 'a', conf: "I wish I could say tonight was all strategy. It isn't. After {moment}, I just don't want {target} here anymore." }] },
    { id: 'nrc.r6', when: { voice: ['calm','dry','schemer'] }, turns: [{ by: 'a', conf: "You can only smile at somebody for so long. After {moment}, I'm done smiling at {target}." }] },
    { id: 'nrc.r1', turns: [{ by: 'a', conf: "{target} and I were never going to work, and after {moment}, everybody else can see it too." }] },
    { id: 'nrc.r2', turns: [{ by: 'a', conf: "I've been trying to keep the peace with {target} for days, but after {moment}, I'm not trying anymore." }] },
    { id: 'nrc.r3', when: { voice: ['cruel', 'proud', 'schemer'] }, turns: [{ by: 'a', conf: "Some people you vote out because it's smart. {target} I'm voting out because of {moment}, and I'm going to enjoy it." }] },
  ],
};
