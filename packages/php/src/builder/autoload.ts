import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { spawn } from 'child_process';

import { getAutoloadBuilderPath } from '@phptools/autoload';

import { BuildResults, ErrorSeverity } from './types';

export interface AutoloadOptions {
  ignore?: string[];
  output: string;
  template?: string;
  directories?: string[];
}

export async function generateAutoload(opts: AutoloadOptions): Promise<BuildResults> {
  const args = getArguments(opts);
  return new Promise((resolve) => {
    const errors = [];

    const php = spawn('php', args);

    php.stdout.on('data', (output) => {
      output = output.toString();
      console.log(output);
    });

    php.stderr.on('data', (output) => {
      output = output.toString();
      console.log(output);
    });

    const handlePhpExit = (code?: number) => {
      resolve({ errors });
    };
    php.on('exit', handlePhpExit);
    php.on('SIGINT', handlePhpExit);
    php.on('uncaughtException', handlePhpExit);
  });
}

function getArguments(opts: AutoloadOptions): string[] {
  const args: string[] = [];

  args.push(getAutoloadBuilderPath());

  args.push('--output');
  args.push(opts.output);

  if (opts.template) {
    args.push('--template');
    args.push(opts.template);
  }

  if (opts.directories) {
    opts.directories.forEach((directory) => {
      args.push(directory);
    });
  }
  return args;
}
