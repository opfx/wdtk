import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from './schema';
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
});
