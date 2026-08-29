'use strict';

// Register the canonical V21 domain cases first. node:test executes registered
// cases after module evaluation, so the release hardening layer is attached
// before any case runs—matching browser bootstrap order without duplicating the
// 34 assertions in tests/v21.test.js.
require('./v21.test.js');
require('../js/domain/v21-hardening.js');
