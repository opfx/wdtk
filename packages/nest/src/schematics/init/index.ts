import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { chain, externalSchematic } from '@angular-devkit/schematics';

import { NodeDependency, NodeDependencyType } from '@wdtk/core';
import { addWorkspaceDependencies, formatFiles, updateWorkspaceDefinition } from '@wdtk/core';

import { versions } from './../../versions';

import { Schema } from './schema';

export interface InitOptions extends Schema {}

const workspaceDependencies: NodeDependency[] = [
  { name: '@nestjs/common', type: NodeDependencyType.Default, version: versions.NestJs },
  { name: '@nestjs/core', type: NodeDependencyType.Default, version: versions.NestJs },
  { name: '@nestjs/platform-express', type: NodeDependencyType.Default, version: versions.NestJs },
  { name: 'reflect-metadata', type: NodeDependencyType.Default, version: versions.ReflectMetadata },
  { name: 'rxjs', type: NodeDependencyType.Default, version: versions.Rxjs },
  // dev dependencies
  { name: '@nestjs/schematics', type: NodeDependencyType.Dev, version: versions.NestJs },
  { name: '@nestjs/testing', type: NodeDependencyType.Dev, version: versions.NestJs },
];

export default function (opts: InitOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    opts = normalizeOptions(tree, opts);
    return chain([
      externalSchematic('@wdtk/node', 'init', { ...opts, skipInstall: true, skipFormat: true }),
      addWorkspaceDependencies(workspaceDependencies),
      setupWorkspaceDefinition(opts),
      formatFiles(opts),
    ]);
  };
}

function normalizeOptions(tree: Tree, opts: Partial<InitOptions>): InitOptions {
  return {
    ...opts,
  };
}

function setupWorkspaceDefinition(opts: InitOptions): Rule {
  return async (tree: Tree, ctx: SchematicContext) => {
    return updateWorkspaceDefinition((workspace) => {
      if (!workspace.extensions.natures) {
        workspace.extensions.natures = {};
      }
      if (!workspace.extensions.natures['@wdtk/nest']) {
        workspace.extensions.natures['@wdtk/nest'] = { name: 'Nest' };
      }
    });
  };
}
