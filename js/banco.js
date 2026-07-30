import { 
    adicionarLigaFirestore, 
    obterLigasFirestore, 
    removerLigaFirestore,
    adicionarTimeFirestore,
    obterTimesFirestore,
    removerTimeFirestore,
    adicionarTimesEmMassaFirestore
} from './firebase-config.js';

// ======================================================
// Funções Globais (para clique nos botões dos Cards)
// ======================================================

window.removerLigaNuvem = async function(id) {
    if (!confirm("Deseja remover esta liga do Firestore?")) return;
    try {
        await removerLigaFirestore(id);
        await carregarLigasEGrid();
    } catch (e) {
        alert("Erro ao remover liga.");
    }
};

window.removerTimeNuvem = async function(id) {
    if (!confirm("Deseja remover este time do Firestore?")) return;
    try {
        await removerTimeFirestore(id);
        await carregarTimesGrid();
    } catch (e) {
        alert("Erro ao remover time.");
    }
};

// ======================================================
// Renderização das Ligas no Select e na Grid
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

        lista.innerHTML = "";

        ligas.forEach((liga) => {
            // Preenche o Select de times
            const option = document.createElement("option");
            option.value = liga.nome;
            option.textContent = liga.nome;
            select.appendChild(option);

            // Cria o Card da Liga
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <h3>${liga.nome}</h3>
                <p><strong>País:</strong> ${liga.pais || '-'}</p>
                <p><strong>Nível:</strong> ${liga.nivel || '-'}</p>
                <button class="btn-danger" onclick="window.removerLigaNuvem('${liga.id}')">
                    Remover
                </button>
            `;
            lista.appendChild(card);
        });
    } catch (e) {
        console.error("Erro ao carregar ligas:", e);
        lista.innerHTML = "<p style='color:#ef4444'>Erro ao carregar ligas do banco.</p>";
    }
}

// ======================================================
// Renderização dos Times na Grid
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

        lista.innerHTML = "";

        times.forEach((time) => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <h3>${time.nome}</h3>
                <p><strong>Liga:</strong> ${time.liga}</p>
                <p><strong>País:</strong> ${time.pais || '-'}</p>
                <p><strong>Nível:</strong> ${time.nivel ?? time.forca ?? '-'}</p>
                <button class="btn-danger" onclick="window.removerTimeNuvem('${time.id}')">
                    Remover
                </button>
            `;
            lista.appendChild(card);
        });
    } catch (e) {
        console.error("Erro ao carregar times:", e);
        lista.innerHTML = "<p style='color:#ef4444'>Erro ao carregar times do banco.</p>";
    }
}

// ======================================================
// Inicialização de Eventos
// ======================================================

function inicializarEventos() {
    const btnLiga = document.getElementById("btnAdicionarLiga");
    const btnTime = document.getElementById("btnAdicionarTime");
    const btnMassa = document.getElementById("btnAdicionarTimesMassa");

    // Cadastro Individual de Liga
    if (btnLiga) {
        btnLiga.addEventListener("click", async () => {
            const nome = document.getElementById("nomeLiga").value.trim();
            const pais = document.getElementById("paisLiga").value.trim();
            const nivel = Number(document.getElementById("nivelLiga").value);

            if (!nome || !pais) {
                alert("Preencha os campos da liga.");
                return;
            }

            btnLiga.disabled = true;
            btnLiga.textContent = "Salvando...";

            try {
                await adicionarLigaFirestore({ nome, pais, nivel });
                document.getElementById("nomeLiga").value = "";
                document.getElementById("paisLiga").value = "";
                alert("Liga cadastrada com sucesso no Firestore!");
                await carregarLigasEGrid();
            } catch (e) {
                alert("Erro ao salvar liga no Firestore.");
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
                alert("Preencha o nome do time e selecione uma liga.");
                return;
            }

            btnTime.disabled = true;
            btnTime.textContent = "Salvando...";

            try {
                await adicionarTimeFirestore({ 
                    nome, 
                    liga, 
                    nivel,
                    pais: "" 
                });
                document.getElementById("nomeTime").value = "";
                alert("Time cadastrado com sucesso no Firestore!");
                await carregarTimesGrid();
            } catch (e) {
                alert("Erro ao salvar time no Firestore.");
            } finally {
                btnTime.disabled = false;
                btnTime.textContent = "Adicionar Time";
            }
        });
    }

    // Cadastro em Massa por Texto (Formato: Nome, Liga, Nível, País)
    if (btnMassa) {
        btnMassa.addEventListener("click", async () => {
            const texto = document.getElementById("listaTimesTexto").value;

            const linhas = texto.split("\n")
                .map(linha => linha.trim())
                .filter(linha => linha.length > 0);

            if (linhas.length === 0) {
                alert("Cole pelo menos uma linha no formato: Nome, Liga, Nível, País");
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
                    timesParaSalvar.push({
                        nome: nome,
                        liga: liga,
                        nivel: nivel,
                        pais: pais
                    });
                } else {
                    erros.push(`Linha ${index + 1}: "${linha}" (formato inválido)`);
                }
            });

            if (erros.length > 0) {
                alert(`Atenção: Algumas linhas foram ignoradas por erro de formatação:\n\n` + erros.join("\n"));
            }

            if (timesParaSalvar.length === 0) {
                alert("Nenhum time válido encontrado para salvar.");
                return;
            }

            btnMassa.disabled = true;
            btnMassa.textContent = `Salvando ${timesParaSalvar.length} times...`;

            try {
                await adicionarTimesEmMassaFirestore(timesParaSalvar);
                document.getElementById("listaTimesTexto").value = "";
                alert(`${timesParaSalvar.length} times cadastrados com sucesso no Firestore!`);
                await carregarTimesGrid();
            } catch (e) {
                alert("Erro ao importar times em massa no Firestore.");
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