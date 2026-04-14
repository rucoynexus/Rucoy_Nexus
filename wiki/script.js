let items = {};
let sprites = {};
let precosNexus = {}; // NOVO: Armazena os preços e históricos
let listaFiltrada = [];
let pagina = 0;
const POR_PAGINA = 60; 
let isLoading = false;
let meuGrafico = null; // Para controlar a instância do gráfico

function toggleMenu() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    drawer.classList.toggle('active');
    overlay.style.display = drawer.classList.contains('active') ? 'block' : 'none';
}

function getRarityColor(r) {
    r = (r || "").toLowerCase();
    const colors = {
        "commun": "rgb(247,243,247)",
        "uncommun": "rgb(0,235,74)",
        "rare": "rgb(66,190,255)",
        "ultra rare": "rgb(230,117,247)",
        "legendary": "rgb(239,255,0)",
        "mythic": "#ff9229"
    };
    return colors[r] || "white";
}

function getBackground(r) {
    r = (r || "").toLowerCase().replace(" ", "-") || "commun";
    return r + "-background.png";
}

function getNameStyle(raridade) {
    raridade = (raridade || "").toLowerCase();
    if (raridade === "mythic") {
        return `
            display: inline;
            background: linear-gradient(to bottom, #e75931, #ff9229, #ffbe00, #e7ff00);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        `;
    }
    return `color: ${getRarityColor(raridade)};`;
}

function normalizar(nome) {
    return nome.toLowerCase().replace(/'/g, "").replace(/[^a-z0-9() ]/g, "").trim();
}

function acharSprite(nome, item) {
    let n = normalizar(nome);
    let raridade = (item["Rarity: "] || item.rarity || "").toLowerCase();

    if (n === "key ring") {
        const sufixos = { "commun": "1", "uncommun": "2", "rare": "3", "ultra rare": "4", "legendary": "5", "mythic": "6" };
        return sprites[`Key_Ring${sufixos[raridade] || "1"}.png`];
    }

    for (let key in sprites) {
        if (normalizar(key.replace(".png", "")) === n) return sprites[key];
    }
    for (let key in sprites) {
        let keyClean = normalizar(key.replace(".png", ""));
        if (keyClean.includes(n) || n.includes(keyClean)) return sprites[key];
    }
    return null;
}

function formatarNomeExibicao(nome) {
    return nome.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

function criarItemHTML(nome, item, id) {
    let raridade = item["Rarity: "] || item.rarity || "";
    let bg = getBackground(raridade);
    let sprite = acharSprite(nome, item);
    let spriteHTML = "";

    if (sprite) {
        let f = sprite.frame;
        spriteHTML = `<div class="sprite-wrap"><div class="sprite" style="width:${f.w}px;height:${f.h}px;background-image:url('./items.png');background-position:-${f.x}px -${f.y}px;"></div></div>`;
    }

    return `
        <div class="item-card" style="background-image:url('./${bg}')" onclick="abrirDetalhes('${id}')">
            ${spriteHTML}
            <div class="item-name">
                <span style="${getNameStyle(raridade)}">${formatarNomeExibicao(nome)}</span>
            </div>
        </div>`;
}

function desenharGrafico(chave) {
    const info = precosNexus[chave];
    if (!info || !info.historico || info.historico.length === 0) {
        document.querySelector('.chart-container').style.display = 'none';
        return;
    }

    document.querySelector('.chart-container').style.display = 'block';
    const ctx = document.getElementById('graficoPreco').getContext('2d');

    if (meuGrafico) meuGrafico.destroy();

    const labels = info.historico.map(h => h.data);
    const valores = info.historico.map(h => h.preco);

    meuGrafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price History',
                data: valores,
                borderColor: '#3CBCFC',
                backgroundColor: 'rgba(60, 188, 252, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { ticks: { color: '#aaa' }, grid: { color: '#333' } },
                x: { ticks: { color: '#aaa' }, grid: { display: false } }
            },
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        footer: (items) => {
                            return "Obs: " + info.historico[items[0].dataIndex].obs;
                        }
                    }
                }
            }
        }
    });
}

