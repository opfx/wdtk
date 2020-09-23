import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { createBuilder, scheduleTargetAndForget, targetFromTargetString } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import * as Path from 'path';
import { Observable } from 'rxjs';
import { of, noop, from } from 'rxjs';
import { catchError, concatMap, map, take, tap } from 'rxjs/operators';

import { tags } from '@wdtk/core/util';

import { getInstalledCypressVersion } from './../../util';

import { Schema as CypressBuilderOptions } from './schema';

// importing via ES6 messes the whole test dependencies
const Cypress = require('cypress');

try {
  require('dotenv').config();
} catch {}

export default createBuilder<JsonObject & CypressBuilderOptions>(execute);

export function execute(opts: CypressBuilderOptions, ctx: BuilderContext): Observable<BuilderOutput> {
  opts.env = opts.env || {};
  if (opts.tsConfig) {
    opts.env.tsConfig = Path.join(ctx.workspaceRoot, opts.tsConfig);
  }
  if (opts.browser) {
    opts.browser = opts.browser.toLowerCase();
  }
  checkBrowserSupport(opts, ctx);

  return (opts.devServerTarget ? startDevServer(opts.devServerTarget, opts.watch, ctx) : of(opts.baseUrl)).pipe(
    concatMap((baseUrl: string) => initCypress(baseUrl, opts)),
    opts.watch ? tap(noop) : take(1),
    catchError((error) => {
      ctx.reportStatus(`Error: ${error.message}`);
      ctx.logger.error(error.message);
      return of({ success: false });
    })
  );
}

/**
 * Initializes the Cypress test runner with the provided configuration.
 * @param baseUrl
 * @param opts
 */
function initCypress(baseUrl: string, opts: CypressBuilderOptions): Observable<BuilderOutput> {
  // cypress expects the folder containing the 'cypress.json'
  const projectFolderPath = Path.dirname(opts.cypressConfig);
  (<any>opts).project = projectFolderPath;
  (<any>opts).configFile = Path.basename(opts.cypressConfig);
  if (baseUrl) {
    (<any>opts).config = { baseUrl: baseUrl };
  }
  (<any>opts).headed = !opts.headless;
  return from(opts.headless ? Cypress.run(opts) : Cypress.open(opts)).pipe(
    map((result: any) => ({
      // `cypress.open` is returning `0` and is not of the same type as `cypress.run`.
      // `cypress.open` is the graphical UI, so it will be obvious to know what wasn't
      // working. Forcing the build to success when `cypress.open` is used.
      success: !result.totalFailed && !result.failures,
    }))
  );
}
/**
 * Compile the application using the webpack builder.
 *
 * @param devServerTarget
 * @param isWatching
 * @param ctx
 */
function startDevServer(devServerTarget: string, isWatching: boolean, ctx: BuilderContext): Observable<string> {
  const overrides = {
    watch: isWatching,
  };

  return scheduleTargetAndForget(ctx, targetFromTargetString(devServerTarget), overrides).pipe(
    map((output) => {
      if (!output.success && !isWatching) {
        throw new Error(`Failed to compile application files.`);
      }
      return output.baseUrl as string;
    })
  );
}

function checkBrowserSupport({ browser }: CypressBuilderOptions, ctx: BuilderContext) {
  if (!browser) {
    return;
  }
  const version = getInstalledCypressVersion();
  if (!version) {
    return;
  }

  const supportedBrowsersByVersion = { 4: ['electron', 'chrome', 'edge', 'chromium'] };

  const supportedBrowsers = supportedBrowsersByVersion[version];

  const isBrowserSupported = supportedBrowsers.some((supportedBrowser) => supportedBrowser === browser);
  if (!isBrowserSupported) {
    ctx.logger.warn(tags.stripIndents`
    You are using a browser that is not supported by cypress v${version}.
    `);
  }
}
