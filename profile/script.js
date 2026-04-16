const API_BASE_URL = "https://api.rucoynexus.com";

// PEGA O EMAIL DA PESSOA LOGADA NO MOMENTO
// Função para decodificar o token (igual a que você já usa no home)
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

// Pega o e-mail real de quem está logado agora
function getUserEmail() {
    const token = localStorage.getItem("userToken"); // Nome correto da sua chave!
    if (token) {
        const userData = parseJwt(token);
        return userData ? userData.email : null;
    }
    return null;
}

function toggleMenu() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    drawer.classList.toggle('active');
    overlay.style.display = drawer.classList.contains('active') ? 'block' : 'none';
}

function openModal() { 
    document.getElementById('modal-char').style.display = 'flex'; 
}

function closeModal() { 
    document.getElementById('modal-char').style.display = 'none'; 
}

// FUNÇÃO PARA CARREGAR OS CARDS DA PESSOA LOGADA
async function carregarPerfis() {
    const charList = document.getElementById('charList');
    const token = localStorage.getItem("userToken"); // Pega o token bruto

    if (!token) {
        showToast("Please log in.", "error");
        return;
    }

    try {
        // Enviamos o token na URL (ou no header, mas na URL é mais simples para GET)
        const response = await fetch(`${API_BASE_URL}/get_profiles?token=${token}`);
        const result = await response.json();
        
        // ... resto da lógica de exibir os cards ...

        if (result.status === "success") {
            const profiles = result.data;
            charList.innerHTML = ""; 

            let mCount = 0;
            let aCount = 0;

            if (profiles.length === 0) {
                charList.innerHTML = '<p id="no-chars" style="text-align: center; margin: 40px 0; color: #555;">No characters found.</p>';
            }

            profiles.forEach(char => {
                if(char.is_automatic) aCount++; else mCount++;
                
                const card = `
                <div class="char-card">
                    <div class="char-card-header">
                        <span class="name">${char.name}</span>
                        <span class="badge ${char.is_automatic ? 'auto' : 'manual'}">${char.is_automatic ? 'Auto' : 'Manual'}</span>
                    </div>
                    <div class="char-card-body">
                        <div class="lv-info">Level ${char.level}</div>
                        <div class="stats-row">
                            <span><img src="/res/icon/eye.png"> ${char.melee}</span>
                            <span><img src="/res/icon/eye.png"> ${char.dist}</span>
                            <span><img src="/res/icon/eye.png"> ${char.mag}</span>
                            <span><img src="/res/icon/eye.png"> ${char.def}</span>
                        </div>
                    </div>
                </div>`;
                charList.innerHTML += card;
            });

            document.getElementById('manualLimit').innerText = `Manual: ${mCount}/10`;
            document.getElementById('autoLimit').innerText = `Automatic: ${aCount}`;
            document.getElementById('btnAddChar').style.display = mCount >= 10 ? 'none' : 'block';
        }
    } catch (e) {
        showToast("Server currently unavailable.", "error");
    }
}

async function salvarPersonagem() {
    const btn = document.querySelector('.btn-save');
    const charName = document.getElementById('inputName').value;
    
    // Pegamos o TOKEN e o EMAIL
    const token = localStorage.getItem("userToken");
    const email = getUserEmail(); 

    if (!token || !email) {
        showToast("Error: User session not found. Please log in again.", "error");
        return;
    }

    if (!charName) {
        showToast("Please enter a character name.", "error");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Saving...";

    const charData = {
        token: token,  // ENVIA O TOKEN PARA VALIDAÇÃO
        email: email,  // ENVIA O EMAIL PARA CONFERÊNCIA
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
            // Se o token for inválido, o erro do Python aparecerá aqui
            showToast(result.message || "Server error.", "error");
        }
    } catch (error) {
        showToast("Server is currently unavailable.", "error");
    } finally {
        btn.disabled = false;
        btn.innerText = "SAVE PROFILE";
    }
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

window.onload = carregarPerfis;