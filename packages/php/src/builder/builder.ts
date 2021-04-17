import * as path from 'path';
import { Spinner } from '@wdtk/core/util';

import { BuilderConfig, BuildResults } from './types';
import { pack, PackOptions } from './pack';
import { lint } from './lint';
import { copy } from './copy';
import { generateAutoload } from './autoload';

export function phpBuilder(config: BuilderConfig): Builder {
  return new Builder(config);
}

export class Builder {
  config: BuilderConfig;
  constructor(config: BuilderConfig) {
    this.config = config;
  }
  async run(): Promise<BuildResults> {
    const spinner = new Spinner(`Building...`);
    spinner.enabled = true;

    let results: BuildResults = {
      errors: [],
      warnings: [],
    };

    try {
      spinner.start(`Building...linting`);

      results = await lint(this.config);
      if (results.errors.length) {
        spinner.fail(`Build failed.`);
        // bail out
        return results;
      }

      if (this.config.package) {
        spinner.text = `Building... (packing).`;

        const packArgs = this.normalizePackConfig();
        const packResults = await pack(packArgs);

        results.errors = results.errors.concat(packResults.errors);
        results.warnings = results.warnings.concat(packResults.warnings);

        if (packResults.errors?.length > 0) {
          spinner.fail(`Build failed.`);
          // bail out
          return results;
        }
      } else {
        spinner.text = `Building... (copying files).`;
        const appFilesPattern = {
          glob: '**/*.php',
          input: 'app',
          output: 'pub',
        };
        const otherFilesPattern = {
          glob: '**/*.php',
          ignore: ['app/*.*'],
          input: '',
          output: '',
        };
        await copy([appFilesPattern, otherFilesPattern], this.config.sourceRoot, this.config.outputPath);

        spinner.text = `Building... (generating autoload file).`;
        const autoLoadOpts = {
          output: path.join(this.config.outputPath, `main.php`),
          directories: [this.config.outputPath],
          template: this.config.main,
        };
        // await generateAutoload(autoLoadOpts);
      }

      spinner.succeed(`Build complete.`);
    } catch (e) {
      spinner.fail(`Build failed.`);
      throw e;
    } finally {
      spinner.stop();
    }
    return results;
  }

  private normalizePackConfig(): PackOptions {
    if (!this.config.outputPath) {
      throw new Error(`The 'outputPath' configuration is missing.`);
    }
    const packArgs: PackOptions = {
      alias: this.config.alias || this.config.projectName,
      baseDir: this.config.sourceRoot,

      directories: [this.config.sourceRoot],
      output: this.config.outputPath,
      template: this.config.main,
    };
    return packArgs;
  }
}
