import { spawnSync } from 'child_process';
import * as Path from 'path';
import { Observable } from 'rxjs';
import { Rule, SchematicContext, TaskConfiguration, TaskConfigurationGenerator, TaskExecutor, TaskExecutorFactory, Tree } from '@angular-devkit/schematics';

let taskRegistered = false;

export function addYarnSetupTask(options: YarnSetupOptions): Rule {
  return (host: Tree, ctx: SchematicContext) => {
    if (!ctx.engine.workflow) {
      return;
    }
    if (!taskRegistered) {
      const engineHost = (ctx.engine.workflow as any)._engineHost;
      // engineHost.registerTaskExecutor(getYarnSetupTaskFactory({rootDirectory:process.cwd()}));
      engineHost.registerTaskExecutor(getYarnSetupTaskFactory(), { rootDirectory: process.cwd() });
      taskRegistered = true;
    }
    ctx.addTask(new YarnSetupTask(options));
  };
}
interface YarnSetupOptions {
  workingDir: string;
}
interface YarnSetupTaskFactoryOptions {
  rootDirectory?: string;
}
class YarnSetupTask implements TaskConfigurationGenerator<YarnSetupOptions> {
  cwd: string;
  constructor(workingDir?: string);
  constructor(options: Partial<YarnSetupOptions>);
  constructor(options?: string | Partial<YarnSetupOptions>) {
    this.cwd = process.cwd();
    if (typeof options === 'string') {
      this.cwd = options;
    }
    if (typeof options === 'object') {
      if (options.workingDir !== undefined) {
        this.cwd = options.workingDir;
      }
    }
  }
  toConfiguration(): TaskConfiguration<YarnSetupOptions> {
    return {
      name: 'YarnSetup',
      options: { workingDir: this.cwd },
    };
  }
}

function getYarnSetupTaskFactory(): TaskExecutorFactory<YarnSetupTaskFactoryOptions> {
  return {
    name: 'YarnSetup',
    create: (options: YarnSetupTaskFactoryOptions = {}) => {
      const rootDirectory = options.rootDirectory || process.cwd();
      return Promise.resolve<TaskExecutor<YarnSetupOptions>>((options: YarnSetupOptions, ctx: SchematicContext) => {
        const cwd = Path.join(rootDirectory, options.workingDir || '');
        const opts = {
          stdio: [process.stdin, process.stdout, process.stderr],
          shell: true,
          cwd: cwd,
        };
        const commands = [
          { name: 'yarn', args: ['v'] },
          { name: 'yarn', args: ['-v'] },

          // { name: 'yarn', args: ['set', 'version', 'berry'] },
          // { name: 'yarn', args: ['config', 'set', 'nodeLinker', 'node-modules'] },
        ];

        return new Observable((obs) => {
          ctx.logger.info('Configuring yarn');
          ctx.logger.debug(`executing in '${cwd}' directory`);

          try {
            commands.forEach((cmd, index) => {
              // spawnSync is slower but we need to make sure each command completes successfully
              const { status, error } = spawnSync(cmd.name, cmd.args, opts);

              if (status !== 0) {
                throw new Error(`Setting up yarn failed.`);
              }
            });
            obs.next();
            obs.complete();
          } catch (e) {
            obs.error(e);
          }
        });
      });
    },
  };
}
