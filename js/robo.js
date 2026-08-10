import { calcularIQP } from './app.js';
import { exportarBateriaAnalisesFirestore } from './firebase-config.js';

// Exemplo de integração com API externa de Futebol
async function buscarJogosAos65Minutos() {
    const API_URL = "https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all";
    
    // Substitua pela sua chave da API
    const response = await fetch(API_URL, {
        headers: {
            "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
            "x-rapidapi-key": "SUA_CHAVE_API_AQUI"
        }
    });

    const data = await response.json();
    const partidasValidas = [];

    data.response.forEach(partida => {
        const minuto = partida.fixture.status.elapsed;

        // Filtra apenas partidas na janela dos 65 minutos
        if (minuto >= 63 && minuto <= 67) {
            const dadosMapeados = extrairEstatisticas(partida);
            const analiseIQP = calcularIQP(dadosMapeados);

            // Filtra partidas com recomendação real de entrada
            if (analiseIQP.iqp >= 70) {
                partidasValidas.push({
                    partidaId: partida.fixture.id,
                    timeCasa: partida.teams.home.name,
                    timeVisitante: partida.teams.away.name,
                    liga: partida.league.name,
                    minuto: minuto,
                    iqp: analiseIQP.iqp,
                    classificacao: analiseIQP.classificacao,
                    selo: analiseIQP.seloEntrada,
                    probabilidadeSucesso: calcularProbabilidade(analiseIQP.iqp),
                    statusAposta: "PENDENTE"
                });
            }
        }
    });

    if (partidasValidas.length > 0) {
        // Exporta diretamente para o Firestore
        await exportarBateriaAnalisesFirestore(partidasValidas);
    }
}