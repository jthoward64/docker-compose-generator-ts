# docker-compose-generator-ts

TypeScript DSL for composing Docker Compose stacks with full spec coverage, validation, and YAML/file output.

## Install
```bash
npm install @tajetaje/docker-compose-generator-ts
```

## Quick Start
```ts
import { stack } from '@tajetaje/docker-compose-generator-ts';

const [compose] = stack((s) => {
  s.name('example');

  const net = s.networks((n) => {
    const [handle] = n.add({ name: 'app', driver: 'bridge' });
    return handle;
  });

  s.service((svc) => {
    svc.name('api');
    svc.image('nginx:alpine');
    svc.ports(({quick}) => quick(8080, 80));
    svc.networks(({add}) => add(net));
  });
});

console.log(compose.toYAML());
```
