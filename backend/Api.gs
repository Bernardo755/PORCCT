/* =========================================================
   Api.gs — Acciones de negocio
   Cada acción recibe (cuerpo, sesion). La sesión ya fue validada y el
   permiso ya fue comprobado en Code.gs. El usuario SIEMPRE sale de la
   sesión del servidor, nunca de lo que envíe el navegador.
   ========================================================= */

function obtenerAcciones_() {
  return {
    login: accionLogin_,
    logout: accionLogout_,
    buscar: accionBuscar_,
    actualizar_lote: accionActualizarLote_,
    actualizar_lote_columna_v: accionActualizarLoteColumnaV_,
    obtener_fechas_w: accionObtenerFechasW_,
    obtener_datos_excel: accionObtenerDatosExcel_,
    obtener_filtros_bitacora: accionObtenerFiltrosBitacora_,
    obtener_bitacora: accionObtenerBitacora_,
    obtener_usuarios: accionObtenerUsuarios_,
    bloquear_usuario: accionBloquearUsuario_
  };
}

/* ---------------- BÚSQUEDA ---------------- */
function accionBuscar_(d, sesion) {
  var cols = { Nombre: COL_BASE.NOMBRE_COMPLETO, CURP: COL_BASE.CURP, Folio: COL_BASE.FOLIO };
  var columna = texto_(d.columna);
  if (!cols.hasOwnProperty(columna)) throw new ErrorApi('Columna de búsqueda no válida.');
  var valor = texto_(d.valor).trim();
  if (!valor) throw new ErrorApi('Ingresa un valor para buscar.');
  if (valor.length > CFG.MAX_LONG_BUSQUEDA) throw new ErrorApi('El valor de búsqueda es demasiado largo.');
  if (columna === 'Nombre' && valor.length < CFG.MIN_LONG_NOMBRE) {
    throw new ErrorApi('Escribe al menos ' + CFG.MIN_LONG_NOMBRE + ' caracteres para buscar por nombre.');
  }

  registrarBitacora_(sesion.usuario, 'BUSCAR', columna + ': ' + valor);

  var hoja = hoja_(CFG.HOJA_BASE);
  var ultima = hoja.getLastRow();
  if (ultima < 2) return [];

  var rango = hoja.getRange(2, cols[columna], ultima - 1, 1);
  var hallados = rango.createTextFinder(valor).matchEntireCell(columna !== 'Nombre').findAll();
  var resultados = [];
  var max = Math.min(hallados.length, CFG.MAX_RESULTADOS_BUSQUEDA);
  for (var i = 0; i < max; i++) {
    var r = hoja.getRange(hallados[i].getRow(), 1, 1, COL_BASE.NOMBRE_COMPLETO).getValues()[0];
    resultados.push({
      FOLIO: r[COL_BASE.FOLIO - 1],
      NOMBRE_COMPLETO: r[COL_BASE.NOMBRE_COMPLETO - 1],
      SARE: r[COL_BASE.SARE - 1],
      MUNICIPIO: r[COL_BASE.MUNICIPIO - 1],
      CCT: r[COL_BASE.CCT - 1],
      ESCUELA: r[COL_BASE.ESCUELA - 1],
      ID_BECARIO: r[COL_BASE.ID_BECARIO - 1],
      NOMBRE: r[COL_BASE.NOMBRE - 1],
      APELLIDO_PATERNO: r[COL_BASE.APELLIDO_PATERNO - 1],
      APELLIDO_MATERNO: r[COL_BASE.APELLIDO_MATERNO - 1],
      REMESA: r[COL_BASE.REMESA - 1],
      NIVEL: r[COL_BASE.NIVEL - 1],
      BLOQUE: r[COL_BASE.BLOQUE - 1],
      MES_REMESA: r[COL_BASE.MES_REMESA - 1],
      CURP: r[COL_BASE.CURP - 1],
      OBSERVACIONES: r[COL_BASE.OBSERVACIONES - 1],
      ESTATUS: r[COL_BASE.ESTATUS - 1]
    });
  }
  return resultados;
}

