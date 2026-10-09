/* VALIDACIÓN Y FICHAS DOCUMENTALES (permiso: documental) */
(function () {
  'use strict';
  const { $, esc } = window.Utils;
  const { Api } = window;
  const App = window.App;

  let resultadosDoc = [];
  let registroSeleccionadoDoc = null;
  let listaDocumentalAcumulada = [];
  let buscando = false;

  const CAMPOS_FORM = ['docCaja', 'docFojas', 'docIne', 'docTipoIdentificacion', 'docActa',
                       'docCurpDoc', 'docComprobante', 'docAcuses', 'docObservaciones'];
  const TEXTO_INDICADOR = 'Ingrese las fojas y los documentos para verificar la coincidencia.';

  const host = document.getElementById('modulos-acordeon');
  if (host) host.insertAdjacentHTML('beforeend', `<!-- VALIDACIÓN Y FICHAS DOCUMENTALES -->
            <details id="acordeon-documental" class="modulo-acordeon">
                <summary>🗂️ VALIDACIÓN Y FICHAS DOCUMENTALES</summary>
                <div class="modulo-contenido">
                    <div id="panel-documental" class="sub-panel panel-documental" style="display:block;">
                        <h3 style="text-align: center;">Módulo de Validación y Fichas Documentales</h3>
                        <p style="text-align: center;">Busca un registro para complementar con datos físicos:</p>

                        <div class="controles-busqueda">
                            <input type="text" id="docValorBusqueda" placeholder="Valor a buscar..." maxlength="100">
                            <button type="button" id="btnEscanearDoc" data-accion="qrDoc.iniciar">📷 Escanear QR</button>

                            <div id="contenedor-escaner-doc" style="display: none; margin-top: 15px; max-width: 400px; border: 1px solid #ccc; padding: 10px; border-radius: 5px;">
                                <div id="reader-doc" style="width: 100%;"></div>
                                <button type="button" data-accion="qrDoc.detener" style="margin-top: 10px; padding: 8px 15px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">
                                    Cancelar / Detener Cámara
                                </button>
                            </div>
                            <select id="docColumnaBusqueda">
                                <option value="Nombre">Nombre</option>
                                <option value="CURP">CURP</option>
                                <option value="Folio">Folio</option>
                            </select>
                            <button id="btnBuscarDoc" data-accion="doc.buscar">Buscar Registro</button>
                        </div>

                        <div id="doc-contenedor-resultados"></div>

                        <div id="doc-formulario-detalles" style="display:none; margin-top:20px; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #b2dfdb;">
                            <h4 style="margin-top:0; color: #004d40;">Detalle Documental del Registro Seleccionado</h4>
                            <div class="grid-documental">
                                <div><label style="font-size:12px; font-weight:bold;">Número de Caja:</label>
                                    <input type="text" id="docCaja" placeholder="Ej. Caja 1" maxlength="50" style="width:100%;"></div>
                                <div><label style="font-size:12px; font-weight:bold;">Número de Fojas:</label>
                                    <input type="number" min="0" id="docFojas" placeholder="Total fojas" data-entrada="doc.validar" style="width:100%;"></div>
                                <div><label style="font-size:12px; font-weight:bold;">Cantidad de Identificaciones:</label>
                                    <input type="number" min="0" id="docIne" placeholder="0" data-entrada="doc.validar" style="width:100%;"></div>
                                <div><label style="font-size:12px; font-weight:bold;">Tipo de Identificación:</label>
                                    <input type="text" id="docTipoIdentificacion" placeholder="Ej. Credencial / Pasaporte" maxlength="80" style="width:100%;"></div>
                                <div><label style="font-size:12px; font-weight:bold;">Actas de Nacimiento:</label>
                                    <input type="number" min="0" id="docActa" placeholder="0" data-entrada="doc.validar" style="width:100%;"></div>
                                <div><label style="font-size:12px; font-weight:bold;">CURP (Cant. Docs):</label>
                                    <input type="number" min="0" id="docCurpDoc" placeholder="0" data-entrada="doc.validar" style="width:100%;"></div>
                                <div><label style="font-size:12px; font-weight:bold;">Comprobante:</label>
                                    <input type="number" min="0" id="docComprobante" placeholder="0" data-entrada="doc.validar" style="width:100%;"></div>
                                <div><label style="font-size:12px; font-weight:bold;">Cantidad de Acuses:</label>
                                    <input type="number" min="0" id="docAcuses" placeholder="0" data-entrada="doc.validar" style="width:100%;"></div>
                            </div>

                            <div style="margin-top: 15px;">
                                <label style="font-size:12px; font-weight:bold;">Observaciones:</label>
                                <textarea id="docObservaciones" placeholder="Observaciones adicionales..." rows="2" maxlength="500" style="width:100%; box-sizing:border-box;"></textarea>
                            </div>

                            <div id="indicador-coincidencia" style="margin-top: 15px; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; background: #eee; color: #555;">
                                ${TEXTO_INDICADOR}
                            </div>

                            <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                                <button class="btn-add" data-accion="doc.agregar">+ Agregar a Lista Documental</button>
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
                                <button class="btn-send-block" data-accion="doc.excel" style="background-color: #2e7d32; margin: 0; flex: 1;">📊 Generar y Descargar Reporte Excel</button>
                                <button class="btn-send-block" id="btnSyncDoc" data-accion="doc.sincronizar" style="background-color: #0288d1; margin: 0; flex: 1;">🚀 Sincronizar Datos al Servidor</button>
                                <button class="btn-send-block" data-accion="doc.limpiar" style="background-color: #d32f2f; margin: 0; flex: 1;">🧹 Limpiar Bloque</button>
                            </div>
                        </div>
                    </div>
                </div>
            </details>`);

  const folioDe = r => (r && (r.FOLIO || r.Folio)) || '';

  function resetIndicador() {
    const ind = $('indicador-coincidencia');
    ind.textContent = TEXTO_INDICADOR;
    ind.style.background = '#eee';
    ind.style.color = '#555';
  }

  async function buscar() {
    if (buscando) return;
    const valor = $('docValorBusqueda').value.trim();
    const columna = $('docColumnaBusqueda').value;
    const cont = $('doc-contenedor-resultados');
    if (!valor) return alert('Por favor ingresa un valor para buscar.');

    buscando = true;
    cont.innerHTML = '<p style="font-weight:bold; color: #555;">Consultando base de datos...</p>';
    $('doc-formulario-detalles').style.display = 'none';
    registroSeleccionadoDoc = null;
    resultadosDoc = [];

    try {
      const r = await Api.llamar('buscar', { columna, valor });
      if (!r.exito) { cont.innerHTML = `<p style="color:red; font-weight:bold;">${esc(r.error)}</p>`; return; }
      if (!r.resultados || r.resultados.length === 0) { cont.innerHTML = '<p style="color:orange; font-weight:bold;">Sin coincidencias.</p>'; return; }

      resultadosDoc = r.resultados;
      const filas = resultadosDoc.map((f, i) => `<tr>
                <td><button style="padding:5px 10px; background:#00796b;" data-accion="doc.seleccionar" data-idx="${i}">Seleccionar</button></td>
                <td><b>${esc(folioDe(f))}</b></td>
                <td>${esc(f.NOMBRE_COMPLETO)}</td>
                <td>${esc(f.CURP)}</td>
                <td>${esc(f.SARE)}</td>
                <td>${esc(f.MUNICIPIO)}</td>
                <td>${esc(f.ESTATUS)}</td>
            </tr>`).join('');
      const aviso = r.truncado ? `<p style="color:#b26a00;">Mostrando ${resultadosDoc.length} de ${r.total} coincidencias. Refina tu búsqueda.</p>` : '';
      cont.innerHTML = `${aviso}<div class="contenedor-tabla"><table style="background:white;"><thead><tr>
                <th>ACCIÓN</th><th>FOLIO</th><th>NOMBRE</th><th>CURP</th><th>SARE</th><th>MUNICIPIO</th><th>ESTATUS</th>
            </tr></thead><tbody>${filas}</tbody></table></div>`;
    } catch (e) {
      cont.innerHTML = '<p style="color:red; font-weight:bold;">Error de comunicación.</p>';
    } finally {
      buscando = false;
    }
  }

  function seleccionar(el) {
    const reg = resultadosDoc[Number(el.dataset.idx)];
    if (!reg) return;
    registroSeleccionadoDoc = reg;
    const form = $('doc-formulario-detalles');
    form.style.display = 'block';
    CAMPOS_FORM.forEach(id => { $(id).value = ''; });
    resetIndicador();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validarCoincidencia() {
    const n = id => parseInt($(id).value, 10) || 0;
    const fojas = n('docFojas');
    const suma = n('docIne') + n('docActa') + n('docCurpDoc') + n('docComprobante') + n('docAcuses');
    const ind = $('indicador-coincidencia');

    if ($('docFojas').value === '') {
      ind.textContent = 'Ingrese el número total de fojas.';
      ind.style.background = '#eee'; ind.style.color = '#555';
      return { coincide: false, suma };
    }
    if (fojas === suma) {
      ind.textContent = `¡Coincide perfectamente! Total de fojas (${fojas}) coincide con la suma de documentos (${suma}).`;
      ind.style.background = '#e8f5e9'; ind.style.color = '#2e7d32';
      return { coincide: true, suma };
    }
    ind.textContent = `No coincide: Las fojas indicadas son (${fojas}) pero la suma de documentos es (${suma}).`;
    ind.style.background = '#ffebee'; ind.style.color = '#c62828';
    return { coincide: false, suma };
  }

  function agregar() {
    if (!registroSeleccionadoDoc) return alert('Selecciona un registro primero.');
    const fojas = $('docFojas').value;
    if (!fojas) return alert('Por favor ingresa el número de fojas.');

    const folio = String(folioDe(registroSeleccionadoDoc)).trim().toUpperCase();
    if (listaDocumentalAcumulada.some(i => String(folioDe(i)).trim().toUpperCase() === folio)) {
      return alert('Este folio ya está en la lista documental.');
    }

    const v = validarCoincidencia();
    const val = id => $(id).value.trim();
    listaDocumentalAcumulada.push(Object.assign({}, registroSeleccionadoDoc, {
      caja: val('docCaja') || 'S/C',
      fojas: fojas,
      ine: val('docIne') || '0',
      tipoIdentificacion: val('docTipoIdentificacion') || 'N/A',
      acta: val('docActa') || '0',
      curpDoc: val('docCurpDoc') || '0',
      comprobante: val('docComprobante') || '0',
      acuses: val('docAcuses') || '0',
      observacionesDoc: val('docObservaciones'),
      coincide: v.coincide
    }));
    actualizarTabla();

    $('doc-formulario-detalles').style.display = 'none';
    $('doc-contenedor-resultados').innerHTML = '';
    $('docValorBusqueda').value = '';
    registroSeleccionadoDoc = null;
    resultadosDoc = [];
    alert('Registro agregado exitosamente a la lista documental.');
  }

  function limpiar() {
    if (listaDocumentalAcumulada.length === 0) return alert('La lista ya se encuentra vacía.');
    if (!confirm('¿Deseas limpiar todos los registros agregados en la lista documental?')) return;
    listaDocumentalAcumulada = [];
    actualizarTabla();
  }

  function actualizarTabla() {
    const area = $('area-lista-documental');
    const tbody = $('documental-body');
    $('contador-documental').textContent = listaDocumentalAcumulada.length;

    if (listaDocumentalAcumulada.length === 0) { area.style.display = 'none'; tbody.innerHTML = ''; return; }

    area.style.display = 'block';
    tbody.innerHTML = listaDocumentalAcumulada.map((it, i) => {
      const badge = it.coincide
        ? '<span class="status-badge status-badge-entregada">Coincide</span>'
        : '<span class="status-badge status-badge-sobrante">No Coincide</span>';
      return `<tr>
                <td><b>${esc(folioDe(it))}</b></td>
                <td>${esc(it.NOMBRE_COMPLETO)}</td>
                <td>${esc(it.CURP)}</td>
                <td>${esc(it.caja)}</td>
                <td>${esc(it.fojas)}</td>
                <td>${badge}</td>
                <td><button class="btn-del" data-accion="doc.quitar" data-idx="${i}">Quitar</button></td>
            </tr>`;
    }).join('');
  }

  function generarExcel() {
    if (listaDocumentalAcumulada.length === 0) return alert('La lista está vacía.');
    if (typeof XLSX === 'undefined') return alert('No se pudo cargar la librería de Excel. Revisa tu conexión.');
    if (!confirm('¿Deseas generar el reporte en Excel con todos los datos de la lista?')) return;

    const hoja1 = listaDocumentalAcumulada.map(it => ({
      Folio: folioDe(it), SARE: it.SARE || '', Municipio: it.MUNICIPIO || '', CCT: it.CCT || '',
      Escuela: it.ESCUELA || '', Id_Becario: it.ID_BECARIO || '', Nombre: it.NOMBRE || '',
      Apellido_Paterno: it.APELLIDO_PATERNO || '', Apellido_Materno: it.APELLIDO_MATERNO || '',
      Remesa: it.REMESA || '', Nivel: it.NIVEL || '', Bloque: it.BLOQUE || '',
      Mes_Remesa: it.MES_REMESA || '', CURP: it.CURP || '', Observaciones: it.OBSERVACIONES || '',
      Estatus: it.ESTATUS || '', Caja: it.caja, Fojas: it.fojas, Cantidad_INE: it.ine,
      Tipo_Identificacion: it.tipoIdentificacion, Acta: it.acta, CURP_Doc: it.curpDoc,
      Comprobante: it.comprobante, Cantidad_Acuses: it.acuses, Observaciones_Doc: it.observacionesDoc,
      Coincide_Fojas: it.coincide ? 'SI' : 'NO'
    }));

    const cajas = {};
    listaDocumentalAcumulada.forEach(it => {
      const caja = it.caja || 'S/C';
      if (!cajas[caja]) cajas[caja] = { total: 0, ccts: new Set() };
      cajas[caja].total++;
      cajas[caja].ccts.add(it.CCT || 'S/C');
    });
    const hoja2 = Object.keys(cajas).map(c => ({
      Caja: c, Total_Folios: cajas[c].total, Total_CCT: cajas[c].ccts.size, Lista_CCT: Array.from(cajas[c].ccts).join(', ')
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hoja1), 'Registros Documentales');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hoja2), 'Resumen por Caja');
    XLSX.writeFile(wb, 'Reporte_Documental_Sistema.xlsx');
  }

  async function sincronizar() {
    if (listaDocumentalAcumulada.length === 0) return alert('La lista está vacía.');
    if (!confirm(`¿Deseas sincronizar y actualizar la columna V para los ${listaDocumentalAcumulada.length} registros acumulados en el servidor?`)) return;

    const lote = listaDocumentalAcumulada.map(it => ({
      folio: folioDe(it),
      valoresCeldaV: `${it.caja}, ${it.fojas}, ${it.ine}, ${it.tipoIdentificacion}, ${it.acta}, ${it.curpDoc}, ${it.comprobante}, ${it.acuses}, ${it.observacionesDoc || 'Sin observaciones'}`
    }));

    const btn = $('btnSyncDoc');
    btn.disabled = true;
    try {
      const r = await Api.llamar('actualizar_lote_columna_v', { lote });
      if (r.exito) {
        let msg = `¡Sincronización documental exitosa! Se actualizaron ${r.exitosos} registros.`;
        if (r.noEncontrados && r.noEncontrados.length > 0) msg += `\n\nFolios no hallados en la base: ${r.noEncontrados.join(', ')}`;
        alert(msg);
      } else {
        alert('Error en la sincronización: ' + (r.error || 'Desconocido'));
      }
    } catch (e) {
      alert('Error de red al intentar sincronizar los datos documentales.');
    } finally {
      btn.disabled = false;
    }
  }

  /* Conservada del código original (no está enlazada a ningún botón): registro individual en columna V. */
  async function registrarValoresFojasCeldaV() {
    if (!registroSeleccionadoDoc) return alert('Selecciona un registro primero.');
    const fojas = $('docFojas').value;
    if (!fojas) return alert('Por favor ingresa al menos las fojas para formar la cadena.');
    const val = (id, d) => $(id).value.trim() || d;
    const cadena = `${val('docCaja', 'S/C')}, ${fojas}, ${val('docIne', '0')}, ${val('docTipoIdentificacion', 'N/A')}, ${val('docActa', '0')}, ${val('docCurpDoc', '0')}, ${val('docComprobante', '0')}, ${val('docAcuses', '0')}, ${val('docObservaciones', 'Sin observaciones')}`;
    const folio = folioDe(registroSeleccionadoDoc);
    if (!folio) return alert('El registro seleccionado no cuenta con un Folio válido para actualizar.');
    if (!confirm(`¿Deseas enviar la cadena de texto a la columna V para el folio ${folio}?\n\nCadena:\n${cadena}`)) return;
    try {
      const r = await Api.llamar('actualizar_columna_v', { folio, valoresCeldaV: cadena });
      if (r.exito) {
        alert('Valores registrados correctamente en la columna V.');
        $('doc-formulario-detalles').style.display = 'none';
        $('doc-contenedor-resultados').innerHTML = '';
        $('docValorBusqueda').value = '';
        registroSeleccionadoDoc = null;
      } else alert('Error al actualizar: ' + (r.error || 'Desconocido'));
    } catch (e) {
      alert('Error de red al intentar actualizar la columna V.');
    }
  }

  App.registrar({
    'doc.buscar': buscar,
    'doc.seleccionar': seleccionar,
    'doc.validar': validarCoincidencia,
    'doc.agregar': agregar,
    'doc.quitar': el => { listaDocumentalAcumulada.splice(Number(el.dataset.idx), 1); actualizarTabla(); },
    'doc.limpiar': limpiar,
    'doc.excel': generarExcel,
    'doc.sincronizar': sincronizar,
    'doc.registrarV': registrarValoresFojasCeldaV
  });

  App.hayPendientes(() => listaDocumentalAcumulada.length > 0);

  App.alCerrarSesion(() => {
    listaDocumentalAcumulada = [];
    registroSeleccionadoDoc = null;
    resultadosDoc = [];
    $('docValorBusqueda').value = '';
    $('docColumnaBusqueda').value = 'Nombre';
    $('doc-contenedor-resultados').innerHTML = '';
    $('doc-formulario-detalles').style.display = 'none';
    $('area-lista-documental').style.display = 'none';
    $('documental-body').innerHTML = '';
    $('contador-documental').textContent = '0';
    CAMPOS_FORM.forEach(id => { $(id).value = ''; });
    resetIndicador();
  });
})();
