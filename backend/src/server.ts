import { env } from './config/env.js';
import { app } from './app.js';
import { startScheduler } from './sync/syncScheduler.js';

app.listen(env.PORT, env.HOST, () => {
  console.info(JSON.stringify({ event: 'server_started', address: `http://${env.HOST}:${env.PORT}`, safeSandboxMode: env.authorizedTargetHosts.size === 0 }));
  startScheduler();
});

