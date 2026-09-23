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
  function unitList(kind) { return kind === 's' ? D.SUPPLIERS : D.CHANNELS; }

  // ---------- efektler ----------
  var lastPointer = { x: innerWidth / 2, y: innerHeight / 2 };
  function floatText(text, cls, x, y) {
    var el = document.createElement('div');
    el.className = 'float ' + (cls || '');
    el.textContent = text;
    el.style.left = (x + (Math.random() * 30 - 15)) + 'px';
    el.style.top = (y - 14) + 'px';
    $('fx').appendChild(el);
    setTimeout(function () { el.remove(); }, 950);
  }
  function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
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
    m.innerHTML = '<div class="modal-box" role="dialog" aria-modal="true"><h3>' + title + '</h3><div class="modal-body">' + body + '</div><div class="modal-btns"></div></div>';
    var box = m.querySelector('.modal-btns');
    (buttons || [{ label: 'Tamam', primary: true }]).forEach(function (b) {
      var btn = document.createElement('button');
      btn.className = 'btn ' + (b.primary ? 'red' : b.danger ? 'red' : '');
      btn.textContent = b.label;
      btn.onclick = function () { if (b.fn && b.fn() === false) return; closeModal(); };
      box.appendChild(btn);
    });
    m.hidden = false;
    var last = box.lastChild; if (last) last.focus();
  }
  function closeModal() { $('modal').hidden = true; }
  G.modal = modal;

  // ---------- tıklama ----------
  function onBuy(e) {
    var r = G.clickBuy();
    var x = e.clientX || lastPointer.x, y = e.clientY || lastPointer.y;
    if (r.free) { floatText('+1 bedava', 'free', x, y); G.sfx('buy'); }
    else if (r.n > 0) { floatText('+' + f(r.n) + ' telefon', 'buyf', x, y); G.sfx('buy'); }
    else { floatText(r.full ? 'Depo dolu' : 'Nakit yetmiyor', 'bad', x, y); G.sfx('empty'); }
    restart($('btnBuy'), 'bump'); restart($('btnBuy'), 'flick');
    render();
  }
  function onSell(e) {
    var r = G.clickSell();
    var x = e.clientX || lastPointer.x, y = e.clientY || lastPointer.y;
    if (r.n > 0) { floatText('+' + tl(r.rev), 'sellf', x, y); G.sfx('sell'); }
    else { floatText('Stok yok', 'bad', x, y); G.sfx('empty'); }
    restart($('btnSell'), 'bump'); restart($('btnSell'), 'flick');
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
        (lock ? ' title="Mağaza Müdürü gerekir"' : '') + '>' + l + (lock ? G.icon('kilit') : '') + '</button>';
    }
    return '<div class="modebar"><span>Alım miktarı</span>' + b(1, '×1') + b(10, '×10') + b('max', 'Maks') + '</div>';
  }
  function unitsHtml(kind) {
    var S = G.S, isS = kind === 's';
    var list = unitList(kind), owned = isS ? S.sup : S.chan;
    var vis = visibleCount(list, owned);
    var bp = G.buyPrice(true), sp = G.sellPrice(true);  // standart değerler, olaylar hariç
    var h = modeBar();
    h += isS
      ? '<p class="hint">Tedarikçiler saniyede telefon alır ve parasını kasadan öder. Alış çarpanı düşük olan daha ucuza alır.</p>'
      : '<p class="hint">Satış noktaları stoktaki telefonları kendiliğinden satar. Satış çarpanı yüksek olan daha kârlı satar.</p>';
    for (var i = 0; i < vis; i++) {
      var u = list[i], n = owned[i];
      var amt = G.buyAmount(kind, i), cost = G.unitCost(kind, i, amt);
      var one = isS ? G.supRateOne(i, true) : G.chanRateOne(i, true);
      var unitPrice = isS ? bp * u.mult : sp * u.mult;
      var ri = G.retireInfo(kind, i);
      var good = isS ? u.mult < 1 : u.mult >= 1;
      var lit = cost <= S.cash || ri.ready;
      var best = isRec(kind, i);
      h += '<div class="row' + (lit ? ' lit' : '') + (isS ? '' : ' sell') + (best ? ' best' : '') + '">' +
        (best ? '<span class="best-tag">Şimdi en iyi yatırım</span>' : '') +
        '<div class="row-ico">' + G.icon(u.id) + '</div>' +
        '<div class="row-body"><div class="row-name">' + u.name + '</div>' +
        '<div class="row-desc">' + u.desc + '</div>' +
        '<div class="row-meta"><span>+' + fr(one) + ' tel/sn</span>' +
        '<span class="' + (good ? 'pos' : 'neg') + '">' + (isS ? 'alış ' : 'satış ') + mult(u.mult) + ' · ' + tl(unitPrice) + '</span>' +
        (n ? '<span>toplam ' + fr(one * n) + '/sn</span>' : '') +
        (ri.done ? '<span class="vet">Tecrübe alındı</span>' : ri.ready ? '' : '<span>' + n + '/' + ri.need + ' birimde +' + pct(ri.gain) + ' kondisyon</span>') +
        '</div></div>' +
        '<div class="row-count">' + (n || '') + '</div>' +
        '<div class="row-act"><button class="btn ' + (isS ? 'blue' : 'red') + '" data-act="unit" data-k="' + kind + '" data-i="' + i + '"' + (cost > S.cash ? ' disabled' : '') + '>' +
        '<small>' + (n ? 'Al' : 'Aç') + ' ×' + amt + '</small><b>' + tl(cost) + '</b></button>' +
        (ri.ready ? '<button class="btn vet" data-act="retire" data-k="' + kind + '" data-i="' + i + '"><small>' + ri.need + ' birim ver</small><b>+' + pct(ri.gain) + ' kondisyon</b></button>' : '') +
        (n ? '<button class="linkbtn" data-act="dispose" data-k="' + kind + '" data-i="' + i + '">Hepsini devret</button>' : '') +
        '</div></div>';
    }
    if (vis < list.length) {
      var nx = list[vis];
      h += '<div class="row locked"><div class="row-ico">' + G.icon('kilit') + '</div><div class="row-body"><div class="row-name">Kapalı tabela</div>' +
        '<div class="row-desc">Toplam ' + tl(nx.cost * 0.25) + ' kazanınca açılır.</div></div></div>';
    }
    h += '<p class="hint"><b>Tecrübeye çevir:</b> bir türden yeterince birimin olunca bir kısmını kapatıp kalıcı kondisyon kazanırsın. Her tür için turda bir kez.</p>';
    return h;
  }

  function upgradesHtml() {
    var S = G.S, h = '';
    var e = G.nextEra();
    h += '<h4>Telefon çağı</h4>';
    if (e) {
      var eOk = S.cash >= e.cost;
      h += '<div class="row feature' + (eOk ? ' lit' : '') + '">' +
        '<div class="row-ico">' + G.ART.phone(S.era + 1) + '</div>' +
        '<div class="row-body"><div class="row-name">' + e.name + ' çağına geç</div>' +
        '<div class="row-desc">Alış ' + tl(e.buy) + ', temel satış ' + tl(e.sell) + ' olur. Telefon başı kâr yaklaşık ×' + ((e.sell - e.buy) / (G.era().sell - G.era().buy)).toFixed(1).replace('.', ',') + '.</div></div>' +
        '<div class="row-count"></div>' +
        '<div class="row-act"><button class="btn red" data-act="era"' + (eOk ? '' : ' disabled') + '><small>Çağ atla</small><b>' + tl(e.cost) + '</b></button></div></div>';
    } else h += '<p class="hint">Son çağdasın. Buradan sonrası uzay.</p>';

    var d = G.nextDepot();
    h += '<h4>Depo</h4>';
    if (d) {
      var dOk = S.cash >= d.cost;
      var bestD = adv && adv.rec && adv.rec.type === 'depot';
      h += '<div class="row feature depot' + (dOk ? ' lit' : '') + (bestD ? ' best' : '') + '">' + (bestD ? '<span class="best-tag">Şimdi en iyi yatırım</span>' : '') + '<div class="row-ico">' + G.icon('depo') + '</div>' +
        '<div class="row-body"><div class="row-name">' + d.name + '</div><div class="row-desc">Kapasite ' + f(G.depotCap()) + ' → ' + f(d.cap) + ' telefon.</div></div>' +
        '<div class="row-count"></div>' +
        '<div class="row-act"><button class="btn blue" data-act="depot"' + (dOk ? '' : ' disabled') + '><small>Büyüt</small><b>' + tl(d.cost) + '</b></button></div></div>';
    } else h += '<p class="hint">En büyük depo sende.</p>';

    var ups = G.upgradesAvailable();
    h += '<h4>Nakit yükseltmeleri</h4>';
    if (!ups.length) h += '<p class="hint">Daha çok kazandıkça ve birim aldıkça yeni yükseltmeler açılır.</p>';
    h += '<div class="tags">';
    ups.forEach(function (u) {
      var ok = u.cost <= S.cash;
      var bestU = adv && adv.rec && adv.rec.type === 'upg' && adv.rec.id === u.id;
      h += '<button class="pricetag' + (ok ? ' can' : '') + (bestU ? ' best' : '') + '" data-act="upg" data-id="' + u.id + '"' + (ok ? '' : ' disabled') + '>' +
        '<span class="pt-name">' + u.name + '</span><span class="pt-desc">' + u.desc + '</span><span class="pt-price">' + tl(u.cost) + '</span></button>';
    });
    h += '</div>';

    var parts = G.partsAvailable();
    h += '<h4>Parça için sök <span class="tag">stoktan ödenir, şansa bağlı</span></h4>';
    h += '<p class="hint">Stoktaki telefonları söküp parçalarını kullanırsın. Tutarsa kondisyon kalıcı artar, tutmazsa telefonlar gider. Tekrar denenebilir.</p>';
    parts.forEach(function (p) {
      var tooBig = p.phones > G.depotCap(), ok = S.stock >= p.phones;
      h += '<div class="row' + (ok ? ' lit' : '') + '"><div class="row-ico">' + G.icon('sok') + '</div>' +
        '<div class="row-body"><div class="row-name">' + p.name + '</div><div class="row-desc">' + p.desc + '</div>' +
        '<div class="row-meta"><span>' + f(p.phones) + ' telefon</span><span class="neg">%' + Math.round(G.partChance(p) * 100) + ' şans</span><span class="pos">+' + pct(p.gain) + ' kondisyon</span>' +
        (tooBig ? '<span class="neg">Depo yetmiyor</span>' : '') + '</div></div>' +
        '<div class="row-count"></div>' +
        '<div class="row-act"><button class="btn yellow" data-act="part" data-id="' + p.id + '"' + (ok ? '' : ' disabled') + '><small>Sök</small><b>' + f(p.phones) + ' telefon</b></button></div></div>';
    });
    if (!parts.length) h += '<p class="hint">Tüm parça yükseltmeleri tamam. Kondisyon: ' + pct(S.cond) + '</p>';
    return h;
  }

  function crewStatus(id) {
    var S = G.S;
    if (id === 'mudur') return 'Alım modu Tedarik ve Satış sekmelerinde, Toplu al/sat tezgâhta.';
    if (id === 'hakan') return 'Kondisyon +%10, parça sökme şansı +%15.';
    if (id === 'nurten') {
      if (G.offer && G.offer.id === 'nurten') return 'Teklif masada.';
      var w = Math.max(S.nextOffer, S.cd.nurten || 0) - S.t;
      return 'Sonraki teklif: ' + G.fmtTime(Math.max(0, w));
    }
    if (id === 'can') {
      if (G.buff('kampanya')) return 'Kampanya sürüyor: ' + G.fmtTime(G.buffLeft('kampanya'));
      var cd = (S.cd.kampanya || 0) - S.t;
      return cd > 0 ? 'Yeni kampanya: ' + G.fmtTime(cd) : 'Kampanya hazır.';
    }
    if (id === 'selin') return '3 saniyede bir en ucuz satış noktasına personel ekliyor.';
    if (id === 'deniz') return 'Alışlar %5 ucuz, devretme iadesi %75, olumsuz olaylar yarı sürede.';
    return '';
  }
  function crewHtml() {
    var S = G.S, h = '<p class="hint">Bir kere işe alınır, kalıcıdır. Her biri oyuna yeni bir mekanik ekler.</p><div class="badges">';
    var shown = 0;
    D.CREW.forEach(function (c) {
      var hired = !!S.crew[c.id], ok = S.cash >= c.cost;
      if (!hired && S.stats.earnedAll < c.cost * 0.1 && shown > 0) return;
      shown++;
      var campOff = G.buff('kampanya') || (S.cd.kampanya || 0) > S.t;
      h += '<div class="badge' + (hired ? ' hired' : ok ? ' can' : '') + '">' +
        (hired ? '<span class="lanyard">Kadroda</span>' : '') +
        '<div class="badge-photo">' + G.icon(c.id) + '</div>' +
        '<div><div class="row-name">' + c.name + '</div><div class="row-desc">' + c.desc + '</div>' +
        (hired ? '<div class="status">' + crewStatus(c.id) + '</div>' : '') +
        (hired ? (c.id === 'can' ? '<button class="btn red inline" data-act="campaign"' + (campOff ? ' disabled' : '') + '>Kampanya başlat</button>' : '') :
          '<button class="btn ' + (ok ? 'blue' : '') + '" data-act="hire" data-id="' + c.id + '"' + (ok ? '' : ' disabled') + '><small>İşe al</small><b>' + tl(c.cost) + '</b></button>') +
        '</div></div>';
    });
    return h + '</div>';
  }

  function holdingHtml() {
    var S = G.S, h = '';
    var gain = G.ipoGain(), can = G.canIpo();
    h += '<h4>Halka arz</h4><div class="ipo">' + G.icon('borsa') +
      '<div><div class="row-name">Şirketi halka arz et</div>' +
      '<div class="row-desc">Nakit, stok, birimler, yükseltmeler ve çağ sıfırlanır. Karşılığında hisse alırsın; her hisse tüm otomatik hızlara kalıcı +%2 ekler.</div>' +
      '<div class="row-meta"><span>Bu turda: ' + tl(S.stats.earned) + ' / ' + tl(D.IPO_MIN) + '</span><span>Alacağın: <b>' + gain + ' hisse</b></span>' +
      '<span>Elinde: ' + S.shares + ' hisse (+' + pct(D.SHARE_BONUS * S.shares) + ')</span></div></div>' +
      '<button class="btn yellow" data-act="ipo"' + (can ? '' : ' disabled') + '><small>Zili çal</small><b>Halka arz</b></button></div>';
    h += '<div class="perks">';
    D.PERKS.forEach(function (p) {
      var on = S.shares >= p.need;
      h += '<div class="perk' + (on ? ' on' : '') + '"><b>' + p.need + ' hisse</b><span>' + p.name + '</span>' + p.desc + '</div>';
    });
    h += '</div>';

    var achN = Object.keys(S.ach).length;
    h += '<h4>Başarımlar <span class="tag">' + achN + ' / ' + G.ACH.length + ' · her biri +%1 hız</span></h4><div class="stickers">';
    G.ACH.forEach(function (a) {
      var on = !!S.ach[a.id];
      h += '<div class="sticker' + (on ? ' on' : '') + '" title="' + (on ? a.name + ': ' : '') + a.desc + '">' + (on ? a.name : '?') + '</div>';
    });
    h += '</div>';

    var st = S.stats;
    h += '<h4>İstatistik</h4><div class="stats-list">' +
      row('Bu turda kazanç', tl(st.earned)) + row('Tüm zamanlar kazanç', tl(st.earnedAll)) +
      row('Alınan telefon', f(st.bought)) + row('Satılan telefon', f(st.sold)) +
      row('Tıklama', f(st.clicks)) + row('Bu tur süresi', G.fmtTime(st.play)) + row('Toplam süre', G.fmtTime(st.playAll)) +
      row('Halka arz', st.ipos) + row('Kabul edilen müşteri', st.customers) + row('Başarısız söküm', st.fails) + '</div>';

    h += '<h4>Ayarlar</h4><div class="settings">' +
      '<button class="btn inline" data-act="sound">' + (S.sound ? 'Sesi kapat' : 'Sesi aç') + '</button>' +
      '<button class="btn inline" data-act="export">Kaydı dışa aktar</button>' +
      '<button class="btn inline" data-act="import">Kayıt yükle</button>' +
      '<button class="btn inline red" data-act="reset">Sıfırdan başla</button></div>' +
      '<p class="hint">Oyun tarayıcına 10 saniyede bir kaydedilir. Başka cihaza taşımak için dışa aktar.</p>';
    return h;
    function row(a, b) { return '<div><span>' + a + '</span><b>' + b + '</b></div>'; }
  }

  function tabBadges() {
    var S = G.S;
    var anyUnit = function (kind) {
      var list = unitList(kind);
      for (var i = 0; i < list.length; i++) if (G.retireInfo(kind, i).ready || G.unitCost(kind, i) <= S.cash && (S.stats.earnedAll >= list[i].cost * 0.25 || i === 0)) return true;
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
      var need = adv && recTab(adv.rec) === btn.dataset.tab;
      btn.classList.toggle('need', !!need && btn.dataset.tab !== tab);
      btn.classList.toggle('dot', !need && !!b[btn.dataset.tab] && btn.dataset.tab !== tab);
    });
  }

  function renderEmpire() {
    var S = G.S, h = '<div class="wall">';
    h += '<div class="era-now"><div class="thumb">' + G.ART.phone(S.era) + '</div><div><b>' + G.era().name + '</b>' +
      '<small>Alış ' + tl(G.buyPrice()) + ' · Satış ' + tl(G.sellPrice()) + '</small></div></div>';
    function tiles(title, list, owned, rateFn, cls) {
      var t = '', any = false;
      list.forEach(function (u, i) {
        if (!owned[i]) return;
        any = true;
        t += '<div class="tile ' + cls + '" title="' + u.name + '">' + G.icon(u.id) + '<b>' + owned[i] + '</b><small>' + fr(rateFn(i)) + '/sn</small></div>';
      });
      return '<h4>' + title + '</h4>' + (any ? '<div class="tiles">' + t + '</div>' : '<p class="empty">Henüz yok.</p>');
    }
    h += tiles('Tedarik', D.SUPPLIERS, S.sup, function (i) { return G.supRate(i, true); }, 'buy');
    h += tiles('Satış noktaları', D.CHANNELS, S.chan, function (i) { return G.chanRate(i, true); }, 'sell');
    var bonus = D.SHARE_BONUS * S.shares + D.ACH_BONUS * Object.keys(S.ach).length;
    if (bonus > 0) h += '<p class="bonus">' + (S.shares ? S.shares + ' hisse ve ' : '') + Object.keys(S.ach).length + ' başarım: otomatik hız +' + pct(bonus) + '</p>';
    setHtml($('empire'), 'empire', h + '</div>');
    var lh = logItems.length ? logItems.map(function (l) { return '<li class="' + l.tone + '"><time>' + l.t + '</time><span>' + l.text + '</span></li>'; }).join('')
      : '<li><time>--:--</time><span class="muted">Olaylar burada görünecek.</span></li>';
    setHtml($('log'), 'log', lh);
  }

  // ---------- ne yapmalı ----------
  var adv = null;
  function sideLabel(side) { return side === 's' ? 'Tedarik' : side === 'c' ? 'Satış' : 'Yükselt'; }
  function sideTab(side) { return side === 's' ? 'tedarik' : side === 'c' ? 'satis' : 'yukselt'; }
  function recTab(r) { return !r ? null : r.type === 'unit' ? (r.kind === 's' ? 'tedarik' : 'satis') : 'yukselt'; }
  function renderAdvice() {
    adv = G.advice();
    var a = adv, r = a.rec, S = G.S;
    var tone = a.side === 'c' ? 'sell' : 'buy';
    var h = '<div class="adv-head ' + tone + '"><span class="adv-now">Şimdi</span>' + a.head + '</div>' +
      '<p class="adv-why">' + a.why + '</p>';
    if (r) {
      var ok = r.cost <= S.cash;
      var ico = r.type === 'era' ? G.ART.phone(S.era + 1) : r.type === 'unit' ? G.icon(unitList(r.kind)[r.i].id) : r.type === 'depot' ? G.icon('depo') : G.icon('borsa');
      var gainTxt = r.type === 'era' ? 'Telefon başı kâr ×' + r.ratio.toFixed(1).replace('.', ',') : r.type === 'depot' ? 'Kapasite ' + f(G.nextDepot().cap) : '+' + fr(r.gain) + ' tel/sn';
      h += '<button class="adv-rec ' + tone + (ok ? ' ok' : '') + '" data-act="rec">' +
        '<span class="adv-ico">' + ico + '</span>' +
        '<span class="adv-txt"><b>' + r.name + (r.m > 1 ? ' ×' + r.m : '') + '</b><small>' + gainTxt + ' · ' + tl(r.cost) + '</small></span>' +
        '<span class="adv-go">' + (ok ? 'Al' : a.eta ? G.fmtTime(a.eta) + ' sonra' : 'Biriktir') + '</span></button>';
    }
    if (a.extra) h += '<p class="adv-extra">' + a.extra + '</p>';
    setHtml($('advice'), 'advice', h);
    $('advice').className = 'advice ' + tone;
    var weak = a.balanced ? null : a.side;
    $('laneBuy').classList.toggle('weak', weak === 's');
    $('laneSell').classList.toggle('weak', weak === 'c' || weak === 'depot');
  }
  function isRec(kind, i) { var r = adv && adv.rec; return !!r && r.type === 'unit' && r.kind === kind && r.i === i; }

  var BUFFS = [
    ['kampanya', 'Kampanya', ''], ['yeniModel', 'Yeni model', ''], ['efsane', 'Efsane Cuma', ''],
    ['kur', 'Kur şoku', ''], ['gumruk', 'Gümrük', 'bad']
  ];

  // Bant: soluk katman kapasite, akan katman gerçekleşen akış.
  function setTrack(bar, cap, capacity, actual, max) {
    cap.style.width = (capacity / max * 100) + '%';
    bar.style.width = (Math.min(actual, capacity) / max * 100) + '%';
    bar.parentNode.classList.toggle('idle', actual <= 0.01);
    var dur = actual > 0 ? Math.max(0.12, Math.min(2.5, 2.5 / Math.log10(actual + 10))) : 1;
    bar.style.animationDuration = dur.toFixed(2) + 's';
  }
  // Kısa süreli olay farkı: standart değerin yanında parantez içinde. Çok küçük farklar gösterilmez.
  function bonusTxt(base, now, fmt) {
    var d = now - base;
    if (Math.abs(d) <= Math.max(0.05, Math.abs(base) * 0.005)) return '';
    return ' <em class="' + (d > 0 ? 'up' : 'down') + '">(' + (d > 0 ? '+' : '−') + fmt(Math.abs(d)) + ')</em>';
  }
  function rateText(base, now, capacity) {
    var cap = capacity > 0 && base < capacity * 0.99 ? ' · kapasite ' + fr(capacity) : '';
    return fr(base) + bonusTxt(base, now, fr) + '<small>tel/sn' + cap + '</small>';
  }

  function render() {
    var S = G.S;
    $('vCash').textContent = tl(S.cash);
    // Kâr/sn: standart kazanç hep görünür, olayların geçici etkisi parantez içinde.
    var fl = G.flow(), pr = fl.base.profit;
    setHtml($('vProfit'), 'vProfit', (pr >= 0 ? '+' : '') + tl(pr) + '/sn' + bonusTxt(pr, fl.profit, tl));
    $('vProfit').className = 'led-sub' + (pr < 0 ? ' neg' : '');
    $('vStock').textContent = f(S.stock);
    $('vDepot').textContent = fl.broke ? 'Kasa boş · tedarik parası kadar alıyor'
      : S.stock < 1 && fl.sell > 0.05 ? 'Gelen anında satılıyor'
      : fl.filling ? 'Depo doluyor · ' + G.fmtTime(fl.fillIn) + ' sonra dolar'
      : S.stock >= G.depotCap() * 0.5 && fl.base.buy < fl.base.sup ? 'Depo dolu (' + f(G.depotCap()) + ') · satıldıkça alınıyor'
      : 'Kapasite ' + f(G.depotCap()) + ' · ' + D.DEPOTS[S.depot].name;
    var fill = S.stock / G.depotCap();
    $('barStock').style.transform = 'scaleX(' + Math.min(1, fill).toFixed(4) + ')';
    $('barStock').parentNode.classList.toggle('full', fill > 0.97);
    var ce = G.condEff(), gr = G.grade(ce);
    $('vGradeLetter').textContent = gr.g;
    $('gradeSticker').dataset.tier = ce >= 1 ? 'top' : ce >= 0.7 ? 'mid' : 'low';
    $('vGrade').textContent = gr.label;
    $('vGrade').classList.toggle('long', gr.label.indexOf(' ') < 0 && gr.label.length > 10);
    $('vCond').textContent = pct(ce) + (S.crew.hakan ? ' · Fatih +%10' : '');

    var drawer = G.drawerMode();
    var art = drawer ? 'drawer' : 'e' + S.era;
    if ($('artPhone').dataset.art !== art) {
      $('artPhone').dataset.art = art;
      $('artPhone').innerHTML = drawer ? G.ART.drawer : G.ART.phone(S.era);
    }
    $('lblBuy').textContent = drawer ? 'ARA' : 'AL';
    var pb = G.clickPower('buy'), ps = G.clickPower('sell');
    $('vBuyPrice').textContent = drawer ? 'Çekmecede bedava telefon' : (pb > 1 ? pb + ' adet · ' : '') + '−' + tl(G.buyPrice());
    $('vSellPrice').textContent = (ps > 1 ? ps + ' adet · ' : '') + '+' + tl(G.sellPrice());
    var margin = G.sellPrice() - G.buyPrice();
    $('vMargin').textContent = 'Telefon başı kâr: ' + (margin >= 0 ? '+' : '') + tl(margin);


    // Bant: çubuk şu anki gerçek akışı çizer; yazı standart hızı ve olay farkını ayrı verir.
    var B = fl.base, mx = Math.max(B.sup, B.ch, fl.sup, fl.ch, 0.0001);
    setTrack($('barBuy'), $('capBuy'), Math.max(B.sup, fl.sup), fl.buy, mx);
    setTrack($('barSell'), $('capSell'), Math.max(B.ch, fl.ch), fl.sell, mx);
    setHtml($('vBuyRate'), 'vBuyRate', rateText(B.buy, fl.buy, B.sup));
    setHtml($('vSellRate'), 'vSellRate', rateText(B.sell, fl.sell, B.ch));

    var q = '';
    if (S.crew.mudur) {
      var bl = G.bulkLeft(), wait = bl > 0 ? ' disabled' : '';
      q += '<button class="btn blue inline" data-act="buyAll"' + wait + ' title="Depoyu %10 pahalıya doldurur. Sonra 2 dk bekler.">' + (bl > 0 ? 'Toplu al ' + G.fmtTime(bl) : 'Toplu al +%10') + '</button>' +
        '<button class="btn red inline" data-act="sellAll"' + wait + ' title="Tüm stoğu toptancıya %80 fiyatla satar. Sonra 2 dk bekler.">' + (bl > 0 ? 'Toplu sat ' + G.fmtTime(bl) : 'Toplu sat %80') + '</button>';
    }
    if (S.crew.can) {
      var cd = (S.cd.kampanya || 0) - S.t;
      q += '<button class="btn yellow inline" data-act="campaign"' + (cd > 0 ? ' disabled' : '') + '>' +
        (G.buff('kampanya') ? 'Kampanya ' + G.fmtTime(G.buffLeft('kampanya')) : cd > 0 ? 'Kampanya ' + G.fmtTime(cd) : 'Kampanya başlat') + '</button>';
    }
    setHtml($('quick'), 'quick', q);

    var bh = '';
    BUFFS.forEach(function (b) { if (G.buff(b[0])) bh += '<span class="buff ' + b[2] + '">' + b[1] + ' ' + Math.ceil(G.buffLeft(b[0])) + ' sn</span>'; });
    setHtml($('buffs'), 'buffs', bh);

    var ne = G.nextEra();
    $('eraChip').innerHTML = '<span class="cur">' + G.era().short + '</span>' + (ne ? '<small>→ ' + ne.short + (S.cash >= ne.cost ? ' hazır' : ' %' + Math.floor(S.cash / ne.cost * 100)) + '</small>' : '');
    $('eraChip').classList.toggle('ready', !!ne && S.cash >= ne.cost);
    renderOffer();
  }

  function renderOffer() {
    var o = G.offer, card = $('eventCard');
    if (!o) { if (!card.hidden) card.hidden = true; return; }
    if (card.dataset.id !== o.id + o.until) {
      card.dataset.id = o.id + o.until;
      card.innerHTML = '<div class="ev-title">' + o.title + '</div><div class="ev-text">' + o.text + '</div>' +
        '<div class="ev-row"><button class="btn red" id="evAccept">' + o.btn + '</button><button class="btn" id="evSkip">Geç</button></div>' +
        '<div class="ev-bar"><i id="evBar"></i></div>';
      $('evAccept').onclick = function () { G.acceptOffer(); G.sfx('sell'); render(); };
      $('evSkip').onclick = function () { G.offer = null; render(); };
      card.hidden = false;
    }
    $('evBar').style.width = Math.max(0, (o.until - G.S.t) / o.dur * 100) + '%';
  }

  // ---------- olay dinleyicileri ----------
  G.on(function (type, d) {
    if (type === 'unit') G.sfx('unit');
    if (type === 'upgrade') { G.sfx('upgrade'); addLog(d.name + ' alındı', 'good'); }
    if (type === 'era') { G.sfx('era'); addLog(d.name + ' çağına geçildi', 'gold'); toast('<b>Yeni çağ:</b> ' + d.name, 'gold', 5000); }
    if (type === 'depot') { G.sfx('upgrade'); addLog('Depo büyüdü: ' + d.name, 'good'); }
    if (type === 'hire') { G.sfx('upgrade'); addLog(d.name + ' işe alındı', 'good'); }
    if (type === 'retire') { G.sfx('upgrade'); addLog(d.need + ' ' + d.u.name + ' tecrübeye çevrildi: +' + pct(d.gain) + ' kondisyon', 'gold'); toast('<b>' + d.u.name + '</b> tecrübesi: +' + pct(d.gain) + ' kondisyon', 'gold'); }
    if (type === 'dispose') addLog(d.n + ' birim devredildi: +' + tl(d.v), '');
    if (type === 'part') {
      if (d.ok) { G.sfx('upgrade'); addLog(d.p.name + ' tuttu: +' + pct(d.p.gain) + ' kondisyon', 'good'); toast('<b>' + d.p.name + '</b> tuttu. +' + pct(d.p.gain) + ' kondisyon', 'good'); }
      else { G.sfx('fail'); addLog(d.p.name + ' tutmadı, ' + f(d.p.phones) + ' telefon gitti', 'bad'); toast('<b>' + d.p.name + '</b> tutmadı. Telefonlar gitti.', 'bad'); }
    }
    if (type === 'ach') { G.sfx('ach'); addLog('Başarım: ' + d.name, 'gold'); toast('<b>Başarım:</b> ' + d.name + '<br><small>' + d.desc + '</small>', 'gold', 5000); }
    if (type === 'log') { addLog(d.text, d.tone); if (d.big) { toast(d.text, d.tone); G.sfx('event'); } }
    if (type === 'offer') G.sfx('event');
    if (type === 'ipo') addLog('Halka arz tamam: +' + d.gain + ' hisse', 'gold');
  });

  // ---------- panel tıklamaları ----------
  function onPanelClick(e) {
    var b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    var a = b.dataset.act, S = G.S;
    if (a === 'rec') {
      var r = adv && adv.rec;
      if (!r) return;
      if (r.cost <= S.cash) {
        if (r.type === 'unit') { S[r.kind === 's' ? 'sup' : 'chan'][r.i] += r.m; S.cash -= r.cost; G.emit('unit', { kind: r.kind, i: r.i, m: r.m }); floatText(r.name + ' +' + r.m, r.kind === 's' ? 'buyf' : 'sellf', e.clientX, e.clientY); }
        else if (r.type === 'upg') G.buyUpgrade(r.id);
        else if (r.type === 'depot') G.buyDepot();
        else if (r.type === 'era') G.buyEra();
      } else {
        tab = recTab(r); lastHtml.panel = null;
      }
    }
    else if (a === 'unit') G.buyUnit(b.dataset.k, +b.dataset.i);
    else if (a === 'mode') { if (S.crew.mudur) S.buyMode = b.dataset.v === 'max' ? 'max' : +b.dataset.v; else toast('×10 ve Maks için <b>Mağaza Müdürü</b> gerekir (Ekip sekmesi).', ''); }
    else if (a === 'dispose') {
      var k = b.dataset.k, i = +b.dataset.i, u = unitList(k)[i];
      modal('Devret: ' + u.name, 'Tüm ' + u.name + ' birimlerini (' + (k === 's' ? S.sup : S.chan)[i] + ' adet) elden çıkarırsın ve harcadığın paranın ' + (S.crew.deniz ? '%75\'ini' : 'yarısını') + ', <b>' + tl(G.refundValue(k, i)) + '</b>, geri alırsın.',
        [{ label: 'Vazgeç' }, { label: 'Devret', danger: true, fn: function () { G.disposeUnit(k, i); } }]);
    }
    else if (a === 'retire') {
      var rk = b.dataset.k, ri2 = +b.dataset.i, ru = unitList(rk)[ri2], inf = G.retireInfo(rk, ri2);
      modal('Tecrübeye çevir: ' + ru.name, '<b>' + inf.need + ' ' + ru.name + '</b> birimi kapanır, para iadesi yok. Karşılığında kondisyon kalıcı olarak <b>+' + pct(inf.gain) + '</b> artar ve tüm satış fiyatların yükselir.<br><br>Bu türle bunu bu turda bir kez yapabilirsin. Kalan birimler çalışmaya devam eder.',
        [{ label: 'Vazgeç' }, { label: 'Tecrübeye çevir', primary: true, fn: function () { G.retire(rk, ri2); } }]);
    }
    else if (a === 'upg') G.buyUpgrade(b.dataset.id);
    else if (a === 'era') G.buyEra();
    else if (a === 'depot') G.buyDepot();
    else if (a === 'part') G.tryPart(b.dataset.id);
    else if (a === 'hire') G.hire(b.dataset.id);
    else if (a === 'campaign') G.campaign();
    else if (a === 'buyAll') { var n = G.buyAll(); if (n) { G.sfx('buy'); floatText('+' + f(n) + ' telefon', 'buyf', e.clientX, e.clientY); } }
    else if (a === 'sellAll') { var v = G.sellAll(); if (v) { G.sfx('sell'); floatText('+' + tl(v), 'sellf', e.clientX, e.clientY); } }
    else if (a === 'sound') { S.sound = !S.sound; soundIcon(); }
    else if (a === 'ipo') {
      modal('Halka arz', 'Şirketin borsaya açılıyor. <b>' + G.ipoGain() + ' hisse</b> alacaksın ve her şey sıfırlanacak; başarımlar ve hisseler kalır. Emin misin?',
        [{ label: 'Vazgeç' }, { label: 'Zili çal', primary: true, fn: function () { G.doIpo(); G.save(); G.sfx('era'); lastHtml = {}; } }]);
    }
    else if (a === 'export') {
      modal('Kaydı dışa aktar', '<p>Bu metni güvenli bir yere kopyala. Başka cihazda "Kayıt yükle" ile açabilirsin.</p><textarea id="expTxt" readonly>' + G.exportSave() + '</textarea>',
        [{ label: 'Kapat' }, { label: 'Kopyala', primary: true, fn: function () { var t = $('expTxt'); t.select(); try { navigator.clipboard.writeText(t.value); } catch (x) { document.execCommand('copy'); } toast('Kopyalandı', 'good'); } }]);
    }
    else if (a === 'import') {
      modal('Kayıt yükle', '<p>Dışa aktardığın metni yapıştır. Mevcut ilerlemenin üzerine yazılır.</p><textarea id="impTxt"></textarea>',
        [{ label: 'Vazgeç' }, { label: 'Yükle', primary: true, fn: function () {
          if (G.importSave($('impTxt').value)) { lastHtml = {}; toast('Kayıt yüklendi', 'good'); return true; }
          toast('Kayıt okunamadı. Metnin tamamını kopyaladığından emin ol.', 'bad'); return false;
        } }]);
    }
    else if (a === 'reset') {
      modal('Sıfırdan başla', 'Tüm ilerleme, hisseler ve başarımlar silinir. Geri alınamaz.',
        [{ label: 'Vazgeç' }, { label: 'Her şeyi sil', danger: true, fn: function () { G.hardReset(); lastHtml = {}; logItems = []; } }]);
    }
    renderAdvice(); render(); renderPanel(); renderEmpire();
  }

  function soundIcon() { $('btnSound').innerHTML = G.icon(G.S.sound ? 'ses' : 'sessiz'); }

  // İlk girişte (kayıt yokken) oyunun amacını anlatan kısa pencere. Fişin altından tekrar açılır.
  function showIntro() {
    modal('Cepten Cebe\'ye hoş geldin',
      '<p>Amacın: ucuza telefon alıp pahalıya satarak küçük bir tezgâhtan <b>telefon imparatorluğu</b> kurmak.</p>' +
      '<ol class="intro-steps">' +
      '<li><b>AL</b> ile telefon al, <b>SAT</b> ile sat. Aradaki fark kârın.</li>' +
      '<li>Parayla <b>Tedarik</b> birimleri al: telefonları senin yerine alırlar.</li>' +
      '<li><b>Satış</b> noktaları aç: elden satıştan AVM\'ye, telefonları senin yerine satarlar.</li>' +
      '<li>İkisini dengede tut. Tezgâhın altındaki <b>öneri</b> kutusu hangisine yatırım yapman gerektiğini söyler.</li>' +
      '<li><b>Yükselt</b> ve <b>Ekip</b> ile hızlan, kondisyonu artır, yeni telefon çağına geç.</li>' +
      '</ol>' +
      '<p>Bu turda 1 Trilyon ₺ kazanınca <b>halka arz</b> ile baştan başlar, kalıcı hisse bonusu kazanırsın. Klavyede A al, S sat.</p>',
      [{ label: 'Kepengi aç', primary: true }]);
  }

  // ---------- kurulum ----------
  function init() {
    $('logo').innerHTML = G.ART.logo;
    $('artCash').innerHTML = G.ART.cash;
    var away = G.load();
    if (away) {
      var r = G.offline(away);
      if (r && r.cash > 0) {
        modal('Sen yokken dükkân açıktı', '<p><b>' + G.fmtTime(r.sec) + '</b> boyunca ekip yarı verimle çalıştı.</p>' +
          '<div class="offline-sum"><div><span>Satılan telefon</span><b>' + f(r.sold) + '</b></div><div><span>Kasaya giren net</span><b>+' + tl(r.cash) + '</b></div></div>');
      }
    }
    else if (away === null) showIntro();
    addLog('Kepenk açıldı. Hayırlı işler.', '');

    $('btnBuy').addEventListener('click', onBuy);
    $('btnSell').addEventListener('click', onSell);
    document.addEventListener('pointermove', function (e) { lastPointer = { x: e.clientX, y: e.clientY }; }, { passive: true });
    $('panel').addEventListener('pointerdown', function () { pressed = true; });
    document.addEventListener('pointerup', function () { setTimeout(function () { pressed = false; }, 0); });
    $('panel').addEventListener('click', onPanelClick);
    $('quick').addEventListener('click', onPanelClick);
    $('advice').addEventListener('click', onPanelClick);
    document.querySelectorAll('.tabs button').forEach(function (b) {
      b.addEventListener('click', function () { tab = b.dataset.tab; lastHtml.panel = null; renderPanel(); $('panel').parentNode.scrollTop = 0; });
    });
    $('eraChip').addEventListener('click', function () { tab = 'yukselt'; lastHtml.panel = null; renderPanel(); });
    $('btnSound').addEventListener('click', function () { G.S.sound = !G.S.sound; soundIcon(); lastHtml.panel = null; });
    $('modal').addEventListener('click', function (e) { if (e.target.id === 'modal') closeModal(); });
    $('btnHelp').addEventListener('click', showIntro);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('modal').hidden) { closeModal(); return; }
      if (e.repeat || e.target.tagName === 'TEXTAREA' || e.metaKey || e.ctrlKey || !$('modal').hidden) return;
      if (e.key === 'a' || e.key === 'A') onBuy({});
      if (e.key === 's' || e.key === 'S') onSell({});
    });
    soundIcon();

    var lastT = performance.now();
    setInterval(function () {
      var now = performance.now(), dt = (now - lastT) / 1000;
      lastT = now;
      if (dt > 30) { G.offline(dt); return; }
      while (dt > 0) { var d = Math.min(0.1, dt); G.tick(d); dt -= d; }
    }, 100);
    setInterval(function () { renderAdvice(); renderPanel(); renderEmpire(); }, 250);
    setInterval(G.save, 10000);
    addEventListener('beforeunload', G.save);
    document.addEventListener('visibilitychange', function () { if (document.hidden) G.save(); });
    (function loop() { render(); requestAnimationFrame(loop); })();
    renderAdvice(); renderPanel(); renderEmpire();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
