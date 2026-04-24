// 1. Pega o ID da URL
const urlParams = new URLSearchParams(window.location.search);
const charId = urlParams.get('id');

async function carregarDetalhes() {
    if (!charId) return;

    const response = await fetch(`https://api.rucoynexus.com/get_character_details?id=${charId}`);
    const result = await response.json();

    if (result.status === "success") {
        const p = result.data;
        
        // Agora você preenche a tela com os dados
        document.getElementById('charName').innerText = p.name;
        document.getElementById('charLevel').innerText = `Level: ${p.level}`;
        
        // Se for automático, mostra os dados extras
        if (p.is_automatic) {
            document.getElementById('charGold').innerText = p.gold;
            // Mostra os títulos, etc.
        }
    }
}