import * as Path from 'path';
import { SchematicContext, TaskExecutor } from '@angular-devkit/schematics';
import { Observable } from 'rxjs';
import { GitFlowInitTaskName, GitFlowInitOptions, GitFlowInitFactoryOptions } from './index';
export default function (factoryOptions: GitFlowInitFactoryOptions = {}): TaskExecutor<GitFlowInitOptions> {
  const rootDirectory = factoryOptions.rootDirectory || process.cwd();
  return (options: GitFlowInitOptions, ctx: SchematicContext) => {
    const cwd = Path.join(rootDirectory, options.workingDirectory || '');
    return new Observable((obs) => {
      ctx.logger.debug(`Executing '${GitFlowInitTaskName}' task in '${cwd}'.`);
      obs.next();
      obs.complete();
    });
  };
}
