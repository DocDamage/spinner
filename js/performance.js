'use strict';

// Static gallery metadata is built once. Image resolution stays lazy so filtering
// 1,300+ entries only resolves portraits for the visible page.
(() => {
  const P = MultiverseWheel.prototype;

  P.galleryEntries = function(mode) {
    this._galleryEntryCache ||= Object.create(null);
    if (this._galleryEntryCache[mode]) return this._galleryEntryCache[mode];

    const game = this;
    let entries;
    if (mode === 'forms') {
      entries = DATA.transformations.map(f => ({
        id: `global:${f.id}`,
        name: f.name,
        sub: f.source,
        get img() { return game.formPortrait(f, `global:${f.id}`); }
      }));

      for (const c of DATA.characters) {
        const forms = c.forms?.length ? c.forms : ['Peak Output'];
        for (let i = 0; i < forms.length; i++) {
          const form = forms[i];
          entries.push({
            id: `charform:${c.id}:${i}`,
            name: form,
            sub: c.name,
            get img() { return game.characterPortrait(c, 'form', form); }
          });
        }
      }
    } else {
      entries = DATA.characters.map(c => ({
        id: c.id,
        name: c.name,
        sub: `${c.universe} • ${c.version}`,
        get img() { return game.characterPortrait(c); }
      }));
    }

    this._galleryEntryCache[mode] = entries;
    return entries;
  };
})();
