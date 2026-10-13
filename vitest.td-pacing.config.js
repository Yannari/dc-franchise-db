import { defineConfig } from 'vitest/config';
import { pacingTracePlugin } from './tools/td-pacing/trace-plugin.js';
export default defineConfig(({mode})=>({
 plugins:[pacingTracePlugin(mode!=='baseline-plain')],
 test:{include:['tools/td-pacing/baseline.test.js'],environment:'jsdom',testTimeout:600000,hookTimeout:600000,maxWorkers:1,execArgv:['--expose-gc']},
}));
