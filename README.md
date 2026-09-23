# 📱 Cepten Cebe · Telefon İmparatorluğu

Tarayıcıda oynanan bir idle/clicker oyunu. Tuşlu telefonla elden satışa başlıyorsun; telefoncuya toptan satış, mahalle dükkânı, AVM mağazası, montaj atölyesi ve fabrikayla büyüyüp sonunda Mars'ta bayilik açıyorsun.

🎮 **Oyna:** https://blitzhan.github.io/cepten-cebe/

## Nasıl oynanır

- **AL** telefon alır, **SAT** satar. Kâr, satış ile alış arasındaki fark.
- **Tedarik** sekmesindeki birimler saniyede telefon alır, **Satış** sekmesindekiler satar. İkisini dengede tut: depo dolarsa alım durur, stok biterse satış kanalları boşta kalır.
- **Şimdi ne yapmalı?** AL/SAT'ın altındaki tabela, darboğazın tedarikte mi satışta mı olduğunu söyler ve o an en verimli yatırımı gösterir. Tek tıkla alınır.
- **Kondisyon** satış fiyatını çarpar. "Parça için sök" yükseltmeleri stoktaki telefonlarla ödenir ve şansa bağlıdır.
- **Tecrübeye çevir**: bir tedarik ya da satış türünden yeterince birimin olunca (Kuzen Gökhan için 50) o kadarını kapatırsın, para iadesi olmaz, kalıcı kondisyon kazanırsın. Her tür için turda bir kez. Başta işe yarayan birimler oyunun ortasında böylece kaliteye dönüşür (Dr. Meth'teki işçi feda etme).
- **Çağ atla**: tuşlu → kapaklı → dokunmatik → akıllı → amiral gemisi → katlanır.
- **Ekip**: Mağaza Müdürü, Usta Teknisyen, Muhasebeci, Pazarlamacı, İK'cı ve Avukat oyuna yeni mekanikler ekler.
- **Halka arz**: yeterince kazanınca her şeyi sıfırlayıp kalıcı bonus veren hisse alırsın.
- Klavye: `A` al, `S` sat.

Oyun tarayıcına 10 saniyede bir kaydedilir. Oyun kapalıyken ekip yarı verimle çalışmaya devam eder (en fazla 8 saat).

## Geliştirme

Derleme adımı yok, saf HTML/CSS/JS.

```bash
node tools/serve.js        # http://localhost:8765
node tools/sim.js 6 3      # denge simülasyonu: 6 saat, saniyede 3 tık
```

| Dosya | İçerik |
|---|---|
| `js/data.js` | Tüm denge tabloları (fiyatlar, hızlar, yükseltmeler) |
| `js/engine.js` | Ekonomi, olaylar, başarımlar (DOM'a dokunmaz) |
| `js/state.js` | Kayıt, yükleme, dışa/içe aktarma |
| `js/ui.js` | Arayüz ve oyun döngüsü |
| `js/art.js` | SVG telefon ve para görselleri |
| `js/audio.js` | Web Audio ile üretilen sesler |
| `tools/sim.js` | Botla denge testi. `RATE`, `COST`, `TIERK`, `ERA`, `ERAK`, `UP`, `IPO` ortam değişkenleriyle deneme yapılır |

Oyun fikri [Dr. Meth](https://drmeth.com/)'in iki butonlu üret-sat döngüsünden esinlendi.
