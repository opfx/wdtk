#!/usr/bin/env node

try {
  process.title = 'wx ' + Array.from(process.argv).slice(2).join(' ');
} catch {
  process.title = 'wx';
}

// This node version check ensures that extremely old versions of node are not used.
// These may not support ES2015 features such as const/let/async/await/etc.
// These would then crash with a hard to diagnose error message.
// tslint:disable-next-line: no-var-keyword
var version = process.versions.node.split('.').map((part) => Number(part));

if (version[0] < 10 || version[0] === 11 || (version[0] === 10 && version[1] < 13)) {
  console.error(
    'Node.js version ' +
      process.version +
      ' detected.\n' +
      'This CLI requires a minimum Node.js version of either v10.13 or v12.0.\n\n' +
      'Please update your Node.js version or visit https://nodejs.org/ for additional instructions.\n'
  );

  process.exitCode = 3;
} else {
  require('../lib/init');
}
