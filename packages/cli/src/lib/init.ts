import { findUp, SemVer } from '@wdtk/core/util';

const packageJsonPath = findUp('package.json', __dirname);

const packageJson = require(packageJsonPath);

(async () => {
  let cli;
  try {
    const globalVersion = new SemVer(packageJson['version']);
    const t = globalVersion;
    throw new Error('temporary');
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
