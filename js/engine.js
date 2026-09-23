// Cepten Cebe — oyun motoru. DOM'a dokunmaz; tools/sim.js de bunu kullanır.
(function () {
  var G = globalThis.G;
  var D = G.D;

  G.listeners = [];
  G.on = function (f) { G.listeners.push(f); };
  G.emit = function (type, data) { for (var i = 0; i < G.listeners.length; i++) G.listeners[i](type, data); };
  G.rt = { buy: 0, sell: 0, profit: 0 };
  G.offer = null;          // bekleyen tıklanabilir teklif
  G.clickLog = [];         // seri tıklama başarımı için zaman damgaları (ms)
  G.now = function () { return Date.now(); };

  // ---------- durum ----------
  G.newState = function (keep) {
    var S = {
      v: 2, cash: D.START_CASH, stock: 0, cond: D.START_COND, era: 0, depot: 0,
      sup: D.SUPPLIERS.map(function () { return 0; }),
      chan: D.CHANNELS.map(function () { return 0; }),
      upg: {}, crew: {}, ach: {}, buffs: {}, cd: {}, retired: {},
      t: 0, nextEvent: 90, nextOffer: 300, selinT: 0,
      stats: { earned: 0, earnedAll: 0, spent: 0, bought: 0, sold: 0, clicks: 0, play: 0, playAll: 0,
               lowSold: 0, fails: 0, customers: 0, ipos: 0, disposed: {} },
      shares: 0, sound: true, buyMode: 1, lastSave: Date.now()
    };
    if (keep) {
      S.shares = keep.shares; S.ach = keep.ach; S.sound = keep.sound;
      S.stats.earnedAll = keep.stats.earnedAll; S.stats.playAll = keep.stats.playAll;
      S.stats.ipos = keep.stats.ipos; S.stats.fails = keep.stats.fails; S.stats.customers = keep.stats.customers;
      S.stats.clicks = keep.stats.clicks;
      var sh = S.shares;
      if (sh >= 1) S.cash = 25000;
      if (sh >= 3) S.depot = 1;
      if (sh >= 5) S.crew.mudur = 1;
      if (sh >= 10) S.era = 1;
      if (sh >= 25) D.CREW.forEach(function (c) { S.crew[c.id] = 1; });
      if (sh >= 50) S.cond = 0.7;
    }
    return S;
  };
  G.S = G.newState();

  // ---------- yardımcılar ----------
  G.fmt = function (n) {
    if (!isFinite(n)) return '∞';
    var neg = n < 0; n = Math.abs(n);
    var s;
    if (n < 1e6) s = Math.floor(n).toLocaleString('tr-TR');
    else {
      var units = ['Mn', 'Mr', 'Tn', 'Kd', 'Kn', 'Sk', 'Sp', 'Ok', 'Nn', 'Dc'];
      var e = Math.floor(Math.log10(n) / 3);
      var u = units[e - 2];
      if (!u) s = n.toExponential(2);
      else s = (n / Math.pow(1000, e)).toFixed(2).replace('.', ',') + ' ' + u;
    }
    return (neg ? '-' : '') + s;
  };
  G.fmtRate = function (n) {
    if (n > 0 && n < 10) return n.toFixed(1).replace('.', ',');
    return G.fmt(n);
  };
  G.fmtTime = function (sec) {
    sec = Math.floor(sec);
    var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    if (h) return h + ' sa ' + m + ' dk';
    if (m) return m + ' dk ' + s + ' sn';
    return s + ' sn';
  };
  G.grade = function (c) {
    for (var i = 0; i < D.GRADES.length; i++) if (c >= D.GRADES[i].min - 1e-9) return D.GRADES[i];
    return D.GRADES[D.GRADES.length - 1];
  };
  G.buff = function (id) { return (G.S.buffs[id] || 0) > G.S.t; };
  G.buffLeft = function (id) { return Math.max(0, (G.S.buffs[id] || 0) - G.S.t); };
  G.addBuff = function (id, dur, negative) {
    if (negative && G.S.crew.deniz) dur /= 2;
    G.S.buffs[id] = Math.max(G.S.buffs[id] || 0, G.S.t) + dur;
  };
  function effProduct(key) {
    var m = 1;
    D.GLOBAL_UPS.forEach(function (u) { if (G.S.upg[u.id] && u.eff[key]) m *= u.eff[key]; });
    return m;
  }

  // ---------- fiyatlar ----------
  G.era = function () { return D.ERAS[G.S.era]; };
  // Etkin kondisyon: tıklamadan bağımsız. Usta Teknisyen Fatih kalıcı +%10 ekler.
  G.condEff = function () { return G.S.cond + (G.S.crew.hakan ? 0.1 : 0); };
  G.buyPrice = function () {
    return G.era().buy * effProduct('buy') * (G.S.crew.deniz ? 0.95 : 1) * (G.buff('kur') ? 1.2 : 1);
  };
  G.sellPrice = function () {
    return G.era().sell * (0.5 + G.condEff()) * effProduct('sell') *
      (G.buff('kur') ? 1.3 : 1) * (G.buff('kampanya') ? 2 : 1) * (G.buff('efsane') ? 0.9 : 1);
  };
  G.bonusMult = function () {
    return 1 + D.SHARE_BONUS * G.S.shares + D.ACH_BONUS * Object.keys(G.S.ach).length;
  };
  G.unitMult = function (kind, i) {
    var m = 1;
    D.UNIT_TIERS.forEach(function (t, k) { if (G.S.upg[kind + i + '_' + k]) m *= 2; });
    return m;
  };
  G.supRateOne = function (i) {
    if (D.SUPPLIERS[i].id === 'ithalat' && G.buff('gumruk')) return 0;
    return D.SUPPLIERS[i].rate * G.unitMult('s', i) * effProduct('sup') * G.bonusMult();
  };
  G.chanRateOne = function (i) {
    return D.CHANNELS[i].rate * G.unitMult('c', i) * effProduct('chan') * G.bonusMult() *
      (G.buff('yeniModel') ? 2 : 1) * (G.buff('efsane') ? 3 : 1);
  };
  G.supRate = function (i) { return G.S.sup[i] * G.supRateOne(i); };
  G.chanRate = function (i) { return G.S.chan[i] * G.chanRateOne(i); };
  G.supTotal = function () { var s = 0; for (var i = 0; i < D.SUPPLIERS.length; i++) s += G.supRate(i); return s; };
  G.chanTotal = function () { var s = 0; for (var i = 0; i < D.CHANNELS.length; i++) s += G.chanRate(i); return s; };
  G.depotCap = function () { return D.DEPOTS[G.S.depot].cap; };
  G.space = function () { return Math.max(0, G.depotCap() - G.S.stock); };
  G.clickPower = function (kind) {
    var p = 1;
    D.CLICK_TIERS.forEach(function (c, k) { if (G.S.upg['click' + k]) p = c.p; });
    if (G.S.upg.kasaSesi) p += 0.03 * (kind === 'buy' ? G.supTotal() : G.chanTotal());
    return Math.max(1, Math.floor(p));
  };

  // ---------- birim alım/satım ----------
  function list(kind) { return kind === 's' ? D.SUPPLIERS : D.CHANNELS; }
  function owned(kind) { return kind === 's' ? G.S.sup : G.S.chan; }
  G.unitCost = function (kind, i, m) {
    var base = list(kind)[i].cost, n = owned(kind)[i], r = D.COST_GROWTH;
    m = m || 1;
    return base * Math.pow(r, n) * (Math.pow(r, m) - 1) / (r - 1);
  };
  G.maxAfford = function (kind, i) {
    var base = list(kind)[i].cost, n = owned(kind)[i], r = D.COST_GROWTH;
    var m = Math.floor(Math.log(G.S.cash * (r - 1) / (base * Math.pow(r, n)) + 1) / Math.log(r));
    return Math.max(0, m);
  };
  G.buyAmount = function (kind, i) {
    var mode = G.S.crew.mudur ? G.S.buyMode : 1;
    if (mode === 'max') return Math.max(1, G.maxAfford(kind, i));
    return mode;
  };
  G.buyUnit = function (kind, i) {
    var m = G.buyAmount(kind, i), c = G.unitCost(kind, i, m);
    if (c > G.S.cash) return false;
    G.S.cash -= c;
    owned(kind)[i] += m;
    G.emit('unit', { kind: kind, i: i, m: m });
    return true;
  };
  G.refundValue = function (kind, i) {
    var base = list(kind)[i].cost, n = owned(kind)[i], r = D.COST_GROWTH;
    return base * (Math.pow(r, n) - 1) / (r - 1) * (G.S.crew.deniz ? 0.75 : D.REFUND);
  };
  G.disposeUnit = function (kind, i) {
    var n = owned(kind)[i];
    if (!n) return 0;
    var v = G.refundValue(kind, i);
    G.S.cash += v;
    owned(kind)[i] = 0;
    G.S.stats.disposed[list(kind)[i].id] = (G.S.stats.disposed[list(kind)[i].id] || 0) + n;
    G.emit('dispose', { kind: kind, i: i, n: n, v: v });
    return v;
  };

  G.retireInfo = function (kind, i) {
    var r = D.RETIRE[i], done = !!G.S.retired[kind + i];
    return { need: r.need, gain: r.gain, done: done, ready: !done && owned(kind)[i] >= r.need };
  };
  G.retire = function (kind, i) {
    var r = G.retireInfo(kind, i);
    if (!r.ready) return false;
    owned(kind)[i] -= r.need;
    G.S.retired[kind + i] = 1;
    G.S.cond += r.gain;
    G.emit('retire', { u: list(kind)[i], need: r.need, gain: r.gain });
    return true;
  };

  // ---------- tıklama ----------
  function logClick() {
    var t = G.now();
    G.clickLog.push(t);
    while (G.clickLog.length && t - G.clickLog[0] > 10000) G.clickLog.shift();
    G.S.stats.clicks++;
  }
  G.drawerMode = function () { return G.S.cash < G.buyPrice() && G.S.stock < 1; };
  G.clickBuy = function () {
    logClick();
    if (G.drawerMode()) {
      G.S.stock += 1;
      G.S.stats.bought += 1;
      return { n: 1, cost: 0, free: true };
    }
    var bp = G.buyPrice();
    var n = Math.min(G.clickPower('buy'), Math.floor(G.S.cash / bp), Math.floor(G.space()));
    if (n <= 0) return { n: 0, full: G.space() < 1 };
    G.S.cash -= n * bp; G.S.stock += n;
    G.S.stats.bought += n; G.S.stats.spent += n * bp;
    return { n: n, cost: n * bp };
  };
  G.clickSell = function () {
    logClick();
    var n = Math.min(G.clickPower('sell'), Math.floor(G.S.stock));
    if (n <= 0) return { n: 0 };
    var rev = n * G.sellPrice();
    G.S.stock -= n;
    earn(rev, n);
    return { n: n, rev: rev };
  };
  // Toplu al/sat: tıklama gücünü aşan acil durum araçları; bedeli var ve 2 dk bekler.
  G.BULK = { buyMarkup: 1.1, sellDiscount: 0.8, cooldown: 120 };
  G.bulkLeft = function () { return Math.max(0, (G.S.cd.bulk || 0) - G.S.t); };
  G.buyAll = function () {
    if (G.bulkLeft() > 0) return 0;
    var bp = G.buyPrice() * G.BULK.buyMarkup;
    var n = Math.min(Math.floor(G.S.cash / bp), Math.floor(G.space()));
    if (n <= 0) return 0;
    G.S.cash -= n * bp; G.S.stock += n; G.S.stats.bought += n; G.S.stats.spent += n * bp;
    G.S.cd.bulk = G.S.t + G.BULK.cooldown;
    return n;
  };
  G.sellAll = function () {
    if (G.bulkLeft() > 0) return 0;
    var n = Math.floor(G.S.stock);
    if (n <= 0) return 0;
    var rev = n * G.sellPrice() * G.BULK.sellDiscount;
    G.S.stock -= n; earn(rev, n);
    G.S.cd.bulk = G.S.t + G.BULK.cooldown;
    return rev;
  };
  function earn(rev, n) {
    G.S.cash += rev;
    G.S.stats.earned += rev; G.S.stats.earnedAll += rev;
    G.S.stats.sold += n;
    if (G.condEff() < 0.6) G.S.stats.lowSold += n;
  }

  // ---------- yükseltmeler ----------
  G.upgradesAvailable = function () {
    var S = G.S, out = [];
    D.CLICK_TIERS.forEach(function (c, k) {
      var id = 'click' + k;
      if (!S.upg[id] && (k === 0 || S.upg['click' + (k - 1)]) && S.stats.earned >= c.cost * 0.3)
        out.push({ id: id, name: c.name, desc: c.desc, cost: c.cost, icon: '' });
    });
    D.GLOBAL_UPS.forEach(function (u) {
      if (!S.upg[u.id] && S.stats.earned >= u.cost * 0.3)
        out.push({ id: u.id, name: u.name, desc: u.desc, cost: u.cost, icon: '' });
    });
    [['s', D.SUPPLIERS, S.sup], ['c', D.CHANNELS, S.chan]].forEach(function (g) {
      g[1].forEach(function (unit, i) {
        D.UNIT_TIERS.forEach(function (t, k) {
          var id = g[0] + i + '_' + k;
          if (!S.upg[id] && g[2][i] >= t.need)
            out.push({ id: id, name: unit.name + ': ' + t.name, desc: unit.name + ' hızı ×2.', cost: unit.cost * t.costX, icon: unit.icon });
        });
      });
    });
    out.sort(function (a, b) { return a.cost - b.cost; });
    return out;
  };
  G.buyUpgrade = function (id) {
    var u = G.upgradesAvailable().filter(function (x) { return x.id === id; })[0];
    if (!u || u.cost > G.S.cash) return false;
    G.S.cash -= u.cost; G.S.upg[id] = 1;
    G.emit('upgrade', u);
    return true;
  };
  G.nextEra = function () { return D.ERAS[G.S.era + 1] || null; };
  G.buyEra = function () {
    var e = G.nextEra();
    if (!e || G.S.cash < e.cost) return false;
    G.S.cash -= e.cost; G.S.era++;
    G.emit('era', e);
    return true;
  };
  G.nextDepot = function () { return D.DEPOTS[G.S.depot + 1] || null; };
  G.buyDepot = function () {
    var d = G.nextDepot();
    if (!d || G.S.cash < d.cost) return false;
    G.S.cash -= d.cost; G.S.depot++;
    G.emit('depot', d);
    return true;
  };
  G.partChance = function (p) { return Math.min(0.95, p.chance + (G.S.crew.hakan ? 0.15 : 0)); };
  G.partsAvailable = function () {
    return D.PARTS.filter(function (p, k) {
      return !G.S.upg[p.id] && (k === 0 || G.S.upg[D.PARTS[k - 1].id] || G.S.stats.sold >= p.phones * 2);
    });
  };
  G.tryPart = function (id, roll) {
    var p = D.PARTS.filter(function (x) { return x.id === id; })[0];
    if (!p || G.S.upg[id] || G.S.stock < p.phones) return null;
    G.S.stock -= p.phones;
    var ok = (roll === undefined ? Math.random() : roll) < G.partChance(p);
    if (ok) { G.S.upg[id] = 1; G.S.cond += p.gain; }
    else G.S.stats.fails++;
    G.emit('part', { p: p, ok: ok });
    return ok;
  };
  G.hire = function (id) {
    var c = D.CREW.filter(function (x) { return x.id === id; })[0];
    if (!c || G.S.crew[id] || G.S.cash < c.cost) return false;
    G.S.cash -= c.cost; G.S.crew[id] = 1;
    if (id === 'nurten') G.S.nextOffer = G.S.t + 60;
    G.emit('hire', c);
    return true;
  };
  G.campaign = function () {
    if (!G.S.crew.can || (G.S.cd.kampanya || 0) > G.S.t) return false;
    G.addBuff('kampanya', 30); G.S.cd.kampanya = G.S.t + 600;
    G.emit('log', { text: 'Kampanya başladı: 30 sn satış fiyatı ×2', tone: 'good' });
    return true;
  };

  // ---------- darboğaz ve öneri ----------
  // Tek bir tarafta en verimli yatırım: lira başına kazanılan telefon/sn.
  G.visibleUnit = function (kind, i) {
    var u = list(kind)[i];
    return i === 0 || owned(kind)[i] > 0 || G.S.stats.earnedAll >= u.cost * 0.25;
  };
  // Önerilecek yatırım: lira başına en verimli olan, ama sadece anlamlı olanlar arasından.
  // O tarafın hızının (ya da açığın) %3'ünden azını ekleyen seçenek elenir; 20 tel/sn açıkta +0,1 bir şey çözmez.
  G.bestFor = function (kind, gap) {
    var isS = kind === 's';
    var sideTotal = isS ? G.supTotal() : G.chanTotal();
    var floor = 0.03 * Math.max(sideTotal, gap > 0 ? gap : 0);
    var all = [];
    list(kind).forEach(function (u, i) {
      if (!G.visibleUnit(kind, i)) return;
      var cost = G.unitCost(kind, i), gain = isS ? G.supRateOne(i) : G.chanRateOne(i);
      all.push({ type: 'unit', kind: kind, i: i, m: 1, name: u.name, cost: cost, gain: gain });
    });
    G.upgradesAvailable().forEach(function (up) {
      var gain = 0, mm = /^([sc])(\d+)_\d+$/.exec(up.id);
      if (mm && mm[1] === kind) gain = isS ? G.supRate(+mm[2]) : G.chanRate(+mm[2]);
      var g = D.GLOBAL_UPS.filter(function (x) { return x.id === up.id; })[0];
      if (g && g.eff[isS ? 'sup' : 'chan']) gain = sideTotal * (g.eff[isS ? 'sup' : 'chan'] - 1);
      if (gain > 0) all.push({ type: 'upg', kind: kind, id: up.id, name: up.name, cost: up.cost, gain: gain, m: 1 });
    });
    var pool = all.filter(function (c) { return c.gain >= floor; });
    if (!pool.length) pool = all;
    var best = null;
    pool.forEach(function (c) { c.value = c.gain / c.cost; if (!best || c.value > best.value) best = c; });
    return best;
  };

  // Otomasyonun sürekli akışı: tıklamalardan bağımsız, kapasite ve darboğazdan hesaplanır.
  G.flowState = { full: false, drain: false };
  G.flow = function () {
    var S = G.S, sup = G.supTotal(), ch = G.chanTotal();
    // Bant otomasyonun gerçek durumunu gösterir: depo doluyorsa tedarikçiler tam hızda alır,
    // dolunca satış hızına iner. Durum geçişleri gecikmeli (histerezis): dolu sayılmak için depo
    // neredeyse dolmalı (%98 ya da 2 sn'lik satış kadar boşluk), boş sayılmak için yarının altına inmeli. Birkaç elle tık bunu çeviremez.
    var cap = G.depotCap(), st = G.flowState;
    if (S.stock >= Math.min(cap * 0.98, cap - ch * 2)) st.full = true; else if (S.stock < cap * 0.5) st.full = false;
    if (S.stock > Math.max(20, ch * 10)) st.drain = true; else if (S.stock < 1) st.drain = false;
    var buy, sell;
    if (sup > ch) { buy = st.full ? ch : sup; sell = ch; }
    else { buy = sup; sell = st.drain ? ch : sup; }
    // Kasadaki kâr/sn kalıcı kazançtır: uzun vadede ancak satılan kadar alınır, min(tedarik, satış).
    // Stoğa ve kasaya hiç bakmaz. Ucuz tedarikçi önce çalışır, pahalı kanal önce satar.
    var steady = Math.min(sup, ch);
    var bp = G.buyPrice(), sp = G.sellPrice();
    var left = steady, cost = 0, rev = 0;
    supOrder.forEach(function (i) { var n = Math.min(left, G.supRate(i)); cost += n * bp * D.SUPPLIERS[i].mult; left -= n; });
    left = steady;
    chanOrder.forEach(function (j) { var n = Math.min(left, G.chanRate(j)); rev += n * sp * D.CHANNELS[j].mult; left -= n; });
    return { buy: buy, sell: sell, profit: rev - cost, filling: sup > ch && !st.full, fillIn: sup > ch ? Math.max(0, cap - S.stock) / (sup - ch) : 0 };
  };
  // Öneri sadece otomasyona bakar (tedarik ve satış hızı). Elle al/sat öneriyi değiştirmez.
  G.advice = function () {
    var S = G.S, sup = G.supTotal(), ch = G.chanTotal();
    var depotFull = S.stock >= G.depotCap() * 0.9;
    var a;
    if (sup === 0 && ch === 0) {
      a = { side: 's', head: 'İlk tedarikçini al', why: 'AL ve SAT\'a basarak para biriktir. Sonra telefonları senin yerine alacak birini, ardından satacak birini al.' };
    } else if (sup === 0) {
      a = { side: 's', head: 'Tedarikçi al', why: 'Satış noktaların satacak telefon bekliyor ama alan kimse yok.' };
    } else if (ch === 0) {
      a = { side: 'c', head: 'Satış noktası aç', why: 'Telefonlar depoda birikiyor, satan kimse yok.' };
    } else if (sup < ch * 0.85) {
      a = { side: 's', head: 'Tedarik ekle', why: 'Satış noktaların saniyede ' + G.fmtRate(ch) + ' telefon satabilir ama sadece ' + G.fmtRate(sup) + ' telefon geliyor. Tezgâh boş kalıyor.' };
    } else if (ch < sup * 0.85) {
      a = { side: 'c', head: 'Satış noktası aç', why: 'Tedarikçilerin saniyede ' + G.fmtRate(sup) + ' telefon alabilir ama sadece ' + G.fmtRate(ch) + ' telefon satılıyor. ' +
        (depotFull ? 'Depo dolduğu için alış satış hızına düştü; fazla kapasite boşta.' : 'Fazlası depoda birikiyor, dolunca alış durur.') };
    } else {
      a = { side: sup <= ch ? 's' : 'c', head: 'Denge iyi, ikisini birlikte büyüt', why: 'Alış ve satış birbirine yakın. Sıradaki en verimli yatırım:', balanced: true };
    }
    a.rec = G.bestFor(a.side, a.balanced ? 0 : Math.abs(sup - ch));
    if (a.rec && a.rec.cost > S.cash) {
      var pr = Math.max(0, G.flow().profit);
      a.eta = pr > 0 ? (a.rec.cost - S.cash) / pr : null;
    }
    var d = G.nextDepot();
    if (depotFull && d && S.cash >= d.cost) a.extra = 'Depo dolu. ' + d.name + ' (' + G.fmt(d.cap) + ' telefon) Parça için sök ve toplu müşteri teklifleri için yer açar; satışı hızlandırmaz.';
    var e = G.nextEra();
    if (e && S.cash >= e.cost) a.extra = e.name + ' çağına geçebilirsin: telefon başı kâr ×' + ((e.sell - e.buy) / (G.era().sell - G.era().buy)).toFixed(1).replace('.', ',') + '.';
    return a;
  };

  // ---------- halka arz ----------
  G.sharesTotal = function () { return Math.floor(Math.sqrt(G.S.stats.earnedAll / D.SHARE_UNIT)); };
  G.ipoGain = function () { return Math.max(0, G.sharesTotal() - G.S.shares); };
  G.canIpo = function () { return G.S.stats.earned >= D.IPO_MIN && G.ipoGain() > 0; };
  G.doIpo = function () {
    if (!G.canIpo()) return false;
    var gain = G.ipoGain();
    var old = G.S;
    old.shares += gain; old.stats.ipos++;
    G.S = G.newState(old);
    G.offer = null;
    G.emit('ipo', { gain: gain });
    return true;
  };

  // ---------- olaylar ----------
  var EVENTS = [
    { id: 'musteri', w: 3, ok: function () { return G.S.stock >= 10; }, fire: function () {
      var q = Math.max(20, Math.floor(G.chanTotal() * 15), G.clickPower('sell') * 5);
      var price = G.sellPrice() * 1.5;
      G.offer = { id: 'musteri', until: G.S.t + 12, dur: 12, title: 'Kapıda pazarlıkçı müşteri',
        text: G.fmt(q) + ' telefonu tanesi ' + G.fmt(price) + ' ₺\'den alırım, çabuk karar ver!',
        btn: 'Sat', q: q, price: price };
    } },
    { id: 'cekmece', w: 2, ok: function () { return G.space() >= 5; }, fire: function () {
      var q = Math.max(10, Math.floor(G.supTotal() * 20));
      G.offer = { id: 'cekmece', until: G.S.t + 12, dur: 12, title: 'Çekmece bereketi',
        text: 'Teyzen eski telefonları buldu: ' + G.fmt(q) + ' telefon bedava!', btn: 'Topla', q: q };
    } },
    { id: 'yeniModel', w: 2, fire: function () {
      G.addBuff('yeniModel', 60);
      G.emit('log', { text: 'Yeni model tanıtıldı! 60 sn satış hızı ×2', tone: 'good', big: true });
    } },
    { id: 'kur', w: 1.5, fire: function () {
      G.addBuff('kur', 90);
      G.emit('log', { text: 'Kur zıpladı! 90 sn alış +%20, satış +%30. Stok varsa şimdi sat.', tone: 'warn', big: true });
    } },
    { id: 'gumruk', w: 1, ok: function () { return G.S.sup[4] > 0; }, fire: function () {
      G.addBuff('gumruk', 60, true);
      G.emit('log', { text: 'Konteyner gümrükte takıldı. İthalat Hattı ' + G.fmtTime(G.buffLeft('gumruk')) + ' durdu.', tone: 'bad', big: true });
    } },
    { id: 'efsane', w: 1, ok: function () { return G.chanTotal() > 0; }, fire: function () {
      G.addBuff('efsane', 30);
      G.emit('log', { text: 'Efsane Cuma! 30 sn satış hacmi ×3, fiyat %10 indirimli.', tone: 'good', big: true });
    } }
  ];
  G.fireEvent = function (id) {
    var e = EVENTS.filter(function (x) { return x.id === id; })[0];
    if (e) { e.fire(); if (G.offer) G.emit('offer', G.offer); }
  };
  function rollEvent() {
    var pool = EVENTS.filter(function (e) { return !e.ok || e.ok(); });
    var tot = pool.reduce(function (a, e) { return a + e.w; }, 0), r = Math.random() * tot;
    for (var i = 0; i < pool.length; i++) { r -= pool[i].w; if (r <= 0) { G.fireEvent(pool[i].id); return; } }
  }
  G.acceptOffer = function () {
    var o = G.offer;
    if (!o || o.until < G.S.t) return false;
    G.offer = null;
    if (o.id === 'musteri') {
      var n = Math.min(o.q, Math.floor(G.S.stock));
      if (n > 0) { G.S.stock -= n; earn(n * o.price, n); }
      G.S.stats.customers++;
      G.emit('log', { text: 'Müşteriye ' + G.fmt(n) + ' telefon satıldı: +' + G.fmt(n * o.price) + ' ₺', tone: 'good' });
    } else if (o.id === 'cekmece') {
      var q = Math.min(o.q, Math.floor(G.space()));
      G.S.stock += q; G.S.stats.bought += q;
      G.emit('log', { text: '' + G.fmt(q) + ' bedava telefon depoya girdi', tone: 'good' });
    } else if (o.id === 'nurten') {
      var v = G.S.cash * o.pct / 100;
      G.S.cash += v; G.S.stats.earned += v; G.S.stats.earnedAll += v;
      G.S.cd.nurten = G.S.t + 1800; G.S.nextOffer = G.S.t + 1800;
      G.emit('log', { text: 'Ezgi\'nin yatırımı tuttu: +' + G.fmt(v) + ' ₺', tone: 'good' });
    }
    G.emit('offerDone', o);
    return true;
  };

  // ---------- başarımlar ----------
  var sumArr = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
  G.ACH = [
    { id: 'ilk',      icon: '💸', name: 'İlk Satış',               desc: 'İlk telefonunu sat.',                    ok: function (S) { return S.stats.sold >= 1; } },
    { id: 'garanti',  icon: '🧾', name: '"Garantisi var mı abi?"', desc: '100 telefon sat.',                       ok: function (S) { return S.stats.sold >= 100; } },
    { id: 'bin',      icon: '📱', name: 'Bin Cep',                 desc: '1.000 telefon sat.',                     ok: function (S) { return S.stats.sold >= 1000; } },
    { id: 'milyoncep',icon: '📡', name: 'Operatör Gibi',           desc: '1 milyon telefon sat.',                  ok: function (S) { return S.stats.sold >= 1e6; } },
    { id: 'harclik',  icon: '🪙', name: 'Harçlık Çıktı',           desc: 'Toplam 100.000 ₺ kazan.',                ok: function (S) { return S.stats.earnedAll >= 1e5; } },
    { id: 'milyoner', icon: '💰', name: 'Milyoner',                desc: 'Toplam 1 milyon ₺ kazan.',               ok: function (S) { return S.stats.earnedAll >= 1e6; } },
    { id: 'milyarder',icon: '🏦', name: 'Milyarder',               desc: 'Toplam 1 milyar ₺ kazan.',               ok: function (S) { return S.stats.earnedAll >= 1e9; } },
    { id: 'trilyoner',icon: '👑', name: 'Trilyoner',               desc: 'Toplam 1 trilyon ₺ kazan.',              ok: function (S) { return S.stats.earnedAll >= 1e12; } },
    { id: 'katril',   icon: '🌌', name: 'Sayılar Yetmiyor',        desc: 'Toplam 1 katrilyon ₺ kazan.',            ok: function (S) { return S.stats.earnedAll >= 1e15; } },
    { id: 'esnaf',    icon: '🏪', name: 'Esnaf Oldun',             desc: 'İlk Mahalle Dükkânını aç.',              ok: function (S) { return S.chan[2] >= 1; } },
    { id: 'toptan',   icon: '📲', name: 'Toptancının Gözdesi',     desc: '50 Telefoncuya Toptan kanalın olsun.',   ok: function (S) { return S.chan[1] >= 50; } },
    { id: 'avm',      icon: '🏬', name: 'AVM Kralı',               desc: '10 AVM Mağazası.',                       ok: function (S) { return S.chan[4] >= 10; } },
    { id: 'fabrika',  icon: '🏭', name: 'Fabrikatör',              desc: 'İlk Fabrikanı kur.',                     ok: function (S) { return S.sup[6] >= 1; } },
    { id: 'mars',     icon: '🚀', name: 'Gökyüzü Sınır Değil',     desc: 'Mars Bayiliği al.',                      ok: function (S) { return S.chan[8] >= 1; } },
    { id: 'birim100', icon: '👥', name: 'Kalabalık Kadro',         desc: 'Toplam 100 birime sahip ol.',            ok: function (S) { return sumArr(S.sup) + sumArr(S.chan) >= 100; } },
    { id: 'birim500', icon: '🏙️', name: 'Holding Gibi Holding',    desc: 'Toplam 500 birime sahip ol.',            ok: function (S) { return sumArr(S.sup) + sumArr(S.chan) >= 500; } },
    { id: 'hurda',    icon: '🗑️', name: 'Kutusu Faturası Yok',     desc: 'Hurda notla 1.000 telefon sat.',         ok: function (S) { return S.stats.lowSold >= 1000; } },
    { id: 'sifir',    icon: '✨', name: 'Kutusunda Sıfır',          desc: 'Kondisyonu %100\'e çıkar.',              ok: function (S) { return S.cond >= 1 - 1e-9; } },
    { id: 'koleksiyon',icon: '🏆', name: 'Koleksiyonluk',           desc: 'Kondisyonu %150\'ye çıkar.',             ok: function (S) { return S.cond >= 1.5 - 1e-9; } },
    { id: 'kumar',    icon: '🎲', name: 'Elimde Kaldı',            desc: '5 kez "Parça için sök" başarısız olsun.', ok: function (S) { return S.stats.fails >= 5; } },
    { id: 'cekmece',  icon: '🗄️', name: 'Çekmeceler Boşaldı',      desc: 'Kuzen Gökhan\'ı devret.',                ok: function (S) { return S.stats.disposed.kuzen > 0; } },
    { id: 'tecrube',  icon: '🎖️', name: 'Eski Kurt',               desc: '5 birim türünü tecrübeye çevir.',         ok: function (S) { return Object.keys(S.retired).length >= 5; } },
    { id: 'tik',      icon: '👆', name: 'Tık Tık',                 desc: '1.000 kez tıkla.',                       ok: function (S) { return S.stats.clicks >= 1000; } },
    { id: 'parmak',   icon: '💪', name: 'Parmak Kası',             desc: '10.000 kez tıkla.',                      ok: function (S) { return S.stats.clicks >= 1e4; } },
    { id: 'seri',     icon: '⚡', name: 'Seri Tıklayıcı',          desc: '10 saniyede 100 tık.',                   ok: function () { return G.clickLog.length >= 100; } },
    { id: 'seriuretim',icon: '⚙️', name: 'Seri Üretim',             desc: 'Saniyede 100 telefon tedarik et.',       ok: function () { return G.supTotal() >= 100; } },
    { id: 'sanayici', icon: '🏗️', name: 'Sanayici',                desc: 'Saniyede 10.000 telefon tedarik et.',    ok: function () { return G.supTotal() >= 1e4; } },
    { id: 'lojistik', icon: '🚚', name: 'Lojistik Dâhisi',         desc: 'Lojistik Merkezi\'ne geç.',              ok: function (S) { return S.depot >= 3; } },
    { id: 'tikabasa', icon: '📦', name: 'Depo Tıka Basa',          desc: 'En az 500\'lük depoyu ağzına kadar doldur.', ok: function (S) { return G.depotCap() >= 500 && S.stock >= G.depotCap() - 0.5; } },
    { id: 'kapak',    icon: '📞', name: 'Kapak Açıldı',            desc: 'Kapaklı Telefon çağına geç.',            ok: function (S) { return S.era >= 1; } },
    { id: 'dokun',    icon: '👉', name: 'Dokun Bana',              desc: 'İlk Dokunmatik çağına geç.',             ok: function (S) { return S.era >= 2; } },
    { id: 'akilli',   icon: '🧠', name: 'Akıllı Adım',             desc: 'Akıllı Telefon çağına geç.',             ok: function (S) { return S.era >= 3; } },
    { id: 'amiral',   icon: '⚓', name: 'Amiral Gemisi',           desc: 'Amiral Gemisi çağına geç.',              ok: function (S) { return S.era >= 4; } },
    { id: 'katla',    icon: '🪭', name: 'Katla Katla',             desc: 'Katlanır Telefon çağına geç.',           ok: function (S) { return S.era >= 5; } },
    { id: 'pazarlik', icon: '🧔', name: 'Pazarlığın Hası',         desc: '10 pazarlıkçı müşteriyi kabul et.',      ok: function (S) { return S.stats.customers >= 10; } },
    { id: 'kadro',    icon: '🧑‍🤝‍🧑', name: 'Tam Kadro',          desc: 'Tüm ekibi işe al.',                      ok: function (S) { return D.CREW.every(function (c) { return S.crew[c.id]; }); } },
    { id: 'unutma',   icon: '⏰', name: 'Dükkânı Açık Unutma',     desc: 'Toplam 1 saat oyna.',                    ok: function (S) { return S.stats.playAll >= 3600; } },
    { id: 'borsa',    icon: '📈', name: 'Borsa Kurdu',             desc: 'İlk halka arzını yap.',                  ok: function (S) { return S.stats.ipos >= 1; } },
    { id: 'patron',   icon: '🎩', name: 'Holding Patronu',         desc: '50 hisseye ulaş.',                       ok: function (S) { return S.shares >= 50; } }
  ];
  function checkAch() {
    G.ACH.forEach(function (a) {
      if (!G.S.ach[a.id] && a.ok(G.S)) { G.S.ach[a.id] = Date.now(); G.emit('ach', a); }
    });
  }

  // ---------- ana döngü ----------
  var supOrder = D.SUPPLIERS.map(function (_, i) { return i; }).sort(function (a, b) { return D.SUPPLIERS[a].mult - D.SUPPLIERS[b].mult; });
  var chanOrder = D.CHANNELS.map(function (_, i) { return i; }).sort(function (a, b) { return D.CHANNELS[b].mult - D.CHANNELS[a].mult; });
  var achT = 0;

  // eff < 1 çevrimdışı hesap içindir: olaylar ve ekip zamanlayıcıları çalışmaz
  G.tick = function (dt, eff) {
    var S = G.S, offline = eff !== undefined;
    eff = eff === undefined ? 1 : eff;
    S.t += dt;
    if (!offline) { S.stats.play += dt; S.stats.playAll += dt; }

    var bp = G.buyPrice(), bought = 0, spent = 0;
    var cap = G.depotCap();
    for (var a = 0; a < supOrder.length; a++) {
      var i = supOrder[a];
      if (!S.sup[i]) continue;
      var p = bp * D.SUPPLIERS[i].mult;
      var n = Math.min(G.supRate(i) * dt * eff, cap - S.stock, S.cash / p);
      if (n <= 0) continue;
      S.cash -= n * p; S.stock += n; bought += n; spent += n * p;
    }
    S.stats.bought += bought; S.stats.spent += spent;

    var sp = G.sellPrice(), sold = 0, rev = 0;
    for (var b = 0; b < chanOrder.length; b++) {
      var j = chanOrder[b];
      if (!S.chan[j]) continue;
      var m = Math.min(G.chanRate(j) * dt * eff, S.stock);
      if (m <= 0) continue;
      var r = m * sp * D.CHANNELS[j].mult;
      S.stock -= m; sold += m; rev += r;
    }
    if (sold > 0) earn(rev, sold);

    var k = Math.min(1, dt * 1.5);
    G.rt.buy += (bought / dt - G.rt.buy) * k;
    G.rt.sell += (sold / dt - G.rt.sell) * k;
    G.rt.profit += ((rev - spent) / dt - G.rt.profit) * k;

    if (offline) return;

    if (S.crew.selin) {
      S.selinT += dt;
      while (S.selinT >= 3) {
        S.selinT -= 3;
        var best = 0;
        for (var c = 1; c < D.CHANNELS.length; c++) if (G.unitCost('c', c) < G.unitCost('c', best)) best = c;
        S.chan[best]++;
      }
    }
    if (G.offer && G.offer.until < S.t) { var o = G.offer; G.offer = null; G.emit('offerDone', o); }
    if (S.t >= S.nextEvent) {
      S.nextEvent = S.t + 120 + Math.random() * 120;
      if (!G.offer) rollEvent();
    }
    if (S.crew.nurten && !G.offer && S.t >= S.nextOffer && (S.cd.nurten || 0) <= S.t) {
      var pct = 1 + Math.floor(Math.random() * 10);
      G.offer = { id: 'nurten', until: S.t + 30, dur: 30, pct: pct, title: 'Muhasebeci Ezgi\'nin teklifi',
        text: 'Kasadaki paranın %' + pct + '\'i kadar getiri garanti. Kabul edersen 30 dk yeni teklif yok.', btn: 'Kabul' };
      S.nextOffer = S.t + 300;
      G.emit('offer', G.offer);
    }
    achT += dt;
    if (achT >= 1) { achT = 0; checkAch(); }
  };

  // Çevrimdışı ilerleme: dilimlere bölerek hesapla
  G.offline = function (sec) {
    sec = Math.min(sec, D.OFFLINE_MAX);
    if (sec < 30) return null;
    var c0 = G.S.cash, s0 = G.S.stats.sold, steps = 200, dt = sec / steps;
    for (var i = 0; i < steps; i++) G.tick(dt, D.OFFLINE_EFF);
    G.rt = { buy: 0, sell: 0, profit: 0 };
    return { sec: sec, cash: G.S.cash - c0, sold: G.S.stats.sold - s0 };
  };
})();
