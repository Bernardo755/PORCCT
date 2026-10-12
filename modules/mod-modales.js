/* =========================================================
   MODALES / IFRAME
   Las URLs permanecen exclusivamente en config.js.
   ========================================================= */

function configurarModalIframe(botonAbrirId, botonCerrarId, modalId, iframeId, url) {
    const btnAbrir = document.getElementById(botonAbrirId);
    const btnCerrar = document.getElementById(botonCerrarId);
    const modal = document.getElementById(modalId);
    const iframe = document.getElementById(iframeId);

    // Un módulo puede no estar disponible para ciertos roles.
    if (!btnAbrir || !btnCerrar || !modal || !iframe) return;

    btnAbrir.addEventListener('click', () => {
        iframe.src = url || '';
        modal.style.display = 'flex';
    });

    btnCerrar.addEventListener('click', () => {
        modal.style.display = 'none';
        iframe.src = '';
    });
}

configurarModalIframe(
    'btnAbrirAppB',
    'btnCerrarAppB',
    'modalAppB',
    'iframeAppB',
    window.APP_CONFIG.URL_APP_B
);

configurarModalIframe(
    'btnAbrirCargaTarjetas',
    'btnCerrarCargaTarjetas',
    'modalCargaTarjetas',
    'iframeCargaTarjetas',
    window.APP_CONFIG.URL_CARGA_TARJETAS
);

configurarModalIframe(
    'btnAbrirConsulta',
    'btnCerrarConsulta',
    'modalConsulta',
    'iframeConsulta',
    window.APP_CONFIG.URL_SISTEMA_CONSULTA
);
