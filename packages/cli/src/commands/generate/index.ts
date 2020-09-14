import * as Inquirer from 'inquirer';
import { Arguments, SchematicCommand } from '@wdtk/core';

import { Schema as GenerateCommandOptions } from './schema';

export class GenerateCommand extends SchematicCommand<GenerateCommandOptions> {
  async initialize(options: GenerateCommandOptions & Arguments) {
    const [collectionName, schematicName] = await this.parseSchematicInfo(options);
    if (!schematicName) {
      this.determineSchematic();
    }
    this.collectionName = collectionName;
    this.schematicName = schematicName;

    await super.initialize(options);
  }
  async run(options: GenerateCommandOptions & Arguments): Promise<number | void> {
    // this.log.debug(`Running 'generate' command`);
    throw new Error(`here ${this.collectionName}:${this.schematicName}`);
    return;

    // return this.runSchematic({
    //   collectionName: this.collectionName,
    //   schematicName: this.schematicName,
    //   schematicOptions: options['--'] || [],
    //   debug: !!options.verbose,
    //   dryRun: !!options.dryRun,
    //   force: !!options.force,
    // });
  }

  private async determineSchematic(): Promise<string> {
    return '';
    // return new Promise<string>((resolve)=>{
    //   Inquirer.prompt()
    // })
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
