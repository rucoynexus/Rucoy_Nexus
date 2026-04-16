const API_BASE_URL = "https://api.rucoynexus.com";

// PEGA O EMAIL DA PESSOA LOGADA NO MOMENTO
function getUserEmail() {
    try {
        // 1. Tenta pegar o objeto 'user' que a maioria dos scripts de login usa
        const userObj = localStorage.getItem("user");
        if (userObj) {
            const parsed = JSON.parse(userObj);
            // Se for um objeto {email: "..."} retorna o email, se for só o texto, retorna o texto
            return parsed.email || parsed;
        }

        // 2. Tenta pegar 'userEmail' ou 'userData' caso o nome seja outro
        const backupEmail = localStorage.getItem("userEmail") || localStorage.getItem("userData");
        if (backupEmail) return backupEmail.replace(/"/g, '');

    } catch (e) {
        console.error("Erro ao ler e-mail da sessão:", e);
    }
    return null; // Retorna null para forçar o erro de "Log in" se não achar nada
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
    const email = getUserEmail();

    if (!email) {
        showToast("Please log in to see your profiles.", "error");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/get_profiles?email=${email}`);
        const result = await response.json();

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
    const email = getUserEmail();

    if (!email) {
        showToast("Error: User session not found.", "error");
        return;
    }

    if (!charName) {
        showToast("Please enter a character name.", "error");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Saving...";

    const charData = {
        email: email, // AGORA ENVIA O EMAIL DE QUEM ESTÁ LOGADO
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