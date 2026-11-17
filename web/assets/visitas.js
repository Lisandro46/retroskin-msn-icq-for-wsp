// Contador de visitas propio, sin cookies ni datos personales.
// Avisa a hooks.trincherai.com (el servidor de TrincherAI) qué página se abrió
// y desde qué sitio llegó la persona; también cuenta los clicks en Descargar.
// Lo ve el tablero "Visitas a los sitios" en el Grafana de la casa.
(function () {
  if (location.hostname !== 'retro.trincherai.com') return; // ni local ni netlify.app
  var BASE = 'https://hooks.trincherai.com/visita';

  function origen() {
    try {
      if (!document.referrer) return '';
      var h = new URL(document.referrer).hostname;
      return h && h !== location.hostname ? h : '';
    } catch (e) { return ''; }
  }

  function avisar(ruta) {
    var r = origen();
    var url = BASE + ruta + (r ? '?r=' + encodeURIComponent(r) : '');
    try {
      fetch(url, { mode: 'no-cors', keepalive: true, credentials: 'omit', cache: 'no-store' });
    } catch (e) { /* sin aviso no pasa nada */ }
  }

  avisar(location.pathname);

  // Descargas: links cortos (/windows, /cassette/mac...) y archivos de GitHub Releases.
  var CORTOS = /^\/((cassette|winamp)\/)?(windows|portable|mac|mac-intel|linux|linux-rpm|appimage)$/;
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
    if (!a) return;
    var u;
    try { u = new URL(a.href, location.href); } catch (e) { return; }
    if (u.hostname === location.hostname && CORTOS.test(u.pathname)) {
      avisar('/descarga' + u.pathname);
    } else if (u.hostname === 'github.com' && /\/releases\/(latest|download|tag)/.test(u.pathname)) {
      var partes = u.pathname.split('/');
      avisar('/descarga/github/' + partes[2] + '/' + partes[partes.length - 1]);
    }
  }, true);
})();
