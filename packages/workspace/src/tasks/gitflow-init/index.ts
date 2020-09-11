import { TaskConfiguration, TaskConfigurationGenerator } from '@angular-devkit/schematics';

export const GitFlowInitTaskName = 'gitflow-init';
export interface GitFlowInitTaskFactoryOptions {
  rootDirectory?: string;
}
export interface GitFlowInitTaskOptions {
  workingDirectory?: string;
}

export class GitFlowInitTask implements TaskConfigurationGenerator<GitFlowInitTaskOptions> {
  private workingDirectory: string;

  constructor(workingDirectory?: string);
  constructor(options: Partial<GitFlowInitTaskOptions>);
  constructor(options?: string | Partial<GitFlowInitTaskOptions>) {
    if (typeof options === 'string') {
      this.workingDirectory = options;
    }
    if (typeof options === 'object') {
      if (options.workingDirectory) {
        this.workingDirectory = options.workingDirectory;
      }
    }
  }

  toConfiguration(): TaskConfiguration<GitFlowInitTaskOptions> {
    return {
      name: GitFlowInitTaskName,
      options: {
        workingDirectory: this.workingDirectory,
      },
    };
  }
}
