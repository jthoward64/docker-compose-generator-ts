import { promises as fs } from 'fs';
import path from 'path';
import { stringify } from 'yaml';

import { type ComposeFile } from './types.ts';

const cloneSpec = (spec: ComposeFile): ComposeFile =>
  JSON.parse(JSON.stringify(spec));

export class ComposeStack {
  private readonly spec: ComposeFile;

  constructor(spec: ComposeFile) {
    this.spec = spec;
  }

  toObject(): ComposeFile {
    return cloneSpec(this.spec);
  }

  toYAML(): string {
    return stringify(this.toObject());
  }

  async toFile(filePath: string): Promise<void> {
    const yamlContent = this.toYAML();
    const directory = path.dirname(filePath);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(filePath, yamlContent, 'utf8');
  }
}
