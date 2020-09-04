import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { JsonParseMode, parseJson } from '@wdtk/core';
import { versions } from './../../versions';
import { Schema as WorkspaceOptions } from './schema';

// tslint:disable-next-line: no-any
function getJsonFileContent(tree: UnitTestTree, path: string): any {
  return parseJson(tree.readContent(path).toString(), JsonParseMode.Loose);
}
describe('workspace schematic', () => {
  const schematicRunner = new SchematicTestRunner('@wdtk/workspace', require.resolve('../../collection.json'));
  const runSchematic = async (opts: WorkspaceOptions): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync('workspace', opts).toPromise();
  };

  const defaultOptions: WorkspaceOptions = {
    name: 'unittest',
  };

  beforeEach(() => {});
  it('should create required files', async () => {
    const opts = { ...defaultOptions };
    const tree = await runSchematic(opts);
    const files = tree.files;
    expect(files).toContain('/package.json');
    expect(files).toContain('/.prettierrc');
    expect(files).toContain('/.prettierignore');
  });
  it('should have the latest version of wdtk in package.json', async () => {
    const expectedVersion = `^${versions.Wdtk.replace('~', '').replace('^', '')}`;
    const tree = await runSchematic(defaultOptions);
    const packageJson = getJsonFileContent(tree, '/package.json');

    expect(packageJson.devDependencies['@wdtk/cli']).toBe(expectedVersion);
  });
});
