(async function() {
    const token = localStorage.getItem("userToken");
    const isLoginPage = window.location.pathname.includes('/account/');
    
    // 1. Captura se estamos no modo app
    const params = new URLSearchParams(window.location.search);
    const isApp = params.get('platform') === 'app';
    const redirectUrl = isApp ? "/account/?platform=app" : "/account/";

    // Aplica a classe CSS globalmente se for app
    if (isApp) {
        document.documentElement.classList.add('is-app');
        // Garante que o body também receba a classe quando carregar
        window.addEventListener('DOMContentLoaded', () => {
            document.body.classList.add('is-app');
        });
    }

    // 2. Checagem Instantânea (Existe o token?)
    if (!token && !isLoginPage) {
        window.location.href = redirectUrl;
        return;
    }

    // 3. Checagem de Autenticidade (O token ainda vale?)
    if (token && !isLoginPage) {
        try {
            const response = await fetch(`https://api.rucoynexus.com/get_profiles?token=${token}`);
            
            if (response.status === 401) {
                console.warn("Sessão expirada detectada pelo servidor.");
                localStorage.removeItem("userToken");
                window.location.href = redirectUrl;
                return;
            }
        } catch (e) {
            console.error("Erro ao validar token com o servidor:", e);
        }
    }

    // 4. SISTEMA DE MANUTENÇÃO DO MODO APP (Propagação de Links)
    if (isApp) {
        document.addEventListener('click', function(e) {
            // Procura se o clique foi em um link (<a>)
            const target = e.target.closest('a'); 
            
            if (target && target.href && target.href.startsWith(window.location.origin)) {
                const url = new URL(target.href);
                
                // Se o link já não tiver o parâmetro, a gente adiciona
                if (!url.searchParams.has('platform')) {
                    e.preventDefault();
                    url.searchParams.set('platform', 'app');
                    window.location.href = url.href;
                }
            }
        });
    }
})();