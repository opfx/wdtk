import * as fs from 'fs';
import * as path from 'path';

import { tags } from '@wdtk/core/util';
import { colors, findUp, SemVer } from '@wdtk/core/util';

import { isWarningEnabled } from './config';

const packageJsonPath = findUp('package.json', __dirname);

const packageJson = require(packageJsonPath);

// Check if we need to profile this CLI run.
if (process.env['WX_CLI_PROFILING']) {
  let profiler: {
    startProfiling: (name?: string, recsamples?: boolean) => void;
    stopProfiling: (name?: string) => any; // tslint:disable-line:no-any
  };
  try {
    profiler = require('v8-profiler-node8'); // tslint:disable-line:no-implicit-dependencies
  } catch (err) {
    throw new Error(
      `Could not require 'v8-profiler-node8'. You must install it separately with ` +
        `'npm install v8-profiler-node8 --no-save'.\n\nOriginal error:\n\n${err}`
    );
  }

  profiler.startProfiling();

  const exitHandler = (options: { cleanup?: boolean; exit?: boolean }) => {
    if (options.cleanup) {
      const cpuProfile = profiler.stopProfiling();
      fs.writeFileSync(
        path.resolve(process.cwd(), process.env.WX_CLI_PROFILING || '') + '.cpuprofile',
        JSON.stringify(cpuProfile)
      );
    }

    if (options.exit) {
      process.exit();
    }
  };

  process.on('exit', () => exitHandler({ cleanup: true }));
  process.on('SIGINT', () => exitHandler({ exit: true }));
  process.on('uncaughtException', () => exitHandler({ exit: true }));
}

(async () => {
  const disableVersionCheckEnv = process.env['WX_DISABLE_VERSION_CHECK'];

  /**
   * Disable CLI version mismatch checks and forces usage of the invoked CLI
   * instead of invoking the local installed version.
   */
  const disableVersionCheck =
    disableVersionCheckEnv !== undefined &&
    disableVersionCheckEnv !== '0' &&
    disableVersionCheckEnv.toLowerCase() !== 'false';

  if (disableVersionCheck) {
    return (await import('./cli')).default;
  }

  let cli;
  try {
    const projectLocalCli = require.resolve('@wdtk/cli', { paths: [process.cwd()] });

    const globalVersion = new SemVer(packageJson['version']);
    let localVersion;
    let shouldWarn = true;

    try {
      localVersion = _fromPackageJson();
      shouldWarn = localVersion !== null && globalVersion.compare(localVersion) > 0;
    } catch (e) {
      console.error(e);
      shouldWarn = true;
    }

    if (shouldWarn && (await isWarningEnabled('versionMismatch'))) {
      const warning = colors.yellow(tags.stripIndents`
      Your global Wdtk CLI version (${globalVersion}) is greater than your local
      version (${localVersion}). The local Wdtk CLI version is used.

      To disable this warning use "wx config -g cli.warnings.versionMismatch false".
      `);

      // ???
      if (process.argv[2] !== 'completion') {
        console.error(warning);
      } else {
        console.error(warning);
        process.exit(1);
      }
    }

    cli = await import(projectLocalCli);
  } catch {
    // if there is an error, resolve could not find the wx cli from a package.json, so import it
    // from path relative to this script which is most likely the globally installed package
    cli = await import('./cli');
  }

  if ('default' in cli) {
    cli = cli['default'];
  }

  return cli;
})()
  .then((cli) => {
    return cli({
      cliArgs: process.argv.slice(2),
    });
  })
  .then((exitCode: number) => {
    process.exit(exitCode);
  })
  .catch((e: Error) => {
    console.error(`Unknown error: ${e.message}`);
    console.error(e.stack);
    process.exit(127);
  });

function _fromPackageJson(cwd = process.cwd()): SemVer | null {
  do {
    const packageJsonPath = path.join(cwd, 'node_modules/@wdtk/cli/package.json');
    if (fs.existsSync(packageJsonPath)) {
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      if (content) {
        const { version } = JSON.parse(content);
        if (version) {
          return new SemVer(version);
        }
      }
    }

    // Check the parent.
    cwd = path.dirname(cwd);
  } while (cwd != path.dirname(cwd));

  return null;
}
