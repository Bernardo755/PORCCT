# Sistema de búsqueda y captura — GitHub Pages + Google Apps Script

Frontend estático (GitHub Pages) y backend en Google Apps Script que usa Google Sheets como base de datos.

## Estructura

```
index.html            Carga de recursos (el orden de los <script> importa)
config.js             Configuración PÚBLICA (URLs y ajustes de interfaz)
css/styles.css        Estilos
modules/
  utils.js            escaparHTML y utilidades
  session.js          Token en memoria, inactividad (15 min) y expiración absoluta
  api.js              Única capa de comunicación con el backend (enviarPeticion)
  registry.js         Registro de módulos (permisos, reset, cambios pendientes)
  login.js, app-shell.js
  mod-tramites.js, mod-tarjetas.js, mod-consulta.js   Lanzadores de apps externas (iframes)
  mod-edicion.js, mod-excel.js, mod-documental.js, mod-admin.js
  mod-qr.js, mod-modales.js
  core.js             Login/logout, vistas por permisos, búsqueda principal
backend/              Se copian al proyecto de Apps Script (un archivo .gs por cada uno)
  Code.gs             doPost: sesión -> permiso -> acción
  Config.gs           Constantes y MATRIZ DE PERMISOS (fuente única)
  Auth.gs             Login, contraseñas con hash, sesiones
  Api.gs              Acciones: buscar, lotes, Excel, bitácora, usuarios
  Utils.gs            Utilidades, bloqueo de escritura, bitácora
```

## Cómo funciona la seguridad

El navegador **no es confiable**: todo lo que GitHub Pages sirve puede inspeccionarse y modificarse. Por eso:

1. `login` valida usuario y contraseña **en Apps Script** contra la hoja `Usuarios` y devuelve un **token** aleatorio, el rol y la lista de acciones permitidas. Nunca se envía la hoja de usuarios, contraseñas ni hashes.
2. El token vive **solo en memoria** del navegador (no en `localStorage`/`sessionStorage`). Recargar la página exige iniciar sesión otra vez.
3. En **cada petición** el backend valida: token vigente (máximo **2 horas** desde el login) → usuario existente y no bloqueado → rol (leído de la hoja en ese momento) → permiso de la acción (`PERMISOS` en `Config.gs`). El campo `usuario` que envíe el navegador se ignora; el usuario sale de la sesión del servidor.
4. Bloquear a un usuario o cambiarle el rol en la hoja surte efecto en su siguiente petición.
5. Las contraseñas en texto plano se **migran automáticamente a hash** en el primer inicio de sesión correcto (formato `h1:<iteraciones>:<sal>:<hash>`, HMAC-SHA256 con sal por usuario y un *pepper* secreto en Script Properties). Después de eso la hoja ya no contiene la contraseña legible.
6. Tras 5 intentos fallidos de un mismo usuario, el login se bloquea 15 minutos.
7. Escrituras a la hoja en modo `RAW` (un texto que empiece con `=` no se convierte en fórmula) y bajo `LockService`.

> Ocultar botones por rol es solo comodidad visual. La autorización real es la del backend.

## Instalación del backend (una sola vez)

1. En el proyecto de Apps Script crea los archivos `Code`, `Config`, `Auth`, `Api` y `Utils` (`.gs`) y pega el contenido de `backend/`. Si ya tenías un `Code.gs`, **reemplázalo** (no dejes dos `doPost`).
2. Servicios (barra lateral → "+" junto a *Servicios*): agrega **Google Sheets API** (`Sheets`).
3. Ejecuta **`configurarPropiedadesIniciales`** desde el editor y autoriza los permisos. Crea el secreto `PASSWORD_PEPPER`. **No lo cambies ni lo borres después**: invalidaría las contraseñas ya migradas.
4. Implementar → Nueva implementación (o *Gestionar implementaciones → Editar → Nueva versión*) como aplicación web: ejecutar como **Yo**, acceso **Cualquier persona**. Si la URL `/exec` cambia, actualízala en `config.js`.
5. Las hojas `Usuarios`, `Base` y `Bitacora` conservan su estructura actual (ver abajo).

## Hojas de Google Sheets

| Hoja | Columnas usadas |
|---|---|
| `Usuarios` | A usuario · B contraseña (hash tras el primer login) · C estado (`Bloqueado` o cualquier otro) · D rol · E SARE |
| `Base` | A Folio · B SARE · D Municipio · F CCT · G Escuela · H Id_Becario · I Nombre · J Ap. paterno · K Ap. materno · L Remesa · M Nivel · N Bloque · P Observaciones · Q Mes remesa · R CURP · S Estatus · T Nombre completo · U auditoría · V cadena documental · W fecha de registro |
| `Bitacora` | A fecha/hora · B usuario · C acción · D y E (vacías, antes IP y ubicación; **no las borres**) · F detalle |

El sistema **no registra IP ni ubicación**. La columna *Detalle* guarda, en cada actualización, los folios afectados y los valores previos.

## Roles y permisos (matriz vigente)

Valores de la columna D reconocidos: `ADMIN` (o `ADMINISTRADOR`), `RESP` (o `RESPONSABLE`), `ATENCION` (o `ATENCIÓN`), `USER` (o `USUARIO`). Cualquier otro valor no puede iniciar sesión.

| Función | ADMIN | RESP | ATENCION | USER |
|---|:-:|:-:|:-:|:-:|
| Buscador principal | ✔ | ✔ | ✔ | ✔ |
| Registro de Trámites · Carga de Tarjetas · Consulta Estados (apps externas) | ✔ | ✔ | — | — |
| Edición por bloques · Reporte Excel · Fichas documentales | ✔ | ✔ | ✔ | — |
| Bitácora · Bloquear usuarios | ✔ | — | — | — |

