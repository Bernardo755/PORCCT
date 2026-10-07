/* Pantalla de acceso. La validación se ejecuta en core.js. */
document.getElementById('login-section').innerHTML = `<img src="Imagen11.png" alt="Logo" class="logo-app">
        <h2>Acceso al Sistema</h2>
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <input type="text" id="user" placeholder="Usuario">
            <input type="password" id="pass" placeholder="Contraseña">
            <button onclick="iniciarSesion()">Entrar</button>
        </div>
        <div id="login-mensaje" style="color: red; font-weight: bold; margin-top: 10px;"></div>
    `;
