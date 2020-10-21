import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { getWorkspaceDefinition } from '@wdtk/core';

import { Observable } from 'rxjs';
import { from } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';

import { runStencil, getStencilArgs, BuildResult } from './../../stencil';

import { Schema } from './schema';

export interface BuildBuilderOptions extends Schema {
  command: string;
}

export default createBuilder<BuildBuilderOptions & JsonObject>(execute);

function execute(opts: BuildBuilderOptions & JsonObject, ctx: BuilderContext): Observable<BuilderOutput> {
  return from(normalizeOptions(opts, ctx)).pipe(
    map((opts) => getStencilArgs(opts)),
    concatMap((args) => {
      return runStencil(args, ctx);
    }),
    map((buildResult: BuildResult) => {
      return buildResult;
    })
  );
}

async function normalizeOptions(opts: BuildBuilderOptions, ctx: BuilderContext): Promise<BuildBuilderOptions> {
  let command = 'build';
  const targetName = ctx.target.target;
  switch (targetName) {
    case 'build':
    case 'serve':
      command = 'build';
      break;
    case 'test':
      (<any>opts).testFlag = '--spec';
      command = 'test';
      break;
    case 'e2e':
      (<any>opts).testFlag = '--e2e';
      command = 'test';
      break;
  }
  if (!opts.config) {
  }
  if (opts.serve) {
    opts.watch = true;
  }

  return { ...opts, command };
}

/*
function executeA(opts: BuildBuilderOptions & JsonObject, ctx: BuilderContext): Observable<BuilderOutput> {
  return from(getProjectRoot(ctx)).pipe(
    map((projectRoot) => {
      return normalizeOptions(opts, projectRoot);
    }),
    map((opts) => getStencilArgs(opts)),
    concatMap((args) => {
      return runStencil(args, ctx);
    }),
    map((buildResult: BuildResult) => {
      return buildResult;
    })
  );
}
*/

async function getProjectRoot(ctx: BuilderContext) {
  const workspace = await getWorkspaceDefinition(ctx.workspaceRoot);
  const project = workspace.projects.get(ctx.target.project);

  if (!project.root) {
  }
  return project.root;
}
