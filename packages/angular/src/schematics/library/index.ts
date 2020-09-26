import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, externalSchematic, filter, mergeWith, move, noop, schematic, url } from '@angular-devkit/schematics';

import { getWorkspaceDefinition, normalizeProjectName, normalizePackageName, offsetFromRoot } from '@wdtk/core';
import { strings } from '@wdtk/core/util';
import { result } from 'cypress/types/lodash';

import { Schema } from './schema';

export interface LibraryOptions extends Schema {
  projectRoot: string;
  packageName: string;
}

export default function (opts: LibraryOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    opts = await normalizeOptions(tree, opts);
    return chain([
      opts.wrapperApp ? schematic('application', opts) : schematic('init', opts), //
      generateFiles(opts),
    ]);
  };
}

async function normalizeOptions(tree: Tree, opts: Partial<LibraryOptions>): Promise<LibraryOptions> {
  const workspace = await getWorkspaceDefinition(tree);
  const newProjectRoot = workspace.extensions.newProjectRoot;

  opts.name = normalizeProjectName(opts.name);
  const packageName = normalizePackageName(tree, opts.name);

  const projectRoot = opts.directory ? strings.dasherize(opts.directory) : `${newProjectRoot}/${opts.name}`;
  const defaultPrefix: string | undefined = workspace.extensions.defaultPrefix as string;
  // see prefix comment at the top of the file
  if (defaultPrefix && defaultPrefix !== '' && opts.prefix === '#useDefault') {
    opts.prefix = defaultPrefix;
    (<any>opts).defaultPrefix = defaultPrefix;
  }

  return { ...opts, projectRoot, packageName };
}

// templates to be filtered out if a wrapper application was created
function wrapperAppPathFilter(path: string): boolean {
  const toRemoveList = /(karma.conf.js|package.json|test.ts|tsconfig.json|tsconfig.spec.json|tslint.json).template$/;

  return !toRemoveList.test(path);
}
function generateFiles(opts: LibraryOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    if (opts.prefix === '#useDefault') {
      const workspace = await getWorkspaceDefinition(tree);
      opts.prefix = workspace.extensions.defaultPrefix as string;
    }
    return mergeWith(
      apply(url('./files'), [
        opts.wrapperApp ? filter(wrapperAppPathFilter) : noop(),
        applyTemplates({
          ...opts,
          offsetFromRoot: offsetFromRoot(opts.projectRoot),
          dasherize: strings.dasherize,
          camelize: strings.camelize,
        }),
        move(opts.projectRoot),
      ])
    );
  };
}
