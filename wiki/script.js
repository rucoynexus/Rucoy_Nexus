let items = {};
let sprites = {};
let precosNexus = {}; 
let listaFiltrada = [];
let pagina = 0;
const POR_PAGINA = 60; 
let isLoading = false;
let meuGrafico = null;
const params = new URLSearchParams(window.location.search);
if (params.get('platform') === 'app') {
    document.body.classList.add('is-app');
}
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
        return `display: inline; background: linear-gradient(to bottom, #e75931, #ff9229, #ffbe00, #e7ff00); -webkit-background-clip: text; -webkit-text-fill-color: transparent;`;
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
    return `<div class="item-card" style="background-image:url('./${bg}')" onclick="abrirDetalhes('${id}')">${spriteHTML}<div class="item-name"><span style="${getNameStyle(raridade)}">${formatarNomeExibicao(nome)}</span></div></div>`;
}

function desenharGrafico(chave) {
    const chartArea = document.getElementById('chart-area');
    const info = precosNexus[chave];

    if (!info || !info.historico || info.historico.length === 0) {
        chartArea.style.display = 'none';
        return;
    }

    chartArea.style.display = 'block';
    const ctx = document.getElementById('graficoPreco').getContext('2d');

    if (meuGrafico) meuGrafico.destroy();

    const labels = info.historico.map(h => h.data);
    const valores = info.historico.map(h => h.preco);

    meuGrafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price',
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
                            const idx = items[0].dataIndex;
                            return "Obs: " + (info.historico[idx].obs || "No description");
                        }
                    }
                }
            }
        }
    });
}

// Função para definir a cor da data baseada no tempo passado
function getCorData(dataString) {
    if (!dataString) return "white";
    
    // Converte DD/MM/YY para um objeto Date do JS
    const partes = dataString.split('/');
    const dia = parseInt(partes[0]);
    const mes = parseInt(partes[1]) - 1; // Meses no JS começam em 0
    const ano = 2000 + parseInt(partes[2]);
    const dataUpdate = new Date(ano, mes, dia);
    const hoje = new Date();
    
    // Diferença em milissegundos convertida para dias
    const diffTempo = Math.abs(hoje - dataUpdate);
    const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24)) - 1;

    if (diffDias <= 0) return "#00ff41";    // Verde (Hoje)
    if (diffDias <= 7) return "#fbff00";    // Amarelo (Esta semana)
    if (diffDias <= 30) return "#ff9100";   // Laranja (Este mês)
    return "#ff3b3b";                       // Vermelho (+ de 1 mês)
}

