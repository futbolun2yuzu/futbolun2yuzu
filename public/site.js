// Futbolun 2 Yüzü — küçük etkileşimler

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

// Bağlantıyı kopyala düğmesi
document.querySelectorAll('[data-kopyala]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var yazi = btn.querySelector('span');
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(btn.getAttribute('data-kopyala')).then(function () {
      yazi.textContent = 'Kopyalandı';
      setTimeout(function () { yazi.textContent = 'Bağlantıyı kopyala'; }, 2000);
    });
  });
});
