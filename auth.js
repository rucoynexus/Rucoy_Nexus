(function() {
    const token = localStorage.getItem("userToken");
    const isLoginPage = window.location.pathname.includes('/account/');
    
    // Captura se estamos no modo app
    const params = new URLSearchParams(window.location.search);
    const isApp = params.get('platform') === 'app';

    // Se NÃO tem token e NÃO está na página de login, manda para o login
    if (!token && !isLoginPage) {
        // Se era app, mantém como app no redirecionamento para o login
        const redirectUrl = isApp ? "/account/?platform=app" : "/account/";
        window.location.href = redirectUrl;
    }
})();