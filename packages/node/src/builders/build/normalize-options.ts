import { statSync } from 'fs';
import * as Path from 'path';
import { normalize } from '@angular-devkit/core';

import { BuildBuilderOptions } from './index';
import { AssetPattern, FileReplacement } from './schema';

export function normalizeOptions(opts: BuildBuilderOptions, root: string, sourceRoot: string): BuildBuilderOptions {
  return {
    ...opts,
    root,
    sourceRoot,
    main: Path.resolve(root, opts.main),
    outputPath: Path.resolve(root, opts.outputPath),
    tsConfig: Path.resolve(root, opts.tsConfig),
    fileReplacements: normalizeFileReplacements(root, opts.fileReplacements),
    assets: normalizeAssets(opts.assets, root, sourceRoot),
    webpackConfig: opts.webpackConfig ? Path.resolve(root, opts.webpackConfig) : opts.webpackConfig,
  };
}
function normalizeAssets(assets: AssetPattern[], root: string, sourceRoot: string): AssetPattern[] {
  return assets.map((asset) => {
    if (typeof asset === 'string') {
      const assetPath = normalize(asset);
      const resolvedAssetPath = Path.resolve(root, assetPath);
      const resolvedSourceRoot = Path.resolve(root, sourceRoot);

      if (!resolvedAssetPath.startsWith(resolvedSourceRoot)) {
        throw new Error(`The ${resolvedAssetPath} asset path must start with the project source root: ${sourceRoot}`);
      }

      const isDir = statSync(resolvedAssetPath).isDirectory();
      const input = isDir ? resolvedAssetPath : Path.dirname(resolvedAssetPath);
      const output = Path.relative(resolvedSourceRoot, Path.resolve(root, input));
      const glob = isDir ? '**/*' : Path.basename(resolvedAssetPath);

      return {
        input,
        output,
        glob,
      };
    } else {
      if (asset.output.startsWith('..')) {
        throw new Error(`An asset cannot be written to a location outside of the output path.`);
      }
      const assetPath = normalize(asset.input);
      const resolvedAssetPath = Path.resolve(root, assetPath);
      return {
        ...asset,
        input: resolvedAssetPath,
        // Remove starting slash to make Webpack place it relative to the output root.
        output: asset.output.replace(/^\//, ''),
      };
    }
  });
}
function normalizeFileReplacements(root: string, replacements: FileReplacement[]): FileReplacement[] {
  return replacements.map((replacement) => ({
    replace: Path.resolve(root, replacement.replace),
    with: Path.resolve(root, replacement.with),
  }));
}
