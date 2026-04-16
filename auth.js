(async function() {
    const token = localStorage.getItem("userToken");
    const isLoginPage = window.location.pathname.includes('/account/');
    
    // Captura se estamos no modo app
    const params = new URLSearchParams(window.location.search);
    const isApp = params.get('platform') === 'app';
    const redirectUrl = isApp ? "/account/?platform=app" : "/account/";

    // 1. Checagem Instantânea (Existe o token?)
    if (!token && !isLoginPage) {
        window.location.href = redirectUrl;
        return;
    }

    // 2. Checagem de Autenticidade (O token ainda vale?)
    if (token && !isLoginPage) {
        try {
            // Chamamos a rota de perfis apenas para validar o token
            const response = await fetch(`https://api.rucoynexus.com/get_profiles?token=${token}`);
            
            // Se o servidor retornar 401, o Google invalidou o token por tempo
            if (response.status === 401) {
                console.warn("Sessão expirada detectada pelo servidor.");
                localStorage.removeItem("userToken");
                window.location.href = redirectUrl;
            }
        } catch (e) {
            // Se o servidor estiver fora do ar, não deslogamos o usuário por erro de conexão
            console.error("Erro ao validar token com o servidor:", e);
        }
    }
})();