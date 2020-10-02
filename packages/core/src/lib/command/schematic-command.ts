import * as Path from 'path';
import * as Inquirer from 'inquirer';
import { virtualFs, normalize, workspaces } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';

import { formats, workflow } from '@angular-devkit/schematics';
import { DryRunEvent, UnsuccessfulWorkflowExecution } from '@angular-devkit/schematics';
import { FileSystemCollection, FileSystemEngine, NodeModulesEngineHost } from '@angular-devkit/schematics/tools';
import { FileSystemSchematic, FileSystemSchematicDescription } from '@angular-devkit/schematics/tools';
import { NodeWorkflow } from '@angular-devkit/schematics/tools';
import { validateOptionsWithSchema } from '@angular-devkit/schematics/tools';

import { Logger } from '@wdtk/core/util';
import { isTTY } from '@wdtk/core/util';
import { colors, strings, tags } from '@wdtk/core/util';

import { CoreSchemaRegistry, PromptDefinition } from './../json';
import { transforms } from './../json';

import { Arguments, Option } from './types';
import { CommandContext, CommandDescriptor } from './types';
import { Command, CommandOptions } from './command';
import { UnknownCollectionException } from './exceptions';
import { parseJsonSchemaToOptions } from './schema';
import { parseArguments, parseFreeFormArguments } from './arguments';
import { getSchematicDefaults } from './../config';

export interface SchematicSchema {
  debug?: boolean;
  dryRun?: boolean;
  force?: boolean;
  interactive?: boolean;
  defaults?: boolean;
  packageRegistry?: string;
}

export interface RunSchematicOptions extends SchematicSchema {
  collectionName: string;
  schematicName: string;
  additionalOptions?: { [key: string]: {} };
  schematicOptions?: string[];
  showNothingDone?: boolean;
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
  readonly allowPrivateSchematics: boolean = false;
  private host = new NodeJsSyncHost();
  protected workflow: NodeWorkflow;
  private _workspace: workspaces.WorkspaceDefinition;

  protected defaultCollectionName = '@wdtk/workspace';
  protected collectionName: string = this.defaultCollectionName;
  protected schematicName?: string;

  constructor(context: CommandContext, descriptor: CommandDescriptor, log: Logger) {
    super(context, descriptor, log);
  }

