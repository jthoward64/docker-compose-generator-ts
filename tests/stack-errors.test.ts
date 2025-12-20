import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'fs/promises';
import os from 'os';
import path from 'path';

import { stack } from '../lib/stack.js';

const withTmpFile = async (fn: (filePath: string) => Promise<void>) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'compose-stack-'));
  const file = path.join(dir, 'compose.yaml');
  try {
    await fn(file);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

describe('StackBuilder error conditions', () => {
  it('throws on duplicate volumes, secrets, configs, and services', () => {
    expect(() =>
      stack((s) => {
        s.volumes((v) => {
          v.add({ name: 'data' });
          v.add({ name: 'data' });
        });
      }),
    ).toThrow(/already exists/);

    expect(() =>
      stack((s) => {
        s.secrets((sec) => {
          sec.add({ name: 's1', file: './a' } as any);
          sec.add({ name: 's1', file: './b' } as any);
        });
      }),
    ).toThrow(/already exists/);

    expect(() =>
      stack((s) => {
        s.configs((cfg) => {
          cfg.add({ name: 'c1', file: './a' } as any);
          cfg.add({ name: 'c1', file: './b' } as any);
        });
      }),
    ).toThrow(/already exists/);

    expect(() =>
      stack((s) => {
        const svcBuilder = (svc: any) => {
          svc.name('web');
          svc.image('alpine');
        };
        s.service(svcBuilder);
        s.service(svcBuilder);
      }),
    ).toThrow(/already exists/);
  });

  it('throws when required names are missing', () => {
    expect(() =>
      stack((s) => {
        s.networks((n) => {
          n.add({} as any);
        });
      }),
    ).toThrow(/Network name must be provided/);

    expect(() =>
      stack((s) => {
        s.volumes((v) => {
          v.add({} as any);
        });
      }),
    ).toThrow(/Volume name must be provided/);

    expect(() =>
      stack((s) => {
        s.secrets((sec) => {
          sec.add({} as any);
        });
      }),
    ).toThrow(/Secret name must be provided/);

    expect(() =>
      stack((s) => {
        s.configs((cfg) => {
          cfg.add({} as any);
        });
      }),
    ).toThrow(/Config name must be provided/);
  });
});

describe('ComposeStack.toFile', () => {
  it('writes YAML to a file in a temporary directory and cleans up', async () => {
    await withTmpFile(async (filePath) => {
      const compose = stack((s) => {
        s.name('file-stack');
        s.service((svc) => {
          svc.name('web');
          svc.image('nginx');
        });
      });

      await compose.toFile(filePath);

      const content = await readFile(filePath, 'utf8');
      expect(content).toContain('name: file-stack');
      expect(content).toContain('web:');
    });
  });
});
