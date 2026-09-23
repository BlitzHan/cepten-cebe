# Cepten Cebe — Telefon İmparatorluğu (Oyun Planı)

Tarayıcıda oynanan, Dr. Meth tarzı bir idle/clicker. Tek oyuncu, kurulum yok, GitHub Pages'ten açılır.
Hedef adres: `https://blitzhan.github.io/cepten-cebe/`

> **Denge notu (uygulama sırasında):** Aşağıdaki tablolardaki fiyat ve hızlar ilk taslaktı. `tools/sim.js` ile yapılan testlerde bot halka arza 10 dakikada ulaştı. Bu yüzden son değerler değişti:
> - Çağlar kârı ×5 değil ×3 artırıyor, çağ bedelleri her adımda yaklaşık ×300 büyüyor.
> - Üst kademe birimler kademe başına ×1,5 daha pahalı.
> - Halka arz eşiği bu turda 30 Mr ₺ ciro.
>
> - **Gerçekçi fiyatlar (sonradan):** tüm para değerleri ×7,5 büyütüldü. Çağ alış/satış fiyatları: tuşlu 750/1.000, kapaklı 2.000/2.600, dokunmatik 5.000/6.500, akıllı 18.000/23.500, amiral gemisi 65.000/85.000, katlanır 110.000/145.000 ₺. Başlangıç nakiti 7.500 ₺, halka arz eşiği 225 Mr ₺. Eski kayıtlar otomatik dönüştürülür (kayıt sürümü 2).
>
> - **Kademe verimi (sonradan):** ilk dengede her kademe bir öncekinden lira başına 4–10 kat verimsizdi; oyuncu hep ilk kademeye takılıyordu. Artık kademe maliyeti `hız × 2,5^kademe / ilk kademe verimi × 2`. Her kademe bir öncekinden ×2,5 verimsiz; bir alt kademeden 6–7 fazla alınca üst kademe öne geçer. Çağ bedelleri ×3.
>
> Sonuç: bot yaklaşık 20 dk'da Mahalle Dükkânı'na, 1 saatte AVM'ye, yaklaşık 1,5–1,7 saatte halka arza (öneriyi izleyen bot: Mahalle 16 dk, AVM 44 dk) ulaşıyor. Güncel sayılar her zaman `js/data.js` içinde.

---

## 1. Dr. Meth'ten çıkardıklarım (kaynak kodu incelendi)

