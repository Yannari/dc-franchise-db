// Separate venue processes release simulator/test-runtime caches between batches.
import { spawn } from 'node:child_process';
const venues=['hosted-camp','survival-island','film-lot','carnival','world-tour'];
const execute=(venue,plain)=>new Promise((resolve,reject)=>{
 const args=['node_modules/vitest/vitest.mjs','run','--config','vitest.td-pacing.config.js','--reporter=dot'];
 if(plain)args.push('--mode','baseline-plain');
 const child=spawn(process.execPath,args,{stdio:'inherit',windowsHide:true,env:{...process.env,TD_PACING_VENUE:venue}});
 child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(venue+' '+(plain?'plain':'traced')+' exited '+code)));
});
for(const venue of venues){await Promise.all([execute(venue,false),execute(venue,true)]);}
await import('./analyze.mjs');
