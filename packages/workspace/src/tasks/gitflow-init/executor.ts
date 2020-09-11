import * as Path from 'path';
import { SchematicContext, TaskExecutor } from '@angular-devkit/schematics';
import { Observable } from 'rxjs';
import { GitFlowInitTaskName, GitFlowInitTaskOptions, GitFlowInitTaskFactoryOptions } from './index';
export default function (factoryOptions: GitFlowInitTaskFactoryOptions = {}): TaskExecutor<GitFlowInitTaskOptions> {
  const rootDirectory = factoryOptions.rootDirectory || process.cwd();
  return (options: GitFlowInitTaskOptions, ctx: SchematicContext) => {
    const cwd = Path.join(rootDirectory, options.workingDirectory || '');
    return new Observable((obs) => {
      ctx.logger.debug(`Executing '${GitFlowInitTaskName}' task in '${cwd}'.`);
      obs.next();
      obs.complete();
    });
  };
}
