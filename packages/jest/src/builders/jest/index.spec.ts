import { Architect } from '@angular-devkit/architect';
import { TestingArchitectHost } from '@angular-devkit/architect/testing';
import { schema, normalize } from '@angular-devkit/core';
import * as Path from 'path';
import { Schema as JestBuilderOptions } from './schema';

const builderName = '@wdtk/jest:jest';
describe('Jest Builder', () => {
  let architect: Architect;
  let host: TestingArchitectHost;
  let runCLI: jest.Mock<any>;

  beforeEach(async () => {
    jest.resetModules();
    runCLI = jest.fn();
    jest.doMock('jest', () => ({
      runCLI,
    }));

    const registry = new schema.CoreSchemaRegistry();
    registry.addPostTransform(schema.transforms.addUndefinedDefaults);
    host = new TestingArchitectHost('/root', '/root');

    architect = new Architect(host, registry);
    await host.addBuilderFromPackage(Path.join(__dirname, './../../..'));

    runCLI.mockReturnValue(Promise.resolve({ results: { success: true } }));
  });

  describe(`when using stock jest config`, () => {
    beforeEach(() => {
      jest.doMock(
        Path.resolve(host.workspaceRoot, 'jest.config.js'),
        () => ({
          transform: { '^.+\\.[tj]sx?$': 'ts-jest' },
        }),
        { virtual: true }
      );
    });

    it(`should invoke 'jest' with the appropriate options`, async () => {
      const run = await architect.scheduleBuilder(builderName, {
        jestConfig: './jest.config.js',
        tsConfig: './tsconfig.spec.json',
        watch: false,
      });
      const result = await run.result;
      expect(result).toEqual(expect.objectContaining({ success: true }));
      expect(runCLI).toHaveBeenCalledWith({ _: [], testPathPattern: [], watch: false }, [Path.resolve(host.workspaceRoot, 'jest.config.js')]);
    });

    it(`should invoke 'jest' with appropriate options when 'testFile' is specified`, async () => {
      const run = await architect.scheduleBuilder(builderName, {
        testFile: 'some.spec.ts',
        jestConfig: './jest.config.js',
        tsConfig: './tsconfig.spec.json',
        codeCoverage: false,
        runInBand: true,
        testNamePattern: 'should load',
        testPathPattern: ['/test/path'],
        color: false,
        reporters: ['/test/path'],
        verbose: false,
        coverageReporters: ['test'],
        coverageDirectory: '/test/path',
        watch: false,
      });
      const result = await run.result;
      expect(result).toEqual(expect.objectContaining({ success: true }));
      expect(runCLI).toHaveBeenCalledWith(
        {
          _: ['some.spec.ts'],
          coverage: false,
          runInBand: true,
          testNamePattern: 'should load',
          testPathPattern: ['/test/path'],
          color: false,
          reporters: ['/test/path'],
          verbose: false,
          coverageReporters: ['test'],
          coverageDirectory: '/test/path',
          watch: false,
        },
        [Path.resolve(host.workspaceRoot, 'jest.config.js')]
      );
    });
    it(`should invoke 'jest' with appropriate options when 'findRelatedTests' is specified`, async () => {
      const run = await architect.scheduleBuilder(builderName, {
        findRelatedTests: 'file1.ts,file2.ts',
        jestConfig: './jest.config.js',
        tsConfig: './tsconfig.spec.json',
        codeCoverage: false,
        runInBand: true,
        testNamePattern: 'should load',
        watch: false,
      });
      const result = await run.result;
      expect(result).toEqual(expect.objectContaining({ success: true }));
      expect(runCLI).toHaveBeenCalledWith(
        {
          _: ['file1.ts', 'file2.ts'],
          coverage: false,
          findRelatedTests: true,
          runInBand: true,
          testNamePattern: 'should load',
          testPathPattern: [],
          watch: false,
        },
        [Path.resolve(host.workspaceRoot, 'jest.config.js')]
      );
    });

    it(`should invoke 'jest' with appropriate options when other options are specified`, async () => {
      const run = await architect.scheduleBuilder(builderName, {
        jestConfig: './jest.config.js',
        tsConfig: './tsconfig.spec.json',
        codeCoverage: true,
        bail: 1,
        color: false,
        ci: true,
        detectOpenHandles: true,
        json: true,
        maxWorkers: 2,
        onlyChanged: true,
        outputFile: 'abc.txt',
        passWithNoTests: true,
        showConfig: true,
        silent: true,
        testNamePattern: 'test',
        testPathPattern: ['/test/path'],
        colors: false,
        reporters: ['/test/path'],
        verbose: false,
        coverageReporters: ['test'],
        coverageDirectory: '/test/path',
        testResultsProcessor: 'results-processor',
        updateSnapshot: true,
        useStderr: true,
        watch: false,
        watchAll: false,
        testLocationInResults: true,
      });
      const result = await run.result;
      expect(result).toEqual(expect.objectContaining({ success: true }));
      expect(runCLI).toHaveBeenCalledWith(
        {
          _: [],
          coverage: true,
          bail: 1,
          color: false,
          ci: true,
          detectOpenHandles: true,
          json: true,
          maxWorkers: 2,
          onlyChanged: true,
          outputFile: 'abc.txt',
          passWithNoTests: true,
          showConfig: true,
          silent: true,
          testNamePattern: 'test',
          testPathPattern: ['/test/path'],
          colors: false,
          verbose: false,
          reporters: ['/test/path'],
          coverageReporters: ['test'],
          coverageDirectory: '/test/path',
          testResultsProcessor: 'results-processor',
          updateSnapshot: true,
          useStderr: true,
          watch: false,
          watchAll: false,
          testLocationInResults: true,
        },
        [Path.resolve(host.workspaceRoot, 'jest.config.js')]
      );
    });

    it(`should support passing string type for maxWorkers option`, async () => {
      const run = await architect.scheduleBuilder(builderName, {
        jestConfig: './jest.config.js',
        tsConfig: './tsconfig.spec.json',
        maxWorkers: '50%',
      });
      const result = await run.result;
      expect(result).toEqual(expect.objectContaining({ success: true }));
      expect(runCLI).toHaveBeenCalledWith({ _: [], testPathPattern: [], maxWorkers: '50%' }, [Path.resolve(host.workspaceRoot, 'jest.config.js')]);
    });

    it(`should do something`, async () => {});
  });

  describe(`when custom jest config file`, () => {
    beforeAll(() => {
      jest.doMock(
        Path.resolve(host.workspaceRoot, 'jest.config.js'),
        () => ({
          transform: {
            '^.+\\.tsx?$': 'ts-jest',
          },
          globals: { hereToStay: true, 'ts-jest': { diagnostics: false } },
        }),
        { virtual: true }
      );
    });

    // this test is dubious
    it(`should merge the globals property from jest config with the options passed to 'jest`, async () => {
      const run = await architect.scheduleBuilder(builderName, {
        jestConfig: './jest.config.js',
        tsConfig: './tsconfig.spec.json',
      });
      const result = await run.result;
      expect(result).toEqual(expect.objectContaining({ success: true }));
      expect(runCLI).toHaveBeenCalledWith({ _: [], testPathPattern: [] }, [Path.resolve(host.workspaceRoot, 'jest.config.js')]);
    });
  });

  describe(`when using babel-jest`, () => {
    beforeEach(() => {
      jest.doMock(
        Path.resolve(host.workspaceRoot, 'jest.config.js'),
        () => ({
          transform: {
            '^.+\\.jsx?$': 'babel-jest',
          },
        }),
        { virtual: true }
      );
    });

    it(`should invoke 'jest with the appropriate babel-jest options`, async () => {
      const run = await architect.scheduleBuilder(builderName, {
        jestConfig: './jest.config.js',
        tsConfig: './tsconfig.spec.json',
        watch: false,
      });
      const result = await run.result;
      expect(result).toEqual(expect.objectContaining({ success: true }));
      expect(runCLI).toHaveBeenCalledWith({ _: [], testPathPattern: [], watch: false }, [Path.resolve(host.workspaceRoot, 'jest.config.js')]);
    });
  });

  describe(`when the user tries to use both babel-jest and ts-jest`, () => {
    beforeEach(() => {
      jest.doMock(
        Path.resolve(host.workspaceRoot, 'jest.config.js'),
        () => ({
          transform: {
            '^.+\\.tsx?$': 'ts-jest',
            '^.+\\.jsx?$': 'babel-jest',
          },
        }),
        { virtual: true }
      );
    });

    it(`should throw an error`, async () => {
      const run = await architect.scheduleBuilder(builderName, {
        jestConfig: './jest.config.js',
        tsConfig: './tsconfig.spec.json',
        watch: false,
      });
      await expect(run.result).rejects.toThrow(/Using babel-jest and ts-jest together is not supported/);
    });
  });
});