/* ---------------- Utilidades de lotes ---------------- */
function validarLote_(lote, tipo) {
  if (!Array.isArray(lote) || lote.length === 0) throw new ErrorApi('El lote está vacío.');
  if (lote.length > CFG.MAX_LOTE) throw new ErrorApi('El lote excede el máximo de ' + CFG.MAX_LOTE + ' registros.');
  return lote.map(function (it) {
    if (!it || typeof it !== 'object') throw new ErrorApi('Registro de lote no válido.');
    var folio = texto_(it.folio).trim();
    if (!folio || folio.length > CFG.MAX_LONG_FOLIO) throw new ErrorApi('Folio no válido en el lote.');
    if (tipo === 'estatus') {
      var estatus = texto_(it.estatus).trim();
      if (!estatus) throw new ErrorApi('Estatus vacío para el folio ' + folio + '.');
      if (CFG.VALIDAR_ESTATUS && ESTATUS_PERMITIDOS.indexOf(estatus) < 0) {
        throw new ErrorApi('Estatus no permitido para el folio ' + folio + '.');
      }
      var obs = texto_(it.observaciones);
      if (obs.length > CFG.MAX_LONG_OBSERVACION) throw new ErrorApi('Observaciones demasiado largas (folio ' + folio + ').');
      return { folio: folio, estatus: estatus, observaciones: obs };
    }
    var cadena = texto_(it.valoresCeldaV);
    if (cadena.length > CFG.MAX_LONG_CADENA_V) throw new ErrorApi('Texto documental demasiado largo (folio ' + folio + ').');
    return { folio: folio, valoresCeldaV: cadena };
  });
}

/* Índice folio -> fila (primera coincidencia, sin distinguir mayúsculas), leído UNA sola vez. */
function indiceFolios_(hoja) {
  var ultima = hoja.getLastRow();
  var mapa = Object.create(null);
  if (ultima < 2) return mapa;
  var vals = hoja.getRange(2, COL_BASE.FOLIO, ultima - 1, 1).getDisplayValues();
  for (var i = 0; i < vals.length; i++) {
    var k = String(vals[i][0]).trim().toUpperCase();
    if (k && mapa[k] === undefined) mapa[k] = i + 2;
  }
  return mapa;
}

/* Valores actuales de un tramo de columnas para varias filas (una llamada por cada 100 filas). */
function leerFilasPrevias_(filas, colIni, colFin) {
  var previo = {};
  try {
    var ssId = ss_().getId();
    for (var i = 0; i < filas.length; i += 100) {
      var tramo = filas.slice(i, i + 100);
      var rangos = tramo.map(function (f) { return CFG.HOJA_BASE + '!' + letraCol_(colIni) + f + ':' + letraCol_(colFin) + f; });
      var r = Sheets.Spreadsheets.Values.batchGet(ssId, { ranges: rangos });
      (r.valueRanges || []).forEach(function (vr, j) { previo[tramo[j]] = (vr.values && vr.values[0]) || []; });
    }
  } catch (err) {
    console.error('No se pudieron leer valores previos: ' + err);
  }
  return previo;
}

function escribirDatos_(data) {
  if (data.length === 0) return;
  // RAW: el texto se guarda tal cual; nada se interpreta como fórmula.
  Sheets.Spreadsheets.Values.batchUpdate({ valueInputOption: 'RAW', data: data }, ss_().getId());
}

