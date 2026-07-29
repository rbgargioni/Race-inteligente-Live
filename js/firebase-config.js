// ======================================================
// Race Inteligente LIVE Cloud - Conexão Firebase & Firestore
// Nome do Arquivo: js/firebase-config.js
// ======================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc,
    writeBatch 
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Configuração do projeto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDT85191nH-5azrxRNlVXRjLhOpxa68dGs",
    authDomain: "race-inteligent.firebaseapp.com",
    projectId: "race-inteligent",
    storageBucket: "race-inteligent.firebasestorage.app",
    messagingSenderId: "958669552272",
    appId: "1:958669552272:web:3c76f9bbe54b1ffc9c3615",
    measurementId: "G-VYL3WXHL2E"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ======================================================
// Ligas (ri_ligas)
// ======================================================

export async function adicionarLigaFirestore(ligaData) {
    try {
        const docRef = await addDoc(collection(db, "ri_ligas"), ligaData);
        return docRef.id;
    } catch (e) {
        console.error("Erro ao adicionar liga no Firestore: ", e);
        throw e;
    }
}

export async function obterLigasFirestore() {
    try {
        const querySnapshot = await getDocs(collection(db, "ri_ligas"));
        const ligas = [];
        querySnapshot.forEach((doc) => {
            ligas.push({ id: doc.id, ...doc.data() });
        });
        return ligas;
    } catch (e) {
        console.error("Erro ao buscar ligas no Firestore: ", e);
        return [];
    }
}

export async function removerLigaFirestore(id) {
    try {
        await deleteDoc(doc(db, "ri_ligas", id));
    } catch (e) {
        console.error("Erro ao remover liga no Firestore: ", e);
        throw e;
    }
}

// ======================================================
// Análises e Bateria de Testes (ri_historico)
// ======================================================

// Salva uma lista/bateria de análises de uma só vez no Firestore
export async function exportarBateriaAnalisesFirestore(listaAnalises) {
    try {
        const batch = writeBatch(db);
        const colecaoRef = collection(db, "ri_historico");

        listaAnalises.forEach((item) => {
            const novoDocRef = doc(colecaoRef);
            batch.set(novoDocRef, {
                ...item,
                criadoEm: new Date()
            });
        });

        await batch.commit();
        console.log("Bateria de análises exportada com sucesso para o Firestore!");
    } catch (e) {
        console.error("Erro ao exportar bateria de análises: ", e);
        throw e;
    }
}

// Obtém o histórico completo salvo na nuvem
export async function obterHistoricoFirestore() {
    try {
        const querySnapshot = await getDocs(collection(db, "ri_historico"));
        const historico = [];
        querySnapshot.forEach((doc) => {
            historico.push({ id: doc.id, ...doc.data() });
        });
        return historico;
    } catch (e) {
        console.error("Erro ao carregar histórico do Firestore: ", e);
        return [];
    }
}

export { db };