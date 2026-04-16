const API_BASE_URL = "https://api.rucoynexus.com";

// --- UTILITÁRIOS ---
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) { return null; }
}

function getUserEmail() {
    const token = localStorage.getItem("userToken");
    if (token) {
        const userData = parseJwt(token);
        return userData ? userData.email : null;
    }
    return null;
}

// --- FUNÇÕES DE INTERAÇÃO ---
function openModal() { 
    // Limpa os campos para um novo cadastro
    document.getElementById('inputName').value = '';
    document.getElementById('inputName').disabled = false;
    document.getElementById('inputLv').value = '';
    document.getElementById('inputDef').value = '';
    document.getElementById('inputMelee').value = '';
    document.getElementById('inputDist').value = '';
    document.getElementById('inputMag').value = '';
    
    document.getElementById('modal-char').style.display = 'flex'; 
}

function closeModal() { 
    document.getElementById('modal-char').style.display = 'none'; 
}

function toggleMenu() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    drawer.classList.toggle('active');
    overlay.style.display = drawer.classList.contains('active') ? 'block' : 'none';
}

// --- LÓGICA DE PERFIS ---
async function carregarPerfis() {
    const token = localStorage.getItem("userToken");
    if (!token) {
        window.location.href = "login.html"; // Redireciona se não houver token
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/get_profiles?token=${token}`);
        
        // Se o servidor retornar 401, o token expirou
        if (response.status === 401) {
            handleAuthError();
            return;
        }

        const result = await response.json();
        if (result.status === "success") {
            renderizarCards(result.data); // Chame sua função de renderizar aqui
        }
    } catch (e) {
        showToast("Erro de conexão com o servidor.", "error");
    }
}

// Função central para lidar com expiração
function handleAuthError() {
    showToast("Sessão expirada. Redirecionando para login...", "error");
    localStorage.removeItem("userToken"); 
    
    setTimeout(() => {
        // Redireciona para a pasta correta de login
        window.location.href = "https://rucoynexus.com/account/index.html"; 
    }, 2000);
}

function abrirEdicao(name, lv, def, melee, dist, mag) {
    document.getElementById('inputName').value = name;
    document.getElementById('inputName').disabled = true; 
    document.getElementById('inputLv').value = lv;
    document.getElementById('inputDef').value = def;
    document.getElementById('inputMelee').value = melee;
    document.getElementById('inputDist').value = dist;
    document.getElementById('inputMag').value = mag;
    document.getElementById('modal-char').style.display = 'flex';
}

async function deletarPerfil(name) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    
    const token = localStorage.getItem("userToken");
    showToast(`Deleting ${name}...`, "info");

    try {
        const response = await fetch(`${API_BASE_URL}/delete_profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token, name: name })
        });
        const result = await response.json();

        if (result.status === "success") {
            showToast(result.message, "success");
            carregarPerfis();
        } else {
            showToast(result.message, "error");
        }
    } catch (e) {
        showToast("Connection error.", "error");
    }
}

async function salvarPersonagem() {
    const btn = document.querySelector('.btn-save');
    const charName = document.getElementById('inputName').value;
    const token = localStorage.getItem("userToken");
    const email = getUserEmail(); 

    if (!charName) { showToast("Enter a name.", "error"); return; }

    btn.disabled = true;
    btn.innerText = "Saving...";

    const charData = {
        token: token,
        email: email,
        name: charName,
        lv: document.getElementById('inputLv').value || 0,
        def: document.getElementById('inputDef').value || 0,
        melee: document.getElementById('inputMelee').value || 0,
        dist: document.getElementById('inputDist').value || 0,
        mag: document.getElementById('inputMag').value || 0
    };

    try {
        const response = await fetch(`${API_BASE_URL}/save_manual_profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(charData)
        });
        const result = await response.json();

        if (response.ok && result.status === "success") {
            showToast(result.message, "success");
            closeModal();
            carregarPerfis(); 
        } else {
            showToast(result.message, "error");
        }
    } catch (error) {
        showToast("Server unavailable.", "error");
    } finally {
        btn.disabled = false;
        btn.innerText = "SAVE PROFILE";
    }
}

function verPerfil(name) {
    // Se o character.html estiver na mesma pasta que o index:
    window.location.href = `character.html?name=${name}`;
}

// --- NOTIFICAÇÕES (TOASTS BONITOS) ---
function showToast(message, type) {
    // Remove toasts antigos se houver muitos
    const activeToasts = document.querySelectorAll('.custom-toast');
    if (activeToasts.length > 2) activeToasts[0].remove();

    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}-toast`; // Usa as classes success-toast ou error-toast do seu CSS
    toast.innerText = message;
    
    document.body.appendChild(toast);

    // Animação e remoção
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 500);
    }, 3500);
}

window.onload = carregarPerfis;