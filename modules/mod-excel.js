/* REPORTE EXCEL - markup del módulo */
(function() {
  const host = document.getElementById('modulos-acordeon');
  if (!host) return;
  host.insertAdjacentHTML('beforeend', `<!-- REPORTE EXCEL -->
            <details id="acordeon-excel" class="modulo-acordeon">
                <summary>📊 GENERAR REPORTE DE ENTREGAS</summary>
                <div class="modulo-contenido">
                    <!-- CORRECCIÓN: "tyle" -> "style" y se quitó "flex-direction:" sin valor -->
                    <div id="modulo-excel" style="padding: 20px; border: 1px solid #ccc; border-radius: 8px; max-width: 400px; margin: 0 auto; background-color: #f9f9f9; font-family: sans-serif;">
                        <h3 style="margin-top: 0; color: #333;">Generar Reporte de Entregas</h3>

                        <button id="btnCargarFechas" onclick="cargarFechas()" style="width: 100%; padding: 8px; margin-bottom: 15px; background-color: #34a853; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
                            🔄 Cargar / Actualizar Fechas
                        </button>

                        <label for="selectFechaExcel" style="font-weight: bold; font-size: 14px;">Selecciona la Fecha:</label>
                        <select id="selectFechaExcel" style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #aaa; border-radius: 4px;">
                            <option value="">-- Haz clic en actualizar primero --</option>
                        </select>

                        <button id="btnGenerarExcel" onclick="confirmarYGenerarExcel()" style="width: 100%; padding: 10px; background-color: #1a73e8; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
                            Generar y Descargar Reporte
                        </button>
                    </div>
                </div>
            </details>`);
})();

        async function cargarFechas() {
            const btn = document.getElementById('btnCargarFechas');
            const select = document.getElementById('selectFechaExcel');

            btn.innerText = "⏳ Buscando fechas...";
            btn.disabled = true;
            select.innerHTML = '<option value="">Cargando...</option>';

            try {
                const respuesta = await enviarPeticion({ action: "obtener_fechas_w" });

                if (respuesta.error) {
                    alert("Error del servidor: " + respuesta.error);
                    select.innerHTML = '<option value="">Error al cargar</option>';
                } else if (respuesta.fechas && respuesta.fechas.length > 0) {
                    select.innerHTML = '<option value="">-- Selecciona una fecha --</option>';
                    respuesta.fechas.forEach(fecha => {
                        let opt = document.createElement('option');
                        opt.value = fecha;
                        opt.innerText = fecha;
                        select.appendChild(opt);
                    });
                } else {
                    select.innerHTML = '<option value="">No hay fechas disponibles</option>';
                }
            } catch (e) {
                alert("Error de comunicación al buscar fechas.");
                select.innerHTML = '<option value="">Error de conexión</option>';
            } finally {
                btn.innerText = "🔄 Cargar / Actualizar Fechas";
                btn.disabled = false;
            }
        }

        async function confirmarYGenerarExcel() {
            const fechaSeleccionada = document.getElementById('selectFechaExcel').value;

            if (!fechaSeleccionada) {
                return alert("⚠️ Por favor, selecciona una fecha primero.");
            }

            if (!confirm(`¿Estás seguro de que deseas generar el archivo Excel para la fecha: ${fechaSeleccionada}?`)) {
                return;
            }

            const btn = document.getElementById('btnGenerarExcel');
            btn.innerText = "⏳ Generando archivo...";
            btn.disabled = true;

            try {
                const respuesta = await enviarPeticion({
                    action: "obtener_datos_excel",
                    fecha: fechaSeleccionada
                });

                if (respuesta.error) {
                    alert("Error del servidor: " + respuesta.error);
                } else if (respuesta.datos && respuesta.datos.length > 1) {
                    crearArchivoExcel(respuesta.datos, fechaSeleccionada);
                } else {
                    alert("No se encontraron registros para esta fecha.");
                }
            } catch (e) {
                alert("Error de red al procesar el Excel.");
            } finally {
                btn.innerText = "Generar y Descargar Reporte"; // CORRECCIÓN: mismo texto original
                btn.disabled = false;
            }
        }

        function crearArchivoExcel(datos, fecha) {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(datos);

            worksheet['!cols'] = [
                {wch: 15}, {wch: 25}, {wch: 20}, {wch: 20},
                {wch: 20}, {wch: 20}, {wch: 20}, {wch: 20},
                {wch: 20}, {wch: 20}, {wch: 20}, {wch: 15}, {wch: 15}
            ];   // 13 columnas, igual que el reporte del backend

            XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

            const nombreArchivo = `Reporte_Entregas_${fecha.replace(/\//g, '-')}.xlsx`;
            XLSX.writeFile(workbook, nombreArchivo);
        }

Modulos.registrar({
    id: 'acordeon-excel',
    accion: 'obtener_datos_excel',
    reset() {
        document.getElementById('selectFechaExcel').innerHTML =
            '<option value="">-- Haz clic en actualizar primero --</option>';
    }
});
