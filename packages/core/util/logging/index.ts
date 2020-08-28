import { logging } from '@angular-devkit/core';
import { createConsoleLogger } from '@angular-devkit/core/node';
import { colors, removeColor, supportsColor } from '@wdtk/core/util';

export class Logger extends logging.Logger {
  private static logger: Logger;
  static getLogger() {
    if (!Logger.logger) {
      Logger.logger = createConsoleLogger(false, process.stdout, process.stderr, {
        info: (s) => (supportsColor ? s : removeColor(s)),
        debug: (s) => (supportsColor ? s : removeColor(s)),
        warn: (s) => (supportsColor ? colors.bold.yellow(s) : removeColor(s)),
        error: (s) => (supportsColor ? colors.bold.red(s) : removeColor(s)),
        fatal: (s) => (supportsColor ? colors.bold.red(s) : removeColor(s)),
      });
    }
    return Logger.logger;
  }
}
