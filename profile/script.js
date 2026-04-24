const API_BASE_URL = "https://api.rucoynexus.com";
const params = new URLSearchParams(window.location.search);

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
    const charList = document.getElementById('charList');
    const token = localStorage.getItem("userToken");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/get_profiles?token=${token}`);
        
        // Se o servidor retornar 401, o token expirou
        if (response.status === 401) {
            handleAuthError();
            return;
        }

        const result = await response.json(); // Declarei apenas UMA vez aqui

        if (result.status === "success") {
            const profiles = result.data;
            charList.innerHTML = ""; 

            if (profiles.length === 0) {
                charList.innerHTML = '<p style="text-align: center; color: #666; margin-top: 20px;">No characters found.</p>';
                return;
            }

            profiles.forEach(char => {
                const card = `
                <div class="char-card">
                    <span class="char-name">${char.name}</span>
                    <div class="char-actions-right">
                        <button class="btn-action btn-view" onclick="verPerfil('${char.name}')">
                            <img src="/res/icon/eye.png">
                        </button>
                        ${!char.is_automatic ? `
                        <button class="btn-action btn-edit" onclick="abrirEdicao('${char.name}', ${char.level}, ${char.defense}, ${char.melee}, ${char.distance}, ${char.magic})">
                            <img src="/res/icon/user-edit.png">
                        </button>` : ''}
                        <button class="btn-action btn-delete" onclick="deletarPerfil('${char.name}')">
                            <img src="/res/icon/trash.png">
                        </button>
                    </div>
                </div>`;
                charList.innerHTML += card;
            });
        }
    } catch (e) {
        console.error("Erro no fetch:", e);
        showToast("Erro de conexão com o servidor.", "error");
    }
}

function abrirEdicao(name, lv, def, melee, dist, mag) {
    document.getElementById('inputName').value = name;
    document.getElementById('inputName').disabled = true; 
    document.getElementById('inputLv').value = lv;
    document.getElementById('inputDef').value = def;
    document.getElementById('inputMelee').value = melee;
    // Garantindo que use os IDs corretos do seu HTML
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

    if (!charName) { showToast("Enter a name.", "error"); return; }

    btn.disabled = true;
    btn.innerText = "Saving...";

    const charData = {
    token: token,
    name: charName,
    lv: parseInt(document.getElementById('inputLv').value) || 0,
    def: parseInt(document.getElementById('inputDef').value) || 0,
    melee: parseInt(document.getElementById('inputMelee').value) || 0,
    distance: parseInt(document.getElementById('inputDist').value) || 0, 
    magic: parseInt(document.getElementById('inputMag').value) || 0
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

(function() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('platform') === 'app') {
        document.documentElement.classList.add('is-app');
        // Se o body já existir, aplica nele também
        if (document.body) {
            document.body.classList.add('is-app');
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                document.body.classList.add('is-app');
            });
        }
    }
})();

window.onload = carregarPerfis;