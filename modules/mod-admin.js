/* ADMINISTRACIÓN - markup del módulo */
(function() {
  const host = document.getElementById('modulos-acordeon');
  if (!host) return;
  host.insertAdjacentHTML('beforeend', `<!-- ADMINISTRACIÓN Y SEGURIDAD -->
            <details id="acordeon-admin" class="modulo-acordeon">
                <summary>🔐 ADMINISTRACIÓN Y SEGURIDAD</summary>
                <div class="modulo-contenido">
                    <div id="panel-admin" class="sub-panel">
                        <div class="panel-bitacora">
                            <h3 style="text-align: center;">Visualizador de Bitácora</h3>
                            <p style="text-align: center;">Filtra y analiza los movimientos realizados en la plataforma en tiempo real:</p>

                            <div style="display: flex; flex-direction: row; gap: 15px; flex-wrap: wrap; background: #e0f2f1; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                <div style="display: flex; flex-direction: column; gap: 5px;">
                                    <label style="font-weight: bold; font-size: 13px; color: #004d40;">Por Día Registrado:</label>
                                    <select id="filtroBitacoraFecha" onchange="buscarEnBitacora()">
                                        <option value="">Cargando fechas...</option>
                                    </select>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 5px;">
                                    <label style="font-weight: bold; font-size: 13px; color: #004d40;">Por Usuario Activo:</label>
                                    <select id="filtroBitacoraUsuario" onchange="buscarEnBitacora()">
                                        <option value="">Cargando usuarios...</option>
                                    </select>
                                </div>
                                <div style="display: flex; align-items: flex-end;">
                                    <button onclick="limpiarYVerTodoBitacora()" style="background-color: #757575;">Ver Todo / Limpiar</button>
                                </div>
                            </div>

                            <div id="contenedor-bitacora"></div>
                        </div>

                        <div class="panel-bloqueo">
                            <h3 style="text-align: center;">Control de Seguridad (Solo Administradores)</h3>
                            <p style="text-align: center;">Selecciona un usuario del sistema para revocar sus accesos de forma permanente:</p>
                            <div class="form-admin">
                                <select id="listaUsuariosAdmin"><option>Cargando usuarios...</option></select>
                                <button style="background-color: #d32f2f;" onclick="ejecutarBloqueo()">Bloquear Acceso</button>
                            </div>
                        </div>
                    </div>
                </div>
            </details>`);
})();

        async function cargarFiltrosDesplegablesBitacora() {
            const selectFecha = document.getElementById('filtroBitacoraFecha');
            const selectUsuario = document.getElementById('filtroBitacoraUsuario');

            try {
                const filtros = await enviarPeticion({ action: "obtener_filtros_bitacora" });

                selectFecha.innerHTML = '<option value="">-- Todas las fechas --</option>';
                selectUsuario.innerHTML = '<option value="">-- Todos los usuarios --</option>';

                if (filtros.fechas && filtros.fechas.length > 0) {
                    filtros.fechas.forEach(f => {
                        let opt = document.createElement('option');
                        opt.value = f; opt.innerText = f;
                        selectFecha.appendChild(opt);
                    });
                }

                if (filtros.usuarios && filtros.usuarios.length > 0) {
                    filtros.usuarios.forEach(u => {
                        let opt = document.createElement('option');
                        opt.value = u; opt.innerText = u;
                        selectUsuario.appendChild(opt);
                    });
                }
            } catch (e) {
                selectFecha.innerHTML = '<option value="">Error al cargar</option>';
                selectUsuario.innerHTML = '<option value="">Error al cargar</option>';
            }
        }

        async function consultarBitacoraServidor(fFecha, fUsuario) {
            const contenedor = document.getElementById('contenedor-bitacora');
            contenedor.innerHTML = '<p style="font-weight:bold; color:#00796b;">Filtrando registros de auditoría...</p>';

            try {
                const logs = await enviarPeticion({
                    action: "obtener_bitacora",
                    filtroFecha: fFecha,
                    filtroUsuario: fUsuario
                });

                if (logs.error) {
                    contenedor.innerHTML = `<p style="color:red; font-weight:bold;">${escaparHTML(logs.error)}</p>`;
                    return;
                }

                if (!Array.isArray(logs) || logs.length === 0) {
                    contenedor.innerHTML = '<p style="color:orange; font-weight:bold;">No se encontraron eventos en la bitácora para esta selección.</p>';
                    return;
                }

                let html = `<div class="contenedor-tabla"><table>
                            <thead>
                                <tr style="background:#004d40; color:white;">
                                    <th>Fecha / Hora</th><th>Usuario</th><th>Acción Ejecutada</th><th>Detalle</th>
                                </tr>
                            </thead>
                            <tbody>`;

                logs.reverse().forEach(l => {
                    html += `<tr>
                                <td>${escaparHTML(l.fecha)}</td>
                                <td><b>${escaparHTML(l.usuario)}</b></td>
                                <td><span style="color:#b71c1c; font-weight:600;">${escaparHTML(l.accion)}</span></td>
                                <td><small style="display:block; max-width:380px; max-height:140px; overflow:auto; white-space:pre-wrap; word-break:break-word;">${escaparHTML(l.detalle || '')}</small></td>
                             </tr>`;
                });

                html += '</tbody></table></div>';
                contenedor.innerHTML = html;

            } catch (e) {
                contenedor.innerHTML = '<p style="color:red; font-weight:bold;">Error de comunicación al procesar la bitácora.</p>';
            }
        }

        function buscarEnBitacora() {
            const fecha = document.getElementById('filtroBitacoraFecha').value;
            const usuario = document.getElementById('filtroBitacoraUsuario').value;

            if (!fecha && !usuario) {
                document.getElementById('contenedor-bitacora').innerHTML = '';
                return;
            }
            consultarBitacoraServidor(fecha, usuario);
        }

        function limpiarYVerTodoBitacora() {
            document.getElementById('filtroBitacoraFecha').value = "";
            document.getElementById('filtroBitacoraUsuario').value = "";
            consultarBitacoraServidor("", "");
            cargarFiltrosDesplegablesBitacora();
        }

        async function cargarUsuariosParaAdmin() {
            const select = document.getElementById('listaUsuariosAdmin');
            try {
                const usuarios = await enviarPeticion({ action: "obtener_usuarios" });
                if (usuarios.error) return select.innerHTML = `<option>${escaparHTML(usuarios.error)}</option>`;
                select.innerHTML = '';
                usuarios.forEach(u => {
                    if (u.usuario !== usuarioActual) {
                        let opt = document.createElement('option'); opt.value = u.usuario;
                        opt.innerText = `${u.usuario} [${u.estado}]`; select.appendChild(opt);
                    }
                });
            } catch (e) { select.innerHTML = '<option>Error al cargar usuarios</option>'; }
        }

        async function ejecutarBloqueo() {
            const userParaBloquear = document.getElementById('listaUsuariosAdmin').value;
            if (!userParaBloquear || userParaBloquear.includes("Cargando")) return alert("Selecciona un usuario válido.");
            if (!confirm(`¿Revocar acceso permanentemente a ${userParaBloquear}?`)) return;
            try {
                const res = await enviarPeticion({ action: "bloquear_usuario", usuarioAQuitar: userParaBloquear });
                if (res.exito) { alert("Usuario bloqueado."); cargarUsuariosParaAdmin(); }
                else if (res && res.error) { alert("No se pudo bloquear: " + res.error); }
            } catch (e) { alert("Error."); }
        }

Modulos.registrar({
    id: 'acordeon-admin',
    accion: 'obtener_bitacora',
    // Cada sección se muestra solo si el backend concedió su permiso.
    alMostrar(acciones) {
        const verBitacora = acciones.indexOf('obtener_bitacora') >= 0;
        const verBloqueo = acciones.indexOf('bloquear_usuario') >= 0;
        const pb = document.querySelector('#panel-admin .panel-bitacora');
        const pl = document.querySelector('#panel-admin .panel-bloqueo');
        if (pb) pb.style.display = verBitacora ? '' : 'none';
        if (pl) pl.style.display = verBloqueo ? '' : 'none';
        if (verBloqueo) cargarUsuariosParaAdmin();
        if (verBitacora) cargarFiltrosDesplegablesBitacora();
    },
    reset() {
        document.getElementById('contenedor-bitacora').innerHTML = '';
        document.getElementById('filtroBitacoraFecha').innerHTML = '<option value="">Cargando fechas...</option>';
        document.getElementById('filtroBitacoraUsuario').innerHTML = '<option value="">Cargando usuarios...</option>';
        document.getElementById('listaUsuariosAdmin').innerHTML = '<option>Cargando usuarios...</option>';
    }
});
