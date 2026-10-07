/* =========================================================
   CONFIGURACIÓN
   IMPORTANTE: GitHub Pages es estático; cualquier valor usado
   por el navegador puede ser inspeccionado en Network/Source.
   Esto organiza el proyecto, pero no convierte las URLs en secretos.
   NUNCA escribir aquí contraseñas, tokens ni llaves. El límite de sesión (2 h) lo fija el backend.
   ========================================================= */
window.APP_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbwiWNdsNQ3XUOM96JO-L2c8RuI1SreWVXHETYnlGffcdjGycJxXLCPf652jIAzDT3Ar5A/exec',
  URL_APP_B: 'https://bernardo755.github.io/PRUEBA/',
  URL_CARGA_TARJETAS: 'https://bernardo755.github.io/ACTUALIZADOR/',
  URL_SISTEMA_CONSULTA: 'https://bernardo755.github.io/ESTADOS/',

  // Comportamiento de la interfaz (no son secretos ni controles de seguridad).
  INACTIVIDAD_MIN: 15,                      // minutos sin actividad antes de cerrar sesión
  SUSPENDER_INACTIVIDAD_EN_MODALES: true    // true: no cuenta inactividad mientras hay una app externa abierta
};
