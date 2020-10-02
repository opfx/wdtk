import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as Path from 'path';

import { PackageManager } from './../config/schema';

export interface PackageManagerOptions {
  silent: string;
  saveDev: string;
  install: string;
  prefix: string;
  noLockFile: string;
}

export function getPackageManagerArguments(packageManager: PackageManager): PackageManagerOptions {
  switch (packageManager) {
    case PackageManager.Yarn:
      return {
        silent: '--silent',
        saveDev: '--dev',
        install: 'add',
        prefix: '--module-folder',
        noLockFile: '--no-lockfile',
      };
    case PackageManager.Pnpm:
      return {
        silent: '--silent',
        saveDev: '--save-dev',
        install: 'add',
        prefix: '--prefix',
        noLockFile: '--no-lockfile',
      };
    default: {
      return {
        silent: '--quiet',
        saveDev: '--save-dev',
        install: 'install',
        prefix: '--prefix',
        noLockFile: '--no-package-lock',
      };
    }
  }
}

export async function getPackageManager(path: string): Promise<PackageManager> {
  let packageManager = (await getConfiguredPackageManager()) as PackageManager | null;
  if (packageManager) {
    return packageManager;
  }

  packageManager = PackageManager.Npm;
  const hasYarn = supports('yarn');
  const hasYarnLock = existsSync(Path.join(path, 'yarn.lock'));
  if (hasYarn && hasYarnLock) {
    packageManager = PackageManager.Yarn;
  }
  return packageManager;
}

export async function getConfiguredPackageManager(): Promise<PackageManager | null> {
  // FIXME
  // return PackageManager.Yarn;
  return null;
}

function supports(name: string): boolean {
  try {
    execSync(`${name} --version`, { stdio: 'ignore' });
    return true;
  } catch {}
  return false;
}
