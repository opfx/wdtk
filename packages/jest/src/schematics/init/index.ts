import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, mergeWith, noop, url } from '@angular-devkit/schematics';

import { NodeDependency, NodeDependencyType } from '@wdtk/core';
import { addWorkspaceDependencies, updateJsonInTree } from '@wdtk/core';

import { versions, extensionsRecommendations } from './../../constants';

import { Schema as InitOptions } from './schema';

const commonDependencies: NodeDependency[] = [
  // dev dependencies
  { name: '@wdtk/jest', type: NodeDependencyType.Dev, version: versions.Wdtk },
  { name: 'jest', type: NodeDependencyType.Dev, version: versions.Jest },
  { name: '@types/jest', type: NodeDependencyType.Dev, version: versions.JestTypes },
  { name: 'ts-jest', type: NodeDependencyType.Dev, version: versions.TsJest },
];
const angularDependencies: NodeDependency[] = [{ name: 'jest-preset-angular', type: NodeDependencyType.Dev, version: versions.JestPresetAngular }];
const babelDependencies: NodeDependency[] = [
  { name: '@babel/core', type: NodeDependencyType.Dev, version: versions.BabelCore },
  { name: '@babel/preset-env', type: NodeDependencyType.Dev, version: versions.BabelPresetEnv },
  { name: '@babel/preset-typescript', type: NodeDependencyType.Dev, version: versions.BabelPresetTypescript },
  { name: '@babel/preset-react', type: NodeDependencyType.Dev, version: versions.BabelPresetReact },
  { name: 'babel-jest', type: NodeDependencyType.Dev, version: versions.BabelJest },
];

export default function (opts: InitOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    ctx.logger.debug(`▶ Running '@wdtk/jest:init' schematic`);

    return chain([generateFiles(opts), addDependencies(opts), setupWorkspaceVsCodeExtensionsRecommendations(opts)]);
  };
}

function generateFiles(opts: InitOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    if (tree.exists('jest.config.js')) {
      return noop();
    }
    return mergeWith(
      apply(url('./files'), [
        applyTemplates({
          dot: '.',
          ...opts,
        }),
      ])
    );
  };
}

function addDependencies(opts: InitOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    return chain([
      addWorkspaceDependencies(commonDependencies), //
      // if we don't support TSX or babelJest then we support angular(html templates)
      !opts.supportTsx && !opts.babelJest ? addWorkspaceDependencies(angularDependencies) : noop(),
      opts.babelJest ? addWorkspaceDependencies(babelDependencies) : noop(),
    ]);
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
    return extensions;
  });
}
