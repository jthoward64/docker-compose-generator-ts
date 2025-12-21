/**
 * Development Environment Example
 *
 * This example demonstrates a local development setup with:
 * - Hot-reload enabled Node.js app
 * - Redis for caching
 * - MongoDB for data storage
 * - Mailhog for email testing
 */

import { stack } from "../lib/index.ts";

const [compose] = stack((s) => {
  s.name("dev-environment");

  // Define networks
  const [backendNet] = s.network((n) => {
    n.name("backend");
  });
  const [frontendNet] = s.network((n) => {
    n.name("frontend");
  });

  // Define volumes
  s.volume((v) => {
    v.name("mongo-data");
  });
  s.volume((v) => {
    v.name("redis-data");
  });

  // MongoDB
  const [mongo] = s.service((svc) => {
    svc.name("mongo");
    svc.image("mongo:7");
    svc.restart("unless-stopped");

    svc.environment("MONGO_INITDB_ROOT_USERNAME", "root");
    svc.environment("MONGO_INITDB_ROOT_PASSWORD", "example");

    svc.volumes("mongo-data", "/data/db");

    svc.ports({ target: 27017, published: 27017 });

    svc.network((n) => {
      n.handle(backendNet);
    });
  });

  // Redis
  const [redis] = s.service((svc) => {
    svc.name("redis");
    svc.image("redis:7-alpine");
    svc.restart("unless-stopped");
    svc.command("redis-server --appendonly yes");

    svc.volumes("redis-data", "/data");

    svc.ports({ target: 6379, published: 6379 });

    svc.network((n) => {
      n.handle(backendNet);
    });
  });

  // Mailhog (email testing)
  s.service((svc) => {
    svc.name("mailhog");
    svc.image("mailhog/mailhog");
    svc.restart("unless-stopped");

    svc.ports({ target: 1025, published: 1025 }); // SMTP
    svc.ports({ target: 8025, published: 8025 }); // Web UI

    svc.network((n) => {
      n.handle(backendNet);
    });
  });

  // Node.js Application (development mode)
  s.service((svc) => {
    svc.name("app");
    svc.build((b) => {
      b.context(".");
      b.target("development");
    });
    svc.restart("unless-stopped");

    svc.environment("NODE_ENV", "development");
    svc.environment("MONGO_URL", "mongodb://root:example@mongo:27017");
    svc.environment("REDIS_URL", "redis://redis:6379");
    svc.environment("SMTP_HOST", "mailhog");
    svc.environment("SMTP_PORT", "1025");

    svc.ports({ target: 3000, published: 3000 }); // App
    svc.ports({ target: 9229, published: 9229 }); // Debug port

    // Mount source code for hot reload
    svc.volumes(".", "/app");
    svc.volumes({ type: "volume", target: "/app/node_modules" }); // Preserve node_modules

    svc.network((n) => {
      n.handle(backendNet);
      n.handle(frontendNet);
    });

    svc.depends(mongo);
    svc.depends(redis);

    // Enable stdin for debugging
    svc.stdinOpen(true);
    svc.tty(true);
  });
});

console.log(compose.toYAML());
