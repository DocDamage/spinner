'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'Multiverse_Wheel_V8_1326_Real_Repo_Images.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(match => match[1])
  .filter(ref => !/^(?:https?:|data:|#)/.test(ref));
const missing = refs.filter(ref => !fs.existsSync(path.join(root, ref)));
if (missing.length) throw new Error(`Missing local references: ${missing.join(', ')}`);

const scripts = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) scripts.push(full);
  }
}
walk(path.join(root, 'js'));
for (const script of scripts) new vm.Script(fs.readFileSync(script, 'utf8'), {filename:script});

console.log(`Validated ${refs.length} local references and ${scripts.length} JavaScript files.`);
