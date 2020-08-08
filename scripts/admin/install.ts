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
import { logging } from '@angular-devkit/core';

export default async function (args: any, log: logging.Logger) {
  console.log('running install tasks');
  const homedir = os.homedir();
  const rootdir = path.join(__dirname, './../../', 'sample');
  fs.mkdir(rootdir, { recursive: true }, () => {});
}
