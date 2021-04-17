import { BaseException, Path } from '@angular-devkit/core';
import { basename, dirname, join, normalize, relative, resolve, virtualFs } from '@angular-devkit/core';

import * as fs from 'fs';
import * as path from 'path';

import { globAsync } from './../../../util';

export interface AssetPattern {
  glob: string;
  ignore?: string;
  input: string;
  output: string;
  flatten?: boolean;
  followSymLinks?: boolean;
}

export class MissingAssetSourceRootException extends BaseException {
  constructor(path: string) {
    super(`The '${path}' asset path must start with the project's source root.`);
  }
}

const defaultIgnore = ['.gitkeep', '**/.DS_Store', '**/Thumbs.db'];

export function normalizeAssetPatterns(patterns: any, host: virtualFs.SyncDelegateHost, root: Path, projectRoot: Path, maybeSourceRoot?: Path) {
  // when source root is not available, default to ${projectRoot}/src
  const sourceRoot = maybeSourceRoot || join(projectRoot, 'src');
  const resolvedSourceRoot = resolve(root, sourceRoot);

  if (patterns.length === 0) {
    return;
  }

  return patterns.map((pattern) => {
    // normalize string asset patterns to objects
    if (typeof pattern === 'string') {
      const assetPath = normalize(pattern);
      const resolvedAssetPath = resolve(root, assetPath);

      // check of the string asset is within the sourceRoot
      if (!resolvedAssetPath.startsWith(resolvedSourceRoot)) {
        throw new MissingAssetSourceRootException(pattern);
      }

      let glob: string = '**/*';
      let input: Path = assetPath;
      let output: Path;
      let isDirectory = false;

      try {
        isDirectory = host.isDirectory(resolvedAssetPath);
      } catch {
        isDirectory = true;
      }

      if (!isDirectory) {
        glob = basename(assetPath);
        input = dirname(assetPath);
      }
      // output directory for both (file or dir) is the relative path from sourceRoot to input
      output = relative(resolvedSourceRoot, resolve(root, input));
      pattern = {
        glob,
        input,
        output,
      };
    }
    return pattern;
  });
}

export async function copyAssets(entries: AssetPattern[], basePaths: Iterable<string>, root: string, changed?: Set<string>) {
  for (const entry of entries) {
    const cwd = path.resolve(root, entry.input);
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
      for (const base of basePaths) {
        const dest = path.join(base, entry.output, filePath);

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
}
