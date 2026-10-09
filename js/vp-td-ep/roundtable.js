// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/roundtable.js — the jury roundtable as a conversation, not a form
// ══════════════════════════════════════════════════════════════════════
//
// The user (2026-10-09): "the roundtable is super repetitive: no debate, no drama, no comedy, no
// argument, no emotion", and "make sure you respect their voices". Disventure Camp's "Panel of
// Peers" roundtable is the model: one juror hosts, each finalist gets a different kind of segment (a
// fight that escalates, a surprise when the person with every reason to hate them praises them, a
// friend who snaps, a quick-fire round, a long bitter speech), the jurors interrupt each other, old
// feuds from the motel flare up again, and the host juror cracks jokes to move it on.
//
// Every line is written for the five ways people differ at a table (td/story/voice-family.js:
// sharp, dry, loud, soft, odd), and each juror says it their own way: a venomous juror cuts with a
// smile, a blunt one just says it, a soft one gets choked up, a dry one undercuts everybody.
//
// PURE. Everything a juror says is true of the record the caller hands in: immunity wins, whose
// names the finalist wrote, the bonds, the motel's own storylines. The same episode always plays the
// same way.

const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pickBy = (arr, ...k) => arr[hash(k.join('|')) % arr.length];
const WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const num = n => WORD[n] || String(n);
const times = n => (n === 1 ? 'once' : n === 2 ? 'twice' : `${num(n)} times`);
const Cap = t => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * ctx: {
 *   mod, at (names at the table), fins, plan: [{ f, backer, doubter, cut (jurors f voted out), reason, friend }],
 *   bond(a, b), wins(f), arch(n), fam(n) ('sharp'|'dry'|'loud'|'soft'|'odd'|'plain'), pr(n) → { sub, obj, posAdj },
 *   couple(f) → partner or null, grudge: { a, b, madeUp } | null, bitter: { juror, target } | null, key
 * }
 * Returns the steps (say and beat).
 */
