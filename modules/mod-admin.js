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
                            <p style="text-align: center;">Selecciona un usuario del sistema para deshabilitar o habilitar su acceso:</p>
                            <div class="form-admin">
                                <select id="listaUsuariosAdmin"><option>Cargando usuarios...</option></select>
                                <button style="background-color: #d32f2f;" onclick="ejecutarBloqueo()">Bloquear Acceso</button>
                                <button style="background-color: #2e7d32;" onclick="ejecutarDesbloqueo()">Desbloquear Acceso</button>
                            </div>
                        </div>

                        <div class="panel-bloqueo" id="panel-nuevo-usuario">
                            <h3 style="text-align: center;">Crear Nuevo Usuario</h3>
                            <p style="text-align: center;">La contraseña se almacena cifrada (hash con sal). Entrégala al usuario por un medio seguro.</p>
                            <div class="form-admin" style="display:flex; flex-direction:column; gap:10px; max-width:420px; margin:0 auto;">
                                <input type="text" id="nuevoUsuario" placeholder="Usuario (3-30: letras, números . _ -)" autocomplete="off">
                                <div style="display:flex; gap:8px;">
                                    <input type="password" id="nuevoPassword" placeholder="Contraseña (mínimo 8 caracteres)" autocomplete="new-password" style="flex:1;">
                                    <button type="button" onclick="generarPasswordNuevoUsuario()" style="background-color:#546e7a;">Generar</button>
                                    <button type="button" onclick="alternarVerPasswordNuevoUsuario()" style="background-color:#757575;" title="Mostrar/ocultar">👁</button>
                                </div>
                                <select id="nuevoRol">
                                    <option value="">-- Selecciona un rol --</option>
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="RESP">RESP</option>
                                    <option value="ATENCION">ATENCION</option>
                                    <option value="USER">USER</option>
                                </select>
                                <select id="nuevoEstado">
                                    <option value="Activo">Activo</option>
                                    <option value="Bloqueado">Bloqueado</option>
                                </select>
                                <input type="text" id="nuevoSare" placeholder="SARE (opcional, ej. ...1301)" autocomplete="off">
                                <button type="button" id="btnCrearUsuario" onclick="crearUsuarioNuevo()" style="background-color:#1a73e8;">➕ Crear Usuario</button>
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
                                    <th>Fecha / Hora</th><th>Usuario</th><th>Acción Ejecutada</th><th>Detalle</th><th>Dirección IP</th><th>Ubicación</th>
                                </tr>
                            </thead>
                            <tbody>`;

                logs.reverse().forEach(l => {
                    html += `<tr>
                                <td>${escaparHTML(l.fecha)}</td>
                                <td><b>${escaparHTML(l.usuario)}</b></td>
                                <td><span style="color:#b71c1c; font-weight:600;">${escaparHTML(l.accion)}</span></td>
                                <td><small style="display:block; max-width:380px; overflow-wrap:anywhere; word-break:break-word;">${escaparHTML(l.detalle || '')}</small></td>
                                <td><code>${escaparHTML(l.ip)}</code></td>
                                <td><small style="color:#555;">${escaparHTML(l.ubicacion)}</small></td>
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
            if (!confirm(`¿Deshabilitar el acceso de ${userParaBloquear}?`)) return;
            try {
                const res = await enviarPeticion({ action: "bloquear_usuario", usuarioAQuitar: userParaBloquear });
                if (res.exito) { alert("Usuario bloqueado."); cargarUsuariosParaAdmin(); }
                else alert("No se pudo bloquear: " + (res.error || "error desconocido"));
            } catch (e) { alert("Error de comunicación."); }
        }

        async function ejecutarDesbloqueo() {
            const userParaDesbloquear = document.getElementById('listaUsuariosAdmin').value;
            if (!userParaDesbloquear || userParaDesbloquear.includes("Cargando")) return alert("Selecciona un usuario válido.");
            if (!confirm(`¿Habilitar nuevamente el acceso de ${userParaDesbloquear}?`)) return;
            try {
                const res = await enviarPeticion({ action: "desbloquear_usuario", usuarioObjetivo: userParaDesbloquear });
                if (res.exito) { alert("Usuario desbloqueado."); cargarUsuariosParaAdmin(); }
                else alert("No se pudo desbloquear: " + (res.error || "error desconocido"));
            } catch (e) { alert("Error de comunicación."); }
        }

        /* ---------- Alta de usuarios ---------- */
        function generarPasswordNuevoUsuario() {
            const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
            const bytes = new Uint32Array(12);
            crypto.getRandomValues(bytes);
            let p = '';
            bytes.forEach(b => { p += alfabeto[b % alfabeto.length]; });
            const campo = document.getElementById('nuevoPassword');
            campo.value = p;
            campo.type = 'text'; // visible para poder entregarla al usuario
        }

        function alternarVerPasswordNuevoUsuario() {
            const campo = document.getElementById('nuevoPassword');
            campo.type = campo.type === 'password' ? 'text' : 'password';
        }

        async function crearUsuarioNuevo() {
            const usuario = document.getElementById('nuevoUsuario').value.trim();
            const password = document.getElementById('nuevoPassword').value;
            const rol = document.getElementById('nuevoRol').value;
            const estado = document.getElementById('nuevoEstado').value;
            const sare = document.getElementById('nuevoSare').value.trim();
            const btn = document.getElementById('btnCrearUsuario');

            if (!/^[A-Za-z0-9._-]{3,30}$/.test(usuario)) return alert("Usuario inválido: 3 a 30 caracteres (letras, números, punto, guion o guion bajo).");
            if (password.length < 8) return alert("La contraseña debe tener al menos 8 caracteres.");
            if (password !== password.trim()) return alert("La contraseña no debe iniciar ni terminar con espacios.");
            if (!rol) return alert("Selecciona un rol.");
            if (sare.length > 50) return alert("El SARE es demasiado largo.");
            if (!confirm(`¿Crear el usuario "${usuario}" con rol ${rol} y estatus ${estado}?`)) return;

            btn.disabled = true;
            const textoOriginal = btn.innerText;
            btn.innerText = "Creando...";

            try {
                // Los datos del usuario nuevo van en campos propios para no
                // chocar con "usuario" (administrador que hace la petición).
                const res = await enviarPeticion({
                    action: "crear_usuario",
                    nuevoUsuario: usuario,
                    nuevoPassword: password,
                    nuevoRol: rol,
                    nuevoEstado: estado,
                    nuevoSare: sare
                });

                if (res.exito) {
                    alert(`Usuario "${usuario}" creado correctamente.\nEntrega la contraseña por un medio seguro.`);
                    ['nuevoUsuario', 'nuevoPassword', 'nuevoSare'].forEach(id => { document.getElementById(id).value = ''; });
                    document.getElementById('nuevoPassword').type = 'password';
                    document.getElementById('nuevoRol').value = '';
                    document.getElementById('nuevoEstado').value = 'Activo';
                    cargarUsuariosParaAdmin();
                } else {
                    alert("No se pudo crear: " + (res.error || "error desconocido"));
                }
            } catch (e) {
                alert("Error de comunicación con el servidor.");
            } finally {
                btn.disabled = false;
                btn.innerText = textoOriginal;
            }
        }
