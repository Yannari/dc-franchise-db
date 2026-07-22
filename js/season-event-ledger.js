// Canonical, versioned event ledger for current-season.html.
// It records episode facts once, keeps AI assessments visibly separate, and
// replaces a regenerated episode atomically so analytics cannot double-count it.

export const LEDGER_SCHEMA_VERSION = 1;

const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const uniq = values => [...new Set((values || []).map(clean).filter(Boolean))];
const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));

function hashText(value) {
  let h = 2166136261;
  const text = String(value ?? '');
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function sectionize(summaryText) {
  const sections = [];
  let current = { title: 'EPISODE', lines: [] };
  String(summaryText || '').split(/\r?\n/).forEach(raw => {
    const line = raw.trim();
    const decorated = line.match(/^={2,}\s*(.*?)\s*={2,}$/);
    const plain = !decorated && line.match(/^(PRE[- ]CHALLENGE|POST[- ]CHALLENGE|CHALLENGES?|TRIBAL(?: COUNCIL)?|THE VOTES|VOTING|ALLIANCE(?:S| PLANS)?|RELATIONSHIPS?|CAMP(?: EVENTS?)?|ELIMINATED(?: \(PERMANENT\))?)\s*:?[—-]?$/i);
    if (decorated || plain) {
      if (current.lines.length || current.title !== 'EPISODE') sections.push(current);
      current = { title: clean((decorated || plain)[1]).toUpperCase(), lines: [] };
    } else if (line) current.lines.push(line);
  });
  if (current.lines.length || current.title !== 'EPISODE') sections.push(current);
  return sections;
}

function castMatcher(cast) {
  const names = uniq(cast).sort((a, b) => b.length - a.length);
  const byLower = new Map(names.map(name => [name.toLowerCase(), name]));
  return {
    canonical(value) { return byLower.get(clean(value).replace(/^[-•*\d.)\s]+/, '').toLowerCase()) || null; },
    mentioned(text) {
      const haystack = ` ${String(text || '').toLowerCase()} `;
      return names.map(name => {
        const escaped = name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').exec(haystack);
        return match ? { name, index:match.index } : null;
      }).filter(Boolean).sort((a, b) => a.index - b.index).map(hit => hit.name);
    },
  };
}

function provenance(kind, source, section, excerpt, confidence = 1) {
  return { kind, source, section: clean(section), excerpt: clean(excerpt), confidence: clamp01(confidence) };
}

function makeEvent({ season, episode, type, phase, actors, targets, groups, description, data, provenance: prov }) {
  const stable = [season, episode, type, phase, ...(actors || []), '>', ...(targets || []), description].join('|');
  return {
    id: `s${season}e${episode}-${type.replace(/[^a-z0-9]+/gi, '-')}-${hashText(stable)}`,
    season: Number(season), episode: Number(episode), type, phase: clean(phase || 'episode').toLowerCase(),
    actors: uniq(actors), targets: uniq(targets), groups: uniq(groups),
    description: clean(description), data: data && typeof data === 'object' ? data : {}, provenance: prov,
  };
}

function phaseFor(section) {
  const s = String(section || '').toLowerCase();
  if (s.includes('pre') || s.includes('camp')) return 'camp';
  if (s.includes('challenge')) return 'challenge';
  if (s.includes('tribal') || s.includes('vote') || s.includes('eliminat')) return 'tribal';
  if (s.includes('post')) return 'aftermath';
  return 'episode';
}

