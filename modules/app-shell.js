/* Estructura común. El contenedor #app-section existe en index.html. */
document.getElementById('app-section').innerHTML = `<img src="Imagen11.png" alt="Logo" class="logo-app">
        <img src="user___Imagen4t (5).gif" alt="saludo">
        <h2 id="saludo-usuario">Buscador de Registros</h2>

        <!-- CONSULTAS -->
        <div id="panel-busqueda">
            <h3> Módulo de Consulta</h3>
            <div class="controles-busqueda">
                <input type="text" id="valorBusqueda" placeholder="Valor a buscar...">
                <select id="columnaBusqueda">
                    <option value="Nombre">Nombre</option>
                    <option value="CURP">CURP</option>
                    <option value="Folio">Folio</option>
                </select>
                <button onclick="ejecutarBusqueda()">Buscar</button>
                <button type="button" onclick="iniciarEscanerQR()">📷 Escanear QR</button>
            </div>

            <!-- Contenedor de la cámara (oculto por defecto) -->
            <div id="lector-qr" style="width: 300px; display: none; margin-top: 15px;"></div>

            <div id="contenedor-resultados"></div>
        </div>

        <div id="modulos-acordeon" class="modulos-acordeon"></div>

        <button class="btn-logout" onclick="cerrarSesion()">Cerrar Sesión</button>`;