/* ---------------- ACTUALIZAR LOTE (estatus) ---------------- */
function accionActualizarLote_(d, sesion) {
  var lote = validarLote_(d.lote, 'estatus');
  return conBloqueo_(function () {
    var hoja = hoja_(CFG.HOJA_BASE);
    if (hoja.getLastRow() < 2) return { exito: true, exitosos: 0, noEncontrados: [], mensaje: 'La base está vacía.' };

    var indice = indiceFolios_(hoja);
    var fecha = Utilities.formatDate(new Date(), ss_().getSpreadsheetTimeZone(), CFG.FORMATO_FECHA);  // fecha del SERVIDOR
    var encontrados = [], noEncontrados = [];
    lote.forEach(function (it) {
      var fila = indice[it.folio.toUpperCase()];
      if (fila) encontrados.push({ fila: fila, it: it }); else noEncontrados.push(it.folio);
    });

    var previos = leerFilasPrevias_(encontrados.map(function (x) { return x.fila; }), COL_BASE.OBSERVACIONES, COL_BASE.ESTATUS);
    var data = [], lineas = [];
    encontrados.forEach(function (x) {
      var f = x.fila;
      data.push({ range: CFG.HOJA_BASE + '!' + letraCol_(COL_BASE.OBSERVACIONES) + f, values: [[x.it.observaciones]] });
      data.push({ range: CFG.HOJA_BASE + '!' + letraCol_(COL_BASE.ESTATUS) + f, values: [[x.it.estatus]] });
      data.push({ range: CFG.HOJA_BASE + '!' + letraCol_(COL_BASE.FECHA_W) + f, values: [[fecha]] });
      var p = previos[f] || [];
      lineas.push(x.it.folio + ' | ESTATUS: "' + resumir_(p[3], 60) + '" -> "' + x.it.estatus +
                  '" | OBS previa: "' + resumir_(p[0], 80) + '"');
    });
    escribirDatos_(data);

    registrarBitacora_(sesion.usuario, 'ACTUALIZAR_LOTE', 
      'Lote de ' + lote.length + ' (actualizados ' + encontrados.length + ', no hallados ' + noEncontrados.length + ')\n' +
      lineas.join('\n') + (noEncontrados.length ? '\nNO HALLADOS: ' + noEncontrados.join(', ') : ''));

    return { exito: true, exitosos: encontrados.length, noEncontrados: noEncontrados,
             mensaje: 'Concluyó con las actualizaciones mediante BatchUpdate.' };
  });
}

/* ---------------- COLUMNA V (fichas documentales, por lote) ---------------- */
function actualizarColumnaV_(lote, sesion, accionBitacora) {
  return conBloqueo_(function () {
    var hoja = hoja_(CFG.HOJA_BASE);
    if (hoja.getLastRow() < 2) return { exito: true, exitosos: 0, noEncontrados: [], mensaje: 'La base está vacía.' };

    var indice = indiceFolios_(hoja);
    var registroU = 'Usuario: ' + sesion.usuario + ' - Fecha: ' + ahoraTexto_();   // usuario y hora del SERVIDOR
    var encontrados = [], noEncontrados = [];
    lote.forEach(function (it) {
      var fila = indice[it.folio.toUpperCase()];
      if (fila) encontrados.push({ fila: fila, it: it }); else noEncontrados.push(it.folio);
    });

    var previos = leerFilasPrevias_(encontrados.map(function (x) { return x.fila; }), COL_BASE.AUDITORIA, COL_BASE.DOC_V);
    var data = [], lineas = [];
    encontrados.forEach(function (x) {
      data.push({ range: CFG.HOJA_BASE + '!' + letraCol_(COL_BASE.DOC_V) + x.fila, values: [[x.it.valoresCeldaV]] });
      data.push({ range: CFG.HOJA_BASE + '!' + letraCol_(COL_BASE.AUDITORIA) + x.fila, values: [[registroU]] });
      var p = previos[x.fila] || [];
      lineas.push(x.it.folio + ' | V previa: "' + resumir_(p[1], 120) + '"');
    });
    escribirDatos_(data);

    registrarBitacora_(sesion.usuario, accionBitacora, 
      'Folios: ' + lote.length + ' (actualizados ' + encontrados.length + ', no hallados ' + noEncontrados.length + ')\n' +
      lineas.join('\n') + (noEncontrados.length ? '\nNO HALLADOS: ' + noEncontrados.join(', ') : ''));

    return { exito: true, exitosos: encontrados.length, noEncontrados: noEncontrados,
             mensaje: 'Sincronización de columna V completada.' };
  });
}

