/* REGISTRO DE TRÁMITES - markup del módulo (permiso: tramites) */
(function() {
  const host = document.getElementById('modulos-acordeon');
  if (!host) return;
  host.insertAdjacentHTML('beforeend', `<!-- REGISTRO DE TRÁMITES -->
            <details id="acordeon-tramites" class="modulo-acordeon">
                <summary>📋 REGISTRO DE TRÁMITES</summary>
                <div class="modulo-contenido">
                    <div id="contenedor-boton" class="bloque-lanzador">
                        <h3 class="titulo-lanzador">REGISTRO DE TRÁMITES</h3>
                        <div class="contenedor-boton">
                            <button id="btnAbrirAppB" class="btn-lanzador">Registrar Trámites</button>
                        </div>
                    </div>

                    <div id="modalAppB" class="modal-overlay">
                        <div class="modal-container">
                            <div class="modal-header">
                                <span>Registro de Trámites</span>
                                <button id="btnCerrarAppB" class="btn-cerrar">Cerrar ✖</button>
                            </div>
                            <iframe id="iframeAppB" class="modal-iframe" title="Registro de Trámites" src="about:blank"
                                    sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals allow-popups"></iframe>
                        </div>
                    </div>
                </div>
            </details>`);
})();
