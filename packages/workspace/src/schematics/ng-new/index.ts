import { strings } from '@angular-devkit/core';
import { apply, chain, empty, mergeWith, move, schematic, noop } from '@angular-devkit/schematics';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { RepositoryInitializerTask, NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import { GitFlowInitTask, YarnInitTask } from './../../tasks';

import { Schema as WorkspaceOptions } from './../workspace/schema';
import { Schema as NgNewOptions } from './schema';

interface NormalizedOptions extends NgNewOptions {}

export default function (opts: NgNewOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    opts = normalizeOptions(tree, opts);
    const workspaceOptions: WorkspaceOptions = {
      name: opts.name,
    };
    return chain([
      mergeWith(
        apply(empty(), [
          // create the workspace
          schematic('workspace', workspaceOptions),
          move(opts.directory),
          // formatFiles(),
        ])
      ), //
      addTasks(opts),
    ]);
  };
}
function normalizeOptions(tree: Tree, opts: NgNewOptions): NormalizedOptions {
  opts.name = strings.dasherize(opts.name);
  if (!opts.directory) {
    opts.directory = opts.name;
  }
  return {
    ...opts,
  };
}

function addTasks(opts: NormalizedOptions): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    let yarnInitTask;
    if (!opts.skipYarn) {
      yarnInitTask = ctx.addTask(new YarnInitTask(opts.directory));
    }

    let installTask;
    if (!opts.skipInstall) {
      installTask = ctx.addTask(
        new NodePackageInstallTask({
          workingDirectory: opts.directory,
          packageManager: 'yarn',
        }),
        yarnInitTask ? [yarnInitTask] : []
      );
    }

    if (!opts.skipGit) {
      const gitInitTaskDependencies = [];
      yarnInitTask ? gitInitTaskDependencies.push(yarnInitTask) : false;
      installTask ? gitInitTaskDependencies.push(installTask) : false;
      const commit = typeof opts.commit === 'object' ? opts.commit : !!opts.commit ? {} : false;
      const gitInitTask = ctx.addTask(new RepositoryInitializerTask(opts.directory, commit), gitInitTaskDependencies);
      ctx.addTask(new GitFlowInitTask(opts.directory), [gitInitTask]);
    }
  };
}