Para cambiarla edita **solo** `PERMISOS` en `Config.gs`; el frontend lee las acciones permitidas en el login.

## Configuración

| Variable | Dónde | Tipo | Quién la usa |
|---|---|---|---|
| `API_URL` | `config.js` | Pública (el navegador la necesita) | api.js |
| `URL_APP_B`, `URL_CARGA_TARJETAS`, `URL_SISTEMA_CONSULTA` | `config.js` | Públicas | mod-modales.js |
| `INACTIVIDAD_MIN`, `SUSPENDER_INACTIVIDAD_EN_MODALES` | `config.js` | Públicas (interfaz) | session.js |
| `SESION_MAX_SEG`, `MAX_INTENTOS_LOGIN`, `MAX_LOTE`, etc. | `backend/Config.gs` | Privadas (no secretas) | backend |
| `PASSWORD_PEPPER` | **Script Properties** | **Secreta** | Auth.gs |

Este proyecto **no usa `.env`**: es un sitio estático sin proceso de compilación, así que un `.env` no protegería nada (lo que llega al navegador es público). El `.gitignore` queda preparado por si en el futuro se agrega.

## Cómo cargarlo en GitHub (estructura de carpetas)

**Las carpetas son obligatorias**: `index.html` busca `css/styles.css` y `modules/*.js` con esas rutas exactas. La raíz del repositorio debe quedar así:

```
(raíz del repositorio)
├── index.html
├── config.js
├── Imagen11.png                      ← junto a index.html (así las busca el código)
├── user___Imagen4t (5).gif           ← junto a index.html
├── css/
│   └── styles.css
├── modules/
│   ├── utils.js  session.js  api.js  registry.js
│   ├── login.js  app-shell.js  core.js
│   ├── mod-tramites.js  mod-tarjetas.js  mod-consulta.js
│   ├── mod-edicion.js  mod-excel.js  mod-documental.js  mod-admin.js
│   └── mod-qr.js  mod-modales.js
├── backend/                          ← referencia; el código real vive en Apps Script
│   └── Code.gs  Config.gs  Auth.gs  Api.gs  Utils.gs
├── .gitignore
└── README.md
```

Pasos desde la web de GitHub: repositorio → *Add file → Upload files* → arrastra **el contenido** de la carpeta `app/` (no la carpeta `app` en sí; `index.html` debe quedar en la raíz) → *Commit changes*. Para reemplazar un archivo existente, se sube con el mismo nombre y ruta. Luego *Settings → Pages → Branch: main, carpeta / (root)*.

Notas:
- Nada de `backend/` es necesario para que funcione la página; es una copia de referencia. Como el repositorio es público, esa carpeta también es visible: no contiene secretos (el único secreto, `PASSWORD_PEPPER`, vive en Script Properties).
- Si prefieres mantener las imágenes en una carpeta `assets/`, hay que cambiar sus rutas en `app-shell.js` y `login.js`.

## Librerías externas

- `xlsx@0.18.5` (cdnjs) y `html5-qrcode@2.3.8` (unpkg, ahora con versión fija).
- **Qué es `integrity` (SRI):** una huella digital (hash) del archivo esperado. El navegador la compara con lo que descarga del CDN y, si el archivo fue alterado, **no lo ejecuta**. Protege contra que el CDN o una cuenta del proveedor sea comprometida y sirva una versión maliciosa de la librería. Es opcional, pero recomendable aquí porque esa librería se ejecuta dentro de una página con datos personales. Debe actualizarse si cambias de versión.
- Para activarlo, añade `integrity`. Se calcula con: `curl -s URL | openssl dgst -sha384 -binary | openssl base64 -A` y se usa como `integrity="sha384-RESULTADO" crossorigin="anonymous"`.

## Agregar o modificar un módulo

1. Crear `modules/mod-nuevo.js`: inserta su HTML en `#modulos-acordeon` y termina con `Modulos.registrar({ id, accion, reset, pendientes?, alMostrar? })`.
2. Cargarlo en `index.html` (antes de `mod-qr.js`).
3. Si usa el backend: agregar la acción en `obtenerAcciones_()` (Api.gs) y en `PERMISOS` (Config.gs), y llamarla con `enviarPeticion({ action: '...' })`.
4. `core.js` no necesita cambios.

## Rotación y mantenimiento

- **Contraseña de un usuario:** escribir una nueva en texto plano en la columna B; se convertirá a hash en su siguiente login. (Hasta entonces es legible: hacerlo con el usuario presente.)
- **Revocar a un usuario:** bloquearlo desde el panel de administración; su sesión deja de valer en la siguiente petición. Para cerrar *todas* las sesiones al instante no hay una acción incorporada (las sesiones caducan solas a las 2 h); si se necesitara, se agregaría un "número de versión de sesiones" en Script Properties.
- **Estatus nuevo en Edición:** añadirlo también a `ESTATUS_PERMITIDOS` (Config.gs).
- Si la URL `/exec` se hubiera compartido, considérala conocida: la protección real es el login, no ocultar la URL.

## Límites conocidos

- Las tres apps externas (`PRUEBA`, `ACTUALIZADOR`, `ESTADOS`) son páginas públicas con su propio script: quien conozca su URL puede abrirlas sin pasar por este login. Deben protegerse en su propio backend.
- La caché de sesiones (`CacheService`) es de mejor esfuerzo: si Google la vacía, hay que volver a iniciar sesión.
- Los botones usan `onclick` en línea, por lo que no se puede aplicar una *Content-Security-Policy* estricta sin refactorizar.
