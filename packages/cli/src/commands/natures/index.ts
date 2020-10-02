import * as Path from 'path';
import { intersects, prerelease, rcompare, satisfies, valid, validRange } from 'semver';

import { NodePackageDoesNotSupportSchematics } from '@angular-devkit/schematics/tools';

import { Arguments, SchematicCommand, RunSchematicOptions } from '@wdtk/core';
import { JsonObject, PackageManifest } from '@wdtk/core';
import { fetchPackageManifest, fetchPackageMetadata, getPackageManager, installPackage, installTempPackage } from '@wdtk/core';

import { tags } from '@wdtk/core/util';

import { Schema as NaturesCommandOptions } from './schema';
import { Operation } from './schema';

const npa = require('npm-package-arg');

export class NaturesCommand extends SchematicCommand<NaturesCommandOptions> {
  readonly allowPrivateSchematics = true;

  public async initialize(options: NaturesCommandOptions & Arguments): Promise<void> {
    return super.initialize(options);
  }

  public async run(options: NaturesCommandOptions & Arguments): Promise<number | void> {
    // if (!options.operation) {
    //   return this.printHelp();
    // }

    switch (options.operation) {
      case Operation.Add:
        return this.doAdd(options);

      case Operation.List:
        return this.doList(options);

      default:
        return this.printHelpUsage();
    }
  }

  private async doAddDev(options: NaturesCommandOptions & Arguments): Promise<number | void> {
    let naturePackageName = options.nature;
    const packageManager = await getPackageManager(this.workspace.root);
    try {
      const tempPath = await installTempPackage(naturePackageName, packageManager, { save: 'devDependencies' });
      if (!tempPath) {
        this.logger.error('Failed');
        return 1;
      }
    } catch (e) {
      const t = e;
    }
  }

  private async doAdd(options: NaturesCommandOptions & Arguments): Promise<number | void> {
    options.nature = options.nature.toLowerCase();

    this.logger.info(`Adding '${options.nature}' nature...`);
    let packageIdentifier;
    try {
      let packageName = options.nature;
      if (packageName.split('/').length === 1) {
        packageName = `@wdtk/${packageName}`;
      }
      packageIdentifier = npa(packageName);
    } catch (e) {
      this.logger.error(e.message);
      return 1;
    }
    // should the package providing the nature needs to be installed
    let skipInstall = false;
    if (packageIdentifier.registry && this.isPackageInstalled(packageIdentifier.name)) {
      let validVersion = false;
      const installedVersion = await this.findPackageVersion(packageIdentifier.name);
      if (installedVersion) {
        switch (packageIdentifier.type) {
          case 'range':
            validVersion = satisfies(installedVersion, packageIdentifier.fetchSpec);
            break;
          case 'version':
            const v1 = valid(packageIdentifier.fetchSpec);
            const v2 = valid(installedVersion);
            validVersion = v1 !== null && v1 == v2;
            break;
          default:
            if (!packageIdentifier.rawSpec) {
              validVersion = true;
            }
        }
      }

      if (validVersion) {
        this.logger.info(`Skipping installation: nature '${options.nature}' (${packageIdentifier.name})' is already installed.`);
        skipInstall = true;
      }
    }

    this.collectionName = packageIdentifier.name;

    if (!skipInstall) {
      try {
        await this.installPackage(packageIdentifier, options);
      } catch (e) {
        this.logger.error(e.message);
        this.logger.error(`Failed to add '${options.nature}' nature.`);
        return 1;
      }
    }

    const result = await this.executeSchematic(this.collectionName, options['--']);
    if (result === 0) {
      this.logger.info(`Nature '${options.nature} was successfully added.`);
    }
    return result;
  }

  private async doList(options: NaturesCommandOptions & Arguments): Promise<number | void> {
    const natures = this.getAvailableNatures();
    if (Object.keys(natures).length === 0) {
      this.logger.info('No natures are installed.');
      return;
    }
    this.logger.info(`Installed natures:`);
    for (const nature of Object.keys(natures)) {
      this.logger.info(`${natures[nature].name} (${nature})`);
    }
  }

