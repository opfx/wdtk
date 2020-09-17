import { join, normalize } from '@angular-devkit/core';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, applyTemplates, chain, mergeWith, url } from '@angular-devkit/schematics';

import { getWorkspaceConfigPath, updateWorkspaceDefinition } from '@wdtk/core';

import { Schema as ProjectOptions } from './schema';

export default function (options: ProjectOptions): Rule {
  return (host: Tree, ctx: SchematicContext) => {
    options = normalizeOptions(host, options);
    return chain([
      setupWorkspaceDefinition(options), //
      generateFiles(options), //
    ]);
  };
}

function normalizeOptions(host: Tree, options: ProjectOptions): ProjectOptions {
  return {
    ...options,
  };
}

function generateFiles(options: ProjectOptions): Rule {
  return (host: Tree, ctx: SchematicContext) => {
    return mergeWith(apply(url('./files'), [applyTemplates({ dot: '.', ...options })]));
  };
}

function setupWorkspaceDefinition(options: ProjectOptions): Rule {
  return (host: Tree, ctx: SchematicContext) => {
    const target: any = {
      name: 'e2e',
      builder: '@wdtk/cypress',
      options: {
        config: join(normalize(options.project)),
        devServerTarget: `${options.project}:serve`,
      },
      configurations: {
        production: {
          devServerTarget: `${options.project}:serve:production`,
        },
      },
    };
    return updateWorkspaceDefinition((workspace) => {
      const project = workspace.projects.get(options.project);

      project.targets.add(target);
    });
  };
}
