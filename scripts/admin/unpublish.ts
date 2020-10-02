/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { spawnSync } from 'child_process';
import { logging, tags } from '@angular-devkit/core';

import { packages } from './../../lib/packages';

import build from './build';

export interface PublishArgs {
  tag?: string;
  tagCheck?: boolean;
  registry?: string;
}
export default async function (args: PublishArgs, log: logging.Logger) {
  log.info('Unpublishing...');

  let unpublishVersion = args['_'][0];

  return Object.keys(packages)
    .reduce((acc: Promise<void>, name: string) => {
      const pkg = packages[name];
      if (pkg.packageJson['private']) {
        log.debug(`ignoring ${name} (private)`);
        return acc;
      }
      return acc
        .then(() => {
          let fullyQualifiedPackageName = `${name}`;
          if (unpublishVersion) {
            fullyQualifiedPackageName = `${fullyQualifiedPackageName}@${unpublishVersion}`;
          }
          log.info(`unpublishing package ${fullyQualifiedPackageName}`);

          const publishArgs = ['unpublish', `${fullyQualifiedPackageName}`, '--force'];

          return exec('npm', publishArgs, { cwd: pkg.dist }, log);
        })
        .then((stdout: string) => {
          log.info(stdout);
        })
        .catch((err) => {
          // do nothing
        });
    }, Promise.resolve())
    .then(
      () => {
        log.info('done');
      },
      (err: Error) => log.fatal(err.message)
    );
}

function exec(command: string, args: string[], opts: { cwd?: string }, log: logging.Logger) {
  log.info(`executing ${command} ${args.map((arg) => JSON.stringify(arg)).join(', ')}`);
  const { status, error, stderr, stdout } = spawnSync(command, args, { ...opts, shell: true });

  if (status !== 0) {
    log.error(`Command failed: ${command} ${args.map((arg) => JSON.stringify(arg)).join(', ')}`);

    const message = error ? error.message : `STDERR:\n${stderr}`;
    log.error(`Error: ${message}`);
    throw new Error(message);
  } else {
    return stdout.toString();
  }
}
