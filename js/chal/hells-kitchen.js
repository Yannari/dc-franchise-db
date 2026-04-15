// js/chal/hells-kitchen.js
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, romanticCompat, tribeColor, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

export function simulateHellsKitchen(ep) {
  const tribes = gs.tribes;
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const host = seasonConfig.host || 'Chris';
  const epNum = (gs.episode || 0) + 1;

  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });

  const allMembers = tribes.flatMap(t => t.members);
  const tribeOf = {};
  tribes.forEach(t => t.members.forEach(m => { tribeOf[m] = t.name; }));

  // ── Dish Pools ──
  const appetizerPool = [
    { name: 'Bruschetta', desc: 'Toasted bread, fresh tomatoes, basil. Simple but easy to mess up.' },
    { name: 'Shrimp Cocktail', desc: 'Chilled shrimp with cocktail sauce. Timing is everything.' },
    { name: 'Caesar Salad', desc: 'Romaine, croutons, parmesan. The dressing makes or breaks it.' },
    { name: 'Spring Rolls', desc: 'Rice paper, vegetables, dipping sauce. Delicate work.' },
    { name: 'Caprese Skewers', desc: 'Mozzarella, tomato, basil on sticks. Presentation matters.' },
    { name: 'Stuffed Mushrooms', desc: 'Mushroom caps with herbed filling. Oven timing critical.' },
    { name: 'Soup du Jour', desc: "Chef's choice soup. Wide variance — could be brilliant or terrible." },
    { name: 'Charcuterie Board', desc: 'Cured meats, cheeses, crackers. Assembly art.' },
    { name: 'Deviled Eggs', desc: 'Classic but judged harshly if bland. Spice game matters.' },
    { name: 'Ceviche', desc: 'Raw fish cured in citrus. Bold choice. High risk, high reward.' },
    { name: 'French Onion Soup', desc: 'Caramelized onions, gruyère, crusty bread. Takes patience.' },
    { name: 'Crab Cakes', desc: 'Pan-seared crab patties. Expensive ingredients, pressure not to waste them.' },
    { name: 'Tartare', desc: 'Raw beef, capers, egg yolk. Intimidating. Judges love it or hate it.' },
    { name: 'Gyoza', desc: 'Pan-fried dumplings. Folding technique separates good from great.' },
    { name: 'Antipasto Platter', desc: 'Italian meats, olives, roasted peppers. The classic.' }
  ];
  const mainPool = [
    { name: 'Spaghetti Bolognese', desc: 'Pasta with meat sauce. Comfort food. Hard to make memorable.' },
    { name: 'Grilled Salmon', desc: "Cedar-planked salmon with lemon. Don't overcook it." },
    { name: 'Beef Wellington', desc: 'Tenderloin in puff pastry. The ultimate test — soggy bottom = death.' },
    { name: 'Chicken Parmesan', desc: 'Breaded chicken, marinara, mozzarella. Crowd pleaser.' },
    { name: 'Lamb Chops', desc: 'Herb-crusted, pan-seared. Temperature is everything.' },
    { name: 'Stir-Fry', desc: 'Wok-fired vegetables and protein. Speed cooking.' },
    { name: 'Risotto', desc: 'Arborio rice, constant stirring. Patience challenge.' },
    { name: 'BBQ Ribs', desc: 'Slow-cooked, sauce-glazed. Time-intensive but impressive.' },
    { name: 'Fish Tacos', desc: 'Grilled fish, slaw, lime crema. Fresh and fast.' },
    { name: 'Pad Thai', desc: 'Rice noodles, tamarind sauce, peanuts. Balance of flavors.' },
    { name: 'Roast Chicken', desc: 'Whole bird, roasted vegetables. Simple but the host judges harshly.' },
    { name: 'Lasagna', desc: 'Layered pasta, meat sauce, béchamel. Architecture matters.' },
    { name: 'Surf & Turf', desc: 'Steak and lobster tail. Luxury dish, two things to cook perfectly.' },
    { name: 'Curry', desc: 'Spiced stew with rice. Flavor depth is the test.' },
    { name: 'Pork Tenderloin', desc: 'Herb-rubbed, pan-seared, oven-finished. Resting time matters.' }
  ];
  const dessertPool = [
    { name: 'Crème Brûlée', desc: 'Custard with caramelized sugar top. Torch required — fire risk.' },
    { name: 'Chocolate Lava Cake', desc: 'Molten center, timing critical. 30 seconds too long = solid disappointment.' },
    { name: 'Flambé Bananas Foster', desc: 'Bananas in rum sauce, lit on fire. Could explode.' },
    { name: 'Tiramisu', desc: 'Layers of mascarpone, espresso-soaked ladyfingers. No-bake but complex.' },
    { name: 'Apple Pie', desc: 'Classic. Lattice crust separates amateurs from pros.' },
    { name: 'Cheesecake', desc: 'New York style. Dense, creamy, needs time to set.' },
    { name: 'Panna Cotta', desc: 'Italian custard with berry coulis. Wobble factor — did it set?' },
    { name: 'Soufflé', desc: 'Risen egg dish. Collapses if you look at it wrong. Highest variance dessert.' },
    { name: 'Tarte Tatin', desc: 'Upside-down apple tart. The flip is the moment of truth.' },
    { name: 'Profiteroles', desc: 'Choux pastry puffs with chocolate. Assembly line work.' },
    { name: 'Macarons', desc: 'French almond cookies. Notoriously difficult. Bragging rights if pulled off.' },
    { name: 'Brownies', desc: 'Easy to make, hard to make special. The host expects more.' },
    { name: 'Fruit Tart', desc: 'Pastry cream, fresh fruit, glaze. Presentation is 80% of the score.' },
    { name: 'Baked Alaska', desc: 'Ice cream inside meringue, torched. Another fire risk.' },
    { name: 'Churros', desc: "Fried dough, chocolate sauce. Fun but is it 'fine dining'?" },
    { name: 'Éclairs', desc: 'Choux pastry, cream filled, chocolate topped. Piping technique matters.' }
  ];

  // ── Host Reaction Pools ──
  const hostReactions = {
    disaster: [
      `${host} takes one bite and immediately spits it into a napkin.`,
      `${host} stares at the plate for a long time. Then pushes it away without a word.`,
      `${host} gags. Actually gags. The kitchen goes silent.`,
      `"What... is this?" ${host} asks. Nobody answers.`,
      `${host} takes the plate and dumps it directly in the trash.`
    ],
    bad: [
      `${host} grimaces. "I've had better from a vending machine."`,
      `${host} finishes the bite but clearly wishes they hadn't.`,
      `"It's... food. Technically," ${host} says.`,
      `${host} takes two bites and sets down the fork. That's all they need.`
    ],
    mediocre: [
      `${host} shrugs. "It's fine. Just... fine."`,
      `"Not bad, not great. Middle of the road," ${host} says.`,
      `${host} eats it without complaint, which might be the worst review of all.`,
      `"I've had worse. I've also had much better."`
    ],
    good: [
      `${host} nods approvingly. "Now you're cooking."`,
      `"Okay, I see you," ${host} says with a half-smile.`,
      `${host} finishes the entire plate. That says everything.`,
      `"This is solid. Real solid," ${host} says, reaching for more.`
    ],
    excellent: [
      `${host} stops mid-bite. Closes their eyes. "Yeah. That's the one."`,
      `"Where has THIS been all season?" ${host} says.`,
      `${host} actually applauds. The tribe doesn't know how to react.`
    ],
    chefsKiss: [
      `${host} stands up. Slow clap. "That is restaurant-quality."`,
      `"I would pay money for this," ${host} says. Nobody has ever heard that before.`,
      `${host} kisses their fingers. Chef's kiss. The tribe erupts.`
    ]
  };

  function getHostReaction(rating) {
    if (rating <= 2) return _rp(hostReactions.disaster);
    if (rating <= 4) return _rp(hostReactions.bad);
    if (rating <= 6) return _rp(hostReactions.mediocre);
    if (rating <= 8) return _rp(hostReactions.good);
    if (rating === 9) return _rp(hostReactions.excellent);
    return _rp(hostReactions.chefsKiss);
  }

  function rawToRating(raw) {
    if (raw < 0.20) return Math.random() < 0.5 ? 1 : 2;
    if (raw < 0.35) return Math.random() < 0.5 ? 3 : 4;
    if (raw < 0.50) return Math.random() < 0.5 ? 5 : 6;
    if (raw < 0.65) return Math.random() < 0.5 ? 7 : 8;
    if (raw < 0.80) return 9;
    return 10;
  }

  // ── State ──
  const personalScores = {};
  allMembers.forEach(m => { personalScores[m] = 0; });
  const phases = {};
  const allEvents = [];
  const timeline = [];
  const sabotageLog = [];
  const foodFightLog = [];
  let fridgeLock = null;
  const courseModifiers = {}; // tribeName -> { appetizer: 0, main: 0, dessert: 0 }
  tribes.forEach(t => { courseModifiers[t.name] = { appetizer: 0, main: 0, dessert: 0 }; });
  const disasterPrevented = {}; // tribeName -> count of disasters prevented by clean station
  tribes.forEach(t => { disasterPrevented[t.name] = 0; });
  const satOutPlayers = new Set(); // players who can't cook (allergy, injury)
  const chefLockedOut = {}; // tribeName -> course they missed

  // ── Step 1: Head Chef Selection ──
  const chefs = {};
  tribes.forEach(t => {
    let bestScore = -Infinity, bestName = null;
    t.members.forEach(m => {
      const s = pStats(m);
      const score = s.strategic * 0.04 + s.social * 0.03 + s.boldness * 0.03 + Math.random() * 0.15;
      if (score > bestScore) { bestScore = score; bestName = m; }
    });
    const arch = players.find(p => p.name === bestName)?.archetype || '';
    let style = 'standard';
    if (['villain', 'schemer'].includes(arch)) style = 'tyrant';
    else if (['hero', 'loyal-soldier'].includes(arch)) style = 'motivator';
    else if (arch === 'mastermind') style = 'delegator';
    else if (['social-butterfly', 'showmancer'].includes(arch)) style = 'hype';
    else if (['chaos-agent', 'hothead'].includes(arch)) style = 'chaos';
    else if (arch === 'wildcard') style = 'improviser';
    chefs[t.name] = { name: bestName, score: bestScore, style };
  });

  // ── Step 2: Course Assignment ──
  const assignments = {};
  const dishes = {};
  const COURSES = ['appetizer', 'main', 'dessert'];
  const coursePools = { appetizer: appetizerPool, main: mainPool, dessert: dessertPool };

  // stat priorities per course
  const coursePriority = {
    appetizer: (s) => s.mental * 0.04 + s.intuition * 0.04,
    main: (s) => s.physical * 0.04 + s.endurance * 0.04,
    dessert: (s) => s.mental * 0.04 + s.intuition * 0.04
  };

  tribes.forEach(t => {
    const chef = chefs[t.name];
    const nonChef = t.members.filter(m => m !== chef.name);
    let sorted;

    if (chef.style === 'delegator') {
      // Optimal: assign best-stat pairs to matching courses
      sorted = [...nonChef].sort((a, b) => {
        const sa = pStats(a), sb = pStats(b);
        return (sb.mental + sb.intuition + sb.physical + sb.endurance) - (sa.mental + sa.intuition + sa.physical + sa.endurance);
      });
    } else if (chef.style === 'tyrant') {
      // Tyrant assigns favorites first, enemies last
      sorted = [...nonChef].sort((a, b) => getBond(chef.name, b) - getBond(chef.name, a));
    } else {
      // Semi-random with slight stat preference
      sorted = [...nonChef].sort(() => Math.random() - 0.5);
      // nudge better cooks slightly forward
      sorted.sort((a, b) => {
        const sa = pStats(a), sb = pStats(b);
        const da = sa.intuition * 0.02 + sa.mental * 0.02 + Math.random() * 0.3;
        const db = sb.intuition * 0.02 + sb.mental * 0.02 + Math.random() * 0.3;
        return db - da;
      });
    }

    const assign = { appetizer: [], main: [], dessert: [] };
    let floater = null;

    if (sorted.length >= 6) {
      // 6+: 2 per course, rest float
      if (chef.style === 'delegator') {
        // Match stat priorities to courses
        const courseScores = {};
        COURSES.forEach(c => { courseScores[c] = []; });
        sorted.forEach(m => {
          const s = pStats(m);
          COURSES.forEach(c => { courseScores[c].push({ name: m, score: coursePriority[c](s) }); });
        });
        // Greedy assign: best fit first
        const assigned = new Set();
        COURSES.forEach(c => {
          courseScores[c].sort((a, b) => b.score - a.score);
          let count = 0;
          for (const entry of courseScores[c]) {
            if (count >= 2) break;
            if (!assigned.has(entry.name)) {
              assign[c].push(entry.name);
              assigned.add(entry.name);
              count++;
            }
          }
        });
        // Anyone left becomes floater
        sorted.forEach(m => { if (!assigned.has(m)) floater = m; });
      } else {
        assign.appetizer = sorted.slice(0, 2);
        assign.main = sorted.slice(2, 4);
        assign.dessert = sorted.slice(4, 6);
        if (sorted.length > 6) floater = sorted[6];
      }
    } else if (sorted.length >= 4) {
      assign.appetizer = sorted.slice(0, 2);
      assign.main = sorted.slice(2, 4);
      if (sorted.length >= 5) {
        assign.dessert = [sorted[4]];
        if (sorted.length >= 6) assign.dessert.push(sorted[5]);
      }
      if (sorted.length === 5) floater = sorted[4];
      if (assign.dessert.length < 2) {
        // Chef fills in
        assign.dessert.push(chef.name);
      }
    } else if (sorted.length >= 2) {
      // Small tribe: 3 members total (chef + 2)
      assign.appetizer = [sorted[0], sorted[1]];
      assign.main = [sorted[0], chef.name];
      assign.dessert = [sorted[1], chef.name];
      floater = null;
    } else if (sorted.length === 1) {
      // 2-member tribe
      assign.appetizer = [sorted[0], chef.name];
      assign.main = [sorted[0], chef.name];
      assign.dessert = [sorted[0], chef.name];
    } else {
      // Solo? Shouldn't happen but handle
      assign.appetizer = [chef.name];
      assign.main = [chef.name];
      assign.dessert = [chef.name];
    }

    assignments[t.name] = { ...assign };
    if (floater) assignments[t.name].floater = floater;

    // Assign random dishes
    const usedApp = new Set();
    const usedMain = new Set();
    const usedDes = new Set();
    dishes[t.name] = {};
    COURSES.forEach(c => {
      const pool = coursePools[c];
      let pick;
      do { pick = _rp(pool); } while (
        (c === 'appetizer' && usedApp.has(pick.name)) ||
        (c === 'main' && usedMain.has(pick.name)) ||
        (c === 'dessert' && usedDes.has(pick.name))
      );
      dishes[t.name][c] = pick.name;
      if (c === 'appetizer') usedApp.add(pick.name);
      else if (c === 'main') usedMain.add(pick.name);
      else usedDes.add(pick.name);
    });
  });

  // Track which dish object each tribe got (for desc in VP)
  const dishDetails = {};
  tribes.forEach(t => {
    dishDetails[t.name] = {};
    COURSES.forEach(c => {
      const pool = coursePools[c];
      dishDetails[t.name][c] = pool.find(d => d.name === dishes[t.name][c]) || { name: dishes[t.name][c], desc: '' };
    });
  });

  // ── Helper: push event ──
  // Events are tagged with current course phase for later interleaving
  let _currentCourse = 'pre'; // 'pre', 'appetizer', 'main', 'dessert', 'post'
  let _currentTribe = null; // tracks which tribe's events we're generating
  const eventsByCourse = { pre: [], appetizer: [], main: [], dessert: [], post: [] };
  function pushEvent(evt) {
    const tagged = { kind: 'event', _tribe: _currentTribe || 'cross', ...evt };
    allEvents.push(evt);
    eventsByCourse[_currentCourse].push(tagged);
  }

  // ── Helper: add cooking heat ──
  function addCookingHeat(name, amount, duration) {
    if (!gs._cookingHeat) gs._cookingHeat = {};
    const existing = gs._cookingHeat[name];
    if (existing && existing.amount >= amount) return; // don't overwrite stronger heat
    gs._cookingHeat[name] = { amount, expiresEp: epNum + duration };
  }

  // ── Step 3: Chef Showdown (pre-cooking, all chefs face off) ──
  _currentTribe = null; // cross-tribe
  if (tribes.length >= 2) {
    const chefList = tribes.map(t => ({ ...chefs[t.name], tribe: t.name }));
    // Score all chefs
    const sdScores = chefList.map(c => {
      const s = pStats(c.name);
      return { ...c, sdScore: s.boldness * 0.05 + s.social * 0.03 + Math.random() * 0.15 };
    }).sort((a, b) => b.sdScore - a.sdScore);

    const sdWinner = sdScores[0];
    const sdLoser = sdScores[sdScores.length - 1];
    const sdMiddle = sdScores.length > 2 ? sdScores.slice(1, -1) : [];

    // Winner gets morale boost
    COURSES.forEach(c => { courseModifiers[sdWinner.tribe][c] += 0.04; });
    const prW = pronouns(sdWinner.name);

    if (tribes.length === 2) {
      const showdownTexts = [
        `${sdWinner.name} and ${sdLoser.name} face off before the cooking starts. ${sdWinner.name} gets in ${sdLoser.name}'s head with a devastating one-liner. ${prW.Sub} wins the trash talk round — ${prW.posAdj} team rides the momentum.`,
        `The chefs meet at center kitchen for the traditional stare-down. ${sdWinner.name} doesn't blink. ${sdLoser.name} looks away first. ${sdWinner.tribe} gets the psychological edge.`,
        `${sdWinner.name} cracks a joke that has both tribes laughing — except ${sdLoser.name}, who's fuming. The mental game is already over.`,
      ];
      pushEvent({ type: 'chef-showdown', course: 'pre', players: [sdWinner.name, sdLoser.name], text: _rp(showdownTexts), badge: 'Chef Showdown', badgeText: `${sdWinner.name} wins the showdown`, badgeClass: 'badge-warning' });
    } else {
      // 3+ chefs: multi-way showdown
      const allNames = sdScores.map(c => c.name);
      const middleNames = sdMiddle.map(c => c.name).join(', ');
      const showdownTexts = [
        `All ${sdScores.length} chefs face off before the cooking starts. ${sdWinner.name} dominates the trash talk — ${sdLoser.name} wilts under the pressure.${sdMiddle.length ? ` ${middleNames} stay${sdMiddle.length === 1 ? 's' : ''} quiet and watch.` : ''}`,
        `The chefs circle up for the pre-game stare-down. ${sdWinner.name} owns the room — ${prW.sub} hasn't even cooked yet and ${prW.posAdj} team already feels like winners. ${sdLoser.name} looks rattled.`,
        `${sdWinner.name} trash-talks every other chef by name. ${sdLoser.name} tries to clap back but stumbles on ${pronouns(sdLoser.name).posAdj} words.${sdMiddle.length ? ` ${middleNames} wisely stay${sdMiddle.length === 1 ? 's' : ''} out of it.` : ''} The kitchen belongs to ${sdWinner.name} before a single dish is made.`,
      ];
      pushEvent({ type: 'chef-showdown', course: 'pre', players: allNames, text: _rp(showdownTexts), badge: 'Chef Showdown', badgeText: `${sdWinner.name} dominates the showdown`, badgeClass: 'badge-warning' });
    }
  }

  // ── Step 4: Leadership Events (fire once per tribe before courses) ──
  tribes.forEach(t => {
    _currentTribe = t.name;
    const chef = chefs[t.name];
    const teammates = t.members.filter(m => m !== chef.name);
    const chefStats = pStats(chef.name);
    const pr = pronouns(chef.name);

    if (chef.style === 'tyrant') {
      // ── TYRANT ESCALATION: multi-course chain (tyranny → tension → fridge lock) ──
      // Efficiency boost always applies
      COURSES.forEach(c => { courseModifiers[t.name][c] += 0.05; });

      // Course 1 — Tyranny begins. Bond damage, possible singling out.
      teammates.forEach(m => { addBond(chef.name, m, -0.2); });
      const tyrantTexts = [
        `${chef.name} runs ${pr.posAdj} kitchen like a drill sergeant. Every order is barked, every mistake is punished.`,
        `"I didn't ask for your opinion, I asked for your OBEDIENCE!" ${chef.name} screams at ${_rp(teammates)}. The kitchen falls silent.`,
        `${chef.name} makes ${pr.posAdj} team redo every dish twice. ${pr.Sub}'s a tyrant, but the food is undeniably better for it.`,
        `${chef.name} stands at the center of the kitchen and points at each teammate in turn. "You. Chop. You. Stir. You. Stay out of my way."`,
      ];
      pushEvent({
        type: 'tyrannical-chef',
        course: 'pre',
        players: [chef.name, ...teammates],
        text: _rp(tyrantTexts),
        badge: 'Kitchen Tyrant',
        badgeText: `${chef.name} rules with an iron fist`,
        badgeClass: 'badge-danger'
      });

      // Single out the teammate with lowest bond — the "Leshawna"
      const _tyrantTarget = teammates.length ? teammates.reduce((worst, m) =>
        getBond(chef.name, m) < getBond(chef.name, worst) ? m : worst, teammates[0]) : null;
      const _hasSingledOut = _tyrantTarget && getBond(chef.name, _tyrantTarget) <= 1;

      if (_hasSingledOut) {
        addBond(chef.name, _tyrantTarget, -0.2);
        const tgtPr = pronouns(_tyrantTarget);
        const _singleTexts = [
          `${chef.name} keeps singling out ${_tyrantTarget}. "Did I stutter? Do it AGAIN." ${_tyrantTarget} bites ${tgtPr.posAdj} tongue. For now.`,
          `Every mistake ${_tyrantTarget} makes gets called out in front of everyone. ${chef.name} won't let anything slide.`,
          `${chef.name} assigns ${_tyrantTarget} the worst jobs — cleaning, peeling, carrying. ${tgtPr.Sub} can feel the disrespect.`,
        ];
        pushEvent({
          type: 'tyrant-singles-out',
          course: 'pre',
          players: [chef.name, _tyrantTarget],
          text: _rp(_singleTexts),
          badge: 'Singled Out',
          badgeText: `${chef.name} targets ${_tyrantTarget}`,
          badgeClass: 'badge-danger'
        });
      }

      // Errand humiliation subplot (~20%): chef sends someone on a humiliating task
      if (teammates.length >= 2 && Math.random() < 0.20) {
        const _errandRunner = _rp(teammates.filter(m => m !== _tyrantTarget) || teammates);
        const erPr = pronouns(_errandRunner);
        const _errandTexts = [
          `${chef.name} sends ${_errandRunner} to fetch more ingredients from the truck. ${_errandRunner} comes back covered in bee stings, barely standing. ${chef.name} doesn't even look up.`,
          `${chef.name} orders ${_errandRunner} to get ${pr.posAdj} makeup bag from the cabin. ${_errandRunner} steps on a rake on the way back, trips, and drops everything. Comedy of errors.`,
          `"Go get me fresh herbs from the garden." ${_errandRunner} comes back muddy, scratched, and holding three wilted leaves. ${chef.name}: "Useless."`,
          `${chef.name} makes ${_errandRunner} carry a full crate across camp. ${erPr.Sub} trips and oranges go everywhere. One hits a teammate in the face.`,
        ];
        addBond(_errandRunner, chef.name, -0.3);
        personalScores[_errandRunner] = (personalScores[_errandRunner] || 0) - 0.5;
        pushEvent({
          type: 'tyrant-errand',
          course: 'pre',
          players: [chef.name, _errandRunner],
          text: _rp(_errandTexts),
          badge: 'Errand Run',
          badgeText: `${_errandRunner} sent on a humiliating errand`,
          badgeClass: 'badge-danger'
        });
      }

      // Store tyrant state for mid-course escalation (checked during course loop)
      if (!ep._tyrantState) ep._tyrantState = {};
      ep._tyrantState[t.name] = {
        chef: chef.name,
        target: _hasSingledOut ? _tyrantTarget : null,
        tensionLevel: _hasSingledOut ? 1 : 0, // 0=mild, 1=singled out, 2=snap-back, 3=conspiracy
        rebels: [],
      };

    } else if (chef.style === 'motivator') {
      COURSES.forEach(c => { courseModifiers[t.name][c] += 0.05; });
      teammates.forEach(m => { addBond(chef.name, m, 0.2); });
      const motivTexts = [
        `${chef.name} gathers the team before they start. "We've got this. Every single one of you is going to kill it today." The team believes ${pr.obj}.`,
        `${chef.name} puts a hand on each teammate's shoulder before they start cooking. "I trust you," ${pr.sub} says. And ${pr.sub} means it.`,
        `${chef.name} leads by example — first one at the station, last one to rest. ${pr.Sub} doesn't yell, doesn't threaten. Just cooks. The team follows.`
      ];
      pushEvent({ type: 'motivational-chef', course: 'all', players: [chef.name, ...teammates], text: _rp(motivTexts), badge: 'Team Captain', badgeText: `${chef.name} inspires the team`, badgeClass: 'badge-success' });
      // Escalation state: inspiration → desperation → meltdown if losing
      if (!ep._chefEscalation) ep._chefEscalation = {};
      ep._chefEscalation[t.name] = { style: 'motivator', chef: chef.name, phase: 'inspired' };

    } else if (chef.style === 'delegator') {
      COURSES.forEach(c => { courseModifiers[t.name][c] += 0.10; });
      teammates.forEach(m => { addBond(chef.name, m, 0.1); });
      const delegTexts = [
        `${chef.name} studies each teammate's strengths and assigns them perfectly. It's like watching a chess grandmaster set up the board.`,
        `"You're on appetizer because your plating is beautiful. You two, main course — you've got the stamina." ${chef.name} knows exactly what ${pr.sub}'s doing.`,
        `${chef.name} barely raises ${pr.posAdj} voice. Every assignment comes with a reason, every reason makes sense. The team runs like clockwork.`
      ];
      pushEvent({ type: 'chef-delegation', course: 'all', players: [chef.name, ...teammates], text: _rp(delegTexts), badge: 'Master Delegator', badgeText: `${chef.name} assigns the team perfectly`, badgeClass: 'badge-success' });
      if (!ep._chefEscalation) ep._chefEscalation = {};
      ep._chefEscalation[t.name] = { style: 'delegator', chef: chef.name, phase: 'confident' };

    } else if (chef.style === 'chaos') {
      COURSES.forEach(c => { courseModifiers[t.name][c] += (Math.random() - 0.5) * 0.2; });
      const chaosTexts = [
        `${chef.name} changes the plan three times in the first five minutes. Nobody knows what they're cooking, but the energy is... electric?`,
        `"Forget the recipe. We're doing it MY way." ${chef.name} throws the cookbook in the trash. This could go very well or very badly.`,
        `${chef.name}'s kitchen is pure anarchy — and somehow, that might be exactly what they need.`
      ];
      pushEvent({ type: 'chaos-chef', course: 'all', players: [chef.name, ...teammates], text: _rp(chaosTexts), badge: 'Chaos Kitchen', badgeText: `${chef.name} runs the kitchen by instinct`, badgeClass: 'badge-warning' });
      if (!ep._chefEscalation) ep._chefEscalation = {};
      ep._chefEscalation[t.name] = { style: 'chaos', chef: chef.name, phase: 'wild' };

    } else if (chef.style === 'hype') {
      COURSES.forEach(c => { courseModifiers[t.name][c] += 0.04; });
      teammates.forEach(m => { addBond(chef.name, m, 0.15); });
      const hypeTexts = [
        `${chef.name} turns the kitchen into a party. Music's playing, everyone's dancing between stations. It's chaotic but joyful.`,
        `"ENERGY! I need ENERGY!" ${chef.name} claps ${pr.posAdj} hands together. The team can't help but smile.`,
        `${chef.name} treats every dish like it's the best thing ever made. The hype is infectious — everyone starts cooking with swagger.`
      ];
      pushEvent({ type: 'hype-chef', course: 'all', players: [chef.name, ...teammates], text: _rp(hypeTexts), badge: 'Hype Chef', badgeText: `${chef.name} brings the energy`, badgeClass: 'badge-info' });
      if (!ep._chefEscalation) ep._chefEscalation = {};
      ep._chefEscalation[t.name] = { style: 'hype', chef: chef.name, phase: 'vibing' };

    } else if (chef.style === 'improviser') {
      COURSES.forEach(c => { courseModifiers[t.name][c] += (Math.random() * 0.12); });
      const improvTexts = [
        `${chef.name} takes one look at the assigned dishes and starts riffing. "We're adding a twist to everything." The team exchanges nervous looks.`,
        `"Rules are suggestions." ${chef.name} improvises the entire menu. Either genius or disaster — there's no middle ground.`,
        `${chef.name} trusts ${pr.posAdj} instincts completely. No recipes, no measurements, just vibes. The kitchen smells amazing... or concerning.`
      ];
      pushEvent({ type: 'improviser-chef', course: 'all', players: [chef.name, ...teammates], text: _rp(improvTexts), badge: 'Improv Kitchen', badgeText: `${chef.name} improvises the whole menu`, badgeClass: 'badge-info' });
      if (!ep._chefEscalation) ep._chefEscalation = {};
      ep._chefEscalation[t.name] = { style: 'improviser', chef: chef.name, phase: 'experimenting', lastResult: null };
    }

    // Micromanager check (strategic >= 7, social <= 4 on any chef style)
    if (chefStats.strategic >= 7 && chefStats.social <= 4 && chef.style !== 'delegator' && Math.random() < 0.35) {
      COURSES.forEach(c => { courseModifiers[t.name][c] += 0.05; });
      teammates.forEach(m => { addBond(chef.name, m, -0.2); });
      const boldTeammate = teammates.reduce((best, m) => {
        const s = pStats(m);
        return s.boldness > pStats(best).boldness ? m : best;
      }, teammates[0]);
      const microTexts = [
        `${chef.name} hovers over every station, correcting every detail. ${boldTeammate} finally snaps: "I KNOW how to chop an onion!"`,
        `Every plate that comes off ${chef.name}'s station gets a lecture. The food improves. The mood doesn't.`,
        `${chef.name} re-plates ${boldTeammate}'s work three times. The dish is perfect. Their relationship is not.`
      ];
      pushEvent({
        type: 'micromanager',
        course: 'all',
        players: [chef.name, boldTeammate],
        text: _rp(microTexts),
        badge: 'Micromanager',
        badgeText: `${chef.name} controls every detail`,
        badgeClass: 'badge-warning'
      });
    }

    // Chef ego check (boldness >= 7)
    if (chefStats.boldness >= 7 && Math.random() < 0.25) {
      const egoCourse = _rp(COURSES);
      const egoRoll = chefStats.intuition * 0.04 + chefStats.mental * 0.03 + Math.random() * 0.2;
      if (egoRoll > 0.4) {
        courseModifiers[t.name][egoCourse] += 0.1;
        personalScores[chef.name] = (personalScores[chef.name] || 0) + 1.5;
        pushEvent({
          type: 'chef-ego-success',
          course: egoCourse,
          players: [chef.name],
          text: `${chef.name} insists on doing the ${egoCourse} solo. "${pr.Sub} shoves everyone aside, cooks like a person possessed — and it's INCREDIBLE.`,
          badge: 'Chef Ego Win',
          badgeText: `${chef.name} takes over the ${egoCourse} and nails it`,
          badgeClass: 'badge-success'
        });
      } else {
        courseModifiers[t.name][egoCourse] -= 0.1;
        personalScores[chef.name] = (personalScores[chef.name] || 0) - 1.5;
        pushEvent({
          type: 'chef-ego-fail',
          course: egoCourse,
          players: [chef.name, ...teammates.slice(0, 2)],
          text: `${chef.name} insists on doing the ${egoCourse} solo. It does not go well. The team watches in horror as ${pr.sub} burns through three pans and produces something inedible.`,
          badge: 'Chef Ego Fail',
          badgeText: `${chef.name} takes over the ${egoCourse} and blows it`,
          badgeClass: 'badge-danger'
        });
      }
    }

    // Chef meltdown check
    if ((10 - chefStats.temperament) * 0.02 > Math.random() * 0.3) {
      // Only if not already motivator or delegator (they're calm)
      if (!['motivator', 'delegator'].includes(chef.style) && Math.random() < 0.2) {
        COURSES.forEach(c => { courseModifiers[t.name][c] -= 0.1; });
        const comforters = teammates.filter(m => {
          const a = players.find(p => p.name === m)?.archetype || '';
          return ['hero', 'loyal-soldier', 'social-butterfly'].includes(a);
        });
        const exploiters = teammates.filter(m => {
          const a = players.find(p => p.name === m)?.archetype || '';
          return ['schemer', 'villain', 'mastermind'].includes(a);
        });
        comforters.forEach(m => { addBond(chef.name, m, 0.3); });
        exploiters.forEach(m => { addBond(chef.name, m, -0.2); });
        const meltTexts = [
          `${chef.name} drops a pan, then drops to ${pr.posAdj} knees. "I can't do this." The kitchen freezes.`,
          `The pressure gets to ${chef.name}. ${pr.Sub} walks away from ${pr.posAdj} station and stares at the wall. The team scrambles.`,
          `${chef.name}'s hands are shaking. ${pr.Sub} can't plate, can't taste, can't think. The chef is done.`
        ];
        pushEvent({
          type: 'chef-meltdown',
          course: 'all',
          players: [chef.name, ...comforters, ...exploiters],
          text: _rp(meltTexts),
          badge: 'Chef Meltdown',
          badgeText: `${chef.name} cracks under pressure`,
          badgeClass: 'badge-danger'
        });
      }
    }
  });

  // ── Step 5: Course-by-course simulation ──
  const courseScores = {};
  tribes.forEach(t => { courseScores[t.name] = {}; });

  COURSES.forEach((course, courseIdx) => {
    _currentCourse = course;
    const phaseKey = course;
    phases[phaseKey] = [];

    tribes.forEach(t => {
      _currentTribe = t.name;
      const chef = chefs[t.name];
      const pair = (assignments[t.name][course] || []).filter(m => !satOutPlayers.has(m));
      const floater = assignments[t.name].floater;
      const teammates = t.members.filter(m => m !== chef.name);
      const pr = pronouns(chef.name);

      // ── TYRANT ESCALATION (per-course) ──
      const _ts = ep._tyrantState?.[t.name];
      if (_ts && chef.style === 'tyrant') {
        if (courseIdx === 1 && _ts.tensionLevel >= 1 && _ts.target) {
          // Course 2 (main): tension escalates. Singled-out player might snap back.
          addBond(chef.name, _ts.target, -0.3);
          const tgtPr = pronouns(_ts.target);
          const _tgtStats = pStats(_ts.target);
          const snapChance = 0.15 + _tgtStats.boldness * 0.06 + (10 - _tgtStats.temperament) * 0.03; // boldness + hot temper
          if (Math.random() < snapChance) {
            _ts.tensionLevel = 2;
            const _snapTexts = [
              `${_ts.target} slams down ${tgtPr.posAdj} knife. "You want to do this yourself? Because I'm DONE." ${chef.name} stares. The kitchen holds its breath.`,
              `"Stop. Talking. To me. Like that." ${_ts.target} gets in ${chef.name}'s face. For a second, it looks like it might get physical.`,
              `${_ts.target} turns to the team: "Is anyone else tired of this?" Silence. Then a few nods. ${chef.name} notices.`,
              `${_ts.target} throws ${tgtPr.posAdj} apron on the counter. "I'd rather lose than take one more second of this." ${chef.name}'s authority cracks.`,
            ];
            // The public confrontation crashes bonds — chef retaliates, team picks sides
            addBond(chef.name, _ts.target, -1.5); // chef vs target: war
            teammates.forEach(m => {
              if (m === _ts.target) return;
              // Teammates who don't strongly like the chef side with the underdog
              if (getBond(m, chef.name) < 4) addBond(m, chef.name, -0.5);
            });
            pushEvent({
              type: 'tyrant-snapback',
              course,
              players: [_ts.target, chef.name],
              text: _rp(_snapTexts),
              badge: 'Snap Back',
              badgeText: `${_ts.target} stands up to ${chef.name}`,
              badgeClass: 'badge-warning'
            });
            // Conspiracy: now that bonds crashed, check who's willing to rebel
            _ts.rebels = teammates.filter(m => getBond(m, chef.name) <= 1);
            if (!_ts.rebels.includes(_ts.target)) _ts.rebels.unshift(_ts.target);
            if (_ts.rebels.length >= 2) {
              _ts.tensionLevel = 3;
              const _conspTexts = [
                `Between courses, ${_ts.rebels.slice(0, 3).join(', ')} huddle by the fridge. They're planning something.`,
                `${_ts.target} whispers to ${_ts.rebels.find(r => r !== _ts.target) || _rp(teammates)}: "Next course. We're locking ${pr.obj} in." A nod. It's happening.`,
              ];
              pushEvent({
                type: 'tyrant-conspiracy',
                course,
                players: _ts.rebels.slice(0, 4),
                text: _rp(_conspTexts),
                badge: 'Conspiracy',
                badgeText: `The team is plotting against ${chef.name}`,
                badgeClass: 'badge-warning'
              });
            }
          } else {
            // No snap — tension builds but no action. Chef doubles down.
            const _pressureTexts = [
              `${chef.name} criticizes ${_ts.target}'s work in front of everyone. Again. ${_ts.target} says nothing. The resentment is visible.`,
              `${chef.name} redoes ${_ts.target}'s entire prep. "If you want something done right..." ${_ts.target} clenches ${tgtPr.posAdj} jaw.`,
            ];
            pushEvent({
              type: 'tyrant-pressure',
              course,
              players: [chef.name, _ts.target],
              text: _rp(_pressureTexts),
              badge: 'Pressure',
              badgeText: `${chef.name} keeps pushing ${_ts.target}`,
              badgeClass: 'badge-danger'
            });
          }
        }

        if (courseIdx === 2 && _ts.tensionLevel >= 3 && _ts.rebels.length >= 2) {
          // Course 3 (dessert): FRIDGE LOCK fires
          const lockChance = _ts.rebels.length * 0.15 + pStats(_ts.rebels[0]).boldness * 0.04;
          if (Math.random() < lockChance) {
            chefLockedOut[t.name] = 'dessert';
            fridgeLock = { victim: chef.name, rebels: _ts.rebels.slice(), course: 'dessert' };
            _ts.rebels.forEach(r => {
              _ts.rebels.forEach(r2 => { if (r !== r2) addBond(r, r2, 0.4); });
            });
            personalScores[chef.name] = (personalScores[chef.name] || 0) - 1.0;
            addBond(chef.name, _ts.rebels[0], -0.5);
            const leadRebel = _ts.rebels[0];
            const lrPr = pronouns(leadRebel);
            const _lockTexts = [
              `${leadRebel} has had ENOUGH. ${lrPr.Sub} rallies ${_ts.rebels.length > 1 ? _ts.rebels.filter(r=>r!==leadRebel).join(' and ') : 'the team'} and slams the walk-in fridge door shut with ${chef.name} inside. The kitchen erupts.`,
              `"You're NOT the boss of me!" ${leadRebel} shoves ${chef.name} into the fridge and locks the door. ${pr.Sub} pounds on the door. Nobody opens it.`,
              `The ${t.name} kitchen descends into chaos. ${leadRebel} locks ${chef.name} in the fridge while the rest of the team takes over dessert. ${pr.Sub} can be heard yelling from inside.`,
              `It happens fast. ${leadRebel} opens the fridge, ${_ts.rebels.filter(r=>r!==leadRebel).join(' and ')} push${_ts.rebels.length > 2 ? '' : 'es'} ${chef.name} in, and the door slams shut. "Cook the dessert yourself," ${leadRebel} says to the closed door.`,
            ];
            pushEvent({
              type: 'fridge-lock',
              course: 'dessert',
              players: [chef.name, ..._ts.rebels],
              text: _rp(_lockTexts),
              badge: 'FRIDGE LOCK!',
              badgeText: `${chef.name} locked in the fridge`,
              badgeClass: 'badge-danger'
            });
          }
        }
      }

      // ── NON-TYRANT CHEF ESCALATION (per-course) ──
      const _ce = ep._chefEscalation?.[t.name];
      if (_ce && _ce.style !== 'tyrant') {
        const _cePr = pronouns(_ce.chef);
        const _ceTeammates = t.members.filter(m => m !== _ce.chef);
        // Low temperament = cracks easier (threshold boost: temp 2 → +2, temp 5 → +0, temp 8 → -1)
        const _chefTemp = pStats(_ce.chef).temperament || 5;
        const _tempBonus = Math.round((5 - _chefTemp) * 0.5); // low temp = positive = wider trigger

        // ── MOTIVATOR: inspired → desperate → meltdown ──
        if (_ce.style === 'motivator') {
          const prevScore = courseIdx > 0 ? (courseScores[t.name]?.[COURSES[courseIdx - 1]]?.rating || 5) : 5;
          // Trigger: any previous course scored poorly, OR phase already set
          if (_ce.phase === 'inspired' && courseIdx >= 1 && prevScore <= 6 + _tempBonus) {
            _ce.phase = 'desperate';
            // Desperation creates pressure — bonds crack, next course penalized
            _ceTeammates.forEach(m => addBond(_ce.chef, m, -0.3));
            courseModifiers[t.name][course] -= 0.04;
            const _despTexts = [
              `${_ce.chef} is rattled. "Come on, come ON! We're better than this!" The encouragement sounds like panic now. ${_cePr.Sub} starts hovering, correcting, pushing.`,
              `The positivity is cracking. ${_ce.chef} pushes harder — too hard. "We HAVE to nail this." The team feels the shift from inspiring to suffocating.`,
              `${_ce.chef} won't stop pacing. ${_cePr.Sub} keeps saying "it's fine, it's fine" but ${_cePr.posAdj} hands are shaking. The pressure is crushing.`,
            ];
            pushEvent({ type: 'motivator-desperate', course, players: [_ce.chef, ..._ceTeammates.slice(0, 2)], text: _rp(_despTexts), badge: 'Desperation', badgeText: `${_ce.chef} is losing composure`, badgeClass: 'badge-warning' });
          }
          if (courseIdx >= 1 && _ce.phase === 'desperate') {
            // Meltdown more likely because desperation already penalized the main course
            const mainScore = courseScores[t.name]?.[COURSES[1]]?.rating || 5;
            if (mainScore <= 7 + _tempBonus && Math.random() < 0.55 + (5 - _chefTemp) * 0.05) {
              _ce.phase = 'meltdown';
              courseModifiers[t.name][course] -= 0.08;
              personalScores[_ce.chef] = (personalScores[_ce.chef] || 0) - 1.5;
              const stepUp = _ceTeammates.reduce((best, m) => pStats(m).mental > pStats(best).mental ? m : best, _ceTeammates[0]);
              if (stepUp) { personalScores[stepUp] = (personalScores[stepUp] || 0) + 1.5; courseModifiers[t.name][course] += 0.04; addBond(stepUp, _ce.chef, 0.3); }
              const _meltTexts = [
                `${_ce.chef} breaks. ${_cePr.Sub} sits on the floor. "I can't do this."${stepUp ? ` ${stepUp} quietly takes over. "I've got the dessert."` : ''}`,
                `The motivator is gone. ${_ce.chef} can't look at the food.${stepUp ? ` ${stepUp} steps in without being asked. The team follows.` : ' Someone else takes over.'}`,
              ];
              pushEvent({ type: 'motivator-meltdown', course, players: stepUp ? [_ce.chef, stepUp] : [_ce.chef], text: _rp(_meltTexts), badge: 'Meltdown', badgeText: `${_ce.chef} breaks down`, badgeClass: 'badge-danger' });
            }
          }
        }

        // ── DELEGATOR: confident → self-doubt → micromanage ──
        if (_ce.style === 'delegator') {
          const prevScore = courseIdx > 0 ? (courseScores[t.name]?.[COURSES[courseIdx - 1]]?.rating || 5) : 5;
          if (_ce.phase === "confident" && courseIdx >= 1 && prevScore <= 5 + _tempBonus) {
            _ce.phase = 'doubting';
            // Self-doubt makes chef hesitant — small penalty to main
            courseModifiers[t.name][course] -= 0.03;
            const _doubtTexts = [
              `${_ce.chef} stares at the appetizer score. "I put the wrong people on that course." ${_cePr.Sub} blames ${_cePr.ref}. The confidence is cracking.`,
              `"Maybe I should have..." ${_ce.chef} trails off. For the first time, the delegator doesn't have a plan. ${_cePr.Sub} starts second-guessing every assignment.`,
            ];
            pushEvent({ type: 'delegator-doubt', course, players: [_ce.chef], text: _rp(_doubtTexts), badge: 'Self-Doubt', badgeText: `${_ce.chef} questions ${_cePr.posAdj} decisions`, badgeClass: 'badge-warning' });
          }
          if (courseIdx >= 1 && _ce.phase === 'doubting') {
            _ce.phase = 'micromanaging';
            courseModifiers[t.name][course] -= 0.05;
            _ceTeammates.forEach(m => addBond(_ce.chef, m, -0.3));
            // Team pushback — someone calls out the change
            const pushback = _ceTeammates.find(m => pStats(m).boldness >= 5);
            if (pushback) addBond(pushback, _ce.chef, -0.3);
            const _microTexts = [
              `${_ce.chef} abandons delegation entirely. ${_cePr.Sub}'s hovering, redoing work, second-guessing everything.${pushback ? ` ${pushback}: "You assigned us for a reason. Let us COOK."` : ''}`,
              `"Let me do it." ${_ce.chef} pushes ${_rp(_ceTeammates)} aside. The strategist is now a micromanager.${pushback ? ` ${pushback} slams a pan down. "This is why we're losing."` : ''}`,
            ];
            pushEvent({ type: 'delegator-micromanage', course, players: pushback ? [_ce.chef, pushback] : [_ce.chef, ..._ceTeammates.slice(0, 2)], text: _rp(_microTexts), badge: 'Lost Control', badgeText: `${_ce.chef} micromanages the dessert`, badgeClass: 'badge-danger' });
          }
        }

        // ── CHAOS: wild → spiral → takeover OR miracle ──
        if (_ce.style === 'chaos') {
          const prevScore = courseIdx > 0 ? (courseScores[t.name]?.[COURSES[courseIdx - 1]]?.rating || 5) : 5;
          if (courseIdx >= 1 && _ce.phase === "wild") {
            if (prevScore <= 5 + _tempBonus) {
              _ce.phase = 'spiraling';
              // Spiral tanks the next course AND creates tension
              courseModifiers[t.name][course] -= 0.06;
              _ceTeammates.forEach(m => addBond(m, _ce.chef, -0.3)); // team blames the chaos
              const _spiralTexts = [
                `The chaos is no longer fun. ${_ce.chef}'s kitchen is falling apart — dishes are wrong, stations are dirty, nobody knows what they're making anymore.`,
                `The appetizer was a disaster and ${_ce.chef}'s response is to change EVERYTHING for the main. The team looks terrified. Someone mutters "we're so screwed."`,
              ];
              pushEvent({ type: 'chaos-spiral', course, players: [_ce.chef, ..._ceTeammates.slice(0, 2)], text: _rp(_spiralTexts), badge: 'Spiral', badgeText: `${t.name}'s kitchen is falling apart`, badgeClass: 'badge-danger' });
            } else if (prevScore >= 7) {
              _ce.phase = 'riding-high';
              courseModifiers[t.name][course] += 0.04;
              _ceTeammates.forEach(m => addBond(m, _ce.chef, 0.2));
              const _rideTexts = [
                `The chaos WORKED. ${_ce.chef} is fully convinced ${_cePr.posAdj} approach is genius. The team buys in. The energy doubles.`,
                `After that appetizer score, nobody questions ${_ce.chef}'s method anymore. The kitchen goes from chaotic to electric.`,
              ];
              pushEvent({ type: 'chaos-momentum', course, players: [_ce.chef, ..._ceTeammates.slice(0, 2)], text: _rp(_rideTexts), badge: 'Momentum', badgeText: `${t.name}'s chaos is working`, badgeClass: 'badge-success' });
            }
          }
          if (courseIdx >= 1 && _ce.phase === 'spiraling') {
            const takeoverCandidate = _ceTeammates.reduce((best, m) => pStats(m).mental > pStats(best).mental ? m : best, _ceTeammates[0]);
            if (takeoverCandidate && Math.random() < 0.55) {
              const tkPr = pronouns(takeoverCandidate);
              courseModifiers[t.name][course] += 0.06;
              personalScores[takeoverCandidate] = (personalScores[takeoverCandidate] || 0) + 1.5;
              addBond(takeoverCandidate, _ce.chef, -0.4);
              addCookingHeat(_ce.chef, 1.0, 1); // chaos chef takes heat for the spiral
              const _takeoverTexts = [
                `${takeoverCandidate} has seen enough. ${tkPr.Sub} quietly takes over. ${_ce.chef} doesn't even notice — ${_cePr.sub}'s too busy arguing with the oven.`,
                `"${_ce.chef}, sit down." ${takeoverCandidate} takes charge. Chaos to calm in thirty seconds. The real chef was here all along.`,
              ];
              pushEvent({ type: 'chaos-takeover', course, players: [takeoverCandidate, _ce.chef], text: _rp(_takeoverTexts), badge: 'Takeover', badgeText: `${takeoverCandidate} takes over`, badgeClass: 'badge-success' });
            } else {
              // No takeover — spiral continues to dessert, full disaster
              courseModifiers[t.name][course] -= 0.08;
              const _fullChaosTexts = [
                `Nobody steps up. The chaos continues into dessert. ${_ce.chef} is now yelling at the ingredients. It's not going well.`,
                `The spiral is complete. ${t.name}'s kitchen looks like a crime scene. The dessert is... happening. Somehow.`,
              ];
              pushEvent({ type: 'chaos-full-spiral', course, players: [_ce.chef], text: _rp(_fullChaosTexts), badge: 'Full Chaos', badgeText: `${t.name} is beyond saving`, badgeClass: 'badge-danger' });
            }
          }
        }

        // ── HYPE: vibing → unfocused → reality check ──
        if (_ce.style === 'hype') {
          const prevScore = courseIdx > 0 ? (courseScores[t.name]?.[COURSES[courseIdx - 1]]?.rating || 5) : 5;
          if (courseIdx >= 1 && _ce.phase === 'vibing' && (Math.random() < 0.35 + (5 - _chefTemp) * 0.05 || prevScore <= 5 + _tempBonus)) {
            _ce.phase = 'unfocused';
            courseModifiers[t.name][course] -= 0.05;
            // The fun is real but so is the problem — something burns
            const burnVictim = _rp(_ceTeammates);
            addBond(burnVictim, _ce.chef, -0.2);
            const _unfocTexts = [
              `The vibes are immaculate. The food is... not. ${burnVictim}'s station is literally smoking while ${_ce.chef} leads a group dance. Nobody notices until it's too late.`,
              `${_ce.chef}'s kitchen is all energy and no execution. ${burnVictim} is dancing instead of stirring. The sauce burns. The hype has become the problem.`,
            ];
            pushEvent({ type: 'hype-unfocused', course, players: [_ce.chef, burnVictim], text: _rp(_unfocTexts), badge: 'Unfocused', badgeText: `${t.name} is vibing too hard`, badgeClass: 'badge-warning' });
          }
          if (courseIdx >= 1 && _ce.phase === 'unfocused') {
            const caller = _ceTeammates.reduce((best, m) => pStats(m).strategic > pStats(best).strategic ? m : best, _ceTeammates[0]);
            if (caller && Math.random() < 0.55) {
              _ce.phase = 'refocused';
              courseModifiers[t.name][course] += 0.05;
              addBond(caller, _ce.chef, -0.2);
              personalScores[caller] = (personalScores[caller] || 0) + 1.0;
              const _callTexts = [
                `"Hey. HEY." ${caller} grabs ${_ce.chef}'s arm. "We're about to lose. Can we please just COOK?" The music stops. The team refocuses. The dessert might actually work.`,
                `${caller} turns off the music and stares ${_ce.chef} down. "I love the energy, but we're done playing. Time to cook." ${_ce.chef} nods. Party's over.`,
              ];
              pushEvent({ type: 'hype-reality-check', course, players: [caller, _ce.chef], text: _rp(_callTexts), badge: 'Reality Check', badgeText: `${caller} refocuses the team`, badgeClass: 'badge-info' });
            } else {
              // No one calls it out — hype continues, dessert suffers
              courseModifiers[t.name][course] -= 0.06;
              const _nocheckTexts = [
                `Nobody stops the party. The dessert is an afterthought. ${_ce.chef} is still hyping while the soufflé collapses.`,
                `The music keeps playing. The dessert keeps burning. This is the most fun anyone's had while losing a cooking challenge.`,
              ];
              pushEvent({ type: 'hype-no-check', course, players: [_ce.chef], text: _rp(_nocheckTexts), badge: 'Party Never Stops', badgeText: `${t.name} dances through the disaster`, badgeClass: 'badge-warning' });
            }
          }
        }

        // ── IMPROVISER: experimenting → bold → panic ──
        if (_ce.style === 'improviser') {
          const prevScore = courseIdx > 0 ? (courseScores[t.name]?.[COURSES[courseIdx - 1]]?.rating || 5) : 5;
          if (courseIdx >= 1 && _ce.phase === 'experimenting') {
            if (prevScore >= 7) {
              _ce.phase = 'bold';
              courseModifiers[t.name][course] += 0.05;
              const _boldTexts = [
                `The first improvisation landed. ${_ce.chef} is emboldened — the main course is getting an even WILDER twist. "If it ain't broke, make it weirder."`,
                `Success breeds confidence. ${_ce.chef} is now improvising the improvisation. The team can't keep up but the food keeps getting better.`,
              ];
              pushEvent({ type: 'improviser-bold', course, players: [_ce.chef], text: _rp(_boldTexts), badge: 'Going Bolder', badgeText: `${_ce.chef} doubles down on improvisation`, badgeClass: 'badge-success' });
            } else if (prevScore <= 5 + _tempBonus) {
              _ce.phase = 'panic';
              courseModifiers[t.name][course] -= 0.04;
              const _panicTexts = [
                `The improvisation flopped. ${_ce.chef} panics and reaches for the recipe book. "Okay, okay, we're going conventional for the main." The team exhales.`,
                `${_ce.chef} stares at the appetizer score. The confidence is gone. "Forget the twist. Just... cook it normal." The improviser becomes a follower.`,
              ];
              pushEvent({ type: 'improviser-panic', course, players: [_ce.chef], text: _rp(_panicTexts), badge: 'Back to Basics', badgeText: `${_ce.chef} abandons improvisation`, badgeClass: 'badge-warning' });
            }
          }
          if (courseIdx >= 1 && _ce.phase === 'bold') {
            // Going too bold on dessert — risky
            if (Math.random() < 0.4) {
              courseModifiers[t.name][course] += (Math.random() - 0.3) * 0.15; // high variance, slightly negative lean
              const _tooBoldTexts = [
                `${_ce.chef} is adding something nobody recognizes to the dessert. The team watches in horror. "Trust the process," ${_cePr.sub} says. Nobody trusts the process.`,
                `The dessert is either going to be the best thing ${host} has ever tasted or the worst. There is no middle ground. ${_ce.chef} grins.`,
              ];
              pushEvent({ type: 'improviser-risky', course, players: [_ce.chef], text: _rp(_tooBoldTexts), badge: 'Wild Card', badgeText: `${_ce.chef}'s dessert is a gamble`, badgeClass: 'badge-warning' });
            }
          }
        }
      }

      // Base cook score
      let cookA = pair[0] ? pStats(pair[0]) : null;
      let cookB = pair[1] ? pStats(pair[1]) : null;

      let raw = 0;
      if (cookA && cookB) {
        // Pair: avg of both players' cooking ability + chemistry
        const avgInt = (cookA.intuition + cookB.intuition) / 2;
        const avgMen = (cookA.mental + cookB.mental) / 2;
        const avgSoc = (cookA.social + cookB.social) / 2;
        raw = avgInt * 0.025 + avgMen * 0.025 + avgSoc * 0.005 + Math.random() * 0.15;
      } else if (cookA) {
        // Solo cook — same formula, no partner penalty (they're doing double duty)
        raw = cookA.intuition * 0.025 + cookA.mental * 0.025 + cookA.social * 0.005 + Math.random() * 0.15;
      } else {
        raw = Math.random() * 0.15; // No cook, disaster
      }

      // Chef bonus (style-dependent)
      let chefBonus = 0;
      if (chef.style === 'delegator') chefBonus = 0.06;
      else if (chef.style === 'tyrant') chefBonus = 0.05;
      else if (chef.style === 'motivator') chefBonus = 0.03;
      else if (chef.style === 'hype') chefBonus = 0.03;
      else if (chef.style === 'chaos') chefBonus = (Math.random() - 0.5) * 0.12;
      else if (chef.style === 'improviser') chefBonus = Math.random() * 0.08;
      else chefBonus = 0.02;

      // If chef locked out this course, no chef bonus
      if (chefLockedOut[t.name] === course) chefBonus = 0;

      raw += chefBonus;

      // Pair bond modifier
      if (pair.length === 2) {
        const bond = getBond(pair[0], pair[1]);
        if (bond >= 2) raw += (bond - 2) * 0.015;
        else if (bond < 0) raw += bond * 0.02; // negative
      }

      // Floater contribution
      if (floater && !satOutPlayers.has(floater)) {
        const floaterS = pStats(floater);
        raw += floaterS.intuition * 0.003 + floaterS.social * 0.003;
        personalScores[floater] = (personalScores[floater] || 0) + 0.3;
      }

      // Apply accumulated modifiers from events
      raw += courseModifiers[t.name][course];

      // ── Course Events (3-6 per tribe per course) ──
      const numEvents = 3 + Math.floor(Math.random() * 4);
      let eventsThisCourse = 0;
      const _firedTypesThisCourse = new Set();
      // Override pushEvent for this scope to track duplicates + cap
      const _pushCourseEvent = (evt) => {
        if (eventsThisCourse >= numEvents) return false;
        if (_firedTypesThisCourse.has(evt.type)) return false;
        _firedTypesThisCourse.add(evt.type);
        eventsThisCourse++;
        pushEvent(evt);
        return true;
      };

      // Kitchen Disasters
      pair.forEach(p => {
        if (!p || eventsThisCourse >= numEvents) return;
        const s = pStats(p);
        const pr = pronouns(p);

        // Flambé explosion (dessert only)
        if (course === 'dessert' && (10 - s.mental) * 0.015 + Math.random() * 0.12 > 0.18) {
          if (disasterPrevented[t.name] > 0) { disasterPrevented[t.name]--; }
          else {
            raw -= 0.2;
            personalScores[p] = (personalScores[p] || 0) - 2.0;
            if (!gs.lingeringInjuries) gs.lingeringInjuries = {};
            gs.lingeringInjuries[p] = { ep: epNum, duration: 1, type: 'burned', penalty: 0.5 + Math.random() * 0.5 };
            addCookingHeat(p, 1.0, 1);
            const flambeTexts = [
              `${p} gets a little too enthusiastic with the torch. WHOOSH. ${pr.Sub} loses ${pr.posAdj} eyebrows. The dessert is charcoal.`,
              `The flambé goes wrong — very, very wrong. ${p} stumbles backward, face blackened. The kitchen smells like burned hair.`,
              `${p} lights the rum sauce and it EXPLODES. ${pr.Sub}'s fine — physically. Emotionally? That's another story.`
            ];
            _pushCourseEvent({
              type: 'flambe-explosion',
              course,
              players: [p],
              text: _rp(flambeTexts),
              badge: 'Flambé Fail',
              badgeText: `${p} loses their eyebrows in a flambé explosion`,
              badgeClass: 'badge-danger'
            });
            eventsThisCourse++;

            // Showmance partner reaction
            if (seasonConfig.romance !== 'disabled' && gs.showmances?.length) {
              const showmance = gs.showmances.find(sh => sh.players.includes(p) && sh.phase !== 'broken-up');
              if (showmance) {
                const partner = showmance.players.find(x => x !== p);
                if (partner && t.members.includes(partner)) {
                  addBond(partner, p, 0.5);
                  const partPr = pronouns(partner);
                  _pushCourseEvent({
                    type: 'showmance-fire-reaction',
                    course,
                    players: [partner, p],
                    text: `${partner} rushes to ${p}'s side. "${pr.Sub}'s okay! ${pr.Sub}'s okay!" ${partPr.Sub} cups ${p}'s face in ${partPr.posAdj} hands, checking for burns. The whole kitchen watches.`,
                    badge: 'Protective Instinct',
                    badgeText: `${partner} rushes to help ${p}`,
                    badgeClass: 'badge-pink'
                  });
                  _checkShowmanceChalMoment(ep, phaseKey, phases, personalScores, 'danger', tribes);
                  eventsThisCourse++;
                }
              }
            }
          }
        }

        // Food gobbler — only on main/dessert (food is ready to snack on), specific archetypes only
        const _gobblerArch = players.find(pl => pl.name === p)?.archetype || '';
        const _isGobbler = ['chaos-agent', 'wildcard', 'floater', 'comic-relief'].includes(_gobblerArch) || (s.physical >= 7 && s.mental <= 4);
        if (_isGobbler && course !== 'appetizer' && (10 - s.mental) * 0.02 + Math.random() * 0.08 > 0.15) {
          if (eventsThisCourse >= numEvents) return;
          const ateAmount = 0.15 + Math.random() * 0.15;
          raw -= ateAmount;
          personalScores[p] = (personalScores[p] || 0) - 2.0;

          // Step 1: hidden theft — marked as chain start so it won't be separated from confession
          const hideTexts = [
            `The prep station is suspiciously emptier than it should be. ${p} wipes ${pr.posAdj} mouth and says nothing. Nobody saw... right?`,
            `${p} has been sneaking bites of the ingredients all through cooking. The portion size is noticeably smaller. ${pr.Sub} blames the recipe.`,
            `Ingredients keep disappearing. ${p} points at the other team. "Must have been them." It was not them.`,
          ];
          const hideEvt = {
            type: 'food-gobbler-hide', _tribe: _currentTribe, course,
            players: [p],
            text: _rp(hideTexts),
            badge: 'Food Thief', badgeText: `Someone's been eating the ingredients...`, badgeClass: 'badge-danger',
            _chainId: 'gobble-' + p // unique chain ID
          };
          allEvents.push(hideEvt);
          eventsByCourse[_currentCourse].push({ kind: 'event', ...hideEvt });

          // Step 2: confession fires as follow-up (loyalty proportional)
          const confessChance = s.loyalty * 0.06 + Math.random() * 0.3;
          if (confessChance > 0.5) {
            teammates.forEach(m => { if (m !== p) addBond(p, m, -0.15); });
            const confessTexts = [
              `${p} can't take the guilt. "It was me. I ate it. I'm sorry." The team stares in disbelief.`,
              `${p} pulls the chef aside. "I have to tell you something..." The confession spills out. The team groans, but at least they know.`,
              `${p} cracks under the pressure. "I've been eating the prep! I couldn't stop!" Honesty — but the damage is done.`,
            ];
            const confEvt = {
              type: 'food-gobbler-confess', _tribe: _currentTribe, course,
              players: [p, ...teammates.filter(m => m !== p).slice(0, 2)],
              text: _rp(confessTexts),
              badge: 'Confession', badgeText: `${p} confesses to eating the food`, badgeClass: 'badge-warning',
              _chainAfter: 'gobble-' + p // chains to the specific theft
            };
            allEvents.push(confEvt);
            eventsByCourse[_currentCourse].push({ kind: 'event', ...confEvt });
          } else {
            addCookingHeat(p, 1.5, 2);
          }
          eventsThisCourse++;
        }

        // Ingredient drop
        if ((10 - s.physical) * 0.012 + Math.random() * 0.12 > 0.15) {
          if (eventsThisCourse >= numEvents) return;
          // Improvisation check
          const improvRoll = s.intuition * 0.05 + Math.random() * 0.2;
          if (improvRoll > 0.4) {
            raw += 0.05; // Actually improved!
            personalScores[p] = (personalScores[p] || 0) + 0.5;
            _pushCourseEvent({
              type: 'ingredient-drop-save',
              course,
              players: [p],
              text: `${p} drops a key ingredient on the floor. But then ${pr.sub} improvises — swaps in something unexpected — and it actually works BETTER.`,
              badge: 'Improv Save',
              badgeText: `${p} drops an ingredient but improvises brilliantly`,
              badgeClass: 'badge-success'
            });
          } else {
            raw -= 0.1;
            personalScores[p] = (personalScores[p] || 0) - 0.5;
            _pushCourseEvent({
              type: 'ingredient-drop',
              course,
              players: [p],
              text: `${p} drops a key ingredient on the floor. ${pr.Sub} stares at it. Five-second rule doesn't apply in a competition.`,
              badge: 'Ingredient Drop',
              badgeText: `${p} drops a key ingredient`,
              badgeClass: 'badge-danger'
            });
          }
          eventsThisCourse++;
        }

        // Kitchen fire
        if ((10 - s.mental) * 0.012 + Math.random() * 0.12 > 0.16) {
          if (eventsThisCourse >= numEvents) return;
          if (disasterPrevented[t.name] > 0) { disasterPrevented[t.name]--; }
          else {
            const fireDamage = 0.15 + Math.random() * 0.1;
            raw -= fireDamage;
            personalScores[p] = (personalScores[p] || 0) - 2.0;
            addCookingHeat(p, 1.0, 1);
            const fireTexts = [
              `FIRE! ${p}'s station goes up in flames. The team scrambles to save what they can. The ${dishes[t.name][course]} takes a serious hit.`,
              `${p} leaves the burner on max and walks away. By the time anyone notices, half the ${course} is on fire.`,
              `A grease fire erupts at ${p}'s station. The team rallies to put it out, but the damage is done.`
            ];
            _pushCourseEvent({
              type: 'kitchen-fire',
              course,
              players: [p, ...teammates.filter(m => m !== p).slice(0, 2)],
              text: _rp(fireTexts),
              badge: 'Kitchen Fire',
              badgeText: `${p} starts a kitchen fire`,
              badgeClass: 'badge-danger'
            });
            eventsThisCourse++;

            // Team rally after fire — chained directly (not shuffled separately)
            if (Math.random() < 0.4) {
              raw += 0.05;
              const neutralPairs = teammates.filter(m => m !== p && getBond(m, p) > -2 && getBond(m, p) < 3);
              neutralPairs.forEach(m => { addBond(m, p, 0.2); });
              // Push to allEvents but mark as _chainAfter so timeline builder keeps it with the fire
              const rallyEvt = {
                type: 'team-rally', _tribe: _currentTribe, course,
                players: [p, ...neutralPairs.slice(0, 3)],
                text: `After the fire, something shifts. The team comes together. ${neutralPairs.length > 0 ? neutralPairs[0] + ' puts a hand on ' + p + "'s shoulder. \"We've got this.\"" : 'They rally around the wreckage.'}`,
                badge: 'Team Rally', badgeText: `${t.name} rallies after the fire`, badgeClass: 'badge-success',
                _chainAfter: 'kitchen-fire'
              };
              allEvents.push(rallyEvt);
              eventsByCourse[_currentCourse].push({ kind: 'event', ...rallyEvt });
              eventsThisCourse++;
            }
          }
        }

        // Knife slip
        if ((10 - s.physical) * 0.01 + Math.random() * 0.1 > 0.14) {
          if (eventsThisCourse >= numEvents) return;
          raw -= 0.05;
          const enduranceCheck = s.endurance * 0.06 + Math.random() * 0.2 > 0.4;
          if (enduranceCheck) {
            personalScores[p] = (personalScores[p] || 0) + 0.5;
            if (!gs.lingeringInjuries) gs.lingeringInjuries = {};
            gs.lingeringInjuries[p] = { ep: epNum, duration: 1, type: 'cut-hand', penalty: 0.3 };
            _pushCourseEvent({
              type: 'knife-slip-hero',
              course,
              players: [p],
              text: `${p} slices ${pr.posAdj} hand on the knife. Blood everywhere. ${pr.Sub} wraps it up and keeps cooking. That's tough.`,
              badge: 'Cooking Through Pain',
              badgeText: `${p} cuts ${pr.posAdj} hand but keeps cooking`,
              badgeClass: 'badge-success'
            });
          } else {
            personalScores[p] = (personalScores[p] || 0) - 0.5;
            satOutPlayers.add(p);
            _pushCourseEvent({
              type: 'knife-slip-out',
              course,
              players: [p],
              text: `${p} cuts ${pr.posAdj} hand badly enough to need medical attention. ${pr.Sub}'s out for the rest of the challenge.`,
              badge: 'Knife Injury',
              badgeText: `${p} injures ${pr.posAdj} hand and sits out`,
              badgeClass: 'badge-danger'
            });
          }
          eventsThisCourse++;
        }

        // Allergic reaction — rare, max 1 per challenge
        if (!ep._hkAllergyFired && Math.random() < 0.03) {
          if (eventsThisCourse >= numEvents) return;
          ep._hkAllergyFired = true;
          satOutPlayers.add(p);
          teammates.forEach(m => { if (m !== p) addBond(m, p, 0.2); });
          _pushCourseEvent({
            type: 'allergic-reaction',
            course,
            players: [p, ...teammates.filter(m => m !== p).slice(0, 2)],
            text: `${p}'s face swells up. Allergic reaction — ${pr.sub} can't cook anymore. ${pr.Sub} sits on the sideline, frustrated, while the team carries on.`,
            badge: 'Allergic Reaction',
            badgeText: `${p} has an allergic reaction and sits out`,
            badgeClass: 'badge-danger'
          });
          eventsThisCourse++;
        }

        // Spill disaster
        if ((10 - s.endurance) * 0.012 + Math.random() * 0.12 > 0.16) {
          if (eventsThisCourse >= numEvents) return;
          raw -= 0.075; // halved from full penalty
          personalScores[p] = (personalScores[p] || 0) - 2.0;
          const arch = players.find(pl => pl.name === p)?.archetype || '';
          let reactionText;
          if (['villain', 'schemer'].includes(arch)) reactionText = `${_rp(teammates.filter(m=>m!==p)) || 'The chef'} immediately blames ${p}. "This is YOUR fault!"`;
          else if (['hero', 'loyal-soldier'].includes(arch)) reactionText = `${_rp(teammates.filter(m=>m!==p)) || 'The chef'} puts a hand on ${p}'s shoulder. "It's okay. We'll figure it out."`;
          else reactionText = `${_rp(teammates.filter(m=>m!==p)) || 'The chef'} stares at the mess in disbelief.`;
          _pushCourseEvent({
            type: 'spill-disaster',
            course,
            players: [p],
            text: `${p} trips carrying the finished ${dishes[t.name][course]} to the serving station. The dish hits the floor. Everything goes silent. ${reactionText}`,
            badge: 'Spill Disaster',
            badgeText: `${p} spills the ${course} on the floor`,
            badgeClass: 'badge-danger'
          });
          eventsThisCourse++;
        }

        // Wrong recipe
        if ((10 - s.mental) * 0.01 + Math.random() * 0.12 > 0.15) {
          if (eventsThisCourse >= numEvents) return;
          raw -= 0.15;
          personalScores[p] = (personalScores[p] || 0) - 2.0;
          _pushCourseEvent({
            type: 'wrong-recipe',
            course,
            players: [p],
            text: `${p} misreads the recipe. Salt instead of sugar. The ${dishes[t.name][course]} is unsalvageable. "How do you confuse SALT and SUGAR?" the chef groans.`,
            badge: 'Wrong Recipe',
            badgeText: `${p} misreads the recipe — dish ruined`,
            badgeClass: 'badge-danger'
          });
          eventsThisCourse++;
        }

        // Raw food scare
        if ((10 - s.intuition) * 0.012 + Math.random() * 0.12 > 0.15) {
          if (eventsThisCourse >= numEvents) return;
          raw -= 0.2;
          personalScores[p] = (personalScores[p] || 0) - 2.0;
          if (chefs[t.name].style === 'delegator') {
            addCookingHeat(chefs[t.name].name, 0.5, 1); // Chef blame
          }
          _pushCourseEvent({
            type: 'raw-food-scare',
            course,
            players: [p],
            text: `${host} cuts into the ${dishes[t.name][course]} and finds it raw in the center. The look of disgust on ${host}'s face says it all. ${p} shrinks into the background.`,
            badge: 'Raw Food',
            badgeText: `${p} serves undercooked food`,
            badgeClass: 'badge-danger'
          });
          eventsThisCourse++;
        }
      }); // end per-player disaster loop

      // ── Oven malfunction (random per tribe per course) ──
      if (Math.random() < 0.18 && eventsThisCourse < numEvents) {
        raw -= 0.1;
        const otherTribe = tribes.find(ot => ot !== t);
        const sharing = otherTribe ? Math.random() < 0.5 : false;
        if (sharing && otherTribe) {
          addBond(chef.name, chefs[otherTribe.name].name, 0.2);
          _pushCourseEvent({
            type: 'oven-malfunction-share',
            course,
            players: [chefs[t.name].name, chefs[otherTribe.name].name],
            text: `${t.name}'s oven breaks mid-${course}. ${otherTribe.name}'s chef lets them share. An unexpected act of sportsmanship — or a strategic move to slow them down.`,
            badge: 'Oven Malfunction',
            badgeText: `${t.name}'s oven breaks — ${otherTribe.name} shares theirs`,
            badgeClass: 'badge-warning'
          });
        } else {
          _pushCourseEvent({
            type: 'oven-malfunction',
            course,
            players: t.members.slice(0, 3),
            text: `${t.name}'s oven dies. They scramble to stovetop — everything takes longer, nothing browns right.`,
            badge: 'Oven Down',
            badgeText: `${t.name}'s oven breaks`,
            badgeClass: 'badge-danger'
          });
        }
        eventsThisCourse++;
      }

      // ── Cooking Drama (pair-based) ──
      if (pair.length === 2 && eventsThisCourse < numEvents) {
        const pairBond = getBond(pair[0], pair[1]);

        // Food fight
        if (pairBond <= 0 && Math.random() < 0.2) {
          const b0 = pStats(pair[0]).boldness, b1 = pStats(pair[1]).boldness;
          const fightIntensity = (b0 + b1) * 0.02;
          raw -= 0.1 * fightIntensity;
          addBond(pair[0], pair[1], -0.5);
          personalScores[pair[0]] = (personalScores[pair[0]] || 0) - 0.5;
          personalScores[pair[1]] = (personalScores[pair[1]] || 0) - 0.5;

          let isRomantic = false;
          // Romance check: compatible pair with bond >= 2 turns it into flirting
          if (seasonConfig.romance !== 'disabled' && pairBond >= 2 && typeof romanticCompat === 'function' && romanticCompat(pair[0], pair[1])) {
            isRomantic = true;
            addBond(pair[0], pair[1], 0.5 + 0.5); // net +0.0 with the -0.5 above => +0.5
            raw -= 0.05;
            _challengeRomanceSpark(pair[0], pair[1], ep, phaseKey, phases, personalScores, 'food-fight-flirt');
          }

          foodFightLog.push({ players: [pair[0], pair[1]], romantic: isRomantic });

          if (isRomantic) {
            const pr0 = pronouns(pair[0]), pr1 = pronouns(pair[1]);
            const flirtTexts = [
              `${pair[0]} and ${pair[1]} are arguing over the seasoning. Flour gets thrown. Then more flour. Then they're both laughing, covered in white, and nobody's sure if they're fighting or flirting.`,
              `The "food fight" between ${pair[0]} and ${pair[1]} involves a lot of close proximity, a lot of eye contact, and custard in ${pair[1]}'s hair. ${pr0.Sub} wipes it off slowly. The kitchen watches.`,
              `${pair[0]} smears sauce on ${pair[1]}'s face. ${pair[1]} does it right back. They're grinning. This isn't a fight — this is foreplay.`
            ];
            _pushCourseEvent({
              type: 'food-fight-flirt',
              course,
              players: [pair[0], pair[1]],
              text: _rp(flirtTexts),
              badge: 'Food Fight Flirt',
              badgeText: `${pair[0]} and ${pair[1]}'s food fight turns romantic`,
              badgeClass: 'badge-pink'
            });
          } else {
            const fightTexts = [
              `${pair[0]} and ${pair[1]} disagree on the ${dishes[t.name][course]}. It escalates. Food flies. The dish suffers.`,
              `A full-on food fight erupts between ${pair[0]} and ${pair[1]}. Sauce on the ceiling, flour everywhere. The ${course} is a casualty.`,
              `${pair[0]} throws a spatula at ${pair[1]}. ${pair[1]} throws it back. The chef screams. Nobody's cooking.`
            ];
            _pushCourseEvent({
              type: 'food-fight',
              course,
              players: [pair[0], pair[1]],
              text: _rp(fightTexts),
              badge: 'Food Fight',
              badgeText: `${pair[0]} and ${pair[1]} fight in the kitchen`,
              badgeClass: 'badge-warning'
            });
          }
          eventsThisCourse++;
        }

        // Taste war
        if (pStats(pair[0]).intuition >= 5 && pStats(pair[1]).intuition >= 5 && Math.random() < 0.28 && eventsThisCourse < numEvents) {
          const i0 = pStats(pair[0]).intuition, i1 = pStats(pair[1]).intuition;
          const twWinner = i0 + Math.random() * 2 >= i1 + Math.random() * 2 ? pair[0] : pair[1];
          const twLoser = twWinner === pair[0] ? pair[1] : pair[0];
          raw += 0.03;
          const loserArch = players.find(p => p.name === twLoser)?.archetype || '';
          if (['villain', 'schemer'].includes(loserArch)) addBond(twLoser, twWinner, -0.3);
          else addBond(twLoser, twWinner, 0.1);
          _pushCourseEvent({
            type: 'taste-war',
            course,
            players: [twWinner, twLoser],
            text: `${twWinner} and ${twLoser} disagree on the seasoning. ${twWinner}'s version wins — and everyone knows it. ${twLoser} ${['villain','schemer'].includes(loserArch) ? "doesn't forget" : 'takes it with grace'}.`,
            badge: 'Taste War',
            badgeText: `${twWinner} wins the seasoning debate`,
            badgeClass: 'badge-warning'
          });
          eventsThisCourse++;
        }

        // Perfect pairing
        if (pairBond >= 4 && Math.random() < 0.3 && eventsThisCourse < numEvents) {
          raw += 0.1;
          addBond(pair[0], pair[1], 0.3);
          personalScores[pair[0]] = (personalScores[pair[0]] || 0) + 0.5;
          personalScores[pair[1]] = (personalScores[pair[1]] || 0) + 0.5;

          // Showmance cooking moment
          let showmanceMoment = false;
          if (seasonConfig.romance !== 'disabled') {
            const isPairShowmance = gs.showmances?.some(sh => sh.players.includes(pair[0]) && sh.players.includes(pair[1]) && sh.phase !== 'broken-up');
            if (isPairShowmance) {
              showmanceMoment = true;
              _checkShowmanceChalMoment(ep, phaseKey, phases, personalScores, 'teamwork', tribes);
            } else if (typeof romanticCompat === 'function' && romanticCompat(pair[0], pair[1])) {
              _challengeRomanceSpark(pair[0], pair[1], ep, phaseKey, phases, personalScores, 'cooking-spark');
              showmanceMoment = true;
            }
          }

          if (showmanceMoment) {
            const pr0 = pronouns(pair[0]);
            _pushCourseEvent({
              type: 'cooking-spark',
              course,
              players: [pair[0], pair[1]],
              text: `${pair[0]} and ${pair[1]} cook in perfect sync. Hands brush over the cutting board. ${pair[0]} has flour on ${pr0.posAdj} face — ${pair[1]} reaches over and wipes it off. The kitchen goes quiet for a beat.`,
              badge: 'Cooking Spark',
              badgeText: `${pair[0]} and ${pair[1]} share a moment in the kitchen`,
              badgeClass: 'badge-pink'
            });
          } else {
            _pushCourseEvent({
              type: 'perfect-pairing',
              course,
              players: [pair[0], pair[1]],
              text: `${pair[0]} and ${pair[1]} are in perfect sync. One chops, the other seasons. No words needed — they just know. The ${dishes[t.name][course]} comes together beautifully.`,
              badge: 'Perfect Pairing',
              badgeText: `${pair[0]} and ${pair[1]} cook in harmony`,
              badgeClass: 'badge-success'
            });
          }
          eventsThisCourse++;
        }

        // Dish stealing
        if (eventsThisCourse < numEvents) {
          const thief = pair.find(p => {
            const a = players.find(pl => pl.name === p)?.archetype || '';
            return ['schemer', 'villain'].includes(a) && getBond(p, pair.find(q => q !== p)) <= 1;
          });
          if (thief && Math.random() < 0.22) {
            const victim = pair.find(p => p !== thief);
            personalScores[thief] = (personalScores[thief] || 0) + 1.0;
            personalScores[victim] = (personalScores[victim] || 0) - 1.0;
            addBond(victim, thief, -1.5);
            const pr = pronouns(thief);
            _pushCourseEvent({
              type: 'dish-stealing',
              course,
              players: [thief, victim],
              text: `${thief} claims ${victim}'s work as ${pr.pos} in front of ${host}. "I did all of this." ${victim} stands there, jaw dropped. ${pr.Sub} knows. Everyone will know.`,
              badge: 'Credit Thief',
              badgeText: `${thief} steals credit from ${victim}`,
              badgeClass: 'badge-danger'
            });
            eventsThisCourse++;
          }
        }

        // Chopping competition
        if (Math.random() < 0.25 && eventsThisCourse < numEvents) {
          const p0 = pStats(pair[0]).physical, p1 = pStats(pair[1]).physical;
          const chopWin = p0 + Math.random() * 2 >= p1 + Math.random() * 2 ? pair[0] : pair[1];
          const chopLose = chopWin === pair[0] ? pair[1] : pair[0];
          raw += 0.05;
          addBond(pair[0], pair[1], 0.2);
          personalScores[chopWin] = (personalScores[chopWin] || 0) + 0.5;
          const loserTemp = pStats(chopLose).temperament;
          if (loserTemp < 4) addBond(chopLose, chopWin, -0.15);
          _pushCourseEvent({
            type: 'chopping-competition',
            course,
            players: [chopWin, chopLose],
            text: `${chopWin} and ${chopLose} get into a spontaneous chopping race. Knives flying, onions diced in seconds. ${chopWin} wins — ${chopLose} ${loserTemp >= 5 ? 'laughs it off' : 'grumbles about it for the rest of the course'}.`,
            badge: 'Chop-Off',
            badgeText: `${chopWin} wins the chopping race`,
            badgeClass: 'badge-info'
          });
          eventsThisCourse++;
        }

        // Kitchen dance
        if (pairBond >= 3 && Math.random() < 0.22 && eventsThisCourse < numEvents) {
          const avgSocial = (pStats(pair[0]).social + pStats(pair[1]).social) * 0.05;
          raw += 0.03 * avgSocial;
          addBond(pair[0], pair[1], 0.3);
          _pushCourseEvent({
            type: 'kitchen-dance',
            course,
            players: [pair[0], pair[1]],
            text: `${pair[0]} and ${pair[1]} start vibing. Someone hums, someone dances, and suddenly they're cooking with rhythm. It's goofy and beautiful and the food is somehow better for it.`,
            badge: 'Kitchen Dance',
            badgeText: `${pair[0]} and ${pair[1]} dance while cooking`,
            badgeClass: 'badge-info'
          });
          eventsThisCourse++;
        }

        // Comfort cooking
        if (Math.random() < 0.18 && eventsThisCourse < numEvents) {
          const comforter = _rp(pair);
          const cStats = pStats(comforter);
          const comfRoll = cStats.intuition * 0.04 + Math.random() * 0.3;
          if (comfRoll > 0.4) {
            raw += 0.05;
            const taster = pair.find(p => p !== comforter) || _rp(teammates);
            if (taster) addBond(taster, comforter, 0.3);
            _pushCourseEvent({
              type: 'comfort-cooking-success',
              course,
              players: [comforter, taster].filter(Boolean),
              text: `${comforter} goes off-script and cooks something from home instead. It's risky — but ${taster ? taster + ' tastes it and' : 'the team'} tears up. "This reminds me of..." It works. It more than works.`,
              badge: 'Comfort Food',
              badgeText: `${comforter}'s family recipe hits home`,
              badgeClass: 'badge-success'
            });
          } else {
            raw -= 0.05;
            _pushCourseEvent({
              type: 'comfort-cooking-fail',
              course,
              players: [comforter],
              text: `${comforter} goes off-script with a family recipe. It... does not translate. "My grandma would be so disappointed," ${pronouns(comforter).sub} mumbles.`,
              badge: 'Off-Script Fail',
              badgeText: `${comforter}'s family recipe doesn't work`,
              badgeClass: 'badge-warning'
            });
          }
          eventsThisCourse++;
        }

        // Mentor moment
        if (eventsThisCourse < numEvents) {
          const highMental = pair.find(p => pStats(p).mental >= 7);
          const lowMental = pair.find(p => pStats(p).mental <= 4);
          if (highMental && lowMental && highMental !== lowMental && Math.random() < 0.2) {
            raw += 0.05;
            addBond(highMental, lowMental, 0.4);
            personalScores[highMental] = (personalScores[highMental] || 0) + 0.5;
            _pushCourseEvent({
              type: 'mentor-moment',
              course,
              players: [highMental, lowMental],
              text: `${highMental} notices ${lowMental} struggling and quietly takes over. "Here — hold the knife like this. No, LIKE THIS." By the end, ${lowMental} is cooking with confidence.`,
              badge: 'Mentor',
              badgeText: `${highMental} teaches ${lowMental} to cook`,
              badgeClass: 'badge-success'
            });
            eventsThisCourse++;
          }
        }

        // Encouragement
        if (eventsThisCourse < numEvents) {
          const encourager = pair.find(p => pStats(p).social >= 6);
          const struggler = pair.find(p => pStats(p).mental <= 5 && p !== encourager);
          if (encourager && struggler && Math.random() < 0.28) {
            personalScores[struggler] = (personalScores[struggler] || 0) + 0.5;
            raw += 0.05;
            addBond(encourager, struggler, 0.2);
            _pushCourseEvent({
              type: 'encouragement',
              course,
              players: [encourager, struggler],
              text: `${encourager} sees ${struggler} losing confidence. "Hey — you've got this. Trust yourself." ${struggler} takes a breath and finishes the dish. It's better than anyone expected.`,
              badge: 'Encouragement',
              badgeText: `${encourager} hypes up ${struggler}`,
              badgeClass: 'badge-success'
            });
            eventsThisCourse++;
          }
        }
      } // end pair-based drama

      // ── Positive Events (any player) ──
      pair.forEach(p => {
        if (!p || eventsThisCourse >= numEvents) return;
        const s = pStats(p);

        // Natural talent
        if (s.intuition + Math.random() * 4 >= 8 && Math.random() < 0.22) {
          raw += 0.1;
          personalScores[p] = (personalScores[p] || 0) + 1.5;
          _pushCourseEvent({
            type: 'natural-talent',
            course,
            players: [p],
            text: `${p} is... actually incredible at this? Nobody saw it coming. The ${dishes[t.name][course]} is transformed. "Who KNEW ${pronouns(p).sub} could cook?" someone whispers.`,
            badge: 'Natural Talent',
            badgeText: `${p} discovers a hidden cooking talent`,
            badgeClass: 'badge-success'
          });
          eventsThisCourse++;
        }

        // Plating artist
        if (s.mental + Math.random() * 4 >= 8 && Math.random() < 0.22 && eventsThisCourse < numEvents) {
          raw += 0.05;
          _pushCourseEvent({
            type: 'plating-artist',
            course,
            players: [p],
            text: `${p}'s plating is a work of art. The ${dishes[t.name][course]} looks like it belongs in a five-star restaurant. ${host} eats with ${pronouns(host).posAdj || 'their'} eyes first — and they like what they see.`,
            badge: 'Plating Artist',
            badgeText: `${p}'s plating is stunning`,
            badgeClass: 'badge-success'
          });
          eventsThisCourse++;
        }

        // Taste tester hero
        if (s.intuition * 0.02 + Math.random() * 0.12 > 0.18 && eventsThisCourse < numEvents) {
          raw += 0.1;
          personalScores[p] = (personalScores[p] || 0) + 1.5;
          _pushCourseEvent({
            type: 'taste-tester-hero',
            course,
            players: [p],
            text: `${p} catches a problem right before serving — way too salty. Quick fix, disaster averted. Nobody but ${p} will ever know how close that was.`,
            badge: 'Taste Tester Hero',
            badgeText: `${p} catches a problem before serving`,
            badgeClass: 'badge-success'
          });
          eventsThisCourse++;
        }

        // Crowd pleaser
        if (s.intuition >= 6 && s.boldness >= 5 && Math.random() < 0.25 && eventsThisCourse < numEvents) {
          raw += 0.08;
          _pushCourseEvent({
            type: 'crowd-pleaser',
            course,
            players: [p],
            text: `${p} adds a creative twist that nobody asked for. It's bold, it's risky — and ${host} LOVES it. "Now THAT'S thinking outside the box."`,
            badge: 'Crowd Pleaser',
            badgeText: `${p}'s creative twist impresses ${host}`,
            badgeClass: 'badge-success'
          });
          eventsThisCourse++;
        }

        // Flavor breakthrough
        if (s.intuition * 0.018 + Math.random() * 0.12 > 0.17 && eventsThisCourse < numEvents) {
          raw += 0.08;
          _pushCourseEvent({
            type: 'flavor-breakthrough',
            course,
            players: [p],
            text: `${p} experiments with something unexpected. "Wait... taste this." Everyone stops. It's incredible. The dish just went from good to unforgettable.`,
            badge: 'Flavor Breakthrough',
            badgeText: `${p} discovers an amazing flavor combination`,
            badgeClass: 'badge-success'
          });
          eventsThisCourse++;
        }

        // Garnish save
        if (s.mental * 0.015 + Math.random() * 0.12 > 0.16 && eventsThisCourse < numEvents) {
          raw += 0.05;
          _pushCourseEvent({
            type: 'garnish-save',
            course,
            players: [p],
            text: `The ${dishes[t.name][course]} looks rough — until ${p} steps in with a sauce drizzle, fresh herb garnish, and artistic plating. Saved by presentation.`,
            badge: 'Garnish Save',
            badgeText: `${p} saves the dish with presentation`,
            badgeClass: 'badge-success'
          });
          eventsThisCourse++;
        }

        // Efficient prep
        if (s.endurance + Math.random() * 3 >= 7 && Math.random() < 0.20 && eventsThisCourse < numEvents) {
          raw += 0.03;
          _pushCourseEvent({
            type: 'efficient-prep',
            course,
            players: [p],
            text: `${p} preps at twice the speed of everyone else. Ingredients chopped, stations clean, time to spare. The team breathes easier.`,
            badge: 'Speed Prep',
            badgeText: `${p}'s fast prep gives the team breathing room`,
            badgeClass: 'badge-info'
          });
          eventsThisCourse++;
        }

        // Clean station (prevents future disaster)
        if (s.endurance + Math.random() * 3 >= 6 && s.mental + Math.random() * 3 >= 6 && Math.random() < 0.20 && eventsThisCourse < numEvents) {
          disasterPrevented[t.name]++;
          _pushCourseEvent({
            type: 'clean-station',
            course,
            players: [p],
            text: `${p} keeps their station immaculate. Everything in its place, every surface clean. It's not flashy, but it prevents chaos.`,
            badge: 'Clean Station',
            badgeText: `${p} keeps the kitchen organized`,
            badgeClass: 'badge-info'
          });
          eventsThisCourse++;
        }

        // Presentation disaster
        if ((10 - s.mental) * 0.008 + Math.random() * 0.1 > 0.13 && eventsThisCourse < numEvents) {
          raw -= 0.08;
          _pushCourseEvent({
            type: 'presentation-disaster',
            course,
            players: [p],
            text: `The ${dishes[t.name][course]} tastes fine but looks like someone sat on it. ${host} winces before even tasting. "I eat with my eyes first, people."`,
            badge: 'Ugly Dish',
            badgeText: `${p}'s plating is a disaster`,
            badgeClass: 'badge-warning'
          });
          eventsThisCourse++;
        }
      }); // end per-player positive events

      // ── Sous chef clutch (only if chef locked out this course) ──
      if (chefLockedOut[t.name] === course && eventsThisCourse < numEvents) {
        const sousChef = pair[0] || _rp(teammates);
        if (sousChef) {
          raw += 0.1;
          personalScores[sousChef] = (personalScores[sousChef] || 0) + 1.5;
          _pushCourseEvent({
            type: 'sous-chef-clutch',
            course,
            players: [sousChef],
            text: `With ${chefs[t.name].name} locked in the fridge, ${sousChef} steps up. Takes charge. Rallies the team. The ${course} comes out... incredible. A real leader just emerged.`,
            badge: 'Sous Chef Hero',
            badgeText: `${sousChef} steps up when the chef is gone`,
            badgeClass: 'badge-success'
          });
          eventsThisCourse++;
        }
      }

      // ── Underdog cook ──
      if (eventsThisCourse < numEvents) {
        const lowestMental = pair.filter(Boolean).reduce((best, m) => {
          return pStats(m).mental < pStats(best).mental ? m : best;
        }, pair[0]);
        if (lowestMental && pStats(lowestMental).mental <= 4 && raw > 0.5 && Math.random() < 0.3) {
          personalScores[lowestMental] = (personalScores[lowestMental] || 0) + 1.5;
          pushEvent({
            type: 'underdog-cook',
            course,
            players: [lowestMental],
            text: `Nobody expected ${lowestMental} to cook well. ${pronouns(lowestMental).Sub} surprised everyone — including ${pronouns(lowestMental).ref}. The ${dishes[t.name][course]} is genuinely good.`,
            badge: 'Underdog Cook',
            badgeText: `${lowestMental} surprises everyone with cooking skills`,
            badgeClass: 'badge-success'
          });
          eventsThisCourse++;
        }
      }

      // ── Cross-team events ──
      _currentTribe = null; // cross-tribe
      if (tribes.length >= 2 && eventsThisCourse < numEvents) {
        const otherTribe = tribes.find(ot => ot !== t);
        if (otherTribe) {
          // Ingredient theft
          const thiefCandidate = t.members.find(m => {
            const a = players.find(pl => pl.name === m)?.archetype || '';
            return ['schemer', 'villain'].includes(a);
          });
          if (thiefCandidate && Math.random() < 0.08) {
            const thiefS = pStats(thiefCandidate);
            const stealRoll = thiefS.strategic * 0.02 + Math.random() * 0.3;
            // Caught check — best intuition on victim team
            const bestIntuition = otherTribe.members.reduce((best, m) => Math.max(best, pStats(m).intuition), 0);
            const caught = bestIntuition * 0.03 + Math.random() * 0.2 > stealRoll;

            if (caught) {
              addCookingHeat(thiefCandidate, 2.5, 3);
              personalScores[thiefCandidate] = (personalScores[thiefCandidate] || 0) - 2.0;
              otherTribe.members.forEach(m => { addBond(m, thiefCandidate, -0.5); });
              // Own team reaction
              t.members.forEach(m => {
                if (m === thiefCandidate) return;
                const a = players.find(pl => pl.name === m)?.archetype || '';
                if (['hero', 'loyal-soldier'].includes(a)) addBond(m, thiefCandidate, -0.3);
              });
              sabotageLog.push({ type: 'ingredient-theft', perpetrator: thiefCandidate, target: otherTribe.name, caught: true });
              pushEvent({
                type: 'ingredient-theft-caught',
                course,
                players: [thiefCandidate, otherTribe.members[0]],
                text: `${thiefCandidate} sneaks into ${otherTribe.name}'s kitchen and gets CAUGHT stealing ingredients. The look of betrayal. The shame. This will not be forgotten.`,
                badge: 'Saboteur Caught!',
                badgeText: `${thiefCandidate} caught stealing from ${otherTribe.name}`,
                badgeClass: 'badge-danger'
              });
            } else {
              raw += 0.05;
              courseModifiers[otherTribe.name][course] -= 0.1;
              personalScores[thiefCandidate] = (personalScores[thiefCandidate] || 0) + 1.0;
              addCookingHeat(thiefCandidate, 0.5, 1); // minor heat even if not caught — karma
              sabotageLog.push({ type: 'ingredient-theft', perpetrator: thiefCandidate, target: otherTribe.name, caught: false });
              pushEvent({
                type: 'ingredient-theft-success',
                course,
                players: [thiefCandidate],
                text: `${thiefCandidate} slips into ${otherTribe.name}'s kitchen unseen. Steals their best ingredient. ${otherTribe.name} scrambles to improvise. Nobody suspects a thing.`,
                badge: 'Ingredient Thief',
                badgeText: `${thiefCandidate} steals from ${otherTribe.name} undetected`,
                badgeClass: 'badge-warning'
              });
            }
            eventsThisCourse++;
          }

          // Spice bomb
          const spiceBomber = t.members.find(m => {
            const a = players.find(pl => pl.name === m)?.archetype || '';
            return ['chaos-agent'].includes(a);
          });
          if (spiceBomber && Math.random() < 0.06 && eventsThisCourse < numEvents) {
            const spiceS = pStats(spiceBomber);
            const caughtRoll = Math.random() < 0.4;
            if (caughtRoll) {
              // Ejected from own kitchen for a course
              satOutPlayers.add(spiceBomber);
              addBond(spiceBomber, chefs[t.name].name, -0.5);
              t.members.forEach(m => { if (m !== spiceBomber) addBond(m, spiceBomber, -0.3); });
              pushEvent({
                type: 'spice-bomb-caught',
                course,
                players: [spiceBomber],
                text: `${spiceBomber} tries to dump hot sauce into ${otherTribe.name}'s dish and gets caught red-handed. ${pronouns(spiceBomber).Sub}'s ejected from ${pronouns(spiceBomber).posAdj} own kitchen. ${t.name} is down a cook.`,
                badge: 'Spice Bomb Fail',
                badgeText: `${spiceBomber} caught sabotaging and ejected`,
                badgeClass: 'badge-danger'
              });
            } else {
              courseModifiers[otherTribe.name][course] -= 0.15;
              sabotageLog.push({ type: 'spice-bomb', perpetrator: spiceBomber, target: otherTribe.name, caught: false });
              pushEvent({
                type: 'spice-bomb-success',
                course,
                players: [spiceBomber],
                text: `${spiceBomber} sneaks a handful of ghost pepper flakes into ${otherTribe.name}'s ${course}. Nobody notices. The host is about to have a very spicy surprise.`,
                badge: 'Spice Bomb',
                badgeText: `${spiceBomber} sabotages ${otherTribe.name}'s dish`,
                badgeClass: 'badge-warning'
              });
            }
            eventsThisCourse++;
          }

          // Distraction play
          const distractor = t.members.find(m => {
            const a = players.find(pl => pl.name === m)?.archetype || '';
            return ['mastermind', 'schemer'].includes(a) && pStats(m).strategic >= 6;
          });
          if (distractor && Math.random() < 0.08 && eventsThisCourse < numEvents) {
            const distractS = pStats(distractor);
            const effective = distractS.social * 0.04 + Math.random() * 0.2 > 0.35;
            if (effective) courseModifiers[otherTribe.name][course] -= 0.05;
            pushEvent({
              type: 'distraction-play',
              course,
              players: [distractor, chefs[otherTribe.name].name],
              text: `${distractor} wanders over to chat up ${chefs[otherTribe.name].name}. "So how's YOUR dish coming?" It's a stall tactic — ${effective ? 'and it works. The opposing chef loses precious minutes.' : 'but ' + chefs[otherTribe.name].name + ' sees right through it.'}`,
              badge: 'Distraction',
              badgeText: `${distractor} distracts ${otherTribe.name}'s chef`,
              badgeClass: 'badge-warning'
            });
            eventsThisCourse++;
          }

          // Trash talk
          if (Math.random() < 0.1 && eventsThisCourse < numEvents) {
            const talker = _rp(t.members);
            const target = _rp(otherTribe.members);
            const talkBold = pStats(talker).boldness, targetBold = pStats(target).boldness;
            const talkWin = talkBold + Math.random() * 2 >= targetBold + Math.random() * 2;
            if (talkWin) courseModifiers[t.name][course] += 0.03;
            else courseModifiers[otherTribe.name][course] += 0.03;
            addBond(talker, target, -0.2);
            t.members.forEach(m => { if (m !== talker) addBond(m, talker, 0.1); }); // tribe solidarity
            pushEvent({
              type: 'trash-talk',
              course,
              players: [talker, target],
              text: `${talker} yells through the wall at ${target}: "Your ${course} looks like DOG FOOD!" ${talkWin ? target + ' has no comeback. ' + t.name + ' rides the momentum.' : target + ' fires back harder. ' + otherTribe.name + ' gets the last word.'}`,
              badge: 'Trash Talk',
              badgeText: `${talkWin ? talker : target} wins the trash talk`,
              badgeClass: 'badge-warning'
            });
            eventsThisCourse++;
          }

          // Copycat accusation
          if (Math.random() < 0.06 && eventsThisCourse < numEvents) {
            const accuser = _rp(t.members);
            addBond(accuser, _rp(otherTribe.members), -0.3);
            pushEvent({
              type: 'copycat-accusation',
              course,
              players: [accuser, otherTribe.members[0]],
              text: `${accuser} looks over at ${otherTribe.name}'s station. "Are you COPYING us?!" It devolves into a shouting match across the kitchen. No resolution, just drama.`,
              badge: 'Copycat Accusation',
              badgeText: `${accuser} accuses ${otherTribe.name} of copying`,
              badgeClass: 'badge-warning'
            });
            eventsThisCourse++;
          }

          // Kitchen spy
          if (Math.random() < 0.08 && eventsThisCourse < numEvents) {
            const spy = t.members.find(m => pStats(m).strategic >= 6);
            if (spy) {
              pushEvent({
                type: 'kitchen-spy',
                course,
                players: [spy],
                text: `${spy} sneaks a peek at ${otherTribe.name}'s kitchen. Takes mental notes. Adjusts ${t.name}'s strategy accordingly. Nobody noticed.`,
                badge: 'Kitchen Spy',
                badgeText: `${spy} spies on ${otherTribe.name}`,
                badgeClass: 'badge-info'
              });
              eventsThisCourse++;
            }
          }
        }
      }

      // ── Teamwork montage (all courses scored 5+ so far — check after scoring) ──
      // We'll check this after scoring below.

      // ── Clamp raw score ──
      raw = Math.max(0, Math.min(1.0, raw));

      // ── Score → Rating ──
      const rating = rawToRating(raw);
      const hostReaction = getHostReaction(rating);

      courseScores[t.name][course] = { raw, rating, hostReaction };

      // Personal scoring per course
      pair.forEach(p => {
        if (!p) return;
        if (rating >= 8) personalScores[p] = (personalScores[p] || 0) + 2.0;
        else if (rating >= 5) personalScores[p] = (personalScores[p] || 0) + 1.0;
        else personalScores[p] = (personalScores[p] || 0) - 0.5;
      });

      // Timeline: course result
      timeline.push({
        kind: 'course-result',
        tribe: t.name,
        course,
        dish: dishes[t.name][course],
        dishDesc: dishDetails[t.name][course].desc,
        cooks: pair.filter(Boolean),
        rating,
        raw,
        hostReaction,
        tribeColor: tribeColor(t.name)
      });
    }); // end per-tribe

    // ── Showmance challenge moment per course (partner interaction) ──
    if (seasonConfig.romance !== 'disabled') {
      _checkShowmanceChalMoment(ep, phaseKey, phases, personalScores, 'partner-interaction', tribes);
    }

    // ── Too many cooks check (3+ tribe members cluster on one course) ──
    // Not implemented in scoring since pairs are fixed, but as narrative event
  }); // end per-course

  // ── Teamwork montage check ──
  tribes.forEach(t => {
    const scores = COURSES.map(c => courseScores[t.name][c]?.rating || 0);
    if (scores.every(s => s >= 5) && Math.random() < 0.2) {
      COURSES.forEach(c => { courseScores[t.name][c].raw += 0.05; });
      // Bond boost for neutral-ish pairs
      const members = t.members;
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          addBond(members[i], members[j], 0.2);
        }
      }
      pushEvent({
        type: 'teamwork-montage',
        course: 'all',
        players: members.slice(0, 4),
        text: `${t.name} hits a groove. Every course, every station, every plate — it all comes together. This is what teamwork looks like. High fives all around.`,
        badge: 'Teamwork Montage',
        badgeText: `${t.name} cooks in perfect harmony`,
        badgeClass: 'badge-success'
      });
    }
  });

  // ── Step 6: Winner Determination ──
  const tribeTotals = {};
  tribes.forEach(t => {
    tribeTotals[t.name] = COURSES.reduce((sum, c) => sum + (courseScores[t.name][c]?.rating || 0), 0);
  });

  // Sort tribes by total, tiebreak by dessert then appetizer
  const ranked = [...tribes].sort((a, b) => {
    const diff = tribeTotals[b.name] - tribeTotals[a.name];
    if (diff !== 0) return diff;
    const dessertDiff = (courseScores[b.name].dessert?.rating || 0) - (courseScores[a.name].dessert?.rating || 0);
    if (dessertDiff !== 0) return dessertDiff;
    return (courseScores[b.name].appetizer?.rating || 0) - (courseScores[a.name].appetizer?.rating || 0);
  });

  const winner = ranked[0];
  const loser = ranked[ranked.length - 1];

  // ── Chef scoring ──
  tribes.forEach(t => {
    const chef = chefs[t.name];
    if (t === winner) {
      personalScores[chef.name] = (personalScores[chef.name] || 0) + 2.5;
    } else {
      personalScores[chef.name] = (personalScores[chef.name] || 0) - 1.5;
    }
  });

  // ── MVP: highest personal score on winning team ──
  let mvp = null, mvpScore = -Infinity;
  winner.members.forEach(m => {
    if ((personalScores[m] || 0) > mvpScore) {
      mvpScore = personalScores[m] || 0;
      mvp = m;
    }
  });

  // ── Heat application ──
  // Tyrant chef heat
  tribes.forEach(t => {
    const chef = chefs[t.name];
    if (chef.style === 'tyrant') {
      if (t === winner) {
        addCookingHeat(chef.name, 0.5, 1);
      } else {
        addCookingHeat(chef.name, 2.0, 2);
      }
    }
  });

  // Fridge lock rebel heat (if team lost)
  if (fridgeLock) {
    const lockTribe = tribes.find(t => t.members.includes(fridgeLock.victim));
    if (lockTribe && lockTribe !== winner) {
      fridgeLock.rebels.forEach(r => {
        addCookingHeat(r, 1.0, 1);
      });
    }
  }

  // ── Step 7: Camp Events ──
  tribes.forEach(t => {
    const chef = chefs[t.name];
    const teammates = t.members.filter(m => m !== chef.name);

    // Positive events
    if (t === winner && mvp) {
      ep.campEvents[t.name].post.push({
        type: 'mvp-chef',
        players: [mvp],
        text: `${mvp} is the undisputed star of the kitchen. The team can't stop talking about ${pronouns(mvp).posAdj} cooking.`,
        badgeText: `MVP Chef: ${mvp}`,
        badgeClass: 'badge-success'
      });
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[mvp] = (gs.popularity[mvp] || 0) + 1; // top chef = camp hero
    }

    // Sous chef hero camp event
    const sousEvent = allEvents.find(e => e.type === 'sous-chef-clutch' && t.members.includes(e.players[0]));
    if (sousEvent) {
      ep.campEvents[t.name].post.push({
        type: 'sous-chef-hero',
        players: [sousEvent.players[0]],
        text: `Everyone's talking about how ${sousEvent.players[0]} stepped up when the chef went down. "That's a real leader," someone says.`,
        badgeText: `Sous Chef Hero: ${sousEvent.players[0]}`,
        badgeClass: 'badge-success'
      });
    }

    // Underdog cook camp event
    const underdogEvent = allEvents.find(e => e.type === 'underdog-cook' && t.members.includes(e.players[0]));
    if (underdogEvent) {
      ep.campEvents[t.name].post.push({
        type: 'underdog-cook-camp',
        players: [underdogEvent.players[0]],
        text: `"Who knew ${underdogEvent.players[0]} could cook?" The tribe is still in disbelief. ${underdogEvent.players[0]} just grins.`,
        badgeText: `Hidden Chef: ${underdogEvent.players[0]}`,
        badgeClass: 'badge-success'
      });
    }

    // Kitchen couple camp event (food fight romance)
    const flirtEvent = allEvents.find(e => e.type === 'food-fight-flirt' && e.players.some(p => t.members.includes(p)));
    if (flirtEvent && seasonConfig.romance !== 'disabled') {
      ep.campEvents[t.name].post.push({
        type: 'kitchen-couple',
        players: flirtEvent.players,
        text: `The food fight between ${flirtEvent.players[0]} and ${flirtEvent.players[1]} is all anyone can talk about. "Were they FLIRTING?" "Obviously."`,
        badgeText: `Kitchen Couple: ${flirtEvent.players[0]} & ${flirtEvent.players[1]}`,
        badgeClass: 'badge-pink'
      });
    }

    // Negative events
    // Disaster culprit
    const disasterEvents = allEvents.filter(e =>
      ['kitchen-fire', 'spill-disaster', 'flambe-explosion'].includes(e.type) &&
      e.players.some(p => t.members.includes(p))
    );
    if (disasterEvents.length > 0) {
      const culprit = disasterEvents[0].players[0];
      ep.campEvents[t.name].post.push({
        type: 'disaster-culprit',
        players: [culprit],
        text: `${culprit} can't escape the kitchen disaster. "${pronouns(culprit).Sub} almost burned the whole place down." The tribe side-eyes ${pronouns(culprit).obj} at dinner.`,
        badgeText: `Kitchen Disaster: ${culprit}`,
        badgeClass: 'badge-danger'
      });
    }

    // Fridge lock drama — deep consequences depending on win/lose
    if (fridgeLock && t.members.includes(fridgeLock.victim)) {
      const _flVictim = fridgeLock.victim;
      const _flRebels = fridgeLock.rebels;
      const _flLead = _flRebels[0];
      const _flVPr = pronouns(_flVictim);
      const _flTeamWon = t === winner;

      if (_flTeamWon) {
        // Team won WITHOUT the tyrant — rebels are vindicated
        _flRebels.forEach(r => { addBond(r, _flVictim, -0.3); }); // rebels don't regret it
        _flRebels.forEach(r => { gs.popularity = gs.popularity || {}; gs.popularity[r] = (gs.popularity[r] || 0) + 1; }); // rebels gain popularity
        addCookingHeat(_flVictim, 0.5, 1); // chef gets minor heat — they were proven unnecessary
        ep.campEvents[t.name].post.push({
          type: 'fridge-lock-drama',
          players: [_flVictim, ..._flRebels],
          text: `The fridge lock is already camp legend. ${_flLead} locked ${_flVictim} in the fridge — and they WON without ${_flVPr.obj}. "${_flVPr.Sub} ${_flVPr.sub === 'they' ? 'weren\'t' : 'wasn\'t'} even needed," ${_flLead} says. ${_flVictim} seethes in silence. The power dynamic has shifted.`,
          consequences: 'Rebels gain popularity. Chef takes minor heat. Bond damage persists.',
          badgeText: 'FRIDGE LOCK — REBELS WIN', badgeClass: 'badge-danger'
        });
      } else {
        // Team lost — rebels are blamed for the loss
        _flRebels.forEach(r => { addCookingHeat(r, 1.5, 2); }); // rebels get targeted
        _flRebels.forEach(r => { addBond(r, _flVictim, -0.5); }); // relationship worsens
        // Non-rebel teammates may side with the chef
        const _nonRebels = t.members.filter(m => m !== _flVictim && !_flRebels.includes(m));
        _nonRebels.forEach(m => { addBond(m, _flLead, -0.3); addBond(m, _flVictim, 0.2); });
        gs.popularity = gs.popularity || {};
        gs.popularity[_flVictim] = (gs.popularity[_flVictim] || 0) + 2; // sympathy popularity
        ep.campEvents[t.name].post.push({
          type: 'fridge-lock-drama',
          players: [_flVictim, ..._flRebels],
          text: `${_flLead} locked ${_flVictim} in the fridge. And they LOST. "You cost us the game," ${_nonRebels.length ? _nonRebels[0] : 'someone'} says to ${_flLead}. ${_flVictim} says nothing — ${_flVPr.sub} doesn't have to. Everyone knows who's getting the votes tonight.`,
          consequences: 'Rebels take heat (1.5 for 2 episodes). Non-rebels side with chef. Chef gets sympathy popularity.',
          badgeText: 'FRIDGE LOCK — REBELS BLAMED', badgeClass: 'badge-danger'
        });
      }
    }

    // Saboteur exposed
    const caughtSabotage = sabotageLog.filter(s => s.caught && t.members.includes(s.perpetrator));
    caughtSabotage.forEach(sab => {
      ep.campEvents[t.name].post.push({
        type: 'saboteur-exposed',
        players: [sab.perpetrator],
        text: `${sab.perpetrator} got caught sabotaging the other team. The tribe is divided — some think it was smart, others think it was dishonorable.`,
        badgeText: `Saboteur: ${sab.perpetrator}`,
        badgeClass: 'badge-danger'
      });
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[sab.perpetrator] = (gs.popularity[sab.perpetrator] || 0) - 2; // caught saboteur = villain edit
      // Give sympathy to the targeted team's representative (target field may not exist — skip if absent)
      if (sab.target) {
        gs.popularity[sab.target] = (gs.popularity[sab.target] || 0) + 1; // victim of sabotage = sympathy
      }
    });

    // Food gobbler shame
    const gobblerEvent = allEvents.find(e => e.type === 'food-gobbler-hide' && t.members.includes(e.players[0]));
    if (gobblerEvent) {
      ep.campEvents[t.name].post.push({
        type: 'food-gobbler-shame',
        players: [gobblerEvent.players[0]],
        text: `Rumors are spreading that ${gobblerEvent.players[0]} ate the team's food. Nobody can prove it... yet.`,
        badgeText: `Food Thief Suspect: ${gobblerEvent.players[0]}`,
        badgeClass: 'badge-warning'
      });
    }

    // Tyrant chef backlash (if team lost)
    if (chef.style === 'tyrant' && t !== winner) {
      ep.campEvents[t.name].post.push({
        type: 'tyrant-backlash',
        players: [chef.name, ...teammates.slice(0, 2)],
        text: `Back at camp, the gloves come off. "You treated us like servants in that kitchen," ${teammates[0] || 'someone'} says to ${chef.name}. "And we LOST."`,
        badgeText: `Tyrant Backlash: ${chef.name}`,
        badgeClass: 'badge-danger'
      });
    }

    // Quiet leader appreciation (if team won with standard/quiet chef)
    if (['standard'].includes(chef.style) && t === winner) {
      ep.campEvents[t.name].post.push({
        type: 'quiet-leader',
        players: [chef.name],
        text: `"You know what? ${chef.name} didn't yell, didn't make a scene — just led by example. And we won." The tribe has a new appreciation for quiet leadership.`,
        badgeText: `Quiet Leader: ${chef.name}`,
        badgeClass: 'badge-success'
      });
    }
  });

  // ── Step 8: All-courses-low comedy event ──
  tribes.forEach(t => {
    const total = tribeTotals[t.name];
    if (total <= 6) { // All 3 courses scored 1-2
      ep.campEvents[t.name].post.push({
        type: 'group-shame',
        players: t.members.slice(0, 4),
        text: `${t.name}'s cooking was so bad that ${host} asked if they were trying to lose. Nobody makes eye contact at dinner.`,
        badgeText: `Kitchen Disaster: ${t.name}`,
        badgeClass: 'badge-danger'
      });
    }
  });

  // ── Build timeline: grouped by tribe per course, cross-tribe events separate ──
  // Structure per course: [tribe1 events] → [tribe2 events] → [cross events] → [score reveals]
  const _finalTimeline = [];

  // Pre-cooking: group by tribe, then cross-tribe
  const _preByTribe = {};
  const _preCross = [];
  (eventsByCourse.pre || []).forEach(ev => {
    if (!ev._tribe || ev._tribe === 'cross') _preCross.push(ev);
    else { if (!_preByTribe[ev._tribe]) _preByTribe[ev._tribe] = []; _preByTribe[ev._tribe].push(ev); }
  });
  // Cross-tribe first (chef showdown), then per-tribe leadership
  _finalTimeline.push(..._preCross);
  tribes.forEach(t => { if (_preByTribe[t.name]) _finalTimeline.push(..._preByTribe[t.name]); });

  // Per course: tribe groups → cross-tribe → score reveals
  COURSES.forEach(course => {
    const courseEvents = [...(eventsByCourse[course] || [])];
    const _byTribe = {};
    const _cross = [];
    courseEvents.forEach(ev => {
      if (!ev._tribe || ev._tribe === 'cross') _cross.push(ev);
      else { if (!_byTribe[ev._tribe]) _byTribe[ev._tribe] = []; _byTribe[ev._tribe].push(ev); }
    });
    // Shuffle within each tribe group, then fix chain ordering
    tribes.forEach(t => {
      const group = _byTribe[t.name] || [];
      // Separate chain items from shuffleable items
      const chains = group.filter(ev => ev._chainAfter);
      const shuffleable = group.filter(ev => !ev._chainAfter);
      // Shuffle non-chain items
      for (let _ti = shuffleable.length - 1; _ti > 0; _ti--) {
        const _tj = Math.floor(Math.random() * (_ti + 1));
        [shuffleable[_ti], shuffleable[_tj]] = [shuffleable[_tj], shuffleable[_ti]];
      }
      // Re-insert chain items after their parent (match by _chainId or type)
      const ordered = [...shuffleable];
      chains.forEach(ch => {
        const parentIdx = ordered.findIndex(ev => (ev._chainId && ev._chainId === ch._chainAfter) || ev.type === ch._chainAfter);
        if (parentIdx >= 0) ordered.splice(parentIdx + 1, 0, ch);
        else ordered.push(ch);
      });
      _finalTimeline.push(...ordered);
    });
    // Cross-tribe events
    if (_cross.length) _finalTimeline.push(..._cross);
    // Score reveals per tribe
    tribes.forEach(t => {
      const cr = timeline.find(item => item.kind === 'course-result' && item.course === course && item.tribe === t.name);
      if (cr) _finalTimeline.push(cr);
    });
  });
  // Post events
  _finalTimeline.push(...(eventsByCourse.post || []));

  // ── Build ep data ──
  ep.isHellsKitchen = true;
  ep.hellsKitchen = {
    chefs,
    assignments,
    dishes,
    courseScores,
    timeline: _finalTimeline,
    events: allEvents,
    fridgeLock,
    sabotage: sabotageLog,
    foodFights: foodFightLog,
    winner: winner.name,
    loser: loser.name,
    mvp
  };

  ep.winner = winner;
  ep.loser = loser;
  ep.safeTribes = tribes.length > 2 ? tribes.filter(t => t !== winner && t !== loser) : [];
  ep.challengeType = 'tribe';
  ep.immunePlayers = winner.members.slice();
  ep.tribalPlayers = loser.members.filter(m => gs.activePlayers.includes(m));
  ep.challengeLabel = "Hell's Kitchen";
  ep.challengeCategory = 'mental';

  // ── Challenge member scores ──
  ep.chalMemberScores = personalScores;
  updateChalRecord(ep);
}

