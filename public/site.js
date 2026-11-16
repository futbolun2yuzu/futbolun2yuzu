// Futbolun 2 Yüzü — küçük etkileşimler

// Paylaş düğmesi
document.querySelectorAll('[data-paylas]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var url = location.href;
    var baslik = document.title;
    if (navigator.share) {
      navigator.share({ title: baslik, url: url }).catch(function () {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () {
        btn.textContent = 'Bağlantı kopyalandı';
        setTimeout(function () { btn.textContent = 'Paylaş'; }, 2000);
      });
    }
  });
});

// Transfer filtresi
document.querySelectorAll('[data-filtre]').forEach(function (grup) {
  var tablo = document.getElementById(grup.getAttribute('data-filtre'));
  if (!tablo) return;
  grup.querySelectorAll('button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var secim = btn.getAttribute('data-deger');
      grup.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      tablo.querySelectorAll('tbody tr[data-tur]').forEach(function (tr) {
        tr.hidden = !(secim === 'hepsi' || tr.getAttribute('data-tur') === secim);
      });
    });
  });
});
