/* REPORTE EXCEL (permiso: excel) */
(function () {
  'use strict';
  const { $ } = window.Utils;
  const { Api } = window;
  const App = window.App;
  const OPCION_INICIAL = '<option value="">-- Haz clic en actualizar primero --</option>';

  const host = document.getElementById('modulos-acordeon');
  if (host) host.insertAdjacentHTML('beforeend', `<!-- REPORTE EXCEL -->
            <details id="acordeon-excel" class="modulo-acordeon">
                <summary>📊 GENERAR REPORTE DE ENTREGAS</summary>
                <div class="modulo-contenido">
                    <div id="modulo-excel" style="padding: 20px; border: 1px solid #ccc; border-radius: 8px; max-width: 400px; margin: 0 auto; background-color: #f9f9f9; font-family: sans-serif;">
                        <h3 style="margin-top: 0; color: #333;">Generar Reporte de Entregas</h3>

                        <button id="btnCargarFechas" data-accion="excel.fechas" style="width: 100%; padding: 8px; margin-bottom: 15px; background-color: #34a853; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
                            🔄 Cargar / Actualizar Fechas
                        </button>

                        <label for="selectFechaExcel" style="font-weight: bold; font-size: 14px;">Selecciona la Fecha:</label>
                        <select id="selectFechaExcel" style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #aaa; border-radius: 4px;">
                            ${OPCION_INICIAL}
                        </select>

                        <button id="btnGenerarExcel" data-accion="excel.generar" style="width: 100%; padding: 10px; background-color: #1a73e8; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
                            Generar y Descargar Reporte
                        </button>
                    </div>
                </div>
            </details>`);

  async function cargarFechas() {
    const btn = $('btnCargarFechas');
    const select = $('selectFechaExcel');
    btn.textContent = '⏳ Buscando fechas...';
    btn.disabled = true;
    select.innerHTML = '<option value="">Cargando...</option>';

    try {
      const r = await Api.llamar('obtener_fechas_w');
      if (!r.exito) {
        alert('Error del servidor: ' + r.error);
        select.innerHTML = '<option value="">Error al cargar</option>';
      } else if (r.fechas && r.fechas.length > 0) {
        select.innerHTML = '<option value="">-- Selecciona una fecha --</option>';
        r.fechas.forEach(f => {
          const opt = document.createElement('option');
          opt.value = f; opt.textContent = f;
          select.appendChild(opt);
        });
      } else {
        select.innerHTML = '<option value="">No hay fechas disponibles</option>';
      }
    } catch (e) {
      alert('Error de comunicación al buscar fechas.');
      select.innerHTML = '<option value="">Error de conexión</option>';
    } finally {
      btn.textContent = '🔄 Cargar / Actualizar Fechas';
      btn.disabled = false;
    }
  }

  async function generar() {
    const fecha = $('selectFechaExcel').value;
    if (!fecha) return alert('⚠️ Por favor, selecciona una fecha primero.');
    if (typeof XLSX === 'undefined') return alert('No se pudo cargar la librería de Excel. Revisa tu conexión.');
    if (!confirm(`¿Estás seguro de que deseas generar el archivo Excel para la fecha: ${fecha}?`)) return;

    const btn = $('btnGenerarExcel');
    btn.textContent = '⏳ Generando archivo...';
    btn.disabled = true;
    try {
      const r = await Api.llamar('obtener_datos_excel', { fecha });
      if (!r.exito) alert('Error del servidor: ' + r.error);
      else if (r.datos && r.datos.length > 1) crearArchivoExcel(r.datos, fecha);
      else alert('No se encontraron registros para esta fecha.');
    } catch (e) {
      alert('Error de red al procesar el Excel.');
    } finally {
      btn.textContent = 'Generar y Descargar Reporte';
      btn.disabled = false;
    }
  }

  function crearArchivoExcel(datos, fecha) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datos);
    ws['!cols'] = [15, 25, 20, 20, 20, 20, 20, 20, 20, 20, 20, 15, 15].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `Reporte_Entregas_${fecha.replace(/\//g, '-')}.xlsx`);
  }

  App.registrar({ 'excel.fechas': cargarFechas, 'excel.generar': generar });

  App.alCerrarSesion(() => { $('selectFechaExcel').innerHTML = OPCION_INICIAL; });
})();
