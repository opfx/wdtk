import { TaskConfiguration, TaskConfigurationGenerator } from '@angular-devkit/schematics';

export const YarnInitTaskName = 'yarn-init';

export interface YarnInitTaskFactoryOptions {
  rootDirectory?: string;
}

export interface YarnInitTaskOptions {
  workingDirectory?: string;
}

export class YarnInitTask implements TaskConfigurationGenerator<YarnInitTaskOptions> {
  toConfiguration(): TaskConfiguration<YarnInitTaskOptions> {
    return {
      name: YarnInitTaskName,
      options: {},
    };
  }
}
