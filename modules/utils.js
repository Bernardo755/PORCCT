/* =========================================================
   utils.js — Utilidades compartidas del frontend
   ========================================================= */

/* Escapa texto para insertarlo en HTML (nodos de texto Y atributos). */
function escaparHTML(t) {
    return (t === null || t === undefined || t === "") ? "" : String(t)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
