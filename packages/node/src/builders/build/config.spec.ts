import { BannerPlugin } from 'webpack';

jest.mock('tsconfig-paths-webpack-plugin');

import TsConfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

import { BuildBuilderOptions } from './index';
import { getBuildWebpackConfig } from './config';
import { ExternalDependenciesEnum } from './schema';

describe('getBuildWebpackConfig', () => {
  let input: BuildBuilderOptions;
  beforeEach(() => {
    input = {
      main: 'main.ts',
      outputPath: 'dist',
      tsConfig: 'tsconfig.json',
      externalDependencies: ExternalDependenciesEnum.All,
      fileReplacements: [],
      statsJson: false,
    };
    (<any>TsConfigPathsPlugin).mockImplementation(function MockPathsPlugin() {});
  });

  describe(`unconditionally`, () => {
    it(`should target commonjs`, () => {
      const config = getBuildWebpackConfig(input);

      expect(config.output.libraryTarget).toEqual('commonjs');
    });

    it(`should target node`, () => {
      const config = getBuildWebpackConfig(input);
      expect(config.target).toEqual('node');
    });

    it(`should not polyfill node apis`, () => {
      const config = getBuildWebpackConfig(input);
      expect(config.node).toEqual(false);
    });
  });

  describe(`the optimization option when true`, () => {
    it(`should not minify`, () => {
      const config = getBuildWebpackConfig({
        ...input,
        optimization: true,
      });

      expect(config.optimization.minimize).toEqual(false);
    });

    it(`should not concatenate modules`, () => {
      const config = getBuildWebpackConfig({
        ...input,
        optimization: true,
      });

      expect(config.optimization.concatenateModules).toEqual(false);
    });
  });

  describe(`the externalDependencies option`, () => {
    it(`should change all node_modules to commonjs imports`, () => {
      const config = getBuildWebpackConfig(input);
      const callback = jest.fn();
      config.externals[0](null, '@wdtk/core', callback);
      expect(callback).toHaveBeenCalledWith(null, 'commonjs @wdtk/core');
    });

    it(`should change given module names to commonjs imports but not others`, () => {
      const config = getBuildWebpackConfig({
        ...input,
        externalDependencies: ['module1'],
      });
      const callback = jest.fn();
      config.externals[0](null, 'module1', callback);
      expect(callback).toHaveBeenCalledWith(null, 'commonjs module1');
      config.externals[0](null, '@wdtk/core', callback);
      expect(callback).toHaveBeenCalledWith();
    });

    it(`should not change any modules to commonjs imports`, () => {
      const config = getBuildWebpackConfig({
        ...input,
        externalDependencies: ExternalDependenciesEnum.None,
      });

      expect(config.externals).not.toBeDefined();
    });
  });
});
