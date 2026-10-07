/* =========================================================
   Utils.gs — Utilidades compartidas
   ========================================================= */

/* Error controlado: su mensaje SÍ se muestra al usuario. Cualquier otro error se oculta. */
function ErrorApi(mensaje, codigo) {
  this.message = mensaje;
  this.codigo = codigo || 'ERROR';
  this.name = 'ErrorApi';
}
ErrorApi.prototype = Object.create(Error.prototype);
ErrorApi.prototype.constructor = ErrorApi;

function res(d) {
  return ContentService.createTextOutput(JSON.stringify(d)).setMimeType(ContentService.MimeType.JSON);
}

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function hoja_(nombre) {
  var h = ss_().getSheetByName(nombre);
  if (!h) throw new ErrorApi("La hoja '" + nombre + "' no existe.", 'HOJA_INEXISTENTE');
  return h;
}

function texto_(v, max) {
  var s = (v === null || v === undefined) ? '' : String(v);
  return (max && s.length > max) ? s.substring(0, max) : s;
}

function resumir_(v, max) {
  var s = texto_(v).replace(/[\r\n]+/g, ' ');
  return s.length > max ? s.substring(0, max) + '…' : s;
}

function bytesAHex_(bytes) {
  var h = '';
  for (var i = 0; i < bytes.length; i++) {
    var b = (bytes[i] + 256) % 256;
    h += (b < 16 ? '0' : '') + b.toString(16);
  }
  return h;
}

function sha256Hex_(texto) {
  return bytesAHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, texto, Utilities.Charset.UTF_8));
}

/* Comparación de cadenas sin cortocircuito. */
function compararSeguro_(a, b) {
  a = String(a); b = String(b);
  var diff = a.length ^ b.length;
  var n = Math.max(a.length, b.length);
  for (var i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/* Exclusión mutua para operaciones de escritura. */
function conBloqueo_(fn) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(30000); }
  catch (e) { throw new ErrorApi('El sistema está ocupado. Intenta de nuevo en unos segundos.', 'OCUPADO'); }
  try { return fn(); } finally { lock.releaseLock(); }
}

function pad2_(n) { n = String(n); return n.length < 2 ? '0' + n : n; }

/* Normaliza fechas a dd/MM/yyyy: acepta objetos Date y textos d/M/yyyy heredados. */
function normalizarFecha_(valor, tz) {
  if (valor instanceof Date) return Utilities.formatDate(valor, tz, CFG.FORMATO_FECHA);
  var s = String(valor === null || valor === undefined ? '' : valor).trim();
  var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  return m ? pad2_(m[1]) + '/' + pad2_(m[2]) + '/' + m[3] : s;
}

/* dd/MM/yyyy -> yyyyMMdd (para ordenar cronológicamente). */
function claveFecha_(ddmmyyyy) {
  var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddmmyyyy);
  return m ? m[3] + m[2] + m[1] : '99999999' + ddmmyyyy;
}

function ahoraTexto_() {
  return Utilities.formatDate(new Date(), ss_().getSpreadsheetTimeZone(), CFG.FORMATO_FECHA_HORA);
}

function letraCol_(n) {
  var s = '';
  while (n > 0) { var r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/* =========================================================
   BITÁCORA
   - Se escribe en modo RAW (nunca se interpretan fórmulas).
   - No se registra IP ni ubicación. Las columnas D y E quedan vacías para conservar la
     estructura de la hoja (el Detalle sigue en la columna F).
   - Un fallo al registrar no bloquea la operación, pero se deja en el log de Apps Script.
   ========================================================= */
function registrarBitacora_(usuario, accion, detalle) {
  try {
    var ss = ss_();
    var sheet = ss.getSheetByName(CFG.HOJA_BITACORA);
    if (!sheet) {
      sheet = ss.insertSheet(CFG.HOJA_BITACORA);
      sheet.appendRow(['Fecha y Hora', 'Usuario', 'Acción', '', '', 'Detalle']);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#e0e0e0');
    }
    var fila = [
      ahoraTexto_(),
      texto_(usuario || 'Desconocido', 100),
      texto_(accion, 60),
      '',   // columnas D y E (antes IP y ubicación): se conservan vacías para no mover el Detalle
      '',
      texto_(detalle || '', CFG.BITACORA_MAX_DETALLE)
    ];
    Sheets.Spreadsheets.Values.append({ values: [fila] }, ss.getId(), CFG.HOJA_BITACORA + '!A:F',
      { valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS' });
  } catch (err) {
    console.error('No se pudo registrar en bitácora: ' + err);
  }
}
