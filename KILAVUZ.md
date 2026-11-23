# Futbolun 2 Yüzü — Kurulum ve Kullanım Kılavuzu

Bu kılavuz, siteyi yayına almak ve sonra yazı eklemek için gereken her şeyi adım adım anlatır.
Kod bilgisi gerekmez.

---

## Klasörler ne işe yarıyor?

| Klasör / dosya | Ne var? | Dokunacak mısın? |
|---|---|---|
| `yazilar/` | Her yazı ayrı bir `.md` dosyası | **Evet**, yazı eklerken |
| `veri/ayarlar.json` | YouTube bağlantısı, son dakika, hakkımızda metni | **Evet** |
| `veri/transferler.json` | Transfer masası tablosu | **Evet** |
| `veri/iki-yuz.json` | "Haftanın Tartışması" bölümü | **Evet** |
| `public/gorseller/` | Yazılarda kullanacağın resimler | **Evet**, resim eklerken |
| `public/` (diğerleri) | Logo, renkler (style.css) | Hayır |
| `build.js` | Siteyi oluşturan program | **Hayır** |
| `.github/` | Siteyi otomatik yayınlayan görev | Hayır |

---

## BÖLÜM 1 — Siteyi yayına alma (bir kere yapılır)

Site GitHub Pages'te ücretsiz yayınlanır. Her yazı eklediğinde ve her 3 saatte bir
(puan durumu için) kendini otomatik günceller.

### Adım 1: GitHub hesabını güvenceye al
github.com → profil resmin → **Settings** → **Password and authentication** →
**Two-factor authentication**'ı aç.

### Adım 2: Yeni depo aç
1. github.com'da sağ üstteki **+** → **New repository**.
2. Repository name: `futbolun2yuzu`
3. **Public** seç. (GitHub Pages ücretsiz planda açık depo ister. Sitede gizli bilgi yok, sorun değil.)
4. Başka kutu işaretleme → **Create repository**.

### Adım 3: Dosyaları yükle
1. Zip'i aç, çıkan `futbolun2yuzu` klasörünün **içine gir**.
2. İçindeki her şeyi seç (Ctrl + A).
3. GitHub'daki depo sayfasında **uploading an existing file** bağlantısına tıkla.
4. Seçtiklerini sürükle bırak → **Commit changes**.
5. Kontrol: depo ana sayfasında `build.js`, `public`, `veri`, `yazilar`, `.github` en üst seviyede görünmeli.

### Adım 4: GitHub Pages'i aç
1. Depoda **Settings** → sol menüde **Pages**.
2. **Source** kısmında **GitHub Actions**'ı seç. (Deploy from a branch değil!)
3. Depoda üstteki **Actions** sekmesine geç → solda **Siteyi yayinla** → sağda **Run workflow** → yeşil **Run workflow**.
4. 1-2 dakika bekle, yeşil tik çıkınca **Settings → Pages** sayfasının üstünde site adresin yazar:
   `https://KULLANICIADIN.github.io/futbolun2yuzu/`

### Adım 5: Ayarları doldur
`veri/ayarlar.json` dosyasını aç → sağ üstteki **kalem** simgesi:
- `"youtube": ""` → tırnakların arasına kanal adresini yaz, ör. `"https://www.youtube.com/@kanaladi"`
  (Doldurulmadan sitede abone ol düğmeleri görünmez.)
- Instagram, X, TikTok, e-posta varsa doldur → **Commit changes**. Site 1-2 dakikada güncellenir.

> Tırnak ve virgülleri silme. Hata olursa site güncellenmez, eski hali yayında kalır; bozulmaz.

### Adım 6: Alan adını bağlama (aldığında)
1. futbolun2yuzu.com'u istediğin firmadan al (Cloudflare yenilemede de aynı fiyatı alır, öneririm).
2. GitHub → depo → **Settings** → **Pages** → **Custom domain** → `futbolun2yuzu.com` yaz → **Save**.
3. Alan adını aldığın firmanın **DNS** ayarlarına şu kayıtları ekle:
   - **A** kaydı, ad `@`, değer: `185.199.108.153`
   - **A** kaydı, ad `@`, değer: `185.199.109.153`
   - **A** kaydı, ad `@`, değer: `185.199.110.153`
   - **A** kaydı, ad `@`, değer: `185.199.111.153`
   - **CNAME** kaydı, ad `www`, değer: `KULLANICIADIN.github.io`
   (Cloudflare kullanıyorsan bu kayıtlarda turuncu bulutu kapatıp gri yap: "DNS only".)
4. Birkaç saat içinde GitHub'daki Pages sayfasında yeşil tik çıkar. **Enforce HTTPS** kutusunu işaretle.
5. Actions → Siteyi yayinla → Run workflow ile siteyi bir kez yeniden oluştur.

## BÖLÜM 2 — Günlük kullanım

### Yeni yazı eklemek
1. GitHub'da `yazilar` klasörüne gir → **Add file** → **Create new file**.
2. Dosya adı: `2026-11-20-derbi-analizi.md` gibi (tarih + kısa ad, Türkçe karakter ve boşluk kullanma).
3. En üste şu bilgileri yaz, altına yazını yaz:

```
---
baslik: Derbinin 2 Yüzü: Skorun göstermedikleri
tarih: 2026-11-20
saat: 21:45
kategori: Analiz
etiket: Derbi
yazar: Ali
ozet: Ana sayfada ve Google'da görünecek bir iki cümle.
manset: evet
etiketler: Süper Lig, Derbi
---

Yazının ilk paragrafı...
```

