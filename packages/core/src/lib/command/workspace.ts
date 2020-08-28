import * as path from 'path';
import { CommandWorkspace } from './types';
import { findUp } from '@wdtk/core/util';

const knownWorkspaceConfigFiles = {};

export function insideWorkspace(): boolean {
  return getCommandWorkspace() !== null;
}

export function getCommandWorkspace(workspaceFiles: string[] = []): CommandWorkspace {
  const cwd = process.cwd();

  const configFile = 'wx.json';

  const workspaceConfigFile = findUp(configFile, cwd);

  if (workspaceConfigFile === null) {
    return null;
  }
  const root = path.dirname(workspaceConfigFile);
  return {
    root,
  };
}
