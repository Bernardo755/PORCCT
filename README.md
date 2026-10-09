# Sistema de búsqueda y captura — GitHub Pages + Google Apps Script

## Arquitectura
```
NAVEGADOR (GitHub Pages, no confiable)
   │  POST text/plain  { action, token, ... }
   ▼
APPS SCRIPT (backend: valida sesión, rol y permiso en CADA acción)
   ├── Hoja Usuarios  (usuario, contraseña, estado, rol, SARE)
   ├── Hoja Base      (registros)
   └── Hoja Bitacora  (auditoría)
```
- El navegador **nunca** recibe la hoja de usuarios ni contraseñas. El login devuelve solo: token, usuario, rol, SARE y la lista de módulos permitidos.
- El token (64 hex) vive solo en memoria del navegador y en `CacheService` del servidor. Expira a los 15 min sin actividad (se renueva con cada petición y con un *ping* cada 4 min mientras el usuario está activo) y a las 6 h como máximo.
- Ocultar botones es solo interfaz; la seguridad real está en `backend/`.

## Estructura
```
index.html  config.js  css/styles.css
modules/  utils.js api.js login.js app-shell.js core.js
          mod-tramites.js mod-tarjetas.js mod-consulta.js mod-edicion.js
          mod-excel.js mod-documental.js mod-admin.js mod-qr.js mod-modales.js
backend/  Code.gs Config.gs Auth.gs Utils.gs
          modules/ Busqueda.gs Edicion.gs Documental.gs Reportes.gs Admin.gs
```
Imágenes requeridas en la raíz: `Imagen11.png` y `user___Imagen4t (5).gif` (recomendado renombrarlo sin espacios y actualizar `app-shell.js`).

## Roles y permisos (única fuente: `MODULOS_POR_ROL` en `backend/Config.gs`)
| Módulo | ADMIN | RESP | ATENCION | USER |
|---|:-:|:-:|:-:|:-:|
| Buscador | ✔ | ✔ | ✔ | ✔ |
| Edición por bloques | ✔ | ✔ | ✔ | — |
| Reporte Excel | ✔ | ✔ | ✔ | — |
| Documental | ✔ | ✔ | ✔ (*) | — |
| Consulta Estados / Registro de Trámites | ✔ | ✔ | — | — |
| Carga de tarjetas / Administración | ✔ | — | — | — |

(*) PENDIENTE DE CONFIRMAR: se conservó porque el código original lo daba a ATENCION. Para quitarlo, borra `'documental'` de `ATENCION` en `Config.gs`.
Los roles se normalizan: `ADMINISTRADOR→ADMIN`, `RESPONSABLE→RESP`, `ATENCIÓN→ATENCION`, `USUARIO→USER`. Un rol desconocido no puede entrar.

## Instalación del backend
1. Pega cada archivo de `backend/` en el proyecto de Apps Script (mismo nombre).
2. Servicios → habilita **Google Sheets API** (servicio avanzado; ya lo usaba el código original).
3. (Opcional) Propiedades de la secuencia → `SPREADSHEET_ID`. Si no existe se usa la hoja a la que está vinculado el script.
4. Implementar → Aplicación web (misma configuración de acceso que ya tienes) → copia la URL a `config.js` → `API_URL`.
5. **Todas las apps que llamen a este endpoint ahora necesitan token** (ver "Pendientes").

## Contraseñas y usuarios
Se aceptan **texto plano** (cuentas antiguas) y `sha256$sal$hash`. Todo lo que se crea o restablece desde el panel se guarda como hash.

**Desde la app (rol ADMIN, módulo Administración → Gestión de Usuarios):**
- **Crear usuario:** usuario (3-50: letras, números, `. _ - @`), contraseña (mín. 8, sin espacios en los extremos), rol y SARE (obligatorio para ATENCION). Se agrega a la hoja `Usuarios` como `usuario | hash | Activo | ROL | SARE`.
- **Restablecer contraseña:** de cualquier usuario, incluido uno mismo. Cierra las sesiones abiertas de ese usuario (no la propia) y limpia sus intentos fallidos.
- **Bloquear / Habilitar acceso:** cambia la columna C entre `Bloqueado` y `Activo`. Al bloquear se cierran sus sesiones al instante; al habilitar se limpian sus intentos fallidos y debe iniciar sesión de nuevo. Nadie puede bloquearse a sí mismo.
- Ninguna contraseña se escribe en la bitácora. La bitácora registra `CREAR_USUARIO` y `RESTABLECER_PASSWORD`.

**Migración de cuentas antiguas (opcional):** respalda `Usuarios` y ejecuta a mano `migrarContrasenasAHash()`; convierte solo las que sigan en texto plano.
Si una contraseña se olvida no se puede recuperar: se restablece desde el panel.

## Variables / configuración
| Nombre | Dónde | Tipo |
|---|---|---|
| `API_URL`, `URL_APP_B`, `URL_CARGA_TARJETAS`, `URL_SISTEMA_CONSULTA` | `config.js` | Pública (el navegador las necesita) |
| `TIEMPO_INACTIVIDAD_MS`, `TIMEOUT_PETICION_MS`, `KEEPALIVE_MS` | `config.js` | Pública |
| `SPREADSHEET_ID` | Script Properties | Privada (opcional) |
| `CONFIG`, `COL`, `MODULOS_POR_ROL`, `ESTATUS_PERMITIDOS` | `backend/Config.gs` | Backend |

No hay `.env`: GitHub Pages no tiene paso de *build*, así que un `.env` no se usaría y, si se inyectara al JS, tampoco sería secreto. No hay ningún secreto en el repositorio.

## Despliegue
GitHub Pages desde la rama principal, carpeta raíz. Opcional: descomenta la CSP de `index.html` y prueba.

## Agregar o cambiar un módulo
1. Frontend: crea `modules/mod-nuevo.js` (markup + `App.registrar({...})` + `App.alCerrarSesion(...)`), agrégalo a `index.html` antes de `core.js` y su id a `MODULOS_UI` en `core.js`.
2. Backend: crea `backend/modules/Nuevo.gs`, agrega su ruta en `rutas_()` de `Code.gs` y su clave de módulo en `MODULOS_POR_ROL`.
3. Todo cambio de permisos se hace solo en `Config.gs`.

## Mantenimiento de seguridad
- Si algún secreto real estuvo alguna vez en el repositorio: revócalo, rótalo y revisa el historial de Git.
- Bitácora: ya no registra IP ni ubicación. Las columnas D y E se conservan vacías para no romper el historial.
- Iframes de Trámites/Tarjetas/Consulta: son páginas públicas de GitHub Pages; quien conozca su URL puede abrirlas directamente. Deben tener su propia autenticación.
