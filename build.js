// =============================================================
//  Futbolun 2 Yüzü — site oluşturucu
//  Bu dosyaya dokunmana gerek yok. Yazılar "yazilar" klasöründe,
//  ayarlar ve veriler "veri" klasöründe.
//  Çalıştırma: node build.js   →  site "dist" klasörüne yazılır.
// =============================================================
'use strict';
const fs = require('fs');
const path = require('path');

const KOK = __dirname;
const CIKTI = path.join(KOK, 'dist');

// ---------- yardımcılar ----------
function oku(p) { return fs.readFileSync(path.join(KOK, p), 'utf8'); }
function jsonOku(p, varsayilan) {
  try { return JSON.parse(oku(p)); }
  catch (e) {
    if (fs.existsSync(path.join(KOK, p))) {
      console.error('HATA: ' + p + ' dosyası bozuk (virgül/tırnak hatası olabilir): ' + e.message);
      process.exit(1);
    }
    return varsayilan;
  }
}
function yaz(p, icerik) {
  if (TABAN && /\.html$/.test(p)) icerik = icerik.replace(/(href|src)="\/(?!\/)/g, '$1="' + TABAN + '/');
  const tam = path.join(CIKTI, p);
  fs.mkdirSync(path.dirname(tam), { recursive: true });
  fs.writeFileSync(tam, icerik);
}
function kopyala(kaynak, hedef) {
  if (!fs.existsSync(kaynak)) return;
  if (fs.statSync(kaynak).isDirectory()) {
    fs.mkdirSync(hedef, { recursive: true });
    for (const f of fs.readdirSync(kaynak)) kopyala(path.join(kaynak, f), path.join(hedef, f));
  } else {
    fs.copyFileSync(kaynak, hedef);
  }
}
function kac(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function slugla(s) {
  const harita = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'c', 'Ğ': 'g', 'Ö': 'o', 'Ş': 's', 'Ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' };
  return String(s).replace(/[çğıİöşüÇĞÖŞÜâîû]/g, function (h) { return harita[h]; })
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'yazi';
}
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
function tarihYaz(t) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t || '');
  if (!m) return '';
  return Number(m[3]) + ' ' + AYLAR[Number(m[2]) - 1] + ' ' + m[1];
}
function sayiMi(x) { return x !== '' && !isNaN(Number(x)); }

// ---------- ayarlar ----------
const A = jsonOku('veri/ayarlar.json', {});
// GitHub Pages geçici adresinde (kullanici.github.io/futbolun2yuzu) çalışabilmek için:
const SITE_ADRES = (process.env.SITE_URL || A.site_adresi || 'https://futbolun2yuzu.com').replace(/\/$/, '');
const TABAN = (process.env.SITE_BASE || '').replace(/\/$/, '');

