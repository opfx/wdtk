import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

import { SpawnOptions } from 'child_process';
import * as Path from 'path';

import { Observable } from 'rxjs';
import { from, of } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';

import { runPhp } from './../../util';
import { Schema } from './schema';

export interface BuildBuilderOptions extends Schema {
  phpabPath: string;
  projectName: string;
  projectRoot: string;
  sourceRoot: string;
}

export default createBuilder<BuildBuilderOptions & JsonObject>(execute);

export function execute(opts: BuildBuilderOptions & JsonObject, ctx: BuilderContext): Observable<BuilderOutput> {
  return from(normalizeOptions(opts, ctx)).pipe(
    map((opts) => {
      return {
        spawnArgs: getPhpSpawnArgs(opts),
        spawnOpts: getPhpSpawnOpts(opts),
      };
    }),
    switchMap(({ spawnArgs, spawnOpts }) => {
      return runPhp(spawnArgs, spawnOpts, ctx);
    }),
    catchError((err) => {
      ctx.logger.error(err);
      return of({ error: `Executing 'build' target failed. Please check above for the error.`, success: false });
    })
  );
}

function getPhpSpawnArgs(opts: BuildBuilderOptions): string[] {
  const args = [];

  if (opts.package) {
    // allow phar creation
    args.push('-d');
    args.push('phar.readonly=false');
  }
  args.push(opts.phpabPath);
  let alias = opts.projectName;
  if (opts.alias) {
    alias = opts.alias;
  }
  args.push('--alias');
  args.push(alias);

  if (opts.package) {
    args.push('--phar');

    args.push('--output');
    args.push(opts.outputPath);
  }

  args.push('--template');
  args.push(opts.main);

  args.push('--exclude');
  args.push(opts.main);

  args.push('--lint');

  args.push(opts.sourceRoot);
  return args;
}

function getPhpSpawnOpts(opts: BuildBuilderOptions): SpawnOptions {
  return { cwd: opts.projectRoot };
}

async function normalizeOptions(opts: BuildBuilderOptions, ctx: BuilderContext): Promise<BuildBuilderOptions> {
  const projectMetadata = await ctx.getProjectMetadata(ctx.target);
  const phpabPath = Path.resolve(ctx.workspaceRoot, 'node_modules', '@phptools', 'autoload', 'autoload', 'autoload.phar');
  const projectRoot = Path.resolve(ctx.workspaceRoot, (projectMetadata as any).root);
  // const sourceRoot = Path.resolve(ctx.workspaceRoot, (projectMetadata as any).sourceRoot);
  const sourceRoot = (projectMetadata as any).sourceRoot;

  opts.outputPath = Path.resolve(ctx.workspaceRoot, opts.outputPath);
  opts.main = Path.resolve(ctx.workspaceRoot, opts.main);

  return { ...opts, projectName: ctx.target.project, projectRoot, sourceRoot, phpabPath };
}
