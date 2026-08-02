import { mostrarNotificacao, mostrarConfirmacao } from './ui-modal.js';
import { 
    adicionarLigaFirestore, 
    obterLigasFirestore, 
    removerLigaFirestore,
    adicionarTimeFirestore,
    obterTimesFirestore,
    removerTimeFirestore,
    adicionarTimesEmMassaFirestore
} from './firebase-config.js';

// Variaveis globais de controle de seleção e expansão
let timeSelecionadoAtual = null;
let ligaSelecionadaAtual = null;

let ligasExpandidas = false;
let timesExpandidos = false;

const LIMITE_INICIAL = 3; // Número de itens mostrados antes de expandir

// ======================================================
// Renderização das Ligas (Lista Limpa + Botão Expandir + Modal)
// ======================================================

async function carregarLigasEGrid() {
    const lista = document.getElementById("listaLigas");
    const select = document.getElementById("ligaTime");

    if (!lista || !select) return;

    lista.innerHTML = "Carregando ligas do Firestore...";
    select.innerHTML = "";

    try {
        const ligas = await obterLigasFirestore();

        if (!ligas || ligas.length === 0) {
            lista.innerHTML = "<p style='color:#94a3b8'>Nenhuma liga cadastrada no Firestore.</p>";
            return;
        }

        // Ordenar alfabeticamente
        ligas.sort((a, b) => a.nome.localeCompare(b.nome));

        lista.innerHTML = "";

        // Preencher o <select> de times
        ligas.forEach((liga) => {
            const option = document.createElement("option");
            option.value = liga.nome;
            option.textContent = liga.nome;
            select.appendChild(option);
        });

        // Determina quantas ligas serão exibidas na tela
        const ligasExibidas = ligasExpandidas ? ligas : ligas.slice(0, LIMITE_INICIAL);

        const containerLista = document.createElement("div");
        containerLista.style.display = "flex";
        containerLista.style.flexDirection = "column";
        containerLista.style.gap = "8px";

        ligasExibidas.forEach((liga) => {
            const item = criarItemLinha(liga.nome, liga.pais ? `País: ${liga.pais}` : '', () => abrirModalDetalhesLiga(liga));
            containerLista.appendChild(item);
        });

        lista.appendChild(containerLista);

        // Adicionar Botão Expandir / Recolher se houver mais que LIMITE_INICIAL
        if (ligas.length > LIMITE_INICIAL) {
            const btnExpandir = criarBotaoExpandir(
                ligasExpandidas, 
                ligas.length - LIMITE_INICIAL, 
                () => {
                    ligasExpandidas = !ligasExpandidas;
                    carregarLigasEGrid();
                }
            );
            lista.appendChild(btnExpandir);
        }

    } catch (e) {
        console.error("Erro ao carregar ligas:", e);
        lista.innerHTML = "<p style='color:#ef4444'>Erro ao carregar ligas do banco.</p>";
    }
}

// ======================================================
// Renderização dos Times (Lista Limpa + Botão Expandir + Modal)
// ======================================================

async function carregarTimesGrid() {
    const lista = document.getElementById("listaTimes");
    if (!lista) return;

    lista.innerHTML = "Carregando times do Firestore...";

    try {
        const times = await obterTimesFirestore();

        if (!times || times.length === 0) {
            lista.innerHTML = "<p style='color:#94a3b8'>Nenhum time cadastrado no Firestore.</p>";
            return;
        }

        times.sort((a, b) => a.nome.localeCompare(b.nome));

        lista.innerHTML = "";

        const timesExibidos = timesExpandidos ? times : times.slice(0, LIMITE_INICIAL);

        const containerLista = document.createElement("div");
        containerLista.style.display = "flex";
        containerLista.style.flexDirection = "column";
        containerLista.style.gap = "8px";

        timesExibidos.forEach((time) => {
            const item = criarItemLinha(time.nome, time.liga ? `(${time.liga})` : '', () => abrirModalDetalhesTime(time));
            containerLista.appendChild(item);
        });

        lista.appendChild(containerLista);

        // Adicionar Botão Expandir / Recolher se houver mais que LIMITE_INICIAL
        if (times.length > LIMITE_INICIAL) {
            const btnExpandir = criarBotaoExpandir(
                timesExpandidos, 
                times.length - LIMITE_INICIAL, 
                () => {
                    timesExpandidos = !timesExpandidos;
                    carregarTimesGrid();
                }
            );
            lista.appendChild(btnExpandir);
        }

    } catch (e) {
        console.error("Erro ao carregar times:", e);
        lista.innerHTML = "<p style='color:#ef4444'>Erro ao carregar times do banco.</p>";
    }
}