  private async installPackage(packageIdentifier, options: NaturesCommandOptions & Arguments) {
    const packageManager = await getPackageManager(this.workspace.root);
    let savePackage: 'dependencies' | 'devDependencies' | boolean | undefined;

    if (packageIdentifier.type === 'tag' && !packageIdentifier.rawSpec) {
      // only package name was provided, search for a viable version
      let packageMetadata;
      try {
        packageMetadata = await fetchPackageMetadata(packageIdentifier.name, this.logger, {
          registry: options.registry,
          packageManager: packageManager,
          verbose: options.verbose,
        });
      } catch (e) {
        // this.logger.error(`Failed to retrieve package metadata: ${e.message}.`);
        throw new Error(`Failed to retrieve package metadata: ${e.message}.`);
      }

      const latestManifest = packageMetadata.tags['latest'];
      if (latestManifest && Object.keys(latestManifest.peerDependencies).length === 0) {
        // do nothing for now
      } else {
        if (!latestManifest || (await this.hasMismatchedPeerDependencies(latestManifest))) {
          const versionManifests = Object.values(packageMetadata.versions).filter(
            (manifest: PackageManifest) => !prerelease(manifest.version)
          ) as PackageManifest[];

          versionManifests.sort((a, b) => rcompare(a.version, b.version, true));
          let newIdentifier;
          for (const versionManifest of versionManifests) {
            if (!(await this.hasMismatchedPeerDependencies(versionManifest))) {
              newIdentifier = npa.resolve(packageIdentifier.name, versionManifest.version);
              break;
            }
          }
          if (!newIdentifier) {
            this.logger.warn(`Failed to find a compatible version, using 'latest'.`);
          } else {
            packageIdentifier = newIdentifier;
          }
        }
      }
    }

    // check for mismatching peer dependencies
    try {
      const manifest = await fetchPackageManifest(packageIdentifier, this.logger, {
        registry: options.registry,
        packageManager: packageManager,
        verbose: options.verbose,
      });
      savePackage = manifest['ng-add']?.save;
      this.collectionName = manifest.name;

      const hasMismatchedPeers = await this.hasMismatchedPeerDependencies(manifest);
      if (hasMismatchedPeers) {
        this.logger.warn(`Package ${this.collectionName} has unmet peer dependencies. Adding the package might not succeed.`);
      }
    } catch (e) {
      //   this.logger.error(`Unable to fetch package manifest for '${packageIdentifier.name}': ${e.message}`);
      throw new Error(`Failed to retrieve package manifest for '${packageIdentifier.name}': ${e.message}`);
    }

    if (savePackage === false) {
      // use packageIdentifier.raw since it might contain version information
      const tempPath = await installTempPackage(packageIdentifier.raw, packageManager, { registry: options.registry });

      if (!tempPath) {
        // failed to install temporary package, so exit
        throw new Error(`Failed to install temporary package.`);
      }
      const resolvedCollectionPath = require.resolve(Path.join(this.collectionName, 'package.json'), { paths: [tempPath] });
      this.collectionName = Path.dirname(resolvedCollectionPath);
    } else {
      // use packageIdentifier.raw since it might contain version information
      await installPackage(packageIdentifier.raw, packageManager, { save: 'devDependencies', registry: options.registry });
    }
  }

  private async executeSchematic(collectionName: string, options: string[] = []): Promise<number | void> {
    const runOptions: RunSchematicOptions = {
      schematicOptions: options,
      collectionName,
      schematicName: 'ng-add',
      dryRun: false,
      force: false,
    };
    try {
      return await this.runSchematic(runOptions);
    } catch (e) {
      if (e instanceof NodePackageDoesNotSupportSchematics) {
        this.logger.error(tags.oneLine`
        The package you are trying to add does not support schematics. You can try using
        a different version of the package or contact the package author to add 'ng-add' support.
        `);
        return 1;
      }
      throw e;
    }
  }

  private async hasMismatchedPeerDependencies(manifest: PackageManifest): Promise<boolean> {
    for (const peer in manifest.peerDependencies) {
      let peerIdentifier;
      try {
        peerIdentifier = npa.resolve(peer, manifest.peerDependencies[peer]);
      } catch {
        this.logger.warn(`Invalid peer dependency '${peer}' found in package.`);
        continue;
      }

      if (peerIdentifier.type === 'version' || peerIdentifier.type === 'range') {
        try {
          const version = await this.findPackageVersion(peer);
          if (!version) {
            continue;
          }
          const options = { includePrerelease: true };

          if (!intersects(version, peerIdentifier.rawSpec, options) && !satisfies(version, peerIdentifier.rawSpec, options)) {
            return true;
          }
        } catch {
          // not found of invalid => ignore
          continue;
        }
      }
    }
    return false;
  }

  private async findPackageVersion(name: string): Promise<string | null> {
    let installedPackage;
    try {
      installedPackage = require.resolve(Path.join(name, 'package.json'), { paths: [this.workspace.root] });
    } catch {}

    if (installedPackage) {
      try {
        const installed = await fetchPackageManifest(Path.dirname(installedPackage), this.logger);
        return installed.version;
      } catch {}
    }
    let projectManifest: PackageManifest;
    try {
      projectManifest = await fetchPackageManifest(this.workspace.root, this.logger);
    } catch {}

    if (projectManifest) {
      const version = projectManifest.dependencies[name] || projectManifest.devDependencies[name];
      if (version) {
        return version;
      }
    }
    return null;
  }

  private isPackageInstalled(packageName: string): boolean {
    try {
      require.resolve(Path.join(packageName, 'package.json'), { paths: [this.workspace.root] });
      return true;
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND') {
        throw e;
      }
    }
    return false;
  }

  private getAvailableNatures(): { [collectionName: string]: { name: string } } {
    const result = {};
    const workspace = this.getWorkspaceDefinition();
    const natures = (workspace.extensions.natures as JsonObject) || {};

    for (const nature in natures) {
      result[nature] = natures[nature];
    }
    return result;
  }

  protected async printHelpUsage() {
    this.logger.info(this.descriptor.description);

    const name = this.descriptor.name;
    const args = this.descriptor.options.filter((x) => x.positional !== undefined);
    const opts = this.descriptor.options.filter((x) => x.positional === undefined);

    const argDisplay = args && args.length > 0 ? ' ' + args.map((a) => `<${a.name}>`).join(' ') : '';
    const optDisplay = opts && opts.length > 0 ? ` [options]` : ``;
    this.logger.info(`usage: wx ${name}${argDisplay}${optDisplay}`);
    this.logger.info('');
  }
}
