import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { runCLI } from 'jest';
import { Observable } from 'rxjs';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import * as Path from 'path';

import { tags } from '@wdtk/core/util';

import { Schema as JestBuilderOptions } from './schema';

try {
  require('dotenv').config();
} catch (e) {}

if (process.env.NODE_ENV == null || process.env.NODE_ENV == undefined) {
  (process.env as any).NODE_ENV = 'test';
}

export default createBuilder<JsonObject & JestBuilderOptions>(execute);

export function execute(opts: JestBuilderOptions, ctx: BuilderContext): Observable<BuilderOutput> {
  opts.jestConfig = Path.resolve(ctx.workspaceRoot, opts.jestConfig);
  const jestConfig: {
    transform: any;
    globals: any;
    setupFilesAfterEnv: any;
  } = require(opts.jestConfig);

  const transformers = Object.values<string>(jestConfig.transform || {});
  if (transformers.includes('babel-jest') && transformers.includes('ts-jest')) {
    throw new Error(tags.stripIndents`
    Using babel-jest and ts-jest together is not supported.
    See ts-jest documentation for babel integration: https://kulshekhar.github.io/ts-jest/user/config/babelConfig
    `);
  }

  const config: any = {
    _: [],
    config: opts.config,
    coverage: opts.codeCoverage,
    bail: opts.bail,
    ci: opts.ci,
    color: opts.color,
    detectOpenHandles: opts.detectOpenHandles,
    json: opts.json,
    maxWorkers: opts.maxWorkers,
    onlyChanged: opts.onlyChanged,
    outputFile: opts.outputFile,
    passWithNoTests: opts.passWithNoTests,
    runInBand: opts.runInBand,
    showConfig: opts.showConfig,
    silent: opts.silent,
    testLocationInResults: opts.testLocationInResults,
    testNamePattern: opts.testNamePattern,
    testPathPattern: opts.testPathPattern,
    colors: opts.colors,
    verbose: opts.verbose,
    coverageDirectory: opts.coverageDirectory,
    testResultsProcessor: opts.testResultsProcessor,
    updateSnapshot: opts.updateSnapshot,
    useStderr: opts.useStderr,
    watch: opts.watch,
    watchAll: opts.watchAll,
  };

  if (opts.testFile) {
    config._.push(opts.testFile);
  }

  if (opts.findRelatedTests) {
    const parsedTests = opts.findRelatedTests.split(',').map((s) => s.trim());
    config._.push(...parsedTests);
    config.findRelatedTests = true;
  }

  if (opts.clearCache) {
    config.clearCache = true;
  }

  if (opts.reporters && opts.reporters.length > 0) {
    config.reporters = opts.reporters;
  }

  if (opts.coverageReporters && opts.coverageReporters.length > 0) {
    config.coverageReporters = opts.coverageReporters;
  }

  return from(runCLI(config, [opts.jestConfig])).pipe(
    map((results) => {
      return { success: results.results.success };
    })
  );
}
