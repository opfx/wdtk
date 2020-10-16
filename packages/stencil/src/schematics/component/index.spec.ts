import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { getWorkspaceDefinition } from '@wdtk/core';
import { createEmptyWorkspace } from '@wdtk/core/testing';
import { strings, tags } from '@wdtk/core/util';

import { Schema as ComponentOptions } from './schema';

const schematicCollection = '@wdtk/stencil';
const schematicName = 'component';

const defaultOpts: ComponentOptions = {
  name: 'sample',
  prefix: 'utp',
  project: 'test-lib',
};

describe('stencil init schematic', () => {
  const schematicRunner = new SchematicTestRunner(schematicCollection, require.resolve('../../collection.json'));

  const runSchematic = async (opts: ComponentOptions): Promise<UnitTestTree> => {
    return schematicRunner.runSchematicAsync(schematicName, opts, workspaceTree).toPromise();
  };
  let workspaceTree: Tree;

  beforeEach(async () => {
    workspaceTree = createEmptyWorkspace();

    workspaceTree = await schematicRunner.runSchematicAsync('library', { name: 'test-lib' }, workspaceTree).toPromise();
  });

  it(`should generate the files required by the stencil library project`, async () => {
    const tree = await runSchematic(defaultOpts);
    expect(tree.exists(`/${defaultOpts.project}/src/components/sample/sample.tsx`)).toBeTruthy();
    expect(tree.exists(`/${defaultOpts.project}/src/components/sample/sample.scss`)).toBeTruthy();
    expect(tree.exists(`/${defaultOpts.project}/src/components/sample/sample.e2e.ts`)).toBeTruthy();
    expect(tree.exists(`/${defaultOpts.project}/src/components/sample/sample.spec.ts`)).toBeTruthy();
  });

  it(`should generate valid code for the component class`, async () => {
    const tree = await runSchematic(defaultOpts);
    const sourceCode = tree.readContent(`/${defaultOpts.project}/src/components/sample/sample.tsx`);
    expect(tags.stripIndents`${sourceCode}`).toEqual(tags.stripIndents` 
      import { Component, Prop, h } from '@stencil/core';
      import { format } from '../../utils/utils';

      @Component({
        tag: 'utp-sample',
        styleUrl: 'utp-sample.scss',
        shadow: true,
      })
      export class ${strings.classify(defaultOpts.name)}Component {
        /**
         * The first name
         */
        @Prop() first: string;
      
        /**
         * The middle name
         */
        @Prop() middle: string;
      
        /**
         * The last name
         */
        @Prop() last: string;
      
        private getText(): string {
          return format(this.first, this.middle, this.last);
        }
      
        render() {
          return <div>Hello, World! I'm {this.getText()}</div>;
        }
      }

    `);
  });
});
