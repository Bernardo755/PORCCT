/* EDICIÓN - markup del módulo */
(function() {
  const host = document.getElementById('modulos-acordeon');
  if (!host) return;
  host.insertAdjacentHTML('beforeend', `<!-- EDICIÓN (CAPTURA POR BLOQUES) -->
            <details id="acordeon-edicion" class="modulo-acordeon">
                <summary>📝 EDICIÓN — CAPTURA POR BLOQUES</summary>
                <div class="modulo-contenido">
                    <div id="panel-edicion" class="sub-panel">
                        <h3 style="text-align: center;"> Módulo de Edición (Captura por Bloques)</h3>
                        <div class="form-edicion">
                            <label style="font-weight: bold;">Actividad a realizar</label>
                            <select id="actividadRealizar" onchange="cambiarOpcionesEstatus()">
                                <option value="">-- Selecciona una actividad --</option>
                                <option value="SOBRANTES">REGISTRO DE SOBRANTES</option>
                                <option value="ENTREGADAS">REGISTRO DE ENTREGADAS</option>
                            </select>

                            <div id="campos-edicion" style="display: none; flex-direction: column; gap: 15px; margin-top: 15px; background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px dashed #ccc;">
                                <h4 style="margin:0;">Agregar registro al bloque temporal:</h4>
                                <input type="text" id="editFolio" placeholder="Escribe o escanea el Folio">
                                <select id="editEstatus"></select>

                                <div id="kit-documental-wrapper">
                                    <span class="kit-documental-titulo">KIT DOCUMENTAL</span>
                                    <div class="kit-documental-opciones" role="radiogroup" aria-label="KIT DOCUMENTAL">
                                        <label>
                                            <input type="radio" name="kitDocumental" value="SI">
                                            <span>SÍ</span>
                                        </label>
                                        <label>
                                            <input type="radio" name="kitDocumental" value="NO">
                                            <span>NO</span>
                                        </label>
                                    </div>
                                    <p class="kit-documental-ayuda">Selecciona una opción para registros de entregadas.</p>
                                </div>

                                <textarea id="editObservaciones" placeholder="Observaciones (Opcional)" rows="2"></textarea>
                                <button class="btn-add" onclick="agregarAlBloqueLocal()">+ Agregar a la Lista</button>
                            </div>

                            <div id="area-lote-temporal" style="display:none; margin-top:20px;">
                                <h4 style="margin:0; color: #37474f;">Registros acumulados listos para enviar (<span id="contador-lote">0</span>):</h4>
                                <div class="contenedor-tabla">
                                    <table class="tabla-lote">
                                        <thead>
                                            <tr><th>Folio</th><th>Estatus a Asignar</th><th>KIT</th><th>Observaciones</th><th>Acción</th></tr>
                                        </thead>
                                        <tbody id="lote-body"></tbody>
                                    </table>
                                </div>
                                <button class="btn-send-block" id="btnEnviarBloque" onclick="enviarLoteAlServidor()">🚀 Enviar todo el Bloque</button>
                            </div>
                        </div>
                    </div>
                </div>
            </details>`);
})();

/* Lógica de captura por bloques */
function cambiarOpcionesEstatus() {
    const actividad = document.getElementById('actividadRealizar').value;
    const contenedorCampos = document.getElementById('campos-edicion');
    const selectorEstatus = document.getElementById('editEstatus');
    const kitWrapper = document.getElementById('kit-documental-wrapper');

    if (!actividad) {
        contenedorCampos.style.display = 'none';
        kitWrapper.style.display = 'none';
        // Solo se reinicia KIT cuando realmente se abandona el flujo.
        document.querySelectorAll('input[name="kitDocumental"]').forEach(r => r.checked = false);
        return;
    }

    contenedorCampos.style.display = 'flex';
    selectorEstatus.innerHTML = '';

    const opciones = (actividad === "SOBRANTES")
        ? ["SOBRANTE", "SOBRANTE CON OBSERVACIONES"]
        : ["ENTREGADA POR 1301", "ENTREGADA POR 1302", "ENTREGADA POR 1303", "ENTREGADA POR 1304",
           "ENTREGADA POR 1305", "ENTREGADA POR 1306", "ENTREGADA POR 1307",
           "ENVIADA A OTRO ESTADO", "ENVIADA A OTRA SARE"];

    opciones.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt;
        el.innerText = opt;
        selectorEstatus.appendChild(el);
    });

    if (actividad === "ENTREGADAS" && sareUsuarioActual) {
        const ultimos4 = String(sareUsuarioActual).trim().slice(-4);
        const coincidencia = Array.from(selectorEstatus.options)
            .find(o => o.value.slice(-4) === ultimos4);
        if (coincidencia) selectorEstatus.value = coincidencia.value;
    }

    const esEntregada = actividad === "ENTREGADAS";
    kitWrapper.style.display = esEntregada ? 'block' : 'none';

    // IMPORTANTE:
    // Si ya había seleccionado KIT, NO se borra al agregar otro registro.
    // La selección permanece activa durante toda la captura por bloques.
}

