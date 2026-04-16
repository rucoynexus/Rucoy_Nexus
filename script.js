// Função para decodificar o token do Google (JWT) 🔓
    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    // 1. DETECTA PLATAFORMA APP
    const params = new URLSearchParams(window.location.search);
    const isApp = params.get('platform') === 'app';
    
    if (isApp) {
        document.body.classList.add('is-app');
    }

    // 2. PROTEÇÃO DE ACESSO (COMENTADO PARA DESATIVAR) 🛡️
    /* const token = localStorage.getItem("userToken");
    
    if (!token && !window.location.pathname.includes('/account/')) {
        const loginUrl = isApp ? "/account/?platform=app" : "/account/";
        window.location.href = loginUrl;
    } else if (token) {
        // Se logado, extraímos os dados para mostrar na tela
        const userData = parseJwt(token);
        if (userData && userData.name) {
            const welcomeElement = document.getElementById('welcome-message');
            welcomeElement.innerHTML = `Olá, <strong>${userData.name}</strong>! 👋<br><span style="color: #bbb; font-size: 14px;">Logado como: ${userData.email}</span>`;
        }
    }
    */

    // 3. MENU DRAWER
    function toggleMenu() {
        const drawer = document.getElementById('drawer');
        const overlay = document.getElementById('overlay');
        drawer.classList.toggle('active');
        overlay.style.display = drawer.classList.contains('active') ? 'block' : 'none';
    }