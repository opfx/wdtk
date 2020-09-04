import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { Schema as ApplicationOptions } from './schema';

describe('ApplicationSchematic', () => {
  const schematicRunner = new SchematicTestRunner('@wdtk/workspace', require.resolve('../../collection.json'));
  const defaultOptions: ApplicationOptions = {
    name: 'bar',
  };
  it('should create application files', async () => {});
});
