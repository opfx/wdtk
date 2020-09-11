import * as Path from 'path';
import { SchematicContext, TaskExecutor } from '@angular-devkit/schematics';
import { Observable } from 'rxjs';

import { YarnInitTaskName, YarnInitTaskOptions, YarnInitTaskFactoryOptions } from './index';

export default function (factoryOptions: YarnInitTaskFactoryOptions = {}): TaskExecutor<YarnInitTaskOptions> {
  const rootDirectory = factoryOptions.rootDirectory || process.cwd();
  return (options: YarnInitTaskOptions, ctx: SchematicContext) => {
    const cwd = Path.join(rootDirectory, options.workingDirectory || '');
    return new Observable((obs) => {
      ctx.logger.debug(`Executing '${YarnInitTaskName}' task in '${cwd}'.`);
      obs.next();
      obs.complete();
    });
  };
}
