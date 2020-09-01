import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { Schema as WxNewOptions } from './schema';

describe('Wx New Schematic', () => {
  const schematicRunner = new SchematicTestRunner('@wdtk/workspace', require.resolve('../../collection.json'));
  const defaultOptions: WxNewOptions = {
    directory: 'bar',
  };
  it('should create workspace files', async () => {
    const options = { ...defaultOptions };
    const tree = await schematicRunner.runSchematicAsync('wx-new', options).toPromise();
    const files = tree.files;
    expect(files).toContain('/bar/sample.json');
  });
});
