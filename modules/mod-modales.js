/* =========================================================
   MODALES / IFRAME (Trámites, Tarjetas, Consulta)
   Las URLs permanecen exclusivamente en config.js.
   ========================================================= */
(function () {
  'use strict';
  const cfg = window.APP_CONFIG;

  const DEFINICIONES = [
    ['btnAbrirAppB', 'btnCerrarAppB', 'modalAppB', 'iframeAppB', cfg.URL_APP_B],
    ['btnAbrirCargaTarjetas', 'btnCerrarCargaTarjetas', 'modalCargaTarjetas', 'iframeCargaTarjetas', cfg.URL_CARGA_TARJETAS],
    ['btnAbrirConsulta', 'btnCerrarConsulta', 'modalConsulta', 'iframeConsulta', cfg.URL_SISTEMA_CONSULTA]
  ];

  function cerrar(modal, iframe) {
    if (modal) modal.style.display = 'none';
    if (iframe) iframe.src = 'about:blank';
  }

  DEFINICIONES.forEach(([abrirId, cerrarId, modalId, iframeId, url]) => {
    const btnAbrir = document.getElementById(abrirId);
    const btnCerrar = document.getElementById(cerrarId);
    const modal = document.getElementById(modalId);
    const iframe = document.getElementById(iframeId);
    if (!btnAbrir || !btnCerrar || !modal || !iframe) return;

    btnAbrir.addEventListener('click', () => {
      if (!url) { alert('La dirección de este módulo no está configurada.'); return; }
      iframe.src = url;
      modal.style.display = 'flex';
    });
    btnCerrar.addEventListener('click', () => cerrar(modal, iframe));
  });

  // Al cerrar sesión se descargan todos los iframes.
  window.App.alCerrarSesion(() => {
    DEFINICIONES.forEach(([, , modalId, iframeId]) => {
      cerrar(document.getElementById(modalId), document.getElementById(iframeId));
    });
  });
})();