function accionActualizarLoteColumnaV_(d, sesion) {
  return actualizarColumnaV_(validarLote_(d.lote, 'v'), sesion, 'ACTUALIZAR_LOTE_COLUMNA_V');
}

/* ---------------- FECHAS Y DATOS PARA EXCEL ---------------- */
function accionObtenerFechasW_() {
  var hoja = hoja_(CFG.HOJA_BASE);
  var ultima = hoja.getLastRow();
  if (ultima < 2) return { exito: true, fechas: [] };
  var tz = ss_().getSpreadsheetTimeZone();
  var valores = hoja.getRange(2, COL_BASE.FECHA_W, ultima - 1, 1).getValues();
  var unicas = {};
  for (var i = 0; i < valores.length; i++) {
    var v = valores[i][0];
    if (v === '' || v === null || v === undefined) continue;
    var s = normalizarFecha_(v, tz);
    if (s !== '') unicas[s] = true;
  }
  var fechas = Object.keys(unicas).sort(function (a, b) {
    var ka = claveFecha_(a), kb = claveFecha_(b);
    return ka < kb ? -1 : (ka > kb ? 1 : 0);
  });
  return { exito: true, fechas: fechas };
}

function accionObtenerDatosExcel_(d, sesion) {
  var fechaBuscada = normalizarFecha_(texto_(d.fecha).trim(), 'UTC');
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fechaBuscada)) throw new ErrorApi('Fecha no válida.');

  var hoja = hoja_(CFG.HOJA_BASE);
  var ultima = hoja.getLastRow();
  if (ultima < 2) return { exito: true, datos: [] };
  var tz = ss_().getSpreadsheetTimeZone();

  // Paso 1: solo la columna W para ubicar filas; Paso 2: bloques continuos.
  var colW = hoja.getRange(2, COL_BASE.FECHA_W, ultima - 1, 1).getValues();
  var bloques = [], ini = null, fin = null;
  for (var i = 0; i < colW.length; i++) {
    var fila = i + 2;
    if (normalizarFecha_(colW[i][0], tz) === fechaBuscada) {
      if (ini === null) { ini = fila; fin = fila; }
      else if (fila === fin + 1) { fin = fila; }
      else { bloques.push({ inicio: ini, cantidad: fin - ini + 1 }); ini = fila; fin = fila; }
    }
  }
  if (ini !== null) bloques.push({ inicio: ini, cantidad: fin - ini + 1 });
  if (bloques.length === 0) return { exito: true, datos: [] };

  // A, B, D, F, G, M, P, Q, R, T, S, V, W (mismo orden que el reporte original)
  var deseadas = [0, 1, 3, 5, 6, 12, 15, 16, 17, 19, 18, 21, 22];
  var encabezado = hoja.getRange(1, 1, 1, COL_BASE.FECHA_W).getValues()[0];
  var result = [deseadas.map(function (c) { return encabezado[c]; })];

  for (var b = 0; b < bloques.length; b++) {
    var chunk = hoja.getRange(bloques[b].inicio, 1, bloques[b].cantidad, COL_BASE.FECHA_W).getValues();
    for (var r = 0; r < chunk.length; r++) {
      result.push(deseadas.map(function (c) {
        var v = chunk[r][c];
        return (v instanceof Date) ? Utilities.formatDate(v, tz, CFG.FORMATO_FECHA) : v;
      }));
    }
  }
  registrarBitacora_(sesion.usuario, 'OBTENER_DATOS_EXCEL', 'Fecha ' + fechaBuscada + ': ' + (result.length - 1) + ' filas');
  return { exito: true, datos: result };
}

