/**
 * Secrets and Configs Example
 *
 * This example demonstrates using Docker secrets and configs with:
 * - File-based secrets
 * - Environment-based secrets
 * - External configs
 * - Inline config content
 */

import { stack } from '../lib/index.ts';
import type { ConfigHandle, SecretHandle } from '../lib/types.ts';

const [compose] = stack((s) => {
  s.name('secrets-example');

  // Define secrets
  const [dbPassword] = s.secret((sec) => {
    sec.name('db_password');
    sec.file('./secrets/db_password.txt');
  });

  const [apiKey] = s.secret((sec) => {
    sec.name('api_key');
    sec.environment('API_KEY');
  });

  s.secret((sec) => {
    sec.name('ssl_cert');
    sec.external();
  });

  // Define configs
  const [nginxConfig] = s.config((cfg) => {
    cfg.name('nginx_config');
    cfg.file('./config/nginx.conf');
  });

  const [appConfig] = s.config((cfg) => {
    cfg.name('app_config');
    cfg.content(`
      {
        "debug": false,
        "logLevel": "info",
        "maxConnections": 100
      }
    `);
  });

  s.config((cfg) => {
    cfg.name('feature_flags');
    cfg.external();
  });

  // Define network
  const [appNetwork] = s.network((n) => {
    n.name('app-network');
  });

  // Database with secrets
  const [db] = s.service((svc) => {
    svc.name('database');
    svc.image('postgres:16');
    svc.restart('unless-stopped');

    svc.environment((env) => {
      env.add('POSTGRES_USER', 'app');
      env.add('POSTGRES_DB', 'appdb');
      env.add('POSTGRES_PASSWORD_FILE', '/run/secrets/db_password');
    });

    // Mount the secret
    svc.secrets((sec) => {
      sec.add(dbPassword);
    });

    svc.networks((n) => {
      n.add(appNetwork);
    });

    svc.healthcheck({
      test: ['CMD-SHELL', 'pg_isready -U app'],
      interval: '10s',
      timeout: '5s',
      retries: 5,
    });
  });

  // Nginx with config
  s.service((svc) => {
    svc.name('nginx');
    svc.image('nginx:alpine');
    svc.restart('unless-stopped');

    svc.ports((p) => {
      p.quick(80, 80);
      p.quick(443, 443);
    });

    // Mount the config
    svc.configs((cfg) => {
      cfg.add(nginxConfig);
    });

    svc.networks((n) => {
      n.add(appNetwork);
    });
  });

  // Application with secrets and configs
  s.service((svc) => {
    svc.name('app');
    svc.build('./app');
    svc.restart('unless-stopped');

    svc.environment((env) => {
      env.add('DB_HOST', 'database');
      env.add('DB_PASSWORD_FILE', '/run/secrets/db_password');
      env.add('API_KEY_FILE', '/run/secrets/api_key');
      env.add('CONFIG_PATH', '/config/app.json');
    });

    // Mount multiple secrets
    svc.secrets((sec) => {
      sec.add(dbPassword);
      sec.add(apiKey);
    });

    // Mount config
    svc.configs((cfg) => {
      cfg.add(appConfig);
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
  });
});

console.log(compose.toYAML());