4. **Commit changes**. 1-2 dakika sonra yazı sitede.

**Kategori** şunlardan biri olmalı: `Haber`, `Makale`, `Analiz`, `Transfer`.
**manset: evet** yazarsan yazı ana sayfanın en büyük kutusuna çıkar (yoksa en yeni yazı çıkar).
**saat** isteğe bağlı; haberlerde "Son Haberler" listesinde görünür.
**taslak: evet** yazarsan yazı sitede görünmez.

Kalın yazı, ara başlık, liste, alıntı, resim, YouTube videosu, maç istatistiği ve grafik nasıl
eklenir, hepsi `yazilar/_ORNEK-YAZI.md` dosyasında örnekli olarak duruyor. Oradan kopyala.

### Resim eklemek
1. `public/gorseller` klasörü → **Add file** → **Upload files** → resmi yükle.
   (Dosya adında Türkçe karakter ve boşluk olmasın: `derbi-kapak.jpg`)
2. Yazının başına kapak için: `kapak: /gorseller/derbi-kapak.jpg`
3. Yazının içine: `![Açıklama](/gorseller/derbi-kapak.jpg)`

Sadece kendi çektiğin/ürettiğin ya da kullanım hakkı olan resimleri kullan.
Başka sitelerin fotoğraflarını izinsiz koyma; telif sorunu çıkabilir.

### Transfer eklemek
`veri/transferler.json` dosyasını düzenle. Her transfer süslü parantez içinde, aralarında virgül:

```
[
  {"oyuncu": "Oyuncu Adı", "nereden": "Eski Kulüp", "nereye": "Yeni Kulüp", "bedel": "5 M€", "durum": "Resmi"},
  {"oyuncu": "Başka Oyuncu", "nereden": "Kulüp", "nereye": "Kulüp", "bedel": "Kiralık", "durum": "Görüşmede"}
]
```
**durum**: `Resmi`, `Görüşmede` veya `Söylenti`. En üstteki ilk sırada görünür.

### Haftanın Tartışması (İki Yüz)
1. Önce iki yazıyı normal şekilde ekle (biri bir görüş, diğeri karşı görüş).
2. `veri/iki-yuz.json` dosyasında başlıkları, özetleri, yazarları doldur.
   `baglanti` kısmına yazıların adresini yaz: dosya adı `2026-11-20-var-karari.md` ise
   adres `/yazi/var-karari/` olur (tarih kısmı düşer).
3. `"aktif": false` → `"aktif": true` yap. Bölüm ana sayfada belirir.
4. `yorum_baglantisi`na YouTube videosunun ya da topluluk gönderisinin adresini koyarsan
   "Yorumlarda yaz" düğmesi çıkar.

### Son dakika bandı
`veri/ayarlar.json` içinde:
```
"son_dakika": { "metin": "Haber cümlesi", "baglanti": "/yazi/haberin-adresi/" },
```
Kaldırmak için `"metin": ""` yap.

---

## Gol ve asist krallığı
Kendi Google E-Tablon bağlıysa (`veri/ayarlar.json` → `gol_asist_tablosu`) listeler oradan okunur;
tabloyu güncellemen yeterli, site en geç 3 saatte kendini günceller. Tablo bağlı değilse veya okunamazsa
gol krallığı TFF'den alınır (asist krallığı sadece kendi tablondan gelir).

Gol krallığı listesi TFF'nin sitesinden otomatik alınır (günde 8 kez) ve "Kaynak: TFF" notuyla gösterilir.
TFF'nin kullanım şartlarına göre bilgiler kaynak gösterilerek yayımlanabilir ama **ticari amaçla kullanılamaz**.
Siteye reklam/sponsor koymadan önce gol krallığı için başka bir kaynağa geçilmeli.
TFF oyuncuların tam adını yazar. Bir ismi kısaltmak istersen `veri/ayarlar.json` içine şunu ekle:
`"oyuncu_adlari": { "TFF'DEKİ TAM AD": "Gösterilecek ad" }`

## Sorun çıkarsa
- **Site güncellenmedi:** Depoda **Actions** sekmesi. Kırmızı çarpılı olana tıkla → **olustur** →
  "Siteyi olustur" adımını aç. "HATA:" satırı hangi dosyada sorun olduğunu söyler
  (çoğunlukla .json'da eksik virgül/tırnak).
- **Puan durumu ve fikstür:** TFF'nin Süper Lig sayfasından alınır (günde 8 kez). TFF'ye ulaşılamazsa
  puan durumu Vikipedi'den, o da olmazsa yayındaki son tablodan gösterilir.
  TFF'nin şartlarına göre bilgiler kaynak gösterilerek kullanılabilir ama **ticari amaçla kullanılamaz**.
  Reklam/sponsor gelmeden önce puan durumu, fikstür ve gol krallığı için başka bir kaynağa geçilmeli.
- **Vikipedi yedeği:** Tablo İngilizce Vikipedi'deki sezon maddesinden alınır (ör. "2026–27 Süper Lig").
  Vikipedi gönüllülerle güncellendiği için maçlardan sonra birkaç saat gecikme olabilir.
  Tablonun altındaki "Kaynak: Vikipedi" yazısı lisans gereği zorunludur, silme.
  Yeni sezonda sayfa adı otomatik değişir. Bir takımın adını farklı göstermek istersen
  `veri/ayarlar.json` içindeki `takim_adlari` kısmına `"Vikipedideki ad": "Senin istediğin ad"` ekle.