export function _textHellsKitchen(ep, ln, sec) {
  if (!ep.isHellsKitchen || !ep.hellsKitchen) return;
  const hk = ep.hellsKitchen;
  sec("HELL'S KITCHEN");
  ln('Three-course cooking challenge. Host judges each course 1-10.');
  Object.entries(hk.chefs || {}).forEach(([tribe, chef]) => {
    ln(`${tribe} head chef: ${chef.name} (${chef.style})`);
  });
  ['appetizer', 'main', 'dessert'].forEach(course => {
    ln('');
    ln(`── ${course.toUpperCase()} ──`);
    Object.entries(hk.assignments || {}).forEach(([tribe, assignments]) => {
      const pair = assignments[course];
      const dish = hk.dishes?.[tribe]?.[course] || '?';
      const score = hk.courseScores?.[tribe]?.[course];
      ln(`  ${tribe}: ${pair?.join(' & ') || '?'} — ${dish} → ${score?.rating || '?'}/10`);
    });
  });
  (hk.events || []).forEach(evt => {
    ln(`  [${evt.badge || evt.badgeText || evt.type}] ${evt.text}`);
  });
  if (hk.fridgeLock) ln(`FRIDGE LOCK: ${hk.fridgeLock.victim} locked in by ${(hk.fridgeLock.rebels||[]).join(', ')}`);
  ln(`Winner: ${hk.winner}. ${hk.loser} goes to tribal.`);
  if (hk.mvp) ln(`MVP: ${hk.mvp}`);
}

