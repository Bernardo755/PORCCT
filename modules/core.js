/* =========================================================
   CORE DEL SISTEMA
   Sesión, seguridad de inactividad, comunicación API,
   roles, búsqueda principal y reinicio total de sesión.
   ========================================================= */
const API_URL = window.APP_CONFIG.API_URL;

let usuarioActual = "";
let rolActual = "";
let sareUsuarioActual = "";
let tokenActual = ""; // token de sesión emitido por el backend en el login
let datosDispositivo = { ip: "Obteniendo...", ubicacion: "Obteniendo..." };

let loteTemporal = [];
let registroSeleccionadoDoc = null;
let listaDocumentalAcumulada = [];

let timerInactividad;
const TIEMPO_LIMITE_INACTIVIDAD = 15 * 60 * 1000;

        function iniciarTemporizadorInactividad() {
            detenerTemporizadorInactividad();
            document.addEventListener('mousemove', resetearTemporizador);
            document.addEventListener('keypress', resetearTemporizador);
            document.addEventListener('click', resetearTemporizador);
            timerInactividad = setTimeout(cerrarSesionPorInactividad, TIEMPO_LIMITE_INACTIVIDAD);
        }

        function detenerTemporizadorInactividad() {
            clearTimeout(timerInactividad);
            document.removeEventListener('mousemove', resetearTemporizador);
            document.removeEventListener('keypress', resetearTemporizador);
            document.removeEventListener('click', resetearTemporizador);
        }

        function resetearTemporizador() {
            clearTimeout(timerInactividad);
            timerInactividad = setTimeout(cerrarSesionPorInactividad, TIEMPO_LIMITE_INACTIVIDAD);
        }

        function cerrarSesionPorInactividad() {
            alert("Tu sesión ha expirado por inactividad.");
            cerrarSesion();
        }

        async function enviarPeticion(datos, _esConfirmacion) {
            // El servidor debe autenticar y autorizar cada acción (esto es solo informativo).
            datos.usuario = usuarioActual;
            datos.token = tokenActual;
            datos.ip = datosDispositivo.ip;
            datos.ubicacion = datosDispositivo.ubicacion;
            const respuesta = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify(datos),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const json = await respuesta.json();
            // Token vencido, cuenta bloqueada o rol sin permiso: volver al login.
            if (json && json.noAutorizado && usuarioActual) {
                tokenActual = "";
                usuarioActual = "";
                loteTemporal = []; // sin sesión válida no se podría enviar; evita el diálogo de confirmación
                alert("Tu sesión ya no es válida. Inicia sesión nuevamente.");
                cerrarSesion();
            }
            // Cada N consultas el servidor exige confirmar la contraseña.
            if (json && json.requiereConfirmacion && !_esConfirmacion) {
                const confirmado = await confirmarContrasenaInteractivo();
                if (!confirmado) return { exito: false, error: "Confirmación de contraseña cancelada." };
                return await enviarPeticion(datos, true); // reintenta la petición original
            }
            return json;
        }

        /* Modal de contraseña (campo oculto, no usa prompt()). Devuelve la contraseña o null. */
        function pedirPasswordModal(mensajeError, titulo, texto) {
            return new Promise(resolve => {
                const overlay = document.createElement('div');
                overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:99999;';
                overlay.innerHTML = `
                    <div style="background:#fff;padding:20px;border-radius:10px;max-width:340px;width:90%;font-family:sans-serif;">
                        <h3 id="confirmPassTitulo" style="margin-top:0;"></h3>
                        <p id="confirmPassTexto" style="font-size:14px;color:#555;"></p>
                        <input type="password" id="confirmPassInput" placeholder="Contraseña" autocomplete="current-password" style="width:100%;padding:8px;box-sizing:border-box;">
                        <div id="confirmPassMsg" style="color:#c62828;font-weight:bold;min-height:18px;margin:8px 0;"></div>
                        <div style="display:flex;gap:8px;justify-content:flex-end;">
                            <button type="button" id="confirmPassCancel" style="background:#757575;">Cancelar</button>
                            <button type="button" id="confirmPassOk">Confirmar</button>
                        </div>
                    </div>`;
                document.body.appendChild(overlay);
                const input = overlay.querySelector('#confirmPassInput');
                overlay.querySelector('#confirmPassTitulo').innerText = titulo || 'Confirma tu contraseña';
                overlay.querySelector('#confirmPassTexto').innerText = texto || 'Por seguridad, después de varias consultas debes confirmar tu identidad para continuar.';
                overlay.querySelector('#confirmPassMsg').innerText = mensajeError || '';
                const cerrar = valor => { overlay.remove(); resolve(valor); };
                overlay.querySelector('#confirmPassOk').addEventListener('click', () => {
                    if (!input.value) { overlay.querySelector('#confirmPassMsg').innerText = 'Escribe tu contraseña.'; return; }
                    cerrar(input.value);
                });
                overlay.querySelector('#confirmPassCancel').addEventListener('click', () => cerrar(null));
                input.addEventListener('keydown', e => { if (e.key === 'Enter') overlay.querySelector('#confirmPassOk').click(); });
                input.focus();
            });
        }

        async function confirmarContrasenaInteractivo() {
            let mensaje = '';
            while (true) {
                const pass = await pedirPasswordModal(mensaje);
                if (pass === null) return false;
                const r = await enviarPeticion({ action: "confirmar_password", password: pass }, true);
                if (r && r.exito) return true;
                if (r && r.noAutorizado) return false; // sesión cerrada por demasiados intentos
                mensaje = (r && r.error) || 'No se pudo confirmar. Intenta de nuevo.';
            }
        }

        function configurarVistasPorRol(rol) {
            // ADMIN/RESP -> todos | ATENCION -> edición, documental, excel | USER -> solo buscador principal
            const modulos = [
                'acordeon-tramites', 'acordeon-tarjetas', 'acordeon-consulta',
                'acordeon-edicion', 'acordeon-excel', 'acordeon-documental', 'acordeon-admin'
            ];

            const rolNormalizado = String(rol || '').trim().toUpperCase();
            const esAdmin = rolNormalizado === 'ADMIN' || rolNormalizado === 'ADMINISTRADOR';
            const esResp = rolNormalizado === 'RESP' || rolNormalizado === 'RESPONSABLE';
            const esAtencion = rolNormalizado === 'ATENCION' || rolNormalizado === 'ATENCIÓN';
            const esUser = rolNormalizado === 'USER' || rolNormalizado === 'USUARIO';

            if (!esAdmin && !esResp && !esAtencion && !esUser) {
                cerrarSesion();
                return;
            }

            document.getElementById('login-section').style.display = 'none';
            document.getElementById('app-section').style.display = 'block';
            document.getElementById('saludo-usuario').innerText = 'Panel del Sistema';

            // Ocultar todos los módulos primero
            modulos.forEach(id => {
                const modulo = document.getElementById(id);
                if (modulo) {
                    modulo.style.setProperty('display', 'none', 'important');
                    modulo.hidden = true;
                    modulo.open = false;
                }
            });

            const mostrarModulo = id => {
                const modulo = document.getElementById(id);
                if (!modulo) { console.warn('No se encontró el módulo:', id); return; }
                modulo.hidden = false;
                modulo.removeAttribute('hidden');
                modulo.style.setProperty('display', 'block', 'important');
                modulo.style.setProperty('visibility', 'visible', 'important');
                modulo.style.setProperty('opacity', '1', 'important');
            };

            if (esUser) {
                const panelBusqueda = document.getElementById('panel-busqueda');
                if (panelBusqueda) panelBusqueda.style.display = 'block';
                iniciarTemporizadorInactividad();
                return;
            }

            if (esAtencion) {
                ['acordeon-edicion', 'acordeon-documental', 'acordeon-excel'].forEach(mostrarModulo);
                iniciarTemporizadorInactividad();
                return;
            }

            if (esAdmin || esResp) {
                modulos.forEach(mostrarModulo);
                cargarUsuariosParaAdmin();
                cargarFiltrosDesplegablesBitacora();
                iniciarTemporizadorInactividad();
            }
        }

        async function iniciarSesion() {
            const user = document.getElementById('user').value.trim();
            const pass = document.getElementById('pass').value.trim();
            const msj = document.getElementById('login-mensaje');
            if (!user || !pass) return msj.innerText = "Por favor, llena ambos campos.";
            msj.innerText = "Validando...";

            try {
                usuarioActual = user;
                const res = await enviarPeticion({ action: "login", password: pass });
                if (res.exito) {
                    rolActual = res.rol;
                    sareUsuarioActual = res.sare || ""; // columna E de la hoja Usuarios
                    tokenActual = res.token || "";
                    msj.innerText = "";
                    configurarVistasPorRol(rolActual);
                } else {
                    msj.innerText = res.error;
                    usuarioActual = "";
                    tokenActual = "";
                }
            } catch (e) { msj.innerText = "Error en conexión con el servidor."; }
        }

        async function ejecutarBusqueda() {
            const valor = document.getElementById('valorBusqueda').value.trim();
            const columna = document.getElementById('columnaBusqueda').value;
            const contenedor = document.getElementById('contenedor-resultados');
            if (!valor) return alert("Por favor ingresa un valor.");
            contenedor.innerHTML = '<p style="font-weight:bold; color: #555;">Consultando base de datos...</p>';

            try {
                const resultados = await enviarPeticion({ action: "buscar", columna: columna, valor: valor });
                if (resultados && resultados.error) { contenedor.innerHTML = `<p style="color:red; font-weight:bold;">${escaparHTML(resultados.error)}</p>`; return; }
                // Más de 25 coincidencias: el servidor responde { resultados, mensaje, ... }
                let lista = resultados, aviso = '';
                if (resultados && !Array.isArray(resultados) && Array.isArray(resultados.resultados)) {
                    lista = resultados.resultados;
                    aviso = resultados.mensaje || '';
                }
                if (!Array.isArray(lista) || lista.length === 0) { contenedor.innerHTML = '<p style="color:orange; font-weight:bold;">Sin coincidencias.</p>'; return; }

                let html = `<div class="contenedor-tabla"><table><thead><tr>
                            <th>FOLIO</th><th>NOMBRE</th><th>CURP</th><th>SARE</th><th>MUNICIPIO</th><th>CCT</th><th>ESCUELA</th><th>NIVEL</th><th>MES REMESA</th><th>OBSERVACIONES</th><th>ESTATUS</th>
                            </tr></thead><tbody>`;
                lista.forEach(f => {
                    html += `<tr>
                                <td><b>${escaparHTML(f.FOLIO || f.Folio || '')}</b></td>
                                <td>${escaparHTML(f.NOMBRE_COMPLETO)}</td>
                                <td>${escaparHTML(f.CURP)}</td>
                                <td>${escaparHTML(f.SARE)}</td>
                                <td>${escaparHTML(f.MUNICIPIO)}</td>
                                <td>${escaparHTML(f.CCT)}</td>
                                <td>${escaparHTML(f.ESCUELA)}</td>
                                <td>${escaparHTML(f.NIVEL)}</td>
                                <td>${escaparHTML(f.MES_REMESA)}</td>
                                <td><small style="color:#666;">${escaparHTML(f.OBSERVACIONES || '')}</small></td>
                                <td>${obtenerBadgeEstatus(f.ESTATUS)}</td>
                             </tr>`;
                });
                html += '</tbody></table></div>';
                contenedor.innerHTML = (aviso ? `<p style="color:#e65100; font-weight:bold;">${escaparHTML(aviso)}</p>` : '') + html;
            } catch (error) { contenedor.innerHTML = '<p style="color:red; font-weight:bold;">Error de comunicación.</p>'; }
        }

        function obtenerBadgeEstatus(estatus) {
            if (!estatus) return `<span class="status-badge status-badge-default">S/E</span>`;

            const estatusMayus = estatus.toUpperCase().trim();
            let claseEstatus = 'status-badge-default';

            if (estatusMayus.includes('ENTREGADA')) {
                claseEstatus = 'status-badge-entregada';
            } else if (estatusMayus.includes('SOBRANTE')) {
                claseEstatus = 'status-badge-sobrante';
            } else if (estatusMayus.includes('ENVIADA') || estatusMayus.includes('OTRO') || estatusMayus.includes('SARE')) {
                claseEstatus = 'status-badge-envio';
            }

            return `<span class="status-badge ${claseEstatus}">${escaparHTML(estatus)}</span>`;
        }

        function escaparHTML(t) { return t ? String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : ""; }

