# docker-compose-generator-ts

TypeScript DSL for composing Docker Compose stacks with full spec coverage, validation, and YAML/file output.

## Install
```bash
npm install @jthoward64/docker-compose-generator-ts
```

## Quick Start
```ts
import { stack } from '@jthoward64/docker-compose-generator-ts';

const compose = stack((s) => {
  s.name('example');

  let net;
  s.networks((n) => {
    net = n.add({ name: 'app', driver: 'bridge' });
  
  });

  s.service((svc) => {
    svc.name('api');
    svc.image('nginx:alpine');
    svc.ports(({quick}) => quick(8080, 80));
    svc.networks(({add}) => nn.add(net));
  });
});

console.log(compose.toYAML());
```
