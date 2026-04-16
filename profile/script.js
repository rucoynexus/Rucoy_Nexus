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

function salvarPersonagem() {
    // Pegando os valores dos inputs para futura integração
    const charData = {
        name: document.getElementById('inputName').value,
        lv: document.getElementById('inputLv').value,
        def: document.getElementById('inputDef').value,
        melee: document.getElementById('inputMelee').value,
        dist: document.getElementById('inputDist').value,
        mag: document.getElementById('inputMag').value
    };

    console.log("Dados capturados:", charData);
    alert("Enviando para o servidor do David para verificação...");
    closeModal();
}

// Detecta modo App
const params = new URLSearchParams(window.location.search);
if (params.get('platform') === 'app') { 
    document.body.classList.add('is-app'); 
}

// SUBSTITUA pelo seu endereço do Cloudflare (ex: https://api.rucoynexus.com)
const API_BASE_URL = "https://api.rucoynexus.com";

async function salvarPersonagem() {
    const charData = {
        email: "david@test.com", // Provisório
        name: document.getElementById('inputName').value,
        lv: document.getElementById('inputLv').value,
        def: document.getElementById('inputDef').value,
        melee: document.getElementById('inputMelee').value,
        dist: document.getElementById('inputDist').value,
        mag: document.getElementById('inputMag').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/save_manual_profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(charData)
        });

        // Verifica se a resposta foi ok antes de tentar ler o JSON
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erro desconhecido no servidor");
        }

        const result = await response.json();

        if (result.status === "success") {
            alert("Sucesso: " + result.message);
            closeModal();
            // Futuramente: atualizarLista();
        } else {
            alert("Erro: " + result.message);
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Não foi possível conectar ao servidor. Verifique se o Cloudflared está rodando no seu PC.");
    }
}