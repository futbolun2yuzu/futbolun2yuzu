// Futbolun 2 Yüzü — küçük etkileşimler

// Paylaş düğmesi (yazının başındaki)
// Telefonda: telefonun kendi paylaşım menüsü. Bilgisayarda: sayfanın sonundaki paylaş kutusuna git.
document.querySelectorAll('[data-paylas]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var dokunmatik = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (dokunmatik && navigator.share) {
      navigator.share({ title: document.title, url: location.href }).catch(function () {});
      return;
    }
    var kutu = document.getElementById('paylas');
    if (kutu) {
      kutu.scrollIntoView({ behavior: 'smooth', block: 'center' });
      kutu.classList.add('vurgu');
      setTimeout(function () { kutu.classList.remove('vurgu'); }, 1600);
      kutu.focus({ preventScroll: true });
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
