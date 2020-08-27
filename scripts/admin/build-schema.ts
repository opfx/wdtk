/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// tslint:disable:no-implicit-dependencies

import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import { logging } from '@angular-devkit/core';

export default async function (argv: {}, log: logging.Logger) {
  const allJsonFiles = glob.sync('packages/**/*.json', {
    ignore: ['**/node_modules/**', '**/files/**', '**/*-files/**', '**/package.json'],
  });

  const quicktype = require('../tools/quicktype');
  const targetDir = path.join(__dirname, '../../target');

  for (const jsonFile of allJsonFiles) {
    const content = fs.readFileSync(jsonFile, 'utf-8');
    let json;
    try {
      json = JSON.parse(content);
      if (typeof json.$schema !== 'string' || !json.$schema.startsWith('http://json-schema.org')) {
        // skip non-schema files
        continue;
      }
    } catch {
      // malformed or JSON5
      continue;
    }
    log.info(`Generating code for '${jsonFile}' schema`);
    const tsSchema = await quicktype.generate(jsonFile);
    const tsSchemaFile = path.resolve(targetDir, jsonFile.replace(/\.json$/, '.ts'));

    mkdirp(path.dirname(tsSchemaFile));
    fs.writeFileSync(tsSchemaFile, tsSchema);
  }
}

function mkdirp(p: string) {
  // Create parent folder if necessary.
  if (!fs.existsSync(path.dirname(p))) {
    mkdirp(path.dirname(p));
  }
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p);
  }
}
