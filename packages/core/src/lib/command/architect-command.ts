/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Architect, Target } from '@angular-devkit/architect';
import { WorkspaceNodeModulesArchitectHost } from '@angular-devkit/architect/node';

import { workspaces } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';

import { Logger } from '@wdtk/core/util';
import { tags } from '@wdtk/core/util';

import { CoreSchemaRegistry, SchemaRegistry, SchemaValidationException, SchemaValidatorError, JsonObject } from './../json';
import { transforms } from './../json';

import { Command, CommandOptions } from './command';
import { Arguments, CommandContext, CommandDescriptor, Option } from './types';
import { parseJsonSchemaToOptions } from './schema';
import { parseArguments } from './arguments';
export interface ArchitectCommandOptions extends CommandOptions {
  project?: string;
  configuration?: string;
  prod?: boolean;
  target?: string;
}
export abstract class ArchitectCommand<T extends ArchitectCommandOptions = ArchitectCommandOptions> extends Command<T> {
  protected _architect!: Architect;
  protected _architectHost!: WorkspaceNodeModulesArchitectHost;

  protected _registry: SchemaRegistry;
  protected _workspace!: workspaces.WorkspaceDefinition;

  // If this command supports running multiple targets.
  protected multiTarget = false;

  private host: NodeJsSyncHost;

  target: string | undefined;
  missingTargetError: string | undefined;

  constructor(context: CommandContext, descriptor: CommandDescriptor, logger: Logger) {
    super(context, descriptor, logger);
    this.host = new NodeJsSyncHost();
  }

  public async initialize(options: T & Arguments): Promise<void> {
    await super.initialize(options);
    await this.loadWorkspace();
    await this.createArchitect();

    if (!this.target) {
      if (options.help) {
        return;
      }
      const specifier = this.makeTargetSpecifier(options);
      if (!specifier.project || !specifier.target) {
        throw new Error(`Cannot determine project or target for command.`);
      }
      return;
    }

    let projectName = options.project;
    if (projectName && !this._workspace.projects.has(projectName)) {
      throw new Error(`Project '${projectName}' does not exist.`);
    }

    const commandLeftovers = options['--'];
    const targetProjectNames: string[] = [];
    for (const [name, project] of this._workspace.projects) {
      if (project.targets.has(this.target)) {
        targetProjectNames.push(name);
      }
    }

    if (targetProjectNames.length === 0) {
      throw new Error(this.missingTargetError || `No projects support the '${this.target}' target.`);
    }

    if (projectName && !targetProjectNames.includes(projectName)) {
      throw new Error(this.missingTargetError || `Project '${projectName}' does not support the '${this.target}' target.`);
    }

    if (!projectName && commandLeftovers && commandLeftovers.length > 0) {
      const builderNames = new Set<string>();
      const leftoverMap = new Map<string, { optionDefs: Option[]; parsedOptions: Arguments }>();
      let potentialProjectNames = new Set<string>(targetProjectNames);
      for (const name of targetProjectNames) {
        const builderName = await this._architectHost.getBuilderNameForTarget({
          project: name,
          target: this.target,
        });

        if (this.multiTarget) {
          builderNames.add(builderName);
        }

        const builderDesc = await this._architectHost.resolveBuilder(builderName);
        const optionDefs = await parseJsonSchemaToOptions(this._registry, builderDesc.optionSchema as JsonObject);
        const parsedOptions = parseArguments([...commandLeftovers], optionDefs);
        const builderLeftovers = parsedOptions['--'] || [];
        leftoverMap.set(name, { optionDefs, parsedOptions });

        potentialProjectNames = new Set(builderLeftovers.filter((x) => potentialProjectNames.has(x)));
      }

      if (potentialProjectNames.size === 1) {
        projectName = [...potentialProjectNames][0];

        // remove the project name from the leftovers
        const optionInfo = leftoverMap.get(projectName);
        if (optionInfo) {
          const locations = [];
          let i = 0;
          while (i < commandLeftovers.length) {
            i = commandLeftovers.indexOf(projectName, i + 1);
            if (i === -1) {
              break;
            }
            locations.push(i);
          }
          delete optionInfo.parsedOptions['--'];
          for (const location of locations) {
            const tempLeftovers = [...commandLeftovers];
            tempLeftovers.splice(location, 1);
            const tempArgs = parseArguments([...tempLeftovers], optionInfo.optionDefs);
            delete tempArgs['--'];
            if (JSON.stringify(optionInfo.parsedOptions) === JSON.stringify(tempArgs)) {
              options['--'] = tempLeftovers;
              break;
            }
          }
        }
      }

      if (!projectName && this.multiTarget && builderNames.size > 1) {
        throw new Error(tags.oneLine`
          Architect commands with command line overrides cannot target different builders. The
          '${this.target}' target would run on projects ${targetProjectNames.join()} which have the
          following builders: ${'\n  ' + [...builderNames].join('\n  ')}
        `);
      }
    }

    if (!projectName && !this.multiTarget) {
      const defaultProjectName = this._workspace.extensions['defaultProject'] as string;
      if (targetProjectNames.length === 1) {
        projectName = targetProjectNames[0];
      } else if (defaultProjectName && targetProjectNames.includes(defaultProjectName)) {
        projectName = defaultProjectName;
      } else if (options.help) {
        // This is a special case where we just return.
        return;
      } else {
        throw new Error(this.missingTargetError || 'Cannot determine project or target for command.');
      }
    }

    options.project = projectName;

    const builderConf = await this._architectHost.getBuilderNameForTarget({
      project: projectName || (targetProjectNames.length > 0 ? targetProjectNames[0] : ''),
      target: this.target,
    });
    const builderDesc = await this._architectHost.resolveBuilder(builderConf);

    this.descriptor.options.push(...(await parseJsonSchemaToOptions(this._registry, builderDesc.optionSchema as JsonObject)));
  }

