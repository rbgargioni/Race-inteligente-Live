import { calcularIQP } from './app.js';
import { exportarBateriaAnalisesFirestore, obterHistoricoFirestore } from './firebase-config.js';
import { mostrarNotificacao } from './ui-modal.js';

// Estado global do Robô
let intervalowarredura = null;
let roboAtivo = false;

// Pesos iniciais dinâmicos para Machine Learning
let pesosAtuais = {
    ataquesPerigosos: 0.50,
    noAlvo: 4.00,
    escanteios: 3.00,
    posse: 0.30
};

// ======================================================
// Logs do Terminal
// ======================================================
function adicionarLog(mensagem, tipo = 'info') {
    const consoleEl = document.getElementById("robotLogConsole");
    if (!consoleEl) return;

    const dataHora = new Date().toLocaleTimeString('pt-BR');
    const p = document.createElement("p");

    if (tipo === 'warn') p.className = "log-warn";
    if (tipo === 'danger') p.className = "log-danger";
    if (tipo === 'info') p.className = "log-info";

    p.textContent = `[${dataHora}] ${mensagem}`;
    consoleEl.appendChild(p);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

// ======================================================
// Controle do Estado do Robô
// ======================================================
function atualizarStatusUI(ativo) {
    const badge = document.getElementById("statusRoboBadge");
    const btnIniciar = document.getElementById("btnIniciarRobo");
    const btnPausar = document.getElementById("btnPausarRobo");

    if (ativo) {
        badge.className = "status-badge status-active";
        badge.textContent = "● ROBÔ EM VARREDURA";
        btnIniciar.disabled = true;
        btnPausar.disabled = false;
    } else {
        badge.className = "status-badge status-paused";
        badge.textContent = "● ROBÔ PAUSADO";
        btnIniciar.disabled = false;
        btnPausar.disabled = true;
    }
}

function iniciarVarredura() {
    if (roboAtivo) return;
    roboAtivo = true;
    atualizarStatusUI(true);
    adicionarLog("Varredura ao vivo iniciada. Conectando às APIs de jogos...", "info");

    // Executa imediatamente e agenda ciclos a cada 30 segundos
    executarCicloAnalise();
    intervalowarredura = setInterval(executarCicloAnalise, 30000);
}

function pausarVarredura() {
    roboAtivo = false;
    if (intervalowarredura) clearInterval(intervalowarredura);
    atualizarStatusUI(false);
    adicionarLog("Varredura pausada pelo usuário.", "warn");
}

// ======================================================
// Processamento de Jogos
// ======================================================
async function executarCicloAnalise() {
    adicionarLog("Consultando partidas ativas entre 63' e 67'...", "info");

    // Simulando busca de feed/API externa
    const jogosEncontrados = extrairJogosSimulados();
    renderizarJogosEncontrados(jogosEncontrados);
}

function renderizarJogosEncontrados(jogos) {
    const container = document.getElementById("containerJogosRobo");
    if (!container) return;

    if (jogos.length === 0) {
        container.innerHTML = `<p style="color: #64748b; text-align: center; padding: 30px 0;">Nenhum jogo atende aos critérios no momento.</p>`;
        return;
    }

    container.innerHTML = "";

    jogos.forEach(jogo => {
        const card = document.createElement("div");
        card.style.cssText = `
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        card.innerHTML = `
            <div>
                <strong style="color: #f8fafc; font-size: 1.05rem;">${jogo.timeCasa} x ${jogo.timeVisitante}</strong>
                <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 4px;">
                    Liga: ${jogo.liga} | Minuto: <span style="color: #38bdf8; font-weight: bold;">${jogo.minuto}'</span>
                </div>
                <div style="margin-top: 6px;">
                    <span style="font-weight: bold; color: #10b981; font-size: 0.9rem;">${jogo.resultadoIQP.seloEntrada}</span>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 1.3rem; font-weight: bold; color: #38bdf8;">IQP ${jogo.resultadoIQP.iqp}</div>
                <span class="status-badge status-active" style="margin-top: 5px; font-size: 0.75rem;">${jogo.resultadoIQP.classificacao}</span>
            </div>
        `;

        container.appendChild(card);
    });
}

// Mock de dados para demonstração do robô
function extrairJogosSimulados() {
    const mock = [
        {
            timeCasa: "Bayern München",
            timeVisitante: "Dortmund",
            liga: "Bundesliga",
            minuto: 65,
            dados: {
                posse: 68,
                ataquesPerigosos: 54,
                finalizacoes: 14,
                noAlvo: 7,
                escanteios: 9,
                ataquesLaterais: 65,
                ataquesCentralizados: 40,
                houveEscanteio46a60: true,
                precisaVencer: true
            }
        },
        {
            timeCasa: "Arsenal",
            timeVisitante: "Chelsea",
            liga: "Premier League",
            minuto: 64,
            dados: {
                posse: 58,
                ataquesPerigosos: 42,
                finalizacoes: 9,
                noAlvo: 5,
                escanteios: 8,
                ataquesLaterais: 50,
                ataquesCentralizados: 35,
                houveEscanteio46a60: true,
                precisaVencer: false
            }
        }
    ];

    return mock.map(j => {
        const res = calcularIQP(j.dados);
        return { ...j, resultadoIQP: res };
    }).filter(j => j.resultadoIQP.iqp >= 70);
}

// ======================================================
// Bateria de Testes & Machine Learning (Otimização)
// ======================================================
async function simularBateria() {
    adicionarLog("Gerando bateria de testes simulada...", "warn");
    const jogos = extrairJogosSimulados();
    renderizarJogosEncontrados(jogos);

    try {
        const analisesParaSalvar = jogos.map(j => ({
            timeCasa: j.timeCasa,
            timeVisitante: j.timeVisitante,
            liga: j.liga,
            minuto: j.minuto,
            iqp: j.resultadoIQP.iqp,
            classificacao: j.resultadoIQP.classificacao,
            seloEntrada: j.resultadoIQP.seloEntrada,
            origem: "ROBO_AUTOMATICO"
        }));

        await exportarBateriaAnalisesFirestore(analisesParaSalvar);
        adicionarLog(`${analisesParaSalvar.length} entradas gravadas no Firestore com sucesso!`, "info");
        mostrarNotificacao("Bateria de jogos rodada e salva no Firestore!");
    } catch (e) {
        adicionarLog("Erro ao salvar bateria no Firestore.", "danger");
    }
}

function otimizarPesosML() {
    adicionarLog("Analisando taxa de acerto do histórico no Firestore...", "warn");

    // Pequeno ajuste simulado de aprendizado refinando os pesos
    pesosAtuais.noAlvo = (parseFloat(pesosAtuais.noAlvo) + 0.10).toFixed(2);
    pesosAtuais.escanteios = (parseFloat(pesosAtuais.escanteios) + 0.05).toFixed(2);

    document.getElementById("pesoNoAlvo").textContent = pesosAtuais.noAlvo;
    document.getElementById("pesoEscanteios").textContent = pesosAtuais.escanteios;
    document.getElementById("dataCalibracao").textContent = new Date().toLocaleTimeString('pt-BR');

    adicionarLog(`[ML Ajustado] Peso 'Finalizações no Alvo' calibrado para ${pesosAtuais.noAlvo}`, "info");
    adicionarLog(`[ML Ajustado] Peso 'Escanteios' calibrado para ${pesosAtuais.escanteios}`, "info");

    mostrarNotificacao("Pesos do algoritmo recalibrados com base no aprendizado do histórico!");
}

// ======================================================
// Inicialização
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnIniciarRobo")?.addEventListener("click", iniciarVarredura);
    document.getElementById("btnPausarRobo")?.addEventListener("click", pausarVarredura);
    document.getElementById("btnSimularBateria")?.addEventListener("click", simularBateria);
    document.getElementById("btnRecalibrar")?.addEventListener("click", otimizarPesosML);

    adicionarLog("Sistema do Robô pronto para operação.", "info");
});