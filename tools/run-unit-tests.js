'use strict';

const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const testsDir=path.join(root,'tests');
const files=fs.readdirSync(testsDir)
  .filter(name=>name.endsWith('.test.js'))
  .sort((a,b)=>a.localeCompare(b));

if(!files.length){
  console.error('No unit test files found.');
  process.exit(1);
}

for(const file of files){
  const relative=path.join('tests',file);
  console.log(`\n=== ${relative} ===`);
  // Each file already imports node:test. Running it directly avoids the outer
  // node --test worker buffering the file as one opaque subtest, while keeping
  // the exact assertions, hooks, TAP output, and exit status intact.
  const result=spawnSync(process.execPath,[relative],{
    cwd:root,
    stdio:'inherit',
    timeout:30000,
    env:process.env
  });
  if(result.error){
    if(result.error.code==='ETIMEDOUT')console.error(`Test file timed out after 30s: ${relative}`);
    else console.error(`Unable to run ${relative}: ${result.error.message}`);
    process.exit(1);
  }
  if(result.status!==0){
    console.error(`Test file failed: ${relative}`);
    process.exit(result.status||1);
  }
}

console.log(`\nAll ${files.length} unit test files passed.`);
