import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, mergeWith, url } from '@angular-devkit/schematics';

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
    name: 'typescript',
    type: NodeDependencyType.Dev,
    version: versions.Typescript,
  },
];

export default function (options: TypescriptOptions): Rule {
  return (host: Tree, ctx: SchematicContext) => {
    const templateSource = apply(url('./files'), [applyTemplates({ dot: '.', ...options })]);
    return chain([mergeWith(templateSource), addWorkspaceDependencies(workspaceDependencies)]);
  };
}