function abrirDetalhes(id) {
    const item = items[id];
    if (!item) return;

    const nome = item["Name: "] || item.name || "???";
    const raridade = (item["Rarity: "] || item.rarity || "").toLowerCase();
    const overlay = document.getElementById('details-overlay');
    const content = document.getElementById('details-content');
    
    // Adicionar preço atual se existir no precos_nexus.json
    const chaveNexus = `${nome.toLowerCase().strip()}_${raridade.toLowerCase().strip()}`.replace(/\s+/g, ' ').trim();
    // Nota: Usei uma versão simplificada da chave abaixo para garantir match
    const chaveBusca = `${nome.toLowerCase().trim()}_${raridade.trim()}`;
    const dadosNexus = precosNexus[chaveBusca];

    let infoHtml = "";
    if (dadosNexus) {
        infoHtml += `
            <div class="info-row">
                <span>Current Price:</span>
                <span class="val-positive">${dadosNexus.preco.toLocaleString()} Gold</span>
            </div>
            <div class="info-row">
                <span>Last Update:</span>
                <span>${dadosNexus.ultima_atualizacao}</span>
            </div>`;
    }

    const ignorar = ["name", "Name: ", "rarity", "Rarity: ", "tags", "Tags"];
    for (let key in item) {
        if (ignorar.includes(key)) continue;
        let val = item[key];
        let label = key.replace(": ", "").charAt(0).toUpperCase() + key.replace(": ", "").slice(1);
        
        infoHtml += `
            <div class="info-row">
                <span>${label}:</span>
                <span class="${typeof val === 'number' ? 'val-positive' : ''}">${val}</span>
            </div>`;
    }

    let sprite = acharSprite(nome, item);
    let f = sprite ? sprite.frame : null;
    let bg = getBackground(raridade);

    content.innerHTML = `
        <div class="big-item-card" style="background-image:url('./${bg}')">
            ${f ? `<div class="big-sprite-wrap"><div class="sprite" style="width:${f.w}px;height:${f.h}px;background-image:url('./items.png');background-position:-${f.x}px -${f.y}px;"></div></div>` : ''}
        </div>
        <div class="details-title" style="${getNameStyle(raridade)}">${formatarNomeExibicao(nome)}</div>
        <div class="info-container">${infoHtml}</div>`;

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Desenha o gráfico se houver dados
    desenharGrafico(chaveBusca);
}

function fecharDetalhes() {
    document.getElementById('details-overlay').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function aplicarFiltro() {
    let busca = document.getElementById("search").value.toLowerCase();
    let raridadeFiltro = document.getElementById("rarityFilter").value;
    listaFiltrada = [];

    for (let id in items) {
        let item = items[id];
        let nome = item["Name: "] || item.name || "???";
        let tags = (item["Tags"] || "").toLowerCase();
        let raridade = (item["Rarity: "] || item.rarity || "").toLowerCase();

        if (raridadeFiltro && raridade !== raridadeFiltro) continue;
        if (nome.toLowerCase().includes(busca) || tags.includes(busca)) {
            listaFiltrada.push({ nome, item, id }); 
        }
    }

    pagina = 0;
    document.getElementById("lista").innerHTML = "";
    carregarMais();
}

function carregarMais() {
    if (isLoading || pagina * POR_PAGINA >= listaFiltrada.length) return;
    isLoading = true;
    let container = document.getElementById("lista");
    let inicio = pagina * POR_PAGINA;
    let slice = listaFiltrada.slice(inicio, inicio + POR_PAGINA);

    let buffer = "";
    slice.forEach(e => buffer += criarItemHTML(e.nome, e.item, e.id));
    container.innerHTML += buffer;

    pagina++;
    isLoading = false;
}

window.addEventListener("scroll", () => {
    if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 400) carregarMais();
});

async function carregar() {
    try {
        const [resItems, resSprites, resPrecos] = await Promise.all([
            fetch("./items.json"), 
            fetch("./items_png.json"),
            fetch("./precos_nexus.json")
        ]);
        
        items = await resItems.json();
        let data = await resSprites.json();
        sprites = data.frames || {};
        
        // Carrega preços e históricos se o arquivo existir
        if (resPrecos.ok) {
            precosNexus = await resPrecos.json();
        }

        aplicarFiltro();
    } catch (e) { console.error(e); }
}

document.getElementById("search").addEventListener("input", aplicarFiltro);
document.getElementById("rarityFilter").addEventListener("change", aplicarFiltro);
carregar();