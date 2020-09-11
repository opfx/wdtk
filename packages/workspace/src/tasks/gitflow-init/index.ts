import { TaskConfiguration, TaskConfigurationGenerator } from '@angular-devkit/schematics';

export const GitFlowInitTaskName = 'gitflow-init';
export interface GitFlowInitFactoryOptions {
  rootDirectory?: string;
}
export interface GitFlowInitOptions {
  workingDirectory?: string;
}

export class GitFlowInitTask implements TaskConfigurationGenerator<GitFlowInitOptions> {
  private workingDirectory: string;

  constructor(workingDirectory?: string);
  constructor(options: Partial<GitFlowInitOptions>);
  constructor(options?: string | Partial<GitFlowInitOptions>) {
    if (typeof options === 'string') {
      this.workingDirectory = options;
    }
    if (typeof options === 'object') {
      if (options.workingDirectory) {
        this.workingDirectory = options.workingDirectory;
      }
    }
  }

  toConfiguration(): TaskConfiguration<GitFlowInitOptions> {
    return {
      name: GitFlowInitTaskName,
      options: {
        workingDirectory: this.workingDirectory,
      },
    };
  }
}
