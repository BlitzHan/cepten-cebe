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

  // v1 kayıtları eski fiyat ölçeğindeydi (tuşlu 100 ₺). Para değerlerini yeni ölçeğe taşı.
  function migrate(saved) {
    if (!saved.v || saved.v < 2) {
      var K = 7.5;
      saved.cash = (saved.cash || 0) * K;
      if (saved.stats) ['earned', 'earnedAll', 'spent'].forEach(function (k) { saved.stats[k] = (saved.stats[k] || 0) * K; });
      saved.v = 2;
    }
    // v3: tedarikte 4. sıraya Market Vendörlüğü girdi; eski 4 ve sonrası bir kaydı.
    if (saved.v < 3) {
      var at = 4, shift = function (obj, re) {
        if (!obj) return obj;
        var out = {};
        Object.keys(obj).forEach(function (k) {
          var m = re.exec(k);
          out[m && +m[1] >= at ? k.replace(re, function (_, i, rest) { return 's' + (+i + 1) + (rest || ''); }) : k] = obj[k];
        });
        return out;
      };
      if (Array.isArray(saved.sup)) saved.sup.splice(at, 0, 0);
      saved.upg = shift(saved.upg, /^s(\d+)(_\d+)$/);
      saved.retired = shift(saved.retired, /^s(\d+)()$/);
      saved.v = 3;
    }
    return saved;
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
      var saved = migrate(JSON.parse(raw));
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
      G.S = merge(G.newState(), migrate(saved));
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
