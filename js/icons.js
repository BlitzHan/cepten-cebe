// Cepten Cebe — tabela piktogramları. 24'lük ızgara, 2px çizgi, köşeler yuvarlak; renk currentColor.
(function () {
  var G = globalThis.G;
  var P = {
    // tedarik
    kuzen:    '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 12h18"/><path d="M10 8h4M10 16h4"/>',
    ilan:     '<rect x="3" y="3" width="12" height="15" rx="1.5"/><path d="M6 7h6M6 10.5h4"/><circle cx="15.5" cy="15.5" r="3.5"/><path d="m18 18 3 3"/>',
    geri:     '<rect x="8.5" y="6" width="7" height="12" rx="1.5"/><path d="M4 12a8 8 0 0 1 13-6.2"/><path d="m17 3 .3 3-3 .3"/><path d="M20 12a8 8 0 0 1-13 6.2"/><path d="m7 21-.3-3 3-.3"/>',
    toptanci: '<path d="M3 8 12 4l9 4v9l-9 4-9-4z"/><path d="m3 8 9 4 9-4M12 12v9"/><path d="m7.5 6 9 4"/>',
    vendor:   '<path d="M3 9 5 4h14l2 5"/><path d="M4 9v11h16V9"/><path d="M3 9h18"/><path d="M15 15H9m0 0 2-2m-2 2 2 2"/>',
    ithalat:  '<path d="M3 15h18l-2.5 5h-13z"/><path d="M6 15V9h5v6M11 11h6v4"/><path d="M8 9V6"/>',
    atolye:   '<path d="M14.5 6.5a3.5 3.5 0 0 0-4.6 4.6L4 17l3 3 5.9-5.9a3.5 3.5 0 0 0 4.6-4.6l-2.1 2.1-2-2z"/>',
    fabrika:  '<path d="M3 21V11l5 3v-3l5 3v-3l5 3V4h3v17z"/><path d="M7 18h2M12 18h2"/>',
    mega:     '<path d="M2 21V12l4 2.5V12l4 2.5V12l4 2.5V8h3v13z"/><path d="M17 8V5l3-2 2 2-3 1.5"/><path d="M1 21h22"/>',
    yorunge:  '<rect x="9" y="9" width="6" height="6" rx="1"/><path d="M3 5h4v5H3zM17 14h4v5h-4z"/><path d="M7 7.5 9 10M15 14l2 2.5"/><path d="M14 5a5 5 0 0 1 5 5"/>',
    // satış
    elden:    '<rect x="9" y="3" width="7" height="12" rx="1.5"/><path d="M4 13l3.5 3.5a3 3 0 0 0 2.1.9H17l3-3"/><path d="M4 13v8"/>',
    telefoncu:'<path d="M3 10V5h18v5"/><path d="M4 10v11h16V10"/><rect x="8" y="13" width="4" height="8"/><path d="M14.5 13h3v4h-3z"/><path d="M6 7.5h12"/>',
    mahalle:  '<path d="M3 9h18l-1.5-5h-15z"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v9h14v-9"/><path d="M10 21v-5h4v5"/>',
    carsi:    '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M9.5 13.5h5"/>',
    avm:      '<path d="M2 21h20"/><path d="M4 21V9l8-5 8 5v12"/><path d="M8 12h8M8 16h8"/><path d="M10 21v-2h4v2"/>',
    online:   '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    zincir:   '<rect x="2" y="9" width="6" height="12"/><rect x="9" y="4" width="6" height="17"/><rect x="16" y="11" width="6" height="10"/><path d="M11 8h2M11 12h2M4 13h2M18 15h2"/>',
    ihracat:  '<path d="M2 16.5 22 9l-1.5-2.5L3 12z"/><path d="m8 11.5-2-6 2-.8 5 5"/><path d="m11 14 1.5 5.5 2-.8.5-6.5"/>',
    mars:     '<path d="M12 2c3.5 3 4.5 7 4 11l-4 3-4-3c-.5-4 .5-8 4-11z"/><circle cx="12" cy="9" r="1.8"/><path d="M8 13l-3 2v4l3.5-2M16 13l3 2v4l-3.5-2M10.5 19l1.5 3 1.5-3"/>',
    // ekip
    mudur:    '<path d="M9 3h6l-1.5 3h-3z"/><path d="M10.5 6 9 16l3 4 3-4-1.5-10"/><path d="M5 21c0-4 2-6 4.5-7M19 21c0-4-2-6-4.5-7"/>',
    hakan:    '<rect x="7" y="2" width="10" height="16" rx="1.5"/><path d="M10 15h4"/><path d="m13 6-3 4h4l-3 4"/><path d="M5 21h14"/>',
    nurten:   '<rect x="5" y="2" width="14" height="20" rx="1.5"/><rect x="8" y="5" width="8" height="4"/><path d="M8.5 13h1M11.5 13h1M14.5 13h1M8.5 16.5h1M11.5 16.5h1M14.5 16.5h1"/>',
    can:      '<path d="M3 10v4h3l8 5V5L6 10z"/><path d="M17.5 9a4 4 0 0 1 0 6M20 6.5a8 8 0 0 1 0 11"/>',
    selin:    '<rect x="4" y="5" width="16" height="16" rx="1.5"/><path d="M10 2h4v4h-4z"/><circle cx="12" cy="11.5" r="2.5"/><path d="M8 18a4 4 0 0 1 8 0"/>',
    deniz:    '<path d="M12 3v18M7 21h10M4 7h16"/><path d="M6 7 3 14a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z"/>',
    // arayüz
    depo:     '<path d="M2 21V9l10-6 10 6v12"/><path d="M6 21v-9h12v9"/><path d="M6 15h12M6 18h12"/>',
    sok:      '<path d="m14 4 6 6-3 3-6-6z"/><path d="m11 7-8 8v6h6l8-8"/><path d="M7 17h.01"/>',
    kilit:    '<rect x="5" y="11" width="14" height="10" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    ses:      '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>',
    sessiz:   '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="m17 9 5 6M22 9l-5 6"/>',
    tecrube:  '<path d="M8 2h8l-2 6h-4z"/><circle cx="12" cy="15" r="6"/><path d="m12 12 1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L9 14.3l2-.3z"/>',
    borsa:    '<path d="M3 3v18h18"/><path d="m6 15 4-4 3 3 6-7"/><path d="M15 7h4v4"/>'
  };
  G.icon = function (name, cls) {
    var body = P[name];
    if (!body) return '';
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  };
})();
