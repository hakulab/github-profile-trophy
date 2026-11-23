import { app } from './app';
import { type Env } from './env';

const worker: ExportedHandler<Env> = {
  async fetch(request, env, ctx): Promise<Response> {
    return await app(request, env, {
      cache: caches.default,
      waitUntil: (promise) => {
        ctx.waitUntil(promise);
      },
    });
  },
};

export default worker;
