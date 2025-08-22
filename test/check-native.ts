import { FilterGraph, Filter } from '../src/lib/index.js';

const graph = new FilterGraph();
graph.alloc();

const bufferFilter = Filter.getByName('buffer');
if (!bufferFilter) {
  throw new Error('buffer filter not found');
}

const ctx = graph.allocFilter(bufferFilter, 'in');
if (ctx) {
  console.log('ctx:', ctx);
  console.log('ctx.native:', (ctx as any).native);
  console.log('ctx.getNative():', ctx.getNative());
  console.log('Are they the same?', (ctx as any).native === ctx.getNative());
}

graph.free();
