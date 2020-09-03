import * as Path from 'path';
import { SemVer } from '@wdtk/core/util';
import { findUp } from '@wdtk/core/util';
export interface CliDescriptor {
  path: string;
  version: SemVer;
  bin: { [name: string]: string };
}

export function getCliDescriptor(name: string, type: 'local' | 'global'): CliDescriptor {
  const descriptor: CliDescriptor = {
    path: null,
    version: null,
    bin: null,
  };
  let cliPath;
  try {
    if (type === 'local') {
      cliPath = require.resolve(name, { paths: [process.cwd()] });
    } else {
      cliPath = require.resolve(name);
    }
    const packageJsonPath = findUp('package.json', cliPath);

    const packageJson = require(packageJsonPath);
    const path = Path.dirname(packageJsonPath);
    const version = new SemVer(packageJson['version']);
    const bin = packageJson['bin'];
    return { path, version, bin };
  } catch {
    return null;
  }
}