export function extractRecordedEvents({ season, episode, summaryText, cast = [] }) {
  const match = castMatcher(cast);
  const events = [];
  const add = payload => events.push(makeEvent({ season, episode, ...payload }));
  const sections = sectionize(summaryText);

  sections.forEach(section => {
    const phase = phaseFor(section.title);
    section.lines.forEach(line => {
      // Simulator and prose vote formats: "A → B", "A voted for B".
      const vote = line.match(/^[-•*\s]*([^:→]{1,45}?)\s*(?:→|->|=>|voted(?:\s+for)?|votes(?:\s+for)?)\s+([^—–:]{1,45}?)(?:\s*[—–].*)?$/i);
      if (vote) {
        const voter = match.canonical(vote[1]);
        const target = match.canonical(vote[2]);
        if (voter && target) {
          add({ type:'vote.cast', phase:'tribal', actors:[voter], targets:[target], description:`${voter} voted for ${target}.`, data:{ ballot:target }, provenance:provenance('recorded','summary',section.title,line,1) });
          return;
        }
      }

      // Eliminated blocks contain names; narrative elimination lines must name
      // the person and explicitly state the outcome.
      const namedOnly = match.canonical(line);
      const mentions = match.mentioned(line);
      if (/ELIMINATED|VOTED OUT|PLACEMENT/i.test(section.title) && namedOnly) {
        add({ type:'elimination', phase:'tribal', actors:[], targets:[namedOnly], description:`${namedOnly} was eliminated.`, data:{ permanent:/PERMANENT/i.test(section.title) }, provenance:provenance('recorded','summary',section.title,line,1) });
        return;
      }
      if (mentions.length === 1 && /\b(?:was voted out|is eliminated|was eliminated|became the \w+ juror)\b/i.test(line)) {
        add({ type:'elimination', phase:'tribal', actors:[], targets:mentions, description:line, data:{}, provenance:provenance('recorded','summary',section.title,line,.98) });
        return;
      }

      if (mentions.length && /\b(?:won|wins)\b/i.test(line) && /\b(?:immunity|reward|challenge)\b/i.test(line)) {
        const kind = /immunity/i.test(line) ? 'immunity' : /reward/i.test(line) ? 'reward' : 'challenge';
        add({ type:'challenge.win', phase:'challenge', actors:[mentions[0]], targets:[], description:line, data:{ kind }, provenance:provenance('recorded','summary',section.title,line,.96) });
        return;
      }

      if (mentions.length && /\b(?:idol|extra vote|shot in the dark|advantage|steal a vote|block a vote)\b/i.test(line)
        && /\b(?:finds?|found|plays?|played|gives?|gave|transfers?|transferred|wasted|expires?|lost)\b/i.test(line)) {
        const action = (line.match(/\b(finds?|found|plays?|played|gives?|gave|transfers?|transferred|wasted|expires?|lost)\b/i)?.[1] || 'used').toLowerCase();
        add({ type:'advantage.action', phase, actors:[mentions[0]], targets:mentions.slice(1), description:line, data:{ action }, provenance:provenance('recorded','summary',section.title,line,.94) });
        return;
      }

      // Narrative beats preserve useful evidence without pretending an AI-made
      // interpretation is a hard mechanical fact.
      if (mentions.length && /CAMP|RELATION|ALLIANCE|STRATEG|PLAN|FALLOUT/i.test(section.title) && line.length >= 18) {
        add({ type:'narrative.beat', phase, actors:mentions, targets:[], description:line.replace(/^[-•*]\s*/, ''), data:{}, provenance:provenance('recorded','summary',section.title,line,.9) });
      }
    });
  });
  return [...new Map(events.map(event => [event.id, event])).values()];
}

export function extractAnalyticsAssessments({ season, episode, analytics = {} }) {
  const assessments = [];
  const add = (type, actor, description, data = {}) => {
    if (!actor || !description) return;
    assessments.push(makeEvent({ season, episode, type, phase:'analysis', actors:[actor], targets:[], description, data,
      provenance:provenance('ai-inferred','analytics',type,description,.65) }));
  };
  add('assessment.best-move', analytics.bestMove?.player, analytics.bestMove?.reason);
  add('assessment.biggest-risk', analytics.biggestRisk?.player, analytics.biggestRisk?.reason);
  (analytics.votingBlocs || []).forEach(bloc => {
    if (!bloc?.name || !bloc?.target) return;
    assessments.push(makeEvent({ season, episode, type:'assessment.voting-bloc', phase:'analysis', actors:bloc.members || [], targets:[bloc.target], groups:[bloc.name],
      description:bloc.notes || `${bloc.name} was assessed as targeting ${bloc.target}.`, data:{ strength:bloc.strength },
      provenance:provenance('ai-inferred','analytics','votingBlocs',bloc.notes || bloc.name,.6) }));
  });
  return assessments;
}

function analyticsObservations(analytics = {}) {
  const copy = value => JSON.parse(JSON.stringify(value ?? null));
  return {
    bootPredictions: copy(analytics.bootPredictions || []), powerRankings: copy(analytics.powerRankings || []),
    allianceStability: copy(analytics.allianceStability || []), socialNetwork: copy(analytics.socialNetwork || []),
    juryManagement: copy(analytics.juryManagement || []), threatBreakdown: copy(analytics.threatBreakdown || []),
    pathToVictory: copy(analytics.pathToVictory || []), relationships: copy(analytics.relationships || {}),
    provenance: { kind:'ai-inferred', source:'analytics', confidence:.6 },
  };
}

export function buildEpisodeRecord({ season, episode, title = '', summaryText = '', cast = [], eliminated = [], analytics = {} }) {
  const recordedEvents = extractRecordedEvents({ season, episode, summaryText, cast });
  const assessmentEvents = extractAnalyticsAssessments({ season, episode, analytics });
  return {
    season:Number(season), episode:Number(episode), title:clean(title), summaryHash:hashText(summaryText), cast:uniq(cast), eliminated:uniq(eliminated),
    events:[...recordedEvents, ...assessmentEvents], observations:analyticsObservations(analytics),
    counts:{ recorded:recordedEvents.length, inferred:assessmentEvents.length }, ingestedAt:new Date().toISOString(),
  };
}

export function createLedger(season) {
  return { schemaVersion:LEDGER_SCHEMA_VERSION, season:Number(season), updatedAt:new Date().toISOString(), episodes:{} };
}

