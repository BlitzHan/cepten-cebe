# Cepten Cebe · Tasarım sistemi

Dünya: **bir Türk telefoncusunun cephesi.** Ekran, kepengi yarı açık bir GSM dükkânı. Her birim ışıklı bir pleksi tabela, her fiyat bir vitrin çıkartması, kasa bir döviz bürosu LED panosu, günlük bir termal fiş.

## Kaçınılanlar
- Koyu mor zemin, neon kenarlı yuvarlak kartlar, jenerik dashboard hissi.
- Emoji ikonlar. Tüm ikonlar `js/icons.js`: 24'lük ızgara, 2px çizgi, yuvarlak uç.
- Herhangi bir clicker'a benzeyen kimliksiz görünüm.

## Renk (tek anlamlı bütçe)
| Rol | Değer | Nerede |
|---|---|---|
| Kepenk zemin | `#C8CCD0`, 14px lamel çizgili | Sayfa arka planı |
| Pleksi (yanan) | `#F7F5EE` | Alınabilir satırlar, levhalar |
| Pleksi (sönük) | `#DEDFDC` | Kilitli ya da parası yetmeyen öğeler |
| Kırmızı | `#D7261E` | SAT, para, satış noktaları, üst tabela, aktif sekme |
| Lacivert | `#1E3E96` | AL, tedarik, depo |
| Sarı | `#FFD21F` | Fiyat çıkartmaları, fırsatlar, tecrübe, başarımlar |
| LED | `#FF4436` / `#1A0D0B` | Sadece kasa |
| Mürekkep | `#16181C`, `#474C54` | Metin |

**Durum ışıkla anlatılır, renkle değil:** alınabilen tabela yanar (pleksi beyazı, renkli ikon kutusu, gölge), alınamayan söner (gri, ikon kutusu gri).

## Yazı
Tek aile: **Archivo** (değişken, `wdth` 62–125).
- Tabela: büyük harf, 800–900 kalınlık, `wdth` 68–82. Başlıklar, sekmeler, birim adları, butonlar, sayılar.
- Arayüz metni: `wdth` 100, 400–600. Açıklamalar ve ipuçları.
- Sayılar her yerde `tabular-nums`.

## Bileşenler
- **Dükkân tabelası (üst bar):** 48px, kırmızı ışıklı, alt kenarı alüminyum. Sağda çağ levhası ve ses.
- **Işıklı kutu (AL/SAT):** alüminyum çerçeve, radyal ışıklı yüz, dev daraltılmış harf, köşede eğik sarı fiyat çıkartması. Basınca floresan titremesi (`flick`).
- **Birim satırı (`.row`):** ikon kutusu, ad/açıklama/meta, büyük adet sayısı, işlem sütunu. `lit` = yanan tabela.
- **Fiyat etiketi (`.pricetag`):** delikli karton etiket biçimi (clip-path), alınabilirse sarı.
- **Yaka kartı (`.badge`):** ekip. İşe alınınca kırmızı "Kadroda" askısı.
- **Çıkartma (`.sticker`):** başarımlar, yuvarlak, hafif eğik.
- **Fiş (`.receipt`):** olay günlüğü, yırtık alt kenar.
- **Olay çıkartması:** sarı, hafif eğik, üstten yapışarak gelir.
- **Şimdi tabelası (`.advice`):** AL/SAT'ın hemen altında. Başlık şeridi darboğaz tarafının renginde (lacivert tedarik, kırmızı satış), yanında sarı "Şimdi" etiketi. Altında tek cümle neden ve tek tıkla alınabilen öneri kartı. Karar `G.advice()` içinde: alış/satış hızı, depo ve kasa karşılaştırılır, o taraftaki lira başına en çok telefon/sn getiren birim ya da yükseltme seçilir; tarafın hızının ya da açığın %3'ünden azını ekleyen seçenekler elenir.
- **Öneri işaretleri:** önerinin olduğu sekme sarı ve altı oklu; önerilen satırda sarı çerçeve ve "Şimdi en iyi yatırım" etiketi; zayıf şeritte kırmızı "Darboğaz" etiketi. Sarı noktalar yalnızca "burada alınabilecek bir şey var" anlamında kalır.
- **Tezgâh bandı:** alış (lacivert) ve satış (kırmızı) şeritleri. Soluk katman kapasite, akan katman otomasyonun sürekli akışı (`G.flow()`); manuel tıklamalar bandı etkilemez.

## Hareket
Tek dil: floresan tüp. AL/SAT basınca titreme, bant sürekli akar, olay çıkartması yapışır. Diğer her şey sade; `prefers-reduced-motion` tüm animasyonu kapatır.

## Yerleşim
Masaüstü: 360px tezgâh | vitrin | 290px dükkân duvarı. Sayfa kaymaz, sütunlar kendi içinde kayar. 1180px altında iki sütun, 760px altında tek sütun.
