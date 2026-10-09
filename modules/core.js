/* =========================================================
   CORE — sesión (UI), inactividad, roles/módulos visibles, búsqueda principal.
   La identidad, el rol y los permisos los decide el servidor; aquí solo
   se refleja lo que devolvió el login.
   ========================================================= */
(function () {
  'use strict';
  const { $, esc } = window.Utils;
  const { Api } = window;
  const App = window.App;
  const cfg = window.APP_CONFIG;

  // clave de módulo (servidor) -> id del elemento
  const MODULOS_UI = {
    tramites: 'acordeon-tramites',
    tarjetas: 'acordeon-tarjetas',
    consulta: 'acordeon-consulta',
    edicion: 'acordeon-edicion',
    excel: 'acordeon-excel',
    documental: 'acordeon-documental',
    admin: 'acordeon-admin'
  };

  let timerInactividad = null;
  let timerKeepAlive = null;
  let ultimaActividad = 0;
  let ultimoReset = 0;
  let cerrando = false;
  let buscando = false;

  /* ---------- Inactividad ---------- */
  const EVENTOS_ACTIVIDAD = ['mousemove', 'keydown', 'click', 'touchstart'];

  function resetearInactividad() {
    const ahora = Date.now();
    if (ahora - ultimoReset < 1000) return;     // limita el costo de mousemove
    ultimoReset = ahora;
    ultimaActividad = ahora;
    clearTimeout(timerInactividad);
    timerInactividad = setTimeout(
      () => cerrarSesion({ forzar: true, mensaje: 'Tu sesión expiró por inactividad.' }),
      cfg.TIEMPO_INACTIVIDAD_MS
    );
  }

  function iniciarInactividad() {
    detenerInactividad();
    ultimoReset = 0;
    resetearInactividad();
    EVENTOS_ACTIVIDAD.forEach(e => document.addEventListener(e, resetearInactividad, { passive: true }));
    // Renueva la sesión del servidor mientras el usuario esté activo en pantalla.
    timerKeepAlive = setInterval(() => {
      if (Api.sesion.activa && Date.now() - ultimaActividad < cfg.TIEMPO_INACTIVIDAD_MS) {
        Api.llamar('ping').catch(() => {});
      }
    }, cfg.KEEPALIVE_MS);
  }

  function detenerInactividad() {
    clearTimeout(timerInactividad);
    clearInterval(timerKeepAlive);
    EVENTOS_ACTIVIDAD.forEach(e => document.removeEventListener(e, resetearInactividad));
  }

  /* ---------- Vistas por rol (lista de módulos que envía el servidor) ---------- */
  function configurarVistas() {
    $('login-section').style.display = 'none';
    $('app-section').style.display = 'block';
    $('saludo-usuario').textContent = 'Panel del Sistema';

    Object.keys(MODULOS_UI).forEach(clave => {
      const el = $(MODULOS_UI[clave]);
      if (!el) return;
      const visible = Api.sesion.tiene(clave);
      el.hidden = !visible;
      el.style.display = visible ? '' : 'none';
      el.open = false;
    });
    $('panel-busqueda').style.display = 'block';
  }

  /* ---------- Login / Logout ---------- */
  async function iniciarSesion() {
    const user = $('user').value.trim();
    const pass = $('pass').value.trim();
    const msj = $('login-mensaje');
    const btn = $('btnLogin');
    if (!user || !pass) { msj.textContent = 'Por favor, llena ambos campos.'; return; }

    msj.textContent = 'Validando...';
    btn.disabled = true;
    try {
      const r = await Api.llamar('login', { usuario: user, password: pass });
      if (r.exito && r.token && Array.isArray(r.modulos) && r.modulos.length) {
        Api.sesion.iniciar(r);
        msj.textContent = '';
        $('user').value = '';
        $('pass').value = '';
        configurarVistas();
        iniciarInactividad();
        App.dispararInicio();
      } else {
        msj.textContent = r.error || 'No fue posible iniciar sesión.';
      }
    } catch (e) {
      msj.textContent = 'Error en conexión con el servidor.';
    } finally {
      btn.disabled = false;
    }
  }

  async function cerrarSesion(opciones) {
    opciones = opciones || {};
    if (cerrando) return;

    if (!opciones.forzar && App.tienePendientes() && !confirm('Perderás los cambios no enviados. ¿Salir?')) return;
    cerrando = true;
    detenerInactividad();

    // Invalida la sesión en el servidor (sin bloquear la interfaz más de 3 s).
    if (Api.sesion.activa && !opciones.sinServidor) {
      try {
        await Promise.race([
          Api.llamar('logout', {}, { silencioso: true }),
          new Promise(resolve => setTimeout(resolve, 3000))
        ]);
      } catch (e) { /* se cierra localmente de todos modos */ }
    }

    App.dispararCierre();          // cada módulo limpia su propio estado y su DOM
    Api.sesion.limpiar();

    $('user').value = '';
    $('pass').value = '';
    $('login-mensaje').textContent = opciones.mensaje || '';
    $('valorBusqueda').value = '';
    $('columnaBusqueda').value = 'Nombre';
    $('contenedor-resultados').innerHTML = '';
    document.querySelectorAll('.modulo-acordeon').forEach(m => { m.open = false; });

    $('app-section').style.display = 'none';
    $('login-section').style.display = 'block';
    cerrando = false;
  }

  App.sesionExpirada = () => cerrarSesion({ forzar: true, sinServidor: true, mensaje: 'Tu sesión expiró. Inicia sesión de nuevo.' });

  /* ---------- Búsqueda principal ---------- */
  function badgeEstatus(estatus) {
    if (!estatus) return '<span class="status-badge status-badge-default">S/E</span>';
    const m = String(estatus).toUpperCase().trim();
    let clase = 'status-badge-default';
    if (m.includes('ENTREGADA')) clase = 'status-badge-entregada';
    else if (m.includes('SOBRANTE')) clase = 'status-badge-sobrante';
    else if (m.includes('ENVIADA') || m.includes('OTRO') || m.includes('SARE')) clase = 'status-badge-envio';
    return `<span class="status-badge ${clase}">${esc(estatus)}</span>`;
  }

  async function ejecutarBusqueda() {
    if (buscando) return;
    const valor = $('valorBusqueda').value.trim();
    const columna = $('columnaBusqueda').value;
    const cont = $('contenedor-resultados');
    if (!valor) return alert('Por favor ingresa un valor.');

    buscando = true;
    $('btnBuscar').disabled = true;
    cont.innerHTML = '<p style="font-weight:bold; color: #555;">Consultando base de datos...</p>';
    try {
      const r = await Api.llamar('buscar', { columna, valor });
      if (!r.exito) { cont.innerHTML = `<p style="color:red; font-weight:bold;">${esc(r.error)}</p>`; return; }
      if (!r.resultados || r.resultados.length === 0) { cont.innerHTML = '<p style="color:orange; font-weight:bold;">Sin coincidencias.</p>'; return; }

      const filas = r.resultados.map(f => `<tr>
                <td><b>${esc(f.FOLIO)}</b></td>
                <td>${esc(f.NOMBRE_COMPLETO)}</td>
                <td>${esc(f.CURP)}</td>
                <td>${esc(f.SARE)}</td>
                <td>${esc(f.MUNICIPIO)}</td>
                <td>${esc(f.CCT)}</td>
                <td>${esc(f.ESCUELA)}</td>
                <td>${esc(f.NIVEL)}</td>
                <td>${esc(f.MES_REMESA)}</td>
                <td><small style="color:#666;">${esc(f.OBSERVACIONES)}</small></td>
                <td>${badgeEstatus(f.ESTATUS)}</td>
            </tr>`).join('');
      const aviso = r.truncado ? `<p style="color:#b26a00; font-weight:bold;">Mostrando ${r.resultados.length} de ${r.total} coincidencias. Refina tu búsqueda.</p>` : '';
      cont.innerHTML = `${aviso}<div class="contenedor-tabla"><table><thead><tr>
                <th>FOLIO</th><th>NOMBRE</th><th>CURP</th><th>SARE</th><th>MUNICIPIO</th><th>CCT</th><th>ESCUELA</th><th>NIVEL</th><th>MES REMESA</th><th>OBSERVACIONES</th><th>ESTATUS</th>
            </tr></thead><tbody>${filas}</tbody></table></div>`;
    } catch (e) {
      cont.innerHTML = '<p style="color:red; font-weight:bold;">Error de comunicación.</p>';
    } finally {
      buscando = false;
      $('btnBuscar').disabled = false;
    }
  }

  App.registrar({
    'login': iniciarSesion,
    'logout': () => cerrarSesion(),
    'buscar': ejecutarBusqueda
  });
})();
