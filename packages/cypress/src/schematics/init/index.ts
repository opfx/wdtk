import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { chain } from '@angular-devkit/schematics';
import { addWorkspaceDependencies, NodeDependency, NodeDependencyType } from '@wdtk/core';

import { versions } from './../../versions';

import { Schema as InitOptions } from './schema';

const workspaceDependencies: NodeDependency[] = [
  // dev dependencies
  {
    name: '@wdtk/cypress',
    type: NodeDependencyType.Dev,
    version: versions.Wdtk,
  },
  {
    name: 'cypress',
    type: NodeDependencyType.Dev,
    version: versions.Cypress,
  },
];

export default function (options: InitOptions): Rule {
  return (host: Tree, ctx: SchematicContext) => {
    return chain([addWorkspaceDependencies(workspaceDependencies)]);
  };
}
