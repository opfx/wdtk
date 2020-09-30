import * as Inquirer from 'inquirer';
import { Arguments, SchematicCommand, SubCommandDescriptor } from '@wdtk/core';
import { parseJsonSchemaToOptions, parseJsonSchemaToSubCommandDescriptor } from '@wdtk/core';
import { strings } from '@wdtk/core/util';

import { Schema as GenerateCommandOptions } from './schema';

const availableCollectionNames: string[] = ['@wdtk/angular', '@wdtk/php'];
export class GenerateCommand extends SchematicCommand<GenerateCommandOptions> {
  async initialize(options: GenerateCommandOptions & Arguments) {
    await super.initialize(options);

    let [collectionName, schematicName] = await this.parseSchematicInfo(options);
    if (!(options.help === true || options.help === 'json' || options.help === 'JSON')) {
      schematicName = await this.determineSchematic();
      collectionName = await this.determineCollection(schematicName);
    }
    this.collectionName = collectionName;
    this.schematicName = schematicName;

    if (this.schematicName) {
      try {
        const collection = this.getCollection(this.collectionName);
        const schematic = this.getSchematic(collection, this.schematicName, true);
        const options = await parseJsonSchemaToOptions(this.workflow.registry, schematic.description.schemaJson);

        this.descriptor.options.push(...options.filter((x) => !x.hidden));
      } catch (e) {
        // this.logger.error(`t${e.message}`);
      }
    }

    const subCommands: { [name: string]: SubCommandDescriptor } = {};

    const collectionNames: string[] = collectionName ? [collectionName] : availableCollectionNames;

    for (const currentCollectionName of collectionNames) {
      const collection = this.getCollection(currentCollectionName);
      const schematicNames = schematicName ? [schematicName] : collection.listSchematicNames();
      schematicNames.sort();
      for (const currentSchematicName of schematicNames) {
        const schematic = this.getSchematic(collection, currentSchematicName, true);
        let subCommand: SubCommandDescriptor;
        if (schematic.description.schemaJson) {
          subCommand = await parseJsonSchemaToSubCommandDescriptor(
            schematicName,
            schematic.description.path,
            this.workflow.registry,
            schematic.description.schemaJson
          );
          subCommands[`${currentCollectionName}:${currentSchematicName}`] = subCommand;
        }
      }
    }
    this.descriptor.options.forEach((option) => {
      if (option.name === 'schematic') {
        option.subcommands = subCommands;
      }
    });
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

  private async determineCollection(schematicName: string): Promise<string> {
    return new Promise<string>((resolve) => {
      const choices: any[] = [];
      const addChoice = (collectionName) => {
        const shortCollectionName = collectionName.split('/')[1];
        choices.push({ name: strings.classify(shortCollectionName), value: collectionName });
      };
      for (const collectionName of availableCollectionNames) {
        const collection = this.getCollection(collectionName);

        const schematicNames = collection.listSchematicNames();

        // if the specified schematicName matches any of the long schematic names add it to
        // the list of choices and continue with the next collection
        if (schematicNames.some((name) => name === schematicName)) {
          addChoice(collectionName);
          continue;
        }
        // if the specified schematicName does not match any of the names it might match
        // one of the aliases
        for (const currentSchematicName of schematicNames) {
          const schematic = this.getSchematic(collection, currentSchematicName, true);
          if (schematic.description.hidden) {
            continue;
          }
          if (schematic.description.aliases && schematic.description.aliases.some((alias) => alias === schematicName)) {
            addChoice(collectionName);
            schematicName = schematic.description.name;
          }
        }
      }
      Inquirer.prompt({ message: `What type of "${schematicName}" would you like to generate?`, name: 'collection', type: 'list', choices: choices }).then(
        (answer) => {
          return resolve(answer.collection);
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
    let collectionName: string = undefined;
    let schematicName = options.schematic;
    if (schematicName && schematicName.includes(':')) {
      [collectionName, schematicName] = schematicName.split(':');
    }
    return [collectionName, schematicName];
  }
}
