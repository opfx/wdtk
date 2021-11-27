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
    name: 'ts-node',
    type: NodeDependencyType.Dev,
    version: versions.TsNode,
  },
  {
    name: '@angular-devkit/build-angular',
    type: NodeDependencyType.Dev,
    version: versions.Angular,
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

    let skipTsConfig = false;
    if (tree.exists('tsconfig.json')) {
      skipTsConfig = true;
    }

    const templateSource = apply(url('./files'), [
      applyTemplates({ dot: '.', ...options }),
      skipTsConfig ? filter((file) => file !== '/tsconfig.json') : noop(),
    ]);
    return chain([mergeWith(templateSource), addWorkspaceDependencies(workspaceDependencies)]);
  };
}