export function roundtableTalk(ctx) {
  const { mod, at, plan, bond, wins, arch, pr, key } = ctx;
  const out = [];
  const fam = n => { try { return ctx.fam(n) || 'plain'; } catch { return 'plain'; } };
  // a line in the speaker's own way: { sharp, dry, loud, soft, odd, any } → their family's options
  const V = (n, tag, o) => pickBy(o[fam(n)] || o.any, key, tag, n);
  const say = (by, text, extra = {}) => { if (by && at.includes(by) && text) out.push({ k: 'say', by, text, focus: [by], ...extra }); };
  const beat = (text, focus = [], extra = {}) => out.push({ k: 'beat', text, focus, ...extra });
  const heated = [];
  const loudVoice = n => fam(n) === 'loud';

  // the host juror opens
  say(mod, V(mod, 'open', {
    loud: [`Okay, everybody, quiet down. Jury roundtable. We talk about every one of them still in there, and nobody leaves until we're done.`, `Welcome to the jury roundtable! Rules: be honest, be loud, and nobody throws anything at anyone.`],
    soft: [`Hi, everyone! Welcome to the jury roundtable. We're going to talk about each of them, honestly, and kindly. Mostly kindly.`, `Okay! Welcome to the jury roundtable, hosted by me. Let's be honest, but let's be nice about it.`],
    sharp: [`Welcome to the jury roundtable. ${Cap(num(ctx.fins.length))} people want our votes. Let's find out which of them deserves to beg.`, `Jury roundtable. Hosted by me, obviously. Let's take them apart, one at a time, politely.`],
    dry: [`Welcome to the jury roundtable, where we decide the fate of people who are currently eating better than us.`, `Okay. Jury roundtable. One finalist at a time. Try to keep it under three hours.`],
    odd: [`Ladies and gentlemen, welcome to the jury roundtable! I'm your host, and tonight, we spill everything!`, `Welcome, welcome, welcome to the jury roundtable! Please hold your applause. Actually, don't. Applaud.`],
    any: [`Hello, everyone, and welcome to the jury roundtable, where we go through everyone still in the game, one at a time. Hosted by me.`, `Okay. Jury roundtable. We talk about every one of them still in there, and we're honest. That's the only rule.`],
  }), { loud: loudVoice(mod) });

  // each finalist gets the segment their record makes most interesting, and no two the same
  const used = new Set();
  const SHAPES = ['clash', 'surprise', 'pileon', 'poll', 'bitter'];
  const fits = p => {
    const f = p.f, haters = at.filter(j => j !== mod && bond(j, f) <= -2), fans = at.filter(j => j !== mod && bond(j, f) >= 4);
    return {
      bitter: !!(ctx.bitter && ctx.bitter.target === f && at.includes(ctx.bitter.juror)),
      surprise: !!(p.reason && at.includes(p.reason) && bond(p.reason, f) >= 1),
      pileon: haters.length >= 2 && fans.length >= 1,
      clash: !!(p.backer && p.doubter && p.backer !== p.doubter),
      poll: at.length >= 4,
    };
  };
  plan.forEach((p, i) => {
    const can = fits(p);
    const shape = ['bitter', 'surprise', 'pileon', 'clash', 'poll'].find(s => can[s] && !used.has(s)) || SHAPES.find(s => can[s]) || 'poll';
    used.add(shape);
    intro(p, i);
    ({ clash, surprise, pileon, poll, bitter }[shape])(p);
    feud(p);
    moveOn(p, i);
  });

  // the end: the host wraps it, and checks on whoever it got hot for
  say(mod, V(mod, 'close', {
    loud: [`That's it! Roundtable's over! Everybody go cool off.`, `Okay, we're done before somebody actually throws a chair. See you at the finale.`],
    soft: [`That's the roundtable. Thank you, everyone, really. That wasn't easy. See you at the finale.`, `Okay, that's all of them. I love you all, even the ones who were mean. See you at the finale.`],
    sharp: [`And that's the roundtable. Very informative. Some of you should be embarrassed.`, `That's all of them. I learned a lot about this table, and none of it was flattering.`],
    dry: [`And that's the roundtable. Nobody changed their mind, but we all feel very heard.`, `Okay. That's the roundtable. Same time never.`],
    odd: [`And that's our show! Thank you for coming, tip your host, see you at the finale!`, `That's all the time we have! Roll credits!`],
    any: [`And that's all the time we have! You've given each other a lot to think about. Now we wait for the finale.`, `Okay. I think we've all said enough. Probably more than enough. See you at the finale.`],
  }));
  const hot = heated.find(n => n !== mod);
  if (hot) {
    beat(`The table breaks up. ${mod} catches up with ${hot} on the way out.`, [mod, hot]);
    say(mod, V(mod, 'chk', { sharp: [`That was quite a show you put on.`], dry: [`So. That happened.`], loud: [`You good? You looked like you were going to flip the table.`], any: [`You okay? That got kind of heated.`] }), { focus: [mod, hot] });
    say(hot, V(hot, 'chk2', {
      loud: [`I'm fine. I meant every word, and I'd say it again.`],
      sharp: [`I'm perfectly fine. I said exactly what I meant to say.`],
      soft: [`I don't know. I don't love who I was back there.`, `I didn't think I'd get that upset. It's been a long week.`],
      dry: [`I'm fine. I've been saving that up for a while, apparently.`],
      odd: [`Me? Heated? I was barely even warm.`],
      any: [`I'm okay. I didn't think I'd get that worked up.`],
    }), { focus: [mod, hot] });
    say(mod, V(mod, 'chk3', { sharp: [`Save some of it for the finale. They'll deserve it more.`], any: [`For what it's worth, I'd rather you say it here than sit on it until the finale.`, `It's okay. That's what this is for.`] }), { focus: [mod, hot] });
  }
  return out;

  // ── the pieces ────────────────────────────────────────────────────
  function intro(p, i) {
    const f = p.f, w = wins(f), c = p.cut.filter(j => at.includes(j)).length, a = arch(f), partner = ctx.couple?.(f);
    const lead = i === 0 ? `Let's start with` : i === plan.length - 1 ? `And finally,` : pickBy([`Next,`, `Moving on to`, `Next up,`], key, 'lead', i);
    const lines = [];
    if (w >= 2) lines.push(`the person none of us could beat in a challenge. ${Cap(times(w))} with immunity: ${f}!`, `our challenge machine, who won immunity ${times(w)}: ${f}!`);
    if (c >= 3) lines.push(`the reason ${num(c)} of us have a tan: ${f}!`, `the person who wrote more of our names down than any of us want to remember: ${f}!`);
    if (partner) lines.push(`one half of this season's favourite couple: ${f}!`);
    if (/villain|schemer|mastermind/.test(a)) lines.push(`the one every single one of us trusted at least once: ${f}!`);
    if (/hero|loyal-soldier|social-butterfly/.test(a)) lines.push(`the nicest person in the game, which in this game is a warning sign: ${f}!`);
    if (/floater|goat|underdog/.test(a)) lines.push(`the person who is somehow still there, and nobody can explain how: ${f}!`);
    if (!lines.length) lines.push(`${f}!`);
    say(mod, `${lead} ${pickBy(lines, key, 'intro', f)}`, { side: [{ tab: 'log', text: `On ${f}: ${p.backer || '?'} for, ${p.doubter || '?'} against` }] });
  }
  // the case for, the attack, the comeback, and it gets personal
  function clash(p) {
    const f = p.f, B = p.backer, D = p.doubter, P = pr(f), w = wins(f), c = p.cut.filter(j => at.includes(j)).length;
    say(B, caseFor(B, f, w, c, P));
    say(D, attack(D, f, w, c, P, p), { loud: loudVoice(D) });
    say(B, V(B, 'counter', {
      loud: [`Oh, come on! Name one person in there who played harder. Go on. Name one.`, `At least ${f} made moves! What was your big move, ${D}? Getting voted out?`],
      sharp: [`Strong words from somebody ${f} outlasted.`, `That's a brave thing to say from a motel lounger, ${D}.`],
      dry: [`Interesting. And what was your strategy again, ${D}? Hoping?`, `You'd have voted for ${f} in a heartbeat if ${f} had kept you around.`],
      soft: [`That's not fair, ${D}. ${f} had to make hard calls. All of us did.`, `I just think ${f} deserves a little more credit than that.`],
      odd: [`Objection! That's slander. Possibly libel. I don't know the difference, but it's one of them.`],
      any: [`Name one person in there who played harder. Go on. I'll wait.`, `You'd have voted for ${f} in a heartbeat if ${f} had kept you around.`],
    }));
    beat(pickBy([`A couple of people at the table go "Ooh."`, `Somebody at the end of the table laughs and turns it into a cough.`, `The fire pops. Nobody else makes a sound.`], key, 'ooh', f), [B, D]);
    if (p.cut.includes(D)) {
      say(D, V(D, 'personal', {
        loud: [`Are you kidding me? ${f} looked me in the eye the morning of my vote and told me I was safe!`, `I know exactly what ${f}'s big move was. It was me!`],
        sharp: [`I know exactly what ${f}'s big move was. I was it, and I'm still deciding whether to be flattered.`, `${f} told me I was safe that morning. I'd love to know how ${f} kept a straight face.`],
        soft: [`${f} told me I was safe. I believed it. That's the part I can't get past.`],
        dry: [`Easy for you to say. ${f} didn't write your name down.`],
        any: [`That's rich. ${f} looked me in the eye the morning of my vote and told me I was safe.`, `Easy for you to say. ${f} didn't write your name down.`],
      }), { loud: true });
      heated.push(D);
    } else say(D, V(D, 'personal2', {
      sharp: [`I'm not saying ${f} didn't play. I'm saying ${f} didn't play nearly as well as ${f} thinks.`],
      dry: [`"Made moves" and "made good moves" aren't the same thing.`],
      loud: [`Moves? Getting dragged to the end isn't a move!`],
      any: [`I'm not saying ${f} didn't play. I'm saying ${f} didn't play as well as ${f} thinks.`, `Fine. But "made moves" isn't the same as "made good moves".`],
    }));
    const x = at.find(j => j !== mod && j !== B && j !== D && ['dry', 'odd'].includes(fam(j))) || at.find(j => j !== mod && j !== B && j !== D);
    if (x) say(x, V(x, 'comic', {
      dry: [`I'm sorry, this is better than anything on the feeds.`, `Should we give them a minute? They clearly need a minute.`],
      odd: [`Can we pause this? I want to get snacks before round two.`, `Somebody get popcorn. Somebody please get popcorn.`],
      soft: [`Guys. Guys. Can we be nice? Please?`],
      any: [`Should we give them a minute? They clearly need a minute.`, `Can we pause this? I want to get snacks before round two.`],
    }));
  }
  // the one with every reason to hate them doesn't
  function surprise(p) {
    const f = p.f, R = p.reason, P = pr(f);
    say(mod, `Let's hear from the person with the most reason not to want ${f} to win. ${R}?`);
    beat(`Everyone at the table turns to ${R}.`, [R]);
    say(R, V(R, 'sur', {
      sharp: [`${f} beat me. It was well done. I hate that it was well done.`],
      dry: [`${f} voted me out, and it was the right call. I'd have done the same thing.`],
      loud: [`Honestly? ${f} deserves it. There, I said it. Don't make it weird.`],
      soft: [`${f} beat me fair and square. I was hurt, but I'm not going to pretend ${f} didn't play well.`],
      odd: [`${f}? Love ${f}. Big fan. Ignore the part where ${f} voted me out.`],
      any: [`Honestly? ${f} deserves it.`, `${f} beat me. That's the game, and I respect it.`],
    }));
    const Q = p.doubter && p.doubter !== R ? p.doubter : mod;
    say(Q, V(Q, 'sur2', {
      loud: [`Wait, what? ${f} sent you here!`, `Are you serious right now?`],
      sharp: [`How generous of you. I'm sure ${f} will be very touched.`],
      dry: [`I'm sorry, who are you and what have you done with ${R}?`],
      any: [`Wait. Are you serious, ${R}?`, `That's it? That's all you've got?`],
    }), { loud: loudVoice(Q) });
    say(R, V(R, 'sur3', {
      soft: [`I've had a week to think about it. I was angry for about two days. Then I watched the feeds.`],
      sharp: [`Bitterness is a terrible look on a juror. I'll leave it to the rest of you.`],
      loud: [`Being mad doesn't change anything. ${f} played better than me. Moving on.`],
      dry: [`I'm not going to pretend I'd have done it differently. I wouldn't have.`],
      any: [`I've had a week to think about it. I was angry for about two days. Then I watched the feeds.`, `I'm not going to pretend I'd have done it differently.`],
    }));
    say(mod, V(mod, 'sur4', {
      dry: [`Well. That was weirdly mature. I hate it.`], odd: [`Okay, who replaced ${R} with a reasonable person?`], sharp: [`How disappointingly civil.`],
      any: [`That's... not the fireworks I was expecting.`, `Well. That was weirdly mature. I hate it.`],
    }));
    if (p.backer && p.backer !== R) say(p.backer, caseFor(p.backer, f, wins(f), p.cut.filter(j => at.includes(j)).length, P));
  }
  // two go after them, a friend snaps
  function pileon(p) {
    const f = p.f, P = pr(f);
    const haters = at.filter(j => j !== mod && bond(j, f) <= -2).sort((a, b) => bond(a, f) - bond(b, f)).slice(0, 2);
    const fan = p.friend && at.includes(p.friend) ? p.friend : at.filter(j => j !== mod && !haters.includes(j)).sort((a, b) => bond(b, f) - bond(a, f))[0];
    say(haters[0], attack(haters[0], f, wins(f), p.cut.filter(j => at.includes(j)).length, P, p), { loud: loudVoice(haters[0]) });
    say(haters[1], V(haters[1], 'pile', {
      loud: [`And don't get me started on how ${f} treated people at camp!`, `I'll go further. ${f} only ever looked out for number one.`],
      sharp: [`I'd add that ${f} was charming to your face and very different behind your back. But that's just my experience.`],
      dry: [`Agreed. And ${f} smiled the entire time.`],
      any: [`I'll go further. ${f} only ever looked out for number one.`, `Agreed. And ${f} smiled the whole time.`],
    }));
    say(haters[0], V(haters[0], 'pile2', { loud: [`Thank you!`, `See? It's not just me!`], sharp: [`Thank you. Finally, someone's paying attention.`], any: [`Exactly. Exactly that.`] }));
    if (fan) {
      say(fan, V(fan, 'fan', {
        soft: [`Can everyone stop? ${f} is my friend, and ${f} looked after me out there. You're all just mad you're not in there.`, `Okay, enough. ${f} was the first person out there who made me feel like I belonged. I'm not going to sit here and listen to this.`],
        loud: [`Oh, give it a rest, both of you! You're mad you got outplayed. Just say it!`],
        sharp: [`It's adorable how you two think repeating yourselves makes it true.`],
        dry: [`So the argument is "${f} played the game, and we didn't like it". Great. Very convincing.`],
        odd: [`Excuse me! ${f} once gave me half a sandwich when I was starving. Case closed.`],
        any: [`Can everyone stop? ${f} played a real game. You're all just mad you're not in there.`],
      }), { loud: true });
      if (fam(fan) === 'soft') beat(`${fan}'s voice cracks on the last word. The table goes quiet.`, [fan], { act: { kind: 'cry', who: [fan] } });
      else beat(`Nobody says anything for a few seconds.`, [fan]);
      heated.push(fan);
    }
    say(mod, V(mod, 'pileend', {
      soft: [`Let's all take one breath. Just one. Okay.`], sharp: [`Lovely. Truly. Moving on.`], loud: [`Okay! Feelings! Love that for us. Next!`],
      any: [`Okay! Feelings! Love that for us. Moving on before somebody cries.`, `Let's all take one breath. Just one. Okay.`],
    }));
  }
  // one word each, quick, and it goes sideways
  function poll(p) {
    const f = p.f;
    say(mod, pickBy([`Quick round. One word for ${f}. Go.`, `Lightning round! One word for ${f}. No speeches.`], key, 'poll', f));
    const voters = at.filter(j => j !== mod).sort((a, b) => hash(`${a}|${f}`) - hash(`${b}|${f}`)).slice(0, 4);
    const WORDS = {
      hi: { sharp: ['Formidable.', 'Competent.'], dry: ['Deserving.', 'Underrated.'], loud: ['Winner!', 'Legend!'], soft: ['Lovely.', 'Kind.'], odd: ['Magnificent!', 'Iconic.'], any: ['Brilliant.', 'Deserving.'] },
      lo: { sharp: ['Transparent.', 'Adequate.'], dry: ['Lucky.', 'Overrated.'], loud: ['Snake!', 'Nope!'], soft: ['Disappointing.', 'Hurtful.'], odd: ['Crunchy.', 'Weird.'], any: ['Snake.', 'Overrated.'] },
      mid: { sharp: ['Present.', 'Fine.'], dry: ['Present.', 'Sure.'], loud: ['Whatever!', 'Fine!'], soft: ['Nice?', 'Okay?'], odd: ['Spaghetti.', 'Purple.'], any: ['Fine?', 'Present.'] },
    };
    let odd = null, present = null;
    for (const v of voters) {
      const b = bond(v, f), o = WORDS[b >= 3 ? 'hi' : b <= -2 ? 'lo' : 'mid'];
      const w = pickBy(o[fam(v)] || o.any, key, 'pw', f, v);
      if (w === 'Present.' && !present) present = v;
      if ((w === 'Spaghetti.' || w === 'Purple.' || w === 'Crunchy.') && !odd) odd = v;
      say(v, w, { loud: b <= -2 && loudVoice(v) });
    }
    if (odd) { say(mod, `${odd}, that's not a word for a person.`); say(odd, V(odd, 'oddw', { any: [`It is for ${f}. Trust me.`, `It felt right. I stand by it.`] })); }
    else if (present) { say(voters.find(v => v !== present), `"Present" isn't a word you use for a person.`); say(present, `It is for ${f}.`); }
    else {
      const gusher = voters.find(v => bond(v, f) >= 3), skeptic = voters.find(v => bond(v, f) <= -2);
      if (gusher) say(gusher, V(gusher, 'gush', { soft: [`Can I have one more? Kind, smart, and honestly the best person in that whole game.`], any: [`One word isn't enough. I need a paragraph.`] }));
      if (gusher && skeptic) say(skeptic, V(skeptic, 'eye', { sharp: [`We know, dear. We heard you the first time.`], loud: [`Oh, please!`], any: [`We get it. You love ${f}.`] }));
    }
  }
  // the juror who has waited all week to say it
  function bitter(p) {
    const f = p.f, J = ctx.bitter.juror;
    say(mod, `${J}, I think you've been waiting for this one.`);
    say(J, V(J, 'bit0', { sharp: [`Oh, I've been patient. I'm very good at patient.`], loud: [`You have no idea.`], any: [`I have. All week.`] }));
    say(J, V(J, 'bit1', {
      sharp: [`${f} sat next to me, told me I was safe, and wrote my name down an hour later. And now ${f} would like my vote. I think that's very brave.`],
      loud: [`${f} told me I was safe, then wrote my name down an hour later! And now ${f} wants my vote? Are you kidding me?`],
      soft: [`Every day in this motel I've thought about that vote. ${f} didn't just beat me. ${f} lied to me, and I really trusted ${f}.`],
      dry: [`${f} told me I was safe, then voted me out the same night. I'd call it a good move if it hadn't been done to me.`],
      odd: [`${f} looked me right in the eyes, which are my best feature, and lied. To my eyes. I'll never forget it.`],
      any: [`${f} sat next to me at camp, told me I was safe, and then wrote my name down an hour later. And now ${f} wants my vote?`],
    }), { loud: true });
    const def = p.backer && p.backer !== J ? p.backer : at.find(j => j !== mod && j !== J && bond(j, f) >= 2);
    if (def) {
      say(def, V(def, 'bit2', { loud: [`It's a game! Everybody lied to somebody!`], dry: [`You'd have done the exact same thing if you'd thought of it first.`], sharp: [`Darling, it's a game. That's the job.`], any: [`It's a game. Everybody lied to somebody.`] }));
      say(J, V(J, 'bit3', { sharp: [`Then ${f} should have no trouble explaining it at the finale. I'll be listening.`], soft: [`I know. It still hurt, and I'm allowed to say that.`], any: [`I don't need you to agree with me. I need ${f} to hear it at the finale.`] }), { loud: true });
    }
    heated.push(J);
    say(mod, V(mod, 'bit4', { dry: [`Noted. Very loudly noted.`], odd: [`Okay. I think ${f} heard that from inside the game.`], any: [`Noted. Very loudly noted.`, `Okay. I think ${f} heard that from inside the game.`] }));
  }
  // the motel's own feud flares up at the table (the grudge pair, on opposite sides of a finalist)
  function feud(p) {
    const g = ctx.grudge;
    if (!g || g.done || !at.includes(g.a) || !at.includes(g.b)) return;
    const f = p.f, da = bond(g.a, f), db = bond(g.b, f);
    if (Math.sign(da) === Math.sign(db) || Math.abs(da - db) < 3) return;
    g.done = true;
    const [fan, foe] = da > db ? [g.a, g.b] : [g.b, g.a];
    say(foe, V(foe, 'feud1', { sharp: [`Of course you'd say that, ${fan}. You've never once been right about anyone.`], loud: [`Oh, of course YOU'D say that, ${fan}!`], any: [`Of course you'd say that, ${fan}.`] }));
    say(fan, V(fan, 'feud2', { dry: [`And here we go.`], loud: [`Don't start with me!`], any: [`Here we go.`] }));
    const w = at.find(j => j !== mod && j !== fan && j !== foe) || mod;
    say(w, g.madeUp ? `Wait, I thought you two made up?` : `Do you two want the room? We can leave.`);
    say(foe, g.madeUp ? `We did. I still think ${fan} is wrong about everything.` : `No. I want ${fan} to admit I'm right.`);
    beat(`Half the table laughs. ${fan} throws a napkin at ${foe}.`, [fan, foe], { act: { kind: 'laugh', who: [fan, foe] } });
  }
  function moveOn(p, i) {
    if (i === plan.length - 1) return;
    say(mod, V(mod, `next${i}`, {
      loud: [`Okay, next! Before somebody throws a chair.`, `Next! I'm not refereeing that again.`],
      soft: [`Let's all take a breath. Next one!`, `Okay, deep breaths, everybody. Next!`],
      sharp: [`Fascinating. All of you. Next.`, `Write that down, everybody. Next.`],
      dry: [`Great. Very healthy. Next.`, `Moving on before this becomes a support group.`],
      odd: [`And on that beautiful note, NEXT!`, `Lovely! Next contestant, come on down!`],
      any: [`Moving on.`, `Okay. Next.`, `Right. Let's keep going.`],
    }));
  }

  // the case for a finalist, from what they did, in the speaker's voice
  function caseFor(by, f, w, c, P) {
    if (w >= 2) return V(by, 'for', {
      loud: [`${f} won immunity ${times(w)}! You don't do that by accident!`], sharp: [`${f} won immunity ${times(w)}. Say what you like about ${P.obj}, ${f} is hard to beat.`],
      dry: [`${f} won immunity ${times(w)}. I counted. It's a lot.`], soft: [`${f} kept winning when it mattered. I think that deserves something.`],
      any: [`${f} won immunity ${times(w)}. You don't do that by accident.`, `You want a winner? ${f} kept winning when it mattered.`] });
    if (c >= 2) return V(by, 'for', {
      loud: [`${f} ran the votes! ${Cap(num(c))} of us are sitting here because of ${P.obj}. That's a résumé!`], sharp: [`${f} decided who went home, and ${num(c)} of us are the proof. That is what winning looks like.`],
      dry: [`${f} ran the votes. ${Cap(num(c))} of us are evidence.`], soft: [`${f} made the hard calls. I didn't like all of them, but ${f} made them.`],
      any: [`${f} ran the votes. ${Cap(num(c))} of us are sitting here because of ${P.obj}, and that's a résumé.`, `Every big vote this season had ${f} behind it. That's how you play this game.`] });
    return V(by, 'for', {
      loud: [`${f} made it this far! Everybody in there wanted ${P.obj} gone, and ${f} is still there!`], dry: [`${f} is still in there, and we're out here. That's the whole argument.`],
      soft: [`${f} played the people, not just the challenges. That's the hardest part of this game.`], sharp: [`${f} survived. In that game, with those people, that's not nothing.`],
      any: [`${f} made it this far, and everybody in there wanted ${P.obj} gone at some point. That counts for something.`, `${f} played the people, not just the challenges. That's the hardest part of this game.`] });
  }
  // the case against, from what they did (a finalist who voted out half the table is never a floater)
  function attack(by, f, w, c, P, p) {
    if (c >= 2) return V(by, 'against', {
      loud: [`${f} voted out ${num(c)} of us! I'm not handing ${P.obj} the money for that!`], sharp: [`${f} sent ${num(c)} of us here. I'm sure ${f} would love our votes as a thank-you.`],
      dry: [`${Cap(num(c))} people at this table are here because of ${f}. Just putting that on the record.`], soft: [`${f} voted out ${num(c)} of us. I can't just pretend that didn't hurt.`],
      any: [`${f} voted out ${num(c)} of us. I'm not handing ${P.obj} the money for that.`, `${Cap(num(c))} people at this table are here because of ${f}. Let's not forget that.`] });
    if (w >= 2) return V(by, 'against', {
      loud: [`Winning challenges isn't playing! Who did ${f} actually vote out?`], sharp: [`${f} is very good at running and holding things. So is a dog.`],
      dry: [`${f} won challenges and let everybody else make the moves.`], any: [`Winning challenges isn't the same as playing. Who did ${f} actually vote out?`, `${f} won challenges and let everybody else make the moves.`] });
    if (!p.cut.length) return V(by, 'against', {
      loud: [`${f} floated! The whole game! I'm not rewarding that!`], sharp: [`${f} drifted to the end like a pool float. Very relaxing to watch.`],
      dry: [`${f} never had to make a hard call. It's easy to look clean when somebody else does the dirty work.`], soft: [`I like ${f}, I do. I just don't know what ${f} actually did.`],
      any: [`${f} floated. I'm not rewarding somebody who never put ${P.posAdj} own neck out.`, `${f} never had to make a hard call. It's easy to look clean when somebody else does the dirty work.`] });
    return V(by, 'against', {
      loud: [`${f} rode everybody else's numbers to the end! That's not earning it!`], sharp: [`${f} hid behind other people's plans all game, and now it's a résumé? Charming.`],
      dry: [`${f} rode other people's numbers to the end. Being there isn't the same as earning it.`],
      any: [`${f} rode other people's numbers to the end. Being there isn't the same as earning it.`, `${f} hid behind other people's plans all game.`] });
  }
}
