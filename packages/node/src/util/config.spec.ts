import { normalize, getSystemPath } from '@angular-devkit/core';
import * as ts from 'typescript';

jest.mock('tsconfig-paths-webpack-plugin');

import { LicenseWebpackPlugin } from 'license-webpack-plugin';
import CircularDependencyPlugin = require('circular-dependency-plugin');
import ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
import TsConfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import * as CopyWebpackPlugin from 'copy-webpack-plugin';

import { ProgressPlugin } from 'webpack';

import { getBaseWebpackPartial } from './config';
import { BuilderOptions } from './types';

describe(`getBaseWebpackPartial`, () => {
  let input: BuilderOptions;
  beforeEach(() => {
    input = {
      main: 'main.ts',
      outputPath: 'dist',
      tsConfig: 'tsconfig.json',
      fileReplacements: [],
      root: getSystemPath(normalize('/root')),
      statsJson: false,
    };
    (<any>TsConfigPathsPlugin).mockImplementation(function MockPathsPlugin() {});
  });

  describe(`unconditional options`, () => {
    it(`should have output filename`, () => {
      const config = getBaseWebpackPartial(input);
      expect(config.output.filename).toEqual('main.js');
    });

    it(`should have output path`, () => {
      const config = getBaseWebpackPartial(input);
      expect(config.output.path).toEqual('dist');
    });

    it(`should have a rule for typescript`, () => {
      const config = getBaseWebpackPartial(input);
      const typescriptRule = config.module.rules.find((rule) => (rule.test as RegExp).test('app/main.ts'));
      expect(typescriptRule).toBeTruthy();
      expect(typescriptRule.loader).toContain('ts-loader');
    });

    it(`should split typescript type checking into a separate workers`, () => {
      const config = getBaseWebpackPartial(input);
      const typeCheckerPlugin = config.plugins.find((plugin) => plugin instanceof ForkTsCheckerWebpackPlugin) as ForkTsCheckerWebpackPlugin;
      expect(typeCheckerPlugin).toBeTruthy();
    });

    it(`should disable performance hints`, () => {
      const config = getBaseWebpackPartial(input);
      expect(config.performance).toEqual({
        hints: false,
      });
    });

    it(`should resolve ts, tsx, mjs, js, and jsx`, () => {
      const config = getBaseWebpackPartial(input);
      expect(config.resolve.extensions).toEqual(['.ts', '.tsx', '.mjs', '.js', '.jsx']);
    });

    it(`should include module and main in mainFields`, () => {
      spyOn(ts, 'parseJsonConfigFileContent').and.returnValue({
        options: {
          target: 'es5',
        },
      });

      const result = getBaseWebpackPartial(input);
      expect(result.resolve.mainFields).toContain('module');
      expect(result.resolve.mainFields).toContain('main');
    });

    it(`should configure stats`, () => {
      const result = getBaseWebpackPartial(input);

      expect(result.stats).toEqual(
        expect.objectContaining({
          hash: true,
          timings: false,
          cached: false,
          cachedAssets: false,
          modules: false,
          warnings: true,
          errors: true,
        })
      );
    });
  });

  describe(`the main option`, () => {
    it(`should set the correct entry options`, () => {
      const config = getBaseWebpackPartial(input);

      expect(config.entry).toEqual({
        main: ['main.ts'],
      });
    });
  });

  describe(`the output option`, () => {
    it(`should set the correct output options`, () => {
      const config = getBaseWebpackPartial(input);
      expect(config.output.path).toEqual('dist');
    });
  });

  describe(`the tsConfig option`, () => {
    it(`should set the correct typescript rule`, () => {
      const config = getBaseWebpackPartial(input);

      expect(config.module.rules.find((rule) => rule.loader.toString().includes('ts-loader')).options).toEqual({
        configFile: 'tsconfig.json',
        transpileOnly: true,
        experimentalWatchApi: true,
      });
    });

    it(`should set the correct options for the type checker plugin`, () => {
      const config = getBaseWebpackPartial(input);

      const typeCheckerPlugin = config.plugins.find((plugin) => plugin instanceof ForkTsCheckerWebpackPlugin) as ForkTsCheckerWebpackPlugin;
      expect(typeCheckerPlugin.options.tsconfig).toBe('tsconfig.json');
    });

    it(`should add the TsConfigPathsPlugin for resolving`, () => {
      spyOn(ts, 'parseJsonConfigFileContent').and.returnValue({
        options: {
          paths: {
            '@npmScope/libraryName': ['libs/libraryName/src/index.ts'],
          },
        },
      });
      const config = getBaseWebpackPartial(input);
      expect(config.resolve.plugins.some((plugin) => plugin instanceof TsConfigPathsPlugin)).toEqual(true);
    });

    it(`should include es2015 in mainFields if typescript is set es2015`, () => {
      spyOn(ts, 'parseJsonConfigFileContent').and.returnValue({
        options: {
          target: 'es2015',
        },
      });

      const config = getBaseWebpackPartial(input);
      expect(config.resolve.mainFields).toContain('es2015');
    });
  });

  describe(`the file replacements option`, () => {
    it(`should set aliases`, () => {
      spyOn(ts, 'parseJsonConfigFileContent').and.returnValue({
        options: {},
      });

      const config = getBaseWebpackPartial({
        ...input,
        fileReplacements: [
          {
            replace: 'environments/environment.ts',
            with: 'environments/environment.prod.ts',
          },
        ],
      });

      expect(config.resolve.alias).toEqual({
        'environments/environment.ts': 'environments/environment.prod.ts',
      });
    });
  });

  describe(`the watch option`, () => {
    it(`should enable file watching`, () => {
      const config = getBaseWebpackPartial({
        ...input,
        watch: true,
      });
      expect(config.watch).toEqual(true);
    });
  });

  describe(`the poll option`, () => {
    it(`should determine the polling rate`, () => {
      const config = getBaseWebpackPartial({
        ...input,
        poll: 1000,
      });
      expect(config.watchOptions.poll).toEqual(1000);
    });
  });

  describe(`the source map option`, () => {
    it(`should enable source-map devtool`, () => {
      const config = getBaseWebpackPartial({
        ...input,
        sourceMap: true,
      });

      expect(config.devtool).toEqual('source-map');
    });

    it(`should disable source-map devtool`, () => {
      const config = getBaseWebpackPartial({
        ...input,
        sourceMap: false,
      });

      expect(config.devtool).toEqual(false);
    });
  });

  describe(`the optimization option`, () => {
    describe(`by default`, () => {
      it('should set the mode to development', () => {
        const config = getBaseWebpackPartial(input);

        expect(config.mode).toEqual('development');
      });
    });

    describe(`when true`, () => {
      it('should set the mode to production', () => {
        const config = getBaseWebpackPartial({
          ...input,
          optimization: true,
        });

        expect(config.mode).toEqual('production');
      });
    });
  });

  describe(`the max workers option`, () => {
    it(`should set the maximum workers for the type checker`, () => {
      const config = getBaseWebpackPartial({
        ...input,
        maxWorkers: 1,
      });

      const typeCheckerPlugin = config.plugins.find((plugin) => plugin instanceof ForkTsCheckerWebpackPlugin) as ForkTsCheckerWebpackPlugin;
      expect(typeCheckerPlugin.options.workers).toEqual(1);
    });
  });

  describe(`the memory limit option`, () => {
    it(`should set the memory limit for the type checker`, () => {
      const config = getBaseWebpackPartial({
        ...input,
        memoryLimit: 512,
      });

      const typeCheckerPlugin = config.plugins.find((plugin) => plugin instanceof ForkTsCheckerWebpackPlugin) as ForkTsCheckerWebpackPlugin;
      expect(typeCheckerPlugin.options.memoryLimit).toEqual(512);
    });
  });

  describe(`the assets option`, () => {
    it(`should add a copy-webpack-plugin`, () => {
      const config = getBaseWebpackPartial({
        ...input,
        assets: [
          {
            input: 'assets',
            glob: '**/*',
            output: 'assets',
          },
          {
            input: '',
            glob: 'file.txt',
            output: '',
          },
        ],
      });

      expect(config.plugins.filter((plugin) => plugin instanceof CopyWebpackPlugin)).toHaveLength(1);
    });

    it(`should not add a copy-webpack-plugin if the assets option is empty`, () => {
      const config = getBaseWebpackPartial({
        ...input,
        assets: [],
      });

      expect(config.plugins.filter((plugin) => plugin instanceof CopyWebpackPlugin)).toHaveLength(0);
    });
  });

  describe(`the circular dependencies option`, () => {
    it(`should show warnings for circular dependencies`, () => {
      const config = getBaseWebpackPartial({
        ...input,
        showCircularDependencies: true,
      });

      expect(config.plugins.find((plugin) => plugin instanceof CircularDependencyPlugin)).toBeTruthy();
    });

    it(`should exclude node modules`, () => {
      const config = getBaseWebpackPartial({
        ...input,
        showCircularDependencies: true,
      });

      const circularDependencyPlugin: CircularDependencyPlugin = config.plugins.find((plugin) => plugin instanceof CircularDependencyPlugin);
      expect(circularDependencyPlugin.options.exclude).toEqual(/[\\\/]node_modules[\\\/]/);
    });
  });

  describe(`the extract licenses option`, () => {
    it(`should extract licenses to a separate file`, () => {
      const config = getBaseWebpackPartial({
        ...input,
        extractLicenses: true,
      });

      const licensePlugin = config.plugins.find((plugin) => plugin instanceof LicenseWebpackPlugin);

      expect(licensePlugin).toBeTruthy();
    });
  });

  describe(`the progress option`, () => {
    it(`should show build progress`, () => {
      const config = getBaseWebpackPartial({
        ...input,
        progress: true,
      });

      expect(config.plugins.find((plugin) => plugin instanceof ProgressPlugin)).toBeTruthy();
    });
  });

  describe(`the verbose option`, () => {
    describe(`when false`, () => {
      it(`should configure stats to be not verbose`, () => {
        const result = getBaseWebpackPartial(input);

        expect(result.stats).toEqual(
          expect.objectContaining({
            colors: true,
            chunks: true,
            assets: false,
            chunkOrigins: false,
            chunkModules: false,
            children: false,
            reasons: false,
            version: false,
            errorDetails: false,
            moduleTrace: false,
            usedExports: false,
          })
        );
      });
    });

    describe(`when true`, () => {
      it(`should configure stats to be verbose`, () => {
        input.verbose = true;
        const result = getBaseWebpackPartial(input);

        expect(result.stats).toEqual(
          expect.objectContaining({
            colors: false,
            chunks: false,
            assets: true,
            chunkOrigins: true,
            chunkModules: true,
            children: true,
            reasons: true,
            version: true,
            errorDetails: true,
            moduleTrace: true,
            usedExports: true,
          })
        );
      });
    });
  });
});
