import { TaskExecutorFactory } from '@angular-devkit/schematics';

import { GitFlowInitTaskName } from './gitflow-init';

export class WorkspaceTask {
  static readonly GitFlowInit: TaskExecutorFactory<any> = {
    name: GitFlowInitTaskName,
    create: (options) => import('./gitflow-init/executor').then((mod) => mod.default(options)),
  };
}
