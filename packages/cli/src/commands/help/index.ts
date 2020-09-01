/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Command } from '@wdtk/core';
import { colors } from '@wdtk/core/util';
import { Schema as HelpCommandSchema } from './schema';

export class HelpCommand extends Command<HelpCommandSchema> {
  async run() {
    this.log.info(`Available Commands:`);

    for (const cmd of Object.values(await Command.commandMap())) {
      if (cmd.hidden) {
        continue;
      }

      const aliasInfo = cmd.aliases.length > 0 ? ` (${cmd.aliases.join(', ')})` : '';
      this.log.info(`  ${colors.cyan(cmd.name)}${aliasInfo} ${cmd.description}`);
    }
    let cliName = process.title.split(' ')[0];

    this.log.info(`\nFor more detailed help run "${cliName} [command name] --help"`);
  }
}
