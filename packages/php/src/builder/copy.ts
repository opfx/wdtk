import * as fs from 'fs';
import * as path from 'path';

import { globAsync } from './../util';

export interface SourcePattern {
  glob: string;
  ignore?: string;
  input: string;
  output: string;
  flatten?: boolean;
  followSymLinks?: boolean;
}

const defaultIgnore = ['.gitkeep', '**/.DS_Store', '**/Thumbs.db'];

export async function copy(entries: SourcePattern[], sourceRoot: string, outputPath: string, changed?: Set<string>) {
  for (const entry of entries) {
    const cwd = path.resolve(sourceRoot, entry.input);
    const files = await globAsync(entry.glob, {
      cwd,
      dot: true,
      nodir: true,
      ignore: entry.ignore ? defaultIgnore.concat(entry.ignore) : defaultIgnore,
    });

    const directoryExists = new Set<string>();

    for (const file of files) {
      const src = path.join(cwd, file);
      if (changed && !changed.has(src)) {
        continue;
      }

      const filePath = entry.flatten ? path.basename(file) : file;

      const dest = path.join(outputPath, entry.output, filePath);

      const dir = path.dirname(dest);
      if (!directoryExists.has(dir)) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        directoryExists.add(dir);
      }
      fs.copyFileSync(src, dest, fs.constants.COPYFILE_FICLONE);
    }
  }
}
