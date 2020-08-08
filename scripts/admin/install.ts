/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';
import { logging } from '@angular-devkit/core';

export default async function (args: any, log: logging.Logger) {
  console.log('running install tasks');

  configureGitUser();
  configureGitFlow();
}

function configureGitFlow(): void {
  const branch = execSync('git rev-parse --abbrev-ref HEAD');
  if (branch.toString().trim() === 'master') {
    execSync(`git flow init -d`);
  }
}

function configureGitUser(): void {
  const homedir = os.homedir();
  const gitUserConfigFile = path.join(homedir, '.gitconfig.opfx');
  if (fs.existsSync(gitUserConfigFile)) {
    const gitUserConfigFile = path.join(homedir, '.gitconfig.opfx');
    const config = fs.readFileSync(gitUserConfigFile, 'utf8');

    let matches = config.match(/name\s*=\s*([^\s]*)/);
    const name = matches[1];
    matches = config.match(/email\s*=\s*([^\s]*)/);
    const email = matches[1];
    execSync(`git config user.name ${name}`);
    execSync(`git config user.email ${email}`);
  }
}
