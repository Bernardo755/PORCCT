# Sistema modular para GitHub Pages

## Estructura
- `index.html`: solo estructura mínima y carga de recursos.
- `config.js`: URLs/endpoints.
- `css/styles.css`: estilos.
- `modules/login.js`: pantalla de acceso.
- `modules/app-shell.js`: encabezado, búsqueda y contenedor.
- `modules/mod-tramites.js`: Registro de trámites.
- `modules/mod-tarjetas.js`: Carga de tarjetas.
- `modules/mod-consulta.js`: Consulta de estados.
- `modules/mod-edicion.js`: Edición / captura por bloques.
- `modules/mod-excel.js`: Reporte Excel.
- `modules/mod-documental.js`: Validación y fichas documentales.
- `modules/mod-admin.js`: Bitácora y administración.
- `modules/mod-qr.js`: lectores QR.
- `modules/mod-modales.js`: iframes de las aplicaciones externas.
- `modules/core.js`: sesión, roles, API, búsqueda y limpieza total.

## Cambio solicitado: KIT DOCUMENTAL
En `EDICIÓN — CAPTURA POR BLOQUES`, al seleccionar `ENTREGADAS`:
1. Se selecciona Sí o No una sola vez.
2. Al agregar un registro, la selección se conserva.
3. Se pueden agregar varios folios sin volver a seleccionar KIT.
4. Cada registro conserva el valor de KIT que tenía al momento de agregarse.
5. La tabla muestra el KIT de cada registro.
6. El KIT se limpia al enviar el bloque o al cerrar sesión.

## Cierre de sesión
`cerrarSesion()` restablece:
- usuario, rol y SARE;
- búsqueda y resultados;
- actividad, estatus, folio, observaciones y KIT;
- lote temporal;
- módulo documental y sus campos/listas;
- fechas del reporte;
- filtros de bitácora;
- usuarios de administración;
- acordeones abiertos;
- cámaras QR;
- iframes/modales;
- sessionStorage y claves conocidas de localStorage.

## Seguridad
Separar JS no oculta el código al navegador. Todo archivo que GitHub Pages entregue al cliente puede inspeccionarse. La seguridad real debe estar en Apps Script, validando autenticación/autorización en cada operación. El backend original recibe acciones como `login`, `buscar`, `actualizar_lote`, `actualizar_columna_v`, `obtener_usuarios` y `bloquear_usuario`, por lo que conviene que cada acción sensible compruebe el usuario/rol en servidor.
