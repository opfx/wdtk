import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { Schema as WxNewOptions } from './schema';

describe('Ng New Schematic', () => {
  const schematicRunner = new SchematicTestRunner('@wdtk/workspace', require.resolve('../../collection.json'));
  const defaultOptions: WxNewOptions = {
    name: 'bar',
    skipYarn: true,
    skipGit: true,
  };
  it('should create workspace files', async () => {
    const options = { ...defaultOptions };
    const tree = await schematicRunner.runSchematicAsync('ng-new', options).toPromise();
    const files = tree.files;
    expect(files).toContain('/bar/package.json');
  });
});
