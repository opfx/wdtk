import * as Path from 'path';
import { normalizeOptions } from './normalize-options';
import { BuildBuilderOptions } from './index';
import { normalize } from '@angular-devkit/core';

import * as fs from 'fs';

describe('normalizeBuildOptions', () => {
  let testOptions: BuildBuilderOptions;
  let root: string;
  let sourceRoot: any;

  beforeEach(() => {
    testOptions = {
      main: 'apps/nodeapp/src/main.ts',
      tsConfig: 'apps/nodeapp/tsconfig.app.json',
      outputPath: 'dist/apps/nodeapp',
      fileReplacements: [
        {
          replace: 'apps/environment/environment.ts',
          with: 'apps/environment/environment.prod.ts',
        },
        {
          replace: 'module1.ts',
          with: 'module2.ts',
        },
      ],
      assets: [],
      statsJson: false,
    };
    root = '/root';
    sourceRoot = normalize('apps/nodeapp/src');
  });
  it('should add the root', () => {
    const result = normalizeOptions(testOptions, root, sourceRoot);
    expect(result.root).toEqual('/root');
  });

  it('should resolve main from root', () => {
    const result = normalizeOptions(testOptions, root, sourceRoot);
    expect(result.main).toEqual(Path.resolve('/root/apps/nodeapp/src/main.ts'));
  });

  it('should resolve the output path', () => {
    const result = normalizeOptions(testOptions, root, sourceRoot);
    expect(result.outputPath).toEqual(Path.resolve('/root/dist/apps/nodeapp'));
  });

  it('should resolve the tsConfig path', () => {
    const result = normalizeOptions(testOptions, root, sourceRoot);
    expect(result.tsConfig).toEqual(Path.resolve('/root/apps/nodeapp/tsconfig.app.json'));
  });

  it('should normalize asset patterns', () => {
    spyOn(fs, 'statSync').and.returnValue({
      isDirectory: () => true,
    });
    const result = normalizeOptions(
      <BuildBuilderOptions>{
        ...testOptions,
        root,
        assets: [
          'apps/nodeapp/src/assets',
          {
            input: 'outsideproj',
            output: 'output',
            glob: '**/*',
            ignore: ['**/*.json'],
          },
        ],
      },
      root,
      sourceRoot
    );
    expect(result.assets).toEqual([
      {
        input: Path.resolve('/root/apps/nodeapp/src/assets'),
        output: 'assets',
        glob: '**/*',
      },
      {
        input: Path.resolve('/root/outsideproj'),
        output: 'output',
        glob: '**/*',
        ignore: ['**/*.json'],
      },
    ]);
  });

  it('should resolve the file replacement paths', () => {
    const result = normalizeOptions(testOptions, root, sourceRoot);
    expect(result.fileReplacements).toEqual([
      {
        replace: Path.resolve('/root/apps/environment/environment.ts'),
        with: Path.resolve('/root/apps/environment/environment.prod.ts'),
      },
      {
        replace: Path.resolve('/root/module1.ts'),
        with: Path.resolve('/root/module2.ts'),
      },
    ]);
  });
});
