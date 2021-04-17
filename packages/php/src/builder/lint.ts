import { join } from 'path';
import { spawnSync } from 'child_process';
import { globAsync } from './../util';

import { BuildError, BuildResults, ErrorSeverity } from './types';

const regexpLineMatch = /on line ([0-9]+)/;

export interface LintOptions {
  sourceRoot: string;
  ignore?: string[];
}

const defaultIgnore = [];
export async function lint(opts: LintOptions): Promise<BuildResults> {
  const cwd = opts.sourceRoot;
  const sources = await globAsync('**/*.php', {
    cwd,
    dot: true,
    nodir: true,
    ignore: opts.ignore ? defaultIgnore.concat(opts.ignore) : defaultIgnore,
    follow: false,
  });

  const warnings = [];
  const errors = [];

  sources
    .map((source) => join(opts.sourceRoot, source))
    .forEach((source) => {
      const php = spawnSync('php', ['-l', source]);
      if (php.status === 1) {
        throw new Error(`Failed to execute php: ${php.stdout}`);
      }
      const output = php.stdout.toString();

      const errorsOrWarnings = parseLintOutput(source, output);
      errorsOrWarnings.forEach((errorOrWarning) => {
        if (errorOrWarning.severity === ErrorSeverity.Error) {
          errors.push(errorOrWarning);
        } else {
          warnings.push(errorOrWarning);
        }
      });
    });

  return {
    errors,
    warnings,
  };
}

function parseLintOutput(file: string, output: string): BuildError[] {
  return output
    .split('\n')
    .filter((row) => row.length > 0)
    .filter((row) => !/^no/i.test(row))
    .filter((row) => !/^errors parsing/i.test(row))
    .map((row) => {
      const severity = /error:/i.test(row) ? ErrorSeverity.Error : ErrorSeverity.Warning;
      const matchLine = row.match(regexpLineMatch);
      const line = matchLine[1];
      const message = row.replace(` in ${file} on line ${line}`, '');
      return {
        severity,
        file,
        line,
        message,
      };
    });
}
