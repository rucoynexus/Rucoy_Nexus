const API_BASE_URL = "https://api.rucoynexus.com";

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

// Formata o nome
document.getElementById('inputName').addEventListener('input', function(e) {
    let val = e.target.value;
    e.target.value = val.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
});

// FUNÇÃO PARA CARREGAR OS CARDS NA TELA
async function carregarPerfis() {
    const charList = document.getElementById('charList');
    const email = "david@test.com";

    try {
        const response = await fetch(`${API_BASE_URL}/get_profiles?email=${email}`);
        const result = await response.json();

        if (result.status === "success") {
            const profiles = result.data;
            charList.innerHTML = ""; // Limpa a lista

            let mCount = 0;
            let aCount = 0;

            if (profiles.length === 0) {
                charList.innerHTML = '<p id="no-chars" style="text-align: center; margin: 40px 0; color: #555;">No characters found.</p>';
            }

            profiles.forEach(char => {
                if(char.is_automatic) aCount++; else mCount++;
                
                // Layout do Card usando seus ícones (eye.png para stats)
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

            // Atualiza os limites na tela
            document.getElementById('manualLimit').innerText = `Manual: ${mCount}/10`;
            document.getElementById('autoLimit').innerText = `Automatic: ${aCount}`;
            
            // Esconde o botão de add se chegar no limite de 10 manuais
            document.getElementById('btnAddChar').style.display = mCount >= 10 ? 'none' : 'block';
        }
    } catch (e) {
        console.log("Error loading profiles");
    }
}

async function salvarPersonagem() {
    const btn = document.querySelector('.btn-save');
    const charName = document.getElementById('inputName').value;

    if (!charName) {
        showToast("Please enter a character name.", "error");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Saving...";

    const charData = {
        email: "david@test.com",
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
            carregarPerfis(); // Recarrega a lista após salvar
        } else {
            showToast(result.message || "Server error.", "error");
        }
    } catch (error) {
        showToast("Server is currently unavailable. Please try again later.", "error");
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

// Carrega a lista quando a página abre
window.onload = carregarPerfis;