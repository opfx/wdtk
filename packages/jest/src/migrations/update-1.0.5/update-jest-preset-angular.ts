import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { chain } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import { NodeDependency, NodeDependencyType } from '@wdtk/core';
import { addPackageJsonDependency, addInstallTask, getPackageJsonDependency } from '@wdtk/core';

const dependenciesToUpdate: NodeDependency[] = [
  { name: 'jest', type: NodeDependencyType.Dev, version: '27.2.0', overwrite: true },
  { name: 'jest-preset-angular', type: NodeDependencyType.Dev, version: '9.0.7', overwrite: true },
  { name: '@types/jest', type: NodeDependencyType.Dev, version: '27.0.1', overwrite: true },
  { name: 'ts-jest', type: NodeDependencyType.Dev, version: '27.0.3', overwrite: true },
];

export default function (): Rule {
  return chain([updateWorkspaceDependencies(dependenciesToUpdate)]);
}

function updateWorkspaceDependencies(dependencies: NodeDependency[]): Rule {
  return (tree: Tree, ctx: SchematicContext) => {
    let hasChanges = false;
    dependencies.forEach((dependency) => {
      const current = getPackageJsonDependency(tree, dependency.name);
      if (current && current.version !== dependency.version) {
        addPackageJsonDependency(tree, dependency);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      ctx.addTask(new NodePackageInstallTask());
    }
  };
}
