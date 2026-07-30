// Cria a estrutura do modal caso não exista no DOM
function injetarModalDOM() {
    if (document.getElementById("riModalOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "riModalOverlay";
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
        <div class="modal-box">
            <div id="riModalTitle" class="modal-title">Aviso</div>
            <div id="riModalMessage" class="modal-message"></div>
            <div id="riModalActions" class="modal-actions"></div>
        </div>
    `;
    document.body.appendChild(overlay);
}

// Substituto para alert(...) -> Retorna Promise
export function mostrarNotificacao(mensagem, titulo = "Aviso") {
    return new Promise((resolve) => {
        injetarModalDOM();

        const overlay = document.getElementById("riModalOverlay");
        const elTitulo = document.getElementById("riModalTitle");
        const elMsg = document.getElementById("riModalMessage");
        const elAcoes = document.getElementById("riModalActions");

        elTitulo.textContent = titulo;
        elMsg.innerHTML = mensagem.replace(/\n/g, '<br>');

        elAcoes.innerHTML = `
            <button id="riModalBtnOk" class="btn-modal btn-modal-ok">OK</button>
        `;

        overlay.classList.add("active");

        document.getElementById("riModalBtnOk").onclick = () => {
            overlay.classList.remove("active");
            resolve(true);
        };
    });
}

// Substituto para confirm(...) -> Retorna Promise<boolean>
export function mostrarConfirmacao(mensagem, titulo = "Confirmar ação") {
    return new Promise((resolve) => {
        injetarModalDOM();

        const overlay = document.getElementById("riModalOverlay");
        const elTitulo = document.getElementById("riModalTitle");
        const elMsg = document.getElementById("riModalMessage");
        const elAcoes = document.getElementById("riModalActions");

        elTitulo.textContent = titulo;
        elMsg.innerHTML = mensagem.replace(/\n/g, '<br>');

        elAcoes.innerHTML = `
            <button id="riModalBtnCancel" class="btn-modal btn-modal-cancel">Cancelar</button>
            <button id="riModalBtnConfirm" class="btn-modal btn-modal-danger">Confirmar</button>
        `;

        overlay.classList.add("active");

        document.getElementById("riModalBtnCancel").onclick = () => {
            overlay.classList.remove("active");
            resolve(false);
        };

        document.getElementById("riModalBtnConfirm").onclick = () => {
            overlay.classList.remove("active");
            resolve(true);
        };
    });
}