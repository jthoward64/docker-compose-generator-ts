/**
 * Microservices Example
 *
 * This example demonstrates a microservices architecture with:
 * - API Gateway (Traefik)
 * - Multiple backend services
 * - Shared message queue (RabbitMQ)
 * - Centralized logging
 */

import { stack } from '../lib/index.ts';

const [compose] = stack((s) => {
  s.name('microservices');

  // Define networks
  const [traefikNet] = s.network((n) => {
    n.name('traefik-public');
    n.driver('bridge');
  });
  const [internalNet] = s.network((n) => {
    n.name('internal');
    n.driver('bridge');
  });

  // Define volumes
  s.volume((v) => {
    v.name('rabbitmq-data');
  });

  // Traefik API Gateway
  s.service((svc) => {
    svc.name('traefik');
    svc.image('traefik:v3.0');
    svc.restart('always');

    svc.command([
      '--api.dashboard=true',
      '--providers.docker=true',
      '--providers.docker.exposedbydefault=false',
      '--entrypoints.web.address=:80',
      '--entrypoints.websecure.address=:443',
    ]);

    svc.ports((p) => {
      p.quick(80, 80);
      p.quick(443, 443);
      p.quick(8080, 8080); // Dashboard
    });

    svc.volumes((v) => {
      v.quick('/var/run/docker.sock', '/var/run/docker.sock', 'ro');
    });

    svc.networks((n) => {
      n.add(traefikNet);
    });

    svc.labels((l) => {
      l.add('traefik.enable', 'true');
      l.add('traefik.http.routers.dashboard.rule', 'Host(`traefik.localhost`)');
      l.add('traefik.http.routers.dashboard.service', 'api@internal');
    });
  });

  // RabbitMQ Message Queue
  const [rabbitmq] = s.service((svc) => {
    svc.name('rabbitmq');
    svc.image('rabbitmq:3-management-alpine');
    svc.restart('always');

    svc.environment((env) => {
      env.add('RABBITMQ_DEFAULT_USER', 'guest');
      env.add('RABBITMQ_DEFAULT_PASS', 'guest');
    });

    svc.volumes((v) => {
      v.quick('rabbitmq-data', '/var/lib/rabbitmq');
    });

    svc.ports((p) => {
      p.quick(5672, 5672);  // AMQP
      p.quick(15672, 15672); // Management UI
    });

    svc.networks((n) => {
      n.add(internalNet);
    });

    svc.healthcheck({
      test: ['CMD', 'rabbitmq-diagnostics', '-q', 'ping'],
      interval: '30s',
      timeout: '10s',
      retries: 3,
    });
  });

  // User Service
  s.service((svc) => {
    svc.name('user-service');
    svc.build('./services/user');
    svc.restart('always');

    svc.environment((env) => {
      env.add('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq:5672');
      env.add('SERVICE_NAME', 'user-service');
    });

    svc.networks((n) => {
      n.add(traefikNet);
      n.add(internalNet);
    });

    svc.depends((d) => {
      d.on(rabbitmq, 'service_healthy');
    });

    svc.labels((l) => {
      l.add('traefik.enable', 'true');
      l.add('traefik.http.routers.users.rule', 'Host(`api.localhost`) && PathPrefix(`/users`)');
      l.add('traefik.http.services.users.loadbalancer.server.port', '3000');
    });

    svc.deploy({
      replicas: 2,
      resources: {
        limits: { cpus: '0.5', memory: '512M' },
        reservations: { cpus: '0.25', memory: '256M' },
      },
    });
  });

  // Order Service
  s.service((svc) => {
    svc.name('order-service');
    svc.build('./services/order');
    svc.restart('always');

    svc.environment((env) => {
      env.add('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq:5672');
      env.add('SERVICE_NAME', 'order-service');
    });

    svc.networks((n) => {
      n.add(traefikNet);
      n.add(internalNet);
    });

    svc.depends((d) => {
      d.on(rabbitmq, 'service_healthy');
    });

    svc.labels((l) => {
      l.add('traefik.enable', 'true');
      l.add('traefik.http.routers.orders.rule', 'Host(`api.localhost`) && PathPrefix(`/orders`)');
      l.add('traefik.http.services.orders.loadbalancer.server.port', '3000');
    });

    svc.deploy({
      replicas: 2,
      resources: {
        limits: { cpus: '0.5', memory: '512M' },
        reservations: { cpus: '0.25', memory: '256M' },
      },
    });
  });

  // Notification Service
  s.service((svc) => {
    svc.name('notification-service');
    svc.build('./services/notification');
    svc.restart('always');

    svc.environment((env) => {
      env.add('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq:5672');
      env.add('SERVICE_NAME', 'notification-service');
    });

    svc.networks((n) => {
      n.add(internalNet);
    });

    svc.depends((d) => {
      d.on(rabbitmq, 'service_healthy');
    });
  });
});

console.log(compose.toYAML());
