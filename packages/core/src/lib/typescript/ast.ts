import * as ts from 'typescript';
import { Change, InsertChange } from './../util/change';

export function findNodes(node: ts.Node, kind: ts.SyntaxKind | ts.SyntaxKind[], max = Infinity): ts.Node[] {
  if (!node || max == 0) {
    return [];
  }

  const arr: ts.Node[] = [];
  const hasMatch = Array.isArray(kind) ? kind.includes(node.kind) : node.kind === kind;
  if (hasMatch) {
    arr.push(node);
    max--;
  }
  if (max > 0) {
    for (const child of node.getChildren()) {
      findNodes(child, kind, max).forEach((node) => {
        if (max > 0) {
          arr.push(node);
        }
        max--;
      });

      if (max <= 0) {
        break;
      }
    }
  }

  return arr;
}

export function addGlobal(source: ts.SourceFile, modulePath: string, statement: string): Change[] {
  const allImports = findNodes(source, ts.SyntaxKind.ImportDeclaration);
  if (allImports.length > 0) {
    const lastImport = allImports[allImports.length - 1];
    return [new InsertChange(modulePath, lastImport.end + 1, `\n${statement}\n`)];
  } else {
    return [new InsertChange(modulePath, 0, `${statement}\n`)];
  }
}
