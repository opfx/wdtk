#!/usr/bin/env node
const { create } = require('domain');
const File = require('fs');
const Path = require('path');

console.log(`Running postinstall tasks`);

const cwd = process.cwd();

createWorkDir();

function createWorkDir() {
    const workDir = Path.join(cwd, '..', 'work');
    if (File.existsSync(workDir)) {
        return;
    }
    console.log(`creating work directory in ${workDir}`);
    File.mkdirSync(workDir);
}