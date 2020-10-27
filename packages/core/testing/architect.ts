import { Architect } from '@angular-devkit/architect';
import { WorkspaceNodeModulesArchitectHost } from '@angular-devkit/architect/node';
import { TestingArchitectHost } from '@angular-devkit/architect/testing';

import { normalize } from '@angular-devkit/core';
import { schema, workspaces } from '@angular-devkit/core';
import { NodeJsAsyncHost } from '@angular-devkit/core/node';

import * as Path from 'path';

export async function createMockArchitect(path: string = __dirname): Promise<Architect> {
  const registry = new schema.CoreSchemaRegistry();
  registry.addPostTransform(schema.transforms.addUndefinedDefaults);

  // check for a test workspace presence
  let workspace;
  let architectHost;
  let workspaceRoot = require.resolve(path);

  workspaceRoot = Path.join(Path.dirname(workspaceRoot), '../test/builders');

  try {
    workspace = await workspaces.readWorkspace(normalize(workspaceRoot), workspaces.createWorkspaceHost(new NodeJsAsyncHost()));
    architectHost = new WorkspaceNodeModulesArchitectHost(workspace, workspaceRoot);
  } catch {
    workspaceRoot = '/root';
  }

  // const mockArchitectHost = new TestingArchitectHost('/root', '/root');
  const mockArchitectHost = new TestingArchitectHost(workspaceRoot, workspaceRoot, architectHost);

  const mockArchitect = new Architect(mockArchitectHost, registry);
  await mockArchitectHost.addBuilderFromPackage(path);

  return mockArchitect;
}
