/* =========================================================
   session.js — Estado de la sesión (solo en memoria)
   - El token NUNCA se guarda en localStorage/sessionStorage.
   - Inactividad: INACTIVIDAD_MIN (config.js, por defecto 15 min).
   - Expiración absoluta: la fija el servidor (expiraEn, 2 horas).
   - Esto controla la interfaz; la validez real la decide el backend en cada petición.
   ========================================================= */
const Sesion = (function () {
    let token = null;
    let timerInactividad = null;
    let timerExpiracion = null;
    let suspensiones = 0;
    let alExpirar = null;
    let ultimaActividad = 0;

    const EVENTOS = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    const OPC = { passive: true, capture: true };

    const cfg = () => window.APP_CONFIG || {};
    const limiteInactividadMs = () => (cfg().INACTIVIDAD_MIN || 15) * 60 * 1000;

    function disparar(motivo) { if (alExpirar) alExpirar(motivo); }

    function reiniciarInactividad() {
        clearTimeout(timerInactividad);
        if (!token || suspensiones > 0) return;
        timerInactividad = setTimeout(() => disparar('inactividad'), limiteInactividadMs());
    }

    function actividad() {
        const ahora = Date.now();
        if (ahora - ultimaActividad < 1000) return;   // limita la frecuencia de reinicios
        ultimaActividad = ahora;
        reiniciarInactividad();
    }

    function iniciar(nuevoToken, expiraEn, manejador) {
        limpiar();
        token = nuevoToken;
        alExpirar = manejador;
        EVENTOS.forEach(ev => document.addEventListener(ev, actividad, OPC));
        reiniciarInactividad();
        const restante = Math.max(0, Number(expiraEn) - Date.now());
        if (expiraEn) timerExpiracion = setTimeout(() => disparar('expiracion'), restante);
    }

    function limpiar() {
        clearTimeout(timerInactividad);
        clearTimeout(timerExpiracion);
        EVENTOS.forEach(ev => document.removeEventListener(ev, actividad, OPC));
        token = null;
        suspensiones = 0;
        alExpirar = null;
    }

    /* Mientras hay una app externa abierta en un modal (iframe) la actividad del usuario
       no llega a esta página; se suspende SOLO la inactividad. El límite absoluto sigue activo. */
    function suspenderInactividad() {
        if (cfg().SUSPENDER_INACTIVIDAD_EN_MODALES === false) return;
        suspensiones++;
        clearTimeout(timerInactividad);
    }

    function reanudarInactividad() {
        if (cfg().SUSPENDER_INACTIVIDAD_EN_MODALES === false) return;
        suspensiones = Math.max(0, suspensiones - 1);
        reiniciarInactividad();
    }

    return { iniciar, limpiar, suspenderInactividad, reanudarInactividad, token: () => token };
})();
