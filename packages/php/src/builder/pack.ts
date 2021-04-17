import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { spawn } from 'child_process';

import { getAutoloadBuilderPath } from '@phptools/autoload';

import { BuildResults, ErrorSeverity } from './types';

export interface PackOptions {
  alias: string;
  baseDir: string;
  exclude?: string;
  include?: string;
  output: string;
  template?: string;
  directories?: string[];
}

export async function pack(opts: PackOptions): Promise<BuildResults> {
  const args = getArguments(opts);

  const outputDir = dirname(opts.output);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  return new Promise<BuildResults>((resolve, reject) => {
    const result: BuildResults = {
      errors: [],
      warnings: [],
    };
    const php = spawn('php', args);
    php.stdout.on('data', (output) => {
      // ignore std out
    });

    php.stderr.on('data', (output) => {
      output = output.toString();
      if (/^warning:/i.test(output)) {
        const message = output.replace(/warning: |\r|\n/gi, (text) => (text === '\n' ? ' ' : ''));
        if (/^template/i.test(message)) {
          return;
        }
        result.warnings.push({
          severity: ErrorSeverity.Warning,
          message,
        });
      } else {
        result.errors.push({
          severity: ErrorSeverity.Error,
          message: `${output}`,
        });
      }
    });

    const handlePhpExit = (code?: number) => {
      resolve(result);
    };
    php.on('exit', handlePhpExit);
    php.on('SIGINT', handlePhpExit);
    php.on('uncaughtException', handlePhpExit);
  });
}

function getArguments(opts: PackOptions): string[] {
  const args = [];
  args.push('-dphar.readonly=false');

  args.push(getAutoloadBuilderPath());

  args.push('--phar');
  args.push('--lint');

  args.push('--alias');
  args.push(opts.alias);

  args.push('--basedir');
  args.push(opts.baseDir);

  args.push('--output');
  args.push(opts.output);

  if (opts.template) {
    args.push('--template');
    args.push(opts.template);
    opts.exclude = opts.template;
  }

  args.push('--include');
  args.push('*.*');

  if (opts.exclude) {
    args.push('--exclude');
    args.push(opts.exclude);
  }

  if (opts.directories) {
    opts.directories.forEach((dir) => {
      args.push(dir);
    });
  }
  return args;
}
