// How an aired event reads: heroic, villainous, comic, strategic, emotional.
//
// A LEAF. It imports nothing, which is the entire point — three separate
// consumers now need this taxonomy and each would otherwise grow its own copy,
// which is how this codebase ended up with three format-to-prefix maps.
//
// It lived in js/edit-layer.js, whose own comment already said "one taxonomy,
// two consumers" (the edit and the popularity engine). The third consumer is the
// social feed, which reads camp events to decide what the audience argues about
// — and edit-layer.js imports js/core.js, which touches localStorage at module
// scope, so importing it dragged the whole simulator into a library that was
// deliberately pure and runnable in plain node.
//
// Moving the rules here rather than copying them keeps it one taxonomy with
// three consumers. edit-layer.js re-exports classifyEventTone, so nothing that
// already imported it from there had to change.

const TONE_RULES = [
  // Reaction events (exposing/catching a scheme) are heroic — checked before the
  // villainous net so "exposeSchemer" doesn't credit the CATCHER with villainy.
  ['heroic',     /expos/i],
  ['villainous', /sabot|scheme|lie|liar|betray|steal|blindside|villain|frame|forge|manipul|taunt|threat|ambush|rat\b|snake|plot|mole|trap|undermine|backstab|sneak/i],
  ['heroic',     /help|comfort|bond|encourag|hero|rescue|protect|praise|carr|defend|loyal|generous|share|provider/i],
  ['emotional',  /romance|spark|showmance|kiss|date|breakup|cry|homesick|miss|heart|jealous|love/i],
  ['comic',      /prank|joke|funny|chaos|slacker|clumsy|fail|food|eat|vomit|silly|goof|blooper|panic/i],
  ['strategic',  /alliance|vote|plan|strategy|strateg|intel|whisper|pitch|deal|target|numbers|swing|idol|advantage|confessional/i],
];
function _tone(ev) {
  const hay = `${ev?.type || ''} ${ev?.eventId || ''} ${ev?.badgeText || ''} ${ev?.badgeClass || ''}`;
  for (const [tone, re] of TONE_RULES) if (re.test(hay)) return tone;
  return 'neutral';
}
// The popularity engine classifies aired events with the same rules the edit
// does — one taxonomy, two consumers.
export const classifyEventTone = _tone;
