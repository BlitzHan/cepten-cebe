// Cepten Cebe — sesler Web Audio ile üretilir, dosya yok.
(function () {
  var G = globalThis.G;
  var ctx = null, last = {};

  function ac() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, start, dur, type, vol, slideTo) {
    var c = ac(); if (!c) return;
    var t = c.currentTime + start;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  // Aynı ses çok sık çalmasın
  function gate(name, ms) {
    var n = performance.now();
    if (last[name] && n - last[name] < ms) return false;
    last[name] = n; return true;
  }

  var SFX = {
    buy:    function () { if (gate('buy', 45)) tone(420 + Math.random() * 40, 0, 0.07, 'triangle', 0.09); },
    sell:   function () { if (gate('sell', 45)) { tone(880, 0, 0.06, 'square', 0.05); tone(1320, 0.05, 0.1, 'square', 0.05); } },
    empty:  function () { if (gate('empty', 120)) tone(160, 0, 0.1, 'sawtooth', 0.05); },
    unit:   function () { tone(520, 0, 0.08, 'triangle', 0.1); tone(780, 0.07, 0.12, 'triangle', 0.1); },
    upgrade:function () { [523, 659, 784].forEach(function (f, i) { tone(f, i * 0.07, 0.14, 'triangle', 0.1); }); },
    ach:    function () { [659, 784, 988, 1319].forEach(function (f, i) { tone(f, i * 0.08, 0.2, 'sine', 0.12); }); },
    event:  function () { tone(988, 0, 0.12, 'sine', 0.12); tone(1319, 0.12, 0.25, 'sine', 0.12); },
    fail:   function () { tone(300, 0, 0.35, 'sawtooth', 0.07, 90); },
    era:    function () { [392, 523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.09, 0.3, 'triangle', 0.11); }); }
  };
  G.sfx = function (name) {
    if (!G.S.sound || !SFX[name]) return;
    try { SFX[name](); } catch (e) { /* ses yoksa oyun devam eder */ }
  };
})();
