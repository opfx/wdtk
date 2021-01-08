import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, mergeWith, noop, url } from '@angular-devkit/schematics';

import { NodeDependency, NodeDependencyType } from '@wdtk/core';
import { addWorkspaceDependencies } from '@wdtk/core';

import { versions } from './../../versions';

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

    return chain([generateFiles(opts), addDependencies(opts)]);
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
