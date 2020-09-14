import * as Inquirer from 'inquirer';
import { Arguments, SchematicCommand } from '@wdtk/core';

import { Schema as GenerateCommandOptions } from './schema';

export class GenerateCommand extends SchematicCommand<GenerateCommandOptions> {
  async initialize(options: GenerateCommandOptions & Arguments) {
    let [collectionName, schematicName] = await this.parseSchematicInfo(options);
    if (!schematicName) {
      const schematic = await this.determineSchematic();
      const collection = await this.determineCollection(schematic);
      [collectionName, schematicName] = [collection, schematic];
    }
    this.collectionName = collectionName;
    this.schematicName = schematicName;

    await super.initialize(options);
  }
  async run(options: GenerateCommandOptions & Arguments): Promise<number | void> {
    if (!this.schematicName || !this.collectionName) {
      return this.printHelp();
    }

    return this.runSchematic({
      collectionName: this.collectionName,
      schematicName: this.schematicName,
      schematicOptions: options['--'] || [],
      debug: !!options.verbose,
      dryRun: !!options.dryRun,
      force: !!options.force,
    });
  }

  private async determineCollection(schematic: string): Promise<string> {
    return new Promise<string>((resolve) => {
      Inquirer.prompt({ message: `What type of ${schematic}?`, name: 'collection', type: 'list', choices: [{ name: 'Angular', value: 'angular' }] }).then(
        (answer) => {
          return resolve(`@wdtk/${answer.collection}`);
        }
      );
    });
  }

  private async determineSchematic(): Promise<string> {
    return new Promise<string>((resolve) => {
      Inquirer.prompt([{ message: `What would like to generate?`, type: 'string', name: 'schematic' }]).then((answer) => {
        return resolve(answer.schematic);
      });
    });
  }

  private async parseSchematicInfo(options: { schematic?: string }): Promise<[string, string | undefined]> {
    let collectionName = await this.getDefaultSchematicCollection();
    let schematicName = options.schematic;

    if (schematicName && schematicName.includes(':')) {
      [collectionName, schematicName] = schematicName.split(':', 2);
    }
    return [collectionName, schematicName];
  }
}
