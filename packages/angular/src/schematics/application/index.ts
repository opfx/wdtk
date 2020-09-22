import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { chain, externalSchematic, move, noop, schematic } from '@angular-devkit/schematics';

import { strings } from '@wdtk/core/util';
import { readJsonInTree, getWorkspaceConfigPath, updateWorkspaceDefinition, JsonFile } from '@wdtk/core';

import { Schema } from './schema';

interface ApplicationOptions extends Schema {
  appProjectRoot: string;
  e2eProjectRoot: string;
}
export default function (opts: ApplicationOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    ctx.logger.debug(`Running '@wdtk/angular:application' schematic`);
    opts = normalizeOptions(tree, opts);

    const workspaceJson = readJsonInTree(tree, getWorkspaceConfigPath(tree));
    const appProjectRoot = workspaceJson.newProjectRoot ? `${workspaceJson.newProjectRoot}/${opts.name}` : opts.name;
    const e2eProjectRoot = workspaceJson.newProjectRoot ? `${workspaceJson.newProjectRoot}/${opts.name}/e2e` : `${opts.name}/e2e`;
    return chain([
      schematic('init', { ...opts }),
      externalSchematic('@schematics/angular', 'application', {
        ...opts,

        skipInstall: true,
        skipPackageJson: false,
      }),

      // opts.e2eTestRunner === 'protractor' ? move(e2eProjectRoot, opts.e2eProjectRoot) : removeE2eProject(opts),
      // opts.e2eTestRunner === 'protractor' ? updateE2eProject(opts): noop(),
      // // move(appProjectRoot, opts.appProjectRoot),
      opts.e2eTestRunner === 'protractor' ? noop() : e2eRemoveProject(opts, e2eProjectRoot),
      opts.e2eTestRunner === 'cypress' ? externalSchematic('@wdtk/cypress', 'project', { project: opts.name }) : noop(),
    ]);
  };
}

function normalizeOptions(tree: Tree, opts: ApplicationOptions): ApplicationOptions {
  const appDirectory = opts.directory ? strings.dasherize(opts.directory) : strings.dasherize(opts.name);
  const e2eDirectory = opts.directory ? strings.dasherize(opts.directory) : strings.dasherize(opts.name);
  return {
    ...opts,
    appProjectRoot: appDirectory,
    e2eProjectRoot: e2eDirectory,
  };
}

function e2eRemoveProject(opts: ApplicationOptions, e2eProjectRoot: string): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    ctx.logger.debug(`Removing protractor e2e project`);
    return chain([
      (tree) => {
        if (tree.read(`${e2eProjectRoot}/src/app.e2e-spec.ts`)) {
          tree.delete(`${e2eProjectRoot}/src/app.e2e-spec.ts`);
        }
        if (tree.read(`${e2eProjectRoot}/src/app.po.ts`)) {
          tree.delete(`${e2eProjectRoot}/src/app.po.ts`);
        }
        if (tree.read(`${e2eProjectRoot}/protractor.conf.js`)) {
          tree.delete(`${e2eProjectRoot}/protractor.conf.js`);
        }
        if (tree.read(`${e2eProjectRoot}/tsconfig.json`)) {
          tree.delete(`${e2eProjectRoot}/tsconfig.json`);
        }
      },
      (tree) => {
        return updateWorkspaceDefinition((workspace) => {
          const project = workspace.projects.get(opts.name);
          project.targets.delete('e2e');
        });
      },
    ]);
  };
}

function e2eUpdateProject(opts: ApplicationOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    ctx.logger.debug('Updating existing e2e project');
  };
}
