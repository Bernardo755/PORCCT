/* =========================================================
   CORE DEL SISTEMA
   Login/logout, vistas por permisos, búsqueda principal.
   - Comunicación: api.js  · Sesión/inactividad: session.js
   - Módulos: registry.js (cada módulo limpia su propio estado)
   Nada de esto es seguridad real: el backend valida sesión y permisos.
   ========================================================= */

let usuarioActual = "";
let sareUsuarioActual = "";

/* Debe coincidir con CFG.MAX_RESULTADOS_BUSQUEDA de Config.gs. */
const LIMITE_RESULTADOS = 25;

let iniciandoSesion = false;

function alExpirarSesion(motivo) {
    alert(motivo === 'expiracion'
        ? "Tu sesión alcanzó el tiempo máximo permitido. Vuelve a ingresar."
        : "Tu sesión ha expirado por inactividad.");
    cerrarSesion(true);   // forzado: el cierre por inactividad no se puede cancelar
}

function configurarVistasPorRol(acciones) {
    if (!Array.isArray(acciones) || acciones.indexOf('buscar') < 0) {
        cerrarSesion(true);
        return;
    }

    document.getElementById('login-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
    document.getElementById('saludo-usuario').innerText = 'Panel del Sistema';
    document.getElementById('panel-busqueda').style.display = 'block';

    // Cada módulo se muestra u oculta según los permisos que envió el backend.
    Modulos.aplicarPermisos(acciones);
}

async function iniciarSesion() {
    if (iniciandoSesion) return;
    const user = document.getElementById('user').value.trim();
    const pass = document.getElementById('pass').value.trim();
    const msj = document.getElementById('login-mensaje');
    if (!user || !pass) return msj.innerText = "Por favor, llena ambos campos.";
    msj.innerText = "Validando...";
    iniciandoSesion = true;

    try {
        const res = await enviarPeticion({ action: "login", usuario: user, password: pass });
        document.getElementById('pass').value = '';
        if (res && res.exito) {
            usuarioActual = res.usuario || user;
            sareUsuarioActual = res.sare || "";   // columna E de la hoja Usuarios
            Sesion.iniciar(res.token, res.expiraEn, alExpirarSesion);
            msj.innerText = "";
            configurarVistasPorRol(res.acciones);
        } else {
            msj.innerText = (res && res.error) || "No fue posible iniciar sesión.";
        }
    } catch (e) {
        msj.innerText = "Error en conexión con el servidor.";
    } finally {
        iniciandoSesion = false;
    }
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
        if (!Array.isArray(resultados) || resultados.length === 0) { contenedor.innerHTML = '<p style="color:orange; font-weight:bold;">Sin coincidencias.</p>'; return; }

        let html = '';
        if (resultados.length >= LIMITE_RESULTADOS) {
            html += `<p style="color:#b26a00; font-weight:bold;">Se muestran los primeros ${LIMITE_RESULTADOS} resultados. Refina la búsqueda para ver otros.</p>`;
        }
        html += `<div class="contenedor-tabla"><table><thead><tr>
                    <th>FOLIO</th><th>NOMBRE</th><th>CURP</th><th>SARE</th><th>MUNICIPIO</th><th>CCT</th><th>ESCUELA</th><th>NIVEL</th><th>MES REMESA</th><th>OBSERVACIONES</th><th>ESTATUS</th>
                    </tr></thead><tbody>`;
        resultados.forEach(f => {
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
        contenedor.innerHTML = html;
    } catch (error) { contenedor.innerHTML = '<p style="color:red; font-weight:bold;">Error de comunicación.</p>'; }
}

function obtenerBadgeEstatus(estatus) {
    if (!estatus) return `<span class="status-badge status-badge-default">S/E</span>`;

    const estatusMayus = String(estatus).toUpperCase().trim();
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

/* forzar = true: no pregunta por cambios pendientes (expiración/inactividad/sesión inválida).
   notificarServidor = false: no avisa al backend (cuando el backend ya invalidó la sesión). */
async function cerrarSesion(forzar, notificarServidor) {
    if (!forzar && Modulos.hayPendientes() && !confirm("Perderás los cambios no enviados. ¿Salir?")) {
        return;
    }

    // Avisar al servidor para invalidar el token (el token se lee antes de limpiarlo).
    if (notificarServidor !== false && Sesion.token()) {
        enviarPeticion({ action: "logout" }, { silencioso: true }).catch(() => {});
    }
    Sesion.limpiar();

    // Detener cámaras antes de destruir el estado.
    try { detenerEscaner(); } catch (e) {}

    // Cada módulo restablece su propio estado (registry.js).
    Modulos.resetTodos();

    // Estado de sesión.
    usuarioActual = "";
    sareUsuarioActual = "";

    // Campos de acceso.
    document.getElementById('user').value = '';
    document.getElementById('pass').value = '';
    document.getElementById('login-mensaje').innerText = '';

    // Búsqueda principal.
    document.getElementById('valorBusqueda').value = '';
    document.getElementById('columnaBusqueda').value = 'Nombre';
    document.getElementById('contenedor-resultados').innerHTML = '';

    // Acordeones: todos cerrados y sin selección previa.
    document.querySelectorAll('.modulo-acordeon').forEach(modulo => {
        modulo.open = false;
    });

    // Restablecer paneles principales.
    document.getElementById('panel-busqueda').style.display = 'block';
    document.getElementById('app-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
}

/* Atajos de teclado de la pantalla de acceso y del buscador principal. */
const campoPass = document.getElementById('pass');
if (campoPass) campoPass.addEventListener('keypress', e => {
    if (e.key === 'Enter') iniciarSesion();
});

const campoBusqueda = document.getElementById('valorBusqueda');
if (campoBusqueda) campoBusqueda.addEventListener('keydown', e => {
    if (e.key === 'Enter') e.preventDefault();
});