  async run(options: ArchitectCommandOptions & Arguments): Promise<number | void> {
    return await this.runArchitectTarget(options);
  }

  protected async runBepTarget(command: string, configuration: Target, overrides: JsonObject, buildEventLog: string): Promise<number> {
    return 0;
    // const bep = new BepJsonWriter(buildEventLog);
    // // Send start
    // bep.writeBuildStarted(command);
    // let last = 1;
    // let rebuild = false;
    // const run = await this._architect.scheduleTarget(configuration, overrides, {
    //   logger: this.logger,
    // });
    // await run.output.forEach((event) => {
    //   last = event.success ? 0 : 1;
    //   if (rebuild) {
    //     // NOTE: This will have an incorrect timestamp but this cannot be fixed
    //     //       until builders report additional status events
    //     bep.writeBuildStarted(command);
    //   } else {
    //     rebuild = true;
    //   }
    //   bep.writeBuildFinished(last);
    // });
    // await run.stop();
    // return last;
  }

  protected async runSingleTarget(target: Target, targetOptions: string[], commandOptions: ArchitectCommandOptions & Arguments) {
    // We need to build the builderSpec twice because architect does not understand
    // overrides separately (getting the configuration builds the whole project, including
    // overrides).
    const builderConf = await this._architectHost.getBuilderNameForTarget(target);
    const builderDesc = await this._architectHost.resolveBuilder(builderConf);
    const targetOptionArray = await parseJsonSchemaToOptions(this._registry, builderDesc.optionSchema as JsonObject);
    const overrides = parseArguments(targetOptions, targetOptionArray, this.logger);

    const allowAdditionalProperties = typeof builderDesc.optionSchema === 'object' && builderDesc.optionSchema.additionalProperties;

    if (overrides['--'] && !allowAdditionalProperties) {
      (overrides['--'] || []).forEach((additional) => {
        this.logger.fatal(`Unknown option: '${additional.split(/=/)[0]}'`);
      });

      return 1;
    }

    if (commandOptions.buildEventLog && ['build', 'serve'].includes(this.descriptor.name)) {
      // The build/serve commands supports BEP messaging
      this.logger.warn('BEP support is experimental and subject to change.');

      return this.runBepTarget(this.descriptor.name, target, overrides as JsonObject, commandOptions.buildEventLog as string);
    } else {
      const run = await this._architect.scheduleTarget(target, overrides as JsonObject, {
        logger: this.logger,
      });

      const { error, success } = await run.output.toPromise();
      await run.stop();

      if (error) {
        this.logger.error(error);
      }

      return success ? 0 : 1;
    }
  }
  protected async runArchitectTarget(options: ArchitectCommandOptions & Arguments): Promise<number> {
    const extra = options['--'] || [];

    try {
      const targetSpec = this.makeTargetSpecifier(options);
      if (!targetSpec.project && this.target) {
        // This runs each target sequentially.
        // Running them in parallel would jumble the log messages.
        let result = 0;
        for (const project of this.getProjectNamesByTarget(this.target)) {
          result |= await this.runSingleTarget({ ...targetSpec, project } as Target, extra, options);
        }

        return result;
      } else {
        return await this.runSingleTarget(targetSpec, extra, options);
      }
    } catch (e) {
      if (e instanceof SchemaValidationException) {
        const newErrors: SchemaValidatorError[] = [];
        for (const schemaError of e.errors) {
          if (schemaError.keyword === 'additionalProperties') {
            const unknownProperty = schemaError.params.additionalProperty;
            if (unknownProperty in options) {
              const dashes = unknownProperty.length === 1 ? '-' : '--';
              this.logger.fatal(`Unknown option: '${dashes}${unknownProperty}'`);
              continue;
            }
          }
          newErrors.push(schemaError);
        }

        if (newErrors.length > 0) {
          this.logger.error(new SchemaValidationException(newErrors).message);
        }

        return 1;
      } else {
        throw e;
      }
    }
  }

