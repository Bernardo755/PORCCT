/* DOCUMENTAL - markup del módulo */
(function() {
  const host = document.getElementById('modulos-acordeon');
  if (!host) return;
  host.insertAdjacentHTML('beforeend', `<!-- VALIDACIÓN Y FICHAS DOCUMENTALES -->
            <details id="acordeon-documental" class="modulo-acordeon">
                <summary>🗂️ VALIDACIÓN Y FICHAS DOCUMENTALES</summary>
                <div class="modulo-contenido">
                    <div id="panel-documental" class="sub-panel panel-documental" style="display:block;">
                        <h3 style="text-align: center;">Módulo de Validación y Fichas Documentales</h3>
                        <p style="text-align: center;">Busca un registro para complementar con datos físicos:</p>

                        <div class="controles-busqueda">
                            <input type="text" id="docValorBusqueda" placeholder="Valor a buscar...">
                            <button type="button" id="btnEscanearDoc" onclick="iniciarEscanerDoc()">📷 Escanear QR</button>

                            <div id="contenedor-escaner-doc" style="display: none; margin-top: 15px; max-width: 400px; border: 1px solid #ccc; padding: 10px; border-radius: 5px;">
                                <div id="reader-doc" style="width: 100%;"></div>
                                <button type="button" onclick="detenerEscanerDoc()" style="margin-top: 10px; padding: 8px 15px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">
                                    Cancelar / Detener Cámara
                                </button>
                            </div>
                            <select id="docColumnaBusqueda">
                                <option value="Nombre">Nombre</option>
                                <option value="CURP">CURP</option>
                                <option value="Folio">Folio</option>
                            </select>
                            <button onclick="ejecutarBusquedaDocumental()">Buscar Registro</button>
                        </div>

                        <div id="doc-contenedor-resultados"></div>

                        <div id="doc-formulario-detalles" style="display:none; margin-top:20px; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #b2dfdb;">
                            <h4 style="margin-top:0; color: #004d40;">Detalle Documental del Registro Seleccionado</h4>
                            <div class="grid-documental">
                                <div>
                                    <label style="font-size:12px; font-weight:bold;">Número de Caja:</label>
                                    <input type="text" id="docCaja" placeholder="Ej. Caja 1" style="width:100%;">
                                </div>
                                <div>
                                    <label style="font-size:12px; font-weight:bold;">Número de Fojas:</label>
                                    <input type="number" id="docFojas" placeholder="Total fojas" oninput="validarCoincidenciaFojas()" style="width:100%;">
                                </div>
                                <div>
                                    <label style="font-size:12px; font-weight:bold;">Cantidad de Identificaciones:</label>
                                    <input type="number" id="docIne" placeholder="0" oninput="validarCoincidenciaFojas()" style="width:100%;">
                                </div>
                                <div>
                                    <label style="font-size:12px; font-weight:bold;">Tipo de Identificación:</label>
                                    <input type="text" id="docTipoIdentificacion" placeholder="Ej. Credencial / Pasaporte" style="width:100%;">
                                </div>
                                <div>
                                    <label style="font-size:12px; font-weight:bold;">Actas de Nacimiento:</label>
                                    <input type="number" id="docActa" placeholder="0" oninput="validarCoincidenciaFojas()" style="width:100%;">
                                </div>
                                <div>
                                    <label style="font-size:12px; font-weight:bold;">CURP (Cant. Docs):</label>
                                    <input type="number" id="docCurpDoc" placeholder="0" oninput="validarCoincidenciaFojas()" style="width:100%;">
                                </div>
                                <div>
                                    <label style="font-size:12px; font-weight:bold;">Comprobante:</label>
                                    <input type="number" id="docComprobante" placeholder="0" oninput="validarCoincidenciaFojas()" style="width:100%;">
                                </div>
                                <div>
                                    <label style="font-size:12px; font-weight:bold;">Cantidad de Acuses:</label>
                                    <input type="number" id="docAcuses" placeholder="0" oninput="validarCoincidenciaFojas()" style="width:100%;">
                                </div>
                            </div>

                            <div style="margin-top: 15px;">
                                <label style="font-size:12px; font-weight:bold;">Observaciones:</label>
                                <textarea id="docObservaciones" placeholder="Observaciones adicionales..." rows="2" style="width:100%; box-sizing:border-box;"></textarea>
                            </div>

                            <div id="indicador-coincidencia" style="margin-top: 15px; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; background: #eee; color: #555;">
                                Ingrese las fojas y los documentos para verificar la coincidencia.
                            </div>

                            <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                                <button class="btn-add" onclick="agregarAListaDocumental()">+ Agregar a Lista Documental</button>
                            </div>
                        </div>

                        <div id="area-lista-documental" style="display:none; margin-top:25px;">
                            <h4 style="color: #004d40;">Registros Documentales Acumulados (<span id="contador-documental">0</span>):</h4>
                            <div class="contenedor-tabla">
                                <table style="background: white;">
                                    <thead>
                                        <tr style="background: #004d40; color:white;">
                                            <th>Folio</th><th>Nombre</th><th>CURP</th><th>Caja</th><th>Fojas</th><th>Estatus Coincidencia</th><th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody id="documental-body"></tbody>
                                </table>
                            </div>
                            <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                                <button class="btn-send-block" onclick="preguntarYGenerarExcel()" style="background-color: #2e7d32; margin: 0; flex: 1;">📊 Generar y Descargar Reporte Excel</button>
                                <button class="btn-send-block" onclick="sincronizarListaDocumentalServidor()" style="background-color: #0288d1; margin: 0; flex: 1;">🚀 Sincronizar Datos al Servidor</button>
                                <button class="btn-send-block" onclick="limpiarRegistrosDocumentalesAgregados()" style="background-color: #d32f2f; margin: 0; flex: 1;">🧹 Limpiar Bloque</button>
                            </div>
                        </div>
                    </div>
                </div>
            </details>`);
})();

        // Estado propio del módulo (antes vivía en core.js)
        let registroSeleccionadoDoc = null;
        let listaDocumentalAcumulada = [];
        let resultadosDocActuales = [];   // resultados de la última búsqueda (se seleccionan por índice)

        async function ejecutarBusquedaDocumental() {
            const valor = document.getElementById('docValorBusqueda').value.trim();
            const columna = document.getElementById('docColumnaBusqueda').value;
            const contenedor = document.getElementById('doc-contenedor-resultados');
            const formDetalles = document.getElementById('doc-formulario-detalles');

            if (!valor) return alert("Por favor ingresa un valor para buscar.");
            contenedor.innerHTML = '<p style="font-weight:bold; color: #555;">Consultando base de datos...</p>';
            formDetalles.style.display = 'none';
            registroSeleccionadoDoc = null;
            resultadosDocActuales = [];

            try {
                const resultados = await enviarPeticion({ action: "buscar", columna: columna, valor: valor });
                if (resultados && resultados.error) { contenedor.innerHTML = `<p style="color:red; font-weight:bold;">${escaparHTML(resultados.error)}</p>`; return; }
                if (!Array.isArray(resultados) || resultados.length === 0) { contenedor.innerHTML = '<p style="color:orange; font-weight:bold;">Sin coincidencias.</p>'; return; }

                resultadosDocActuales = resultados;
                let html = '';
                if (resultados.length >= LIMITE_RESULTADOS) {
                    html += `<p style="color:#b26a00; font-weight:bold;">Se muestran los primeros ${LIMITE_RESULTADOS} resultados. Refina la búsqueda para ver otros.</p>`;
                }
                html += `<div class="contenedor-tabla"><table style="background:white;"><thead><tr>
                            <th>ACCIÓN</th><th>FOLIO</th><th>NOMBRE</th><th>CURP</th><th>SARE</th><th>MUNICIPIO</th><th>ESTATUS</th>
                            </tr></thead><tbody>`;

                resultados.forEach((f, idx) => {
                    html += `<tr>
                                <td><button style="padding:5px 10px; background:#00796b;" onclick="seleccionarRegistroDocPorIndice(${idx})">Seleccionar</button></td>
                                <td><b>${escaparHTML(f.FOLIO || f.Folio || '')}</b></td>
                                <td>${escaparHTML(f.NOMBRE_COMPLETO)}</td>
                                <td>${escaparHTML(f.CURP)}</td>
                                <td>${escaparHTML(f.SARE)}</td>
                                <td>${escaparHTML(f.MUNICIPIO)}</td>
                                <td>${escaparHTML(f.ESTATUS)}</td>
                             </tr>`;
                });
                html += '</tbody></table></div>';
                contenedor.innerHTML = html;
            } catch (error) { contenedor.innerHTML = '<p style="color:red; font-weight:bold;">Error de comunicación.</p>'; }
        }

        function seleccionarRegistroDocPorIndice(indice) {
            const registro = resultadosDocActuales[indice];
            if (registro) seleccionarRegistroDoc(registro);
        }

        function seleccionarRegistroDoc(registro) {
            registroSeleccionadoDoc = registro;
            document.getElementById('doc-formulario-detalles').style.display = 'block';
            ['docCaja', 'docFojas', 'docIne', 'docTipoIdentificacion', 'docActa', 'docCurpDoc', 'docComprobante', 'docAcuses', 'docObservaciones']
                .forEach(id => document.getElementById(id).value = '');
            const ind = document.getElementById('indicador-coincidencia');
            ind.innerHTML = "Ingrese las fojas y los documentos para verificar la coincidencia.";
            ind.style.background = "#eee";
            ind.style.color = "#555";
            window.location.hash = "doc-formulario-detalles";
        }

        function validarCoincidenciaFojas() {
            const fojas = parseInt(document.getElementById('docFojas').value) || 0;
            const ine = parseInt(document.getElementById('docIne').value) || 0;
            const acta = parseInt(document.getElementById('docActa').value) || 0;
            const curpDoc = parseInt(document.getElementById('docCurpDoc').value) || 0;
            const comprobante = parseInt(document.getElementById('docComprobante').value) || 0;
            const acuse = parseInt(document.getElementById('docAcuses').value) || 0;

            const sumaDocs = ine + acta + curpDoc + comprobante + acuse;
            const indicador = document.getElementById('indicador-coincidencia');

            if (document.getElementById('docFojas').value === "") {
                indicador.innerHTML = "Ingrese el número total de fojas.";
                indicador.style.background = "#eee";
                indicador.style.color = "#555";
                return { coincide: false, suma: sumaDocs };
            }

            if (fojas === sumaDocs) {
                indicador.innerHTML = `¡Coincide perfectamente! Total de fojas (${fojas}) coincide con la suma de documentos (${sumaDocs}).`;
                indicador.style.background = "#e8f5e9";
                indicador.style.color = "#2e7d32";
                return { coincide: true, suma: sumaDocs };
            } else {
                indicador.innerHTML = `No coincide: Las fojas indicadas son (${fojas}) pero la suma de documentos es (${sumaDocs}).`;
                indicador.style.background = "#ffebee";
                indicador.style.color = "#c62828";
                return { coincide: false, suma: sumaDocs };
            }
        }

        function agregarAListaDocumental() {
            if (!registroSeleccionadoDoc) return alert("Selecciona un registro primero.");
            const fojasVal = document.getElementById('docFojas').value;
            if (!fojasVal) return alert("Por favor ingresa el número de fojas.");

            const folioNuevo = String(registroSeleccionadoDoc.FOLIO || registroSeleccionadoDoc.Folio || '').trim().toUpperCase();
            if (folioNuevo && listaDocumentalAcumulada.some(i => String(i.FOLIO || i.Folio || '').trim().toUpperCase() === folioNuevo)) {
                return alert("Este folio ya está en la lista documental. Quítalo primero si deseas capturarlo de nuevo.");
            }

            const validacion = validarCoincidenciaFojas();

            const itemCompleto = {
                ...registroSeleccionadoDoc,
                caja: document.getElementById('docCaja').value.trim() || "S/C",
                fojas: fojasVal,
                ine: document.getElementById('docIne').value.trim() || "0",
                tipoIdentificacion: document.getElementById('docTipoIdentificacion').value.trim() || "N/A",
                acta: document.getElementById('docActa').value.trim() || "0",
                curpDoc: document.getElementById('docCurpDoc').value.trim() || "0",
                comprobante: document.getElementById('docComprobante').value.trim() || "0",
                acuses: document.getElementById('docAcuses').value.trim() || "0",
                observacionesDoc: document.getElementById('docObservaciones').value.trim() || "",
                coincide: validacion.coincide
            };

            listaDocumentalAcumulada.push(itemCompleto);
            actualizarTablaListaDocumental();

            document.getElementById('doc-formulario-detalles').style.display = 'none';
            document.getElementById('doc-contenedor-resultados').innerHTML = '';
            document.getElementById('docValorBusqueda').value = '';
            registroSeleccionadoDoc = null;
            alert("Registro agregado exitosamente a la lista documental.");
        }

        function eliminarItemDocumental(index) {
            listaDocumentalAcumulada.splice(index, 1);
            actualizarTablaListaDocumental();
        }

        function limpiarRegistrosDocumentalesAgregados() {
            if (listaDocumentalAcumulada.length === 0) return alert("La lista ya se encuentra vacía.");
            if (!confirm("¿Deseas limpiar todos los registros agregados en la lista documental?")) return;
            listaDocumentalAcumulada = [];
            actualizarTablaListaDocumental();
        }

        function actualizarTablaListaDocumental() {
            const area = document.getElementById('area-lista-documental');
            const tbody = document.getElementById('documental-body');
            document.getElementById('contador-documental').innerText = listaDocumentalAcumulada.length;

            if (listaDocumentalAcumulada.length === 0) {
                area.style.display = 'none';
                tbody.innerHTML = '';
                return;
            }

            area.style.display = 'block';
            tbody.innerHTML = '';
            listaDocumentalAcumulada.forEach((item, index) => {
                const badgeEstatus = item.coincide
                    ? '<span class="status-badge status-badge-entregada">Coincide</span>'
                    : '<span class="status-badge status-badge-sobrante">No Coincide</span>';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><b>${escaparHTML(item.FOLIO || item.Folio || '')}</b></td>
                    <td>${escaparHTML(item.NOMBRE_COMPLETO)}</td>
                    <td>${escaparHTML(item.CURP)}</td>
                    <td>${escaparHTML(item.caja)}</td>
                    <td>${escaparHTML(item.fojas)}</td>
                    <td>${badgeEstatus}</td>
                    <td><button class="btn-del" onclick="eliminarItemDocumental(${index})">Quitar</button></td>
                `;
                tbody.appendChild(tr);
            });
        }

        function preguntarYGenerarExcel() {
            if (listaDocumentalAcumulada.length === 0) return alert("La lista está vacía.");
            if (!confirm("¿Deseas generar el reporte en Excel con todos los datos de la lista?")) return;

            let datosHoja1 = listaDocumentalAcumulada.map(item => ({
                Folio: item.FOLIO || item.Folio || '',
                SARE: item.SARE || '',
                Municipio: item.MUNICIPIO || '',
                CCT: item.CCT || '',
                Escuela: item.ESCUELA || '',
                Id_Becario: item.ID_BECARIO || '',
                Nombre: item.NOMBRE || '',
                Apellido_Paterno: item.APELLIDO_PATERNO || '',
                Apellido_Materno: item.APELLIDO_MATERNO || '',
                Remesa: item.REMESA || '',
                Nivel: item.NIVEL || '',
                Bloque: item.BLOQUE || '',
                Mes_Remesa: item.MES_REMESA || '',
                CURP: item.CURP || '',
                Observaciones: item.OBSERVACIONES || '',
                Estatus: item.ESTATUS || '',
                Caja: item.caja,
                Fojas: item.fojas,
                Cantidad_INE: item.ine,
                Tipo_Identificacion: item.tipoIdentificacion,
                Acta: item.acta,
                CURP_Doc: item.curpDoc,
                Comprobante: item.comprobante,
                Cantidad_Acuses: item.acuses,
                Observaciones_Doc: item.observacionesDoc,
                Coincide_Fojas: item.coincide ? "SI" : "NO"
            }));

            let agrupacionCajas = {};
            listaDocumentalAcumulada.forEach(item => {
                let cajaNom = item.caja || "S/C";
                let cctVal = item.CCT || "S/C";
                if (!agrupacionCajas[cajaNom]) {
                    agrupacionCajas[cajaNom] = { totalFolios: 0, cctsSet: new Set() };
                }
                agrupacionCajas[cajaNom].totalFolios++;
                agrupacionCajas[cajaNom].cctsSet.add(cctVal);
            });

            let datosHoja2 = Object.keys(agrupacionCajas).map(caja => {
                let info = agrupacionCajas[caja];
                return {
                    Caja: caja,
                    Total_Folios: info.totalFolios,
                    Total_CCT: info.cctsSet.size,
                    Lista_CCT: Array.from(info.cctsSet).join(", ")
                };
            });

            let wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datosHoja1), "Registros Documentales");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datosHoja2), "Resumen por Caja");
            XLSX.writeFile(wb, "Reporte_Documental_Sistema.xlsx");
        }

        async function sincronizarListaDocumentalServidor() {
            if (listaDocumentalAcumulada.length === 0) return alert("La lista está vacía.");
            if (!confirm(`¿Deseas sincronizar y actualizar la columna V para los ${listaDocumentalAcumulada.length} registros acumulados en el servidor?`)) return;

            let loteActualizacion = listaDocumentalAcumulada.map(item => {
                let folioBusq = item.FOLIO || item.Folio || '';
                let cadenaValores = `${item.caja}, ${item.fojas}, ${item.ine}, ${item.tipoIdentificacion}, ${item.acta}, ${item.curpDoc}, ${item.comprobante}, ${item.acuses}, ${item.observacionesDoc || "Sin observaciones"}`;
                return { folio: folioBusq, valoresCeldaV: cadenaValores };
            });

            try {
                const res = await enviarPeticion({
                    action: "actualizar_lote_columna_v",
                    lote: loteActualizacion
                });

                if (res.exito) {
                    let msg = `¡Sincronización documental exitosa! Se actualizaron ${res.exitosos} registros.`;
                    if (res.noEncontrados.length > 0) msg += `\n\nFolios no hallados en la base: ${res.noEncontrados.join(", ")}`;
                    alert(msg);
                } else {
                    alert("Error en la sincronización: " + (res.error || "Desconocido"));
                }
            } catch (error) {
                alert("Error de red al intentar sincronizar los datos documentales.");
            }
        }

/* El Enter en la búsqueda documental no debe enviar nada. */
const campoDocBusqueda = document.getElementById('docValorBusqueda');
if (campoDocBusqueda) campoDocBusqueda.addEventListener('keydown', e => {
    if (e.key === 'Enter') e.preventDefault();
});

Modulos.registrar({
    id: 'acordeon-documental',
    accion: 'actualizar_lote_columna_v',
    reset() {
        try { detenerEscanerDoc(); } catch (e) {}
        listaDocumentalAcumulada = [];
        registroSeleccionadoDoc = null;
        resultadosDocActuales = [];

        document.getElementById('docValorBusqueda').value = '';
        document.getElementById('docColumnaBusqueda').value = 'Nombre';
        document.getElementById('doc-contenedor-resultados').innerHTML = '';
        document.getElementById('doc-formulario-detalles').style.display = 'none';
        document.getElementById('area-lista-documental').style.display = 'none';
        document.getElementById('documental-body').innerHTML = '';
        document.getElementById('contador-documental').innerText = '0';

        ['docCaja', 'docFojas', 'docIne', 'docTipoIdentificacion',
         'docActa', 'docCurpDoc', 'docComprobante', 'docAcuses', 'docObservaciones'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        const indicador = document.getElementById('indicador-coincidencia');
        if (indicador) {
            indicador.innerText = 'Ingrese las fojas y los documentos para verificar la coincidencia.';
            indicador.style.background = '#eee';
            indicador.style.color = '#555';
        }
    }
});