function abrirDetalhes(id) {
    const item = items[id];
    if (!item) return;

    const nome = item["Name: "] || item.name || "???";
    const raridade = (item["Rarity: "] || item.rarity || "").toLowerCase();
    
    const chaveBusca = `${nome.toLowerCase().trim()}_${raridade.trim()}`;
    const dadosNexus = precosNexus[chaveBusca];

    const content = document.getElementById('details-content');
    let infoHtml = "";

    // --- SEÇÃO DE PREÇO ---
    // --- SEÇÃO DE PREÇO ---
    // --- SEÇÃO DE PREÇO ---
    if (Object.keys(precosNexus).length === 0) {
        // Se o objeto estiver vazio, significa que o fetch falhou ou o PC está desligado
        infoHtml += `
            <div class="info-row" style="justify-content: center; padding: 10px; background: rgba(255, 0, 0, 0.1); border-radius: 5px; border: 1px solid #ff3b3b; margin-bottom: 15px;">
                <span style="color: #ff3b3b; font-weight: bold; font-size: 13px;">⚠️ Server unavailable, please try again later.</span>
            </div>`;
    } else if (dadosNexus) {
        // Se o servidor estiver ON e o item existir no banco
        const corData = getCorData(dadosNexus.ultima_atualizacao);
        const precoFormatado = Number(dadosNexus.preco).toLocaleString('en-US');

        infoHtml += `
            <div class="info-row">
                <span>Current Price:</span>
                <span style="color: #FFD700; font-weight: bold;">${precoFormatado} Gold</span>
            </div>
            <div class="info-row">
                <span>Last Update:</span>
                <span style="color: ${corData}; font-weight: bold;">${dadosNexus.ultima_atualizacao}</span>
            </div>`;
    } else {
        // Se o servidor estiver ON mas esse item específico não tiver preço cadastrado
        infoHtml += `
            <div class="info-row">
                <span style="color: #aaa; font-style: italic;">No price data for this item.</span>
            </div>`;
    }

    // --- SEÇÃO DE ATRIBUTOS ---
    const ignorar = ["name", "Name: ", "rarity", "Rarity: ", "tags", "Tags"];
    for (let key in item) {
        if (ignorar.includes(key)) continue;
        
        let val = item[key];
        let label = key.replace(": ", "").charAt(0).toUpperCase() + key.replace(": ", "").slice(1);
        
        // Se for a descrição, usamos um estilo que respeita as quebras de linha (\n)
        if (label.toLowerCase().includes("description")) {
            infoHtml += `
                <div class="info-row" style="flex-direction: column; align-items: flex-start; border-bottom: 1px solid #333;">
                    <span style="margin-bottom: 5px; color: #aaa;">${label}:</span>
                    <span style="width: 100%; white-space: pre-line; text-align: left; color: #eee; font-size: 15px; line-height: 1.4;">${val}</span>
                </div>`;
        } else {
            // Se for número (stats), fica verde, se não (tipo de arma, etc), fica branco
            let corVal = (typeof val === "number") ? "#00ff41" : "#fff";
            infoHtml += `
                <div class="info-row">
                    <span>${label}:</span>
                    <span style="color: ${corVal};">${val}</span>
                </div>`;
        }
    }

    let sprite = acharSprite(nome, item);
    let f = sprite ? sprite.frame : null;
    let bg = getBackground(raridade);

    content.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; width: 100%;">
            <div class="big-item-card" style="background-image:url('./${bg}')">
                ${f ? `<div class="big-sprite-wrap"><div class="sprite" style="width:${f.w}px;height:${f.h}px;background-image:url('./items.png');background-position:-${f.x}px -${f.y}px;"></div></div>` : ''}
            </div>
            <div class="details-title" style="${getNameStyle(raridade)}">${formatarNomeExibicao(nome)}</div>
            <div class="info-container" style="width: 100%; max-width: 400px;">${infoHtml}</div>
        </div>`;

    document.getElementById('details-overlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';

    try {
        desenharGrafico(chaveBusca);
    } catch(e) {
        console.error("Erro no gráfico:", e);
    }
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
        // Agora o 'api.rucoynexus.com' aponta para o servidor unificado
        const apiURL = "https://api.rucoynexus.com/get_items"; 

        const [resItems, resSprites, resPrecos] = await Promise.all([
            fetch("./items.json"), 
            fetch("./items_png.json"),
            fetch(apiURL).catch(() => null) 
        ]);

        items = await resItems.json();
        let spriteData = await resSprites.json();
        sprites = spriteData.frames || {};

        if (resPrecos && resPrecos.ok) {
            const listaDaApi = await resPrecos.json();
            
            // CONVERSÃO IMPORTANTE:
            // O seu script espera que precosNexus seja um objeto { "item_raridade": {dados} }
            // A API manda uma lista [{nome, raridade, preco...}]. Vamos converter aqui:
            // CONVERSÃO CORRIGIDA:
            precosNexus = {};
            listaDaApi.forEach(item => {
                const chave = `${item.nome.toLowerCase().trim()}_${item.raridade.toLowerCase().trim()}`;
                
                // Aqui está o segredo: garantimos que o JS entenda 'preco' 
                // mesmo que o banco envie como 'preco_atual'
                precosNexus[chave] = {
                    ...item,
                    preco: item.preco_atual || item.preco || 0 
                };
            });

            console.log("✅ Dados da API carregados com sucesso!");
        } else {
            console.warn("⚠️ Não foi possível carregar os preços da API. O servidor no PC está ligado?");
        }

        aplicarFiltro();
    } catch (e) { 
        console.error("❌ Erro ao carregar arquivos:", e); 
    }
}

document.getElementById("search").addEventListener("input", aplicarFiltro);
document.getElementById("rarityFilter").addEventListener("change", aplicarFiltro);
carregar();