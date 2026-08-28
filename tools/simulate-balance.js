'use strict';

const {loadRoster} = require('./roster-loader.js');
const {BalanceEngine} = require('../js/domain/balance-engine.js');
const {SimulationEngine} = require('../js/domain/simulation-engine.js');

const runs = Math.max(100,Number(process.argv[2] || 5000));
const seed = Number(process.argv[3] || 20260828);
const report = new SimulationEngine({balance:new BalanceEngine({maxActiveSets:3,baseBudget:8})}).run(loadRoster(),{runs,seed});
console.log(JSON.stringify(report,null,2));