  public async initialize(options: T & Arguments): Promise<void> {
    await super.initialize(options);
    await this.loadWorkspace();
    await this.createWorkflow(options);
    if (this.schematicName) {
      try {
        const collection = this.getCollection(this.collectionName);
        const schematic = this.getSchematic(collection, this.schematicName, true);
        const options = await parseJsonSchemaToOptions(this.workflow.registry, schematic.description.schemaJson);

        this.descriptor.options.push(...options.filter((x) => !x.hidden));
      } catch (e) {
        // this.log.error(e.message);
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
      const displayName = collectionName == (await this.getDefaultSchematicCollection()) ? schematicName : schematicNames[0];

      const schematicOptions = subCommandOption.subcommands[schematicNames[0]].options;
      const schematicArgs = schematicOptions.filter((x) => x.positional !== undefined);
      const argDisplay = schematicArgs.length > 0 ? ' ' + schematicArgs.map((a) => `<${strings.dasherize(a.name)}>`).join(' ') : '';

      this.log.info(tags.oneLine`
        usage: wx ${this.descriptor.name} ${displayName}${argDisplay}
        ${opts.length > 0 ? `[options]` : ``}
      `);
      this.log.info('');
    } else {
      await super.printHelpUsage();
    }
  }

  protected getWorkspaceDefinition() {
    return this._workspace;
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

  protected getEngineHost(): NodeModulesEngineHost {
    return this.workflow.engineHost;
  }

  protected getSchematic(collection: FileSystemCollection, schematicName: string, allowPrivate?: boolean): FileSystemSchematic {
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

    const getProjectName = () => {
      if (!this._workspace) {
        return undefined;
      }
      const projectNames = getProjectsByPath(this._workspace, process.cwd(), this.workspace.root);
      if (projectNames.length === 1) {
        return projectNames[0];
      }
      if (projectNames.length > 1) {
        this.log.warn(tags.oneLine`
        Two or more projects are using identical roots.
        Unable to determine project using current working directory.
        Using default workspace project instead.
      `);
      }
      const defaultProjectName = this._workspace.extensions['defaultProject'];
      if (typeof defaultProjectName === 'string' && defaultProjectName) {
        return defaultProjectName;
      }
    };

    const defaultOptionTransform = async (schematic: FileSystemSchematicDescription, current: {}) => ({
      ...(await getSchematicDefaults(schematic.collection.name, schematic.name, getProjectName())),
      ...current,
    });
    workflow.engineHost.registerOptionsTransform(defaultOptionTransform);

    if (options.defaults) {
      workflow.registry.addPreTransform(transforms.addUndefinedDefaults);
    } else {
      workflow.registry.addPostTransform(transforms.addUndefinedDefaults);
    }

    workflow.engineHost.registerOptionsTransform(validateOptionsWithSchema(workflow.registry));

    workflow.registry.addSmartDefaultProvider('projectName', getProjectName);

    if (options.interactive !== false && isTTY()) {
      workflow.registry.usePromptProvider((definitions: Array<PromptDefinition>) => {
        const questions: Inquirer.QuestionCollection = definitions.map((definition) => {
          const question: Inquirer.Question = {
            name: definition.id,
            message: definition.message,
            default: definition.default,
          };

          const validator = definition.validator;
          if (validator) {
            question.validate = (input) => validator(input);
          }

          switch (definition.type) {
            case 'confirmation':
              question.type = 'confirm';
              break;
            case 'list':
              question.type = definition.multiselect ? 'checkbox' : 'list';
              (question as Inquirer.CheckboxQuestion).choices = definition.items?.map((item) => {
                return typeof item === 'string' ? item : { name: item.label, value: item.value };
              });
              break;
            default:
              question.type = definition.type;
          }
          return question;
        });
        return Inquirer.prompt(questions);
      });
    }
    return (this.workflow = workflow);
  }

  protected async runSchematic(options: RunSchematicOptions) {
    const { schematicOptions, debug, dryRun } = options;
    let { collectionName, schematicName } = options;

    let nothingDone = true;
    let loggingQueue: string[] = [];
    let error = false;

    const workflow = this.workflow;
    const workingDir = normalize(Path.relative(this.workspace.root, process.cwd()));

    const schematic = this.getSchematic(this.getCollection(collectionName), schematicName, this.allowPrivateSchematics);

    // Update the schematic and collection name in case they're not the same as the ones we
    // received in our options, e.g. after alias resolution or extension.
    collectionName = schematic.collection.description.name;
    schematicName = schematic.description.name;

    let opts: Option[] | null = null;
    let args: Arguments;

    if (!schematic.description.schemaJson) {
      args = await this.parseFreeFormArguments(schematicOptions || []);
    } else {
      opts = await parseJsonSchemaToOptions(workflow.registry, schematic.description.schemaJson);
      args = await this.parseArguments(schematicOptions || [], opts);
    }

    const allowAdditionProperties = typeof schematic.description.schemaJson === 'object' && schematic.description.schemaJson.additionalOptions;

    if (args['--'] && !allowAdditionProperties) {
      args['--'].forEach((additional) => {
        this.log.fatal(`Unknown option: '${additional.split(/=/)[0]}`);
      });
      return 1;
    }

    const pathOpts = opts ? this.setPathOptions(opts, workingDir) : {};
    let input = { ...args };

    const projectName = input.project !== undefined ? '' + input.project : null;
    const schematicDefaults = await getSchematicDefaults(collectionName, schematicName, projectName);

    input = { ...schematicDefaults, ...input, ...options.additionalOptions };

    workflow.reporter.subscribe((event: DryRunEvent) => {
      nothingDone = false;

      const eventPath = event.path.startsWith('/') ? event.path.substr(1) : event.path;

      switch (event.kind) {
        case 'error':
          error = true;
          const desc = event.description === 'alreadyExist' ? 'already exists' : 'does not exist.';
          this.log.warn(`Error ! ${eventPath} ${desc}`);
          break;
        case 'update':
          loggingQueue.push(tags.oneLine`
          ${colors.white('UPDATE')} ${eventPath} (${event.content.length} bytes)
          `);
          break;
        case 'create':
          loggingQueue.push(tags.oneLine`
          ${colors.green('CREATE')} ${eventPath} (${event.content.length} bytes)
        `);
          break;
        case 'delete':
          loggingQueue.push(`${colors.yellow('DELETE')} ${eventPath}`);
          break;
        case 'rename':
          const eventToPath = event.to.startsWith('/') ? event.to.substr(1) : event.to;
          loggingQueue.push(`${colors.blue('RENAME')} ${eventPath} => ${eventToPath}`);
          break;
      }
    });

    workflow.lifeCycle.subscribe((event) => {
      if (event.kind === 'end' || event.kind === 'post-tasks-start') {
        if (!error) {
          loggingQueue.forEach((message) => this.log.info(message));
        }
        loggingQueue = [];
        error = false;
      }
    });

    return new Promise<number | void>((resolve) => {
      workflow
        .execute({
          collection: collectionName,
          schematic: schematicName,
          options: input,
          // logger: this.log,
          logger: Logger.getLoggerA(debug),
          allowPrivate: this.allowPrivateSchematics,
        })
        .subscribe({
          error: (e: Error) => {
            if (e instanceof UnsuccessfulWorkflowExecution) {
              this.log.fatal(`The Schematic workflow failed. See above.`);
            } else if (debug) {
              this.log.fatal(`An error occurred:\n${e.message}\n${e.stack}`);
            } else {
              this.log.fatal(e.message);
            }
            resolve(1);
          },
          complete: () => {
            const showNothingDone = !(options.showNothingDone === false);
            if (nothingDone && showNothingDone) {
              this.log.info('Nothing to be done.');
            }
            if (dryRun) {
              this.log.warn(`\nNOTE: The "dryRun" flag means no changes were made.`);
            }
            resolve();
          },
        });
    });
  }

  protected async parseFreeFormArguments(schematicOptions: string[]): Promise<Arguments> {
    return parseFreeFormArguments(schematicOptions);
  }

  protected async parseArguments(schematicOptions: string[], options: Option[] | null): Promise<Arguments> {
    return parseArguments(schematicOptions, options, this.log);
  }

  protected setPathOptions(opts: Option[], workingDir: string): {} {
    if (workingDir === '') {
      return {};
    }

    return opts
      .filter((o) => o.format === 'path')
      .map((o) => o.name)
      .reduce((acc, curr) => {
        acc[curr] = workingDir;
        return acc;
      }, {} as { [name: string]: string });
  }

  private async loadWorkspace() {
    if (this._workspace) {
      return;
    }

    try {
      const { workspace } = await workspaces.readWorkspace(this.workspace.root, workspaces.createWorkspaceHost(this.host));
      this._workspace = workspace;
    } catch (err) {
      if (!this.allowMissingWorkspace) {
        // Ignore missing workspace
        throw err;
      }
    }
  }
}

function getProjectsByPath(workspace: workspaces.WorkspaceDefinition, path: string, root: string): string[] {
  if (workspace.projects.size === 1) {
    return Array.from(workspace.projects.keys());
  }

  const isInside = (base: string, potential: string): boolean => {
    const absoluteBase = Path.resolve(root, base);
    const absolutePotential = Path.resolve(root, potential);
    const relativePotential = Path.relative(absoluteBase, absolutePotential);
    if (!relativePotential.startsWith('..') && !Path.isAbsolute(relativePotential)) {
      return true;
    }

    return false;
  };

  const projects = Array.from(workspace.projects.entries())
    .map(([name, project]) => [Path.resolve(root, project.root), name] as [string, string])
    .filter((tuple) => isInside(tuple[0], path))
    // Sort tuples by depth, with the deeper ones first. Since the first member is a path and
    // we filtered all invalid paths, the longest will be the deepest (and in case of equality
    // the sort is stable and the first declared project will win).
    .sort((a, b) => b[0].length - a[0].length);

  if (projects.length === 1) {
    return [projects[0][1]];
  } else if (projects.length > 1) {
    const firstPath = projects[0][0];

    return projects.filter((v) => v[0] === firstPath).map((v) => v[1]);
  }

  return [];
}
