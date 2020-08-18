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
  log.info('Publishing...');
  let { tag } = args;
  if (!tag) {
    tag = 'latest';
  }

  await build({}, log.createChild('build'));

  return Object.keys(packages)
    .reduce((acc: Promise<void>, name: string) => {
      const pkg = packages[name];
      if (pkg.packageJson['private']) {
        log.debug(`ignoring ${name} (private)`);
        return acc;
      }
      return acc
        .then(() => {
          log.info(`publishing package ${name} with version => ${name}@`);

          //   const publishArgs = ['publish', '--tag', tag, '--registry', registry];
          // const publishArgs = ['publish', '--tag', tag, '--tolerate-republish'];
          const publishArgs = ['publish', '--tag', tag, '--access', 'public'];
          return exec('npm', publishArgs, { cwd: pkg.dist }, log);
        })
        .then((stdout: string) => {
          log.info(stdout);
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
  //   if (process.platform.startsWith('win')) {
  //     args.unshift('/c', command);
  //     command = 'cmd.exe';
  //   }

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
