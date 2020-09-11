import { TaskExecutorFactory } from '@angular-devkit/schematics';

import { GitFlowInitTaskName, GitFlowInitTaskFactoryOptions } from './gitflow-init';
import { YarnInitTaskName, YarnInitTaskFactoryOptions } from './yarn-init';

export class WorkspaceTask {
  static readonly GitFlowInit: TaskExecutorFactory<GitFlowInitTaskFactoryOptions> = {
    name: GitFlowInitTaskName,
    create: (options) => import('./gitflow-init/executor').then((mod) => mod.default(options)),
  };

  static readonly YarnInit: TaskExecutorFactory<YarnInitTaskFactoryOptions>={
    name:YarnInitTaskName,
    create:(options) => import('./yarn-init/executor').then((mod)=>mod.default(options));
  };
}
