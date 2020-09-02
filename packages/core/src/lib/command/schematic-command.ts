import { virtualFs, normalize } from '@angular-devkit/core';
import { NodeJsSyncHost, fs } from '@angular-devkit/core/node';

import { formats, workflow } from '@angular-devkit/schematics';
import { FileSystemCollection, FileSystemEngine } from '@angular-devkit/schematics/tools';
import { FileSystemSchematic, FileSystemSchematicDescription } from '@angular-devkit/schematics/tools';
import { NodeWorkflow } from '@angular-devkit/schematics/tools';
import { validateOptionsWithSchema } from '@angular-devkit/schematics/tools';

import { strings, tags } from '@wdtk/core/util';

import { CoreSchemaRegistry } from './../json';
import { transforms } from './../json';

import { Arguments } from './types';
import { Command, CommandOptions } from './command';
import { UnknownCollectionException } from './exceptions';
import { parseJsonSchemaToOptions } from './schema';

export interface SchematicSchema {
  debug?: boolean;
  dryRun?: boolean;
  force?: boolean;
  interactive?: boolean;
  defaults?: boolean;
  packageRegistry?: string;
}

/**
 * Helper class
 *
 * It is for the most part a re-implementation of the schematic-command class in @angular/cli
 * This re-implementations is required to be able to display the help of the schematics
 * used by different commands.
 *
 */
export abstract class SchematicCommand<T extends SchematicSchema & CommandOptions> extends Command<T> {
  protected workflow: NodeWorkflow;

  protected defaultCollectionName = '@wdtk/workspace';
  protected collectionName: string = this.defaultCollectionName;
  protected schematicName?: string;

  public async initialize(options: T & Arguments): Promise<void> {
    await super.initialize(options);
    await this.createWorkflow(options);
    if (this.schematicName) {
      try {
        const collection = this.getCollection(this.collectionName);
        const schematic = this.getSchematic(collection, this.schematicName, true);
        const options = await parseJsonSchemaToOptions(this.workflow.registry, schematic.description.schemaJson);

        this.descriptor.options.push(...options.filter((x) => !x.hidden));
      } catch (e) {
        this.log.error(e.message);
      }
    }
  }

  async printHelp(): Promise<number> {
    await super.printHelp();
    this.log.info('');

    const subCommandOption = this.descriptor.options.filter((x) => x.subcommands)[0];
    if (!subCommandOption || !subCommandOption.subcommands) {
      return 0;
    }
    const schematicNames = Object.keys(subCommandOption.subcommands);
    if (schematicNames.length > 1) {
      this.log.info('Available Schematics:');

      const namesPerCollection: { [c: string]: string[] } = {};
      schematicNames.forEach((name) => {
        let [collectionName, schematicName] = name.split(/:/, 2);
        if (!schematicName) {
          schematicName = collectionName;
          collectionName = this.collectionName;
        }

        if (!namesPerCollection[collectionName]) {
          namesPerCollection[collectionName] = [];
        }
        namesPerCollection[collectionName].push(schematicName);
      });

      const defaultCollection = await this.getDefaultSchematicCollection();
      Object.keys(namesPerCollection).forEach((collectionName) => {
        const isDefault = defaultCollection === collectionName;
        this.log.info(`  Collection "${collectionName}"${isDefault ? ' (default)' : ''}:`);

        namesPerCollection[collectionName].forEach((schematicName) => {
          this.log.info(`    ${schematicName}`);
        });
      });
    }
    if (schematicNames.length === 1) {
      this.log.info('Help for schematic ' + schematicNames[0]);
      await this.printHelpSubCommand(subCommandOption.subcommands[schematicNames[0]]);
    }

    return 0;
  }

  protected async printHelpUsage() {
    const subCommandOption = this.descriptor.options.filter((x) => x.subcommands)[0];

    if (!subCommandOption || !subCommandOption.subcommands) {
      return;
    }

    const schematicNames = Object.keys(subCommandOption.subcommands);
    if (schematicNames.length == 1) {
      this.log.info(this.descriptor.description);

      const opts = this.descriptor.options.filter((x) => x.positional === undefined);
      const [collectionName, schematicName] = schematicNames[0].split(/:/)[0];

      // Display <collectionName:schematicName> if this is not the default collectionName,
      // otherwise just show the schematicName.
      const displayName =
        collectionName == (await this.getDefaultSchematicCollection()) ? schematicName : schematicNames[0];

      const schematicOptions = subCommandOption.subcommands[schematicNames[0]].options;
      const schematicArgs = schematicOptions.filter((x) => x.positional !== undefined);
      const argDisplay =
        schematicArgs.length > 0 ? ' ' + schematicArgs.map((a) => `<${strings.dasherize(a.name)}>`).join(' ') : '';

      this.log.info(tags.oneLine`
        usage: ng ${this.log.name} ${displayName}${argDisplay}
        ${opts.length > 0 ? `[options]` : ``}
      `);
      this.log.info('');
    } else {
      await super.printHelpUsage();
    }
  }

  protected getCollection(collectionName: string): FileSystemCollection {
    const collection = this.getEngine().createCollection(collectionName);
    if (!collection) {
      throw new UnknownCollectionException(collectionName);
    }
    return collection;
  }

  protected async getDefaultSchematicCollection(): Promise<string> {
    return this.defaultCollectionName;
  }

  protected getEngine(): FileSystemEngine {
    return this.workflow.engine;
  }

  protected getSchematic(
    collection: FileSystemCollection,
    schematicName: string,
    allowPrivate: true
  ): FileSystemSchematic {
    return collection.createSchematic(schematicName, allowPrivate);
  }

  private async createWorkflow(options: SchematicSchema): Promise<workflow.BaseWorkflow> {
    if (this.workflow) {
      return this.workflow;
    }

    const { force, dryRun } = options;

    const fsHost = new virtualFs.ScopedHost(new NodeJsSyncHost(), normalize(this.workspace.root));
    const workflow = new NodeWorkflow(fsHost, {
      force,
      dryRun,
      // FIXME packageManager:
      // FIXME packageRegistry
      root: normalize(this.workspace.root),
      registry: new CoreSchemaRegistry(formats.standardFormats),
      // FIXME resolvePaths :
    });

    workflow.engineHost.registerContextTransform((ctx) => {
      return ctx;
    });
    workflow.engineHost.registerOptionsTransform(async (schematic: FileSystemSchematicDescription, current: {}) => {
      // FIXME
    });

    if (options.defaults) {
      workflow.registry.addPreTransform(transforms.addUndefinedDefaults);
    } else {
      workflow.registry.addPostTransform(transforms.addUndefinedDefaults);
    }
    workflow.engineHost.registerOptionsTransform(validateOptionsWithSchema(workflow.registry));

    // FIXME
    //  workflow.registry.addSmartDefaultProvider('projectName', getProjectName);

    return (this.workflow = workflow);
  }
}
