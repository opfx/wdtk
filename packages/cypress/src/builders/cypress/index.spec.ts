import * as devkitArchitect from '@angular-devkit/architect';
import { Architect } from '@angular-devkit/architect';
import { TestingArchitectHost } from '@angular-devkit/architect/testing';
import { schema } from '@angular-devkit/core';
import { JsonObject } from '@angular-devkit/core';

import * as Path from 'path';
import { of } from 'rxjs';

import { MockBuilderContext } from '@wdtk/core/testing';

import { Schema as CypressBuilderOptions } from './schema';
import { execute } from './index';

jest.mock('./../../util/version');
import { getInstalledCypressVersion } from './../../util/version';

const Cypress = require('cypress');
const builderName = '@wdtk/cypress:cypress';
const builderOpts: JsonObject & CypressBuilderOptions = {
  cypressConfig: 'apps/my-app-e2e/cypress.json',
  parallel: false,
  tsConfig: 'apps/my-app-e2e/tsconfig.json',
  devServerTarget: 'my-app:serve',
  headless: true,
  exit: true,
  record: false,
  baseUrl: undefined,
  watch: false,
};

describe('Cypress builder', () => {});
/*
  let architect: Architect;
  let mockCtx: MockBuilderContext;
  let cypressRun: jest.SpyInstance;
  let cypressOpen: jest.SpyInstance;

  let mockGetInstalledCypressVersion: jest.Mock<ReturnType<typeof getInstalledCypressVersion>> = getInstalledCypressVersion as any;

  beforeEach(async () => {
    const registry = new schema.CoreSchemaRegistry();
    registry.addPostTransform(schema.transforms.addUndefinedDefaults);
    const host = new TestingArchitectHost('/root', '/root');
    architect = new Architect(host, registry);
    await host.addBuilderFromPackage(Path.join(__dirname, './../../..'));

    mockCtx = new MockBuilderContext(architect, host);

    (devkitArchitect as any).scheduleTargetAndForget = jest.fn().mockReturnValue(of({ success: true, baseUrl: 'http://localhost:4200' }));

    cypressRun = jest.spyOn(Cypress, 'run');
    cypressOpen = jest.spyOn(Cypress, 'open');
  });

  it('should call `Cypress.open` if headless mode is `false`', async (done) => {
    const opts = {
      ...builderOpts,
      headless: false,
    };
    const run = await architect.scheduleBuilder(builderName, opts);
    run.result.then(async () => {
      await run.stop();
      expect(cypressOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          config: { baseUrl: 'http://localhost:4200' },
        })
      );
      done();
    });
  });

  it('should call `Cypress.run` if headless mode is `true`', async (done) => {
    const run = await architect.scheduleBuilder(builderName, builderOpts);
    run.result.then(async () => {
      await run.stop();
      expect(cypressRun).toHaveBeenCalledWith(
        expect.objectContaining({
          config: { baseUrl: 'http://localhost:4200' },
        })
      );
      done();
    });
  });

  it('should call `Cypress.run` with the provided baseUrl', async (done) => {
    const opts = {
      ...builderOpts,
      devServerTarget: undefined,
      baseUrl: 'http://example.com',
    };
    const run = await architect.scheduleBuilder(builderName, opts);
    run.result.then(async () => {
      expect(cypressRun).toHaveBeenCalledWith(
        expect.objectContaining({
          config: {
            baseUrl: 'http://example.com',
          },
        })
      );
      done();
    });
  });

  it('should call `Cypress.run` with the provided browser', async (done) => {
    const opts = {
      ...builderOpts,
      browser: 'chrome',
    };
    const run = await architect.scheduleBuilder(builderName, opts);
    run.result.then(async () => {
      await run.stop();
      expect(cypressRun).toHaveBeenCalledWith(
        expect.objectContaining({
          browser: 'chrome',
        })
      );
      done();
    });
  });

  it('should call `Cypress.run` without baseUrl when devServerTarget is undefined', async (done) => {
    const opts = {
      ...builderOpts,
      devServerTarget: undefined,
    };
    const run = await architect.scheduleBuilder(builderName, opts);
    run.result.then(async () => {
      await run.stop();
      expect(cypressRun).toHaveBeenCalledWith(
        expect.objectContaining({
          project: Path.dirname(opts.cypressConfig),
        })
      );
      done();
    });
  });
  it('should call `Cypress.run` with provided configuration as project and configFile', async (done) => {
    const opts = {
      ...builderOpts,
      config: 'some/project/my-cypress.json',
    };

    const run = await architect.scheduleBuilder(builderName, opts);
    run.result.then(async () => {
      await run.stop();
      expect(cypressRun).toHaveBeenCalledWith(
        expect.objectContaining({
          project: Path.dirname(opts.cypressConfig),
          configFile: Path.basename(opts.cypressConfig),
        })
      );
      done();
    });
  });

  it('should fail early if the application build fails', async (done) => {
    (devkitArchitect as any).scheduleTargetAndForget = jest.fn().mockReturnValue(of({ success: false }));
    const run = await architect.scheduleBuilder(builderName, builderOpts);
    run.result.then(async (status) => {
      await run.stop();
      expect(status.success).toBe(false);
      done();
    });
  });

  it('should show warnings if the using unsupported browsers v4', async (done) => {
    mockGetInstalledCypressVersion.mockReturnValue(4);
    const result = await execute({ ...builderOpts, browser: 'canary' }, mockCtx).toPromise();
    const warning = 'You are using a browser that is not supported by cypress v4.';
    expect(mockCtx.logger.includes(warning)).toBeTruthy();
    done();
  });
});
*/
