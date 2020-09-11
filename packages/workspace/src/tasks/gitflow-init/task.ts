import { TaskConfiguration, TaskConfigurationGenerator } from '@angular-devkit/schematics';
import { GitFlowInitTaskName } from './api';

export class GitFlowTask implements TaskConfigurationGenerator<any> {
  constructor() {}
  toConfiguration(): TaskConfiguration<any> {
    return {
      name: GitFlowInitTaskName,
      options: {},
    };
  }
}
