import * as Inquirer from 'inquirer';
import { Arguments, SchematicCommand } from '@wdtk/core';

import { Schema as RemoveCommandOptions } from './schema';

export class RemoveCommand extends SchematicCommand<RemoveCommandOptions> {
  public readonly allowMissingWorkspace = true;
  schematicName = 'remove';

  async initialize(options: RemoveCommandOptions & Arguments) {
    const projectName = await this.askForProjectName(options.projectName);
    options.projectName = projectName;
    await super.initialize(options);
  }
  async run(options: RemoveCommandOptions & Arguments): Promise<number | void> {
    if (!this.schematicName || !this.collectionName) {
      return this.printHelp();
    }
    if (!options.projectName) {
      this.log.info('Nothing to do (no project was specified).');
      return;
    }
    const proceed = await this.askForConfirmation(options.projectName);
    if (!proceed) {
      this.log.info('Nothing to do.');
      return;
    }

    return this.runSchematic({
      collectionName: this.collectionName,
      schematicName: this.schematicName,
      schematicOptions: [options.projectName],
      debug: !!options.verbose,
      dryRun: !!options.dryRun,
      force: !!options.force,
    });
  }

  private async askForProjectName(projectName: string): Promise<string | undefined> {
    return new Promise<string>((resolve) => {
      if (projectName) {
        return resolve(projectName);
      }
      Inquirer.prompt({ message: `What project do you want to remove?`, name: 'projectName', type: 'input' }).then((answer) => {
        if (answer.projectName && answer.projectName.length > 0) {
          return resolve(answer.projectName);
        }
        return resolve(undefined);
      });
    });
  }

  private async askForConfirmation(projectName: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      Inquirer.prompt({ message: `Are you sure you want to remove project '${projectName}'?`, name: 'confirmation', type: 'confirm', default: false }).then(
        (answer) => {
          if (answer.confirmation) {
            return resolve(true);
          }
          return resolve(false);
        }
      );
    });
  }
}
