/* =========================================================
   CONFIGURACIÓN PÚBLICA
   GitHub Pages es estático: todo lo de este archivo lo ve el navegador.
   Aquí NO va ningún secreto. La seguridad real está en Apps Script
   (token de sesión + rol validados en cada petición).
   ========================================================= */
window.APP_CONFIG = Object.freeze({
  API_URL: 'https://script.google.com/macros/s/AKfycbwkNIUkmp6mDE6sskz7_9OXxyo45R9RgsPcfFjYWihfjEO6ecC7RRLthHjTEH_2SMrfkA/exec',
  URL_APP_B: 'https://bernardo755.github.io/PRUEBA/',
  URL_CARGA_TARJETAS: 'https://bernardo755.github.io/ACTUALIZADOR/',
  URL_SISTEMA_CONSULTA: 'https://bernardo755.github.io/ESTADOS/',

  TIEMPO_INACTIVIDAD_MS: 15 * 60 * 1000,
  TIMEOUT_PETICION_MS: 60 * 1000,
  KEEPALIVE_MS: 4 * 60 * 1000
});
