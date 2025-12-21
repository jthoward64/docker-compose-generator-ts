/**
 * Microservices Example
 *
 * This example demonstrates a microservices architecture with:
 * - API Gateway (Traefik)
 * - Multiple backend services
 * - Shared message queue (RabbitMQ)
 * - Centralized logging
 */

import { stack } from "../lib/index.ts";

const [compose] = stack((s) => {
  s.name("microservices");

  // Define networks
  const [traefikNet] = s.network((n) => {
    n.name("traefik-public");
    n.driver("bridge");
  });
  const [internalNet] = s.network((n) => {
    n.name("internal");
    n.driver("bridge");
  });

  // Define volumes
  s.volume((v) => {
    v.name("rabbitmq-data");
  });

  // Traefik API Gateway
  s.service((svc) => {
    svc.name("traefik");
    svc.image("traefik:v3.0");
    svc.restart("always");

    svc.command([
      "--api.dashboard=true",
      "--providers.docker=true",
      "--providers.docker.exposedbydefault=false",
      "--entrypoints.web.address=:80",
      "--entrypoints.websecure.address=:443",
    ]);

    svc.ports({ target: 80, published: 80 });
    svc.ports({ target: 443, published: 443 });
    svc.ports({ target: 8080, published: 8080 }); // Dashboard

    svc.volumes("/var/run/docker.sock", "/var/run/docker.sock", "ro");

    svc.network((n) => {
      n.handle(traefikNet);
    });

    svc.labels("traefik.enable", "true");
    svc.labels(
      "traefik.http.routers.dashboard.rule",
      "Host(`traefik.localhost`)"
    );
    svc.labels("traefik.http.routers.dashboard.service", "api@internal");
  });

  // RabbitMQ Message Queue
  const [rabbitmq] = s.service((svc) => {
    svc.name("rabbitmq");
    svc.image("rabbitmq:3-management-alpine");
    svc.restart("always");

    svc.environment("RABBITMQ_DEFAULT_USER", "guest");
    svc.environment("RABBITMQ_DEFAULT_PASS", "guest");

    svc.volumes("rabbitmq-data", "/var/lib/rabbitmq");

    svc.ports({ target: 5672, published: 5672 }); // AMQP
    svc.ports({ target: 15672, published: 15672 }); // Management UI

    svc.network((n) => {
      n.handle(internalNet);
    });

    svc.healthcheck({
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"],
      interval: "30s",
      timeout: "10s",
      retries: 3,
    });
  });

  // User Service
  s.service((svc) => {
    svc.name("user-service");
    svc.build((b) => {
      b.context("./services/user");
    });
    svc.restart("always");

    svc.environment("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672");
    svc.environment("SERVICE_NAME", "user-service");

    svc.network((n) => {
      n.handle(traefikNet);
      n.handle(internalNet);
    });

    svc.depends(rabbitmq, "service_healthy");

    svc.labels("traefik.enable", "true");
    svc.labels(
      "traefik.http.routers.users.rule",
      "Host(`api.localhost`) && PathPrefix(`/users`)"
    );
    svc.labels("traefik.http.services.users.loadbalancer.server.port", "3000");

    svc.deploy({
      replicas: 2,
      resources: {
        limits: { cpus: "0.5", memory: "512M" },
        reservations: { cpus: "0.25", memory: "256M" },
      },
    });
  });

  // Order Service
  s.service((svc) => {
    svc.name("order-service");
    svc.build((b) => {
      b.context("./services/order");
    });
    svc.restart("always");

    svc.environment("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672");
    svc.environment("SERVICE_NAME", "order-service");

    svc.network((n) => {
      n.handle(traefikNet);
      n.handle(internalNet);
    });

    svc.depends(rabbitmq, "service_healthy");

    svc.labels("traefik.enable", "true");
    svc.labels(
      "traefik.http.routers.orders.rule",
      "Host(`api.localhost`) && PathPrefix(`/orders`)"
    );
    svc.labels("traefik.http.services.orders.loadbalancer.server.port", "3000");

    svc.deploy({
      replicas: 2,
      resources: {
        limits: { cpus: "0.5", memory: "512M" },
        reservations: { cpus: "0.25", memory: "256M" },
      },
    });
  });

  // Notification Service
  s.service((svc) => {
    svc.name("notification-service");
    svc.build((b) => {
      b.context("./services/notification");
    });
    svc.restart("always");

    svc.environment("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672");
    svc.environment("SERVICE_NAME", "notification-service");

    svc.network((n) => {
      n.handle(internalNet);
    });

    svc.depends(rabbitmq, "service_healthy");
  });
});

console.log(compose.toYAML());