async function cerrarSesion() {
    detenerTemporizadorInactividad();

    if (loteTemporal.length > 0 && !confirm("Perderás los cambios no enviados. ¿Salir?")) {
        iniciarTemporizadorInactividad();
        return;
    }

    // Detener cámaras antes de destruir el estado.
    try { detenerEscaner(); } catch (e) {}
    try { detenerEscanerDoc(); } catch (e) {}

    // Cerrar y descargar todos los iframes/modales.
    [
        ['modalAppB', 'iframeAppB'],
        ['modalCargaTarjetas', 'iframeCargaTarjetas'],
        ['modalConsulta', 'iframeConsulta']
    ].forEach(([modalId, iframeId]) => {
        const modal = document.getElementById(modalId);
        const iframe = document.getElementById(iframeId);
        if (modal) modal.style.display = 'none';
        if (iframe) iframe.src = '';
    });

    // Estado de sesión.
    usuarioActual = "";
    rolActual = "";
    sareUsuarioActual = "";
    tokenActual = "";
    loteTemporal = [];
    listaDocumentalAcumulada = [];
    registroSeleccionadoDoc = null;

    // Campos de acceso.
    document.getElementById('user').value = '';
    document.getElementById('pass').value = '';
    document.getElementById('login-mensaje').innerText = '';

    // Búsqueda principal.
    document.getElementById('valorBusqueda').value = '';
    document.getElementById('columnaBusqueda').value = 'Nombre';
    document.getElementById('contenedor-resultados').innerHTML = '';

    // Edición por bloques.
    document.getElementById('actividadRealizar').value = '';
    document.getElementById('editFolio').value = '';
    document.getElementById('editEstatus').innerHTML = '';
    document.getElementById('editObservaciones').value = '';
    document.getElementById('campos-edicion').style.display = 'none';
    document.getElementById('kit-documental-wrapper').style.display = 'none';
    document.querySelectorAll('input[name="kitDocumental"]').forEach(r => r.checked = false);
    document.getElementById('area-lote-temporal').style.display = 'none';
    document.getElementById('lote-body').innerHTML = '';
    document.getElementById('contador-lote').innerText = '0';

    // Excel.
    document.getElementById('selectFechaExcel').innerHTML =
        '<option value="">-- Haz clic en actualizar primero --</option>';

    // Documental.
    document.getElementById('docValorBusqueda').value = '';
    document.getElementById('docColumnaBusqueda').value = 'Nombre';
    document.getElementById('doc-contenedor-resultados').innerHTML = '';
    document.getElementById('doc-formulario-detalles').style.display = 'none';
    document.getElementById('area-lista-documental').style.display = 'none';
    document.getElementById('documental-body').innerHTML = '';
    document.getElementById('contador-documental').innerText = '0';

    [
        'docCaja','docFojas','docIne','docTipoIdentificacion',
        'docActa','docCurpDoc','docComprobante','docAcuses','docObservaciones'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const indicador = document.getElementById('indicador-coincidencia');
    if (indicador) {
        indicador.innerText = 'Ingrese las fojas y los documentos para verificar la coincidencia.';
        indicador.style.background = '#eee';
        indicador.style.color = '#555';
    }

    // Bitácora y administración.
    document.getElementById('contenedor-bitacora').innerHTML = '';
    document.getElementById('filtroBitacoraFecha').innerHTML =
        '<option value="">Cargando fechas...</option>';
    document.getElementById('filtroBitacoraUsuario').innerHTML =
        '<option value="">Cargando usuarios...</option>';
    document.getElementById('listaUsuariosAdmin').innerHTML =
        '<option>Cargando usuarios...</option>';

    // Acordeones: todos cerrados y sin selección previa.
    document.querySelectorAll('.modulo-acordeon').forEach(modulo => {
        modulo.open = false;
    });

    // Restablecer paneles principales.
    document.getElementById('panel-busqueda').style.display = 'block';
    document.getElementById('app-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';

    // No persistir absolutamente ningún dato de la sesión anterior.
    try { sessionStorage.clear(); } catch (e) {}
    try { localStorage.removeItem('usuarioActual'); } catch (e) {}
    try { localStorage.removeItem('rolActual'); } catch (e) {}
    try { localStorage.removeItem('sareUsuarioActual'); } catch (e) {}
}

/* Atajos de teclado y datos de dispositivo. */
const campoPass = document.getElementById('pass');
if (campoPass) campoPass.addEventListener('keypress', e => {
    if (e.key === 'Enter') iniciarSesion();
});

const campoBusqueda = document.getElementById('valorBusqueda');
if (campoBusqueda) campoBusqueda.addEventListener('keydown', e => {
    if (e.key === 'Enter') e.preventDefault();
});

const campoEditFolio = document.getElementById('editFolio');
if (campoEditFolio) campoEditFolio.addEventListener('keydown', e => {
    if (e.key === 'Enter') e.preventDefault();
});

const campoDocBusqueda = document.getElementById('docValorBusqueda');
if (campoDocBusqueda) campoDocBusqueda.addEventListener('keydown', e => {
    if (e.key === 'Enter') e.preventDefault();
});

window.addEventListener('load', async function() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        datosDispositivo.ip = data.ip || "No disponible";
        datosDispositivo.ubicacion = data.city
            ? `${data.city}, ${data.region}, ${data.country_name}`
            : "No disponible";
    } catch (error) {
        datosDispositivo.ip = "No disponible";
        datosDispositivo.ubicacion = "No disponible";
    }
});
