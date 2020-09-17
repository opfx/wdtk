import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { chain, externalSchematic } from '@angular-devkit/schematics';
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
    name: '@angular/common',
    type: NodeDependencyType.Default,
    version: versions.Angular,
  },
  {
    name: '@angular/compiler',
    type: NodeDependencyType.Default,
    version: versions.Angular,
  },
  {
    name: '@angular/core',
    type: NodeDependencyType.Default,
    version: versions.Angular,
  },
  {
    name: '@angular/forms',
    type: NodeDependencyType.Default,
    version: versions.Angular,
  },
  {
    name: '@angular/platform-browser',
    type: NodeDependencyType.Default,
    version: versions.Angular,
  },
  {
    name: '@angular/platform-browser-dynamic',
    type: NodeDependencyType.Default,
    version: versions.Angular,
  },
  {
    name: '@angular/router',
    type: NodeDependencyType.Default,
    version: versions.Angular,
  },
  {
    name: 'rxjs',
    type: NodeDependencyType.Default,
    version: versions.Rxjs,
  },
  {
    name: 'zone.js',
    type: NodeDependencyType.Default,
    version: versions.ZoneJs,
  },
  // dev dependencies
  {
    name: '@angular/cli',
    type: NodeDependencyType.Dev,
    version: versions.Angular,
  },
];
export default function (options: InitOptions): Rule {
  return (host: Tree, ctx: SchematicContext) => {
    return chain([
      externalSchematic('@wdtk/workspace', 'typescript', { skipInstall: true }), //
      addWorkspaceDependencies(workspaceDependencies),
    ]);
  };
}
