# Docker Compose Generator Examples

This folder contains examples demonstrating how to use the Docker Compose Generator TypeScript DSL.

## Examples

### [basic-web-app.ts](./basic-web-app.ts)
A simple three-tier web application with:
- Nginx reverse proxy
- Node.js API backend
- PostgreSQL database

### [wordpress.ts](./wordpress.ts)
A WordPress installation with:
- WordPress container
- MySQL database
- Persistent volumes

### [development-environment.ts](./development-environment.ts)
A local development setup with:
- Node.js app with hot-reload
- MongoDB database
- Redis cache
- Mailhog for email testing

### [microservices.ts](./microservices.ts)
A microservices architecture featuring:
- Traefik API gateway
- RabbitMQ message queue
- Multiple replicated services
- Service-to-service communication

### [gpu-ml-training.ts](./gpu-ml-training.ts)
A GPU-enabled machine learning setup with:
- PyTorch training with NVIDIA GPU support
- TensorBoard visualization
- MLflow experiment tracking
- MinIO artifact storage

### [secrets-and-configs.ts](./secrets-and-configs.ts)
Demonstrates Docker secrets and configs:
- File-based secrets
- Environment-based secrets
- External secrets/configs
- Inline config content

## Running Examples

```bash
# Compile TypeScript first
npx tsc

# Run an example
node dist/examples/basic-web-app.js > docker-compose.yml

# Or use ts-node/tsx directly
npx tsx examples/basic-web-app.ts > docker-compose.yml
```

## DSL Quick Reference

### Stack Level

```typescript
import { stack } from '../lib/index.ts';

const [compose] = stack((s) => {
  s.name('my-stack');
  
  // Define networks
  const [myNet] = s.network((n) => {
    n.name('my-network');
    n.driver('bridge');
  });

  s.network((n) => {
    n.name('existing-network');
    n.external();
  });
  
  // Define volumes
  s.volume((v) => {
    v.name('my-volume');
  });

  s.volume((v) => {
    v.name('existing-volume');
    v.external();
  });
  
  // Define secrets
  s.secret((sec) => {
    sec.name('secret-name');
    sec.file('./path/to/secret');
  });

  s.secret((sec) => {
    sec.name('secret-from-env');
    sec.environment('ENV_VAR');
  });

  s.secret((sec) => {
    sec.name('external-secret');
    sec.external();
  });
  
  // Define configs
  s.config((cfg) => {
    cfg.name('config-name');
    cfg.file('./path/to/config');
  });

  s.config((cfg) => {
    cfg.name('inline-config');
    cfg.content('{ "key": "value" }');
  });

  s.config((cfg) => {
    cfg.name('external-config');
    cfg.external();
  });
  
  // Define services
  const [svcHandle] = s.service((svc) => {
    svc.name('my-service');
    // ... service configuration
    svc.networks((n) => n.add(myNet));
  });
});
```

### Service Level

```typescript
const [svcHandle] = s.service((svc) => {
  // Identity
  svc.name('my-service');
  svc.image('nginx:alpine');
  svc.containerName('my-container');
  
  // Ports - object form or quick shorthand
  svc.ports((p) => {
    p.add({ target: 80, published: 8080 });
    p.quick(8080, 80);  // host:container
    p.quick(80);        // container only
  });
  
  // Environment
  svc.environment((env) => {
    env.add('KEY', 'value');
  });
  
  // Volumes - object form or quick shorthand
  svc.volumes((v) => {
    v.add({ type: 'bind', source: './data', target: '/data' });
    v.quick('./data', '/data');
    v.quick('./data', '/data', 'ro');
  });
  
  // Networks with optional configuration
  svc.networks((n) => {
    n.add(myNet);
    n.add(myNet, (cfg) => {
      cfg.alias('my-alias');
      cfg.ipv4Address('172.20.0.5');
    });
  });
  
  // Dependencies
  svc.depends((d) => {
    d.add(otherServiceHandle);
    d.on(dbServiceHandle, 'service_healthy');
  });
  
  // Health check
  svc.healthcheck({
    test: ['CMD', 'curl', '-f', 'http://localhost/health'],
    interval: '30s',
    timeout: '10s',
    retries: 3,
  });
  
  // Labels
  svc.labels((l) => {
    l.add('traefik.enable', 'true');
  });
  
  // Resource limits
  svc.memLimit('512m');
  svc.cpus(0.5);
  
  // GPU access
  svc.gpus((g) => {
    g.all();  // or g.add({ driver: 'nvidia', count: 2 });
  });
});
```

## Output

All examples output valid Docker Compose YAML that can be used directly:

```bash
# Save to file
npx tsx examples/basic-web-app.ts > docker-compose.yml

# Or pipe to docker compose
npx tsx examples/basic-web-app.ts | docker compose -f - up
```
