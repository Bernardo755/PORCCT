/* =========================================================
   Config.gs — Configuración NO secreta del backend
   Los secretos (pepper de contraseñas) viven en
   PropertiesService.getScriptProperties(), nunca aquí.
   ========================================================= */

var CFG = {
  HOJA_BASE: 'Base',
  HOJA_USUARIOS: 'Usuarios',
  HOJA_BITACORA: 'Bitacora',

  // Sesión: máximo 2 horas desde el login, validada en el servidor.
  SESION_MAX_SEG: 7200,

  // Protección contra fuerza bruta en el login.
  MAX_INTENTOS_LOGIN: 5,
  BLOQUEO_LOGIN_SEG: 900,

  // Iteraciones del hash de contraseñas (se guardan junto al hash;
  // se puede subir en el futuro sin invalidar contraseñas ya migradas).
  HASH_ITERACIONES: 100,

  // Búsqueda
  MAX_RESULTADOS_BUSQUEDA: 25,   // debe coincidir con LIMITE_RESULTADOS del frontend (core.js)
  MIN_LONG_NOMBRE: 3,            // solo aplica a búsqueda parcial por Nombre
  MAX_LONG_BUSQUEDA: 100,

  // Lotes y textos
  MAX_LOTE: 500,
  MAX_LONG_FOLIO: 60,
  MAX_LONG_OBSERVACION: 1000,
  MAX_LONG_CADENA_V: 2000,

  // Bitácora
  BITACORA_MAX_LECTURA: 20000,    // solo se analizan los últimos N eventos
  BITACORA_MAX_RESULTADOS: 1000,  // máximo de filas devueltas al visor
  BITACORA_MAX_DETALLE: 40000,    // límite de caracteres del campo Detalle

  FORMATO_FECHA: 'dd/MM/yyyy',
  FORMATO_FECHA_HORA: 'yyyy-MM-dd HH:mm:ss',

  // Rechaza estatus que no estén en ESTATUS_PERMITIDOS (los mismos que ofrece la interfaz).
  VALIDAR_ESTATUS: true
};

/* Columnas de la hoja Base (números de columna, base 1). */
var COL_BASE = {
  FOLIO: 1, SARE: 2, MUNICIPIO: 4, CCT: 6, ESCUELA: 7, ID_BECARIO: 8,
  NOMBRE: 9, APELLIDO_PATERNO: 10, APELLIDO_MATERNO: 11, REMESA: 12,
  NIVEL: 13, BLOQUE: 14, OBSERVACIONES: 16, MES_REMESA: 17, CURP: 18,
  ESTATUS: 19, NOMBRE_COMPLETO: 20, AUDITORIA: 21, DOC_V: 22, FECHA_W: 23
};

/* Columnas de la hoja Usuarios. */
var COL_USUARIOS = { USUARIO: 1, PASSWORD: 2, ESTADO: 3, ROL: 4, SARE: 5 };

/* Estatus que ofrece hoy el módulo de Edición. Si se agrega uno nuevo en la interfaz, agregarlo aquí. */
var ESTATUS_PERMITIDOS = [
  'SOBRANTE', 'SOBRANTE CON OBSERVACIONES',
  'ENTREGADA POR 1301', 'ENTREGADA POR 1302', 'ENTREGADA POR 1303', 'ENTREGADA POR 1304',
  'ENTREGADA POR 1305', 'ENTREGADA POR 1306', 'ENTREGADA POR 1307',
  'ENVIADA A OTRO ESTADO', 'ENVIADA A OTRA SARE'
];

/* Roles reales y sus alias (el valor de la columna D se normaliza a estos cuatro). */
var ROLES_VALIDOS = ['ADMIN', 'RESP', 'ATENCION', 'USER'];
var ALIAS_ROLES = { 'ADMINISTRADOR': 'ADMIN', 'RESPONSABLE': 'RESP', 'USUARIO': 'USER' };

/* =========================================================
   MATRIZ DE PERMISOS (única fuente de verdad)
   acción -> roles autorizados. El servidor la valida en CADA petición
   y la envía al frontend en el login para decidir qué módulos mostrar.
   Las acciones "modulo_*" no ejecutan nada aquí: solo controlan qué
   módulos externos (iframes) ve cada rol.
   ========================================================= */
var PERMISOS = {
  logout:                      ['ADMIN', 'RESP', 'ATENCION', 'USER'],
  buscar:                      ['ADMIN', 'RESP', 'ATENCION', 'USER'],

  modulo_tramites:             ['ADMIN', 'RESP'],
  modulo_tarjetas:             ['ADMIN', 'RESP'],
  modulo_consulta:             ['ADMIN', 'RESP'],

  actualizar_lote:             ['ADMIN', 'RESP', 'ATENCION'],
  actualizar_lote_columna_v:   ['ADMIN', 'RESP', 'ATENCION'],
  obtener_fechas_w:            ['ADMIN', 'RESP', 'ATENCION'],
  obtener_datos_excel:         ['ADMIN', 'RESP', 'ATENCION'],

  obtener_filtros_bitacora:    ['ADMIN'],
  obtener_bitacora:            ['ADMIN'],
  obtener_usuarios:            ['ADMIN'],
  bloquear_usuario:            ['ADMIN']
};
