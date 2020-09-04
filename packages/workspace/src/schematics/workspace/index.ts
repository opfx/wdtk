import { strings } from '@angular-devkit/core';
import { apply, branchAndMerge, chain, mergeWith, template, url } from '@angular-devkit/schematics';
import { Rule, SchematicsException, SchematicContext, Tree } from '@angular-devkit/schematics';
import { addPackageJsonDependency, getPackageJsonDependency } from '@wdtk/core/schematics';
import { NodeDependencyType } from '@wdtk/core/schematics';

import { versions } from './../../versions';

import { Schema as WorkspaceOptions } from './schema';
import { version } from 'process';

interface NormalizedOptions extends WorkspaceOptions {}

export default function (options: WorkspaceOptions): Rule {
  if (!options.name) {
    throw new SchematicsException(`Invalid options, 'name' is required.`);
  }
  const opts = normalizeOptions(options);
  return async (host: Tree, ctx: SchematicContext) => {
    const templateSource = apply(url('./files'), [template({ dot: '.', tmpl: '', strings, ...opts })]);
    // return chain([branchAndMerge(chain([mergeWith(templateSource), addDependencies()]))]);
    return chain([mergeWith(templateSource), addDependencies()]);
  };
}

function normalizeOptions(options: WorkspaceOptions): NormalizedOptions {
  return { ...options };
}

function addDependencies(): Rule {
  return (host: Tree, ctx: SchematicContext) => {
    const dependencies = [
      {
        name: '@wdtk/cli',
        type: NodeDependencyType.Dev,
        version: versions.Wdtk,
      },
    ];

    dependencies.forEach((dependency) => {
      addPackageJsonDependency(host, dependency);
    });
  };
}
