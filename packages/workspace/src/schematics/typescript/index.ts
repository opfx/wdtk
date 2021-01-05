import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, filter, mergeWith, noop, url } from '@angular-devkit/schematics';

import { addWorkspaceDependencies, NodeDependency, NodeDependencyType } from '@wdtk/core';

import { versions } from './../../versions';

import { Schema as TypescriptOptions } from './schema';
const workspaceDependencies: NodeDependency[] = [
  {
    name: 'tslib',
    type: NodeDependencyType.Default,
    version: versions.TsLib,
  },
  // dev dependencies
  {
    name: '@types/node',
    type: NodeDependencyType.Dev,
    version: versions.NodeTypes,
  },
  {
    name: 'codelyzer',
    type: NodeDependencyType.Dev,
    version: versions.Codelyzer,
  },
  {
    name: 'ts-node',
    type: NodeDependencyType.Dev,
    version: versions.TsNode,
  },
  {
    name: 'tslint',
    type: NodeDependencyType.Dev,
    version: versions.TsLint,
  },
  {
    name: '@angular-devkit/build-angular',
    type: NodeDependencyType.Dev,
    version: versions.AngularBuild,
  },
  {
    name: 'typescript',
    type: NodeDependencyType.Dev,
    version: versions.Typescript,
  },
];

export default function (options: TypescriptOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    ctx.logger.debug(`▶ Running '@wdtk/workspace:typescript' schematic`);
    let skipTsLint = false;
    let skipTsConfig = false;
    if (tree.exists('tslint.json')) {
      skipTsLint = true;
    }
    if (tree.exists('tsconfig.json')) {
      skipTsConfig = true;
    }

    const templateSource = apply(url('./files'), [
      applyTemplates({ dot: '.', ...options }),
      skipTsLint ? filter((file) => file !== '/tslint.json') : noop(),
      skipTsConfig ? filter((file) => file !== '/tsconfig.json') : noop(),
    ]);
    return chain([mergeWith(templateSource), addWorkspaceDependencies(workspaceDependencies)]);
  };
}
