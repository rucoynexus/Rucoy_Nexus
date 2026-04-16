const API_BASE_URL = "https://api.rucoynexus.com";

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

function closeModal() { 
    document.getElementById('modal-char').style.display = 'none'; 
    document.getElementById('inputName').disabled = false; // Reativa o nome para novos cadastros
}

async function carregarPerfis() {
    const charList = document.getElementById('charList');
    const token = localStorage.getItem("userToken");

    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/get_profiles?token=${token}`);
        const result = await response.json();

        if (result.status === "success") {
            const profiles = result.data;
            charList.innerHTML = ""; 

            if (profiles.length === 0) {
                charList.innerHTML = '<p style="text-align: center; color: #666;">No characters found.</p>';
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
                        <button class="btn-action btn-edit" onclick="abrirEdicao('${char.name}', ${char.level}, ${char.def}, ${char.melee}, ${char.dist}, ${char.mag})">
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
        showToast("Error loading profiles.", "error");
    }
}

// Preenche o modal com os dados para editar
function abrirEdicao(name, lv, def, melee, dist, mag) {
    document.getElementById('inputName').value = name;
    document.getElementById('inputName').disabled = true; // Não permite mudar o nome ao editar
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
        showToast("Error connecting to server.", "error");
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