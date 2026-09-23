// Cepten Cebe — kayıt, yükleme, dışa/içe aktarma.
(function () {
  var G = globalThis.G;
  var KEY = 'ceptenCebe.save.v1';

  // Eski kayıtta olmayan alanları yeni durumdan tamamla
  function merge(base, saved) {
    Object.keys(saved).forEach(function (k) {
      var v = saved[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object') merge(base[k], v);
      else if (Array.isArray(v) && Array.isArray(base[k])) v.forEach(function (x, i) { if (i < base[k].length) base[k][i] = x; });
      else base[k] = v;
    });
    return base;
  }

  G.save = function () {
    G.S.lastSave = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(G.S)); return true; } catch (e) { return false; }
  };

  G.load = function () {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { return null; }
    if (!raw) return null;
    try {
      var saved = JSON.parse(raw);
      G.S = merge(G.newState(), saved);
      return (Date.now() - (saved.lastSave || Date.now())) / 1000;
    } catch (e) { return null; }
  };

  G.exportSave = function () {
    G.S.lastSave = Date.now();
    return btoa(unescape(encodeURIComponent(JSON.stringify(G.S))));
  };

  G.importSave = function (str) {
    try {
      var saved = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
      if (typeof saved.cash !== 'number' || !Array.isArray(saved.sup)) return false;
      G.S = merge(G.newState(), saved);
      G.S.lastSave = Date.now();
      G.offer = null;
      G.save();
      return true;
    } catch (e) { return false; }
  };

  G.hardReset = function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* yok say */ }
    G.S = G.newState();
    G.offer = null;
  };
})();
