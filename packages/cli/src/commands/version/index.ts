import * as child_process from 'child_process';
import * as path from 'path';
import { Command } from '@wdtk/core';
import { findUp } from '@wdtk/core/util';
import { tags } from '@wdtk/core/util';
import { Schema as VersionCommandSchema } from './schema';

export class VersionCommand extends Command<VersionCommandSchema> {
  async run() {
    const cliPackagePath = findUp('package.json', __dirname);
    const pkg = require(cliPackagePath);
    let cliVersion = pkg.version;
    if (!__dirname.match(/node_modules/)) {
      let gitBranch = '??';
      try {
        const gitRefName = child_process.execSync('git rev-parse --abbrev-ref HEAD', {
          cwd: __dirname,
          encoding: 'utf8',
          stdio: 'pipe',
        });
        gitBranch = gitRefName.replace('\n', '');
      } catch {}

      cliVersion = `local (v${pkg.version}, branch: ${gitBranch})`;
    }
    this.log.info(tags.stripIndents`
      Wdtk CLI : ${cliVersion}
      Node: ${process.versions.node}
      OS: ${process.platform} ${process.arch}
      `);
    return 0;
  }
}
