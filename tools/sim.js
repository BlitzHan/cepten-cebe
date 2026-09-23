// Denge simülasyonu: açgözlü bir bot oyunu oynar, kilometre taşlarının zamanını yazar.
// Kullanım: node tools/sim.js [saat=6] [tık/sn=4]
var fs = require('fs'), path = require('path'), vm = require('vm');
var root = path.join(__dirname, '..', 'js');
var simT = 0;
globalThis.G = { };
vm.runInThisContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'));
// Deneme çarpanları: RATE=0.5 ERA=2 UP=2 COST=3 node tools/sim.js
(function (D, e) {
  var k = function (n) { return +(e[n] || 1); };
  [D.SUPPLIERS, D.CHANNELS].forEach(function (L) { L.forEach(function (u, i) { u.rate *= k('RATE'); u.cost *= k('COST') * Math.pow(k('TIERK'), i); }); });
  D.ERAS.forEach(function (x, i) { x.cost *= k('ERA') * Math.pow(k('ERAK'), Math.max(0, i - 1)); });
  D.GLOBAL_UPS.concat(D.CLICK_TIERS).forEach(function (u) { u.cost *= k('UP'); });
  D.DEPOTS.forEach(function (x) { x.cost *= k('UP'); });
  D.CREW.forEach(function (x) { x.cost *= k('UP'); });
  if (e.IPO) D.IPO_MIN = +e.IPO;
})(globalThis.G.D, process.env);
vm.runInThisContext(fs.readFileSync(path.join(root, 'engine.js'), 'utf8'));
var G = globalThis.G, D = G.D;
G.now = function () { return simT * 1000; };

var HOURS = +(process.argv[2] || 6), CPS = +(process.argv[3] || 4);
var marks = {}, log = [];
function mark(k) { if (!marks[k]) { marks[k] = simT; log.push([simT, k]); } }
G.on(function (type, d) {
  if (type === 'era') mark('Çağ: ' + d.name);
  if (type === 'hire') mark('Ekip: ' + d.name);
  if (type === 'depot') mark('Depo: ' + d.name);
});

function sScore(i) { var u = D.SUPPLIERS[i]; return u.rate * (1.25 - u.mult) / G.unitCost('s', i); }
function cScore(i) { var u = D.CHANNELS[i]; return u.rate * u.mult / G.unitCost('c', i); }
function best(n, f) { var b = 0; for (var i = 1; i < n; i++) if (f(i) > f(b)) b = i; return b; }

var dt = 0.1, clickAcc = 0, decide = 0;
while (simT < HOURS * 3600) {
  simT += dt;
  G.tick(dt);
  clickAcc += CPS * dt;
  while (clickAcc >= 2) { clickAcc -= 2; G.clickBuy(); G.clickSell(); }
  if (G.offer) G.acceptOffer();
  decide += dt;
  if (decide < 1) continue;
  decide = 0;
  var S = G.S;
  if (G.canIpo()) { mark('HALKA ARZ açıldı (' + G.ipoGain() + ' hisse)'); break; }
  G.buyEra();
  if (S.stock >= G.depotCap() * 0.8 || G.supTotal() * 20 > G.depotCap()) G.buyDepot();
  G.partsAvailable().forEach(function (p) { if (S.stock >= p.phones && S.stock * 0.5 >= p.phones * 0.2) G.tryPart(p.id); });
  D.CREW.forEach(function (c) { if (S.cash >= c.cost * 2) G.hire(c.id); });
  for (var guard = 0; guard < 50; guard++) {
    var ups = G.upgradesAvailable();
    var bs = best(D.SUPPLIERS.length, sScore), bc = best(D.CHANNELS.length, cScore);
    var wantSup = G.supTotal() < G.chanTotal() * 1.05;
    var unitCost = wantSup ? G.unitCost('s', bs) : G.unitCost('c', bc);
    if (ups.length && ups[0].cost <= unitCost * 3 && ups[0].cost <= S.cash) { G.buyUpgrade(ups[0].id); continue; }
    if (unitCost <= S.cash) { wantSup ? (S.sup[bs]++, S.cash -= unitCost) : (S.chan[bc]++, S.cash -= unitCost); continue; }
    break;
  }
  D.CHANNELS.forEach(function (c, i) { if (S.chan[i]) mark('Kanal: ' + c.name); });
  D.SUPPLIERS.forEach(function (c, i) { if (S.sup[i]) mark('Tedarik: ' + c.name); });
  [1e4, 1e6, 1e8, 1e9, 1e10].forEach(function (x) { if (S.stats.earnedAll >= x) mark('Kazanç ' + G.fmt(x)); });
}

function t(s) { var m = s / 60; return m < 60 ? m.toFixed(1) + ' dk' : (m / 60).toFixed(2) + ' sa'; }
log.forEach(function (l) { console.log(t(l[0]).padStart(9), ' ', l[1]); });
var S = G.S;
console.log('\nSon durum @', t(simT), '| nakit', G.fmt(S.cash), '| kazanç', G.fmt(S.stats.earned),
  '| kâr/sn', G.fmt(G.rt.profit), '| alış/sn', G.fmt(G.supTotal()), '| satış/sn', G.fmt(G.chanTotal()),
  '| kondisyon', Math.round(S.cond * 100) + '%', '| çağ', G.era().name);
console.log('Tedarik:', S.sup.join(' '), '| Kanal:', S.chan.join(' '));