// ---------- markdown (basit) ----------
function satirIci(s) {
  s = kac(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, metin, url) {
    const dis = /^https?:\/\//.test(url) && url.indexOf(SITE_ADRES) !== 0;
    return '<a href="' + url + '"' + (dis ? ' target="_blank" rel="noopener"' : '') + '>' + metin + '</a>';
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return s;
}
function youtubeId(url) {
  const m = /(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{11})/.exec(url);
  return m ? m[1] : null;
}
function istatistikBlok(baslik, satirlar) {
  const t = baslik.split('|').map(function (x) { return x.trim(); });
  let h = '<figure class="kutu istat"><div class="bas"><span class="renk-t">' + kac(t[0] || 'Ev sahibi') + '</span><span class="renk-o">' + kac(t[1] || 'Deplasman') + '</span></div>';
  for (const sat of satirlar) {
    const p = sat.split('|').map(function (x) { return x.trim(); });
    if (p.length < 3) continue;
    const a = parseFloat(String(p[1]).replace(',', '.').replace('%', '')) || 0;
    const b = parseFloat(String(p[2]).replace(',', '.').replace('%', '')) || 0;
    const top = a + b || 1;
    const aw = Math.round(a / top * 100);
    h += '<div class="sat"><div class="rak"><b>' + kac(p[1]) + '</b><span>' + kac(p[0]) + '</span><b>' + kac(p[2]) + '</b></div>' +
      '<div class="cubuk"><i style="width:' + aw + '%"></i><i style="width:' + (100 - aw) + '%"></i></div></div>';
  }
  return h + '</figure>';
}
function grafikBlok(baslik, satirlar) {
  const t = baslik.split('|').map(function (x) { return x.trim(); });
  const veri = [];
  let enBuyuk = 0;
  for (const sat of satirlar) {
    const p = sat.split('|').map(function (x) { return x.trim(); });
    if (p.length < 2) continue;
    const a = parseFloat(String(p[1]).replace(',', '.')) || 0;
    const b = p.length > 2 ? (parseFloat(String(p[2]).replace(',', '.')) || 0) : null;
    enBuyuk = Math.max(enBuyuk, a, b || 0);
    veri.push({ ad: p[0], a: a, b: b, as: p[1], bs: p[2] });
  }
  enBuyuk = enBuyuk || 1;
  let h = '<figure class="kutu grafik"><div class="lej"><span><i class="t-bg"></i>' + kac(t[0] || 'Değer') + '</span>' +
    (t[1] ? '<span><i class="o-bg"></i>' + kac(t[1]) + '</span>' : '') + '</div>';
  for (const v of veri) {
    h += '<div class="gs"><span class="ad">' + kac(v.ad) + '</span><div class="cc">' +
      '<div class="c"><i class="t-bg" style="width:' + Math.round(v.a / enBuyuk * 85) + '%"></i>' + kac(v.as) + '</div>' +
      (v.b !== null ? '<div class="c"><i class="o-bg" style="width:' + Math.round(v.b / enBuyuk * 85) + '%"></i>' + kac(v.bs) + '</div>' : '') +
      '</div></div>';
  }
  return h + '</figure>';
}
function markdown(md) {
  const satirlar = md.replace(/\r/g, '').split('\n');
  const out = [];
  let par = [], liste = null, listeTur = '';
  function paragrafBitir() { if (par.length) { out.push('<p>' + satirIci(par.join(' ')) + '</p>'); par = []; } }
  function listeBitir() { if (liste) { out.push('<' + listeTur + '>' + liste.map(function (l) { return '<li>' + satirIci(l) + '</li>'; }).join('') + '</' + listeTur + '>'); liste = null; } }
  for (let i = 0; i < satirlar.length; i++) {
    const s = satirlar[i];
    const st = s.trim();
    const blok = /^:::(istatistik|grafik)\s*(.*)$/.exec(st);
    if (blok) {
      paragrafBitir(); listeBitir();
      const ic = [];
      i++;
      while (i < satirlar.length && satirlar[i].trim() !== ':::') { if (satirlar[i].trim()) ic.push(satirlar[i].trim()); i++; }
      out.push(blok[1] === 'istatistik' ? istatistikBlok(blok[2], ic) : grafikBlok(blok[2], ic));
      continue;
    }
    if (!st) { paragrafBitir(); listeBitir(); continue; }
    let m;
    if ((m = /^(#{2,3})\s+(.*)$/.exec(st))) { paragrafBitir(); listeBitir(); out.push('<h' + m[1].length + '>' + satirIci(m[2]) + '</h' + m[1].length + '>'); continue; }
    if ((m = /^#\s+(.*)$/.exec(st))) { paragrafBitir(); listeBitir(); out.push('<h2>' + satirIci(m[1]) + '</h2>'); continue; }
    if ((m = /^>\s?(.*)$/.exec(st))) { paragrafBitir(); listeBitir(); out.push('<blockquote>' + satirIci(m[1]) + '</blockquote>'); continue; }
    if ((m = /^youtube:\s*(\S+)/i.exec(st))) {
      paragrafBitir(); listeBitir();
      const id = youtubeId(m[1]);
      if (id) out.push('<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/' + id + '" title="YouTube videosu" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>');
      continue;
    }
    if ((m = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(st))) {
      paragrafBitir(); listeBitir();
      out.push('<figure><img src="' + kac(m[2]) + '" alt="' + kac(m[1]) + '" loading="lazy">' + (m[1] ? '<figcaption>' + kac(m[1]) + '</figcaption>' : '') + '</figure>');
      continue;
    }
    if ((m = /^[-*]\s+(.*)$/.exec(st))) { paragrafBitir(); if (listeTur !== 'ul') listeBitir(); if (!liste) { liste = []; listeTur = 'ul'; } liste.push(m[1]); continue; }
    if ((m = /^\d+[.)]\s+(.*)$/.exec(st))) { paragrafBitir(); if (listeTur !== 'ol') listeBitir(); if (!liste) { liste = []; listeTur = 'ol'; } liste.push(m[1]); continue; }
    listeBitir();
    par.push(st);
  }
  paragrafBitir(); listeBitir();
  return out.join('\n');
}

// ---------- yazıları oku ----------
const KATEGORILER = {
  haber: { ad: 'Haber', yol: 'haberler', baslik: 'Haberler', aciklama: 'Süper Lig, Avrupa ve milli takımdan son gelişmeler.' },
  makale: { ad: 'Makale', yol: 'makaleler', baslik: 'Makaleler', aciklama: 'Görüş, taktik ve tarih yazıları.' },
  analiz: { ad: 'Analiz', yol: 'analiz', baslik: 'Veri Analizi', aciklama: 'Rakamların ve taktiklerin gösterdiği, skorun sakladığı taraf.' },
  transfer: { ad: 'Transfer', yol: 'transferler', baslik: 'Transferler', aciklama: 'Resmi transferler, görüşmeler ve söylentiler.' }
};
function katBul(k) {
  const s = slugla(k || 'makale');
  if (KATEGORILER[s]) return s;
  if (s.indexOf('haber') === 0) return 'haber';
  if (s.indexOf('transfer') === 0) return 'transfer';
  if (s.indexOf('analiz') === 0) return 'analiz';
  return 'makale';
}
function onBilgiAyir(metin) {
  const m = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(metin.replace(/\r/g, '').replace(/^﻿/, ''));
  if (!m) return { bilgi: {}, govde: metin };
  const bilgi = {};
  for (const sat of m[1].split('\n')) {
    const i = sat.indexOf(':');
    if (i < 1) continue;
    const anahtar = slugla(sat.slice(0, i).trim()).replace(/-/g, '_');
    let deger = sat.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    bilgi[anahtar] = deger;
  }
  return { bilgi: bilgi, govde: m[2] };
}
function evet(x) { return /^(evet|e|true|1|yes)$/i.test(String(x || '').trim()); }

const yazilar = [];
const yaziKlasor = path.join(KOK, 'yazilar');
for (const dosya of fs.existsSync(yaziKlasor) ? fs.readdirSync(yaziKlasor) : []) {
  if (!/\.md$/i.test(dosya) || dosya.charAt(0) === '_') continue;
  const { bilgi, govde } = onBilgiAyir(fs.readFileSync(path.join(yaziKlasor, dosya), 'utf8'));
  if (evet(bilgi.taslak)) continue;
  if (!bilgi.baslik) { console.warn('UYARI: ' + dosya + ' dosyasında "baslik:" yok, atlandı.'); continue; }
  const kat = katBul(bilgi.kategori);
  const kelime = govde.split(/\s+/).filter(Boolean).length;
  yazilar.push({
    dosya: dosya,
    baslik: bilgi.baslik,
    slug: slugla(bilgi.adres || dosya.replace(/\.md$/i, '').replace(/^\d{4}-\d{2}-\d{2}-/, '')),
    tarih: bilgi.tarih || '2026-01-01',
    saat: bilgi.saat || '',
    kat: kat,
    etiket: bilgi.etiket || KATEGORILER[kat].ad,
    yazar: bilgi.yazar || A.site_adi || 'Futbolun 2 Yüzü',
    ozet: bilgi.ozet || '',
    kapak: bilgi.kapak || '',
    manset: evet(bilgi.manset),
    etiketler: (bilgi.etiketler || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean),
    sure: Math.max(1, Math.round(kelime / 200)),
    html: markdown(govde)
  });
}
yazilar.sort(function (a, b) { return (b.tarih + b.saat).localeCompare(a.tarih + a.saat); });
yazilar.forEach(function (y, i) { y.renk = ['', 'tur', 'mavi'][i % 3]; });

// ---------- veriler ----------
const transferler = jsonOku('veri/transferler.json', []).filter(function (t) { return t && t.oyuncu; });
const ikiYuz = jsonOku('veri/iki-yuz.json', { aktif: false });

// ---------- puan durumu ----------
function sezon() {
  if (A.sezon) return A.sezon;
  const d = new Date();
  const y = d.getUTCFullYear();
  return d.getUTCMonth() >= 6 ? y + '-' + (y + 1) : (y - 1) + '-' + y;
}
async function puanDurumuGetir() {
  const yedek = jsonOku('veri/puan-durumu.json', { takimlar: [] });
  const lig = A.lig_kimligi || '4339';
  const url = 'https://www.thesportsdb.com/api/v1/json/' + (A.thesportsdb_anahtari || '123') + '/lookuptable.php?l=' + lig + '&s=' + sezon();
  try {
    const kontrol = new AbortController();
    const zaman = setTimeout(function () { kontrol.abort(); }, 15000);
    const yanit = await fetch(url, { signal: kontrol.signal });
    clearTimeout(zaman);
    if (!yanit.ok) throw new Error('HTTP ' + yanit.status);
    const j = await yanit.json();
    const tablo = (j && j.table) || [];
    if (!tablo.length) throw new Error('tablo boş geldi');
    const takimlar = tablo.map(function (t) {
      return {
        sira: Number(t.intRank), takim: t.strTeam, logo: t.strBadge || '',
        o: Number(t.intPlayed), g: Number(t.intWin), b: Number(t.intDraw), m: Number(t.intLoss),
        a: Number(t.intGoalsFor), y: Number(t.intGoalsAgainst), av: Number(t.intGoalDifference),
        p: Number(t.intPoints), form: t.strForm || ''
      };
    }).sort(function (x, y) { return x.sira - y.sira; });
    console.log('Puan durumu alındı: ' + takimlar.length + ' takım (' + sezon() + ')');
    return { takimlar: takimlar, kaynak: 'otomatik', guncelleme: new Date().toISOString() };
  } catch (e) {
    console.warn('UYARI: Puan durumu otomatik alınamadı (' + e.message + '). veri/puan-durumu.json kullanılıyor.');
    return { takimlar: yedek.takimlar || [], kaynak: 'elle', guncelleme: yedek.guncelleme || '' };
  }
}

// ---------- şablon parçaları ----------
const MENU = [
  ['/', 'Ana Sayfa', 'ana'], ['/haberler/', 'Haberler', 'haber'], ['/makaleler/', 'Makaleler', 'makale'],
  ['/transferler/', 'Transferler', 'transfer'], ['/analiz/', 'Analiz', 'analiz'], ['/puan-durumu/', 'Puan Durumu', 'puan']
];
function sosyal() {
  const s = [];
  if (A.youtube) s.push('<a href="' + kac(A.youtube) + '" target="_blank" rel="noopener">YouTube</a>');
  if (A.instagram) s.push('<a href="' + kac(A.instagram) + '" target="_blank" rel="noopener">Instagram</a>');
  if (A.x) s.push('<a href="' + kac(A.x) + '" target="_blank" rel="noopener">X</a>');
  if (A.tiktok) s.push('<a href="' + kac(A.tiktok) + '" target="_blank" rel="noopener">TikTok</a>');
  return s.join('');
}
const YT_IKON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4"></rect><path d="M10 9l5 3-5 3z"></path></svg>';

function sayfa(o) {
  const baslik = o.baslik ? o.baslik + ' | ' + (A.site_adi || 'Futbolun 2 Yüzü') : (A.site_adi || 'Futbolun 2 Yüzü') + ' — ' + (A.slogan || '');
  const aciklama = o.aciklama || A.site_aciklamasi || '';
  const adres = SITE_ADRES + (o.yol || '/');
  const gorsel = o.gorsel ? (/^https?:/.test(o.gorsel) ? o.gorsel : SITE_ADRES + o.gorsel) : SITE_ADRES + '/logo.png';
  const sd = A.son_dakika && A.son_dakika.metin;
  return '<!doctype html>\n<html lang="tr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + kac(baslik) + '</title>\n<meta name="description" content="' + kac(aciklama) + '">\n' +
    '<link rel="canonical" href="' + adres + '">\n' +
    '<meta property="og:type" content="' + (o.makale ? 'article' : 'website') + '">\n<meta property="og:site_name" content="' + kac(A.site_adi) + '">\n' +
    '<meta property="og:title" content="' + kac(o.baslik || A.site_adi) + '">\n<meta property="og:description" content="' + kac(aciklama) + '">\n' +
    '<meta property="og:url" content="' + adres + '">\n<meta property="og:image" content="' + kac(gorsel) + '">\n<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta name="theme-color" content="#0E1A21">\n<link rel="icon" href="/favicon.png" type="image/png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="/style.css">\n' + (o.ekBas || '') + '</head>\n<body>\n' +
    '<a class="atla" href="#icerik">İçeriğe geç</a>\n' +
    '<div class="serit"><div class="kap"><span>' + kac(A.slogan || '') + '</span><nav aria-label="Sosyal medya">' + sosyal() + '</nav></div></div>\n' +
    '<header class="ust"><div class="kap">' +
    '<a class="marka" href="/"><img src="/logo.png" alt="" width="52" height="52"><span>Futbolun <b>2</b> Yüzü</span></a>' +
    '<nav class="menu" aria-label="Ana menü">' + MENU.map(function (m) {
      return '<a href="' + m[0] + '"' + (o.aktif === m[2] ? ' class="aktif" aria-current="page"' : '') + '>' + m[1] + '</a>';
    }).join('') + '</nav>' +
    (A.youtube ? '<a class="dugme" href="' + kac(A.youtube) + '?sub_confirmation=1" target="_blank" rel="noopener">' + YT_IKON + 'Kanala Abone Ol</a>' : '') +
    '</div></header>\n' +
    (sd ? '<div class="sondakika"><div class="kap"><span class="rozet">SON DAKİKA</span>' +
      (A.son_dakika.baglanti ? '<a href="' + kac(A.son_dakika.baglanti) + '">' + kac(sd) + '</a>' : '<span>' + kac(sd) + '</span>') + '</div></div>\n' : '') +
    '<main class="kap" id="icerik">\n' + o.icerik + '\n</main>\n' +
    '<footer class="alt"><div class="kap"><span>© ' + new Date().getFullYear() + ' ' + kac(A.site_adi) + ' · ' + kac(SITE_ADRES.replace(/^https?:\/\//, '')) + '</span>' +
    '<nav aria-label="Alt menü"><a href="/hakkimizda/">Hakkımızda</a><a href="/hakkimizda/#iletisim">İletişim</a>' + sosyal() + '</nav></div></footer>\n' +
    '<script src="/site.js" defer></script>\n</body>\n</html>\n';
}

function yaziAdres(y) { return '/yazi/' + y.slug + '/'; }
function gorselKutu(y, sinif) {
  return '<div class="gorsel ' + (y.renk || '') + ' ' + (sinif || '') + '">' +
    (y.kapak ? '<img src="' + kac(y.kapak) + '" alt="" loading="lazy" onerror="this.remove()">' : '') + '</div>';
}
function etiketSinif(y) { return (y.kat === 'transfer' || y.kat === 'haber') ? 'etiket tur' : 'etiket'; }
function kart(y) {
  return '<a class="kutu kart" href="' + yaziAdres(y) + '">' + gorselKutu(y) +
    '<div class="ic"><span class="' + etiketSinif(y) + '">' + kac(y.etiket) + '</span><span class="kb">' + kac(y.baslik) + '</span>' +
    '<span class="meta">' + kac(y.yazar) + ' · ' + tarihYaz(y.tarih) + ' · ' + y.sure + ' dk</span></div></a>';
}
function listeOge(y) {
  return '<a href="' + yaziAdres(y) + '"><span class="zaman">' + kac(y.saat || tarihYaz(y.tarih).split(' ').slice(0, 2).join(' ')) + '</span>' +
    '<span style="display:flex;flex-direction:column;gap:4px"><span class="' + etiketSinif(y) + '">' + kac(y.etiket) + '</span><span class="lb">' + kac(y.baslik) + '</span></span></a>';
}
function transferTablo(liste, id, filtreli) {
  if (!liste.length) return '<div class="kutu bos">Henüz transfer eklenmedi.</div>';
  const tur = function (d) { return slugla(d) === 'resmi' ? 'resmi' : (slugla(d) === 'gorusmede' ? 'gorusmede' : 'soylenti'); };
  return (filtreli ? '' : '') +
    '<div class="kutu tablo-kutu"><table class="transfer" id="' + id + '"><thead><tr><th scope="col">OYUNCU</th><th scope="col">NEREDEN → NEREYE</th><th scope="col">BEDEL</th><th scope="col">DURUM</th></tr></thead><tbody>' +
    liste.map(function (t) {
      const d = t.durum || 'Söylenti';
      return '<tr data-tur="' + (tur(d) === 'resmi' ? 'resmi' : 'soylenti') + '"><td>' + kac(t.oyuncu) + '</td><td>' + kac(t.nereden || '?') + ' → ' + kac(t.nereye || '?') +
        '</td><td>' + kac(t.bedel || '—') + '</td><td><span class="durum ' + tur(d) + '">' + kac(d) + '</span></td></tr>';
    }).join('') + '</tbody></table></div>';
}
function transferFiltre(id) {
  return '<div class="filtre" data-filtre="' + id + '" role="group" aria-label="Transfer filtresi">' +
    '<button type="button" data-deger="hepsi" aria-pressed="true">Tümü</button>' +
    '<button type="button" data-deger="resmi" aria-pressed="false">Resmi</button>' +
    '<button type="button" data-deger="soylenti" aria-pressed="false">Söylenti</button></div>';
}
function formRozet(f) {
  if (!f) return '';
  return '<span class="form" aria-label="Son maçlar">' + f.slice(-5).split('').map(function (c) {
    const k = { W: 'G', D: 'B', L: 'M' }[c] || c;
    return '<i class="' + c + '" title="' + ({ W: 'Galibiyet', D: 'Beraberlik', L: 'Mağlubiyet' }[c] || '') + '">' + k + '</i>';
  }).join('') + '</span>';
}
function guncellemeNotu(pd) {
  if (!pd.guncelleme) return '';
  const d = new Date(pd.guncelleme);
  if (isNaN(d)) return '';
  const tr = new Date(d.getTime() + 3 * 3600 * 1000);
  return 'Son güncelleme: ' + tr.getUTCDate() + ' ' + AYLAR[tr.getUTCMonth()] + ' ' + String(tr.getUTCHours()).padStart(2, '0') + ':' + String(tr.getUTCMinutes()).padStart(2, '0');
}
function puanKucuk(pd) {
  const rows = pd.takimlar.slice(0, 10);
  let h = '<aside class="kutu puan" aria-label="Süper Lig puan durumu"><div class="bolum-baslik"><h2 class="bb-k">Süper Lig</h2><span class="meta">' + sezon().replace('-', '–') + '</span></div>';
  if (!rows.length) return h + '<p class="bos">Puan durumu şu an alınamadı.</p></aside>';
  h += '<table><thead><tr><th scope="col">#</th><th scope="col">Takım</th><th scope="col" title="Oynanan">O</th><th scope="col" title="Averaj">AV</th><th scope="col" title="Puan">P</th></tr></thead><tbody>' +
    rows.map(function (t) {
      return '<tr><td>' + t.sira + '</td><td><span class="takim">' + (t.logo ? '<img src="' + kac(t.logo) + '/tiny" alt="" loading="lazy" width="20" height="20">' : '') + kac(t.takim) + '</span></td><td>' + t.o + '</td><td>' + (t.av > 0 ? '+' : '') + t.av + '</td><td class="p">' + t.p + '</td></tr>';
    }).join('') + '</tbody></table>';
  return h + '<a class="tum" href="/puan-durumu/">Tam tabloyu gör →</a><p class="not">' + guncellemeNotu(pd) + '</p></aside>';
}

// ---------- sayfalar ----------
function anaSayfa(pd) {
  const manset = yazilar.find(function (y) { return y.manset; }) || yazilar[0];
  const digerleri = yazilar.filter(function (y) { return y !== manset; });
  const sonHaberler = digerleri.filter(function (y) { return y.kat === 'haber' || y.kat === 'transfer'; }).slice(0, 5);
  const makaleler = digerleri.filter(function (y) { return y.kat === 'makale' || y.kat === 'analiz'; }).slice(0, 3);
  const sonAnaliz = yazilar.find(function (y) { return y.kat === 'analiz'; });
  let h = '';

  // Manşet + son haberler
  h += '<section class="satir" aria-label="Manşet">';
  if (manset) {
    h += '<a class="kutu manset" href="' + yaziAdres(manset) + '">' + gorselKutu(manset) +
      '<div class="ic"><div style="display:flex;gap:10px;align-items:center"><span class="' + etiketSinif(manset) + '">' + kac(manset.etiket) + '</span><span class="meta">• ' + manset.sure + ' dk okuma</span></div>' +
      '<h1>' + kac(manset.baslik) + '</h1>' + (manset.ozet ? '<p>' + kac(manset.ozet) + '</p>' : '') + '</div></a>';
  } else {
    h += '<div class="kutu manset"><div class="ic"><h1>İlk yazı yakında</h1></div></div>';
  }
  h += '<aside class="kutu liste yan" style="gap:0"><h2 class="bb-k">Son Haberler</h2>' +
    (sonHaberler.length ? sonHaberler.map(listeOge).join('') : '<p class="bos">Henüz haber yok.</p>') + '</aside></section>';

  // İki yüz
  if (ikiYuz.aktif && ikiYuz.birinci && ikiYuz.ikinci) {
    const yuz = function (y, sinif, ust) {
      const tag = y.baglanti ? 'a' : 'div';
      return '<' + tag + ' class="yuz ' + sinif + '"' + (y.baglanti ? ' href="' + kac(y.baglanti) + '"' : '') + '><span class="ust-yazi">' + ust + '</span><h3>' + kac(y.baslik) + '</h3><p>' + kac(y.ozet) + '</p>' +
        (y.yazar ? '<span class="meta">Yazar: ' + kac(y.yazar) + '</span>' : '') + '</' + tag + '>';
    };
    h += '<section style="display:flex;flex-direction:column;gap:18px"><div class="bolum-baslik"><h2 class="bb">Haftanın Tartışması: <span class="renk-t">İki</span> <span class="renk-o">Yüz</span></h2>' +
      '<span class="meta" style="font-size:14px">' + kac(ikiYuz.konu || 'Aynı konu, iki farklı görüş') + '</span></div>' +
      '<div class="ikiyuz">' + yuz(ikiYuz.birinci, 'bir', '1. YÜZ · ' + kac(ikiYuz.birinci.taraf || 'EVET')) + yuz(ikiYuz.ikinci, 'iki', '2. YÜZ · ' + kac(ikiYuz.ikinci.taraf || 'HAYIR')) + '</div>' +
      (ikiYuz.yorum_baglantisi ? '<div class="kutu taraf"><span>Sen hangi taraftasın?</span><a class="dugme" href="' + kac(ikiYuz.yorum_baglantisi) + '" target="_blank" rel="noopener">Yorumlarda yaz</a></div>' : '') +
      '</section>';
  }

  // Makaleler + transfer | puan durumu
  h += '<section class="satir"><div class="genis">' +
    '<div class="bolum-baslik"><h2 class="bb">Makaleler</h2><a class="tum" href="/makaleler/">Tümünü gör →</a></div>' +
    (makaleler.length ? '<div class="kartlar">' + makaleler.map(kart).join('') + '</div>' : '<div class="kutu bos">Henüz makale yok.</div>') +
    '<div class="bolum-baslik" style="margin-top:18px"><h2 class="bb">Transfer Masası</h2>' + (transferler.length ? transferFiltre('tr-ana') : '') + '</div>' +
    transferTablo(transferler.slice(0, 6), 'tr-ana') +
    (transferler.length > 6 ? '<a class="tum" href="/transferler/">Tüm transferler →</a>' : '') +
    '</div><div class="yan">' + puanKucuk(pd) + '</div></section>';

  // Son analiz
  if (sonAnaliz && sonAnaliz !== manset) {
    h += '<section class="kutu satir" style="padding:28px;gap:32px;align-items:center"><div style="flex:1 1 300px;display:flex;flex-direction:column;gap:12px">' +
      '<span class="etiket" style="letter-spacing:1px">VERİ ANALİZİ</span><h2 class="bb">' + kac(sonAnaliz.baslik) + '</h2>' +
      (sonAnaliz.ozet ? '<p style="margin:0;color:#B8C9CE;line-height:1.6">' + kac(sonAnaliz.ozet) + '</p>' : '') +
      '<a class="dugme cerceve" style="align-self:flex-start" href="' + yaziAdres(sonAnaliz) + '">Analizi oku</a></div>' +
      '<a href="' + yaziAdres(sonAnaliz) + '" style="flex:2 1 420px;display:block;height:240px;border-radius:12px;overflow:hidden" aria-hidden="true" tabindex="-1">' + gorselKutu(sonAnaliz, '').replace('class="gorsel', 'style="height:100%" class="gorsel') + '</a></section>';
  }

  // YouTube bandı
  if (A.youtube) {
    h += '<section class="yt"><div class="sol"><img src="/logo.png" alt=""><div><strong>' + kac(A.takipci_sayisi ? A.takipci_sayisi + ' takipçi ile büyüyoruz' : 'Kanalımıza katıl') + '</strong>' +
      '<span>Videoların yazılı analizleri burada, yeni videolar kanalda.</span></div></div>' +
      '<a class="dugme koyu" href="' + kac(A.youtube) + '" target="_blank" rel="noopener">YouTube’da İzle</a></section>';
  }
  return sayfa({ aktif: 'ana', yol: '/', icerik: h });
}

function kategoriSayfa(kat) {
  const K = KATEGORILER[kat];
  const liste = yazilar.filter(function (y) { return y.kat === kat; });
  let h = '<div class="sayfa-bas"><h1>' + K.baslik + '</h1><p>' + K.aciklama + '</p></div>';
  if (kat === 'transfer') {
    h += '<section style="display:flex;flex-direction:column;gap:18px"><div class="bolum-baslik"><h2 class="bb">Transfer Masası</h2>' + (transferler.length ? transferFiltre('tr-tum') : '') + '</div>' + transferTablo(transferler, 'tr-tum') + '</section>';
    if (liste.length) h += '<section style="display:flex;flex-direction:column;gap:18px"><h2 class="bb">Transfer Yazıları</h2><div class="kartlar">' + liste.map(kart).join('') + '</div></section>';
  } else {
    h += liste.length ? '<div class="kartlar">' + liste.map(kart).join('') + '</div>' : '<div class="kutu bos">Bu bölümde henüz yazı yok.</div>';
  }
  return sayfa({ aktif: kat, yol: '/' + K.yol + '/', baslik: K.baslik, aciklama: K.aciklama, icerik: h });
}

function puanSayfa(pd) {
  let h = '<div class="sayfa-bas"><h1>Süper Lig Puan Durumu</h1><p>' + sezon().replace('-', '–') + ' sezonu · ' + guncellemeNotu(pd) + '</p></div>';
  if (!pd.takimlar.length) {
    h += '<div class="kutu bos">Puan durumu şu an alınamadı. Kısa süre sonra tekrar dene.</div>';
  } else {
    h += '<div class="kutu puan tam tablo-kutu"><table><thead><tr><th scope="col">#</th><th scope="col">Takım</th><th scope="col" title="Oynanan">O</th><th scope="col" title="Galibiyet">G</th><th scope="col" title="Beraberlik">B</th><th scope="col" title="Mağlubiyet">M</th><th scope="col" title="Atılan">A</th><th scope="col" title="Yenilen">Y</th><th scope="col" title="Averaj">AV</th><th scope="col" title="Puan">P</th><th scope="col">Form</th></tr></thead><tbody>' +
      pd.takimlar.map(function (t) {
        return '<tr><td>' + t.sira + '</td><td><span class="takim">' + (t.logo ? '<img src="' + kac(t.logo) + '/tiny" alt="" loading="lazy" width="20" height="20">' : '') + kac(t.takim) + '</span></td><td>' + t.o + '</td><td>' + t.g + '</td><td>' + t.b + '</td><td>' + t.m + '</td><td>' + t.a + '</td><td>' + t.y + '</td><td>' + (t.av > 0 ? '+' : '') + t.av + '</td><td class="p">' + t.p + '</td><td>' + formRozet(t.form) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="not">Veri kaynağı: TheSportsDB. Tablo gün içinde otomatik olarak güncellenir.</p>';
  }
  return sayfa({ aktif: 'puan', yol: '/puan-durumu/', baslik: 'Süper Lig Puan Durumu', aciklama: 'Güncel Trendyol Süper Lig puan durumu.', icerik: h });
}

function yaziSayfa(y) {
  const benzer = yazilar.filter(function (x) { return x !== y; }).slice(0, 4);
  const harf = (y.yazar || 'F').trim().charAt(0).toLocaleUpperCase('tr');
  const sema = {
    '@context': 'https://schema.org', '@type': y.kat === 'haber' || y.kat === 'transfer' ? 'NewsArticle' : 'Article',
    headline: y.baslik, datePublished: y.tarih, author: { '@type': 'Person', name: y.yazar },
    publisher: { '@type': 'Organization', name: A.site_adi, logo: { '@type': 'ImageObject', url: SITE_ADRES + '/logo.png' } },
    description: y.ozet, mainEntityOfPage: SITE_ADRES + yaziAdres(y)
  };
  if (y.kapak) sema.image = /^https?:/.test(y.kapak) ? y.kapak : SITE_ADRES + y.kapak;
  let h = '<div class="satir" style="gap:40px"><article class="makale">' +
    '<a class="tum" href="/' + KATEGORILER[y.kat].yol + '/">← ' + KATEGORILER[y.kat].baslik + '</a>' +
    '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="' + etiketSinif(y) + '">' + kac(y.etiket) + '</span><span class="meta">• ' + tarihYaz(y.tarih) + ' · ' + y.sure + ' dk okuma</span></div>' +
    '<h1>' + kac(y.baslik) + '</h1>' + (y.ozet ? '<p class="giris">' + kac(y.ozet) + '</p>' : '') +
    '<div class="yazar"><div class="avatar" aria-hidden="true">' + kac(harf) + '</div><div class="ad"><span style="font-weight:600">' + kac(y.yazar) + '</span><span class="meta">' + kac(A.site_adi) + '</span></div>' +
    '<button type="button" class="dugme cerceve" data-paylas>Paylaş</button></div>' +
    (y.kapak ? gorselKutu(y, 'kapak') : '') +
    '<div class="icerik">' + y.html + '</div>' +
    (y.etiketler.length ? '<div class="etiketler">' + y.etiketler.map(function (e) { return '<span>#' + kac(e.replace(/\s+/g, '')) + '</span>'; }).join('') + '</div>' : '') +
    '</article><aside class="yan">' +
    (benzer.length ? '<div class="kutu liste"><h2 class="bb-k">Diğer Yazılar</h2>' + benzer.map(function (b, i) {
      return '<a href="' + yaziAdres(b) + '"><span class="no">' + (i + 1) + '</span><span class="lb">' + kac(b.baslik) + '</span></a>';
    }).join('') + '</div>' : '') +
    (A.youtube ? '<div class="yt" style="flex-direction:column;align-items:flex-start;padding:22px;gap:12px"><strong style="font-size:26px">Videolar kanalda</strong><span>Bu yazıların videolu anlatımı YouTube’da.</span><a class="dugme koyu" href="' + kac(A.youtube) + '?sub_confirmation=1" target="_blank" rel="noopener">Abone Ol</a></div>' : '') +
    '</aside></div>';
  return sayfa({
    aktif: y.kat, yol: yaziAdres(y), baslik: y.baslik, aciklama: y.ozet, gorsel: y.kapak, makale: true, icerik: h,
    ekBas: '<script type="application/ld+json">' + JSON.stringify(sema).replace(/</g, '\\u003c') + '</script>\n'
  });
}

function hakkimizdaSayfa() {
  const metin = A.hakkimizda || '';
  let h = '<div class="sayfa-bas"><h1>Hakkımızda</h1></div><div class="makale"><div class="icerik">' + markdown(metin) + '</div>' +
    '<h2 id="iletisim" class="bb" style="margin-top:12px">İletişim</h2><div class="icerik">' +
    (A.eposta ? '<p>E-posta: <a href="mailto:' + kac(A.eposta) + '">' + kac(A.eposta) + '</a></p>' : '<p>İletişim için sosyal medya hesaplarımızdan bize ulaşabilirsin.</p>') +
    '</div></div>';
  return sayfa({ yol: '/hakkimizda/', baslik: 'Hakkımızda', icerik: h });
}

function bulunamadiSayfa() {
  return sayfa({ yol: '/404', baslik: 'Sayfa bulunamadı', icerik: '<div class="sayfa-bas"><h1>Ofsayt!</h1><p>Aradığın sayfa bulunamadı.</p></div><a class="dugme" style="align-self:flex-start" href="/">Ana sayfaya dön</a>' });
}

// ---------- oluştur ----------
(async function () {
  fs.rmSync(CIKTI, { recursive: true, force: true });
  fs.mkdirSync(CIKTI, { recursive: true });
  kopyala(path.join(KOK, 'public'), CIKTI);

  const pd = await puanDurumuGetir();

  yaz('index.html', anaSayfa(pd));
  for (const k of Object.keys(KATEGORILER)) yaz(KATEGORILER[k].yol + '/index.html', kategoriSayfa(k));
  yaz('puan-durumu/index.html', puanSayfa(pd));
  yaz('hakkimizda/index.html', hakkimizdaSayfa());
  yaz('404.html', bulunamadiSayfa());
  const kullanilan = {};
  for (const y of yazilar) {
    if (kullanilan[y.slug]) console.warn('UYARI: "' + y.slug + '" adresi iki yazıda kullanılıyor: ' + kullanilan[y.slug] + ' ve ' + y.dosya);
    kullanilan[y.slug] = y.dosya;
    yaz('yazi/' + y.slug + '/index.html', yaziSayfa(y));
  }

  const adresler = ['/', '/haberler/', '/makaleler/', '/transferler/', '/analiz/', '/puan-durumu/', '/hakkimizda/']
    .concat(yazilar.map(yaziAdres));
  yaz('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    adresler.map(function (u) { return '  <url><loc>' + SITE_ADRES + u + '</loc></url>'; }).join('\n') + '\n</urlset>\n');
  yaz('robots.txt', 'User-agent: *\nAllow: /\nSitemap: ' + SITE_ADRES + '/sitemap.xml\n');

  console.log('Tamam: ' + yazilar.length + ' yazı, ' + transferler.length + ' transfer. Site "dist" klasöründe.');
})();
