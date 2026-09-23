// Cepten Cebe — arayüz: çizim, sekmeler, efektler, döngü.
(function () {
  var G = globalThis.G, D = G.D;
  var $ = function (id) { return document.getElementById(id); };
  var f = G.fmt, fr = G.fmtRate;
  var tab = 'tedarik';
  var pressed = false;
  var lastHtml = {};

  function tl(n) { return f(n) + ' ₺'; }
  function pct(x) { return '%' + Math.round(x * 100); }
  function mult(x) { return '×' + x.toFixed(2).replace('.', ','); }
  function setHtml(el, key, html) {
    if (lastHtml[key] === html) return;
    lastHtml[key] = html; el.innerHTML = html;
  }

  // ---------- efektler ----------
  var lastPointer = { x: innerWidth / 2, y: innerHeight / 2 };
  function floatText(text, cls, x, y) {
    var el = document.createElement('div');
    el.className = 'float ' + (cls || '');
    el.textContent = text;
    el.style.left = (x + (Math.random() * 30 - 15)) + 'px';
    el.style.top = (y - 10) + 'px';
    $('fx').appendChild(el);
    setTimeout(function () { el.remove(); }, 1000);
  }
  function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  function toast(html, tone, ms) {
    var el = document.createElement('div');
    el.className = 'toast ' + (tone || '');
    el.innerHTML = html;
    $('toasts').appendChild(el);
    setTimeout(function () { el.classList.add('out'); }, (ms || 4000) - 300);
    setTimeout(function () { el.remove(); }, ms || 4000);
  }
  var logItems = [];
  function addLog(text, tone) {
    var d = new Date();
    logItems.unshift({ t: ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2), text: text, tone: tone || '' });
    if (logItems.length > 30) logItems.pop();
    lastHtml.log = null;
  }

  // ---------- modal ----------
  function modal(title, body, buttons) {
    var m = $('modal');
    m.innerHTML = '<div class="modal-box"><h3>' + title + '</h3><div class="modal-body">' + body + '</div><div class="modal-btns"></div></div>';
    var box = m.querySelector('.modal-btns');
    (buttons || [{ label: 'Tamam', primary: true }]).forEach(function (b) {
      var btn = document.createElement('button');
      btn.className = 'btn ' + (b.primary ? 'primary' : b.danger ? 'danger' : 'ghost');
      btn.textContent = b.label;
      btn.onclick = function () { if (b.fn && b.fn() === false) return; closeModal(); };
      box.appendChild(btn);
    });
    m.hidden = false;
  }
  function closeModal() { $('modal').hidden = true; }
  G.modal = modal;

  // ---------- tıklama ----------
  function onBuy(e) {
    var r = G.clickBuy();
    var x = e.clientX || lastPointer.x, y = e.clientY || lastPointer.y;
    if (r.free) { floatText('+1 📱 bedava', 'free', x, y); G.sfx('buy'); }
    else if (r.n > 0) { floatText('+' + f(r.n) + ' 📱', 'buyf', x, y); G.sfx('buy'); }
    else { floatText(r.full ? 'Depo dolu!' : 'Nakit yetmiyor', 'bad', x, y); G.sfx('empty'); }
    bump($('btnBuy'));
    render();
  }
  function onSell(e) {
    var r = G.clickSell();
    var x = e.clientX || lastPointer.x, y = e.clientY || lastPointer.y;
    if (r.n > 0) { floatText('+' + tl(r.rev), 'sellf', x, y); G.sfx('sell'); }
    else { floatText('Stok yok', 'bad', x, y); G.sfx('empty'); }
    bump($('btnSell'));
    render();
  }

  // ---------- paneller ----------
  function visibleCount(list, owned) {
    var n = 1;
    list.forEach(function (u, i) { if (owned[i] > 0 || G.S.stats.earnedAll >= u.cost * 0.25) n = Math.max(n, i + 1); });
    return Math.min(list.length, n);
  }
  function modeBar() {
    var hasM = G.S.crew.mudur, m = G.S.buyMode;
    function b(v, l) {
      var on = (hasM ? m : 1) === v;
      var lock = v !== 1 && !hasM;
      return '<button class="chip' + (on ? ' on' : '') + (lock ? ' lock' : '') + '" data-act="mode" data-v="' + v + '"' +
        (lock ? ' title="Mağaza Müdürü gerekir"' : '') + '>' + l + (lock ? ' 🔒' : '') + '</button>';
    }
    return '<div class="modebar"><span>Alım miktarı</span>' + b(1, '×1') + b(10, '×10') + b('max', 'Maks') + '</div>';
  }
  function unitsHtml(kind) {
    var S = G.S, isS = kind === 's';
    var list = isS ? D.SUPPLIERS : D.CHANNELS, owned = isS ? S.sup : S.chan;
    var vis = visibleCount(list, owned);
    var bp = G.buyPrice(), sp = G.sellPrice();
    var h = modeBar();
    h += isS
      ? '<p class="hint">Tedarikçiler saniyede telefon alır ve nakitten öder. Alış çarpanı düşük olan daha ucuza alır.</p>'
      : '<p class="hint">Satış kanalları stoktaki telefonları otomatik satar. Satış çarpanı yüksek olan daha kârlı satar.</p>';
    for (var i = 0; i < vis; i++) {
      var u = list[i], n = owned[i];
      var amt = G.buyAmount(kind, i), cost = G.unitCost(kind, i, amt);
      var one = isS ? G.supRateOne(i) : G.chanRateOne(i);
      var unitPrice = isS ? bp * u.mult : sp * u.mult;
      h += '<div class="card unit' + (cost <= S.cash ? ' can' : '') + '">' +
        '<div class="ico">' + u.icon + '</div>' +
        '<div class="info"><div class="nm">' + u.name + (n ? ' <span class="own">×' + n + '</span>' : '') + '</div>' +
        '<div class="ds">' + u.desc + '</div>' +
        '<div class="meta"><span>+' + fr(one) + ' tel/sn</span>' +
        '<span class="' + (isS ? (u.mult < 1 ? 'good' : '') : (u.mult >= 1 ? 'good' : 'warn')) + '">' + (isS ? 'alış ' : 'satış ') + mult(u.mult) + ' · ' + tl(unitPrice) + '</span>' +
        (n ? '<span>toplam ' + fr(one * n) + '/sn</span>' : '') + '</div></div>' +
        '<div class="act"><button class="btn buyu" data-act="unit" data-k="' + kind + '" data-i="' + i + '"' + (cost > S.cash ? ' disabled' : '') + '>' +
        '<small>Al ×' + amt + '</small><b>' + tl(cost) + '</b></button>' +
        (n ? '<button class="linkbtn" data-act="dispose" data-k="' + kind + '" data-i="' + i + '">Devret</button>' : '') +
        '</div></div>';
    }
    if (vis < list.length) {
      var nx = list[vis];
      h += '<div class="card unit locked"><div class="ico">❔</div><div class="info"><div class="nm">???</div>' +
        '<div class="ds">Toplam ' + tl(nx.cost * 0.25) + ' kazanınca açılır.</div></div></div>';
    }
    return h;
  }

  function upgradesHtml() {
    var S = G.S, h = '';
    var e = G.nextEra();
    h += '<h4>Telefon çağı</h4>';
    if (e) {
      h += '<div class="card big-card era-card' + (S.cash >= e.cost ? ' can' : '') + '">' +
        '<div class="thumb">' + G.ART.phone(S.era + 1) + '</div>' +
        '<div class="info"><div class="nm">' + e.name + ' çağına geç</div>' +
        '<div class="ds">Alış ' + tl(e.buy) + ', temel satış ' + tl(e.sell) + ' olur. Telefon başına kâr yaklaşık ×3.</div></div>' +
        '<div class="act"><button class="btn primary" data-act="era"' + (S.cash < e.cost ? ' disabled' : '') + '><small>Çağ atla</small><b>' + tl(e.cost) + '</b></button></div></div>';
    } else h += '<p class="hint">Son çağdasın. Buradan sonrası uzay.</p>';

    var d = G.nextDepot();
    h += '<h4>Depo</h4>';
    if (d) {
      h += '<div class="card big-card' + (S.cash >= d.cost ? ' can' : '') + '"><div class="ico">🏚️</div>' +
        '<div class="info"><div class="nm">' + d.name + '</div><div class="ds">Kapasite ' + f(G.depotCap()) + ' → ' + f(d.cap) + ' telefon.</div></div>' +
        '<div class="act"><button class="btn primary" data-act="depot"' + (S.cash < d.cost ? ' disabled' : '') + '><small>Büyüt</small><b>' + tl(d.cost) + '</b></button></div></div>';
    } else h += '<p class="hint">En büyük depo sende.</p>';

    var ups = G.upgradesAvailable();
    h += '<h4>Nakit yükseltmeleri</h4>';
    if (!ups.length) h += '<p class="hint">Daha fazla kazandıkça ve birim aldıkça yeni yükseltmeler açılır.</p>';
    h += '<div class="grid">';
    ups.forEach(function (u) {
      h += '<button class="upg' + (u.cost <= S.cash ? ' can' : '') + '" data-act="upg" data-id="' + u.id + '"' + (u.cost > S.cash ? ' disabled' : '') + '>' +
        '<span class="ui">' + u.icon + '</span><span class="un">' + u.name + '</span><span class="ud">' + u.desc + '</span><b>' + tl(u.cost) + '</b></button>';
    });
    h += '</div>';

    var parts = G.partsAvailable();
    h += '<h4>Parça için sök <span class="tag">stoktan ödenir · şansa bağlı</span></h4>';
    h += '<p class="hint">Stoktaki telefonları söküp parçalarını kullanırsın. Tutarsa kondisyon kalıcı olarak artar, tutmazsa telefonlar gider. Tekrar deneyebilirsin.</p>';
    parts.forEach(function (p) {
      var tooBig = p.phones > G.depotCap();
      h += '<div class="card part' + (S.stock >= p.phones ? ' can' : '') + '"><div class="ico">🪛</div>' +
        '<div class="info"><div class="nm">' + p.name + '</div><div class="ds">' + p.desc + '</div>' +
        '<div class="meta"><span>' + f(p.phones) + ' telefon</span><span class="warn">%' + Math.round(p.chance * 100) + ' şans</span><span class="good">+' + pct(p.gain) + ' kondisyon</span>' +
        (tooBig ? '<span class="bad">Depo yetmiyor</span>' : '') + '</div></div>' +
        '<div class="act"><button class="btn" data-act="part" data-id="' + p.id + '"' + (S.stock < p.phones ? ' disabled' : '') + '><small>Sök</small><b>' + f(p.phones) + ' 📱</b></button></div></div>';
    });
    if (!parts.length) h += '<p class="hint">Tüm parça yükseltmeleri tamam. Kondisyon: ' + pct(S.cond) + '</p>';
    return h;
  }

  function crewStatus(id) {
    var S = G.S;
    if (id === 'mudur') return 'Alım modu Tedarik ve Satış sekmelerinde. Hepsini Al/Sat butonları ana ekranda.';
    if (id === 'hakan') { var c = G.combo(); return 'Kombo: ' + c + ' tık' + (G.comboBonus() > 0 ? ' · +' + pct(G.comboBonus()) + ' kondisyon' : ' (5+ tıkla başlar)'); }
    if (id === 'nurten') {
      if (G.offer && G.offer.id === 'nurten') return 'Teklif masada!';
      var w = Math.max(S.nextOffer, S.cd.nurten || 0) - S.t;
      return 'Sonraki teklif: ' + G.fmtTime(Math.max(0, w));
    }
    if (id === 'can') {
      if (G.buff('kampanya')) return 'Kampanya sürüyor: ' + G.fmtTime(G.buffLeft('kampanya'));
      var cd = (S.cd.kampanya || 0) - S.t;
      return cd > 0 ? 'Yeni kampanya: ' + G.fmtTime(cd) : 'Kampanya hazır, ana ekrandaki butona bas.';
    }
    if (id === 'selin') return '3 saniyede bir en ucuz satış kanalına personel ekliyor.';
    if (id === 'deniz') return 'Olumsuz olaylar yarı sürede bitiyor.';
    return '';
  }
  function crewHtml() {
    var S = G.S, h = '<p class="hint">Bir kere işe alınır, kalıcıdır. Her biri oyuna yeni bir mekanik ekler.</p>';
    var shown = 0;
    D.CREW.forEach(function (c) {
      var hired = !!S.crew[c.id];
      if (!hired && S.stats.earnedAll < c.cost * 0.1 && shown > 0) return;
      shown++;
      h += '<div class="card crew' + (hired ? ' hired' : S.cash >= c.cost ? ' can' : '') + '"><div class="ico">' + c.icon + '</div>' +
        '<div class="info"><div class="nm">' + c.name + (hired ? ' <span class="own">kadroda</span>' : '') + '</div><div class="ds">' + c.desc + '</div>' +
        (hired ? '<div class="meta"><span class="good">' + crewStatus(c.id) + '</span></div>' : '') + '</div>' +
        '<div class="act">' + (hired ? (c.id === 'can' ? '<button class="btn primary" data-act="campaign"' + (G.buff('kampanya') || (S.cd.kampanya || 0) > S.t ? ' disabled' : '') + '><small>Başlat</small><b>Kampanya</b></button>' : '') :
          '<button class="btn primary" data-act="hire" data-id="' + c.id + '"' + (S.cash < c.cost ? ' disabled' : '') + '><small>İşe al</small><b>' + tl(c.cost) + '</b></button>') + '</div></div>';
    });
    return h;
  }

  function holdingHtml() {
    var S = G.S, h = '';
    var gain = G.ipoGain(), can = G.canIpo();
    h += '<h4>Halka arz</h4><div class="card big-card ipo' + (can ? ' can' : '') + '"><div class="ico">📈</div><div class="info">' +
      '<div class="nm">Şirketi halka arz et</div>' +
      '<div class="ds">Her şey sıfırlanır: nakit, stok, birimler, yükseltmeler, çağ. Karşılığında hisse alırsın. Her hisse tüm otomatik hızlara kalıcı +%2 ekler.</div>' +
      '<div class="meta"><span>Bu turda kazanç: ' + tl(S.stats.earned) + ' / ' + tl(D.IPO_MIN) + '</span><span class="good">Alacağın hisse: ' + gain + '</span>' +
      '<span>Sahip olduğun: ' + S.shares + ' hisse (+' + pct(D.SHARE_BONUS * S.shares) + ')</span></div></div>' +
      '<div class="act"><button class="btn primary" data-act="ipo"' + (can ? '' : ' disabled') + '><small>Zili çal</small><b>Halka Arz</b></button></div></div>';
    h += '<div class="perks">';
    D.PERKS.forEach(function (p) {
      var on = S.shares >= p.need;
      h += '<div class="perk' + (on ? ' on' : '') + '"><b>' + p.need + ' hisse</b><span>' + p.name + '</span><small>' + p.desc + '</small></div>';
    });
    h += '</div>';

    var achN = Object.keys(S.ach).length;
    h += '<h4>Başarımlar <span class="tag">' + achN + ' / ' + G.ACH.length + ' · her biri +%1 hız</span></h4><div class="achs">';
    G.ACH.forEach(function (a) {
      var on = !!S.ach[a.id];
      h += '<div class="ach' + (on ? ' on' : '') + '" title="' + a.name + ': ' + a.desc + '"><span>' + (on ? a.icon : '🔒') + '</span><small>' + (on ? a.name : '???') + '</small></div>';
    });
    h += '</div>';

    var st = S.stats;
    h += '<h4>İstatistik</h4><div class="stats-list">' +
      row('Bu turda kazanç', tl(st.earned)) + row('Tüm zamanlar kazanç', tl(st.earnedAll)) +
      row('Alınan telefon', f(st.bought)) + row('Satılan telefon', f(st.sold)) +
      row('Tıklama', f(st.clicks)) + row('Bu tur süresi', G.fmtTime(st.play)) + row('Toplam süre', G.fmtTime(st.playAll)) +
      row('Halka arz', st.ipos) + row('Kabul edilen müşteri', st.customers) + row('Başarısız söküm', st.fails) + '</div>';

    h += '<h4>Ayarlar</h4><div class="settings">' +
      '<button class="btn ghost" data-act="sound">' + (S.sound ? '🔊 Ses açık' : '🔇 Ses kapalı') + '</button>' +
      '<button class="btn ghost" data-act="export">⬆️ Kaydı dışa aktar</button>' +
      '<button class="btn ghost" data-act="import">⬇️ Kayıt yükle</button>' +
      '<button class="btn danger" data-act="reset">Sıfırdan başla</button></div>' +
      '<p class="hint">Oyun tarayıcına 10 saniyede bir kaydedilir. Başka cihaza taşımak için dışa aktar.</p>';
    return h;
    function row(a, b) { return '<div><span>' + a + '</span><b>' + b + '</b></div>'; }
  }

  function tabBadges() {
    var S = G.S;
    var anyUnit = function (kind) {
      var list = kind === 's' ? D.SUPPLIERS : D.CHANNELS;
      for (var i = 0; i < list.length; i++) if (G.unitCost(kind, i) <= S.cash && (S.stats.earnedAll >= list[i].cost * 0.25 || i === 0)) return true;
      return false;
    };
    var upg = G.upgradesAvailable().some(function (u) { return u.cost <= S.cash; }) ||
      (G.nextEra() && S.cash >= G.nextEra().cost) || (G.nextDepot() && S.cash >= G.nextDepot().cost) ||
      G.partsAvailable().some(function (p) { return S.stock >= p.phones; });
    var crew = D.CREW.some(function (c) { return !S.crew[c.id] && S.cash >= c.cost; });
    return { tedarik: anyUnit('s'), satis: anyUnit('c'), yukselt: upg, ekip: crew, holding: G.canIpo() };
  }

  function renderPanel() {
    if (pressed) return;
    var html = tab === 'tedarik' ? unitsHtml('s') : tab === 'satis' ? unitsHtml('c') :
      tab === 'yukselt' ? upgradesHtml() : tab === 'ekip' ? crewHtml() : holdingHtml();
    setHtml($('panel'), 'panel', html);
    var b = tabBadges();
    document.querySelectorAll('.tabs button').forEach(function (btn) {
      btn.classList.toggle('on', btn.dataset.tab === tab);
      btn.classList.toggle('dot', !!b[btn.dataset.tab]);
    });
  }

  function renderEmpire() {
    var S = G.S, h = '';
    h += '<div class="era-now"><div class="thumb">' + G.ART.phone(S.era) + '</div><div><small>Şu anki çağ</small><b>' + G.era().name + '</b>' +
      '<small>Alış ' + tl(G.buyPrice()) + ' · Satış ' + tl(G.sellPrice()) + '</small></div></div>';
    function tiles(title, list, owned, rateFn) {
      var t = '', any = false;
      list.forEach(function (u, i) {
        if (!owned[i]) return;
        any = true;
        t += '<div class="tile" title="' + u.name + '"><span class="ti">' + u.icon + '</span><b>' + owned[i] + '</b><small>' + fr(rateFn(i)) + '/sn</small></div>';
      });
      return '<h4>' + title + '</h4>' + (any ? '<div class="tiles">' + t + '</div>' : '<p class="hint">Henüz yok.</p>');
    }
    h += tiles('Tedarik', D.SUPPLIERS, S.sup, G.supRate);
    h += tiles('Satış noktaları', D.CHANNELS, S.chan, G.chanRate);
    if (S.shares) h += '<p class="hint">📈 ' + S.shares + ' hisse · otomatik hız +' + pct(D.SHARE_BONUS * S.shares + D.ACH_BONUS * Object.keys(S.ach).length) + '</p>';
    setHtml($('empire'), 'empire', h);
    var lh = logItems.length ? logItems.map(function (l) { return '<li class="' + l.tone + '"><time>' + l.t + '</time>' + l.text + '</li>'; }).join('')
      : '<li class="muted">Olaylar burada görünecek.</li>';
    setHtml($('log'), 'log', lh);
  }

  function flowStatus() {
    var S = G.S, sup = G.supTotal(), ch = G.chanTotal();
    if (sup === 0 && ch === 0) return ['İpucu: <b>AL</b> ile telefon al, <b>SAT</b> ile sat. Kâr = satış − alış. Sonra Tedarik ve Satış sekmelerinden otomasyon kur.', ''];
    if (sup > 0 && G.space() < 1) return ['📦 Depo dolu, tedarik durdu. Satış kanalı ekle ya da depoyu büyüt.', 'warn'];
    if (sup > 0 && S.cash < G.buyPrice() * 0.9) return ['💸 Nakit bitti, tedarikçiler alım yapamıyor.', 'bad'];
    if (ch > 0 && S.stock < 1 && sup < ch) return ['🛒 Stok tükendi, satış kanalları boşta bekliyor. Tedarik ekle ya da AL\'a bas.', 'warn'];
    if (ch === 0) return ['Telefonlar birikiyor. Satış sekmesinden bir kanal aç.', 'warn'];
    if (sup === 0) return ['Kanallar satacak mal bekliyor. Tedarik sekmesinden tedarikçi al.', 'warn'];
    return ['Dükkân dönüyor.', 'good'];
  }

  var BUFFS = [
    ['kampanya', '📣 Kampanya', 'good'], ['yeniModel', '🆕 Yeni model', 'good'], ['efsane', '🏷️ Efsane Cuma', 'good'],
    ['kur', '💱 Kur şoku', 'warn'], ['gumruk', '🛃 Gümrük', 'bad']
  ];

  function render() {
    var S = G.S;
    $('vCash').textContent = tl(S.cash);
    var pr = G.rt.profit;
    $('vProfit').textContent = (pr >= 0 ? '+' : '') + tl(pr) + '/sn';
    $('vProfit').className = pr >= 0 ? 'good' : 'bad';
    $('vStock').textContent = f(S.stock);
    $('vDepot').textContent = '/ ' + f(G.depotCap()) + ' · ' + D.DEPOTS[S.depot].name;
    $('barStock').style.width = Math.min(100, S.stock / G.depotCap() * 100) + '%';
    var ce = G.condEff(), gr = G.grade(ce);
    $('vGrade').textContent = gr.g + ' · ' + gr.label;
    $('vCond').textContent = pct(ce) + ' kondisyon' + (G.comboBonus() > 0 ? ' (kombo)' : '');
    $('vGrade').dataset.g = gr.g;

    var drawer = G.drawerMode();
    var art = drawer ? 'drawer' : 'e' + S.era;
    if ($('artPhone').dataset.art !== art) {
      $('artPhone').dataset.art = art;
      $('artPhone').innerHTML = drawer ? G.ART.drawer : G.ART.phone(S.era);
    }
    $('lblBuy').textContent = drawer ? 'ÇEKMECEYİ KARIŞTIR' : 'AL';
    var pb = G.clickPower('buy'), ps = G.clickPower('sell');
    $('vBuyPrice').textContent = drawer ? 'Bedava eski telefon bul' : (pb > 1 ? pb + ' adet · ' : '') + '−' + tl(G.buyPrice()) + ' / adet';
    $('vSellPrice').textContent = (ps > 1 ? ps + ' adet · ' : '') + '+' + tl(G.sellPrice()) + ' / adet';
    var margin = G.sellPrice() - G.buyPrice();
    $('vMargin').textContent = 'Tıklama marjı: ' + (margin >= 0 ? '+' : '') + tl(margin) + ' / telefon';

    var combo = G.combo();
    $('combo').textContent = S.crew.hakan && combo >= 5 ? 'KOMBO ×' + combo + ' · +' + pct(G.comboBonus()) + ' kondisyon' : '';

    var sup = G.supTotal(), ch = G.chanTotal(), mx = Math.max(sup, ch, 0.0001);
    $('barBuy').style.width = (sup / mx * 100) + '%';
    $('barSell').style.width = (ch / mx * 100) + '%';
    $('vBuyRate').textContent = fr(sup) + ' tel/sn';
    $('vSellRate').textContent = fr(ch) + ' tel/sn';
    var fs = flowStatus();
    $('flowMsg').innerHTML = fs[0];
    $('flowMsg').className = 'flowmsg ' + fs[1];

    var q = '';
    if (S.crew.mudur) q += '<button class="btn ghost" data-act="buyAll">📥 Hepsini Al</button><button class="btn ghost" data-act="sellAll">📤 Hepsini Sat</button>';
    if (S.crew.can) {
      var cd = (S.cd.kampanya || 0) - S.t;
      q += '<button class="btn ' + (cd > 0 ? 'ghost' : 'primary') + '" data-act="campaign"' + (cd > 0 ? ' disabled' : '') + '>📣 ' +
        (G.buff('kampanya') ? 'Kampanya ' + G.fmtTime(G.buffLeft('kampanya')) : cd > 0 ? 'Kampanya ' + G.fmtTime(cd) : 'Kampanya başlat') + '</button>';
    }
    setHtml($('quick'), 'quick', q);

    var bh = '';
    BUFFS.forEach(function (b) { if (G.buff(b[0])) bh += '<span class="buff ' + b[2] + '">' + b[1] + ' ' + Math.ceil(G.buffLeft(b[0])) + ' sn</span>'; });
    setHtml($('buffs'), 'buffs', bh);

    $('eraChip').textContent = G.era().name;
    renderOffer();
  }

  function renderOffer() {
    var o = G.offer, card = $('eventCard');
    if (!o) { if (!card.hidden) card.hidden = true; return; }
    if (card.dataset.id !== o.id + o.until) {
      card.dataset.id = o.id + o.until;
      card.innerHTML = '<div class="ev-title">' + o.title + '</div><div class="ev-text">' + o.text + '</div>' +
        '<div class="ev-row"><button class="btn primary" id="evAccept">' + o.btn + '</button><button class="btn ghost" id="evSkip">Geç</button></div>' +
        '<div class="ev-bar"><i id="evBar"></i></div>';
      $('evAccept').onclick = function () { G.acceptOffer(); G.sfx('sell'); render(); };
      $('evSkip').onclick = function () { G.offer = null; render(); };
      card.hidden = false;
    }
    $('evBar').style.width = Math.max(0, (o.until - G.S.t) / o.dur * 100) + '%';
  }

  // ---------- olay dinleyicileri ----------
  G.on(function (type, d) {
    if (type === 'unit') { G.sfx('unit'); }
    if (type === 'upgrade') { G.sfx('upgrade'); addLog('⚡ ' + d.name + ' alındı', 'good'); }
    if (type === 'era') { G.sfx('era'); addLog('📱 ' + d.name + ' çağına geçildi', 'good'); toast('<b>Yeni çağ!</b> ' + d.name, 'gold', 5000); }
    if (type === 'depot') { G.sfx('upgrade'); addLog('🏚️ Depo büyüdü: ' + d.name, 'good'); }
    if (type === 'hire') { G.sfx('upgrade'); addLog(d.icon + ' ' + d.name + ' işe alındı', 'good'); }
    if (type === 'dispose') { addLog('🔑 ' + d.n + ' birim devredildi: +' + tl(d.v), ''); }
    if (type === 'part') {
      if (d.ok) { G.sfx('upgrade'); addLog('🪛 ' + d.p.name + ' tuttu: +' + pct(d.p.gain) + ' kondisyon', 'good'); toast('🪛 <b>' + d.p.name + '</b> tuttu! +' + pct(d.p.gain) + ' kondisyon', 'good'); }
      else { G.sfx('fail'); addLog('💥 ' + d.p.name + ' tutmadı, ' + f(d.p.phones) + ' telefon gitti', 'bad'); toast('💥 <b>' + d.p.name + '</b> tutmadı. Telefonlar gitti.', 'bad'); }
    }
    if (type === 'ach') { G.sfx('ach'); addLog('🏅 Başarım: ' + d.name, 'gold'); toast(d.icon + ' <b>Başarım:</b> ' + d.name + '<br><small>' + d.desc + '</small>', 'gold', 5000); }
    if (type === 'log') { addLog(d.text, d.tone); if (d.big) { toast(d.text, d.tone); G.sfx('event'); } }
    if (type === 'offer') { G.sfx('event'); }
    if (type === 'ipo') { addLog('📈 Halka arz tamam: +' + d.gain + ' hisse', 'gold'); }
  });

  // ---------- panel tıklamaları ----------
  function onPanelClick(e) {
    var b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    var a = b.dataset.act, S = G.S;
    if (a === 'unit') G.buyUnit(b.dataset.k, +b.dataset.i);
    else if (a === 'mode') { if (S.crew.mudur) S.buyMode = b.dataset.v === 'max' ? 'max' : +b.dataset.v; else toast('×10 ve Maks için <b>Mağaza Müdürü</b> gerekir (Ekip sekmesi).', ''); }
    else if (a === 'dispose') {
      var k = b.dataset.k, i = +b.dataset.i, u = (k === 's' ? D.SUPPLIERS : D.CHANNELS)[i];
      modal('Devret: ' + u.name, 'Tüm ' + u.name + ' birimlerini (' + (k === 's' ? S.sup : S.chan)[i] + ' adet) elden çıkarırsın ve harcadığın paranın yarısını, <b>' + tl(G.refundValue(k, i)) + '</b> geri alırsın.',
        [{ label: 'Vazgeç' }, { label: 'Devret', danger: true, fn: function () { G.disposeUnit(k, i); } }]);
    }
    else if (a === 'upg') G.buyUpgrade(b.dataset.id);
    else if (a === 'era') G.buyEra();
    else if (a === 'depot') G.buyDepot();
    else if (a === 'part') G.tryPart(b.dataset.id);
    else if (a === 'hire') G.hire(b.dataset.id);
    else if (a === 'campaign') G.campaign();
    else if (a === 'buyAll') { var n = G.buyAll(); if (n) { G.sfx('buy'); floatText('+' + f(n) + ' 📱', 'buyf', e.clientX, e.clientY); } }
    else if (a === 'sellAll') { var v = G.sellAll(); if (v) { G.sfx('sell'); floatText('+' + tl(v), 'sellf', e.clientX, e.clientY); } }
    else if (a === 'sound') S.sound = !S.sound;
    else if (a === 'ipo') {
      modal('Halka arz', 'Şirketin borsaya açılıyor. <b>' + G.ipoGain() + ' hisse</b> alacaksın ve her şey sıfırlanacak (başarımlar ve hisseler kalır). Emin misin?',
        [{ label: 'Vazgeç' }, { label: 'Zili çal 🔔', primary: true, fn: function () { G.doIpo(); G.save(); G.sfx('era'); lastHtml = {}; } }]);
    }
    else if (a === 'export') {
      modal('Kaydı dışa aktar', '<p>Bu metni güvenli bir yere kopyala. Başka cihazda "Kayıt yükle" ile açabilirsin.</p><textarea id="expTxt" readonly>' + G.exportSave() + '</textarea>',
        [{ label: 'Kopyala', primary: true, fn: function () { var t = $('expTxt'); t.select(); try { navigator.clipboard.writeText(t.value); } catch (x) { document.execCommand('copy'); } toast('Kopyalandı', 'good'); } }, { label: 'Kapat' }]);
    }
    else if (a === 'import') {
      modal('Kayıt yükle', '<p>Dışa aktardığın metni yapıştır. Mevcut ilerlemenin üzerine yazılır.</p><textarea id="impTxt"></textarea>',
        [{ label: 'Vazgeç' }, { label: 'Yükle', primary: true, fn: function () {
          if (G.importSave($('impTxt').value)) { lastHtml = {}; toast('Kayıt yüklendi', 'good'); return true; }
          toast('Kayıt okunamadı', 'bad'); return false;
        } }]);
    }
    else if (a === 'reset') {
      modal('Sıfırdan başla', 'Tüm ilerleme, hisseler ve başarımlar silinir. Geri alınamaz.',
        [{ label: 'Vazgeç' }, { label: 'Her şeyi sil', danger: true, fn: function () { G.hardReset(); lastHtml = {}; logItems = []; } }]);
    }
    render(); renderPanel(); renderEmpire();
  }

  // ---------- kurulum ----------
  function init() {
    $('logo').innerHTML = G.ART.logo;
    $('artCash').innerHTML = G.ART.cash;
    var away = G.load();
    if (away) {
      var r = G.offline(away);
      if (r && r.cash > 0) {
        modal('Sen yokken dükkân açıktı', '<p><b>' + G.fmtTime(r.sec) + '</b> boyunca ekip çalıştı (yarı verimle).</p>' +
          '<div class="offline-sum"><div><span>Satılan telefon</span><b>' + f(r.sold) + '</b></div><div><span>Kasaya giren net</span><b class="good">+' + tl(r.cash) + '</b></div></div>');
      }
    }
    addLog('🔓 Dükkân açıldı. Hayırlı işler!', '');

    $('btnBuy').addEventListener('click', onBuy);
    $('btnSell').addEventListener('click', onSell);
    document.addEventListener('pointermove', function (e) { lastPointer = { x: e.clientX, y: e.clientY }; }, { passive: true });
    $('panel').addEventListener('pointerdown', function () { pressed = true; });
    document.addEventListener('pointerup', function () { setTimeout(function () { pressed = false; }, 0); });
    $('panel').addEventListener('click', onPanelClick);
    $('quick').addEventListener('click', onPanelClick);
    document.querySelectorAll('.tabs button').forEach(function (b) {
      b.addEventListener('click', function () { tab = b.dataset.tab; lastHtml.panel = null; renderPanel(); });
    });
    $('btnSound').addEventListener('click', function () { G.S.sound = !G.S.sound; soundIcon(); });
    $('modal').addEventListener('click', function (e) { if (e.target.id === 'modal') closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.repeat || e.target.tagName === 'TEXTAREA' || e.metaKey || e.ctrlKey) return;
      if (e.key === 'a' || e.key === 'A') onBuy({});
      if (e.key === 's' || e.key === 'S') onSell({});
    });
    function soundIcon() { $('btnSound').textContent = G.S.sound ? '🔊' : '🔇'; }
    soundIcon();

    var lastT = performance.now();
    setInterval(function () {
      var now = performance.now(), dt = (now - lastT) / 1000;
      lastT = now;
      if (dt > 30) { G.offline(dt); return; }   // sekme uzun süre arka planda kaldıysa
      while (dt > 0) { var d = Math.min(0.1, dt); G.tick(d); dt -= d; }
    }, 100);
    setInterval(function () { renderPanel(); renderEmpire(); soundIcon(); }, 250);
    setInterval(G.save, 10000);
    addEventListener('beforeunload', G.save);
    document.addEventListener('visibilitychange', function () { if (document.hidden) G.save(); });
    (function loop() { render(); requestAnimationFrame(loop); })();
    renderPanel(); renderEmpire();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
