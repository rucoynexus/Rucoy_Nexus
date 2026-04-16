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