import * as Path from 'path';
import * as ts from 'typescript';
import * as webpack from 'webpack';
import { Configuration, ProgressPlugin, Stats } from 'webpack';

import { LicenseWebpackPlugin } from 'license-webpack-plugin';
import CircularDependencyPlugin = require('circular-dependency-plugin');
import ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
import TsConfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import * as CopyWebpackPlugin from 'copy-webpack-plugin';

import { BuilderOptions } from './types';

export const OUT_FILENAME = 'main.js';

export function getBaseWebpackPartial(opts: BuilderOptions): Configuration {
  const tsConfigContent = ts.readConfigFile(opts.tsConfig, ts.sys.readFile);
  const { options: compilerOptions } = ts.parseJsonConfigFileContent(tsConfigContent, ts.sys, Path.dirname(opts.tsConfig));

  const supportsEs2015 = compilerOptions.target !== ts.ScriptTarget.ES3 && compilerOptions.target !== ts.ScriptTarget.ES5;

  const extensions = ['.ts', '.tsx', '.mjs', '.js', '.jsx'];
  const mainFields = [...(supportsEs2015 ? ['es2015'] : []), 'module', 'main'];

  const config: Configuration = {
    entry: {
      main: [opts.main],
    },
    devtool: opts.sourceMap ? 'source-map' : false,
    mode: opts.optimization ? 'production' : 'development',
    output: {
      path: opts.outputPath,
      filename: OUT_FILENAME,
    },
    module: {
      rules: [
        {
          test: /\.(j|t)sx?$/,
          loader: require.resolve(`ts-loader`),
          exclude: /node_modules/,
          options: {
            configFile: opts.tsConfig,
            transpileOnly: true,
            // https://github.com/TypeStrong/ts-loader/pull/685
            experimentalWatchApi: true,
          },
        },
      ],
    },
    resolve: {
      extensions,
      alias: getAliases(opts),
      plugins: [
        new TsConfigPathsPlugin({
          configFile: opts.tsConfig,
          extensions,
          mainFields,
        }),
      ],
      mainFields,
    },
    performance: {
      hints: false,
    },
    plugins: [
      new ForkTsCheckerWebpackPlugin({
        tsconfig: opts.tsConfig,
        memoryLimit: opts.memoryLimit || ForkTsCheckerWebpackPlugin.DEFAULT_MEMORY_LIMIT,
        workers: opts.maxWorkers || ForkTsCheckerWebpackPlugin.TWO_CPUS_FREE,
        useTypescriptIncrementalApi: false,
      }),
    ],
    watch: opts.watch,
    watchOptions: {
      poll: opts.poll,
    },
    stats: getStatsConfig(opts),
  };

  const extraPlugins: webpack.Plugin[] = [];

  if (opts.progress) {
    extraPlugins.push(new ProgressPlugin());
  }

  if (opts.extractLicenses) {
    extraPlugins.push(
      (new LicenseWebpackPlugin({
        stats: {
          errors: false,
        },
        perChunkOutput: false,
        outputFilename: `3rdpartylicenses.txt`,
      }) as unknown) as webpack.Plugin
    );
  }

  // process asset entries
  if (Array.isArray(opts.assets) && opts.assets.length > 0) {
    const copyWebpackPluginInstance = new CopyWebpackPlugin({
      patterns: opts.assets.map((asset: any) => {
        return {
          context: asset.input,
          // now remove starting slash to make webpack place it from the output root
          to: asset.output,
          from: asset.glob,
          globOptions: {
            ignore: [
              //
              '.gitkeep',
              '**/.DS_Store',
              '**/Thumbs.db',
              ...(asset.ignore ? asset.ignore : []),
            ],
            dot: true,
          },
        };
      }),
    });
    extraPlugins.push(copyWebpackPluginInstance);
  }

  if (opts.showCircularDependencies) {
    extraPlugins.push(
      new CircularDependencyPlugin({
        exclude: /[\\\/]node_modules[\\\/]/,
      })
    );
  }

  config.plugins = [...config.plugins, ...extraPlugins];
  return config;
}

function getAliases(opts: BuilderOptions): { [key: string]: string } {
  return opts.fileReplacements.reduce(
    (aliases, replacement) => ({
      ...aliases,
      [replacement.replace]: replacement.with,
    }),
    {}
  );
}

function getStatsConfig(opts: BuilderOptions): Stats.ToStringOptions {
  return {
    hash: true,
    timings: false,
    cached: false,
    cachedAssets: false,
    modules: false,
    warnings: true,
    errors: true,
    colors: !opts.verbose && !opts.statsJson,
    chunks: !opts.verbose,
    assets: !!opts.verbose,
    chunkOrigins: !!opts.verbose,
    chunkModules: !!opts.verbose,
    children: !!opts.verbose,
    reasons: !!opts.verbose,
    version: !!opts.verbose,
    errorDetails: !!opts.verbose,
    moduleTrace: !!opts.verbose,
    usedExports: !!opts.verbose,
  };
}
