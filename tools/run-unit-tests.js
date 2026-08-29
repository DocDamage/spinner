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

function failResult(relative,result,label=''){
  if(result.error){
    if(result.error.code==='ETIMEDOUT')console.error(`Test timed out after 5s: ${relative}${label?` :: ${label}`:''}`);
    else console.error(`Unable to run ${relative}: ${result.error.message}`);
    return true;
  }
  if(result.status!==0){
    if(result.stdout)process.stdout.write(result.stdout);
    if(result.stderr)process.stderr.write(result.stderr);
    console.error(`Test failed: ${relative}${label?` :: ${label}`:''}`);
    return true;
  }
  return false;
}

for(const file of files){
  const relative=path.join('tests',file);
  console.log(`\n=== ${relative} ===`);
  if(file==='v21.test.js'){
    const source=fs.readFileSync(path.join(root,relative),'utf8');
    const names=[...source.matchAll(/test\('([^']+)'/g)].map(match=>match[1]);
    if(!names.length){console.error('No V21 core test cases discovered.');process.exit(1);}
    for(const name of names){
      const pattern=`^${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`;
      const result=spawnSync(process.execPath,['--test',`--test-name-pattern=${pattern}`,relative],{
        cwd:root,
        encoding:'utf8',
        timeout:5000,
        env:process.env
      });
      if(failResult(relative,result,name))process.exit(result.status||1);
      console.log(`PASS ${name}`);
    }
    console.log(`All ${names.length} isolated V21 core cases passed.`);
    continue;
  }
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
