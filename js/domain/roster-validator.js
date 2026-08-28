'use strict';

(function attachRosterValidator(root) {
  const REQUIRED_STATS = ['might', 'defense', 'speed', 'skill', 'mind', 'energy', 'hax'];

  function validateRoster(characters = []) {
    const errors = [];
    const warnings = [];
    const ids = new Set();
    characters.forEach((character, index) => {
      const at = character?.id || `index ${index}`;
      if (!character || typeof character !== 'object') return errors.push(`${at}: character must be an object`);
      if (!character.id) errors.push(`${at}: missing id`);
      else if (ids.has(character.id)) errors.push(`${at}: duplicate id`);
      else ids.add(character.id);
      for (const field of ['name', 'universe', 'version']) if (!String(character[field] || '').trim()) errors.push(`${at}: missing ${field}`);
      for (const stat of REQUIRED_STATS) {
        const value = Number(character.stats?.[stat]);
        if (!Number.isFinite(value)) errors.push(`${at}: invalid ${stat}`);
        else if (value < 0 || value > 360) warnings.push(`${at}: ${stat} outside recommended 0–360 range`);
      }
      if (!Array.isArray(character.powers) || !character.powers.length) errors.push(`${at}: powers must be a non-empty array`);
      if (!Array.isArray(character.tags) || !character.tags.length) warnings.push(`${at}: no combat tags`);
      if (!String(character.signature || '').trim()) warnings.push(`${at}: missing signature move`);
    });
    return {valid:errors.length === 0, errors, warnings, count:characters.length};
  }

  const api = {validateRoster, REQUIRED_ROSTER_STATS: REQUIRED_STATS};
  root.MultiverseDomain = Object.assign(root.MultiverseDomain || {}, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
