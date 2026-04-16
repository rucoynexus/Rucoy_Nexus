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
    const charName = document.getElementById('inputName').value;
    
    // Pequena validação antes de enviar
    if (!charName) {
        alert("Por favor, digite o nome do personagem.");
        return;
    }

    const charData = {
        email: "david@test.com", // Provisório para testes
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
            alert("Sucesso: " + result.message);
            closeModal();
            // A lista será atualizada automaticamente no futuro quando fizermos o GET
        } else {
            alert("Erro do Servidor: " + (result.message || "Falha ao salvar"));
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro: Não foi possível conectar ao servidor. Verifique se o CMD do Cloudflared e o Python estão ativos.");
    }
}

// Detecta modo App (AndLua+ IDE)
const params = new URLSearchParams(window.location.search);
if (params.get('platform') === 'app') { 
    document.body.classList.add('is-app'); 
}