| Dr. Meth mekaniği | Nasıl çalışıyor | Bizdeki karşılığı |
|---|---|---|
| İki büyük buton: METH (pişir) / CASH (sat) | Biri stok üretir, diğeri stoğu paraya çevirir | **AL** (telefon al) / **SAT** (telefon sat) |
| Purity (saflık) ve not (grade) | Satış fiyatını çarpar, %100'ü geçebiliyor | **Kondisyon notu**: Hurda → Kutusunda Sıfır → Koleksiyonluk |
| Cooks (aşçılar), mekânlara yerleşir | Saniyede gram üretir | **Tedarik ekibi**: saniyede telefon alır |
| Dealers (satıcılar), territory expansion | Stoğu otomatik satar, bölge büyüdükçe kapasite artar | **Satış kanalları**: elden → telefoncu → mahalle → AVM → online |
| Mekânlar (trailer, house, lab, facility…), en fazla 5 slot, yarı fiyatına geri satılabilir | Kapasite sınırı, yer açmak için eskiyi satma | **Depo** kapasitesi + dükkân devretme (%50'ye satış) |
| Yükseltmeler **gram** ile alınır, başarı ihtimali var (%75/%50/%20) | Kumar hissi, stoktan fedakârlık | **Parça için sök**: yükseltme stoktaki telefonlarla ödenir, şansa bağlı |
| Meth görseli yükseldikçe değişir (meth0–4) | İlerlemenin görünür hali | Telefon görseli çağ atlar: tuşlu → kapaklı → dokunmatik → akıllı → katlanır |
| Özel karakterler (Joe Bob, yatırımcı, süper kimyager) | Otomatik işe alım, %1–10 yatırım teklifi (30 dk bekleme), combo ile purity | **Ekip**: İK'cı, Muhasebeci, Usta Teknisyen, Müdür, Pazarlamacı |
| Ekrana gelen kişi (kabul et butonu) | Rastgele teklif | **Kapıda pazarlıkçı müşteri** olayı |
| Son oyun: "Goodbye Earth", güneş, çekirdek | Dünya dışına açılma | Ay Üssü Mağazası, Mars Bayiliği |
| Başarımlar, istatistik, export/import kayıt | Tekrar oynama sebebi | Aynısı + Türkçe esprili başarımlar |

**Temel fark:** Dr. Meth'te üretim bedava, bizde alış para ister. Kâr = (satış − alış) × hacim. Bu yüzden ikinci bir gerilim ekleniyor: **nakit akışı**. Çok alıp satamazsan paran depoda telefon olarak yatar.

---

## 2. Kaynaklar

- **₺ Nakit**: her şeyin parası.
- **📱 Stok**: depodaki telefon adedi. Depo kapasitesiyle sınırlı.
- **⭐ Kondisyon (%)**: satış fiyatı çarpanı. Not tablosu:

| Kondisyon | Not | Etiket |
|---|---|---|
| < %60 | D | Hurda |
| %60 | C | Çizikli |
| %70 | B | İyi |
| %80 | A | Çok İyi |
| %90 | A+ | Mükemmel |
| %100 | S | Kutusunda Sıfır |
| %125 | S+ | Mühürlü |
| %150 | ★ | Koleksiyonluk |

Satış fiyatı = temel satış × (0,5 + kondisyon) × kanal çarpanı × kalıcı çarpanlar.
Başlangıç: %50 kondisyon, 1.000 ₺ nakit, 0 stok.

---

## 3. Tıklama döngüsü

- **AL**: 1 telefonu alış fiyatına alır (yükseltmeyle 2, 5, 25, 100…).
- **SAT**: stoktan aynı adedi satar.
- Hızlı tıklama **kombo** sayar; Usta Teknisyen işe alınınca kombo kondisyonu geçici artırır.
- Tıklamada yüzen "+₺" ve "+1 📱" yazıları.
- **Kilitlenme önlemi**: nakit alışa yetmez ve stok 0 ise "Çekmecedeki eski telefonu bul" butonu çıkar, bedava hurda telefon verir.

### Telefon çağları (buton görseli ve fiyat seviyesi)

| Çağ | Görsel | Alış / Satış (temel) | Açılma şartı |
|---|---|---|---|
| 1 | Tuşlu | 100 / 130 ₺ | Başlangıç |
| 2 | Kapaklı | 500 / 650 ₺ | 25 Bin ₺ + 500 satış |
| 3 | İlk dokunmatik | 2,5 Bin / 3,3 Bin ₺ | 1 Mn ₺ |
| 4 | Akıllı telefon | 12 Bin / 16 Bin ₺ | 50 Mn ₺ |
| 5 | Amiral gemisi | 60 Bin / 80 Bin ₺ | 2,5 Mr ₺ |
| 6 | Katlanır | 300 Bin / 410 Bin ₺ | 150 Mr ₺ |

Çağ atlayınca alış ve satış birlikte büyür, marj oranı korunur, mutlak kâr katlanır.

---

## 4. Otomasyon: iki kol

Birim fiyatı: `temel × 1,15^sahip_olunan` (Cookie Clicker standardı).

### Tedarik (saniyede telefon ALIR, nakitten düşer)

| # | Birim | Hız (/sn) | Alış çarpanı | Temel fiyat |
|---|---|---|---|---|
| 1 | Kuzen Gökhan (çekmeceleri toplar) | 0,2 | ×0,90 | 150 ₺ |
| 2 | İlan Avcısı | 1 | ×0,95 | 1,2 Bin |
| 3 | Geri Alım Tezgâhı | 5 | ×0,85 | 13 Bin |
| 4 | Toptancı Anlaşması | 25 | ×0,90 | 140 Bin |
| 5 | İthalat Hattı | 120 | ×0,80 | 1,6 Mn |
| 6 | **Montaj Atölyesi** (fabrika kolu başlar) | 600 | ×0,60 | 20 Mn |
| 7 | **Fabrika** | 3 Bin | ×0,50 | 300 Mn |
| 8 | **Mega Fabrika** | 15 Bin | ×0,40 | 5 Mr |
| 9 | Yörünge Fabrikası | 80 Bin | ×0,30 | 90 Mr |

Fabrika kolu pahalı ama birim maliyeti düşük, yani marjı büyüten asıl yer burası.

### Satış kanalları (saniyede telefon SATAR)

| # | Kanal | Hız (/sn) | Satış çarpanı | Temel fiyat |
|---|---|---|---|---|
| 1 | Elden Satış (WhatsApp durumu) | 0,2 | ×1,10 | 150 ₺ |
| 2 | Telefoncuya Toptan | 2 | ×0,85 | 1 Bin |
| 3 | Mahalle Dükkânı | 5 | ×1,00 | 12 Bin |
| 4 | Çarşı Mağazası | 20 | ×1,05 | 130 Bin |
| 5 | AVM Mağazası | 100 | ×1,20 | 1,5 Mn |
| 6 | Online Mağaza | 500 | ×1,00 | 18 Mn |
| 7 | Zincir Marka | 2,5 Bin | ×1,15 | 250 Mn |
| 8 | İhracat | 12 Bin | ×0,95 | 4 Mr |
| 9 | Mars Bayiliği | 70 Bin | ×1,50 | 80 Mr |

Toptan kanallar hızlı ama ucuz satar, AVM ve zincir pahalı ama yavaş. Oyuncu karışımı kendi seçer.

### Denge göstergesi
Ekranda canlı "Alış hızı / Satış hızı" çubuğu. Tedarik öndeyse stok birikir ve depo dolunca otomatik alım durur. Satış öndeyse kanallar boşta kalır. Nakit bitince tedarik, parası yettiği kadar alır. Asla eksiye düşülmez.

### Depo (Dr. Meth'teki mekân sınırının karşılığı)
Dolap 50 → Oda 500 → Depo 5 Bin → Lojistik Merkezi 100 Bin → Liman Antreposu 5 Mn. Her seviye bir kerelik yükseltme.

### Tecrübeye çevir (sonradan eklendi)
Dr. Meth'te son yükseltmeden sonra belli sayıda aşçıyı feda edip saflık kazanılıyordu. Bizde her tedarik ve satış türünün bir eşiği var (kademe sırasıyla 50, 50, 40, 40, 30, 30, 25, 20, 15 birim). Eşiğe ulaşınca o kadar birim kapatılır, para iadesi yok, kalıcı +%3 ile +%7 arası kondisyon gelir. Her tür için turda bir kez yapılabilir, böylece al-kapat döngüsü sömürülemez. 18 türün tamamı yaklaşık +%86 kondisyon eder.

### Dükkân devretme
Herhangi bir birimi toptan elden çıkarırsın, harcadığın paranın %50'si geri gelir (Dr. Meth'teki "sell house"). Erken oyunda ucuz birimleri satıp yeni kategoriye geçmek için.

