// Cepten Cebe — tüm denge tabloları burada. Sayı ayarı yapılacaksa önce buraya bakın.
var G = globalThis.G = globalThis.G || {};

G.D = {
  START_CASH: 7500,
  START_COND: 0.5,
  COST_GROWTH: 1.15,
  REFUND: 0.5,
  IPO_MIN: 2.25e11,         // halka arz için bu turda kazanılması gereken
  SHARE_UNIT: 7.5e9,       // hisse = floor(sqrt(toplam kazanç / SHARE_UNIT))
  SHARE_BONUS: 0.02,     // hisse başına otomatik hız bonusu
  ACH_BONUS: 0.01,       // başarım başına otomatik hız bonusu
  OFFLINE_EFF: 0.5,
  OFFLINE_MAX: 8 * 3600,

  // Telefon çağları: alış/satış temel fiyatı. cost = çağ atlama bedeli (nakit)
  ERAS: [
    { id: 'tuslu',      name: 'Tuşlu Telefon',     buy: 750,    sell: 1000,    cost: 0 },
    { id: 'kapakli',    name: 'Kapaklı Telefon',   buy: 2000,    sell: 2600,    cost: 2.2e6 },
    { id: 'dokunmatik', name: 'İlk Dokunmatik',    buy: 5000,   sell: 6500,   cost: 6.8e8 },
    { id: 'akilli',     name: 'Akıllı Telefon',    buy: 18000,  sell: 23500,  cost: 2e11 },
    { id: 'amiral',     name: 'Amiral Gemisi',     buy: 65000,  sell: 85000,  cost: 6e13 },
    { id: 'katlanir',   name: 'Katlanır Telefon',  buy: 110000, sell: 145000, cost: 1.8e16 }
  ],

  GRADES: [
    { min: 1.5,  g: '★',  label: 'Koleksiyonluk' },
    { min: 1.25, g: 'S+', label: 'Mühürlü' },
    { min: 1.0,  g: 'S',  label: 'Kutusunda Sıfır' },
    { min: 0.9,  g: 'A+', label: 'Mükemmel' },
    { min: 0.8,  g: 'A',  label: 'Çok İyi' },
    { min: 0.7,  g: 'B',  label: 'İyi' },
    { min: 0.6,  g: 'C',  label: 'Çizikli' },
    { min: 0,    g: 'D',  label: 'Hurda' }
  ],

  // Tedarik: saniyede telefon ALIR. mult = alış fiyatı çarpanı (düşük = ucuz)
  SUPPLIERS: [
    { id: 'kuzen',    icon: '🧒', name: 'Kuzen Gökhan',        rate: 0.1,   mult: 0.90, cost: 1500,   desc: 'Akrabaların çekmecelerindeki eski telefonları toplar.' },
    { id: 'ilan',     icon: '🔎', name: 'İlan Avcısı',         rate: 0.5,   mult: 0.95, cost: 38000,  desc: 'İkinci el ilanlarını gece gündüz tarar.' },
    { id: 'geri',     icon: '🔁', name: 'Geri Alım Tezgâhı',   rate: 2,     mult: 0.85, cost: 380000, desc: 'Müşterinin eskisini alır, yenisine sayar.' },
    { id: 'toptanci', icon: '📦', name: 'Toptancı Anlaşması',  rate: 8,    mult: 0.90, cost: 3.8e6, desc: 'Koli koli mal, peşin para.' },
    { id: 'ithalat',  icon: '🚢', name: 'İthalat Hattı',       rate: 35,    mult: 0.80, cost: 4.1e7, desc: 'Konteyner başına telefon. Gümrüğe dikkat.' },
    { id: 'atolye',   icon: '🔧', name: 'Montaj Atölyesi',     rate: 160,   mult: 0.60, cost: 4.7e8,   desc: 'Parçayı alıp kendin topluyorsun. Maliyet düşüyor.' },
    { id: 'fabrika',  icon: '🏭', name: 'Fabrika',             rate: 800,  mult: 0.50, cost: 5.9e9,   desc: 'Kendi markan, kendi bandın.' },
    { id: 'mega',     icon: '🏗️', name: 'Mega Fabrika',        rate: 4000,   mult: 0.40, cost: 7.3e10,   desc: 'Üç vardiya, robot kollar.' },
    { id: 'yorunge',  icon: '🛰️', name: 'Yörünge Fabrikası',   rate: 22000,   mult: 0.30, cost: 1e12,  desc: 'Sıfır yerçekiminde kusursuz lehim.' }
  ],

  // Satış kanalları: saniyede telefon SATAR. mult = satış fiyatı çarpanı (yüksek = kârlı)
  CHANNELS: [
    { id: 'elden',     icon: '🤝', name: 'Elden Satış',        rate: 0.1,   mult: 1.10, cost: 1500,   desc: 'WhatsApp durumuna "satılık" yazdın.' },
    { id: 'telefoncu', icon: '📲', name: 'Telefoncuya Toptan', rate: 1,   mult: 0.85, cost: 75000,  desc: 'Hızlı gider ama pazarlıkta kaybedersin.' },
    { id: 'mahalle',   icon: '🏪', name: 'Mahalle Dükkânı',    rate: 2,     mult: 1.00, cost: 380000, desc: 'Kepenk senin, tabela senin.' },
    { id: 'carsi',     icon: '🛍️', name: 'Çarşı Mağazası',     rate: 8,    mult: 1.05, cost: 3.8e6, desc: 'Ana caddede vitrin.' },
    { id: 'avm',       icon: '🏬', name: 'AVM Mağazası',       rate: 35,    mult: 1.20, cost: 4.1e7, desc: 'Kira yüksek, müşteri cüzdanı dolu.' },
    { id: 'online',    icon: '🌐', name: 'Online Mağaza',      rate: 160,   mult: 1.00, cost: 4.7e8, desc: 'Gece 3\'te bile sipariş düşer.' },
    { id: 'zincir',    icon: '🏢', name: 'Zincir Marka',       rate: 800,  mult: 1.15, cost: 5.9e9, desc: 'Her ilde bir şube.' },
    { id: 'ihracat',   icon: '✈️', name: 'İhracat',            rate: 4000,  mult: 0.95, cost: 7.3e10,   desc: 'Kargo uçağı dolusu telefon.' },
    { id: 'mars',      icon: '🚀', name: 'Mars Bayiliği',      rate: 22000,   mult: 1.50, cost: 1e12,  desc: 'Kızıl gezegende tek yetkili satıcı.' }
  ],

  // Tecrübeye çevir (Dr. Meth'teki işçi feda etme): o türden `need` birim kapatılır,
  // para iadesi yok, kalıcı +gain kondisyon. Her tür için turda bir kez. Sıra kademe sırasıdır.
  RETIRE: [
    { need: 50, gain: 0.03 }, { need: 50, gain: 0.03 }, { need: 40, gain: 0.04 },
    { need: 40, gain: 0.04 }, { need: 30, gain: 0.05 }, { need: 30, gain: 0.05 },
    { need: 25, gain: 0.06 }, { need: 20, gain: 0.06 }, { need: 15, gain: 0.07 }
  ],

  DEPOTS: [
    { name: 'Dolap',            cap: 50,  cost: 0 },
    { name: 'Oda',              cap: 500, cost: 90000 },
    { name: 'Depo',             cap: 5e3, cost: 2.9e6 },
    { name: 'Lojistik Merkezi', cap: 1e5, cost: 5.8e8 },
    { name: 'Liman Antreposu',  cap: 5e6, cost: 1.5e11 },
    { name: 'Yörünge Deposu',   cap: 1e9, cost: 5.8e13 }
  ],

  // Birim katlayıcıları: o birimden şu kadar olunca açılır, hızını ×2 yapar
  UNIT_TIERS: [
    { need: 10,  costX: 15,   name: 'Motivasyon Primi' },
    { need: 25,  costX: 150,  name: 'Yeni Ekipman' },
    { need: 50,  costX: 3000, name: 'Süreç İyileştirme' },
    { need: 100, costX: 6e4,  name: 'Otomasyon' },
    { need: 200, costX: 3e6,  name: 'Yapay Zekâ' }
  ],

  CLICK_TIERS: [
    { p: 2,    cost: 12000,   name: 'Çift El',   desc: 'Tıklama başına 2 telefon.' },
    { p: 5,    cost: 170000,  name: 'Poşet',     desc: 'Tıklama başına 5 telefon.' },
    { p: 20,   cost: 4.4e6, name: 'Koli',      desc: 'Tıklama başına 20 telefon.' },
    { p: 100,  cost: 2.3e8,   name: 'Palet',     desc: 'Tıklama başına 100 telefon.' },
    { p: 500,  cost: 2.3e10,  name: 'Kamyonet',  desc: 'Tıklama başına 500 telefon.' },
    { p: 3000, cost: 2.3e12,  name: 'Tır',       desc: 'Tıklama başına 3.000 telefon.' }
  ],

  // Genel nakit yükseltmeleri
  GLOBAL_UPS: [
    { id: 'pazarlik0', cost: 580000,   name: 'Pazarlık Ustası',     desc: 'Tüm alışlar %5 ucuz.',                 eff: { buy: 0.95 } },
    { id: 'guler0',    cost: 1.5e6,   name: 'Güler Yüz',           desc: 'Satış fiyatı ×1,1.',                   eff: { sell: 1.1 } },
    { id: 'reklam0',   cost: 2.9e6,   name: 'Afiş Kampanyası',     desc: 'Tüm satış kanalları %50 hızlı.',       eff: { chan: 1.5 } },
    { id: 'ag0',       cost: 2.9e6,   name: 'Tedarik Ağı',         desc: 'Tüm tedarik %50 hızlı.',               eff: { sup: 1.5 } },
    { id: 'pazarlik1', cost: 5.8e7,   name: 'Sert Pazarlık',       desc: 'Tüm alışlar %5 daha ucuz.',            eff: { buy: 0.95 } },
    { id: 'guler1',    cost: 1.5e8,   name: 'Garanti Belgesi',     desc: 'Satış fiyatı ×1,1.',                   eff: { sell: 1.1 } },
    { id: 'kasaSesi',  cost: 2.9e8,   name: 'Kasa Sesi',           desc: 'Tıklamalar otomatik hızın %3\'ü kadar ek iş yapar.', eff: {} },
    { id: 'reklam1',   cost: 2.9e8,   name: 'TV Reklamı',          desc: 'Tüm satış kanalları %50 hızlı.',       eff: { chan: 1.5 } },
    { id: 'ag1',       cost: 2.9e8,   name: 'Lojistik Anlaşması',  desc: 'Tüm tedarik %50 hızlı.',               eff: { sup: 1.5 } },
    { id: 'pazarlik2', cost: 5.8e9,   name: 'Tekel Gücü',          desc: 'Tüm alışlar %5 daha ucuz.',            eff: { buy: 0.95 } },
    { id: 'guler2',    cost: 1.5e10,   name: 'Marka Değeri',        desc: 'Satış fiyatı ×1,1.',                   eff: { sell: 1.1 } },
    { id: 'reklam2',   cost: 2.9e10,   name: 'Ünlü Yüz',            desc: 'Tüm satış kanalları %50 hızlı.',       eff: { chan: 1.5 } },
    { id: 'ag2',       cost: 2.9e10,   name: 'Küresel Tedarik',     desc: 'Tüm tedarik %50 hızlı.',               eff: { sup: 1.5 } },
    { id: 'guler3',    cost: 1.5e12,  name: 'Efsane Marka',        desc: 'Satış fiyatı ×1,15.',                  eff: { sell: 1.15 } },
    { id: 'reklam3',   cost: 2.9e12,  name: 'Galaktik Reklam',     desc: 'Tüm satış kanalları ×2.',              eff: { chan: 2 } },
    { id: 'ag3',       cost: 2.9e12,  name: 'Işık Hızında Kargo',  desc: 'Tüm tedarik ×2.',                      eff: { sup: 2 } }
  ],

  // "Parça için sök": stoktaki telefonlarla ödenir, şansa bağlı, kondisyonu artırır
  PARTS: [
    { id: 'p0', phones: 20,    chance: 0.9,  gain: 0.05, name: 'Ekran Koruyucu',        desc: 'Kırık ekranları değiştir.' },
    { id: 'p1', phones: 60,    chance: 0.75, gain: 0.05, name: 'Kılıf Hediye',          desc: 'Her satışa şeffaf kılıf.' },
    { id: 'p2', phones: 250,   chance: 0.75, gain: 0.08, name: 'Batarya Değişimi',      desc: 'Pil sağlığı %100.' },
    { id: 'p3', phones: 1000,  chance: 0.5,  gain: 0.10, name: 'Ekran Değişimi',        desc: 'Orijinal panel.' },
    { id: 'p4', phones: 4000,  chance: 0.5,  gain: 0.10, name: 'Kasa Yenileme',         desc: 'Çizikler tarih oldu.' },
    { id: 'p5', phones: 25000, chance: 0.2,  gain: 0.15, name: 'Anakart Onarımı',       desc: 'Mikro lehim ustalığı.' },
    { id: 'p6', phones: 80000, chance: 0.5,  gain: 0.10, name: 'Fabrika Ayarları',      desc: 'İçi de dışı da yeni.' },
    { id: 'p7', phones: 5e5,   chance: 0.2,  gain: 0.25, name: 'Kutusuna Geri Koy',     desc: 'Jelatini bile yerinde.' },
    { id: 'p8', phones: 2.5e6, chance: 0.2,  gain: 0.25, name: 'Mühür Makinesi',        desc: 'Açılmamış gibi.' },
    { id: 'p9', phones: 5e8,   chance: 0.1,  gain: 0.25, name: 'Koleksiyon Sertifikası', desc: 'Müzelik parça.' }
  ],

  CREW: [
    { id: 'mudur',  icon: '👔', name: 'Mağaza Müdürü',          cost: 230000,  desc: '×10 ve Maks alım; acil durumlar için Toplu Al (%10 pahalı) ve Toplu Sat (%80 fiyat), 2 dk bekleme.' },
    { id: 'hakan',  icon: '🛠️', name: 'Usta Teknisyen Fatih',   cost: 1.7e6,   desc: 'Hızlı tıklama kombosu kondisyonu geçici artırır (en çok +%25).' },
    { id: 'nurten', icon: '🧮', name: 'Muhasebeci Ezgi',        cost: 1.5e7,   desc: '5 dakikada bir %1–10 getirili yatırım teklifi. Kabul edince 30 dk bekler.' },
    { id: 'can',    icon: '📣', name: 'Pazarlamacı Ahmet',      cost: 1.5e8,   desc: '"Kampanya" butonu: 30 sn satış fiyatı ×2. 10 dk bekleme.' },
    { id: 'selin',  icon: '🧑‍💼', name: 'İK\'cı Selin',          cost: 1.5e9,   desc: 'Her 3 saniyede en ucuz satış kanalına bedava personel ekler.' },
    { id: 'deniz',  icon: '⚖️', name: 'Avukat Deniz',           cost: 1.5e10,   desc: 'Olumsuz olayların süresi yarıya iner.' }
  ],

  PERKS: [
    { need: 1,  name: 'Tohum Sermaye', desc: 'Halka arzdan sonra 25.000 ₺ ile başla.' },
    { need: 3,  name: 'Hazır Depo',    desc: 'Oda deposuyla başla.' },
    { need: 5,  name: 'Emektar Müdür', desc: 'Mağaza Müdürü hep kadroda.' },
    { need: 10, name: 'Tecrübe',       desc: 'Kapaklı Telefon çağında başla.' },
    { need: 25, name: 'Sadık Kadro',   desc: 'Tüm ekip kadroda başlar.' },
    { need: 50, name: 'Usta Eller',    desc: 'Kondisyon %70 ile başla.' }
  ]
};
