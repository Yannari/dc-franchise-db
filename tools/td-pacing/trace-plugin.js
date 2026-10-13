// Audit-only instrumentation. Never imported by simulator.html or shipping JS.
export function pacingTracePlugin(enabled=true) { return {name:'td-pacing-baseline',enforce:'pre',transform(source,id){
 if(!enabled) return;
 const file=id.replaceAll('\\','/');
 const hooks={
  '/js/td/story/followups.js': "globalThis.__tdPacing?.('eligible', {ep,camp,phase,family:'follow-up',kind:'follow.'+kind,who,setupId:t.id,sourceEp:t.ep});",
  '/js/td/story/turns.js': "globalThis.__tdPacing?.('eligible', {ep,camp,phase,family:'turn',kind:(d.chal?'chm.':'')+'turn.'+kase,who,setupId:s.id,sourceEp:s.ep});",
  '/js/td/story/witness.js': "globalThis.__tdPacing?.('eligible', {ep,camp,phase:'pre',family:'witness-after',kind:'witness.after.'+ending,who,setupId:JSON.stringify([x.ep,x.camp,x.by,x.a,x.b]),sourceEp:x.ep});",
 };
 for(const [suffix,hook] of Object.entries(hooks))if(file.endsWith(suffix)){
  const anchor=suffix.endsWith('witness.js')?'    const w = write(\`witness.after.':suffix.endsWith('turns.js')?'      const w = write(\`turn.':"    const w = write('follow.'";
  if(source.split(anchor).length!==2)throw new Error('Pacing eligibility anchor drift: '+suffix);
  return {code:source.replace(anchor,hook+'\n'+anchor),map:null};
 }
 if(!file.endsWith('/js/td/story/director.js')) return;
 let code=source; const once=(from,to)=>{if(code.split(from).length!==2)throw new Error('Pacing audit anchor drift: '+from);code=code.replace(from,to);};
 once('  const seasonAired =', "  globalThis.__tdPacing?.('start', {ep, books: gs.tdStory});\n  const seasonAired =");
 // Preserve every list.push return value and argument evaluation order.
 code=code.split('\n').map((line,i)=>line.replaceAll('list.push(', '__pacingPush('+String(i+1)+', ')).join('\n');
 once('      const list = [];', "      const list = [];\n      const __pacingPush = (line, ...items) => { globalThis.__tdPacing?.('offer', {ep, camp, phase, line, items, events}); return list.push(...items); };\n      const __pacingReasons = new Map();");
 once('if (!must && editOn && clashes(f)) continue;', "if (!must && editOn && clashes(f)) { __pacingReasons.set(f, 'contradicts-vote-role'); continue; }");
 once('if (!must && usedLines.has(f.line)) continue;', "if (!must && usedLines.has(f.line)) { __pacingReasons.set(f, 'same-storyline'); continue; }");
 once('if (!must && cast.some(p => (onScreen[p] || 0) >= 2)) continue;', "if (!must && cast.some(p => (onScreen[p] || 0) >= 2)) { __pacingReasons.set(f, 'local-person-cap'); continue; }");
 once('      // The long scene is a fuller version', "      globalThis.__tdPacing?.('rank', {ep,camp,phase,events,filed,ranked,order,chosen,reasons:__pacingReasons});\n      // The long scene is a fuller version");
 once('          if (k >= 0) list[k] =', "          if (k >= 0) globalThis.__tdPacing?.('replacement',{ep,camp,phase,old:list[k].item,item});\n          if (k >= 0) list[k] =");
 once('    const out = { pre: [], post: [] };', "    const out = { pre: [], post: [] };\n    const __pacingLate = (method,phase,...items) => {globalThis.__tdPacing?.('late',{ep,camp,phase,items});return out[phase][method](...items);};");
 code=code.replaceAll('out[phase].push(',"__pacingLate('push',phase,").replaceAll('out[phase].unshift(',"__pacingLate('unshift',phase,");
 once('out[phase].splice(pos, 0, setup);',"globalThis.__tdPacing?.('late',{ep,camp,phase,items:[setup]}); out[phase].splice(pos, 0, setup);");
 once('    story[camp] = out;', "    globalThis.__tdPacing?.('camp', {ep,camp,out,members});\n    story[camp] = out;");
 once('  ep.campStory = story;', "  ep.campStory = story;\n  globalThis.__tdPacing?.('end', {ep,books:gs.tdStory});");
 return {code,map:null};
 }};}