---

## 5. Yükseltmeler (3 tür)

1. **Nakitle** (garanti): tıklama gücü ×2, kanal hızı ×2, alış indirimi %5 vb. Her birimin 1/10/25/50/100 adetinde açılan klasik katlayıcılar.
2. **"Parça için sök"** (stoktaki telefonlarla ödenir, şansa bağlı): kondisyon yükseltmeleri. Ör. "Ekran değişimi: 200 telefon, %75 ihtimalle +%5 kondisyon". Başarısız olursa telefonlar gider, yükseltme gelmez. Dr. Meth'in gram ile kumarlı yükseltmesinin karşılığı.
3. **Çağ atlama**: tablodaki şartlarla.

---

## 6. Ekip (bir kere işe alınan özel karakterler)

| Karakter | Etki |
|---|---|
| **Muhasebeci Ezgi** | 5 dakikada bir nakitin %1–10'u getirili yatırım teklifi, 30 dk bekleme |
| **Usta Teknisyen Fatih** | Kombo tıklama kondisyonu geçici artırır |
| **Mağaza Müdürü** | "Toplu Al / Toplu Sat" (bedelli, 2 dk bekleme) ve "Maks. birim al" butonları |
| **İK'cı Selin** | Her 3 sn'de en ucuz satış kanalına bedava personel ekler |
| **Pazarlamacı Ahmet** | "Kampanya" butonu: 30 sn satış fiyatı ×3, 10 dk bekleme |
| **Avukat** | Olumsuz olayların (gümrük, kur) süresini yarıya indirir |

---

## 7. Rastgele olaylar (2–4 dakikada bir)

- **Kapıda pazarlıkçı müşteri**: 10 sn içinde tıklarsan 50 telefonu ×1,5 fiyata toplu alır.
- **Yeni model tanıtıldı**: 60 sn satış hızı ×2.
- **Kur zıpladı**: 90 sn alış +%20, satış +%30. Stok varsa şimdi sat.
- **Gümrükte takıldı**: 60 sn İthalat Hattı durur.
- **Efsane Cuma**: 30 sn satış hacmi ×3, fiyat ×0,9.
- **Çekmece bereketi**: bedava 100 telefon.

---

## 8. Prestij: Halka Arz

