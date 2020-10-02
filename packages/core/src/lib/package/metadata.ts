import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import * as Path from 'path';
import { Logger } from '@wdtk/core/util';
import { PackageManifest, PackageMetadata } from './types';

const ini = require('ini');
const lockfile = require('@yarnpkg/lockfile');
const pacote = require('pacote');

let npmrc: { [key: string]: string };

export async function fetchPackageMetadata(
  name: string,
  logger: Logger,
  options?: { registry?: string; packageManager?: string; verbose?: boolean }
): Promise<PackageMetadata> {
  const { packageManager, verbose, registry } = {
    packageManager: 'yarn',
    registry: undefined,
    verbose: false,
    ...options,
  };
  ensureNpmrc(packageManager, logger, verbose);
  const response = await pacote.packument(name, {
    fullMetadata: true,
    ...npmrc,
    ...(registry ? { registry } : {}),
  });

  // normalize the respose
  const metadata: PackageMetadata = {
    name: response.name,
    tags: {},
    versions: {},
  };
  if (response.versions) {
    for (const [version, manifest] of Object.entries(response.versions)) {
      metadata.versions[version] = normalizeManifest(manifest as { name: string; version: string });
    }
  }
  if (response['dist-tags']) {
    metadata['dist-tags'] = response['dist-tags'];
    for (const [tag, version] of Object.entries(response['dist-tags'])) {
      const manifest = metadata.versions[<string>version];
      if (manifest) {
        metadata.tags[tag] = manifest;
      } else {
        if (options.verbose) {
          logger.warn(`Package ${metadata.name} has invalid version metadata for ${tag}.`);
        }
      }
    }
  }
  return metadata;
}

export async function fetchPackageManifest(
  name: string,
  logger: Logger,
  options?: { registry?: string; packageManager?: string; verbose?: boolean }
): Promise<PackageManifest> {
  const { packageManager, verbose, registry } = {
    packageManager: 'yarn',
    registry: undefined,
    verbose: false,
    ...options,
  };
  ensureNpmrc(packageManager, logger, verbose);
  const response = await pacote.manifest(name, {
    fullMetadata: true,
    ...npmrc,
    ...(registry ? { registry } : {}),
  });

  return normalizeManifest(response);
}

function ensureNpmrc(packageManager: string, logger: Logger, verbose: boolean): void {
  if (npmrc) {
    return;
  }
  try {
    npmrc = readOptions(logger, false, verbose);
  } catch {}

  if (packageManager === 'yarn') {
    try {
      npmrc = { ...npmrc, ...readOptions(logger, true, verbose) };
    } catch {}
  }
}

function normalizeManifest(manifest: { name: string; version: string }): PackageManifest {
  return {
    dependencies: {},
    devDependencies: {},
    peerDependencies: {},
    optionalDependencies: {},
    ...manifest,
  };
}

function readOptions(logger: Logger, yarn = false, showPotentials = false): Record<string, string> {
  const cwd = process.cwd();
  const baseFilename = yarn ? 'yarnrc' : 'npmrc';
  const dotFilename = '.' + baseFilename;

  let globalPrefix: string;
  if (process.env.PREFIX) {
    globalPrefix = process.env.PREFIX;
  } else {
    globalPrefix = Path.dirname(process.execPath);
    if (process.platform !== 'win32') {
      globalPrefix = Path.dirname(globalPrefix);
    }
  }

  const defaultConfigLocations = [
    (!yarn && process.env.NPM_CONFIG_GLOBALCONFIG) || Path.join(globalPrefix, 'etc', baseFilename),
    (!yarn && process.env.NPM_CONFIG_USERCONFIG) || Path.join(homedir(), dotFilename),
  ];

  const projectConfigLocations: string[] = [Path.join(cwd, dotFilename)];
  const root = Path.parse(cwd).root;
  for (let curDir = Path.dirname(cwd); curDir && curDir !== root; curDir = Path.dirname(curDir)) {
    projectConfigLocations.unshift(Path.join(curDir, dotFilename));
  }

  if (showPotentials) {
    logger.info(`Locating potential ${baseFilename} files:`);
  }

  let options: { [key: string]: string } = {};
  for (const location of [...defaultConfigLocations, ...projectConfigLocations]) {
    if (existsSync(location)) {
      if (showPotentials) {
        logger.info(`Trying '${location}'...found.`);
      }

      const data = readFileSync(location, 'utf8');
      options = {
        ...options,
        ...(yarn ? lockfile.parse(data) : ini.parse(data)),
      };

      if (options.cafile) {
        const cafile = Path.resolve(Path.dirname(location), options.cafile);
        delete options.cafile;
        try {
          options.ca = readFileSync(cafile, 'utf8').replace(/\r?\n/, '\\n');
        } catch {}
      }
    } else if (showPotentials) {
      logger.info(`Trying '${location}'...not found.`);
    }
  }

  // Substitute any environment variable references
  for (const key in options) {
    if (typeof options[key] === 'string') {
      options[key] = options[key].replace(/\$\{([^\}]+)\}/, (_, name) => process.env[name] || '');
    }
  }

  return options;
}
