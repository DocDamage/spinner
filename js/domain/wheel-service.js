'use strict';

(function attachWheelService(root) {
  class WheelService {
    localSpin(spin) {
      return ((Math.max(1, Number(spin || 1)) - 1) % 10) + 1;
    }

    cadence(spin, branchIndex = 0, campUsed = false) {
      const local = this.localSpin(spin);
      const requiredBranches = local >= 8 ? 3 : local >= 6 ? 2 : local >= 3 ? 1 : 0;
      return {
        storyDue: branchIndex < requiredBranches,
        campDue: local === 9 && !campUsed && branchIndex >= 3,
        bossDue: local === 10
      };
    }

    rivalReplacementIndexes(slices = [], limit = 3) {
      return slices
        .map((slice, index) => ({slice, index}))
        .filter(({slice}) => ['battle','power','recruit'].includes(slice?.type))
        .slice(0, Math.max(0, limit))
        .map(({index}) => index);
    }
  }

  const api = {WheelService};
  root.MultiverseDomain = Object.assign(root.MultiverseDomain || {}, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
