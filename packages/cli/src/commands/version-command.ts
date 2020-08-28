import { Command } from '@wdtk/core';
import { Schema as VersionCommandSchema } from './version';
export class VersionCommand extends Command<VersionCommandSchema> {
  async run() {
    this.log.info(`1.0`);
    return 0;
  }
}
// export class VersionCommand {}
