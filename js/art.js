// Cepten Cebe — elle çizilmiş SVG görseller. Çağa göre değişen telefon ve para destesi.
(function () {
  var G = globalThis.G;

  function keypad(x, y, w, h, cols, rows, fill) {
    var s = '', gw = w / cols, gh = h / rows;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++)
      s += '<rect x="' + (x + c * gw + 2) + '" y="' + (y + r * gh + 2) + '" width="' + (gw - 4) + '" height="' + (gh - 4) + '" rx="3" fill="' + fill + '"/>';
    return s;
  }

  var PHONES = [
    // 0 tuşlu
    '<svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="22" y="8" width="76" height="184" rx="22" fill="#3b4251"/>' +
      '<rect x="26" y="12" width="68" height="176" rx="19" fill="#4c5567"/>' +
      '<rect x="56" y="18" width="8" height="3" rx="1.5" fill="#262b35"/>' +
      '<rect x="34" y="28" width="52" height="46" rx="5" fill="#9fd36b"/>' +
      '<rect x="34" y="28" width="52" height="46" rx="5" fill="url(#lcd)" opacity=".5"/>' +
      '<text x="60" y="47" font-size="8" font-family="monospace" text-anchor="middle" fill="#2d4a17">12:00</text>' +
      '<rect x="40" y="56" width="40" height="3" fill="#2d4a17" opacity=".6"/>' +
      '<rect x="40" y="62" width="28" height="3" fill="#2d4a17" opacity=".6"/>' +
      '<rect x="42" y="82" width="36" height="14" rx="7" fill="#2b303b"/>' +
      '<circle cx="60" cy="89" r="4" fill="#6b7589"/>' +
      keypad(34, 102, 52, 76, 3, 4, '#2b303b') +
      '<defs><linearGradient id="lcd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
    '</svg>',
    // 1 kapaklı
    '<svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="24" y="6" width="72" height="92" rx="14" fill="#8a93a6"/>' +
      '<rect x="30" y="14" width="60" height="76" rx="6" fill="#1b2130"/>' +
      '<rect x="33" y="17" width="54" height="70" rx="4" fill="#3e8ed0"/>' +
      '<circle cx="60" cy="52" r="14" fill="#f6c343"/>' +
      '<path d="M33 72 Q50 60 60 70 T87 66 V87 H33Z" fill="#2a6aa3"/>' +
      '<rect x="22" y="96" width="76" height="10" rx="5" fill="#626b7d"/>' +
      '<rect x="24" y="104" width="72" height="90" rx="14" fill="#9aa3b5"/>' +
      '<rect x="36" y="112" width="48" height="12" rx="6" fill="#707a8e"/>' +
      keypad(32, 128, 56, 60, 3, 4, '#707a8e') +
    '</svg>',
    // 2 ilk dokunmatik
    '<svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="18" y="6" width="84" height="188" rx="16" fill="#1d2027"/>' +
      '<rect x="22" y="10" width="76" height="180" rx="13" fill="#2b2f38"/>' +
      '<rect x="52" y="18" width="16" height="3" rx="1.5" fill="#12141a"/>' +
      '<rect x="27" y="28" width="66" height="136" rx="3" fill="#1e5aa8"/>' +
      '<rect x="27" y="28" width="66" height="136" rx="3" fill="url(#g2)"/>' +
      keypad(31, 40, 58, 100, 4, 5, 'rgba(255,255,255,.28)') +
      '<circle cx="60" cy="177" r="8" fill="none" stroke="#555b68" stroke-width="2"/>' +
      '<defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb2ff" stop-opacity=".6"/><stop offset="1" stop-color="#0b2d63" stop-opacity=".2"/></linearGradient></defs>' +
    '</svg>',
    // 3 akıllı
    '<svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="20" y="4" width="80" height="192" rx="18" fill="#dfe3ea"/>' +
      '<rect x="23" y="7" width="74" height="186" rx="15" fill="#111"/>' +
      '<rect x="26" y="10" width="68" height="180" rx="12" fill="url(#g3)"/>' +
      '<rect x="46" y="12" width="28" height="7" rx="3.5" fill="#111"/>' +
      keypad(32, 36, 56, 84, 4, 6, 'rgba(255,255,255,.35)') +
      '<rect x="30" y="170" width="60" height="14" rx="7" fill="rgba(255,255,255,.25)"/>' +
      '<defs><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9a5a"/><stop offset=".55" stop-color="#e2467c"/><stop offset="1" stop-color="#5b3bd6"/></linearGradient></defs>' +
    '</svg>',
    // 4 amiral gemisi
    '<svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="18" y="3" width="84" height="194" rx="22" fill="#c9b27a"/>' +
      '<rect x="20.5" y="5.5" width="79" height="189" rx="20" fill="#0b0b0f"/>' +
      '<rect x="23" y="8" width="74" height="184" rx="18" fill="url(#g4)"/>' +
      '<rect x="48" y="13" width="24" height="8" rx="4" fill="#000"/>' +
      '<circle cx="60" cy="72" r="26" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1.5"/>' +
      '<text x="60" y="78" font-size="16" font-family="system-ui,sans-serif" font-weight="700" text-anchor="middle" fill="#fff">09:41</text>' +
      keypad(32, 118, 56, 42, 4, 2, 'rgba(255,255,255,.3)') +
      '<rect x="44" y="182" width="32" height="3" rx="1.5" fill="#fff" opacity=".7"/>' +
      '<defs><radialGradient id="g4" cx=".3" cy=".2" r="1"><stop offset="0" stop-color="#3a2a7a"/><stop offset=".6" stop-color="#140d33"/><stop offset="1" stop-color="#05040f"/></radialGradient></defs>' +
    '</svg>',
    // 5 katlanır
    '<svg viewBox="0 0 170 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="8" y="8" width="154" height="184" rx="16" fill="#2d3b4a"/>' +
      '<rect x="12" y="12" width="146" height="176" rx="12" fill="url(#g5)"/>' +
      '<rect x="84" y="12" width="2" height="176" fill="rgba(255,255,255,.18)"/>' +
      '<circle cx="146" cy="22" r="3" fill="#000"/>' +
      keypad(22, 34, 56, 70, 3, 4, 'rgba(255,255,255,.3)') +
      '<rect x="94" y="34" width="56" height="40" rx="8" fill="rgba(255,255,255,.28)"/>' +
      '<rect x="94" y="80" width="56" height="24" rx="8" fill="rgba(255,255,255,.18)"/>' +
      '<rect x="22" y="118" width="128" height="56" rx="10" fill="rgba(0,0,0,.2)"/>' +
      '<path d="M26 164 L50 140 L70 156 L96 128 L146 166 Z" fill="rgba(255,255,255,.35)"/>' +
      '<defs><linearGradient id="g5" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1fc7a5"/><stop offset=".5" stop-color="#1c7fd6"/><stop offset="1" stop-color="#6b2bd9"/></linearGradient></defs>' +
    '</svg>'
  ];

  var CASH =
    '<svg viewBox="0 0 160 140" xmlns="http://www.w3.org/2000/svg">' +
      '<g transform="rotate(-8 80 70)">' +
        '<rect x="14" y="46" width="132" height="66" rx="8" fill="#2f8f5b"/>' +
        '<rect x="20" y="52" width="120" height="54" rx="5" fill="none" stroke="#bfe8c9" stroke-width="1.5" stroke-dasharray="3 3"/>' +
      '</g>' +
      '<g transform="rotate(4 80 70)">' +
        '<rect x="14" y="36" width="132" height="66" rx="8" fill="#3fae70"/>' +
        '<rect x="20" y="42" width="120" height="54" rx="5" fill="none" stroke="#d7f5de" stroke-width="1.5"/>' +
        '<circle cx="80" cy="69" r="20" fill="#d7f5de"/>' +
        '<text x="80" y="77" font-size="24" font-weight="800" font-family="system-ui,sans-serif" text-anchor="middle" fill="#2f8f5b">₺</text>' +
        '<circle cx="36" cy="69" r="5" fill="#d7f5de"/><circle cx="124" cy="69" r="5" fill="#d7f5de"/>' +
      '</g>' +
      '<rect x="68" y="30" width="24" height="84" rx="3" fill="#f2c14e" transform="rotate(4 80 70)"/>' +
    '</svg>';

  var DRAWER =
    '<svg viewBox="0 0 160 140" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="18" y="30" width="124" height="90" rx="6" fill="#8b5a36"/>' +
      '<rect x="26" y="40" width="108" height="34" rx="4" fill="#a86d43"/>' +
      '<rect x="26" y="80" width="108" height="34" rx="4" fill="#a86d43" transform="translate(0 6)"/>' +
      '<rect x="70" y="54" width="20" height="6" rx="3" fill="#e9c59a"/>' +
      '<rect x="52" y="12" width="26" height="40" rx="5" fill="#4c5567" transform="rotate(-14 65 32)"/>' +
      '<rect x="56" y="17" width="18" height="12" rx="2" fill="#9fd36b" transform="rotate(-14 65 32)"/>' +
    '</svg>';

  var LOGO =
    '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="6" y="4" width="22" height="38" rx="5" fill="#ffb938"/>' +
      '<rect x="9" y="8" width="16" height="26" rx="2" fill="#1a1530"/>' +
      '<circle cx="36" cy="30" r="10" fill="#3fae70"/>' +
      '<text x="36" y="35" font-size="13" font-weight="800" font-family="system-ui,sans-serif" text-anchor="middle" fill="#fff">₺</text>' +
    '</svg>';

  G.ART = { phone: function (era) { return PHONES[Math.min(era, PHONES.length - 1)]; }, cash: CASH, drawer: DRAWER, logo: LOGO };
})();
