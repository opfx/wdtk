import * as Path from 'path';
import { SpawnOptions } from 'child_process';
import { spawn } from 'child_process';
import * as ora from 'ora';

import { SchematicContext, TaskExecutor, UnsuccessfulWorkflowExecution } from '@angular-devkit/schematics';
import { Observable } from 'rxjs';
import { GitFlowInitTaskName, GitFlowInitTaskOptions, GitFlowInitTaskFactoryOptions } from './index';

export default function (factoryOptions: GitFlowInitTaskFactoryOptions = {}): TaskExecutor<GitFlowInitTaskOptions> {
  const rootDirectory = factoryOptions.rootDirectory || process.cwd();

  return (options: GitFlowInitTaskOptions, ctx: SchematicContext) => {
    const cwd = Path.join(rootDirectory, options.workingDirectory || '');

    const spawnOptions: SpawnOptions = {
      stdio: 'pipe',
      shell: true,
      cwd: cwd,
    };
    const args = ['flow', 'init', '-d'];

    return new Observable((obs) => {
      const spinner = ora({
        text: 'Initializing git flow...',
        discardStdin: process.platform !== 'win32',
      }).start();
      spawn('git', args, spawnOptions).on('close', (code) => {
        if (code === 0) {
          spinner.succeed('Git flow was initialized successfully.');
          spinner.stop();
          obs.next();
          obs.complete();
        } else {
          spinner.fail('Failed to initialize Git flow.');
          obs.error(new UnsuccessfulWorkflowExecution());
        }
      });
    });
  };
}
