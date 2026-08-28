'use strict';

const {defineConfig,devices}=require('@playwright/test');

module.exports=defineConfig({
  testDir:'./tests/e2e',
  timeout:30000,
  fullyParallel:false,
  workers:1,
  reporter:'line',
  use:{
    baseURL:'http://127.0.0.1:8765',
    ...devices['Desktop Chrome'],
    headless:true,
    screenshot:'only-on-failure',
    trace:'retain-on-failure'
  },
  webServer:{
    command:'python -m http.server 8765',
    url:'http://127.0.0.1:8765/Multiverse_Wheel_V8_1326_Real_Repo_Images.html',
    reuseExistingServer:true,
    timeout:15000
  }
});
