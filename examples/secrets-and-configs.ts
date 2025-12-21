/**
 * Secrets and Configs Example
 *
 * This example demonstrates using Docker secrets and configs with:
 * - File-based secrets
 * - Environment-based secrets
 * - External configs
 * - Inline config content
 */

import { stack } from "../lib/index.ts";
import type { ConfigHandle, SecretHandle } from "../lib/types.ts";

const [compose] = stack((s) => {
  s.name("secrets-example");

  // Define secrets
  const [dbPassword] = s.secret((sec) => {
    sec.name("db_password");
    sec.file("./secrets/db_password.txt");
  });

  const [apiKey] = s.secret((sec) => {
    sec.name("api_key");
    sec.environment("API_KEY");
  });

  s.secret((sec) => {
    sec.name("ssl_cert");
    sec.external();
  });

  // Define configs
  const [nginxConfig] = s.config((cfg) => {
    cfg.name("nginx_config");
    cfg.file("./config/nginx.conf");
  });

  const [appConfig] = s.config((cfg) => {
    cfg.name("app_config");
    cfg.content(`
      {
        "debug": false,
        "logLevel": "info",
        "maxConnections": 100
      }
    `);
  });

  s.config((cfg) => {
    cfg.name("feature_flags");
    cfg.external();
  });

  // Define network
  const [appNetwork] = s.network((n) => {
    n.name("app-network");
  });

  // Database with secrets
  const [db] = s.service((svc) => {
    svc.name("database");
    svc.image("postgres:16");
    svc.restart("unless-stopped");

    svc.environment("POSTGRES_USER", "app");
    svc.environment("POSTGRES_DB", "appdb");
    svc.environment("POSTGRES_PASSWORD_FILE", "/run/secrets/db_password");

    svc.secret(dbPassword);

    svc.networks((n) => {
      n.add(appNetwork);
    });

    svc.healthcheck({
      test: ["CMD-SHELL", "pg_isready -U app"],
      interval: "10s",
      timeout: "5s",
      retries: 5,
    });
  });

  // Nginx with config
  s.service((svc) => {
    svc.name("nginx");
    svc.image("nginx:alpine");
    svc.restart("unless-stopped");

    svc.ports({ target: 80, published: 80 });
    svc.ports({ target: 443, published: 443 });

    svc.config(nginxConfig);

    svc.networks((n) => {
      n.add(appNetwork);
    });
  });

  // Application with secrets and configs
  s.service((svc) => {
    svc.name("app");
    svc.build("./app");
    svc.restart("unless-stopped");

    svc.environment("DB_HOST", "database");
    svc.environment("DB_PASSWORD_FILE", "/run/secrets/db_password");
    svc.environment("API_KEY_FILE", "/run/secrets/api_key");
    svc.environment("CONFIG_PATH", "/config/app.json");

    // Mount multiple secrets
    svc.secret(dbPassword);
    svc.secret(apiKey);

    // Mount config
    svc.config(appConfig);

    svc.ports({ target: 3000, published: 3000 });

    svc.networks((n) => {
      n.add(appNetwork);
    });

    svc.depends(db, "service_healthy");
  });
});

console.log(compose.toYAML());
