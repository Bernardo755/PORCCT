/* =========================================================
   registry.js — Registro de módulos
   Cada módulo se registra con:
     id          ID del <details> del módulo
     accion      permiso del backend que habilita el módulo (ver PERMISOS en Config.gs)
     reset()     (opcional) limpia su estado al cerrar sesión
     pendientes()(opcional) true si tiene cambios sin enviar
     alMostrar(acciones) (opcional) se ejecuta cuando el usuario puede verlo

   Para agregar un módulo nuevo: crear modules/mod-xxx.js, cargarlo en index.html y
   llamar a Modulos.registrar({...}). core.js no necesita cambios.
   ========================================================= */
const Modulos = (function () {
    const lista = [];

    function registrar(modulo) { lista.push(modulo); }

    function ocultar(el) {
        el.style.setProperty('display', 'none', 'important');
        el.hidden = true;
        el.open = false;
    }

    function mostrar(el) {
        el.hidden = false;
        el.removeAttribute('hidden');
        el.style.setProperty('display', 'block', 'important');
        el.style.setProperty('visibility', 'visible', 'important');
        el.style.setProperty('opacity', '1', 'important');
    }

    function aplicarPermisos(acciones) {
        const permitidas = Array.isArray(acciones) ? acciones : [];
        lista.forEach(m => {
            const el = document.getElementById(m.id);
            if (!el) { console.warn('No se encontró el módulo:', m.id); return; }
            if (permitidas.indexOf(m.accion) >= 0) {
                mostrar(el);
                if (typeof m.alMostrar === 'function') m.alMostrar(permitidas);
            } else {
                ocultar(el);
            }
        });
    }

    function hayPendientes() {
        return lista.some(m => typeof m.pendientes === 'function' && m.pendientes());
    }

    function resetTodos() {
        lista.forEach(m => {
            if (typeof m.reset !== 'function') return;
            try { m.reset(); } catch (e) { console.error('Error al reiniciar', m.id, e); }
        });
    }

    return { registrar, aplicarPermisos, hayPendientes, resetTodos };
})();