// ======================================================
// Helpers de Interface (Componentes de Reuso)
// ======================================================

function criarItemLinha(titulo, subtitulo, onClick) {
    const item = document.createElement("div");
    item.className = "item-linha-clicavel";
    item.style.cssText = `
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s ease;
    `;

    item.onmouseover = () => item.style.borderColor = "#3b82f6";
    item.onmouseout = () => item.style.borderColor = "#334155";

    item.innerHTML = `
        <div>
            <strong style="color: #f8fafc; font-size: 0.98rem;">${titulo}</strong>
            ${subtitulo ? `<span style="color: #94a3b8; font-size: 0.85rem; margin-left: 10px;">${subtitulo}</span>` : ''}
        </div>
        <span style="color: #3b82f6; font-size: 0.85rem; font-weight: bold;">Ver detalhes ➔</span>
    `;

    item.addEventListener("click", onClick);
    return item;
}

function criarBotaoExpandir(isExpandido, qtdRestante, onClick) {
    const btn = document.createElement("button");
    btn.style.cssText = `
        width: 100%;
        margin-top: 10px;
        background: #1e293b;
        border: 1px dashed #334155;
        color: #3b82f6;
        padding: 10px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 0.9rem;
        transition: background 0.2s;
    `;

    btn.textContent = isExpandido ? "▲ Mostrar menos" : `▼ Mostrar mais (+${qtdRestante})`;

    btn.onmouseover = () => btn.style.background = "#334155";
    btn.onmouseout = () => btn.style.background = "#1e293b";

    btn.addEventListener("click", onClick);
    return btn;
}

// ======================================================
// Modais de Detalhes (Time e Liga)
// ======================================================

function abrirModalDetalhesTime(time) {
    timeSelecionadoAtual = time;
    document.getElementById("detalheNomeTime").textContent = time.nome;
    document.getElementById("detalheLigaTime").textContent = time.liga || '-';
    document.getElementById("detalhePaisTime").textContent = time.pais || 'Não informado';
    document.getElementById("detalheNivelTime").textContent = time.nivel ?? time.forca ?? '-';
    document.getElementById("detalheIdTime").textContent = time.id;

    document.getElementById("modalDetalhesTime").classList.add("active");
}

function fecharModalDetalhesTime() {
    document.getElementById("modalDetalhesTime").classList.remove("active");
    timeSelecionadoAtual = null;
}

function abrirModalDetalhesLiga(liga) {
    ligaSelecionadaAtual = liga;
    document.getElementById("detalheNomeLiga").textContent = liga.nome;
    document.getElementById("detalhePaisLiga").textContent = liga.pais || 'Não informado';
    document.getElementById("detalheNivelLiga").textContent = liga.nivel ?? '-';
    document.getElementById("detalheIdLiga").textContent = liga.id;

    document.getElementById("modalDetalhesLiga").classList.add("active");
}

function fecharModalDetalhesLiga() {
    document.getElementById("modalDetalhesLiga").classList.remove("active");
    ligaSelecionadaAtual = null;
}

// ======================================================
// Inicialização de Eventos
// ======================================================

