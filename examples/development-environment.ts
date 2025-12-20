/**
 * Development Environment Example
 *
 * This example demonstrates a local development setup with:
 * - Hot-reload enabled Node.js app
 * - Redis for caching
 * - MongoDB for data storage
 * - Mailhog for email testing
 */

import { stack } from '../lib/index.ts';

const compose = stack((s) => {
  s.name('dev-environment');

  // Define networks
  s.networks((n) => {
    n.add({ name: 'backend' });
    n.add({ name: 'frontend' });
  });

  // Define volumes
  s.volumes((v) => {
    v.add({ name: 'mongo-data' });
    v.add({ name: 'redis-data' });
  });

  // MongoDB
  const mongo = s.service((svc) => {
    svc.name('mongo');
    svc.image('mongo:7');
    svc.restart('unless-stopped');

    svc.environment((env) => {
      env.add('MONGO_INITDB_ROOT_USERNAME', 'root');
      env.add('MONGO_INITDB_ROOT_PASSWORD', 'example');
    });

    svc.volumes((v) => {
      v.quick('mongo-data', '/data/db');
    });

    svc.ports((p) => {
      p.quick(27017, 27017);
    });

    svc.networks((n) => {
      n.add({ name: 'backend' });
    });
  });

  // Redis
  const redis = s.service((svc) => {
    svc.name('redis');
    svc.image('redis:7-alpine');
    svc.restart('unless-stopped');
    svc.command('redis-server --appendonly yes');

    svc.volumes((v) => {
      v.quick('redis-data', '/data');
    });

    svc.ports((p) => {
      p.quick(6379, 6379);
    });

    svc.networks((n) => {
      n.add({ name: 'backend' });
    });
  });

  // Mailhog (email testing)
  s.service((svc) => {
    svc.name('mailhog');
    svc.image('mailhog/mailhog');
    svc.restart('unless-stopped');

    svc.ports((p) => {
      p.quick(1025, 1025); // SMTP
      p.quick(8025, 8025); // Web UI
    });

    svc.networks((n) => {
      n.add({ name: 'backend' });
    });
  });

  // Node.js Application (development mode)
  s.service((svc) => {
    svc.name('app');
    svc.build({
      context: '.',
      target: 'development',
    });
    svc.restart('unless-stopped');

    svc.environment((env) => {
      env.add('NODE_ENV', 'development');
      env.add('MONGO_URL', 'mongodb://root:example@mongo:27017');
      env.add('REDIS_URL', 'redis://redis:6379');
      env.add('SMTP_HOST', 'mailhog');
      env.add('SMTP_PORT', '1025');
    });

    svc.ports((p) => {
      p.quick(3000, 3000); // App
      p.quick(9229, 9229); // Debug port
    });

    // Mount source code for hot reload
    svc.volumes((v) => {
      v.quick('.', '/app');
      v.add({ type: 'volume', target: '/app/node_modules' }); // Preserve node_modules
    });

    svc.networks((n) => {
      n.add({ name: 'backend' });
      n.add({ name: 'frontend' });
    });

    svc.depends((d) => {
      d.add(mongo);
      d.add(redis);
    });

    // Enable stdin for debugging
    svc.stdinOpen(true);
    svc.tty(true);
  });
});

console.log(compose.toYAML());
