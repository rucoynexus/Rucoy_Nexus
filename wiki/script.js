let items = {};
let sprites = {};
let listaFiltrada = [];
let pagina = 0;
const POR_PAGINA = 60; 
let isLoading = false;

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
        "legendary": "rgb(239,255,0)"
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
            /* Diminuí o borrão (de 3px para 1px) e a intensidade */
            /*filter: drop-shadow(1px 1px 0px #000) drop-shadow(0px 0px 1px #000);*/
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

function abrirDetalhes(id) {
    const item = items[id];
    if (!item) return;

    const nome = item["Name: "] || item.name || "???";
    const raridade = (item["Rarity: "] || item.rarity || "").toLowerCase();
    const overlay = document.getElementById('details-overlay');
    const content = document.getElementById('details-content');
    
    let sprite = acharSprite(nome, item);
    let bg = getBackground(raridade);
    let f = sprite ? sprite.frame : null;

    let infoHtml = "";
    const ignorar = ["name", "Name: ", "rarity", "Rarity: ", "tags", "Tags"];

    for (let key in item) {
        if (ignorar.includes(key)) continue;
        let val = item[key];
        let label = key.charAt(0).toUpperCase() + key.slice(1).replace(": ", "");
        
        if (key.toLowerCase().includes("description")) {
            infoHtml += `
                <div class="info-row" style="flex-direction: column; align-items: flex-start;">
                    <span>${label}:</span>
                    <span class="description-text" style="width: 100%;">${val}</span>
                </div>`;
        } else {
            let corClasse = (typeof val === "number") ? (val > 0 ? "val-positive" : (val < 0 ? "val-negative" : "")) : "";
            infoHtml += `
                <div class="info-row">
                    <span>${label}:</span>
                    <span class="${corClasse}">${val}</span>
                </div>`;
        }
    }

    infoHtml += `<div class="info-row"><span>Rarity:</span><span style="${getNameStyle(raridade)} font-weight:bold;">${raridade.toUpperCase()}</span></div>`;

    content.innerHTML = `
        <div class="big-item-card" style="background-image:url('./${bg}')">
            ${f ? `<div class="big-sprite-wrap"><div class="sprite" style="width:${f.w}px;height:${f.h}px;background-image:url('./items.png');background-position:-${f.x}px -${f.y}px;"></div></div>` : ''}
        </div>
        <div class="details-title" style="${getNameStyle(raridade)}">${formatarNomeExibicao(nome)}</div>
        <div class="info-container">${infoHtml}</div>`;

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
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
        const [resItems, resSprites] = await Promise.all([fetch("./items.json"), fetch("./items_png.json")]);
        items = await resItems.json();
        let data = await resSprites.json();
        sprites = data.frames || {};
        aplicarFiltro();
    } catch (e) { console.error(e); }
}

document.getElementById("search").addEventListener("input", aplicarFiltro);
document.getElementById("rarityFilter").addEventListener("change", aplicarFiltro);
carregar();