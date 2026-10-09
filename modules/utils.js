/* =========================================================
   UTILS + REGISTRO DE MÓDULOS
   - Utils.esc(): escapado HTML (incluye comillas).
   - App.registrar(): acciones por data-accion / data-cambio / data-entrada / data-enter.
     (No hay onclick inline: los datos nunca se convierten en código.)
   - App.alIniciarSesion / alCerrarSesion / hayPendientes: hooks de módulos.
   ========================================================= */
(function (global) {
  'use strict';

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  const Utils = {
    esc(t) { return t === null || t === undefined ? '' : String(t).replace(/[&<>"']/g, c => ESC[c]); },
    $(id) { return document.getElementById(id); },
    fechaLocal() { return new Date().toLocaleDateString('es-MX'); }
  };

  const App = {
    acciones: Object.create(null),
    _inicio: [], _cierre: [], _pendientes: [],

    registrar(mapa) { Object.assign(this.acciones, mapa); },
    alIniciarSesion(fn) { this._inicio.push(fn); },
    alCerrarSesion(fn) { this._cierre.push(fn); },
    hayPendientes(fn) { this._pendientes.push(fn); },

    dispararInicio() { this._ejecutar(this._inicio); },
    dispararCierre() { this._ejecutar(this._cierre); },
    tienePendientes() { return this._pendientes.some(fn => { try { return !!fn(); } catch (e) { return false; } }); },
    _ejecutar(lista) { lista.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); },

    sesionExpirada() { /* lo define core.js */ }
  };

  function escuchar(tipo, atributo) {
    document.addEventListener(tipo, ev => {
      const el = ev.target && ev.target.closest ? ev.target.closest('[' + atributo + ']') : null;
      if (!el) return;
      const fn = App.acciones[el.getAttribute(atributo)];
      if (typeof fn === 'function') fn(el, ev);
    });
  }
  escuchar('click', 'data-accion');
  escuchar('change', 'data-cambio');
  escuchar('input', 'data-entrada');

  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Enter') return;
    const el = ev.target && ev.target.closest ? ev.target.closest('[data-enter]') : null;
    if (!el) return;
    const fn = App.acciones[el.getAttribute('data-enter')];
    if (typeof fn === 'function') { ev.preventDefault(); fn(el, ev); }
  });

  global.Utils = Utils;
  global.App = App;
})(window);
