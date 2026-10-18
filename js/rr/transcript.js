// ══════════════════════════════════════════════════════════════════════
// rr/transcript.js — a played season as plain text, to read before any words exist
// ══════════════════════════════════════════════════════════════════════
//
// The manual's §16.1: the transcript is the most productive tool on a show. Every
// scene, in the order the clock played it, with who was in it, what it decided and what
// it changed; then the mat. A moment between people at different places, a thread that
// never pays off, a team with nothing but task moments: all of it shows here first.
const hhmm = m => { const d = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(d / 60)).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}`; };
const num = v => (typeof v === 'number' ? (v > 0 ? '+' : '') + (Number.isInteger(v) ? v : v.toFixed(2)) : v);
const SKIP_DATA = new Set(['ending', 'family', 'effects', 't', 'stretch', 'team', 'other', 'cause', 'facts', 'threads', 'event', 'talk']);

// `signed` for an effect's delta (+0.5), plain for a fact (place=3)
function compact(v, name, signed = false) {
  if (v == null) return '-';
  if (Array.isArray(v)) return v.map(x => compact(x, name, signed)).join('+');
  if (typeof v === 'object') return Object.entries(v).map(([k, x]) => `${k}=${compact(x, name)}`).join(',');
  if (typeof v === 'string') return name(v);
  if (typeof v === 'number') return signed ? String(num(v)) : String(Number.isInteger(v) ? v : +v.toFixed(2));
  return String(v);
}

export function seasonText(result, { teamName = null } = {}) {
  const st = result.state;
  const tn = id => (teamName ? teamName(id) : st.teams[id]?.name) || id;
  const name = v => (st.teams[v] ? tn(v) : v);
  const byId = Object.fromEntries(st.scenes.map(s => [s.id, s]));
  const out = [];
  const winner = result.winner ? tn(result.winner) : '-';
  out.push(`THE RIDONCULOUS RACE · ${st.order.length} teams · seed ${st.seed} · winner ${winner}`);
  out.push(st.order.map(id => `  ${tn(id)}: ${st.teams[id].a} & ${st.teams[id].b} (${st.teams[id].rel}${st.teams[id].identity ? ', ' + st.teams[id].identity : ''})`).join('\n'));

  for (const leg of result.legs) {
    const clock = leg.clockStart ?? 420;
    out.push('');
    out.push(`LEG ${leg.n} · ${leg.placeName} · ${leg.kind} · $${leg.money}${leg.twist ? ' · ' + leg.twist : ''}${leg.converted ? ' · (made non-elimination)' : ''}`);
    out.push(`  route: ${(leg.route || []).join(' > ')} · starts ${hhmm(clock)}`);
    // scenes in clock order; a scene without a minute keeps the minute of the one before it
    let last = -Infinity;
    const scenes = st.scenes.filter(s => s.leg === leg.n).map(s => {
      const t = s.data?.t ?? s.t;
      if (t != null) last = t;
      return { s, at: t ?? last };
    }).sort((a, b) => a.at - b.at || a.s.id - b.s.id);
    for (const { s, at } of scenes) {
      const d = s.data || {};
      const teams = [...new Set([d.team, d.other].filter(Boolean))].map(tn).join(' / ');
      const parts = [`[${Number.isFinite(at) ? hhmm(clock + at) : '--:--'}] #${s.id} ${s.kind}${d.ending ? '/' + d.ending : ''}`,
        `— ${s.who.join(', ')}${teams ? ' (' + teams + ')' : ''}`];
      if (d.stretch) parts.push(`@${d.stretch}`);
      const facts = Object.entries(d.facts || {}).filter(([, v]) => v != null && v !== false);
      const extra = Object.entries(d).filter(([k, v]) => !SKIP_DATA.has(k) && v != null && v !== false);
      const f = [...facts, ...extra].map(([k, v]) => (k === 'about' ? `about=#${v}` : `${k}=${compact(v, name)}`));
      if (f.length) parts.push(`· ${f.join(' ')}`);
      const eff = (d.effects || []).map(e => `${e[0]} ${e.slice(1).map(x => compact(x, name, true)).join(' ')}`.trim());
      if (eff.length) parts.push(`· ${eff.join('; ')}`);
      if (d.cause != null && byId[d.cause]) parts.push(`← ${byId[d.cause].kind}`);
      if (d.threads?.length) parts.push(d.threads.map(x => `{${x}}`).join(' '));
      out.push('  ' + parts.join(' '));
    }
    // the mat
    out.push('  MAT:');
    (leg.order || []).forEach((id, i) => {
      const pen = leg.penalties?.[id] ? ` (+${leg.penalties[id]} min)` : '';
      const time = leg.times?.[id] != null ? hhmm(clock + leg.times[id]) : 'never arrived';
      out.push(`    ${i + 1}. ${tn(id)} ${time}${pen}`);
    });
    for (const id of leg.eliminated || []) out.push(`    OUT ${tn(id)} (${leg.how?.[id] || 'out'})`);
    if (leg.nonElim) out.push(`    SAVED ${tn(leg.nonElim.id)}: ${leg.nonElim.penalty}`);
    if (leg.saved) out.push(`    SAVE used by ${tn(leg.saved)}`);
  }
  if (result.final) {
    out.push('');
    out.push(`WINNER ${winner} · second ${result.final.order[1] ? tn(result.final.order[1]) : '-'} · third ${result.final.midOut ? tn(result.final.midOut) : '-'}`);
    out.push(`BLEACHERS ${result.final.bleachers.map(b => `${tn(b.id)}→${tn(b.roots)}`).join(' · ')}`);
  }
  return out.join('\n');
}
