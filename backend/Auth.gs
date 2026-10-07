/* =========================================================
   Auth.gs — Autenticación, sesiones y autorización

   Flujo:
     login(usuario, password) -> valida contra hoja Usuarios -> emite token
     cada petición: validarSesion_(token) -> exigirPermiso_(rol, acción)

   - El token se guarda solo como hash SHA-256 en CacheService (nunca en claro).
   - El rol y el estado (Bloqueado) se leen de la hoja EN CADA PETICIÓN:
     bloquear a un usuario o cambiarle el rol surte efecto de inmediato.
   - CacheService es "mejor esfuerzo": si Google lo vacía antes de tiempo,
     el usuario simplemente debe iniciar sesión otra vez.
   ========================================================= */

/* EJECUTAR UNA SOLA VEZ desde el editor de Apps Script (antes del primer despliegue).
   Crea el "pepper" secreto de las contraseñas. NUNCA lo muestra ni lo cambies después:
   cambiarlo invalida todas las contraseñas ya migradas a hash. */
function configurarPropiedadesIniciales() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('PASSWORD_PEPPER')) {
    props.setProperty('PASSWORD_PEPPER', Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid());
    console.log('PASSWORD_PEPPER creado.');
  } else {
    console.log('PASSWORD_PEPPER ya existía; no se modificó.');
  }
}

function obtenerPepper_() {
  var p = PropertiesService.getScriptProperties().getProperty('PASSWORD_PEPPER');
  if (!p) throw new ErrorApi('El servidor no está configurado. Contacta al administrador.', 'CONFIG');
  return p;
}

/* ---------- Contraseñas ----------
   Formato guardado en la columna B:  h1:<iteraciones>:<sal>:<hash>
   Cualquier otro valor se considera texto plano heredado y se migra
   automáticamente en el primer inicio de sesión correcto. */
function derivarHash_(password, sal, pepper, iteraciones) {
  var clave = Utilities.newBlob(pepper).getBytes();
  var firma = Utilities.computeHmacSha256Signature(Utilities.newBlob(sal + ':' + password).getBytes(), clave);
  for (var i = 1; i < iteraciones; i++) firma = Utilities.computeHmacSha256Signature(firma, clave);
  return bytesAHex_(firma);
}

function crearRegistroPassword_(password, pepper) {
  var sal = Utilities.getUuid().replace(/-/g, '');
  return 'h1:' + CFG.HASH_ITERACIONES + ':' + sal + ':' + derivarHash_(password, sal, pepper, CFG.HASH_ITERACIONES);
}

function verificarPassword_(almacenado, ingresado, pepper) {
  var s = String(almacenado === null || almacenado === undefined ? '' : almacenado);
  if (s.indexOf('h1:') === 0) {
    var p = s.split(':');
    var iter = parseInt(p[1], 10);
    if (p.length !== 4 || !iter || iter < 1 || iter > 100000) return { ok: false, migrar: false };
    return { ok: compararSeguro_(derivarHash_(ingresado, p[2], pepper, iter), p[3]), migrar: false };
  }
  return { ok: s !== '' && compararSeguro_(s, ingresado), migrar: true };
}

function migrarPassword_(fila, original, password, pepper) {
  try {
    conBloqueo_(function () {
      var celda = hoja_(CFG.HOJA_USUARIOS).getRange(fila, COL_USUARIOS.PASSWORD);
      if (String(celda.getValue()) !== String(original)) return;   // la fila cambió: no tocar
      celda.setNumberFormat('@');
      celda.setValue(crearRegistroPassword_(password, pepper));
    });
  } catch (err) {
    console.error('No se pudo migrar la contraseña de la fila ' + fila + ': ' + err);
  }
}

/* ---------- Usuarios y roles ---------- */
function buscarUsuario_(usuario) {
  var hoja = hoja_(CFG.HOJA_USUARIOS);
  var ultima = hoja.getLastRow();
  if (ultima < 2) return null;
  var datos = hoja.getRange(1, 1, ultima, 5).getValues();
  var buscado = String(usuario).trim();
  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][COL_USUARIOS.USUARIO - 1]).trim() === buscado) {
      return {
        fila: i + 1,
        usuario: String(datos[i][COL_USUARIOS.USUARIO - 1]).trim(),
        password: datos[i][COL_USUARIOS.PASSWORD - 1],
        estado: datos[i][COL_USUARIOS.ESTADO - 1],
        rol: datos[i][COL_USUARIOS.ROL - 1],
        sare: datos[i][COL_USUARIOS.SARE - 1] || ''
      };
    }
  }
  return null;
}

function estadoBloqueado_(estado) {
  return String(estado === null || estado === undefined ? '' : estado).trim().toLowerCase() === 'bloqueado';
}

function normalizarRol_(valor) {
  var r = String(valor === null || valor === undefined ? '' : valor).trim().toUpperCase()
    .replace(/Á/g, 'A').replace(/É/g, 'E').replace(/Í/g, 'I').replace(/Ó/g, 'O').replace(/Ú/g, 'U');
  if (ALIAS_ROLES.hasOwnProperty(r)) r = ALIAS_ROLES[r];
  return ROLES_VALIDOS.indexOf(r) >= 0 ? r : null;
}

