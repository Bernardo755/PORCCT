/* Escáneres QR */
let html5QrCode;
let html5QrCodeDoc = null;

        function iniciarEscanerQR() {
            const contenedorLector = document.getElementById('lector-qr');
            contenedorLector.style.display = 'block';

            if (!html5QrCode) {
                html5QrCode = new Html5Qrcode("lector-qr");
            }

            html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (textoDecodificado) => {
                    document.getElementById('valorBusqueda').value = textoDecodificado.substring(0, 18);
                    detenerEscaner();
                },
                () => { /* ignorar errores de lectura frame por frame */ }
            ).catch((err) => {
                console.error("Error al iniciar la cámara:", err);
                alert("No se pudo acceder a la cámara. Verifica los permisos del navegador.");
                contenedorLector.style.display = 'none';   // no dejar el visor vacío a la vista
            });
        }

        function detenerEscaner() {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                    document.getElementById('lector-qr').style.display = 'none';
                }).catch((err) => {
                    console.error("Error al detener el escáner", err);
                });
            }
        }

        function iniciarEscanerDoc() {
            const contenedorEscaner = document.getElementById('contenedor-escaner-doc');
            contenedorEscaner.style.display = 'block';
            if (!html5QrCodeDoc) {
                html5QrCodeDoc = new Html5Qrcode("reader-doc");
            }
            html5QrCodeDoc.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    let textoLimpio = decodedText.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+/g, ' ').trim();
                    document.getElementById('docValorBusqueda').value = textoLimpio.substring(0, 18);
                    detenerEscanerDoc();
                },
                () => { /* ignorar errores continuos */ }
            ).catch((err) => {
                alert("Error al iniciar la cámara. Asegúrate de dar los permisos correspondientes.");
                console.error(err);
                contenedorEscaner.style.display = 'none';
            });
        }

        function detenerEscanerDoc() {
            if (html5QrCodeDoc && html5QrCodeDoc.isScanning) {
                html5QrCodeDoc.stop().then(() => {
                    document.getElementById('contenedor-escaner-doc').style.display = 'none';
                }).catch((err) => {
                    console.error("Error al detener el escáner: ", err);
                });
            } else {
                document.getElementById('contenedor-escaner-doc').style.display = 'none';
            }
        }