export function upsertEpisode(ledger, record) {
  const next = ledger && Number(ledger.season) === Number(record?.season)
    ? JSON.parse(JSON.stringify(ledger)) : createLedger(record?.season || 1);
  next.schemaVersion = LEDGER_SCHEMA_VERSION;
  const previous = next.episodes[String(record.episode)];
  if (previous?.events?.length) {
    const oldById = new Map(previous.events.map(event => [event.id, event]));
    const merged = record.events.map(event => {
      const old = oldById.get(event.id);
      if (!old) return event;
      if (old.provenance?.source === 'review') return old;
      if (old.review) event.review = old.review;
      return event;
    });
    const ids = new Set(merged.map(event => event.id));
    previous.events.filter(event => event.provenance?.source === 'review' && !ids.has(event.id)).forEach(event => merged.push(event));
    record.events = merged;
    record.counts.manual = merged.filter(event => event.provenance?.kind === 'manual').length;
  }
  next.episodes[String(record.episode)] = record;
  next.updatedAt = new Date().toISOString();
  return next;
}

export function validateLedger(ledger) {
  const errors = [], warnings = [], ids = new Set();
  if (!ledger || Number(ledger.schemaVersion) !== LEDGER_SCHEMA_VERSION) errors.push('Unsupported or missing schemaVersion.');
  Object.entries(ledger?.episodes || {}).forEach(([key, record]) => {
    if (Number(key) !== Number(record?.episode)) errors.push(`Episode key ${key} does not match its record.`);
    (record?.events || []).forEach(event => {
      if (!event.id || ids.has(event.id)) errors.push(`Duplicate or missing event id in episode ${key}.`);
      ids.add(event.id);
      if (!event.provenance?.kind || !event.provenance?.source) errors.push(`Event ${event.id || '?'} lacks provenance.`);
      if (!event.description) warnings.push(`Event ${event.id || '?'} has no description.`);
    });
  });
  return { valid:errors.length === 0, errors, warnings, eventCount:ids.size };
}

export function ledgerStats(ledger) {
  const records = Object.values(ledger?.episodes || {});
  return {
    episodes:records.length,
    events:records.reduce((sum, record) => sum + (record.events?.length || 0), 0),
    recorded:records.reduce((sum, record) => sum + (record.counts?.recorded || 0), 0),
    inferred:records.reduce((sum, record) => sum + (record.counts?.inferred || 0), 0),
  };
}

function findEvent(next, episode, eventId) {
  const record = next?.episodes?.[String(Number(episode))];
  const event = record?.events?.find(item => item.id === eventId);
  if (!record || !event) throw new Error(`Event ${eventId} was not found in Episode ${episode}.`);
  return { record, event };
}

export function setEventReview(ledger, episode, eventId, status, note = '') {
  if (!['pending', 'confirmed', 'rejected'].includes(status)) throw new Error(`Invalid review status: ${status}`);
  const next = JSON.parse(JSON.stringify(ledger));
  const { event } = findEvent(next, episode, eventId);
  event.review = { status, note:clean(note), reviewedAt:status === 'pending' ? null : new Date().toISOString() };
  next.updatedAt = new Date().toISOString();
  return next;
}

export function editEvent(ledger, episode, eventId, changes = {}) {
  const next = JSON.parse(JSON.stringify(ledger));
  const { event } = findEvent(next, episode, eventId);
  const original = JSON.parse(JSON.stringify(event));
  if (changes.type) event.type = clean(changes.type).toLowerCase();
  if (changes.phase) event.phase = clean(changes.phase).toLowerCase();
  if (changes.description) event.description = clean(changes.description);
  if (Array.isArray(changes.actors)) event.actors = uniq(changes.actors);
  if (Array.isArray(changes.targets)) event.targets = uniq(changes.targets);
  if (Array.isArray(changes.groups)) event.groups = uniq(changes.groups);
  event.provenance = {
    kind:'manual', source:'review', section:event.provenance?.section || '', excerpt:event.provenance?.excerpt || '', confidence:1,
    original:{ kind:original.provenance?.kind, source:original.provenance?.source, type:original.type, phase:original.phase,
      actors:original.actors, targets:original.targets, description:original.description },
  };
  event.review = { status:'confirmed', note:clean(changes.note), reviewedAt:new Date().toISOString() };
  // The id remains stable so UI references and review history survive a correction.
  next.updatedAt = new Date().toISOString();
  return next;
}

export function addManualEvent(ledger, episode, input = {}) {
  const next = JSON.parse(JSON.stringify(ledger));
  const record = next?.episodes?.[String(Number(episode))];
  if (!record) throw new Error(`Episode ${episode} does not exist in the ledger.`);
  const event = makeEvent({
    season:next.season, episode:Number(episode), type:clean(input.type || 'narrative.beat').toLowerCase(),
    phase:clean(input.phase || 'episode').toLowerCase(), actors:input.actors || [], targets:input.targets || [], groups:input.groups || [],
    description:clean(input.description), data:input.data || {}, provenance:provenance('manual','review','MANUAL ENTRY',input.description,1),
  });
  if (!event.description) throw new Error('A manual event needs a description.');
  // Permit similar events but never duplicate the exact stable event.
  if (record.events.some(item => item.id === event.id)) throw new Error('That exact event already exists.');
  event.review = { status:'confirmed', note:clean(input.note), reviewedAt:new Date().toISOString() };
  record.events.push(event);
  record.counts.manual = Number(record.counts.manual || 0) + 1;
  next.updatedAt = new Date().toISOString();
  return next;
}