function accionesPermitidas_(rol) {
  return Object.keys(PERMISOS).filter(function (a) { return PERMISOS[a].indexOf(rol) >= 0; });
}

/* ---------- Intentos fallidos ---------- */
function claveIntentos_(usuario) { return 'f:' + sha256Hex_(String(usuario).toLowerCase()); }

function intentosFallidos_(usuario) {
  var v = CacheService.getScriptCache().get(claveIntentos_(usuario));
  return v ? (parseInt(v, 10) || 0) : 0;
}

function registrarFallo_(usuario) {
  var n = intentosFallidos_(usuario) + 1;
  CacheService.getScriptCache().put(claveIntentos_(usuario), String(n), CFG.BLOQUEO_LOGIN_SEG);
  return n;
}

function limpiarFallos_(usuario) { CacheService.getScriptCache().remove(claveIntentos_(usuario)); }

/* ---------- Sesiones ---------- */
function crearSesion_(usuario) {
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');   // 64 hex
  var ahora = Date.now();
  var exp = ahora + CFG.SESION_MAX_SEG * 1000;
  CacheService.getScriptCache().put('s:' + sha256Hex_(token),
    JSON.stringify({ usuario: usuario, iat: ahora, exp: exp }), CFG.SESION_MAX_SEG);
  return { token: token, exp: exp };
}

function sesionInvalida_(msg) { return new ErrorApi(msg || 'Tu sesión expiró. Vuelve a ingresar.', 'SESION_INVALIDA'); }

function validarSesion_(token) {
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) throw sesionInvalida_('Sesión no válida. Inicia sesión.');
  var cache = CacheService.getScriptCache();
  var clave = 's:' + sha256Hex_(token);
  var crudo = cache.get(clave);
  if (!crudo) throw sesionInvalida_();
  var s;
  try { s = JSON.parse(crudo); } catch (e) { cache.remove(clave); throw sesionInvalida_(); }
  if (!s || Date.now() > s.exp) { cache.remove(clave); throw sesionInvalida_(); }

  var u = buscarUsuario_(s.usuario);
  if (!u || estadoBloqueado_(u.estado)) { cache.remove(clave); throw sesionInvalida_('Tu acceso fue revocado.'); }
  var rol = normalizarRol_(u.rol);
  if (!rol) { cache.remove(clave); throw sesionInvalida_('Tu usuario no tiene un rol válido.'); }
  return { usuario: u.usuario, rol: rol, sare: u.sare, claveCache: clave, exp: s.exp };
}

function exigirPermiso_(sesion, accion) {
  var roles = PERMISOS[accion];
  if (!roles || roles.indexOf(sesion.rol) < 0) {
    registrarBitacora_(sesion.usuario, 'ACCESO_DENEGADO', 'Acción: ' + accion);
    throw new ErrorApi('No tienes permiso para esta operación.', 'SIN_PERMISO');
  }
}

/* ---------- Acciones de sesión ---------- */
function accionLogin_(d) {
  var usuario = texto_(d.usuario).trim();
  var password = texto_(d.password);
  var generico = { exito: false, error: 'Credenciales incorrectas' };
  if (!usuario || !password || usuario.length > 100 || password.length > 200) return generico;

  if (intentosFallidos_(usuario) >= CFG.MAX_INTENTOS_LOGIN) {
    return { exito: false, error: 'Demasiados intentos fallidos. Intenta de nuevo en 15 minutos.' };
  }

  var pepper = obtenerPepper_();
  var u = buscarUsuario_(usuario);
  var v = u ? verificarPassword_(u.password, password, pepper) : { ok: false };

  if (!u || !v.ok) {
    var n = registrarFallo_(usuario);
    if (u && n <= CFG.MAX_INTENTOS_LOGIN) {
      registrarBitacora_(usuario, 'LOGIN_FALLIDO', 'Intento ' + n + ' de ' + CFG.MAX_INTENTOS_LOGIN);
    }
    return generico;
  }

  if (estadoBloqueado_(u.estado)) {
    registrarBitacora_(u.usuario, 'LOGIN_BLOQUEADO', '');
    return { exito: false, error: 'Bloqueado' };
  }
  var rol = normalizarRol_(u.rol);
  if (!rol) {
    registrarBitacora_(u.usuario, 'LOGIN_ROL_INVALIDO', 'Rol en hoja: ' + resumir_(u.rol, 30));
    return { exito: false, error: 'Tu usuario no tiene un rol válido. Contacta al administrador.' };
  }

  if (v.migrar) migrarPassword_(u.fila, u.password, password, pepper);
  limpiarFallos_(usuario);

  var sesion = crearSesion_(u.usuario);
  registrarBitacora_(u.usuario, 'LOGIN', '');
  // Respuesta mínima: nunca se devuelve contraseña, hash ni lista de usuarios.
  return { exito: true, token: sesion.token, usuario: u.usuario, sare: u.sare,
           expiraEn: sesion.exp, acciones: accionesPermitidas_(rol) };
}

function accionLogout_(d, sesion) {
  CacheService.getScriptCache().remove(sesion.claveCache);
  registrarBitacora_(sesion.usuario, 'LOGOUT', '');
  return { exito: true };
}
