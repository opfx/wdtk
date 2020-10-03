import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { chain, externalSchematic, noop } from '@angular-devkit/schematics';

import { Schema } from './schema';
import { UnitTestRunner } from './schema';

export interface InitOptions extends Schema {}

export default function (opts: InitOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    opts = normalizeOptions(tree, opts);
    return chain([opts.unitTestRunner === 'jest' ? externalSchematic('@wdtk/jest', 'init', opts) : noop()]);
  };
}

function normalizeOptions(tree: Tree, opts: Partial<InitOptions>): InitOptions {
  return {
    ...opts,
  };
}