export function rpBuildHellsKitchen(ep) {
  const hk = ep.hellsKitchen;
  if (!hk) return null;

  const stateKey = 'hk_reveal_' + ep.num;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const _hkReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  // Build steps array from pre-shuffled timeline
  const steps = [];
  (hk.timeline || []).forEach(item => {
    steps.push({ stepType: item.kind || (item.rating !== undefined ? 'course-result' : 'event'), data: item });
  });
  // Final scoreboard step
  steps.push({ stepType: 'final', data: {} });

  const totalSteps = steps.length;
  const allRevealed = state.idx >= totalSteps - 1;

  // Tribe helpers
  const tribeNames = Object.keys(hk.chefs);

  // Chef style flavor text
  const styleDesc = (style) => {
    if (style === 'tyrant') return 'takes charge with an iron fist';
    if (style === 'motivator') return 'leads by example';
    if (style === 'delegator') return 'assigns the perfect roles';
    if (style === 'hype') return 'brings the hype';
    if (style === 'chaos') return 'thrives in chaos';
    if (style === 'improviser') return 'improvises everything';
    return 'runs a solid kitchen';
  };

  // Event border color
  const eventBorderColor = (evt) => {
    const t = evt.type || '';
    if (['food-fight-flirt', 'showmance-fire-reaction', 'cooking-spark'].includes(t)) return '#f472b6'; // pink
    if (['sabotage', 'spice-bomb', 'cross-tribe-sabotage', 'food-gobbler-hide'].includes(t)) return '#a855f7'; // purple
    if (['food-fight', 'food-fight-drama', 'taste-war', 'fridge-lock', 'chef-meltdown', 'chef-ego-fail'].includes(t)) return '#f97316'; // orange
    if (['ingredient-drop-save', 'team-rally', 'teamwork-montage', 'motivational-chef', 'chef-delegation', 'chef-ego-success', 'knife-slip-hero', 'improv-save', 'clean-station-save', 'oven-malfunction-share'].includes(t)) return '#3fb950'; // green
    if (['kitchen-fire', 'flambe-explosion', 'spill-disaster', 'raw-food-scare', 'wrong-recipe', 'knife-slip-out', 'allergic-reaction', 'ingredient-drop', 'oven-malfunction', 'food-gobbler-confess'].includes(t)) return '#f85149'; // red
    // Default by badge class
    if (evt.badgeClass === 'badge-success') return '#3fb950';
    if (evt.badgeClass === 'badge-danger') return '#f85149';
    if (evt.badgeClass === 'badge-warning') return '#f97316';
    if (evt.badgeClass === 'badge-pink') return '#f472b6';
    if (evt.badgeClass === 'badge-info') return '#58a6ff';
    return '#8b949e';
  };

  // Score color
  const scoreColor = (rating) => {
    if (rating >= 7) return '#3fb950';
    if (rating >= 4) return '#f0a500';
    return '#f85149';
  };

  // ── PAGE HEADER ──
  let html = `<div class="rp-page" style="background:linear-gradient(180deg,#1a0a00 0%,#0d1117 40%,#0d1117 100%);padding-bottom:60px">
    <div class="rp-eyebrow" style="color:#f97316">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:3px;text-align:center;color:#f97316;animation:flamePulse 2s ease-in-out infinite;margin-bottom:4px">
      HELL'S KITCHEN
    </div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:16px">
      ${tribeNames.map(tn => `<span style="color:${tribeColor(tn)}">${tn}</span>`).join(' vs ')}
    </div>`;

  // ── CHEF SELECTION CARDS ──
  html += `<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">`;
  tribeNames.forEach(tn => {
    const tc = tribeColor(tn);
    const chef = hk.chefs[tn];
    html += `<div style="flex:1;min-width:160px;padding:12px;border-radius:8px;border:1px solid ${tc}44;background:${tc}0a;text-align:center">
      <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:${tc};margin-bottom:8px;text-transform:uppercase">${tn}</div>
      ${rpPortrait(chef.name)}
      <div style="font-size:18px;margin:4px 0">👨‍🍳</div>
      <div style="font-size:11px;font-weight:700;color:#e6edf3;margin-bottom:2px">Head Chef</div>
      <div style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;letter-spacing:0.5px;background:${tc}22;color:${tc};text-transform:uppercase;margin-bottom:4px">${chef.style}</div>
      <div style="font-size:10px;color:#8b949e;font-style:italic">${styleDesc(chef.style)}</div>
      <div style="font-size:9px;color:#8b949e;margin-top:4px">Leadership: ${chef.score.toFixed(2)}</div>
    </div>`;
  });
  html += `</div>`;

  // ── COURSE ASSIGNMENTS ──
  html += `<div style="margin-bottom:16px">
    <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#8b949e;text-align:center;margin-bottom:8px;text-transform:uppercase">Course Assignments</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">`;
  tribeNames.forEach(tn => {
    const tc = tribeColor(tn);
    const a = hk.assignments[tn];
    html += `<div style="flex:1;min-width:140px;padding:8px;border-radius:6px;border:1px solid ${tc}22;background:${tc}06">
      <div style="font-size:9px;font-weight:700;color:${tc};margin-bottom:6px;text-transform:uppercase">${tn}</div>`;
    ['appetizer', 'main', 'dessert'].forEach(c => {
      const pair = a[c] || [];
      const dish = hk.dishes[tn]?.[c] || '?';
      html += `<div style="margin-bottom:4px">
        <span style="font-size:9px;font-weight:600;color:#e6edf3;text-transform:uppercase">${c === 'main' ? 'Main Course' : c.charAt(0).toUpperCase() + c.slice(1)}</span>
        <div style="font-size:10px;color:#c9d1d9">${pair.join(' & ')}</div>
        <div style="font-size:9px;color:#f97316;font-style:italic">${dish}</div>
      </div>`;
    });
    if (a.floater) {
      html += `<div style="font-size:9px;color:#8b949e;margin-top:2px">Floater: <span style="color:#c9d1d9">${a.floater}</span></div>`;
    }
    html += `</div>`;
  });
  html += `</div></div>`;

  // ── TIMELINE (click-to-reveal) ──
  html += `<div style="margin-bottom:16px">
    <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#8b949e;text-align:center;margin-bottom:8px;text-transform:uppercase">Kitchen Timeline</div>`;

  let _lastShownTribe = null;
  let _lastShownCourse = null;
  const _courseLabels = { pre: '🔪 PRE-COOKING', appetizer: '🥗 APPETIZER', main: '🍖 MAIN COURSE', dessert: '🍰 DESSERT' };
  steps.forEach((step, i) => {
    const isVisible = i <= state.idx;

    // Course phase header when course changes (show even for hidden steps)
    const stepCourse = step.data?.course || (step.stepType === 'course-result' ? step.data?.course : null);
    if (stepCourse && stepCourse !== _lastShownCourse && _courseLabels[stepCourse]) {
      _lastShownCourse = stepCourse;
      _lastShownTribe = null; // reset tribe tracking for new course
      html += `<div style="text-align:center;padding:12px 0 6px;margin:16px 0 8px;border-top:1px solid rgba(249,115,22,0.15)">
        <span style="font-family:var(--font-display);font-size:16px;letter-spacing:2px;color:#f97316;animation:flamePulse 2s infinite">${_courseLabels[stepCourse]}</span>
      </div>`;
    }

    if (!isVisible) {
      html += `<div style="padding:10px;margin-bottom:4px;border:1px solid var(--border);border-radius:6px;opacity:0.08;text-align:center;cursor:pointer"
        onclick="${_hkReveal(i)}">
        <span style="font-size:11px;color:var(--muted)">▶</span>
      </div>`;
      return;
    }

    // Tribe header when tribe group changes
    const stepTribe = step.data?._tribe || (step.stepType === 'course-result' ? step.data?.tribe : null);
    if (stepTribe && stepTribe !== _lastShownTribe && stepTribe !== 'cross') {
      const tc = tribeColor(stepTribe);
      html += `<div style="font-size:10px;font-weight:700;letter-spacing:1px;color:${tc};margin:10px 0 4px;padding-left:4px;border-left:3px solid ${tc};text-transform:uppercase">${stepTribe}'s Kitchen</div>`;
      _lastShownTribe = stepTribe;
    } else if (stepTribe === 'cross' && _lastShownTribe !== 'cross') {
      html += `<div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#f97316;margin:10px 0 4px;text-align:center">⚔️ CROSS-TRIBE</div>`;
      _lastShownTribe = 'cross';
    }

    if (step.stepType === 'event') {
      // Event card
      const evt = step.data;
      const border = eventBorderColor(evt);
      const evtPlayers = evt.players || [];
      html += `<div style="padding:10px;border-radius:8px;border-left:3px solid ${border};background:rgba(255,255,255,0.03);margin-bottom:8px">`;
      if (evtPlayers.length) {
        html += `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">`;
        evtPlayers.forEach(p => { html += rpPortrait(p, 'pb-sm'); });
        html += `</div>`;
      }
      if (evt.badge || evt.badgeText) {
        html += `<div style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:9px;font-weight:700;background:${border}22;color:${border};margin-bottom:4px">${evt.badge || evt.badgeText}</div>`;
      }
      html += `<div style="font-size:11px;color:#c9d1d9;line-height:1.5">${evt.text || ''}</div>`;
      html += `</div>`;

    } else if (step.stepType === 'course-result') {
      // Course result card
      const cr = step.data;
      const tc = cr.tribeColor || tribeColor(cr.tribe);
      const rating = cr.rating || 0;
      const sc = scoreColor(rating);
      const courseName = (cr.course || '').toUpperCase();
      html += `<div style="padding:12px;border-radius:8px;border:1px solid ${tc}44;background:${tc}08;margin-bottom:10px">`;
      // Course header
      html += `<div style="font-size:12px;font-weight:700;letter-spacing:2px;color:#f97316;text-transform:uppercase;margin-bottom:4px">${courseName}</div>`;
      html += `<div style="font-size:10px;font-weight:700;color:${tc};margin-bottom:6px">${cr.tribe}</div>`;
      // Cook portraits
      if (cr.cooks?.length) {
        html += `<div style="display:flex;gap:6px;margin-bottom:8px">`;
        cr.cooks.forEach(c => { html += rpPortrait(c, 'pb-sm'); });
        html += `</div>`;
      }
      // Dish name + desc with plateSlide animation
      html += `<div style="animation:plateSlide 0.5s ease-out both">
        <div style="font-size:14px;font-weight:700;color:#e6edf3;font-style:italic">${cr.dish || '?'}</div>
        <div style="font-size:10px;color:#8b949e;margin-bottom:8px">${cr.dishDesc || ''}</div>
      </div>`;
      // Steam effect
      html += `<div style="text-align:center;font-size:16px;animation:steamRise 2s ease-out infinite;pointer-events:none">♨️</div>`;
      // Score with scoreReveal animation
      html += `<div style="text-align:center;margin:6px 0">
        <span style="font-size:32px;font-weight:700;color:${sc};animation:scoreReveal 0.5s ease-out both">${rating}</span>
        <span style="font-size:12px;color:#8b949e">/10</span>
      </div>`;
      // Host reaction
      if (cr.hostReaction) {
        html += `<div style="font-size:11px;color:#8b949e;font-style:italic;line-height:1.5">${cr.hostReaction}</div>`;
      }
      html += `</div>`;

    } else if (step.stepType === 'final') {
      // ── FINAL SCOREBOARD ──
      html += `<div style="padding:14px;border-radius:8px;border:1px solid #f9731644;background:rgba(249,115,22,0.05);margin-bottom:12px">
        <div style="font-size:12px;font-weight:700;letter-spacing:2px;color:#f97316;text-align:center;margin-bottom:10px;text-transform:uppercase">Final Scoreboard</div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">`;
      tribeNames.forEach(tn => {
        const tc = tribeColor(tn);
        const cs = hk.courseScores[tn] || {};
        let total = 0;
        html += `<div style="flex:1;min-width:130px;text-align:center;padding:10px;border-radius:6px;border:1px solid ${tc}33;background:${tc}08">
          <div style="font-size:11px;font-weight:700;color:${tc};margin-bottom:8px;text-transform:uppercase">${tn}</div>`;
        ['appetizer', 'main', 'dessert'].forEach(c => {
          const r = cs[c]?.rating || 0;
          total += r;
          html += `<div style="margin-bottom:4px">
            <span style="font-size:9px;color:#8b949e;text-transform:uppercase">${c}</span>
            <div style="font-size:18px;font-weight:700;color:${scoreColor(r)}">${r}</div>
          </div>`;
        });
        html += `<div style="border-top:1px solid ${tc}33;margin-top:6px;padding-top:6px">
            <div style="font-size:10px;color:#8b949e;text-transform:uppercase">Total</div>
            <div style="font-size:28px;font-weight:700;color:${tc}">${total}</div>
          </div>`;
        if (tn === hk.winner) {
          html += `<div style="margin-top:6px;padding:3px 8px;border-radius:4px;background:#3fb95022;color:#3fb950;font-size:10px;font-weight:700;display:inline-block">🏆 WINNER</div>`;
        } else if (tn === hk.loser) {
          html += `<div style="margin-top:6px;padding:3px 8px;border-radius:4px;background:#f8514922;color:#f85149;font-size:10px;font-weight:700;display:inline-block">TRIBAL COUNCIL</div>`;
        }
        html += `</div>`;
      });
      html += `</div></div>`;

      // ── MVP CARD ──
      if (hk.mvp) {
        html += `<div style="padding:12px;border-radius:8px;border:2px solid #f0a500;background:rgba(240,165,0,0.06);text-align:center;margin-bottom:12px">
          <div style="font-size:18px;margin-bottom:4px">👨‍🍳</div>
          <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#f0a500;text-transform:uppercase;margin-bottom:6px">Kitchen MVP</div>
          ${rpPortrait(hk.mvp)}
        </div>`;
      }
    }
  });

  html += `</div>`; // close timeline

  // ── REVEAL BUTTONS ──
  if (!allRevealed) {
    html += `<div style="position:sticky;bottom:12px;display:flex;gap:8px;justify-content:center;margin-top:12px">
      <button class="rp-btn" onclick="${_hkReveal(state.idx + 1)}">NEXT</button>
      <button class="rp-btn" onclick="${_hkReveal(totalSteps - 1)}" style="opacity:0.7">REVEAL ALL</button>
    </div>`;
  }

  html += `</div>`; // close rp-page
  return html;
}

