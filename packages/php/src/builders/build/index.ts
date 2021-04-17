import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { normalize, join, resolve, virtualFs } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';

import { Observable } from 'rxjs';
import { from, of } from 'rxjs';
import { catchError, concatMap, switchMap, map } from 'rxjs/operators';

import { Spinner } from '@wdtk/core/util';

import { phpBuilder } from './../../builder';

import { builderWarningsToString, builderErrorsToString } from './../../util';

import { copyAssets, normalizeAssetPatterns } from './util/assets';
import { Schema } from './schema';

export interface BuildBuilderOptions extends Schema, JsonObject {
  projectName: string;
  projectRoot: string;
  projectType: string;
  sourceRoot: string;
}

export default createBuilder<BuildBuilderOptions & JsonObject>(execute);

function execute(opts: BuildBuilderOptions, ctx: BuilderContext): Observable<BuilderOutput> {
  const host = new NodeJsSyncHost();
  const workspaceRoot = normalize(ctx.workspaceRoot);
  return from(ctx.getProjectMetadata(ctx.target)).pipe(
    switchMap(async (projectMetadata) => {
      // const sysProjectRoot = getSystemPath(resolve(normalize(ctx.workspaceRoot), normalize((projectMetadata.root as string) ?? '')));

      return { ...(await initialize(opts, ctx, projectMetadata)) };
    }),
    switchMap((opts) => {
      return runBuilder(opts, ctx).pipe(
        concatMap(async (buildEvent) => {
          const { success } = buildEvent;
          if (buildEvent.warnings && (buildEvent.warnings as any).length > 0) {
            ctx.logger.warn(builderWarningsToString(buildEvent, ctx));
          }
          if (!success) {
            if (buildEvent.errors && (buildEvent.errors as any).length > 0) {
              ctx.logger.error(builderErrorsToString(buildEvent, ctx));
            }
            return buildEvent;
          }

          const spinner = new Spinner();
          spinner.enabled = opts.progress !== false;

          // Copy the static assets to the output path
          if (!opts.package && opts.assets?.length) {
            spinner.start(`Copying assets...`);

            try {
              const assetPatterns = normalizeAssetPatterns(
                opts.assets,
                new virtualFs.SyncDelegateHost(host),
                workspaceRoot,
                normalize(opts.projectRoot),
                normalize(opts.sourceRoot)
              );

              await copyAssets(assetPatterns, [opts.outputPath], ctx.workspaceRoot);
              spinner.succeed('Copying assets complete.');
            } catch (e) {
              spinner.fail('Copying assets failed.');
              return { success: false, error: `Failed to copy assets: ${e.message}` };
            }
          }
          return { success: true };
        }),
        map((buildEvent: any) => {
          return {
            ...buildEvent,
          };
        })
      );
    })
  );
}

export function runBuilder(opts: BuildBuilderOptions, ctx: BuilderContext): Observable<BuilderOutput> {
  const getBuilderConfig = (opts: BuildBuilderOptions, ctx: BuilderContext) => {
    const workspacePath = normalize(ctx.workspaceRoot);
    const outputPath = join(workspacePath, opts.outputPath);
    const main = join(workspacePath, opts.main);
    return {
      alias: opts.alias,
      main,
      outputPath,

      package: opts.package,
      progress: opts.progress,
      projectName: opts.projectName,
      projectRoot: opts.projectRoot,
      projectType: opts.projectType,
      sourceRoot: opts.sourceRoot,
    };
  };
  const createBuilder = (opts) => {
    const config = getBuilderConfig(opts, ctx);
    return of(phpBuilder(config));
  };

  return createBuilder(opts).pipe(
    switchMap((builder) => {
      return new Observable<BuilderOutput>((obs) => {
        try {
          // Teardown logic
          // return ()=>{
          //   builder.shutdown();
          // }
          builder
            .run()
            .then((results) => {
              let success = false;
              if (results.errors?.length === 0) {
                success = true;
              }
              obs.next({ ...(results as any), success });
            })
            .catch((e) => {
              obs.next({ success: false, error: e.message });
            })
            .finally(() => {
              obs.complete();
            });
        } catch (e) {
          if (e) {
            ctx.logger.error(`\nAn error occurred during the build:\n${(e && e.stack) || e}`);
          }
          throw e;
        }
      });
    })
  );
}

export function runBuilderMock(opts: BuildBuilderOptions, ctx: BuilderContext): Observable<BuilderOutput> {
  return new Observable<BuilderOutput>((obs) => {
    obs.next({ success: true });
    obs.complete();
  });
}

async function initialize(opts: BuildBuilderOptions, ctx: BuilderContext, projectMetadata): Promise<BuildBuilderOptions> {
  opts = await normalizeOptions(opts, ctx, projectMetadata);

  return {
    ...opts,
  };
}

async function normalizeOptions(opts: BuildBuilderOptions, ctx: BuilderContext, projectMetadata): Promise<BuildBuilderOptions> {
  opts.alias = opts.alias || ctx.target?.project;
  const workspaceRoot = normalize(ctx.workspaceRoot);
  const projectName = ctx.target?.project;
  const projectRoot = resolve(workspaceRoot, normalize((projectMetadata.root as string) || ''));
  const projectType = projectMetadata.projectType as string;
  const sourceRoot = resolve(workspaceRoot, normalize(projectMetadata.sourceRoot as string));

  return { ...opts, projectName, projectRoot, projectType, sourceRoot };
}
