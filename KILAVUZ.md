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
| `.github/` | Puan durumunu otomatik güncelleyen görev | Hayır |

---

## BÖLÜM 1 — Siteyi yayına alma (bir kere yapılır)

### Adım 1: GitHub hesabını güvenceye al
1. github.com → sağ üstte profil resmin → **Settings** → **Password and authentication**.
2. **Two-factor authentication**'ı aç (telefona Google Authenticator gibi bir uygulama kur).

### Adım 2: GitHub'da yeni depo (repository) aç
1. github.com'da sağ üstteki **+** → **New repository**.
2. Repository name: `futbolun2yuzu`
3. **Private** seç (gizli). Cloudflare gizli depoyla da ücretsiz çalışır.
4. Başka hiçbir kutuyu işaretleme → **Create repository**.

### Adım 3: Dosyaları yükle
1. Bu zip'i bilgisayarında aç (sağ tık → Tümünü ayıkla).
2. Açılan sayfada **uploading an existing file** bağlantısına tıkla.
3. Zip'ten çıkan klasörün **içindeki her şeyi** (klasörün kendisini değil) sürükleyip bırak.
4. Aşağıda **Commit changes**'a bas.

> ⚠️ `.github` klasörü gizli olduğu için Windows'ta görünmeyebilir. Dosya Gezgini'nde
> **Görünüm → Göster → Gizli öğeler**'i aç ve onu da sürükle. Yüklenmezse sorun değil,
> sadece puan durumu otomatik güncellenmez (Adım 7'de başka yolu var).

### Adım 4: Cloudflare Pages'e bağla
1. dash.cloudflare.com'a gir (hesabın yoksa ücretsiz aç, 2FA'yı da aç).
2. Sol menüden **Workers & Pages** → **Create** (Oluştur).
3. **Pages** sekmesini seç → **Connect to Git** (ekranda Pages görünmezse
   "Looking to deploy Pages?" bağlantısına tıkla).
4. GitHub hesabını bağla, `futbolun2yuzu` deposunu seç → **Begin setup**.
5. Ayarlar:
   - **Framework preset:** None
   - **Build command:** `node build.js`
   - **Build output directory:** `dist`
6. **Save and Deploy**. 1-2 dakika sonra site `futbolun2yuzu.pages.dev` gibi bir adreste açılır.

### Adım 5: Alan adını al ve bağla
1. Cloudflare'de sol menü → **Domain Registration** → **Register Domains** →
   `futbolun2yuzu.com` yaz → satın al. (Cloudflare yenilemede de aynı fiyatı alır.)
2. **Auto-renew** (otomatik yenileme) açık olsun.
3. **Workers & Pages** → sitenin projesi → **Custom domains** → **Set up a custom domain** →
   `futbolun2yuzu.com` yaz → onayla. `www.futbolun2yuzu.com` için de aynısını yap.
4. Birkaç dakika içinde site kendi adresinde açılır (https kilidi otomatik gelir).

### Adım 6: Ayarları doldur
GitHub'da `veri/ayarlar.json` dosyasını aç → sağ üstteki **kalem** simgesi → düzenle:
- `"youtube": ""` → tırnakların arasına kanal adresini yaz, ör. `"https://www.youtube.com/@futbolun2yuzu"`
  (Bu doldurulmadan sitede abone ol düğmeleri görünmez.)
- Instagram, X, TikTok, e-posta varsa onları da doldur.
- **Commit changes**. Site 1-2 dakikada kendini günceller.

> Tırnak işaretlerini ve virgülleri silme. Hata yaparsan Cloudflare siteyi güncellemez,
> eski hali yayında kalır; site bozulmaz.

### Adım 7: Puan durumu otomatik güncellensin
Puan durumu, site her oluşturulduğunda TheSportsDB'den (ücretsiz) çekilir. Bunu her 3 saatte bir tekrarlatmak için:
1. Cloudflare → sitenin projesi → **Settings** → **Builds** → **Deploy hooks** → **Add deploy hook**.
   Ad: `puan-durumu`, Branch: `main` → Save. Çıkan uzun adresi **kopyala**.
2. GitHub → depo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
   - Name: `CLOUDFLARE_DEPLOY_HOOK`
   - Secret: kopyaladığın adres → **Add secret**.
3. GitHub → **Actions** sekmesi → "Puan durumunu guncelle" → **Run workflow** ile bir kez dene.

Artık tablo günde 8 kez kendini yeniler. Bu adres gizli kalır, kimse göremez.

---

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

## Sorun çıkarsa
- **Site güncellenmedi:** Cloudflare → proje → **Deployments**. Kırmızı (Failed) olana tıkla,
  en alttaki "HATA:" satırı hangi dosyada sorun olduğunu söyler (çoğunlukla .json'da eksik virgül/tırnak).
- **Puan durumu boş:** TheSportsDB o an yanıt vermemiş olabilir; 3 saat sonra kendiliğinden düzelir.
  Ücretsiz kaynak bazen tablonun bir kısmını verebilir; uzun süre eksik kalırsa söyle, başka çözüm bakarız.
