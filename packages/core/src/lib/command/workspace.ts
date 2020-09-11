import * as path from 'path';
import { CommandWorkspace } from './types';
import { findUp } from '@wdtk/core/util';
import { config } from 'process';

const knownWorkspaceConfigFiles = {};

export function insideWorkspace(): boolean {
  return getCommandWorkspace() !== null;
}

export function getCommandWorkspace(workspaceFiles: string[] = []): CommandWorkspace {
  const root = process.cwd();
  if (workspaceFiles.length === 0) {
    // if no files were provided search for the usual suspects
    workspaceFiles.push('.wx.json');
    workspaceFiles.push('.angular.json');
    workspaceFiles.push('angular.json');
  }

  let configFile: string;
  let workspaceConfigFile: string;
  workspaceFiles.forEach((file) => {
    if (!configFile) {
      workspaceConfigFile = findUp(file, root);
      if (workspaceConfigFile) {
        configFile = file;
      }
    }
  });

  if (workspaceConfigFile === null) {
    return null;
  }

  return {
    root,
    configFile,
  };
}
