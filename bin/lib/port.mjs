// Pick a free port starting from `preferred`, walking up to `preferred + range`.
// Returns the port that successfully bound (we then close immediately so the
// real server can claim it). On any error or full exhaustion, returns null.

import net from 'node:net';

export async function pickPort(preferred = 11520, range = 10) {
  for (let p = preferred; p <= preferred + range; p++) {
    if (await isFree(p)) return p;
  }
  return null;
}

function isFree(port) {
  return new Promise(resolve => {
    const srv = net.createServer();
    srv.unref();
    srv.once('error', () => resolve(false));
    srv.listen({ port, host: '127.0.0.1' }, () => {
      srv.close(() => resolve(true));
    });
  });
}
