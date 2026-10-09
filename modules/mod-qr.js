/* Escáneres QR (búsqueda principal y documental) */
(function () {
  'use strict';
  const { $ } = window.Utils;
  let qrPrincipal = null;
  let qrDoc = null;

  function libDisponible() {
    if (typeof Html5Qrcode === 'undefined') { alert('No se pudo cargar el lector QR. Revisa tu conexión.'); return false; }
    return true;
  }

  function iniciarPrincipal() {
    if (!libDisponible()) return;
    if (qrPrincipal && qrPrincipal.isScanning) return;
    $('lector-qr').style.display = 'block';
    $('btnDetenerQR').style.display = 'inline-block';
    if (!qrPrincipal) qrPrincipal = new Html5Qrcode('lector-qr');

    qrPrincipal.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      texto => { $('valorBusqueda').value = texto.substring(0, 18); detenerPrincipal(); },
      () => { /* ignorar errores de lectura frame por frame */ }
    ).catch(err => {
      console.error('Error al iniciar la cámara:', err);
      alert('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
      ocultarPrincipal();
    });
  }

  function ocultarPrincipal() {
    $('lector-qr').style.display = 'none';
    $('btnDetenerQR').style.display = 'none';
  }

  function detenerPrincipal() {
    if (qrPrincipal && qrPrincipal.isScanning) {
      return qrPrincipal.stop().then(ocultarPrincipal).catch(err => console.error('Error al detener el escáner', err));
    }
    ocultarPrincipal();
    return Promise.resolve();
  }

  function iniciarDoc() {
    if (!libDisponible()) return;
    if (qrDoc && qrDoc.isScanning) return;
    const cont = $('contenedor-escaner-doc');
    cont.style.display = 'block';
    if (!qrDoc) qrDoc = new Html5Qrcode('reader-doc');

    qrDoc.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      texto => {
        const limpio = texto.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+/g, ' ').trim();
        $('docValorBusqueda').value = limpio.substring(0, 18);
        detenerDoc();
      },
      () => { /* ignorar errores continuos */ }
    ).catch(err => {
      alert('Error al iniciar la cámara. Asegúrate de dar los permisos correspondientes.');
      console.error(err);
      cont.style.display = 'none';
    });
  }

  function detenerDoc() {
    const cont = $('contenedor-escaner-doc');
    if (qrDoc && qrDoc.isScanning) {
      return qrDoc.stop().then(() => { cont.style.display = 'none'; }).catch(err => console.error('Error al detener el escáner:', err));
    }
    if (cont) cont.style.display = 'none';
    return Promise.resolve();
  }

  window.App.registrar({
    'qr.iniciar': iniciarPrincipal,
    'qr.detener': detenerPrincipal,
    'qrDoc.iniciar': iniciarDoc,
    'qrDoc.detener': detenerDoc
  });

  window.App.alCerrarSesion(() => { detenerPrincipal(); detenerDoc(); });
})();
