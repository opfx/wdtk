import { join, normalize } from '@angular-devkit/core';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { chain, externalSchematic, schematic } from '@angular-devkit/schematics';

import { addInstallTask, formatFiles, updateJsonInTree, updateWorkspaceDefinition } from '@wdtk/core';
import { strings } from '@wdtk/core/util';

import { extensionsRecommendations, launchConfigurations } from '../../constants';

import { Schema, ProjectType } from './schema';

export interface ProjectOptions extends Schema {}

export default function (opts: ProjectOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    ctx.logger.debug(`▶ Running '@wdtk/php:project' schematic`);
    return chain([
      schematic('init', { ...opts, skipFormat: true, skipInstall: true }),
      externalSchematic('@wdtk/workspace', 'project', { ...opts }),
      generateProjectDefinition(opts),
      setupProjectVsCodeSettings(opts),
      setupProjectVsCodeExtensionsRecommendations(opts),
      setupProjectVsCodeLaunchConfigurations(opts),
      formatFiles(opts),
      addInstallTask(opts),
    ]);
  };
}

/**
 * Generates the project definition for the PHP project.
 * @param opts
 */
function generateProjectDefinition(opts: ProjectOptions): Rule {
  const normalizedProjectRoot = normalize(opts.projectRoot);
  const sourceRoot = join(normalizedProjectRoot, 'src');

  return updateWorkspaceDefinition((workspace) => {
    const project = workspace.projects.add({
      name: opts.name,
      root: normalizedProjectRoot,
      sourceRoot,
      projectType: opts.projectType,
    });
    workspace.extensions.defaultProject = workspace.extensions.defaultProject || opts.name;
  });
}
/**
 * Adds the php related settings to the project settings file.
 *
 * Needs to be done both in the project schematic (for the project settings) and in the init schematic (for workspace).
 *
 * @param opts
 */
function setupProjectVsCodeSettings(opts: ProjectOptions) {
  const vscodeProjectFile = join(normalize(normalize(opts.projectRoot)), `${opts.name}.code-workspace`);
  return async (tree: Tree, ctx: SchematicContext) => {
    return chain([
      updateJsonInTree(join(normalize(opts.projectRoot), '/.vscode/settings.json'), (settings, ctx: SchematicContext) => {
        // no checks required; as opposed to init schematic, this schematic
        // get executed only once, when the project is created
        ctx.logger.debug(` ∙ turning off php.suggest.basic`);
        settings['php.suggest.basic'] = false;

        ctx.logger.debug(` ∙ configuring phpunit extension`);
        settings['phpunit.files'] = '{test,tests}/**/*Test.php';
      }),

      // seems that php.suggest.basic does not get synced between the folder settings and *.code-workspace settings
      updateJsonInTree(vscodeProjectFile, (vscodeProject, ctx: SchematicContext) => {
        ctx.logger.debug(` ∙ checking if php.suggest.basic needs to be turned off in the vscode project`);
        if (vscodeProject.settings === undefined) {
          vscodeProject.settings = {};
        }
        const settings = vscodeProject.settings;
        if (settings['php.suggest.basic'] === undefined) {
          ctx.logger.debug(` ∙ turning off php.suggest.basic`);
          settings['php.suggest.basic'] = false;
        }
      }),
    ]);
  };
}

/**
 * Adds the extensions recommended for PHP development to the workspace root extension recommendations.
 *
 * Needs to be done both in the project schematic (for the project settings) and in the init schematic (for workspace).
 */
function setupProjectVsCodeExtensionsRecommendations(opts: ProjectOptions) {
  return updateJsonInTree(join(normalize(opts.projectRoot), '/.vscode/extensions.json'), (extensions, ctx: SchematicContext) => {
    ctx.logger.debug(` ∙ setting up vscode extension recommendations`);
    const existingRecommendations: string[] = extensions.recommendations || [];
    const extensionsToAdd = extensionsRecommendations.filter((extension) => {
      let includes = false;
      includes = existingRecommendations.includes(extension);
      return !includes;
    });
    extensionsToAdd.forEach((extension) => {
      existingRecommendations.push(extension);
    });
    extensions.recommendations = existingRecommendations;
  });
}

/**
 * Adds the launch configuration to the project launch settings.
 *
 * Needs to be done both in the project schematic (for the project settings) and in the init schematic (for workspace wide settings).
 */
function setupProjectVsCodeLaunchConfigurations(opts: ProjectOptions) {
  const vscodeProjectFile = join(normalize(normalize(opts.projectRoot)), `${opts.name}.code-workspace`);
  const vscodeProjectName = strings.classify(opts.name);
  const vscodeProjectWorkspaceFolder = `\${workspaceFolder:${vscodeProjectName}}`;

  return updateJsonInTree(vscodeProjectFile, (vscodeProject, ctx: SchematicContext) => {
    ctx.logger.debug(` ∙ setting up vscode php launch configurations`);
    const launch = vscodeProject.launch || {};
    const configurations = launch.configurations || [];

    if (opts.projectType === ProjectType.Application) {
      launchConfigurations.push({
        wdtkLaunchId: `phpLaunch${vscodeProjectName}`,
        name: `Launch ${vscodeProjectName} (PHP CLI)`,
        type: 'php',
        request: 'launch',
        program: `${vscodeProjectWorkspaceFolder}/src/index.php`,
        cwd: `${vscodeProjectWorkspaceFolder}/src`,
        port: 9000,
        runtimeArgs: ['-dxdebug.mode=debug', '-dxdebug.start_with_request=yes', '-dxdebug.client_port=9000'],
      });
    }
    const recommendedConfigurationsWdtkIds = launchConfigurations.map((configuration) => {
      return configuration.wdtkLaunchId;
    });

    const existingConfigurationWdtkIds = configurations
      .filter((configuration) => configuration.wdtkLaunchId !== undefined)
      .map((configuration) => configuration.wdtkLaunchId);

    const missingConfigurationsWdtkIds = recommendedConfigurationsWdtkIds.filter((wdtkId) => !existingConfigurationWdtkIds.includes(wdtkId));

    launchConfigurations.forEach((configuration) => {
      if (missingConfigurationsWdtkIds.includes(configuration.wdtkLaunchId)) {
        ctx.logger.debug(` ∙ adding '${configuration.wdtkLaunchId}' launch configuration`);
        configurations.push(configuration);
      }
    });
  });
}
