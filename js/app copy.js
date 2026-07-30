/* =====================================================
   RACE INTELIGENTE LIVE - APP.JS
   Versão: v0.1 Alpha
   ===================================================== */

// ===============================
// Inicialização
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    inicializarBancoLocal();

    atualizarPainelLive();

});

// ===============================
// Banco Local (LocalStorage)
// ===============================

function inicializarBancoLocal() {

    if (!localStorage.getItem("ri_ligas")) {

        const ligas = [

            { nome: "Champions League", pais: "UEFA", nivel: 5 },
            { nome: "Conference League", pais: "UEFA", nivel: 4 },
            { nome: "Premier League", pais: "Inglaterra", nivel: 5 },
            { nome: "La Liga", pais: "Espanha", nivel: 5 },
            { nome: "Bundesliga", pais: "Alemanha", nivel: 5 },
            { nome: "Serie A", pais: "Itália", nivel: 5 },
            { nome: "Brasileirão Série A", pais: "Brasil", nivel: 5 }

        ];

        localStorage.setItem("ri_ligas", JSON.stringify(ligas));

    }

    if (!localStorage.getItem("ri_times")) {

        const times = [

            { nome: "Dinamo Zagreb", liga: "Champions League", forca: 5 },
            { nome: "Thun", liga: "Champions League", forca: 3 },
            { nome: "Club Brugge", liga: "Champions League", forca: 5 },
            { nome: "Athletic Bilbao", liga: "La Liga", forca: 5 }

        ];

        localStorage.setItem("ri_times", JSON.stringify(times));

    }

    if (!localStorage.getItem("ri_entradas")) {

        localStorage.setItem("ri_entradas", JSON.stringify([]));

    }

    if (!localStorage.getItem("ri_historico")) {

        localStorage.setItem("ri_historico", JSON.stringify([]));

    }

}

// ===============================
// Utilidades
// ===============================

function obterLigas() {

    return JSON.parse(localStorage.getItem("ri_ligas") || "[]");

}

function obterTimes() {

    return JSON.parse(localStorage.getItem("ri_times") || "[]");

}

function obterEntradas() {

    return JSON.parse(localStorage.getItem("ri_entradas") || "[]");

}

function salvarEntradas(lista) {

    localStorage.setItem("ri_entradas", JSON.stringify(lista));

}

function obterHistorico() {

    return JSON.parse(localStorage.getItem("ri_historico") || "[]");

}

function salvarHistorico(lista) {

    localStorage.setItem("ri_historico", JSON.stringify(lista));

}

// ===============================
// Painel LIVE
// ===============================

function atualizarPainelLive() {

    const entradas = obterEntradas();

    const statusEl = document.querySelector(".painel-item:nth-child(1) strong");
    const minutoEl = document.querySelector(".painel-item:nth-child(2) strong");
    const iqpEl = document.querySelector(".painel-item:nth-child(3) strong");
    const entradaEl = document.querySelector(".painel-item:nth-child(4) strong");

    if (!statusEl) return;

    if (entradas.length === 0) {

        statusEl.textContent = "Aguardando";
        minutoEl.textContent = "--";
        iqpEl.textContent = "--";
        entradaEl.textContent = "--";

        return;

    }

    const jogo = entradas[0];

    statusEl.textContent = "Próximo Jogo";
    minutoEl.textContent = jogo.minuto || "--";
    iqpEl.textContent = jogo.iqp || "--";
    entradaEl.textContent = jogo.classificacao || "--";

}

// ===============================
// Cadastro de Entrada
// ===============================

function adicionarEntrada(jogo) {

    const entradas = obterEntradas();

    jogo.id = Date.now().toString();

    entradas.push(jogo);

    salvarEntradas(entradas);

    atualizarPainelLive();

}

function removerEntrada(id) {

    const entradas = obterEntradas().filter(j => j.id !== id);

    salvarEntradas(entradas);

    atualizarPainelLive();

}

// ===============================
// Histórico
// ===============================

function adicionarHistorico(item) {

    const historico = obterHistorico();

    historico.unshift(item);

    salvarHistorico(historico);

}

// ===============================
// IQP (Versão Beta)
// ===============================

export function calcularIQP(dados) {
    let score = 0;

    // Necessidade Tática
    if (dados.precisaVencer) score += 20;

    // Posse
    if (dados.posse >= 65) score += 10;
    else if (dados.posse >= 55) score += 6;

    // Ataques perigosos
    if (dados.ataquesPerigosos >= 50) score += 20;
    else if (dados.ataquesPerigosos >= 35) score += 14;
    else if (dados.ataquesPerigosos >= 20) score += 8;

    // Finalizações
    if (dados.finalizacoes >= 12) score += 15;
    else if (dados.finalizacoes >= 8) score += 10;
    else if (dados.finalizacoes >= 5) score += 5;

    // Finalizações no alvo
    if (dados.noAlvo >= 6) score += 20;
    else if (dados.noAlvo >= 4) score += 14;
    else if (dados.noAlvo >= 2) score += 8;

    // Odd
    if (dados.odd >= 1.60 && dados.odd <= 2.20) score += 5;

    // Evento extraordinário
    if (dados.expulsaoAdversario) score += 10;

    // Penalização: pressão falsa (posse estéril)
    if (dados.posse >= 65 && Number(dados.noAlvo) === 0) {
        score -= 20;
    }

    // Trava entre 0 e 100
    const iqp = Math.max(0, Math.min(100, score));

    // 1. Classificação por Nível
    let classificacao = "NÃO ENTRAR";
    if (iqp >= 85) classificacao = "PREMIUM";
    else if (iqp >= 70) classificacao = "FORTE";
    else if (iqp >= 55) classificacao = "MODERADA";

    // 2. Sugestão Automática do Mercado Recomendado
    let apostaSugerida = "⚪ AGUARDAR / SEM ENTRADA";

    if (iqp >= 70) {
        if (Number(dados.noAlvo) >= 4 || Number(dados.finalizacoes) >= 10) {
            apostaSugerida = "⚽ OVER GOLS LIMITE";
        } else if (Number(dados.ataquesPerigosos) >= 45 || Number(dados.escanteios) >= 6) {
            apostaSugerida = "🚩 OVER ESCANTEIOS LIMITE";
        } else {
            apostaSugerida = "⚽/🚩 OVER GOLS OU CANTOS";
        }
    }

    return {
        iqp,
        classificacao,
        apostaSugerida
    };
}

// ===============================
// Classificação
// ===============================

function classificarEntrada(iqp) {

    if (iqp >= 85) {

        return "PREMIUM";

    }

    if (iqp >= 70) {

        return "FORTE";

    }

    if (iqp >= 55) {

        return "MODERADA";

    }

    return "NÃO ENTRAR";

}

// ===============================
// Funções Globais
// ===============================

window.RaceInteligente = {

    obterLigas,
    obterTimes,
    obterEntradas,
    salvarEntradas,
    adicionarEntrada,
    removerEntrada,

    obterHistorico,
    salvarHistorico,
    adicionarHistorico,

    calcularIQP,
    classificarEntrada,

    atualizarPainelLive

};



console.log("Race Inteligente LIVE inicializado.");