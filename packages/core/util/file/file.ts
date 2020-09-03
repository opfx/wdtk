/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as FileSystem from 'fs';
import * as Path from 'path';

export function copyFile(file: string, target: string) {
  const f = Path.basename(file);
  const source = FileSystem.createReadStream(file);
  const dest = FileSystem.createWriteStream(Path.resolve(target, f));
  source.pipe(dest);
  source.on('error', (e) => console.error(e));
}

export function findUp(names: string | string[], from: string) {
  if (!Array.isArray(names)) {
    names = [names];
  }
  const root = Path.parse(from).root;

  let currentDir = from;
  while (currentDir && currentDir !== root) {
    for (const name of names) {
      const p = Path.join(currentDir, name);
      if (FileSystem.existsSync(p)) {
        return p;
      }
    }

    currentDir = Path.dirname(currentDir);
  }

  return null;
}

export function isRelativePath(path: string): boolean {
  return path.startsWith('./') || path.startsWith('../');
}

/**
 * Attempts to create the directory specified by pathname.
 * This function will recursively create all the parent directories.
 *
 * @param pathname
 */
export function mkdirp(pathname: string) {
  // Create parent folder if necessary.
  if (!FileSystem.existsSync(Path.dirname(pathname))) {
    mkdirp(Path.dirname(pathname));
  }
  if (!FileSystem.existsSync(pathname)) {
    FileSystem.mkdirSync(pathname);
  }
}

export function writeToFile(filePath: string, str: string) {
  mkdirp(Path.dirname(filePath));
  FileSystem.writeFileSync(filePath, str);
}
