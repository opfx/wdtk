import { TaskConfiguration, TaskConfigurationGenerator } from '@angular-devkit/schematics';

export const YarnInitTaskName = 'yarn-init';

export interface YarnInitTaskFactoryOptions {
  rootDirectory?: string;
}

export interface YarnInitTaskOptions {
  workingDirectory?: string;
}

export class YarnInitTask implements TaskConfigurationGenerator<YarnInitTaskOptions> {
  private workingDirectory: string;
  constructor(options?: string | Partial<YarnInitTaskOptions>) {
    if (typeof options === 'string') {
      this.workingDirectory = options;
    }
    if (typeof options === 'object') {
      if (options.workingDirectory) {
        this.workingDirectory = options.workingDirectory;
      }
    }
  }
  toConfiguration(): TaskConfiguration<YarnInitTaskOptions> {
    return {
      name: YarnInitTaskName,
      options: {
        workingDirectory: this.workingDirectory,
      },
    };
  }
}
