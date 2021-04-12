import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

import { SpawnOptions } from 'child_process';
import * as File from 'fs';
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
  return from(initialize(opts, ctx)).pipe(
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
    const template = opts.main.replace(`${opts.projectRoot}/`, '');
    const basedir = opts.sourceRoot.replace(`${opts.projectRoot}/`, '');
    // allow phar creation
    args.push('-dphar.readonly=false');

    args.push(opts.phpabPath);

    args.push('--phar');
    args.push('--lint');
    args.push(`--alias`);
    args.push(opts.alias);

    args.push('--var');
    args.push('PHAR_EXIT_THUNK=__HALT_COMPILER();');

    args.push('--basedir');
    args.push(basedir);
    args.push('--output');
    args.push(opts.outputPath);
    args.push('--template');
    args.push(template);

    args.push('--exclude');
    args.push(template);

    args.push(basedir);
    return args;
  }
}

function getPhpSpawnOpts(opts: BuildBuilderOptions): SpawnOptions {
  return { cwd: opts.projectRoot };
}

async function initialize(opts: BuildBuilderOptions, ctx: BuilderContext): Promise<BuildBuilderOptions> {
  opts = await normalizeOptions(opts, ctx);

  let outputDir = opts.outputPath;
  if (opts.package) {
    outputDir = Path.dirname(opts.outputPath);
  }
  if (!File.existsSync(outputDir)) {
    ctx.logger.debug(` ∙ creating output directory '${outputDir}'`);
    File.mkdirSync(outputDir, { recursive: true });
  }

  return opts;
}

async function normalizeOptions(opts: BuildBuilderOptions, ctx: BuilderContext): Promise<BuildBuilderOptions> {
  const projectName = ctx.target.project;
  const projectMetadata = await ctx.getProjectMetadata(ctx.target);
  const phpabPath = Path.resolve(ctx.workspaceRoot, 'node_modules', '@phptools', 'autoload', 'autoload', 'autoload.phar');
  const projectRoot = Path.resolve(ctx.workspaceRoot, (projectMetadata as any).root);
  const sourceRoot = Path.resolve(ctx.workspaceRoot, (projectMetadata as any).sourceRoot);

  opts.alias = opts.alias || projectName;
  opts.outputPath = Path.resolve(ctx.workspaceRoot, opts.outputPath);
  opts.main = Path.resolve(ctx.workspaceRoot, opts.main);

  return { ...opts, projectName, projectRoot, sourceRoot, phpabPath };
}
