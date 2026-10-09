/* =========================================================
   API CENTRALIZADA + ESTADO DE SESIÓN
   - El token vive solo en memoria (no localStorage/sessionStorage).
   - El servidor decide identidad, rol y permisos; el cliente solo los refleja.
   ========================================================= */
(function (global) {
  'use strict';

  const cfg = global.APP_CONFIG;
  let token = '';
  const datos = { usuario: '', rol: '', sare: '', modulos: [] };

  const sesion = {
    get activa() { return !!token; },
    get usuario() { return datos.usuario; },
    get rol() { return datos.rol; },
    get sare() { return datos.sare; },
    tiene(modulo) { return datos.modulos.indexOf(modulo) >= 0; },
    iniciar(r) {
      token = String(r.token || '');
      datos.usuario = String(r.usuario || '');
      datos.rol = String(r.rol || '');
      datos.sare = String(r.sare || '');
      datos.modulos = Array.isArray(r.modulos) ? r.modulos.slice() : [];
    },
    limpiar() { token = ''; datos.usuario = ''; datos.rol = ''; datos.sare = ''; datos.modulos = []; }
  };

  async function llamar(action, payload, opciones) {
    opciones = opciones || {};
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opciones.timeoutMs || cfg.TIMEOUT_PETICION_MS);
    try {
      const resp = await fetch(cfg.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // evita preflight CORS en Apps Script
        body: JSON.stringify(Object.assign({}, payload || {}, { action: action, token: token })),
        signal: ctrl.signal
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const json = await resp.json();
      if (!json || typeof json !== 'object') throw new Error('Respuesta inválida');
      if (json.codigo === 'SESION_EXPIRADA' && token && !opciones.silencioso) global.App.sesionExpirada();
      return json;
    } finally {
      clearTimeout(timer);
    }
  }

  global.Api = { llamar: llamar, sesion: sesion };
})(window);
