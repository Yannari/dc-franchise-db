// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/upkeep.js — the shared end-of-week maintenance (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for the maintenance beats week.js builds from the shared
// end-of-episode systems. Kind = 'upkeep.' + the system's event type.
// intent pair | solo says whether b is there.
//
//   villainManipulation     a works b over, b feels understood
//   goatKeeping             b keeps a as an easy final two; a thinks it is exclusive
//   allianceBlindspot       a is reassured; the alliance talks about a
//   betrayalDenial          a insists b was forced to betray a
//   showmanceBlindspot      a trusts b, the partner, completely
//   providerEntitlement     a thinks chores buy safety
//   swapLoyaltyAssumption   a mistakes friendliness for a deal
//   perceptionRealization   a realises a misread the house (and b)

export default {
  'upkeep.villainManipulation.scene': [
    { id: 'ua.1', turns: [{ by: 'a', say: "You're totally right to be worried." }, { by: 'b', say: "Thank you. Nobody else listens." }, { by: 'a', dr: "I agreed with everything {b} said. I don't believe a word of it." }] },
    { id: 'ua.2', turns: [{ by: 'a', dr: "{b} poured {b.posAdj} heart out to me for an hour. Now I know exactly where {b} is weak." }] },
    { id: 'ua.3', turns: [{ by: 'b', dr: "{a} is the only person in here who gets me." }] },
    { id: 'ua.4', turns: [{ by: 'a', say: "I'm always here if you need to talk." }, { by: 'b', say: "I know." }, { by: 'a', dr: "And I'll remember all of it." }] },
    { id: 'ua.5', turns: [{ by: 'a', dr: "Reassuring {b} is easy. Meaning it is optional." }] },
    { id: 'ua.6', turns: [{ by: 'b', say: "Can I tell you something?" }, { by: 'a', say: "Anything." }, { by: 'a', dr: "Anything I can use, anyway." }] },
  ],
  'upkeep.goatKeeping.scene': [
    { id: 'ub.1', turns: [{ by: 'b', say: "You and me at the end. Promise." }, { by: 'a', say: "Promise." }, { by: 'b', dr: "I've said that to someone else too." }] },
    { id: 'ub.2', turns: [{ by: 'a', dr: "{b} and I are going to the end together. Just us." }] },
    { id: 'ub.3', turns: [{ by: 'b', dr: "{a} would be easy to beat in the final two. That's why I keep {a} close." }] },
    { id: 'ub.4', turns: [{ by: 'a', say: "It's just us, right?" }, { by: 'b', say: "Just us." }] },
    { id: 'ub.5', turns: [{ by: 'b', dr: "Everyone needs a final two they can beat. {a} is mine." }] },
    { id: 'ub.6', turns: [{ by: 'a', dr: "I trust {b} completely. {b} has never given me a reason not to." }] },
  ],
  'upkeep.allianceBlindspot.scene': [
    { id: 'uc.1', turns: [{ by: 'a', say: "The plan's the same, right?" }, { beat: 'Everyone nods. After {a} leaves, the talk turns to a vote with {a}\'s name in it.' }] },
    { id: 'uc.2', turns: [{ by: 'a', dr: "My alliance says nothing's changed. I believe them." }] },
    { id: 'uc.3', turns: [{ by: 'a', dr: "I checked in with the group. We're solid." }] },
    { id: 'uc.4', turns: [{ beat: 'The conversation stops when {a} walks back in.' }, { by: 'a', say: "Did I miss anything?" }, { beat: 'Nobody answers straight away.' }] },
    { id: 'uc.5', turns: [{ by: 'a', dr: "I'm safe. My alliance has my back." }] },
    { id: 'uc.6', turns: [{ by: 'a', say: "Anything I should know?" }, { beat: 'Several people say no at once.' }] },
  ],
  'upkeep.betrayalDenial.scene': [
    { id: 'ud.1', turns: [{ by: 'a', dr: "{b} didn't choose to turn on me. The numbers forced it. I'm sure of it." }] },
    { id: 'ud.2', turns: [{ by: 'a', say: "You didn't have a choice, did you?" }, { by: 'b', say: "...No. I didn't." }, { by: 'b', dr: "I told {a} I didn't have a choice. I did. I just couldn't say that to {a}'s face." }] },
    { id: 'ud.3', turns: [{ by: 'a', dr: "Everyone says {b} betrayed me on purpose. They don't know {b} like I do." }] },
    { id: 'ud.4', turns: [{ by: 'b', dr: "{a} has decided I was forced. I'm not going to correct {a}." }] },
    { id: 'ud.5', turns: [{ by: 'a', say: "I know it wasn't really you." }, { by: 'b', say: "Thanks." }] },
    { id: 'ud.6', turns: [{ by: 'a', dr: "{b} would never do that to me on purpose. Never." }] },
  ],
  'upkeep.showmanceBlindspot.scene': [
    { id: 'ue.1', turns: [{ by: 'a', dr: "{b} protects me above everyone else in here. I don't worry." }] },
    { id: 'ue.2', turns: [{ by: 'b', dr: "{a} thinks I tell {a} everything. I don't." }] },
    { id: 'ue.3', turns: [{ by: 'a', say: "You'd tell me if anything was going on, right?" }, { by: 'b', say: "Of course." }] },
    { id: 'ue.4', turns: [{ by: 'a', dr: "Whatever {b} is doing, it's for both of us." }] },
    { id: 'ue.5', turns: [{ by: 'b', dr: "I have meetings {a} doesn't know about. It's for {a}'s own good. Mostly." }] },
    { id: 'ue.6', turns: [{ by: 'a', dr: "I don't need to be in every conversation. {b} will tell me." }] },
  ],
  'upkeep.providerEntitlement.scene': [
    { id: 'uf.1', turns: [{ by: 'a', say: "I cook for everyone. Nobody's putting me up." }, { beat: 'Nobody answers.' }] },
    { id: 'uf.2', turns: [{ by: 'a', dr: "I do the dishes. I clean the bathroom. That has to count for something." }] },
    { id: 'uf.3', turns: [{ by: 'a', say: "After everything I do round here?" }, { beat: 'Somebody shrugs.' }] },
    { id: 'uf.4', turns: [{ by: 'a', dr: "I keep this house running. Surely that buys me a week." }] },
    { id: 'uf.5', turns: [{ by: 'a', dr: "Everyone eats my food. Nobody will vote me out. Right?" }] },
    { id: 'uf.6', turns: [{ by: 'a', say: "Who made dinner last night? Me. Just saying." }] },
  ],
  'upkeep.swapLoyaltyAssumption.scene': [
    { id: 'ug.1', turns: [{ by: 'a', dr: "A few friendly chats, and now I've got friends. That's how it works, right?" }] },
    { id: 'ug.2', turns: [{ by: 'a', dr: "Nobody has promised me anything. But I feel safe. That's the same thing." }] },
    { id: 'ug.3', turns: [{ by: 'a', say: "We're good, aren't we?" }, { beat: 'The other person smiles politely.' }] },
    { id: 'ug.4', turns: [{ by: 'a', dr: "I think people really like me in here. I'll be fine." }] },
    { id: 'ug.5', turns: [{ by: 'a', dr: "I've decided I'm safe. Nobody's told me otherwise." }] },
    { id: 'ug.6', when: { intent: 'pair' }, turns: [{ by: 'a', say: "So we're working together now?" }, { by: 'b', say: "We're friends." }, { by: 'a', dr: "{b} says we're friends. In this house that's the same thing as an alliance, whether {b} admits it or not." }] },
  ],
  'upkeep.perceptionRealization.scene': [
    { id: 'uh.1', when: { intent: 'pair' }, turns: [{ by: 'a', dr: "I compared what {b} said with how {b} voted. They don't match. They never did." }] },
    { id: 'uh.2', when: { intent: 'pair' }, turns: [{ by: 'a', dr: "I thought {b} was my friend. {b} was never my friend." }] },
    { id: 'uh.3', turns: [{ by: 'a', dr: "I went back over the week. I had it all wrong." }] },
    { id: 'uh.4', turns: [{ by: 'a', dr: "I misread everything. Where I stood. Who I trusted. All of it." }] },
    { id: 'uh.5', turns: [{ by: 'a', dr: "It's a horrible feeling, realising you were the only one who believed it." }] },
    { id: 'uh.6', when: { intent: 'pair' }, turns: [{ by: 'a', say: "Was any of it real, {b}?" }, { by: 'b', say: "Some of it." }, { by: 'a', dr: "'Some of it.' That's worse than if {b} had said none of it." }] },
  ],
};
