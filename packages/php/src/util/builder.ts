import { BuilderContext } from '@angular-devkit/architect';

import { colors } from '@wdtk/core/util';

export function builderWarningsToString(json, ctx: BuilderContext, opts?: { useColors?: boolean }): string {
  const useColors = (opts && opts.useColors) || true;
  const c = (x: string) => (useColors ? colors.reset.cyan(x) : x);
  const y = (x: string) => (useColors ? colors.reset.yellow(x) : x);
  const yb = (x: string) => (useColors ? colors.reset.yellowBright(x) : x);

  const warnings = [...json.warnings];
  if (json.children) {
    warnings.push(...json.children.map((child: any) => child.warnings).reduce((a: string[], b: string[]) => [...a, ...b], []));
  }

  let output = '';
  for (const warning of warnings) {
    if (typeof warning === 'string') {
      output += yb(`Warning: ${warning}\n\n`);
    } else {
      let file = warning.file;
      if (file) {
        file = file.replace(`${ctx.workspaceRoot}/`, '');
        output += c(file);
        if (warning.line) {
          output += ':' + yb(warning.line);
        }
        output += ' - ';
      }
      if (!/^warning/i.test(warning.message)) {
        output += y('Warning: ');
      }
      output += `${warning.message}\n\n`;
    }
  }
  if (output.length) {
    output = `\n${output}`;
  }
  return output;
}

export function builderErrorsToString(json, ctx: BuilderContext, opts?: { useColors?: boolean }): string {
  const useColors = (opts && opts.useColors) || true;

  const c = (x: string) => (useColors ? colors.reset.cyan(x) : x);
  const yb = (x: string) => (useColors ? colors.reset.yellowBright(x) : x);
  const r = (x: string) => (useColors ? colors.reset.redBright(x) : x);

  const errors = [...json.errors];
  if (json.children) {
    errors.push(...json.children.map((child: any) => child.errors).reduce((a: string[], b: string[]) => [...a, ...b], []));
  }

  let output = '';
  for (const error of errors) {
    if (typeof error === 'string') {
      output += r(`Error: ${error}\n\n`);
    } else {
      let file = error.file;
      if (file) {
        file = file.replace(`${ctx.workspaceRoot}/`, '');
        output += c(file);
        if (error.line) {
          output += ':' + yb(error.line);
        }
        output += ' - ';
      }
      if (!/^error/i.test(error.message)) {
        output += r('Error: ');
      }
      output += `${error.message}\n\n`;
    }
  }
  if (output.length) {
    output = '\n' + output;
  }
  return output;
}
