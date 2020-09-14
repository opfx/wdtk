import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { addWorkspaceDependencies, NodeDependency, NodeDependencyType } from '@wdtk/core';

import { versions } from './../../versions';

import { Schema as InitOptions } from './schema';

const workspaceDependencies: NodeDependency[] = [
  {
    name: '@angular/animations',
    type: NodeDependencyType.Default,
    version: versions.Angular,
  },
  {
    name: '@angular/compiler-cli',
    type: NodeDependencyType.Dev,
    version: versions.Angular,
  },
];
export default function (options: InitOptions): Rule {
  return (host: Tree, ctx: SchematicContext) => {
    return chain([addWorkspaceDependencies(workspaceDependencies)]);
  };
}
