import { strings } from '@angular-devkit/core';
import { apply, chain, empty, mergeWith, move, schematic, noop } from '@angular-devkit/schematics';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { RepositoryInitializerTask } from '@angular-devkit/schematics/tasks';
import { formatFiles } from '@wdtk/core/schematics';
import { GitFlowInitTask, YarnInitTask } from './../../tasks';

import { Schema as WorkspaceOptions } from './../workspace/schema';
import { Schema as NgNewOptions } from './schema';

interface NormalizedOptions extends NgNewOptions {}

export default function (options: NgNewOptions): Rule {
  return (host: Tree, ctx: SchematicContext) => {
    options = normalizeOptions(host, options);
    const workspaceOptions: WorkspaceOptions = {
      name: options.name,
    };
    return chain([
      mergeWith(
        apply(empty(), [
          // create the workspace
          schematic('workspace', workspaceOptions),
          move(options.directory),
          formatFiles(),
        ])
      ), //
      addTasks(options),
    ]);
  };
}
function normalizeOptions(host: Tree, options: NgNewOptions): NormalizedOptions {
  options.name = strings.dasherize(options.name);
  if (!options.directory) {
    options.directory = options.name;
  }
  return {
    ...options,
  };
}

function addTasks(options: NormalizedOptions): Rule {
  return (host: Tree, ctx: SchematicContext) => {
    let yarnInitTask;
    if (!options.skipYarn) {
      yarnInitTask = ctx.addTask(new YarnInitTask(options.directory));
    }
    if (!options.skipGit) {
      const commit = typeof options.commit === 'object' ? options.commit : !!options.commit ? {} : false;
      const gitInitTask = ctx.addTask(new RepositoryInitializerTask(options.directory, commit), yarnInitTask ? [yarnInitTask] : []);
      ctx.addTask(new GitFlowInitTask(options.directory), [gitInitTask]);
    }
  };
}
