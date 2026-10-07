/* =========================================================
   api.js — Única capa de comunicación con el backend (Apps Script)
   - Envía el token de sesión en cada petición.
   - El backend decide quién es el usuario y qué puede hacer;
     lo que se envíe como "usuario" ya no tiene ningún efecto.
   ========================================================= */
const API_URL = window.APP_CONFIG.API_URL;
let manejandoSesionInvalida = false;

async function enviarPeticion(datos, opciones) {
    opciones = opciones || {};
    const cuerpo = Object.assign({}, datos, { token: Sesion.token() });

    const respuesta = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(cuerpo),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });

    let json;
    try { json = JSON.parse(await respuesta.text()); }
    catch (e) { throw new Error('Respuesta no válida del servidor.'); }

    if (json && json.codigo === 'SESION_INVALIDA' && !opciones.silencioso) manejarSesionInvalida(json.error);
    return json;
}

function manejarSesionInvalida(mensaje) {
    if (manejandoSesionInvalida || !Sesion.token()) return;   // ya estamos en la pantalla de acceso
    manejandoSesionInvalida = true;
    alert(mensaje || "Tu sesión expiró. Vuelve a ingresar.");
    cerrarSesion(true, false).finally(() => { manejandoSesionInvalida = false; });
}