- Toplam kazanç 1 Mr ₺'yi geçince "Halka Arz" açılır.
- Her şey sıfırlanır, **Hisse** kazanılır: `floor(sqrt(toplam_kazanç / 1 Mr))`.
- Her hisse kalıcı olarak tüm gelire +%2 ekler.
- Hisse ile açılan kalıcı ağaç: başlangıç nakiti, otomatik kalan ekip, depo seviyesi korunur vb.
- Son oyun (Dr. Meth'teki "Goodbye Earth"): Ay Üssü Mağazası, Mars Bayiliği, Yörünge Fabrikası.

---

## 9. Başarımlar (~30 adet, örnekler)

İlk Satış · Esnaf Oldun (ilk dükkân) · "Garantisi var mı abi?" (100 satış) · Kutusu Faturası Yok (hurda notla 1.000 satış) · Milyoner · Milyarder · Çekmeceler Boşaldı (Kuzen Gökhan'ı devret) · AVM Kralı · Fabrikatör · Seri Tıklayıcı (10 sn'de 100 tık) · Kutusunda Sıfır (%100 kondisyon) · Gökyüzü Sınır Değil (Mars Bayiliği) · Borsa Kurdu (ilk halka arz).

---

## 10. Arayüz

Dr. Meth düzeninin modern hali:

```
┌──────────────────────────┬────────────────────────────┐
│  ₺ 12,4 Bin   📱 38/50   │  İMPARATORLUĞUN            │
│  ⭐ B · İyi (%72)        │  [Mahalle Dükkânı ×3] ▦▦▦  │
│                          │  [Kuzen Gökhan ×12]          │
│    ┌──────┐  ┌──────┐    │  [İlan Avcısı ×4]          │
│    │ 📱AL │  │ ₺SAT │    │                            │
│    └──────┘  └──────┘    │  alış ▓▓▓▓▓░░ 8,4/sn       │
│                          │  satış ▓▓▓▓░░░ 6,1/sn      │
│ [Tedarik][Satış][Yükselt]│                            │
│ [Ekip]                   │  olay bildirimi alanı      │
│ ...liste...              │                            │
└──────────────────────────┴────────────────────────────┘
```

- Mobilde tek sütun, sekmeler alt çubukta.
- Görseller: elle çizilmiş inline SVG (düz vektör, sıcak renkler). Çağa göre değişen telefon, her kanal ve tedarik için ikon, sahip olunan dükkânların küçük vitrin çizimleri.
- Ses: Web Audio API ile üretilen tık, kasa ve başarım sesleri (dosya yok). Kapatma düğmesi var.
- Sayı biçimi: 1,2 Bin · 3,4 Mn · 5,6 Mr · 7,8 Tn · Katrilyon.

---

## 11. Teknik

- Saf HTML/CSS/JS, derleme yok. Pages doğrudan `main` dalından yayınlar.
- Dosyalar:
  - `index.html`
  - `css/style.css`
  - `js/data.js`: tüm denge tabloları (tek yerden ayar)
  - `js/state.js`: durum, kayıt/yükleme
  - `js/engine.js`: tick döngüsü, ekonomi, olaylar
  - `js/ui.js`: çizim, sekmeler, animasyonlar
  - `js/audio.js`
  - `assets/`: SVG'ler
  - `tools/sim.js`: dengeyi test eden headless simülasyon (Node)
- Tick 10/sn, arayüz `requestAnimationFrame`.
- Kayıt: localStorage'a 10 sn'de bir, kayıt dışa/içe aktarma (base64 metin).
- Çevrimdışı kazanç: %50 verimle, en fazla 8 saat, dönüşte "Sen yokken…" penceresi.

### Denge hedefleri (sim.js ile doğrulanacak)
İlk otomasyon: ~1 dk · ilk Mahalle Dükkânı: ~5 dk · AVM: ~30 dk · Fabrika: ~1,5 sa · ilk Halka Arz: ~3–4 sa aktif oyun.

---

## 12. Yapım aşamaları

1. **Çekirdek**: AL/SAT, nakit/stok, 3 tedarik + 3 kanal, kayıt. Oynanabilir ilk sürüm Pages'e çıkar.
2. **Tam ekonomi**: tüm birimler, depo, kondisyon, "parça için sök", çağlar.
3. **Ekip + olaylar + başarımlar**
4. **Halka Arz + son oyun**
5. **Cila**: SVG görseller, ses, animasyon, mobil, denge simülasyonu ile ince ayar.

Her aşama sonunda commit + push; Pages'te canlı sürüm güncellenir.

## 13. Depo ve yayın

- Klasör: `Antigravity/cepten-cebe/`
- GitHub: `BlitzHan/cepten-cebe` (Pages ücretsiz planda public repo ister)
- Pages: `main` dalı, kök klasör
