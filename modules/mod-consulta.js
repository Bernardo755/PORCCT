/* CONSULTA ESTADOS - markup del módulo */
(function() {
  const host = document.getElementById('modulos-acordeon');
  if (!host) return;
  host.insertAdjacentHTML('beforeend', `<!-- CONSULTA ESTADOS -->
            <details id="acordeon-consulta" class="modulo-acordeon">
                <summary>🔎 CONSULTA ESTADOS</summary>
                <div class="modulo-contenido">
                    <div id="bloque-lanzador-consulta" class="bloque-lanzador-consulta">
                        <h2 class="titulo-lanzador-consulta">CONSULTA ESTADOS</h2>
                        <div class="contenedor-boton-consulta">
                            <button id="btnAbrirConsulta" class="btn-lanzador-consulta">
                                <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                                ABRIR BÚSQUEDA
                            </button>
                        </div>
                    </div>

                    <div id="modalConsulta" class="modal-overlay-consulta">
                        <div class="modal-container-consulta">
                            <div class="modal-header-consulta">
                                <span>Módulo de Consulta (tres niveles)</span>
                                <button id="btnCerrarConsulta" class="btn-cerrar-consulta">Cerrar ✖</button>
                            </div>
                            <iframe id="iframeConsulta" class="modal-iframe-consulta" src=""></iframe>
                        </div>
                    </div>
                </div>
            </details>`);
})();

Modulos.registrar({
  id: 'acordeon-consulta',
  accion: 'modulo_consulta',
  reset() { cerrarModalIframe('modalConsulta', 'iframeConsulta'); }
});
