import { chain, noop } from '@angular-devkit/schematics';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

import { NodeDependency, NodeDependencyType } from '@wdtk/core';
import { addWorkspaceDependencies, getWorkspaceDefinition, formatFiles, updateJsonInTree, updateWorkspaceDefinition } from '@wdtk/core';

import { versions, extensionsRecommendations } from '../../constants';

import { Schema as InitOptions } from './schema';

const commonDependencies: NodeDependency[] = [
  // dev dependencies
  { name: '@wdtk/php', type: NodeDependencyType.Dev, version: versions.Wdtk },
  { name: '@prettier/plugin-php', type: NodeDependencyType.Dev, version: versions.PrettierPluginPhp },
];

export default function (opts: Partial<InitOptions>): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    ctx.logger.debug(`▶ Running '@wdtk/php:init' schematic`);
    opts = await normalizeOptions(tree, opts);
    const workspace = await getWorkspaceDefinition(tree);
    if (workspace.extensions.natures && workspace.extensions.natures['@wdtk/php']) {
      ctx.logger.debug(` ∙ skipping: php nature is already initialized`);
      return noop();
    }

    return chain([
      addDependencies(opts), //
      setupWorkspaceDefinition(opts),
      setupWorkspaceVsCodeSettings(opts),
      setupWorkspaceVsCodeLaunchConfigurations(opts),
      setupWorkspaceVsCodeExtensionsRecommendations(opts),
      setupWorkspacePrettierConfig(opts),
      formatFiles(opts),
    ]);
  };
}

/**
 * Adds the php related settings to the workspace root vscode settings file.
 *
 * Needs to be done both in the init schematic (for workspace wide settings) and in the project schematic (for project).
 *
 * @param opts
 */
function setupWorkspaceVsCodeSettings(opts: InitOptions) {
  return async (tree: Tree, ctx: SchematicContext) => {
    return updateJsonInTree('/.vscode/settings.json', (settings, ctx: SchematicContext) => {
      ctx.logger.debug(` ∙ checking if php.suggest.basic needs to be turned off`);
      // only turn off if it's not already set; otherwise, if is set to true
      // it must have been done so on purpose; it would be not wise to override it
      if (settings['php.suggest.basic'] === undefined) {
        ctx.logger.debug(` ∙ turning off php.suggest.basic`);
        settings['php.suggest.basic'] = false;
      }
    });
  };
}

/**
 * Adds the extensions recommended for PHP development to the workspace root extension recommendations.
 *
 * Needs to be done both in the init schematic (for workspace wide settings) and in the project schematic (for project).
 */
function setupWorkspaceVsCodeExtensionsRecommendations(opts: InitOptions) {
  return updateJsonInTree('/.vscode/extensions.json', (extensions, ctx: SchematicContext) => {
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
 * Adds the launch configuration to the workspace root launch settings.
 *
 * Needs to be done both in the init schematic (for workspace wide settings) and in the project schematic (for project).
 */
function setupWorkspaceVsCodeLaunchConfigurations(opts: InitOptions) {
  return updateJsonInTree('/.vscode/launch.json', (launch, ctx: SchematicContext) => {
    ctx.logger.debug(` ∙ setting up vscode php launch configurations`);
    const configurations = launch.configurations || [];

    configurations.push({
      name: 'Listen for Xdebug',
      type: 'php',
      request: 'launch',
      port: 9000,
    });

    configurations.push({
      name: 'Launch PHP with currently open script',
      type: 'php',
      request: 'launch',
      program: '${file}',
      cwd: '${fileDirname}',
      port: 9000,
      runtimeArgs: ['-dxdebug.mode=debug', '-dxdebug.start_with_request=yes', '-dxdebug.client_port=9000'],
    });
  });
}

/**
 * Adds php related settings to the workspace prettier config file.
 * @param opts
 * @returns
 */
function setupWorkspacePrettierConfig(opts: InitOptions) {
  return updateJsonInTree('/.prettierrc', (config, ctx: SchematicContext) => {
    ctx.logger.debug(` ∙ setting up prettier support for php projects`);
    if (config.phpVersion === undefined) {
      config.phpVersion = versions.Php;
    }
    if (config.braceStyle === undefined) {
      config.braceStyle = '1tbs';
    }
  });
}

function setupWorkspaceDefinition(opts: InitOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    return updateWorkspaceDefinition((workspace) => {
      if (!workspace.extensions.natures) {
        workspace.extensions.natures = {};
      }
      if (!workspace.extensions.natures['@wdtk/php']) {
        workspace.extensions.natures['@wdtk/php'] = { name: 'PHP' };
      }
    });
  };
}

function addDependencies(opts: InitOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    return chain([addWorkspaceDependencies(commonDependencies)]);
  };
}

function normalizeOptions(tree: Tree, opts: Partial<InitOptions>): InitOptions {
  return {
    ...opts,
  };
}
