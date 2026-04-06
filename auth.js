(function() {
    const token = localStorage.getItem("userToken");
    const isLoginPage = window.location.pathname.includes('/account/');

    // Se NÃO tem token e NÃO está na página de login, expulsa para o login imediatamente
    if (!token && !isLoginPage) {
        // Usamos o caminho absoluto para funcionar em qualquer subpasta
        window.location.href = "/account/";
    }
})();