import { strings } from '@angular-devkit/core';
import { apply, chain, mergeWith, template, url } from '@angular-devkit/schematics';
import { Rule, SchematicsException, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodeDependency, NodeDependencyType } from '@wdtk/core';
import { addWorkspaceDependencies } from '@wdtk/core';

import { versions } from './../../versions';

import { Schema as WorkspaceOptions } from './schema';

const workspaceDependencies: NodeDependency[] = [
  {
    name: '@wdtk/cli',
    type: NodeDependencyType.Dev,
    version: versions.Wdtk,
  },
];

interface NormalizedOptions extends WorkspaceOptions {}

export default function (options: WorkspaceOptions): Rule {
  if (!options.name) {
    throw new SchematicsException(`Invalid options, "name" is required.`);
  }
  return (host: Tree, ctx: SchematicContext) => {
    options = normalizeOptions(host, options);
    const templateSource = apply(url('./files'), [template({ dot: '.', tmpl: '', strings, ...options })]);
    return chain([mergeWith(templateSource), addWorkspaceDependencies(workspaceDependencies)]);
  };
}

function normalizeOptions(host: Tree, options: WorkspaceOptions): NormalizedOptions {
  options.name = strings.dasherize(options.name);
  return {
    ...options,
  };
}
