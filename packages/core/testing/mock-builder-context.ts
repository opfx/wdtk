import { Architect, BuilderContext, BuilderRun, Target } from '@angular-devkit/architect';
import { TestingArchitectHost } from '@angular-devkit/architect/testing';
import { ScheduleOptions } from '@angular-devkit/architect/src/api';
import { JsonObject } from '@angular-devkit/core';

import { TestLogger } from './test-logger';

export class MockBuilderContext implements BuilderContext {
  id: 0;

  builder: any = {};
  analytics = null;

  target: Target = {
    project: null,
    target: null,
  };

  logger = new TestLogger('test');

  constructor(private architect: Architect, private host: TestingArchitectHost) {}

  get currentDirectory() {
    return this.host.currentDirectory;
  }

  get workspaceRoot() {
    return this.host.workspaceRoot;
  }

  async addBuilderFromPackage(path: string): Promise<void> {
    return await this.host.addBuilderFromPackage(path);
  }

  addTarget(target: Target, builderName: string): void {
    return this.host.addTarget(target, builderName);
  }

  addTeardown(teardown: () => Promise<void> | void) {}

  async getBuilderNameForTarget(target: Target): Promise<string> {
    return this.host.getBuilderNameForTarget(target);
  }

  async scheduleTarget(target: Target, overrides?: JsonObject): Promise<BuilderRun> {
    return this.architect.scheduleTarget(target, overrides);
  }

  async scheduleBuilder(name: string, overrides?: JsonObject, scheduleOptions?: ScheduleOptions): Promise<BuilderRun> {
    return this.architect.scheduleBuilder(name, overrides, scheduleOptions);
  }
  async getTargetOptions(target: Target): Promise<JsonObject> {
    return this.host.getOptionsForTarget(target);
  }

  async getProjectMetadata(target: Target | string): Promise<JsonObject | null> {
    return this.host && this.host.getProjectMetadata(target as string);
  }

  validateOptions<T extends JsonObject = JsonObject>(opts: JsonObject, builderName: string): Promise<T> {
    return Promise.resolve<T>(opts as T);
  }

  reportRunning() {}
  reportStatus(status: string) {}
  reportProgress(current: number, total?: number, status?: string) {}
}
