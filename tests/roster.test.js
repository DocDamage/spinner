'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {validateRoster} = require('../js/domain/roster-validator.js');
const {loadRoster} = require('../tools/roster-loader.js');

test('the complete roster satisfies the runtime schema', () => {
  const roster = loadRoster();
  const result = validateRoster(roster);
  assert.equal(roster.length, 1326);
  assert.equal(result.valid, true, result.errors.slice(0, 10).join('\n'));
});