  private getProjectNamesByTarget(targetName: string): string[] {
    const allProjectsForTargetName: string[] = [];
    for (const [name, project] of this._workspace.projects) {
      if (project.targets.has(targetName)) {
        allProjectsForTargetName.push(name);
      }
    }

    if (this.multiTarget) {
      // For multi target commands, we always list all projects that have the target.
      return allProjectsForTargetName;
    } else {
      // For single target commands, we try the default project first,
      // then the full list if it has a single project, then error out.
      const maybeDefaultProject = this._workspace.extensions['defaultProject'] as string;
      if (maybeDefaultProject && allProjectsForTargetName.includes(maybeDefaultProject)) {
        return [maybeDefaultProject];
      }

      if (allProjectsForTargetName.length === 1) {
        return allProjectsForTargetName;
      }

      throw new Error(`Could not determine a single project for the '${targetName}' target.`);
    }
  }

  private async loadWorkspace(): Promise<void> {
    if (this._workspace) {
      return;
    }

    try {
      const { workspace } = await workspaces.readWorkspace(this.workspace.root, workspaces.createWorkspaceHost(this.host));
      this._workspace = workspace;
    } catch (e) {
      throw e;
    }
  }

  private async createArchitect(): Promise<void> {
    if (this._architectHost) {
      return;
    }
    this._registry = new CoreSchemaRegistry();
    this._registry.addPostTransform(transforms.addUndefinedDefaults);
    this._registry.useXDeprecatedProvider((message) => this.logger.warn(message));
    this._architectHost = new WorkspaceNodeModulesArchitectHost(this._workspace, this.workspace.root);
    this._architect = new Architect(this._architectHost, this._registry);
  }

  private makeTargetSpecifier(commandOptions: ArchitectCommandOptions): Target {
    let project, target, configuration;

    if (commandOptions.target) {
      [project, target, configuration] = commandOptions.target.split(':');

      if (commandOptions.configuration) {
        configuration = commandOptions.configuration;
      }
    } else {
      project = commandOptions.project;
      target = this.target;
      if (commandOptions.prod) {
        // The --prod flag will always be the first configuration, available to be overwritten
        // by following configurations.
        configuration = 'production';
      }
      if (commandOptions.configuration) {
        configuration = `${configuration ? `${configuration},` : ''}${commandOptions.configuration}`;
      }
    }

    if (!project) {
      project = '';
    }
    if (!target) {
      target = '';
    }

    return {
      project,
      configuration: configuration || '',
      target,
    };
  }
}
