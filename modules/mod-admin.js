/* ADMINISTRACIÓN Y SEGURIDAD (permiso: admin) */
(function () {
  'use strict';
  const { $, esc } = window.Utils;
  const { Api } = window;
  const App = window.App;

  const host = document.getElementById('modulos-acordeon');
  if (host) host.insertAdjacentHTML('beforeend', `<!-- ADMINISTRACIÓN Y SEGURIDAD -->
            <details id="acordeon-admin" class="modulo-acordeon">
                <summary>🔐 ADMINISTRACIÓN Y SEGURIDAD</summary>
                <div class="modulo-contenido">
                    <div id="panel-admin" class="sub-panel">
                        <div class="panel-bitacora">
                            <h3 style="text-align: center;">Visualizador de Bitácora</h3>
                            <p style="text-align: center;">Filtra y analiza los movimientos realizados en la plataforma:</p>

                            <div style="display: flex; flex-direction: row; gap: 15px; flex-wrap: wrap; background: #e0f2f1; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                <div style="display: flex; flex-direction: column; gap: 5px;">
                                    <label style="font-weight: bold; font-size: 13px; color: #004d40;">Por Día Registrado:</label>
                                    <select id="filtroBitacoraFecha" data-cambio="admin.filtrar"><option value="">Cargando fechas...</option></select>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 5px;">
                                    <label style="font-weight: bold; font-size: 13px; color: #004d40;">Por Usuario Activo:</label>
                                    <select id="filtroBitacoraUsuario" data-cambio="admin.filtrar"><option value="">Cargando usuarios...</option></select>
                                </div>
                                <div style="display: flex; align-items: flex-end;">
                                    <button data-accion="admin.verTodo" style="background-color: #757575;">Ver Todo / Limpiar</button>
                                </div>
                            </div>

                            <div id="contenedor-bitacora"></div>
                        </div>

                        <div class="panel-bitacora" style="margin-top:20px;">
                            <h3 style="text-align: center;">Gestión de Usuarios</h3>

                            <h4 style="margin:15px 0 5px;">Crear usuario nuevo</h4>
                            <div class="form-admin">
                                <input type="text" id="nuevoUsuario" placeholder="Usuario" autocomplete="off" maxlength="50">
                                <input type="password" id="nuevoPassword" placeholder="Contraseña (mín. 8)" autocomplete="new-password" maxlength="100">
                                <input type="password" id="nuevoPassword2" placeholder="Confirmar contraseña" autocomplete="new-password" maxlength="100">
                                <select id="nuevoRol">
                                    <option value="">-- Rol --</option>
                                    <option value="USER">USER</option>
                                    <option value="ATENCION">ATENCION</option>
                                    <option value="RESP">RESP</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                                <input type="text" id="nuevoSare" placeholder="SARE (obligatorio para ATENCION)" autocomplete="off" maxlength="30">
                                <button class="btn-add" data-accion="admin.crearUsuario">+ Crear usuario</button>
                            </div>

                            <h4 style="margin:25px 0 5px;">Restablecer contraseña</h4>
                            <div class="form-admin">
                                <select id="listaUsuariosReset"><option>Cargando usuarios...</option></select>
                                <input type="password" id="resetPassword" placeholder="Nueva contraseña (mín. 8)" autocomplete="new-password" maxlength="100">
                                <input type="password" id="resetPassword2" placeholder="Confirmar contraseña" autocomplete="new-password" maxlength="100">
                                <button data-accion="admin.restablecer">Restablecer contraseña</button>
                            </div>
                            <p style="font-size:12px; color:#555; text-align:center;">La contraseña se guarda cifrada (hash). Al restablecerla se cierran las sesiones abiertas de ese usuario.</p>
                        </div>

                        <div class="panel-bloqueo">
                            <h3 style="text-align: center;">Control de Acceso (Solo Administradores)</h3>
                            <p style="text-align: center;">Selecciona un usuario para deshabilitar o volver a habilitar su acceso al sistema:</p>
                            <div class="form-admin">
                                <select id="listaUsuariosAdmin"><option>Cargando usuarios...</option></select>
                                <button style="background-color: #d32f2f;" data-accion="admin.bloquear">Bloquear Acceso</button>
                                <button class="btn-add" data-accion="admin.desbloquear">Habilitar Acceso</button>
                            </div>
                        </div>
                    </div>
                </div>
            </details>`);

  async function cargarFiltros() {
    const selFecha = $('filtroBitacoraFecha');
    const selUsuario = $('filtroBitacoraUsuario');
    try {
      const f = await Api.llamar('obtener_filtros_bitacora');
      if (!f.exito) throw new Error(f.error);
      selFecha.innerHTML = '<option value="">-- Todas las fechas --</option>';
      selUsuario.innerHTML = '<option value="">-- Todos los usuarios --</option>';
      (f.fechas || []).forEach(v => selFecha.add(new Option(v, v)));
      (f.usuarios || []).forEach(v => selUsuario.add(new Option(v, v)));
    } catch (e) {
      selFecha.innerHTML = '<option value="">Error al cargar</option>';
      selUsuario.innerHTML = '<option value="">Error al cargar</option>';
    }
  }

  async function consultarBitacora(fecha, usuario) {
    const cont = $('contenedor-bitacora');
    cont.innerHTML = '<p style="font-weight:bold; color:#00796b;">Filtrando registros de auditoría...</p>';
    try {
      const r = await Api.llamar('obtener_bitacora', { filtroFecha: fecha, filtroUsuario: usuario });
      if (!r.exito) { cont.innerHTML = `<p style="color:red; font-weight:bold;">${esc(r.error)}</p>`; return; }
      if (!r.logs || r.logs.length === 0) {
        cont.innerHTML = '<p style="color:orange; font-weight:bold;">No se encontraron eventos en la bitácora para esta selección.</p>';
        return;
      }
      const filas = r.logs.map(l => `<tr>
                <td>${esc(l.fecha)}</td>
                <td><b>${esc(l.usuario)}</b></td>
                <td><span style="color:#b71c1c; font-weight:600;">${esc(l.accion)}</span></td>
                <td><small style="color:#555;">${esc(l.detalle)}</small></td>
            </tr>`).join('');
      const aviso = r.truncado ? '<p style="color:#b26a00;">Se muestran los 500 eventos más recientes. Usa los filtros para acotar.</p>' : '';
      cont.innerHTML = `${aviso}<div class="contenedor-tabla"><table><thead>
                <tr style="background:#004d40; color:white;"><th>Fecha / Hora</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr>
            </thead><tbody>${filas}</tbody></table></div>`;
    } catch (e) {
      cont.innerHTML = '<p style="color:red; font-weight:bold;">Error de comunicación al procesar la bitácora.</p>';
    }
  }

  function filtrar() {
    const fecha = $('filtroBitacoraFecha').value;
    const usuario = $('filtroBitacoraUsuario').value;
    if (!fecha && !usuario) { $('contenedor-bitacora').innerHTML = ''; return; }
    consultarBitacora(fecha, usuario);
  }

  function verTodo() {
    $('filtroBitacoraFecha').value = '';
    $('filtroBitacoraUsuario').value = '';
    consultarBitacora('', '');
    cargarFiltros();
  }

  async function cargarUsuarios() {
    const selBloq = $('listaUsuariosAdmin');
    const selReset = $('listaUsuariosReset');
    try {
      const r = await Api.llamar('obtener_usuarios');
      if (!r.exito) { selBloq.innerHTML = selReset.innerHTML = `<option>${esc(r.error)}</option>`; return; }
      selBloq.innerHTML = '';
      selReset.innerHTML = '';
      r.usuarios.forEach(u => {
        if (u.usuario !== Api.sesion.usuario) selBloq.add(new Option(`${u.usuario} [${u.estado}]`, u.usuario));
        selReset.add(new Option(`${u.usuario} · ${u.rol}${u.sare ? ' · SARE ' + u.sare : ''}`, u.usuario));
      });
    } catch (e) {
      selBloq.innerHTML = selReset.innerHTML = '<option>Error al cargar usuarios</option>';
    }
  }

  function usuarioSeleccionadoControl() {
    const select = $('listaUsuariosAdmin');
    if (!select.value || select.selectedIndex < 0 || select.options[select.selectedIndex].text.includes('Cargando')) {
      alert('Selecciona un usuario válido.');
      return '';
    }
    return select.value;
  }

  async function cambiarAcceso(accion, campo, pregunta, exito) {
    const usuario = usuarioSeleccionadoControl();
    if (!usuario) return;
    if (!confirm(pregunta.replace('{u}', usuario))) return;
    try {
      const r = await Api.llamar(accion, { [campo]: usuario });
      if (r.exito) { alert(exito); cargarUsuarios(); cargarFiltros(); }
      else alert('Error: ' + r.error);
    } catch (e) {
      alert('Error de comunicación.');
    }
  }

  const bloquear = () => cambiarAcceso('bloquear_usuario', 'usuarioAQuitar',
    '¿Deshabilitar el acceso de {u}? Su sesión se cerrará de inmediato.', 'Usuario bloqueado.');

  const desbloquear = () => cambiarAcceso('desbloquear_usuario', 'usuarioAHabilitar',
    '¿Habilitar de nuevo el acceso de {u}?', 'Usuario habilitado. Ya puede iniciar sesión.');

  async function crearUsuario() {
    const usuario = $('nuevoUsuario').value.trim();
    const pass = $('nuevoPassword').value;
    const pass2 = $('nuevoPassword2').value;
    const rol = $('nuevoRol').value;
    const sare = $('nuevoSare').value.trim();

    if (!usuario || !pass || !rol) return alert('Captura usuario, contraseña y rol.');
    if (pass !== pass2) return alert('Las contraseñas no coinciden.');
    if (rol === 'ATENCION' && !sare) return alert('El SARE es obligatorio para el rol ATENCION.');
    if (!confirm(`¿Crear el usuario "${usuario}" con rol ${rol}${sare ? ' y SARE ' + sare : ''}?`)) return;

    try {
      const r = await Api.llamar('crear_usuario', { usuario, password: pass, rol, sare });
      if (r.exito) {
        alert('Usuario creado correctamente.');
        limpiarFormularioNuevo();
        cargarUsuarios();
        cargarFiltros();
      } else {
        alert('Error: ' + r.error);
      }
    } catch (e) {
      alert('Error de comunicación. Verifica en la lista si el usuario se creó antes de reintentar.');
    }
  }

  async function restablecerPassword() {
    const select = $('listaUsuariosReset');
    const usuario = select.value;
    const pass = $('resetPassword').value;
    const pass2 = $('resetPassword2').value;

    if (!usuario || select.options[select.selectedIndex].text.includes('Cargando')) return alert('Selecciona un usuario válido.');
    if (!pass) return alert('Captura la nueva contraseña.');
    if (pass !== pass2) return alert('Las contraseñas no coinciden.');
    if (!confirm(`¿Restablecer la contraseña de ${usuario}? Sus sesiones abiertas se cerrarán.`)) return;

    try {
      const r = await Api.llamar('restablecer_password', { usuario, password: pass });
      if (r.exito) {
        alert('Contraseña restablecida. Entrégasela al usuario por un medio seguro.');
        $('resetPassword').value = '';
        $('resetPassword2').value = '';
      } else {
        alert('Error: ' + r.error);
      }
    } catch (e) {
      alert('Error de comunicación. No se sabe si el cambio se aplicó; vuelve a intentarlo.');
    }
  }

  function limpiarFormularioNuevo() {
    ['nuevoUsuario', 'nuevoPassword', 'nuevoPassword2', 'nuevoSare', 'resetPassword', 'resetPassword2']
      .forEach(id => { $(id).value = ''; });
    $('nuevoRol').value = '';
  }

  App.registrar({
    'admin.filtrar': filtrar,
    'admin.verTodo': verTodo,
    'admin.bloquear': bloquear,
    'admin.desbloquear': desbloquear,
    'admin.crearUsuario': crearUsuario,
    'admin.restablecer': restablecerPassword
  });

  App.alIniciarSesion(() => {
    if (Api.sesion.tiene('admin')) { cargarUsuarios(); cargarFiltros(); }
  });

  App.alCerrarSesion(() => {
    $('contenedor-bitacora').innerHTML = '';
    $('filtroBitacoraFecha').innerHTML = '<option value="">Cargando fechas...</option>';
    $('filtroBitacoraUsuario').innerHTML = '<option value="">Cargando usuarios...</option>';
    $('listaUsuariosAdmin').innerHTML = '<option>Cargando usuarios...</option>';
    $('listaUsuariosReset').innerHTML = '<option>Cargando usuarios...</option>';
    limpiarFormularioNuevo();
  });
})();