/* ---------------- BITÁCORA (solo ADMIN) ---------------- */
function leerBitacora_() {
  var hoja = ss_().getSheetByName(CFG.HOJA_BITACORA);
  if (!hoja) return null;
  var ultima = hoja.getLastRow();
  if (ultima < 2) return [];
  var desde = Math.max(2, ultima - CFG.BITACORA_MAX_LECTURA + 1);
  return hoja.getRange(desde, 1, ultima - desde + 1, 6).getValues();
}

function soloFecha_(v, tz) {
  if (v instanceof Date) return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  return v ? String(v).substring(0, 10) : '';
}

function accionObtenerFiltrosBitacora_() {
  var datos = leerBitacora_();
  if (datos === null) return { usuarios: [], fechas: [] };
  var tz = ss_().getSpreadsheetTimeZone();
  var us = {}, fs = {};
  datos.forEach(function (row) {
    var u = String(row[1]).trim();
    if (u) us[u] = true;
    var f = soloFecha_(row[0], tz);
    if (f) fs[f] = true;
  });
  return { usuarios: Object.keys(us).sort(), fechas: Object.keys(fs).sort().reverse() };
}

function accionObtenerBitacora_(d) {
  var datos = leerBitacora_();
  if (datos === null) return { error: "La hoja 'Bitacora' no existe." };
  var tz = ss_().getSpreadsheetTimeZone();
  var filtroFecha = texto_(d.filtroFecha).trim();
  var filtroUsuario = texto_(d.filtroUsuario).trim().toLowerCase();
  if (filtroFecha && !/^\d{4}-\d{2}-\d{2}$/.test(filtroFecha)) throw new ErrorApi('Filtro de fecha no válido.');

  var logs = [];
  datos.forEach(function (row) {
    var v = row[0];
    var fechaCompleta = (v instanceof Date) ? Utilities.formatDate(v, tz, CFG.FORMATO_FECHA_HORA) : (v ? String(v) : '');
    var usuario = String(row[1]).trim();
    if (filtroFecha && soloFecha_(v, tz) !== filtroFecha) return;
    if (filtroUsuario && usuario.toLowerCase() !== filtroUsuario) return;
    logs.push({ fecha: fechaCompleta, usuario: usuario, accion: String(row[2]), detalle: String(row[5] || '') });
  });
  // Orden cronológico ascendente (el visor lo invierte); solo los más recientes.
  return logs.length > CFG.BITACORA_MAX_RESULTADOS ? logs.slice(logs.length - CFG.BITACORA_MAX_RESULTADOS) : logs;
}

/* ---------------- USUARIOS (solo ADMIN) ---------------- */
function accionObtenerUsuarios_() {
  var hoja = hoja_(CFG.HOJA_USUARIOS);
  var ultima = hoja.getLastRow();
  var lista = [];
  if (ultima < 2) return lista;
  var datos = hoja.getRange(2, 1, ultima - 1, 5).getValues();
  datos.forEach(function (r) {
    if (r[COL_USUARIOS.USUARIO - 1]) {
      lista.push({ usuario: r[COL_USUARIOS.USUARIO - 1], estado: r[COL_USUARIOS.ESTADO - 1] });
    }
  });
  return lista;   // nunca incluye contraseñas ni hashes
}

function accionBloquearUsuario_(d, sesion) {
  var objetivo = texto_(d.usuarioAQuitar).trim();
  if (!objetivo) throw new ErrorApi('Selecciona un usuario.');
  if (objetivo === sesion.usuario) return { exito: false, error: 'No puedes bloquear tu propio usuario.' };

  return conBloqueo_(function () {
    var u = buscarUsuario_(objetivo);
    if (!u) return { exito: false, error: 'No encontrado' };
    hoja_(CFG.HOJA_USUARIOS).getRange(u.fila, COL_USUARIOS.ESTADO).setValue('Bloqueado');
    registrarBitacora_(sesion.usuario, 'BLOQUEAR_USUARIO', 'Usuario bloqueado: ' + objetivo);
    // Sus sesiones dejan de valer de inmediato: validarSesion_ consulta el estado en cada petición.
    return { exito: true };
  });
}
