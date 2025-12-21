/**
 * Basic Web Application Example
 *
 * This example demonstrates a simple web application setup with:
 * - An Nginx web server
 * - A Node.js API backend
 * - A PostgreSQL database
 */

import { stack } from '../lib/index.ts';

const [compose] = stack((s) => {
  s.name('basic-web-app');

  // Define a shared network
  const [appNetwork] = s.network((n) => {
    n.name('app-network');
    n.driver('bridge');
  });

  // Define a volume for database persistence
  s.volume((v) => {
    v.name('postgres-data');
  });

  // PostgreSQL Database
  const [db] = s.service((svc) => {
    svc.name('database');
    svc.image('postgres:16-alpine');
    svc.restart('unless-stopped');

    svc.environment((env) => {
      env.add('POSTGRES_USER', 'app');
      env.add('POSTGRES_PASSWORD', 'secret');
      env.add('POSTGRES_DB', 'appdb');
    });

    svc.volumes((v) => {
      v.quick('postgres-data', '/var/lib/postgresql/data');
    });

    svc.networks((n) => {
      n.add(appNetwork);
    });

    svc.healthcheck({
      test: ['CMD-SHELL', 'pg_isready -U app -d appdb'],
      interval: '10s',
      timeout: '5s',
      retries: 5,
    });
  });

  // Node.js API Backend
  const [api] = s.service((svc) => {
    svc.name('api');
    svc.build('./api');
    svc.restart('unless-stopped');

    svc.environment((env) => {
      env.add('NODE_ENV', 'production');
      env.add('DATABASE_URL', 'postgresql://app:secret@database:5432/appdb');
      env.add('PORT', '3000');
    });

    svc.ports((p) => {
      p.quick(3000, 3000);
    });

    svc.networks((n) => {
      n.add(appNetwork);
    });

    svc.depends((d) => {
      d.on(db, 'service_healthy');
    });

    svc.healthcheck({
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
      interval: '30s',
      timeout: '10s',
      retries: 3,
    });
  });

  // Nginx Web Server (reverse proxy)
  s.service((svc) => {
    svc.name('web');
    svc.image('nginx:alpine');
    svc.restart('unless-stopped');

    svc.ports((p) => {
      p.quick(80, 80);
      p.quick(443, 443);
    });

    svc.volumes((v) => {
      v.quick('./nginx/nginx.conf', '/etc/nginx/nginx.conf', 'ro');
      v.quick('./nginx/ssl', '/etc/nginx/ssl', 'ro');
    });

    svc.networks((n) => {
      n.add(appNetwork);
    });

    svc.depends((d) => {
      d.on(api, 'service_healthy');
    });
  });
});

// Output the compose file
console.log(compose.toYAML());
