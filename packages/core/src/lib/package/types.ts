export interface PackageDependencies {
  [dependency: string]: string;
}

export type NgAddSaveDependency = 'dependencies' | 'devDependencies' | boolean;

export interface PackageIdentifier {
  type: 'git' | 'tag' | 'version' | 'range' | 'file' | 'directory' | 'remote';
  name: string;
  scope: string | null;
  registry: boolean;
  raw: string;
  fetchSpec: string;
  rawSpec: string;
}

export interface PackageManifest {
  name: string;
  version: string;
  license?: string;
  private?: boolean;
  deprecated?: boolean;

  dependencies: PackageDependencies;
  devDependencies: PackageDependencies;
  peerDependencies: PackageDependencies;
  optionalDependencies: PackageDependencies;
  'ng-add'?: {
    save?: NgAddSaveDependency;
  };
  'ng-update'?: {
    migrations: string;
    packageGroup: { [name: string]: string };
  };
}

export interface PackageMetadata {
  name: string;
  tags: { [tag: string]: PackageManifest | undefined };
  versions: Record<string, PackageManifest>;
  'dist-tags'?: unknown;
}