function obtenerKitSeleccionado() {
    const seleccionado = document.querySelector('input[name="kitDocumental"]:checked');
    return seleccionado ? seleccionado.value : "";
}

function agregarAlBloqueLocal() {
    const folioInput = document.getElementById('editFolio');
    const estatusInput = document.getElementById('editEstatus');
    const obsInput = document.getElementById('editObservaciones');
    const actividad = document.getElementById('actividadRealizar').value;
    const folio = folioInput.value.trim();

    if (!folio) return alert("Por favor ingresa o escanea un folio.");
    if (!actividad) return alert("Selecciona una actividad.");
    if (loteTemporal.some(item => item.folio === folio)) {
        return alert("Este folio ya está en la lista de espera.");
    }

    let kit = "";
    let textoKit = "";

    if (actividad === "ENTREGADAS") {
        kit = obtenerKitSeleccionado();

        if (!kit) {
            return alert("Selecciona SI o NO en KIT DOCUMENTAL antes de agregar el primer registro.");
        }

        textoKit = kit === "SI"
            ? "CON KIT DOCUMENTAL EN SARE"
            : "SIN KIT DOCUMENTAL EN SARE";
    }

    const textoBase = obsInput.value.trim();
    const fechaActual = new Date().toLocaleDateString('es-MX');

    let observacionesConFecha =
        textoBase !== "" ? `${textoBase} ${fechaActual}` : fechaActual;

    if (textoKit) observacionesConFecha += ` ${textoKit}`;

    loteTemporal.push({
        folio,
        estatus: estatusInput.value,
        observaciones: observacionesConFecha,
        fecha: fechaActual,
        kitDocumental: kit
    });

    // Se limpia únicamente el folio y las observaciones.
    // KIT permanece seleccionado para el siguiente registro.
    folioInput.value = "";
    obsInput.value = "";
    folioInput.focus();

    actualizarTablaInterfazLote();
}

function eliminarDelBloqueLocal(index) {
    loteTemporal.splice(index, 1);
    actualizarTablaInterfazLote();
}

function actualizarTablaInterfazLote() {
    const area = document.getElementById('area-lote-temporal');
    const tbody = document.getElementById('lote-body');
    document.getElementById('contador-lote').innerText = loteTemporal.length;

    if (loteTemporal.length === 0) {
        area.style.display = 'none';
        tbody.innerHTML = '';
        return;
    }

    area.style.display = 'block';
    tbody.innerHTML = '';

    loteTemporal.forEach((item, index) => {
        const kitTexto = item.kitDocumental
            ? (item.kitDocumental === "SI" ? "SÍ" : "NO")
            : "—";

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${escaparHTML(item.folio)}</b></td>
            <td>${escaparHTML(item.estatus)}</td>
            <td>${kitTexto}</td>
            <td><span style="color:#666;font-style:italic;">${escaparHTML(item.observaciones) || 'Sin observaciones'}</span></td>
            <td><button class="btn-del" onclick="eliminarDelBloqueLocal(${index})">Quitar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

async function enviarLoteAlServidor() {
    if (loteTemporal.length === 0) return;

    const btn = document.getElementById('btnEnviarBloque');

    if (!confirm(`¿Deseas sincronizar este bloque de ${loteTemporal.length} registros?`)) {
        return;
    }

    btn.innerText = "Procesando matriz...";
    btn.disabled = true;

    try {
        const res = await enviarPeticion({
            action: "actualizar_lote",
            lote: loteTemporal
        });

        if (res.exito) {

            let msg = `¡Éxito total! Se actualizaron ${res.exitosos} registros.`;

            if (res.noEncontrados.length > 0) {
                msg += `\n\nFolios no hallados en la base: ${res.noEncontrados.join(", ")}`;
            }

            alert(msg);

            // Limpiar únicamente el lote enviado
            loteTemporal = [];
            actualizarTablaInterfazLote();

            // =====================================================
            // KIT NO SE REINICIA.
            // La selección actual de KIT permanece durante la sesión.
            // =====================================================

        } else {
            alert("Error: " + res.error);
        }

    } catch (e) {

        alert("Error de red o timeout.");

    } finally {

        btn.innerText = "🚀 Enviar todo el Bloque";
        btn.disabled = false;
    }
}
