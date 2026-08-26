// ======================================================
// Race Inteligente LIVE - Alertas via Telegram
// Nome do Arquivo: js/telegram-config.js
// ======================================================
//
// Como configurar (gratuito, sem custo):
// 1) No Telegram, fale com @BotFather e envie /newbot para criar seu bot.
//    Ele vai te dar um TOKEN parecido com "123456789:AAExemploDeToken".
// 2) Mande qualquer mensagem para o seu bot recém-criado (procure pelo
//    username que você escolheu, ex: @RaceInteligenteBot).
// 3) Abra no navegador: https://api.telegram.org/bot<SEU_TOKEN>/getUpdates
//    e copie o número em "chat":{"id": ...} — esse é o seu CHAT_ID.
// 4) Cole o TOKEN e o CHAT_ID nas constantes abaixo.
//
// Enquanto TELEGRAM_TOKEN estiver vazio, os alertas ficam desativados
// automaticamente (não quebra nada, só não envia).

const TELEGRAM_TOKEN = "";
const TELEGRAM_CHAT_ID = "";

export function telegramConfigurado() {
    return Boolean(TELEGRAM_TOKEN && TELEGRAM_CHAT_ID);
}

// Envia um alerta de texto simples para o Telegram.
// Nunca lança erro para quem chamou - uma falha aqui não pode
// impedir o fluxo principal (salvar a análise, etc.).
export async function enviarAlertaTelegram(mensagem) {
    if (!telegramConfigurado()) {
        console.warn("Telegram não configurado (veja js/telegram-config.js). Alerta não enviado.");
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        const resposta = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: mensagem,
                parse_mode: "HTML"
            })
        });

        const dados = await resposta.json();
        if (!dados.ok) {
            console.error("Telegram recusou o envio:", dados.description);
            return false;
        }
        return true;
    } catch (e) {
        console.error("Erro ao enviar alerta para o Telegram:", e);
        return false;
    }
}

// Monta a mensagem de alerta de uma análise (classificação + IQP) mantendo
// o texto padronizado em todas as telas que disparam alerta.
export function montarMensagemAnalise(dados) {
    const emojiClassificacao = {
        "PREMIUM": "🏆",
        "FORTE": "🚩",
        "MODERADA": "🟨"
    };
    const emoji = emojiClassificacao[dados.classificacao] || "⚪";

    return (
        `${emoji} <b>${dados.classificacao}</b> - Race Inteligente\n` +
        `<b>Jogo:</b> ${dados.jogo}\n` +
        `<b>Minuto:</b> ${dados.minuto}'\n` +
        `<b>IQP:</b> ${dados.iqp}\n` +
        `<b>Odd:</b> ${dados.odd || "-"}`
    );
}
