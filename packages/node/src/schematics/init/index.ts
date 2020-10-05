import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { chain, externalSchematic, noop } from '@angular-devkit/schematics';
import { addWorkspaceDependencies, formatFiles } from '@wdtk/core';
import { NodeDependency, NodeDependencyType } from '@wdtk/core';

import { Schema } from './schema';
import { UnitTestRunner } from './schema';
import { versions } from './../../versions';

export const workspaceDependencies: NodeDependency[] = [
  // dev dependencies
  { name: '@wdtk/node', type: NodeDependencyType.Dev, version: versions.Wdtk },
];

export interface InitOptions extends Schema {}

export default function (opts: InitOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    opts = await normalizeOptions(tree, opts);
    return chain([
      opts.unitTestRunner === UnitTestRunner.Jest ? externalSchematic('@wdtk/jest', 'init', opts) : noop(),
      addDependencies(opts),
      formatFiles(opts),
    ]);
  };
}

function addDependencies(opts: InitOptions): Rule {
  return addWorkspaceDependencies(workspaceDependencies);
}

async function normalizeOptions(tree: Tree, opts: InitOptions): Promise<InitOptions> {
  return {
    ...opts,
  };
}
