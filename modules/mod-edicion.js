/* EDICIÓN — CAPTURA POR BLOQUES (permiso: edicion) */
(function () {
  'use strict';
  const { $, esc, fechaLocal } = window.Utils;
  const { Api } = window;
  const App = window.App;

  let loteTemporal = [];

  const host = document.getElementById('modulos-acordeon');
  if (host) host.insertAdjacentHTML('beforeend', `<!-- EDICIÓN (CAPTURA POR BLOQUES) -->
            <details id="acordeon-edicion" class="modulo-acordeon">
                <summary>📝 EDICIÓN — CAPTURA POR BLOQUES</summary>
                <div class="modulo-contenido">
                    <div id="panel-edicion" class="sub-panel">
                        <h3 style="text-align: center;"> Módulo de Edición (Captura por Bloques)</h3>
                        <div class="form-edicion">
                            <label style="font-weight: bold;">Actividad a realizar</label>
                            <select id="actividadRealizar" data-cambio="edicion.actividad">
                                <option value="">-- Selecciona una actividad --</option>
                                <option value="SOBRANTES">REGISTRO DE SOBRANTES</option>
                                <option value="ENTREGADAS">REGISTRO DE ENTREGADAS</option>
                            </select>

                            <div id="campos-edicion" style="display: none; flex-direction: column; gap: 15px; margin-top: 15px; background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px dashed #ccc;">
                                <h4 style="margin:0;">Agregar registro al bloque temporal:</h4>
                                <input type="text" id="editFolio" placeholder="Escribe o escanea el Folio" maxlength="50">
                                <select id="editEstatus"></select>

                                <div id="kit-documental-wrapper">
                                    <span class="kit-documental-titulo">KIT DOCUMENTAL</span>
                                    <div class="kit-documental-opciones" role="radiogroup" aria-label="KIT DOCUMENTAL">
                                        <label><input type="radio" name="kitDocumental" value="SI"><span>SÍ</span></label>
                                        <label><input type="radio" name="kitDocumental" value="NO"><span>NO</span></label>
                                    </div>
                                    <p class="kit-documental-ayuda">Selecciona una opción para registros de entregadas.</p>
                                </div>

                                <textarea id="editObservaciones" placeholder="Observaciones (Opcional)" rows="2" maxlength="300"></textarea>
                                <button class="btn-add" data-accion="edicion.agregar">+ Agregar a la Lista</button>
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
                                <button class="btn-send-block" id="btnEnviarBloque" data-accion="edicion.enviar">🚀 Enviar todo el Bloque</button>
                            </div>
                        </div>
                    </div>
                </div>
            </details>`);

  function cambiarOpcionesEstatus() {
    const actividad = $('actividadRealizar').value;
    const campos = $('campos-edicion');
    const selector = $('editEstatus');
    const kitWrapper = $('kit-documental-wrapper');

    if (!actividad) {
      campos.style.display = 'none';
      kitWrapper.style.display = 'none';
      document.querySelectorAll('input[name="kitDocumental"]').forEach(r => r.checked = false);
      return;
    }

    campos.style.display = 'flex';
    selector.innerHTML = '';

    const opciones = (actividad === 'SOBRANTES')
      ? ['SOBRANTE', 'SOBRANTE CON OBSERVACIONES']
      : ['ENTREGADA POR 1301', 'ENTREGADA POR 1302', 'ENTREGADA POR 1303', 'ENTREGADA POR 1304',
         'ENTREGADA POR 1305', 'ENTREGADA POR 1306', 'ENTREGADA POR 1307',
         'ENVIADA A OTRO ESTADO', 'ENVIADA A OTRA SARE'];

    opciones.forEach(opt => {
      const el = document.createElement('option');
      el.value = opt; el.textContent = opt;
      selector.appendChild(el);
    });

    if (actividad === 'ENTREGADAS' && Api.sesion.sare) {
      const ultimos4 = String(Api.sesion.sare).trim().slice(-4);
      const coincidencia = Array.from(selector.options).find(o => o.value.slice(-4) === ultimos4);
      if (coincidencia) selector.value = coincidencia.value;
    }

    // El KIT elegido se conserva mientras se capturan varios folios.
    kitWrapper.style.display = actividad === 'ENTREGADAS' ? 'block' : 'none';
  }

  function obtenerKitSeleccionado() {
    const s = document.querySelector('input[name="kitDocumental"]:checked');
    return s ? s.value : '';
  }

  function agregarAlBloqueLocal() {
    const folioInput = $('editFolio');
    const obsInput = $('editObservaciones');
    const actividad = $('actividadRealizar').value;
    const folio = folioInput.value.trim();

    if (!folio) return alert('Por favor ingresa o escanea un folio.');
    if (!actividad) return alert('Selecciona una actividad.');
    if (loteTemporal.some(i => i.folio.toUpperCase() === folio.toUpperCase())) {
      return alert('Este folio ya está en la lista de espera.');
    }

    let kit = '';
    let textoKit = '';
    if (actividad === 'ENTREGADAS') {
      kit = obtenerKitSeleccionado();
      if (!kit) return alert('Selecciona SI o NO en KIT DOCUMENTAL antes de agregar el primer registro.');
      textoKit = kit === 'SI' ? 'CON KIT DOCUMENTAL EN SARE' : 'SIN KIT DOCUMENTAL EN SARE';
    }

    const fecha = fechaLocal();
    const base = obsInput.value.trim();
    let observaciones = base !== '' ? `${base} ${fecha}` : fecha;
    if (textoKit) observaciones += ` ${textoKit}`;

    loteTemporal.push({ folio, estatus: $('editEstatus').value, observaciones, kitDocumental: kit });

    folioInput.value = '';
    obsInput.value = '';
    folioInput.focus();
    actualizarTabla();
  }

  function actualizarTabla() {
    const area = $('area-lote-temporal');
    const tbody = $('lote-body');
    $('contador-lote').textContent = loteTemporal.length;

    if (loteTemporal.length === 0) { area.style.display = 'none'; tbody.innerHTML = ''; return; }

    area.style.display = 'block';
    tbody.innerHTML = loteTemporal.map((item, i) => `<tr>
            <td><b>${esc(item.folio)}</b></td>
            <td>${esc(item.estatus)}</td>
            <td>${item.kitDocumental ? (item.kitDocumental === 'SI' ? 'SÍ' : 'NO') : '—'}</td>
            <td><span style="color:#666;font-style:italic;">${esc(item.observaciones) || 'Sin observaciones'}</span></td>
            <td><button class="btn-del" data-accion="edicion.quitar" data-idx="${i}">Quitar</button></td>
        </tr>`).join('');
  }

  async function enviarLote() {
    if (loteTemporal.length === 0) return;
    const btn = $('btnEnviarBloque');
    if (!confirm(`¿Deseas sincronizar este bloque de ${loteTemporal.length} registros?`)) return;

    btn.textContent = 'Procesando matriz...';
    btn.disabled = true;
    try {
      const res = await Api.llamar('actualizar_lote', {
        lote: loteTemporal.map(i => ({ folio: i.folio, estatus: i.estatus, observaciones: i.observaciones }))
      });
      if (res.exito) {
        let msg = `¡Éxito total! Se actualizaron ${res.exitosos} registros.`;
        if (res.noEncontrados && res.noEncontrados.length > 0) {
          msg += `\n\nFolios no hallados en la base: ${res.noEncontrados.join(', ')}`;
        }
        alert(msg);
        loteTemporal = [];          // el KIT seleccionado NO se reinicia
        actualizarTabla();
      } else {
        alert('Error: ' + res.error);
      }
    } catch (e) {
      alert('Error de red o timeout. Verifica si el bloque se aplicó antes de reenviarlo.');
    } finally {
      btn.textContent = '🚀 Enviar todo el Bloque';
      btn.disabled = false;
    }
  }

  App.registrar({
    'edicion.actividad': cambiarOpcionesEstatus,
    'edicion.agregar': agregarAlBloqueLocal,
    'edicion.quitar': el => { loteTemporal.splice(Number(el.dataset.idx), 1); actualizarTabla(); },
    'edicion.enviar': enviarLote
  });

  App.hayPendientes(() => loteTemporal.length > 0);

  App.alCerrarSesion(() => {
    loteTemporal = [];
    $('actividadRealizar').value = '';
    $('editFolio').value = '';
    $('editEstatus').innerHTML = '';
    $('editObservaciones').value = '';
    $('campos-edicion').style.display = 'none';
    $('kit-documental-wrapper').style.display = 'none';
    document.querySelectorAll('input[name="kitDocumental"]').forEach(r => r.checked = false);
    $('area-lote-temporal').style.display = 'none';
    $('lote-body').innerHTML = '';
    $('contador-lote').textContent = '0';
  });
})();
