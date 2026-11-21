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

function epostalar() {
  const e = Array.isArray(A.eposta) ? A.eposta : String(A.eposta || '').split(',');
  return e.map(function (x) { return String(x).trim(); }).filter(Boolean);
}

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
      if (id) out.push('<div class="video' + (/\/shorts\//.test(m[1]) ? ' dikey' : '') + '"><iframe src="https://www.youtube-nocookie.com/embed/' + id + '" title="YouTube videosu" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>');
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
// Vikipedi sayfa adı: ör. "2026–27 Süper Lig" (ayarlar.json'da "vikipedi_sayfasi" ile değiştirilebilir)
function vikipediSayfasi() {
  if (A.vikipedi_sayfasi) return A.vikipedi_sayfasi;
  const s = sezon().split('-');
  return s[0] + '–' + String(s[1]).slice(2) + ' Süper Lig';
}
function vikipediAdres() {
  return 'https://en.wikipedia.org/wiki/' + encodeURIComponent(vikipediSayfasi().replace(/ /g, '_'));
}
async function getir(url, json) {
  const kontrol = new AbortController();
  const zaman = setTimeout(function () { kontrol.abort(); }, 20000);
  try {
    const yanit = await fetch(url, {
      signal: kontrol.signal,
      headers: { 'User-Agent': 'Futbolun2YuzuSiteBot/1.0 (' + SITE_ADRES + ')' }
    });
    if (!yanit.ok) throw new Error('HTTP ' + yanit.status);
    return json ? await yanit.json() : await yanit.text();
  } finally { clearTimeout(zaman); }
}

// {{#invoke:Sports table ...}} bloğunu bulup parametrelerine ayırır
function sportsTableAyikla(metin) {
  metin = metin.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '');
  const bas = metin.search(/\{\{\s*#invoke:\s*sports[ _]table/i);
  if (bas < 0) return null;
  // eşleşen kapanış parantezini bul
  let derinlik = 0, son = -1;
  for (let i = bas; i < metin.length - 1; i++) {
    if (metin[i] === '{' && metin[i + 1] === '{') { derinlik++; i++; }
    else if (metin[i] === '}' && metin[i + 1] === '}') { derinlik--; i++; if (derinlik === 0) { son = i - 1; break; } }
  }
  if (son < 0) return null;
  const govde = metin.slice(bas + 2, son);
  // üst seviyedeki | işaretlerinden böl ([[...]] ve {{...}} içini atla)
  const parcalar = [];
  let d1 = 0, d2 = 0, bas2 = 0;
  for (let i = 0; i < govde.length; i++) {
    const c = govde[i], n = govde[i + 1];
    if (c === '{' && n === '{') { d1++; i++; }
    else if (c === '}' && n === '}') { d1--; i++; }
    else if (c === '[' && n === '[') { d2++; i++; }
    else if (c === ']' && n === ']') { d2--; i++; }
    else if (c === '|' && d1 === 0 && d2 === 0) { parcalar.push(govde.slice(bas2, i)); bas2 = i + 1; }
  }
  parcalar.push(govde.slice(bas2));
  const p = {};
  for (const parca of parcalar) {
    const e = parca.indexOf('=');
    if (e < 0) continue;
    p[parca.slice(0, e).trim().toLowerCase()] = parca.slice(e + 1).trim();
  }
  return p;
}
function vikiMetinTemizle(s) {
  s = String(s || '');
  s = s.replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2').replace(/\[\[([^\]]*)\]\]/g, '$1');
  s = s.replace(/\{\{[^{}]*\}\}/g, '').replace(/'''?/g, '').replace(/<[^>]+>/g, '');
  return s.replace(/\s+/g, ' ').trim();
}
function sayi(x) { const n = parseInt(String(x || '').replace(/[−–]/g, '-'), 10); return isNaN(n) ? 0 : n; }

async function vikipediTablo() {
  const url = 'https://en.wikipedia.org/w/index.php?action=raw&title=' + encodeURIComponent(vikipediSayfasi().replace(/ /g, '_'));
  const metin = await getir(url, false);
  const p = sportsTableAyikla(metin);
  if (!p || !p.team_order) throw new Error('Vikipedi sayfasında puan tablosu bulunamadı');
  const kodlar = p.team_order.split(',').map(function (k) { return k.trim().toLowerCase(); }).filter(Boolean);
  const adlar = (A.takim_adlari || {});
  const takimlar = kodlar.map(function (k, i) {
    const g = sayi(p['win_' + k]), b = sayi(p['draw_' + k]), m = sayi(p['loss_' + k]);
    const a = sayi(p['gf_' + k]), y = sayi(p['ga_' + k]);
    const ad = vikiMetinTemizle(p['name_' + k]) || k.toUpperCase();
    return {
      takim: adlar[ad] || ad, logo: '', form: '',
      o: g + b + m, g: g, b: b, m: m, a: a, y: y, av: a - y,
      p: 3 * g + b + sayi(p['adjust_points_' + k]),
      vikiSira: i
    };
  });
  if (takimlar.length < 10) throw new Error('tabloda yalnızca ' + takimlar.length + ' takım var');
  // Vikipedi sırası bazen geç düzeltiliyor: önce puana göre sırala,
  // puan eşitse Vikipedi'deki sırayı koru (ikili averaj vb. editörlerce uygulanır).
  takimlar.sort(function (x, y) { return (y.p - x.p) || (x.vikiSira - y.vikiSira); });
  takimlar.forEach(function (t, i) { t.sira = i + 1; delete t.vikiSira; });
  return takimlar;
}

async function sportsDbTablo() {
  const url = 'https://www.thesportsdb.com/api/v1/json/' + (A.thesportsdb_anahtari || '123') + '/lookuptable.php?l=' + (A.lig_kimligi || '4339') + '&s=' + sezon();
  const j = await getir(url, true);
  const tablo = (j && j.table) || [];
  if (!tablo.length) throw new Error('tablo boş geldi');
  return tablo.map(function (t) {
    return {
      sira: Number(t.intRank), takim: t.strTeam, logo: '',
      o: Number(t.intPlayed), g: Number(t.intWin), b: Number(t.intDraw), m: Number(t.intLoss),
      a: Number(t.intGoalsFor), y: Number(t.intGoalsAgainst), av: Number(t.intGoalDifference),
      p: Number(t.intPoints), form: ''
    };
  }).sort(function (x, y) { return x.sira - y.sira; });
}

// Vikipedi'ye ulaşılamazsa: yayındaki sitenin son tablosu kullanılır (ek ayar gerekmez)
async function puanDurumuGetir() {
  try {
    const takimlar = await vikipediTablo();
    console.log('Puan durumu Vikipedi\'den alındı: ' + takimlar.length + ' takım (' + vikipediSayfasi() + ')');
    return { takimlar: takimlar, kaynak: 'vikipedi', guncelleme: new Date().toISOString() };
  } catch (e) {
    console.warn('UYARI: Vikipedi\'den puan durumu alınamadı (' + e.message + ').');
  }
  try {
    const eski = await getir(SITE_ADRES + '/puan-durumu.json?t=' + Date.now(), true);
    if (eski && eski.takimlar && eski.takimlar.length) { console.log('Yayındaki sitenin son tablosu kullanılıyor.'); return eski; }
  } catch (e) { /* site henüz yok */ }
  const elle = jsonOku('veri/puan-durumu.json', { takimlar: [] });
  if (elle.takimlar && elle.takimlar.length) { console.log('veri/puan-durumu.json kullanılıyor.'); return { takimlar: elle.takimlar, kaynak: 'elle', guncelleme: elle.guncelleme || '' }; }
  try {
    const takimlar = await sportsDbTablo();
    console.log('Yedek kaynak TheSportsDB kullanıldı (' + takimlar.length + ' takım).');
    return { takimlar: takimlar, kaynak: 'thesportsdb', guncelleme: new Date().toISOString() };
  } catch (e) {
    console.warn('UYARI: Hiçbir kaynaktan puan durumu alınamadı.');
    return { takimlar: [], kaynak: '', guncelleme: '' };
  }
}
// ---------- gol krallığı (TFF) ----------
const TFF_GOL_URL = 'https://www.tff.org/Default.aspx?pageID=821';
const KULUPLER = [
  ['TRABZON', 'Trabzonspor'], ['GALATASARAY', 'Galatasaray'], ['FENERBAHÇE', 'Fenerbahçe'], ['BEŞİKTAŞ', 'Beşiktaş'],
  ['BAŞAKŞEHİR', 'Başakşehir'], ['AMED', 'Amedspor'], ['KASIMPAŞA', 'Kasımpaşa'], ['GÖZTEPE', 'Göztepe'],
  ['ÇORUM', 'Çorum FK'], ['RİZESPOR', 'Rizespor'], ['KOCAELİ', 'Kocaelispor'], ['SAMSUN', 'Samsunspor'],
  ['KONYA', 'Konyaspor'], ['GAZİANTEP', 'Gaziantep FK'], ['ALANYA', 'Alanyaspor'], ['GENÇLERBİRLİĞİ', 'Gençlerbirliği'],
  ['EYÜP', 'Eyüpspor'], ['ERZURUM', 'Erzurumspor'], ['KAYSERİ', 'Kayserispor'], ['ANTALYA', 'Antalyaspor'],
  ['SİVAS', 'Sivasspor'], ['HATAY', 'Hatayspor'], ['KARAGÜMRÜK', 'Karagümrük'], ['BODRUM', 'Bodrum FK'], ['PENDİK', 'Pendikspor']
];
const BILINEN_OYUNCULAR = {
  'MOHAMED SALAH HAMED MAHROUS GHALY': 'Mohamed Salah',
  'VICTOR JAMES OSIMHEN': 'Victor Osimhen',
  'GIFT EMMANUEL ORBAN': 'Gift Orban',
  'JUAN SANTOS DA SILVA': 'Juan',
  'MASON WILL JOHN GREENWOOD': 'Mason Greenwood',
  'ADRIAN DAWID BENEDYCZAK': 'Adrian Benedyczak',
  'JESUS ANDRES RAMIREZ DIAZ': 'Jesús Ramírez'
};
function kelimeDuzelt(k) {
  if (!k) return k;
  const turkce = /[ÇĞİÖŞÜ]/.test(k);
  const kucuk = turkce ? k.toLocaleLowerCase('tr') : k.toLowerCase();
  return (turkce ? kucuk.charAt(0).toLocaleUpperCase('tr') : kucuk.charAt(0).toUpperCase()) + kucuk.slice(1);
}
function adDuzelt(s) {
  const ham = s.trim().replace(/\s+/g, ' ');
  const ek = A.oyuncu_adlari || {};
  if (ek[ham]) return ek[ham];
  if (BILINEN_OYUNCULAR[ham]) return BILINEN_OYUNCULAR[ham];
  return ham.split(' ').map(kelimeDuzelt).join(' ');
}
function kulupDuzelt(s) {
  const ham = s.trim().toLocaleUpperCase('tr');
  for (const k of KULUPLER) if (ham.indexOf(k[0]) >= 0) return k[1];
  return ham.replace(/\s*(A\.Ş\.|FUTBOL KULÜBÜ|SPOR KULÜBÜ)\s*$/, '').split(' ').map(kelimeDuzelt).join(' ');
}
function htmlMetin(html) {
  const ad = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return html.replace(/<script[\s\S]*?<\/script>/gi, '\n').replace(/<style[\s\S]*?<\/style>/gi, '\n')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(Number(n)); })
    .replace(/&#x([0-9a-f]+);/gi, function (_, n) { return String.fromCharCode(parseInt(n, 16)); })
    .replace(/&([a-z]+);/gi, function (m, n) { return ad[n.toLowerCase()] != null ? ad[n.toLowerCase()] : m; })
    .split('\n').map(function (x) { return x.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
}
function golListesiAyikla(satirlar) {
  // "Gol Krallığı" geçen her yerden sonra okumayı dene, en uzun listeyi al
  const buyuk = /^[A-ZÇĞİÖŞÜÂÉÍÓÚÑÀÈ0-9 .'’\-]{3,}$/;
  let enIyi = [];
  satirlar.forEach(function (s, bas) {
    if (!/gol krall/i.test(s)) return;
    const liste = [];
    for (let i = bas + 1; i + 2 < satirlar.length && i < bas + 400 && liste.length < 25; i++) {
      const ad = satirlar[i], kulup = satirlar[i + 1], gol = satirlar[i + 2];
      if (buyuk.test(ad) && buyuk.test(kulup) && /^\d{1,2}$/.test(gol)) {
        liste.push({ oyuncu: adDuzelt(ad), kulup: kulupDuzelt(kulup), gol: Number(gol) });
        i += 2;
      } else if (liste.length) {
        break;
      }
    }
    if (liste.length > enIyi.length) enIyi = liste;
  });
  return enIyi;
}
function csvAyikla(metin) {
  const satirlar = []; let satir = [], alan = '', tirnak = false;
  metin = metin.replace(/^\uFEFF/, '');
  for (let i = 0; i < metin.length; i++) {
    const c = metin[i];
    if (tirnak) {
      if (c === '"' && metin[i + 1] === '"') { alan += '"'; i++; }
      else if (c === '"') tirnak = false;
      else alan += c;
    } else if (c === '"') tirnak = true;
    else if (c === ',') { satir.push(alan); alan = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && metin[i + 1] === '\n') i++;
      satir.push(alan); satirlar.push(satir); satir = []; alan = '';
    } else alan += c;
  }
  if (alan || satir.length) { satir.push(alan); satirlar.push(satir); }
  return satirlar;
}
// Kendi Google E-Tablon (ayarlar.json: "gol_asist_tablosu")
async function kendiTablomuOku() {
  if (!A.gol_asist_tablosu) return null;
  const satirlar = csvAyikla(await getir(A.gol_asist_tablosu, false));
  const bas = (satirlar[0] || []).map(function (x) { return slugla(x); });
  const sut = function (ad) { return bas.indexOf(ad); };
  const iL = sut('liste'), iO = sut('oyuncu'), iK = sut('kulup'), iS = sut('sayi');
  if (iL < 0 || iO < 0 || iS < 0) throw new Error('tablo başlıkları bulunamadı (Liste, Oyuncu, Kulüp, Sayı olmalı)');
  const sonuc = { gol: [], asist: [] };
  for (const r of satirlar.slice(1)) {
    const liste = slugla(r[iL] || ''), oyuncu = String(r[iO] || '').trim();
    const sayi = parseInt(String(r[iS] || '').trim(), 10);
    if (!oyuncu || /^örnek/i.test(oyuncu) || isNaN(sayi)) continue;
    const o = { oyuncu: oyuncu, kulup: String(iK >= 0 ? r[iK] || '' : '').trim(), gol: sayi };
    if (liste === 'gol') sonuc.gol.push(o); else if (liste === 'asist') sonuc.asist.push(o);
  }
  const sirala = function (a, b) { return b.gol - a.gol || a.oyuncu.localeCompare(b.oyuncu, 'tr'); };
  sonuc.gol.sort(sirala); sonuc.asist.sort(sirala);
  return sonuc;
}
async function golKralligiGetir() {
  if (A.gol_asist_tablosu) {
    try {
      const t = await kendiTablomuOku();
      if (t.gol.length || t.asist.length) {
        console.log('Gol/asist kendi tablomuzdan alındı: ' + t.gol.length + ' gol, ' + t.asist.length + ' asist satırı');
        return { oyuncular: t.gol, asistler: t.asist, kaynak: 'tablo', guncelleme: new Date().toISOString() };
      }
      console.warn('UYARI: Kendi tablomuz boş.');
    } catch (e) {
      console.warn('UYARI: Kendi tablomuz okunamadı (' + e.message + ').');
      try {
        const eski = await getir(SITE_ADRES + '/gol-kralligi.json?t=' + Date.now(), true);
        if (eski && eski.kaynak === 'tablo') { console.log('Yayındaki sitenin son tablo verisi kullanılıyor.'); return eski; }
      } catch (e2) { /* yok */ }
    }
  }
  try {
    const kontrol = new AbortController();
    const zaman = setTimeout(function () { kontrol.abort(); }, 20000);
    const yanit = await fetch(TFF_GOL_URL, { signal: kontrol.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Futbolun2YuzuSiteBot; ' + SITE_ADRES + ')' } });
    clearTimeout(zaman);
    if (!yanit.ok) throw new Error('HTTP ' + yanit.status);
    const tampon = Buffer.from(await yanit.arrayBuffer());
    let karakter = ((yanit.headers.get('content-type') || '').match(/charset=([\w-]+)/i) || [])[1];
    if (!karakter) karakter = (tampon.toString('latin1').match(/<meta[^>]+charset=["']?([\w-]+)/i) || [])[1] || 'utf-8';
    let metin;
    try { metin = new TextDecoder(karakter.toLowerCase()).decode(tampon); } catch (e) { metin = tampon.toString('utf8'); }
    const liste = golListesiAyikla(htmlMetin(metin));
    if (liste.length < 5) throw new Error('listede yalnızca ' + liste.length + ' oyuncu bulundu');
    liste.sort(function (a, b) { return b.gol - a.gol; });
    console.log('Gol krallığı TFF\'den alındı: ' + liste.length + ' oyuncu');
    return { oyuncular: liste, asistler: [], kaynak: 'tff', guncelleme: new Date().toISOString() };
  } catch (e) {
    console.warn('UYARI: Gol krallığı TFF\'den alınamadı (' + e.message + ').');
  }
  try {
    const eski = await getir(SITE_ADRES + '/gol-kralligi.json?t=' + Date.now(), true);
    if (eski && eski.oyuncular && eski.oyuncular.length) { console.log('Yayındaki sitenin son gol krallığı listesi kullanılıyor.'); return eski; }
  } catch (e) { /* yok */ }
  return { oyuncular: [], asistler: [], kaynak: '', guncelleme: '' };
}
function golKaynakNotu(gk) {
  if (gk && gk.kaynak === 'tablo') return 'Veri: ' + kac(A.site_adi || 'Futbolun 2 Yüzü');
  return 'Kaynak: <a href="' + TFF_GOL_URL + '" target="_blank" rel="noopener">TFF</a>';
}
function golTablo(gk, adet, liste, kisa, uzun) {
  let sira = 0, onceki = null;
  return '<table><thead><tr><th scope="col">#</th><th scope="col">Oyuncu</th><th scope="col" title="' + (uzun || 'Gol') + '">' + (kisa || 'G') + '</th></tr></thead><tbody>' +
    (liste || gk.oyuncular).slice(0, adet).map(function (o, i) {
      if (o.gol !== onceki) { sira = i + 1; onceki = o.gol; }
      return '<tr><td>' + sira + '</td><td><span style="display:flex;flex-direction:column"><span style="color:var(--yazi);font-weight:600">' + kac(o.oyuncu) + '</span><span class="meta" style="font-weight:400">' + kac(o.kulup) + '</span></span></td><td class="p">' + o.gol + '</td></tr>';
    }).join('') + '</tbody></table>';
}
function golKucuk(gk) {
  if (!gk.oyuncular.length) return '';
  return '<aside class="kutu puan" aria-label="Gol krallığı"><div class="bolum-baslik"><h2 class="bb-k">Gol Krallığı</h2></div>' +
    golTablo(gk, 5) + '<a class="tum" href="/puan-durumu/#gol-kralligi">Tüm liste →</a><p class="not">' + golKaynakNotu(gk) + '</p></aside>';
}

function kaynakNotu(pd) {
  if (pd.kaynak === 'vikipedi') {
    return 'Kaynak: <a href="' + vikipediAdres() + '" target="_blank" rel="noopener">Vikipedi</a> · ' +
      '<a href="https://creativecommons.org/licenses/by-sa/4.0/deed.tr" target="_blank" rel="noopener">CC BY-SA 4.0</a>';
  }
  if (pd.kaynak === 'thesportsdb') return 'Kaynak: TheSportsDB';
  return '';
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
    '<nav aria-label="Alt menü"><a href="/hakkimizda/">Hakkımızda</a><a href="/hakkimizda/#iletisim">İletişim</a><a href="/gizlilik/">Gizlilik</a>' + sosyal() + '</nav></div></footer>\n' +
    '<script src="/site.js" defer></script>\n' +
    (A.cloudflare_analytics_token ? '<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=\'{"token": "' + kac(A.cloudflare_analytics_token) + '"}\'></script>\n' : '') +
    '</body>\n</html>\n';
}

function yaziAdres(y) { return '/yazi/' + y.slug + '/'; }
function paylasCubugu(y) {
  const url = encodeURIComponent(SITE_ADRES + yaziAdres(y));
  const metin = encodeURIComponent(y.baslik);
  const ikon = function (d) { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
  const dugmeler = [
    ['WhatsApp', 'https://wa.me/?text=' + metin + '%20' + url, 'wa', ikon('<path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 20.5l1.8-5.2A8.4 8.4 0 1 1 21 11.5z"></path>')],
    ['X', 'https://x.com/intent/post?text=' + metin + '&url=' + url, 'x', ikon('<path d="M4 4l16 16M20 4L4 20"></path>')],
    ['Telegram', 'https://t.me/share/url?url=' + url + '&text=' + metin, 'tg', ikon('<path d="M22 3L2 11l7 2 2 7 4-5 5 4z"></path>')],
    ['Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + url, 'fb', ikon('<path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H6v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h2z"></path>')]
  ];
  return '<div class="paylas-cubuk kutu"><span class="pb">Bu yazıyı paylaş</span><div class="pd">' +
    dugmeler.map(function (d) { return '<a class="pdug ' + d[2] + '" href="' + d[1] + '" target="_blank" rel="noopener">' + d[3] + d[0] + '</a>'; }).join('') +
    '<button type="button" class="pdug kopya" data-kopyala="' + kac(SITE_ADRES + yaziAdres(y)) + '">' + ikon('<rect x="9" y="9" width="12" height="12" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path>') + '<span>Bağlantıyı kopyala</span></button></div></div>';
}
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
  return h + '<a class="tum" href="/puan-durumu/">Tam tabloyu gör →</a><p class="not">' + [guncellemeNotu(pd), kaynakNotu(pd)].filter(Boolean).join('<br>') + '</p></aside>';
}

// ---------- sayfalar ----------
function anaSayfa(pd, gk) {
  const manset = yazilar.find(function (y) { return y.manset; }) || yazilar[0];
  const digerleri = yazilar.filter(function (y) { return y !== manset; });
  let sonHaberler = digerleri.filter(function (y) { return y.kat === 'haber' || y.kat === 'transfer'; }).slice(0, 5);
  let yanBaslik = 'Son Haberler';
  // Henüz haber yoksa yan kutu boş kalmasın: son yazıları göster
  if (!sonHaberler.length) { sonHaberler = digerleri.slice(0, 5); yanBaslik = 'Son Yazılar'; }
  const makaleler = digerleri.filter(function (y) {
    return (y.kat === 'makale' || y.kat === 'analiz') && sonHaberler.indexOf(y) < 0;
  }).slice(0, 3);
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
  h += '<aside class="kutu liste yan" style="gap:0"><h2 class="bb-k">' + yanBaslik + '</h2>' +
    (sonHaberler.length ? sonHaberler.map(listeOge).join('') : '<p class="bos">Yakında yeni yazılar burada.</p>') + '</aside></section>';

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
    (makaleler.length ? '<div class="bolum-baslik"><h2 class="bb">Makaleler</h2><a class="tum" href="/makaleler/">Tümünü gör →</a></div>' +
      '<div class="kartlar">' + makaleler.map(kart).join('') + '</div>' : '') +
    '<div class="bolum-baslik"' + (makaleler.length ? ' style="margin-top:18px"' : '') + '><h2 class="bb">Transfer Masası</h2>' + (transferler.length ? transferFiltre('tr-ana') : '') + '</div>' +
    transferTablo(transferler.slice(0, 6), 'tr-ana') +
    (transferler.length > 6 ? '<a class="tum" href="/transferler/">Tüm transferler →</a>' : '') +
    '</div><div class="yan">' + puanKucuk(pd) + golKucuk(gk) + '</div></section>';

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

function puanSayfa(pd, gk) {
  let h = '<div class="sayfa-bas"><h1>Süper Lig Puan Durumu</h1><p>' + sezon().replace('-', '–') + ' sezonu · ' + guncellemeNotu(pd) + '</p></div>';
  if (!pd.takimlar.length) {
    h += '<div class="kutu bos">Puan durumu şu an alınamadı. Kısa süre sonra tekrar dene.</div>';
  } else {
    const formVar = pd.takimlar.some(function (t) { return t.form; });
    h += '<div class="kutu puan tam tablo-kutu"><table><thead><tr><th scope="col">#</th><th scope="col">Takım</th><th scope="col" title="Oynanan">O</th><th scope="col" title="Galibiyet">G</th><th scope="col" title="Beraberlik">B</th><th scope="col" title="Mağlubiyet">M</th><th scope="col" title="Atılan">A</th><th scope="col" title="Yenilen">Y</th><th scope="col" title="Averaj">AV</th><th scope="col" title="Puan">P</th>' + (formVar ? '<th scope="col">Form</th>' : '') + '</tr></thead><tbody>' +
      pd.takimlar.map(function (t) {
        return '<tr><td>' + t.sira + '</td><td><span class="takim">' + (t.logo ? '<img src="' + kac(t.logo) + '/tiny" alt="" loading="lazy" width="20" height="20">' : '') + kac(t.takim) + '</span></td><td>' + t.o + '</td><td>' + t.g + '</td><td>' + t.b + '</td><td>' + t.m + '</td><td>' + t.a + '</td><td>' + t.y + '</td><td>' + (t.av > 0 ? '+' : '') + t.av + '</td><td class="p">' + t.p + '</td>' + (formVar ? '<td>' + formRozet(t.form) + '</td>' : '') + '</tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="not">' + kaynakNotu(pd) + (kaynakNotu(pd) ? '. ' : '') + 'Tablo gün içinde otomatik olarak güncellenir; sıralama puana göre yapılır.</p>';
  }
  const asistler = gk.asistler || [];
  if (gk.oyuncular.length || asistler.length) {
    const blok = function (id, baslik, liste, kisa, uzun) {
      return '<div id="' + id + '" style="flex:1 1 320px;min-width:0;display:flex;flex-direction:column;gap:14px"><h2 class="bb">' + baslik + '</h2>' +
        '<div class="kutu puan">' + golTablo(gk, 20, liste, kisa, uzun) + '</div></div>';
    };
    h += '<section style="display:flex;flex-direction:column;gap:14px"><div class="satir">' +
      (gk.oyuncular.length ? blok('gol-kralligi', 'Gol Krallığı', gk.oyuncular, 'G', 'Gol') : '') +
      (asistler.length ? blok('asist-kralligi', 'Asist Krallığı', asistler, 'A', 'Asist') : '') +
      '</div><p class="not">' + golKaynakNotu(gk) + '. Listeler gün içinde otomatik olarak güncellenir.</p></section>';
  }
  return sayfa({ aktif: 'puan', yol: '/puan-durumu/', baslik: 'Süper Lig Puan Durumu ve Gol Krallığı', aciklama: 'Güncel Trendyol Süper Lig puan durumu ve gol krallığı.', icerik: h });
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
    paylasCubugu(y) +
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
    (epostalar().length ? '<p>E-posta: ' + epostalar().map(function (e) { return '<a href="mailto:' + kac(e) + '">' + kac(e) + '</a>'; }).join(' · ') + '</p><p>Sosyal medya hesaplarımızdan da bize ulaşabilirsin.</p>' : '<p>İletişim için sosyal medya hesaplarımızdan bize ulaşabilirsin.</p>') +
    '</div></div>';
  return sayfa({ yol: '/hakkimizda/', baslik: 'Hakkımızda', icerik: h });
}

function gizlilikSayfa() {
  const iletisim = epostalar().length ? epostalar().map(function (e) { return '[' + e + '](mailto:' + e + ')'; }).join(' veya ') + ' adresleri' : 'sosyal medya hesaplarımız';
  const md = [
    'Son güncelleme: ' + tarihYaz(new Date().toISOString().slice(0, 10)),
    '',
    'Bu sayfa, **' + (A.site_adi || 'Futbolun 2 Yüzü') + '** sitesini ziyaret ettiğinde hangi bilgilerin işlendiğini anlatır.',
    '',
    '## Topladığımız bilgiler',
    'Sitede üyelik, yorum ya da form yoktur. Senden ad, e-posta veya benzeri kişisel bilgi istemiyoruz.',
    '',
    '## Çerezler',
    'Sitemiz kendi çerezini kullanmaz ve seni takip etmez.',
    '',
    '## Ziyaretçi istatistikleri',
    (A.cloudflare_analytics_token
      ? 'Kaç kişinin siteyi ziyaret ettiğini ve hangi yazıların okunduğunu görmek için **Cloudflare Web Analytics** kullanıyoruz. Bu hizmet çerez kullanmaz, seni tanımlamaz ve siteler arasında takip etmez; yalnızca sayfa görüntülenme sayısı gibi toplu bilgiler tutar.'
      : 'Şu anda ziyaretçi istatistiği tutmuyoruz.'),
    '',
    '## Üçüncü taraf hizmetler',
    'Sitenin çalışması için aşağıdaki hizmetler kullanılır. Sayfayı açtığında tarayıcın bu hizmetlere bağlanır ve IP adresin gibi teknik bilgiler onlara iletilebilir:',
    '',
    '- **GitHub Pages:** Sitenin barındırıldığı yer.',
    '- **Google Fonts:** Yazı tipleri.',
    '- **YouTube:** Yazılara gömülen videolar. Videolar, oynatmaya basana kadar çerez bırakmayan "gizlilik geliştirilmiş mod" ile gömülür.',
    '',
    'Bu hizmetlerin kendi gizlilik politikaları geçerlidir.',
    '',
    '## Dış bağlantılar',
    'Yazılarımızda başka sitelere bağlantılar olabilir. O sitelerin içeriğinden ve gizlilik uygulamalarından sorumlu değiliz.',
    '',
    '## Puan durumu verisi',
    'Puan durumu tablosu Vikipedi\'den alınır ve CC BY-SA 4.0 lisansı ile kullanılır.',
    '',
    '## İletişim',
    'Bu politika hakkında soruların için ' + iletisim + ' üzerinden bize ulaşabilirsin. Politika değişirse bu sayfayı güncelleriz.'
  ].join('\n');
  return sayfa({ yol: '/gizlilik/', baslik: 'Gizlilik Politikası', aciklama: 'Futbolun 2 Yüzü gizlilik ve çerez politikası.', icerik: '<div class="sayfa-bas"><h1>Gizlilik Politikası</h1></div><div class="makale"><div class="icerik">' + markdown(md) + '</div></div>' });
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
  const gk = await golKralligiGetir();

  yaz('index.html', anaSayfa(pd, gk));
  for (const k of Object.keys(KATEGORILER)) yaz(KATEGORILER[k].yol + '/index.html', kategoriSayfa(k));
  yaz('puan-durumu/index.html', puanSayfa(pd, gk));
  if (gk.oyuncular.length || (gk.asistler || []).length) yaz('gol-kralligi.json', JSON.stringify(gk));
  if (pd.takimlar.length) yaz('puan-durumu.json', JSON.stringify(pd));
  yaz('hakkimizda/index.html', hakkimizdaSayfa());
  yaz('404.html', bulunamadiSayfa());
  yaz('gizlilik/index.html', gizlilikSayfa());
  const kullanilan = {};
  for (const y of yazilar) {
    if (kullanilan[y.slug]) console.warn('UYARI: "' + y.slug + '" adresi iki yazıda kullanılıyor: ' + kullanilan[y.slug] + ' ve ' + y.dosya);
    kullanilan[y.slug] = y.dosya;
    yaz('yazi/' + y.slug + '/index.html', yaziSayfa(y));
  }

  const adresler = ['/', '/haberler/', '/makaleler/', '/transferler/', '/analiz/', '/puan-durumu/', '/hakkimizda/', '/gizlilik/']
    .concat(yazilar.map(yaziAdres));
  yaz('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    adresler.map(function (u) { return '  <url><loc>' + SITE_ADRES + u + '</loc></url>'; }).join('\n') + '\n</urlset>\n');
  yaz('robots.txt', 'User-agent: *\nAllow: /\nSitemap: ' + SITE_ADRES + '/sitemap.xml\n');

  console.log('Tamam: ' + yazilar.length + ' yazı, ' + transferler.length + ' transfer. Site "dist" klasöründe.');
})();
