/* Pantalla de acceso. La validación ocurre en el servidor (core.js -> Api.login). */
document.getElementById('login-section').innerHTML = `<img src="Imagen11.png" alt="Logo" class="logo-app">
        <h2>Acceso al Sistema</h2>
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <input type="text" id="user" placeholder="Usuario" autocomplete="username" maxlength="100">
            <input type="password" id="pass" placeholder="Contraseña" autocomplete="current-password" maxlength="200" data-enter="login">
            <button id="btnLogin" data-accion="login">Entrar</button>
        </div>
        <div id="login-mensaje" role="alert" style="color: red; font-weight: bold; margin-top: 10px;"></div>
    `;
