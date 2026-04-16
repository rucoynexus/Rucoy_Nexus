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

// Formata o nome: Primeira letra maiúscula e após espaços
document.getElementById('inputName').addEventListener('input', function(e) {
    let val = e.target.value;
    e.target.value = val.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
});

// Endereço do seu túnel Cloudflare para o servidor Python
const API_BASE_URL = "https://api.rucoynexus.com";

async function salvarPersonagem() {
    const btn = document.querySelector('.btn-save'); // Pegando o botão
    const charName = document.getElementById('inputName').value;

    if (!charName) {
        showToast("Please enter a character name.", "error");
        return;
    }

    // Desativar o botão para evitar cliques duplos enquanto processa
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
            closeModal(); // Fecha a telinha na hora
        } else {
            showToast(result.message || "Server error.", "error");
        }
    } catch (error) {
        showToast("Server is currently unavailable. Please try again later.", "error");
    } finally {
        // Reativar o botão após terminar
        btn.disabled = false;
        btn.innerText = "SAVE PROFILE";
    }
}

// Função para criar um aviso bonito na tela (Toast)
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    toast.innerText = message;
    
    document.body.appendChild(toast);
    
    // Remove o aviso depois de 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Detecta modo App (AndLua+ IDE)
const params = new URLSearchParams(window.location.search);
if (params.get('platform') === 'app') { 
    document.body.classList.add('is-app'); 
}