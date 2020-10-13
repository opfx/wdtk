import { Configuration } from 'webpack';
import { merge as mergeWebpackConfigs } from 'webpack-merge';
import * as nodeExternals from 'webpack-node-externals';

import { getBaseWebpackPartial } from './../../util';

import { BuildBuilderOptions } from './index';

function getBuildWebpackPartial(opts: BuildBuilderOptions): Configuration {
  const config: Configuration = {
    output: {
      libraryTarget: 'commonjs',
    },
    target: 'node',
    node: false,
  };

  if (opts.optimization) {
    config.optimization = {
      minimize: false,
      concatenateModules: false,
    };
  }

  if (opts.externalDependencies === 'all') {
    config.externals = [nodeExternals()];
  }
  if (Array.isArray(opts.externalDependencies)) {
    config.externals = [
      function (ctx, request, callback: Function) {
        if (opts.externalDependencies.includes(request)) {
          // not bundled
          return callback(null, `commonjs ${request}`);
        }
        // bundled
        callback();
      },
    ];
  }
  return config;
}

export function getBuildWebpackConfig(opts: BuildBuilderOptions): Configuration {
  return mergeWebpackConfigs([getBaseWebpackPartial(opts), getBuildWebpackPartial(opts)]);
}
