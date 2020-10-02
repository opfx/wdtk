import { SpawnOptions } from 'child_process';
import { spawn } from 'child_process';

import { existsSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'fs';
import * as ora from 'ora';
import { tmpdir } from 'os';
import * as Path from 'path';
import * as rimraf from 'rimraf';

import { Logger } from '@wdtk/core/util';

import { getPackageManagerArguments } from './manager';
import { PackageManager } from './../config/schema';
import { NgAddSaveDependency } from './types';

export interface InstallOptions {
  registry?: string;
  save?: Exclude<NgAddSaveDependency, false>;
  extraArgs?: string[];
  cwd?: string;
}

export async function installPackage(packageName: string, packageManager: PackageManager, opts: InstallOptions): Promise<void> {
  const packageManagerOpts = getPackageManagerArguments(packageManager);
  const installArgs: string[] = [packageManagerOpts.install, packageName];

  if (opts.save === 'devDependencies') {
    installArgs.push(packageManagerOpts.saveDev);
  }

  const spawnOpts: SpawnOptions = {
    stdio: 'pipe',
    // stdio: 'inherit',
    shell: true,
    cwd: opts.cwd || process.cwd(),
  };
  return new Promise((resolve, reject) => {
    const spinner = ora({ text: `Installing '${packageName}' using '${packageManager}'...`, discardStdin: process.platform !== 'win32' });
    spinner.start();
    const installProcess = spawn(packageManager, installArgs, spawnOpts);
    installProcess.on('close', (code) => {
      if (code === 0) {
        spinner.succeed(`Successfully installed '${packageName}'.`);
        spinner.stop();
        resolve();
      } else {
        spinner.fail(`Failed to install '${packageName}'.`);
        reject(new Error('Unknown error'));
      }
    });
  });
}

export async function installTempPackage(packageName: string, packageManager: PackageManager, opts: InstallOptions): Promise<string | null> {
  const tempPath = mkdtempSync(Path.join(realpathSync(tmpdir()), 'wdtk-temp-packages-'));
  process.on('exit', () => {
    try {
      //   rimraf.sync(tempPath);
    } catch {}
  });

  // NPM will warn when a `package.json` is not found in the install directory
  // Example:
  // npm WARN enoent ENOENT: no such file or directory, open '/tmp/.ng-temp-packages-84Qi7y/package.json'
  // npm WARN .ng-temp-packages-84Qi7y No description
  // npm WARN .ng-temp-packages-84Qi7y No repository field.
  // npm WARN .ng-temp-packages-84Qi7y No license field.

  // While we can use `npm init -y` we will end up needing to update the 'package.json' anyways
  // because of missing fields.
  writeFileSync(
    Path.join(tempPath, 'package.json'),
    JSON.stringify({
      name: 'wdtk-temp-install',
      description: 'wdtk-temp-install',
      repository: 'wdtk-temp-install',
      license: 'MIT',
    })
  );

  // setup prefix/global modules path
  const packageManagerOpts = getPackageManagerArguments(packageManager);
  const tempNodeModules = Path.join(tempPath, 'node_modules');
  return new Promise((resolve) => {
    installPackage(packageName, packageManager, { save: 'dependencies', cwd: tempPath })
      .then(() => {
        resolve(tempNodeModules);
      })
      .catch(() => {
        resolve(null);
      });
  });
}
