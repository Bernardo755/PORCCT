/* CARGA DE NUEVAS TARJETAS - markup del módulo (permiso: tarjetas) */
(function() {
  const host = document.getElementById('modulos-acordeon');
  if (!host) return;
  host.insertAdjacentHTML('beforeend', `<!-- CARGA DE NUEVAS TARJETAS -->
            <details id="acordeon-tarjetas" class="modulo-acordeon">
                <summary>🚀 CARGA DE NUEVAS TARJETAS O ESTATUS</summary>
                <div class="modulo-contenido">
                    <div id="bloque-lanzador-tarjetas" class="bloque-lanzador-tarjetas">
                        <h2 class="titulo-lanzador-tarjetas">CARGA DE NUEVAS TARJETAS O ESTATUS</h2>
                        <div class="contenedor-boton-tarjetas">
                            <button id="btnAbrirCargaTarjetas" class="btn-lanzador-tarjetas">
                                🚀 ABRIR APP DE ACTUALIZACION
                            </button>
                        </div>
                    </div>

                    <div id="modalCargaTarjetas" class="modal-overlay-tarjetas">
                        <div class="modal-container-tarjetas">
                            <div class="modal-header-tarjetas">
                                <span>Carga de Nuevas Tarjetas o Estatus</span>
                                <button id="btnCerrarCargaTarjetas" class="btn-cerrar-tarjetas">Cerrar ✖</button>
                            </div>
                            <iframe id="iframeCargaTarjetas" class="modal-iframe-tarjetas" title="Carga de Nuevas Tarjetas" src="about:blank"
                                    sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals allow-popups"></iframe>
                        </div>
                    </div>
                </div>
            </details>`);
})();