function inicializarEventos() {
    const btnLiga = document.getElementById("btnAdicionarLiga");
    const btnTime = document.getElementById("btnAdicionarTime");
    const btnMassa = document.getElementById("btnAdicionarTimesMassa");

    // Eventos Fechar Modais
    document.getElementById("btnFecharModalTime").addEventListener("click", fecharModalDetalhesTime);
    document.getElementById("btnFecharModalLiga").addEventListener("click", fecharModalDetalhesLiga);

    // Evento Excluir Time no Modal
    document.getElementById("btnExcluirTimeModal").addEventListener("click", async () => {
        if (!timeSelecionadoAtual) return;
        
        const confirmou = await mostrarConfirmacao(`Deseja remover o time "${timeSelecionadoAtual.nome}" do Firestore?`, "Remover Time");
        if (!confirmou) return;

        try {
            await removerTimeFirestore(timeSelecionadoAtual.id);
            fecharModalDetalhesTime();
            await mostrarNotificacao("Time removido com sucesso!");
            await carregarTimesGrid();
        } catch (e) {
            await mostrarNotificacao("Erro ao remover time.");
        }
    });

    // Evento Excluir Liga no Modal
    document.getElementById("btnExcluirLigaModal").addEventListener("click", async () => {
        if (!ligaSelecionadaAtual) return;
        
        const confirmou = await mostrarConfirmacao(`Deseja remover a liga "${ligaSelecionadaAtual.nome}" do Firestore?`, "Remover Liga");
        if (!confirmou) return;

        try {
            await removerLigaFirestore(ligaSelecionadaAtual.id);
            fecharModalDetalhesLiga();
            await mostrarNotificacao("Liga removida com sucesso!");
            await carregarLigasEGrid();
        } catch (e) {
            await mostrarNotificacao("Erro ao remover liga.");
        }
    });

    // Cadastro Individual de Liga
    if (btnLiga) {
        btnLiga.addEventListener("click", async () => {
            const nome = document.getElementById("nomeLiga").value.trim();
            const pais = document.getElementById("paisLiga").value.trim();
            const nivel = Number(document.getElementById("nivelLiga").value);

            if (!nome || !pais) {
                await mostrarNotificacao("Preencha os campos da liga.");
                return;
            }

            btnLiga.disabled = true;
            btnLiga.textContent = "Salvando...";

            try {
                await adicionarLigaFirestore({ nome, pais, nivel });
                document.getElementById("nomeLiga").value = "";
                document.getElementById("paisLiga").value = "";
                await mostrarNotificacao("Liga cadastrada com sucesso!");
                await carregarLigasEGrid();
            } catch (e) {
                await mostrarNotificacao("Erro ao salvar liga no Firestore.");
            } finally {
                btnLiga.disabled = false;
                btnLiga.textContent = "Adicionar Liga no Firestore";
            }
        });
    }

    // Cadastro Individual de Time
    if (btnTime) {
        btnTime.addEventListener("click", async () => {
            const nome = document.getElementById("nomeTime").value.trim();
            const liga = document.getElementById("ligaTime").value;
            const nivel = Number(document.getElementById("forcaTime").value);

            if (!nome || !liga) {
                await mostrarNotificacao("Preencha o nome do time e selecione uma liga.");
                return;
            }

            btnTime.disabled = true;
            btnTime.textContent = "Salvando...";

            try {
                await adicionarTimeFirestore({ nome, liga, nivel, pais: "" });
                document.getElementById("nomeTime").value = "";
                await mostrarNotificacao("Time cadastrado com sucesso!");
                await carregarTimesGrid();
            } catch (e) {
                await mostrarNotificacao("Erro ao salvar time no Firestore.");
            } finally {
                btnTime.disabled = false;
                btnTime.textContent = "Adicionar Time";
            }
        });
    }

    // Cadastro em Massa por Texto
    if (btnMassa) {
        btnMassa.addEventListener("click", async () => {
            const texto = document.getElementById("listaTimesTexto").value;

            const linhas = texto.split("\n")
                .map(linha => linha.trim())
                .filter(linha => linha.length > 0);

            if (linhas.length === 0) {
                await mostrarNotificacao("Cole pelo menos uma linha no formato: Nome, Liga, Nível, País");
                return;
            }

            const timesParaSalvar = [];
            const erros = [];

            linhas.forEach((linha, index) => {
                const partes = linha.split(",").map(p => p.trim());

                const nome = partes[0];
                const liga = partes[1];
                const nivel = Number(partes[2]);
                const pais = partes[3] || "";

                if (nome && liga && !isNaN(nivel)) {
                    timesParaSalvar.push({ nome, liga, nivel, pais });
                } else {
                    erros.push(`Linha ${index + 1}: "${linha}" (formato inválido)`);
                }
            });

            if (erros.length > 0) {
                await mostrarNotificacao(`Atenção: Algumas linhas foram ignoradas por erro de formatação:\n\n` + erros.join("\n"));
            }

            if (timesParaSalvar.length === 0) {
                await mostrarNotificacao("Nenhum time válido encontrado para salvar.");
                return;
            }

            btnMassa.disabled = true;
            btnMassa.textContent = `Salvando ${timesParaSalvar.length} times...`;

            try {
                await adicionarTimesEmMassaFirestore(timesParaSalvar);
                document.getElementById("listaTimesTexto").value = "";
                await mostrarNotificacao(`${timesParaSalvar.length} times cadastrados com sucesso!`);
                await carregarTimesGrid();
            } catch (e) {
                await mostrarNotificacao("Erro ao importar times em massa no Firestore.");
            } finally {
                btnMassa.disabled = false;
                btnMassa.textContent = "Importar Todos os Times no Firestore";
            }
        });
    }
}

// ======================================================
// Execução Inicial
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    inicializarEventos();
    carregarLigasEGrid();
    carregarTimesGrid();
});