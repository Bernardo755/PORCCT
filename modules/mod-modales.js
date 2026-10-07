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
        // La actividad dentro del iframe no llega a esta página: se suspende la inactividad
        // mientras el modal está abierto (el límite absoluto de 2 h sigue vigente).
        if (modal.style.display !== 'flex') Sesion.suspenderInactividad();
        iframe.src = url || '';
        modal.style.display = 'flex';
    });

    btnCerrar.addEventListener('click', () => cerrarModalIframe(modalId, iframeId));
}

/* Cierra un modal y descarga su iframe (también se usa al cerrar sesión). */
function cerrarModalIframe(modalId, iframeId) {
    const modal = document.getElementById(modalId);
    const iframe = document.getElementById(iframeId);
    const estabaAbierto = modal && modal.style.display === 'flex';
    if (modal) modal.style.display = 'none';
    if (iframe) iframe.src = '';
    if (estabaAbierto) Sesion.reanudarInactividad();
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
