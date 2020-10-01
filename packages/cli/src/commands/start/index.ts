import { Arguments, ArchitectCommand, ArchitectCommandOptions } from '@wdtk/core';

import { Schema as StartCommandOptions } from './schema';

export class StartCommand extends ArchitectCommand<StartCommandOptions> {
  public readonly target = 'serve';

  public validate(options: ArchitectCommandOptions & Arguments) {
    return true;
  }

  public async run(options: ArchitectCommandOptions & Arguments): Promise<number | void> {
    return this.runArchitectTarget(options);
  }
}
