/**
 * Basic Web Application Example
 *
 * This example demonstrates a simple web application setup with:
 * - An Nginx web server
 * - A Node.js API backend
 * - A PostgreSQL database
 */

import { stack } from "../lib/index.ts";

const [compose] = stack((s) => {
  s.name("basic-web-app");

  // Define a shared network
  const [appNetwork] = s.network((n) => {
    n.name("app-network");
    n.driver("bridge");
  });

  // Define a volume for database persistence
  s.volume((v) => {
    v.name("postgres-data");
  });

  // PostgreSQL Database
  const [db] = s.service((svc) => {
    svc.name("database");
    svc.image("postgres:16-alpine");
    svc.restart("unless-stopped");

    svc.environment("POSTGRES_USER", "app");
    svc.environment("POSTGRES_PASSWORD", "secret");
    svc.environment("POSTGRES_DB", "appdb");

    svc.volumes("postgres-data", "/var/lib/postgresql/data");

    svc.networks((n) => {
      n.add(appNetwork);
    });

    svc.healthcheck({
      test: ["CMD-SHELL", "pg_isready -U app -d appdb"],
      interval: "10s",
      timeout: "5s",
      retries: 5,
    });
  });

  // Node.js API Backend
  const [api] = s.service((svc) => {
    svc.name("api");
    svc.build((b) => {
      b.context("./api");
    });
    svc.restart("unless-stopped");

    svc.environment("NODE_ENV", "production");
    svc.environment(
      "DATABASE_URL",
      "postgresql://app:secret@database:5432/appdb"
    );
    svc.environment("PORT", "3000");

    svc.ports({ target: 3000, published: 3000 });

    svc.networks((n) => {
      n.add(appNetwork);
    });

    svc.depends(db, "service_healthy");

    svc.healthcheck({
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"],
      interval: "30s",
      timeout: "10s",
      retries: 3,
    });
  });

  // Nginx Web Server (reverse proxy)
  s.service((svc) => {
    svc.name("web");
    svc.image("nginx:alpine");
    svc.restart("unless-stopped");

    svc.ports({ target: 80, published: 80 });
    svc.ports({ target: 443, published: 443 });

    svc.volumes("./nginx/nginx.conf", "/etc/nginx/nginx.conf", "ro");
    svc.volumes("./nginx/ssl", "/etc/nginx/ssl", "ro");

    svc.networks((n) => {
      n.add(appNetwork);
    });

    svc.depends(api, "service_healthy");
    svc.volumes({ type: "bind", source: "./api", target: "/app" });
  });
});

// Output the compose file
console.log(compose.toYAML());
