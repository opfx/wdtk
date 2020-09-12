import * as Path from 'path';
import { spawnSync } from 'child_process';
import * as ora from 'ora';

import { SchematicContext, TaskExecutor, UnsuccessfulWorkflowExecution } from '@angular-devkit/schematics';

import { Observable } from 'rxjs';

import { YarnInitTaskName, YarnInitTaskOptions, YarnInitTaskFactoryOptions } from './index';

export default function (factoryOptions: YarnInitTaskFactoryOptions = {}): TaskExecutor<YarnInitTaskOptions> {
  const rootDirectory = factoryOptions.rootDirectory || process.cwd();
  return (options: YarnInitTaskOptions, ctx: SchematicContext) => {
    const cwd = Path.join(rootDirectory, options.workingDirectory || '');

    const spawnOptions = {
      // stdio: [0, 1, 2],
      shell: true,
      cwd: cwd,
    };

    const commands = [
      { name: 'yarn', args: ['set', 'version', 'berry'] },
      { name: 'yarn', args: ['config', 'set', 'nodeLinker', 'node-modules'] },
    ];

    return new Observable((obs) => {
      ctx.logger.debug(`Executing '${YarnInitTaskName}' task in '${cwd}'.`);
      const spinner = ora({
        text: 'Initializing yarn...',
        // Workaround for https://github.com/sindresorhus/ora/issues/136.
        discardStdin: process.platform != 'win32',
        isEnabled: true,
        interval: 10,
      }).start();
      try {
        commands.forEach((cmd) => {
          const { status, error } = spawnSync(cmd.name, cmd.args, spawnOptions);

          if (status !== 0) {
            ctx.logger.debug(error.message);
            throw new Error(error.message);
          }
          spinner.render();
        });
        spinner.succeed('Yarn was initialized successfully.');
        spinner.stop();
        obs.next();
        obs.complete();
      } catch (e) {
        spinner.fail('Failed to initialize yarn.');
        obs.error(new UnsuccessfulWorkflowExecution());
      }
    });
  };
}
