/* =========================================================
   Code.gs — Punto de entrada del Web App

   Despliegue: Ejecutar como "Yo" · Acceso "Cualquier persona".
   Por eso la seguridad NO depende de Google sino de este flujo:

     doPost -> parsear -> (login) | validarSesion_ -> exigirPermiso_ -> acción

   Ver Config.gs (matriz PERMISOS) y Auth.gs (sesiones).
   ========================================================= */

var MAX_BYTES_CUERPO = 5000000;

function parsearCuerpo_(e) {
  if (!e || !e.postData || typeof e.postData.contents !== 'string' || e.postData.contents === '') {
    throw new ErrorApi('Solicitud vacía.', 'SOLICITUD_INVALIDA');
  }
  if (e.postData.contents.length > MAX_BYTES_CUERPO) throw new ErrorApi('Solicitud demasiado grande.', 'SOLICITUD_INVALIDA');
  var cuerpo;
  try { cuerpo = JSON.parse(e.postData.contents); }
  catch (err) { throw new ErrorApi('Solicitud no válida.', 'SOLICITUD_INVALIDA'); }
  if (!cuerpo || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) throw new ErrorApi('Solicitud no válida.', 'SOLICITUD_INVALIDA');
  return cuerpo;
}

function doPost(e) {
  try {
    var cuerpo = parsearCuerpo_(e);
    var accion = texto_(cuerpo.action);
    var acciones = obtenerAcciones_();
    if (!Object.prototype.hasOwnProperty.call(acciones, accion)) throw new ErrorApi('Acción no válida.', 'ACCION_INVALIDA');

    if (accion === 'login') return res(acciones.login(cuerpo));

    var sesion = validarSesion_(cuerpo.token);   // 1) sesión válida y usuario activo
    exigirPermiso_(sesion, accion);      // 2) rol autorizado para la acción
    return res(acciones[accion](cuerpo, sesion)); // 3) ejecutar (usuario = sesión.usuario)
  } catch (err) {
    if (err instanceof ErrorApi) return res({ error: err.message, codigo: err.codigo });
    console.error('Error interno: ' + (err && err.stack ? err.stack : err));   // detalle solo en el log de Apps Script
    return res({ error: 'Error interno del servidor.', codigo: 'ERROR_INTERNO' });
  }
}
